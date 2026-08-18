# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 2
- 절제: purpose.alt
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 38h11m31s.
```

### haiku

```
각 질문을 본문 기준으로 검토하겠습니다.

---

[V1] PASS
> 인용: "질의 하나에 최대 n 칸  →  q × n = 10^4 × 10^4 = 100,000,000 칸"

---

[V2] PASS
> 인용: "같은 입력에서 **43,409칸**이다. 블록+`r` 정렬(6,895칸)의 **6.3배**다."
> (다른 절차: 정렬하지 않고 창 옮기기만 함 vs Mo's 알고리즘 / 입력: `[1, 1, 2, 1, 3]` + 4개 질의)

---

[V3] PASS
> 인용: "창이 비어 있을 때(`curL = 0`, `curR = -1`) 맵도 비어 있고 `distinct = 0` 이라 성립한다. 그 뒤 창은 **한 칸씩만** 바뀌고, 한 칸이 바뀔 때 `add` 나 `remove` 가 정확히 한 번 불린다... 그러니 매 칸 이동 뒤에도 두 문장이 유지된다."
> (엣지 케이스: 표로 질의 0개, l=r, 모든 값 같음, n=1 처리 명시)

---

[V4] PASS
> 인용: "**오해: "왼쪽 끝으로 정렬하면 충분하다."** ... `n = 9`, 질의 `[0,8] [0,1] [1,7] [1,2] [2,8]` ... l 만 정렬   r: 8 → 1 → 7 → 2 → 8   이동 35칸 / 블록+r ... 이동 13칙"

---

[V5] PASS
> 인용: "`if (next === 1)` 을 지웠다" 조건 제거 후 "바른 코드 [3, 2, 3, 2] / 조건 지움 [6, 3, 6, 4]"

---

[V6] PASS
> 인용: 표에서 T1~T13 각 단계마다 "무슨 일 | 조건 판정 | 창·distinct" 기록. "T2 | 오른쪽 넓힘 | `curR = 0 < 2` 참 → ① | `[1 1]` · 1 (1이 두 번째라 안 는다)" 등 조건 참/거짓 실제값 명시. `①`(넓히기) T1·T2·T3·T5·T8·T9, `②`(좁히기) T6·T11·T12 모두 나옴.

---

[V7] PASS
> 인용: "총식 = O(q log q) + O((n + q)√n) + O(이동 칸 수 × 맵 1회)" / 경계: "**상한 `O` | 타이트 `Θ`**" 표 명시 / 보장: "창 이동 상한은 **최악 보장**이지만, 셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)**"

---

```
VERDICT: PASS
```
```

