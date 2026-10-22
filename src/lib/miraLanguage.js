import { normalizeSearchText } from './recipeSearch.js';

const FILLER_WORDS = new Set([
  // English
  'i','me','my','mine','we','us','our','you','your','yours','the','a','an','and','or','to','for','of','with',
  'please','pls','plz','can','could','would','will','give','find','show','open','want','need','like','make',
  'cook','cooking','recipe','recipes','food','dish','some','one','this','that','how','what','is','are','do','does',
  'help','me','it','in','on','at','from','about','tell','say','suggest','recommend','please','any','good','best','easy','simple','quick','healthy','tasty','delicious','cheap','budget','new','some',
  // Romanized Bangla / Banglish
  'ami','amra','amar','amake','amader','apni','apnar','tumi','tomar','tomake','tomader','se','ora','oder',
  'ei','oi','eta','seta','etar','otar','ekhane','okhane','e','te','ta','tar','er','r','ar','theke','jonno',
  'ektu','ekta','ekti','kisu','kichu','kono','kon','ki','kivabe','kibhabe','kothay','kothai','kokhon','keno',
  'dao','den','daw','dekhaw','dekhao','bolo','bolen','bolbe','dibe','diben','khule','khulo','khuje','khujte',
  'khujhe','ber','kore','koro','korun','korte','korbo','korben','korchi','korche','kortese','kortesey',
  'hocche','hochhe','hoche','hoy','hobe','ache','ase','nai','nei','na','naki','chai','chay','lagbe','dorkar',
  'ranna','rannar','rannna','rante','rannae','banate','banabo','banai','banao','banaw','banie','toiri','koro',
  'khabo','khaite','khete','khabar','khabar-ta','khawar','khawa','khaowar','taile','tahole','ar','aar',
  'ekhon','ajke','aj','kal','kalke','please','plz','bro','bhai','apu','vai','tahole','shob','sob','shobgulo',
  // Bengali
  'আমি','আমরা','আমার','আমাকে','আমাদের','আপনি','আপনার','তুমি','তোমার','তোমাকে','তোমাদের','একটু','একটা','একটি',
  'দাও','দেন','দেখাও','বলো','বলুন','খুলে','খুঁজে','খুঁজতে','করে','করো','করুন','করতে','করবো','করবেন','হচ্ছে',
  'হবে','আছে','নেই','না','চাই','লাগবে','দরকার','রান্না','রান্নার','বানাতে','বানাবো','তৈরি','খাবো','খেতে','খাবার',
  'কিছু','কোন','কোনো','কি','কী','কিভাবে','কীভাবে','কোথায়','কোথায়','কখন','কেন','জন্য','থেকে','আর','এটা','ওটা',
  'এই','ওই','এখানে','ওখানে','ভালো','সেরা','একজন','প্লিজ','সাহায্য','আমায়','আমায়',
  // Hindi
  'मुझे','मेरी','मेरा','एक','और','का','की','के','को','से','में','है','क्या','कैसे','बताओ','दो','बनाओ','रेसिपी','खाना',
  // Spanish/French/German/Arabic/Chinese/Japanese common fillers
  'quiero','receta','recetas','por','favor','una','un','el','la','los','las','de','del','para','je','veux','une',
  'des','du','le','les','suis','comment','ich','möchte','ein','eine','rezept','rezepte','kochen','bitte','was','wie',
  'اريد','أريد','وصفة','وصفات','من','فضلك','كيف','اعطني','اعطيني','レシピ','料理','ください','菜谱','食谱','做法','请','给我'
].map(normalizeSearchText));

const GREETINGS = /(^|\s)(hi|hello|hey|hiya|hii|hiii|hola|bonjour|salut|hallo|namaste|assalamu alaikum|salam|হাই|হ্যালো|নমস্কার|আসসালামু আলাইকুম|السلام عليكم|你好|こんにちは|नमस्ते|ہیلو|مرحبا)(\s|$)/u;
const THANKS = /(thank you|thanks|thx|tysm|dhonnobad|onek dhonnobad|thanks bro|ধন্যবাদ|অনেক ধন্যবাদ|شكرا|شكرًا|gracias|merci|danke|ありがとう|谢谢|धन्यवाद)/u;
const WEBSITE_WORDS = /(website|web site|webpage|site|sait|search|search bar|save|saved|bookmark|menu|button|open hocche na|kaj korche na|kaj kortese na|kaj kortese na|pacchi na|pachchi na|dekhte pacchi na|khujte pacchi na|kothay pabo|kivabe use|kibhabe use|kivabe chalabo|kibhabe chalabo|website e|site e|ওয়েবসাইট|ওয়েবসাইট|সাইট|সার্চ|সংরক্ষণ|সেভ|মেনু|বাটন|খুলছে না|কাজ করছে না|কাজ করছে না|পাচ্ছি না|কোথায় পাব|কোথায় পাব|ব্যবহার কর)/u;
const HELP_VERBS = /(help|problem|issue|error|not working|doesn't work|doesnt work|can't|cannot|kaj hocche na|kaj kortese na|kaj korche na|open hocche na|pacchi na|pachchi na|kivabe|kibhabe|kothay|kothai|keno|ki kore|ki korbo|bujhi na|bujhtesi na|bujhte parchi na|bujhlam na|bujhai|bujhiye|how do i|how to|where do i|how can i|সাহায্য|সমস্যা|কাজ করছে না|কিভাবে|কীভাবে|কোথায়|কোথায়|কেন|কি করব|কী করব|বুঝি না|বুঝতে পারছি না|বুঝিয়ে|কীভাবে করব)/u;
const RECIPE_TERMS = /(recipe|recipes|ranna|rannar|rante|rannna|banate|banabo|banao|khaite|khabo|khete chai|khabar|food|dish|meal|cook|cooking|biryani|biriyani|biriani|polao|pulao|khichuri|khichdi|ilish|hilsa|rui|rohu|katla|mach|macher|machher|dim|dimer|egg|chicken|murgi|murgir|beef|gorur|mutton|khasi|dal|daal|aloo|alu|bhorta|bhaji|pitha|mishti|doi|fuchka|chotpoti|kabab|kebab|রেসিপি|রান্না|রাঁধ|খাবার|খেতে|তরকারি|বিরিয়ানি|বিরিয়ানি|পোলাও|খিচুড়ি|খিচুড়ি|ইলিশ|রুই|কাতলা|মাছ|মাছের|ডিম|মুরগি|মুরগির|গরুর|খাসি|ডাল|আলু|ভর্তা|ভাজি|পিঠা|মিষ্টি|দই|ফুচকা|চটপটি|কাবাব|विधि|रेसिपी|खाना|وصفة|وصفات|cocinar|receta|recettes?|kochen|rezept|レシピ|料理|菜谱|食谱|做法)/u;
const COOKING_PROBLEM = /(problem|issue|fix|solution|help|substitute|alternative|replace|badle ki|ki diye|how long|koto khon|kotokkhon|koto somoy|kivabe thik|ki korbo|hocche na|hoy na|hoy nai|valo hoy nai|valo hocche na|kacha ache|murgi kacha|chicken kacha|kacha chicken|bhalo hocche na|bhalo hoy na|thik hocche na|pure geche|puriye geche|jole geche|jole jacche|lobon beshi|nun beshi|jhal beshi|morich beshi|jhol patla|jhol ghono|kacha thake|siddo hoy na|shukna hoye|naram hoy na|hard hoye|overcook|undercook|burnt|burned|too salty|too spicy|too watery|too dry|not cooked|recipe ta fail|ranna ta fail|সমস্যা|ঠিক হচ্ছে না|পুড়ে গেছে|পুড়ে গেছে|লবণ বেশি|ঝাল বেশি|ঝোল পাতলা|কাঁচা থাকে|সেদ্ধ হয় না|সেদ্ধ হয় না|শুকনা হয়ে|সমাধান|কী করব)/u;

const normalize = value => normalizeSearchText(value)
  .replace(/\b(ki|khi|kee)\b/g, 'ki')
  .replace(/\b(biriyani|biriani|biryanee|biryanni)\b/g, 'biryani')
  .replace(/\b(kichuri|khichri|kichri)\b/g, 'khichuri')
  .replace(/\b(machh|maach|machher|macher|machir)\b/g, 'mach')
  .replace(/\b(murgi|murghi|murgir|murghir)\b/g, 'chicken')
  .replace(/\b(gorur|goru)\b/g, 'beef')
  .replace(/\b(aloo)\b/g, 'alu')
  .replace(/\b(daal|dhal)\b/g, 'dal')
  .replace(/\b(piyaj|peyaj|pyaj)\b/g, 'onion')
  .replace(/\b(roshun|lashun)\b/g, 'garlic')
  .replace(/\b(dudh|doodh)\b/g, 'milk')
  .replace(/\b(ada|adrak)\b/g, 'ginger')
  .replace(/\b(ruti|roti|porota|parantha)\b/g, 'paratha');

export function normalizeBanglishText(value) {
  return normalize(value).replace(/\s+/g, ' ').trim();
}

export function cleanBanglishRecipeQuery(value) {
  const original = normalizeBanglishText(value);
  const tokens = original.split(' ').filter(Boolean);
  const kept = tokens.filter(token => !FILLER_WORDS.has(token));
  return kept.join(' ').trim();
}

export function detectBanglish(value) {
  const text = normalizeSearchText(value);
  return /\b(ami|amake|amar|apni|apnar|tumi|tomar|kivabe|kibhabe|kothay|kothai|chai|lagbe|dorkar|ranna|korte|korbo|khujhe|khuje|dekhaw|dao|den|bujhi|bujhte|pacchi|pachchi|hocche|kortese|hoyna|hoy na|ki korbo|ki chai|khabar|biryani|biriyani|murgi|mach|machher|dimer|dim|ilish|khichuri|polao)\b/u.test(text);
}

export function classifyMiraIntent(value) {
  const text = normalizeBanglishText(value);
  if (!text) return 'empty';
  if ((GREETINGS.test(text) || /(kemon acho|kemon aso|kmn acho|kmn aso|valo acho|bhalo acho|ki khobor|ki obostha|ki koro mira|tumi ki koro|ki korcho|ki korteso|kemne acho|kemne aso)/u.test(text)) && text.split(' ').length <= 10) return 'greeting';
  if (THANKS.test(text)) return 'thanks';
  if (/(who are you|what is your name|your name|tumi ke|tomar nam|tomar naam|apni ke|ke tumi|তুমি কে|তোমার নাম|আপনি কে)/u.test(text)) return 'identity';
  if (/(what can you do|how can you help|tumi ki korte paro|ki ki paro|ki help korte paro|তুমি কী করতে পার|কী সাহায্য করতে পার)/u.test(text)) return 'capabilities';
  if (/(^|\\s)(help|help me|ektu help|ektu help koro|ektu sahajjo|sahajjo koro|bujhi na|bujhte parchi na|bujhtesi na|confused|i am confused|i'm confused|সাহায্য|একটু সাহায্য|বুঝি না|বুঝতে পারছি না)(\\s|$)/u.test(text)) return 'website_help';
  if (WEBSITE_WORDS.test(text) && (HELP_VERBS.test(text) || /(search bar|save recipe|saved recipe|website e|site e|search korte|kothay pabo|kivabe|kibhabe|কোথায় পাব|কোথায় পাব)/u.test(text))) return 'website_help';
  if (COOKING_PROBLEM.test(text)) return 'cooking_problem';
  const looksLikeRequest = /(recipe|recipes|ranna|rannar|rante|ranna korte|ranna korbo|banate chai|ki banabo|ki ranna|ki khabo|recipe dao|recipe den|recipe chai|khujhe dao|khuje dao|find me|give me|show me|make me|cook me|খুঁজে দাও|রেসিপি দাও|রেসিপি চাই|কী রান্না|কি রান্না|কি বানাব|কী বানাব|কী খাব|কি খাব|খাবার দাও|রান্না করতে চাই|রান্না করব|রান্না কীভাবে)/u.test(text);
  if (looksLikeRequest && (!RECIPE_TERMS.test(text) || !cleanBanglishRecipeQuery(text))) return 'generic_recipe_request';
  if (looksLikeRequest || (RECIPE_TERMS.test(text) && /(ami|amar|amake|chai|lagbe|dorkar|dao|den|korte|korbo|recipe|ranna|খুঁজে|চাই|দাও|দেন|করতে|করব)/u.test(text))) return 'recipe_search';
  if (HELP_VERBS.test(text) && /(ranna|recipe|food|khabar|kivabe|kibhabe|biryani|biriyani|murgi|mach|dim|how|what|how to|কীভাবে|কেন|কী করব)/u.test(text)) return 'cooking_problem';
  return 'general';
}

export function getCookingTroubleshootingReply(value) {
  const text = normalizeBanglishText(value);
  if (/(how long|koto khon|kotokkhon|koto somoy|কতক্ষণ|কত সময়|কত সময়)/u.test(text) && /(chicken|murgi|মুরগি|মুরগির)/u.test(text)) {
    return 'মুরগির টুকরোর আকার আর রান্নার ধরন অনুযায়ী সময় বদলায়। 🍗 ঝোলের মুরগি সাধারণত মাঝারি আঁচে প্রায় ২০–৩০ মিনিট লাগতে পারে, তবে ভেতর পর্যন্ত পুরো সেদ্ধ হওয়া জরুরি। সবচেয়ে নিরাপদ হলো মোটা অংশে ভেতরের তাপমাত্রা ৭৪°C (১৬৫°F) হওয়া নিশ্চিত করা। হাড়সহ বড় টুকরোয় আরও সময় লাগতে পারে।';
  }
  if (/(substitute|alternative|replace|badle ki|ki diye|nei|পাই না|নেই|বদলে কী|কী দিয়ে)/u.test(text) && /(ingredient|upokoron|masala|মসলা|উপকরণ|দই|doi|cream|ক্রিম)/u.test(text)) {
    return 'উপকরণ না থাকলে আগে কোন উপকরণটা নেই আর কী রান্না করছ সেটা বলো। 🌼 সব উপকরণ একে অন্যের বদলি হয় না—নাম জানালে স্বাদ ও texture যতটা সম্ভব ঠিক রেখে নিরাপদ বিকল্প সাজেস্ট করব।';
  }
  if (/(lobon beshi|nun beshi|too salty|excess salt|লবণ বেশি|নুন বেশি)/u.test(text)) {
    return 'আহা, নুন-লবণ একটু বেশি হয়ে গেছে? 🥄 তরকারি হলে অল্প গরম পানি বা লবণহীন ঝোল যোগ করো; ডাল হলে আরও সেদ্ধ ডাল/পানি মেশাও। ঝোল পাতলা হয়ে গেলে ঢাকনা খুলে কিছুক্ষণ ফুটিয়ে নাও। একবারে অনেক পানি দিও না—অল্প অল্প করে স্বাদ দেখে ঠিক করো।';
  }
  if (/(jhal beshi|morich beshi|too spicy|too hot|ঝাল বেশি|মরিচ বেশি)/u.test(text)) {
    return 'ওফ, ঝাল তো দুষ্টুমি করছে! 🌶️ ডিশ অনুযায়ী একটু দই, দুধ/নারকেলের দুধ, বা লবণহীন ঝোল/সবজি যোগ করলে ঝাল কমতে পারে। লেবু বা চিনি বেশি দিয়ে ঢেকে ফেলো না—অল্প করে স্বাদ দেখে সমন্বয় করো।';
  }
  if (/(jhol patla|too watery|watery curry|ঝোল পাতলা)/u.test(text)) {
    return 'ঝোল পাতলা? 😺 ঢাকনা খুলে মাঝারি আঁচে কিছুক্ষণ ফুটাও, যাতে বাড়তি পানি উবে যায়। চাইলে সামান্য পেঁয়াজ-মসলা কষিয়ে মেশাও। মাংস বা মাছ অতিরিক্ত সেদ্ধ হচ্ছে কি না দেখে নিও।';
  }
  if (/(pure geche|puriye geche|jole geche|burnt|burned|পুড়ে গেছে|পুড়ে গেছে|জ্বলে গেছে)/u.test(text)) {
    return 'উফ, পুড়ে গেলে আগে চুলা বন্ধ করো। 🔥 ওপরের না-পোড়া অংশটা নাড়াচাড়া না করে অন্য পাত্রে তুলে নাও—তলায় লেগে থাকা অংশ ঘষে মেশাবে না, তাতে পোড়া গন্ধ ছড়ায়। খুব বেশি পুড়ে গেলে স্বাদ পুরো ফেরানো সম্ভব নাও হতে পারে।';
  }
  if (/(kacha thake|kacha ache|chicken kacha|kacha chicken|siddo hoy na|not cooked|undercooked|কাঁচা থাকে|সেদ্ধ হয় না|সেদ্ধ হয় না)/u.test(text)) {
    return 'ভিতরে কাঁচা থাকলে অল্প গরম পানি দিয়ে ঢেকে কম-মাঝারি আঁচে আরও রান্না করো, মাঝেমধ্যে দেখে নিও। 🍲 মুরগি হলে ভেতর পর্যন্ত সম্পূর্ণ সেদ্ধ হয়েছে কি না নিশ্চিত করো—শুধু বাইরের রং দেখে নিরাপদ ধরে নিও না।';
  }
  if (/(biryani|khichuri|rice|chal|bhaat|ভাত|বিরিয়ানি|বিরিয়ানি|খিচুড়ি|খিচুড়ি)/u.test(text) && /(jhorjhore|jhure|sticky|mushy|lepe|lepe geche|naram|soft|ঝরঝরে|নরম|আঠালো)/u.test(text)) {
    return 'চাল ঝরঝরে করতে 🍚 চালের ধরন অনুযায়ী পানি মাপো, চাল ধুয়ে অতিরিক্ত পানি ঝরিয়ে নাও, আর বারবার নেড়ো না। দমের সময় ঢাকনা বন্ধ রাখো। ভাত ইতিমধ্যে বেশি নরম হলে আর পানি দিও না—ঢাকনা খুলে খুব কম আঁচে কিছুক্ষণ রাখো।';
  }
  return 'চলো, সমস্যা ঠিক করি! 🌼 কী হয়েছে একটু বলো—যেমন “jhol patla”, “lobon beshi”, “chicken kacha”, বা “biryani lepe geche”। কোন রান্না করছ আর কী সমস্যা হচ্ছে জানালে ধাপে ধাপে উপায় বলব।';
}


/** Resolve short follow-up choices against a currently displayed recipe list. */
export function getRecipeSelectionIndex(value, count) {
  const size = Number(count);
  if (!Number.isInteger(size) || size < 1) return null;
  const text = normalizeBanglishText(value)
    .replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)))
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;

  const selectors = [
    { index: 0, pattern: /(^|\s)(first|first one|1st|number one|no 1|prothom|prothom ta|প্রথম|প্রথমটা|১ নম্বর|নম্বর ১)(\s|$)/u },
    { index: 1, pattern: /(^|\s)(second|second one|2nd|number two|no 2|ditiyo|ditio|ditiyo ta|দ্বিতীয়|দ্বিতীয়|দ্বিতীয়টা|দ্বিতীয় টি|২ নম্বর|নম্বর ২)(\s|$)/u },
    { index: 2, pattern: /(^|\s)(third|third one|3rd|number three|no 3|tritiyo|tritiyo ta|তৃতীয়|তৃতীয়|তৃতীয়টা|৩ নম্বর|নম্বর ৩)(\s|$)/u },
    { index: size - 1, pattern: /(^|\s)(last one|last|shesh ta|sheshta|শেষটা|শেষেরটা)(\s|$)/u }
  ];
  for (const item of selectors) {
    if (item.index >= 0 && item.index < size && item.pattern.test(text)) return item.index;
  }

  const number = text.match(/(?:^|\s)(?:number|no|number ta|option)?\s*([1-9])(?:st|nd|rd|th|\s*number|\s*ta|\s*no)?(?:\s|$)/u);
  if (number) {
    const index = Number(number[1]) - 1;
    return index >= 0 && index < size ? index : null;
  }
  return null;
}
