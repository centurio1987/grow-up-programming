#!/usr/bin/env bash
#
# 이해 시험 V1~V7 — `algo-learn-guide` 골격 전용.
#
# 구 `comprehension-gate.sh` 를 부르지 않고 새로 짓는다. 그 질문지가 구 골격의 의무를
# 박아 두고 있어서다 — Q1(a)·Q3·Q5 의 담당 절이 구 명세의 `naive`·`idea.proof`·`impl` 이고,
# 하나라도 FAIL 이면 전체 FAIL 이라 새 골격은 구조적으로 통과하지 못한다.
# **규칙은 물려받고 구현만 새로 한다.**
#
# 물려받은 것 넷(구 스크립트 :72-81 의 절대 규칙):
#   ① 본문만 근거로 삼는다  ② 근거는 원문 그대로 인용한다
#   ③ 근거를 못 찾으면 `근거 없음`  ④ 인용이 결론만 담으면 `결론만 있음`
# ④ 가 없으면 V3·V7 은 결론 인용만으로 전부 통과한다. 이 시험의 본체가 여기 있다.
#
# 새로 한 것 넷:
#   · 질문 수를 프롬프트에 **정확히** 적는다(구 스크립트는 "5개"라 말하고 Q1~Q6 을 채점했다)
#   · **V별 판정을 파싱**한다(구 스크립트는 마지막 VERDICT 한 줄만 봤다)
#   · **미실행(2) 과 미통과(3) 를 가른다** — 미실행은 카운터에 넣지 않고 배치를 멈춘다
#   · 응답 원문을 `verdicts/` 에 **보관**한다(구 스크립트는 mktemp + trap 으로 지웠다)
#
# 판정 결합은 **AND** 다 — 응답한 모델 전부가 PASS 여야 그 V 가 통과다.
#
#   bash tools/comprehension.sh <guide.md> [--round N] [--ablate <절 id>]
#
# 종료코드: 0 통과 · 2 미실행(통과 아님, 배치를 멈춘다) · 3 미통과 · 1 사용법 오류

set -u

CALL_TIMEOUT="${COMPREHENSION_TIMEOUT:-420}"
CODEX_MODEL="${CODEX_MODEL:-}"
AGY_MODEL="${AGY_MODEL:-}"

err() { printf '%s\n' "$*" >&2; }

TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
fi
run_limited() {
  if [ -n "$TIMEOUT_CMD" ]; then "$TIMEOUT_CMD" "$CALL_TIMEOUT" "$@"; else "$@"; fi
}

# ────────────────────────── 인자 ──────────────────────────

GUIDE_FILE=""
ROUND=""
ABLATE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --round) ROUND="${2:-}"; shift 2 ;;
    --ablate) ABLATE="${2:-}"; shift 2 ;;
    -*) err "모르는 옵션: $1"; exit 1 ;;
    *) GUIDE_FILE="$1"; shift ;;
  esac
done

if [ -z "$GUIDE_FILE" ]; then
  err "사용법: comprehension.sh <guide.md> [--round N] [--ablate <절 id>]"
  exit 1
fi
[ -r "$GUIDE_FILE" ] || { err "읽을 수 없습니다: $GUIDE_FILE"; exit 1; }
[ -s "$GUIDE_FILE" ] || { err "비어 있습니다: $GUIDE_FILE"; exit 1; }

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# 자기시험은 이 값을 임시 디렉터리로 덮는다. 안 그러면 스텁이 만든 가짜 판정이
# 진짜 판정 근거 사이에 섞이고, 그 디렉터리는 커밋 대상이라 이력에 그대로 남는다.
VERDICT_DIR="${COMPREHENSION_VERDICT_DIR:-$HERE/verdicts}"
mkdir -p "$VERDICT_DIR"

BASE="$(basename "$GUIDE_FILE")"; BASE="${BASE%-guide.md}"; BASE="${BASE%.md}"
SLUG="$BASE"
[ -n "$ABLATE" ] && SLUG="$BASE-ablate-$(printf '%s' "$ABLATE" | tr '.' '-')"

if [ -z "$ROUND" ]; then
  ROUND=1
  while [ -e "$(printf '%s/%s-r%02d.md' "$VERDICT_DIR" "$SLUG" "$ROUND")" ]; do
    ROUND=$((ROUND + 1))
  done
fi
VERDICT_FILE="$(printf '%s/%s-r%02d.md' "$VERDICT_DIR" "$SLUG" "$ROUND")"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# ────────────────────────── 본문 (필요하면 절제) ──────────────────────────
#
# 절제 시험은 **그 절과 그 절을 가리키는 인용을 함께** 지운다. 인용만 남기면 사본이
# dangling reference 를 가진 글이 되고, 시험이 "그 절이 실질을 가진다"가 아니라
# "참조가 깨졌다"를 잡는다 — 판정력이 그 순간 사라진다.

if [ -n "$ABLATE" ]; then
  python3 - "$GUIDE_FILE" "$ABLATE" >"$TMP_DIR/body.md" <<'PY'
import re, sys

path, target = sys.argv[1], sys.argv[2]
lines = open(path, encoding="utf-8").read().split("\n")

HEADINGS = {
    "trace": (2, "## 한 입력으로 끝까지 굴려 보기"),
    "purpose.alt": (3, "### 경쟁 설계와의 대조"),
}
if target not in HEADINGS:
    sys.exit(f"절제 대상은 {'·'.join(HEADINGS)} 뿐입니다: {target}")
level, heading = HEADINGS[target]

out, dropping = [], False
for line in lines:
    if line.strip() == heading:
        dropping = True
        continue
    if dropping:
        m = re.match(r"^(#{1,6}) ", line)
        # 같은 층위이거나 더 위의 헤딩을 만나면 절이 끝난다.
        if m and len(m.group(1)) <= level:
            dropping = False
        else:
            continue
    out.append(line)

text = "\n".join(out)
if target == "trace":
    # `T3` · `T3·T7` · `(T1)` 꼴의 인용을 통째로 걷어낸다.
    text = re.sub(r"\(?\bT\d+(?:[·,]\s*T\d+)*\)?", "", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
print(text)
PY
  if [ $? -ne 0 ]; then err "절제 실패"; exit 1; fi
  GUIDE_BODY="$(cat "$TMP_DIR/body.md")"
else
  GUIDE_BODY="$(cat "$GUIDE_FILE")"
fi

# ────────────────────────── 프롬프트 ──────────────────────────

SYSTEM_PROMPT='너는 이 주제를 처음 배우는 학습자 역할로 폐쇄형 독해 시험을 치른다. 동시에 그 시험을 채점하는 감독관이기도 하다. 한국어로 답한다.'

read -r -d '' USER_HEAD <<'EOF' || true
아래 === GUIDE === 이후의 학습 가이드 본문을 읽고, **7개 질문 V1~V7** 에 답해라.

## 절대 규칙 (어기면 이 시험은 무효다)

1. **본문만 근거로 삼는다.** 저장소의 다른 파일도, 네가 이미 아는 지식도 쓰지 마라.
   본문에 없으면 "없다"가 정답이다.
2. **근거는 본문에서 원문 그대로 인용한다.** 요약하거나 바꿔 쓰지 마라.
3. 근거를 못 찾으면 그 항목의 판정은 **`근거 없음`** 이다. 추측으로 채우지 마라.
4. 인용한 대목이 **결론만** 담고 있고 그 결론에 이르는 과정·값·반례가 없으면
   판정은 **`결론만 있음`** 이다. 이것은 통과가 아니다.
   예: "따라서 O(n log n) 이다" 만 있고 그 수를 어떻게 세었는지가 없으면 `결론만 있음`.

**V1 의 답을 V2 에 재사용하지 마라.** V1 은 "아무 기법도 없이 하면 어떻게 되는가"이고,
V2 는 "그 목표에 닿는 다른 방법들 중 왜 하필 이것인가"다. 서로 다른 물음이다.

## 질문 일곱

- **V1** 이 문제를 아무 기법 없이 푸는 **가장 단순한 방법**은 무엇이고, 그것이 무너지는
  지점이 **수치로** 제시돼 있는가? (몇 개의 입력에서 몇 번의 연산이 되는가)
- **V2** 같은 목표를 노리는 **다른 절차**가 **실명으로** 제시되고, 왜 이 알고리즘이 이기는지가
  **같은 입력의 수치로** 대조돼 있는가?
- **V3** 이 알고리즘이 **왜 항상 옳은지** 논증의 각 단계를 재구성할 수 있는가?
  **엣지 케이스**(빈 입력·크기 1~2·경계값)의 처리도 적혀 있는가?
- **V4** 독자가 빠지기 쉬운 **오해**가 제시되고, 그것이 거짓임이 **반례**로 보여지는가?
  (반례에 구체 입력과, 오해가 낸 답·옳은 답이 둘 다 있는가)
- **V5** 코드의 순서나 조건을 **한 곳 바꿨을 때** 나오는 **잘못된 결과값**이 제시돼 있는가?
  ("틀린다"는 부족하다 — 실제 값이 있어야 한다)
- **V6** **고정 입력 하나** 위에서 전개를 재현할 수 있는가? 각 단계의 상태값이 있고,
  **분기 조건의 참/거짓이 실제 값으로** 밝혀져 있고, 코드의 **모든 분기가 최소 1회** 나오는가?
  주의: 선언형 데이터 배열(`export const … = [...]` 꼴)은 전개로 인정하지 않는다.
  값의 나열은 해설이 아니다.
- **V7** **최악의 경우와 통상적인 경우**의 비용을 각각 **어떤 근거로 세는지** 말할 수 있는가?
  경계의 종류(상한인지 타이트한 값인지)와 보장의 종류(최악 보장인지 기대값인지)가 구분돼 있는가?

## 출력 형식 (이 형식을 정확히 지켜라)

각 질문마다 아래 두 줄을 낸다. 판정은 네 낱말 중 하나다 — `PASS` · `FAIL` · `근거 없음` · `결론만 있음`.

```
[V1] PASS
> 인용: "본문에서 그대로 옮긴 대목"
```

일곱을 다 낸 뒤, 마지막 줄에 종합을 낸다. **일곱이 전부 PASS 일 때만 PASS 다.**

```
VERDICT: PASS
```

=== GUIDE ===
EOF

COMBINED_PROMPT="${SYSTEM_PROMPT}

${USER_HEAD}
${GUIDE_BODY}"

# ────────────────────────── 모델 호출 ──────────────────────────
#
# codex·agy 를 병렬로, 둘 다 무응답일 때만 haiku 를 순차로. 쿼터를 아끼려는 배치이고
# 구 스크립트(:217-218)의 판단을 그대로 물려받았다.

CODEX_OUT="$TMP_DIR/codex.out"; CODEX_LOG="$TMP_DIR/codex.log"; CODEX_ERR="$TMP_DIR/codex.err"
AGY_OUT="$TMP_DIR/agy.out";     AGY_ERR="$TMP_DIR/agy.err"
HAIKU_OUT="$TMP_DIR/haiku.out"; HAIKU_ERR="$TMP_DIR/haiku.err"
: >"$CODEX_OUT"; : >"$AGY_OUT"; : >"$HAIKU_OUT"
: >"$CODEX_ERR"; : >"$AGY_ERR"; : >"$HAIKU_ERR"

call_codex() {
  command -v codex >/dev/null 2>&1 || { printf 'codex 미설치 — 건너뜁니다.\n' >"$CODEX_ERR"; return 0; }
  local model_args=()
  [ -n "$CODEX_MODEL" ] && model_args=(-m "$CODEX_MODEL")
  # 폐쇄형 시험의 전제: 모델이 저장소 파일을 못 읽어야 "본문만 근거" 가 성립한다.
  # 작업 루트를 임시 디렉터리로 고정하고 읽기 전용 샌드박스로 묶는다.
  # API 키는 이 서브셸 한정으로 없앤다 — ChatGPT 로그인만 쓰게 한다.
  unset OPENAI_API_KEY
  if ! printf '%s' "$COMBINED_PROMPT" | run_limited codex exec \
        --skip-git-repo-check -s read-only --color never \
        -C "$TMP_DIR" -o "$CODEX_OUT" "${model_args[@]+"${model_args[@]}"}" - \
        >"$CODEX_LOG" 2>&1; then
    {
      printf 'codex 실행 실패 — 사용량 한도이거나 인증 만료일 수 있습니다.\n'
      grep -aiE 'ERROR:|usage limit|unauthorized|log in again' "$CODEX_LOG" 2>/dev/null \
        | awk '!seen[$0]++' | tail -n 4
    } >"$CODEX_ERR"
    : >"$CODEX_OUT"
  fi
}

call_agy() {
  command -v agy >/dev/null 2>&1 || { printf 'agy 미설치 — 건너뜁니다.\n' >"$AGY_ERR"; return 0; }
  local model_args=()
  [ -n "$AGY_MODEL" ] && model_args=(-m "$AGY_MODEL")
  run_limited agy -p "$COMBINED_PROMPT" "${model_args[@]+"${model_args[@]}"}" \
    </dev/null >"$AGY_OUT" 2>"$AGY_ERR"
  local rc=$?
  if [ "$rc" -ne 0 ] || grep -qiE 'quota reached|Authentication required' "$AGY_OUT" 2>/dev/null; then
    cat "$AGY_OUT" >>"$AGY_ERR" 2>/dev/null
    # 사유가 하나도 안 남으면 보고서에 "무응답" 만 뜨고 왜인지가 사라진다.
    [ -s "$AGY_ERR" ] || printf 'agy 실행 실패(rc=%s) — 할당량 초과이거나 인증 필요일 수 있습니다.\n' "$rc" >"$AGY_ERR"
    : >"$AGY_OUT"
  fi
}

call_haiku() {
  command -v claude >/dev/null 2>&1 || { printf 'claude CLI 미설치 — 건너뜁니다.\n' >"$HAIKU_ERR"; return 0; }
  if ! printf '%s' "$COMBINED_PROMPT" | run_limited claude -p --model haiku \
        >"$HAIKU_OUT" 2>"$HAIKU_ERR"; then
    printf '\nhaiku 실행 실패.\n' >>"$HAIKU_ERR"
    : >"$HAIKU_OUT"
  fi
}

call_codex & PID_CODEX=$!
call_agy   & PID_AGY=$!
wait "$PID_CODEX" "$PID_AGY"

PROVISIONAL=0
if [ ! -s "$CODEX_OUT" ] && [ ! -s "$AGY_OUT" ]; then
  err "[fallback] codex·agy 무응답 — haiku 단독으로 판정합니다(잠정)."
  call_haiku
  [ -s "$HAIKU_OUT" ] && PROVISIONAL=1
fi

# ────────────────────────── 판정 ──────────────────────────

python3 - "$VERDICT_FILE" "$GUIDE_FILE" "$ROUND" "$ABLATE" "$PROVISIONAL" \
         "$CODEX_OUT" "$AGY_OUT" "$HAIKU_OUT" \
         "$CODEX_ERR" "$AGY_ERR" "$HAIKU_ERR" <<'PY'
import re, sys, pathlib

(verdict_file, guide, rnd, ablate, provisional,
 codex_out, agy_out, haiku_out, codex_err, agy_err, haiku_err) = sys.argv[1:12]

VS = [f"V{i}" for i in range(1, 8)]
OK = "PASS"
LINE = re.compile(r"^\s*\[(V[1-7])\]\s*(PASS|FAIL|근거 없음|결론만 있음)", re.M)

def read(p):
    try:
        return pathlib.Path(p).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""

models = [("codex", codex_out, codex_err),
          ("agy", agy_out, agy_err),
          ("haiku", haiku_out, haiku_err)]

responded, per_model = [], {}
for name, out, _ in models:
    text = read(out).strip()
    if not text:
        continue
    found = dict(LINE.findall(text))
    # 형식을 안 지킨 응답은 "응답 없음" 이 아니라 **미통과** 다. 통과는 명시적이어야 한다.
    per_model[name] = {v: found.get(v, "형식 미준수") for v in VS}
    responded.append(name)

if not responded:
    reasons = []
    for name, _, errp in models:
        e = read(errp).strip()
        if e:
            reasons.append(f"  [{name}] " + e.splitlines()[0])
    body = ["# 이해 시험 — 미실행", "",
            f"- 대상: `{guide}`", f"- 회차: {rnd}",
            f"- 절제: {ablate or '없음'}", "",
            "**어느 모델도 응답하지 않았다.** 미실행은 통과가 아니고, V번호 카운터에도",
            "넣지 않는다(같은 항목 2회 연속 실패로 세지 않는다). 배치를 멈춘다.", ""]
    body += reasons or ["  (사유 출력 없음)"]
    pathlib.Path(verdict_file).write_text("\n".join(body) + "\n", encoding="utf-8")
    print("\n".join(body))
    print(f"\n→ 원문: {verdict_file}")
    sys.exit(2)

# AND 결합 — 응답한 모델 **전부** 가 PASS 여야 그 V 가 통과다.
combined, failed = {}, []
for v in VS:
    judgments = {m: per_model[m][v] for m in responded}
    passed = all(j == OK for j in judgments.values())
    combined[v] = (passed, judgments)
    if not passed:
        failed.append(v)

head = ["# 이해 시험 V1~V7", "",
        f"- 대상: `{guide}`", f"- 회차: {rnd}",
        f"- 절제: {ablate or '없음'}",
        f"- 응답 모델: {', '.join(responded)} (결합 = AND)",
        f"- 판정: {'통과' if not failed else '미통과 — ' + ', '.join(failed)}"]
if provisional == "1":
    head.append("- **잠정** — haiku 단독 판정이다. codex 복구 후 재판정 대상에 등록한다.")
head += ["", "| # | 판정 | " + " | ".join(responded) + " |",
         "| --- | --- | " + " | ".join("---" for _ in responded) + " |"]
for v in VS:
    passed, judgments = combined[v]
    head.append(f"| {v} | {'통과' if passed else '미통과'} | "
                + " | ".join(judgments[m] for m in responded) + " |")

head += ["", "---", "", "## 모델 응답 원문", ""]
for name, out, errp in models:
    text = read(out).strip()
    if not text:
        e = read(errp).strip()
        if e:
            head += [f"### {name} — 무응답", "", "```", e, "```", ""]
        continue
    head += [f"### {name}", "", "```", text, "```", ""]

pathlib.Path(verdict_file).write_text("\n".join(head) + "\n", encoding="utf-8")
print("\n".join(head[:len(VS) + 12]))
print(f"\n→ 원문: {verdict_file}")
sys.exit(3 if failed else 0)
PY
