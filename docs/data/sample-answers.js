/* sample-answers.js — デモ確認用の回答データ。
 * 小規模なAI駆動開発チームが Lv.1 → Lv.2 へ移行中という想定です。
 * リスク表示・改善Issue生成・レポート出力を確認しやすいよう、弱点を意図的に残しています。
 */

const SAMPLE_ANSWERS = {
  // Category 1: AI利用ガバナンス — 弱い
  'C1-Q1': 1, 'C1-Q2': 1, 'C1-Q3': 0, 'C1-Q4': 1, 'C1-Q5': 0,
  // Category 2: エージェント指示管理 — 中程度
  'C2-Q1': 2, 'C2-Q2': 1, 'C2-Q3': 1, 'C2-Q4': 2, 'C2-Q5': 1,
  // Category 3: 要件・コンテキスト品質 — 中程度
  'C3-Q1': 2, 'C3-Q2': 2, 'C3-Q3': 1, 'C3-Q4': 1, 'C3-Q5': 0,
  // Category 4: AI成果物レビュー — 弱い
  'C4-Q1': 1, 'C4-Q2': 0, 'C4-Q3': 1, 'C4-Q4': 1, 'C4-Q5': 0,
  // Category 5: テスト・自動化 — 中程度
  'C5-Q1': 2, 'C5-Q2': 2, 'C5-Q3': 1, 'C5-Q4': 1, 'C5-Q5': 0,
  // Category 6: CI/CD・品質ゲート — 比較的良い
  'C6-Q1': 2, 'C6-Q2': 2, 'C6-Q3': 2, 'C6-Q4': 2, 'C6-Q5': 1,
  // Category 7: セキュリティ・プライバシー — 中程度
  'C7-Q1': 2, 'C7-Q2': 2, 'C7-Q3': 1, 'C7-Q4': 1, 'C7-Q5': 1,
  // Category 8: トレーサビリティ — 弱〜中程度
  'C8-Q1': 1, 'C8-Q2': 2, 'C8-Q3': 0, 'C8-Q4': 1, 'C8-Q5': 0,
  // Category 9: エージェント自己監査 — 弱い
  'C9-Q1': 1, 'C9-Q2': 1, 'C9-Q3': 0, 'C9-Q4': 1, 'C9-Q5': 0,
  // Category 10: メトリクス・継続改善 — 弱い
  'C10-Q1': 1, 'C10-Q2': 0, 'C10-Q3': 1, 'C10-Q4': 0, 'C10-Q5': 0,
};

const SAMPLE_PROJECT_NAME = 'AI開発チーム サンプル';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_ANSWERS, SAMPLE_PROJECT_NAME };
}
