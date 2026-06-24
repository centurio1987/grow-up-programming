# Convex Hull Trick

## 한 줄 요약

> 자료구조는 직선들을 관리하며, 임의의 $x$에 대해 모든 직선 중 최솟값을 반환한다.

## 스토리

물류 회사의 요금 책정 시스템 담당자 지수는 여러 배송 업체로부터 견적을 받는다. 각 업체는 "기본 요금 + 거리당 단가"로 구성된 자체 요금 공식을 가지고 있으며, 배송 거리에 따라 가장 저렴한 업체가 달라진다.

새 업체가 계약을 체결할 때마다 시스템에 요금 공식을 등록해야 하고, 고객이 특정 거리의 최저 요금을 실시간으로 조회할 수 있어야 한다. 업체 수와 조회 횟수가 수만 건에 달하더라도 응답이 즉각적이어야 한다.

지수는 이 요구를 충족하기 위해 직선 집합에서 특정 $x$에 대한 최솟값을 빠르게 구할 수 있는 자료구조를 설계하기로 했다.

## 함수 인터페이스

```ts
export class ConvexHullTrick {
  addLine(m: number, b: number): void;
  query(x: number): number;
}
```

- `m` — 직선의 기울기
- `b` — 직선의 $y$절편
- `x` — 최솟값을 구할 지점
- `addLine` 반환 — 없음 (void)
- `query` 반환 — 등록된 모든 직선 $y = mx + b$ 중 $x$에서의 최솟값

## 제약 조건

- 기울기 $m$: $-10^9 \leq m \leq 10^9$, `addLine` 호출 시 $m$은 **비감소(non-decreasing) 순서**를 보장한다
- 절편 $b$: $-10^{18} \leq b \leq 10^{18}$
- 쿼리 지점 $x$: $-10^9 \leq x \leq 10^9$ (임의 순서 가능)
- `query`는 최소 한 번 이상 `addLine`이 호출된 후에만 호출된다
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

직선 $\ell_i(x) = m_i \cdot x + b_i$ 들의 집합을 동적으로 관리하면서, 임의의 $x$에 대해 다음 최솟값을 반환하라.

$$\text{query}(x) = \min_{i} (m_i \cdot x + b_i)$$

- `addLine(m, b)` — 기울기 $m$, 절편 $b$인 직선 $y = mx + b$를 집합에 추가한다. 추가되는 기울기는 이전 호출의 기울기 이상임을 보장한다.
- `query(x)` — 현재까지 추가된 모든 직선 중 $x$에서의 최솟값을 반환한다.

## 예시

```ts
const cht = new ConvexHullTrick();
cht.addLine(1, 0);   // y = x
cht.addLine(2, -5);  // y = 2x - 5

cht.query(0);   // -5 — min(0, -5)
cht.query(5);   //  5 — min(5, 5)
cht.query(10);  // 10 — min(10, 15)

// ---

const cht2 = new ConvexHullTrick();
cht2.addLine(0, 10);  // y = 10
cht2.addLine(1, 0);   // y = x
cht2.addLine(2, -10); // y = 2x - 10

cht2.query(0);    // -10 — min(10, 0, -10)
cht2.query(-100); // -210 — min(10, -100, -210)
cht2.query(100);  //  10 — min(10, 100, 190)

// ---

// 단일 직선만 등록된 경우
const cht3 = new ConvexHullTrick();
cht3.addLine(3, 7);  // y = 3x + 7

cht3.query(0);   //  7 — 3*0 + 7
cht3.query(10);  // 37 — 3*10 + 7
cht3.query(-5);  // -8 — 3*(-5) + 7
```
