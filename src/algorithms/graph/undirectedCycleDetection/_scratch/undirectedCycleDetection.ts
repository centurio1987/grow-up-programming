// 가이드 자기검증용 스크래치. 본문에 싣는 모든 코드/수치를 여기서 실제로 실행해 확인한다.

// ---- naive DFS 기반 접근 (출발점 절의 "그나마 실행 가능한 정직한 방법") ----
function undirectedCycleDetectionDFS(n: number, edges: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    adj[v]!.push(u);
  }
  const visited = new Array<boolean>(n).fill(false);

  function dfs(v: number, parent: number): boolean {
    visited[v] = true;
    for (const next of adj[v]!) {
      if (!visited[next]) {
        if (dfs(next, v)) return true;
      } else if (next !== parent) {
        return true;
      }
    }
    return false;
  }

  for (let v = 0; v < n; v++) {
    if (!visited[v]) {
      if (dfs(v, -1)) return true;
    }
  }
  return false;
}

// ---- 기본 union-find (경로 압축/랭크 없음) — 4단계 코드 ----
function undirectedCycleDetectionBasic(n: number, edges: [number, number][]): boolean {
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(v: number): number {
    while (parent[v] !== v) v = parent[v]!;
    return v;
  }

  function union(u: number, v: number): void {
    parent[u] = v;
  }

  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) return true;
    union(ru, rv);
  }
  return false;
}

// ---- 5단계: 기본 구현의 스큐(선형 체인) 관찰 ----
{
  const n = 6;
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]];
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(v: number): number {
    while (parent[v] !== v) v = parent[v]!;
    return v;
  }
  function union(u: number, v: number) {
    parent[u] = v;
  }
  const log: string[] = [];
  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    if (ru !== rv) union(ru, rv);
    log.push(`edge (${u},${v}) -> parent=${JSON.stringify(parent)}`);
  }
  console.log("[5단계] 체인 그래프 union 진행:");
  log.forEach((l) => console.log("  " + l));
  let hops = 0;
  let v = 0;
  while (parent[v] !== v) {
    v = parent[v]!;
    hops++;
  }
  console.log(`[5단계] find(0) 홉 수 = ${hops} (n=${n}, 기대: n-1=${n - 1})`);
}

// ---- 7단계: 최종 union-find (경로 압축 + 랭크) ----
function undirectedCycleDetectionFinal(n: number, edges: [number, number][]): boolean {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array<number>(n).fill(0);

  function find(v: number): number {
    if (parent[v] !== v) {
      parent[v] = find(parent[v]!);
    }
    return parent[v]!;
  }

  function union(u: number, v: number): void {
    if (rank[u]! < rank[v]!) [u, v] = [v, u];
    parent[v] = u;
    if (rank[u] === rank[v]) rank[u]!++;
  }

  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) return true;
    union(ru, rv);
  }
  return false;
}

// ---- 9단계 시뮬레이션과 1:1 대조할 트레이스 (n=5, edges=[[0,1],[1,2],[2,0],[3,4]]) ----
{
  const n = 5;
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 0], [3, 4]];
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  function find(v: number): number {
    if (parent[v] !== v) parent[v] = find(parent[v]!);
    return parent[v]!;
  }
  function union(u: number, v: number) {
    if (rank[u]! < rank[v]!) [u, v] = [v, u];
    parent[v] = u;
    if (rank[u] === rank[v]) rank[u]!++;
  }
  console.log("\n[9단계] 시뮬레이션 대조용 트레이스");
  console.log("  init parent =", [...parent]);
  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    console.log(`  edge (${u},${v}): find(${u})=${ru}, find(${v})=${rv}`);
    if (ru === rv) {
      console.log("  CYCLE! true 반환. parent =", [...parent]);
      break;
    }
    union(ru, rv);
    console.log("  union 후 parent =", [...parent], " rank =", [...rank]);
  }
}

// ---- 엣지케이스 ----
console.log("\n[엣지케이스]");
console.log("n=1, no edges:", undirectedCycleDetectionFinal(1, []));
console.log("no edges n=5:", undirectedCycleDetectionFinal(5, []));
console.log("self-loop:", undirectedCycleDetectionFinal(2, [[0, 0]]));
console.log("duplicate edge:", undirectedCycleDetectionFinal(2, [[0, 1], [0, 1]]));
console.log("triangle:", undirectedCycleDetectionFinal(3, [[0, 1], [1, 2], [2, 0]]));
console.log("linear tree:", undirectedCycleDetectionFinal(4, [[0, 1], [1, 2], [2, 3]]));
console.log("forest two trees:", undirectedCycleDetectionFinal(6, [[0, 1], [1, 2], [3, 4], [4, 5]]));

// ---- DFS / basic / final 교차검증 (무작위) ----
function randomTest() {
  let mismatches = 0;
  for (let t = 0; t < 3000; t++) {
    const n = 1 + Math.floor(Math.random() * 8);
    const m = Math.floor(Math.random() * 10);
    const edges: [number, number][] = [];
    for (let i = 0; i < m; i++) {
      const u = Math.floor(Math.random() * n);
      const v = Math.floor(Math.random() * n);
      edges.push([u, v]);
    }
    const a = undirectedCycleDetectionDFS(n, edges);
    const b = undirectedCycleDetectionBasic(n, edges);
    const c = undirectedCycleDetectionFinal(n, edges);
    if (a !== b || a !== c) {
      mismatches++;
      console.log("MISMATCH", { n, edges, a, b, c });
    }
  }
  console.log(`\n[무작위 교차검증] 3000건 중 불일치 ${mismatches}건`);
}
randomTest();

// ---- 유향 그래프 오용 반례: DAG 다이아몬드 (0->1, 0->2, 1->3, 2->3, 유향 사이클 없음) ----
{
  const n = 4;
  const directedEdges: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3]];
  console.log(
    "\n[유향 오용 반례] DAG 다이아몬드에 무향 union-find 적용 결과:",
    undirectedCycleDetectionFinal(n, directedEdges),
  );
}

// ---- 최적화 코드 절 함정: 조건을 뒤집으면 어떻게 조용히(즉시) 틀리는가 ----
{
  function buggyFlippedCondition(n: number, edges: [number, number][]): boolean {
    const parent = Array.from({ length: n }, (_, i) => i);
    const rank = new Array<number>(n).fill(0);
    function find(v: number): number {
      if (parent[v] !== v) parent[v] = find(parent[v]!);
      return parent[v]!;
    }
    function union(u: number, v: number): void {
      if (rank[u]! < rank[v]!) [u, v] = [v, u];
      parent[v] = u;
      if (rank[u] === rank[v]) rank[u]!++;
    }
    for (const [u, v] of edges) {
      const ru = find(u);
      const rv = find(v);
      if (ru !== rv) return true; // 함정: 조건을 뒤집음
      union(ru, rv);
    }
    return false;
  }
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3]]; // 선형 트리, 정답 false
  console.log(
    "\n[함정: 조건 뒤집기] 선형 트리(edges=[[0,1],[1,2],[2,3]])에서",
    "정답 =", undirectedCycleDetectionFinal(4, edges),
    ", 조건 뒤집은 버그 결과 =", buggyFlippedCondition(4, edges),
  );
}

// ---- 스스로 점검하기 문제 1 손 계산용 트레이스 ----
{
  const n = 4;
  const edges: [number, number][] = [[0, 1], [2, 3], [1, 2], [0, 3]];
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  function find(v: number): number {
    if (parent[v] !== v) parent[v] = find(parent[v]!);
    return parent[v]!;
  }
  function union(u: number, v: number) {
    if (rank[u]! < rank[v]!) [u, v] = [v, u];
    parent[v] = u;
    if (rank[u] === rank[v]) rank[u]!++;
  }
  console.log("\n[점검문제 1] n=4, edges=[[0,1],[2,3],[1,2],[0,3]]");
  console.log("  init parent =", [...parent]);
  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    console.log(`  edge (${u},${v}): find(${u})=${ru}, find(${v})=${rv}`);
    if (ru === rv) {
      console.log("  -> 같은 집합! true 반환. parent =", [...parent]);
      break;
    }
    union(ru, rv);
    console.log("  -> union 후 parent =", [...parent]);
  }
}
