// Deque 가이드 ORD-005 재집필용 실측 검증 스크래치
//
// 본문에 실을 코드를 그대로 두고, 본문에 쓸 모든 수치를 실행으로 확인한다.
// 실행: bun src/data-structures/linear/deque/_scratch/deque-ord005-verify.ts

// ---------------------------------------------------------------------------
// 계측 도구 — "원소 이동 횟수"를 센다.
// unshift/shift/slice/concat 처럼 내부적으로 원소를 옮기는 연산의 비용을
// 옮겨진 원소 개수로 환산해 누적한다. (시간은 환경에 따라 흔들리므로
// 결정적인 이동 횟수를 1차 근거로 삼는다.)
// ---------------------------------------------------------------------------

let moves = 0;
function resetMoves(): void {
  moves = 0;
}

// ---------------------------------------------------------------------------
// 후보 ① 단일 배열 + unshift/shift
// ---------------------------------------------------------------------------
class SingleArrayDeque<T> {
  private data: T[] = [];

  pushFront(item: T): void {
    moves += this.data.length; // 기존 원소 전부 한 칸씩 밀림
    this.data.unshift(item);
  }
  pushBack(item: T): void {
    this.data.push(item);
  }
  popFront(): T | undefined {
    if (this.data.length === 0) return undefined;
    moves += this.data.length - 1; // 나머지 전부 한 칸씩 당겨짐
    return this.data.shift();
  }
  popBack(): T | undefined {
    return this.data.pop();
  }
  size(): number {
    return this.data.length;
  }
}

// ---------------------------------------------------------------------------
// 후보 ④ 두 배열 + "한 개씩 옮기기"
// ---------------------------------------------------------------------------
class ShiftPerPopDeque<T> {
  private front: T[] = [];
  private back: T[] = [];

  pushFront(item: T): void {
    this.front.push(item);
  }
  pushBack(item: T): void {
    this.back.push(item);
  }
  popFront(): T | undefined {
    if (this.front.length > 0) return this.front.pop();
    if (this.back.length === 0) return undefined;
    moves += this.back.length - 1;
    return this.back.shift();
  }
  popBack(): T | undefined {
    if (this.back.length > 0) return this.back.pop();
    if (this.front.length === 0) return undefined;
    moves += this.front.length - 1;
    return this.front.shift();
  }
  size(): number {
    return this.front.length + this.back.length;
  }
}

// ---------------------------------------------------------------------------
// 후보 ⑤ 두 배열 + "전부 요청한 쪽으로 몰아주기"
// ---------------------------------------------------------------------------
class AllToOneSideDeque<T> {
  private front: T[] = [];
  private back: T[] = [];

  private rebalance(needFront: boolean): void {
    const logical = [...this.front].reverse().concat(this.back);
    moves += logical.length;
    if (needFront) {
      this.front = logical.slice().reverse();
      this.back = [];
    } else {
      this.front = [];
      this.back = logical;
    }
  }

  pushFront(item: T): void {
    this.front.push(item);
  }
  pushBack(item: T): void {
    this.back.push(item);
  }
  popFront(): T | undefined {
    if (this.front.length === 0) {
      if (this.back.length === 0) return undefined;
      this.rebalance(true);
    }
    return this.front.pop();
  }
  popBack(): T | undefined {
    if (this.back.length === 0) {
      if (this.front.length === 0) return undefined;
      this.rebalance(false);
    }
    return this.back.pop();
  }
  size(): number {
    return this.front.length + this.back.length;
  }
}

// ---------------------------------------------------------------------------
// 최종 — 두 배열 + 절반 재조정 (본문에 실을 코드 그대로)
// ---------------------------------------------------------------------------
class Deque<T> {
  private front: T[] = []; // 역순 저장. front[length-1] = 논리적 맨 앞
  private back: T[] = []; // 정순 저장. back[0] = 논리적 front 바로 다음

  private rebalance(needFront: boolean): void {
    const logical = [...this.front].reverse().concat(this.back);
    moves += logical.length; // 계측용 — 본문 코드에는 없는 한 줄
    const total = logical.length;
    if (total === 1) {
      this.front = needFront ? logical : [];
      this.back = needFront ? [] : logical;
      return;
    }
    const mid = Math.ceil(total / 2);
    this.front = logical.slice(0, mid).reverse();
    this.back = logical.slice(mid);
  }

  pushFront(item: T): void {
    this.front.push(item);
  }
  pushBack(item: T): void {
    this.back.push(item);
  }
  popFront(): T | undefined {
    if (this.front.length === 0) {
      if (this.back.length === 0) return undefined;
      this.rebalance(true);
    }
    return this.front.pop();
  }
  popBack(): T | undefined {
    if (this.back.length === 0) {
      if (this.front.length === 0) return undefined;
      this.rebalance(false);
    }
    return this.back.pop();
  }
  peekFront(): T | undefined {
    return this.front.length > 0 ? this.front[this.front.length - 1] : this.back[0];
  }
  peekBack(): T | undefined {
    return this.back.length > 0 ? this.back[this.back.length - 1] : this.front[0];
  }
  isEmpty(): boolean {
    return this.front.length + this.back.length === 0;
  }
  size(): number {
    return this.front.length + this.back.length;
  }

  // 검증 전용 — 내부 상태 관찰
  snapshot(): { front: T[]; back: T[] } {
    return { front: [...this.front], back: [...this.back] };
  }
  potential(): number {
    return Math.abs(this.front.length - this.back.length);
  }
}

// total===1 분기를 뺀 버그 버전 (본문 함정 재현용)
class BuggyDeque<T> {
  private front: T[] = [];
  private back: T[] = [];

  private rebalance(): void {
    const logical = [...this.front].reverse().concat(this.back);
    const mid = Math.ceil(logical.length / 2);
    this.front = logical.slice(0, mid).reverse();
    this.back = logical.slice(mid);
  }

  pushFront(item: T): void {
    this.front.push(item);
  }
  pushBack(item: T): void {
    this.back.push(item);
  }
  popFront(): T | undefined {
    if (this.front.length === 0) {
      if (this.back.length === 0) return undefined;
      this.rebalance();
    }
    return this.front.pop();
  }
  popBack(): T | undefined {
    if (this.back.length === 0) {
      if (this.front.length === 0) return undefined;
      this.rebalance();
    }
    return this.back.pop();
  }
  size(): number {
    return this.front.length + this.back.length;
  }
}

// ---------------------------------------------------------------------------
// 후보 ② 이중 연결 리스트 (모든 연산 최악 O(1) — 이동 횟수 0)
// ---------------------------------------------------------------------------
class DllNode<T> {
  value: T;
  prev: DllNode<T> | undefined = undefined;
  next: DllNode<T> | undefined = undefined;
  constructor(value: T) {
    this.value = value;
  }
}

class LinkedDeque<T> {
  private head: DllNode<T> | undefined = undefined;
  private tail: DllNode<T> | undefined = undefined;
  private count = 0;

  pushFront(item: T): void {
    const node = new DllNode(item);
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
    this.count++;
  }
  pushBack(item: T): void {
    const node = new DllNode(item);
    node.prev = this.tail;
    if (this.tail) this.tail.next = node;
    this.tail = node;
    if (!this.head) this.head = node;
    this.count++;
  }
  popFront(): T | undefined {
    if (!this.head) return undefined;
    const node = this.head;
    this.head = node.next;
    if (this.head) this.head.prev = undefined;
    else this.tail = undefined;
    this.count--;
    return node.value;
  }
  popBack(): T | undefined {
    if (!this.tail) return undefined;
    const node = this.tail;
    this.tail = node.prev;
    if (this.tail) this.tail.next = undefined;
    else this.head = undefined;
    this.count--;
    return node.value;
  }
  size(): number {
    return this.count;
  }
}

// ---------------------------------------------------------------------------
// 후보 ③ 링 버퍼(원형 버퍼) — 배열 하나 + 시작 위치 포인터, 가득 차면 2배 확장
// ---------------------------------------------------------------------------
class RingDeque<T> {
  private buf: (T | undefined)[] = new Array(8);
  private head = 0; // 논리적 맨 앞의 물리 인덱스
  private count = 0;

  private grow(): void {
    const next: (T | undefined)[] = new Array(this.buf.length * 2);
    for (let i = 0; i < this.count; i++) {
      next[i] = this.buf[(this.head + i) % this.buf.length];
    }
    moves += this.count;
    this.buf = next;
    this.head = 0;
  }
  pushFront(item: T): void {
    if (this.count === this.buf.length) this.grow();
    this.head = (this.head - 1 + this.buf.length) % this.buf.length;
    this.buf[this.head] = item;
    this.count++;
  }
  pushBack(item: T): void {
    if (this.count === this.buf.length) this.grow();
    this.buf[(this.head + this.count) % this.buf.length] = item;
    this.count++;
  }
  popFront(): T | undefined {
    if (this.count === 0) return undefined;
    const v = this.buf[this.head];
    this.buf[this.head] = undefined;
    this.head = (this.head + 1) % this.buf.length;
    this.count--;
    return v;
  }
  popBack(): T | undefined {
    if (this.count === 0) return undefined;
    const idx = (this.head + this.count - 1) % this.buf.length;
    const v = this.buf[idx];
    this.buf[idx] = undefined;
    this.count--;
    return v;
  }
  size(): number {
    return this.count;
  }
}

// ---------------------------------------------------------------------------
// 분할 비율 α 일반화 — "왜 하필 절반인가"를 확인하기 위한 실험용
// α = 1  → 전부 몰아주기, α = 0.5 → 절반, α = 0.25/0.75 → 치우친 분할
// ---------------------------------------------------------------------------
class RatioDeque<T> {
  private front: T[] = [];
  private back: T[] = [];
  private alpha: number;

  constructor(alpha: number) {
    this.alpha = alpha;
  }

  private rebalance(needFront: boolean): void {
    const logical = [...this.front].reverse().concat(this.back);
    moves += logical.length;
    const total = logical.length;
    if (total === 1) {
      this.front = needFront ? logical : [];
      this.back = needFront ? [] : logical;
      return;
    }
    // 요청받은 쪽이 alpha 비율을 가져간다. 양쪽 모두 최소 1개는 남긴다.
    let take = Math.round(total * this.alpha);
    take = Math.min(total - 1, Math.max(1, take));
    const mid = needFront ? take : total - take;
    this.front = logical.slice(0, mid).reverse();
    this.back = logical.slice(mid);
  }

  pushFront(item: T): void {
    this.front.push(item);
  }
  pushBack(item: T): void {
    this.back.push(item);
  }
  popFront(): T | undefined {
    if (this.front.length === 0) {
      if (this.back.length === 0) return undefined;
      this.rebalance(true);
    }
    return this.front.pop();
  }
  popBack(): T | undefined {
    if (this.back.length === 0) {
      if (this.front.length === 0) return undefined;
      this.rebalance(false);
    }
    return this.back.pop();
  }
  size(): number {
    return this.front.length + this.back.length;
  }
}

// ---------------------------------------------------------------------------
// 워크로드
// ---------------------------------------------------------------------------
interface AnyDeque {
  pushFront(item: number): void;
  pushBack(item: number): void;
  popFront(): number | undefined;
  popBack(): number | undefined;
  size(): number;
}

// FIFO: 뒤에 n번 넣고 앞에서 n번 뺀다 (평범한 큐 사용 패턴)
function runFifo(dq: AnyDeque, n: number): number {
  for (let i = 0; i < n; i++) dq.pushBack(i);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += dq.popFront() ?? 0;
  return sum;
}

// ZIGZAG: 뒤에 n번 넣고 앞/뒤에서 번갈아 뺀다 (팰린드롬 검사 패턴)
function runZigzag(dq: AnyDeque, n: number): number {
  for (let i = 0; i < n; i++) dq.pushBack(i);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (i % 2 === 0 ? dq.popFront() : dq.popBack()) ?? 0;
  }
  return sum;
}

function measure(
  name: string,
  make: () => AnyDeque,
  run: (dq: AnyDeque, n: number) => number,
  n: number,
): { name: string; moves: number; sum: number } {
  resetMoves();
  const dq = make();
  const sum = run(dq, n);
  return { name, moves, sum };
}

console.log("=".repeat(72));
console.log("[1] 이동 횟수 실측 — n = 2000");
console.log("=".repeat(72));

const N = 2000;
const expectedSum = (N * (N - 1)) / 2;

for (const [label, run] of [
  ["FIFO (pushBack×n → popFront×n)", runFifo],
  ["ZIGZAG (pushBack×n → popFront/popBack 교대)", runZigzag],
] as const) {
  console.log(`\n-- ${label}`);
  const rows = [
    measure("① 단일 배열(unshift/shift)", () => new SingleArrayDeque<number>(), run, N),
    measure("④ 두 배열, 한 개씩 옮기기", () => new ShiftPerPopDeque<number>(), run, N),
    measure("⑤ 두 배열, 전부 몰아주기", () => new AllToOneSideDeque<number>(), run, N),
    measure("⑥ 두 배열, 절반씩 재조정", () => new Deque<number>(), run, N),
    measure("② 이중 연결 리스트", () => new LinkedDeque<number>(), run, N),
  ];
  for (const r of rows) {
    const ok = r.sum === expectedSum ? "ok" : `SUM MISMATCH ${r.sum}`;
    console.log(
      `   ${r.name.padEnd(30)} 이동 ${r.moves.toLocaleString().padStart(12)}회   (합계 검증 ${ok})`,
    );
  }
}

console.log("\n-- 절반 재조정의 이동 횟수가 n에 어떻게 비례하는가");
for (const n of [500, 1000, 2000, 4000, 8000]) {
  const fifo = measure("half", () => new Deque<number>(), runFifo, n);
  const zig = measure("half", () => new Deque<number>(), runZigzag, n);
  console.log(
    `   n=${String(n).padStart(5)}  FIFO 이동 ${String(fifo.moves).padStart(7)}회 (= ${(fifo.moves / n).toFixed(3)}n)   ZIGZAG 이동 ${String(zig.moves).padStart(7)}회 (= ${(zig.moves / n).toFixed(3)}n)`,
  );
}

console.log("\n-- 전부 몰아주기(⑤)의 ZIGZAG 이동 횟수는 n에 어떻게 비례하는가");
for (const n of [500, 1000, 2000, 4000]) {
  const zig = measure("all", () => new AllToOneSideDeque<number>(), runZigzag, n);
  console.log(
    `   n=${String(n).padStart(5)}  이동 ${String(zig.moves).padStart(10)}회  (n²/2 = ${((n * n) / 2).toLocaleString()})`,
  );
}

console.log("\n-- 분할 비율 α를 바꿔 보면 (n = 2000, 이동 횟수)");
{
  const rows: string[] = [];
  for (const alpha of [0.25, 0.5, 0.75, 1.0]) {
    const fifo = measure("r", () => new RatioDeque<number>(alpha), runFifo, N);
    const zig = measure("r", () => new RatioDeque<number>(alpha), runZigzag, N);
    rows.push(
      `   α=${alpha.toFixed(2)}  FIFO ${String(fifo.moves).padStart(9)}회 (${(fifo.moves / N).toFixed(2)}n)   ZIGZAG ${String(zig.moves).padStart(9)}회 (${(zig.moves / N).toFixed(2)}n)`,
    );
  }
  for (const r of rows) console.log(r);
}

console.log("\n-- 링 버퍼(③)의 이동 횟수 (확장 시 복사만 계산, n = 2000)");
{
  const fifo = measure("ring", () => new RingDeque<number>(), runFifo, N);
  const zig = measure("ring", () => new RingDeque<number>(), runZigzag, N);
  console.log(`   FIFO ${fifo.moves}회, ZIGZAG ${zig.moves}회 (2배씩 확장하므로 총 복사 < 2n)`);
}

console.log("\n" + "=".repeat(72));
console.log("[2] 실제 소요 시간 — n = 200,000 (환경에 따라 변동)");
console.log("=".repeat(72));

function timeIt(name: string, make: () => AnyDeque, run: (dq: AnyDeque, n: number) => number, n: number): void {
  const dq = make();
  const t0 = performance.now();
  const sum = run(dq, n);
  const t1 = performance.now();
  const ok = sum === (n * (n - 1)) / 2 ? "ok" : "MISMATCH";
  console.log(`   ${name.padEnd(30)} ${(t1 - t0).toFixed(1).padStart(9)} ms   (합계 ${ok})`);
}

const NT = 200_000;
console.log("\n-- FIFO");
timeIt("① 단일 배열(unshift/shift)", () => new SingleArrayDeque<number>(), runFifo, NT);
timeIt("④ 두 배열, 한 개씩 옮기기", () => new ShiftPerPopDeque<number>(), runFifo, NT);
timeIt("⑤ 두 배열, 전부 몰아주기", () => new AllToOneSideDeque<number>(), runFifo, NT);
timeIt("⑥ 두 배열, 절반씩 재조정", () => new Deque<number>(), runFifo, NT);
timeIt("② 이중 연결 리스트", () => new LinkedDeque<number>(), runFifo, NT);
timeIt("③ 링 버퍼", () => new RingDeque<number>(), runFifo, NT);

console.log("\n-- ZIGZAG (⑤가 O(n²)라 n=50,000으로 줄여 잰다)");
const NZ = 50_000;
timeIt("⑤ 두 배열, 전부 몰아주기", () => new AllToOneSideDeque<number>(), runZigzag, NZ);
timeIt("⑥ 두 배열, 절반씩 재조정", () => new Deque<number>(), runZigzag, NZ);
timeIt("② 이중 연결 리스트", () => new LinkedDeque<number>(), runZigzag, NZ);
timeIt("③ 링 버퍼", () => new RingDeque<number>(), runZigzag, NZ);
timeIt("④ 두 배열, 한 개씩 옮기기", () => new ShiftPerPopDeque<number>(), runZigzag, NZ);

console.log("\n" + "=".repeat(72));
console.log("[3] 포텐셜 함수 Φ = ||front| - |back|| 추적 (FIFO, n=8)");
console.log("=".repeat(72));

{
  resetMoves();
  const dq = new Deque<number>();
  const trace: string[] = [];
  let prevPhi = dq.potential();
  let prevMoves = 0;
  for (let i = 0; i < 8; i++) {
    dq.pushBack(i);
    const phi = dq.potential();
    trace.push(
      `pushBack(${i})  실비용 1  ΔΦ ${(phi - prevPhi >= 0 ? "+" : "") + (phi - prevPhi)}  Φ=${phi}  상각 ${1 + (phi - prevPhi)}`,
    );
    prevPhi = phi;
  }
  for (let i = 0; i < 8; i++) {
    const before = moves;
    dq.popFront();
    const real = 1 + (moves - before); // pop 1회 + 재조정 이동량
    const phi = dq.potential();
    const snap = dq.snapshot();
    trace.push(
      `popFront()   실비용 ${String(real).padStart(2)}  ΔΦ ${(phi - prevPhi >= 0 ? "+" : "") + (phi - prevPhi)}  Φ=${phi}  상각 ${real + (phi - prevPhi)}   front=[${snap.front}] back=[${snap.back}]`,
    );
    prevPhi = phi;
    prevMoves = moves;
  }
  for (const line of trace) console.log("   " + line);
  console.log(`   총 이동 ${prevMoves}회 (원소 8개)`);
}

console.log("\n" + "=".repeat(72));
console.log("[3-b] 상각 비용 상한 검증 — 어떤 연산 순서에서도 ĉ = c + ΔΦ ≤ 3 인가");
console.log("=".repeat(72));

{
  function makeRng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let worstAmortized = Number.NEGATIVE_INFINITY;
  let worstWhat = "";
  let totalReal = 0;
  let totalOps = 0;

  for (let trial = 0; trial < 30; trial++) {
    const rng = makeRng(777 + trial);
    const dq = new Deque<number>();
    let phi = dq.potential();
    for (let step = 0; step < 2000; step++) {
      const before = moves;
      const r = rng();
      let what = "";
      if (r < 0.3) {
        dq.pushFront(step);
        what = "pushFront";
      } else if (r < 0.6) {
        dq.pushBack(step);
        what = "pushBack";
      } else if (r < 0.8) {
        dq.popFront();
        what = "popFront";
      } else {
        dq.popBack();
        what = "popBack";
      }
      const real = 1 + (moves - before); // 배열 끝 연산 1 + 재조정 복사량
      const phi2 = dq.potential();
      const amortized = real + (phi2 - phi);
      totalReal += real;
      totalOps++;
      if (amortized > worstAmortized) {
        worstAmortized = amortized;
        worstWhat = `${what} (실비용 ${real}, ΔΦ ${phi2 - phi})`;
      }
      phi = phi2;
    }
  }
  console.log(`   30회 × 2000연산 무작위: 상각 비용 최댓값 = ${worstAmortized} (증명한 상한 3)  ← ${worstWhat}`);
  console.log(`   총 실비용 ${totalReal.toLocaleString()} / 연산 ${totalOps.toLocaleString()}회 = 연산당 평균 ${(totalReal / totalOps).toFixed(3)}`);
}

console.log("\n" + "=".repeat(72));
console.log("[4] 재조정 Before/After 실측 (본문 도식 대조)");
console.log("=".repeat(72));

{
  const dq = new Deque<number>();
  for (const v of [1, 2, 3, 4, 5, 6, 7]) dq.pushBack(v);
  console.log("   Before:", JSON.stringify(dq.snapshot()), "size =", dq.size());
  const got = dq.popFront();
  console.log("   popFront() =", got);
  console.log("   After :", JSON.stringify(dq.snapshot()), "size =", dq.size());
}

{
  const dq = new Deque<number>();
  for (const v of [10, 20, 30, 40, 50]) dq.pushBack(v);
  console.log("\n   [확인 질문용] back=[10,20,30,40,50], front=[] 에서 popFront()");
  const got = dq.popFront();
  console.log("   popFront() =", got, "→", JSON.stringify(dq.snapshot()));
}

{
  const dq = new Deque<number>();
  for (const v of [100, 200, 300, 400, 500, 600]) dq.pushBack(v);
  console.log("\n   [점검문제 1] back=[100..600], front=[] 에서 popFront() 2회");
  const a = dq.popFront();
  const s1 = dq.snapshot();
  const b = dq.popFront();
  const s2 = dq.snapshot();
  console.log(`   1회차 = ${a} → ${JSON.stringify(s1)}`);
  console.log(`   2회차 = ${b} → ${JSON.stringify(s2)}`);
}

console.log("\n" + "=".repeat(72));
console.log("[5] total===1 분기 누락 버그 재현");
console.log("=".repeat(72));

{
  const buggy = new BuggyDeque<number>();
  buggy.pushFront(9);
  const got = buggy.popBack();
  console.log(`   pushFront(9) → popBack() = ${got}  (기댓값 9)  ${got === 9 ? "ok" : "BUG 재현"}`);

  const good = new Deque<number>();
  good.pushFront(9);
  console.log(`   정상 구현: pushFront(9) → popBack() = ${good.popBack()}`);
}

console.log("\n" + "=".repeat(72));
console.log("[6] 무작위 교차검증 — 참조 모델(배열)과 대조");
console.log("=".repeat(72));

{
  // 결정적 난수 (mulberry32)
  function makeRng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let mismatches = 0;
  let opCount = 0;
  for (let trial = 0; trial < 20; trial++) {
    const rng = makeRng(1234 + trial);
    const dq = new Deque<number>();
    const model: number[] = [];
    for (let step = 0; step < 3000; step++) {
      const r = rng();
      opCount++;
      if (r < 0.3) {
        const v = Math.floor(rng() * 1000);
        dq.pushFront(v);
        model.unshift(v);
      } else if (r < 0.6) {
        const v = Math.floor(rng() * 1000);
        dq.pushBack(v);
        model.push(v);
      } else if (r < 0.75) {
        const got = dq.popFront();
        const want = model.shift();
        if (got !== want) {
          mismatches++;
          console.log(`   MISMATCH popFront trial=${trial} step=${step} got=${got} want=${want}`);
        }
      } else if (r < 0.9) {
        const got = dq.popBack();
        const want = model.pop();
        if (got !== want) {
          mismatches++;
          console.log(`   MISMATCH popBack trial=${trial} step=${step} got=${got} want=${want}`);
        }
      } else {
        const okF = dq.peekFront() === model[0];
        const okB = dq.peekBack() === model[model.length - 1];
        const okS = dq.size() === model.length;
        const okE = dq.isEmpty() === (model.length === 0);
        if (!okF || !okB || !okS || !okE) {
          mismatches++;
          console.log(`   MISMATCH peek/size trial=${trial} step=${step}`);
        }
      }
    }
  }
  console.log(`   20회 × 3000연산 = ${opCount.toLocaleString()}연산, 불일치 ${mismatches}건`);

  // 같은 워크로드를 버그 버전으로 돌려 첫 실패 지점을 찾는다
  let firstFail: string | null = null;
  outer: for (let trial = 0; trial < 20 && !firstFail; trial++) {
    const rng = makeRng(1234 + trial);
    const buggy = new BuggyDeque<number>();
    const model: number[] = [];
    for (let step = 0; step < 3000; step++) {
      const r = rng();
      if (r < 0.3) {
        const v = Math.floor(rng() * 1000);
        buggy.pushFront(v);
        model.unshift(v);
      } else if (r < 0.6) {
        const v = Math.floor(rng() * 1000);
        buggy.pushBack(v);
        model.push(v);
      } else if (r < 0.75) {
        const got = buggy.popFront();
        const want = model.shift();
        if (got !== want) {
          firstFail = `trial=${trial} step=${step} popFront got=${got} want=${want}`;
          break outer;
        }
      } else if (r < 0.9) {
        const got = buggy.popBack();
        const want = model.pop();
        if (got !== want) {
          firstFail = `trial=${trial} step=${step} popBack got=${got} want=${want}`;
          break outer;
        }
      }
    }
  }
  console.log(`   버그 버전(total===1 분기 없음) 첫 실패: ${firstFail ?? "실패 없음"}`);
}

console.log("\n" + "=".repeat(72));
console.log("[7] 시뮬레이션 프레임 실측 — pushBack(1),pushBack(2),pushFront(0),popBack(),popFront()");
console.log("=".repeat(72));

{
  const dq = new Deque<number>();
  const logical = (d: Deque<number>): number[] => {
    const s = d.snapshot();
    return [...s.front].reverse().concat(s.back);
  };
  console.log(`   초기        논리=[${logical(dq)}] size=${dq.size()} isEmpty=${dq.isEmpty()}`);
  dq.pushBack(1);
  console.log(`   pushBack(1) 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())}`);
  dq.pushBack(2);
  console.log(`   pushBack(2) 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())}`);
  dq.pushFront(0);
  console.log(`   pushFront(0) 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())}`);
  console.log(`   peekFront=${dq.peekFront()} peekBack=${dq.peekBack()}`);
  const b = dq.popBack();
  console.log(`   popBack()=${b} 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())} size=${dq.size()} peekBack=${dq.peekBack()}`);
  const f = dq.popFront();
  console.log(`   popFront()=${f} 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())} size=${dq.size()} peekFront=${dq.peekFront()}`);
  const g = dq.popFront();
  console.log(`   popFront()=${g} size=${dq.size()} isEmpty=${dq.isEmpty()}`);
  console.log(`   popBack()(빈 덱)=${dq.popBack()}`);
}

console.log("\n" + "=".repeat(72));
console.log("[7-b] 시뮬레이션 2막 — 이어서 pushBack(2..7) 후 popFront 두 번 (재조정 관찰)");
console.log("=".repeat(72));

{
  const dq = new Deque<number>();
  const logical = (d: Deque<number>): number[] => {
    const s = d.snapshot();
    return [...s.front].reverse().concat(s.back);
  };
  // 1막 재현
  dq.pushBack(1);
  dq.pushBack(2);
  dq.pushFront(0);
  dq.popBack();
  dq.popFront();
  console.log(`   1막 끝    논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())}`);
  for (const v of [2, 3, 4, 5, 6, 7]) dq.pushBack(v);
  console.log(`   pushBack(2..7) 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())} size=${dq.size()}`);

  // 재조정 직전 상태를 손으로 계산해 대조
  const s0 = dq.snapshot();
  const total = s0.front.length + s0.back.length;
  console.log(`   popFront 호출: front 비었나? ${s0.front.length === 0} / total=${total} / mid=⌈${total}/2⌉=${Math.ceil(total / 2)}`);
  const r1 = dq.popFront();
  console.log(`   popFront()=${r1} 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())}`);
  const r2 = dq.popFront();
  console.log(`   popFront()=${r2} 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())} (재조정 없음)`);
  const r3 = dq.popBack();
  console.log(`   popBack()=${r3} 논리=[${logical(dq)}] 내부=${JSON.stringify(dq.snapshot())} (재조정 없음)`);
}

console.log("\n" + "=".repeat(72));
console.log("[8] 문제 예시 재현 (deque-problem.md)");
console.log("=".repeat(72));

{
  const dq = new Deque<number>();
  dq.pushBack(1);
  dq.pushBack(2);
  dq.pushFront(0);
  console.log("   peekFront =", dq.peekFront(), "(기대 0)");
  console.log("   peekBack  =", dq.peekBack(), "(기대 2)");
  console.log("   popFront  =", dq.popFront(), "(기대 0)");
  console.log("   popBack   =", dq.popBack(), "(기대 2)");
  console.log("   size      =", dq.size(), "(기대 1)");
  console.log("   popFront  =", dq.popFront(), "(기대 1)");
  console.log("   isEmpty   =", dq.isEmpty(), "(기대 true)");
  console.log("   popBack   =", dq.popBack(), "(기대 undefined)");
}

console.log("\n" + "=".repeat(72));
console.log("[9] 메모리 — 원소 100만 개 보관 시 힙 사용량");
console.log("=".repeat(72));

{
  function heapUsedMB(): number {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  Bun.gc(true);
  const base = heapUsedMB();
  const arrDq = new Deque<number>();
  for (let i = 0; i < 1_000_000; i++) arrDq.pushBack(i);
  Bun.gc(true);
  const afterArr = heapUsedMB();
  console.log(`   두 배열 덱   : ${(afterArr - base).toFixed(1)} MB (size=${arrDq.size()})`);

  const linked = new LinkedDeque<number>();
  for (let i = 0; i < 1_000_000; i++) linked.pushBack(i);
  Bun.gc(true);
  const afterLinked = heapUsedMB();
  console.log(`   이중 연결 리스트: ${(afterLinked - afterArr).toFixed(1)} MB (size=${linked.size()})`);
}

console.log("\n" + "=".repeat(72));
console.log("[10] 외부 검토 반영 — 제약 최댓값(총 연산 10^6)에서 최종 구현 실제 시간");
console.log("=".repeat(72));

{
  function makeRng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const OPS = 1_000_000;

  // (a) 무작위 혼합
  {
    const rng = makeRng(2026);
    const plan = new Uint8Array(OPS);
    for (let i = 0; i < OPS; i++) plan[i] = Math.floor(rng() * 4);
    const dq = new Deque<number>();
    const t0 = performance.now();
    for (let i = 0; i < OPS; i++) {
      const p = plan[i];
      if (p === 0) dq.pushFront(i);
      else if (p === 1) dq.pushBack(i);
      else if (p === 2) dq.popFront();
      else dq.popBack();
    }
    const t1 = performance.now();
    console.log(`   무작위 혼합 ${OPS.toLocaleString()}연산: ${(t1 - t0).toFixed(1)} ms (최종 size=${dq.size()})`);
  }

  // (b) 큐 패턴 (pushBack 50만 → popFront 50만)
  {
    const dq = new Deque<number>();
    const half = OPS / 2;
    const t0 = performance.now();
    for (let i = 0; i < half; i++) dq.pushBack(i);
    for (let i = 0; i < half; i++) dq.popFront();
    const t1 = performance.now();
    console.log(`   큐 패턴     ${OPS.toLocaleString()}연산: ${(t1 - t0).toFixed(1)} ms`);
  }

  // (c) 교대 패턴 (pushBack 50만 → popFront/popBack 교대 50만)
  {
    const dq = new Deque<number>();
    const half = OPS / 2;
    const t0 = performance.now();
    for (let i = 0; i < half; i++) dq.pushBack(i);
    for (let i = 0; i < half; i++) (i % 2 === 0 ? dq.popFront() : dq.popBack());
    const t1 = performance.now();
    console.log(`   교대 패턴   ${OPS.toLocaleString()}연산: ${(t1 - t0).toFixed(1)} ms`);
  }

  // (d) 재조정 1회당 실제 임시 배열 할당 수를 세어 본다 (GC 부담 근거)
  {
    const dq = new Deque<number>();
    for (let i = 0; i < 100_000; i++) dq.pushBack(i);
    resetMoves();
    dq.popFront(); // 재조정 1회
    console.log(`   재조정 1회(원소 100,000개)에서 복사된 원소 수: ${moves.toLocaleString()}`);
    console.log(`   그 한 번에 만들어지는 임시 배열: [...front] / reverse() / concat() / slice() ×2 / reverse() → O(m) 배열 여러 개`);
  }
}
