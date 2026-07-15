// 가이드 본문 코드 자기검증용 스크래치. 가이드에 싣는 코드를 그대로 옮겨 실행값을 확인한다.

// ---------- naive (출발점 절) ----------
function buildParentDepth(n: number, edges: [number, number][], root: number) {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const parent = new Array(n).fill(-1);
  const depth = new Array(n).fill(0);
  const stack: [number, number, number][] = [[root, -1, 0]];
  while (stack.length > 0) {
    const [v, par, d] = stack.pop()!;
    parent[v] = par;
    depth[v] = d;
    for (const u of adj[v]) if (u !== par) stack.push([u, v, d + 1]);
  }
  return { adj, parent, depth };
}

function queryPathNaive(
  parent: number[],
  depth: number[],
  values: number[],
  u: number,
  v: number,
): number {
  let sum = 0;
  while (depth[u] > depth[v]) {
    sum += values[u];
    u = parent[u];
  }
  while (depth[v] > depth[u]) {
    sum += values[v];
    v = parent[v];
  }
  while (u !== v) {
    sum += values[u] + values[v];
    u = parent[u];
    v = parent[v];
  }
  sum += values[u];
  return sum;
}

// ---------- 아이디어를 코드로 옮기기 (base, 재귀 Segment Tree) ----------
class HeavyLightDecompositionBase {
  private readonly n: number;
  private readonly parent: number[];
  private readonly depth: number[];
  private readonly size: number[];
  private readonly heavy: number[];
  private readonly head: number[];
  private readonly pos: number[];
  private readonly tree: number[];

  constructor(n: number, edges: [number, number][], root: number, values: number[]) {
    this.n = n;
    this.parent = new Array(n).fill(-1);
    this.depth = new Array(n).fill(0);
    this.size = new Array(n).fill(1);
    this.heavy = new Array(n).fill(-1);
    this.head = new Array(n).fill(0);
    this.pos = new Array(n).fill(0);

    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u].push(v);
      adj[v].push(u);
    }

    // DFS 1 (반복): parent, depth, size, heavy child
    const order: number[] = [];
    const stack1: [number, number, number][] = [[root, -1, 0]];
    while (stack1.length > 0) {
      const [v, par, d] = stack1.pop()!;
      this.parent[v] = par;
      this.depth[v] = d;
      order.push(v);
      for (const u of adj[v]) if (u !== par) stack1.push([u, v, d + 1]);
    }
    for (let i = order.length - 1; i >= 0; i--) {
      const v = order[i]!;
      const p = this.parent[v];
      if (p !== -1) {
        this.size[p] += this.size[v];
        if (this.heavy[p] === -1 || this.size[v] > this.size[this.heavy[p]]) {
          this.heavy[p] = v;
        }
      }
    }

    // DFS 2 (체인 단위, 큐 기반): pos, head
    let timer = 0;
    const queue: number[] = [root];
    let qi = 0;
    while (qi < queue.length) {
      const chainStart = queue[qi++]!;
      const h = chainStart;
      let x: number = chainStart;
      while (x !== -1) {
        this.pos[x] = ++timer;
        this.head[x] = h;
        for (const c of adj[x]) {
          if (c !== this.parent[x] && c !== this.heavy[x]) queue.push(c);
        }
        x = this.heavy[x];
      }
    }

    // Segment Tree 구성 (재귀, 1-indexed pos → flat[1..n])
    const flat = new Array(n + 1).fill(0);
    for (let v = 0; v < n; v++) flat[this.pos[v]] = values[v];
    this.tree = new Array(4 * Math.max(n, 1)).fill(0);
    if (n > 0) this.build(1, 1, n, flat);
  }

  private build(node: number, lo: number, hi: number, flat: number[]): void {
    if (lo === hi) {
      this.tree[node] = flat[lo];
      return;
    }
    const mid = (lo + hi) >> 1;
    this.build(2 * node, lo, mid, flat);
    this.build(2 * node + 1, mid + 1, hi, flat);
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
  }

  private updateAt(node: number, lo: number, hi: number, target: number, value: number): void {
    if (lo === hi) {
      this.tree[node] = value;
      return;
    }
    const mid = (lo + hi) >> 1;
    if (target <= mid) this.updateAt(2 * node, lo, mid, target, value);
    else this.updateAt(2 * node + 1, mid + 1, hi, target, value);
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
  }

  private queryRange(node: number, lo: number, hi: number, l: number, r: number): number {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return this.tree[node];
    const mid = (lo + hi) >> 1;
    return (
      this.queryRange(2 * node, lo, mid, l, r) + this.queryRange(2 * node + 1, mid + 1, hi, l, r)
    );
  }

  update(node: number, value: number): void {
    this.updateAt(1, 1, this.n, this.pos[node], value);
  }

  // 버그 재현용: pos[node] 대신 node를 그대로 써서 update
  updateBuggy(node: number, value: number): void {
    this.updateAt(1, 1, this.n, node, value);
  }

  queryPath(u: number, v: number): number {
    let result = 0;
    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] < this.depth[this.head[v]]) {
        [u, v] = [v, u];
      }
      result += this.queryRange(1, 1, this.n, this.pos[this.head[u]], this.pos[u]);
      u = this.parent[this.head[u]];
    }
    if (this.depth[u] > this.depth[v]) [u, v] = [v, u];
    result += this.queryRange(1, 1, this.n, this.pos[u], this.pos[v]);
    return result;
  }

  // 버그 재현용: depth 비교 방향을 반대로 뒤집은 queryPath
  queryPathBuggyDirection(u: number, v: number): number {
    let result = 0;
    let steps = 0;
    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] > this.depth[this.head[v]]) {
        [u, v] = [v, u];
      }
      result += this.queryRange(1, 1, this.n, this.pos[this.head[u]], this.pos[u]);
      u = this.parent[this.head[u]];
      steps++;
      if (steps > this.n + 5 || u === -1) {
        return NaN; // 무한루프/인덱스 이탈 감지
      }
    }
    if (this.depth[u] > this.depth[v]) [u, v] = [v, u];
    result += this.queryRange(1, 1, this.n, this.pos[u], this.pos[v]);
    return result;
  }

  debugPosHead() {
    return { pos: this.pos.slice(), head: this.head.slice(), size: this.size.slice(), heavy: this.heavy.slice(), depth: this.depth.slice(), parent: this.parent.slice() };
  }
}

// ---------- 최적화 코드 (반복 Segment Tree) ----------
class HeavyLightDecompositionOptimized {
  private readonly n: number;
  private readonly parent: number[];
  private readonly depth: number[];
  private readonly heavy: number[];
  private readonly head: number[];
  private readonly pos: number[];
  private readonly segN: number; // 세그먼트 트리 리프 개수
  private readonly tree: number[]; // 크기 2*segN, 리프는 tree[segN..2*segN-1]

  constructor(n: number, edges: [number, number][], root: number, values: number[]) {
    this.n = n;
    this.parent = new Array(n).fill(-1);
    this.depth = new Array(n).fill(0);
    const size = new Array(n).fill(1);
    this.heavy = new Array(n).fill(-1);
    this.head = new Array(n).fill(0);
    this.pos = new Array(n).fill(0);

    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u].push(v);
      adj[v].push(u);
    }

    const order: number[] = [];
    const stack1: [number, number, number][] = [[root, -1, 0]];
    while (stack1.length > 0) {
      const [v, par, d] = stack1.pop()!;
      this.parent[v] = par;
      this.depth[v] = d;
      order.push(v);
      for (const u of adj[v]) if (u !== par) stack1.push([u, v, d + 1]);
    }
    for (let i = order.length - 1; i >= 0; i--) {
      const v = order[i]!;
      const p = this.parent[v];
      if (p !== -1) {
        size[p] += size[v];
        if (this.heavy[p] === -1 || size[v] > size[this.heavy[p]]) this.heavy[p] = v;
      }
    }

    let timer = 0;
    const queue: number[] = [root];
    let qi = 0;
    while (qi < queue.length) {
      const chainStart = queue[qi++]!;
      const h = chainStart;
      let x: number = chainStart;
      while (x !== -1) {
        this.pos[x] = ++timer;
        this.head[x] = h;
        for (const c of adj[x]) {
          if (c !== this.parent[x] && c !== this.heavy[x]) queue.push(c);
        }
        x = this.heavy[x];
      }
    }

    this.segN = Math.max(n, 1);
    this.tree = new Array(2 * this.segN).fill(0);
    for (let v = 0; v < n; v++) {
      this.tree[this.segN + (this.pos[v] - 1)] = values[v];
    }
    for (let i = this.segN - 1; i >= 1; i--) {
      this.tree[i] = this.tree[2 * i] + this.tree[2 * i + 1];
    }
  }

  private updateIter(leafIdx: number, value: number): void {
    let i = leafIdx + this.segN;
    this.tree[i] = value;
    while (i > 1) {
      i >>= 1;
      this.tree[i] = this.tree[2 * i] + this.tree[2 * i + 1];
    }
  }

  private queryIter(l: number, r: number): number {
    // [l, r] 포함구간, 0-indexed
    let lo = l + this.segN;
    let hi = r + this.segN + 1;
    let res = 0;
    while (lo < hi) {
      if (lo & 1) res += this.tree[lo++]!;
      if (hi & 1) res += this.tree[--hi]!;
      lo >>= 1;
      hi >>= 1;
    }
    return res;
  }

  update(node: number, value: number): void {
    this.updateIter(this.pos[node] - 1, value);
  }

  queryPath(u: number, v: number): number {
    let result = 0;
    while (this.head[u] !== this.head[v]) {
      if (this.depth[this.head[u]] < this.depth[this.head[v]]) [u, v] = [v, u];
      result += this.queryIter(this.pos[this.head[u]] - 1, this.pos[u] - 1);
      u = this.parent[this.head[u]];
    }
    if (this.depth[u] > this.depth[v]) [u, v] = [v, u];
    result += this.queryIter(this.pos[u] - 1, this.pos[v] - 1);
    return result;
  }
}

// =========================================================
// 실측 검증
// =========================================================

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 대표 예시: n=7 sim 트리 ===");
{
  const n = 7;
  const edges: [number, number][] = [[0,1],[1,2],[2,3],[3,6],[0,4],[1,5]];
  const root = 0;
  const values = [1,2,3,4,5,6,7];
  const hld = new HeavyLightDecompositionBase(n, edges, root, values);
  const dbg = hld.debugPosHead();
  console.log("size", dbg.size);
  console.log("heavy", dbg.heavy);
  console.log("pos", dbg.pos);
  console.log("head", dbg.head);
  console.log("depth", dbg.depth);
  console.log("parent", dbg.parent);

  assertEq("size", dbg.size, [7,5,3,2,1,1,1]);
  assertEq("heavy[0..3]", [dbg.heavy[0],dbg.heavy[1],dbg.heavy[2],dbg.heavy[3]], [1,2,3,6]);
  assertEq("pos (vertex idx -> pos)", dbg.pos, [1,2,3,4,6,7,5]); // 구 가이드 sim과 일치
  assertEq("head", dbg.head, [0,0,0,0,4,5,0]);

  assertEq("queryPath(4,5)", hld.queryPath(4, 5), 14);

  // 최적화 버전 교차검증
  const hldOpt = new HeavyLightDecompositionOptimized(n, edges, root, values);
  assertEq("optimized queryPath(4,5)", hldOpt.queryPath(4, 5), 14);
}

console.log("\n=== 스스로 점검 문제1: queryPath(6,5) 실제값 ===");
{
  const n = 7;
  const edges: [number, number][] = [[0,1],[1,2],[2,3],[3,6],[0,4],[1,5]];
  const values = [1,2,3,4,5,6,7];
  const hld = new HeavyLightDecompositionBase(n, edges, 0, values);
  console.log("queryPath(6,5) =", hld.queryPath(6, 5));
  // 경로 6-3-2-1-5: values 7+4+3+2+6 = 22
}

console.log("\n=== 함정1: depth 비교 방향 반전 ===");
{
  const n = 7;
  const edges: [number, number][] = [[0,1],[1,2],[2,3],[3,6],[0,4],[1,5]];
  const values = [1,2,3,4,5,6,7];
  const hld = new HeavyLightDecompositionBase(n, edges, 0, values);
  const correct = hld.queryPath(4, 5);
  const buggy = hld.queryPathBuggyDirection(4, 5);
  console.log("정상 queryPath(4,5) =", correct, " / 방향반전 버그 결과 =", buggy);
}

console.log("\n=== 함정2: update에 pos 대신 node 인덱스 그대로 사용 ===");
{
  const n = 7;
  const edges: [number, number][] = [[0,1],[1,2],[2,3],[3,6],[0,4],[1,5]];
  const values = [1,2,3,4,5,6,7];
  const hld = new HeavyLightDecompositionBase(n, edges, 0, values);
  console.log("버그 전 queryPath(0,4) =", hld.queryPath(0, 4)); // 1+5=6
  console.log("버그 전 queryPath(0,6) =", hld.queryPath(0, 6)); // 1+2+3+4+7=17
  hld.updateBuggy(4, 100); // 의도: 정점4를 100으로. pos[4]=7이어야 하는데 인덱스 4(=pos[3])에 씀
  console.log("버그 후 queryPath(0,4) =", hld.queryPath(0, 4)); // 여전히 6이어야 함(정점4 안 바뀜)
  console.log("버그 후 queryPath(0,6) =", hld.queryPath(0, 6)); // 정점3 자리가 오염되어 달라짐
}

console.log("\n=== problem.md 예시 교차검증 ===");
{
  const n = 6;
  const edges: [number, number][] = [[0,1],[0,2],[1,3],[1,4],[2,5]];
  const values = [1,2,3,4,5,6];
  const hld = new HeavyLightDecompositionBase(n, edges, 0, values);
  assertEq("queryPath(3,4)", hld.queryPath(3, 4), 11);
  assertEq("queryPath(3,5)", hld.queryPath(3, 5), 16);
  assertEq("queryPath(5,5)", hld.queryPath(5, 5), 6);
  assertEq("queryPath(0,5)", hld.queryPath(0, 5), 10);
  hld.update(1, 10);
  assertEq("update후 queryPath(3,4)", hld.queryPath(3, 4), 19);
  assertEq("update후 queryPath(3,5)", hld.queryPath(3, 5), 24);

  const hldOpt = new HeavyLightDecompositionOptimized(n, edges, 0, values);
  assertEq("opt queryPath(3,4)", hldOpt.queryPath(3, 4), 11);
  assertEq("opt queryPath(3,5)", hldOpt.queryPath(3, 5), 16);
  hldOpt.update(1, 10);
  assertEq("opt update후 queryPath(3,4)", hldOpt.queryPath(3, 4), 19);
  assertEq("opt update후 queryPath(3,5)", hldOpt.queryPath(3, 5), 24);
}

console.log("\n=== 엣지: 단일 정점 ===");
{
  const hld = new HeavyLightDecompositionBase(1, [], 0, [42]);
  assertEq("single queryPath(0,0)", hld.queryPath(0, 0), 42);
  hld.update(0, 99);
  assertEq("single after update", hld.queryPath(0, 0), 99);
}

console.log("\n=== 엣지: 체인 트리 ===");
{
  const n = 4;
  const edges: [number, number][] = [[0,1],[1,2],[2,3]];
  const values = [1,2,3,4];
  const hld = new HeavyLightDecompositionBase(n, edges, 0, values);
  assertEq("chain queryPath(0,3)", hld.queryPath(0, 3), 10);
  assertEq("chain queryPath(1,2)", hld.queryPath(1, 2), 5);
  const dbg = hld.debugPosHead();
  assertEq("chain pos (전부 한 체인)", dbg.pos, [1,2,3,4]);
  assertEq("chain head (전부 0)", dbg.head, [0,0,0,0]);
}

console.log("\n=== 무작위 교차검증 (naive vs base vs optimized) ===");
{
  function randomTree(n: number, seed: number) {
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
    const values = Array.from({ length: n }, () => Math.floor(rand() * 201) - 100);
    return { edges, values, rand };
  }

  let allOk = true;
  for (let trial = 0; trial < 20; trial++) {
    const n = 5 + (trial % 20);
    const { edges, values, rand } = randomTree(n, trial * 97 + 13);
    const root = 0;
    const { parent, depth } = buildParentDepth(n, edges, root);
    const hld = new HeavyLightDecompositionBase(n, edges, root, values.slice());
    const hldOpt = new HeavyLightDecompositionOptimized(n, edges, root, values.slice());
    const curValues = values.slice();

    for (let q = 0; q < 30; q++) {
      const isUpdate = rand() < 0.3;
      if (isUpdate) {
        const node = Math.floor(rand() * n);
        const val = Math.floor(rand() * 201) - 100;
        curValues[node] = val;
        hld.update(node, val);
        hldOpt.update(node, val);
      } else {
        const u = Math.floor(rand() * n);
        const v = Math.floor(rand() * n);
        const expected = queryPathNaive(parent, depth, curValues, u, v);
        const actualBase = hld.queryPath(u, v);
        const actualOpt = hldOpt.queryPath(u, v);
        if (actualBase !== expected || actualOpt !== expected) {
          allOk = false;
          console.log(`FAIL trial=${trial} n=${n} u=${u} v=${v} expected=${expected} base=${actualBase} opt=${actualOpt}`);
        }
      }
    }
  }
  console.log(allOk ? "OK  무작위 교차검증 20 trial × 30 op 전부 일치" : "FAIL 무작위 교차검증 불일치 있음");
  if (!allOk) process.exitCode = 1;
}

console.log("\n=== 성능 목표 수치 (log 근사) ===");
{
  const nStar = 1e5;
  console.log("log2(1e5) ≈", Math.log2(nStar));
  console.log("log2(1e5)^2 ≈", Math.log2(nStar) ** 2);
}
