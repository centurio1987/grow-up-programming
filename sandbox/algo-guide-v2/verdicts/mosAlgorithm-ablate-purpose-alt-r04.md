# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 4
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 38h5m56s.
```

### haiku

```
## 독해 시험 채점: Mo's 알고리즘

---

[V1] PASS
> 인용: "질의 하나에 최대 n 칸  →  q × n = 10^4 × 10^4 = 100,000,000 칸"

---

[V2] PASS
> 인용: "다시 세기   비용 = 구간 길이의 합" 과 "창 옮기기   비용 = 창이 움직인 칸 수" 및 표 — "| **100** = √n | **1,000,000** | **1,000,000** | **2,000,000** |" (1억에서 200만으로)

---

[V3] PASS
> 인용: "창이 비어 있을 때(curL = 0, curR = -1) 맵도 비어 있고 distinct = 0 이라 성립한다. 그 뒤 창은 한 칸씩만 바뀌고, 한 칸이 바뀔 때 add 나 remove 가 정확히 한 번 불린다." + 엣지 케이스 표 제시 (질의 0개, l=r, 모든 값 같음, n=1)

---

[V4] PASS
> 인용: 오해 — "서로 다른 개수를 세는 거니까 `Set` 하나면 된다" | 반례: "arr = [1 1 2 1 3] / 창 [0,2] = [1 1 2]  Set = {1, 2}  size 2  ✓ / curL 을 1 로 좁힌다 → arr[0]=1 을 delete / 창 [1,2] = [1 2]  Set = {2}  size 1  ✗  (답은 2)"

---

[V5] PASS
> 인용: 바꾼 조건 — "distinct++;            // ← `if (next === 1)` 을 지웠다" | 입력: "mosAlgorithm([1,1,2,1,3], [[0,4],[0,2],[2,4],[1,3]])" | 결과: "바른 코드   [3, 2, 3, 2] / 조건 지움   [6, 3, 6, 4]"

---

[V6] PASS
> 인용: 입력 "mosAlgorithm([1, 1, 2, 1, 3], [[0,4], [0,2], [2,4], [1,3]])" | 상세 전개 테이블 (T1~T13) 제시 — 각 단계의 창 상태·distinct 값·조건 판정의 참/거짓 명시 | "`①`은 T1·T2·T3·T5·T8·T9에서, `②`는 T6·T11·T12에서 밟았다" (모든 분기 최소 1회) | 반환값 "[3, 2, 3, 2]" 확인

---

[V7] PASS
> 인용: 비용 세는 과정 — "**질의 정렬** — `q` 개를 정렬한다. `O(q \log q)`. / **창 이동** — `O((n + q)\sqrt{n})` / **셈 갱신** — 창이 한 칸 움직일 때마다 해시 맵을 한 번 두드린다" | 경계 구분: "상한 `O((n+q)\sqrt{n})`" vs "타이트 `Θ((n+q)\sqrt{n})`" | 보장 구분: "창 이동 상한은 **최악 보장**" vs "셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)**"

---

```
VERDICT: PASS
```
```

