/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  IDENTITY,
  type Mat,
  matrixPowerFibonacci,
  multiply,
  TRANSITION,
} from "./matrixPowerFibonacci-guide.ref.ts";

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
const num = (n: number | bigint): string => n.toLocaleString("en-US");

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
 * 10 의 이진 표현이 `1010` 이라 **0 인 비트와 1 인 비트가 둘 다 나오고**, 최하위 비트가
 * 0 이라 누적을 건너뛰는 갈래가 첫 바퀴에서 먼저 실행된다. `F(10) = 55` 라 네 칸이 모두
 * 두 자리 안에 들어와 행렬을 한 줄로 적을 수 있다.
 */
const WALK_N = 10n;

/** 제약의 최댓값. */
const LIMIT = 10n ** 18n;

/** 견주기의 기준으로 쓰는 처리 속도. */
const PER_SECOND = 100_000_000n;

/** 1 년을 초로 센 값 — 365 일 기준. */
const YEAR_SECONDS = 31_536_000n;

/* ────────────────────────── 계측기 ────────────────────────── */

const bitLength = (n: bigint): number => (n === 0n ? 0 : n.toString(2).length);

const oneBits = (n: bigint): number =>
  n === 0n ? 0 : [...n.toString(2)].filter((c) => c === "1").length;

/** 행렬을 본문과 같은 표기로 적는다. */
const show = (M: Mat): string =>
  `[[${M[0][0]},${M[0][1]}],[${M[1][0]},${M[1][1]}]]`;

/** `M` 의 `k` 제곱. 계수를 안 세는 자리에서 쓴다. */
function power(k: number): Mat {
  let acc: Mat = IDENTITY;
  let step: Mat = TRANSITION;
  let e = k;
  while (e > 0) {
    if ((e & 1) === 1) acc = multiply(acc, step);
    step = multiply(step, step);
    e >>= 1;
  }
  return acc;
}

/** 정의를 그대로 옮긴 답. 한 걸음씩 더한다. */
function byAddition(n: number): bigint {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < n; i++) {
    const t = a + b;
    a = b;
    b = t;
  }
  return a;
}

/** 정본이 하는 행렬 곱 횟수. 바퀴마다 제곱 하나, 1 인 비트마다 누적 하나다. */
const matMuls = (n: bigint): number => bitLength(n) + oneBits(n);

/** 정본의 기본 연산 — 행렬 곱 하나가 스칼라 곱셈 8 번과 덧셈 4 번이다. */
const matrixOps = (n: bigint): number => 12 * matMuls(n);

/**
 * 자릿수까지 세는 계측기. `bigint` 곱셈 한 번의 일감은 두 값의 자릿수 곱에 비례하므로,
 * 곱셈 횟수만 세면 안 보이는 것이 여기서 보인다.
 */
interface Work {
  value: bigint;
  mults: number;
  digitWork: number;
}

const digits = (x: bigint): number => (x < 0n ? -x : x).toString().length;

const weighedCache = new Map<string, Work>();

function weighed(n: bigint): Work {
  const hit = weighedCache.get(n.toString());
  if (hit !== undefined) return hit;
  let mults = 0;
  let digitWork = 0;
  const mul = (x: bigint, y: bigint): bigint => {
    mults++;
    digitWork += digits(x) * digits(y);
    return x * y;
  };
  const mm = (A: Mat, B: Mat): Mat => [
    [
      mul(A[0][0], B[0][0]) + mul(A[0][1], B[1][0]),
      mul(A[0][0], B[0][1]) + mul(A[0][1], B[1][1]),
    ],
    [
      mul(A[1][0], B[0][0]) + mul(A[1][1], B[1][0]),
      mul(A[1][0], B[0][1]) + mul(A[1][1], B[1][1]),
    ],
  ];
  let acc: Mat = IDENTITY;
  let step: Mat = TRANSITION;
  let e = n;
  while (e > 0n) {
    if ((e & 1n) === 1n) acc = mm(acc, step);
    step = mm(step, step);
    e >>= 1n;
  }
  const out = { value: acc[0][1], mults, digitWork };
  weighedCache.set(n.toString(), out);
  return out;
}

/* ────────────────────── 경쟁 후보와 오해 사본 ────────────────────── */

/**
 * 누적과 제곱의 **앞뒤 순서**를 바꾼 사본. 두 줄의 자리를 맞바꾼 것이라 `loadMutant`
 * (한 줄 치환)로는 만들 수 없어 여기 따로 적는다.
 */
function squareFirst(n: bigint): bigint {
  let acc: Mat = IDENTITY;
  let step: Mat = TRANSITION;
  let e = n;
  while (e > 0n) {
    step = multiply(step, step);
    if ((e & 1n) === 1n) acc = multiply(acc, step);
    e >>= 1n;
  }
  return acc[0][1];
}

/** 누적할 때 **좌우**를 바꾼 사본. 곱하는 두 행렬의 자리만 바꾼 것이다. */
function rightToLeft(n: bigint): bigint {
  let acc: Mat = IDENTITY;
  let step: Mat = TRANSITION;
  let e = n;
  while (e > 0n) {
    if ((e & 1n) === 1n) acc = multiply(step, acc);
    step = multiply(step, step);
    e >>= 1n;
  }
  return acc[0][1];
}

/** 첫 누적을 곱셈 대신 대입으로 처리하는 사본 — NumPy 의 `matrix_power` 가 쓰는 모양이다. */
function assignFirst(n: bigint): { value: bigint; matMuls: number } {
  let acc: Mat | null = null;
  let step: Mat = TRANSITION;
  let e = n;
  let muls = 0;
  while (e > 0n) {
    if ((e & 1n) === 1n) {
      if (acc === null) acc = step;
      else {
        acc = multiply(acc, step);
        muls++;
      }
    }
    step = multiply(step, step);
    muls++;
    e >>= 1n;
  }
  return { value: (acc ?? IDENTITY)[0][1], matMuls: muls };
}

/** 크기 `k` 정사각 행렬의 거듭제곱. 스칼라 곱셈 횟수를 함께 센다. */
function powerK(
  M: bigint[][],
  n: number,
  k: number,
): { top: bigint; mults: number } {
  let mults = 0;
  const mm = (A: bigint[][], B: bigint[][]): bigint[][] => {
    const C: bigint[][] = Array.from({ length: k }, () =>
      Array.from({ length: k }, () => 0n),
    );
    for (let i = 0; i < k; i++)
      for (let j = 0; j < k; j++) {
        let s = 0n;
        for (let t = 0; t < k; t++) {
          s += (A[i]?.[t] ?? 0n) * (B[t]?.[j] ?? 0n);
          mults++;
        }
        (C[i] as bigint[])[j] = s;
      }
    return C;
  };
  let acc: bigint[][] = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => (i === j ? 1n : 0n)),
  );
  let step = M;
  let e = n;
  while (e > 0) {
    if ((e & 1) === 1) acc = mm(acc, step);
    step = mm(step, step);
    e >>= 1;
  }
  return { top: acc[0]?.[1] ?? 0n, mults };
}

/** 임의의 선형 점화식의 동반 행렬. 첫 줄이 계수이고 그 아래가 한 칸씩 밀린 단위행렬이다. */
function companion(coeffs: bigint[]): bigint[][] {
  const k = coeffs.length;
  return Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) =>
      i === 0 ? (coeffs[j] ?? 0n) : i - 1 === j ? 1n : 0n,
    ),
  );
}

/** 동반 행렬을 실제로 거듭제곱해 `v_n` 을 낸다. 상태 벡터는 `(v_{k-1}, …, v_0)` 다. */
function byCompanion(coeffs: bigint[], seed: bigint[], n: number): bigint {
  const k = coeffs.length;
  if (n < k) return seed[n] ?? 0n;
  const C = companion(coeffs);
  let acc: bigint[][] = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => (i === j ? 1n : 0n)),
  );
  const mm = (A: bigint[][], B: bigint[][]): bigint[][] =>
    Array.from({ length: k }, (_, i) =>
      Array.from({ length: k }, (_, j) => {
        let t = 0n;
        for (let x = 0; x < k; x++) t += (A[i]?.[x] ?? 0n) * (B[x]?.[j] ?? 0n);
        return t;
      }),
    );
  let step = C;
  let e = n - k + 1;
  while (e > 0) {
    if ((e & 1) === 1) acc = mm(acc, step);
    step = mm(step, step);
    e >>= 1;
  }
  let out = 0n;
  for (let j = 0; j < k; j++)
    out += (acc[0]?.[j] ?? 0n) * (seed[k - 1 - j] ?? 0n);
  return out;
}

/** 동반 행렬을 쓰지 않고 정의대로 `k` 항 점화식을 굴린 값 — 대조의 기준이다. */
function byDefinition(coeffs: bigint[], seed: bigint[], n: number): bigint {
  const k = coeffs.length;
  const v = [...seed];
  for (let i = k; i <= n; i++) {
    let s = 0n;
    for (let j = 0; j < k; j++) s += (coeffs[j] ?? 0n) * (v[i - 1 - j] ?? 0n);
    v.push(s);
  }
  return v[n] ?? 0n;
}

/* ────────────────────── 자릿수 — 고정소수점 로그 ────────────────────── */

/**
 * `F(n)` 의 십진 자릿수를 식으로 낸다. `bigint` 고정소수점이라 `number` 의 유효자리
 * 열여섯을 넘는 `n` 에서도 값이 어긋나지 않는다 — 제약 상한 `10^18` 이 그 자리다.
 */
const SCALE = 10n ** 60n;

function isqrt(x: bigint): bigint {
  if (x < 2n) return x;
  let a = x;
  let b = (a + 1n) / 2n;
  while (b < a) {
    a = b;
    b = (a + x / a) / 2n;
  }
  return a;
}

/** `atanh(p/q) * SCALE`. 급수 `Σ x^(2k+1)/(2k+1)` 을 항이 0 이 될 때까지 더한다. */
function atanh(pScaled: bigint, qScaled: bigint): bigint {
  let term = (pScaled * SCALE) / qScaled;
  let acc = term;
  let k = 1n;
  while (term !== 0n) {
    term = (((term * pScaled) / qScaled) * pScaled) / qScaled;
    acc += term / (2n * k + 1n);
    k++;
  }
  return acc;
}

const SQRT5 = isqrt(5n * SCALE * SCALE);
const PHI_SCALED = (SCALE + SQRT5) / 2n;
const LN2 = 2n * atanh(SCALE, 3n * SCALE);
const LN10 = 3n * LN2 + 2n * atanh(SCALE, 9n * SCALE);
const LN_PHI = 2n * atanh(SQRT5 - SCALE, SQRT5 + 3n * SCALE);
const LOG10_PHI = (LN_PHI * SCALE) / LN10;
const HALF_LOG10_5 = (SCALE - (LN2 * SCALE) / LN10) / 2n;
const LOG2_PHI = (LN_PHI * SCALE) / LN2;

/** 소수 `d` 자리까지의 문자열. 반올림 없이 자르고 부호를 앞에 둔다. */
function fixed(scaled: bigint, d: number): string {
  const sign = scaled < 0n ? "-" : "";
  const abs = scaled < 0n ? -scaled : scaled;
  const whole = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(60, "0").slice(0, d);
  return `${sign}${whole}.${frac}`;
}

/** `n ≥ 2` 에서 `F(n)` 의 십진 자릿수. */
function fibDigits(n: bigint): bigint {
  const t = n * LOG10_PHI - HALF_LOG10_5;
  const floor = t >= 0n ? t / SCALE : -((-t + SCALE - 1n) / SCALE);
  return floor + 1n;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { matrixPowerFibonacci: (n: bigint) => bigint };
const REF = new URL("./matrixPowerFibonacci-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 누적 행렬의 시작값을 단위행렬 대신 전이 행렬로 두는 변이.
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const startFromM = await loadMutant<Impl>(REF, {
  swap: [/let acc: Mat = IDENTITY;/, "let acc: Mat = TRANSITION;"],
});

/* ────────────────────────── 증명 블록 ────────────────────────── */

const SMALL_N = [0, 1, 2, 3, 4, 5, 6, 10];

export const PROOFS: Record<string, () => string> = {
  /** `concept` — M 의 거듭제곱이 어떤 값을 담는가. */
  conceptIdentity: () => {
    const rows = SMALL_N.map((k) => {
      const P = power(k);
      return [
        num(k),
        show(P),
        `${P[0][1]}`,
        `${matrixPowerFibonacci(BigInt(k))}`,
        `${byAddition(k)}`,
      ];
    });
    return [
      table(
        ["n", "M^n", "오른쪽 위 칸", "정본이 낸 답", "한 걸음씩 더한 답"],
        rows,
        ["r", "l", "r", "r", "r"],
      ),
      "",
      "└ 셋째 열과 넷째 열과 다섯째 열이 여덟 줄 모두 같다. n = 0 줄의 M^0 은 단위행렬이고",
      "  그 오른쪽 위 칸이 0 이라 F(0) = 0 과 맞는다",
    ].join("\n");
  },

  /** `deep.build` ② — 한 걸음씩 더하는 방법을 제약 규모에서 반박한다. */
  costNaive: () => {
    const scales = [10n, 1_000n, 1_000_000n, 1_000_000_000n, LIMIT];
    const rows = scales.map((n) => [
      num(n),
      num(n),
      `${(Number(n) / Number(PER_SECOND)).toLocaleString("en-US", {
        maximumFractionDigits: 8,
      })} 초`,
    ]);
    const seconds = LIMIT / PER_SECOND;
    return [
      table(["구하려는 항 n", "덧셈 횟수", "초당 1 억 번이면"], rows, [
        "r",
        "r",
        "r",
      ]),
      "",
      `마지막 줄의 ${num(seconds)} 초는 약 ${num(seconds / YEAR_SECONDS)} 년이다`,
      "└ 제약이 n = 10^18 을 허용하므로 한 걸음씩 더하는 방법은 후보가 아니다",
    ].join("\n");
  },

  /** `deep.build` ③ — 자리 행렬을 이어받아 M^10 을 만든다. */
  buildChain: () => {
    const rows: string[][] = [];
    let acc: Mat = IDENTITY;
    let step: Mat = TRANSITION;
    let e = WALK_N;
    let place = 0;
    let muls = 0;
    while (e > 0n) {
      const bit = e & 1n;
      const before = show(step);
      if (bit === 1n) {
        acc = multiply(acc, step);
        muls++;
      }
      step = multiply(step, step);
      muls++;
      e >>= 1n;
      rows.push([
        num(place),
        `${bit}`,
        `2^${place} = ${1 << place}`,
        before,
        bit === 1n ? "곱한다" : "건너뛴다",
        show(acc),
        num(muls),
      ]);
      place++;
    }
    return [
      table(
        [
          "비트 자리",
          "비트",
          "그 자리의 걸음 수",
          "자리 행렬",
          "누적",
          "누적 행렬",
          "행렬 곱",
        ],
        rows,
        ["r", "r", "r", "l", "l", "l", "r"],
      ),
      "",
      `└ 켜진 자리 둘의 걸음 수 2 와 8 을 더하면 ${WALK_N} 이고, 마지막 줄의 누적 행렬이 M^${WALK_N} 이다.`,
      `  오른쪽 위 칸은 ${matrixPowerFibonacci(WALK_N)} 이고 행렬 곱은 ${matMuls(WALK_N)} 번이다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 두 방식의 기본 연산을 나란히 세고 뒤집히는 자리를 낸다. */
  costTwoWays: () => {
    const scales = [10n, 100n, 127n, 128n, 159n, 160n, 1_000_000n, LIMIT];
    const rows = scales.map((n) => [
      num(n),
      num(n),
      num(matrixOps(n)),
      `${bitLength(n)}`,
      `${oneBits(n)}`,
      matrixOps(n) < Number(n) ? "행렬" : "한 걸음씩",
    ]);
    // 뒤집히는 자리를 스윕으로 찾는다 — 처음 뒤집히는 n 과 마지막으로 되돌아가는 n 둘 다.
    let first = -1;
    let last = -1;
    for (let n = 1; n <= 100_000; n++) {
      const better = matrixOps(BigInt(n)) < n;
      if (better && first < 0) first = n;
      if (!better) last = n;
    }
    return [
      table(
        [
          "n",
          "한 걸음씩 더한다",
          "행렬로 접는다",
          "비트 수",
          "1 인 비트",
          "어느 쪽이 적은가",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      `처음으로 행렬 쪽이 적어지는 n 은 ${num(first)} 이고, 그 뒤로도 아홉 자리에서 되돌아간다.`,
      `n = ${num(last)} 이 마지막으로 되돌아간 자리이고 ${num(last + 1)} 부터는 늘 행렬 쪽이 적다`,
      "└ 셋째 열은 n 의 크기가 아니라 넷째 열과 다섯째 열의 합을 따라간다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 가장 단순한 후보(칸마다 거듭제곱)를 값으로 반박한다. */
  candidateElementwise: () => {
    const rows = [2, 3, 5, 10].map((k) => {
      const P = power(k);
      const cell = [
        `${TRANSITION[0][0] ** BigInt(k)}`,
        `${TRANSITION[0][1] ** BigInt(k)}`,
        `${TRANSITION[1][0] ** BigInt(k)}`,
        `${TRANSITION[1][1] ** BigInt(k)}`,
      ];
      return [
        num(k),
        `[[${cell[0]},${cell[1]}],[${cell[2]},${cell[3]}]]`,
        `${cell[1]}`,
        show(P),
        `${P[0][1]}`,
        cell[1] === `${P[0][1]}` ? "같다" : "다르다",
      ];
    });
    return [
      table(
        [
          "n",
          "칸마다 n 제곱한 값",
          "그 오른쪽 위",
          "행렬을 n 제곱한 값",
          "그 오른쪽 위",
          "판정",
        ],
        rows,
        ["r", "l", "r", "l", "r", "l"],
      ),
      "",
      "└ 칸마다 거듭제곱하면 1 과 0 은 몇 제곱을 해도 1 과 0 이라 행렬이 M 그대로다.",
      "  네 줄 모두 답과 갈리고, n 이 커져도 왼쪽 값은 안 움직인다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 상태를 몇 개 들 것인가를 값으로 정한다. */
  stateSize: () => {
    const ratios = [2, 3, 4, 5, 6, 7, 8].map((k) => [
      num(k),
      `${byAddition(k)}`,
      `${byAddition(k - 1)}`,
      (Number(byAddition(k)) / Number(byAddition(k - 1))).toFixed(6),
    ]);
    const sizes = [10, 20, 100].map((n) => {
      const two = powerK(
        [
          [1n, 1n],
          [1n, 0n],
        ],
        n,
        2,
      );
      const three = powerK(
        [
          [1n, 1n, 0n],
          [1n, 0n, 0n],
          [0n, 1n, 0n],
        ],
        n,
        3,
      );
      return [
        num(n),
        `${two.top}`,
        num(two.mults),
        `${three.top}`,
        num(three.mults),
        (three.mults / two.mults).toFixed(3),
      ];
    });
    return [
      "상태를 하나만 들면 — F(n) 이 F(n-1) 의 몇 배인가",
      table(["n", "F(n)", "F(n-1)", "배수"], ratios, ["r", "r", "r", "r"]),
      "",
      "상태를 둘 또는 셋 들면 — 같은 답에 드는 스칼라 곱셈",
      table(
        ["n", "2×2 의 답", "2×2 곱셈", "3×3 의 답", "3×3 곱셈", "배수"],
        sizes,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 위 표의 배수가 줄마다 달라서 상태 하나로는 점화식을 담을 상수가 없다.",
      "  아래 표는 답이 세 줄 모두 같은데 곱셈만 3.375 배다 — 27 을 8 로 나눈 값이다",
    ].join("\n");
  },

  /** `deep.walk` — 걸음마다의 상태값. */
  walkTrace: () => {
    const rows: string[][] = [];
    let acc: Mat = IDENTITY;
    let step: Mat = TRANSITION;
    let e = WALK_N;
    let muls = 0;
    let t = 1;
    let place = 0;
    rows.push([
      `T${t++}`,
      "① 초기화",
      "—",
      "—",
      show(acc),
      show(step),
      `${e} (${e.toString(2)})`,
      num(muls),
    ]);
    while (e > 0n) {
      const bit = e & 1n;
      if (bit === 1n) {
        acc = multiply(acc, step);
        muls++;
      }
      step = multiply(step, step);
      muls++;
      e >>= 1n;
      rows.push([
        `T${t++}`,
        bit === 1n ? "② 참 · ③④⑤" : "② 참 · ④⑤",
        `${bit}`,
        num(place),
        show(acc),
        show(step),
        `${e} (${e.toString(2)})`,
        num(muls),
      ]);
      place++;
    }
    rows.push([
      `T${t++}`,
      "② 거짓",
      "—",
      "—",
      show(acc),
      show(step),
      `${e} (${e.toString(2)})`,
      num(muls),
    ]);
    rows.push([
      `T${t++}`,
      "⑥ 반환",
      "—",
      "—",
      show(acc),
      "—",
      `${e} (${e.toString(2)})`,
      num(muls),
    ]);
    return [
      table(
        [
          "걸음",
          "갈래",
          "이번 비트",
          "비트 자리",
          "acc",
          "step",
          "e",
          "행렬 곱",
        ],
        rows,
        ["l", "l", "r", "r", "l", "l", "r", "r"],
      ),
      "",
      `└ 답은 마지막 줄 acc 의 오른쪽 위 칸 ${matrixPowerFibonacci(WALK_N)} 이다.`,
      "  acc 는 비트가 1 인 바퀴에서만 바뀌고 step 은 바퀴마다 바뀐다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 좌우 순서와 앞뒤 순서는 다른 것이다. */
  pauseOrder: () => {
    const rows = [0n, 1n, 2n, 3n, 5n, WALK_N, 13n, 20n].map((n) => {
      const right = matrixPowerFibonacci(n);
      const lr = rightToLeft(n);
      const sf = squareFirst(n);
      return [
        num(n),
        `${right}`,
        `${lr}`,
        lr === right ? "같다" : "다르다",
        `${sf}`,
        sf === right ? "같다" : "다르다",
        `${byAddition(Number(n) * 2)}`,
      ];
    });
    return [
      table(
        [
          "n",
          "정본이 낸 답",
          "좌우를 바꾼 값",
          "판정",
          "앞뒤를 바꾼 값",
          "판정",
          "F(2n)",
        ],
        rows,
        ["r", "r", "r", "l", "r", "l", "r"],
      ),
      "",
      "└ 셋째 열은 여덟 줄 모두 답과 같고 다섯째 열은 n 이 2 이상인 여섯 줄에서 갈린다.",
      "  다섯째 열과 마지막 열이 여덟 줄 모두 같다 — 앞뒤를 바꾸면 F(2n) 이 나온다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 곱셈 횟수와 실제 일감은 다른 값이다. */
  pauseCost: () => {
    const scales = [1_000n, 10_000n, 100_000n, 1_000_000n];
    const rows = scales.map((n) => {
      const w = weighed(n);
      return [num(n), num(w.mults), num(digits(w.value)), num(w.digitWork)];
    });
    const small = weighed(1_000n);
    const big = weighed(1_000_000n);
    return [
      table(
        ["n", "스칼라 곱셈 횟수", "F(n) 의 자릿수", "자릿수 곱의 합"],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `n 이 1,000 배가 되는 동안 둘째 열은 ${(big.mults / small.mults).toFixed(2)} 배가 되는데`,
      `넷째 열은 ${num(Math.round(big.digitWork / small.digitWork))} 배가 된다`,
      "└ 곱셈 한 번의 일감이 두 값의 자릿수 곱에 비례하고, 그 자릿수가 n 에 비례한다.",
      "  그래서 곱셈 횟수는 로그로 늘고 일감은 그보다 훨씬 빨리 늘어난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 제약 상한에서 답 자체를 담을 수 없다. */
  pauseLimit: () => {
    const d = fibDigits(LIMIT);
    const bits = (LIMIT * LOG2_PHI) / SCALE;
    const bytes = bits / 8n;
    const memory = 256n * 1024n * 1024n;
    const rows = [
      ["구하려는 항", num(LIMIT)],
      ["행렬 곱 횟수", `${num(matMuls(LIMIT))} 번`],
      ["스칼라 곱셈 횟수", `${num(8 * matMuls(LIMIT))} 번`],
      ["F(n) 의 십진 자릿수", `${num(d)} 자리`],
      ["같은 값의 이진 자릿수", `약 ${num(bits)} 비트`],
      ["그 값을 담는 데 드는 바이트", `약 ${num(bytes)} 바이트`],
      ["메모리 제한", `${num(memory)} 바이트`],
      ["몇 배인가", `약 ${num(bytes / memory)} 배`],
    ];
    return [
      table(["무엇", "값"], rows, ["l", "r"]),
      "",
      "└ 행렬 곱은 84 번뿐인데 답 하나가 메모리 제한의 3 억 배가 넘는다.",
      "  이 절차의 문제가 아니라 출력 크기의 문제라 어떤 절차로도 그 값은 못 내놓는다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 어느 칸을 읽어야 하는가. */
  pauseCell: () => {
    const rows = [0, 1, 2, 3, 4, 5, 10].map((k) => {
      const P = power(k);
      const right = matrixPowerFibonacci(BigInt(k));
      return [
        num(k),
        `${P[0][0]}`,
        `${P[0][1]}`,
        `${P[1][1]}`,
        `${right}`,
        P[0][0] === right ? "같다" : "다르다",
      ];
    });
    return [
      table(
        [
          "n",
          "좌상 칸",
          "우상 칸",
          "우하 칸",
          "정본이 낸 답",
          "좌상 칸의 판정",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      "└ n = 1 줄만 좌상 칸이 답과 같다. 거기서 F(2) 와 F(1) 이 둘 다 1 이기 때문이고,",
      "  나머지 여섯 줄에서는 좌상 칸이 한 항 앞선 값이다",
    ].join("\n");
  },

  /** `related` — 동반 행렬은 계수만 바꾸면 다른 점화식이 된다. */
  relatedCompanion: () => {
    const cases: { name: string; coeffs: bigint[]; seed: bigint[] }[] = [
      { name: "피보나치", coeffs: [1n, 1n], seed: [0n, 1n] },
      { name: "루카스", coeffs: [1n, 1n], seed: [2n, 1n] },
      { name: "펠", coeffs: [2n, 1n], seed: [0n, 1n] },
      { name: "트리보나치", coeffs: [1n, 1n, 1n], seed: [0n, 0n, 1n] },
    ];
    const rows = cases.map((c) => {
      const k = c.coeffs.length;
      const M = companion(c.coeffs);
      const head = M[0] ?? [];
      const want = byDefinition(c.coeffs, c.seed, 10);
      const got = byCompanion(c.coeffs, c.seed, 10);
      const { mults } = powerK(M, 10, k);
      return [
        c.name,
        `${k}×${k}`,
        `[${head.join(",")}]`,
        `${want}`,
        `${got}`,
        got === want ? "같다" : "다르다",
        num(mults),
      ];
    });
    return [
      table(
        [
          "점화식",
          "동반 행렬 크기",
          "첫 줄(계수)",
          "정의로 센 v(10)",
          "동반 행렬이 낸 값",
          "판정",
          "스칼라 곱셈",
        ],
        rows,
        ["l", "r", "l", "r", "r", "l", "r"],
      ),
      "",
      "└ 넷째 열과 다섯째 열이 네 줄 모두 같다. 갈리는 것은 첫 줄의 계수와 행렬 크기뿐이고,",
      "  크기가 k 면 행렬 곱 한 번의 스칼라 곱셈이 k^3 이라 마지막 열이 8 과 27 의 배수로 갈린다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 값에 넣어 검산한다. */
  mathCheck: () => {
    const rows = [1, 2, 5, 10, 20].map((k) => {
      const P = power(k);
      return [
        num(k),
        `${P[0][0]}`,
        `${byAddition(k + 1)}`,
        `${P[0][1]}`,
        `${byAddition(k)}`,
        `${P[0][0] * P[1][1] - P[0][1] * P[1][0]}`,
        `${(-1n) ** BigInt(k)}`,
      ];
    });
    return [
      [
        `φ = ${fixed(PHI_SCALED, 15)}`,
        `ψ = 1 - φ = ${fixed(SCALE - PHI_SCALED, 15)}`,
        `√5 = ${fixed(SQRT5, 15)}`,
        `φ 는 x^2 = x + 1 의 두 근 중 큰 것이고, ψ 는 작은 것이다`,
      ].join("\n"),
      "",
      table(
        ["n", "좌상 칸", "F(n+1)", "우상 칸", "F(n)", "행렬식", "(-1)^n"],
        rows,
        ["r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 둘째 열과 셋째 열이 같고 넷째 열과 다섯째 열이 같다.",
      "  여섯째 열과 일곱째 열도 다섯 줄 모두 같아서 det(M^n) = (-1)^n 이 확인된다",
    ].join("\n");
  },

  /** `deep.math` ③④ — 자릿수 식을 실측과 맞추고 제약 규모의 값을 낸다. */
  mathDigits: () => {
    const checks = [2, 10, 50, 100, 500, 1000].map((k) => [
      num(k),
      num(digits(byAddition(k))),
      num(fibDigits(BigInt(k))),
      digits(byAddition(k)) === Number(fibDigits(BigInt(k)))
        ? "같다"
        : "다르다",
    ]);
    let mismatch = 0;
    let a = 0n;
    let b = 1n;
    for (let k = 1; k <= 2000; k++) {
      const t = a + b;
      a = b;
      b = t;
      if (k >= 2 && BigInt(digits(a)) !== fibDigits(BigInt(k))) mismatch++;
    }
    const scales = [1_000_000n, 1_000_000_000n, LIMIT].map((n) => [
      num(n),
      num(fibDigits(n)),
    ]);
    return [
      `log10 φ = ${fixed(LOG10_PHI, 18)}`,
      `½ log10 5 = ${fixed(HALF_LOG10_5, 18)}`,
      "",
      table(["n", "실측 자릿수", "식이 낸 자릿수", "판정"], checks, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `n = 2 부터 2,000 까지 전수 대조에서 어긋난 자리 ${num(mismatch)} 개`,
      "",
      table(["n", "F(n) 의 자릿수"], scales, ["r", "r"]),
      "",
      "└ 실측이 불가능한 규모에서도 식은 값을 낸다. 마지막 줄이 제약 상한이고,",
      "  그 자릿수는 이 글의 어떤 실행으로도 확인할 수 없다",
    ].join("\n");
  },

  /** `invariant` ② — 바퀴마다 두 행렬이 무엇의 거듭제곱인가. */
  invariantHold: () => {
    const rows: string[][] = [];
    let acc: Mat = IDENTITY;
    let step: Mat = TRANSITION;
    let e = WALK_N;
    let i = 0;
    while (true) {
      const low = Number(WALK_N & ((1n << BigInt(i)) - 1n));
      rows.push([
        num(i),
        show(acc),
        `M^${low}`,
        show(power(low)),
        show(acc) === show(power(low)) ? "맞다" : "틀리다",
        show(step),
        `M^${2 ** i}`,
        show(step) === show(power(2 ** i)) ? "맞다" : "틀리다",
      ]);
      if (e === 0n) break;
      if ((e & 1n) === 1n) acc = multiply(acc, step);
      step = multiply(step, step);
      e >>= 1n;
      i++;
    }
    return [
      table(
        [
          "바퀴 i",
          "acc",
          "불변식이 말하는 것",
          "그 값",
          "판정",
          "step",
          "불변식이 말하는 것",
          "판정",
        ],
        rows,
        ["r", "l", "l", "l", "l", "l", "l", "l"],
      ),
      "",
      "└ 다섯 줄 모두 맞다. 마지막 줄에서 아래 네 비트가 곧 n 자신이라 acc 가 M^10 이고,",
      "  그 오른쪽 위 칸이 답이다",
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  invariantEdges: () => {
    const cases: [string, bigint][] = [
      ["바퀴가 한 번도 실행되지 않는다", 0n],
      ["바퀴가 한 번뿐이다", 1n],
      ["첫 비트가 0 이다", 2n],
      ["비트가 전부 1 이다", 7n],
      ["전개 입력이다", WALK_N],
      ["비트가 하나뿐이다", 64n],
      ["부호 있는 64 비트에 담기는 마지막 항이다", 92n],
      ["항 번호가 세 자리다", 100n],
    ];
    const rows = cases.map(([label, n]) => [
      label,
      num(n),
      `${bitLength(n)}`,
      `${oneBits(n)}`,
      `${byAddition(Number(n))}`,
      `${matrixPowerFibonacci(n)}`,
      byAddition(Number(n)) === matrixPowerFibonacci(n) ? "같다" : "다르다",
    ]);
    return [
      table(
        [
          "경계",
          "n",
          "비트 수",
          "1 인 비트",
          "한 걸음씩 더한 답",
          "정본이 낸 답",
          "판정",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      "└ 여덟 줄 모두 같다. n = 0 줄은 바퀴에 들어가지 않아 단위행렬이 그대로 답을 낸다",
    ].join("\n");
  },

  /** `invariant` ③ — 시작값을 단위행렬에서 전이 행렬로 바꾼다. */
  mutantIdentity: () => {
    const rows = [0n, 1n, 2n, 3n, 5n, WALK_N, 20n, 100n].map((n) => {
      const right = matrixPowerFibonacci(n);
      const got = startFromM.matrixPowerFibonacci(n);
      return [
        num(n),
        `${right}`,
        `${got}`,
        `${byAddition(Number(n) + 1)}`,
        got === right ? "같다" : "다르다",
      ];
    });
    return [
      table(["n", "정본이 낸 답", "M 에서 시작한 값", "F(n+1)", "판정"], rows, [
        "r",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ n = 1 줄만 두 값이 같고 나머지 일곱 줄에서 갈린다. 셋째 열과 넷째 열이 여덟 줄",
      "  모두 같아서, 시작값을 한 걸음 앞으로 옮기면 답도 한 항 앞선 값이 된다",
    ].join("\n");
  },

  /** `perf.derive` — 걸음별로 곱셈과 덧셈을 센다. */
  perfCount: () => {
    const b = bitLength(WALK_N);
    const s = oneBits(WALK_N);
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "바퀴",
        `T2 부터 T${1 + b} 까지`,
        `${b}`,
        `${b + s}`,
        `${8 * (b + s)}`,
        `${4 * (b + s)}`,
      ],
      ["종료 검사", `T${2 + b}`, "1", "0", "0", "0"],
      ["반환", `T${3 + b}`, "1", "0", "0", "0"],
      ["합계", "", `${b + 3}`, `${b + s}`, `${8 * (b + s)}`, `${4 * (b + s)}`],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "행렬 곱",
          "스칼라 곱셈",
          "스칼라 덧셈",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 행렬 곱 ${b + s} 번은 비트 수 ${b} 와 1 인 비트 ${s} 의 합이다.`,
      "  행렬 곱 한 번이 스칼라 곱셈 8 번과 덧셈 4 번이라 마지막 두 열이 그 배수다",
    ].join("\n");
  },

  /** `perf.worst` — 두 축의 최악이 다른 입력에서 나온다. */
  worstShape: () => {
    const shapes: [string, bigint][] = [
      ["비트가 거의 다 1 이다 (2^19 + 2^18 - 1)", 786_431n],
      ["전개 규모의 십진 수 (10^6)", 1_000_000n],
      ["비트가 하나뿐이다 (2^19)", 524_288n],
    ];
    const rows = shapes.map(([label, n]) => {
      const w = weighed(n);
      return [
        label,
        num(n),
        `${bitLength(n)}`,
        `${oneBits(n)}`,
        num(matMuls(n)),
        num(w.mults),
        num(digits(w.value)),
        num(w.digitWork),
      ];
    });
    // 제약 상한 안에서 1 인 비트가 가장 많은 n 을 찾는다. 상한의 비트를 위에서부터 훑어
    // 1 인 자리 하나를 0 으로 내리고 그 아래를 전부 1 로 채운 후보들과 상한 자신을 견준다.
    const width60 = bitLength(LIMIT);
    let best = LIMIT;
    for (let bit = width60 - 1; bit >= 0; bit--) {
      if (((LIMIT >> BigInt(bit)) & 1n) !== 1n) continue;
      const high = (LIMIT >> BigInt(bit + 1)) << BigInt(bit + 1);
      const cand = high | ((1n << BigInt(bit)) - 1n);
      if (cand <= LIMIT && matMuls(cand) > matMuls(best)) best = cand;
    }
    const bestOnes = oneBits(best);
    return [
      table(
        [
          "입력의 모양",
          "n",
          "비트 수",
          "1 인 비트",
          "행렬 곱",
          "스칼라 곱셈",
          "F(n) 의 자릿수",
          "자릿수 곱의 합",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `제약 상한 ${num(LIMIT)} 안에서 행렬 곱이 가장 많은 n 은 ${num(best)} 이고`,
      `비트 ${bitLength(best)} 개 중 ${num(bestOnes)} 개가 1 이라 행렬 곱이 ${num(matMuls(best))} 번이다`,
      `상한 자신은 1 인 비트가 ${num(oneBits(LIMIT))} 개라 행렬 곱이 ${num(matMuls(LIMIT))} 번으로 더 적다`,
      "└ 첫 줄은 둘째 줄보다 n 이 작고 곱셈 횟수는 더 많은데 자릿수 곱은 더 적다.",
      "  두 열의 순서가 반대라 최악을 만드는 입력이 축마다 다르다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 이 런타임이 답을 낼 수 있는 가장 큰 n. */
  pauseRuntime: () => {
    const probe = (n: bigint): string => {
      try {
        const v = matrixPowerFibonacci(n);
        return `${num(digits(v))} 자리를 돌려준다`;
      } catch (error) {
        return `${error instanceof Error ? error.name : "오류"} 로 멈춘다`;
      }
    };
    const rows = [1_048_575n, 1_048_576n].map((n) => [
      num(n),
      `${bitLength(n)}`,
      num(matMuls(n)),
      probe(n),
    ]);
    return [
      table(["n", "비트 수", "행렬 곱", "이 런타임의 결과"], rows, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 두 줄의 행렬 곱은 40 과 22 로 아래 줄이 오히려 적은데, 아래 줄만 멈춘다.",
      "  마지막 제곱이 만드는 값의 자릿수가 이 런타임의 bigint 한계를 넘기 때문이다",
    ].join("\n");
  },

  /** `selfcheck` — 첫 누적을 대입으로 바꾸면 행렬 곱이 몇 번 주는가. */
  checkAssignFirst: () => {
    const rows = [WALK_N, 100n, 1_000n, LIMIT].map((n) => {
      const runnable = n <= 1_000n;
      const counted = runnable ? assignFirst(n).matMuls : matMuls(n) - 1;
      return [
        num(n),
        num(matMuls(n)),
        num(counted),
        num(matMuls(n) - counted),
        runnable
          ? assignFirst(n).value === matrixPowerFibonacci(n)
            ? "같다"
            : "다르다"
          : "실행 안 함",
      ];
    });
    return [
      table(
        ["n", "정본의 행렬 곱", "첫 누적을 대입으로", "차이", "답의 판정"],
        rows,
        ["r", "r", "r", "r", "l"],
      ),
      "",
      "└ 넷째 열이 네 줄 모두 1 이다. n 이 얼마든 아끼는 것은 행렬 곱 한 번이고,",
      "  마지막 줄은 답을 담을 수 없는 규모라 횟수만 세었다",
    ].join("\n");
  },
};
