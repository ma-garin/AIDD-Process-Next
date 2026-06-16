#!/usr/bin/env bash
#
# done-gate.sh — 必須成果物の存在を検査する Definition of Done ゲート。
# 各チェックで OK/NG を出力し、NG が1つでもあれば exit 1 で終了する。
#
# 使い方:
#   bash scripts/done-gate.sh
#
set -euo pipefail

# リポジトリルート（本スクリプトの1つ上の階層）へ移動する。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

# 必須成果物（ファイル）。
REQUIRED_FILES=(
  "LICENSE"
  "README.md"
  "CHANGELOG.md"
  "PRIVACY.md"
  "CONTRIBUTING.md"
  "docs/index.html"
  "docs/js/scoring.js"
  "docs/js/app.js"
  "docs/data/questions.js"
  ".github/workflows/ci.yml"
)

# 必須成果物（ディレクトリ）。
REQUIRED_DIRS=(
  "tests"
)

fail_count=0

echo "=============================================="
echo " AIDD Process Next — Done Gate"
echo " root: ${ROOT_DIR}"
echo "=============================================="
echo

echo "[ files ]"
for f in "${REQUIRED_FILES[@]}"; do
  if [[ -f "${f}" ]]; then
    printf '  OK  %s\n' "${f}"
  else
    printf '  NG  %s (見つかりません)\n' "${f}"
    fail_count=$((fail_count + 1))
  fi
done

echo
echo "[ directories ]"
for d in "${REQUIRED_DIRS[@]}"; do
  if [[ -d "${d}" ]]; then
    printf '  OK  %s/\n' "${d}"
  else
    printf '  NG  %s/ (見つかりません)\n' "${d}"
    fail_count=$((fail_count + 1))
  fi
done

echo
echo "----------------------------------------------"
if [[ "${fail_count}" -eq 0 ]]; then
  echo "RESULT: PASS — 必須成果物はすべて揃っています。"
  echo "----------------------------------------------"
  exit 0
else
  echo "RESULT: FAIL — ${fail_count} 件の必須成果物が不足しています。"
  echo "----------------------------------------------"
  exit 1
fi
