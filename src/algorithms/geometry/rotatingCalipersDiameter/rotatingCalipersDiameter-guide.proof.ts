/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 그림 사이드카(`-guide.fig.tsx`)도 이 파일의 기록(`WALK_RUN` · `area2`)을 받아 그린다 — 그림과 표가
 * 같은 실행을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.md
 *
 * **비용은 한 기준으로 센다.** 기본 연산 = 좌표 비교(정렬의 비교 + 같은 좌표 확인) + 방향 판정
 * (`crossSign` 호출) + 거리 계산(`squared` 한 번과 그 값을 `best` 와 비교한 일). 정렬은 합치기 정렬로
 * 센다. 추가 칸 = 정렬 사본 `n` + 중복을 지운 목록 `m` + 뒤집은 사본 `m` + 껍질 `h` + 캘리퍼스의
 * 값 칸 셋(`best` · `far` · `i`). 껍질을 세우는 쪽은 `convexHull` 편과 같은 기준이고, 거리 계산은
 * `closestPairOfPoints` 편과 같은 기준이다. 원고 전체와 `.alt.ts` 가 같은 기준을 쓴다.
 *
 * **기록 사본과 세는 사본이 따로 있다.** 기록 사본(`record`)은 걸음마다 판정을 모두 남기므로 작은
 * 입력에만 쓰고, 큰 입력은 값만 세는 `cost` 로 잰다. 둘 다 답과 껍질을 정본과 맞대어 다르면 던진다 —
 * **답이 맞는지는 사본이 아니라 정본이 진다.**
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이 파일을
 * 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안
 * 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은
 * 객체인가**로 알아낸다.
 *
 * **전진 판정을 `>=` 로 바꾼 판은 멈추지 않는 입력이 있다.** 껍질이 선분이면 두 변이 서로 반대 방향이라
 * 판정값이 늘 0 이고, `>=` 는 0 에서도 전진하기 때문이다. 그 판의 답을 얻는 자리에서는 변이 모듈의
 * `diameterSquared` 를 부르지 않고 **변이된 `farther` 로 반복을 직접 실행하며 횟수를 센다** — 멈추는
 * 입력에서는 그 결과가 변이 모듈의 답과 같다는 것을 함께 확인한다.
 *
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면 한쪽만 고쳐질
 * 때 표가 조용히 거짓이 된다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  WALK as ALT_WALK,
  계수,
  뒤집히는_껍질_크기,
  원_위의_점,
} from "./rotatingCalipersDiameter-guide.alt.ts";
import {
  convexHull,
  crossSign,
  diameterSquared,
  farther,
  type Point,
  rotatingCalipersDiameter,
  sideOf,
  squared,
} from "./rotatingCalipersDiameter-guide.ref.ts";

const REF = new URL("./rotatingCalipersDiameter-guide.ref.ts", import.meta.url)
  .pathname;

interface Ref {
  convexHull: (points: Point[]) => Point[];
  squared: (a: Point, b: Point) => bigint;
  farther: (a: Point, b: Point, c: Point, d: Point) => boolean;
  diameterSquared: (points: Point[]) => bigint;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number | bigint): string => n.toLocaleString("en-US");

/** 점 하나의 표기. 좌표는 천 단위 구분 없이 적는다 — 쉼표가 좌표 구분과 섞이지 않게. */
export const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 조사를 고를 때 점 표기의 마지막 수를 읽는다 — 「(5,2) 와」·「(8,3) 과」. */
export const tail = (p: Point): string => String(p[1]);

/** 점 목록을 「A 와 B」 꼴로 잇는다. */
const andJoin = (names: string[], tails: string[] = names): string =>
  names
    .map((x, at) => (at + 1 < names.length ? `${x}${과와(tails[at] ?? x)}` : x))
    .join(" ");

/** 껍질 첨자로 적은 꼭짓점 이름. */
export const hn = (i: number): string => `h${i}`;

/** 변 이름 — `h0→h1`. */
export const edgeName = (i: number, k: number): string =>
  `${hn(i)}→${hn((i + 1) % k)}`;

/** 두 꼭짓점 쌍의 이름 — 첨자가 작은 쪽을 앞에. */
export const pairName = (x: number, y: number): string =>
  x < y ? `${hn(x)}–${hn(y)}` : `${hn(y)}–${hn(x)}`;

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

/** 표와 그 아래 문장 — 닫는 마커까지 대조되는 블록. */
const withNote = (table: string, ...notes: string[]): string =>
  [table, "", ...notes].join("\n");

/** 단순한 연산 1 초에 1 억 번 — 시간을 어림하는 기준. */
export const PER_SECOND = 100_000_000;

/** 초 — 초당 기본 연산 1 억 번. */
export const seconds = (ops: number): string => {
  const s = ops / PER_SECOND;
  if (s < 10) return `${s.toFixed(3)} 초`;
  return `${s.toFixed(1)} 초`;
};

/** 등폭 글꼴의 표시 폭 — 한글은 두 칸. */
const width = (t: string): number =>
  [...t].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

/** 부호 하나의 표기. */
const sign = (s: number): string => (s > 0 ? "1" : s < 0 ? "-1" : "0");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 * 껍질 꼭짓점이 여섯이고 안쪽 점이 둘이라 「안쪽 점은 답이 아니다」가 값으로 확인되고, 전진이 3 회인
 * 변과 0 회인 변이 함께 나오며, 넓이가 가장 큰 꼭짓점이 둘인 변(동점)이 두 개 있다.
 */
export const WALK: Point[] = [
  [0, 0],
  [6, 0],
  [8, 3],
  [6, 6],
  [2, 7],
  [0, 4],
  [3, 3],
  [5, 2],
];

const SQUARE: Point[] = [
  [0, 0],
  [4, 0],
  [4, 4],
  [0, 4],
];

const LINE: Point[] = [
  [0, 0],
  [2, 0],
  [5, 0],
  [9, 0],
];

const SAME: Point[] = [
  [5, 5],
  [5, 5],
  [5, 5],
];

/** 이 글이 재는 과제의 규모 — 점 개수와 좌표의 절댓값 상한. */
export const LIMIT = 100_000;
export const C = 1_000_000_000;

/** 배정밀도가 정확히 담는 정수의 상한 `2^53`. */
const SAFE_INT = 9_007_199_254_740_992n;

/** 정본과 같은 값. 큰 정수로 되잰 판정을 셀 때만 쓴다. */
const SAFE = 2048;

/** 배정밀도로 재면 값이 갈리는 두 점. 제곱 거리가 홀수라 배정밀도가 못 담는다. */
const FAR_PAIR: Point[] = [
  [-C, 0],
  [C, 1],
];

/** 좌표 상한의 네 점. 곱이 커서 배정밀도 갈래를 탄다. */
const CAP_FOUR: Point[] = [
  [-C, -C],
  [C, C - 1],
  [C, -C],
  [-C, C],
];

/* ────────────────────────── 입력 생성 ────────────────────────── */

/** xorshift32. 씨앗을 고정해 실행마다 같은 입력이 된다. */
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

/** 한 변이 `10^9` 인 정사각형 안에 흩어 놓은 점. 씨앗 20260930. */
function scatterMake(total: number): Point[] {
  const rnd = makeRnd(20_260_930);
  return Array.from({ length: total }, () => [rnd() % C, rnd() % C] as Point);
}

/**
 * 반지름이 좌표 상한 `10^9` 인 원 위에서 각을 `k` 등분해 반올림한 점. 점 10 만 개까지 세 점이 한
 * 직선에 놓이지 않아 모든 점이 껍질 꼭짓점이다 — 그 사실을 만들 때마다 정본으로 확인한다.
 */
function capCircleMake(k: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < k; i++) {
    const th = (2 * Math.PI * i) / k;
    out.push([Math.round(C * Math.cos(th)), Math.round(C * Math.sin(th))]);
  }
  const hull = convexHull(out);
  if (hull.length !== k) {
    throw new Error(`껍질이 ${hull.length} 이라 ${k} 가 아니다`);
  }
  return out;
}

/** 한 변이 `10^9` 인 정사각형의 테두리 위에 고르게 놓은 점. 한 변 위의 점은 전부 공선이다. */
function borderMake(total: number): Point[] {
  const side = Math.floor(total / 4);
  return Array.from({ length: total }, (_, i) => {
    const t = i % side;
    const face = Math.floor(i / side) % 4;
    const at = Math.floor((t * C) / side);
    if (face === 0) return [at, 0] as Point;
    if (face === 1) return [C, at] as Point;
    if (face === 2) return [C - at, C] as Point;
    return [0, C - at] as Point;
  });
}

/** 같은 입력을 여러 블록이 쓰므로 한 번만 만든다. */
function memo<K, V>(make: (key: K) => V): (key: K) => V {
  const seen = new Map<K, V>();
  return (key) => {
    let got = seen.get(key);
    if (got === undefined) {
      got = make(key);
      seen.set(key, got);
    }
    return got;
  };
}

export const scattered = memo(scatterMake);
export const capCircle = memo(capCircleMake);
const border = memo(borderMake);

/* ────────────────────────── 기하 도우미 ────────────────────────── */

/** 변 `a→b` 를 밑변으로 삼은 삼각형 넓이의 2 배. 반시계 껍질에서는 안쪽이 양수다. */
export function area2(a: Point, b: Point, c: Point): bigint {
  return (
    BigInt(b[0] - a[0]) * BigInt(c[1] - a[1]) -
    BigInt(b[1] - a[1]) * BigInt(c[0] - a[0])
  );
}

/** 점 전부를 짝지어 재는 방법. 작은 입력에서만 부른다. */
function allPairs(points: Point[]): bigint {
  let best = 0n;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = squared(points[i] as Point, points[j] as Point);
      if (d > best) best = d;
    }
  }
  return best;
}

const same = (p: Point, q: Point): boolean => p[0] === q[0] && p[1] === q[1];

/** 변 `i` 에서 넓이가 가장 큰 꼭짓점 — 여럿이면 첨자가 작은 것부터 모두. */
export function farthestOfEdge(hull: Point[], i: number): number[] {
  const k = hull.length;
  const a = hull[i] as Point;
  const b = hull[(i + 1) % k] as Point;
  const v = hull.map((c) => area2(a, b, c));
  const mx = v.reduce((p, c) => (c > p ? c : p));
  return v.flatMap((x, at) => (x === mx ? [at] : []));
}

/** 껍질 위에서 제곱 거리가 가장 큰 두 꼭짓점의 첨자. */
export function diameterPair(hull: Point[]): [number, number] {
  let pa = 0;
  let pb = 0;
  let best = -1n;
  for (let x = 0; x < hull.length; x++) {
    for (let y = x + 1; y < hull.length; y++) {
      const d = squared(hull[x] as Point, hull[y] as Point);
      if (d > best) {
        best = d;
        pa = x;
        pb = y;
      }
    }
  }
  return [pa, pb];
}

/* ────────────────────────── 기록 사본 ────────────────────────── */

/** 전진 판정 한 번 — 비교한 두 꼭짓점의 첨자와 판정값. */
export interface Test {
  readonly c: number;
  readonly d: number;
  readonly sign: number;
}

/** 변 하나의 걸음. */
export interface EdgeStep {
  readonly tag: string;
  readonly i: number;
  readonly a: Point;
  readonly b: Point;
  /** 이 변을 보기 전의 far. */
  readonly before: number;
  readonly tests: readonly Test[];
  readonly far: number;
  readonly f: Point;
  readonly d1: bigint;
  readonly d2: bigint;
  readonly bestBefore: bigint;
  readonly best: bigint;
}

export interface Run {
  readonly hull: Point[];
  readonly k: number;
  readonly edges: readonly EdgeStep[];
  readonly best: bigint;
}

/**
 * 정본과 같은 절차를 걸음마다 기록한 사본. 걸음마다 판정을 모두 남기므로 **작은 입력에만** 쓴다.
 * 답이 정본과 다르면 던진다.
 */
export function record(points: Point[]): Run {
  const hull = convexHull(points);
  const k = hull.length;
  const edges: EdgeStep[] = [];
  let best = 0n;
  if (k >= 2) {
    let far = 1;
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      const before = far;
      const tests: Test[] = [];
      for (;;) {
        const c = far;
        const d = (far + 1) % k;
        const pc = hull[c] as Point;
        const pd = hull[d] as Point;
        const s = crossSign(
          b[0] - a[0],
          b[1] - a[1],
          pd[0] - pc[0],
          pd[1] - pc[1],
        );
        tests.push({ c, d, sign: s });
        if (!farther(a, b, pc, pd)) break;
        far = d;
      }
      const f = hull[far] as Point;
      const bestBefore = best;
      const d1 = squared(a, f);
      if (d1 > best) best = d1;
      const d2 = squared(b, f);
      if (d2 > best) best = d2;
      edges.push({
        tag: `T${i + 2}`,
        i,
        a,
        b,
        before,
        tests,
        far,
        f,
        d1,
        d2,
        bestBefore,
        best,
      });
    }
  }
  if (best !== diameterSquared(points)) {
    throw new Error("기록 사본이 정본과 다른 답을 냈다");
  }
  return { hull, k, edges, best };
}

/** 전개 입력의 기록 — 그림 사이드카와 걸음 재생 패널이 같은 것을 쓴다. */
export const WALK_RUN = record(WALK);

/* ────────────────────────── 세는 사본 ────────────────────────── */

/** 좌표 순서 — `x` 를 먼저, 같으면 `y`. 정본의 비교 함수와 같다. */
const byXY = (p: Point, q: Point): number => p[0] - q[0] || p[1] - q[1];

/**
 * 좌표 비교 횟수를 세는 합치기 정렬. 엔진의 정렬에 기대면 계수가 구현에 따라 갈려서, 비교 횟수는 이
 * 정렬로 센다(정본은 엔진의 정렬을 쓴다 — 순서는 같다).
 */
function mergeCounted(items: Point[], seen: { compares: number }): Point[] {
  if (items.length <= 1) return items;
  const mid = items.length >> 1;
  const left = mergeCounted(items.slice(0, mid), seen);
  const right = mergeCounted(items.slice(mid), seen);
  const out: Point[] = [];
  let at = 0;
  let to = 0;
  while (at < left.length && to < right.length) {
    seen.compares++;
    if (byXY(left[at] as Point, right[to] as Point) <= 0)
      out.push(left[at++] as Point);
    else out.push(right[to++] as Point);
  }
  while (at < left.length) out.push(left[at++] as Point);
  while (to < right.length) out.push(right[to++] as Point);
  return out;
}

/** 합치기 정렬이 `n` 개를 정렬할 때 드는 비교의 최악값 `n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1`. */
export const sortWorst = (n: number): number => {
  if (n <= 1) return 0;
  const k = Math.ceil(Math.log2(n));
  return n * k - 2 ** k + 1;
};

/** 기본 연산의 상한 — `perf.bounds` 가 유도하는 식이다. 서로 다른 점이 셋 이상일 때 쓴다. */
export const opsBound = (n: number, u: number, m: number): number =>
  sortWorst(n) + n + (4 * u - m - 6) + 5 * m;

/** 값만 세는 한 번의 실행 — 큰 입력에 쓴다. */
export interface Cost {
  readonly n: number;
  /** 서로 다른 좌표의 개수. */
  readonly u: number;
  readonly m: number;
  readonly hull: Point[];
  /** 정렬의 좌표 비교. */
  readonly sort: number;
  /** 같은 좌표 확인. */
  readonly dedup: number;
  /** 껍질을 세우는 동안의 방향 판정. */
  readonly hullTests: number;
  /** 캘리퍼스의 전진 판정(방향 판정). */
  readonly calTests: number;
  /** far 가 한 칸 옮겨 간 횟수. */
  readonly advances: number;
  /** 거리 계산. */
  readonly dist: number;
  /** 배정밀도 값이 `SAFE` 이하라 큰 정수로 되잰 방향 판정 — 껍질 쪽 · 캘리퍼스 쪽. */
  readonly exactHull: number;
  readonly exactCal: number;
  /** 껍질을 세우기까지의 기본 연산. */
  readonly hullOps: number;
  /** 껍질을 세운 뒤의 기본 연산. */
  readonly calOps: number;
  readonly ops: number;
  /** 추가 칸. */
  readonly cells: number;
  /** 변마다의 far — 처음부터 찾는 판의 계수를 셀 때 쓴다. */
  readonly fars: readonly number[];
  readonly best: bigint;
}

/** 배정밀도로 재서 부호를 확정하지 못하는가 — 정본의 ① 이 거짓인 자리. */
const needsExact = (
  ux: number,
  uy: number,
  vx: number,
  vy: number,
): boolean => {
  const approx = ux * vy - uy * vx;
  return !(approx > SAFE || approx < -SAFE);
};

function costMake(points: Point[]): Cost {
  const n = points.length;
  const seen = { compares: 0 };
  const sorted = mergeCounted([...points], seen);
  const uniq: Point[] = [];
  for (const p of sorted) {
    const last = uniq.at(-1);
    if (last === undefined || !same(last, p)) uniq.push(p);
  }
  const u = uniq.length;
  let hullTests = 0;
  let exactHull = 0;
  const chain = (seq: Point[]): Point[] => {
    const built: Point[] = [];
    for (const p of seq) {
      while (built.length >= 2) {
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        hullTests++;
        if (needsExact(a[0] - o[0], a[1] - o[1], p[0] - o[0], p[1] - o[1]))
          exactHull++;
        if (sideOf(o, a, p) > 0) break;
        built.pop();
      }
      built.push(p);
    }
    return built;
  };
  let hull: Point[];
  if (u <= 2) hull = uniq;
  else {
    const lower = chain(uniq);
    const upper = chain([...uniq].reverse());
    hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  }
  const want = convexHull(points);
  if (
    want.length !== hull.length ||
    want.some((p, at) => !same(p, hull[at] as Point))
  ) {
    throw new Error(`세는 사본과 정본의 껍질이 다르다 — 점 ${n} 개`);
  }
  const m = hull.length;
  let calTests = 0;
  let advances = 0;
  let dist = 0;
  let exactCal = 0;
  let best = 0n;
  const fars: number[] = [];
  if (m >= 2) {
    let far = 1;
    for (let i = 0; i < m; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % m] as Point;
      for (;;) {
        const c = hull[far] as Point;
        const d = hull[(far + 1) % m] as Point;
        calTests++;
        if (needsExact(b[0] - a[0], b[1] - a[1], d[0] - c[0], d[1] - c[1]))
          exactCal++;
        if (!farther(a, b, c, d)) break;
        far = (far + 1) % m;
        advances++;
      }
      fars.push(far);
      const f = hull[far] as Point;
      dist += 2;
      const d1 = squared(a, f);
      if (d1 > best) best = d1;
      const d2 = squared(b, f);
      if (d2 > best) best = d2;
    }
  }
  if (best !== diameterSquared(points)) {
    throw new Error(`세는 사본이 정본과 다른 답을 냈다 — 점 ${n} 개`);
  }
  const sort = seen.compares;
  const hullOps = sort + n + hullTests;
  const calOps = calTests + dist;
  const cells = (u <= 2 ? n + u : n + 2 * u + m) + 3;
  return {
    n,
    u,
    m,
    hull,
    sort,
    dedup: n,
    hullTests,
    calTests,
    advances,
    dist,
    exactHull,
    exactCal,
    hullOps,
    calOps,
    ops: hullOps + calOps,
    cells,
    fars,
    best,
  };
}

export const cost = memo(costMake);

/* ────────────────────────── 버린 방법들 ────────────────────────── */

/** 껍질을 세운 뒤 껍질 꼭짓점 쌍을 전부 잰다 — 거리 계산 `h(h−1)/2` 번. */
const hullPairsOps = (c: Cost): number => c.hullOps + (c.m * (c.m - 1)) / 2;

/**
 * 변마다 far 를 그 변의 다음 꼭짓점에서 **처음부터** 찾는 판을 실제로 실행한다. 작은 입력에만 쓴다.
 * 답이 정본과 다르면 던진다.
 */
function resetDirect(points: Point[]): { tests: number; ops: number } {
  const c = cost(points);
  const hull = c.hull;
  const m = hull.length;
  let tests = 0;
  let best = 0n;
  for (let i = 0; i < m && m >= 2; i++) {
    const a = hull[i] as Point;
    const b = hull[(i + 1) % m] as Point;
    let far = (i + 1) % m;
    for (;;) {
      tests++;
      if (!farther(a, b, hull[far] as Point, hull[(far + 1) % m] as Point))
        break;
      far = (far + 1) % m;
    }
    const f = hull[far] as Point;
    const d1 = squared(a, f);
    if (d1 > best) best = d1;
    const d2 = squared(b, f);
    if (d2 > best) best = d2;
  }
  if (best !== c.best) throw new Error("처음부터 찾는 판이 다른 답을 냈다");
  return { tests, ops: c.hullOps + tests + 2 * m };
}

/**
 * 같은 판의 계수를 실행 없이 낸다 — 변 `i` 에서 처음부터 찾으면 `i + 1` 에서 그 변의 far 까지 옮겨 간
 * 칸 수에 멈추는 판정 한 번을 더한 만큼 판정한다. 꼭짓점이 셋 이상이고 세 점이 한 직선에 놓이지 않는
 * 껍질에서만 쓰고, 그 식이 실제 실행과 같은지는 `resetCheck` 가 확인한다.
 */
function resetByFormula(points: Point[]): { tests: number; ops: number } {
  const c = cost(points);
  const m = c.m;
  let tests = 0;
  for (let i = 0; i < m; i++) {
    tests += (((((c.fars[i] as number) - (i + 1)) % m) + m) % m) + 1;
  }
  return { tests, ops: c.hullOps + tests + 2 * m };
}

/** 식과 실행이 같은지 — 실행할 수 있는 크기에서 맞대 본다. */
function resetCheck(): void {
  for (const pts of [WALK, capCircle(1_024), capCircle(4_096)]) {
    if (resetDirect(pts).tests !== resetByFormula(pts).tests) {
      throw new Error("처음부터 찾는 판의 식이 실행과 다르다");
    }
  }
}
resetCheck();

/* ────────────────────────── 변이 ────────────────────────── */

/** 제곱 거리를 큰 정수가 아니라 배정밀도로 낸 판. 값이 반올림된다. */
const 배정밀도판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {2}return dx \* dx \+ dy \* dy;$/,
    "  return BigInt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));",
  ],
});

/** 같은 거리인 꼭짓점에서도 전진하는 판. 껍질이 선분이면 멈추지 않는다. */
const 같은거리전진판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {2}return crossSign\(b\[0\] - a\[0\], b\[1\] - a\[1\], d\[0\] - c\[0\], d\[1\] - c\[1\]\) > 0;$/,
    "  return crossSign(b[0] - a[0], b[1] - a[1], d[0] - c[0], d[1] - c[1]) >= 0;",
  ],
});

/** 변마다 최대 한 번만 전진하는 판. far 가 넓이가 가장 큰 꼭짓점에 이르지 못하고 뒤처진다. */
const 한번만전진판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}while \(farther\(a, b, hull\[far\] as Point, hull\[\(far \+ 1\) % k\] as Point\)\)$/,
    "    if (farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point))",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가 **같은
 * 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면 `check-proof` 의 중화
 * 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = 배정밀도판.squared === squared;

const 한도 = 2_000;

/** 전진 판정을 바꾼 판을 **직접 실행한다.** 멈추지 않는 입력이 있어 전진 횟수를 센다. */
function 전진판정을_바꿔_실행한다(
  points: Point[],
  판: Ref,
): { best: bigint | null; 전진: number } {
  const hull = 판.convexHull(points);
  const k = hull.length;
  if (k < 2) return { best: 0n, 전진: 0 };
  let best = 0n;
  let far = 1;
  let 전진 = 0;
  for (let i = 0; i < k; i++) {
    const a = hull[i] as Point;
    const b = hull[(i + 1) % k] as Point;
    for (;;) {
      if (!판.farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point)) {
        break;
      }
      far = (far + 1) % k;
      전진++;
      if (전진 > 한도) return { best: null, 전진 };
    }
    const f = hull[far] as Point;
    const d1 = 판.squared(a, f);
    if (d1 > best) best = d1;
    const d2 = 판.squared(b, f);
    if (d2 > best) best = d2;
  }
  return { best, 전진 };
}

/** 원 위의 점 16 — 한 번만 전진하는 판이 답을 바꾸는 입력. 반지름은 `.alt.ts` 와 같은 1,000,000 이다. */
const CIRCLE16 = 원_위의_점(16);

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  if (배정밀도판.diameterSquared(FAR_PAIR) === diameterSquared(FAR_PAIR)) {
    throw new Error("배정밀도 판이 좌표 상한 입력에서 답을 바꾸지 못했다");
  }
  if (한번만전진판.diameterSquared(CIRCLE16) === diameterSquared(CIRCLE16)) {
    throw new Error("한 번만 전진하는 판이 어느 입력에서도 답을 바꾸지 못했다");
  }
  if (전진판정을_바꿔_실행한다(LINE, 같은거리전진판).best !== null) {
    throw new Error("같은 거리에서도 전진하는 판이 공선 입력에서 멈췄다");
  }
}

/** 변이를 건 줄을 이 입력이 몇 번 지나가는가. 세는 사본의 계수에서 읽는다. */
function 방문(points: Point[]): {
  거리: number;
  전진판정: number;
  반복머리: number;
} {
  const c = cost(points);
  return { 거리: c.dist, 전진판정: c.calTests, 반복머리: c.m >= 2 ? c.m : 0 };
}

/** 무게중심에서 가장 먼 두 점을 지름이라고 본 방법. */
function 무게중심_두_점(points: Point[]): {
  cx: number;
  cy: number;
  order: Point[];
  d: bigint;
} {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const 거리 = (p: Point): number => (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
  const order = [...points].sort((p, q) => 거리(q) - 거리(p));
  const a = order[0] as Point;
  const b = order[1] as Point;
  return { cx, cy, order, d: squared(a, b) };
}

/** 정본과 같은 절차를 제곱 거리만 배정밀도로 바꿔 옮긴 사본. */
function 배정밀도_제곱거리(a: Point, b: Point): bigint {
  return BigInt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
}

/** 껍질을 받아 캘리퍼스만 실행한다 — 껍질의 차례를 바꿔 넣어 볼 때 쓴다. */
function calipersOn(hull: Point[]): bigint {
  const k = hull.length;
  if (k < 2) return 0n;
  let best = 0n;
  let far = 1;
  for (let i = 0; i < k; i++) {
    const a = hull[i] as Point;
    const b = hull[(i + 1) % k] as Point;
    while (farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point))
      far = (far + 1) % k;
    const f = hull[far] as Point;
    const d1 = squared(a, f);
    if (d1 > best) best = d1;
    const d2 = squared(b, f);
    if (d2 > best) best = d2;
  }
  return best;
}

/* ────────────────────── 「아이디어를 떠올리는 과정」의 시도 ────────────────────── */

/** 시도 사다리(그림)와 표가 같은 값을 쓴다. */
export function ladderValues(): {
  brute: number;
  hullScatter: number;
  hullCircle: number;
  resetCircle: number;
  calCircle: number;
  calScatter: number;
  mScatter: number;
} {
  const sc = cost(scattered(LIMIT));
  const ci = cost(capCircle(LIMIT));
  return {
    brute: (LIMIT * (LIMIT - 1)) / 2,
    hullScatter: hullPairsOps(sc),
    hullCircle: hullPairsOps(ci),
    resetCircle: resetByFormula(capCircle(LIMIT)).ops,
    calCircle: ci.ops,
    calScatter: sc.ops,
    mScatter: sc.m,
  };
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 껍질과 대척점 쌍이 후보를 얼마나 줄이는가. */
  "concept-hull": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["정사각형 네 점", SQUARE],
      ["원 위의 점 16", 원_위의_점(16)],
      ["원 위의 점 64", 원_위의_점(64)],
    ];
    const rows = cases.map(([name, pts]) => {
      const n = pts.length;
      const c = cost(pts);
      const seenPairs = new Set(
        c.fars.flatMap((f, i) => [pairName(i, f), pairName((i + 1) % c.m, f)]),
      );
      return [
        name,
        num(n),
        num(c.m),
        num((n * (n - 1)) / 2),
        num((c.m * (c.m - 1)) / 2),
        num(seenPairs.size),
      ];
    });
    const truth = allPairs(WALK);
    return withNote(
      md(
        [
          "입력",
          "점 n",
          "껍질 꼭짓점 h",
          "점 쌍",
          "껍질 꼭짓점 쌍",
          "대척점 쌍",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `전개 입력의 답은 제곱 거리 ${num(WALK_RUN.best)}${josa(num(WALK_RUN.best), "이고", "고")}, 모든 쌍을 잰 답 ${num(truth)}${과와(num(truth))} 같습니다.`,
    );
  },

  /** `deep.origin` ② — 모든 쌍을 재는 방법의 규모. */
  "origin-brute": () => {
    const rows = [8, 1_000, 10_000, LIMIT].map((n) => {
      const ops = (n * (n - 1)) / 2;
      return [num(n), num(ops), seconds(ops)];
    });
    const ops = (LIMIT * (LIMIT - 1)) / 2;
    const walkPairs = (WALK.length * (WALK.length - 1)) / 2;
    return withNote(
      md(["점 n", "기본 연산 n(n−1)/2", "시간(초당 1 억 번)"], rows, [0, 1, 2]),
      `전개 입력 여덟 점을 실제로 모두 재면 거리 계산이 ${num(walkPairs)} 번이고, 가장 큰 제곱 거리는 ${num(allPairs(WALK))} 입니다. 점이 ${num(LIMIT)} 개면 ${num(ops)} 번이라 예산 1 초의 ${num(Math.round(ops / PER_SECOND))} 배입니다.`,
    );
  },

  /** `deep.origin` ③ — 전개 입력의 스물여덟 쌍을 종류별로 나눈다. */
  "origin-kinds": () => {
    const hull = WALK_RUN.hull;
    const onHull = (p: Point) => hull.some((q) => same(p, q));
    let both = 0;
    let bothMax = 0n;
    let inner = 0;
    let innerMax = 0n;
    for (let i = 0; i < WALK.length; i++) {
      for (let j = i + 1; j < WALK.length; j++) {
        const a = WALK[i] as Point;
        const b = WALK[j] as Point;
        const d = squared(a, b);
        if (onHull(a) && onHull(b)) {
          both++;
          if (d > bothMax) bothMax = d;
        } else {
          inner++;
          if (d > innerMax) innerMax = d;
        }
      }
    }
    const insidePts = WALK.filter((p) => !onHull(p));
    const inside = insidePts.map(pt);
    const insideTails = insidePts.map(tail);
    return withNote(
      md(
        ["쌍의 종류", "쌍 수", "가장 큰 제곱 거리"],
        [
          ["두 점 다 볼록 껍질의 꼭짓점", num(both), num(bothMax)],
          ["껍질 안쪽 점이 낀 쌍", num(inner), num(innerMax)],
        ],
        [1, 2],
      ),
      `껍질 안쪽 점은 ${andJoin(inside, insideTails)} 입니다. 안쪽 점이 낀 쌍의 가장 큰 값 ${num(innerMax)}${josa(num(innerMax), "은", "는")} 답 ${num(bothMax)} 보다 작습니다.`,
    );
  },

  /** `deep.origin` ③ — 껍질 꼭짓점 쌍만 재는 판. 흩어진 점과 원 위의 점. */
  "origin-hull-pairs": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      [`흩어진 점 ${num(LIMIT)} 개`, scattered(LIMIT)],
      [`원 위의 점 ${num(LIMIT)} 개`, capCircle(LIMIT)],
    ];
    const rows = cases.map(([name, pts]) => {
      const c = cost(pts);
      const ops = hullPairsOps(c);
      return [
        name,
        num(c.m),
        num(c.hullOps),
        num((c.m * (c.m - 1)) / 2),
        num(ops),
        seconds(ops),
      ];
    });
    const ci = cost(capCircle(LIMIT));
    return withNote(
      md(
        [
          "입력",
          "껍질 꼭짓점 h",
          "껍질을 세우는 기본 연산",
          "껍질 꼭짓점 쌍",
          "기본 연산 합",
          "시간(초당 1 억 번)",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `원 위의 점은 ${num(ci.n)} 개가 전부 껍질 꼭짓점이라, 쌍만 세어도 모든 쌍을 재는 방법과 같은 ${num((ci.m * (ci.m - 1)) / 2)} 번입니다.`,
    );
  },

  /** `deep.origin` ④ — 변마다 꼭짓점 전부의 넓이. */
  "origin-far": () => {
    const { hull, k } = WALK_RUN;
    const rows: string[][] = [];
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      rows.push([
        edgeName(i, k),
        ...hull.map((c) => num(area2(a, b, c))),
        farthestOfEdge(hull, i).map(hn).join(" · "),
      ]);
    }
    const ties = rows.filter((r) => (r.at(-1) ?? "").includes("·"));
    return withNote(
      md(
        ["변", ...hull.map((_, at) => hn(at)), "넓이가 가장 큰 꼭짓점"],
        rows,
        hull.map((_, at) => at + 1),
      ),
      `칸의 값은 그 변을 밑변으로, 그 꼭짓점을 꼭대기로 삼은 삼각형 넓이의 2 배입니다. 넓이가 가장 큰 꼭짓점이 둘인 변은 ${andJoin(ties.map((r) => r[0] ?? ""))} 입니다.`,
    );
  },

  /** `deep.origin` ④ — 변마다 처음부터 찾는 판과 far 를 이어 쓰는 판. */
  "origin-reset": () => {
    const cases: [string, Point[], boolean][] = [
      ["전개 입력", WALK, true],
      ["원 위의 점 4,096 개", capCircle(4_096), true],
      [`원 위의 점 ${num(LIMIT)} 개`, capCircle(LIMIT), false],
    ];
    const rows = cases.map(([name, pts, direct]) => {
      const c = cost(pts);
      const r = direct ? resetDirect(pts) : resetByFormula(pts);
      return [name, num(c.m), num(r.tests), num(c.calTests)];
    });
    const big = resetByFormula(capCircle(LIMIT));
    return withNote(
      md(
        [
          "입력",
          "껍질 꼭짓점 h",
          "변마다 처음부터 찾을 때의 방향 판정",
          "far 를 이어 쓸 때의 방향 판정",
        ],
        rows,
        [1, 2, 3],
      ),
      `처음부터 찾는 판의 ${num(LIMIT)} 개 값은 이어 쓰는 판이 낸 변마다의 far 에서 센 것이고, 4,096 개까지는 처음부터 찾는 판을 실제로 실행해 같은 값을 확인했습니다. 그 판의 기본 연산은 ${num(big.ops)} 번이라 ${seconds(big.ops)} 입니다.`,
    );
  },

  /** `deep.origin` ⑤ — 변을 차례로 따라갈 때 넓이가 가장 큰 꼭짓점. */
  "origin-forward": () => {
    const { hull, k, edges } = WALK_RUN;
    return withNote(
      md(
        ["변", ...edges.map((e) => edgeName(e.i, k))],
        [
          [
            "넓이가 가장 큰 꼭짓점",
            ...edges.map((e) => farthestOfEdge(hull, e.i).map(hn).join(" · ")),
          ],
        ],
      ),
      `변이 ${edgeName(0, k)} 에서 ${edgeName(k - 1, k)} 까지 한 칸씩 갈 때, 넓이가 가장 큰 꼭짓점은 ${hn(k - 1)} 다음을 ${hn(0)}${으로(hn(0))} 이어 세면 한 번도 뒤로 가지 않습니다.`,
    );
  },

  /** `deep.origin` ⑤ — far 를 이어 쓰는 판의 규모. */
  "origin-calipers": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      [`흩어진 점 ${num(LIMIT)} 개`, scattered(LIMIT)],
      [`원 위의 점 ${num(LIMIT)} 개`, capCircle(LIMIT)],
    ];
    const rows = cases.map(([name, pts]) => {
      const c = cost(pts);
      return [
        name,
        num(c.m),
        num(c.hullOps),
        num(c.calOps),
        num(c.ops),
        seconds(c.ops),
      ];
    });
    return md(
      [
        "입력",
        "껍질 꼭짓점 h",
        "껍질을 세우는 기본 연산",
        "껍질을 세운 뒤의 기본 연산",
        "기본 연산 합",
        "시간(초당 1 억 번)",
      ],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** `deep.build` (b) — 전개 입력의 대척점 쌍 전부. */
  "build-antipodal": () => {
    const { k, edges } = WALK_RUN;
    const seen = new Map<string, { d: bigint; from: string[] }>();
    for (const e of edges) {
      for (const [x, d] of [
        [e.i, e.d1],
        [(e.i + 1) % k, e.d2],
      ] as [number, bigint][]) {
        const key = pairName(x, e.far);
        const got = seen.get(key);
        if (got) got.from.push(edgeName(e.i, k));
        else seen.set(key, { d, from: [edgeName(e.i, k)] });
      }
    }
    const rows = [...seen.entries()].map(([key, v]) => [
      key,
      num(v.d),
      v.from.join(" · "),
    ]);
    const mx = [...seen.values()].reduce((p, v) => (v.d > p ? v.d : p), 0n);
    return withNote(
      md(["대척점 쌍", "제곱 거리", "그 쌍을 낸 변"], rows, [1]),
      `변 ${num(k)} 개가 쌍을 ${num(2 * k)} 번 내고, 겹치는 것을 빼면 대척점 쌍은 ${num(seen.size)} 개입니다. 그중 가장 큰 제곱 거리 ${num(mx)}${이가(num(mx))} 모든 쌍을 잰 답과 같습니다.`,
    );
  },

  /** `deep.build` (c) — 변 h0→h1 에서 넓이를 읽는다. */
  "build-read": () => {
    const { hull, k, edges } = WALK_RUN;
    const e = edges[0] as EdgeStep;
    const rows = hull.map((c, at) => [hn(at), pt(c), num(area2(e.a, e.b, c))]);
    const p1 = pairName(0, e.far);
    return withNote(
      md(
        ["꼭짓점", "좌표", `변 ${edgeName(0, k)} 에서의 넓이의 2 배`],
        rows,
        [2],
      ),
      `넓이가 가장 큰 꼭짓점은 ${hn(e.far)} ${pt(e.f)} 입니다. 변의 두 끝과 짝지은 대척점 쌍 ${p1}${과와(p1)} ${pairName(1, e.far)} 의 제곱 거리는 ${num(e.d1)}${과와(num(e.d1))} ${num(e.d2)} 입니다.`,
    );
  },

  /** `deep.build` (d) — 이웃한 변의 far 는 앞으로만 간다. */
  "build-monotone": () => {
    const { hull, k, edges } = WALK_RUN;
    const rows = edges.map((e) => [
      edgeName(e.i, k),
      farthestOfEdge(hull, e.i).map(hn).join(" · "),
      hn(e.far),
      num((e.far - e.before + k) % k),
    ]);
    const total = edges.reduce((s, e) => s + ((e.far - e.before + k) % k), 0);
    return withNote(
      md(
        [
          "변",
          "넓이가 가장 큰 꼭짓점",
          "far",
          "앞 변의 far 에서 앞으로 옮긴 칸",
        ],
        rows,
        [3],
      ),
      `여섯 변 모두에서 far 가 넓이가 가장 큰 꼭짓점 가운데 하나이고, 옮긴 칸을 더하면 ${num(total)} 칸으로 껍질 꼭짓점 수 ${num(k)} 의 두 배보다 적습니다.`,
    );
  },

  /** `deep.build` (e) — 변에서 가장 먼 꼭짓점과 변의 끝점에서 가장 먼 꼭짓점. */
  "build-vertex-far": () => {
    const { hull, k } = WALK_RUN;
    const byDist = (x: number): string[] => {
      const p = hull[x] as Point;
      const d = hull.map((q) => squared(p, q));
      const mx = d.reduce((a, b) => (b > a ? b : a));
      return d.flatMap((v, at) => (v === mx ? [hn(at)] : []));
    };
    let differ = 0;
    const rows: string[][] = [];
    for (let i = 0; i < k; i++) {
      const byArea = farthestOfEdge(hull, i).map(hn);
      const fromA = byDist(i);
      const fromB = byDist((i + 1) % k);
      if (!fromA.some((x) => byArea.includes(x))) differ++;
      rows.push([
        edgeName(i, k),
        byArea.join(" · "),
        fromA.join(" · "),
        fromB.join(" · "),
      ]);
    }
    return withNote(
      md(
        [
          "변 a→b",
          "변에서 넓이가 가장 큰 꼭짓점",
          "a 에서 거리가 가장 먼 꼭짓점",
          "b 에서 거리가 가장 먼 꼭짓점",
        ],
        rows,
      ),
      `여섯 변 가운데 ${num(differ)} 변에서 넓이가 가장 큰 꼭짓점과 앞 끝 a 에서 거리가 가장 먼 꼭짓점이 다릅니다.`,
    );
  },

  /** `deep.build` (f) — 지름에 수직인 두 직선 사이에 점 전체가 있다. */
  "build-why": () => {
    const { hull } = WALK_RUN;
    const [pa, pb] = diameterPair(hull);
    const a = hull[pa] as Point;
    const b = hull[pb] as Point;
    const dir: Point = [b[0] - a[0], b[1] - a[1]];
    const proj = (p: Point): bigint =>
      BigInt(p[0] - a[0]) * BigInt(dir[0]) +
      BigInt(p[1] - a[1]) * BigInt(dir[1]);
    const rows = WALK.map((p) => [pt(p), num(proj(p))]);
    const vals = WALK.map(proj);
    const lo = vals.reduce((x, y) => (y < x ? y : x));
    const hi = vals.reduce((x, y) => (y > x ? y : x));
    return withNote(
      md(
        [
          "점",
          `${hn(pa)} 에서 잰 ${hn(pa)}→${hn(pb)} 방향 (${dir[0]},${dir[1]}) 의 성분`,
        ],
        rows,
        [1],
      ),
      `가장 작은 값 ${num(lo)}${과와(num(lo))} 가장 큰 값 ${num(hi)}${은는(num(hi))} 지름의 두 끝 ${pt(a)}${과와(tail(a))} ${pt(b)} 의 값이고, 나머지 점은 전부 그 사이에 있습니다.`,
    );
  },

  /** `deep.build` 1단계 — 전개 입력의 볼록 껍질. */
  "build-hull": () => {
    const { hull } = WALK_RUN;
    const rows = WALK.map((p) => {
      const at = hull.findIndex((q) => same(p, q));
      return [pt(p), at < 0 ? "껍질 안쪽" : `꼭짓점 ${hn(at)}`];
    });
    return withNote(
      md(["점", "껍질에서의 자리"], rows),
      `점 ${num(WALK.length)} 개 가운데 ${num(hull.length)} 개가 껍질 꼭짓점이고, 반시계 방향 차례는 ${hull.map(pt).join(" ")} 입니다.`,
    );
  },

  /** `deep.build` 2단계 — 넓이 둘의 차가 외적 하나다. */
  "build-cross": () => {
    const { hull, k } = WALK_RUN;
    const rows: string[][] = [];
    let diff = 0;
    for (const i of [0, 2]) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      for (let c = 0; c < k; c++) {
        const d = (c + 1) % k;
        if (c === i || d === i) continue;
        const pc = hull[c] as Point;
        const pd = hull[d] as Point;
        const ac = area2(a, b, pc);
        const ad = area2(a, b, pd);
        const cross =
          BigInt(b[0] - a[0]) * BigInt(pd[1] - pc[1]) -
          BigInt(b[1] - a[1]) * BigInt(pd[0] - pc[0]);
        if (cross !== ad - ac) diff++;
        rows.push([
          edgeName(i, k),
          `${hn(c)} → ${hn(d)}`,
          num(ac),
          num(ad),
          num(ad - ac),
          num(cross),
        ]);
      }
    }
    return withNote(
      md(
        [
          "변 a→b",
          "c → d",
          "c 의 넓이 2 배",
          "d 의 넓이 2 배",
          "넓이 2 배의 차",
          "(b−a)×(d−c)",
        ],
        rows,
        [2, 3, 4, 5],
      ),
      `${num(rows.length)} 줄 가운데 넓이의 차와 외적이 다른 줄은 ${num(diff)} 줄입니다.`,
    );
  },

  /** `deep.build` 3단계 — 변마다 far 를 이어 보낸다. */
  "build-advance": () => {
    const { hull, k, edges } = WALK_RUN;
    const rows = edges.map((e) => [
      edgeName(e.i, k),
      hn(e.before),
      e.tests.map((t) => sign(t.sign)).join(" "),
      hn(e.far),
      farthestOfEdge(hull, e.i).map(hn).join(" · "),
    ]);
    const tests = edges.reduce((s, e) => s + e.tests.length, 0);
    return withNote(
      md(
        [
          "변",
          "이어받은 far",
          "차례로 나온 판정",
          "멈춘 far",
          "넓이가 가장 큰 꼭짓점",
        ],
        rows,
      ),
      `판정은 모두 ${num(tests)} 번이고 그중 ${num(tests - k)} 번이 전진, ${num(k)} 번이 멈춤입니다. 멈춘 far 가 여섯 변 모두 넓이가 가장 큰 꼭짓점 가운데 하나입니다.`,
    );
  },

  /** `deep.build` 4단계 — 변마다 대척점 쌍 둘로 best 를 고친다. */
  "build-best": () => {
    const { k, edges, best } = WALK_RUN;
    const rows = edges.map((e) => [
      edgeName(e.i, k),
      `${pairName(e.i, e.far)} · ${pairName((e.i + 1) % k, e.far)}`,
      `${num(e.d1)} · ${num(e.d2)}`,
      num(e.bestBefore),
      num(e.best),
    ]);
    const changed = edges.filter((e) => e.best !== e.bestBefore);
    return withNote(
      md(
        ["변", "대척점 쌍 둘", "제곱 거리 둘", "앞의 best", "뒤의 best"],
        rows,
        [3, 4],
      ),
      `best 가 바뀐 변은 ${changed.map((e) => edgeName(e.i, k)).join(" · ")}${josa(edgeName((changed.at(-1) as EdgeStep).i, k), "이고", "고")}, 마지막 best ${num(best)}${이가(num(best))} 답입니다.`,
    );
  },

  /** `deep.build` 전제 — 껍질이 시계 방향이면. */
  "build-premise-cw": () => {
    const ccw = WALK_RUN.hull;
    const cw = [...ccw].reverse();
    const rows = [
      ["반시계 방향(정본의 껍질)", ccw.map(pt).join(" "), num(calipersOn(ccw))],
      [
        "시계 방향(같은 꼭짓점을 거꾸로)",
        cw.map(pt).join(" "),
        num(calipersOn(cw)),
      ],
    ];
    return withNote(
      md(["껍질의 차례", "꼭짓점", "캘리퍼스가 낸 제곱 거리"], rows, [2]),
      `모든 쌍을 잰 답은 ${num(allPairs(WALK))} 입니다.`,
    );
  },

  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": () =>
    [
      `const points: Point[] = [${WALK.map((p) => `[${p[0]}, ${p[1]}]`).join(", ")}];`,
      `// 이 절이 끝나면 ${rotatingCalipersDiameter(WALK)}${이가(rotatingCalipersDiameter(WALK))} 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — T1 의 실행 결과. */
  "walk-hull": () => {
    const { hull, k } = WALK_RUN;
    const inside = WALK.filter((p) => !hull.some((q) => same(p, q)));
    const rows: [string, string][] = [
      ["hull", `[${hull.map(pt).join(" ")}]`],
      ["k", String(k)],
      ["껍질에서 빠진 점", inside.map(pt).join(" ")],
      ["k < 2", `${k} < 2 → 거짓, 반복으로 간다`],
      ["best · far", "0 · 1"],
    ];
    const w = Math.max(...rows.map(([label]) => width(label)));
    return rows
      .map(([label, v]) => `${label}${" ".repeat(w - width(label) + 2)}${v}`)
      .join("\n");
  },

  /** 무게중심에서 가장 먼 두 점을 지름이라고 본 방법. */
  "pause-centroid": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      [
        "여섯 점 (4,0)(0,6)(8,8)(4,4)(2,4)(6,2)",
        [
          [4, 0],
          [0, 6],
          [8, 8],
          [4, 4],
          [2, 4],
          [6, 2],
        ],
      ],
      [
        "다섯 점 (0,2)(0,8)(6,8)(4,8)(6,6)",
        [
          [0, 2],
          [0, 8],
          [6, 8],
          [4, 8],
          [6, 6],
        ],
      ],
    ];
    const rows = cases.map(([name, pts]) => {
      const r = 무게중심_두_점(pts);
      const truth = diameterSquared(pts);
      return [
        name,
        `${pt(r.order[0] as Point)}–${pt(r.order[1] as Point)}`,
        num(r.d),
        num(truth),
        r.d === truth ? "같다" : "어긋난다",
      ];
    });
    return md(
      [
        "입력",
        "무게중심에서 가장 먼 두 점",
        "그 쌍의 제곱 거리",
        "지름의 제곱",
        "대조",
      ],
      rows,
      [2, 3],
    );
  },

  /** 다섯 점 배치에서 무게중심에서의 거리. */
  "pause-centroid-why": () => {
    const pts: Point[] = [
      [0, 2],
      [0, 8],
      [6, 8],
      [4, 8],
      [6, 6],
    ];
    const r = 무게중심_두_점(pts);
    const rows = r.order.map((p, at) => [
      String(at + 1),
      pt(p),
      ((p[0] - r.cx) ** 2 + (p[1] - r.cy) ** 2).toFixed(2),
    ]);
    const a = r.order[0] as Point;
    const b = r.order[1] as Point;
    const hull = convexHull(pts);
    const [x, y] = diameterPair(hull);
    const pa = hull[x] as Point;
    const pb = hull[y] as Point;
    return withNote(
      md(["차례", "점", "무게중심까지의 제곱 거리"], rows, [0, 2]),
      `무게중심은 (${r.cx.toFixed(1)}, ${r.cy.toFixed(1)}) 입니다. 가장 먼 두 점 ${pt(a)}${과와(tail(a))} ${pt(b)} 사이의 제곱 거리는 ${num(squared(a, b))}${josa(num(squared(a, b)), "이고", "고")}, 지름은 ${pt(pa)}–${pt(pb)} 의 ${num(squared(pa, pb))} 입니다.`,
    );
  },

  /** `deep.walk` 2 — T2 의 전진 판정. */
  "walk-turn": () => {
    const { hull, k, edges } = WALK_RUN;
    const e = edges[0] as EdgeStep;
    const rows = e.tests.map((t) => {
      const c = hull[t.c] as Point;
      const d = hull[t.d] as Point;
      return [
        hn(t.c),
        hn(t.d),
        sign(t.sign),
        num(area2(e.a, e.b, d) - area2(e.a, e.b, c)),
        t.sign > 0 ? "전진한다" : "멈춘다",
      ];
    });
    return withNote(
      md(
        [
          "c = hull[far]",
          "d = hull[far+1]",
          "crossSign",
          "넓이 2 배의 차",
          "far",
        ],
        rows,
        [2, 3],
      ),
      `변 ${edgeName(0, k)} 에서 판정 ${num(e.tests.length)} 번 가운데 ${num(e.tests.length - 1)} 번 전진하고 far 가 ${hn(e.far)} 에서 멈춥니다. crossSign 과 넓이 차의 부호가 어긋난 줄은 없습니다.`,
    );
  },

  /** 같은 거리인 꼭짓점에서도 전진하는 판. */
  "pause-geq": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["정사각형 네 점", SQUARE],
      ["공선인 네 점 (0,0)(2,0)(5,0)(9,0)", LINE],
      ["같은 점 셋 (5,5)", SAME],
    ];
    const rows = cases.map(([name, pts]) => {
      const ok = diameterSquared(pts);
      const got = 전진판정을_바꿔_실행한다(pts, 같은거리전진판);
      // 멈추는 입력에서는 직접 실행한 결과가 변이 모듈의 답과 같아야 한다.
      if (!중화됨 && got.best !== null) {
        if (got.best !== 같은거리전진판.diameterSquared(pts)) {
          throw new Error(`${name} — 사본이 기계로 만든 변이와 다른 값을 냈다`);
        }
      }
      return [
        name,
        num(ok),
        got.best === null ? `전진 ${num(한도)} 회에서 끊었다` : num(got.best),
        num(방문(pts).전진판정),
        got.best === ok ? "같다" : "어긋난다",
      ];
    });
    return md(
      [
        "입력",
        "정본",
        "같은 거리에서도 전진하는 판",
        "바꾼 줄을 지나간 횟수",
        "대조",
      ],
      rows,
      [1, 3],
    );
  },

  /** 껍질이 선분일 때 두 변의 방향. */
  "pause-geq-line": () => {
    const hull = convexHull(LINE);
    const k = hull.length;
    const rows: string[][] = [];
    const c = hull[1 % k] as Point;
    const d = hull[2 % k] as Point;
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      rows.push([
        edgeName(i, k),
        `(${b[0] - a[0]},${b[1] - a[1]})`,
        `(${d[0] - c[0]},${d[1] - c[1]})`,
        sign(crossSign(b[0] - a[0], b[1] - a[1], d[0] - c[0], d[1] - c[1])),
      ]);
    }
    return withNote(
      md(
        ["변 a→b", "b − a", `far 가 ${hn(1)} 일 때의 d − c`, "crossSign"],
        rows,
        [3],
      ),
      `껍질은 ${hull.map(pt).join(" ")} 두 점이고, 두 변의 방향이 정확히 반대라 판정값이 늘 0 입니다.`,
    );
  },

  /** `deep.walk` 4 — 여덟 걸음의 조건 판정. */
  "walk-trace": () => {
    const { k, edges, best } = WALK_RUN;
    const rows: string[][] = [
      [
        "T1",
        "껍질을 세운다",
        "—",
        `\`k < 2\` 가 ${k} < 2 라 **거짓**`,
        hn(1),
        "—",
        "0",
      ],
    ];
    for (const e of edges) {
      const yes = e.tests.filter((t) => t.sign > 0).length;
      rows.push([
        e.tag,
        "변 하나",
        edgeName(e.i, k),
        `판정 ${e.tests.map((t) => sign(t.sign)).join(" ")} — **참** ${num(yes)} 번 · **거짓** 1 번`,
        hn(e.far),
        `${num(e.d1)} · ${num(e.d2)}`,
        num(e.best),
      ]);
    }
    rows.push([
      `T${k + 2}`,
      "반환",
      "—",
      `\`i < k\` 가 ${k} < ${k}${josa(k, "이라", "라")} **거짓**`,
      hn((edges.at(-1) as EdgeStep).far),
      "—",
      num(best),
    ]);
    const tests = edges.reduce((s, e) => s + e.tests.length, 0);
    return withNote(
      md(
        [
          "걸음",
          "하는 일",
          "변",
          "조건 판정",
          "far",
          "대척점 쌍 둘의 제곱 거리",
          "best",
        ],
        rows,
        [6],
      ),
      `전진 판정은 모두 ${num(tests)} 번이고, 반환값은 Number(${num(best)}n) = ${rotatingCalipersDiameter(WALK)} 입니다.`,
    );
  },

  /** 방향 판정이 어느 갈래로 갔는가 — 껍질 쪽과 캘리퍼스 쪽. */
  "walk-branch": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["좌표 상한 네 점", CAP_FOUR],
    ];
    const rows = cases.map(([name, pts]) => {
      const c = cost(pts);
      const total = c.hullTests + c.calTests;
      const exact = c.exactHull + c.exactCal;
      return [
        name,
        num(c.hullTests),
        num(c.calTests),
        num(total - exact),
        num(exact),
      ];
    });
    return withNote(
      md(
        [
          "입력",
          "껍질 쪽 방향 판정",
          "캘리퍼스 쪽 방향 판정",
          "① 배정밀도로 확정",
          "② 큰 정수로 다시 잰 판정",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `SAFE 는 ${num(SAFE)} 입니다.`,
    );
  },

  /** 제곱 거리를 배정밀도로 낸 판. */
  "pause-double": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["좌표 상한 두 점 (−10^9,0)(10^9,1)", FAR_PAIR],
      ["좌표 상한 네 점", CAP_FOUR],
      ["공선인 네 점 (0,0)(2,0)(5,0)(9,0)", LINE],
    ];
    const rows = cases.map(([name, pts]) => {
      const ok = diameterSquared(pts);
      const bad = 배정밀도판.diameterSquared(pts);
      return [
        name,
        num(ok),
        num(bad),
        num(방문(pts).거리),
        ok === bad ? "같다" : "어긋난다",
      ];
    });
    return md(
      [
        "입력",
        "정본",
        "제곱 거리를 배정밀도로 낸 판",
        "바꾼 줄을 지나간 횟수",
        "대조",
      ],
      rows,
      [1, 2, 3],
    );
  },

  /** 좌표 상한에서 배정밀도 제곱 거리가 얼마나 자주 갈리는가. */
  "pause-double-scale": () => {
    const rows: string[][] = [];
    for (const cap of [1_000, 1_000_000, 33_554_432, 100_000_000, C]) {
      let seed = 20_260_908;
      const rnd = (m: number): number => {
        seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
        return seed % m;
      };
      let n = 0;
      let 갈림 = 0;
      let 옮겨도 = 0;
      let 최대 = 0n;
      for (let t = 0; t < 100_000; t++) {
        const a: Point = [rnd(2 * cap) - cap, rnd(2 * cap) - cap];
        const b: Point = [rnd(2 * cap) - cap, rnd(2 * cap) - cap];
        n++;
        const e = squared(a, b);
        const d = 배정밀도_제곱거리(a, b);
        if (e === d) continue;
        갈림++;
        const err = e > d ? e - d : d - e;
        if (err > 최대) 최대 = err;
        if (Number(e) !== Number(d)) 옮겨도++;
      }
      rows.push([
        num(cap),
        num(n),
        num(갈림),
        `${((100 * 갈림) / n).toFixed(1)}%`,
        num(최대),
        num(옮겨도),
      ]);
    }
    return withNote(
      md(
        [
          "좌표 상한",
          "잰 쌍",
          "값이 갈린 쌍",
          "비율",
          "가장 큰 차",
          "배정밀도로 옮겨도 갈린 쌍",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "쌍은 씨앗 20,260,908 인 선형 합동 난수로 만들어 몇 번을 실행해도 같은 값이 나옵니다.",
    );
  },

  /** `deep.walk.final` — 전체 코드를 여러 입력에 실행한 결과. */
  "final-calls": () => {
    const cases: Point[][] = [
      WALK,
      SQUARE,
      LINE,
      SAME,
      [[3, 4]],
      [],
      [
        [0, 0],
        [6, 0],
        [3, 4],
      ],
      [
        [-C, 0],
        [C, 0],
        [0, 0],
      ],
    ];
    const lines = cases.map((pts) => {
      const got = rotatingCalipersDiameter(pts);
      if (BigInt(got) !== allPairs(pts)) {
        throw new Error("전체 코드가 모든 쌍을 잰 답과 다르다");
      }
      return [`rotatingCalipersDiameter(${JSON.stringify(pts)})`, String(got)];
    });
    const w = Math.max(...lines.map((l) => (l[0] as string).length));
    return lines
      .map(([call, v]) => `${(call as string).padEnd(w)}  ->  ${v}`)
      .join("\n");
  },

  /** 지지 함수 — 방향마다의 최댓값과 그 최댓값을 내는 꼭짓점. */
  "related-support": () => {
    const { hull, k, edges } = WALK_RUN;
    let miss = 0;
    const rows = edges.map((e) => {
      // 반시계 껍질에서 변 a→b 를 왼쪽으로 90 도 회전시킨 (−dy, dx) 가 껍질 안쪽을 가리킨다.
      const nx = -(e.b[1] - e.a[1]) || 0;
      const ny = e.b[0] - e.a[0] || 0;
      const v = hull.map(
        (p) => BigInt(p[0]) * BigInt(nx) + BigInt(p[1]) * BigInt(ny),
      );
      const mx = v.reduce((p, c) => (c > p ? c : p));
      const at = v.flatMap((x, i) => (x === mx ? [hn(i)] : []));
      if (!at.includes(hn(e.far))) miss++;
      return [
        edgeName(e.i, k),
        `(${nx},${ny})`,
        num(mx),
        at.join(" · "),
        hn(e.far),
      ];
    });
    return withNote(
      md(
        [
          "변",
          "그 변에 수직인 안쪽 방향 u",
          "지지값 h(u)",
          "그 값을 내는 꼭짓점",
          "그 변의 far",
        ],
        rows,
        [2],
      ),
      `지지값을 가장 크게 하는 꼭짓점 가운데 그 변의 far 가 없는 변은 ${num(miss)} 개입니다.`,
    );
  },

  /** 경쟁 설계 대조 — 값은 `.alt.ts` 를 불러서 얻는다. */
  "alt-counts": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", ALT_WALK],
      ["원 위의 점 9", 원_위의_점(9)],
      ["원 위의 점 10", 원_위의_점(10)],
      ["원 위의 점 64", 원_위의_점(64)],
      ["원 위의 점 1,024", 원_위의_점(1024)],
    ];
    const rows = cases.map(([name, pts]) => {
      const t = 계수(pts);
      const x = t.캘리퍼스.거리 + t.캘리퍼스.방향;
      const y = t.모든쌍.거리 + t.모든쌍.방향;
      return [
        name,
        num(convexHull(pts).length),
        num(x),
        num(y),
        x < y ? "회전하는 캘리퍼스" : "껍질 위 모든 쌍",
      ];
    });
    const big = 계수(원_위의_점(1024));
    return withNote(
      md(
        [
          "입력",
          "껍질 꼭짓점 h",
          "회전하는 캘리퍼스",
          "껍질 위 모든 쌍",
          "기본 연산이 적은 쪽",
        ],
        rows,
        [1, 2, 3],
      ),
      `껍질 꼭짓점 1,024 개에서 거리 계산은 ${num(big.캘리퍼스.거리)} 대 ${num(big.모든쌍.거리)}${josa(num(big.모든쌍.거리), "이고", "고")} 방향 판정은 ${num(big.캘리퍼스.방향)} 대 ${num(big.모든쌍.방향)} 입니다. 추가 칸은 ${num(big.캘리퍼스.칸)} 대 ${num(big.모든쌍.칸)}${으로(num(big.모든쌍.칸))} 같고, 기본 연산이 적은 쪽은 껍질 꼭짓점이 ${num(뒤집히는_껍질_크기())} 개가 되는 자리에서 바뀝니다.`,
    );
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣는다. */
  "math-define": () => {
    const [h0, h1, h2] = WALK_RUN.hull as [Point, Point, Point];
    const u: Point = [h1[0] - h0[0], h1[1] - h0[1]];
    const v: Point = [h2[0] - h1[0], h2[1] - h1[1]];
    const cross = u[0] * v[1] - u[1] * v[0];
    return md(
      ["식", "넣은 값", "결과"],
      [
        [
          "cross(u, v)",
          `u = h1 − h0 = (${u[0]},${u[1]}) · v = h2 − h1 = (${v[0]},${v[1]}) → ${u[0]}·${v[1]} − ${u[1]}·${v[0]}`,
          num(cross),
        ],
        [
          "d²(h0, h2)",
          `(${h0[0] - h2[0]})² + (${h0[1] - h2[1]})²`,
          num(squared(h0, h2)),
        ],
      ],
      [2],
    );
  },

  /** 오차 한계를 좌표 상한별로 계산한다. */
  "math-check": () => {
    const 한계 = (cap: number): string => {
      const v = cap ** 2 / 2 ** 49;
      return v < 0.01 ? v.toExponential(2) : v.toFixed(8);
    };
    const rows = [1_000, 23_726_566, 33_554_432, 47_453_133, C].map((cap) => {
      const 곱 = 4n * BigInt(cap) * BigInt(cap);
      return [
        num(cap),
        num(곱),
        곱 > SAFE_INT ? "넘는다" : "안 넘는다",
        한계(cap),
      ];
    });
    const eight = 8n * BigInt(C) * BigInt(C);
    const ratio = Number(eight) / Number(SAFE_INT);
    return withNote(
      md(
        ["좌표 상한 C", "곱의 상한 4C²", "2^53 초과", "오차 한계 C²/2^49"],
        rows,
        [0, 1, 3],
      ),
      `2^53 = ${num(SAFE_INT)} 입니다. C = 10^9 에서 외적과 제곱 거리의 상한 8C² 은 2^53 의 ${ratio.toFixed(1)} 배이고(8C² = ${num(eight)}), 오차 한계 ${(C ** 2 / 2 ** 49).toFixed(2)} 보다 큰 2 의 거듭제곱 가운데 가장 작은 것이 SAFE = ${num(SAFE)} 입니다.`,
    );
  },

  /** 배정밀도 외적의 실제 오차와 부호. */
  "math-sign": () => {
    const cases: [number, number, number, number][] = [
      [1_000, 999, 1_001, 1_000],
      [100_000_000, 99_999_999, 100_000_001, 100_000_000],
      [C, C - 1, C + 1, C],
      [2 * C, 2 * C - 1, 2 * C, 2 * C - 1],
    ];
    const rows = cases.map(([ux, uy, vx, vy]) => {
      const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
      const approx = ux * vy - uy * vx;
      return [
        `u=(${ux}, ${uy}) v=(${vx}, ${vy})`,
        num(exact),
        num(approx),
        num(BigInt(approx) - exact),
        sign(crossSign(ux, uy, vx, vy)),
        sign(approx),
      ];
    });
    // 성분이 이웃한 큰 정수인 벡터 쌍을 고정한 씨앗으로 차례로 만들어 잰다.
    let seed = 7;
    const rnd = (m: number): number => {
      seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
      return seed % m;
    };
    let n = 0;
    let 접힘 = 0;
    let 뒤집힘 = 0;
    let 최대오차 = 0;
    for (let t = 0; t < 200_000; t++) {
      const m = 1 + rnd(2 * C);
      const ux = m;
      const uy = m - 1 - rnd(3);
      const vx = m + 1;
      const vy = m - rnd(3);
      const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
      const approx = ux * vy - uy * vx;
      const s1 = exact > 0n ? 1 : exact < 0n ? -1 : 0;
      const s2 = approx > 0 ? 1 : approx < 0 ? -1 : 0;
      n++;
      const err = Math.abs(approx - Number(exact));
      if (err > 최대오차) 최대오차 = err;
      if (s1 !== s2) {
        if (s2 === 0) 접힘++;
        else 뒤집힘++;
      }
    }
    return withNote(
      md(
        [
          "벡터 두 개",
          "정확한 외적",
          "배정밀도 값",
          "차",
          "정본 부호",
          "배정밀도만 쓴 부호",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `성분이 이웃한 큰 정수인 벡터 쌍 ${num(n)} 개에서 배정밀도 부호가 0 으로 접힌 것은 ${num(접힘)} 개이고 부호가 반대로 뒤집힌 것은 ${num(뒤집힘)} 개입니다. 가장 큰 오차는 ${num(최대오차)} 입니다.`,
    );
  },

  /** 좌표 상한별로 무엇이 정확한가. */
  "math-caps": () => {
    const 한계 = (cap: number): string => (cap ** 2 / 2 ** 49).toFixed(8);
    const rows = [23_726_566, 23_726_567, 33_554_432, 33_554_433, C].map(
      (cap) => {
        const 제곱 = 8n * BigInt(cap) * BigInt(cap);
        const err = cap ** 2 / 2 ** 49;
        return [
          num(cap),
          num(제곱),
          제곱 <= SAFE_INT ? "그렇다" : "아니다",
          한계(cap),
          err < 1 ? "필요 없다" : "필요하다",
        ];
      },
    );
    // 8C² <= 2^53 을 만족하는 가장 큰 C 와 err(C) < 1 을 만족하는 가장 큰 C 를 실행으로 낸다.
    let 정확 = 1;
    while (8n * BigInt(정확 + 1) * BigInt(정확 + 1) <= SAFE_INT) 정확++;
    let 필요없음 = 1;
    while ((필요없음 + 1) ** 2 / 2 ** 49 < 1) 필요없음++;
    return withNote(
      md(
        [
          "좌표 상한 C",
          "제곱 거리 상한 8C²",
          "2^53 이내",
          "외적 오차 한계",
          "큰 정수로 다시 재기",
        ],
        rows,
        [0, 1, 3],
      ),
      `제곱 거리가 배정밀도로 정확한 가장 큰 좌표 상한은 ${num(정확)}${josa(num(정확), "이고", "고")}, 큰 정수로 다시 재지 않아도 부호가 확정되는 가장 큰 좌표 상한은 ${num(필요없음)} 입니다.`,
    );
  },

  /** 불변식이 걸음마다 유지되는지 실행이 판정한 결과. */
  "invariant-far": () => {
    const groups: [string, () => Iterable<Point[]>][] = [
      [
        "전개 입력",
        function* () {
          yield WALK;
        },
      ],
      [
        "원 위의 점 3 개부터 64 개까지",
        function* () {
          for (let k = 3; k <= 64; k++) yield 원_위의_점(k);
        },
      ],
      [
        "4 × 4 격자에서 다섯 점 이하로 뽑은 묶음 전부",
        function* () {
          const grid: Point[] = [];
          for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) grid.push([x, y]);
          }
          for (let mask = 1; mask < 1 << grid.length; mask++) {
            let c = 0;
            for (let b = mask; b; b >>= 1) c += b & 1;
            if (c > 5) continue;
            const pts: Point[] = [];
            for (let i = 0; i < grid.length; i++) {
              if (mask & (1 << i)) pts.push(grid[i] as Point);
            }
            yield pts;
          }
        },
      ],
    ];
    let worst = 0;
    const rows = groups.map(([name, gen]) => {
      let steps = 0;
      let notMax = 0;
      let back = 0;
      for (const pts of gen()) {
        const r = record(pts);
        let total = 0;
        for (const e of r.edges) {
          steps++;
          const v = r.hull.map((c) => area2(e.a, e.b, c));
          const mx = v.reduce((p, c) => (c > p ? c : p));
          if ((v[e.far] as bigint) !== mx) notMax++;
          // 첨자가 한 바퀴 안에서 앞으로만 가는지 본다.
          const moved = (e.far - e.before + r.k) % r.k;
          if (moved !== e.tests.length - 1) back++;
          total += e.tests.length - 1;
        }
        if (r.k >= 2) worst = Math.max(worst, total / r.k);
      }
      return [name, num(steps), num(notMax), num(back)];
    });
    return withNote(
      md(
        [
          "입력 묶음",
          "확인한 걸음",
          "far 가 넓이가 가장 큰 꼭짓점이 아닌 걸음",
          "far 가 뒤로 간 걸음",
        ],
        rows,
        [1, 2, 3],
      ),
      `모든 입력에서 전진 총수를 껍질 꼭짓점 수로 나눈 값의 가장 큰 것은 ${worst.toFixed(2)} 입니다.`,
    );
  },

  /** 경계에 있는 입력들. */
  "invariant-edges": () => {
    const cases: [string, Point[], string][] = [
      ["[]", [], "점이 없어 껍질도 비고 반복을 한 번도 하지 않는다"],
      ["[(3,4)]", [[3, 4]], "껍질이 한 점이라 잴 쌍이 없다"],
      [
        "[(7,7),(7,7)]",
        [
          [7, 7],
          [7, 7],
        ],
        "같은 좌표가 둘이라 껍질이 한 점으로 줄어든다",
      ],
      [
        "[(0,0),(3,4)]",
        [
          [0, 0],
          [3, 4],
        ],
        "껍질이 선분이라 두 변이 서로 반대 방향이다",
      ],
      [
        "[(0,0),(2,0),(5,0),(9,0)]",
        LINE,
        "공선이라 가운데 두 점이 껍질에서 빠진다",
      ],
      [
        "[(0,0),(0,0),(3,4)]",
        [
          [0, 0],
          [0, 0],
          [3, 4],
        ],
        "같은 점이 섞여도 껍질에는 한 번만 담긴다",
      ],
      [
        "좌표 상한의 대각선 두 끝",
        [
          [-C, -C],
          [C, C],
        ],
        "제곱 거리가 이 과제의 가장 큰 값이다",
      ],
    ];
    const rows = cases.map(([name, pts, why]) => [
      name,
      num(convexHull(pts).length),
      num(diameterSquared(pts)),
      why,
    ]);
    return md(
      ["입력", "껍질 꼭짓점 h", "제곱 거리", "경계인 까닭"],
      rows,
      [1, 2],
    );
  },

  /** 변마다 최대 한 번만 전진하는 판 — 불변식을 지키던 그 줄이다. */
  "mutant-once": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["정사각형 네 점", SQUARE],
      ["원 위의 점 16", CIRCLE16],
      ["같은 점 셋 (5,5)", SAME],
    ];
    const rows = cases.map(([name, pts]) => {
      const ok = diameterSquared(pts);
      const bad = 한번만전진판.diameterSquared(pts);
      return [
        name,
        num(ok),
        num(bad),
        num(방문(pts).반복머리),
        ok === bad ? "같다" : "어긋난다",
      ];
    });
    return md(
      [
        "입력",
        "정본",
        "변마다 한 번만 전진하는 판",
        "바꾼 줄을 지나간 횟수",
        "대조",
      ],
      rows,
      [1, 2, 3],
    );
  },

  /** 한 번만 전진하는 판이 걸음마다 어떤 far 를 내는가. */
  "mutant-once-steps": () => {
    const pts = CIRCLE16;
    const hull = convexHull(pts);
    const k = hull.length;
    const rows: string[][] = [];
    let farOk = 1;
    let farBad = 1;
    let bestOk = 0n;
    let bestBad = 0n;
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      while (
        farther(a, b, hull[farOk] as Point, hull[(farOk + 1) % k] as Point)
      )
        farOk = (farOk + 1) % k;
      if (farther(a, b, hull[farBad] as Point, hull[(farBad + 1) % k] as Point))
        farBad = (farBad + 1) % k;
      for (const [f, which] of [
        [farOk, "ok"],
        [farBad, "bad"],
      ] as [number, string][]) {
        const g = hull[f] as Point;
        const x = squared(a, g);
        const y = squared(b, g);
        const d = x > y ? x : y;
        if (which === "ok") {
          if (d > bestOk) bestOk = d;
        } else if (d > bestBad) bestBad = d;
      }
      if (i < 4 || i === k - 1) {
        rows.push([
          edgeName(i, k),
          hn(farOk),
          hn(farBad),
          num(bestOk),
          num(bestBad),
        ]);
      }
    }
    if (!중화됨 && bestBad !== 한번만전진판.diameterSquared(pts)) {
      throw new Error("사본이 기계로 만든 변이와 다른 값을 냈다");
    }
    return withNote(
      md(
        [
          "변",
          "정본의 far",
          "한 번만 전진하는 판의 far",
          "정본의 best",
          "그 판의 best",
        ],
        rows,
        [3, 4],
      ),
      `첨자는 원 위의 점 16 의 껍질 ${hn(0)}…${hn(k - 1)}${josa(hn(k - 1), "이고", "고")}, 앞의 네 변과 마지막 변만 적었습니다. 마지막 변에서 far 는 ${hn(farOk)} 대 ${hn(farBad)} 입니다.`,
    );
  },

  /**
   * 「답이 같다」인 줄에서 **중간 값도 같았는가.** 변이를 건 줄을 한 번이라도 지나갔는데 답이 같으면,
   * 그 변이가 무해한 것인지 중간이 갈렸다가 상쇄된 것인지를 값으로 갈라야 한다.
   *
   * 판정 낱말(`같다`·`어긋난다`)을 이 표에 쓰지 않는다 — 중화 실행에서 「갈린 걸음」 칸이 0 으로
   * 바뀌므로, 판정 낱말을 쓰면 중화 대조가 그 줄을 위반으로 읽는다.
   */
  "mutant-same-steps": () => {
    /** 정본과 판 하나를 변마다 나란히 실행하며 (far, best) 를 비교한다. */
    const 나란히 = (
      pts: Point[],
      판: Ref,
    ): { 갈림: number; 걸음: number; 답: bigint | null } => {
      const A = convexHull(pts);
      const B = 판.convexHull(pts);
      const k = A.length;
      if (k < 2 || B.length !== k) return { 갈림: 0, 걸음: 0, 답: 0n };
      let farA = 1;
      let farB = 1;
      let bestA = 0n;
      let bestB = 0n;
      let 갈림 = 0;
      let 전진 = 0;
      for (let i = 0; i < k; i++) {
        const a = A[i] as Point;
        const b = A[(i + 1) % k] as Point;
        while (farther(a, b, A[farA] as Point, A[(farA + 1) % k] as Point)) {
          farA = (farA + 1) % k;
        }
        for (;;) {
          const c = B[farB] as Point;
          const d = B[(farB + 1) % k] as Point;
          if (!판.farther(a, b, c, d)) break;
          farB = (farB + 1) % k;
          if (++전진 > 한도) return { 갈림, 걸음: i, 답: null };
        }
        const fa = A[farA] as Point;
        const fb = B[farB] as Point;
        const d1 = squared(a, fa);
        if (d1 > bestA) bestA = d1;
        const d2 = squared(b, fa);
        if (d2 > bestA) bestA = d2;
        const e1 = 판.squared(a, fb);
        if (e1 > bestB) bestB = e1;
        const e2 = 판.squared(b, fb);
        if (e2 > bestB) bestB = e2;
        if (farA !== farB || bestA !== bestB) 갈림++;
      }
      return { 갈림, 걸음: k, 답: bestB };
    };
    const 판들: [string, Ref, "거리" | "전진판정" | "반복머리"][] = [
      ["제곱 거리를 배정밀도로 낸 판", 배정밀도판, "거리"],
      ["같은 거리에서도 전진하는 판", 같은거리전진판, "전진판정"],
      ["변마다 한 번만 전진하는 판", 한번만전진판, "반복머리"],
    ];
    const 입력들: [string, Point[]][] = [
      ["전개 입력", WALK],
      ["정사각형 네 점", SQUARE],
      ["공선인 네 점", LINE],
    ];
    const rows: string[][] = [];
    for (const [label, impl, site] of 판들) {
      for (const [name, pts] of 입력들) {
        const 참 = diameterSquared(pts);
        const r = 나란히(pts, impl);
        if (r.답 !== null && r.답 !== 참) continue; // 답이 갈린 줄은 따로 있는 표가 다룬다
        rows.push([
          label,
          name,
          num(방문(pts)[site]),
          r.답 === null ? "—" : num(r.갈림),
          r.답 === null ? "—" : num(r.걸음),
          r.답 === null ? "멈추지 않는다" : "그대로",
        ]);
      }
    }
    return withNote(
      md(
        [
          "변이",
          "입력",
          "바꾼 줄을 지나간 횟수",
          "중간 값이 갈린 걸음",
          "확인한 걸음",
          "답",
        ],
        rows,
        [2, 3, 4],
      ),
      "중간 값은 걸음마다의 far 와 best 두 값이고, 정본과 변이를 변마다 나란히 실행해 비교했습니다.",
    );
  },

  /** `perf.derive` — 전개 입력에서 실제로 한 일. */
  "perf-ops": () => {
    const c = cost(WALK);
    const rows = [
      ["좌표로 정렬한다", "T1", num(c.sort), num(sortWorst(c.n))],
      ["같은 좌표를 확인한다", "T1", num(c.dedup), num(c.n)],
      [
        "껍질을 세우는 방향 판정",
        "T1",
        num(c.hullTests),
        num(4 * c.u - c.m - 6),
      ],
      ["캘리퍼스의 전진 판정", "T2~T7", num(c.calTests), num(3 * c.m)],
      ["거리 계산", "T2~T7", num(c.dist), num(2 * c.m)],
    ];
    return withNote(
      md(["하는 일", "걸음", "실측", "상한"], rows, [2, 3]),
      `실측 합계는 ${num(c.ops)} 번이고, 다섯 항의 상한을 더하면 ${num(opsBound(c.n, c.u, c.m))} 번입니다. 캘리퍼스의 전진 판정 ${num(c.calTests)} 번은 멈춤 ${num(c.m)} 번과 전진 ${num(c.advances)} 번을 더한 값입니다.`,
    );
  },

  /** 껍질 꼭짓점 수를 네 배씩 키우며 캘리퍼스 쪽 계수를 센다. */
  "perf-growth": () => {
    let prev = 0;
    const rows = [4, 16, 64, 256, 1024].map((k) => {
      const c = cost(원_위의_점(k));
      const r = [
        num(k),
        num(c.calTests),
        num(c.dist),
        num(c.calOps),
        (c.calOps / k).toFixed(2),
        prev === 0 ? "—" : (c.calOps / prev).toFixed(2),
      ];
      prev = c.calOps;
      return r;
    });
    return withNote(
      md(
        [
          "껍질 꼭짓점 h",
          "전진 판정",
          "거리 계산",
          "껍질을 세운 뒤의 기본 연산",
          "h 로 나눈 값",
          "앞 줄과의 비",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "원 위의 점은 반지름 1,000,000 인 원에서 각을 등분해 반올림한 점이라 모든 점이 껍질 꼭짓점입니다.",
    );
  },

  /** `perf.bounds` — 총식의 상한과 실측. */
  "perf-total": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력", WALK],
      [`흩어진 점 ${num(LIMIT)} 개`, scattered(LIMIT)],
      [`원 위의 점 ${num(LIMIT)} 개`, capCircle(LIMIT)],
    ];
    const rows = cases.map(([name, pts]) => {
      const c = cost(pts);
      return [
        name,
        num(c.n),
        num(c.u),
        num(c.m),
        num(opsBound(c.n, c.u, c.m)),
        num(c.ops),
        num(c.cells),
      ];
    });
    return md(
      ["입력", "n", "m", "h", "기본 연산 상한", "기본 연산 실측", "추가 칸"],
      rows,
      [1, 2, 3, 4, 5, 6],
    );
  },

  /** `perf.worst` — 모양을 바꿔 가며 실제로 재 본다. */
  "perf-worst": () => {
    const N = LIMIT;
    const line: Point[] = Array.from({ length: N }, (_, i) => [i * 10_000, 0]);
    const one: Point[] = Array.from({ length: N }, () => [C, C]);
    const cases: [string, Point[]][] = [
      ["정사각형 안에 흩어 놓은 점", scattered(N)],
      ["정사각형 테두리 위의 점", border(N)],
      ["원 위의 점", capCircle(N)],
      ["한 직선 위의 점", line],
      ["같은 좌표만", one],
    ];
    const measured = cases.map(([name, pts]) => ({ name, c: cost(pts) }));
    const rows = measured.map(({ name, c }) => [
      name,
      num(c.u),
      num(c.m),
      num(c.hullOps),
      num(c.calOps),
      num(c.ops),
      num(c.cells),
    ]);
    const most = measured.reduce((p, x) => (x.c.ops > p.c.ops ? x : p));
    const cal = measured.reduce((p, x) => (x.c.calOps > p.c.calOps ? x : p));
    const cells = measured.reduce((p, x) => (x.c.cells > p.c.cells ? x : p));
    return withNote(
      md(
        [
          "모양",
          "서로 다른 점 m",
          "껍질 꼭짓점 h",
          "껍질을 세우는 기본 연산",
          "껍질을 세운 뒤의 기본 연산",
          "기본 연산 합",
          "추가 칸",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      `점은 다섯 모양 모두 ${num(N)} 개입니다. 기본 연산 합이 가장 많은 모양은 ${most.name}(${num(most.c.ops)} 번), 껍질을 세운 뒤의 기본 연산이 가장 많은 모양은 ${cal.name}(${num(cal.c.calOps)} 번), 추가 칸이 가장 많은 모양은 ${cells.name}(${num(cells.c.cells)} 칸)입니다.`,
    );
  },

  /** 스스로 점검하기의 답 — 같은 거리인 두 꼭짓점 중 어느 쪽에 멈춰도 답이 같은가. */
  "check-answer": () => {
    const { hull, k } = WALK_RUN;
    /** 변 `at` 에서 far 를 `forced` 로 두고 나머지는 그대로 실행한다. */
    const 강제 = (
      at: number,
      forced: number,
    ): { 그_걸음: bigint; 답: bigint } => {
      let best = 0n;
      let far = 1;
      let 그_걸음 = 0n;
      for (let i = 0; i < k; i++) {
        const a = hull[i] as Point;
        const b = hull[(i + 1) % k] as Point;
        while (
          farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point)
        ) {
          far = (far + 1) % k;
        }
        if (i === at) far = forced;
        const f = hull[far] as Point;
        const d1 = squared(a, f);
        if (d1 > best) best = d1;
        const d2 = squared(b, f);
        if (d2 > best) best = d2;
        if (i === at) 그_걸음 = best;
      }
      return { 그_걸음, 답: best };
    };
    const tied = farthestOfEdge(hull, 1);
    const a = hull[1] as Point;
    const b = hull[2] as Point;
    const rows = tied.map((m) => {
      const f = hull[m] as Point;
      const r = 강제(1, m);
      return [
        hn(m),
        num(area2(a, b, f)),
        num(squared(a, f)),
        num(squared(b, f)),
        num(r.그_걸음),
        num(r.답),
      ];
    });
    const 정본답 = diameterSquared(WALK);
    for (const m of tied) {
      if (강제(1, m).답 !== 정본답) {
        throw new Error("강제한 판이 다른 답을 냈다");
      }
    }
    const names = tied.map(hn).join(" · ");
    return withNote(
      md(
        [
          `변 ${edgeName(1, k)} 에서의 far`,
          "넓이 2 배",
          "a 와 f 의 제곱 거리",
          "b 와 f 의 제곱 거리",
          "그 걸음 뒤의 best",
          "끝까지 실행한 답",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `${names}${을를(names)} 바꿔 넣어도 끝까지 실행한 답은 둘 다 ${num(정본답)} 입니다.`,
    );
  },
};
