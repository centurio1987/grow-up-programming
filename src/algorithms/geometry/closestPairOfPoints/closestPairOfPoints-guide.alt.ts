/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts closestPairOfPoints-guide.alt.ts
 *
 * **경쟁 설계는 「격자 나누기」다.** 같은 목표(가장 가까운 두 점 사이의 거리를 정확히 내는
 * 것)를 노리되 분할도 재귀도 하지 않는다. x 오름차순 이웃 첨자 쌍에서 답의 상한 `d0` 를
 * 먼저 얻고, 한 변이 `d0` 인 격자에 점을 담은 다음, 점마다 자기 칸과 이웃 여덟 칸만 대조한다.
 * 답이 `d0` 미만인 두 점은 그 아홉 칸 안에서 반드시 만나므로 이 절차도 정확하다.
 *
 * 두 설계는 **어떤 입력에서도 같은 답**을 낸다. `measure()` 가 매 실행마다 정본과 대조하고,
 * 다르면 던진다 — 답이 다른 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다.
 *
 * **계수 셋을 센다.**
 *
 *   거리 계산  두 점의 제곱 거리를 만든 횟수
 *   자료 접근  배열 칸 읽기·쓰기와 격자 조회를 각각 1 로 센 것(거리 계산 안의 좌표 읽기 넷 포함)
 *   잡는 칸    절차가 입력 밖에 새로 잡는 칸의 총수
 *
 * **두 설계가 똑같이 한 번씩 하는 x 정렬은 세 계수에서 뺐다.** 같은 값이 양쪽에 더해질 뿐이라
 * 순서를 못 바꾼다. **벽시계는 재지 않는다** — 실행마다 값이 달라 「일치」를 정의할 수 없다.
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 가족 둘을 고정하고 각각 매개변수 하나만 바꾼다 —
 * 균등 가족은 점의 수, 건너뛴 세로줄 가족은 건너뛰는 칸 수 `g` 다. 전개 입력(점 여덟)은 계수가
 * 두 자리라 순서가 뒤집히는 자리가 안 나오므로 표의 첫 줄로 함께 싣는다.
 */
import {
  closestPairOfPoints,
  type Point,
} from "./closestPairOfPoints-guide.ref.ts";

/** `deep.walk` 가 쓰는 전개 입력. */
const WALK_POINTS: Point[] = [
  [0, 0],
  [2, 6],
  [3, 1],
  [4, 8],
  [5, 2],
  [6, 5],
  [8, 3],
  [9, 7],
];

/** 균등 가족의 점 수와 좌표 상한. */
const UNIFORM_N = 1_024;
const BIG_N = 4_096;
const SPREAD = 100_000_000;

/** 건너뛴 세로줄 가족의 점 수. */
const LINE_N = 1_024;
const LINE_BIG_N = 4_096;

/** 자료 접근의 순서가 뒤집히는 첫 `g`. `flipStride()` 가 그 자리인지 본다. */
const FLIP_G = 4;
const FLIP_G_BIG = 6;

interface Counted {
  /** 두 점의 제곱 거리를 만든 횟수. */
  dist: number;
  /** 배열 칸 읽기·쓰기와 격자 조회. */
  reads: number;
  /** 입력 밖에 새로 잡는 칸의 총수. */
  cells: number;
}

/** 두 점 사이 거리의 제곱. 좌표 읽기 넷을 자료 접근에 함께 센다. */
function squared(a: Point, b: Point, c: Counted): number {
  c.dist++;
  c.reads += 4;
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/* ────────────────────────── 설계 하나 — 분할 정복 ────────────────────────── */

/** 이 가이드가 가르치는 설계. 정본과 같은 절차에 세는 자리만 덧붙였다. */
function divideSolve(pts: Point[], c: Counted): { best: number; byY: Point[] } {
  const n = pts.length;
  if (n <= 3) {
    const byY = [...pts].sort((a, b) => a[1] - b[1]);
    c.cells += n;
    c.reads += n;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        c.reads += 2;
        const d = squared(pts[i] as Point, pts[j] as Point, c);
        if (d < best) best = d;
      }
    }
    return { best, byY };
  }
  const mid = n >> 1;
  c.reads += 1;
  const splitX = (pts[mid] as Point)[0];
  const left = divideSolve(pts.slice(0, mid), c);
  const right = divideSolve(pts.slice(mid), c);
  c.cells += n;
  let best = Math.min(left.best, right.best);

  const byY: Point[] = [];
  c.cells += n;
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
  c.cells += n;
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
}

function byDivide(points: Point[], c: Counted): number {
  const pts = [...points].sort((a, b) => a[0] - b[0]);
  return Math.sqrt(divideSolve(pts, c).best);
}

/* ────────────────────────── 설계 둘 — 격자 나누기 ────────────────────────── */

/**
 * 경쟁 설계 — 답의 상한 `d0` 를 먼저 얻고 한 변이 `d0` 인 격자에 점을 담는다.
 *
 * 거리가 `d0` 미만인 두 점은 가로로도 세로로도 한 칸 이상 떨어질 수 없으므로, 점마다 자기
 * 칸과 이웃 여덟 칸만 보면 그런 쌍을 하나도 안 놓친다. 상한이 답보다 훨씬 크면 한 칸에 점이
 * 많이 쌓여 대조가 늘어난다 — 그 자리가 이 설계의 비용이 정해지는 곳이다.
 */
function byGrid(points: Point[], c: Counted): number {
  const pts = [...points].sort((a, b) => a[0] - b[0]);
  const n = pts.length;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < n; i++) {
    c.reads += 2;
    const d = squared(pts[i] as Point, pts[i + 1] as Point, c);
    if (d < best) best = d;
  }
  if (best === 0) return 0;
  const side = Math.sqrt(best);
  const grid = new Map<string, Point[]>();
  for (const p of pts) {
    c.reads += 2;
    const gx = Math.floor(p[0] / side);
    const gy = Math.floor(p[1] / side);
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        c.reads++;
        const bucket = grid.get(`${gx + a},${gy + b}`);
        if (bucket === undefined) continue;
        for (const q of bucket) {
          c.reads++;
          const d = squared(p, q, c);
          if (d < best) best = d;
        }
      }
    }
    c.reads++;
    const own = grid.get(`${gx},${gy}`);
    if (own === undefined) {
      grid.set(`${gx},${gy}`, [p]);
      c.cells += 2;
    } else {
      own.push(p);
      c.cells += 1;
    }
  }
  return Math.sqrt(best);
}

/* ────────────────────────── 입력 가족 ────────────────────────── */

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

/** 균등 가족 — 한 변 `SPREAD` 인 정사각형에 흩은 점 `n` 개. 같은 좌표는 걸러 낸다. */
function uniform(n: number): Point[] {
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
  return out;
}

/**
 * 건너뛴 세로줄 가족 — 모든 점이 `x = 0` 이고 `y` 가 0 부터 `n−1` 까지인데, 입력 순서가
 * `g` 칸씩 건너뛴 것이다. 답은 언제나 1 이고, x 오름차순 이웃 첨자 쌍의 최소 거리가 `g` 다.
 */
function skipLine(n: number, g: number): Point[] {
  const out: Point[] = [];
  for (let r = 0; r < g; r++) {
    for (let y = r; y < n; y += g) out.push([0, y]);
  }
  return out;
}

/* ────────────────────────── 계측 ────────────────────────── */

/** 두 설계가 **정본과 같은 답**을 내는지 매번 확인한다. */
function measure(points: Point[]): { mine: Counted; theirs: Counted } {
  const mine: Counted = { dist: 0, reads: 0, cells: 0 };
  const theirs: Counted = { dist: 0, reads: 0, cells: 0 };
  const want = closestPairOfPoints(points);
  if (byDivide(points, mine) !== want) {
    throw new Error("분할 정복 계수용 절차가 정본과 다른 답을 냈다");
  }
  if (byGrid(points, theirs) !== want) {
    throw new Error("격자 나누기가 정본과 다른 답을 냈다");
  }
  return { mine, theirs };
}

/** 자료 접근의 순서가 처음 뒤집히는 `g`. 1 부터 올려 가며 찾는다. */
function flipStride(n: number): number {
  for (let g = 1; g <= 64; g++) {
    const { mine, theirs } = measure(skipLine(n, g));
    if (mine.reads < theirs.reads) return g;
  }
  throw new Error("건너뛴 세로줄 가족에서 순서가 안 뒤집혔다");
}

if (flipStride(LINE_N) !== FLIP_G) {
  throw new Error(
    `자료 접근이 뒤집히는 g 가 ${flipStride(LINE_N)} 이다 — 상수와 어긋난다`,
  );
}
if (flipStride(LINE_BIG_N) !== FLIP_G_BIG) {
  throw new Error(
    `점 ${LINE_BIG_N} 개에서 뒤집히는 g 가 ${flipStride(LINE_BIG_N)} 이다 — 상수와 어긋난다`,
  );
}

const WALK = measure(WALK_POINTS);
const EVEN = measure(uniform(UNIFORM_N));
const EVEN_BIG = measure(uniform(BIG_N));
const LINE_IN = measure(skipLine(LINE_N, FLIP_G - 1));
const LINE_OUT = measure(skipLine(LINE_N, FLIP_G));
const LINE_FAR = measure(skipLine(LINE_N, 16));

export const cases = {
  "분할 정복": () => ({
    "전개 입력 거리 계산": WALK.mine.dist,
    "전개 입력 자료 접근": WALK.mine.reads,
    "균등 1024 거리 계산": EVEN.mine.dist,
    "균등 1024 자료 접근": EVEN.mine.reads,
    "균등 4096 자료 접근": EVEN_BIG.mine.reads,
    "세로줄 g=3 자료 접근": LINE_IN.mine.reads,
    "세로줄 g=4 자료 접근": LINE_OUT.mine.reads,
    "세로줄 g=16 자료 접근": LINE_FAR.mine.reads,
    "세로줄 g=16 거리 계산": LINE_FAR.mine.dist,
    "균등 1024 잡는 칸": EVEN.mine.cells,
  }),
  "격자 나누기": () => ({
    "전개 입력 거리 계산": WALK.theirs.dist,
    "전개 입력 자료 접근": WALK.theirs.reads,
    "균등 1024 거리 계산": EVEN.theirs.dist,
    "균등 1024 자료 접근": EVEN.theirs.reads,
    "균등 4096 자료 접근": EVEN_BIG.theirs.reads,
    "세로줄 g=3 자료 접근": LINE_IN.theirs.reads,
    "세로줄 g=4 자료 접근": LINE_OUT.theirs.reads,
    "세로줄 g=16 자료 접근": LINE_FAR.theirs.reads,
    "세로줄 g=16 거리 계산": LINE_FAR.theirs.dist,
    "균등 1024 잡는 칸": EVEN.theirs.cells,
  }),
};
