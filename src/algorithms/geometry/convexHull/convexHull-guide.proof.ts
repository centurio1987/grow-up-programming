/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 그림 사이드카(`-guide.fig.tsx`)도 이 파일의 기록(`chainEvents` · `WALK_*`)을 받아 그린다 — 그림과
 * 표가 같은 실행을 쓴다.
 *
 * **비용은 한 기준으로 센다.** 기본 연산 = 좌표 비교(정렬의 비교 + 같은 좌표 확인) + 방향 판정.
 * 추가로 잡는 칸 = 정렬 사본 `n` + 중복을 지운 목록 `m` + 뒤집은 사본 `m` + 끝점을 뗀 두 사슬 `h`.
 * 원고 전체와 `.alt.ts` 가 같은 두 기준을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/geometry/convexHull/convexHull-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { convexHull, type Point, sideOf } from "./convexHull-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
export const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 점 목록의 표기. */
export const list = (ps: readonly Point[]): string =>
  ps.length === 0 ? "없음" : ps.map(pt).join(" ");

/** 조사를 고를 때 점 표기의 마지막 수를 읽는다 — 「(3,2) 를」·「(0,3) 을」. */
export const tail = (p: Point): string => String(p[1]);

/** 코드에 쓰는 배열 표기 — `[[0, 0], [6, 0]]`. */
export const code = (ps: readonly Point[]): string =>
  `[${ps.map((p) => `[${p[0]}, ${p[1]}]`).join(", ")}]`;

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

/** 음수는 괄호로 싼다 — 「(−3)·0」. */
const paren = (v: number): string => (v < 0 ? `(${v})` : String(v));

/** 방향 판정값의 뜻. */
export const turnWord = (s: number): string =>
  s > 0 ? "왼쪽으로 꺾인다" : s < 0 ? "오른쪽으로 꺾인다" : "한 직선 위다";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 여덟 점 안에 이 절차의 갈래가 전부 들어 있다 — 안쪽 점 하나, 변 위의 공선 중간 점 하나,
 * 같은 좌표 한 쌍, 세로로 늘어선 세 점, 그리고 두 사슬이 서로 다른 꼭짓점을 담는 모양이다.
 */
export const WALK: Point[] = [
  [3, 2],
  [6, 0],
  [0, 0],
  [3, 4],
  [6, 3],
  [0, 3],
  [3, 0],
  [6, 0],
];

/** 이 글이 재는 과제의 규모 — 점 개수와 좌표의 절댓값 상한. */
export const LIMIT = 100_000;
export const COORD = 1_000_000_000;

/** 단순한 연산 1 초에 1 억 번 — 시간을 어림하는 기준. */
const PER_SECOND = 100_000_000;

/** 세 번째 짚고 가기가 다루는 입력. 좌표가 상한에 붙어 있고 꼭짓점 하나가 아주 얕다. */
const SHALLOW: Point[] = [
  [0, 0],
  [999_999_999, 999_999_998],
  [1_000_000_000, 999_999_999],
  [0, 1],
];

/** 첫 번째 짚고 가기가 쓰는 작은 반례. 세로로 늘어선 점이 셋이다. */
const VERTICAL: Point[] = [
  [3, 0],
  [0, 3],
  [3, 3],
  [3, 1],
];

/** 변 위에 공선 중간 점이 있는 입력. */
const ON_EDGE: Point[] = [
  [0, 0],
  [2, 0],
  [4, 0],
  [4, 4],
  [0, 4],
];

/** 모든 점이 한 직선 위인 입력. */
const COLLINEAR: Point[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
];

/** 좌표 상한의 네 모서리와 가운데 점. */
const CORNERS: Point[] = [
  [-COORD, -COORD],
  [COORD, -COORD],
  [COORD, COORD],
  [-COORD, COORD],
  [0, 0],
];

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

/** 200,000 × 200,000 격자 안의 점 `total` 개. 씨앗을 고정해 실행마다 같은 입력이 된다. */
function scatter(total: number, seed = 20_260_904): Point[] {
  const rnd = makeRnd(seed);
  const out: Point[] = [];
  for (let at = 0; at < total; at++)
    out.push([rnd() % 200_000, rnd() % 200_000]);
  return out;
}

/** 같은 입력을 여러 블록이 쓰므로 한 번만 만든다. */
const SCATTER = new Map<number, Point[]>();
export const scattered = (total: number): Point[] => {
  let got = SCATTER.get(total);
  if (got === undefined) {
    got = scatter(total);
    SCATTER.set(total, got);
  }
  return got;
};

/** 좌표 순서 — `x` 를 먼저, 같으면 `y`. 정본의 비교 함수와 같다. */
const byXY = (p: Point, q: Point): number => p[0] - q[0] || p[1] - q[1];

/** 정렬해 중복을 지운 점 목록. 정본이 안에서 하는 것과 같다. */
export function distinct(points: readonly Point[]): Point[] {
  const out: Point[] = [];
  for (const p of [...points].sort(byXY)) {
    const last = out.at(-1);
    if (last === undefined || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
}

const same = (p: Point, q: Point): boolean => p[0] === q[0] && p[1] === q[1];

/* ────────────────────────── 계측기 ────────────────────────── */

/**
 * 좌표 비교 횟수를 세는 합치기 정렬. 엔진의 정렬에 기대면 계수가 구현에 따라 갈려서, 비교
 * 횟수는 이 정렬로 센다(정본은 엔진의 정렬을 쓴다 — 순서는 같다).
 */
function sortCounted<T>(
  items: T[],
  less: (a: T, b: T) => boolean,
  seen: { compares: number },
): T[] {
  if (items.length <= 1) return items;
  const mid = items.length >> 1;
  const left = sortCounted(items.slice(0, mid), less, seen);
  const right = sortCounted(items.slice(mid), less, seen);
  const out: T[] = [];
  let at = 0;
  let to = 0;
  while (at < left.length && to < right.length) {
    seen.compares++;
    if (less(left[at] as T, right[to] as T)) out.push(left[at++] as T);
    else out.push(right[to++] as T);
  }
  while (at < left.length) out.push(left[at++] as T);
  while (to < right.length) out.push(right[to++] as T);
  return out;
}

/** 좌표 순서로 정렬할 때의 좌표 비교 횟수. 방향 판정은 한 번도 안 든다. */
function sortCompares(points: readonly Point[]): number {
  const seen = { compares: 0 };
  sortCounted(
    [...points],
    (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]),
    seen,
  );
  return seen.compares;
}

/** 합치기 정렬이 `n` 개를 정렬할 때 드는 비교의 최악값 `n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1`. */
const sortWorst = (n: number): number => {
  if (n <= 1) return 0;
  const k = Math.ceil(Math.log2(n));
  return n * k - 2 ** k + 1;
};

/** 방향 판정 횟수의 상한. `deep.math` 가 유도하는 식이다. */
const testBound = (m: number, h: number): number => 4 * m - h - 6;

/** 판정 한 번 — 사슬의 끝 두 점 `o`·`a` 와 담으려는 점, 그리고 판정값. */
export interface Test {
  readonly o: Point;
  readonly a: Point;
  readonly side: number;
}

/** 점 하나를 담는 걸음 — 그 사이의 판정 · 걷어낸 점 · 담은 뒤의 사슬. */
export interface Push {
  readonly p: Point;
  readonly tests: readonly Test[];
  readonly popped: readonly Point[];
  readonly after: readonly Point[];
}

/**
 * 정본의 `buildChain` 과 같은 절차를 걸음마다 기록한다. 걸음마다 사슬 전체를 베끼므로 **작은
 * 입력에만** 쓴다 — 큰 입력은 값만 세는 `counted` 로 잰다.
 */
export function chainEvents(seq: readonly Point[]): Push[] {
  const built: Point[] = [];
  const out: Push[] = [];
  for (const p of seq) {
    const tests: Test[] = [];
    const popped: Point[] = [];
    while (built.length >= 2) {
      const o = built.at(-2) as Point;
      const a = built.at(-1) as Point;
      const side = sideOf(o, a, p);
      tests.push({ o, a, side });
      if (side > 0) break;
      popped.push(built.pop() as Point);
    }
    built.push(p);
    out.push({ p, tests, popped, after: [...built] });
  }
  return out;
}

/** 값만 세는 한 번의 실행 — 기본 연산과 잡는 칸. 큰 입력에 쓴다. */
export interface Cost {
  readonly hull: Point[];
  readonly n: number;
  readonly m: number;
  readonly h: number;
  readonly sort: number;
  readonly dedup: number;
  readonly tests: number;
  readonly pops: number;
  readonly keeps: number;
  readonly lowerTests: number;
  readonly upperTests: number;
  /** 끝점을 떼기 전 두 사슬의 점 수의 합. */
  readonly chains: number;
  /** 판정값이 0 인 자리. */
  readonly zeros: number;
  /** 배정밀도 값이 `SAFE` 이하라 큰 정수로 되잰 판정. */
  readonly exact: number;
  /** 기본 연산 = 좌표 비교 + 방향 판정. */
  readonly ops: number;
  /** 추가로 잡는 칸 = n + 2m + h. */
  readonly cells: number;
}

/** 정본과 같은 값. 되재는 자리를 셀 때만 쓴다. */
const SAFE = 2048;

/** 정본과 같은 절차에 계수만 덧붙인 것. 답이 정본과 다르면 던진다. */
export function counted(points: readonly Point[]): Cost {
  const n = points.length;
  const sort = sortCompares(points);
  const uniq = distinct(points);
  const m = uniq.length;
  let tests = 0;
  let pops = 0;
  let keeps = 0;
  let zeros = 0;
  let exact = 0;
  const chain = (seq: Point[]): Point[] => {
    const built: Point[] = [];
    for (const p of seq) {
      while (built.length >= 2) {
        tests++;
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        const approx =
          (a[0] - o[0]) * (p[1] - o[1]) - (a[1] - o[1]) * (p[0] - o[0]);
        if (!(approx > SAFE || approx < -SAFE)) exact++;
        const s = sideOf(o, a, p);
        if (s === 0) zeros++;
        if (s > 0) {
          keeps++;
          break;
        }
        built.pop();
        pops++;
      }
      built.push(p);
    }
    return built;
  };
  let hull: Point[];
  let lowerTests = 0;
  let chains = 0;
  if (m <= 2) {
    hull = uniq;
  } else {
    const lower = chain(uniq);
    lowerTests = tests;
    const upper = chain([...uniq].reverse());
    chains = lower.length + upper.length;
    hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  }
  const want = convexHull([...points]);
  if (list(hull) !== list(want)) {
    throw new Error(`계측기와 정본의 답이 다르다 — 점 ${n} 개`);
  }
  const h = hull.length;
  return {
    hull,
    n,
    m,
    h,
    sort,
    dedup: n,
    tests,
    pops,
    keeps,
    lowerTests,
    upperTests: tests - lowerTests,
    chains,
    zeros,
    exact,
    ops: sort + n + tests,
    cells: n + 2 * m + h,
  };
}

/** 같은 입력의 계측을 여러 블록이 쓰므로 한 번만 잰다. */
const COSTS = new Map<Point[], Cost>();
export const costOf = (points: Point[]): Cost => {
  let got = COSTS.get(points);
  if (got === undefined) {
    got = counted(points);
    COSTS.set(points, got);
  }
  return got;
};

/**
 * 정의를 그대로 옮긴 방법 — 순서쌍마다 나머지 점이 전부 왼쪽인지 확인해 껍질의 변을 찾는다.
 *
 * 나머지가 전부 왼쪽이거나 직선 위이고 그중 하나라도 직선 밖이면 그 순서쌍이 껍질의 변이다.
 * 이 판정이 내는 것은 **변 위의 점 전부**라, 꼭짓점만 남기려면 규칙이 하나 더 든다. 같은 좌표는
 * 정본과 같이 정렬해 합친 뒤 판정한다 — 그 비용도 기본 연산에 든다.
 */
function byDefinition(points: readonly Point[]): {
  ops: number;
  tests: number;
  onEdge: Point[];
  edgePairs: number;
} {
  const uniq = distinct(points);
  const m = uniq.length;
  let tests = 0;
  let edgePairs = 0;
  const marked = new Set<number>();
  for (let a = 0; a < m; a++) {
    for (let b = 0; b < m; b++) {
      if (a === b) continue;
      let allLeft = true;
      let someStrict = false;
      for (let c = 0; c < m; c++) {
        if (c === a || c === b) continue;
        tests++;
        const s = sideOf(uniq[a] as Point, uniq[b] as Point, uniq[c] as Point);
        if (s < 0) {
          allLeft = false;
          break;
        }
        if (s > 0) someStrict = true;
      }
      if (allLeft && someStrict) {
        edgePairs++;
        marked.add(a);
        marked.add(b);
      }
    }
  }
  return {
    ops: sortCompares(points) + points.length + tests,
    tests,
    edgePairs,
    onEdge: [...marked].sort((x, y) => x - y).map((at) => uniq[at] as Point),
  };
}

const DEFS = new Map<Point[], ReturnType<typeof byDefinition>>();
const defOf = (points: Point[]) => {
  let got = DEFS.get(points);
  if (got === undefined) {
    got = byDefinition(points);
    DEFS.set(points, got);
  }
  return got;
};

/** 기준점에서 본 각도로 정렬할 때의 계수 — 비교마다 방향 판정이 붙는다. */
export function sortByAngle(points: readonly Point[]): {
  compares: number;
  tests: number;
} {
  let pivot = points[0] as Point;
  for (const p of points) {
    if (p[1] < pivot[1] || (p[1] === pivot[1] && p[0] < pivot[0])) pivot = p;
  }
  let skipped = false;
  const rest = points.filter((p) => {
    if (!skipped && p === pivot) {
      skipped = true;
      return false;
    }
    return true;
  });
  const seen = { compares: 0 };
  let tests = 0;
  const squared = (p: Point): number =>
    (p[0] - pivot[0]) ** 2 + (p[1] - pivot[1]) ** 2;
  sortCounted(
    rest,
    (a, b) => {
      tests++;
      const s = sideOf(pivot, a, b);
      if (s !== 0) return s > 0;
      return squared(a) <= squared(b);
    },
    seen,
  );
  return { compares: seen.compares, tests };
}

/** 점이 껍질의 변 위(꼭짓점 제외)에 있는가. */
function onHullEdge(p: Point, hull: readonly Point[]): boolean {
  for (let at = 0; at < hull.length; at++) {
    const a = hull[at] as Point;
    const b = hull[(at + 1) % hull.length] as Point;
    if (sideOf(a, b, p) !== 0) continue;
    const inX = Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]);
    const inY = Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]);
    if (inX && inY) return true;
  }
  return false;
}

/** 점 하나가 전개 입력의 껍질에서 맡는 자리. */
export function roleOf(p: Point, hull: readonly Point[]): string {
  if (hull.some((q) => same(p, q))) return "꼭짓점";
  return onHullEdge(p, hull) ? "변 위의 공선 중간 점" : "껍질 안쪽";
}

/* ────────────────────────── 전개 입력의 기록 ────────────────────────── */

/** 입력 순서 그대로 정렬한 목록(같은 좌표가 남아 있다). */
export const WALK_SORTED: Point[] = [...WALK].sort(byXY);
/** 정렬해 같은 좌표를 합친 목록 — 두 사슬이 이 목록을 차례로 읽는다. */
export const WALK_UNIQ: Point[] = distinct(WALK);
/** 아래 사슬 — 정렬 순서대로 읽는다. */
export const LOWER: Push[] = chainEvents(WALK_UNIQ);
/** 위 사슬 — 정렬 순서를 거꾸로 읽는다. */
export const UPPER: Push[] = chainEvents([...WALK_UNIQ].reverse());
/** 정본의 답. */
export const HULL: Point[] = convexHull(WALK);

const LOWER_CHAIN = (LOWER.at(-1) as Push).after;
const UPPER_CHAIN = (UPPER.at(-1) as Push).after;
if (
  list(LOWER_CHAIN.slice(0, -1).concat(UPPER_CHAIN.slice(0, -1))) !== list(HULL)
) {
  throw new Error("기록한 두 사슬을 이은 것이 정본의 답과 다르다");
}

/** 판정 한 번을 조건식으로 — 「sideOf((0,0), (0,3), (3,0)) = -1」. */
const testText = (t: Test, p: Point): string =>
  `sideOf(${pt(t.o)}, ${pt(t.a)}, ${pt(p)}) = ${t.side}`;

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { convexHull: (points: Point[]) => Point[] };

const REF = new URL("./convexHull-guide.ref.ts", import.meta.url).pathname;

const SORT_LINE = /\.sort\(\(p, q\) => p\[0\] - q\[0\] \|\| p\[1\] - q\[1\]\)/;
const FILTER_LINE =
  /if \(approx > SAFE \|\| approx < -SAFE\) return approx > 0 \? 1 : -1;/;
const POP_LINE = /turnAtEnd\(chain, p\) <= 0/;
const DROP_LINE = /^ {2}lower\.pop\(\);$/;

/** 정렬을 `x` 만으로 하는 사본. 같은 `x` 안의 순서가 입력 순서에 딸린다. */
const sortByXOnly = await loadMutant<Impl>(REF, {
  swap: [SORT_LINE, ".sort((p, q) => p[0] - q[0])"],
});

/** 방향 판정을 배정밀도 곱 하나로만 끝내는 사본. */
const floatOnly = await loadMutant<Impl>(REF, {
  swap: [FILTER_LINE, "if (true) return approx > 0 ? 1 : approx < 0 ? -1 : 0;"],
});

/** 한 직선 위인 점을 걷어내지 않는 사본. 불변식을 지키던 바로 그 줄이다. */
const keepCollinear = await loadMutant<Impl>(REF, {
  swap: [POP_LINE, "turnAtEnd(chain, p) < 0"],
});

/** 아래 사슬의 마지막 점을 떼지 않는 사본. */
const keepBothEnds = await loadMutant<Impl>(REF, { drop: DROP_LINE });

/**
 * 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다. 다만 `check-proof` 가 변이를
 * **중화한 채**(정본을 그대로 돌려받아) 한 번 더 부르므로, 그때는 이 검사를 건너뛴다 — 중화 여부는
 * 값에서 안다(변이 모듈의 함수가 정본과 같은 객체인가).
 */
function assertBreaks(impl: Impl, gaps: number[]): void {
  if (impl.convexHull === convexHull) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 변이의 답을 나란히 놓은 표를 만든다. */
function contrast(
  cases: [string, Point[]][],
  impl: Impl,
  otherHead: string,
): string {
  const gaps: number[] = [];
  const rows = cases.map(([label, points]) => {
    const bare = convexHull(points);
    const got = impl.convexHull(points);
    const alike = list(bare) === list(got);
    gaps.push(alike ? 0 : 1);
    return [label, list(bare), list(got), alike ? "같다" : "어긋난다"];
  });
  assertBreaks(impl, gaps);
  return md(["입력", "정본의 답", otherHead, "대조"], rows);
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 전개 입력의 점마다 껍질에서 맡는 자리. */
  "concept-drop": () => {
    const rows = WALK_UNIQ.map((p) => [pt(p), roleOf(p, HULL)]);
    const dup = WALK.length - WALK_UNIQ.length;
    return [
      md(["점", "껍질에서의 자리"], rows),
      "",
      `입력 ${WALK.length} 개 가운데 같은 좌표가 ${dup} 개라 서로 다른 점은 ${WALK_UNIQ.length} 개이고, 볼록 껍질의 꼭짓점은 반시계 방향으로 ${list(HULL)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 정의를 그대로 옮긴 방법의 기본 연산. */
  "origin-naive": () => {
    const rows = (
      [
        ["전개 입력", WALK],
        ["흩어진 점 100 개", scattered(100)],
        ["흩어진 점 1,000 개", scattered(1_000)],
      ] as [string, Point[]][]
    ).map(([label, points]) => {
      const d = defOf(points);
      return [
        label,
        num(distinct(points).length),
        num(d.ops),
        `${(d.ops / PER_SECOND).toFixed(3)} 초`,
      ];
    });
    const small = defOf(scattered(100)).ops;
    const large = defOf(scattered(1_000)).ops;
    const cube = LIMIT * (LIMIT - 1) * (LIMIT - 2);
    const days = cube / PER_SECOND / 86_400;
    return [
      md(
        ["입력", "서로 다른 점 m", "기본 연산", "시간(초당 1 억 번)"],
        rows,
        [1, 2, 3],
      ),
      "",
      `점이 100 개에서 1,000 개로 열 배가 되자 기본 연산은 ${(large / small).toFixed(1)} 배가 됐습니다. 가지치기 없이 센 방향 판정 m(m−1)(m−2) 에 m = ${num(LIMIT)} 을 넣으면 ${num(cube)} 번이고, 초당 1 억 번으로 ${num(Math.round(days))} 일입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 그 방법이 내는 점. */
  "origin-naive-answer": () => {
    const d = defOf(WALK);
    const extra = d.onEdge.filter((p) => !HULL.some((q) => same(p, q)));
    return [
      md(
        ["무엇", "점"],
        [
          ["정의대로 판정한 변의 두 끝", list(d.onEdge)],
          ["볼록 껍질의 꼭짓점", list(HULL)],
          ["섞여 든 점", list(extra)],
        ],
      ),
      "",
      `껍질의 변으로 잡힌 순서쌍은 ${d.edgePairs} 개인데 껍질의 변은 ${HULL.length} 개입니다. 섞여 든 ${list(extra)}${josa(tail(extra[0] as Point), "은", "는")} 변 위의 공선 중간 점이라 변 두 개의 끝으로 잡혔습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 좌표 순서로 늘어놓은 전개 입력. */
  "origin-sorted": () => {
    const rows = WALK_UNIQ.map((p, at) => [String(at), pt(p), roleOf(p, HULL)]);
    const first = WALK_UNIQ[0] as Point;
    const last = WALK_UNIQ.at(-1) as Point;
    return [
      md(["정렬 순서", "점", "껍질에서의 자리"], rows, [0]),
      "",
      `맨 앞 ${pt(first)}${과와Point(first)} 맨 뒤 ${pt(last)}${이가(tail(last))} 둘 다 꼭짓점입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 정렬 기준 두 후보를 같은 입력에서 잰다. */
  "origin-sort-basis": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["흩어진 점 1,000 개", scattered(1_000)],
      ["흩어진 점 100,000 개", scattered(LIMIT)],
    ];
    const rows = cases.map(([label, points]) => {
      const byAngle = sortByAngle(points);
      return [
        label,
        num(sortCompares(points)),
        "0",
        num(byAngle.compares),
        num(byAngle.tests),
      ];
    });
    const big = sortByAngle(scattered(LIMIT));
    return [
      md(
        [
          "입력",
          "좌표 정렬의 좌표 비교",
          "좌표 정렬의 방향 판정",
          "각도 정렬의 비교",
          "각도 정렬의 방향 판정",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `점 ${num(LIMIT)} 개에서 각도 정렬은 정렬하는 동안에만 방향 판정을 ${num(big.tests)} 번 씁니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 사슬을 하나만 쌓으면. */
  "origin-one-chain": () => {
    const missing = HULL.filter((p) => !LOWER_CHAIN.some((q) => same(p, q)));
    if (missing.length === 0) {
      throw new Error(
        "사슬 하나로도 답이 나왔다 — 「절반만 나온다」가 거짓이다",
      );
    }
    return [
      md(
        ["무엇", "점"],
        [
          ["왼쪽에서 오른쪽으로 쌓은 사슬 하나", list(LOWER_CHAIN)],
          ["볼록 껍질의 꼭짓점", list(HULL)],
          ["사슬 하나가 놓친 꼭짓점", list(missing)],
        ],
      ),
      "",
      `놓친 ${list(missing)}${josa(tail(missing.at(-1) as Point), "은", "는")} 둘 다 껍질의 위쪽 경계에 있습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 방향을 바꿔 한 번 더 쌓으면. */
  "origin-two-chains": () => {
    const big = costOf(scattered(LIMIT));
    const cube = LIMIT * (LIMIT - 1) * (LIMIT - 2);
    return [
      md(
        ["무엇", "점"],
        [
          ["왼쪽에서 오른쪽으로 쌓은 사슬", list(LOWER_CHAIN)],
          ["오른쪽에서 왼쪽으로 쌓은 사슬", list(UPPER_CHAIN)],
          [
            "두 사슬의 마지막 점을 떼고 이은 것",
            list(LOWER_CHAIN.slice(0, -1).concat(UPPER_CHAIN.slice(0, -1))),
          ],
          ["볼록 껍질의 꼭짓점", list(HULL)],
        ],
      ),
      "",
      `흩어진 점 ${num(LIMIT)} 개에서 이 방법의 기본 연산은 ${num(big.ops)} 번이고 초당 1 억 번으로 ${(big.ops / PER_SECOND).toFixed(3)} 초입니다. 정의를 그대로 옮긴 방법은 방향 판정만 ${num(cube)} 번입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 정렬하고 같은 좌표를 합친다. */
  "build-sort": () =>
    [
      md(
        ["차례", "점 목록", "점 수"],
        [
          ["입력", list(WALK), String(WALK.length)],
          ["좌표 순서로 정렬한 뒤", list(WALK_SORTED), String(WALK.length)],
          ["같은 좌표를 합친 뒤", list(WALK_UNIQ), String(WALK_UNIQ.length)],
        ],
        [2],
      ),
      "",
      `정렬한 목록에서 같은 좌표는 이웃하므로 바로 앞 점과만 비교해 ${WALK.length - WALK_UNIQ.length} 개를 지웠습니다.`,
    ].join("\n"),

  /** `deep.build` 2단계 — 전개 입력의 세 점 묶음에 방향 판정을 건다. */
  "build-side": () => {
    const triples: [Point, Point, Point][] = [
      [
        [0, 0],
        [3, 0],
        [3, 2],
      ],
      [
        [0, 0],
        [0, 3],
        [3, 0],
      ],
      [
        [3, 0],
        [3, 2],
        [3, 4],
      ],
    ];
    const rows = triples.map(([o, a, b]) => {
      const value =
        (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const s = sideOf(o, a, b);
      return [
        `${pt(o)} → ${pt(a)} → ${pt(b)}`,
        String(value),
        String(s),
        turnWord(s),
      ];
    });
    return [
      md(["세 점 o → a → b", "외적 값", "sideOf", "뜻"], rows, [1, 2]),
    ].join("\n");
  },

  /** `deep.build` (c) — 두 사슬을 이웃한 세 점마다 읽는다. */
  "build-chain-read": () => {
    const rows: string[][] = [];
    for (const [name, chain] of [
      ["아래 사슬", LOWER_CHAIN],
      ["위 사슬", UPPER_CHAIN],
    ] as [string, readonly Point[]][]) {
      for (let at = 2; at < chain.length; at++) {
        const o = chain[at - 2] as Point;
        const a = chain[at - 1] as Point;
        const b = chain[at] as Point;
        const s = sideOf(o, a, b);
        rows.push([
          name,
          `${pt(o)} → ${pt(a)} → ${pt(b)}`,
          String(s),
          turnWord(s),
        ]);
      }
    }
    if (rows.some((r) => r[2] !== "1")) {
      throw new Error("사슬 안에 왼쪽 꺾임이 아닌 자리가 있다");
    }
    return [
      md(["사슬", "이웃한 세 점", "sideOf", "뜻"], rows, [2]),
      "",
      `이웃한 세 점 ${rows.length} 묶음이 모두 왼쪽으로 꺾입니다.`,
    ].join("\n");
  },

  /** `deep.build` (d) — 두 사슬의 끝점과 점 수. */
  "build-chain-ends": () => {
    const rows = (
      [
        ["아래 사슬", LOWER_CHAIN],
        ["위 사슬", UPPER_CHAIN],
      ] as [string, readonly Point[]][]
    ).map(([name, chain]) => [
      name,
      pt(chain[0] as Point),
      pt(chain.at(-1) as Point),
      String(chain.length),
    ]);
    const total = LOWER_CHAIN.length + UPPER_CHAIN.length;
    return [
      md(["사슬", "첫 점", "끝 점", "점 수"], rows, [3]),
      "",
      `두 사슬의 점 수를 더하면 ${total} 개이고, 꼭짓점 ${HULL.length} 개보다 ${total - HULL.length} 개 많습니다.`,
    ].join("\n");
  },

  /** `deep.build` (e) — 정렬 순서로 모든 점을 이은 꺾은선과의 차이. */
  "build-polyline": () => {
    const rows: string[][] = [];
    const tally = { left: 0, right: 0, zero: 0 };
    for (let at = 2; at < WALK_UNIQ.length; at++) {
      const o = WALK_UNIQ[at - 2] as Point;
      const a = WALK_UNIQ[at - 1] as Point;
      const b = WALK_UNIQ[at] as Point;
      const s = sideOf(o, a, b);
      if (s > 0) tally.left++;
      else if (s < 0) tally.right++;
      else tally.zero++;
      rows.push([`${pt(o)} → ${pt(a)} → ${pt(b)}`, String(s), turnWord(s)]);
    }
    return [
      md(["이웃한 세 점", "sideOf", "뜻"], rows, [1]),
      "",
      `이웃한 세 점 ${rows.length} 묶음 가운데 왼쪽 꺾임이 ${tally.left} 곳, 오른쪽 꺾임이 ${tally.right} 곳, 한 직선 위가 ${tally.zero} 곳입니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 아래 사슬이 쌓이는 걸음. */
  "build-lower": () => chainTable(LOWER),

  /** `deep.build` 4단계 — 위 사슬이 쌓이는 걸음. */
  "build-upper": () => chainTable(UPPER),

  /** `deep.build` 5단계 — 두 사슬의 끝점을 떼고 잇는다. */
  "build-join": () => {
    const joined = LOWER_CHAIN.slice(0, -1).concat(UPPER_CHAIN.slice(0, -1));
    return [
      md(
        ["사슬", "떼기 전", "마지막 점을 뗀 뒤"],
        [
          ["아래 사슬", list(LOWER_CHAIN), list(LOWER_CHAIN.slice(0, -1))],
          ["위 사슬", list(UPPER_CHAIN), list(UPPER_CHAIN.slice(0, -1))],
        ],
      ),
      "",
      `뗀 뒤의 두 사슬을 이으면 ${list(joined)} 이고, 정본의 답과 같습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () =>
    [
      `const points: Point[] = ${code(WALK)};`,
      `// 이 절이 끝나면 ${code(HULL)} 이 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 정렬과 합치기, 그리고 ① 이 참이 되는 입력. */
  "walk-sort": () => {
    const cases: Point[][] = [
      [[3, 7]],
      [
        [0, 0],
        [5, 5],
      ],
      [
        [2, 2],
        [2, 2],
        [2, 2],
      ],
    ];
    const call = (ps: Point[]) => `convexHull(${code(ps)})`;
    const width = Math.max(...cases.map((c) => call(c).length));
    return [
      `정렬 전  ${list(WALK)}`,
      `정렬 후  ${list(WALK_SORTED)}`,
      `합친 뒤  ${list(WALK_UNIQ)}`,
      "",
      "① 이 참이 되는 입력",
      ...cases.map(
        (c) =>
          `  ${call(c).padEnd(width)}  서로 다른 점 ${distinct(c).length} 개  답 ${code(convexHull(c))}`,
      ),
    ].join("\n");
  },

  /** 첫 번째 짚고 가기 — `x` 만으로 정렬하면. */
  "pause-x-only": () =>
    [
      contrast(
        [
          ["전개 입력", WALK],
          ["세로로 늘어선 넷", VERTICAL],
        ],
        sortByXOnly,
        "x 만 정렬한 답",
      ),
      "",
      `전개 입력을 x 만으로 정렬하면 ${list([...WALK].sort((p, q) => p[0] - q[0]))} 이고, x 와 y 를 함께 쓰면 ${list(WALK_SORTED)} 입니다.`,
    ].join("\n"),

  /** `deep.walk` 2 — `sideOf` 를 전개 입력의 세 점 묶음에. */
  "walk-side": () => {
    const calls: [Point, Point, Point][] = [
      [
        [0, 0],
        [0, 3],
        [3, 0],
      ],
      [
        [0, 0],
        [3, 0],
        [3, 2],
      ],
      [
        [0, 0],
        [3, 0],
        [6, 0],
      ],
    ];
    const text = (c: [Point, Point, Point]) =>
      `sideOf(${c.map((p) => `[${p[0]}, ${p[1]}]`).join(", ")})`;
    const width = Math.max(...calls.map((c) => text(c).length));
    return [
      ...calls.map((c) => `${text(c).padEnd(width)}  →  ${sideOf(...c)}`),
    ].join("\n");
  },

  /** 두 번째 짚고 가기 — 아래 사슬의 끝점을 안 떼면. */
  "pause-join": () =>
    [
      contrast(
        [
          ["전개 입력", WALK],
          ["변 위에 점이 있는 사각형", ON_EDGE],
        ],
        keepBothEnds,
        "아래 사슬의 끝점을 안 뗀 답",
      ),
    ].join("\n"),

  /** `deep.walk` 5 — 열여섯 걸음의 조건 판정과 상태. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let step = 1;
    rows.push([
      `T${step++}`,
      "정렬 · 합치기",
      "—",
      `서로 다른 점 ${WALK_UNIQ.length} 개 · \`uniq.length <= 2\` 가 **거짓**`,
      "—",
      list(WALK_UNIQ),
    ]);
    const add = (events: Push[], label: string) => {
      for (const e of events) {
        const conds = e.tests.map(
          (t) =>
            `${testText(t, e.p)} → ${t.side <= 0 ? "**참**, 걷어냄" : "**거짓**, 멈춤"}`,
        );
        if (e.tests.length === 0 || (e.tests.at(-1) as Test).side <= 0) {
          conds.push(
            `사슬 ${e.after.length - 1} 점 → \`chain.length >= 2\` 가 **거짓**`,
          );
        }
        rows.push([
          `T${step++}`,
          label,
          pt(e.p),
          conds.join("; "),
          e.popped.length === 0 ? "—" : list(e.popped),
          list(e.after),
        ]);
      }
    };
    add(LOWER, "아래 사슬");
    add(UPPER, "위 사슬");
    rows.push([
      `T${step++}`,
      "끝점을 떼고 잇기",
      "—",
      `${pt(LOWER_CHAIN.at(-1) as Point)} · ${pt(UPPER_CHAIN.at(-1) as Point)}${을를(tail(UPPER_CHAIN.at(-1) as Point))} 뗀다`,
      "—",
      list(HULL),
    ]);
    const c = costOf(WALK);
    return [
      md(
        [
          "걸음",
          "하는 일",
          "담으려는 점",
          "조건 판정",
          "걷어낸 점",
          "그 뒤의 사슬",
        ],
        rows,
      ),
      "",
      `방향 판정은 ${c.tests} 번이고, 그중 ${c.pops} 번이 걷어내기 · ${c.keeps} 번이 유지로 끝났습니다. 판정값이 0 인 자리가 ${c.zeros} 곳이고, 배정밀도 값이 SAFE 이하라 큰 정수로 되잰 판정이 ${c.exact} 번입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 5 — 갈래마다 실행된 횟수. */
  "walk-branches": () => {
    const c = costOf(WALK);
    const fast = c.tests - c.exact;
    return [
      md(
        ["갈래", "조건", "참", "거짓"],
        [
          ["①", "서로 다른 점이 둘 이하", "0", "1"],
          ["②", "배정밀도 값이 SAFE 보다 크다", String(fast), String(c.exact)],
          ["③", "②가 거짓이라 큰 정수로 되잰다", String(c.exact), "—"],
          [
            "④",
            "끝 두 점과 새 점이 왼쪽으로 안 꺾인다",
            String(c.pops),
            String(c.keeps),
          ],
          ["⑤", "두 사슬의 마지막 점을 뗀다", "1", "—"],
        ],
        [2, 3],
      ),
    ].join("\n");
  },

  /** 세 번째 짚고 가기 — 배정밀도 곱만으로 부호를 정하면. */
  "pause-float": () => {
    const bare = convexHull(CORNERS);
    const loose = floatOnly.convexHull(CORNERS);
    const live = floatOnly.convexHull !== convexHull;
    if (live && list(bare) !== list(loose)) {
      throw new Error("네 모서리에서 배정밀도 전용 사본이 다른 답을 냈다");
    }
    const o = SHALLOW[0] as Point;
    const a = SHALLOW[1] as Point;
    const b = SHALLOW[2] as Point;
    const ux = a[0] - o[0];
    const uy = a[1] - o[1];
    const vx = b[0] - o[0];
    const vy = b[1] - o[1];
    const approx = ux * vy - uy * vx;
    const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
    return [
      contrast(
        [
          ["전개 입력", WALK],
          ["좌표가 상한에 붙은 넷", SHALLOW],
        ],
        floatOnly,
        "배정밀도 곱만 쓴 답",
      ),
      "",
      `좌표 상한의 네 모서리와 가운데 점에서는 둘 다 꼭짓점 ${bare.length} 개로 같습니다. 어긋난 입력의 세 점 ${pt(o)} → ${pt(a)} → ${pt(b)} 을 두 방식으로 재면 이렇습니다.`,
      "",
      md(
        ["항", "큰 정수로", "배정밀도로"],
        [
          ["앞의 곱 ux · vy", num(BigInt(ux) * BigInt(vy)), num(ux * vy)],
          ["뒤의 곱 uy · vx", num(BigInt(uy) * BigInt(vx)), num(uy * vx)],
          ["둘의 차", num(exact), num(approx)],
        ],
        [1, 2],
      ),
      "",
      `배정밀도가 정수를 오차 없이 담는 한계 Number.MAX_SAFE_INTEGER 는 ${num(Number.MAX_SAFE_INTEGER)} 이고, 두 곱은 그보다 큽니다. 배정밀도는 차를 ${num(approx)}${으로(num(approx))} 내서 한 직선 위라고 답하고, 큰 정수는 ${num(exact)}${을를(num(exact))} 내서 왼쪽으로 꺾인다고 답합니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` 아래 — 전체 코드를 몇 입력에 부른다. */
  "final-calls": () => {
    const cases: Point[][] = [WALK, ON_EDGE, COLLINEAR, [[3, 7]], []];
    const call = (ps: Point[]) => `convexHull(${JSON.stringify(ps)})`;
    const width = Math.max(...cases.map((c) => call(c).length));
    return [
      ...cases.map(
        (c) => `${call(c).padEnd(width)}  ->  ${JSON.stringify(convexHull(c))}`,
      ),
    ].join("\n");
  },

  /** `related` — 담기와 걷어내기의 총수. */
  "related-stack": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["흩어진 점 1,000 개", scattered(1_000)],
      ["흩어진 점 100,000 개", scattered(LIMIT)],
    ];
    const rows = cases.map(([label, points]) => {
      const c = costOf(points);
      // 두 사슬이 서로 다른 점을 한 번씩 담으므로 담기 총수는 서로 다른 점의 두 배다.
      const pushes = 2 * c.m;
      if (pushes - c.pops !== c.chains) {
        throw new Error("담기 − 걷어내기가 두 사슬에 남은 점 수와 다르다");
      }
      return [
        label,
        num(pushes),
        num(c.pops),
        num(pushes - c.pops),
        num(c.chains),
      ];
    });
    return [
      md(
        ["입력", "담기", "걷어내기", "담기 − 걷어내기", "두 사슬에 남은 점"],
        rows,
        [1, 2, 3, 4],
      ),
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 확인한다. */
  "math-check": () => {
    const cases: [Point, Point, Point][] = [
      [
        [0, 0],
        [6, 0],
        [6, 3],
      ],
      [
        [6, 3],
        [3, 4],
        [0, 3],
      ],
      [
        [3, 4],
        [3, 0],
        [0, 3],
      ],
      [
        [0, 0],
        [3, 0],
        [6, 0],
      ],
    ];
    const rows = cases.map(([o, a, b]) => {
      const ux = a[0] - o[0];
      const uy = a[1] - o[1];
      const vx = b[0] - o[0];
      const vy = b[1] - o[1];
      const value = ux * vy - uy * vx;
      return [
        `${pt(o)} → ${pt(a)} → ${pt(b)}`,
        `${paren(ux)}·${paren(vy)} − ${paren(uy)}·${paren(vx)}`,
        String(value),
        String(sideOf(o, a, b)),
      ];
    });
    return [
      md(["세 점 o → a → b", "식에 넣은 값", "cross", "sideOf"], rows, [2, 3]),
    ].join("\n");
  },

  /** `deep.math` ③④ — 방향 판정 상한을 규모별로 대조한다. */
  "math-bound": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["변 위에 점이 있는 사각형", ON_EDGE],
      ["한 직선 위의 넷", COLLINEAR],
      ["흩어진 점 1,000 개", scattered(1_000)],
      ["흩어진 점 100,000 개", scattered(LIMIT)],
    ];
    const rows = cases.map(([label, points]) => {
      const c = costOf(points);
      return [
        label,
        num(c.m),
        num(c.h),
        num(c.pops),
        num(c.keeps),
        num(c.tests),
        num(testBound(c.m, c.h)),
      ];
    });
    return [
      md(
        ["입력", "m", "h", "걷어냄", "유지", "방향 판정", "4m − h − 6"],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
    ].join("\n");
  },

  /** `deep.math` — 배정밀도 오차의 한계와 실측 최대 편차. */
  "math-error": () => {
    const rnd = makeRnd(20_260_904);
    const spread = (): number => (rnd() % (2 * COORD + 1)) - COORD;
    const rounds = 300_000;
    let worst = 0n;
    for (let round = 0; round < rounds; round++) {
      const ux = spread() - spread();
      const uy = spread() - spread();
      const vx = spread() - spread();
      const vy = spread() - spread();
      const approx = ux * vy - uy * vx;
      const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
      const gap = exact - BigInt(approx);
      const size = gap < 0n ? -gap : gap;
      if (size > worst) worst = size;
    }
    const bound = (c: number): number => (c * c) / 2 ** 49;
    const rows = [1_000_000, 10_000_000, 100_000_000, COORD].map((c) => [
      num(c),
      bound(c).toFixed(6),
      bound(c) < 1 ? "필요 없다" : "필요하다",
    ]);
    // 한계가 1 을 넘기 시작하는 자리를 이분 탐색으로 찾는다.
    let lo = 1;
    let hi = COORD;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (bound(mid) < 1) lo = mid;
      else hi = mid - 1;
    }
    if (bound(COORD) >= SAFE) {
      throw new Error("오차 한계가 SAFE 를 넘는다 — 정본의 하한이 모자란다");
    }
    return [
      md(
        ["좌표 상한 C", "오차 한계 C² / 2^49", "큰 정수 되재기"],
        rows,
        [0, 1],
      ),
      "",
      `한계가 1 보다 작은 가장 큰 좌표 상한은 ${num(lo)} 이고(한계 ${bound(lo).toFixed(9)}), 그 다음 값 ${num(lo + 1)} 에서 한계가 ${bound(lo + 1).toFixed(9)} 입니다. 좌표 상한 ${num(COORD)} 에서 무작위 네 성분 ${num(rounds)} 벌을 재 본 실제 최대 편차는 ${worst} 이고, 정본의 SAFE 는 ${num(SAFE)} 입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 아래 사슬이 왼쪽 꺾임만 갖는가. */
  "invariant-states": () => {
    const rows = LOWER.map((e) => {
      const turns: string[] = [];
      for (let at = 2; at < e.after.length; at++) {
        turns.push(
          String(
            sideOf(
              e.after[at - 2] as Point,
              e.after[at - 1] as Point,
              e.after[at] as Point,
            ),
          ),
        );
      }
      const ok = turns.every((t) => t === "1");
      if (!ok) throw new Error("사슬 안에 왼쪽 꺾임이 아닌 자리가 있다");
      return [
        pt(e.p),
        e.popped.length === 0 ? "—" : list(e.popped),
        list(e.after),
        turns.length === 0 ? "잴 셋이 없다" : turns.join(" "),
      ];
    });
    return [
      md(
        ["담은 점", "걷어낸 점", "담은 직후의 사슬", "이웃한 세 점의 sideOf"],
        rows,
      ),
      "",
      `${LOWER.length} 걸음 모두 담은 직후의 사슬에 1 이 아닌 판정값이 없습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걷어낸 점이 어느 쪽에 있었는가. */
  "invariant-dropped": () => {
    const rows: string[][] = [];
    const add = (events: Push[], name: string) => {
      for (const e of events) {
        // 걷어낸 점마다, 그 점을 걷어낸 판정의 `o` 와 새 점 `p` 를 이은 선분에 대한 자리.
        for (const t of e.tests) {
          if (t.side > 0) continue;
          const s = sideOf(t.o, e.p, t.a);
          rows.push([
            name,
            pt(t.a),
            `${pt(t.o)} → ${pt(e.p)}`,
            String(s),
            s > 0 ? "왼쪽" : s < 0 ? "오른쪽" : "선분 위",
          ]);
        }
      }
    };
    add(LOWER, "아래 사슬");
    add(UPPER, "위 사슬");
    if (rows.some((r) => r[3] === "-1")) {
      throw new Error("걷어낸 점이 선분의 오른쪽에 있다");
    }
    const alive = WALK_UNIQ.filter(
      (q) => HULL.some((h) => same(h, q)) && rows.some(([, p]) => p === pt(q)),
    );
    return [
      md(
        ["사슬", "걷어낸 점", "o → p", "sideOf(o, p, 걷어낸 점)", "자리"],
        rows,
        [3],
      ),
      "",
      `걷어낸 점 ${rows.length} 개가 모두 선분 o → p 의 왼쪽이나 선분 위에 있습니다. 그중 ${list(alive)}${josa(tail(alive.at(-1) as Point), "은", "는")} 한 사슬에서 걷어내졌지만 다른 사슬에 남아 답에 듭니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, Point[]][] = [
      ["점이 없다", []],
      ["점이 하나", [[3, 7]]],
      [
        "점이 둘",
        [
          [0, 0],
          [5, 5],
        ],
      ],
      [
        "같은 좌표 셋",
        [
          [2, 2],
          [2, 2],
          [2, 2],
        ],
      ],
      ["한 직선 위의 넷", COLLINEAR],
      ["변 위에 점이 있는 사각형", ON_EDGE],
      ["좌표 상한의 네 모서리와 가운데", CORNERS],
    ];
    const rows = cases.map(([label, points]) => {
      const c = costOf(points);
      return [label, String(points.length), String(c.m), list(c.hull)];
    });
    return [md(["입력", "점", "서로 다른 점", "답"], rows, [1, 2])].join("\n");
  },

  /** `invariant` ③ — 한 직선 위인 점을 걷어내지 않으면. */
  "mutant-keep-collinear": () =>
    [
      contrast(
        [
          ["전개 입력", WALK],
          ["변 위에 점이 있는 사각형", ON_EDGE],
          ["한 직선 위의 넷", COLLINEAR],
        ],
        keepCollinear,
        "판정값이 0 인 점을 남긴 답",
      ),
    ].join("\n"),

  /** `perf.derive` — 전개 입력의 기본 연산을 걸음별로 가른다. */
  "perf-count": () => {
    const c = costOf(WALK);
    const rows = [
      ["좌표로 정렬한다", "T1", num(c.sort), num(sortWorst(c.n))],
      ["같은 좌표를 확인한다", "T1", num(c.dedup), num(c.n)],
      [
        "아래 사슬의 방향 판정",
        `T2~T${1 + LOWER.length}`,
        num(c.lowerTests),
        "—",
      ],
      [
        "위 사슬의 방향 판정",
        `T${2 + LOWER.length}~T${1 + LOWER.length + UPPER.length}`,
        num(c.upperTests),
        "—",
      ],
      ["끝점을 떼고 잇는다", `T${2 + LOWER.length + UPPER.length}`, "0", "0"],
    ];
    const bound = sortWorst(c.n) + c.n + testBound(c.m, c.h);
    return [
      md(["하는 일", "걸음", "실측", "상한"], rows, [2, 3]),
      "",
      `방향 판정 두 줄의 합 ${c.tests} 번의 상한은 4m − h − 6 = ${testBound(c.m, c.h)} 입니다. 실측 합계는 ${c.ops} 번이고, 세 항의 상한을 더하면 ${bound} 번입니다.`,
    ].join("\n");
  },

  /** `perf.bounds` — 총식에 규모를 넣는다. */
  "perf-total": () => {
    const rows = [
      ["전개 입력", WALK],
      ["흩어진 점 100,000 개", scattered(LIMIT)],
    ].map(([label, points]) => {
      const c = costOf(points as Point[]);
      const bound = sortWorst(c.n) + c.n + testBound(c.m, c.h);
      return [
        label as string,
        num(c.n),
        num(sortWorst(c.n)),
        num(c.n),
        num(testBound(c.m, c.h)),
        num(bound),
        num(c.ops),
        num(c.cells),
      ];
    });
    return [
      md(
        [
          "입력",
          "n",
          "정렬 비교 상한",
          "같은 좌표 확인",
          "방향 판정 상한",
          "기본 연산 상한",
          "기본 연산 실측",
          "잡는 칸",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7],
      ),
    ].join("\n");
  },

  /** `perf.bounds` — 이미 정렬된 입력에서도 정렬 비교는 n log n 규모다. */
  "perf-sorted-input": () => {
    const shuffled = scattered(LIMIT);
    const sorted = distinct(shuffled);
    const a = sortCompares(shuffled);
    const b = sortCompares(sorted);
    return [
      md(
        ["입력 순서", "점", "좌표 비교"],
        [
          ["흩어진 그대로", num(shuffled.length), num(a)],
          ["이미 좌표 순서", num(sorted.length), num(b)],
        ],
        [1, 2],
      ),
    ].join("\n");
  },

  /** `perf.worst` — 어떤 모양이 방향 판정을 가장 많이 쓰는가. */
  "worst-shape": () => {
    const total = LIMIT;
    const shapes: [string, Point[]][] = [
      ["흩어진 점", scattered(total)],
      [
        "원 둘레 위",
        Array.from(
          { length: total },
          (_, at) =>
            [
              Math.round(COORD * Math.cos((2 * Math.PI * at) / total)),
              Math.round(COORD * Math.sin((2 * Math.PI * at) / total)),
            ] as Point,
        ),
      ],
      [
        "한 직선 위",
        Array.from({ length: total }, (_, at) => [at, 2 * at] as Point),
      ],
      [
        "가운데가 오목한 V",
        Array.from(
          { length: total },
          (_, at) => [at, Math.abs(at - total / 2)] as Point,
        ),
      ],
      [
        "x 는 오름차순, y 는 무작위",
        (() => {
          const rnd = makeRnd(7);
          return Array.from(
            { length: total },
            (_, at) => [at, rnd() % 1_000_000] as Point,
          );
        })(),
      ],
    ];
    const measured = shapes.map(([label, points]) => ({
      label,
      c: costOf(points),
    }));
    const rows = measured.map(({ label, c }) => [
      label,
      num(c.m),
      num(c.h),
      num(c.tests),
      num(testBound(c.m, c.h)),
      (c.tests / testBound(c.m, c.h)).toFixed(3),
      num(c.cells),
    ]);
    const byTests = measured.reduce((x, y) => (y.c.tests > x.c.tests ? y : x));
    const byCells = measured.reduce((x, y) => (y.c.cells > x.c.cells ? y : x));
    const line = measured.find((x) => x.label === "한 직선 위") as {
      c: Cost;
    };
    return [
      md(
        ["모양", "m", "h", "방향 판정", "4m − h − 6", "비율", "잡는 칸"],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `방향 판정이 가장 많은 모양은 ${byTests.label}(${num(byTests.c.tests)} 번)이고, 잡는 칸이 가장 많은 모양은 ${byCells.label}(${num(byCells.c.cells)} 칸)입니다. 한 직선 위의 점은 방향 판정이 상한의 ${(line.c.tests / testBound(line.c.m, line.c.h)).toFixed(3)} 배에 그칩니다.`,
    ].join("\n");
  },

  /** `selfcheck` — 판정값이 0 인 점을 남기면(답이 붙는 문제의 답). */
  "selfcheck-collinear": () =>
    contrast(
      [
        ["전개 입력", WALK],
        ["한 직선 위의 넷", COLLINEAR],
      ],
      keepCollinear,
      "등호를 < 로 바꾼 답",
    ),

  /** `selfcheck` — T7 이 걷어낸 두 점. */
  "selfcheck-t7": () => {
    const e = LOWER.find((x) => x.popped.length >= 2) as Push;
    const at = LOWER.indexOf(e) + 2;
    return [
      md(
        ["걸음", "판정", "걷어낸 점"],
        e.tests
          .filter((t) => t.side <= 0)
          .map((t) => [`T${at}`, testText(t, e.p), pt(t.a)]),
      ),
      "",
      `T${at} 이 끝난 뒤의 사슬은 ${list(e.after)} 입니다.`,
    ].join("\n");
  },
};

/** 걸음 표 — 담으려는 점마다 판정 · 걷어낸 점 · 담은 뒤의 사슬. */
function chainTable(events: Push[]): string {
  const rows = events.map((e) => [
    pt(e.p),
    e.tests.length === 0 ? "—" : e.tests.map((t) => String(t.side)).join(" "),
    e.popped.length === 0 ? "—" : list(e.popped),
    list(e.after),
  ]);
  const tests = events.reduce((s, e) => s + e.tests.length, 0);
  const pops = events.reduce((s, e) => s + e.popped.length, 0);
  return [
    md(
      ["담으려는 점", "차례로 나온 sideOf", "걷어낸 점", "담은 뒤의 사슬"],
      rows,
    ),
    "",
    `점 ${events.length} 개를 담는 동안 방향 판정 ${tests} 번 · 걷어내기 ${pops} 번이 있었습니다.`,
  ].join("\n");
}

/** 「(0,0) 과」·「(6,3) 와」 — 점 표기의 마지막 수로 고른다. */
function 과와Point(p: Point): string {
  return josa(tail(p), "과", "와");
}
