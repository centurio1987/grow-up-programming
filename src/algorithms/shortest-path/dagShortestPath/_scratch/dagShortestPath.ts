// E3 자기검증용 스크래치 — 가이드 본문에 실리는 세 버전(naive DFS / memoized DP / 최종 Kahn's+relax)을
// 그대로 옮겨 실행하고, 본문에 쓸 모든 수치를 실측으로 확정한다.

// ── 원형: DFS로 모든 경로 열거 ──────────────────────────────
function naiveAllPaths(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  function best(u: number, target: number, cost: number): number {
    if (u === target) return cost;
    let b = Infinity;
    for (const [v, w] of adj[u]) {
      b = Math.min(b, best(v, target, cost + w));
    }
    return b;
  }

  const dist = new Array(n).fill(Infinity);
  for (let v = 0; v < n; v++) {
    dist[v] = v === src ? 0 : best(src, v, 0);
  }
  return dist;
}

// 지수 폭발 카운터용 (호출 횟수 측정)
function naiveCallCount(
  n: number,
  edges: [number, number, number][],
  src: number,
  target: number,
): number {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  let calls = 0;
  function rec(u: number, cost: number): number {
    calls++;
    if (u === target) return cost;
    let b = Infinity;
    for (const [v, w] of adj[u]) b = Math.min(b, rec(v, cost + w));
    return b;
  }
  rec(src, 0);
  return calls;
}

// ── 개선: 메모이제이션 top-down DP ──────────────────────────
function dagShortestPathMemo(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  // reverse adjacency: v를 만드는 (u, w) 목록
  const rev: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) rev[v].push([u, w]);

  const memo = new Array<number | undefined>(n).fill(undefined);

  function dp(v: number): number {
    if (memo[v] !== undefined) return memo[v]!;
    if (v === src) {
      memo[v] = 0;
      return 0;
    }
    let best = Infinity;
    for (const [u, w] of rev[v]) {
      const du = dp(u);
      if (du !== Infinity) best = Math.min(best, du + w);
    }
    memo[v] = best;
    return best;
  }

  const dist = new Array(n).fill(Infinity);
  for (let v = 0; v < n; v++) dist[v] = dp(v);
  return dist;
}

// ── 최종: Kahn's 위상 정렬 + 순서대로 완화 ──────────────────
function dagShortestPath(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  const inDegree = new Array(n).fill(0);
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    inDegree[v]++;
  }

  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (inDegree[v] === 0) queue.push(v);

  const topoOrder: number[] = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++]!;
    topoOrder.push(u);
    for (const [v] of adj[u]) {
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    }
  }

  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (const u of topoOrder) {
    if (dist[u] === Infinity) continue;
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }

  return dist;
}

// ── 검증 ─────────────────────────────────────────────────
function show(label: string, val: unknown) {
  console.log(label, "=>", JSON.stringify(val));
}

console.log("=== 1. 가이드 시뮬레이션 예시 (구 가이드에서 그대로 가져온 그래프) ===");
{
  const n = 5;
  const edges: [number, number, number][] = [
    [0, 1, 2],
    [0, 2, 6],
    [1, 2, -4],
    [1, 3, 1],
    [2, 3, 3],
    [3, 4, 2],
  ];
  const src = 0;
  show("memo", dagShortestPathMemo(n, edges, src));
  show("final", dagShortestPath(n, edges, src));
  show("naiveAllPaths", naiveAllPaths(n, edges, src));
}

console.log("=== 2. problem.md 예시들 ===");
{
  const edges: [number, number, number][] = [
    [0, 1, 2],
    [0, 2, 4],
    [1, 2, -3],
    [1, 3, 5],
    [2, 3, 1],
  ];
  show("final(4,...,0) expect [0,2,-1,0]", dagShortestPath(4, edges, 0));
}
{
  show(
    "final(3,[[0,1,1]],0) expect [0,1,Infinity]",
    dagShortestPath(3, [[0, 1, 1]], 0),
  );
}
{
  show(
    "final(3,[[0,2,1],[1,2,1]],2) expect [Infinity,Infinity,0]",
    dagShortestPath(3, [[0, 2, 1], [1, 2, 1]], 2),
  );
}
{
  show(
    "final(4,[[2,3,1],[1,2,1],[0,1,1]],0) expect [0,1,2,3]",
    dagShortestPath(4, [[2, 3, 1], [1, 2, 1], [0, 1, 1]], 0),
  );
}

console.log("=== 3. 엣지케이스: V=1, 간선 없음 ===");
show("final(1,[],0) expect [0]", dagShortestPath(1, [], 0));

console.log("=== 4. 원형 DFS 비용 폭발 체감 (분기 있는 체인) ===");
{
  // 정점 0..2k, 각 짝수 단계에서 두 갈래로 분기했다가 다시 합류하는 구조를 만들어 경로 수 측정
  // 간단한 버전: "다이아몬드" k개를 직렬로 이어붙임 -> 경로 수 2^k
  function buildDiamondChain(k: number): { n: number; edges: [number, number, number][] } {
    const edges: [number, number, number][] = [];
    let cur = 0;
    for (let i = 0; i < k; i++) {
      const a = cur, mid1 = cur + 1, mid2 = cur + 2, b = cur + 3;
      edges.push([a, mid1, 1], [a, mid2, 1], [mid1, b, 1], [mid2, b, 1]);
      cur = b;
    }
    return { n: cur + 1, edges };
  }
  for (const k of [1, 2, 3, 4, 5, 6]) {
    const { n, edges } = buildDiamondChain(k);
    const calls = naiveCallCount(n, edges, 0, n - 1);
    console.log(`k=${k} (정점 ${n}개) -> naive DFS 호출 수 = ${calls}, 2^k = ${2 ** k}`);
  }
}

console.log("=== 5. 무작위 교차검증 (memo vs final vs naiveAllPaths, 작은 랜덤 DAG) ===");
{
  function randomDag(n: number, extraEdgeProb: number): [number, number, number][] {
    // 인덱스 순서를 위상 순서로 강제 (u < v인 간선만 생성) → 항상 DAG
    const edges: [number, number, number][] = [];
    for (let u = 0; u < n; u++) {
      for (let v = u + 1; v < n; v++) {
        if (Math.random() < extraEdgeProb) {
          const w = Math.floor(Math.random() * 21) - 10; // -10..10
          edges.push([u, v, w]);
        }
      }
    }
    return edges;
  }
  let allMatch = true;
  for (let trial = 0; trial < 200; trial++) {
    const n = 2 + Math.floor(Math.random() * 6); // 2..7
    const edges = randomDag(n, 0.4);
    const src = Math.floor(Math.random() * n);
    const dFinal = dagShortestPath(n, edges, src);
    const dMemo = dagShortestPathMemo(n, edges, src);
    const dNaive = naiveAllPaths(n, edges, src);
    const norm = (arr: number[]) => arr.map((x) => (x === Infinity ? "Inf" : x)).join(",");
    if (norm(dFinal) !== norm(dMemo) || norm(dFinal) !== norm(dNaive)) {
      allMatch = false;
      console.log("MISMATCH", { n, edges, src, dFinal, dMemo, dNaive });
    }
  }
  console.log("무작위 200회 교차검증 전부 일치:", allMatch);
}

console.log("=== 6-pre. Dijkstra greedy가 음수 간선에서 왜 틀리는지 구체 수치 ===");
{
  // 0->1 (5), 0->2 (1), 1->2 (-10)
  // Dijkstra라면: dist[2]=1로 먼저 확정(node1의 dist=5보다 작으므로) → 이후 1→2(-10) 완화를 반영 못 함
  // DAG 알고리즘(위상순서 0,1,2)이라면: node1을 먼저 처리해 dist[2]가 -5로 정확히 갱신됨
  const edges: [number, number, number][] = [
    [0, 1, 5],
    [0, 2, 1],
    [1, 2, -10],
  ];
  show("dagShortestPath(3, edges, 0) — 정답", dagShortestPath(3, edges, 0));
  // Dijkstra류 그리디를 흉내: dist 오름차순으로 "확정"하며 확정 후엔 더 갱신하지 않는다고 가정
  function dijkstraStyleWrong(
    n: number,
    edges: [number, number, number][],
    src: number,
  ): number[] {
    const adj: [number, number][][] = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edges) adj[u].push([v, w]);
    const dist = new Array(n).fill(Infinity);
    dist[src] = 0;
    const finalized = new Array(n).fill(false);
    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      for (let v = 0; v < n; v++) {
        if (!finalized[v] && (u === -1 || dist[v] < dist[u])) u = v;
      }
      if (u === -1 || dist[u] === Infinity) break;
      finalized[u] = true; // 확정 후에는 더 갱신하지 않는다 (Dijkstra의 가정)
      for (const [v, w] of adj[u]) {
        if (!finalized[v] && dist[u] + w < dist[v]) dist[v] = dist[u] + w;
      }
    }
    return dist;
  }
  show(
    "dijkstraStyleWrong(3, edges, 0) — greedy 오답",
    dijkstraStyleWrong(3, edges, 0),
  );
}

console.log("=== 6. Infinity 스킵 없이도 안전한지 확인 (JS 부동소수점 특성) ===");
{
  // dist[u] = Infinity 인 상태에서 스킵 없이 dist[u] + w 를 그대로 완화식에 넣으면 어떻게 되는지
  const w = -1e9;
  console.log("Infinity + (-1e9) =", Infinity + w); // Infinity 유지되는지 확인
  console.log("Infinity < Infinity =", Infinity < Infinity); // false여야 갱신 안 함
}

console.log("=== 7. 스스로 점검하기 문제용 검증 ===");
{
  const edges: [number, number, number][] = [
    [0, 1, 3],
    [0, 2, -2],
    [1, 3, 4],
    [2, 3, 6],
  ];
  show("Q1 dagShortestPath(4, edges, 0) expect [0,3,-2,4]", dagShortestPath(4, edges, 0));
}
{
  // Q2: 입력 순서(위상순서 아님) 그대로 한 번만 완화하면?
  function singlePassInputOrder(n: number, edges: [number, number, number][], src: number): number[] {
    const dist = new Array(n).fill(Infinity);
    dist[src] = 0;
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
    return dist;
  }
  const edges: [number, number, number][] = [[2, 3, 1], [1, 2, 1], [0, 1, 1]];
  show("Q2 singlePassInputOrder expect [0,1,Inf,Inf]", singlePassInputOrder(4, edges, 0));
  show("Q2 correct dagShortestPath expect [0,1,2,3]", dagShortestPath(4, edges, 0));
}
