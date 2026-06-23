# 구간 최솟값 질의 (동적 갱신)

## 한 줄 요약

> 정수 배열과 갱신·질의 연산 목록을 받아, **각 질의(구간 최솟값)의 결과**를 순서대로 담은 배열을 반환한다.

## 스토리

물류 창고 모니터링 시스템을 담당하는 진수는 창고 구역별 재고 최솟값을 실시간으로 추적한다.

시스템에는 두 종류의 명령이 들어온다. 하나는 특정 구역의 재고를 새 값으로 교체하는 갱신이고, 다른 하나는 구간 $[l, r]$에 속한 구역들의 재고 중 가장 적은 양을 묻는 질의다.

명령이 섞여 들어오므로, 갱신 결과가 이후 질의에 즉시 반영되어야 한다. 진수는 모든 질의의 결과를 순서대로 모아 반환해야 한다.

## 함수 인터페이스

```ts
export type SegOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

export function segmentTreeRangeMin(A: number[], ops: SegOp[]): number[];
```

- `A` — 초기 정수 배열.
- `ops` — 순서대로 처리할 연산 목록. `update`는 점 갱신, `query`는 구간 최솟값 요청이다.
- 반환 — `query` 연산의 결과만 등장 순서대로 담은 배열.

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$은 `A`의 길이)
- $0 \leq Q \leq 100{,}000$ (여기서 $Q$는 `ops`의 길이)
- $-10^9 \leq A[i],\, v \leq 10^9$ (정수)
- `update` 연산: $0 \leq i < N$
- `query` 연산: $0 \leq l \leq r < N$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

연산은 두 종류다.

- **update** $(i, v)$: $A[i] \leftarrow v$ (덮어쓰기, 누적이 아님).
- **query** $(l, r)$: $\min(A[l], A[l+1], \ldots, A[r])$를 계산한다.

연산은 입력 순서대로 처리된다. `update`는 이후 모든 연산에 즉시 반영된다. `query` 결과만 모아 반환하며, `update`는 결과 배열에 포함되지 않는다. `query`가 하나도 없으면 빈 배열을 반환한다.

## 예시

```ts
segmentTreeRangeMin(
  [5, 2, 4, 1, 3],
  [
    { type: "query",  l: 0, r: 4 },   // 1  — 초기 전체 최솟값
    { type: "query",  l: 0, r: 2 },   // 2  — A[0..2] 중 최솟값
    { type: "update", i: 3, v: 10 },  // A는 이제 [5,2,4,10,3]
    { type: "query",  l: 0, r: 4 },   // 2  — 갱신 후 전체 최솟값
    { type: "query",  l: 3, r: 4 },   // 3  — A[3..4] 중 최솟값
  ],
); // [1, 2, 2, 3]

segmentTreeRangeMin([5], [
  { type: "query",  l: 0, r: 0 },
  { type: "update", i: 0, v: 99 },
  { type: "query",  l: 0, r: 0 },
]); // [5, 99]  — 단일 원소, 갱신 전후

segmentTreeRangeMin([1, 2, 3], []);
// []  — 연산 없음

segmentTreeRangeMin(
  [1, 2, 3],
  [{ type: "update", i: 1, v: -1000 }, { type: "query", l: 0, r: 2 }],
); // [-1000]  — 음수 갱신 후 최솟값
```
