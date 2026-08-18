# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 2
- 절제: trace
- 응답 모델: haiku (결합 = AND)
- 판정: 미통과 — V6
- **잠정** — haiku 단독 판정이다. codex 복구 후 재판정 대상에 등록한다.

| # | 판정 | haiku |
| --- | --- | --- |
| V1 | 통과 | PASS |
| V2 | 통과 | PASS |
| V3 | 통과 | PASS |
| V4 | 통과 | PASS |
| V5 | 통과 | PASS |
| V6 | 미통과 | 근거 없음 |
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 37h50m21s.
```

### haiku

```
```
[V1] PASS
> 인용: "질의마다 그 구간을 처음부터 다시 훑어 집합에 넣는다. 구간 하나가 최대 n 칸이니 이렇게 쌓인다. 질의 하나에 최대 n 칸 → q × n = 10^4 × 10^4 = 100,000,000 칸"
```

```
[V2] PASS
> 인용: "같은 목표를 노리는 **완전히 다른 절차**가 있다 — **오프라인 + 펜윅 트리(BIT)**다" 및 동일 입력(n=400, q=200)에서 "Mo 는 포인터가 움직인 칸 수 | 6,895", "**펜윅 트리** | 트리 노드 방문 | **4,850**"
```

```
[V3] PASS
> 인용: 논증 부분 "창이 비어 있을 때(curL = 0, curR = -1) 맵도 비어 있고 distinct = 0 이라 성립한다. 그 뒤 창은 **한 칸씩만** 바뀌고, 한 칸이 바뀔 때 add 나 remove 가 정확히 한 번 불린다" 및 엣지 케이스 표 "질의 0개 | 첫 줄에서 바로 반환 | `[]`" 외 4가지
```

```
[V4] PASS
> 인용: "arr = [1 1 2 1 3], 창 [0,2] = [1 1 2] Set = {1, 2} size 2 ✓ / curL 을 1 로 좁힌다 → arr[0]=1 을 delete / 창 [1,2] = [1 2] Set = {2} size 1 ✗ (답은 2)" 및 "count 맵 [3, 2, 3, 2] ← 정답 / Set [3, 2, 2, 1] ← 뒤 두 개가 틀렸다"
```

```
[V5] PASS
> 인용: "const add = (value: number): void => { const next = (count.get(value) ?? 0) + 1; count.set(value, next); distinct++; // ← `if (next === 1)` 을 지웠다 };" 및 "`mosAlgorithm([1,1,2,1,3], [[0,4],[0,2],[2,4],[1,3]])` 을 돌리면 이렇게 나온다. 바른 코드 [3, 2, 3, 2] / 조건 지움 [6, 3, 6, 4]"
```

```
[V6] 근거 없음
> 본문에 "한 입력으로 끝까지 굴려 보기"라는 섹션 제목은 있으나, 고정 입력 하나에서 모든 단계를 전개한 구체적 내용(각 단계의 count 맵·distinct·curL·curR 상태값, 분기 조건의 참/거짓 실제값, 모든 분기 1회 이상 출현)이 명시되어 있지 않다. block 계산·정렬 예시만 부분적으로 제시된다.
```

```
[V7] PASS
> 인용: "한 번의 호출이 하는 일은 셋이고, 셋을 다 더해야 총식이 된다. **질의 정렬** — q 개를 정렬한다. O(q log q). **창 이동** — 일반의 상한은 qB + (n/B)n 이고, B = √n 에서 O((n + q)√n) 이다. **셈 갱신** — 창이 한 칸 움직일 때마다 해시 맵을 한 번 두드린다" 및 표 "**최악의 경우** | O((n+q)√n) | Θ((n+q)√n)" 와 "**평균적인 경우** | O((n+q)√n) | 같다" 및 "창 이동 상한은 **최악 보장**이지만, 셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)**"
```

```
VERDICT: FAIL
```

V6에서 근거가 없습니다. 본문에는 "한 입력으로 끝까지 굴려 보기"라는 제목만 있고, 실제로는 고정 입력 하나를 완전히 전개하며 모든 단계의 상태값, 분기 조건의 참/거짓, 모든 코드 분기의 출현을 보여주는 내용이 없습니다. Block 계산과 정렬 예시는 부분적으로만 제시됩니다.
```

