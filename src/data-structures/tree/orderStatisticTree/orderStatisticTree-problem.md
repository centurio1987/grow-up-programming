# Order Statistic Tree

## 한 줄 요약

> `OrderStatisticTree`는 정수의 동적 다중 집합을 관리하며, $k$번째 원소 조회와 특정 값의 순위 계산을 지원한다.

## 스토리

온라인 코딩 대회 플랫폼에서 참가자들의 점수는 실시간으로 갱신된다. 운영팀은 "지금 등록된 점수 중 가장 낮은 k번째 점수는 얼마인가?" 또는 "x점보다 낮은 점수가 몇 개 있는가?"를 빠르게 조회해야 한다.

참가자 점수가 수시로 등록되고 취소된다. 두 참가자가 같은 점수를 받을 수 있고, 취소 시에는 해당 점수 하나만 제거해야 한다.

정수를 동적으로 삽입·삭제하며, 정렬 순서 기준 $k$번째 값과 특정 값의 순위를 반환하는 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class OrderStatisticTree {
  constructor(): void;
  insert(x: number): void;
  delete(x: number): void;
  kth(k: number): number;
  rank(x: number): number;
}
```

- `insert(x)` — 정수 $x$를 삽입한다. 중복 삽입 허용. 반환값 없음
- `delete(x)` — 정수 $x$를 한 개 삭제한다. 존재하지 않으면 아무 일도 하지 않는다. 반환값 없음
- `kth(k)` — 현재 집합에서 오름차순 $k$번째 ($1$-기반) 값을 반환한다. $1 \leq k \leq |S|$
- `rank(x)` — $x$보다 작은 원소의 수를 반환한다. 집합이 비어도 유효한 값을 반환한다

## 제약 조건

- $|x| \leq 10^9$
- 집합 크기 $n \leq 10^5$
- 질의 수 $q \leq 10^5$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

빈 집합에서 시작한다. `insert`는 중복 원소를 허용한다.

**kth(k):** 현재 집합 $S$를 정렬했을 때 $k$번째 원소를 반환한다. $k$는 $1$-기반.

$$\text{kth}(k) = x \text{ s.t. } |\{y \in S \mid y < x\}| < k \leq |\{y \in S \mid y \leq x\}|$$

**rank(x):** $x$보다 엄격히 작은 원소의 수를 반환한다.

$$\text{rank}(x) = |\{y \in S \mid y < x\}|$$

`delete`는 중복된 원소 중 하나만 제거한다. 존재하지 않는 값을 삭제해도 오류가 발생하지 않는다.

## 예시

```ts
const ost = new OrderStatisticTree();

ost.insert(5);
ost.insert(2);
ost.insert(8);
ost.insert(2);    // S = {2, 2, 5, 8}

ost.kth(1);       // 2 — 1번째 원소
ost.kth(2);       // 2 — 중복된 2가 2번째
ost.kth(3);       // 5
ost.kth(4);       // 8

ost.rank(2);      // 0 — 2보다 작은 원소 없음
ost.rank(5);      // 2 — {2, 2}: 2개
ost.rank(10);     // 4 — 전체 원소가 10보다 작음

ost.delete(2);    // S = {2, 5, 8} (하나만 제거)
ost.kth(1);       // 2 — 남은 2
ost.rank(5);      // 1 — 이제 2보다 작은 원소가 1개

ost.delete(999);  // 없는 값, 무시
ost.kth(1);       // 2 — 변화 없음
```
