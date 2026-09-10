/**
 * `purpose.alt`(경쟁 설계와의 대조)가 쓰는 실측 하네스 — L13·L20.
 *
 * 견주는 상대는 **매번 선택 알고리즘으로 가운데 자리를 고르는 설계**다. 추가는 배열 끝에
 * 칸 하나를 쓰는 것으로 끝나고, 물어볼 때 그 자리 하나만 골라 낸다. 이 가이드의 절차와
 * 반대 방향의 선택이라 **물어보는 횟수**로 우열이 갈린다.
 *
 * **계수는 둘 다 같은 자로 잰다** — 값 견주기와 배열 칸 쓰기의 합이다. 벽시계는 쓰지 않는다.
 *
 * ```bash
 * bun run tools/bench-alt.ts src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.alt.ts
 * ```
 *
 * `proof.ts` 가 여기서 `CountedMedianFinder` 를 가져다 쓴다 — 계수를 세는 자리가 두 벌이면
 * 두 벌이 갈린다.
 */

/** 두 설계가 함께 쓰는 자. 값 견주기와 배열 칸 쓰기만 센다. */
export interface Counts {
  compares: number;
  writes: number;
}

export const total = (c: Counts): number => c.compares + c.writes;

/* ────────────────────────── 같은 입력 ────────────────────────── */

/**
 * 전개가 쓰는 입력(수 다섯)은 계수가 갈릴 만큼 길지 않아 여기서는 생성식으로 늘린다.
 * 시드도 난수도 없다 — `i` 하나가 값을 정한다.
 */
export const STREAM_LEN = 4096;

/**
 * `i` 번째로 들어오는 수. 값 범위는 문제의 제약 `-10^9 … 10^9` 안이다.
 *
 * 생성식은 앞의 상태에서 다음 상태를 만드는 꼴이다 — `s ← (s × 1,103,515,245 + 12,345) mod 2^32`
 * 로 두고 `s mod 2,000,000,001 − 10^9` 를 값으로 쓴다. 시작 상태는 `1` 이다.
 *
 * **`i` 에 상수를 곱하는 꼴로 만들면 안 된다.** 처음에 `i × 999,983` 으로 적었더니 `i` 가
 * 2,001 보다 작은 동안 나머지 연산이 한 번도 넘치지 않아 수열이 통째로 오름차순이 됐고,
 * 그러면 「끼워 넣기」의 칸 이동이 0 이 되어 아무것도 재지 못한다(실측).
 */
const STREAM_CACHE: number[] = [];
let streamState = 1;

export function streamValue(i: number): number {
  while (STREAM_CACHE.length <= i) {
    streamState = (Math.imul(streamState, 1_103_515_245) + 12_345) >>> 0;
    STREAM_CACHE.push((streamState % 2_000_000_001) - 1_000_000_000);
  }
  return STREAM_CACHE[i] as number;
}

/**
 * `q` 번 물어보는 작업 목록. 물어보는 자리를 앞뒤로 몰지 않고 고르게 나눈다 —
 * `t` 번째 질의는 수를 `ceil(STREAM_LEN · t / q)` 개 넣은 직후다.
 */
export function askAfter(q: number): Set<number> {
  const out = new Set<number>();
  for (let t = 1; t <= q; t++) {
    out.add(Math.ceil((STREAM_LEN * t) / q) - 1);
  }
  return out;
}

/* ─────────────────── 설계 A — 이 가이드의 두 힙 ─────────────────── */

/** `.ref.ts` 의 `Heap` 에 계수만 덧붙인 사본. 절차는 글자 그대로 같다. */
export class CountedHeap {
  private items: number[] = [];
  /** 이 힙에 넣은 횟수. `perf.derive` 가 걸음마다의 차이를 본다. */
  pushes = 0;
  /** 이 힙에서 꺼낸 횟수. */
  pops = 0;

  constructor(
    private readonly sign: number,
    private readonly c: Counts,
  ) {}

  size(): number {
    return this.items.length;
  }

  peek(): number {
    return this.items[0] as number;
  }

  /** 힙 배열을 그대로 본다 — 전개 표가 배열 순서를 그리는 데 쓴다. */
  snapshot(): number[] {
    return [...this.items];
  }

  push(value: number): void {
    this.pushes++;
    this.items.push(value);
    this.c.writes++;
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.prior(i, parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number {
    this.pops++;
    const top = this.items[0] as number;
    const last = this.items.pop() as number;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.c.writes++;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let best = i;
        if (left < this.items.length && this.prior(left, best)) best = left;
        if (right < this.items.length && this.prior(right, best)) best = right;
        if (best === i) break;
        this.swap(i, best);
        i = best;
      }
    }
    return top;
  }

  private prior(a: number, b: number): boolean {
    this.c.compares++;
    return (
      this.sign * ((this.items[a] as number) - (this.items[b] as number)) < 0
    );
  }

  private swap(a: number, b: number): void {
    const t = this.items[a] as number;
    this.items[a] = this.items[b] as number;
    this.items[b] = t;
    this.c.writes += 2;
  }
}

/**
 * 계수를 세는 두 힙 설계. 절차는 `.ref.ts` 의 `MedianFinder` 와 글자 그대로 같고, 힙만
 * 계수를 세는 사본으로 바꿔 끼웠다.
 */
export class CountedMedianFinder {
  readonly low: CountedHeap;
  readonly high: CountedHeap;

  constructor(readonly c: Counts) {
    this.low = new CountedHeap(-1, c);
    this.high = new CountedHeap(1, c);
  }

  addNum(num: number): void {
    this.low.push(num);
    this.high.push(this.low.pop());
    if (this.high.size() > this.low.size()) {
      this.low.push(this.high.pop());
    }
  }

  findMedian(): number {
    if (this.low.size() === this.high.size()) {
      return (this.low.peek() + this.high.peek()) / 2;
    }
    return this.low.peek();
  }

  size(): number {
    return this.low.size() + this.high.size();
  }
}

/* ────────────── 설계 B — 매번 선택 알고리즘으로 고른다 ────────────── */

/**
 * 기준값을 **구간 가운데 자리**에서 고르는 결정론적 분할. 난수를 쓰지 않으므로 같은 입력에서
 * 늘 같은 계수가 나온다.
 */
function partition(
  a: number[],
  lo: number,
  hi: number,
  c: Counts,
): [number, number] {
  const pivot = a[(lo + hi) >> 1] as number;
  let i = lo;
  let j = hi;
  while (i <= j) {
    for (;;) {
      c.compares++;
      if (!((a[i] as number) < pivot)) break;
      i++;
    }
    for (;;) {
      c.compares++;
      if (!((a[j] as number) > pivot)) break;
      j--;
    }
    if (i <= j) {
      const t = a[i] as number;
      a[i] = a[j] as number;
      a[j] = t;
      c.writes += 2;
      i++;
      j--;
    }
  }
  return [i, j];
}

/** `k` 번째로 작은 값을 자리째 골라 낸다. 배열은 뒤섞이지만 담긴 수의 모임은 그대로다. */
function select(a: number[], k: number, c: Counts): number {
  let lo = 0;
  let hi = a.length - 1;
  for (;;) {
    if (lo >= hi) return a[lo] as number;
    const [i, j] = partition(a, lo, hi, c);
    if (k <= j) hi = j;
    else if (k >= i) lo = i;
    else return a[k] as number;
  }
}

/** 추가는 칸 하나를 쓰고 끝내고, 물어볼 때 가운데 자리를 골라 낸다. */
export class SelectMedian {
  private readonly a: number[] = [];

  constructor(private readonly c: Counts) {}

  addNum(num: number): void {
    this.a.push(num);
    this.c.writes++;
  }

  findMedian(): number {
    const n = this.a.length;
    const k = (n - 1) >> 1;
    const lower = select(this.a, k, this.c);
    if (n % 2 === 1) return lower;
    let upper = this.a[k + 1] as number;
    for (let t = k + 2; t < n; t++) {
      this.c.compares++;
      if ((this.a[t] as number) < upper) upper = this.a[t] as number;
    }
    return (lower + upper) / 2;
  }
}

/* ────────────────────────── 작업 목록 ────────────────────────── */

export function runHeaps(q: number): Counts {
  const c: Counts = { compares: 0, writes: 0 };
  const mf = new CountedMedianFinder(c);
  const ask = askAfter(q);
  for (let i = 0; i < STREAM_LEN; i++) {
    mf.addNum(streamValue(i));
    if (ask.has(i)) mf.findMedian();
  }
  return c;
}

export function runSelect(q: number): Counts {
  const c: Counts = { compares: 0, writes: 0 };
  const sm = new SelectMedian(c);
  const ask = askAfter(q);
  for (let i = 0; i < STREAM_LEN; i++) {
    sm.addNum(streamValue(i));
    if (ask.has(i)) sm.findMedian();
  }
  return c;
}

/** 스윕 범위. 이 안에서 처음 뒤집히는 자리와 마지막으로 골라내기가 적은 자리를 함께 낸다. */
const SWEEP = 300;

/**
 * 골라내기 쪽의 계수는 **질의가 어느 자리에 놓이느냐**에 따라 오르내린다 — 늦게 물어볼수록
 * 그때의 배열이 길다. 그래서 「처음 뒤집히는 자리」와 「마지막으로 골라내기가 적은 자리」를 갈라
 * 낸다. 하나만 적으면 그 뒤에 한 번 더 뒤집히는 것이 감춰진다.
 */
export function flipFirst(): number {
  for (let q = 0; q <= SWEEP; q++) {
    if (total(runHeaps(q)) < total(runSelect(q))) return q;
  }
  return -1;
}

export function flipLast(): number {
  let last = -1;
  for (let q = 0; q <= SWEEP; q++) {
    if (total(runSelect(q)) <= total(runHeaps(q))) last = q;
  }
  return last;
}

export const cases = {
  "이 가이드의 절차 · 질의 횟수와 무관한 기본 연산": () => ({
    기본_연산: total(runHeaps(0)),
  }),
  "매번 골라내기 · 질의 0 회": () => ({ 기본_연산: total(runSelect(0)) }),
  "매번 골라내기 · 질의 16 회": () => ({ 기본_연산: total(runSelect(16)) }),
  "매번 골라내기 · 질의 71 회": () => ({ 기본_연산: total(runSelect(71)) }),
  "매번 골라내기 · 질의 72 회": () => ({ 기본_연산: total(runSelect(72)) }),
  "매번 골라내기 · 질의 4096 회": () => ({
    기본_연산: total(runSelect(STREAM_LEN)),
  }),
  "이 가이드의 절차 · 저장 칸": () => ({ 칸: STREAM_LEN }),
  "매번 골라내기 · 저장 칸": () => ({ 칸: STREAM_LEN }),
  "경계 · 처음 뒤집히는 질의 횟수": () => ({ 회: flipFirst() }),
  "경계 · 골라내기가 마지막으로 적은 질의 횟수": () => ({ 회: flipLast() }),
};
