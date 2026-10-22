const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const STOP = new Set(['a','an','and','the','with','of','in','style','bengali','bangladeshi','bangladesh','indian','recipe','food','dish','curry','traditional','homemade','easy','quick','fresh','fried','roasted','steamed','baked','made','from']);

const ALIASES = {
  'আলু ভর্তা': [{q:'aloo bhorta',must:['aloo','bhorta']},{q:'aloo bharta',must:['aloo','bharta']},{q:'potato bhorta',must:['potato','bhorta']}],
  'কড়াইশুঁটির কচুরি': [{q:'matar kachori',must:['matar','kachori']},{q:'green peas kachori',must:['peas','kachori']}],
  'কাঁচা আমের ডাল': [{q:'green mango dal',must:['mango','dal']},{q:'raw mango lentil curry',must:['mango','lentil']}],
  'কাতলা মাছের কালিয়া': [{q:'catla fish kalia',must:['catla','kalia']},{q:'bengali catla fish curry',must:['catla','fish']}],
  'গোয়ালন্দ স্টিমার মুরগির ঝাল কারি': [{q:'Goalondo steamer chicken curry',must:['goalondo','chicken']},{q:'Goalando chicken curry',must:['chicken','curry']}],
  'ঘরোয়া চিকেন বিরিয়ানি': [{q:'chicken biryani',must:['chicken','biryani']}],
  'চট্টগ্রামের বিফ কালা ভুনা': [{q:'beef kala bhuna',must:['beef','kala','bhuna']},{q:'kala bhuna',must:['kala','bhuna']}],
  'চিকেন কষা': [{q:'chicken kosha',must:['chicken','kosha']},{q:'kosha murgir mangsho',must:['kosha','murgi']}],
  'চিংড়ি ভর্তা': [{q:'chingri bhorta',must:['chingri','bhorta']},{q:'shrimp bhorta',must:['shrimp','bhorta']}],
  'চিতই পিঠা': [{q:'chitoi pitha',must:['chitoi','pitha']},{q:'chitai pitha',must:['chitai','pitha']}],
  'ঝটপট ডিমের কারি': [{q:'Bengali egg curry',must:['egg','curry']}],
  'টমেটো-খেজুর চাটনি': [{q:'tomato date chutney',must:['tomato','date','chutney']}],
  'ডিম পোস্ত': [{q:'dim posto',must:['dim','posto']},{q:'egg posto',must:['egg','posto']},{q:'egg poppy seed curry',must:['egg','poppy']}],
  'ঢাকাই বাকরখানি': [{q:'Dhakai bakarkhani',must:['bakarkhani']},{q:'bakarkhani bread',must:['bakarkhani']}],
  'ঢাকাই বিফ তেহারি': [{q:'Dhakai beef tehari',must:['beef','tehari']},{q:'beef tehari',must:['beef','tehari']}],
  'ঢাকাই বোরহানি': [{q:'Bangladeshi borhani drink',must:['borhani']},{q:'borhani yogurt drink',must:['borhani']}],
  'ঢাকাই ভুনা খিচুড়ি': [{q:'bhuna khichuri',must:['bhuna','khichuri']},{q:'bhuna khichdi',must:['bhuna','khichdi']}],
  'ঢাকাই মোরগ পোলাও': [{q:'morog polao',must:['morog','polao']},{q:'Bangladeshi chicken pulao',must:['chicken','pulao']}],
  'তেলে কই মাছ': [{q:'koi fish Bengali curry',must:['koi','fish']},{q:'climbing perch fish curry',must:['perch','curry']}],
  'দই মাছ': [{q:'doi mach Bengali fish curry',must:['doi','mach']},{q:'yogurt fish curry Bengali',must:['yogurt','fish','curry']}],
  'নিরামিষ আলুর দম': [{q:'Bengali aloo dum',must:['aloo','dum']},{q:'aloor dum',must:['aloor','dum']}],
  'পটলের দোরমা': [{q:'potoler dorma',must:['potoler','dorma']},{q:'pointed gourd stuffed curry',must:['gourd','stuffed']}],
  'পোড়া বেগুন ভর্তা': [{q:'begun bhorta',must:['begun','bhorta']},{q:'roasted eggplant bharta',must:['eggplant','bharta']}],
  'বাঙালি ডিমের ডেভিল': [{q:'Bengali egg devil',must:['egg','devil']},{q:'Indian egg chop',must:['egg','chop']}],
  'বাঙালি লাবড়া': [{q:'Bengali labra mixed vegetables',must:['labra']},{q:'labra Bengali vegetable curry',must:['labra']}],
  'বাঙালি শুকতো': [{q:'Bengali shukto',must:['shukto']},{q:'Bengali shukto vegetable stew',must:['shukto']}],
  'বাংলা পাতলা খিচুড়ি': [{q:'Bengali khichuri',must:['khichuri']},{q:'Bengali khichdi',must:['khichdi']}],
  'বাসন্তী পোলাও': [{q:'Basanti pulao',must:['basanti','pulao']},{q:'Bengali basanti polao',must:['basanti','polao']}],
  'বেগুন ভাজা': [{q:'begun bhaja',must:['begun','bhaja']},{q:'Indian fried eggplant Bengali',must:['eggplant','fried']}],
  'ভাজা মুগ ডাল': [{q:'bhaja mug dal',must:['bhaja','mug','dal']},{q:'Bengali roasted moong dal',must:['moong','dal']}],
  'ভাপা চিংড়ি': [{q:'bhapa chingri',must:['bhapa','chingri']},{q:'steamed Bengali prawns',must:['steamed','prawns']}],
  'ভাপা দই': [{q:'bhapa doi',must:['bhapa','doi']},{q:'Bengali steamed yogurt dessert',must:['steamed','yogurt','dessert']}],
  'মাছের মাথা দিয়ে মুগ ডাল': [{q:'Bengali moong dal fish head',must:['dal','fish','head']},{q:'muri ghonto fish head rice',must:['muri','ghonto']}],
  'রাধাবল্লভী কচুরি': [{q:'radhaballabhi kachori',must:['radhaballabhi']},{q:'radhaballavi kachuri',must:['radhaballavi']}],
  'লাউশাকের চচ্চড়ি': [{q:'lau shak chorchori',must:['lau','shak','chorchori']},{q:'bottle gourd leaves Bengali curry',must:['gourd','leaves']}],
  'শুঁটকি ভুনা': [{q:'shutki bhuna',must:['shutki','bhuna']},{q:'Bangladeshi dried fish bhuna',must:['dried','fish','bhuna']}],
  'সবজি খিচুড়ি': [{q:'vegetable khichuri',must:['vegetable','khichuri']},{q:'vegetable khichdi',must:['vegetable','khichdi']}],
  'সরিষা ঢেঁড়স': [{q:'mustard okra curry',must:['mustard','okra']},{q:'bhindi mustard curry',must:['bhindi','mustard']}],
  'সরিষা পাবদা': [{q:'shorshe pabda',must:['shorshe','pabda']},{q:'pabda mustard fish curry',must:['pabda','mustard']}],
  'সিলেটি সাতকরা গরুর মাংস': [{q:'Sylheti beef satkara',must:['beef','satkara']},{q:'beef shatkora curry',must:['beef','shatkora']}]
};

const stripHtml = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const norm = value => String(value ?? '').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const clean = value => String(value ?? '').trim();
const getMeta = (ext, key) => stripHtml(ext?.[key]?.value ?? '');

function queriesFor(recipe) {
  const title = clean(recipe?.title);
  const exact = ALIASES[title];
  if (exact) return exact;
  const normalized = norm(title);
  const tokens = normalized.split(' ').filter(x => x.length > 2 && !STOP.has(x));
  if (!tokens.length) return [{ q: title, must: [normalized] }];
  // For new English/transliterated names, require every distinctive title token in the image metadata.
  // For Bengali titles, try the exact title but do not attach an unrelated image if it cannot be verified.
  return [{ q: title, must: /[A-Za-z]/.test(title) ? tokens.slice(0, 5) : [normalized] }];
}

function licenseAllowed(label) {
  const value = clean(label);
  if (/\bCC\s*BY-NC|\bCC\s*BY-ND|non.?commercial|no.?derivatives/i.test(value)) return false;
  return /CC\s*BY-SA|CC\s*BY(?:\s|$)|CC0|public\s*domain|\bPD[- ]/i.test(value);
}

function getImageInfo(page) {
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const ext = info.extmetadata || {};
  const license = getMeta(ext, 'LicenseShortName') || getMeta(ext, 'UsageTerms');
  const artist = getMeta(ext, 'Attribution') || getMeta(ext, 'Artist') || getMeta(ext, 'Credit');
  const sourceUrl = 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(String(page.title || '').replace(/ /g, '_'));
  const imageUrl = info.thumburl || info.url;
  if (!imageUrl || !artist || !licenseAllowed(license)) return null;
  const description = getMeta(ext, 'ImageDescription') || getMeta(ext, 'ObjectName') || '';
  return { image_url: imageUrl, image_source_url: sourceUrl, image_credit: artist.slice(0, 500), image_license: license.slice(0, 120), image_search_status: 'matched', image_search_attempted_at: new Date().toISOString(), _title: page.title, _description: description };
}

export async function findRecipePhoto(recipe, { signal, timeoutMs = 9000 } = {}) {
  const searches = queriesFor(recipe);
  for (const search of searches) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });
    try {
      const url = new URL(COMMONS_API);
      url.search = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: 'filetype:bitmap ' + search.q,
        gsrnamespace: '6',
        gsrlimit: '10',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: '1200',
        format: 'json',
        origin: '*'
      }).toString();
      const response = await fetch(url.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Wikimedia Commons returned ' + response.status);
      const data = await response.json();
      if (data?.error) throw new Error(data.error.info || 'Wikimedia Commons search failed');
      const pages = Object.values(data?.query?.pages || {});
      for (const page of pages) {
        const title = norm(page.title);
        const info = page.imageinfo?.[0];
        const ext = info?.extmetadata || {};
        const description = norm(getMeta(ext, 'ImageDescription') + ' ' + getMeta(ext, 'ObjectName'));
        const searchable = title + ' ' + description;
        const required = (search.must || []).map(norm).filter(Boolean);
        if (!required.length || !required.every(term => searchable.includes(term))) continue;
        const found = getImageInfo(page);
        if (found) return found;
      }
    } catch (error) {
      if (error?.name !== 'AbortError') throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export function hasCompleteRecipePhoto(recipe) {
  return !!(clean(recipe?.image_url) && clean(recipe?.image_source_url) && clean(recipe?.image_credit) && clean(recipe?.image_license));
}

export async function attachRecipePhoto(recipe) {
  if (hasCompleteRecipePhoto(recipe)) {
    return { ...recipe, image_search_status: recipe.image_search_status || 'manual' };
  }
  try {
    const photo = await findRecipePhoto(recipe);
    if (photo) {
      const { _title, _description, ...fields } = photo;
      return { ...recipe, ...fields };
    }
    return { ...recipe, image_url: null, image_source_url: null, image_credit: null, image_license: null, image_search_status: 'not_found', image_search_attempted_at: new Date().toISOString() };
  } catch {
    // Do not block saving a recipe if the external photo service is unavailable.
    return { ...recipe, image_url: null, image_source_url: null, image_credit: null, image_license: null, image_search_status: 'pending' };
  }
}
