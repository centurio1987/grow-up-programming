/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts bentleyOttmann-guide.alt.ts
 *
 * **경쟁 설계는 「격자 나누기」다.** 같은 목표(교차하는 선분 쌍의 수를 정확히 내는 것)를
 * 노리되 사건도 순서도 쓰지 않는다. 좌표 상자를 한 변이 같은 칸으로 잘라 두고, 선분마다
 * 자기 좌표 상자가 걸치는 칸에 이름을 적어 둔 다음, 같은 칸에 이름이 함께 적힌 짝만 방향
 * 판정으로 확인한다. 교차하는 두 선분은 교점이 든 칸에 둘 다 이름이 적히므로 이 절차도
 * 정확하다. 칸의 한 변은 `⌈√n⌉` 등분으로 정해 매개변수를 남기지 않는다.
 *
 * 두 설계는 **어떤 입력에서도 같은 답**을 낸다. `measure()` 가 매 실행마다 정본과 대조하고,
 * 다르면 던진다 — 답이 다른 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다.
 *
 * **계수 셋을 센다.**
 *
 *   정수 곱셈  판정에 쓰는 정수 곱셈의 횟수. 방향 판정 2 · 자리 대소 2~4 · 위아래 판정 4 ·
 *              기울기 대소 2 · 교차 자리 계산 6(자리를 만들면 4 를 더한다)
 *   자료 접근  배열·사전·집합의 읽기와 쓰기를 각각 1 로 센 것
 *   잡는 칸    절차가 입력 밖에 새로 잡는 칸의 총수
 *
 * **벽시계는 재지 않는다** — 실행마다 값이 달라 「일치」를 정의할 수 없다.
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 가족 둘을 고정하고 각각 매개변수 하나만 바꾼다 —
 * 격자무늬 가족은 선분 수 `n`, 흩어 놓은 가족은 선분 길이다. 전개 입력(선분 다섯)은 계수가
 * 세 자리라 순서가 뒤집히는 자리가 안 나오므로 표의 첫 줄로 함께 싣는다.
 */
import {
  bentleyOttmann,
  type Point,
  type Segment,
} from "./bentleyOttmann-guide.ref.ts";

/** `deep.walk` 가 쓰는 전개 입력. */
const WALK_SEGMENTS: Segment[] = [
  [
    [0, 0],
    [8, 8],
  ],
  [
    [0, 6],
    [6, 0],
  ],
  [
    [2, 1],
    [2, 5],
  ],
  [
    [0, 8],
    [8, 4],
  ],
  [
    [9, 0],
    [11, 2],
  ],
];

/** 두 가족이 함께 쓰는 좌표 상자의 한 변. */
const SPAN = 4096;

/** 흩어 놓은 가족의 선분 수와 난수 씨앗. */
const SCATTER_N = 512;
const SCATTER_SEED = 20_260_907;

/** 격자무늬 가족에서 곱셈의 순서가 처음 뒤집히는 선분 수. `flipMesh()` 가 그 자리인지 본다. */
const FLIP_N = 80;

interface Counted {
  /** 판정에 쓰는 정수 곱셈의 횟수. */
  mul: number;
  /** 배열·사전·집합의 읽기와 쓰기. */
  reads: number;
  /** 입력 밖에 새로 잡는 칸의 총수. */
  cells: number;
}

/* ─────────────── 두 설계가 함께 쓰는 정수 원시 ─────────────── */

/** 점 `o` 에서 `a`, `b` 로 갈 때의 방향. 부호만 쓴다. */
function sideOf(o: Point, a: Point, b: Point, c: Counted): number {
  c.mul += 2;
  const v =
    BigInt(a[0] - o[0]) * BigInt(b[1] - o[1]) -
    BigInt(a[1] - o[1]) * BigInt(b[0] - o[0]);
  return v > 0n ? 1 : v < 0n ? -1 : 0;
}

function inBox(a: Point, b: Point, p: Point, c: Counted): boolean {
  c.reads += 4;
  return (
    Math.min(a[0], b[0]) <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= p[1] &&
    p[1] <= Math.max(a[1], b[1])
  );
}

/** 두 선분이 점 하나라도 공유하는가. `segmentsIntersect` 편이 세운 판정과 같다. */
function meets(s1: Segment, s2: Segment, c: Counted): boolean {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const d1 = sideOf(p3, p4, p1, c);
  const d2 = sideOf(p3, p4, p2, c);
  const d3 = sideOf(p1, p2, p3, c);
  const d4 = sideOf(p1, p2, p4, c);
  if (d1 !== 0 && d2 !== 0 && d1 !== d2 && d3 !== 0 && d4 !== 0 && d3 !== d4) {
    return true;
  }
  return (
    (d1 === 0 && inBox(p3, p4, p1, c)) ||
    (d2 === 0 && inBox(p3, p4, p2, c)) ||
    (d3 === 0 && inBox(p1, p2, p3, c)) ||
    (d4 === 0 && inBox(p1, p2, p4, c))
  );
}

/* ─────────────── 설계 둘 — 격자 나누기 ─────────────── */

/** 좌표 상자를 `⌈√n⌉` 등분한 칸에 선분 이름을 적고, 같은 칸의 짝만 확인한다. */
function byGrid(segs: Segment[], c: Counted): number {
  const n = segs.length;
  if (n < 2) return 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [a, b] of segs) {
    c.reads += 4;
    minX = Math.min(minX, a[0], b[0]);
    maxX = Math.max(maxX, a[0], b[0]);
    minY = Math.min(minY, a[1], b[1]);
    maxY = Math.max(maxY, a[1], b[1]);
  }
  const side = Math.max(1, Math.ceil(Math.sqrt(n)));
  const stepX = Math.max(1, Math.ceil((maxX - minX + 1) / side));
  const stepY = Math.max(1, Math.ceil((maxY - minY + 1) / side));
  const cellOf = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const [a, b] = segs[i] as Segment;
    c.reads += 4;
    const x0 = Math.floor((Math.min(a[0], b[0]) - minX) / stepX);
    const x1 = Math.floor((Math.max(a[0], b[0]) - minX) / stepX);
    const y0 = Math.floor((Math.min(a[1], b[1]) - minY) / stepY);
    const y1 = Math.floor((Math.max(a[1], b[1]) - minY) / stepY);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const at = x * 1_000_003 + y;
        const got = cellOf.get(at);
        c.reads += 2;
        c.cells += 1;
        if (got === undefined) cellOf.set(at, [i]);
        else got.push(i);
      }
    }
  }
  const seen = new Set<number>();
  let pairs = 0;
  for (const bucket of cellOf.values()) {
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        const a = bucket[i] as number;
        const b = bucket[j] as number;
        const at = a < b ? a * n + b : b * n + a;
        c.reads += 3;
        if (seen.has(at)) continue;
        seen.add(at);
        c.cells += 1;
        if (meets(segs[a] as Segment, segs[b] as Segment, c)) pairs++;
      }
    }
  }
  return pairs;
}

/* ─────────────── 설계 하나 — 이 가이드의 스위프 ─────────────── */

interface Spot {
  x: bigint;
  y: bigint;
  d: bigint;
}

interface Seg {
  id: number;
  lox: bigint;
  loy: bigint;
  hix: bigint;
  hiy: bigint;
  dx: bigint;
  dy: bigint;
  vertical: boolean;
}

function sign(v: bigint): number {
  return v > 0n ? 1 : v < 0n ? -1 : 0;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function reduced(x: bigint, y: bigint, d: bigint): Spot {
  const g = gcd(gcd(x, y), d);
  return g > 1n ? { x: x / g, y: y / g, d: d / g } : { x, y, d };
}

function cmpSpot(a: Spot, b: Spot, c: Counted): number {
  c.mul += 2;
  const dx = a.x * b.d - b.x * a.d;
  if (dx !== 0n) return sign(dx);
  c.mul += 2;
  return sign(a.y * b.d - b.y * a.d);
}

function spotKey(p: Spot): string {
  return `${p.x}/${p.y}/${p.d}`;
}

function orient(s: Seg, p: Spot, c: Counted): number {
  c.mul += 4;
  return sign(s.dx * (p.y - s.loy * p.d) - s.dy * (p.x - s.lox * p.d));
}

function slopeOrder(a: Seg, b: Seg, c: Counted): number {
  c.mul += 2;
  return sign(a.dy * b.dx - b.dy * a.dx);
}

function toSeg(raw: Segment, id: number): Seg {
  const [a, b] = raw;
  const front = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);
  const lo = front ? a : b;
  const hi = front ? b : a;
  const lox = BigInt(lo[0]);
  const loy = BigInt(lo[1]);
  const hix = BigInt(hi[0]);
  const hiy = BigInt(hi[1]);
  return {
    id,
    lox,
    loy,
    hix,
    hiy,
    dx: hix - lox,
    dy: hiy - loy,
    vertical: lo[0] === hi[0],
  };
}

function crossingSpot(a: Seg, b: Seg, c: Counted): Spot | null {
  c.mul += 6;
  let den = a.dx * b.dy - a.dy * b.dx;
  if (den === 0n) return null;
  const wx = b.lox - a.lox;
  const wy = b.loy - a.loy;
  let tn = wx * b.dy - wy * b.dx;
  let un = wx * a.dy - wy * a.dx;
  if (den < 0n) {
    den = -den;
    tn = -tn;
    un = -un;
  }
  if (tn < 0n || tn > den || un < 0n || un > den) return null;
  c.mul += 4;
  return reduced(a.lox * den + tn * a.dx, a.loy * den + tn * a.dy, den);
}

function heapPush(heap: Spot[], p: Spot, c: Counted): void {
  heap.push(p);
  c.cells += 1;
  let at = heap.length - 1;
  while (at > 0) {
    const parent = (at - 1) >> 1;
    c.reads += 2;
    if (cmpSpot(heap[at] as Spot, heap[parent] as Spot, c) >= 0) break;
    const keep = heap[at] as Spot;
    heap[at] = heap[parent] as Spot;
    heap[parent] = keep;
    c.reads += 2;
    at = parent;
  }
}

function heapPop(heap: Spot[], c: Counted): Spot {
  const top = heap[0] as Spot;
  const last = heap.pop() as Spot;
  c.reads += 2;
  if (heap.length > 0) {
    heap[0] = last;
    let at = 0;
    for (;;) {
      const left = at * 2 + 1;
      const right = left + 1;
      let small = at;
      c.reads += 2;
      if (
        left < heap.length &&
        cmpSpot(heap[left] as Spot, heap[small] as Spot, c) < 0
      ) {
        small = left;
      }
      if (
        right < heap.length &&
        cmpSpot(heap[right] as Spot, heap[small] as Spot, c) < 0
      ) {
        small = right;
      }
      if (small === at) break;
      const keep = heap[at] as Spot;
      heap[at] = heap[small] as Spot;
      heap[small] = keep;
      c.reads += 2;
      at = small;
    }
  }
  return top;
}

/** 이 가이드가 가르치는 설계. 정본과 같은 절차에 세는 자리만 덧붙였다. */
function bySweep(segments: Segment[], c: Counted): number {
  const n = segments.length;
  if (n < 2) return 0;
  const segs = segments.map(toSeg);
  c.cells += n;
  const events: Spot[] = [];
  const startAt = new Map<string, number[]>();
  const endAt = new Map<string, number[]>();
  const uprightLow = new Map<string, number[]>();
  const uprightHigh = new Map<string, number[]>();
  const fileInto = (
    book: Map<string, number[]>,
    at: string,
    id: number,
  ): void => {
    const got = book.get(at);
    c.reads += 1;
    c.cells += 1;
    if (got === undefined) book.set(at, [id]);
    else got.push(id);
  };
  for (const s of segs) {
    const lo: Spot = { x: s.lox, y: s.loy, d: 1n };
    const hi: Spot = { x: s.hix, y: s.hiy, d: 1n };
    heapPush(events, lo, c);
    heapPush(events, hi, c);
    fileInto(s.vertical ? uprightLow : startAt, spotKey(lo), s.id);
    fileInto(s.vertical ? uprightHigh : endAt, spotKey(hi), s.id);
  }

  const status: number[] = [];
  const upright: number[] = [];
  const seen = new Set<number>();
  let pairs = 0;
  const record = (a: number, b: number): void => {
    const at = a < b ? a * n + b : b * n + a;
    c.reads += 1;
    if (seen.has(at)) return;
    seen.add(at);
    c.cells += 1;
    pairs++;
  };
  const firstNotBelow = (p: Spot): number => {
    let lo = 0;
    let hi = status.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      c.reads += 1;
      if (orient(segs[status[mid] as number] as Seg, p, c) > 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const firstAbove = (p: Spot): number => {
    let lo = 0;
    let hi = status.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      c.reads += 1;
      if (orient(segs[status[mid] as number] as Seg, p, c) >= 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const scheduleAt = (now: Spot, left: number, right: number): void => {
    if (left < 0 || right >= status.length) return;
    c.reads += 2;
    const q = crossingSpot(
      segs[status[left] as number] as Seg,
      segs[status[right] as number] as Seg,
      c,
    );
    if (q !== null && cmpSpot(q, now, c) > 0) heapPush(events, q, c);
  };

  while (events.length > 0) {
    const now = heapPop(events, c);
    while (events.length > 0 && cmpSpot(events[0] as Spot, now, c) === 0) {
      heapPop(events, c);
    }
    const here = spotKey(now);

    for (const id of uprightLow.get(here) ?? []) {
      const v = segs[id] as Seg;
      for (const other of upright) record(id, other);
      const top: Spot = { x: v.hix, y: v.hiy, d: 1n };
      const to = firstAbove(top);
      for (let at = firstNotBelow(now); at < to; at++) {
        c.reads += 1;
        record(id, status[at] as number);
      }
      upright.push(id);
      c.cells += 1;
    }

    const from = firstNotBelow(now);
    const through = status.slice(from, firstAbove(now));
    c.reads += through.length;
    c.cells += through.length;
    const starting = startAt.get(here) ?? [];
    c.reads += 1;
    const meeting = [...through, ...starting];
    c.cells += meeting.length;
    for (let i = 0; i < meeting.length; i++) {
      const one = meeting[i] as number;
      for (let j = i + 1; j < meeting.length; j++) {
        record(one, meeting[j] as number);
      }
      for (const v of upright) record(one, v);
    }

    const ending = new Set(endAt.get(here) ?? []);
    c.reads += 1;
    const after = [
      ...through.filter((id) => !ending.has(id)),
      ...starting,
    ].sort((x, y) => slopeOrder(segs[x] as Seg, segs[y] as Seg, c) || x - y);
    c.cells += after.length;
    status.splice(from, through.length, ...after);
    c.reads += Math.max(0, status.length - from);

    for (const id of uprightHigh.get(here) ?? []) {
      const at = upright.indexOf(id);
      c.reads += upright.length;
      if (at >= 0) upright.splice(at, 1);
    }

    scheduleAt(now, from - 1, from);
    scheduleAt(now, from + after.length - 1, from + after.length);
  }

  return pairs;
}

/* ─────────────── 입력 가족 ─────────────── */

/** 32 비트 xorshift. 실행마다 같은 값이 나온다. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s;
  };
}

/**
 * 흩어 놓은 가족 — 길이 `len` 인 선분 `n` 개를 한 변 `SPAN` 인 상자 안에 놓는다.
 * 방향은 넷(오른쪽 위 · 왼쪽 위 · 가로 · 세로) 중 하나이고, 길이만 매개변수다.
 */
function scattered(n: number, len: number): Segment[] {
  const next = rng(SCATTER_SEED);
  const out: Segment[] = [];
  for (let i = 0; i < n; i++) {
    const ax = next() % SPAN;
    const ay = next() % SPAN;
    const dir = next() % 4;
    const dx = dir === 0 ? len : dir === 1 ? -len : dir === 2 ? len : 0;
    const dy = dir === 3 ? len : dir === 2 ? 0 : len;
    out.push([[ax, ay] as Point, [ax + dx, ay + dy] as Point]);
  }
  return out;
}

/**
 * 격자무늬 가족 — 상자를 가로지르는 긴 가로 선분 `n/2` 개와 긴 세로 선분 `n/2` 개.
 * 교차 쌍이 `(n/2)²` 로 정해져 있어 `n` 하나가 교차 수를 정한다.
 */
function mesh(n: number): Segment[] {
  const out: Segment[] = [];
  const half = n >> 1;
  for (let i = 0; i < half; i++) {
    const at = ((i * SPAN) / half) | 0;
    out.push([[0, at] as Point, [SPAN, at] as Point]);
  }
  for (let i = 0; i < n - half; i++) {
    const at = ((i * SPAN) / half) | 0;
    out.push([[at, 0] as Point, [at, SPAN] as Point]);
  }
  return out;
}

/* ─────────────── 계측 ─────────────── */

/** 두 설계가 **정본과 같은 답**을 내는지 매번 확인한다. */
function measure(segs: Segment[]): { mine: Counted; theirs: Counted } {
  const mine: Counted = { mul: 0, reads: 0, cells: 0 };
  const theirs: Counted = { mul: 0, reads: 0, cells: 0 };
  const want = bentleyOttmann(segs);
  if (bySweep(segs, mine) !== want) {
    throw new Error("스위프 계수용 절차가 정본과 다른 답을 냈다");
  }
  if (byGrid(segs, theirs) !== want) {
    throw new Error("격자 나누기가 정본과 다른 답을 냈다");
  }
  return { mine, theirs };
}

/** 격자무늬 가족에서 정수 곱셈의 순서가 처음 뒤집히는 선분 수. 짝수만 본다. */
function flipMesh(): number {
  for (let n = 64; n <= 128; n += 2) {
    const { mine, theirs } = measure(mesh(n));
    if (mine.mul < theirs.mul) return n;
  }
  throw new Error("격자무늬 가족에서 곱셈의 순서가 안 뒤집혔다");
}

if (flipMesh() !== FLIP_N) {
  throw new Error(
    `곱셈이 뒤집히는 선분 수가 ${flipMesh()} 이다 — 상수와 어긋난다`,
  );
}

const WALK = measure(WALK_SEGMENTS);
const MESH_IN = measure(mesh(FLIP_N - 2));
const MESH_OUT = measure(mesh(FLIP_N));
const MESH_FAR = measure(mesh(256));
const SHORT = measure(scattered(SCATTER_N, 16));
const LONG = measure(scattered(SCATTER_N, 2048));

export const cases = {
  스위프: () => ({
    "전개 입력 정수 곱셈": WALK.mine.mul,
    "전개 입력 자료 접근": WALK.mine.reads,
    "격자무늬 78 정수 곱셈": MESH_IN.mine.mul,
    "격자무늬 80 정수 곱셈": MESH_OUT.mine.mul,
    "격자무늬 256 정수 곱셈": MESH_FAR.mine.mul,
    "격자무늬 256 자료 접근": MESH_FAR.mine.reads,
    "격자무늬 256 잡는 칸": MESH_FAR.mine.cells,
    "흩어 놓은 길이 16 정수 곱셈": SHORT.mine.mul,
    "흩어 놓은 길이 16 잡는 칸": SHORT.mine.cells,
    "흩어 놓은 길이 2048 자료 접근": LONG.mine.reads,
  }),
  "격자 나누기": () => ({
    "전개 입력 정수 곱셈": WALK.theirs.mul,
    "전개 입력 자료 접근": WALK.theirs.reads,
    "격자무늬 78 정수 곱셈": MESH_IN.theirs.mul,
    "격자무늬 80 정수 곱셈": MESH_OUT.theirs.mul,
    "격자무늬 256 정수 곱셈": MESH_FAR.theirs.mul,
    "격자무늬 256 자료 접근": MESH_FAR.theirs.reads,
    "격자무늬 256 잡는 칸": MESH_FAR.theirs.cells,
    "흩어 놓은 길이 16 정수 곱셈": SHORT.theirs.mul,
    "흩어 놓은 길이 16 잡는 칸": SHORT.theirs.cells,
    "흩어 놓은 길이 2048 자료 접근": LONG.theirs.reads,
  }),
};
