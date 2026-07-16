// ORD-003 가이드 자기검증용 스크래치. 가이드 본문 코드를 그대로 옮겨 실행/검증한다.

// ── 출발점: naive (정점마다 Bellman-Ford) ──────────────────────────────
function bellmanFordFrom(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let i = 0; i < n - 1; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
      }
    }
  }
  return dist;
}

function naiveAllPairs(
  n: number,
  edges: [number, number, number][],
): number[][] {
  const dist: number[][] = [];
  for (let s = 0; s < n; s++) {
    dist.push(bellmanFordFrom(n, edges, s));
  }
  return dist;
}

// ── 아이디어를 코드로 옮기기: 기본 3중 루프 ─────────────────────────────
function floydWarshallBase(
  n: number,
  edges: [number, number, number][],
): number[][] {
  const dist: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(Infinity),
  );
  for (let v = 0; v < n; v++) dist[v][v] = 0;
  for (const [u, v, w] of edges) {
    if (w < dist[u][v]) dist[u][v] = w;
  }

  for (let k = 0; k < n; k++) {
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        const viaK = dist[u][k] + dist[k][v];
        if (viaK < dist[u][v]) dist[u][v] = viaK;
      }
    }
  }
  return dist;
}

// ── 최적화 코드: dist[u][k] === Infinity 가지치기 ───────────────────────
function floydWarshall(
  n: number,
  edges: [number, number, number][],
): number[][] {
  const dist: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(Infinity),
  );
  for (let v = 0; v < n; v++) dist[v][v] = 0;
  for (const [u, v, w] of edges) {
    if (w < dist[u][v]) dist[u][v] = w;
  }

  for (let k = 0; k < n; k++) {
    for (let u = 0; u < n; u++) {
      if (dist[u][k] === Infinity) continue; // u→k 불가면 k 경유 전부 스킵
      for (let v = 0; v < n; v++) {
        const viaK = dist[u][k] + dist[k][v];
        if (viaK < dist[u][v]) dist[u][v] = viaK;
      }
    }
  }
  return dist;
}

// ── 검증 유틸 ────────────────────────────────────────────────────────
function eq(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

function show(label: string, m: number[][]) {
  console.log(label);
  console.log(
    m
      .map((row) => "  [" + row.map((x) => (x === Infinity ? "∞" : x)).join(", ") + "]")
      .join("\n"),
  );
}

console.log("=== 1) 옛 가이드 예시: n=4 ===");
const edges1: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 11],
  [1, 2, 2],
  [2, 3, 3],
  [1, 3, 10],
];
const r1base = floydWarshallBase(4, edges1);
const r1opt = floydWarshall(4, edges1);
const r1naive = naiveAllPairs(4, edges1);
show("base", r1base);
show("opt", r1opt);
console.log("base==opt:", eq(r1base, r1opt), " base==naive:", eq(r1base, r1naive));

console.log("\n=== 2) problem.md 예시 1: 음수 간선, 간접 경로가 더 짧음 ===");
const edges2: [number, number, number][] = [
  [0, 1, 3],
  [1, 2, 2],
  [0, 2, 10],
  [2, 0, 4],
];
const r2 = floydWarshall(3, edges2);
show("floydWarshall(3, edges2)", r2);
// 기대: [[0,3,5],[6,0,2],[4,7,0]]

console.log("\n=== 3) problem.md 예시 2: 도달 불가능 ===");
const r3 = floydWarshall(3, [[0, 1, 1]]);
show("floydWarshall(3, [[0,1,1]])", r3);
// 기대: [[0,1,∞],[∞,0,∞],[∞,∞,0]]

console.log("\n=== 4) problem.md 예시 3: 간선 없음 ===");
const r4 = floydWarshall(2, []);
show("floydWarshall(2, [])", r4);
// 기대: [[0,∞],[∞,0]]

console.log("\n=== 5) problem.md 예시 4: 방향성 독립 ===");
const r5 = floydWarshall(2, [[0, 1, 3], [1, 0, 7]]);
show("floydWarshall(2, [[0,1,3],[1,0,7]])", r5);
// 기대: [[0,3],[7,0]]

console.log("\n=== 6) 엣지: V=1 ===");
const r6 = floydWarshall(1, []);
show("floydWarshall(1, [])", r6);
// 기대: [[0]]

console.log("\n=== 7) 엣지: 다중 간선 min 처리 ===");
const r7 = floydWarshall(2, [[0, 1, 5], [0, 1, 2], [0, 1, 9]]);
show("floydWarshall(2, [[0,1,5],[0,1,2],[0,1,9]])", r7);
// 기대: [[0,2],[∞,0]]

console.log("\n=== 8) 무작위 교차검증 (naive vs base vs opt), 음수 간선 포함·사이클 없음 ===");
function randomDag(n: number, edgeCount: number): [number, number, number][] {
  // 위상 순서 0..n-1을 고정하고 u<v 방향으로만 간선을 둬 음수 사이클을 원천 차단한다.
  const edges: [number, number, number][] = [];
  for (let i = 0; i < edgeCount; i++) {
    const u = Math.floor(Math.random() * n);
    let v = Math.floor(Math.random() * n);
    if (u === v) continue;
    const lo = Math.min(u, v);
    const hi = Math.max(u, v);
    const w = Math.floor(Math.random() * 21) - 5; // -5..15
    edges.push([lo, hi, w]);
  }
  return edges;
}

let allOk = true;
for (let t = 0; t < 30; t++) {
  const n = 2 + Math.floor(Math.random() * 6); // 2..7
  const edges = randomDag(n, n * 2);
  const rb = floydWarshallBase(n, edges);
  const ro = floydWarshall(n, edges);
  const rn = naiveAllPairs(n, edges);
  const okBO = eq(rb, ro);
  const okBN = eq(rb, rn);
  if (!okBO || !okBN) {
    allOk = false;
    console.log(`FAIL t=${t} n=${n} edges=${JSON.stringify(edges)}`);
    show("base", rb);
    show("opt", ro);
    show("naive", rn);
  }
}
console.log("무작위 30회 전부 일치:", allOk);
