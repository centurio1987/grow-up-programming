# Mo's Algorithm — 오프라인 구간 distinct 질의

## 함수 인터페이스

```ts
export function mosAlgorithm(
  arr: number[],
  queries: [number, number][],
): number[];
```

## 제약 조건

- $1 \leq n \leq 10^4$ (배열 길이)
- 질의 수 $q \leq 10^4$
- $A[i] \in \mathbb{Z}$
- 구간은 $0$-기반 폐구간: $0 \leq l \leq r < n$

## 문제 상세

길이 $n$의 배열 $A$와 $q$개의 구간 질의 $[l_i, r_i]$가 주어진다. 각 구간에 대해 서로 다른 원소의 개수(distinct count)를 반환하라:

$$\mathrm{answer}(l, r) = |\{ A[k] \mid l \leq k \leq r \}|$$

반환 배열은 입력 `queries`의 원래 순서를 따른다:

$$\mathrm{result}[i] = |\{ A[k] \mid l_i \leq k \leq r_i \}|$$

## 예시

```ts
const arr = [1, 2, 1, 3, 2];
const queries: [number, number][] = [
  [0, 2],   // {1, 2} -> 2
  [1, 4],   // {1, 2, 3} -> 3
  [0, 4],   // {1, 2, 3} -> 3
  [3, 3],   // {3} -> 1
];

mosAlgorithm(arr, queries);   // [2, 3, 3, 1]
```
