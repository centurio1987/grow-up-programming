# 이해 시험 V1~V7

- 대상: `sandbox/algo-guide-v2/pilot/knapsack01/knapsack01-guide.md`
- 회차: 01
- 절제: 없음
- 응답 모델: sonnet (결합 = AND)
- 판정: 통과
- **잠정** — sonnet 단독 판정이다. codex 복구 후 재판정 대상에 등록한다.

| # | 판정 | sonnet |
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
Error: Individual quota reached. Please upgrade your subscription to increase your limits. Resets in 17h50m34s.
```

### sonnet

```
지시된 채점 형식 그대로, 가이드 본문에서 원문을 인용해 7문항을 판정합니다.

[V1] PASS
> 인용: "물건 100개 → 2^100 ≈ 1.27 × 10^30 가지
  1초에 10^9 가지를 본다 해도
  1.27 × 10^21 초 ≈ 4 × 10^13 년   ← 우주 나이보다 길다"

[V2] PASS
> 인용: "같은 입력(n = 50, W = 1000, 무게·가치는 고정 생성식)에 둘을 걸고 **채운 표 칸 수**를 셌다.

| 설계 | 표 칸 |
| --- | --- |
| **무게 축 DP (이 가이드)** | **51,051** |
| 가치 축 DP | 617,552 |

**무게 축이 이긴다. 12.1배 적다.**"

[V3] PASS
> 인용: "**기저**는 $dp[0][c] = 0$ 이다 — 물건이 하나도 없으면 고를
것이 없고, $c$ 가 무엇이든 가치 합은 0이다." / "최적해는 두 값 중 하나 이하이므로 $dp[i][c] \le \max(\cdot,\cdot)$ 이고, 반대로 두 값은
각각 실제로 만들 수 있는 해의 가치이므로 $dp[i][c] \ge \max(\cdot,\cdot)$ 다. 따라서 같다." / "| `weights=[]`, `values=[]`, `W=10` | 0번째 줄만 있고 루프가 안 돈다 | `0` |"

[V4] PASS
> 인용: "담기   물건1(무게3) 담음 → 남은 용량 1
       물건2(무게4)는 1 에 안 들어감 → 버린다
       그리디 답 = 4        ✗

정답   물건2 하나만 담으면 무게 4 로 딱 맞고 가치 5
       정답     = 5        ✓"

[V5] PASS
> 인용: "바른 코드   13
한 줄 바꿈  14      ← 있지도 않은 가치가 1 더 나왔다"

[V6] PASS
> 인용: "| T2 | `i=1`, `c=1` | `1 < 1` 거짓 · `skip=0`, `take=dp[0][0]+1=1` · `0 >= 1` 거짓 → ③ | `dp[1][1] = 1` |" / "**세 갈래가 모두 나왔다.** `①`은 T1·T3, `②`는 T5·T8, `③`은 T2·T4·T6·T7 이다."

[V7] PASS
> 인용: "**세 줄이 같다.** 이 알고리즘은 입력을 보고 일찍 끝내는 자리가 없어 표 `(n+1)(W+1)` 칸을
언제나 한 번씩 채운다." / "**보장의 종류는 최악 보장이다.** 기대값이 아니다 — 코드에 무작위성이 없고 입력 분포를
가정하지도 않는다." / "| | 상한 $O$ | 타이트 $\Theta$ |"

VERDICT: PASS
```

