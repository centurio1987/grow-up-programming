// ============================================================
// 가이드 본문 코드 자기 검증용 스크래치.
// dijkstra-guide.new.mdx에 실린 코드를 그대로 옮겨 실행값을 실측한다.
// ============================================================

// ---------- (A) 출발점: O(V^2) 선형 탐색 ----------
function dijkstraLinearScan(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  const visited = new Array<boolean>(n).fill(false);
  dist[src] = 0;

  for (let round = 0; round < n; round++) {
    let u = -1;
    let best = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && dist[v] < best) {
        best = dist[v];
        u = v;
      }
    }
    if (u === -1) break; // 남은 정점이 전부 도달 불가
    visited[u] = true;
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }
  return dist;
}

// 계측판: "매 라운드 전체 V칸을 훑는다"를 실측 (출발점 ascii art 근거)
function dijkstraLinearScanCounting(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; scans: number } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  const visited = new Array<boolean>(n).fill(false);
  dist[src] = 0;
  let scans = 0;

  for (let round = 0; round < n; round++) {
    let u = -1;
    let best = Infinity;
    for (let v = 0; v < n; v++) {
      scans++; // visited 여부와 무관하게 매 칸을 검사
      if (!visited[v] && dist[v] < best) {
        best = dist[v];
        u = v;
      }
    }
    if (u === -1) break;
    visited[u] = true;
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }
  return { dist, scans };
}

// ---------- (B) 아이디어를 코드로 옮기기: 배열을 통째로 재정렬하는 PQ ----------
class SortedArrayPQ {
  private items: [number, number][] = [];
  public resortedElements = 0; // 계측: pop마다 다시 정렬한 원소 총합

  push(item: [number, number]) {
    this.items.push(item);
  }

  pop(): [number, number] | undefined {
    if (this.items.length === 0) return undefined;
    this.resortedElements += this.items.length; // 매번 통째로 다시 정렬
    this.items.sort((a, b) => a[0] - b[0]);
    return this.items.shift();
  }

  get size() {
    return this.items.length;
  }
}

function dijkstraSortedArrayPQ(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; resortedElements: number } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;

  const pq = new SortedArrayPQ();
  pq.push([0, src]);

  while (pq.size > 0) {
    const [d, u] = pq.pop()!;
    if (d > dist[u]) continue; // stale entry: 이미 더 짧은 경로를 발견한 낡은 항목
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        pq.push([nd, v]);
      }
    }
  }
  return { dist, resortedElements: pq.resortedElements };
}

// ---------- (C) 최적화 코드: 이진 최소 힙 ----------
class MinHeap {
  private items: [number, number][] = []; // [dist값, 정점]
  public siftOps = 0; // 계측: push/pop 중 일어난 swap 횟수

  get size() {
    return this.items.length;
  }

  push(item: [number, number]) {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent][0] <= this.items[i][0]) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
      this.siftOps++;
    }
  }

  pop(): [number, number] | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      while (true) {
        const l = i * 2 + 1;
        const r = i * 2 + 2;
        let smallest = i;
        if (l < this.items.length && this.items[l][0] < this.items[smallest][0]) smallest = l;
        if (r < this.items.length && this.items[r][0] < this.items[smallest][0]) smallest = r;
        if (smallest === i) break;
        [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
        i = smallest;
        this.siftOps++;
      }
    }
    return top;
  }
}

function dijkstra(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;

  const heap = new MinHeap();
  heap.push([0, src]);

  while (heap.size > 0) {
    const [d, u] = heap.pop()!;
    if (d > dist[u]) continue; // stale entry
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push([nd, v]);
      }
    }
  }
  return dist;
}

function dijkstraWithSiftCount(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; siftOps: number } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;

  const heap = new MinHeap();
  heap.push([0, src]);

  while (heap.size > 0) {
    const [d, u] = heap.pop()!;
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push([nd, v]);
      }
    }
  }
  return { dist, siftOps: heap.siftOps };
}

// ---------- (D) 함정 재현: stale 검사 부등호 실수 ----------
function dijkstraBuggyStaleCheck(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  dist[src] = 0;

  const heap = new MinHeap();
  heap.push([0, src]);

  while (heap.size > 0) {
    const [d, u] = heap.pop()!;
    if (d >= dist[u]) continue; // 버그: >= 로 잘못 씀 (정상은 >)
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        heap.push([nd, v]);
      }
    }
  }
  return dist;
}

// ---------- (E) 함정 재현: 음수 가중치 + "확정 후 잠금(visited)" ----------
// 흔한 실수: "한 번 뽑은 정점은 다시 처리할 필요 없다"는 생각으로 visited 배열을 추가하는 것.
// w >= 0에서는 stale 체크(d > dist[u])와 완전히 동일하게 동작하지만, 음수 간선이 있으면
// "아직 더 짧은 경로가 남아 있는데 잠가버리는" 사고가 난다.
function dijkstraVisitedLocked(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const dist = new Array<number>(n).fill(Infinity);
  const visited = new Array<boolean>(n).fill(false);
  dist[src] = 0;
  const heap = new MinHeap();
  heap.push([0, src]);
  while (heap.size > 0) {
    const [d, u] = heap.pop()!;
    if (visited[u]) continue; // 한 번 확정되면 영원히 잠금
    visited[u] = true;
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        heap.push([dist[v], v]);
      }
    }
  }
  return dist;
}

// ============================================================
// 실행 & 검증
// ============================================================

function fmt(arr: number[]) {
  return "[" + arr.map((x) => (x === Infinity ? "Infinity" : x)).join(", ") + "]";
}

console.log("=== 대표 예시: n=4 ===");
const mainEdges: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 1],
  [2, 1, 2],
  [1, 3, 1],
  [2, 3, 5],
];
console.log("linearScan   :", fmt(dijkstraLinearScan(4, mainEdges, 0)));
console.log("sortedArrayPQ:", fmt(dijkstraSortedArrayPQ(4, mainEdges, 0).dist));
console.log("heap         :", fmt(dijkstra(4, mainEdges, 0)));

console.log("\n=== 엣지케이스 (dijkstra-problem.md 예시와 대조) ===");
console.log("고립 정점 dijkstra(3,[[0,1,2]],0):", fmt(dijkstra(3, [[0, 1, 2]], 0)));
console.log("간선 없음 dijkstra(3,[],1):", fmt(dijkstra(3, [], 1)));
console.log("역방향 불가 dijkstra(2,[[0,1,5]],1):", fmt(dijkstra(2, [[0, 1, 5]], 1)));
console.log(
  "다중 간선 dijkstra(2,[[0,1,9],[0,1,3],[0,1,7]],0):",
  fmt(dijkstra(2, [[0, 1, 9], [0, 1, 3], [0, 1, 7]], 0)),
);
console.log(
  "셀프 루프 dijkstra(2,[[0,0,5],[0,1,2]],0):",
  fmt(dijkstra(2, [[0, 0, 5], [0, 1, 2]], 0)),
);
console.log("n=1, 간선 없음 dijkstra(1,[],0):", fmt(dijkstra(1, [], 0)));

console.log("\n=== 무작위 교차 검증 (linearScan vs sortedArrayPQ vs heap) ===");
function randomGraph(n: number, m: number) {
  const edges: [number, number, number][] = [];
  for (let i = 0; i < m; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    const w = Math.floor(Math.random() * 20);
    edges.push([u, v, w]);
  }
  return edges;
}
let allMatch = true;
for (let t = 0; t < 200; t++) {
  const n = 2 + Math.floor(Math.random() * 15);
  const m = Math.floor(Math.random() * 30);
  const edges = randomGraph(n, m);
  const src = Math.floor(Math.random() * n);
  const a = dijkstraLinearScan(n, edges, src);
  const b = dijkstraSortedArrayPQ(n, edges, src).dist;
  const c = dijkstra(n, edges, src);
  const match = a.every((x, i) => x === b[i] && x === c[i]);
  if (!match) {
    allMatch = false;
    console.log("MISMATCH", { n, edges, src, a, b, c });
  }
}
console.log("200회 무작위 테스트 3구현 전부 일치?", allMatch);

console.log("\n=== 출발점 ascii art 근거: 매 라운드 전체 V칸 스캔 ===");
for (const n of [5, 10, 100, 1000]) {
  const edges: [number, number, number][] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1, 1]); // 체인 그래프
  const { scans } = dijkstraLinearScanCounting(n, edges, 0);
  console.log(`n=${n}: 스캔 횟수=${scans} (V^2=${n * n})`);
}

console.log("\n=== 더 빠르게 만들 단서: 재정렬 총량(sortedArrayPQ) vs sift 총량(heap) ===");
for (const n of [50, 200, 1000]) {
  const edges: [number, number, number][] = [];
  // 살짝 조밀한 랜덤 그래프 (간선 수 ≈ 3n)
  for (let i = 0; i < 3 * n; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    const w = 1 + Math.floor(Math.random() * 50);
    edges.push([u, v, w]);
  }
  const { resortedElements } = dijkstraSortedArrayPQ(n, edges, 0);
  const { siftOps } = dijkstraWithSiftCount(n, edges, 0);
  console.log(
    `n=${n}, E=${edges.length}: sortedArrayPQ 재정렬 원소 총합=${resortedElements}, heap sift 총합=${siftOps}`,
  );
}

console.log("\n=== 함정 재현: stale 검사 >= 버그 ===");
{
  const buggy = dijkstraBuggyStaleCheck(4, mainEdges, 0);
  const correct = dijkstra(4, mainEdges, 0);
  console.log("정상        :", fmt(correct));
  console.log("버그(d>=dist):", fmt(buggy));
}

console.log("\n=== 함정 재현: 음수 가중치 + visited 잠금 ===");
{
  // 0->1 직접 1, 0->2 5, 2->1 -10, 1->3 100
  // 진짜 최단 dist[1] = min(1, 5-10) = -5 → dist[3] = dist[1] + 100 = 95 여야 한다.
  // 그런데 "한 번 꺼낸 정점은 다시 안 본다(visited 잠금)"를 쓰면, v1이 d=1로 먼저
  // 확정되어 1->3 완화가 dist[3]=101로 끝나 버리고, 이후 dist[1]이 -5로 갱신돼도
  // v1이 잠겨 있어 1->3을 다시 완화하지 못한다.
  const negEdges: [number, number, number][] = [
    [0, 1, 1],
    [0, 2, 5],
    [2, 1, -10],
    [1, 3, 100],
  ];
  const locked = dijkstraVisitedLocked(4, negEdges, 0);
  const lazy = dijkstra(4, negEdges, 0);
  console.log("정답(수작업): dist[1] = min(직접 1, 0->2->1 = 5-10 = -5) = -5, dist[2] = 5, dist[3] = -5+100 = 95");
  console.log("visited 잠금 버전:", fmt(locked), "← dist[3]이 틀림 (v1이 d=1일 때 조기 확정되어 1->3을 101로만 완화, d=-5 갱신 후 재확장 못 함)");
  console.log("이 가이드의 lazy 버전  :", fmt(lazy), "(재푸시로 dist[3]=95까지 정답에 도달)");
}

console.log("\n=== 실행 시각화 절 프레임 대조용: n=4 src=0 최종 dist ===");
console.log(fmt(dijkstra(4, mainEdges, 0)), "(steps 마지막 프레임과 일치해야 함: [0, 3, 1, 4])");

console.log("\n=== 스스로 점검하기 문제1 검증 ===");
console.log(fmt(dijkstra(5, [[0,1,2],[0,2,4],[1,2,1],[1,3,7],[2,3,3],[3,4,1]], 0)));
