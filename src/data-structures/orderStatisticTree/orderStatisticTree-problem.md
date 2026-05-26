# Order Statistic Tree (순위 통계 트리)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export class OrderStatisticTree {
  constructor();
  insert(x: number): void;
  delete(x: number): void;
  kth(k: number): number;
  rank(x: number): number;
}
```

## 제약 조건

- $1 \leq n \leq 10^5$ (원소 수)
- 질의 수 $q \leq 10^5$
- 원소 값은 $|x| \leq 10^9$

## 문제 상세

동적 다중 집합 $S \subset \mathbb{Z}$에 대해 다음 연산을 모두 $O(\log n)$에 처리하는 자료구조를 구현하라.

1. 삽입: $S \leftarrow S \cup \{x\}$
2. 삭제: $S \leftarrow S \setminus \{x\}$ (한 개)
3. $k$번째 원소: 정렬된 $S$에서 $1$-기반 $k$번째 값
4. 순위: $\mathrm{rank}(x) = |\{ y \in S \mid y < x \}|$

### 메서드 명세

- `new OrderStatisticTree()` — 비어있는 순위 통계 트리를 생성한다.
- `insert(x)` — 원소 $x$를 삽입한다. 중복 삽입을 허용한다.
- `delete(x)` — 원소 $x$를 한 개 삭제한다. 존재하지 않으면 아무 일도 하지 않는다.
- `kth(k)` — 정렬된 $S$에서 $k$번째 ($1$-기반) 원소를 반환한다 ($1 \leq k \leq |S|$):

  $$\mathrm{kth}(k) = x \text{ s.t. } |\{ y \in S \mid y < x \}| < k \leq |\{ y \in S \mid y \leq x \}|$$
- `rank(x)` — 값 $x$의 순위를 반환한다 ($x$보다 작은 원소의 개수, $\geq 0$):

  $$\mathrm{rank}(x) = |\{ y \in S \mid y < x \}|$$

## 예시

```ts
const ost = new OrderStatisticTree();

ost.insert(5);
ost.insert(2);
ost.insert(8);
ost.insert(2);          // 중복 허용: S = {2, 2, 5, 8}

ost.kth(1);             // 2
ost.kth(2);             // 2
ost.kth(3);             // 5
ost.kth(4);             // 8

ost.rank(2);            // 0
ost.rank(5);            // 2
ost.rank(8);            // 3
ost.rank(10);           // 4

ost.delete(2);          // S = {2, 5, 8}
ost.kth(1);             // 2
ost.rank(5);            // 1
```
