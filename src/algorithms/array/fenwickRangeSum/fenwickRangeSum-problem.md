# 구간 합 질의 (동적 갱신)

## 한 줄 요약

> 정수 배열과 갱신·질의 연산 목록을 받아, **각 질의(구간 합)의 결과**를 순서대로 담은 배열을 반환한다.

## 스토리

온라인 게임의 점수 집계 서버를 담당하는 재원은 실시간으로 들어오는 두 종류의 요청을 처리해야 한다.

첫 번째는 특정 플레이어의 점수를 새 값으로 바꾸는 갱신 요청이다. 두 번째는 플레이어 구간 $[l, r]$에 속한 모든 플레이어의 점수 합계를 묻는 질의 요청이다.

요청이 섞여서 들어오기 때문에, 질의를 처리할 때마다 이미 반영된 갱신이 결과에 영향을 준다. 재원은 모든 질의의 결과를 순서대로 모아 반환해야 한다.

## 함수 인터페이스

```ts
export type FenwickOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

export function fenwickRangeSum(A: number[], ops: FenwickOp[]): number[];
```

- `A` — 초기 정수 배열.
- `ops` — 순서대로 처리할 연산 목록. `update`는 점 갱신, `query`는 구간 합 요청이다.
- 반환 — `query` 연산의 결과만 등장 순서대로 담은 배열.

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$은 `A`의 길이)
- $0 \leq Q \leq 100{,}000$ (여기서 $Q$는 `ops`의 길이)
- $-10{,}000 \leq A[i],\, v \leq 10{,}000$ (정수)
- `update` 연산: $0 \leq i < N$
- `query` 연산: $0 \leq l \leq r < N$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

연산은 두 종류다.

- **update** $(i, v)$: $A[i] \leftarrow v$ (덮어쓰기, 누적이 아님).
- **query** $(l, r)$: $\displaystyle\sum_{k=l}^{r} A[k]$를 계산한다.

연산은 입력 순서대로 처리된다. `update`는 이후 모든 연산에 즉시 반영된다. `query` 결과만 모아 반환하며, `update`는 결과 배열에 포함되지 않는다. `query`가 하나도 없으면 빈 배열을 반환한다.

## 예시

```ts
fenwickRangeSum(
  [1, 2, 3, 4, 5],
  [
    { type: "query",  l: 0, r: 4 },   // 15  — 초기 전체 합 1+2+3+4+5
    { type: "update", i: 2, v: 10 },  // A는 이제 [1,2,10,4,5]
    { type: "query",  l: 0, r: 4 },   // 22  — 갱신 후 전체 합
    { type: "query",  l: 2, r: 3 },   // 14  — A[2]+A[3]=10+4
  ],
); // [15, 22, 14]

fenwickRangeSum([7], [{ type: "query", l: 0, r: 0 }]);
// [7]  — 단일 원소, l=r=0

fenwickRangeSum([1, 2, 3], []);
// []  — 연산 없음, 빈 배열 반환

fenwickRangeSum(
  [1, 2, 3],
  [{ type: "update", i: 0, v: -5 }, { type: "query", l: 0, r: 2 }],
); // [0]  — [-5,2,3]의 합, 음수 갱신 후 질의
```
