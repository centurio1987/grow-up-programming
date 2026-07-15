// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 옮겨 실측한다.

function isBipartiteNaive(n: number, edges: [number, number][]): boolean {
  const total = 1 << n; // 정점마다 색 0/1을 고르는 모든 조합
  for (let mask = 0; mask < total; mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      const cu = (mask >> u) & 1;
      const cv = (mask >> v) & 1;
      if (cu === cv) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function isBipartite(n: number, edges: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    adj[v]!.push(u);
  }

  const color = new Array<number>(n).fill(-1);

  for (let start = 0; start < n; start++) {
    if (color[start] !== -1) continue;

    color[start] = 0;
    const queue: number[] = [start];
    let head = 0;

    while (head < queue.length) {
      const u = queue[head++]!;
      for (const v of adj[u]!) {
        if (color[v] === -1) {
          color[v] = 1 - color[u]!;
          queue.push(v);
        } else if (color[v] === color[u]) {
          return false;
        }
      }
    }
  }

  return true;
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: got=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

// --- 문제 예시 (problem.md) ---
assertEq(isBipartite(4, [[0, 1], [1, 2], [2, 3], [3, 0]]), true, "4-cycle");
assertEq(isBipartite(3, [[0, 1], [1, 2], [2, 0]]), false, "3-cycle(triangle)");
assertEq(isBipartite(5, [[0, 1], [2, 3]]), true, "disconnected two edges");
assertEq(isBipartite(1, []), true, "single vertex no edge");
assertEq(isBipartite(1, [[0, 0]]), false, "self loop");
assertEq(
  isBipartite(6, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]]),
  true,
  "tree",
);

// --- naive와 교차검증 (작은 n) ---
const crossCases: [number, [number, number][]][] = [
  [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
  [3, [[0, 1], [1, 2], [2, 0]]],
  [5, [[0, 1], [2, 3]]],
  [1, []],
  [1, [[0, 0]]],
  [6, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]]],
  [5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]]], // 시뮬레이션 예시
  [0 + 4, [[0, 1], [1, 2], [2, 3]]], // path, no cycle
  [7, []], // 전부 고립 정점
];
for (const [n, edges] of crossCases) {
  const a = isBipartiteNaive(n, edges);
  const b = isBipartite(n, edges);
  assertEq(b, a, `cross n=${n} edges=${JSON.stringify(edges)}`);
}

// --- 무작위 교차검증 ---
function randomEdges(n: number, m: number): [number, number][] {
  const es: [number, number][] = [];
  for (let i = 0; i < m; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    es.push([u, v]);
  }
  return es;
}
let randomFails = 0;
for (let t = 0; t < 500; t++) {
  const n = 1 + Math.floor(Math.random() * 7); // n<=7 → naive의 2^n 이 감당 가능
  const m = Math.floor(Math.random() * 10);
  const edges = randomEdges(n, m);
  const a = isBipartiteNaive(n, edges);
  const b = isBipartite(n, edges);
  if (a !== b) {
    randomFails++;
    console.log(`FAIL random n=${n} edges=${JSON.stringify(edges)} naive=${a} bfs=${b}`);
  }
}
console.log(`random cross-check: ${500 - randomFails}/500 matched`);
if (randomFails > 0) process.exitCode = 1;

// --- 시뮬레이션(steps)과 대조할 실측: n=5, edges=[[0,1],[1,2],[2,0],[2,3],[3,4]] ---
console.log("sim-case result:", isBipartite(5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]]));

// --- 성능 목표 예측 문단 검증용: 큰 입력에서 BFS가 잘 도는지 시간 측정 ---
{
  const n = 100000;
  const edges: [number, number][] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]); // 경로 그래프, n-1개 간선
  const t0 = performance.now();
  const res = isBipartite(n, edges);
  const t1 = performance.now();
  console.log(`large path graph n=${n} edges=${edges.length} result=${res} time=${(t1 - t0).toFixed(2)}ms`);
}

console.log(process.exitCode ? "SCRATCH: SOME FAILURES" : "SCRATCH: ALL PASSED");
