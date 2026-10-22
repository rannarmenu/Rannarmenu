import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChefHat,
  Heart,
  MessageCircle,
  Minus,
  Search,
  Send,
  Sparkles,
  Utensils,
  X
} from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabaseClient.js';
import {
  buildRecipeSearchGroups,
  normalizeSearchText,
  translateChatText
} from './lib/recipeSearch.js';

const CHAT_NOISE = new Set([
  'i','me','my','we','you','your','the','a','an','and','or','to','for','of','with','please','pls',
  'can','could','would','will','give','find','show','open','want','need','like','make','cook','cooking',
  'recipe','recipes','food','dish','some','one','this','that','how','what','is','are','do','does','it',
  'আমি','আমাকে','আমার','একটা','একটি','একটু','দাও','দেন','দিয়ে','দিয়ে','চাই','হবে','করো','করুন',
  'দেখাও','খুলে','খুঁজে','প্লিজ','রেসিপি','রান্না','রাঁধতে','বানাও','তৈরি','কী','কি','কোন','কোনো',
  'मुझे','मेरी','एक','और','का','की','के','को','से','में','है','क्या','बनाओ','रेसिपी','खाना',
  'quiero','receta','recetas','por','favor','una','un','el','la','los','las','de','del','para',
  'je','veux','une','un','recette','recettes','de','des','du','le','la','les','suis','comment',
  'ich','möchte','ein','eine','rezept','rezepte','kochen','bitte','was','wie',
  'اريد','أريد','وصفة','وصفات','من','فضلك','كيف','اعطني','اعطيني',
  'レシピ','料理','ください','菜谱','食谱','做法','请','给我'
].map(normalizeSearchText));

function cleanRecipeQuery(value) {
  const parts = normalizeSearchText(value).split(' ').filter(Boolean);
  const cleaned = parts.filter(word => !CHAT_NOISE.has(word));
  return cleaned.length ? cleaned.join(' ') : '';
}

function isBengali(value) {
  return /[\u0980-\u09FF]/u.test(String(value ?? ''));
}

function detectLanguageFallback(original, translatedLanguage) {
  if (isBengali(original)) return 'bn';
  return translatedLanguage && translatedLanguage !== 'und' ? translatedLanguage : 'en';
}

function toRecipeCard(row) {
  const ingredients = Array.isArray(row?.ingredients)
    ? row.ingredients.map(x => typeof x === 'string' ? x : x?.name || x?.text || '').filter(Boolean)
    : [];
  const steps = Array.isArray(row?.instructions)
    ? row.instructions.map(x => typeof x === 'string' ? x : x?.text || x?.step || '').filter(Boolean)
    : [];
  return {
    ...row,
    time: (Number(row?.prep_minutes) || 0) + (Number(row?.cook_minutes) || 0),
    level: row?.difficulty === 'hard' ? 'কঠিন' : row?.difficulty === 'medium' ? 'মাঝারি' : 'সহজ',
    tag: Array.isArray(row?.tags) && row.tags[0] ? row.tags[0] : row?.category,
    image: row?.image_url || null,
    desc: row?.summary || '',
    ingredients,
    steps
  };
}

function titleMatchCount(recipe, groups) {
  const title = normalizeSearchText([
    recipe?.title, recipe?.slug, recipe?.category
  ].filter(Boolean).join(' '));
  return groups.reduce((score, group) => {
    const found = group.some(alias => {
      const term = normalizeSearchText(alias);
      return term.length > 1 && title.includes(term);
    });
    return score + (found ? 1 : 0);
  }, 0);
}

function isWebsiteHelp(question) {
  const value = normalizeSearchText(question);
  if (/(^|\\s)(help|help me|please help|help please|সাহায্য|একটু সাহায্য)(\\s|$)/u.test(value)) return true;
  return /(website|web site|webpage|site use|use this site|use website|search bar|where can i|how can i|how do i use|help me use|ওয়েবসাইট|ওয়েবসাইট|এই সাইট|সার্চ বার|খুঁজে পাব|কোথায় খুঁজ|কোথায় খুঁজ|ব্যবহার কর|কিভাবে ব্যবহার|কীভাবে ব্যবহার|কোথায় পাব|কোথায় পাব|রেসিপি সেভ|সংরক্ষণ কর)/u.test(value);
}

function isRecipeRequest(question) {
  const value = normalizeSearchText(question);
  return /(recipe|recipes|cook|cooking|make me|give me|find me|food|dish|রেসিপি|রান্না|রাঁধ|খাবার|পদ|তরকারি|विधि|रेसिपी|खाना|वصفة|وصفات|cocinar|receta|recettes?|kochen|rezept|レシピ|料理|菜谱|食谱|做法)/u.test(value);
}

function getSmallTalkReply(question) {
  const value = normalizeSearchText(question);
  if (/(^|\\s)(hi|hello|hey|hiya|hola|bonjour|salut|hallo|hii|হাই|হ্যালো|নমস্কার|আসসালামু আলাইকুম|السلام عليكم|你好|こんにちは|नमस्ते|ہیلو|مرحبا)(\\s|$)/u.test(value) && value.split(' ').length <= 5) {
    return 'হেইই! 🌸 Mira* হাজির! রেসিপি খুঁজতে এসেছ, না শুধু আমার গাল টিপে যেতে? 😼';
  }
  if (/(thank you|thanks|thx|ধন্যবাদ|অনেক ধন্যবাদ|شكرا|شكرًا|gracias|merci|danke|ありがとう|谢谢|धन्यवाद)/u.test(value)) {
    return 'আহা, এ আর এমন কী! 💗 রান্নাটা যেন মজার হয়—আমি আছি, দরকার হলে আবার ডাক দিও!';
  }
  if (/(who are you|what is your name|your name|তুমি কে|তোমার নাম|তোমার নাম কী|আপনি কে|কে তুমি|من أنت|ما اسمك|quien eres|cómo te llamas|qui es tu|wer bist du|あなたは誰|你是谁|तुम कौन हो)/u.test(value)) {
    return 'আমি Mira*—Rannar Menu-র ছোট্ট রান্নাঘর-সহকারী! 🐱 রেসিপি খুঁজে দিই, ধাপ বুঝিয়ে দিই, আর সাইটে পথ হারালে তোমাকে পথ দেখাই।';
  }
  if (/(what can you do|how can you help|তুমি কী করতে পার|কী সাহায্য করতে পার|তুমি কী কী|what do you do|كيف تساعدني|que puedes hacer|que pouvez vous faire|何ができる|你能做什么)/u.test(value)) {
    return 'তিনটে কাজে আমি বেশ পাকা! ✨ খাবারের নাম দিয়ে রেসিপি খুঁজি, রেসিপির উপকরণ/ধাপ দেখিয়ে দিই, আর Rannar Menu ব্যবহার করতে সাহায্য করি। কোন খাবারটা?';
  }
  return '';
}

const MIRA_COPY = {
  welcome: 'হেই! আমি Mira* 🌼 নামটা মিষ্টি, বুদ্ধিটাও কম না! রেসিপির নাম বলো—মিল পেলে খুলে দেব। ওয়েবসাইট বুঝতে সমস্যা হলেও ডাক দিও।',
  help: 'এই যে, একদম সহজ! 💚 হোমপেজের লম্বা সার্চ বারে খাবারের নাম বা উপকরণ লেখো। রেসিপির কার্ডে চাপ দিলে উপকরণ, সময় আর ধাপে ধাপে রান্নার পদ্ধতি খুলবে। হার্ট ♡ চাপলে পছন্দের রেসিপি সেভ থাকবে। আর তুমি চাইলে আমাকেও খাবারের নাম বলতে পারো—আমি খুঁজে দেব!',
  askName: 'অবশ্যই! 😸 কোন রেসিপিটা চাই? খাবারের নামটা লিখে দাও—আমি মিলিয়ে পেলে সরাসরি খুলে দেব।',
  notFound: 'আহা, এই নামে প্রকাশিত রেসিপি খুঁজে পেলাম না। 🥹 নামটা আরেকভাবে লিখবে, বা বাংলা/English বানানে চেষ্টা করো? যে রেসিপিগুলো আছে, শুধু সেগুলোই দেখাই—ভুল রেসিপি বানিয়ে বলি না!',
  fallback: 'হুম, বুঝেছি—তবে আমি সবচেয়ে ভালো সাহায্য করি Rannar Menu-এর রেসিপি, উপকরণ, রান্নার ধাপ আর সাইট ব্যবহারে। 😺 কোন খাবারটা খুঁজছ? নাম বললেই খুঁজে দেখি!',
  open: title => 'ইয়ে! পেয়ে গেছি—**' + title + '** 🍲 তোমার জন্য রেসিপিটা খুলে দিচ্ছি। একটু দেখে নিও, শেফ সাহেবা/সাহেব!',
  suggestions: 'কয়েকটা মিল পাওয়া রেসিপি পেলাম! যেটা চাও, সেটার নামেই টোকা দাও। 🐾'
};

function MiraMascot({ small = false, mood = 'idle' }) {
  return <span className={'mira-mascot mira-mood-' + mood + (small ? ' mira-mascot-small' : '')} aria-hidden="true">
    <span className="mira-antenna mira-antenna-left"/>
    <span className="mira-antenna mira-antenna-right"/>
    <span className="mira-face">
      <span className="mira-eye mira-eye-left"/>
      <span className="mira-eye mira-eye-right"/>
      <span className="mira-blush mira-blush-left"/>
      <span className="mira-blush mira-blush-right"/>
      <span className="mira-mouth"/>
    </span>
    <span className="mira-mascot-sparkle">✦</span>
  </span>;
}

export default function MiraChat({ onOpenRecipe }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(() => [
    { id: 'mira-welcome', role: 'assistant', text: MIRA_COPY.welcome }
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showIntro, setShowIntro] = useState(false);
  const [mood, setMood] = useState('idle');
  const messageListRef = useRef(null);
  const inputRef = useRef(null);
  const busyRef = useRef(false);
  const lastSentAt = useRef(0);
  const greetingLocalized = useRef(false);

  useEffect(() => {
    let showTimer;
    let hideTimer;
    try {
      if (window.sessionStorage.getItem('rannar-mira-intro-seen') === '1') return;
      window.sessionStorage.setItem('rannar-mira-intro-seen', '1');
    } catch { /* Greeting is optional when browser storage is unavailable. */ }
    showTimer = window.setTimeout(() => {
      setShowIntro(true);
      hideTimer = window.setTimeout(() => setShowIntro(false), 4200);
    }, 1100);
    return () => { window.clearTimeout(showTimer); window.clearTimeout(hideTimer); };
  }, []);

  useEffect(() => {
    if (busy) { setMood('thinking'); return; }
    if (isOpen) { setMood('happy'); return; }
    if (!['happy', 'sad', 'surprised'].includes(mood)) return;
    const timer = window.setTimeout(() => setMood('idle'), 3000);
    return () => window.clearTimeout(timer);
  }, [isOpen, busy, mood]);

  useEffect(() => {
    if (!isOpen) return;
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
    inputRef.current?.focus({ preventScroll: true });
  }, [isOpen, messages, busy]);

  useEffect(() => {
    if (!isOpen || greetingLocalized.current) return;
    greetingLocalized.current = true;
    const browserLanguage = typeof navigator !== 'undefined'
      ? String(navigator.language || 'bn').toLowerCase().split('-')[0]
      : 'bn';
    if (!browserLanguage || browserLanguage === 'bn') return;
    let active = true;
    translateChatText(MIRA_COPY.welcome, { source: 'bn', target: browserLanguage }).then(result => {
      if (!active || !result.text) return;
      setMessages(previous => previous.map(message =>
        message.id === 'mira-welcome' ? { ...message, text: result.text } : message
      ));
    }).catch(() => {});
    return () => { active = false; };
  }, [isOpen]);

  const addAssistantMessage = (text, recipes = []) => {
    setMood(/পেলাম না|গোলমাল|দুঃখিত|সমস্যা|আবার চেষ্টা/u.test(text) ? 'sad' : 'happy');
    setMessages(previous => [
      ...previous,
      { id: 'mira-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), role: 'assistant', text, recipes }
    ].slice(-22));
  };

  const localizeReply = async (text, language) => {
    if (!language || language === 'bn') return text;
    try {
      const translated = await translateChatText(text, { source: 'bn', target: language });
      return translated.text || text;
    } catch {
      return text;
    }
  };

  const searchRecipes = async (query) => {
    const cleaned = cleanRecipeQuery(query);
    const groups = buildRecipeSearchGroups(cleaned);
    if (!groups.length) return { recipes: [], groups, total: 0, error: null };
    const { data, error: searchError } = await supabase.rpc('search_published_recipes_multilingual', {
      p_search_groups: groups,
      p_category: null,
      p_saved_ids: null,
      p_only_saved: false,
      p_limit: 8,
      p_offset: 0
    });
    if (searchError) return { recipes: [], groups, total: 0, error: searchError };
    return {
      recipes: (data || []).map(item => toRecipeCard(item.recipe)),
      groups,
      total: Number(data?.[0]?.total_count) || 0,
      error: null
    };
  };

  const runAssistant = async (rawText) => {
    let translatedToBengali = { text: '', sourceLanguage: 'und' };
    try {
      translatedToBengali = await translateChatText(rawText, { target: 'bn' });
    } catch {
      // Direct multilingual keyword search below is still available if translation is offline.
    }
    const language = detectLanguageFallback(rawText, translatedToBengali.sourceLanguage);
    const bengaliText = translatedToBengali.text || rawText;
    const understoodText = normalizeSearchText(rawText + ' ' + bengaliText);

    const smallTalk = getSmallTalkReply(understoodText);
    if (smallTalk) {
      addAssistantMessage(await localizeReply(smallTalk, language));
      return;
    }

    if (isWebsiteHelp(understoodText)) {
      addAssistantMessage(await localizeReply(MIRA_COPY.help, language));
      return;
    }

    if (!supabaseConfigured) {
      const text = await localizeReply('দুঃখিত, এই মুহূর্তে রেসিপির ডেটাবেসের সঙ্গে যোগাযোগ হচ্ছে না। একটু পরে আবার চেষ্টা করো।', language);
      addAssistantMessage(text);
      return;
    }

    const rawLooksLikeRecipe = isRecipeRequest(understoodText);
    const cleanedOriginal = cleanRecipeQuery(rawText);
    const cleanedBengali = cleanRecipeQuery(bengaliText);

    if (!cleanedOriginal && !cleanedBengali && rawLooksLikeRecipe) {
      addAssistantMessage(await localizeReply(MIRA_COPY.askName, language));
      return;
    }

    let found = await searchRecipes(cleanedOriginal || rawText);
    if (!found.recipes.length && cleanedBengali && cleanedBengali !== cleanedOriginal) {
      found = await searchRecipes(cleanedBengali);
    }

    if (!found.recipes.length) {
      const translatedEnglish = await translateChatText(rawText, { target: 'en' });
      const englishQuery = cleanRecipeQuery(translatedEnglish.text || '');
      if (englishQuery && englishQuery !== cleanedOriginal && englishQuery !== cleanedBengali) {
        found = await searchRecipes(englishQuery);
      }
    }

    if (found.error) {
      addAssistantMessage(await localizeReply('রেসিপির খাতা খুলতে গিয়ে একটু গোলমাল হয়েছে। একটু পরে আবার চেষ্টা করো? 🌼', language));
      return;
    }

    if (found.recipes.length) {
      const scored = found.recipes
        .map(recipe => ({ recipe, score: titleMatchCount(recipe, found.groups) }))
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      const cleanedPhrase = normalizeSearchText(cleanedOriginal || cleanedBengali || rawText);
      const bestTitle = normalizeSearchText(best?.recipe?.title || '');
      const phraseInTitle = cleanedPhrase.length > 2 && bestTitle.includes(cleanedPhrase);
      const exactEnough = best && (
        phraseInTitle ||
        (found.groups.length >= 2 && best.score >= found.groups.length) ||
        (found.recipes.length === 1 && found.groups.length <= 2)
      );
      if (exactEnough) {
        onOpenRecipe?.(best.recipe);
        setIsOpen(false);
        return;
      }
      addAssistantMessage(await localizeReply(MIRA_COPY.suggestions, language), scored.slice(0, 5).map(item => item.recipe));
      return;
    }

    if (rawLooksLikeRecipe || cleanedOriginal || cleanedBengali) {
      addAssistantMessage(await localizeReply(MIRA_COPY.notFound, language));
      return;
    }

    addAssistantMessage(await localizeReply(MIRA_COPY.fallback, language));
  };

  const sendText = async (rawText) => {
    const text = String(rawText ?? '').trim().slice(0, 300);
    if (!text || busyRef.current) return;
    const now = Date.now();
    if (now - lastSentAt.current < 500) return;
    lastSentAt.current = now;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setDraft('');
    setMessages(previous => [
      ...previous,
      { id: 'visitor-' + now, role: 'user', text }
    ].slice(-22));
    try {
      await runAssistant(text);
    } catch {
      addAssistantMessage('উফ! Mira-র গোঁফে একটু জট লেগেছে 😿 আবার চেষ্টা করো, প্লিজ।');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    void sendText(draft);
  };

  return <div className={'mira-widget mira-widget-' + mood}>
    {isOpen && <section className="mira-panel" role="dialog" aria-label="Mira recipe helper" aria-modal="false">
      <header className="mira-header">
        <MiraMascot small/>
        <div className="mira-header-copy">
          <strong>Mira<span>*</span></strong>
          <small><span className="mira-online-dot"/> রান্নাঘরে হাজির · সাহায্য করতে প্রস্তুত</small>
        </div>
        <button type="button" className="mira-window-btn" onClick={() => setIsOpen(false)} aria-label="Mira ছোট করো"><Minus size={19}/></button>
        <button type="button" className="mira-window-btn" onClick={() => setIsOpen(false)} aria-label="Mira বন্ধ করো"><X size={19}/></button>
      </header>
      <div className="mira-chat-context"><Sparkles size={13}/> মিষ্টি কথা, কাজে পাকা। বেশি বিরক্ত করে না! 😼</div>
      <div className="mira-messages" ref={messageListRef} aria-live="polite" aria-relevant="additions text">
        {messages.map(message => <div key={message.id} className={'mira-message-row ' + (message.role === 'user' ? 'mira-message-user' : 'mira-message-bot')}>
          {message.role === 'assistant' && <MiraMascot small/>}
          <div className="mira-message-content">
            <div className="mira-bubble">{message.text.split('**').map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : <React.Fragment key={index}>{part}</React.Fragment>)}</div>
            {message.recipes?.length > 0 && <div className="mira-recipe-options">{message.recipes.map(recipe => <button key={recipe.id || recipe.slug || recipe.title} type="button" className="mira-recipe-option" onClick={() => { onOpenRecipe?.(recipe); setIsOpen(false); }}>
              <span className="mira-option-icon"><Utensils size={16}/></span>
              <span><strong>{recipe.title}</strong><small>{recipe.category || 'রেসিপি'} · {recipe.time || 0} মিনিট</small></span>
              <ArrowUpRight size={16}/>
            </button>)}</div>}
          </div>
        </div>)}
        {busy && <div className="mira-message-row mira-message-bot"><MiraMascot small/><div className="mira-bubble mira-typing" aria-label="Mira উত্তর লিখছে"><span/><span/><span/></div></div>}
      </div>
      {error && <p className="mira-error" role="status">{error}</p>}
      {messages.length === 1 && !busy && <div className="mira-quick-prompts">
        <button type="button" onClick={() => void sendText('একটা রেসিপি খুঁজে দাও')}>রেসিপি খুঁজি <Search size={13}/></button>
        <button type="button" onClick={() => void sendText('ওয়েবসাইট কীভাবে ব্যবহার করব?')}>সাইট বুঝিয়ে দাও <Sparkles size={13}/></button>
      </div>}
      <form className="mira-composer" onSubmit={handleSubmit}>
        <label className="mira-input-wrap">
          <span className="mira-input-sr">Mira-কে বার্তা লিখুন</span>
          <input ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} placeholder="যেকোনো ভাষায় লিখে দাও…" maxLength={300} autoComplete="off" aria-label="Mira-কে বার্তা লিখুন" disabled={busy}/>
        </label>
        <button className="mira-send-btn" type="submit" aria-label="বার্তা পাঠান" disabled={busy || !draft.trim()}><Send size={17}/></button>
      </form>
      <p className="mira-privacy-note">প্রয়োজনে Google Translate ব্যবহার হয়; ব্যক্তিগত তথ্য লিখো না।</p>
    </section>}
    <div className={'mira-intro-bubble ' + (showIntro && !isOpen ? 'mira-intro-visible' : '')} aria-hidden={!showIntro || isOpen}>
      <span className="mira-intro-copy"><strong>Hi, I’m Mira* <span>✦</span></strong><small>Need a little recipe help?</small></span>
      <button type="button" className="mira-intro-close" onClick={() => setShowIntro(false)} aria-label="Greeting বন্ধ করো"><X size={12}/></button>
    </div>
    <button type="button" className={'mira-launcher ' + (isOpen ? 'mira-launcher-open' : '')} onClick={() => { setShowIntro(false); setIsOpen(value => !value); }} aria-label={isOpen ? 'Mira বন্ধ করো' : 'Mira-র সঙ্গে কথা বলো'} aria-expanded={isOpen}>
      <MiraMascot mood={mood}/>
      <span className="mira-launcher-sr">{isOpen ? 'Mira chat বন্ধ করো' : 'Mira-র সঙ্গে কথা বলো'}</span>
    </button>
  </div>;
}
