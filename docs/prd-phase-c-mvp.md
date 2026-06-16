# PRD: フェーズC MVP

> フェーズC（コンサルタント向け手動運用）を実現するための最小実装
> ADR-0001〜0004 参照

---

## Problem Statement

コンサルタントがAIDD Process Nextをクライアントとの診断セッションで活用しようとしたとき、以下の3つの問題にぶつかる。

1. **データ受け渡し手段がない**: クライアントが事前に50問を回答した結果を、コンサルタントに渡す方法がない。Markdownレポートのコピーは情報が断片化し、コンサルタントが同じ画面状態を再現できない。

2. **CTO/CFOに見せられる出力物がない**: 現在のMarkdownレポートはエンジニア向けで、稟議・投資判断に使える「1枚ペーパー」がない。コンサルタントが診断結果をクライアントの意思決定者に提示できない。

3. **「どこから手をつけるか」が不明**: 改善Issueが最大8件並列表示されるが、優先順位の根拠がなく、コンサルタントがセッションで「まずここから」と言える根拠がない。

加えて、診断モデルが「検証前ドラフト」であることを適切に伝える免責事項と想定ユースケースの説明が不足しており、コンサルタントがクライアントに説明する際の信頼基盤が薄い。

---

## Solution

以下の4つの機能を静的HTML/JSのまま（バックエンドなし）実装し、コンサルタントがクライアントと診断セッションを実施できる最小限のツールを提供する。

1. **URLエクスポート**: 診断回答状態をBase64エンコードしてURLに乗せ、コンサルタントへの共有を可能にする
2. **エグゼクティブサマリーPDF**: `window.print()` 対応の印刷最適化レイアウトで、総合スコア・上位5リスク・推奨アクション3点を1ページに出力する
3. **最優先カテゴリバッジ**: 最低スコアのカテゴリに「最優先」バッジを付け、コンサルタントが「まずここから」と言える出発点を提供する
4. **免責事項・ユースケース強化**: ウェルカム画面とレポートに「改善のたたき台として使う」ユースケース定義と免責事項を明記する

---

## User Stories

1. As a コンサルタント, I want to share a URL with my client so that they can answer 50 questions asynchronously before our session.
2. As a コンサルタント, I want to open the shared URL in my browser so that I can see exactly the same diagnosis state as my client.
3. As a クライアント, I want to copy a share URL after completing the assessment so that I can send it to my consultant without technical difficulty.
4. As a コンサルタント, I want a print-ready 1-page summary so that I can hand it to the CTO/CFO as a starting point for a budget discussion.
5. As a CTO, I want to see the total score, top 5 risks, and 3 recommended actions on a single page so that I can understand the current situation without reading a long report.
6. As a コンサルタント, I want the 1-pager to include the project name and date so that it is traceable when circulated in approval workflows.
7. As a コンサルタント, I want to see which category has the lowest score highlighted as "最優先" so that I can immediately open the session with a clear priority.
8. As a クライアント, I want to see the "最優先" badge in the results view so that I know where to focus improvement effort first.
9. As a コンサルタント, I want the disclaimer to clearly state this is a starting point for improvement, not an audit standard, so that I can set correct expectations with my client.
10. As a クライアント, I want to see the intended use case on the welcome screen so that I understand what the diagnostic output is and is not before I start.
11. As a コンサルタント, I want the report screen to show the disclaimer alongside the Markdown report so that it is visible when I share the report with stakeholders.
12. As a エンドユーザー, I want the share URL to restore my exact answer state when opened so that no answers are lost in the handoff.
13. As a コンサルタント, I want the executive summary print layout to hide the sidebar and navigation so that the printed page is clean and professional.
14. As a コンサルタント, I want a "URLをコピー" button on the results/report screen so that sharing is a single click.
15. As a クライアント, I want to be notified if the URL contains a pre-loaded state when I open the app so that I know I am viewing shared answers.

---

## Implementation Decisions

### Module 1: stateSerializer.js（新規、純粋関数モジュール）

回答状態のURL変換を担うモジュール。DOM・AppStateへの依存を持たない。

- `encodeStateToURL(answers, projectName): string` — `{answers, projectName}` をJSON化 → UTF-8 → Base64 → URLクエリパラメータ `?state=` として返す
- `decodeStateFromURL(): {answers: object, projectName: string} | null` — `window.location.search` から `state` パラメータを読み、デコードして返す。パース失敗時は `null`
- URLの最大長制限（約2000文字）に対して50問分のエンコード長を事前検証し、問題なければ実装する

### Module 2: エグゼクティブサマリー（index.html + style.css）

- 既存の `screen-results` 内に `<div class="exec-summary-print">` を追加し、通常時は非表示、`@media print` 時のみ表示する
- `@media print` ではサイドバー・ナビ・レーダーチャート・タブ等を `display: none` にし、エグゼクティブサマリーのみ印刷される
- エグゼクティブサマリーの内容:
  - プロジェクト名・診断日・総合スコア・成熟度レベル
  - 上位5リスク（severity + カテゴリ名 + 推奨アクション）
  - 推奨アクション3点（上位IssueのP1/P2から抽出）
  - 免責事項フッター

### Module 3: getTopPriorityCategory()（scoring.js への追加）

```js
// 入力: buildCategoryScores() の出力と同じ配列
// 出力: スコアが最低の非nullカテゴリ（同点は categoryId 昇順）
function getTopPriorityCategory(categoryScores) {
  const valid = categoryScores.filter(s => s.score !== null);
  if (valid.length === 0) return null;
  return valid.reduce((min, s) => s.score < min.score ? s : min);
}
```

- `buildResults()` の戻り値に `topPriorityCategory` フィールドを追加
- `renderCategoryGrid()` と `renderResults()` で「最優先」バッジを表示

### Module 4: URLインポートロジック（app.js）

- `DOMContentLoaded` 時に `decodeStateFromURL()` を実行
- 有効なstateが存在すれば `setState({ answers, projectName, screen: 'assessment' })` で直接アセスメント画面に遷移
- URLパラメータの `answers` オブジェクトはスキーマ検証を行う（各値が 0〜3 または null であることを確認）
- ウェルカム画面に「共有URLから回答を読み込みました」のバナーを表示する

### Module 5: 免責事項テキスト（index.html）

- ウェルカム画面の既存 `.info-card` ブロックに「想定ユースケース」説明を追加
- レポート画面のMarkdownレポート末尾（`generateMarkdownReport()` 内）に既存の免責一文があるが、HTML側にも同等の免責UIを追加

---

## Testing Decisions

**良いテストの定義**: 外部から観察可能な振る舞いをテストする。内部実装（Base64の使い方）ではなく、「エンコード → デコード → 元のオブジェクトと一致する」往復性をテストする。

**テスト対象モジュール:**

| モジュール | テスト種別 | 理由 |
|-----------|-----------|------|
| `stateSerializer.js` | Unit | 純粋関数でありDOM不要。往復テスト・エッジケース（空回答・特殊文字・不正Base64）が機械的に書ける |
| `getTopPriorityCategory()` | Unit | 純粋関数。同点・全null・単一カテゴリ等のエッジケースが明確 |
| URLインポートフロー | Integration | 不正なURLパラメータが渡された場合にウェルカム画面にフォールバックすることを確認 |

**テストしないもの:**
- `renderResults()` 等のDOMレンダリング関数（実装詳細であり、HTMLの構造変更で壊れやすい）
- `window.print()` の呼び出し（ブラウザ依存、モックが意味を持たない）

---

## Out of Scope

- バックエンド・認証・決済（フェーズA以降）
- ホワイトラベル機能（フェーズA以降、有料機能）
- 複数回答者・組織集計機能（エンタープライズ機能）
- 監査証跡・コンプライアンスレポート（エンタープライズ機能）
- ベンチマーク比較（実データ収集後）
- クイックモード（10問）
- リポジトリエビデンス自動収集（GitHub OAuth連携が必要）
- リスクの金銭換算モデル

---

## Further Notes

- URLのエンコード長について: 50問 × 最大1バイト（スコア0〜3）+ projectNameで概算200〜300バイト。Base64変換後は約400文字で2000文字制限に収まる。
- `@media print` の実装では、ブラウザの「背景のグラフィックを印刷する」設定に依存する色表示については、代替のモノクロ印刷でも可読性を確保する。
- フェーズC→フェーズAの移行トリガー（コンサルタント5社継続利用 + 手動管理限界）はADR-0001〜0004に記録済み。
- 方法論の権威性については、v0.1の免責事項を強化することで対応し、「検証前ドラフト」表記はフィールド検証300件完了まで継続する。
