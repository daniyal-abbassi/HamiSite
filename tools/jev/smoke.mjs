/**
 * Read-only smoke test. Run: node tools/jev/smoke.mjs
 *
 * Makes exactly one live request with a harmless closed decision, then checks that every field the
 * client promises callers is actually present in the response. Prints no secret.
 */

import { jev, isDecisive, JevError } from './client.mjs';

const state =
  'Two implementation options exist. Option A changes one existing component. ' +
  'Option B introduces a new abstraction layer. The project favors minimal unnecessary complexity.';

const questions = {
  which_option: {
    type: 'choice',
    instructions: 'Which option better matches the stated preference?',
    criteria: {
      A: 'Change one existing component.',
      B: 'Introduce a new abstraction layer.',
    },
  },
  risk: {
    type: 'score',
    instructions: 'Rate implementation risk.',
    criteria: ['minimal', 'low', 'moderate', 'high', 'critical'],
  },
  needs_human: {
    type: 'noul',
    instructions: 'Does this decision require explicit human judgment before implementation?',
  },
};

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

console.log('=== Jev smoke test ===');

let result;
try {
  const started = Date.now();
  result = await jev({ state, questions });
  console.log(`  live request ok in ${Date.now() - started}ms\n`);
} catch (error) {
  if (error instanceof JevError) {
    console.error(`  ${error.kind.toUpperCase()}: ${error.message}`);
    console.error('\nJev is unavailable. Per policy: continue with normal reasoning. Jev absence is never permission to act.');
  } else {
    console.error('  UNEXPECTED:', error?.message ?? error);
  }
  process.exit(1);
}

const { answers } = result;

console.log('--- choice ---');
console.log(JSON.stringify(answers.which_option));
check('choice has a named option', typeof answers.which_option?.choice === 'string', answers.which_option?.choice);
check('choice probabilities sum to ~1', Math.abs(Object.values(answers.which_option?.probabilities ?? {}).reduce((a, b) => a + Number(b), 0) - 1) < 0.05);
check('choice exposes confidence', typeof answers.which_option?.confidence === 'number', String(answers.which_option?.confidence));
check('prefers A (the simple option)', answers.which_option?.choice === 'A');
check('isDecisive agrees', isDecisive(answers.which_option) === true);

console.log('--- score ---');
console.log(JSON.stringify(answers.risk));
check('score is numeric', typeof answers.risk?.score === 'number', String(answers.risk?.score));
check('score legend covers every level', Object.keys(answers.risk?.legend ?? {}).length === 5);
check('score probabilities keyed by index', Object.keys(answers.risk?.probabilities ?? {}).length === 5);

console.log('--- noul ---');
console.log(JSON.stringify(answers.needs_human));
check('noul is 0..1', typeof answers.needs_human?.noul === 'number' && answers.needs_human.noul >= 0 && answers.needs_human.noul <= 1, String(answers.needs_human?.noul));

console.log('--- envelope ---');
check('model echoed', result.model === 'jev', result.model);
check('usage reported', typeof result.usage?.input_tokens === 'number', JSON.stringify(result.usage));
check('all three questions answered', Object.keys(answers).length === 3);

console.log('\n--- offline guards (no request made) ---');
for (const [label, bad] of [
  ['score with 1 level', { q: { type: 'score', instructions: 'x', criteria: ['only'] } }],
  ['choice with 1 option', { q: { type: 'choice', instructions: 'x', criteria: { a: 'a' } } }],
  ['unknown type', { q: { type: 'boolean', instructions: 'x' } }],
]) {
  const before = failures;
  try {
    await jev({ state: 's', questions: bad });
    check(label + ' rejected', false, 'it was accepted');
  } catch (error) {
    check(label + ' rejected', error instanceof JevError && error.kind === 'validation', error.message);
  }
  failures = Math.max(failures, before);
}
try {
  await jev({ state: '', questions: { q: { type: 'noul', instructions: 'x' } } });
  check('empty state rejected', false, 'it was accepted');
} catch (error) {
  check('empty state rejected', error.kind === 'validation', error.message);
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
