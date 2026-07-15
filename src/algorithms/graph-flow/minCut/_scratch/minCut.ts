// E3 자기검증 스크래치: minCut-guide.new.mdx 본문 코드를 그대로 추출한 것.
// 실행: bun src/algorithms/graph-flow/minCut/_scratch/minCut.ts

// ── 원형: 정점 분할을 전부 열거하는 naive ──────────────────────────────
function minCutNaive(
  n: number,
  edges: [number, number, number][],
  s: number,
  t: number,
): { cut: number } {
  let best = Infinity;
  for (let mask = 0; mask < (1 << n); mask++) {
    const inS = (v: number) => ((mask >> v) & 1) === 1;
    if (!inS(s) || inS(t)) continue; // 불변식: s ∈ S, t ∈ T
    let cutVal = 0;
    for (const [u, v, c] of edges) {
      if (inS(u) && !inS(v)) cutVal += c;
    }
    best = Math.min(best, cutVal);
  }
  return { cut: best };
}

// ── 최종 구현: Dinic's 최대 유량 + 잔여 그래프 BFS로 컷 결정 ───────────
type ResidualEdge = { to: number; cap: number; rev: number };

function buildResidualGraph(
  n: number,
  edges: [number, number, number][],
): ResidualEdge[][] {
  const graph: ResidualEdge[][] = Array.from({ length: n }, () => []);
  const addEdge = (u: number, v: number, c: number) => {
    graph[u].push({ to: v, cap: c, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, rev: graph[u].length - 1 });
  };
  for (const [u, v, c] of edges) addEdge(u, v, c);
  return graph;
}

function dinicMaxFlow(
  graph: ResidualEdge[][],
  n: number,
  s: number,
  t: number,
): number {
  let totalFlow = 0;
  const level = new Array<number>(n).fill(-1);
  const iter = new Array<number>(n).fill(0);

  const bfs = (): boolean => {
    level.fill(-1);
    level[s] = 0;
    const queue = [s];
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++]!;
      for (const e of graph[u]!) {
        if (e.cap > 0 && level[e.to] === -1) {
          level[e.to] = level[u]! + 1;
          queue.push(e.to);
        }
      }
    }
    return level[t] !== -1;
  };

  const dfs = (u: number, pushed: number): number => {
    if (u === t) return pushed;
    for (; iter[u]! < graph[u]!.length; iter[u]!++) {
      const e = graph[u]![iter[u]!]!;
      if (e.cap > 0 && level[e.to] === level[u]! + 1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        if (d > 0) {
          e.cap -= d;
          graph[e.to]![e.rev]!.cap += d;
          return d;
        }
      }
    }
    return 0;
  };

  while (bfs()) {
    iter.fill(0);
    let f: number;
    while ((f = dfs(s, Infinity)) > 0) totalFlow += f;
  }
  return totalFlow;
}

function minCut(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { cut: number } {
  const graph = buildResidualGraph(n, edges);
  const maxFlowValue = dinicMaxFlow(graph, n, source, sink);

  const reachable = new Array<boolean>(n).fill(false);
  reachable[source] = true;
  const queue = [source];
  let qi = 0;
  while (qi < queue.length) {
    const u = queue[qi++]!;
    for (const e of graph[u]!) {
      if (e.cap > 0 && !reachable[e.to]) {
        reachable[e.to] = true;
        queue.push(e.to);
      }
    }
  }

  let cutCapacity = 0;
  for (const [u, v, c] of edges) {
    if (reachable[u] && !reachable[v]) cutCapacity += c;
  }

  console.assert(
    cutCapacity === maxFlowValue,
    `Max-Flow Min-Cut 불일치: cut=${cutCapacity}, flow=${maxFlowValue}`,
  );

  return { cut: cutCapacity };
}

// ── 대표 예시 (minCut-problem.md) ───────────────────────────────────
const cases: [string, number, [number, number, number][], number, number, number][] = [
  ["예시1", 4, [[0, 1, 3], [0, 2, 2], [1, 2, 1], [1, 3, 2], [2, 3, 3]], 0, 3, 5],
  ["예시2", 3, [[0, 1, 10], [1, 2, 5]], 0, 2, 5],
  ["예시3", 2, [[0, 1, 10]], 0, 1, 10],
  ["예시4-단절", 3, [[0, 1, 10]], 0, 2, 0],
  ["예시5-간선없음", 2, [], 0, 1, 0],
  ["예시6-병목", 4, [[0, 1, 100], [1, 2, 100], [2, 3, 1]], 0, 3, 1],
];

console.log("=== 대표 예시 ===");
for (const [name, n, edges, s, t, expected] of cases) {
  const r1 = minCut(n, edges, s, t);
  const r2 = minCutNaive(n, edges, s, t);
  const ok = r1.cut === expected && r2.cut === expected;
  console.log(
    `${name}: minCut=${JSON.stringify(r1)} naive=${JSON.stringify(r2)} expected=${expected} ${ok ? "OK" : "FAIL"}`,
  );
  if (!ok) throw new Error(`${name} 불일치`);
}

// ── 엣지 케이스: 병렬 간선 ───────────────────────────────────────────
console.log("\n=== 엣지: 병렬 간선 ===");
{
  const n = 2;
  const edges: [number, number, number][] = [[0, 1, 3], [0, 1, 4]];
  const r1 = minCut(n, edges, 0, 1);
  const r2 = minCutNaive(n, edges, 0, 1);
  console.log(`parallel: minCut=${JSON.stringify(r1)} naive=${JSON.stringify(r2)}`);
  if (r1.cut !== 7 || r2.cut !== 7) throw new Error("병렬 간선 불일치");
}

// ── 무작위 교차검증 (n<=6, 최대 유량 기반 vs 완전 열거) ────────────
console.log("\n=== 무작위 교차검증 ===");
function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
let randomTrials = 0;
for (let trial = 0; trial < 200; trial++) {
  const n = 2 + randInt(5); // 2..6
  const s = 0;
  const t = n - 1;
  const edgeCount = randInt(2 * n);
  const edges: [number, number, number][] = [];
  for (let i = 0; i < edgeCount; i++) {
    const u = randInt(n);
    const v = randInt(n);
    if (u === v) continue;
    const c = randInt(11);
    edges.push([u, v, c]);
  }
  const r1 = minCut(n, edges, s, t);
  const r2 = minCutNaive(n, edges, s, t);
  randomTrials++;
  if (r1.cut !== r2.cut) {
    console.log(`FAIL n=${n} edges=${JSON.stringify(edges)} minCut=${r1.cut} naive=${r2.cut}`);
    throw new Error("무작위 교차검증 실패");
  }
}
console.log(`무작위 ${randomTrials}건 전부 minCut === naive 일치`);

// ── 시뮬레이션 프레임 실측값(예시1) 상세 트레이스 ──────────────────
console.log("\n=== 시뮬레이션 트레이스 재현 (예시1) ===");
{
  const n = 4;
  const edges: [number, number, number][] = [[0, 1, 3], [0, 2, 2], [1, 2, 1], [1, 3, 2], [2, 3, 3]];
  const graph = buildResidualGraph(n, edges);
  const flow = dinicMaxFlow(graph, n, 0, 3);
  console.log("maxFlowValue =", flow);
  console.log(
    "잔여 (0-1,0-2,1-2,1-3,2-3) =",
    graph[0]!.find((e) => e.to === 1)!.cap,
    graph[0]!.find((e) => e.to === 2)!.cap,
    graph[1]!.find((e) => e.to === 2)!.cap,
    graph[1]!.find((e) => e.to === 3)!.cap,
    graph[2]!.find((e) => e.to === 3)!.cap,
  );
  const reachable = new Array<boolean>(n).fill(false);
  reachable[0] = true;
  const queue = [0];
  let qi = 0;
  while (qi < queue.length) {
    const u = queue[qi++]!;
    for (const e of graph[u]!) {
      if (e.cap > 0 && !reachable[e.to]) {
        reachable[e.to] = true;
        queue.push(e.to);
      }
    }
  }
  console.log("reachable =", reachable);
}

console.log("\n모든 검증 통과");
