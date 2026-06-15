# sqec.md

# AIDD-QMA SQEC: Software Quality Engineering Criteria

Version: 0.1 / Research-Gate Draft  
Status: Draft. This file defines acceptance and quality criteria for AIDD-QMA. It is not a final standard until the research gate in `agent.md` is complete.

---

## 1. Purpose

SQEC stands for **Software Quality Engineering Criteria** in this project.

This file defines the acceptance criteria for the AIDD-QMA product, model, documentation, design, and implementation. It is intended for:

- Product owner review
- QA review
- AI agent self-review
- External contractor acceptance
- Future regression checks

AIDD-QMA must not be accepted merely because the web app works. It must be accepted only when the model, evidence, design, outputs, security posture, and maintainability satisfy the criteria in this document.

---

## 2. Acceptance Philosophy

AIDD-QMA is a quality maturity assessment service. Therefore, the product itself must demonstrate quality discipline.

The product must be:

- Evidence-backed
- Original
- Explainable
- Actionable
- Useful for both humans and AI agents
- Easy to verify
- Easy to maintain
- Safe enough for early B2B use
- Small enough for v0.1 delivery

The product must not be:

- A TPI NEXT clone
- A QA4AIDD copy
- A generic checklist app
- A flashy AI-themed dashboard without assessment depth
- A tool that scores projects without explaining risks and next actions

---

## 3. Quality Gates

AIDD-QMA must pass the following gates.

| Gate | Name | Required for v0.1 |
|---:|---|---|
| QG-1 | Evidence Quality Gate | Required for model freeze |
| QG-2 | Concept Originality Gate | Required for RFD v1.0 |
| QG-3 | Functional Gate | Required for implementation acceptance |
| QG-4 | Scoring Validity Gate | Required for report acceptance |
| QG-5 | AI-Agent Usability Gate | Required for differentiation |
| QG-6 | UX / Design Gate | Required for product acceptance |
| QG-7 | Security / Privacy Gate | Required for public demo |
| QG-8 | Maintainability Gate | Required for external handover |
| QG-9 | Test Evidence Gate | Required for final delivery |

---

## 4. Severity Levels

| Severity | Meaning | Example |
|---|---|---|
| S0 Blocker | Cannot accept delivery | Scoring is wrong, app cannot run, copied proprietary content |
| S1 Critical | Must fix before release | Report output missing, High risks not shown, unsafe data handling |
| S2 Major | Fix before serious use | Weak layout, missing README details, incomplete sample data |
| S3 Minor | Can defer | Small copy issue, minor spacing issue, optional enhancement |

---

## 5. Evidence Quality Criteria

### 5.1 Required Evidence Volume

The following must be completed before the final model is frozen.

| Area | Minimum Sources | Acceptance |
|---|---:|---|
| TPI / test process improvement / maturity models | 150 | Evidence matrix complete |
| AIDD / AI-assisted development / AI agents / AI quality | 150 | Evidence matrix complete |
| Total | 300 | Research brief complete |

### 5.2 Evidence Acceptance Criteria

Pass criteria:

- At least 300 sources are listed in the evidence matrix.
- At least 150 sources are tagged as TPI, test process improvement, maturity model, or adjacent process-improvement evidence.
- At least 150 sources are tagged as AIDD, AI-assisted software development, AI coding agent, AI quality, AI risk, AI security, or adjacent evidence.
- Each source has an extracted implication for AIDD-QMA.
- Sources are classified by reliability.
- Official and standards-based sources are clearly separated from vendor or blog sources.
- Copyright and naming risks are flagged.

Fail criteria:

- The model is finalized from memory.
- Source count is asserted but not listed.
- Evidence is mostly vendor marketing without official or academic anchors.
- TPI or QA4AIDD concepts are copied without adaptation.
- Claims are made without source or reasoning.

---

## 6. Concept Originality Criteria

AIDD-QMA must be original and defensible.

### 6.1 Required Differentiators

The model must clearly include:

- Human assessment
- AI agent self-assessment
- Repository/workflow evidence
- Improvement issue generation
- Pre-PR and pre-merge self-check use cases
- AI-generated artifact review criteria
- Prompt and agent-instruction management
- Quality gate maturity
- Traceability from requirement to PR to test to release

### 6.2 Prohibited Positioning

Do not position AIDD-QMA as:

- TPI NEXT for AI
- Agile TPI for AI
- QA4AIDD-compatible unless verified
- A certification or audit standard
- A legal or compliance substitute
- A guarantee of AI-generated software quality

### 6.3 Pass Criteria

- AIDD-QMA has its own model structure.
- Any borrowed concept is adapted and cited in research docs.
- Naming avoids direct product confusion with existing models or services.
- The model can explain why AI agents are both subject and user of the assessment.

---

## 7. Functional Criteria

### 7.1 Must-Have Functions for v0.1

| ID | Function | Acceptance Criteria |
|---|---|---|
| F-001 | Start assessment | User can start a diagnosis from the top screen |
| F-002 | Display categories | Assessment categories are shown from JSON data |
| F-003 | Display questions | Questions are shown from JSON data, not hard-coded UI text |
| F-004 | Input answers | User can choose 0-3 score-level answers |
| F-005 | Navigate questions | User can move forward and backward |
| F-006 | Calculate category score | Each category score is calculated correctly |
| F-007 | Calculate total score | Total score is calculated correctly |
| F-008 | Determine maturity level | Lv.0-Lv.3 is assigned consistently |
| F-009 | Show risk summary | Low-score risks are visible |
| F-010 | Show improvement issues | Improvement issue drafts are generated or selected |
| F-011 | Show AI self-check prompt | AI-agent prompt is displayed and copyable |
| F-012 | Export Markdown report | User can copy or export Markdown report |
| F-013 | Load sample data | Sample assessment can be loaded for demo/review |
| F-014 | Reset assessment | User can reset answers intentionally |
| F-015 | Documentation | README explains setup, use, and limitations |

### 7.2 Functional Fail Conditions

- App cannot run locally.
- Questions are hard-coded in components.
- Scoring differs between UI and report.
- Report does not include risks or improvement actions.
- AI self-check prompt is missing.
- User cannot reproduce a sample result.

---

## 8. Scoring Validity Criteria

### 8.1 Basic Scoring

Initial scoring may use 0-3 values per question.

| Score | Meaning |
|---:|---|
| 0 | Not defined / uncontrolled |
| 1 | Partially defined / manually managed |
| 2 | Defined and repeatable |
| 3 | Measured, improved, and systematically controlled |

### 8.2 Level Mapping

Initial mapping:

| Total Score | Level |
|---:|---|
| 0-24 | Lv.0 Uncontrolled |
| 25-49 | Lv.1 Managed |
| 50-74 | Lv.2 Systemized |
| 75-100 | Lv.3 Optimized |

This mapping is provisional. It must be revalidated after research.

### 8.3 Scoring Acceptance

Pass criteria:

- Formula is documented.
- Category score and total score are reproducible by hand calculation.
- Boundary scores are tested.
- Empty or incomplete answers are handled explicitly.
- Report and dashboard show the same score.

Fail criteria:

- Score changes unexpectedly on reload.
- Level thresholds are hidden.
- Low-risk and high-risk categories are indistinguishable.
- Improvement issues are not tied to low-scoring areas.

---

## 9. AI-Agent Usability Criteria

AIDD-QMA must be usable by AI agents, not only human users.

### 9.1 Required AI Outputs

The report must include:

- AI-agent self-check prompt
- Pre-implementation checklist
- Pre-PR checklist
- Pre-merge checklist
- Human-review-required flags
- Improvement issue drafts
- Clear `OK / NG / Needs confirmation` style output instructions

### 9.2 AI-Agent Acceptance Criteria

Pass criteria:

- AI can read the Markdown output and perform self-review.
- The prompt asks AI to distinguish verified facts, assumptions, and unverified items.
- The prompt prevents false completion claims.
- The prompt asks for affected files, tests, risks, and human review needs.
- The prompt can be pasted into Claude Code, Codex, Cursor, or another coding agent.

Fail criteria:

- The report is only visual and not machine-readable.
- The AI prompt is vague.
- The AI prompt allows completion without evidence.
- The AI prompt does not include test/risk/security/traceability checks.

---

## 10. UX and Design Criteria

### 10.1 Design Direction

The product must look like:

- A B2B quality assessment tool
- A QA maturity dashboard
- A risk and improvement management tool
- A consulting-grade diagnostic report
- A development governance portal

The product must not look like:

- A consumer AI chatbot
- A flashy AI landing page
- A generic form app
- A toy maturity quiz
- A dashboard made only of identical cards

### 10.2 Layout Criteria

Pass criteria:

- PC-first layout is clean and stable.
- Left-side navigation or equivalent information architecture exists.
- Dashboard, assessment, risks, improvement issues, AI self-check, and report areas are clearly separated.
- Results screen prioritizes score, maturity, high risks, and next actions.
- Report screen can be shown to QA leads, PMs, and managers without looking casual.

### 10.3 Color Criteria

Pass criteria:

- Color usage is semantic.
- Red means high risk or critical.
- Amber means warning or medium risk.
- Green means controlled or acceptable.
- Blue means information or primary action.
- Gray means neutral, inactive, or unassessed.
- Background is calm: white, off-white, light gray, navy, or slate.

Fail criteria:

- Neon AI colors dominate the UI.
- Purple gradients are used without purpose.
- Risk colors are decorative.
- Important actions depend on color alone.

### 10.4 Report Design Criteria

Pass criteria:

- The report has clear hierarchy.
- Scores and risks are visible at a glance.
- Risk and improvement are paired.
- Markdown output preserves useful structure.
- Future PDF output is feasible.

---

## 11. Security and Privacy Criteria

### 11.1 v0.1 Security Assumptions

For v0.1:

- No login is required.
- No backend is required.
- No database is required.
- No AI API call is required.
- No external transmission of assessment content is required.

### 11.2 Required Controls

Pass criteria:

- User input is escaped before rendering.
- The UI warns users not to enter secrets, credentials, or personal information.
- The app does not silently send assessment data externally.
- Dependencies are reviewed at least manually before handover.
- A basic security note exists in README.

Fail criteria:

- Assessment content is sent to an external API without explicit consent.
- Secrets or personal information are requested as normal input.
- HTML injection is possible in report display.
- Dependency risks are ignored entirely.

---

## 12. Maintainability Criteria

### 12.1 Architecture Criteria

Pass criteria:

- Assessment questions are stored separately from UI components.
- Scoring logic is separated from presentation logic.
- Report generation logic is testable separately.
- Design tokens are centralized.
- Components are named clearly.
- The app can be run by following README.

Fail criteria:

- Questions are scattered across UI files.
- Scoring constants are duplicated.
- A simple text change requires editing many files.
- No setup instructions exist.

### 12.2 Data Criteria

The question JSON must support:

- id
- category
- question
- target
- choices
- riskIfLow
- recommendation
- evidenceRefs, optional
- issueTemplate, optional
- aiSelfCheck, optional

---

## 13. Accessibility Criteria

Pass criteria:

- Text contrast is sufficient for ordinary business use.
- Buttons and options are keyboard accessible where feasible.
- Focus states are visible.
- Risk is not communicated by color alone.
- Click targets are not too small.
- Tables remain readable on common laptop resolutions.

Fail criteria:

- Text is low contrast.
- Critical status is color-only.
- Controls are hard to use on a laptop trackpad.
- Layout breaks severely on narrower screens.

---

## 14. Performance Criteria

For v0.1:

| Item | Target |
|---|---|
| Initial load | Within 3 seconds on a normal broadband connection |
| Question navigation | Immediate or near-immediate |
| 50-question assessment | No noticeable lag |
| Markdown generation | Within 1 second for normal data |

Fail criteria:

- The app feels slow for 50 questions.
- Report generation freezes the UI.
- Heavy libraries are added without clear need.

---

## 15. Testing Criteria

### 15.1 Required Tests or Checks

At minimum, delivery must include evidence for:

- App starts locally
- Sample assessment loads
- User can answer all questions
- Category score is correct
- Total score is correct
- Boundary scores map to correct maturity levels
- Results screen displays High risks
- Markdown report is generated
- AI self-check prompt appears
- Reset works
- README setup works from clean checkout

### 15.2 Suggested Test Cases

| Test ID | Scenario | Expected Result |
|---|---|---|
| TC-001 | Open app | Top screen is displayed |
| TC-002 | Start assessment | First category/questions are displayed |
| TC-003 | Answer all 0 | Total maturity is Lv.0 |
| TC-004 | Answer all 3 | Total maturity is Lv.3 |
| TC-005 | Mixed answers | Category scores match manual calculation |
| TC-006 | Low security score | Security risk appears as high priority |
| TC-007 | Generate report | Markdown includes score, risks, issues, AI prompt |
| TC-008 | Reset | Answers and result are cleared |
| TC-009 | Modify JSON | UI reflects changed question text |
| TC-010 | Unsafe text input | Rendered output is escaped or safely handled |

---

## 16. Documentation Criteria

Required documentation:

- README.md
- agent.md
- sqec.md
- docs/requirements.md
- docs/design_requirements.md
- docs/questions_schema.md
- docs/report_schema.md
- docs/research_plan.md
- docs/evidence_matrix_template.csv

README must include:

- Product purpose
- What v0.1 does
- What v0.1 does not do
- Setup steps
- Development commands
- Data structure overview
- Security/privacy notes
- External contractor handover notes

Fail criteria:

- A developer cannot run the app from README.
- Limitations are not stated.
- Evidence/research status is not stated.

---

## 17. External Contractor Acceptance Checklist

A delivery is accepted only if all Must items pass.

### 17.1 Must

- [ ] Source code delivered
- [ ] App runs locally
- [ ] README setup works
- [ ] 50-question sample assessment exists
- [ ] Questions are JSON-managed
- [ ] Scoring works
- [ ] Maturity level works
- [ ] Risk summary works
- [ ] Improvement issue output works
- [ ] AI self-check prompt output works
- [ ] Markdown report output works
- [ ] Design is B2B/QA-oriented
- [ ] No required backend/auth/DB/AI API for v0.1
- [ ] Known limitations documented
- [ ] Manual test evidence provided

### 17.2 Should

- [ ] Sample report included
- [ ] Screenshots included
- [ ] Design tokens documented
- [ ] Category scores are visually comparable
- [ ] Report can be copied cleanly
- [ ] Basic accessibility considered

### 17.3 Could

- [ ] Local save
- [ ] CSV export
- [ ] Print-friendly view
- [ ] Radar chart or bar chart
- [ ] Diagnosis history

---

## 18. Definition of Done for v0.1

AIDD-QMA v0.1 is done only when:

1. The app can be run locally from a clean checkout.
2. A user can complete a sample assessment.
3. Results are calculated reproducibly.
4. The report includes score, maturity, risk, improvement issues, and AI self-check prompt.
5. The UI looks appropriate for B2B QA/quality maturity assessment.
6. The data model is maintainable.
7. Security/privacy limitations are documented.
8. Tests or manual verification evidence are provided.
9. The delivery follows `agent.md`.
10. This `sqec.md` checklist has been reviewed.

---

## 19. Current Status

This SQEC file is an acceptance scaffold.

It defines how to judge the product and contractor output. It does not certify that the full 300-source research gate has been completed.
