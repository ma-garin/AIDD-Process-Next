/* scoring.test.mjs — Zero-dependency unit tests (node:test / node:assert).
 * scoring.js / questions.js rely on global QUESTIONS/CATEGORIES; we inject them as globals
 * before requiring scoring.js, mirroring the browser's script-scope globals.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../docs/data/questions.js');
const sample = require('../docs/data/sample-answers.js');

globalThis.QUESTIONS = data.QUESTIONS;
globalThis.CATEGORIES = data.CATEGORIES;
globalThis.MODEL_VERSION = data.MODEL_VERSION;
globalThis.QUESTION_SET_VERSION = data.QUESTION_SET_VERSION;

const S = require('../docs/js/scoring.js');

const allAnswers = (score) => {
  const a = {};
  data.QUESTIONS.forEach(q => { a[q.id] = score; });
  return a;
};
const idsInCategory = (catId) => data.QUESTIONS.filter(q => q.categoryId === catId).map(q => q.id);

test('境界: 全0 → 総合0 → Lv.0', () => {
  const r = S.buildResults(allAnswers(0), 'T');
  assert.equal(r.totalScore, 0);
  assert.equal(r.level.level, 0);
});

test('境界: 全3 → 総合100 → Lv.3', () => {
  const r = S.buildResults(allAnswers(3), 'T');
  assert.equal(r.totalScore, 100);
  assert.equal(r.level.level, 3);
});

test('AL5: 均一weightなら加重平均は単純平均と一致（全2→約67）', () => {
  assert.equal(S.calcCategoryScore(1, allAnswers(2)), 67);
});

test('A2: N/A(null)は母数から除外される', () => {
  const a = allAnswers(3);
  idsInCategory(1).forEach(id => { a[id] = null; });
  assert.equal(S.calcCategoryScore(1, a), null);
  // 他カテゴリが全3なので総合は100のまま（領域1は除外）
  assert.equal(S.calcTotalScore(S.buildCategoryScores(a)), 100);
});

test('A4: 決定性 — 同じ回答は同じスコア・レベル・リスクID列', () => {
  const a = { ...sample.SAMPLE_ANSWERS };
  const r1 = S.buildResults(a, 'X');
  const r2 = S.buildResults(a, 'X');
  assert.equal(r1.totalScore, r2.totalScore);
  assert.equal(r1.level.level, r2.level.level);
  assert.deepEqual(r1.risks.map(r => r.id), r2.risks.map(r => r.id));
});

test('A3/AL3: severity判定（0=critical, 1=high）と複合優先度降順', () => {
  const a = allAnswers(2);
  a['C1-Q1'] = 0; // critical
  a['C2-Q1'] = 1; // high
  const risks = S.getRisks(a);
  assert.equal(risks.find(r => r.id === 'C1-Q1').severity, 'critical');
  assert.equal(risks.find(r => r.id === 'C2-Q1').severity, 'high');
  for (let i = 1; i < risks.length; i++) {
    assert.ok(risks[i - 1].priorityScore >= risks[i].priorityScore);
  }
});

test('AL3: issue件数は動的（critical多数で8件超〜上限12）', () => {
  const a = allAnswers(0); // 全50がcritical
  const issues = S.getIssues(S.getRisks(a));
  assert.ok(issues.length >= 8 && issues.length <= 12);
});

test('AL2: 次レベルまでの逆算', () => {
  assert.deepEqual(
    { atTop: S.calcGapToNextLevel(40).atTop, gap: S.calcGapToNextLevel(40).gap, next: S.calcGapToNextLevel(40).nextLevel.level },
    { atTop: false, gap: 10, next: 2 }
  );
  assert.equal(S.calcGapToNextLevel(100).atTop, true);
});

test('AL2: suggestMinimalImprovement は delta>=0 を上位順で返す', () => {
  const a = allAnswers(1);
  const sug = S.suggestMinimalImprovement(a, 3);
  assert.ok(sug.length === 3);
  assert.ok(sug[0].delta >= sug[2].delta);
  assert.equal(sug[0].to, sug[0].from + 1);
});

test('AL4: 矛盾検出（領域9高×領域4ゼロ）', () => {
  const a = allAnswers(1);
  idsInCategory(9).forEach(id => { a[id] = 3; });
  idsInCategory(4).forEach(id => { a[id] = 0; });
  const inc = S.detectIncoherence(a);
  assert.ok(inc.some(i => i.id === 'selfaudit-vs-review'));
});

test('AL1: 低回答率は provisional', () => {
  const a = { 'C1-Q1': 3, 'C1-Q2': 3 };
  const c = S.calcConfidence(a);
  assert.equal(c.answeredCount, 2);
  assert.equal(c.provisional, true);
});

test('AL6: 安定性メタを返す', () => {
  const sens = S.calcSensitivity(allAnswers(3));
  assert.ok(['高', '中', '低'].includes(sens.stability));
});

test('F4: 全50問が設問スキーマに適合', () => {
  const v = S.validateQuestionSchema(data.QUESTIONS);
  assert.equal(v.valid, true, JSON.stringify(v.errors.slice(0, 5)));
  assert.equal(data.QUESTIONS.length, 50);
});

test('F4: validateAnswers は未知ID・範囲外scoreを検出', () => {
  assert.equal(S.validateAnswers({ 'C1-Q1': 2 }).valid, true);
  assert.equal(S.validateAnswers({ 'NOPE': 2 }).valid, false);
  assert.equal(S.validateAnswers({ 'C1-Q1': 9 }).valid, false);
  assert.equal(S.validateAnswers({ 'C1-Q1': null }).valid, true); // N/A許容
});

test('F3: 診断JSONの往復（export→parse）', () => {
  const a = { ...sample.SAMPLE_ANSWERS };
  const json = S.generateDiagnosisJSON({ answers: a, projectName: 'P', memos: { 'C1-Q1': 'memo' } });
  const parsed = S.parseDiagnosisJSON(json);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.projectName, 'P');
  assert.deepEqual(parsed.answers, a);
  assert.equal(parsed.memos['C1-Q1'], 'memo');
});

test('F3: 不正JSONは ok:false', () => {
  assert.equal(S.parseDiagnosisJSON('{ not json').ok, false);
  assert.equal(S.parseDiagnosisJSON('{"foo":1}').ok, false);
});

test('C2/F3: CSVはヘッダ行を持つ', () => {
  const r = S.buildResults({ ...sample.SAMPLE_ANSWERS }, 'P');
  assert.ok(S.generateReportCSV(r).startsWith('category,score,level'));
  assert.ok(S.generateIssuesCSV(r).startsWith('priority,category,score,title,recommendation'));
  assert.ok(Array.isArray(S.generateGithubIssues(r)));
});

test('FT6: バッジSVG/Markdownを生成', () => {
  const r = S.buildResults(allAnswers(3), 'P');
  assert.ok(S.generateBadgeSVG(r.level).includes('<svg'));
  assert.ok(S.generateBadgeMarkdown(r).startsWith('![AIDD'));
});

test('C5: aiModel別に前置きが変わる（本体は共通）', () => {
  const r = S.buildResults(allAnswers(2), 'P');
  const claude = S.generateSelfCheckPrompt('pre-impl', r, 'claude');
  const generic = S.generateSelfCheckPrompt('pre-impl', r, 'generic');
  assert.ok(claude.includes('Claude Code'));
  assert.ok(!generic.startsWith('>'));
  assert.ok(claude.includes('実装前セルフチェック') && generic.includes('実装前セルフチェック'));
});

test('FT2: レポートに版・回答率・次レベルが刻印される', () => {
  const r = S.buildResults({ ...sample.SAMPLE_ANSWERS }, 'P');
  const md = S.generateMarkdownReport(r);
  assert.ok(md.includes('モデル版'));
  assert.ok(md.includes('回答率'));
  assert.ok(md.includes('次レベルまで'));
});

test('XSS: escapeHtml が特殊文字をエスケープ', () => {
  assert.equal(S.escapeHtml('<b>&"\''), '&lt;b&gt;&amp;&quot;&#039;');
});
