# Sort Array

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function sortArray(A: number[]): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- $-10^9 \leq A[i] \leq 10^9$

## 문제 상세

$N$ 개의 정수로 이루어진 배열 $A$ 가 주어질 때, 오름차순으로 정렬된 새 배열 $B$ 를 반환하라. 결과 배열 $B$ 는 다음을 만족해야 한다.

$$B[0] \leq B[1] \leq \cdots \leq B[N-1], \quad \text{multiset}(B) = \text{multiset}(A)$$

## 예시

```ts
sortArray([]);                          // []
sortArray([1]);                         // [1]
sortArray([5, 2, 3, 1]);                // [1, 2, 3, 5]
sortArray([5, 1, 1, 2, 0, 0]);          // [0, 0, 1, 1, 2, 5]
sortArray([-2, 3, -5, 0, 1]);           // [-5, -2, 0, 1, 3]
```
