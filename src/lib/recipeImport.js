import Papa from 'papaparse';

const first = (row, names) => {
  for (const name of names) {
    const key = name.toLowerCase().replace(/[\s-]+/g, '_');
    const value = row?.[key] ?? row?.[name] ?? row?.[name.toUpperCase()];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
};
function parseList(value) {
  if (Array.isArray(value)) return value.map(x => typeof x === 'string' ? x.trim() : String(x?.name ?? x?.text ?? x?.step ?? '')).filter(Boolean);
  const input = String(value ?? '').trim();
  if (!input) return [];
  try { const parsed = JSON.parse(input); if (Array.isArray(parsed)) return parseList(parsed); } catch {}
  const sep = input.includes('\n') ? /\r?\n/ : input.includes('|') ? /\s*\|\s*/ : input.includes(';') ? /\s*;\s*/ : null;
  return (sep ? input.split(sep) : [input]).map(x => x.trim()).filter(Boolean);
}
const minutes = v => { const n=Number(String(v??'').trim()); return Number.isFinite(n)&&n>=0&&n<=1440?Math.round(n):0; };
export function slugify(value) {
  return String(value??'').normalize('NFKC').toLocaleLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,200);
}
export function recipeTitleKey(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ').trim();
}

export async function loadExistingRecipeIndex(client, pageSize = 1000) {
  const titles = new Map();
  const slugs = new Set();
  const titleBySlug = new Map();
  let offset = 0;
  while (true) {
    const { data, error } = await client.from('recipes').select('slug,title')
      .order('slug', { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw new Error('বর্তমান রেসিপির তালিকা যাচাই করা যায়নি: ' + error.message);
    const rows = data || [];
    for (const row of rows) {
      if (row.slug) slugs.add(row.slug);
      const key = recipeTitleKey(row.title);
      if (key && !titles.has(key)) titles.set(key, row.slug);
      if (row.slug) titleBySlug.set(row.slug, key);
    }
    if (rows.length < pageSize) break;
    offset += rows.length;
    if (offset > 1000000) throw new Error('রেসিপির তালিকা অস্বাভাবিক বড়; import বন্ধ করা হয়েছে।');
  }
  return { titles, slugs, titleBySlug };
}

export function rememberRecipe(index, recipe) {
  const key = recipeTitleKey(recipe.title);
  const oldKey = index.titleBySlug.get(recipe.slug);
  if (oldKey && index.titles.get(oldKey) === recipe.slug && oldKey !== key) index.titles.delete(oldKey);
  if (key) index.titles.set(key, recipe.slug);
  index.slugs.add(recipe.slug);
  index.titleBySlug.set(recipe.slug, key);
}

export function normalizeRecipeRecord(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return {error:'রেকর্ডটি একটি object বা CSV row হতে হবে।'};
  const title=String(first(row,['title','name','recipe_title','রেসিপির_নাম','রেসিপি'])||'').trim();
  if(title.length<2||title.length>180)return {error:'title/name ২–১৮০ অক্ষরের মধ্যে হতে হবে।'};
  const ingredients=parseList(first(row,['ingredients','ingredient_list','উপকরণ']));
  const instructions=parseList(first(row,['instructions','steps','method','directions','রান্নার_পদ্ধতি','ধাপ']));
  if(!ingredients.length)return {error:'ingredients/উপকরণ খালি।'};
  if(!instructions.length)return {error:'instructions/steps খালি।'};
  const difficultyRaw=String(first(row,['difficulty','level','কঠিনতা'])||'easy').trim().toLowerCase();
  const difficulty=/^(medium|moderate|মাঝারি)$/.test(difficultyRaw)?'medium':/^(hard|difficult|কঠিন)$/.test(difficultyRaw)?'hard':'easy';
  const image=String(first(row,['image_url','image','photo_url','ছবি'])||'').trim();
  const sourceUrl=String(first(row,['source_url','source','url','উৎস'])||'').trim();
  if(image&&!/^https:\/\//i.test(image))return {error:'image_url অবশ্যই https:// দিয়ে শুরু হতে হবে।'};
  if(sourceUrl&&!/^https:\/\//i.test(sourceUrl))return {error:'source_url অবশ্যই https:// দিয়ে শুরু হতে হবে।'};
  const titleSlug=slugify(first(row,['slug','permalink'])||title);
  const slug=(titleSlug||'recipe-'+title.length).slice(0,220);
  const servingsN=Number(first(row,['servings','yield','পরিবেশন'])||2);
  const tags=parseList(first(row,['tags','tag','ট্যাগ']));
  return {recipe:{
    slug,title,summary:String(first(row,['summary','description','desc','বর্ণনা'])||'').trim().slice(0,1200),
    category:String(first(row,['category','meal_type','বিভাগ'])||'অন্যান্য').trim().slice(0,80),
    cuisine:String(first(row,['cuisine','কুইজিন'])||'বাংলাদেশি').trim().slice(0,80),
    ingredients,instructions,prep_minutes:minutes(first(row,['prep_minutes','prep_time','prep','প্রস্তুতি_মিনিট'])),
    cook_minutes:minutes(first(row,['cook_minutes','cook_time','cooking_time','রান্নার_মিনিট'])),
    servings:Number.isInteger(servingsN)&&servingsN>=1&&servingsN<=100?servingsN:2,difficulty,
    image_url:image||null,tags,source_name:String(first(row,['source_name','publisher','প্রকাশক'])||'').trim()||null,
    source_url:sourceUrl||null,source_license:String(first(row,['source_license','license','licence','লাইসেন্স'])||'').trim()||null,
    source_attribution:String(first(row,['source_attribution','attribution','credit','কৃতিত্ব'])||'').trim()||null
  }};
}
export async function parseRecipeFile(file) {
  if(!file)throw new Error('একটি CSV বা JSON ফাইল বেছে নিন।');
  if(file.size>25*1024*1024)throw new Error('ফাইল ২৫ MB-এর বেশি। কয়েকটি batch ব্যবহার করুন।');
  const text=await file.text(),name=file.name.toLowerCase();
  if(name.endsWith('.json')||file.type.includes('json')) {
    let data;try{data=JSON.parse(text)}catch(e){throw new Error('JSON parse error: '+e.message)}
    const rows=Array.isArray(data)?data:data?.recipes??data?.data;
    if(!Array.isArray(rows))throw new Error('JSON array অথবা {"recipes": [...]} format লাগবে।');
    return rows;
  }
  if(!name.endsWith('.csv')&&!file.type.includes('csv'))throw new Error('শুধু CSV বা JSON ফাইল সাপোর্ট করা হয়।');
  const parsed=Papa.parse(text,{header:true,skipEmptyLines:'greedy',transformHeader:h=>h.trim().toLowerCase().replace(/[\s-]+/g,'_')});
  if(parsed.errors.some(e=>e.type==='Quotes'||e.type==='Delimiter'))throw new Error('CSV format error: '+parsed.errors[0].message);
  return parsed.data;
}
