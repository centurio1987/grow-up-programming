#!/usr/bin/env bash

# 가이드 인덱스(문제_가이드_목록.md) 갱신 스크립트.
#
# 두 가지 모드:
#   1) 구조 보존 모드 — 인덱스 첫 줄에 "중요도순"이 있으면(사람이 관리하는 중요도별 구성),
#      기존 내용은 한 글자도 건드리지 않고, 아직 링크되지 않은 가이드 파일만
#      "### 자동 추가 (분류 대기)" 절에 덧붙인다. 누락이 없으면 아무것도 하지 않는다.
#      ⚠ 이 모드에서 전체 재생성은 금지다 — 중요도 구조가 초기화된다(반복 지적된 사고).
#   2) 전체 재생성 모드 (레거시) — 중요도순 문서가 아닐 때만, 카테고리별 알파벳순으로 생성한다.

cd "$(dirname "$0")/.." || exit 1

OUTPUT_FILE="문제_가이드_목록.md"

# ── 모드 1: 구조 보존 (중요도순 문서) ─────────────────────────────────────────
if [ -f "$OUTPUT_FILE" ] && head -1 "$OUTPUT_FILE" | grep -q "중요도순"; then
  # 인덱스를 한 번만 읽고 메모리에서 대조한다. 예전엔 가이드마다 grep 을 새로 띄워서
  # (가이드 180개 기준) 한 번 도는 데 ~0.27초가 걸렸다 — PostToolUse 는 루프를 막으므로
  # 그 비용이 툴 호출마다 붙었다. 판정 자체는 그대로다: 인덱스 어디든 `(./<경로>)` 가
  # 문자 그대로 있으면 링크된 것으로 본다.
  MISSING=$(find src -type f \( -name "*guide.md" -o -name "*guide.mdx" \) -not -path "*/_deprecated/*" | sort |
    awk -v idx="$OUTPUT_FILE" '
      BEGIN { while ((getline line < idx) > 0) buf = buf line "\n" }
      index(buf, "(./" $0 ")") == 0 { print }
    ')

  [ -z "$MISSING" ] && exit 0

  if ! grep -q "^### 자동 추가 (분류 대기)" "$OUTPUT_FILE"; then
    printf '\n### 자동 추가 (분류 대기)\n\n' >> "$OUTPUT_FILE"
    printf '<!-- 스크립트가 새 가이드를 임시로 넣는 자리입니다. 알맞은 중요도 기법 줄로 수동 이동해 주세요. -->\n' >> "$OUTPUT_FILE"
  fi

  printf '%s\n' "$MISSING" | while IFS= read -r path; do
    [ -z "$path" ] && continue
    name=$(basename "$path" | sed -E 's/-guide\.mdx?$//')
    printf -- '- [%s](./%s)\n' "$name" "$path" >> "$OUTPUT_FILE"
  done
  exit 0
fi

# ── 모드 2: 전체 재생성 (레거시 — 중요도순 문서가 아닐 때만) ──────────────────
{
  echo "# 문제 가이드 목록"
  echo ""
  echo "이 문서는 프로젝트에 존재하는 모든 문제 가이드 문서들을 카테고리별로 모아둔 인덱스입니다. (자동 생성됨)"
  echo ""

  find src -type f \( -name "*guide.md" -o -name "*guide.mdx" \) -not -path "*/_deprecated/*" | \
  awk -F'/' '
  {
    path = $0
    filename = $NF

    sub(/-guide\.mdx?$/, "", filename)
    problem_name = filename

    if (NF >= 4) {
      category = $2
    } else {
      category = "기본"
    }

    print category "\t" problem_name "\t" path
  }' | \
  sort -k1,1 -k2,2 | \
  awk -F'\t' '
  BEGIN { last_category = "" }
  {
    category = $1
    problem_name = $2
    path = $3

    if (category != last_category) {
      if (last_category != "") {
        print ""
      }
      print "## " category
      print ""
      last_category = category
    }
    print "- [" problem_name "](./" path ")"
  }
  END {
    if (last_category != "") {
      print ""
    }
  }'
} > "$OUTPUT_FILE"
