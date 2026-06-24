# Union-Find

## 한 줄 요약

> `UnionFind`는 원소 수를 받아, 서로소 집합들의 병합과 같은 집합 여부 확인을 지원하는 자료구조이다.

## 스토리

사회관계망 분석팀은 수십만 명의 사용자 계정을 관리한다. "친구 추가" 이벤트가 들어오면 두 사람의 그룹이 합쳐지고, 서비스팀은 "이 두 사람이 같은 그룹에 속하는가?"를 수시로 확인해야 한다.

그룹 병합과 조회가 수십만 번씩 번갈아 들어오므로 모든 연산이 빠르게 동작해야 한다. 초기에는 모든 사람이 혼자만의 그룹에 속해 있다.

원소 수 $n$을 받아, 두 집합의 병합과 두 원소의 동일 집합 여부 확인, 그리고 대표 원소 조회를 지원하는 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class UnionFind {
  constructor(n: number): void;
  find(x: number): number;
  union(x: number, y: number): void;
  connected(x: number, y: number): boolean;
}
```

- `n` — 원소 수. 원소는 $0$-기반 정수 $[0, n)$
- `find(x)` — 원소 $x$가 속한 집합의 대표 원소를 반환한다
- `union(x, y)` — 원소 $x$와 $y$가 속한 집합을 병합한다. 반환값 없음
- `connected(x, y)` — 원소 $x$와 $y$가 같은 집합에 속하면 `true`, 다른 집합이면 `false`를 반환한다

## 제약 조건

- $1 \leq n \leq 10^5$
- $0 \leq x, y < n$
- 질의 수 $q \leq 10^5$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

초기에는 모든 원소가 자기 자신을 대표 원소로 갖는다. $\text{find}(i) = i$ ($0 \leq i < n$)

**find(x):** 원소 $x$가 속한 집합의 대표 원소를 반환한다. 같은 집합의 두 원소는 반드시 동일한 대표 원소를 가진다.

**union(x, y):** 원소 $x$를 포함하는 집합과 $y$를 포함하는 집합을 하나로 합친다. $x$와 $y$가 이미 같은 집합에 있으면 아무 일도 하지 않는다.

**connected(x, y):** $\text{find}(x) = \text{find}(y)$이면 `true`를 반환한다. $x = y$이면 항상 `true`이다.

## 예시

```ts
const uf = new UnionFind(5);

uf.connected(0, 1);       // false — 초기엔 모두 분리

uf.union(0, 1);
uf.connected(0, 1);       // true

uf.union(2, 3);
uf.connected(0, 3);       // false — 두 그룹이 아직 분리

uf.union(1, 2);           // {0, 1}과 {2, 3} 병합
uf.connected(0, 3);       // true — 이제 같은 집합
uf.connected(0, 4);       // false — 4는 여전히 독립

uf.find(0) === uf.find(3); // true — 같은 대표 원소
uf.find(4) === uf.find(0); // false — 다른 대표 원소

uf.union(0, 0);           // 자기 자신과 union, 아무 변화 없음
uf.connected(0, 0);       // true
```
