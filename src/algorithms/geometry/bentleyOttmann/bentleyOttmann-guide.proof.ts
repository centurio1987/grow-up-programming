/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts bentleyOttmann-guide.md
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { segmentsIntersect } from "../segmentsIntersect/segmentsIntersect-guide.ref.ts";
import {
  bentleyOttmann,
  type Point,
  type Segment,
} from "./bentleyOttmann-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => (n + 0).toLocaleString("en-US");

/**
 * 「…로」와 「…으로」를 값에서 고른다.
 *
 * 마지막 숫자의 우리말 읽기에 받침이 없거나 받침이 `ㄹ` 이면 「로」이고 그 밖은 「으로」다 —
 * 0 영 · 3 삼 · 6 육이 「으로」쪽이다. 손으로 적으면 값이 바뀔 때 조사만 남아 어긋난다.
 */
const ro = (text: string): string => {
  const last = text.replace(/[^0-9]/g, "").slice(-1);
  return "036".includes(last) ? `${text} 으로` : `${text} 로`;
};

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 못 본다.
 */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const cols = head.length;
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/** 선분 하나의 표기. 본문과 글자 그대로 같다. */
const seg = (s: Segment): string =>
  `(${s[0][0]},${s[0][1]})-(${s[1][0]},${s[1][1]})`;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력 — 선분 다섯.
 *
 * 갈래 다섯을 한 입력으로 전부 실행한다. 끝점 사건 열 개에 교차 사건 두 개가 붙고, 그중
 * 하나는 좌표가 분수다. 세로 선분 하나가 있고, 마지막 하나는 x 구간이 겹치지 않아 앞의
 * 넷과 한 번도 견주지 않는다.
 */
const WALK: Segment[] = [
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

/** 가로 둘과 세로 둘. 세로 선분의 y 범위를 잘못 잡으면 답이 0 이 된다. */
const LATTICE: Segment[] = [
  [
    [0, 1],
    [10, 1],
  ],
  [
    [0, 3],
    [10, 3],
  ],
  [
    [2, 0],
    [2, 5],
  ],
  [
    [5, 0],
    [5, 5],
  ],
];

/** 한 선분의 안쪽에서 다른 선분이 시작한다. T 자로 닿는 배치. */
const TEE: Segment[] = [
  [
    [0, 0],
    [4, 0],
  ],
  [
    [2, 0],
    [4, 2],
  ],
];

/** 한 선분이 끝나는 자리에서 다른 선분이 시작한다. */
const CHAIN: Segment[] = [
  [
    [0, 0],
    [2, 0],
  ],
  [
    [2, 0],
    [4, 2],
  ],
];

/** 같은 직선 위에서 구간을 공유한다. */
const OVERLAP: Segment[] = [
  [
    [0, 0],
    [4, 0],
  ],
  [
    [2, 0],
    [6, 0],
  ],
];

/** 세 선분이 한 점 (2,2) 에서 만난다. 쌍으로는 셋이다. */
const TRIPLE: Segment[] = [
  [
    [0, 0],
    [4, 4],
  ],
  [
    [0, 4],
    [4, 0],
  ],
  [
    [2, 0],
    [2, 4],
  ],
];

/** 서로 만나지 않는 평행 선분 셋. */
const PARALLEL: Segment[] = [
  [
    [0, 0],
    [10, 0],
  ],
  [
    [0, 2],
    [10, 2],
  ],
  [
    [0, 4],
    [10, 4],
  ],
];

/**
 * 교차 자리에서 순서를 기울기로 안 세우면 답이 갈리는 배치.
 *
 * 첫 선분과 둘째 선분이 (3,2) 에서 만나 위아래가 뒤집히고, 그 뒤에 아래로 내려온 둘째
 * 선분이 셋째 선분과 새 이웃이 된다.
 */
const SLOPE_FLIP: Segment[] = [
  [
    [0, 0],
    [6, 4],
  ],
  [
    [0, 4],
    [6, 0],
  ],
  [
    [0, -2],
    [6, 1],
  ],
];

/** 셋이 서로 다 교차한다. 오른쪽 이웃을 예약하지 않으면 하나를 놓친다. */
const TANGLE: Segment[] = [
  [
    [0, 3],
    [6, 4],
  ],
  [
    [0, 4],
    [4, 3],
  ],
  [
    [2, 4],
    [6, 1],
  ],
];

/** 큰 좌표에서 X 자로 만나는 두 선분. */
const HUGE: Segment[] = [
  [
    [-1_000_000_000, -1_000_000_000],
    [1_000_000_000, 1_000_000_000],
  ],
  [
    [-1_000_000_000, 1_000_000_000],
    [1_000_000_000, -1_000_000_000],
  ],
];

/** 좌표의 절댓값 상한과 선분 수 상한. 문제의 제약이다. */
const MAX_C = 1_000_000_000;
const MAX_N = 100_000;

/** 두 가족이 함께 쓰는 좌표 상자의 한 변. */
const SPAN = 4096;

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

/** 상자를 가로지르는 긴 가로 선분 `n/2` 개와 세로 선분 `n/2` 개. 교차가 `(n/2)²` 이다. */
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

/** 길이 `len` 인 선분 `n` 개를 상자 안에 흩어 놓는다. */
function scattered(n: number, len: number): Segment[] {
  const next = rng(20_260_907);
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
 * 밀도를 고정한 가족 — 길이 16 인 선분 `n` 개를 한 변이 `64√n` 인 상자에 놓는다.
 * 넓이가 선분 수에 비례하므로 선분을 늘려도 한 선분이 만나는 이웃의 수가 안 변한다.
 */
function sparse(n: number): Segment[] {
  const side = Math.round(64 * Math.sqrt(n));
  const next = rng(20_260_907);
  const out: Segment[] = [];
  for (let i = 0; i < n; i++) {
    const ax = next() % side;
    const ay = next() % side;
    const dir = next() % 4;
    const dx = dir === 0 ? 16 : dir === 1 ? -16 : dir === 2 ? 16 : 0;
    const dy = dir === 3 ? 16 : dir === 2 ? 0 : 16;
    out.push([[ax, ay] as Point, [ax + dx, ay + dy] as Point]);
  }
  return out;
}

/** 상자를 가로지르는 가로 선분 `n` 개. y 가 전부 달라 교차가 없다. */
function flat(n: number): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < n; i++) {
    out.push([[0, i] as Point, [SPAN, i] as Point]);
  }
  return out;
}

/**
 * 좌표 상한을 꽉 채운 무작위 배치. 교차 자리의 분자·분모가 얼마나 커지는지 재는 데 쓴다.
 */
function bigCoordinate(): Segment[] {
  const next = rng(20_260_907);
  const out: Segment[] = [];
  const span = 2 * MAX_C;
  for (let i = 0; i < 24; i++) {
    const ax = (next() % span) - MAX_C;
    const ay = (next() % span) - MAX_C;
    const bx = (next() % span) - MAX_C;
    const by = (next() % span) - MAX_C;
    out.push([[ax, ay] as Point, [bx === ax ? bx + 1 : bx, by] as Point]);
  }
  return out;
}

/** 한 점 `(0,0)` 에서 갈라지는 선분 `m` 개. 모든 짝이 그 한 점에서 만난다. */
function star(m: number): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < m; i++) {
    out.push([[-(i + 1), -(m - i)] as Point, [i + 1, m - i] as Point]);
  }
  return out;
}

/** 같은 직선 위에 겹쳐 놓은 선분 `m` 개. 모든 짝이 구간을 공유한다. */
function stack(m: number): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < m; i++) {
    out.push([[i, i] as Point, [i + m, i + m] as Point]);
  }
  return out;
}

/* ────────────────────────── 계측 ────────────────────────── */

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

interface Counted {
  /** 선분 짝 하나를 들여다본 횟수 — 교차 자리 계산과 짝 기록을 합친 것. */
  pair: number;
  /** 처리한 사건 자리의 수. */
  spot: number;
  /** 사건 큐가 가장 컸을 때의 크기. */
  queue: number;
  /** 상태 배열이 가장 컸을 때의 크기. */
  status: number;
  /** 교차 자리로 큐에 들어간 사건의 수. */
  booked: number;
  /** 답 — 교차하는 선분 쌍의 수. */
  pairs: number;
  /** 한 번이라도 들여다본 선분 짝의 열쇠. */
  looked: Set<number>;
  /** 교차 자리의 분자·분모 가운데 가장 컸던 절댓값. */
  bigNum: bigint;
  bigDen: bigint;
  /** 상태 배열이 y 오름차순이 아니었던 걸음의 수. */
  broken: number;
}

/** 한 걸음의 기록. `walk` 계열 블록이 이것을 읽는다. */
interface Step {
  at: string;
  kind: string;
  through: string;
  status: string;
  upright: string;
  booked: string;
  pairs: number;
  sorted: boolean;
}

const sign = (v: bigint): number => (v > 0n ? 1 : v < 0n ? -1 : 0);

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

function cmpSpot(a: Spot, b: Spot): number {
  const dx = a.x * b.d - b.x * a.d;
  if (dx !== 0n) return sign(dx);
  return sign(a.y * b.d - b.y * a.d);
}

const spotKey = (p: Spot): string => `${p.x}/${p.y}/${p.d}`;

/** 자리를 본문 표기로 적는다. 분모가 1 이면 정수 좌표다. */
const spotText = (p: Spot): string =>
  p.d === 1n ? `(${p.x},${p.y})` : `(${p.x}/${p.d},${p.y}/${p.d})`;

function orient(s: Seg, p: Spot): number {
  return sign(s.dx * (p.y - s.loy * p.d) - s.dy * (p.x - s.lox * p.d));
}

function slopeOrder(a: Seg, b: Seg): number {
  return sign(a.dy * b.dx - b.dy * a.dx);
}

/** 자리 `p` 의 x 에서 두 선분의 y 를 견준다. 같으면 0 이다. */
function yOrderAt(a: Seg, b: Seg, p: Spot): number {
  const na = a.loy * a.dx * p.d + a.dy * (p.x - a.lox * p.d);
  const nb = b.loy * b.dx * p.d + b.dy * (p.x - b.lox * p.d);
  return sign(na * (b.dx * p.d) - nb * (a.dx * p.d));
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

function crossingSpot(a: Seg, b: Seg): Spot | null {
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
  return reduced(a.lox * den + tn * a.dx, a.loy * den + tn * a.dy, den);
}

function heapPush(heap: Spot[], p: Spot): void {
  heap.push(p);
  let at = heap.length - 1;
  while (at > 0) {
    const parent = (at - 1) >> 1;
    if (cmpSpot(heap[at] as Spot, heap[parent] as Spot) >= 0) break;
    const keep = heap[at] as Spot;
    heap[at] = heap[parent] as Spot;
    heap[parent] = keep;
    at = parent;
  }
}

function heapPop(heap: Spot[]): Spot {
  const top = heap[0] as Spot;
  const last = heap.pop() as Spot;
  if (heap.length > 0) {
    heap[0] = last;
    let at = 0;
    for (;;) {
      const left = at * 2 + 1;
      const right = left + 1;
      let small = at;
      if (
        left < heap.length &&
        cmpSpot(heap[left] as Spot, heap[small] as Spot) < 0
      ) {
        small = left;
      }
      if (
        right < heap.length &&
        cmpSpot(heap[right] as Spot, heap[small] as Spot) < 0
      ) {
        small = right;
      }
      if (small === at) break;
      const keep = heap[at] as Spot;
      heap[at] = heap[small] as Spot;
      heap[small] = keep;
      at = small;
    }
  }
  return top;
}

/**
 * 정본과 같은 절차에 세는 자리와 걸음 기록만 덧붙였다.
 *
 * `measure()` 가 매 실행마다 정본과 답을 대조하므로, 이 사본이 정본에서 벗어나면 그 자리에서
 * 던진다.
 */
function walkRun(segments: Segment[], keep: Step[] | null): Counted {
  const c: Counted = {
    pair: 0,
    spot: 0,
    queue: 0,
    status: 0,
    booked: 0,
    pairs: 0,
    looked: new Set<number>(),
    bigNum: 0n,
    bigDen: 0n,
    broken: 0,
  };
  const n = segments.length;
  if (n < 2) return c;
  const segs = segments.map(toSeg);

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
    if (got === undefined) book.set(at, [id]);
    else got.push(id);
  };
  for (const s of segs) {
    const lo: Spot = { x: s.lox, y: s.loy, d: 1n };
    const hi: Spot = { x: s.hix, y: s.hiy, d: 1n };
    heapPush(events, lo);
    heapPush(events, hi);
    fileInto(s.vertical ? uprightLow : startAt, spotKey(lo), s.id);
    fileInto(s.vertical ? uprightHigh : endAt, spotKey(hi), s.id);
  }

  const status: number[] = [];
  const upright: number[] = [];
  const seen = new Set<number>();
  const name = (id: number): string => `s${id}`;
  const list = (ids: number[]): string =>
    ids.length === 0 ? "—" : ids.map(name).join(" ");

  const record = (a: number, b: number): void => {
    c.pair++;
    const key = a < b ? a * n + b : b * n + a;
    c.looked.add(key);
    if (seen.has(key)) return;
    seen.add(key);
    c.pairs++;
  };
  const firstNotBelow = (p: Spot): number => {
    let lo = 0;
    let hi = status.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (orient(segs[status[mid] as number] as Seg, p) > 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const firstAbove = (p: Spot): number => {
    let lo = 0;
    let hi = status.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (orient(segs[status[mid] as number] as Seg, p) >= 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  let bookedHere: string[] = [];
  const scheduleAt = (now: Spot, left: number, right: number): void => {
    if (left < 0 || right >= status.length) return;
    c.pair++;
    const x = status[left] as number;
    const y = status[right] as number;
    c.looked.add(x < y ? x * n + y : y * n + x);
    const q = crossingSpot(segs[x] as Seg, segs[y] as Seg);
    if (q !== null && cmpSpot(q, now) > 0) {
      const abs = (v: bigint): bigint => (v < 0n ? -v : v);
      if (abs(q.x) > c.bigNum) c.bigNum = abs(q.x);
      if (abs(q.y) > c.bigNum) c.bigNum = abs(q.y);
      if (q.d > c.bigDen) c.bigDen = q.d;
      heapPush(events, q);
      c.booked++;
      bookedHere.push(spotText(q));
    }
  };

  while (events.length > 0) {
    c.queue = Math.max(c.queue, events.length);
    const now = heapPop(events);
    while (events.length > 0 && cmpSpot(events[0] as Spot, now) === 0) {
      heapPop(events);
    }
    const here = spotKey(now);
    c.spot++;
    bookedHere = [];
    const kinds: string[] = [];
    const opening = uprightLow.get(here) ?? [];
    const starting = startAt.get(here) ?? [];
    const ended = endAt.get(here) ?? [];
    const closing = uprightHigh.get(here) ?? [];
    if (opening.length > 0) kinds.push(`세로 열기 ${list(opening)}`);
    if (starting.length > 0) kinds.push(`시작 ${list(starting)}`);
    if (ended.length > 0) kinds.push(`끝 ${list(ended)}`);
    if (closing.length > 0) kinds.push(`세로 닫기 ${list(closing)}`);

    for (const id of opening) {
      const v = segs[id] as Seg;
      for (const other of upright) record(id, other);
      const top: Spot = { x: v.hix, y: v.hiy, d: 1n };
      const to = firstAbove(top);
      for (let at = firstNotBelow(now); at < to; at++) {
        record(id, status[at] as number);
      }
      upright.push(id);
    }

    const from = firstNotBelow(now);
    const through = status.slice(from, firstAbove(now));
    const meeting = [...through, ...starting];
    for (let i = 0; i < meeting.length; i++) {
      const one = meeting[i] as number;
      for (let j = i + 1; j < meeting.length; j++) {
        record(one, meeting[j] as number);
      }
      for (const v of upright) record(one, v);
    }

    const ending = new Set(ended);
    const after = [
      ...through.filter((id) => !ending.has(id)),
      ...starting,
    ].sort((x, y) => slopeOrder(segs[x] as Seg, segs[y] as Seg) || x - y);
    status.splice(from, through.length, ...after);
    c.status = Math.max(c.status, status.length);
    let sorted = true;
    for (let at = 1; at < status.length; at++) {
      const one = segs[status[at - 1] as number] as Seg;
      const two = segs[status[at] as number] as Seg;
      if (yOrderAt(one, two, now) > 0) sorted = false;
    }
    for (let at = 1; at < after.length; at++) {
      const one = segs[after[at - 1] as number] as Seg;
      const two = segs[after[at] as number] as Seg;
      if (slopeOrder(one, two) > 0) sorted = false;
    }
    if (!sorted) c.broken++;

    for (const id of closing) {
      const at = upright.indexOf(id);
      if (at >= 0) upright.splice(at, 1);
    }

    scheduleAt(now, from - 1, from);
    scheduleAt(now, from + after.length - 1, from + after.length);

    if (keep !== null) {
      keep.push({
        at: spotText(now),
        kind: kinds.length === 0 ? "교차" : kinds.join(" · "),
        through: list(through),
        status: status.length === 0 ? "(비어 있음)" : list(status),
        upright: list(upright),
        booked: bookedHere.length === 0 ? "—" : bookedHere.join(" "),
        pairs: c.pairs,
        sorted,
      });
    }
  }
  return c;
}

/** 계측본이 정본과 같은 답을 내는지 확인하고 계수를 돌려준다. */
function measure(segments: Segment[], keep: Step[] | null = null): Counted {
  const got = walkRun(segments, keep);
  const want = bentleyOttmann(segments);
  if (got.pairs !== want) {
    throw new Error(`계측본이 정본과 다른 답을 냈다 — ${got.pairs} vs ${want}`);
  }
  return got;
}

/** 전부 대조 — 쌍을 하나도 안 거르고 판정한다. */
function bruteForce(segments: Segment[]): { pair: number; pairs: number } {
  let pair = 0;
  let pairs = 0;
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      pair++;
      if (segmentsIntersect(segments[i] as Segment, segments[j] as Segment)) {
        pairs++;
      }
    }
  }
  return { pair, pairs };
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { bentleyOttmann: (segments: Segment[]) => number };

const REF = new URL("./bentleyOttmann-guide.ref.ts", import.meta.url).pathname;

const TOP_LINE = /^ {6}const to = firstAbove\(top\);$/;
const MEET_LINE = /^ {4}const meeting = \[\.\.\.through, \.\.\.starting\];$/;
const SLOPE_LINE =
  /^ {4}\]\.sort\(\(x, y\) => slopeOrder\(segs\[x\] as Seg, segs\[y\] as Seg\) \|\| x - y\);$/;
const RIGHT_LINE =
  /^ {4}scheduleAt\(now, from \+ after\.length - 1, from \+ after\.length\);$/;

/** 세로 선분의 y 범위 위끝을 사건 자리로 바꾼 사본. 세로 선분이 위쪽을 못 본다. */
const shortUpright = await loadMutant<Impl>(REF, {
  swap: [TOP_LINE, "      const to = firstAbove(now);"],
});

/** 여기서 시작하는 선분을 안 모으는 사본. 끝점에서 닿는 짝이 사라진다. */
const noStarting = await loadMutant<Impl>(REF, {
  swap: [MEET_LINE, "    const meeting = [...through];"],
});

/** 기울기 대신 이름 순으로 세우는 사본. 교차 자리 뒤의 위아래가 안 뒤집힌다. */
const byName = await loadMutant<Impl>(REF, {
  swap: [SLOPE_LINE, "    ].sort((x, y) => x - y);"],
});

/** 오른쪽 이웃을 예약하지 않는 사본. 위쪽에서 새로 생긴 이웃을 놓친다. */
const noRight = await loadMutant<Impl>(REF, { drop: RIGHT_LINE });

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = shortUpright.bentleyOttmann === bentleyOttmann;

const BREAKING: Segment[][] = [WALK, LATTICE, TEE, CHAIN, SLOPE_FLIP, TANGLE];

if (!중화됨) {
  for (const [label, impl] of [
    ["세로 범위를 사건 자리로 정하는 판", shortUpright],
    ["시작하는 선분을 안 모으는 판", noStarting],
    ["이름 순으로 세우는 판", byName],
    ["오른쪽 이웃을 예약하지 않는 판", noRight],
  ] as [string, Impl][]) {
    if (
      BREAKING.every(
        (segs) => bentleyOttmann(segs) === impl.bentleyOttmann(segs),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 정본과 변이의 답을 나란히 놓은 표. */
function contrast(
  cases: [string, Segment[]][],
  impl: Impl,
  head: string,
  reaches?: (segs: Segment[]) => boolean,
): string {
  const rows = cases.map(([label, segs]) => {
    const want = bentleyOttmann(segs);
    const got = impl.bentleyOttmann(segs);
    const cells = [
      label,
      num(segs.length),
      num(want),
      num(got),
      want === got ? "같다" : "어긋난다",
    ];
    if (reaches !== undefined) {
      cells.splice(4, 0, reaches(segs) ? "지난다" : "안 지난다");
    }
    return cells;
  });
  const head2 = ["배치", "선분", "정본", head, "대조"];
  const align: ("l" | "r")[] = ["l", "r", "r", "r", "l"];
  if (reaches !== undefined) {
    head2.splice(4, 0, "바꾼 줄");
    align.splice(4, 0, "l");
  }
  return table(head2, rows, align);
}

/** 그 배치가 세로 선분을 하나라도 갖는가 — 세로 갈래의 변이 줄을 지나는 조건이다. */
const hasUpright = (segs: Segment[]): boolean =>
  segs.some((s) => s[0][0] === s[1][0]);

/* ────────────────────────── 블록 ────────────────────────── */

const WALK_STEPS: Step[] = [];
const WALK_COUNT = measure(WALK, WALK_STEPS);

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 배치마다 답과 견준 쌍의 수. 전부 대조와 이 절차를 나란히 놓는다. */
  "concept-cases": () => {
    const cases: [string, Segment[]][] = [
      ["평행하고 떨어져 있다", PARALLEL],
      ["같은 직선 위에서 겹친다", OVERLAP],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["가로 둘과 세로 둘", LATTICE],
      ["전개 입력", WALK],
      ["흩어 놓은 짧은 선분 512", scattered(512, 16)],
      ["격자무늬 256", mesh(256)],
    ];
    const rows = cases.map(([label, segs]) => {
      const brute = bruteForce(segs);
      const mine = measure(segs);
      return [
        label,
        num(segs.length),
        num(mine.pairs),
        num(brute.pair),
        num(mine.pair),
      ];
    });
    return [
      table(["배치", "선분", "교차 쌍", "전부 대조", "짝을 본 횟수"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `${num(cases.length)} 개 배치 모두 두 절차의 답이 같다. 갈리는 것은 선분 짝을 몇 번 봤는가다`,
      `└ 선분이 ${num(cases[cases.length - 2]?.[1].length ?? 0)} 개인 아래 두 줄에서 차이가 벌어진다 — 전부 대조만 제곱으로 커진다`,
    ].join("\n");
  },

  /** `concept` — 선분 수를 4 배로 하면 두 절차가 각각 몇 배가 되는가. */
  "concept-growth": () => {
    const sizes = [64, 256, 1_024, 4_096];
    const pairsAt = (n: number): number => (n * (n - 1)) / 2;
    const mineAt = new Map(sizes.map((n) => [n, measure(sparse(n)).pair]));
    const rows = sizes.map((n) => [
      num(n),
      num(pairsAt(n)),
      num(mineAt.get(n) as number),
    ]);
    const growRows = sizes.slice(1).map((n, at) => {
      const prev = sizes[at] as number;
      return [
        `${num(prev)} → ${num(n)}`,
        (pairsAt(n) / pairsAt(prev)).toFixed(2),
        ((mineAt.get(n) as number) / (mineAt.get(prev) as number)).toFixed(2),
      ];
    });
    return [
      table(["선분", "쌍의 수", "짝을 본 횟수"], rows, ["r", "r", "r"]),
      "",
      table(["선분을 4 배로", "쌍의 수 성장률", "이 절차의 성장률"], growRows, [
        "l",
        "r",
        "r",
      ]),
      "",
      `제약의 선분 수 ${num(MAX_N)} 에서 쌍의 수 ${num(pairsAt(MAX_N))}`,
      `└ 쌍의 수 성장률은 16 에 머물고 이 절차는 ${growRows[0]?.[2]} 에서 ${ro(growRows[growRows.length - 1]?.[2] ?? "")} 내려간다`,
    ].join("\n");
  },

  /** `deep.build` ② — 제약 규모에서 전부 대조가 몇 번인가. */
  "build-brute": () => {
    const sizes = [5, 1_000, 10_000, MAX_N];
    const rows = sizes.map((n) => [
      num(n),
      num((n * (n - 1)) / 2),
      ((n * (n - 1)) / 2).toExponential(2),
    ]);
    const walk = bruteForce(WALK);
    return [
      table(["선분", "쌍의 수", "지수로 적으면"], rows, ["r", "r", "r"]),
      "",
      `전개 입력 선분 ${num(WALK.length)} 개를 전부 대조하면 판정 ${num(walk.pair)} 번에 교차 ${num(walk.pairs)} 쌍`,
      `└ 제약의 상한에서 판정이 ${((MAX_N * (MAX_N - 1)) / 2).toExponential(2)} 번이다. 1 초 안에 못 끝낸다`,
      "└ 쌍의 수는 선분 수의 제곱에 비례한다. 선분을 4 배로 하면 대조가 16 배다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로. 이웃만 보면 무엇이 줄어드는가. */
  "build-neighbor": () => {
    const brute = bruteForce(WALK);
    const mine = measure(WALK);
    const rows: string[][] = [];
    let skipped = 0;
    for (let i = 0; i < WALK.length; i++) {
      for (let j = i + 1; j < WALK.length; j++) {
        const a = WALK[i] as Segment;
        const b = WALK[j] as Segment;
        const looked = mine.looked.has(i * WALK.length + j);
        if (!looked) skipped++;
        rows.push([
          `s${i}-s${j}`,
          seg(a),
          seg(b),
          segmentsIntersect(a, b) ? "교차" : "안 만난다",
          looked ? "들여다봤다" : "한 번도 안 봤다",
        ]);
      }
    }
    const big = measure(scattered(512, 16));
    const bigAll = (512 * 511) / 2;
    return [
      table(
        ["짝", "한쪽", "다른 쪽", "전부 대조의 판정", "이 절차가 본 적"],
        rows,
        ["l", "l", "l", "l", "l"],
      ),
      "",
      table(
        ["배치", "선분", "전부 대조", "본 짝의 종류", "한 번도 안 본 짝"],
        [
          [
            "전개 입력",
            num(WALK.length),
            num(brute.pair),
            num(mine.looked.size),
            num(skipped),
          ],
          [
            "흩어 놓은 짧은 선분 512",
            num(512),
            num(bigAll),
            num(big.looked.size),
            num(bigAll - big.looked.size),
          ],
        ],
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `다섯 선분에서는 안 본 짝이 ${num(skipped)} 개뿐이라 차이가 크게 안 보인다`,
      `└ 선분이 512 개면 짝 ${num(bigAll)} 개 가운데 ${num(big.looked.size)} 개만 본다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 사건 자리의 수는 끝점 둘씩에 교차 사건이 붙은 것이다. */
  "build-events": () => {
    const cases: [string, Segment[]][] = [
      ["평행하고 떨어져 있다", PARALLEL],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["가로 둘과 세로 둘", LATTICE],
      ["전개 입력", WALK],
      ["흩어 놓은 짧은 선분 512", scattered(512, 16)],
      ["격자무늬 64", mesh(64)],
    ];
    const rows = cases.map(([label, segs]) => {
      const c = measure(segs);
      return [
        label,
        num(segs.length),
        num(2 * segs.length),
        num(c.booked),
        num(c.spot),
        num(c.pairs),
      ];
    });
    return [
      table(
        [
          "배치",
          "선분",
          "끝점",
          "예약한 교차 자리",
          "처리한 사건 자리",
          "교차 쌍",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "사건 자리는 끝점에 예약한 교차 자리를 더한 수이고, 겹치는 끝점은 하나로 합쳐진다",
      `└ 마지막 줄은 교차가 ${num(measure(mesh(64)).pairs)} 쌍인데 예약이 0 이다 — 세로 선분이 낀 짝은 여는 자리에서 바로 센다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 이웃만 볼 때와 상태 배열 전부를 볼 때의 계수. */
  "build-tune": () => {
    const cases: [string, Segment[]][] = [
      ["흩어 놓은 길이 16", scattered(512, 16)],
      ["흩어 놓은 길이 128", scattered(512, 128)],
      ["흩어 놓은 길이 1024", scattered(512, 1_024)],
      ["격자무늬 64", mesh(64)],
      ["격자무늬 128", mesh(128)],
      ["격자무늬 256", mesh(256)],
    ];
    const rows = cases.map(([label, segs]) => {
      const c = measure(segs);
      const all = (segs.length * (segs.length - 1)) / 2;
      return [
        label,
        num(c.pairs),
        num(all),
        num(c.pair),
        (c.pair / all).toFixed(2),
      ];
    });
    return [
      table(
        ["배치", "교차 쌍", "전부 대조", "짝을 본 횟수", "횟수 ÷ 전부 대조"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "교차가 적은 배치에서 비율이 0.01 아래이고, 교차가 쌍의 절반을 넘는 배치에서 0.5 언저리다",
      "└ 들여다본 짝이 교차 쌍의 수를 따라 커진다 — 이 절차의 비용은 답의 크기에 붙는다",
    ].join("\n");
  },

  /** `deep.walk` 도입부 — 다섯 선분을 정규화한 결과. */
  "walk-normalize": () => {
    const rows = WALK.map((s, id) => {
      const g = toSeg(s, id);
      return [
        `s${id}`,
        seg(s),
        `(${g.lox},${g.loy})`,
        `(${g.hix},${g.hiy})`,
        g.vertical
          ? "세로"
          : `${g.dy / gcd(g.dy, g.dx)}/${g.dx / gcd(g.dy, g.dx)}`,
      ];
    });
    return [
      table(["이름", "입력", "lo", "hi", "기울기"], rows, [
        "l",
        "l",
        "l",
        "l",
        "r",
      ]),
      "",
      "끝점 둘을 사전순으로 세워 앞선 쪽을 lo 로 둔다 — x 가 먼저이고 같으면 y 다",
      `└ ${WALK.map((raw, id) => (toSeg(raw, id).vertical ? `s${id}` : ""))
        .filter((t) => t !== "")
        .join(
          " ",
        )} 는 두 끝점의 x 가 같아 세로 선분이고, 상태 배열에 들어가지 않는다`,
    ].join("\n");
  },

  /** `deep.walk` 단계 — 처음 큐에 넣은 끝점 열 개를 사전순으로. */
  "walk-queue": () => {
    const spots: [string, Spot][] = [];
    for (const [id, s] of WALK.entries()) {
      const g = toSeg(s, id);
      spots.push([`s${id} lo`, { x: g.lox, y: g.loy, d: 1n }]);
      spots.push([`s${id} hi`, { x: g.hix, y: g.hiy, d: 1n }]);
    }
    spots.sort((a, b) => cmpSpot(a[1], b[1]));
    const rows = spots.map(([label, p], at) => [
      num(at + 1),
      spotText(p),
      label,
    ]);
    return [
      table(["순서", "사건 자리", "무엇"], rows, ["r", "l", "l"]),
      "",
      `끝점 ${num(spots.length)} 개를 사전순으로 세운 것이 처음 큐의 내용이다`,
      "└ 교차 자리는 여기 없다 — 이웃이 되고 나서야 값이 정해지므로 실행 중에 들어간다",
    ].join("\n");
  },

  /** `deep.walk` 단계 — T1~T3, 상태 배열이 세워지는 자리. */
  "walk-insert": () => {
    const rows = WALK_STEPS.slice(0, 3).map((s, at) => [
      `T${at + 1}`,
      s.at,
      s.kind,
      s.status,
      s.booked,
    ]);
    return [
      table(["걸음", "now", "무엇", "status", "예약"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `x = 0 에 끝점이 ${num(WALK_STEPS.slice(0, 3).filter((t) => t.at.startsWith("(0,")).length)} 개 몰려 있어 y 가 작은 것부터 하나씩 들어간다`,
      `└ 예약이 붙는 걸음은 T${WALK_STEPS.findIndex((t) => t.booked !== "—") + 1} 이고, 그 자리에서 ${(WALK_STEPS.find((t) => t.booked !== "—") as Step).booked} 이 큐에 들어간다`,
    ].join("\n");
  },

  /** `deep.walk` 단계 — T4·T5, 세로 선분을 여닫는 자리. */
  "walk-upright": () => {
    const rows = WALK_STEPS.slice(3, 5).map((s, at) => [
      `T${at + 4}`,
      s.at,
      s.kind,
      s.upright,
      num(s.pairs),
    ]);
    const v = toSeg(WALK[2] as Segment, 2);
    const at2: string[][] = [];
    for (const [id, raw] of WALK.entries()) {
      const g = toSeg(raw, id);
      if (g.vertical) continue;
      if (g.lox > 2n || g.hix < 2n) continue;
      const y = g.loy + ((g.hiy - g.loy) * (2n - g.lox)) / (g.hix - g.lox);
      at2.push([
        `s${id}`,
        `${y}`,
        y >= v.loy && y <= v.hiy ? "범위 안" : "범위 밖",
      ]);
    }
    return [
      table(["걸음", "now", "무엇", "upright", "pairs"], rows, [
        "l",
        "l",
        "l",
        "l",
        "r",
      ]),
      "",
      table(["선분", "x = 2 에서의 y", `[${v.loy}, ${v.hiy}]`], at2, [
        "l",
        "r",
        "l",
      ]),
      "",
      "세로 선분은 상태 배열에 안 들어간다 — 한 x 에서 y 가 하나로 안 정해지기 때문이다",
      "└ 대신 열리는 그 자리에서 y 범위에 드는 선분을 이분 탐색 둘로 골라낸다",
    ].join("\n");
  },

  /** `deep.walk` 단계 — T6·T7, 교차 자리에서 순서가 뒤집히는 자리. */
  "walk-cross": () => {
    const rows = WALK_STEPS.slice(5, 7).map((s, at) => [
      `T${at + 6}`,
      s.at,
      s.through,
      s.status,
      s.booked,
      num(s.pairs),
    ]);
    const a = toSeg(WALK[0] as Segment, 0);
    const b = toSeg(WALK[1] as Segment, 1);
    const d = toSeg(WALK[3] as Segment, 3);
    const q1 = crossingSpot(a, b) as Spot;
    const q2 = crossingSpot(a, d) as Spot;
    return [
      table(["걸음", "now", "through", "status", "예약", "pairs"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
        "r",
      ]),
      "",
      table(
        ["짝", "분자 x", "분자 y", "분모", "자리"],
        [
          ["s0-s1", `${q1.x}`, `${q1.y}`, `${q1.d}`, spotText(q1)],
          ["s0-s3", `${q2.x}`, `${q2.y}`, `${q2.d}`, spotText(q2)],
        ],
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "교차 자리는 정수 셋으로 적어 둔다 — 분자 둘과 분모 하나다",
      `└ s0-s3 은 분모가 ${q2.d} 이라 배정밀도로는 딱 떨어지지 않는 값이다`,
    ].join("\n");
  },

  /** `deep.walk` 단계 — 열두 걸음 전부. */
  "walk-trace": () => {
    const rows = WALK_STEPS.map((s, at) => [
      `T${at + 1}`,
      s.at,
      s.kind,
      s.status,
      s.upright,
      s.booked,
      num(s.pairs),
    ]);
    return [
      table(
        ["걸음", "now", "무엇", "status", "upright", "예약", "pairs"],
        rows,
        ["l", "l", "l", "l", "l", "l", "r"],
      ),
      "",
      `사건 자리 ${num(WALK_COUNT.spot)} 개 · 들여다본 짝 ${num(WALK_COUNT.pair)} 번 · 답 ${num(WALK_COUNT.pairs)}`,
      "└ 큐가 비면 끝난다. 상태 배열이 T10 에서 한 번 비지만 큐에는 s4 의 끝점이 남아 있다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 세로 선분의 y 범위를 사건 자리로 잘라 보면. */
  "pause-upright": () => {
    const cases: [string, Segment[]][] = [
      ["가로 둘과 세로 둘", LATTICE],
      ["전개 입력", WALK],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["같은 직선 위에서 겹친다", OVERLAP],
      ["평행하고 떨어져 있다", PARALLEL],
    ];
    const skipped = cases.filter(([, segs]) => !hasUpright(segs)).length;
    const lat = bentleyOttmann(LATTICE);
    return [
      contrast(cases, shortUpright, "위끝을 바꾼 판", hasUpright),
      "",
      "세로 선분의 위 끝점 대신 사건 자리로 범위를 정하면 그 자리 위쪽을 못 본다",
      `└ 가로 둘과 세로 둘은 교차 ${num(lat)} 개가 전부 세로 선분의 아래 끝점보다 위에 있어 답이 0 이 된다`,
      `└ 아래 ${num(skipped)} 줄은 세로 선분이 없어 바꾼 줄까지 가지도 않는다. 「같다」의 뜻이 다르다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 여기서 시작하는 선분을 안 모아 보면. */
  "pause-start": () =>
    [
      contrast(
        [
          ["T 자로 만난다", TEE],
          ["끝점끼리 이어 붙는다", CHAIN],
          ["같은 직선 위에서 겹친다", OVERLAP],
          ["전개 입력", WALK],
          ["가로 둘과 세로 둘", LATTICE],
        ],
        noStarting,
        "안 모으는 판",
      ),
      "",
      "시작하는 선분을 모으는 자리를 빼면 시작 끝점에서 만나는 짝이 통째로 사라진다",
      "└ 겹치는 배치와 전개 입력은 답이 그대로다 — 뒤 사건 자리에서 같은 짝을 다시 만난다",
    ].join("\n"),

  /** `deep.walk.pause` — 오른쪽 이웃을 예약하지 않아 보면. */
  "pause-right": () =>
    [
      contrast(
        [
          ["셋이 서로 다 교차한다", TANGLE],
          ["전개 입력", WALK],
          ["세 선분이 한 점에서 만난다", TRIPLE],
          ["가로 둘과 세로 둘", LATTICE],
          ["T 자로 만난다", TEE],
        ],
        noRight,
        "왼쪽만 보는 판",
      ),
      "",
      "토막을 갈아 끼우면 이웃이 위아래 두 자리에서 생기는데 한쪽만 보면 위쪽을 놓친다",
      "└ 전개 입력은 답이 그대로다 — 놓친 짝을 뒤에서 다른 사건 자리가 우연히 다시 잡는다",
    ].join("\n"),

  /** `related` — 교차 쌍의 수를 늘려 가면 비용이 그것을 따라간다. */
  "related-output": () => {
    const rows = [64, 96, 128, 192, 256].map((n) => {
      const c = measure(mesh(n));
      return [
        num(n),
        num(c.pairs),
        num(c.spot),
        num(c.pair),
        (c.pair / c.pairs).toFixed(2),
      ];
    });
    return [
      table(
        ["선분", "교차 쌍", "사건 자리", "짝을 본 횟수", "짝 ÷ 교차 쌍"],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `선분을 ${num(64)} 개에서 ${num(256)} 개로 4 배 늘리면 교차 쌍은 ${(measure(mesh(256)).pairs / measure(mesh(64)).pairs).toFixed(2)} 배, 짝을 본 횟수는 ${(measure(mesh(256)).pair / measure(mesh(64)).pair).toFixed(2)} 배가 된다`,
      "└ 마지막 열이 거의 안 변한다 — 비용이 답의 크기에 비례해 붙는다는 뜻이다",
    ].join("\n");
  },

  /** `deep.math` ② — 사건 자리 수의 정의를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const cases: [string, Segment[]][] = [
      ["평행하고 떨어져 있다", PARALLEL],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["전개 입력", WALK],
      ["가로 둘과 세로 둘", LATTICE],
      ["셋이 서로 다 교차한다", TANGLE],
    ];
    const rows = cases.map(([label, segs]) => {
      const c = measure(segs);
      const ends = new Set<string>();
      for (const s of segs) {
        ends.add(`${s[0][0]},${s[0][1]}`);
        ends.add(`${s[1][0]},${s[1][1]}`);
      }
      return [
        label,
        num(segs.length),
        num(2 * segs.length),
        num(ends.size),
        num(c.spot - ends.size),
        num(c.spot),
      ];
    });
    return [
      table(["배치", "n", "2n", "서로 다른 끝점", "교차 자리", "E"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "끝점이 겹치면 자리가 하나로 합쳐지므로 서로 다른 끝점 수가 2n 보다 작아진다",
      `└ ${num(cases.length)} 개 배치 모두 마지막 열이 앞의 두 열의 합과 같다`,
    ].join("\n");
  },

  /** `deep.math` ③ — 교차 자리의 분자·분모가 좌표 상한의 몇 제곱인가. */
  "math-digits": () => {
    const c = BigInt(MAX_C);
    const denBound = 8n * c * c;
    const numBound = 24n * c * c * c;
    const cmpBound = numBound * denBound;
    const safe = 2n ** 53n;
    const wide = bigCoordinate();
    const measured = measure(wide);
    const rows = [
      ["분모", "8C²", `${denBound}`, `${denBound.toString(2).length}`],
      ["분자", "24C³", `${numBound}`, `${numBound.toString(2).length}`],
      ["자리 대소", "192C⁵", `${cmpBound}`, `${cmpBound.toString(2).length}`],
      ["배정밀도 정수", "2^53", `${safe}`, "54"],
    ];
    return [
      table(["무엇", "닫힌 형태", "C = 10^9 에서의 값", "비트"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      `좌표 상한 ${num(MAX_C)} 짜리 선분 ${num(wide.length)} 개를 실제로 실행해 나온 가장 큰 값`,
      `└ 분자 ${measured.bigNum} · 분모 ${measured.bigDen}`,
      `└ 자리 대소를 재는 곱의 상한이 배정밀도 정수 한계의 ${Number(cmpBound / safe).toExponential(2)} 배다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 제약 규모를 넣어 계수를 낸다. */
  "math-count": () => {
    const n = MAX_N;
    const rows = [
      [
        "교차가 없다",
        "0",
        num(2 * n),
        num(2 * n * Math.ceil(Math.log2(2 * n))),
      ],
      [
        "교차가 n 개",
        num(n),
        num(3 * n),
        num(3 * n * Math.ceil(Math.log2(3 * n))),
      ],
      [
        "교차가 n log n 개",
        num(n * 17),
        num(2 * n + n * 17),
        num((2 * n + n * 17) * Math.ceil(Math.log2(2 * n + n * 17))),
      ],
      [
        "교차가 최대",
        num((n * (n - 1)) / 2),
        ((n * (n - 1)) / 2 + 2 * n).toExponential(2),
        (((n * (n - 1)) / 2 + 2 * n) * 33).toExponential(2),
      ],
    ];
    return [
      table(["k 의 크기", "k", "사건 자리 E", "E·⌈log₂E⌉"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      `제약의 선분 수 ${num(n)} 을 넣은 값이다. 교차가 없으면 사건이 ${num(2 * n)} 개다`,
      "└ 교차가 최대인 배치는 답 자체가 50 억 쌍이라 어떤 절차도 1 초 안에 못 적는다",
    ].join("\n");
  },

  /** `invariant` — 각 갈래를 지난 뒤에도 상태 배열이 y 오름차순인가. */
  "invariant-states": () => {
    const rows = WALK_STEPS.map((s, at) => [
      `T${at + 1}`,
      s.at,
      s.kind,
      s.status,
      s.sorted ? "오름차순" : "어긋난다",
    ]);
    const others: [string, Segment[]][] = [
      ["가로 둘과 세로 둘", LATTICE],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["같은 직선 위에서 겹친다", OVERLAP],
      ["기울기가 뒤집히는 셋", SLOPE_FLIP],
      ["셋이 서로 다 교차한다", TANGLE],
      ["흩어 놓은 짧은 선분 512", scattered(512, 16)],
      ["격자무늬 64", mesh(64)],
    ];
    const otherRows = others.map(([label, segs]) => {
      const c = measure(segs);
      return [label, num(c.spot), num(c.broken)];
    });
    return [
      table(["걸음", "now", "무엇", "status", "그 자리 뒤의 y 순서"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      table(["다른 배치", "걸음", "어긋난 걸음"], otherRows, ["l", "r", "r"]),
      "",
      "네 갈래(시작 · 끝 · 교차 · 세로 여닫기)를 지난 뒤가 전부 오름차순이다",
      "└ 실행이 매 걸음 이웃 쌍을 견줘 확인한 값이다 — 어긋난 걸음이 있으면 그 수가 0 이 아니다",
    ].join("\n");
  },

  /** `invariant` — 엣지 케이스. */
  "invariant-edges": () => {
    const cases: [string, Segment[]][] = [
      ["선분 0 개", []],
      ["선분 1 개", [WALK[0] as Segment]],
      ["끝점끼리 이어 붙는다", CHAIN],
      ["같은 직선 위에서 겹친다", OVERLAP],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["평행하고 떨어져 있다", PARALLEL],
      ["큰 좌표 X 자", HUGE],
      ["같은 직선에 여덟 겹", stack(8)],
      ["한 점에 여덟 갈래", star(8)],
    ];
    const rows = cases.map(([label, segs]) => {
      const brute = bruteForce(segs);
      const got = bentleyOttmann(segs);
      return [
        label,
        num(segs.length),
        num(got),
        num(brute.pairs),
        got === brute.pairs ? "같다" : "어긋난다",
      ];
    });
    return [
      table(["배치", "선분", "정본", "전부 대조", "대조"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `선분이 둘 미만이면 짝이 없어 0 이다. ${num(8)} 개를 한 점에 모으거나 겹쳐 쌓으면 ${num((8 * 7) / 2)} 쌍이 전부 교차다`,
      `└ ${num(cases.length)} 개 배치 모두 전부 대조와 답이 같다`,
    ].join("\n");
  },

  /** `invariant` ③ — 순서를 세우는 그 줄을 이름 순으로 바꿔 보면. */
  "mutant-name-order": () =>
    [
      contrast(
        [
          ["기울기가 뒤집히는 셋", SLOPE_FLIP],
          ["셋이 서로 다 교차한다", TANGLE],
          ["전개 입력", WALK],
          ["세 선분이 한 점에서 만난다", TRIPLE],
          ["같은 직선 위에서 겹친다", OVERLAP],
        ],
        byName,
        "이름 순 판",
      ),
      "",
      "교차 자리를 지난 뒤의 위아래를 기울기가 정하는데 이름 순으로 세우면 그 뒤집힘이 없어진다",
      "└ 순서가 어긋난 배열에 이분 탐색을 하면 없는 짝을 세기도 하고 있는 짝을 놓치기도 한다",
    ].join("\n"),

  /** `perf.derive` — 전개 입력의 계수 분해. */
  "perf-count": () => {
    const rows = [
      ["끝점 사건", num(2 * WALK.length)],
      ["예약한 교차 자리", num(WALK_COUNT.booked)],
      ["처리한 사건 자리", num(WALK_COUNT.spot)],
      ["짝을 본 횟수", num(WALK_COUNT.pair)],
      ["상태 배열의 최대 크기", num(WALK_COUNT.status)],
      ["사건 큐의 최대 크기", num(WALK_COUNT.queue)],
      ["교차 쌍", num(WALK_COUNT.pairs)],
    ];
    return [
      table(["무엇", "값"], rows, ["l", "r"]),
      "",
      `전개 입력 선분 ${num(WALK.length)} 개에서 잰 값이다. 끝점 ${num(2 * WALK.length)} 개에 교차 자리 ${num(WALK_COUNT.booked)} 개가 붙어 ${num(WALK_COUNT.spot)} 자리다`,
      `└ 상태 배열이 ${num(WALK_COUNT.status)} 개를 안 넘어 이분 탐색 한 번이 ${num(Math.ceil(Math.log2(WALK_COUNT.status + 1)))} 걸음으로 끝난다`,
    ].join("\n");
  },

  /** `perf.derive` — 선분 수를 키우며 사건 자리와 짝이 어떻게 자라는가. */
  "perf-growth": () => {
    const sizes = [512, 1_024, 2_048, 4_096];
    const seen = new Map(sizes.map((n) => [n, measure(sparse(n))]));
    const rows = sizes.map((n) => {
      const c = seen.get(n) as Counted;
      return [
        num(n),
        num(c.pairs),
        num(c.spot),
        num(c.pair),
        num(Math.ceil(Math.log2(Math.max(2, c.spot)))),
      ];
    });
    const growRows = sizes.slice(1).map((n, at) => {
      const prev = sizes[at] as number;
      const a = seen.get(prev) as Counted;
      const b = seen.get(n) as Counted;
      return [
        `${num(prev)} → ${num(n)}`,
        (b.pairs / a.pairs).toFixed(2),
        (b.spot / a.spot).toFixed(2),
        (b.pair / a.pair).toFixed(2),
        ((n * Math.log2(n)) / (prev * Math.log2(prev))).toFixed(2),
      ];
    });
    return [
      table(
        ["선분", "교차 쌍", "사건 자리 E", "짝을 본 횟수", "⌈log₂E⌉"],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      table(
        [
          "선분을 2 배로",
          "교차 쌍 성장률",
          "사건 자리 성장률",
          "짝 성장률",
          "n log n 성장률",
        ],
        growRows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "밀도를 고정한 가족이라 선분을 2 배로 해도 한 선분이 만나는 이웃 수가 안 변한다",
      "└ 사건 자리는 정확히 2 배이고 짝의 성장률이 n log n 의 성장률 옆에 붙는다",
    ].join("\n");
  },

  /** `perf.worst` — 최악을 만드는 배치. 무엇이 가장 커지는가. */
  "worst-shape": () => {
    const cases: [string, Segment[]][] = [
      ["가로로 나란한 64", flat(64)],
      ["흩어 놓은 길이 16 · 64", scattered(64, 16)],
      ["흩어 놓은 길이 1024 · 64", scattered(64, 1_024)],
      ["한 점에 64 갈래", star(64)],
      ["같은 직선에 64 겹", stack(64)],
      ["격자무늬 64", mesh(64)],
    ];
    const rows = cases.map(([label, segs]) => {
      const c = measure(segs);
      return [
        label,
        num(c.pairs),
        num(c.spot),
        num(c.queue),
        num(c.status),
        num(c.pair),
      ];
    });
    return [
      table(
        [
          "배치",
          "교차 쌍",
          "사건 자리",
          "큐 최대",
          "status 최대",
          "짝을 본 횟수",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `선분 64 개에서 쌍의 수는 ${num((64 * 63) / 2)} 이다. 한 점에 모으거나 겹쳐 쌓으면 그 전부가 교차다`,
      `└ 큐의 최대는 ${num(cases.length)} 개 배치 모두 끝점을 전부 넣은 ${num(2 * 64)} 이다 — 예약이 그 위로 안 쌓였다`,
      "└ 교차 쌍이 가장 많은 배치와 짝을 가장 많이 보는 배치가 서로 다르다",
    ].join("\n");
  },
};
