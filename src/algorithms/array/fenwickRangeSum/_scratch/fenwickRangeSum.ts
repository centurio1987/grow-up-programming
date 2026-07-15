type FenwickOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

// naive
function fenwickRangeSumNaive(A: number[], ops: FenwickOp[]): number[] {
  const arr = A.slice();
  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      arr[op.i] = op.v;
    } else {
      let sum = 0;
      for (let k = op.l; k <= op.r; k++) sum += arr[k]!;
      result.push(sum);
    }
  }
  return result;
}

// basic Fenwick (O(n log n) build)
function fenwickRangeSumBasic(A: number[], ops: FenwickOp[]): number[] {
  const n = A.length;
  const arr = A.slice();
  const tree = new Array(n + 1).fill(0);

  const update = (i: number, delta: number) => {
    for (; i <= n; i += i & -i) tree[i] += delta;
  };
  const prefix = (i: number) => {
    let sum = 0;
    for (; i > 0; i -= i & -i) sum += tree[i];
    return sum;
  };

  for (let i = 0; i < n; i++) update(i + 1, arr[i]!);

  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      const delta = op.v - arr[op.i]!;
      arr[op.i] = op.v;
      update(op.i + 1, delta);
    } else {
      result.push(prefix(op.r + 1) - prefix(op.l));
    }
  }
  return result;
}

// optimized Fenwick (O(n) build)
function fenwickRangeSumOptimized(A: number[], ops: FenwickOp[]): number[] {
  const n = A.length;
  const arr = A.slice();
  const tree = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) tree[i] += arr[i - 1]!;
  for (let i = 1; i <= n; i++) {
    const j = i + (i & -i);
    if (j <= n) tree[j] += tree[i];
  }

  console.log("built tree:", tree);

  const update = (i: number, delta: number) => {
    for (; i <= n; i += i & -i) tree[i] += delta;
  };
  const prefix = (i: number) => {
    let sum = 0;
    for (; i > 0; i -= i & -i) sum += tree[i];
    return sum;
  };

  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      const delta = op.v - arr[op.i]!;
      arr[op.i] = op.v;
      update(op.i + 1, delta);
    } else {
      result.push(prefix(op.r + 1) - prefix(op.l));
    }
  }
  return result;
}

function assertEq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  console.log(`${a === e ? "OK " : "FAIL"} ${name}: got ${a} expect ${e}`);
}

// --- 시뮬레이션(구 가이드) 대표 예시: A=[1,3,5,7], query(1,3), update(1,10), query(1,3) ---
{
  const A = [1, 3, 5, 7];
  const ops: FenwickOp[] = [
    { type: "query", l: 1, r: 3 },
    { type: "update", i: 1, v: 10 },
    { type: "query", l: 1, r: 3 },
  ];
  const expected = [15, 22];
  assertEq("sim-basic", fenwickRangeSumBasic(A, ops), expected);
  assertEq("sim-optimized", fenwickRangeSumOptimized(A, ops), expected);
  assertEq("sim-naive", fenwickRangeSumNaive(A, ops), expected);
}

// --- 문제 예시 1 ---
{
  const A = [1, 2, 3, 4, 5];
  const ops: FenwickOp[] = [
    { type: "query", l: 0, r: 4 },
    { type: "update", i: 2, v: 10 },
    { type: "query", l: 0, r: 4 },
    { type: "query", l: 2, r: 3 },
  ];
  const expected = [15, 22, 14];
  assertEq("problem-ex1-basic", fenwickRangeSumBasic(A, ops), expected);
  assertEq("problem-ex1-optimized", fenwickRangeSumOptimized(A, ops), expected);
}

// --- 문제 예시 2: 단일 원소 ---
{
  const A = [7];
  const ops: FenwickOp[] = [{ type: "query", l: 0, r: 0 }];
  const expected = [7];
  assertEq("problem-ex2-basic", fenwickRangeSumBasic(A, ops), expected);
  assertEq("problem-ex2-optimized", fenwickRangeSumOptimized(A, ops), expected);
}

// --- 문제 예시 3: 연산 없음 ---
{
  const A = [1, 2, 3];
  const ops: FenwickOp[] = [];
  const expected: number[] = [];
  assertEq("problem-ex3-basic", fenwickRangeSumBasic(A, ops), expected);
  assertEq("problem-ex3-optimized", fenwickRangeSumOptimized(A, ops), expected);
}

// --- 문제 예시 4: 음수 갱신 ---
{
  const A = [1, 2, 3];
  const ops: FenwickOp[] = [
    { type: "update", i: 0, v: -5 },
    { type: "query", l: 0, r: 2 },
  ];
  const expected = [0];
  assertEq("problem-ex4-basic", fenwickRangeSumBasic(A, ops), expected);
  assertEq("problem-ex4-optimized", fenwickRangeSumOptimized(A, ops), expected);
}

// --- 헷갈리는 포인트 검증: prefix(r) vs prefix(r+1) 오프셋 실수 ---
{
  const A = [1, 3, 5, 7];
  const n = A.length;
  const tree = new Array(n + 1).fill(0);
  const update = (i: number, delta: number) => {
    for (; i <= n; i += i & -i) tree[i] += delta;
  };
  const prefix = (i: number) => {
    let sum = 0;
    for (; i > 0; i -= i & -i) sum += tree[i];
    return sum;
  };
  for (let i = 0; i < n; i++) update(i + 1, A[i]!);
  const correct = prefix(3 + 1) - prefix(1); // sum(1,3) = 15
  const wrong = prefix(3) - prefix(1); // 실수: r을 그대로 씀
  console.log(`오프셋 함정: 올바름 prefix(4)-prefix(1)=${correct}, 틀림 prefix(3)-prefix(1)=${wrong}`);
}

// --- 헷갈리는 포인트 검증: delta 계산 생략(누적 오류) ---
{
  const A = [1, 3, 5, 7];
  const n = A.length;
  const tree = new Array(n + 1).fill(0);
  const arr = A.slice();
  const update = (i: number, delta: number) => {
    for (; i <= n; i += i & -i) tree[i] += delta;
  };
  const prefix = (i: number) => {
    let sum = 0;
    for (; i > 0; i -= i & -i) sum += tree[i];
    return sum;
  };
  for (let i = 0; i < n; i++) update(i + 1, arr[i]!);
  // 올바르게: delta = v - arr[i]
  const before = prefix(4) - prefix(0); // 전체합 16
  const wrongDelta = 10; // v를 그대로 더하는 실수 (delta 계산 생략)
  update(1 + 1, wrongDelta); // BIT 인덱스 i+1=2에 잘못 반영
  const wrongTotal = prefix(4) - prefix(0);
  console.log(`delta 생략 함정: before=${before}, v(10)를 그대로 더하면 total=${wrongTotal} (정답은 A[1]:3→10 반영된 23)`);
}

// --- 무작위 교차 검증: naive vs optimized ---
{
  let fails = 0;
  for (let trial = 0; trial < 200; trial++) {
    const n = 1 + Math.floor(Math.random() * 12);
    const A = Array.from({ length: n }, () => Math.floor(Math.random() * 21) - 10);
    const q = Math.floor(Math.random() * 12);
    const ops: FenwickOp[] = [];
    for (let k = 0; k < q; k++) {
      if (Math.random() < 0.5) {
        const i = Math.floor(Math.random() * n);
        const v = Math.floor(Math.random() * 21) - 10;
        ops.push({ type: "update", i, v });
      } else {
        const l = Math.floor(Math.random() * n);
        const r = l + Math.floor(Math.random() * (n - l));
        ops.push({ type: "query", l, r });
      }
    }
    const expected = fenwickRangeSumNaive(A, ops);
    const gotBasic = fenwickRangeSumBasic(A, ops);
    const gotOpt = fenwickRangeSumOptimized(A, ops);
    if (JSON.stringify(expected) !== JSON.stringify(gotBasic) || JSON.stringify(expected) !== JSON.stringify(gotOpt)) {
      fails++;
      console.log("MISMATCH", { A, ops, expected, gotBasic, gotOpt });
    }
  }
  console.log(`무작위 교차검증 200회 완료, 실패 ${fails}건`);
}

// --- LSB 예시 (본문 ascii art 검증용) ---
{
  for (const i of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const lsb = i & -i;
    console.log(`i=${i} lowbit=${lsb}`);
  }
}

// --- N=8 build 비용 실측 (더 빠르게 만들 단서 찾기 절 ascii art 검증) ---
{
  const n = 8;
  // 방식 1: 개별 update N회 호출 시 각 인덱스가 몇 번 "쓰기"되는지 집계
  const writeCount = new Array(n + 1).fill(0);
  let totalTouches = 0;
  for (let i0 = 1; i0 <= n; i0++) {
    for (let i = i0; i <= n; i += i & -i) {
      writeCount[i]!++;
      totalTouches++;
    }
  }
  console.log("개별 update N회 방식 — 인덱스별 쓰기 횟수:", writeCount.slice(1));
  console.log("총 쓰기 횟수(touches):", totalTouches);

  // 방식 2: 2-pass O(n) 빌드의 연산 수
  let selfWrites = 0;
  let pushWrites = 0;
  for (let i = 1; i <= n; i++) selfWrites++;
  for (let i = 1; i <= n; i++) {
    const j = i + (i & -i);
    if (j <= n) pushWrites++;
  }
  console.log(`2-pass 빌드 — self=${selfWrites}, push=${pushWrites}, 합계=${selfWrites + pushWrites}`);
}
