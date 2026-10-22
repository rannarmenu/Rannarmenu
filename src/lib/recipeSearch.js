/**
 * Multilingual recipe-search helpers.
 * Exact text remains searchable in any script stored in recipe content.
 * Curated aliases bridge common food terms across Bengali, English, romanized
 * Bangla, Hindi, Urdu, Arabic, Spanish, French, Portuguese, Chinese and Japanese.
 */
export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[’‘`´]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const ALIAS_GROUPS = [
  ['biryani','biriyani','biriani','বিরিয়ানি','বিরিয়ানি','বিরানী','बिरयानी','بریانی','بریاني','برياني'],
  ['pulao','polao','pilaf','pilau','পোলাও','পুলাও','पुलाव','پلاو','پلو','plov','抓饭'],
  ['rice','চাল','চাউল','ভাত','bhaat','bhat','chaal','chawal','chaawal','arroz','riz','رز','أرز','چاول','चावल','米饭','ご飯'],
  ['chicken','চিকেন','মুরগি','মুরগির','মুরগী','মুরগীর','মোরগ','murgi','murghi','murgh','murga','murgir','मुर्गी','मुर्गा','चिकन','مرغ','مرغی','دجاج','pollo','poulet','frango','鸡肉','雞肉','鶏肉'],
  ['beef','বিফ','গরু','গরুর','গরুর মাংস','গো-মাংস','goru','gorur','gorur mangsho','गोमांस','گائے کا گوشت','لحم بقري','boeuf','bœuf','carne de res','ternera','牛肉'],
  ['mutton','lamb','goat','খাসি','খাসির','খাসির মাংস','ছাগল','ছাগলের','khasi','khashir','羊肉','बकरे का मांस','مٹن','لحم الضأن','cordero','agneau'],
  ['meat','মাংস','মাংসের','gosht','গোশত','گوشت','carne','viande','肉','मांस'],
  ['fish','মাছ','মাছের','মাছে','maach','machh','mach','machher','machli','machhli','मछली','سمك','ماهی','peixe','poisson','pescado','鱼','魚','さかな'],
  ['shrimp','prawn','চিংড়ি','চিংড়ি','চিংড়ির','chingri','ঝিনুক','झींगा','جھینگا','جمبري','میگو','crevette','gamba','camarão','虾','エビ'],
  ['egg','eggs','ডিম','ডিমের','dim','dimer','anda','انڈا','अंडा','अंडे','بيض','بيضة','oeuf','œuf','huevo','ovo','卵','蛋'],
  ['dal','daal','dhal','lentil','lentils','ডাল','মসুর','মুসুর','মসুর ডাল','মুগ ডাল','masoor','masur','moong','दाल','मसूर','عدس','دال','lentille','lenteja','豆类'],
  ['potato','alu','aloo','আলু','আলুর','आलू','بطاطس','patata','pomme de terre','batata','土豆','马铃薯'],
  ['tomato','টমেটো','টমেটোর','tamatar','टमाटर','طماطم','tomate','番茄','トマト'],
  ['onion','পেঁয়াজ','পেঁয়াজ','পেঁয়াজের','peyaj','piyaj','pyaj','प्याज','پیاز','بصل','oignon','cebolla','cebola','洋葱'],
  ['garlic','রসুন','রসুনের','roshun','lashun','लहसुन','لہسن','ثوم','ail','ajo','alho','大蒜'],
  ['ginger','আদা','আদার','ada','adrak','अदरक','ادرک','زنجبيل','gingembre','jengibre','姜'],
  ['chili','chilli','chile','pepper','মরিচ','মরিচের','লঙ্কা','ঝাল','morich','lonka','mirch','मिर्च','مرچ','فلفل','piment','pimenta','辣椒'],
  ['curry','কারি','কারী','তরকারি','ঝোল','jhol','torkari','tarkari','करी','سالن','مرق','كاري','咖喱','カレー'],
  ['fried','fry','ভাজা','ভাজি','bhaja','bhaji','fritto','frito','مقلي','तला','油炸'],
  ['soup','সুপ','স্যুপ','shorba','شوربة','sopa','soupe','汤','スープ'],
  ['noodles','noodle','নুডলস','নুডল','chowmein','চাউমিন','चाउमीन','نوڈلز','nouilles','fideos','macarrão','面条','ラーメン'],
  ['bread','রুটি','রুটির','ruti','roti','chapati','naan','নান','পাউরুটি','pan','pain','pão','خبز','रोटी','面包'],
  ['paratha','parota','porota','পরোটা','পরাঠা','parantha','पराठा','پراٹھا','パラタ'],
  ['pitha','pithe','পিঠা','পিঠে','পিঠার','पीठा','پیتھا','rice cake','mochi','年糕'],
  ['vegetable','vegetables','veg','সবজি','সব্জি','শাকসবজি','shobji','sabji','sabzi','सब्जी','سبزی','verdura','verduras','légumes','legumes','vegetais','蔬菜','野菜'],
  ['dessert','sweet','sweets','মিষ্টি','মিষ্টান্ন','মিঠাই','mishti','misti','mithai','मिठाई','میٹھا','حلوى','dulce','doce','甜点','デザート'],
  ['yogurt','yoghurt','curd','দই','দইয়ের','দইয়ের','doi','dahi','দধি','दही','دہی','yaourt','yogur','iogurte','酸奶','ヨーグルト'],
  ['milk','দুধ','দুধের','dudh','doodh','दूध','دودھ','حليب','lait','leche','leite','牛奶'],
  ['tea','chai','চা','চায়ের','চায়ের','cha','চাই','चाय','چائے','شاي','thé','té','chá','茶','お茶'],
  ['khichuri','khichdi','khichri','kichuri','খিচুড়ি','খিচুড়ি','খিচুরি','खिचड़ी','کھچڑی','kichadi'],
  ['bhorta','bharta','ভর্তা','ভর্তার','भरता','بھرتا'],
  ['kebab','kabab','কাবাব','কাবাবের','कबाब','کباب','كباب','brochette','espetinho','烤肉串'],
  ['roshogolla','rossogolla','rasgulla','rasagulla','রসগোল্লা','রসগোলা','রসোগোল্লা','रसगुल्ला','رسگلہ'],
  ['mishti doi','sweet yogurt','sweet curd','মিষ্টি দই','mishti doi','misti doi','मिष्टी दोई'],
  ['chotpoti','chatpati','চটপটি','চটপটির','चटपटी'],
  ['fuchka','phuchka','pani puri','golgappa','ফুচকা','ফুচকার','पानी पूरी','गोलगप्पा','پانی پوری','panipuri'],
  ['haleem','halim','হালিম','হালিমের','حلیم','हलीम'],
  ['dosa','dosai','দোসা','ডোসা','डोसा','دوسا','ドーサ'],
  ['samosa','singara','সিঙ্গারা','সমুচা','সমোসা','سموسہ','سمبوسة','サモサ'],
  ['bhuna','ভুনা','ভুনার','भुना','بھنا'],
  ['kala','kalo','কালা','কালো','काला','کالا'],
  ['omelette','omelet','অমলেট','ডিমের অমলেট','آملیٹ','tortilla francesa','omelete','オムレツ']
];

const ALIAS_LOOKUP = new Map();
for (const group of ALIAS_GROUPS) {
  const variants = [...new Set(group.map(normalizeSearchText).filter(Boolean))];
  for (const alias of variants) {
    if (!ALIAS_LOOKUP.has(alias)) ALIAS_LOOKUP.set(alias, variants);
  }
}

const STOP_WORDS = new Set([
  'recipe','recipes','food','dish','how','to','make','cook','cooking','for','the','a','an','and','with','of','in','on','please','best',
  'রেসিপি','রান্না','তৈরি','প্রণালী','বানানো','কিভাবে','করুন',
  'रेसिपी','खाना','पकाने','कैसे','बनाने',
  'وصفة','طريقة','طبخ',
  'receta','recetas','cómo','como','comida','cocina','de','la','el','las','los','una','un','para',
  'recette','recettes','cuisiner','le','les','des','du','une',
  'receita','receitas','cozinha','fazer','do','da','dos','das',
  '菜谱','食谱','做法','料理','レシピ'
].map(normalizeSearchText));

export function buildRecipeSearchGroups(query) {
  const tokens = normalizeSearchText(query).split(' ').filter(Boolean);
  const meaningful = tokens.filter(token => !STOP_WORDS.has(token));
  const selected = (meaningful.length ? meaningful : tokens).slice(0, 8);
  return selected.map(token => {
    const aliases = ALIAS_LOOKUP.get(token) || [token];
    return [...new Set([token, ...aliases].map(normalizeSearchText).filter(Boolean))].slice(0, 36);
  });
}

function valuesToText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(valuesToText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(valuesToText).join(' ');
  return '';
}

export function recipeMatchesSearch(recipe, queryOrGroups) {
  const groups = typeof queryOrGroups === 'string'
    ? buildRecipeSearchGroups(queryOrGroups)
    : (Array.isArray(queryOrGroups) ? queryOrGroups : []);
  if (!groups.length) return true;
  const source = [
    recipe?.title, recipe?.slug, recipe?.summary, recipe?.desc, recipe?.category,
    recipe?.cuisine, recipe?.tags, recipe?.ingredients, recipe?.instructions, recipe?.steps
  ].map(valuesToText).join(' ');
  const haystack = normalizeSearchText(source);
  return groups.every(group => group.some(alias => {
    const needle = normalizeSearchText(alias);
    return needle && haystack.includes(needle);
  }));
}
