/* stateSerializer.js — URL state export/import for consultant session handoff.
 * All functions are pure (no DOM side effects) to allow Node.js unit testing.
 * See ADR-0002 for the decision to use Base64 URL encoding.
 */

const VALID_ANSWER_VALUES = new Set([0, 1, 2, 3, null]);

function encodeState(answers, projectName) {
  const payload = JSON.stringify({ answers, projectName });
  return btoa(unescape(encodeURIComponent(payload)));
}

function decodeState(encoded) {
  if (!encoded) return null;
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.answers || typeof parsed.answers !== 'object') return null;
    for (const val of Object.values(parsed.answers)) {
      if (!VALID_ANSWER_VALUES.has(val)) return null;
    }
    return { answers: parsed.answers, projectName: parsed.projectName || '' };
  } catch {
    return null;
  }
}

function encodeStateToURL(answers, projectName) {
  return '?state=' + encodeState(answers, projectName);
}

function decodeStateFromURL(search) {
  if (!search) return null;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const state = params.get('state');
  if (!state) return null;
  return decodeState(state);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { encodeState, decodeState, encodeStateToURL, decodeStateFromURL };
}
