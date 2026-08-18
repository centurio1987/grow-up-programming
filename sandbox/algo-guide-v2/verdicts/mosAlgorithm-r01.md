# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 1
- 절제: 없음
- 응답 모델: haiku (결합 = AND)
- 판정: 통과
- **잠정** — haiku 단독 판정이다. codex 복구 후 재판정 대상에 등록한다.

| # | 판정 | haiku |
| --- | --- | --- |
| V1 | 통과 | PASS |
| V2 | 통과 | PASS |
| V3 | 통과 | PASS |
| V4 | 통과 | PASS |
| V5 | 통과 | PASS |
| V6 | 통과 | PASS |
| V7 | 통과 | PASS |

---

## 모델 응답 원문

### codex — 무응답

```
codex 실행 실패 — 사용량 한도이거나 인증 만료일 수 있습니다.
ERROR: You've hit your usage limit. Upgrade to Plus to continue using Codex (https://chatgpt.com/explore/plus), or try again at Sep 14th, 2026 4:36 PM.
```

### agy — 무응답

```
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 38h16m17s.
```

### haiku

```
[V1] PASS
> 인용: "질의마다 그 구간을 처음부터 다시 훑어 집합에 넣는다. 구간 하나가 최대 `n` 칸이니 이렇게 쌓인다. 질의 하나에 최대 n 칸 → q × n = 10^4 × 10^4 = 100,000,000 칸"

[V2] PASS
> 인용: "같은 입력(`n = 400`, `q = 200`, 고정 시드)에 넷을 걸고 **포인터가 움직인 칸 수**를 셌다. [표] **블록 + r** (Mo) | 6,895 | 1.00배, `l` 만 정렬 | 18,609 | 2.70배, `r` 만 정렬 | 18,545 | 2.69배"

[V3] PASS
> 인용: "논증. 창이 비어 있을 때(`curL = 0`, `curR = -1`) 맵도 비어 있고 `distinct = 0` 이라 성립한다. 그 뒤 창은 **한 칸씩만** 바뀌고, 한 칸이 바뀔 때 `add` 나 `remove` 가 정확히 한 번 불린다." + 엣지 케이스 테이블에서 "질의 0개 | 첫 줄에서 바로 반환 | [], l = r | 창이 한 칸. add 한 번 | 항상 1, n = 1 | block = max(1, ⌊√1⌋) = 1 | 0으로 나누는 일이 없다"

[V4] PASS
> 인용: "오해: '왼쪽 끝으로 정렬하면 충분하다'. … 같은 입력에서 포인터 이동 칸 수는 **`l` 만 정렬 18,609칸, 블록+`r` 정렬 6,895칸**이다. 오해를 따르면 **2.7배** 더 움직인다."

[V5] PASS
> 인용: "코드의 조건 `if (next === 1)` 을 지웠다. … 바른 코드 [3, 2, 3, 2], 조건 지움 [6, 3, 6, 4] ← 전부 부풀었다"

[V6] PASS
> 인용: "`mosAlgorithm([1, 1, 2, 1, 3], [[0,4], [0,2], [2,4], [1,3]])` 를 끝까지 따라간다." [상세 테이블에서 T1~T13까지 각 단계의 무슨 일·조건 판정·창·distinct 제시] "①은 T1·T2·T3·T5·T8·T9에서, ②는 T6·T11·T12에서 밟았다."

[V7] PASS
> 인용: "총식 = O(q log q) + O((n + q)√n) + O(이동 칸 수 × 맵 1회)" + "최악의 경우 | O((n+q)√n) | Θ((n+q)√n) — 이동 상한을 실제로 채우는 질의 집합이 있다, 평균적인 경우 | O((n+q)√n) | 같다 — 분포와 무관하게 같은 계급이다" + "위 표의 값은 엄밀히 말해 '해시가 평균대로 동작한다는 가정 아래의 최악' 이다."

---

VERDICT: PASS
```

