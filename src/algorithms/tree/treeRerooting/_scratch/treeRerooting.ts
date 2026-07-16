// E3 자기검증 스크래치: 가이드 본문 코드를 그대로 추출해 실행 검증한다.

// ---- 출발점 절의 naive 코드 (O(n^2)) ----
function treeRerootingNaive(n: number, edges: [number, number][]): number[] {
  if (n === 0) return [];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const S = new Array<number>(n).fill(0);
  for (let start = 0; start < n; start++) {
    const dist = new Array<number>(n).fill(-1);
    dist[start] = 0;
    const queue = [start];
    let qi = 0;
    while (qi < queue.length) {
      const v = queue[qi++];
      for (const u of adj[v]) {
        if (dist[u] === -1) {
          dist[u] = dist[v] + 1;
          queue.push(u);
        }
      }
    }
    let sum = 0;
    for (let v = 0; v < n; v++) sum += dist[v];
    S[start] = sum;
  }
  return S;
}

// ---- 아이디어를 코드로 옮기기 절의 최종 코드 (O(n)) ----
function treeRerooting(n: number, edges: [number, number][]): number[] {
  if (n === 1) return [0];

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const parent = new Int32Array(n).fill(-1);
  const depth = new Int32Array(n);
  const size = new Int32Array(n).fill(1);
  const order: number[] = [];

  // DFS 1 (반복형): 방문 순서, depth, parent 계산
  const visited = new Uint8Array(n);
  const stack: number[] = [0];
  visited[0] = 1;
  while (stack.length > 0) {
    const v = stack.pop()!;
    order.push(v);
    for (const u of adj[v]) {
      if (!visited[u]) {
        visited[u] = 1;
        parent[u] = v;
        depth[u] = depth[v] + 1;
        stack.push(u);
      }
    }
  }

  // order 역순: size를 리프 → 루트로 누적
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i];
    if (parent[v] !== -1) size[parent[v]] += size[v];
  }

  const S = new Array<number>(n).fill(0);
  for (let v = 0; v < n; v++) S[0] += depth[v];

  // order 정순: 루트 → 리프 방향으로 점화식 전파
  for (const v of order) {
    for (const c of adj[v]) {
      if (c !== parent[v]) {
        S[c] = S[v] + (n - 2 * size[c]);
      }
    }
  }

  return S;
}

function assertEqual(label: string, actual: number[], expected: number[]) {
  const ok = actual.length === expected.length && actual.every((x, i) => x === expected[i]);
  console.log(`${ok ? "OK " : "FAIL"} ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

// ---- 대표 예시 (problem.md) ----
assertEqual("n=1", treeRerooting(1, []), [0]);
assertEqual("n=2", treeRerooting(2, [[0, 1]]), [1, 1]);
assertEqual("n=3 chain", treeRerooting(3, [[0, 1], [1, 2]]), [3, 2, 3]);
assertEqual(
  "n=5 branching (0-1,0-2,1-3,1-4)",
  treeRerooting(5, [[0, 1], [0, 2], [1, 3], [1, 4]]),
  [6, 5, 9, 8, 8],
);
assertEqual(
  "n=5 chain",
  treeRerooting(5, [[0, 1], [1, 2], [2, 3], [3, 4]]),
  [10, 7, 6, 7, 10],
);
assertEqual(
  "n=5 star",
  treeRerooting(5, [[0, 1], [0, 2], [0, 3], [0, 4]]),
  [4, 7, 7, 7, 7],
);

// ---- naive와 교차검증 (대표값) ----
assertEqual("naive n=5 chain", treeRerootingNaive(5, [[0, 1], [1, 2], [2, 3], [3, 4]]), [10, 7, 6, 7, 10]);

// ---- 무작위 랜덤 트리 교차검증 ----
function randomTree(n: number, seed: number): [number, number][] {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s;
  };
  const edges: [number, number][] = [];
  for (let v = 1; v < n; v++) {
    const p = rnd() % v;
    edges.push([p, v]);
  }
  return edges;
}

let randomFails = 0;
for (let trial = 0; trial < 40; trial++) {
  const n = 1 + (trial % 25);
  const edges = randomTree(n, trial * 97 + 13);
  const a = treeRerooting(n, edges);
  const b = treeRerootingNaive(n, edges);
  const ok = a.length === b.length && a.every((x, i) => x === b[i]);
  if (!ok) {
    randomFails++;
    console.log(`FAIL random trial=${trial} n=${n} edges=${JSON.stringify(edges)} rerooting=${JSON.stringify(a)} naive=${JSON.stringify(b)}`);
  }
}
console.log(`random cross-check: ${40 - randomFails}/40 passed`);
if (randomFails > 0) process.exitCode = 1;

// ---- 함정 시나리오 검증: DFS2를 역순으로 돌리면 틀린다는 것을 실측으로 확인 ----
function treeRerootingWrongOrder(n: number, edges: [number, number][]): number[] {
  if (n === 1) return [0];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const parent = new Int32Array(n).fill(-1);
  const depth = new Int32Array(n);
  const size = new Int32Array(n).fill(1);
  const order: number[] = [];
  const visited = new Uint8Array(n);
  const stack: number[] = [0];
  visited[0] = 1;
  while (stack.length > 0) {
    const v = stack.pop()!;
    order.push(v);
    for (const u of adj[v]) {
      if (!visited[u]) {
        visited[u] = 1;
        parent[u] = v;
        depth[u] = depth[v] + 1;
        stack.push(u);
      }
    }
  }
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i];
    if (parent[v] !== -1) size[parent[v]] += size[v];
  }
  const S = new Array<number>(n).fill(0);
  for (let v = 0; v < n; v++) S[0] += depth[v];

  // 함정: order를 "역순"(리프 → 루트)으로 돌며 점화식을 적용 — 부모의 S가 아직 미확정 상태로 참조된다.
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i];
    for (const c of adj[v]) {
      if (c !== parent[v]) {
        S[c] = S[v] + (n - 2 * size[c]);
      }
    }
  }
  return S;
}
console.log("함정(역순 DFS2) chain n=5:", JSON.stringify(treeRerootingWrongOrder(5, [[0, 1], [1, 2], [2, 3], [3, 4]])));
