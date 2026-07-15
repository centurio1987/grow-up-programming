// ===== 원형: 모든 최대유량 분해를 열거 (개념 코드, 실행 X, 지수 폭발 시연용) =====
// function bruteForceEnumerate(...): 실행 불가능 수준이라 스크래치에서는 생략.

// ===== 기본 구현: SSP + SPFA (Bellman-Ford 변형) =====
type Edge = { to: number; cap: number; cost: number; rev: number };

function minCostMaxFlowBase(
  n: number,
  edges: [number, number, number, number][],
  source: number,
  sink: number,
): { flow: number; cost: number } {
  const graph: Edge[][] = Array.from({ length: n }, () => []);
  const addEdge = (u: number, v: number, cap: number, cost: number) => {
    graph[u].push({ to: v, cap, cost, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, cost: -cost, rev: graph[u].length - 1 });
  };
  for (const [u, v, c, a] of edges) addEdge(u, v, c, a);

  let totalFlow = 0;
  let totalCost = 0;

  while (true) {
    const dist = new Array(n).fill(Infinity);
    const inQueue = new Array(n).fill(false);
    const prevV = new Array(n).fill(-1);
    const prevE = new Array(n).fill(-1);
    dist[source] = 0;
    const queue: number[] = [source];
    inQueue[source] = true;

    while (queue.length > 0) {
      const u = queue.shift()!;
      inQueue[u] = false;
      for (let i = 0; i < graph[u].length; i++) {
        const e = graph[u][i];
        if (e.cap > 0 && dist[u] + e.cost < dist[e.to]) {
          dist[e.to] = dist[u] + e.cost;
          prevV[e.to] = u;
          prevE[e.to] = i;
          if (!inQueue[e.to]) {
            queue.push(e.to);
            inQueue[e.to] = true;
          }
        }
      }
    }

    if (dist[sink] === Infinity) break;

    let delta = Infinity;
    let v = sink;
    while (v !== source) {
      const e = graph[prevV[v]][prevE[v]];
      delta = Math.min(delta, e.cap);
      v = prevV[v];
    }

    v = sink;
    while (v !== source) {
      const e = graph[prevV[v]][prevE[v]];
      e.cap -= delta;
      graph[v][e.rev].cap += delta;
      v = prevV[v];
    }

    totalFlow += delta;
    totalCost += delta * dist[sink];
  }

  return { flow: totalFlow, cost: totalCost };
}

// ===== 최적화 구현: Johnson potential + Dijkstra(binary heap) =====
class MinHeap {
  private heap: [number, number][] = []; // [dist, node]
  get size() {
    return this.heap.length;
  }
  push(item: [number, number]) {
    const h = this.heap;
    h.push(item);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p][0] <= h[i][0]) break;
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
  }
  pop(): [number, number] | undefined {
    const h = this.heap;
    if (h.length === 0) return undefined;
    const top = h[0];
    const last = h.pop()!;
    if (h.length > 0) {
      h[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < h.length && h[l][0] < h[smallest][0]) smallest = l;
        if (r < h.length && h[r][0] < h[smallest][0]) smallest = r;
        if (smallest === i) break;
        [h[smallest], h[i]] = [h[i], h[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

function minCostMaxFlow(
  n: number,
  edges: [number, number, number, number][],
  source: number,
  sink: number,
): { flow: number; cost: number } {
  const graph: Edge[][] = Array.from({ length: n }, () => []);
  const addEdge = (u: number, v: number, cap: number, cost: number) => {
    graph[u].push({ to: v, cap, cost, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, cost: -cost, rev: graph[u].length - 1 });
  };
  for (const [u, v, c, a] of edges) addEdge(u, v, c, a);

  const h = new Array(n).fill(0); // potential, h[source] 항상 0으로 유지
  let totalFlow = 0;
  let totalCost = 0;

  while (true) {
    const dist = new Array(n).fill(Infinity);
    const prevV = new Array(n).fill(-1);
    const prevE = new Array(n).fill(-1);
    const visited = new Array(n).fill(false);
    dist[source] = 0;
    const pq = new MinHeap();
    pq.push([0, source]);

    while (pq.size > 0) {
      const [d, u] = pq.pop()!;
      if (visited[u]) continue;
      if (d > dist[u]) continue;
      visited[u] = true;
      for (let i = 0; i < graph[u].length; i++) {
        const e = graph[u][i];
        if (e.cap <= 0) continue;
        // reduced cost: 원래 cost + h[u] - h[to] (음수 간선 제거)
        const reduced = e.cost + h[u] - h[e.to];
        if (dist[u] + reduced < dist[e.to]) {
          dist[e.to] = dist[u] + reduced;
          prevV[e.to] = u;
          prevE[e.to] = i;
          pq.push([dist[e.to], e.to]);
        }
      }
    }

    if (dist[sink] === Infinity) break;

    // potential 갱신: 다음 라운드에도 reduced cost >= 0 유지
    for (let v = 0; v < n; v++) {
      if (dist[v] < Infinity) h[v] += dist[v];
    }

    let delta = Infinity;
    let v = sink;
    while (v !== source) {
      const e = graph[prevV[v]][prevE[v]];
      delta = Math.min(delta, e.cap);
      v = prevV[v];
    }

    v = sink;
    while (v !== source) {
      const e = graph[prevV[v]][prevE[v]];
      e.cap -= delta;
      graph[v][e.rev].cap += delta;
      v = prevV[v];
    }

    totalFlow += delta;
    totalCost += delta * (h[sink] - h[source]); // h[sink] = 이 라운드까지 누적된 실제 최단거리
  }

  return { flow: totalFlow, cost: totalCost };
}

// ===== 검증 =====
function assertEqual(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  console.log(`${a === e ? "OK  " : "FAIL"} ${name}: got=${a} expect=${e}`);
}

// 1. 시뮬레이션 고정 입력
const simEdges: [number, number, number, number][] = [
  [0, 1, 2, 1],
  [0, 2, 2, 3],
  [1, 3, 2, 1],
  [2, 3, 2, 1],
  [1, 2, 1, 1],
];
assertEqual("sim/base", minCostMaxFlowBase(4, simEdges, 0, 3), { flow: 4, cost: 12 });
assertEqual("sim/opt", minCostMaxFlow(4, simEdges, 0, 3), { flow: 4, cost: 12 });

// 2. 문제 예시들
const cases: [number, [number, number, number, number][], number, number, { flow: number; cost: number }][] = [
  [2, [[0, 1, 5, 2]], 0, 1, { flow: 5, cost: 10 }],
  [3, [[0, 1, 5, 2], [1, 2, 5, 3]], 0, 2, { flow: 5, cost: 25 }],
  [4, [[0, 1, 1, 1], [1, 3, 1, 1], [0, 2, 2, 5], [2, 3, 2, 5]], 0, 3, { flow: 3, cost: 22 }],
  [3, [[0, 1, 10, 5]], 0, 2, { flow: 0, cost: 0 }],
  [2, [[0, 1, 1, 0]], 0, 1, { flow: 1, cost: 0 }],
  [4, [[0, 1, 2, 1], [1, 3, 2, 1], [0, 2, 3, 10], [2, 3, 3, 10]], 0, 3, { flow: 5, cost: 64 }],
];
for (const [n, edges, s, t, expected] of cases) {
  assertEqual(`case/base n=${n}`, minCostMaxFlowBase(n, edges, s, t), expected);
  assertEqual(`case/opt  n=${n}`, minCostMaxFlow(n, edges, s, t), expected);
}

// 3. 엣지 케이스: source==모든 간선 용량 0
assertEqual("edge/zero-cap", minCostMaxFlow(2, [[0, 1, 0, 5]], 0, 1), { flow: 0, cost: 0 });

// 4. 무작위 교차검증 (base vs opt)
function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
let mismatch = 0;
for (let trial = 0; trial < 300; trial++) {
  const n = 2 + randInt(6);
  const m = randInt(10);
  const edges: [number, number, number, number][] = [];
  for (let i = 0; i < m; i++) {
    const u = randInt(n);
    let v = randInt(n);
    if (v === u) v = (v + 1) % n;
    edges.push([u, v, randInt(6), randInt(6)]);
  }
  const s = 0;
  const t = n - 1;
  const r1 = minCostMaxFlowBase(n, edges, s, t);
  const r2 = minCostMaxFlow(n, edges, s, t);
  if (r1.flow !== r2.flow || r1.cost !== r2.cost) {
    mismatch++;
    console.log("MISMATCH", { n, edges, s, t, r1, r2 });
  }
}
console.log(`random cross-check mismatches: ${mismatch}/300`);

// 5. dist[t] 실측 (SPFA 트레이스 프레임 값 재확인용 단독 실행)
{
  const graph: Edge[][] = Array.from({ length: 4 }, () => []);
  const addEdge = (u: number, v: number, cap: number, cost: number) => {
    graph[u].push({ to: v, cap, cost, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, cost: -cost, rev: graph[u].length - 1 });
  };
  for (const [u, v, c, a] of simEdges) addEdge(u, v, c, a);
  // round1 SPFA dist 확인
  const dist = new Array(4).fill(Infinity);
  const inQueue = new Array(4).fill(false);
  dist[0] = 0;
  const queue = [0];
  inQueue[0] = true;
  while (queue.length) {
    const u = queue.shift()!;
    inQueue[u] = false;
    for (const e of graph[u]) {
      if (e.cap > 0 && dist[u] + e.cost < dist[e.to]) {
        dist[e.to] = dist[u] + e.cost;
        if (!inQueue[e.to]) {
          queue.push(e.to);
          inQueue[e.to] = true;
        }
      }
    }
  }
  console.log("round1 dist:", dist);
}

// 6. 최적화 버전 라운드별 potential/거리 트레이스 (문서 서술용)
{
  const graph: Edge[][] = Array.from({ length: 4 }, () => []);
  const addEdge = (u: number, v: number, cap: number, cost: number) => {
    graph[u].push({ to: v, cap, cost, rev: graph[v].length });
    graph[v].push({ to: u, cap: 0, cost: -cost, rev: graph[u].length - 1 });
  };
  for (const [u, v, c, a] of simEdges) addEdge(u, v, c, a);
  const h = [0, 0, 0, 0];
  let round = 0;
  while (true) {
    round++;
    const dist = new Array(4).fill(Infinity);
    const prevV = new Array(4).fill(-1);
    const prevE = new Array(4).fill(-1);
    const visited = new Array(4).fill(false);
    dist[0] = 0;
    const pq = new MinHeap();
    pq.push([0, 0]);
    while (pq.size > 0) {
      const [d, u] = pq.pop()!;
      if (visited[u]) continue;
      if (d > dist[u]) continue;
      visited[u] = true;
      for (let i = 0; i < graph[u].length; i++) {
        const e = graph[u][i];
        if (e.cap <= 0) continue;
        const reduced = e.cost + h[u] - h[e.to];
        if (dist[u] + reduced < dist[e.to]) {
          dist[e.to] = dist[u] + reduced;
          prevV[e.to] = u;
          prevE[e.to] = i;
          pq.push([dist[e.to], e.to]);
        }
      }
    }
    console.log(`round${round} reducedDist=`, dist, "h(before update)=", [...h]);
    if (dist[3] === Infinity) break;
    for (let v = 0; v < 4; v++) if (dist[v] < Infinity) h[v] += dist[v];
    console.log(`round${round} h(after update)=`, [...h], "실제 dist[t]=h[3]-h[0]=", h[3] - h[0]);
    let delta = Infinity;
    let v = 3;
    while (v !== 0) {
      const e = graph[prevV[v]][prevE[v]];
      delta = Math.min(delta, e.cap);
      v = prevV[v];
    }
    v = 3;
    while (v !== 0) {
      const e = graph[prevV[v]][prevE[v]];
      e.cap -= delta;
      graph[v][e.rev].cap += delta;
      v = prevV[v];
    }
    console.log(`round${round} delta=`, delta);
  }
}
