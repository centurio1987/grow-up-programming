// 가이드 자기검증용 스크래치. bun으로 직접 실행해 본문 수치를 실측한다.

// ---------- naive: 모든 부분집합 열거 ----------
function treeMaxIndependentSetNaive(
  n: number,
  edges: [number, number][],
  weights: number[],
): number {
  let best = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    let independent = true;
    for (const [u, v] of edges) {
      if ((mask & (1 << u)) && (mask & (1 << v))) {
        independent = false;
        break;
      }
    }
    if (!independent) continue;
    let sum = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) sum += weights[i]!;
    best = Math.max(best, sum);
  }
  return best;
}

// ---------- 기본 구현: 재귀 DFS (가이드 "아이디어를 코드로 옮기기"와 동일) ----------
function treeMaxIndependentSetRecursive(
  n: number,
  edges: [number, number][],
  weights: number[],
): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  // dfs(v, parent)는 [dp[v][0], dp[v][1]]을 반환한다
  function dfs(v: number, parent: number): [number, number] {
    let notTaken = 0;
    let taken = weights[v];
    for (const u of adj[v]) {
      if (u === parent) continue; // 부모 방향은 자식이 아니다
      const [childNotTaken, childTaken] = dfs(u, v);
      notTaken += Math.max(childNotTaken, childTaken);
      taken += childNotTaken;
    }
    return [notTaken, taken];
  }

  const [rootNotTaken, rootTaken] = dfs(0, -1);
  return Math.max(rootNotTaken, rootTaken);
}

// ---------- 최적화: 반복 DFS (ENTER/EXIT 명시적 스택, 가이드 "최적화 코드"와 동일) ----------
function treeMaxIndependentSetIterative(
  n: number,
  edges: [number, number][],
  weights: number[],
): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const dp0 = new Array(n).fill(0); // dp[v][0]
  const dp1 = new Array(n).fill(0); // dp[v][1]
  const parent = new Array(n).fill(-1);

  type Frame = { v: number; phase: "ENTER" | "EXIT" };
  const stack: Frame[] = [{ v: 0, phase: "ENTER" }];

  while (stack.length > 0) {
    const { v, phase } = stack.pop()!;
    if (phase === "ENTER") {
      dp0[v] = 0;
      dp1[v] = weights[v];
      stack.push({ v, phase: "EXIT" }); // 자식보다 먼저 예약 — LIFO로 맨 밑에 깔린다
      for (const u of adj[v]) {
        if (u === parent[v]) continue;
        parent[u] = v;
        stack.push({ v: u, phase: "ENTER" });
      }
    } else {
      for (const u of adj[v]) {
        if (u === parent[v]) continue; // 이 줄을 빠뜨리면 부모를 자식으로 오인한다
        dp0[v] += Math.max(dp0[u], dp1[u]);
        dp1[v] += dp0[u];
      }
    }
  }

  return Math.max(dp0[0], dp1[0]);
}

// ============ 실측 ============

function log(label: string, value: unknown) {
  console.log(`${label}: ${JSON.stringify(value)}`);
}

console.log("=== 대표 케이스 ===");
log("n=1 [5] naive", treeMaxIndependentSetNaive(1, [], [5]));
log("n=1 [5] recursive", treeMaxIndependentSetRecursive(1, [], [5]));
log("n=1 [5] iterative", treeMaxIndependentSetIterative(1, [], [5]));

log("n=1 [-3] naive", treeMaxIndependentSetNaive(1, [], [-3]));
log("n=1 [-3] recursive", treeMaxIndependentSetRecursive(1, [], [-3]));
log("n=1 [-3] iterative", treeMaxIndependentSetIterative(1, [], [-3]));

log(
  "n=3 star [1,2,3] naive",
  treeMaxIndependentSetNaive(3, [[0, 1], [0, 2]], [1, 2, 3]),
);
log(
  "n=3 star [1,2,3] recursive",
  treeMaxIndependentSetRecursive(3, [[0, 1], [0, 2]], [1, 2, 3]),
);
log(
  "n=3 star [1,2,3] iterative",
  treeMaxIndependentSetIterative(3, [[0, 1], [0, 2]], [1, 2, 3]),
);

log(
  "n=4 path [10,1,1,10] naive",
  treeMaxIndependentSetNaive(4, [[0, 1], [1, 2], [2, 3]], [10, 1, 1, 10]),
);
log(
  "n=4 path [10,1,1,10] recursive",
  treeMaxIndependentSetRecursive(4, [[0, 1], [1, 2], [2, 3]], [10, 1, 1, 10]),
);
log(
  "n=4 path [10,1,1,10] iterative",
  treeMaxIndependentSetIterative(4, [[0, 1], [1, 2], [2, 3]], [10, 1, 1, 10]),
);

log(
  "n=3 all-neg naive",
  treeMaxIndependentSetNaive(3, [[0, 1], [1, 2]], [-1, -2, -3]),
);
log(
  "n=3 all-neg recursive",
  treeMaxIndependentSetRecursive(3, [[0, 1], [1, 2]], [-1, -2, -3]),
);
log(
  "n=3 all-neg iterative",
  treeMaxIndependentSetIterative(3, [[0, 1], [1, 2]], [-1, -2, -3]),
);

log(
  "n=2 [3,-1] naive",
  treeMaxIndependentSetNaive(2, [[0, 1]], [3, -1]),
);
log(
  "n=2 [3,-1] iterative",
  treeMaxIndependentSetIterative(2, [[0, 1]], [3, -1]),
);

console.log("\n=== 시뮬레이션용 별 모양 트리 n=4 ===");
const starEdges: [number, number][] = [[0, 1], [0, 2], [0, 3]];
const starWeights = [1, 10, 10, 10];
log("naive", treeMaxIndependentSetNaive(4, starEdges, starWeights));
log("recursive", treeMaxIndependentSetRecursive(4, starEdges, starWeights));
log("iterative", treeMaxIndependentSetIterative(4, starEdges, starWeights));

// 노드별 dp 값 직접 계산해 시뮬 프레임과 대조
{
  const adj: number[][] = Array.from({ length: 4 }, () => []);
  for (const [u, v] of starEdges) {
    adj[u]!.push(v);
    adj[v]!.push(u);
  }
  const dp0 = new Array(4).fill(0);
  const dp1 = new Array(4).fill(0);
  for (const leaf of [1, 2, 3]) {
    dp0[leaf] = 0;
    dp1[leaf] = starWeights[leaf];
  }
  let sumNotTaken = 0;
  let sumTaken = starWeights[0]!;
  for (const leaf of [1, 2, 3]) {
    sumNotTaken += Math.max(dp0[leaf], dp1[leaf]);
    sumTaken += dp0[leaf];
  }
  dp0[0] = sumNotTaken;
  dp1[0] = sumTaken;
  log("dp table (node: [dp0,dp1])", {
    n0: [dp0[0], dp1[0]],
    n1: [dp0[1], dp1[1]],
    n2: [dp0[2], dp1[2]],
    n3: [dp0[3], dp1[3]],
  });
}

console.log("\n=== 함정 시나리오: EXIT에서 부모 제외를 빼먹으면 ===");
function buggyIterativeNoParentGuardInExit(
  n: number,
  edges: [number, number][],
  weights: number[],
): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    adj[v]!.push(u);
  }
  const dpNotTaken = new Float64Array(n);
  const dpTaken = new Float64Array(n);
  const parent = new Int32Array(n).fill(-1);
  type Frame = { v: number; phase: "ENTER" | "EXIT" };
  const stack: Frame[] = [{ v: 0, phase: "ENTER" }];
  while (stack.length > 0) {
    const { v, phase } = stack.pop()!;
    if (phase === "ENTER") {
      dpNotTaken[v] = 0;
      dpTaken[v] = weights[v]!;
      stack.push({ v, phase: "EXIT" });
      for (const u of adj[v]!) {
        if (u === parent[v]) continue;
        parent[u] = v;
        stack.push({ v: u, phase: "ENTER" });
      }
    } else {
      // 버그: 부모 방향을 제외하지 않고 전부 합산
      for (const u of adj[v]!) {
        dpNotTaken[v]! += Math.max(dpNotTaken[u]!, dpTaken[u]!);
        dpTaken[v]! += dpNotTaken[u]!;
      }
    }
  }
  return Math.max(dpNotTaken[0]!, dpTaken[0]!);
}
log(
  "buggy (star n=4) 기대값 30, 실제값",
  buggyIterativeNoParentGuardInExit(4, starEdges, starWeights),
);
const pathEdges: [number, number][] = [[0, 1], [1, 2]];
const pathWeights = [5, 1, 5];
log(
  "buggy (path n=3, w=[5,1,5]) 기대값 10, 실제값",
  buggyIterativeNoParentGuardInExit(3, pathEdges, pathWeights),
);
log(
  "correct iterative (path n=3, w=[5,1,5])",
  treeMaxIndependentSetIterative(3, pathEdges, pathWeights),
);

console.log("\n=== 무작위 교차검증 (recursive vs iterative vs naive, 작은 n) ===");
function randomTree(n: number, weightRange: number): {
  edges: [number, number][];
  weights: number[];
} {
  const edges: [number, number][] = [];
  for (let i = 1; i < n; i++) {
    const parent = Math.floor(Math.random() * i);
    edges.push([parent, i]);
  }
  const weights = Array.from(
    { length: n },
    () => Math.floor(Math.random() * (2 * weightRange + 1)) - weightRange,
  );
  return { edges, weights };
}

let mismatches = 0;
for (let trial = 0; trial < 200; trial++) {
  const n = 1 + Math.floor(Math.random() * 8); // 1..8 (naive 2^n 감당 가능)
  const { edges, weights } = randomTree(n, 8);
  const expected = treeMaxIndependentSetNaive(n, edges, weights);
  const gotRec = treeMaxIndependentSetRecursive(n, edges, weights);
  const gotIter = treeMaxIndependentSetIterative(n, edges, weights);
  if (gotRec !== expected || gotIter !== expected) {
    mismatches++;
    console.log("MISMATCH", { n, edges, weights, expected, gotRec, gotIter });
  }
}
console.log(`200회 무작위 트리 교차검증 mismatch 수: ${mismatches}`);

console.log("\n=== 재귀 깊이 위험: 편향 트리(경로) n=100000 ===");
{
  const n = 100000;
  const edges: [number, number][] = [];
  for (let i = 1; i < n; i++) edges.push([i - 1, i]);
  const weights = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 1 : -1));
  try {
    const r = treeMaxIndependentSetRecursive(n, edges, weights);
    console.log("recursive 결과 (예상밖 성공):", r);
  } catch (e) {
    console.log("recursive 예외 발생:", (e as Error).message);
  }
  const r2 = treeMaxIndependentSetIterative(n, edges, weights);
  console.log("iterative 결과 (안전):", r2);
}
