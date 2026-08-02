#!/usr/bin/env bash
# Send an algorithm guide (md/mdx) to the codex CLI (ChatGPT) and the antigravity
# CLI (agy / Gemini) in parallel and print both reviews. Ported from
# ~/centurio1987.github.io/.claude/skills/tech-deepdive/scripts/review-article.sh
# (auth/skip/timeout/parallel) but with an algorithm-guide review prompt:
# omissions, contradictions, factual accuracy (complexity / correctness / standard algorithm).
#
# Usage:
#   review-guide.sh <guide-file>
#
# Requires the `codex` and/or `agy` CLI installed and authenticated (ChatGPT /
# Google login only — API keys are NOT used). Whichever is missing/unauthenticated
# is skipped with a notice. Exit code 2 = both unavailable (caller's completeness
# gate should treat the guide as NOT review-passed).
#
# Model selection: each CLI's own default model. Override with CODEX_MODEL / AGY_MODEL.

set -u

CODEX_MODEL="${CODEX_MODEL:-}"
AGY_MODEL="${AGY_MODEL:-}"
CALL_TIMEOUT="${REVIEW_GUIDE_TIMEOUT:-420}"

err() { printf '%s\n' "$*" >&2; }

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
fi
run_limited() {
  if [ -n "$TIMEOUT_CMD" ]; then
    "$TIMEOUT_CMD" "$CALL_TIMEOUT" "$@"
  else
    "$@"
  fi
}

GUIDE_FILE="${1:-}"
if [ -z "$GUIDE_FILE" ]; then
  err "사용법: review-guide.sh <guide-file>"
  exit 1
fi
if [ ! -r "$GUIDE_FILE" ]; then
  err "가이드 파일을 읽을 수 없습니다: $GUIDE_FILE"
  exit 1
fi
if [ ! -s "$GUIDE_FILE" ]; then
  err "가이드 파일이 비어 있습니다: $GUIDE_FILE"
  exit 1
fi

GUIDE_BODY="$(cat "$GUIDE_FILE")"

SYSTEM_PROMPT='너는 깐깐한 알고리즘 해설 검토자다. 주어진 문제 풀이 가이드의 약점을 한국어로 지적하라.'
USER_PROMPT_HEAD='다음 알고리즘 문제 풀이 가이드를 검토해 줘. 아래 세 축을 중심으로, 가장 중요한 지적부터 항목별 bullet로 한국어로 답해 줘.

1) 누락/생략: 풀이를 끝까지 이해하는 데 꼭 필요한데 빠진 단계(원천 아이디어→솔루션 유도의 비약, 빠진 경계/예외 케이스, 설명 없는 핵심 용어·기호, 불변식·증명 골자의 누락). "이 유도는 한 단계 더 쪼개야 한다"는 곳을 구체적으로.
2) 모순/충돌: 가이드 안에서 앞뒤가 어긋나는 서술, 정의와 사용이 다른 용어·기호, 트레이스/그림과 본문의 불일치.
3) 사실 정확성/시대성: 틀렸거나 낡은 설명, 시간/공간 복잡도 분석 오류, 정확성 증명·불변식의 허점, 표준 알고리즘과 어긋나는 동작, 근거가 약한 단정.

동의하는 부분은 길게 칭찬하지 말고 한 줄로만 인정해 줘. 추측이 섞인 지적은 "추정"이라고 표시해 줘.

=== GUIDE ==='
USER_PROMPT="${USER_PROMPT_HEAD}
${GUIDE_BODY}"

COMBINED_PROMPT="${SYSTEM_PROMPT}

${USER_PROMPT}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

CODEX_LAST="$TMP_DIR/codex.last"
CODEX_LOG="$TMP_DIR/codex.log"
CODEX_ERR="$TMP_DIR/codex.err"
AGY_OUT="$TMP_DIR/agy.out"
AGY_ERR="$TMP_DIR/agy.err"

call_codex() {
  if ! command -v codex >/dev/null 2>&1; then
    printf 'codex CLI 미설치 — ChatGPT 검토를 건너뜁니다.\n' >"$CODEX_ERR"
    return 0
  fi
  local model_args=()
  [ -n "$CODEX_MODEL" ] && model_args=(-m "$CODEX_MODEL")
  # API 키 미사용 — codex가 ChatGPT 로그인만 쓰도록 이 서브셸 한정으로 제거.
  unset OPENAI_API_KEY
  # read-only 샌드박스 + 작업 루트를 임시 디렉토리로 고정해 로컬 파일을 못 건드리게.
  if ! printf '%s' "$COMBINED_PROMPT" | run_limited codex exec \
        --skip-git-repo-check -s read-only --color never \
        -C "$TMP_DIR" -o "$CODEX_LAST" "${model_args[@]+"${model_args[@]}"}" - \
        >"$CODEX_LOG" 2>&1; then
    {
      printf 'codex 실행 실패 — 인증 만료(세션 종료)일 수 있습니다. `codex login` 후 다시 시도하세요.\n'
      grep -aiE 'ERROR:|unauthorized|log in again|invalidated|session has ended' "$CODEX_LOG" 2>/dev/null \
        | awk '!seen[$0]++' | tail -n 4
    } >"$CODEX_ERR"
    : >"$CODEX_LAST"
  fi
}

call_agy() {
  if ! command -v agy >/dev/null 2>&1; then
    printf 'antigravity CLI(agy) 미설치 — Gemini 검토를 건너뜁니다.\n' >"$AGY_ERR"
    return 0
  fi
  local model_args=()
  [ -n "$AGY_MODEL" ] && model_args=(-m "$AGY_MODEL")
  run_limited agy -p "$COMBINED_PROMPT" "${model_args[@]+"${model_args[@]}"}" \
    </dev/null >"$AGY_OUT" 2>"$AGY_ERR"
  local rc=$?
  if [ "$rc" -ne 0 ] || grep -qiE 'Authentication required|authentication timed out' "$AGY_OUT" 2>/dev/null; then
    cat "$AGY_OUT" >>"$AGY_ERR" 2>/dev/null
    printf '\nagy 인증 필요 — 터미널에서 `agy`를 한 번 실행해 Google 로그인 후 다시 시도하세요.\n' >>"$AGY_ERR"
    : >"$AGY_OUT"
  fi
}

call_codex &
PID_CODEX=$!
call_agy &
PID_AGY=$!
wait "$PID_CODEX" "$PID_AGY"

ANY_OUTPUT=0

printf '=== ChatGPT (codex CLI) ===\n'
if [ -s "$CODEX_LAST" ]; then
  cat "$CODEX_LAST"; printf '\n'; ANY_OUTPUT=1
elif [ -s "$CODEX_ERR" ]; then
  printf '[skip] %s\n' "$(cat "$CODEX_ERR")"
else
  printf '[빈 응답]\n'
fi

printf '\n=== Gemini (antigravity CLI) ===\n'
if [ -s "$AGY_OUT" ]; then
  cat "$AGY_OUT"; printf '\n'; ANY_OUTPUT=1
elif [ -s "$AGY_ERR" ]; then
  printf '[skip] %s\n' "$(cat "$AGY_ERR")"
else
  printf '[빈 응답]\n'
fi

if [ "$ANY_OUTPUT" -eq 0 ]; then
  err ""
  err "두 모델 모두 응답을 받지 못했습니다 — 외부 검토 미통과. 가이드를 '완성'으로 간주하지 마세요."
  exit 2
fi
