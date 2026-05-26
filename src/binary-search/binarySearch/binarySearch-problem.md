# Binary Search

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function binarySearch(A: number[], target: number): number;
```

## 제약 조건

- $0 \leq N \leq 10^{6}$
- $A$는 오름차순으로 정렬되어 있다 ($A[i] \leq A[i+1]$).
- $-2^{31} \leq A[i], \text{target} \leq 2^{31} - 1$

## 문제 상세

정렬된 정수 배열 $A$와 목표값 $\text{target}$이 주어진다.
$A[i] = \text{target}$인 인덱스 $i$를 반환하고, 존재하지 않으면 $-1$을 반환한다.

$$\text{binarySearch}(A, \text{target}) = \begin{cases}
  i & \text{if } \exists\, i \in [0, N) \text{ s.t. } A[i] = \text{target} \\
  -1 & \text{otherwise}
\end{cases}$$

## 예시

```ts
binarySearch([1, 3, 5, 7, 9], 5);    // 2
binarySearch([1, 3, 5, 7, 9], 4);    // -1
binarySearch([], 1);                 // -1
binarySearch([42], 42);              // 0
```
