/* scoring.js — Pure scoring & generation functions. Same input → same output, no side effects
 * (timestamps in metadata excepted). Scoring model is provisional pending the evidence review
 * described in agent.md / sqec.md. Category and question weights are equal (1.0 / 0.1) until the
 * research gate assigns evidence-backed values.
 */

const LEVEL_CONFIG = [
  { min: 75, level: 3, name: 'Lv.3 最適化', icon: '✓', cssClass: 'lv3',
    description: 'AI開発プロセスが指標・証跡・自己監査に基づいて継続改善されている状態です。' },
  { min: 50, level: 2, name: 'Lv.2 仕組み化', icon: '○', cssClass: 'lv2',
    description: '反復可能なルール、品質ゲート、トレーサビリティが整備され、一定の再現性があります。' },
  { min: 25, level: 1, name: 'Lv.1 管理開始', icon: '△', cssClass: 'lv1',
    description: '基本ルールと人間レビューはありますが、運用は属人的・不安定です。' },
  { min: 0,  level: 0, name: 'Lv.0 未統制', icon: '✗', cssClass: 'lv0',
    description: 'AI利用が場当たり的で、文書化・レビュー・責任分界が弱い状態です。' },
];

/* ── Category score (AL5: question-weighted mean, scaled 0–100) ───────────────
 *   categoryScore = Σ(answer_i × weight_i) / (Σweight_i × 3) × 100
 * weight は暫定で均一 1.0（リサーチゲート後に根拠化）。weight 欠落時は 1 にフォールバックし、
 * 旧式（単純平均）と同値になる＝後方互換。 */
function calcCategoryScore(categoryId, answers) {
  const catQs = QUESTIONS.filter(q => q.categoryId === categoryId);
  const answered = catQs.filter(q => answers[q.id] !== undefined && answers[q.id] !== null);
  if (answered.length === 0) return null;
  const weightSum = answered.reduce((acc, q) => acc + (q.weight != null ? q.weight : 1), 0);
  const weighted = answered.reduce((acc, q) => acc + answers[q.id] * (q.weight != null ? q.weight : 1), 0);
  if (weightSum === 0) return null;
  return Math.round((weighted / (weightSum * 3)) * 100);
}

/* ── Total score (A1: documented weighted mean of category scores) ────────────
 *   totalScore = Σ(categoryScore × categoryWeight) / ΣcategoryWeight
 * categoryWeight は暫定で均一 0.1。N/A（score=null）の領域は母数から除外（A2）。 */
function calcTotalScore(categoryScores) {
  const valid = categoryScores.filter(s => s.score !== null);
  if (valid.length === 0) return 0;
  const weightedSum = valid.reduce((acc, s) => {
    const cat = CATEGORIES.find(c => c.id === s.categoryId);
    return acc + s.score * (cat ? cat.weight : 0.1);
  }, 0);
  const totalWeight = valid.reduce((acc, s) => {
    const cat = CATEGORIES.find(c => c.id === s.categoryId);
    return acc + (cat ? cat.weight : 0.1);
  }, 0);
  return Math.round((weightedSum / totalWeight));
}

function determineLevel(totalScore) {
  return LEVEL_CONFIG.find(l => totalScore >= l.min) || LEVEL_CONFIG[3];
}

function determineLevelForScore(score) {
  if (score === null) return { name: '対象外', icon: '—', cssClass: 'na', level: -1 };
  return determineLevel(score);
}

function buildCategoryScores(answers) {
  return CATEGORIES.map(cat => ({
    categoryId: cat.id,
    name: cat.name,
    abbr: cat.abbr,
    score: calcCategoryScore(cat.id, answers),
  }));
}

/* ── Confidence / completion (AL1) ───────────────────────────────────────────
 * 回答率が低いと総合レベルは誤誘導になりうるため、信頼度メタを算出し provisional を立てる。 */
function calcConfidence(answers) {
  const total = QUESTIONS.length;
  const answeredCount = QUESTIONS.filter(q => answers[q.id] !== undefined && answers[q.id] !== null).length;
  const naCount = QUESTIONS.filter(q => (q.id in answers) && answers[q.id] === null).length;
  const validCategories = CATEGORIES.filter(c => calcCategoryScore(c.id, answers) !== null).length;
  const completionRate = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  return { answeredCount, naCount, totalQuestions: total, validCategories, completionRate, provisional: completionRate < 70 };
}

/* ── Gap to next level (AL2) ──────────────────────────────────────────────── */
function calcGapToNextLevel(totalScore) {
  const current = determineLevel(totalScore);
  const higher = LEVEL_CONFIG.filter(l => l.min > totalScore).sort((a, b) => a.min - b.min)[0];
  if (!higher) return { atTop: true, current, nextLevel: null, gap: 0 };
  return { atTop: false, current, nextLevel: higher, gap: higher.min - totalScore };
}

/* ── Minimal-improvement suggestion (AL2) ────────────────────────────────────
 * 各低スコア回答を +1 した場合の総合点上昇を試算し、最も効く設問を提示する。 */
function suggestMinimalImprovement(answers, limit) {
  const cap = limit || 3;
  const baseTotal = calcTotalScore(buildCategoryScores(answers));
  return QUESTIONS
    .filter(q => { const s = answers[q.id]; return s !== undefined && s !== null && s < 3; })
    .map(q => {
      const trial = { ...answers, [q.id]: answers[q.id] + 1 };
      const delta = calcTotalScore(buildCategoryScores(trial)) - baseTotal;
      return { id: q.id, categoryId: q.categoryId, question: q.question, from: answers[q.id], to: answers[q.id] + 1, delta };
    })
    .sort((a, b) => b.delta - a.delta || a.categoryId - b.categoryId)
    .slice(0, cap);
}

function buildResults(answers, projectName) {
  const categoryScores = buildCategoryScores(answers);
  const totalScore = calcTotalScore(categoryScores);
  const level = determineLevel(totalScore);
  const risks = getRisks(answers);
  const confidence = calcConfidence(answers);
  const results = {
    projectName: projectName || '対象プロジェクト未入力',
    answers,
    categoryScores,
    totalScore,
    level,
    risks,
    issues: getIssues(risks),
    confidence,
    gapToNextLevel: calcGapToNextLevel(totalScore),
    incoherences: detectIncoherence(answers),
    sensitivity: calcSensitivity(answers),
    modelVersion: (typeof MODEL_VERSION !== 'undefined') ? MODEL_VERSION : '0.1.0',
    questionSetVersion: (typeof QUESTION_SET_VERSION !== 'undefined') ? QUESTION_SET_VERSION : '',
    generatedAt: new Date().toISOString(),
  };
  results.rationale = buildRationale(results);
  return results;
}

/* ── Risk extraction with composite priority (A3 / AL3) ───────────────────────
 * 並び順を「(3-score) × カテゴリ重み × 設問重み × 重大度係数」で複合化し、
 * 単なるスコア昇順よりリスクの重要度を反映する。 */
function getRisks(answers) {
  return QUESTIONS
    .filter(q => { const s = answers[q.id]; return s !== undefined && s !== null && s <= 1; })
    .map(q => {
      const cat = CATEGORIES.find(c => c.id === q.categoryId);
      const catWeight = cat ? cat.weight : 0.1;
      const score = answers[q.id];
      const severity = score === 0 ? 'critical' : 'high';
      const priorityScore = (3 - score) * catWeight * (q.weight != null ? q.weight : 1) * (severity === 'critical' ? 1.5 : 1);
      return {
        id: q.id,
        categoryId: q.categoryId,
        question: q.question,
        score,
        severity,
        riskIfLow: q.riskIfLow,
        recommendation: q.recommendation,
        issueTemplate: q.issueTemplate,
        aiSelfCheck: q.aiSelfCheck,
        priorityScore,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.score - b.score || a.categoryId - b.categoryId);
}

/* ── Issue generation with dynamic count (A3 / AL3) ───────────────────────────
 * 固定8件ではなく、重大(critical)は全件、高(high)を含めて上限12件まで動的に出す。 */
function getIssues(risks) {
  const criticalCount = risks.filter(r => r.severity === 'critical').length;
  const cap = Math.min(Math.max(criticalCount, 8), 12);
  return risks.slice(0, cap).map((r, i) => ({
    number: i + 1,
    title: r.issueTemplate,
    priority: r.severity === 'critical' ? 'P1' : 'P2',
    category: CATEGORIES.find(c => c.id === r.categoryId)?.name || '',
    score: r.score,
  }));
}

/* ── Incoherence detection (AL4) ─────────────────────────────────────────────
 * 論理的に起きにくいカテゴリスコアの組合せを決定的ルールで検出し、再確認を促す。
 * しきい値: 高 = 67点以上(Lv.2相当)、著しく低い = 17点以下(平均0.5以下)。 */
const INCOHERENCE_RULES = [
  { id: 'selfaudit-vs-review', highCat: 9, lowCat: 4,
    message: '自己監査（領域9）が高い一方で、AI成果物レビュー（領域4）が著しく低い状態です。自己点検が実態を伴っているか再確認してください。' },
  { id: 'cicd-vs-testing', highCat: 6, lowCat: 5,
    message: 'CI/CD・品質ゲート（領域6）が高い一方で、テスト・自動化（領域5）が低い状態です。ゲートの実効性（テスト不在で通過していないか）を確認してください。' },
  { id: 'traceability-vs-instructions', highCat: 8, lowCat: 2,
    message: 'トレーサビリティ（領域8）が高い一方で、エージェント指示管理（領域2）が低い状態です。追跡対象となる指示・規約の基盤を確認してください。' },
];
function detectIncoherence(answers) {
  const byCat = {};
  CATEGORIES.forEach(c => { byCat[c.id] = calcCategoryScore(c.id, answers); });
  return INCOHERENCE_RULES
    .filter(r => {
      const hi = byCat[r.highCat];
      const lo = byCat[r.lowCat];
      return hi !== null && lo !== null && hi >= 67 && lo <= 17;
    })
    .map(r => ({ id: r.id, message: r.message }));
}

/* ── Sensitivity / stability (AL6) ───────────────────────────────────────────
 * 各回答を ±1 したとき総合レベルが変わる「閾値付近」の脆さを開示し、過信を防ぐ。 */
function calcSensitivity(answers) {
  const baseTotal = calcTotalScore(buildCategoryScores(answers));
  const baseLevel = determineLevel(baseTotal).level;
  let pivotal = 0;
  QUESTIONS.forEach(q => {
    const s = answers[q.id];
    if (s === undefined || s === null) return;
    [s - 1, s + 1].forEach(v => {
      if (v < 0 || v > 3) return;
      const trial = { ...answers, [q.id]: v };
      const lvl = determineLevel(calcTotalScore(buildCategoryScores(trial))).level;
      if (lvl !== baseLevel) pivotal++;
    });
  });
  const nearest = Math.min(...[25, 50, 75].map(t => Math.abs(t - baseTotal)));
  let stability = '高';
  if (pivotal > 0 || nearest <= 2) stability = '低';
  else if (nearest <= 6) stability = '中';
  return { baseTotal, baseLevel, pivotalCount: pivotal, nearestThresholdDistance: nearest, stability };
}

/* ── Rationale (C3) ──────────────────────────────────────────────────────────
 * 「なぜこの結果か」: 加重平均である旨、弱い/強い領域、最も効く改善ドライバを構造化。 */
function buildRationale(results) {
  const sorted = results.categoryScores.filter(s => s.score !== null).slice().sort((a, b) => a.score - b.score);
  return {
    summary: `総合 ${results.totalScore}/100 は、回答済み ${results.confidence.validCategories} 領域の加重平均です。`,
    weakest: sorted.slice(0, 3),
    strongest: sorted.slice(-3).reverse(),
    drivers: suggestMinimalImprovement(results.answers, 3),
    note: results.confidence.provisional
      ? `回答率 ${results.confidence.completionRate}% のため、総合レベルは暫定です。回答を増やすと確度が上がります。`
      : `回答率 ${results.confidence.completionRate}%。`,
  };
}

function getAnsweredCount(answers) {
  return Object.keys(answers).filter(k => answers[k] !== undefined).length;
}

function getCategoryProgress(categoryId, answers) {
  const catQs = QUESTIONS.filter(q => q.categoryId === categoryId);
  const answered = catQs.filter(q => answers[q.id] !== undefined).length;
  return { answered, total: catQs.length };
}

/* ── Schema / answer validation (F4) ─────────────────────────────────────────── */
function validateQuestionSchema(questions) {
  const errors = [];
  const seen = new Set();
  const REQUIRED = ['id', 'categoryId', 'target', 'question', 'choices', 'riskIfLow', 'recommendation', 'issueTemplate', 'aiSelfCheck'];
  (questions || []).forEach((q, idx) => {
    REQUIRED.forEach(f => { if (q[f] === undefined || q[f] === null) errors.push(`Q[${q.id || idx}] 欠落フィールド: ${f}`); });
    if (q.id) { if (seen.has(q.id)) errors.push(`重複ID: ${q.id}`); seen.add(q.id); }
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`Q[${q.id || idx}] choices は4件必要です`);
    } else {
      q.choices.forEach(c => { if (![0, 1, 2, 3].includes(c.score)) errors.push(`Q[${q.id || idx}] 不正なscore: ${c.score}`); });
    }
    if (!['human', 'ai', 'repo'].includes(q.target)) errors.push(`Q[${q.id || idx}] 不正なtarget: ${q.target}`);
  });
  return { valid: errors.length === 0, errors };
}

function validateAnswers(answers) {
  const errors = [];
  const ids = new Set(QUESTIONS.map(q => q.id));
  Object.keys(answers || {}).forEach(k => {
    if (!ids.has(k)) errors.push(`未知の設問ID: ${k}`);
    const v = answers[k];
    if (v !== null && ![0, 1, 2, 3].includes(v)) errors.push(`${k} の不正なscore: ${v}`);
  });
  return { valid: errors.length === 0, errors };
}

/* ── Export / import (F3) ─────────────────────────────────────────────────────── */
function generateDiagnosisJSON(payload) {
  return JSON.stringify({
    schema: 'aidd-process-next/diagnosis',
    modelVersion: (typeof MODEL_VERSION !== 'undefined') ? MODEL_VERSION : '0.1.0',
    questionSetVersion: (typeof QUESTION_SET_VERSION !== 'undefined') ? QUESTION_SET_VERSION : '',
    exportedAt: new Date().toISOString(),
    projectName: (payload && payload.projectName) || '',
    answers: (payload && payload.answers) || {},
    memos: (payload && payload.memos) || {},
  }, null, 2);
}

function parseDiagnosisJSON(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, error: 'JSONの解析に失敗しました。' }; }
  if (!data || typeof data !== 'object' || typeof data.answers !== 'object' || data.answers === null) {
    return { ok: false, error: '診断データの形式が不正です（answers が見つかりません）。' };
  }
  const v = validateAnswers(data.answers);
  if (!v.valid) return { ok: false, error: '回答データに不正な項目があります: ' + v.errors.slice(0, 3).join(' / ') };
  return { ok: true, answers: data.answers, projectName: data.projectName || '', memos: data.memos || {} };
}

function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function generateReportCSV(results) {
  const rows = [['category', 'score', 'level']];
  results.categoryScores.forEach(s => {
    const lv = determineLevelForScore(s.score);
    rows.push([s.name, s.score !== null ? String(s.score) : 'NA', lv.name]);
  });
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
}

/* ── Issue export (C2) ───────────────────────────────────────────────────────── */
function generateGithubIssues(results) {
  return results.issues.map(issue => {
    const risk = results.risks.find(r => r.issueTemplate === issue.title);
    const body = [
      '## 背景',
      risk ? risk.riskIfLow : '',
      '',
      '## 推奨対応',
      risk ? risk.recommendation : '',
      '',
      '## メタ',
      `- 優先度: ${issue.priority}`,
      `- 領域: ${issue.category}`,
      `- 現在スコア: ${issue.score}/3`,
      `- 出典: AIDD Process Next 診断（${results.projectName}）`,
    ].join('\n');
    return { title: `[${issue.priority}] ${issue.title}`, body, labels: ['aidd', issue.priority.toLowerCase()] };
  });
}

function generateIssuesCSV(results) {
  const rows = [['priority', 'category', 'score', 'title', 'recommendation']];
  results.issues.forEach(issue => {
    const risk = results.risks.find(r => r.issueTemplate === issue.title);
    rows.push([issue.priority, issue.category, String(issue.score), issue.title, risk ? risk.recommendation : '']);
  });
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
}

/* ── Maturity badge (FT6) ────────────────────────────────────────────────────── */
function generateBadgeSVG(level) {
  const colors = { lv0: '#D32F2F', lv1: '#B45309', lv2: '#0F62FE', lv3: '#1F8A4C' };
  const color = colors[level.cssClass] || '#6B7280';
  const label = 'AIDD成熟度';
  const value = level.name;
  const lw = 86, vw = 110, h = 20, w = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${label}: ${value}">
  <rect width="${lw}" height="${h}" fill="#3A3F44"/>
  <rect x="${lw}" width="${vw}" height="${h}" fill="${color}"/>
  <g fill="#fff" font-family="Verdana,'Noto Sans JP',sans-serif" font-size="11" text-anchor="middle">
    <text x="${lw / 2}" y="14">${label}</text>
    <text x="${lw + vw / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

function generateBadgeMarkdown(results) {
  const svg = generateBadgeSVG(results.level);
  const b64 = (typeof btoa !== 'undefined')
    ? btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg, 'utf-8').toString('base64');
  return `![AIDD Process Next 成熟度](data:image/svg+xml;base64,${b64})`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateMarkdownReport(results) {
  const date = new Date().toISOString().split('T')[0];
  const conf = results.confidence;
  const gap = results.gapToNextLevel;
  const sens = results.sensitivity;

  const catRows = results.categoryScores.map(s => {
    const lv = determineLevelForScore(s.score);
    return `| ${s.name} | ${s.score !== null ? s.score + '/100' : '対象外'} | ${lv.icon} ${lv.name} |`;
  }).join('\n');

  const riskRows = results.risks.slice(0, 10).map(r => {
    const catName = CATEGORIES.find(c => c.id === r.categoryId)?.name || '';
    return `| ${r.severity === 'critical' ? '重大' : '高'} | ${catName} | ${r.question} | ${r.recommendation} |`;
  }).join('\n');

  const issueList = results.issues.map(issue =>
    `### [${issue.priority}] ${issue.title}\n- 領域: ${issue.category}\n- 現在スコア: ${issue.score}/3`
  ).join('\n\n');

  const driverList = results.rationale.drivers.map(d =>
    `- ${d.question}（${d.from}→${d.to} で総合 +${d.delta}）`
  ).join('\n') || '- 改善ドライバはありません（既に高スコアです）。';

  const incoherenceList = results.incoherences.length
    ? results.incoherences.map(i => `- ${i.message}`).join('\n')
    : '- 整合性上の警告は検出されませんでした。';

  const gapText = gap.atTop
    ? '最高レベルに到達しています。'
    : `次のレベル（${gap.nextLevel.name}）まで あと **${gap.gap}** ポイントです。`;

  return `# AIDD Process Next 診断レポート

**対象プロジェクト:** ${results.projectName}
**診断日:** ${date}
**回答率:** ${conf.answeredCount}/${conf.totalQuestions}問（${conf.completionRate}%${conf.naCount ? ` / 対象外 ${conf.naCount}件` : ''}）
**モデル版:** ${results.modelVersion} ・ **設問セット版:** ${results.questionSetVersion}

---

## 総合結果

| 指標 | 値 |
|---|---|
| 総合スコア | **${results.totalScore}/100** |
| 成熟度 | **${results.level.icon} ${results.level.name}** |
| 優先リスク | 重大 ${results.risks.filter(r => r.severity === 'critical').length}件 / 高 ${results.risks.filter(r => r.severity === 'high').length}件 |
| 信頼度 | 回答率 ${conf.completionRate}%（${conf.provisional ? '暫定' : '十分'}） ・ 安定性 ${sens.stability} |

> ${results.level.description}
${conf.provisional ? `\n> ⚠ ${results.rationale.note}` : ''}

---

## 次レベルまで

${gapText}

**最も効く改善（+1で総合点を最大化）:**
${driverList}

---

## 整合性チェック

${incoherenceList}

---

## カテゴリ別スコア

| 領域 | スコア | レベル |
|---|---|---|
${catRows}

---

## 優先リスク

| 重要度 | 領域 | 所見 | 推奨対応 |
|---|---|---|---|
${riskRows || '| — | — | 優先リスクは検出されませんでした。 | — |'}

---

## 改善Issue案

${issueList || '*スコア1以下の項目がないため、改善Issue案は生成されませんでした。*'}

---

## 次アクション

1. P1（重大）を最優先でIssue化し、担当・期限・完了条件を決める。
2. AIエージェント自己点検プロンプトをAGENTS.md / CLAUDE.mdへ反映する。
3. 4〜6週間後に再診断し、スコア差分と残リスクを確認する。
4. 改善結果をテンプレート、レビュー観点、品質ゲートへ展開する。

---

*Generated by AIDD Process Next ${results.modelVersion} — 検証前ドラフト。*
*スコアリングモデルは、300件規模の根拠レビュー完了まで暫定扱いです。*
`;
}

/* ── Self-check prompt (C5: per-agent preface + F2: staged) ──────────────────── */
function selfCheckPreface(aiModel) {
  switch (aiModel) {
    case 'claude': return '> 対象エージェント: Claude Code。CLAUDE.md / AGENTS.md を読み込んだ上で、本チェックを適用してください。\n\n';
    case 'codex':  return '> 対象エージェント: Codex / GPT系。リポジトリの AGENTS.md を読み込んだ上で、本チェックを適用してください。\n\n';
    case 'cursor': return '> 対象エージェント: Cursor。.cursor/rules（または AGENTS.md）を読み込んだ上で、本チェックを適用してください。\n\n';
    default: return '';
  }
}

function generateSelfCheckPrompt(phase, results, aiModel) {
  const preface = selfCheckPreface(aiModel || 'generic');
  const riskLines = results.risks.slice(0, 5)
    .map(r => `- [${r.severity.toUpperCase()}] ${r.question}`)
    .join('\n');

  if (phase === 'pre-impl') return preface + `## AIDD Process Next 実装前セルフチェック

**プロジェクトスコア:** ${results.totalScore}/100（${results.level.name}）

実装前に以下を確認してください。ブロッカーが残る場合は作業を開始しないでください。

### このプロジェクトの優先リスク
${riskLines || '- 診断上の重大リスクはありません。'}

### チェックリスト
- [ ] 最新のAGENTS.md / CLAUDE.md / CURRENT_STATE.mdを読んだ。
- [ ] 変更する全ファイルを特定し、スコープ内であることを確認した。
- [ ] 仕様、要件、Issue、タスクのいずれかに作業根拠がある。
- [ ] 完了条件を、観察可能・検証可能な形で説明できる。
- [ ] どのテスト・確認で完了を判断するか決めた。
- [ ] 事実、推定、未確認事項を分けた。
- [ ] 認証、データ、秘密情報などのセキュリティ影響を確認した。

### 開始前の宣言
次のいずれかで回答してください。
- PROCEED: 全項目を確認済み。スコープは明確。実装を開始する。
- BLOCKED: [具体項目] が不明。人間の確認が必要。
`;

  if (phase === 'pre-pr') return preface + `## AIDD Process Next PR前セルフチェック

**プロジェクトスコア:** ${results.totalScore}/100（${results.level.name}）

PR作成前に以下を確認してください。未確認が残る場合はPR本文に明記してください。

### 証跡要件
- [ ] 変更した全ファイルと変更理由を列挙した。
- [ ] 対応した仕様、Issue ID、タスクIDを記載した。
- [ ] 宣言したスコープ外のファイルを変更していないことをgit diffで確認した。
- [ ] 変更挙動を確認するテストを追加または更新した。
- [ ] 既存テストを実行し、結果を記録した。
- [ ] 秘密情報、認証情報、個人情報を追加していない。
- [ ] lint、format、build、CI相当の確認結果を記録した。

### AI支援の開示
- [ ] AIが生成・修正した範囲を明記した。
- [ ] AI生成コードを人間がレビュー可能な粒度に分割した。
- [ ] AIの前提・推定を検証した。
- [ ] 実行していない確認を「確認済み」と書いていない。

### 完了報告フォーマット
\`\`\`
## 完了報告

### 変更内容
- [file] — [reason]

### 証跡
- Tests: [command and result]
- Spec criteria met: [spec ref or n/a]

### 確認済み
- [evidence]

### 未確認
- [not verified / reason]

### 残リスク
- [risk / mitigation]
\`\`\`
`;

  return preface + `## AIDD Process Next マージ前セルフチェック

**プロジェクトスコア:** ${results.totalScore}/100（${results.level.name}）

マージ前に以下を確認してください。例外がある場合は承認者と理由を記録してください。

### マージ条件
- [ ] P1/P2指摘が未対応のまま残っていない。
- [ ] CI、テスト、ビルド、静的解析の結果を確認した。
- [ ] レビュー指摘への対応と再確認結果を記録した。
- [ ] 未確認事項がPR本文またはIssueに残っている。
- [ ] リリース後に追跡すべき残リスクがある場合、別Issue化した。
- [ ] AI支援変更として追跡できるタグ・記録を残した。

### 判断
次のいずれかで回答してください。
- MERGE_READY: マージ条件を満たしている。
- HOLD: [理由] によりマージ保留。
`;
}

/* Node (test harness) からの参照用。ブラウザ実行時の挙動には影響しない。 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVEL_CONFIG, calcCategoryScore, calcTotalScore, determineLevel, determineLevelForScore,
    buildCategoryScores, calcConfidence, calcGapToNextLevel, suggestMinimalImprovement, buildResults,
    getRisks, getIssues, detectIncoherence, calcSensitivity, buildRationale,
    getAnsweredCount, getCategoryProgress, validateQuestionSchema, validateAnswers,
    generateDiagnosisJSON, parseDiagnosisJSON, generateReportCSV, generateGithubIssues, generateIssuesCSV,
    generateBadgeSVG, generateBadgeMarkdown, escapeHtml, generateMarkdownReport, generateSelfCheckPrompt,
  };
}
