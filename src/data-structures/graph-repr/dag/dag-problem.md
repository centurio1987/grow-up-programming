# DAG (Directed Acyclic Graph, 방향 비순환 그래프)

## 한 줄 요약
> 사이클이 없는 방향 그래프를 구현하고, 위상 정렬과 최장 경로로 빌드 의존성을 해결한다.

## 스토리

모던 빌드 시스템(Gradle, Makefile, Bazel)에서는 수백 개의 태스크가 서로 의존한다. "compile → test → package → deploy" 같은 의존 관계를 그래프로 표현하면, 어떤 태스크를 먼저 실행해야 하는지 결정할 수 있다.

의존성 그래프에는 사이클이 있으면 안 된다 — A가 B에 의존하고 B가 다시 A에 의존하면 영원히 실행을 시작할 수 없다. 따라서 이 그래프는 DAG(방향 비순환 그래프)여야 한다.

위상 정렬(Topological Sort)은 의존성이 선행되는 순서로 태스크를 나열한다. 최장 경로(Longest Path)는 직렬 실행 시 전체 빌드에 걸리는 최소 예상 시간(Critical Path)을 계산하는 데 활용된다.

## 함수 인터페이스

```ts
export class DAG {
  constructor()
  addVertex(v: number): void
  addEdge(u: number, v: number, weight?: number): void  // 사이클 감지 — 사이클이면 throw
  topologicalSort(): number[]    // O(V+E) Kahn's algorithm (BFS 기반)
  longestPath(): number          // 가중치 합 기준 최장 경로 (DP)
  hasCycle(): boolean            // 항상 false여야 함 (addEdge에서 이미 거부)
  vertexCount(): number
  edgeCount(): number
}
```

## 제약 조건

- $V \leq 10^3$, $E \leq 5 \times 10^3$
- 가중치 $w \geq 1$ (기본값 1)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 사이클 있는 간선 추가 시 반드시 `throw Error`

## 문제 상세

**위상 정렬 — Kahn's Algorithm**

진입 차수(in-degree)가 0인 정점부터 시작한다. 해당 정점을 결과에 추가하고, 이웃 정점의 진입 차수를 1 감소시킨다. 진입 차수가 0이 된 정점을 큐에 추가한다. 사이클이 있으면 모든 정점이 처리되지 않으므로 검출 가능하다.

**최장 경로 — DP**

위상 정렬 순서로 정점을 처리하면서 각 정점까지의 최장 거리를 갱신한다.

```
dp[v] = max(dp[u] + weight(u→v)) for all u → v
```

시작 정점의 dp = 0. 위상 순서로 이웃을 갱신하면 O(V+E).

**사이클 감지**

`addEdge(u, v)` 호출 시 DFS로 v에서 u로 도달 가능한지 검사한다. 도달 가능하면 추가하면 사이클이 생기므로 throw한다.

## 예시

```ts
const dag = new DAG();

// 빌드 태스크: compile(0), test(1), lint(2), package(3), deploy(4)
[0, 1, 2, 3, 4].forEach((v) => dag.addVertex(v));

dag.addEdge(0, 1, 3); // compile → test (3분)
dag.addEdge(0, 2, 1); // compile → lint (1분)
dag.addEdge(1, 3, 2); // test → package (2분)
dag.addEdge(2, 3, 1); // lint → package (1분)
dag.addEdge(3, 4, 1); // package → deploy (1분)

dag.topologicalSort();
// [0, 1, 2, 3, 4] 또는 [0, 2, 1, 3, 4] — 둘 다 유효

dag.longestPath();
// Critical Path: compile→test→package→deploy = 3+2+1 = 6분

dag.hasCycle(); // false

// 사이클 시도
dag.addEdge(4, 0); // throw Error: "Cycle detected"
```
