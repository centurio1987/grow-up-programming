# Counting Sort

## 함수 인터페이스

```ts
export function countingSort(A: number[]): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- $0 \leq A[i] \leq 1{,}000$

## 문제 상세

$N$ 개의 비음 정수로 이루어진 배열 $A$ 가 주어진다. 모든 원소가 작은 정수 키 범위에 있다는 점을 이용하여, **계수 정렬(Counting Sort)** 알고리즘으로 $A$ 를 오름차순 정렬한 결과를 새 배열로 반환하라.

## 예시

```ts
countingSort([]);                       // []
countingSort([5]);                      // [5]
countingSort([3, 1, 2]);                // [1, 2, 3]
countingSort([4, 2, 2, 8, 3, 3, 1]);    // [1, 2, 2, 3, 3, 4, 8]
countingSort([0, 1000, 500, 0, 1000]);  // [0, 0, 500, 1000, 1000]
```
