// E3 자기검증 스크래치 — 가이드 본문에 싣는 세 가지 구현을 그대로 옮겨
// 실제로 실행하고, 본문의 모든 수치·트레이스·시뮬 프레임과 대조한다.

// ── 0. 진짜 브루트포스 (아주 작은 입력 교차검증용, 본문 "출발점" 코드와 동일) ──
function kruskalMstBruteForce(
  n: number,
  edges: [number, number, number][],
): number {
  const E = edges.length;
  let best = Infinity;
  for (let mask = 0; mask < 1 << E; mask++) {
    const chosen: [number, number, number][] = [];
    let weightSum = 0;
    for (let i = 0; i < E; i++) {
      if (mask & (1 << i)) {
        chosen.push(edges[i]!);
        weightSum += edges[i]![2];
      }
    }
    if (chosen.length !== n - 1) continue; // 신장 트리는 정확히 n-1개 간선
    // 연결 + 무사이클 확인 (DSU로 판정, 성능과 무관하게 정확성만 본다)
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number =>
      parent[x] === x ? x : (parent[x] = find(parent[x]!));
    let ok = true;
    for (const [u, v] of chosen) {
      const ru = find(u);
      const rv = find(v);
      if (ru === rv) {
        ok = false;
        break;
      }
      parent[ru] = rv;
    }
    if (ok) best = Math.min(best, weightSum);
  }
  return best === Infinity ? -1 : best;
}

// ── 1. 기본 구현: 탐욕 + "순진한" Union-Find(경로 압축·랭크 없음) ──
function findNaive(v: number, parent: number[]): number {
  while (parent[v] !== v) v = parent[v]!;
  return v;
}

function unionNaive(u: number, v: number, parent: number[]): boolean {
  const ru = findNaive(u, parent);
  const rv = findNaive(v, parent);
  if (ru === rv) return false; // 이미 같은 컴포넌트 → 사이클
  parent[ru] = rv; // 항상 u쪽 루트를 v쪽 루트 아래로 붙인다 (크기/랭크 무시)
  return true;
}

function kruskalMstBase(n: number, edges: [number, number, number][]): number {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const parent = Array.from({ length: n }, (_, i) => i);

  let totalWeight = 0;
  let edgesAdded = 0;

  for (const [u, v, w] of sorted) {
    if (unionNaive(u, v, parent)) {
      totalWeight += w;
      edgesAdded++;
      if (edgesAdded === n - 1) break;
    }
  }

  return edgesAdded === n - 1 ? totalWeight : -1;
}

// ── 2. 최적화 구현: 탐욕 + 경로 압축 + 랭크 병합 Union-Find ──
function find(v: number, parent: number[]): number {
  if (parent[v] !== v) {
    parent[v] = find(parent[v]!, parent); // 경로 압축
  }
  return parent[v]!;
}

function union(
  u: number,
  v: number,
  parent: number[],
  rank: number[],
): boolean {
  let ru = find(u, parent);
  let rv = find(v, parent);
  if (ru === rv) return false; // 이미 같은 컴포넌트 → 사이클
  if (rank[ru]! < rank[rv]!) [ru, rv] = [rv, ru];
  parent[rv] = ru; // 낮은 랭크 트리를 높은 랭크 트리 아래로
  if (rank[ru] === rank[rv]) rank[ru]!++;
  return true;
}

export function kruskalMst(
  n: number,
  edges: [number, number, number][],
): number {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);

  let totalWeight = 0;
  let edgesAdded = 0;

  for (const [u, v, w] of sorted) {
    if (union(u, v, parent, rank)) {
      totalWeight += w;
      edgesAdded++;
      if (edgesAdded === n - 1) break;
    }
  }

  return edgesAdded === n - 1 ? totalWeight : -1;
}

// ── 검증 1: 대표 예시 (시뮬레이션과 동일 입력) ──
const repEdges: [number, number, number][] = [
  [0, 1, 1],
  [0, 2, 3],
  [1, 2, 2],
  [1, 3, 4],
  [2, 3, 5],
  [3, 4, 6],
];
console.log("=== 대표 예시 n=5 ===");
console.log("brute       =", kruskalMstBruteForce(5, repEdges));
console.log("base(naive) =", kruskalMstBase(5, repEdges));
console.log("optimized   =", kruskalMst(5, repEdges));

// ── 검증 2: problem.md의 예시들 ──
console.log("\n=== problem.md 예시 ===");
console.log(
  "ex1 =",
  kruskalMst(4, [
    [0, 1, 1],
    [1, 2, 2],
    [2, 3, 3],
    [0, 3, 10],
  ]),
  "(expect 6)",
);
console.log("ex2 =", kruskalMst(3, [[0, 1, 5]]), "(expect -1)");
console.log("ex3 =", kruskalMst(1, []), "(expect 0)");
console.log(
  "ex4 =",
  kruskalMst(2, [
    [0, 1, 100],
    [0, 1, 1],
  ]),
  "(expect 1)",
);
console.log(
  "ex5 =",
  kruskalMst(
    4,
    [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [0, 3, 1],
    ],
  ),
  "(expect 3)",
);

// ── 검증 3: "함정" — union 반환값 확인 없이 정렬 생략하면 틀린다는 것을 실측 ──
function kruskalMstUnsorted(
  n: number,
  edges: [number, number, number][],
): number {
  // 정렬을 빼먹은 버전 — 함정 시나리오 재현
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  let totalWeight = 0;
  let edgesAdded = 0;
  for (const [u, v, w] of edges) {
    if (union(u, v, parent, rank)) {
      totalWeight += w;
      edgesAdded++;
      if (edgesAdded === n - 1) break;
    }
  }
  return edgesAdded === n - 1 ? totalWeight : -1;
}
console.log("\n=== 함정: 정렬 생략 ===");
console.log("정렬 O (정상) =", kruskalMst(5, repEdges));
console.log("정렬 X (함정) =", kruskalMstUnsorted(5, repEdges));

// ── 검증 4: 순진한 union의 O(V) 체인 — ascii art 수치 근거 ──
console.log("\n=== 순진한 union의 체인 심화 ===");
{
  const n = 5;
  const chainEdges: [number, number, number][] = [
    [0, 1, 1],
    [1, 2, 2],
    [2, 3, 3],
    [3, 4, 4],
  ];
  const parent = Array.from({ length: n }, (_, i) => i);
  for (const [u, v] of chainEdges) unionNaive(u, v, parent);
  console.log("parent =", parent, "(0->1->2->3->4 체인)");
  // find(0)의 이동 횟수 세기
  let hops = 0;
  let x = 0;
  while (parent[x] !== x) {
    x = parent[x]!;
    hops++;
  }
  console.log("find(0) 홉 수 =", hops, "(정점 수 - 1 =", n - 1, ")");
}

// ── 검증 5: 무작위 교차검증 (base vs optimized vs brute, 작은 n) ──
console.log("\n=== 무작위 교차검증 (n<=6, E<=8) ===");
function randomGraph(n: number, maxE: number) {
  const E = 1 + Math.floor(Math.random() * maxE);
  const edges: [number, number, number][] = [];
  for (let i = 0; i < E; i++) {
    const u = Math.floor(Math.random() * n);
    let v = Math.floor(Math.random() * n);
    while (v === u) v = Math.floor(Math.random() * n);
    const w = 1 + Math.floor(Math.random() * 20);
    edges.push([u, v, w]);
  }
  return edges;
}
let mismatches = 0;
for (let t = 0; t < 300; t++) {
  const n = 2 + Math.floor(Math.random() * 5); // 2..6
  const edges = randomGraph(n, 8);
  const b = kruskalMstBruteForce(n, edges);
  const base = kruskalMstBase(n, edges);
  const opt = kruskalMst(n, edges);
  if (b !== base || b !== opt) {
    mismatches++;
    console.log("MISMATCH", { n, edges, brute: b, base, opt });
  }
}
console.log("mismatches =", mismatches, "/ 300");

// n=1 엣지케이스
console.log("\n=== n=1 엣지케이스 ===");
console.log(kruskalMst(1, []), "(expect 0)");
console.log(kruskalMstBase(1, []), "(expect 0)");
