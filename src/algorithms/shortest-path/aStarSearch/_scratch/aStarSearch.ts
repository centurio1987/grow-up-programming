// E3 자기검증 스크래치 — 가이드 본문에 실리는 코드를 그대로 추출해 실행값을 확인한다.

// ---- MinHeap (가이드 "아이디어를 코드로 옮기기" 절에서 정의) ----
class MinHeap<T> {
  private items: { key: number; value: T }[] = [];

  get size(): number {
    return this.items.length;
  }

  push(key: number, value: T): void {
    this.items.push({ key, value });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent]!.key <= this.items[i]!.key) break;
      [this.items[parent]!, this.items[i]!] = [this.items[i]!, this.items[parent]!];
      i = parent;
    }
  }

  pop(): { key: number; value: T } | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      const n = this.items.length;
      while (true) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < n && this.items[l]!.key < this.items[smallest]!.key) smallest = l;
        if (r < n && this.items[r]!.key < this.items[smallest]!.key) smallest = r;
        if (smallest === i) break;
        [this.items[smallest]!, this.items[i]!] = [this.items[i]!, this.items[smallest]!];
        i = smallest;
      }
    }
    return top;
  }
}

// ---- 원형 (출발점): Dijkstra로 전체를 계산해 dist[goal] 반환 ----
function shortestPathAll(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);

  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const heap = new MinHeap<number>();
  heap.push(0, src);

  while (heap.size > 0) {
    const { key: d, value: u } = heap.pop()!;
    if (d > dist[u]!) continue;
    for (const [v, w] of adj[u]!) {
      const nd = d + w;
      if (nd < dist[v]!) {
        dist[v] = nd;
        heap.push(nd, v);
      }
    }
  }
  return dist;
}

function aStarNaive(
  n: number,
  edges: [number, number, number][],
  src: number,
  goal: number,
  _h: (v: number) => number,
): number {
  const dist = shortestPathAll(n, edges, src);
  return dist[goal]!;
}

// ---- 기본 구현 (아이디어를 코드로 옮기기): f=g+h, pop 시점에 h(u) 재계산 ----
function aStarSearchBasic(
  n: number,
  edges: [number, number, number][],
  src: number,
  goal: number,
  h: (v: number) => number,
): number {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);

  const g = new Array(n).fill(Infinity);
  g[src] = 0;

  const heap = new MinHeap<number>();
  heap.push(h(src), src);

  while (heap.size > 0) {
    const { key: f, value: u } = heap.pop()!;

    if (u === goal) return g[u]!;

    if (f > g[u]! + h(u)) continue; // stale entry: h(u) 재계산

    for (const [v, w] of adj[u]!) {
      const newG = g[u]! + w;
      if (newG < g[v]!) {
        g[v] = newG;
        heap.push(newG + h(v), v);
      }
    }
  }

  return Infinity;
}

// ---- 최적화 구현 (최적화 코드): push 시점 g를 함께 보관, pop 시점엔 g만 비교 ----
function aStarSearch(
  n: number,
  edges: [number, number, number][],
  src: number,
  goal: number,
  h: (v: number) => number,
): number {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);

  const g = new Array(n).fill(Infinity);
  g[src] = 0;

  const heap = new MinHeap<{ g: number; u: number }>();
  heap.push(h(src), { g: 0, u: src });

  while (heap.size > 0) {
    const { value: entry } = heap.pop()!;
    const { g: gAtPush, u } = entry;

    if (u === goal) return g[u]!;

    if (gAtPush > g[u]!) continue; // stale entry: O(1) 비교, h(u) 재호출 없음

    for (const [v, w] of adj[u]!) {
      const newG = g[u]! + w;
      if (newG < g[v]!) {
        g[v] = newG;
        heap.push(newG + h(v), { g: newG, u: v });
      }
    }
  }

  return Infinity;
}

// ============================================================
// 검증 1: -problem.md 예시
// ============================================================
console.log("=== problem.md 예시 ===");
{
  const edges: [number, number, number][] = [
    [0, 1, 1],
    [0, 2, 4],
    [1, 2, 2],
    [1, 3, 5],
    [2, 3, 1],
    [3, 4, 3],
  ];
  console.log("ex1 (기대 7):", aStarSearch(5, edges, 0, 4, () => 0));
  console.log("ex2 (기대 0):", aStarSearch(3, [[0, 1, 10]], 1, 1, () => 0));
  console.log("ex3 (기대 Infinity):", aStarSearch(3, [[0, 1, 2]], 0, 2, () => 0));

  const edgesLinear: [number, number, number][] = [
    [0, 1, 1],
    [1, 2, 1],
    [2, 3, 1],
    [0, 2, 10],
  ];
  console.log(
    "ex4 (기대 3):",
    aStarSearch(4, edgesLinear, 0, 3, (v) => Math.max(0, 3 - v)),
  );
}

// ============================================================
// 검증 2: 구 가이드 시뮬레이션 그래프 (n=5, src=0, goal=4)
// ============================================================
console.log("\n=== 구 가이드 시뮬 그래프 ===");
{
  const n = 5;
  const edges: [number, number, number][] = [
    [0, 1, 1],
    [0, 2, 4],
    [1, 3, 2],
    [1, 2, 1],
    [2, 4, 1],
    [3, 4, 3],
  ];
  const hArr = [2, 2, 1, 2, 0];
  const h = (v: number) => hArr[v]!;
  console.log("aStarSearch (기대 3):", aStarSearch(n, edges, 0, 4, h));
  console.log("aStarSearchBasic (기대 3):", aStarSearchBasic(n, edges, 0, 4, h));
  console.log("aStarNaive dist[goal] (기대 3):", aStarNaive(n, edges, 0, 4, h));

  // pop 순서 트레이스 (본문 시뮬 steps 검증용)
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);
  const g = new Array(n).fill(Infinity);
  g[0] = 0;
  const heap = new MinHeap<{ g: number; u: number }>();
  heap.push(h(0), { g: 0, u: 0 });
  const order: { u: number; f: number; g: number }[] = [];
  while (heap.size > 0) {
    const { key: f, value } = heap.pop()!;
    order.push({ u: value.u, f, g: value.g });
    if (value.u === 4) break;
    if (value.g > g[value.u]!) continue;
    for (const [v, w] of adj[value.u]!) {
      const newG = g[value.u]! + w;
      if (newG < g[v]!) {
        g[v] = newG;
        heap.push(newG + h(v), { g: newG, u: v });
      }
    }
  }
  console.log("pop 순서:", JSON.stringify(order));
  console.log("최종 g:", g);
}

// ============================================================
// 검증 3: 출발점(naive) 절 — decoy chain으로 "방향 무시" 낭비 체감
// ============================================================
console.log("\n=== decoy chain: naive vs A* 확장 노드 수 ===");
{
  const n = 6;
  // 0(src) --5--> 1(goal)
  // 0 --1--> 2 --1--> 3 --1--> 4 --1--> 5  (goal과 무관한 decoy 사슬, 막다른 길)
  const edges: [number, number, number][] = [
    [0, 1, 5],
    [0, 2, 1],
    [2, 3, 1],
    [3, 4, 1],
    [4, 5, 1],
  ];
  const goal = 1;

  // naive: 전체 다익스트라 pop 순서 계측
  {
    const adj: [number, number][][] = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edges) adj[u]!.push([v, w]);
    const dist = new Array(n).fill(Infinity);
    dist[0] = 0;
    const heap = new MinHeap<number>();
    heap.push(0, 0);
    const popOrder: number[] = [];
    while (heap.size > 0) {
      const { key: d, value: u } = heap.pop()!;
      if (d > dist[u]!) continue;
      popOrder.push(u);
      for (const [v, w] of adj[u]!) {
        const nd = d + w;
        if (nd < dist[v]!) {
          dist[v] = nd;
          heap.push(nd, v);
        }
      }
    }
    console.log("naive(dijkstra) pop 순서:", popOrder, "dist[goal]=", dist[goal]);
  }

  // A*: h(1)=0(goal), 나머지 decoy는 실제 거리(Infinity)보다만 작으면 되므로 1000
  const h = (v: number) => (v === goal ? 0 : v === 0 ? 0 : 1000);
  {
    const adj: [number, number][][] = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edges) adj[u]!.push([v, w]);
    const g = new Array(n).fill(Infinity);
    g[0] = 0;
    const heap = new MinHeap<{ g: number; u: number }>();
    heap.push(h(0), { g: 0, u: 0 });
    const popOrder: number[] = [];
    let answer = Infinity;
    while (heap.size > 0) {
      const { value: entry } = heap.pop()!;
      popOrder.push(entry.u);
      if (entry.u === goal) {
        answer = g[entry.u]!;
        break;
      }
      if (entry.g > g[entry.u]!) continue;
      for (const [v, w] of adj[entry.u]!) {
        const newG = g[entry.u]! + w;
        if (newG < g[v]!) {
          g[v] = newG;
          heap.push(newG + h(v), { g: newG, u: v });
        }
      }
    }
    console.log("A* pop 순서:", popOrder, "answer=", answer);
  }
}

// ============================================================
// 검증 4: h() 재호출 카운트 (기본 구현 vs 최적화 구현)
// ============================================================
console.log("\n=== h() 호출 횟수: 기본 구현 vs 최적화 구현 ===");
{
  const n = 4;
  const edges: [number, number, number][] = [
    [0, 1, 5],
    [0, 2, 1],
    [2, 1, 1],
    [1, 3, 100],
  ];
  const goal = 3;

  let basicCalls = 0;
  const hBasic = (_v: number) => {
    basicCalls++;
    return 0;
  };
  const basicAnswer = aStarSearchBasic(n, edges, 0, goal, hBasic);
  console.log("기본 구현: h() 호출", basicCalls, "회, 반환", basicAnswer);

  let optCalls = 0;
  const hOpt = (_v: number) => {
    optCalls++;
    return 0;
  };
  const optAnswer = aStarSearch(n, edges, 0, goal, hOpt);
  console.log("최적화 구현: h() 호출", optCalls, "회, 반환", optAnswer);
}

// ============================================================
// 검증 5: admissible 위반 시 오답 (함정 시나리오)
// ============================================================
console.log("\n=== 함정: admissible 위반 시 오답 ===");
{
  const n = 4;
  const edges: [number, number, number][] = [
    [0, 3, 10], // 0 -> goal 직행 (비쌈)
    [0, 2, 1],
    [2, 3, 1], // 0 -> 2 -> goal (진짜 최단, 비용 2)
  ];
  const goal = 3;

  // 올바른(admissible) h: 항상 0 (자명히 admissible)
  const correct = aStarSearch(n, edges, 0, goal, () => 0);
  console.log("admissible h=0 사용 (기대 2):", correct);

  // 위반: h(2) = 100 (실제 d(2,goal)=1 인데 100으로 과대 추정 — admissible 아님)
  const hBad = (v: number) => (v === 2 ? 100 : 0);
  const wrong = aStarSearch(n, edges, 0, goal, hBad);
  console.log("non-admissible h(2)=100 사용 (실제로는 잘못된 값):", wrong);
}

// ============================================================
// 검증 6: 무작위 교차검증 (aStarSearch vs 완전탐색 Dijkstra 기준)
// ============================================================
console.log("\n=== 무작위 교차검증 ===");
{
  function randomGraph(n: number, m: number, maxW: number) {
    const edges: [number, number, number][] = [];
    for (let i = 0; i < m; i++) {
      const u = Math.floor(Math.random() * n);
      const v = Math.floor(Math.random() * n);
      const w = Math.floor(Math.random() * maxW);
      edges.push([u, v, w]);
    }
    return edges;
  }

  let mismatches = 0;
  for (let t = 0; t < 200; t++) {
    const n = 5 + Math.floor(Math.random() * 10);
    const edges = randomGraph(n, 15, 20);
    const src = Math.floor(Math.random() * n);
    const goal = Math.floor(Math.random() * n);

    const expected = shortestPathAll(n, edges, src)[goal]!;
    const got = aStarSearch(n, edges, src, goal, () => 0); // h=0은 항상 admissible
    if (expected !== got) {
      mismatches++;
      console.log("MISMATCH", { n, edges, src, goal, expected, got });
    }
  }
  console.log(`${mismatches}건 불일치 (기대: 0)`);
}

// ============================================================
// 검증 7: 엣지 케이스
// ============================================================
console.log("\n=== 엣지 케이스 ===");
{
  console.log("src===goal:", aStarSearch(3, [[0, 1, 10]], 1, 1, () => 0), "(기대 0)");
  console.log(
    "도달 불가:",
    aStarSearch(3, [[0, 1, 2]], 0, 2, () => 0),
    "(기대 Infinity)",
  );
  console.log(
    "간선 없음(n=1):",
    aStarSearch(1, [], 0, 0, () => 0),
    "(기대 0)",
  );
  console.log(
    "다중 간선(같은 정점쌍):",
    aStarSearch(
      2,
      [
        [0, 1, 5],
        [0, 1, 2],
        [0, 1, 9],
      ],
      0,
      1,
      () => 0,
    ),
    "(기대 2, 가장 짧은 간선 선택)",
  );
}

// ============================================================
// 검증 8: 점검문제 1 pop 순서 트레이스
// ============================================================
console.log("\n=== 점검문제1 pop 순서 트레이스 ===");
{
  const n = 4;
  const edges: [number, number, number][] = [
    [0, 1, 5],
    [0, 2, 1],
    [2, 1, 1],
    [1, 3, 100],
  ];
  const goal = 3;
  const h = (_v: number) => 0;

  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);
  const g = new Array(n).fill(Infinity);
  g[0] = 0;
  const heap = new MinHeap<{ g: number; u: number }>();
  heap.push(h(0), { g: 0, u: 0 });
  const order: { u: number; gAtPush: number; stale: boolean }[] = [];
  let answer: number | null = null;
  while (heap.size > 0) {
    const { value: entry } = heap.pop()!;
    const stale = entry.g > g[entry.u]!;
    order.push({ u: entry.u, gAtPush: entry.g, stale });
    if (entry.u === goal) {
      answer = g[entry.u]!;
      break;
    }
    if (stale) continue;
    for (const [v, w] of adj[entry.u]!) {
      const newG = g[entry.u]! + w;
      if (newG < g[v]!) {
        g[v] = newG;
        heap.push(newG + h(v), { g: newG, u: v });
      }
    }
  }
  console.log("pop 순서:", JSON.stringify(order), "answer=", answer);
}

// ============================================================
// 검증 9: 점검문제 2 숫자
// ============================================================
console.log("\n=== 점검문제2 숫자 ===");
{
  const n = 3;
  const edges: [number, number, number][] = [
    [0, 1, 3],
    [0, 2, 1],
    [2, 1, 1],
  ];
  const goal = 1;
  const correct = aStarSearch(n, edges, 0, goal, () => 0);
  console.log("admissible h=0 (기대 2):", correct);
  const hBad = (v: number) => (v === 2 ? 50 : 0);
  const wrong = aStarSearch(n, edges, 0, goal, hBad);
  console.log("h(2)=50 위반 시:", wrong);
}
