/* scoring.js — Pure scoring functions. Same input → same output, no side effects.
 * Scoring model is provisional pending 300-source evidence review (sqec.md §8.2).
 */

const LEVEL_CONFIG = [
  { min: 75, level: 3, name: 'Lv.3 Optimized',    icon: '✓', cssClass: 'lv3',
    description: 'Metrics-driven, self-auditing, continuously improving AI development process.' },
  { min: 50, level: 2, name: 'Lv.2 Systemized',   icon: '○', cssClass: 'lv2',
    description: 'Repeatable, defined processes with consistent quality gates and traceability.' },
  { min: 25, level: 1, name: 'Lv.1 Managed',      icon: '△', cssClass: 'lv1',
    description: 'Basic rules and human review exist but practices are inconsistent or informal.' },
  { min: 0,  level: 0, name: 'Lv.0 Uncontrolled', icon: '✗', cssClass: 'lv0',
    description: 'AI use is ad hoc, undocumented, and weakly reviewed. Significant risk exposure.' },
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
  if (score === null) return { name: 'N/A', icon: '—', cssClass: 'na', level: -1 };
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

function buildResults(answers, projectName) {
  const categoryScores = buildCategoryScores(answers);
  const totalScore = calcTotalScore(categoryScores);
  const level = determineLevel(totalScore);
  const risks = getRisks(answers);
  return {
    projectName: projectName || '[Project Name]',
    answers,
    categoryScores,
    totalScore,
    level,
    risks,
    issues: getIssues(risks),
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
    return `| ${s.name} | ${s.score !== null ? s.score + '/100' : 'N/A'} | ${lv.icon} ${lv.name} |`;
  }).join('\n');

  const riskRows = results.risks.slice(0, 10).map(r => {
    const catName = CATEGORIES.find(c => c.id === r.categoryId)?.name || '';
    return `| ${r.severity === 'critical' ? '🔴 Critical' : '🟡 High'} | ${catName} | ${r.question} |`;
  }).join('\n');

  const issueList = results.issues.map(issue =>
    `### [${issue.priority}] ${issue.title}\n- Category: ${issue.category}\n- Current Score: ${issue.score}/3`
  ).join('\n\n');

  const totalAnswered = getAnsweredCount(results.answers);
  const completionPct = Math.round((totalAnswered / QUESTIONS.length) * 100);

  return `# AIDD-QMA Assessment Report

**Project:** ${results.projectName}
**Date:** ${date}
**Completion:** ${totalAnswered}/${QUESTIONS.length} questions answered (${completionPct}%)

---

## Overall Result

| Metric | Value |
|---|---|
| Total Score | **${results.totalScore}/100** |
| Maturity Level | **${results.level.icon} ${results.level.name}** |
| High-Risk Areas | ${results.risks.filter(r => r.severity === 'critical').length} Critical, ${results.risks.filter(r => r.severity === 'high').length} High |

> ${results.level.description}

---

## Category Scores

| Category | Score | Level |
|---|---|---|
${catRows}

---

## High-Risk Areas

| Severity | Category | Finding |
|---|---|---|
${riskRows || '| — | — | No high-risk areas identified. |'}

---

## Improvement Issues

${issueList || '*No improvement issues generated (no scores ≤ 1).*'}

---

## Next Steps

1. Address Critical (P1) issues first — these represent the highest risk exposure.
2. Review the AI Agent Self-Check Prompts section for immediate agent guardrails.
3. Re-assess in 4-6 weeks after implementing top improvements.
4. Track improvement trend over time using the delta view.

---

*Generated by AIDD-QMA v0.1 — Research-Gate Draft.*
*Scoring model is provisional pending 300-source evidence review (sqec.md §8.2).*
`;
}

function generateSelfCheckPrompt(phase, results) {
  const riskLines = results.risks.slice(0, 5)
    .map(r => `- [${r.severity.toUpperCase()}] ${r.question}`)
    .join('\n');

  if (phase === 'pre-impl') return `## AIDD-QMA Pre-Implementation Self-Check

**Project Score:** ${results.totalScore}/100 (${results.level.name})

Before starting implementation, verify each item. Do not proceed until all blockers are resolved.

### Known High-Risk Areas for This Project
${riskLines || '- No critical risks identified in assessment.'}

### Checklist
- [ ] I have read the latest AGENTS.md / CLAUDE.md for this project.
- [ ] I have identified ALL files I will change and confirmed they are in scope.
- [ ] I have confirmed the spec, requirement, or task I am implementing exists in writing.
- [ ] I can state what "done" looks like in terms of verifiable, observable behavior.
- [ ] I have identified what tests will verify my implementation.
- [ ] I have separated facts I know from assumptions I am making — and labeled them.
- [ ] I have identified any security-sensitive areas in my scope (auth, data, secrets).

### Required Statement Before Starting
State one of:
- PROCEED: All checklist items verified. Scope is clear. Starting implementation.
- BLOCKED: [State specific item] is not clear. Requesting human clarification before proceeding.
`;

  if (phase === 'pre-pr') return `## AIDD-QMA Pre-PR Self-Check

**Project Score:** ${results.totalScore}/100 (${results.level.name})

Before creating a PR, verify every item. Do not create PR until blockers are resolved.

### Evidence Requirements
- [ ] List every file changed and the reason for each change.
- [ ] State the requirement, issue ID, or task ID this PR implements.
- [ ] Confirm no files outside declared scope were modified (verify with git diff).
- [ ] Tests were added or updated to cover changed behavior.
- [ ] All existing tests pass (show command output).
- [ ] No hardcoded secrets, credentials, or PII were introduced.
- [ ] CI lint and format checks pass.

### AI Contribution Disclosure
- [ ] I am disclosing which parts of this PR are AI-generated.
- [ ] AI-generated code has been reviewed by a human, not just read.
- [ ] I have verified AI assumptions — not just accepted them.
- [ ] I am not claiming "tested" for code I have not run.

### Required Completion Report Format
\`\`\`
## Completion Report

### Changed
- [file] — [reason]

### Evidence
- Tests: [command and result]
- Spec criteria met: [spec ref or "n/a"]

### Verified
- [what was confirmed with evidence]

### Not Verified
- [what was not tested — be explicit]

### Risks
- [remaining risks or "none identified"]

### Human Review Needed
- [specific items or "none"]
\`\`\`
`;

  return `## AIDD-QMA Pre-Merge Self-Check

**Project Score:** ${results.totalScore}/100 (${results.level.name})

Before approving a merge, every item must be verified. Blockers must be resolved before merge.

### Quality Gate Verification
- [ ] CI is passing (all checks green).
- [ ] Required reviewer has approved with substantive review (not rubber-stamp).
- [ ] PR description includes the completion report with evidence.
- [ ] No unresolved review comments remain.
- [ ] No TODO/FIXME markers were introduced in this PR.
- [ ] Breaking changes are documented and communicated.
- [ ] Dependent services, configurations, or documentation are updated.

### AI-Specific Merge Checklist
- [ ] AI-generated code sections are identified and received additional scrutiny.
- [ ] AI completion claims were verified with evidence — not taken on trust.
- [ ] No licensed or proprietary content was copied by the AI.
- [ ] AI-generated code does not introduce security regressions.
- [ ] Database or schema changes are reversible or migration-tested.

### Merge Authorization
State one of:
- APPROVED: All checklist items verified. I accept responsibility for this merge.
- BLOCKED: [state specific item] is not verified. Merge is blocked until resolved.
`;
}
