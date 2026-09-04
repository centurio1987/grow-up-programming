/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts pointInPolygon-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  type Point,
  pointInPolygon,
  sideOf,
} from "./pointInPolygon-guide.ref.ts";

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
const num = (n: number): string => n.toLocaleString("en-US");

/**
 * 큰 정수의 천 단위 구분. **`Number` 로 바꿔 적지 않는다** — 이 편이 다루는 칸 수와 곱은
 * 배정밀도가 정수로 못 담는 크기라, 변환하는 순간 표가 어림수로 보이게 된다.
 */
const bignum = (n: bigint): string =>
  (n < 0n ? "-" : "") +
  (n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
const pt = (p: Point): string => `(${p[0]},${p[1]})`;

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

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력 — L 자 다각형과 질의 점 셋.
 *
 * 세 점 안에 이 절차의 갈래가 전부 들어 있다 — `q1` 은 넘는 횟수가 홀수라 내부이고, `q2` 는
 * 오목한 자리에 있어 짝수이며, `q3` 은 변 위라 홀짝을 세기 전에 답이 난다.
 */
const L: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];
const Q1: Point = [1, 1];
const Q2: Point = [3, 3];
const Q3: Point = [2, 3];
const WALK: [string, Point][] = [
  ["q1", Q1],
  ["q2", Q2],
  ["q3", Q3],
];

/** 변 이름과 두 끝점. `prev → at` 순서가 정본의 반복 순서와 같다. */
function edges(polygon: Point[]): [string, Point, Point][] {
  const out: [string, Point, Point][] = [];
  for (
    let at = 0, prev = polygon.length - 1;
    at < polygon.length;
    prev = at++
  ) {
    out.push([
      `e${out.length + 1}`,
      polygon[prev] as Point,
      polygon[at] as Point,
    ]);
  }
  return out;
}

/** 제약의 좌표 절댓값 상한과 배정밀도가 부호를 못 믿는 하한. */
const COORD = 1_000_000_000;
const SAFE = 2048;

/** 메모리 제한 256 MB 를 바이트로. */
const MEMORY_LIMIT = 256n * 1024n * 1024n;

/**
 * 나눗셈으로 교점의 `x` 를 구하는 방식이 어긋나는 배치.
 *
 * 변 `(0,0) → (999999997, 1000000000)` 의 높이 333,333,333 에서의 `x` 는
 * 333,333,332 와 333,333,333 사이인데 그 차가 10 억분의 1 이다. 배정밀도 나눗셈은 그 차를
 * 못 담고 정확히 333,333,332 를 낸다.
 */
const QUOTIENT_POLYGON: Point[] = [
  [0, 0],
  [999_999_997, 1_000_000_000],
  [COORD, 0],
];
const QUOTIENT_POINT: Point = [333_333_332, 333_333_333];

/* ────────────────────────── 계수 ────────────────────────── */

/** 정본과 같은 산술로 배정밀도 값을 낸다. 부호는 `sideOf` 가 확정한다. */
function approxOf(o: Point, a: Point, b: Point): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** 큰 정수로 잰 판정의 원시 값. 부호만 쓰는 정본과 달리 크기까지 남긴다. */
function exactOf(o: Point, a: Point, b: Point): bigint {
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

interface Judged {
  /** 본 변의 수. 변 위라 그 자리에서 끝나면 거기까지다. */
  seen: number;
  /** 배정밀도 값이 하한을 넘어 그 자리에서 끝난 판정의 수. */
  fast: number;
  /** 큰 정수로 되잰 판정의 수. */
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

/** 정본과 같은 절차를 걸음마다 세면서 실행한다. 답은 매번 정본과 대조한다. */
function judge(p: Point, polygon: Point[]): Judged {
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
  for (const [, a, b] of edges(polygon)) {
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
      const inBox =
        Math.min(a[0], b[0]) <= p[0] &&
        p[0] <= Math.max(a[0], b[0]) &&
        Math.min(a[1], b[1]) <= p[1] &&
        p[1] <= Math.max(a[1], b[1]);
      if (inBox) {
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
const TRIES = 20_000;

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
 * 좌표 격자의 칸마다 안팎을 미리 적어 두는 방법. `deep.build` 직무 ② 가 세우는 것이다.
 *
 * **정본을 부르지 않는다.** 변을 격자에 표시한 다음 바깥에서 물이 번지듯 이어진 칸을 모두
 * 표시하고, 표시되지 않은 칸을 내부로 본다. 격자를 두 배로 늘려 두어 변이 칸 사이를 막는다 —
 * 축에 나란한 변만 그 방식으로 정확하므로, 아니면 던진다.
 */
function fillGrid(polygon: Point[]): boolean[][] {
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
 * 교점의 `x` 를 나눗셈으로 구해 견주는 방식. `deep.build` 직무 ④ 가 상대로 세우는 것이다.
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
    if (
      d === 0 &&
      Math.min(a[0], b[0]) <= p[0] &&
      p[0] <= Math.max(a[0], b[0]) &&
      Math.min(a[1], b[1]) <= p[1] &&
      p[1] <= Math.max(a[1], b[1])
    ) {
      return true;
    }
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
    if (
      d === 0 &&
      Math.min(a[0], b[0]) <= p[0] &&
      p[0] <= Math.max(a[0], b[0]) &&
      Math.min(a[1], b[1]) <= p[1] &&
      p[1] <= Math.max(a[1], b[1])
    ) {
      return true;
    }
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

/** 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 다른 구현의 답을 나란히 놓은 표를 만든다. */
function contrast(
  cases: [string, Point, Point[]][],
  other: (p: Point, polygon: Point[]) => boolean,
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
  assertBreaks(gaps);
  return table(["배치", "질의 점", "정본", otherHead, "대조"], rows, [
    "l",
    "l",
    "l",
    "l",
    "l",
  ]);
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

/* ────────────────────────── 블록 ────────────────────────── */

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
    const rows = cases.map(([label, p]) => {
      const r = judge(p, L);
      return [
        label,
        pt(p),
        String(r.crossed),
        String(r.flips),
        r.onEdge ? "변 위" : r.flips % 2 === 1 ? "홀수" : "짝수",
        String(r.answer),
      ];
    });
    return [
      table(
        [
          "배치",
          "질의 점",
          "높이를 지나는 변",
          "오른쪽에서 넘는 변",
          "무엇으로 갈리나",
          "답",
        ],
        rows,
        ["l", "l", "r", "r", "l", "l"],
      ),
      "",
      "다각형은 L 자 여섯 변 (0,0) (4,0) (4,2) (2,2) (2,4) (0,4)",
      "└ 변 위인 두 줄은 홀짝을 세기 전에 답이 나고, 나머지 넷은 넘는 변의 수가 홀수인지로 갈린다",
      "└ 변 위로 끝난 줄은 그 변까지만 세므로 가운데 두 열이 남은 변을 안 담는다",
    ].join("\n");
  },

  /** `concept` — 좌표를 키우면 판정값이 배정밀도의 정수 한계를 넘는다. */
  "concept-exact": () => {
    const rows = [1_000, 1_000_000, 23_726_566, COORD].map((c) => {
      const largest = 4 * c * c;
      return [
        num(c),
        largest.toExponential(2),
        largest <= Number.MAX_SAFE_INTEGER ? "담긴다" : "안 담긴다",
        (c * c) / 2 ** 49 < 1 ? "필요 없다" : "필요하다",
      ];
    });
    return [
      table(
        [
          "좌표 상한",
          "판정값의 최댓값",
          "배정밀도가 정수로",
          "큰 정수 되재기가",
        ],
        rows,
        ["r", "r", "l", "l"],
      ),
      "",
      `정수가 어긋남 없이 담기는 마지막 값  ${num(Number.MAX_SAFE_INTEGER)}`,
      `└ 제약의 좌표 상한에서 판정값 하나는 그 마지막 값의 ${Math.floor((4 * COORD * COORD) / Number.MAX_SAFE_INTEGER)} 배까지 커진다`,
    ].join("\n");
  },

  /** `deep.build` ② — 격자에 안팎을 적어 두는 방법과 그 크기. */
  "build-grid": () => {
    const grid = fillGrid(L);
    const lines: string[] = [];
    for (let y = grid.length - 1; y >= 0; y--) {
      const row = grid[y] as boolean[];
      lines.push(` ${y} | ${row.map((v) => (v ? "1" : ".")).join(" ")}`);
    }
    lines.push(`   +${"-".repeat(2 * (grid[0] as boolean[]).length + 1)}`);
    lines.push(`     ${(grid[0] as boolean[]).map((_, x) => x).join(" ")}`);

    let same = 0;
    let cells = 0;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < (grid[y] as boolean[]).length; x++) {
        cells++;
        if ((grid[y] as boolean[])[x] === pointInPolygon([x, y], L)) same++;
      }
    }
    const sides: [string, bigint][] = [
      ["이 L 자 다각형", BigInt((grid[0] as boolean[]).length)],
      ["제약의 좌표 범위", 2n * BigInt(COORD) + 1n],
    ];
    const sized = sides.map(([label, side]) => {
      const full = side * side;
      const bytes = (full + 7n) / 8n;
      return [label, bignum(side), bignum(full), bignum(bytes)];
    });
    const worst = (2n * BigInt(COORD) + 1n) ** 2n;
    const worstBytes = (worst + 7n) / 8n;
    return [
      lines.join("\n"),
      "",
      `1 은 내부이거나 경계 · . 은 외부. 칸 ${num(cells)} 개 가운데 정본과 답이 같은 칸 ${num(same)} 개`,
      "",
      table(
        ["표를 만드는 범위", "한 변의 칸", "칸 수", "1 비트씩 잡은 바이트"],
        sized,
        ["l", "r", "r", "r"],
      ),
      "",
      `메모리 제한 256 MB 는 ${bignum(MEMORY_LIMIT)} 바이트이고, 아래 줄은 그것의 ${bignum(worstBytes / MEMORY_LIMIT)} 배다`,
      "└ 작은 다각형에서는 이 방법이 맞는 답을 낸다. 제약 규모에서는 표 자체가 안 들어간다",
    ].join("\n");
  },

  /** `deep.build` ③ — 반직선이 넘는 변의 수와 답. */
  "build-ray": () => {
    const cases: [string, Point][] = [
      ["q1", Q1],
      ["q2", Q2],
      ["아래쪽 안", [3, 1]],
      ["위쪽 바깥", [3, 4]],
    ];
    const rows = cases.map(([label, p]) => {
      const r = judge(p, L);
      const names = edges(L)
        .filter(([, a, b]) => {
          if (a[1] > p[1] === b[1] > p[1]) return false;
          return sideOf(a, b, p) > 0 === b[1] > a[1];
        })
        .map(([name]) => name);
      return [
        label,
        pt(p),
        names.length > 0 ? names.join(" ") : "없다",
        String(r.flips),
        r.flips % 2 === 1 ? "홀수" : "짝수",
        String(r.answer),
      ];
    });
    return [
      table(
        ["이름", "질의 점", "오른쪽에서 넘는 변", "넘는 횟수", "홀짝", "답"],
        rows,
        ["l", "l", "l", "r", "l", "l"],
      ),
      "",
      "변 이름은 e1 (0,4)-(0,0) · e2 (0,0)-(4,0) · e3 (4,0)-(4,2) · e4 (4,2)-(2,2) · e5 (2,2)-(2,4) · e6 (2,4)-(0,4)",
      "└ 넘는 횟수가 홀수인 점만 내부다. 오목한 다각형이어도 갈래가 더 늘지 않는다",
    ].join("\n");
  },

  /** `deep.build` ④ — 나눗셈으로 교점을 구하는 방식과 부호만 보는 방식. */
  "build-quotient": () => {
    const family = star(5, 100, 40);
    const points = scatter(TRIES, 240);
    const quotient: Arith = { mul: 0, div: 0, fractional: 0 };
    let signMul = 0;
    for (const p of points) {
      byQuotient(p, family, quotient);
      const r = judge(p, family);
      // 두 방식이 변 위 판정에 같은 방향 판정을 쓴다. 그 몫은 두 열에 똑같이 들어간다.
      quotient.mul += r.seen * 2;
      signMul += r.seen * 2;
    }
    const wrongSmall = disagreements(family, points, byQuotient);
    const wrongBig = disagreements(
      QUOTIENT_POLYGON,
      [QUOTIENT_POINT],
      byQuotient,
    );
    const exact = exactOf(
      QUOTIENT_POLYGON[0] as Point,
      QUOTIENT_POLYGON[1] as Point,
      QUOTIENT_POINT,
    );
    const bx = (QUOTIENT_POLYGON[1] as Point)[0];
    const by = (QUOTIENT_POLYGON[1] as Point)[1];
    const quotientX = (QUOTIENT_POINT[1] * bx) / by;
    return [
      table(
        [
          "방식",
          "배정밀도 곱",
          "나눗셈",
          "정수가 아닌 값",
          "별 다섯에서 틀린 답",
        ],
        [
          [
            "교점의 x 를 구해 견준다",
            num(quotient.mul),
            num(quotient.div),
            num(quotient.fractional),
            num(wrongSmall),
          ],
          ["부호만 견준다", num(signMul), "0", "0", "0"],
        ],
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `같은 질의 점 ${num(points.length)} 개 · 좌표 -240~240 · 꼭짓점 열 개짜리 별`,
      "",
      `겨냥해 만든 배치  다각형 ${QUOTIENT_POLYGON.map(pt).join(" ")}  질의 점 ${pt(QUOTIENT_POINT)}`,
      `  변 (0,0)-${pt(QUOTIENT_POLYGON[1] as Point)} 가 그 높이를 지나는 x 를 배정밀도가 낸 값  ${num(quotientX)}`,
      `  질의 점의 x                                                            ${num(QUOTIENT_POINT[0])}`,
      `  같은 자리의 판정값(큰 정수)                                            ${bignum(exact)}`,
      `  정본 ${pointInPolygon(QUOTIENT_POINT, QUOTIENT_POLYGON)} · 교점의 x 를 구해 견준 답 ${byQuotient(QUOTIENT_POINT, QUOTIENT_POLYGON)} · 어긋난 질의 ${num(wrongBig)} 개`,
      "└ 별 다섯에서는 두 방식의 답이 같다. 좌표가 상한에 붙으면 나눗셈이 10 억분의 1 을 못 담는다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 닫힌 구간 후보가 한 점에서 무엇을 세는가. */
  "build-rules": () => {
    const p: Point = [5, 2];
    const rows = edges(L).map(([name, a, b]) => {
      const low = Math.min(a[1], b[1]);
      const high = Math.max(a[1], b[1]);
      const closed = low <= p[1] && p[1] <= high;
      const half = a[1] > p[1] !== b[1] > p[1];
      const right = sideOf(a, b, p) > 0 === b[1] > a[1];
      return [
        name,
        `${pt(a)}-${pt(b)}`,
        `[${low},${high}]`,
        closed ? "센다" : "뺀다",
        half ? "센다" : "뺀다",
        closed && right ? "뒤집는다" : "그대로",
        half && right ? "뒤집는다" : "그대로",
      ];
    });
    const closedAnswer = withRule(p, L, "closed");
    return [
      table(
        [
          "변",
          "두 끝점",
          "높이 구간",
          "닫힌 구간은",
          "반개구간은",
          "닫힌 쪽이 하는 일",
          "반개 쪽이 하는 일",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l", "l"],
      ),
      "",
      `질의 점 ${pt(p)} · 정본 ${pointInPolygon(p, L)} · 닫힌 구간으로 센 답 ${closedAnswer}`,
      "└ 높이 2 에 꼭짓점이 (4,2) 와 (2,2) 둘 있어서, 그 높이에 걸친 변이 e3 · e4 · e5 셋이다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 세 후보를 세 가족에서 재서 남는 것 하나. */
  "build-sweep": () => {
    const families: [string, Point[], number][] = [
      ["L 자 · 좌표 -8~8", L, 8],
      ["별 다섯 · 좌표 -240~240", star(5, 100, 40), 240],
      ["톱니 여덟 · 좌표 -40~40", comb(8, 3), 40],
    ];
    const rows = families.map(([label, polygon, half]) => {
      const points = scatter(TRIES, half);
      return [
        label,
        num(points.length),
        num(
          disagreements(polygon, points, (p, poly) =>
            withRule(p, poly, "closed"),
          ),
        ),
        num(
          disagreements(polygon, points, (p, poly) =>
            withRule(p, poly, "half"),
          ),
        ),
        num(
          disagreements(polygon, points, (p, poly) =>
            withRule(p, poly, "open"),
          ),
        ),
      ];
    });
    return [
      table(
        ["입력 가족", "질의 점", "닫힌 구간", "반개구간", "열린 구간"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "세 열의 값은 정본과 답이 어긋난 질의 점의 수다",
      "└ 반개구간만 세 가족에서 전부 0 이다. 나머지 둘은 꼭짓점 높이와 수평 변에서 갈린다",
    ].join("\n");
  },

  /** `deep.walk` 멈춤 1 — 배정밀도 곱만으로 부호를 정하면. */
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
    const ux = BigInt(a[0] - o[0]);
    const uy = BigInt(a[1] - o[1]);
    const vx = BigInt(QUOTIENT_POINT[0] - o[0]);
    const vy = BigInt(QUOTIENT_POINT[1] - o[1]);
    return [
      contrast(cases, floatOnly.pointInPolygon, "배정밀도 곱만 쓴 답"),
      "",
      `변 ${pt(o)}-${pt(a)} 와 점 ${pt(QUOTIENT_POINT)} 의 판정을 산술 둘로 재면`,
      "",
      table(
        ["곱셈 자리", "큰 정수 산술", "배정밀도 산술"],
        [
          [
            "왼쪽 항",
            bignum(ux * vy),
            num((a[0] - o[0]) * (QUOTIENT_POINT[1] - o[1])),
          ],
          [
            "오른쪽 항",
            bignum(uy * vx),
            num((a[1] - o[1]) * (QUOTIENT_POINT[0] - o[0])),
          ],
          [
            "두 항의 차",
            bignum(ux * vy - uy * vx),
            num(approxOf(o, a, QUOTIENT_POINT)),
          ],
        ],
        ["l", "r", "r"],
      ),
      "",
      `두 항이 다 ${num(Number.MAX_SAFE_INTEGER)} 를 넘어서 배정밀도가 둘을 같은 값으로 맞춰 버렸다`,
      "└ 참값 1 이 0 으로 읽히고, 그러면 그 점이 변 위인 것이 되어 외부가 내부로 뒤집힌다",
    ].join("\n");
  },

  /** `deep.walk` 멈춤 2 — 변 위 판정을 빼면. */
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
      `격자 0~4 의 점 ${num(grid.length * (grid[0] as boolean[]).length)} 개 가운데 변 위인 점이 ${num(onEdge)} 개이고, 그중 ${num(missed)} 개에서 답이 어긋난다`,
      "└ 변 위의 점은 넘는 횟수가 홀수일 수도 짝수일 수도 있다. 홀짝만으로는 경계를 못 잡는다",
    ].join("\n");
  },

  /** `deep.walk` 멈춤 3 — 높이 판정을 닫힌 구간으로 바꾸면. */
  "pause-closed": () => {
    const cases: [string, Point, Point[]][] = [
      ["꼭짓점 높이의 바깥 점", [5, 2], L],
      ["꼭짓점 높이의 안쪽 점", [1, 2], L],
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
      `좌표 -8~8 의 질의 점 ${num(points.length)} 개 가운데 ${num(gaps)} 개에서 답이 어긋나고, 꼭짓점과 높이가 같은 점은 ${num(vertexHeights)} 개다`,
      "└ 꼭짓점 하나를 두 변이 함께 세면 넘는 횟수가 하나 늘거나 줄어 홀짝이 뒤집힌다",
    ].join("\n");
  },

  /** `deep.walk` — L 자 다각형과 질의 점 셋의 자리. */
  "walk-grid": () => {
    const grid = fillGrid(L);
    const mark = new Map<string, string>();
    for (const [name, p] of WALK)
      mark.set(`${p[0]},${p[1]}`, name[1] as string);
    const lines: string[] = [];
    for (let y = grid.length - 1; y >= 0; y--) {
      const cells = (grid[y] as boolean[]).map((v, x) => {
        const at = mark.get(`${x},${y}`);
        if (at !== undefined) return at;
        return v ? "o" : ".";
      });
      lines.push(` ${y} | ${cells.join(" ")}`);
    }
    lines.push(`   +${"-".repeat(2 * (grid[0] as boolean[]).length + 1)}`);
    lines.push(`     ${(grid[0] as boolean[]).map((_, x) => x).join(" ")}`);
    const answers = WALK.map(([name, p]) => `${name} ${pointInPolygon(p, L)}`);
    return [
      lines.join("\n"),
      "",
      "o 는 다각형의 내부이거나 경계이고 . 은 외부다. 1 2 3 자리가 질의 점 q1 q2 q3 이다",
      `답  ${answers.join(" · ")}`,
    ].join("\n");
  },

  /** `deep.walk` — 세 질의를 걸음마다 펼친다. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let step = 0;
    for (const [name, p] of WALK) {
      let inside = false;
      let stopped = false;
      /** 같은 일을 한 변이 잇달아 나오면 한 줄로 묶는다. */
      let group: { edges: string[]; did: string; before: boolean } | null =
        null;
      const flush = (): void => {
        if (group === null) return;
        step++;
        rows.push([
          `T${step}`,
          name,
          group.edges.join(" "),
          group.did,
          group.did === "변 위라 그 자리에서 참"
            ? "true"
            : `${group.before} → ${inside}`,
        ]);
        group = null;
      };
      for (const [edge, a, b] of edges(L)) {
        if (stopped) break;
        const d = sideOf(a, b, p);
        let did: string;
        if (
          d === 0 &&
          Math.min(a[0], b[0]) <= p[0] &&
          p[0] <= Math.max(a[0], b[0]) &&
          Math.min(a[1], b[1]) <= p[1] &&
          p[1] <= Math.max(a[1], b[1])
        ) {
          did = "변 위라 그 자리에서 참";
          stopped = true;
        } else if (a[1] > p[1] === b[1] > p[1]) {
          did = "높이 밖이라 건너뛴다";
        } else if (d > 0 === b[1] > a[1]) {
          did = "오른쪽에서 넘어 뒤집는다";
        } else {
          did = "왼쪽이라 그대로 둔다";
        }
        if (group !== null && group.did !== did) flush();
        if (group === null) group = { edges: [], did, before: inside };
        group.edges.push(edge);
        if (did === "오른쪽에서 넘어 뒤집는다") {
          inside = !inside;
          flush();
        }
      }
      flush();
    }
    const answers = WALK.map(([name, p]) => `${name} ${pointInPolygon(p, L)}`);
    return [
      table(["걸음", "질의", "본 변", "하는 일", "inside"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `걸음 ${num(rows.length)} 개 · 답  ${answers.join(" · ")}`,
      "└ q3 은 e5 에서 변 위가 되어 남은 변 하나를 안 본다",
    ].join("\n");
  },

  /** `deep.walk` — 갈래마다 몇 번 참이 됐는가. */
  "walk-branch": () => {
    const walkTotals = { fast: 0, slow: 0, edge: 0, crossed: 0, flips: 0 };
    for (const [, p] of WALK) {
      const r = judge(p, L);
      walkTotals.fast += r.fast;
      walkTotals.slow += r.slow;
      walkTotals.edge += r.onEdge ? 1 : 0;
      walkTotals.crossed += r.crossed;
      walkTotals.flips += r.flips;
    }
    const big = ring(64, COORD / 2);
    const bigTotals = { fast: 0, slow: 0, edge: 0, crossed: 0, flips: 0 };
    for (const p of scatter(3, COORD / 2)) {
      const r = judge(p, big);
      bigTotals.fast += r.fast;
      bigTotals.slow += r.slow;
      bigTotals.edge += r.onEdge ? 1 : 0;
      bigTotals.crossed += r.crossed;
      bigTotals.flips += r.flips;
    }
    const rows = [
      [
        "①",
        "배정밀도로 재고 그 자리에서 끝낸다",
        walkTotals.fast,
        bigTotals.fast,
      ],
      ["②", "큰 정수로 다시 잰다", walkTotals.slow, bigTotals.slow],
      ["③", "변 위라 그 자리에서 참", walkTotals.edge, bigTotals.edge],
      [
        "④",
        "높이를 반개구간으로 지난다",
        walkTotals.crossed,
        bigTotals.crossed,
      ],
      ["⑤", "교점이 오른쪽이라 뒤집는다", walkTotals.flips, bigTotals.flips],
      ["⑥", "다 본 뒤 홀짝으로 답한다", WALK.length - walkTotals.edge, 3],
    ].map(([label, what, a, b]) => [
      String(label),
      String(what),
      `${num(a as number)} 번`,
      `${num(b as number)} 번`,
    ]);
    return [
      table(
        ["갈래", "하는 일", "전개 입력에서", "좌표 상한의 원형에서"],
        rows,
        ["l", "l", "r", "r"],
      ),
      "",
      `오른쪽 열은 꼭짓점 ${num(big.length)} 개짜리 원형 다각형에 질의 세 개를 준 값이다`,
      "└ 전개 입력은 좌표가 4 이하라 판정이 전부 ② 로 가고, 좌표가 커지면 ① 이 그 자리를 받는다",
    ].join("\n");
  },

  /** `related` — 반개구간이 꼭짓점을 몇 번 세는가. */
  "related-halfopen": () => {
    const p: Point = [1, 2];
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
    return [
      table(
        [
          "변",
          "앞 끝의 높이",
          "뒤 끝의 높이",
          "앞 끝은",
          "뒤 끝은",
          "반개구간이",
        ],
        rows,
        ["l", "r", "r", "l", "l", "l"],
      ),
      "",
      `질의 점 ${pt(p)} · 높이 2 를 지나는 변 ${num(counted)} 개 · 정본 ${pointInPolygon(p, L)}`,
      "└ 높이가 정확히 2 인 꼭짓점이 (4,2) 와 (2,2) 둘인데도, 「위인가」 하나로 갈라 두면 세어진 변이 둘이다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const cases: [Point, Point, Point][] = [
      [
        [0, 0],
        [4, 0],
        [1, 1],
      ],
      [
        [4, 0],
        [4, 2],
        [1, 1],
      ],
      [
        [2, 2],
        [2, 4],
        [2, 3],
      ],
      [
        [0, 4],
        [0, 0],
        [3, 3],
      ],
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
    return [
      table(["변", "질의 점", "식이 낸 값", "부호", "어느 쪽인가"], rows, [
        "l",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 이 절차가 가져가는 것은 마지막 열뿐이다. 셋째 열의 크기는 어느 갈래에서도 쓰이지 않는다",
    ].join("\n");
  },

  /** `deep.math` ③ — 부등식 유도가 코드의 한 줄과 같은 답을 내는가. */
  "math-side": () => {
    const rows: string[][] = [];
    for (const [name, p] of WALK) {
      for (const [edge, a, b] of edges(L)) {
        if (a[1] > p[1] === b[1] > p[1]) continue;
        const meet = a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
        const d = sideOf(a, b, p);
        const up = b[1] > a[1];
        rows.push([
          name,
          edge,
          `${pt(a)}-${pt(b)}`,
          up ? "위로" : "아래로",
          String(meet),
          String(p[0]),
          String(meet > p[0]),
          String(d > 0 === up),
        ]);
      }
    }
    const rings = ring(12, 1_000);
    let same = 0;
    let total = 0;
    for (const q of scatter(2_000, 1_200)) {
      for (const [, a, b] of edges(rings)) {
        if (a[1] > q[1] === b[1] > q[1]) continue;
        total++;
        const meet = a[0] + ((q[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
        const d = sideOf(a, b, q);
        if (meet > q[0] === (d > 0 === b[1] > a[1])) same++;
      }
    }
    return [
      table(
        [
          "질의",
          "변",
          "두 끝점",
          "가는 방향",
          "교점의 x",
          "질의 점의 x",
          "교점이 오른쪽",
          "부호가 같다",
        ],
        rows,
        ["l", "l", "l", "l", "r", "r", "l", "l"],
      ),
      "",
      "오른쪽 두 열의 값이 모든 줄에서 같다",
      `꼭짓점 ${num(rings.length)} 개 원형 다각형에 질의 2,000 개를 준 대조에서도 ${num(total)} 자리 가운데 ${num(same)} 자리가 같다`,
      "└ 나눗셈으로 낸 왼쪽 열과 곱만으로 낸 오른쪽 열이 같은 답을 낸다",
    ].join("\n");
  },

  /** `deep.math` ④ — 오차 한계에 제약의 좌표 상한을 넣는다. */
  "math-error": () => {
    const rows = [1_000_000, 10_000_000, 23_726_566, 23_726_567, COORD].map(
      (c) => [
        num(c),
        ((c * c) / 2 ** 49).toFixed(9),
        (c * c) / 2 ** 49 < 1 ? "부호를 그대로 믿는다" : "큰 정수로 되잰다",
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
    return [
      table(["좌표 상한 C", "오차 한계 C² / 2^49", "그 상한에서는"], rows, [
        "r",
        "r",
        "l",
      ]),
      "",
      `한계가 1 보다 작은 가장 큰 좌표 상한  ${num(23_726_566)}`,
      `무작위 세 점 300,000 벌에서 잰 실제 최대 편차  ${num(worst)}`,
      `이 절차가 쓰는 하한 SAFE                       ${num(SAFE)}`,
      "└ 실측 편차는 한계보다 한참 작고, SAFE 는 한계보다 큰 2 의 거듭제곱으로 골랐다",
    ].join("\n");
  },

  /** `invariant` ② — 변을 하나씩 볼 때마다 무엇이 참으로 남는가. */
  "invariant-states": () => {
    const polygon = comb(3, 3);
    const p: Point = [-1, 1];
    const rows: string[][] = [];
    let counted = 0;
    let inside = false;
    for (const [name, a, b] of edges(polygon)) {
      const d = sideOf(a, b, p);
      const crosses = a[1] > p[1] !== b[1] > p[1] && d > 0 === b[1] > a[1];
      if (crosses) {
        counted++;
        inside = !inside;
      }
      rows.push([
        name,
        `${pt(a)}-${pt(b)}`,
        crosses ? "넘는다" : "안 넘는다",
        String(counted),
        counted % 2 === 1 ? "홀수" : "짝수",
        String(inside),
      ]);
    }
    return [
      table(
        [
          "변까지 봤을 때",
          "두 끝점",
          "그 변을",
          "여기까지 넘은 수",
          "홀짝",
          "inside",
        ],
        rows,
        ["l", "l", "l", "r", "l", "l"],
      ),
      "",
      `이빨 셋짜리 톱니 ${num(polygon.length)} 변 · 질의 점 ${pt(p)} · 정본 ${pointInPolygon(p, polygon)}`,
      "└ 넘은 수의 홀짝 열과 inside 열이 모든 줄에서 같다",
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
      table(
        [
          "배치",
          "질의 점",
          "꼭짓점",
          "높이를 지나는 변",
          "넘는 변",
          "무엇으로 갈리나",
          "답",
        ],
        rows,
        ["l", "l", "r", "r", "r", "l", "l"],
      ),
      "",
      "└ 여덟 배치 모두 변 위 판정과 홀짝 가운데 정확히 하나가 답을 낸다",
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
    let leftUp = 0;
    for (const [, a, b] of edges(L)) {
      if (b[1] < a[1]) leftUp++;
    }
    return [
      contrast(cases, noDirection.pointInPolygon, "방향 보정을 뺀 답"),
      "",
      `좌표 -8~8 의 질의 점 ${num(points.length)} 개 가운데 ${num(gaps)} 개에서 답이 어긋난다`,
      `L 자 여섯 변 가운데 아래로 가는 변이 ${num(leftUp)} 개다`,
      "└ 아래로 가는 변에서는 판정값이 양수인 쪽이 왼쪽이라, 보정을 빼면 좌우가 뒤바뀐다",
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음을 기본 연산으로 센다. */
  "perf-count": () => {
    const rows = WALK.map(([name, p]) => {
      const r = judge(p, L);
      return [
        name,
        pt(p),
        String(r.seen),
        String(r.slow),
        String(r.boxes),
        String(r.crossed),
        String(r.ops),
      ];
    });
    const total = WALK.reduce((sum, [, p]) => sum + judge(p, L).ops, 0);
    return [
      table(
        [
          "질의",
          "질의 점",
          "본 변",
          "되잰 판정",
          "칸 검사",
          "높이를 지나는 변",
          "기본 연산",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r", "r"],
      ),
      "",
      `세 질의 합계 ${num(total)}`,
      "기본 연산 = 좌표 읽기 + 배정밀도 곱 + 큰 정수 변환 + 큰 정수 곱 + 좌표 비교",
      "└ 변 하나가 8 이고, 되재면 6 이 더 붙고, 칸 검사가 붙으면 4 가 더 붙는다",
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
    const rows = cases.map(([label, p, polygon]) => {
      const r = judge(p, polygon);
      return [
        label,
        String(polygon.length),
        String(r.seen),
        String(r.slow),
        String(r.boxes),
        String(r.crossed),
        String(r.ops),
        (r.ops / polygon.length).toFixed(2),
      ];
    });
    let best = "";
    let bestPer = 0;
    for (const [label, p, polygon] of cases) {
      const per = judge(p, polygon).ops / polygon.length;
      if (per > bestPer) {
        bestPer = per;
        best = label;
      }
    }
    return [
      table(
        [
          "배치",
          "꼭짓점",
          "본 변",
          "되잰 판정",
          "칸 검사",
          "높이를 지나는 변",
          "기본 연산",
          "변 하나당",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `변 하나당 기본 연산이 가장 많은 배치  ${best} (${bestPer.toFixed(2)})`,
      "└ 좌표가 크면 되재기가 사라져 변 하나가 8 로 내려간다. 가장 많이 쓰는 쪽은 되재기에 칸 검사까지 붙는 배치다",
    ].join("\n");
  },
};
