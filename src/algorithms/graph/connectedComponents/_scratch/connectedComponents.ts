// E3 자기검증 스크래치 — connectedComponents-guide.new.mdx 본문 코드를 그대로 추출해 실행한다.
// bun src/algorithms/graph/connectedComponents/_scratch/connectedComponents.ts

// ---------------------------------------------------------------------------
// 1) 출발점: 가장 순진한 방법 — 모든 쌍을 개별 BFS로 판별
// ---------------------------------------------------------------------------

function pathExistsNaive(adj: number[][], start: number, target: number): boolean {
  if (start === target) return true;
  const n = adj.length;
  const visited = new Array<boolean>(n).fill(false);
  const queue = [start];
  visited[start] = true;
  while (queue.length > 0) {
    const v = queue.shift()!;
    for (const w of adj[v]) {
      if (!visited[w]) {
        if (w === target) return true;
        visited[w] = true;
        queue.push(w);
      }
    }
  }
  return false;
}

function connectedComponentsNaive(n: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const groupId = new Array<number>(n).fill(-1);
  let nextId = 0;
  for (let u = 0; u < n; u++) {
    if (groupId[u] !== -1) continue;
    groupId[u] = nextId;
    for (let v = u + 1; v < n; v++) {
      if (groupId[v] !== -1) continue;
      if (pathExistsNaive(adj, u, v)) groupId[v] = nextId;
    }
    nextId++;
  }
  const groups = new Map<number, number[]>();
  for (let v = 0; v < n; v++) {
    if (!groups.has(groupId[v])) groups.set(groupId[v], []);
    groups.get(groupId[v])!.push(v);
  }
  return [...groups.values()];
}

// ---------------------------------------------------------------------------
// 2) 아이디어를 코드로 옮기기 — 기본 구현 (array-of-arrays 인접 리스트 + head 포인터 큐)
// ---------------------------------------------------------------------------

function connectedComponentsBasic(n: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const visited = new Array<boolean>(n).fill(false);
  const result: number[][] = [];

  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;

    const component: number[] = [];
    const queue: number[] = [s];
    let head = 0;
    visited[s] = true;

    while (head < queue.length) {
      const v = queue[head]!;
      head++;
      component.push(v);
      for (const w of adj[v]) {
        if (!visited[w]) {
          visited[w] = true;
          queue.push(w);
        }
      }
    }

    component.sort((a, b) => a - b);
    result.push(component);
  }

  result.sort((a, b) => a[0]! - b[0]!);
  return result;
}

// ---------------------------------------------------------------------------
// 3) 최적화 코드 — CSR(압축 희소 행) 인접 리스트
// ---------------------------------------------------------------------------

function connectedComponents(n: number, edges: [number, number][]): number[][] {
  // 1차 패스: 차수 세기
  const degree = new Int32Array(n);
  for (const [u, v] of edges) {
    degree[u]!++;
    degree[v]!++;
  }

  // 접두사 합으로 각 정점의 인접 구간 시작 위치 결정
  const start = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) start[i + 1] = start[i]! + degree[i]!;

  // 2차 패스: 하나의 평평한 배열에 채워 넣기 (cursor로 삽입 위치 추적)
  const adj = new Int32Array(start[n]);
  const cursor = start.slice(0, n);
  for (const [u, v] of edges) {
    adj[cursor[u]!++] = v;
    adj[cursor[v]!++] = u;
  }

  const visited = new Uint8Array(n);
  const result: number[][] = [];
  const queue = new Int32Array(n);

  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = s;
    visited[s] = 1;
    const component: number[] = [];

    while (head < tail) {
      const v = queue[head]!;
      head++;
      component.push(v);
      for (let k = start[v]!; k < start[v + 1]!; k++) {
        const w = adj[k]!;
        if (!visited[w]) {
          visited[w] = 1;
          queue[tail++] = w;
        }
      }
    }

    component.sort((a, b) => a - b);
    result.push(component);
  }

  result.sort((a, b) => a[0]! - b[0]!);
  return result;
}

// ---------------------------------------------------------------------------
// 검증
// ---------------------------------------------------------------------------

function eq(a: number[][], b: number[][]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

console.log("=== 대표 예시 (시뮬레이션과 동일 입력) ===");
const repN = 6;
const repEdges: [number, number][] = [
  [0, 1],
  [1, 2],
  [3, 4],
];
console.log("naive:", JSON.stringify(connectedComponentsNaive(repN, repEdges)));
console.log("basic:", JSON.stringify(connectedComponentsBasic(repN, repEdges)));
console.log("optim:", JSON.stringify(connectedComponents(repN, repEdges)));

console.log("\n=== problem.md 예시 교차검증 ===");
const cases: Array<{ n: number; edges: [number, number][]; expect: number[][] }> = [
  { n: 5, edges: [[0, 1], [1, 2], [3, 4]], expect: [[0, 1, 2], [3, 4]] },
  { n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]], expect: [[0, 1, 2, 3]] },
  { n: 4, edges: [], expect: [[0], [1], [2], [3]] },
  { n: 3, edges: [[1, 1]], expect: [[0], [1], [2]] },
  { n: 1, edges: [], expect: [[0]] },
];
for (const c of cases) {
  const got = connectedComponents(c.n, c.edges);
  const gotBasic = connectedComponentsBasic(c.n, c.edges);
  const gotNaive = connectedComponentsNaive(c.n, c.edges);
  console.log(
    `n=${c.n} edges=${JSON.stringify(c.edges)} -> ${JSON.stringify(got)}`,
    eq(got, c.expect) && eq(gotBasic, c.expect) && eq(gotNaive, c.expect) ? "OK" : "MISMATCH",
  );
}

console.log("\n=== 무작위 교차검증 (naive vs basic vs optim, n<=40) ===");
function randomGraph(n: number, maxE: number): [number, number][] {
  const e: [number, number][] = [];
  const cnt = Math.floor(Math.random() * maxE);
  for (let i = 0; i < cnt; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    e.push([u, v]);
  }
  return e;
}
let allMatch = true;
for (let trial = 0; trial < 200; trial++) {
  const n = 1 + Math.floor(Math.random() * 40);
  const edges = randomGraph(n, 60);
  const a = connectedComponentsNaive(n, edges);
  const b = connectedComponentsBasic(n, edges);
  const c = connectedComponents(n, edges);
  if (!eq(a, b) || !eq(b, c)) {
    allMatch = false;
    console.log("MISMATCH at trial", trial, { n, edges, a, b, c });
  }
}
console.log(allMatch ? "무작위 200회 전부 일치 (OK)" : "불일치 발견");

console.log("\n=== 큐 구현 비용: shift() 누적 이동 칸수 (별 그래프, 이론값과 대조) ===");
function measureShiftCost(n: number, edges: [number, number][]): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const visited = new Array<boolean>(n).fill(false);
  let shiftCost = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    const queue: number[] = [s];
    visited[s] = true;
    while (queue.length > 0) {
      shiftCost += queue.length - 1; // shift() 직전 나머지 원소 수 = 당겨야 하는 칸 수
      const v = queue.shift()!;
      for (const w of adj[v]) {
        if (!visited[w]) {
          visited[w] = true;
          queue.push(w);
        }
      }
    }
  }
  return shiftCost;
}
function starGraph(n: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 1; i < n; i++) edges.push([0, i]);
  return edges;
}
for (const n of [5, 10, 100, 1000]) {
  const edges = starGraph(n);
  const shiftCost = measureShiftCost(n, edges);
  console.log(
    `n=${n} (별 그래프) shift 누적 이동 칸수=${shiftCost} (이론값 (n-1)(n-2)/2=${((n - 1) * (n - 2)) / 2})`,
  );
}

console.log("\n=== array-of-arrays vs CSR 실측 (n=e=100000, 무작위 그래프, warmup 1회 + 5회 평균) ===");
function bigRandomGraph(n: number, e: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < e; i++) {
    edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
  }
  return edges;
}
{
  const n = 100000;
  const e = 100000;
  const graphs = Array.from({ length: 6 }, () => bigRandomGraph(n, e));
  // JIT 워밍업 1회 (측정에서 제외)
  connectedComponentsBasic(n, graphs[0]!);
  connectedComponents(n, graphs[0]!);
  let basicTotal = 0;
  let optimTotal = 0;
  let allEq = true;
  for (let trial = 1; trial < 6; trial++) {
    const edges = graphs[trial]!;
    const t0 = performance.now();
    const rBasic = connectedComponentsBasic(n, edges);
    const t1 = performance.now();
    const rOptim = connectedComponents(n, edges);
    const t2 = performance.now();
    basicTotal += t1 - t0;
    optimTotal += t2 - t1;
    allEq = allEq && eq(rBasic, rOptim);
    console.log(`trial ${trial}: basic=${(t1 - t0).toFixed(1)}ms  optim=${(t2 - t1).toFixed(1)}ms`);
  }
  console.log(
    `5회 평균: basic(array-of-arrays)=${(basicTotal / 5).toFixed(1)}ms  optim(CSR)=${(optimTotal / 5).toFixed(1)}ms  배수=${(basicTotal / optimTotal).toFixed(2)}x  전체일치=${allEq}`,
  );
}

console.log("\n=== 최악형 입력(별 그래프) n=e=100000 최종 실행시간 ===");
{
  const n = 100000;
  const edges = starGraph(n);
  const t0 = performance.now();
  connectedComponents(n, edges);
  const t1 = performance.now();
  console.log(`optim(CSR) 별그래프 n=${n}: ${(t1 - t0).toFixed(1)}ms`);
}
