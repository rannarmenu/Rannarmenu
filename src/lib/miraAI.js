const ALLOWED_ACTIONS = new Set([
  'chat',
  'recipe_search',
  'ask_clarification',
  'website_help',
  'cooking_help'
]);

/** Keep only short, user-facing text messages in the model's conversation context. */
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

  // Stay within the Edge Function's total context budget and retain the latest turn.
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

/** Validate an untrusted edge-function result before using it to trigger site actions. */
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
  if (!reply && payload.action !== 'recipe_search') return null;
  return {
    action: payload.action,
    reply: reply || 'একটু মিলিয়ে দেখি! 🍲',
    search_query: searchQuery
  };
}


const AI_ERROR_MESSAGES = {
  AI_NOT_CONFIGURED: {
    bn: 'Mira-র আসল AI সংযোগ এখনও সেটআপ হয়নি। Supabase Edge Function Secrets-এ OPENAI_API_KEY আছে কি না দেখে নাও।',
    banglish: 'Mira-r AI connection ekhono setup hoyni. Supabase Edge Function Secrets-e OPENAI_API_KEY thik ache kina check koro.',
    en: "Mira's AI connection is not configured yet. Check that OPENAI_API_KEY is saved in Supabase Edge Function Secrets."
  },
  AI_BILLING_REQUIRED: {
    bn: 'Mira-র AI সার্ভার চালু, কিন্তু OpenAI API-তে ক্রেডিট বা usage limit-এর সমস্যা দেখা যাচ্ছে। OpenAI API Billing ও Usage Limit পরীক্ষা করো; শুধু আবার চেষ্টা করলে এই সমস্যা ঠিক নাও হতে পারে।',
    banglish: 'Mira-r AI server cholche, kintu OpenAI API credit ba usage limit-er somossa hocche. OpenAI API Billing ar Usage Limit check koro; shudhu abar try korle eta thik nao hote pare.',
    en: "Mira's AI server is running, but OpenAI API credits or a usage limit appear to be blocking responses. Check API billing and usage limits; retrying alone may not fix it."
  },
  AI_RATE_LIMITED: {
    bn: 'OpenAI API-র সাময়িক rate limit-এ Mira আটকে গেছে। একটু বিরতি দিয়ে আবার চেষ্টা করো; বারবার দ্রুত message পাঠিও না।',
    banglish: 'OpenAI API-r temporary rate limit-e Mira atke geche. Ektu wait kore abar try koro; khub taratari bar bar message pathio na.',
    en: "Mira has hit a temporary OpenAI API rate limit. Wait a moment before trying again, and avoid sending repeated requests quickly."
  },
  AI_INVALID_API_KEY: {
    bn: 'OpenAI API key গ্রহণ করা হয়নি। OpenAI Platform-এ নতুন key তৈরি করে Supabase-এর OPENAI_API_KEY secret আপডেট করো।',
    banglish: 'OpenAI API key accept koreni. OpenAI Platform-e notun key baniye Supabase-er OPENAI_API_KEY secret update koro.',
    en: "OpenAI rejected the API key. Create a new key in OpenAI Platform and update the OPENAI_API_KEY secret in Supabase."
  },
  AI_MODEL_UNAVAILABLE: {
    bn: 'নির্বাচিত AI model এই API project-এ পাওয়া যাচ্ছে না বা অনুমতি নেই। OpenAI API-তে চালু থাকা model দিয়ে OPENAI_MODEL সেট করো।',
    banglish: 'Selected AI model ei API project-e available na ba permission nei. OpenAI API-te enabled model diye OPENAI_MODEL set koro.',
    en: "The selected AI model is unavailable to this API project. Set OPENAI_MODEL to a model enabled for your OpenAI API project."
  },
  RATE_LIMITED: {
    bn: 'Mira-কে অল্প সময়ে অনেক বার message পাঠানো হয়েছে। একটু বিরতি দিয়ে আবার চেষ্টা করো।',
    banglish: 'Mira-ke khub olpo somoye onek message pathano hoyeche. Ektu wait kore abar try koro.',
    en: "Too many messages were sent to Mira in a short period. Wait a little, then try again."
  },
  AI_CONNECTION: {
    bn: 'Mira-র AI server-এ সংযোগ করা যাচ্ছে না। ইন্টারনেট ঠিক আছে কি না দেখে আবার চেষ্টা করো।',
    banglish: 'Mira-r AI server-e connect kora jacche na. Internet thik ache kina check kore abar try koro.',
    en: "Mira cannot reach the AI server right now. Check the connection and try again."
  },
  AI_PROVIDER_ERROR: {
    bn: 'OpenAI থেকে এখন উত্তর পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করো।',
    banglish: 'OpenAI theke ekhon answer asche na. Ektu pore abar try koro.',
    en: "OpenAI could not complete the response right now. Please try again shortly."
  },
  AI_INVALID_RESPONSE: {
    bn: 'Mira উত্তরটি ঠিকভাবে সাজাতে পারেনি। প্রশ্নটি আরেকবার লিখে চেষ্টা করো।',
    banglish: 'Mira answer-ta thikmoto format korte pareni. Question-ta abar likhe try koro.',
    en: "Mira could not format the answer correctly. Try asking once more."
  },
  AI_UNAVAILABLE: {
    bn: 'Mira-র AI এখন সাময়িকভাবে unavailable। একটু পরে আবার চেষ্টা করো।',
    banglish: 'Mira-r AI ekhon temporary unavailable. Ektu pore abar try koro.',
    en: "Mira's AI is temporarily unavailable. Please try again shortly."
  },
  AI_INVALID_REQUEST: {
    bn: 'এই message-টি পাঠানো যায়নি। ছোট করে আবার লিখে দাও।',
    banglish: 'Ei message-ta pathano jayni. Ektu choto kore abar likho.',
    en: "That message could not be sent. Please try a shorter version."
  }
};

export function getMiraAIErrorMessage(code, locale = 'bn') {
  const key = typeof code === 'string' ? code : 'AI_UNAVAILABLE';
  const entry = AI_ERROR_MESSAGES[key] || AI_ERROR_MESSAGES.AI_UNAVAILABLE;
  const language = locale === 'banglish' ? 'banglish' : locale === 'en' ? 'en' : 'bn';
  return entry[language];
}
