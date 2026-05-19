/**
 * BFS Shortest Path (무가중치 최단 경로)
 *
 * 무가중치 그래프에서 한 출발점 $s$로부터 모든 정점까지의 최단 거리(간선 개수)를 구한다.
 * BFS(너비 우선 탐색)를 사용하여 $O(V + E)$ 시간에 해결한다.
 *
 * 정점 $v$까지의 거리 $d(v)$는 $s$에서 $v$로 가는 최소 간선 수로 정의된다:
 *
 * $$d(v) = \min_{P \in \mathcal{P}(s, v)} |P|$$
 *
 * 여기서 $\mathcal{P}(s, v)$는 $s$에서 $v$로 가는 모든 경로의 집합이며,
 * $|P|$는 경로 $P$의 간선 수이다.
 *
 * 도달 불가능한 정점에 대해서는 $-1$을 반환한다.
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 간선 목록 $[u, v]$ ($0 \leq E \leq 10^{5}$, 무향)
 * @param source - 출발 정점 ($0 \leq s < n$)
 * @returns 길이 $n$의 배열, 인덱스 $i$의 값은 $d(i)$ (도달 불가 시 $-1$)
 */
export function bfsShortestPath(
  _n: number,
  _edges: [number, number][],
  _source: number,
): number[] {
  throw new Error("Not implemented");
}
