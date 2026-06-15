# AIDD-QMA

**AI-Driven Development Quality Maturity Assessment**

Version: 0.1 / Research-Gate Draft

> This model is provisional. The 300-source evidence review required by `agent.md §5` has not been completed. Scores are indicative, not normative.

---

## What v0.1 Does

- 50-question self-assessment across 10 diagnostic areas (human + AI agent + repository)
- Maturity scoring: Lv.0 Uncontrolled → Lv.3 Optimized
- Risk identification with severity (Critical / High)
- Improvement issue drafts
- AI agent self-check prompts for pre-implementation, pre-PR, and pre-merge phases
- Markdown report export

## What v0.1 Does Not Do

- No backend, no authentication, no database
- No AI API calls
- No normative certification or compliance guarantee
- No automated repository evidence collection (planned for v0.2)
- Scoring weights are provisional (equal 10% per category)

---

## Setup

**Option A — Local server (recommended)**

```bash
npm run dev
# Open http://localhost:3000
```

Requires Node.js. Uses `npx serve` (downloaded automatically on first run).

**Option B — Python**

```bash
cd docs
python3 -m http.server 3000
# Open http://localhost:3000
```

**Option C — Direct file open**

Open `docs/index.html` in a browser by double-clicking.
All features work without a server. The radar chart is rendered as inline SVG (no CDN required).

---

## Data Structure

Questions are defined in `docs/data/questions.js`. Each question follows the schema from `sqec.md §12.2`:

```js
{
  id: 'C1-Q1',
  categoryId: 1,
  question: '...',
  target: 'human' | 'ai' | 'repo',
  choices: [
    { score: 0, label: 'None',      description: '(BARS level 0)' },
    { score: 1, label: 'Informal',  description: '(BARS level 1)' },
    { score: 2, label: 'Defined',   description: '(BARS level 2)' },
    { score: 3, label: 'Optimized', description: '(BARS level 3)' },
  ],
  riskIfLow: '...',
  recommendation: '...',
  issueTemplate: '...',
  aiSelfCheck: '...',
}
```

To modify questions, edit `docs/data/questions.js` and reload the browser (TC-009).

---

## Scoring

- Each question: 0–3 points
- Category score: `(sum of answered scores) / (answered count × 3) × 100`
- Total score: weighted average of category scores (equal weights, provisional)
- N/A answers are excluded from the denominator

| Score | Level |
|---:|---|
| 75–100 | Lv.3 Optimized |
| 50–74  | Lv.2 Systemized |
| 25–49  | Lv.1 Managed |
| 0–24   | Lv.0 Uncontrolled |

---

## Security / Privacy

- No data is transmitted to external servers
- Assessment data stays in the browser (no persistence between sessions in v0.1)
- Do not enter secrets, credentials, or personal information in the project name field
- All dynamic content in HTML is escaped before rendering (`escapeHtml`)
- Event handlers use data attributes and event delegation — no inline script in dynamic HTML
- See `sqec.md §11` for full v0.1 security assumptions

---

## File Structure

```
docs/
├── index.html              Main application
├── css/
│   ├── tokens.css          Design tokens (colors, spacing, typography)
│   └── style.css           Component styles
├── data/
│   ├── questions.js        50 questions with BARS descriptions
│   └── sample-answers.js   Pre-filled sample assessment
└── js/
    ├── scoring.js          Pure scoring functions (no side effects)
    └── app.js              UI state machine and rendering
agent.md                    Project operating manual and research gate
sqec.md                     Acceptance criteria
615.md                      Improvement proposals (2026-06-15)
```

---

## Contractor Handover Notes

External developers must read `agent.md` and `sqec.md` before making changes. Key constraints:

- Questions must remain in `docs/data/questions.js`, never hard-coded in UI (`sqec.md §12.1`)
- Scoring logic is in `docs/js/scoring.js` as pure functions — do not mix with rendering
- Do not add backend, auth, DB, or AI API without explicit instruction (`agent.md §7`)
- Do not replace the B2B QA design with consumer AI aesthetics (`sqec.md §10.1`)
- See `sqec.md §17` for the complete contractor acceptance checklist

---

## Known Limitations

- Scoring weights are equal (10% per category) — provisional until evidence review completes
- No session persistence (answers reset on page refresh)
- No external JS dependencies; radar chart is SVG-based
- Model has not been validated against empirical data from real development teams

---

## Research Gate Status

As of v0.1: **Not complete.**

Required before model freeze (`agent.md §5`):
- [ ] 150 TPI / test process improvement sources reviewed
- [ ] 150 AIDD / AI-assisted development sources reviewed
- [ ] Evidence matrix (`docs/evidence_matrix_template.csv`) populated
- [ ] Research brief complete (`docs/research_brief.md`)

See `agent.md §6 Phase 1–2` for required deliverables.
