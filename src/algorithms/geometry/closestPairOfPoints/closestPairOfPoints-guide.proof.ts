/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.md
 *
 * ## 비용을 세는 기준 — 원고 전체에서 하나
 *
 * **기본 연산**은 셋을 각각 1 로 센 합이다.
 *
 *   거리 계산  두 점의 제곱 거리를 만들어 지금까지의 최솟값과 비교한 일
 *   좌표 비교  두 점의 좌표끼리, 또는 좌표 차의 제곱과 최솟값을 비교한 일(정렬 · 합치기 · 띠 거르기 · 멈춤)
 *   칸 조회    격자에서 칸 하나를 찾은 일. 격자에 나눠 담는 방법에서만 나온다(`.alt.ts`)
 *
 * **메모리는 할당 칸**으로 센다 — 입력 밖에 새로 만든 배열 칸을 잡을 때마다 더한 누적 합이다(버린 것도 센다). 정렬한 사본 · 가른
 * 두 절반 · 합친 목록 · 띠 · 기저의 y 순서 사본이 그것이다.
 *
 * 정렬은 **합치기 정렬로 센다.** 정본은 `Array.prototype.sort` 를 부르는데, 그 안에서 비교를 몇 번
 * 하는지는 엔진이 정한다. 같은 입력에 같은 안정 정렬을 걸면 같은 순서가 나오므로, 세는 판은 교과서
 * 합치기 정렬로 같은 순서를 만들고 비교를 센다. 세는 판의 답은 매번 정본과 대조한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 *
 * **큰 입력에는 값만 세는 판을 쓴다.** 걸음마다 점 목록을 베끼는 기록(`record`)은 전개 입력 여덟
 * 점에만 쓴다 — 큰 입력에서 걸음마다 사본을 남기면 메모리가 모자라 출력 없이 죽는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  closestPairOfPoints,
  type Point,
  solve,
} from "./closestPairOfPoints-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => (n + 0).toLocaleString("en-US");

/** 거리 하나의 표기. 소수 넷째 자리까지 적는다. */
export const dist = (x: number): string =>
  Number.isFinite(x) ? x.toFixed(4) : "무한대";

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
export const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 점 목록의 표기. 칸 사이는 한 칸이다. */
export const list = (points: readonly Point[]): string =>
  points.map(pt).join(" ");

/** 두 점의 표기 — 「(3,1)–(5,2)」. */
export const pair = (a: Point, b: Point): string => `${pt(a)}–${pt(b)}`;

/** 점 표기 뒤 조사 — 소리 나는 마지막 글자는 닫는 괄호 앞의 수다. */
export const tailOf = (p: Point): number => p[1];

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

/** 점 목록이 y 순서(y 가 줄지 않는 순서)인가. */
const risingY = (ps: readonly Point[]): boolean =>
  ps.every((p, at) => at === 0 || (ps[at - 1] as Point)[1] <= p[1]);

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력 — 점 여덟 개. 이미 x 순서다.
 *
 * 갈래 다섯을 한 입력으로 전부 실행한다. 재귀가 두 단 내려가고 기저가 넷이며, 답인
 * `(3,1)`·`(5,2)` 가 분할선을 가로지르는 쌍이라 띠 비교가 실제로 값을 바꾼다.
 */
export const WALK: Point[] = [
  [0, 0],
  [2, 6],
  [3, 1],
  [4, 8],
  [5, 2],
  [6, 5],
  [8, 3],
  [9, 7],
];

/** 오른쪽 절반 끝에 답이 있는 배치. 두 절반의 최솟값을 안 쓰면 답이 갈린다. */
const RIGHT_END: Point[] = [
  [0, 0],
  [1, 50],
  [100, 0],
  [102, 0],
  [500, 0],
  [501, 0],
];

/** 분할선을 가로지르는 쌍이 답인 가장 작은 배치. */
const CROSS: Point[] = [
  [0, 0],
  [10, 0],
  [11, 0],
  [21, 0],
];

/**
 * 같은 좌표의 점이 둘 있는 배치. 답이 0 이다.
 *
 * 점을 넷으로 둔다 — 셋 이하면 기저에서 끝나 분할·합치기·띠를 하나도 안 지나가므로, 그 자리를
 * 다루는 변이 표에서 「같다」 가 무슨 뜻인지가 흐려진다.
 */
const SAME: Point[] = [
  [1, 2],
  [3, 4],
  [1, 2],
  [9, 9],
];

/** 점이 둘뿐인 최소 입력. */
const PAIR: Point[] = [
  [0, 0],
  [3, 4],
];

/** x 는 오름차순인데 y 가 오르내리는 배치. 기저의 y 정렬을 빼면 여기서 답이 갈린다. */
export const ZIGZAG: Point[] = [
  [0, 0],
  [1, 2],
  [2, 4],
  [3, 6],
  [4, 5],
  [5, 1],
  [6, 3],
  [7, 7],
];

/** 모든 점이 한 세로줄 위에 있는 배치. 띠가 구간 전체가 된다. */
export function column(n: number): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < n; at++) out.push([0, at]);
  return out;
}

/**
 * 세로줄 위에 y 를 뒤섞어 놓은 배치.
 *
 * `column` 은 y 가 이미 오름차순이라 다시 정렬해도 비교가 적게 든다 — 그 배치로 재면 「다시
 * 정렬하면 로그가 하나 더 붙는다」 가 값으로 안 나온다. 순서를 뒤섞어야 정렬 비용이 실제로 붙는다.
 */
function shuffledColumn(n: number): Point[] {
  const ys = Array.from({ length: n }, (_, at) => at);
  const next = rng(20_260_906);
  for (let at = n - 1; at > 0; at--) {
    const swap = next() % (at + 1);
    const keep = ys[at] as number;
    ys[at] = ys[swap] as number;
    ys[swap] = keep;
  }
  return ys.map((y) => [0, y] as Point);
}

/** 모든 점이 한 가로줄 위에 있는 배치. 띠에 점이 거의 안 남는다. */
function row(n: number): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < n; at++) out.push([at, 0]);
  return out;
}

/** 한 변이 `side` 인 정사각 격자. 답이 1 이다. */
function lattice(side: number): Point[] {
  const out: Point[] = [];
  for (let x = 0; x < side; x++) {
    for (let y = 0; y < side; y++) out.push([x, y]);
  }
  return out;
}

/** 32 비트 xorshift. 실행마다 같은 값이 나온다. */
export function rng(seed: number): () => number {
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

/** 균등 배치의 좌표 상한 — 한 변이 이만한 정사각형에 흩는다. */
export const SPREAD = 100_000_000;

/** 균등 배치의 씨앗. */
export const SEED = 20_260_906;

const UNIFORM = new Map<number, Point[]>();

/** 한 변이 `SPREAD` 인 정사각형에 흩은 점 `n` 개. 같은 좌표는 걸러 낸다. */
export function uniform(n: number): Point[] {
  const hit = UNIFORM.get(n);
  if (hit !== undefined) return hit;
  const next = rng(SEED);
  const out: Point[] = [];
  const seen = new Set<number>();
  while (out.length < n) {
    const x = next() % SPREAD;
    const y = next() % SPREAD;
    const key = x * SPREAD + y;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([x, y]);
  }
  UNIFORM.set(n, out);
  return out;
}

/** 과제의 점 수 상한과 좌표 절댓값 상한. */
export const MAX_N = 100_000;
const COORD = 1_000_000_000;

/** 1 초의 예산 — 초당 기본 연산 1 억 번. */
export const PER_SECOND = 100_000_000;

/** 배정밀도가 정수를 어긋남 없이 담는 한계와, 과제가 허용하는 상대 오차. */
const EXACT = Number.MAX_SAFE_INTEGER;
const TOLERANCE = 1e-9;

/** 큰 정수의 천 단위 구분. `Number` 로 바꿔 적으면 표가 어림수로 보인다. */
const bignum = (n: bigint): string =>
  (n < 0n ? "-" : "") +
  (n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 두 좌표 차의 제곱합을 큰 정수로 정확히 잰 값. */
const exactSquare = (dx: number, dy: number): bigint =>
  BigInt(dx) * BigInt(dx) + BigInt(dy) * BigInt(dy);

/** 칸 논증이 내는 상한 — 왼쪽 반 칸 넷과 오른쪽 반 칸 넷에서 자기를 뺀 값. */
export const CELL_BOUND = 7;

/** 초 단위 시간 — 초당 1 억 번. */
export const seconds = (ops: number): string =>
  `${(ops / PER_SECOND).toFixed(2)} 초`;

/* ────────────────────────── 계수 ────────────────────────── */

export interface Counted {
  /** 거리 계산 — 두 점의 제곱 거리를 만들어 최솟값과 비교한 횟수. */
  dist: number;
  /** 좌표 비교 — 정렬 · 합치기 · 띠 거르기 · 멈춤의 비교. */
  cmp: number;
  /** 칸 조회 — 격자에서 칸 하나를 찾은 횟수. 분할 정복에서는 0 이다. */
  look: number;
  /** 할당 칸. */
  cells: number;
}

export const zero = (): Counted => ({ dist: 0, cmp: 0, look: 0, cells: 0 });

/** 기본 연산 — 거리 계산 · 좌표 비교 · 칸 조회의 합. */
export const ops = (c: Counted): number => c.dist + c.cmp + c.look;

function add(into: Counted, c: Counted): void {
  into.dist += c.dist;
  into.cmp += c.cmp;
  into.look += c.look;
  into.cells += c.cells;
}

/** 두 점 사이 거리의 제곱. 거리 계산 하나로 센다. */
export function squared(a: Point, b: Point, c: Counted): number {
  c.dist++;
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/**
 * 합치기 정렬로 `key` 좌표 순서의 사본을 만든다. 비교마다 좌표 비교 1 이고, 할당 칸은
 * 부르는 쪽이 사본 하나로 센다. 안정 정렬이라 정본의 `sort` 와 같은 순서가 나온다.
 */
export function sortBy(points: readonly Point[], key: 0 | 1, c: Counted) {
  const run = (a: readonly Point[]): Point[] => {
    if (a.length <= 1) return [...a];
    const m = a.length >> 1;
    const l = run(a.slice(0, m));
    const r = run(a.slice(m));
    const out: Point[] = [];
    let i = 0;
    let j = 0;
    while (i < l.length && j < r.length) {
      c.cmp++;
      if ((l[i] as Point)[key] <= (r[j] as Point)[key]) {
        out.push(l[i] as Point);
        i++;
      } else {
        out.push(r[j] as Point);
        j++;
      }
    }
    while (i < l.length) out.push(l[i++] as Point);
    while (j < r.length) out.push(r[j++] as Point);
    return out;
  };
  return run(points);
}

/** 모든 쌍 비교 — 쌍을 하나도 안 거르고 전부 잰다. */
export function bruteForce(points: readonly Point[], c: Counted): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = squared(points[i] as Point, points[j] as Point, c);
      if (d < best) best = d;
    }
  }
  return best;
}

/** y 순서인 두 목록을 합친다. 비교마다 좌표 비교 1. */
function mergeCounted(left: Point[], right: Point[], c: Counted): Point[] {
  const out: Point[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    c.cmp++;
    if ((left[i] as Point)[1] <= (right[j] as Point)[1]) {
      out.push(left[i] as Point);
      i++;
    } else {
      out.push(right[j] as Point);
      j++;
    }
  }
  while (i < left.length) out.push(left[i++] as Point);
  while (j < right.length) out.push(right[j++] as Point);
  return out;
}

/** 세는 판의 갈래 — 정본 그대로 · 띠 안 쌍을 멈춤 없이 모두 비교 · 층마다 y 로 다시 정렬. */
type Variant = "ref" | "noBreak" | "resort";

/** 한 구간이 올려 보내는 것과, 셈에 딸린 관찰값. */
interface Half {
  best: number;
  byY: Point[];
}

interface Peek {
  /** 가장 큰 띠의 점 수. */
  strip: number;
  /** 띠에서 한 점이 뒤로 비교한 이웃의 최대 개수. */
  peak: number;
}

/**
 * 정본과 같은 절차를 세면서 실행한다. 답은 매번 정본과 대조한다.
 *
 * `variant` 가 `noBreak` 면 띠 안 쌍을 멈춤 없이 모두 비교하고, `resort` 면 층마다 합치기 대신
 * y 로 다시 정렬한다. 셋 다 답이 정본과 같아야 한다 — 다르면 세는 판이 다른 절차를 잰 것이다.
 */
export function count(
  points: readonly Point[],
  variant: Variant = "ref",
): Counted & Peek {
  const c = zero();
  const peek: Peek = { strip: 0, peak: 0 };
  const sorted = sortBy(points, 0, c);
  c.cells += points.length;
  const run = (pts: Point[]): Half => {
    const n = pts.length;
    if (n <= 3) {
      const byY = sortBy(pts, 1, c);
      c.cells += n;
      return { best: bruteForce(pts, c), byY };
    }
    const mid = n >> 1;
    const splitX = (pts[mid] as Point)[0];
    c.cells += n;
    const left = run(pts.slice(0, mid));
    const right = run(pts.slice(mid));
    let best = Math.min(left.best, right.best);
    const byY =
      variant === "resort"
        ? sortBy(pts, 1, c)
        : mergeCounted(left.byY, right.byY, c);
    c.cells += n;
    const strip: Point[] = [];
    for (const p of byY) {
      c.cmp++;
      const dx = p[0] - splitX;
      if (dx * dx < best) strip.push(p);
    }
    c.cells += strip.length;
    peek.strip = Math.max(peek.strip, strip.length);
    for (let a = 0; a < strip.length; a++) {
      let seen = 0;
      for (let b = a + 1; b < strip.length; b++) {
        if (variant !== "noBreak") {
          c.cmp++;
          const dy = (strip[b] as Point)[1] - (strip[a] as Point)[1];
          if (dy * dy >= best) break;
        }
        seen++;
        const d = squared(strip[a] as Point, strip[b] as Point, c);
        if (d < best) best = d;
      }
      peek.peak = Math.max(peek.peak, seen);
    }
    return { best, byY };
  };
  const top = run(sorted);
  if (Math.sqrt(top.best) !== closestPairOfPoints([...points])) {
    throw new Error(`세는 판(${variant})이 정본과 다른 답을 냈다`);
  }
  return { ...c, ...peek };
}

/**
 * 반으로 가르되 **두 절반에 걸친 쌍을 모두 비교하는** 판. 거르는 장치를 하나도 안 넣는다 —
 * 나누는 것만으로는 비교가 안 줄어든다는 것을 보이는 자리라서, 띠도 멈춤도 없다.
 */
export function splitOnly(points: readonly Point[]): Counted {
  const c = zero();
  const sorted = sortBy(points, 0, c);
  c.cells += points.length;
  const run = (span: Point[]): number => {
    if (span.length <= 3) return bruteForce(span, c);
    const mid = span.length >> 1;
    c.cells += span.length;
    let best = Math.min(run(span.slice(0, mid)), run(span.slice(mid)));
    for (let i = 0; i < mid; i++) {
      for (let j = mid; j < span.length; j++) {
        const d = squared(span[i] as Point, span[j] as Point, c);
        if (d < best) best = d;
      }
    }
    return best;
  };
  const best = run(sorted);
  if (Math.sqrt(best) !== closestPairOfPoints([...points])) {
    throw new Error("가르기만 한 판이 정본과 다른 답을 냈다");
  }
  return c;
}

/**
 * 띠의 폭을 정본의 `factor` 배로 잡은 판. `factor` 가 1 이면 정본과 같은 절차다. 폭이 좁으면
 * 답이 갈리고, 넓으면 답은 같은데 비교가 는다. 답을 대조하지 않는다 — 틀리는 판을 재는 자리다.
 */
function withWidth(
  points: readonly Point[],
  factor: number,
): { best: number; c: Counted } {
  const c = zero();
  const sorted = sortBy(points, 0, c);
  const scale = factor * factor;
  const run = (span: Point[]): Half => {
    const n = span.length;
    if (n <= 3) {
      return { best: bruteForce(span, c), byY: sortBy(span, 1, c) };
    }
    const mid = n >> 1;
    const splitX = (span[mid] as Point)[0];
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));
    let best = Math.min(left.best, right.best);
    const byY = mergeCounted(left.byY, right.byY, c);
    const opened = best * scale;
    const strip: Point[] = [];
    for (const p of byY) {
      c.cmp++;
      const dx = p[0] - splitX;
      if (dx * dx < opened) strip.push(p);
    }
    for (let a = 0; a < strip.length; a++) {
      for (let b = a + 1; b < strip.length; b++) {
        c.cmp++;
        const dy = (strip[b] as Point)[1] - (strip[a] as Point)[1];
        if (dy * dy >= best * scale) break;
        const d = squared(strip[a] as Point, strip[b] as Point, c);
        if (d < best) best = d;
      }
    }
    return { best, byY };
  };
  return { best: run(sorted).best, c };
}

/* ────────────────────────── 걸음 기록 — 전개 입력에만 ────────────────────────── */

/** 띠 안에서 한 쌍을 본 기록. 멈춘 쌍도 적는다. */
export interface Check {
  a: Point;
  b: Point;
  /** 세로 차의 제곱. */
  dy2: number;
  /** 그 순간의 best. */
  best: number;
  /** 멈췄는가 — `dy2 >= best`. */
  stop: boolean;
  /** 비교했으면 그 제곱 거리. */
  d?: number;
  /** 그 비교로 best 가 줄었는가. */
  improved?: boolean;
}

interface StepBase {
  tag: string;
  /** 그 걸음이 맡은 구간 — x 순서 목록의 이어진 한 토막. */
  span: Point[];
  counted: Counted;
}

export type Step =
  | (StepBase & { kind: "sort"; sorted: Point[] })
  | (StepBase & {
      kind: "base";
      pairs: { a: Point; b: Point; d: number }[];
      best: number;
      byY: Point[];
    })
  | (StepBase & {
      kind: "merge";
      splitX: number;
      left: Half & { span: Point[] };
      right: Half & { span: Point[] };
      opened: number;
      byY: Point[];
    })
  | (StepBase & {
      kind: "strip";
      splitX: number;
      opened: number;
      byY: Point[];
      /** 띠를 거르며 본 점마다 가로 차의 제곱. */
      dx2: { p: Point; dx2: number; kept: boolean }[];
      strip: Point[];
      checks: Check[];
      best: number;
    })
  | (StepBase & { kind: "root"; best: number; answer: number });

/**
 * 걸음마다 상태를 기록하면서 실행한다. **전개 입력에만 쓴다** — 걸음마다 점 목록을 베끼는
 * 자리라 큰 입력에서는 값만 세는 `count` 를 쓴다.
 *
 * 내부 마디는 두 걸음으로 가른다 — 「최솟값과 합치기」와 「띠 고르기와 비교」다. 본문의 조각이
 * 그 둘을 따로 다루므로 걸음도 따로 세야 인용이 맞물린다. 맨 앞 걸음은 x 순서 정렬이다.
 */
export function record(points: readonly Point[]): {
  steps: Step[];
  total: Counted;
} {
  const steps: Step[] = [];
  const total = zero();
  let tag = 0;
  const next = (): string => {
    tag++;
    return `T${tag}`;
  };

  const sortC = zero();
  const sorted = sortBy(points, 0, sortC);
  sortC.cells += points.length;
  steps.push({
    kind: "sort",
    tag: next(),
    span: sorted,
    sorted,
    counted: sortC,
  });
  add(total, sortC);

  const run = (span: Point[]): Half => {
    const n = span.length;
    if (n <= 3) {
      const c = zero();
      const byY = sortBy(span, 1, c);
      c.cells += n;
      const pairs: { a: Point; b: Point; d: number }[] = [];
      let best = Number.POSITIVE_INFINITY;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const d = squared(span[i] as Point, span[j] as Point, c);
          pairs.push({ a: span[i] as Point, b: span[j] as Point, d });
          if (d < best) best = d;
        }
      }
      steps.push({
        kind: "base",
        tag: next(),
        span,
        pairs,
        best,
        byY,
        counted: c,
      });
      add(total, c);
      return { best, byY };
    }
    const mid = n >> 1;
    const splitX = (span[mid] as Point)[0];
    const leftSpan = span.slice(0, mid);
    const rightSpan = span.slice(mid);
    const left = run(leftSpan);
    const right = run(rightSpan);

    const m = zero();
    // 가른 두 절반(n 칸)과 합친 목록(n 칸)을 이 걸음의 칸으로 적는다.
    m.cells += 2 * n;
    const opened = Math.min(left.best, right.best);
    const byY = mergeCounted(left.byY, right.byY, m);
    steps.push({
      kind: "merge",
      tag: next(),
      span,
      splitX,
      left: { ...left, span: leftSpan },
      right: { ...right, span: rightSpan },
      opened,
      byY,
      counted: m,
    });
    add(total, m);

    const s = zero();
    let best = opened;
    const dx2: { p: Point; dx2: number; kept: boolean }[] = [];
    const strip: Point[] = [];
    for (const p of byY) {
      s.cmp++;
      const dx = p[0] - splitX;
      const kept = dx * dx < best;
      dx2.push({ p, dx2: dx * dx, kept });
      if (kept) strip.push(p);
    }
    s.cells += strip.length;
    const checks: Check[] = [];
    for (let a = 0; a < strip.length; a++) {
      for (let b = a + 1; b < strip.length; b++) {
        s.cmp++;
        const pa = strip[a] as Point;
        const pb = strip[b] as Point;
        const dy = pb[1] - pa[1];
        if (dy * dy >= best) {
          checks.push({ a: pa, b: pb, dy2: dy * dy, best, stop: true });
          break;
        }
        const d = squared(pa, pb, s);
        const improved = d < best;
        checks.push({
          a: pa,
          b: pb,
          dy2: dy * dy,
          best,
          stop: false,
          d,
          improved,
        });
        if (improved) best = d;
      }
    }
    steps.push({
      kind: "strip",
      tag: next(),
      span,
      splitX,
      opened,
      byY,
      dx2,
      strip,
      checks,
      best,
      counted: s,
    });
    add(total, s);
    return { best, byY };
  };

  const top = run(sorted);
  const answer = Math.sqrt(top.best);
  steps.push({
    kind: "root",
    tag: next(),
    span: sorted,
    best: top.best,
    answer,
    counted: zero(),
  });
  if (answer !== closestPairOfPoints([...points])) {
    throw new Error("걸음 기록용 절차가 정본과 다른 답을 냈다");
  }
  const check = count(points);
  if (
    ops(check) !== ops(total) ||
    check.cells !== total.cells ||
    check.dist !== total.dist
  ) {
    throw new Error("걸음 기록의 셈이 값만 세는 판과 다르다");
  }
  return { steps, total };
}

export const WALK_RUN = record(WALK);

/** 걸음 하나를 태그로 찾는다. */
export function stepOf<K extends Step["kind"]>(
  kind: K,
  nth = 0,
): Extract<Step, { kind: K }> {
  const found = WALK_RUN.steps.filter((s) => s.kind === kind)[nth];
  if (found === undefined) throw new Error(`${kind} 걸음 ${nth} 이 없다`);
  return found as Extract<Step, { kind: K }>;
}

/** 걸음 태그 목록. */
const tagsOf = (kind: Step["kind"]): string[] =>
  WALK_RUN.steps.filter((s) => s.kind === kind).map((s) => s.tag);

/** 「T2 · T3 · T6 · T7」 꼴. */
const tagList = (tags: string[]): string => tags.join(" · ");

/** 맨 위 띠 걸음 — 답이 정해지는 자리. */
export const TOP_STRIP = stepOf("strip", 2);

/** 전개 입력의 답인 두 점. */
export function answerPair(points: readonly Point[]): [Point, Point] {
  let best = Number.POSITIVE_INFINITY;
  let out: [Point, Point] | null = null;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i] as Point;
      const b = points[j] as Point;
      const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
      if (d < best) {
        best = d;
        out = [a, b];
      }
    }
  }
  if (out === null) throw new Error("점이 둘보다 적다");
  return out;
}

/* ────────────────── 맨 위 단계를 따로 보는 판 ────────────────── */

/** 맨 위 단계의 띠를 두 목록 가운데 하나에서 뽑아, 무엇을 보고 무엇을 냈는지 낸다. */
function topStrip(
  points: readonly Point[],
  order: "byY" | "byX",
): { strip: Point[]; pairs: number; best: number } {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const mid = sorted.length >> 1;
  const splitX = (sorted[mid] as Point)[0];
  const left = solve(sorted.slice(0, mid));
  const right = solve(sorted.slice(mid));
  let best = Math.min(left.best, right.best);
  const source =
    order === "byY"
      ? [...left.byY, ...right.byY].sort((a, b) => a[1] - b[1])
      : sorted;
  const strip: Point[] = [];
  for (const p of source) {
    const dx = p[0] - splitX;
    if (dx * dx < best) strip.push(p);
  }
  let pairs = 0;
  for (let a = 0; a < strip.length; a++) {
    for (let b = a + 1; b < strip.length; b++) {
      const dy = (strip[b] as Point)[1] - (strip[a] as Point)[1];
      if (dy * dy >= best) break;
      pairs++;
      const dx = (strip[b] as Point)[0] - (strip[a] as Point)[0];
      const d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
  }
  return { strip, pairs, best };
}

/** 기저 두 구간이 올려 보내는 목록. `sortByY` 면 y 순서, 아니면 x 순서 그대로다. */
function baseLists(half: Point[], sortByY: boolean): string {
  const cut = half.length >> 1;
  return [half.slice(0, cut), half.slice(cut)]
    .map((part) => list(sortByY ? [...part].sort((a, b) => a[1] - b[1]) : part))
    .join(" · ");
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { closestPairOfPoints: (points: Point[]) => number };

const REF = new URL("./closestPairOfPoints-guide.ref.ts", import.meta.url)
  .pathname;

const MIN_LINE = /^ {2}let best = Math\.min\(left\.best, right\.best\);$/;
const STRIP_LINE = /^ {2}for \(const p of byY\) \{$/;
const BREAK_LINE = /^ {6}if \(dy \* dy >= best\) break;$/;
const SORT_LINE =
  /^ {4}const byY = \[\.\.\.pts\]\.sort\(\(a, b\) => a\[1\] - b\[1\]\);$/;

/** 왼쪽 결과만 쓰는 사본. 오른쪽 절반이 낸 최솟값이 통째로 사라진다. */
const onlyLeft = await loadMutant<Impl>(REF, {
  swap: [MIN_LINE, "  let best = left.best;"],
});

/** 띠를 x 순서 목록에서 뽑는 사본. 띠의 순서가 y 순서가 아니게 된다. */
const stripFromX = await loadMutant<Impl>(REF, {
  swap: [STRIP_LINE, "  for (const p of pts) {"],
});

/** 세로 거리로 멈추는 줄을 뺀 사본. 답은 그대로이고 비교 횟수만 는다. */
const noBreak = await loadMutant<Impl>(REF, { drop: BREAK_LINE });

/** 기저에서 y 순서를 안 만드는 사본. 위 단계의 합치기가 전제를 잃는다. */
const noBaseSort = await loadMutant<Impl>(REF, {
  swap: [SORT_LINE, "    const byY = [...pts];"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = onlyLeft.closestPairOfPoints === closestPairOfPoints;

const BREAKING: Point[][] = [WALK, RIGHT_END, ZIGZAG, CROSS, SAME];

if (!중화됨) {
  for (const [label, impl] of [
    ["왼쪽 결과만 쓰는 판", onlyLeft],
    ["띠를 x 순서에서 뽑는 판", stripFromX],
    ["기저의 y 정렬을 뺀 판", noBaseSort],
  ] as [string, Impl][]) {
    if (
      BREAKING.every(
        (points) =>
          closestPairOfPoints(points) === impl.closestPairOfPoints(points),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 정본과 변이의 답을 나란히 놓은 표. 판정 열이 「같다 / 어긋난다」 다. */
function contrast(
  cases: [string, Point[]][],
  impl: Impl,
  head: string,
): { table: string; wrong: number } {
  let wrong = 0;
  const rows = cases.map(([label, points]) => {
    const want = closestPairOfPoints(points);
    const got = impl.closestPairOfPoints(points);
    if (want !== got) wrong++;
    return [
      label,
      num(points.length),
      dist(want),
      dist(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  return {
    table: md(["배치", "점", "정본", head, "대조"], rows, [1, 2, 3]),
    wrong,
  };
}

/* ────────────────────────── 블록 ────────────────────────── */

/** `concept` — 배치마다 두 절차의 답. */
function conceptAnswer(): string {
  const cases: [string, Point[]][] = [
    ["점 둘", PAIR],
    ["같은 좌표 둘 · 점 넷", SAME],
    ["분할선을 가로지르는 답", CROSS],
    ["전개 입력", WALK],
    ["8 × 8 격자", lattice(8)],
    ["한 세로줄 위 64 점", column(64)],
  ];
  let same = 0;
  const rows = cases.map(([label, points]) => {
    const brute = Math.sqrt(bruteForce(points, zero()));
    const mine = closestPairOfPoints(points);
    if (brute === mine) same++;
    return [label, num(points.length), dist(brute), dist(mine)];
  });
  const [a, b] = answerPair(WALK);
  const sorted = [...WALK].sort((p, q) => p[0] - q[0]);
  const mid = sorted.length >> 1;
  const splitX = (sorted[mid] as Point)[0];
  const leftOf = (p: Point) => sorted.indexOf(p) < mid;
  if (leftOf(a) === leftOf(b)) {
    throw new Error("전개 입력의 답이 분할선을 가로지르지 않는다");
  }
  return [
    md(["배치", "점", "모든 쌍 비교의 답", "분할선 띠의 답"], rows, [1, 2, 3]),
    "",
    `${num(cases.length)} 배치 가운데 ${num(same)} 배치에서 두 답이 같습니다. 전개 입력의 답인 두 점 ${pt(a)}${과와P(a)} ${pt(b)}${은는P(b)} 분할선 x = ${splitX} 의 왼쪽 절반과 오른쪽 절반에 하나씩 있습니다.`,
  ].join("\n");
}

/** 점 표기 뒤의 조사 — 닫는 괄호 앞의 수로 받침을 본다. */
const 과와P = (p: Point): string => 과와(tailOf(p));
const 은는P = (p: Point): string => 은는(tailOf(p));
const 을를P = (p: Point): string => 을를(tailOf(p));

/** `deep.origin` ② — 모든 쌍 비교가 과제 규모에서 몇 번의 기본 연산이 되는가. */
function originBrute(): string {
  const sizes = [8, 1_000, 10_000, MAX_N];
  const rows = sizes.map((n) => {
    const pairs = (n * (n - 1)) / 2;
    return [num(n), num(pairs), seconds(pairs)];
  });
  const c = zero();
  bruteForce(WALK, c);
  const at = (MAX_N * (MAX_N - 1)) / 2;
  return [
    md(["점 n", "기본 연산 n(n−1)/2", "시간(초당 1 억 번)"], rows, [0, 1, 2]),
    "",
    `전개 입력 여덟 점을 실제로 모두 비교하면 거리 계산이 ${num(c.dist)} 번이고 다른 기본 연산은 ${num(c.cmp + c.look)} 번이라, 쌍의 수와 같습니다. 점이 ${num(MAX_N)} 개면 ${num(at)} 번이고 예산 1 초의 ${num(Math.round(at / PER_SECOND))} 배입니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — x 순서로 이웃한 쌍만 비교하면 답을 놓친다. */
function originNeighbors(): string {
  const sorted = [...WALK].sort((a, b) => a[0] - b[0]);
  let best = Number.POSITIVE_INFINITY;
  let near: [Point, Point] | null = null;
  const rows = sorted.slice(1).map((b, k) => {
    const a = sorted[k] as Point;
    const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    if (d < best) {
      best = d;
      near = [a, b];
    }
    return [pair(a, b), num(d)];
  });
  if (near === null) throw new Error("이웃 쌍이 없다");
  const [na, nb] = near as [Point, Point];
  const [a, b] = answerPair(WALK);
  const gap = Math.abs(sorted.indexOf(a) - sorted.indexOf(b));
  const truth = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  return [
    md(["x 순서로 이웃한 두 점", "제곱 거리"], rows, [1]),
    "",
    `이웃한 ${num(rows.length)} 쌍 가운데 가장 가까운 것은 ${pair(na, nb)} 의 제곱 거리 ${num(best)}${이고(best)}, 모든 쌍을 비교한 답은 ${pair(a, b)} 의 ${num(truth)} 입니다. 답인 두 점은 x 순서로 ${num(gap)} 칸 떨어져 있어 이웃한 쌍에 들지 않습니다.`,
  ].join("\n");
}

function 이고(n: number): string {
  return josa(n, "이고", "고");
}

/** `deep.origin` ③ — x 순서로 가르기만 하면 거리 계산이 안 줄어든다. */
function originSplit(): string {
  const n = WALK.length;
  const mid = n >> 1;
  const inner = (mid * (mid - 1)) / 2;
  const cross = mid * (n - mid);
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["균등 256 점", uniform(256)],
    ["균등 1024 점", uniform(1_024)],
  ];
  const rows = cases.map(([label, points]) => {
    const pairs = (points.length * (points.length - 1)) / 2;
    const s = splitOnly(points);
    return [label, num(points.length), num(pairs), num(s.dist), num(ops(s))];
  });
  return [
    md(
      [
        "배치",
        "점",
        "모든 쌍 비교의 기본 연산",
        "가르기만 한 판의 거리 계산",
        "가르기만 한 판의 기본 연산",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `전개 입력에서는 왼쪽 넷 안의 쌍 ${num(inner)} · 오른쪽 넷 안의 쌍 ${num(inner)} · 두 절반에 걸친 쌍 ${num(cross)}${을를(cross)} 더해 ${num(2 * inner + cross)} 이고, 세 배치 모두 거리 계산이 쌍의 수와 같습니다. 가르려고 정렬하는 좌표 비교가 더해져 기본 연산은 오히려 늘어납니다.`,
  ].join("\n");
}

/** `deep.origin` ④ — 걸친 쌍을 모두 비교하는 판과, 띠 안의 쌍만 멈춤 없이 모두 비교하는 판. */
function originBand(): string {
  const cases: [string, Point[]][] = [
    ["균등 1024 점", uniform(1_024)],
    ["균등 4096 점", uniform(4_096)],
    ["한 세로줄 위 1024 점", column(1_024)],
    ["한 세로줄 위 4096 점", column(4_096)],
  ];
  const got = cases.map(([label, points]) => ({
    label,
    n: points.length,
    split: ops(splitOnly(points)),
    band: ops(count(points, "noBreak")),
  }));
  const rows = got.map((g) => [g.label, num(g.n), num(g.split), num(g.band)]);
  const col = got.slice(2) as [(typeof got)[0], (typeof got)[0]];
  const uni = got.slice(0, 2) as [(typeof got)[0], (typeof got)[0]];
  return [
    md(
      [
        "배치",
        "점",
        "걸친 쌍을 모두 비교하는 판",
        "띠 안의 쌍을 모두 비교하는 판",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `점을 4 배로 늘리면 균등 배치에서는 띠 안의 쌍을 모두 비교하는 판이 ${(uni[1].band / uni[0].band).toFixed(2)} 배로 늡니다. 한 세로줄 배치에서는 ${(col[1].band / col[0].band).toFixed(2)} 배로 늘어, 걸친 쌍을 모두 비교하는 판의 ${(col[1].split / col[0].split).toFixed(2)} 배와 차이가 없습니다.`,
  ].join("\n");
}

/** 「아이디어를 떠올리는 과정」의 사다리 값 — 그림 사이드카가 쓴다. */
export function ladderValues() {
  const at = (MAX_N * (MAX_N - 1)) / 2;
  const sorted = [...WALK].sort((a, b) => a[0] - b[0]);
  let near = Number.POSITIVE_INFINITY;
  for (let k = 1; k < sorted.length; k++) {
    const a = sorted[k - 1] as Point;
    const b = sorted[k] as Point;
    near = Math.min(near, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }
  const col4096 = ops(count(column(4_096), "noBreak"));
  const col1024 = ops(count(column(1_024), "noBreak"));
  const growth = col4096 / col1024;
  // 어림 — 4096 점에서 잰 값을 점 수의 제곱 비로 늘린다. 위의 성장률이 16 언저리라는 것이 근거다.
  const guess = col4096 * (MAX_N / 4_096) ** 2;
  const mineUniform = ops(count(uniform(MAX_N)));
  const mineColumn = ops(count(column(MAX_N)));
  return { at, near, growth, guess, mineUniform, mineColumn };
}

/** `deep.build` 먼저 알아 둘 개념 (c) — 맨 위 단계에서 점마다 띠에 드는가. */
function buildStripPoints(): string {
  const s = TOP_STRIP;
  const rows = s.dx2.map(({ p, dx2, kept }) => [
    pt(p),
    num(p[1]),
    num(dx2),
    kept
      ? `${num(dx2)} < ${num(s.opened)} → 든다`
      : `${num(dx2)} ≥ ${num(s.opened)} → 안 든다`,
  ]);
  return [
    md(["byY 의 점", "y", "가로 차의 제곱", "띠에"], rows, [1, 2]),
    "",
    `분할선 x = ${s.splitX} · 들어온 best ${num(s.opened)} 에서 여덟 점 가운데 ${num(s.strip.length)} 점이 띠에 들고, 띠는 ${list(s.strip)} 입니다.`,
  ].join("\n");
}

/** `deep.build` 먼저 알아 둘 개념 (d) — 맨 위 띠를 y 순서로 읽으며 비교하고 멈춘 자리. */
function buildStripScan(): string {
  return scanTable(TOP_STRIP);
}

/** 띠 걸음 하나의 쌍마다 기록. */
function scanTable(s: Extract<Step, { kind: "strip" }>): string {
  const rows = s.checks.map((c) => [
    pair(c.a, c.b),
    num(c.dy2),
    num(c.best),
    c.stop
      ? `${num(c.dy2)} ≥ ${num(c.best)} → 멈춤`
      : `${num(c.dy2)} < ${num(c.best)} → 비교, 제곱 거리 ${num(c.d ?? 0)}`,
    c.stop ? "—" : c.improved ? num(c.d ?? 0) : num(c.best),
  ]);
  const compared = s.checks.filter((c) => !c.stop).length;
  const stops = s.checks.length - compared;
  return [
    md(
      ["두 점", "세로 차의 제곱", "그때 best", "판정", "best 뒤"],
      rows,
      [1, 2],
    ),
    "",
    `띠의 ${num(s.strip.length)} 점을 y 순서로 읽는 동안 비교가 ${num(compared)} 번, 멈춤이 ${num(stops)} 번이고, best 는 ${num(s.opened)} 에서 ${num(s.best)}${으로(s.best)} 끝납니다.`,
  ].join("\n");
}

/** `deep.build` 먼저 알아 둘 개념 (d) — 배치마다 띠의 크기와 한 점이 비교한 이웃의 최대. */
function buildNeighbors(): string {
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["지그재그 여덟 점", ZIGZAG],
    ["균등 1024 점", uniform(1_024)],
    ["균등 4096 점", uniform(4_096)],
    ["한 세로줄 위 1024 점", column(1_024)],
    ["한 가로줄 위 1024 점", row(1_024)],
    ["32 × 32 격자", lattice(32)],
  ];
  let peak = 0;
  let strip = 0;
  const rows = cases.map(([label, points]) => {
    const c = count(points);
    peak = Math.max(peak, c.peak);
    strip = Math.max(strip, c.strip);
    return [label, num(points.length), num(c.strip), num(c.peak)];
  });
  return [
    md(
      ["배치", "점", "가장 큰 띠의 점 수", "한 점이 비교한 이웃의 최대"],
      rows,
      [1, 2, 3],
    ),
    "",
    `띠에는 점이 ${num(strip)} 개까지 쌓이는데, 한 점이 비교한 이웃은 ${num(cases.length)} 배치 모두 ${num(peak)} 개를 넘지 않습니다.`,
  ].join("\n");
}

/** `deep.build` 먼저 알아 둘 개념 (e) — 띠를 x 순서 목록에서 뽑으면. */
function buildStripXorder(): string {
  const byY = topStrip(WALK, "byY");
  const byX = topStrip(WALK, "byX");
  const { table } = contrast(
    [
      ["분할선을 가로지르는 답", CROSS],
      ["같은 좌표 둘 · 점 넷", SAME],
      ["전개 입력", WALK],
    ],
    stripFromX,
    "x 순서에서 뽑은 답",
  );
  return [
    md(
      ["전개 입력의 맨 위 단계", "띠에 든 점", "비교한 쌍", "낸 best"],
      [
        [
          "y 순서 목록에서 뽑는다",
          list(byY.strip),
          num(byY.pairs),
          num(byY.best),
        ],
        [
          "x 순서 목록에서 뽑는다",
          list(byX.strip),
          num(byX.pairs),
          num(byX.best),
        ],
      ],
      [2, 3],
    ),
    "",
    "같은 판으로 세 배치를 실행하면 이렇게 나옵니다.",
    "",
    table,
  ].join("\n");
}

/** `deep.build` 1단계 — x 만 비교해 정렬해도 같은 x 의 선후가 답을 안 바꾼다. */
function buildSortTies(): string {
  const base: Point[] = [
    [0, 3],
    [0, 0],
    [4, 2],
    [0, 1],
    [4, 6],
    [0, 5],
  ];
  // 입력 순서를 모두 바꿔 넣는다 — 6! = 720 가지.
  const perms: Point[][] = [];
  const go = (rest: Point[], acc: Point[]) => {
    if (rest.length === 0) {
      perms.push(acc);
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      go(
        [...rest.slice(0, i), ...rest.slice(i + 1)],
        [...acc, rest[i] as Point],
      );
    }
  };
  go(base, []);
  const answers = new Set(perms.map((p) => closestPairOfPoints(p)));
  const splits = new Set(
    perms.map((p) => {
      const s = [...p].sort((a, b) => a[0] - b[0]);
      return list(s.slice(0, s.length >> 1));
    }),
  );
  const brute = Math.sqrt(bruteForce(base, zero()));
  const leftOfPerm = (p: Point[]) =>
    list([...p].sort((a, b) => a[0] - b[0]).slice(0, p.length >> 1));
  const first = perms[0] as Point[];
  const other = perms.find((p) => leftOfPerm(p) !== leftOfPerm(first));
  if (other === undefined) throw new Error("왼쪽 절반이 갈리는 순서가 없다");
  const sample = [first, other].map((p) => {
    const s = [...p].sort((a, b) => a[0] - b[0]);
    const mid = s.length >> 1;
    return [
      list(p),
      list(s.slice(0, mid)),
      list(s.slice(mid)),
      dist(closestPairOfPoints(p)),
    ];
  });
  return [
    md(["입력 순서", "왼쪽 절반", "오른쪽 절반", "답"], sample, [3]),
    "",
    `같은 여섯 점을 입력 순서 ${num(perms.length)} 가지로 넣었을 때 왼쪽 절반은 ${num(splits.size)} 가지로 갈리지만 답은 ${num(answers.size)} 가지이고, 모든 쌍을 비교한 답 ${dist(brute)}${과와(dist(brute))} 같습니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 맨 위 단계의 합치기. */
function buildMergeTop(): string {
  const m = stepOf("merge", 2);
  return [
    md(
      ["목록", "점"],
      [
        ["왼쪽 절반의 byY", list(m.left.byY)],
        ["오른쪽 절반의 byY", list(m.right.byY)],
        ["합친 byY", list(m.byY)],
      ],
    ),
    "",
    `두 목록의 앞 칸끼리 y 를 ${num(m.counted.cmp)} 번 비교해 여덟 점을 y 순서로 늘어놓았고, 합친 목록이 y 순서인가를 다시 보면 ${risingY(m.byY) ? "그렇습니다" : "아닙니다"}.`,
  ].join("\n");
}

/** `deep.build` 설계 선택 — 띠의 폭을 배수로 바꿔 답과 비용을 함께 본다. */
function buildWidth(): string {
  const factors = [0.5, 1, 2, 4];
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["8 × 8 격자", lattice(8)],
    ["균등 1024 점", uniform(1_024)],
  ];
  const rows: string[][] = [];
  const wrongAt = new Set<number>();
  let wrong = 0;
  for (const [label, points] of cases) {
    const want = closestPairOfPoints(points);
    for (const factor of factors) {
      const got = withWidth(points, factor);
      const ok = Math.sqrt(got.best) === want;
      if (!ok) {
        wrong++;
        wrongAt.add(factor);
      }
      rows.push([
        label,
        factor.toString(),
        dist(Math.sqrt(got.best)),
        num(ops(got.c)),
        ok ? "맞는다" : "틀린다",
      ]);
    }
  }
  if ([...wrongAt].some((f) => f >= 1)) {
    throw new Error("폭 배수 1 이상에서 답이 틀렸다");
  }
  return [
    md(["배치", "폭 배수", "답", "기본 연산", "정본과"], rows, [1, 2, 3]),
    "",
    `${num(cases.length * factors.length)} 줄 가운데 답이 틀린 줄은 ${num(wrong)} 줄이고, 틀린 줄의 폭 배수는 ${[...wrongAt].join(" · ")} 입니다. 폭 배수 1 이상에서는 세 배치 모두 답이 맞습니다.`,
  ].join("\n");
}

/** `deep.build` 설계 선택 — 층마다 y 로 다시 정렬하는 판과 합치기만 하는 판. */
function buildResort(): string {
  const sizes = [1_024, 4_096, 16_384, 65_536];
  const ratios: [number, number][] = [];
  const rows = sizes.map((n) => {
    const pts = shuffledColumn(n);
    const resort = ops(count(pts, "resort"));
    const mine = ops(count(pts));
    const ideal = n * Math.log2(n);
    ratios.push([resort / ideal, mine / ideal]);
    return [
      num(n),
      num(resort),
      num(mine),
      (resort / ideal).toFixed(2),
      (mine / ideal).toFixed(2),
    ];
  });
  const first = ratios[0] as [number, number];
  const last = ratios.at(-1) as [number, number];
  return [
    md(
      [
        "점",
        "다시 정렬하는 판",
        "합치기만 하는 판",
        "다시 정렬 ÷ n log₂ n",
        "합치기 ÷ n log₂ n",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `두 판 모두 한 세로줄에 y 를 뒤섞어 놓은 배치이고 수는 기본 연산입니다. 점을 ${num((sizes.at(-1) as number) / (sizes[0] as number))} 배로 늘리는 동안 다시 정렬하는 판의 비율은 ${first[0].toFixed(2)} 에서 ${last[0].toFixed(2)} 까지 커지고, 합치기만 하는 판은 ${first[1].toFixed(2)} 에서 ${last[1].toFixed(2)} 사이에 머뭅니다.`,
  ].join("\n");
}

/** `deep.walk.step` 1 — 기저 네 벌. */
function walkBase(): string {
  const bases = WALK_RUN.steps.filter(
    (s): s is Extract<Step, { kind: "base" }> => s.kind === "base",
  );
  const rows = bases.map((s) => [
    s.tag,
    list(s.span),
    `n = ${s.span.length}, \`n <= 3\` 참 → ①`,
    num(s.best),
    list(s.byY),
  ]);
  return [
    md(["걸음", "구간", "조건 판정", "best", "올려 보내는 byY"], rows, [3]),
    "",
    `기저 ${num(bases.length)} 구간 모두 점이 둘이라 거리 계산을 한 번씩 합니다. best 는 거리의 제곱이고, 제곱근은 맨 마지막에 한 번만 부릅니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — 두 절반 중 왼쪽 결과만 쓰면. */
function pauseMin(): string {
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["같은 좌표 둘 · 점 넷", SAME],
    ["오른쪽 끝에 답", RIGHT_END],
  ];
  const halves = ([label, points]: [string, Point[]]): string[] => {
    const sorted = [...points].sort((a, b) => a[0] - b[0]);
    const mid = sorted.length >> 1;
    const left = solve(sorted.slice(0, mid));
    const right = solve(sorted.slice(mid));
    return [
      label,
      num(left.best),
      num(right.best),
      num(Math.min(left.best, right.best)),
    ];
  };
  const { table, wrong } = contrast(cases, onlyLeft, "왼쪽 결과만 쓴 답");
  return [
    table,
    "",
    `${num(cases.length)} 배치 가운데 ${num(wrong)} 배치에서 답이 어긋납니다. 맨 위 단계의 두 절반이 낸 값은 이렇습니다.`,
    "",
    md(
      ["배치", "왼쪽 절반의 best", "오른쪽 절반의 best", "작은 쪽"],
      cases.map(halves),
      [1, 2, 3],
    ),
  ].join("\n");
}

/** `deep.walk.step` 2 — 합치기가 만드는 y 순서 목록. */
function walkMerge(): string {
  const merges = WALK_RUN.steps.filter(
    (s): s is Extract<Step, { kind: "merge" }> => s.kind === "merge",
  );
  const rows = merges.map((s) => [
    s.tag,
    `n = ${s.span.length}, \`n <= 3\` 거짓 → ② ③`,
    `min(${num(s.left.best)}, ${num(s.right.best)}) = ${num(s.opened)}`,
    list(s.byY),
    num(s.counted.cmp),
  ]);
  return [
    md(["걸음", "조건 판정", "best", "합친 byY", "좌표 비교"], rows, [4]),
    "",
    `${num(merges.length)} 걸음 모두 두 목록의 앞 칸끼리 비교하기만 하고, 다시 정렬하는 자리가 없습니다. 마지막 걸음의 목록이 여덟 점 전부를 y 순서로 담습니다.`,
  ].join("\n");
}

/** `deep.walk.step` 3 — 띠 고르기와 그 안의 비교. */
function walkStrip(): string {
  const scans = WALK_RUN.steps.filter(
    (s): s is Extract<Step, { kind: "strip" }> => s.kind === "strip",
  );
  const rows = scans.map((s) => {
    const out = s.dx2.filter((d) => !d.kept).length;
    const compared = s.checks.filter((c) => !c.stop).length;
    const stops = s.checks.length - compared;
    return [
      s.tag,
      `x = ${s.splitX}`,
      num(s.opened),
      `${num(s.strip.length)} 점 (안 든 점 ${num(out)})`,
      `비교 ${num(compared)} · 멈춤 ${num(stops)}`,
      num(s.best),
    ];
  });
  const shrunk = scans.filter((s) => s.best < s.opened).map((s) => s.tag);
  if (!shrunk.includes(TOP_STRIP.tag)) {
    throw new Error("맨 위 띠 걸음에서 best 가 안 줄었다");
  }
  return [
    md(
      ["걸음", "분할선", "들어올 때 best", "띠", "띠 안", "나갈 때 best"],
      rows,
      [2, 5],
    ),
    "",
    `${num(scans.length)} 걸음 가운데 best 가 줄어든 걸음은 ${shrunk.join(" · ")} 입니다. 맨 위 띠 걸음 ${TOP_STRIP.tag} 에서 best 가 ${num(TOP_STRIP.best)}${이가(TOP_STRIP.best)} 되고, 그 값이 답의 제곱입니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — 세로 거리로 멈추는 줄을 빼면 답이 바뀌는가. */
function pauseBreak(): string {
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["지그재그 여덟 점", ZIGZAG],
    ["한 세로줄 위 1024 점", column(1_024)],
    ["균등 1024 점", uniform(1_024)],
  ];
  const { table, wrong } = contrast(cases, noBreak, "멈춤을 뺀 답");
  return [
    table,
    "",
    `${num(cases.length)} 배치 가운데 답이 어긋나는 배치는 ${num(wrong)} 배치입니다.`,
  ].join("\n");
}

/** `deep.walk.pause` — 멈추는 줄을 뺐을 때 기본 연산이 얼마나 늘어나는가. */
function pauseBreakCost(): string {
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["균등 1024 점", uniform(1_024)],
    ["한 세로줄 위 1024 점", column(1_024)],
    ["한 세로줄 위 4096 점", column(4_096)],
  ];
  const got = cases.map(([label, points]) => ({
    label,
    n: points.length,
    mine: ops(count(points)),
    open: ops(count(points, "noBreak")),
  }));
  const rows = got.map((g) => [
    g.label,
    num(g.n),
    num(g.mine),
    num(g.open),
    (g.open / g.mine).toFixed(2),
  ]);
  const a = got[2] as (typeof got)[0];
  const b = got[3] as (typeof got)[0];
  return [
    md(
      ["배치", "점", "정본의 기본 연산", "멈춤을 뺀 판", "몇 배"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `한 세로줄 배치에서 점을 4 배로 늘리면 멈춤을 뺀 판은 ${(b.open / a.open).toFixed(2)} 배, 정본은 ${(b.mine / a.mine).toFixed(2)} 배가 됩니다.`,
  ].join("\n");
}

/** 걸음 한 줄의 조건 판정 — 원고의 전개 표와 비용 표가 같은 기록을 쓴다. */
function conditionOf(s: Step): string {
  switch (s.kind) {
    case "sort":
      return `점 ${num(s.span.length)} 개를 x 순서로 정렬`;
    case "base":
      return `n = ${s.span.length}, \`n <= 3\` 참 → ①`;
    case "merge":
      return `n = ${s.span.length}, \`n <= 3\` 거짓 → ② min(${num(s.left.best)}, ${num(s.right.best)}) · ③ 합치기`;
    case "strip": {
      const kept = s.dx2.filter((d) => d.kept).length;
      const out = s.dx2.length - kept;
      const compared = s.checks.filter((c) => !c.stop).length;
      const stops = s.checks.length - compared;
      const improved = s.checks.filter((c) => c.improved).length;
      return `④ \`dx * dx < ${num(s.opened)}\` 참 ${num(kept)} · 거짓 ${num(out)} · ⑤ \`dy * dy >= best\` 참 ${num(stops)} · 거짓 ${num(compared)} · \`d < best\` 참 ${num(improved)} · 거짓 ${num(compared - improved)}`;
    }
    case "root":
      return `√${num(s.best)} = ${dist(s.answer)}`;
  }
}

/** 걸음 한 줄의 「하는 일」. */
export function whatOf(s: Step): string {
  switch (s.kind) {
    case "sort":
      return "x 순서로 정렬한다";
    case "base":
      return `${list(s.span)}${을를P(s.span.at(-1) as Point)} 직접 비교한다`;
    case "merge":
      return `분할선 x = ${s.splitX} 에서 두 절반의 작은 값을 잡고 합친다`;
    case "strip":
      return `분할선 x = ${s.splitX} 옆 띠만 비교한다`;
    case "root":
      return "제곱근을 한 번 부른다";
  }
}

/** 걸음이 끝난 뒤의 best. */
function bestAfter(s: Step): string {
  switch (s.kind) {
    case "sort":
      return "—";
    case "base":
    case "strip":
      return num(s.best);
    case "merge":
      return num(s.opened);
    case "root":
      return dist(s.answer);
  }
}

/** `deep.walk.step` 4 — 열두 걸음 전체와 조건 판정. */
function walkTrace(): string {
  const rows = WALK_RUN.steps.map((s) => [
    s.tag,
    whatOf(s),
    conditionOf(s),
    bestAfter(s),
  ]);
  const t = WALK_RUN.total;
  return [
    md(["걸음", "하는 일", "조건 판정", "best 뒤"], rows, [3]),
    "",
    `걸음 ${num(WALK_RUN.steps.length)} 개 동안 기본 연산이 ${num(ops(t))} 번(거리 계산 ${num(t.dist)} · 좌표 비교 ${num(t.cmp)})이고, 답은 ${dist(closestPairOfPoints(WALK))} 입니다.`,
  ].join("\n");
}

/** `deep.walk.final` — 전체 코드 아래의 호출 몇 개. */
function finalCalls(): string {
  const calls: Point[][] = [
    [
      [0, 0],
      [3, 4],
    ],
    [
      [0, 0],
      [1, 0],
      [10, 10],
    ],
    [
      [0, 0],
      [0, 0],
      [5, 5],
    ],
    CROSS,
    WALK.slice(0, 5),
  ];
  const shown = calls.map(
    (p) => `closestPairOfPoints(${JSON.stringify(p).replace(/,/g, ", ")})`,
  );
  const w = Math.max(...shown.map((s) => s.length));
  return calls
    .map(
      (p, k) =>
        `${(shown[k] as string).padEnd(w)}  →  ${closestPairOfPoints(p)}`,
    )
    .join("\n");
}

/** `deep.walk` 도입 — 고정 입력. */
function walkInput(): string {
  return [
    "const points: Point[] = [",
    `  ${WALK.map((p) => `[${p[0]}, ${p[1]}]`).join(", ")},`,
    "];",
    `// 이 절이 끝나면 √${TOP_STRIP.best} = ${dist(closestPairOfPoints(WALK))} 이 나와야 한다`,
  ].join("\n");
}

/** `related` — 한 점이 비교한 이웃과 칸 논증의 상한. */
function relatedPigeon(): string {
  const cases: [string, Point[]][] = [
    ["지그재그 여덟 점", ZIGZAG],
    ["균등 1024 점", uniform(1_024)],
    ["균등 4096 점", uniform(4_096)],
    ["한 세로줄 위 1024 점", column(1_024)],
    ["32 × 32 격자", lattice(32)],
  ];
  const rows = cases.map(([label, points]) => {
    const { peak } = count(points);
    return [
      label,
      num(points.length),
      num(peak),
      num(peak + 1),
      num(CELL_BOUND + 1),
    ];
  });
  return [
    md(
      ["배치", "점", "한 점이 비교한 이웃의 최대", "자기까지 센 점", "칸 수"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `칸은 왼쪽 반 칸 넷과 오른쪽 반 칸 넷을 더해 ${num(CELL_BOUND + 1)} 개이고, ${num(cases.length)} 배치 모두 자기까지 센 점이 칸 수를 넘지 않습니다.`,
  ].join("\n");
}

/** `deep.math` ② — 정의를 작은 값에 넣어 손으로 계산한다. */
function mathCheck(): string {
  const pairs: [Point, Point][] = [
    [WALK[0] as Point, WALK[2] as Point],
    [WALK[2] as Point, WALK[4] as Point],
    [WALK[4] as Point, WALK[5] as Point],
    [WALK[1] as Point, WALK[3] as Point],
  ];
  const rows = pairs.map(([a, b]) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return [
      pair(a, b),
      String(dx),
      String(dy),
      String(dx * dx + dy * dy),
      dist(Math.sqrt(dx * dx + dy * dy)),
    ];
  });
  const best = solve([...WALK].sort((a, b) => a[0] - b[0])).best;
  return [
    md(
      ["두 점 p–q", "x_p − x_q", "y_p − y_q", "D(p, q)", "√D(p, q)"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `여덟 점 전체에서 D 의 최솟값은 ${num(best)}, d* 는 ${dist(closestPairOfPoints(WALK))} 입니다. 정수 좌표에서는 D 까지 정수이고 제곱근에서만 소수가 붙습니다.`,
  ].join("\n");
}

/** 닫힌 형태의 상한 — 정렬 `n log₂ n` 과 층마다 `17n`. */
export const upper = (n: number): number =>
  Math.round(n * Math.log2(n) + 17 * n * Math.log2(n));

/** `deep.math` ④ — 닫힌 형태에 과제 규모를 넣어 수치를 내고 실제 실행과 나란히 놓는다. */
function mathCount(): string {
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["균등 1024 점", uniform(1_024)],
    ["균등 4096 점", uniform(4_096)],
    ["한 세로줄 위 4096 점", column(4_096)],
    ["균등 100,000 점", uniform(MAX_N)],
  ];
  const rows = cases.map(([label, points]) => {
    const n = points.length;
    return [
      label,
      num(n),
      num((n * (n - 1)) / 2),
      num(upper(n)),
      num(ops(count(points))),
    ];
  });
  const at = (MAX_N * (MAX_N - 1)) / 2;
  return [
    md(
      [
        "배치",
        "점 n",
        "모든 쌍 비교 n(n−1)/2",
        "상한 18 n log₂ n",
        "실제 기본 연산",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `n = ${num(MAX_N)} 에서 상한은 모든 쌍 비교의 ${Math.round(at / upper(MAX_N))} 분의 1 이고, 초당 1 억 번으로 ${seconds(upper(MAX_N))}입니다. 다섯 배치 모두 실제 기본 연산이 상한 아래에 있습니다.`,
  ].join("\n");
}

/** `invariant` ② — 구간마다 목록이 y 순서이고 best 가 그 구간의 답인가. */
function invariantStates(): string {
  const sorted = [...WALK].sort((a, b) => a[0] - b[0]);
  const rows: string[][] = [];
  const visit = (span: Point[], name: string): void => {
    const out = solve(span);
    const alone = bruteForce(span, zero());
    rows.push([
      name,
      num(span.length),
      num(out.best),
      num(alone),
      risingY(out.byY) ? "예" : "아니오",
    ]);
  };
  visit(sorted.slice(0, 2), "왼쪽의 왼쪽");
  visit(sorted.slice(2, 4), "왼쪽의 오른쪽");
  visit(sorted.slice(0, 4), "왼쪽 절반");
  visit(sorted.slice(4, 6), "오른쪽의 왼쪽");
  visit(sorted.slice(6, 8), "오른쪽의 오른쪽");
  visit(sorted.slice(4, 8), "오른쪽 절반");
  visit(sorted, "여덟 점 전부");
  const agree = rows.filter((r) => r[2] === r[3] && r[4] === "예").length;
  return [
    md(
      [
        "구간",
        "점",
        "올려 보낸 best",
        "그 구간만 모든 쌍 비교",
        "byY 가 y 순서",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `${num(rows.length)} 구간 가운데 ${num(agree)} 구간에서 두 best 가 같고 byY 가 y 순서입니다.`,
  ].join("\n");
}

/** `invariant` ② — 경계 배치에서도 같은 두 값이 맞물리는가. */
function invariantEdges(): string {
  const huge: Point[] = [
    [-COORD, -COORD],
    [0, 0],
    [COORD - 1, COORD],
    [COORD, COORD],
  ];
  const cases: [string, Point[]][] = [
    ["점 둘", PAIR],
    ["같은 좌표 둘 · 점 넷", SAME],
    ["분할선을 가로지르는 답", CROSS],
    ["한 세로줄 위 32 점", column(32)],
    ["한 가로줄 위 32 점", row(32)],
    ["8 × 8 격자", lattice(8)],
    ["같은 좌표만 64 점", Array.from({ length: 64 }, () => [7, 7] as Point)],
    ["좌표 상한 네 점", huge],
  ];
  let agree = 0;
  const rows = cases.map(([label, points]) => {
    const out = solve([...points].sort((a, b) => a[0] - b[0]));
    const alone = bruteForce(points, zero());
    const rising = risingY(out.byY);
    if (out.best === alone && rising) agree++;
    return [
      label,
      num(points.length),
      num(out.best),
      num(alone),
      rising ? "예" : "아니오",
    ];
  });
  return [
    md(
      ["배치", "점", "올려 보낸 best", "모든 쌍 비교", "byY 가 y 순서"],
      rows,
      [1, 2, 3],
    ),
    "",
    `${num(cases.length)} 배치 가운데 ${num(agree)} 배치에서 두 best 가 같고 byY 가 y 순서입니다.`,
  ].join("\n");
}

/** `invariant` ② — 좌표가 상한에 붙으면 제곱 거리가 배정밀도의 정수 범위를 넘는다. */
function edgePrecision(): string {
  /** 제곱 거리가 정수로 정확히 담기는 마지막 좌표 상한. */
  let low = 1;
  let high = COORD;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (8 * mid * mid <= EXACT) low = mid;
    else high = mid;
  }
  /** 참값이 다른데 배정밀도로 같아지는 두 자리. */
  let clash: [number, number, number, number] | null = null;
  for (let a = 0; a < 64 && clash === null; a++) {
    for (let b = 0; b < 64 && clash === null; b++) {
      for (let c = 0; c < 64 && clash === null; c++) {
        for (let d = 0; d < 64; d++) {
          const dx1 = 2 * COORD - a;
          const dy1 = 2 * COORD - b;
          const dx2 = 2 * COORD - c;
          const dy2 = 2 * COORD - d;
          if (exactSquare(dx1, dy1) === exactSquare(dx2, dy2)) continue;
          if (dx1 * dx1 + dy1 * dy1 !== dx2 * dx2 + dy2 * dy2) continue;
          clash = [dx1, dy1, dx2, dy2];
          break;
        }
      }
    }
  }
  if (clash === null) {
    throw new Error("좌표 상한에서 어긋나는 자리를 못 찾았다");
  }
  const [ax, ay, bx, by] = clash;
  const first = exactSquare(ax, ay);
  const second = exactSquare(bx, by);
  /**
   * 두 거리의 차. **제곱근을 각각 배정밀도로 취해 빼면 0 이 나온다** — 두 제곱 거리가 이미
   * 같은 배정밀도 값으로 뭉개진 자리라서다. 참값의 차를 먼저 큰 정수로 얻고, 거리의 미분
   * 관계 `d(√S) = dS / (2√S)` 로 옮긴다.
   */
  const near = Math.sqrt(Number(first));
  const gap = Number(first - second) / (2 * near);
  const seen = ax * ax + ay * ay;
  const top = 8 * COORD * COORD;
  const spacing = 2 ** (Math.floor(Math.log2(top)) - 52);
  return [
    md(
      ["두 점의 차", "가로 차", "세로 차", "참값", "배정밀도가 담은 값"],
      [
        ["첫째", num(ax), num(ay), bignum(first), num(seen)],
        ["둘째", num(bx), num(by), bignum(second), num(bx * bx + by * by)],
      ],
      [1, 2, 3, 4],
    ),
    "",
    `참값이 ${bignum(first - second)} 만큼 다른 두 제곱 거리가 배정밀도로는 같은 수가 됩니다. 제곱 거리가 정수로 정확히 담기는 마지막 좌표 상한은 ${num(low)}${이고(low)}, 좌표 상한 ${num(COORD)} 에서 제곱 거리는 ${num(top)} 까지 커지며 그 언저리에서 배정밀도가 담는 정수의 간격은 ${num(spacing)} 입니다. 두 거리의 차는 ${Math.abs(gap).toExponential(2)}, 상대 차는 ${(Math.abs(gap) / near).toExponential(2)} 로 허용 오차 ${TOLERANCE.toExponential(0)} 보다 작습니다.`,
  ].join("\n");
}

/** `invariant` ③ — 기저에서 y 순서를 안 만들면. */
function mutantUnsorted(): string {
  const cases: [string, Point[]][] = [
    ["전개 입력", WALK],
    ["분할선을 가로지르는 답", CROSS],
    ["지그재그 여덟 점", ZIGZAG],
  ];
  const { table, wrong } = contrast(cases, noBaseSort, "기저의 y 정렬을 뺀 답");
  const sorted = [...ZIGZAG].sort((a, b) => a[0] - b[0]);
  const mid = sorted.length >> 1;
  return [
    table,
    "",
    `${num(cases.length)} 배치 가운데 ${num(wrong)} 배치에서 답이 어긋납니다. 지그재그 여덟 점의 기저 넷이 올려 보내는 목록은 이렇습니다.`,
    "",
    md(
      ["절반", "정본의 byY", "y 정렬을 뺀 판의 byY"],
      [
        [
          "왼쪽 절반",
          baseLists(sorted.slice(0, mid), true),
          baseLists(sorted.slice(0, mid), false),
        ],
        [
          "오른쪽 절반",
          baseLists(sorted.slice(mid), true),
          baseLists(sorted.slice(mid), false),
        ],
      ],
    ),
  ].join("\n");
}

/** `perf.derive` — 걸음마다의 기본 연산과 할당 칸. */
function perfCount(): string {
  const rows = WALK_RUN.steps.map((s) => [
    s.tag,
    num(s.counted.dist),
    num(s.counted.cmp),
    num(ops(s.counted)),
    num(s.counted.cells),
  ]);
  const t = WALK_RUN.total;
  const top = WALK_RUN.steps.reduce((a, b) =>
    ops(b.counted) > ops(a.counted) ? b : a,
  );
  return [
    md(
      ["걸음", "거리 계산", "좌표 비교", "기본 연산", "할당 칸"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `합은 기본 연산 ${num(ops(t))} 번 · 할당 칸 ${num(t.cells)} 칸이고, 기본 연산이 가장 많은 걸음은 ${top.tag} 입니다.`,
  ].join("\n");
}

/** `perf.derive` — 점을 4 배로 하면 기본 연산과 칸이 몇 배가 되는가. */
function perfGrowth(): string {
  const sizes = [256, 1_024, 4_096, 16_384];
  const counts = new Map(sizes.map((n) => [n, count(uniform(n))]));
  const rows = sizes.map((n, at) => {
    const c = counts.get(n) as Counted;
    const prev =
      at === 0 ? null : (counts.get(sizes[at - 1] as number) as Counted);
    return [
      num(n),
      num(ops(c)),
      prev === null ? "—" : (ops(c) / ops(prev)).toFixed(2),
      num(c.cells),
      prev === null ? "—" : (c.cells / prev.cells).toFixed(2),
    ];
  });
  return [
    md(
      [
        "균등 배치의 점",
        "기본 연산",
        "앞 줄의 몇 배",
        "할당 칸",
        "앞 줄의 몇 배",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    "점을 4 배로 늘릴 때마다 두 수 모두 4 배를 조금 넘습니다.",
  ].join("\n");
}

/** `perf.worst` — 비용을 가장 크게 만드는 배치. */
function worstShape(): string {
  const size = 4_096;
  const cases: [string, Point[]][] = [
    ["균등", uniform(size)],
    ["한 세로줄 위", column(size)],
    ["y 를 뒤섞은 한 세로줄 위", shuffledColumn(size)],
    ["한 가로줄 위", row(size)],
    ["64 × 64 격자", lattice(64)],
    ["같은 좌표만", Array.from({ length: size }, () => [7, 7] as Point)],
  ];
  const got = cases.map(([label, points]) => ({ label, c: count(points) }));
  const rows = got.map(({ label, c }) => [
    label,
    num(ops(c)),
    num(c.dist),
    num(c.strip),
    num(c.peak),
    num(c.cells),
  ]);
  const most = got.reduce((a, b) => (ops(b.c) > ops(a.c) ? b : a));
  const least = got.reduce((a, b) => (ops(b.c) < ops(a.c) ? b : a));
  return [
    md(
      [
        "배치(점 4,096)",
        "기본 연산",
        "거리 계산",
        "가장 큰 띠",
        "이웃의 최대",
        "할당 칸",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `기본 연산이 가장 많은 배치는 「${most.label}」 의 ${num(ops(most.c))} 번이고 가장 적은 배치는 「${least.label}」 의 ${num(ops(least.c))} 번으로, ${(ops(most.c) / ops(least.c)).toFixed(2)} 배 차이입니다.`,
  ].join("\n");
}

/** `selfcheck` — 두 띠 걸음이 같은 크기의 띠에서 비교 횟수가 갈린 까닭. */
function selfcheckScan(): string {
  const first = stepOf("strip", 0);
  const second = stepOf("strip", 1);
  return [
    `${first.tag} — 띠 ${list(first.strip)}`,
    "",
    scanTable(first),
    "",
    `${second.tag} — 띠 ${list(second.strip)}`,
    "",
    scanTable(second),
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 배치마다 두 절차의 답. */
  "concept-answer": conceptAnswer,
  /** `deep.origin` ② — 모든 쌍 비교의 기본 연산. */
  "origin-brute": originBrute,
  /** `deep.origin` ③ — x 순서로 이웃한 쌍만 비교하면. */
  "origin-neighbors": originNeighbors,
  /** `deep.origin` ③ — 가르기만 하면. */
  "origin-split": originSplit,
  /** `deep.origin` ④ — 걸친 쌍 전부와 띠 안 쌍 전부. */
  "origin-band": originBand,
  /** `deep.build` 개념 (c) — 맨 위 단계에서 띠에 드는 점. */
  "build-strip-points": buildStripPoints,
  /** `deep.build` 개념 (d) — 맨 위 띠의 비교와 멈춤. */
  "build-strip-scan": buildStripScan,
  /** `deep.build` 개념 (d) — 한 점이 비교하는 이웃의 수. */
  "build-neighbors": buildNeighbors,
  /** `deep.build` 개념 (e) — 띠를 x 순서에서 뽑으면. */
  "build-strip-xorder": buildStripXorder,
  /** `deep.build` 1단계 — x 만 비교한 정렬과 같은 x 의 선후. */
  "build-sort-ties": buildSortTies,
  /** `deep.build` 3단계 — 맨 위 단계의 합치기. */
  "build-merge-top": buildMergeTop,
  /** `deep.build` 설계 선택 — 띠의 폭. */
  "build-width": buildWidth,
  /** `deep.build` 설계 선택 — 다시 정렬과 합치기. */
  "build-resort": buildResort,
  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": walkInput,
  /** `deep.walk.step` 1 — 기저. */
  "walk-base": walkBase,
  /** `deep.walk.pause` — 한쪽 결과만. */
  "pause-min": pauseMin,
  /** `deep.walk.step` 2 — 합치기. */
  "walk-merge": walkMerge,
  /** `deep.walk.step` 3 — 띠. */
  "walk-strip": walkStrip,
  /** `deep.walk.pause` — 멈춤을 빼면 답. */
  "pause-break": pauseBreak,
  /** `deep.walk.pause` — 멈춤을 빼면 비용. */
  "pause-break-cost": pauseBreakCost,
  /** `deep.walk.step` 4 — 열두 걸음. */
  "walk-trace": walkTrace,
  /** `deep.walk.final` — 호출 몇 개. */
  "final-calls": finalCalls,
  /** `related` — 비둘기집. */
  "related-pigeon": relatedPigeon,
  /** `deep.math` ② — 검산. */
  "math-check": mathCheck,
  /** `deep.math` ④ — 계수. */
  "math-count": mathCount,
  /** `invariant` ② — 일곱 구간. */
  "invariant-states": invariantStates,
  /** `invariant` ② — 경계 배치. */
  "invariant-edges": invariantEdges,
  /** `invariant` ② — 값의 크기. */
  "edge-precision": edgePrecision,
  /** `invariant` ③ — 기저의 y 정렬을 빼면. */
  "mutant-unsorted": mutantUnsorted,
  /** `perf.derive` — 걸음마다. */
  "perf-count": perfCount,
  /** `perf.derive` — 성장률. */
  "perf-growth": perfGrowth,
  /** `perf.worst` — 배치 여섯. */
  "worst-shape": worstShape,
  /** `selfcheck` — 두 띠 걸음. */
  "selfcheck-scan": selfcheckScan,
};

/** 원고의 걸음 태그 묶음 — 그림 사이드카와 시험이 쓴다. */
export const TAGS = {
  sort: tagsOf("sort"),
  base: tagsOf("base"),
  merge: tagsOf("merge"),
  strip: tagsOf("strip"),
  root: tagsOf("root"),
  list: tagList,
};
