#!/usr/bin/env bash
# Send a coding-test problem statement (md/mdx) to the codex CLI (ChatGPT) and the
# antigravity CLI (agy / Gemini) in parallel and print both reviews. Ported from
# .claude/skills/guide-for-problem/scripts/review-guide.sh (auth/skip/timeout/parallel)
# but with a PROBLEM-statement review prompt:
# ambiguity, contradiction, example accuracy, and solution-hint leakage.
#
# Usage:
#   review-problem.sh <problem-file>
#
# Requires the `codex` and/or `agy` CLI installed and authenticated (ChatGPT /
# Google login only — API keys are NOT used). Whichever is missing/unauthenticated
# is skipped with a notice. Exit code 2 = both unavailable (caller's completeness
# gate should treat the problem as NOT review-passed).
#
# Model selection: each CLI's own default model. Override with CODEX_MODEL / AGY_MODEL.

set -u

CODEX_MODEL="${CODEX_MODEL:-}"
AGY_MODEL="${AGY_MODEL:-}"
CALL_TIMEOUT="${REVIEW_PROBLEM_TIMEOUT:-420}"

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

PROBLEM_FILE="${1:-}"
if [ -z "$PROBLEM_FILE" ]; then
  err "사용법: review-problem.sh <problem-file>"
  exit 1
fi
if [ ! -r "$PROBLEM_FILE" ]; then
  err "문제 파일을 읽을 수 없습니다: $PROBLEM_FILE"
  exit 1
fi
if [ ! -s "$PROBLEM_FILE" ]; then
  err "문제 파일이 비어 있습니다: $PROBLEM_FILE"
  exit 1
fi

PROBLEM_BODY="$(cat "$PROBLEM_FILE")"

SYSTEM_PROMPT='너는 깐깐한 코딩 테스트 출제 검토자다. 주어진 문제 설명서의 약점을 한국어로 지적하라.'
USER_PROMPT_HEAD='다음 코딩 테스트 "문제 설명서"를 검토해 줘. 이건 풀이가 아니라 출제 문서다. 아래 네 축을 중심으로, 가장 중요한 지적부터 항목별 bullet로 한국어로 답해 줘.

1) 모호성/미정의: 응시자가 서로 다르게 해석할 여지가 있는 서술, 정량화되지 않은 제약("적당히/큰 수/빠르게"), 정의 없이 쓰인 용어·기호, 미규정 경계/예외(빈 입력·동점·음수·오버플로 경계 등). "이 부분은 한 가지 해석만 남도록 못 박아야 한다"는 곳을 구체적으로.
2) 모순/충돌: 제약·규칙·함수 시그니처·예시가 서로 어긋나는 곳, 정의와 사용이 다른 용어.
3) 예시 정확성: 제시된 (입력→출력) 예시가 본문 규칙과 어긋나는 곳, 틀린 기대 출력, 경계 케이스 예시 부족.
4) 풀이 힌트 누출: 본문(스토리·예시 해설 포함)이 알고리즘·자료구조·풀이 절차·복잡도 트릭을 암시하는 곳. 출제 문서는 푸는 방법을 알려주면 안 된다.

동의하는 부분은 길게 칭찬하지 말고 한 줄로만 인정해 줘. 추측이 섞인 지적은 "추정"이라고 표시해 줘.

=== PROBLEM ==='
USER_PROMPT="${USER_PROMPT_HEAD}
${PROBLEM_BODY}"

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
  err "두 모델 모두 응답을 받지 못했습니다 — 외부 검토 미통과. 문제를 '완성'으로 간주하지 마세요."
  exit 2
fi
