/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바퀴마다의 `e` · `b` · `result` 는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/fastPower/fastPower-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  bin,
  binaryMults,
  bitLength,
  bitsLow,
  LIMIT,
  num,
  oneBits,
  PER_SECOND,
  squaringOnly,
  WALK_BASE,
  WALK_EXP,
  WALK_MOD,
  walk,
} from "./fastPower-guide.fig.tsx";
import { fastPower } from "./fastPower-guide.ref.ts";

const REF = new URL("./fastPower-guide.ref.ts", import.meta.url).pathname;

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

/** 1 년을 초로 센 값 — 365 일 기준. */
const YEAR_SECONDS = 31_536_000n;

/** 흔히 쓰는 소수 법. `number` 로 옮긴 사본이 넘치는 자리를 보이는 데 쓴다. */
const PRIME = 1_000_000_007n;

const TWO53 = 2n ** 53n;

/** 정의대로 — 거듭제곱을 다 한 뒤 `[0, mod)` 로 옮긴다. 작은 입력의 기준값이다. */
const byDefinition = (base: bigint, exp: bigint, mod: bigint): bigint =>
  ((base ** exp % mod) + mod) % mod;

/* ────────────────────────── 비교에 쓰는 사본 ────────────────────────── */

/**
 * **`k` 로 나누는 절차의 곱셈 횟수.** 지수를 `k` 로 나눠 내려가되, 자리마다 밑을 `k` 제곱하고
 * (곱셈 `k − 1` 번) 그 자리 숫자만큼 누적한다(곱셈 `d` 번). `k = 2` 가 이진 거듭제곱이다.
 *
 * 미리 만드는 표는 쓰지 않는다 — 표를 두는 설계는 `purpose.alt` 가 따로 잰다.
 */
function radixMults(exp: bigint, k: bigint): bigint {
  let e = exp;
  let mults = 0n;
  while (e > 0n) {
    mults += e % k;
    mults += k - 1n;
    e /= k;
  }
  return mults;
}

/**
 * **두 줄의 자리를 바꾼 사본** — 밑을 먼저 제곱하고 그다음에 비트를 본다. 두 줄을 맞바꾼
 * 것이라 `loadMutant`(한 줄 치환)로는 만들 수 없어 여기 따로 적는다. 바퀴마다 누적에 쓴 `b` 도 돌려준다.
 */
function squareFirst(
  base: bigint,
  exp: bigint,
  mod: bigint,
): { value: bigint; used: bigint[] } {
  let result = 1n % mod;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  const used: bigint[] = [];
  while (e > 0n) {
    b = (b * b) % mod;
    used.push(b);
    if ((e & 1n) === 1n) result = (result * b) % mod;
    e >>= 1n;
  }
  return { value: result, used };
}

/** 나머지를 매 곱셈마다 구하지 않고 **마지막에 한 번만** 구하는 사본 — bigint 다. */
function lastModBig(base: bigint, exp: bigint, mod: bigint): bigint {
  let acc = 1n;
  for (let i = 0n; i < exp; i++) acc = acc * base;
  return ((acc % mod) + mod) % mod;
}

/** 같은 것을 `number` 로 한 사본. 자릿수가 넘치면 값이 어긋난다. */
function lastModNumber(base: number, exp: number, mod: number): number {
  let acc = 1;
  for (let i = 0; i < exp; i++) acc = acc * base;
  return acc % mod;
}

/**
 * **정본을 `number` 로 옮긴 사본.** 곱할 때마다 법으로 줄이는 것은 정본과 같다. `>>` 는 `number` 에서
 * 32 비트로 잘리므로 2 로 나눈 몫을 쓴다. 가장 큰 중간 곱도 함께 돌려준다.
 */
function numberPort(
  base: number,
  exp: number,
  mod: number,
): { value: number; maxProduct: bigint } {
  let result = 1 % mod;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  let maxProduct = 0n;
  const seen = (x: number, y: number) => {
    const p = BigInt(x) * BigInt(y);
    if (p > maxProduct) maxProduct = p;
  };
  while (e > 0) {
    if (e % 2 === 1) {
      seen(result, b);
      result = (result * b) % mod;
    }
    seen(b, b);
    b = (b * b) % mod;
    e = Math.floor(e / 2);
  }
  return { value: result, maxProduct };
}

/** 같은 절차를 곱셈 자리만 바꿔 쓴 것 — `related` 절이 행렬과 문자열에 건다. */
function powWith<T>(x: T, exp: bigint, mul: (a: T, b: T) => T, id: T): T {
  let result = id;
  let b = x;
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) result = mul(result, b);
    b = mul(b, b);
    e >>= 1n;
  }
  return result;
}

type Mat = [[bigint, bigint], [bigint, bigint]];
const matMul =
  (mod: bigint) =>
  (a: Mat, b: Mat): Mat => [
    [
      (a[0][0] * b[0][0] + a[0][1] * b[1][0]) % mod,
      (a[0][0] * b[0][1] + a[0][1] * b[1][1]) % mod,
    ],
    [
      (a[1][0] * b[0][0] + a[1][1] * b[1][0]) % mod,
      (a[1][0] * b[0][1] + a[1][1] * b[1][1]) % mod,
    ],
  ];

/**
 * 제약 안에서 **곱셈이 가장 많은 지수**를 구성한다. `n + s` 를 최대로 하는 것이므로 1 인
 * 비트를 최대한 세우면 된다 — 상한의 어떤 1 비트를 내리고 그 아래를 전부 세운 후보들과
 * 상한 자신 중에서 고른다.
 */
function mostOneBitsAtMost(limit: bigint): bigint {
  let best = limit;
  let bestScore = bitLength(limit) + oneBits(limit);
  for (let i = 0; i < bitLength(limit); i++) {
    const bit = 1n << BigInt(i);
    if ((limit & bit) === 0n) continue;
    const candidate = (limit & ~((bit << 1n) - 1n)) | (bit - 1n);
    const score = bitLength(candidate) + oneBits(candidate);
    if (score > bestScore || (score === bestScore && candidate > best)) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { fastPower: (b: bigint, e: bigint, m: bigint) => bigint };

/**
 * **밑을 제곱하던 줄을 없앤 사본** — `b` 가 처음 값에 그대로 머문다. 불변식 `result · b^e`
 * 의 `b^e` 항을 유지하던 바로 그 줄이다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noSquare = await loadMutant<Impl>(REF, {
  swap: [/b = \(b \* b\) % mod;/, "b = b % mod;"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  base: bigint;
  exp: bigint;
  mod: bigint;
}

const C = (base: bigint, exp: bigint, mod: bigint): Case => ({
  base,
  exp,
  mod,
});

const WALK_CASE = C(WALK_BASE, WALK_EXP, WALK_MOD);

const label = (c: Case): string =>
  `${c.base < 0n ? `(${c.base})` : c.base}^${c.exp} mod ${c.mod}`;

const walkLabel = (c: Case): string =>
  c === WALK_CASE ? `전개 입력 ${label(c)}` : label(c);

const verdict = (a: bigint | number | string, b: bigint | number | string) =>
  String(a) === String(b) ? "같다" : "틀리다";

const SCALES: bigint[] = [26n, 1000n, 10n ** 6n, 10n ** 9n, LIMIT];

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 과제 하나를 값으로. */
  conceptTask: () => {
    const full = WALK_BASE ** WALK_EXP;
    const got = fastPower(WALK_BASE, WALK_EXP, WALK_MOD);
    if (full % WALK_MOD !== got) throw new Error("정의와 정본이 다르다");
    return [
      `fastPower(${WALK_BASE}n, ${WALK_EXP}n, ${WALK_MOD}n)`,
      `  거듭제곱   ${WALK_BASE}^${WALK_EXP} = ${num(full)}`,
      `  나머지     ${num(full)} mod ${num(WALK_MOD)} = ${got}`,
    ].join("\n");
  },

  /** `concept` — 두 방법의 곱셈 횟수를 결과만. */
  conceptCost: () => {
    const rows = [WALK_EXP, LIMIT].map((e) => [
      num(e),
      num(e),
      String(binaryMults(e)),
      String(bitLength(e)),
      String(oneBits(e)),
    ]);
    return [
      md(
        [
          "지수 exp",
          "차례로 곱하기의 곱셈",
          "이진 거듭제곱의 곱셈",
          "비트 수",
          "1 인 비트 수",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `지수 10^18 에서 곱셈이 ${num(LIMIT)} 번에서 ${binaryMults(LIMIT)} 번으로 줄었고, ${binaryMults(LIMIT)}${은는(binaryMults(LIMIT))} 비트 수 ${bitLength(LIMIT)}${과와(bitLength(LIMIT))} 1 인 비트 수 ${oneBits(LIMIT)}${을를(oneBits(LIMIT))} 더한 값입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 차례로 곱하는 방법을 과제 규모에서 반박한다. */
  costNaive: () => {
    const rows = SCALES.map((e) => [
      num(e),
      num(e),
      `${(Number(e) / Number(PER_SECOND)).toLocaleString("en-US", {
        maximumFractionDigits: 8,
      })} 초`,
    ]);
    const seconds = LIMIT / PER_SECOND;
    return [
      md(["지수 exp", "곱셈 횟수", "초당 1 억 번일 때 시간"], rows, [0, 1, 2]),
      "",
      `마지막 줄의 ${num(seconds)} 초는 약 ${num(seconds / YEAR_SECONDS)} 년입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 26 을 2 로 나눠 내려간다. */
  halveChain: () => {
    const rows: string[][] = [];
    const rems: bigint[] = [];
    for (let e = WALK_EXP; e > 0n; e /= 2n) {
      rows.push([String(e), String(e / 2n), String(e % 2n)]);
      rems.push(e % 2n);
    }
    const read = [...rems].reverse().join("");
    if (read !== WALK_EXP.toString(2))
      throw new Error("나머지가 이진 표기가 아니다");
    return [
      md(["e", "e 를 2 로 나눈 몫", "나머지"], rows, [0, 1, 2]),
      "",
      `${rows.length} 번 나누어 0 이 됐고, 나머지를 아래 줄부터 읽으면 ${read}${으로(read)} ${WALK_EXP} 의 이진 표기입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 반으로 줄인 지수에서 거슬러 올라가며 값을 잇는다. */
  foldChain: () => {
    const chain: bigint[] = [];
    for (let e = WALK_EXP; e > 0n; e /= 2n) chain.push(e);
    chain.reverse();
    const rows: string[][] = [[`${WALK_BASE}^0`, "—", "1", "0"]];
    let acc = 1n;
    let mults = 0;
    for (const e of chain) {
      let value = acc * acc;
      let step = "제곱";
      mults++;
      if (e % 2n === 1n) {
        value *= WALK_BASE;
        step = "제곱한 뒤 밑을 한 번 더";
        mults++;
      }
      if (value !== WALK_BASE ** e) throw new Error(`3^${e} 이 어긋난다`);
      rows.push([`${WALK_BASE}^${e}`, step, num(value), String(mults)]);
      acc = value;
    }
    return [
      md(["구하는 값", "직전 값으로 하는 일", "값", "누적 곱셈"], rows, [2, 3]),
      "",
      `${WALK_BASE}^${WALK_EXP}${을를(WALK_EXP)} 곱셈 ${mults} 번으로 얻었습니다. 차례로 곱하면 ${WALK_EXP} 번입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 지수를 두 방식으로 처리한 곱셈 횟수. */
  costTwoWays: () => {
    const rows = SCALES.map((e) => {
      if (binaryMults(e) !== bitLength(e) + oneBits(e)) {
        throw new Error(
          `${e} 에서 곱셈이 비트 수와 1 인 비트 수의 합이 아니다`,
        );
      }
      return [
        num(e),
        num(e),
        String(binaryMults(e)),
        String(bitLength(e)),
        String(oneBits(e)),
      ];
    });
    return [
      md(
        [
          "지수 exp",
          "차례로 곱하기",
          "반씩 줄이기",
          "비트 수 n",
          "1 인 비트 수 s",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `${SCALES.length} 규모 모두에서 반씩 줄이기의 곱셈 횟수가 n 과 s 를 더한 값과 같습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 홀수 보정 없이 제곱만 되풀이하는 후보를 반박한다. */
  squaringOnly: () => {
    const cases: Case[] = [
      WALK_CASE,
      C(3n, 16n, 1000n),
      C(2n, 10n, 1000n),
      C(5n, 7n, 100n),
      C(3n, 13n, 1000n),
    ];
    const rows = cases.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = squaringOnly(c.base, c.exp, c.mod);
      return [
        walkLabel(c),
        String(right),
        String(cand.value),
        String(cand.reached),
        verdict(right, cand.value),
      ];
    });
    const odd = cases[3] as Case;
    const oddReach = squaringOnly(odd.base, odd.exp, odd.mod).reached;
    const oddValue = fastPower(odd.base, oddReach, odd.mod);
    if (oddValue !== fastPower(odd.base, odd.exp, odd.mod)) {
      throw new Error("넷째 줄이 우연히 같은 자리가 아니다");
    }
    return [
      md(
        ["입력", "정본의 답", "제곱만 되풀이한 답", "실제로 구한 지수", "판정"],
        rows,
        [1, 2, 3],
      ),
      "",
      `넷째 줄은 ${odd.base}^${oddReach} mod ${odd.mod}${과와(odd.mod)} ${odd.base}^${odd.exp} mod ${odd.mod}${이가(odd.mod)} 둘 다 ${oddValue}${josa(String(oddValue), "이라", "라")} 같게 나왔고, 실제로 구한 지수는 ${oddReach} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (c) — 칸 하나를 읽는다. */
  powersRead: () => {
    const t = walk();
    const i = 3;
    const r = t.rounds[i];
    if (r === undefined) throw new Error("자리 3 이 없다");
    const e = 2n ** BigInt(i);
    const full = WALK_BASE ** e;
    if (full % WALK_MOD !== r.bIn)
      throw new Error("자리 3 의 b 가 정의와 다르다");
    return [
      `자리 ${i} 의 거듭제곱`,
      `  지수        2^${i} = ${e}`,
      `  값          ${WALK_BASE}^${e} = ${num(full)}`,
      `  법 안으로   ${num(full)} mod ${num(WALK_MOD)} = ${r.bIn}`,
      `  정본 기록   바퀴 ${i}${을를(i)} 시작할 때 b = ${r.bIn}`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (e) — 밑의 i 제곱과 비교한다. */
  powersVsLinear: () => {
    const t = walk();
    const powers = [...t.rounds.map((r) => r.bIn), t.rounds.at(-1)?.bOut ?? 0n];
    const rows = powers.map((p, i) => [
      String(i),
      String(2 ** i),
      String(p),
      String(i),
      String(WALK_BASE ** BigInt(i) % WALK_MOD),
    ]);
    const cells = powers.length;
    const reachDouble = 2 ** (cells - 1);
    const reachLinear = cells - 1;
    return [
      md(
        [
          "자리 i",
          "지수 2^i",
          `3^(2^i) mod ${WALK_MOD}`,
          "지수 i",
          `3^i mod ${WALK_MOD}`,
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `같은 ${cells} 칸으로 자리의 거듭제곱은 지수 ${reachDouble} 까지, 밑의 i 제곱은 지수 ${reachLinear} 까지 갑니다. 지수 ${WALK_EXP}${을를(WALK_EXP)} 만들려면 뒤쪽은 칸이 ${Number(WALK_EXP) + 1} 개 있어야 하고, 앞쪽은 ${bitLength(WALK_EXP)} 칸 중 켜진 ${oneBits(WALK_EXP)} 칸을 곱하면 됩니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 지수를 자리로 나눈다. */
  stage1Bits: () => {
    const t = walk();
    const rows = t.rounds.map((r) => [
      String(r.i),
      String(r.eIn),
      bin(r.eIn),
      String(r.bit),
      String(r.eIn >> 1n),
    ]);
    const read = t.rounds.map((r) => r.bit).join(" ");
    const low = bitsLow(WALK_EXP).join(" ");
    if (read !== low)
      throw new Error("읽은 비트가 낮은 자리부터의 비트가 아니다");
    return [
      md(
        ["바퀴", "e", "e 의 이진 표기", "e & 1", "e >> 1"],
        rows,
        [0, 1, 3, 4],
      ),
      "",
      `e 가 ${t.rounds.length} 바퀴 만에 0 이 됐고, 바퀴마다 읽은 e & 1 을 차례로 적은 ${read}${이가(read)} ${WALK_EXP} 의 비트를 자리 0 부터 적은 것입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 자리의 거듭제곱을 한 자리씩 만든다. */
  stage2Squares: () => {
    const t = walk();
    let maxProduct = 0n;
    const rows = t.rounds.map((r) => {
      const product = r.bIn * r.bIn;
      if (product > maxProduct) maxProduct = product;
      const want = WALK_BASE ** (2n ** BigInt(r.i + 1)) % WALK_MOD;
      if (want !== r.bOut) throw new Error(`자리 ${r.i + 1} 이 정의와 다르다`);
      return [
        String(r.i),
        String(r.bIn),
        num(product),
        String(r.bOut),
        String(want),
      ];
    });
    return [
      md(
        [
          "바퀴",
          "바퀴 시작 b",
          "b · b",
          "법으로 줄인 b",
          `3^(2^(i+1)) mod ${WALK_MOD}`,
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `${t.rounds.length} 바퀴 모두 제곱해 줄인 값이 정의대로 구한 다음 자리의 거듭제곱과 같습니다. 곱하기 전의 b 는 늘 ${num(WALK_MOD)} 미만이고, 곱한 값은 가장 커도 ${num(maxProduct)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 켜진 자리의 거듭제곱을 누적한다. */
  stage3Acc: () => {
    const t = walk();
    let before = t.init.result;
    const rows = t.rounds.map((r) => {
      const row = [
        String(r.i),
        String(r.bit),
        String(r.bIn),
        String(before),
        String(r.result),
      ];
      before = r.result;
      return row;
    });
    const on = t.rounds.filter((r) => r.bit === 1);
    const off = t.rounds.filter((r) => r.bit === 0);
    const offSquares = off.map((r) => `${r.bIn} → ${r.bOut}`).join(", ");
    return [
      md(
        ["자리 i", "비트", "바퀴 시작 b", "바퀴 시작 result", "바퀴 끝 result"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `result 는 비트가 1 인 ${on.length} 바퀴에서만 바뀌었습니다. 비트가 0 인 자리 ${off.map((r) => r.i).join(" · ")} 에서도 b 는 ${offSquares}${으로(String(off.at(-1)?.bOut))} 제곱됐고, 그 값을 다음 자리가 썼습니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 켜진 자리의 거듭제곱만 곱하면 답이다. */
  onBitsProduct: () => {
    const t = walk();
    const on = t.rounds.filter((r) => r.bit === 1);
    let product = 1n % WALK_MOD;
    for (const r of on) product = (product * r.bIn) % WALK_MOD;
    const places = on.map((r) => 2 ** r.i);
    if (places.reduce((a, b) => a + b, 0) !== Number(WALK_EXP)) {
      throw new Error("켜진 자리의 합이 지수가 아니다");
    }
    return [
      `켜진 자리          ${on.map((r) => r.i).join(" · ")}`,
      `그 자리의 지수     ${places.join(" + ")} = ${WALK_EXP}`,
      `그 자리의 거듭제곱 ${on.map((r) => r.bIn).join(" · ")} mod ${WALK_MOD} = ${product}`,
      `정본의 답          ${t.answer}`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 나누는 수 k 를 여러 개로 두고 곱셈 횟수를 잰다. */
  foldRadix: () => {
    const ks = [2n, 3n, 4n, 8n, 10n];
    const rows: string[][] = [
      ["차례로 곱하기", num(WALK_EXP), num(LIMIT)],
      ...ks.map((k) => [
        `k = ${k}`,
        num(radixMults(WALK_EXP, k)),
        num(radixMults(LIMIT, k)),
      ]),
    ];
    const least = (e: bigint) =>
      ks.reduce((a, k) => (radixMults(e, k) < radixMults(e, a) ? k : a));
    if (least(WALK_EXP) !== 2n || least(LIMIT) !== 2n) {
      throw new Error("k = 2 가 가장 적지 않다");
    }
    const digitSum = [...LIMIT.toString(10)].reduce((a, c) => a + Number(c), 0);
    const tenBeatsEight = radixMults(LIMIT, 10n) < radixMults(LIMIT, 8n);
    return [
      md(["나누는 수", "지수 26 의 곱셈", "지수 10^18 의 곱셈"], rows, [1, 2]),
      "",
      `k 를 쓰는 다섯 줄 가운데 두 지수 모두 k = 2 가 가장 적습니다. 10^18 을 십진법으로 적으면 자리 숫자의 합이 ${digitSum}${이가(digitSum)}라 누적 곱셈이 ${digitSum} 번뿐이고, 그래서 k = 10 이 k = 8 보다 ${tenBeatsEight ? "적습니다" : "적지 않습니다"}.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 입력. */
  walkInput: () =>
    [
      `const [base, exp, mod] = [${WALK_BASE}n, ${WALK_EXP}n, ${WALK_MOD}n];`,
      `// 이 절이 끝나면 ${fastPower(WALK_BASE, WALK_EXP, WALK_MOD)}n 이 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 1 — 두 값을 법 안으로 옮긴 결과. */
  walkInit: () => {
    const t = walk();
    return [
      `T1 이 끝난 시점 — base = ${WALK_BASE}, exp = ${WALK_EXP}, mod = ${WALK_MOD}`,
      `  result = ${t.init.result}`,
      `  b      = ${t.init.b}`,
      `  e      = ${WALK_EXP}`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 경계에 있는 입력에서 두 줄이 내는 값. */
  walkInitEdges: () => {
    const cases: [bigint, bigint][] = [
      [5n, 1n],
      [-3n, 5n],
      [1005n, 1000n],
      [WALK_BASE, WALK_MOD],
    ];
    const rows = cases.map(([base, mod]) => {
      const one = 1n % mod;
      const moved = ((base % mod) + mod) % mod;
      // 지수 1 이면 정본의 답이 옮긴 밑 그 자체다(mod = 1 이면 0).
      if (fastPower(base, 1n, mod) !== moved)
        throw new Error("옮긴 밑이 정본과 다르다");
      return [
        `base = ${base}, mod = ${mod}`,
        String(one),
        String(base % mod),
        String(moved),
      ];
    });
    return [
      md(
        ["입력", "1n % mod", "base % mod", "((base % mod) + mod) % mod"],
        rows,
        [1, 2, 3],
      ),
      "",
      `base % mod 가 음수로 나온 줄은 ${rows.filter((r) => (r[2] ?? "").startsWith("-")).length} 개이고, mod 를 더해 한 번 더 줄이면 모든 줄이 0 이상 mod 미만이 됩니다.`,
    ].join("\n");
  },

  /** 짚고 가기 1 — 나머지를 마지막에 한 번만 구했을 때, 그리고 정본을 number 로 옮겼을 때. */
  pauseLastMod: () => {
    const bigCases: Case[] = [
      WALK_CASE,
      C(3n, 40n, 1000n),
      C(2n, 64n, 1000n),
      C(7n, 50n, 13n),
    ];
    const bigRows = bigCases.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = lastModBig(c.base, c.exp, c.mod);
      return [
        walkLabel(c),
        String(right),
        String(cand),
        num((c.base ** c.exp).toString().length),
        verdict(right, cand),
      ];
    });
    const digitRows = [26n, 1000n, 100000n].map((e) => [
      num(e),
      num((3n ** e).toString().length),
    ]);
    digitRows.push([
      num(LIMIT),
      `약 ${(Number(LIMIT) * Math.log10(3)).toExponential(4)}`,
    ]);
    const numberCases: Case[] = [
      C(3n, 33n, 1000n),
      C(3n, 34n, 1000n),
      C(3n, 40n, 1000n),
      C(2n, 1023n, 1000n),
      C(2n, 1024n, 1000n),
    ];
    const numberRows = numberCases.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = lastModNumber(Number(c.base), Number(c.exp), Number(c.mod));
      return [label(c), String(right), String(cand), verdict(right, cand)];
    });
    let first = 0;
    while (3n ** BigInt(first) <= TWO53) first++;
    const overflow = 2 ** 1024;
    return [
      md(
        ["입력", "정본의 답", "마지막에 한 번만", "중간값의 자릿수", "판정"],
        bigRows,
        [1, 2, 3],
      ),
      "",
      "밑이 3 일 때 중간값의 자릿수는 지수를 따라 커집니다.",
      "",
      md(["지수 exp", "3^exp 의 자릿수"], digitRows, [0, 1]),
      "",
      "같은 방법을 number 로 하면 답이 어긋납니다.",
      "",
      md(
        ["입력", "정본의 답", "number 로 마지막에 한 번만", "판정"],
        numberRows,
        [1, 2],
      ),
      "",
      `밑이 3 일 때 3^exp 가 2^53 = ${num(TWO53)} 보다 커지는 첫 지수는 ${first} 이고, number 로 2^1024 를 계산하면 ${overflow} 가 됩니다.`,
    ].join("\n");
  },

  /** 짚고 가기 1 — 매 곱셈 뒤에 줄여도 number 로는 곱이 넘친다. */
  pauseNumberPort: () => {
    const cases: Case[] = [
      WALK_CASE,
      C(3n, LIMIT, PRIME),
      C(2n, 10n ** 9n, PRIME),
    ];
    const rows = cases.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const port = numberPort(Number(c.base), Number(c.exp), Number(c.mod));
      return [
        c === WALK_CASE
          ? walkLabel(c)
          : `${c.base}^(${c.exp === LIMIT ? "10^18" : "10^9"}) mod ${num(c.mod)}`,
        String(right),
        String(port.value),
        num(port.maxProduct),
        port.maxProduct > TWO53 ? "예" : "아니요",
        verdict(right, port.value),
      ];
    });
    return [
      md(
        [
          "입력",
          "정본의 답",
          "number 로 옮긴 사본",
          "가장 큰 중간 곱",
          "2^53 초과",
          "판정",
        ],
        rows,
        [1, 2, 3],
      ),
      "",
      `법이 ${num(WALK_MOD)} 이면 가장 큰 곱도 2^53 아래라 number 로 옮긴 사본이 맞고, 법이 ${num(PRIME)} 이면 곱이 2^53 을 넘어 답이 어긋납니다.`,
    ].join("\n");
  },

  /** `deep.walk` 2 — 반복문 앞 세 바퀴. */
  walkLoopHead: () => {
    const t = walk();
    const rows = t.rounds
      .slice(0, 3)
      .map((r) => [
        `T${r.i + 2}`,
        String(r.eIn),
        String(r.bit),
        String(r.bIn),
        String(r.result),
        String(r.bOut),
        String(r.eIn >> 1n),
      ]);
    const es = t.rounds.map((r) => String(r.eIn)).join(" · ");
    const on = t.rounds.filter((r) => r.bit === 1).length;
    return [
      md(
        [
          "걸음",
          "바퀴 시작 e",
          "이번 비트",
          "바퀴 시작 b",
          "③ 뒤 result",
          "④ 뒤 b",
          "⑤ 뒤 e",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `② 는 e 가 ${es} 일 때 참이고 0 에서 처음 거짓이 됩니다. ③ 은 ${t.rounds.length} 바퀴 중 ${on} 바퀴에서만 실행되고 ④ · ⑤ 는 ${t.rounds.length} 바퀴 다 실행됩니다.`,
    ].join("\n");
  },

  /** 짚고 가기 2 — 제곱을 먼저 했을 때. */
  pauseSquareFirst: () => {
    const cases: Case[] = [
      WALK_CASE,
      C(2n, 10n, 7n),
      C(2n, 13n, 5n),
      C(7n, 0n, 13n),
      C(10n, 4n, 9n),
    ];
    const rows = cases.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = squareFirst(c.base, c.exp, c.mod).value;
      return [walkLabel(c), String(right), String(cand), verdict(right, cand)];
    });
    const last = cases[4] as Case;
    return [
      md(["입력", "정본의 답", "제곱을 먼저 한 답", "판정"], rows, [1, 2]),
      "",
      `지수가 0 이면 바퀴가 없어 같고, ${label(last)}${은는(label(last))} ${last.base} mod ${last.mod}${이가(last.mod)} ${last.base % last.mod}${josa(String(last.base % last.mod), "이라", "라")} 몇 번 제곱해도 ${last.base % last.mod} 입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 2 — 자리 1 의 비트를 볼 때 곱해지는 b. */
  pauseSquareFirstPlace: () => {
    const t = walk();
    const r = t.rounds[1];
    const swapped = squareFirst(WALK_BASE, WALK_EXP, WALK_MOD).used[1];
    if (r === undefined || swapped === undefined)
      throw new Error("자리 1 이 없다");
    const expOf = (v: bigint) => {
      for (let k = 0n; k < 64n; k++) {
        if (WALK_BASE ** (2n ** k) % WALK_MOD === v) return 2n ** k;
      }
      throw new Error("자리의 거듭제곱이 아니다");
    };
    return [
      "전개 입력에서 자리 1 의 비트를 볼 때 곱해지는 b",
      `  정상 순서   ${WALK_BASE}^${expOf(r.bIn)} = ${r.bIn}`,
      `  바꾼 순서   ${WALK_BASE}^${expOf(swapped)} = ${swapped}`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 걸음마다의 상태값과 조건 판정. */
  walkTrace: () => {
    const t = walk();
    const rows: string[][] = [
      [
        "T1",
        "—",
        "—",
        String(t.init.result),
        String(t.init.b),
        String(WALK_EXP),
      ],
      ...t.rounds.map((r) => [
        `T${r.i + 2}`,
        `${r.eIn} > 0 **참**`,
        `${r.eIn} & 1 = ${r.bit} → ${r.bit === 1 ? "③ 실행" : "③ 건너뜀"}`,
        String(r.result),
        String(r.bOut),
        String(r.eIn >> 1n),
      ]),
      [
        `T${t.rounds.length + 2}`,
        "0 > 0 **거짓**",
        "—",
        String(t.answer),
        "—",
        "—",
      ],
    ];
    const last = t.rounds.at(-1);
    return [
      md(["걸음", "② e > 0", "이번 비트", "result", "b", "e"], rows, [3, 4, 5]),
      "",
      `모듈러 곱셈은 모두 ${last?.mults} 번이고, 돌려주는 값은 ${t.answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 라벨마다 실행된 걸음. */
  walkBranches: () => {
    const t = walk();
    const at = (rs: readonly { i: number }[]) =>
      rs.map((r) => `T${r.i + 2}`).join(" · ");
    const on = t.rounds.filter((r) => r.bit === 1);
    const off = t.rounds.filter((r) => r.bit === 0);
    const all = at(t.rounds);
    const end = `T${t.rounds.length + 2}`;
    return md(
      ["라벨", "하는 일", "전개에서"],
      [
        ["①", "초기화", "T1 에서 한 번"],
        ["②", "남은 비트가 있는가", `${all} 에서 참 · ${end} 에서 거짓`],
        [
          "③",
          "비트가 1 이면 누적",
          `${at(on)} 에서 실행 · ${at(off)} 에서 건너뜀`,
        ],
        [
          "④",
          "다음 자리의 거듭제곱을 만든다",
          `${all} 에서 ${t.rounds.length} 번`,
        ],
        ["⑤", "다음 비트로 옮긴다", `${all} 에서 ${t.rounds.length} 번`],
      ],
    );
  },

  /** `deep.walk.final` — 전체 코드 아래의 호출 몇 개. */
  finalCalls: () => {
    const calls: Case[] = [
      WALK_CASE,
      C(2n, 10n, 1000n),
      C(123n, 0n, 1000n),
      C(5n, 100n, 1n),
      C(-3n, 3n, 5n),
      C(1005n, 2n, 1000n),
    ];
    const lines = calls.map((c) => {
      const call = `fastPower(${c.base}n, ${c.exp}n, ${c.mod}n)`;
      return `${call.padEnd(32)}→ ${fastPower(c.base, c.exp, c.mod)}n`;
    });
    return lines.join("\n");
  },

  /** `related` — 곱셈 자리만 바꾼 같은 절차. */
  relatedMonoid: () => {
    const t = walk();
    const intValue = powWith(
      WALK_BASE,
      WALK_EXP,
      (a, b) => (a * b) % WALK_MOD,
      1n % WALK_MOD,
    );
    if (intValue !== t.answer) throw new Error("정수 사례가 정본과 다르다");
    const M: Mat = [
      [1n, 1n],
      [1n, 0n],
    ];
    const I: Mat = [
      [1n, 0n],
      [0n, 1n],
    ];
    const P = powWith(M, WALK_EXP, matMul(WALK_MOD), I);
    let f0 = 0n;
    let f1 = 1n;
    for (let k = 0n; k < WALK_EXP; k++) [f0, f1] = [f1, f0 + f1];
    if (P[0][1] !== f0 % WALK_MOD)
      throw new Error("행렬 사례가 피보나치 수와 다르다");
    const s = powWith("ab", WALK_EXP, (a, b) => a + b, "");
    if (s !== "ab".repeat(Number(WALK_EXP)))
      throw new Error("문자열 사례가 어긋난다");
    const on = t.rounds.filter((r) => r.bit === 1).map((r) => r.i);
    return [
      md(
        [
          "밑",
          "곱셈 자리의 연산",
          "항등원",
          `지수 ${WALK_EXP}${으로(WALK_EXP)} 만든 값`,
        ],
        [
          [
            `법 ${WALK_MOD} 의 정수 ${WALK_BASE}`,
            "곱한 뒤 나머지",
            "1",
            String(intValue),
          ],
          [
            "2×2 행렬 [[1,1],[1,0]]",
            `행렬 곱(법 ${WALK_MOD})`,
            "단위 행렬",
            `[[${P[0][0]},${P[0][1]}],[${P[1][0]},${P[1][1]}]]`,
          ],
          [
            '문자열 "ab"',
            "이어 붙이기",
            "빈 문자열",
            `길이 ${s.length} 의 문자열`,
          ],
        ],
      ),
      "",
      `세 경우 모두 켜진 자리 ${on.join(" · ")} 의 값만 곱했습니다. 행렬의 오른쪽 위 칸 ${P[0][1]}${은는(String(P[0][1]))} 피보나치 수 F(${WALK_EXP}) = ${num(f0)}${을를(num(f0))} ${num(WALK_MOD)}${으로(num(WALK_MOD))} 나눈 나머지입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  mathCheck: () => {
    const t = walk();
    const rows = t.rounds.map((r) => [
      `i = ${r.i}`,
      String(2 ** r.i),
      String(r.bit),
      String(r.bIn),
    ]);
    const on = t.rounds.filter((r) => r.bit === 1);
    let product = 1n % WALK_MOD;
    for (const r of on) product = (product * r.bIn) % WALK_MOD;
    const n = t.rounds.length;
    const s = on.length;
    if (product !== t.answer) throw new Error("검산이 정본과 다르다");
    return [
      md(
        ["자리", "2^i", "c_i", `β_i = 3^(2^i) mod ${WALK_MOD}`],
        rows,
        [1, 2, 3],
      ),
      "",
      `켜진 자리의 β 만 곱하면 ${on.map((r) => r.bIn).join(" · ")} mod ${WALK_MOD} = ${product} 이고, 켜진 자리의 2^i 를 더하면 ${on.map((r) => 2 ** r.i).join(" + ")} = ${WALK_EXP} 입니다. n = ${n}, s = ${s}, n + s = ${n + s} 이고, 정본의 답 ${t.answer}${과와(String(t.answer))} 같습니다.`,
    ].join("\n");
  },

  /** `deep.math` ③ — (k − 1) / ln k 를 값으로 낸다. */
  mathRadix: () => {
    const rows = [2, 3, 4, 8, 10].map((k) => [
      String(k),
      String(k - 1),
      Math.log(k).toFixed(4),
      ((k - 1) / Math.log(k)).toFixed(4),
    ]);
    return [
      md(["k", "k − 1", "ln k", "(k − 1) / ln k"], rows, [0, 1, 2, 3]),
      "",
      "다섯 값 가운데 k = 2 가 가장 작습니다.",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태와 실측을 맞추고 과제 규모의 계수를 낸다. */
  mathScale: () => {
    const rows = SCALES.map((e) => {
      const n = bitLength(e);
      if (binaryMults(e) !== n + oneBits(e))
        throw new Error("닫힌 형태가 실측과 다르다");
      return [
        num(e),
        String(n),
        String(oneBits(e)),
        String(binaryMults(e)),
        String(n + oneBits(e)),
        String(n + 1),
        String(2 * n),
      ];
    });
    return [
      md(
        ["지수 exp", "n", "s", "실측 곱셈", "n + s", "하한 n + 1", "상한 2n"],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `실측과 닫힌 형태가 ${SCALES.length} 규모에서 같습니다. 과제 규모 10^18 의 곱셈은 ${binaryMults(LIMIT)} 번이고, 차례로 곱하는 방법의 ${num(LIMIT)} 번과 비교하면 자릿수가 ${LIMIT.toString().length} 에서 ${String(binaryMults(LIMIT)).length}${으로(String(binaryMults(LIMIT)).length)} 줄었습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 바퀴를 시작할 때마다 불변식의 두 쪽을 값으로. */
  invariantRounds: () => {
    const t = walk();
    const want = byDefinition(WALK_BASE, WALK_EXP, WALK_MOD);
    const points: { at: string; result: bigint; b: bigint; e: bigint }[] = [];
    let result = t.init.result;
    for (const r of t.rounds) {
      points.push({ at: `바퀴 ${r.i} 시작`, result, b: r.bIn, e: r.eIn });
      result = r.result;
    }
    const last = t.rounds.at(-1);
    points.push({
      at: "반복이 끝난 뒤",
      result,
      b: last?.bOut ?? t.init.b,
      e: 0n,
    });
    const rows = points.map((p) => {
      const left = (p.result * (p.b ** p.e % WALK_MOD)) % WALK_MOD;
      if (left !== want) throw new Error(`${p.at} 에서 불변식이 거짓이다`);
      return [
        p.at,
        String(p.result),
        String(p.b),
        String(p.e),
        String(left),
        String(want),
      ];
    });
    return [
      md(
        [
          "시점",
          "result",
          "b",
          "e",
          `result · b^e mod ${WALK_MOD}`,
          `3^26 mod ${WALK_MOD}`,
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${points.length} 시점 모두에서 두 값이 ${want}${으로(String(want))} 같습니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  invariantEdges: () => {
    const cases: [string, Case, string][] = [
      ["exp = 0", C(123n, 0n, 1000n), "반복문이 한 번도 실행되지 않는다"],
      ["mod = 1", C(5n, 100n, 1n), "result 의 시작값이 0 이다"],
      ["base = 0, exp = 0", C(0n, 0n, 7n), "반복문이 없다"],
      [
        "base = 0, exp > 0",
        C(0n, 5n, 7n),
        "첫 켜진 자리에서 result 가 0 이 된다",
      ],
      ["base 가 음수", C(-3n, 3n, 5n), "시작에서 [0, mod) 로 옮긴다"],
      ["base 가 mod 보다 크다", C(1005n, 2n, 1000n), "시작에서 mod 로 줄인다"],
      ["exp 가 2 의 거듭제곱", C(3n, 1024n, 1000n), "켜진 자리가 하나뿐이다"],
    ];
    const rows = cases.map(([name, c, where]) => {
      const got = fastPower(c.base, c.exp, c.mod);
      const want = byDefinition(c.base, c.exp, c.mod);
      return [`${name} (${label(c)})`, where, String(got), String(want)];
    });
    const pow2 = cases[6]?.[1] as Case;
    return [
      md(
        ["입력", "처리되는 자리", "정본의 답", "정의로 구한 값"],
        rows,
        [2, 3],
      ),
      "",
      `${rows.length} 입력 모두에서 정본의 답이 정의로 구한 값과 같습니다. 마지막 줄의 곱셈은 ${binaryMults(pow2.exp)} 번으로 비트 수 ${bitLength(pow2.exp)} 에 1 을 더한 값입니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 제곱하던 줄을 없앤 변이. */
  mutantNoSquare: () => {
    const cases: Case[] = [
      WALK_CASE,
      C(2n, 10n, 1000n),
      C(3n, 5n, 100n),
      C(2n, 1n, 7n),
      C(7n, 0n, 13n),
    ];
    const rows = cases.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = noSquare.fastPower(c.base, c.exp, c.mod);
      return [walkLabel(c), String(right), String(cand), verdict(right, cand)];
    });
    return md(["입력", "정본의 답", "제곱을 없앤 답", "판정"], rows, [1, 2]);
  },

  /** `invariant` ③ — 전개 입력에서 두 b 가 갈리는 자리. */
  mutantNoSquarePlaces: () => {
    const t = walk();
    const ref = t.rounds.map((r) => String(r.bIn)).join(" ");
    const stuck = t.rounds.map(() => String(t.init.b)).join(" ");
    const on = t.rounds.filter((r) => r.bit === 1).length;
    const got = noSquare.fastPower(WALK_BASE, WALK_EXP, WALK_MOD);
    return [
      "전개 입력에서 바퀴를 시작할 때의 b",
      `  정본           ${ref}`,
      `  제곱을 없앤 것 ${stuck}`,
      `  변이가 낸 답   ${got}   (1 인 비트 ${on} 개)`,
    ].join("\n");
  },

  /** `perf.derive` — 걸음별 곱셈 수. */
  perfCount: () => {
    const t = walk();
    const loops = t.rounds.length;
    const accs = t.rounds.filter((r) => r.bit === 1).length;
    const total = t.rounds.at(-1)?.mults ?? 0;
    if (total !== loops + accs)
      throw new Error("곱셈 수가 제곱과 누적의 합이 아니다");
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "바퀴",
        `T2 ~ T${loops + 1}`,
        String(loops),
        "1",
        "0 또는 1",
        String(total),
      ],
      ["반환", `T${loops + 2}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(total)],
    ];
    return [
      md(
        [
          "무리",
          "걸음",
          "걸음 수",
          "걸음마다 제곱",
          "걸음마다 누적",
          "이 입력의 곱셈",
        ],
        rows,
        [2, 3, 4, 5],
      ),
      "",
      `제곱 ${loops} 번과 누적 ${accs} 번입니다. 앞은 비트 수 n 이고 뒤는 1 인 비트 수 s 입니다.`,
    ].join("\n");
  },

  /** `perf.bounds` — 과제 규모에서 총식의 값. */
  perfTotal: () => {
    const n = bitLength(LIMIT);
    const s = oneBits(LIMIT);
    return [
      "exp = 10^18 에서",
      `  n = ⌊log2 exp⌋ + 1   ${n}`,
      `  s                    ${s}`,
      `  모듈러 곱셈 n + s    ${binaryMults(LIMIT)}`,
      "  저장 칸              result · b · e 셋",
    ].join("\n");
  },

  /** `perf.worst` — 최악을 만드는 지수. */
  worstShape: () => {
    const worst = mostOneBitsAtMost(LIMIT);
    const allOnes = (1n << 59n) - 1n;
    const powerOfTwo = 1n << 59n;
    const cases: [string, bigint][] = [
      ["2^59", powerOfTwo],
      ["10^18 (과제의 상한)", LIMIT],
      ["2^59 − 1", allOnes],
      ["2^59 + 2^58 − 1", worst],
    ];
    if (worst !== (1n << 59n) + (1n << 58n) - 1n)
      throw new Error("최악 지수의 모양이 다르다");
    const rows = cases.map(([name, e]) => [
      name,
      num(e),
      String(bitLength(e)),
      String(oneBits(e)),
      String(binaryMults(e)),
    ]);
    const ratio = Math.round((Number(allOnes) / Number(LIMIT)) * 100);
    return [
      md(
        [
          "지수의 모양",
          "지수 exp",
          "비트 수 n",
          "1 인 비트 수 s",
          "곱셈 n + s",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `상한 아래에서 곱셈이 가장 많은 지수는 마지막 줄의 ${num(worst)} 이고 ${binaryMults(worst)} 번입니다. 셋째 줄의 지수는 상한의 약 ${ratio}% 인데 곱셈이 ${binaryMults(allOnes)} 번으로 상한의 ${binaryMults(LIMIT)} 번보다 많습니다.`,
    ].join("\n");
  },

  /** `selfcheck` — 마지막 바퀴의 제곱. */
  selfcheckT6: () => {
    const last = walk().rounds.at(-1);
    if (last === undefined) throw new Error("바퀴가 없다");
    return [
      `T${last.i + 2}   e = ${last.eIn}   비트 ${last.bit}   b = ${last.bIn}   result → ${last.result}   ④ 가 b 를 ${last.bOut}${으로(String(last.bOut))} 만든다`,
    ].join("\n");
  },

  /** `selfcheck` 답 — 마지막 제곱을 건너뛰면 아끼는 곱셈. */
  selfcheckSkipLast: () => {
    const rows = [WALK_EXP, LIMIT].map((e) => {
      const m = binaryMults(e);
      return [
        e === LIMIT ? "10^18" : String(e),
        String(m),
        String(m - 1),
        `${((1 / m) * 100).toFixed(1)}%`,
      ];
    });
    return md(
      ["지수 exp", "매 바퀴 제곱", "마지막 제곱을 건너뜀", "줄어든 비율"],
      rows,
      [1, 2, 3],
    );
  },
};
