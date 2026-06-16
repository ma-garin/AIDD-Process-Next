/* questions.js — AIDD Process Next diagnostic questions (10 categories × 5 = 50 questions)
 * BARS: 0=未整備, 1=属人的, 2=定義済み, 3=運用定着。
 * 本モデルは300件規模の根拠レビュー完了前の検証前ドラフトです。
 */

const CATEGORIES_DEFAULT = [
  {
    "id": 1,
    "key": "governance",
    "name": "AI利用ガバナンス",
    "abbr": "ガバナンス",
    "weight": 0.1
  },
  {
    "id": 2,
    "key": "instructions",
    "name": "エージェント指示管理",
    "abbr": "指示管理",
    "weight": 0.1
  },
  {
    "id": 3,
    "key": "requirements",
    "name": "要件・コンテキスト品質",
    "abbr": "要件品質",
    "weight": 0.1
  },
  {
    "id": 4,
    "key": "review",
    "name": "AI成果物レビュー",
    "abbr": "AIレビュー",
    "weight": 0.1
  },
  {
    "id": 5,
    "key": "testing",
    "name": "テスト・自動化",
    "abbr": "テスト",
    "weight": 0.1
  },
  {
    "id": 6,
    "key": "cicd",
    "name": "CI/CD・品質ゲート",
    "abbr": "品質ゲート",
    "weight": 0.1
  },
  {
    "id": 7,
    "key": "security",
    "name": "セキュリティ・プライバシー",
    "abbr": "セキュリティ",
    "weight": 0.1
  },
  {
    "id": 8,
    "key": "traceability",
    "name": "トレーサビリティ",
    "abbr": "追跡性",
    "weight": 0.1
  },
  {
    "id": 9,
    "key": "selfaudit",
    "name": "エージェント自己監査",
    "abbr": "自己監査",
    "weight": 0.1
  },
  {
    "id": 10,
    "key": "metrics",
    "name": "メトリクス・継続改善",
    "abbr": "継続改善",
    "weight": 0.1
  }
];

const QUESTIONS_DEFAULT = [
  {
    "id": "C1-Q1",
    "categoryId": 1,
    "target": "human",
    "question": "開発でAIツールを使ってよい範囲・禁止範囲・レビュー条件を、チームとして文書化していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "方針がなく、各自判断でAIを利用している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "口頭の慣習はあるが、新規参画者が読める形ではない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "利用可能ツール、禁止用途、レビュー条件を文書化して共有している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "方針を定期見直しし、新しいAI機能・契約条件・事故情報を反映している。"
      }
    ],
    "riskIfLow": "AI利用が統制されず、品質差・情報漏えい・責任不明確化が発生しやすくなります。",
    "recommendation": "AI利用方針を作成し、利用可能ツール、禁止用途、人間レビュー、責任者を明記してください。",
    "issueTemplate": "AI利用方針を作成する：利用可能ツール、禁止用途、レビュー条件、責任者を定義する。",
    "aiSelfCheck": "作業開始前に、このプロジェクトのAI利用方針が存在するか確認する。存在しない場合はガバナンスリスクとして報告する。"
  },
  {
    "id": "C1-Q2",
    "categoryId": 1,
    "target": "human",
    "question": "AI支援で作成・変更した成果物について、マージまたはリリース前に責任を持つ人間の承認者が明確ですか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "承認者が明確でなく、AI出力がそのまま取り込まれることがある。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "作成者が暗黙的に責任を持つが、記録には残らない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "PRまたはレビュー記録で、人間の承認者を明示している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "承認者・レビュー観点・事故時の振り返りまで紐づけて管理している。"
      }
    ],
    "riskIfLow": "AI起因の欠陥が発生した際に、対応責任と学習責任が曖昧になります。",
    "recommendation": "PRテンプレートに「AI支援有無」「人間レビュー担当」「確認観点」を追加してください。",
    "issueTemplate": "PRテンプレートへAI支援変更の人間承認欄を追加する。",
    "aiSelfCheck": "人間レビュー担当が未設定の場合、完了扱いにせず「人間レビュー要：担当未設定」と明記する。"
  },
  {
    "id": "C1-Q3",
    "categoryId": 1,
    "target": "human",
    "question": "利用を許可するAIツールと、利用禁止・注意が必要なユースケースを一覧化していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "一覧がなく、任意のAIツールを任意用途で使える。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "個人の好みで使い分けており、チーム共通の棚卸しがない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "許可ツール一覧と利用可能な文脈を管理している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "新規ツール導入時に、セキュリティ・品質・契約観点で評価してから許可している。"
      }
    ],
    "riskIfLow": "未評価のAIツールにより、機密情報流出、ライセンス問題、品質ばらつきが起きます。",
    "recommendation": "許可AIツール台帳を作り、用途・入力禁止情報・評価日・責任者を管理してください。",
    "issueTemplate": "許可AIツール台帳を作成し、用途・制約・評価基準を記載する。",
    "aiSelfCheck": "使用予定のAIツールが許可台帳に載っているか確認する。未登録なら利用前に人間へ確認する。"
  },
  {
    "id": "C1-Q4",
    "categoryId": 1,
    "target": "human",
    "question": "AI生成物をレビューするとき、「見た目は正しそう」以上の確認基準が定義されていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "確認基準がなく、レビュー担当者の勘に依存している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "人により確認観点が異なり、チェックリストがない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "仕様適合、前提、セキュリティ、テスト、影響範囲を確認する基準がある。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "過去欠陥・インシデントからレビュー観点を更新し、実効性を測定している。"
      }
    ],
    "riskIfLow": "もっともらしい誤り、スコープ逸脱、セキュリティ不備が見落とされます。",
    "recommendation": "AI成果物レビュー観点表を作成し、仕様根拠・実行証跡・未確認事項を必須化してください。",
    "issueTemplate": "AI成果物レビュー観点表を作成する：仕様適合、前提、影響範囲、セキュリティ、テストを含める。",
    "aiSelfCheck": "提出時に、確認済み・推定・未確認を分けて記載する。推定を事実として扱わない。"
  },
  {
    "id": "C1-Q5",
    "categoryId": 1,
    "target": "human",
    "question": "AI支援変更が障害・品質事故を起こした場合の対応プロセスがありますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "AI関連事故としての扱いがなく、通常バグとして処理している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "AI関与はメモするが、原因分析や再発防止には使っていない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "AIツール、指示、レビュー、テストのどこで失敗したかを分析する流れがある。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "事故傾向を方針、プロンプト、レビュー観点、品質ゲートへ反映している。"
      }
    ],
    "riskIfLow": "同じAI起因の失敗が繰り返され、組織学習につながりません。",
    "recommendation": "インシデント報告にAI関与有無と失敗箇所分類を追加してください。",
    "issueTemplate": "AI関連インシデント対応フローを定義する：検知、封じ込め、原因分類、再発防止。",
    "aiSelfCheck": "自分の出力が不具合につながった場合、AI誤り・指示不足・レビュー漏れを分けて原因を記載する。"
  },
  {
    "id": "C2-Q1",
    "categoryId": 2,
    "target": "ai",
    "question": "AGENTS.md、CLAUDE.mdなど、AIエージェント向けの指示ファイルが最新状態で管理されていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "指示ファイルがなく、AIは一般論で作業している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "存在するが古い、または必要情報が不足している。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "環境、規約、禁止事項、現在の作業文脈を記載している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "スプリントや主要変更ごとに更新し、実際のAI挙動とのズレも確認している。"
      }
    ],
    "riskIfLow": "AIがプロジェクト固有の規約や制約を無視し、手戻りが増えます。",
    "recommendation": "エージェント指示ファイルに、技術構成、規約、禁止事項、対象ファイル、完了条件を明記してください。",
    "issueTemplate": "AGENTS.mdまたはCLAUDE.mdを整備し、環境・規約・禁止事項・現在状態を記載する。",
    "aiSelfCheck": "作業開始前に最新の指示ファイルを読み、矛盾や古さを見つけたら作業前に報告する。"
  },
  {
    "id": "C2-Q2",
    "categoryId": 2,
    "target": "ai",
    "question": "AIエージェントに渡す指示は、毎回の会話だけでなく、再利用可能な形で蓄積されていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "会話ごとにその場で指示しており、再利用できない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "よく使う文言はあるが、テンプレート化されていない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "作業種別ごとの指示テンプレートを管理している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "テンプレートの効果を振り返り、成功・失敗事例から改善している。"
      }
    ],
    "riskIfLow": "同じ説明を繰り返す必要があり、AIの理解品質が安定しません。",
    "recommendation": "実装前、PR前、レビュー前、リリース前のプロンプトテンプレートを整備してください。",
    "issueTemplate": "作業フェーズ別プロンプトテンプレートを作成する。",
    "aiSelfCheck": "今回の作業に対応する標準プロンプトがあるか確認し、なければ不足として報告する。"
  },
  {
    "id": "C2-Q3",
    "categoryId": 2,
    "target": "ai",
    "question": "AIエージェントが触ってよいファイル・触ってはいけないファイルを明示していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "制限がなく、AIが必要と判断したファイルを自由に変更する。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "口頭では伝えるが、永続的な記録がない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "対象ファイル、変更禁止ファイル、変更前確認が必要な領域を明記している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "pre-write hookやレビューゲートで、禁止領域の変更を検知・抑止している。"
      }
    ],
    "riskIfLow": "AIが善意で広範囲を変更し、レビュー不能・副作用・事故につながります。",
    "recommendation": "ファイルスコープ表を作成し、変更可否と承認要否を明記してください。",
    "issueTemplate": "変更可能ファイル・変更禁止ファイル・要承認領域を指示ファイルへ追加する。",
    "aiSelfCheck": "変更前に対象ファイルが許可範囲か確認する。範囲外なら作業を止めて確認する。"
  },
  {
    "id": "C2-Q4",
    "categoryId": 2,
    "target": "ai",
    "question": "AIエージェントへの指示に、完了条件と証跡提出条件が含まれていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "完了条件が曖昧で、AIが自己判断で完了宣言する。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "完了条件はあるが、証跡の出し方は決まっていない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "テスト結果、変更理由、未確認事項、影響範囲の提出を求めている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "完了報告の形式が固定され、レビュー時に機械的に確認できる。"
      }
    ],
    "riskIfLow": "「動いたはず」「確認済み」の中身が曖昧になり、品質保証に使えません。",
    "recommendation": "完了報告テンプレートを作成し、実行コマンド・結果・未確認事項を必須化してください。",
    "issueTemplate": "完了報告テンプレートを追加する：変更点、証跡、確認済み、未確認、リスク。",
    "aiSelfCheck": "完了時に、実行した確認と実行していない確認を分けて報告する。"
  },
  {
    "id": "C2-Q5",
    "categoryId": 2,
    "target": "ai",
    "question": "AIエージェントの指示ファイルに、過去の失敗・注意点・再発防止が反映されていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "過去の失敗が指示に反映されていない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "個人の記憶にはあるが、AIが読める形ではない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "失敗事例と禁止事項を指示ファイルへ追記している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "失敗傾向を定期的に棚卸しし、プロンプト・フック・レビュー基準へ展開している。"
      }
    ],
    "riskIfLow": "同じ作業ミスがAIセッションを跨いで再発します。",
    "recommendation": "lessons.mdやCURRENT_STATE.mdに、失敗・原因・予防策を残してください。",
    "issueTemplate": "AI作業の失敗事例をlessons.mdへ記録し、指示ファイルから参照する。",
    "aiSelfCheck": "過去の注意点に該当する作業か確認し、該当する場合は予防策を先に宣言する。"
  },
  {
    "id": "C3-Q1",
    "categoryId": 3,
    "target": "human",
    "question": "仕様・要件の正本となる文書があり、AIが実装前に参照できますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "仕様がなく、会話・チケット・記憶に依存している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "文書はあるが、実装と同期していない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "機能要件、制約、検証条件、対象外を文書化している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "仕様承認なしにAIが実装できない運用で、仕様逸脱も検知している。"
      }
    ],
    "riskIfLow": "AIが会話の断片や推測で実装し、意図と異なる成果物を作ります。",
    "recommendation": "spec.md相当の正本を作り、要件・制約・受入条件・対象外を明記してください。",
    "issueTemplate": "spec.mdを作成し、機能要件、制約、検証条件、対象外を整理する。",
    "aiSelfCheck": "実装前に仕様正本を確認する。ない場合は要件リスクとして報告する。"
  },
  {
    "id": "C3-Q2",
    "categoryId": 3,
    "target": "human",
    "question": "AIセッションを跨いで作業状態を引き継ぐCURRENT_STATE.md等を管理していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "引き継ぎ文書がなく、毎回口頭で説明している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "メモはあるが更新が不定期で信頼できない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "現在フェーズ、完了済み、次作業、保留事項、ブロッカーを更新している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "セッション終了時の更新がゲート化され、古い状態を検知できる。"
      }
    ],
    "riskIfLow": "文脈ロスにより、AIが重複作業・逆戻り・前提誤認を起こします。",
    "recommendation": "CURRENT_STATE.mdを整備し、セッション開始・終了時の更新ルールを決めてください。",
    "issueTemplate": "CURRENT_STATE.mdテンプレートを作成し、毎回更新する運用を定義する。",
    "aiSelfCheck": "開始時にCURRENT_STATE.mdを読み、終了時に更新してから完了宣言する。"
  },
  {
    "id": "C3-Q3",
    "categoryId": 3,
    "target": "ai",
    "question": "AIに禁止事項・対象外・やってはいけない判断を明示していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "禁止事項がなく、AIが良いと思った改善を自由に行う。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "会話中に伝えるが、永続文書にはない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "禁止アクション、対象外ファイル、追加依存禁止などを明記している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "重要な禁止事項はフックやCIで検知され、変更前に止められる。"
      }
    ],
    "riskIfLow": "AIが一般的なベストプラクティスを適用し、プロジェクト固有制約に反します。",
    "recommendation": "Forbidden Actions節を設け、依存追加、設計変更、不要なリファクタ等の禁止を明記してください。",
    "issueTemplate": "CLAUDE.mdまたはAGENTS.mdへForbidden Actionsを追加する。",
    "aiSelfCheck": "行動前に禁止事項を確認する。該当する場合は実行せず、人間へ判断を求める。"
  },
  {
    "id": "C3-Q4",
    "categoryId": 3,
    "target": "human",
    "question": "要件はAIが一度に扱える粒度のタスクへ分解されていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "大きな要求をAIに渡し、分解もAI任せにしている。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "チケットはあるが、要件・依存・完了条件との関係が曖昧。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "タスクID、親要件、依存関係、対象範囲、完了条件を管理している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "タスク外変更を検知し、完了条件の証跡が揃うまで完了扱いにしない。"
      }
    ],
    "riskIfLow": "AI変更が肥大化し、レビュー不能・副作用・手戻りが増えます。",
    "recommendation": "tasks.mdを作成し、1タスク1論理変更に分けてからAIへ渡してください。",
    "issueTemplate": "tasks.mdを作成する：タスクID、親要件、対象ファイル、完了条件、依存順を定義する。",
    "aiSelfCheck": "作業対象が1タスクに収まっているか確認し、超える場合はスコープ逸脱として報告する。"
  },
  {
    "id": "C3-Q5",
    "categoryId": 3,
    "target": "human",
    "question": "重要な設計判断をADR等で残し、AIが「なぜその制約があるか」を理解できますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "ADRがなく、設計判断は人の記憶に残っている。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "PRやチャットにはあるが、検索しやすい記録ではない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "主要判断について、背景、選択肢、決定、影響を記録している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "判断が変わった場合もADRを更新し、AI作業前に参照させている。"
      }
    ],
    "riskIfLow": "AIが制約の理由を理解できず、過去に棄却した設計を再提案します。",
    "recommendation": "docs/adr/を作成し、主要な技術選定・制約・不採用理由を記録してください。",
    "issueTemplate": "ADRテンプレートとdocs/adr/を作成し、重要判断を3件以上記録する。",
    "aiSelfCheck": "設計変更を提案する前に関連ADRを検索し、矛盾する場合は人間判断に回す。"
  },
  {
    "id": "C4-Q1",
    "categoryId": 4,
    "target": "human",
    "question": "AI生成コード専用のレビュー観点を、通常のコードレビューとは別に定義していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "人間作成コードと同じ観点のみで確認している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "「AIは注意して見る」程度で、観点は人任せ。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "スコープ遵守、前提、幻覚、セキュリティ、テストを確認している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "過去のAI起因欠陥から観点を更新し、レビュー漏れを測定している。"
      }
    ],
    "riskIfLow": "AI特有のもっともらしい誤りやスコープ逸脱を見落とします。",
    "recommendation": "AI生成物レビュー表を整備し、通常レビューに加えてAI特有リスクを確認してください。",
    "issueTemplate": "AI生成コード専用レビュー観点を作成する。",
    "aiSelfCheck": "提出時に、AIが生成した範囲と人間が確認すべき観点を明示する。"
  },
  {
    "id": "C4-Q2",
    "categoryId": 4,
    "target": "human",
    "question": "レビュー指摘に、仕様・テスト結果・再現手順などの根拠を必須にしていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "根拠なしの感覚的コメントが許容されている。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "根拠を出すこともあるが必須ではない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "各指摘に、証跡、仕様参照、再現条件のいずれかを付けている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "根拠なし指摘はレビュー出力から除外され、証跡品質を測定している。"
      }
    ],
    "riskIfLow": "主観レビューになり、AIにも人間にも改善可能な情報が残りません。",
    "recommendation": "Evidence-only reviewを導入し、指摘には必ず根拠を添えてください。",
    "issueTemplate": "レビュー指摘テンプレートに根拠欄を追加する。",
    "aiSelfCheck": "レビュー結果を出す際は、各指摘に証拠または未確認理由を付ける。"
  },
  {
    "id": "C4-Q3",
    "categoryId": 4,
    "target": "human",
    "question": "AIが生成した前提・推定・未確認事項を、レビュー時に分離して確認していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "前提や推定を分けず、AI出力をそのまま読む。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "気になる箇所だけ確認するが体系化していない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "AI出力に「確認済み」「推定」「未確認」を明示している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "未確認事項が残る場合は、マージ前に承認または検証タスク化している。"
      }
    ],
    "riskIfLow": "AIの推測が事実として扱われ、仕様逸脱や欠陥につながります。",
    "recommendation": "AI出力フォーマットに、確認済み・推定・未確認の区分を入れてください。",
    "issueTemplate": "AI出力テンプレートにVerified / Inferred / Not verifiedを追加する。",
    "aiSelfCheck": "推定事項を事実として書かず、未確認として明示する。"
  },
  {
    "id": "C4-Q4",
    "categoryId": 4,
    "target": "repo",
    "question": "AI生成変更の差分サイズと影響範囲を、レビュー可能な量に制御していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "AIが大量変更しても、そのままレビューしている。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "大きすぎる場合だけ人が分割を依頼する。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "差分行数、ファイル数、論理変更数の上限を決めている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "CIやPRテンプレートで過大差分を検知し、分割を促している。"
      }
    ],
    "riskIfLow": "レビュー密度が下がり、重要な欠陥が差分に埋もれます。",
    "recommendation": "PRサイズ上限と分割基準を定義し、AIにも事前に守らせてください。",
    "issueTemplate": "PRサイズ上限と分割基準を定義する。",
    "aiSelfCheck": "差分が大きくなる場合は、実装前に分割案を提示する。"
  },
  {
    "id": "C4-Q5",
    "categoryId": 4,
    "target": "human",
    "question": "AIレビューで見つかった欠陥を分類し、次回のプロンプトや観点へ反映していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "欠陥を直すだけで、分類・再発防止を残していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "印象的な欠陥だけメモしている。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "欠陥を前提誤り、仕様誤解、実装誤り、テスト不足などで分類している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "分類結果をプロンプト、レビュー観点、テスト方針へ継続的に反映している。"
      }
    ],
    "riskIfLow": "同じタイプのAI欠陥が継続的に混入します。",
    "recommendation": "AI欠陥分類表を作り、再発防止の更新先を明確にしてください。",
    "issueTemplate": "AI欠陥分類と再発防止ループを作成する。",
    "aiSelfCheck": "指摘を受けたら、単なる修正だけでなく、再発防止として何を更新すべきか提案する。"
  },
  {
    "id": "C5-Q1",
    "categoryId": 5,
    "target": "repo",
    "question": "AI支援変更に対して、自動テストが変更内容を直接検証していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "テストなし、または手動確認のみ。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "既存テストを流すが、変更内容に対応した追加は少ない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "変更内容に対応するユニット、統合、E2E等を追加・更新している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "AI変更前にテスト観点を定義し、カバレッジと欠陥検出率も追跡している。"
      }
    ],
    "riskIfLow": "AI生成コードの正常系だけが通り、境界・例外・退行が漏れます。",
    "recommendation": "AI変更には、対応するテスト追加または追加不要の根拠を必須にしてください。",
    "issueTemplate": "AI支援変更のテスト追加ルールを定義する。",
    "aiSelfCheck": "実装前に、何のテストで完了を確認するか宣言する。"
  },
  {
    "id": "C5-Q2",
    "categoryId": 5,
    "target": "human",
    "question": "AIが作ったテストケースを、人間がテスト設計観点でレビューしていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "AI生成テストをそのまま採用している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "ざっと読むが、観点網羅性までは見ない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "同値分割、境界値、状態遷移、デシジョンテーブル等で確認している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "欠陥傾向からテスト観点を更新し、AIテスト生成にフィードバックしている。"
      }
    ],
    "riskIfLow": "AIが見落としやすい条件や業務ルールがテストから抜けます。",
    "recommendation": "AI生成テストに対するQAレビュー観点を整備してください。",
    "issueTemplate": "AI生成テストレビュー観点を作成する。",
    "aiSelfCheck": "テスト生成時に、使ったテスト設計技法と未網羅リスクを明記する。"
  },
  {
    "id": "C5-Q3",
    "categoryId": 5,
    "target": "repo",
    "question": "AI支援変更後に、退行確認を自動で実行できる状態ですか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "退行確認は人手依存で、毎回ばらつく。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "一部自動化されているが、重要機能を網羅していない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "主要機能のスモーク・回帰テストをCIまたはローカルで実行できる。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "リスクに応じて実行範囲を選び、結果をPR証跡として残している。"
      }
    ],
    "riskIfLow": "AI変更の副作用をリリース前に検知できません。",
    "recommendation": "主要業務フローのスモークテストを整備し、PR前に実行してください。",
    "issueTemplate": "主要業務フローのスモーク/回帰テストを整備する。",
    "aiSelfCheck": "変更影響範囲に応じて、必要な回帰確認を選択し結果を報告する。"
  },
  {
    "id": "C5-Q4",
    "categoryId": 5,
    "target": "repo",
    "question": "テストデータと期待結果が、AIにも人間にも理解できる形で管理されていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "テストデータが個人環境や記憶に依存している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "一部メモはあるが、期待結果と紐づいていない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "テストデータ、前提条件、期待結果、作成手順を管理している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "データ更新時に影響テストを特定し、CIやテスト管理と連携している。"
      }
    ],
    "riskIfLow": "AIが適当なデータや誤った期待値でテストを作成します。",
    "recommendation": "テストデータ台帳と期待結果を整備してください。",
    "issueTemplate": "テストデータ・期待結果・前提条件の管理表を作成する。",
    "aiSelfCheck": "テストを書く前に、利用データと期待結果の根拠を確認する。"
  },
  {
    "id": "C5-Q5",
    "categoryId": 5,
    "target": "human",
    "question": "非機能品質（性能、保守性、可観測性、アクセシビリティ等）をAI変更でも確認していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "機能が動けばよい扱いで、非機能を確認しない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "気づいた範囲だけ確認する。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "AI変更にも非機能チェックリストを適用している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "品質特性ごとに基準値・測定方法・例外処理を運用している。"
      }
    ],
    "riskIfLow": "機能は動くが、運用品質や利用時品質が低下します。",
    "recommendation": "ISO/IEC 25010等を参考に、AI変更向け非機能チェックを整備してください。",
    "issueTemplate": "AI変更向け非機能品質チェックリストを作成する。",
    "aiSelfCheck": "変更が性能、保守性、可観測性、アクセシビリティへ影響するか確認する。"
  },
  {
    "id": "C6-Q1",
    "categoryId": 6,
    "target": "repo",
    "question": "AI支援変更に対して、CIで最低限の品質ゲートを通していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "CIがない、または手動実行のみ。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "CIはあるが、AI変更に必要な検査が不足している。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "lint、format、test、build等の基本ゲートをPRで実行している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "変更種別に応じた品質ゲートを自動選択し、失敗傾向も分析している。"
      }
    ],
    "riskIfLow": "AI変更が基本的な品質確認を通らずに混入します。",
    "recommendation": "PR時のCIゲートを整備し、テスト・静的解析・ビルドを必須化してください。",
    "issueTemplate": "PR品質ゲートを整備する：lint、format、test、build。",
    "aiSelfCheck": "PR前に実行すべきCI相当コマンドを明示し、結果を報告する。"
  },
  {
    "id": "C6-Q2",
    "categoryId": 6,
    "target": "repo",
    "question": "秘密情報・認証情報の混入を、自動検査で防いでいますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "secret scanがなく、目視に依存している。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "一部ツールはあるが、PR必須ではない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "secret scanをPRまたはcommit hookで実行している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "検知時の封じ込め、鍵ローテーション、教育まで運用している。"
      }
    ],
    "riskIfLow": "AIがサンプルや推測で秘密情報に見える文字列を生成し、漏えい事故につながります。",
    "recommendation": "secret scanを導入し、PR前の必須ゲートにしてください。",
    "issueTemplate": "secret scanをCIまたはpre-commitへ追加する。",
    "aiSelfCheck": "秘密情報、APIキー、トークン、個人情報を追加していないか確認する。"
  },
  {
    "id": "C6-Q3",
    "categoryId": 6,
    "target": "repo",
    "question": "AIが生成した依存関係追加を、自動またはレビューで制御していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "AIが必要と判断した依存を追加できる。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "依存追加は見るが、基準は明確でない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "依存追加には理由、代替案、ライセンス、脆弱性確認を必須にしている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "依存追加をCIで検出し、承認なしではマージできない。"
      }
    ],
    "riskIfLow": "不要な依存、脆弱性、ライセンス問題、保守負債が増えます。",
    "recommendation": "依存追加ポリシーと検出ゲートを設定してください。",
    "issueTemplate": "依存追加ルールを定義し、CIで変更検知する。",
    "aiSelfCheck": "依存追加が必要な場合、理由・代替案・リスクを先に提示する。"
  },
  {
    "id": "C6-Q4",
    "categoryId": 6,
    "target": "repo",
    "question": "品質ゲートの失敗理由を記録し、AIへの指示改善に使っていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "CI失敗を直すだけで、失敗傾向を残していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "頻出失敗は認識しているが、指示には反映していない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "CI失敗を分類し、再発防止を指示ファイルへ反映している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "失敗傾向を定期集計し、テンプレート・チェックリスト・自動修正に展開している。"
      }
    ],
    "riskIfLow": "同じCI失敗がAI作業ごとに繰り返されます。",
    "recommendation": "CI失敗分類と指示ファイル更新ルールを作ってください。",
    "issueTemplate": "CI失敗ログの分類・再発防止ループを作成する。",
    "aiSelfCheck": "CI失敗時は、原因・修正・再発防止先を報告する。"
  },
  {
    "id": "C6-Q5",
    "categoryId": 6,
    "target": "repo",
    "question": "マージ前に、未確認事項・例外承認・残リスクが記録されますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "未確認事項が残っても暗黙的に進む。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "重要そうなものだけPRコメントに書く。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "未確認、例外承認、残リスクをPRテンプレートに記録している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "残リスクを次Issueや運用監視へ紐づけ、後追いできる。"
      }
    ],
    "riskIfLow": "不確実性が隠れ、リリース後に問題化します。",
    "recommendation": "PRテンプレートに未確認事項と残リスク欄を追加してください。",
    "issueTemplate": "PRテンプレートに未確認事項・例外承認・残リスクを追加する。",
    "aiSelfCheck": "マージ前に未確認事項が残っていないか、残る場合は承認状況を明記する。"
  },
  {
    "id": "C7-Q1",
    "categoryId": 7,
    "target": "human",
    "question": "AIへ入力してよい情報と入力禁止情報を定義していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "入力禁止情報の定義がなく、判断は個人任せ。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "機密情報は避ける認識はあるが、具体例がない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "顧客情報、個人情報、認証情報、未公開情報などの入力禁止を明記している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "ツールごとのデータ保持条件も考慮し、教育・監査を行っている。"
      }
    ],
    "riskIfLow": "機密情報・個人情報が外部AIへ投入されるリスクがあります。",
    "recommendation": "AI入力禁止情報リストを作成し、具体例と判断に迷う場合の相談先を明記してください。",
    "issueTemplate": "AI入力禁止情報リストを作成する。",
    "aiSelfCheck": "プロンプトに機密情報・個人情報・認証情報が含まれていないか確認する。"
  },
  {
    "id": "C7-Q2",
    "categoryId": 7,
    "target": "repo",
    "question": "AI変更に対して、セキュリティ観点の静的解析や依存脆弱性確認を実行していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "セキュリティ検査をしていない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "一部ツールはあるが、AI変更と紐づいていない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "SAST、依存脆弱性、secret scanなどをPRで実行している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "検出結果をリスク評価し、例外承認と期限管理まで行っている。"
      }
    ],
    "riskIfLow": "AI生成コードに脆弱な実装や危険な依存が混入します。",
    "recommendation": "SAST・依存脆弱性・secret scanを品質ゲートに入れてください。",
    "issueTemplate": "AI変更向けセキュリティ検査をCIに追加する。",
    "aiSelfCheck": "セキュリティに関わる変更を行う場合、実行した検査と結果を明記する。"
  },
  {
    "id": "C7-Q3",
    "categoryId": 7,
    "target": "human",
    "question": "AIが生成したコードのライセンス・著作権リスクを確認していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "ライセンス観点で確認していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "気になった場合だけ確認している。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "外部コード流用、依存ライセンス、生成物利用条件を確認している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "SBOMや依存ライセンス確認を自動化し、例外管理している。"
      }
    ],
    "riskIfLow": "不適切なコード流用やライセンス違反が発生する可能性があります。",
    "recommendation": "AI生成コードと依存関係のライセンス確認ルールを明文化してください。",
    "issueTemplate": "AI生成物のライセンス確認ルールを作成する。",
    "aiSelfCheck": "外部由来コードを含む可能性がある場合、出典・ライセンス・代替案を確認する。"
  },
  {
    "id": "C7-Q4",
    "categoryId": 7,
    "target": "repo",
    "question": "ログ・エラーメッセージ・レポートに個人情報や秘密情報が出力されないよう確認していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "出力内容の機密性を確認していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "目視で気づいた範囲だけ確認する。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "ログ・エラー・レポートの機密情報出力をレビューしている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "マスキング、検査、運用監視まで仕組み化している。"
      }
    ],
    "riskIfLow": "AIが便利なログを追加し、意図せず機密情報を出力する可能性があります。",
    "recommendation": "ログ出力基準とマスキングルールを整備してください。",
    "issueTemplate": "ログ・エラー出力の機密情報チェックを追加する。",
    "aiSelfCheck": "ログ追加時は、個人情報・秘密情報・業務機密が出ないか確認する。"
  },
  {
    "id": "C7-Q5",
    "categoryId": 7,
    "target": "human",
    "question": "AI利用に関する顧客・社内・契約上の制約を確認していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "契約・社内規定との整合を確認していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "気になる案件だけ個別確認している。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "案件ごとにAI利用可否、入力可能情報、承認条件を確認している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "顧客・案件単位のAI利用条件を台帳化し、作業前に参照している。"
      }
    ],
    "riskIfLow": "契約違反や顧客合意違反につながります。",
    "recommendation": "案件別AI利用条件台帳を作成してください。",
    "issueTemplate": "案件別AI利用条件台帳を作成する。",
    "aiSelfCheck": "作業前に、この案件でAI利用が許可されているか確認する。"
  },
  {
    "id": "C8-Q1",
    "categoryId": 8,
    "target": "repo",
    "question": "要件・設計・実装・テスト・レビューが追跡できる形で紐づいていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "紐づけがなく、変更の根拠を追えない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "一部チケットに記載されるが、形式がばらつく。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "Issue、PR、テスト、仕様の参照関係を記録している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "変更影響と検証状況を自動集計できる。"
      }
    ],
    "riskIfLow": "AI変更の根拠や検証漏れが追えず、監査・引き継ぎが難しくなります。",
    "recommendation": "Issue/PR/テスト/仕様の参照ルールを作ってください。",
    "issueTemplate": "要件からテストまでのトレーサビリティルールを定義する。",
    "aiSelfCheck": "変更理由と参照元要件・Issue・テストを明記する。"
  },
  {
    "id": "C8-Q2",
    "categoryId": 8,
    "target": "repo",
    "question": "AIが変更したファイルと変更理由を、PRやレポートで一覧化していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "変更ファイルの理由を記録していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "主な変更だけ説明している。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "全変更ファイルに対して理由を記載している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "変更理由、影響範囲、確認結果を機械的に抽出できる形式で残している。"
      }
    ],
    "riskIfLow": "レビュー担当が差分の意図を追えず、重要な変更を見逃します。",
    "recommendation": "PRテンプレートにファイル別変更理由を追加してください。",
    "issueTemplate": "ファイル別変更理由欄をPRテンプレートへ追加する。",
    "aiSelfCheck": "変更ファイル一覧と理由を完了報告に含める。"
  },
  {
    "id": "C8-Q3",
    "categoryId": 8,
    "target": "human",
    "question": "AIとの会話・重要判断・承認内容を、後から参照できる形で残していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "会話履歴に依存し、成果物側には残していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "重要そうなものだけメモしている。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "重要判断、前提、承認内容をIssue/ADR/README等へ転記している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "判断ログを構造化し、次回AIセッションが参照できる。"
      }
    ],
    "riskIfLow": "AI会話の前提が消え、後続作業で判断を再現できません。",
    "recommendation": "重要なAI会話内容はCURRENT_STATE.md、ADR、Issueへ転記してください。",
    "issueTemplate": "AI会話の重要判断を永続文書へ残す運用を作る。",
    "aiSelfCheck": "会話中の決定事項を成果物側へ反映してから完了する。"
  },
  {
    "id": "C8-Q4",
    "categoryId": 8,
    "target": "repo",
    "question": "AI支援変更のレビュー結果と修正対応が追跡できますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "レビュー指摘と修正が対応づけられていない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "PRコメント上では追えるが、完了基準は曖昧。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "指摘、対応方針、修正コミット、再確認結果を紐づけている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "指摘種別を集計し、AI作業改善へ反映している。"
      }
    ],
    "riskIfLow": "レビューで何が直ったのか、何が未対応なのか不明になります。",
    "recommendation": "レビュー指摘管理の形式を定義し、対応状況を明確にしてください。",
    "issueTemplate": "レビュー指摘と修正対応の追跡ルールを作る。",
    "aiSelfCheck": "指摘対応時は、修正内容と再確認結果をセットで報告する。"
  },
  {
    "id": "C8-Q5",
    "categoryId": 8,
    "target": "repo",
    "question": "リリース後に、AI支援変更がどの機能・テスト・障害に関係したか追跡できますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "リリース後の追跡ができない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "PR単位では追えるが、機能・テスト・障害とは紐づかない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "リリースノートや変更履歴でAI支援変更を識別できる。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "障害・メトリクス・品質傾向とAI支援変更を関連分析できる。"
      }
    ],
    "riskIfLow": "AI導入効果や事故傾向を評価できません。",
    "recommendation": "AI支援変更をリリース情報へタグ付けしてください。",
    "issueTemplate": "AI支援変更タグをリリースノート・Issueに追加する。",
    "aiSelfCheck": "リリース対象にAI支援変更が含まれる場合、該当範囲と確認結果を明記する。"
  },
  {
    "id": "C9-Q1",
    "categoryId": 9,
    "target": "ai",
    "question": "AIエージェントが作業前に、前提・範囲・禁止事項を自己点検していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "作業前点検なしに実装を開始する。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "会話上で確認することはあるが、形式化されていない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "実装前チェックリストで、前提、範囲、禁止事項、テスト方針を確認している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "チェック結果を完了報告やPRに残し、漏れを改善している。"
      }
    ],
    "riskIfLow": "AIが誤った前提で作業を始め、広範囲の手戻りが発生します。",
    "recommendation": "Pre-Implementationチェックリストを導入してください。",
    "issueTemplate": "実装前自己点検チェックリストを作成する。",
    "aiSelfCheck": "作業開始前に、前提・範囲・禁止事項・検証方法を宣言する。"
  },
  {
    "id": "C9-Q2",
    "categoryId": 9,
    "target": "ai",
    "question": "AIエージェントが、事実・推定・未確認を分けて報告していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "推定を事実のように報告することがある。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "不確かなときだけ補足する。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "報告時に、確認済み、推定、未確認を分けて書いている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "未確認事項を次アクションや人間判断へ自動的につなげている。"
      }
    ],
    "riskIfLow": "未確認情報を前提に意思決定してしまいます。",
    "recommendation": "報告フォーマットに確認済み/推定/未確認を入れてください。",
    "issueTemplate": "AI報告フォーマットを整備する。",
    "aiSelfCheck": "未確認の内容は「未確認」と明記し、確認方法を提示する。"
  },
  {
    "id": "C9-Q3",
    "categoryId": 9,
    "target": "ai",
    "question": "AIエージェントが完了宣言前に、変更差分・テスト結果・残リスクを自己点検していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "完了宣言が主観的で、証跡確認がない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "差分やテストを確認することはあるが、形式化されていない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "完了前に差分、テスト、未確認、残リスクを確認している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "完了前チェックが自動化・テンプレ化され、漏れが検出される。"
      }
    ],
    "riskIfLow": "「完了」の品質が不安定になり、レビューで基本漏れが多発します。",
    "recommendation": "Done Gateチェックリストを導入してください。",
    "issueTemplate": "完了前自己点検チェックリストを作成する。",
    "aiSelfCheck": "完了前に、変更差分・実行テスト・未確認事項・残リスクを報告する。"
  },
  {
    "id": "C9-Q4",
    "categoryId": 9,
    "target": "ai",
    "question": "AIエージェントがエラーや失敗時に、原因と再発防止を自分で整理していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "エラーを直すだけで、原因分析しない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "簡単な原因説明はするが、再発防止までは出さない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "原因、修正、影響範囲、再発防止を報告している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "失敗をlessons.mdや指示ファイル更新へつなげている。"
      }
    ],
    "riskIfLow": "同じ失敗が繰り返され、AI活用の生産性が落ちます。",
    "recommendation": "エラー時の報告テンプレートを作成してください。",
    "issueTemplate": "エラー/失敗時の原因分析テンプレートを作成する。",
    "aiSelfCheck": "失敗時は、原因・修正・再発防止・更新すべき文書を報告する。"
  },
  {
    "id": "C9-Q5",
    "categoryId": 9,
    "target": "ai",
    "question": "AIエージェントが、人間に確認すべき判断と自律的に進めてよい作業を区別していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "AIが自己判断で重要な変更を進める。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "迷ったときだけ確認する。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "承認要否の基準があり、設計変更、依存追加、範囲外変更では確認する。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "確認要否を作業前に判定し、記録として残している。"
      }
    ],
    "riskIfLow": "AIが本来人間判断すべき変更を進め、事故や信頼低下につながります。",
    "recommendation": "承認要否基準を定義し、エージェント指示へ追加してください。",
    "issueTemplate": "AI作業の承認要否基準を作成する。",
    "aiSelfCheck": "作業前に、人間承認が必要な判断が含まれるか確認する。"
  },
  {
    "id": "C10-Q1",
    "categoryId": 10,
    "target": "human",
    "question": "AI活用の成果を、開発速度だけでなく品質指標でも測定していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "AI活用効果を測定していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "体感速度や作業時間だけを見ている。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "欠陥数、レビュー指摘、手戻り、テスト失敗など品質指標も見ている。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "速度・品質・リスク・学習効果を継続的に分析している。"
      }
    ],
    "riskIfLow": "AIで速くなった一方、品質劣化に気づけません。",
    "recommendation": "AI活用KPIに品質指標を含めてください。",
    "issueTemplate": "AI活用KPIを定義する：速度、品質、手戻り、レビュー指摘、欠陥。",
    "aiSelfCheck": "完了報告時に、品質面での効果・リスクも記載する。"
  },
  {
    "id": "C10-Q2",
    "categoryId": 10,
    "target": "repo",
    "question": "AI支援変更による欠陥・レビュー指摘・CI失敗を分類して蓄積していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "分類・蓄積していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "個別には見ているが、傾向分析していない。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "欠陥種別、発生工程、検出工程、AI関与を記録している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "傾向からプロンプト、レビュー、テスト、自動化を改善している。"
      }
    ],
    "riskIfLow": "AI活用の弱点が見えず、改善優先度を決められません。",
    "recommendation": "AI関連欠陥メトリクスを管理してください。",
    "issueTemplate": "AI関連欠陥・レビュー指摘・CI失敗の分類表を作成する。",
    "aiSelfCheck": "自分の作業で発生した指摘や失敗は、分類できる形で報告する。"
  },
  {
    "id": "C10-Q3",
    "categoryId": 10,
    "target": "human",
    "question": "診断結果をもとに、改善Issueへ落とし込んで管理していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "診断しても改善タスク化しない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "重要そうなものだけ口頭で対応する。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "P1/P2など優先度を付け、Issue化して進捗管理している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "改善効果を再診断で確認し、ロードマップへ反映している。"
      }
    ],
    "riskIfLow": "診断がイベントで終わり、現場の行動変化につながりません。",
    "recommendation": "診断後に上位リスクをIssue化し、担当・期限・完了条件を設定してください。",
    "issueTemplate": "診断結果から改善Issueを作成し、担当・期限・完了条件を設定する。",
    "aiSelfCheck": "診断で見つかったリスクを、具体的なIssue案として提示する。"
  },
  {
    "id": "C10-Q4",
    "categoryId": 10,
    "target": "human",
    "question": "AI開発プロセスを定期的に再評価し、成熟度の推移を見ていますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "一度も再評価していない。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "必要に応じて不定期に見直す。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "月次または四半期で再診断し、前回との差分を確認している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "成熟度推移を改善ロードマップ・教育・標準化へつなげている。"
      }
    ],
    "riskIfLow": "改善が定着したか分からず、形骸化します。",
    "recommendation": "定期再診断と差分レビューの運用を設計してください。",
    "issueTemplate": "四半期ごとのAIDD成熟度再診断を設定する。",
    "aiSelfCheck": "改善後に、再診断で効果確認することを提案する。"
  },
  {
    "id": "C10-Q5",
    "categoryId": 10,
    "target": "human",
    "question": "AI活用の標準・テンプレート・ナレッジを、チーム外へ展開できる形で整備していますか。",
    "choices": [
      {
        "score": 0,
        "label": "未整備",
        "description": "個人または一部チーム内に閉じている。"
      },
      {
        "score": 1,
        "label": "属人的",
        "description": "共有はしているが、再利用しづらい。"
      },
      {
        "score": 2,
        "label": "定義済み",
        "description": "標準テンプレート、手順、FAQ、事例を整備している。"
      },
      {
        "score": 3,
        "label": "運用定着",
        "description": "複数チームで利用し、フィードバックを受けて継続改善している。"
      }
    ],
    "riskIfLow": "個人依存のAI活用に留まり、組織能力になりません。",
    "recommendation": "AIDD標準キットとして、テンプレート・手順・事例を整備してください。",
    "issueTemplate": "AIDD標準キットを整備する：テンプレート、手順、FAQ、改善事例。",
    "aiSelfCheck": "今回得た知見を、再利用可能なテンプレートや手順に反映する。"
  }
];

let CATEGORIES = [];
let QUESTIONS = [];

(function initAppData() {
  try {
    const cs = localStorage.getItem('aidd_categories');
    const qs = localStorage.getItem('aidd_questions');
    CATEGORIES = cs ? JSON.parse(cs) : CATEGORIES_DEFAULT.map(c => ({ ...c }));
    QUESTIONS = qs ? JSON.parse(qs) : QUESTIONS_DEFAULT.map(q => ({ ...q, choices: q.choices.map(ch => ({ ...ch })) }));
  } catch (e) {
    CATEGORIES = CATEGORIES_DEFAULT.map(c => ({ ...c }));
    QUESTIONS = QUESTIONS_DEFAULT.map(q => ({ ...q, choices: q.choices.map(ch => ({ ...ch })) }));
  }
})();
