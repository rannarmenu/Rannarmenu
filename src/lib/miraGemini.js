const ALLOWED_ACTIONS = new Set([
  'chat',
  'recipe_search',
  'ask_clarification',
  'website_help',
  'cooking_help'
]);

/** Build a bounded conversation transcript and append the active user turn once. */
export function buildMiraConversation(history, currentText) {
  const previous = Array.isArray(history) ? history : [];
  const safe = previous
    .filter(message =>
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.text === 'string' &&
      message.text.trim()
    )
    .slice(-11)
    .map(message => ({
      role: message.role,
      content: message.text.trim().slice(0, 1400)
    }));
  const current = String(currentText ?? '').trim().slice(0, 1400);
  if (current) safe.push({ role: 'user', content: current });

  const bounded = [];
  let total = 0;
  for (const message of [...safe].reverse()) {
    const remaining = 8000 - total;
    if (remaining <= 0) break;
    const content = message.content.slice(-Math.min(1400, remaining));
    if (!content) continue;
    bounded.unshift({ role: message.role, content });
    total += content.length;
  }
  return bounded.slice(-12);
}

/** Validate Gemini's structured response before the UI acts on it. */
export function normalizeMiraAIResult(payload) {
  if (!payload || typeof payload !== 'object' || payload.ok !== true) return null;
  if (typeof payload.action !== 'string' || !ALLOWED_ACTIONS.has(payload.action)) return null;
  if (typeof payload.reply !== 'string') return null;
  const reply = payload.reply.trim().slice(0, 5000);
  const searchQuery = typeof payload.search_query === 'string'
    ? payload.search_query.trim().slice(0, 240)
    : '';
  if (payload.action === 'recipe_search' && !searchQuery) return null;
  if (payload.action !== 'recipe_search' && searchQuery) return null;
  if (!reply) return null;
  return {
    action: payload.action,
    reply,
    search_query: searchQuery
  };
}

export function getMiraAIErrorMessage(code, locale = 'bn') {
  const language = locale === 'banglish' ? 'banglish' : locale === 'en' ? 'en' : 'bn';
  const messages = {
    AI_NOT_CONFIGURED: {
      bn: 'Mira-র Gemini সংযোগ সেটআপ হয়নি। Supabase Edge Function Secrets-এ GEMINI_API_KEY আছে কি না যাচাই করতে হবে।',
      banglish: 'Mira-r Gemini connection setup hoyni. Supabase Edge Function Secrets-e GEMINI_API_KEY ache kina check korte hobe.',
      en: 'Mira’s Gemini connection is not configured. Check the GEMINI_API_KEY secret in Supabase Edge Function Secrets.'
    },
    AI_INVALID_API_KEY: {
      bn: 'Gemini API key গ্রহণ করা হয়নি। Google AI Studio-তে key ও access যাচাই করে Supabase secret আপডেট করতে হবে।',
      banglish: 'Gemini API key accept koreni. Google AI Studio-te key/access check kore Supabase secret update korte hobe.',
      en: 'Gemini rejected the configured key. Verify the key in Google AI Studio and update the Supabase secret.'
    },
    AI_BILLING_REQUIRED: {
      bn: 'Gemini API-র quota বা billing limit-এ বাধা পাওয়া গেছে। Google AI Studio/Cloud project-এর quota ও billing status যাচাই করো।',
      banglish: 'Gemini API-r quota ba billing limit-e badha. Google AI Studio/Cloud project-er quota ar billing check koro.',
      en: 'Gemini quota or billing limits blocked the request. Check the Google AI Studio/Cloud project quota and billing.'
    },
    AI_RATE_LIMITED: {
      bn: 'Gemini সাময়িক rate limit দিয়েছে। একটু বিরতি দিয়ে আবার চেষ্টা করো।',
      banglish: 'Gemini temporary rate limit diyeche. Ektu pore abar try koro.',
      en: 'Gemini returned a temporary rate limit. Wait a moment and try again.'
    },
    AI_MODEL_UNAVAILABLE: {
      bn: 'নির্বাচিত Gemini model এই API project-এ পাওয়া যাচ্ছে না। Gemini secret/model configuration যাচাই করতে হবে।',
      banglish: 'Selected Gemini model ei API project-e available na. Gemini model configuration check korte hobe.',
      en: 'The selected Gemini model is unavailable to this project. Check its model configuration and API access.'
    },
    RATE_LIMITED: {
      bn: 'Mira-কে অল্প সময়ে অনেক বার message পাঠানো হয়েছে। একটু বিরতি দিয়ে আবার চেষ্টা করো।',
      banglish: 'Mira-ke olpo somoye onek message pathano hoyeche. Ektu pore abar try koro.',
      en: 'Too many messages were sent to Mira in a short time. Wait a little before retrying.'
    },
    AI_CONNECTION: {
      bn: 'Mira-র Gemini server-এ সংযোগ হচ্ছে না। ইন্টারনেট ঠিক আছে কি না দেখে আবার চেষ্টা করো।',
      banglish: 'Mira-r Gemini server-e connect kora jacche na. Internet check kore abar try koro.',
      en: 'Mira cannot reach the Gemini service right now. Check the connection and try again.'
    },
    AI_INVALID_RESPONSE: {
      bn: 'Gemini থেকে উত্তর এসেছে, কিন্তু সেটি ব্যবহারযোগ্য ফরম্যাটে ছিল না। আবার চেষ্টা করো।',
      banglish: 'Gemini answer pathiyeche, kintu format thik chilo na. Abar try koro.',
      en: 'Gemini returned a response in an unexpected format. Please try again.'
    },
    AI_UNAVAILABLE: {
      bn: 'Mira-র Gemini এখন সাময়িকভাবে উত্তর দিতে পারছে না। একটু পরে আবার চেষ্টা করো।',
      banglish: 'Mira-r Gemini ekhon temporary answer dite parche na. Ektu pore try koro.',
      en: 'Mira’s Gemini service is temporarily unavailable. Please try again shortly.'
    }
  };
  const entry = messages[typeof code === 'string' ? code : 'AI_UNAVAILABLE'] || messages.AI_UNAVAILABLE;
  return entry[language];
}
