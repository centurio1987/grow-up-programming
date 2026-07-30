#!/usr/bin/env bash
# 이해 게이트 (comprehension gate) — ORD-005
#
# 가이드가 "이미 아는 사람의 요약문"인지 "모르는 사람을 이해시키는 글"인지 판정한다.
# review-guide.sh와 같은 인프라(codex / agy 병렬 호출)를 쓰지만 목적이 다르다:
#   review-guide.sh   = 전문가 검토 (누락·모순·사실성)
#   comprehension-gate.sh = 폐쇄형 독해 시험 (본문만으로 이해에 도달하는가)
#
# 설계 요점 — LLM은 이미 허프만도 AVL도 안다. 그래서 "모르는 척"에 기대지 않고
# **본문 인용 강제 + 본문 외 지식 금지**로 무지를 대신한다. 답을 못 쓰는 게 아니라
# "본문 어디에 근거가 있는지 못 대는 것"이 실패 신호다. 이게 존재 검사(인용 가능?)와
# 충분성 검사(그 인용이 유도를 담고 있나?)를 가르는 지점이다.
#
# 질문 5개는 **유형이 고정**이고, 주제별 구체화는 채점 모델이 한다(집필자가 자기에게
# 유리한 쉬운 질문을 내는 경로를 차단).
#
# Usage:
#   comprehension-gate.sh <guide-file>
#
# Exit codes:
#   0 = 이해 게이트 통과 (응답한 모델 전부 VERDICT: PASS)
#   2 = 두 모델 모두 사용 불가 → 게이트 미실행 (통과로 간주 금지)
#   3 = 이해 게이트 미통과 (한 모델이라도 VERDICT: FAIL)
#
# 모델 선택: 각 CLI 기본 모델. CODEX_MODEL / AGY_MODEL로 오버라이드.

set -u

CODEX_MODEL="${CODEX_MODEL:-}"
AGY_MODEL="${AGY_MODEL:-}"
CALL_TIMEOUT="${COMPREHENSION_GATE_TIMEOUT:-420}"

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
  err "사용법: comprehension-gate.sh <guide-file>"
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

SYSTEM_PROMPT='너는 이 주제를 처음 배우는 학습자 역할로 폐쇄형 독해 시험을 치른다. 동시에 그 시험을 채점하는 감독관이기도 하다. 한국어로 답한다.'

USER_PROMPT_HEAD='아래 === GUIDE === 이후의 학습 가이드 본문을 읽고, 다음 5개 질문에 답해라.

## 절대 규칙 (어기면 이 시험은 무효다)

1. **본문 안에 적힌 것만 근거로 삼는다.** 너는 이 주제를 이미 알고 있겠지만, 그 지식을 답에
   섞으면 안 된다. 이 시험이 재는 것은 네 지식이 아니라 **본문의 설명력**이다.
2. **각 답마다 근거가 된 본문 구절을 그대로 인용한다.** 인용은 요약이 아니라 원문 복사다.
3. **본문에 근거가 없으면 답을 지어내지 말고 정확히 `근거 없음`이라고 쓴다.**
   네가 아는 정답을 적어 넣는 것이 이 시험의 유일한 실패 방식이다.
4. **인용은 했지만 그 인용이 결론만 말하고 이유를 말하지 않으면 `결론만 있음`이라고 쓴다.**
   예: "$\Delta \le 0$이 성립해서 비용이 늘지 않습니다"는 결론이다 — 각 항의 부호가 왜 그런지가
   본문에 없으면 `결론만 있음`이다.
   예: "리프에만 문자가 있으므로 접두어가 될 수 없습니다"도 결론이다 — 접두어가 겹치면 무엇이
   구체적으로 깨지는지가 본문에 없으면 `결론만 있음`이다.

## 질문 (유형 고정 — 이 주제에 맞게 네가 구체화해서 답하라)

- **Q1 (동기 — 두 층위를 모두 답해야 한다)** 아래 (a)와 (b)는 다른 질문이다. **하나라도 본문에
  근거가 없으면 Q1 전체가 `근거 없음`**이고, 근거는 있는데 수치 대조 없이 형용사뿐이면
  `결론만 있음`이다. (a)만 답하고 (b)를 건너뛰는 것이 이 시험의 대표적 오답이다.
  - **(a) 개념 층위**: 이 가이드가 다루는 대상이 아예 없을 때 쓰게 되는 가장 단순하고 자연스러운
    방법은 무엇이고, 그 방법은 어디서 무너지는가? 본문의 **구체적 수치 대조**를 인용하라.
  - **(b) 절차 층위**: 같은 목표를 노리지만 **더 단순하거나 더 먼저 떠오르는 다른 절차·설계**를
    본문이 실명으로 제시하고, 그것이 왜 지는지 **같은 입력에서 수치로** 대조하는가?
    (예시: 이 대상이 무언가를 "만드는 절차"라면 — 위에서부터 반씩 쪼개기, 정렬해서 순서대로
    처리하기, 역사적 선행 기법 등. 이 대상이 자료구조라면 — 정렬 배열, 연결 리스트, 해시맵,
    단순 이진 탐색 트리 등.)
    본문이 최종 절차만 설명하고 "이것 말고 저것은 왜 안 되는가"를 다루지 않으면 `근거 없음`이다.
    **(a)의 답을 (b)에 재사용하지 마라** — (a)는 "왜 이 목표가 필요한가", (b)는 "왜 하필 이 방법으로
    그 목표에 도달하는가"이다. 둘이 같은 인용으로 채워지면 (b)는 `근거 없음`이다.
- **Q2 (핵심 통찰)** 이 방법이 통하는 이유를 **수식·기호 없이 한 문장**으로 말하면 무엇인가?
  그 문장을 본문 어디서 얻었는지 인용하라.
- **Q3 (정당성)** 왜 이 방법이 **항상** 옳은가? 논증의 각 단계와, **각 단계가 성립하는 이유**까지
  본문에서 찾아 재구성하라. 중간 단계가 "반복 적용하면" 같은 말로 뭉개져 있으면 `결론만 있음`이다.
- **Q4 (반례)** 본문이 내세운 핵심 제약·불변식 하나를 골라라. 그것이 깨지면 **구체적으로 무엇이**
  잘못되는가? 본문이 실제로 보여 준 잘못된 값·동작·에러를 인용하라.
- **Q5 (구현)** 본문 코드에서 순서나 조건 한 곳을 바꾸면 어떤 **구체적으로 잘못된 결과**가
  나오는가? 본문이 그 잘못된 결과를 실제 값으로 보였는지 확인하고 인용하라.

## 출력 형식

각 질문마다 아래 3줄을 쓴다.

```
[Q1] 답변: <본문만으로 재구성한 답, 또는 "근거 없음" / "결론만 있음">
[Q1] 인용: "<본문 원문 그대로>"
[Q1] 판정: PASS | FAIL(근거 없음) | FAIL(결론만 있음)
```

5개를 모두 마친 뒤, **마지막 줄에 반드시** 아래 형식의 한 줄을 단독으로 출력한다.
FAIL이 하나라도 있으면 전체는 FAIL이다.

```
VERDICT: PASS
```
또는
```
VERDICT: FAIL
```

VERDICT 줄 앞에, FAIL인 항목마다 "무엇이 본문에 없어서 답할 수 없었는지"를 한 줄씩 적어라.
이것이 집필자에게 돌아갈 보완 지시가 된다.

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
    printf 'codex CLI 미설치 — ChatGPT 독해 시험을 건너뜁니다.\n' >"$CODEX_ERR"
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
    printf 'antigravity CLI(agy) 미설치 — Gemini 독해 시험을 건너뜁니다.\n' >"$AGY_ERR"
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
ANY_FAIL=0
ANY_MISSING_VERDICT=0

# VERDICT 줄을 추출해 판정한다. 줄이 없으면(형식 미준수) 미통과로 본다 — 통과는 명시적이어야 한다.
judge() {
  local file="$1" label="$2" verdict
  verdict="$(grep -aoE '^[[:space:]]*VERDICT:[[:space:]]*(PASS|FAIL)' "$file" 2>/dev/null \
    | tail -n 1 | grep -aoE '(PASS|FAIL)')"
  if [ -z "$verdict" ]; then
    printf '\n[%s] VERDICT 줄을 찾지 못했습니다 — 형식 미준수는 미통과로 처리합니다.\n' "$label"
    ANY_MISSING_VERDICT=1
    return
  fi
  printf '\n[%s] 이해 게이트 판정: %s\n' "$label" "$verdict"
  [ "$verdict" = "FAIL" ] && ANY_FAIL=1
  return 0
}

printf '=== ChatGPT (codex CLI) — 폐쇄형 독해 시험 ===\n'
if [ -s "$CODEX_LAST" ]; then
  cat "$CODEX_LAST"; printf '\n'; ANY_OUTPUT=1
  judge "$CODEX_LAST" "codex"
elif [ -s "$CODEX_ERR" ]; then
  printf '[skip] %s\n' "$(cat "$CODEX_ERR")"
else
  printf '[빈 응답]\n'
fi

printf '\n=== Gemini (antigravity CLI) — 폐쇄형 독해 시험 ===\n'
if [ -s "$AGY_OUT" ]; then
  cat "$AGY_OUT"; printf '\n'; ANY_OUTPUT=1
  judge "$AGY_OUT" "agy"
elif [ -s "$AGY_ERR" ]; then
  printf '[skip] %s\n' "$(cat "$AGY_ERR")"
else
  printf '[빈 응답]\n'
fi

if [ "$ANY_OUTPUT" -eq 0 ]; then
  err ""
  err "두 모델 모두 응답을 받지 못했습니다 — 이해 게이트 미실행. 통과로 간주하지 마세요."
  exit 2
fi

printf '\n----------------------------------------\n'
if [ "$ANY_FAIL" -eq 1 ] || [ "$ANY_MISSING_VERDICT" -eq 1 ]; then
  printf '이해 게이트: FAIL — 위 "근거 없음 / 결론만 있음" 항목이 곧 보완 지시입니다.\n'
  printf '해당 내용을 본문에 채워 넣은 뒤 다시 실행하세요. 기준을 낮춰 통과시키지 마세요.\n'
  exit 3
fi
printf '이해 게이트: PASS — 응답한 모델 전부가 본문만으로 5개 질문에 답했습니다.\n'
exit 0
