/**
 * `spatial/kdTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./kdTree.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기가 없다.** 생성자가 인자를 받지 않고 상태를 바꾸는 연산(`insert`)이 있어 `runContract` 의 인자 없는 팩토리에 그대로
 * 맞는다.
 *
 * **`spatial/quadtree` 계약과 나누는 것.** 그쪽은 이쪽에서 최근접을 뺀 연산 둘을 **같은 이름 · 같은 뜻**으로 갖고 점의 정의역만
 * 넓다(유한한 수 전부 — 이쪽은 절댓값 `2^25` 이하의 정수). 그래서 넣기 · 범위 질의만 부르는 **정수 경계 케이스 셋과 시나리오
 * 셋은 이 파일이 짓고 그쪽이 같은 객체로 쓴다**(§「연산 집합이 다른 이웃에게서는 스위트 항목을 따로 판정해 가져온다」 — 이번에는
 * 연산이 많은 쪽이 짓는다. 두 계약의 판정 순서가 이쪽이 먼저라서다). 타입은 두 연산만 가진 `PointIndexSurface` 로 적어 그쪽
 * 구현이 받는다. `model` · `ops` 는 정의역과 최근접 몫만큼 달라 따로 적는다.
 *
 * **축1 은 범위 질의의 답을 (x, y) 순으로 정렬해 견준다** — 계약이 답의 순서를 정하지 않기 때문이다(`hash/hashMapChaining` 의 열거
 * 순서와 같은 처분 · §「분할을 담는 계약은 대표를 분할만으로 정해지는 값으로 정한다」 표의 왼쪽 열).
 */

import type {
  ContractSpec,
  CostScenario,
  EdgeCase,
  Invariant,
} from "../../_contract/runContract";

export type Point2D = [number, number];

/** 좌표 절댓값의 한도. 헤더 「주입 정책」. */
export const COORDINATE_LIMIT = 2 ** 25;

/** 넣기와 범위 질의 두 연산의 표면. `spatial/quadtree` 계약이 같은 이름 · 같은 뜻으로 쓴다. */
export interface PointIndexSurface {
  insert(point: Point2D): void;
  rangeSearch(min: Point2D, max: Point2D): Point2D[];
}

/** 헤더 연산 계약 표를 옮긴 표면. */
export interface KDTreeSurface extends PointIndexSurface {
  nearestNeighbor(query: Point2D): Point2D | null;
}

/** 범위 질의 · 최근접 시나리오가 재는 호출 수. `worst` 라 n 에 묶지 않는다(§「`worst` 시나리오는 재는 호출 수를 n 에 묶지 않아도 된다」). */
export const STEPS = 32;

/** 최근접 시나리오의 원 반지름. 좌표 한도 안이다. */
export const CIRCLE_RADIUS = 2 ** 24;

/** 범위 밖 호출의 관측값. 계약이 `RangeError` 를 적은 자리다. */
export const OUT_OF_RANGE = "RangeError";

export function observe(call: () => unknown): unknown {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 점 목록을 (x, y) 순으로 늘어놓은 사본. 축1 이 범위 질의의 답을 견주는 모양이다. */
export function sortedPoints(points: readonly Point2D[]): Point2D[] {
  return points
    .map((p): Point2D => [p[0], p[1]])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** 사각형 안(변 포함)의 점. 모서리가 뒤집히면 아무 점도 들지 않는다. */
export function pointsInside(
  points: readonly Point2D[],
  min: Point2D,
  max: Point2D,
): Point2D[] {
  return points.filter(
    (p) => p[0] >= min[0] && p[0] <= max[0] && p[1] >= min[1] && p[1] <= max[1],
  );
}

/** 가장 가까운 점. 같은 거리면 x 가 작은 점, 그다음 y 가 작은 점. 비었으면 `null`. */
export function nearestOf(
  points: readonly Point2D[],
  query: Point2D,
): Point2D | null {
  let best: Point2D | null = null;
  let bestD = Infinity;
  for (const p of points) {
    const d = (p[0] - query[0]) ** 2 + (p[1] - query[1]) ** 2;
    if (
      best === null ||
      d < bestD ||
      (d === bestD && (p[0] < best[0] || (p[0] === best[0] && p[1] < best[1])))
    ) {
      best = [p[0], p[1]];
      bestD = d;
    }
  }
  return best;
}

function isCoordinate(value: number): boolean {
  return Number.isInteger(value) && Math.abs(value) <= COORDINATE_LIMIT;
}

function isCorner(value: number): boolean {
  return !Number.isNaN(value);
}

/** 채우기 — 0 이상 4n 미만의 정수 좌표를 무작위로 n 개. 좌표 폭이 n 과 같은 배율로 오른다(헤더 「연산 계약」). */
export function fillRandom(
  impl: PointIndexSurface,
  n: number,
  rng: () => number,
): void {
  for (let i = 0; i < n; i++) {
    impl.insert([Math.floor(rng() * 4 * n), Math.floor(rng() * 4 * n)]);
  }
}

// ── 축3 시나리오 — 넣기 · 범위 질의 셋은 `spatial/quadtree` 가 같은 객체로 쓴다 ─────────────────────────────

/**
 * **대각선으로 넣기 n 번을 전부 잰다.** x 와 y 가 함께 오르면 좌표로 견주며 내려가 매다는 나무(`unbalancedPointTree`)가 사슬이 된다.
 * 표의 상한은 `O(log² n)` 이고 판정은 `O(log n)` 이다 — 로그 인수 하나는 해상도 아래다(헤더 「연산 계약」).
 */
export const insertScenario: CostScenario<PointIndexSurface> = {
  covers: ["insert"],
  qualifier: "amortized",
  bound: "O(log n)",
  adversarial: true,
  run: (impl, n, ctx) => {
    for (let i = 0; i < n; i++) ctx.step(() => impl.insert([i, i]));
  },
};

/** 가는 띠 시나리오가 묻는 줄의 수. 짝수 번째는 세로 줄, 홀수 번째는 가로 줄이다. */
export const LINES = 8;

/**
 * 채우기 — 점 절반은 0 이상 4n 미만의 무작위 정수 좌표이고, 나머지 절반은 무작위로 고른 줄 `LINES` 개의 **양옆 두 칸**(좌표 `c` 와
 * `c + 1`)에 나눠 몰린다. 줄의 좌표 `c` 를 돌려준다. 좌표 폭이 n 과 같은 배율로 오른다(헤더 「목적」).
 */
export function fillFlanked(
  impl: PointIndexSurface,
  n: number,
  rng: () => number,
): number[] {
  const lines = Array.from({ length: LINES }, () => Math.floor(rng() * 4 * n));
  for (let i = 0; i < n; i++) {
    const a = Math.floor(rng() * 4 * n);
    const b = Math.floor(rng() * 4 * n);
    if (i % 2 === 0) {
      impl.insert([a, b]);
      continue;
    }
    const line = (i >> 1) % LINES;
    const c = (lines[line] as number) + ((i >> 4) % 2);
    impl.insert(line % 2 === 0 ? [c, a] : [a, c]);
  }
  return lines;
}

/**
 * **채운 뒤 답이 없는 가는 띠를 `STEPS` 번 — 줄 여덟을 차례로, 세로 띠와 가로 띠를 번갈아.** 띠가 줄의 `c + 0.5` 에 서서 정수 점이
 * 하나도 안 들어 답의 수 `k` 가 0 이다(§규약2 시나리오 규칙 3 — `k` 를 상수로 누른다). 채우기가 두 계열을 겨눈다.
 * - **띠 양옆에 몰린 점** — 칸의 가운데로 네 등분하는 구현(`regionQuadtree`)은 띠에 붙은 칸이 한 변 1 까지 쪼개져 층마다 띠를 가로지르는
 *   칸이 늘어난다. 무작위로만 채우면 그 구현이 169 · 320 · 597 로 통과한다.
 * - **세로와 가로를 번갈아** — x 순 배열 계열(`xSortedRunsPointSet`)이 세로 띠에서 계급 아래로, 가로 띠에서 담긴 수에 비례해 걸린다.
 *   거울상인 y 순 계열도 같은 호출열이 받는다(§「거울상인 두 결함 계열은 한 호출열에서 함께 겨눈다」).
 * 점 절반을 무작위로 두는 것은 **정본이 이 행의 계급을 실제로 내게** 하려는 것이다 — 줄 양옆에만 두면 좌표가 두 값으로 모여 정본의
 * 상자가 곧바로 줄어 3 · 3 · 3 에 머문다(불변 사실 113).
 */
export const slabScenario: CostScenario<PointIndexSurface> = {
  covers: ["rangeSearch"],
  qualifier: "worst",
  bound: "O(sqrt n)",
  adversarial: true,
  run: (impl, n, ctx) => {
    const lines = fillFlanked(impl, n, ctx.rng);
    for (let k = 0; k < STEPS; k++) {
      const line = k % LINES;
      const c = (lines[line] as number) + 0.5;
      if (line % 2 === 0) {
        ctx.step(() => void impl.rangeSearch([c, -1], [c, 4 * n]));
      } else {
        ctx.step(() => void impl.rangeSearch([-1, c], [4 * n, c]));
      }
    }
  },
};

/**
 * **무작위로 채운 뒤 전부를 담는 사각형을 네 번.** 답의 수가 `k = n` 이라 상한이 `O(n)` 이다(§규약2 시나리오 규칙 3 — 파라미터를
 * 반대쪽 끝에 고정한다). 답을 늘어놓는 일이 `k` 에 대해 선형보다 무거운 계열(`sortedOutputPointIndex`)이 걸린다.
 */
export const wholeScenario: CostScenario<PointIndexSurface> = {
  covers: ["rangeSearch"],
  qualifier: "worst",
  bound: "O(n)",
  adversarial: false,
  run: (impl, n, ctx) => {
    fillRandom(impl, n, ctx.rng);
    for (let k = 0; k < 4; k++) {
      ctx.step(() => void impl.rangeSearch([-1, -1], [4 * n, 4 * n]));
    }
  },
};

/** 원 위의 점 n 개 — 반지름 `CIRCLE_RADIUS`, 각을 고르게 나눠 가까운 정수 좌표로. 넣는 차례는 각의 차례다. */
export function circlePoints(n: number): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    points.push([
      Math.round(CIRCLE_RADIUS * Math.cos(angle)),
      Math.round(CIRCLE_RADIUS * Math.sin(angle)),
    ]);
  }
  return points;
}

/**
 * **원 위의 점 n 개를 넣고 중심 가까이에서 최근접을 여덟 번.** 모든 점이 거의 같은 거리라 점 둘 이상을 담은 어떤 영역도 가장
 * 가까운 점보다 가깝다 — 영역으로 가지를 치는 구현이 전부를 지난다. 상한이 `O(n)` 이라 **정본이 그 계급을 실제로 내는 입력이
 * 이것뿐이다**(불변 사실 113 — 무작위 입력에서 정본은 로그 쪽이라 이 행을 통과하지 못한다). 이 시나리오에서만 걸리는 fixture 는
 * 없다 — 재는 대상이 정본의 일이다(불변 사실 265). 선형보다 빠른 구현(보로노이 계열)은 이 행에서 **계급 아래로** 걸린다(불변 사실
 * 49 · 111 — 헤더 「연산 계약」).
 */
export const nearestScenario: CostScenario<KDTreeSurface> = {
  covers: ["nearestNeighbor"],
  qualifier: "worst",
  bound: "O(n)",
  adversarial: true,
  run: (impl, n, ctx) => {
    for (const p of circlePoints(n)) impl.insert(p);
    for (let k = 0; k < 8; k++) {
      const query: Point2D = [(k % 3) - 1, ((k >> 1) % 3) - 1];
      ctx.step(() => void impl.nearestNeighbor(query));
    }
  },
};

// ── 축1 경계 케이스 — 앞 셋은 `spatial/quadtree` 가 같은 객체로 쓴다 ─────────────────────────────────────────

/** 넣기 · 범위 질의만 부르고 정수 좌표만 쓰는 경계 케이스. 두 계약에서 뜻이 같다. */
export const pointIndexEdges: readonly EdgeCase[] = [
  {
    name: "빈 색인의 범위 질의는 빈 답이다",
    steps: [
      {
        op: "rangeSearch",
        arg: [
          [-10, -10],
          [10, 10],
        ],
      },
      { op: "insert", arg: [3, 4] },
      {
        op: "rangeSearch",
        arg: [
          [0, 0],
          [2, 2],
        ],
      },
      {
        op: "rangeSearch",
        arg: [
          [3, 4],
          [3, 4],
        ],
      },
    ],
  },
  {
    // 닫힌 사각형 — 변 위의 점도 든다. 모서리가 뒤집히면 든 점이 없어 빈 답이다(예외가 아니다). 모서리는 정수가 아니어도 된다.
    name: "사각형은 변을 포함하고 뒤집힌 사각형은 빈 답이다",
    steps: [
      { op: "insert", arg: [1, 1] },
      { op: "insert", arg: [3, 3] },
      { op: "insert", arg: [1, 3] },
      { op: "insert", arg: [2, 5] },
      {
        op: "rangeSearch",
        arg: [
          [1, 1],
          [3, 3],
        ],
      },
      {
        op: "rangeSearch",
        arg: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        op: "rangeSearch",
        arg: [
          [3, 1],
          [1, 3],
        ],
      },
      {
        op: "rangeSearch",
        arg: [
          [1.5, 0],
          [2.5, 4.5],
        ],
      },
      {
        op: "rangeSearch",
        arg: [
          [1.5, 0],
          [2.5, 5],
        ],
      },
    ],
  },
  {
    name: "같은 점을 여러 번 넣으면 범위 질의가 넣은 수만큼 돌려준다",
    steps: [
      { op: "insert", arg: [2, 2] },
      { op: "insert", arg: [2, 2] },
      { op: "insert", arg: [2, 3] },
      { op: "insert", arg: [2, 2] },
      {
        op: "rangeSearch",
        arg: [
          [2, 2],
          [2, 2],
        ],
      },
      {
        op: "rangeSearch",
        arg: [
          [0, 0],
          [5, 5],
        ],
      },
    ],
  },
];

// ── 축1 참조 모델 ─────────────────────────────────────────────────────────────────────────────────────────

/** 축1 참조 모델. 넣은 점을 배열에 그대로 둔다 — 같은 모양이 축3에서는 질의마다 훑는 자명한 구현이다. */
interface Model {
  points: Point2D[];
}

const INVALID_POINTS: readonly Point2D[] = [
  [0.5, 1],
  [COORDINATE_LIMIT + 1, 0],
  [0, -(COORDINATE_LIMIT + 1)],
];

function randomPoint(rng: () => number, span: number): Point2D {
  return [
    Math.floor(rng() * (2 * span + 1)) - span,
    Math.floor(rng() * (2 * span + 1)) - span,
  ];
}

/** 무작위 점 — 열에 한 번쯤 정의역 밖(정수 아님 · 한도 밖)을 섞는다. */
function maybeInvalid(rng: () => number, span: number): Point2D {
  if (rng() < 0.1) {
    return INVALID_POINTS[Math.floor(rng() * INVALID_POINTS.length)] as Point2D;
  }
  return randomPoint(rng, span);
}

const BIG = COORDINATE_LIMIT;

export const kdTreeContract: ContractSpec<KDTreeSurface, Model> = {
  name: "KDTree",
  grade: "complexity",
  model: () => ({ points: [] }),

  ops: [
    {
      name: "insert",
      // 좌표 -4~4. 81 칸에 500 회 중 3분의 1 이 넣기라 같은 점이 여러 벌 담기고 최근접 동률이 자주 난다.
      arg: (rng) => maybeInvalid(rng, 4),
      onImpl: (impl, arg) => {
        const [x, y] = arg as Point2D;
        return observe(() => impl.insert([x, y]));
      },
      onModel: (model, arg) => {
        const [x, y] = arg as Point2D;
        if (!isCoordinate(x) || !isCoordinate(y)) return OUT_OF_RANGE;
        model.points.push([x, y]);
        return undefined;
      },
    },
    {
      name: "rangeSearch",
      // 모서리는 -5~5 의 반 칸 눈금. 뒤집힌 사각형도 그대로 넘긴다.
      arg: (rng) => [
        [Math.floor(rng() * 21) / 2 - 5, Math.floor(rng() * 21) / 2 - 5],
        [Math.floor(rng() * 21) / 2 - 5, Math.floor(rng() * 21) / 2 - 5],
      ],
      onImpl: (impl, arg) => {
        const [min, max] = arg as [Point2D, Point2D];
        const found = observe(() =>
          impl.rangeSearch([min[0], min[1]], [max[0], max[1]]),
        );
        return Array.isArray(found) ? sortedPoints(found) : found;
      },
      onModel: (model, arg) => {
        const [min, max] = arg as [Point2D, Point2D];
        if (![...min, ...max].every(isCorner)) return OUT_OF_RANGE;
        return sortedPoints(pointsInside(model.points, min, max));
      },
    },
    {
      name: "nearestNeighbor",
      arg: (rng) => maybeInvalid(rng, 6),
      onImpl: (impl, arg) => {
        const [x, y] = arg as Point2D;
        return observe(() => impl.nearestNeighbor([x, y]));
      },
      onModel: (model, arg) => {
        const [x, y] = arg as Point2D;
        if (!isCoordinate(x) || !isCoordinate(y)) return OUT_OF_RANGE;
        return nearestOf(model.points, [x, y]);
      },
    },
  ],

  edges: [
    ...pointIndexEdges,
    {
      name: "빈 색인의 최근접은 null 이다",
      steps: [
        { op: "nearestNeighbor", arg: [0, 0] },
        { op: "insert", arg: [7, -7] },
        { op: "nearestNeighbor", arg: [0, 0] },
      ],
    },
    {
      // 거리가 같으면 x 가 작은 점, 그다음 y 가 작은 점. (5, 5) 에서 (1, 0) 과 (0, 1) 은 제곱 거리가 41 로 같다.
      name: "최근접 동률은 x 가 작은 점이 이기고 x 도 같으면 y 가 작은 점이 이긴다",
      steps: [
        { op: "insert", arg: [1, 0] },
        { op: "insert", arg: [0, 1] },
        { op: "insert", arg: [0, -1] },
        { op: "insert", arg: [-1, 0] },
        { op: "nearestNeighbor", arg: [0, 0] },
        { op: "nearestNeighbor", arg: [5, 5] },
        { op: "nearestNeighbor", arg: [0, 3] },
        { op: "nearestNeighbor", arg: [1, 0] },
      ],
    },
    {
      // 제곱 거리가 2^53 에 닿는 끝 좌표. (2^25-1, 2^25) 과 (2^25, 2^25-1) 은 (-2^25, -2^25) 에서 제곱 거리가 2^53 - 2^27 + 1 로
      // 같다 — 동률이라 x 가 작은 쪽이다. 거리를 부동소수로 반올림해 견주는 구현이 여기서 갈릴 수 있다.
      name: "좌표 한도 끝에서도 최근접 거리를 정확히 견준다",
      steps: [
        { op: "insert", arg: [BIG, BIG - 1] },
        { op: "insert", arg: [BIG - 1, BIG] },
        { op: "nearestNeighbor", arg: [-BIG, -BIG] },
        { op: "insert", arg: [BIG, BIG] },
        { op: "nearestNeighbor", arg: [-BIG, -BIG] },
        { op: "nearestNeighbor", arg: [BIG, -BIG] },
      ],
    },
    {
      // 점의 정의역은 절댓값 2^25 이하의 정수다. 밖이면 RangeError 이고 상태가 바뀌지 않는다. 사각형 모서리는 NaN 만 아니면 된다.
      name: "정수가 아니거나 한도 밖인 좌표는 RangeError 이고 상태가 안 바뀐다",
      steps: [
        { op: "insert", arg: [0.5, 0] },
        { op: "insert", arg: [BIG + 1, 0] },
        { op: "insert", arg: [0, -BIG - 1] },
        { op: "insert", arg: [BIG, -BIG] },
        {
          op: "rangeSearch",
          arg: [
            [-1e9, -1e9],
            [1e9, 1e9],
          ],
        },
        { op: "nearestNeighbor", arg: [0.5, 0] },
        { op: "nearestNeighbor", arg: [0, BIG + 1] },
        { op: "nearestNeighbor", arg: [0, 0] },
      ],
    },
  ],

  invariants: [
    {
      // 헤더 불변식 1. 최근접이 읽는 담긴 점과 범위 질의가 읽는 담긴 점이 같아야 한다 — 관측 경로가 둘이다.
      name: "최근접은 범위 질의로 읽은 점 중 가장 가까운 점이다",
      check: (impl) => {
        const all = impl.rangeSearch([-BIG, -BIG], [BIG, BIG]);
        for (const probe of PROBES) {
          const observed = impl.nearestNeighbor(probe);
          const expected = nearestOf(all, probe);
          const same =
            observed === null || expected === null
              ? observed === expected
              : observed[0] === expected[0] && observed[1] === expected[1];
          if (!same) {
            return `질의점 [${probe}] 에서 최근접 ${JSON.stringify(observed)} / 범위로 읽은 점 중 가장 가까운 점 ${JSON.stringify(expected)}`;
          }
        }
        return null;
      },
    } satisfies Invariant<KDTreeSurface>,
  ],

  scenarios: [insertScenario, slabScenario, wholeScenario, nearestScenario],
};

/** 불변식 검사가 최근접을 묻는 자리. 무작위 넣기의 좌표 폭(-4~4) 안팎. */
const PROBES: readonly Point2D[] = [
  [0, 0],
  [3, -2],
  [-5, 5],
  [6, 6],
  [-1, 4],
];
