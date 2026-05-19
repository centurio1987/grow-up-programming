/**
 * 0-1 BFS (가중치가 0 또는 1인 그래프에서의 최단 경로)
 *
 * 모든 간선의 가중치가 0 또는 1인 그래프에서 한 출발점 $s$로부터 모든 정점까지의
 * 최단 거리(가중치 합)를 구한다. Deque를 활용한 0-1 BFS로 $O(V + E)$ 시간에 해결한다.
 *
 * 가중치 함수 $w: E \to \{0, 1\}$이 주어질 때, 정점 $v$까지의 거리 $d(v)$는:
 *
 * $$d(v) = \min_{P \in \mathcal{P}(s, v)} \sum_{e \in P} w(e)$$
 *
 * 핵심 아이디어: 가중치 $0$ 간선은 deque의 앞쪽(push_front)에,
 * 가중치 $1$ 간선은 뒤쪽(push_back)에 넣어 거리 단조성을 유지한다.
 *
 * 도달 불가능한 정점에 대해서는 $-1$을 반환한다.
 *
 * @param n - 정점의 수 ($1 \leq V \leq 10^{5}$, 정점은 $0 \ldots n-1$)
 * @param edges - 간선 목록 $[u, v, w]$ ($w \in \{0, 1\}$, $0 \leq E \leq 10^{5}$, 유향)
 * @param source - 출발 정점 ($0 \leq s < n$)
 * @returns 길이 $n$의 배열, 인덱스 $i$의 값은 $d(i)$ (도달 불가 시 $-1$)
 */
export function zeroOneBfs(
  _n: number,
  _edges: [number, number, number][],
  _source: number,
): number[] {
  throw new Error("Not implemented");
}
