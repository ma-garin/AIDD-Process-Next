/* sample-answers.js — Pre-filled sample for demo/review (F-013, sqec.md §17.1)
 * Represents a small AI-driven team at Lv.1→Lv.2 transition (~40/100).
 * Demonstrates clear risk areas to make the tool's value immediately visible.
 */

const SAMPLE_ANSWERS = {
  // Category 1: AI Usage Governance — Weak (score ~1)
  'C1-Q1': 1, 'C1-Q2': 1, 'C1-Q3': 0, 'C1-Q4': 1, 'C1-Q5': 0,
  // Category 2: Agent Instruction Management — Moderate (score ~2)
  'C2-Q1': 2, 'C2-Q2': 1, 'C2-Q3': 1, 'C2-Q4': 2, 'C2-Q5': 1,
  // Category 3: Requirements & Context Quality — Moderate (score ~1.5)
  'C3-Q1': 2, 'C3-Q2': 2, 'C3-Q3': 1, 'C3-Q4': 1, 'C3-Q5': 0,
  // Category 4: AI Artifact Review — Weak (score ~1)
  'C4-Q1': 1, 'C4-Q2': 0, 'C4-Q3': 1, 'C4-Q4': 1, 'C4-Q5': 0,
  // Category 5: Testing & Automation — Moderate (score ~1.5)
  'C5-Q1': 2, 'C5-Q2': 2, 'C5-Q3': 1, 'C5-Q4': 1, 'C5-Q5': 0,
  // Category 6: CI/CD & Quality Gates — Good (score ~2)
  'C6-Q1': 2, 'C6-Q2': 2, 'C6-Q3': 2, 'C6-Q4': 2, 'C6-Q5': 1,
  // Category 7: Security & Privacy — Moderate (score ~1.5)
  'C7-Q1': 2, 'C7-Q2': 2, 'C7-Q3': 1, 'C7-Q4': 1, 'C7-Q5': 1,
  // Category 8: Traceability — Weak-Moderate (score ~1)
  'C8-Q1': 1, 'C8-Q2': 2, 'C8-Q3': 0, 'C8-Q4': 1, 'C8-Q5': 0,
  // Category 9: Agent Self-Audit — Weak (score ~0.5)
  'C9-Q1': 1, 'C9-Q2': 1, 'C9-Q3': 0, 'C9-Q4': 1, 'C9-Q5': 0,
  // Category 10: Metrics & Continuous Improvement — Weak (score ~0.5)
  'C10-Q1': 1, 'C10-Q2': 0, 'C10-Q3': 1, 'C10-Q4': 0, 'C10-Q5': 0,
};

const SAMPLE_PROJECT_NAME = 'Sample AI Development Team';
