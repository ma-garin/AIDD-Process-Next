# docs/research — リサーチゲート運用基盤

本ディレクトリは AIDD Process Next の**リサーチゲート**（`agent.md §5`）を運用するための基盤です。設問・配点・閾値を確定する前に、根拠を体系的に収集・評価・紐付けするためのテンプレートと手順を提供します。

> 重要: 実際の300ソースのレビューは**未完了**です。本ディレクトリは運用基盤（骨子）であり、`evidence-matrix.csv` は現時点ではテンプレートとプレースホルダ行を含みます。レビュー完了までは、本ツールのスコア・設問を認証・監査基準として扱わないでください。

---

## 1. 目的

リサーチゲートでは、以下の根拠レビューを完了することを目標とします。

- TPI / Test Process Improvement 関連の一次情報・公式資料・論文・信頼できる解説を150件以上
- AIDD / AI-assisted development / Agentic coding 関連の一次情報・公式資料・論文・信頼できる解説を150件以上
- 合計300ソース規模

レビュー結果を `evidence-matrix.csv`（根拠マトリクス）へ集約し、各設問・各成熟度レベルを根拠ソースIDへ紐付けます。

---

## 2. evidence-matrix.csv の列

| 列 | 意味 |
|---|---|
| source_id | 根拠ソースの安定ID（例: S-0001）。設問からの参照キー。 |
| title | ソースのタイトル |
| type | 種別（standard / paper / article / book / spec など） |
| year | 発行年 |
| authors | 著者・発行体 |
| source_category | TPI / AIDD / QA / standard / other |
| credibility | high / med / low（信頼度） |
| claim | そのソースが支持する主張・知見 |
| maps_to | 紐付け先（question_id または成熟度レベル） |
| disposition | adopt / adapt / reject / monitor |
| rationale | 採否・翻案の理由 |
| copyright_risk | 専有文言流用リスク（low / medium / high） |
| url | 参照URL |
| reviewed_by | レビュー担当 |

---

## 3. disposition の意味

- adopt: 知見をそのまま採用（独自表現で取り込む）。
- adapt: 概念を参照しつつ独自の言葉へ翻案して採用。専有文言は引き写さない。
- reject: 採用しない（信頼度不足、専有文言流用リスク、無関連など）。
- monitor: 現時点では保留。今後の確認・追加調査の対象。

`copyright_risk` が medium / high のソースは、文章流用を避け、`adapt` か `reject` を選びます（`CONTRIBUTING.md` の非交渉原則を参照）。

---

## 4. 設問・成熟度レベルと根拠の紐付け方法

1. 根拠を `evidence-matrix.csv` に1ソース1行で登録し、`source_id` を採番します。
2. 設問または成熟度レベルへ紐付ける場合、`maps_to` 列に対象の question_id（例: `gov-01`）または成熟度レベル（例: `Lv.2`）を記録します。
3. 1つの設問は複数ソースを根拠に持てます（複数行で同一 question_id を指す）。
4. 設問を改訂する際は、PR 本文に「設問ID → 根拠ソースID」の対応表を記載します（`CONTRIBUTING.md §3.3`）。
5. 根拠なしの設問変更はマージしません。

---

## 5. 現在の状態

- [ ] TPI 関連150件のレビュー
- [ ] AIDD 関連150件のレビュー
- [ ] 根拠マトリクスの本格整備（現状はテンプレート＋プレースホルダ）
- [ ] 設問・重み・閾値の妥当性見直し

完了までは、画面・README・レポートに「検証前ドラフト」と明記します。
