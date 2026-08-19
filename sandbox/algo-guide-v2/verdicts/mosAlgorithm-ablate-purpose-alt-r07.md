# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 07
- 절제: purpose.alt
- 응답 모델: sonnet (결합 = AND)
- 판정: 미통과 — V2, V6
- **잠정** — sonnet 단독 판정이다. codex 복구 후 재판정 대상에 등록한다.

| # | 판정 | sonnet |
| --- | --- | --- |
| V1 | 통과 | PASS |
| V2 | 미통과 | 근거 없음 |
| V3 | 통과 | PASS |
| V4 | 통과 | PASS |
| V5 | 통과 | PASS |
| V6 | 미통과 | FAIL |
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 25h20m56s.
```

### sonnet

```
판정 결과부터 정리합니다. 전체 PASS는 아닙니다 — V2는 근거 없음, V6은 FAIL입니다.

[V1] PASS
> 인용: "질의 하나에 최대 n 칸  →  q × n = 10^4 × 10^4 = 100,000,000 칸"

[V2] 근거 없음
> 본문에서 "다른 절차"로 대조되는 것은 "다시 세기"(기법 없이 하기)와 "Set" 뿐입니다. "다시 세기"는 알고리즘의 실명이 아니라 무기법 접근의 재서술이고("다시 세기   비용 = 구간 길이의 합       (겹침을 매번 다시 센다)"), "Set" 대안은 V4의 오해 반례로 다뤄질 뿐 "같은 목표를 노리는 다른 절차"로서 이름 붙여 비교되지 않습니다. 세그먼트 트리·펜윅 트리 등 이 목표를 노리는 다른 알고리즘의 실명은 본문 어디에도 없습니다.

[V3] PASS
> 인용: "창이 비어 있을 때(`curL = 0`, `curR = -1`) 맵도 비어 있고 `distinct = 0` 이라 성립한다. 그 뒤 창은 **한 칸씩만** 바뀌고, 한 칸이 바뀔 때 `add` 나 `remove` 가 정확히 한 번 불린다."
> 엣지케이스 표("질의 0개 | 첫 줄에서 바로 반환 | `[]`" 등)도 함께 있어 통과.

[V4] PASS
> 인용: "count 맵  [3, 2, 3, 2]      ← 정답 / Set       [3, 2, 2, 1]      ← 뒤 두 개가 틀렸다"
> 반례 입력 "arr = [1 1 2 1 3]"과 오해의 답·정답이 모두 명시됨.

[V5] PASS
> 인용: "바른 코드   [3, 2, 3, 2] / 조건 지움   [6, 3, 6, 4]      ← 전부 부풀었다"

[V6] FAIL
> 인용(코드의 네 분기): "while (curL > q.l) add(...); // ① 넓히기 — 왼쪽" / "while (curR < q.r) add(...); // ① 넓히기 — 오른쪽" / "while (curL < q.l) remove(...); // ② 좁히기 — 왼쪽" / "while (curR > q.r) remove(...); // ② 좁히기 — 오른쪽"
> 인용(표의 조건 판정 전부): "curR = -1 < 2", "curR = 0 < 2", "curR = 1 < 2" (오른쪽 넓힘) / "curL = 0 < 1"(왼쪽 좁힘) / "curL = 1 > 0"(왼쪽 넓힘) / "curR = 2 < 3"(오른쪽 넓힘) / "curL = 0 < 2", "curL = 1 < 2"(왼쪽 좁힘)
> 정렬 후 r 값이 2→3→4→4로 단조증가하기 때문에 "② 좁히기 — 오른쪽"(`while (curR > q.r) remove(...)`) 분기가 T1~T13 어디에도 등장하지 않습니다. 코드에 존재하는 네 분기 중 하나가 이 전개에서 한 번도 실행되지 않았으므로 "모든 분기가 최소 1회" 조건 위반.

[V7] PASS
> 인용: "창 이동 상한은 **최악 보장**이지만, 셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)** 이다."
> 표에서 "상한 `O`"와 "타이트 `Θ`"도 구분됨: "**최악의 경우** | `O((n+q)\sqrt{n})` | `Θ((n+q)\sqrt{n})` — 이동 상한을 실제로 채우는 질의 집합이 있다"

```
VERDICT: FAIL
```
```

