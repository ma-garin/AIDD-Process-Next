const { test } = require('node:test');
const assert = require('node:assert/strict');

// scoring.js relies on QUESTIONS/CATEGORIES globals — load them first
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function loadScript(relPath, ctx) {
  const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  vm.runInContext(code, ctx);
}

function buildContext() {
  const ctx = vm.createContext({ console, URLSearchParams });
  loadScript('docs/data/questions.js', ctx);
  loadScript('docs/js/scoring.js', ctx);
  return ctx;
}

test('returns the category with the lowest score', () => {
  const { getTopPriorityCategory } = buildContext();
  const scores = [
    { categoryId: 1, name: 'CI/CD', score: 80 },
    { categoryId: 2, name: 'セキュリティ', score: 20 },
    { categoryId: 3, name: 'テスト', score: 60 },
  ];
  const result = getTopPriorityCategory(scores);
  assert.equal(result.categoryId, 2);
});

test('when scores tie, returns the one with the lower categoryId', () => {
  const { getTopPriorityCategory } = buildContext();
  const scores = [
    { categoryId: 3, name: 'C', score: 30 },
    { categoryId: 1, name: 'A', score: 30 },
    { categoryId: 2, name: 'B', score: 30 },
  ];
  const result = getTopPriorityCategory(scores);
  assert.equal(result.categoryId, 1);
});

test('ignores null scores (対象外 categories)', () => {
  const { getTopPriorityCategory } = buildContext();
  const scores = [
    { categoryId: 1, name: 'A', score: null },
    { categoryId: 2, name: 'B', score: 50 },
    { categoryId: 3, name: 'C', score: 70 },
  ];
  const result = getTopPriorityCategory(scores);
  assert.equal(result.categoryId, 2);
});

test('returns null when all categories are null (全対象外)', () => {
  const { getTopPriorityCategory } = buildContext();
  const scores = [
    { categoryId: 1, score: null },
    { categoryId: 2, score: null },
  ];
  assert.equal(getTopPriorityCategory(scores), null);
});

test('returns null for empty array', () => {
  const { getTopPriorityCategory } = buildContext();
  assert.equal(getTopPriorityCategory([]), null);
});

test('buildResults includes topPriorityCategory field', () => {
  const { buildResults } = buildContext();
  const answers = {};
  const result = buildResults(answers, 'テスト');
  assert.ok('topPriorityCategory' in result);
});

test('topPriorityCategory is null when no answers given', () => {
  const { buildResults } = buildContext();
  const result = buildResults({}, 'テスト');
  assert.equal(result.topPriorityCategory, null);
});

test('topPriorityCategory matches the lowest-scoring category when answers exist', () => {
  const ctx = buildContext();
  // Run inside the vm context where QUESTIONS/CATEGORIES are accessible as consts
  const { answers, firstCategoryId } = vm.runInContext(`
    (function() {
      const ans = {};
      for (const q of QUESTIONS) {
        ans[q.id] = q.categoryId === CATEGORIES[0].id ? 0 : 3;
      }
      return { answers: ans, firstCategoryId: CATEGORIES[0].id };
    })()
  `, ctx);
  const result = ctx.buildResults(answers, 'テスト');
  assert.equal(result.topPriorityCategory.categoryId, firstCategoryId);
});
