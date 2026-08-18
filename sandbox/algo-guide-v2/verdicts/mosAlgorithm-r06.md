# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 6
- 절제: 없음
- 응답 모델: haiku (결합 = AND)
- 판정: 미통과 — V2
- **잠정** — haiku 단독 판정이다. codex 복구 후 재판정 대상에 등록한다.

| # | 판정 | haiku |
| --- | --- | --- |
| V1 | 통과 | PASS |
| V2 | 미통과 | FAIL |
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 37h59m24s.
```

### haiku

```
각 질문을 본문 기준으로 검토합니다.

---

```
[V1] PASS
> 인용: "질의마다 그 구간을 처음부터 다시 훑어 집합에 넣는다. 구간 하나가 최대 n 칸이니 이렇게 쌓인다... 질의 하나에 최대 n 칸  →  q × n = 10^4 × 10^4 = 100,000,000 칸"
```

```
[V2] FAIL
> 인용: "같은 입력(n = 400, q = 200, 고정 시드)에 둘을 걸고 기본 연산 횟수를 셌다... | Mo (블록 + r) | 포인터 이동 칸 | 6,895 | | 펜윅 트리 | 트리 노드 방문 | 4,850 | **이 문제에서는 펜윅이 이긴다.** 1.4배 적다."
> 근거: 수치 대조는 있으나, 결과가 Mo 알고리즘이 "이기는" 것이 아니라 펜윅이 이기는 것으로 표시됨.
```

```
[V3] PASS
> 인용: "창이 비어 있을 때(curL = 0, curR = -1) 맵도 비어 있고 distinct = 0 이라 성립한다. 그 뒤 창은 한 칸씩만 바뀌고, 한 칸이 바뀔 때 add 나 remove 가 정확히 한 번 불린다... 매 칸 이동 뒤에도 두 문장이 유지된다." + 엣지 케이스 표 제시
```

```
[V4] PASS
> 인용: "**오해: '서로 다른 개수를 세는 거니까 Set 하나면 된다... 좁히는 쪽에서 무너진다. Set.delete(v) 는 창에 v 가 아직 남아 있는지를 모른다.'** arr = [1 1 2 1 3] ... 창 [1,2] = [1 2]  Set = {2}  size 1  ✗  (답은 2)"
```

```
[V5] PASS
> 인용: "add 의 조건 한 줄만 지워 보자... `if (next === 1)` 을 지웠다... mosAlgorithm([1,1,2,1,3], [[0,4],[0,2],[2,4],[1,3]]) 을 돌리면 이렇게 나온다... 바른 코드   [3, 2, 3, 2] / 조건 지움   [6, 3, 6, 4]"
```

```
[V6] PASS
> 인용: "mosAlgorithm([1, 1, 2, 1, 3], [[0,4], [0,2], [2,4], [1,3]]) 를 끝까지 따라간다. n = 5 이므로 block = ⌊√5⌋ = 2 다." + T1~T13 표에서 각 단계의 상태값(창·distinct), 분기 조건 판정(참/거짓·①②), 모든 분기 최소 1회 등장
```

```
[V7] PASS
> 인용: "| **최악의 경우** | O((n+q)√n) | Θ((n+q)√n) — 이동 상한을 실제로 채우는 질의 집합이 있다 | | **평균적인 경우** | O((n+q)√n) | 같다 — 분포와 무관하게 같은 계급이다" + "창 이동 상한은 **최악 보장**이지만, 셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)**이다"
```

```
VERDICT: FAIL
```
```

