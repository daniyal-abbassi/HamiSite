/**
 * Re-apply the batch-cap patch that makes jevgrep (`jg`) work against the NaraRouter Jev endpoint.
 *
 * Our provider rejects any request with more than 20 questions: 20 returns 200, 21 returns
 * HTTP 400 "Field 'questions' must contain no more than 20 entries" (verified 2026-10-01).
 * jevgrep is written for the official Jev and builds far larger batches — up to 128 items per
 * navigation request, 32 per source-candidate request, and 3 questions per declaration with unit
 * groups of 128 (so up to 384 questions). A 400 is not classified as transient by its evaluator
 * (packages/core/src/evaluator.ts retries only 408/429/5xx/transport), so an over-cap batch is
 * neither retried nor split: the work is lost and the search silently returns file names without
 * source. That is the difference between exit 0 and the "locations only" result.
 *
 * The unit-group cap is patched at its chunking site only. The same constant also gates
 * `if (syntax.units.length > sourceBatchSize) return` — lowering it there would make jg skip
 * source selection for every ordinary component file, which is worse than the problem being fixed.
 *
 * `jg` ships its core as one bundled JS file, so this edits that file in place. npm upgrade
 * overwrites it; run this again after any upgrade. It is idempotent and refuses to patch a bundle
 * whose literals have moved rather than guessing.
 *
 *   node tools/jev/jevgrep-compat.mjs
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const MAX_QUESTIONS = 20;

const EDITS = [
  {
    name: 'navigation batch 128 -> 20',
    from: 'batch.length >= 128 || Buffer.byteLength',
    to: `batch.length >= ${MAX_QUESTIONS} || Buffer.byteLength`,
  },
  {
    name: 'source-candidate batch 32 -> 20',
    from: 'if (group.length && (group.length >= 32 || bytes + size > 64000))',
    to: `if (group.length && (group.length >= ${MAX_QUESTIONS} || bytes + size > 64000))`,
  },
  {
    // 3 questions per declaration (q/scope/ref) => 6 units keeps a request at 18 questions.
    name: 'unit group 128 -> 6 (<=18 questions per declaration request)',
    from: 'if (pending.length && (pending.length >= sourceBatchSize || Buffer.byteLength',
    to: 'if (pending.length && (pending.length >= 6 || Buffer.byteLength',
  },
];

function findBundle() {
  const candidates = [];
  try {
    const which = execFileSync('which', ['jg'], { encoding: 'utf8' }).trim();
    if (which) candidates.push(await_realpath(which));
  } catch {
    /* jg not on PATH */
  }
  for (const prefix of [
    join(homedir(), '.npm-global', 'lib', 'node_modules'),
    '/usr/lib/node_modules',
    '/usr/local/lib/node_modules',
  ]) {
    candidates.push(join(prefix, '@dzhng', 'jevgrep', 'dist', 'bin', 'index.js'));
  }
  return candidates.find((p) => existsSync(p));
}

function await_realpath(bin) {
  try {
    return execFileSync('readlink', ['-f', bin], { encoding: 'utf8' }).trim();
  } catch {
    return bin;
  }
}

const bundle = findBundle();
if (!bundle) {
  console.error('jg bundle not found. Install first: npm install --global --prefix ~/.npm-global @dzhng/jevgrep');
  process.exit(1);
}

let src = readFileSync(bundle, 'utf8');
const already = EDITS.filter((e) => src.includes(e.to));
const missing = EDITS.filter((e) => src.includes(e.from));
const drifted = EDITS.filter((e) => !src.includes(e.to) && !src.includes(e.from));

if (drifted.length) {
  console.error(`UNRECOGNISED bundle at ${bundle} — these literals were not found, so nothing was changed:`);
  for (const e of drifted) console.error(`   ${e.name}`);
  console.error('The upstream code moved. Re-read packages/core/src/{retrieve,selection}.js before patching.');
  process.exit(2);
}

if (missing.length) {
  if (!existsSync(`${bundle}.orig`)) copyFileSync(bundle, `${bundle}.orig`);
  for (const e of missing) src = src.split(e.from).join(e.to);
  writeFileSync(bundle, src);
}

console.log(`bundle: ${bundle}`);
for (const e of EDITS) {
  const state = src.includes(e.to) ? 'patched ' : 'STOCK   ';
  console.log(`  ${state} ${e.name}`);
}
console.log(
  already.length === EDITS.length && !missing.length
    ? 'already compatible — nothing to do'
    : `applied ${missing.length} edit(s); stock copy kept at ${bundle}.orig`,
);
console.log('\nverify with: jg doctor  then  jg "<question>" components --concurrency 1; exit 0 means complete.');
