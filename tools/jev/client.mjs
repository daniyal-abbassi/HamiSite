/**
 * Jev — structured second-opinion client (NaraRouter System One).
 *
 * Jev is advisory. It never authorizes anything, and a Jev answer is not a reason to act.
 * Callers keep the decision. See tools/jev/README.md for the policy this file assumes.
 *
 * Zero dependencies by design: Node 22 has fetch, and pulling the AI SDK in for one POST would
 * put a framework dependency inside a Next.js app's tree for the benefit of the agents using it.
 */

const TYPES = new Set(['choice', 'score', 'noul']);

export class JevError extends Error {
  /** @param {'config'|'validation'|'network'|'http'|'parse'} kind */
  constructor(kind, message, status) {
    super(message);
    this.name = 'JevError';
    this.kind = kind;
    if (status !== undefined) this.status = status;
  }
}

/**
 * Never let the credential escape through an error message. Upstream echoes request bodies on
 * some 4xx paths, and an Authorization header can surface in a fetch failure.
 * @param {string} text
 */
function redact(text) {
  const key = process.env.JEV_API_KEY;
  if (!key || key.length < 6) return String(text);
  return String(text).split(key).join('[REDACTED]');
}

function loadEnv() {
  // `node script.mjs` does not get Next.js's .env loading. Node 22 exposes loadEnvFile; if it is
  // missing or the file is absent, fall back to whatever the parent environment already provides.
  if (typeof process.loadEnvFile !== 'function') return;
  for (const file of ['.env', '.env.local']) {
    try {
      process.loadEnvFile(file);
      return;
    } catch {
      /* try the next one */
    }
  }
}

/** @returns {{url: string, model: string, key: string}} */
function config() {
  loadEnv();
  const key = process.env.JEV_API_KEY?.trim();
  if (!key) {
    throw new JevError('config', 'JEV_API_KEY is not set. Add it to .env (gitignored) or export it.');
  }
  return {
    key,
    url: (process.env.JEV_SYSTEMONE_URL || 'https://router.bynara.id/v1/systemone').trim(),
    model: (process.env.JEV_MODEL || 'jev').trim(),
  };
}

/**
 * Reject locally before spending a request. A malformed criteria shape is the most likely mistake
 * a caller makes, and it is cheaper to say so here than to parse a confusing 400 later.
 */
function validate(state, questions) {
  if (state === undefined || state === null || state === '') {
    throw new JevError('validation', 'state is required: the minimum context Jev needs to judge.');
  }
  if (typeof questions !== 'object' || questions === null || Array.isArray(questions)) {
    throw new JevError('validation', 'questions must be an object keyed by question name.');
  }
  const names = Object.keys(questions);
  if (names.length === 0) throw new JevError('validation', 'questions must not be empty.');

  for (const name of names) {
    const q = questions[name];
    if (!q || typeof q !== 'object') throw new JevError('validation', `question "${name}" must be an object.`);
    if (!TYPES.has(q.type)) {
      throw new JevError('validation', `question "${name}" has type "${q.type}"; expected choice | score | noul.`);
    }
    if (typeof q.instructions !== 'string' || !q.instructions.trim()) {
      throw new JevError('validation', `question "${name}" needs a non-empty instructions string.`);
    }
    if (q.type === 'choice') {
      const options = Object.keys(q.criteria ?? {});
      if (options.length < 2) throw new JevError('validation', `choice "${name}" needs at least 2 named options.`);
      if (options.length > 255) throw new JevError('validation', `choice "${name}" exceeds the 255-option limit.`);
    }
    if (q.type === 'score') {
      if (!Array.isArray(q.criteria) || q.criteria.length < 2 || q.criteria.length > 10) {
        throw new JevError('validation', `score "${name}" needs an ordered array of 2-10 levels.`);
      }
    }
  }
}

/**
 * Ask Jev one or more closed questions about one state.
 *
 * @param {object} params
 * @param {string|object|array} params.state      Minimum relevant context. Never a repo dump.
 * @param {Record<string,{type:'choice'|'score'|'noul',instructions:string,criteria?:any}>} params.questions
 * @param {number} [params.timeoutMs=20000]
 * @returns {Promise<{model:string, answers:object, usage:object|null}>}
 * @throws {JevError} on config, validation, network, HTTP or parse failure
 */
export async function jev({ state, questions, timeoutMs = 20_000 }) {
  validate(state, questions);
  const { key, url, model } = config();

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, state, questions }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    const why = cause?.name === 'TimeoutError' ? `timed out after ${timeoutMs}ms` : redact(cause?.message ?? cause);
    throw new JevError('network', `Jev unreachable (${why}).`);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new JevError('http', `Jev returned ${response.status}: ${redact(text).slice(0, 400)}`, response.status);
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new JevError('parse', `Jev returned non-JSON: ${redact(text).slice(0, 200)}`);
  }

  if (!payload || typeof payload.answers !== 'object' || payload.answers === null) {
    throw new JevError('parse', `Jev response has no answers object: ${redact(text).slice(0, 200)}`);
  }

  return { model: payload.model ?? model, answers: payload.answers, usage: payload.usage ?? null };
}

/**
 * A decision is only worth acting on if the alternatives are far apart. Two options at 0.51/0.49
 * is Jev saying "ask a human", not a weak vote for the leader.
 */
export function isDecisive(answer, { minTop = 0.8, minMargin = 0.25 } = {}) {
  if (!answer) return false;
  if (answer.type === 'noul') return true;
  const values = Object.values(answer.probabilities ?? {}).map(Number);
  if (values.length < 2) return false;
  const [top, second] = values.sort((a, b) => b - a);
  return top >= minTop && top - second >= minMargin;
}
