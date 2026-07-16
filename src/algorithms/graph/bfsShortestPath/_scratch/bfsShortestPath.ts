// E3 자기검증용 스크래치 — 가이드 본문에 싣는 세 가지 구현(naive / base / optimized)을
// 모두 모아 실제로 실행하고, 가이드 본문의 모든 수치·트레이스·시뮬 프레임과 대조한다.

// ── 1. naive: 모든 단순 경로를 열거해서 최소 길이를 구한다 ──────────────────
function bfsShortestPathNaive(
  n: number,
  edges: [number, number][],
  source: number,
): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue; // 자기 루프는 경로에 영향 없음
    adj[u].push(v);
    adj[v].push(u);
  }

  const dist = new Array<number>(n).fill(-1);
  const onPath = new Array<boolean>(n).fill(false);

  function dfs(v: number, depth: number) {
    if (dist[v] === -1 || depth < dist[v]) dist[v] = depth;
    onPath[v] = true;
    for (const w of adj[v]) {
      if (!onPath[w]) dfs(w, depth + 1);
    }
    onPath[v] = false; // 백트래킹: 다른 경로에서 v를 다시 지날 수 있게 원복
  }

  dist[source] = 0;
  onPath[source] = true;
  for (const w of adj[source]) dfs(w, 1);
  onPath[source] = false;

  return dist;
}

// ── 2. base: 아이디어를 그대로 옮긴 구현 (Array.shift 큐) ──────────────────
function bfsShortestPathBase(
  n: number,
  edges: [number, number][],
  source: number,
): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const dist = new Array<number>(n).fill(-1);
  dist[source] = 0;
  const queue: number[] = [source];

  while (queue.length > 0) {
    const v = queue.shift()!;
    for (const w of adj[v]) {
      if (dist[w] === -1) {
        dist[w] = dist[v] + 1;
        queue.push(w);
      }
    }
  }

  return dist;
}

// ── 3. optimized: 인덱스 기반 포인터 큐 ────────────────────────────────────
function bfsShortestPath(
  n: number,
  edges: [number, number][],
  source: number,
): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const dist = new Array<number>(n).fill(-1);
  dist[source] = 0;
  const queue = new Array<number>(n);
  queue[0] = source;
  let head = 0;
  let tail = 1;

  while (head < tail) {
    const v = queue[head++];
    for (const w of adj[v]) {
      if (dist[w] === -1) {
        dist[w] = dist[v] + 1;
        queue[tail++] = w;
      }
    }
  }

  return dist;
}

// ── 검증 유틸 ──────────────────────────────────────────────────────────────
function assertEqual(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

// ── A. problem.md 예시 ──────────────────────────────────────────────────
assertEqual(
  "problem-ex1 base",
  bfsShortestPathBase(4, [[0, 1], [1, 2], [2, 3]], 0),
  [0, 1, 2, 3],
);
assertEqual(
  "problem-ex1 optimized",
  bfsShortestPath(4, [[0, 1], [1, 2], [2, 3]], 0),
  [0, 1, 2, 3],
);
assertEqual(
  "problem-ex2 optimized (source=2)",
  bfsShortestPath(5, [[0, 1], [1, 2], [2, 3], [3, 4]], 2),
  [2, 1, 0, 1, 2],
);
assertEqual(
  "problem-ex3 optimized (disconnected)",
  bfsShortestPath(4, [[0, 1], [2, 3]], 0),
  [0, 1, -1, -1],
);
assertEqual(
  "problem-ex4 optimized (no edges)",
  bfsShortestPath(4, [], 1),
  [-1, 0, -1, -1],
);
assertEqual(
  "problem-ex5 optimized (V=1)",
  bfsShortestPath(1, [], 0),
  [0],
);

// ── B. 가이드 대표 예시: n=6 그래프 (시뮬레이션과 동일 입력) ─────────────
const repN = 6;
const repEdges: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [2, 5],
];
assertEqual(
  "n=6 base",
  bfsShortestPathBase(repN, repEdges, 0),
  [0, 1, 1, 2, 3, 2],
);
assertEqual(
  "n=6 optimized",
  bfsShortestPath(repN, repEdges, 0),
  [0, 1, 1, 2, 3, 2],
);
assertEqual(
  "n=6 naive",
  bfsShortestPathNaive(repN, repEdges, 0),
  [0, 1, 1, 2, 3, 2],
);

// ── C. 자기 루프 엣지케이스 ────────────────────────────────────────────
assertEqual(
  "self-loop 무시",
  bfsShortestPath(3, [[0, 0], [0, 1], [1, 2]], 0),
  [0, 1, 2],
);

// ── D. naive의 경로 수 성장 (완전그래프 K_n, 재귀 호출 횟수로 근사 관찰) ──
function countDfsCalls(n: number): number {
  const adj: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => j).filter((j) => j !== i),
  );
  const onPath = new Array<boolean>(n).fill(false);
  let calls = 0;
  function dfs(v: number) {
    calls++;
    onPath[v] = true;
    for (const w of adj[v]) if (!onPath[w]) dfs(w);
    onPath[v] = false;
  }
  onPath[0] = true;
  calls++; // source 자체
  for (const w of adj[0]) dfs(w);
  onPath[0] = false;
  return calls;
}
for (const k of [3, 5, 8]) {
  console.log(`K${k} naive DFS 호출 수 = ${countDfsCalls(k)}`);
}

// ── E. 무작위 교차검증: naive vs base vs optimized (작은 그래프) ─────────
function randomGraph(n: number, edgeCount: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < edgeCount; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    edges.push([u, v]);
  }
  return edges;
}

let randomFails = 0;
for (let trial = 0; trial < 200; trial++) {
  const n = 2 + Math.floor(Math.random() * 6); // 2..7
  const edgeCount = Math.floor(Math.random() * 8);
  const edges = randomGraph(n, edgeCount);
  const source = Math.floor(Math.random() * n);

  const rNaive = bfsShortestPathNaive(n, edges, source);
  const rBase = bfsShortestPathBase(n, edges, source);
  const rOpt = bfsShortestPath(n, edges, source);

  const a = JSON.stringify(rNaive);
  const b = JSON.stringify(rBase);
  const c = JSON.stringify(rOpt);
  if (a !== b || b !== c) {
    randomFails++;
    console.error(
      `RANDOM FAIL n=${n} edges=${JSON.stringify(edges)} source=${source} naive=${a} base=${b} opt=${c}`,
    );
    process.exitCode = 1;
  }
}
console.log(`무작위 교차검증 200회 완료, 불일치 ${randomFails}건`);

// ── F. 함정 재현: 방문 표시를 "꺼낼 때"로 미루면 어떻게 틀리는가 ─────────
// (dist/visited 마킹을 enqueue 시점이 아니라 dequeue 시점으로 미룬 버그 버전)
function bfsShortestPathBuggy(
  n: number,
  edges: [number, number][],
  source: number,
): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const dist = new Array<number>(n).fill(-1);
  const visited = new Array<boolean>(n).fill(false);
  dist[source] = 0;
  visited[source] = true;
  const queue: number[] = [source];

  while (queue.length > 0) {
    const v = queue.shift()!;
    for (const w of adj[v]) {
      if (!visited[w]) {
        queue.push(w);
        dist[w] = dist[v] + 1; // BUG: visited[w]를 아직 세우지 않은 채 dist만 계속 덮어씀
      }
    }
    visited[v] = true; // BUG: 방문 표시를 "꺼낼 때"로 미룸
  }

  return dist;
}

const triangle: [number, number][] = [[0, 1], [0, 2], [1, 2]];
assertEqual("triangle 정답(optimized)", bfsShortestPath(3, triangle, 0), [0, 1, 1]);
console.log(
  `triangle 버그 버전 결과 = ${JSON.stringify(bfsShortestPathBuggy(3, triangle, 0))} (정답 [0,1,1]과 비교)`,
);

console.log("모든 검증 종료");

// ── G. 점검 문제용 소예시 ────────────────────────────────────────────────
assertEqual(
  "점검문제1: 삼각형+꼬리",
  bfsShortestPath(4, [[0, 1], [1, 2], [2, 0], [2, 3]], 0),
  [0, 1, 1, 2],
);
