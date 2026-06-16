#!/usr/bin/env bash
# scan-forbidden-terms.sh — 出荷されるUIシェルに専有名称が混入していないか検査する（X2）。
# agent.md の非交渉原則: TPI NEXT / QA4AIDD 等の専有文言を流用しない、外部名称に TPI を冠さない。
# 研究参照（docs/research/, *.md）は対象外。検査対象はユーザーに配信される UI のみ。
set -euo pipefail

targets=("docs/index.html" "docs/manifest.json")
patterns=("TPI NEXT" "TPI-NEXT" "QA4AIDD" "QA4-AIDD")
found=0

for f in "${targets[@]}"; do
  [ -f "$f" ] || continue
  for p in "${patterns[@]}"; do
    if grep -i -n -F "$p" "$f" >/dev/null 2>&1; then
      echo "NG: 専有名称 '$p' が $f に含まれています"
      found=1
    fi
  done
done

if [ "$found" -ne 0 ]; then
  echo "禁止語スキャン: 失敗"
  exit 1
fi
echo "禁止語スキャン: OK（対象: ${targets[*]}）"
