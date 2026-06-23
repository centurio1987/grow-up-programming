# Treap

## 한 줄 요약

> `Treap`은 정수의 동적 다중 집합을 관리하며, 삽입·삭제와 정렬 순서 기준 $k$번째 원소 조회를 지원한다.

## 스토리

주식 거래 시스템의 호가창은 매수 주문 가격들을 실시간으로 관리한다. 새 주문이 들어오면 가격이 추가되고, 체결되거나 취소되면 제거된다. 트레이더는 "현재 매수 호가 중 가장 낮은 k번째 가격은 얼마인가?"를 언제든 물어볼 수 있다.

같은 가격에 복수의 주문이 들어올 수 있고, 취소 시에는 그 가격의 주문 하나만 제거한다. 주문 수가 수십만 건이고 질의가 빈번하므로, 모든 연산이 빠르게 동작해야 한다.

정수를 동적으로 삽입·삭제하며, 정렬 순서 기준 $k$번째 원소를 반환하는 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class Treap {
  constructor(): void;
  insert(x: number): void;
  delete(x: number): void;
  findKth(k: number): number;
}
```

- `insert(x)` — 정수 $x$를 삽입한다. 중복 삽입 허용. 반환값 없음
- `delete(x)` — 정수 $x$를 한 개 삭제한다. 존재하지 않으면 아무 일도 하지 않는다. 반환값 없음
- `findKth(k)` — 현재 집합에서 오름차순 $k$번째 ($1$-기반) 원소를 반환한다. $1 \leq k \leq |T|$

## 제약 조건

- $|x| \leq 10^9$
- 원소 수 $n \leq 10^5$
- 질의 수 $q \leq 10^5$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

빈 집합에서 시작한다. `insert`는 중복 원소를 허용한다.

**insert(x):** 값 $x$를 집합에 추가한다.

**delete(x):** 집합에서 $x$를 한 개 제거한다. $x$가 없으면 아무 일도 하지 않는다.

**findKth(k):** 집합을 오름차순으로 정렬했을 때 $k$번째 ($1$-기반) 원소를 반환한다.

$$\text{findKth}(k) = x \text{ s.t. } |\{y \in T \mid y < x\}| < k \leq |\{y \in T \mid y \leq x\}|$$

## 예시

```ts
const t = new Treap();

t.insert(5);
t.insert(2);
t.insert(8);
t.insert(2);     // 중복 허용: T = {2, 2, 5, 8}

t.findKth(1);    // 2 — 1번째
t.findKth(2);    // 2 — 중복된 2가 2번째
t.findKth(3);    // 5
t.findKth(4);    // 8

t.delete(2);     // T = {2, 5, 8} (하나만 제거)
t.findKth(1);    // 2 — 남은 2
t.findKth(2);    // 5

t.delete(999);   // 없는 값, 무시
t.findKth(1);    // 2 — 변화 없음

// 음수 포함
const t2 = new Treap();
[-3, 0, -1, 2].forEach(v => t2.insert(v));
t2.findKth(1);   // -3 — 가장 작은 값
t2.findKth(3);   // 0
```
