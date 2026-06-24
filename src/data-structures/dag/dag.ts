/**
 * DAG (Directed Acyclic Graph, 방향 비순환 그래프)
 *
 * 빌드 시스템 의존성 — Makefile/Gradle의 태스크 의존 그래프.
 * 어떤 태스크를 먼저 실행해야 하는지 위상 정렬로 결정한다.
 *
 * DAG는 사이클이 없는 방향 그래프다. 사이클이 생기면 태스크 간
 * 순환 의존성이 발생해 빌드를 완료할 수 없다.
 *
 * 요구사항:
 * - addVertex: 정점 추가
 * - addEdge: 간선 추가 (사이클 감지 — 사이클이면 throw Error)
 * - topologicalSort: O(V+E) Kahn's algorithm (BFS 기반) 위상 정렬
 * - longestPath: 가중치 합 기준 최장 경로 (DP)
 * - hasCycle: 항상 false여야 함 (addEdge에서 이미 거부)
 * - vertexCount: 정점 수 반환
 * - edgeCount: 간선 수 반환
 *
 * 시간복잡도:
 * - addVertex: O(1)
 * - addEdge: O(V+E) 사이클 감지 포함
 * - topologicalSort: O(V+E)
 * - longestPath: O(V+E)
 * - hasCycle: O(1)
 * - vertexCount: O(1)
 * - edgeCount: O(1)
 *
 * 공간복잡도: O(V+E)
 */

interface DagEdge {
  to: number;
  weight: number;
}

export class DAG {
  private adjList: Map<number, DagEdge[]>;
  private _edgeCount: number;

  constructor() {
    throw new Error("Not implemented");
  }

  addVertex(v: number): void {
    throw new Error("Not implemented");
  }

  addEdge(u: number, v: number, weight: number = 1): void {
    throw new Error("Not implemented");
  }

  topologicalSort(): number[] {
    throw new Error("Not implemented");
  }

  longestPath(): number {
    throw new Error("Not implemented");
  }

  hasCycle(): boolean {
    throw new Error("Not implemented");
  }

  vertexCount(): number {
    throw new Error("Not implemented");
  }

  edgeCount(): number {
    throw new Error("Not implemented");
  }
}
