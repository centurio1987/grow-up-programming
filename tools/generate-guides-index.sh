#!/usr/bin/env bash

# 스크립트가 위치한 디렉토리의 부모(프로젝트 루트)로 이동
cd "$(dirname "$0")/.." || exit 1

OUTPUT_FILE="문제_가이드_목록.md"

{
  echo "# 문제 가이드 목록"
  echo ""
  echo "이 문서는 프로젝트에 존재하는 모든 문제 가이드 문서들을 카테고리별로 모아둔 인덱스입니다. (자동 생성됨)"
  echo ""
  
  # src 디렉토리 하위의 모든 guide 파일을 찾고 awk를 이용해 처리
  find src -type f \( -name "*guide.md" -o -name "*guide.mdx" \) | \
  awk -F'/' '
  {
    path = $0
    filename = $NF
    
    # 파일명에서 -guide.md 또는 -guide.mdx 제거하여 문제 이름 추출
    sub(/-guide\.mdx?$/, "", filename)
    problem_name = filename
    
    # 경로 길이에 따라 카테고리 분류 (기본은 src/카테고리명/문제명/파일 형태이므로 NF=4)
    if (NF >= 4) {
      category = $2
    } else {
      category = "기본"
    }
    
    # 탭으로 구분하여 출력 (정렬용)
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
