# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 5
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 38h3m36s.
```

### haiku

```
[V1] PASS
> 인용: "질의마다 그 구간을 처음부터 다시 훑어 집합에 넣는다... 구간 하나가 최대 `n` 칸이니 이렇게 쌓인다... 질의 하나에 최대 n 칸 → q × n = 10^4 × 10^4 = 100,000,000 칸"

[V2] PASS
> 인용(절차1): "1억 칸이다... 1초 제한에 들어간다고 장담할 수 없다"
> 인용(절차3): "n = q = 10^4 이면 10^4·14 ≈ 1.4×10^5 + 2×10^4·100 = 2×10^6"
> (같은 입력 n=q=10^4로 1억 대비 2백만, 약 50배 개선)

[V3] PASS
> 인용(논증): "창이 비어 있을 때(`curL = 0`, `curR = -1`) 맵도 비어 있고 `distinct = 0` 이라 성립한다. 그 뒤 창은 한 칸씩만 바뀌고, 한 칸이 바뀔 때 `add` 나 `remove` 가 정확히 한 번 불린다... 매 칸 이동 뒤에도 두 문장이 유지된다."
> 인용(엣지 케이스): "질의 0개 | 첫 줄에서 바로 반환 | `[]`" 등 4가지 케이스 표로 제시

[V4] PASS
> 인용(오해): "`Set` 하나면 된다. 넓힐 때 `add`, 좁힐 때 `delete`, 답은 `set.size`"
> 인용(반례): "arr = [1 1 2 1 3]... 창 [0,2] = [1 1 2] Set = {1, 2} size 2 ✓... 창 [1,2] = [1 2] Set = {2} size 1 ✗ (답은 2)"

[V5] PASS
> 인용(수정): "`if (next === 1)` 을 지웠다"
> 인용(결과): "`mosAlgorithm([1,1,2,1,3], [[0,4],[0,2],[2,4],[1,3]])` 을 돌리면... 바른 코드 [3, 2, 3, 2]... 조건 지움 [6, 3, 6, 4]"

[V6] PASS
> 인용: "T1 | Q1[0,2] 로 — 오른쪽 넓힘 | `curR = -1 < 2` 참 → ① | `[1]` · 1"
> (이후 T2~T13까지 13단계, 각 단계마다 조건 판정과 상태값 명시)
> 인용(분기): "`①`은 T1·T2·T3·T5·T8·T9에서, `②`는 T6·T11·T12에서 밟았다" (모든 분기 1회 이상)

[V7] PASS
> 인용(세기근거): "질의 정렬 — `q` 개를 정렬한다. `O(q \log q)`... 창 이동 — 일반의 상한은... `qB + (n/B)n` 이고, `B = √n` 에서 `O((n + q)\sqrt{n})` 이다... 셈 갱신 — 창이 한 칸 움직일 때마다 해시 맵을 한 번 두드린다."
> 인용(경계·보장): "**최악의 경우** ... `Θ((n+q)\sqrt{n})`... **평균적인 경우** ... 같다... 창 이동 상한은 **최악 보장**이지만, 셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)**"

VERDICT: PASS
```

