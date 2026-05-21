# Fenwick Tree (Binary Indexed Tree, BIT)

## 함수 인터페이스

```ts
export class FenwickTree {
  constructor(n: number);
  update(i: number, delta: number): void;
  prefixSum(i: number): number;
  rangeSum(l: number, r: number): number;
}
```

## 제약 조건

- $1 \leq n \leq 10^5$
- 질의 수 $q \leq 10^5$
- 인덱스는 $1$-기반: $1 \leq i \leq n$
- `delta`는 정수 ($\Delta \in \mathbb{Z}$, 음수 가능)

## 문제 상세

크기 $n$의 배열에 대해 점 갱신(point update)과 접두사 합(prefix sum) 질의를 모두 $O(\log n)$에 처리하는 자료구조를 구현하라. 모든 원소는 초기값 $0$으로 시작한다.

구간 합 $[l, r]$은 다음과 같이 계산한다:

$$\mathrm{rangeSum}(l, r) = \mathrm{prefixSum}(r) - \mathrm{prefixSum}(l - 1)$$

### 메서드 명세

- `new FenwickTree(n)` — 크기 $n$의 Fenwick Tree를 초기값 $0$으로 생성한다.
- `update(i, delta)` — 인덱스 $i$의 값에 $\Delta$를 더한다 (점 갱신):

  $$A[i] \leftarrow A[i] + \Delta$$
- `prefixSum(i)` — 접두사 합을 반환한다. $i = 0$이면 $0$을 반환한다:

  $$\mathrm{prefixSum}(i) = \sum_{k=1}^{i} A[k]$$
- `rangeSum(l, r)` — 구간 합을 반환한다 ($1 \leq l \leq r \leq n$):

  $$\mathrm{rangeSum}(l, r) = \sum_{k=l}^{r} A[k]$$

## 예시

```ts
const ft = new FenwickTree(5);     // A = [0, 0, 0, 0, 0] (1-기반)

ft.update(1, 3);                   // A = [3, 0, 0, 0, 0]
ft.update(3, 5);                   // A = [3, 0, 5, 0, 0]
ft.update(5, 2);                   // A = [3, 0, 5, 0, 2]

ft.prefixSum(3);                   // 8
ft.prefixSum(5);                   // 10
ft.rangeSum(2, 4);                 // 5
ft.rangeSum(1, 5);                 // 10
```
