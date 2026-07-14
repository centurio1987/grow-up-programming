// E3 자기검증용 스크래치 — 가이드 본문에 실리는 모든 코드를 그대로 옮겨 실행한다.

// ── 섹션 2: naive (무경계 완화 반복, 라운드 상한을 임의로 지정) ──
function bellmanFordNaiveCapped(
  n: number,
  edges: [number, number, number][],
  src: number,
  maxRounds: number,
): { dist: number[]; roundsUsed: number; stillChanging: boolean } {
  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;

  let round = 0;
  let changed = true;
  while (changed && round < maxRounds) {
    changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        changed = true;
      }
    }
    round++;
  }
  return { dist, roundsUsed: round, stillChanging: changed };
}

// ── 섹션 4: 아이디어를 코드로 옮기기 (V-1 라운드 고정, 조기 종료 없음) ──
function bellmanFordBasic(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; hasNegativeCycle: boolean } {
  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;

  for (let i = 1; i <= n - 1; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
      }
    }
  }

  let hasNegativeCycle = false;
  for (const [u, v, w] of edges) {
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      hasNegativeCycle = true;
      break;
    }
  }

  return { dist, hasNegativeCycle };
}

// ── 섹션 7: 최적화 코드 (조기 종료 추가, 최종 구현) ──
function bellmanFord(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; hasNegativeCycle: boolean } {
  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;

  for (let i = 1; i <= n - 1; i++) {
    let updated = false;
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
      }
    }
    if (!updated) break; // 이번 라운드에 아무것도 안 바뀌었으면 이미 수렴
  }

  let hasNegativeCycle = false;
  for (const [u, v, w] of edges) {
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      hasNegativeCycle = true;
      break;
    }
  }

  return { dist, hasNegativeCycle };
}

// dp[i][v] 표 생성용 (3.1 절 트레이스) — i round까지의 dist 스냅샷을 기록
function bellmanFordTrace(
  n: number,
  edges: [number, number, number][],
  src: number,
  rounds: number,
): number[][] {
  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;
  const snapshots: number[][] = [dist.slice()];
  for (let i = 1; i <= rounds; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
      }
    }
    snapshots.push(dist.slice());
  }
  return snapshots;
}

function fmt(dist: number[]): string {
  return "[" + dist.map((d) => (d === Infinity ? "∞" : String(d))).join(", ") + "]";
}

console.log("=== 대표 예시: n=4, src=0 ===");
const repEdges: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 1],
  [2, 1, -2],
  [1, 3, 3],
  [2, 3, 5],
];
console.log("basic   :", JSON.stringify({ ...bellmanFordBasic(4, repEdges, 0), dist: fmt(bellmanFordBasic(4, repEdges, 0).dist) }));
console.log("final   :", JSON.stringify({ ...bellmanFord(4, repEdges, 0), dist: fmt(bellmanFord(4, repEdges, 0).dist) }));

console.log("\n=== dp[i][v] 트레이스 (대표 예시, rounds=3) ===");
const trace = bellmanFordTrace(4, repEdges, 0, 3);
trace.forEach((snap, i) => console.log(`i=${i}:`, fmt(snap)));

console.log("\n=== naive: 체인 그래프 (10개 정점, 역순 간선, 라운드 상한별 결과) ===");
// 0→1→2→...→9, 하지만 edges 배열 순서를 "9→8, 8→7, ..." 역순으로 넣어 최악 수렴 속도를 만든다
const chainEdges: [number, number, number][] = [];
for (let i = 9; i >= 1; i--) chainEdges.push([i - 1, i, 1]);
for (const cap of [1, 3, 5, 9, 12]) {
  const r = bellmanFordNaiveCapped(10, chainEdges, 0, cap);
  console.log(`maxRounds=${cap.toString().padStart(2)} dist[9]=${r.dist[9]} stillChanging=${r.stillChanging}`);
}
console.log("최종 basic 결과 dist[9] =", bellmanFordBasic(10, chainEdges, 0).dist[9]);

console.log("\n=== naive: 음수 사이클에서 라운드 상한을 늘려도 계속 바뀜 ===");
const negCycleEdges: [number, number, number][] = [
  [0, 1, 1],
  [1, 2, -1],
  [2, 0, -1],
];
for (const cap of [3, 6, 9, 20, 50]) {
  const r = bellmanFordNaiveCapped(3, negCycleEdges, 0, cap);
  console.log(`maxRounds=${cap.toString().padStart(2)} dist=${fmt(r.dist)} stillChanging=${r.stillChanging}`);
}

console.log("\n=== 조기 종료 절감 관찰 (대표 예시) ===");
{
  const dist = new Array<number>(4).fill(Infinity);
  dist[0] = 0;
  for (let i = 1; i <= 3; i++) {
    let updated = false;
    for (const [u, v, w] of repEdges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
      }
    }
    console.log(`라운드 ${i}: updated=${updated} dist=${fmt(dist)}`);
    if (!updated) {
      console.log(`  → 라운드 ${i}에서 조기 종료 (V-1=3인데 ${i}라운드 만에 수렴)`);
      break;
    }
  }
}

console.log("\n=== 엣지 케이스 ===");
console.log("간선 없음:", JSON.stringify({ ...bellmanFord(3, [], 1), dist: fmt(bellmanFord(3, [], 1).dist) }));
console.log("n=1, 간선 없음:", JSON.stringify({ ...bellmanFord(1, [], 0), dist: fmt(bellmanFord(1, [], 0).dist) }));
const unreachableNegCycle: [number, number, number][] = [
  [1, 2, 1],
  [2, 1, -5],
];
console.log("src에서 도달 불가한 음수사이클:", JSON.stringify({ ...bellmanFord(3, unreachableNegCycle, 0), dist: fmt(bellmanFord(3, unreachableNegCycle, 0).dist) }));
const selfLoop: [number, number, number][] = [[0, 0, -1]];
console.log("음수 셀프 루프:", JSON.stringify({ ...bellmanFord(1, selfLoop, 0), dist: fmt(bellmanFord(1, selfLoop, 0).dist) }));

console.log("\n=== 무작위 교차검증: basic vs final(조기종료) 결과 일치 ===");
function randomGraph(n: number, e: number, seed: number): [number, number, number][] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const edges: [number, number, number][] = [];
  for (let i = 0; i < e; i++) {
    const u = Math.floor(rand() * n);
    let v = Math.floor(rand() * n);
    while (v === u) v = Math.floor(rand() * n);
    const w = Math.floor(rand() * 21) - 10; // -10..10
    edges.push([u, v, w]);
  }
  return edges;
}
let mismatches = 0;
for (let trial = 0; trial < 30; trial++) {
  const n = 5 + (trial % 6);
  const e = n * 2;
  const edges = randomGraph(n, e, trial * 97 + 13);
  const a = bellmanFordBasic(n, edges, 0);
  const b = bellmanFord(n, edges, 0);
  const same =
    a.hasNegativeCycle === b.hasNegativeCycle &&
    (a.hasNegativeCycle || a.dist.every((d, i) => d === b.dist[i]));
  if (!same) {
    mismatches++;
    console.log(`불일치 trial=${trial} n=${n}`, fmt(a.dist), fmt(b.dist), a.hasNegativeCycle, b.hasNegativeCycle);
  }
}
console.log(`무작위 30건 중 불일치: ${mismatches}건`);
