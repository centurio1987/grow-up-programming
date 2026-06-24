# Link-Cut Tree

## 한 줄 요약

> `LinkCutTree`는 노드 수를 받아, 동적으로 간선을 추가·제거하며 두 노드의 연결 여부를 확인하는 자료구조이다.

## 스토리

광역 전력망 관리 센터는 수천 개의 발전소와 변전소를 연결하는 송전선을 관리한다. 폭풍으로 송전선이 끊어지거나 복구되는 일이 빈번하다. 관제실에서는 "지금 발전소 A에서 변전소 B까지 전력이 공급되고 있는가?"를 언제든 물어볼 수 있어야 한다.

노드 수가 수만 개이고 간선 변경과 연결 확인이 뒤섞여 들어오므로, 모든 연산을 빠르게 처리해야 한다. 초기에는 아무 송전선도 연결되지 않은 상태이다.

노드 수 $n$을 받아, 두 노드를 간선으로 연결하거나 끊고 연결 여부를 확인하는 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class LinkCutTree {
  constructor(n: number): void;
  link(u: number, v: number): void;
  cut(u: number, v: number): void;
  connected(u: number, v: number): boolean;
}
```

- `n` — 노드 수. 노드는 $0$-기반 정수 $[0, n)$
- `link(u, v)` — 서로 다른 트리에 속한 노드 $u$와 $v$를 간선으로 연결한다. 반환값 없음
- `cut(u, v)` — 노드 $u$와 $v$ 사이에 존재하는 간선을 제거한다. 반환값 없음
- `connected(u, v)` — 노드 $u$와 $v$가 같은 트리에 속하면 `true`, 다른 트리에 속하면 `false`를 반환한다

## 제약 조건

- $1 \leq n \leq 10^4$
- $0 \leq u, v < n$
- 질의 수 $q \leq 10^4$
- `link`는 두 노드가 서로 다른 트리에 있을 때만 호출된다(사이클 없음)
- `cut`은 두 노드 사이에 간선이 실제로 존재할 때만 호출된다
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

초기에는 모든 $n$개의 노드가 각자 독립된 트리를 이룬다.

**link(u, v):** 노드 $u$를 루트로 하는 트리와 $v$를 루트로 하는 트리를 간선 $(u, v)$로 합친다.

**cut(u, v):** 간선 $(u, v)$를 제거해 하나의 트리를 두 개의 트리로 분리한다.

**connected(u, v):** $u$와 $v$가 같은 트리에 속하면 `true`를 반환한다. $u = v$이면 항상 `true`이다.

## 예시

```ts
const lct = new LinkCutTree(5);

lct.connected(0, 1);   // false — 초기엔 모두 분리

lct.link(0, 1);
lct.link(1, 2);
lct.connected(0, 2);   // true — 0-1-2 경로 존재
lct.connected(0, 3);   // false — 3은 별도 트리

lct.link(3, 4);
lct.connected(3, 4);   // true
lct.connected(2, 3);   // false — 두 트리가 아직 분리됨

lct.cut(1, 2);
lct.connected(0, 2);   // false — 간선 제거로 분리
lct.connected(0, 1);   // true — 0-1은 여전히 연결

lct.connected(0, 0);   // true — 자기 자신은 항상 연결
```
