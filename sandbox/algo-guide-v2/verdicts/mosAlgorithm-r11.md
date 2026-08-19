# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/mosAlgorithm/mosAlgorithm-guide.md`
- 회차: 11
- 절제: 없음
- 응답 모델: sonnet (결합 = AND)
- 판정: 미통과 — V2
- **잠정** — sonnet 단독 판정이다. codex 복구 후 재판정 대상에 등록한다.

| # | 판정 | sonnet |
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 18h53m39s.
```

### sonnet

```
본문 기준으로 V1~V7 판정한 결과, V2에서 근거가 요구 사항과 반대 방향이라 전체 판정은 FAIL입니다.

[V1] PASS
> 인용: "질의 하나에 최대 n 칸  →  q × n = 10^4 × 10^4 = 100,000,000 칸"

[V2] FAIL
> 인용: "**이 문제에서는 펜윅이 이긴다.** 1.4배 적다."
펜윅 트리가 실명으로 제시되고 같은 입력(`n=400, q=200`)의 수치 대조(6,895 vs 4,850)도 있지만, 그 수치가 보여주는 것은 "이 알고리즘이 이긴다"가 아니라 정반대(펜윅이 이긴다)입니다. Mo를 택하는 이유(일반성)는 이후 표로 설명되지만 수치 대조가 아니라 정성적(된다/안 된다) 비교입니다. V2가 요구하는 "왜 이 알고리즘이 이기는지가 수치로"는 본문에 없습니다.

[V3] PASS
> 인용: "창이 비어 있을 때(curL = 0, curR = -1) 맵도 비어 있고 distinct = 0 이라 성립한다. 그 뒤 창은 한 칸씩만 바뀌고, 한 칸이 바뀔 때 add 나 remove 가 정확히 한 번 불린다."
엣지 케이스: "| 질의 0개 | 첫 줄에서 바로 반환 | `[]` |" 외 `l=r`, 모든 값 동일, `n=1` 행도 있음.

[V4] PASS
> 인용: "창 [1,2] = [1 2]        Set = {2}           size 1  ✗  (답은 2)"

[V5] PASS
> 인용: "바른 코드   [3, 2, 3, 2]\n조건 지움   [6, 3, 6, 4]      ← 전부 부풀었다"

[V6] PASS
> 인용: "**네 갈래가 모두 나왔다.** `L+`는 T8, `R+`는 T1·T2·T3·T5·T9·T15, `L−`는 T6·T11·T12, `R−`는 T13 이다."
표에 각 단계 조건 판정(`curR = -1 < 2` 참 → R+ 등)이 실제 값으로 있고 네 분기가 모두 등장.

[V7] PASS
> 인용: "창 이동 상한은 **최악 보장**이지만, 셈 갱신에 쓰는 해시 맵의 한 번 두드리기는 **평균 O(1)** 이다."
상한(`O`) vs 타이트(`Θ`) 구분 표도 별도로 있음.

```
VERDICT: FAIL
```
```

