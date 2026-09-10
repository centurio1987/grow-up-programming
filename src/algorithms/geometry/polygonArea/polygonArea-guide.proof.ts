/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts polygonArea-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  type Point,
  polygonArea,
  shoelaceTwice,
} from "./polygonArea-guide.ref.ts";

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

/**
 * 천 단위 구분. 본문 표기와 같다.
 *
 * **0 을 더해 두는 이유는 음의 0 이다.** `-1000 * 0` 은 `-0` 이고 그대로 적으면 표에 `-0` 이
 * 찍히는데, 그 칸이 뜻하는 것은 0 이다.
 */
const num = (n: number): string => (n + 0).toLocaleString("en-US");

/**
 * 큰 정수의 천 단위 구분. **`Number` 로 바꿔 적지 않는다** — 이 편이 다루는 항과 누적은
 * 배정밀도가 정수로 못 담는 크기라, 변환하는 순간 표가 어림수로 보이게 된다.
 */
const bignum = (n: bigint): string =>
  (n < 0n ? "-" : "") +
  (n < 0n ? -n : n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * 넓이 하나의 표기. 정수 자리는 천 단위로 끊고 소수점 아래는 그대로 둔다.
 *
 * 이 편의 넓이는 2 배 넓이가 홀수일 때만 소수점이 붙고, 그때 소수 자리는 언제나 `.5` 다.
 */
const area = (x: number): string =>
  Number.isInteger(x)
    ? num(x)
    : `${num(Math.trunc(x))}${String(Math.abs(x % 1)).slice(1)}`;

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
 * 본문 전개가 쓰는 고정 입력 — L 자 다각형.
 *
 * 문제의 예시가 그대로 쓰는 다각형이고 넓이가 12 다. 오목한 꼭짓점이 하나 있어서 「삼각형을
 * 그냥 더한다」가 왜 안 되는지가 이 입력 하나에서 보인다.
 */
const L: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];

/** 같은 L 자를 (10,10) 만큼 옮긴 것. 원점이 다각형 **밖**인 배치다. */
const L_FAR: Point[] = L.map(([x, y]) => [x + 10, y + 10] as Point);

/** 꼭짓점 순서를 뒤집은 L 자. 시계 방향 입력이다. */
const L_CW: Point[] = [...L].reverse();

/** 오목 꼭짓점이 원점 쪽으로 파인 오각형. 넓이 12 로 L 자와 같다. */
const PENT: Point[] = [
  [0, 0],
  [2, 2],
  [4, 0],
  [4, 4],
  [0, 4],
];

/** 최소 다각형. 2 배 넓이가 홀수 1 이라 넓이가 0.5 다. */
const TRI: Point[] = [
  [0, 0],
  [1, 0],
  [0, 1],
];

/** 제약의 좌표 절댓값 상한과 배정밀도가 정수를 어긋남 없이 담는 한계. */
const COORD = 1_000_000_000;
const EXACT = Number.MAX_SAFE_INTEGER;

/** 제약의 꼭짓점 수 상한. */
const MAX_N = 100_000;

/**
 * 배정밀도로 곱을 만들면 어긋나는 배치.
 *
 * 두 곱이 다 10^18 언저리라 배정밀도의 정수 간격이 128 이다. 참값의 차 −1,999,999,999 는
 * 그 간격 안에서 사라진다.
 */
const HUGE_TRI: Point[] = [
  [0, 0],
  [999_999_999, COORD],
  [COORD, 999_999_999],
];

/** 원점에서 멀리 떨어진 얇은 띠. 넓이는 작은데 누적이 크게 자란다. */
const STRIP: Point[] = [
  [-COORD, COORD - 1],
  [COORD, COORD - 1],
  [COORD, COORD],
  [-COORD, COORD],
];

/** 변 이름과 두 끝점. 정본의 반복 순서와 같다. */
function edges(polygon: Point[]): [string, Point, Point][] {
  const out: [string, Point, Point][] = [];
  for (let at = 0; at < polygon.length; at++) {
    out.push([
      `e${at + 1}`,
      polygon[at] as Point,
      polygon[(at + 1) % polygon.length] as Point,
    ]);
  }
  return out;
}

/** 변 하나가 내는 항. 정본과 같은 산술이다. */
function term(a: Point, b: Point): bigint {
  return BigInt(a[0]) * BigInt(b[1]) - BigInt(b[0]) * BigInt(a[1]);
}

/** 정수 하나를 담는 데 필요한 비트 수. 0 이면 0 이다. */
function bits(n: bigint): number {
  const size = n < 0n ? -n : n;
  return size === 0n ? 0 : size.toString(2).length;
}

/** 반지름 `r` 의 원 위 `n` 점을 반올림해 잇고 `(dx, dy)` 만큼 옮긴 다각형. */
function ring(n: number, r: number, dx = 0, dy = 0): Point[] {
  const out: Point[] = [];
  for (let at = 0; at < n; at++) {
    const t = (2 * Math.PI * at) / n;
    out.push([
      Math.round(r * Math.cos(t)) + dx,
      Math.round(r * Math.sin(t)) + dy,
    ]);
  }
  return out;
}

/** 꼭짓점 `n` 개짜리 볼록 다각형. 귀 자르기의 검사 횟수를 재는 가족이다. */
function convex(n: number): Point[] {
  return ring(n, 1000);
}

/**
 * 이빨 `m` 개가 한 칸씩 올라가는 톱니. 오목 꼭짓점이 `m` 개라 부채꼴 조각이 다각형 밖을
 * 덮는 자리가 많다.
 */
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

/* ────────────────────────── 다른 경로로 잰 값 ────────────────────────── */

/**
 * 사다리꼴 식으로 잰 2 배 넓이. **정본과 다른 산술 경로**다.
 *
 * 닫힌 고리에서 `Σ (x_a − x_b)(y_a + y_b)` 는 신발끈 합과 같다 — `x_a y_a` 꼴 항이 고리를 한
 * 바퀴 따라가며 짝을 지어 사라지기 때문이다. 곱하는 것과 더하는 것이 신발끈과 달라서, 두 값이
 * 같다는 것이 우연이 아님을 확인하는 자리가 된다.
 */
function trapezoidTwice(polygon: Point[]): bigint {
  let sum = 0n;
  for (const [, a, b] of edges(polygon)) {
    sum += (BigInt(a[0]) - BigInt(b[0])) * (BigInt(a[1]) + BigInt(b[1]));
  }
  return sum;
}

/** 기준점을 `p` 로 둔 부채꼴의 2 배 넓이. `p` 가 원점이면 정본의 식과 같아진다. */
function fanTwice(polygon: Point[], p: Point): bigint {
  let sum = 0n;
  for (const [, a, b] of edges(polygon)) {
    sum +=
      (BigInt(a[0]) - BigInt(p[0])) * (BigInt(b[1]) - BigInt(p[1])) -
      (BigInt(b[0]) - BigInt(p[0])) * (BigInt(a[1]) - BigInt(p[1]));
  }
  return sum;
}

/** 항을 정수로 두고 **배정밀도로** 누적한 넓이. 항의 값 자체는 정확하다. */
function accumulateInDouble(polygon: Point[]): number {
  let twice = 0;
  for (const [, a, b] of edges(polygon)) {
    twice += Number(term(a, b));
  }
  return Math.abs(twice) / 2;
}

/** 항마다 2 로 나눠 **배정밀도로** 누적한 넓이. 정수가 아닌 값이 만들어진다. */
function accumulateHalves(polygon: Point[]): {
  value: number;
  fractions: number;
} {
  let sum = 0;
  let fractions = 0;
  for (const [, a, b] of edges(polygon)) {
    const half = Number(term(a, b)) / 2;
    if (!Number.isInteger(half)) fractions++;
    sum += half;
  }
  return { value: Math.abs(sum), fractions };
}

/** 항 하나를 배정밀도 곱으로 만든 값. 곱이 정수 범위를 넘으면 참값과 갈린다. */
function termInDouble(a: Point, b: Point): number {
  return a[0] * b[1] - b[0] * a[1];
}

/* ────────────────────────── 가장 단순한 방법 — 귀 자르기 ────────────────────────── */

/** 세 점이 만드는 삼각형의 부호 있는 넓이의 2 배. */
function triangleTwice(o: Point, a: Point, b: Point): bigint {
  return (
    (BigInt(a[0]) - BigInt(o[0])) * (BigInt(b[1]) - BigInt(o[1])) -
    (BigInt(b[0]) - BigInt(o[0])) * (BigInt(a[1]) - BigInt(o[1]))
  );
}

/** 점 `x` 가 삼각형 `p q r` 의 안이거나 변 위인가. 삼각형은 반시계 방향으로 받는다. */
function insideTriangle(p: Point, q: Point, r: Point, x: Point): boolean {
  return (
    triangleTwice(p, q, x) >= 0n &&
    triangleTwice(q, r, x) >= 0n &&
    triangleTwice(r, p, x) >= 0n
  );
}

/**
 * 귀 자르기 — `deep.build` 직무 ② 가 세우는 가장 단순한 방법.
 *
 * **정본을 부르지 않는다.** 오목하지 않은 꼭짓점 하나를 골라 그 삼각형 안에 다른 꼭짓점이
 * 없는지 확인하고, 없으면 그 삼각형을 떼어 넓이를 더한 다음 남은 다각형에 같은 일을 되풀이한다.
 * 삼각형 하나를 떼려면 남은 꼭짓점을 전부 확인해야 해서 검사가 꼭짓점 수의 제곱으로 는다.
 */
function earClip(polygon: Point[]): {
  twice: bigint;
  checks: number;
  ears: number;
} {
  const ccw = shoelaceTwice(polygon) > 0n;
  const order = ccw
    ? polygon.map((_, at) => at)
    : polygon.map((_, at) => polygon.length - 1 - at);
  const live = [...order];
  const at = (k: number): Point => polygon[live[k] as number] as Point;
  let checks = 0;
  let ears = 0;
  let twice = 0n;
  while (live.length > 3) {
    let cut = -1;
    for (let k = 0; k < live.length; k++) {
      const prev = (k + live.length - 1) % live.length;
      const next = (k + 1) % live.length;
      if (triangleTwice(at(prev), at(k), at(next)) <= 0n) continue;
      let ok = true;
      for (let j = 0; j < live.length; j++) {
        if (j === k || j === prev || j === next) continue;
        checks++;
        if (insideTriangle(at(prev), at(k), at(next), at(j))) {
          ok = false;
          break;
        }
      }
      if (ok) {
        cut = k;
        break;
      }
    }
    if (cut < 0) throw new Error("귀를 못 찾았다 — 단순 다각형이 아니다");
    const prev = (cut + live.length - 1) % live.length;
    const next = (cut + 1) % live.length;
    twice += triangleTwice(at(prev), at(cut), at(next));
    live.splice(cut, 1);
    ears++;
  }
  twice += triangleTwice(at(0), at(1), at(2));
  ears++;
  const want = shoelaceTwice(polygon);
  if (twice !== (want < 0n ? -want : want)) {
    throw new Error(`귀 자르기가 정본과 다른 넓이를 냈다 — ${twice}`);
  }
  return { twice, checks, ears };
}

/**
 * 꼭짓점 `n` 개짜리 볼록 다각형에 귀 자르기를 건 결과. 같은 `n` 을 두 번 재지 않는다 —
 * 확인 횟수가 꼭짓점 수의 제곱이라 큰 `n` 을 되풀이하면 이 파일 자체가 느려진다.
 */
const CLIPPED = new Map<number, ReturnType<typeof earClip>>();

function clipConvex(n: number): ReturnType<typeof earClip> {
  const hit = CLIPPED.get(n);
  if (hit !== undefined) return hit;
  const made = earClip(convex(n));
  CLIPPED.set(n, made);
  return made;
}

/* ────────────────────────── 계수 ────────────────────────── */

interface Counted {
  /** 본 변의 수. 갈래가 없어 언제나 꼭짓점 수와 같다. */
  edges: number;
  /** 좌표 읽기 + 큰 정수 변환 + 큰 정수 곱 + 큰 정수 덧셈·뺄셈 + 비교 + 나눗셈. */
  ops: number;
  /** 누적이 지나온 절댓값의 최댓값. */
  peak: bigint;
  /** 2 배 넓이. */
  twice: bigint;
}

/** 정본과 같은 절차를 걸음마다 세면서 실행한다. 답은 매번 정본과 대조한다. */
function judge(polygon: Point[]): Counted {
  let twice = 0n;
  let peak = 0n;
  let ops = 0;
  for (const [, a, b] of edges(polygon)) {
    ops += 12;
    twice += term(a, b);
    const size = twice < 0n ? -twice : twice;
    if (size > peak) peak = size;
  }
  ops += 3;
  if (twice !== shoelaceTwice(polygon)) {
    throw new Error("계수용 절차가 정본과 다른 값을 냈다");
  }
  return { edges: polygon.length, ops, peak, twice };
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { polygonArea: (polygon: Point[]) => number };

const REF = new URL("./polygonArea-guide.ref.ts", import.meta.url).pathname;

const TERM_LINE =
  /^ {4}twice \+= BigInt\(a\[0\]\) \* BigInt\(b\[1\]\) - BigInt\(b\[0\]\) \* BigInt\(a\[1\]\);$/;
const SIGN_LINE = /^ {2}const size = twice < 0n \? -twice : twice;$/;
const LOOP_LINE = /^ {2}for \(let at = 0; at < polygon\.length; at\+\+\) \{$/;

/** 항마다 절댓값을 씌워 더하는 사본. 부호가 사라져 상쇄가 일어나지 않는다. */
const absPerTerm = await loadMutant<Impl>(REF, {
  swap: [
    TERM_LINE,
    "    const t = BigInt(a[0]) * BigInt(b[1]) - BigInt(b[0]) * BigInt(a[1]);\n    twice += t < 0n ? -t : t;",
  ],
});

/** 항 하나를 배정밀도 곱으로 만든 뒤 큰 정수로 옮기는 사본. */
const doubleTerm = await loadMutant<Impl>(REF, {
  swap: [TERM_LINE, "    twice += BigInt(a[0] * b[1] - b[0] * a[1]);"],
});

/** 마지막 절댓값을 뺀 사본. 시계 방향 입력에서 음수가 그대로 나온다. */
const noAbsolute = await loadMutant<Impl>(REF, {
  swap: [SIGN_LINE, "  const size = twice;"],
});

/** 마지막 꼭짓점과 첫 꼭짓점을 잇는 변을 빼는 사본. 부채꼴이 안 닫힌다. */
const openFan = await loadMutant<Impl>(REF, {
  swap: [LOOP_LINE, "  for (let at = 0; at < polygon.length - 1; at++) {"],
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
  cases: [string, Point[]][],
  other: (polygon: Point[]) => number,
  otherHead: string,
): string {
  const gaps: number[] = [];
  const rows = cases.map(([label, polygon]) => {
    const want = polygonArea(polygon);
    const got = other(polygon);
    gaps.push(want === got ? 0 : 1);
    return [
      label,
      String(polygon.length),
      area(want),
      area(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  assertBreaks(gaps);
  return table(["배치", "꼭짓점", "정본", otherHead, "대조"], rows, [
    "l",
    "r",
    "r",
    "r",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 배치 여섯에서 2 배 넓이가 정수로 떨어지고 부호가 순서를 따른다. */
  "concept-cases": () => {
    const cases: [string, Point[]][] = [
      [
        "정사각형 · 반시계",
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
        ],
      ],
      [
        "정사각형 · 시계",
        [
          [0, 0],
          [0, 2],
          [2, 0 + 2],
          [2, 0],
        ],
      ],
      [
        "직각삼각형",
        [
          [0, 0],
          [4, 0],
          [0, 3],
        ],
      ],
      ["L 자 · 오목", L],
      [
        "공선 꼭짓점 포함",
        [
          [0, 0],
          [2, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ],
      ],
      [
        "한 직선 위",
        [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      ],
      ["최소 넓이 삼각형", TRI],
    ];
    const rows = cases.map(([label, polygon]) => {
      const twice = shoelaceTwice(polygon);
      return [
        label,
        String(polygon.length),
        bignum(twice),
        twice > 0n ? "반시계" : twice < 0n ? "시계" : "없다",
        area(polygonArea(polygon)),
      ];
    });
    return [
      table(
        ["배치", "꼭짓점", "2 배 넓이", "부호가 말하는 순서", "넓이"],
        rows,
        ["l", "r", "r", "l", "r"],
      ),
      "",
      "2 배 넓이는 일곱 줄 모두 정수다. 마지막 줄만 홀수라 넓이에 소수점이 붙는다",
      "└ 부호는 꼭짓점 순서를 말할 뿐이라 마지막에 한 번 걷어 내면 된다",
    ].join("\n");
  },

  /** `concept` — 좌표를 키우면 항과 누적이 배정밀도의 정수 범위를 넘는다. */
  "concept-exact": () => {
    const rows = [1_000, 1_000_000, 33_554_432, 67_108_864, COORD].map((c) => {
      const one = 2 * c * c;
      const seen = judge(ring(1_024, c)).peak;
      return [
        num(c),
        one.toExponential(2),
        one <= EXACT ? "담긴다" : "안 담긴다",
        bignum(seen),
        seen <= BigInt(EXACT) ? "담긴다" : "안 담긴다",
      ];
    });
    return [
      table(
        [
          "좌표 상한",
          "항 하나의 상한",
          "항이 배정밀도에",
          "원 1024 점에서 실제로 나온 누적의 최댓값",
          "그 누적이 배정밀도에",
        ],
        rows,
        ["r", "r", "l", "r", "l"],
      ),
      "",
      `정수가 어긋남 없이 담기는 마지막 값  ${num(EXACT)}`,
      `└ 제약의 좌표 상한에서 항 하나가 그 마지막 값의 ${num(Math.floor((2 * COORD * COORD) / EXACT))} 배까지 커진다`,
      "└ 항 하나의 상한은 좌표만으로 정해지고, 누적의 최댓값은 다각형의 모양이 정한다",
    ].join("\n");
  },

  /** `deep.build` ② — 귀 자르기는 답을 맞히지만 검사가 꼭짓점 수의 제곱으로 는다. */
  "build-ear": () => {
    const small = earClip(L);
    const rows = [16, 64, 128, 256, 512, 1_024].map((n) => {
      const r = clipConvex(n);
      const closed = ((n - 2) * (n - 3)) / 2;
      return [
        num(n),
        num(r.ears),
        num(r.checks),
        num(closed),
        num(r.checks - closed),
      ];
    });
    const grow = [256, 512, 1_024].map((n) => {
      const four = clipConvex(n).checks;
      const one = clipConvex(n / 4).checks;
      return [num(n / 4), num(n), num(one), num(four), (four / one).toFixed(2)];
    });
    const worst = ((MAX_N - 2) * (MAX_N - 3)) / 2;
    return [
      `L 자에 귀 자르기를 하면 삼각형 ${num(small.ears)} 개가 나오고 2 배 넓이 ${bignum(small.twice)} · 넓이 ${area(polygonArea(L))} 로 정본과 같다`,
      `그 사이에 「이 삼각형 안에 다른 꼭짓점이 있는가」 를 ${num(small.checks)} 번 확인한다`,
      "",
      table(
        ["꼭짓점", "떼어낸 삼각형", "확인한 횟수", "(n−2)(n−3)/2", "차"],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["꼭짓점 n", "꼭짓점 4n", "n 의 확인", "4n 의 확인", "성장률"],
        grow,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      "성장률 셋이 16 을 조금 넘고 꼭짓점이 늘수록 16 에 가까워진다 — 꼭짓점을 4 배로 하면 확인이 16 배다",
      "원 위의 점을 정수로 반올림하면 세 점이 거의 한 직선에 놓이는 자리가 생겨서, 큰 두 줄만 식보다 조금 많다",
      `제약의 꼭짓점 수 ${num(MAX_N)} 에서 식이 내는 확인 횟수  ${num(worst)}`,
      `그 확인 하나가 방향 판정 셋이고 판정 하나가 곱 둘이라 곱만 ${(worst * 6).toExponential(2)} 번이다`,
      "└ 1 초 제한에서 곱을 그만큼 못 한다. 답은 맞지만 규모를 못 받는다",
    ].join("\n");
  },

  /** `deep.build` ③ — 기준점 하나를 고정하고 변마다 부호 있는 삼각형을 더한다. */
  "build-fan": () => {
    const spread = (polygon: Point[]): string[][] => {
      let running = 0n;
      return edges(polygon).map(([name, a, b]) => {
        const t = term(a, b);
        running += t;
        return [
          name,
          `${pt(a)}-${pt(b)}`,
          bignum(t),
          bignum(running),
          t < 0n ? "밖을 덮는다" : t === 0n ? "넓이가 0 이다" : "안을 덮는다",
        ];
      });
    };
    const head = ["변", "두 끝점", "이번 항", "누적", "그 삼각형이 하는 일"];
    const align: ("l" | "r")[] = ["l", "l", "r", "r", "l"];
    return [
      "원점이 다각형의 꼭짓점 위일 때",
      "",
      table(head, spread(L), align),
      "",
      "같은 L 자를 (10,10) 만큼 옮겨 원점이 다각형 밖일 때",
      "",
      table(head, spread(L_FAR), align),
      "",
      `두 배치의 2 배 넓이 ${bignum(shoelaceTwice(L))} · ${bignum(shoelaceTwice(L_FAR))} · 넓이 ${area(polygonArea(L))} · ${area(polygonArea(L_FAR))}`,
      "└ 아래 배치는 밖을 덮는 조각이 둘 생기는데, 그 둘이 나머지 넷과 합쳐져 같은 24 가 된다",
      "└ 항이 전부 정수라 그 합인 2 배 넓이도 정수다",
    ].join("\n");
  },

  /** `deep.build` ④ — 기준점을 옮겨도 합이 같고, 원점이 연산을 가장 적게 쓴다. */
  "build-apex": () => {
    const apexes: [string, Point][] = [
      ["원점", [0, 0]],
      ["첫 꼭짓점", L_FAR[0] as Point],
      ["다각형 안의 점", [11, 11]],
      ["멀리 떨어진 점", [1000, -1000]],
    ];
    const rows = apexes.map(([label, p]) => {
      const sum = fanTwice(L_FAR, p);
      const zero = p[0] === 0 && p[1] === 0;
      const perEdge = zero ? 8 : 14;
      return [
        label,
        pt(p),
        bignum(sum),
        area(Number(sum < 0n ? -sum : sum) / 2),
        num(perEdge),
        num(perEdge * L_FAR.length),
      ];
    });
    return [
      table(
        [
          "기준점",
          "좌표",
          "2 배 넓이",
          "넓이",
          "변 하나의 기본 연산",
          "여섯 변의 합",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `다각형은 L 자를 (10,10) 만큼 옮긴 것이고 원점은 그 밖에 있다`,
      "기본 연산 = 좌표 읽기 + 곱 + 덧셈·뺄셈. 기준점이 원점이면 좌표 빼기 넷이 통째로 사라진다",
      "└ 네 기준점의 2 배 넓이가 전부 같다. 원점을 고르는 이유는 정확성이 아니라 연산 수다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 가장 단순한 후보인 「항마다 2 로 나눠 더한다」 를 반박한다. */
  "build-half": () => {
    const raw = edges(TRI).map(([, a, b]) => term(a, b));
    const fits = (values: number[]): string => {
      for (const v of values) {
        try {
          BigInt(v);
        } catch {
          return `${v} 가 안 담긴다`;
        }
      }
      return "셋 다 담긴다";
    };
    const halved = raw.map((t) => Number(t) / 2);
    const big = ring(1_024, COORD);
    const exact = shoelaceTwice(big);
    const halves = accumulateHalves(big);
    const loose = accumulateInDouble(big);
    const want = polygonArea(big);
    const off = (x: number): string => bignum(BigInt(x) * 2n - exact);
    return [
      `최소 삼각형 ${TRI.map((p) => pt(p)).join(" ")} 에서 두 방식이 만드는 값`,
      "",
      table(
        ["방식", "세 변의 값", "큰 정수 자료형에"],
        [
          [
            "항마다 2 로 나눈다",
            halved.map((v) => String(v)).join(" · "),
            fits(halved),
          ],
          [
            "항을 정수로 둔다",
            raw.map((t) => bignum(t)).join(" · "),
            fits(raw.map((t) => Number(t))),
          ],
        ],
        ["l", "r", "l"],
      ),
      "",
      `원 1,024 점 · 반지름 ${num(COORD)} 에서 세 방식의 답 (정수가 아닌 항 ${num(halves.fractions)} 개)`,
      "",
      table(
        ["방식", "답", "정확한 2 배 넓이와의 차"],
        [
          [
            "항마다 2 로 나눠 배정밀도로 더한다",
            area(halves.value),
            off(halves.value),
          ],
          ["항을 정수로 두고 배정밀도로 더한다", area(loose), off(loose)],
          ["항을 정수로 두고 큰 정수로 더한다", area(want), off(want)],
        ],
        ["l", "r", "r"],
      ),
      "",
      `정확한 2 배 넓이  ${bignum(exact)}`,
      "└ 차는 답에 2 를 곱해 그 정수와 견준 값이다",
      "└ 항마다 나누면 정수가 아닌 값이 생겨 큰 정수로 가는 길이 처음부터 막힌다",
      "└ 큰 정수로 더한 셋째 줄도 차가 0 이 아니다 — 답을 배정밀도로 돌려주는 마지막 한 걸음이 남기는 차다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 좌표를 키우면 배정밀도 누적이 어디서부터 어긋나는가. */
  "build-scale": () => {
    const radii = [1_024, 32_768, 1_048_576, 33_554_432, 67_108_864, COORD];
    const rows = radii.map((r) => {
      const polygon = ring(1024, r);
      const c = judge(polygon);
      const loose = accumulateInDouble(polygon);
      const want = polygonArea(polygon);
      return [
        num(r),
        bignum(c.twice),
        num(bits(c.peak)),
        area(loose),
        area(want),
        loose === want ? "같다" : "어긋난다",
      ];
    });
    const first = radii.find(
      (r) => accumulateInDouble(ring(1024, r)) !== polygonArea(ring(1024, r)),
    );
    return [
      table(
        [
          "반지름",
          "2 배 넓이",
          "누적의 비트 수",
          "배정밀도 누적의 답",
          "정본",
          "대조",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      `원 위 1,024 점을 반올림해 이은 다각형이고, 반지름만 바꾼다`,
      `표에서 배정밀도 누적이 처음 어긋난 반지름  ${num(first ?? 0)}`,
      `누적의 비트 수가 ${num(Math.log2(EXACT + 1))} 을 넘는 줄부터 어긋난다`,
      "└ 항이 정수인 것만으로는 모자라고, 그 합까지 담겨야 배정밀도가 맞는 답을 낸다",
    ].join("\n");
  },

  /** `deep.walk` 단계 1 — 변 하나의 항. */
  "walk-terms": () => {
    const [, a, b] = edges(L)[1] as [string, Point, Point];
    const t = term(a, b);
    return [
      `e2 = ${pt(a)}-${pt(b)} 의 항을 손으로`,
      "",
      `  x_a · y_b = ${a[0]} × ${b[1]} = ${num(a[0] * b[1])}`,
      `  x_b · y_a = ${b[0]} × ${a[1]} = ${num(b[0] * a[1])}`,
      `  t         = ${num(a[0] * b[1])} − ${num(b[0] * a[1])} = ${bignum(t)}`,
      "",
      `원점과 ${pt(a)} 와 ${pt(b)} 가 만드는 삼각형의 넓이는 ${area(Number(t) / 2)} 이고, t 는 그 2 배다`,
      "└ 곱 둘과 뺄셈 하나뿐이다. 좌표가 정수면 t 도 정수다",
    ].join("\n");
  },

  /** `deep.walk` 멈춤 1 — 항을 배정밀도 곱으로 만들면. */
  "pause-double": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      ["옮긴 L 자", L_FAR],
      ["좌표 상한의 삼각형", HUGE_TRI],
    ];
    const a = HUGE_TRI[1] as Point;
    const b = HUGE_TRI[2] as Point;
    return [
      contrast(cases, doubleTerm.polygonArea, "배정밀도 곱으로 만든 답"),
      "",
      `셋째 줄의 변 ${pt(a)}-${pt(b)} 의 항을 산술 둘로 만들면`,
      "",
      table(
        ["곱셈 자리", "큰 정수 산술", "배정밀도 산술"],
        [
          ["x_a · y_b", bignum(BigInt(a[0]) * BigInt(b[1])), num(a[0] * b[1])],
          ["x_b · y_a", bignum(BigInt(b[0]) * BigInt(a[1])), num(b[0] * a[1])],
          ["두 곱의 차", bignum(term(a, b)), num(termInDouble(a, b))],
        ],
        ["l", "r", "r"],
      ),
      "",
      `두 곱이 다 ${num(EXACT)} 를 넘어서 배정밀도가 참값의 차를 못 담는다`,
      "└ 좌표가 작으면 곱도 작아서 답이 안 바뀐다. 상한 가까이 가면 항 하나가 통째로 다른 값이 된다",
    ].join("\n");
  },

  /** `deep.walk` 단계 2 — 순환 인덱스가 마지막 변을 잇는다. */
  "walk-cycle": () => {
    const rows = edges(L).map(([name, a, b], at) => [
      name,
      `${at} → ${(at + 1) % L.length}`,
      `${pt(a)}-${pt(b)}`,
      bignum(term(a, b)),
    ]);
    return [
      table(["변", "첨자", "두 끝점", "이번 항"], rows, ["l", "l", "l", "r"]),
      "",
      `마지막 줄의 첫 첨자가 ${L.length - 1} 이고 다음 첨자가 0 이다 — 나머지 연산이 배열의 끝에서 앞으로 이어 준다`,
      `항 여섯의 합 ${bignum(shoelaceTwice(L))}`,
      "└ 첫 변과 마지막 변의 항이 둘 다 0 이다. 원점이 그 두 변을 지나는 직선 위에 있기 때문이다",
    ].join("\n");
  },

  /** `deep.walk` 멈춤 2 — 마지막 변을 안 이으면. */
  "pause-close": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      ["오목 오각형", PENT],
      ["옮긴 L 자", L_FAR],
      [
        "원점을 안 지나는 정사각형",
        [
          [1, 1],
          [3, 1],
          [3, 3],
          [1, 3],
        ],
      ],
    ];
    return [
      contrast(cases, openFan.polygonArea, "마지막 변을 뺀 답"),
      "",
      table(
        ["배치", "마지막 변", "그 변의 항", "빼면 남는 2 배 넓이"],
        cases.map(([label, polygon]) => {
          const last = edges(polygon)[polygon.length - 1] as [
            string,
            Point,
            Point,
          ];
          const t = term(last[1], last[2]);
          return [
            label,
            `${pt(last[1])}-${pt(last[2])}`,
            bignum(t),
            bignum(shoelaceTwice(polygon) - t),
          ];
        }),
        ["l", "l", "r", "r"],
      ),
      "",
      "└ 위 두 배치는 마지막 변의 항이 0 이라 빼도 답이 그대로다. 원점이 그 변을 지나는 직선 위에 있기 때문이다",
      "└ 아래 두 배치는 마지막 변이 원점을 지나는 직선 위에 없어서 그 항이 0 이 아니고, 빼면 답이 갈린다",
    ].join("\n");
  },

  /** `deep.walk` 단계 3 — 여섯 변을 끝까지 실행한다. */
  "walk-trace": () => {
    const rows: string[][] = [];
    let twice = 0n;
    for (const [at, [name, a, b]] of edges(L).entries()) {
      const t = term(a, b);
      twice += t;
      rows.push([
        `T${at + 1}`,
        name,
        `${pt(a)}-${pt(b)}`,
        bignum(t),
        bignum(twice),
        "①",
      ]);
    }
    const size = twice < 0n ? -twice : twice;
    rows.push(["T7", "—", "반복문이 끝났다", "—", bignum(size), "② ③"]);
    return [
      table(["걸음", "변", "두 끝점", "이번 항", "누적", "갈래"], rows, [
        "l",
        "l",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `걸음 ${rows.length} 개 · 2 배 넓이 ${bignum(twice)} · 답 ${area(polygonArea(L))}`,
      `② 는 누적이 ${twice < 0n ? "음수라 부호를 뒤집는다" : "양수라 그대로 둔다"} · ③ 은 ${bignum(size)} 를 배정밀도로 옮겨 2 로 나눈다`,
      "└ 갈래가 셋뿐이고 그중 ① 만 변마다 실행된다. 나머지 둘은 반복문이 끝난 뒤 한 번씩이다",
    ].join("\n");
  },

  /** `deep.walk` 멈춤 3 — 마지막 절댓값을 빼면. */
  "pause-sign": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자 · 반시계", L],
      ["뒤집은 L 자 · 시계", L_CW],
      [
        "시계 방향 정사각형",
        [
          [0, 0],
          [0, 2],
          [2, 2],
          [2, 0],
        ],
      ],
    ];
    return [
      contrast(cases, noAbsolute.polygonArea, "절댓값을 뺀 답"),
      "",
      table(
        ["배치", "2 배 넓이", "부호가 말하는 순서"],
        cases.map(([label, polygon]) => {
          const twice = shoelaceTwice(polygon);
          return [label, bignum(twice), twice > 0n ? "반시계" : "시계"];
        }),
        ["l", "r", "l"],
      ),
      "",
      "└ 반시계 방향 입력에서는 절댓값이 아무 일도 안 한다. 시계 방향이면 답이 음수가 되어 넓이가 아니게 된다",
    ].join("\n");
  },

  /** `deep.walk` 단계 4 — 꼭짓점 순서를 뒤집어 실행한다. */
  "walk-reverse": () => {
    const terms = edges(L_CW).map(([, a, b]) => term(a, b));
    const twice = shoelaceTwice(L_CW);
    const size = twice < 0n ? -twice : twice;
    return [
      table(
        ["걸음", "본 변", "항", "누적", "갈래"],
        [
          [
            "T8",
            "여섯 변을 차례로 본다",
            terms.map((t) => bignum(t)).join(" "),
            bignum(twice),
            "①",
          ],
          ["T9", "반복문이 끝났다", "—", bignum(size), "② ③"],
        ],
        ["l", "l", "l", "r", "l"],
      ),
      "",
      `변의 차례 ${edges(L_CW)
        .map(([, a, b]) => `${pt(a)}-${pt(b)}`)
        .join(" · ")}`,
      `꼭짓점 ${L_CW.map((p) => pt(p)).join(" ")}`,
      `2 배 넓이 ${bignum(twice)} · 절댓값 ${bignum(size)} · 답 ${area(polygonArea(L_CW))}`,
      "└ 항의 부호가 전부 뒤집혀 누적도 뒤집힌다. 크기는 그대로라 ② 하나로 되돌아온다",
    ].join("\n");
  },

  /** `related` — 기준점이 낀 항이 고리를 한 바퀴 따라가며 짝을 지어 사라진다. */
  "related-telescope": () => {
    const p: Point = [1000, -1000];
    const rows = edges(L_FAR).map(([name, a, b]) => {
      const dx = b[0] - a[0];
      const dy = a[1] - b[1];
      return [
        name,
        `${pt(a)}-${pt(b)}`,
        bignum(term(a, b)),
        num(dx),
        num(dy),
        num(p[1] * dx),
        num(p[0] * dy),
      ];
    });
    const sumDx = edges(L_FAR).reduce((s, [, a, b]) => s + (b[0] - a[0]), 0);
    const sumDy = edges(L_FAR).reduce((s, [, a, b]) => s + (a[1] - b[1]), 0);
    const sumPy = edges(L_FAR).reduce(
      (s, [, a, b]) => s + p[1] * (b[0] - a[0]),
      0,
    );
    const sumPx = edges(L_FAR).reduce(
      (s, [, a, b]) => s + p[0] * (a[1] - b[1]),
      0,
    );
    rows.push([
      "합",
      "—",
      bignum(shoelaceTwice(L_FAR)),
      num(sumDx),
      num(sumDy),
      num(sumPy),
      num(sumPx),
    ]);
    return [
      table(
        [
          "변",
          "두 끝점",
          "원점 기준 항",
          "x_b − x_a",
          "y_a − y_b",
          "p_y 가 낀 항",
          "p_x 가 낀 항",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r", "r"],
      ),
      "",
      `기준점 ${pt(p)} 로 잰 2 배 넓이 ${bignum(fanTwice(L_FAR, p))} · 원점으로 잰 값 ${bignum(shoelaceTwice(L_FAR))}`,
      "└ 오른쪽 네 열의 합이 전부 0 이다. 꼭짓점 하나가 앞 변의 끝과 뒤 변의 시작으로 한 번씩 들어갔다 나온다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 손으로 계산한다. */
  "math-check": () => {
    const rows = edges(L).map(([name, a, b]) => [
      name,
      `${a[0]} × ${b[1]}`,
      num(a[0] * b[1]),
      `${b[0]} × ${a[1]}`,
      num(b[0] * a[1]),
      bignum(term(a, b)),
    ]);
    return [
      table(["변", "앞 곱", "값", "뒤 곱", "값", "차"], rows, [
        "l",
        "l",
        "r",
        "l",
        "r",
        "r",
      ]),
      "",
      `차 여섯의 합 ${bignum(shoelaceTwice(L))} 이고, 그 절반인 ${area(polygonArea(L))} 가 L 자의 넓이다`,
      `사다리꼴 식으로 따로 잰 값 ${bignum(trapezoidTwice(L))}`,
      "└ 두 식은 곱하는 것도 더하는 것도 다른데 같은 값을 낸다",
    ].join("\n");
  },

  /** `deep.math` ③ — 기준점을 아무 데나 두어도 합이 같다. */
  "math-cancel": () => {
    const points: [string, Point][] = [
      ["원점", [0, 0]],
      ["첫 꼭짓점", L_FAR[0] as Point],
      ["다각형 안", [11, 11]],
      ["멀리 · 음수 좌표", [-1_000_000, -1_000_000]],
      ["좌표 상한", [COORD, COORD]],
    ];
    const rows = points.map(([label, p]) => {
      const sum = fanTwice(L_FAR, p);
      return [
        label,
        pt(p),
        bignum(sum),
        bignum(sum - shoelaceTwice(L_FAR)),
        sum === shoelaceTwice(L_FAR) ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        ["기준점", "좌표", "2 배 넓이", "원점으로 잰 값과의 차", "대조"],
        rows,
        ["l", "l", "r", "r", "l"],
      ),
      "",
      "다각형은 L 자를 (10,10) 만큼 옮긴 것이고 꼭짓점 여섯 개다",
      "└ 다섯 기준점의 차가 전부 0 이다. 유도가 낸 「기준점 항이 사라진다」 가 값으로 확인된다",
    ].join("\n");
  },

  /** `deep.math` ④ — 결과식에 제약 규모를 넣어 수치를 낸다. */
  "math-bound": () => {
    const loose = 2 * MAX_N * COORD * COORD;
    const tight = 8 * COORD * COORD;
    const looseC = Math.floor(Math.sqrt(EXACT / (2 * MAX_N)));
    const tightC = Math.floor(Math.sqrt(EXACT / 8));
    const rows = [
      [
        "항을 다 같은 부호로 놓은 상한",
        "2nC²",
        loose.toExponential(2),
        num(looseC),
      ],
      [
        "단순 다각형이라는 것까지 쓴 상한",
        "8C²",
        tight.toExponential(2),
        num(tightC),
      ],
    ];
    return [
      table(
        ["어떤 상한인가", "식", "n=10^5 · C=10^9 에서", "배정밀도가 담는 C"],
        rows,
        ["l", "l", "r", "r"],
      ),
      "",
      `배정밀도가 정수를 어긋남 없이 담는 한계 ${num(EXACT)}`,
      `제약 규모에서 위 상한은 그 한계의 ${num(Math.floor(loose / EXACT))} 배 · 아래 상한은 ${num(Math.floor(tight / EXACT))} 배다`,
      `아래 상한이 담기는 마지막 좌표 상한 ${num(tightC)} 은 2 의 ${Math.log2(tightC + 1)} 제곱보다 하나 작다`,
      "└ 위 상한은 단순 다각형에서 도달하지 않는다. 넓이는 좌표 상자를 넘을 수 없기 때문이다",
    ].join("\n");
  },

  /** `invariant` — 걸음마다 누적이 그 부채꼴의 2 배 넓이와 같다. */
  "invariant-states": () => {
    const rows: string[][] = [];
    let twice = 0n;
    for (const [at, [name, a, b]] of edges(PENT).entries()) {
      const t = term(a, b);
      twice += t;
      const fan: Point[] = [[0, 0], ...PENT.slice(0, at + 2)];
      const apart = trapezoidTwice(fan);
      rows.push([
        name,
        `${pt(a)}-${pt(b)}`,
        bignum(t),
        bignum(twice),
        bignum(apart),
        twice === apart ? "같다" : "어긋난다",
      ]);
    }
    return [
      table(
        [
          "변까지 봤을 때",
          "두 끝점",
          "이번 항",
          "누적",
          "부채꼴을 사다리꼴 식으로 따로 잰 값",
          "대조",
        ],
        rows,
        ["l", "l", "r", "r", "r", "l"],
      ),
      "",
      `오목 오각형 ${PENT.map((p) => pt(p)).join(" ")} · 2 배 넓이 ${bignum(shoelaceTwice(PENT))} · 넓이 ${area(polygonArea(PENT))}`,
      "└ 둘째 항이 음수인데도 누적과 따로 잰 값이 모든 줄에서 같다",
      "└ 음수 항은 부채꼴이 다각형 밖으로 삐져나간 조각이고, 뒤 항이 그만큼을 다시 덮는다",
    ].join("\n");
  },

  /** `invariant` — 경계 배치에서도 두 값이 같다. */
  "invariant-edges": () => {
    const cases: [string, Point[]][] = [
      ["꼭짓점 셋 · 최소 다각형", TRI],
      [
        "꼭짓점이 모두 한 직선 위",
        [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      ],
      [
        "공선 꼭짓점이 낀 정사각형",
        [
          [0, 0],
          [2, 0],
          [4, 0],
          [4, 4],
          [0, 4],
        ],
      ],
      ["시계 방향 L 자", L_CW],
      ["원점이 다각형 밖", L_FAR],
      [
        "좌표 상한의 정사각형",
        [
          [-COORD, -COORD],
          [COORD, -COORD],
          [COORD, COORD],
          [-COORD, COORD],
        ],
      ],
      ["원점에서 먼 얇은 띠", STRIP],
    ];
    const rows = cases.map(([label, polygon]) => {
      const twice = shoelaceTwice(polygon);
      const apart = trapezoidTwice(polygon);
      return [
        label,
        String(polygon.length),
        bignum(twice),
        bignum(apart),
        area(polygonArea(polygon)),
        twice === apart ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        ["배치", "꼭짓점", "2 배 넓이", "사다리꼴 식", "넓이", "대조"],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      "└ 일곱 배치 모두 두 산술이 같은 정수를 낸다. 넓이가 0 인 줄도 갈래를 따로 두지 않는다",
    ].join("\n");
  },

  /** `invariant` ③ — 항마다 절댓값을 씌운 변이. */
  "mutant-abs": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자 · 원점이 꼭짓점", L],
      ["옮긴 L 자 · 원점이 밖", L_FAR],
      ["오목 오각형", PENT],
    ];
    const rows = cases.map(([label, polygon]) => {
      const negatives = edges(polygon).filter(([, a, b]) => term(a, b) < 0n);
      let sum = 0n;
      for (const [, a, b] of edges(polygon)) {
        const t = term(a, b);
        sum += t < 0n ? -t : t;
      }
      return [
        label,
        String(negatives.length),
        bignum(shoelaceTwice(polygon)),
        bignum(sum),
      ];
    });
    return [
      contrast(cases, absPerTerm.polygonArea, "항마다 절댓값을 씌운 답"),
      "",
      table(["배치", "음수 항", "정본의 2 배 넓이", "절댓값을 씌운 합"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 음수 항이 0 개인 첫 줄에서는 답이 안 바뀐다. 그 줄만 보면 결함을 못 찾는다",
      "└ 음수 항은 부채꼴이 다각형 밖을 덮은 조각이라, 부호를 걷으면 그 조각이 넓이에 남는다",
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음을 기본 연산으로 센다. */
  "perf-count": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      ["뒤집은 L 자", L_CW],
      ["오목 오각형", PENT],
      ["원 1024 점 · 반지름 10^9", ring(1024, COORD)],
    ];
    const rows = cases.map(([label, polygon]) => {
      const c = judge(polygon);
      return [
        label,
        num(c.edges),
        num(c.edges * 4),
        num(c.edges * 4),
        num(c.edges * 2),
        num(c.edges * 2),
        num(c.ops),
      ];
    });
    return [
      table(
        [
          "배치",
          "본 변",
          "좌표 읽기",
          "큰 정수 변환",
          "큰 정수 곱",
          "큰 정수 덧셈·뺄셈",
          "기본 연산",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      "기본 연산 = 좌표 읽기 + 큰 정수 변환 + 큰 정수 곱 + 큰 정수 덧셈·뺄셈 + 비교 + 나눗셈",
      "└ 변 하나가 12 이고, 반복문이 끝난 뒤 비교 하나 · 변환 하나 · 나눗셈 하나가 더 붙는다",
    ].join("\n");
  },

  /** `perf.worst` — 어떤 배치가 누산기를 가장 크게 만드는가. */
  "worst-shape": () => {
    const cases: [string, Point[]][] = [
      ["전개 입력 L 자", L],
      [
        "좌표 상한의 정사각형",
        [
          [-COORD, -COORD],
          [COORD, -COORD],
          [COORD, COORD],
          [-COORD, COORD],
        ],
      ],
      ["원 1024 점 · 반지름 10^9", ring(1024, COORD)],
      ["원 1024 점 · 반지름 1000 · 원점 위", ring(1024, 1000)],
      [
        "원 1024 점 · 반지름 1000 · 좌표 상한으로 옮김",
        ring(1024, 1000, COORD - 1000, COORD - 1000),
      ],
      ["원점에서 먼 얇은 띠", STRIP],
      [
        "톱니 512 · 좌표 상한 근처로 옮김",
        comb(512, 3).map(
          ([x, y]) => [x + COORD - 2048, y + COORD - 2048] as Point,
        ),
      ],
    ];
    const rows = cases.map(([label, polygon]) => {
      const c = judge(polygon);
      return [
        label,
        num(c.edges),
        num(c.ops),
        num(bits(c.twice)),
        num(bits(c.peak)),
        num(bits(c.peak) - bits(c.twice)),
      ];
    });
    let widest = "";
    let widestBits = -1;
    let gapped = "";
    let gap = -1;
    for (const [label, polygon] of cases) {
      const c = judge(polygon);
      if (bits(c.peak) > widestBits) {
        widestBits = bits(c.peak);
        widest = label;
      }
      if (bits(c.peak) - bits(c.twice) > gap) {
        gap = bits(c.peak) - bits(c.twice);
        gapped = label;
      }
    }
    return [
      table(
        [
          "배치",
          "꼭짓점",
          "기본 연산",
          "2 배 넓이의 비트",
          "누적의 최댓값 비트",
          "차",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `누산기가 가장 넓어지는 배치  ${widest} (${num(widestBits)} 비트)`,
      `답보다 누산기가 가장 많이 큰 배치  ${gapped} (${num(gap)} 비트 차)`,
      "└ 기본 연산은 꼭짓점 수만 따라간다. 모양이 바꾸는 것은 누산기의 자릿수다",
    ].join("\n");
  },
};
