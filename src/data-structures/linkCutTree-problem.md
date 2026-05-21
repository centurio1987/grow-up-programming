# Link-Cut Tree (Sleator–Tarjan)

## 함수 인터페이스

```ts
export class LinkCutTree {
  constructor(n: number);
  link(u: number, v: number): void;
  cut(u: number, v: number): void;
  connected(u: number, v: number): boolean;
}
```

## 제약 조건

- $1 \leq n \leq 10^4$
- 질의 수 $q \leq 10^4$
- 노드는 $0$-기반 정수: $0 \leq v < n$

## 문제 상세

동적 포레스트(forest)에서 다음 연산을 모두 분할 상환 $O(\log n)$에 처리하는 자료구조를 구현하라. 초기에는 모든 노드가 독립된 트리이다.

1. $\mathrm{link}(u, v)$: 두 트리를 간선 $(u, v)$로 연결
2. $\mathrm{cut}(u, v)$: 간선 $(u, v)$를 제거
3. $\mathrm{connected}(u, v)$: $u$와 $v$가 같은 트리에 속하는지 확인

### 메서드 명세

- `new LinkCutTree(n)` — 크기 $n$의 Link-Cut Tree를 생성한다. 초기엔 모든 노드가 독립된 트리이다.
- `link(u, v)` — 노드 $u$와 $v$를 간선으로 연결한다. 두 노드는 서로 다른 트리에 있어야 한다.
- `cut(u, v)` — 노드 $u$와 $v$ 사이의 간선을 제거한다. 간선이 실제 존재해야 한다.
- `connected(u, v)` — 노드 $u$와 $v$가 같은 트리(연결 컴포넌트)에 속하면 `true`를 반환한다.

## 예시

```ts
const lct = new LinkCutTree(5);

lct.connected(0, 1);     // false
lct.link(0, 1);
lct.link(1, 2);
lct.connected(0, 2);     // true
lct.connected(0, 3);     // false

lct.link(3, 4);
lct.connected(3, 4);     // true
lct.connected(2, 3);     // false

lct.cut(1, 2);
lct.connected(0, 2);     // false
lct.connected(0, 1);     // true
```
