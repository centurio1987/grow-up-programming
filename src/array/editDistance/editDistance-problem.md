# Edit Distance (Levenshtein Distance)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function editDistance(s: string, t: string): number;
```

## 제약 조건

- $0 \leq |s| \leq 1{,}000$
- $0 \leq |t| \leq 1{,}000$
- 여기서 $n = |s|$, $m = |t|$

## 문제 상세

두 문자열 $s$, $t$ 가 주어진다. $s$ 를 $t$ 로 변환하기 위해 필요한 **최소 편집 횟수** 를 반환한다.

허용되는 편집 연산은 다음 세 가지이며, 각각 비용은 $1$ 이다.

- **삽입**: $s$ 의 임의 위치에 문자 하나를 끼워 넣는다.
- **삭제**: $s$ 의 임의 위치에서 문자 하나를 제거한다.
- **교체**: $s$ 의 임의 위치에 있는 문자 하나를 다른 문자로 바꾼다.

점화식 ($1 \leq i \leq n$, $1 \leq j \leq m$):

$$dp[i][j] = \begin{cases} dp[i-1][j-1] & \text{if } s[i-1] = t[j-1] \\ 1 + \min(dp[i-1][j],\, dp[i][j-1],\, dp[i-1][j-1]) & \text{otherwise} \end{cases}$$

초기 조건:

$$dp[0][j] = j,\quad dp[i][0] = i$$

결과는 $dp[n][m]$.

## 예시

```ts
editDistance("kitten", "sitting"); // 3   (k→s, e→i, +g)
editDistance("flaw", "lawn");      // 2   (-f, +n)
editDistance("", "abc");           // 3   (+a, +b, +c)
editDistance("abc", "");           // 3   (-a, -b, -c)
editDistance("same", "same");      // 0
```
