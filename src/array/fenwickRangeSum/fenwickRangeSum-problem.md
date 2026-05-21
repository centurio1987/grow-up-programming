# 구간 합 질의 (동적 갱신, Fenwick Tree)

## 함수 인터페이스

```ts
export type FenwickOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

export function fenwickRangeSum(A: number[], ops: FenwickOp[]): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- $1 \leq Q \leq 100{,}000$ (여기서 $Q$ 는 `ops` 의 길이)
- $-10^4 \leq A[i], v \leq 10^4$ (정수)
- `update` 연산은 $0 \leq i < N$
- `query` 연산은 $0 \leq l \leq r < N$

## 문제 상세

정수 배열 $A$ 와 일련의 연산이 주어진다. 연산은 두 종류이다.

- **update** $(i, v)$: $A[i] \leftarrow v$ 로 갱신한다 (덮어쓰기).
- **query** $(l, r)$: $\displaystyle \sum_{k=l}^{r} A[k]$ 를 계산한다.

모든 연산을 순서대로 처리하며, **`query` 연산의 결과만** 등장 순서대로 담은 배열을 반환한다.

## 예시

```ts
fenwickRangeSum(
  [1, 2, 3, 4, 5],
  [
    { type: "query",  l: 0, r: 4 },   // 15
    { type: "update", i: 2, v: 10 },  // A = [1, 2, 10, 4, 5]
    { type: "query",  l: 0, r: 4 },   // 22
    { type: "query",  l: 2, r: 3 },   // 14
    { type: "update", i: 0, v: -3 },  // A = [-3, 2, 10, 4, 5]
    { type: "query",  l: 0, r: 1 },   // -1
  ],
);
// [15, 22, 14, -1]
```
