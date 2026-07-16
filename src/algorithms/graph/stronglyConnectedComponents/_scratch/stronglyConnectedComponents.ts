// E3 자기검증 스크래치 — 가이드 본문 코드를 그대로 옮겨 실행/검증한다.
// 실행: bun src/algorithms/graph/stronglyConnectedComponents/_scratch/stronglyConnectedComponents.ts

// ---------- 출발점: naive (pairwise reachability) ----------

function isReachable(n: number, adj: number[][], src: number, dst: number): boolean {
  const visited = new Array(n).fill(false);
  const queue: number[] = [src];
  visited[src] = true;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === dst) return true;
    for (const next of adj[cur]) {
      if (!visited[next]) {
        visited[next] = true;
        queue.push(next);
      }
    }
  }
  return false;
}

function stronglyConnectedComponentsNaive(n: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);

  const sccId = new Array(n).fill(-1);
  const sccs: number[][] = [];
  for (let u = 0; u < n; u++) {
    if (sccId[u] !== -1) continue; // 이미 어느 그룹에 배정됨
    const group = [u];
    sccId[u] = sccs.length;
    for (let v = u + 1; v < n; v++) {
      if (sccId[v] !== -1) continue;
      if (isReachable(n, adj, u, v) && isReachable(n, adj, v, u)) {
        group.push(v);
        sccId[v] = sccs.length;
      }
    }
    sccs.push(group.sort((a, b) => a - b));
  }
  return sccs.sort((a, b) => a[0]! - b[0]!);
}

// ---------- 아이디어를 코드로 옮기기: Tarjan (최종) ----------

function stronglyConnectedComponents(n: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v); // 유향: 단방향으로만 넣는다

  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const onStack = new Array(n).fill(false);
  const stack: number[] = [];
  const sccs: number[][] = [];
  let timer = 0;

  function dfs(v: number): void {
    disc[v] = low[v] = timer++;
    stack.push(v);
    onStack[v] = true;

    for (const w of adj[v]) {
      if (disc[w] === -1) {
        dfs(w);
        low[v] = Math.min(low[v], low[w]);
      } else if (onStack[w]) {
        low[v] = Math.min(low[v], disc[w]);
      }
      // onStack[w] === false: 이미 확정된 SCC → 무시
    }

    if (low[v] === disc[v]) {
      const scc: number[] = [];
      while (true) {
        const w = stack.pop()!;
        onStack[w] = false;
        scc.push(w);
        if (w === v) break;
      }
      scc.sort((a, b) => a - b);
      sccs.push(scc);
    }
  }

  for (let v = 0; v < n; v++) {
    if (disc[v] === -1) dfs(v);
  }

  return sccs.sort((a, b) => a[0]! - b[0]!);
}

// ---------- 검증 ----------

function eq(a: number[][], b: number[][]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function show(name: string, got: number[][], expected?: number[][]) {
  const okStr = expected ? (eq(got, expected) ? "OK" : "MISMATCH") : "-";
  console.log(`${name}: ${JSON.stringify(got)}  [${okStr}]`);
}

console.log("=== 대표 예시 (사이클 0-1-2, 사이클 3-4, 단방향 2→3) ===");
{
  const n = 5;
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 3],
    [3, 4],
    [4, 3],
  ];
  const expected = [
    [0, 1, 2],
    [3, 4],
  ];
  show("tarjan", stronglyConnectedComponents(n, edges), expected);
  show("naive ", stronglyConnectedComponentsNaive(n, edges), expected);
}

console.log("=== 엣지: 간선 없음 (n=4) ===");
{
  const n = 4;
  const edges: [number, number][] = [];
  const expected = [[0], [1], [2], [3]];
  show("tarjan", stronglyConnectedComponents(n, edges), expected);
  show("naive ", stronglyConnectedComponentsNaive(n, edges), expected);
}

console.log("=== 엣지: 단방향 체인 0→1→2→3 ===");
{
  const n = 4;
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
  ];
  const expected = [[0], [1], [2], [3]];
  show("tarjan", stronglyConnectedComponents(n, edges), expected);
  show("naive ", stronglyConnectedComponentsNaive(n, edges), expected);
}

console.log("=== 엣지: 완전 양방향 사이클 0-1-2-3 ===");
{
  const n = 4;
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  const expected = [[0, 1, 2, 3]];
  show("tarjan", stronglyConnectedComponents(n, edges), expected);
  show("naive ", stronglyConnectedComponentsNaive(n, edges), expected);
}

console.log("=== 엣지: 자기 루프 (다른 정점과 미연결) ===");
{
  const n = 2;
  const edges: [number, number][] = [
    [0, 0],
    [0, 1],
  ];
  const expected = [[0], [1]];
  show("tarjan", stronglyConnectedComponents(n, edges), expected);
  show("naive ", stronglyConnectedComponentsNaive(n, edges), expected);
}

console.log("=== 엣지: n=1, 간선 없음 ===");
{
  const n = 1;
  const edges: [number, number][] = [];
  const expected = [[0]];
  show("tarjan", stronglyConnectedComponents(n, edges), expected);
  show("naive ", stronglyConnectedComponentsNaive(n, edges), expected);
}

console.log("=== 무작위 교차검증 (n=8, 20회) ===");
{
  let allOk = true;
  for (let trial = 0; trial < 20; trial++) {
    const n = 8;
    const edges: [number, number][] = [];
    const edgeCount = 1 + Math.floor(Math.random() * 14);
    for (let i = 0; i < edgeCount; i++) {
      const u = Math.floor(Math.random() * n);
      const v = Math.floor(Math.random() * n);
      edges.push([u, v]);
    }
    const got = stronglyConnectedComponents(n, edges);
    const expected = stronglyConnectedComponentsNaive(n, edges);
    const ok = eq(got, expected);
    if (!ok) {
      allOk = false;
      console.log(`  trial ${trial} MISMATCH edges=${JSON.stringify(edges)}`);
      console.log(`    tarjan=${JSON.stringify(got)}`);
      console.log(`    naive =${JSON.stringify(expected)}`);
    }
  }
  console.log(allOk ? "  모든 무작위 시행 일치" : "  불일치 발견 (위 로그 참고)");
}
