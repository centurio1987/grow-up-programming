/**
 * mosAlgorithm 가이드가 본문에 싣는 수치의 근거.
 *
 * 가이드는 정렬 기준별 포인터 이동 칸 수와 성장률, 그리고 실수 시나리오의
 * 실제 반환값을 수치로 싣는다. 그 값은 전부 여기서 나온다 — 지어낸 값이 하나도
 * 없어야 한다는 것이 요구(원칙 E3)이고, 이 파일이 그것을 재현 가능하게 만든다.
 *
 * 재는 것은 시간이 아니라 **포인터 이동 칸 수**(= add/remove 호출 횟수)다.
 * 벽시계는 그 기계의 상수를 잴 뿐이라 근거가 되지 않는다.
 *
 *   bun src/algorithms/array/mosAlgorithm/_scratch/verify-guide-claims.ts
 */

type Query = readonly [number, number];
type Order = readonly number[];
type Sorter = (queries: readonly Query[], blockSize: number) => number[];

/** 결정적 난수 — 가이드의 표를 언제 다시 돌려도 같은 값이 나와야 한다. */
function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function at<T>(xs: readonly T[], i: number): T {
  const v = xs[i];
  if (v === undefined)
    throw new RangeError(`index ${i} out of range (len ${xs.length})`);
  return v;
}

function blockOf(
  queries: readonly Query[],
  i: number,
  blockSize: number,
): number {
  return Math.floor(at(queries, i)[0] / blockSize);
}

const identity: Sorter = (queries) => queries.map((_, i) => i);

const byLeft: Sorter = (queries) =>
  queries
    .map((_, i) => i)
    .sort((a, b) => at(queries, a)[0] - at(queries, b)[0]);

const byRight: Sorter = (queries) =>
  queries
    .map((_, i) => i)
    .sort((a, b) => at(queries, a)[1] - at(queries, b)[1]);

const byBlockThenRight: Sorter = (queries, blockSize) =>
  queries
    .map((_, i) => i)
    .sort((a, b) => {
      const ba = blockOf(queries, a, blockSize);
      const bb = blockOf(queries, b, blockSize);
      return ba !== bb ? ba - bb : at(queries, a)[1] - at(queries, b)[1];
    });

const byBlockOddEven: Sorter = (queries, blockSize) =>
  queries
    .map((_, i) => i)
    .sort((a, b) => {
      const ba = blockOf(queries, a, blockSize);
      const bb = blockOf(queries, b, blockSize);
      if (ba !== bb) return ba - bb;
      return ba % 2 === 0
        ? at(queries, a)[1] - at(queries, b)[1]
        : at(queries, b)[1] - at(queries, a)[1];
    });

const STRATEGIES: ReadonlyArray<readonly [string, Sorter]> = [
  ["정렬 안 함", identity],
  ["l만 정렬", byLeft],
  ["r만 정렬", byRight],
  ["Mo's", byBlockThenRight],
  ["Mo's+홀짝", byBlockOddEven],
];

/** 주어진 처리 순서에서 두 포인터가 움직인 총 칸 수. */
function pointerMoves(queries: readonly Query[], order: Order): number {
  let curL = 0;
  let curR = -1;
  let moves = 0;
  for (const i of order) {
    const [l, r] = at(queries, i);
    while (curR < r) {
      curR++;
      moves++;
    }
    while (curL > l) {
      curL--;
      moves++;
    }
    while (curR > r) {
      moves++;
      curR--;
    }
    while (curL < l) {
      moves++;
      curL++;
    }
  }
  return moves;
}

function randomQueries(n: number, count: number, seed = 42): Query[] {
  const rnd = makeRandom(seed);
  const out: Query[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(rnd() * n);
    const b = Math.floor(rnd() * n);
    out.push(a <= b ? [a, b] : [b, a]);
  }
  return out;
}

function blockSizeFor(n: number): number {
  return Math.max(1, Math.floor(Math.sqrt(n)));
}

// ── 1. 가이드 「순서를 바꾸는 방법은 여럿이다」 절의 작은 예시 ──────────────

console.log("=== 작은 고정 예시 (가이드 본문 표) ===\n");
{
  const queries: Query[] = [
    [0, 7],
    [5, 6],
    [1, 3],
    [4, 7],
  ];
  const blockSize = blockSizeFor(8);
  console.log(`arr = [1,3,2,3,1,2,1,3] (n=8), B = ${blockSize}`);
  for (const [name, sort] of STRATEGIES) {
    if (name === "Mo's+홀짝") continue; // 작은 예시에서는 Mo's 와 같은 순서가 나온다
    const order = sort(queries, blockSize);
    const seq = order.map((i) => `[${at(queries, i).join(",")}]`).join("→");
    console.log(
      `  ${name.padEnd(10)} ${seq}  ${pointerMoves(queries, order)}칸`,
    );
  }
}

// ── 2. 가이드 실측 표 + 성장률 ────────────────────────────────────────────

console.log("\n=== 정렬 기준별 이동 칸 수 (무작위 질의, seed=42, n=q) ===\n");
const SIZES = [1000, 4000, 16000] as const;
const costs = new Map<string, number[]>();

for (const n of SIZES) {
  const queries = randomQueries(n, n);
  const blockSize = blockSizeFor(n);
  const cells: string[] = [];
  for (const [name, sort] of STRATEGIES) {
    const c = pointerMoves(queries, sort(queries, blockSize));
    cells.push(`${name} ${c.toLocaleString()}`);
    const prev = costs.get(name) ?? [];
    prev.push(c);
    costs.set(name, prev);
  }
  console.log(`  n=${String(n).padStart(6)}  ${cells.join(" | ")}`);
}

console.log("\n=== 성장률 r = C(4n)/C(n) ===\n");
for (const [name] of STRATEGIES) {
  const c = costs.get(name) ?? [];
  const ratios = c.slice(1).map((v, i) => (v / at(c, i)).toFixed(2));
  console.log(`  ${name.padEnd(10)} r = ${ratios.join(", ")}`);
}

// ── 3. 실수 시나리오의 실제 반환값 ────────────────────────────────────────

/** 가이드 본문 구현. `pushInsteadOfIndex` 가 켜지면 answers 를 순서대로 채운다. */
function mos(
  arr: readonly number[],
  queries: readonly Query[],
  pushInsteadOfIndex = false,
): number[] {
  const blockSize = blockSizeFor(arr.length);
  const order = byBlockThenRight(queries, blockSize);
  const freq = new Map<number, number>();
  let distinct = 0;
  let curL = 0;
  let curR = -1;

  const add = (x: number) => {
    const f = (freq.get(x) ?? 0) + 1;
    freq.set(x, f);
    if (f === 1) distinct++;
  };
  const remove = (x: number) => {
    const f = (freq.get(x) ?? 0) - 1;
    freq.set(x, f);
    if (f === 0) distinct--;
  };

  const byIndex = new Array<number>(queries.length);
  const pushed: number[] = [];
  for (const i of order) {
    const [l, r] = at(queries, i);
    while (curR < r) {
      curR++;
      add(at(arr, curR));
    }
    while (curL > l) {
      curL--;
      add(at(arr, curL));
    }
    while (curR > r) {
      remove(at(arr, curR));
      curR--;
    }
    while (curL < l) {
      remove(at(arr, curL));
      curL++;
    }
    byIndex[i] = distinct;
    pushed.push(distinct);
  }
  return pushInsteadOfIndex ? pushed : byIndex;
}

const bruteForce = (
  arr: readonly number[],
  queries: readonly Query[],
): number[] => queries.map(([l, r]) => new Set(arr.slice(l, r + 1)).size);

console.log("\n=== 실수 ①  answers[origIdx] 대신 순서대로 push ===\n");
{
  const arr = [1, 2, 3, 3, 1, 2, 3];
  const queries: Query[] = [
    [3, 6],
    [0, 3],
    [1, 2],
  ];
  console.log(`  arr     = [${arr.join(", ")}]`);
  console.log(`  queries = ${JSON.stringify(queries)}`);
  console.log(`  정답           [${bruteForce(arr, queries).join(", ")}]`);
  console.log(
    `  push 로 채우면 [${mos(arr, queries, true).join(", ")}]   ← 예외 없음`,
  );
}

console.log("\n=== 실수 ②  축소를 먼저 하면 freq 가 음수로 내려간다 ===\n");
{
  // 확장/축소 순서를 뒤집은 변형. 중간 상태를 그대로 찍는다.
  const arr = [1, 2, 3, 4, 5, 6];
  const queries: Query[] = [
    [3, 5],
    [0, 1],
  ];
  const blockSize = blockSizeFor(arr.length);
  const order = byBlockThenRight(queries, blockSize);
  const freq = new Map<number, number>();
  let curL = 0;
  let curR = -1;
  console.log(
    `  arr = [${arr.join(", ")}], 처리 순서 ${order.map((i) => `[${at(queries, i).join(",")}]`).join("→")}`,
  );
  for (const i of order) {
    const [l, r] = at(queries, i);
    while (curR > r) {
      const x = at(arr, curR);
      freq.set(x, (freq.get(x) ?? 0) - 1);
      curR--;
    }
    while (curL < l) {
      const x = at(arr, curL);
      const f = (freq.get(x) ?? 0) - 1;
      freq.set(x, f);
      const note = f < 0 ? "  ← 음수! 구간 밖 원소를 뺐다" : "";
      console.log(`    remove(arr[${curL}]=${x}) → freq[${x}]=${f}${note}`);
      curL++;
    }
    while (curR < r) {
      curR++;
      const x = at(arr, curR);
      freq.set(x, (freq.get(x) ?? 0) + 1);
    }
    while (curL > l) {
      curL--;
      const x = at(arr, curL);
      freq.set(x, (freq.get(x) ?? 0) + 1);
    }
  }
}

console.log("\n=== 그런데 축소 먼저로도 distinct 답은 틀리지 않는다 ===\n");
{
  function mosShrinkFirst(
    arr: readonly number[],
    queries: readonly Query[],
  ): number[] {
    const order = byBlockThenRight(queries, blockSizeFor(arr.length));
    const freq = new Map<number, number>();
    let distinct = 0;
    let curL = 0;
    let curR = -1;
    const add = (x: number) => {
      const f = (freq.get(x) ?? 0) + 1;
      freq.set(x, f);
      if (f === 1) distinct++;
    };
    const remove = (x: number) => {
      const f = (freq.get(x) ?? 0) - 1;
      freq.set(x, f);
      if (f === 0) distinct--;
    };
    const out = new Array<number>(queries.length);
    for (const i of order) {
      const [l, r] = at(queries, i);
      while (curR > r) {
        remove(at(arr, curR));
        curR--;
      }
      while (curL < l) {
        remove(at(arr, curL));
        curL++;
      }
      while (curR < r) {
        curR++;
        add(at(arr, curR));
      }
      while (curL > l) {
        curL--;
        add(at(arr, curL));
      }
      out[i] = distinct;
    }
    return out;
  }

  let mismatches = 0;
  const TRIALS = 400000;
  for (let seed = 1; seed <= TRIALS; seed++) {
    const rnd = makeRandom(seed);
    const n = 4 + Math.floor(rnd() * 5);
    const arr = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 3));
    const count = 2 + Math.floor(rnd() * 3);
    const queries: Query[] = [];
    for (let k = 0; k < count; k++) {
      const a = Math.floor(rnd() * n);
      const b = Math.floor(rnd() * n);
      queries.push(a <= b ? [a, b] : [b, a]);
    }
    if (mosShrinkFirst(arr, queries).join() !== bruteForce(arr, queries).join())
      mismatches++;
  }
  console.log(
    `  무작위 ${TRIALS.toLocaleString()}건 대조 — 답이 틀린 경우 ${mismatches}건`,
  );
  console.log(
    "  distinct 는 0↔1 경계만 보므로, 음수로 내려간 오차가 확장에서 상쇄된다.",
  );
}

// ── 4. 본문 구현이 실제로 옳은지 (E5) ─────────────────────────────────────

console.log("\n=== 본문 구현 검증 ===\n");
{
  let ok = true;
  for (let seed = 1; seed <= 5000; seed++) {
    const rnd = makeRandom(seed);
    const n = 1 + Math.floor(rnd() * 9);
    const arr = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 5));
    const count = 1 + Math.floor(rnd() * 4);
    const queries: Query[] = [];
    for (let k = 0; k < count; k++) {
      const a = Math.floor(rnd() * n);
      const b = Math.floor(rnd() * n);
      queries.push(a <= b ? [a, b] : [b, a]);
    }
    if (mos(arr, queries).join() !== bruteForce(arr, queries).join()) {
      ok = false;
      console.log(
        `  불일치 seed=${seed} arr=[${arr.join(",")}] q=${JSON.stringify(queries)}`,
      );
      break;
    }
  }
  console.log(
    `  무작위 5,000건 완전탐색 대조: ${ok ? "전부 일치" : "불일치 발견"}`,
  );
  console.log(
    `  시뮬 입력 [1,3,2,3,1,2] / [[1,4],[0,2],[2,5]] → [${mos(
      [1, 3, 2, 3, 1, 2],
      [
        [1, 4],
        [0, 2],
        [2, 5],
      ],
    ).join(", ")}]`,
  );
  console.log(
    `  빈 queries → [${mos([1, 2, 3], []).join(", ")}]   빈 arr → [${mos([], []).join(", ")}]`,
  );
}
