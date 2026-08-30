/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/fastPower/fastPower-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { fastPower } from "./fastPower-guide.ref.ts";

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
 * 지수 26 의 이진 표현이 `11010` 이라 **0 인 비트와 1 인 비트가 둘 다 나오고**, 최하위
 * 비트가 0 이라 첫 바퀴에서 누적을 건너뛰는 갈래가 먼저 실행된다. 밑 3 과 법 1,000 은
 * 중간값이 세 자리 안에 들어와 표로 읽힌다.
 */
const WALK_BASE = 3n;
const WALK_EXP = 26n;
const WALK_MOD = 1000n;

/** 제약의 최댓값. */
const LIMIT = 10n ** 18n;

/** 견주기의 기준으로 쓰는 처리 속도. */
const PER_SECOND = 100_000_000n;

/** 1 년을 초로 센 값 — 365 일 기준. */
const YEAR_SECONDS = 31_536_000n;

/* ────────────────────────── 계측기 ────────────────────────── */

const bitLength = (n: bigint): number => (n === 0n ? 0 : n.toString(2).length);

const oneBits = (n: bigint): number => {
  let count = 0;
  let x = n;
  while (x > 0n) {
    if ((x & 1n) === 1n) count++;
    x >>= 1n;
  }
  return count;
};

/** 이진법 절차가 실제로 하는 곱셈 횟수. 바퀴마다 제곱 하나, 1 인 비트마다 누적 하나다. */
function binaryMults(exp: bigint): number {
  let e = exp;
  let mults = 0;
  while (e > 0n) {
    if ((e & 1n) === 1n) mults++;
    mults++;
    e >>= 1n;
  }
  return mults;
}

/**
 * **`k` 로 접는 절차의 곱셈 횟수.** 지수를 `k` 로 나눠 내려가되, 자리마다 밑을 `k` 제곱하고
 * (곱셈 `k − 1` 번) 그 자리 숫자만큼 누적한다(곱셈 `d` 번). `k = 2` 가 이 글의 절차다.
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
 * 홀수 보정 없이 **제곱만 반복하는 후보.** 지수 이하의 가장 큰 2 의 거듭제곱까지만 도달한다.
 */
function squaringOnly(base: bigint, exp: bigint, mod: bigint): bigint {
  if (exp === 0n) return 1n % mod;
  let b = ((base % mod) + mod) % mod;
  let reach = 1n;
  while (reach * 2n <= exp) {
    b = (b * b) % mod;
    reach *= 2n;
  }
  return b;
}

/** 제곱만 반복하는 후보가 실제로 구해 낸 지수. */
function reachedExponent(exp: bigint): bigint {
  if (exp === 0n) return 0n;
  let reach = 1n;
  while (reach * 2n <= exp) reach *= 2n;
  return reach;
}

/**
 * **두 줄의 자리를 바꾼 사본** — 밑을 먼저 제곱하고 그다음에 비트를 본다. 두 줄을 맞바꾼
 * 것이라 `loadMutant`(한 줄 치환)로는 만들 수 없어 여기 따로 적는다.
 */
function squareFirst(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n % mod;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0n) {
    b = (b * b) % mod;
    if ((e & 1n) === 1n) result = (result * b) % mod;
    e >>= 1n;
  }
  return result;
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

/** 걸음마다의 상태값. `deep.walk` 와 `.sim.ts` 가 같은 표를 쓴다. */
interface Step {
  label: string;
  e: string;
  bit: string;
  bIn: string;
  result: bigint;
  bOut: string;
  eOut: string;
  /** 바퀴를 실제로 한 걸음인가. 초기화와 종료는 아니다. */
  loop: boolean;
  bInValue: bigint;
}

function trace(base: bigint, exp: bigint, mod: bigint): Step[] {
  const out: Step[] = [];
  let result = 1n % mod;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  out.push({
    label: "T1",
    e: String(e),
    bit: "-",
    bIn: String(b),
    result,
    bOut: "-",
    eOut: "-",
    loop: false,
    bInValue: b,
  });
  let t = 1;
  while (e > 0n) {
    t++;
    const eIn = e;
    const bIn = b;
    const bit = e & 1n;
    if (bit === 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
    out.push({
      label: `T${t}`,
      e: String(eIn),
      bit: String(bit),
      bIn: String(bIn),
      result,
      bOut: String(b),
      eOut: String(e),
      loop: true,
      bInValue: bIn,
    });
  }
  out.push({
    label: `T${t + 1}`,
    e: String(e),
    bit: "-",
    bIn: "-",
    result,
    bOut: "-",
    eOut: "-",
    loop: false,
    bInValue: b,
  });
  return out;
}

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

const REF = new URL("./fastPower-guide.ref.ts", import.meta.url).pathname;

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

const label = (c: Case): string => `${c.base}^${c.exp} mod ${c.mod}`;

const walkLabel = (c: Case): string =>
  c === WALK_CASE ? `전개 입력 ${label(c)}` : label(c);

/** 「제곱만 반복」 후보가 갈리는 자리를 담은 목록. */
const SQUARE_ONLY_CASES: Case[] = [
  WALK_CASE,
  C(3n, 16n, 1000n),
  C(2n, 10n, 1000n),
  C(5n, 7n, 100n),
  C(3n, 13n, 1000n),
];

/** 「제곱을 먼저」 사본이 갈리는 자리를 담은 목록. */
const SQUARE_FIRST_CASES: Case[] = [
  WALK_CASE,
  C(2n, 10n, 7n),
  C(2n, 13n, 5n),
  C(7n, 0n, 13n),
  C(10n, 4n, 9n),
];

/** 제곱을 없앤 변이가 갈리는 자리를 담은 목록. */
const NO_SQUARE_CASES: Case[] = [
  WALK_CASE,
  C(2n, 10n, 1000n),
  C(3n, 5n, 100n),
  C(2n, 1n, 7n),
  C(7n, 0n, 13n),
];

/** 「마지막에 한 번만 나머지」를 bigint 로 했을 때. */
const LAST_MOD_CASES: Case[] = [
  WALK_CASE,
  C(3n, 40n, 1000n),
  C(2n, 64n, 1000n),
  C(7n, 50n, 13n),
];

/** 같은 것을 `number` 로 했을 때. */
const LAST_MOD_NUMBER_CASES: Case[] = [
  C(3n, 33n, 1000n),
  C(3n, 34n, 1000n),
  C(3n, 40n, 1000n),
  C(2n, 1023n, 1000n),
  C(2n, 1024n, 1000n),
];

const SCALES: bigint[] = [26n, 1000n, 10n ** 6n, 10n ** 9n, LIMIT];

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 차례로 곱하는 방법을 제약 규모에서 반박한다. */
  costNaive: () => {
    const rows = SCALES.map((e) => [
      num(e),
      num(e),
      `${(Number(e) / Number(PER_SECOND)).toLocaleString("en-US", {
        maximumFractionDigits: 8,
      })} 초`,
    ]);
    const body = table(["지수 exp", "곱셈 횟수", "초당 1 억 번이면"], rows, [
      "r",
      "r",
      "r",
    ]);
    const seconds = LIMIT / PER_SECOND;
    return [
      body,
      "",
      `마지막 줄의 ${num(seconds)} 초는 약 ${num(seconds / YEAR_SECONDS)} 년이다`,
      "└ 제약이 지수 10^18 을 허용하므로 이 방법은 후보가 아니다",
    ].join("\n");
  },

  /** `deep.build` ③ — 지수를 절반씩 접어 내려간 사슬을 값으로 잇는다. */
  foldChain: () => {
    const chain: bigint[] = [];
    for (let e = WALK_EXP; e > 0n; e /= 2n) chain.push(e);
    chain.reverse();
    const rows: string[][] = [["3^0", "-", "1", "0"]];
    let acc = 1n;
    let mults = 0;
    for (const e of chain) {
      const squared = acc * acc;
      let step = "제곱";
      let value = squared;
      mults++;
      if (e % 2n === 1n) {
        value = squared * WALK_BASE;
        step = "제곱 뒤 밑을 한 번 더";
        mults++;
      }
      rows.push([`3^${e}`, step, num(value), String(mults)]);
      acc = value;
    }
    return [
      table(["구하는 값", "직전 값으로 하는 일", "값", "누적 곱셈"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      `└ 3^26 을 ${mults} 번의 곱셈으로 얻었다. 차례로 곱하면 ${WALK_EXP} 번이다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 지수를 두 방식으로 처리한 곱셈 횟수. */
  costTwoWays: () => {
    const rows = SCALES.map((e) => [
      num(e),
      num(e),
      String(binaryMults(e)),
      String(bitLength(e)),
      String(oneBits(e)),
    ]);
    return [
      table(
        [
          "지수 exp",
          "차례로 곱한다",
          "절반씩 접는다",
          "비트 수 n",
          "1 인 비트 s",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      "└ 셋째 열은 지수의 크기가 아니라 자릿수를 따라간다. 넷째 열과 다섯째 열을 더한 값이다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 홀수 보정 없이 제곱만 반복하는 후보를 반박한다. */
  squaringOnly: () => {
    const rows = SQUARE_ONLY_CASES.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = squaringOnly(c.base, c.exp, c.mod);
      return [
        walkLabel(c),
        String(right),
        String(cand),
        String(reachedExponent(c.exp)),
        right === cand ? "같다" : "틀리다",
      ];
    });
    return [
      table(
        [
          "입력",
          "정본이 낸 답",
          "제곱만 반복한 답",
          "실제로 구한 지수",
          "판정",
        ],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 지수가 2 의 거듭제곱이면 같은 값이 나온다. 넷째 줄은 5^4 와 5^7 이 법 100 에서",
      "  우연히 같은 자리라 판정이 「같다」로 나온 것이고, 후보가 옳아서가 아니다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 접는 비율을 여러 개로 두고 곱셈 횟수를 잰다. */
  foldRadix: () => {
    const ks = [2n, 3n, 4n, 8n, 10n];
    const rows: string[][] = [
      ["접지 않고 차례로 곱한다", num(WALK_EXP), num(LIMIT)],
      ...ks.map((k) => [
        `k = ${k}`,
        num(radixMults(WALK_EXP, k)),
        num(radixMults(LIMIT, k)),
      ]),
    ];
    return [
      table(["접는 방법", "지수 26 의 곱셈", "지수 10^18 의 곱셈"], rows, [
        "l",
        "r",
        "r",
      ]),
      "",
      "└ 첫 줄은 접지 않는 방법이라 k 의 식에 들어가지 않고, 견줄 기준으로만 둔다.",
      "  나머지 다섯 줄 중 두 지수 모두 k = 2 가 가장 적다. k = 10 이 k = 8 보다 적은 것은",
      "  10^18 이 십진법에서 1 뒤에 0 이 열여덟 개라 자리 보정 곱셈이 한 번뿐이기 때문이다",
    ].join("\n");
  },

  /** `deep.walk` — 걸음마다의 상태값. */
  walkTrace: () => {
    const rows = trace(WALK_BASE, WALK_EXP, WALK_MOD).map((s) => [
      s.label,
      s.e,
      s.bit,
      s.bIn,
      String(s.result),
      s.bOut,
      s.eOut,
    ]);
    return [
      table(
        [
          "걸음",
          "바퀴 시작 e",
          "이번 비트",
          "바퀴 시작 b",
          "누적 뒤 result",
          "제곱 뒤 b",
          "옮긴 뒤 e",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ result 는 비트가 1 인 바퀴에서만 바뀌고 b 는 바퀴마다 바뀐다. 답은 마지막 result 다",
    ].join("\n");
  },

  /** 멈춤 1 — 나머지를 마지막에 한 번만 구했을 때. */
  pauseLastMod: () => {
    const bigRows = LAST_MOD_CASES.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = lastModBig(c.base, c.exp, c.mod);
      return [
        walkLabel(c),
        String(right),
        String(cand),
        num((c.base ** c.exp).toString().length),
        right === cand ? "같다" : "틀리다",
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
    const numberRows = LAST_MOD_NUMBER_CASES.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = lastModNumber(Number(c.base), Number(c.exp), Number(c.mod));
      return [
        label(c),
        String(right),
        String(cand),
        String(right) === String(cand) ? "같다" : "틀리다",
      ];
    });
    return [
      "bigint 으로 곱셈을 다 한 뒤 마지막에 한 번만 나머지를 구한다",
      table(
        ["입력", "정본이 낸 답", "마지막에 한 번만", "중간값의 자릿수", "판정"],
        bigRows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "중간값의 자릿수는 지수를 따라 커진다 — 밑이 3 일 때",
      table(["지수 exp", "3^exp 의 자릿수"], digitRows, ["r", "r"]),
      "",
      "같은 방법을 number 로 하면 답이 어긋난다",
      table(
        ["입력", "정본이 낸 답", "number 로 마지막에 한 번만", "판정"],
        numberRows,
        ["l", "r", "r", "l"],
      ),
      "",
      `└ 밑이 3 일 때 2^53 = ${num(2n ** 53n)} 보다 커지는 첫 지수가 34 이고,`,
      "  2^1024 에서 number 가 Infinity 가 된다",
    ].join("\n");
  },

  /** 멈춤 2 — 제곱을 먼저 했을 때. */
  pauseSquareFirst: () => {
    const rows = SQUARE_FIRST_CASES.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = squareFirst(c.base, c.exp, c.mod);
      return [
        walkLabel(c),
        String(right),
        String(cand),
        right === cand ? "같다" : "틀리다",
      ];
    });
    return [
      table(["입력", "정본이 낸 답", "제곱을 먼저 한 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 지수가 0 이면 바퀴가 없어 같고, 10^4 mod 9 는 밑이 법에서 1 이라 몇 제곱을 해도 1 이다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  mathCheck: () => {
    const bits = WALK_EXP.toString(2);
    const n = bits.length;
    const rows: string[][] = [];
    let b = WALK_BASE % WALK_MOD;
    const chosen: bigint[] = [];
    for (let i = 0; i < n; i++) {
      const on = (WALK_EXP >> BigInt(i)) & 1n;
      rows.push([`i = ${i}`, String(1n << BigInt(i)), String(on), String(b)]);
      if (on === 1n) chosen.push(b);
      b = (b * b) % WALK_MOD;
    }
    let product = 1n % WALK_MOD;
    for (const v of chosen) product = (product * v) % WALK_MOD;
    const places: bigint[] = [];
    for (let i = 0; i < n; i++) {
      if (((WALK_EXP >> BigInt(i)) & 1n) === 1n) places.push(1n << BigInt(i));
    }
    return [
      table(["비트 자리", "2^i", "c_i", "base^(2^i) mod 1000"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      `켜진 자리의 값만 곱한다   ${chosen.join(" · ")} mod 1000 = ${product}`,
      `켜진 자리의 합            ${places.join(" + ")} = ${WALK_EXP}`,
      `n = ${n}   s = ${oneBits(WALK_EXP)}   n + s = ${binaryMults(WALK_EXP)}`,
      `└ 정본이 낸 답 ${fastPower(WALK_BASE, WALK_EXP, WALK_MOD)} 와 같다`,
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
      table(["k", "k - 1", "ln k", "(k - 1) / ln k"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ k = 2 에서 가장 작다. 이 값이 지수 하나를 처리하는 데 드는 곱셈의 비율이다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태와 실측을 맞추고 제약 규모의 계수를 낸다. */
  mathScale: () => {
    const rows = SCALES.map((e) => {
      const n = bitLength(e);
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
      table(
        ["지수 exp", "n", "s", "실측 곱셈", "n + s", "하한 n + 1", "상한 2n"],
        rows,
        ["r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ 실측과 닫힌 형태가 다섯 규모에서 같다. 제약 규모의 곱셈은 ${binaryMults(LIMIT)} 번이고`,
      `  차례로 곱하는 방법은 ${num(LIMIT)} 번이다 — 자릿수가 ${LIMIT.toString().length} 에서 ${String(binaryMults(LIMIT)).length} 로 줄어든다`,
    ].join("\n");
  },

  /** `invariant` ③ — 제곱하던 줄을 없앤 변이. */
  mutantNoSquare: () => {
    const rows = NO_SQUARE_CASES.map((c) => {
      const right = fastPower(c.base, c.exp, c.mod);
      const cand = noSquare.fastPower(c.base, c.exp, c.mod);
      return [
        walkLabel(c),
        String(right),
        String(cand),
        right === cand ? "같다" : "틀리다",
      ];
    });
    const steps = trace(WALK_BASE, WALK_EXP, WALK_MOD).filter((s) => s.loop);
    const ref = steps.map((s) => String(s.bInValue)).join(" ");
    const stuck = steps.map(() => String(WALK_BASE % WALK_MOD)).join(" ");
    return [
      table(["입력", "정본이 낸 답", "제곱을 없앤 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `전개 입력에서 b 가 지켜야 할 값 ${ref} 이 ${stuck} 으로 바뀐다`,
      "└ b^e 를 유지하던 줄이 사라지면 result 는 1 인 비트 수만큼 밑을 곱한 값이 된다",
    ].join("\n");
  },

  /** `perf.derive` — 걸음별 곱셈 수. */
  perfCount: () => {
    const steps = trace(WALK_BASE, WALK_EXP, WALK_MOD);
    const loops = steps.length - 2;
    const squares = loops;
    const accs = oneBits(WALK_EXP);
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0"],
      [
        "바퀴",
        `T2 부터 T${loops + 1} 까지`,
        String(loops),
        "1",
        "0 또는 1",
        String(squares + accs),
      ],
      ["반환", `T${loops + 2}`, "1", "0", "0", "0"],
      ["합계", "", "", "", "", String(squares + accs)],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "걸음마다 제곱",
          "걸음마다 누적",
          "이 입력에서",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 제곱 ${squares} 번과 누적 ${accs} 번이다. 앞은 비트 수 n 이고 뒤는 1 인 비트 s 다`,
    ].join("\n");
  },

  /** `perf.worst` — 최악을 만드는 지수. */
  worstShape: () => {
    const worst = mostOneBitsAtMost(LIMIT);
    const allOnes = (1n << 59n) - 1n;
    const powerOfTwo = 1n << 59n;
    const cases: [string, bigint][] = [
      ["2^59", powerOfTwo],
      ["10^18 (제약의 상한)", LIMIT],
      ["2^59 - 1", allOnes],
      ["2^59 + 2^58 - 1", worst],
    ];
    const rows = cases.map(([name, e]) => [
      name,
      num(e),
      String(bitLength(e)),
      String(oneBits(e)),
      String(binaryMults(e)),
    ]);
    return [
      table(
        ["지수의 모양", "지수 exp", "비트 수 n", "1 인 비트 s", "곱셈 n + s"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `└ 제약 안에서 곱셈이 가장 많은 지수는 마지막 줄의 ${num(worst)} 이고 ${binaryMults(worst)} 번이다.`,
      `  상한인 10^18 보다 작은 지수가 더 많은 곱셈을 쓴다`,
    ].join("\n");
  },
};
