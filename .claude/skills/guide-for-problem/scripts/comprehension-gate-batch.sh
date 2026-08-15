#!/usr/bin/env bash
# 이해 게이트 일괄 실행 — 전수 감사용
#
# comprehension-gate.sh 를 여러 가이드에 돌리고 결과를 TSV 한 장으로 모은다.
# 낱건 게이트가 "이 글이 통과하는가"를 묻는다면, 이쪽은 "어느 글들이 같은 병을
# 앓는가"를 묻는다 — 목록이 나와야 재집필 우선순위를 정할 수 있다.
#
# Usage:
#   comprehension-gate-batch.sh <출력디렉터리> <가이드파일...>
#   find src/algorithms -name '*-guide.mdx' | xargs comprehension-gate-batch.sh out/
#
# 재개 가능: 이미 결과가 있는 건은 건너뛴다. 중단해도 다시 돌리면 이어서 한다.
# 병렬도는 GATE_JOBS(기본 3). 각 건이 외부 CLI 2개를 동시에 부르므로 올리면 금방 막힌다.

set -u

JOBS="${GATE_JOBS:-3}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATE="$HERE/comprehension-gate.sh"

OUT_DIR="${1:-}"
shift || true

if [ -z "$OUT_DIR" ] || [ "$#" -eq 0 ]; then
  echo "사용법: comprehension-gate-batch.sh <출력디렉터리> <가이드파일...>" >&2
  exit 1
fi

mkdir -p "$OUT_DIR/raw"
TSV="$OUT_DIR/results.tsv"
[ -f "$TSV" ] || printf 'exit\tsecs\tname\tfailed_q\tfile\n' >"$TSV"

export GATE OUT_DIR TSV

run_one() {
  local file="$1"
  local name; name="$(basename "$(dirname "$file")")"
  local raw="$OUT_DIR/raw/$name.txt"

  # 재개: 이미 판정이 찍힌 결과가 있으면 건너뛴다.
  if [ -s "$raw" ] && grep -q '이해 게이트: \(PASS\|FAIL\)' "$raw" 2>/dev/null; then
    echo "[skip] $name (결과 있음)" >&2
    return 0
  fi

  local t0 t1 rc
  t0=$(date +%s)
  bash "$GATE" "$file" >"$raw" 2>&1
  rc=$?
  t1=$(date +%s)

  # 어느 질문이 떨어졌는지 뽑는다 — 이게 곧 보완 지시의 요약이다.
  local failed
  failed="$(grep -oE '^\[Q[1-5]\] 판정: FAIL' "$raw" 2>/dev/null \
    | grep -oE 'Q[1-5]' | sort -u | paste -sd, -)"
  [ -z "$failed" ] && failed="-"

  printf '%s\t%s\t%s\t%s\t%s\n' "$rc" "$((t1 - t0))" "$name" "$failed" "$file" >>"$TSV"
  echo "[done] $name exit=$rc $((t1 - t0))s failed=$failed" >&2
}
export -f run_one

printf '%s\n' "$@" | xargs -P "$JOBS" -I{} bash -c 'run_one "$@"' _ {}

echo >&2
echo "=== 요약 ===" >&2
awk -F'\t' 'NR>1 {c[$1]++} END {for (k in c) printf "  종료코드 %s: %d건\n", k, c[k]}' "$TSV" >&2
echo "  결과: $TSV" >&2
