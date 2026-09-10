/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts convexHull-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { convexHull, type Point, sideOf } from "./convexHull-guide.ref.ts";

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

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 점 목록의 표기. */
const list = (ps: Point[]): string =>
  ps.length === 0 ? "없음" : ps.map(pt).join(" ");

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
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 여덟 점 안에 이 절차의 갈래가 전부 들어 있다 — 안쪽 점 하나, 변 위의 공선 중간 점 하나,
 * 같은 좌표 한 쌍, 세로로 늘어선 세 점, 그리고 두 사슬이 서로 다른 꼭짓점을 담는 모양이다.
 */
const WALK: Point[] = [
  [3, 2],
  [6, 0],
  [0, 0],
  [3, 4],
  [6, 3],
  [0, 3],
  [3, 0],
  [6, 0],
];

/** 제약의 최댓값 — 점 개수와 좌표의 절댓값 상한. */
const LIMIT = 100_000;
const COORD = 1_000_000_000;

/** 세 번째 멈춤이 다루는 입력. 좌표가 상한에 붙어 있고 꼭짓점 하나가 아주 얕다. */
const SHALLOW: Point[] = [
  [0, 0],
  [999_999_999, 999_999_998],
  [1_000_000_000, 999_999_999],
  [0, 1],
];

/** 첫 번째 멈춤이 쓰는 작은 반례. 세로로 늘어선 점이 셋이다. */
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

/** 정렬해 중복을 지운 점 목록. 정본이 안에서 하는 것과 같다. */
function distinct(points: Point[]): Point[] {
  const sorted = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const out: Point[] = [];
  for (const p of sorted) {
    const last = out.at(-1);
    if (last === undefined || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
}

/* ────────────────────────── 계측기 ────────────────────────── */

interface ChainStat {
  hull: Point[];
  /** 서로 다른 점의 개수. */
  distinct: number;
  /** 방향 판정 횟수. */
  tests: number;
  /** 사슬에서 걷어낸 점의 개수. */
  pops: number;
  /** 사슬 끝까지 남은 점을 담은 뒤 판정이 실패한 횟수. */
  fails: number;
  lower: Point[];
  upper: Point[];
}

/** 정본과 같은 절차에 계수만 덧붙인 것. */
function counted(points: Point[]): ChainStat {
  const uniq = distinct(points);
  let tests = 0;
  let pops = 0;
  let fails = 0;
  const chain = (seq: Point[]): Point[] => {
    const built: Point[] = [];
    for (const p of seq) {
      while (built.length >= 2) {
        tests++;
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        if (sideOf(o, a, p) > 0) {
          fails++;
          break;
        }
        built.pop();
        pops++;
      }
      built.push(p);
    }
    return built;
  };
  if (uniq.length <= 2) {
    return {
      hull: uniq,
      distinct: uniq.length,
      tests,
      pops,
      fails,
      lower: uniq,
      upper: [],
    };
  }
  const lower = chain(uniq);
  const upper = chain([...uniq].reverse());
  const lo = [...lower];
  const up = [...upper];
  lo.pop();
  up.pop();
  return {
    hull: lo.concat(up),
    distinct: uniq.length,
    tests,
    pops,
    fails,
    lower,
    upper,
  };
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 다른 절차를 잰 것이다. */
function assertSame(points: Point[], got: Point[]): Point[] {
  const want = convexHull(points);
  if (list(got) !== list(want)) {
    throw new Error(`계측기와 정본의 답이 다르다 — 점 ${points.length} 개`);
  }
  return got;
}

/** 배정밀도 곱만으로 부호를 확정할 수 있는 하한. 정본과 같은 값이다. */
const SAFE = 2048;

/** 두 사슬을 쌓는 동안 판정값이 0 이 된 자리의 수. */
function zeroTurns(points: Point[]): number {
  let zeros = 0;
  const chain = (seq: Point[]): void => {
    const built: Point[] = [];
    for (const p of seq) {
      while (built.length >= 2) {
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        const s = sideOf(o, a, p);
        if (s === 0) zeros++;
        if (s > 0) break;
        built.pop();
      }
      built.push(p);
    }
  };
  const uniq = distinct(points);
  chain(uniq);
  chain([...uniq].reverse());
  return zeros;
}

/** 배정밀도 값이 `SAFE` 이하라 큰 정수로 되재야 했던 판정의 수. */
function exactPathCount(points: Point[]): number {
  let slow = 0;
  const chain = (seq: Point[]): void => {
    const built: Point[] = [];
    for (const p of seq) {
      while (built.length >= 2) {
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        const approx =
          (a[0] - o[0]) * (p[1] - o[1]) - (a[1] - o[1]) * (p[0] - o[0]);
        if (!(approx > SAFE || approx < -SAFE)) slow++;
        if (sideOf(o, a, p) > 0) break;
        built.pop();
      }
      built.push(p);
    }
  };
  const uniq = distinct(points);
  chain(uniq);
  chain([...uniq].reverse());
  return slow;
}

/** 방향 판정 횟수의 상한. `deep.math` 가 유도하는 식이다. */
const testBound = (m: number, h: number): number => 4 * m - h - 6;

/**
 * 정의를 그대로 옮긴 방법 — 순서쌍마다 나머지 점이 전부 왼쪽인지 확인해 껍질의 변을 찾는다.
 *
 * 나머지가 전부 왼쪽이거나 직선 위이고 그중 하나라도 직선 밖이면 그 순서쌍이 껍질의 변이다.
 * 이 판정이 내는 것은 **변 위의 점 전부**라, 꼭짓점만 남기려면 규칙이 하나 더 든다.
 */
function byDefinition(points: Point[]): {
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
    tests,
    edgePairs,
    onEdge: [...marked].sort((x, y) => x - y).map((at) => uniq[at] as Point),
  };
}

/** 비교 횟수를 세는 합치기 정렬. 엔진의 정렬에 기대면 계수가 구현에 따라 갈린다. */
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

/** 좌표로 정렬할 때의 계수 — 비교만 들고 방향 판정은 한 번도 안 든다. */
function sortByCoordinate(points: Point[]): {
  compares: number;
  tests: number;
} {
  const seen = { compares: 0 };
  sortCounted(
    [...points],
    (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]),
    seen,
  );
  return { compares: seen.compares, tests: 0 };
}

/** 기준점에서 본 각도로 정렬할 때의 계수 — 비교마다 방향 판정이 붙는다. */
function sortByAngle(points: Point[]): { compares: number; tests: number } {
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

/** 사슬을 하나만 쌓았을 때 남는 점. 아래쪽 절반만 나온다. */
function singleChain(points: Point[]): Point[] {
  const uniq = distinct(points);
  const built: Point[] = [];
  for (const p of uniq) {
    while (built.length >= 2) {
      const o = built.at(-2) as Point;
      const a = built.at(-1) as Point;
      if (sideOf(o, a, p) > 0) break;
      built.pop();
    }
    built.push(p);
  }
  return built;
}

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

/** 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 변이의 답을 나란히 놓은 표를 만든다. */
function contrast(
  cases: [string, Point[]][],
  other: (points: Point[]) => Point[],
  otherHead: string,
): string {
  const gaps: number[] = [];
  const rows = cases.map(([label, points]) => {
    const bare = convexHull(points);
    const got = other(points);
    const same = list(bare) === list(got);
    gaps.push(same ? 0 : 1);
    return [label, list(bare), list(got), same ? "같다" : "어긋난다"];
  });
  assertBreaks(gaps);
  return table(["입력", "정본이 낸 답", otherHead, "대조"], rows, [
    "l",
    "l",
    "l",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 정의를 그대로 옮긴 방법과 이 절차의 방향 판정 횟수. */
  "concept-scale": () => {
    const rows = [
      ["전개 입력", WALK],
      ["흩어진 점 100 개", scatter(100)],
      ["흩어진 점 1,000 개", scatter(1_000)],
    ].map(([label, points]) => {
      const pts = points as Point[];
      const c = counted(pts);
      assertSame(pts, c.hull);
      const d = byDefinition(pts);
      return [
        label as string,
        num(c.distinct),
        num(d.tests),
        num(c.tests),
        (d.tests / c.tests).toFixed(1),
      ];
    });
    const small = byDefinition(scatter(100)).tests;
    const large = byDefinition(scatter(1_000)).tests;
    const naiveGrowth = large / small;
    const chainGrowth =
      counted(scatter(1_000)).tests / counted(scatter(100)).tests;
    return [
      table(
        [
          "입력",
          "서로 다른 점",
          "정의를 그대로 옮기면",
          "사슬 둘이면",
          "앞이 뒤의 몇 배",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `└ 둘 다 방향 판정 횟수다. 서로 다른 점이 100 에서 1,000 으로 열 배가 될 때 앞은 ${(
        naiveGrowth
      ).toFixed(1)} 배가 되고 뒤는 ${chainGrowth.toFixed(1)} 배가 된다`,
    ].join("\n");
  },

  /** `concept` — 전개 입력에서 어떤 점이 왜 빠지는가. */
  "concept-drop": () => {
    const hull = convexHull(WALK);
    const inHull = new Set(hull.map(pt));
    const uniq = distinct(WALK);
    const rows = uniq.map((p) => {
      const kept = inHull.has(pt(p));
      const why = kept
        ? "꼭짓점 — 여기서 껍질이 꺾인다"
        : p[0] === 3 && p[1] === 0
          ? "변 위의 공선 중간 점"
          : "껍질 안쪽";
      return [pt(p), kept ? "담긴다" : "빠진다", why];
    });
    const dup = WALK.length - uniq.length;
    return [
      table(["점", "답에", "왜"], rows, ["l", "l", "l"]),
      "",
      `입력 ${WALK.length} 개 가운데 같은 좌표가 ${dup} 개라 서로 다른 점은 ${uniq.length} 개다`,
      `답  ${list(hull)}`,
      "└ 반시계 방향으로 왼쪽 아래에서 시작한다",
    ].join("\n");
  },

  /** `deep.build` ② — 정의를 그대로 옮긴 방법의 계수와, 그것이 내는 답. */
  "build-naive": () => {
    const d = byDefinition(WALK);
    const uniq = distinct(WALK);
    const m = uniq.length;
    const hull = convexHull(WALK);
    return [
      table(
        ["무엇", "값"],
        [
          ["서로 다른 점 m", num(m)],
          ["확인해야 하는 순서쌍 m(m−1)", num(m * (m - 1))],
          ["순서쌍마다 남은 점 m−2", num(m - 2)],
          ["실제로 든 방향 판정", num(d.tests)],
          ["가지치기 없이 셀 때 m(m−1)(m−2)", num(m * (m - 1) * (m - 2))],
          ["껍질의 변으로 잡힌 순서쌍", num(d.edgePairs)],
          ["버려진 순서쌍", num(m * (m - 1) - d.edgePairs)],
        ],
        ["l", "r"],
      ),
      "",
      `이 판정이 내는 점  ${list(d.onEdge)}`,
      `실제 꼭짓점       ${list(hull)}`,
      `└ 변 위의 공선 중간 점 ${list(d.onEdge.filter((p) => !hull.some((q) => q[0] === p[0] && q[1] === p[1])))} 이 섞여 들어와, 꼭짓점만 남기려면 규칙이 하나 더 든다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 정렬 기준 두 후보를 같은 입력에서 잰다. */
  "build-sort-basis": () => {
    const rows = [
      ["전개 입력", WALK],
      ["흩어진 점 1,000 개", scatter(1_000)],
      ["흩어진 점 100,000 개", scatter(LIMIT)],
    ].map(([label, points]) => {
      const pts = points as Point[];
      const byCoord = sortByCoordinate(pts);
      const byAngle = sortByAngle(pts);
      return [
        label as string,
        num(byCoord.compares),
        num(byCoord.tests),
        num(byAngle.compares),
        num(byAngle.tests),
      ];
    });
    return [
      table(
        [
          "입력",
          "좌표 정렬 비교",
          "좌표 정렬 방향 판정",
          "각도 정렬 비교",
          "각도 정렬 방향 판정",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 비교 횟수는 둘이 거의 같은데, 각도 정렬은 비교마다 방향 판정이 하나씩 붙는다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 사슬 하나만 쌓으면 나오는 답. */
  "build-one-chain": () => {
    const one = singleChain(WALK);
    const hull = convexHull(WALK);
    const missing = hull.filter(
      (p) => !one.some((q) => q[0] === p[0] && q[1] === p[1]),
    );
    if (missing.length === 0) {
      throw new Error(
        "사슬 하나로도 답이 나왔다 — 「절반만 나온다」가 거짓이다",
      );
    }
    return [
      table(
        ["무엇", "결과"],
        [
          ["왼쪽에서 오른쪽으로 사슬 하나", list(one)],
          ["실제 꼭짓점", list(hull)],
          ["사슬 하나가 놓치는 점", list(missing)],
        ],
        ["l", "l"],
      ),
      "",
      "└ 놓친 점은 전부 위쪽 경계에 있다. 왼쪽에서 오른쪽으로 한 번 지나가면 아래쪽만 남는다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 걸음마다 사슬이 어떻게 이어지는가. */
  "build-state": () => {
    const uniq = distinct(WALK);
    const rows: string[][] = [];
    const built: Point[] = [];
    for (const p of uniq) {
      const dropped: Point[] = [];
      let tests = 0;
      while (built.length >= 2) {
        tests++;
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        if (sideOf(o, a, p) > 0) break;
        dropped.push(built.pop() as Point);
      }
      built.push(p);
      rows.push([
        pt(p),
        String(tests),
        dropped.length === 0 ? "없음" : list(dropped),
        list(built),
      ]);
    }
    return [
      table(["담으려는 점", "판정 횟수", "걷어낸 점", "담은 뒤의 사슬"], rows, [
        "l",
        "r",
        "l",
        "l",
      ]),
      "",
      "└ 걷어내기가 두 번 난 걸음(다섯째·여섯째 줄)에서도 사슬은 이어진다. 걷어낸 점이 다시 담기는 일은 없다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 규모를 바꿔 가며 방향 판정 총수를 센다. */
  "build-linear": () => {
    const rows = [100, 1_000, 10_000, LIMIT].map((total) => {
      const points = scatter(total);
      const c = counted(points);
      assertSame(points, c.hull);
      const bound = testBound(c.distinct, c.hull.length);
      return [
        num(total),
        num(c.distinct),
        num(c.hull.length),
        num(c.tests),
        num(bound),
        (c.tests / bound).toFixed(3),
      ];
    });
    return [
      table(
        [
          "점 개수",
          "서로 다른 점 m",
          "꼭짓점 h",
          "방향 판정",
          "4m − h − 6",
          "비율",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 점을 열 배 하면 방향 판정도 열 배가 된다. 규모가 커질수록 상한에 가까워진다",
    ].join("\n");
  },

  /** `deep.walk` — 전개 입력을 격자에 그린다. */
  "walk-grid": () => {
    const uniq = distinct(WALK);
    const hull = convexHull(WALK);
    const inHull = new Set(hull.map(pt));
    const maxX = Math.max(...uniq.map((p) => p[0]));
    const maxY = Math.max(...uniq.map((p) => p[1]));
    const lines: string[] = [];
    for (let y = maxY; y >= 0; y--) {
      let row = `${padLeft(String(y), 2)} |`;
      for (let x = 0; x <= maxX; x++) {
        const here = uniq.find((p) => p[0] === x && p[1] === y);
        row +=
          here === undefined ? "  ." : inHull.has(pt(here)) ? "  O" : "  x";
      }
      lines.push(row.replace(/\s+$/, ""));
    }
    lines.push(`   +${"---".repeat(maxX + 1)}`);
    let axis = "    ";
    for (let x = 0; x <= maxX; x++) axis += padLeft(String(x), 3);
    lines.push(axis);
    return [
      lines.join("\n"),
      "",
      `O 는 답에 담기는 꼭짓점 ${hull.length} 개, x 는 빠지는 점 ${uniq.length - hull.length} 개다`,
      `답  ${list(hull)}`,
    ].join("\n");
  },

  /** `deep.walk` — 열여섯 걸음의 상태값. */
  "walk-trace": () => {
    const uniq = distinct(WALK);
    const rows: string[][] = [];
    let step = 1;
    rows.push([`T${step++}`, "정렬·중복 제거", "—", "0", "—", list(uniq)]);
    const runChain = (seq: Point[], label: string): Point[] => {
      const built: Point[] = [];
      for (const p of seq) {
        const dropped: Point[] = [];
        let tests = 0;
        while (built.length >= 2) {
          tests++;
          const o = built.at(-2) as Point;
          const a = built.at(-1) as Point;
          if (sideOf(o, a, p) > 0) break;
          dropped.push(built.pop() as Point);
        }
        built.push(p);
        rows.push([
          `T${step++}`,
          label,
          pt(p),
          String(tests),
          dropped.length === 0 ? "—" : list(dropped),
          list(built),
        ]);
      }
      return built;
    };
    const lower = runChain(uniq, "아래 사슬");
    const upper = runChain([...uniq].reverse(), "위 사슬");
    const lo = [...lower];
    const up = [...upper];
    lo.pop();
    up.pop();
    const hull = assertSame(WALK, lo.concat(up));
    rows.push([`T${step++}`, "끝점을 떼고 잇는다", "—", "0", "—", list(hull)]);
    const c = counted(WALK);
    return [
      table(
        [
          "걸음",
          "하는 일",
          "담으려는 점",
          "판정 횟수",
          "걷어낸 점",
          "그 뒤의 사슬",
        ],
        rows,
        ["l", "l", "l", "r", "l", "l"],
      ),
      "",
      `방향 판정 ${c.tests} 번 · 걷어낸 점 ${c.pops} 개 · 판정이 유지로 끝난 자리 ${c.fails} 곳`,
      `그중 판정값이 0 인 자리 ${zeroTurns(WALK)} 곳 · 배정밀도 값이 SAFE 이하라 큰 정수로 되잰 판정 ${exactPathCount(WALK)} 번`,
      `답  ${list(hull)}`,
    ].join("\n");
  },

  /** 첫 번째 멈춤 — `x` 만으로 정렬하면. */
  "pause-x-only": () =>
    [
      contrast(
        [
          ["전개 입력", WALK],
          ["세로로 늘어선 넷", VERTICAL],
        ],
        (points) => sortByXOnly.convexHull(points),
        "x 만 정렬한 답",
      ),
      "",
      `전개 입력을 x 만으로 정렬하면  ${list([...WALK].sort((p, q) => p[0] - q[0]))}`,
      `x 와 y 를 함께 쓰면            ${list([...WALK].sort((p, q) => p[0] - q[0] || p[1] - q[1]))}`,
      "└ 같은 좌표 (6,0) 둘이 떨어져 있어 중복 제거도 함께 실패한다",
    ].join("\n"),

  /** 두 번째 멈춤 — 두 사슬의 끝점을 안 떼면. */
  "pause-join": () =>
    contrast(
      [
        ["전개 입력", WALK],
        ["변 위에 점이 있는 사각형", ON_EDGE],
      ],
      (points) => keepBothEnds.convexHull(points),
      "아래 사슬의 끝점을 안 뗀 답",
    ),

  /** 세 번째 멈춤 — 배정밀도 곱만으로 부호를 정하면. */
  "pause-float": () => {
    const CORNERS: Point[] = [
      [-COORD, -COORD],
      [COORD, -COORD],
      [COORD, COORD],
      [-COORD, COORD],
      [0, 0],
    ];
    const bare = convexHull(CORNERS);
    const loose = floatOnly.convexHull(CORNERS);
    if (list(bare) !== list(loose)) {
      throw new Error("네 모서리에서 배정밀도 전용 사본이 다른 답을 냈다");
    }
    const corners = bare.length;
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
        (points) => floatOnly.convexHull(points),
        "배정밀도 곱만 쓴 답",
      ),
      "",
      `기존 시험의 네 모서리(좌표 ±${num(COORD)})에서는 둘 다 꼭짓점 ${corners} 개로 같다`,
      "",
      `세 점 ${pt(o)} → ${pt(a)} → ${pt(b)} 의 방향을 두 방식으로`,
      "",
      table(
        ["무엇", "큰 정수로", "배정밀도로"],
        [
          [
            "앞의 곱",
            (BigInt(ux) * BigInt(vy)).toLocaleString("en-US"),
            num(ux * vy),
          ],
          [
            "뒤의 곱",
            (BigInt(uy) * BigInt(vx)).toLocaleString("en-US"),
            num(uy * vx),
          ],
          ["둘의 차", exact.toString(), num(approx)],
        ],
        ["l", "r", "r"],
      ),
      "",
      `배정밀도가 정수를 통째로 담는 한계는 ${num(Number.MAX_SAFE_INTEGER)} 이고 위의 곱은 그보다 크다`,
      "└ 배정밀도는 한 직선 위라고 답하고, 큰 정수는 왼쪽으로 꺾인다고 답한다",
    ].join("\n");
  },

  /** `related` — 담김과 걷어냄의 총수. */
  "related-stack": () => {
    const rows = [
      ["전개 입력", WALK],
      ["흩어진 점 1,000 개", scatter(1_000)],
      ["흩어진 점 100,000 개", scatter(LIMIT)],
    ].map(([label, points]) => {
      const pts = points as Point[];
      const c = counted(pts);
      assertSame(pts, c.hull);
      // 두 사슬이 서로 다른 점을 담으므로 담긴 총수는 서로 다른 점의 두 배다.
      const pushes = 2 * c.distinct;
      return [
        label as string,
        num(pushes),
        num(c.pops),
        num(pushes - c.pops),
        num(c.lower.length + c.upper.length),
      ];
    });
    return [
      table(
        [
          "입력",
          "담은 횟수",
          "걷어낸 횟수",
          "담은 − 걷어낸",
          "두 사슬에 남은 점",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 점 하나가 담기는 것은 사슬마다 한 번뿐이고, 걷어내는 것은 그보다 많을 수 없다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 확인한다. */
  "math-check": () => {
    const cases: [Point, Point, Point][] = [
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
      [
        [0, 0],
        [3, 0],
        [6, 0],
      ],
    ];
    const rows = cases.map(([o, a, b]) => {
      const value =
        (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const s = sideOf(o, a, b);
      const meaning =
        s > 0
          ? "왼쪽으로 꺾인다"
          : s < 0
            ? "오른쪽으로 꺾인다"
            : "한 직선 위다";
      return [
        `${pt(o)} → ${pt(a)} → ${pt(b)}`,
        String(value),
        String(s),
        meaning,
      ];
    });
    return [
      table(["세 점", "식이 낸 값", "부호", "뜻"], rows, ["l", "r", "r", "l"]),
      "",
      "└ 값의 절댓값은 세 점이 만드는 삼각형 넓이의 두 배이고, 이 절차가 쓰는 것은 부호뿐이다",
    ].join("\n");
  },

  /** `deep.math` ③④ — 방향 판정 상한을 규모별로 대조한다. */
  "math-bound": () => {
    const rows = [
      ["전개 입력", WALK],
      ["변 위에 점이 있는 사각형", ON_EDGE],
      ["한 직선 위의 넷", COLLINEAR],
      ["흩어진 점 1,000 개", scatter(1_000)],
      ["흩어진 점 100,000 개", scatter(LIMIT)],
    ].map(([label, points]) => {
      const pts = points as Point[];
      const c = counted(pts);
      assertSame(pts, c.hull);
      const bound = testBound(c.distinct, c.hull.length);
      return [
        label as string,
        num(c.distinct),
        num(c.hull.length),
        num(c.pops),
        num(c.fails),
        num(c.tests),
        num(bound),
      ];
    });
    return [
      table(
        [
          "입력",
          "m",
          "h",
          "걷어냄",
          "유지",
          "판정 = 걷어냄 + 유지",
          "4m − h − 6",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `제약의 최댓값에서 꼭짓점이 셋뿐이면 상한이 ${num(testBound(LIMIT, 3))} 이고, 정의를 그대로 옮기면 가지치기 없이 ${num(LIMIT * (LIMIT - 1) * (LIMIT - 2))} 이다`,
      "└ 한 직선 위인 입력은 유지로 끝나는 자리가 없어 상한의 절반에 그친다",
    ].join("\n");
  },

  /** `deep.math` — 배정밀도 오차의 한계와 실측 최대 편차. */
  "math-error": () => {
    const rnd = makeRnd(20_260_904);
    const spread = (): number => (rnd() % (2 * COORD + 1)) - COORD;
    let worst = 0n;
    for (let round = 0; round < 300_000; round++) {
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
    return [
      table(["좌표 상한 C", "오차 한계 C² / 2^49", "큰 정수 되재기가"], rows, [
        "r",
        "r",
        "l",
      ]),
      "",
      `한계가 1 보다 작은 가장 큰 좌표 상한  ${num(lo)}  (${bound(lo).toFixed(9)})`,
      `그 다음 값                            ${num(lo + 1)}  (${bound(lo + 1).toFixed(9)})`,
      `무작위 네 성분 300,000 벌의 실제 최대 편차  ${worst}`,
      `이 절차가 쓰는 하한 SAFE                    2,048`,
      "└ 한계는 넉넉하게 잡은 값이고, 그보다 큰 2 의 거듭제곱을 하한으로 둔다",
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 사슬이 왼쪽 꺾임만 갖는가. */
  "invariant-states": () => {
    const uniq = distinct(WALK);
    const rows: string[][] = [];
    const built: Point[] = [];
    for (const p of uniq) {
      while (built.length >= 2) {
        const o = built.at(-2) as Point;
        const a = built.at(-1) as Point;
        if (sideOf(o, a, p) > 0) break;
        built.pop();
      }
      built.push(p);
      const turns: string[] = [];
      for (let at = 2; at < built.length; at++) {
        const o = built[at - 2] as Point;
        const a = built[at - 1] as Point;
        const b = built[at] as Point;
        turns.push(String(sideOf(o, a, b)));
      }
      rows.push([
        pt(p),
        list(built),
        turns.length === 0 ? "잴 자리가 없다" : turns.join(" "),
        turns.every((t) => t === "1") ? "참" : "거짓",
      ]);
    }
    if (rows.some((r) => r[3] !== "참")) {
      throw new Error("사슬 안에 왼쪽 꺾임이 아닌 자리가 있다");
    }
    return [
      table(["담은 점", "그 뒤의 사슬", "이웃 셋의 판정값", "불변식"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      "└ 일곱 걸음 모두 참이다. 판정값이 1 이 아닌 자리는 담기 전에 걷어냈다",
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
      [
        "좌표 상한의 네 모서리",
        [
          [-COORD, -COORD],
          [COORD, -COORD],
          [COORD, COORD],
          [-COORD, COORD],
          [0, 0],
        ],
      ],
    ];
    const rows = cases.map(([label, points]) => {
      const c = counted(points);
      assertSame(points, c.hull);
      return [label, String(points.length), String(c.distinct), list(c.hull)];
    });
    return [
      table(["입력", "점", "서로 다른 점", "답"], rows, ["l", "r", "r", "l"]),
      "",
      "└ 서로 다른 점이 둘 이하면 사슬을 쌓지 않고 그대로 돌려준다",
    ].join("\n");
  },

  /** `invariant` ③ — 한 직선 위인 점을 걷어내지 않으면. */
  "mutant-keep-collinear": () =>
    contrast(
      [
        ["전개 입력", WALK],
        ["변 위에 점이 있는 사각형", ON_EDGE],
        ["한 직선 위의 넷", COLLINEAR],
      ],
      (points) => keepCollinear.convexHull(points),
      "판정값이 0 인 점을 남긴 답",
    ),

  /** `perf.derive` — 전개 입력의 계수 분해. */
  "perf-count": () => {
    const uniq = distinct(WALK);
    const c = counted(WALK);
    const sortCost = sortByCoordinate(WALK);
    /** 한 사슬만 쌓았을 때의 방향 판정 횟수. */
    const chainTests = (seq: Point[]): number => {
      let tests = 0;
      const built: Point[] = [];
      for (const p of seq) {
        while (built.length >= 2) {
          tests++;
          const o = built.at(-2) as Point;
          const a = built.at(-1) as Point;
          if (sideOf(o, a, p) > 0) break;
          built.pop();
        }
        built.push(p);
      }
      return tests;
    };
    const lowerTests = chainTests(uniq);
    const upperTests = chainTests([...uniq].reverse());
    const rows = [
      ["좌표로 정렬한다", "T1", num(sortCost.compares)],
      ["앞 점과 견주어 중복을 지운다", "T1", num(WALK.length)],
      ["아래 사슬의 방향 판정", "T2~T8", num(lowerTests)],
      ["위 사슬의 방향 판정", "T9~T15", num(upperTests)],
      ["끝점을 떼고 잇는다", "T16", "0"],
      ["합계", "", num(sortCost.compares + WALK.length + c.tests)],
    ];
    return [
      table(["무엇", "어느 걸음인가", "기본 연산"], rows, ["l", "l", "r"]),
      "",
      `점 ${WALK.length} 개 · 서로 다른 점 ${uniq.length} 개 · 꼭짓점 ${c.hull.length} 개`,
      `총식 n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1 + n + (4m − h − 6) 의 각 항이 ${
        WALK.length * Math.ceil(Math.log2(WALK.length)) -
        2 ** Math.ceil(Math.log2(WALK.length)) +
        1
      } · ${WALK.length} · ${testBound(uniq.length, c.hull.length)} 이다`,
      "└ 정렬 비교는 최악값이라 실측보다 크고, 방향 판정은 상한과 실측이 갈린다",
    ].join("\n");
  },

  /** `perf.worst` — 어떤 모양이 방향 판정을 가장 많이 쓰는가. */
  "worst-shape": () => {
    const total = LIMIT;
    const shapes: [string, Point[]][] = [
      ["흩어진 점", scatter(total)],
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
    const rows = shapes.map(([label, points]) => {
      const c = counted(points);
      assertSame(points, c.hull);
      const bound = testBound(c.distinct, c.hull.length);
      // 잡는 칸 — 정렬 사본 n · 중복을 지운 목록 m · 뒤집은 사본 m · 사슬 둘 h.
      const cells = points.length + 2 * c.distinct + c.hull.length;
      return [
        label,
        num(c.distinct),
        num(c.hull.length),
        num(c.tests),
        num(bound),
        (c.tests / bound).toFixed(3),
        num(cells),
      ];
    });
    return [
      table(
        [
          "모양",
          "서로 다른 점 m",
          "꼭짓점 h",
          "방향 판정",
          "4m − h − 6",
          "비율",
          "잡는 칸",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 방향 판정은 h 가 작을수록 늘고 잡는 칸은 h 가 클수록 는다. 두 축의 최악이 서로 다른 입력이다",
    ].join("\n");
  },
};
