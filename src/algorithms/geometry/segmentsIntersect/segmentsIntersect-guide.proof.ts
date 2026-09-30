/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 그림 사이드카(`-guide.fig.tsx`)도 이 파일의 고정 입력과 계수(`judge`)를 받아 그린다 — 그림과 표가
 * 같은 실행을 쓴다.
 *
 * **비용은 한 기준으로 센다.** 기본 연산 = 곱셈(배정밀도 · 큰 정수) + 나눗셈 + 큰 정수 변환 +
 * 범위 비교(좌표 칸의 좌표 비교 · 매개변수가 0 과 1 사이인지 보는 비교). 이 절차는 나눗셈과 매개변수
 * 비교를 쓰지 않으므로 판정 하나가 2 또는 8, 칸 검사 하나가 4 다. `.alt.ts` 가 같은 기준을 쓴다.
 * 추가 메모리는 호출마다 상수라 따로 세지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/geometry/segmentsIntersect/segmentsIntersect-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./segmentsIntersect-guide.alt.ts";
import {
  type Point,
  type Segment,
  segmentsIntersect,
  sideOf,
} from "./segmentsIntersect-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/**
 * 큰 정수의 천 단위 구분. **`Number` 로 바꿔 적지 않는다** — 이 편이 다루는 곱은 배정밀도가
 * 정수로 못 담는 크기라, 변환하는 순간 표가 「두 곱이 같다」로 보이게 된다.
 */
const bignum = (n: bigint): string =>
  (n < 0n ? "-" : "") +
  (n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
export const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 선분 하나의 표기. */
export const seg = (s: Segment): string => `${pt(s[0])}-${pt(s[1])}`;

/** 코드에 쓰는 선분 표기 — `[[0, 0], [6, 4]]`. */
const code = (s: Segment): string =>
  `[[${s[0][0]}, ${s[0][1]}], [${s[1][0]}, ${s[1][1]}]]`;

/** 조사를 고를 때 점 표기의 마지막 수를 읽는다 — 「(3,2) 가」·「(6,4) 가」. */
export const tail = (p: Point): string => String(p[1]);

/** 판정값의 뜻. */
export const turnWord = (s: number): string =>
  s > 0 ? "왼쪽으로 꺾인다" : s < 0 ? "오른쪽으로 꺾인다" : "한 직선 위다";

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
 * 본문 전개가 쓰는 고정 입력 — 선분 넷 가운데 `s1` 을 상대로 한 세 쌍.
 *
 * 세 쌍 안에 이 절차의 갈래가 전부 들어 있다 — `s1·s2` 는 서로를 가로지르고, `s1·s3` 은
 * 한쪽만 걸친 채 한 점도 공유하지 않으며, `s1·s4` 는 같은 직선 위에서 구간을 공유한다.
 * `s2·s4` 는 「불변식」 절이 쓰는 네 번째 쌍이다.
 */
export const S1: Segment = [
  [0, 0],
  [6, 4],
];
export const S2: Segment = [
  [0, 4],
  [6, 0],
];
export const S3: Segment = [
  [3, 0],
  [3, 1],
];
export const S4: Segment = [
  [3, 2],
  [9, 6],
];

/** 선분 넷의 이름. 본문과 그림이 같은 이름을 쓴다. */
export const NAMED: [string, Segment][] = [
  ["s1", S1],
  ["s2", S2],
  ["s3", S3],
  ["s4", S4],
];

export const WALK: [string, Segment, Segment][] = [
  ["s1·s2", S1, S2],
  ["s1·s3", S1, S3],
  ["s1·s4", S1, S4],
];

/** 과제의 좌표 절댓값 상한과, 정본이 쓰는 배정밀도 부호의 하한. */
export const COORD = 1_000_000_000;
export const SAFE = 2048;

/** 좌표가 상한에 붙었을 때 배정밀도 곱이 부호를 놓치는 배치. */
const FAR_O: Point = [0, 0];
const FAR_A: Point = [999_999_000, 999_999_041];
const FAR_C: Point = [48_780_439, 48_780_441];

/** 배정밀도로도 부호가 확실한, 좌표가 큰 X 자 배치. */
const BIG_X1: Segment = [
  [-COORD, -COORD],
  [COORD, COORD],
];
const BIG_X2: Segment = [
  [-COORD, COORD],
  [COORD, -COORD],
];

/** 좌표가 상한에 붙은 채 같은 직선 위에서 떨어져 있는 배치. */
const BIG_APART1: Segment = [
  [0, 0],
  [200_000_000, 400_000_000],
];
const BIG_APART2: Segment = [
  [400_000_000, 800_000_000],
  [500_000_000, COORD],
];

/** 여러 절이 함께 쓰는 작은 배치. */
const X_SMALL: [Segment, Segment] = [
  [
    [0, 0],
    [6, 4],
  ],
  [
    [0, 4],
    [6, 0],
  ],
];
const L_SHAPE: [Segment, Segment] = [
  [
    [0, 0],
    [1, 0],
  ],
  [
    [1, 0],
    [1, 1],
  ],
];
const T_SHAPE: [Segment, Segment] = [
  [
    [0, 0],
    [4, 0],
  ],
  [
    [2, 0],
    [2, 3],
  ],
];
const APART: [Segment, Segment] = [
  [
    [0, 0],
    [1, 0],
  ],
  [
    [2, 0],
    [3, 0],
  ],
];
const PARALLEL: [Segment, Segment] = [
  [
    [0, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [2, 1],
  ],
];
const SHORT: [Segment, Segment] = [
  [
    [0, 0],
    [10, 10],
  ],
  [
    [5, 0],
    [5, 4],
  ],
];
const POINT_ON: [Segment, Segment] = [
  [
    [0, 0],
    [4, 0],
  ],
  [
    [2, 0],
    [2, 0],
  ],
];

/**
 * 「전체 컨셉」의 여섯 배치. 그림 사이드카가 같은 목록을 그린다.
 */
export const SHAPES: [string, Segment, Segment][] = [
  ["서로를 가로지른다", ...X_SMALL],
  ["끝점끼리 만난다", ...L_SHAPE],
  ["끝점이 상대 선분 안에 있다", ...T_SHAPE],
  ["같은 직선 위에서 구간을 공유한다", S1, S4],
  ["같은 직선 위인데 떨어져 있다", ...APART],
  ["한쪽이 짧다", S1, S3],
];

/* ────────────────────────── 계수 ────────────────────────── */

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
  // 원시 값의 부호가 정본의 판정값과 어긋나면 이 파일의 산술이 정본과 다른 것이다.
  const want = value > 0n ? 1 : value < 0n ? -1 : 0;
  if (sideOf(o, a, b) !== want) {
    throw new Error(`원시 값의 부호가 정본과 어긋난다 — ${pt(o)} ${pt(a)}`);
  }
  return value;
}

/** 네 판정이 받는 세 점 — `d1`~`d4` 의 자리. */
export const triplesOf = (
  s1: Segment,
  s2: Segment,
): [Point, Point, Point][] => [
  [s2[0], s2[1], s1[0]],
  [s2[0], s2[1], s1[1]],
  [s1[0], s1[1], s2[0]],
  [s1[0], s1[1], s2[1]],
];

export interface Judged {
  d: [number, number, number, number];
  /** 배정밀도 값이 오차 한계를 넘어 그 자리에서 끝난 판정의 수. */
  fast: number;
  /** 큰 정수로 되잰 판정의 수. */
  slow: number;
  /** 되잰 곱 가운데 가장 큰 것의 비트 수. 되잰 적이 없으면 0. */
  bits: number;
  /** `④` 의 칸 검사가 실제로 불린 횟수. */
  boxes: number;
  /** 칸 검사를 부른 끝점의 자리(0~3)와 그 결과. */
  boxCalls: { at: number; hit: boolean }[];
  /** `③`·`④`·`⑤` 가운데 답을 낸 갈래. */
  branch: "③" | "④" | "⑤";
  answer: boolean;
  /** 이 기준의 기본 연산 — 판정 하나 2 또는 8, 칸 검사 하나 4. */
  ops: number;
}

const straddlesOf = (da: number, db: number): boolean =>
  da !== 0 && db !== 0 && da !== db;

const inBoxOf = (a: Point, b: Point, p: Point): boolean =>
  Math.min(a[0], b[0]) <= p[0] &&
  p[0] <= Math.max(a[0], b[0]) &&
  Math.min(a[1], b[1]) <= p[1] &&
  p[1] <= Math.max(a[1], b[1]);

/** 정본과 같은 절차를 걸음마다 세면서 실행한다. 답은 매번 정본과 대조한다. */
export function judge(s1: Segment, s2: Segment): Judged {
  const triples = triplesOf(s1, s2);
  const d = triples.map(([o, a, b]) => sideOf(o, a, b)) as Judged["d"];

  let fast = 0;
  let slow = 0;
  let bits = 0;
  for (const [o, a, b] of triples) {
    const approx = approxOf(o, a, b);
    if (approx > SAFE || approx < -SAFE) {
      fast++;
      continue;
    }
    slow++;
    const ux = BigInt(a[0] - o[0]);
    const uy = BigInt(a[1] - o[1]);
    const vx = BigInt(b[0] - o[0]);
    const vy = BigInt(b[1] - o[1]);
    for (const product of [ux * vy, uy * vx]) {
      const size = (product < 0n ? -product : product).toString(2).length;
      if (size > bits) bits = size;
    }
  }

  let branch: Judged["branch"];
  let answer: boolean;
  const boxCalls: { at: number; hit: boolean }[] = [];
  if (straddlesOf(d[0], d[1]) && straddlesOf(d[2], d[3])) {
    branch = "③";
    answer = true;
  } else {
    answer = false;
    for (const [at, [a, b, p]] of triples.entries()) {
      if (d[at] !== 0) continue;
      const hit = inBoxOf(a, b, p);
      boxCalls.push({ at, hit });
      if (hit) {
        answer = true;
        break;
      }
    }
    branch = answer ? "④" : "⑤";
  }
  if (answer !== segmentsIntersect(s1, s2)) {
    throw new Error(`계수용 절차가 정본과 다른 답을 냈다 — ${seg(s1)}`);
  }
  const boxes = boxCalls.length;
  return {
    d,
    fast,
    slow,
    bits,
    boxes,
    boxCalls,
    branch,
    answer,
    ops: fast * 2 + slow * 8 + boxes * 4,
  };
}

/**
 * 갈래를 부르는 이름. **파트 1 의 앞 절(`concept`·`deep.origin`·`deep.build`)과 `invariant` 에서 쓴다.**
 *
 * 원문자 라벨은 `deep.walk` 계열 절의 것이다 — 그 절이 코드 주석의 라벨로 분기 피복을 잰다(P4).
 * 불변식 절은 원문자를 아예 쓰지 않고(P14), 코드를 아직 안 보인 앞 절도 하는 일의 이름으로 부른다.
 */
export const BRANCH_NAME: Record<Judged["branch"], string> = {
  "③": "서로 걸침",
  "④": "끝점 검사",
  "⑤": "안 만남",
};

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

const SEED = 20_260_904;
export const PAIRS = 20_000;

/** 좌표 상한 `bound` 안에서 흩어진 선분 쌍. `.alt.ts` 의 생성식과 같다. */
function scattered(total: number, bound: number): [Segment, Segment][] {
  const rnd = makeRnd(SEED);
  const pick = (): Point => [rnd() % (bound + 1), rnd() % (bound + 1)];
  const out: [Segment, Segment][] = [];
  for (let at = 0; at < total; at++) {
    out.push([
      [pick(), pick()],
      [pick(), pick()],
    ]);
  }
  return out;
}

/**
 * `y = 2x` 위에 놓인 선분 쌍. 네 판정값이 전부 0 이 된다.
 *
 * `pair` 가 네 좌표를 어떻게 두 구간으로 묶을지 정한다 — 섞어 묶으면 구간이 겹치고,
 * 앞뒤로 갈라 묶으면 떨어진다. 둘 다 판정값은 전부 0 이라 갈래는 같고 답만 갈린다.
 */
function onLine(
  total: number,
  bound: number,
  pair: [number, number, number, number],
): [Segment, Segment][] {
  const rnd = makeRnd(SEED);
  const half = Math.floor(bound / 2);
  const out: [Segment, Segment][] = [];
  for (let at = 0; at < total; at++) {
    const xs = [rnd() % half, rnd() % half, rnd() % half, rnd() % half].sort(
      (p, q) => p - q,
    );
    const on = (k: number): Point => [xs[k] as number, 2 * (xs[k] as number)];
    const [a, b, c, d] = pair;
    out.push([
      [on(a), on(b)],
      [on(c), on(d)],
    ]);
  }
  return out;
}

/** 같은 직선 위에서 **구간을 공유하는** 선분 쌍. `.alt.ts` 의 생성식과 같다. */
const collinearOverlap = (total: number, bound: number): [Segment, Segment][] =>
  onLine(total, bound, [0, 2, 1, 3]);

/** 같은 직선 위에서 **떨어져 있는** 선분 쌍. 앞 두 좌표와 뒤 두 좌표로 갈라 묶는다. */
const collinearApart = (total: number, bound: number): [Segment, Segment][] =>
  onLine(total, bound, [0, 1, 2, 3]);

/** 「아이디어를 떠올리는 과정」이 쓰는 입력 가족 셋. 여러 블록과 그림이 같은 것을 본다. */
const FAMILIES: [string, [Segment, Segment][]][] = [
  ["흩어진 선분 · 좌표 0~6", scattered(PAIRS, 6)],
  ["흩어진 선분 · 좌표 상한 10^9", scattered(PAIRS, COORD)],
  ["같은 직선 위에서 구간 공유 · 10^9", collinearOverlap(PAIRS, COORD)],
];

/* ────────────────────────── 교점을 구하는 방법 ────────────────────────── */

/** 기본 연산의 몫 — 곱셈 · 나눗셈 · 큰 정수 변환 · 범위 비교. */
interface Arith {
  mul: number;
  div: number;
  conv: number;
  cmp: number;
}

const zero = (): Arith => ({ mul: 0, div: 0, conv: 0, cmp: 0 });
const opsOf = (c: Arith): number => c.mul + c.div + c.conv + c.cmp;

/**
 * 교점의 매개변수를 부동소수로 푸는 방법. `deep.origin` 이 가장 먼저 세우는 것이다.
 *
 * 두 직선을 `p1 + t(p2−p1)` · `p3 + u(p4−p3)` 로 놓고 연립해 `t`·`u` 를 구한 다음 둘 다
 * `[0,1]` 안인지 본다. 분모가 0 이면 두 직선이 평행하다고 보고 거짓을 돌려준다.
 */
export function byParameter(s1: Segment, s2: Segment, c?: Arith): boolean {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const rx = p2[0] - p1[0];
  const ry = p2[1] - p1[1];
  const sx = p4[0] - p3[0];
  const sy = p4[1] - p3[1];
  if (c) c.mul += 2;
  const den = rx * sy - ry * sx;
  if (den === 0) return false;
  const qx = p3[0] - p1[0];
  const qy = p3[1] - p1[1];
  if (c) {
    c.mul += 4;
    c.div += 2;
  }
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * ry - qy * rx) / den;
  const checks = [() => t >= 0, () => t <= 1, () => u >= 0, () => u <= 1];
  for (const check of checks) {
    if (c) c.cmp++;
    if (!check()) return false;
  }
  return true;
}

/** 분모가 0 인지 — 두 직선이 평행하거나 한 직선인지. */
const denOf = (s1: Segment, s2: Segment): number =>
  (s1[1][0] - s1[0][0]) * (s2[1][1] - s2[0][1]) -
  (s1[1][1] - s1[0][1]) * (s2[1][0] - s2[0][0]);

/**
 * 두 직선이 만나는 점을 **유리수로 정확히** 낸다. 평행이면 `null`.
 *
 * 「걸침」 절이 「걸침 ⇔ 그 점이 선분 안」을 값으로 보이는 데 쓴다. 정본과 다른 경로(교점을 직접
 * 계산하는 경로)라서, 그 표의 「선분 위인가」 열은 정본의 판정값을 베낀 것이 아니다.
 */
function meetOf(
  s1: Segment,
  s2: Segment,
): {
  x: [bigint, bigint];
  y: [bigint, bigint];
  t: [bigint, bigint];
  u: [bigint, bigint];
} | null {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const B = BigInt;
  const rx = B(p2[0] - p1[0]);
  const ry = B(p2[1] - p1[1]);
  const sx = B(p4[0] - p3[0]);
  const sy = B(p4[1] - p3[1]);
  const den = rx * sy - ry * sx;
  if (den === 0n) return null;
  const qx = B(p3[0] - p1[0]);
  const qy = B(p3[1] - p1[1]);
  const tn = qx * sy - qy * sx;
  const un = qx * ry - qy * rx;
  // P(t) = p1 + t·r, t = tn/den
  const xn = B(p1[0]) * den + tn * rx;
  const yn = B(p1[1]) * den + tn * ry;
  return { x: [xn, den], y: [yn, den], t: [tn, den], u: [un, den] };
}

const gcd = (a: bigint, b: bigint): bigint => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
};

/** 유리수 표기 — 정수면 그대로, 아니면 `4/3`. */
function frac([n, d]: [bigint, bigint]): string {
  let nn = n;
  let dd = d;
  if (dd < 0n) {
    nn = -nn;
    dd = -dd;
  }
  const g = gcd(nn, dd) || 1n;
  nn /= g;
  dd /= g;
  return dd === 1n ? nn.toString() : `${nn}/${dd}`;
}

/** `n/d` 가 0 이상 1 이하인가. */
const unit = ([n, d]: [bigint, bigint]): boolean =>
  d > 0n ? n >= 0n && n <= d : n <= 0n && n >= d;

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { segmentsIntersect: (s1: Segment, s2: Segment) => boolean };

const REF = new URL("./segmentsIntersect-guide.ref.ts", import.meta.url)
  .pathname;

const FILTER_LINE =
  /if \(approx > SAFE \|\| approx < -SAFE\) return approx > 0 \? 1 : -1;/;
const BOTH_LINE =
  /if \(straddles\(d1, d2\) && straddles\(d3, d4\)\) return true;/;
const BOX_LINE = /return d === 0 && inBox\(a, b, p\);/;
const P3_LINE = /^ {4}onSegment\(p1, p2, p3, d3\) \|\|$/;

/** 판정을 배정밀도 곱 하나로만 끝내는 사본. */
const floatOnly = await loadMutant<Impl>(REF, {
  swap: [FILTER_LINE, "if (true) return approx > 0 ? 1 : approx < 0 ? -1 : 0;"],
});

/** 한 선분의 두 끝점만 재고 답하는 사본. */
const oneSideOnly = await loadMutant<Impl>(REF, {
  swap: [BOTH_LINE, "if (straddles(d1, d2)) return true;"],
});

/** 판정값이 0 이면 칸을 보지 않고 참으로 답하는 사본. */
const noBox = await loadMutant<Impl>(REF, {
  swap: [BOX_LINE, "return d === 0;"],
});

/** `p3` 자리의 끝점 검사를 뺀 사본. 불변식의 「남김없이」를 지키던 줄이다. */
const dropP3 = await loadMutant<Impl>(REF, { drop: P3_LINE });

/**
 * 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다.
 *
 * **중화 실행에서는 건너뛴다.** `check-proof` 가 변이를 적용하지 않은 채 이 파일을 한 번 더
 * 부르는데, 그때 `loadMutant` 는 정본 모듈을 그대로 돌려준다. 변이의 함수가 정본과 **같은 객체**
 * 이면 중화 실행이다 — 그 자리에서 던지면 갈림 대조가 한 번도 실행되지 않는다(SPEC §0).
 */
function assertBreaks(impl: Impl["segmentsIntersect"], gaps: number[]): void {
  if (impl === segmentsIntersect) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 다른 구현의 답을 나란히 놓은 표를 만든다. */
function contrast(
  cases: [string, Segment, Segment][],
  other: Impl["segmentsIntersect"],
  otherHead: string,
): string {
  const gaps: number[] = [];
  const rows = cases.map(([label, s1, s2]) => {
    const want = segmentsIntersect(s1, s2);
    const got = other(s1, s2);
    gaps.push(want === got ? 0 : 1);
    return [
      label,
      seg(s1),
      seg(s2),
      String(want),
      String(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  assertBreaks(other, gaps);
  return md(["입력", "첫 인자", "둘째 인자", "정본", otherHead, "대조"], rows);
}

/** 가족 하나에서 변이가 정본과 다른 답을 낸 쌍의 수. */
function wrongIn(
  cases: [Segment, Segment][],
  other: (s1: Segment, s2: Segment) => boolean,
): number {
  let wrong = 0;
  for (const [s1, s2] of cases) {
    if (other(s1, s2) !== segmentsIntersect(s1, s2)) wrong++;
  }
  return wrong;
}

/** 서로 걸침만 보고, 판정값이 0 인 끝점은 따로 보지 않는 방법. */
function straddleOnly(s1: Segment, s2: Segment): boolean {
  const [d1, d2, d3, d4] = triplesOf(s1, s2).map(([o, a, b]) =>
    sideOf(o, a, b),
  );
  return (
    straddlesOf(d1 as number, d2 as number) &&
    straddlesOf(d3 as number, d4 as number)
  );
}

/**
 * 네 점이 한 직선 위인지와 좌표 칸이 겹치는지를 **정확한 교점 계산**으로 보는 독립 판정.
 * 정본과 다른 경로라서, 「정본이 맞다」를 정본 자신이 아닌 것으로 확인할 때 쓴다.
 */
function byExactMeet(s1: Segment, s2: Segment): boolean {
  const meet = meetOf(s1, s2);
  if (meet !== null) return unit(meet.t) && unit(meet.u);
  const all = [...triplesOf(s1, s2)].every(
    ([o, a, b]) => exactOf(o, a, b) === 0n,
  );
  if (!all) return false;
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const lo = (a: number, b: number) => Math.min(a, b);
  const hi = (a: number, b: number) => Math.max(a, b);
  return (
    lo(p1[0], p2[0]) <= hi(p3[0], p4[0]) &&
    lo(p3[0], p4[0]) <= hi(p1[0], p2[0]) &&
    lo(p1[1], p2[1]) <= hi(p3[1], p4[1]) &&
    lo(p3[1], p4[1]) <= hi(p1[1], p2[1])
  );
}

/* ────────────────────────── 「떠올리는 과정」의 계수 — 그림도 쓴다 ────────────────────────── */

/** 교점을 구하는 방법이 틀린 답을 낸 수와, 그 전부가 분모 0 갈래에서 나왔는지. */
export function naiveWrong(): {
  label: string;
  total: number;
  wrong: number;
  parallel: number;
}[] {
  return FAMILIES.map(([label, cases]) => {
    let wrong = 0;
    let parallel = 0;
    for (const [s1, s2] of cases) {
      if (byParameter(s1, s2) === segmentsIntersect(s1, s2)) continue;
      wrong++;
      if (denOf(s1, s2) === 0) parallel++;
    }
    return { label, total: cases.length, wrong, parallel };
  });
}

/** 한쪽 걸침만 본 사본과 서로 걸침만 본 방법이 좌표 0~6 에서 틀린 수. */
export function ladderWrong(): { oneSide: number; bothOnly: number[] } {
  const small = (FAMILIES[0] as [string, [Segment, Segment][]])[1];
  return {
    oneSide: wrongIn(small, oneSideOnly.segmentsIntersect),
    bothOnly: FAMILIES.map(([, cases]) => wrongIn(cases, straddleOnly)),
  };
}

/** 세 가족 전부에서 정본의 답이 정확한 교점 판정과 다른 쌍의 수, 그리고 쌍의 총수. */
export function exactMismatch(): { total: number; mismatch: number } {
  let total = 0;
  let mismatch = 0;
  for (const [, cases] of FAMILIES) {
    for (const [s1, s2] of cases) {
      total++;
      if (segmentsIntersect(s1, s2) !== byExactMeet(s1, s2)) mismatch++;
    }
  }
  return { total, mismatch };
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 여섯 배치가 어느 갈래로 가고 답이 무엇인가. */
  "concept-cases": () => {
    const rows = SHAPES.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      return [
        label,
        seg(s1),
        seg(s2),
        r.d.join(" "),
        BRANCH_NAME[r.branch],
        String(r.answer),
      ];
    });
    const trues = SHAPES.filter(([, a, b]) => segmentsIntersect(a, b)).length;
    const [, a4, b4] = SHAPES[3] as [string, Segment, Segment];
    const [, a5, b5] = SHAPES[4] as [string, Segment, Segment];
    const same = judge(a4, b4).d.join(" ") === judge(a5, b5).d.join(" ");
    return [
      md(
        ["배치", "첫 인자", "둘째 인자", "판정값 넷", "답을 낸 갈래", "답"],
        rows,
      ),
      "",
      `여섯 배치 가운데 답이 true 인 것은 ${trues} 개입니다. 넷째와 다섯째 줄은 판정값 넷이 ${
        same
          ? `둘 다 ${judge(a4, b4).d.join(" ")}${으로(judge(a4, b4).d.join(" "))} 같은데`
          : "서로 다른데"
      } 답이 갈리고, 교점의 좌표는 어느 줄에서도 쓰지 않았습니다.`,
    ].join("\n");
  },

  /** `concept` — 좌표를 키우면 곱이 배정밀도의 정수 한계를 넘는다. */
  "concept-exact": () => {
    const rows = [1_000, 1_000_000, 23_726_566, COORD].map((c) => {
      const product = 4 * c * c;
      return [
        num(c),
        num(2 * c),
        product.toExponential(2),
        product <= Number.MAX_SAFE_INTEGER ? "담긴다" : "안 담긴다",
      ];
    });
    const times = Math.floor((4 * COORD * COORD) / Number.MAX_SAFE_INTEGER);
    return [
      md(
        ["좌표 상한", "좌표의 차", "곱의 최댓값", "배정밀도에 정확히 담기"],
        rows,
        [0, 1, 2],
      ),
      "",
      `배정밀도가 정수를 오차 없이 담는 한계 Number.MAX_SAFE_INTEGER 는 ${num(Number.MAX_SAFE_INTEGER)} 이고, 좌표 상한 ${num(COORD)} 에서 곱 하나의 최댓값은 그 한계의 ${num(times)} 배가 넘습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 교점을 부동소수로 구하는 방법이 틀리는 입력. */
  "origin-naive": () => {
    const stats = naiveWrong();
    let sample: [Segment, Segment] | null = null;
    for (const [s1, s2] of (FAMILIES[0] as [string, [Segment, Segment][]])[1]) {
      if (byParameter(s1, s2) !== segmentsIntersect(s1, s2)) {
        sample = [s1, s2];
        break;
      }
    }
    if (sample === null) throw new Error("반례를 하나도 못 찾았다");
    const [bad1, bad2] = sample;
    const allParallel = stats.every((s) => s.wrong === s.parallel);
    return [
      md(
        ["입력 가족", "선분 쌍", "틀린 답", "그중 분모가 0", "틀린 비율"],
        stats.map((s) => [
          s.label,
          num(s.total),
          num(s.wrong),
          num(s.parallel),
          `${((100 * s.wrong) / s.total).toFixed(2)}%`,
        ]),
        [1, 2, 3, 4],
      ),
      "",
      `좌표 0~6 의 첫 반례는 첫 인자 ${seg(bad1)} · 둘째 인자 ${seg(bad2)} 이고, 답은 ${segmentsIntersect(bad1, bad2)} 인데 이 방법의 답은 ${byParameter(bad1, bad2)} 입니다. 틀린 답은 ${allParallel ? "전부" : "일부만"} 분모가 0 인 갈래에서 나왔습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 분모가 0 인 갈래 안에 무엇이 들어 있는가. */
  "origin-zero-den": () => {
    const cases: [string, Segment, Segment][] = [
      ["평행하고 떨어져 있다", ...PARALLEL],
      ["같은 직선 위인데 떨어져 있다", ...APART],
      ["같은 직선 위에서 구간을 공유한다", S1, S4],
      ["길이 0 선분이 상대 선분 위에 있다", ...POINT_ON],
    ];
    const rows = cases.map(([label, s1, s2]) => {
      if (denOf(s1, s2) !== 0) throw new Error(`분모가 0 이 아니다 — ${label}`);
      const want = segmentsIntersect(s1, s2);
      const got = byParameter(s1, s2);
      return [
        label,
        seg(s1),
        seg(s2),
        String(want),
        String(got),
        want === got ? "맞다" : "틀린다",
      ];
    });
    const bad = rows.filter((r) => r[5] === "틀린다").length;
    return [
      md(
        ["배치", "첫 인자", "둘째 인자", "답", "교점을 구하는 방법", "맞는가"],
        rows,
      ),
      "",
      `네 배치 모두 분모가 0 이라 이 방법은 한결같이 false 를 내고, 그중 ${bad} 배치에서 틀립니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 교점을 안 구해도 판정값 넷이 답을 정한다. */
  "origin-sides": () => {
    const r = judge(S1, S2);
    const names = ["d1", "d2", "d3", "d4"];
    const rows = triplesOf(S1, S2).map(([o, a, b], at) => [
      names[at] as string,
      `${pt(o)} → ${pt(a)} → ${pt(b)}`,
      exactOf(o, a, b).toString(),
      String(r.d[at]),
      turnWord(r.d[at] as number),
    ]);
    const meet = meetOf(S1, S2);
    if (meet === null) throw new Error("s1·s2 가 평행이다");
    return [
      md(["이름", "세 점", "원시 값", "판정값", "뜻"], rows, [2, 3]),
      "",
      `첫 인자 ${seg(S1)} · 둘째 인자 ${seg(S2)} 의 답은 ${r.answer} 이고, 두 선분이 만나는 점 (${frac(meet.x)},${frac(meet.y)}) 의 좌표는 어디에도 쓰지 않았습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 한 선분만 재면 무엇이 틀리는가. */
  "origin-oneside": () => {
    const cases: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      ["전개 입력 s1·s3", S1, S3],
      ["한쪽이 짧다", ...SHORT],
    ];
    const small = (FAMILIES[0] as [string, [Segment, Segment][]])[1];
    const wrong = wrongIn(small, oneSideOnly.segmentsIntersect);
    return [
      contrast(cases, oneSideOnly.segmentsIntersect, "첫 인자만 잰 답"),
      "",
      `좌표 0~6 의 선분 쌍 ${num(small.length)} 벌 가운데 ${num(wrong)} 벌에서 답이 틀립니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 서로 걸침만 보면 판정값 0 인 배치를 놓친다. */
  "origin-both": () => {
    const rows = FAMILIES.map(([label, cases]) => {
      let wrong = 0;
      let zeros = 0;
      for (const [s1, s2] of cases) {
        if (straddleOnly(s1, s2) === segmentsIntersect(s1, s2)) continue;
        wrong++;
        if (judge(s1, s2).d.some((v) => v === 0)) zeros++;
      }
      return [label, num(cases.length), num(wrong), num(zeros)];
    });
    return [
      md(
        ["입력 가족", "선분 쌍", "틀린 답", "그중 판정값에 0 이 있는 쌍"],
        rows,
        [1, 2, 3],
      ),
      "",
      "틀린 답은 전부 판정값에 0 이 있는 쌍에서 나왔고, 이 방법은 그런 쌍에 모두 false 를 냅니다.",
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 판정값 0 인 끝점을 칸으로 보면 갈래 셋이 모든 쌍을 가른다. */
  "origin-coverage": () => {
    const rows = FAMILIES.map(([label, cases]) => {
      const tally = { "③": 0, "④": 0, "⑤": 0 };
      for (const [s1, s2] of cases) tally[judge(s1, s2).branch]++;
      return [
        label,
        num(cases.length),
        num(tally["③"]),
        num(tally["④"]),
        num(tally["⑤"]),
      ];
    });
    const { total, mismatch } = exactMismatch();
    return [
      md(
        [
          "입력 가족",
          "선분 쌍",
          BRANCH_NAME["③"],
          BRANCH_NAME["④"],
          BRANCH_NAME["⑤"],
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `쌍마다 세 갈래 가운데 정확히 하나가 답을 냈습니다. 같은 ${num(total)} 쌍의 답을 교점을 유리수로 정확히 푼 판정과 대조했고, 다른 답은 ${num(mismatch)} 쌍입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 두 방식이 같은 입력에서 무엇을 얼마나 쓰는가. */
  "origin-compare": () => {
    const rows: string[][] = [];
    const cheap: number[] = [];
    for (const [label, cases] of FAMILIES.slice(0, 2)) {
      const theirs = zero();
      const mine = zero();
      let wrong = 0;
      for (const [s1, s2] of cases) {
        if (byParameter(s1, s2, theirs) !== segmentsIntersect(s1, s2)) wrong++;
        const r = judge(s1, s2);
        mine.mul += 2 * (r.fast + r.slow) + 2 * r.slow;
        mine.conv += 4 * r.slow;
        mine.cmp += 4 * r.boxes;
      }
      rows.push([
        label,
        "교점을 구한다",
        num(theirs.mul),
        num(theirs.div),
        num(theirs.conv),
        num(theirs.cmp),
        num(opsOf(theirs)),
        num(wrong),
      ]);
      rows.push([
        label,
        "어느 쪽인지만 잰다",
        num(mine.mul),
        num(mine.div),
        num(mine.conv),
        num(mine.cmp),
        num(opsOf(mine)),
        "0",
      ]);
      cheap.push(opsOf(mine) < opsOf(theirs) ? 1 : 0);
    }
    return [
      md(
        [
          "입력 가족",
          "방식",
          "곱셈",
          "나눗셈",
          "큰 정수 변환",
          "범위 비교",
          "기본 연산",
          "틀린 답",
        ],
        rows,
        [2, 3, 4, 5, 6, 7],
      ),
      "",
      `어느 쪽인지만 재는 방식은 나눗셈을 한 번도 쓰지 않습니다. 기본 연산은 좌표 0~6 에서 ${
        cheap[0] ? "더 적고" : "더 많고"
      }, 좌표 상한 10^9 에서 ${cheap[1] ? "더 적습니다" : "더 많습니다"}.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — 걸침 하나를 읽는다. */
  "build-straddle-read": () => {
    const rows: string[][] = [];
    for (const [label, s1, s2] of WALK.slice(0, 2)) {
      const r = judge(s1, s2);
      const name2 = label.split("·")[1] as string;
      rows.push([
        label,
        `s1 의 끝점이 ${name2} 의 직선을`,
        `${pt(s1[0])} ${pt(s1[1])}`,
        `d1 = ${r.d[0]} · d2 = ${r.d[1]}`,
        straddlesOf(r.d[0], r.d[1]) ? "걸친다" : "걸치지 않는다",
      ]);
      rows.push([
        label,
        `${name2} 의 끝점이 s1 의 직선을`,
        `${pt(s2[0])} ${pt(s2[1])}`,
        `d3 = ${r.d[2]} · d4 = ${r.d[3]}`,
        straddlesOf(r.d[2], r.d[3]) ? "걸친다" : "걸치지 않는다",
      ]);
    }
    return md(["쌍", "걸침", "끝점 둘", "판정값 둘", "읽은 것"], rows);
  },

  /** `deep.build` 개념 (d) — 걸침 둘과 교점의 자리. */
  "build-straddle-meet": () => {
    const cases: [string, Segment, Segment][] = [
      ["s1·s2", S1, S2],
      ["s1·s3", S1, S3],
      ["s3·s1", S3, S1],
      ["한쪽이 짧다", ...SHORT],
    ];
    let agree = 0;
    const rows = cases.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      const meet = meetOf(s1, s2);
      if (meet === null) throw new Error(`평행이다 — ${label}`);
      const first = straddlesOf(r.d[0], r.d[1]);
      const second = straddlesOf(r.d[2], r.d[3]);
      const onFirst = unit(meet.t);
      const onSecond = unit(meet.u);
      if (first === onFirst && second === onSecond) agree++;
      return [
        label,
        first ? "걸친다" : "아니다",
        second ? "걸친다" : "아니다",
        `(${frac(meet.x)},${frac(meet.y)})`,
        onFirst ? "위" : "밖",
        onSecond ? "위" : "밖",
        String(r.answer),
      ];
    });
    return [
      md(
        [
          "쌍",
          "첫 인자의 걸침",
          "둘째 인자의 걸침",
          "두 직선이 만나는 점",
          "첫 인자",
          "둘째 인자",
          "답",
        ],
        rows,
      ),
      "",
      `네 줄 가운데 ${agree} 줄에서 「첫 인자가 걸친다」와 「만나는 점이 첫 인자 위」가 함께 참이거나 함께 거짓이고, 둘째 쪽도 마찬가지입니다. 만나는 점은 판정값이 아니라 두 직선을 유리수로 연립해 따로 구했습니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 판정 하나가 어느 겹에서 부호를 정하는가. */
  "build-side": () => {
    const triples: [string, Point, Point, Point][] = [
      ["전개 입력", S1[0], S1[1], S2[0]],
      ["전개 입력", S1[0], S1[1], S2[1]],
      ["좌표 상한의 X 자", BIG_X2[0], BIG_X2[1], BIG_X1[0]],
      ["상한 근처의 점 하나", FAR_O, FAR_A, FAR_C],
    ];
    const rows = triples.map(([label, o, a, b]) => {
      const approx = approxOf(o, a, b);
      const big = approx > SAFE || approx < -SAFE;
      return [
        label,
        `${pt(o)} → ${pt(a)} → ${pt(b)}`,
        num(approx),
        big ? "넘는다" : "못 넘는다",
        big ? "배정밀도" : "큰 정수",
        String(sideOf(o, a, b)),
      ];
    });
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
      `넷째 줄은 배정밀도 값이 ${num(approxOf(FAR_O, FAR_A, FAR_C))} 인데 큰 정수로 다시 재면 ${bignum(exactOf(FAR_O, FAR_A, FAR_C))}${josa(bignum(exactOf(FAR_O, FAR_A, FAR_C)), "이고", "고")}, 정본은 뒤엣것의 부호를 돌려줍니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 세 쌍에서 서로 걸침이 어떻게 갈리는가. */
  "build-straddle-cases": () => {
    const rows = WALK.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      const first = straddlesOf(r.d[0], r.d[1]);
      const second = straddlesOf(r.d[2], r.d[3]);
      const why = (a: number, b: number) =>
        a === 0 || b === 0 ? "0 이 있다" : a === b ? "같다" : "갈린다";
      return [
        label,
        `${r.d[0]} ${r.d[1]}`,
        why(r.d[0], r.d[1]),
        `${r.d[2]} ${r.d[3]}`,
        why(r.d[2], r.d[3]),
        first && second ? "참" : "거짓",
      ];
    });
    return md(
      ["쌍", "d1 d2", "첫 걸침", "d3 d4", "둘째 걸침", "서로 걸침"],
      rows,
    );
  },

  /** `deep.build` 3단계 — 판정값이 0 인 끝점만 칸으로 본다. */
  "build-box": () => {
    const cases: [string, Segment, Segment][] = [
      ["s1·s3", S1, S3],
      ["s1·s4", S1, S4],
      ["같은 직선 위인데 떨어져 있다", ...APART],
    ];
    const names = ["p1", "p2", "p3", "p4"];
    const rows: string[][] = [];
    for (const [label, s1, s2] of cases) {
      const r = judge(s1, s2);
      const triples = triplesOf(s1, s2);
      if (r.boxCalls.length === 0) {
        rows.push([label, r.d.join(" "), "—", "—", "—"]);
        continue;
      }
      for (const call of r.boxCalls) {
        const [a, b, p] = triples[call.at] as [Point, Point, Point];
        rows.push([
          label,
          r.d.join(" "),
          `${names[call.at]} = ${pt(p)}`,
          `x [${Math.min(a[0], b[0])}, ${Math.max(a[0], b[0])}] · y [${Math.min(a[1], b[1])}, ${Math.max(a[1], b[1])}]`,
          call.hit ? "안" : "밖",
        ]);
      }
    }
    const counts = cases.map(([, a, b]) => judge(a, b).boxes);
    return [
      md(
        ["쌍", "판정값 넷", "칸을 본 끝점", "상대 선분의 칸", "칸 안인가"],
        rows,
      ),
      "",
      `칸 검사는 세 쌍에서 차례로 ${counts.join(" · ")} 번 불렸습니다. 판정값에 0 이 없는 쌍은 칸을 한 번도 보지 않고, 칸 안인 끝점이 나오면 거기서 멈춥니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": () =>
    [
      ...NAMED.map(([name, s]) => `const ${name}: Segment = ${code(s)};`),
      `// 이 절이 끝나면 ${WALK.map(([label, a, b]) => `${label} 는 ${segmentsIntersect(a, b)}`).join(", ")} 가 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 전개 입력의 판정 열두 번이 어느 겹에서 끝나는가. */
  "walk-side": () => {
    const rows: string[][] = [];
    let biggest = 0;
    for (const [label, s1, s2] of WALK) {
      for (const [o, a, b] of triplesOf(s1, s2)) {
        const approx = approxOf(o, a, b);
        biggest = Math.max(biggest, Math.abs(approx));
        rows.push([
          label,
          `sideOf(${pt(o)}, ${pt(a)}, ${pt(b)})`,
          String(approx),
          approx > SAFE || approx < -SAFE ? "①" : "②",
          String(sideOf(o, a, b)),
        ]);
      }
    }
    const viaTwo = rows.filter((r) => r[3] === "②").length;
    return [
      md(["쌍", "호출", "배정밀도 값", "끝난 곳", "돌려준 값"], rows, [2, 4]),
      "",
      `배정밀도 값의 절댓값은 가장 커도 ${biggest} 라 SAFE ${num(SAFE)}${을를(num(SAFE))} 넘지 못하고, 판정 ${rows.length} 번 가운데 ${viaTwo} 번이 ② 에서 끝났습니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 배정밀도 곱 하나로만 끝내면. */
  "pause-float": () => {
    const point: Segment = [FAR_C, FAR_C];
    const far: Segment = [FAR_O, FAR_A];
    const cases: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      ["좌표 상한의 X 자", BIG_X1, BIG_X2],
      ["상한 근처의 점 하나", far, point],
    ];
    const exact = exactOf(FAR_O, FAR_A, FAR_C);
    const approx = approxOf(FAR_O, FAR_A, FAR_C);
    const front = BigInt(FAR_A[0]) * BigInt(FAR_C[1]);
    const back = BigInt(FAR_A[1]) * BigInt(FAR_C[0]);
    return [
      contrast(cases, floatOnly.segmentsIntersect, "배정밀도 곱만 쓴 답"),
      "",
      `셋째 줄의 세 점 ${pt(FAR_O)} → ${pt(FAR_A)} → ${pt(FAR_C)} 을 두 방식으로 재면 이렇습니다.`,
      "",
      md(
        ["항", "큰 정수로", "배정밀도로"],
        [
          ["앞의 곱 ux · vy", bignum(front), num(FAR_A[0] * FAR_C[1])],
          ["뒤의 곱 uy · vx", bignum(back), num(FAR_A[1] * FAR_C[0])],
          ["둘의 차", bignum(exact), num(approx)],
        ],
        [1, 2],
      ),
      "",
      `두 곱은 각각 ${num(Number.MAX_SAFE_INTEGER)} 보다 커서 배정밀도에서 같은 값으로 반올림됩니다. 배정밀도는 차를 ${num(approx)}${으로(num(approx))} 내서 점이 직선 위라고 답하고, 큰 정수는 ${bignum(exact)}${을를(bignum(exact))} 내서 왼쪽이라고 답합니다.`,
    ].join("\n");
  },

  /** `deep.walk` 2 — `straddles` 여섯 번의 호출. */
  "walk-straddle": () => {
    const rows: [string, string, boolean][] = [];
    for (const [label, s1, s2] of WALK) {
      const r = judge(s1, s2);
      rows.push([
        label,
        `straddles(${r.d[0]}, ${r.d[1]})`,
        straddlesOf(r.d[0], r.d[1]),
      ]);
      rows.push([
        label,
        `straddles(${r.d[2]}, ${r.d[3]})`,
        straddlesOf(r.d[2], r.d[3]),
      ]);
    }
    const w = Math.max(...rows.map(([, call]) => call.length));
    return rows
      .map(
        ([label, call, got]) =>
          `${padRight(label, 6)}  ${call.padEnd(w)}  →  ${got}`,
      )
      .join("\n");
  },

  /** `deep.walk.pause` — 판정값을 곱해서 비교하면. */
  "pause-product": () => {
    const raw = [
      exactOf(BIG_X2[0], BIG_X2[1], BIG_X1[0]),
      exactOf(BIG_X2[0], BIG_X2[1], BIG_X1[1]),
    ] as [bigint, bigint];
    const product = raw[0] * raw[1];
    const digits = (v: bigint) => String(v.toString().replace("-", "").length);
    const r = judge(BIG_X1, BIG_X2);
    return [
      md(
        ["값", "크기", "자릿수"],
        [
          ["원시 판정값 d1", bignum(raw[0]), digits(raw[0])],
          ["원시 판정값 d2", bignum(raw[1]), digits(raw[1])],
          ["둘의 곱", bignum(product), digits(product)],
        ],
        [1, 2],
      ),
      "",
      `입력은 첫 인자 ${seg(BIG_X1)} · 둘째 인자 ${seg(BIG_X2)} 입니다. 정본의 판정값은 부호뿐이라 d1 = ${r.d[0]} · d2 = ${r.d[1]} 이고 곱은 ${r.d[0] * r.d[1]} 입니다. 원시 값의 곱은 ${digits(product)} 자리라 배정밀도가 정수를 오차 없이 담는 한계 ${num(Number.MAX_SAFE_INTEGER)}${을를(num(Number.MAX_SAFE_INTEGER))} 한참 넘습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 전개 입력에서 실제로 불린 `onSegment`. `||` 는 참이 나오면 멈춘다. */
  "walk-box": () => {
    const names = ["p1", "p2", "p3", "p4"];
    const rows: [string, string, string][] = [];
    for (const [label, s1, s2] of WALK) {
      const r = judge(s1, s2);
      if (r.branch === "③") {
        rows.push([
          label,
          "③ 에서 이미 true 라 onSegment 를 부르지 않는다",
          "",
        ]);
        continue;
      }
      for (const [at, [a, b, p]] of triplesOf(s1, s2).entries()) {
        const got = r.d[at] === 0 && inBoxOf(a, b, p);
        const looked = r.d[at] === 0 ? "칸을 봤다" : "칸을 안 봤다";
        rows.push([
          label,
          `onSegment(${pt(a)}, ${pt(b)}, ${names[at]}, ${r.d[at]})`,
          `→  ${String(got).padEnd(5)}  ${looked}`,
        ]);
        if (got) break;
      }
    }
    const w = Math.max(
      ...rows.filter((r) => r[2] !== "").map(([, call]) => call.length),
    );
    return rows
      .map(([label, call, tail]) =>
        tail === ""
          ? `${padRight(label, 6)}  ${call}`
          : `${padRight(label, 6)}  ${call.padEnd(w)}  ${tail}`,
      )
      .join("\n");
  },

  /** `deep.walk.pause` — 칸을 안 보고 답하면. */
  "pause-box": () => {
    const cases: [string, Segment, Segment][] = [
      ["같은 직선 위에서 구간을 공유", S1, S4],
      ["같은 직선 위인데 떨어져 있다", ...APART],
      ["같은 직선 위인데 떨어져 있다 · 좌표 상한", BIG_APART1, BIG_APART2],
    ];
    const family = collinearApart(PAIRS, COORD);
    const wrong = wrongIn(family, noBox.segmentsIntersect);
    return [
      contrast(cases, noBox.segmentsIntersect, "칸을 안 본 답"),
      "",
      `같은 직선 위에서 떨어져 있는 선분 쌍 ${num(family.length)} 벌 가운데 ${num(wrong)} 벌에서 답이 틀립니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 여덟 걸음의 상태값. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let step = 0;
    for (const [label, s1, s2] of WALK) {
      const r = judge(s1, s2);
      const d = r.d.join(" ");
      rows.push([
        `T${++step}`,
        label,
        "네 방향 판정을 잰다",
        d,
        `② 로 확정 ${r.slow} 번 · ① 로 확정 ${r.fast} 번`,
      ]);
      const straddle1 = straddlesOf(r.d[0], r.d[1]);
      const straddle2 = straddlesOf(r.d[2], r.d[3]);
      rows.push([
        `T${++step}`,
        label,
        "③ 양쪽이 다 갈리는가",
        d,
        `${straddle1 ? "참" : "거짓"} 그리고 ${straddle2 ? "참" : "거짓"} → ${
          r.branch === "③" ? `**참**이라 답 ${r.answer}` : "**거짓**"
        }`,
      ]);
      if (r.branch === "③") continue;
      rows.push([
        `T${++step}`,
        label,
        "④ 판정값이 0 인 끝점을 칸으로 본다",
        d,
        `칸 검사 ${r.boxes} 번 → ${r.branch === "④" ? "④ 가 **참**이라" : "④ 가 **거짓**이라 ⑤ 로 가서"} 답 ${r.answer}`,
      ]);
    }
    return [
      md(["걸음", "쌍", "하는 일", "d1 d2 d3 d4", "그 걸음이 낸 것"], rows),
      "",
      `방향 판정은 ${WALK.length * 4} 번이고, 세 쌍의 답은 차례로 ${WALK.map(([, a, b]) => segmentsIntersect(a, b)).join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 다섯 갈래가 몇 번씩 실행됐는가. */
  "walk-branch": () => {
    const small = WALK.map(([, s1, s2]) => judge(s1, s2));
    const fast = small.reduce((n, r) => n + r.fast, 0);
    const slow = small.reduce((n, r) => n + r.slow, 0);
    const big = judge(BIG_X1, BIG_X2);
    const rows = [
      [
        "①",
        "배정밀도로 재고 그 자리에서 끝낸다",
        `${fast} 번`,
        `좌표 상한의 X 자에서 ${big.fast} 번`,
      ],
      [
        "②",
        "큰 정수로 다시 잰다",
        `${slow} 번`,
        `좌표 상한의 X 자에서 ${big.slow} 번`,
      ],
      [
        "③",
        "양쪽이 다 갈리면 참",
        `${small.filter((r) => r.branch === "③").length} 쌍`,
        "s1·s2",
      ],
      [
        "④",
        "판정값이 0 인 끝점이 칸 안이면 참",
        `${small.filter((r) => r.branch === "④").length} 쌍`,
        `s1·s4 · 칸 검사 ${small[2]?.boxes ?? 0} 번`,
      ],
      [
        "⑤",
        "네 검사가 다 거짓이면 안 만난다",
        `${small.filter((r) => r.branch === "⑤").length} 쌍`,
        `s1·s3 · 칸 검사 ${small[1]?.boxes ?? 0} 번`,
      ],
    ];
    return [
      md(["갈래", "하는 일", "전개 입력에서", "참이 된 자리"], rows, [2]),
      "",
      `전개 입력에서 ① 은 ${fast} 번이라 좌표 상한의 X 자를 따로 넣어 ${big.fast} 번 참이 되는 것을 확인했습니다. ③ · ④ · ⑤ 는 세 쌍이 하나씩 나눠 가졌습니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 불러 본 결과. */
  "final-calls": () => {
    const cases: [Segment, Segment][] = [
      [S1, S2],
      [S1, S3],
      [S1, S4],
      POINT_ON,
      [
        [
          [0, 0],
          [0, 0],
        ],
        [
          [1, 1],
          [1, 1],
        ],
      ],
    ];
    const call = ([a, b]: [Segment, Segment]) =>
      `segmentsIntersect(${JSON.stringify(a)}, ${JSON.stringify(b)})`;
    const w = Math.max(...cases.map((c) => call(c).length));
    return cases
      .map((c) => `${call(c).padEnd(w)}  ->  ${segmentsIntersect(c[0], c[1])}`)
      .join("\n");
  },

  /** `related` — 퇴화 배치가 얼마나 자주 나오는가. */
  "related-degenerate": () => {
    const families: [string, [Segment, Segment][]][] = [
      ["좌표 0~6", scattered(PAIRS, 6)],
      ["좌표 0~20", scattered(PAIRS, 20)],
      ["좌표 0~100", scattered(PAIRS, 100)],
      ["좌표 상한 10^9", scattered(PAIRS, COORD)],
    ];
    const rows = families.map(([label, cases]) => {
      let degenerate = 0;
      for (const [s1, s2] of cases) {
        if (judge(s1, s2).d.some((v) => v === 0)) degenerate++;
      }
      return [
        label,
        num(cases.length),
        num(degenerate),
        `${((100 * degenerate) / cases.length).toFixed(2)}%`,
      ];
    });
    const walkDegenerate = WALK.filter(([, s1, s2]) =>
      judge(s1, s2).d.some((v) => v === 0),
    ).length;
    return [
      md(
        ["입력 가족", "선분 쌍", "판정값에 0 이 있는 쌍", "비율"],
        rows,
        [1, 2, 3],
      ),
      "",
      `전개 입력 세 쌍 가운데 퇴화 배치는 ${walkDegenerate} 쌍입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const triples: [Point, Point, Point][] = [
      [S1[0], S1[1], S2[0]],
      [S1[0], S1[1], S2[1]],
      [S1[0], S1[1], S4[0]],
      [S3[0], S3[1], S1[0]],
    ];
    const rows = triples.map(([o, a, b]) => {
      const value = exactOf(o, a, b);
      const sign = sideOf(o, a, b);
      return [
        `${pt(o)} → ${pt(a)} → ${pt(b)}`,
        value.toString(),
        String(sign),
        turnWord(sign),
      ];
    });
    return md(["세 점", "식이 낸 값", "부호", "뜻"], rows, [1, 2]);
  },

  /** `deep.math` ③ — 교점의 매개변수를 판정값으로 닫는다. */
  "math-param": () => {
    const pairs: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      [
        "사선과 수직선",
        [
          [0, 0],
          [4, 4],
        ],
        [
          [2, 0],
          [2, 4],
        ],
      ],
      ["한쪽이 짧다", ...SHORT],
    ];
    const rows = pairs.map(([label, s1, s2]) => {
      const [p1, p2] = s1;
      const [p3, p4] = s2;
      const d1 = exactOf(p3, p4, p1);
      const d2 = exactOf(p3, p4, p2);
      const t: [bigint, bigint] = [d1, d1 - d2];
      const meet = meetOf(s1, s2);
      if (meet === null) throw new Error(`평행이다 — ${label}`);
      if (frac(t) !== frac(meet.t)) {
        throw new Error(`식의 t* 가 연립해서 푼 값과 다르다 — ${label}`);
      }
      return [
        label,
        d1.toString(),
        d2.toString(),
        frac(t),
        `(${frac(meet.x)},${frac(meet.y)})`,
        unit(t) ? "s1 안" : "s1 밖",
        String(segmentsIntersect(s1, s2)),
      ];
    });
    return [
      md(
        [
          "입력",
          "원시 d1",
          "원시 d2",
          "t*",
          "두 직선이 만나는 점",
          "그 점",
          "답",
        ],
        rows,
        [1, 2],
      ),
      "",
      "셋째 줄은 t* 가 0 과 1 사이인데도 답이 false 입니다. 나머지 판정값 둘이 갈리지 않기 때문입니다.",
    ].join("\n");
  },

  /** `deep.math` ④ — 오차 한계에 제약 규모를 넣는다. */
  "math-error": () => {
    const rows = [1_000_000, 10_000_000, 100_000_000, COORD].map((c) => {
      const bound = (c * c) / 2 ** 49;
      return [num(c), bound.toFixed(6), bound < 1 ? "필요 없다" : "필요하다"];
    });
    let widest = 0;
    for (let c = 23_000_000; c <= 24_000_000; c++) {
      if ((c * c) / 2 ** 49 >= 1) break;
      widest = c;
    }
    const rnd = makeRnd(SEED);
    let worst = 0;
    for (let at = 0; at < 300_000; at++) {
      const ux = (rnd() % (2 * COORD)) - COORD;
      const uy = (rnd() % (2 * COORD)) - COORD;
      const vx = (rnd() % (2 * COORD)) - COORD;
      const vy = (rnd() % (2 * COORD)) - COORD;
      const gap = Math.abs(
        ux * vy -
          uy * vx -
          Number(BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx)),
      );
      if (gap > worst) worst = gap;
    }
    const limit = (COORD * COORD) / 2 ** 49;
    return [
      md(
        ["좌표 상한 C", "오차 한계 C² / 2^49", "큰 정수 되재기"],
        rows,
        [0, 1],
      ),
      "",
      `한계가 1 보다 작은 가장 큰 좌표 상한은 ${num(widest)} 이고(한계 ${((widest * widest) / 2 ** 49).toFixed(9)}), 그다음 값 ${num(widest + 1)} 에서 한계가 ${(((widest + 1) * (widest + 1)) / 2 ** 49).toFixed(9)}${으로((((widest + 1) * (widest + 1)) / 2 ** 49).toFixed(9))} 1 을 넘습니다. 좌표 상한 ${num(COORD)} 에서 한계는 ${limit.toFixed(2)} 이고, 정본의 하한 SAFE 는 그보다 큰 2 의 거듭제곱 ${num(SAFE)} 입니다. 무작위 네 성분 ${num(300_000)} 벌에서 잰 실제 최대 편차는 ${num(worst)}${josa(num(worst), "이었습니다", "였습니다")}.`,
    ].join("\n");
  },

  /** `invariant` ② — 갈래 셋이 겹치지 않는다. */
  "invariant-states": () => {
    const cases: [string, Segment, Segment][] = [
      ["s1·s2", S1, S2],
      ["s1·s3", S1, S3],
      ["s1·s4", S1, S4],
      ["s2·s4", S2, S4],
    ];
    let both = 0;
    const rows = cases.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      const straddle =
        straddlesOf(r.d[0], r.d[1]) && straddlesOf(r.d[2], r.d[3]);
      const zeros = r.d.filter((v) => v === 0).length;
      if (straddle && r.branch === "④") both++;
      return [
        label,
        r.d.join(" "),
        String(zeros),
        straddle ? "참" : "거짓",
        r.branch === "④" ? "참" : "거짓",
        BRANCH_NAME[r.branch],
        String(r.answer),
      ];
    });
    return [
      md(
        [
          "쌍",
          "판정값 넷",
          "0 의 개수",
          BRANCH_NAME["③"],
          BRANCH_NAME["④"],
          "답을 낸 갈래",
          "답",
        ],
        rows,
        [2],
      ),
      "",
      `${BRANCH_NAME["③"]}이 참인 줄에는 0 이 하나도 없고, ${BRANCH_NAME["④"]}가 참인 줄에는 0 이 하나 이상입니다. 두 열이 함께 참인 줄은 ${both} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, Segment, Segment][] = [
      ["두 선분이 같다", S1, S1],
      ["길이 0 선분이 상대 선분 위", ...POINT_ON],
      [
        "길이 0 선분이 상대 선분 밖",
        [
          [0, 0],
          [4, 0],
        ],
        [
          [2, 1],
          [2, 1],
        ],
      ],
      [
        "점 둘이 같은 자리",
        [
          [3, 3],
          [3, 3],
        ],
        [
          [3, 3],
          [3, 3],
        ],
      ],
      [
        "점 둘이 다른 자리",
        [
          [0, 0],
          [0, 0],
        ],
        [
          [1, 1],
          [1, 1],
        ],
      ],
      ["끝점끼리 만난다", ...L_SHAPE],
      ["평행하고 떨어져 있다", ...PARALLEL],
      ["좌표 상한의 X 자", BIG_X1, BIG_X2],
    ];
    const rows = cases.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      return [
        label,
        seg(s1),
        seg(s2),
        r.d.join(" "),
        BRANCH_NAME[r.branch],
        String(r.answer),
      ];
    });
    return md(
      ["입력", "첫 인자", "둘째 인자", "판정값 넷", "갈래", "답"],
      rows,
    );
  },

  /** `invariant` ③ — `p3` 자리의 끝점 검사를 빼면. */
  "mutant-drop-p3": () => {
    const cases: [string, Segment, Segment][] = [
      ["끝점이 상대 선분 안에 있다", ...T_SHAPE],
      ["s2·s4", S2, S4],
      ["s1·s4", S1, S4],
    ];
    return contrast(cases, dropP3.segmentsIntersect, "p3 검사를 뺀 답");
  },

  /** `perf.derive` — 한 번의 호출이 하는 일. */
  "perf-count": () => {
    // 걸음 번호는 `walk-trace` 와 같은 규칙으로 센다 — ③ 에서 끝난 쌍은 두 걸음, 나머지는 셋.
    let step = 0;
    let total = 0;
    const rows = WALK.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      const from = step + 1;
      step += r.branch === "③" ? 2 : 3;
      total += r.ops;
      return [
        label,
        `T${from}~T${step}`,
        "4",
        String(r.fast),
        String(r.slow),
        String(r.boxes),
        String(r.ops),
      ];
    });
    return [
      md(
        [
          "쌍",
          "걸음",
          "방향 판정",
          "① 로 끝난 판정",
          "② 로 간 판정",
          "칸 검사",
          "기본 연산",
        ],
        rows,
        [2, 3, 4, 5, 6],
      ),
      "",
      `세 쌍의 기본 연산을 더하면 ${total} 입니다.`,
    ].join("\n");
  },

  /** `perf.bounds` — 총식의 두 끝. */
  "perf-formula": () => {
    const f = (fast: number, boxes: number) =>
      2 * fast + 8 * (4 - fast) + 4 * boxes;
    const rows: string[][] = [
      ...WALK.map(([label, a, b]) => {
        const r = judge(a, b);
        if (f(r.fast, r.boxes) !== r.ops) throw new Error("총식이 셈과 다르다");
        return [label, String(r.fast), String(r.boxes), String(r.ops)];
      }),
    ];
    const big = judge(BIG_X1, BIG_X2);
    rows.push([
      "좌표 상한의 X 자",
      String(big.fast),
      String(big.boxes),
      String(big.ops),
    ]);
    const low = f(4, 0);
    const high = f(0, 4);
    return [
      md(["배치", "f", "z", "2f + 8(4 − f) + 4z"], rows, [1, 2, 3]),
      "",
      `f 와 z 가 각각 0 이상 4 이하이므로 기본 연산은 가장 적으면 f = 4 · z = 0 의 ${low}, 가장 많으면 f = 0 · z = 4 의 ${high} 이고, 둘은 ${high / low} 배 차이입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 어떤 배치가 무엇을 가장 많이 쓰는가. */
  "worst-shape": () => {
    const shapes: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      ["전개 입력 s1·s4", S1, S4],
      ["좌표 상한의 X 자", BIG_X1, BIG_X2],
      ["같은 직선 위인데 떨어져 있다 · 좌표 상한", BIG_APART1, BIG_APART2],
      ["같은 직선 위인데 떨어져 있다", ...APART],
      ["상한 근처의 점 하나", [FAR_O, FAR_A], [FAR_C, FAR_C]],
    ];
    const judged = shapes.map(([label, s1, s2]) => ({
      label,
      r: judge(s1, s2),
    }));
    const rows = judged.map(({ label, r }) => [
      label,
      String(r.slow),
      r.bits === 0 ? "—" : String(r.bits),
      String(r.boxes),
      String(r.ops),
      BRANCH_NAME[r.branch],
    ]);
    const top = (pick: (r: Judged) => number) => {
      const best = Math.max(...judged.map(({ r }) => pick(r)));
      return {
        value: best,
        names: judged.filter(({ r }) => pick(r) === best).map((j) => j.label),
      };
    };
    const ops = top((r) => r.ops);
    const bits = top((r) => r.bits);
    const least = Math.min(...judged.map(({ r }) => r.ops));
    // 「A」과 「B」 — 이음 조사는 앞 이름의 끝 글자에서 고른다.
    const lastOf = (xs: string[]) => xs.at(-1) ?? "";
    const names = (xs: string[]) =>
      xs
        .map((x, k) =>
          k < xs.length - 1 ? `「${x}」${과와(x).trim()}` : `「${x}」`,
        )
        .join(" ");
    const leastNames = judged
      .filter(({ r }) => r.ops === least)
      .map((j) => j.label);
    return [
      md(
        [
          "배치",
          "되잰 판정",
          "곱의 최대 비트",
          "칸 검사",
          "기본 연산",
          "답을 낸 갈래",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `기본 연산이 가장 많은 배치는 ${names(ops.names)}${으로(lastOf(ops.names))} ${ops.value} 이고, 곱의 비트 수가 가장 큰 배치는 ${names(bits.names)}${으로(lastOf(bits.names))} ${bits.value} 비트입니다. 기본 연산이 가장 적은 배치는 ${names(leastNames)}${으로(lastOf(leastNames))} ${least} 입니다.`,
    ].join("\n");
  },

  /** `selfcheck` — T5 의 판정값과 칸 검사. */
  "selfcheck-t5": () => {
    const r = judge(S1, S3);
    const zeros = r.d.filter((v) => v === 0).length;
    return md(
      ["걸음", "판정값 넷", "0 인 판정값", "칸 검사", "답"],
      [["T5", r.d.join(" "), `${zeros} 개`, `${r.boxes} 번`, String(r.answer)]],
      [],
    );
  },

  /**
   * `purpose.alt` — 두 설계의 기본 연산 표. 값과 「적은 쪽」 열의 차 · 배수를 `.alt.ts` 의 계수에서
   * 계산한다(SPEC §14 `L51`). 뒤집힌다고 적는 줄은 앞 줄과 적은 쪽이 실제로 바뀌었는지 확인한다.
   */
  "alt-table": () => {
    const mine = altCases.걸러내기() as Record<string, number>;
    const theirs = altCases["큰 정수 전용"]() as Record<string, number>;
    const pick = (key: string): [number, number] => {
      const a = mine[key];
      const b = theirs[key];
      if (a === undefined || b === undefined) {
        throw new Error(`계수 없음 — ${key}`);
      }
      return [a, b];
    };
    const mineWins = (key: string): boolean => {
      const [a, b] = pick(key);
      return a < b;
    };
    const who = (key: string): string =>
      mineWins(key) ? "걸러내기가" : "큰 정수 전용이";
    const diff = (key: string): string => {
      const [a, b] = pick(key);
      return `${who(key)} ${num(Math.abs(a - b))} 적습니다`;
    };
    const times = (key: string): string => {
      const [a, b] = pick(key);
      return `${who(key)} ${(Math.max(a, b) / Math.min(a, b)).toFixed(2)} 배 적습니다`;
    };
    const flip = (before: string, key: string): string => {
      if (mineWins(before) === mineWins(key)) {
        throw new Error(`뒤집히지 않았다 — ${before} → ${key}`);
      }
      return "**여기서 순서가 뒤집힙니다**";
    };
    const rows: [string, string, string][] = [
      [
        "전개 입력(세 쌍 · 좌표 9 이하)",
        "전개 입력 기본 연산",
        diff("전개 입력 기본 연산"),
      ],
      [
        "좌표 상한 2^6 · 4,096 쌍",
        "좌표 상한 2^6 기본 연산",
        times("좌표 상한 2^6 기본 연산"),
      ],
      [
        "좌표 상한 2^7 · 4,096 쌍",
        "좌표 상한 2^7 기본 연산",
        flip("좌표 상한 2^6 기본 연산", "좌표 상한 2^7 기본 연산"),
      ],
      [
        "좌표 상한 10^9 · 4,096 쌍",
        "좌표 상한 10^9 기본 연산",
        times("좌표 상한 10^9 기본 연산"),
      ],
      [
        "같은 직선 위 · 10^9 · 4,096 쌍",
        "같은 직선 위 기본 연산",
        diff("같은 직선 위 기본 연산"),
      ],
    ];
    const bold = (x: number, y: number): string =>
      x < y ? `**${num(x)}**` : num(x);
    return md(
      ["입력", "걸러내기", "큰 정수 전용", "적은 쪽"],
      rows.map(([label, key, note]) => {
        const [a, b] = pick(key);
        return [label, bold(a, b), bold(b, a), note];
      }),
      [1, 2],
    );
  },
};
