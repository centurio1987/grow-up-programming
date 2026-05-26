# Parametric Binary Search — Split Array Largest Sum

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function parametricBinarySearch(A: number[], K: number): number;
```

## 제약 조건

- $1 \leq N \leq 10^{5}$
- $1 \leq K \leq N$
- $0 \leq A[i] \leq 10^{6}$

## 문제 상세

음이 아닌 정수 배열 $A$와 정수 $K$가 주어진다.
$A$를 $K$개의 비어있지 않은 연속 부분 배열로 분할할 때,
각 부분 배열 합의 최댓값을 최소화하는 값을 반환한다.

분할 $\pi = (S_1, S_2, \ldots, S_K)$를 $A$의 $K$개 연속 분할이라 하면:

$$\text{parametricBinarySearch}(A, K) = \min_{\pi} \max_{1 \leq j \leq K} \sum_{i \in S_j} A[i]$$

## 예시

```ts
parametricBinarySearch([7, 2, 5, 10, 8], 2);     // 18  ([7,2,5,10] | [8] 또는 [7,2,5] | [10,8])
parametricBinarySearch([1, 2, 3, 4, 5], 2);      // 9   ([1,2,3] | [4,5])
parametricBinarySearch([1, 4, 4], 3);            // 4   ([1] | [4] | [4])
```
