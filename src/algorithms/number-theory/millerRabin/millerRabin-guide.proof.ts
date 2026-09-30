/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/millerRabin/millerRabin-guide.md
 *
 * 걸음 기록과 연산 수는 그림 사이드카(`-guide.fig.tsx`)의 `run` 을 쓴다 — 그림 · 표 · 패널이 같은 기록을
 * 쓰고, 그 기록의 답은 거기서 정본과 대조한다. 규모를 훑는 표는 `number` 로 세는 가벼운 판 `opsSmall` 을
 * 쓰고, 두 판이 같은 값을 내는지는 그 표가 함께 대조한다.
 *
 * **작은 규모의 스윕은 `number` 로 계산한다.** 스윕 상한 1,400,000 에서 곱이 `2·10^12` 라 `2^53` 안쪽이고,
 * 그 경계가 이 편의 「짚고 가기」 하나가 값으로 다루는 자리다. 계약 범위(`2^64`)의 계산은 전부 `bigint` 다.
 *
 * 시행 나눗셈 쪽 값은 그 편의 사이드카를 **불러서** 얻는다(`countRun` · `candidateCount` · 그 편의 경쟁
 * 설계 하네스). 경쟁 설계 대조 표는 이 편의 `.alt.ts` 를 부른다 — 같은 값을 두 파일에 적으면 한쪽만
 * 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  millerOps as shortestBasesOps,
  lastAhead as trialLastAhead,
  nextPrime as trialNextPrime,
} from "../isPrimeTrial/isPrimeTrial-guide.alt.ts";
import { countRun } from "../isPrimeTrial/isPrimeTrial-guide.fig.tsx";
import {
  ALT_CELLS,
  altOps,
  bestTableSize,
  cases,
  compositeWithLeastFactor,
  lastOursAhead,
  nthPrime,
  OUR_CELLS,
  ourOps,
  primeIndex,
  SCALE_FROM,
  SCALE_TO,
  TABLE_LAST,
  TABLE_SIZE,
  verdictsAgree,
  WORKLOAD,
  workloadOps,
} from "./millerRabin-guide.alt.ts";
import {
  BASES,
  bitsOf,
  CARMICHAEL,
  coprimeCounts,
  fullSequence,
  isPrimeByTrial,
  LIMIT,
  largestPrimeAtMost,
  leastFactor,
  modPow,
  multsOf,
  num,
  OPS_PER_SECOND,
  onesOf,
  opsSmall,
  run,
  split,
  strongPasses,
  trialOpsForPrime,
  WALK,
  walkSteps,
  yn,
} from "./millerRabin-guide.fig.tsx";
import { millerRabin } from "./millerRabin-guide.ref.ts";

const REF = new URL("./millerRabin-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 표 그리기 ───────────────────────── */

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

const block = (...parts: string[]): string => parts.join("\n\n");

/** 등폭 펜스 안의 칸 맞춤 — 한글은 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

function columns(rows: string[][]): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows.map((r) =>
    r
      .map((cell, c) => pad(cell, widths[c] ?? 0))
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

const seconds = (ops: number): string =>
  `${(ops / OPS_PER_SECOND).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} 초`;

/** 소인수분해를 곱으로 적는다. 소수면 「소수」. */
const factorText = (n: number): string => {
  if (leastFactor(n) < 0) return "소수";
  const parts: number[] = [];
  let m = n;
  while (m > 1) {
    const f = leastFactor(m);
    const p = f < 0 ? m : f;
    parts.push(p);
    m /= p;
  }
  return parts.map(num).join(" × ");
};

const same = (a: boolean, b: boolean): string =>
  a === b ? "같다" : "어긋난다";

const sub = (r: number): string => `x${"₀₁₂₃₄₅₆₇₈₉"[r] ?? r}`;

/* ────────── 변이 (모듈 최상위에서 한 번 만든다) ────────── */

type Ref = { millerRabin: (n: bigint) => boolean };

/** 밑 목록을 2 하나로 줄인 판 — 「밑 하나면 되지 않나」의 실물이다. */
const SINGLE_BASE = await loadMutant<Ref>(REF, {
  swap: [
    /^const BASES = \[2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n\];$/,
    "const BASES = [2n];",
  ],
});

/** 제곱 루프에서 `n - 1` 대신 1 을 찾는 판. */
const FIND_ONE = await loadMutant<Ref>(REF, {
  swap: [/^ {6}if \(x === n - 1n\) \{$/, "      if (x === 1n) {"],
});

/** 첫 값 검사에서 `n - 1` 을 뺀 판 — 불변식을 지키던 바로 그 줄이다. */
const NO_MINUS_ONE = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}if \(x === 1n \|\| x === n - 1n\) continue;$/,
    "    if (x === 1n) continue;",
  ],
});

/** `n === a` 검사를 지운 판 — 나눗셈 뒤에 둔 것과 같다(`n === a` 이면 나눗셈이 먼저 0 을 낸다). */
const NO_EQUAL = await loadMutant<Ref>(REF, {
  drop: /^ {4}if \(n === a\) return true;$/,
});

/** 배정밀도로 계산한 판. 변이가 아니라 `number` 로 옮겨 적은 사본이다. */
function modPowNum(base: number, exp: number, mod: number): number {
  let result = 1 % mod;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % mod;
    b = (b * b) % mod;
    e = Math.floor(e / 2);
  }
  return result;
}

function millerRabinFloat(n: number): boolean {
  if (n < 2) return false;
  const bases = BASES.map(Number);
  for (const a of bases) {
    if (n === a) return true;
    if (n % a === 0) return false;
  }
  let d = n - 1;
  let s = 0;
  while (d % 2 === 0) {
    d /= 2;
    s += 1;
  }
  for (const a of bases) {
    let x = modPowNum(a, d, n);
    if (x === 1 || x === n - 1) continue;
    let witness = true;
    for (let i = 1; i < s; i++) {
      x = (x * x) % n;
      if (x === n - 1) {
        witness = false;
        break;
      }
    }
    if (witness) return false;
  }
  return true;
}

/* ──────────── 작은 규모의 스윕 — `number` 로 계산한다 ──────────── */

const SWEEP_LIMIT = 1_400_000;

/** `n` 이 밑 `a` 의 강한 판정을 통과하는가(`number` 판). */
function passes(n: number, a: number): boolean {
  let d = n - 1;
  let s = 0;
  while (d % 2 === 0) {
    d /= 2;
    s += 1;
  }
  let x = modPowNum(a % n, d, n);
  if (x === 1 || x === n - 1) return true;
  for (let i = 1; i < s; i++) {
    x = (x * x) % n;
    if (x === n - 1) return true;
  }
  return false;
}

/** 밑 `k` 개를 전부 통과하는 가장 작은 홀 합성수. 못 찾으면 `-1`. */
function firstLiar(k: number): number {
  const bases = BASES.slice(0, k).map(Number);
  for (let n = 9; n <= SWEEP_LIMIT; n += 2) {
    if (!passes(n, 2)) continue;
    if (isPrimeByTrial(n)) continue;
    if (bases.every((a) => passes(n, a))) return n;
  }
  return -1;
}

/** 코르셀트 판정으로 카마이클 수를 가른다. */
function isCarmichael(n: number): boolean {
  if (n < 3 || n % 2 === 0 || isPrimeByTrial(n)) return false;
  let m = n;
  let distinct = 0;
  for (let p = 3; p * p <= m; p += 2) {
    if (m % p !== 0) continue;
    let e = 0;
    while (m % p === 0) {
      m /= p;
      e += 1;
    }
    if (e > 1) return false;
    if ((n - 1) % (p - 1) !== 0) return false;
    distinct += 1;
  }
  if (m > 1) {
    if ((n - 1) % (m - 1) !== 0) return false;
    distinct += 1;
  }
  return distinct >= 3;
}

function rootsOfOne(n: number): number[] {
  const out: number[] = [];
  for (let x = 1; x < n; x++) if ((x * x) % n === 1) out.push(x);
  return out;
}

/** 어느 갈래가 답했는가 — 이름으로 적는다(`invariant` 절은 원문자를 쓰지 않는다). */
function stopName(n: bigint): string {
  const t = run(n);
  switch (t.stop) {
    case "small":
      return "2 보다 작은가";
    case "equal":
      return `밑 목록의 ${t.stopAt + 1} 번째 밑 자신`;
    case "divided":
      return `밑 목록의 ${t.stopAt + 1} 번째 밑으로 나누어떨어짐`;
    case "witness":
      return `밑 ${t.bases.at(-1)?.a}${이가(String(t.bases.at(-1)?.a))} 증인`;
    default:
      return "밑 열둘이 모두 통과";
  }
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

const MERSENNE61 = (1n << 61n) - 1n;
const TOP = largestPrimeAtMost(LIMIT - 1n);

export const PROOFS: Record<string, () => string> = {
  /* ───────── 전체 컨셉 ───────── */

  "concept-scale": () => {
    const rows = [561n, WALK, 999_999_999_989n, TOP].map((n) => {
      const trial =
        n < 2n ** 53n ? countRun(Number(n)).divisions : trialOpsForPrime(n);
      return [num(n), yn(millerRabin(n)), num(trial), num(run(n).ops)];
    });
    const trialTop = trialOpsForPrime(TOP);
    return block(
      md(["입력 n", "정본", "시행 나눗셈", "밀러-라빈"], rows, [0, 2, 3]),
      `마지막 줄은 2^64 아래 가장 큰 소수이고, 그 줄의 시행 나눗셈 값 ${num(trialTop)} 은 실행하지 않고 그 편의 닫힌 형태로 센 값입니다.`,
    );
  },

  /* ───────── 아이디어를 떠올리는 과정 ───────── */

  "origin-trial": () => {
    const scales: [string, bigint][] = [
      ["10^6", 10n ** 6n],
      ["10^9", 10n ** 9n],
      ["10^12", 10n ** 12n],
      ["10^15", 10n ** 15n],
      ["10^18", 10n ** 18n],
      ["2^64", LIMIT - 1n],
    ];
    let checked = 0;
    let mismatch = 0;
    const rows = scales.map(([label, limit]) => {
      const p = largestPrimeAtMost(limit);
      const ops = trialOpsForPrime(p);
      if (p <= 10n ** 12n) {
        checked += 1;
        if (countRun(Number(p)).divisions !== ops) mismatch += 1;
      }
      return [label, num(p), num(ops), seconds(ops)];
    });
    return block(
      md(
        ["규모", "그 아래 가장 큰 소수 n", "나눗셈", "시간(1 초에 1 억 번)"],
        rows,
        [1, 2, 3],
      ),
      `나눗셈 횟수는 시행 나눗셈 편의 닫힌 형태 2 + C(⌊√n⌋) 로 셌고, 그 편의 세는 판을 실제로 실행한 위 ${checked} 줄에서 두 값이 어긋난 줄은 ${mismatch} 개입니다.`,
    );
  },

  "origin-fermat-small": () => {
    const rows = [91n, 97n].map((n) => {
      const v = modPow(2n, n - 1n, n);
      return [
        num(n),
        factorText(Number(n)),
        `${num(v)}`,
        v === 1n ? "아직 모른다" : "합성수 확정",
        num(multsOf(n - 1n) + 2),
        num(countRun(Number(n)).divisions),
      ];
    });
    return block(
      md(
        [
          "n",
          "인수분해",
          "2^(n−1) mod n",
          "페르마 판정",
          "거듭제곱의 나머지 연산",
          "시행 나눗셈",
        ],
        rows,
        [0, 2, 4, 5],
      ),
      "거듭제곱의 나머지 연산은 이진 거듭제곱이 시작할 때의 두 번과 모듈러 곱셈을 더한 값입니다.",
    );
  },

  "origin-two-ways": () => {
    const rows = [
      10n ** 3n,
      10n ** 6n,
      10n ** 9n,
      10n ** 12n,
      10n ** 18n,
      LIMIT - 1n,
    ].map((limit) => {
      const p = largestPrimeAtMost(limit);
      return [
        num(p),
        `${bitsOf(p - 1n)}`,
        num(trialOpsForPrime(p)),
        num(multsOf(p - 1n) + 2),
      ];
    });
    const last = rows.at(-1) as string[];
    return block(
      md(
        ["소수 n", "n − 1 의 비트 수", "시행 나눗셈", "페르마 판정 한 번"],
        rows,
        [0, 1, 2, 3],
      ),
      `2^64 아래 가장 큰 소수에서 시행 나눗셈은 ${last[2]} 번, 페르마 판정 한 번은 ${last[3]} 번입니다.`,
    );
  },

  "origin-fermat-liar": () => {
    const liars: number[] = [];
    let count = 0;
    for (let n = 9; n < 1_000_000; n += 2) {
      if (modPowNum(2, n - 1, n) !== 1 || isPrimeByTrial(n)) continue;
      count += 1;
      if (liars.length < 5) liars.push(n);
    }
    const rows = liars.map((n) => [
      num(n),
      factorText(n),
      `${modPowNum(2, n - 1, n)}`,
      "통과",
      yn(millerRabin(BigInt(n))),
    ]);
    return block(
      md(
        ["n", "인수분해", "2^(n−1) mod n", "페르마 판정", "정본"],
        rows,
        [0, 2],
      ),
      `다섯 수 모두 합성수인데 밑 2 의 페르마 판정을 통과합니다. 10^6 아래에서 그런 홀 합성수는 ${num(count)} 개입니다.`,
    );
  },

  "origin-carmichael": () => {
    const n = Number(CARMICHAEL);
    const rows = [2, 4, 5, 7, 8, 10].map((a) => {
      const v = modPowNum(a, n - 1, n);
      return [`${a}`, `${v}`, v === 1 ? "통과" : "합성수"];
    });
    const c = coprimeCounts(CARMICHAEL);
    let carmichael = 0;
    for (let v = 3; v < 1_000_000; v += 2) if (isCarmichael(v)) carmichael += 1;
    return block(
      md(["밑 a", "a^560 mod 561", "페르마 판정"], rows, [0, 1]),
      `561 = ${factorText(561)} 이고 정본의 답은 ${yn(millerRabin(CARMICHAEL))} 입니다. 2 부터 ${num(CARMICHAEL - 2n)} 까지의 밑 가운데 561 과 서로소인 ${num(c.coprime)} 개 중 페르마 판정을 통과하는 것이 ${num(c.fermat)} 개이고, 이런 수는 10^6 아래에 ${num(carmichael)} 개 있습니다.`,
    );
  },

  "origin-sequence": () => {
    const { d } = split(CARMICHAEL);
    const seq = fullSequence(CARMICHAEL, 2n);
    const rows = seq.map((x, r) => [`${r}`, num(d * 2n ** BigInt(r)), num(x)]);
    const firstOne = seq.indexOf(1n);
    const before = seq[firstOne - 1] as bigint;
    const sq = before * before;
    return block(
      md(["자리 r", "지수 35 · 2^r", "2^지수 mod 561"], rows, [0, 1, 2]),
      `1 이 처음 나오는 자리는 r = ${firstOne} 이고 그 직전 값은 ${num(before)} 입니다. ${num(before)}² = ${num(sq)} = 561 × ${num(sq / CARMICHAEL)} + ${num(sq % CARMICHAEL)} 입니다.`,
    );
  },

  /* ───────── 아이디어 상세 — 먼저 알아 둘 개념 ───────── */

  "seq-read": () => {
    const { d } = split(WALK);
    const t = run(WALK);
    const x0 = t.bases[0]?.x[0] as bigint;
    const x1 = t.bases[0]?.x[1] as bigint;
    const direct = modPow(2n, d * 2n, WALK);
    return [
      ...columns([
        ["자리", "r = 1"],
        ["지수", `d · 2^1 = ${num(d)} × 2 = ${num(d * 2n)}`],
        ["정의대로", `2^${num(d * 2n)} mod ${num(WALK)} = ${num(direct)}`],
        [
          "수열의 기록",
          `${sub(0)}² mod ${num(WALK)} = ${num(x0)}² mod ${num(WALK)} = ${num(x1)}`,
        ],
      ]),
    ].join("\n");
  },

  "seq-neighbors": () => {
    const pairs: [bigint, bigint][] = [
      [CARMICHAEL, 2n],
      [WALK, 2n],
      [WALK, 3n],
      [97n, 3n],
      [1_000_000_007n, 5n],
    ];
    let agree = 0;
    const rows = pairs.map(([n, a]) => {
      const seq = fullSequence(n, a);
      const last = seq.at(-1) as bigint;
      const fermat = modPow(a, n - 1n, n);
      if (last === fermat) agree += 1;
      return [num(n), `${a}`, seq.map(num).join(" → "), num(last), num(fermat)];
    });
    return block(
      md(
        ["n", "밑 a", "제곱 수열", "끝 값", "a^(n−1) mod n 을 따로 구한 값"],
        rows,
        [0, 1, 3, 4],
      ),
      `${pairs.length} 줄 가운데 끝 값과 따로 구한 a^(n−1) mod n 이 같은 줄은 ${agree} 개입니다.`,
    );
  },

  "seq-vs-fermat": () => {
    const rows = [2n, 4n, 5n, 7n, 8n, 10n].map((a) => {
      const seq = fullSequence(CARMICHAEL, a);
      const firstOne = seq.indexOf(1n);
      const before = firstOne > 0 ? num(seq[firstOne - 1] as bigint) : "없다";
      return [
        `${a}`,
        num(seq.at(-1) as bigint),
        seq.map(num).join(" → "),
        before,
        strongPasses(CARMICHAEL, a) ? "통과" : "증인",
      ];
    });
    const c = coprimeCounts(CARMICHAEL);
    return block(
      md(
        [
          "밑 a",
          "페르마 판정이 보는 값",
          "제곱 수열",
          "1 직전 값",
          "강한 판정",
        ],
        rows,
        [0, 1],
      ),
      `2 부터 ${num(CARMICHAEL - 2n)} 까지의 밑 가운데 561 과 서로소인 ${num(c.coprime)} 개 중 페르마 판정은 ${num(c.fermat)} 개가, 강한 판정은 ${num(c.strong)} 개가 통과합니다.`,
    );
  },

  /* ───────── 아이디어 상세 — 단계 ───────── */

  "build-pre": () => {
    const rows = [-7n, 0n, 1n, 2n, 37n, 74n, 1_369n, WALK].map((n) => {
      const t = run(n);
      return [
        num(n),
        stopName(n),
        num(t.preOps),
        yn(t.answer),
        yn(isPrimeByTrial(Number(n))),
      ];
    });
    return block(
      md(
        ["입력 n", "답하는 자리", "나머지 연산", "정본", "시행 나눗셈"],
        rows,
        [0, 2],
      ),
      `${rows.length} 입력 가운데 사전 판정에서 답하지 않고 아래로 내려간 것은 ${num(WALK)} 하나입니다.`,
    );
  },

  "build-split": () => {
    const rows = [41n, 43n, 97n, CARMICHAEL, WALK, 1_000_000_007n].map((n) => {
      const { d, s } = split(n);
      return [
        num(n),
        `${(n - 1n).toString(2)}₂`,
        `${s}`,
        num(d),
        `${d.toString(2)}₂`,
      ];
    });
    return block(
      md(
        ["n", "n − 1 의 이진 표기", "s", "d", "d 의 이진 표기"],
        rows,
        [0, 2, 3],
      ),
      "모든 줄에서 d 의 이진 표기는 n − 1 의 이진 표기에서 끝의 0 을 s 개 떼어 낸 것입니다.",
    );
  },

  "build-chain": () => {
    const pairs: [bigint, bigint][] = [
      [WALK, 2n],
      [WALK, 3n],
      [41n, 3n],
      [97n, 2n],
    ];
    const rows = pairs.map(([n, a]) => {
      const t = run(n, [a]);
      const b = t.bases[0];
      if (b === undefined) throw new Error("밑 판정까지 내려가지 않았다");
      return [
        num(n),
        `${a}`,
        `${t.s}`,
        num(b.x[0] as bigint),
        b.x.slice(1).map(num).join(" → ") || "없음",
        num(b.powOps),
        num(b.loopOps),
      ];
    });
    return block(
      md(
        [
          "n",
          "밑 a",
          "s",
          "x₀ = a^d",
          "제곱 루프가 만든 값",
          "거듭제곱의 나머지 연산",
          "루프의 나머지 연산",
        ],
        rows,
        [0, 1, 2, 3, 5, 6],
      ),
      "제곱 루프는 n − 1 을 찾으면 그 자리에서 멈추고, 못 찾아도 s − 1 번을 넘게 반복하지 않습니다.",
    );
  },

  "sqrt-one": () => {
    const rows = [7, 11, 13, 15, 21, 561, Number(WALK)].map((n) => {
      const roots = rootsOfOne(n);
      return [
        num(n),
        roots.length <= 6
          ? roots.map(num).join(" ")
          : `${roots.slice(0, 5).map(num).join(" ")} …`,
        `${roots.length}`,
        yn(millerRabin(BigInt(n))),
      ];
    });
    const walkRoots = rootsOfOne(Number(WALK));
    return block(
      md(["법 n", "x² ≡ 1 (mod n) 의 해", "해 개수", "정본"], rows, [0, 2]),
      `소수인 줄은 해가 1 과 n − 1 둘뿐이고, 합성수인 줄은 그보다 많습니다. 마지막 줄이 전개 입력이고 ${num(walkRoots[1] as number)} 과 ${num(walkRoots[2] as number)} 가 1 도 n − 1 도 아닌 해입니다.`,
    );
  },

  "witness-627": () => {
    const x = 627n;
    const p = 157n;
    const q = 313n;
    return [
      ...columns([
        [
          `${num(x)} − 1 = ${num(x - 1n)} = ${num((x - 1n) / q)} × ${num(q)}`,
          `${num(q)} 의 배수`,
        ],
        [
          `${num(x)} + 1 = ${num(x + 1n)} = ${num((x + 1n) / p)} × ${num(p)}`,
          `${num(p)} 의 배수`,
        ],
        [
          `${num(x - 1n)} × ${num(x + 1n)} = ${num((x - 1n) * (x + 1n))}`,
          `${num(p * q)} × ${num(((x - 1n) * (x + 1n)) / (p * q))} 이라 ${num(WALK)} 의 배수`,
        ],
        [`${num(x)}² mod ${num(WALK)} = ${num((x * x) % WALK)}`, ""],
      ]),
    ].join("\n");
  },

  "prime-shapes": () => {
    const primes = [97n, 193n, 1_000_000_007n];
    const rows = primes.map((n) => {
      const { s } = split(n);
      let firstOne = 0;
      let viaMinus = 0;
      let other = 0;
      for (const a of BASES) {
        if (a >= n) continue;
        const seq = fullSequence(n, a);
        const at = seq.indexOf(1n);
        if (at === 0) firstOne += 1;
        else if (at > 0 && seq[at - 1] === n - 1n) viaMinus += 1;
        else other += 1;
      }
      return [num(n), `${s}`, `${firstOne}`, `${viaMinus}`, `${other}`];
    });
    return block(
      md(
        ["소수 n", "s", "첫 값부터 1", "1 직전이 n − 1", "그 밖"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "세 소수 모두 밑 열둘이 앞의 두 모양 가운데 하나이고, 「그 밖」 칸은 모두 0 입니다.",
    );
  },

  "witness-walk": () => {
    const rows = [2n, 3n].map((a) => {
      const seq = fullSequence(WALK, a);
      const firstOne = seq.indexOf(1n);
      const before = seq[firstOne - 1] as bigint;
      return [
        `${a}`,
        seq.map(num).join(" → "),
        num(before),
        strongPasses(WALK, a) ? "증인이 아니다" : "증인이다",
      ];
    });
    return block(
      md(["밑 a", "제곱 수열(끝 값까지)", "1 직전 값", "판정"], rows, [0]),
      `${num(WALK)} − 1 = ${num(WALK - 1n)} 이고, 정본의 답은 ${yn(millerRabin(WALK))} 입니다.`,
    );
  },

  /* ───────── 설계 선택 ───────── */

  "psi-sweep": () => {
    const rows: string[][] = [];
    for (const k of [1, 2, 3]) {
      const n = firstLiar(k);
      rows.push([
        `${k}`,
        BASES.slice(0, k).join(" "),
        n < 0 ? `${num(SWEEP_LIMIT)} 까지 없다` : num(n),
        n < 0 ? "—" : factorText(n),
      ]);
    }
    const three = 25_326_001;
    const threeOk =
      !isPrimeByTrial(three) &&
      [2, 3, 5].every((a) => passes(three, a)) &&
      !passes(three, 7);
    return block(
      md(
        ["밑 개수", "쓰는 밑", "모두 통과하는 가장 작은 홀 합성수", "인수분해"],
        rows,
        [0, 2],
      ),
      `9 부터 ${num(SWEEP_LIMIT)} 까지 홀수를 전부 재서 찾은 값입니다. 밑 셋을 통과하는 수는 이 범위 안에 없고, 범위 밖의 ${num(three)} = ${factorText(three)} 이 합성수이면서 밑 2 · 3 · 5 를 통과하고 밑 7 에서 걸리는지 실행한 결과는 「${threeOk ? "그렇다" : "아니다"}」입니다.`,
    );
  },

  "base-count": () => {
    const psi11 = 3_825_123_056_546_413_051n;
    const psi12 = 318_665_857_834_031_151_167_461n;
    const rows: string[][] = [];
    for (const [n, f] of [
      [psi11, "747,451 × 149,491 × 34,233,211"],
      [psi12, "399,165,290,221 × 798,330,580,441"],
    ] as [bigint, string][]) {
      let k = 0;
      let first = "—";
      for (const a of [...BASES, 41n]) {
        if (strongPasses(n, a)) k += 1;
        else {
          first = `${a}`;
          break;
        }
      }
      rows.push([num(n), f, `${k}`, first, n < LIMIT ? "작다" : "크다"]);
    }
    return block(
      md(
        ["수", "인수분해", "통과하는 앞쪽 밑 개수", "첫 증인", "2^64 와 비교"],
        rows,
        [0, 2],
      ),
      `2^64 = ${num(LIMIT)} 입니다. 첫 줄은 밑 열하나를 통과하고 2^64 보다 작으며, 둘째 줄은 밑 열둘을 통과하지만 2^64 의 ${num(psi12 / LIMIT)} 배가 넘습니다.`,
    );
  },

  "liar-share": () => {
    const rows = [2_047, 3_277, 4_033, 8_321, 561, 49_141].map((n) => {
      let liars = 0;
      for (let a = 2; a <= n - 2; a++) if (passes(n, a)) liars += 1;
      const share = liars / (n - 3);
      return [num(n), factorText(n), num(n - 3), num(liars), share.toFixed(4)];
    });
    const worst = Math.max(...rows.map((r) => Number(r[4])));
    return block(
      md(
        ["합성수 n", "인수분해", "밑 2 … n − 2", "통과하는 밑", "비율"],
        rows,
        [0, 2, 3, 4],
      ),
      `여섯 줄에서 가장 큰 비율이 ${worst.toFixed(4)} 이고, 1/4 = 0.2500 을 넘는 줄은 ${rows.filter((r) => Number(r[4]) > 0.25).length} 개입니다.`,
    );
  },

  /* ───────── 수행으로 알아보는 알고리즘 ───────── */

  "walk-input": () =>
    [
      `const n = ${WALK}n;`,
      `// 이 절이 끝나면 ${millerRabin(WALK)} 가 나와야 한다`,
    ].join("\n"),

  "walk-pre": () => {
    const t = run(WALK);
    return [
      `T1  n = ${num(WALK)}   ① 의 n < 2 가 거짓이다 (${num(WALK)} ≥ 2). 나머지 연산 0 번`,
      `T2  n = ${num(WALK)}   ② 의 나머지가 ${t.rems.join(" ")} 이다`,
      `                  0 이 없어 나머지 연산 ${t.preOps} 번 뒤 아래로 내려간다`,
    ].join("\n");
  },

  "mutant-order": () => {
    const inputs = [2n, 3n, 37n, 41n, 74n, 1_369n];
    const rows = inputs.map((n) => {
      const a = millerRabin(n);
      const b = NO_EQUAL.millerRabin(n);
      return [num(n), yn(a), yn(b), yn(isPrimeByTrial(Number(n))), same(a, b)];
    });
    const diff: bigint[] = [];
    for (let v = 0n; v <= 20_000n; v++) {
      if (millerRabin(v) !== NO_EQUAL.millerRabin(v)) diff.push(v);
    }
    return block(
      md(
        ["입력 n", "정본", "n === a 를 지운 판", "시행 나눗셈", "두 답"],
        rows,
        [0],
      ),
      `0 부터 20,000 까지 두 판의 답이 갈리는 입력은 ${diff.length} 개이고, 그 입력은 ${diff.length === 0 ? "없습니다" : `${diff.map(num).join(" ")} 입니다`}.`,
    );
  },

  "walk-split": () => {
    const chain: bigint[] = [WALK - 1n];
    while (((chain.at(-1) as bigint) & 1n) === 0n) {
      chain.push((chain.at(-1) as bigint) >> 1n);
    }
    const { d, s } = split(WALK);
    return [
      `T3  n − 1 = ${num(WALK - 1n)}`,
      `    ${chain.map(num).join("  →  ")}      2 로 ${s} 번 나눈 뒤 홀수`,
      `    d = ${num(d)},  s = ${s}      ${num(WALK - 1n)} = ${num(d)} × 2^${s}`,
    ].join("\n");
  },

  "mutant-single-base": () => {
    const rows = [2_047, 3_277, 4_033, 49_141, 1_373_653, 1_000_000_007].map(
      (n) => {
        const a = millerRabin(BigInt(n));
        const b = SINGLE_BASE.millerRabin(BigInt(n));
        return [
          num(n),
          factorText(n),
          yn(a),
          yn(b),
          yn(isPrimeByTrial(n)),
          same(a, b),
        ];
      },
    );
    let diff = 0;
    for (let n = 3; n <= 200_000; n += 2) {
      if (millerRabin(BigInt(n)) !== SINGLE_BASE.millerRabin(BigInt(n))) {
        diff += 1;
      }
    }
    return block(
      md(
        [
          "입력",
          "인수분해",
          "정본",
          "밑 2 하나만 쓰는 판",
          "시행 나눗셈",
          "두 답",
        ],
        rows,
        [0],
      ),
      `3 부터 200,000 까지 홀수에서 두 판의 답이 갈리는 입력은 ${num(diff)} 개입니다.`,
    );
  },

  "why-2047": () => {
    const n = 2_047n;
    const { d, s } = split(n);
    const two = modPow(2n, d, n);
    const three = modPow(3n, d, n);
    return [
      ...columns([
        [`${num(n - 1n)} = ${num(d)} × 2^${s}`, `d = ${num(d)}, s = ${s}`],
        [
          `2^${num(d)} mod ${num(n)} = ${num(two)}`,
          two === 1n
            ? "첫 값이 1 이라 밑 2 는 통과한다"
            : "첫 값이 1 이 아니다",
        ],
        [
          `3^${num(d)} mod ${num(n)} = ${num(three)}`,
          `1 도 ${num(n - 1n)} 도 아니고 s = ${s} 이라 제곱 루프가 없다 — 밑 3 은 증인`,
        ],
      ]),
    ].join("\n");
  },

  "walk-base2": () => {
    const steps = walkSteps().filter((s) => s.id === "T4" || s.id === "T5");
    return [
      ...steps.flatMap((s) => [
        `${s.id}  ${s.title} — ${s.stage.calc?.expr} = ${s.stage.calc?.result}`,
        `    ${s.stage.vars}`,
      ]),
    ].join("\n");
  },

  "mutant-find-one": () => {
    const rows = [41n, 53n, 97n, 193n, WALK].map((n) => {
      const { d, s } = split(n);
      const chain: string[] = [];
      let x = modPow(3n, d, n);
      chain.push(num(x));
      for (let i = 1; i < s; i++) {
        x = (x * x) % n;
        chain.push(num(x));
      }
      const a = millerRabin(n);
      const b = FIND_ONE.millerRabin(n);
      return [
        num(n),
        chain.join(" → "),
        yn(a),
        yn(b),
        yn(isPrimeByTrial(Number(n))),
        same(a, b),
      ];
    });
    let diff = 0;
    let flipped = 0;
    for (let n = 3; n <= 200_000; n += 2) {
      const truth = millerRabin(BigInt(n));
      if (truth === FIND_ONE.millerRabin(BigInt(n))) continue;
      diff += 1;
      if (truth) flipped += 1;
    }
    return block(
      md(
        [
          "입력",
          "밑 3 의 제곱 루프까지",
          "정본",
          "1 을 찾는 판",
          "시행 나눗셈",
          "두 답",
        ],
        rows,
        [0],
      ),
      `3 부터 200,000 까지 홀수에서 두 판이 갈리는 입력은 ${num(diff)} 개이고, 그중 소수가 합성수로 뒤집힌 것이 ${num(flipped)} 개입니다.`,
    );
  },

  "why-41": () => {
    const n = 41n;
    const { d, s } = split(n);
    const seq = fullSequence(n, 3n);
    const rows = seq.map((x, r) => [
      `${r}`,
      num(d * 2n ** BigInt(r)),
      num(x),
      r === 0 ? "첫 값 검사" : r < s ? "제곱 루프" : "계산하지 않는다",
      x === n - 1n ? "n − 1" : x === 1n ? "1" : "—",
    ]);
    return block(
      md(
        ["자리 r", "지수", "3^지수 mod 41", "코드의 어디서", "값의 뜻"],
        rows,
        [0, 1, 2],
      ),
      `s = ${s} 이라 제곱 루프는 r = ${s - 1} 까지만 계산하고, 끝 값 r = ${s} 는 계산하지 않습니다.`,
    );
  },

  "walk-trace": () => {
    const steps = walkSteps();
    const branch: Record<string, string> = {
      T1: "①",
      T2: "②",
      T3: "③",
    };
    const rows = steps.map((s) => {
      const b =
        branch[s.id] ??
        (s.title.endsWith("첫 값")
          ? "④⑤"
          : s.title.endsWith("증인")
            ? "⑦"
            : "⑥");
      return [
        s.id,
        b,
        s.title,
        `${s.stage.calc?.expr} → ${s.stage.calc?.result}`,
      ];
    });
    const t = run(WALK);
    return block(
      md(["걸음", "갈래", "하는 일", "계산"], rows),
      `n = ${num(WALK)} 이고 반환값은 ${t.answer} 입니다. 나머지 연산은 모두 ${t.ops} 번이고, 밑 ${t.bases.length} 개를 본 뒤 남은 밑 ${BASES.length - t.bases.length} 개는 보지 않았습니다.`,
    );
  },

  "walk-branch": () => {
    const names = [
      "① 2 보다 작은가",
      "② 밑 목록으로 나눠 본다",
      "③ n−1 을 가른다",
      "④ 제곱 수열의 첫 값",
      "⑤ 첫 값이 1 이나 n−1",
      "⑥ 제곱해 가며 본다",
      "⑦ 증인을 찾았다",
      "⑧ 밑 열둘이 다 통과",
    ];
    const inputs: [string, bigint][] = [
      [`전개 입력 ${num(WALK)}`, WALK],
      ["1", 1n],
      ["37", 37n],
      ["1,000,000,000", 1_000_000_000n],
      ["1,000,000,007", 1_000_000_007n],
      ["2,047", 2_047n],
    ];
    const hits = (n: bigint): number[] => {
      const t = run(n);
      const h = [1, 0, 0, 0, 0, 0, 0, 0];
      if (t.stop === "small") return h;
      h[1] = t.stop === "equal" || t.stop === "divided" ? t.stopAt + 1 : 12;
      if (t.stop === "equal" || t.stop === "divided") return h;
      h[2] = 1;
      h[3] = t.bases.length;
      h[4] = t.bases.filter((b) => b.verdict === "first").length;
      h[5] = t.bases.reduce((acc, b) => acc + b.x.length - 1, 0);
      h[6] = t.stop === "witness" ? 1 : 0;
      h[7] = t.stop === "all" ? 1 : 0;
      return h;
    };
    const table = inputs.map(([, n]) => hits(n));
    const rows = names.map((name, b) => [name, ...table.map((h) => `${h[b]}`)]);
    const idle = names.filter((_, b) => table.every((h) => h[b] === 0)).length;
    const walkRan = (table[0] as number[]).filter((v) => v > 0).length;
    const walkIdle = (table[0] as number[])
      .flatMap((v, i) => (v === 0 ? ["①②③④⑤⑥⑦⑧"[i] as string] : []))
      .join(" ");
    return block(
      md(["갈래", ...inputs.map(([label]) => label)], rows, [1, 2, 3, 4, 5, 6]),
      `전개 입력이 실제로 실행한 갈래는 ${walkRan} 개이고 ${walkIdle} 은 0 번이라 다른 입력이 채웁니다. 여섯 입력을 합쳐 한 번도 실행되지 않은 갈래는 ${idle} 개입니다.`,
    );
  },

  "float-limit": () => {
    let miss = -1;
    for (let n = 94_906_267; n < 94_916_267; n += 2) {
      if (millerRabinFloat(n) !== millerRabin(BigInt(n))) {
        miss = n;
        break;
      }
    }
    const a = 94_907_627n;
    const nb = BigInt(miss);
    const exact = (a * a) % nb;
    const approx = (Number(a) * Number(a)) % miss;
    let firstOverflow = 94_000_000n;
    while ((firstOverflow - 1n) ** 2n <= 2n ** 53n) firstOverflow += 1n;
    const rows = [
      ["배정밀도가 정수를 오차 없이 담는 한계 2^53", num(2n ** 53n)],
      ["곱 (n − 1)² 이 그 한계를 처음 넘는 법 n", num(firstOverflow)],
      [`전개 입력 ${num(WALK)} 에서 가장 큰 곱`, num((WALK - 1n) ** 2n)],
      ["두 판이 갈리는 첫 입력", num(miss)],
      ["그 입력에서 넘친 곱", `${num(a)} × ${num(a)} = ${num(a * a)}`],
      ["정확한 나머지", num(exact)],
      ["배정밀도가 낸 나머지", num(approx)],
      ["정본의 답", yn(millerRabin(nb))],
      ["배정밀도 판의 답", yn(millerRabinFloat(miss))],
      ["시행 나눗셈의 답", yn(isPrimeByTrial(miss))],
      [
        "전개 입력에서 두 판의 답",
        `${yn(millerRabin(WALK))} · ${yn(millerRabinFloat(Number(WALK)))}`,
      ],
    ];
    return block(
      md(["항목", "값"], rows, [1]),
      `나머지가 ${num(exact - BigInt(approx))} 만큼 어긋나고, 그 한 번이 뒤의 제곱을 전부 다른 값으로 바꿉니다. 전개 입력은 곱이 한계 안쪽이라 두 판의 답이 같습니다.`,
    );
  },

  "float-safe": () => {
    let firstOverflow = 94_000_000n;
    while ((firstOverflow - 1n) ** 2n <= 2n ** 53n) firstOverflow += 1n;
    const top = (LIMIT - 2n) ** 2n;
    return block(
      md(
        [
          "법 n 의 범위",
          "가장 큰 곱 (n − 1)²",
          "2^53 과 비교",
          "number 로 계산",
        ],
        [
          [
            `${num(firstOverflow - 1n)} 이하`,
            num((firstOverflow - 2n) ** 2n),
            "안쪽",
            "정확하다",
          ],
          [
            `${num(firstOverflow)} 이상`,
            `${num((firstOverflow - 1n) ** 2n)} 부터`,
            "넘는다",
            "어긋날 수 있다",
          ],
          [`계약 상한 2^64 − 1`, num(top), "넘는다", "bigint 로만 담는다"],
        ],
      ),
      `계약 상한에서 곱은 ${bitsOf(top)} 비트입니다.`,
    );
  },

  "final-calls": () => {
    const inputs = [
      WALK,
      561n,
      2_047n,
      1_000_000_007n,
      MERSENNE61,
      TOP,
      LIMIT - 1n,
    ];
    return [
      ...columns(
        inputs.map((n) => [`millerRabin(${n}n)`, "→", `${millerRabin(n)}`]),
      ),
    ].join("\n");
  },

  /* ───────── 알아 두면 좋은 개념 ───────── */

  "related-cases": () => {
    const cases: [bigint, bigint][] = [
      [WALK, 3n],
      [WALK, 2n],
      [2_047n, 2n],
      [97n, 2n],
    ];
    const rows = cases.map(([n, a]) => {
      const pass = strongPasses(n, a);
      const prime = isPrimeByTrial(Number(n));
      const cell = prime
        ? pass
          ? "왼쪽 아래 — 옳다"
          : "왼쪽 위 — 일어나지 않는다"
        : pass
          ? "오른쪽 아래 — 틀렸다"
          : "오른쪽 위 — 옳다";
      return [
        num(n),
        `${a}`,
        pass ? "소수라고 답한다" : "합성수라고 답한다",
        prime ? "소수" : "합성수",
        cell,
      ];
    });
    return block(
      md(
        ["n", "밑 a", "강한 판정 한 번의 답", "실제", "표의 칸"],
        rows,
        [0, 1],
      ),
      "왼쪽 위 칸에 드는 줄은 없습니다.",
    );
  },

  /* ───────── 최적인 문제의 모양 ───────── */

  "fit-trial": () => {
    const theirs = trialLastAhead();
    const theirsNext = trialNextPrime(theirs);
    const LIMIT_SWEEP = 4_000_000;
    const flag = new Uint8Array(LIMIT_SWEEP + 1).fill(1);
    flag[0] = 0;
    flag[1] = 0;
    for (let i = 2; i * i <= LIMIT_SWEEP; i++) {
      if (flag[i] === 0) continue;
      for (let j = i * i; j <= LIMIT_SWEEP; j += i) flag[j] = 0;
    }
    let ours = -1;
    for (let p = 5; p <= LIMIT_SWEEP; p += 2) {
      if (flag[p] === 0) continue;
      if (countRun(p).divisions < opsSmall(p).ops) ours = p;
    }
    let oursNext = ours + 2;
    while (flag[oursNext] === 0) oursNext += 2;
    const rows = [997, theirs, theirsNext, 999_983, ours, oursNext].map((p) => {
      const small = opsSmall(p).ops;
      if (small !== run(BigInt(p)).ops) {
        throw new Error(`가벼운 판과 기록 사본이 다르게 셌다 — ${p}`);
      }
      return [
        num(p),
        num(countRun(p).divisions),
        num(small),
        num(shortestBasesOps(p).ops),
      ];
    });
    return block(
      md(
        [
          "소수 n",
          "시행 나눗셈",
          "밀러-라빈(밑 열둘 고정)",
          "밀러-라빈(상한마다 가장 짧은 밑 목록)",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `시행 나눗셈이 가장 짧은 밑 목록의 판보다 마지막으로 적은 소수는 ${num(theirs)} 이고, 이 글의 정본보다 마지막으로 적은 소수는 ${num(ours)} 입니다. 둘째 값은 5 부터 ${num(LIMIT_SWEEP)} 까지의 소수를 전부 재서 찾았습니다.`,
    );
  },

  /* ───────── 경쟁 설계와의 대조 ───────── */

  "alt-counts": () => {
    const ours = cases["밑 열둘 고정 판정"]();
    const alt = cases[`소수 ${TABLE_SIZE} 개 사전 나눗셈`]();
    const rows = Object.keys(ours).map((key) => {
      const a = ours[key as keyof typeof ours];
      const b = alt[key as keyof typeof alt];
      return [
        key,
        num(a),
        num(b),
        a === b ? "같다" : a < b ? "정본" : "경쟁 설계",
      ];
    });
    return block(
      md(
        [
          "항목",
          "밑 열둘 고정 판정",
          `소수 ${TABLE_SIZE} 개 사전 나눗셈`,
          "적은 쪽",
        ],
        rows,
        [1, 2],
      ),
      `묶음은 10^e + 1 부터 연속한 홀수 ${num(WORKLOAD)} 개입니다. 두 설계와 정본이 같은 답을 내는지 대조한 결과는 「${verdictsAgree() ? "같다" : "다르다"}」입니다.`,
    );
  },

  "alt-scale": () => {
    const last = lastOursAhead();
    const rows = [6, 9, 11, 12, 13, 15, 18].map((e) => {
      const a = workloadOps(e, BASES.length);
      const b = workloadOps(e, TABLE_SIZE);
      const best = bestTableSize(e);
      return [
        `10^${e}`,
        num(a),
        num(b),
        b < a ? "경쟁 설계" : "정본",
        `${best} (${num(nthPrime(best))} 까지)`,
      ];
    });
    return block(
      md(
        [
          "묶음 규모",
          "밑 열둘 고정",
          `소수 ${TABLE_SIZE} 개 사전`,
          "적은 쪽",
          "그 규모의 최적 표 크기",
        ],
        rows,
        [1, 2],
      ),
      `10^${SCALE_FROM} 부터 10^${SCALE_TO} 까지 규모마다 재서 정본이 마지막으로 적은 규모는 10^${last} 이고, 그 뒤로는 모든 규모에서 경쟁 설계가 적습니다.`,
    );
  },

  "alt-least-factor": () => {
    const primes = [41n, TABLE_LAST, nthPrime(TABLE_SIZE + 1), 157n, 997n];
    const rows = primes.map((p) => {
      const n = compositeWithLeastFactor(p, 18);
      const a = ourOps(n).ops;
      const b = altOps(n).ops;
      return [
        num(p),
        `${primeIndex(p)}`,
        num(n),
        num(a),
        num(b),
        b < a ? "경쟁 설계" : "정본",
      ];
    });
    return block(
      md(
        [
          "가장 작은 소인수 p",
          "몇 번째 소수",
          "n",
          "밑 열둘 고정",
          `소수 ${TABLE_SIZE} 개 사전`,
          "적은 쪽",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `경쟁 설계의 표는 ${num(TABLE_LAST)} 에서 끝납니다(${TABLE_SIZE} 번째 소수). 그 안에 드는 줄에서는 경쟁 설계가 적고, 벗어나는 줄에서는 표를 끝까지 나눠 본 나눗셈 ${ALT_CELLS - OUR_CELLS} 번을 더 씁니다.`,
    );
  },

  /* ───────── 수식 정의와 유도 ───────── */

  "math-define": () => {
    const x = 12_285n;
    return block(
      md(
        ["x", "이진 표기", "B(x)", "P(x)", "M(x) = B(x) + P(x)"],
        [
          [
            num(x),
            `${x.toString(2)}₂`,
            `${bitsOf(x)}`,
            `${onesOf(x)}`,
            `${multsOf(x)}`,
          ],
        ],
        [0, 2, 3, 4],
      ),
      `${num(x)} 은 이진으로 ${bitsOf(x)} 자리이고 그중 1 인 자리가 ${onesOf(x)} 개입니다.`,
    );
  },

  "math-check": () => {
    const rows = [41n, 97n, CARMICHAEL, 2_047n, WALK, 8_191n].map((n) => {
      const { d, s } = split(n);
      const t = run(n, [2n]);
      const b = t.bases[0];
      const mults = b === undefined ? 0 : b.powOps - 2;
      return [
        num(n),
        num(d),
        `${s}`,
        `${d.toString(2)}₂`,
        `${bitsOf(d)}`,
        `${onesOf(d)}`,
        `${multsOf(d)}`,
        `${mults}`,
      ];
    });
    const agree = rows.filter((r) => r[6] === r[7]).length;
    return block(
      md(
        [
          "n",
          "d",
          "s",
          "d 의 이진 표기",
          "B(d)",
          "P(d)",
          "식 M(d)",
          "실제 모듈러 곱셈",
        ],
        rows,
        [0, 1, 2, 4, 5, 6, 7],
      ),
      `${rows.length} 줄 가운데 식 M(d) 와 실제 모듈러 곱셈이 같은 줄은 ${agree} 개입니다. 실제 값은 밑 2 의 거듭제곱 하나가 쓴 나머지 연산에서 시작할 때의 두 번을 뺀 것입니다.`,
    );
  },

  "math-bound": () => {
    const rows = [13, 61, 64].map((B) => {
      const n = (1n << BigInt(B)) - 1n;
      const prime = millerRabin(n);
      return [
        `${B}`,
        num(24 * B + 12),
        B === 64 ? "계약 상한" : num(n),
        prime ? num(run(n).ops) : "—",
      ];
    });
    return block(
      md(["B", "24B + 12", "n = 2^B − 1", "실제 나머지 연산"], rows, [0, 1, 3]),
      `2^13 − 1 과 2^61 − 1 은 소수라 식의 값과 실제 값이 같고, 2^64 − 1 은 소수가 아닙니다.`,
    );
  },

  "math-scale": () => {
    const rows = [12, 13, 16, 17, 19, 20].map((B) => {
      let best = 0;
      let arg = 0;
      const lo = 2 ** (B - 1);
      for (let n = lo + 1; n <= lo * 2; n += 2) {
        const r = opsSmall(n);
        if (!r.prime) continue;
        if (r.ops > best) {
          best = r.ops;
          arg = n;
        }
      }
      return [
        `${B}`,
        num(24 * B + 12),
        num(best),
        num(arg),
        millerRabin((1n << BigInt(B)) - 1n) ? "그렇다" : "아니다",
      ];
    });
    const over = rows.filter(
      (r) => Number(r[2]?.replace(/,/g, "")) > Number(r[1]?.replace(/,/g, "")),
    ).length;
    return block(
      md(
        [
          "B(n − 1)",
          "식 24B + 12",
          "그 B 의 소수 중 실제 최대",
          "그 입력",
          "2^B − 1 이 소수",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `셋째 칸이 둘째 칸을 넘는 줄은 ${over} 개입니다. 둘이 같은 줄은 다섯째 칸이 「그렇다」인 줄뿐이고, 그때 n = 2^B − 1 이라 d 의 자리가 전부 1 이고 s 가 1 입니다.`,
    );
  },

  /* ───────── 불변식 ───────── */

  "invariant-bases": () => {
    const rows = [2n, 3n].map((a) => {
      const seq = fullSequence(WALK, a);
      const firstOne = seq.indexOf(1n);
      const before = seq[firstOne - 1] as bigint;
      return [
        `${a}`,
        seq.map(num).join(" → "),
        `r = ${firstOne}`,
        num(before),
        before === WALK - 1n ? "참" : "거짓",
      ];
    });
    return block(
      md(
        ["밑 a", "제곱 수열", "1 이 처음 나오는 자리", "그 직전", "불변식"],
        rows,
        [0, 3],
      ),
      `밑 3 에서 문장이 거짓이 되어 증인 갈래가 ${millerRabin(WALK)} 를 돌려줍니다.`,
    );
  },

  "invariant-edges": () => {
    const inputs = [0n, 1n, 2n, 4n, 41n, 43n, 1_369n, WALK, 1_000_003n];
    const rows = inputs.map((n) => [
      num(n),
      stopName(n),
      yn(millerRabin(n)),
      yn(isPrimeByTrial(Number(n))),
    ]);
    let agree = 0;
    for (let v = 0; v <= 20_000; v++) {
      if (millerRabin(BigInt(v)) === isPrimeByTrial(v)) agree += 1;
    }
    return block(
      md(["입력 n", "답하는 자리", "정본", "시행 나눗셈"], rows, [0]),
      `0 부터 20,000 까지 20,001 개 입력에서 두 판정이 같은 입력은 ${num(agree)} 개입니다.`,
    );
  },

  "mutant-no-minus-one": () => {
    const inputs = [41n, 43n, 47n, 97n, WALK, 1_000_000_007n];
    const rows = inputs.map((n) => {
      const { d } = split(n);
      const culprit = BASES.filter((a) => n !== a && n % a !== 0n).find(
        (a) => modPow(a, d, n) === n - 1n,
      );
      const a = millerRabin(n);
      const b = NO_MINUS_ONE.millerRabin(n);
      return [
        num(n),
        culprit === undefined ? "없다" : `${culprit}`,
        yn(a),
        yn(b),
        yn(isPrimeByTrial(Number(n))),
        same(a, b),
      ];
    });
    let diff = 0;
    let flipped = 0;
    for (let n = 3; n <= 200_000; n += 2) {
      const truth = millerRabin(BigInt(n));
      if (truth === NO_MINUS_ONE.millerRabin(BigInt(n))) continue;
      diff += 1;
      if (truth) flipped += 1;
    }
    return block(
      md(
        [
          "입력",
          "첫 값이 n − 1 인 밑",
          "정본",
          "n − 1 검사를 뺀 판",
          "시행 나눗셈",
          "두 답",
        ],
        rows,
        [0],
      ),
      `3 부터 200,000 까지 홀수에서 두 판이 갈리는 입력은 ${num(diff)} 개이고, 그중 소수가 합성수로 뒤집힌 것이 ${num(flipped)} 개입니다.`,
    );
  },

  "why-43": () => {
    const rows = [
      [43n, 3n],
      [41n, 23n],
    ].map(([n, a]) => {
      const nn = n as bigint;
      const aa = a as bigint;
      const { d, s } = split(nn);
      const seq = fullSequence(nn, aa);
      return [
        num(nn),
        `${aa}`,
        `${num(d)} · ${s}`,
        seq.map(num).join(" → "),
        `${s - 1}`,
        strongPasses(nn, aa) ? "통과" : "증인",
      ];
    });
    return block(
      md(
        [
          "n",
          "밑 a",
          "d · s",
          "제곱 수열(끝 값까지)",
          "제곱 루프 횟수",
          "정본의 판정",
        ],
        rows,
        [0, 1, 4],
      ),
      "두 줄 모두 첫 값이 n − 1 이고, 그다음 값부터는 1 만 이어집니다.",
    );
  },

  /* ───────── 비용 계산 ───────── */

  "perf-walk": () => {
    const t = run(WALK);
    const rows: string[][] = [["T2", "밑 열둘로 나눠 보기", num(t.preOps)]];
    const steps = walkSteps();
    for (const b of t.bases) {
      const firstStep = steps.find((s) => s.title === `밑 ${b.a} 의 첫 값`)?.id;
      rows.push([firstStep ?? "", `밑 ${b.a} 의 거듭제곱`, num(b.powOps)]);
      if (b.loopOps > 0) {
        rows.push([
          `T${Number(firstStep?.slice(1)) + 1}`,
          `밑 ${b.a} 의 제곱 루프`,
          num(b.loopOps),
        ]);
      }
    }
    const sum =
      t.preOps + t.bases.reduce((acc, b) => acc + b.powOps + b.loopOps, 0);
    return block(
      md(["걸음", "하는 일", "나머지 연산"], rows, [2]),
      `더하면 ${num(sum)} 이고, 기록 사본이 센 전체 ${num(t.ops)} 과 같습니다. T1 · T3 · T8 은 비교와 비트 연산뿐이라 0 입니다.`,
    );
  },

  "perf-formula": () => {
    const inputs = [
      1_000_000_000n,
      1_369n,
      WALK,
      25_326_001n,
      998_244_353n,
      1_000_000_007n,
      MERSENNE61,
    ];
    const rows = inputs.map((n) => {
      const t = run(n);
      let formula: number;
      let where: string;
      if (t.stop === "divided" || t.stop === "equal") {
        formula = t.preOps;
        where = `② 의 ${t.stopAt + 1} 번째 밑`;
      } else {
        const perBase = t.bases.reduce(
          (acc, b) => acc + 2 + multsOf(t.d) + (b.x.length - 1),
          0,
        );
        formula = BASES.length + perBase;
        where =
          t.stop === "witness"
            ? `밑 ${t.bases.length} 개째가 증인`
            : "밑 열둘을 다 봤다";
      }
      return [num(n), yn(t.answer), where, num(formula), num(t.ops)];
    });
    const agree = rows.filter((r) => r[3] === r[4]).length;
    return block(
      md(
        [
          "입력",
          "정본",
          "멈춘 자리",
          "식이 내는 나머지 연산",
          "실행이 센 나머지 연산",
        ],
        rows,
        [0, 3, 4],
      ),
      `${rows.length} 줄 가운데 넷째 칸과 다섯째 칸이 같은 줄은 ${agree} 개입니다.`,
    );
  },

  "worst-shapes": () => {
    const list: [string, bigint][] = [
      ["짝수", LIMIT - 2n],
      ["3 의 배수", LIMIT - 1n],
      ["가장 작은 소인수가 41", compositeWithLeastFactor(41n, 18)],
      ["1 인 비트가 적은 큰 소수", 9_223_372_036_863_164_417n],
      ["2^64 아래 가장 큰 소수", TOP],
      ["메르센 소수 2^61 − 1", MERSENNE61],
      ["2^64 − 257", LIMIT - 257n],
    ];
    const rows = list.map(([shape, n]) => {
      const t = run(n);
      const deep = t.stop === "witness" || t.stop === "all";
      return [
        shape,
        num(n),
        yn(t.answer),
        deep ? `${bitsOf(t.d)} / ${onesOf(t.d)}` : "—",
        deep ? `${t.s}` : "—",
        num(t.ops),
      ];
    });
    return block(
      md(
        ["입력 모양", "n", "정본", "d 의 B / P", "s", "나머지 연산"],
        rows,
        [1, 4, 5],
      ),
      `일곱 줄의 n 이 전부 10^18 이상인데 마지막 칸은 ${rows[0]?.[5]} 부터 ${num(run(LIMIT - 257n).ops)} 까지 갈립니다. B = 64 에서 식이 내는 상한은 ${num(24 * 64 + 12)} 입니다.`,
    );
  },

  "worst-construct": () => {
    const rows: string[][] = [];
    let found = -1;
    for (let i = 0; i <= 62; i++) {
      const d =
        i === 0 ? (1n << 63n) - 1n : (1n << 63n) - 1n - (1n << BigInt(i));
      const n = 2n * d + 1n;
      const prime = millerRabin(n);
      rows.push([
        i === 0 ? "지우지 않는다" : `${i}`,
        `${onesOf(d)}`,
        num(n),
        yn(prime),
        prime ? num(run(n).ops) : "—",
      ]);
      if (prime) {
        found = i;
        break;
      }
    }
    return block(
      md(
        [
          "d 에서 지운 비트 자리 i",
          "d 의 1 인 비트",
          "n = 2d + 1",
          "정본",
          "나머지 연산",
        ],
        rows,
        [1, 2, 4],
      ),
      `d = 2^63 − 1 에서 비트를 하나도 안 지운 줄과 자리 1 부터 ${found - 1} 까지 하나씩 지운 줄은 합성수이고, 자리 ${found}${을를(found)} 지운 줄에서 처음 소수가 나옵니다. 자리 0 을 지우면 d 가 짝수가 되므로 건너뛰었습니다.`,
    );
  },

  "prediv-share": () => {
    const start = 10n ** 18n + 1n;
    const count = 200_000;
    let atPre = 0;
    let deep = 0;
    let primes = 0;
    for (let i = 0; i < count; i++) {
      const n = start + 2n * BigInt(i);
      const t = run(n);
      if (t.stop === "divided") atPre += 1;
      else deep += 1;
      if (t.answer) primes += 1;
    }
    return block(
      md(
        ["묶음", "사전 나눗셈에서 답", "밑 판정까지", "그중 소수"],
        [
          [
            `10^18 + 1 부터 홀수 ${num(count)} 개`,
            num(atPre),
            num(deep),
            num(primes),
          ],
        ],
        [1, 2, 3],
      ),
      `사전 나눗셈에서 답한 비율은 ${((atPre / count) * 100).toFixed(1)} % 입니다.`,
    );
  },

  /* ───────── 스스로 점검하기 ───────── */

  "selfcheck-2047": () => {
    const n = 2_047n;
    const t = run(n);
    const rows = t.rems.map((r, i) => [`${BASES[i]}`, num(r)]);
    return block(
      md(["밑 a", "2,047 mod a"], rows, [0, 1]),
      `${t.stopAt + 1} 번째 밑 ${BASES[t.stopAt]} 에서 나머지가 0 이라 ${t.answer} 를 돌려줍니다. 나머지 연산은 ${t.ops} 번이고, 전개 입력 ${num(WALK)} 의 ${num(run(WALK).ops)} 번보다 적습니다.`,
    );
  },
};
