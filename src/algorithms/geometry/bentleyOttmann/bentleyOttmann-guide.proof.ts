/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts bentleyOttmann-guide.md
 *
 * **비용은 대조 하네스(`*.alt.ts`)의 계측본으로 센다.** 가이드 전체가 기준 하나 — 기본 연산(정수
 * 곱셈과 자료 접근을 각각 1 로 센 합)과 추가로 잡는 칸 — 을 쓰므로, 본문의 비용과 「경쟁 설계와의
 * 대조」의 비용이 같은 계측본에서 나와야 한다. 그 계측본은 부를 때마다 자기 답을 정본과 맞댄다.
 *
 * **걸음 기록은 이 파일의 사본(`walkRun`)이 낸다.** 정본과 같은 절차에 걸음마다의 상태를 적는
 * 자리만 덧붙였고, `measure()` 가 부를 때마다 정본과 답을 맞대므로 사본이 정본에서 벗어나면 그
 * 자리에서 던진다. 그림 사이드카(`*.fig.tsx`)의 무대 걸음도 이 기록에서 나온다. 큰 입력에서는
 * 걸음마다 전체를 베끼지 않고 셈만 받는다(`keep` 이 `null`).
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { segmentsIntersect } from "../segmentsIntersect/segmentsIntersect-guide.ref.ts";
import {
  bySweep,
  type Counted,
  cmpSpot,
  crossingSpot,
  heapPop,
  heapPush,
  meets,
  mesh,
  ops,
  orient,
  reduced,
  type Seg,
  type Spot,
  scattered,
  sign,
  slopeOrder,
  spotKey,
  toSeg,
  zero,
} from "./bentleyOttmann-guide.alt.ts";
import {
  bentleyOttmann,
  type Point,
  type Segment,
} from "./bentleyOttmann-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => (n + 0).toLocaleString("en-US");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
export function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 선분 하나의 표기. 본문과 글자 그대로 같다. */
export const seg = (s: Segment): string =>
  `(${s[0][0]},${s[0][1]})-(${s[1][0]},${s[1][1]})`;

/** 선분 이름. 입력 목록의 자리다. */
export const nm = (id: number): string => `s${id}`;

/** 선분 이름 목록. 비면 「—」. */
export const names = (ids: readonly number[]): string =>
  ids.length === 0 ? "—" : ids.map(nm).join(" ");

function gcdOf(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x === 0n ? 1n : x;
}

/** 유리수 하나의 표기 — 분모가 1 이면 정수, 아니면 `a/b`. */
export function frac(n: bigint, d: bigint): string {
  let a = n;
  let b = d;
  if (b < 0n) {
    a = -a;
    b = -b;
  }
  const g = gcdOf(a < 0n ? -a : a, b);
  a /= g;
  b /= g;
  return b === 1n ? `${a}` : `${a}/${b}`;
}

/** 자리를 본문 표기로 적는다. */
export const spotText = (p: Spot): string =>
  `(${frac(p.x, p.d)},${frac(p.y, p.d)})`;

/** 자리의 x · y 를 따로 — 무대의 큐 띠가 쓴다. */
export const spotX = (p: Spot): string => frac(p.x, p.d);
export const spotY = (p: Spot): string => frac(p.y, p.d);

/** 자리의 좌표를 배정밀도로 — 그림의 자리에만 쓴다. 판정에는 안 쓴다. */
export const spotXf = (p: Spot): number => Number(p.x) / Number(p.d);
export const spotYf = (p: Spot): number => Number(p.y) / Number(p.d);

/** 선분의 기울기 표기. 세로 선분이면 「세로」. */
export function slopeText(s: Seg): string {
  return s.vertical ? "세로" : frac(s.dy, s.dx);
}

/** 선분 `s` 가 x = `xn/xd` 에서 지나는 y. 세로 선분에는 쓰지 않는다. */
export function yAt(s: Seg, xn: bigint, xd: bigint): string {
  return frac(s.loy * s.dx * xd + s.dy * (xn - s.lox * xd), s.dx * xd);
}

/** 계수를 버리는 판정 — 값만 필요한 자리. */
const Z = (): Counted => zero();
const cmp = (a: Spot, b: Spot): number => cmpSpot(a, b, Z());

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력 — 선분 다섯.
 *
 * 갈래 다섯을 한 입력으로 전부 실행한다. 끝점 사건 열 개에 교차 사건 두 개가 붙고, 그중
 * 하나는 좌표가 분수다. 세로 선분 하나가 있고, 마지막 하나는 x 구간이 겹치지 않아 앞의
 * 넷과 한 번도 판정하지 않는다.
 */
export const WALK: Segment[] = [
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

/**
 * 전개 입력에서 s1 만 `(12,-6)` 까지 늘인 배치. s1 이 s0 · s3 의 교차점보다 오래 남아서,
 * 교차점을 사건으로 안 삼는 판이 s0 과 s3 을 끝까지 이웃으로 못 만난다.
 */
export const STRETCH: Segment[] = WALK.map((s, id) =>
  id === 1
    ? ([
        [0, 6],
        [12, -6],
      ] as Segment)
    : s,
);

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
export const TEE: Segment[] = [
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
 * 교차점에서 순서를 기울기로 안 세우면 답이 갈리는 배치.
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

/** 셋이 서로 다 교차한다. 위쪽 이웃을 예약하지 않으면 하나를 놓친다. */
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

/** 좌표의 절댓값 상한과 선분 수 상한. 이 가이드가 고정한 과제의 규모다. */
export const MAX_C = 1_000_000_000;
export const MAX_N = 100_000;

/** 1 초의 예산 — 초당 기본 연산 1 억 번. */
export const PER_SECOND = 100_000_000;

/** 기본 연산 수를 초로 — 초당 1 억 번 기준. */
export const seconds = (n: number): string =>
  `${(n / PER_SECOND).toFixed(2)} 초`;

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
    out.push([[0, i] as Point, [4096, i] as Point]);
  }
  return out;
}

/** 좌표 상한을 꽉 채운 무작위 배치. 교차점의 분자·분모가 얼마나 커지는지 재는 데 쓴다. */
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

/* ────────────────────────── 걸음 기록 ────────────────────────── */

/** 예약 판정 한 번 — 경계 한 곳에서 두 이웃의 교차점을 계산한 기록. */
export interface Check {
  readonly side: "아래" | "위";
  /** 경계의 두 선분. 경계가 상태 배열 밖이면 `null`. */
  readonly pair: readonly [number, number] | null;
  /** 두 선분 안에서 만나는 자리. 선분 밖이거나 평행이면 `null`. */
  readonly spot: Spot | null;
  /** 큐에 넣었는가 — 자리가 있고 지금 사건점보다 뒤다. */
  readonly booked: boolean;
}

/** 세로 선분 하나를 여는 자리에서 y 범위로 센 기록. */
export interface Opened {
  readonly id: number;
  /** 상태 배열에서 범위에 든 선분. */
  readonly hits: readonly number[];
}

/** 한 걸음의 기록. `walk` 계열 블록과 그림 사이드카가 이것을 읽는다. */
export interface Step {
  readonly tag: string;
  readonly now: Spot;
  readonly opening: readonly number[];
  readonly starting: readonly number[];
  readonly ended: readonly number[];
  readonly closing: readonly number[];
  /** 걸음 전의 상태 배열. */
  readonly before: readonly number[];
  /** 이 사건점을 지나는 토막 — 방향 판정이 0 인 구간. */
  readonly through: readonly number[];
  /** 토막을 갈아 끼운 뒤의 새 토막. */
  readonly after: readonly number[];
  /** 걸음 뒤의 상태 배열. */
  readonly status: readonly number[];
  /** 걸음 뒤에 열려 있는 세로 선분. */
  readonly upright: readonly number[];
  readonly opened: readonly Opened[];
  /** 이 걸음에서 처음 센 교차 쌍. */
  readonly fresh: readonly (readonly [number, number])[];
  readonly checks: readonly Check[];
  readonly booked: readonly Spot[];
  /** 누적 교차 쌍. */
  readonly pairs: number;
  /** 걸음 뒤의 사건 큐 — 꺼낼 차례대로. */
  readonly queue: readonly Spot[];
  /** 걸음 뒤의 상태 배열이 이 자리 뒤의 y 순서인가. */
  readonly sorted: boolean;
}

/** 실행 한 번의 셈. */
export interface Tally {
  /** 처리한 사건점의 수. */
  spot: number;
  /** 사건 큐에 넣은 횟수 — 같은 자리를 여러 번 넣으면 여러 번 센다. */
  pushed: number;
  /** 사건 큐가 가장 컸을 때의 크기. */
  queue: number;
  /** 상태 배열이 가장 컸을 때의 크기. */
  status: number;
  /** 교차점으로 큐에 들어간 사건의 수. */
  booked: number;
  /** 답 — 교차하는 선분 쌍의 수. */
  pairs: number;
  /** 교차점의 분자·분모 가운데 가장 컸던 절댓값. */
  bigNum: bigint;
  bigDen: bigint;
  /** 상태 배열이 y 순서가 아니었던 걸음의 수. */
  broken: number;
}

/** 자리 `p` 의 x 에서 두 선분의 y 를 비교한다. 같으면 0 이다. */
function yOrderAt(a: Seg, b: Seg, p: Spot): number {
  const na = a.loy * a.dx * p.d + a.dy * (p.x - a.lox * p.d);
  const nb = b.loy * b.dx * p.d + b.dy * (p.x - b.lox * p.d);
  return sign(na * (b.dx * p.d) - nb * (a.dx * p.d));
}

/** 큐에 든 자리를 꺼낼 차례대로 — 힙 사본을 하나 떠서 비울 때까지 꺼낸다. 같은 자리는 한 칸. */
function drainOrder(heap: readonly Spot[]): Spot[] {
  const copy = [...heap];
  const out: Spot[] = [];
  while (copy.length > 0) {
    const p = heapPop(copy, Z());
    if (out.length === 0 || cmp(out[out.length - 1] as Spot, p) !== 0) {
      out.push(p);
    }
  }
  return out;
}

/**
 * 정본과 같은 절차에 걸음 기록만 덧붙인 사본.
 *
 * `measure()` 가 매 실행마다 정본과 답을 대조하므로, 이 사본이 정본에서 벗어나면 그 자리에서
 * 던진다. `keep` 이 `null` 이면 걸음마다 전체를 베끼지 않는다 — 큰 입력은 셈만 받는다.
 */
function walkRun(segments: Segment[], keep: Step[] | null): Tally {
  const t: Tally = {
    spot: 0,
    pushed: 0,
    queue: 0,
    status: 0,
    booked: 0,
    pairs: 0,
    bigNum: 0n,
    bigDen: 0n,
    broken: 0,
  };
  const n = segments.length;
  if (n < 2) return t;
  const segs = segments.map(toSeg);
  const c = Z();

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
    heapPush(events, lo, c);
    heapPush(events, hi, c);
    t.pushed += 2;
    fileInto(s.vertical ? uprightLow : startAt, spotKey(lo), s.id);
    fileInto(s.vertical ? uprightHigh : endAt, spotKey(hi), s.id);
  }

  const status: number[] = [];
  const upright: number[] = [];
  const seen = new Set<number>();
  let fresh: [number, number][] = [];

  const record = (a: number, b: number): void => {
    const key = a < b ? a * n + b : b * n + a;
    if (seen.has(key)) return;
    seen.add(key);
    t.pairs++;
    if (keep !== null) fresh.push(a < b ? [a, b] : [b, a]);
  };
  const firstNotBelow = (p: Spot): number => {
    let lo = 0;
    let hi = status.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
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
      if (orient(segs[status[mid] as number] as Seg, p, c) >= 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  let checks: Check[] = [];
  let bookedHere: Spot[] = [];
  const scheduleAt = (
    now: Spot,
    left: number,
    right: number,
    side: "아래" | "위",
  ): void => {
    if (left < 0 || right >= status.length) {
      if (keep !== null)
        checks.push({ side, pair: null, spot: null, booked: false });
      return;
    }
    const x = status[left] as number;
    const y = status[right] as number;
    const q = crossingSpot(segs[x] as Seg, segs[y] as Seg, c);
    const ok = q !== null && cmpSpot(q, now, c) > 0;
    if (keep !== null) checks.push({ side, pair: [x, y], spot: q, booked: ok });
    if (q !== null && ok) {
      const abs = (v: bigint): bigint => (v < 0n ? -v : v);
      if (abs(q.x) > t.bigNum) t.bigNum = abs(q.x);
      if (abs(q.y) > t.bigNum) t.bigNum = abs(q.y);
      if (q.d > t.bigDen) t.bigDen = q.d;
      heapPush(events, q, c);
      t.pushed++;
      t.booked++;
      if (keep !== null) bookedHere.push(q);
    }
  };

  let k = 0;
  while (events.length > 0) {
    t.queue = Math.max(t.queue, events.length);
    const now = heapPop(events, c);
    while (events.length > 0 && cmp(events[0] as Spot, now) === 0) {
      heapPop(events, c);
    }
    const here = spotKey(now);
    t.spot++;
    k++;
    checks = [];
    bookedHere = [];
    fresh = [];
    const before = keep !== null ? [...status] : [];
    const opening = uprightLow.get(here) ?? [];
    const starting = startAt.get(here) ?? [];
    const ended = endAt.get(here) ?? [];
    const closing = uprightHigh.get(here) ?? [];
    const opened: Opened[] = [];

    for (const id of opening) {
      const v = segs[id] as Seg;
      for (const other of upright) record(id, other);
      const top: Spot = { x: v.hix, y: v.hiy, d: 1n };
      const to = firstAbove(top);
      const hits: number[] = [];
      for (let at = firstNotBelow(now); at < to; at++) {
        record(id, status[at] as number);
        if (keep !== null) hits.push(status[at] as number);
      }
      upright.push(id);
      if (keep !== null) opened.push({ id, hits });
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
    ].sort((x, y) => slopeOrder(segs[x] as Seg, segs[y] as Seg, c) || x - y);
    status.splice(from, through.length, ...after);
    t.status = Math.max(t.status, status.length);
    let sorted = true;
    for (let at = 1; at < status.length; at++) {
      const one = segs[status[at - 1] as number] as Seg;
      const two = segs[status[at] as number] as Seg;
      if (yOrderAt(one, two, now) > 0) sorted = false;
    }
    for (let at = 1; at < after.length; at++) {
      const one = segs[after[at - 1] as number] as Seg;
      const two = segs[after[at] as number] as Seg;
      if (slopeOrder(one, two, c) > 0) sorted = false;
    }
    if (!sorted) t.broken++;

    for (const id of closing) {
      const at = upright.indexOf(id);
      if (at >= 0) upright.splice(at, 1);
    }

    scheduleAt(now, from - 1, from, "아래");
    scheduleAt(now, from + after.length - 1, from + after.length, "위");

    if (keep !== null) {
      keep.push({
        tag: `T${k}`,
        now,
        opening: [...opening],
        starting: [...starting],
        ended: [...ended],
        closing: [...closing],
        before,
        through,
        after,
        status: [...status],
        upright: [...upright],
        opened,
        fresh,
        checks,
        booked: bookedHere,
        pairs: t.pairs,
        queue: drainOrder(events),
        sorted,
      });
    }
  }
  return t;
}

/** 실행 한 번의 셈과 비용. */
export interface Measured extends Tally {
  /** 기본 연산 — 정수 곱셈과 자료 접근의 합(`*.alt.ts` 의 계측본). */
  ops: number;
  /** 추가로 잡는 칸. */
  cells: number;
  /** 누적 기본 연산과 칸 — 첫 칸이 준비(끝점을 사건 큐에 넣은 뒤), 그 뒤가 사건점마다. */
  perStep: { ops: number; cells: number }[];
}

/** 사본과 계측본이 정본과 같은 답을 내는지 확인하고 셈과 비용을 돌려준다. */
export function measure(
  segments: Segment[],
  keep: Step[] | null = null,
): Measured {
  const got = walkRun(segments, keep);
  const want = bentleyOttmann(segments);
  if (got.pairs !== want) {
    throw new Error(
      `걸음 기록 사본이 정본과 다른 답을 냈다 — ${got.pairs} vs ${want}`,
    );
  }
  const c = zero();
  const perStep: { ops: number; cells: number }[] = [];
  const counted = bySweep(segments, c, (now) =>
    perStep.push({ ops: ops(now), cells: now.cells }),
  );
  if (counted !== want) {
    throw new Error(`계측본이 정본과 다른 답을 냈다 — ${counted} vs ${want}`);
  }
  return { ...got, ops: ops(c), cells: c.cells, perStep };
}

/* ────────────────────────── 단순한 방법과 후보 ────────────────────────── */

/** 판 하나의 결과 — 판정한 짝 · 답 · 기본 연산. */
export interface Tried {
  judged: number;
  pairs: number;
  ops: number;
}

/** 모든 쌍 판정 — 쌍을 하나도 안 거르고 판정한다. 기본 연산은 계측본의 `meets` 로 센다. */
export function allPairs(segments: Segment[]): Tried {
  const c = zero();
  let judged = 0;
  let pairs = 0;
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      judged++;
      const a = segments[i] as Segment;
      const b = segments[j] as Segment;
      const hit = meets(a, b, c);
      if (hit !== segmentsIntersect(a, b)) {
        throw new Error("계측본의 교차 판정이 segmentsIntersect 와 다르다");
      }
      if (hit) pairs++;
    }
  }
  return { judged, pairs, ops: ops(c) };
}

/**
 * x 구간이 겹치는 짝만 판정하는 판 — 끝점을 사건 큐에서 x 차례로 꺼내며, 선분이 시작하는
 * 자리에서 **지금 열려 있는 선분 전부**와 판정한다. 순서는 들지 않는다.
 */
export function byOverlap(segments: Segment[]): Tried {
  const c = zero();
  const n = segments.length;
  if (n < 2) return { judged: 0, pairs: 0, ops: 0 };
  const segs = segments.map(toSeg);
  c.cells += n;
  const events: Spot[] = [];
  const startAt = new Map<string, number[]>();
  const endAt = new Map<string, number[]>();
  const fileInto = (book: Map<string, number[]>, at: string, id: number) => {
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
    fileInto(startAt, spotKey(lo), s.id);
    fileInto(endAt, spotKey(hi), s.id);
  }
  const open: number[] = [];
  const seen = new Set<number>();
  let judged = 0;
  let pairs = 0;
  while (events.length > 0) {
    const now = heapPop(events, c);
    while (events.length > 0 && cmpSpot(events[0] as Spot, now, c) === 0) {
      heapPop(events, c);
    }
    const here = spotKey(now);
    c.reads += 1;
    for (const id of startAt.get(here) ?? []) {
      for (const other of open) {
        c.reads += 1;
        judged++;
        if (meets(segments[id] as Segment, segments[other] as Segment, c)) {
          const key = id < other ? id * n + other : other * n + id;
          c.reads += 1;
          if (!seen.has(key)) {
            seen.add(key);
            c.cells += 1;
            pairs++;
          }
        }
      }
      open.push(id);
      c.cells += 1;
    }
    c.reads += 1;
    for (const id of endAt.get(here) ?? []) {
      const at = open.indexOf(id);
      c.reads += open.length;
      if (at >= 0) open.splice(at, 1);
    }
  }
  return { judged, pairs, ops: ops(c) };
}

/**
 * 끝점에서만 이웃을 보는 판 — 상태 배열을 y 순서로 들되 **교차점을 사건으로 안 삼는다.**
 * 선분이 들어오는 자리에서 새 위아래 이웃과, 나가는 자리에서 새로 맞닿은 두 선분과만 판정한다.
 * 세로 선분은 정본처럼 여는 자리에서 y 범위로 고르되, 고른 짝도 판정해서 센다.
 */
export interface EndpointEvent {
  readonly now: Spot;
  /** 이 사건점을 처리한 뒤 끝점 판이 든 상태 배열. */
  readonly status: readonly number[];
  /** 이 사건점에서 판정한 짝. */
  readonly judged: readonly (readonly [number, number])[];
}

export function byEndpoints(
  segments: Segment[],
  history: EndpointEvent[] | null = null,
): Tried & { found: (readonly [number, number])[] } {
  const c = zero();
  const n = segments.length;
  if (n < 2) return { judged: 0, pairs: 0, ops: 0, found: [] };
  let here_judged: [number, number][] = [];
  const segs = segments.map(toSeg);
  const events: Spot[] = [];
  const startAt = new Map<string, number[]>();
  const endAt = new Map<string, number[]>();
  const uprightLow = new Map<string, number[]>();
  const uprightHigh = new Map<string, number[]>();
  const fileInto = (book: Map<string, number[]>, at: string, id: number) => {
    const got = book.get(at);
    c.reads += 1;
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
  const found: [number, number][] = [];
  let judged = 0;
  const check = (a: number, b: number): void => {
    c.reads += 2;
    judged++;
    if (history !== null) here_judged.push(a < b ? [a, b] : [b, a]);
    if (!meets(segments[a] as Segment, segments[b] as Segment, c)) return;
    const key = a < b ? a * n + b : b * n + a;
    c.reads += 1;
    if (seen.has(key)) return;
    seen.add(key);
    found.push(a < b ? [a, b] : [b, a]);
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
  while (events.length > 0) {
    const now = heapPop(events, c);
    while (events.length > 0 && cmpSpot(events[0] as Spot, now, c) === 0) {
      heapPop(events, c);
    }
    const here = spotKey(now);
    here_judged = [];
    for (const id of uprightLow.get(here) ?? []) {
      const v = segs[id] as Seg;
      for (const other of upright) check(id, other);
      const top: Spot = { x: v.hix, y: v.hiy, d: 1n };
      const to = firstAbove(top);
      for (let at = firstNotBelow(now); at < to; at++) {
        c.reads += 1;
        check(id, status[at] as number);
      }
      upright.push(id);
    }
    c.reads += 1;
    const starting = [...(startAt.get(here) ?? [])].sort(
      (x, y) => slopeOrder(segs[x] as Seg, segs[y] as Seg, c) || x - y,
    );
    for (const id of starting) {
      const at = firstNotBelow(now);
      status.splice(at, 0, id);
      c.reads += status.length - at;
      if (at > 0) check(status[at - 1] as number, id);
      if (at + 1 < status.length) check(id, status[at + 1] as number);
      for (const v of upright) check(id, v);
    }
    c.reads += 1;
    for (const id of endAt.get(here) ?? []) {
      const at = status.indexOf(id);
      c.reads += status.length;
      if (at < 0) continue;
      status.splice(at, 1);
      if (at > 0 && at < status.length) {
        check(status[at - 1] as number, status[at] as number);
      }
    }
    for (const id of uprightHigh.get(here) ?? []) {
      const at = upright.indexOf(id);
      c.reads += upright.length;
      if (at >= 0) upright.splice(at, 1);
    }
    history?.push({ now, status: [...status], judged: here_judged });
  }
  return { judged, pairs: found.length, ops: ops(c), found };
}

/** 두 직선이 만나는 자리 — 선분 안인지는 안 본다. 평행이면 `null`. */
export function lineMeet(a: Seg, b: Seg): Spot | null {
  let den = a.dx * b.dy - a.dy * b.dx;
  if (den === 0n) return null;
  let tn = (b.lox - a.lox) * b.dy - (b.loy - a.loy) * b.dx;
  if (den < 0n) {
    den = -den;
    tn = -tn;
  }
  return reduced(a.lox * den + tn * a.dx, a.loy * den + tn * a.dy, den);
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

/** 세로 선분의 y 범위 위끝을 사건점으로 바꾼 사본. 세로 선분이 위쪽을 못 본다. */
const shortUpright = await loadMutant<Impl>(REF, {
  swap: [TOP_LINE, "      const to = firstAbove(now);"],
});

/** 여기서 시작하는 선분을 안 모으는 사본. 끝점에서 닿는 짝이 사라진다. */
const noStarting = await loadMutant<Impl>(REF, {
  swap: [MEET_LINE, "    const meeting = [...through];"],
});

/** 기울기 대신 이름 순으로 세우는 사본. 교차점 뒤의 위아래가 안 뒤집힌다. */
const byName = await loadMutant<Impl>(REF, {
  swap: [SLOPE_LINE, "    ].sort((x, y) => x - y);"],
});

/** 위쪽 이웃을 예약하지 않는 사본. 위쪽에서 새로 생긴 이웃을 놓친다. */
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
    ["세로 범위를 사건점으로 정하는 판", shortUpright],
    ["시작하는 선분을 안 모으는 판", noStarting],
    ["이름 순으로 세우는 판", byName],
    ["위쪽 이웃을 예약하지 않는 판", noRight],
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

/** 정본과 변이의 답을 나란히 놓은 표. `reaches` 를 주면 바꾼 줄을 지나는지 열을 더한다. */
function contrast(
  cases: [string, Segment[]][],
  impl: Impl,
  head: string,
  reaches?: (segs: Segment[]) => boolean,
): { table: string; differ: number } {
  let differ = 0;
  const rows = cases.map(([label, segs]) => {
    const want = bentleyOttmann(segs);
    const got = impl.bentleyOttmann(segs);
    if (want !== got) differ++;
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
  if (reaches !== undefined) head2.splice(4, 0, "바꾼 줄");
  return { table: md(head2, rows, [1, 2, 3]), differ };
}

/** 그 배치가 세로 선분을 하나라도 갖는가 — 세로 갈래의 변이 줄을 지나는 조건이다. */
const hasUpright = (segs: Segment[]): boolean =>
  segs.some((s) => s[0][0] === s[1][0]);

/* ────────────────────────── 전개 입력의 기록 ────────────────────────── */

export const WALK_STEPS: Step[] = [];
export const WALK_RUN = measure(WALK, WALK_STEPS);
export const WALK_SEGS: Seg[] = WALK.map(toSeg);

/** 걸음 하나를 태그로 찾는다. */
export function stepAt(tag: string): Step {
  const s = WALK_STEPS.find((x) => x.tag === tag);
  if (s === undefined) throw new Error(`${tag} 걸음이 없다`);
  return s;
}

/** 걸음이 하는 일 — 무대 제목과 표가 같은 말을 쓴다. */
export function kindOf(s: Step): string {
  const parts: string[] = [];
  if (s.opening.length > 0) parts.push(`세로 열기 ${names(s.opening)}`);
  if (s.starting.length > 0) parts.push(`시작 ${names(s.starting)}`);
  if (s.ended.length > 0) parts.push(`끝 ${names(s.ended)}`);
  if (s.closing.length > 0) parts.push(`세로 닫기 ${names(s.closing)}`);
  return parts.length === 0 ? "교차" : parts.join(" · ");
}

/** 상태 배열 표기 — 비면 「(비어 있음)」. */
export const statusText = (ids: readonly number[]): string =>
  ids.length === 0 ? "(비어 있음)" : names(ids);

/** 경계 한 곳의 두 이웃 표기. */
export const edgePair = (p: readonly [number, number]): string =>
  `${nm(p[0])}–${nm(p[1])}`;

/** 예약 판정 한 번의 표기. */
export function checkText(k: Check): string {
  if (k.pair === null) return `${k.side} 경계 없음`;
  const pair = edgePair(k.pair);
  if (k.spot === null) return `${k.side} ${pair} 선분 안에서 안 만남`;
  return k.booked
    ? `${k.side} ${pair} ${spotText(k.spot)} 예약`
    : `${k.side} ${pair} ${spotText(k.spot)} 이미 지남`;
}

/** 교차 쌍 표기. */
export const pairText = (p: readonly [number, number]): string =>
  `${nm(p[0])}–${nm(p[1])}`;

/** 걸음마다 조건이 어떻게 판정됐는가 — 끝까지 실행하는 표와 무대 설명이 쓴다. */
export function branchText(s: Step): string {
  const parts: string[] = [];
  parts.push(
    s.opening.length > 0
      ? `① 세로 ${names(s.opening)} 범위 안 ${names(s.opened.flatMap((o) => o.hits))}`
      : "① 여는 세로 없음",
  );
  parts.push(`② 지나는 토막 ${names(s.through)} · 시작 ${names(s.starting)}`);
  parts.push(
    s.ended.length > 0
      ? `③ 끝 ${names(s.ended)} 빼고 다시 놓기`
      : "③ 다시 놓기",
  );
  if (s.closing.length > 0) parts.push(`④ 세로 닫기 ${names(s.closing)}`);
  parts.push(`⑤ ${s.checks.map(checkText).join(" · ")}`);
  return parts.join(" · ");
}

/* ────────────────────────── 블록 ────────────────────────── */

/** `concept` — 배치마다 두 절차의 답. */
function conceptCases(): string {
  const cases: [string, Segment[]][] = [
    ["평행하고 떨어져 있다", PARALLEL],
    ["같은 직선 위에서 겹친다", OVERLAP],
    ["세 선분이 한 점에서 만난다", TRIPLE],
    ["가로 둘과 세로 둘", LATTICE],
    ["전개 입력", WALK],
    ["흩어 놓은 길이 16 · 512", scattered(512, 16)],
    ["격자무늬 256", mesh(256)],
  ];
  let same = 0;
  const rows = cases.map(([label, segs]) => {
    const brute = allPairs(segs);
    const mine = bentleyOttmann(segs);
    if (brute.pairs === mine) same++;
    return [label, num(segs.length), num(brute.pairs), num(mine)];
  });
  return [
    md(["배치", "선분", "모든 쌍 판정의 답", "이 절차의 답"], rows, [1, 2, 3]),
    "",
    `${num(cases.length)} 배치 가운데 ${num(same)} 배치에서 두 답이 같습니다. 전개 입력의 답은 ${num(bentleyOttmann(WALK))} 쌍입니다.`,
  ].join("\n");
}

/** `deep.origin` ② — 모든 쌍 판정의 기본 연산. */
function originBrute(): string {
  const sizes = [5, 1_000, 10_000, MAX_N];
  const rows = sizes.map((n) => {
    const pairs = (n * (n - 1)) / 2;
    return [num(n), num(pairs), num(8 * pairs), seconds(8 * pairs)];
  });
  const walk = allPairs(WALK);
  const at = (MAX_N * (MAX_N - 1)) / 2;
  return [
    md(
      [
        "선분 n",
        "쌍 n(n−1)/2",
        "기본 연산의 하한 8 × 쌍",
        "시간(초당 1 억 번)",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `전개 입력 선분 ${num(WALK.length)} 개를 실제로 모두 판정하면 쌍 ${num(walk.judged)} 개에 기본 연산이 ${num(walk.ops)} 번이고, 교차하는 쌍은 ${num(walk.pairs)} 개입니다. 선분이 ${num(MAX_N)} 개면 쌍만 ${num(at)} 개라 기본 연산이 적어도 ${num(8 * at)} 번이고, 예산 1 초의 ${num(Math.round((8 * at) / PER_SECOND))} 배입니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — x 구간이 겹치는 짝만 판정하면. */
function originOverlap(): string {
  const cases: [string, Segment[]][] = [
    ["전개 입력", WALK],
    ["흩어 놓은 길이 16 · 512", scattered(512, 16)],
    ["가로로 나란한 512", flat(512)],
  ];
  const rows = cases.map(([label, segs]) => {
    const brute = allPairs(segs);
    const lap = byOverlap(segs);
    if (lap.pairs !== brute.pairs) {
      throw new Error(`x 구간 판이 ${label} 에서 답을 틀렸다`);
    }
    return [
      label,
      num(segs.length),
      num(brute.pairs),
      num(brute.judged),
      num(lap.judged),
      num(brute.ops),
      num(lap.ops),
    ];
  });
  const f = byOverlap(flat(512));
  return [
    md(
      [
        "배치",
        "선분",
        "교차 쌍",
        "모든 쌍 판정 · 판정한 짝",
        "x 구간 판 · 판정한 짝",
        "모든 쌍 판정 · 기본 연산",
        "x 구간 판 · 기본 연산",
      ],
      rows,
      [1, 2, 3, 4, 5, 6],
    ),
    "",
    `${num(cases.length)} 배치 모두 두 판의 답이 같습니다. 가로로 나란한 512 는 교차가 ${num(f.pairs)} 쌍인데, x 구간 판이 판정한 짝이 ${num(f.judged)} 개로 쌍 전부입니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — 스위프 선 몇 자리에서 세 선분의 y 와 순서. */
function originOrder(): string {
  const ids = [0, 1, 3];
  const xs = [1n, 3n, 5n];
  const rows = xs.map((x) => {
    const ys = ids.map((id) => yAt(WALK_SEGS[id] as Seg, x, 1n));
    const p: Spot = { x, y: 0n, d: 1n };
    const tied = ids.filter((a) =>
      ids.some(
        (b) =>
          b !== a &&
          yOrderAt(WALK_SEGS[a] as Seg, WALK_SEGS[b] as Seg, p) === 0,
      ),
    );
    const order = [...ids].sort((a, b) =>
      yOrderAt(WALK_SEGS[a] as Seg, WALK_SEGS[b] as Seg, p),
    );
    return [
      `x = ${x}`,
      ...ys,
      tied.length > 0
        ? `${names(tied)} 의 y 가 같다`
        : `아래부터 ${names(order)}`,
    ];
  });
  return [
    md(["스위프 선", "s0 의 y", "s1 의 y", "s3 의 y", "순서"], rows, [1, 2, 3]),
    "",
    "x = 1 에서 아래부터 s0 s1 s3 이던 순서가 x = 5 에서는 s1 s0 s3 입니다. 그 사이 x = 3 에서 s0 과 s1 의 y 가 같아지고, 그 자리가 두 선분의 교차점입니다.",
  ].join("\n");
}

/** `deep.origin` ④ — 끝점에서만 이웃을 보는 판. */
function originEndpoints(): string {
  const cases: [string, Segment[]][] = [
    ["전개 입력", WALK],
    ["가로로 나란한 512", flat(512)],
    ["s1 을 (12,-6) 까지 늘인 전개 입력", STRETCH],
  ];
  const rows = cases.map(([label, segs]) => {
    const brute = allPairs(segs);
    const ends = byEndpoints(segs);
    return [
      label,
      num(segs.length),
      num(brute.pairs),
      num(ends.pairs),
      num(ends.judged),
      num(ends.ops),
      brute.pairs === ends.pairs ? "맞다" : "틀린다",
    ];
  });
  const got = byEndpoints(STRETCH).found;
  const all: [number, number][] = [];
  for (let i = 0; i < STRETCH.length; i++) {
    for (let j = i + 1; j < STRETCH.length; j++) {
      if (segmentsIntersect(STRETCH[i] as Segment, STRETCH[j] as Segment)) {
        all.push([i, j]);
      }
    }
  }
  const missed = all.filter(
    ([a, b]) => !got.some(([x, y]) => x === a && y === b),
  );
  return [
    md(
      [
        "배치",
        "선분",
        "모든 쌍 판정의 답",
        "끝점 판의 답",
        "끝점 판 · 판정한 짝",
        "끝점 판 · 기본 연산",
        "답",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `s1 을 늘인 배치에서 끝점 판이 놓친 짝은 ${missed.map(pairText).join(" · ")} 입니다.`,
  ].join("\n");
}

/** `deep.origin` ④ — 늘인 배치에서 끝점 판이 든 배열과 그 x 의 실제 순서. */
function originStale(): string {
  const segs = STRETCH.map(toSeg);
  const history: EndpointEvent[] = [];
  byEndpoints(STRETCH, history);
  const truth = (p: Spot): number[] =>
    segs
      .filter(
        (g) =>
          !g.vertical &&
          cmp({ x: g.lox, y: g.loy, d: 1n }, p) <= 0 &&
          cmp(p, { x: g.hix, y: g.hiy, d: 1n }) < 0,
      )
      .map((g) => g.id)
      .sort(
        (a, b) =>
          yOrderAt(segs[a] as Seg, segs[b] as Seg, p) ||
          slopeOrder(segs[a] as Seg, segs[b] as Seg, Z()),
      );
  let differ = 0;
  const rows = history.map((h) => {
    const real = truth(h.now);
    const kept = statusText(h.status);
    const same = kept === statusText(real);
    if (!same) differ++;
    return [
      spotText(h.now),
      kept,
      statusText(real),
      h.judged.length === 0 ? "—" : h.judged.map(pairText).join(", "),
    ];
  });
  return [
    md(
      ["사건점", "끝점 판이 든 배열", "그 x 의 실제 아래부터", "판정한 짝"],
      rows,
    ),
    "",
    `사건점 ${num(history.length)} 개 가운데 ${num(differ)} 개에서 끝점 판의 배열이 실제 순서와 다르고, s0–s3 은 한 번도 판정한 짝에 들지 않습니다.`,
  ].join("\n");
}

/** `deep.build` 개념 (c) — 스위프 선 x = 1 에서 상태 배열의 칸을 읽는다. */
function buildRead(): string {
  const p: Spot = { x: 1n, y: 0n, d: 1n };
  const ids = [0, 1, 3].sort((a, b) =>
    yOrderAt(WALK_SEGS[a] as Seg, WALK_SEGS[b] as Seg, p),
  );
  const rows = ids.map((id, at) => {
    const s = WALK_SEGS[id] as Seg;
    return [
      `${at}`,
      nm(id),
      seg(WALK[id] as Segment),
      slopeText(s),
      yAt(s, 1n, 1n),
    ];
  });
  return [
    md(["칸", "선분", "끝점", "기울기", "x = 1 에서의 y"], rows, [0, 4]),
    "",
    `x = 1 의 상태 배열은 ${names(ids)} 이고, 칸 번호가 커질수록 y 가 커집니다. 세로 선분 s2 와 x 가 9 부터인 s4 는 이 스위프 선 위의 칸에 없습니다.`,
  ].join("\n");
}

/** `deep.build` 개념 (d) — 스위프 선이 옮겨 가며 이웃 짝과 그 교차점. */
function buildNeighbors(): string {
  const ids = [0, 1, 3];
  const xs: [bigint, bigint][] = [
    [1n, 1n],
    [4n, 1n],
    [11n, 2n],
  ];
  const rows = xs.map(([xn, xd]) => {
    const p: Spot = { x: xn, y: 0n, d: xd };
    const order = [...ids].sort((a, b) =>
      yOrderAt(WALK_SEGS[a] as Seg, WALK_SEGS[b] as Seg, p),
    );
    const pairs = order
      .slice(1)
      .map((b, k) => [order[k] as number, b] as const);
    const ahead = pairs.flatMap(([a, b]) => {
      const q = crossingSpot(WALK_SEGS[a] as Seg, WALK_SEGS[b] as Seg, Z());
      return q !== null && cmp(q, p) > 0
        ? [`${pairText([a, b])} ${spotText(q)}`]
        : [];
    });
    return [
      `x = ${frac(xn, xd)}`,
      names(order),
      pairs.map((q) => pairText(q)).join(", "),
      ahead.length === 0 ? "없다" : ahead.join(", "),
    ];
  });
  return [
    md(
      ["스위프 선", "상태 배열", "이웃한 짝", "오른쪽에서 만나는 이웃 짝"],
      rows,
    ),
    "",
    "s0–s1 은 x = 1 에서, s0–s3 은 x = 4 에서 이웃이고, 둘 다 그 오른쪽에 교차점이 있습니다. x = 11/2 에서는 두 교차점을 다 지나 오른쪽에서 만날 이웃 짝이 없습니다.",
  ].join("\n");
}

/** `deep.build` 개념 (e) — 왼쪽 끝점의 y 로 세운 순서와 스위프 선 위의 순서. */
function buildStatic(): string {
  const ids = [0, 1, 3];
  const p: Spot = { x: 5n, y: 0n, d: 1n };
  const byStart = [...ids].sort(
    (a, b) =>
      Number((WALK_SEGS[a] as Seg).loy) - Number((WALK_SEGS[b] as Seg).loy),
  );
  const onLine = [...ids].sort((a, b) =>
    yOrderAt(WALK_SEGS[a] as Seg, WALK_SEGS[b] as Seg, p),
  );
  const row = (label: string, order: number[]) => {
    const pairs = order
      .slice(1)
      .map((b, k) => [order[k] as number, b] as const);
    const crossing = pairs.filter(([a, b]) =>
      segmentsIntersect(WALK[a] as Segment, WALK[b] as Segment),
    );
    return [
      label,
      names(order),
      pairs.map(pairText).join(", "),
      crossing.length === 0 ? "없다" : crossing.map(pairText).join(", "),
    ];
  };
  const q = crossingSpot(WALK_SEGS[0] as Seg, WALK_SEGS[3] as Seg, Z()) as Spot;
  return [
    md(
      ["순서를 정하는 값", "아래부터", "이웃한 짝", "그중 교차하는 짝"],
      [row("왼쪽 끝점의 y", byStart), row("x = 5 에서 지나는 y", onLine)],
    ),
    "",
    `같은 세 선분인데 이웃한 짝이 다릅니다. s0–s3 은 스위프 선 위의 순서에서만 이웃이고, 두 선분은 ${spotText(q)} 에서 만납니다.`,
  ].join("\n");
}

/** `deep.build` 1단계 — 다섯 선분의 끝점을 사전순으로. */
function buildNormalize(): string {
  const rows = WALK.map((s, id) => {
    const g = WALK_SEGS[id] as Seg;
    return [
      nm(id),
      seg(s),
      `(${g.lox},${g.loy})`,
      `(${g.hix},${g.hiy})`,
      slopeText(g),
    ];
  });
  const verticals = names(WALK_SEGS.filter((g) => g.vertical).map((g) => g.id));
  return [
    md(["선분", "입력", "앞선 끝점 lo", "뒤 끝점 hi", "기울기"], rows),
    "",
    `끝점 둘 가운데 x 가 작은 쪽, x 가 같으면 y 가 작은 쪽이 lo 입니다. ${verticals}${은는(verticals)} 두 끝점의 x 가 같아 세로 선분이고, 사건 큐에 처음 들어가는 끝점은 ${num(2 * WALK.length)} 개입니다.`,
  ].join("\n");
}

/** `deep.build` 2단계 — 분수 자리 둘의 앞뒤를 곱으로 정한다. */
function buildOrder(): string {
  const a = stepAt("T6").now;
  const b = stepAt("T7").now;
  const e = stepAt("T8").now;
  const row = (p: Spot, q: Spot) => {
    const r = cmp(p, q);
    return [
      `${spotText(p)} · ${spotText(q)}`,
      `${p.x} × ${q.d} = ${p.x * q.d}`,
      `${q.x} × ${p.d} = ${q.x * p.d}`,
      r < 0 ? "앞 자리가 먼저" : r > 0 ? "뒤 자리가 먼저" : "같은 자리",
    ];
  };
  return [
    md(
      [
        "두 자리",
        "앞 자리 x 분자 × 뒤 자리 분모",
        "뒤 자리 x 분자 × 앞 자리 분모",
        "꺼낼 차례",
      ],
      [row(a, b), row(b, e)],
    ),
    "",
    "두 자리의 x 를 비교할 때 서로의 분모를 곱해 맞추면 나눗셈 없이 정수 둘의 비교가 됩니다. 분모가 늘 양수라 곱해도 부등호 방향이 안 바뀝니다.",
  ].join("\n");
}

/** `deep.build` 2단계 — 같은 자리를 여러 번 넣어도 한 번만 처리한다. */
function buildDedupe(): string {
  const cases: [string, Segment[]][] = [
    ["전개 입력", WALK],
    ["세 선분이 한 점에서 만난다", TRIPLE],
    ["한 점에 여덟 갈래", star(8)],
  ];
  const rows = cases.map(([label, segs]) => {
    const t = measure(segs);
    return [label, num(segs.length), num(t.pushed), num(t.spot), num(t.pairs)];
  });
  const s8 = measure(star(8));
  return [
    md(
      ["배치", "선분", "사건 큐에 넣은 횟수", "처리한 사건점", "교차 쌍"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `한 점에 여덟 갈래에서는 사건 큐에 ${num(s8.pushed)} 번 넣었는데 처리한 사건점은 ${num(s8.spot)} 개입니다. 같은 자리를 꺼낼 때 한꺼번에 꺼내 버리므로 교차점 하나를 한 번만 처리합니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — T6 의 사건점에서 방향 판정으로 토막을 잡는다. */
function buildThrough(): string {
  const s = stepAt("T6");
  const rows = s.before.map((id, at) => {
    const v = orient(WALK_SEGS[id] as Seg, s.now, Z());
    return [
      `${at}`,
      nm(id),
      `${v}`,
      v > 0
        ? "사건점이 선분보다 위"
        : v < 0
          ? "사건점이 선분보다 아래"
          : "사건점이 선분 위",
    ];
  });
  const block = names(s.through);
  return [
    md(["칸", "선분", "방향 판정", "뜻"], rows, [0, 2]),
    "",
    `사건점 ${spotText(s.now)} 에서 방향 판정이 0 인 칸이 이어진 토막은 ${block}${josa(block, "이고", "고")}, 토막 안의 짝은 전부 이 점에서 만납니다.`,
  ].join("\n");
}

/** `deep.build` 4단계 — T6 에서 토막을 기울기 순으로 다시 놓는다. */
function buildReorder(): string {
  const s = stepAt("T6");
  const rows = s.after.map((id, at) => [
    `${at}`,
    nm(id),
    slopeText(WALK_SEGS[id] as Seg),
  ]);
  const through = names(s.through);
  const after = names(s.after);
  const status = statusText(s.status);
  return [
    md(["새 토막의 칸", "선분", "기울기"], rows, [0, 2]),
    "",
    `걸음 전 상태 배열 ${statusText(s.before)} 에서 토막 ${through}${을를(through)} 기울기 오름차순 ${after}${으로(after)} 갈아 끼우면 ${status}${이가(status)} 됩니다.`,
  ].join("\n");
}

/** `deep.build` 5단계 — 경계에서 두 이웃의 교차점. */
function buildBook(): string {
  const picks: [string, Check][] = [];
  for (const tag of ["T2", "T3", "T6"]) {
    const s = stepAt(tag);
    for (const k of s.checks) if (k.pair !== null) picks.push([tag, k]);
  }
  const rows = picks.map(([tag, k]) => {
    const [a, b] = k.pair as readonly [number, number];
    const line = lineMeet(WALK_SEGS[a] as Seg, WALK_SEGS[b] as Seg);
    return [
      tag,
      `${k.side} 경계`,
      edgePair([a, b]),
      line === null ? "평행" : spotText(line),
      k.spot === null ? "선분 밖" : "두 선분 안",
      k.booked ? "넣는다" : "안 넣는다",
    ];
  });
  return [
    md(
      [
        "걸음",
        "경계",
        "두 이웃",
        "두 직선이 만나는 자리",
        "그 자리",
        "사건 큐에",
      ],
      rows,
    ),
    "",
    "두 직선이 만나는 자리가 두 선분 안에 있고 지금 사건점보다 뒤일 때만 사건 큐에 넣습니다.",
  ].join("\n");
}

/** `deep.build` 6단계 — 세로 선분 s2 가 열릴 때 x = 2 에서 각 선분의 y. */
function buildUpright(): string {
  const v = WALK_SEGS[2] as Seg;
  const rows: string[][] = [];
  for (const g of WALK_SEGS) {
    if (g.vertical) continue;
    if (g.lox > v.lox || g.hix < v.lox) continue;
    const yn = g.loy * g.dx + g.dy * (v.lox - g.lox);
    const inside = yn >= v.loy * g.dx && yn <= v.hiy * g.dx;
    rows.push([nm(g.id), yAt(g, v.lox, 1n), inside ? "범위 안" : "범위 밖"]);
  }
  const hits = rows.filter((r) => r[2] === "범위 안").map((r) => r[0]);
  return [
    md(
      ["선분", `x = ${v.lox} 에서의 y`, `s2 의 y 범위 [${v.loy}, ${v.hiy}]`],
      rows,
      [1],
    ),
    "",
    `범위 안에 든 선분은 ${hits.join(" ")} ${num(hits.length)} 개이고, 상태 배열에서 이어진 칸에 놓여 있습니다.`,
  ].join("\n");
}

/** `deep.walk` 도입부 — 고정 입력. */
function walkInput(): string {
  const lines = WALK.map(
    (s) => `  [[${s[0][0]}, ${s[0][1]}], [${s[1][0]}, ${s[1][1]}]],`,
  );
  return [
    "const segments: Segment[] = [",
    ...lines,
    "];",
    `// 이 절이 끝나면 교차 쌍 ${bentleyOttmann(WALK)}${이가(bentleyOttmann(WALK))} 나와야 한다`,
  ].join("\n");
}

/** `deep.walk` 1. — 처음 사건 큐에 넣은 끝점 열 개를 꺼낼 차례대로. */
function walkQueue(): string {
  const spots: [string, Spot][] = [];
  for (const g of WALK_SEGS) {
    spots.push([`${nm(g.id)} lo`, { x: g.lox, y: g.loy, d: 1n }]);
    spots.push([`${nm(g.id)} hi`, { x: g.hix, y: g.hiy, d: 1n }]);
  }
  spots.sort((a, b) => cmp(a[1], b[1]));
  const rows = spots.map(([label, p], at) => [num(at + 1), spotText(p), label]);
  return [
    md(["꺼낼 차례", "사건점", "끝점"], rows, [0]),
    "",
    `처음 사건 큐에 든 것은 끝점 ${num(spots.length)} 개이고, 교차점은 아직 하나도 없습니다.`,
  ].join("\n");
}

/** `deep.walk` 2. — T1~T3, 상태 배열이 세워지는 자리. */
function walkInsert(): string {
  const steps = WALK_STEPS.slice(0, 3);
  const rows = steps.map((s) => [
    s.tag,
    spotText(s.now),
    kindOf(s),
    statusText(s.status),
    s.checks.map(checkText).join(" · "),
  ]);
  const first = steps.find((s) => s.booked.length > 0) as Step;
  return [
    md(["걸음", "사건점", "하는 일", "걸음 뒤 status", "⑤ 예약 판정"], rows),
    "",
    `x = 0 의 끝점 ${num(steps.length)} 개가 y 가 작은 것부터 들어가고, 예약이 붙는 걸음은 ${first.tag} 하나입니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — T 자 배치에서 두 선분이 공유하는 점. */
function pauseTee(): string {
  const segs = TEE.map(toSeg);
  const a = segs[0] as Seg;
  const b = segs[1] as Seg;
  const start: Spot = { x: b.lox, y: b.loy, d: 1n };
  const rows = [b.lox, b.hix].map((x) => [
    `x = ${x}`,
    yAt(a, x, 1n),
    yAt(b, x, 1n),
  ]);
  return [
    md(["스위프 선", "s0 의 y", "s1 의 y"], rows, [1, 2]),
    "",
    `s1 이 시작하는 점 ${spotText(start)} 이 s0 위에 있고, 그 오른쪽에서는 두 선분의 y 가 갈립니다. 두 선분이 공유하는 점은 ${spotText(start)} 하나뿐입니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — 여기서 시작하는 선분을 안 모아 보면. */
function pauseStart(): string {
  const r = contrast(
    [
      ["T 자로 만난다", TEE],
      ["끝점끼리 이어 붙는다", CHAIN],
      ["같은 직선 위에서 겹친다", OVERLAP],
      ["전개 입력", WALK],
      ["가로 둘과 세로 둘", LATTICE],
    ],
    noStarting,
    "안 모으는 판",
  );
  return [
    r.table,
    "",
    `5 배치 가운데 ${num(r.differ)} 배치에서 답이 어긋납니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — 세로 선분의 y 범위를 사건점으로 잘라 보면. */
function pauseUpright(): string {
  const cases: [string, Segment[]][] = [
    ["가로 둘과 세로 둘", LATTICE],
    ["전개 입력", WALK],
    ["세 선분이 한 점에서 만난다", TRIPLE],
    ["같은 직선 위에서 겹친다", OVERLAP],
    ["평행하고 떨어져 있다", PARALLEL],
  ];
  const r = contrast(cases, shortUpright, "위끝을 바꾼 판", hasUpright);
  const skipped = cases.filter(([, segs]) => !hasUpright(segs)).length;
  return [
    r.table,
    "",
    `5 배치 가운데 ${num(r.differ)} 배치에서 답이 어긋납니다. 아래 ${num(skipped)} 배치는 세로 선분이 없어 바꾼 줄을 지나지 않습니다.`,
  ].join("\n");
}

/** `deep.walk` 3. — T4·T5, 세로 선분을 여닫는 자리. */
function walkUpright(): string {
  const rows = ["T4", "T5"].map((tag) => {
    const s = stepAt(tag);
    return [
      s.tag,
      spotText(s.now),
      kindOf(s),
      s.opened.length > 0 ? names(s.opened.flatMap((o) => o.hits)) : "—",
      names(s.upright),
      num(s.pairs),
    ];
  });
  const status = statusText(stepAt("T5").status);
  return [
    md(
      ["걸음", "사건점", "하는 일", "범위 안", "걸음 뒤 upright", "pairs"],
      rows,
      [5],
    ),
    "",
    `T4 에서 교차 쌍 ${num(stepAt("T4").fresh.length)} 개를 한꺼번에 세고, T5 에서 세로 선분을 닫습니다. 상태 배열은 두 걸음 모두 ${status} 그대로입니다.`,
  ].join("\n");
}

/** `deep.walk` 4. — T6·T7, 교차점에서 순서가 뒤집히는 자리. */
function walkCross(): string {
  const rows = ["T6", "T7"].map((tag) => {
    const s = stepAt(tag);
    return [
      s.tag,
      spotText(s.now),
      names(s.through),
      statusText(s.status),
      s.booked.length === 0 ? "—" : s.booked.map(spotText).join(" "),
      num(s.pairs),
    ];
  });
  const q1 = stepAt("T6").now;
  const q2 = stepAt("T7").now;
  const den = `${q2.d}`;
  return [
    md(
      ["걸음", "사건점", "through", "걸음 뒤 status", "예약", "pairs"],
      rows,
      [5],
    ),
    "",
    "두 교차점을 정수 셋으로 적으면 이렇습니다.",
    "",
    md(
      ["교차점", "x 분자", "y 분자", "분모"],
      [
        [spotText(q1), `${q1.x}`, `${q1.y}`, `${q1.d}`],
        [spotText(q2), `${q2.x}`, `${q2.y}`, `${q2.d}`],
      ],
      [1, 2, 3],
    ),
    "",
    `교차점 ${spotText(q2)} 의 분모가 ${den}${josa(den, "이라", "라")} 배정밀도 수로는 딱 떨어지게 담기지 않습니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — 위쪽 이웃을 예약하지 않아 보면. */
function pauseRight(): string {
  const r = contrast(
    [
      ["셋이 서로 다 교차한다", TANGLE],
      ["전개 입력", WALK],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["가로 둘과 세로 둘", LATTICE],
      ["T 자로 만난다", TEE],
    ],
    noRight,
    "아래만 보는 판",
  );
  return [
    r.table,
    "",
    `5 배치 가운데 ${num(r.differ)} 배치에서 답이 어긋납니다.`,
  ].join("\n");
}

/** `deep.walk` 5. — 열두 걸음 전부. */
function walkTrace(): string {
  const rows = WALK_STEPS.map((s) => [
    s.tag,
    spotText(s.now),
    kindOf(s),
    branchText(s),
    statusText(s.status),
    num(s.pairs),
  ]);
  const booked = WALK_STEPS.filter((s) => s.booked.length > 0).map(
    (s) => s.tag,
  );
  const scored = WALK_STEPS.filter((s) => s.fresh.length > 0).map((s) => s.tag);
  return [
    md(
      ["걸음", "사건점", "하는 일", "조건 판정", "걸음 뒤 status", "pairs"],
      rows,
      [5],
    ),
    "",
    `사건점 ${num(WALK_RUN.spot)} 개를 처리하는 동안 기본 연산이 ${num(WALK_RUN.ops)} 번이고, 답은 ${num(WALK_RUN.pairs)} 입니다. 교차 쌍을 센 걸음은 ${scored.join(" · ")} 이고, 교차점을 예약한 걸음은 ${booked.join(" · ")} 입니다.`,
  ].join("\n");
}

/** `deep.walk.final` — 호출 몇 개. */
function finalCalls(): string {
  const calls: [string, Segment[]][] = [
    ["[]", []],
    [
      "[[[0, 0], [4, 4]], [[0, 4], [4, 0]]]",
      [
        [
          [0, 0],
          [4, 4],
        ],
        [
          [0, 4],
          [4, 0],
        ],
      ],
    ],
    ["[[[0, 0], [2, 0]], [[2, 0], [4, 2]]]", CHAIN],
    ["[[[0, 0], [4, 0]], [[2, 0], [6, 0]]]", OVERLAP],
    ["segments", WALK],
  ];
  const head = calls.map(([arg]) => `bentleyOttmann(${arg})`);
  const w = Math.max(...head.map((h) => h.length));
  return calls
    .map(
      ([, segs], at) =>
        `${(head[at] as string).padEnd(w)}  →  ${bentleyOttmann(segs)}`,
    )
    .join("\n");
}

/** `related` — 선분 수를 고정하고 교차 쌍만 늘리면. */
function relatedOutput(): string {
  const lengths = [16, 128, 1_024, 4_096];
  const got = lengths.map((len) => {
    const segs = scattered(512, len);
    return { len, m: measure(segs), brute: allPairs(segs) };
  });
  const rows = got.map(({ len, m, brute }) => [
    `흩어 놓은 길이 ${num(len)}`,
    num(m.pairs),
    num(m.spot),
    num(m.ops),
    num(brute.ops),
  ]);
  const lo = got[0] as (typeof got)[number];
  const hi = got[got.length - 1] as (typeof got)[number];
  const k = num(hi.m.pairs);
  return [
    md(
      [
        "배치(선분 512)",
        "교차 쌍 k",
        "사건점",
        "이 절차의 기본 연산",
        "모든 쌍 판정의 기본 연산",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `선분 수는 네 줄 모두 512 입니다. 교차 쌍이 ${num(lo.m.pairs)} 에서 ${k}${으로(k)} 늘 때 이 절차의 기본 연산은 ${(hi.m.ops / lo.m.ops).toFixed(2)} 배가 되고, 모든 쌍 판정은 ${(hi.brute.ops / lo.brute.ops).toFixed(2)} 배입니다.`,
  ].join("\n");
}

/** `deep.math` ② — 전개 입력의 s0 과 s3 에 교점 식을 넣어 검산한다. */
function mathVerify(): string {
  const a = WALK_SEGS[0] as Seg;
  const b = WALK_SEGS[3] as Seg;
  const D = a.dx * b.dy - a.dy * b.dx;
  const wx = b.lox - a.lox;
  const wy = b.loy - a.loy;
  const tn = wx * b.dy - wy * b.dx;
  const un = wx * a.dy - wy * a.dx;
  const q = crossingSpot(a, b, Z()) as Spot;
  const rows = [
    ["A₀ · r_a", `(${a.lox},${a.loy}) · (${a.dx},${a.dy})`],
    ["B₀ · r_b", `(${b.lox},${b.loy}) · (${b.dx},${b.dy})`],
    ["D = r_a × r_b", `${a.dx}·(${b.dy}) − ${a.dy}·${b.dx} = ${D}`],
    ["w = B₀ − A₀", `(${wx},${wy})`],
    ["w × r_b", `${wx}·(${b.dy}) − ${wy}·${b.dx} = ${tn}`],
    ["t = (w × r_b) / D", frac(tn, D)],
    ["w × r_a", `${wx}·${a.dy} − ${wy}·${a.dx} = ${un}`],
    ["u = (w × r_a) / D", frac(un, D)],
    ["A₀ + t · r_a", spotText(q)],
  ];
  const y = spotY(q);
  return [
    md(["항", "값"], rows),
    "",
    `t 와 u 가 둘 다 0 과 1 사이라 교점이 두 선분 안쪽이고, 교점은 ${spotText(q)}${josa(y, "으로", "로")} 전개의 ${stepAt("T7").tag} 사건점과 같습니다.`,
  ].join("\n");
}

/** `deep.math` ② — 사건점 수의 정의를 작은 값에 넣어 검산한다. */
function mathCheck(): string {
  const cases: [string, Segment[]][] = [
    ["평행하고 떨어져 있다", PARALLEL],
    ["세 선분이 한 점에서 만난다", TRIPLE],
    ["전개 입력", WALK],
    ["가로 둘과 세로 둘", LATTICE],
    ["셋이 서로 다 교차한다", TANGLE],
  ];
  let ok = 0;
  let equal = 0;
  const rows = cases.map(([label, segs]) => {
    const c = measure(segs);
    const ends = new Set<string>();
    for (const s of segs) {
      ends.add(`${s[0][0]},${s[0][1]}`);
      ends.add(`${s[1][0]},${s[1][1]}`);
    }
    const crossings = c.spot - ends.size;
    if (ends.size + crossings === c.spot) ok++;
    if (ends.size === 2 * segs.length) equal++;
    return [
      label,
      num(segs.length),
      num(2 * segs.length),
      num(ends.size),
      num(crossings),
      num(c.spot),
    ];
  });
  return [
    md(
      ["배치", "n", "2n", "끝점 자리 P", "끝점이 아닌 교차점 Q", "E"],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `${num(cases.length)} 배치 가운데 ${num(ok)} 배치에서 E 가 P 와 Q 의 합이고, ${num(equal)} 배치에서 P 가 2n 과 같습니다.`,
  ].join("\n");
}

/** `deep.math` ④ — 교차점의 분자·분모가 좌표 상한의 몇 제곱인가. */
function mathDigits(): string {
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
    [
      "자리 대소의 곱",
      "192C⁵",
      `${cmpBound}`,
      `${cmpBound.toString(2).length}`,
    ],
    ["배정밀도 정수 한계", "2^53", `${safe}`, `${safe.toString(2).length}`],
  ];
  return [
    md(["값", "닫힌 형태", "C = 10^9 에서", "비트"], rows, [2, 3]),
    "",
    `좌표 상한 ${num(MAX_C)} 안에 흩은 선분 ${num(wide.length)} 개를 실제로 실행하면 가장 큰 교차점 분자가 ${measured.bigNum}, 분모가 ${measured.bigDen} 입니다. 자리 대소를 재는 곱의 상한은 배정밀도 정수 한계의 ${Number(cmpBound / safe).toExponential(2)} 배입니다.`,
  ].join("\n");
}

/** `deep.math` ④ — 과제 규모를 넣어 사건점 수와 그 로그를 낸다. */
function mathCount(): string {
  const n = MAX_N;
  const row = (label: string, k: number) => {
    const e = 2 * n + k;
    const lg = Math.ceil(Math.log2(e));
    return [label, num(k), num(e), num(lg), (e * lg).toExponential(2)];
  };
  const rows = [
    row("교차가 없다", 0),
    row("교차가 n 개", n),
    row("교차가 n ⌈log₂ n⌉ 개", n * Math.ceil(Math.log2(n))),
    row("교차가 최대", (n * (n - 1)) / 2),
  ];
  return [
    md(
      ["k 의 크기", "k", "E 의 상한 2n + k", "⌈log₂ E⌉", "E · ⌈log₂ E⌉"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `선분 수 ${num(n)} 을 넣은 값입니다. 교차가 없으면 사건점이 ${num(2 * n)} 개이고, 교차가 최대이면 답 k 자체가 ${num((n * (n - 1)) / 2)} 입니다.`,
  ].join("\n");
}

/** `invariant` ② — 걸음마다 상태 배열이 그 자리 뒤의 y 순서인가. */
function invariantStates(): string {
  const rows = WALK_STEPS.map((s) => [
    s.tag,
    spotText(s.now),
    kindOf(s),
    statusText(s.status),
    s.sorted ? "지킨다" : "어긋난다",
  ]);
  const others: [string, Segment[]][] = [
    ["가로 둘과 세로 둘", LATTICE],
    ["세 선분이 한 점에서 만난다", TRIPLE],
    ["같은 직선 위에서 겹친다", OVERLAP],
    ["기울기가 뒤집히는 셋", SLOPE_FLIP],
    ["셋이 서로 다 교차한다", TANGLE],
    ["흩어 놓은 길이 16 · 512", scattered(512, 16)],
    ["격자무늬 64", mesh(64)],
  ];
  const got = others.map(([label, segs]) => ({ label, c: measure(segs) }));
  const otherRows = got.map(({ label, c }) => [
    label,
    num(c.spot),
    num(c.broken),
  ]);
  const kept = WALK_STEPS.filter((s) => s.sorted).length;
  const broken = got.reduce((a, { c }) => a + c.broken, 0);
  return [
    md(["걸음", "사건점", "하는 일", "걸음 뒤 status", "불변식"], rows),
    "",
    "다른 배치도 걸음마다 같은 검사를 했습니다.",
    "",
    md(["배치", "걸음", "어긋난 걸음"], otherRows, [1, 2]),
    "",
    `전개 입력 ${num(WALK_STEPS.length)} 걸음 가운데 ${num(kept)} 걸음에서 불변식이 지켜지고, 다른 ${num(others.length)} 배치에서 어긋난 걸음은 모두 합쳐 ${num(broken)} 개입니다.`,
  ].join("\n");
}

/** `invariant` ② — 경계 입력. */
function invariantEdges(): string {
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
  let same = 0;
  const rows = cases.map(([label, segs]) => {
    const brute = allPairs(segs);
    const got = bentleyOttmann(segs);
    if (got === brute.pairs) same++;
    return [
      label,
      num(segs.length),
      num(got),
      num(brute.pairs),
      got === brute.pairs ? "같다" : "어긋난다",
    ];
  });
  return [
    md(["배치", "선분", "정본", "모든 쌍 판정", "대조"], rows, [1, 2, 3]),
    "",
    `${num(cases.length)} 배치 가운데 ${num(same)} 배치에서 모든 쌍 판정과 답이 같습니다. 여덟 선분을 한 점에 모으거나 같은 직선에 겹쳐 쌓으면 ${num((8 * 7) / 2)} 쌍이 전부 교차입니다.`,
  ].join("\n");
}

/** `invariant` ③ — 순서를 세우는 그 줄을 이름 순으로 바꿔 보면. */
function mutantNameOrder(): string {
  const r = contrast(
    [
      ["기울기가 뒤집히는 셋", SLOPE_FLIP],
      ["셋이 서로 다 교차한다", TANGLE],
      ["전개 입력", WALK],
      ["세 선분이 한 점에서 만난다", TRIPLE],
      ["같은 직선 위에서 겹친다", OVERLAP],
    ],
    byName,
    "이름 순 판",
  );
  return [
    r.table,
    "",
    `5 배치 가운데 ${num(r.differ)} 배치에서 답이 어긋납니다.`,
  ].join("\n");
}

/** `perf.derive` — 전개 입력의 준비와 걸음마다 기본 연산 · 칸. */
function perfCount(): string {
  const steps = WALK_RUN.perStep;
  const setup = steps[0] as { ops: number; cells: number };
  const rows: string[][] = [
    [
      "준비",
      `끝점 ${num(2 * WALK.length)} 개를 사건 큐에`,
      num(setup.ops),
      num(setup.cells),
    ],
  ];
  let heaviest = { tag: "", d: -1 };
  for (const [at, s] of WALK_STEPS.entries()) {
    const cur = steps[at + 1] as { ops: number; cells: number };
    const prev = steps[at] as { ops: number; cells: number };
    const d = cur.ops - prev.ops;
    if (d > heaviest.d) heaviest = { tag: s.tag, d };
    rows.push([s.tag, kindOf(s), num(d), num(cur.cells - prev.cells)]);
  }
  return [
    md(["걸음", "하는 일", "기본 연산", "추가로 잡는 칸"], rows, [2, 3]),
    "",
    `합은 기본 연산 ${num(WALK_RUN.ops)} 번 · 추가로 잡는 칸 ${num(WALK_RUN.cells)} 칸이고, 준비의 몫이 기본 연산 ${num(setup.ops)} 번입니다. 걸음 가운데 기본 연산이 가장 많은 걸음은 ${heaviest.tag} 입니다.`,
  ].join("\n");
}

/** `perf.derive` — 밀도를 고정한 가족에서 선분 수를 키우며. */
function perfGrowth(): string {
  const sizes = [512, 1_024, 2_048, 4_096];
  const got = sizes.map((n) => measure(sparse(n)));
  const rows = sizes.map((n, at) => {
    const c = got[at] as Measured;
    const prevN = sizes[at - 1];
    const prev = got[at - 1];
    return [
      num(n),
      num(c.pairs),
      num(c.spot),
      num(c.ops),
      prev === undefined ? "—" : (c.ops / prev.ops).toFixed(2),
      prevN === undefined
        ? "—"
        : ((n * Math.log2(n)) / (prevN * Math.log2(prevN))).toFixed(2),
      num(c.cells),
    ];
  });
  return [
    md(
      [
        "선분",
        "교차 쌍",
        "사건점 E",
        "기본 연산",
        "앞 줄의 몇 배",
        "n log₂ n 의 몇 배",
        "추가로 잡는 칸",
      ],
      rows,
      [0, 1, 2, 3, 4, 5, 6],
    ),
    "",
    "길이 16 인 선분을 한 변이 64√n 인 상자에 흩은 가족이라, 선분을 2 배로 해도 한 선분이 만나는 이웃의 수가 거의 안 변합니다.",
  ].join("\n");
}

/** `perf.worst` — 선분 64 개의 배치 여섯. */
function worstShape(): string {
  const cases: [string, Segment[]][] = [
    ["가로로 나란한 64", flat(64)],
    ["흩어 놓은 길이 16 · 64", scattered(64, 16)],
    ["흩어 놓은 길이 1024 · 64", scattered(64, 1_024)],
    ["한 점에 64 갈래", star(64)],
    ["같은 직선에 64 겹", stack(64)],
    ["격자무늬 64", mesh(64)],
  ];
  const got = cases.map(([label, segs]) => ({ label, c: measure(segs) }));
  const rows = got.map(({ label, c }) => [
    label,
    num(c.pairs),
    num(c.spot),
    num(c.queue),
    num(c.status),
    num(c.ops),
    num(c.cells),
  ]);
  const most = got.reduce((a, b) => (b.c.ops > a.c.ops ? b : a));
  const least = got.reduce((a, b) => (b.c.ops < a.c.ops ? b : a));
  return [
    md(
      [
        "배치",
        "교차 쌍",
        "사건점",
        "큐 최대",
        "status 최대",
        "기본 연산",
        "추가로 잡는 칸",
      ],
      rows,
      [1, 2, 3, 4, 5, 6],
    ),
    "",
    `선분 64 개의 쌍은 ${num((64 * 63) / 2)} 개입니다. 기본 연산이 가장 많은 배치는 「${most.label}」 의 ${num(most.c.ops)} 번이고, 가장 적은 배치는 「${least.label}」 의 ${num(least.c.ops)} 번입니다.`,
  ].join("\n");
}

/** `selfcheck` — T3 과 T6 의 경계에서 한 판정. */
function selfcheckBoundary(): string {
  const rows: string[][] = [];
  for (const tag of ["T3", "T6"]) {
    const s = stepAt(tag);
    for (const k of s.checks) {
      if (k.pair === null) {
        rows.push([tag, statusText(s.status), `${k.side} 경계`, "없다", "—"]);
        continue;
      }
      const line = lineMeet(
        WALK_SEGS[k.pair[0]] as Seg,
        WALK_SEGS[k.pair[1]] as Seg,
      );
      rows.push([
        tag,
        statusText(s.status),
        `${k.side} 경계`,
        edgePair(k.pair),
        line === null
          ? "평행"
          : `${spotText(line)} ${k.booked ? "— 예약" : "— 선분 밖"}`,
      ]);
    }
  }
  return [
    md(
      ["걸음", "걸음 뒤 status", "경계", "두 이웃", "두 직선이 만나는 자리"],
      rows,
    ),
    "",
    "T6 에서 새로 맞닿은 짝은 위 경계 하나이고, s1–s3 은 T3 에서 이미 이웃이었습니다.",
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 배치마다 두 절차의 답. */
  "concept-cases": conceptCases,
  /** `deep.origin` ② — 모든 쌍 판정. */
  "origin-brute": originBrute,
  /** `deep.origin` ③ — x 구간이 겹치는 짝만. */
  "origin-overlap": originOverlap,
  /** `deep.origin` ③ — 스위프 선 위의 순서. */
  "origin-order": originOrder,
  /** `deep.origin` ④ — 끝점에서만 이웃을 보는 판. */
  "origin-endpoints": originEndpoints,
  /** `deep.origin` ④ — 끝점 판이 든 배열. */
  "origin-stale": originStale,
  /** `deep.build` 개념 (c) — 칸 읽기. */
  "build-read": buildRead,
  /** `deep.build` 개념 (d) — 이웃 짝. */
  "build-neighbors": buildNeighbors,
  /** `deep.build` 개념 (e) — 왼쪽 끝점 순서와의 차이. */
  "build-static": buildStatic,
  /** `deep.build` 1단계 — 끝점 세우기. */
  "build-normalize": buildNormalize,
  /** `deep.build` 2단계 — 분수 자리의 차례. */
  "build-order": buildOrder,
  /** `deep.build` 2단계 — 같은 자리는 한 번. */
  "build-dedupe": buildDedupe,
  /** `deep.build` 3단계 — 지나는 토막. */
  "build-through": buildThrough,
  /** `deep.build` 4단계 — 다시 놓기. */
  "build-reorder": buildReorder,
  /** `deep.build` 5단계 — 예약. */
  "build-book": buildBook,
  /** `deep.build` 6단계 — 세로 선분. */
  "build-upright": buildUpright,
  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": walkInput,
  /** `deep.walk.step` 1. — 처음 사건 큐. */
  "walk-queue": walkQueue,
  /** `deep.walk.step` 2. — T1~T3. */
  "walk-insert": walkInsert,
  /** `deep.walk.pause` — T 자 배치. */
  "pause-tee": pauseTee,
  /** `deep.walk.pause` — 시작하는 선분을 안 모으면. */
  "pause-start": pauseStart,
  /** `deep.walk.pause` — 세로 범위의 위끝을 바꾸면. */
  "pause-upright": pauseUpright,
  /** `deep.walk.step` 3. — T4·T5. */
  "walk-upright": walkUpright,
  /** `deep.walk.step` 4. — T6·T7. */
  "walk-cross": walkCross,
  /** `deep.walk.pause` — 위쪽 이웃을 안 보면. */
  "pause-right": pauseRight,
  /** `deep.walk.step` 5. — 열두 걸음. */
  "walk-trace": walkTrace,
  /** `deep.walk.final` — 호출 몇 개. */
  "final-calls": finalCalls,
  /** `related` — 출력에 붙는 비용. */
  "related-output": relatedOutput,
  /** `deep.math` ② — 교점 식 검산. */
  "math-verify": mathVerify,
  /** `deep.math` ② — 사건점 수 검산. */
  "math-check": mathCheck,
  /** `deep.math` ④ — 자릿수. */
  "math-digits": mathDigits,
  /** `deep.math` ④ — 과제 규모의 계수. */
  "math-count": mathCount,
  /** `invariant` ② — 걸음마다. */
  "invariant-states": invariantStates,
  /** `invariant` ② — 경계 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 이름 순. */
  "mutant-name-order": mutantNameOrder,
  /** `perf.derive` — 준비와 걸음마다의 비용. */
  "perf-count": perfCount,
  /** `perf.derive` — 성장률. */
  "perf-growth": perfGrowth,
  /** `perf.worst` — 배치 여섯. */
  "worst-shape": worstShape,
  /** `selfcheck` — 경계 판정. */
  "selfcheck-boundary": selfcheckBoundary,
};

/** 시도 사다리의 수 — 그림 사이드카가 쓴다. 전부 실행이나 하한식에서 나온다. */
export function ladderValues() {
  const flat512 = flat(512);
  return {
    /** 모든 쌍 판정의 하한 — 선분 10 만 개의 쌍마다 곱셈 8. */
    brute: 8 * ((MAX_N * (MAX_N - 1)) / 2),
    flatOverlap: byOverlap(flat512),
    flatSweep: measure(flat512).ops,
    walkBrute: allPairs(WALK).pairs,
    walkEndpoints: byEndpoints(WALK).pairs,
    stretchBrute: allPairs(STRETCH).pairs,
    stretchEndpoints: byEndpoints(STRETCH).pairs,
    stretchSweep: bentleyOttmann(STRETCH),
    flatEndpoints: byEndpoints(flat512),
  };
}
