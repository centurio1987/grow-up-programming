# Segment Tree with Lazy Propagation — 구간 가산 / 구간 합

## 함수 인터페이스

```ts
export class SegmentTreeLazy {
  constructor(n: number);
  rangeAdd(l: number, r: number, val: number): void;
  rangeSum(l: number, r: number): number;
}
```

## 제약 조건

- $1 \leq n \leq 10^5$ (배열의 크기)
- 인덱스는 0-기반: $0 \leq l \leq r < n$
- 질의 횟수 $q \leq 10^5$
- `val` 은 정수 (음수 가능)

## 문제 상세

크기 $n$ 의 배열 $A$ 가 모든 원소 $0$ 으로 초기화된 상태에서, 다음 두 연산을 모두 $O(\log n)$ 에 처리할 수 있는 자료구조를 구현하라.

1. **구간 가산** — `rangeAdd(l, r, val)`:
   $$\forall\, i \in [l, r],\; A[i] \leftarrow A[i] + val$$
2. **구간 합 질의** — `rangeSum(l, r)`:
   $$\mathrm{rangeSum}(l, r) = \sum_{i=l}^{r} A[i]$$

### 메서드 명세

- `new SegmentTreeLazy(n)` — 크기 $n$ 의 세그먼트 트리를 모든 원소 $0$ 으로 생성한다.
- `rangeAdd(l, r, val)` — 구간 $[l, r]$ 의 모든 원소에 `val` 을 더한다. 반환값은 없다.
- `rangeSum(l, r)` — 구간 $[l, r]$ 의 합을 반환한다.

## 예시

```ts
const st = new SegmentTreeLazy(5);     // A = [0, 0, 0, 0, 0]

st.rangeAdd(0, 2, 3);                  // A = [3, 3, 3, 0, 0]
st.rangeSum(0, 4);                     // 9
st.rangeSum(2, 3);                     // 3

st.rangeAdd(1, 4, 2);                  // A = [3, 5, 5, 2, 2]
st.rangeSum(0, 4);                     // 17
st.rangeSum(3, 3);                     // 2

st.rangeAdd(2, 2, -10);                // A = [3, 5, -5, 2, 2]
st.rangeSum(0, 2);                     // 3
```
