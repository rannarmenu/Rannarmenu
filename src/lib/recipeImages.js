const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const STOP = new Set(['a','an','and','the','with','of','in','style','bengali','bangladeshi','bangladesh','indian','recipe','food','dish','traditional','homemade','easy','quick','fresh','made','from']);

const ALIASES = {
  "আম পান্না": [{ q: "aam panna", must: ["aam","panna"] }],
  "আলু ফুলকপি তরকারি": [{ q: "potato cauliflower curry", must: ["potato","cauliflower","curry"] }],
  "আলুর পরোটা": [{ q: "aloo paratha", must: ["aloo","paratha"] }],
  "ইলিশ পাতুরি": [{ q: "ilish paturi", must: ["ilish","paturi"] }],
  "কই মাছের সরিষা ঝোল": [{ q: "koi mustard curry", must: ["koi","mustard","curry"] }],
  "কচুমুখি ভুনা": [{ q: "taro root bhuna", must: ["taro","root","bhuna"] }],
  "কলমি শাক ভাজি": [{ q: "water spinach stir fry", must: ["water","spinach","stir","fry"] }],
  "কলার পিঠা": [{ q: "banana pitha", must: ["banana","pitha"] }],
  "কলার স্মুদি": [{ q: "banana smoothie", must: ["banana","smoothie"] }],
  "কাঁকড়া মসলা": [{ q: "crab masala curry", must: ["crab","masala","curry"] }],
  "কাঁচকি মাছের চচ্চড়ি": [{ q: "kachki fish chorchori", must: ["kachki","fish","chorchori"] }],
  "কালাই ডাল": [{ q: "kalai dal", must: ["kalai","dal"] }],
  "কাশ্মীরি পোলাও": [{ q: "kashmiri pulao", must: ["kashmiri","pulao"] }],
  "কুমড়া ফুলের বড়া": [{ q: "pumpkin flower fritters", must: ["pumpkin","flower","fritters"] }],
  "কোরাল মাছের কালিয়া": [{ q: "koral fish kalia", must: ["koral","fish","kalia"] }],
  "ক্ষীরের সন্দেশ": [{ q: "kheer sandesh", must: ["kheer","sandesh"] }],
  "খাসির কাচ্চি বিরিয়ানি": [{ q: "mutton kacchi biryani", must: ["mutton","kacchi","biryani"] }],
  "খাসির মাংসের ঝোল": [{ q: "mutton potato curry", must: ["mutton","potato","curry"] }],
  "গরুর কিমা পোলাও": [{ q: "beef keema pulao", must: ["beef","keema","pulao"] }],
  "গরুর মাংসের চাপ": [{ q: "beef steak spiced", must: ["beef","steak","spiced"] }],
  "গরুর মাংসের ঝোল": [{ q: "beef potato curry", must: ["beef","potato","curry"] }],
  "গরুর মাংসের মেজবানি": [{ q: "mezbani beef curry", must: ["mezbani","beef","curry"] }],
  "গাজরের হালুয়া": [{ q: "carrot halwa", must: ["carrot","halwa"] }],
  "ঘি ভাত": [{ q: "ghee rice", must: ["ghee","rice"] }],
  "চমচম": [{ q: "chomchom sweet", must: ["chomchom","sweet"] }],
  "চিকেন কাটলেট": [{ q: "chicken cutlet", must: ["chicken","cutlet"] }],
  "চিকেন নাগেটস": [{ q: "homemade chicken nuggets", must: ["chicken","nuggets"] }],
  "চিকেন পকোড়া": [{ q: "chicken pakora", must: ["chicken","pakora"] }],
  "চিকেন ফ্রাই": [{ q: "crispy fried chicken", must: ["crispy","fried","chicken"] }],
  "চিকেন ফ্রাইড রাইস": [{ q: "chicken fried rice", must: ["chicken","fried","rice"] }],
  "চিকেন সাসলিক": [{ q: "chicken shashlik", must: ["chicken","shashlik"] }],
  "চিকেন স্টু": [{ q: "chicken stew", must: ["chicken","stew"] }],
  "চিংড়ি দিয়ে লাউ": [{ q: "prawn bottle gourd curry", must: ["prawn","bottle","gourd","curry"] }],
  "চিতল মাছের মুইঠ্যা": [{ q: "chitol fish muitha", must: ["chitol","fish","muitha"] }],
  "ছানার ডালনা": [{ q: "chhana dalna", must: ["chhana","dalna"] }],
  "জাফরানি পোলাও": [{ q: "saffron pulao", must: ["saffron","pulao"] }],
  "জিলাপি": [{ q: "jalebi", must: ["jalebi"] }],
  "টমেটো দিয়ে রুই মাছ": [{ q: "rui fish tomato curry", must: ["rui","fish","tomato","curry"] }],
  "টমেটো-ধনেপাতা চাটনি": [{ q: "tomato coriander chutney", must: ["tomato","coriander","chutney"] }],
  "ডালের বড়া": [{ q: "lentil fritters", must: ["lentil","fritters"] }],
  "ডিম পরোটা": [{ q: "egg paratha", must: ["egg","paratha"] }],
  "ডিম-আলুর দম": [{ q: "egg potato dum", must: ["egg","potato","dum"] }],
  "ডিমের অমলেট কারি": [{ q: "omelette curry", must: ["omelette","curry"] }],
  "ডিমের কোফতা": [{ q: "egg kofta curry", must: ["egg","kofta","curry"] }],
  "ডিমের ঝাল ভুনা": [{ q: "spicy egg bhuna", must: ["spicy","egg","bhuna"] }],
  "ডিমের ঝুরি": [{ q: "scrambled eggs bengali", must: ["scrambled","eggs"] }],
  "ডিমের মালাইকারি": [{ q: "egg malai curry", must: ["egg","malai","curry"] }],
  "তন্দুরি রুটি": [{ q: "tandoori roti", must: ["tandoori","roti"] }],
  "তালের পিঠা": [{ q: "tal pitha", must: ["tal","pitha"] }],
  "তেঁতুলের মিষ্টি চাটনি": [{ q: "tamarind sweet chutney", must: ["tamarind","sweet","chutney"] }],
  "দই ফুচকা": [{ q: "doi fuchka", must: ["doi","fuchka"] }],
  "দুধ চিতই পিঠা": [{ q: "dudh chitoi pitha", must: ["dudh","chitoi","pitha"] }],
  "দুধ পুলি পিঠা": [{ q: "dudh puli pitha", must: ["dudh","puli","pitha"] }],
  "নান রুটি": [{ q: "naan bread", must: ["naan","bread"] }],
  "পনির বাটার মসলা": [{ q: "paneer butter masala", must: ["paneer","butter","masala"] }],
  "পাকন পিঠা": [{ q: "pakon pitha", must: ["pakon","pitha"] }],
  "পাকা আমের লাচ্ছি": [{ q: "mango lassi", must: ["mango","lassi"] }],
  "পাঙ্গাস মাছের দোপেঁয়াজা": [{ q: "pangasius fish do pyaza", must: ["pangasius","fish","pyaza"] }],
  "পাঁচমিশালি ডাল": [{ q: "panchmel dal", must: ["panchmel","dal"] }],
  "পালং পনির": [{ q: "palak paneer", must: ["palak","paneer"] }],
  "পালং শাক ভাজি": [{ q: "palong shak bhaji", must: ["palong","shak","bhaji"] }],
  "পুঁইশাক চিংড়ি": [{ q: "pui shak prawn", must: ["pui","shak","prawn"] }],
  "পুদিনা চাটনি": [{ q: "mint chutney", must: ["mint","chutney"] }],
  "পেঁপে চচ্চড়ি": [{ q: "green papaya chorchori", must: ["green","papaya","chorchori"] }],
  "পেঁয়াজু": [{ q: "onion pakora bengali", must: ["onion","pakora"] }],
  "ফুচকা": [{ q: "fuchka", must: ["fuchka"] }],
  "ফুলকপির রোস্ট": [{ q: "cauliflower roast curry", must: ["cauliflower","roast","curry"] }],
  "বরবটি আলু ভাজি": [{ q: "yardlong bean potato fry", must: ["yardlong","bean","potato","fry"] }],
  "বাঁধাকপির ঘন্ট": [{ q: "cabbage ghonto", must: ["cabbage","ghonto"] }],
  "বিফ চাপ": [{ q: "beef chaap", must: ["beef","chaap"] }],
  "বুটের হালুয়া": [{ q: "chickpea halwa", must: ["chickpea","halwa"] }],
  "বেলের শরবত": [{ q: "bael shorbot", must: ["bael","shorbot"] }],
  "ভেজ ফ্রাইড রাইস": [{ q: "vegetable fried rice", must: ["vegetable","fried","rice"] }],
  "ভেটকি ফ্রাই": [{ q: "bhetki fish fry", must: ["bhetki","fish","fry"] }],
  "মটর পনির": [{ q: "matar paneer", must: ["matar","paneer"] }],
  "মসলা চা": [{ q: "masala chai", must: ["masala","chai"] }],
  "মসলা দুধ": [{ q: "spiced milk", must: ["spiced","milk"] }],
  "মসুর ডালের ভর্তা": [{ q: "masoor dal bhorta", must: ["masoor","dal","bhorta"] }],
  "মাগুর মাছের ঝোল": [{ q: "magur fish curry", must: ["magur","fish","curry"] }],
  "মাছের ডিম ভাজা": [{ q: "fish roe fry", must: ["fish","roe","fry"] }],
  "মাটন কষা": [{ q: "mutton kosha", must: ["mutton","kosha"] }],
  "মাটন বিরিয়ানি": [{ q: "mutton biryani", must: ["mutton","biryani"] }],
  "মালপোয়া": [{ q: "malpua", must: ["malpua"] }],
  "মাষকলাই ডাল": [{ q: "mashkalai dal", must: ["mashkalai","dal"] }],
  "মিষ্টি কুমড়ার ঘন্ট": [{ q: "sweet pumpkin ghonto", must: ["sweet","pumpkin","ghonto"] }],
  "মুগ ডালের খিচুড়ি": [{ q: "moong dal khichuri", must: ["moong","dal","khichuri"] }],
  "মুগ ডালের পকোড়া": [{ q: "moong dal pakora", must: ["moong","dal","pakora"] }],
  "মুরগির চাপ": [{ q: "chicken chaap", must: ["chicken","chaap"] }],
  "মুরগির ঝালফ্রাই": [{ q: "chicken jhal fry", must: ["chicken","jhal","fry"] }],
  "মুরগির দোপেঁয়াজা": [{ q: "chicken do pyaza", must: ["chicken","pyaza"] }],
  "মুরগির সমুচা": [{ q: "chicken samosa", must: ["chicken","samosa"] }],
  "রুই মাছের দই কোরমা": [{ q: "rohu yogurt korma", must: ["rohu","yogurt","korma"] }],
  "লইট্টা শুঁটকি ভর্তা": [{ q: "loitta dried fish bhorta", must: ["loitta","dried","fish","bhorta"] }],
  "লাল শাক ভাজি": [{ q: "red amaranth bhaji", must: ["red","amaranth","bhaji"] }],
  "লেবুর শরবত": [{ q: "lemon shorbot", must: ["lemon","shorbot"] }],
  "সবজি সিঙ্গারা": [{ q: "vegetable singara", must: ["vegetable","singara"] }],
  "সুজির হালুয়া": [{ q: "sooji halwa", must: ["sooji","halwa"] }],
  "হায়দরাবাদি চিকেন দম বিরিয়ানি": [{ q: "hyderabadi chicken dum biryani", must: ["hyderabadi","chicken","dum","biryani"] }],
  "হাঁসের মাংস ভুনা": [{ q: "duck bhuna", must: ["duck","bhuna"] }],
  "হাঁসের মাংসের ঝোল": [{ q: "duck curry", must: ["duck","curry"] }],
  'আলু ভর্তা': [{q:'aloo bhorta',must:['aloo','bhorta']},{q:'aloo bharta',must:['aloo','bharta']},{q:'potato bhorta',must:['potato','bhorta']}],
  'বাংলা আলুর চপ': [{q:'Bengali aloor chop',must:['aloor','chop']}],
  'কড়াইশুঁটির কচুরি': [{q:'matar kachori',must:['matar','kachori']},{q:'green peas kachori',must:['peas','kachori']}],
  'কাঁচা আমের ডাল': [{q:'green mango dal',must:['mango','dal']},{q:'raw mango lentil curry',must:['mango','lentil']}],
  'কাতলা মাছের কালিয়া': [{q:'catla fish kalia',must:['catla','kalia']},{q:'bengali catla fish curry',must:['catla','fish']}],
  'গোয়ালন্দ স্টিমার মুরগির ঝাল কারি': [{q:'Goalondo steamer chicken curry',must:['goalondo','chicken']},{q:'Goalando chicken curry',must:['chicken','curry']},{q:'Goalondo steamer train chicken',must:['goalondo','chicken']}],
  'ঘরোয়া চিকেন বিরিয়ানি': [{q:'chicken biryani',must:['chicken','biryani']}],
  'চট্টগ্রামের বিফ কালা ভুনা': [{q:'beef kala bhuna',must:['beef','kala','bhuna']},{q:'kala bhuna',must:['kala','bhuna']}],
  'চিকেন কষা': [{q:'chicken kosha',must:['chicken','kosha']},{q:'kosha murgir mangsho',must:['kosha','murgi']}],
  'বাংলা স্টাইলে মাছের ঝোল': [{q:'Rohu fish curry',must:['rohu','fish','curry']},{q:'Bengali fish curry',must:['fish','curry']}],
  'চিংড়ি ভর্তা': [{q:'chingri bhorta',must:['chingri','bhorta']},{q:'shrimp bhorta',must:['shrimp','bhorta']},{q:'prawn bhorta',must:['prawn','bhorta']},{q:'Bengali shrimp mash bhorta',must:['shrimp','bhorta']}],
  'চিতই পিঠা': [{q:'chitoi pitha',must:['chitoi','pitha']},{q:'chitai pitha',must:['chitai','pitha']}],
  'ঝটপট ডিমের কারি': [{q:'Bengali egg curry',must:['egg','curry']}],
  'টমেটো-খেজুর চাটনি': [{q:'tomato date chutney',must:['tomato','date','chutney']},{q:'Bengali tomato khajur chutney',must:['tomato','chutney']}],
  'ডিম পোস্ত': [{q:'dim posto',must:['dim','posto']},{q:'egg posto',must:['egg','posto']},{q:'egg poppy seed curry',must:['egg','poppy']}],
  'ঢাকাই বাকরখানি': [{q:'Dhakai bakarkhani',must:['bakarkhani']},{q:'bakarkhani bread',must:['bakarkhani']}],
  'ঢাকাই বিফ তেহারি': [{q:'Dhakai beef tehari',must:['beef','tehari']},{q:'beef tehari',must:['beef','tehari']},{q:'Bangladeshi beef tehari rice',must:['beef','tehari']}],
  'ঢাকাই বোরহানি': [{q:'Bangladeshi borhani drink',must:['borhani']},{q:'borhani yogurt drink',must:['borhani']}],
  'ঢাকাই ভুনা খিচুড়ি': [{q:'bhuna khichuri',must:['bhuna','khichuri']},{q:'bhuna khichdi',must:['bhuna','khichdi']}],
  'ঢাকাই মোরগ পোলাও': [{q:'morog polao',must:['morog','polao']},{q:'Bangladeshi chicken pulao',must:['chicken','pulao']}],
  'তেলে কই মাছ': [{q:'koi fish Bengali curry',must:['koi','fish']},{q:'climbing perch fish curry',must:['perch','curry']}],
  'দই মাছ': [{q:'doi mach Bengali fish curry',must:['doi','mach']},{q:'doi maach',must:['doi','maach']},{q:'yogurt fish curry Bengali',must:['yogurt','fish','curry']}],
  'নিরামিষ আলুর দম': [{q:'Bengali aloo dum',must:['aloo','dum']},{q:'aloor dum',must:['aloor','dum']}],
  'পটলের দোরমা': [{q:'potoler dorma',must:['potoler','dorma']},{q:'pointed gourd stuffed curry',must:['gourd','stuffed']}],
  'পোড়া বেগুন ভর্তা': [{q:'begun bhorta',must:['begun','bhorta']},{q:'roasted eggplant bharta',must:['eggplant','bharta']}],
  'বাঙালি ডিমের ডেভিল': [{q:'Bengali egg devil',must:['egg','devil']},{q:'Indian egg chop',must:['egg','chop']}],
  'বাঙালি লাবড়া': [{q:'Bengali labra mixed vegetables',must:['labra']},{q:'labra Bengali vegetable curry',must:['labra']}],
  'বাঙালি শুকতো': [{q:'Bengali shukto',must:['shukto']},{q:'Bengali shukto vegetable stew',must:['shukto']}],
  'বাংলা পাতলা খিচুড়ি': [{q:'Bengali khichuri',must:['khichuri']},{q:'Bengali khichdi',must:['khichdi']}],
  'বাসন্তী পোলাও': [{q:'Basanti pulao',must:['basanti','pulao']},{q:'Bengali basanti polao',must:['basanti','polao']}],
  'বেগুন ভাজা': [{q:'begun bhaja',must:['begun','bhaja']},{q:'Indian fried eggplant Bengali',must:['eggplant','fried']}],
  'ভাজা মুগ ডাল': [{q:'bhaja mug dal',must:['bhaja','mug','dal']},{q:'bhaja moong dal',must:['bhaja','moong','dal']},{q:'Bengali roasted moong dal',must:['moong','dal']}],
  'ভাপা চিংড়ি': [{q:'bhapa chingri',must:['bhapa','chingri']},{q:'steamed Bengali prawns',must:['steamed','prawns']}],
  'ভাপা দই': [{q:'bhapa doi',must:['bhapa','doi']},{q:'Bengali steamed yogurt dessert',must:['steamed','yogurt','dessert']}],
  'মাছের মাথা দিয়ে মুগ ডাল': [{q:'Bengali moong dal fish head',must:['dal','fish','head']},{q:'muri ghonto fish head rice',must:['muri','ghonto']}],
  'রাধাবল্লভী কচুরি': [{q:'radhaballabhi kachori',must:['radhaballabhi']},{q:'radhaballavi kachuri',must:['radhaballavi']},{q:'radhaballabhi luchi',must:['radhaballabhi']}],
  'লাউশাকের চচ্চড়ি': [{q:'lau shak chorchori',must:['lau','shak','chorchori']},{q:'bottle gourd leaves Bengali curry',must:['gourd','leaves']}],
  'শুঁটকি ভুনা': [{q:'shutki bhuna',must:['shutki','bhuna']},{q:'shutki bhuna Bangladesh',must:['shutki','bhuna']},{q:'Bangladeshi dried fish bhuna',must:['dried','fish','bhuna']}],
  'সবজি খিচুড়ি': [{q:'vegetable khichuri',must:['vegetable','khichuri']},{q:'vegetable khichdi',must:['vegetable','khichdi']}],
  'সরিষা ঢেঁড়স': [{q:'mustard okra curry',must:['mustard','okra']},{q:'bhindi mustard curry',must:['bhindi','mustard']}],
  'সরিষা পাবদা': [{q:'shorshe pabda',must:['shorshe','pabda']},{q:'pabda mustard fish curry',must:['pabda','mustard']}],
  'সিলেটি সাতকরা গরুর মাংস': [{q:'Sylheti beef satkara',must:['beef','satkara']},{q:'beef shatkora curry',must:['beef','shatkora']}]
};

const stripHtml = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const norm = value => String(value ?? '').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const clean = value => String(value ?? '').trim();
/**
 * Alternate public URLs for a Commons photo when the saved thumbnail fails.
 * Wikimedia is migrating thumbnails between hostnames; use the legacy upload
 * hostname as a first retry, then Commons' redirect endpoint as a last resort.
 * Only trusted HTTPS Wikimedia hosts are accepted.
 */
export function getPhotoFallbackUrls(imageUrl, sourceUrl) {
  const original = clean(imageUrl);
  const fallbacks = [];

  try {
    const image = new URL(original);
    if (image.protocol === 'https:' && image.hostname.toLowerCase() === 'thumb.wikimedia.org') {
      image.hostname = 'upload.wikimedia.org';
      if (image.href !== original) fallbacks.push(image.href);
    }
  } catch {
    // Invalid image URLs simply have no hostname fallback.
  }

  try {
    const source = new URL(clean(sourceUrl));
    if (source.protocol !== 'https:' || source.hostname.toLowerCase() !== 'commons.wikimedia.org') {
      return [...new Set(fallbacks)];
    }

    const pathname = decodeURIComponent(source.pathname);
    if (!pathname.startsWith('/wiki/')) return [...new Set(fallbacks)];
    const pageTitle = pathname.slice('/wiki/'.length);
    if (!/^File:/i.test(pageTitle)) return [...new Set(fallbacks)];

    const filename = pageTitle.replace(/^File:/i, '').trim().replace(/ /g, '_');
    if (!filename || filename.includes('..')) return [...new Set(fallbacks)];

    // The canonical Commons redirect works even when an older thumbnail URL
    // has gone stale or the CDN has changed the preferred URL.
    const redirect = 'https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/'
      + encodeURIComponent(filename) + '&width=1200';
    if (redirect !== original) fallbacks.push(redirect);
  } catch {
    // Keep any safe hostname fallback already collected.
  }

  return [...new Set(fallbacks)].filter(url => url !== original);
}

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

/**
 * Conservative homepage-photo check. Photo metadata can establish reuse rights
 * without proving the depicted dish matches the recipe. For the carousel, only
 * render a photo when its Wikimedia source filename contains the recipe's
 * required identifying terms. If it cannot be verified, use the dish-labelled
 * placeholder rather than risk showing the wrong food.
 */
export function isDishSpecificPhotoTitle(recipe) {
  const title = clean(recipe?.title);
  const sourceUrl = clean(recipe?.image_source_url);
  if (!title || !sourceUrl || !hasCompleteRecipePhoto(recipe)) return false;

  let sourceTitle = '';
  try {
    const pathname = decodeURIComponent(new URL(sourceUrl).pathname);
    sourceTitle = pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return false;
  }

  sourceTitle = sourceTitle
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]{2,6}$/i, '')
    .replace(/[_-]+/g, ' ');
  const searchable = norm(sourceTitle);
  if (!searchable) return false;

  // A vegetarian slide must not show a source filename that identifies meat,
  // fish, eggs or seafood, even if it also mentions vegetables or rice.
  if (recipe?.category === 'নিরামিষ' && /\b(chicken|mutton|beef|meat|fish|egg|prawn|shrimp|lamb|pork)\b/i.test(searchable)) {
    return false;
  }

  const aliases = ALIASES[title];
  if (aliases?.length) {
    return aliases.some(({ must }) => Array.isArray(must) && must.length > 0
      && must.every(term => searchable.includes(norm(term))));
  }

  // English/transliterated recipe names can be checked token by token.
  // Unknown Bengali titles are intentionally conservative until an explicit
  // photo-search alias is added.
  if (/[A-Za-z]/.test(title)) {
    const tokens = norm(title).split(' ').filter(token => token.length > 2 && !STOP.has(token));
    return tokens.length > 0 && tokens.every(token => searchable.includes(token));
  }
  return searchable.includes(norm(title));
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
