# Divide & Conquer DP — 최소 비용 $k$-분할

## 함수 인터페이스

```ts
export function divideAndConquerDp(cost: number[][], k: number): number;
```

## 제약 조건

- $1 \leq n \leq 500$ (여기서 $n$ 은 `cost` 의 한 변의 길이)
- `cost` 는 $n \times n$ 정수 행렬이며 $0 \leq \text{cost}[i][j]$
- $1 \leq k \leq n$
- 반환값은 $\geq 0$

## 문제 상세

$n \times n$ 비용 행렬 $\text{cost}[i][j]$ 가 주어진다. 이 값은 구간 $[i, j]$ 를 하나의 그룹으로 묶었을 때의 비용을 의미한다.

배열의 인덱스 구간 $[0, n-1]$ 을 정확히 $k$ 개의 **연속 구간**으로 분할할 때, 각 구간에 해당하는 `cost` 값들의 합이 최소가 되도록 하는 분할의 비용 총합을 반환하라.

상태 점화식:

$$dp[g][i] = \min_{g-1 \leq j < i} \left( dp[g-1][j] + \text{cost}[j+1][i] \right)$$

기저:

$$dp[1][i] = \text{cost}[0][i]$$

답은 $dp[k][n-1]$ 이다.

## 예시

```ts
// n = 3, k = 1: 전체를 한 구간으로 → cost[0][2]
divideAndConquerDp(
  [
    [0, 2, 5],
    [0, 0, 3],
    [0, 0, 0],
  ],
  1,
); // 5

// n = 3, k = 3: 각 원소를 한 구간씩 → cost[0][0] + cost[1][1] + cost[2][2]
divideAndConquerDp(
  [
    [0, 2, 5],
    [0, 0, 3],
    [0, 0, 0],
  ],
  3,
); // 0
```
