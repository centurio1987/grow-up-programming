/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 그림 사이드카(`-guide.fig.tsx`)도 이 파일의 고정 입력과 기록(`trace`)을 받아 그린다 — 그림과 표가
 * 같은 실행을 쓴다.
 *
 * **비용은 한 기준으로 센다.** 기본 연산 = 좌표 읽기 + 곱셈(배정밀도 · 큰 정수) + 큰 정수 변환 +
 * 좌표 비교를 각각 1 로 센 합이다. 변 하나를 보면 좌표 읽기 4 · 배정밀도 곱 2 로 시작해, 큰 정수로
 * 다시 재면 변환 4 · 큰 정수 곱 2 가, 판정값이 0 이면 칸 검사의 좌표 비교 4 가, 변 위가 아니면 높이
 * 비교 2 가, 높이를 지나면 방향 비교 1 이 붙는다. `.alt.ts` 가 같은 기준을 쓰고, 경쟁 설계의 변 번호
 * 읽기만 거기서 더한다. 나눗셈은 교점의 `x` 를 구하는 방법만 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/geometry/pointInPolygon/pointInPolygon-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./pointInPolygon-guide.alt.ts";
import {
  type Point,
  pointInPolygon,
  sideOf,
} from "./pointInPolygon-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/**
 * 큰 정수의 천 단위 구분. **`Number` 로 바꿔 적지 않는다** — 이 편이 다루는 칸 수와 곱은
 * 배정밀도가 정수로 못 담는 크기라, 변환하는 순간 표가 어림수로 보이게 된다.
 */
const bignum = (n: bigint): string =>
  (n < 0n ? "-" : "") +
  (n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
export const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 변 하나의 표기 — 앞 끝점에서 뒤 끝점으로. */
export const seg = (a: Point, b: Point): string => `${pt(a)}-${pt(b)}`;

/** 기약분수 표기. 분모가 1 이면 정수로 적는다. */
export function frac(top: number, bottom: number): string {
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  const sign = top * bottom < 0 ? "-" : "";
  const t = Math.abs(top);
  const b = Math.abs(bottom);
  const d = g(t, b) || 1;
  return b / d === 1 ? `${sign}${t / d}` : `${sign}${t / d}/${b / d}`;
}

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 등폭 글자 폭 — 한글은 두 칸. 코드 옆 짧은 실행 결과의 열을 맞출 때만 쓴다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력 — L 자 다각형과 질의 점 셋.
 *
 * 세 점 안에 이 절차의 갈래가 전부 들어 있다 — `q1` 은 넘는 횟수가 홀수라 내부이고, `q2` 는
 * 오목한 자리에 있어 짝수이며, `q3` 은 변 위라 홀짝을 세기 전에 답이 난다.
 */
export const L: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];
export const Q1: Point = [1, 1];
export const Q2: Point = [3, 3];
export const Q3: Point = [2, 3];
export const WALK: [string, Point][] = [
  ["q1", Q1],
  ["q2", Q2],
  ["q3", Q3],
];

/** 「먼저 알아 둘 개념」 절이 교차끼리의 관계를 보일 때 쓰는 왼쪽 바깥의 두 점. */
export const LEFT_OUT: [string, Point][] = [
  ["r1", [-1, 1]],
  ["r2", [-1, 3]],
];

/** 꼭짓점 높이를 지나는 두 점 — 바깥 하나 · 안쪽 하나. */
export const AT_VERTEX_OUT: Point = [5, 2];
export const AT_VERTEX_IN: Point = [1, 2];

/** 변 이름과 두 끝점. `prev → at` 순서가 정본의 반복 순서와 같다. 이름은 나가는 꼭짓점 `prev` 를 따라 `e1` 이 첫 꼭짓점에서 나가는 변이다(SPEC §14 · `polygonArea` 와 같은 이름). */
export function edges(polygon: Point[]): [string, Point, Point][] {
  const out: [string, Point, Point][] = [];
  for (
    let at = 0, prev = polygon.length - 1;
    at < polygon.length;
    prev = at++
  ) {
    out.push([`e${prev + 1}`, polygon[prev] as Point, polygon[at] as Point]);
  }
  return out;
}

/** 과제의 좌표 절댓값 상한과 배정밀도가 부호를 못 믿는 하한. */
export const COORD = 1_000_000_000;
export const SAFE = 2048;

/** 흔한 채점 환경의 메모리 예산 256 MB 를 바이트로. */
const MEMORY_LIMIT = 256n * 1024n * 1024n;

/**
 * 나눗셈으로 교점의 `x` 를 구하는 방식이 어긋나는 배치.
 *
 * 변 `(0,0) → (999999997, 1000000000)` 의 높이 333,333,333 에서의 `x` 는
 * 333,333,332 와 333,333,333 사이인데 그 차가 10 억분의 1 이다. 배정밀도 나눗셈은 그 차를
 * 못 담고 정확히 333,333,332 를 낸다.
 */
export const QUOTIENT_POLYGON: Point[] = [
  [0, 0],
  [999_999_997, 1_000_000_000],
  [COORD, 0],
];
export const QUOTIENT_POINT: Point = [333_333_332, 333_333_333];

/* ────────────────────────── 기록 ────────────────────────── */

/** 정본과 같은 산술로 배정밀도 값을 낸다. 부호는 `sideOf` 가 확정한다. */
export function approxOf(o: Point, a: Point, b: Point): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** 큰 정수로 잰 판정의 원시 값. 부호만 쓰는 정본과 달리 크기까지 남긴다. */
export function exactOf(o: Point, a: Point, b: Point): bigint {
  const ux = BigInt(a[0] - o[0]);
  const uy = BigInt(a[1] - o[1]);
  const vx = BigInt(b[0] - o[0]);
  const vy = BigInt(b[1] - o[1]);
  const value = ux * vy - uy * vx;
  const want = value > 0n ? 1 : value < 0n ? -1 : 0;
  if (sideOf(o, a, b) !== want) {
    throw new Error(`원시 값의 부호가 정본과 어긋난다 — ${pt(o)} ${pt(a)}`);
  }
  return value;
}

const inBoxOf = (a: Point, b: Point, p: Point): boolean =>
  Math.min(a[0], b[0]) <= p[0] &&
  p[0] <= Math.max(a[0], b[0]) &&
  Math.min(a[1], b[1]) <= p[1] &&
  p[1] <= Math.max(a[1], b[1]);

/** 변 하나를 본 기록. */
export interface EdgeLog {
  readonly name: string;
  readonly a: Point;
  readonly b: Point;
  /** 배정밀도로 잰 값. */
  readonly approx: number;
  /** 정본의 판정값. */
  readonly d: number;
  /** 배정밀도에서 끝났는가(①). */
  readonly fast: boolean;
  /** 판정값이 0 이라 칸을 봤는가. */
  readonly boxed: boolean;
  /** 변 위라 그 자리에서 참이 됐는가(③). */
  readonly onEdge: boolean;
  readonly aboveA: boolean;
  readonly aboveB: boolean;
  /** 높이를 반개구간으로 지나는가(④ 를 통과). */
  readonly passes: boolean;
  readonly onLeft: boolean;
  readonly goesUp: boolean;
  /** 홀짝을 뒤집었는가(⑤). */
  readonly flip: boolean;
  /** 이 변을 본 직후의 `inside`. */
  readonly inside: boolean;
  /** 이 변 하나의 기본 연산. */
  readonly ops: number;
}

/**
 * 정본과 같은 절차를 변마다 기록하며 실행한다. 답은 정본과 대조한다.
 *
 * **작은 입력에만 쓴다.** 변마다 기록을 하나씩 남기므로 큰 다각형·많은 질의에는 값만 세는
 * `judge` 를 쓴다.
 */
export function trace(
  p: Point,
  polygon: Point[],
): { logs: EdgeLog[]; answer: boolean } {
  const logs: EdgeLog[] = [];
  let inside = false;
  let answer: boolean | null = null;
  for (const [name, a, b] of edges(polygon)) {
    const approx = approxOf(a, b, p);
    const d = sideOf(a, b, p);
    const fast = approx > SAFE || approx < -SAFE;
    let ops = 4 + 2 + (fast ? 0 : 6);
    const boxed = d === 0;
    const onEdge = boxed && inBoxOf(a, b, p);
    if (boxed) ops += 4;
    const aboveA = a[1] > p[1];
    const aboveB = b[1] > p[1];
    const passes = !onEdge && aboveA !== aboveB;
    const onLeft = d > 0;
    const goesUp = b[1] > a[1];
    const flip = passes && onLeft === goesUp;
    if (!onEdge) ops += 2;
    if (passes) ops += 1;
    if (flip) inside = !inside;
    logs.push({
      name,
      a,
      b,
      approx,
      d,
      fast,
      boxed,
      onEdge,
      aboveA,
      aboveB,
      passes,
      onLeft,
      goesUp,
      flip,
      inside,
      ops,
    });
    if (onEdge) {
      answer = true;
      break;
    }
  }
  const out = answer ?? inside;
  if (out !== pointInPolygon(p, polygon)) {
    throw new Error(`기록용 절차가 정본과 다른 답을 냈다 — ${pt(p)}`);
  }
  return { logs, answer: out };
}

export interface Judged {
  /** 본 변의 수. 변 위라 그 자리에서 끝나면 거기까지다. */
  seen: number;
  /** 배정밀도 값이 하한을 넘어 그 자리에서 끝난 판정의 수. */
  fast: number;
  /** 큰 정수로 다시 잰 판정의 수. */
  slow: number;
  /** 판정값이 0 이라 칸 검사를 부른 횟수. */
  boxes: number;
  /** 반직선의 높이를 반개구간으로 지나는 변의 수. */
  crossed: number;
  /** 그중 교점이 오른쪽이라 홀짝을 뒤집은 횟수. */
  flips: number;
  /** 변 위라 그 자리에서 참이 됐는가. */
  onEdge: boolean;
  /** 기본 연산 — `.alt.ts` 와 같은 규칙으로 센다. */
  ops: number;
  answer: boolean;
}

/** 정본과 같은 절차를 값만 세면서 실행한다. 답은 매번 정본과 대조한다. */
export function judge(p: Point, polygon: Point[]): Judged {
  const r: Judged = {
    seen: 0,
    fast: 0,
    slow: 0,
    boxes: 0,
    crossed: 0,
    flips: 0,
    onEdge: false,
    ops: 0,
    answer: false,
  };
  for (
    let at = 0, prev = polygon.length - 1;
    at < polygon.length;
    prev = at++
  ) {
    const a = polygon[prev] as Point;
    const b = polygon[at] as Point;
    r.seen++;
    r.ops += 4;
    const d = sideOf(a, b, p);
    const approx = approxOf(a, b, p);
    r.ops += 2;
    if (approx > SAFE || approx < -SAFE) r.fast++;
    else {
      r.slow++;
      r.ops += 6;
    }
    if (d === 0) {
      r.boxes++;
      r.ops += 4;
      if (inBoxOf(a, b, p)) {
        r.onEdge = true;
        r.answer = true;
        break;
      }
    }
    r.ops += 2;
    if (a[1] > p[1] === b[1] > p[1]) continue;
    r.crossed++;
    r.ops += 1;
    if (d > 0 === b[1] > a[1]) {
      r.flips++;
      r.answer = !r.answer;
    }
  }
  if (r.answer !== pointInPolygon(p, polygon)) {
    throw new Error(`계수용 절차가 정본과 다른 답을 냈다 — ${pt(p)}`);
  }
  return r;
}

/** 교점의 `x` 를 기약분수로 — 변이 높이 `py` 를 지나는 자리. 수평 변이면 `null`. */
export function meetX(a: Point, b: Point, py: number): string | null {
  if (a[1] === b[1]) return null;
  return frac(a[0] * (b[1] - a[1]) + (py - a[1]) * (b[0] - a[0]), b[1] - a[1]);
}

/** 교점이 질의 점의 오른쪽인가를 정수로 — `x* > p_x` 를 분모를 곱해 옮긴 것. */
export function meetsRight(a: Point, b: Point, p: Point): boolean {
  const top = a[0] * (b[1] - a[1]) + (p[1] - a[1]) * (b[0] - a[0]);
  const bottom = b[1] - a[1];
  return bottom > 0 ? top > p[0] * bottom : top < p[0] * bottom;
}

/* ────────────────────────── 입력 생성 ────────────────────────── */

/** xorshift32. 선형 합동 난수는 아래 자리가 짧게 되풀이돼 같은 좌표가 쏟아진다. */
function makeRnd(seed: number): () => number {
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

export const SEED = 20_260_904;
export const TRIES = 20_000;

/** 꼭짓점 `2n` 개짜리 별. 오목한 자리가 `n` 군데다. */
function star(spikes: number, outer: number, inner: number): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < 2 * spikes; at++) {
    const t = (Math.PI * at) / spikes;
    const r = at % 2 === 0 ? outer : inner;
    out.push([Math.round(r * Math.cos(t)), Math.round(r * Math.sin(t))]);
  }
  return out;
}

/** 이빨 `m` 개가 한 칸씩 올라가며 높이 `span` 을 지나는 톱니. `.alt.ts` 와 같은 생성식이다. */
export function comb(m: number, span: number): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < m; at++) {
    out.push([2 * at, at]);
    out.push([2 * at + 1, at + span]);
  }
  out.push([2 * m, m]);
  out.push([2 * m, -1]);
  out.push([0, -1]);
  return out;
}

/**
 * 원점에서 뻗는 방향 여덟에 안팎 두 점씩을 찍어 이은 다각형.
 *
 * 방향마다 두 점이 **원점을 지나는 같은 직선 위**라 그 변의 판정값이 정확히 0 이 된다. 칸 검사가
 * 가장 많이 붙는 배치를 만들려고 세운 것이고, 원점은 어느 변의 좌표 칸에도 안 들어간다.
 */
function spokes(near: number, far: number): Point[] {
  const dirs: [number, number][] = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  const out: Point[] = [];
  for (const [dx, dy] of dirs) {
    out.push([far * dx, far * dy]);
    out.push([near * dx, near * dy]);
  }
  return out;
}

/** 반지름 `r` 의 원 위 `n` 점을 반올림해 이은 다각형. */
function ring(n: number, r: number): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < n; at++) {
    const t = (2 * Math.PI * at) / n;
    out.push([Math.round(r * Math.cos(t)), Math.round(r * Math.sin(t))]);
  }
  return out;
}

/** 좌표 `-half … half` 안에서 고르게 뽑은 질의 점. */
function scatter(total: number, half: number): Point[] {
  const rnd = makeRnd(SEED);
  const out: Point[] = [];
  for (let at = 0; at < total; at++) {
    out.push([
      (rnd() % (2 * half + 1)) - half,
      (rnd() % (2 * half + 1)) - half,
    ]);
  }
  return out;
}

/* ────────────────────────── 가장 단순한 방법 ────────────────────────── */

/**
 * 좌표 격자의 칸마다 안팎을 미리 적어 두는 방법. `deep.origin` ② 가 세우는 것이다.
 *
 * **정본을 부르지 않는다.** 변을 격자에 표시한 다음 바깥에서 물이 번지듯 이어진 칸을 모두
 * 표시하고, 표시되지 않은 칸을 내부로 본다. 격자를 두 배로 늘려 두어 변이 칸 사이를 막는다 —
 * 축에 나란한 변만 그 방식으로 정확하므로, 아니면 던진다.
 */
export function fillGrid(polygon: Point[]): boolean[][] {
  let xmax = 0;
  let ymax = 0;
  for (const v of polygon) {
    if (v[0] < 0 || v[1] < 0)
      throw new Error("음수 좌표는 이 격자가 못 담는다");
    xmax = Math.max(xmax, v[0]);
    ymax = Math.max(ymax, v[1]);
  }
  const w = 2 * xmax + 3;
  const h = 2 * ymax + 3;
  // 0 미정 · 1 변 · 2 바깥
  const cell: number[][] = Array.from({ length: h }, () =>
    new Array(w).fill(0),
  );
  for (const [, a, b] of edges(polygon)) {
    if (a[0] !== b[0] && a[1] !== b[1]) {
      throw new Error("축에 나란하지 않은 변이 있어 이 격자는 정확하지 않다");
    }
    const steps = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) * 2;
    for (let k = 0; k <= steps; k++) {
      const x = 2 * a[0] + ((2 * (b[0] - a[0]) * k) / steps || 0);
      const y = 2 * a[1] + ((2 * (b[1] - a[1]) * k) / steps || 0);
      (cell[y + 1] as number[])[x + 1] = 1;
    }
  }
  const queue: [number, number][] = [[0, 0]];
  (cell[0] as number[])[0] = 2;
  while (queue.length > 0) {
    const [x, y] = queue.pop() as [number, number];
    const around: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of around) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if ((cell[ny] as number[])[nx] !== 0) continue;
      (cell[ny] as number[])[nx] = 2;
      queue.push([nx, ny]);
    }
  }
  return Array.from({ length: ymax + 1 }, (_, y) =>
    Array.from(
      { length: xmax + 1 },
      (_, x) => (cell[2 * y + 1] as number[])[2 * x + 1] !== 2,
    ),
  );
}

/**
 * 교점의 `x` 를 나눗셈으로 구해 비교하는 방식. `deep.origin` ④ 가 상대로 세우는 것이다.
 *
 * 변 위 판정과 높이 판정은 정본과 같고, **홀짝을 뒤집을지 정하는 자리만** 다르다.
 */
interface Arith {
  /** 배정밀도 곱셈. */
  mul: number;
  /** 나눗셈. */
  div: number;
  /** 만들어진 값 가운데 정수가 아닌 것. */
  fractional: number;
}

function byQuotient(p: Point, polygon: Point[], c?: Arith): boolean {
  let inside = false;
  for (const [, a, b] of edges(polygon)) {
    const d = sideOf(a, b, p);
    if (d === 0 && inBoxOf(a, b, p)) return true;
    if (a[1] > p[1] === b[1] > p[1]) continue;
    const x = a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
    if (c) {
      c.mul += 1;
      c.div += 1;
      if (!Number.isInteger(x)) c.fractional += 1;
    }
    if (x > p[0]) inside = !inside;
  }
  return inside;
}

/** 높이 판정의 세 후보. 정본이 쓰는 것은 `half` 다. */
type Rule = "half" | "closed" | "open";

function withRule(p: Point, polygon: Point[], rule: Rule): boolean {
  let inside = false;
  for (const [, a, b] of edges(polygon)) {
    const d = sideOf(a, b, p);
    if (d === 0 && inBoxOf(a, b, p)) return true;
    const low = Math.min(a[1], b[1]);
    const high = Math.max(a[1], b[1]);
    const pass =
      rule === "half"
        ? a[1] > p[1] !== b[1] > p[1]
        : rule === "closed"
          ? low <= p[1] && p[1] <= high
          : low < p[1] && p[1] < high;
    if (!pass) continue;
    if (d > 0 === b[1] > a[1]) inside = !inside;
  }
  return inside;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { pointInPolygon: (p: Point, polygon: Point[]) => boolean };

const REF = new URL("./pointInPolygon-guide.ref.ts", import.meta.url).pathname;

const FILTER_LINE =
  /if \(approx > SAFE \|\| approx < -SAFE\) return approx > 0 \? 1 : -1;/;
const BOUNDARY_LINE = /^ {4}if \(d === 0 && inBox\(a, b, p\)\) return true;$/;
const HALFOPEN_LINE = /^ {4}if \(aboveA === aboveB\) continue;$/;
const DIRECTION_LINE = /^ {4}if \(onLeft === goesUp\) inside = !inside;$/;

/** 판정을 배정밀도 곱 하나로만 끝내는 사본. */
const floatOnly = await loadMutant<Impl>(REF, {
  swap: [FILTER_LINE, "if (true) return approx > 0 ? 1 : approx < 0 ? -1 : 0;"],
});

/** 변 위 판정을 뺀 사본. 경계를 홀짝 세기에만 맡긴다. */
const noBoundary = await loadMutant<Impl>(REF, { drop: BOUNDARY_LINE });

/** 높이 판정을 닫힌 구간으로 바꾼 사본. 양 끝을 다 포함한다. */
const closedRange = await loadMutant<Impl>(REF, {
  swap: [
    HALFOPEN_LINE,
    "    if (!(Math.min(a[1], b[1]) <= py && py <= Math.max(a[1], b[1]))) continue;",
  ],
});

/** 뒤집기의 방향 보정을 뺀 사본. 불변식을 지키던 줄이다. */
const noDirection = await loadMutant<Impl>(REF, {
  swap: [DIRECTION_LINE, "    if (onLeft) inside = !inside;"],
});

/**
 * 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다.
 *
 * **중화 실행에서는 건너뛴다.** `check-proof` 가 변이를 적용하지 않은 채 이 파일을 한 번 더
 * 부르는데, 그때 `loadMutant` 는 정본 모듈을 그대로 돌려준다. 변이의 함수가 정본과 **같은 객체**
 * 이면 중화 실행이다 — 그 자리에서 던지면 갈림 대조가 한 번도 실행되지 않는다(SPEC §0).
 */
function assertBreaks(impl: Impl["pointInPolygon"], gaps: number[]): void {
  if (impl === pointInPolygon) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 다른 구현의 답을 나란히 놓은 표를 만든다. */
function contrast(
  cases: [string, Point, Point[]][],
  other: Impl["pointInPolygon"],
  otherHead: string,
): string {
  const gaps: number[] = [];
  const rows = cases.map(([label, p, polygon]) => {
    const want = pointInPolygon(p, polygon);
    const got = other(p, polygon);
    gaps.push(want === got ? 0 : 1);
    return [
      label,
      pt(p),
      String(want),
      String(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  assertBreaks(other, gaps);
  return md(["배치", "질의 점", "정본", otherHead, "대조"], rows);
}

/** 한 가족 전체에서 두 구현의 답이 갈리는 횟수. */
function disagreements(
  polygon: Point[],
  points: Point[],
  other: (p: Point, polygon: Point[]) => boolean,
): number {
  let gaps = 0;
  for (const p of points) {
    if (other(p, polygon) !== pointInPolygon(p, polygon)) gaps++;
  }
  return gaps;
}

/* ────────────────────────── 그림 사이드카가 받는 값 ────────────────────────── */

/** 격자 표가 L 자에서 정본과 맞는 칸의 수와 과제 규모의 크기. */
export function gridFacts(): {
  cells: number;
  same: number;
  side: bigint;
  full: bigint;
  bytes: bigint;
  times: bigint;
} {
  const grid = fillGrid(L);
  let same = 0;
  let cells = 0;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[y] as boolean[]).length; x++) {
      cells++;
      if ((grid[y] as boolean[])[x] === pointInPolygon([x, y], L)) same++;
    }
  }
  const side = 2n * BigInt(COORD) + 1n;
  const full = side * side;
  const bytes = (full + 7n) / 8n;
  return { cells, same, side, full, bytes, times: bytes / MEMORY_LIMIT };
}

/** 나눗셈 방법이 별 다섯과 겨냥한 배치에서 낸 값. */
export function quotientFacts(): {
  arith: Arith;
  signMul: number;
  wrongSmall: number;
  wrongBig: number;
  points: number;
} {
  const family = star(5, 100, 40);
  const points = scatter(TRIES, 240);
  const arith: Arith = { mul: 0, div: 0, fractional: 0 };
  let signMul = 0;
  for (const p of points) {
    byQuotient(p, family, arith);
    const r = judge(p, family);
    // 두 방식이 변 위 판정에 같은 방향 판정을 쓴다. 그 몫은 두 열에 똑같이 들어간다.
    arith.mul += r.seen * 2;
    signMul += r.seen * 2;
  }
  return {
    arith,
    signMul,
    wrongSmall: disagreements(family, points, byQuotient),
    wrongBig: disagreements(QUOTIENT_POLYGON, [QUOTIENT_POINT], byQuotient),
    points: points.length,
  };
}

/* ────────────────────────── 걸음 ────────────────────────── */

/** 전개의 걸음 하나 — 같은 일을 한 변이 잇달아 나오면 한 걸음으로 묶는다. */
export interface WalkStep {
  readonly t: number;
  readonly query: string;
  readonly p: Point;
  readonly logs: readonly EdgeLog[];
  readonly did: "left" | "skip" | "flip" | "edge";
  readonly before: boolean;
  readonly after: boolean;
}

export const DID_WORD: Record<WalkStep["did"], string> = {
  left: "왼쪽이라 그대로 둔다",
  skip: "높이 밖이라 건너뛴다",
  flip: "교차해 뒤집는다",
  edge: "변 위라 그 자리에서 참",
};

export const didOf = (e: EdgeLog): WalkStep["did"] =>
  e.onEdge ? "edge" : !e.passes ? "skip" : e.flip ? "flip" : "left";

/** 세 질의를 걸음으로 펼친다. 뒤집는 변은 늘 한 걸음을 따로 차지한다. */
export function walkSteps(): WalkStep[] {
  const out: WalkStep[] = [];
  for (const [query, p] of WALK) {
    const { logs } = trace(p, L);
    let group: EdgeLog[] = [];
    let before = false;
    const flush = (): void => {
      const first = group[0];
      if (first === undefined) return;
      const last = group.at(-1) as EdgeLog;
      out.push({
        t: out.length + 1,
        query,
        p,
        logs: group,
        did: didOf(first),
        before,
        after: last.inside,
      });
      before = last.inside;
      group = [];
    };
    for (const e of logs) {
      const first = group[0];
      if (first !== undefined && didOf(first) !== didOf(e)) flush();
      group.push(e);
      if (e.flip) flush();
    }
    flush();
  }
  return out;
}

/* ────────────────────────── 블록 ────────────────────────── */

const yes = (b: boolean): string => (b ? "참" : "거짓");

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 점 여섯이 어느 갈래로 가고 답이 무엇인가. */
  "concept-cases": () => {
    const cases: [string, Point][] = [
      ["내부", Q1],
      ["오목한 자리라 외부", Q2],
      ["변 위", Q3],
      ["꼭짓점 위", [0, 0]],
      ["오른쪽 바깥", [5, 1]],
      ["위쪽 바깥", [1, 5]],
    ];
    let edgeRows = 0;
    const rows = cases.map(([label, p]) => {
      const r = judge(p, L);
      if (r.onEdge) edgeRows++;
      return [
        label,
        pt(p),
        String(r.flips),
        r.onEdge ? "변 위" : r.flips % 2 === 1 ? "홀수" : "짝수",
        String(r.answer),
      ];
    });
    return [
      md(["배치", "질의 점", "교차 수", "답을 정한 것", "답"], rows, [2]),
      "",
      `다각형은 L 자 여섯 변 ${L.map(pt).join(" ")} 입니다. 여섯 줄 가운데 ${edgeRows} 줄은 점이 변 위라 교차 수와 상관없이 답이 true 이고, 나머지 ${cases.length - edgeRows} 줄은 교차 수가 홀수인지로 답이 정해졌습니다.`,
    ].join("\n");
  },

  /** `concept` — 좌표를 키우면 판정값이 배정밀도의 정수 한계를 넘는다. */
  "concept-exact": () => {
    const rows = [1_000, 1_000_000, 23_726_566, COORD].map((c) => {
      const largest = 4 * c * c;
      return [
        num(c),
        num(2 * c),
        largest.toExponential(2),
        largest <= Number.MAX_SAFE_INTEGER ? "담긴다" : "안 담긴다",
      ];
    });
    return [
      md(
        ["좌표 상한", "좌표의 차", "곱의 최댓값", "배정밀도에 정확히 담기"],
        rows,
        [0, 1, 2],
      ),
      "",
      `배정밀도가 정수를 오차 없이 담는 한계 Number.MAX_SAFE_INTEGER 는 ${num(Number.MAX_SAFE_INTEGER)} 이고, 좌표 상한 ${num(COORD)} 에서 곱 하나의 최댓값은 그 한계의 ${Math.floor((4 * COORD * COORD) / Number.MAX_SAFE_INTEGER)} 배가 넘습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 격자에 안팎을 적어 두는 방법과 그 크기. */
  "origin-grid": () => {
    const f = gridFacts();
    const grid = fillGrid(L);
    const small = BigInt((grid[0] as boolean[]).length);
    const rows: [string, bigint][] = [
      ["L 자 다각형", small],
      [`좌표 -${num(COORD)} ~ ${num(COORD)}`, f.side],
    ];
    return [
      md(
        ["표를 만드는 범위", "한 변의 칸", "칸 수", "1 비트씩 잡은 바이트"],
        rows.map(([label, side]) => [
          label,
          bignum(side),
          bignum(side * side),
          bignum((side * side + 7n) / 8n),
        ]),
        [1, 2, 3],
      ),
      "",
      `L 자 다각형의 ${num(f.cells)} 칸 가운데 정본과 답이 같은 칸은 ${num(f.same)} 칸입니다. 좌표 범위 전체의 표는 256 MB(${bignum(MEMORY_LIMIT)} 바이트)의 ${bignum(f.times)} 배입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 반직선이 넘는 변의 수와 답. */
  "origin-ray": () => {
    const cases: [string, Point][] = [
      ["q1", Q1],
      ["q2", Q2],
      ["아래쪽 안", [3, 1]],
      ["위쪽 바깥", [3, 4]],
    ];
    let odd = 0;
    let inside = 0;
    const rows = cases.map(([label, p]) => {
      const { logs, answer } = trace(p, L);
      const names = logs.filter((e) => e.flip).map((e) => e.name);
      if (names.length % 2 === 1) odd++;
      if (answer) inside++;
      return [
        label,
        pt(p),
        names.length > 0 ? names.join(" ") : "없다",
        String(names.length),
        names.length % 2 === 1 ? "홀수" : "짝수",
        String(answer),
      ];
    });
    return [
      md(
        ["이름", "질의 점", "교차하는 변", "교차 수", "홀짝", "답"],
        rows,
        [3],
      ),
      "",
      `변 이름은 ${edges(L)
        .map(([name, a, b]) => `${name} ${seg(a, b)}`)
        .join(
          " · ",
        )} 입니다. 교차 수가 홀수인 점은 ${odd} 개이고, 정본이 내부로 답한 점도 ${inside} 개입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 나눗셈으로 교점을 구하는 방식과 부호만 보는 방식. */
  "origin-quotient": () => {
    const f = quotientFacts();
    const exact = exactOf(
      QUOTIENT_POLYGON[0] as Point,
      QUOTIENT_POLYGON[1] as Point,
      QUOTIENT_POINT,
    );
    const bx = (QUOTIENT_POLYGON[1] as Point)[0];
    const by = (QUOTIENT_POLYGON[1] as Point)[1];
    const quotientX = (QUOTIENT_POINT[1] * bx) / by;
    return [
      md(
        ["방식", "배정밀도 곱", "나눗셈", "정수가 아닌 값", "틀린 답"],
        [
          [
            "교점의 x 를 구해 비교한다",
            num(f.arith.mul),
            num(f.arith.div),
            num(f.arith.fractional),
            num(f.wrongSmall),
          ],
          ["부호만 비교한다", num(f.signMul), "0", "0", "0"],
        ],
        [1, 2, 3, 4],
      ),
      "",
      `입력은 꼭짓점 열 개짜리 별 하나와 좌표 -240~240 의 질의 점 ${num(f.points)} 개입니다. 좌표를 상한에 붙여 겨냥해 만든 배치에서는 이렇게 됩니다.`,
      "",
      md(
        ["값", "나눗셈", "곱과 부호"],
        [
          [
            `변 ${seg(QUOTIENT_POLYGON[0] as Point, QUOTIENT_POLYGON[1] as Point)}${이가((QUOTIENT_POLYGON[1] as Point)[1])} 높이 ${num(QUOTIENT_POINT[1])}${을를(num(QUOTIENT_POINT[1]))} 지나는 x`,
            num(quotientX),
            "구하지 않는다",
          ],
          ["질의 점의 x", num(QUOTIENT_POINT[0]), num(QUOTIENT_POINT[0])],
          ["그 자리의 판정값", "—", bignum(exact)],
          [
            `다각형 ${QUOTIENT_POLYGON.map(pt).join(" ")} 에서 ${pt(QUOTIENT_POINT)} 의 답`,
            String(byQuotient(QUOTIENT_POINT, QUOTIENT_POLYGON)),
            String(pointInPolygon(QUOTIENT_POINT, QUOTIENT_POLYGON)),
          ],
        ],
        [1, 2],
      ),
      "",
      `별 다섯에서는 나눗셈 쪽이 틀린 답 ${num(f.wrongSmall)} 개이고, 겨냥한 배치에서는 질의 ${num(f.wrongBig)} 개를 틀립니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (c) — q1 의 반직선이 변마다 무엇을 하는가. */
  "build-read": () => {
    const p = Q1;
    const { logs } = trace(p, L);
    const rows = logs.map((e) => {
      const x = e.passes ? meetX(e.a, e.b, p[1]) : null;
      return [
        e.name,
        seg(e.a, e.b),
        `${e.a[1]} · ${e.b[1]}`,
        e.passes ? "지난다" : "안 지난다",
        x ?? "—",
        e.passes ? (meetsRight(e.a, e.b, p) ? "오른쪽" : "왼쪽") : "—",
        e.flip ? "교차" : "—",
      ];
    });
    const crossings = logs.filter((e) => e.flip).length;
    return [
      md(
        [
          "변",
          "두 끝점",
          "두 끝점의 높이",
          `높이 ${p[1]}`,
          "그 높이의 x",
          `x = ${p[0]} 에서 본 자리`,
          "반직선과",
        ],
        rows,
        [4],
      ),
      "",
      `q1 ${pt(p)} 의 반직선과 교차하는 변은 ${crossings} 개이고, 정본의 답은 ${pointInPolygon(p, L)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (d) — 반직선 위의 조각이 교차마다 안팎을 바꾼다. */
  "build-alternate": () => {
    const rows = LEFT_OUT.map(([name, p]) => {
      const { logs, answer } = trace(p, L);
      const xs = logs
        .filter((e) => e.flip)
        .map((e) => meetX(e.a, e.b, p[1]) as string);
      const pieces: string[] = [];
      let inside = answer;
      pieces.push(inside ? "안" : "밖");
      for (let k = 0; k < xs.length; k++) {
        inside = !inside;
        pieces.push(inside ? "안" : "밖");
      }
      return [name, pt(p), String(answer), xs.join(" · "), pieces.join(" → ")];
    });
    return [
      md(
        [
          "점",
          "좌표",
          "정본의 답",
          "교차하는 x",
          "점에서 오른쪽으로 가며 지나는 조각",
        ],
        rows,
      ),
      "",
      "두 점 모두 교차할 때마다 조각이 안과 밖을 번갈아 오가고, 마지막 조각은 밖입니다.",
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (e) — 닫힌 구간이 꼭짓점을 두 변에서 센다. */
  "build-rules": () => {
    const p = AT_VERTEX_OUT;
    let closedCount = 0;
    let halfCount = 0;
    const rows = edges(L).map(([name, a, b]) => {
      const low = Math.min(a[1], b[1]);
      const high = Math.max(a[1], b[1]);
      const closed = low <= p[1] && p[1] <= high;
      const half = a[1] > p[1] !== b[1] > p[1];
      const d = sideOf(a, b, p);
      const turn = d > 0 === b[1] > a[1];
      if (closed) closedCount++;
      if (half) halfCount++;
      return [
        name,
        seg(a, b),
        `[${low}, ${high}]`,
        closed ? "센다" : "뺀다",
        half ? "센다" : "뺀다",
        String(d),
        closed && turn ? "뒤집는다" : "—",
        half && turn ? "뒤집는다" : "—",
      ];
    });
    return [
      md(
        [
          "변",
          "두 끝점",
          "높이 구간",
          "닫힌 구간",
          "반개구간",
          "판정값",
          "닫힌 구간의 뒤집기",
          "반개구간의 뒤집기",
        ],
        rows,
        [5],
      ),
      "",
      `질의 점 ${pt(p)} 에서 닫힌 구간은 ${closedCount} 변을 세어 답이 ${withRule(p, L, "closed")} 이고, 반개구간은 ${halfCount} 변을 세어 답이 ${withRule(p, L, "half")} 입니다. 정본의 답은 ${pointInPolygon(p, L)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 판정 하나가 어느 겹에서 끝나는가. */
  "build-side": () => {
    const cases: [string, Point, Point, Point][] = [
      ["전개 입력 q1 · e2", [4, 0], [4, 2], Q1],
      ["전개 입력 q2 · e4", [2, 2], [2, 4], Q2],
      ["좌표 상한의 정사각형", [-COORD, -COORD], [COORD, -COORD], [0, 0]],
      [
        "겨냥해 만든 배치",
        QUOTIENT_POLYGON[0] as Point,
        QUOTIENT_POLYGON[1] as Point,
        QUOTIENT_POINT,
      ],
    ];
    const rows = cases.map(([label, o, a, b]) => {
      const approx = approxOf(o, a, b);
      const fast = approx > SAFE || approx < -SAFE;
      return [
        label,
        `${pt(o)} → ${pt(a)} → ${pt(b)}`,
        num(approx),
        fast ? "넘는다" : "못 넘는다",
        fast ? "배정밀도" : "큰 정수",
        String(sideOf(o, a, b)),
      ];
    });
    const last = cases.at(-1) as [string, Point, Point, Point];
    return [
      md(
        [
          "입력",
          "세 점",
          "배정밀도 값",
          `SAFE ${num(SAFE)}`,
          "부호를 정한 곳",
          "sideOf",
        ],
        rows,
        [2, 5],
      ),
      "",
      `넷째 줄은 배정밀도 값이 ${num(approxOf(last[1], last[2], last[3]))} 인데 큰 정수로 다시 재면 ${bignum(exactOf(last[1], last[2], last[3]))} 이고, 정본은 뒤엣것의 부호를 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 판정값 0 과 좌표 칸이 변 위를 가른다. */
  "build-boundary": () => {
    const cases: [string, Point, Point, Point][] = [
      ["q3 과 e4", [2, 2], [2, 4], Q3],
      ["(2,5) 와 e4", [2, 2], [2, 4], [2, 5]],
      ["(0,0) 과 e6", [0, 4], [0, 0], [0, 0]],
      ["q1 과 e1", [0, 0], [4, 0], Q1],
    ];
    const rows = cases.map(([label, a, b, p]) => {
      const d = sideOf(a, b, p);
      const box = inBoxOf(a, b, p);
      return [
        label,
        seg(a, b),
        pt(p),
        String(d),
        `x [${Math.min(a[0], b[0])}, ${Math.max(a[0], b[0])}] · y [${Math.min(a[1], b[1])}, ${Math.max(a[1], b[1])}]`,
        d === 0 ? (box ? "안" : "밖") : "보지 않는다",
        d === 0 && box ? "변 위" : "아니다",
      ];
    });
    const onEdge = rows.filter((r) => r[6] === "변 위").length;
    return [
      md(
        ["자리", "변", "점", "판정값", "변의 좌표 칸", "칸 안인가", "결과"],
        rows,
        [3],
      ),
      "",
      `네 자리 가운데 변 위로 잡힌 것은 ${onEdge} 자리입니다. 판정값이 0 인데 좌표 칸 밖인 둘째 줄은 변 위가 아닙니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 두 끝점의 「위인가」 가 다른 변만 남는다. */
  "build-height": () => {
    const p = Q2;
    const rows = edges(L).map(([name, a, b]) => [
      name,
      seg(a, b),
      `${a[1]} > ${p[1]}`,
      yes(a[1] > p[1]),
      `${b[1]} > ${p[1]}`,
      yes(b[1] > p[1]),
      a[1] > p[1] !== b[1] > p[1] ? "남긴다" : "건너뛴다",
    ]);
    const kept = edges(L)
      .filter(([, a, b]) => a[1] > p[1] !== b[1] > p[1])
      .map(([name]) => name);
    return [
      md(
        [
          "변",
          "두 끝점",
          "앞 끝",
          "앞 끝은 위",
          "뒤 끝",
          "뒤 끝은 위",
          "높이 판정",
        ],
        rows,
      ),
      "",
      `q2 ${pt(p)} 의 높이 ${p[1]} 에서 남는 변은 ${kept.join(" · ")}${으로(kept.at(-1) ?? "")} ${kept.length} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 4단계 — 판정값의 부호와 변의 방향이 오른쪽을 정한다. */
  "build-direction": () => {
    const rows: string[][] = [];
    let agree = 0;
    let total = 0;
    for (const [name, p] of WALK) {
      for (const e of trace(p, L).logs) {
        if (!e.passes) continue;
        total++;
        const right = meetsRight(e.a, e.b, p);
        if (right === e.flip) agree++;
        rows.push([
          name,
          e.name,
          e.goesUp ? "위로" : "아래로",
          String(e.d),
          yes(e.onLeft),
          yes(e.goesUp),
          e.flip ? "뒤집는다" : "그대로",
          `${meetX(e.a, e.b, p[1])} 대 ${p[0]}`,
          right ? "오른쪽" : "왼쪽",
        ]);
      }
    }
    return [
      md(
        [
          "질의",
          "변",
          "가는 방향",
          "판정값",
          "onLeft",
          "goesUp",
          "홀짝",
          "교점의 x 대 점의 x",
          "교점",
        ],
        rows,
        [3],
      ),
      "",
      `높이를 지난 변 ${total} 개 가운데 ${agree} 개에서 「두 값이 맞아 뒤집는다」와 「교점이 오른쪽이다」가 함께 참이거나 함께 거짓입니다. 교점의 x 는 판정값과 따로 풀어 적었습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 세 후보를 세 가족에서 재서 남는 것 하나. */
  "build-sweep": () => {
    const families: [string, Point[], number][] = [
      ["L 자 · 좌표 -8~8", L, 8],
      ["별 다섯 · 좌표 -240~240", star(5, 100, 40), 240],
      ["톱니 여덟 · 좌표 -40~40", comb(8, 3), 40],
    ];
    let halfTotal = 0;
    const rows = families.map(([label, polygon, half]) => {
      const points = scatter(TRIES, half);
      const count = (rule: Rule) =>
        disagreements(polygon, points, (p, poly) => withRule(p, poly, rule));
      const h = count("half");
      halfTotal += h;
      return [
        label,
        num(points.length),
        num(count("closed")),
        num(count("open")),
        num(h),
      ];
    });
    return [
      md(
        ["입력 가족", "질의 점", "닫힌 구간", "열린 구간", "반개구간"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `세 열의 값은 정본과 답이 어긋난 질의 점의 수입니다. 반개구간 열의 합은 ${num(halfTotal)} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 고정 입력과 기대하는 답. */
  "walk-input": () =>
    [
      `const L: Point[] = [${L.map((v) => `[${v[0]}, ${v[1]}]`).join(", ")}];`,
      ...WALK.map(([name, p]) => `const ${name}: Point = [${p[0]}, ${p[1]}];`),
      `// 이 절이 끝나면 ${WALK.map(([name, p]) => `${name}${은는(name)} ${pointInPolygon(p, L)}`).join(", ")} 가 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 전개 입력의 판정이 어느 겹에서 끝나는가. */
  "walk-side": () => {
    const rows: string[][] = [];
    let biggest = 0;
    let slow = 0;
    for (const [name, p] of WALK) {
      for (const e of trace(p, L).logs) {
        biggest = Math.max(biggest, Math.abs(e.approx));
        if (!e.fast) slow++;
        rows.push([
          name,
          e.name,
          `sideOf(${pt(e.a)}, ${pt(e.b)}, ${pt(p)})`,
          String(e.approx),
          e.fast ? "①" : "②",
          String(e.d),
        ]);
      }
    }
    return [
      md(
        ["질의", "변", "호출", "배정밀도 값", "끝난 곳", "돌려준 값"],
        rows,
        [3, 5],
      ),
      "",
      `배정밀도 값의 절댓값은 가장 커도 ${biggest} 라 SAFE ${num(SAFE)}${을를(num(SAFE))} 넘지 못하고, 판정 ${rows.length} 번 가운데 ${slow} 번이 ② 에서 끝났습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 짚고 가기 1 — 배정밀도 곱만으로 부호를 정하면. */
  "pause-float": () => {
    const cases: [string, Point, Point[]][] = [
      ["전개 입력 q1", Q1, L],
      [
        "좌표 상한의 정사각형",
        [0, 0],
        [
          [-COORD, -COORD],
          [COORD, -COORD],
          [COORD, COORD],
          [-COORD, COORD],
        ],
      ],
      ["겨냥해 만든 배치 · 좌표 상한", QUOTIENT_POINT, QUOTIENT_POLYGON],
    ];
    const o = QUOTIENT_POLYGON[0] as Point;
    const a = QUOTIENT_POLYGON[1] as Point;
    const q = QUOTIENT_POINT;
    const ux = BigInt(a[0] - o[0]);
    const uy = BigInt(a[1] - o[1]);
    const vx = BigInt(q[0] - o[0]);
    const vy = BigInt(q[1] - o[1]);
    const floatGap = approxOf(o, a, q);
    const exactGap = bignum(ux * vy - uy * vx);
    return [
      contrast(cases, floatOnly.pointInPolygon, "배정밀도 곱만 쓴 답"),
      "",
      `셋째 줄의 변 ${seg(o, a)} 에서 점 ${pt(q)} 을 두 방식으로 재면 이렇습니다.`,
      "",
      md(
        ["항", "큰 정수로", "배정밀도로"],
        [
          [
            "앞의 곱 ux · vy",
            bignum(ux * vy),
            num((a[0] - o[0]) * (q[1] - o[1])),
          ],
          [
            "뒤의 곱 uy · vx",
            bignum(uy * vx),
            num((a[1] - o[1]) * (q[0] - o[0])),
          ],
          ["둘의 차", exactGap, num(floatGap)],
        ],
        [1, 2],
      ),
      "",
      `두 곱은 각각 ${num(Number.MAX_SAFE_INTEGER)} 보다 커서 배정밀도에서 같은 값으로 반올림됩니다. 배정밀도는 차를 ${num(floatGap)}${으로(num(floatGap))} 내서 점이 변 위라고 답하고, 큰 정수는 ${exactGap}${을를(exactGap)} 내서 왼쪽이라고 답합니다.`,
    ].join("\n");
  },

  /** `deep.walk` 2 — q3 이 e4 위인지 보는 자리. */
  "walk-boundary": () => {
    const { logs } = trace(Q3, L);
    const hit = logs.find((e) => e.onEdge) as EdgeLog;
    const [a, b] = [hit.a, hit.b];
    const rows = [
      ["판정값", `sideOf(${pt(a)}, ${pt(b)}, ${pt(Q3)})`, String(hit.d)],
      [
        "칸의 x",
        `${Math.min(a[0], b[0])} ≤ ${Q3[0]} ≤ ${Math.max(a[0], b[0])}`,
        yes(Math.min(a[0], b[0]) <= Q3[0] && Q3[0] <= Math.max(a[0], b[0])),
      ],
      [
        "칸의 y",
        `${Math.min(a[1], b[1])} ≤ ${Q3[1]} ≤ ${Math.max(a[1], b[1])}`,
        yes(Math.min(a[1], b[1]) <= Q3[1] && Q3[1] <= Math.max(a[1], b[1])),
      ],
    ];
    const other = WALK.filter(([, p]) =>
      trace(p, L).logs.some((e) => e.onEdge),
    ).map(([name]) => name);
    return [
      md(["검사", "식", "결과"], rows, [2]),
      "",
      `③ 이 참이 된 질의는 ${other.join(" · ")} 하나이고, 그 자리는 반복문이 ${edges(L).length} 변 가운데 ${logs.indexOf(hit) + 1} 번째로 보는 변 ${hit.name} 입니다. 남은 변 ${edges(L).length - logs.length} 개는 보지 않습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 짚고 가기 2 — 변 위 판정을 빼면. */
  "pause-boundary": () => {
    const cases: [string, Point, Point[]][] = [
      ["전개 입력 q3 · 변 위", Q3, L],
      ["꼭짓점 위", [0, 0], L],
      ["아래 변 위", [2, 0], L],
      ["전개 입력 q1 · 내부", Q1, L],
    ];
    const grid = fillGrid(L);
    let onEdge = 0;
    let missed = 0;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < (grid[y] as boolean[]).length; x++) {
        const p: Point = [x, y];
        if (!judge(p, L).onEdge) continue;
        onEdge++;
        if (noBoundary.pointInPolygon(p, L) !== pointInPolygon(p, L)) missed++;
      }
    }
    return [
      contrast(cases, noBoundary.pointInPolygon, "변 위 판정을 뺀 답"),
      "",
      `격자 0~4 의 점 ${num(grid.length * (grid[0] as boolean[]).length)} 개 가운데 변 위인 점이 ${num(onEdge)} 개이고, 그중 ${num(missed)} 개에서 답이 틀립니다.`,
    ].join("\n");
  },

  /**
   * `deep.walk` 짚고 가기 2 — 변 위 판정이 없을 때 세 점의 홀짝이 어떻게 나오는가.
   *
   * 변 위 판정을 뺀 절차를 **정본과 같은 줄로** 따로 센다(변이 모듈은 답만 돌려주므로). 그 답이
   * 변이의 답과 같은지 대조한다 — 중화 실행에서는 변이가 정본이라 대조를 건너뛴다.
   */
  "pause-boundary-why": () => {
    const cases: [string, Point][] = [
      ["아래 변 위", [2, 0]],
      ["전개 입력 q3 · 변 위", Q3],
      ["꼭짓점 위", [0, 0]],
    ];
    const rows = cases.map(([label, p]) => {
      let inside = false;
      const flipped: string[] = [];
      for (const [name, a, b] of edges(L)) {
        if (a[1] > p[1] === b[1] > p[1]) continue;
        if (sideOf(a, b, p) > 0 === b[1] > a[1]) {
          inside = !inside;
          flipped.push(name);
        }
      }
      if (
        noBoundary.pointInPolygon !== pointInPolygon &&
        noBoundary.pointInPolygon(p, L) !== inside
      ) {
        throw new Error(`따로 센 홀짝이 변이의 답과 다르다 — ${pt(p)}`);
      }
      return [
        label,
        pt(p),
        flipped.length > 0 ? flipped.join(" ") : "없다",
        String(flipped.length),
        String(inside),
      ];
    });
    return md(
      ["배치", "질의 점", "홀짝을 뒤집은 변", "뒤집은 횟수", "홀짝만의 답"],
      rows,
      [3],
    );
  },

  /** `deep.walk` 3 — 높이를 지난 변에서 onLeft 와 goesUp. */
  "walk-cross": () => {
    const lines: string[] = [];
    for (const [name, p] of WALK) {
      for (const e of trace(p, L).logs) {
        if (!e.passes) continue;
        lines.push(
          `${padRight(name, 3)}  ${e.name}  aboveA ${padRight(String(e.aboveA), 5)}  aboveB ${padRight(String(e.aboveB), 5)}  onLeft ${padRight(String(e.onLeft), 5)}  goesUp ${padRight(String(e.goesUp), 5)}  →  ${e.flip ? "inside 를 뒤집는다" : "그대로"}`,
        );
      }
    }
    return lines.join("\n");
  },

  /** `deep.walk` 짚고 가기 3 — 높이 판정을 닫힌 구간으로 바꾸면. */
  "pause-closed": () => {
    const cases: [string, Point, Point[]][] = [
      ["꼭짓점 높이의 바깥 점", AT_VERTEX_OUT, L],
      ["꼭짓점 높이의 안쪽 점", AT_VERTEX_IN, L],
      ["전개 입력 q1", Q1, L],
    ];
    const points = scatter(TRIES, 8);
    const gaps = disagreements(L, points, closedRange.pointInPolygon);
    let vertexHeights = 0;
    for (const p of points) {
      if (L.some((v) => v[1] === p[1])) vertexHeights++;
    }
    return [
      contrast(cases, closedRange.pointInPolygon, "닫힌 구간으로 센 답"),
      "",
      `좌표 -8~8 의 질의 점 ${num(points.length)} 개 가운데 ${num(gaps)} 개에서 답이 틀리고, 꼭짓점과 높이가 같은 점은 ${num(vertexHeights)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 짚고 가기 3 — 닫힌 구간이 반개구간보다 더 뒤집는 변. */
  "pause-closed-inner": () => {
    const rows = [AT_VERTEX_OUT, AT_VERTEX_IN].map((p) => {
      const extra: string[] = [];
      for (const [name, a, b] of edges(L)) {
        const closed =
          Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]);
        const half = a[1] > p[1] !== b[1] > p[1];
        if (closed && !half && sideOf(a, b, p) > 0 === b[1] > a[1]) {
          extra.push(name);
        }
      }
      return [
        pt(p),
        extra.length > 0 ? extra.join(" · ") : "없다",
        String(extra.length),
        extra.length % 2 === 0 ? "그대로" : "바뀐다",
        String(withRule(p, L, "closed")),
      ];
    });
    return md(
      [
        "질의 점",
        "닫힌 구간만 더 뒤집은 변",
        "더 뒤집은 수",
        "홀짝",
        "닫힌 구간의 답",
      ],
      rows,
      [2],
    );
  },

  /** `deep.walk` 4 — 세 질의를 걸음마다 펼친다. */
  "walk-trace": () => {
    const steps = walkSteps();
    const rows = steps.map((s) => [
      `T${s.t}`,
      s.query,
      s.logs.map((e) => e.name).join(" "),
      DID_WORD[s.did],
      s.did === "edge" ? "true" : `${s.before} → ${s.after}`,
    ]);
    const answers = WALK.map(([name, p]) => `${name} ${pointInPolygon(p, L)}`);
    const seen = WALK.reduce((n, [, p]) => n + trace(p, L).logs.length, 0);
    return [
      md(["걸음", "질의", "본 변", "하는 일", "inside"], rows),
      "",
      `걸음은 ${steps.length} 개이고 본 변은 모두 ${seen} 개이며, 답은 ${answers.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 갈래마다 몇 번 참이 됐는가. */
  "walk-branch": () => {
    const tally = (queries: [Point, Point[]][]) => {
      const t = { fast: 0, slow: 0, edge: 0, crossed: 0, flips: 0, parity: 0 };
      for (const [p, polygon] of queries) {
        const r = judge(p, polygon);
        t.fast += r.fast;
        t.slow += r.slow;
        t.edge += r.onEdge ? 1 : 0;
        t.crossed += r.crossed;
        t.flips += r.flips;
        t.parity += r.onEdge ? 0 : 1;
      }
      return t;
    };
    const w = tally(WALK.map(([, p]) => [p, L]));
    const big = ring(64, COORD / 2);
    const b = tally(scatter(3, COORD / 2).map((p) => [p, big]));
    const rows: [string, string, number, number][] = [
      ["①", "배정밀도로 재고 그 자리에서 끝낸다", w.fast, b.fast],
      ["②", "큰 정수로 다시 잰다", w.slow, b.slow],
      ["③", "변 위라 그 자리에서 참", w.edge, b.edge],
      ["④", "높이를 반개구간으로 지난다", w.crossed, b.crossed],
      ["⑤", "교차라 뒤집는다", w.flips, b.flips],
      ["⑥", "다 본 뒤 홀짝으로 답한다", w.parity, b.parity],
    ];
    const zero = rows.filter(([, , a]) => a === 0).map(([k]) => k);
    return [
      md(
        ["갈래", "하는 일", "전개 입력에서", "좌표 상한의 원형에서"],
        rows.map(([k, what, a, c]) => [
          k,
          what,
          `${num(a)} 번`,
          `${num(c)} 번`,
        ]),
        [2, 3],
      ),
      "",
      `오른쪽 열은 꼭짓점 ${num(big.length)} 개짜리 원형 다각형(반지름 ${num(COORD / 2)})에 질의 세 개를 준 값입니다. 전개 입력에서 한 번도 참이 안 된 갈래는 ${zero.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 불러 본 값. */
  "final-calls": () => {
    const cases: [Point, string][] = [
      [Q1, "L"],
      [Q2, "L"],
      [Q3, "L"],
      [[0, 0], "L"],
      [[5, 1], "L"],
    ];
    const call = ([p, name]: [Point, string]) =>
      `pointInPolygon([${p[0]}, ${p[1]}], ${name})`;
    const w = Math.max(...cases.map((c) => call(c).length));
    return cases
      .map((c) => `${call(c).padEnd(w)}  ->  ${pointInPolygon(c[0], L)}`)
      .join("\n");
  },

  /** `related` — 반개구간이 꼭짓점을 몇 번 세는가. */
  "related-halfopen": () => {
    const p = AT_VERTEX_IN;
    const rows = edges(L).map(([name, a, b]) => {
      const upper = a[1] > p[1];
      const other = b[1] > p[1];
      return [
        name,
        `${a[1]}`,
        `${b[1]}`,
        upper ? "위" : "아래이거나 같음",
        other ? "위" : "아래이거나 같음",
        upper !== other ? "센다" : "뺀다",
      ];
    });
    const counted = edges(L).filter(
      ([, a, b]) => a[1] > p[1] !== b[1] > p[1],
    ).length;
    const atHeight = L.filter((v) => v[1] === p[1]).map(pt);
    return [
      md(
        ["변", "앞 끝의 높이", "뒤 끝의 높이", "앞 끝", "뒤 끝", "반개구간"],
        rows,
        [1, 2],
      ),
      "",
      `질의 점 ${pt(p)} 의 높이 ${p[1]} 에 꼭짓점이 ${atHeight.join(" · ")}${으로(p[1])} ${atHeight.length} 개 있는데, 반개구간이 센 변은 ${counted} 개이고 정본의 답은 ${pointInPolygon(p, L)} 입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const cases: [Point, Point, Point][] = [
      [[0, 0], [4, 0], Q1],
      [[4, 0], [4, 2], Q1],
      [[2, 2], [2, 4], Q3],
      [[0, 4], [0, 0], Q2],
    ];
    const rows = cases.map(([a, b, p]) => {
      const value = exactOf(a, b, p);
      const s = sideOf(a, b, p);
      return [
        `${pt(a)} → ${pt(b)}`,
        pt(p),
        bignum(value),
        String(s),
        s === 1 ? "왼쪽" : s === -1 ? "오른쪽" : "직선 위",
      ];
    });
    return md(
      ["변", "질의 점", "식이 낸 값", "부호", "점의 자리"],
      rows,
      [2, 3],
    );
  },

  /** `deep.math` ③ — 부등식 유도가 코드의 한 줄과 같은 답을 내는가. */
  "math-side": () => {
    const families: [string, Point[], number][] = [
      ["원형 12 · 좌표 -1,200~1,200", ring(12, 1_000), 1_200],
      ["별 다섯 · 좌표 -240~240", star(5, 100, 40), 240],
      ["톱니 여덟 · 좌표 -40~40", comb(8, 3), 40],
    ];
    let total = 0;
    let same = 0;
    const rows = families.map(([label, polygon, half]) => {
      let t = 0;
      let s = 0;
      for (const q of scatter(2_000, half)) {
        for (const [, a, b] of edges(polygon)) {
          if (a[1] > q[1] === b[1] > q[1]) continue;
          if (sideOf(a, b, q) === 0) continue;
          t++;
          if (meetsRight(a, b, q) === (sideOf(a, b, q) > 0 === b[1] > a[1]))
            s++;
        }
      }
      total += t;
      same += s;
      return [label, num(t), num(s)];
    });
    return [
      md(
        ["입력 가족", "높이를 지난 자리", "두 조건이 일치한 자리"],
        rows,
        [1, 2],
      ),
      "",
      `질의 점은 가족마다 2,000 개이고, 판정값이 0 인 자리는 뺐습니다. ${num(total)} 자리 가운데 ${num(same)} 자리에서 두 조건이 일치했습니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 오차 한계에 과제의 좌표 상한을 넣는다. */
  "math-error": () => {
    const rows = [1_000_000, 10_000_000, 23_726_566, 23_726_567, COORD].map(
      (c) => [
        num(c),
        ((c * c) / 2 ** 49).toFixed(9),
        (c * c) / 2 ** 49 < 1 ? "필요 없다" : "필요하다",
      ],
    );
    const rnd = makeRnd(SEED);
    let worst = 0;
    for (let at = 0; at < 300_000; at++) {
      const o: Point = [0, 0];
      const a: Point = [
        (rnd() % (2 * COORD)) - COORD,
        (rnd() % (2 * COORD)) - COORD,
      ];
      const b: Point = [
        (rnd() % (2 * COORD)) - COORD,
        (rnd() % (2 * COORD)) - COORD,
      ];
      const gap = Math.abs(approxOf(o, a, b) - Number(exactOf(o, a, b)));
      if (gap > worst) worst = gap;
    }
    // 한계 C² / 2^49 가 1 보다 작은 가장 큰 정수 C — 2^24.5 근처에서 한 칸씩 확인한다.
    let last = Math.floor(Math.sqrt(2 ** 49));
    while (((last + 1) * (last + 1)) / 2 ** 49 < 1) last++;
    while ((last * last) / 2 ** 49 >= 1) last--;
    return [
      md(
        ["좌표 상한 C", "오차 한계 C² / 2^49", "큰 정수 되재기"],
        rows,
        [0, 1],
      ),
      "",
      `한계가 1 보다 작은 가장 큰 좌표 상한은 ${num(last)} 이고, 좌표 상한 ${num(COORD)} 에서 한계는 ${((COORD * COORD) / 2 ** 49).toFixed(2)} 입니다. 정본의 하한 SAFE 는 그보다 큰 2 의 거듭제곱 ${num(SAFE)} 이고, 무작위 세 점 300,000 벌에서 잰 실제 최대 편차는 ${num(worst)}${josa(num(worst), "이었습니다", "였습니다")}.`,
    ].join("\n");
  },

  /** `invariant` ② — 변을 하나씩 볼 때마다 무엇이 참으로 남는가. */
  "invariant-states": () => {
    const polygon = comb(3, 3);
    const p: Point = [-1, 1];
    const rows: string[][] = [];
    let counted = 0;
    let match = 0;
    const { logs, answer } = trace(p, polygon);
    for (const e of logs) {
      if (e.flip) counted++;
      if ((counted % 2 === 1) === e.inside) match++;
      rows.push([
        e.name,
        seg(e.a, e.b),
        e.flip ? "교차한다" : "교차하지 않는다",
        String(counted),
        counted % 2 === 1 ? "홀수" : "짝수",
        String(e.inside),
      ]);
    }
    return [
      md(
        ["본 변", "두 끝점", "그 변과", "여기까지 교차 수", "홀짝", "inside"],
        rows,
        [3],
      ),
      "",
      `이빨 셋짜리 톱니 ${num(polygon.length)} 변에 질의 점 ${pt(p)} 을 줬고, 정본의 답은 ${answer} 입니다. ${rows.length} 줄 가운데 ${match} 줄에서 홀짝 열이 홀수인 것과 inside 가 true 인 것이 함께 참이거나 함께 거짓입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에서도 갈래가 하나씩만 답을 내는가. */
  "invariant-edges": () => {
    const tri: Point[] = [
      [0, 0],
      [2, 0],
      [1, 2],
    ];
    const flat: Point[] = [
      [0, 0],
      [4, 0],
      [4, 1],
      [0, 1],
    ];
    const half = COORD / 2;
    const bigSquare: Point[] = [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half],
    ];
    const cases: [string, Point, Point[]][] = [
      ["꼭짓점 셋짜리 다각형의 내부", [1, 1], tri],
      ["꼭짓점 위", [1, 2], tri],
      ["수평 변 위", [2, 1], flat],
      ["수평 변의 높이인 바깥 점", [5, 1], flat],
      ["좌표가 큰 정사각형의 한가운데", [0, 0], bigSquare],
      ["좌표가 큰 정사각형의 꼭짓점", [half, half], bigSquare],
      ["좌표가 큰 정사각형의 바깥", [COORD, 0], bigSquare],
      ["오목한 자리", Q2, L],
    ];
    const rows = cases.map(([label, p, polygon]) => {
      const r = judge(p, polygon);
      return [
        label,
        pt(p),
        String(polygon.length),
        String(r.crossed),
        String(r.flips),
        r.onEdge ? "변 위" : r.flips % 2 === 1 ? "홀수" : "짝수",
        String(r.answer),
      ];
    });
    return [
      md(
        [
          "배치",
          "질의 점",
          "꼭짓점",
          "높이를 지나는 변",
          "교차하는 변",
          "답을 정한 것",
          "답",
        ],
        rows,
        [2, 3, 4],
      ),
      "",
      `${cases.length} 배치 모두 변 위 판정과 홀짝 가운데 하나만 답을 정했습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 방향 보정을 뺀 변이. */
  "mutant-direction": () => {
    const cases: [string, Point, Point[]][] = [
      ["전개 입력 q1 · 내부", Q1, L],
      ["전개 입력 q2 · 오목한 자리", Q2, L],
      ["아래쪽 안", [3, 1], L],
    ];
    const points = scatter(TRIES, 8);
    const gaps = disagreements(L, points, noDirection.pointInPolygon);
    return [
      contrast(cases, noDirection.pointInPolygon, "방향 보정을 뺀 답"),
      "",
      `좌표 -8~8 의 질의 점 ${num(points.length)} 개 가운데 ${num(gaps)} 개에서 답이 틀립니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — L 자의 변이 어느 방향인가. */
  "mutant-edges": () => {
    const group = (pick: (a: Point, b: Point) => boolean) =>
      edges(L)
        .filter(([, a, b]) => pick(a, b))
        .map(([name, a, b]) => `${name} ${seg(a, b)}`);
    const up = group((a, b) => b[1] > a[1]);
    const down = group((a, b) => b[1] < a[1]);
    const flat = group((a, b) => b[1] === a[1]);
    return md(
      ["변의 방향", "L 자의 변", "변 수"],
      [
        ["위로 간다", up.join(" · "), String(up.length)],
        ["아래로 간다", down.join(" · "), String(down.length)],
        ["수평", flat.join(" · "), String(flat.length)],
      ],
      [2],
    );
  },

  /** `perf.derive` — 전개의 걸음을 기본 연산으로 센다. */
  "perf-count": () => {
    const steps = walkSteps();
    const span = (name: string) => {
      const ts = steps.filter((s) => s.query === name).map((s) => s.t);
      return `T${ts[0]}~T${ts.at(-1)}`;
    };
    const rows = WALK.map(([name, p]) => {
      const r = judge(p, L);
      return [
        name,
        span(name),
        String(r.seen),
        String(r.slow),
        String(r.boxes),
        String(r.crossed),
        String(r.ops),
      ];
    });
    const total = WALK.reduce((sum, [, p]) => sum + judge(p, L).ops, 0);
    return [
      md(
        [
          "질의",
          "걸음",
          "본 변",
          "② 로 간 판정",
          "칸 검사",
          "높이를 지난 변",
          "기본 연산",
        ],
        rows,
        [2, 3, 4, 5, 6],
      ),
      "",
      `세 질의의 기본 연산을 더하면 ${num(total)} 입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 총식에 전개의 값을 넣는다. */
  "perf-formula": () => {
    const rows = WALK.map(([name, p]) => {
      const r = judge(p, L);
      const k = r.seen;
      const f = r.fast;
      const z = r.boxes;
      const rr = r.onEdge ? 1 : 0;
      const s = r.crossed;
      const value = 14 * k - 6 * f + 4 * z - 2 * rr + s;
      if (value !== r.ops) {
        throw new Error(`총식이 센 값과 다르다 — ${name}`);
      }
      return [
        name,
        String(k),
        String(f),
        String(z),
        String(rr),
        String(s),
        String(value),
      ];
    });
    return [
      md(
        ["질의", "k", "f", "z", "r", "s", "14k − 6f + 4z − 2r + s"],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `세 줄 모두 총식이 낸 값과 센 값이 같습니다. 변 하나의 기본 연산은 가장 적으면 ${14 - 6}(① 로 끝나고 칸 검사와 방향 비교가 없을 때), 가장 많으면 ${14 + 4 + 1}(② 로 가고 칸 검사와 방향 비교가 다 붙을 때)입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 어떤 배치가 기본 연산을 가장 많이 쓰는가. */
  "worst-shape": () => {
    const cases: [string, Point, Point[]][] = [
      ["전개 입력 q1", Q1, L],
      ["원형 64 · 좌표 상한 · 안쪽", [0, 0], ring(64, COORD / 2)],
      ["원형 64 · 좌표 상한 · 바깥", [COORD, 0], ring(64, COORD / 2)],
      ["원형 64 · 좌표 64 · 안쪽", [0, 0], ring(64, 64)],
      ["별 열여섯 · 좌표 64 · 오목한 자리", [3, 0], star(16, 64, 24)],
      ["톱니 서른둘 · 좌표 64 · 안쪽", [30, 30], comb(32, 3)],
      ["바퀴살 여덟 · 좌표 3 · 한가운데", [0, 0], spokes(1, 3)],
    ];
    let best = "";
    let bestPer = 0;
    let least = "";
    let leastPer = Number.POSITIVE_INFINITY;
    let most = "";
    let mostOps = 0;
    const rows = cases.map(([label, p, polygon]) => {
      const r = judge(p, polygon);
      const per = r.ops / polygon.length;
      if (per > bestPer) {
        bestPer = per;
        best = label;
      }
      if (per < leastPer) {
        leastPer = per;
        least = label;
      }
      if (r.ops > mostOps) {
        mostOps = r.ops;
        most = label;
      }
      return [
        label,
        String(polygon.length),
        String(r.seen),
        String(r.slow),
        String(r.boxes),
        String(r.crossed),
        String(r.ops),
        per.toFixed(2),
      ];
    });
    return [
      md(
        [
          "배치",
          "꼭짓점",
          "본 변",
          "② 로 간 판정",
          "칸 검사",
          "높이를 지난 변",
          "기본 연산",
          "변 하나당",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      `변 하나당 기본 연산이 가장 많은 배치는 「${best}」${으로(best)} ${bestPer.toFixed(2)} 이고, 가장 적은 배치는 「${least}」${으로(least)} ${leastPer.toFixed(2)} 입니다. 기본 연산 총량이 가장 큰 배치는 「${most}」${으로(most)} ${num(mostOps)} 입니다.`,
    ].join("\n");
  },

  /**
   * `purpose.alt` — 두 설계의 계수 표. 값과 「적은 쪽」 열의 차 · 배수를 `.alt.ts` 의 계수에서
   * 계산한다(SPEC §14 `L51`). 뒤집힌다고 적는 줄은 앞 줄과 적은 쪽이 실제로 바뀌었는지 확인한다.
   */
  "alt-table": () => {
    const ray = altCases["반직선 교차 세기"]() as Record<string, number>;
    const bucket = altCases["높이 버킷"]() as Record<string, number>;
    const RAY = "반직선 교차 세기가";
    const BUCKET = "높이 버킷이";
    const pick = (key: string): [number, number] => {
      const a = ray[key];
      const b = bucket[key];
      if (a === undefined || b === undefined)
        throw new Error(`계수 없음 — ${key}`);
      return [a, b];
    };
    const rayWins = (key: string): boolean => {
      const [a, b] = pick(key);
      return a < b;
    };
    const diff = (key: string): string => {
      const [a, b] = pick(key);
      return `${a < b ? RAY : BUCKET} ${num(Math.abs(a - b))} 적습니다`;
    };
    const times = (key: string): string => {
      const [a, b] = pick(key);
      return `${a < b ? RAY : BUCKET} ${(Math.max(a, b) / Math.min(a, b)).toFixed(2)} 배 적습니다`;
    };
    const flip = (before: string, key: string, text: string): string => {
      if (rayWins(before) === rayWins(key)) {
        throw new Error(`뒤집히지 않았다 — ${before} → ${key}`);
      }
      return text;
    };
    const rows: [string, string, string][] = [
      [
        "전개 입력(L 자 여섯 변 · 질의 셋)",
        "전개 입력 기본 연산",
        diff("전개 입력 기본 연산"),
      ],
      [
        "톱니 `h`=512 · 질의 0 회",
        "톱니 질의 0 회 기본 연산",
        "전처리가 없는 쪽이 적습니다",
      ],
      [
        "톱니 `h`=512 · 질의 3 회",
        "톱니 질의 3 회 기본 연산",
        diff("톱니 질의 3 회 기본 연산"),
      ],
      [
        "톱니 `h`=512 · 질의 4 회",
        "톱니 질의 4 회 기본 연산",
        flip(
          "톱니 질의 3 회 기본 연산",
          "톱니 질의 4 회 기본 연산",
          "**여기서 순서가 뒤집힙니다**",
        ),
      ],
      [
        "톱니 `h`=512 · 질의 16 회",
        "톱니 질의 16 회 기본 연산",
        times("톱니 질의 16 회 기본 연산"),
      ],
      [
        "톱니 `h`=1302 · 질의 8 회",
        "이빨 1302 기본 연산",
        diff("이빨 1302 기본 연산"),
      ],
      [
        "톱니 `h`=1303 · 질의 8 회",
        "이빨 1303 기본 연산",
        flip(
          "이빨 1302 기본 연산",
          "이빨 1303 기본 연산",
          "**여기서 다시 뒤집힙니다**",
        ),
      ],
      [
        "원형 · 질의 1 회",
        "원형 질의 1 회 기본 연산",
        rayWins("원형 질의 1 회 기본 연산")
          ? diff("원형 질의 1 회 기본 연산")
          : "원형은 1 회부터 높이 버킷이 적습니다",
      ],
      [
        "원형 · 질의 16 회",
        "원형 질의 16 회 기본 연산",
        times("원형 질의 16 회 기본 연산"),
      ],
      [
        "톱니 · 추가 칸",
        "톱니 추가 칸",
        rayWins("톱니 추가 칸")
          ? "어느 축에서도 안 뒤집힙니다"
          : diff("톱니 추가 칸"),
      ],
    ];
    const bold = (mine: number, other: number): string =>
      mine < other ? `**${num(mine)}**` : num(mine);
    return md(
      ["입력", "반직선 교차 세기", "높이 버킷", "적은 쪽"],
      rows.map(([label, key, note]) => {
        const [a, b] = pick(key);
        return [label, bold(a, b), bold(b, a), note];
      }),
      [1, 2],
    );
  },
};
