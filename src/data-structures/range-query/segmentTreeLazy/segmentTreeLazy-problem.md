# Segment Tree with Lazy Propagation

## 한 줄 요약

> `SegmentTreeLazy`는 배열 크기를 받아, 구간 전체에 값을 더하는 갱신과 구간 합 조회를 모두 지원한다.

## 스토리

물류 창고 관리 시스템에서 선반은 번호가 매겨진 구역으로 나뉘어 있다. 한 번의 입고 작업은 연속된 구역 전체에 동일한 수량의 물건을 추가한다. 관리자는 특정 구역 범위의 총 재고를 수시로 조회한다.

구역 수가 수십만 개이고, 입고와 조회가 번갈아 들어온다. 구역 하나씩 갱신하면 입고 처리가 너무 느리다.

초기 재고가 모두 $0$인 배열을 관리하며, 연속 구간에 동일한 값을 더하는 갱신과 연속 구간의 합 조회를 지원하는 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class SegmentTreeLazy {
  constructor(n: number): void;
  rangeAdd(l: number, r: number, val: number): void;
  rangeSum(l: number, r: number): number;
}
```

- `n` — 배열의 크기. 인덱스는 $0$-기반, 유효 범위 $[0, n)$
- `rangeAdd(l, r, val)` — 구간 $[l, r]$의 모든 원소에 `val`을 더한다. 반환값 없음
- `rangeSum(l, r)` — 구간 $[l, r]$의 합을 반환한다

## 제약 조건

- $1 \leq n \leq 10^5$
- $0 \leq l \leq r < n$
- `val`은 정수이며 음수 가능
- 질의 수 $q \leq 10^5$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

초기에 배열의 모든 원소는 $0$이다.

**rangeAdd(l, r, val):** 배열의 인덱스 $l$부터 $r$까지 각 원소에 `val`을 더한다.

$$\forall\, i \in [l, r],\; A[i] \leftarrow A[i] + \text{val}$$

**rangeSum(l, r):** 배열의 인덱스 $l$부터 $r$까지의 합을 반환한다.

$$\text{rangeSum}(l, r) = \sum_{i=l}^{r} A[i]$$

`rangeAdd`를 한 번도 호출하지 않은 상태의 `rangeSum`은 항상 $0$이다.

`rangeAdd(i, i, val)`과 `rangeSum(i, i)`는 단일 원소에 대한 갱신과 조회이다.

`val`이 음수이면 원소 값이 감소할 수 있으며, 배열 값이 음수가 되어도 무방하다.

## 예시

```ts
const st = new SegmentTreeLazy(5);
// A = [0, 0, 0, 0, 0]

st.rangeAdd(0, 2, 3);       // A = [3, 3, 3, 0, 0]
st.rangeSum(0, 4);           // 9 — 3+3+3+0+0
st.rangeSum(2, 3);           // 3 — 3+0

st.rangeAdd(1, 4, 2);       // A = [3, 5, 5, 2, 2]
st.rangeSum(0, 4);           // 17 — 전체 합
st.rangeSum(3, 3);           // 2 — 단일 원소

st.rangeAdd(2, 2, -10);     // A = [3, 5, -5, 2, 2]
st.rangeSum(0, 2);           // 3 — 3+5+(-5): 음수 포함
st.rangeSum(0, 0);           // 3 — 경계: 첫 원소
```
