/**
 * GraphAdjList (인접 리스트 그래프)
 *
 * 소셜 네트워크 친구 추천 — 팔로우 관계를 그래프로 표현하고
 * BFS로 "2단계 친구"를 찾는 자료구조.
 *
 * 인접 리스트 방식은 희소 그래프(Sparse Graph)에 유리하다.
 * 각 정점이 자신과 연결된 정점 목록만 유지하므로 공간 효율이 높다.
 *
 * 요구사항:
 * - addVertex: 정점 추가
 * - addEdge: 간선 추가 (undirected면 양방향 추가, 가중치 기본값 1)
 * - removeEdge: 간선 제거
 * - neighbors: 특정 정점의 인접 정점 목록 반환
 * - bfs: 너비 우선 탐색으로 방문 순서 반환
 * - dfs: 깊이 우선 탐색으로 방문 순서 반환
 * - hasPath: 두 정점 간 경로 존재 여부
 * - vertexCount: 정점 수 반환
 * - edgeCount: 간선 수 반환
 *
 * 시간복잡도:
 * - addVertex: O(1)
 * - addEdge: O(1)
 * - removeEdge: O(degree(v))
 * - neighbors: O(1)
 * - bfs: O(V + E)
 * - dfs: O(V + E)
 * - hasPath: O(V + E)
 * - vertexCount: O(1)
 * - edgeCount: O(1)
 *
 * 공간복잡도: O(V + E)
 */

interface Edge {
  vertex: number;
  weight: number;
}

export class GraphAdjList {
  private adjList: Map<number, Edge[]>;
  private directed: boolean;
  private _edgeCount: number;

  constructor(directed: boolean = false) {
    throw new Error("Not implemented");
  }

  addVertex(v: number): void {
    throw new Error("Not implemented");
  }

  addEdge(u: number, v: number, weight: number = 1): void {
    throw new Error("Not implemented");
  }

  removeEdge(u: number, v: number): void {
    throw new Error("Not implemented");
  }

  neighbors(v: number): Array<{ vertex: number; weight: number }> {
    throw new Error("Not implemented");
  }

  bfs(start: number): number[] {
    throw new Error("Not implemented");
  }

  dfs(start: number): number[] {
    throw new Error("Not implemented");
  }

  hasPath(u: number, v: number): boolean {
    throw new Error("Not implemented");
  }

  vertexCount(): number {
    throw new Error("Not implemented");
  }

  edgeCount(): number {
    throw new Error("Not implemented");
  }
}
