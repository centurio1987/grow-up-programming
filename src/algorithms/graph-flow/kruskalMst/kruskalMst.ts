export function kruskalMst(
  n: number,
  edges: [number, number, number][],
): number {
  //전제
  //초기화
  edges.sort((a, b) => a[2] - b[2]);
  const rank = Array.from({ length: n }, () => 0);
  const parent = Array.from({ length: n }, (v, k) => k);
  let totalWeight = 0;
  let edgesAdded = 0;
  //핵심 로직
  /**
   * sort edges's weight
   * A rank[i] = 0 초기화
   * parent[i] = i 초기화
   * totalweight = 0;
   * edgesAdded = 0;
   * for edge in edges
   *    if find(u) !== find(v)
   *        union(u,v)
   *        totalWeight += edge[2]
   *        edgesAdded++
   *    if edgesAdded > n -1
   *        return totalWeight
   * return totalWeight
   */
  for (const edge of edges) {
    const [u, v, weight] = edge;
    if (union(u, v, parent, rank)) {
      totalWeight += weight;
      edgesAdded++;
    }

    if (edgesAdded === n - 1) {
      return totalWeight;
    }
  }

  //리턴
  if (edgesAdded !== n - 1) {
    return -1;
  }
  return totalWeight;
}

function find(v: number, parent: number[]): number {
  /**
   * if parent[v] === v; return v;
   * parent[v] = find(parent[v]);
   * return parent[v];
   */
  if (parent[v] === v) return v;
  parent[v] = find(parent[v]!, parent);
  return parent[v];
}

function union(u: number, v: number, parent: number[], rank: number[]) {
  /**
   * ru = find(u), rv = find(v)
   * if(rank[ru] > rank[rv])
   *    parent[rv] = ru
   *    rank[ru]++;
   * else
   *    parent[ru] = rv
   *  rank[rv]++;
   *  */

  const ru = find(u, parent);
  const rv = find(v, parent);
  if (ru === rv) {
    return false;
  }
  if (rank[ru]! > rank[rv]!) {
    parent[rv] = ru;
  } else {
    parent[ru] = rv;
    if (rank[ru]! === rank[rv]!) {
      rank[rv]!++;
    }
  }

  return true;
}
