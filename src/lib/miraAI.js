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
    .slice(-10)
    .map(message => ({
      role: message.role,
      content: message.text.trim().slice(0, 1400)
    }));
  const current = String(currentText ?? '').trim().slice(0, 1400);
  if (current) safe.push({ role: 'user', content: current });
  return safe.slice(-12);
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
