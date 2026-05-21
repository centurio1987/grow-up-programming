# Kth Smallest Element

## 함수 인터페이스

```ts
export function kthSmallest(A: number[], k: number): number;
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- $-10^9 \leq A[i] \leq 10^9$
- $1 \leq k \leq N$ (1-based 인덱스)

## 문제 상세

$N$ 개의 정수로 이루어진 배열 $A$ 와 정수 $k$ 가 주어진다. $A$ 를 오름차순으로 정렬했을 때 $k$ 번째 원소를 반환하라 (1-based).

$$\text{kthSmallest}(A, k) = \text{sort}(A)[k-1]$$

## 예시

```ts
kthSmallest([3, 1, 2], 1);                    // 1
kthSmallest([3, 1, 2], 2);                    // 2
kthSmallest([3, 1, 2], 3);                    // 3
kthSmallest([7, 10, 4, 3, 20, 15], 3);        // 7
kthSmallest([7, 10, 4, 3, 20, 15], 4);        // 10
kthSmallest([-5, 0, 5, -10, 10], 1);          // -10
```
