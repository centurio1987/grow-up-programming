#!/usr/bin/env bash
#
# `comprehension.sh` 자기시험 — 외부 모델을 부르지 않는다.
#
# 판정기의 실패 모드는 **조용하다.** 응답을 못 받았는데 통과로 읽거나, 형식을 안 지킨
# 응답을 통과로 읽거나, 두 모델이 갈렸는데 한쪽만 보고 통과로 읽는 것 — 셋 다 화면에는
# "통과" 로 뜬다. 그래서 여섯 경로를 스텁으로 고정해 둔다.
#
#   bash tools/comprehension.selftest.sh
#
# 종료코드: 0 전부 통과 · 1 하나라도 어긋남

set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

STUB="$WORK/bin"; mkdir -p "$STUB"
GUIDE="$WORK/selftest-guide.md"
FAIL=0
N=0        # 검사 항목 수 — 손으로 세면 어긋난다

pass_body() {
  cat <<'EOF'
[V1] PASS
> 인용: "n=10^5 이면 10^10 번"
[V2] PASS
> 인용: "병합 정렬은 같은 입력에서 비교 172회"
[V3] PASS
> 인용: "빈 입력은 즉시 반환한다"
[V4] PASS
> 인용: "[5,5,5] 에서 오해는 3 을, 옳은 답은 1 을 낸다"
[V5] PASS
> 인용: "i++ 를 빼면 [1,3,2] 가 나온다"
[V6] PASS
> 인용: "l=2, r=5 라 l < r 이 참"
[V7] PASS
> 인용: "안쪽 루프가 n번, 바깥이 log n번"
VERDICT: PASS
EOF
}

cat >"$GUIDE" <<'EOF'
# 자기시험용 가이드

## 전체 컨셉
컨셉 문단.

## 한 입력으로 끝까지 굴려 보기
- `T1` 시작한다.
- `T2` 비교한다.

## 비용 계산

### 비용을 세는 과정
T1 에서 한 번, T2 에서 두 번 센다(T1·T2).

## 스스로 점검하기
(T2) 를 다시 보라.
EOF

# ── 스텁 ──
silent()  { printf '#!/bin/sh\nexit 1\n' >"$STUB/$1"; chmod +x "$STUB/$1"; }
stdout_of() { printf '#!/bin/sh\ncat %s\n' "$2" >"$STUB/$1"; chmod +x "$STUB/$1"; }
codex_of() {
  cat >"$STUB/codex" <<STUBEOF
#!/bin/sh
out=""
while [ \$# -gt 0 ]; do
  case "\$1" in -o) out="\$2"; shift 2 ;; *) shift ;; esac
done
cat "$1" > "\$out"
STUBEOF
  chmod +x "$STUB/codex"
}

pass_body >"$WORK/pass.txt"
sed 's/^\[V4\] PASS/[V4] 결론만 있음/' "$WORK/pass.txt" >"$WORK/partial.txt"
sed 's/^\[V2\] PASS/[V2] 한쪽만 있음/' "$WORK/pass.txt" >"$WORK/onesided.txt"
printf '네, 좋은 가이드입니다. 통과입니다.\n' >"$WORK/formless.txt"

round=1
run_case() { # <이름> <기대 종료코드> [추가 인자…]
  local name="$1" want="$2"; shift 2
  N=$((N + 1))
  local out="$WORK/out.$round"
  COMPREHENSION_VERDICT_DIR="$WORK/verdicts" PATH="$STUB:$PATH" bash "$HERE/comprehension.sh" "$GUIDE" --round "$((900 + round))" "$@" \
    >"$out" 2>&1
  local got=$?
  if [ "$got" -eq "$want" ]; then
    printf '  ok   %-42s exit=%s\n' "$name" "$got"
  else
    printf '  FAIL %-42s exit=%s (기대 %s)\n' "$name" "$got" "$want"
    sed -n '1,12p' "$out" | sed 's/^/       /'
    FAIL=1
  fi
  round=$((round + 1))
}

grep_case() { # <이름> <파일패턴> — 직전 출력에서 문구를 찾는다
  local name="$1" pattern="$2" out="$WORK/out.$((round - 1))"
  N=$((N + 1))
  if grep -qE "$pattern" "$out"; then
    printf '  ok   %-42s "%s"\n' "$name" "$pattern"
  else
    printf '  FAIL %-42s "%s" 없음\n' "$name" "$pattern"
    FAIL=1
  fi
}

printf '\n comprehension.sh 자기시험\n\n'

silent codex; silent agy; silent claude
run_case "전 모델 무응답 → 미실행" 2
grep_case "  사유 셋이 남는다" '\[codex\].*\n?|\[agy\]|\[sonnet\]'

silent codex; stdout_of agy "$WORK/pass.txt"; silent claude
run_case "단독 응답 전부 PASS → 통과" 0

codex_of "$WORK/pass.txt"; stdout_of agy "$WORK/partial.txt"; silent claude
run_case "두 모델이 갈리면 AND 로 미통과" 3
grep_case "  갈린 항목이 표에 남는다" '^\| V4 \| 미통과'

silent codex; silent agy; stdout_of claude "$WORK/pass.txt"
run_case "폴백(sonnet) 단독 → 통과하되 잠정" 0
grep_case "  잠정 표기가 붙는다" '\*\*잠정\*\*'

silent codex; silent agy; stdout_of claude "$WORK/formless.txt"
run_case "형식 미준수 → 미통과(통과는 명시적)" 3
grep_case "  일곱 전부 형식 미준수" '\| V1 \| 미통과 \| 형식 미준수'

silent codex; silent agy; stdout_of claude "$WORK/onesided.txt"
run_case "대가 없는 우열 단정 → 미통과" 3
grep_case "  '한쪽만 있음' 이 표에 남는다" '^\| V2 \| 미통과 \| 한쪽만 있음'

silent codex; silent agy; stdout_of claude "$WORK/pass.txt"
run_case "절제 실행 — trace" 0 --ablate trace
grep_case "  절제가 보고서에 남는다" '절제: trace'

# ── V2 물음이 승자 프레임으로 되돌아가지 않았는가 (결재 5 · 2026-08-20) ──
#
# 자기시험의 나머지는 **응답 파싱**을 보지만 V2 의 실패는 파싱이 아니라 **물음 자체**에서
# 났다. "왜 이 알고리즘이 이기는지" 를 물으면 어느 축에서도 수치로 못 이기는 편은 정직하게
# 쓸수록 떨어지고(mosAlgorithm r10~r12), 통과하려면 자기가 이기는 입력을 고르게 된다.
# 문구가 되돌아가면 그 실패가 그대로 돌아오므로 문구를 여기서 고정한다.
V2_BLOCK="$(sed -n '/^- \*\*V2\*\*/,/^- \*\*V3\*\*/p' "$HERE/comprehension.sh")"
v2_case() { # <이름> <yes|no: 있어야 하는가> <패턴>
  local name="$1" want="$2" pat="$3" got
  N=$((N + 1))
  if printf '%s' "$V2_BLOCK" | grep -qE "$pat"; then got=yes; else got=no; fi
  if [ "$got" = "$want" ]; then
    printf '  ok   %-42s %s "%s"\n' "$name" "$want" "$pat"
  else
    printf '  FAIL %-42s %s 를 기대했는데 %s\n' "$name" "$want" "$got"
    FAIL=1
  fi
}
v2_case "V2 는 양방향을 요구한다" yes '무엇을 얻고 무엇을 잃는지'
v2_case "V2 는 져도 통과라고 못 박는다" yes '져도 통과'
v2_case "V2 는 우열을 묻지 않는다" no '이기는지'

# 절제가 인용까지 지우는지 — 스크립트를 안 거치고 같은 로직을 직접 확인한다.
ABLATED="$(PATH="$STUB:$PATH" bash -c "
  cd '$ROOT' && python3 - '$GUIDE' trace <<'PY'
import re, sys
path, target = sys.argv[1], sys.argv[2]
lines = open(path, encoding='utf-8').read().split('\n')
level, heading = 2, '## 한 입력으로 끝까지 굴려 보기'
out, dropping = [], False
for line in lines:
    if line.strip() == heading:
        dropping = True; continue
    if dropping:
        m = re.match(r'^(#{1,6}) ', line)
        if m and len(m.group(1)) <= level: dropping = False
        else: continue
    out.append(line)
text = '\n'.join(out)
text = re.sub(r'\(?\bT\d+(?:[·,]\s*T\d+)*\)?', '', text)
print(text)
PY
")"
N=$((N + 1))
if printf '%s' "$ABLATED" | grep -qE '\bT[0-9]'; then
  printf '  FAIL %-42s 절제 사본에 T# 인용이 남았다\n' "절제는 인용도 함께 지운다"
  FAIL=1
else
  printf '  ok   %-42s 절 + T# 인용이 함께 사라진다\n' "절제는 인용도 함께 지운다"
fi

# ── 회차 자동 산정이 빈 번호를 줍지 않는가 (2026-08-28) ──
#
# 회차는 **이력의 순서**를 진다. 옛 로직은 1 부터 올라가며 첫 빈 자리를 잡아서, 중간이
# 비어 있으면 나중 판정이 앞선 판정보다 작은 번호를 받았다 — `mosAlgorithm` 이
# `r01`·`r06`~`r13` 을 가진 상태에서 열넷째 판정이 `r02` 로 떨어졌다(실측). 빈 번호는
# 「그 회차가 없었다」는 사실이라 메우지 않는다.
GAP_DIR="$WORK/gap-verdicts"; mkdir -p "$GAP_DIR"
: >"$GAP_DIR/selftest-r01.md"
: >"$GAP_DIR/selftest-r06.md"
silent codex; stdout_of agy "$WORK/pass.txt"; silent claude
COMPREHENSION_VERDICT_DIR="$GAP_DIR" PATH="$STUB:$PATH" \
  bash "$HERE/comprehension.sh" "$GUIDE" >"$WORK/out.gap" 2>&1
N=$((N + 1))
if [ -e "$GAP_DIR/selftest-r07.md" ] && [ ! -s "$GAP_DIR/selftest-r02.md" ]; then
  printf '  ok   %-42s r01·r06 뒤는 r07 이다\n' "회차는 빈 번호를 줍지 않는다"
else
  printf '  FAIL %-42s 만들어진 것: %s\n' "회차는 빈 번호를 줍지 않는다" \
    "$(ls "$GAP_DIR" | tr '\n' ' ')"
  FAIL=1
fi

printf '\n'
if [ "$FAIL" -eq 0 ]; then
  printf ' 자기시험 통과 — %s항목\n\n' "$N"
else
  printf ' 자기시험 실패\n\n'
fi
exit "$FAIL"
