// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출해 실행 검증한다.

// ---- 출발점: naive_prim (배열 기반 O(V^2)) ----
function primMstNaive(n: number, edges: [number, number, number][]): number {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    if (u === v) continue; // 자기 루프는 신장 트리에 포함되지 않음
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }

  const visited = new Array<boolean>(n).fill(false);
  const minEdge = new Array<number>(n).fill(Infinity); // 각 미방문 정점까지의 최소 연결 비용
  minEdge[0] = 0;
  let totalWeight = 0;
  let visitedCount = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && (u === -1 || minEdge[v] < minEdge[u])) u = v;
    }
    if (u === -1 || minEdge[u] === Infinity) break; // 더 이상 연결 가능한 정점이 없음
    visited[u] = true;
    totalWeight += minEdge[u];
    visitedCount++;
    for (const [v, w] of adj[u]) {
      if (!visited[v] && w < minEdge[v]) minEdge[v] = w;
    }
  }

  return visitedCount === n ? totalWeight : -1;
}

// ---- 최종: heap 기반 Prim (지연 삭제) ----
type HeapItem = [number, number]; // [weight, vertex]

class MinHeap {
  private data: HeapItem[] = [];

  get size(): number {
    return this.data.length;
  }

  push(item: HeapItem): void {
    this.data.push(item);
    let i = this.data.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent][0] <= this.data[i][0]) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  pop(): HeapItem | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0 && last !== undefined) {
      this.data[0] = last;
      let i = 0;
      const n = this.data.length;
      while (true) {
        const l = i * 2 + 1;
        const r = i * 2 + 2;
        let smallest = i;
        if (l < n && this.data[l][0] < this.data[smallest][0]) smallest = l;
        if (r < n && this.data[r][0] < this.data[smallest][0]) smallest = r;
        if (smallest === i) break;
        [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

function primMst(n: number, edges: [number, number, number][]): number {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    if (u === v) continue; // 자기 루프는 신장 트리에 포함되지 않음
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }

  const visited = new Array<boolean>(n).fill(false);
  const heap = new MinHeap();
  heap.push([0, 0]); // (가중치=0, 시작 정점=0)

  let totalWeight = 0;
  let visitedCount = 0;

  while (heap.size > 0) {
    const [w, u] = heap.pop()!;
    if (visited[u]) continue; // 지연 삭제: 이미 방문한 정점은 무시

    visited[u] = true;
    totalWeight += w;
    visitedCount++;

    for (const [v, weight] of adj[u]) {
      if (!visited[v]) heap.push([weight, v]);
    }
  }

  return visitedCount === n ? totalWeight : -1;
}

// ---- 검증 ----
function check(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  console.log(`${ok ? "OK" : "FAIL"}  ${label}: got ${actual}, expected ${expected}`);
}

// 1. 시뮬레이션 고정 입력
const simN = 4;
const simEdges: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 1],
  [2, 1, 2],
  [1, 3, 1],
  [2, 3, 5],
];
check("sim heap", primMst(simN, simEdges), 4);
check("sim naive", primMstNaive(simN, simEdges), 4);

// 2. 문제 예시들
check(
  "problem ex1 heap",
  primMst(4, [
    [0, 1, 1],
    [1, 2, 2],
    [2, 3, 3],
    [0, 3, 10],
  ]),
  6,
);
check(
  "problem ex1 naive",
  primMstNaive(4, [
    [0, 1, 1],
    [1, 2, 2],
    [2, 3, 3],
    [0, 3, 10],
  ]),
  6,
);

check("problem ex2 disconnected heap", primMst(3, [[0, 1, 5]]), -1);
check("problem ex2 disconnected naive", primMstNaive(3, [[0, 1, 5]]), -1);

check("problem ex3 single vertex heap", primMst(1, []), 0);
check("problem ex3 single vertex naive", primMstNaive(1, []), 0);

check(
  "problem ex4 parallel edges heap",
  primMst(2, [
    [0, 1, 100],
    [0, 1, 1],
  ]),
  1,
);
check(
  "problem ex4 parallel edges naive",
  primMstNaive(2, [
    [0, 1, 100],
    [0, 1, 1],
  ]),
  1,
);

check(
  "problem ex5 self loop heap",
  primMst(2, [
    [0, 0, 100],
    [0, 1, 5],
  ]),
  5,
);
check(
  "problem ex5 self loop naive",
  primMstNaive(2, [
    [0, 0, 100],
    [0, 1, 5],
  ]),
  5,
);

check(
  "problem ex6 zero weight heap",
  primMst(3, [
    [0, 1, 0],
    [1, 2, 5],
  ]),
  5,
);
check(
  "problem ex6 zero weight naive",
  primMstNaive(3, [
    [0, 1, 0],
    [1, 2, 5],
  ]),
  5,
);

// 3. 헷갈리기 쉬운 포인트 검증: totalWeight==0인데 연결인 경우 (모든 가중치 0)
check(
  "all-zero-weight connected heap",
  primMst(3, [
    [0, 1, 0],
    [1, 2, 0],
  ]),
  0,
);
check("fully disconnected (n=2, no edges) heap", primMst(2, []), -1);

// 4. 함정 시나리오: 힙 항목을 (vertex, weight) 순서로 잘못 넣으면 어떻게 틀리는가
function primMstWrongOrder(n: number, edges: [number, number, number][]): number {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    if (u === v) continue;
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const visited = new Array<boolean>(n).fill(false);
  const heap = new MinHeap();
  heap.push([0, 0]); // (vertex=0으로 착각하고 넣었다고 가정 — 우연히 시작은 동일)
  let totalWeight = 0;
  let visitedCount = 0;
  while (heap.size > 0) {
    const [a, b] = heap.pop()!; // 여기서는 (vertex, weight)로 잘못 해석
    const u = a; // vertex로 착각
    const w = b; // weight로 착각
    if (visited[u]) continue;
    visited[u] = true;
    totalWeight += w;
    visitedCount++;
    for (const [v, weight] of adj[u]) {
      if (!visited[v]) heap.push([v, weight]); // (vertex, weight) 순서로 삽입 — 힙이 정점 번호 기준 정렬됨
    }
  }
  return visitedCount === n ? totalWeight : -1;
}
console.log(
  "함정 시나리오(순서 뒤바꿈) sim 입력 결과:",
  primMstWrongOrder(simN, simEdges),
  "(정답 4와 달라야 함)",
);

// 5. 무작위 교차검증: naive vs heap
function randomGraph(n: number, edgeChance: number, maxW: number): [number, number, number][] {
  const edges: [number, number, number][] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (Math.random() < edgeChance) {
        edges.push([u, v, Math.floor(Math.random() * maxW) + 1]);
      }
    }
  }
  return edges;
}

let mismatches = 0;
for (let trial = 0; trial < 200; trial++) {
  const n = 2 + Math.floor(Math.random() * 8);
  const edges = randomGraph(n, 0.35, 20);
  const a = primMst(n, edges);
  const b = primMstNaive(n, edges);
  if (a !== b) {
    mismatches++;
    console.log(`MISMATCH n=${n} edges=${JSON.stringify(edges)} heap=${a} naive=${b}`);
  }
}
console.log(`무작위 교차검증 200회 완료, 불일치 ${mismatches}건`);

// 6. 스스로 점검하기용 삼각형 그래프
check(
  "checkpoint triangle heap",
  primMst(3, [
    [0, 1, 3],
    [1, 2, 1],
    [0, 2, 5],
  ]),
  4,
);
