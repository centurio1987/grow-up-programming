# 행렬 체인 곱셈 (Matrix Chain Multiplication)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function matrixChainMultiplication(dims: number[]): number;
```

## 제약 조건

- $dims$ 의 길이는 $n + 1$ ($1 \leq n \leq 100$, 즉 $|dims| \leq 101$)
- $1 \leq dims[i] \leq 500$

## 문제 상세

행렬 $A_1, A_2, \ldots, A_n$ 이 주어지고, 각 행렬의 차원을 $dims$ 배열로 표현한다. 즉 $A_i$ 의 크기는 $dims[i-1] \times dims[i]$ 이다.

행렬 곱셈은 결합 법칙이 성립하지만 결합 순서에 따라 총 스칼라 곱셈 횟수가 달라진다. 두 행렬 $p \times q$ 와 $q \times r$ 을 곱할 때 비용은 $p \cdot q \cdot r$ 이다.

행렬 곱셈의 **결합 순서**를 잘 선택해, 총 스칼라 곱셈 횟수를 최소화하는 값을 구해 반환하라.

## 예시

```ts
matrixChainMultiplication([10, 20, 30]);              // 6000        (단일 곱: 10·20·30)
matrixChainMultiplication([10, 20, 30, 40, 30]);      // 30000
matrixChainMultiplication([40, 20, 30, 10, 30]);      // 26000
matrixChainMultiplication([10, 30, 5, 60]);           // 4500        ((A1(A2A3)): 30·5·60 + 10·30·60 = 9000+18000=27000; (A1A2)A3: 10·30·5 + 10·5·60 = 1500+3000 = 4500)
```
