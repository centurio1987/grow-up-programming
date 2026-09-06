/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts closestPairOfPoints-guide.md
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  closestPairOfPoints,
  type Point,
  solve,
} from "./closestPairOfPoints-guide.ref.ts";

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

/** 거리 하나의 표기. 소수 넷째 자리까지 적는다. */
const dist = (x: number): string =>
  Number.isFinite(x) ? x.toFixed(4) : "무한대";

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 점 목록의 표기. 칸 사이는 한 칸이라 표의 한 칸 안에 그대로 들어간다. */
const list = (points: Point[]): string => points.map(pt).join(" ");

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
 * 본문 전개가 쓰는 고정 입력 — 점 여덟 개. 이미 x 오름차순이다.
 *
 * 갈래 다섯을 한 입력으로 전부 실행한다. 재귀가 두 단 내려가고 기저가 넷이며, 답인
 * `(3,1)`·`(5,2)` 가 분할선을 가로지르는 쌍이라 띠 대조가 실제로 값을 바꾼다.
 */
const WALK: Point[] = [
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
const ZIGZAG: Point[] = [
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
function column(n: number): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < n; at++) out.push([0, at]);
  return out;
}

/**
 * 세로줄 위에 y 를 뒤섞어 놓은 배치.
 *
 * `column` 은 y 가 이미 오름차순이라 다시 정렬해도 비교 함수가 `n` 번밖에 안 불린다 —
 * 그 배치로 재면 「다시 정렬하면 로그가 하나 더 붙는다」 가 값으로 안 나온다. 순서를 뒤섞어야
 * 정렬 비용이 실제로 붙는다.
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

/** 좌표 상한. */
const SPREAD = 100_000_000;

/** 한 변이 `SPREAD` 인 정사각형에 흩은 점 `n` 개. 같은 좌표는 걸러 낸다. */
const UNIFORM = new Map<number, Point[]>();

function uniform(n: number): Point[] {
  const hit = UNIFORM.get(n);
  if (hit !== undefined) return hit;
  const next = rng(20_260_906);
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

/** 제약의 점 수 상한과 좌표 절댓값 상한. */
const MAX_N = 100_000;
const COORD = 1_000_000_000;

/** 배정밀도가 정수를 어긋남 없이 담는 한계와, 문제가 허용하는 상대 오차. */
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
const CELL_BOUND = 7;

/* ────────────────────────── 계수 ────────────────────────── */

interface Counted {
  /** 두 점의 제곱 거리를 만든 횟수. */
  dist: number;
  /** 배열 칸 읽기·쓰기를 각각 1 로 센 것. 거리 계산 안의 좌표 읽기 넷을 함께 센다. */
  reads: number;
  /** 입력 밖에 새로 잡는 칸의 총수. */
  cells: number;
}

const zero = (): Counted => ({ dist: 0, reads: 0, cells: 0 });

function squared(a: Point, b: Point, c: Counted): number {
  c.dist++;
  c.reads += 4;
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/** 전부 대조 — 쌍을 하나도 안 거르고 전부 잰다. */
function bruteForce(points: Point[], c: Counted): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      c.reads += 2;
      const d = squared(points[i] as Point, points[j] as Point, c);
      if (d < best) best = d;
    }
  }
  return best;
}

/** 정본과 같은 절차를 세면서 실행한다. 답은 매번 정본과 대조한다. */
function count(points: Point[]): Counted {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const c = zero();
  const run = (span: Point[]): { best: number; byY: Point[] } => {
    const n = span.length;
    if (n <= 3) {
      const byY = [...span].sort((a, b) => a[1] - b[1]);
      c.cells += n;
      c.reads += n;
      return { best: bruteForce(span, c), byY };
    }
    const mid = n >> 1;
    c.reads += 1;
    const splitX = (span[mid] as Point)[0];
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));
    c.cells += n * 3;
    let best = Math.min(left.best, right.best);
    const byY: Point[] = [];
    let i = 0;
    let j = 0;
    while (i < left.byY.length && j < right.byY.length) {
      c.reads += 2;
      if ((left.byY[i] as Point)[1] <= (right.byY[j] as Point)[1]) {
        byY.push(left.byY[i] as Point);
        i++;
      } else {
        byY.push(right.byY[j] as Point);
        j++;
      }
    }
    while (i < left.byY.length) {
      c.reads++;
      byY.push(left.byY[i] as Point);
      i++;
    }
    while (j < right.byY.length) {
      c.reads++;
      byY.push(right.byY[j] as Point);
      j++;
    }
    const strip: Point[] = [];
    for (const p of byY) {
      c.reads++;
      const dx = p[0] - splitX;
      if (dx * dx < best) strip.push(p);
    }
    for (let a = 0; a < strip.length; a++) {
      for (let b = a + 1; b < strip.length; b++) {
        c.reads += 2;
        const dy = (strip[b] as Point)[1] - (strip[a] as Point)[1];
        if (dy * dy >= best) break;
        const d = squared(strip[a] as Point, strip[b] as Point, c);
        if (d < best) best = d;
      }
    }
    return { best, byY };
  };
  const top = run(sorted);
  if (Math.sqrt(top.best) !== closestPairOfPoints(points)) {
    throw new Error("계수용 절차가 정본과 다른 답을 냈다");
  }
  return c;
}

/**
 * 한 걸음의 기록. 전개 표와 비용 표가 같은 기록을 두 모양으로 그린다.
 *
 * 내부 마디는 두 걸음으로 가른다 — 「최솟값과 합치기」와 「띠 고르기와 대조」다. 본문의
 * 소절이 그 둘을 따로 다루므로 걸음도 따로 세야 인용이 맞물린다.
 */
interface Step {
  tag: string;
  what: string;
  span: string;
  before: string;
  after: string;
  branch: string;
  dist: number;
  reads: number;
}

/**
 * 걸음마다 상태를 기록하면서 실행한다. **전개 입력에만 쓴다** — 걸음마다 점 목록을 글자로
 * 만드는 자리라 큰 입력에서는 계수만 세는 `count` 를 쓴다.
 */
function walkSteps(points: Point[]): { steps: Step[]; count: Counted } {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const steps: Step[] = [];
  const total = zero();
  let tag = 0;
  const next = (): string => {
    tag++;
    return `T${tag}`;
  };
  const add = (c: Counted): void => {
    total.dist += c.dist;
    total.reads += c.reads;
    total.cells += c.cells;
  };

  const run = (span: Point[]): { best: number; byY: Point[] } => {
    const n = span.length;
    if (n <= 3) {
      const c = zero();
      const byY = [...span].sort((a, b) => a[1] - b[1]);
      c.cells += n;
      c.reads += n;
      const best = bruteForce(span, c);
      steps.push({
        tag: next(),
        what: "점이 셋 이하라 직접 대조한다",
        span: list(span),
        before: "—",
        after: num(best),
        branch: "①",
        dist: c.dist,
        reads: c.reads,
      });
      add(c);
      return { best, byY };
    }
    const mid = n >> 1;
    const splitX = (span[mid] as Point)[0];
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));

    const merged = zero();
    merged.cells += n * 2;
    merged.reads += 1;
    const opened = Math.min(left.best, right.best);
    const byY: Point[] = [];
    let i = 0;
    let j = 0;
    while (i < left.byY.length && j < right.byY.length) {
      merged.reads += 2;
      if ((left.byY[i] as Point)[1] <= (right.byY[j] as Point)[1]) {
        byY.push(left.byY[i] as Point);
        i++;
      } else {
        byY.push(right.byY[j] as Point);
        j++;
      }
    }
    while (i < left.byY.length) {
      merged.reads++;
      byY.push(left.byY[i] as Point);
      i++;
    }
    while (j < right.byY.length) {
      merged.reads++;
      byY.push(right.byY[j] as Point);
      j++;
    }
    steps.push({
      tag: next(),
      what: `분할선 x = ${splitX} 에서 두 절반의 작은 값을 잡고 합친다`,
      span: list(byY),
      before: `${num(left.best)} · ${num(right.best)}`,
      after: num(opened),
      branch: "② ③",
      dist: merged.dist,
      reads: merged.reads,
    });
    add(merged);

    const scan = zero();
    scan.cells += n;
    let best = opened;
    const strip: Point[] = [];
    for (const p of byY) {
      scan.reads++;
      const dx = p[0] - splitX;
      if (dx * dx < best) strip.push(p);
    }
    for (let a = 0; a < strip.length; a++) {
      for (let b = a + 1; b < strip.length; b++) {
        scan.reads += 2;
        const dy = (strip[b] as Point)[1] - (strip[a] as Point)[1];
        if (dy * dy >= best) break;
        const d = squared(strip[a] as Point, strip[b] as Point, scan);
        if (d < best) best = d;
      }
    }
    steps.push({
      tag: next(),
      what: `분할선 x = ${splitX} 옆 띠에 남은 점만 대조한다`,
      span: list(strip),
      before: num(opened),
      after: num(best),
      branch: "④ ⑤",
      dist: scan.dist,
      reads: scan.reads,
    });
    add(scan);
    return { best, byY };
  };

  const top = run(sorted);
  steps.push({
    tag: next(),
    what: "제곱근을 한 번 부른다",
    span: "—",
    before: num(top.best),
    after: dist(Math.sqrt(top.best)),
    branch: "—",
    dist: 0,
    reads: 0,
  });
  if (Math.sqrt(top.best) !== closestPairOfPoints(points)) {
    throw new Error("걸음 기록용 절차가 정본과 다른 답을 냈다");
  }
  return { steps, count: total };
}

const WALK_RUN = walkSteps(WALK);

/* ────────────────── 다른 경로로 잰 값 ────────────────── */

/**
 * 반으로 가르되 **교차 쌍을 전부 대조하는** 판. `deep.build` ③④ 가 재는 기준선이다.
 *
 * 거르는 장치를 하나도 안 넣는다 — 나누는 것만으로는 대조가 안 줄어든다는 것을 보이는
 * 자리라서, 띠도 세로 거리 조건도 없다.
 */
function splitOnly(points: Point[]): { best: number; dist: number } {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const c = zero();
  const run = (span: Point[]): number => {
    if (span.length <= 3) return bruteForce(span, c);
    const mid = span.length >> 1;
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));
    let best = Math.min(left, right);
    for (let i = 0; i < mid; i++) {
      for (let j = mid; j < span.length; j++) {
        const d = squared(span[i] as Point, span[j] as Point, c);
        if (d < best) best = d;
      }
    }
    return best;
  };
  const best = run(sorted);
  if (Math.sqrt(best) !== closestPairOfPoints(points)) {
    throw new Error("나누기만 한 판이 정본과 다른 답을 냈다");
  }
  return { best, dist: c.dist };
}

/**
 * 띠의 폭을 정본의 `factor` 배로 잡은 판. `factor` 가 1 이면 정본과 같은 절차다.
 *
 * 폭이 좁으면 답이 갈리고, 넓으면 답은 같은데 대조가 는다. `deep.build` ⑥ 이 그 둘을 한
 * 표에 놓는다.
 */
function withWidth(
  points: Point[],
  factor: number,
): { best: number; dist: number } {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const c = zero();
  const scale = factor * factor;
  const run = (span: Point[]): { best: number; byY: Point[] } => {
    const n = span.length;
    if (n <= 3) {
      const byY = [...span].sort((a, b) => a[1] - b[1]);
      return { best: bruteForce(span, c), byY };
    }
    const mid = n >> 1;
    const splitX = (span[mid] as Point)[0];
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));
    let best = Math.min(left.best, right.best);
    const byY = [...left.byY, ...right.byY].sort((a, b) => a[1] - b[1]);
    const opened = best * scale;
    const strip = byY.filter((p) => {
      const dx = p[0] - splitX;
      return dx * dx < opened;
    });
    for (let a = 0; a < strip.length; a++) {
      for (let b = a + 1; b < strip.length; b++) {
        const dy = (strip[b] as Point)[1] - (strip[a] as Point)[1];
        if (dy * dy >= best * scale) break;
        const d = squared(strip[a] as Point, strip[b] as Point, c);
        if (d < best) best = d;
      }
    }
    return { best, byY };
  };
  return { best: run(sorted).best, dist: c.dist };
}

/**
 * 매 단계 다시 정렬하는 판과 합치기만 하는 판의 **견주기 횟수**.
 *
 * 다시 정렬하는 쪽은 그 구간의 목록을 `sort` 에 넘기고 비교 함수가 불린 횟수를 센다.
 * 합치는 쪽은 두 목록을 앞에서부터 맞대며 센다. 둘 다 y 오름차순 목록을 만드는 일이라
 * 세는 대상이 같다.
 */
function orderingCost(points: Point[]): { resort: number; merge: number } {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  let resort = 0;
  let merge = 0;
  const run = (span: Point[]): Point[] => {
    const n = span.length;
    if (n <= 3) {
      return [...span].sort((a, b) => {
        resort++;
        merge++;
        return a[1] - b[1];
      });
    }
    const mid = n >> 1;
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));
    [...span].sort((a, b) => {
      resort++;
      return a[1] - b[1];
    });
    const out: Point[] = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      merge++;
      if ((left[i] as Point)[1] <= (right[j] as Point)[1]) {
        out.push(left[i] as Point);
        i++;
      } else {
        out.push(right[j] as Point);
        j++;
      }
    }
    while (i < left.length) {
      out.push(left[i] as Point);
      i++;
    }
    while (j < right.length) {
      out.push(right[j] as Point);
      j++;
    }
    return out;
  };
  run(sorted);
  return { resort, merge };
}

/** 띠에서 한 점 뒤로 실제로 몇 개를 봤는가. 칸 논증이 낸 상한과 견주는 자리다. */
function scanPeak(points: Point[]): { peak: number; strip: number } {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  let peak = 0;
  let strip = 0;
  const c = zero();
  const run = (span: Point[]): { best: number; byY: Point[] } => {
    const n = span.length;
    if (n <= 3) {
      return {
        best: bruteForce(span, c),
        byY: [...span].sort((a, b) => a[1] - b[1]),
      };
    }
    const mid = n >> 1;
    const splitX = (span[mid] as Point)[0];
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));
    let best = Math.min(left.best, right.best);
    const byY = [...left.byY, ...right.byY].sort((a, b) => a[1] - b[1]);
    const band: Point[] = [];
    for (const p of byY) {
      const dx = p[0] - splitX;
      if (dx * dx < best) band.push(p);
    }
    strip = Math.max(strip, band.length);
    for (let a = 0; a < band.length; a++) {
      let seen = 0;
      for (let b = a + 1; b < band.length; b++) {
        const dy = (band[b] as Point)[1] - (band[a] as Point)[1];
        if (dy * dy >= best) break;
        seen++;
        const d = squared(band[a] as Point, band[b] as Point, c);
        if (d < best) best = d;
      }
      peak = Math.max(peak, seen);
    }
    return { best, byY };
  };
  run(sorted);
  return { peak, strip };
}

/** 끊는 줄을 뺀 판의 거리 계산 횟수. 정본과 같은 절차에 세는 자리만 덧붙였다. */
function countNoBreak(points: Point[]): number {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const c = zero();
  const run = (span: Point[]): { best: number; byY: Point[] } => {
    const n = span.length;
    if (n <= 3) {
      return {
        best: bruteForce(span, c),
        byY: [...span].sort((a, b) => a[1] - b[1]),
      };
    }
    const mid = n >> 1;
    const splitX = (span[mid] as Point)[0];
    const left = run(span.slice(0, mid));
    const right = run(span.slice(mid));
    let best = Math.min(left.best, right.best);
    const byY = [...left.byY, ...right.byY].sort((a, b) => a[1] - b[1]);
    const band: Point[] = [];
    for (const p of byY) {
      const dx = p[0] - splitX;
      if (dx * dx < best) band.push(p);
    }
    for (let a = 0; a < band.length; a++) {
      for (let b = a + 1; b < band.length; b++) {
        const d = squared(band[a] as Point, band[b] as Point, c);
        if (d < best) best = d;
      }
    }
    return { best, byY };
  };
  const best = run(sorted).best;
  if (Math.sqrt(best) !== closestPairOfPoints(points)) {
    throw new Error("끊는 줄을 뺀 판이 정본과 다른 답을 냈다");
  }
  return c.dist;
}

/** 맨 위 단계의 띠를 두 순서로 뽑아 무엇이 갈리는지 낸다. */
function topStrip(
  points: Point[],
  order: "byY" | "byX",
): { strip: Point[]; pairs: number; best: number } {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const n = sorted.length;
  const mid = n >> 1;
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

/** 기저 구간 하나가 올려 보내는 목록. `sorted` 면 y 오름차순, 아니면 x 오름차순 그대로다. */
function baseLists(points: Point[], sortByY: boolean): string {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const mid = sorted.length >> 1;
  const halves = [sorted.slice(0, mid >> 1), sorted.slice(mid >> 1, mid)];
  return halves
    .map((half) => list(sortByY ? [...half].sort((a, b) => a[1] - b[1]) : half))
    .join(" · ");
}

/** 오른쪽 절반의 두 기저가 올려 보내는 목록. */
function rightBaseLists(points: Point[], sortByY: boolean): string {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const mid = sorted.length >> 1;
  const half = sorted.slice(mid);
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

/** 띠를 x 오름차순 목록에서 뽑는 사본. 띠의 순서가 y 오름차순이 아니게 된다. */
const stripFromX = await loadMutant<Impl>(REF, {
  swap: [STRIP_LINE, "  for (const p of pts) {"],
});

/** 세로 거리로 끊는 줄을 뺀 사본. 답은 그대로이고 대조 횟수만 는다. */
const noBreak = await loadMutant<Impl>(REF, { drop: BREAK_LINE });

/** 기저에서 y 오름차순을 안 만드는 사본. 위 단계의 합치기가 전제를 잃는다. */
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
    ["띠를 x 오름차순에서 뽑는 판", stripFromX],
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

/** 정본과 변이의 답을 나란히 놓은 표. */
function contrast(
  cases: [string, Point[]][],
  impl: Impl,
  head: string,
): string {
  const rows = cases.map(([label, points]) => {
    const want = closestPairOfPoints(points);
    const got = impl.closestPairOfPoints(points);
    return [
      label,
      num(points.length),
      dist(want),
      dist(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  return table(["배치", "점", "정본", head, "대조"], rows, [
    "l",
    "r",
    "r",
    "r",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 배치마다 답과 대조 횟수. 전부 대조와 이 절차를 나란히 놓는다. */
  "concept-cases": () => {
    const cases: [string, Point[]][] = [
      ["점 둘", PAIR],
      ["같은 좌표 둘 · 점 넷", SAME],
      ["분할선을 가로지르는 답", CROSS],
      ["전개 입력", WALK],
      ["한 가로줄 위 64 점", row(64)],
      ["한 세로줄 위 64 점", column(64)],
      ["8 × 8 격자", lattice(8)],
    ];
    const rows = cases.map(([label, points]) => {
      const c = zero();
      const brute = bruteForce(points, c);
      return [
        label,
        num(points.length),
        dist(Math.sqrt(brute)),
        num(c.dist),
        num(count(points).dist),
      ];
    });
    return [
      table(
        ["배치", "점", "가장 가까운 두 점의 거리", "전부 대조", "이 절차"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "일곱 배치 모두 두 절차의 답이 같다. 갈리는 것은 거리 계산을 몇 번 했는가다",
      "└ 아래 세 줄에서 차이가 벌어진다 — 점이 늘수록 전부 대조만 제곱으로 커진다",
    ].join("\n");
  },

  /** `concept` — 점을 4 배로 하면 두 절차의 거리 계산이 각각 몇 배가 되는가. */
  "concept-growth": () => {
    const sizes = [64, 256, 1_024, 4_096];
    const pairsAt = (n: number): number => (n * (n - 1)) / 2;
    const mineAt = new Map(sizes.map((n) => [n, count(uniform(n)).dist]));
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
      table(["점", "쌍의 수", "이 절차의 거리 계산"], rows, ["r", "r", "r"]),
      "",
      table(["점을 4 배로", "쌍의 수 성장률", "이 절차의 성장률"], growRows, [
        "l",
        "r",
        "r",
      ]),
      "",
      `제약의 점 수 ${num(MAX_N)} 에서 쌍의 수  ${num(pairsAt(MAX_N))}`,
      "└ 쌍의 수는 4 배마다 16 배 언저리이고 이 절차는 4 배 언저리다",
    ].join("\n");
  },

  /** `deep.build` ② — 전부 대조가 제약 규모에서 몇 번의 거리 계산이 되는가. */
  "build-brute": () => {
    const sizes = [8, 1_000, 10_000, MAX_N];
    const rows = sizes.map((n) => {
      const pairs = (n * (n - 1)) / 2;
      return [num(n), num(pairs), pairs.toExponential(2)];
    });
    const c = zero();
    bruteForce(WALK, c);
    return [
      table(["점", "쌍의 수", "지수로 적으면"], rows, ["r", "r", "r"]),
      "",
      `전개 입력 여덟 점을 실제로 전부 대조하면  거리 계산 ${num(c.dist)} · 자료 접근 ${num(c.reads)}`,
      `└ 제약의 상한에서 거리 계산이 ${((MAX_N * (MAX_N - 1)) / 2).toExponential(2)} 번이다. 1 초 안에 못 끝낸다`,
      "└ 쌍의 수는 점 수의 제곱에 비례한다. 점을 4 배로 하면 대조가 16 배다",
    ].join("\n");
  },

  /** `deep.build` ③ — x 오름차순으로 가르기만 하면 대조가 안 줄어든다. */
  "build-split": () => {
    const n = WALK.length;
    const mid = n >> 1;
    const inner = 2 * ((mid * (mid - 1)) / 2);
    const cross = mid * (n - mid);
    const rows = [
      ["전부 대조", num((n * (n - 1)) / 2)],
      ["왼쪽 넷 안쪽 + 오른쪽 넷 안쪽", num(inner)],
      ["두 절반을 가로지르는 쌍", num(cross)],
      ["가른 뒤의 합", num(inner + cross)],
    ];
    const scale: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["균등 64 점", uniform(64)],
      ["균등 256 점", uniform(256)],
      ["균등 1024 점", uniform(1_024)],
    ];
    const scaleRows = scale.map(([label, points]) => {
      const c = zero();
      bruteForce(points, c);
      return [
        label,
        num(points.length),
        num(c.dist),
        num(splitOnly(points).dist),
      ];
    });
    return [
      table(["무엇을 세는가", "쌍"], rows, ["l", "r"]),
      "",
      table(
        ["배치", "점", "전부 대조", "끝까지 가르되 교차 쌍은 전부 대조"],
        scaleRows,
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 한 단만 가르면 합이 그대로다. 끝까지 재귀로 갈라도 네 배치 모두 값이 글자 그대로 같다",
      "└ 쌍 하나가 정확히 한 단계에서만 교차 쌍이 되기 때문이다. 나누는 것 자체는 아무것도 안 지운다",
    ].join("\n");
  },

  /** `deep.build` ④ — 교차 쌍을 다루는 두 방식의 거리 계산. */
  "build-cross": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["균등 64 점", uniform(64)],
      ["균등 256 점", uniform(256)],
      ["균등 1024 점", uniform(1_024)],
      ["균등 4096 점", uniform(4_096)],
    ];
    const rows = cases.map(([label, points]) => {
      const all = splitOnly(points).dist;
      const mine = count(points).dist;
      return [
        label,
        num(points.length),
        num(all),
        num(mine),
        (all / mine).toFixed(1),
      ];
    });
    return [
      table(
        ["배치", "점", "교차 쌍을 전부 대조", "띠에 남은 점만 대조", "몇 배"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 두 방식의 답은 모든 줄에서 같다. 갈리는 것은 거리 계산 횟수뿐이다",
      "└ 점이 늘수록 배수가 커진다 — 앞엣것만 점 수의 제곱을 따라간다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 전개 입력의 맨 위 단계에서 띠가 무엇을 남기는가. */
  "build-window": () => {
    const sorted = [...WALK].sort((a, b) => a[0] - b[0]);
    const mid = sorted.length >> 1;
    const splitX = (sorted[mid] as Point)[0];
    const left = solve(sorted.slice(0, mid));
    const right = solve(sorted.slice(mid));
    const opened = Math.min(left.best, right.best);
    const byY = [...left.byY, ...right.byY].sort((a, b) => a[1] - b[1]);
    const rows = byY.map((p) => {
      const dx = p[0] - splitX;
      return [
        pt(p),
        String(p[1]),
        num(dx * dx),
        dx * dx < opened ? "남는다" : "빠진다",
      ];
    });
    const kept = topStrip(WALK, "byY");
    return [
      table(["점", "y", "분할선에서 가로 거리의 제곱", "띠에"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `분할선 x = ${splitX} · 이 단계에 들어온 best ${num(opened)} · 띠에 남은 점 ${list(kept.strip)}`,
      `└ 여덟 점 중 ${num(byY.length - kept.strip.length)} 개가 빠진다. 남은 넷만 대조해 best 가 ${num(kept.best)} 로 줄어든다`,
      "└ 목록이 이미 y 오름차순이라 띠도 y 오름차순이다. 다시 정렬할 것이 없다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 띠에서 한 점 뒤로 실제로 몇 개를 보는가. */
  "build-scan": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["균등 1024 점", uniform(1_024)],
      ["균등 4096 점", uniform(4_096)],
      ["한 세로줄 위 1024 점", column(1_024)],
      ["한 가로줄 위 1024 점", row(1_024)],
      ["32 × 32 격자", lattice(32)],
    ];
    const rows = cases.map(([label, points]) => {
      const { peak, strip } = scanPeak(points);
      return [label, num(points.length), num(strip), num(peak)];
    });
    return [
      table(
        ["배치", "점", "가장 큰 띠의 점 수", "한 점 뒤로 본 최대 개수"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `칸 논증이 내는 상한  ${num(CELL_BOUND)}`,
      "└ 띠에는 점이 수백 개까지 쌓이는데 한 점이 보는 개수는 여섯 배치 모두 한 자리다",
      "└ 실측 최댓값이 상한보다 작다. 상한은 도달을 약속하지 않는다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 띠의 폭을 배수로 바꿔 답과 대조 횟수를 함께 본다. */
  "build-width": () => {
    const factors = [0.5, 1, 2, 4];
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["지그재그 여덟 점", ZIGZAG],
      ["8 × 8 격자", lattice(8)],
      ["균등 1024 점", uniform(1_024)],
    ];
    const rows: string[][] = [];
    let wrong = 0;
    for (const [label, points] of cases) {
      const want = closestPairOfPoints(points);
      for (const factor of factors) {
        const got = withWidth(points, factor);
        const ok = Math.sqrt(got.best) === want;
        if (!ok && factor === 0.5) wrong++;
        rows.push([
          label,
          factor.toString(),
          dist(Math.sqrt(got.best)),
          num(got.dist),
          ok ? "맞다" : "틀리다",
        ]);
      }
    }
    return [
      table(["배치", "폭 배수", "답", "거리 계산", "정본과"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `배수 0.5 로 틀린 답이 나온 배치  ${num(cases.length)} 개 중 ${num(wrong)} 개`,
      "└ 나머지 배치에서 맞은 것은 그 입력에 놓칠 쌍이 없었다는 뜻이지 폭을 좁혀도 된다는 근거가 아니다",
      "└ 배수 1 부터는 네 배치 모두 답이 같고, 배수를 키우면 거리 계산만 는다",
      "└ 놓치지 않는 가장 좁은 폭이 배수 1 이다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 매 단계 다시 정렬하는 판과 합치기만 하는 판의 견주기 횟수. */
  "build-merge": () => {
    const sizes = [1_024, 4_096, 16_384, 65_536];
    const ratios: number[][] = [];
    const rows = sizes.map((n) => {
      const { resort, merge } = orderingCost(shuffledColumn(n));
      const ideal = n * Math.log2(n);
      ratios.push([resort / ideal, merge / ideal]);
      return [
        num(n),
        num(resort),
        num(merge),
        (resort / ideal).toFixed(2),
        (merge / ideal).toFixed(2),
      ];
    });
    const first = ratios[0] as number[];
    const last = ratios[ratios.length - 1] as number[];
    return [
      table(
        [
          "점",
          "다시 정렬한 판의 견주기",
          "합치기만 한 판의 견주기",
          "앞엣것 ÷ n log₂ n",
          "뒤엣것 ÷ n log₂ n",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      "한 세로줄 위에 y 를 뒤섞어 놓은 배치를 쓴다. 띠가 구간 전체라 두 방식이 같은 목록을 다룬다",
      `왼쪽 비율은 ${(first[0] as number).toFixed(2)} 에서 ${(last[0] as number).toFixed(2)} 까지 커지고 오른쪽 비율은 ${(first[1] as number).toFixed(2)} 에서 ${(last[1] as number).toFixed(2)} 사이에 머문다`,
      "└ 다시 정렬하면 로그가 하나 더 붙는다. 합치기는 안 붙는다",
    ].join("\n");
  },

  /** `deep.walk.step` 1 — 기저 네 벌의 값. */
  "walk-base": () => {
    const bases = WALK_RUN.steps.filter((s) => s.branch === "①");
    const rows = bases.map((s) => [
      s.tag,
      num(s.span.split(" ").length),
      s.span,
      s.after,
      num(s.dist),
    ]);
    return [
      table(["걸음", "점", "구간", "그 구간의 best", "거리 계산"], rows, [
        "l",
        "r",
        "l",
        "r",
        "r",
      ]),
      "",
      "네 구간 모두 점이 둘이라 쌍 하나씩만 대조한다",
      "└ best 는 거리의 제곱이다. 제곱근은 맨 마지막에 한 번만 부른다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 두 절반 중 왼쪽 결과만 쓰면. */
  "pause-min": () => {
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
    return [
      contrast(cases, onlyLeft, "왼쪽 결과만 쓴 답"),
      "",
      table(
        ["배치", "왼쪽 절반의 best", "오른쪽 절반의 best", "작은 쪽"],
        [
          halves(["전개 입력", WALK]),
          halves(["같은 좌표 둘 · 점 넷", SAME]),
          halves(["오른쪽 끝에 답", RIGHT_END]),
        ],
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 위 두 줄은 왼쪽 절반이 이미 더 작은 값을 내서 오른쪽을 안 받아도 답이 그대로다",
      "└ 셋째 줄은 답이 오른쪽 절반 안에 있다. 그 값을 안 받으면 띠의 폭부터 틀린다",
    ].join("\n");
  },

  /** `deep.walk.step` 2 — 합치기가 만드는 y 오름차순 목록. */
  "walk-merge": () => {
    const merges = WALK_RUN.steps.filter((s) => s.branch === "② ③");
    const rows = merges.map((s) => [
      s.tag,
      s.before,
      s.after,
      s.span,
      num(s.reads),
    ]);
    return [
      table(
        [
          "걸음",
          "두 절반의 best",
          "작은 쪽",
          "합친 y 오름차순 목록",
          "자료 접근",
        ],
        rows,
        ["l", "r", "r", "l", "r"],
      ),
      "",
      "└ 세 걸음 모두 두 목록을 앞에서부터 맞대기만 한다. 다시 정렬하는 자리가 없다",
      "└ 마지막 걸음의 목록이 여덟 점 전부를 y 오름차순으로 담는다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 띠를 x 오름차순 목록에서 뽑으면. */
  "pause-strip": () => {
    const cases: [string, Point[]][] = [
      ["분할선을 가로지르는 답", CROSS],
      ["같은 좌표 둘 · 점 넷", SAME],
      ["전개 입력", WALK],
    ];
    const byY = topStrip(WALK, "byY");
    const byX = topStrip(WALK, "byX");
    return [
      contrast(cases, stripFromX, "x 오름차순에서 뽑은 답"),
      "",
      table(
        ["전개 입력의 맨 위 단계", "띠에 남은 점", "본 쌍", "낸 best"],
        [
          [
            "y 오름차순에서 뽑는다",
            list(byY.strip),
            num(byY.pairs),
            num(byY.best),
          ],
          [
            "x 오름차순에서 뽑는다",
            list(byX.strip),
            num(byX.pairs),
            num(byX.best),
          ],
        ],
        ["l", "l", "r", "r"],
      ),
      "",
      "└ 두 목록은 같은 네 점인데 순서가 다르다. 세로 거리로 끊는 조건이 순서를 전제한다",
      "└ 둘째 줄은 세로 거리가 먼저 벌어져 바로 끊기고, 답인 두 점을 못 본다",
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 띠 고르기와 그 안의 대조. */
  "walk-strip": () => {
    const scans = WALK_RUN.steps.filter((s) => s.branch === "④ ⑤");
    const rows = scans.map((s) => [
      s.tag,
      num(s.span.split(" ").length),
      s.span,
      s.before,
      s.after,
      num(s.dist),
    ]);
    return [
      table(
        [
          "걸음",
          "점",
          "띠에 남은 점",
          "들어올 때 best",
          "나갈 때 best",
          "거리 계산",
        ],
        rows,
        ["l", "r", "l", "r", "r", "r"],
      ),
      "",
      "└ 세 걸음 중 마지막에서만 best 가 줄어든다. 답인 두 점이 그 띠 안에 있다",
      "└ 앞의 두 걸음도 헛일이 아니다 — 그 단계의 best 가 위 단계의 띠 폭을 정한다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 세로 거리로 끊는 줄을 빼면. */
  "pause-break": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["지그재그 여덟 점", ZIGZAG],
      ["한 세로줄 위 1024 점", column(1_024)],
      ["균등 1024 점", uniform(1_024)],
    ];
    return [
      contrast(cases, noBreak, "끊는 줄을 뺀 답"),
      "",
      "└ 네 배치 모두 답이 같다. 이 변이는 답을 안 바꾼다",
      "└ 갈리는 것은 거리 계산 횟수이고, 그 값은 아래 표에 있다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 끊는 줄을 뺐을 때 거리 계산이 얼마나 늘어나는가. */
  "pause-break-cost": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["균등 1024 점", uniform(1_024)],
      ["한 세로줄 위 1024 점", column(1_024)],
      ["한 세로줄 위 4096 점", column(4_096)],
    ];
    const rows = cases.map(([label, points]) => {
      const mine = count(points).dist;
      const open = countNoBreak(points);
      return [
        label,
        num(points.length),
        num(mine),
        num(open),
        (open / mine).toFixed(1),
      ];
    });
    return [
      table(
        ["배치", "점", "정본의 거리 계산", "끊는 줄을 뺀 판", "몇 배"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 한 세로줄 배치에서 점을 4 배로 하면 끊는 줄을 뺀 판의 거리 계산이 16 배 언저리로 는다",
      "└ 정본은 같은 배치에서 4 배 언저리에 머문다",
    ].join("\n");
  },

  /** `deep.walk.step` 4 — 열한 걸음 전체. */
  "walk-trace": () => {
    const rows = WALK_RUN.steps.map((s) => [
      s.tag,
      s.what,
      s.before,
      s.after,
      s.branch,
    ]);
    return [
      table(["걸음", "무엇을 하는가", "들어올 때", "나갈 때", "갈래"], rows, [
        "l",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `걸음 ${num(WALK_RUN.steps.length)} 개 · 거리 계산 ${num(WALK_RUN.count.dist)} · 자료 접근 ${num(WALK_RUN.count.reads)} · 답 ${dist(closestPairOfPoints(WALK))}`,
      "└ 갈래 다섯이 모두 실행된다. ① 은 기저 넷에서, ②③ 은 합치는 세 걸음에서, ④⑤ 는 띠를 보는 세 걸음에서다",
      "└ 마지막 걸음만 거리 계산을 하지 않는다. 제곱근을 한 번 부르고 끝난다",
    ].join("\n");
  },

  /** `related` — 직사각형 하나에 점이 최대 몇 개인가. */
  "related-pigeon": () => {
    const cases: [string, Point[]][] = [
      ["균등 1024 점", uniform(1_024)],
      ["균등 4096 점", uniform(4_096)],
      ["한 세로줄 위 1024 점", column(1_024)],
      ["32 × 32 격자", lattice(32)],
      ["지그재그 여덟 점", ZIGZAG],
    ];
    const rows = cases.map(([label, points]) => {
      const { peak } = scanPeak(points);
      return [
        label,
        num(points.length),
        num(peak),
        num(peak + 1),
        num(CELL_BOUND + 1),
      ];
    });
    return [
      table(
        ["배치", "점", "한 점 뒤로 본 개수", "자기까지 세면", "칸 논증의 상한"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `왼쪽 반 칸 넷과 오른쪽 반 칸 넷을 더해 ${num(CELL_BOUND + 1)} 이고, 자기를 빼면 ${num(CELL_BOUND)} 이다`,
      "└ 다섯 배치 모두 상한 아래에 있다. 상한은 「이보다 많을 수 없다」만 말한다",
    ].join("\n");
  },

  /** `deep.math` — 정의를 작은 값에 넣어 손으로 계산한다. */
  "math-check": () => {
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
        `${pt(a)}-${pt(b)}`,
        String(dx),
        String(dy),
        String(dx * dx),
        String(dy * dy),
        String(dx * dx + dy * dy),
        dist(Math.sqrt(dx * dx + dy * dy)),
      ];
    });
    const best = solve([...WALK].sort((a, b) => a[0] - b[0])).best;
    return [
      table(
        [
          "두 점",
          "가로 차",
          "세로 차",
          "가로 차의 제곱",
          "세로 차의 제곱",
          "합",
          "제곱근",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `여덟 점 전체의 답 ${dist(closestPairOfPoints(WALK))} 이고 그 제곱이 ${num(best)} 이다`,
      "└ 둘째 줄이 그 답이다. 정수 좌표에서는 합까지가 정수이고 제곱근에서만 소수가 붙는다",
    ].join("\n");
  },

  /** `deep.math` — 닫힌 형태에 제약 규모를 넣어 수치를 낸다. */
  "math-count": () => {
    const rows = [8, 1_024, 4_096, MAX_N].map((n) => [
      num(n),
      num(Math.ceil(Math.log2(n / 3))),
      num((n * (n - 1)) / 2),
      num(Math.round(CELL_BOUND * n * Math.log2(n))),
    ]);
    const measured: [string, Point[]][] = [
      ["균등 1024 점", uniform(1_024)],
      ["균등 4096 점", uniform(4_096)],
      ["한 세로줄 위 1024 점", column(1_024)],
    ];
    const measuredRows = measured.map(([label, points]) => {
      const n = points.length;
      return [
        label,
        num(Math.round(CELL_BOUND * n * Math.log2(n))),
        num(count(points).dist),
      ];
    });
    return [
      table(
        ["점", "재귀 깊이", "전부 대조의 거리 계산", "이 절차의 상한"],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      table(["배치", "상한", "실제 거리 계산"], measuredRows, ["l", "r", "r"]),
      "",
      `└ 제약 규모에서 이 절차의 상한이 전부 대조의 ${((MAX_N * (MAX_N - 1)) / 2 / (CELL_BOUND * MAX_N * Math.log2(MAX_N))).toFixed(0)} 분의 1 이다`,
      "└ 그 상한도 실제보다 넉넉하다. 한 점이 보는 개수가 7 에 도달하지 않기 때문이다",
    ].join("\n");
  },

  /** `invariant` — 구간마다 목록이 y 오름차순이고 best 가 그 구간의 답인가. */
  "invariant-states": () => {
    const sorted = [...WALK].sort((a, b) => a[0] - b[0]);
    const rows: string[][] = [];
    const visit = (span: Point[], name: string): void => {
      const out = solve(span);
      const c = zero();
      const alone = bruteForce(span, c);
      const rising = out.byY.every(
        (p, at) => at === 0 || (out.byY[at - 1] as Point)[1] <= p[1],
      );
      rows.push([
        name,
        num(span.length),
        num(out.best),
        num(alone),
        rising ? "예" : "아니오",
        out.best === alone ? "같다" : "어긋난다",
      ]);
    };
    visit(sorted.slice(0, 2), "왼쪽의 왼쪽");
    visit(sorted.slice(2, 4), "왼쪽의 오른쪽");
    visit(sorted.slice(0, 4), "왼쪽 절반");
    visit(sorted.slice(4, 6), "오른쪽의 왼쪽");
    visit(sorted.slice(6, 8), "오른쪽의 오른쪽");
    visit(sorted.slice(4, 8), "오른쪽 절반");
    visit(sorted, "여덟 점 전부");
    return [
      table(
        [
          "구간",
          "점",
          "올려 보낸 best",
          "그 구간만 전부 대조",
          "목록이 y 오름차순",
          "대조",
        ],
        rows,
        ["l", "r", "r", "r", "l", "l"],
      ),
      "",
      "└ 일곱 구간 모두 두 값이 같고 목록이 y 오름차순이다",
      "└ 오른쪽에서 셋째 열은 재귀를 안 쓰고 그 구간만 전부 대조한 값이다. 다른 경로로 잰 값이다",
    ].join("\n");
  },

  /** `invariant` — 경계 배치에서도 같은 두 값이 맞물리는가. */
  "invariant-edges": () => {
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
      ["좌표 상한 네 점", huge],
    ];
    const rows = cases.map(([label, points]) => {
      const sorted = [...points].sort((a, b) => a[0] - b[0]);
      const out = solve(sorted);
      const c = zero();
      const alone = bruteForce(points, c);
      const rising = out.byY.every(
        (p, at) => at === 0 || (out.byY[at - 1] as Point)[1] <= p[1],
      );
      return [
        label,
        num(points.length),
        num(out.best),
        num(alone),
        rising ? "예" : "아니오",
        out.best === alone ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        [
          "배치",
          "점",
          "올려 보낸 best",
          "전부 대조",
          "목록이 y 오름차순",
          "대조",
        ],
        rows,
        ["l", "r", "r", "r", "l", "l"],
      ),
      "",
      "└ 일곱 배치 모두 두 값이 같다. 같은 좌표의 점이 있으면 best 가 0 이고 띠가 통째로 빈다",
      "└ 좌표 상한 줄에서 가장 먼 두 점의 제곱합은 배정밀도의 정수 한계를 넘는데, 답인 쌍의 제곱합 1 은 정확하다",
    ].join("\n");
  },

  /** `invariant` — 좌표가 상한에 붙으면 제곱 거리가 배정밀도의 정수 범위를 넘는다. */
  "edge-precision": () => {
    /** 제곱 거리가 정수로 정확히 담기는 마지막 좌표 상한. */
    let low = 1;
    let high = COORD;
    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      if (8 * mid * mid <= EXACT) low = mid;
      else high = mid;
    }
    /** 상한 근처에서 배정밀도가 참값을 못 담는 첫 자리. */
    let off: [number, number] | null = null;
    for (let a = 0; a < 64 && off === null; a++) {
      for (let b = 0; b < 64; b++) {
        const dx = 2 * COORD - a;
        const dy = 2 * COORD - b;
        if (BigInt(dx * dx + dy * dy) !== exactSquare(dx, dy)) {
          off = [dx, dy];
          break;
        }
      }
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
    if (off === null || clash === null) {
      throw new Error("좌표 상한에서 어긋나는 자리를 못 찾았다");
    }
    const [ox, oy] = off;
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
    return [
      table(
        ["가로 차", "세로 차", "배정밀도가 담은 제곱 거리", "참값", "차"],
        [
          [
            num(ox),
            num(oy),
            num(ox * ox + oy * oy),
            bignum(exactSquare(ox, oy)),
            bignum(BigInt(ox * ox + oy * oy) - exactSquare(ox, oy)),
          ],
        ],
        ["r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["어떤 값", "얼마"],
        [
          ["제곱 거리가 정수로 정확히 담기는 마지막 좌표 상한", num(low)],
          ["배정밀도가 정수를 어긋남 없이 담는 한계", num(EXACT)],
          ["제약의 좌표 상한에서 제곱 거리의 최댓값", num(8 * COORD * COORD)],
          [
            "그 값 언저리에서 배정밀도가 담는 정수의 간격",
            num(2 ** (Math.floor(Math.log2(8 * COORD * COORD)) - 52)),
          ],
        ],
        ["l", "r"],
      ),
      "",
      table(
        [
          "참값이 다른데 배정밀도로 같아지는 두 자리",
          "가로 차",
          "세로 차",
          "참값",
        ],
        [
          ["첫째", num(ax), num(ay), bignum(first)],
          ["둘째", num(bx), num(by), bignum(second)],
        ],
        ["l", "r", "r", "r"],
      ),
      "",
      `둘 다 배정밀도로는 ${num(seen)} 이라 어느 쪽이 가까운지 못 가른다`,
      `두 거리의 차 ${Math.abs(gap).toExponential(2)} · 상대 차 ${(Math.abs(gap) / near).toExponential(2)} · 문제가 허용하는 상대 오차 ${TOLERANCE.toExponential(0)}`,
      "└ 고르는 쌍이 갈릴 수는 있어도, 답으로 나가는 값은 허용 오차 안에 남는다",
    ].join("\n");
  },

  /** `invariant` — 기저에서 y 오름차순을 안 만들면. */
  "mutant-unsorted": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["분할선을 가로지르는 답", CROSS],
      ["지그재그 여덟 점", ZIGZAG],
    ];
    return [
      contrast(cases, noBaseSort, "기저의 y 정렬을 뺀 답"),
      "",
      table(
        ["지그재그의 왼쪽 절반", "기저 둘이 올려 보내는 목록"],
        [
          ["정본", baseLists(ZIGZAG, true)],
          ["y 정렬을 뺀 판", baseLists(ZIGZAG, false)],
        ],
        ["l", "l"],
      ),
      "",
      table(
        ["지그재그의 오른쪽 절반", "기저 둘이 올려 보내는 목록"],
        [
          ["정본", rightBaseLists(ZIGZAG, true)],
          ["y 정렬을 뺀 판", rightBaseLists(ZIGZAG, false)],
        ],
        ["l", "l"],
      ),
      "",
      "└ 왼쪽 절반은 x 순서와 y 순서가 같아서 두 판의 목록이 글자 그대로 같다",
      "└ 오른쪽 절반은 첫 기저에서 두 순서가 어긋난다. 그 목록을 받은 합치기가 y 오름차순을 못 만든다",
    ].join("\n");
  },

  /** `perf.derive` — 걸음마다의 거리 계산과 자료 접근. */
  "perf-count": () => {
    const rows = WALK_RUN.steps.map((s) => [
      s.tag,
      s.branch,
      num(s.dist),
      num(s.reads),
    ]);
    return [
      table(["걸음", "갈래", "거리 계산", "자료 접근"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      `합계  거리 계산 ${num(WALK_RUN.count.dist)} · 자료 접근 ${num(WALK_RUN.count.reads)} · 잡는 칸 ${num(WALK_RUN.count.cells)}`,
      `자료 접근이 가장 큰 걸음은 ${WALK_RUN.steps.reduce((a, b) => (b.reads > a.reads ? b : a)).tag} 이다`,
      "└ 합치는 걸음은 그 단계의 점 수에 비례하고, 띠 걸음은 거기에 실제로 잰 쌍의 수가 더 붙는다",
    ].join("\n");
  },

  /** `perf.derive` — 점을 4 배로 하면 세 계수가 각각 몇 배가 되는가. */
  "perf-growth": () => {
    const sizes = [256, 1_024, 4_096, 16_384];
    const counts = new Map(sizes.map((n) => [n, count(uniform(n))]));
    const rows = sizes.map((n) => {
      const c = counts.get(n) as Counted;
      return [num(n), num(c.dist), num(c.reads), num(c.cells)];
    });
    const growRows = sizes.slice(1).map((n, at) => {
      const prev = sizes[at] as number;
      const a = counts.get(prev) as Counted;
      const b = counts.get(n) as Counted;
      return [
        `${num(prev)} → ${num(n)}`,
        (b.dist / a.dist).toFixed(2),
        (b.reads / a.reads).toFixed(2),
        (b.cells / a.cells).toFixed(2),
      ];
    });
    return [
      table(["점", "거리 계산", "자료 접근", "잡는 칸"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      table(["점을 4 배로", "거리 계산", "자료 접근", "잡는 칸"], growRows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 세 계수 모두 4 배를 조금 넘는다. 점 수에 비례하는 값에 단계 수가 하나씩 더 붙기 때문이다",
    ].join("\n");
  },

  /** `perf.worst` — 계수를 가장 크게 만드는 배치. */
  "worst-shape": () => {
    const size = 4_096;
    const cases: [string, Point[]][] = [
      ["균등", uniform(size)],
      ["한 세로줄 위", column(size)],
      ["한 가로줄 위", row(size)],
      ["64 × 64 격자", lattice(64)],
      ["같은 좌표만", Array.from({ length: size }, () => [7, 7] as Point)],
    ];
    const rows = cases.map(([label, points]) => {
      const c = count(points);
      const { strip, peak } = scanPeak(points);
      return [label, num(c.dist), num(c.reads), num(strip), num(peak)];
    });
    return [
      table(
        [
          "배치",
          "거리 계산",
          "자료 접근",
          "가장 큰 띠의 점 수",
          "한 점 뒤로 본 최대 개수",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `다섯 배치 모두 점 ${num(size)} 개다`,
      "└ 자료 접근은 다섯 배치가 서로 두 배 안쪽이다. 띠가 커져도 한 점이 보는 개수가 안 커지기 때문이다",
      "└ 같은 좌표만 있는 배치는 best 가 0 이라 띠가 통째로 비고 거리 계산이 기저에서만 일어난다",
    ].join("\n");
  },
};
