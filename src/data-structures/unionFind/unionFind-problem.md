# Union-Find (Disjoint Set Union, DSU)

## 함수 인터페이스

```ts
export class UnionFind {
  constructor(n: number);
  find(x: number): number;
  union(x: number, y: number): void;
  connected(x: number, y: number): boolean;
}
```

## 제약 조건

- $1 \leq n \leq 10^5$
- 질의 수 $q \leq 10^5$
- 원소는 $0$-기반 정수: $0 \leq x < n$

## 문제 상세

서로소 집합들의 집합 $\mathcal{F} = \{ S_1, S_2, \ldots, S_k \}$ 에 대해 다음 두 연산을 평균 $O(\alpha(n))$ (역 아커만 함수, 사실상 상수)에 처리하는 자료구조를 구현하라.

1. $\mathrm{find}(x)$: $x$가 속한 집합의 대표 원소를 반환
2. $\mathrm{union}(x, y)$: $x$와 $y$가 속한 집합을 병합

초기에는 각 원소가 자기 자신을 대표 원소로 갖는다:

$$\forall\, i \in [0, n),\; \mathrm{parent}[i] = i$$

### 메서드 명세

- `new UnionFind(n)` — 크기 $n$의 Union-Find를 생성한다. 각 원소는 자기 자신을 대표 원소로 갖는다.
- `find(x)` — 원소 $x$가 속한 집합의 대표 원소를 반환한다.
- `union(x, y)` — 원소 $x$와 $y$가 속한 집합을 병합한다. 반환값은 없다.
- `connected(x, y)` — 원소 $x$와 $y$가 같은 집합에 속하면 `true`를 반환한다:

  $$\mathrm{connected}(x, y) \iff \mathrm{find}(x) = \mathrm{find}(y)$$

## 예시

```ts
const uf = new UnionFind(5);

uf.connected(0, 1);      // false
uf.union(0, 1);
uf.connected(0, 1);      // true

uf.union(2, 3);
uf.connected(0, 3);      // false

uf.union(1, 2);          // {0, 1, 2, 3} 모두 같은 집합
uf.connected(0, 3);      // true
uf.connected(0, 4);      // false

uf.find(0) === uf.find(3);   // true
uf.find(4) === uf.find(0);   // false
```
