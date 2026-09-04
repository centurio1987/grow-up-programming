/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/millerRabin/millerRabin-guide.md
 *
 * **세는 사본이 셋 있다**(`trace` · `opsOf` · `branchesOf`). 정본은 걸음마다의 상태도 곱셈
 * 횟수도 갈래 실행 횟수도 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼
 * 방법이 없다. **판정이 맞는지는 사본이 아니라 정본이 진다** — 아래 표에서 「정본」 칸은
 * 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * **작은 규모의 스윕은 `number` 로 계산한다.** 스윕 상한 1,400,000 에서 곱이 `2·10^12` 라
 * `2^53` 안쪽이고, 그 경계가 이 편의 멈춤 하나가 값으로 다루는 자리다. 계약 범위(`2^64`)의
 * 계산은 전부 `bigint` 다.
 *
 * 경쟁 설계 대조 표는 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면 한쪽만
 * 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  ALT_CELLS,
  altOps,
  bestTableSize,
  cases,
  compositeWithLeastFactor,
  flipScale,
  nthPrime,
  OUR_CELLS,
  ourOps,
  primeIndex,
  TABLE_LAST,
  TABLE_SIZE,
  verdictsAgree,
  WORKLOAD,
  workloadOps,
} from "./millerRabin-guide.alt.ts";
import { millerRabin } from "./millerRabin-guide.ref.ts";

const REF = new URL("./millerRabin-guide.ref.ts", import.meta.url).pathname;

/** 본문 전개가 쓰는 고정 입력. `49,141 = 157 × 313` 이다. */
const WALK = 49_141n;

/** 계약의 상한. */
const LIMIT = 1n << 64n;

/** 밑 목록 — 정본과 같다. 세는 사본들이 함께 쓴다. */
const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

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

const yn = (b: boolean): string => (b ? "소수" : "소수 아님");

/* ────────────────────── 세는 자리 ────────────────────── */

const bitsOf = (x: bigint): number => x.toString(2).length;
const onesOf = (x: bigint): number =>
  [...x.toString(2)].filter((c) => c === "1").length;

/** `n - 1` 을 홀수 `d` 와 2 의 개수 `s` 로 가른다. */
function split(n: bigint): { d: bigint; s: number } {
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1;
  }
  return { d, s };
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n % mod;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

/** 정본과 같은 절차에 기본 연산 계수만 덧붙인 사본. 곱셈·나머지를 각각 1 로 센다. */
function opsOf(n: bigint): number {
  let ops = 0;
  if (n < 2n) return ops;
  for (const a of BASES) {
    if (n === a) return ops;
    ops += 1;
    if (n % a === 0n) return ops;
  }
  const { d, s } = split(n);
  for (const a of BASES) {
    let result = 1n % n;
    let b = a % n;
    let e = d;
    while (e > 0n) {
      if ((e & 1n) === 1n) {
        ops += 2;
        result = (result * b) % n;
      }
      ops += 2;
      b = (b * b) % n;
      e >>= 1n;
    }
    let x = result;
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let i = 1; i < s; i++) {
      ops += 2;
      x = (x * x) % n;
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    if (witness) return ops;
  }
  return ops;
}

/** 갈래 여덟이 각각 몇 번 실행됐는가. `P4` 가 못 보는 자리를 실행으로 채운다. */
interface Branches {
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  b5: number;
  b6: number;
  b7: number;
  b8: number;
}

function branchesOf(n: bigint): Branches {
  const hit: Branches = {
    b1: 0,
    b2: 0,
    b3: 0,
    b4: 0,
    b5: 0,
    b6: 0,
    b7: 0,
    b8: 0,
  };
  hit.b1 += 1;
  if (n < 2n) return hit;
  for (const a of BASES) {
    hit.b2 += 1;
    if (n === a || n % a === 0n) return hit;
  }
  const { d, s } = split(n);
  hit.b3 += 1;
  for (const a of BASES) {
    hit.b4 += 1;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) {
      hit.b5 += 1;
      continue;
    }
    let witness = true;
    for (let i = 1; i < s; i++) {
      hit.b6 += 1;
      x = (x * x) % n;
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    if (witness) {
      hit.b7 += 1;
      return hit;
    }
  }
  hit.b8 += 1;
  return hit;
}

/** 갈래 여덟의 실행 횟수를 순서대로 편 배열. */
const branchList = (n: bigint): number[] => {
  const h = branchesOf(n);
  return [h.b1, h.b2, h.b3, h.b4, h.b5, h.b6, h.b7, h.b8];
};

interface Step {
  label: string;
  branch: string;
  base: string;
  x: string;
  verdict: string;
}

/** 정본과 같은 절차에 걸음마다의 상태를 덧붙인 사본. */
function trace(n: bigint): Step[] {
  const steps: Step[] = [];
  const push = (branch: string, base: string, x: string, verdict: string) =>
    steps.push({ label: `T${steps.length + 1}`, branch, base, x, verdict });
  if (n < 2n) {
    push("①", "—", "—", "소수 아님");
    return steps;
  }
  push("①", "—", "—", `${comma(n)} ≥ 2`);
  const rems = BASES.map((a) => `${n % a}`).join(" ");
  for (const a of BASES) {
    if (n === a) {
      push("②", `${a}`, "—", "소수");
      return steps;
    }
    if (n % a === 0n) {
      push("②", `${a}`, "—", "소수 아님");
      return steps;
    }
  }
  push("②", "2 … 37", "—", `나머지 ${rems} — 0 이 없다`);
  const { d, s } = split(n);
  push("③", "—", "—", `d = ${comma(d)}, s = ${s}`);
  for (const a of BASES) {
    let x = modPow(a, d, n);
    push("④⑤", `${a}`, comma(x), x === 1n || x === n - 1n ? "통과" : "미정");
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let i = 1; i < s; i++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        witness = false;
        push("⑥", `${a}`, comma(x), "통과");
        break;
      }
      push("⑥", `${a}`, comma(x), "미정");
    }
    if (witness) {
      push("⑦", `${a}`, comma(x), "증인 — 소수 아님");
      return steps;
    }
  }
  push("⑧", "—", "—", "소수");
  return steps;
}

/* ──────────── 작은 규모 스윕 — `number` 로 계산한다 ──────────── */

/** 스윕 상한. 곱이 `2^53` 안쪽이라 배정밀도로도 정확하다. */
const SWEEP_LIMIT = 1_400_000;

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

/** `n` 이 밑 `a` 의 강한 판정을 통과하는가. */
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

function isPrimeByTrial(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
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

/** `x^2 ≡ 1 (mod n)` 의 해. `n` 이 작을 때만 쓴다. */
function rootsOfOne(n: number): number[] {
  const out: number[] = [];
  for (let x = 1; x < n; x++) if ((x * x) % n === 1) out.push(x);
  return out;
}

function gcdNum(a: number, b: number): number {
  return b === 0 ? a : gcdNum(b, a % b);
}

/**
 * 코르셀트 판정으로 카마이클 수를 가른다 — 제곱 인수가 없고, 소인수 `p` 마다 `p − 1` 이
 * `n − 1` 을 나누며, 서로 다른 소인수가 셋 이상이다.
 */
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

/** 가장 작은 소인수. 소수이거나 2 보다 작으면 `-1`. */
function leastFactor(n: number): number {
  if (n < 4) return -1;
  if (n % 2 === 0) return 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d;
  return -1;
}

/* ────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────── */

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

/** 배정밀도로 계산한 판. 변이가 아니라 `number` 로 옮겨 적은 사본이다. */
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

/** 두 판이 갈리는 첫 입력. `from` 부터 홀수만 차례로 본다. */
function firstFloatMiss(from: number, span: number): number {
  for (let n = from % 2 === 0 ? from + 1 : from; n < from + span; n += 2) {
    if (millerRabinFloat(n) !== millerRabin(BigInt(n))) return n;
  }
  return -1;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 시행 나눗셈을 계약 상한까지 밀면 몇 번인가. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["입력 규모", "2 부터 √n 까지", "밑 열둘 판정의 모듈러 곱셈"],
    ];
    for (const e of [3, 6, 9, 12, 15, 18]) {
      const n = nextOddPrimeNear(10n ** BigInt(e));
      rows.push([
        `10^${e} 근방의 소수`,
        comma(isqrt(n)),
        comma((opsOf(n) - BASES.length) / 2),
      ]);
    }
    const top = nextOddPrimeNear(LIMIT - 1000n);
    rows.push([
      "2^64 아래 소수",
      comma(isqrt(top)),
      comma((opsOf(top) - BASES.length) / 2),
    ]);
    return `${table(rows, [1, 2]).join("\n")}
        └ 둘째 칸은 실행하지 않고 √n 을 구해 센 값이고, 소수는 후보를 끝까지 쓴다.
          셋째 칸은 정본을 실행해 센 모듈러 곱셈 횟수다`;
  },

  /** 페르마 판정과 강한 판정을 카마이클 수 561 에 나란히 건다. */
  "fermat-carmichael": () => {
    const n = 561;
    const rows: string[][] = [
      [
        "밑 a",
        "a^560 mod 561",
        "페르마 판정",
        "제곱 수열 a^35 → …",
        "강한 판정",
      ],
    ];
    for (const a of [2, 4, 5, 7, 8, 10]) {
      const chain: number[] = [];
      let x = modPowNum(a, 35, n);
      chain.push(x);
      for (let i = 1; i < 4; i++) {
        x = (x * x) % n;
        chain.push(x);
      }
      rows.push([
        `${a}`,
        `${modPowNum(a, 560, n)}`,
        modPowNum(a, 560, n) === 1 ? "통과" : "합성수",
        chain.join(" → "),
        passes(n, a) ? "통과" : "합성수",
      ]);
    }
    // 표의 여섯 밑만이 아니라 561 과 서로소인 밑 전부를 재 본다.
    let coprime = 0;
    let fermatPass = 0;
    let strongPass = 0;
    for (let a = 2; a < n; a++) {
      if (gcdNum(a, n) !== 1) continue;
      coprime += 1;
      if (modPowNum(a, n - 1, n) === 1) fermatPass += 1;
      if (passes(n, a)) strongPass += 1;
    }
    let carmichael = 0;
    for (let v = 3; v < 1_000_000; v += 2) if (isCarmichael(v)) carmichael += 1;
    return `${table(rows, [0, 1]).join("\n")}
        └ 561 = 3 × 11 × 17 이고 정본의 답은 ${yn(millerRabin(561n))} 이다.
          561 과 서로소인 밑 ${comma(coprime)} 개 가운데 페르마 판정을 통과하는 것이 ${comma(fermatPass)} 개이고
          강한 판정을 통과하는 것이 ${comma(strongPass)} 개다. 같은 성질을 갖는 수는 10^6 아래에 ${comma(carmichael)} 개 있다`;
  },

  /** 1 의 제곱근이 몇 개인가 — 소수와 합성수를 나란히. */
  "sqrt-one": () => {
    const rows: string[][] = [
      ["법 n", "x² ≡ 1 (mod n) 의 해", "해 개수", "정본"],
    ];
    for (const n of [7, 11, 13, 15, 21, 561]) {
      const roots = rootsOfOne(n);
      rows.push([
        comma(n),
        roots.length <= 6
          ? roots.map(comma).join(" ")
          : `${roots.slice(0, 5).map(comma).join(" ")} …`,
        `${roots.length}`,
        yn(millerRabin(BigInt(n))),
      ]);
    }
    const walkRoots = rootsOfOne(Number(WALK));
    rows.push([
      comma(WALK),
      walkRoots.map(comma).join(" "),
      `${walkRoots.length}`,
      yn(millerRabin(WALK)),
    ]);
    return `${table(rows, [0, 2]).join("\n")}
        └ 넷째 칸이 소수인 줄은 해가 1 과 n−1 둘뿐이고, 합성수인 줄은 그보다 많다.
          마지막 줄이 전개 입력이고 ${comma(walkRoots[1] as number)} 과 ${comma(walkRoots[2] as number)} 가 1 도 n−1 도 아닌 해다`;
  },

  /** 밑을 몇 개 써야 속지 않는가 — 스윕으로 센다. */
  "psi-sweep": () => {
    const rows: string[][] = [
      [
        "밑 개수",
        "쓰는 밑",
        "통과하는 가장 작은 홀 합성수",
        "그 수의 인수분해",
      ],
    ];
    for (const k of [1, 2, 3]) {
      const n = firstLiar(k);
      rows.push([
        `${k}`,
        BASES.slice(0, k).join(" "),
        n < 0 ? `${comma(SWEEP_LIMIT)} 까지 없다` : comma(n),
        n < 0 ? "—" : `${comma(leastFactor(n))} × ${comma(n / leastFactor(n))}`,
      ]);
    }
    // 밑 셋짜리 값은 스윕 범위 밖이라 성질만 실행으로 확인한다.
    const three = 25_326_001;
    const threeOk =
      !isPrimeByTrial(three) &&
      [2, 3, 5].every((a) => passes(three, a)) &&
      !passes(three, 7);
    return `${table(rows, [0, 2]).join("\n")}
        └ 9 부터 ${comma(SWEEP_LIMIT)} 까지 홀수를 전부 재서 찾은 값이다. 밑 셋을 통과하는 수는
          이 범위 안에 없고, 범위 밖의 ${comma(three)} = ${comma(leastFactor(three))} × ${comma(three / leastFactor(three))} 이
          합성수이면서 밑 2·3·5 를 통과하고 밑 7 에서 걸리는가: ${threeOk ? "그렇다" : "아니다"}`;
  },

  /** 2^64 를 덮으려면 밑이 몇 개여야 하는가. */
  "base-count": () => {
    const psi11 = 3_825_123_056_546_413_051n;
    const psi12 = 318_665_857_834_031_151_167_461n;
    const rows: string[][] = [
      ["수", "인수분해", "통과하는 밑 개수", "첫 증인", "2^64 보다"],
    ];
    for (const [n, f] of [
      [psi11, "747,451 × 149,491 × 34,233,211"],
      [psi12, "399,165,290,221 × 798,330,580,441"],
    ] as [bigint, string][]) {
      const { d, s } = split(n);
      let k = 0;
      let first = "—";
      for (const a of [...BASES, 41n]) {
        let x = modPow(a, d, n);
        let ok = x === 1n || x === n - 1n;
        for (let i = 1; i < s && !ok; i++) {
          x = (x * x) % n;
          ok = x === n - 1n;
        }
        if (ok) k += 1;
        else {
          first = `${a}`;
          break;
        }
      }
      rows.push([comma(n), f, `${k}`, first, n < LIMIT ? "작다" : "크다"]);
    }
    return `${table(rows, [0, 2]).join("\n")}
        └ 첫 줄은 밑 열하나를 통과하고 2^64 = ${comma(LIMIT)} 보다 작다 — 열하나로는 모자란다.
          둘째 줄은 밑 열둘을 통과하지만 2^64 의 ${comma(psi12 / LIMIT)} 배가 넘어 계약 밖이다`;
  },

  /** 전개 입력을 처음부터 끝까지. */
  "walk-trace": () => {
    const steps = trace(WALK);
    const rows: string[][] = [["걸음", "갈래", "밑 a", "x", "그 자리의 판정"]];
    for (const st of steps) {
      rows.push([st.label, st.branch, st.base, st.x, st.verdict]);
    }
    return `${table(rows, [0]).join("\n")}
        └ n = ${comma(WALK)} 이고 반환값은 ${millerRabin(WALK)} 다.
          밑 2 는 T5 에서 통과했고 밑 3 이 T8 에서 증인이 되어 거기서 끝난다`;
  },

  /** 갈래 여덟이 실제로 몇 번 실행됐는가. */
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
      ["전개 입력 49,141", WALK],
      ["1", 1n],
      ["37", 37n],
      ["1,000,000,000", 1_000_000_000n],
      ["1,000,000,007", 1_000_000_007n],
      ["2,047", 2_047n],
    ];
    const rows: string[][] = [["갈래", ...inputs.map(([label]) => label)]];
    const totals: number[] = new Array(8).fill(0);
    for (let b = 0; b < 8; b++) {
      const cells = inputs.map(([, n]) => {
        const v = branchList(n)[b] ?? 0;
        totals[b] = (totals[b] ?? 0) + v;
        return `${v}`;
      });
      rows.push([names[b] ?? "", ...cells]);
    }
    const zero = totals.filter((v) => v === 0).length;
    const walkRan = branchList(WALK).filter((v) => v > 0).length;
    const walkIdle = branchList(WALK)
      .map((v, i) => (v === 0 ? "①②③④⑤⑥⑦⑧"[i] : ""))
      .join("");
    return `${table(rows, [1, 2, 3, 4, 5, 6]).join("\n")}
        └ 전개 입력이 실제로 실행한 갈래는 ${walkRan} 개이고 ${walkIdle} 은 0 번이라 다른 입력이 채운다.
          여섯 입력을 합쳐 한 번도 안 돈 갈래는 ${zero} 개다`;
  },

  /** 밑을 2 하나로 줄이면 무엇이 틀리는가. */
  "mutant-single-base": () => {
    const rows: string[][] = [
      ["입력", "인수분해", "정본", "밑 2 하나만 쓰는 판", "정의대로"],
    ];
    for (const n of [2_047, 3_277, 4_033, 49_141, 1_373_653, 1_000_000_007]) {
      const f = leastFactor(n);
      rows.push([
        comma(n),
        f < 0 ? "소수" : `${comma(f)} × ${comma(n / f)}`,
        yn(millerRabin(BigInt(n))),
        yn(SINGLE_BASE.millerRabin(BigInt(n))),
        yn(isPrimeByTrial(n)),
      ]);
    }
    let diff = 0;
    for (let n = 3; n <= 200_000; n += 2) {
      if (millerRabin(BigInt(n)) !== SINGLE_BASE.millerRabin(BigInt(n))) {
        diff += 1;
      }
    }
    return `${table(rows, [0]).join("\n")}
        └ 셋째 칸과 다섯째 칸이 여섯 줄 내내 같고 넷째 칸은 위 넷에서 어긋난다.
          3 부터 200,000 까지 홀수에서 두 판이 갈리는 입력은 ${comma(diff)} 개다`;
  },

  /** 제곱 루프에서 1 을 찾으면 무엇이 틀리는가. */
  "mutant-find-one": () => {
    const rows: string[][] = [
      ["입력", "밑 3 의 제곱 수열", "정본", "1 을 찾는 판", "정의대로"],
    ];
    for (const n of [41n, 53n, 97n, 193n, WALK]) {
      const { d, s } = split(n);
      const chain: string[] = [];
      let x = modPow(3n, d, n);
      chain.push(comma(x));
      for (let i = 1; i < s; i++) {
        x = (x * x) % n;
        chain.push(comma(x));
      }
      rows.push([
        comma(n),
        chain.join(" → "),
        yn(millerRabin(n)),
        yn(FIND_ONE.millerRabin(n)),
        yn(isPrimeByTrial(Number(n))),
      ]);
    }
    let diff = 0;
    let flipped = 0;
    for (let n = 3; n <= 200_000; n += 2) {
      const truth = millerRabin(BigInt(n));
      if (truth === FIND_ONE.millerRabin(BigInt(n))) continue;
      diff += 1;
      if (truth) flipped += 1;
    }
    return `${table(rows, [0]).join("\n")}
        └ 셋째 칸과 다섯째 칸이 다섯 줄 내내 같다.
          3 부터 200,000 까지 홀수에서 두 판이 갈리는 입력은 ${comma(diff)} 개이고
          그중 소수가 합성수로 뒤집힌 것이 ${comma(flipped)} 개다`;
  },

  /** 배정밀도로 옮기면 어디서 값이 틀리는가. */
  "float-limit": () => {
    const miss = firstFloatMiss(94_906_265, 10_000);
    const a = 94_907_627n;
    const n = BigInt(miss);
    const exact = (a * a) % n;
    const approx = (Number(a) * Number(a)) % Number(n);
    const rows: string[][] = [["무엇", "값"]];
    // 곱 (n−1)² 이 한계를 처음 넘는 법을 실행으로 찾는다 — 제곱근을 그대로 적으면 한 칸 어긋난다.
    let firstOverflow = isqrt(2n ** 53n);
    while ((firstOverflow - 1n) ** 2n <= 2n ** 53n) firstOverflow += 1n;
    rows.push(["배정밀도가 정수를 오차 없이 담는 한계 2^53", comma(2n ** 53n)]);
    rows.push(["곱 (n−1)² 이 그 한계를 처음 넘는 법 n", comma(firstOverflow)]);
    rows.push(["전개 입력 49,141 에서 가장 큰 곱", comma(49_140n * 49_140n)]);
    rows.push(["두 판이 갈리는 첫 입력", comma(miss)]);
    rows.push([
      "그 입력에서 넘친 곱",
      `${comma(a)} × ${comma(a)} = ${comma(a * a)}`,
    ]);
    rows.push(["정확한 나머지", comma(exact)]);
    rows.push(["배정밀도가 낸 나머지", comma(approx)]);
    rows.push(["정본의 답", yn(millerRabin(n))]);
    rows.push(["배정밀도 판의 답", yn(millerRabinFloat(miss))]);
    rows.push(["시행 나눗셈으로 확인한 답", yn(isPrimeByTrial(miss))]);
    rows.push([
      "전개 입력에서 두 판의 답",
      `${yn(millerRabin(WALK))} · ${yn(millerRabinFloat(Number(WALK)))}`,
    ]);
    return `${table(rows).join("\n")}
        └ 나머지가 1 만큼 어긋나고, 그 한 번이 밑 7 의 거듭제곱 결과를 1 이 아닌 값으로 바꾼다.
          전개 입력은 곱이 한계 안쪽이라 두 판의 답이 같다`;
  },

  /** 경계 입력이 어느 갈래에서 답하는가. */
  "edge-values": () => {
    const rows: string[][] = [
      ["입력 n", "어느 갈래가 답하나", "정본", "시행 나눗셈"],
    ];
    // `invariant` 절은 원문자 라벨을 쓰지 않는다(SPEC §3) — 갈래를 이름으로 적는다.
    const branchName = (n: bigint): string => {
      const h = branchesOf(n);
      if (n < 2n) return "2 보다 작은가";
      if (h.b3 === 0) return "밑 목록 나눗셈";
      if (h.b7 > 0) return "증인 확정";
      return "밑 열둘 통과";
    };
    for (const v of [0, 1, 2, 3, 4, 37, 41, 1_369, 49_141, 1_000_003]) {
      rows.push([
        comma(v),
        branchName(BigInt(v)),
        yn(millerRabin(BigInt(v))),
        yn(isPrimeByTrial(v)),
      ]);
    }
    let same = 0;
    for (let v = 0; v <= 20_000; v++) {
      if (millerRabin(BigInt(v)) === isPrimeByTrial(v)) same += 1;
    }
    return `${table(rows, [0]).join("\n")}
        └ 셋째 칸과 넷째 칸이 열 줄 내내 같다. 시행 나눗셈은 정의를 그대로 옮긴 판이다.
          0 부터 20,000 까지 20,001 개 입력에서 두 판정이 같은 자리는 ${comma(same)} 개다`;
  },

  /** 첫 값 검사에서 n−1 을 빼면 무엇이 틀리는가. */
  "mutant-no-minus-one": () => {
    const rows: string[][] = [
      [
        "입력",
        "n − 1",
        "첫 값이 n−1 인 밑",
        "정본",
        "n−1 검사를 뺀 판",
        "정의대로",
      ],
    ];
    const inputs = [41n, 43n, 47n, 97n, 49_141n, 1_000_000_007n];
    for (const n of inputs) {
      const { d } = split(n);
      const culprit = BASES.filter((a) => n !== a && n % a !== 0n).find(
        (a) => modPow(a, d, n) === n - 1n,
      );
      rows.push([
        comma(n),
        comma(n - 1n),
        culprit === undefined ? "없다" : `${culprit}`,
        yn(millerRabin(n)),
        yn(NO_MINUS_ONE.millerRabin(n)),
        yn(isPrimeByTrial(Number(n))),
      ]);
    }
    const off = inputs.filter(
      (n) => millerRabin(n) !== NO_MINUS_ONE.millerRabin(n),
    );
    let diff = 0;
    let flipped = 0;
    for (let n = 3; n <= 200_000; n += 2) {
      const truth = millerRabin(BigInt(n));
      if (truth === NO_MINUS_ONE.millerRabin(BigInt(n))) continue;
      diff += 1;
      if (truth) flipped += 1;
    }
    return `${table(rows, [0]).join("\n")}
        └ 넷째 칸과 다섯째 칸이 어긋나는 줄은 ${off.map((n) => comma(n)).join(" · ")} 이고,
          그 줄들이 정확히 셋째 칸에 밑이 적힌 줄이다. 3 부터 200,000 까지 홀수에서 두 판이
          갈리는 입력은 ${comma(diff)} 개이고 그중 소수가 합성수로 뒤집힌 것이 ${comma(flipped)} 개다`;
  },

  /** M(d) = B(d) + P(d) 를 작은 값에 넣어 검산한다. */
  "math-check": () => {
    const rows: string[][] = [
      ["n", "d", "s", "d 의 이진 표현", "B(d)", "P(d)", "식 B+P", "실제 곱셈"],
    ];
    for (const n of [41n, 97n, 561n, 2_047n, WALK, 8_191n]) {
      const { d, s } = split(n);
      let mults = 0;
      let e = d;
      while (e > 0n) {
        if ((e & 1n) === 1n) mults += 1;
        mults += 1;
        e >>= 1n;
      }
      rows.push([
        comma(n),
        comma(d),
        `${s}`,
        d.toString(2),
        `${bitsOf(d)}`,
        `${onesOf(d)}`,
        `${bitsOf(d) + onesOf(d)}`,
        `${mults}`,
      ]);
    }
    return `${table(rows, [0, 1, 2, 4, 5, 6, 7]).join("\n")}
        └ 일곱째 칸과 여덟째 칸이 여섯 줄 내내 같다.
          넷째 칸의 자릿수가 B(d) 이고 그중 1 의 개수가 P(d) 다`;
  },

  /** 48B − 36 이 상한인가, 그리고 어디서 등호가 되는가. */
  "math-scale": () => {
    const rows: string[][] = [
      [
        "B(n−1)",
        "식 48B − 36",
        "그 B 의 소수 중 실제 최대",
        "그 입력",
        "2^B − 1 이 소수",
      ],
    ];
    for (const B of [12, 13, 16, 17, 19, 20]) {
      let best = 0;
      let arg = 0n;
      const lo = 1n << BigInt(B - 1);
      for (let n = lo + 1n; n <= lo * 2n; n += 2n) {
        if (!millerRabin(n)) continue;
        const o = opsOf(n);
        if (o > best) {
          best = o;
          arg = n;
        }
      }
      rows.push([
        `${B}`,
        comma(48 * B - 36),
        comma(best),
        comma(arg),
        millerRabin((1n << BigInt(B)) - 1n) ? "그렇다" : "아니다",
      ]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 셋째 칸이 둘째 칸을 넘는 줄이 0 개다. 다섯째 칸이 「그렇다」인 줄에서만 둘이 같다 —
          그때 n = 2^B − 1 이라 d 의 자리가 전부 1 이고 s 가 1 이다`;
  },

  /** 총식이 실행과 같은 값을 내는가. */
  "perf-formula": () => {
    const rows: string[][] = [
      [
        "입력",
        "정본",
        "어디서 멈췄나",
        "식이 내는 기본 연산",
        "실행이 센 기본 연산",
      ],
    ];
    const inputs = [
      1_000_000_000n,
      1_369n,
      WALK,
      25_326_001n,
      998_244_353n,
      1_000_000_007n,
      (1n << 61n) - 1n,
    ];
    for (const n of inputs) {
      // ② 에서 답하는가 — 그렇다면 총식은 나눗셈 횟수 하나다.
      let cut = 0;
      let caught = false;
      for (const a of BASES) {
        cut += 1;
        if (n === a) {
          caught = true;
          break;
        }
        if (n % a === 0n) {
          caught = true;
          break;
        }
      }
      if (caught) {
        rows.push([
          comma(n),
          yn(millerRabin(n)),
          `② 의 ${cut} 번째 밑`,
          comma(cut - (n === (BASES[cut - 1] as bigint) ? 1 : 0)),
          comma(opsOf(n)),
        ]);
        continue;
      }
      const { d, s } = split(n);
      let seen = 0;
      let formula = BASES.length;
      for (const a of BASES) {
        seen += 1;
        let x = modPow(a, d, n);
        let extra = 0;
        let ok = x === 1n || x === n - 1n;
        for (let i = 1; i < s && !ok; i++) {
          x = (x * x) % n;
          extra += 1;
          ok = x === n - 1n;
        }
        formula += 2 * (bitsOf(d) + onesOf(d) + extra);
        if (!ok) break;
      }
      rows.push([
        comma(n),
        yn(millerRabin(n)),
        seen < BASES.length ? `밑 ${seen} 개째가 증인` : "밑 열둘을 다 봤다",
        comma(formula),
        comma(opsOf(n)),
      ]);
    }
    return `${table(rows, [0, 3, 4]).join("\n")}
        └ 넷째 칸과 다섯째 칸이 일곱 줄 내내 같다.
          위 둘은 ② 에서 답해 나눗셈만 세고, 아래 다섯은 밑 판정까지 내려간다`;
  },

  /** 최악을 만드는 입력. */
  "worst-shapes": () => {
    const rows: string[][] = [
      ["입력 모양", "n", "정본", "d 의 B / P", "s", "기본 연산"],
    ];
    const list: [string, bigint][] = [
      ["짝수", LIMIT - 2n],
      ["3 의 배수", 18_446_744_073_709_551_615n],
      ["가장 작은 소인수가 41", compositeWithLeastFactor(41n, 18)],
      ["1 인 비트가 적은 큰 소수", 9_223_372_036_863_164_417n],
      ["2^64 아래 가장 큰 소수", 18_446_744_073_709_551_557n],
      ["메르센 소수 2^61 − 1", (1n << 61n) - 1n],
      ["2^64 − 257", LIMIT - 257n],
    ];
    for (const [shape, n] of list) {
      const { d, s } = split(n);
      // ② 가 답한 입력은 d 와 s 를 만들지도 않는다.
      const atStage2 = branchesOf(n).b3 === 0;
      rows.push([
        shape,
        comma(n),
        yn(millerRabin(n)),
        atStage2 ? "—" : `${bitsOf(d)} / ${onesOf(d)}`,
        atStage2 ? "—" : `${s}`,
        comma(opsOf(n)),
      ]);
    }
    // 최악 입력을 실제로 구성한 자리 — d 에서 1 인 비트 하나를 빼며 처음 소수가 되는 i 를 찾는다.
    let firstI = -1;
    const composites: number[] = [];
    for (let i = 1n; i <= 62n; i++) {
      const dd = (1n << 63n) - 1n - (1n << i);
      if ((dd & 1n) === 0n) continue;
      const cand = 2n * dd + 1n;
      if (millerRabin(cand)) {
        firstI = Number(i);
        break;
      }
      composites.push(Number(i));
    }
    return `${table(rows, [1, 4, 5]).join("\n")}
        └ 일곱 줄의 n 이 전부 10^18 이상인데 마지막 칸이 1 과 ${comma(opsOf(LIMIT - 257n))} 사이로 갈린다.
          B = 64 에서 식이 내는 상한은 ${comma(48 * 64 - 36)} 이다.
          d = 2^63 − 1 − 2^i 에서 i = ${composites.join(" · ")} 는 합성수이고 i = ${firstI} 에서 처음 소수가 된다`;
  },

  /** 경쟁 설계와의 계수 대조. */
  "alt-counts": () => {
    const ours = cases["밑 열둘 고정 판정"]();
    const alt = cases["소수 54 개 사전 나눗셈"]();
    const rows: string[][] = [
      [
        "무엇",
        "밑 열둘 고정 판정",
        `소수 ${TABLE_SIZE} 개 사전 나눗셈`,
        "적은 쪽",
      ],
    ];
    for (const key of Object.keys(ours)) {
      const a = ours[key as keyof typeof ours];
      const b = alt[key as keyof typeof alt];
      rows.push([
        key,
        comma(a),
        comma(b),
        a === b ? "같다" : a < b ? "정본" : "경쟁 설계",
      ]);
    }
    return `${table(rows, [1, 2]).join("\n")}
        └ 묶음은 10^e + 1 부터 연속한 홀수 ${comma(WORKLOAD)} 개다.
          두 설계와 정본이 매 실행 같은 답을 내는지 대조한 결과: ${verdictsAgree() ? "같다" : "다르다"}`;
  },

  /** 규모를 올리면 어디서 뒤집히는가, 그리고 최적 표 크기는 얼마인가. */
  "alt-scale": () => {
    const flip = flipScale();
    const rows: string[][] = [
      [
        "묶음 규모",
        "밑 열둘 고정",
        `소수 ${TABLE_SIZE} 개 사전`,
        "적은 쪽",
        "그 규모의 최적 표 크기",
      ],
    ];
    for (const e of [6, 8, 9, 10, 14, 18]) {
      const a = workloadOps(e, 12);
      const b = workloadOps(e, TABLE_SIZE);
      const best = bestTableSize(e);
      rows.push([
        `10^${e}`,
        comma(a),
        comma(b),
        b < a ? "경쟁 설계" : "정본",
        `${best} (${comma(nthPrime(best))} 까지)`,
      ]);
    }
    return `${table(rows, [1, 2]).join("\n")}
        └ 10^4 부터 10^18 까지 재서 순서가 처음 뒤집히는 자리는 10^${flip.at} 이고,
          그 뒤로 다시 돌아오는 자리는 ${flip.stable ? "없다" : "있다"}. 마지막 칸이 규모를 따라 커진다`;
  },

  /** 가장 작은 소인수가 어디 있느냐로 갈린다. */
  "alt-least-factor": () => {
    const rows: string[][] = [
      [
        "가장 작은 소인수 p",
        "몇 번째 소수인가",
        "n",
        "밑 열둘 고정",
        `소수 ${TABLE_SIZE} 개 사전`,
        "적은 쪽",
      ],
    ];
    for (const p of [41n, 157n, 251n, 257n, 997n]) {
      const n = compositeWithLeastFactor(p, 18);
      const a = ourOps(n).ops;
      const b = altOps(n).ops;
      const idx = primeIndex(p);
      rows.push([
        comma(p),
        `${idx}`,
        comma(n),
        comma(a),
        comma(b),
        b < a ? "경쟁 설계" : "정본",
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 경쟁 설계의 표는 ${comma(TABLE_LAST)} 에서 끝난다(${TABLE_SIZE} 번째 소수).
          그 안에 드는 줄에서는 경쟁 설계가 앞서고, 벗어나는 줄에서는 표를 헛돈 만큼 ${ALT_CELLS - OUR_CELLS} 를 더 쓴다`;
  },
};

/* ────────────────────── 보조 ────────────────────── */

/** `n` 의 정수 제곱근. `bigint` 로 뉴턴 반복을 되풀이한다. */
function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/** `from` 이상인 첫 소수. 정본으로 판정한다. */
function nextOddPrimeNear(from: bigint): bigint {
  let x = from % 2n === 0n ? from + 1n : from;
  while (!millerRabin(x)) x += 2n;
  return x;
}
