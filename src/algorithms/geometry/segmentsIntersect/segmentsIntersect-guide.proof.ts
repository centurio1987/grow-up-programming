/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts segmentsIntersect-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  type Point,
  type Segment,
  segmentsIntersect,
  sideOf,
} from "./segmentsIntersect-guide.ref.ts";

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
 * 큰 정수의 천 단위 구분. **`Number` 로 바꿔 적지 않는다** — 이 편이 다루는 곱은 배정밀도가
 * 정수로 못 담는 크기라, 변환하는 순간 표가 「두 곱이 같다」로 보이게 된다.
 */
const bignum = (n: bigint): string =>
  (n < 0n ? "-" : "") +
  (n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 점 하나의 표기. 본문과 글자 그대로 같다. */
const pt = (p: Point): string => `(${p[0]},${p[1]})`;

/** 선분 하나의 표기. */
const seg = (s: Segment): string => `${pt(s[0])}-${pt(s[1])}`;

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
 * 본문 전개가 쓰는 고정 입력 — 선분 넷 가운데 `s1` 을 상대로 한 세 쌍.
 *
 * 세 쌍 안에 이 절차의 갈래가 전부 들어 있다 — `s1·s2` 는 서로를 가로지르고, `s1·s3` 은
 * 한쪽 부호만 갈린 채 한 점도 공유하지 않으며, `s1·s4` 는 같은 직선 위에서 구간을 공유한다.
 * `s2·s4` 는 「불변식」 절이 쓰는 네 번째 쌍이다.
 */
const S1: Segment = [
  [0, 0],
  [6, 4],
];
const S2: Segment = [
  [0, 4],
  [6, 0],
];
const S3: Segment = [
  [2, 0],
  [2, 1],
];
const S4: Segment = [
  [3, 2],
  [9, 6],
];

const WALK: [string, Segment, Segment][] = [
  ["s1·s2", S1, S2],
  ["s1·s3", S1, S3],
  ["s1·s4", S1, S4],
];

/** 제약의 좌표 절댓값 상한과 배정밀도의 정수 한계. */
const COORD = 1_000_000_000;
const SAFE = 2048;

/** 좌표가 상한에 붙었을 때 배정밀도 곱이 부호를 놓치는 배치. */
const FAR_O: Point = [0, 0];
const FAR_A: Point = [999_999_000, 999_999_041];
const FAR_C: Point = [48_780_439, 48_780_441];

/** 배정밀도로도 부호가 확실한, 좌표가 큰 X 자 배치. */
const BIG_X1: Segment = [
  [-COORD, -COORD],
  [COORD, COORD],
];
const BIG_X2: Segment = [
  [-COORD, COORD],
  [COORD, -COORD],
];

/** 좌표가 상한에 붙은 채 같은 직선 위에서 떨어져 있는 배치. */
const BIG_APART1: Segment = [
  [0, 0],
  [200_000_000, 400_000_000],
];
const BIG_APART2: Segment = [
  [400_000_000, 800_000_000],
  [500_000_000, COORD],
];

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
  // 원시 값의 부호가 정본의 판정값과 어긋나면 이 파일의 산술이 정본과 다른 것이다.
  const want = value > 0n ? 1 : value < 0n ? -1 : 0;
  if (sideOf(o, a, b) !== want) {
    throw new Error(`원시 값의 부호가 정본과 어긋난다 — ${pt(o)} ${pt(a)}`);
  }
  return value;
}

interface Judged {
  d: [number, number, number, number];
  /** 배정밀도 값이 오차 한계를 넘어 그 자리에서 끝난 판정의 수. */
  fast: number;
  /** 큰 정수로 되잰 판정의 수. */
  slow: number;
  /** 되잰 곱 가운데 가장 큰 것의 비트 수. 되잰 적이 없으면 0. */
  bits: number;
  /** `④` 의 칸 검사가 실제로 불린 횟수. */
  boxes: number;
  /** `③`·`④`·`⑤` 가운데 답을 낸 갈래. */
  branch: "③" | "④" | "⑤";
  answer: boolean;
}

/** 정본과 같은 절차를 걸음마다 세면서 실행한다. 답은 매번 정본과 대조한다. */
function judge(s1: Segment, s2: Segment): Judged {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const triples: [Point, Point, Point][] = [
    [p3, p4, p1],
    [p3, p4, p2],
    [p1, p2, p3],
    [p1, p2, p4],
  ];
  const d = triples.map(([o, a, b]) => sideOf(o, a, b)) as Judged["d"];

  let fast = 0;
  let slow = 0;
  let bits = 0;
  for (const [o, a, b] of triples) {
    const approx = approxOf(o, a, b);
    if (approx > SAFE || approx < -SAFE) {
      fast++;
      continue;
    }
    slow++;
    const ux = BigInt(a[0] - o[0]);
    const uy = BigInt(a[1] - o[1]);
    const vx = BigInt(b[0] - o[0]);
    const vy = BigInt(b[1] - o[1]);
    for (const product of [ux * vy, uy * vx]) {
      const size = (product < 0n ? -product : product).toString(2).length;
      if (size > bits) bits = size;
    }
  }

  const straddles = (da: number, db: number): boolean =>
    da !== 0 && db !== 0 && da !== db;
  const inBox = (a: Point, b: Point, p: Point): boolean =>
    Math.min(a[0], b[0]) <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= p[1] &&
    p[1] <= Math.max(a[1], b[1]);

  let branch: Judged["branch"];
  let answer: boolean;
  let boxes = 0;
  if (straddles(d[0], d[1]) && straddles(d[2], d[3])) {
    branch = "③";
    answer = true;
  } else {
    answer = false;
    for (const [at, [a, b, p]] of triples.entries()) {
      if (d[at] !== 0) continue;
      boxes++;
      if (inBox(a, b, p)) {
        answer = true;
        break;
      }
    }
    branch = answer ? "④" : "⑤";
  }
  if (answer !== segmentsIntersect(s1, s2)) {
    throw new Error(`계수용 절차가 정본과 다른 답을 냈다 — ${seg(s1)}`);
  }
  return { d, fast, slow, bits, boxes, branch, answer };
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
const PAIRS = 20_000;

/** 좌표 상한 `bound` 안에서 흩어진 선분 쌍. `.alt.ts` 의 생성식과 같다. */
function scattered(total: number, bound: number): [Segment, Segment][] {
  const rnd = makeRnd(SEED);
  const pick = (): Point => [rnd() % (bound + 1), rnd() % (bound + 1)];
  const out: [Segment, Segment][] = [];
  for (let at = 0; at < total; at++) {
    out.push([
      [pick(), pick()],
      [pick(), pick()],
    ]);
  }
  return out;
}

/**
 * `y = 2x` 위에 놓인 선분 쌍. 네 판정값이 전부 0 이 된다.
 *
 * `pair` 가 네 좌표를 어떻게 두 구간으로 묶을지 정한다 — 섞어 묶으면 구간이 겹치고,
 * 앞뒤로 갈라 묶으면 떨어진다. 둘 다 판정값은 전부 0 이라 갈래는 같고 답만 갈린다.
 */
function onLine(
  total: number,
  bound: number,
  pair: (k: number) => [number, number, number, number],
): [Segment, Segment][] {
  const rnd = makeRnd(SEED);
  const half = Math.floor(bound / 2);
  const out: [Segment, Segment][] = [];
  for (let at = 0; at < total; at++) {
    const xs = [rnd() % half, rnd() % half, rnd() % half, rnd() % half].sort(
      (p, q) => p - q,
    );
    const on = (k: number): Point => [xs[k] as number, 2 * (xs[k] as number)];
    const [a, b, c, d] = pair(at);
    out.push([
      [on(a), on(b)],
      [on(c), on(d)],
    ]);
  }
  return out;
}

/** 같은 직선 위에서 **구간을 공유하는** 선분 쌍. `.alt.ts` 의 생성식과 같다. */
const collinearOverlap = (total: number, bound: number): [Segment, Segment][] =>
  onLine(total, bound, () => [0, 2, 1, 3]);

/** 같은 직선 위에서 **떨어져 있는** 선분 쌍. 앞 두 좌표와 뒤 두 좌표로 갈라 묶는다. */
const collinearApart = (total: number, bound: number): [Segment, Segment][] =>
  onLine(total, bound, () => [0, 1, 2, 3]);

/* ────────────────────────── 가장 단순한 방법 ────────────────────────── */

/**
 * 교점의 매개변수를 부동소수로 푸는 방법. `deep.build` 직무 ② 가 세우는 것이다.
 *
 * 두 직선을 `p1 + t(p2−p1)` · `p3 + u(p4−p3)` 로 놓고 연립해 `t`·`u` 를 구한 다음 둘 다
 * `[0,1]` 안인지 본다. 분모가 0 이면 두 직선이 평행하다고 보고 거짓을 돌려준다.
 */
interface Arith {
  /** 배정밀도 곱셈. */
  mul: number;
  /** 큰 정수 곱셈. */
  bigMul: number;
  /** 나눗셈. */
  div: number;
}

function byParameter(s1: Segment, s2: Segment, c?: Arith): boolean {
  const [p1, p2] = s1;
  const [p3, p4] = s2;
  const rx = p2[0] - p1[0];
  const ry = p2[1] - p1[1];
  const sx = p4[0] - p3[0];
  const sy = p4[1] - p3[1];
  if (c) c.mul += 2;
  const den = rx * sy - ry * sx;
  if (den === 0) return false;
  const qx = p3[0] - p1[0];
  const qy = p3[1] - p1[1];
  if (c) {
    c.mul += 4;
    c.div += 2;
  }
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * ry - qy * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { segmentsIntersect: (s1: Segment, s2: Segment) => boolean };

const REF = new URL("./segmentsIntersect-guide.ref.ts", import.meta.url)
  .pathname;

const FILTER_LINE =
  /if \(approx > SAFE \|\| approx < -SAFE\) return approx > 0 \? 1 : -1;/;
const BOTH_LINE =
  /if \(straddles\(d1, d2\) && straddles\(d3, d4\)\) return true;/;
const BOX_LINE = /return d === 0 && inBox\(a, b, p\);/;
const P3_LINE = /^ {4}onSegment\(p1, p2, p3, d3\) \|\|$/;

/** 판정을 배정밀도 곱 하나로만 끝내는 사본. */
const floatOnly = await loadMutant<Impl>(REF, {
  swap: [FILTER_LINE, "if (true) return approx > 0 ? 1 : approx < 0 ? -1 : 0;"],
});

/** 한 선분의 두 끝점만 재고 답하는 사본. */
const oneSideOnly = await loadMutant<Impl>(REF, {
  swap: [BOTH_LINE, "if (straddles(d1, d2)) return true;"],
});

/** 판정값이 0 이면 칸을 보지 않고 참으로 답하는 사본. */
const noBox = await loadMutant<Impl>(REF, {
  swap: [BOX_LINE, "return d === 0;"],
});

/** `p3` 자리의 끝점 검사를 뺀 사본. 불변식의 「남김없이」를 지키던 줄이다. */
const dropP3 = await loadMutant<Impl>(REF, { drop: P3_LINE });

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
  cases: [string, Segment, Segment][],
  other: (s1: Segment, s2: Segment) => boolean,
  otherHead: string,
): string {
  const gaps: number[] = [];
  const rows = cases.map(([label, s1, s2]) => {
    const want = segmentsIntersect(s1, s2);
    const got = other(s1, s2);
    gaps.push(want === got ? 0 : 1);
    return [
      label,
      seg(s1),
      seg(s2),
      String(want),
      String(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  assertBreaks(gaps);
  return table(
    ["입력", "첫 인자", "둘째 인자", "정본", otherHead, "대조"],
    rows,
    ["l", "l", "l", "l", "l", "l"],
  );
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 여섯 배치가 어느 갈래로 가고 답이 무엇인가. */
  "concept-cases": () => {
    const cases: [string, Segment, Segment][] = [
      ["서로를 가로지른다", S1, S2],
      [
        "끝점끼리 만난다",
        [
          [0, 0],
          [1, 0],
        ],
        [
          [1, 0],
          [1, 1],
        ],
      ],
      [
        "끝점이 상대 선분 안에 있다",
        [
          [0, 0],
          [4, 0],
        ],
        [
          [2, 0],
          [2, 3],
        ],
      ],
      ["같은 직선 위에서 구간을 공유한다", S1, S4],
      [
        "같은 직선 위인데 떨어져 있다",
        [
          [0, 0],
          [1, 0],
        ],
        [
          [2, 0],
          [3, 0],
        ],
      ],
      ["한쪽이 짧다 · 전개 입력 s1·s3", S1, S3],
    ];
    const rows = cases.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      return [
        label,
        seg(s1),
        seg(s2),
        r.d.join(" "),
        r.branch,
        String(r.answer),
      ];
    });
    return [
      table(["배치", "첫 인자", "둘째 인자", "판정값 넷", "갈래", "답"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      "└ 여섯 배치가 세 갈래로 나뉜다. 넷째와 다섯째 줄은 판정값이 같아 좌표 칸이 둘을 가른다",
      "└ 교점 좌표는 어느 줄에서도 쓰지 않는다",
    ].join("\n");
  },

  /** `concept` — 좌표를 키우면 곱이 배정밀도의 정수 한계를 넘는다. */
  "concept-exact": () => {
    const rows = [1_000, 1_000_000, 23_726_566, COORD].map((c) => {
      const product = 4 * c * c;
      return [
        num(c),
        num(2 * c),
        product.toExponential(2),
        product <= Number.MAX_SAFE_INTEGER ? "담긴다" : "안 담긴다",
      ];
    });
    return [
      table(
        ["좌표 상한", "좌표의 차", "곱의 최댓값", "배정밀도가 정수로"],
        rows,
        ["r", "r", "r", "l"],
      ),
      "",
      `배정밀도가 정수를 통째로 담는 한계는 ${num(Number.MAX_SAFE_INTEGER)} 이다`,
      "└ 이 문제의 좌표 상한에서는 곱 하나가 그 한계의 400 배가 넘는다",
    ].join("\n");
  },

  /** `deep.build` ② — 교점을 부동소수로 구하는 방법이 틀리는 입력. */
  "build-naive": () => {
    const families: [string, [Segment, Segment][]][] = [
      ["작은 격자 0~6", scattered(PAIRS, 6)],
      ["좌표 상한 10^9", scattered(PAIRS, COORD)],
      ["같은 직선 위에서 구간 공유", collinearOverlap(PAIRS, COORD)],
    ];
    let sample: [Segment, Segment] | null = null;
    const rows = families.map(([label, cases]) => {
      let wrong = 0;
      let parallel = 0;
      for (const [s1, s2] of cases) {
        if (byParameter(s1, s2) === segmentsIntersect(s1, s2)) continue;
        wrong++;
        const rx = s1[1][0] - s1[0][0];
        const ry = s1[1][1] - s1[0][1];
        const sx = s2[1][0] - s2[0][0];
        const sy = s2[1][1] - s2[0][1];
        if (rx * sy - ry * sx === 0) parallel++;
        if (sample === null && label === "작은 격자 0~6") sample = [s1, s2];
      }
      return [
        label,
        num(cases.length),
        num(wrong),
        num(parallel),
        `${((100 * wrong) / cases.length).toFixed(2)}%`,
      ];
    });
    if (sample === null) throw new Error("반례를 하나도 못 찾았다");
    const [bad1, bad2] = sample as [Segment, Segment];
    return [
      table(
        ["입력 가족", "선분 쌍", "틀린 답", "그중 분모가 0", "틀린 비율"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `첫 반례  첫 인자 ${seg(bad1)}  둘째 인자 ${seg(bad2)}`,
      `정본 ${segmentsIntersect(bad1, bad2)} · 교점을 구하는 방법 ${byParameter(bad1, bad2)}`,
      "└ 틀린 답이 전부 분모가 0 인 갈래에서 나온다. 좌표만 키운 무작위 입력에서는 한 건도 안 틀린다",
    ].join("\n");
  },

  /** `deep.build` ③ — 교점을 안 구해도 판정값 넷이 답을 정한다. */
  "build-sides": () => {
    const r = judge(S1, S2);
    const raw = [
      ["d1", S2[0], S2[1], S1[0]],
      ["d2", S2[0], S2[1], S1[1]],
      ["d3", S1[0], S1[1], S2[0]],
      ["d4", S1[0], S1[1], S2[1]],
    ] as [string, Point, Point, Point][];
    const rows = raw.map(([name, o, a, b], at) => [
      name,
      `${pt(o)} → ${pt(a)} → ${pt(b)}`,
      exactOf(o, a, b).toString(),
      String(r.d[at]),
      r.d[at] === 1 ? "왼쪽" : r.d[at] === -1 ? "오른쪽" : "직선 위",
    ]);
    return [
      table(["이름", "세 점", "원시 값", "판정값", "어느 쪽인가"], rows, [
        "l",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `첫 인자 ${seg(S1)}  둘째 인자 ${seg(S2)}  답 ${r.answer}`,
      "└ d1 과 d2 가 갈리고 d3 과 d4 도 갈린다. 교점 (3,2) 의 좌표는 어디에도 안 쓰였다",
    ].join("\n");
  },

  /** `deep.build` ④ — 두 방식을 같은 입력에서 나란히 잰다. */
  "build-compare": () => {
    const cases = scattered(PAIRS, 6);
    const mine: Arith = { mul: 0, bigMul: 0, div: 0 };
    const theirs: Arith = { mul: 0, bigMul: 0, div: 0 };
    let wrong = 0;
    for (const [s1, s2] of cases) {
      if (byParameter(s1, s2, theirs) !== segmentsIntersect(s1, s2)) wrong++;
      // 판정 하나가 배정밀도 곱 둘로 시작하고, 되잰 판정만 큰 정수 곱 둘을 더 쓴다.
      const r = judge(s1, s2);
      mine.mul += 8;
      mine.bigMul += r.slow * 2;
    }
    const rows = [
      [
        "교점을 구한다",
        num(theirs.mul),
        num(theirs.bigMul),
        num(theirs.div),
        "부동소수",
        num(wrong),
      ],
      [
        "어느 쪽인지만 잰다",
        num(mine.mul),
        num(mine.bigMul),
        num(mine.div),
        "정수",
        "0",
      ],
    ];
    return [
      table(
        ["방식", "배정밀도 곱", "큰 정수 곱", "나눗셈", "값의 종류", "틀린 답"],
        rows,
        ["l", "r", "r", "r", "l", "r"],
      ),
      "",
      `같은 선분 쌍 ${num(cases.length)} 벌 · 좌표 0~6 · 두 방식이 같은 쌍을 본다`,
      "└ 나눗셈이 0 번이 되는 대신 곱셈이 늘고, 만들어지는 값이 전부 정수로 남는다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 한 선분만 재면 무엇이 틀리는가. */
  "build-oneside": () => {
    const cases: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      ["전개 입력 s1·s3", S1, S3],
      [
        "한쪽이 짧다 · 문제 예시",
        [
          [0, 0],
          [10, 10],
        ],
        [
          [5, 0],
          [5, 4],
        ],
      ],
    ];
    const body = contrast(
      cases,
      oneSideOnly.segmentsIntersect,
      "s1 쪽만 잰 답",
    );
    const family = scattered(PAIRS, 6);
    let wrong = 0;
    for (const [a, b] of family) {
      if (oneSideOnly.segmentsIntersect(a, b) !== segmentsIntersect(a, b))
        wrong++;
    }
    return [
      body,
      "",
      `좌표 0~6 의 선분 쌍 ${num(family.length)} 벌 가운데 ${num(wrong)} 벌에서 답이 어긋난다`,
      "└ 한쪽 선분의 두 끝점이 갈렸다는 것은 두 직선이 만난다는 뜻까지다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 판정 넷이 갈래 셋을 어떻게 가르는가. */
  "build-coverage": () => {
    const families: [string, [Segment, Segment][]][] = [
      ["좌표 0~6", scattered(PAIRS, 6)],
      ["좌표 상한 10^9", scattered(PAIRS, COORD)],
      ["같은 직선 위에서 구간 공유", collinearOverlap(PAIRS, COORD)],
    ];
    const rows = families.map(([label, cases]) => {
      const tally = { "③": 0, "④": 0, "⑤": 0 };
      let trues = 0;
      for (const [s1, s2] of cases) {
        const r = judge(s1, s2);
        tally[r.branch]++;
        if (r.answer) trues++;
      }
      return [
        label,
        num(cases.length),
        num(tally["③"]),
        num(tally["④"]),
        num(tally["⑤"]),
        num(trues),
      ];
    });
    return [
      table(
        [
          "입력 가족",
          "선분 쌍",
          "③ 가로지른다",
          "④ 끝점을 공유",
          "⑤ 안 만난다",
          "답이 true",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 세 갈래가 겹치지 않고 쌍마다 정확히 하나가 답을 낸다",
      "└ 흩어진 입력에서 ④ 는 좌표가 좁을수록 자주 나오고, 같은 직선 위의 입력은 전부 ④ 다",
    ].join("\n");
  },

  /** `deep.walk` — 선분 넷이 지나는 격자점을 그린다. */
  "walk-grid": () => {
    const named: [string, Segment][] = [
      ["1", S1],
      ["2", S2],
      ["3", S3],
      ["4", S4],
    ];
    // 격자점 하나가 어느 선분 위에 있는지는 정본에게 묻는다 — 길이 0 인 선분을 넣으면
    // 「이 점이 그 선분 위인가」가 그대로 답으로 나온다.
    const cellAt = (x: number, y: number): string => {
      const point: Segment = [
        [x, y],
        [x, y],
      ];
      const hit = named
        .filter(([, s]) => segmentsIntersect(s, point))
        .map(([label]) => label)
        .join("");
      return hit === "" ? "." : hit;
    };
    const lines: string[] = [];
    for (let y = 6; y >= 0; y--) {
      const cells: string[] = [];
      for (let x = 0; x <= 9; x++) cells.push(padRight(cellAt(x, y), 3));
      lines.push(` ${y} | ${cells.join(" ").replace(/\s+$/, "")}`);
    }
    lines.push(`   +${"-".repeat(40)}`);
    lines.push(
      `     ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((x) => padRight(String(x), 4))
        .join("")
        .replace(/\s+$/, "")}`,
    );
    return [
      ...lines,
      "",
      `s1 ${seg(S1)}   s2 ${seg(S2)}   s3 ${seg(S3)}   s4 ${seg(S4)}`,
      "칸에 적힌 숫자는 그 격자점을 지나는 선분이다. 124 는 셋이 함께 지나는 자리다",
      `답  s1·s2 ${segmentsIntersect(S1, S2)} · s1·s3 ${segmentsIntersect(S1, S3)} · s1·s4 ${segmentsIntersect(S1, S4)}`,
    ].join("\n");
  },

  /** `deep.walk` — 여덟 걸음의 상태값. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let step = 0;
    for (const [label, s1, s2] of WALK) {
      const r = judge(s1, s2);
      const d = r.d.join(" ");
      rows.push([
        `T${++step}`,
        label,
        "네 방향 판정을 잰다",
        d,
        `되잰 판정 ${r.slow} · 빠른 경로 ${r.fast}`,
      ]);
      const straddle1 = r.d[0] !== 0 && r.d[1] !== 0 && r.d[0] !== r.d[1];
      const straddle2 = r.d[2] !== 0 && r.d[3] !== 0 && r.d[2] !== r.d[3];
      rows.push([
        `T${++step}`,
        label,
        "③ 양쪽이 다 갈리는가",
        d,
        `${straddle1 ? "참" : "거짓"} 그리고 ${straddle2 ? "참" : "거짓"} → ${
          r.branch === "③" ? `참이므로 답 ${r.answer}` : "거짓"
        }`,
      ]);
      if (r.branch === "③") continue;
      rows.push([
        `T${++step}`,
        label,
        "④ 판정값이 0 인 끝점을 칸으로 본다",
        d,
        `칸 검사 ${r.boxes} 번 → ${r.branch} 이므로 답 ${r.answer}`,
      ]);
    }
    return [
      table(["걸음", "쌍", "하는 일", "d1 d2 d3 d4", "그 걸음이 낸 것"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `방향 판정 ${WALK.length * 4} 번 · 답 ${WALK.map(([, a, b]) => segmentsIntersect(a, b)).join(" · ")}`,
    ].join("\n");
  },

  /** `deep.walk` — 다섯 갈래가 몇 번씩 실행됐는가. */
  "walk-branch": () => {
    const small = WALK.map(([, s1, s2]) => judge(s1, s2));
    const fast = small.reduce((n, r) => n + r.fast, 0);
    const slow = small.reduce((n, r) => n + r.slow, 0);
    const big = judge(BIG_X1, BIG_X2);
    const rows = [
      [
        "①",
        "배정밀도로 재고 그 자리에서 끝낸다",
        `${fast} 번`,
        `좌표 상한의 X 자에서는 ${big.fast} 번`,
      ],
      [
        "②",
        "큰 정수로 다시 잰다",
        `${slow} 번`,
        `같은 입력에서는 ${big.slow} 번`,
      ],
      [
        "③",
        "양쪽이 다 갈리면 참",
        `${small.filter((r) => r.branch === "③").length} 쌍`,
        "s1·s2 에서 참",
      ],
      [
        "④",
        "판정값이 0 인 끝점이 칸 안이면 참",
        `${small.filter((r) => r.branch === "④").length} 쌍`,
        `s1·s4 에서 칸 검사 ${small[2]?.boxes ?? 0} 번 만에 참`,
      ],
      [
        "⑤",
        "네 검사가 다 거짓이면 안 만난다",
        `${small.filter((r) => r.branch === "⑤").length} 쌍`,
        `s1·s3 에서 칸 검사 ${small[1]?.boxes ?? 0} 번`,
      ],
    ];
    return [
      table(["갈래", "하는 일", "전개 입력에서", "다른 입력에서"], rows, [
        "l",
        "l",
        "r",
        "l",
      ]),
      "",
      `전개 입력은 좌표가 ${Math.max(...[S1, S2, S3, S4].flat().flat())} 이하라 배정밀도 값의 절댓값이 최대 ${Math.max(
        ...WALK.flatMap(([, s1, s2]) => {
          const [p1, p2] = s1;
          const [p3, p4] = s2;
          return [
            Math.abs(approxOf(p3, p4, p1)),
            Math.abs(approxOf(p3, p4, p2)),
            Math.abs(approxOf(p1, p2, p3)),
            Math.abs(approxOf(p1, p2, p4)),
          ];
        }),
      )} 이고, 그것이 SAFE 인 ${num(SAFE)} 보다 작다`,
      `└ 그래서 ① 이 한 번도 안 끝나고 ② 가 ${slow} 번 다 실행된다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 배정밀도 곱 하나로만 끝내면. */
  "pause-float": () => {
    const point: Segment = [FAR_C, FAR_C];
    const far: Segment = [FAR_O, FAR_A];
    const cases: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      ["좌표 상한의 X 자", BIG_X1, BIG_X2],
      ["상한 근처의 점 하나", far, point],
    ];
    const exact = exactOf(FAR_O, FAR_A, FAR_C);
    const approx = approxOf(FAR_O, FAR_A, FAR_C);
    const front = BigInt(FAR_A[0]) * BigInt(FAR_C[1]);
    const back = BigInt(FAR_A[1]) * BigInt(FAR_C[0]);
    return [
      contrast(cases, floatOnly.segmentsIntersect, "배정밀도 곱만 쓴 답"),
      "",
      `세 점 ${pt(FAR_O)} → ${pt(FAR_A)} → ${pt(FAR_C)} 의 방향을 두 방식으로`,
      "",
      table(
        ["무엇", "큰 정수로", "배정밀도로"],
        [
          ["앞의 곱", bignum(front), num(FAR_A[0] * FAR_C[1])],
          ["뒤의 곱", bignum(back), num(FAR_A[1] * FAR_C[0])],
          ["둘의 차", bignum(exact), num(approx)],
        ],
        ["l", "r", "r"],
      ),
      "",
      `두 곱이 각각 ${num(Number.MAX_SAFE_INTEGER)} 을 넘어 같은 값으로 반올림됐다`,
      "└ 배정밀도는 판정값 0 을 내고 큰 정수는 1 을 낸다. 그 한 자리에서 답이 갈린다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 판정값을 곱해서 견주면. */
  "pause-product": () => {
    const raw = [
      exactOf(BIG_X2[0], BIG_X2[1], BIG_X1[0]),
      exactOf(BIG_X2[0], BIG_X2[1], BIG_X1[1]),
    ];
    const product =
      raw[0] === undefined || raw[1] === undefined ? 0n : raw[0] * raw[1];
    const r = judge(BIG_X1, BIG_X2);
    return [
      table(
        ["무엇", "값", "자릿수"],
        [
          [
            "원시 판정값 d1",
            bignum(raw[0] ?? 0n),
            String((raw[0] ?? 0n).toString().replace("-", "").length),
          ],
          [
            "원시 판정값 d2",
            bignum(raw[1] ?? 0n),
            String((raw[1] ?? 0n).toString().replace("-", "").length),
          ],
          [
            "둘의 곱",
            bignum(product),
            String(product.toString().replace("-", "").length),
          ],
        ],
        ["l", "r", "r"],
      ),
      "",
      `첫 인자 ${seg(BIG_X1)}  둘째 인자 ${seg(BIG_X2)}`,
      `이 절차가 쓰는 판정값은 부호뿐이라 d1 = ${r.d[0]} · d2 = ${r.d[1]} 이고 곱은 ${r.d[0] * r.d[1]} 이다`,
      `배정밀도가 정수로 담는 한계는 ${num(Number.MAX_SAFE_INTEGER)} 이라 위의 곱은 통째로 안 담긴다`,
      "└ 부호를 견주면 곱이 −1 · 0 · 1 뿐이고, 원시 값을 곱하면 자릿수가 두 배가 된다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 칸을 안 보고 답하면. */
  "pause-box": () => {
    const cases: [string, Segment, Segment][] = [
      ["같은 직선 위에서 구간을 공유", S1, S4],
      [
        "같은 직선 위인데 떨어져 있다",
        [
          [0, 0],
          [1, 0],
        ],
        [
          [2, 0],
          [3, 0],
        ],
      ],
      ["같은 직선 위인데 떨어져 있다 · 좌표 상한", BIG_APART1, BIG_APART2],
    ];
    const family = collinearApart(PAIRS, COORD);
    let wrong = 0;
    for (const [s1, s2] of family) {
      if (noBox.segmentsIntersect(s1, s2) !== segmentsIntersect(s1, s2))
        wrong++;
    }
    return [
      contrast(cases, noBox.segmentsIntersect, "칸을 안 본 답"),
      "",
      `같은 직선 위에서 떨어져 있는 선분 쌍 ${num(family.length)} 벌 가운데 ${num(wrong)} 벌에서 답이 어긋난다`,
      "└ 판정값이 0 이라는 것은 그 끝점이 상대의 직선 위라는 뜻까지다",
    ].join("\n");
  },

  /** `related` — 퇴화 배치가 얼마나 자주 나오는가. */
  "related-degenerate": () => {
    const families: [string, [Segment, Segment][]][] = [
      ["좌표 0~6", scattered(PAIRS, 6)],
      ["좌표 0~20", scattered(PAIRS, 20)],
      ["좌표 0~100", scattered(PAIRS, 100)],
      ["좌표 상한 10^9", scattered(PAIRS, COORD)],
    ];
    const rows = families.map(([label, cases]) => {
      let degenerate = 0;
      for (const [s1, s2] of cases) {
        if (judge(s1, s2).d.some((v) => v === 0)) degenerate++;
      }
      return [
        label,
        num(cases.length),
        num(degenerate),
        `${((100 * degenerate) / cases.length).toFixed(2)}%`,
      ];
    });
    const walkDegenerate = WALK.filter(([, s1, s2]) =>
      judge(s1, s2).d.some((v) => v === 0),
    ).length;
    return [
      table(["입력 가족", "선분 쌍", "판정값에 0 이 있다", "비율"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      `전개 입력 세 쌍 가운데 퇴화 배치는 ${walkDegenerate} 쌍이다`,
      "└ 좌표 범위가 좁을수록 퇴화 배치가 늘어난다. 일반 위치만 가정한 코드는 좁은 격자에서 먼저 어긋난다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const triples: [Point, Point, Point][] = [
      [
        [0, 0],
        [6, 4],
        [0, 4],
      ],
      [
        [0, 0],
        [6, 4],
        [6, 0],
      ],
      [
        [0, 0],
        [6, 4],
        [3, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [0, 0],
      ],
    ];
    const rows = triples.map(([o, a, b]) => {
      const value = exactOf(o, a, b);
      const sign = sideOf(o, a, b);
      return [
        `${pt(o)} → ${pt(a)} → ${pt(b)}`,
        value.toString(),
        String(sign),
        sign === 1
          ? "왼쪽으로 꺾인다"
          : sign === -1
            ? "오른쪽으로 꺾인다"
            : "한 직선 위다",
      ];
    });
    return [
      table(["세 점", "식이 낸 값", "부호", "뜻"], rows, ["l", "r", "r", "l"]),
      "",
      "└ 값의 절댓값은 세 점이 만드는 삼각형 넓이의 두 배이지만, 이 절차는 그 크기를 한 번도 안 쓴다",
    ].join("\n");
  },

  /** `deep.math` ③ — 교점의 매개변수를 판정값으로 닫는다. */
  "math-param": () => {
    const pairs: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      [
        "사선과 수직선",
        [
          [0, 0],
          [4, 4],
        ],
        [
          [2, 0],
          [2, 4],
        ],
      ],
      [
        "한쪽이 짧다 · 문제 예시",
        [
          [0, 0],
          [10, 10],
        ],
        [
          [5, 0],
          [5, 4],
        ],
      ],
    ];
    const rows = pairs.map(([label, s1, s2]) => {
      const [p1, p2] = s1;
      const [p3, p4] = s2;
      const d1 = Number(exactOf(p3, p4, p1));
      const d2 = Number(exactOf(p3, p4, p2));
      const t = d1 / (d1 - d2);
      const meet: [number, number] = [
        p1[0] + t * (p2[0] - p1[0]),
        p1[1] + t * (p2[1] - p1[1]),
      ];
      const inside = t >= 0 && t <= 1;
      return [
        label,
        String(d1),
        String(d2),
        t.toFixed(3),
        `(${meet[0]},${meet[1]})`,
        inside ? "s1 안" : "s1 밖",
        String(segmentsIntersect(s1, s2)),
      ];
    });
    return [
      table(
        [
          "입력",
          "원시 d1",
          "원시 d2",
          "t*",
          "두 직선이 만나는 점",
          "그 점이",
          "답",
        ],
        rows,
        ["l", "r", "r", "r", "l", "l", "l"],
      ),
      "",
      "└ 셋째 줄은 t* 가 0 과 1 사이인데도 답이 false 다. 나머지 판정값 둘이 갈리지 않기 때문이다",
    ].join("\n");
  },

  /** `deep.math` ④ — 오차 한계에 제약 규모를 넣는다. */
  "math-error": () => {
    const rows = [1_000_000, 10_000_000, 100_000_000, COORD].map((c) => {
      const bound = (c * c) / 2 ** 49;
      return [num(c), bound.toFixed(6), bound < 1 ? "필요 없다" : "필요하다"];
    });
    let widest = 0;
    for (let c = 23_000_000; c <= 24_000_000; c++) {
      if ((c * c) / 2 ** 49 >= 1) break;
      widest = c;
    }
    const rnd = makeRnd(SEED);
    let worst = 0;
    for (let at = 0; at < 300_000; at++) {
      const ux = (rnd() % (2 * COORD)) - COORD;
      const uy = (rnd() % (2 * COORD)) - COORD;
      const vx = (rnd() % (2 * COORD)) - COORD;
      const vy = (rnd() % (2 * COORD)) - COORD;
      const gap = Math.abs(
        ux * vy -
          uy * vx -
          Number(BigInt(ux) * BigInt(vy) - BigInt(uy) * BigInt(vx)),
      );
      if (gap > worst) worst = gap;
    }
    return [
      table(["좌표 상한 C", "오차 한계 C² / 2^49", "큰 정수 되재기가"], rows, [
        "r",
        "r",
        "l",
      ]),
      "",
      `한계가 1 보다 작은 가장 큰 좌표 상한  ${num(widest)}  (${((widest * widest) / 2 ** 49).toFixed(9)})`,
      `그 다음 값                            ${num(widest + 1)}  (${(((widest + 1) * (widest + 1)) / 2 ** 49).toFixed(9)})`,
      `무작위 네 성분 ${num(300_000)} 벌의 실제 최대 편차  ${num(worst)}`,
      `이 절차가 쓰는 하한 SAFE                  ${num(SAFE)}`,
      "└ 한계는 넉넉하게 잡은 값이고, 그보다 큰 2 의 거듭제곱을 하한으로 둔다",
    ].join("\n");
  },

  /** `invariant` ② — 갈래 셋이 겹치지 않는다. */
  "invariant-states": () => {
    const cases: [string, Segment, Segment][] = [
      ["s1·s2", S1, S2],
      ["s1·s3", S1, S3],
      ["s1·s4", S1, S4],
      ["s2·s4", S2, S4],
    ];
    const rows = cases.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      const straddle1 = r.d[0] !== 0 && r.d[1] !== 0 && r.d[0] !== r.d[1];
      const straddle2 = r.d[2] !== 0 && r.d[3] !== 0 && r.d[2] !== r.d[3];
      const zeros = r.d.filter((v) => v === 0).length;
      return [
        label,
        r.d.join(" "),
        String(zeros),
        straddle1 && straddle2 ? "참" : "거짓",
        r.branch === "④" ? "참" : "거짓",
        r.branch,
        String(r.answer),
      ];
    });
    return [
      table(
        ["쌍", "판정값 넷", "0 의 개수", "③ 이", "④ 가", "답을 낸 갈래", "답"],
        rows,
        ["l", "l", "r", "l", "l", "l", "l"],
      ),
      "",
      "└ ③ 이 참인 줄에는 0 이 하나도 없고, ④ 가 참인 줄에는 0 이 하나 이상이다. 두 열이 함께 참인 줄이 없다",
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, Segment, Segment][] = [
      ["두 선분이 같다", S1, S1],
      [
        "길이 0 선분이 상대 선분 위",
        [
          [0, 0],
          [4, 0],
        ],
        [
          [2, 0],
          [2, 0],
        ],
      ],
      [
        "길이 0 선분이 상대 선분 밖",
        [
          [0, 0],
          [4, 0],
        ],
        [
          [2, 1],
          [2, 1],
        ],
      ],
      [
        "점 둘이 같은 자리",
        [
          [3, 3],
          [3, 3],
        ],
        [
          [3, 3],
          [3, 3],
        ],
      ],
      [
        "점 둘이 다른 자리",
        [
          [0, 0],
          [0, 0],
        ],
        [
          [1, 1],
          [1, 1],
        ],
      ],
      [
        "끝점끼리 만난다",
        [
          [0, 0],
          [1, 0],
        ],
        [
          [1, 0],
          [1, 1],
        ],
      ],
      [
        "평행하고 떨어져 있다",
        [
          [0, 0],
          [2, 0],
        ],
        [
          [0, 1],
          [2, 1],
        ],
      ],
      ["좌표 상한의 X 자", BIG_X1, BIG_X2],
    ];
    const rows = cases.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      return [
        label,
        seg(s1),
        seg(s2),
        r.d.join(" "),
        r.branch,
        String(r.answer),
      ];
    });
    return [
      table(["입력", "첫 인자", "둘째 인자", "판정값 넷", "갈래", "답"], rows, [
        "l",
        "l",
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      "└ 길이 0 인 선분은 방향 벡터가 영벡터라 그 선분이 내는 판정값 둘이 언제나 0 이고, 그대로 ④ 로 간다",
    ].join("\n");
  },

  /** `invariant` ③ — `p3` 자리의 끝점 검사를 빼면. */
  "mutant-drop-p3": () => {
    const cases: [string, Segment, Segment][] = [
      [
        "끝점이 상대 선분 안에 있다",
        [
          [0, 0],
          [4, 0],
        ],
        [
          [2, 0],
          [2, 3],
        ],
      ],
      ["s2·s4", S2, S4],
      ["s1·s4", S1, S4],
    ];
    return [
      contrast(cases, dropP3.segmentsIntersect, "p3 검사를 뺀 답"),
      "",
      "└ 셋째 줄은 답이 그대로다. p1 자리의 검사가 먼저 참이 되므로 p3 자리가 없어도 답이 안 바뀐다",
    ].join("\n");
  },

  /** `perf.derive` — 한 번의 호출이 하는 일. */
  "perf-count": () => {
    // 걸음 번호는 `walk-trace` 와 같은 규칙으로 센다 — ③ 에서 끝난 쌍은 두 걸음, 나머지는 셋.
    let step = 0;
    const rows = WALK.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      const from = step + 1;
      step += r.branch === "③" ? 2 : 3;
      return [
        label,
        `T${from}~T${step}`,
        String(4),
        String(r.fast),
        String(r.slow),
        String(r.slow * 2),
        String(r.boxes),
        String(r.fast * 2 + r.slow * 8 + r.boxes * 4),
      ];
    });
    const total = WALK.reduce((n, [, s1, s2]) => {
      const r = judge(s1, s2);
      return n + r.fast * 2 + r.slow * 8 + r.boxes * 4;
    }, 0);
    return [
      table(
        [
          "쌍",
          "걸음",
          "방향 판정",
          "① 로 끝난 판정",
          "② 로 간 판정",
          "큰 정수 곱",
          "칸 검사",
          "기본 연산",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `세 쌍 합계 ${total}`,
      "기본 연산 = 배정밀도 곱 + 큰 정수 변환 + 큰 정수 곱 + 좌표 비교",
      "└ 판정 하나가 ① 로 끝나면 2, ② 까지 가면 8 이고 칸 검사 하나가 4 다",
    ].join("\n");
  },

  /** `perf.worst` — 어떤 배치가 무엇을 가장 많이 쓰는가. */
  "worst-shape": () => {
    const shapes: [string, Segment, Segment][] = [
      ["전개 입력 s1·s2", S1, S2],
      ["전개 입력 s1·s4", S1, S4],
      ["좌표 상한의 X 자", BIG_X1, BIG_X2],
      ["같은 직선 위인데 떨어져 있다 · 좌표 상한", BIG_APART1, BIG_APART2],
      [
        "같은 직선 위인데 떨어져 있다",
        [
          [0, 0],
          [1, 0],
        ],
        [
          [2, 0],
          [3, 0],
        ],
      ],
      ["상한 근처의 점 하나", [FAR_O, FAR_A], [FAR_C, FAR_C]],
    ];
    const rows = shapes.map(([label, s1, s2]) => {
      const r = judge(s1, s2);
      return [
        label,
        String(r.slow),
        r.bits === 0 ? "—" : String(r.bits),
        String(r.boxes),
        String(r.fast * 2 + r.slow * 8 + r.boxes * 4),
        r.branch,
      ];
    });
    // 「—」 는 되잰 적이 없다는 뜻이라 0 으로 센다. NaN 으로 두면 최댓값이 통째로 NaN 이 된다.
    const cell = (r: string[], at: number): number => {
      const raw = r[at] ?? "";
      return raw === "—" ? 0 : Number(raw);
    };
    const best = (at: number): string => {
      const top = Math.max(...rows.map((r) => cell(r, at)));
      return (
        rows
          .filter((r) => cell(r, at) === top)
          .map((r) => r[0])
          // 이름 안에 「·」 가 있으므로 목록 구분자를 다른 글자로 둔다.
          .join(" / ")
      );
    };
    return [
      table(
        ["배치", "되잰 판정", "곱의 최대 비트", "칸 검사", "기본 연산", "갈래"],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      `기본 연산이 가장 많은 배치  ${best(4)}`,
      `곱의 비트 수가 가장 큰 배치  ${best(2)}`,
      "└ 좌표를 상한까지 키운 X 자가 기본 연산이 가장 적다",
      "└ 되재기는 판정값이 클수록 줄고, 곱의 비트 수는 좌표가 클수록 는다",
    ].join("\n");
  },
};
