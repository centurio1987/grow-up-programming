# Longest Common Subsequence (LCS)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function longestCommonSubsequence(s: string, t: string): number;
```

## 제약 조건

- $0 \leq |s| \leq 1{,}000$
- $0 \leq |t| \leq 1{,}000$
- 여기서 $n = |s|$, $m = |t|$
- 문자열의 문자는 ASCII로 가정한다

## 문제 상세

두 문자열 $s$, $t$ 가 주어진다. 두 문자열의 **공통 부분 수열 중 가장 긴 것의 길이** 를 반환한다.

문자열 $x$ 의 **부분 수열** 이란 $x$ 의 일부 문자를 골라 (없을 수도 있음) **원래의 순서를 유지** 한 채 이어 붙인 새 문자열이다. 인접하지 않아도 되며, 모두 비울 수도 있다.

공통 부분 수열 $w$ 는 $s$ 와 $t$ 모두의 부분 수열이 되는 문자열이다. 그 중 길이가 가장 긴 $w$ 의 길이를 반환한다 (해당 $w$ 자체가 아니라 길이만).

점화식 ($1 \leq i \leq n$, $1 \leq j \leq m$):

$$dp[i][j] = \begin{cases} dp[i-1][j-1] + 1 & \text{if } s[i-1] = t[j-1] \\ \max(dp[i-1][j],\, dp[i][j-1]) & \text{otherwise} \end{cases}$$

결과는 $dp[n][m]$.

## 예시

```ts
longestCommonSubsequence("abcde", "ace");   // 3   ("ace")
longestCommonSubsequence("abc", "abc");     // 3
longestCommonSubsequence("abc", "def");     // 0
longestCommonSubsequence("", "anything");   // 0
longestCommonSubsequence("AGGTAB", "GXTXAYB"); // 4   ("GTAB")
```
