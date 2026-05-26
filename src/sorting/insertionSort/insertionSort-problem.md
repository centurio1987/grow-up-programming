# Insertion Sort

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function insertionSort(A: number[]): number[];
```

## 제약 조건

- $1 \leq N \leq 10{,}000$ (여기서 $N$ 은 `A` 의 길이)
- $-10^9 \leq A[i] \leq 10^9$

## 문제 상세

$N$ 개의 정수로 이루어진 배열 $A$ 가 주어진다. **삽입 정렬(Insertion Sort)** 알고리즘을 사용하여 $A$ 를 오름차순으로 정렬한 새 배열을 반환하라.

입력 배열의 역순쌍(inversion) 수를

$$I(A) = \left| \{ (i, j) \mid i < j,\ A[i] > A[j] \} \right|$$

라 정의할 때, 삽입 정렬의 시간 복잡도는

$$T(n) = O(n + I(A))$$

이므로 거의 정렬된 입력에서 효율적으로 동작해야 한다.

## 예시

```ts
insertionSort([]);                      // []
insertionSort([1]);                     // [1]
insertionSort([2, 1]);                  // [1, 2]
insertionSort([5, 2, 4, 6, 1, 3]);      // [1, 2, 3, 4, 5, 6]
insertionSort([-3, 0, -1, 2, 1]);       // [-3, -1, 0, 1, 2]
```
