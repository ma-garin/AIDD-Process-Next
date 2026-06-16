# Changelog

本ファイルは AIDD Process Next の主要な変更を記録します。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従います。

- MAJOR: 後方互換のない変更（設問IDやスコアリング仕様の破壊的変更など）
- MINOR: 後方互換のある機能追加
- PATCH: 後方互換のある不具合修正・軽微な調整

本プロジェクトは検証前ドラフト（v0.x）です。リサーチゲート完了までは、設問・配点・閾値が変動し得ます。

---

## [Unreleased]

### Added
- ガバナンス基盤として `LICENSE`（MIT）、`CONTRIBUTING.md`、`PRIVACY.md`、`CHANGELOG.md` を追加。
- リサーチゲートの運用基盤として `docs/research/evidence-matrix.csv`（根拠マトリクスのテンプレート）と `docs/research/README.md`（運用手順）を追加。
- 機械可読寄りの受け入れチェックリスト `docs/acceptance-checklist.md`（QG-1〜QG-10、TC-001〜TC-011 に対応）を追加。
- 必須成果物の存在を検査する `scripts/done-gate.sh`（Definition of Done ゲート）を追加。

### Changed
- UI/UX、スコアリングアルゴリズム、機能、ガバナンスの拡張を継続的に進行中（詳細は確定時に本セクションへ反映）。

---

## [0.1.0] - 2026-06-15

### Added
- AI駆動開発の品質成熟度を10領域・50問で評価する自己診断機能。
- 各設問0〜3点、対象外（N/A）を母数から除外するスコアリング。カテゴリスコアの加重平均から Lv.0〜Lv.3 を判定。
- 優先リスク抽出（スコア0〜1の項目を重大・高で分類）と改善Issue案の生成。
- 診断結果の Markdown レポート出力。
- 実装前・PR前・マージ前のAIエージェント自己点検プロンプト出力。
- 静的ブラウザアプリ構成（外部CDN・外部JS依存なし、レーダーチャートはインラインSVG）。
- 運用方針 `agent.md`、受入条件 `sqec.md`、利用者向け `README.md`。

### Notes
- 検証前ドラフト。`agent.md §5` のリサーチゲート（TPI関連150件＋AIDD関連150件＝300ソース）レビューは未完了。
- スコアは認証・監査基準ではなく、改善優先度の参考値。

[Unreleased]: https://github.com/ma-garin/AIDD-Process-Next/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ma-garin/AIDD-Process-Next/releases/tag/v0.1.0
