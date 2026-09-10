/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter-guide.md
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * **세는 사본이 넷 있다**(`걸음`·`방문 횟수`·`전진 판정만 바꾼 사본`·`배정밀도 사본`).
 * 정본은 걸음마다의 상태도, 어떤 줄을 몇 번 지나갔는지도 내보내지 않는다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표에서 옳은 쪽 칸은 전부 정본이나 정본에서 기계로 만든
 * 변이가 낸 값이다.
 *
 * **전진 판정을 `>=` 로 바꾼 판은 멈추지 않는 입력이 있다.** 껍질이 선분이면 두 변이 서로
 * 반대 방향이라 판정값이 늘 0 이고, `>=` 는 0 에서도 전진하기 때문이다. 그 판의 답을 얻는
 * 자리에서는 변이 모듈의 `diameterSquared` 를 부르지 않고 **변이된 `farther` 로 반복을 직접
 * 굴리며 횟수를 센다** — 멈추는 입력에서는 그 결과가 변이 모듈의 답과 같다는 것을 함께
 * 확인한다.
 *
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를 } from "../../../../tools/josa.ts";
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

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number | bigint): string => n.toLocaleString("en-US");

function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/** 좌표 상한에서의 외적 오차 한계 `C^2 / 2^49`. 작은 값은 지수로 적는다. */
function 한계(cap: number): string {
  const v = cap ** 2 / 2 ** 49;
  return v < 0.01 ? v.toExponential(2) : v.toFixed(8);
}

/** `698년` 꼴 — 초를 사람이 읽는 단위로 바꾼다. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)}초`;
  if (seconds < 60) return `${seconds.toFixed(1)}초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)}분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)}일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))}년`;
}

const 서수 = [
  "첫",
  "둘",
  "셋",
  "넷",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];

const 번째 = (n: number): string => {
  const w = 서수[n - 1];
  if (w === undefined) return `${comma(n)} 번째`;
  return w === "첫" ? "첫 번째" : `${w}째`;
};

/* ────────────────────── 공통 입력과 도우미 ────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 껍질 꼭짓점이 여섯이고 안쪽 점이 둘이라 「안쪽 점은 후보가
 * 아니다」가 값으로 확인되고, 전진이 3 회인 변과 0 회인 변이 함께 나온다.
 */
const WALK: Point[] = [
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

/** 좌표 상한. */
const C = 1_000_000_000;

/** 배정밀도가 정확히 담는 정수의 상한. */
const SAFE_INT = 9_007_199_254_740_992n;

/** 변이 표에 나란히 놓는 네 입력. */
const FOUR: [string, Point[]][] = [
  ["전개가 쓰는 여덟 점", WALK],
  ["정사각형 네 점", SQUARE],
  ["공선인 네 점 (0,0)~(9,0)", LINE],
  ["같은 점 셋 (5,5)", SAME],
];

const 좌표 = (p: Point): string => `(${comma(p[0])},${comma(p[1])})`;

/** 껍질 첨자로 적은 꼭짓점 이름. */
const 이름 = (i: number): string => `h${i}`;

/* ────────────────────────── 세는 사본 ────────────────────────── */

interface 걸음 {
  라벨: string;
  i: number;
  a: Point;
  b: Point;
  전진: number;
  far: number;
  f: Point;
  d1: bigint;
  d2: bigint;
  best: bigint;
}

/** 정본과 같은 절차에 걸음마다의 상태를 덧붙인 사본. */
function 걸음들(points: Point[]): {
  hull: Point[];
  steps: 걸음[];
  best: bigint;
} {
  const hull = convexHull(points);
  const k = hull.length;
  const steps: 걸음[] = [];
  if (k < 2) return { hull, steps, best: 0n };
  let best = 0n;
  let far = 1;
  for (let i = 0; i < k; i++) {
    const a = hull[i] as Point;
    const b = hull[(i + 1) % k] as Point;
    let 전진 = 0;
    while (farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point)) {
      far = (far + 1) % k;
      전진++;
    }
    const f = hull[far] as Point;
    const d1 = squared(a, f);
    if (d1 > best) best = d1;
    const d2 = squared(b, f);
    if (d2 > best) best = d2;
    steps.push({ 라벨: `T${i + 2}`, i, a, b, 전진, far, f, d1, d2, best });
  }
  return { hull, steps, best };
}

/** 변이를 건 줄을 이 입력이 몇 번 지나가는가. 정본과 같은 절차에 방문 계수만 덧붙였다. */
function 방문(points: Point[]): {
  거리: number;
  전진판정: number;
  반복머리: number;
} {
  const hull = convexHull(points);
  const k = hull.length;
  const v = { 거리: 0, 전진판정: 0, 반복머리: 0 };
  if (k < 2) return v;
  let far = 1;
  for (let i = 0; i < k; i++) {
    v.반복머리++;
    const a = hull[i] as Point;
    const b = hull[(i + 1) % k] as Point;
    for (;;) {
      v.전진판정++;
      if (!farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point)) {
        break;
      }
      far = (far + 1) % k;
    }
    v.거리 += 2;
  }
  return v;
}

/** 변 `a→b` 를 밑변으로 삼은 삼각형의 넓이의 2 배. 부호는 반시계가 양수다. */
function 넓이2배(a: Point, b: Point, c: Point): bigint {
  return (
    BigInt(b[0] - a[0]) * BigInt(c[1] - a[1]) -
    BigInt(b[1] - a[1]) * BigInt(c[0] - a[0])
  );
}

/** 점 전부를 짝지어 재는 방법. 작은 입력에서만 부른다. */
function 전부대조(points: Point[]): bigint {
  let best = 0n;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = squared(points[i] as Point, points[j] as Point);
      if (d > best) best = d;
    }
  }
  return best;
}

/** 캘리퍼스가 실제로 재 본 서로 다른 쌍. */
function 본_쌍(points: Point[]): Set<string> {
  const hull = convexHull(points);
  const k = hull.length;
  const out = new Set<string>();
  if (k < 2) return out;
  let far = 1;
  for (let i = 0; i < k; i++) {
    const a = hull[i] as Point;
    const b = hull[(i + 1) % k] as Point;
    while (farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point)) {
      far = (far + 1) % k;
    }
    for (const x of [i, (i + 1) % k]) {
      out.add(x < far ? `h${x}-h${far}` : `h${far}-h${x}`);
    }
  }
  return out;
}

/** 무게중심에서 가장 먼 두 점을 지름이라고 본 방법. */
function 무게중심_두_점(points: Point[]): { pair: [Point, Point]; d: bigint } {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const 거리 = (p: Point): number => (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
  const sorted = [...points].sort((p, q) => 거리(q) - 거리(p));
  const a = sorted[0] as Point;
  const b = sorted[1] as Point;
  return { pair: [a, b], d: squared(a, b) };
}

/** 정본과 같은 절차를 제곱 거리만 배정밀도로 바꿔 옮긴 사본. */
function 배정밀도_제곱거리(a: Point, b: Point): bigint {
  return BigInt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
}

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

/** 변마다 최대 한 번만 전진하는 판. far 가 가장 먼 꼭짓점에 이르지 못하고 뒤처진다. */
const 한번만전진판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}while \(farther\(a, b, hull\[far\] as Point, hull\[\(far \+ 1\) % k\] as Point\)\)$/,
    "    if (farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point))",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = 배정밀도판.squared === squared;

/** 전진 판정을 바꾼 판을 **직접 굴린다.** 멈추지 않는 입력이 있어 횟수를 센다. */
function 전진판정을_바꿔_굴린다(
  points: Point[],
  판: Ref,
  한도: number,
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

const 한도 = 2_000;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  if (배정밀도판.diameterSquared(FAR_PAIR()) === diameterSquared(FAR_PAIR())) {
    throw new Error("배정밀도 판이 좌표 상한 입력에서 답을 바꾸지 못했다");
  }
  if (
    한번만전진판.diameterSquared(원_위의_점(16)) ===
    diameterSquared(원_위의_점(16))
  ) {
    throw new Error("한 번만 전진하는 판이 어느 입력에서도 답을 바꾸지 못했다");
  }
  if (전진판정을_바꿔_굴린다(LINE, 같은거리전진판, 한도).best !== null) {
    throw new Error("같은 거리에서도 전진하는 판이 공선 입력에서 멈췄다");
  }
}

/** 배정밀도로 재면 값이 갈리는 두 점. 제곱 거리가 홀수라 배정밀도가 못 담는다. */
function FAR_PAIR(): Point[] {
  return [
    [-C, 0],
    [C, 1],
  ];
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 모든 쌍을 재는 방법의 규모. */
  "concept-scale": () => {
    const rows: string[][] = [
      ["점 n", "쌍의 수 n(n−1)/2", "지수로 적으면", "초당 1억 번 기준"],
    ];
    for (const n of [8, 100, 1_000, 10_000, 100_000]) {
      const pairs = (BigInt(n) * BigInt(n - 1)) / 2n;
      rows.push([
        comma(n),
        comma(pairs),
        Number(pairs).toExponential(2),
        duration(Number(pairs) / 1e8),
      ]);
    }
    return table(rows, [0, 1, 2, 3]).join("\n");
  },

  /** 껍질만 남기면 후보가 얼마나 주는가. */
  "concept-hull": () => {
    const rows: string[][] = [
      ["입력", "점 n", "껍질 m", "점 쌍", "껍질 위 쌍", "캘리퍼스가 본 쌍"],
    ];
    const cases: [string, Point[]][] = [
      ["전개가 쓰는 여덟 점", WALK],
      ["정사각형 네 점", SQUARE],
      ["원 위의 점 16", 원_위의_점(16)],
      ["원 위의 점 64", 원_위의_점(64)],
    ];
    for (const [name, pts] of cases) {
      const n = pts.length;
      const h = convexHull(pts).length;
      rows.push([
        name,
        comma(n),
        comma(h),
        comma((n * (n - 1)) / 2),
        comma((h * (h - 1)) / 2),
        comma(본_쌍(pts).size),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** 전개 입력의 스물여덟 쌍을 전부 잰다. */
  "build-brute": () => {
    const rows: string[][] = [["쌍", "제곱 거리", "쌍", "제곱 거리"]];
    const all: [string, bigint][] = [];
    for (let i = 0; i < WALK.length; i++) {
      for (let j = i + 1; j < WALK.length; j++) {
        const a = WALK[i] as Point;
        const b = WALK[j] as Point;
        all.push([`${좌표(a)}-${좌표(b)}`, squared(a, b)]);
      }
    }
    const half = Math.ceil(all.length / 2);
    for (let r = 0; r < half; r++) {
      const left = all[r] as [string, bigint];
      const right = all[r + half];
      rows.push([
        left[0],
        comma(left[1]),
        right === undefined ? "" : right[0],
        right === undefined ? "" : comma(right[1]),
      ]);
    }
    const best = 전부대조(WALK);
    const 최대 = all.filter(([, d]) => d === best).map(([n]) => n);
    const hull = new Set(convexHull(WALK).map((p) => 좌표(p)));
    const 안쪽 = all.filter(([name]) => {
      const [x, y] = name.split("-") as [string, string];
      return !hull.has(x) || !hull.has(y);
    });
    const 안쪽최대 = 안쪽.reduce((p, [, d]) => (d > p ? d : p), 0n);
    return `${table(rows, [1, 3]).join("\n")}
쌍 ${comma(all.length)} 개 · 가장 큰 값 ${comma(best)} · 그 값을 내는 쌍 ${최대.join(" ")}
껍질 꼭짓점끼리인 쌍 ${comma(all.length - 안쪽.length)} 개 · 안쪽 점이 낀 쌍 ${comma(안쪽.length)} 개 · 뒤엣것의 가장 큰 값 ${comma(안쪽최대)}`;
  },

  /** 변마다 가장 먼 꼭짓점을 넓이로 전수 확인한다. */
  "build-far": () => {
    const { hull } = 걸음들(WALK);
    const k = hull.length;
    const head = ["변", ...hull.map((_, m) => 이름(m)), "가장 먼 꼭짓점"];
    const rows: string[][] = [head];
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      const 값 = hull.map((c) => 넓이2배(a, b, c));
      let mx = 0;
      for (let m = 1; m < k; m++) {
        if ((값[m] as bigint) > (값[mx] as bigint)) mx = m;
      }
      rows.push([
        `${이름(i)}→${이름((i + 1) % k)}`,
        ...값.map((v) => comma(v)),
        `${이름(mx)} ${좌표(hull[mx] as Point)}`,
      ]);
    }
    const 동점 = [];
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      const 값 = hull.map((c) => 넓이2배(a, b, c));
      const mx = 값.reduce((p, c) => (c > p ? c : p));
      if (값.filter((v) => v === mx).length > 1) {
        동점.push(`${이름(i)}→${이름((i + 1) % k)}`);
      }
    }
    return `${table(
      rows,
      Array.from({ length: k + 1 }, (_, i) => i + 1),
    ).join("\n")}
칸의 값은 그 변을 밑변으로 삼은 삼각형 넓이의 2 배다. 가장 먼 꼭짓점이 둘인 변은 ${동점[0]}${과와(동점[0] ?? "")} ${동점[1]} 이다`;
  },

  /** far 가 뒤로 가지 않는다 — 변마다의 전진. */
  "build-monotone": () => {
    const { hull, steps } = 걸음들(WALK);
    const rows: string[][] = [
      [
        "변",
        "전진 전 far",
        "전진 횟수",
        "전진 후 far",
        "가장 먼 꼭짓점",
        "같은가",
      ],
    ];
    let before = 1;
    for (const s of steps) {
      const a = s.a;
      const b = s.b;
      const 값 = hull.map((c) => 넓이2배(a, b, c));
      let mx = 0;
      for (let m = 1; m < hull.length; m++) {
        if ((값[m] as bigint) > (값[mx] as bigint)) mx = m;
      }
      rows.push([
        `${이름(s.i)}→${이름((s.i + 1) % hull.length)}`,
        이름(before),
        comma(s.전진),
        이름(s.far),
        이름(mx),
        s.far === mx ? "같다" : "어긋난다",
      ]);
      before = s.far;
    }
    const 합 = steps.reduce((n, s) => n + s.전진, 0);
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
전진 횟수의 합 ${comma(합)} · 껍질 꼭짓점 ${comma(hull.length)} 개 · 비 ${(합 / hull.length).toFixed(2)} 배`;
  },

  /** 껍질 크기별로 후보 쌍이 셋 중 무엇인가. */
  "build-gain": () => {
    const rows: string[][] = [
      ["껍질 m", "껍질 위 모든 쌍", "캘리퍼스가 본 쌍", "비"],
    ];
    for (const k of [6, 16, 64, 256, 1024]) {
      const pts = k === 6 ? WALK : 원_위의_점(k);
      const h = convexHull(pts).length;
      const 전부 = (h * (h - 1)) / 2;
      const 본 = 본_쌍(pts).size;
      rows.push([
        comma(h),
        comma(전부),
        comma(본),
        `${(전부 / 본).toFixed(1)} 배`,
      ]);
    }
    return table(rows, [0, 1, 2, 3]).join("\n");
  },

  /** T2 의 전진 판정 — 외적 하나가 넓이 둘의 차다. */
  "walk-turn": () => {
    const { hull } = 걸음들(WALK);
    const k = hull.length;
    const a = hull[0] as Point;
    const b = hull[1] as Point;
    const rows: string[][] = [
      [
        "far",
        "c = hull[far]",
        "d = hull[far+1]",
        "(b−a)×(d−c)",
        "넓이2배(c)",
        "넓이2배(d)",
        "차",
        "전진하는가",
      ],
    ];
    let far = 1;
    for (let t = 0; t < 5; t++) {
      const c = hull[far] as Point;
      const d = hull[(far + 1) % k] as Point;
      const 부호 = crossSign(
        b[0] - a[0],
        b[1] - a[1],
        d[0] - c[0],
        d[1] - c[1],
      );
      const ac = 넓이2배(a, b, c);
      const ad = 넓이2배(a, b, d);
      rows.push([
        이름(far),
        좌표(c),
        좌표(d),
        comma(부호),
        comma(ac),
        comma(ad),
        comma(ad - ac),
        부호 > 0 ? "전진한다" : "멈춘다",
      ]);
      if (부호 <= 0) break;
      far = (far + 1) % k;
    }
    return `${table(rows, [3, 4, 5, 6]).join("\n")}
「(b−a)×(d−c)」 칸은 부호만 낸 값이고 「차」 칸이 실제 넓이 차다. 두 칸의 부호가 어긋난 줄은 없고, ${번째(rows.length - 1)} 판정에서 멈춘다`;
  },

  /** 전개 입력의 걸음별 값. */
  "walk-trace": () => {
    const { hull, steps } = 걸음들(WALK);
    const rows: string[][] = [
      ["걸음", "변", "a", "b", "전진", "far", "f", "|a−f|²", "|b−f|²", "best"],
    ];
    for (const s of steps) {
      rows.push([
        s.라벨,
        `${이름(s.i)}→${이름((s.i + 1) % hull.length)}`,
        좌표(s.a),
        좌표(s.b),
        comma(s.전진),
        이름(s.far),
        좌표(s.f),
        comma(s.d1),
        comma(s.d2),
        comma(s.best),
      ]);
    }
    return table(rows, [4, 7, 8, 9]).join("\n");
  },

  /** 방향 판정이 어느 갈래로 갔는가 — 배정밀도로 확정한 횟수와 큰 정수로 다시 잰 횟수. */
  "walk-branch": () => {
    const rows: string[][] = [
      [
        "입력",
        "방향 판정 호출",
        "① 배정밀도로 확정",
        "② 큰 정수로 재확정",
        "곱의 최댓값",
      ],
    ];
    for (const [name, pts] of [
      ["전개가 쓰는 여덟 점", WALK],
      [
        "좌표 상한 네 점",
        [
          [-C, -C],
          [C, C - 1],
          [C, -C],
          [-C, C],
        ] as Point[],
      ],
    ] as [string, Point[]][]) {
      const hull = convexHull(pts);
      const k = hull.length;
      let 확정 = 0;
      let 재확정 = 0;
      let 최대곱 = 0;
      const 재기 = (ux: number, uy: number, vx: number, vy: number): number => {
        const approx = ux * vy - uy * vx;
        최대곱 = Math.max(최대곱, Math.abs(ux * vy), Math.abs(uy * vx));
        if (approx > 2048 || approx < -2048) {
          확정++;
          return approx > 0 ? 1 : -1;
        }
        재확정++;
        const e = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
        return e > 0n ? 1 : e < 0n ? -1 : 0;
      };
      let far = 1;
      for (let i = 0; i < k; i++) {
        const a = hull[i] as Point;
        const b = hull[(i + 1) % k] as Point;
        for (;;) {
          const c = hull[far] as Point;
          const d = hull[(far + 1) % k] as Point;
          if (재기(b[0] - a[0], b[1] - a[1], d[0] - c[0], d[1] - c[1]) <= 0) {
            break;
          }
          far = (far + 1) % k;
        }
      }
      rows.push([
        name,
        comma(확정 + 재확정),
        comma(확정),
        comma(재확정),
        comma(최대곱),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
껍질을 세우는 구간은 빼고 캘리퍼스 구간만 센 값이다. SAFE 는 2,048 이다`;
  },

  /** 같은 거리인 꼭짓점에서도 전진하는 판. */
  "pause-geq": () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "같은 거리에서도 전진하는 판",
        "바꾼 줄을 지나간 횟수",
        "판정",
      ],
    ];
    for (const [name, pts] of FOUR) {
      const ok = diameterSquared(pts);
      const got = 전진판정을_바꿔_굴린다(pts, 같은거리전진판, 한도);
      // 멈추는 입력에서는 직접 굴린 결과가 변이 모듈의 답과 같아야 한다.
      if (!중화됨 && got.best !== null) {
        if (got.best !== 같은거리전진판.diameterSquared(pts)) {
          throw new Error(`${name} — 사본이 기계로 만든 변이와 다른 값을 냈다`);
        }
      }
      rows.push([
        name,
        comma(ok),
        got.best === null
          ? `전진 ${comma(한도)} 회에서 끊었다`
          : comma(got.best),
        comma(방문(pts).전진판정),
        got.best === ok ? "같다" : "어긋난다",
      ]);
    }
    return table(rows, [1, 3]).join("\n");
  },

  /** 무게중심에서 가장 먼 두 점을 지름이라고 본 방법. */
  "pause-centroid": () => {
    const rows: string[][] = [
      ["입력", "무게중심에서 먼 두 점", "그 쌍의 제곱 거리", "지름", "판정"],
    ];
    const cases: [string, Point[]][] = [
      ["전개가 쓰는 여덟 점", WALK],
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
    for (const [name, pts] of cases) {
      const { pair, d } = 무게중심_두_점(pts);
      const 참 = diameterSquared(pts);
      rows.push([
        name,
        `${좌표(pair[0])}-${좌표(pair[1])}`,
        comma(d),
        comma(참),
        d === 참 ? "같다" : "어긋난다",
      ]);
    }
    return table(rows, [2, 3]).join("\n");
  },

  /** 제곱 거리를 배정밀도로 낸 판. */
  "pause-double": () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "제곱 거리를 배정밀도로 낸 판",
        "바꾼 줄을 지나간 횟수",
        "판정",
      ],
    ];
    const cases: [string, Point[]][] = [
      ["전개가 쓰는 여덟 점", WALK],
      ["좌표 상한 (−10^9,0)·(10^9,1)", FAR_PAIR()],
      [
        "좌표 상한 네 점",
        [
          [-C, -C],
          [C, C - 1],
          [C, -C],
          [-C, C],
        ],
      ],
      ["공선인 네 점 (0,0)~(9,0)", LINE],
    ];
    for (const [name, pts] of cases) {
      const ok = diameterSquared(pts);
      const bad = 배정밀도판.diameterSquared(pts);
      rows.push([
        name,
        comma(ok),
        comma(bad),
        comma(방문(pts).거리),
        ok === bad ? "같다" : "어긋난다",
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 좌표 상한에서 배정밀도 제곱 거리가 얼마나 자주 갈리는가. */
  "pause-double-scale": () => {
    const rows: string[][] = [
      [
        "좌표 상한",
        "잰 쌍",
        "값이 갈린 쌍",
        "비율",
        "가장 큰 차",
        "배정밀도로 옮겨도 갈린 쌍",
      ],
    ];
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
        comma(cap),
        comma(n),
        comma(갈림),
        `${((100 * 갈림) / n).toFixed(1)}%`,
        comma(최대),
        comma(옮겨도),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4, 5]).join("\n")}
시드 20,260,908 인 선형 합동 생성기가 만든 쌍이라 몇 번을 실행해도 같은 값이 나온다`;
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const rows: string[][] = [
      ["입력", "껍질 m", "반환값", "전부 대조", "같은가"],
    ];
    const cases: [string, Point[]][] = [
      ["전개가 쓰는 여덟 점", WALK],
      ["정사각형 네 점", SQUARE],
      ["공선인 네 점 (0,0)~(9,0)", LINE],
      ["같은 점 셋 (5,5)", SAME],
      ["점 하나 (3,4)", [[3, 4]]],
      ["빈 배열", []],
      [
        "삼각형 (0,0)(6,0)(3,4)",
        [
          [0, 0],
          [6, 0],
          [3, 4],
        ],
      ],
      [
        "좌표 상한 세 점",
        [
          [-C, 0],
          [C, 0],
          [0, 0],
        ],
      ],
    ];
    for (const [name, pts] of cases) {
      const got = rotatingCalipersDiameter(pts);
      const 참 = 전부대조(pts);
      rows.push([
        name,
        comma(convexHull(pts).length),
        comma(got),
        comma(참),
        BigInt(got) === 참 ? "같다" : "어긋난다",
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 지지 함수 — 방향마다의 최댓값과 그 최댓값을 내는 꼭짓점. */
  "related-support": () => {
    const { hull, steps } = 걸음들(WALK);
    const k = hull.length;
    const rows: string[][] = [
      [
        "변",
        "그 변에 수직인 안쪽 방향 u",
        "지지값 h(u)",
        "그 값을 내는 꼭짓점",
        "그 변의 far",
      ],
    ];
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      // 반시계 껍질에서 변 a→b 를 왼쪽으로 90 도 회전시킨 (−dy, dx) 가 껍질 안쪽을 가리킨다.
      const nx = -(b[1] - a[1]) || 0;
      const ny = b[0] - a[0] || 0;
      const 값 = hull.map(
        (p) => BigInt(p[0]) * BigInt(nx) + BigInt(p[1]) * BigInt(ny),
      );
      const mx = 값.reduce((p, c) => (c > p ? c : p));
      const 자리 = 값
        .map((v, m) => (v === mx ? 이름(m) : ""))
        .filter((s) => s !== "");
      rows.push([
        `${이름(i)}→${이름((i + 1) % k)}`,
        `(${nx},${ny})`,
        comma(mx),
        자리.join(" · "),
        이름(steps[i]?.far ?? 0),
      ]);
    }
    const 어긋남 = steps.filter(
      (s2, m) => !(rows[m + 1]?.[3] ?? "").split(" · ").includes(이름(s2.far)),
    ).length;
    return `${table(rows, [2]).join("\n")}
지지값을 가장 크게 하는 꼭짓점과 그 변의 far 가 어긋난 변 ${comma(어긋남)} 개`;
  },

  /** 경쟁 설계 대조 — 값은 `.alt.ts` 를 불러서 얻는다. */
  "alt-counts": () => {
    const rows: string[][] = [
      [
        "입력",
        "껍질 m",
        "정본 기본 연산",
        "껍질 위 모든 쌍 기본 연산",
        "기본 연산이 적은 쪽",
      ],
    ];
    const cases: [string, Point[]][] = [
      ["전개가 쓰는 여덟 점", ALT_WALK],
      ["원 위의 점 9", 원_위의_점(9)],
      ["원 위의 점 10", 원_위의_점(10)],
      ["원 위의 점 64", 원_위의_점(64)],
      ["원 위의 점 1024", 원_위의_점(1024)],
    ];
    for (const [name, pts] of cases) {
      const { 정본, 모든쌍 } = 계수(pts);
      const x = 정본.거리 + 정본.방향;
      const y = 모든쌍.거리 + 모든쌍.방향;
      rows.push([
        name,
        comma(convexHull(pts).length),
        comma(x),
        comma(y),
        x < y ? "정본" : "껍질 위 모든 쌍",
      ]);
    }
    const 큰것 = 계수(원_위의_점(1024));
    return `${table(rows, [1, 2, 3]).join("\n")}
껍질 꼭짓점 1,024 개에서 거리 계산은 ${comma(큰것.정본.거리)} 대 ${comma(큰것.모든쌍.거리)} 이고 방향 판정은 ${comma(큰것.정본.방향)} 대 ${comma(큰것.모든쌍.방향)} 이다
저장 칸은 ${comma(큰것.정본.칸)} 대 ${comma(큰것.모든쌍.칸)} 로 안 갈리고, 기본 연산 축은 껍질 ${comma(뒤집히는_껍질_크기())} 에서 순서가 뒤집힌다`;
  },

  /** 오차 한계를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const rows: string[][] = [
      ["좌표 상한 C", "곱의 상한 4C²", "2^53 을 넘는가", "오차 한계 C²/2^49"],
    ];
    for (const cap of [1_000, 23_726_566, 33_554_432, 47_453_133, C]) {
      const 곱 = 4n * BigInt(cap) * BigInt(cap);
      rows.push([
        comma(cap),
        comma(곱),
        곱 > SAFE_INT ? "넘는다" : "안 넘는다",
        한계(cap),
      ]);
    }
    return `${table(rows, [0, 1, 3]).join("\n")}
2^53 = ${comma(SAFE_INT)} 이고 SAFE = 2,048 이다`;
  },

  /** 배정밀도 외적의 실제 오차와 부호. */
  "math-sign": () => {
    const rows: string[][] = [
      [
        "벡터 두 개",
        "정확한 외적",
        "배정밀도 값",
        "차",
        "정본 부호",
        "배정밀도만 쓴 부호",
      ],
    ];
    const cases: [number, number, number, number][] = [
      [1_000, 999, 1_001, 1_000],
      [100_000_000, 99_999_999, 100_000_001, 100_000_000],
      [C, C - 1, C + 1, C],
      [2 * C, 2 * C - 1, 2 * C, 2 * C - 1],
    ];
    for (const [ux, uy, vx, vy] of cases) {
      const exact = BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx);
      const approx = ux * vy - uy * vx;
      rows.push([
        `u=(${ux}, ${uy}) v=(${vx}, ${vy})`,
        comma(exact),
        comma(approx),
        comma(BigInt(approx) - exact),
        comma(crossSign(ux, uy, vx, vy)),
        comma(approx > 0 ? 1 : approx < 0 ? -1 : 0),
      ]);
    }
    // 부호가 뒤집히는 자리가 실제로 있는지 스윕한다.
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
    return `${table(rows, [1, 2, 3, 4, 5]).join("\n")}
성분이 이웃한 큰 정수인 벡터 쌍 ${comma(n)} 개 — 배정밀도 부호가 0 으로 접힌 것 ${comma(접힘)} · 부호가 반대로 뒤집힌 것 ${comma(뒤집힘)} · 가장 큰 오차 ${comma(최대오차)}`;
  },

  /** 좌표 상한별로 무엇이 정확한가. */
  "math-caps": () => {
    const rows: string[][] = [
      [
        "좌표 상한 C",
        "제곱 거리 상한 8C²",
        "2^53 안인가",
        "외적 오차 한계",
        "걸러내기가 필요한가",
      ],
    ];
    for (const cap of [23_726_566, 23_726_567, 33_554_432, 33_554_433, C]) {
      const 제곱 = 8n * BigInt(cap) * BigInt(cap);
      const err = cap ** 2 / 2 ** 49;
      rows.push([
        comma(cap),
        comma(제곱),
        제곱 <= SAFE_INT ? "그렇다" : "아니다",
        한계(cap),
        err < 1 ? "아니다" : "그렇다",
      ]);
    }
    // 8C² <= 2^53 을 만족하는 가장 큰 C 와 err(C) < 1 을 만족하는 가장 큰 C 를 실행으로 낸다.
    let 정확 = 1;
    while (8n * BigInt(정확 + 1) * BigInt(정확 + 1) <= SAFE_INT) 정확++;
    let 필요없음 = 1;
    while ((필요없음 + 1) ** 2 / 2 ** 49 < 1) 필요없음++;
    return `${table(rows, [0, 1, 3]).join("\n")}
제곱 거리가 배정밀도로 정확한 가장 큰 좌표 상한 ${comma(정확)} · 걸러내기 없이 부호가 확정되는 가장 큰 좌표 상한 ${comma(필요없음)}`;
  },

  /** 불변식이 걸음마다 유지되는지 실행이 판정한 결과. */
  "invariant-far": () => {
    const rows: string[][] = [
      [
        "입력 묶음",
        "확인한 걸음 수",
        "far 가 가장 먼 꼭짓점이 아닌 걸음",
        "far 가 뒤로 간 걸음",
      ],
    ];
    const groups: [string, () => Iterable<Point[]>][] = [
      [
        "전개 입력 하나",
        function* () {
          yield WALK;
        },
      ],
      [
        "원 위의 점 3..64",
        function* () {
          for (let k = 3; k <= 64; k++) yield 원_위의_점(k);
        },
      ],
      [
        "0..5 격자에서 뽑은 점 묶음 전수",
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
    for (const [name, gen] of groups) {
      let 걸음수 = 0;
      let 최대아님 = 0;
      let 뒤로 = 0;
      for (const pts of gen()) {
        const { hull, steps } = 걸음들(pts);
        const k = hull.length;
        let before = 1;
        for (const s of steps) {
          걸음수++;
          const 값 = hull.map((c) => 넓이2배(s.a, s.b, c));
          const mx = 값.reduce((p, c) => (c > p ? c : p));
          if ((값[s.far] as bigint) !== mx) 최대아님++;
          // 첨자가 한 바퀴 안에서 앞으로만 가는지 본다.
          const 전진량 = (s.far - before + k) % k;
          if (전진량 !== s.전진) 뒤로++;
          before = s.far;
        }
      }
      rows.push([name, comma(걸음수), comma(최대아님), comma(뒤로)]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 경계에 있는 입력들. */
  "edge-values": () => {
    const rows: string[][] = [["입력", "껍질", "반환값", "왜 경계인가"]];
    const cases: [string, Point[], string][] = [
      ["[]", [], "점이 없어 껍질도 비고 반복이 한 번도 실행되지 않는다"],
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
        "중복 점이 섞여도 껍질에는 한 번만 담긴다",
      ],
      ["[(5,5)] x 3", SAME, "같은 점이 여럿이라 껍질이 한 점이다"],
      [
        "좌표 상한 두 점",
        [
          [-C, -C],
          [C, C],
        ],
        "제곱 거리가 8×10^18 로 이 문제의 최댓값이다",
      ],
    ];
    for (const [name, pts, why] of cases) {
      rows.push([
        name,
        comma(convexHull(pts).length),
        comma(rotatingCalipersDiameter(pts)),
        why,
      ]);
    }
    return table(rows, [1, 2]).join("\n");
  },

  /** 변마다 최대 한 번만 전진하는 판 — 불변식을 지키던 그 줄이다. */
  "mutant-once": () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "변마다 한 번만 전진하는 판",
        "바꾼 줄을 지나간 횟수",
        "판정",
      ],
    ];
    const cases: [string, Point[]][] = [
      ["전개가 쓰는 여덟 점", WALK],
      ["정사각형 네 점", SQUARE],
      ["원 위의 점 16", 원_위의_점(16)],
      ["같은 점 셋 (5,5)", SAME],
    ];
    for (const [name, pts] of cases) {
      const ok = diameterSquared(pts);
      const bad = 한번만전진판.diameterSquared(pts);
      rows.push([
        name,
        comma(ok),
        comma(bad),
        comma(방문(pts).반복머리),
        ok === bad ? "같다" : "어긋난다",
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 한 번만 전진하는 판이 걸음마다 어떤 far 를 내는가. */
  "mutant-once-steps": () => {
    const pts = 원_위의_점(16);
    const hull = convexHull(pts);
    const k = hull.length;
    const rows: string[][] = [
      ["변", "정본 far", "한 번만 전진하는 판의 far", "정본 best", "변이 best"],
    ];
    let farOk = 1;
    let farBad = 1;
    let bestOk = 0n;
    let bestBad = 0n;
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      while (
        farther(a, b, hull[farOk] as Point, hull[(farOk + 1) % k] as Point)
      ) {
        farOk = (farOk + 1) % k;
      }
      if (
        farther(a, b, hull[farBad] as Point, hull[(farBad + 1) % k] as Point)
      ) {
        farBad = (farBad + 1) % k;
      }
      for (const [f, use] of [
        [farOk, "ok"],
        [farBad, "bad"],
      ] as [number, string][]) {
        const g = hull[f] as Point;
        const d = squared(a, g) > squared(b, g) ? squared(a, g) : squared(b, g);
        if (use === "ok") {
          if (d > bestOk) bestOk = d;
        } else if (d > bestBad) bestBad = d;
      }
      if (i < 6 || i === k - 1) {
        rows.push([
          `${이름(i)}→${이름((i + 1) % k)}`,
          이름(farOk),
          이름(farBad),
          comma(bestOk),
          comma(bestBad),
        ]);
      }
    }
    if (!중화됨 && bestBad !== 한번만전진판.diameterSquared(pts)) {
      throw new Error("사본이 기계로 만든 변이와 다른 값을 냈다");
    }
    return `${table(rows, [3, 4]).join("\n")}
첨자는 「원 위의 점 16」 의 껍질 ${이름(0)}…${이름(k - 1)} 이고 전개 입력의 껍질과 다른 것이다
변 여섯과 마지막 변만 보였다. far 가 ${이름(farOk)} 대 ${이름(farBad)} 로 벌어져 있고 그 차이가 답까지 이어진다`;
  },

  /**
   * 「답이 같다」인 줄에서 **중간 값도 같았는가.** 변이를 건 줄을 한 번이라도 지나갔는데 답이
   * 같으면, 그 변이가 무해한 것인지 중간이 갈렸다가 상쇄된 것인지를 값으로 갈라야 한다.
   *
   * 판정 낱말(`같다`·`어긋난다`)을 이 표에 쓰지 않는다 — 중화 실행에서 「갈린 걸음」 칸이
   * 0 으로 바뀌므로, 판정 낱말을 쓰면 중화 대조가 그 줄을 위반으로 읽는다.
   */
  "mutant-same-steps": () => {
    const rows: string[][] = [
      [
        "변이",
        "입력",
        "바꾼 줄을 지나간 횟수",
        "중간 값이 갈린 걸음",
        "확인한 걸음",
        "답",
      ],
    ];
    /** 정본과 판 하나를 변마다 나란히 굴리며 (far, best) 를 견준다. */
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
      ["전개가 쓰는 여덟 점", WALK],
      ["정사각형 네 점", SQUARE],
      ["공선인 네 점 (0,0)~(9,0)", LINE],
    ];
    for (const [label, impl, site] of 판들) {
      for (const [name, pts] of 입력들) {
        const 참 = diameterSquared(pts);
        const r = 나란히(pts, impl);
        if (r.답 !== null && r.답 !== 참) continue; // 답이 갈린 줄은 따로 있는 표가 다룬다
        rows.push([
          label,
          name,
          comma(방문(pts)[site]),
          r.답 === null ? "—" : comma(r.갈림),
          r.답 === null ? "—" : comma(r.걸음),
          r.답 === null ? "멈추지 않는다" : "그대로",
        ]);
      }
    }
    return `${table(rows, [2, 3, 4]).join("\n")}
「중간 값」은 걸음마다의 far 와 best 두 값이다. 정본과 변이를 변마다 나란히 굴려 견준 결과다`;
  },

  /** 전개 입력에서 실제로 한 일. */
  "perf-ops": () => {
    const { hull, steps } = 걸음들(WALK);
    const v = 방문(WALK);
    const rows: string[][] = [["무엇", "몇 번", "근거"]];
    rows.push([
      "바깥 반복",
      comma(v.반복머리),
      `껍질 꼭짓점 ${comma(hull.length)} 개마다 한 번이다`,
    ]);
    rows.push([
      "방향 판정",
      comma(v.전진판정),
      `변마다 멈추는 판정 ${comma(hull.length)} 번에 전진 ${comma(steps.reduce((n, s) => n + s.전진, 0))} 번을 더한 값이다`,
    ]);
    rows.push([
      "거리 계산",
      comma(v.거리),
      `변마다 후보 쌍 둘이라 ${comma(hull.length)} × 2 다`,
    ]);
    rows.push([
      "기본 연산 합",
      comma(v.전진판정 + v.거리),
      "껍질을 세운 뒤에 부르는 함수의 총수다",
    ]);
    return table(rows, [1]).join("\n");
  },

  /** 껍질 크기를 네 배씩 키우며 계수를 센다. */
  "perf-growth": () => {
    const rows: string[][] = [
      [
        "껍질 m",
        "방향 판정",
        "거리 계산",
        "기본 연산",
        "m 으로 나눈 값",
        "성장률",
      ],
    ];
    let 앞 = 0;
    for (const k of [4, 16, 64, 256, 1024]) {
      const pts = 원_위의_점(k);
      const v = 방문(pts);
      const 합 = v.전진판정 + v.거리;
      rows.push([
        comma(k),
        comma(v.전진판정),
        comma(v.거리),
        comma(합),
        (합 / k).toFixed(2),
        앞 === 0 ? "—" : (합 / 앞).toFixed(2),
      ]);
      앞 = 합;
    }
    return `${table(rows, [0, 1, 2, 3, 4, 5]).join("\n")}
껍질을 네 배로 하면 기본 연산도 네 배에 가깝다. 그 값이 m 에 비례한다는 뜻이다`;
  },

  /** 최악을 만드는 입력 — 모양별로 실제로 재 본다. */
  "perf-worst": () => {
    const rows: string[][] = [
      [
        "입력 모양",
        "점 n",
        "껍질 m",
        "m/n",
        "방향 판정",
        "거리 계산",
        "기본 연산",
      ],
    ];
    const N = 4_096;
    let seed = 20_260_908;
    const rnd = (m: number): number => {
      seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
      return seed % m;
    };
    const 정사각형안: Point[] = Array.from(
      { length: N },
      () => [rnd(1_000_000), rnd(1_000_000)] as Point,
    );
    const 격자변: Point[] = Array.from({ length: N }, (_, i) => {
      const s = Math.floor(N / 4);
      const t = i % s;
      const 면 = Math.floor(i / s);
      const L = 1_000_000;
      if (면 === 0) return [Math.floor((t * L) / s), 0] as Point;
      if (면 === 1) return [L, Math.floor((t * L) / s)] as Point;
      if (면 === 2) return [L - Math.floor((t * L) / s), L] as Point;
      return [0, L - Math.floor((t * L) / s)] as Point;
    });
    const cases: [string, Point[]][] = [
      ["정사각형 안에 흩어 놓은 점", 정사각형안],
      ["정사각형 테두리 위의 점", 격자변],
      ["원 위의 점", 원_위의_점(N)],
    ];
    for (const [name, pts] of cases) {
      const h = convexHull(pts).length;
      const v = 방문(pts);
      rows.push([
        name,
        comma(pts.length),
        comma(h),
        `${((100 * h) / pts.length).toFixed(1)}%`,
        comma(v.전진판정),
        comma(v.거리),
        comma(v.전진판정 + v.거리),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4, 5, 6]).join("\n")}
점의 수는 셋 다 ${comma(N)} 로 같다. 갈리는 것은 그중 몇 개가 껍질에 남는가다`;
  },

  /** 스스로 점검하기의 답 — 같은 거리인 두 꼭짓점 중 어느 쪽에 멈춰도 답이 같은가. */
  "check-answer": () => {
    const { hull } = 걸음들(WALK);
    const k = hull.length;
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
    const a = hull[1] as Point;
    const b = hull[2] as Point;
    const rows: string[][] = [
      [
        "변 h1→h2 에서의 far",
        "그 꼭짓점의 넓이2배",
        "|a−f|²",
        "|b−f|²",
        "그 걸음 뒤의 best",
        "끝까지 실행한 답",
      ],
    ];
    for (const [m, 설명] of [
      [4, "h4 — 정본이 멈추는 자리"],
      [5, "h5 — 똑같이 먼 다른 꼭짓점"],
    ] as [number, string][]) {
      const f = hull[m] as Point;
      const r = 강제(1, m);
      rows.push([
        설명,
        comma(넓이2배(a, b, f)),
        comma(squared(a, f)),
        comma(squared(b, f)),
        comma(r.그_걸음),
        comma(r.답),
      ]);
    }
    const 정본답 = diameterSquared(WALK);
    if (강제(1, 5).답 !== 정본답) throw new Error("강제한 판이 다른 답을 냈다");
    const 이름들 = "h4 · h5";
    return `${table(rows, [1, 2, 3, 4, 5]).join("\n")}
${이름들}${을를(이름들)} 바꿔 넣어도 끝까지 실행한 답은 둘 다 ${comma(정본답)} 이다`;
  },
};
