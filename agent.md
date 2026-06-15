# agent.md

# AIDD-QMA Agent Operating Manual

Version: 0.1 / Research-Gate Draft  
Status: Draft. This file defines how AI agents and outsourced developers must work on AIDD-QMA. It is not the final research-backed product specification until the required evidence review is complete.

---

## 1. Purpose

AIDD-QMA stands for **AI-Driven Development Quality Maturity Assessment**.

This project creates a maturity assessment model and web tool for AI-driven software development. The tool evaluates the quality, control, reproducibility, reviewability, security, and improvement capability of a development system where humans and AI agents both participate in software delivery.

The goal is not to clone TPI NEXT, Agile TPI, QA4AIDD, NIST AI RMF, OWASP, ISTQB CT-AI, DORA, or any existing framework. These sources are used as research inputs. AIDD-QMA must become an original model focused on the quality engineering of AI-driven development.

---

## 2. Non-Negotiable Principles

1. Do not claim that research is complete unless the evidence matrix proves it.
2. Do not claim that 150 TPI-related sources or 150 AIDD-related sources have been reviewed unless those sources are listed, categorized, and summarized.
3. Do not reuse proprietary TPI NEXT, Agile TPI, QA4AIDD, or certification-material content as if it were original work.
4. Do not use the term `TPI` in the external product name.
5. Treat `TPI`, `TPI NEXT`, and `Agile TPI` as reference concepts only.
6. Treat `QA4AIDD` as a benchmark and adjacent service, not as a template to copy.
7. The product target is both **humans** and **AI agents**.
8. Every generated requirement must connect to evidence, user value, or quality risk.
9. Every diagnosis must lead to an action: risk, improvement issue, roadmap item, or AI self-check instruction.
10. The initial product must remain small enough to outsource and accept objectively.

---

## 3. Product Positioning

AIDD-QMA is a quality maturity assessment and improvement-backlog generation tool for AI-driven development.

It evaluates:

- Human process maturity
- AI agent operating discipline
- Prompt and instruction management
- Requirements and specification traceability
- AI-generated artifact review
- Test design and automation readiness
- CI/CD and quality gate maturity
- Security and privacy control
- Repository and workflow evidence
- Metrics and continuous improvement

The strongest differentiator is this:

> AIDD-QMA is not only a human assessment tool. It is also a self-audit protocol that AI development agents can read before implementation, before PR creation, before merge, and before release.

---

## 4. Primary Users

### 4.1 Human Users

Priority order:

1. QA leads, test automation engineers, and AI tech leads
2. Small AI-driven development teams using Claude Code, Codex, Cursor, GitHub Copilot, or similar agents
3. Engineering managers, product managers, and scrum masters
4. Third-party verification companies and QA consultants
5. Development organizations introducing AI-assisted software development

### 4.2 AI Users

Target AI users:

- Claude Code
- Codex
- GitHub Copilot Agent
- Cursor Agent
- Other coding agents or AI development orchestration agents

AI users must use AIDD-QMA as:

- A pre-work checklist
- A PR self-review protocol
- A risk extraction framework
- A regression-risk reminder
- A completion-claim guardrail
- A prompt for generating improvement issues

---

## 5. Research Gate

Before RFD v1.0, requirements v1.0, or scoring model v1.0 is finalized, the following research gate must be completed.

### 5.1 Required Source Volume

| Research Area | Minimum Count | Requirement |
|---|---:|---|
| TPI / test process improvement / maturity models | 150 | Must include official, academic, practitioner, case-study, and tool-related sources |
| AIDD / AI-assisted development / AI coding agents / AI quality / AI risk | 150 | Must include official, academic, survey, security, QA, and engineering-practice sources |
| Total | 300 | Must be recorded in an evidence matrix |

### 5.2 Required Anchor Sources

At minimum, the evidence matrix must include these anchor source families:

- TMAP / Sogeti TPI NEXT official material
- TMAP / Sogeti Agile TPI official material
- TPI NEXT Foundation or equivalent preparation material
- Public case studies applying TPI, Agile TPI, TMMi, or adjacent maturity models
- VeriServe QA4AIDD official service pages and press releases
- NIST AI Risk Management Framework and AI RMF Core
- OWASP Top 10 for LLM Applications
- Google DORA AI-assisted software development report
- Stack Overflow Developer Survey AI trust and adoption data
- ISTQB CT-AI syllabus and official CT-AI material
- Research papers on AI coding agents, AI-assisted software development, LLM security, and AI governance

### 5.3 Evidence Matrix Columns

The evidence matrix must contain at least the following fields:

| Field | Description |
|---|---|
| id | Unique source ID |
| title | Source title |
| url_or_location | URL or local path |
| source_type | official / academic / survey / case study / blog / news / vendor / standard |
| area | TPI / AIDD / AI risk / QA / security / process / design / market |
| publication_date | Published or last updated date if available |
| author_or_org | Author or organization |
| reliability | high / medium / low |
| core_claim | Main claim relevant to AIDD-QMA |
| extracted_concepts | Concepts to reuse or consider |
| implication_for_aidd_qma | How this changes the model or product |
| adopt_decision | adopt / adapt / reject / monitor |
| reason | Why the source is or is not used |
| copyright_risk | none / low / medium / high |
| notes | Additional notes |

### 5.4 Research Quality Rules

- Official sources and standards must be preferred when defining terminology.
- Academic and survey sources must be used when discussing market need, empirical risk, or adoption behavior.
- Vendor materials may be used as market evidence but not as neutral truth.
- Blog posts may be used only as weak supporting evidence or practitioner pain-point evidence.
- Any source that cannot be verified must be marked `unverified`.
- Any inference must be labeled as `inference`, not as fact.

---

## 6. Work Phases

### Phase 0: Repository Setup

Deliverables:

- README.md
- agent.md
- sqec.md
- docs/research_plan.md
- docs/evidence_matrix_template.csv
- docs/architecture_decision_record.md

Exit criteria:

- The project can explain what it is, what it is not, and how evidence will be gathered.

### Phase 1: Research Collection

Tasks:

- Collect at least 150 TPI-related sources.
- Collect at least 150 AIDD-related sources.
- Fill the evidence matrix.
- Tag sources by concept and product implication.

Exit criteria:

- No final model design is allowed before this phase passes.

### Phase 2: Research Brief

Deliverables:

- docs/research_brief.md
- docs/tpi_research_summary.md
- docs/aidd_research_summary.md
- docs/qa4aidd_benchmark.md
- docs/risk_and_opportunity_map.md

Exit criteria:

- The product concept is traceable to evidence.

### Phase 3: Concept Model

Define:

- Diagnostic dimensions
- Maturity levels
- Checkpoint structure
- Scoring method
- Human-facing questions
- AI-facing self-audit prompts
- Improvement issue generation rules

Exit criteria:

- The model is original and not a renamed TPI clone.

### Phase 4: RFD v1.0

Deliverables:

- docs/rfd.md

Must include:

- Decision context
- Alternatives considered
- Evidence summary
- Product positioning
- Target users
- Non-goals
- Risks
- Adoption strategy
- Outsourcing strategy

### Phase 5: Requirements v1.0

Deliverables:

- docs/requirements.md
- docs/design_requirements.md
- docs/questions_schema.md
- docs/report_schema.md

Exit criteria:

- Outsourced developers can estimate implementation work.

### Phase 6: Design and Prototype

Deliverables:

- UI wireframes
- Component inventory
- Design tokens
- Sample report
- Sample assessment JSON

Exit criteria:

- The UI reflects B2B quality assessment, not consumer AI SaaS styling.

### Phase 7: Implementation

Initial technical direction:

- Web app
- Static hosting compatible
- JSON-driven assessment
- No required backend for v0.1
- No required AI API for v0.1
- Markdown report output
- Local/browser storage optional

### Phase 8: Acceptance and Hardening

Use `sqec.md` as the acceptance standard.

No feature is accepted unless it satisfies:

- Functional acceptance
- Evidence acceptance
- Design acceptance
- Security/privacy acceptance
- Maintainability acceptance
- AI-agent usability acceptance

---

## 7. AIDD-QMA Concept Rules

The model must evaluate both human and AI behavior.

### 7.1 Human-Side Assessment Examples

- Is there an explicit AI usage policy?
- Are AI-generated artifacts reviewed using defined criteria?
- Is responsibility for AI-assisted changes assigned to a human owner?
- Are requirements, issues, PRs, tests, and releases traceable?
- Are quality gates enforced before merge?

### 7.2 AI-Side Assessment Examples

- Did the AI identify the affected files, modules, tests, and risks?
- Did the AI distinguish confirmed facts from assumptions?
- Did the AI avoid claiming successful execution without evidence?
- Did the AI propose tests for the changed behavior?
- Did the AI flag human-review-required areas?

### 7.3 Repository-Side Assessment Examples

- Is there a CI pipeline?
- Are tests present and executable?
- Are linting and formatting checks defined?
- Is secret detection or dependency scanning present?
- Are PR templates and issue templates present?
- Are agent instructions stored in `AGENTS.md`, `CLAUDE.md`, or equivalent files?

---

## 8. Initial Diagnostic Areas

These are draft areas. They must be revised after the research gate.

| No | Area | Purpose |
|---:|---|---|
| 1 | AI Usage Governance | Define where AI may be used and who is accountable |
| 2 | Agent Instruction Management | Manage prompts, rules, and repo-specific operating instructions |
| 3 | Requirements and Context Quality | Ensure AI works from stable, explicit context |
| 4 | AI Artifact Review | Review AI-generated code, tests, specs, and documents |
| 5 | Testing and Automation | Protect AI-driven changes with tests and regression checks |
| 6 | CI/CD and Quality Gates | Enforce automated checks before merge and release |
| 7 | Security and Privacy | Control secrets, data exposure, dependencies, and LLM risks |
| 8 | Traceability | Connect requirements, issues, commits, PRs, tests, and releases |
| 9 | Agent Self-Audit | Require AI to self-check before claiming completion |
| 10 | Metrics and Continuous Improvement | Measure quality, productivity, rework, and risk trends |

---

## 9. Maturity Level Draft

This is a provisional structure.

| Level | Name | Meaning |
|---:|---|---|
| Lv.0 | Uncontrolled | AI use is ad hoc, undocumented, and weakly reviewed |
| Lv.1 | Managed | Basic rules, human review, and manual checks exist |
| Lv.2 | Systemized | Repeatable processes, templates, and quality gates exist |
| Lv.3 | Optimized | Metrics, self-audit, continuous improvement, and risk-based automation exist |

The final maturity levels must be justified by the research brief.

---

## 10. Output Requirements for AI Agents

When an AI agent works on this project, it must output:

1. What it changed
2. Why it changed it
3. What evidence supports the decision
4. What remains unverified
5. What risks remain
6. What tests or reviews were performed
7. What human decision is required, if any

The agent must not output:

- “Done” without evidence
- “Tested” without command/result or explicit limitation
- “Best practice” without source or reasoning
- “TPI-compliant” unless formally verified
- “QA4AIDD-compatible” unless benchmarked and legally safe

---

## 11. AI Agent Self-Check Before Completion

Before declaring work complete, answer the following:

1. Did I use the latest project instructions?
2. Did I distinguish evidence from inference?
3. Did I avoid copying proprietary framework wording or structure?
4. Did I update the relevant docs?
5. Did I update or add tests if code changed?
6. Did I run available tests or clearly state why not?
7. Did I preserve the B2B quality-assessment design direction?
8. Did I keep the product useful for both humans and AI agents?
9. Did I avoid adding unnecessary backend, auth, DB, or AI API complexity to v0.1?
10. Did I produce outputs that an outsourced developer or QA reviewer can verify?

Completion format:

```markdown
## Completion Report

### Changed
- ...

### Evidence
- ...

### Verified
- ...

### Not Verified
- ...

### Risks
- ...

### Human Review Needed
- ...
```

---

## 12. External Contractor Rules

Outsourced developers must receive and follow:

- README.md
- agent.md
- sqec.md
- docs/requirements.md
- docs/design_requirements.md
- docs/questions_schema.md
- docs/report_schema.md

Contractors must not:

- Invent the assessment model without evidence
- Hard-code questions into UI components
- Add backend, auth, DB, or AI API unless explicitly requested
- Replace the design direction with generic SaaS or flashy AI UI
- Use copyrighted TPI or QA4AIDD text as product content
- Treat demo output as accepted production behavior

Contractors must deliver:

- Source code
- Setup instructions
- Sample assessment JSON
- Sample report
- Screenshots
- Manual test evidence
- Known limitations
- Handover notes

---

## 13. Initial Anchor References

These references must be included in the research matrix, but they are not enough to complete the research gate.

- TMAP / Sogeti: TPI NEXT official material
- TMAP / Sogeti: Agile Test Process Improvement official material
- VeriServe: QA4AIDD official service and press release material
- NIST: AI Risk Management Framework and AI RMF Core
- OWASP: Top 10 for Large Language Model Applications
- Google DORA: State of AI-assisted Software Development 2025
- Stack Overflow: 2025 Developer Survey, AI tools trust and adoption data
- ISTQB: Certified Tester AI Testing CT-AI official syllabus/material

---

## 14. Current Status

This file is a project operating manual and research-gate scaffold.

It does not certify that the required 300-source research review has been completed.
