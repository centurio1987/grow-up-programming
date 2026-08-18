# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 9
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 37h52m32s.
```

### haiku

```
## 독해 시험 답지

[V1] PASS
> 인용: "질의마다 그 구간을 처음부터 다시 훑어 집합에 넣는다. 구간 하나가 최대 `n` 칸이니 이렇게 쌓인다. 질의 하나에 최대 n 칸  →  q × n = 10^4 × 10^4 = 100,000,000 칸. 1억 칸이다."

[V2] PASS
> 인용: "같은 목표를 노리는 **완전히 다른 절차**가 있다 — **오프라인 + 펜윅 트리(BIT)**다. ... 같은 입력(`n = 400`, `q = 200`, 고정 시드)에 둘을 걸고 **기본 연산 횟수**를 셌다. | Mo (블록 + `r`) | 포인터 이동 칸 | 6,895 | | **펜윅 트리** | 트리 노드 방문 | **4,850** |"

[V3] PASS
> 인용: "창이 비어 있을 때(`curL = 0`, `curR = -1`) 맵도 비어 있고 `distinct = 0` 이라 성립한다. 그 뒤 창은 **한 칸씩만** 바뀌고, 한 칸이 바뀔 때 `add` 나 `remove` 가 정확히 한 번 불린다. ... 매 칸 이동 뒤에도 두 문장이 유지된다." 및 엣지 케이스 표: "| 질의 0개 | 첫 줄에서 바로 반환 | `[]` | ... | `n = 1` | `block = max(1, ⌊√1⌋) = 1` | 0으로 나누는 일이 없다 |"

[V4] PASS
> 인용: "**오해: "서로 다른 개수를 세는 거니까 `Set` 하나면 된다.** ... arr = [1 1 2 1 3], 창 [0,2] = [1 1 2] Set = {1, 2} size 2 ✓, curL 을 1 로 좁힌다 → arr[0]=1 을 delete, 창 [1,2] = [1 2] Set = {2} size 1 ✗ (답은 2)"

[V5] PASS
> 인용: "`add` 의 조건 **한 줄만** 지워 보자. ... const add = (value: number): void => { const next = (count.get(value) ?? 0) + 1; count.set(value, next); distinct++; }; ... `mosAlgorithm([1,1,2,1,3], [[0,4],[0,2],[2,4],[1,3]])` 을 돌리면 이렇게 나온다. 바른 코드 [3, 2, 3, 2], 조건 지움 [6, 3, 6, 4]"

[V6] PASS
> 인용: "표 T1~T13, T1: 오른쪽 넓힘 | `curR = -1 < 2` 참 → ① | `[1]` · 1, T6: 왼쪽 좁힘 | `curL = 0 < 1` 참 → ② | `[1 2 1]` · 2 ... T1·T2·T3·T5·T8·T9에서, `②`는 T6·T11·T12에서 밟았다."

[V7] PASS
> 인용: "한 번의 호출이 하는 일은 셋이고, 셋을 다 더해야 총식이 된다. - **질의 정렬** — `O(q \log q)`. - **창 이동** — `O((n + q)\sqrt{n})`. - **셈 갱신** — 창이 한 칸 움직일 때마다 해시 맵을 한 번 두드린다." 및 "| | 상한 `O` | 타이트 `Θ` | **최악의 경우** | `O((n+q)\sqrt{n})` | `Θ((n+q)\sqrt{n})` | **평균적인 경우** | `O((n+q)\sqrt{n})` | 같다 | ... **보장의 종류가 하나 섞여 있다.** 창 이동 상한은 **최악 보장**이지만, 셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)** 이다."

---

VERDICT: PASS
```

