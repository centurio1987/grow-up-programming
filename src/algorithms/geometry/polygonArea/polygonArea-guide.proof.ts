/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts polygonArea-guide.md
 *
 * **비용은 기본 연산 하나로 센다.** 좌표 읽기 · 자료형 변환 · 곱셈 · 덧셈·뺄셈 · 비교 · 나눗셈을
 * 각각 1 로 센 합이다. 첨자 계산 · 배열 길이 읽기 · 반복 변수는 세지 않는다. 원고의 모든 비용 표와
 * 대조 하네스(`.alt.ts`)가 이 기준을 쓴다 — 한 낱말이 두 표에서 다른 것을 세면 표를 나란히 놓을 수 없다.
 *
 * 조사는 값에서 고른다(`tools/josa.ts`). 값이 바뀌면 조사도 따라 바뀌어야 하기 때문이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Point,
  polygonArea,
  shoelaceTwice,
} from "./polygonArea-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/**
 * 천 단위 구분. 본문 표기와 같다.
 *
 * **0 을 더해 두는 이유는 음의 0 이다.** `-1000 * 0` 은 `-0` 이고 그대로 적으면 표에 `-0` 이
 * 찍히는데, 그 칸이 뜻하는 것은 0 이다.
 */
export const num = (n: number): string => (n + 0).toLocaleString("en-US");

/**
 * 큰 정수의 천 단위 구분. **`Number` 로 바꿔 적지 않는다** — 이 편이 다루는 항과 누적은
 * 배정밀도가 정수로 못 담는 크기라, 변환하는 순간 표가 어림수로 보이게 된다.
 */
export const bignum = (n: bigint): string =>
  (n < 0n ? "-" : "") +
  (n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * 넓이 하나의 표기. 정수 자리는 천 단위로 끊고 소수점 아래는 그대로 둔다.
 *
 * 이 편의 넓이는 2 배 넓이가 홀수일 때만 소수점이 붙고, 그때 소수 자리는 언제나 `.5` 다.
 */
export const area = (x: number): string =>
  Number.isInteger(x)
    ? num(x)
    : `${num(Math.trunc(x))}${String(Math.abs(x % 1)).slice(1)}`;

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
export const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 변 하나의 표기 — 앞 끝점에서 뒤 끝점으로. */
export const seg = (a: Point, b: Point): string => `${pt(a)}-${pt(b)}`;

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

/** 한 블록을 표 · 빈 줄 · 문장으로 잇는다. */
const block = (...parts: string[]): string => parts.join("\n\n");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력 — L 자 다각형. 넓이가 12 이고 오목한 꼭짓점이 `(2,2)` 하나다.
 * 첫 꼭짓점이 원점이라 원점을 공통 꼭짓점으로 둔 삼각형 여섯 가운데 둘이 납작하다.
 */
export const L: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];

/** 같은 L 자를 (10,10) 만큼 옮긴 것. 원점이 다각형 **밖**인 배치다. */
export const L_FAR: Point[] = L.map(([x, y]) => [x + 10, y + 10] as Point);

/** 꼭짓점 차례를 뒤집은 L 자. 시계 방향 입력이다. */
export const L_CW: Point[] = [...L].reverse();

/** 오목 꼭짓점이 첫 꼭짓점 쪽으로 파인 오각형. 넓이 12 로 L 자와 같다. */
export const PENT: Point[] = [
  [0, 0],
  [2, 2],
  [4, 0],
  [4, 4],
  [0, 4],
];

/** 최소 다각형. 2 배 넓이가 홀수 1 이라 넓이가 0.5 다. */
export const TRI: Point[] = [
  [0, 0],
  [1, 0],
  [0, 1],
];

/** 한 변이 2 인 정사각형 — 반시계 차례. */
const SQUARE: Point[] = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
];

/** 같은 정사각형의 시계 차례. */
const SQUARE_CW: Point[] = [
  [0, 0],
  [0, 2],
  [2, 2],
  [2, 0],
];

/** 과제의 좌표 절댓값 상한과 배정밀도가 정수를 오차 없이 담는 한계. */
export const COORD = 1_000_000_000;
export const EXACT = Number.MAX_SAFE_INTEGER;

/** 과제의 꼭짓점 수 상한. */
export const MAX_N = 100_000;

/** 흔한 채점 환경의 예산 — 1 초에 기본 연산 1 억 번으로 잰다. */
const PER_SECOND = 100_000_000;

/**
 * 배정밀도로 곱을 만들면 어긋나는 배치.
 *
 * 두 곱이 다 10^18 언저리라 배정밀도의 정수 간격이 128 이다. 참값의 차 −1,999,999,999 는
 * 그 간격 안에서 사라진다.
 */
const HUGE_TRI: Point[] = [
  [0, 0],
  [999_999_999, COORD],
  [COORD, 999_999_999],
];

/** 원점에서 멀리 떨어진 얇은 띠. 넓이는 작은데 누적이 크게 자란다. */
const STRIP: Point[] = [
  [-COORD, COORD - 1],
  [COORD, COORD - 1],
  [COORD, COORD],
  [-COORD, COORD],
];

/** 좌표 상한에 붙은 정사각형. */
const BIG_SQUARE: Point[] = [
  [-COORD, -COORD],
  [COORD, -COORD],
  [COORD, COORD],
  [-COORD, COORD],
];

/** 변 이름과 두 끝점. 정본의 반복 순서와 같다 — `e1` 이 첨자 0 에서 1 로 가는 변이다. */
export function edges(polygon: Point[]): [string, Point, Point][] {
  const out: [string, Point, Point][] = [];
  for (let at = 0; at < polygon.length; at++) {
    out.push([
      `e${at + 1}`,
      polygon[at] as Point,
      polygon[(at + 1) % polygon.length] as Point,
    ]);
  }
  return out;
}

/** 변 하나가 내는 항. 정본과 같은 산술이다. */
export function term(a: Point, b: Point): bigint {
  return BigInt(a[0]) * BigInt(b[1]) - BigInt(b[0]) * BigInt(a[1]);
}

/** 정수 하나를 담는 데 필요한 비트 수. 0 이면 0 이다. */
function bits(n: bigint): number {
  const size = n < 0n ? -n : n;
  return size === 0n ? 0 : size.toString(2).length;
}

/** 반지름 `r` 의 원 위 `n` 점을 반올림해 잇고 `(dx, dy)` 만큼 옮긴 다각형. */
export function ring(n: number, r: number, dx = 0, dy = 0): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < n; at++) {
    const t = (2 * Math.PI * at) / n;
    out.push([
      Math.round(r * Math.cos(t)) + dx,
      Math.round(r * Math.sin(t)) + dy,
    ]);
  }
  return out;
}

/**
 * 이빨 `m` 개가 한 칸씩 올라가는 톱니. 오목 꼭짓점이 `m` 개라 부채꼴 조각이 다각형 밖을
 * 덮는 자리가 많다.
 */
function comb(m: number, span: number): Point[] {
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

/* ────────────────────────── 다른 경로로 잰 값 ────────────────────────── */

/**
 * 사다리꼴 식으로 잰 2 배 넓이. **정본과 다른 산술 경로**다.
 *
 * 닫힌 고리에서 `Σ (x_a − x_b)(y_a + y_b)` 는 신발끈 합과 같다 — `x_a y_a` 꼴 항이 고리를 한
 * 바퀴 따라가며 짝을 지어 사라지기 때문이다. 곱하는 것과 더하는 것이 신발끈과 달라서, 두 값이
 * 같다는 것이 우연이 아님을 확인하는 자리가 된다.
 */
function trapezoidTwice(polygon: Point[]): bigint {
  let sum = 0n;
  for (const [, a, b] of edges(polygon)) {
    sum += (BigInt(a[0]) - BigInt(b[0])) * (BigInt(a[1]) + BigInt(b[1]));
  }
  return sum;
}

/**
 * 기준점을 `p` 로 둔 부채꼴의 2 배 넓이와 그 기본 연산. `p` 가 원점이면 좌표를 빼는 자리가
 * 없어서 정본과 같은 산술이 된다.
 *
 * 변 하나의 기본 연산 — 원점이면 좌표 읽기 4 · 변환 4 · 곱 2 · 뺄셈 1 · 누적 덧셈 1 이고,
 * 원점이 아니면 좌표 읽기 8 · 변환 8 · 좌표 빼기 4 · 곱 2 · 뺄셈 1 · 누적 덧셈 1 이다.
 * 반복문이 끝난 뒤 부호 비교 · 배정밀도 변환 · 2 로 나누기가 하나씩 붙는다.
 */
export function fanCounted(
  polygon: Point[],
  p: Point,
): { twice: bigint; ops: number; perEdge: number } {
  const origin = p[0] === 0 && p[1] === 0;
  let twice = 0n;
  let ops = 0;
  for (const [, a, b] of edges(polygon)) {
    if (origin) {
      ops += 4 + 4 + 2 + 1 + 1;
      twice += term(a, b);
    } else {
      ops += 8 + 8 + 4 + 2 + 1 + 1;
      twice +=
        (BigInt(a[0]) - BigInt(p[0])) * (BigInt(b[1]) - BigInt(p[1])) -
        (BigInt(b[0]) - BigInt(p[0])) * (BigInt(a[1]) - BigInt(p[1]));
    }
  }
  ops += 3;
  const perEdge = origin ? 12 : 24;
  return { twice, ops, perEdge };
}

/** 항을 정수로 두고 **배정밀도로** 누적한 넓이. 항의 값 자체는 정확하다. */
function accumulateInDouble(polygon: Point[]): number {
  let twice = 0;
  for (const [, a, b] of edges(polygon)) {
    twice += Number(term(a, b));
  }
  return Math.abs(twice) / 2;
}

/** 항마다 2 로 나눠 **배정밀도로** 누적한 넓이. 정수가 아닌 값이 만들어진다. */
function accumulateHalves(polygon: Point[]): {
  value: number;
  fractions: number;
} {
  let sum = 0;
  let fractions = 0;
  for (const [, a, b] of edges(polygon)) {
    const half = Number(term(a, b)) / 2;
    if (!Number.isInteger(half)) fractions++;
    sum += half;
  }
  return { value: Math.abs(sum), fractions };
}

/** 항 하나를 배정밀도 곱으로 만든 값. 곱이 정수 범위를 넘으면 참값과 갈린다. */
function termInDouble(a: Point, b: Point): number {
  return a[0] * b[1] - b[0] * a[1];
}

/* ────────────────────────── 가장 단순한 방법 — 귀 자르기 ────────────────────────── */

/** 기본 연산을 세는 자리. */
interface Tally {
  ops: number;
}

/**
 * 세 점이 만드는 삼각형의 부호 있는 넓이의 2 배. 기본 연산 — 좌표 읽기 8 · 변환 8 · 좌표 빼기 4 ·
 * 곱 2 · 두 곱의 뺄셈 1.
 */
function triangleTwice(o: Point, a: Point, b: Point, c?: Tally): bigint {
  if (c) c.ops += 8 + 8 + 4 + 2 + 1;
  return (
    (BigInt(a[0]) - BigInt(o[0])) * (BigInt(b[1]) - BigInt(o[1])) -
    (BigInt(b[0]) - BigInt(o[0])) * (BigInt(a[1]) - BigInt(o[1]))
  );
}

/** 점 `x` 가 삼각형 `p q r` 의 안이거나 변 위인가. 삼각형은 반시계 방향으로 받는다. 비교마다 1 을 센다. */
function insideTriangle(
  p: Point,
  q: Point,
  r: Point,
  x: Point,
  c: Tally,
): boolean {
  for (const [u, v] of [
    [p, q],
    [q, r],
    [r, p],
  ] as [Point, Point][]) {
    const side = triangleTwice(u, v, x, c);
    c.ops += 1;
    if (side < 0n) return false;
  }
  return true;
}

export interface EarResult {
  readonly twice: bigint;
  /** 「이 삼각형 안에 다른 꼭짓점이 있는가」 를 확인한 꼭짓점 수. */
  readonly checks: number;
  /** 귀가 아니라서 버리고 다음 꼭짓점으로 넘어간 후보 수. */
  readonly retries: number;
  /** 떼어 낸 삼각형 — 떼어 낸 차례대로. */
  readonly ears: readonly [Point, Point, Point][];
  readonly ops: number;
}

/**
 * 귀 자르기 — `deep.origin` 이 세우는 가장 단순한 방법.
 *
 * **정본을 부르지 않는다.** 오목하지 않은 꼭짓점 하나를 골라 그 삼각형 안에 다른 꼭짓점이
 * 없는지 확인하고, 없으면 그 삼각형을 떼어 넓이를 더한 다음 남은 다각형에 같은 일을 되풀이한다.
 * 삼각형 하나를 떼려면 남은 꼭짓점을 전부 확인해야 해서 확인이 꼭짓점 수의 제곱으로 는다.
 * 답은 정본과 대조한다.
 */
export function earClip(polygon: Point[]): EarResult {
  const c: Tally = { ops: 0 };
  const ccw = shoelaceTwice(polygon) > 0n;
  const order = ccw
    ? polygon.map((_, at) => at)
    : polygon.map((_, at) => polygon.length - 1 - at);
  const live = [...order];
  const at = (k: number): Point => polygon[live[k] as number] as Point;
  let checks = 0;
  let retries = 0;
  let twice = 0n;
  const ears: [Point, Point, Point][] = [];
  while (live.length > 3) {
    let cut = -1;
    for (let k = 0; k < live.length; k++) {
      const prev = (k + live.length - 1) % live.length;
      const next = (k + 1) % live.length;
      const turn = triangleTwice(at(prev), at(k), at(next), c);
      c.ops += 1;
      if (turn <= 0n) {
        retries++;
        continue;
      }
      let ok = true;
      for (let j = 0; j < live.length; j++) {
        if (j === k || j === prev || j === next) continue;
        checks++;
        if (insideTriangle(at(prev), at(k), at(next), at(j), c)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        cut = k;
        break;
      }
      retries++;
    }
    if (cut < 0) throw new Error("귀를 못 찾았다 — 단순 다각형이 아니다");
    const prev = (cut + live.length - 1) % live.length;
    const next = (cut + 1) % live.length;
    twice += triangleTwice(at(prev), at(cut), at(next), c);
    c.ops += 1;
    ears.push([at(prev), at(cut), at(next)]);
    live.splice(cut, 1);
  }
  twice += triangleTwice(at(0), at(1), at(2), c);
  c.ops += 1;
  ears.push([at(0), at(1), at(2)]);
  const want = shoelaceTwice(polygon);
  if (twice !== (want < 0n ? -want : want)) {
    throw new Error(`귀 자르기가 정본과 다른 넓이를 냈다 — ${twice}`);
  }
  return { twice, checks, retries, ears, ops: c.ops };
}

/** 꼭짓점 `n` 개짜리 볼록 다각형. 같은 `n` 을 두 번 재지 않는다 — 확인이 제곱으로 늘어 느리다. */
const CLIPPED = new Map<number, EarResult>();
function clipConvex(n: number): EarResult {
  const hit = CLIPPED.get(n);
  if (hit !== undefined) return hit;
  const made = earClip(ring(n, 1000));
  CLIPPED.set(n, made);
  return made;
}

/**
 * 첫 꼭짓점에서 부채꼴로 가른 삼각형의 **넓이만** 더한 값(2 배). 볼록 다각형에서 쓰는 가르기를
 * 오목한 다각형에 그대로 건 것이다. 삼각형은 `(v0, v_k, v_{k+1})` 이다.
 */
export function vertexFan(
  polygon: Point[],
): { tri: [Point, Point, Point]; signed: bigint }[] {
  const v0 = polygon[0] as Point;
  const out: { tri: [Point, Point, Point]; signed: bigint }[] = [];
  for (let k = 1; k + 1 < polygon.length; k++) {
    const a = polygon[k] as Point;
    const b = polygon[k + 1] as Point;
    out.push({ tri: [v0, a, b], signed: triangleTwice(v0, a, b) });
  }
  return out;
}

const absBig = (x: bigint): bigint => (x < 0n ? -x : x);

/* ────────────────────────── 계수 ────────────────────────── */

interface Counted {
  /** 본 변의 수. 갈래가 없어 언제나 꼭짓점 수와 같다. */
  edges: number;
  /** 기본 연산. */
  ops: number;
  /** 누적이 지나온 절댓값의 최댓값. */
  peak: bigint;
  /** 2 배 넓이. */
  twice: bigint;
}

/** 정본과 같은 절차를 변마다 세면서 실행한다. 답은 매번 정본과 대조한다. */
function judge(polygon: Point[]): Counted {
  let twice = 0n;
  let peak = 0n;
  let ops = 0;
  for (const [, a, b] of edges(polygon)) {
    ops += 4 + 4 + 2 + 1 + 1;
    twice += term(a, b);
    const size = absBig(twice);
    if (size > peak) peak = size;
  }
  ops += 3;
  if (twice !== shoelaceTwice(polygon)) {
    throw new Error("계수용 절차가 정본과 다른 값을 냈다");
  }
  return { edges: polygon.length, ops, peak, twice };
}

/* ────────────────────────── 걸음 기록 ────────────────────────── */

export interface EdgeStep {
  readonly name: string;
  readonly at: number;
  readonly next: number;
  readonly a: Point;
  readonly b: Point;
  readonly t: bigint;
  readonly before: bigint;
  readonly after: bigint;
}

/**
 * 정본과 같은 반복을 변마다 기록한다. 마지막 누적이 정본의 `shoelaceTwice` 와 같지 않으면 던진다.
 * 걸음 재생 패널과 걸음 표가 이 기록을 함께 쓴다.
 */
export function walkLog(polygon: Point[]): EdgeStep[] {
  const out: EdgeStep[] = [];
  let twice = 0n;
  for (const [at, [name, a, b]] of edges(polygon).entries()) {
    const t = term(a, b);
    out.push({
      name,
      at,
      next: (at + 1) % polygon.length,
      a,
      b,
      t,
      before: twice,
      after: twice + t,
    });
    twice += t;
  }
  if (twice !== shoelaceTwice(polygon)) {
    throw new Error("걸음 기록이 정본과 다른 합을 냈다");
  }
  return out;
}

/** 걸음 번호의 시작 — 앞으로 읽는 L 자가 T1 부터, 뒤집은 L 자가 그다음부터다. */
export const WALK_FROM = 1;
export const REVERSE_FROM = WALK_FROM + L.length + 1;

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { polygonArea: (polygon: Point[]) => number };

const REF = new URL("./polygonArea-guide.ref.ts", import.meta.url).pathname;

const TERM_LINE =
  /^ {4}twice \+= BigInt\(a\[0\]\) \* BigInt\(b\[1\]\) - BigInt\(b\[0\]\) \* BigInt\(a\[1\]\);$/;
const SIGN_LINE = /^ {2}const size = twice < 0n \? -twice : twice;$/;
const LOOP_LINE = /^ {2}for \(let at = 0; at < polygon\.length; at\+\+\) \{$/;

/** 항마다 절댓값을 씌워 더하는 사본. 부호가 사라져 상쇄가 일어나지 않는다. */
const absPerTerm = await loadMutant<Impl>(REF, {
  swap: [
    TERM_LINE,
    "    const t = BigInt(a[0]) * BigInt(b[1]) - BigInt(b[0]) * BigInt(a[1]);\n    twice += t < 0n ? -t : t;",
  ],
});

/** 항 하나를 배정밀도 곱으로 만든 뒤 큰 정수로 옮기는 사본. */
const doubleTerm = await loadMutant<Impl>(REF, {
  swap: [TERM_LINE, "    twice += BigInt(a[0] * b[1] - b[0] * a[1]);"],
});

/** 마지막 절댓값을 뺀 사본. 시계 방향 입력에서 음수가 그대로 나온다. */
const noAbsolute = await loadMutant<Impl>(REF, {
  swap: [SIGN_LINE, "  const size = twice;"],
});

/** 마지막 꼭짓점과 첫 꼭짓점을 잇는 변을 빼는 사본. 부채꼴이 안 닫힌다. */
const openFan = await loadMutant<Impl>(REF, {
  swap: [LOOP_LINE, "  for (let at = 0; at < polygon.length - 1; at++) {"],
});

/**
 * 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다.
 *
 * **중화 실행에서는 건너뛴다.** `check-proof` 가 변이를 적용하지 않은 채 이 파일을 한 번 더
 * 부르는데, 그때 `loadMutant` 는 정본 모듈을 그대로 돌려준다. 변이의 함수가 정본과 **같은 객체**
 * 이면 중화 실행이다 — 그 자리에서 던지면 갈림 대조가 한 번도 실행되지 않는다(SPEC §0).
 */
function assertBreaks(impl: Impl["polygonArea"], gaps: number[]): void {
  if (impl === polygonArea) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 다른 구현의 답을 나란히 놓은 표를 만든다. */
function contrast(
  cases: [string, Point[]][],
  other: Impl["polygonArea"],
  otherHead: string,
): { table: string; broken: number } {
  const gaps: number[] = [];
  const rows = cases.map(([label, polygon]) => {
    const want = polygonArea(polygon);
    const got = other(polygon);
    gaps.push(want === got ? 0 : 1);
    return [
      label,
      String(polygon.length),
      area(want),
      area(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  assertBreaks(other, gaps);
  return {
    table: md(["배치", "꼭짓점", "정본", otherHead, "대조"], rows, [1, 2, 3]),
    broken: gaps.filter((g) => g === 1).length,
  };
}

/* ────────────────────────── 격자 점으로 잰 덮인 횟수 ────────────────────────── */

/**
 * 점 `x` 가 삼각형 `(o, a, b)` 의 안인가 — 세 변 모두의 같은 쪽에 있는가. 변 위이면 던진다
 * (표본 점을 변 위에 놓지 않으려고 좌표를 비껴 잡았다).
 */
function inTriangleStrict(o: Point, a: Point, b: Point, x: Point): boolean {
  const s = [
    triangleTwice(o, a, x),
    triangleTwice(a, b, x),
    triangleTwice(b, o, x),
  ];
  if (s.some((v) => v === 0n)) {
    throw new Error(`표본 점 ${pt(x)} 이 삼각형의 변 위에 있다`);
  }
  return s.every((v) => v > 0n) || s.every((v) => v < 0n);
}

/** 표본 점을 비껴 잡는 자리 — 좌표 10 배 격자에서 칸 왼쪽 아래로부터 (3, 6). */
const SAMPLE_SCALE = 10;
const SAMPLE_OFFSET: Point = [3, 6];

/**
 * 격자 칸마다 비껴 잡은 표본 점 하나를 두고, 원점 부채꼴의 삼각형이 그 점을 몇 번 덮는지 센다.
 * 양의 삼각형(항이 양수)과 음의 삼각형을 따로 센다. 점이 다각형 안인지는 정본과 다른 경로 —
 * 다각형 전체를 사다리꼴 식으로 잰 부호 없이, 칸의 안팎을 L 자의 정의(직사각형 둘)로 가린다.
 */
export function coverage(
  polygon: Point[],
  box: number,
  inside: (x: Point) => boolean,
) {
  const scaled = polygon.map(
    ([x, y]) => [x * SAMPLE_SCALE, y * SAMPLE_SCALE] as Point,
  );
  const O: Point = [0, 0];
  const tris = edges(scaled).map(([, a, b]) => ({
    a,
    b,
    sign: term(a, b) > 0n ? 1 : term(a, b) < 0n ? -1 : 0,
  }));
  const groups = new Map<
    string,
    { inside: boolean; pos: number; neg: number; count: number }
  >();
  for (let gx = 0; gx < box; gx++) {
    for (let gy = 0; gy < box; gy++) {
      const x: Point = [
        gx * SAMPLE_SCALE + SAMPLE_OFFSET[0],
        gy * SAMPLE_SCALE + SAMPLE_OFFSET[1],
      ];
      let pos = 0;
      let neg = 0;
      for (const t of tris) {
        if (t.sign === 0) continue;
        if (inTriangleStrict(O, t.a, t.b, x)) {
          if (t.sign > 0) pos++;
          else neg++;
        }
      }
      const isIn = inside([gx, gy]);
      const key = `${isIn}:${pos}:${neg}`;
      const g = groups.get(key) ?? { inside: isIn, pos, neg, count: 0 };
      g.count++;
      groups.set(key, g);
    }
  }
  return [...groups.values()].sort(
    (u, v) =>
      Number(v.inside) - Number(u.inside) || v.pos - u.pos || v.neg - u.neg,
  );
}

/** L_FAR 의 칸 `(gx, gy)` 가 다각형 안인가 — 직사각형 둘 `[10,14]×[10,12]` · `[10,12]×[12,14]`. */
const inLFar = ([gx, gy]: Point): boolean =>
  (gx >= 10 && gx < 14 && gy >= 10 && gy < 12) ||
  (gx >= 10 && gx < 12 && gy >= 12 && gy < 14);

/* ────────────────────────── 블록 ────────────────────────── */

const 이고 = (x: string | number | bigint): string => josa(x, "이고", "고");

const orient = (twice: bigint): string =>
  twice > 0n ? "반시계" : twice < 0n ? "시계" : "없다";

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 배치 일곱에서 2 배 넓이가 정수로 떨어지고 부호가 꼭짓점 차례를 따른다. */
  "concept-cases": () => {
    const cases: [string, Point[]][] = [
      ["정사각형 · 반시계", SQUARE],
      ["정사각형 · 시계", SQUARE_CW],
      [
        "직각삼각형",
        [
          [0, 0],
          [4, 0],
          [0, 3],
        ],
      ],
      ["L 자 · 오목", L],
      [
        "공선 꼭짓점 포함",
        [
          [0, 0],
          [2, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ],
      ],
      [
        "한 직선 위",
        [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      ],
      ["최소 넓이 삼각형", TRI],
    ];
    let odd = 0;
    const rows = cases.map(([label, polygon]) => {
      const twice = shoelaceTwice(polygon);
      if (twice % 2n !== 0n) odd++;
      return [
        label,
        String(polygon.length),
        bignum(twice),
        orient(twice),
        area(polygonArea(polygon)),
      ];
    });
    return block(
      md(
        ["배치", "꼭짓점", "2 배 넓이", "부호가 말하는 차례", "넓이"],
        rows,
        [1, 2, 4],
      ),
      `배치 ${rows.length} 개의 2 배 넓이가 모두 정수입니다. 그 가운데 홀수인 것은 ${odd} 개이고, 그 배치의 넓이에만 소수점이 붙습니다.`,
    );
  },

  /** `concept` — 좌표를 키우면 항과 누적이 배정밀도의 정수 범위를 넘는다. */
  "concept-exact": () => {
    const rows = [1_000, 1_000_000, 33_554_432, 67_108_864, COORD].map((c) => {
      const one = 2 * c * c;
      const seen = judge(ring(1_024, c)).peak;
      return [
        num(c),
        one.toExponential(2),
        one <= EXACT ? "담긴다" : "안 담긴다",
        bignum(seen),
        seen <= BigInt(EXACT) ? "담긴다" : "안 담긴다",
      ];
    });
    const times = Math.floor((2 * COORD * COORD) / EXACT);
    return block(
      md(
        [
          "좌표 상한",
          "항 하나의 상한",
          "항이 배정밀도에",
          "원 1,024 점에서 누적이 지난 최댓값",
          "그 누적이 배정밀도에",
        ],
        rows,
        [0, 1, 3],
      ),
      `배정밀도가 정수를 오차 없이 담는 한계 Number.MAX_SAFE_INTEGER 는 ${num(EXACT)}${josa(num(EXACT), "이고", "고")}, 좌표 상한 ${num(COORD)} 에서 항 하나의 상한은 그 한계의 ${num(times)} 배가 넘습니다.`,
    );
  },

  /** `deep.origin` ② — 귀 자르기는 답을 맞히지만 기본 연산이 꼭짓점 수의 제곱으로 는다. */
  "origin-ear": () => {
    const small = earClip(L);
    const sizes = [16, 64, 256, 1_024];
    const rows = [
      [
        "L 자",
        String(L.length),
        num(small.ears.length),
        num(small.retries),
        num(small.checks),
        num(small.ops),
      ],
      ...sizes.map((n) => {
        const r = clipConvex(n);
        return [
          `볼록 ${num(n)}`,
          num(n),
          num(r.ears.length),
          num(r.retries),
          num(r.checks),
          num(r.ops),
        ];
      }),
    ];
    const grow = [64, 256, 1_024].map((n) => {
      const four = clipConvex(n).ops;
      const one = clipConvex(n / 4).ops;
      return [num(n / 4), num(n), num(one), num(four), (four / one).toFixed(2)];
    });
    const last = clipConvex(1_024).ops;
    const estimate = last * (MAX_N / 1_024) ** 2;
    const seconds = Math.round(estimate / PER_SECOND);
    return block(
      md(
        [
          "다각형",
          "꼭짓점",
          "떼어 낸 삼각형",
          "다시 고른 후보",
          "확인한 꼭짓점",
          "기본 연산",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `L 자는 삼각형 ${num(small.ears.length)} 개로 잘리고 2 배 넓이 ${bignum(small.twice)}${으로(bignum(small.twice))} 정본과 같습니다. 꼭짓점을 4 배로 늘리면 기본 연산이 이렇게 늡니다.`,
      md(
        [
          "꼭짓점 n",
          "꼭짓점 4n",
          "n 의 기본 연산",
          "4n 의 기본 연산",
          "성장률",
        ],
        grow,
        [0, 1, 2, 3, 4],
      ),
      `다시 고른 후보는 가장 많아도 ${num(Math.max(...sizes.map((n) => clipConvex(n).retries)))} 개입니다. 꼭짓점 ${num(1_024)} 개에서 잰 값을 꼭짓점 수의 제곱에 비례한다고 보고 ${num(MAX_N)} 개로 늘려 어림하면 기본 연산이 ${estimate.toExponential(2)} 번이고, 초당 1 억 번으로 ${num(seconds)} 초입니다.`,
    );
  },

  /** `deep.origin` ③ — 첫 꼭짓점 부채꼴의 넓이만 더하면 오목한 다각형에서 답이 커진다. */
  "origin-unsigned": () => {
    const cases: [string, Point[]][] = [
      ["정사각형", SQUARE],
      ["L 자", L],
      ["오목 오각형", PENT],
    ];
    let broken = 0;
    const rows = cases.map(([label, polygon]) => {
      const want = polygonArea(polygon);
      const got =
        Number(vertexFan(polygon).reduce((s, f) => s + absBig(f.signed), 0n)) /
        2;
      if (got !== want) broken++;
      return [
        label,
        String(polygon.length),
        area(want),
        area(got),
        want === got ? "같다" : "어긋난다",
      ];
    });
    const got = rows[2]?.[3] ?? "";
    const want = rows[2]?.[2] ?? "";
    return block(
      md(["배치", "꼭짓점", "정본", "넓이만 더한 답", "대조"], rows, [1, 2, 3]),
      `배치 ${cases.length} 개 가운데 어긋난 것은 ${broken} 개입니다. 오목 오각형에서 넓이만 더한 답이 ${got}${으로(got)} 정본 ${want} 보다 큽니다.`,
    );
  },

  /** `deep.origin` ④ — 부호를 살리면 밖으로 나간 삼각형이 빠지고, 기본 연산은 변 수에만 달린다. */
  "origin-signed": () => {
    const fan = vertexFan(PENT);
    const rows = fan.map((f, k) => [
      `△${k + 1}`,
      f.tri.map((p) => pt(p)).join(" → "),
      orient(f.signed),
      bignum(absBig(f.signed)),
      bignum(f.signed),
    ]);
    const signed = fan.reduce((s, f) => s + f.signed, 0n);
    const unsigned = fan.reduce((s, f) => s + absBig(f.signed), 0n);
    const v0 = (p: Point[]) => p[0] as Point;
    const costCases: [string, Point[]][] = [
      ["L 자", L],
      ["오목 오각형", PENT],
      [`볼록 ${num(1_024)}`, ring(1_024, 1000)],
    ];
    const cost = costCases.map(([label, polygon]) => {
      const ear =
        polygon.length === 1_024 ? clipConvex(1_024) : earClip(polygon);
      const f = fanCounted(polygon, v0(polygon));
      if (f.twice !== shoelaceTwice(polygon)) {
        throw new Error("첫 꼭짓점 부채꼴이 정본과 다른 합을 냈다");
      }
      return [label, num(polygon.length), num(ear.ops), num(f.ops)];
    });
    const bigEar = clipConvex(1_024).ops;
    const bigRing = ring(1_024, 1000);
    const bigFan = fanCounted(bigRing, v0(bigRing)).ops;
    return block(
      md(
        [
          "삼각형",
          "세 꼭짓점",
          "읽는 방향",
          "넓이의 2 배",
          "부호를 둔 2 배 넓이",
        ],
        rows,
        [3, 4],
      ),
      `부호를 둔 합은 ${bignum(signed)}${이고(bignum(signed))} 그 절반 ${area(Number(signed) / 2)}${이가(area(Number(signed) / 2))} 정본과 같습니다. 넓이만 더한 합은 ${bignum(unsigned)} 입니다. 같은 입력에서 귀 자르기와 기본 연산을 세면 이렇습니다.`,
      md(
        ["다각형", "꼭짓점", "귀 자르기", "부호 있는 부채꼴"],
        cost,
        [1, 2, 3],
      ),
      `꼭짓점 ${num(1_024)} 개에서 부호 있는 부채꼴의 기본 연산은 귀 자르기의 ${num(Math.floor(bigEar / bigFan))} 분의 1 이하입니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (c) — 삼각형 하나를 읽는다. */
  "build-read": () => {
    const picks = edges(L_FAR).slice(0, 2);
    const rows = picks.map(([name, a, b]) => {
      const t = term(a, b);
      return [
        name,
        `(0,0) → ${pt(a)} → ${pt(b)}`,
        `${a[0]} × ${b[1]} = ${num(a[0] * b[1])}`,
        `${b[0]} × ${a[1]} = ${num(b[0] * a[1])}`,
        bignum(t),
        orient(t),
      ];
    });
    const [n1, a1, b1] = picks[0] as [string, Point, Point];
    const t1 = term(a1, b1);
    return block(
      md(
        ["변", "세 점", "x_a · y_b", "x_b · y_a", "항 t", "읽는 방향"],
        rows,
        [4],
      ),
      `${n1} 의 항 ${bignum(t1)}${은는(bignum(t1))} 넓이 ${area(Number(absBig(t1)) / 2)} 인 삼각형의 2 배에 부호가 붙은 값이고, 부호가 음수라 원점에서 볼 때 시계 방향으로 읽힙니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (d) — 앞의 삼각형들을 모은 부채꼴과 누적이 같다. */
  "build-partial": () => {
    let same = 0;
    const rows = walkLog(L_FAR).map((s, k) => {
      const fan: Point[] = [[0, 0], ...L_FAR.slice(0, k + 2)];
      if (k + 2 > L_FAR.length) fan.push(L_FAR[0] as Point);
      const apart = trapezoidTwice(fan);
      if (apart === s.after) same++;
      return [
        s.name,
        seg(s.a, s.b),
        bignum(s.t),
        bignum(s.after),
        bignum(apart),
        apart === s.after ? "같다" : "어긋난다",
      ];
    });
    return block(
      md(
        [
          "변까지",
          "두 끝점",
          "이번 항",
          "누적",
          "부채꼴을 따로 잰 2 배 넓이",
          "대조",
        ],
        rows,
        [2, 3, 4],
      ),
      `${rows.length} 줄 가운데 ${same} 줄에서 누적과 따로 잰 값이 같습니다. 따로 잰 값은 원점과 첫 꼭짓점부터 그 변의 뒤 끝점까지를 이은 다각형을 사다리꼴 식으로 잰 것입니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (e) — 귀 자르기의 삼각형과 원점 부채꼴의 삼각형. */
  "build-versus": () => {
    const ear = earClip(L_FAR);
    const earSigned = ear.ears.map(([p, q, r]) => triangleTwice(p, q, r));
    const fan = walkLog(L_FAR).map((s) => s.t);
    const row = (label: string, ts: bigint[]) => [
      label,
      num(ts.length),
      num(ts.filter((t) => t < 0n).length),
      bignum(ts.reduce((s, t) => s + absBig(t), 0n)),
      bignum(ts.reduce((s, t) => s + t, 0n)),
    ];
    const fanAbs = fan.reduce((s, t) => s + absBig(t), 0n);
    const want = shoelaceTwice(L_FAR);
    return block(
      md(
        [
          "가르기",
          "삼각형",
          "음의 삼각형",
          "넓이의 2 배를 모두 더한 값",
          "부호를 둔 합",
        ],
        [row("귀 자르기", earSigned), row("원점 부채꼴", fan)],
        [1, 2, 3, 4],
      ),
      `원점 부채꼴은 넓이의 2 배를 모두 더하면 ${bignum(fanAbs)}${이고(bignum(fanAbs))}, 다각형의 2 배 넓이 ${bignum(want)} 보다 ${bignum(fanAbs - want)} 큽니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (f) — 격자 칸마다 표본 점을 덮은 횟수를 부호로 센다. */
  "build-cover": () => {
    const box = 15;
    const groups = coverage(L_FAR, box, inLFar);
    const rows = groups.map((g) => [
      g.inside ? "다각형 안" : "다각형 밖",
      num(g.pos),
      num(g.neg),
      num(g.pos - g.neg),
      num(g.count),
    ]);
    const inCount = groups
      .filter((g) => g.inside)
      .reduce((s, g) => s + g.count, 0);
    const outCount = groups
      .filter((g) => !g.inside)
      .reduce((s, g) => s + g.count, 0);
    const inNet = [
      ...new Set(groups.filter((g) => g.inside).map((g) => g.pos - g.neg)),
    ];
    const outNet = [
      ...new Set(groups.filter((g) => !g.inside).map((g) => g.pos - g.neg)),
    ];
    if (inNet.length !== 1 || outNet.length !== 1) {
      throw new Error("덮인 횟수가 안팎에서 하나로 모이지 않았다");
    }
    const inN = String(inNet[0]);
    const outN = String(outNet[0]);
    return block(
      md(
        [
          "점의 자리",
          "양의 삼각형이 덮은 횟수",
          "음의 삼각형이 덮은 횟수",
          "부호를 둔 횟수",
          "점 수",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `칸 ${num(box * box)} 개에 점을 하나씩 두었습니다. 다각형 안의 점 ${num(inCount)} 개는 부호를 둔 횟수가 모두 ${inN}${이고(inN)}, 밖의 점 ${num(outCount)} 개는 모두 ${outN} 입니다.`,
    );
  },

  /** `deep.build` 1단계 — 변 하나의 항을 곱 둘과 뺄셈 하나로 만든다. */
  "build-term": () => {
    const picks: [string, Point[], number][] = [
      ["L 자", L, 1],
      ["옮긴 L 자", L_FAR, 0],
      ["최소 삼각형", TRI, 1],
    ];
    const rows = picks.map(([label, polygon, k]) => {
      const [name, a, b] = edges(polygon)[k] as [string, Point, Point];
      const t = term(a, b);
      return [
        `${label} ${name}`,
        seg(a, b),
        `${a[0]} × ${b[1]} = ${num(a[0] * b[1])}`,
        `${b[0]} × ${a[1]} = ${num(b[0] * a[1])}`,
        bignum(t),
        area(Number(absBig(t)) / 2),
      ];
    });
    return block(
      md(
        ["변", "두 끝점", "x_a · y_b", "x_b · y_a", "항 t", "삼각형 넓이"],
        rows,
        [4, 5],
      ),
      `세 항이 모두 정수이고, 삼각형 넓이는 항의 절댓값의 절반입니다. 마지막 줄의 넓이 ${rows[2]?.[5] ?? ""} 처럼 항이 홀수이면 넓이에 소수점이 붙습니다.`,
    );
  },

  /** `deep.build` 2단계 — 순환 첨자가 마지막 꼭짓점과 첫 꼭짓점을 잇는다. */
  "build-cycle": () => {
    const log = walkLog(L_FAR);
    const rows = log.map((s) => [
      s.name,
      `${s.at} → ${s.next}`,
      seg(s.a, s.b),
      bignum(s.t),
    ]);
    const last = log.at(-1) as EdgeStep;
    return block(
      md(["변", "첨자", "두 끝점", "이번 항"], rows, [3]),
      `마지막 변 ${last.name}${은는(last.name)} 첨자 ${last.at} 에서 ${last.next}${으로(last.next)} 넘어가는 변이고 항이 ${bignum(last.t)} 입니다. 이 변까지 더한 합이 ${bignum(last.after)}${이고(bignum(last.after))}, 이 변을 빼면 ${bignum(last.before)} 입니다.`,
    );
  },

  /** `deep.build` 3단계 — 「항마다 2 로 나눠 넓이를 바로 더한다」 를 반박한다. */
  "build-half": () => {
    const raw = edges(TRI).map(([, a, b]) => term(a, b));
    const halved = raw.map((t) => Number(t) / 2);
    const intOk = (values: number[]): string =>
      values.every((v) => Number.isInteger(v))
        ? "셋 다 받는다"
        : "0.5 를 못 받는다";
    const big = ring(1_024, COORD);
    const exact = shoelaceTwice(big);
    const halves = accumulateHalves(big);
    const loose = accumulateInDouble(big);
    const want = polygonArea(big);
    const off = (x: number): string => bignum(BigInt(x) * 2n - exact);
    return block(
      md(
        ["방식", "세 변의 값", "큰 정수 자료형이"],
        [
          [
            "항마다 2 로 나눈다",
            halved.map((v) => String(v)).join(" · "),
            intOk(halved),
          ],
          [
            "항을 정수로 둔다",
            raw.map((t) => bignum(t)).join(" · "),
            intOk(raw.map((t) => Number(t))),
          ],
        ],
      ),
      `최소 삼각형 ${TRI.map((p) => pt(p)).join(" ")} 에서 벌써 정수가 아닌 값이 생깁니다. 반지름 ${num(COORD)} 의 원 위 ${num(1_024)} 점에서는 정수가 아닌 항이 ${num(halves.fractions)} 개이고, 세 방식의 답은 이렇습니다.`,
      md(
        ["방식", "답", "답의 2 배와 정확한 2 배 넓이의 차"],
        [
          [
            "항마다 2 로 나눠 배정밀도로 더한다",
            area(halves.value),
            off(halves.value),
          ],
          ["항을 정수로 두고 배정밀도로 더한다", area(loose), off(loose)],
          ["항을 정수로 두고 큰 정수로 더한다", area(want), off(want)],
        ],
        [1, 2],
      ),
      `정확한 2 배 넓이는 ${bignum(exact)} 입니다. 큰 정수로 더한 셋째 줄에도 차가 남는데, 답을 배정밀도로 돌려주는 마지막 변환이 남기는 차입니다.`,
    );
  },

  /** `deep.build` 3단계 — 좌표를 키우면 배정밀도 누적이 어디서부터 어긋나는가. */
  "build-scale": () => {
    const radii = [1_024, 32_768, 1_048_576, 33_554_432, 67_108_864, COORD];
    const rows = radii.map((r) => {
      const polygon = ring(1024, r);
      const c = judge(polygon);
      const loose = accumulateInDouble(polygon);
      const want = polygonArea(polygon);
      return [
        num(r),
        bignum(c.twice),
        num(bits(c.peak)),
        area(loose),
        area(want),
        loose === want ? "같다" : "어긋난다",
      ];
    });
    const first = radii.find(
      (r) => accumulateInDouble(ring(1024, r)) !== polygonArea(ring(1024, r)),
    );
    const limit = Math.log2(EXACT + 1);
    return block(
      md(
        [
          "반지름",
          "2 배 넓이",
          "누적의 비트 수",
          "배정밀도 누적의 답",
          "정본",
          "대조",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `원 위 ${num(1_024)} 점을 반올림해 이은 다각형이고 반지름만 바꿨습니다. 배정밀도 누적이 처음 어긋난 반지름은 ${num(first ?? 0)}${이고(num(first ?? 0))}, 누적의 비트 수가 ${num(limit)}${을를(num(limit))} 넘는 줄부터 어긋납니다.`,
    );
  },

  /** `deep.build` 4단계 — 합의 부호는 꼭짓점을 읽은 방향이다. */
  "build-sign": () => {
    const cases: [string, Point[]][] = [
      ["정사각형 · 반시계", SQUARE],
      ["정사각형 · 시계", SQUARE_CW],
      ["L 자 · 반시계", L],
      ["L 자 · 시계", L_CW],
    ];
    const rows = cases.map(([label, polygon]) => {
      const twice = shoelaceTwice(polygon);
      return [
        label,
        pt(polygon[1] as Point),
        bignum(twice),
        orient(twice),
        bignum(absBig(twice)),
      ];
    });
    return block(
      md(
        ["배치", "둘째 꼭짓점", "2 배 넓이", "부호가 말하는 차례", "절댓값"],
        rows,
        [2, 4],
      ),
      `같은 도형을 두 차례로 읽은 두 줄씩은 절댓값이 같고 부호만 다릅니다.`,
    );
  },

  /** `deep.build` 전제 — 경계 차례가 아닌 꼭짓점 차례는 변끼리 가로지른다. */
  "build-premise": () => {
    const BOW: Point[] = [
      [0, 0],
      [2, 2],
      [2, 0],
      [0, 2],
    ];
    const rows = (
      [
        ["경계 차례", SQUARE],
        ["차례를 섞었다", BOW],
      ] as [string, Point[]][]
    ).map(([label, polygon]) => [
      label,
      polygon.map((p) => pt(p)).join(" "),
      edges(polygon)
        .map(([, a, b]) => bignum(term(a, b)))
        .join(" · "),
      area(polygonArea(polygon)),
    ]);
    const bow = polygonArea(BOW);
    return block(
      md(["꼭짓점 차례", "꼭짓점", "변마다의 항", "정본의 답"], rows, [3]),
      `네 점은 같고 차례만 다릅니다. 섞은 차례에서는 변 둘이 가운데에서 가로지르고, 두 삼각형이 반대 부호로 들어가 답이 ${area(bow)}${이가(area(bow))} 됩니다.`,
    );
  },

  /** `deep.build` 설계 선택 — 기준점을 옮겨도 합이 같고, 원점이 기본 연산을 가장 적게 쓴다. */
  "build-apex": () => {
    const apexes: [string, Point][] = [
      ["원점", [0, 0]],
      ["첫 꼭짓점", L_FAR[0] as Point],
      ["다각형 안의 점", [11, 11]],
      ["멀리 떨어진 점", [1000, -1000]],
    ];
    const want = shoelaceTwice(L_FAR);
    let same = 0;
    const rows = apexes.map(([label, p]) => {
      const f = fanCounted(L_FAR, p);
      if (f.twice === want) same++;
      return [label, pt(p), bignum(f.twice), num(f.perEdge), num(f.ops)];
    });
    return block(
      md(
        ["기준점", "좌표", "2 배 넓이", "변 하나의 기본 연산", "기본 연산 합"],
        rows,
        [2, 3, 4],
      ),
      `다각형은 L 자를 (10,10) 만큼 옮긴 것입니다. 기준점 ${apexes.length} 개 가운데 ${same} 개에서 2 배 넓이가 같고, 원점만 좌표를 빼는 자리가 없어 변 하나의 기본 연산이 적습니다.`,
    );
  },

  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": () =>
    [
      `const L: Point[] = [${L.map((v) => `[${v[0]}, ${v[1]}]`).join(", ")}];`,
      `// 이 절이 끝나면 ${area(polygonArea(L))}${이가(area(polygonArea(L)))} 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 변 하나의 항. */
  "walk-terms": () => {
    const [name, a, b] = edges(L)[1] as [string, Point, Point];
    const t = term(a, b);
    return block(
      md(
        ["자리", "식", "값"],
        [
          [
            "x_a · y_b",
            `BigInt(${a[0]}) * BigInt(${b[1]})`,
            bignum(BigInt(a[0]) * BigInt(b[1])),
          ],
          [
            "x_b · y_a",
            `BigInt(${b[0]}) * BigInt(${a[1]})`,
            bignum(BigInt(b[0]) * BigInt(a[1])),
          ],
          ["항 t", "두 곱의 차", bignum(t)],
        ],
        [2],
      ),
      `변 ${name} = ${seg(a, b)} 의 항은 ${bignum(t)}${이고(bignum(t))}, 원점 · ${pt(a)} · ${pt(b)} 세 점이 만드는 삼각형의 넓이 ${area(Number(t) / 2)} 의 2 배입니다.`,
    );
  },

  /** `deep.walk` 짚고 가기 1 — 항을 배정밀도 곱으로 만들면. */
  "pause-double": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      ["옮긴 L 자", L_FAR],
      ["좌표 상한의 삼각형", HUGE_TRI],
    ];
    const a = HUGE_TRI[1] as Point;
    const b = HUGE_TRI[2] as Point;
    const { table } = contrast(
      cases,
      doubleTerm.polygonArea,
      "배정밀도 곱으로 만든 답",
    );
    return block(
      table,
      `셋째 줄의 변 ${seg(a, b)} 의 항을 두 산술로 만들면 이렇습니다.`,
      md(
        ["곱셈 자리", "큰 정수 산술", "배정밀도 산술"],
        [
          ["x_a · y_b", bignum(BigInt(a[0]) * BigInt(b[1])), num(a[0] * b[1])],
          ["x_b · y_a", bignum(BigInt(b[0]) * BigInt(a[1])), num(b[0] * a[1])],
          ["두 곱의 차", bignum(term(a, b)), num(termInDouble(a, b))],
        ],
        [1, 2],
      ),
      `두 곱이 모두 ${num(EXACT)} 보다 커서 배정밀도가 두 곱의 참값을 담지 못하고, 그 차가 ${bignum(term(a, b))} 대신 ${num(termInDouble(a, b))}${으로(num(termInDouble(a, b)))} 나옵니다.`,
    );
  },

  /** `deep.walk` 2 — 순환 첨자가 마지막 변을 잇는다. */
  "walk-cycle": () => {
    const log = walkLog(L);
    const rows = log.map((s) => [
      s.name,
      `${s.at} → ${s.next}`,
      seg(s.a, s.b),
      bignum(s.t),
    ]);
    const last = log.at(-1) as EdgeStep;
    const zeros = log.filter((s) => s.t === 0n).map((s) => s.name);
    return block(
      md(["변", "첨자", "두 끝점", "이번 항"], rows, [3]),
      `마지막 줄의 첨자는 ${last.at} 에서 ${last.next}${으로(last.next)} 넘어갑니다. 항 ${log.length} 개의 합은 ${bignum(last.after)}${이고(bignum(last.after))}, 항이 0 인 변은 ${zeros.join(" · ")} 입니다.`,
    );
  },

  /** `deep.walk` 짚고 가기 2 — 마지막 변을 안 이으면. */
  "pause-close": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      ["오목 오각형", PENT],
      ["옮긴 L 자", L_FAR],
      [
        "원점을 안 지나는 정사각형",
        [
          [1, 1],
          [3, 1],
          [3, 3],
          [1, 3],
        ],
      ],
    ];
    const { table } = contrast(cases, openFan.polygonArea, "마지막 변을 뺀 답");
    return block(
      table,
      "마지막 변의 항과, 그 항을 뺐을 때 남는 2 배 넓이를 나란히 놓으면 이렇습니다.",
      md(
        ["배치", "마지막 변", "그 변의 항", "빼면 남는 2 배 넓이"],
        cases.map(([label, polygon]) => {
          const last = edges(polygon)[polygon.length - 1] as [
            string,
            Point,
            Point,
          ];
          const t = term(last[1], last[2]);
          return [
            label,
            seg(last[1], last[2]),
            bignum(t),
            bignum(shoelaceTwice(polygon) - t),
          ];
        }),
        [2, 3],
      ),
    );
  },

  /** `deep.walk` 3 — 반복문 뒤의 두 줄만 실행한다. */
  "walk-finish": () => {
    const sums = [shoelaceTwice(L), shoelaceTwice(L_CW), shoelaceTwice(TRI)];
    const rows = sums.map((twice) => {
      const size = twice < 0n ? -twice : twice;
      return [
        bignum(twice),
        twice < 0n ? "참" : "거짓",
        bignum(size),
        area(Number(size) / 2),
      ];
    });
    return block(
      md(["twice", "twice < 0n", "size", "Number(size) / 2"], rows, [0, 2, 3]),
      `합이 음수인 줄만 부호가 뒤집히고, 홀수 ${bignum(sums[2] as bigint)} 도 2 로 나눈 값이 ${rows[2]?.[3] ?? ""}${으로(rows[2]?.[3] ?? "")} 정확히 나옵니다.`,
    );
  },

  /** `deep.walk` 짚고 가기 3 — 마지막 절댓값을 빼면. */
  "pause-sign": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자 · 반시계", L],
      ["뒤집은 L 자 · 시계", L_CW],
      ["시계 방향 정사각형", SQUARE_CW],
    ];
    const { table } = contrast(cases, noAbsolute.polygonArea, "절댓값을 뺀 답");
    return block(
      table,
      "세 배치의 2 배 넓이와 그 부호는 이렇습니다.",
      md(
        ["배치", "2 배 넓이", "부호가 말하는 차례"],
        cases.map(([label, polygon]) => {
          const twice = shoelaceTwice(polygon);
          return [label, bignum(twice), orient(twice)];
        }),
        [1],
      ),
    );
  },

  /** `deep.walk` 4 — 여섯 변을 끝까지 실행한다(T1~T7). */
  "walk-trace": () => {
    const log = walkLog(L);
    const rows = log.map((s, k) => [
      `T${WALK_FROM + k}`,
      s.name,
      seg(s.a, s.b),
      bignum(s.t),
      `${bignum(s.before)} → ${bignum(s.after)}`,
      "①",
    ]);
    const twice = (log.at(-1) as EdgeStep).after;
    const size = absBig(twice);
    rows.push([
      `T${WALK_FROM + log.length}`,
      "—",
      "반복문이 끝났다",
      "—",
      bignum(twice),
      "② ③",
    ]);
    return block(
      md(["걸음", "변", "두 끝점", "이번 항", "twice", "갈래"], rows, [3]),
      `걸음은 ${rows.length} 개이고 2 배 넓이는 ${bignum(twice)}, 답은 ${area(polygonArea(L))} 입니다. 마지막 걸음에서 twice < 0n 이 ${twice < 0n ? "참이라 부호를 뒤집고" : "거짓이라 부호를 그대로 두고"}, ${bignum(size)}${을를(bignum(size))} 배정밀도로 옮겨 2 로 나눕니다.`,
    );
  },

  /** `deep.walk` 5 — 꼭짓점 차례를 뒤집어 실행한다(T8~T14). */
  "walk-reverse": () => {
    const log = walkLog(L_CW);
    const rows = log.map((s, k) => [
      `T${REVERSE_FROM + k}`,
      s.name,
      seg(s.a, s.b),
      bignum(s.t),
      `${bignum(s.before)} → ${bignum(s.after)}`,
      "①",
    ]);
    const twice = (log.at(-1) as EdgeStep).after;
    const size = absBig(twice);
    rows.push([
      `T${REVERSE_FROM + log.length}`,
      "—",
      "반복문이 끝났다",
      "—",
      `${bignum(twice)} → ${bignum(size)}`,
      "② ③",
    ]);
    return block(
      md(["걸음", "변", "두 끝점", "이번 항", "twice", "갈래"], rows, [3]),
      `꼭짓점은 ${L_CW.map((p) => pt(p)).join(" ")} 차례입니다. 2 배 넓이는 ${bignum(twice)}${이고(bignum(twice))} 마지막 걸음에서 twice < 0n 이 ${twice < 0n ? "참이라" : "거짓이라"} 부호가 뒤집혀 ${bignum(size)}${이가(bignum(size))} 되며, 답은 ${area(polygonArea(L_CW))} 입니다.`,
    );
  },

  /** `deep.walk.final` — 전체 코드의 호출 몇 개. */
  "final-calls": () => {
    const calls: Point[][] = [
      SQUARE,
      [
        [0, 0],
        [4, 0],
        [0, 3],
      ],
      L,
      L_CW,
      TRI,
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
    ];
    const lines = calls.map(
      (p) => `polygonArea([${p.map((v) => `[${v[0]}, ${v[1]}]`).join(", ")}])`,
    );
    const w = Math.max(...lines.map((s) => s.length));
    return lines
      .map(
        (s, k) =>
          `${s.padEnd(w)}  ->  ${area(polygonArea(calls[k] as Point[]))}`,
      )
      .join("\n");
  },

  /** `related` — 기준점이 낀 항이 고리를 한 바퀴 따라가며 짝을 지어 사라진다. */
  "related-telescope": () => {
    const p: Point = [1000, -1000];
    const rows = edges(L_FAR).map(([name, a, b]) => {
      const dx = b[0] - a[0];
      const dy = a[1] - b[1];
      return [
        name,
        seg(a, b),
        bignum(term(a, b)),
        num(dx),
        num(dy),
        num(p[1] * dx),
        num(p[0] * dy),
      ];
    });
    const sum = (f: (a: Point, b: Point) => number) =>
      edges(L_FAR).reduce((s, [, a, b]) => s + f(a, b), 0);
    rows.push([
      "합",
      "—",
      bignum(shoelaceTwice(L_FAR)),
      num(sum((a, b) => b[0] - a[0])),
      num(sum((a, b) => a[1] - b[1])),
      num(sum((a, b) => p[1] * (b[0] - a[0]))),
      num(sum((a, b) => p[0] * (a[1] - b[1]))),
    ]);
    const shifted = fanCounted(L_FAR, p).twice;
    return block(
      md(
        [
          "변",
          "두 끝점",
          "원점 기준 항",
          "x_b − x_a",
          "y_a − y_b",
          "p_y 가 낀 항",
          "p_x 가 낀 항",
        ],
        rows,
        [2, 3, 4, 5, 6],
      ),
      `기준점 p = ${pt(p)} 로 잰 2 배 넓이는 ${bignum(shifted)}${이고(bignum(shifted))} 원점으로 잰 값도 ${bignum(shoelaceTwice(L_FAR))} 입니다. 오른쪽 네 열의 합은 모두 0 입니다.`,
    );
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 계산한다. */
  "math-check": () => {
    const rows = edges(L).map(([name, a, b]) => [
      name,
      `${a[0]} × ${b[1]}`,
      num(a[0] * b[1]),
      `${b[0]} × ${a[1]}`,
      num(b[0] * a[1]),
      bignum(term(a, b)),
    ]);
    return block(
      md(
        ["변", "앞 곱", "앞 곱의 값", "뒤 곱", "뒤 곱의 값", "t_i"],
        rows,
        [2, 4, 5],
      ),
      `항 ${L.length} 개의 합은 ${bignum(shoelaceTwice(L))}${이고(bignum(shoelaceTwice(L)))} 그 절반 ${area(polygonArea(L))}${이가(area(polygonArea(L)))} L 자의 넓이입니다. 사다리꼴 식으로 따로 잰 2 배 넓이도 ${bignum(trapezoidTwice(L))} 입니다.`,
    );
  },

  /** `deep.math` ③ — 기준점을 아무 데나 두어도 합이 같다. */
  "math-cancel": () => {
    const points: [string, Point][] = [
      ["원점", [0, 0]],
      ["첫 꼭짓점", L_FAR[0] as Point],
      ["다각형 안", [11, 11]],
      ["멀리 · 음수 좌표", [-1_000_000, -1_000_000]],
      ["좌표 상한", [COORD, COORD]],
    ];
    const want = shoelaceTwice(L_FAR);
    let same = 0;
    const rows = points.map(([label, p]) => {
      const sum = fanCounted(L_FAR, p).twice;
      if (sum === want) same++;
      return [
        label,
        pt(p),
        bignum(sum),
        bignum(sum - want),
        sum === want ? "같다" : "어긋난다",
      ];
    });
    return block(
      md(
        ["기준점", "좌표", "2 배 넓이", "원점으로 잰 값과의 차", "대조"],
        rows,
        [2, 3],
      ),
      `다각형은 L 자를 (10,10) 만큼 옮긴 꼭짓점 ${L_FAR.length} 개짜리이고, 기준점 ${points.length} 개 가운데 ${same} 개에서 차가 0 입니다.`,
    );
  },

  /** `deep.math` ④ — 결과식에 과제 규모를 넣어 수치를 낸다. */
  "math-bound": () => {
    const loose = 2 * MAX_N * COORD * COORD;
    const tight = 8 * COORD * COORD;
    const looseC = Math.floor(Math.sqrt(EXACT / (2 * MAX_N)));
    const tightC = Math.floor(Math.sqrt(EXACT / 8));
    return block(
      md(
        [
          "상한",
          "식",
          "n = 10^5 · C = 10^9 에서",
          "배정밀도에 담기는 가장 큰 C",
        ],
        [
          [
            "항을 모두 같은 부호로 놓은 상한",
            "2nC²",
            loose.toExponential(2),
            num(looseC),
          ],
          [
            "넓이가 좌표 상자를 못 넘는다는 것까지 쓴 상한",
            "8C²",
            tight.toExponential(2),
            num(tightC),
          ],
        ],
        [2, 3],
      ),
      `과제 규모에서 위 상한은 ${num(EXACT)} 의 ${num(Math.floor(loose / EXACT))} 배이고 아래 상한은 ${num(Math.floor(tight / EXACT))} 배입니다. 아래 상한이 담기는 가장 큰 C 는 2 의 ${Math.log2(tightC + 1)} 제곱보다 하나 작습니다.`,
    );
  },

  /** `invariant` — 변을 하나 더한 직후 누산기가 그때까지의 부채꼴의 2 배 넓이와 같다. */
  "invariant-states": () => {
    let same = 0;
    const rows = walkLog(PENT).map((s, k) => {
      const fan: Point[] = [[0, 0], ...PENT.slice(0, k + 2)];
      if (k + 2 > PENT.length) fan.push(PENT[0] as Point);
      const apart = trapezoidTwice(fan);
      if (apart === s.after) same++;
      return [
        s.name,
        seg(s.a, s.b),
        bignum(s.t),
        bignum(s.after),
        bignum(apart),
        apart === s.after ? "같다" : "어긋난다",
      ];
    });
    const negs = walkLog(PENT)
      .filter((s) => s.t < 0n)
      .map((s) => s.name);
    return block(
      md(
        [
          "변까지",
          "두 끝점",
          "이번 항",
          "twice",
          "부채꼴을 사다리꼴 식으로 잰 값",
          "대조",
        ],
        rows,
        [2, 3, 4],
      ),
      `오목 오각형 ${PENT.map((p) => pt(p)).join(" ")} 에서 항이 음수인 변은 ${negs.join(" · ")} 이고, ${rows.length} 줄 가운데 ${same} 줄에서 twice 와 따로 잰 값이 같습니다.`,
    );
  },

  /** `invariant` — 경계 배치에서도 두 산술이 같은 정수를 낸다. */
  "invariant-edges": () => {
    const cases: [string, Point[]][] = [
      ["꼭짓점 셋 · 최소 다각형", TRI],
      [
        "꼭짓점이 모두 한 직선 위",
        [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      ],
      [
        "공선 꼭짓점이 낀 정사각형",
        [
          [0, 0],
          [2, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ],
      ],
      ["시계 방향 L 자", L_CW],
      ["원점이 다각형 밖", L_FAR],
      ["좌표 상한의 정사각형", BIG_SQUARE],
      ["원점에서 먼 얇은 띠", STRIP],
    ];
    let same = 0;
    const rows = cases.map(([label, polygon]) => {
      const twice = shoelaceTwice(polygon);
      const apart = trapezoidTwice(polygon);
      if (twice === apart) same++;
      return [
        label,
        String(polygon.length),
        bignum(twice),
        bignum(apart),
        area(polygonArea(polygon)),
        twice === apart ? "같다" : "어긋난다",
      ];
    });
    return block(
      md(
        ["배치", "꼭짓점", "2 배 넓이", "사다리꼴 식", "넓이", "대조"],
        rows,
        [1, 2, 3, 4],
      ),
      `배치 ${cases.length} 개 가운데 ${same} 개에서 두 산술이 같은 정수를 냅니다.`,
    );
  },

  /** `invariant` 깨뜨리기 — 항마다 절댓값을 씌운 변이. */
  "mutant-abs": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자 · 원점이 꼭짓점", L],
      ["옮긴 L 자 · 원점이 밖", L_FAR],
      ["오목 오각형", PENT],
    ];
    const rows = cases.map(([label, polygon]) => {
      const ts = edges(polygon).map(([, a, b]) => term(a, b));
      return [
        label,
        String(ts.filter((t) => t < 0n).length),
        bignum(shoelaceTwice(polygon)),
        bignum(ts.reduce((s, t) => s + absBig(t), 0n)),
      ];
    });
    const { table } = contrast(
      cases,
      absPerTerm.polygonArea,
      "항마다 절댓값을 씌운 답",
    );
    return block(
      table,
      "배치마다 음수 항의 수와 두 합을 세면 이렇습니다.",
      md(
        ["배치", "음수 항", "정본의 2 배 넓이", "절댓값을 씌운 합"],
        rows,
        [1, 2, 3],
      ),
    );
  },

  /** `perf.derive` — 전개의 걸음을 기본 연산으로 센다. */
  "perf-count": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      ["뒤집은 L 자", L_CW],
      ["오목 오각형", PENT],
      [`원 ${num(1_024)} 점 · 반지름 10^9`, ring(1024, COORD)],
    ];
    const rows = cases.map(([label, polygon]) => {
      const c = judge(polygon);
      return [
        label,
        num(c.edges),
        num(c.edges * 4),
        num(c.edges * 4),
        num(c.edges * 2),
        num(c.edges * 2),
        num(3),
        num(c.ops),
      ];
    });
    return block(
      md(
        [
          "배치",
          "본 변",
          "좌표 읽기",
          "변환",
          "곱셈",
          "덧셈·뺄셈",
          "반복문 뒤",
          "기본 연산",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7],
      ),
      `변 하나가 좌표 읽기 4 · 변환 4 · 곱셈 2 · 덧셈·뺄셈 2 로 12 이고, 반복문 뒤에 부호 비교 · 배정밀도 변환 · 나눗셈이 하나씩 붙습니다.`,
    );
  },

  /** `perf.derive` — 총식이 센 값과 같은가. */
  "perf-formula": () => {
    const cases: [string, Point[]][] = [
      ["오목 오각형", PENT],
      ["전개 입력 L 자", L],
      [`원 ${num(1_024)} 점`, ring(1024, COORD)],
    ];
    let same = 0;
    const rows = cases.map(([label, polygon]) => {
      const n = polygon.length;
      const got = judge(polygon).ops;
      if (got === 12 * n + 3) same++;
      return [
        label,
        num(n),
        num(12 * n + 3),
        num(got),
        got === 12 * n + 3 ? "같다" : "어긋난다",
      ];
    });
    return block(
      md(["배치", "n", "12n + 3", "센 기본 연산", "대조"], rows, [1, 2, 3]),
      `${rows.length} 줄 가운데 ${same} 줄에서 식의 값과 센 값이 같습니다.`,
    );
  },

  /** `perf.bounds` — 누산기가 담아야 하는 비트 수의 상한과 실측. */
  "perf-bits": () => {
    const upper = Math.ceil(Math.log2(2 * MAX_N * COORD * COORD));
    const measured = judge(BIG_SQUARE).peak;
    return block(
      md(
        ["무엇", "식 또는 배치", "비트"],
        [
          ["상한", "⌈log₂(2nC²)⌉ · n = 10^5 · C = 10^9", num(upper)],
          ["실측의 최댓값", "좌표 상한의 정사각형", num(bits(measured))],
        ],
        [2],
      ),
      `상한 ${num(upper)} 비트는 항이 모두 같은 부호라고 놓은 값이고, 아래 「최악을 만드는 입력」 의 배치들에서 누산기가 지난 가장 큰 값은 ${num(bits(measured))} 비트입니다.`,
    );
  },

  /** `perf.worst` — 어떤 배치가 누산기를 가장 크게 만드는가. */
  "worst-shape": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      ["좌표 상한의 정사각형", BIG_SQUARE],
      [`원 ${num(1_024)} 점 · 반지름 10^9`, ring(1024, COORD)],
      [`원 ${num(1_024)} 점 · 반지름 1000 · 원점 위`, ring(1024, 1000)],
      [
        `원 ${num(1_024)} 점 · 반지름 1000 · 좌표 상한으로 옮김`,
        ring(1024, 1000, COORD - 1000, COORD - 1000),
      ],
      ["원점에서 먼 얇은 띠", STRIP],
      [
        "톱니 512 · 좌표 상한 근처로 옮김",
        comb(512, 3).map(
          ([x, y]) => [x + COORD - 2048, y + COORD - 2048] as Point,
        ),
      ],
    ];
    let widest = "";
    let widestBits = -1;
    let gapped = "";
    let gap = -1;
    const rows = cases.map(([label, polygon]) => {
      const c = judge(polygon);
      const peakBits = bits(c.peak);
      const d = peakBits - bits(c.twice);
      if (peakBits > widestBits) {
        widestBits = peakBits;
        widest = label;
      }
      if (d > gap) {
        gap = d;
        gapped = label;
      }
      return [
        label,
        num(c.edges),
        num(c.ops),
        num(bits(c.twice)),
        num(peakBits),
        num(d),
      ];
    });
    return block(
      md(
        [
          "배치",
          "꼭짓점",
          "기본 연산",
          "2 배 넓이의 비트",
          "누적이 지난 최댓값의 비트",
          "비트 차",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `누산기가 가장 넓어지는 배치는 「${widest}」${으로(widest)} ${num(widestBits)} 비트이고, 답보다 누산기가 가장 많이 큰 배치는 「${gapped}」${으로(gapped)} ${num(gap)} 비트 차입니다.`,
    );
  },

  /** `selfcheck` 답 — 항이 0 이 되는 조건. */
  "check-zero": () => {
    const picks = [0, 5, 1].map((k) => edges(L)[k] as [string, Point, Point]);
    const rows = picks.map(([name, a, b]) => [
      name,
      seg(a, b),
      `${a[0]} × ${b[1]} − ${b[0]} × ${a[1]}`,
      bignum(term(a, b)),
    ]);
    return md(["변", "두 끝점", "식", "항"], rows, [3]);
  },
};
