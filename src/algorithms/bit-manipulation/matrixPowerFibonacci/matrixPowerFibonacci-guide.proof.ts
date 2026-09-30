/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바퀴마다의 `e` · `acc` · `step` 은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 * **큰 입력은 값만 센다.** 걸음마다 행렬을 베껴 두는 기록(`trace`)은 전개 입력처럼 작은 `n` 에만 쓴다.
 * 행렬 곱 횟수는 비트 모양에서 세고(`matMuls`), 큰 `n` 의 답은 정본을 한 번 불러 자릿수만 본다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를 } from "../../../../tools/josa.ts";
import {
  bin,
  bitLength,
  bitsLow,
  byAddition,
  elementwise,
  LIMIT,
  matMuls,
  matrixOps,
  num,
  oneBits,
  opsPerMatMul,
  PER_SECOND,
  pow,
  repeatedMatrix,
  show,
  WALK_N,
  walk,
} from "./matrixPowerFibonacci-guide.fig.tsx";
import {
  IDENTITY,
  type Mat,
  matrixPowerFibonacci,
  multiply,
  TRANSITION,
} from "./matrixPowerFibonacci-guide.ref.ts";

const REF = new URL("./matrixPowerFibonacci-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

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

/** 고정폭 화면의 폭. 한글·한자는 두 칸이다. */
const widthOf = (t: string): number =>
  [...t].reduce((n, c) => n + (/[ᄀ-ᇿ⺀-꓏가-힣豈-﫿＀-｠]/.test(c) ? 2 : 1), 0);

/**
 * 글자 블록의 열 — 칸마다 가장 긴 폭에 맞추고 칸 사이를 공백 세 칸으로 가른다. 폭을 값에서 재야 값이
 * 바뀌어도 열이 맞는다(P15). 칸 안에는 공백을 두 칸 이상 연달아 쓰지 않는다.
 */
function grid(rows: string[][], indent = "  "): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => widthOf(r[c] ?? ""))),
  );
  return rows.map(
    (r) =>
      indent +
      r
        .map((cell, c) =>
          c === r.length - 1
            ? cell
            : cell + " ".repeat((w[c] ?? 0) - widthOf(cell) + 3),
        )
        .join(""),
  );
}

/** 1 년을 초로 센 값 — 365 일 기준. */
const YEAR_SECONDS = 31_536_000n;

/** `number` 가 정수를 정확히 담는 한계. */
const TWO53 = 2n ** 53n;

/** 실제로 실행하는 가장 큰 규모 — 답이 이 런타임의 bigint 에 담기는 자리다. */
const EXEC_N = 1_000_000n;

/* ────────────────────────── 계측기 ────────────────────────── */

/** `M` 의 `k` 제곱을 정본의 `multiply` 로 한 번씩 곱해 만든다 — 정의대로 구한 값. */
function powerByRepeat(k: bigint): Mat {
  let P: Mat = IDENTITY;
  for (let j = 0n; j < k; j++) P = multiply(P, TRANSITION);
  return P;
}

/** 두 행렬이 칸마다 같은가. */
const same = (A: Mat, B: Mat): boolean => show(A) === show(B);

/** 한 걸음씩 더한 `F(k)` — 작은 `k` 에서 정의의 값이다. */
const F = (k: bigint | number): bigint => byAddition(BigInt(k)).value;

/** 십진 자릿수. */
const digits = (x: bigint): number => (x < 0n ? -x : x).toString().length;

/** 연산 한 번의 셈 — 곱셈과 덧셈의 합. */
const PER = (): number => opsPerMatMul().mul + opsPerMatMul().add;

/* ────────────────────── 비교에 쓰는 사본 ────────────────────── */

/**
 * 누적과 제곱의 **앞뒤 순서**를 바꾼 사본. 두 줄의 자리를 맞바꾼 것이라 `loadMutant`
 * (한 줄 치환)로는 만들 수 없어 여기 따로 적는다. 바퀴마다 누적에 쓴 행렬의 걸음 수도 돌려준다.
 */
function squareFirst(n: bigint): { value: bigint; used: bigint[] } {
  let acc: Mat = IDENTITY;
  let step: Mat = TRANSITION;
  let stepPow = 1n;
  let e = n;
  const used: bigint[] = [];
  while (e > 0n) {
    step = multiply(step, step);
    stepPow *= 2n;
    used.push(stepPow);
    if ((e & 1n) === 1n) acc = multiply(acc, step);
    e >>= 1n;
  }
  return { value: acc[0][1], used };
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

/** 왼쪽 위 칸을 돌려주는 사본 — 반환 줄의 칸 하나만 바꿨다. */
function topLeftInstead(n: bigint): bigint {
  let acc: Mat = IDENTITY;
  let step: Mat = TRANSITION;
  let e = n;
  while (e > 0n) {
    if ((e & 1n) === 1n) acc = multiply(acc, step);
    step = multiply(step, step);
    e >>= 1n;
  }
  return acc[0][0];
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

/** 첫 누적을 대입으로 바꾸면 줄어드는 행렬 곱 수 — 값만 세는 가벼운 판. 켜진 비트가 있으면 1 이다. */
const assignFirstMuls = (n: bigint): number =>
  matMuls(n) - (oneBits(n) > 0 ? 1 : 0);

/**
 * **정본을 `number` 로 옮긴 사본.** 절차는 정본과 같고 칸만 `number` 다. `>>` 는 `number` 에서
 * 32 비트로 잘리므로 2 로 나눈 몫을 쓴다.
 */
type NMat = [[number, number], [number, number]];
const nmul = (A: NMat, B: NMat): NMat => [
  [
    A[0][0] * B[0][0] + A[0][1] * B[1][0],
    A[0][0] * B[0][1] + A[0][1] * B[1][1],
  ],
  [
    A[1][0] * B[0][0] + A[1][1] * B[1][0],
    A[1][0] * B[0][1] + A[1][1] * B[1][1],
  ],
];
function numberPort(n: number): number {
  let acc: NMat = [
    [1, 0],
    [0, 1],
  ];
  let step: NMat = [
    [1, 1],
    [1, 0],
  ];
  let e = n;
  while (e > 0) {
    if (e % 2 === 1) acc = nmul(acc, step);
    step = nmul(step, step);
    e = Math.floor(e / 2);
  }
  return acc[0][1];
}

/**
 * 행렬 없이 두 항을 한꺼번에 두 배로 옮기는 식(`F(2k) = F(k)·(2F(k+1) − F(k))`,
 * `F(2k+1) = F(k)^2 + F(k+1)^2`)으로 `F(n)` 을 낸다. 정본과 **다른 경로**의 답이라, 정본이
 * 멈추는 자리에서 답 자체가 담기는지를 이것으로 본다. 마지막에 만드는 값이 `F(n+1)` 까지다.
 */
function byDoubling(n: bigint): bigint {
  let a = 0n; // F(k)
  let b = 1n; // F(k+1)
  for (let i = bitLength(n) - 1; i >= 0; i--) {
    const c = a * (2n * b - a);
    const d = a * a + b * b;
    if (((n >> BigInt(i)) & 1n) === 1n) {
      a = d;
      b = c + d;
    } else {
      a = c;
      b = d;
    }
  }
  return a;
}

/** 크기 `k` 정사각 행렬의 거듭제곱. 칸 연산(곱셈 + 덧셈) 횟수를 함께 센다. */
function powerK(
  M: bigint[][],
  n: number,
  k: number,
): { top: bigint; ops: number } {
  let ops = 0;
  const mm = (A: bigint[][], B: bigint[][]): bigint[][] =>
    Array.from({ length: k }, (_, i) =>
      Array.from({ length: k }, (_, j) => {
        let s = (A[i]?.[0] ?? 0n) * (B[0]?.[j] ?? 0n);
        ops++;
        for (let t = 1; t < k; t++) {
          s += (A[i]?.[t] ?? 0n) * (B[t]?.[j] ?? 0n);
          ops += 2;
        }
        return s;
      }),
    );
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
  return { top: acc[0]?.[1] ?? 0n, ops };
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

/** 동반 행렬을 실제로 거듭제곱해 `v(n)` 을 낸다. 상태 벡터는 `(v(k-1), …, v(0))` 이다. */
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

/**
 * 제약 안에서 **행렬 곱이 가장 많은 n** 을 구성한다. `b + s` 를 최대로 하는 것이므로 1 인 비트를
 * 최대한 세운다 — 상한의 어떤 1 비트를 내리고 그 아래를 전부 세운 후보들과 상한 자신 중에서 고른다.
 */
function mostOneBitsAtMost(limit: bigint): bigint {
  let best = limit;
  let bestScore = matMuls(limit);
  for (let i = 0; i < bitLength(limit); i++) {
    const bit = 1n << BigInt(i);
    if ((limit & bit) === 0n) continue;
    const candidate = (limit & ~((bit << 1n) - 1n)) | (bit - 1n);
    const score = matMuls(candidate);
    if (score > bestScore || (score === bestScore && candidate > best)) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/* ────────────────────── 자릿수 — 고정소수점 로그 ────────────────────── */

/**
 * `F(n)` 의 십진 자릿수를 식으로 낸다. `bigint` 고정소수점이라 `number` 의 유효자리
 * 열여섯을 넘는 `n` 에서도 값이 어긋나지 않는다 — 과제 상한 `10^18` 이 그 자리다.
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

/**
 * 누적 행렬의 시작값을 단위행렬 대신 전이 행렬로 두는 변이 — 불변식 `acc · step^e = M^n` 이 출발점에서
 * 서게 하던 바로 그 줄이다. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면
 * `loadMutant` 가 던진다.
 */
const startFromM = await loadMutant<Impl>(REF, {
  swap: [/let acc: Mat = IDENTITY;/, "let acc: Mat = TRANSITION;"],
});

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 과제를 값으로. */
  conceptTask: () => {
    const seq = Array.from({ length: Number(WALK_N) + 1 }, (_, k) =>
      String(F(k)),
    );
    const got = matrixPowerFibonacci(WALK_N);
    if (got !== F(WALK_N)) throw new Error("정의와 정본이 다르다");
    return [
      `matrixPowerFibonacci(${WALK_N}n)`,
      `  수열   F(0) … F(${WALK_N}) = ${seq.join(" ")}`,
      `  답     F(${WALK_N}) = ${got}`,
    ].join("\n");
  },

  /** `concept` — 한 걸음의 계수와 그것을 담은 행렬. */
  conceptStep: () => {
    const M = TRANSITION;
    const k = 4;
    const a = F(k);
    const b = F(k - 1);
    const next: [bigint, bigint] = [
      M[0][0] * a + M[0][1] * b,
      M[1][0] * a + M[1][1] * b,
    ];
    if (next[0] !== F(k + 1) || next[1] !== F(k))
      throw new Error("한 걸음이 정의와 다르다");
    return [
      "한 걸음 — (F(k), F(k-1)) 에서 (F(k+1), F(k)) 로",
      ...grid([
        ["다음 항", `F(k+1) = ${M[0][0]}·F(k) + ${M[0][1]}·F(k-1)`],
        ["그 앞 항", `F(k) = ${M[1][0]}·F(k) + ${M[1][1]}·F(k-1)`],
        ["전이 행렬", `M = ${show(M)}`],
        [
          `k = ${k} 에서`,
          `(${a}, ${b}) → (${M[0][0]}·${a} + ${M[0][1]}·${b}, ${M[1][0]}·${a} + ${M[1][1]}·${b}) = (${next[0]}, ${next[1]})`,
        ],
      ]),
    ].join("\n");
  },

  /** `concept` — M 의 거듭제곱이 어떤 값을 담는가. */
  conceptIdentity: () => {
    const ks = [0n, 1n, 2n, 3n, 4n, 5n, WALK_N];
    const rows = ks.map((k) => {
      const P = powerByRepeat(k);
      return [String(k), show(P), `${P[0][1]}`, `${F(k)}`];
    });
    const hits = ks.filter((k) => powerByRepeat(k)[0][1] === F(k)).length;
    return [
      md(["n", "M^n", "오른쪽 위 칸", "한 걸음씩 더한 F(n)"], rows, [0, 2, 3]),
      "",
      `${ks.length} 줄 중 ${hits} 줄에서 M^n 의 오른쪽 위 칸이 F(n) 과 같습니다. M^0 은 단위행렬이고 그 오른쪽 위 칸이 0 이라 F(0) 과 맞습니다.`,
    ].join("\n");
  },

  /** `concept` — 두 방법의 연산 횟수를 결과만. */
  conceptCost: () => {
    const rows = [WALK_N, LIMIT].map((n) => [
      num(n),
      num(n),
      num(matrixOps(n)),
      String(matMuls(n)),
      String(bitLength(n)),
      String(oneBits(n)),
    ]);
    return [
      md(
        [
          "항 번호 n",
          "한 걸음씩 더하기의 연산",
          "행렬 거듭제곱의 연산",
          "행렬 곱",
          "비트 수",
          "1 인 비트 수",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `n = 10^18 에서 연산이 ${num(LIMIT)} 번에서 ${num(matrixOps(LIMIT))} 번으로 줄었고, 행렬 곱 ${matMuls(LIMIT)} 번은 비트 수 ${bitLength(LIMIT)}${과와(bitLength(LIMIT))} 1 인 비트 수 ${oneBits(LIMIT)}${을를(oneBits(LIMIT))} 더한 값입니다. n = ${WALK_N} 에서는 한 걸음씩 더하는 쪽이 적습니다.`,
    ].join("\n");
  },

  /** `deep.origin` — 비용의 기준. 행렬 곱 한 번이 칸에 하는 연산. */
  opsPerMatMul: () => {
    const o = opsPerMatMul();
    return [
      "multiply(A, B) 한 번이 칸에 하는 일",
      ...grid([
        ["곱셈", `${o.mul} 번`, "칸 넷마다 곱 둘"],
        ["덧셈", `${o.add} 번`, "칸 넷마다 합 하나"],
        ["연산", `${o.mul + o.add} 번`, "둘을 더한 것"],
      ]),
    ].join("\n");
  },

  /** `deep.origin` ② — 한 걸음씩 더하는 방법을 과제 규모에서 반박한다. */
  costNaive: () => {
    const scales = [WALK_N, 1_000n, EXEC_N, 1_000_000_000n, LIMIT];
    const rows = scales.map((n) => {
      const adds = n <= 1_000n ? byAddition(n).adds : n;
      if (adds !== n) throw new Error("덧셈 횟수가 n 과 다르다");
      return [
        num(n),
        num(adds),
        `${(Number(n) / Number(PER_SECOND)).toLocaleString("en-US", {
          maximumFractionDigits: 8,
        })} 초`,
      ];
    });
    const seconds = LIMIT / PER_SECOND;
    return [
      md(["항 번호 n", "덧셈 횟수", "초당 1 억 번일 때 시간"], rows, [0, 1, 2]),
      "",
      `마지막 줄의 ${num(seconds)} 초는 약 ${num(seconds / YEAR_SECONDS)} 년입니다. 덧셈 횟수는 n = 1,000 까지 실제로 세었고, 그 위 세 줄은 반복 횟수가 n 이라 n 을 그대로 적었습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 걸음 수가 다른 두 행렬을 곱하면 걸음 수가 더해진다. */
  mergeSteps: () => {
    const A = powerByRepeat(2n);
    const B = powerByRepeat(8n);
    const C = multiply(A, B);
    const D = powerByRepeat(10n);
    if (!same(C, D)) throw new Error("M^2 · M^8 이 M^10 과 다르다");
    return [
      "두 조각을 한 번에 잇는다",
      ...grid([
        ["M^2", show(A), "—"],
        ["M^8", show(B), "—"],
        ["M^2 · M^8", show(C), "행렬 곱 한 번"],
        ["M 을 10 번 곱한 것", show(D), "행렬 곱 10 번"],
      ]),
    ].join("\n");
  },

  /** `deep.origin` ④ — 두 방식의 연산을 나란히 세고 뒤집히는 자리를 낸다. */
  costTwoWays: () => {
    const scales = [WALK_N, 100n, 127n, 128n, 159n, 160n, EXEC_N, LIMIT];
    const rows = scales.map((n) => [
      num(n),
      num(n),
      num(matrixOps(n)),
      `${bitLength(n)}`,
      `${oneBits(n)}`,
      matrixOps(n) < Number(n) ? "행렬 거듭제곱" : "한 걸음씩 더하기",
    ]);
    let first = -1;
    let last = -1;
    for (let n = 1; n <= 100_000; n++) {
      const better = matrixOps(BigInt(n)) < n;
      if (better && first < 0) first = n;
      if (!better) last = n;
    }
    return [
      md(
        [
          "항 번호 n",
          "한 걸음씩 더하기",
          "행렬 거듭제곱",
          "비트 수 b",
          "1 인 비트 수 s",
          "연산이 적은 쪽",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `1 부터 100,000 까지 모든 n 을 세어 보면, 행렬 거듭제곱의 연산이 처음으로 더 적어지는 n 은 ${num(first)}${josa(num(first), "이고", "고")} 마지막으로 한 걸음씩 더하기가 적거나 같은 n 은 ${num(last)} 입니다. ${num(last + 1)} 부터는 늘 행렬 거듭제곱이 적습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 전이 행렬을 차례로 곱하는 후보. */
  candidateRepeated: () => {
    const per = PER();
    const rows = [WALK_N, 100n, 1_000n].map((n) => {
      const r = repeatedMatrix(n);
      return [
        num(n),
        `${matrixPowerFibonacci(n)}` === `${r.value}` ? "같다" : "다르다",
        num(r.muls),
        num(Number(r.muls) * per),
        num(byAddition(n).adds),
      ];
    });
    return [
      md(
        [
          "항 번호 n",
          "정본과의 답 판정",
          "행렬 곱",
          "연산",
          "한 걸음씩 더하기의 연산",
        ],
        rows,
        [0, 2, 3, 4],
      ),
      "",
      `세 줄 모두 답은 같고, 연산은 한 걸음씩 더하기의 ${per} 배입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 칸마다 거듭제곱하는 후보를 값으로 반박한다. */
  candidateElementwise: () => {
    const rows = [2n, 3n, 5n, WALK_N].map((k) => {
      const P = powerByRepeat(k);
      const el = elementwise(k);
      return [
        String(k),
        show(el),
        `${el[0][1]}`,
        show(P),
        `${P[0][1]}`,
        el[0][1] === P[0][1] ? "같다" : "다르다",
      ];
    });
    return [
      md(
        [
          "n",
          "칸마다 n 제곱한 값",
          "그 오른쪽 위",
          "행렬을 n 제곱한 값",
          "그 오른쪽 위",
          "판정",
        ],
        rows,
        [0, 2, 4],
      ),
      "",
      "칸마다 거듭제곱하면 1 과 0 은 몇 제곱을 해도 1 과 0 이라 행렬이 M 그대로입니다.",
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — 칸 하나를 이름에서 값까지 읽는다. */
  powersRead: () => {
    const k = 4n;
    const P = powerByRepeat(k);
    return [
      `${pow(k)} 의 오른쪽 위 칸`,
      ...grid([
        ["걸음 수", `${k}`],
        ["행렬", `${pow(k)} = ${show(P)}`],
        ["칸", `[0][1] = ${P[0][1]}`],
        ["정의", `한 걸음씩 더한 F(${k}) = ${F(k)}`],
      ]),
    ].join("\n");
  },

  /** `deep.build` 개념 (b)·(d) — 네 칸이 이웃한 세 항이고, 윗줄 왼쪽이 두 칸의 합이다. */
  powersCells: () => {
    const ks = [1n, 2n, 3n, 4n, 5n, 6n];
    let ok = 0;
    const rows = ks.map((k) => {
      const P = powerByRepeat(k);
      if (
        P[0][0] === F(k + 1n) &&
        P[0][1] === F(k) &&
        P[1][0] === F(k) &&
        P[1][1] === F(k - 1n) &&
        P[0][0] === P[0][1] + P[1][1]
      )
        ok++;
      return [
        String(k),
        show(P),
        `${F(k + 1n)} · ${F(k)} · ${F(k)} · ${F(k - 1n)}`,
        `${P[0][1]} + ${P[1][1]} = ${P[0][1] + P[1][1]}`,
      ];
    });
    return [
      md(
        [
          "k",
          "M^k",
          "F(k+1) · F(k) · F(k) · F(k-1)",
          "오른쪽 위 + 오른쪽 아래",
        ],
        rows,
        [0],
      ),
      "",
      `${ks.length} 줄 중 ${ok} 줄에서 네 칸이 차례로 F(k+1) · F(k) · F(k) · F(k-1) 이고, 오른쪽 위와 오른쪽 아래를 더한 값이 왼쪽 위와 같습니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (d) — 두 거듭제곱의 곱은 걸음 수의 합이다. */
  powersMerge: () => {
    const pairs: [bigint, bigint][] = [
      [2n, 8n],
      [8n, 2n],
      [3n, 5n],
      [4n, 4n],
      [1n, 9n],
    ];
    let ok = 0;
    const rows = pairs.map(([a, b]) => {
      const C = multiply(powerByRepeat(a), powerByRepeat(b));
      const D = powerByRepeat(a + b);
      if (same(C, D)) ok++;
      return [
        `${pow(a)} · ${pow(b)}`,
        show(C),
        pow(a + b),
        show(D),
        same(C, D) ? "같다" : "다르다",
      ];
    });
    return [
      md(["곱", "곱한 값", "걸음 수의 합", "그 거듭제곱", "판정"], rows),
      "",
      `${pairs.length} 쌍 모두에서 두 거듭제곱의 곱이 걸음 수를 더한 거듭제곱과 ${ok === pairs.length ? "같습니다" : "다릅니다"}. 앞의 두 쌍은 곱하는 순서만 바꾼 것입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (e) — 두 수만 든 상태와 네 칸 행렬. */
  vectorVsMatrix: () => {
    const k = 4n;
    const P = powerByRepeat(k);
    const Q = multiply(P, P);
    const state: [bigint, bigint] = [F(k + 1n), F(k)];
    let s = state;
    for (let j = 0n; j < k; j++)
      s = [
        TRANSITION[0][0] * s[0] + TRANSITION[0][1] * s[1],
        TRANSITION[1][0] * s[0] + TRANSITION[1][1] * s[1],
      ];
    if (s[1] !== Q[0][1]) throw new Error("두 길이 다른 답을 냈다");
    return [
      `${k} 걸음을 한 번 더 가서 ${2n * k} 걸음을 만든다`,
      ...grid([
        ["", "4 걸음의 결과", "8 걸음으로 가는 법"],
        [
          "상태로",
          `(F(${k + 1n}), F(${k})) = (${state[0]}, ${state[1]})`,
          `M 을 ${k} 번 더 곱해 (${s[0]}, ${s[1]})`,
        ],
        [
          "행렬로",
          `${pow(k)} = ${show(P)}`,
          `${pow(k)} · ${pow(k)} 한 번으로 ${show(Q)}`,
        ],
      ]).slice(1),
    ].join("\n");
  },

  /** `deep.build` 1단계 — 전이 행렬을 곱하면 한 걸음 간다. */
  stage1Step: () => {
    const M = TRANSITION;
    const ks = [1n, 2n, 3n, 4n, 5n];
    let ok = 0;
    const rows = ks.map((k) => {
      const a = F(k);
      const b = F(k - 1n);
      const x = M[0][0] * a + M[0][1] * b;
      const y = M[1][0] * a + M[1][1] * b;
      const hit = x === F(k + 1n) && y === F(k);
      if (hit) ok++;
      return [
        String(k),
        `(${a}, ${b})`,
        `(${x}, ${y})`,
        `(${F(k + 1n)}, ${F(k)})`,
        hit ? "같다" : "다르다",
      ];
    });
    return [
      md(
        [
          "k",
          "상태 (F(k), F(k-1))",
          "M 을 곱한 값",
          "정의의 (F(k+1), F(k))",
          "판정",
        ],
        rows,
        [0],
      ),
      "",
      `${ks.length} 걸음 중 ${ok} 걸음에서 M 을 곱한 값이 정의의 다음 상태와 같습니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 자리를 읽고 자리의 거듭제곱을 제곱으로 만든다. */
  stage2Squares: () => {
    const t = walk();
    let ok = 0;
    const rows = t.rounds.map((r) => {
      const want = powerByRepeat(r.stepOutPow);
      if (same(r.stepOut, want)) ok++;
      return [
        String(r.i),
        String(r.eIn),
        bin(r.eIn),
        String(r.bit),
        `${pow(r.stepInPow)} = ${show(r.stepIn)}`,
        `${pow(r.stepOutPow)} = ${show(r.stepOut)}`,
        same(r.stepOut, want) ? "같다" : "다르다",
      ];
    });
    return [
      md(
        [
          "자리 i",
          "e",
          "e 의 이진 표기",
          "e & 1",
          "바퀴 시작 step",
          "제곱한 step",
          "M 을 한 번씩 곱한 값과",
        ],
        rows,
        [0, 1, 3],
      ),
      "",
      `e 가 ${t.rounds.length} 바퀴 만에 0 이 됐고, ${t.rounds.length} 바퀴 중 ${ok} 바퀴에서 제곱한 step 이 M 을 한 번씩 곱해 만든 다음 자리의 거듭제곱과 같습니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 켜진 자리에서만 누적한다. */
  stage3Acc: () => {
    const t = walk();
    const rows = t.rounds.map((r) => [
      String(r.i),
      String(r.bit),
      pow(r.stepInPow),
      `${pow(r.accInPow)} = ${show(r.accIn)}`,
      `${pow(r.accPow)} = ${show(r.acc)}`,
    ]);
    const changed = t.rounds.filter((r) => r.bit === 1).map((r) => r.i);
    return [
      md(
        ["자리 i", "비트", "바퀴 시작 step", "바퀴 시작 acc", "바퀴 끝 acc"],
        rows,
        [0, 1],
      ),
      "",
      `acc 는 비트가 1 인 자리 ${changed.join(" · ")} 에서만 바뀌었습니다. 첫 누적인 자리 ${changed[0]} 에서는 단위행렬에 곱해 step 과 같은 행렬이 됐습니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 켜진 자리의 거듭제곱을 따로 곱해 맞춘다. */
  onBitsProduct: () => {
    const t = walk();
    const on = t.rounds.filter((r) => r.bit === 1);
    let P: Mat = IDENTITY;
    for (const r of on) P = multiply(P, r.stepIn);
    return [
      ...grid(
        [
          ["켜진 자리", on.map((r) => r.i).join(" · ")],
          [
            "그 자리의 걸음 수",
            `${on.map((r) => String(r.stepInPow)).join(" + ")} = ${on.reduce((a, r) => a + r.stepInPow, 0n)}`,
          ],
          [
            "그 자리의 거듭제곱",
            `${on.map((r) => pow(r.stepInPow)).join(" · ")} = ${show(P)}`,
          ],
          ["정본의 답", `${matrixPowerFibonacci(WALK_N)}`],
        ],
        "",
      ),
    ].join("\n");
  },

  /** `deep.build` 4단계 — 누적 행렬의 네 칸. */
  stage4Read: () => {
    const t = walk();
    const A = t.final;
    const n = WALK_N;
    return [
      `${pow(n)} = ${show(A)}`,
      ...grid([
        ["왼쪽 위", `${A[0][0]}`, `F(${n + 1n}) = ${F(n + 1n)}`, "—"],
        ["오른쪽 위", `${A[0][1]}`, `F(${n}) = ${F(n)}`, "정본이 돌려주는 칸"],
        ["왼쪽 아래", `${A[1][0]}`, `F(${n}) = ${F(n)}`, "—"],
        ["오른쪽 아래", `${A[1][1]}`, `F(${n - 1n}) = ${F(n - 1n)}`, "—"],
      ]),
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 상태를 몇 개 들 것인가. */
  stateSize: () => {
    const ratios = [2, 3, 4, 5, 6, 7, 8].map((k) => [
      String(k),
      `${F(k)}`,
      `${F(k - 1)}`,
      (Number(F(k)) / Number(F(k - 1))).toFixed(6),
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
        String(n),
        `${two.top}`,
        num(two.ops),
        `${three.top}`,
        num(three.ops),
        (three.ops / two.ops).toFixed(3),
      ];
    });
    const r = sizes[0]?.[5] ?? "";
    return [
      md(["n", "F(n)", "F(n-1)", "F(n) ÷ F(n-1)"], ratios, [0, 1, 2, 3]),
      "",
      "상태를 하나만 들면 다음 항이 앞 항의 몇 배인지가 줄마다 달라서, 곱할 상수 하나를 정할 수 없습니다. 상태를 둘 들 때와 셋 들 때는 이렇습니다.",
      "",
      md(
        [
          "n",
          "2×2 의 답",
          "2×2 의 연산",
          "3×3 의 답",
          "3×3 의 연산",
          "연산의 배수",
        ],
        sizes,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `세 줄 모두 답이 같고 3×3 의 연산만 ${r} 배입니다.`,
    ].join("\n");
  },

  /** `deep.walk` — 고정 입력. */
  walkInput: () =>
    [
      `const n = ${WALK_N}n;`,
      `// 이 절이 끝나면 ${matrixPowerFibonacci(WALK_N)}n 이 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 반복문 앞의 세 값. */
  walkInit: () =>
    [
      `T1 이 끝난 시점 — n = ${WALK_N}`,
      ...grid([
        ["acc", `= ${show(IDENTITY)}`, pow(0)],
        ["step", `= ${show(TRANSITION)}`, pow(1)],
        ["e", `= ${WALK_N}`, bin(WALK_N)],
      ]),
    ].join("\n"),

  /** `deep.walk.pause` — `number` 로 옮긴 사본이 어긋나는 자리. */
  pauseNumber: () => {
    let firstBig = -1;
    let firstWrong = -1;
    for (let n = 0; n <= 200; n++) {
      if (firstBig < 0 && F(n) > TWO53) firstBig = n;
      if (
        firstWrong < 0 &&
        BigInt(numberPort(n)) !== matrixPowerFibonacci(BigInt(n))
      )
        firstWrong = n;
    }
    const cases = [
      WALK_N,
      50n,
      BigInt(firstWrong - 1),
      BigInt(firstWrong),
      100n,
    ];
    const rows = cases.map((n) => {
      const right = matrixPowerFibonacci(n);
      const got = numberPort(Number(n));
      return [
        String(n),
        `${right}`,
        `${BigInt(got)}`,
        right > TWO53 ? "예" : "아니요",
        BigInt(got) === right ? "같다" : "틀리다",
      ];
    });
    return [
      md(
        ["n", "정본의 답", "number 로 옮긴 사본", "F(n) 이 2^53 초과", "판정"],
        rows,
        [0, 1, 2],
      ),
      "",
      `0 부터 200 까지 세어 보면 number 로 옮긴 사본이 처음 틀리는 n 은 ${firstWrong}${josa(firstWrong, "이고", "고")}, F(n) 이 2^53 = ${num(TWO53)}${을를(num(TWO53))} 처음 넘는 n 은 ${firstBig} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 2 — 앞 세 바퀴. */
  walkLoopHead: () => {
    const t = walk();
    const rows = t.rounds
      .slice(0, 3)
      .map((r) => [
        `T${r.i + 2}`,
        String(r.eIn),
        String(r.bit),
        pow(r.stepInPow),
        pow(r.accPow),
        pow(r.stepOutPow),
        String(r.eIn >> 1n),
      ]);
    const es = t.rounds.map((r) => String(r.eIn));
    const acc = t.rounds.filter((r) => r.bit === 1).length;
    return [
      md(
        [
          "걸음",
          "바퀴 시작 e",
          "이번 비트",
          "바퀴 시작 step",
          "③ 뒤 acc",
          "④ 뒤 step",
          "⑤ 뒤 e",
        ],
        rows,
        [1, 2, 6],
      ),
      "",
      `② 는 e 가 ${es.join(" · ")} 일 때 참이고 0 에서 처음 거짓이 됩니다. ③ 은 ${t.rounds.length} 바퀴 중 ${acc} 바퀴에서만 실행되고 ④ · ⑤ 는 ${t.rounds.length} 바퀴 다 실행됩니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 좌우 순서와 앞뒤 순서는 다른 것이다. */
  pauseOrder: () => {
    const ns = [0n, 1n, 2n, 3n, 5n, WALK_N, 13n, 20n];
    const rows = ns.map((n) => {
      const right = matrixPowerFibonacci(n);
      const lr = rightToLeft(n);
      const sf = squareFirst(n).value;
      return [String(n), `${right}`, `${lr}`, `${sf}`, `${F(2n * n)}`];
    });
    const lrSame = ns.filter(
      (n) => rightToLeft(n) === matrixPowerFibonacci(n),
    ).length;
    const sfDiff = ns.filter(
      (n) => squareFirst(n).value !== matrixPowerFibonacci(n),
    ).length;
    const sfIs2n = ns.filter((n) => squareFirst(n).value === F(2n * n)).length;
    return [
      md(
        ["n", "정본의 답", "좌우를 바꾼 값", "앞뒤를 바꾼 값", "F(2n)"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `좌우를 바꾼 값은 ${ns.length} 줄 중 ${lrSame} 줄에서 정본의 답과 같고, 앞뒤를 바꾼 값은 ${sfDiff} 줄에서 답과 다릅니다. 앞뒤를 바꾼 값은 ${ns.length} 줄 중 ${sfIs2n} 줄에서 F(2n) 과 같습니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 앞뒤를 바꾸면 자리마다 곱하는 행렬. */
  pauseOrderPlace: () => {
    const t = walk();
    const sf = squareFirst(WALK_N);
    const normal = t.rounds.filter((r) => r.bit === 1);
    const on = normal.map((r) => r.i);
    const swapped = on.map((i) => sf.used[i] as bigint);
    const sum = (xs: bigint[]) => xs.reduce((a, b) => a + b, 0n);
    const normalPows = normal.map((r) => r.stepInPow);
    return [
      `전개 입력에서 켜진 자리 ${on.join(" · ")} 에 곱해지는 행렬`,
      ...grid([
        [
          "정상 순서",
          normalPows.map(pow).join(" · "),
          `걸음 수 ${sum(normalPows)}`,
        ],
        ["바꾼 순서", swapped.map(pow).join(" · "), `걸음 수 ${sum(swapped)}`],
      ]),
    ].join("\n");
  },

  /** `deep.walk` 3 — 걸음마다의 상태값과 분기 판정. */
  walkTrace: () => {
    const t = walk();
    const rows: string[][] = [
      ["T1", "—", "—", pow(0), pow(1), String(WALK_N), "0"],
    ];
    for (const r of t.rounds) {
      rows.push([
        `T${r.i + 2}`,
        `${r.eIn} > 0 **참**`,
        `${r.eIn} & 1 = ${r.bit} → ③ ${r.bit === 1 ? "실행" : "건너뜀"}`,
        pow(r.accPow),
        pow(r.stepOutPow),
        String(r.eIn >> 1n),
        String(r.muls),
      ]);
    }
    const last = t.rounds.at(-1);
    rows.push([
      `T${t.rounds.length + 2}`,
      "0 > 0 **거짓**",
      `⑥ acc[0][1] = ${t.answer}`,
      pow(last?.accPow ?? 0n),
      "—",
      "—",
      String(last?.muls ?? 0),
    ]);
    return [
      md(
        ["걸음", "② e > 0", "이번 비트", "acc", "step", "e", "행렬 곱"],
        rows,
        [5, 6],
      ),
      "",
      `행렬 곱은 모두 ${last?.muls} 번이고, 돌려주는 값은 ${t.answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 라벨마다 실행된 걸음. */
  walkBranches: () => {
    const t = walk();
    const ids = t.rounds.map((r) => `T${r.i + 2}`);
    const on = t.rounds.filter((r) => r.bit === 1).map((r) => `T${r.i + 2}`);
    const off = t.rounds.filter((r) => r.bit === 0).map((r) => `T${r.i + 2}`);
    const end = `T${t.rounds.length + 2}`;
    const rows = [
      ["①", "두 행렬과 남은 지수를 세운다", "T1 에서 한 번"],
      [
        "②",
        "남은 비트가 있는가",
        `${ids.join(" · ")} 에서 참 · ${end} 에서 거짓`,
      ],
      [
        "③",
        "비트가 1 이면 누적",
        `${on.join(" · ")} 에서 실행 · ${off.join(" · ")} 에서 건너뜀`,
      ],
      [
        "④",
        "다음 자리의 거듭제곱을 만든다",
        `${ids.join(" · ")} 에서 ${ids.length} 번`,
      ],
      ["⑤", "다음 비트로 옮긴다", `${ids.join(" · ")} 에서 ${ids.length} 번`],
      ["⑥", "오른쪽 위 칸을 돌려준다", `${end} 에서 한 번`],
    ];
    return md(["라벨", "하는 일", "전개에서"], rows);
  },

  /** `deep.walk.pause` — 어느 칸을 읽어야 하는가. */
  pauseCell: () => {
    const ns = [0n, 1n, 2n, 3n, 4n, 5n, WALK_N];
    const rows = ns.map((n) => {
      const P = powerByRepeat(n);
      const right = matrixPowerFibonacci(n);
      const tl = topLeftInstead(n);
      return [
        String(n),
        `${P[0][0]}`,
        `${P[0][1]}`,
        `${P[1][1]}`,
        `${right}`,
        tl === right ? "같다" : "틀리다",
      ];
    });
    const hits = ns.filter(
      (n) => topLeftInstead(n) === matrixPowerFibonacci(n),
    );
    return [
      md(
        [
          "n",
          "왼쪽 위 칸",
          "오른쪽 위 칸",
          "오른쪽 아래 칸",
          "정본의 답",
          "왼쪽 위 칸을 돌려준 판정",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `${ns.length} 줄 중 왼쪽 위 칸이 답과 같은 줄은 n = ${hits.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 연산 횟수와 한 연산이 다루는 수의 크기. */
  pauseSize: () => {
    const scales = [1_000n, 10_000n, 100_000n, EXEC_N];
    const rows = scales.map((n) => [
      num(n),
      num(matrixOps(n)),
      num(digits(matrixPowerFibonacci(n))),
    ]);
    const a = matrixOps(1_000n);
    const b = matrixOps(EXEC_N);
    const da = digits(matrixPowerFibonacci(1_000n));
    const db = digits(matrixPowerFibonacci(EXEC_N));
    return [
      md(["항 번호 n", "연산 횟수", "답 F(n) 의 자릿수"], rows, [0, 1, 2]),
      "",
      `n 이 1,000 배가 되는 동안 연산 횟수는 ${(b / a).toFixed(2)} 배, 답의 자릿수는 ${(db / da).toFixed(2)} 배가 됐습니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 쓰이지 않는 마지막 제곱이 이 런타임의 한계를 먼저 넘는다. */
  pauseRuntime: () => {
    const tryBits = (f: () => bigint): string => {
      try {
        return `${num(f().toString(2).length)} 비트`;
      } catch (error) {
        return error instanceof Error ? error.name : "오류";
      }
    };
    // 이 런타임의 bigint 한 값이 가질 수 있는 가장 큰 비트 수 — 2^k 를 만들어 보며 이분 탐색한다.
    const fits = (k: number): boolean => {
      try {
        return 1n << BigInt(k - 1) > 0n;
      } catch {
        return false;
      }
    };
    let lo = 1;
    let hi = 1 << 26;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (fits(mid)) lo = mid;
      else hi = mid - 1;
    }
    const top = 2n ** 20n;
    const rows = [top - 1n, top].map((n) => {
      const lastStep = 2n ** BigInt(bitLength(n));
      return [
        num(n),
        String(bitLength(n)),
        tryBits(() => byDoubling(n)),
        pow(lastStep),
        tryBits(() => byDoubling(lastStep + 1n)),
        tryBits(() => matrixPowerFibonacci(n)),
      ];
    });
    return [
      md(
        [
          "항 번호 n",
          "비트 수",
          "답 F(n)",
          "마지막 제곱이 만드는 step",
          "그 왼쪽 위 칸",
          "정본의 결과",
        ],
        rows,
        [0, 1],
      ),
      "",
      `이 런타임의 bigint 한 값은 ${num(lo)} 비트까지 담깁니다. 답과 마지막 step 의 왼쪽 위 칸 F(2^b + 1) 은 행렬을 쓰지 않는 두 배 식으로 따로 구했습니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 결과. */
  finalCalls: () =>
    [0n, 1n, 2n, WALK_N, 50n, 100n]
      .map(
        (n) =>
          `${`matrixPowerFibonacci(${n}n)`.padEnd(30)}→ ${matrixPowerFibonacci(n)}n`,
      )
      .join("\n"),

  /** `related` — 동반 행렬을 만드는 규칙. */
  relatedRule: () => {
    const fib = companion([1n, 1n]);
    const trib = companion([1n, 1n, 1n]);
    const rows = (M: bigint[][]) =>
      `[${M.map((r) => `[${r.join(",")}]`).join(",")}]`;
    if (rows(fib) !== show(TRANSITION))
      throw new Error("피보나치의 동반 행렬이 정본의 전이 행렬과 다르다");
    return [
      "점화식 v(m) = c1·v(m-1) + c2·v(m-2) + … + ck·v(m-k) 의 동반 행렬",
      ...grid(
        [
          ["첫 줄", "[c1, c2, …, ck]", "계수를 그대로 적는다"],
          ["그 아래", "한 칸씩 내린 단위행렬", "앞 항들을 한 칸씩 내려보낸다"],
          ["피보나치", rows(fib), "정본의 TRANSITION 과 같다"],
          [
            "트리보나치",
            rows(trib),
            `k = ${trib.length} 이고 계수가 모두 1 이다`,
          ],
        ],
        "",
      ),
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
      const want = byDefinition(c.coeffs, c.seed, 10);
      const got = byCompanion(c.coeffs, c.seed, 10);
      const { ops } = powerK(M, 10, k);
      return [
        c.name,
        `${k}×${k}`,
        `[${(M[0] ?? []).join(",")}]`,
        `${want}`,
        `${got}`,
        got === want ? "같다" : "다르다",
        num(ops),
      ];
    });
    return [
      md(
        [
          "점화식",
          "동반 행렬 크기",
          "첫 줄(계수)",
          "정의로 센 v(10)",
          "동반 행렬이 낸 값",
          "판정",
          "M^10 까지의 연산",
        ],
        rows,
        [3, 4, 6],
      ),
      "",
      "네 점화식 모두 같은 절차로 v(10) 을 냈고, 갈리는 것은 첫 줄의 계수와 행렬 크기뿐입니다.",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 값에 넣어 검산한다. */
  mathCheck: () => {
    const ks = [1n, 2n, 5n, WALK_N, 20n];
    let ok = 0;
    const rows = ks.map((k) => {
      const P = powerByRepeat(k);
      const det = P[0][0] * P[1][1] - P[0][1] * P[1][0];
      const sign = (-1n) ** k;
      if (P[0][0] === F(k + 1n) && P[0][1] === F(k) && det === sign) ok++;
      return [
        String(k),
        `${P[0][0]}`,
        `${F(k + 1n)}`,
        `${P[0][1]}`,
        `${F(k)}`,
        `${det}`,
        `${sign}`,
      ];
    });
    return [
      md(
        [
          "n",
          "왼쪽 위 칸",
          "F(n+1)",
          "오른쪽 위 칸",
          "F(n)",
          "행렬식",
          "(-1)^n",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `${ks.length} 줄 중 ${ok} 줄에서 왼쪽 위 칸이 F(n+1), 오른쪽 위 칸이 F(n) 이고 행렬식이 (-1)^n 입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — φ · ψ 의 값과 닫힌 형태의 검산. */
  mathPhi: () => {
    const n = WALK_N;
    // φ^n / √5 를 고정소수점으로 — φ 를 n 번 곱한다.
    let p = SCALE;
    for (let j = 0n; j < n; j++) p = (p * PHI_SCALED) / SCALE;
    const approx = (p * SCALE) / SQRT5;
    return [
      ...grid(
        [
          ["φ", `= ${fixed(PHI_SCALED, 15)}`],
          ["ψ = 1 − φ", `= ${fixed(SCALE - PHI_SCALED, 15)}`],
          ["√5", `= ${fixed(SQRT5, 15)}`],
          [
            `φ^${n} / √5`,
            `= ${fixed(approx, 6)} · 반올림하면 ${(approx + SCALE / 2n) / SCALE} · F(${n}) = ${F(n)}`,
          ],
        ],
        "",
      ),
    ].join("\n");
  },

  /** `deep.math` ③ — 닫힌 형태의 두 항 중 ψ 쪽이 0 으로 줄어든다. */
  mathPsi: () => {
    const PSI = SCALE - PHI_SCALED;
    const ns = [1n, 2n, 5n, WALK_N, 20n];
    let ok = 0;
    const rows = ns.map((n) => {
      let p = SCALE;
      let q = SCALE;
      for (let j = 0n; j < n; j++) {
        p = (p * PHI_SCALED) / SCALE;
        q = (q * PSI) / SCALE;
      }
      const a = (p * SCALE) / SQRT5;
      const b = (q * SCALE) / SQRT5;
      const round = (a + SCALE / 2n) / SCALE;
      if (round === F(n)) ok++;
      return [String(n), fixed(a, 6), fixed(b, 6), `${round}`, `${F(n)}`];
    });
    return [
      md(
        ["n", "φ^n / √5", "ψ^n / √5", "φ^n / √5 를 반올림", "F(n)"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `ψ 쪽 항은 n 이 커질수록 0 에 가까워지고, ${ns.length} 줄 중 ${ok} 줄에서 φ 쪽 항을 반올림한 값이 F(n) 과 같습니다.`,
    ].join("\n");
  },

  /** `deep.math` ③④ — 자릿수 식을 실측과 맞추고 과제 규모의 값을 낸다. */
  mathDigits: () => {
    const checks = [2, 10, 50, 100, 500, 1000].map((k) => [
      num(k),
      num(digits(F(k))),
      num(fibDigits(BigInt(k))),
      digits(F(k)) === Number(fibDigits(BigInt(k))) ? "같다" : "다르다",
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
    const exec = digits(matrixPowerFibonacci(EXEC_N));
    const scales = [EXEC_N, 1_000_000_000n, LIMIT].map((n) => [
      num(n),
      num(fibDigits(n)),
      n === EXEC_N ? num(exec) : "실행 안 함",
    ]);
    return [
      `log10 φ = ${fixed(LOG10_PHI, 18)} · ½ log10 5 = ${fixed(HALF_LOG10_5, 18)}${으로(fixed(HALF_LOG10_5, 18))} 계산했습니다.`,
      "",
      md(["n", "실측 자릿수", "식이 낸 자릿수", "판정"], checks, [0, 1, 2]),
      "",
      `n = 2 부터 2,000 까지 모든 n 에서 대조했고, 어긋난 n 은 ${num(mismatch)} 개입니다. 식을 실행하기 어려운 규모에 넣으면 이렇습니다.`,
      "",
      md(["n", "식이 낸 자릿수", "정본의 답을 센 자릿수"], scales, [0, 1, 2]),
    ].join("\n");
  },

  /** `invariant` ② — 바퀴를 시작할 때마다 acc · step^e = M^n. */
  invariantRounds: () => {
    const t = walk();
    const target = powerByRepeat(WALK_N);
    const rows: string[][] = [];
    const push = (
      label: string,
      acc: Mat,
      accPow: bigint,
      step: Mat,
      stepPow: bigint,
      e: bigint,
    ) => {
      let P = acc;
      for (let j = 0n; j < e; j++) P = multiply(P, step);
      rows.push([
        label,
        pow(accPow),
        pow(stepPow),
        String(e),
        `${accPow} + ${stepPow} · ${e} = ${accPow + stepPow * e}`,
        show(P),
        same(P, target) ? "같다" : "다르다",
      ]);
    };
    for (const r of t.rounds)
      push(
        `바퀴 ${r.i} 시작`,
        r.accIn,
        r.accInPow,
        r.stepIn,
        r.stepInPow,
        r.eIn,
      );
    const last = t.rounds.at(-1) as (typeof t.rounds)[number];
    push(
      "반복이 끝난 뒤",
      last.acc,
      last.accPow,
      last.stepOut,
      last.stepOutPow,
      0n,
    );
    return [
      md(
        [
          "시점",
          "acc",
          "step",
          "e",
          "걸음 수 a + p · e",
          "acc · step^e",
          `${pow(WALK_N)} 과`,
        ],
        rows,
        [3],
      ),
      "",
      `${rows.length} 시점 모두에서 acc · step^e 가 ${pow(WALK_N)} = ${show(target)} 입니다.`,
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
      ["답이 부호 있는 64 비트에 담기는 마지막 항이다", 92n],
      ["항 번호가 세 자리다", 100n],
    ];
    let ok = 0;
    const rows = cases.map(([label, n]) => {
      const want = F(n);
      const got = matrixPowerFibonacci(n);
      if (want === got) ok++;
      return [
        label,
        num(n),
        `${bitLength(n)}`,
        `${oneBits(n)}`,
        `${want}`,
        `${got}`,
      ];
    });
    return [
      md(
        [
          "경계",
          "n",
          "비트 수",
          "1 인 비트 수",
          "한 걸음씩 더한 답",
          "정본의 답",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${cases.length} 입력 중 ${ok} 입력에서 정본의 답이 한 걸음씩 더한 답과 같습니다. 2^63 − 1 은 ${num(2n ** 63n - 1n)}${josa(num(2n ** 63n - 1n), "이고", "고")} F(93) 은 ${num(F(93))}${josa(num(F(93)), "이라", "라")} 그 한계를 넘습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 시작값을 단위행렬에서 전이 행렬로 바꾼다. */
  mutantIdentity: () => {
    const rows = [0n, 1n, 2n, 3n, 5n, WALK_N, 20n, 100n].map((n) => {
      const right = matrixPowerFibonacci(n);
      const got = startFromM.matrixPowerFibonacci(n);
      return [
        String(n),
        `${right}`,
        `${got}`,
        `${F(n + 1n)}`,
        got === right ? "같다" : "틀리다",
      ];
    });
    return md(
      ["n", "정본의 답", "M 에서 시작한 답", "F(n+1)", "판정"],
      rows,
      [0, 1, 2, 3],
    );
  },

  /** `invariant` ③ — 변이의 acc 가 바퀴마다 몇 걸음짜리인가. */
  mutantPlaces: () => {
    const t = walk();
    const bits = bitsLow(WALK_N);
    // 변이는 시작 걸음 수가 1 이다. 켜진 자리에서 2^i 를 더하는 것은 정본과 같다.
    const start = startFromM.matrixPowerFibonacci(0n) === 1n ? 1n : 0n;
    const mut: bigint[] = [];
    let a = start;
    for (const [i, b] of bits.entries()) {
      mut.push(a);
      if (b === 1) a += 2n ** BigInt(i);
    }
    mut.push(a);
    const right = [
      ...t.rounds.map((r) => r.accInPow),
      t.rounds.at(-1)?.accPow ?? 0n,
    ];
    return [
      "전개 입력에서 바퀴를 시작할 때의 acc",
      ...grid([
        ["정본", right.map(pow).join(" ")],
        ["시작을 바꾼 것", mut.map(pow).join(" ")],
        [
          "변이가 낸 답",
          `${startFromM.matrixPowerFibonacci(WALK_N)} = F(${a})`,
        ],
      ]),
    ].join("\n");
  },

  /** `perf.derive` — 걸음별로 행렬 곱과 연산을 센다. */
  perfCount: () => {
    const t = walk();
    const o = opsPerMatMul();
    const per = o.mul + o.add;
    const muls = t.rounds.at(-1)?.muls ?? 0;
    const last = `T${t.rounds.length + 2}`;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "바퀴",
        `T2 ~ T${t.rounds.length + 1}`,
        String(t.rounds.length),
        "1",
        "0 또는 1",
        String(muls),
      ],
      ["반환", last, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(muls)],
    ];
    const s = t.rounds.filter((r) => r.bit === 1).length;
    return [
      md(
        [
          "무리",
          "걸음",
          "걸음 수",
          "걸음마다 제곱",
          "걸음마다 누적",
          "이 입력의 행렬 곱",
        ],
        rows,
        [2, 5],
      ),
      "",
      `제곱 ${t.rounds.length} 번과 누적 ${s} 번입니다. 앞은 비트 수 b 이고 뒤는 1 인 비트 수 s 이며, 행렬 곱 ${muls} 번은 연산 ${per * muls} 번입니다.`,
    ].join("\n");
  },

  /** `perf.bounds` — 과제 규모에 넣은 총식. */
  perfTotal: () => {
    const o = opsPerMatMul();
    const per = o.mul + o.add;
    return [
      "n = 10^18 에서",
      ...grid([
        ["b = ⌊log2 n⌋ + 1", `${bitLength(LIMIT)}`],
        ["s", `${oneBits(LIMIT)}`],
        ["행렬 곱 b + s", `${matMuls(LIMIT)}`],
        [`연산 ${per}(b + s)`, num(matrixOps(LIMIT))],
        ["저장 칸", "acc 넷 · step 넷 · e 하나"],
      ]),
    ].join("\n");
  },

  /** `perf.worst` — 행렬 곱이 가장 많은 n. */
  worstShape: () => {
    const best = mostOneBitsAtMost(LIMIT);
    const shapes: [string, bigint][] = [
      ["2^59", 2n ** 59n],
      ["10^18 (과제의 상한)", LIMIT],
      ["2^59 − 1", 2n ** 59n - 1n],
      ["2^59 + 2^58 − 1", 2n ** 59n + 2n ** 58n - 1n],
    ];
    const o = opsPerMatMul();
    const per = o.mul + o.add;
    const rows = shapes.map(([label, n]) => [
      label,
      num(n),
      String(bitLength(n)),
      String(oneBits(n)),
      String(matMuls(n)),
      num(per * matMuls(n)),
    ]);
    const third = shapes[2]?.[1] ?? 0n;
    return [
      md(
        [
          "n 의 모양",
          "n",
          "비트 수 b",
          "1 인 비트 수 s",
          "행렬 곱 b + s",
          "연산",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `상한 아래에서 행렬 곱이 가장 많은 n 은 ${num(best)}${josa(num(best), "이고", "고")} ${matMuls(best)} 번입니다. 셋째 줄의 n 은 상한의 약 ${((Number(third) / Number(LIMIT)) * 100).toFixed(0)}% 인데 행렬 곱이 ${matMuls(third)} 번으로 상한의 ${matMuls(LIMIT)} 번보다 많습니다.`,
    ].join("\n");
  },

  /** `selfcheck` — T3 이 한 곱셈. */
  selfcheckT3: () => {
    const t = walk();
    const r = t.rounds.find((x) => x.bit === 1) as (typeof t.rounds)[number];
    return [
      `T${r.i + 2} 이 한 곱셈`,
      ...grid([
        ["곱하기 전", `acc = ${show(r.accIn)}`, "단위행렬"],
        ["곱한 것", `step = ${show(r.stepIn)}`, pow(r.stepInPow)],
        ["곱한 뒤", `acc = ${show(r.acc)}`, "step 과 네 칸이 같다"],
      ]),
    ].join("\n");
  },

  /** `selfcheck` — 첫 누적을 대입으로 바꾸면 행렬 곱이 몇 번 주는가. */
  checkAssignFirst: () => {
    const rows = [WALK_N, 100n, 1_000n, LIMIT].map((n) => {
      const runnable = n <= 1_000n;
      const counted = runnable ? assignFirst(n).matMuls : assignFirstMuls(n);
      if (runnable && counted !== assignFirstMuls(n))
        throw new Error("대입 판의 실측과 셈이 다르다");
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
      md(
        ["항 번호 n", "정본의 행렬 곱", "대입 판의 행렬 곱", "차이", "답"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `마지막 줄은 답을 담을 수 없는 규모라 행렬 곱만 세었고, 1,000 까지는 대입 판을 실행해 센 값입니다. n = 10^18 에서 줄어드는 비율은 ${((1 / matMuls(LIMIT)) * 100).toFixed(1)}% 입니다.`,
    ].join("\n");
  },
};
