import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Heart, Clock3, ChefHat, ArrowUpRight, Leaf, Bookmark, Sparkles, Utensils, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import './styles.css';
import AdminApp from './admin.jsx';
import MiraChat from './MiraChat.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './theme.css';
import './multipage-navigation.css';
import BottomNavigation from './BottomNavigation.jsx';
import AboutPage from './AboutPage.jsx';
import RecipeReviews from './RecipeReviews.jsx';
import { supabase, supabaseConfigured } from './lib/supabaseClient.js';
import { buildRecipeSearchGroups, recipeMatchesSearch } from './lib/recipeSearch.js';
import { getPhotoFallbackUrls, isDishSpecificPhotoTitle } from './lib/recipeImages.js';

const demos = [
 {id:'demo-biryani',slug:'ghoroya-chicken-biryani',title:'ঘরোয়া চিকেন বিরিয়ানি',category:'মাংস',time:55,level:'মাঝারি',tag:'সবার প্রিয়',image:null,desc:'সুগন্ধি চাল, মসলা আর নরম মুরগির মজাদার আয়োজন।',ingredients:['বাসমতি চাল ২ কাপ','মুরগি ৫০০ গ্রাম','পেঁয়াজ ২টি','টক দই ½ কাপ','বিরিয়ানি মসলা ২ টেবিল চামচ'],steps:['চাল ধুয়ে ২০ মিনিট ভিজিয়ে রাখুন।','মুরগি দই, মসলা ও পেঁয়াজ দিয়ে মাখিয়ে রান্না করুন।','আধা সেদ্ধ চাল ও মুরগি স্তরে স্তরে সাজিয়ে দমে রাখুন।']},
 {id:'demo-fish',slug:'bangla-fish-curry',title:'বাংলা স্টাইলে মাছের ঝোল',category:'মাছ',time:35,level:'সহজ',tag:'ঘরোয়া',image:null,desc:'আলু, টমেটো আর হালকা মসলায় প্রতিদিনের পরিচিত স্বাদ।',ingredients:['রুই মাছ ৪ টুকরা','আলু ২টি','টমেটো ১টি','হলুদ ও মরিচ গুঁড়া','সরিষার তেল'],steps:['মাছ হলুদ-লবণ মেখে হালকা ভেজে নিন।','আলু ও মসলা কষিয়ে পানি দিন।','মাছ দিয়ে ১০–১২ মিনিট ঢেকে রান্না করুন।']},
 {id:'demo-egg',slug:'quick-egg-curry',title:'ঝটপট ডিমের কারি',category:'ডিম',time:25,level:'সহজ',tag:'৩০ মিনিটের কম',image:null,desc:'কম উপকরণে তৈরি ঝালঝাল ডিমের তরকারি।',ingredients:['ডিম ৪টি','পেঁয়াজ ১টি','আদা-রসুন বাটা','টমেটো ১টি','জিরা ও ধনে গুঁড়া'],steps:['ডিম সেদ্ধ করে খোসা ছাড়িয়ে হালকা ভেজে নিন।','পেঁয়াজ, আদা-রসুন ও মসলা কষান।','ডিম ও পানি দিয়ে ৮ মিনিট রান্না করুন।']},
 {id:'demo-khichuri',slug:'vegetable-khichuri',title:'সবজি খিচুড়ি',category:'নিরামিষ',time:40,level:'সহজ',tag:'আরামদায়ক',image:null,desc:'ডাল, চাল ও মৌসুমি সবজিতে পুষ্টিকর এক বাটি খাবার।',ingredients:['চাল ১ কাপ','মুগ ডাল ½ কাপ','গাজর ও মটরশুঁটি','আদা কুচি','ঘি ১ চা চামচ'],steps:['ডাল শুকনো কড়াইয়ে হালকা ভেজে ধুয়ে নিন।','চাল, ডাল ও সবজি মসলা দিয়ে কষান।','পানি দিয়ে নরম হওয়া পর্যন্ত ঢেকে রান্না করুন।']},
 {id:'demo-dal',slug:'raw-mango-dal',title:'কাঁচা আমের ডাল',category:'নিরামিষ',time:30,level:'সহজ',tag:'মৌসুমি',image:null,desc:'টক-মিষ্টি স্বাদের সহজ ডাল, ভাতের সঙ্গে দারুণ।',ingredients:['মসুর ডাল ১ কাপ','কাঁচা আম ½টি','হলুদ','শুকনা মরিচ','পাঁচফোড়ন'],steps:['ডাল হলুদ ও পানি দিয়ে সেদ্ধ করুন।','কাঁচা আমের টুকরা দিয়ে নরম করুন।','পাঁচফোড়ন ও শুকনা মরিচের ফোড়ন দিন।']},
 {id:'demo-chicken',slug:'chicken-kosha',title:'চিকেন কষা',category:'মাংস',time:50,level:'মাঝারি',tag:'ঝালপ্রেমীদের জন্য',image:null,desc:'ঘন মসলার গ্রেভিতে রান্না করা জমজমাট মুরগির পদ।',ingredients:['মুরগি ৫০০ গ্রাম','পেঁয়াজ ৩টি','টক দই ¼ কাপ','আদা-রসুন বাটা','গরম মসলা'],steps:['মুরগি দই ও মসলা দিয়ে মেরিনেট করুন।','পেঁয়াজ বাদামি করে ভেজে মুরগি দিন।','কম আঁচে তেল ছাড়ানো পর্যন্ত কষিয়ে নিন।']}
];
const categories = ['সব রেসিপি','মাছ','মাংস','ডিম','নিরামিষ'];
const PAGE_SIZE = 24;
const ROUTABLE_PAGES = ['home', 'recipes', 'categories', 'saved', 'about'];
function routeFromHash(hash = window.location.hash) {
 const raw=String(hash||'');
 const path=raw.startsWith('#/')?raw.slice(2):raw.startsWith('#')?raw.slice(1):raw;
 const parts = path.split('/').filter(Boolean).map(part => {
  try { return decodeURIComponent(part); } catch { return part; }
 });
 const requested = parts[0] || 'home';
 if (requested === 'recipe') return {page:'recipe',slug:parts.slice(1).join('/')};
 if (requested === 'about') return {page:'about',slug:parts.slice(1).join('/')};
 return {page:ROUTABLE_PAGES.includes(requested)?requested:'home',slug:''};
}
function dbRecipeToCard(row) {
 const ingredients = Array.isArray(row.ingredients) ? row.ingredients.map(x => typeof x === 'string' ? x : x?.name || x?.text || '').filter(Boolean) : [];
 const steps = Array.isArray(row.instructions) ? row.instructions.map(x => typeof x === 'string' ? x : x?.text || x?.step || '').filter(Boolean) : [];
 return {...row,time:(Number(row.prep_minutes)||0)+(Number(row.cook_minutes)||0),level:row.difficulty==='hard'?'কঠিন':row.difficulty==='medium'?'মাঝারি':'সহজ',tag:Array.isArray(row.tags)&&row.tags[0]?row.tags[0]:row.category,image:row.image_url&&row.image_source_url&&row.image_credit&&row.image_license?row.image_url:null,desc:row.summary||'',ingredients,steps};
}
const imageLicenseLinks = {
 'CC BY-SA 4.0':'https://creativecommons.org/licenses/by-sa/4.0/',
 'CC BY-SA 3.0':'https://creativecommons.org/licenses/by-sa/3.0/',
 'CC BY 4.0':'https://creativecommons.org/licenses/by/4.0/',
 'CC BY 3.0':'https://creativecommons.org/licenses/by/3.0/',
 'CC BY 2.0':'https://creativecommons.org/licenses/by/2.0/',
 'CC0':'https://creativecommons.org/publicdomain/zero/1.0/'
};
function imageLicenseHref(license) {
 const exact=imageLicenseLinks[String(license||'').trim()];
 if(exact)return exact;
 if(/public domain|\bPD[- ]/i.test(license||''))return 'https://commons.wikimedia.org/wiki/Commons:Licensing';
 return 'https://creativecommons.org/share-your-work/cclicenses/';
}
function handleDishImageError(event) {
 const img = event.currentTarget;
 const originalUrl = img.dataset.originalImageUrl || img.src;
 const fallbacks = getPhotoFallbackUrls(originalUrl, img.dataset.sourceUrl || '');
 const fallbackIndex = Number(img.dataset.fallbackIndex || 0);
 if (fallbackIndex < fallbacks.length) {
  img.dataset.fallbackIndex = String(fallbackIndex + 1);
  img.src = fallbacks[fallbackIndex];
  return;
 }
 img.style.display = 'none';
 const placeholder = img.parentElement?.querySelector('.image-error-placeholder');
 if (placeholder) placeholder.style.display = 'flex';
 const cardCredit = img.closest('.recipe-card')?.querySelector('.card-image-credit');
 if (cardCredit) cardCredit.style.display = 'none';
 const detailCredit = img.closest('.recipe-detail')?.querySelector('.image-credit');
 if (detailCredit) detailCredit.style.display = 'none';
}
function FeaturedRecipeCarousel({ recipes, activeIndex, onSelect, onPrevious, onNext, onSelectIndex, paused, onTogglePause, loading, error }) {
 const recipe=recipes[activeIndex]||recipes[0]||null;
 const verifiedPhoto=Boolean(recipe?.image&&isDishSpecificPhotoTitle(recipe));
 const touchStartX=useRef(null);
 const handleTouchStart=event=>{touchStartX.current=event.touches?.[0]?.clientX??null;};
 const handleTouchEnd=event=>{
  const startX=touchStartX.current;
  const endX=event.changedTouches?.[0]?.clientX;
  touchStartX.current=null;
  if(typeof startX!=='number'||typeof endX!=='number')return;
  const delta=endX-startX;
  if(delta>48)onPrevious();
  else if(delta< -48)onNext();
 };
 const handleKeyDown=event=>{
  if(event.key==='ArrowLeft'){event.preventDefault();onPrevious();}
  else if(event.key==='ArrowRight'){event.preventDefault();onNext();}
 };
 const counter=String(Math.min(activeIndex+1,Math.max(recipes.length,1))).padStart(2,'0');
 const total=String(recipes.length).padStart(2,'0');
 return <div className="hero-visual" role="region" aria-roledescription="carousel" aria-label="ট্রেন্ডিং ও সদ্য প্রকাশিত রেসিপি" tabIndex={0} onKeyDown={handleKeyDown} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
  {recipe?<div className="featured-slide" key={recipe.id||recipe.slug||recipe.title}>
   {verifiedPhoto?<><img className="featured-image" src={recipe.image} alt={recipe.title} data-original-image-url={recipe.image} data-source-url={recipe.image_source_url} loading={activeIndex===0?'eager':'lazy'} onError={handleDishImageError}/><div className="featured-image-placeholder image-error-placeholder" role="img" aria-label={recipe.title+"-এর ছবিটি লোড হয়নি"}><ChefHat size={42}/><span>ছবিটি লোড হয়নি</span></div></>:<div className="featured-image-placeholder" role="img" aria-label={recipe.title+"-এর নির্ভরযোগ্য ছবি যাচাই করা হচ্ছে"}><span className="featured-placeholder-orbit orbit-one"/><span className="featured-placeholder-orbit orbit-two"/><span className="featured-placeholder-mark"><ChefHat size={46} strokeWidth={1.15}/></span><span className="featured-placeholder-title">{recipe.title}</span><small>এই রেসিপির সঠিক ছবি যাচাই করা হচ্ছে</small></div>}
   <div className="featured-overlay">
    <div className="featured-eyebrow"><span className="featured-live-dot"/>{recipe.category||'ঘরোয়া রান্না'} <span className="featured-eyebrow-divider"/> <span>নতুন রেসিপি</span></div>
    <h2>{recipe.title}</h2>
    <p>{recipe.desc||'পরিচিত উপকরণে ধাপে ধাপে শিখুন এই ঘরোয়া রেসিপি।'}</p>
    <div className="featured-meta"><span><Clock3 size={15}/>{recipe.time>0?recipe.time+' মিনিট':'সহজ ধাপ'}</span><span><ChefHat size={15}/>{recipe.level||'ঘরোয়া স্বাদ'}</span></div>
    <button type="button" className="featured-cta" onClick={()=>onSelect(verifiedPhoto?recipe:{...recipe,image:null})}>রেসিপি দেখুন <ArrowUpRight size={16}/></button>
    {verifiedPhoto&&recipe.image_credit&&recipe.image_source_url&&recipe.image_license&&<div className="featured-credit">ছবি: <a href={recipe.image_source_url} target="_blank" rel="noopener noreferrer">{recipe.image_credit}</a><span>·</span><a href={imageLicenseHref(recipe.image_license)} target="_blank" rel="noopener noreferrer">{recipe.image_license}</a></div>}
   </div>
  </div>:<div className="featured-empty">
   <span className="featured-empty-eyebrow"><Sparkles size={14}/> FROM OUR KITCHEN</span>
   <div className="featured-empty-icon"><ChefHat size={43} strokeWidth={1.15}/></div>
   <h2>{loading?'নতুন রেসিপি আসছে…':error?'রেসিপি লোড করা যায়নি':'নতুন স্বাদের অপেক্ষায়'}</h2>
   <p>{loading?'সদ্য প্রকাশিত রেসিপি নিয়ে আসছি।':error?'সংযোগে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।':'নতুন রেসিপি প্রকাশ হলেই এখানে দেখা যাবে।'}</p>
  </div>}
  <div className="featured-topbar">
   <div className="featured-brand-lockup"><span className="featured-brand-icon"><ChefHat size={17}/></span><span className="featured-brand-copy"><strong>TRENDING RECIPES</strong><small>সদ্য প্রকাশিত রান্নার গল্প</small></span></div>
   <div className="featured-top-actions">{recipe&&<span className="featured-count"><strong>{counter}</strong><i>/</i>{total}</span>}{recipes.length>1&&<button type="button" className="featured-pause" onClick={onTogglePause} aria-label={paused?'স্বয়ংক্রিয় স্লাইড চালু করুন':'স্বয়ংক্রিয় স্লাইড থামান'} title={paused?'চালু করুন':'স্লাইড থামান'}>{paused?<Play size={14}/>:<Pause size={14}/>}</button>}</div>
  </div>
  {recipes.length>1&&<div className="featured-controls"><button type="button" className="featured-arrow" onClick={onPrevious} aria-label="আগের রেসিপি"><ChevronLeft size={19}/></button><div className="featured-dots" role="group" aria-label="রেসিপি স্লাইড নির্বাচন">{recipes.map((item,index)=><button key={item.id||item.slug||item.title} type="button" className={index===activeIndex?'featured-dot active':'featured-dot'} onClick={()=>onSelectIndex(index)} aria-label={'স্লাইড '+(index+1)+': '+item.title} aria-current={index===activeIndex?'true':undefined}/>)}</div><button type="button" className="featured-arrow" onClick={onNext} aria-label="পরের রেসিপি"><ChevronRight size={19}/></button></div>}
  {recipes.length>1&&<div className="featured-progress" aria-hidden="true"><span key={activeIndex+'-'+(paused?'paused':'playing')} className={paused?'is-paused':''}/></div>}
 </div>;
}
function App() {
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('সব রেসিপি');
 const [route,setRoute]=useState(()=>routeFromHash());
 const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem('rannar-menu-saved')||'[]')}catch{return[]}});
 const [showSaved,setShowSaved]=useState(false);
 const [selected,setSelected]=useState(null);
 const [catalogRecipes,setCatalogRecipes]=useState(demos);
 const [catalogMode,setCatalogMode]=useState(false);
 const [catalogBusy,setCatalogBusy]=useState(false);
 const [catalogTotal,setCatalogTotal]=useState(demos.length);
 const [catalogPage,setCatalogPage]=useState(0);
 const [dbCategories,setDbCategories]=useState([]);
 const [catalogError,setCatalogError]=useState('');
 const [featuredRecipes,setFeaturedRecipes]=useState(supabaseConfigured?[]:demos);
 const [featuredIndex,setFeaturedIndex]=useState(0);
 const [featuredLoading,setFeaturedLoading]=useState(supabaseConfigured);
 const [featuredError,setFeaturedError]=useState(false);
 const [featuredPaused,setFeaturedPaused]=useState(false);
 useEffect(()=>{try{localStorage.setItem('rannar-menu-saved',JSON.stringify(saved))}catch{}},[saved]);
 useEffect(()=>{
  const syncRoute=()=>setRoute(routeFromHash());
  window.addEventListener('hashchange',syncRoute);
  return ()=>window.removeEventListener('hashchange',syncRoute);
 },[]);
 useEffect(()=>{
  setShowSaved(route.page==='saved');
  if(route.page!=='recipe')setSelected(null);
  if(route.page==='saved'||route.page==='home'||route.page==='recipes')setCatalogPage(0);
  if(route.page==='home'){setCategory('সব রেসিপি');setQuery('');}
  if(route.page==='categories')setQuery('');
  window.scrollTo({top:0,behavior:'smooth'});
 },[route.page]);
 useEffect(()=>{
  if(route.page!=='recipe'||!route.slug)return;
  const known=[...demos,...catalogRecipes,...featuredRecipes].find(item=>String(item.slug||item.id)===route.slug);
  if(known){setSelected(current=>current?.id===known.id?current:known);return;}
  if(!supabaseConfigured){setSelected(null);return;}
  let alive=true;
  supabase.from('recipes').select('*').eq('slug',route.slug).eq('is_published',true).maybeSingle().then(({data,error})=>{
   if(!alive)return;
   if(data&&!error)setSelected(dbRecipeToCard(data));else setSelected(null);
  });
  return ()=>{alive=false;};
 },[route.page,route.slug,catalogRecipes,featuredRecipes]);
 useEffect(()=>{
  if(!selected)return;
  const target=document.querySelector('#recipes');
  if(!target)return;
  const frame=window.requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));
  return ()=>window.cancelAnimationFrame(frame);
 },[selected]);
 useEffect(()=>{
  if(!supabaseConfigured){setFeaturedRecipes(demos);setFeaturedLoading(false);return;}
  let alive=true;
  const loadFeatured=async()=>{
   try{
    const {data,error}=await supabase.from('recipes').select('*').eq('is_published',true).order('published_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).limit(6);
    if(!alive)return;
    if(error){setFeaturedRecipes([]);setFeaturedError(true);return;}
    setFeaturedRecipes((data||[]).map(dbRecipeToCard));
    setFeaturedError(false);
   }catch{
    if(!alive)return;
    setFeaturedRecipes([]);setFeaturedError(true);
   }finally{if(alive)setFeaturedLoading(false);}
  };
  void loadFeatured();
  const channel=supabase.channel('home-featured-recipes').on('postgres_changes',{event:'*',schema:'public',table:'recipes'},()=>{void loadFeatured();}).subscribe();
  return ()=>{alive=false;void supabase.removeChannel(channel);};
 },[]);
 useEffect(()=>{
  if(featuredPaused||featuredRecipes.length<2)return;
  const timer=window.setInterval(()=>setFeaturedIndex(index=>(index+1)%featuredRecipes.length),5000);
  return ()=>window.clearInterval(timer);
 },[featuredIndex,featuredRecipes.length,featuredPaused]);
 useEffect(()=>{if(featuredIndex>=featuredRecipes.length)setFeaturedIndex(0);},[featuredIndex,featuredRecipes.length]);

 useEffect(()=>{
  if(!supabaseConfigured){setCatalogMode(false);return;}
  let alive=true;
  let timerId;
  const translationController=new AbortController();
  setCatalogBusy(true);setCatalogError('');
  const term=query.trim();
  const savedIds=saved.filter(id=>typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id));
  if(showSaved&&!savedIds.length){
   setCatalogMode(true);setCatalogRecipes([]);setCatalogTotal(0);setCatalogBusy(false);
   return ()=>{alive=false;translationController.abort();};
  }
  if(term){
   const searchArgs=groups=>({
    p_search_groups:groups,
    p_category:category==='সব রেসিপি'?null:category,
    p_saved_ids:showSaved?savedIds:null,
    p_only_saved:showSaved,
    p_limit:PAGE_SIZE,
    p_offset:catalogPage*PAGE_SIZE
   });
   const performSearch=async()=>{
    try{
     const primary=await supabase.rpc('search_published_recipes_multilingual',searchArgs(buildRecipeSearchGroups(term)));
     if(!alive)return;
     if(primary.error){
      setCatalogBusy(false);setCatalogMode(true);setCatalogRecipes([]);setCatalogTotal(0);setCatalogError(primary.error.message);
      return;
     }
     let resultRows=primary.data||[];
     let resultCount=Number(resultRows[0]?.total_count)||0;
     // Only call the translation provider when ordinary multilingual/alias search
     // finds nothing. Debouncing below avoids sending a request for every keystroke.
     if(resultCount===0&&Array.from(term).length>=2&&!translationController.signal.aborted){
      const translations=await translateSearchQuery(term,{signal:translationController.signal});
      for(const translatedQuery of translations){
       if(!alive||translationController.signal.aborted)return;
       const groups=buildRecipeSearchGroups(translatedQuery);
       if(!groups.length)continue;
       const alternative=await supabase.rpc('search_published_recipes_multilingual',searchArgs(groups));
       if(alternative.error)continue;
       const count=Number(alternative.data?.[0]?.total_count)||0;
       if(count>0){resultRows=alternative.data||[];resultCount=count;break;}
      }
     }
     if(!alive)return;
     setCatalogMode(true);
     setCatalogRecipes(resultRows.map(item=>dbRecipeToCard(item.recipe)));
     setCatalogTotal(resultCount);
     setCatalogBusy(false);
    }catch(error){
     if(!alive||translationController.signal.aborted)return;
     setCatalogMode(true);setCatalogRecipes([]);setCatalogTotal(0);setCatalogBusy(false);
     setCatalogError('সার্চ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।');
    }
   };
   timerId=setTimeout(()=>{performSearch();},350);
   return ()=>{alive=false;clearTimeout(timerId);translationController.abort();};
  }
  let req=supabase.from('recipes').select('*',{count:'exact'}).eq('is_published',true);
  if(showSaved)req=req.in('id',savedIds);
  else if(category!=='সব রেসিপি')req=req.eq('category',category);
  req=req.order('published_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).range(catalogPage*PAGE_SIZE,catalogPage*PAGE_SIZE+PAGE_SIZE-1);
  req.then(({data,error,count})=>{if(!alive)return;setCatalogBusy(false);if(error){setCatalogError(error.message);setCatalogMode(true);setCatalogRecipes([]);setCatalogTotal(0);return;}setCatalogMode(true);setCatalogRecipes((data||[]).map(dbRecipeToCard));setCatalogTotal(count||0);});
  return ()=>{alive=false;};
 },[query,category,catalogPage,showSaved,saved]);
 useEffect(()=>{
  if(!supabaseConfigured)return;
  supabase.from('recipes').select('category').eq('is_published',true).then(({data})=>{if(data)setDbCategories([...new Set(data.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'bn')));});
 },[]);
 const visibleCategories=useMemo(()=>['সব রেসিপি',...new Set([...categories.slice(1),...dbCategories])],[dbCategories]);
 const filtered=useMemo(()=>{const source=catalogMode?catalogRecipes:demos.filter(r=>(category==='সব রেসিপি'||r.category===category)&&recipeMatchesSearch(r,query));return source.filter(r=>!showSaved||saved.includes(r.id));},[catalogMode,catalogRecipes,query,category,saved,showSaved]);
 const navigateTo=(page,recipe=null,options={})=>{
  const safePage=page==='recipe'?'recipe':ROUTABLE_PAGES.includes(page)?page:'home';
  const aboutSection=safePage==='about'?String(options.section||'').trim():'';
  const hashPath=safePage==='recipe'?'/recipe/'+encodeURIComponent(String(recipe?.slug||recipe?.id||'')):safePage==='about'&&aboutSection?'/about/'+encodeURIComponent(aboutSection):'/'+safePage;
  setRoute(routeFromHash('#'+hashPath));
  window.location.hash=hashPath;
  setShowSaved(safePage==='saved');
  if(safePage==='recipe')setSelected(recipe||null);else setSelected(null);
  if(['home','recipes','saved','categories'].includes(safePage)){setCategory(options.category||'সব রেসিপি');if(!options.keepQuery)setQuery('');setCatalogPage(0);}
  window.scrollTo({top:0,behavior:'smooth'});
 };
 const toggleSave=id=>setSaved(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
 const resetFilters=()=>{setQuery('');setCategory('সব রেসিপি');setCatalogPage(0);setShowSaved(false);setSelected(null);navigateTo('recipes');};
 const stepFeatured=direction=>setFeaturedIndex(index=>featuredRecipes.length?(index+direction+featuredRecipes.length)%featuredRecipes.length:0);
 const openRecipe=recipe=>navigateTo('recipe',recipe);
 const openFeaturedRecipe=recipe=>{openRecipe(recipe);setCategory('সব রেসিপি');setQuery('');setCatalogPage(0);};
 return <><header className="header"><div className="nav wrap"><a className="brand" href="#/home" onClick={e=>{e.preventDefault();navigateTo('home')}}><span className="brand-mark"><img src={import.meta.env.BASE_URL + "rannar-menu-logo.svg"} alt="" width="45" height="45" /></span><span>Rannar<span className="brand-accent"> Menu</span><small>প্রতিদিনের রান্নার অনুপ্রেরণা</small></span></a><nav className="nav-links"><a className={route.page==='recipes'||route.page==='recipe'?'nav-active':undefined} aria-current={route.page==='recipes'||route.page==='recipe'?'page':undefined} href="#/recipes" onClick={e=>{e.preventDefault();navigateTo('recipes')}}>রেসিপি</a><a className={route.page==='categories'?'nav-active':undefined} aria-current={route.page==='categories'?'page':undefined} href="#/categories" onClick={e=>{e.preventDefault();navigateTo('categories')}}>ক্যাটাগরি</a><a href={import.meta.env.BASE_URL + "admin"}>অ্যাডমিন</a><button className="saved-link" aria-current={route.page==='saved'?'page':undefined} onClick={()=>navigateTo(route.page==='saved'?'recipes':'saved')}><Heart size={17} fill={route.page==='saved'?'currentColor':'none'}/> সংরক্ষিত ({saved.length})</button></nav><ThemeToggle/></div></header>
 <main id="home">{route.page==='home'&&<section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> রান্না হোক আরও আনন্দের</div><h1>প্রতিদিনের রান্নায়<br/><em>নতুন স্বাদের</em> গল্প।</h1><p>চেনা উপকরণ, সহজ রেসিপি আর ঘরোয়া স্বাদে আপনার প্রতিদিনের খাবার হোক একটু বেশি বিশেষ।</p><div className="hero-actions"><form className="hero-search" role="search" onSubmit={e=>{e.preventDefault();setCategory('সব রেসিপি');setCatalogPage(0);setShowSaved(false);setSelected(null);navigateTo('recipes',null,{keepQuery:true});}}><Search size={21} aria-hidden="true"/><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setCatalogPage(0)}} placeholder="যেকোনো ভাষায় খাবারের নাম খুঁজুন..." aria-label="রেসিপি বা উপকরণ খুঁজুন"/><button type="submit" aria-label="খুঁজুন"><Search size={19}/></button></form><span className="social-proof"><span className="proof-icon"><Utensils size={16}/></span> ঘরের রান্না, মনের মতো</span></div><div className="hero-stats"><div><strong>সহজ</strong><span>ধাপে ধাপে নির্দেশনা</span></div><div><strong>ঘরোয়া</strong><span>পরিচিত উপকরণ</span></div><div><strong>সুস্বাদু</strong><span>প্রতিদিন নতুন আইডিয়া</span></div></div></div></section>}
 {route.page==='home'&&<section className="featured-banner-section" aria-label="Trending Recipes"><FeaturedRecipeCarousel recipes={featuredRecipes} activeIndex={featuredIndex} onSelect={openFeaturedRecipe} onPrevious={()=>stepFeatured(-1)} onNext={()=>stepFeatured(1)} onSelectIndex={setFeaturedIndex} paused={featuredPaused} onTogglePause={()=>setFeaturedPaused(value=>!value)} loading={featuredLoading} error={featuredError}/></section>}
 {route.page==='categories'&&<section className="category-strip" id="categories"><div className="wrap category-inner"><div><span className="section-kicker">আপনার পছন্দের স্বাদ</span><h2>কী রান্না হবে আজ?</h2></div><div className="category-pills">{visibleCategories.map((c,i)=><button key={c} className={category===c?'category-pill active':'category-pill'} onClick={()=>navigateTo('recipes',null,{category:c})}>{i===0?<Utensils size={16}/>:i===1?<span>🐟</span>:i===2?<span>🍗</span>:i===3?<span>🥚</span>:<Leaf size={16}/>} {c}</button>)}</div></div></section>}
 {['recipes','saved','recipe'].includes(route.page)&&<section className="recipes-section wrap" id="recipes">{!selected&&<div className="section-heading"><div><span className="section-kicker">রান্নাঘরের সংগ্রহ</span><h2>{showSaved?'আপনার সংরক্ষিত রেসিপি':route.page==='categories'?'ক্যাটাগরি অনুযায়ী রেসিপি':route.page==='recipes'?'সব রেসিপি':'স্বাদের সেরা আয়োজন'}</h2><p>{showSaved?'পরে রান্না করার জন্য পছন্দের রেসিপিগুলো এখানে পাবেন।':route.page==='categories'?'পছন্দের খাবারের বিভাগ বেছে নিয়ে সেই রেসিপিগুলো দেখুন।':route.page==='recipes'?'সহজ থেকে বিশেষ আয়োজন—সব প্রকাশিত রেসিপি এক জায়গায়।':'সহজ থেকে বিশেষ আয়োজন—আপনার পরের রান্নার আইডিয়া এখানেই।'}</p></div></div>}
 {route.page==='recipe'&&!selected?<div className="empty-state"><span className="catalog-spinner"/><h3>রেসিপি লোড হচ্ছে…</h3><p>রেসিপির তথ্য আনা হচ্ছে।</p></div>:selected?<article className="recipe-detail"><button className="back-btn" onClick={()=>navigateTo('recipes')}>← সব রেসিপিতে ফিরুন</button><div className="detail-grid"><div className="detail-image-shell">{selected.image?<><img src={selected.image} alt={selected.title} data-original-image-url={selected.image} data-source-url={selected.image_source_url} onError={handleDishImageError}/><div className="detail-image-placeholder image-error-placeholder" role="img" aria-label={selected.title+"-এর ছবি লোড হয়নি"}><Utensils size={44}/><span>ছবিটি লোড হয়নি; অন্য খাবারের ছবি দেখানো হবে না</span></div></>:<div className="detail-image-placeholder" role="img" aria-label={selected.title+"-এর সঠিক ছবি এখনো পাওয়া যায়নি"}><Utensils size={44}/><span>এই খাবারের নির্ভরযোগ্য ছবি যাচাই করা হচ্ছে</span></div>}</div><div className="detail-copy"><span className="recipe-tag">{selected.category}</span><h2>{selected.title}</h2><p>{selected.desc}</p><div className="detail-meta"><span><Clock3 size={17}/> মোট {selected.time} মিনিট</span>{Number.isFinite(selected.prep_minutes)&&<span>প্রস্তুতি {selected.prep_minutes} মিনিট</span>}{Number.isFinite(selected.cook_minutes)&&<span>রান্না {selected.cook_minutes} মিনিট</span>}{Number(selected.servings)>0&&<span>পরিবেশন {selected.servings} জন</span>}<span><ChefHat size={17}/> {selected.level}</span></div><button className="outline-btn" onClick={()=>toggleSave(selected.id)}><Heart size={17} fill={saved.includes(selected.id)?'currentColor':'none'}/>{saved.includes(selected.id)?'সংরক্ষিত':'রেসিপি সংরক্ষণ'}</button></div></div>{selected.image&&selected.image_credit&&selected.image_source_url&&<div className="image-credit">ছবির কৃতিত্ব: <a href={selected.image_source_url} target="_blank" rel="noopener noreferrer">{selected.image_credit}</a><span>·</span><a href={imageLicenseHref(selected.image_license)} target="_blank" rel="noopener noreferrer">লাইসেন্স {selected.image_license}</a></div>}<div className="instruction-grid"><div className="ingredients panel"><h3>উপকরণ</h3><ul>{selected.ingredients.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div className="steps panel"><h3>রান্নার পদ্ধতি</h3><ol>{selected.steps.map((x,i)=><li key={i}>{x}</li>)}</ol></div></div>{selected.source_url&&<div className="recipe-source-note"><span>রেসিপির ধরন/নামের রেফারেন্স: {selected.source_name||"মূল উৎস"}। রান্নার নির্দেশনা Rannar Menu-তে নতুনভাবে লেখা।</span><a href={selected.source_url} target="_blank" rel="noopener noreferrer">উৎস দেখুন <ArrowUpRight size={14}/></a></div>}<RecipeReviews recipe={selected}/></article>:<>{catalogBusy?<div className="empty-state"><span className="catalog-spinner"/><h3>রেসিপি লোড হচ্ছে…</h3><p>ডেটাবেস থেকে প্রকাশিত রেসিপি আনা হচ্ছে।</p></div>:filtered.length?<div className="recipe-grid">{filtered.map(r=><article className="recipe-card" key={r.id}><button className="image-button" onClick={()=>openRecipe(r)} aria-label={r.title+' বিস্তারিত দেখুন'}>{r.image?<><img src={r.image} alt={r.title} data-original-image-url={r.image} data-source-url={r.image_source_url} loading="lazy" onError={handleDishImageError}/><span className="image-placeholder image-error-placeholder" role="img" aria-label={r.title+"-এর ছবি লোড হয়নি"}><Utensils size={34}/><small>ছবিটি লোড হয়নি; অন্য খাবারের ছবি দেখানো হবে না</small></span></>:<span className="image-placeholder" role="img" aria-label={r.title+"-এর সঠিক ছবি এখনো পাওয়া যায়নি"}><Utensils size={34}/><small>এই খাবারের সঠিক ছবি যাচাই হচ্ছে</small></span>}<span className="recipe-tag">{r.tag||r.category}</span></button>{r.image&&r.image_credit&&r.image_source_url&&<div className="card-image-credit">ছবি: <a href={r.image_source_url} target="_blank" rel="noopener noreferrer">{r.image_credit}</a> · <a href={imageLicenseHref(r.image_license)} target="_blank" rel="noopener noreferrer">লাইসেন্স {r.image_license}</a></div>}<div className="card-body"><div className="card-meta"><span>{r.category}</span><span><Clock3 size={14}/> {r.time} মিনিট</span></div><button className="card-title" onClick={()=>openRecipe(r)}>{r.title}<ArrowUpRight size={18}/></button><p>{r.desc}</p><div className="card-footer"><span className="difficulty"><span className="difficulty-dot"/>{r.level}</span><button className={saved.includes(r.id)?'save-btn saved':'save-btn'} aria-label="রেসিপি সংরক্ষণ" onClick={()=>toggleSave(r.id)}><Heart size={18} fill={saved.includes(r.id)?'currentColor':'none'}/></button></div></div></article>)}</div>:<div className="empty-state"><Search size={34}/><h3>কোনো রেসিপি পাওয়া যায়নি</h3><p>{catalogError?'ডেটাবেসে রেসিপি আনার সময় সমস্যা হয়েছে।':catalogMode?'এই অনুসন্ধানে কোনো প্রকাশিত রেসিপি নেই।':'অন্য শব্দ দিয়ে খুঁজুন অথবা ক্যাটাগরি পরিবর্তন করুন।'}</p><button className="outline-btn" onClick={resetFilters}>সব রেসিপি দেখুন</button></div>}{catalogMode&&!showSaved&&catalogTotal>PAGE_SIZE&&<div className="catalog-pagination"><button className="outline-btn" disabled={catalogPage===0||catalogBusy} onClick={()=>setCatalogPage(p=>Math.max(0,p-1))}>← আগের পৃষ্ঠা</button><span>পৃষ্ঠা {catalogPage+1} / {Math.ceil(catalogTotal/PAGE_SIZE)} · মোট {catalogTotal.toLocaleString('bn-BD')} রেসিপি</span><button className="outline-btn" disabled={(catalogPage+1)*PAGE_SIZE>=catalogTotal||catalogBusy} onClick={()=>setCatalogPage(p=>p+1)}>পরের পৃষ্ঠা →</button></div>}</>}
 {route.page==='recipes'&&<div className="collection-note"><div className="collection-icon"><Bookmark size={22}/></div><div><strong>আপনার রান্নার খাতা আরও বড় হবে</strong><p>রেসিপি এখন ডেটাবেসে সংরক্ষিত হয়। অ্যাডমিন থেকে CSV/JSON batch import করে বড় সংগ্রহ তৈরি করা যাবে।</p></div></div>}</section>}
 {route.page==='about'&&<AboutPage section={route.slug} onNavigateAbout={(section='')=>navigateTo('about',null,{section})}/>}</main><footer className="footer"><div className="wrap footer-inner"><a className="brand footer-brand" href="#/home" onClick={e=>{e.preventDefault();navigateTo('home')}}><span className="brand-mark"><ChefHat size={22}/></span><span>Rannar<span className="brand-accent"> Menu</span><small>প্রতিদিনের রান্নার অনুপ্রেরণা</small></span></a><span>© {new Date().getFullYear()} Rannar Menu. স্বাদের গল্প চলুক।</span><a className="footer-admin-link" href={import.meta.env.BASE_URL + "admin"}>অ্যাডমিন</a><a href="#/home" className="top-link" onClick={e=>{e.preventDefault();navigateTo('home')}}>উপরে যান ↑</a></div></footer><BottomNavigation activePage={route.page} onNavigate={navigateTo} savedCount={saved.length}/><MiraChat onOpenRecipe={recipe=>{openRecipe(recipe);setCategory('সব রেসিপি');setQuery('');setCatalogPage(0);}} /></>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode>{window.location.pathname.replace(/\/+$/,'').endsWith('/admin')?<AdminApp/>:<App/>}</React.StrictMode>);
