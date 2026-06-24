/**
 * GraphAdjMatrix (인접 행렬 그래프)
 *
 * 밀집 그래프 Floyd-Warshall — 도시 간 최단 경로를 구할 때
 * 정점이 적고 간선이 많은 경우 인접 행렬이 더 효율적이다.
 *
 * 인접 행렬 방식은 밀집 그래프(Dense Graph)에 유리하다.
 * 두 정점의 연결 여부와 가중치를 O(1)에 확인 가능하다.
 *
 * 요구사항:
 * - constructor: size 크기의 인접 행렬 초기화
 * - addEdge: 간선 추가 (undirected면 양방향 추가, 가중치 기본값 1)
 * - removeEdge: 간선 제거
 * - hasEdge: 두 정점 간 간선 존재 여부 O(1) 확인
 * - weight: 두 정점 간 가중치 반환 (없으면 undefined)
 * - neighbors: 특정 정점과 연결된 정점 목록
 * - bfs: 너비 우선 탐색으로 방문 순서 반환
 * - dfs: 깊이 우선 탐색으로 방문 순서 반환
 * - vertexCount: 정점 수 반환
 *
 * 시간복잡도:
 * - addEdge: O(1)
 * - removeEdge: O(1)
 * - hasEdge: O(1)
 * - weight: O(1)
 * - neighbors: O(V)
 * - bfs: O(V²)
 * - dfs: O(V²)
 * - vertexCount: O(1)
 *
 * 공간복잡도: O(V²)
 */

export class GraphAdjMatrix {
  private matrix: (number | undefined)[][];
  private directed: boolean;
  private size: number;

  constructor(size: number, directed: boolean = false) {
    throw new Error("Not implemented");
  }

  addEdge(u: number, v: number, weight: number = 1): void {
    throw new Error("Not implemented");
  }

  removeEdge(u: number, v: number): void {
    throw new Error("Not implemented");
  }

  hasEdge(u: number, v: number): boolean {
    throw new Error("Not implemented");
  }

  weight(u: number, v: number): number | undefined {
    throw new Error("Not implemented");
  }

  neighbors(v: number): number[] {
    throw new Error("Not implemented");
  }

  bfs(start: number): number[] {
    throw new Error("Not implemented");
  }

  dfs(start: number): number[] {
    throw new Error("Not implemented");
  }

  vertexCount(): number {
    throw new Error("Not implemented");
  }
}
