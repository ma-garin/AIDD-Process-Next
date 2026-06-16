/* scoring.js — Pure scoring functions. Same input → same output, no side effects.
 * Scoring model is provisional pending the evidence review described in agent.md / sqec.md.
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

function calcCategoryScore(categoryId, answers) {
  const catQs = QUESTIONS.filter(q => q.categoryId === categoryId);
  const answered = catQs.filter(q => answers[q.id] !== undefined && answers[q.id] !== null);
  if (answered.length === 0) return null;
  const sum = answered.reduce((acc, q) => acc + answers[q.id], 0);
  return Math.round((sum / (answered.length * 3)) * 100);
}

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

function getTopPriorityCategory(categoryScores) {
  const valid = categoryScores.filter(s => s.score !== null);
  if (valid.length === 0) return null;
  return valid.reduce((min, s) =>
    s.score < min.score || (s.score === min.score && s.categoryId < min.categoryId) ? s : min
  );
}

function buildResults(answers, projectName) {
  const categoryScores = buildCategoryScores(answers);
  const totalScore = calcTotalScore(categoryScores);
  const level = determineLevel(totalScore);
  const risks = getRisks(answers);
  return {
    projectName: projectName || '対象プロジェクト未入力',
    answers,
    categoryScores,
    totalScore,
    level,
    risks,
    issues: getIssues(risks),
    topPriorityCategory: getTopPriorityCategory(categoryScores),
  };
}

function getRisks(answers) {
  return QUESTIONS
    .filter(q => {
      const s = answers[q.id];
      return s !== undefined && s !== null && s <= 1;
    })
    .map(q => ({
      id: q.id,
      categoryId: q.categoryId,
      question: q.question,
      score: answers[q.id],
      severity: answers[q.id] === 0 ? 'critical' : 'high',
      riskIfLow: q.riskIfLow,
      recommendation: q.recommendation,
      issueTemplate: q.issueTemplate,
      aiSelfCheck: q.aiSelfCheck,
    }))
    .sort((a, b) => a.score - b.score || a.categoryId - b.categoryId);
}

function getIssues(risks) {
  return risks.slice(0, 8).map((r, i) => ({
    number: i + 1,
    title: r.issueTemplate,
    priority: r.severity === 'critical' ? 'P1' : 'P2',
    category: CATEGORIES.find(c => c.id === r.categoryId)?.name || '',
    score: r.score,
  }));
}

function getAnsweredCount(answers) {
  return Object.keys(answers).filter(k => answers[k] !== undefined).length;
}

function getCategoryProgress(categoryId, answers) {
  const catQs = QUESTIONS.filter(q => q.categoryId === categoryId);
  const answered = catQs.filter(q => answers[q.id] !== undefined).length;
  return { answered, total: catQs.length };
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

  const totalAnswered = getAnsweredCount(results.answers);
  const completionPct = Math.round((totalAnswered / QUESTIONS.length) * 100);

  return `# AIDD Process Next 診断レポート

**対象プロジェクト:** ${results.projectName}  
**診断日:** ${date}  
**回答率:** ${totalAnswered}/${QUESTIONS.length}問（${completionPct}%）

---

## 総合結果

| 指標 | 値 |
|---|---|
| 総合スコア | **${results.totalScore}/100** |
| 成熟度 | **${results.level.icon} ${results.level.name}** |
| 優先リスク | 重大 ${results.risks.filter(r => r.severity === 'critical').length}件 / 高 ${results.risks.filter(r => r.severity === 'high').length}件 |

> ${results.level.description}

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

*Generated by AIDD Process Next v0.1 — 検証前ドラフト。*  
*スコアリングモデルは、300件規模の根拠レビュー完了まで暫定扱いです。*
`;
}

function generateSelfCheckPrompt(phase, results) {
  const riskLines = results.risks.slice(0, 5)
    .map(r => `- [${r.severity.toUpperCase()}] ${r.question}`)
    .join('\n');

  if (phase === 'pre-impl') return `## AIDD Process Next 実装前セルフチェック

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

  if (phase === 'pre-pr') return `## AIDD Process Next PR前セルフチェック

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

  return `## AIDD Process Next マージ前セルフチェック

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
