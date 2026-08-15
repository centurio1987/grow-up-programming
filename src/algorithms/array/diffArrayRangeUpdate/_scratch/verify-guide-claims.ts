/**
 * diffArrayRangeUpdate 가이드가 본문에 싣는 수치의 근거.
 *
 * 가이드는 경쟁 설계 셋과의 대조, 트레이스 단계별 값, 제자리 누적합의 절약분을
 * 수치로 싣는다. 그 값은 전부 여기서 나온다 — 지어낸 값이 하나도 없어야 한다는 것이
 * 요구(원칙 E3)이고, 이 파일이 그것을 재현 가능하게 만든다.
 *
 * 재는 것은 시간이 아니라 **기본 연산 횟수**다. 벽시계는 그 기계의 상수를 잴 뿐이라
 * 근거가 되지 않는다. 세는 단위 둘:
 *   - `cell`  배열 원소 접근(읽기 1 · 쓰기 1)
 *   - `cmp`   정렬 비교
 *
 *   bun src/algorithms/array/diffArrayRangeUpdate/_scratch/verify-guide-claims.ts
 */

type Update = readonly [number, number, number];

/** 계수기 — 각 설계가 배열을 몇 번 만졌는지 센다. */
class Counter {
  cell = 0;
  cmp = 0;
  read(): void {
    this.cell++;
  }
  write(): void {
    this.cell++;
  }
  compare(): void {
    this.cmp++;
  }
  get total(): number {
    return this.cell + this.cmp;
  }
}

function at<T>(xs: readonly T[], i: number): T {
  const v = xs[i];
  if (v === undefined)
    throw new RangeError(`index ${i} out of range (len ${xs.length})`);
  return v;
}

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

// ── 설계 넷 ───────────────────────────────────────────────────────────────

/** ① 순진한 방법 — 갱신마다 구간을 통째로 순회한다. */
function naive(N: number, updates: readonly Update[], c: Counter): number[] {
  const A = new Array<number>(N).fill(0);
  for (const [l, r, v] of updates) {
    for (let i = l; i <= r; i++) {
      c.read();
      c.write();
      A[i] = at(A, i) + v;
    }
  }
  return A;
}

/** ② 차분 배열 — 경계 두 점만 기록하고 마지막에 누적합 한 번. */
function diffArray(
  N: number,
  updates: readonly Update[],
  c: Counter,
): number[] {
  const D = new Array<number>(N + 1).fill(0);
  for (const [l, r, v] of updates) {
    c.read();
    c.write();
    D[l] = at(D, l) + v;
    c.read();
    c.write();
    D[r + 1] = at(D, r + 1) - v;
  }
  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    c.read();
    running += at(D, i);
    c.write();
    A[i] = running;
  }
  return A;
}

/** ②' 차분 배열 제자리 누적 — 보조 배열 A 없이 D 하나로 끝낸다. */
function diffArrayInPlace(
  N: number,
  updates: readonly Update[],
  c: Counter,
): number[] {
  const D = new Array<number>(N + 1).fill(0);
  for (const [l, r, v] of updates) {
    c.read();
    c.write();
    D[l] = at(D, l) + v;
    c.read();
    c.write();
    D[r + 1] = at(D, r + 1) - v;
  }
  let running = 0;
  for (let i = 0; i < N; i++) {
    c.read();
    running += at(D, i);
    c.write();
    D[i] = running;
  }
  D.pop(); // 여분 칸 하나를 버리면 길이가 N 이 된다
  return D;
}

/**
 * ③ 이벤트 정렬 스윕 — 경계 이벤트를 만든 뒤 **인덱스 기준으로 정렬**하고 훑는다.
 * 차분 배열과 같은 이벤트를 쓰지만, 이벤트를 배열 자리에 바로 꽂는 대신 목록으로 들고 정렬한다.
 */
function sortSweep(
  N: number,
  updates: readonly Update[],
  c: Counter,
): number[] {
  const events: [number, number][] = [];
  for (const [l, r, v] of updates) {
    c.write();
    events.push([l, v]);
    c.write();
    events.push([r + 1, -v]);
  }
  events.sort((a, b) => {
    c.compare();
    return a[0] - b[0];
  });
  const A = new Array<number>(N);
  let running = 0;
  let e = 0;
  for (let i = 0; i < N; i++) {
    while (e < events.length && at(events, e)[0] === i) {
      c.read();
      running += at(events, e)[1];
      e++;
    }
    c.write();
    A[i] = running;
  }
  return A;
}

/** ④ 세그먼트 트리 + 지연 전파 — 갱신마다 로그 깊이만큼 내려간다. */
function segmentTreeLazy(
  N: number,
  updates: readonly Update[],
  c: Counter,
): number[] {
  const lazy = new Array<number>(4 * N).fill(0);

  const update = (
    node: number,
    lo: number,
    hi: number,
    l: number,
    r: number,
    v: number,
  ): void => {
    c.compare();
    if (r < lo || hi < l) return;
    c.compare();
    if (l <= lo && hi <= r) {
      c.read();
      c.write();
      lazy[node] = at(lazy, node) + v;
      return;
    }
    const mid = (lo + hi) >> 1;
    update(node * 2, lo, mid, l, r, v);
    update(node * 2 + 1, mid + 1, hi, l, r, v);
  };

  for (const [l, r, v] of updates) update(1, 0, N - 1, l, r, v);

  const A = new Array<number>(N);
  const collect = (node: number, lo: number, hi: number, acc: number): void => {
    c.read();
    const sum = acc + at(lazy, node);
    if (lo === hi) {
      c.write();
      A[lo] = sum;
      return;
    }
    const mid = (lo + hi) >> 1;
    collect(node * 2, lo, mid, sum);
    collect(node * 2 + 1, mid + 1, hi, sum);
  };
  collect(1, 0, N - 1, 0);
  return A;
}

// ── 1. 작은 고정 예시 (가이드 본문 표) ────────────────────────────────────

const FIXED_N = 5;
const FIXED_UPDATES: Update[] = [
  [1, 3, 2],
  [0, 2, -1],
];

console.log("=== 작은 고정 예시 — N=5, updates=[[1,3,2],[0,2,-1]] ===\n");
for (const [label, fn] of [
  ["순진한 순회", naive],
  ["차분 배열", diffArray],
  ["이벤트 정렬 스윕", sortSweep],
  ["세그먼트 트리 lazy", segmentTreeLazy],
] as const) {
  const c = new Counter();
  const out = fn(FIXED_N, FIXED_UPDATES, c);
  console.log(
    `  ${label.padEnd(20)} 결과 [${out.join(", ")}]   접근 ${String(c.cell).padStart(3)}칸 · 비교 ${c.cmp}회 · 합 ${c.total}`,
  );
}

// ── 2. 규모별 대조 + 성장률 ───────────────────────────────────────────────

function randomUpdates(N: number, count: number, seed = 42): Update[] {
  const rnd = makeRandom(seed);
  const out: Update[] = [];
  for (let k = 0; k < count; k++) {
    const a = Math.floor(rnd() * N);
    const b = Math.floor(rnd() * N);
    const v = 1 + Math.floor(rnd() * 20);
    out.push(a <= b ? [a, b, v] : [b, a, v]);
  }
  return out;
}

console.log("\n=== 규모별 기본 연산 횟수 (무작위 갱신, seed=42, N = Q) ===\n");
const SIZES = [1000, 4000, 16000] as const;
const costs = new Map<string, number[]>();
const DESIGNS = [
  ["순진한 순회", naive],
  ["차분 배열", diffArray],
  ["이벤트 정렬 스윕", sortSweep],
  ["세그먼트 트리 lazy", segmentTreeLazy],
] as const;

console.log(
  `  ${"N = Q".padStart(6)}  ${DESIGNS.map(([l]) => l.padStart(18)).join("")}`,
);
for (const N of SIZES) {
  const updates = randomUpdates(N, N);
  const row: string[] = [];
  const reference = diffArray(N, updates, new Counter()).join();
  for (const [label, fn] of DESIGNS) {
    const c = new Counter();
    const out = fn(N, updates, c);
    if (out.join() !== reference) throw new Error(`${label} 결과 불일치`);
    row.push(String(c.total).padStart(18));
    const acc = costs.get(label) ?? [];
    acc.push(c.total);
    costs.set(label, acc);
  }
  console.log(`  ${String(N).padStart(6)}  ${row.join("")}`);
}

console.log("\n=== 갈리는 지점 — N = 1,000 고정, 갱신 개수 Q 를 늘리며 ===\n");
{
  const N = 1000;
  console.log(
    `  ${"Q".padStart(6)}  ${"순진한 순회".padStart(14)}  ${"차분 배열".padStart(12)}  누가 싼가`,
  );
  for (const Q of [1, 2, 4, 8, 16, 32, 64] as const) {
    const updates = randomUpdates(N, Q, 7);
    const cn = new Counter();
    const cd = new Counter();
    naive(N, updates, cn);
    diffArray(N, updates, cd);
    console.log(
      `  ${String(Q).padStart(6)}  ${String(cn.total).padStart(14)}  ${String(cd.total).padStart(12)}  ${cn.total < cd.total ? "순진한 순회" : "차분 배열"}`,
    );
  }
}

console.log("\n=== 성장률 r = C(4N)/C(N) ===\n");
for (const [label] of DESIGNS) {
  const xs = costs.get(label) ?? [];
  const rs: string[] = [];
  for (let i = 1; i < xs.length; i++) {
    rs.push((at(xs, i) / at(xs, i - 1)).toFixed(2));
  }
  console.log(`  ${label.padEnd(20)} ${rs.join(", ")}`);
}
console.log(
  "\n  네 설계 전부 같은 배열을 돌려준다(위에서 대조함) — 갈리는 것은 비용뿐이다.",
);

// ── 3. 트레이스 절·시뮬의 고정 입력 ──────────────────────────────────────

console.log("\n=== 트레이스 고정 입력 — 네 분기 전수 ===\n");
{
  const N = FIXED_N;
  const D = new Array<number>(N + 1).fill(0);
  const show = () => `[${D.join(", ")}]`;
  console.log(`  T1  초기화  D = ${show()}   (길이 N+1 = ${N + 1})`);

  let step = 1;
  for (const [l, r, v] of FIXED_UPDATES) {
    step++;
    D[l] = at(D, l) + v;
    D[r + 1] = at(D, r + 1) - v;
    console.log(
      `  T${step}  ① 갱신 남음 참 → ② D[${l}] += ${v} · ③ D[${r + 1}] -= ${v}   D = ${show()}`,
    );
  }
  step++;
  console.log(`  T${step}  ① 갱신 남음 거짓 → 기록 루프 탈출.   D = ${show()}`);

  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    step++;
    running += at(D, i);
    A[i] = running;
    console.log(
      `  T${step}  ④ ${i} < ${N} 참 → running += D[${i}](${at(D, i)}) = ${running}   A[${i}] = ${running}   A = [${A.slice(0, i + 1).join(", ")}]`,
    );
  }
  step++;
  console.log(
    `  T${step}  ④ ${N} < ${N} 거짓 → 탈출.   반환 A = [${A.join(", ")}]`,
  );
  console.log(`\n  총 트레이스 단계 ${step}개`);
}

// ── 4. 제자리 누적합의 절약분 ─────────────────────────────────────────────

console.log("\n=== 제자리 누적합 (보조 배열 A 제거) ===\n");
console.log(
  `  ${"N = Q".padStart(6)}   ${"접근(D+A)".padStart(10)}  ${"접근(제자리)".padStart(12)}  ${"할당 칸(D+A)".padStart(12)}  ${"할당 칸(제자리)".padStart(14)}  결과 일치`,
);
for (const N of SIZES) {
  const updates = randomUpdates(N, N);
  const c1 = new Counter();
  const c2 = new Counter();
  const a1 = diffArray(N, updates, c1);
  const a2 = diffArrayInPlace(N, updates, c2);
  console.log(
    `  ${String(N).padStart(6)}   ${String(c1.total).padStart(10)}  ${String(c2.total).padStart(12)}  ${String(2 * N + 1).padStart(12)}  ${String(N + 1).padStart(14)}  ${a1.join() === a2.join()}`,
  );
}

// ── 5. 실수 시나리오의 실제 반환값 ────────────────────────────────────────

console.log("\n=== 실수  D[r+1] -= v 를 빠뜨리면 ===\n");
{
  const N = FIXED_N;
  const D = new Array<number>(N + 1).fill(0);
  let first = true;
  for (const [l, r, v] of FIXED_UPDATES) {
    D[l] = at(D, l) + v;
    if (!first) D[r + 1] = at(D, r + 1) - v; // 첫 갱신만 취소 이벤트를 빠뜨린다
    first = false;
  }
  const A: number[] = [];
  let running = 0;
  for (let i = 0; i < N; i++) {
    running += at(D, i);
    A.push(running);
  }
  console.log(`  빠뜨린 D = [${D.join(", ")}]  →  A = [${A.join(", ")}]`);
  console.log(
    `  올바른 A = [${diffArray(N, FIXED_UPDATES, new Counter()).join(", ")}]`,
  );
}

console.log("\n=== 실수  D[r] -= v (경계를 한 칸 당기면) ===\n");
{
  const N = FIXED_N;
  const one: Update[] = [[1, 3, 2]];
  const right = diffArray(N, one, new Counter());
  const D = new Array<number>(N + 1).fill(0);
  for (const [l, r, v] of one) {
    D[l] = at(D, l) + v;
    D[r] = at(D, r) - v; // r+1 이 아니라 r
  }
  const A: number[] = [];
  let running = 0;
  for (let i = 0; i < N; i++) {
    running += at(D, i);
    A.push(running);
  }
  console.log(`  올바른  D[r+1] -= v :  A = [${right.join(", ")}]`);
  console.log(`  잘못된  D[r]   -= v :  A = [${A.join(", ")}]`);
}

// ── 6. 본문 구현이 실제로 옳은지 (E5) ─────────────────────────────────────

console.log("\n=== 본문 구현 검증 ===\n");
{
  let ok = true;
  for (let seed = 1; seed <= 5000; seed++) {
    const rnd = makeRandom(seed);
    const N = 1 + Math.floor(rnd() * 12);
    const count = Math.floor(rnd() * 5);
    const updates: Update[] = [];
    for (let k = 0; k < count; k++) {
      const a = Math.floor(rnd() * N);
      const b = Math.floor(rnd() * N);
      const v = -10 + Math.floor(rnd() * 21);
      updates.push(a <= b ? [a, b, v] : [b, a, v]);
    }
    const expected = naive(N, updates, new Counter()).join();
    if (diffArray(N, updates, new Counter()).join() !== expected) ok = false;
    if (diffArrayInPlace(N, updates, new Counter()).join() !== expected)
      ok = false;
    if (!ok) {
      console.log(
        `  불일치 seed=${seed} N=${N} updates=${JSON.stringify(updates)}`,
      );
      break;
    }
  }
  console.log(
    `  무작위 5,000건 순진한 순회 대조: ${ok ? "전부 일치" : "불일치 발견"}`,
  );
  console.log(
    `  updates = [] → [${diffArray(3, [], new Counter()).join(", ")}]   N=1, [[0,0,10000]] → [${diffArray(1, [[0, 0, 10000]], new Counter()).join(", ")}]`,
  );
}

// ── 7. 실수  복원 루프 두 줄의 순서를 뒤집으면 ────────────────────────────

console.log(
  "\n=== 실수  running += D[i] 와 A[i] = running 의 순서를 뒤집으면 ===\n",
);
{
  const N = FIXED_N;
  const D = new Array<number>(N + 1).fill(0);
  for (const [l, r, v] of FIXED_UPDATES) {
    D[l] = at(D, l) + v;
    D[r + 1] = at(D, r + 1) - v;
  }
  const A: number[] = [];
  let running = 0;
  for (let i = 0; i < N; i++) {
    A.push(running); // 먼저 쓰고
    running += at(D, i); // 나중에 합친다 — 뒤집힌 순서
  }
  const right = diffArray(N, FIXED_UPDATES, new Counter());
  console.log(`  D = [${D.join(", ")}]`);
  console.log(`  올바른 순서  A = [${right.join(", ")}]`);
  console.log(`  뒤집은 순서  A = [${A.join(", ")}]`);
  console.log(
    `  뒤집은 결과가 "올바른 답을 한 칸 오른쪽으로 민 것 + 앞에 0"인가: ${
      A.join() === [0, ...right.slice(0, N - 1)].join()
    }`,
  );
}
