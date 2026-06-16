const { test } = require('node:test');
const assert = require('node:assert/strict');
const { encodeState, decodeState, encodeStateToURL, decodeStateFromURL } = require('../docs/js/stateSerializer.js');

// ── Tracer bullet ───────────────────────────────────────────────────────────

test('round-trip: encode then decode returns original answers and projectName', () => {
  const answers = { 'q1': 3, 'q2': 1, 'q3': 0 };
  const projectName = '顧客ポータルPJ';

  const encoded = encodeState(answers, projectName);
  const decoded = decodeState(encoded);

  assert.deepEqual(decoded.answers, answers);
  assert.equal(decoded.projectName, projectName);
});

// ── decodeState edge cases ──────────────────────────────────────────────────

test('decodeState returns null for empty string', () => {
  assert.equal(decodeState(''), null);
});

test('decodeState returns null for invalid base64', () => {
  assert.equal(decodeState('not-valid-base64!!!'), null);
});

test('decodeState returns null for valid base64 but non-JSON payload', () => {
  const garbage = Buffer.from('hello world').toString('base64');
  assert.equal(decodeState(garbage), null);
});

test('decodeState returns null when answers field is missing', () => {
  const encoded = Buffer.from(JSON.stringify({ projectName: 'test' })).toString('base64');
  assert.equal(decodeState(encoded), null);
});

// ── Answer value validation ─────────────────────────────────────────────────

test('round-trip preserves null answers (対象外 entries)', () => {
  const answers = { 'q1': null, 'q2': 2 };
  const decoded = decodeState(encodeState(answers, ''));
  assert.deepEqual(decoded.answers, answers);
});

test('decodeState rejects answers containing values outside 0-3 and null', () => {
  const payload = JSON.stringify({ answers: { 'q1': 99 }, projectName: '' });
  const encoded = Buffer.from(payload).toString('base64');
  assert.equal(decodeState(encoded), null);
});

test('decodeState rejects answers containing negative values', () => {
  const payload = JSON.stringify({ answers: { 'q1': -1 }, projectName: '' });
  const encoded = Buffer.from(payload).toString('base64');
  assert.equal(decodeState(encoded), null);
});

// ── encodeStateToURL ────────────────────────────────────────────────────────

test('encodeStateToURL returns a string starting with ?state=', () => {
  const url = encodeStateToURL({ 'q1': 2 }, 'test');
  assert.ok(url.startsWith('?state='));
});

test('encodeStateToURL output can be decoded by decodeStateFromURL', () => {
  const answers = { 'q1': 3, 'q5': 0 };
  const projectName = 'テストPJ';

  const search = encodeStateToURL(answers, projectName);
  const decoded = decodeStateFromURL(search);

  assert.deepEqual(decoded.answers, answers);
  assert.equal(decoded.projectName, projectName);
});

// ── decodeStateFromURL edge cases ───────────────────────────────────────────

test('decodeStateFromURL returns null when search string is empty', () => {
  assert.equal(decodeStateFromURL(''), null);
});

test('decodeStateFromURL returns null when state param is absent', () => {
  assert.equal(decodeStateFromURL('?foo=bar'), null);
});

// ── URL length sanity check ─────────────────────────────────────────────────

test('encoded URL stays under 2000 chars with 50 answers and a long project name', () => {
  const answers = {};
  for (let i = 1; i <= 50; i++) answers[`cat${i}-q${i}`] = i % 4;
  const projectName = '顧客ポータル刷新プロジェクト（サンプル長め）2026年度';
  const url = encodeStateToURL(answers, projectName);
  assert.ok(url.length < 2000, `URL length ${url.length} exceeds 2000`);
});
