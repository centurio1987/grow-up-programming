// E3 자기검증 스크래치: 가이드 본문 코드를 그대로 옮겨 실행/검증한다.

// ---- 출발점: naive (한 칸씩 올리기) ----
function lowestCommonAncestorNaive(
  n: number,
  edges: [number, number][],
  root: number,
  queries: [number, number][]
): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const parent = new Array<number>(n).fill(-1);
  const depth = new Array<number>(n).fill(0);
  const visited = new Array<boolean>(n).fill(false);
  const stack: number[] = [root];
  visited[root] = true;
  while (stack.length > 0) {
    const v = stack.pop()!;
    for (const u of adj[v]) {
      if (!visited[u]) {
        visited[u] = true;
        parent[u] = v;
        depth[u] = depth[v] + 1;
        stack.push(u);
      }
    }
  }

  return queries.map(([uIn, vIn]) => {
    let u = uIn;
    let v = vIn;
    while (u !== v) {
      if (depth[u] > depth[v]) u = parent[u];
      else v = parent[v];
    }
    return u;
  });
}

// ---- 최종 구현: Binary Lifting ----
function lowestCommonAncestor(
  n: number,
  edges: [number, number][],
  root: number,
  queries: [number, number][]
): number[] {
  const LOG = Math.max(1, Math.floor(Math.log2(Math.max(n, 1))) + 1);

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const depth = new Array<number>(n).fill(0);
  const anc: number[][] = Array.from({ length: n }, () => new Array<number>(LOG).fill(root));

  const visited = new Array<boolean>(n).fill(false);
  const stack: [number, number, number][] = [[root, root, 0]];
  visited[root] = true;
  while (stack.length > 0) {
    const [v, par, d] = stack.pop()!;
    depth[v] = d;
    anc[v][0] = par;
    for (const u of adj[v]) {
      if (!visited[u]) {
        visited[u] = true;
        stack.push([u, v, d + 1]);
      }
    }
  }

  for (let k = 1; k < LOG; k++) {
    for (let v = 0; v < n; v++) {
      anc[v][k] = anc[anc[v][k - 1]][k - 1];
    }
  }

  const lca = (uIn: number, vIn: number): number => {
    let u = uIn;
    let v = vIn;
    if (depth[u] < depth[v]) [u, v] = [v, u];
    let diff = depth[u] - depth[v];
    for (let k = 0; k < LOG; k++) {
      if ((diff >> k) & 1) u = anc[u][k];
    }
    if (u === v) return u;
    for (let k = LOG - 1; k >= 0; k--) {
      if (anc[u][k] !== anc[v][k]) {
        u = anc[u][k];
        v = anc[v][k];
      }
    }
    return anc[u][0];
  };

  return queries.map(([u, v]) => lca(u, v));
}

// ---------------- 검증 ----------------

function assertEq(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: got ${a}, expected ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

// 문제 예시 (problem.md)
const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];

assertEq("lca(3,4)", lowestCommonAncestor(6, edges, 0, [[3, 4]]), [1]);
assertEq("lca(3,5)", lowestCommonAncestor(6, edges, 0, [[3, 5]]), [0]);
assertEq("lca(4,2)", lowestCommonAncestor(6, edges, 0, [[4, 2]]), [0]);
assertEq("lca(5,5)", lowestCommonAncestor(6, edges, 0, [[5, 5]]), [5]);
assertEq("lca(3,1)", lowestCommonAncestor(6, edges, 0, [[3, 1]]), [1]);
assertEq(
  "multi",
  lowestCommonAncestor(6, edges, 0, [[3, 4], [3, 5], [4, 2], [5, 5]]),
  [1, 0, 0, 5]
);
assertEq("single vertex", lowestCommonAncestor(1, [], 0, [[0, 0]]), [0]);
assertEq("empty queries", lowestCommonAncestor(6, edges, 0, []), []);
assertEq(
  "chain root=2",
  lowestCommonAncestor(4, [[0, 1], [1, 2], [2, 3]], 2, [[0, 3], [0, 1]]),
  [2, 1]
);

// naive와 동일 결과인지 (같은 예시)
assertEq(
  "naive multi",
  lowestCommonAncestorNaive(6, edges, 0, [[3, 4], [3, 5], [4, 2], [5, 5]]),
  [1, 0, 0, 5]
);

// ---- 가이드 3.1절 예시: 선형 체인 0-1-2-...-9, lca(0,9) ----
const chainEdges: [number, number][] = Array.from({ length: 9 }, (_, i) => [i, i + 1]);
assertEq("chain lca(0,9)", lowestCommonAncestor(10, chainEdges, 0, [[0, 9]]), [0]);

// ---- 시뮬레이션(steps)과 대조: n=6 트리, LOG=3 ----
{
  const n = 6;
  const LOG = Math.max(1, Math.floor(Math.log2(Math.max(n, 1))) + 1);
  console.log(`sim LOG check: LOG=${LOG} (기대 3)`);

  // depth, anc 테이블을 직접 재현해 sim entries와 비교
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const depth = new Array<number>(n).fill(0);
  const anc: number[][] = Array.from({ length: n }, () => new Array<number>(LOG).fill(0));
  const visited = new Array<boolean>(n).fill(false);
  const stack: [number, number, number][] = [[0, 0, 0]];
  visited[0] = true;
  while (stack.length > 0) {
    const [v, par, d] = stack.pop()!;
    depth[v] = d;
    anc[v][0] = par;
    for (const u of adj[v]) {
      if (!visited[u]) {
        visited[u] = true;
        stack.push([u, v, d + 1]);
      }
    }
  }
  for (let k = 1; k < LOG; k++) {
    for (let v = 0; v < n; v++) {
      anc[v][k] = anc[anc[v][k - 1]][k - 1];
    }
  }
  assertEq("sim depth", depth, [0, 1, 1, 2, 2, 2]);
  assertEq("sim anc[.][0]", anc.map((r) => r[0]), [0, 0, 0, 1, 1, 2]);
  assertEq("sim anc[.][1]", anc.map((r) => r[1]), [0, 0, 0, 0, 0, 0]);
  assertEq("sim anc[.][2]", anc.map((r) => r[2]), [0, 0, 0, 0, 0, 0]);
}

// ---- 랜덤 트리 교차검증: naive vs binary lifting ----
function randomTree(n: number, seed: number): [number, number][] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const edges: [number, number][] = [];
  for (let i = 1; i < n; i++) {
    const p = Math.floor(rand() * i);
    edges.push([p, i]);
  }
  return edges;
}

{
  let mismatches = 0;
  for (let trial = 0; trial < 20; trial++) {
    const n = 5 + (trial % 15);
    const edges = randomTree(n, trial * 97 + 1);
    const root = 0;
    const queries: [number, number][] = [];
    let s = trial * 13 + 3;
    const rand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    for (let i = 0; i < 30; i++) {
      queries.push([Math.floor(rand() * n), Math.floor(rand() * n)]);
    }
    const a = lowestCommonAncestor(n, edges, root, queries);
    const b = lowestCommonAncestorNaive(n, edges, root, queries);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      mismatches++;
      console.error(`MISMATCH trial=${trial} n=${n}`);
    }
  }
  assertEq("random cross-validation mismatches", mismatches, 0);
}

console.log("전체 검증 완료");

// ---- 함정 시나리오 탐색: 단계2 루프를 오름차순(k 작은 값부터)으로 바꾸면
//      실제로 틀린 값이 나오는 작은 반례를 찾는다 ----
function lowestCommonAncestorAscendingBug(
  n: number,
  edges: [number, number][],
  root: number,
  queries: [number, number][]
): number[] {
  const LOG = Math.max(1, Math.floor(Math.log2(Math.max(n, 1))) + 1);
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const depth = new Array<number>(n).fill(0);
  const anc: number[][] = Array.from({ length: n }, () => new Array<number>(LOG).fill(root));
  const visited = new Array<boolean>(n).fill(false);
  const stack: [number, number, number][] = [[root, root, 0]];
  visited[root] = true;
  while (stack.length > 0) {
    const [v, par, d] = stack.pop()!;
    depth[v] = d;
    anc[v][0] = par;
    for (const u of adj[v]) {
      if (!visited[u]) {
        visited[u] = true;
        stack.push([u, v, d + 1]);
      }
    }
  }
  for (let k = 1; k < LOG; k++) {
    for (let v = 0; v < n; v++) anc[v][k] = anc[anc[v][k - 1]][k - 1];
  }
  const lca = (uIn: number, vIn: number): number => {
    let u = uIn;
    let v = vIn;
    if (depth[u] < depth[v]) [u, v] = [v, u];
    let diff = depth[u] - depth[v];
    for (let k = 0; k < LOG; k++) {
      if ((diff >> k) & 1) u = anc[u][k];
    }
    if (u === v) return u;
    // 버그: 오름차순 (k 작은 값 -> 큰 값)
    for (let k = 0; k < LOG; k++) {
      if (anc[u][k] !== anc[v][k]) {
        u = anc[u][k];
        v = anc[v][k];
      }
    }
    return anc[u][0];
  };
  return queries.map(([u, v]) => lca(u, v));
}

{
  let found = false;
  for (let trial = 0; trial < 2000 && !found; trial++) {
    const n = 5 + (trial % 20);
    const edges = randomTree(n, trial * 733 + 11);
    let s = trial * 31 + 7;
    const rand = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    for (let i = 0; i < 40 && !found; i++) {
      const u = Math.floor(rand() * n);
      const v = Math.floor(rand() * n);
      const correct = lowestCommonAncestor(n, edges, 0, [[u, v]])[0];
      const buggy = lowestCommonAncestorAscendingBug(n, edges, 0, [[u, v]])[0];
      if (correct !== buggy) {
        console.log(`함정 반례 발견: n=${n}, edges=${JSON.stringify(edges)}, query=[${u},${v}], 정답=${correct}, 오름차순버그=${buggy}`);
        found = true;
      }
    }
  }
  if (!found) console.log("반례를 못 찾음 (더 큰 탐색 필요)");
}

// ---- 소규모 체인(0..5) 예시 검증: lca(0,5), 5 = 4+1 이진분해 ----
{
  const chain5: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,5]];
  assertEq("chain6 lca(0,5)", lowestCommonAncestor(6, chain5, 0, [[0, 5]]), [0]);
  console.log("5 in binary =", (5).toString(2), "-> bits set at position 0,2 (jump 1, jump 4) = 2 jumps");
}

// ---- 함정 예시(작은 반례) 재확인: n=7 트리 ----
{
  const edges7: [number, number][] = [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6]];
  const correct = lowestCommonAncestor(7, edges7, 0, [[5, 6]]);
  const buggy = lowestCommonAncestorAscendingBug(7, edges7, 0, [[5, 6]]);
  console.log("작은 함정 반례: lca(5,6) 정답=", correct[0], " 오름차순버그=", buggy[0]);
}

// ---- 체인(0..5) doubling 테이블 검증 (본문 3.1절 표) ----
{
  const n = 6;
  const LOG = Math.max(1, Math.floor(Math.log2(Math.max(n, 1))) + 1);
  const edges: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,5]];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const depth = new Array<number>(n).fill(0);
  const anc: number[][] = Array.from({ length: n }, () => new Array<number>(LOG).fill(0));
  const visited = new Array<boolean>(n).fill(false);
  const stack: [number, number, number][] = [[0, 0, 0]];
  visited[0] = true;
  while (stack.length > 0) {
    const [v, par, d] = stack.pop()!;
    depth[v] = d; anc[v][0] = par;
    for (const u of adj[v]) if (!visited[u]) { visited[u] = true; stack.push([u, v, d + 1]); }
  }
  for (let k = 1; k < LOG; k++) for (let v = 0; v < n; v++) anc[v][k] = anc[anc[v][k-1]][k-1];
  console.log("chain LOG =", LOG);
  console.log("chain depth =", depth);
  console.log("chain anc[.][0] =", anc.map(r=>r[0]));
  console.log("chain anc[.][1] =", anc.map(r=>r[1]));
  console.log("chain anc[.][2] =", anc.map(r=>r[2]));
  // 5 -> jump bit0(1) -> jump bit2(4)
  let u = 5;
  u = anc[u][0]; // jump 1
  console.log("after jump1(bit0):", u);
  u = anc[u][2]; // jump 4
  console.log("after jump4(bit2):", u);
}
