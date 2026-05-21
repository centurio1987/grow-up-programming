# Search in Rotated Sorted Array

## 함수 인터페이스

```ts
export function searchInRotatedSortedArray(A: number[], target: number): number;
```

## 제약 조건

- $1 \leq N \leq 10^{6}$
- $A$의 모든 원소는 서로 다르다.
- $A$는 어떤 인덱스 $k$ ($0 \leq k < N$) 에서 회전된 오름차순 배열이다.
- $-10^{4} \leq A[i], \text{target} \leq 10^{4}$

## 문제 상세

서로 다른 값으로 이루어진 오름차순 정렬 배열이 알 수 없는 위치에서 회전된 상태로 주어진다.
예: $[0, 1, 2, 4, 5, 6, 7]$ 이 회전되어 $[4, 5, 6, 7, 0, 1, 2]$ 가 될 수 있다.

회전된 배열 $A$와 목표값 $\text{target}$이 주어질 때,
$A[i] = \text{target}$인 인덱스 $i$를 반환하고, 없으면 $-1$을 반환한다.

$$\text{searchInRotatedSortedArray}(A, \text{target}) = \begin{cases}
  i & \text{if } \exists\, i \in [0, N) \text{ s.t. } A[i] = \text{target} \\
  -1 & \text{otherwise}
\end{cases}$$

## 예시

```ts
searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 0);    // 4
searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 3);    // -1
searchInRotatedSortedArray([1], 1);                      // 0
searchInRotatedSortedArray([3, 1], 1);                   // 1
```
