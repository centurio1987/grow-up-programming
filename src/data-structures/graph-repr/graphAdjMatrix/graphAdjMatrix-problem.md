# GraphAdjMatrix (인접 행렬 그래프)

## 한 줄 요약
> 인접 행렬로 밀집 그래프를 표현하고, O(1) 간선 조회와 BFS/DFS 탐색을 구현한다.

## 스토리

전국 주요 도시 30개를 연결하는 물류 네트워크를 설계하고 있다. 각 도시 쌍 사이에는 거리(가중치)가 존재하고, 모든 도시 간 최단 경로를 반복적으로 조회해야 한다.

이처럼 정점 수가 적고 간선이 많은 밀집 그래프(Dense Graph)에서는 인접 행렬이 적합하다. V=30이면 행렬 크기는 30×30=900으로 충분히 작다. 반면 두 도시 간 직항 여부를 O(1)로 즉시 확인할 수 있어 Floyd-Warshall과 같은 모든 쌍 최단 경로 알고리즘과 찰떡궁합이다.

BFS로 특정 도시에서 도달 가능한 모든 도시를 탐색하고, DFS로 경로 추적에 활용한다. `hasEdge`와 `weight`가 O(1)이므로 탐색 중 간선 확인 비용이 없다.

## 함수 인터페이스

```ts
export class GraphAdjMatrix {
  constructor(size: number, directed: boolean = false)
  addEdge(u: number, v: number, weight?: number): void
  removeEdge(u: number, v: number): void
  hasEdge(u: number, v: number): boolean
  weight(u: number, v: number): number | undefined
  neighbors(v: number): number[]
  bfs(start: number): number[]
  dfs(start: number): number[]
  vertexCount(): number
}
```

## 제약 조건

- $V \leq 10^3$ (행렬 크기 V² = 10⁶ 셀)
- 가중치 $w \geq 1$ (기본값 1)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 정점 번호는 0-indexed ($0 \leq u, v < V$)

## 문제 상세

**표현 방식**

`matrix[u][v]`에 가중치를 저장한다. 간선이 없으면 `undefined`(또는 `null`)으로 초기화한다.

```
matrix = [
  [undef, 1,     undef, 5    ],  // 0번 정점의 행
  [1,     undef, 2,     undef],  // 1번 정점의 행
  [undef, 2,     undef, 3    ],  // 2번 정점의 행
  [5,     undef, 3,     undef],  // 3번 정점의 행
]
```

**무방향 vs 방향 그래프**

- `directed = false`(기본값): `matrix[u][v] = matrix[v][u] = weight`
- `directed = true`: `matrix[u][v] = weight`만 설정

**BFS/DFS 특성**

인접 행렬에서 특정 정점의 이웃을 구하려면 해당 행 전체를 스캔해야 한다 — O(V). 따라서 BFS/DFS의 총 복잡도는 O(V²)이다. 밀집 그래프에서는 이것이 인접 리스트의 O(V+E)와 유사하거나 더 유리하다.

**neighbors 구현**

```
neighbors(v):
  result = []
  for u in 0..V-1:
    if matrix[v][u] is not undefined:
      result.push(u)
  return result
```

## 예시

```ts
// 4개 도시: 서울(0), 부산(1), 대구(2), 광주(3)
const g = new GraphAdjMatrix(4, false);

g.addEdge(0, 1, 325); // 서울-부산 325km
g.addEdge(0, 2, 237); // 서울-대구 237km
g.addEdge(1, 2, 88);  // 부산-대구 88km
g.addEdge(2, 3, 173); // 대구-광주 173km

g.hasEdge(0, 1); // true
g.hasEdge(0, 3); // false (직항 없음)
g.weight(0, 1);  // 325
g.weight(1, 0);  // 325 (무방향)

g.neighbors(0);  // [1, 2]
g.bfs(0);        // [0, 1, 2, 3]

g.vertexCount(); // 4
```
