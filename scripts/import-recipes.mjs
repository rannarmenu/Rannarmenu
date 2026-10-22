#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { extname, resolve, basename } from 'node:path';
import process from 'node:process';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import { normalizeRecipeRecord } from '../src/lib/recipeImport.js';

try { process.loadEnvFile(); } catch (e) { if (e?.code !== 'ENOENT') throw e; }
const args=process.argv.slice(2);
const input=args.find(x=>!x.startsWith('--'));
const publish=args.includes('--publish');
const updateExisting=args.includes('--update-existing');
const sourcePos=args.indexOf('--source');
const sourceName=sourcePos>=0?args[sourcePos+1]:null;
function fail(message){console.error('\n❌ '+message+'\nUsage: npm run import:recipes -- <file.csv|file.json> [--publish] [--update-existing] [--source "licensed source"]');process.exit(1);}
const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!input)fail('CSV বা JSON file path দিন।');
if(!url||!key)fail('SUPABASE_URL এবং server-only SUPABASE_SECRET_KEY দরকার।');
if(key.startsWith('sb_publishable_'))fail('Privileged import-এর জন্য publishable key ব্যবহার করা যাবে না।');
const path=resolve(input),buffer=await readFile(path);
if(buffer.byteLength>50*1024*1024)fail('ফাইল ৫০ MB-এর বেশি।');
let raw;
if(extname(path).toLowerCase()==='.json'){let d;try{d=JSON.parse(buffer.toString('utf8'))}catch(e){fail('JSON parse error: '+e.message)}raw=Array.isArray(d)?d:d?.recipes??d?.data;if(!Array.isArray(raw))fail('JSON array অথবা {"recipes": [...]} format দরকার।');}
else if(extname(path).toLowerCase()==='.csv'){const parsed=Papa.parse(buffer.toString('utf8'),{header:true,skipEmptyLines:'greedy',transformHeader:h=>h.trim().toLowerCase().replace(/[\s-]+/g,'_')});if(parsed.errors.length)fail('CSV parse error: '+parsed.errors.slice(0,3).map(e=>e.message).join('; '));raw=parsed.data;}
else fail('শুধু CSV / JSON ফাইল সাপোর্ট করা হয়।');
if(!raw.length||raw.length>10000)fail('প্রতি run-এ ১–১০,০০০ রেকর্ড প্রয়োজন।');
const records=new Map(),errors=[];
raw.forEach((row,i)=>{const r=normalizeRecipeRecord(row);if(r.error)errors.push({row:i+2,error:r.error});else if(records.has(r.recipe.slug))errors.push({row:i+2,error:'Duplicate slug: '+r.recipe.slug});else records.set(r.recipe.slug,r.recipe);});
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:batch,error:batchError}=await client.from('recipe_import_batches').insert({file_name:basename(path),source_name:sourceName,status:'running',records_read:raw.length,valid_records:records.size,report:{validation_errors:errors.slice(0,200)}}).select('id').single();
if(batchError)fail('Import audit log could not be created: '+batchError.message);
let inserted=0,failed=errors.length;
try{
 const list=[...records.values()];
 for(let i=0;i<list.length;i+=100){
  const rows=list.slice(i,i+100).map(r=>({...r,is_published:publish,source_name:r.source_name||sourceName,created_by:null,updated_by:null,published_at:publish?new Date().toISOString():null}));
  let operation;
  if(updateExisting) operation=await client.from('recipes').upsert(rows,{onConflict:'slug'});
  else {
   const {data:old,error:e}=await client.from('recipes').select('slug').in('slug',rows.map(r=>r.slug));
   if(e){failed+=rows.length;errors.push({row:i+2,error:e.message});continue;}
   const have=new Set((old||[]).map(r=>r.slug));
   const fresh=rows.filter(r=>!have.has(r.slug));failed+=rows.length-fresh.length;
   operation=fresh.length?await client.from('recipes').insert(fresh):{error:null};
   if(fresh.length<rows.length)errors.push({row:i+2,error:'Existing slug skipped: '+(rows.length-fresh.length)});
   if(!operation.error)inserted+=fresh.length;else{failed+=fresh.length;errors.push({row:i+2,error:operation.error.message});}
   continue;
  }
  if(operation.error){failed+=rows.length;errors.push({row:i+2,error:operation.error.message});}else inserted+=rows.length;
 }
 const report={records_read:raw.length,valid_records:records.size,upserted_records:inserted,error_records:failed,errors:errors.slice(0,200)};
 const {error:e}=await client.from('recipe_import_batches').update({...report,report,status:failed?'completed_with_errors':'completed',completed_at:new Date().toISOString()}).eq('id',batch.id);
 if(e)console.error('Warning: import finished but audit update failed: '+e.message);
 console.log(JSON.stringify(report,null,2));if(failed)process.exitCode=2;
}catch(e){await client.from('recipe_import_batches').update({status:'failed',report:{errors:errors.slice(0,200),fatal:e.message},completed_at:new Date().toISOString()}).eq('id',batch.id);throw e;}
