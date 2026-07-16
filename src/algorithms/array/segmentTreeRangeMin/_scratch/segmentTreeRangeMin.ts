// 가이드 본문 코드 자기 검증용 스크래치. bun으로 직접 실행해 수치를 확인한다.

type SegOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

// ---------- naive (출발점) ----------
function segmentTreeRangeMinNaive(A: number[], ops: SegOp[]): number[] {
  const arr = A.slice();
  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      arr[op.i] = op.v;
    } else {
      let m = Infinity;
      for (let k = op.l; k <= op.r; k++) m = Math.min(m, arr[k]);
      result.push(m);
    }
  }
  return result;
}

// ---------- 기본 구현: 재귀 세그먼트 트리 ----------
function segmentTreeRangeMinRecursive(A: number[], ops: SegOp[]): number[] {
  const N = A.length;
  const INF = Number.MAX_SAFE_INTEGER;
  const tree = new Array<number>(4 * N).fill(INF);

  function build(node: number, s: number, e: number): void {
    if (s === e) {
      tree[node] = A[s]!;
      return;
    }
    const mid = (s + e) >> 1;
    build(2 * node, s, mid);
    build(2 * node + 1, mid + 1, e);
    tree[node] = Math.min(tree[2 * node]!, tree[2 * node + 1]!);
  }

  function update(node: number, s: number, e: number, i: number, v: number): void {
    if (s === e) {
      tree[node] = v;
      return;
    }
    const mid = (s + e) >> 1;
    if (i <= mid) update(2 * node, s, mid, i, v);
    else update(2 * node + 1, mid + 1, e, i, v);
    tree[node] = Math.min(tree[2 * node]!, tree[2 * node + 1]!);
  }

  function query(node: number, s: number, e: number, l: number, r: number): number {
    if (r < s || e < l) return INF; // 겹치지 않음
    if (l <= s && e <= r) return tree[node]!; // 완전 포함
    const mid = (s + e) >> 1;
    return Math.min(
      query(2 * node, s, mid, l, r),
      query(2 * node + 1, mid + 1, e, l, r),
    );
  }

  build(1, 0, N - 1);
  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") update(1, 0, N - 1, op.i, op.v);
    else result.push(query(1, 0, N - 1, op.l, op.r));
  }
  return result;
}

// ---------- 최적화 구현: 반복 세그먼트 트리 (bottom-up, 2N) ----------
function segmentTreeRangeMinIterative(A: number[], ops: SegOp[]): number[] {
  const N = A.length;
  const INF = Number.MAX_SAFE_INTEGER;
  const tree = new Array<number>(2 * N).fill(INF);

  for (let i = 0; i < N; i++) tree[N + i] = A[i]!;
  for (let i = N - 1; i >= 1; i--) {
    tree[i] = Math.min(tree[2 * i]!, tree[2 * i + 1]!);
  }

  function update(pos: number, v: number): void {
    let i = pos + N;
    tree[i] = v;
    for (i >>= 1; i >= 1; i >>= 1) {
      tree[i] = Math.min(tree[2 * i]!, tree[2 * i + 1]!);
    }
  }

  function query(l: number, rExclusive: number): number {
    // [l, rExclusive) 반개구간
    let res = INF;
    let lo = l + N;
    let hi = rExclusive + N;
    while (lo < hi) {
      if (lo & 1) res = Math.min(res, tree[lo++]!);
      if (hi & 1) res = Math.min(res, tree[--hi]!);
      lo >>= 1;
      hi >>= 1;
    }
    return res;
  }

  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") update(op.i, op.v);
    else result.push(query(op.l, op.r + 1)); // 폐구간 → 반개구간 변환
  }
  return result;
}

// ---------- 실측 검증 ----------
function assertEq(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

console.log("=== 대표 예시 A=[1,3,2,7,9,11], query(1,4) ===");
{
  const A = [1, 3, 2, 7, 9, 11];
  const ops: SegOp[] = [{ type: "query", l: 1, r: 4 }];
  const rNaive = segmentTreeRangeMinNaive(A, ops);
  const rRec = segmentTreeRangeMinRecursive(A, ops);
  const rIter = segmentTreeRangeMinIterative(A, ops);
  assertEq("naive", rNaive, [2]);
  assertEq("recursive", rRec, [2]);
  assertEq("iterative", rIter, [2]);
}

console.log("\n=== 문제 예시 1 ===");
{
  const A = [5, 2, 4, 1, 3];
  const ops: SegOp[] = [
    { type: "query", l: 0, r: 4 },
    { type: "query", l: 0, r: 2 },
    { type: "update", i: 3, v: 10 },
    { type: "query", l: 0, r: 4 },
    { type: "query", l: 3, r: 4 },
  ];
  assertEq("recursive", segmentTreeRangeMinRecursive(A, ops), [1, 2, 2, 3]);
  assertEq("iterative", segmentTreeRangeMinIterative(A, ops), [1, 2, 2, 3]);
}

console.log("\n=== 문제 예시 2: 단일 원소 ===");
{
  const A = [5];
  const ops: SegOp[] = [
    { type: "query", l: 0, r: 0 },
    { type: "update", i: 0, v: 99 },
    { type: "query", l: 0, r: 0 },
  ];
  assertEq("recursive", segmentTreeRangeMinRecursive(A, ops), [5, 99]);
  assertEq("iterative", segmentTreeRangeMinIterative(A, ops), [5, 99]);
}

console.log("\n=== 문제 예시 3: 연산 없음 ===");
{
  assertEq("recursive", segmentTreeRangeMinRecursive([1, 2, 3], []), []);
  assertEq("iterative", segmentTreeRangeMinIterative([1, 2, 3], []), []);
}

console.log("\n=== 문제 예시 4: 음수 갱신 ===");
{
  const A = [1, 2, 3];
  const ops: SegOp[] = [
    { type: "update", i: 1, v: -1000 },
    { type: "query", l: 0, r: 2 },
  ];
  assertEq("recursive", segmentTreeRangeMinRecursive(A, ops), [-1000]);
  assertEq("iterative", segmentTreeRangeMinIterative(A, ops), [-1000]);
}

console.log("\n=== 시뮬레이션 재현: A=[1,3,2,7] ===");
{
  const A = [1, 3, 2, 7];
  const ops: SegOp[] = [
    { type: "query", l: 1, r: 3 },
    { type: "update", i: 2, v: 0 },
    { type: "query", l: 1, r: 3 },
  ];
  assertEq("recursive", segmentTreeRangeMinRecursive(A, ops), [2, 0]);
  assertEq("iterative", segmentTreeRangeMinIterative(A, ops), [2, 0]);

  // build 직후 tree 배열 스냅샷 (recursive, 1-indexed, size 4N=16)
  const N = A.length;
  const INF = Number.MAX_SAFE_INTEGER;
  const tree = new Array<number>(4 * N).fill(INF);
  function build(node: number, s: number, e: number): void {
    if (s === e) { tree[node] = A[s]!; return; }
    const mid = (s + e) >> 1;
    build(2 * node, s, mid);
    build(2 * node + 1, mid + 1, e);
    tree[node] = Math.min(tree[2 * node]!, tree[2 * node + 1]!);
  }
  build(1, 0, N - 1);
  console.log("build 직후 tree[1..7] =", tree.slice(1, 8));

  // 반복 버전 build 스냅샷 (2N=8)
  const it = new Array<number>(2 * N).fill(INF);
  for (let i = 0; i < N; i++) it[N + i] = A[i]!;
  for (let i = N - 1; i >= 1; i--) it[i] = Math.min(it[2 * i]!, it[2 * i + 1]!);
  console.log("iterative build 직후 tree[1..7] =", it.slice(1, 8));
}

console.log("\n=== 엣지: N=1 반복 update/query ===");
{
  const A = [7];
  const ops: SegOp[] = [
    { type: "query", l: 0, r: 0 },
    { type: "update", i: 0, v: -5 },
    { type: "query", l: 0, r: 0 },
  ];
  assertEq("recursive", segmentTreeRangeMinRecursive(A, ops), [7, -5]);
  assertEq("iterative", segmentTreeRangeMinIterative(A, ops), [7, -5]);
}

console.log("\n=== 함정 재현: 겹침 조건 오류 (r < s || e < l) 를 (r < s && e < l)로 바꾸면? ===");
{
  // 잘못된 겹침 조건으로 구현해 실제로 틀린 값이 나오는지 확인
  const N = 4;
  const A = [1, 3, 2, 7];
  const INF = Number.MAX_SAFE_INTEGER;
  const tree = new Array<number>(4 * N).fill(INF);
  function build(node: number, s: number, e: number): void {
    if (s === e) { tree[node] = A[s]!; return; }
    const mid = (s + e) >> 1;
    build(2 * node, s, mid);
    build(2 * node + 1, mid + 1, e);
    tree[node] = Math.min(tree[2 * node]!, tree[2 * node + 1]!);
  }
  build(1, 0, N - 1);
  function buggyQuery(node: number, s: number, e: number, l: number, r: number): number {
    if (r < s && e < l) return INF; // 버그: OR가 아니라 AND
    if (l <= s && e <= r) return tree[node]!;
    const mid = (s + e) >> 1;
    return Math.min(
      buggyQuery(2 * node, s, mid, l, r),
      buggyQuery(2 * node + 1, mid + 1, e, l, r),
    );
  }
  // query(0,0) 이어야 하는데, AND로 잘못 쓰면 "겹치지 않음" 조건이 사실상 항상
  // false가 되어 리프에서도 재귀가 멈추지 않는다. 실제로 실행해 확인한다.
  const correct = segmentTreeRangeMinRecursive(A, [{ type: "query", l: 0, r: 0 }])[0];
  console.log(`query(0,0) 정답=${correct}`);
  try {
    const buggy = buggyQuery(1, 0, N - 1, 0, 0);
    console.log(`버그(AND로 잘못 쓴 경우) 결과=${buggy}`);
  } catch (err) {
    console.log(`버그(AND로 잘못 쓴 경우) → ${(err as Error).constructor.name}: 재귀가 멈추지 않아 스택 오버플로우로 죽는다`);
  }
}

console.log("\n=== 함정 재현: update에서 상향 재계산 줄을 빠뜨리면? ===");
{
  const N = 4;
  const A = [1, 3, 2, 7];
  const INF = Number.MAX_SAFE_INTEGER;
  const tree = new Array<number>(4 * N).fill(INF);
  function build(node: number, s: number, e: number): void {
    if (s === e) { tree[node] = A[s]!; return; }
    const mid = (s + e) >> 1;
    build(2 * node, s, mid);
    build(2 * node + 1, mid + 1, e);
    tree[node] = Math.min(tree[2 * node]!, tree[2 * node + 1]!);
  }
  function query(node: number, s: number, e: number, l: number, r: number): number {
    if (r < s || e < l) return INF;
    if (l <= s && e <= r) return tree[node]!;
    const mid = (s + e) >> 1;
    return Math.min(query(2 * node, s, mid, l, r), query(2 * node + 1, mid + 1, e, l, r));
  }
  function buggyUpdate(node: number, s: number, e: number, i: number, v: number): void {
    if (s === e) { tree[node] = v; return; }
    const mid = (s + e) >> 1;
    if (i <= mid) buggyUpdate(2 * node, s, mid, i, v);
    else buggyUpdate(2 * node + 1, mid + 1, e, i, v);
    // 버그: 상향 재계산 줄 tree[node] = min(...) 누락
  }
  build(1, 0, N - 1);
  buggyUpdate(1, 0, N - 1, 2, 0); // A[2] = 2 → 0
  const buggyResult = query(1, 0, N - 1, 1, 3); // 정답은 min(3,0,7)=0
  console.log(`update(i=2,v=0) 후 query(1,3): 정답=0, 재계산 누락 버그 결과=${buggyResult} (리프는 바뀌었지만 부모가 안 바뀌어 옛 값 3을 그대로 봄)`);
}

console.log("\n=== 함정 재현: 반복 버전에서 lo++/--hi 순서를 서로 바꾸면? ===");
{
  const A = [1, 3, 2, 7, 9, 11];
  const N = A.length;
  const INF = Number.MAX_SAFE_INTEGER;
  const tree = new Array<number>(2 * N).fill(INF);
  for (let i = 0; i < N; i++) tree[N + i] = A[i]!;
  for (let i = N - 1; i >= 1; i--) tree[i] = Math.min(tree[2 * i]!, tree[2 * i + 1]!);

  function correctQuery(l: number, rExclusive: number): number {
    let res = INF, lo = l + N, hi = rExclusive + N;
    while (lo < hi) {
      if (lo & 1) res = Math.min(res, tree[lo++]!);
      if (hi & 1) res = Math.min(res, tree[--hi]!);
      lo >>= 1; hi >>= 1;
    }
    return res;
  }
  // 버그: lo는 먼저 증가시키지 않고 읽기만, hi는 먼저 읽고 감소 (순서를 반대로 뒤집음)
  function buggyQuery(l: number, rExclusive: number): number {
    let res = INF, lo = l + N, hi = rExclusive + N;
    while (lo < hi) {
      if (lo & 1) { res = Math.min(res, tree[lo]!); } // lo++ 누락 → 같은 노드를 무한 재방문 위험
      if (hi & 1) { res = Math.min(res, tree[hi]!); hi--; } // 순서 반대: 감소 전에 읽음(범위 밖 원소 포함 가능)
      lo >>= 1; hi >>= 1;
    }
    return res;
  }
  const l = 1, r = 4; // query(1,4) → [1,5) 반개구간
  const correct = correctQuery(l, r + 1);
  let buggy: number;
  try {
    // buggyQuery는 lo++ 누락으로 무한루프 가능성이 있어 반복 횟수를 제한해 관찰
    let res = INF, lo = l + N, hi = r + 1 + N, iter = 0;
    while (lo < hi && iter < 50) {
      if (lo & 1) { res = Math.min(res, tree[lo]!); }
      if (hi & 1) { res = Math.min(res, tree[hi]!); hi--; }
      lo >>= 1; hi >>= 1;
      iter++;
    }
    buggy = res;
    console.log(`query(1,4): 정답=${correct}, lo++/--hi 순서를 깬 버그 결과=${buggy} (iter=${iter}, 조기 종료 없이는 lo가 절대 안 늘어나 무한루프)`);
  } catch (err) {
    console.log(`query(1,4): 정답=${correct}, 버그는 예외 발생 - ${(err as Error).message}`);
  }
}

console.log("\n=== 무작위 교차검증 (naive vs recursive vs iterative), 200회 ===");
{
  let allOk = true;
  for (let trial = 0; trial < 200; trial++) {
    const N = 1 + Math.floor(Math.random() * 20);
    const A = Array.from({ length: N }, () => Math.floor(Math.random() * 2001) - 1000);
    const Q = Math.floor(Math.random() * 30);
    const ops: SegOp[] = [];
    for (let k = 0; k < Q; k++) {
      if (Math.random() < 0.5) {
        const i = Math.floor(Math.random() * N);
        const v = Math.floor(Math.random() * 2001) - 1000;
        ops.push({ type: "update", i, v });
      } else {
        const a = Math.floor(Math.random() * N);
        const b = Math.floor(Math.random() * N);
        const l = Math.min(a, b);
        const r = Math.max(a, b);
        ops.push({ type: "query", l, r });
      }
    }
    const rN = segmentTreeRangeMinNaive(A, ops);
    const rR = segmentTreeRangeMinRecursive(A, ops);
    const rI = segmentTreeRangeMinIterative(A, ops);
    const sN = JSON.stringify(rN);
    if (sN !== JSON.stringify(rR) || sN !== JSON.stringify(rI)) {
      allOk = false;
      console.error(`MISMATCH trial=${trial} N=${N} A=${JSON.stringify(A)} ops=${JSON.stringify(ops)}`);
      console.error(`  naive=${sN} recursive=${JSON.stringify(rR)} iterative=${JSON.stringify(rI)}`);
    }
  }
  console.log(allOk ? "OK   무작위 200회 전부 일치" : "FAIL 무작위 교차검증 불일치 발견");
  if (!allOk) process.exitCode = 1;
}
