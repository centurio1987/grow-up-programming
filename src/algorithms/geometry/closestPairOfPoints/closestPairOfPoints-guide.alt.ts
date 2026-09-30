/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run tools/bench-alt.ts src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints-guide.alt.ts
 *
 * **경쟁 설계는 「격자 나누기」다.** 같은 목표(가장 가까운 두 점 사이의 거리를 정확히 내는
 * 것)를 노리되 분할도 재귀도 하지 않는다. x 순서로 이웃한 쌍에서 답의 상한 `d0` 를 먼저 얻고,
 * 한 변이 `d0` 인 격자에 점을 담은 다음, 점마다 자기 칸과 이웃 여덟 칸만 비교한다. 답이 `d0`
 * 미만인 두 점은 그 아홉 칸 안에서 반드시 만나므로 이 절차도 정확하다.
 *
 * 두 설계는 **어떤 입력에서도 같은 답**을 낸다. `measure()` 가 매 실행마다 정본과 대조하고,
 * 다르면 던진다 — 답이 다른 구현으로 잰 계수는 비교가 아니라 다른 과제의 값이다.
 *
 * **세는 기준은 원고 전체와 같다**(`-guide.proof.ts` 머리 주석). 기본 연산은 거리 계산 · 좌표
 * 비교 · 칸 조회를 각각 1 로 센 합이고, 메모리는 할당 칸(입력 밖에 잡는 배열 칸을 잡을 때마다 더한 누적 합)이다. 두 설계가 똑같이 한 번씩
 * 하는 x 순서 정렬도 양쪽에 그대로 넣었다 — 원고의 다른 수와 같은 기준으로 읽히게 하려는 것이다.
 * **벽시계는 재지 않는다** — 실행마다 값이 달라 「일치」를 정의할 수 없다.
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 가족 둘을 고정하고 각각 매개변수 하나만 바꾼다 —
 * 균등 가족은 점의 수, 건너뛴 세로줄 가족은 건너뛰는 칸 수 `g` 다. 전개 입력(점 여덟)은 계수가
 * 두 자리라 순서가 뒤집히는 자리가 안 나오므로 표의 첫 줄로 함께 싣는다.
 *
 * 2026-09-30(KAN-058) 세는 기준을 「거리 계산 · 자료 접근 · 잡는 칸」 셋에서 원고 전체의 한 기준
 * (기본 연산 · 그때 「할당 칸」이라 부른 할당 칸)으로 바꿨다. 입력 가족과 시드는 그대로이고, 순서가 뒤집히는 `g` 는
 * 새 기준에서 다시 찾은 값이다.
 */
import {
  type Counted,
  count,
  ops,
  sortBy,
  squared,
  uniform,
  zero,
} from "./closestPairOfPoints-guide.proof.ts";
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

/** 균등 가족의 점 수. 좌표 상한과 씨앗은 증명 사이드카의 `uniform` 과 같다. */
const UNIFORM_N = 1_024;
const BIG_N = 4_096;

/** 건너뛴 세로줄 가족의 점 수. */
const LINE_N = 1_024;
const LINE_BIG_N = 4_096;

/** 기본 연산의 순서가 뒤집히는 첫 `g`. `flipStride()` 가 그 자리인지 본다. */
const FLIP_G = 10;
const FLIP_G_BIG = 14;

/**
 * 경쟁 설계 — 답의 상한 `d0` 를 먼저 얻고 한 변이 `d0` 인 격자에 점을 담는다.
 *
 * 거리가 `d0` 미만인 두 점은 가로로도 세로로도 한 칸 이상 떨어질 수 없으므로, 점마다 자기
 * 칸과 이웃 여덟 칸만 보면 그런 쌍을 하나도 안 놓친다. 상한이 답보다 훨씬 크면 한 칸에 점이
 * 많이 쌓여 비교가 늘어난다 — 그 자리가 이 설계의 비용이 정해지는 곳이다.
 */
function byGrid(points: Point[], c: Counted): number {
  const pts = sortBy(points, 0, c);
  c.cells += points.length;
  const n = pts.length;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < n; i++) {
    const d = squared(pts[i] as Point, pts[i + 1] as Point, c);
    if (d < best) best = d;
  }
  if (best === 0) return 0;
  const side = Math.sqrt(best);
  const grid = new Map<string, Point[]>();
  for (const p of pts) {
    const gx = Math.floor(p[0] / side);
    const gy = Math.floor(p[1] / side);
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        c.look++;
        const bucket = grid.get(`${gx + a},${gy + b}`);
        if (bucket === undefined) continue;
        for (const q of bucket) {
          const d = squared(p, q, c);
          if (d < best) best = d;
        }
      }
    }
    c.look++;
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

/**
 * 건너뛴 세로줄 가족 — 모든 점이 `x = 0` 이고 `y` 가 0 부터 `n−1` 까지인데, 입력 순서가
 * `g` 칸씩 건너뛴 것이다. 답은 언제나 1 이고, x 순서로 이웃한 쌍의 최소 거리가 `g` 다.
 */
function skipLine(n: number, g: number): Point[] {
  const out: Point[] = [];
  for (let r = 0; r < g; r++) {
    for (let y = r; y < n; y += g) out.push([0, y]);
  }
  return out;
}

/** 두 설계가 **정본과 같은 답**을 내는지 매번 확인한다. */
function measure(points: Point[]): { mine: Counted; theirs: Counted } {
  const theirs = zero();
  const want = closestPairOfPoints(points);
  const mine = count(points);
  if (byGrid(points, theirs) !== want) {
    throw new Error("격자 나누기가 정본과 다른 답을 냈다");
  }
  return { mine, theirs };
}

/** 기본 연산의 순서가 처음 뒤집히는 `g`. 1 부터 올려 가며 찾는다. */
function flipStride(n: number): number {
  for (let g = 1; g <= 64; g++) {
    const { mine, theirs } = measure(skipLine(n, g));
    if (ops(mine) < ops(theirs)) return g;
  }
  throw new Error("건너뛴 세로줄 가족에서 순서가 안 뒤집혔다");
}

if (flipStride(LINE_N) !== FLIP_G) {
  throw new Error(
    `기본 연산이 뒤집히는 g 가 ${flipStride(LINE_N)} 이다 — 상수와 어긋난다`,
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

const row = (side: "mine" | "theirs") => ({
  "전개 입력 기본 연산": ops(WALK[side]),
  "균등 1024 기본 연산": ops(EVEN[side]),
  "균등 4096 기본 연산": ops(EVEN_BIG[side]),
  [`세로줄 g=${FLIP_G - 1} 기본 연산`]: ops(LINE_IN[side]),
  [`세로줄 g=${FLIP_G} 기본 연산`]: ops(LINE_OUT[side]),
  "세로줄 g=16 기본 연산": ops(LINE_FAR[side]),
  "세로줄 g=16 거리 계산": LINE_FAR[side].dist,
  "균등 1024 할당 칸": EVEN[side].cells,
});

export const cases = {
  "분할선 띠": () => row("mine"),
  "격자 나누기": () => row("theirs"),
};
