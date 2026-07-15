// E3 자기검증용 스크래치. 가이드 본문에 실리는 세 버전(naive scan / basic queue / optimized)을
// 그대로 옮겨 실행 검증한다. 채점 대상 아님 — 가이드 자체 코드 실측용.

// ---------- 0) 원형: 매번 전체 스캔 (O(V^2)) ----------
function topologicalSortNaiveScan(
  n: number,
  edges: [number, number][],
  scanCounter?: { count: number },
): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const inDegree = new Array<number>(n).fill(0);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    inDegree[v]!++;
  }
  const done = new Array<boolean>(n).fill(false);
  const result: number[] = [];
  let scans = 0;
  while (result.length < n) {
    let found = -1;
    for (let v = 0; v < n; v++) {
      scans++;
      if (!done[v] && inDegree[v] === 0) {
        found = v;
        break;
      }
    }
    if (found === -1) {
      if (scanCounter) scanCounter.count = scans;
      return null;
    }
    done[found] = true;
    result.push(found);
    for (const v of adj[found]!) inDegree[v]!--;
  }
  if (scanCounter) scanCounter.count = scans;
  return result;
}

// ---------- 1) 기본 구현: 배열을 큐로 사용 (push/shift) ----------
function topologicalSortBasic(
  n: number,
  edges: [number, number][],
): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const inDegree = new Array<number>(n).fill(0);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    inDegree[v]!++;
  }
  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (inDegree[v] === 0) queue.push(v);

  const result: number[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!; // O(큐 길이) — 남은 원소를 전부 한 칸씩 당긴다
    result.push(u);
    for (const v of adj[u]!) {
      inDegree[v]!--;
      if (inDegree[v] === 0) queue.push(v);
    }
  }
  return result.length === n ? result : null;
}

// ---------- 0.5) 함정 시연용: inDegree===0 검사를 빼먹은 버그 버전 ----------
function topologicalSortBuggyPush(
  n: number,
  edges: [number, number][],
): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const inDegree = new Array<number>(n).fill(0);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    inDegree[v]!++;
  }
  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (inDegree[v] === 0) queue.push(v);

  const result: number[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    result.push(u);
    for (const v of adj[u]!) {
      inDegree[v]!--;
      queue.push(v); // 버그: === 0 검사 없이 매번 무조건 큐에 넣는다
    }
  }
  return result;
}

// ---------- 2) 최적화: head 포인터로 재정렬 비용 제거 ----------
function topologicalSortOptimized(
  n: number,
  edges: [number, number][],
): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const inDegree = new Int32Array(n);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    inDegree[v]!++;
  }

  const queue = new Int32Array(n); // 정점당 정확히 1번만 들어온다 → 최대 n칸이면 충분
  let head = 0;
  let tail = 0;
  for (let v = 0; v < n; v++) {
    if (inDegree[v] === 0) queue[tail++] = v;
  }

  const result: number[] = [];
  while (head < tail) {
    const u = queue[head++]!;
    result.push(u);
    for (const v of adj[u]!) {
      if (--inDegree[v]! === 0) queue[tail++] = v;
    }
  }
  return result.length === n ? result : null;
}

// ================= 검증 =================

function isValidTopoOrder(
  n: number,
  edges: [number, number][],
  order: number[] | null,
): boolean {
  if (order === null) return false;
  if (order.length !== n) return false;
  const pos = new Array<number>(n).fill(-1);
  for (let i = 0; i < order.length; i++) pos[order[i]!] = i;
  if (pos.some((p) => p === -1)) return false; // 정점 중복/누락
  for (const [u, v] of edges) {
    if (pos[u]! >= pos[v]!) return false;
  }
  return true;
}

function hasCycleReference(n: number, edges: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);
  const color = new Array<0 | 1 | 2>(n).fill(0); // 0=white 1=gray 2=black
  const dfs = (u: number): boolean => {
    color[u] = 1;
    for (const v of adj[u]!) {
      if (color[v] === 1) return true;
      if (color[v] === 0 && dfs(v)) return true;
    }
    color[u] = 2;
    return false;
  };
  for (let v = 0; v < n; v++) {
    if (color[v] === 0 && dfs(v)) return true;
  }
  return false;
}

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${name}`, detail ?? "");
  } else {
    console.log(`ok: ${name}`);
  }
}

// --- 3.1절 손 추적용 다이아몬드 예시: n=4, [[0,1],[0,2],[1,3],[2,3]] ---
{
  const n = 4;
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  const r0 = topologicalSortNaiveScan(n, edges);
  const r1 = topologicalSortBasic(n, edges);
  const r2 = topologicalSortOptimized(n, edges);
  console.log("diamond naiveScan:", r0);
  console.log("diamond basic:", r1);
  console.log("diamond optimized:", r2);
  check("diamond naiveScan valid", isValidTopoOrder(n, edges, r0));
  check("diamond basic valid", isValidTopoOrder(n, edges, r1));
  check("diamond optimized valid", isValidTopoOrder(n, edges, r2));
  check("diamond basic == [0,1,2,3]", JSON.stringify(r1) === JSON.stringify([0, 1, 2, 3]));
  check("diamond optimized == [0,1,2,3]", JSON.stringify(r2) === JSON.stringify([0, 1, 2, 3]));

  const rBuggy = topologicalSortBuggyPush(n, edges);
  console.log("diamond buggyPush (===0 검사 누락):", rBuggy, "length:", rBuggy.length);
  check(
    "diamond buggyPush produces wrong length/duplicate",
    rBuggy.length !== n || new Set(rBuggy).size !== rBuggy.length,
    rBuggy,
  );
}

// --- 출발점 절 손 추적용 체인: n=4, [[0,1],[1,2],[2,3]] ---
{
  const n = 4;
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
  ];
  const counter = { count: 0 };
  const r0 = topologicalSortNaiveScan(n, edges, counter);
  console.log("chain naiveScan:", r0, "scans:", counter.count);
  check("chain naiveScan == [0,1,2,3]", JSON.stringify(r0) === JSON.stringify([0, 1, 2, 3]));
  check("chain naiveScan scans == 10 (1+2+3+4)", counter.count === 10, counter.count);
}

// --- 메인 시뮬레이션 예시: n=6, edges=[[0,2],[1,2],[2,3],[2,4],[3,5],[4,5]] ---
{
  const n = 6;
  const edges: [number, number][] = [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
    [3, 5],
    [4, 5],
  ];
  const r0 = topologicalSortNaiveScan(n, edges);
  const r1 = topologicalSortBasic(n, edges);
  const r2 = topologicalSortOptimized(n, edges);
  console.log("sim naiveScan:", r0);
  console.log("sim basic:", r1);
  console.log("sim optimized:", r2);
  check("sim basic == [0,1,2,3,4,5]", JSON.stringify(r1) === JSON.stringify([0, 1, 2, 3, 4, 5]));
  check("sim optimized == [0,1,2,3,4,5]", JSON.stringify(r2) === JSON.stringify([0, 1, 2, 3, 4, 5]));
  check("sim naiveScan valid", isValidTopoOrder(n, edges, r0));
}

// --- 엣지 케이스 ---
{
  // 자기 루프
  check(
    "self-loop -> null (basic)",
    topologicalSortBasic(1, [[0, 0]]) === null,
  );
  check(
    "self-loop -> null (optimized)",
    topologicalSortOptimized(1, [[0, 0]]) === null,
  );
  check(
    "self-loop -> null (naiveScan)",
    topologicalSortNaiveScan(1, [[0, 0]]) === null,
  );

  // 사이클
  const cyc: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  check("cycle -> null (basic)", topologicalSortBasic(3, cyc) === null);
  check("cycle -> null (optimized)", topologicalSortOptimized(3, cyc) === null);
  check("cycle -> null (naiveScan)", topologicalSortNaiveScan(3, cyc) === null);

  // 부분 처리 후에도 사이클 때문에 null (0→1, 1→2, 2→1: 0만 처리되고 1,2는 서로를 기다림)
  const partial = topologicalSortBasic(3, [
    [0, 1],
    [1, 2],
    [2, 1],
  ]);
  console.log("partial-then-cycle:", partial);
  check("partial-then-cycle -> null", partial === null);

  // 간선 없음
  const r = topologicalSortOptimized(4, []);
  check("no edges -> valid perm", isValidTopoOrder(4, [], r));
  check("no edges basic == [0,1,2,3]", JSON.stringify(topologicalSortBasic(4, [])) === "[0,1,2,3]");

  // V=1, 간선 없음
  check("n=1 no edges", JSON.stringify(topologicalSortOptimized(1, [])) === "[0]");
}

// --- 무작위 교차 검증 ---
{
  function randomDag(n: number, edgeProb: number): [number, number][] {
    const edges: [number, number][] = [];
    // u < v로만 간선을 만들면 항상 DAG (인덱스 순서가 하나의 위상 정렬)
    for (let u = 0; u < n; u++) {
      for (let v = u + 1; v < n; v++) {
        if (Math.random() < edgeProb) edges.push([u, v]);
      }
    }
    return edges;
  }
  function randomDigraph(n: number, edgeProb: number): [number, number][] {
    const edges: [number, number][] = [];
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        if (u !== v && Math.random() < edgeProb) edges.push([u, v]);
      }
    }
    return edges;
  }

  let dagTrials = 0;
  for (let t = 0; t < 200; t++) {
    const n = 2 + Math.floor(Math.random() * 20);
    const edges = randomDag(n, 0.3);
    dagTrials++;
    const r0 = topologicalSortNaiveScan(n, edges);
    const r1 = topologicalSortBasic(n, edges);
    const r2 = topologicalSortOptimized(n, edges);
    check(`random DAG #${t} naiveScan valid`, isValidTopoOrder(n, edges, r0), { n, edges });
    check(`random DAG #${t} basic valid`, isValidTopoOrder(n, edges, r1), { n, edges });
    check(`random DAG #${t} optimized valid`, isValidTopoOrder(n, edges, r2), { n, edges });
  }
  console.log(`random DAG trials: ${dagTrials}`);

  let digraphTrials = 0;
  for (let t = 0; t < 200; t++) {
    const n = 2 + Math.floor(Math.random() * 12);
    const edges = randomDigraph(n, 0.25);
    digraphTrials++;
    const expectCycle = hasCycleReference(n, edges);
    const r0 = topologicalSortNaiveScan(n, edges);
    const r1 = topologicalSortBasic(n, edges);
    const r2 = topologicalSortOptimized(n, edges);
    check(
      `random digraph #${t} basic matches cycle oracle`,
      (r1 === null) === expectCycle,
      { n, edges, r1 },
    );
    check(
      `random digraph #${t} optimized matches cycle oracle`,
      (r2 === null) === expectCycle,
      { n, edges, r2 },
    );
    if (!expectCycle) {
      check(`random digraph #${t} naiveScan valid`, isValidTopoOrder(n, edges, r0), { n, edges });
      check(`random digraph #${t} basic valid`, isValidTopoOrder(n, edges, r1), { n, edges });
      check(`random digraph #${t} optimized valid`, isValidTopoOrder(n, edges, r2), { n, edges });
    }
  }
  console.log(`random digraph trials: ${digraphTrials}`);
}

// --- 벤치마크 1: 최악 케이스 — 넓은 그래프(간선 0개, n개 정점이 동시에 큐에 들어감) ---
{
  const n = 100000;
  const edges: [number, number][] = [];
  for (let i = 0; i < 3; i++) { topologicalSortBasic(n, edges); topologicalSortOptimized(n, edges); } // warmup

  const bt: number[] = [];
  const ot: number[] = [];
  for (let t = 0; t < 11; t++) {
    const a0 = performance.now();
    const rBasic = topologicalSortBasic(n, edges);
    bt.push(performance.now() - a0);
    const b0 = performance.now();
    const rOpt = topologicalSortOptimized(n, edges);
    ot.push(performance.now() - b0);
    check(`bench1 trial${t} basic result length`, rBasic?.length === n);
    check(`bench1 trial${t} optimized result length`, rOpt?.length === n);
  }
  bt.sort((a, b) => a - b);
  ot.sort((a, b) => a - b);
  const med = (a: number[]) => a[Math.floor(a.length / 2)]!;
  console.log(`\n벤치마크1: 최악 케이스 (n=${n}, edges=0, 모든 정점이 초기에 큐 진입)`);
  console.log(`  basic(array shift)  중앙값: ${med(bt).toFixed(3)} ms`);
  console.log(`  optimized(head ptr) 중앙값: ${med(ot).toFixed(3)} ms`);
  console.log(`  배율: ${(med(bt) / med(ot)).toFixed(1)}x`);
}

// --- 벤치마크 2: 일반적인 성긴 랜덤 DAG (n=E=100000, u<v로만 간선 생성) ---
{
  function randomSparseDag(n: number, e: number): [number, number][] {
    const edges: [number, number][] = [];
    for (let i = 0; i < e; i++) {
      const a = Math.floor(Math.random() * n);
      const b = Math.floor(Math.random() * n);
      if (a < b) edges.push([a, b]);
      else if (a > b) edges.push([b, a]);
    }
    return edges;
  }
  const n = 100000;
  const edges = randomSparseDag(n, 100000);
  for (let i = 0; i < 3; i++) { topologicalSortBasic(n, edges); topologicalSortOptimized(n, edges); } // warmup

  const bt: number[] = [];
  const ot: number[] = [];
  for (let t = 0; t < 11; t++) {
    const a0 = performance.now();
    const rBasic = topologicalSortBasic(n, edges);
    bt.push(performance.now() - a0);
    const b0 = performance.now();
    const rOpt = topologicalSortOptimized(n, edges);
    ot.push(performance.now() - b0);
    check(`bench2 trial${t} basic valid`, isValidTopoOrder(n, edges, rBasic));
    check(`bench2 trial${t} optimized valid`, isValidTopoOrder(n, edges, rOpt));
  }
  bt.sort((a, b) => a - b);
  ot.sort((a, b) => a - b);
  const med = (a: number[]) => a[Math.floor(a.length / 2)]!;
  console.log(`\n벤치마크2: 성긴 랜덤 DAG (n=${n}, E=${edges.length})`);
  console.log(`  basic(array shift)  중앙값: ${med(bt).toFixed(3)} ms`);
  console.log(`  optimized(head ptr) 중앙값: ${med(ot).toFixed(3)} ms`);
  console.log(`  배율: ${(med(bt) / med(ot)).toFixed(1)}x`);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
if (failures > 0) process.exit(1);

// --- 스스로 점검하기 문제1 검증 ---
{
  const n = 5;
  const edges: [number, number][] = [[0,1],[0,2],[1,3],[2,3],[3,4]];
  const r = topologicalSortOptimized(n, edges);
  console.log("quiz1:", r);
  check("quiz1 == [0,1,2,3,4]", JSON.stringify(r) === JSON.stringify([0,1,2,3,4]));
}
