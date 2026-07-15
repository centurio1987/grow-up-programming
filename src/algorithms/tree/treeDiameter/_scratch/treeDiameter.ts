// E3 자기검증 스크래치 — 가이드 본문에 싣는 세 버전을 모두 실행해 수치를 확정한다.
// bun src/algorithms/tree/treeDiameter/_scratch/treeDiameter.ts

type Edge = [number, number, number];

// ── 0) naive: 모든 쌍 최단경로 (출발점 절) ─────────────────────────────
function treeDiameterNaive(n: number, edges: Edge[]): number {
  if (n === 1) return 0;
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u]!.push([v, w]);
    adj[v]!.push([u, w]);
  }
  let diameter = 0;
  for (let s = 0; s < n; s++) {
    const dist = new Array<number>(n).fill(-1);
    dist[s] = 0;
    const stack = [s];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const [next, w] of adj[cur]!) {
        if (dist[next] === -1) {
          dist[next] = dist[cur]! + w;
          stack.push(next);
        }
      }
    }
    for (const d of dist) diameter = Math.max(diameter, d);
  }
  return diameter;
}

// ── 1) 기본 구현: 재귀 DFS 2회 (아이디어를 코드로 옮기기 절) ────────────
function treeDiameterRecursive(n: number, edges: Edge[]): number {
  if (n === 1) return 0;

  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u]!.push([v, w]);
    adj[v]!.push([u, w]);
  }

  function dfs(start: number): { farthest: number; maxDist: number } {
    const dist = new Array<number>(n).fill(-1);
    dist[start] = 0;
    let farthest = start;
    let maxDist = 0;

    function visit(u: number) {
      for (const [v, w] of adj[u]!) {
        if (dist[v] === -1) {
          dist[v] = dist[u]! + w;
          if (dist[v]! > maxDist) {
            maxDist = dist[v]!;
            farthest = v;
          }
          visit(v); // 재귀 — 체인 트리에서 깊이 = n
        }
      }
    }
    visit(start);
    return { farthest, maxDist };
  }

  const { farthest: x } = dfs(0);
  const { maxDist: diameter } = dfs(x);
  return diameter;
}

// ── 2) 최적화: 반복적 DFS 2회 (최적화 코드 절) ──────────────────────────
function treeDiameter(n: number, edges: Edge[]): number {
  if (n === 1) return 0;

  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u]!.push([v, w]);
    adj[v]!.push([u, w]);
  }

  function dfs(start: number): { farthest: number; maxDist: number } {
    const dist = new Array<number>(n).fill(-1);
    dist[start] = 0;
    let farthest = start;
    let maxDist = 0;
    const stack = [start];

    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const [next, w] of adj[cur]!) {
        if (dist[next] === -1) {
          dist[next] = dist[cur]! + w;
          stack.push(next);
          if (dist[next]! > maxDist) {
            maxDist = dist[next]!;
            farthest = next;
          }
        }
      }
    }
    return { farthest, maxDist };
  }

  const { farthest: x } = dfs(0);
  const { maxDist: diameter } = dfs(x);
  return diameter;
}

// ── 검증 유틸 ────────────────────────────────────────────────────────
function assertEq(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

// ── 대표 예시 (treeDiameter-problem.md) ────────────────────────────────
console.log("== 대표 예시 (problem.md) ==");
assertEq("n=1", treeDiameter(1, []), 0);
assertEq("n=2 단일간선", treeDiameter(2, [[0, 1, 7]]), 7);
assertEq(
  "n=5 일반",
  treeDiameter(5, [
    [0, 1, 1],
    [0, 2, 3],
    [1, 3, 2],
    [2, 4, 5],
  ]),
  11,
);
assertEq(
  "n=5 스타",
  treeDiameter(5, [
    [0, 1, 1],
    [0, 2, 2],
    [0, 3, 3],
    [0, 4, 4],
  ]),
  7,
);
assertEq(
  "n=5 체인",
  treeDiameter(5, [
    [0, 1, 2],
    [1, 2, 2],
    [2, 3, 2],
    [3, 4, 2],
  ]),
  8,
);
assertEq("n=3 가중치0", treeDiameter(3, [[0, 1, 0], [1, 2, 0]]), 0);

// ── 가이드 본문 시뮬레이션 예시 (별 모양, n=4) ─────────────────────────
console.log("== 시뮬레이션 예시 (n=4 별모양) ==");
assertEq(
  "star n=4",
  treeDiameter(4, [
    [0, 1, 3],
    [0, 2, 1],
    [0, 3, 2],
  ]),
  5,
);

// ── 세 구현 간 교차검증 (소규모 무작위) ─────────────────────────────────
console.log("== 세 구현 교차검증 (무작위 소규모) ==");
function randomTree(n: number, maxW: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 1; i < n; i++) {
    const parent = Math.floor(Math.random() * i);
    const w = Math.floor(Math.random() * (maxW + 1));
    edges.push([parent, i, w]);
  }
  return edges;
}

let allMatch = true;
for (let t = 0; t < 200; t++) {
  const n = 1 + Math.floor(Math.random() * 12);
  const edges = randomTree(n, 5);
  const a = treeDiameterNaive(n, edges);
  const b = treeDiameterRecursive(n, edges);
  const c = treeDiameter(n, edges);
  if (a !== b || b !== c) {
    allMatch = false;
    console.log("MISMATCH", { n, edges, a, b, c });
  }
}
console.log(allMatch ? "OK  무작위 200회 3구현 전원 일치" : "FAIL 불일치 발견");

// ── 재귀 vs 반복 스택 깊이 실측 (체인 트리) ────────────────────────────
console.log("== 재귀 DFS 스택 깊이 한계 실측 (체인 트리) ==");
for (const n of [1000, 10000, 20000, 30000, 50000, 100000]) {
  const edges: Edge[] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1, 1]);
  try {
    const r = treeDiameterRecursive(n, edges);
    console.log(`n=${n} 재귀 OK  결과=${r}`);
  } catch (e: any) {
    console.log(`n=${n} 재귀 FAIL ${e.constructor.name}: ${e.message}`);
  }
  const rIter = treeDiameter(n, edges);
  console.log(`n=${n} 반복 OK  결과=${rIter}`);
}

console.log("== 완료 ==");
