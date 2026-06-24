# GraphAdjList (인접 리스트 그래프)

## 한 줄 요약
> 인접 리스트로 그래프를 표현하고, BFS/DFS 탐색과 경로 탐색을 구현한다.

## 스토리

소셜 미디어 플랫폼에서 "친구 추천" 기능을 개발해야 한다. 사용자 A가 사용자 B를 팔로우하면 A→B 방향 간선이 추가된다. 무방향 모드에서는 맞팔로우로 간주하여 양방향으로 간선을 추가한다.

이 플랫폼에서는 "2단계 친구" — 즉, 내가 직접 팔로우하지 않지만 내 친구가 팔로우하는 사람 — 을 추천해야 한다. BFS로 시작 정점에서 거리 2에 있는 정점을 모두 찾으면 이 문제를 해결할 수 있다.

소셜 네트워크는 수백만 명의 사용자가 있지만 실제로 연결된 사람 수는 제한적이다. 따라서 인접 행렬(O(V²) 공간)이 아닌 인접 리스트(O(V+E) 공간)를 사용한다.

## 함수 인터페이스

```ts
export class GraphAdjList {
  constructor(directed: boolean = false)
  addVertex(v: number): void
  addEdge(u: number, v: number, weight?: number): void  // undirected면 양방향 추가
  removeEdge(u: number, v: number): void
  neighbors(v: number): Array<{ vertex: number; weight: number }>
  bfs(start: number): number[]        // BFS 방문 순서
  dfs(start: number): number[]        // DFS 방문 순서
  hasPath(u: number, v: number): boolean
  vertexCount(): number
  edgeCount(): number
}
```

## 제약 조건

- $V \leq 10^3$, $E \leq 5 \times 10^3$
- 가중치 $w \geq 1$ (기본값 1)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 동일한 두 정점 사이에 여러 간선(멀티 엣지) 허용

## 문제 상세

**표현 방식**

인접 리스트는 `Map<number, Array<{vertex, weight}>>` 형태로 구현한다. 각 정점 키에 인접 정점과 가중치 목록이 배열로 매핑된다.

**무방향 vs 방향 그래프**

- `directed = false`(기본값): `addEdge(u, v)` 호출 시 u→v, v→u 모두 추가. `edgeCount`는 논리 간선 1개로 계산.
- `directed = true`: u→v만 추가.

**BFS 탐색**

큐(Queue)와 방문 집합(Set)을 사용한다. 시작 정점을 큐에 넣고, 꺼낼 때마다 미방문 인접 정점을 큐에 추가한다. 방문 순서를 배열로 반환한다.

**DFS 탐색**

스택(재귀 또는 명시적 스택)과 방문 집합을 사용한다. 시작 정점에서 깊이 우선으로 탐색하며 방문 순서를 기록한다.

**경로 탐색**

`hasPath(u, v)`는 BFS 또는 DFS로 u에서 v까지 도달 가능한지 확인한다. 자기 자신(u === v)은 항상 true를 반환한다.

## 예시

```ts
const g = new GraphAdjList(false); // 무방향 그래프

// 소셜 네트워크 구성
// Alice(0) — Bob(1) — Carol(2)
//             |
//           Dave(3)
[0, 1, 2, 3].forEach((v) => g.addVertex(v));
g.addEdge(0, 1); // Alice — Bob
g.addEdge(1, 2); // Bob — Carol
g.addEdge(1, 3); // Bob — Dave

// BFS: Alice 기준 탐색 순서
g.bfs(0); // [0, 1, 2, 3]

// 2단계 친구 찾기 (Alice의 2hop 이웃)
// BFS depth=2까지 탐색하면 Carol(2), Dave(3) 추천

// 경로 확인
g.hasPath(0, 2); // true — Alice → Bob → Carol
g.hasPath(0, 3); // true — Alice → Bob → Dave

g.vertexCount(); // 4
g.edgeCount();   // 3
```
