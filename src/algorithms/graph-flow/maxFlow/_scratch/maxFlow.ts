// 가이드 자기검증용 스크래치. 본문에 싣는 세 버전(naive Ford-Fulkerson, Dinic's 기본구현,
// Dinic's 최종(iter 포인터))을 실제 실행해 수치를 검증한다.

type Edge = { to: number; cap: number; rev: number };

// ── 1) naive: Ford-Fulkerson (DFS 임의 경로) ────────────────────────────────
function maxFlowNaive(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { flow: number } {
  if (source === sink) return { flow: 0 };
  const graph: Edge[][] = Array.from({ length: n }, () => []);
  const addEdge = (u: number, v: number, c: number) => {
    graph[u].push({ to: v, cap: c, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
  };
  for (const [u, v, c] of edges) addEdge(u, v, c);

  function dfs(u: number, t: number, pushed: number, visited: boolean[]): number {
    if (u === t) return pushed;
    visited[u] = true;
    for (const edge of graph[u]) {
      if (edge.cap > 0 && !visited[edge.to]) {
        const d = dfs(edge.to, t, Math.min(pushed, edge.cap), visited);
        if (d > 0) {
          edge.cap -= d;
          graph[edge.to][edge.rev].cap += d;
          return d;
        }
      }
    }
    return 0;
  }

  let totalFlow = 0;
  while (true) {
    const visited = new Array(n).fill(false);
    const f = dfs(source, sink, Infinity, visited);
    if (f === 0) break;
    totalFlow += f;
  }
  return { flow: totalFlow };
}

// ── 2) 기본 구현: Dinic's, iter 포인터 없이 매 DFS를 0번 간선부터 재스캔 ──────
function maxFlowDinicBasic(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { flow: number } {
  if (source === sink) return { flow: 0 };
  const graph: Edge[][] = Array.from({ length: n }, () => []);
  const addEdge = (u: number, v: number, c: number) => {
    graph[u].push({ to: v, cap: c, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
  };
  for (const [u, v, c] of edges) addEdge(u, v, c);

  function bfsLevel(s: number): number[] {
    const level = new Array(n).fill(-1);
    level[s] = 0;
    const queue = [s];
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++]!;
      for (const edge of graph[u]) {
        if (edge.cap > 0 && level[edge.to] === -1) {
          level[edge.to] = level[u] + 1;
          queue.push(edge.to);
        }
      }
    }
    return level;
  }

  function dfs(u: number, t: number, pushed: number, level: number[]): number {
    if (u === t) return pushed;
    for (const edge of graph[u]) {
      // 매번 배열 처음부터 스캔 — 이전에 실패로 판명된 간선도 다시 확인한다.
      if (edge.cap > 0 && level[edge.to] === level[u] + 1) {
        const d = dfs(edge.to, t, Math.min(pushed, edge.cap), level);
        if (d > 0) {
          edge.cap -= d;
          graph[edge.to][edge.rev].cap += d;
          return d;
        }
      }
    }
    return 0;
  }

  let totalFlow = 0;
  while (true) {
    const level = bfsLevel(source);
    if (level[sink] === -1) break;
    while (true) {
      const f = dfs(source, sink, Infinity, level);
      if (f === 0) break;
      totalFlow += f;
    }
  }
  return { flow: totalFlow };
}

// ── 3) 최종: Dinic's + iter(current-arc) 포인터 ─────────────────────────────
function maxFlow(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { flow: number } {
  if (source === sink) return { flow: 0 };
  const graph: Edge[][] = Array.from({ length: n }, () => []);
  const addEdge = (u: number, v: number, c: number) => {
    graph[u].push({ to: v, cap: c, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
  };
  for (const [u, v, c] of edges) addEdge(u, v, c);

  const level = new Array(n).fill(-1);
  const iter = new Array(n).fill(0);

  function bfs(s: number): void {
    level.fill(-1);
    level[s] = 0;
    const queue = [s];
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++]!;
      for (const edge of graph[u]) {
        if (edge.cap > 0 && level[edge.to] === -1) {
          level[edge.to] = level[u] + 1;
          queue.push(edge.to);
        }
      }
    }
  }

  function dfs(u: number, t: number, pushed: number): number {
    if (u === t) return pushed;
    for (; iter[u] < graph[u].length; iter[u]++) {
      const edge = graph[u][iter[u]]!;
      if (edge.cap > 0 && level[edge.to] === level[u] + 1) {
        const d = dfs(edge.to, t, Math.min(pushed, edge.cap));
        if (d > 0) {
          edge.cap -= d;
          graph[edge.to][edge.rev].cap += d;
          return d;
        }
      }
    }
    return 0;
  }

  let totalFlow = 0;
  bfs(source);
  while (level[sink] !== -1) {
    iter.fill(0);
    let f: number;
    while ((f = dfs(source, sink, Infinity)) > 0) {
      totalFlow += f;
    }
    bfs(source);
  }
  return { flow: totalFlow };
}

// ── 검증 하네스 ──────────────────────────────────────────────────────────
function assertEq(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  console.log(`${ok ? "OK " : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 대표 예시 ===");
{
  const n = 4;
  const edges: [number, number, number][] = [[0, 1, 3], [0, 2, 2], [1, 2, 1], [1, 3, 2], [2, 3, 3]];
  assertEq("naive", maxFlowNaive(n, edges, 0, 3).flow, 5);
  assertEq("basic", maxFlowDinicBasic(n, edges, 0, 3).flow, 5);
  assertEq("final", maxFlow(n, edges, 0, 3).flow, 5);
}

console.log("=== 역방향 간선 활용 예시 (문제 설명 5번째 예시) ===");
{
  const n = 4;
  const edges: [number, number, number][] = [[0, 1, 3], [0, 2, 3], [1, 2, 2], [1, 3, 3], [2, 3, 3]];
  assertEq("naive", maxFlowNaive(n, edges, 0, 3).flow, 6);
  assertEq("basic", maxFlowDinicBasic(n, edges, 0, 3).flow, 6);
  assertEq("final", maxFlow(n, edges, 0, 3).flow, 6);
}

console.log("=== 직접 연결 ===");
{
  assertEq("final", maxFlow(2, [[0, 1, 10]], 0, 1).flow, 10);
}

console.log("=== 경로 없음(간선은 있으나 싱크로 못 감) ===");
{
  assertEq("final", maxFlow(3, [[0, 1, 5]], 0, 2).flow, 0);
}

console.log("=== 간선 없음 ===");
{
  assertEq("final", maxFlow(2, [], 0, 1).flow, 0);
}

console.log("=== 직렬 경로, 큰 용량 ===");
{
  assertEq("final", maxFlow(3, [[0, 1, 1_000_000], [1, 2, 1_000_000]], 0, 2).flow, 1_000_000);
}

console.log("=== 병렬 간선(같은 u→v 여러 개) ===");
{
  const n = 2;
  const edges: [number, number, number][] = [[0, 1, 3], [0, 1, 4]];
  assertEq("final", maxFlow(n, edges, 0, 1).flow, 7);
}

console.log("=== source === sink (방어 처리) ===");
{
  assertEq("final", maxFlow(3, [[0, 1, 5], [1, 2, 5]], 0, 0).flow, 0);
}

console.log("=== 무작위 교차검증 (naive vs basic vs final) ===");
{
  function randInt(lo: number, hi: number) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  let trials = 200;
  let mismatches = 0;
  for (let t = 0; t < trials; t++) {
    const n = randInt(2, 8);
    const m = randInt(0, 14);
    const edges: [number, number, number][] = [];
    for (let i = 0; i < m; i++) {
      const u = randInt(0, n - 1);
      const v = randInt(0, n - 1);
      if (u === v) continue;
      const c = randInt(0, 10);
      edges.push([u, v, c]);
    }
    const s = 0;
    const tt = n - 1;
    const a = maxFlowNaive(n, edges, s, tt).flow;
    const b = maxFlowDinicBasic(n, edges, s, tt).flow;
    const c = maxFlow(n, edges, s, tt).flow;
    if (a !== b || b !== c) {
      mismatches++;
      console.log(`MISMATCH n=${n} edges=${JSON.stringify(edges)} naive=${a} basic=${b} final=${c}`);
    }
  }
  console.log(`무작위 시행 ${trials}회, 불일치 ${mismatches}건`);
  if (mismatches > 0) process.exitCode = 1;
}

console.log("=== 시뮬레이션 프레임 재현 (n=4, s=0,t=3) ===");
{
  // 구 가이드 sim의 각 프레임 값이 실제로 이렇게 나오는지 손으로 추적하며 확인.
  const n = 4;
  const graph: Edge[][] = Array.from({ length: n }, () => []);
  const addEdge = (u: number, v: number, c: number) => {
    graph[u].push({ to: v, cap: c, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
  };
  for (const [u, v, c] of [[0, 1, 3], [0, 2, 2], [1, 2, 1], [1, 3, 2], [2, 3, 3]] as [number, number, number][]) {
    addEdge(u, v, c);
  }
  console.log("잔여(0-1,0-2,1-2,1-3,2-3) 초기:", graph[0][0]!.cap, graph[0][1]!.cap, graph[1][1]!.cap, graph[1][2]!.cap, graph[2][2]!.cap);
}

console.log("=== naive 최악 순서 데모 (고전 적대적 그래프) ===");
{
  // s=0, a=1, b=2, t=3. s-a=C, s-b=C, a-b=1, a-t=C, b-t=C.
  // 간선 삽입 순서상 DFS가 a에서 b로 먼저 빠지도록 구성 → 병목 1짜리 경로를 반복.
  function maxFlowNaiveCounting(
    n: number,
    edges: [number, number, number][],
    source: number,
    sink: number,
  ): { flow: number; iterations: number } {
    const graph: Edge[][] = Array.from({ length: n }, () => []);
    const addEdge = (u: number, v: number, c: number) => {
      graph[u].push({ to: v, cap: c, rev: graph[v].length });
      graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
    };
    for (const [u, v, c] of edges) addEdge(u, v, c);
    function dfs(u: number, t: number, pushed: number, visited: boolean[]): number {
      if (u === t) return pushed;
      visited[u] = true;
      for (const edge of graph[u]) {
        if (edge.cap > 0 && !visited[edge.to]) {
          const d = dfs(edge.to, t, Math.min(pushed, edge.cap), visited);
          if (d > 0) {
            edge.cap -= d;
            graph[edge.to][edge.rev].cap += d;
            return d;
          }
        }
      }
      return 0;
    }
    let totalFlow = 0;
    let iterations = 0;
    while (true) {
      const visited = new Array(n).fill(false);
      const f = dfs(source, sink, Infinity, visited);
      if (f === 0) break;
      totalFlow += f;
      iterations++;
    }
    return { flow: totalFlow, iterations };
  }

  const C = 4;
  const badEdges: [number, number, number][] = [[0, 1, C], [0, 2, C], [1, 2, 1], [2, 3, C], [1, 3, C]];
  const bad = maxFlowNaiveCounting(4, badEdges, 0, 3);
  console.log(`C=${C}, 간선 순서 [s-a,s-b,a-b,b-t,a-t] → flow=${bad.flow}, DFS 반복 횟수=${bad.iterations}`);

  const goodEdges: [number, number, number][] = [[0, 1, C], [1, 3, C], [0, 2, C], [2, 3, C], [1, 2, 1]];
  const good = maxFlowNaiveCounting(4, goodEdges, 0, 3);
  console.log(`C=${C}, 간선 순서 [s-a,a-t,s-b,b-t,a-b] → flow=${good.flow}, DFS 반복 횟수=${good.iterations}`);
}

console.log("=== naive 최악 순서 데모 v2 (a→b, b→a 양방향 단위용량) ===");
{
  function maxFlowNaiveCounting(
    n: number,
    edges: [number, number, number][],
    source: number,
    sink: number,
  ): { flow: number; iterations: number } {
    const graph: Edge[][] = Array.from({ length: n }, () => []);
    const addEdge = (u: number, v: number, c: number) => {
      graph[u].push({ to: v, cap: c, rev: graph[v].length });
      graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
    };
    for (const [u, v, c] of edges) addEdge(u, v, c);
    function dfs(u: number, t: number, pushed: number, visited: boolean[]): number {
      if (u === t) return pushed;
      visited[u] = true;
      for (const edge of graph[u]) {
        if (edge.cap > 0 && !visited[edge.to]) {
          const d = dfs(edge.to, t, Math.min(pushed, edge.cap), visited);
          if (d > 0) {
            edge.cap -= d;
            graph[edge.to][edge.rev].cap += d;
            return d;
          }
        }
      }
      return 0;
    }
    let totalFlow = 0;
    let iterations = 0;
    while (true) {
      const visited = new Array(n).fill(false);
      const f = dfs(source, sink, Infinity, visited);
      if (f === 0) break;
      totalFlow += f;
      iterations++;
    }
    return { flow: totalFlow, iterations };
  }

  const C = 4;
  // s=0,a=1,b=2,t=3. a→b, b→a 모두 실제 간선(용량1)로 존재.
  const badEdges: [number, number, number][] = [
    [0, 1, C], [0, 2, C], [1, 2, 1], [2, 1, 1], [1, 3, C], [2, 3, C],
  ];
  const bad = maxFlowNaiveCounting(4, badEdges, 0, 3);
  console.log(`C=${C} → flow=${bad.flow}, DFS 반복 횟수=${bad.iterations} (기대 2C=${2*C})`);

  const C2 = 500;
  const badEdges2: [number, number, number][] = [
    [0, 1, C2], [0, 2, C2], [1, 2, 1], [2, 1, 1], [1, 3, C2], [2, 3, C2],
  ];
  const bad2 = maxFlowNaiveCounting(4, badEdges2, 0, 3);
  console.log(`C=${C2} → flow=${bad2.flow}, DFS 반복 횟수=${bad2.iterations} (기대 2C=${2*C2})`);
}

console.log("=== 역방향 간선 필요성 데모 (교과서 최소 반례) ===");
{
  // s=0,a=1,b=2,t=3. s-a=1,s-b=1,a-b=1,a-t=1,b-t=1. 진짜 최댓값=2 (s-a-t=1, s-b-t=1).
  const n = 4;
  const edges: [number, number, number][] = [[0, 1, 1], [0, 2, 1], [1, 2, 1], [1, 3, 1], [2, 3, 1]];

  // 정답: 역방향 간선을 쓰는 정식 구현
  const withRev = maxFlow(n, edges, 0, 3);
  console.log("역방향 간선 사용 →", withRev);

  // 대조군: 역방향 간선의 용량을 절대 늘리지 않는(즉 취소를 막는) DFS
  function maxFlowNoCancel(
    nn: number,
    ee: [number, number, number][],
    s: number,
    t: number,
  ): { flow: number } {
    const graph: Edge[][] = Array.from({ length: nn }, () => []);
    const addEdge = (u: number, v: number, c: number) => {
      graph[u].push({ to: v, cap: c, rev: graph[v].length });
      graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
    };
    for (const [u, v, c] of ee) addEdge(u, v, c);
    function dfs(u: number, tt: number, pushed: number, visited: boolean[]): number {
      if (u === tt) return pushed;
      visited[u] = true;
      for (const edge of graph[u]) {
        if (edge.cap > 0 && !visited[edge.to]) {
          const d = dfs(edge.to, tt, Math.min(pushed, edge.cap), visited);
          if (d > 0) {
            edge.cap -= d;
            // 역방향 용량을 갱신하지 않는다 — "취소" 통로를 막음
            return d;
          }
        }
      }
      return 0;
    }
    let totalFlow = 0;
    while (true) {
      const visited = new Array(nn).fill(false);
      const f = dfs(s, t, Infinity, visited);
      if (f === 0) break;
      totalFlow += f;
    }
    return { flow: totalFlow };
  }
  const noCancel = maxFlowNoCancel(n, edges, 0, 3);
  console.log("역방향 간선 갱신 생략(취소 불가) →", noCancel);
}

console.log("=== iter 포인터 유무에 따른 간선 스캔 횟수 비교 ===");
{
  type Edge2 = { to: number; cap: number; rev: number };
  function buildGraph(n: number, edges: [number, number, number][]) {
    const graph: Edge2[][] = Array.from({ length: n }, () => []);
    const addEdge = (u: number, v: number, c: number) => {
      graph[u].push({ to: v, cap: c, rev: graph[v].length });
      graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
    };
    for (const [u, v, c] of edges) addEdge(u, v, c);
    return graph;
  }

  function runBasicCountingScans(n: number, edges: [number, number, number][], s: number, t: number) {
    const graph = buildGraph(n, edges);
    let scans = 0;
    function bfsLevel(src: number): number[] {
      const level = new Array(n).fill(-1);
      level[src] = 0;
      const queue = [src];
      let qi = 0;
      while (qi < queue.length) {
        const u = queue[qi++]!;
        for (const edge of graph[u]) {
          if (edge.cap > 0 && level[edge.to] === -1) {
            level[edge.to] = level[u] + 1;
            queue.push(edge.to);
          }
        }
      }
      return level;
    }
    function dfs(u: number, tt: number, pushed: number, level: number[]): number {
      if (u === tt) return pushed;
      for (const edge of graph[u]) {
        scans++; // 매 시도마다 카운트 (실패한 간선도 다음 호출에서 다시 카운트됨)
        if (edge.cap > 0 && level[edge.to] === level[u] + 1) {
          const d = dfs(edge.to, tt, Math.min(pushed, edge.cap), level);
          if (d > 0) {
            edge.cap -= d;
            graph[edge.to][edge.rev].cap += d;
            return d;
          }
        }
      }
      return 0;
    }
    let totalFlow = 0;
    while (true) {
      const level = bfsLevel(s);
      if (level[t] === -1) break;
      while (true) {
        const f = dfs(s, t, Infinity, level);
        if (f === 0) break;
        totalFlow += f;
      }
    }
    return { flow: totalFlow, scans };
  }

  function runFinalCountingScans(n: number, edges: [number, number, number][], s: number, t: number) {
    const graph = buildGraph(n, edges);
    let scans = 0;
    const level = new Array(n).fill(-1);
    const iter = new Array(n).fill(0);
    function bfs(src: number) {
      level.fill(-1);
      level[src] = 0;
      const queue = [src];
      let qi = 0;
      while (qi < queue.length) {
        const u = queue[qi++]!;
        for (const edge of graph[u]) {
          if (edge.cap > 0 && level[edge.to] === -1) {
            level[edge.to] = level[u] + 1;
            queue.push(edge.to);
          }
        }
      }
    }
    function dfs(u: number, tt: number, pushed: number): number {
      if (u === tt) return pushed;
      for (; iter[u] < graph[u].length; iter[u]++) {
        scans++;
        const edge = graph[u][iter[u]]!;
        if (edge.cap > 0 && level[edge.to] === level[u] + 1) {
          const d = dfs(edge.to, tt, Math.min(pushed, edge.cap));
          if (d > 0) {
            edge.cap -= d;
            graph[edge.to][edge.rev].cap += d;
            return d;
          }
        }
      }
      return 0;
    }
    let totalFlow = 0;
    bfs(s);
    while (level[t] !== -1) {
      iter.fill(0);
      let f: number;
      while ((f = dfs(s, t, Infinity)) > 0) totalFlow += f;
      bfs(s);
    }
    return { flow: totalFlow, scans };
  }

  // 조밀한 그래프에서 비교: 완전 이분 그래프류 (모든 노드가 서로 연결, 재스캔 낭비가 잘 드러남)
  const n = 30;
  const edges: [number, number, number][] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < Math.min(n, i + 6); j++) {
      edges.push([i, j, ((i * 7 + j * 13) % 5) + 1]);
    }
  }
  const basic = runBasicCountingScans(n, edges, 0, n - 1);
  const final = runFinalCountingScans(n, edges, 0, n - 1);
  console.log(`n=${n}, E=${edges.length} → basic(재스캔) scans=${basic.scans}, flow=${basic.flow}`);
  console.log(`n=${n}, E=${edges.length} → final(iter) scans=${final.scans}, flow=${final.flow}`);
}

console.log("=== 점검문제용 검증 ===");
{
  console.log("n=3,[[0,1,5],[1,2,3],[0,2,1]],0,2 →", maxFlow(3, [[0,1,5],[1,2,3],[0,2,1]], 0, 2));
}
