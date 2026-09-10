/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/crt/crt-guide.md
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * **세는 사본이 셋 있다**(`walkSteps`·`byListing`·`asDouble`). 정본은 걸음마다의 상태도,
 * 후보를 나열했을 때의 횟수도, 배정밀도로 옮겼을 때의 값도 내보내지 않는다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표에서 옳은 쪽 칸은 전부 정본이나 정본에서 기계로 만든
 * 변이가 낸 값이다.
 *
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { prepare, totals, 뒤집히는_자리 } from "./crt-guide.alt.ts";
import { crt } from "./crt-guide.ref.ts";

const REF = new URL("./crt-guide.ref.ts", import.meta.url).pathname;

type Answer = { x: bigint; M: bigint } | null;
type Ref = { crt: (r: bigint[], m: bigint[]) => Answer };

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

/** `698년` 꼴 — 초를 사람이 읽는 단위로 바꾼다. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)}초`;
  if (seconds < 60) return `${seconds.toFixed(1)}초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)}분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)}일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))}년`;
}

/* ────────────────────── 공통 입력과 도우미 ────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 조건이 셋이라 합치기가 두 번 실행되고, 둘째 합치기의 나머지
 * 차가 음수라 `[0, unit)` 로 맞추는 자리가 값으로 확인된다.
 */
const WALK_R = [2n, 3n, 2n];
const WALK_M = [3n, 5n, 7n];

/** 서로소가 아닌 법을 담은 입력. 합칠 수 있는 쪽과 모순인 쪽 둘. */
const SHARED_OK_R = [2n, 5n, 2n];
const SHARED_OK_M = [6n, 9n, 4n];
const SHARED_BAD_R = [2n, 5n, 3n];

/** 표에 나란히 놓는 네 입력. */
const FOUR: [string, bigint[], bigint[]][] = [
  ["전개가 쓰는 [2,3,2] mod [3,5,7]", WALK_R, WALK_M],
  ["서로소가 아니고 합쳐지는 [2,5,2] mod [6,9,4]", SHARED_OK_R, SHARED_OK_M],
  ["서로소가 아니고 모순인 [2,5,3] mod [6,9,4]", SHARED_BAD_R, SHARED_OK_M],
  ["조건이 하나인 [5] mod [7]", [5n], [7n]],
];

const show = (a: Answer): string =>
  a === null ? "null" : `x=${comma(a.x)}, M=${comma(a.M)}`;

const abs = (v: bigint): bigint => (v < 0n ? -v : v);

const gcdBig = (a: bigint, b: bigint): bigint =>
  b === 0n ? a : gcdBig(b, a % b);

const lcmAll = (ms: bigint[]): bigint =>
  ms.reduce((acc, m) => (acc / gcdBig(acc, m)) * m, 1n);

/** 앞에서부터 `count` 개의 소수. */
function primes(count: number): bigint[] {
  const out: bigint[] = [];
  for (let n = 2n; out.length < count; n++) {
    let ok = true;
    for (let d = 2n; d * d <= n; d++) {
      if (n % d === 0n) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(n);
  }
  return out;
}

/* ────────────────────────── 세는 사본 ────────────────────────── */

interface Step {
  label: string;
  m: bigint;
  r: bigint;
  diff: bigint;
  g: bigint;
  u: bigint;
  unit: bigint;
  t: bigint;
  curR: bigint;
  curM: bigint;
  /** 이 걸음이 만든 곱 가운데 절댓값이 가장 큰 것. */
  biggest: bigint;
}

/** 정본과 같은 절차에 걸음마다의 상태를 덧붙인 사본. */
function walkSteps(
  remainders: bigint[],
  moduli: bigint[],
): { steps: Step[]; divisions: number; answer: Answer } {
  const mod = (a: bigint, m: bigint): bigint => {
    const r = a % m;
    return r < 0n ? r + m : r;
  };
  let divisions = 0;
  const gcdCoefficient = (a: bigint, b: bigint): { g: bigint; x: bigint } => {
    let r0 = a;
    let r1 = b;
    let s0 = 1n;
    let s1 = 0n;
    while (r1 !== 0n) {
      divisions++;
      const q = r0 / r1;
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
    }
    return { g: r0, x: s0 };
  };

  let curM = moduli[0] as bigint;
  let curR = mod(remainders[0] as bigint, curM);
  const steps: Step[] = [
    {
      label: "T1",
      m: curM,
      r: curR,
      diff: 0n,
      g: 0n,
      u: 0n,
      unit: 0n,
      t: 0n,
      curR,
      curM,
      biggest: curM,
    },
  ];
  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as bigint;
    const r = mod(remainders[i] as bigint, m);
    const diff = r - curR;
    const { g, x: u } = gcdCoefficient(curM, m);
    if (diff % g !== 0n) {
      steps.push({
        label: `T${3 * i + 1}`,
        m,
        r,
        diff,
        g,
        u,
        unit: 0n,
        t: 0n,
        curR,
        curM,
        biggest: abs(diff),
      });
      return { steps, divisions, answer: null };
    }
    const unit = m / g;
    const solved = (diff / g) * u;
    const t = mod(solved, unit);
    const shifted = curM * t;
    curR = curR + shifted;
    curM = curM * unit;
    steps.push({
      label: `T${3 * i + 1}`,
      m,
      r,
      diff,
      g,
      u,
      unit,
      t,
      curR,
      curM,
      biggest: [abs(solved), abs(shifted), curR, curM].reduce((a, b) =>
        a > b ? a : b,
      ),
    });
  }
  return { steps, divisions, answer: { x: curR, M: curM } };
}

interface Kinds {
  /** 확장 유클리드 **바깥**에서 한 곱셈 · 나눗셈과 나머지 · 덧셈과 뺄셈. */
  outside: [number, number, number];
  /** 확장 유클리드 **안**에서 한 곱셈 · 나눗셈 · 덧셈과 뺄셈. */
  inside: [number, number, number];
  /** 몫이 1 이었던 걸음 수와 전체 걸음 수. */
  quotientOne: [number, number];
}

/** 정본과 같은 절차에 연산을 종류별로 세는 자리만 덧붙인 사본. */
function countByKind(remainders: bigint[], moduli: bigint[]): Kinds {
  const k: Kinds = {
    outside: [0, 0, 0],
    inside: [0, 0, 0],
    quotientOne: [0, 0],
  };
  const mod = (a: bigint, m: bigint, where: 0 | 1): bigint => {
    k[where === 0 ? "outside" : "inside"][1]++;
    const r = a % m;
    if (r < 0n) {
      k[where === 0 ? "outside" : "inside"][2]++;
      return r + m;
    }
    return r;
  };
  const gcdCoefficient = (a: bigint, b: bigint): { g: bigint; x: bigint } => {
    let r0 = a;
    let r1 = b;
    let s0 = 1n;
    let s1 = 0n;
    while (r1 !== 0n) {
      k.inside[1]++;
      const q = r0 / r1;
      k.quotientOne[1]++;
      if (q === 1n) k.quotientOne[0]++;
      k.inside[0] += 2;
      k.inside[2] += 2;
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
    }
    return { g: r0, x: s0 };
  };

  let curM = moduli[0] as bigint;
  let curR = mod(remainders[0] as bigint, curM, 0);
  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as bigint;
    const r = mod(remainders[i] as bigint, m, 0);
    k.outside[2]++;
    const diff = r - curR;
    const { g, x: u } = gcdCoefficient(curM, m);
    k.outside[1]++;
    if (diff % g !== 0n) return k;
    k.outside[1]++;
    const unit = m / g;
    k.outside[1]++;
    k.outside[0]++;
    const t = mod((diff / g) * u, unit, 0);
    k.outside[0]++;
    k.outside[2]++;
    curR = curR + curM * t;
    k.outside[0]++;
    curM = curM * unit;
  }
  return k;
}

/**
 * 가장 단순한 방법 — 한 조건의 해를 순서대로 만들며 나머지 조건을 확인한다.
 *
 * 실제로 끝까지 만들면 큰 입력에서 안 끝나므로 **만들어야 하는 후보의 개수**만 센다. 기준
 * 법을 `base` 로 잡으면 주기 안의 후보가 `M / m_base` 개다.
 */
function byListing(
  remainders: bigint[],
  moduli: bigint[],
  base: number,
): { tried: number; checks: number; found: bigint | null } {
  const M = lcmAll(moduli);
  const mb = moduli[base] as bigint;
  const rb = (((remainders[base] as bigint) % mb) + mb) % mb;
  let tried = 0;
  let checks = 0;
  for (let x = rb; x < M; x += mb) {
    tried++;
    let ok = true;
    for (let i = 0; i < moduli.length; i++) {
      if (i === base) continue;
      checks++;
      const mi = moduli[i] as bigint;
      if (x % mi !== (((remainders[i] as bigint) % mi) + mi) % mi) {
        ok = false;
        break;
      }
    }
    if (ok) return { tried, checks, found: x };
  }
  return { tried, checks, found: null };
}

/** 정본과 글자 그대로 같은 절차를 배정밀도 `number` 로 옮긴 사본. */
function asDouble(
  remainders: number[],
  moduli: number[],
): { x: number; M: number } | null {
  const mod = (a: number, m: number): number => {
    const r = a % m;
    return r < 0 ? r + m : r;
  };
  const gcdCoefficient = (a: number, b: number): { g: number; x: number } => {
    let r0 = a;
    let r1 = b;
    let s0 = 1;
    let s1 = 0;
    while (r1 !== 0) {
      const q = Math.floor(r0 / r1);
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
    }
    return { g: r0, x: s0 };
  };
  let curM = moduli[0] as number;
  let curR = mod(remainders[0] as number, curM);
  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as number;
    const r = mod(remainders[i] as number, m);
    const diff = r - curR;
    const { g, x: u } = gcdCoefficient(curM, m);
    if (diff % g !== 0) return null;
    const unit = m / g;
    const t = mod((diff / g) * u, unit);
    curR = curR + curM * t;
    curM = curM * unit;
  }
  return { x: curR, M: curM };
}

/** 배정밀도가 정확히 담는 정수의 상한. */
const SAFE = 9_007_199_254_740_992n;

/** 두 법을 `m`·`m+1` 로 두고 답이 `M − 1` 이 되게 만든 입력. */
function neighbourPair(m: number): { r: number[]; mods: number[]; M: bigint } {
  const M = BigInt(m) * BigInt(m + 1);
  return {
    r: [Number((M - 1n) % BigInt(m)), Number((M - 1n) % BigInt(m + 1))],
    mods: [m, m + 1],
    M,
  };
}

/** 그 입력에서 배정밀도 판이 정본과 갈리는가. */
function neighbourDiffers(m: number): boolean {
  const { r, mods } = neighbourPair(m);
  const big = crt(r.map(BigInt), mods.map(BigInt));
  const num = asDouble(r, mods);
  if (big === null || num === null) return true;
  return BigInt(num.x) !== big.x || BigInt(num.M) !== big.M;
}

/* ────────────────────────── 변이 ────────────────────────── */

/** 남은 자유도를 `m / g` 대신 `m` 으로 잡은 판. 법이 서로소면 `g = 1` 이라 같은 값이다. */
const fullUnit = await loadMutant<Ref>(REF, {
  swap: [/^ {4}const unit = m \/ g;$/, "    const unit = m;"],
});

/** 모순 판정 줄을 지운 판. 합칠 수 없는 조건도 합친 것처럼 값을 낸다. */
const noGuard = await loadMutant<Ref>(REF, {
  drop: /^ {4}if \(diff % g !== 0n\) return null;$/,
});

/** `t` 를 `[0, unit)` 로 맞추지 않고 부호가 남는 나머지를 그대로 쓴 판. */
const rawRemainder = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}const t = mod\(\(diff \/ g\) \* u, unit\);$/,
    "    const t = ((diff / g) * u) % unit;",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = fullUnit.crt === crt;

const 갈리는_변이: {
  label: string;
  impl: Ref;
  cases: [bigint[], bigint[]][];
}[] = [
  {
    label: "남은 자유도를 m 으로 잡은 판",
    impl: fullUnit,
    cases: [[SHARED_OK_R, SHARED_OK_M]],
  },
  {
    label: "모순 판정을 지운 판",
    impl: noGuard,
    cases: [[SHARED_BAD_R, SHARED_OK_M]],
  },
  {
    label: "부호가 남는 나머지를 쓴 판",
    impl: rawRemainder,
    cases: [[WALK_R, WALK_M]],
  },
];

const same = (a: Answer, b: Answer): boolean =>
  a === null || b === null ? a === b : a.x === b.x && a.M === b.M;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (cases.every(([r, m]) => same(crt(r, m), impl.crt(r, m)))) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/**
 * 변이를 건 **그 줄을 이 입력이 몇 번 지나가는가.** 정본과 같은 절차에 방문 계수만 덧붙여
 * 실행으로 센다 — 「같다」가 「변이가 무해하다」인지 「그 줄을 한 번도 지나가지 않았다」인지를 가른다.
 */
function visits(
  remainders: bigint[],
  moduli: bigint[],
): { guard: number; unit: number; t: number } {
  const mod = (a: bigint, m: bigint): bigint => {
    const r = a % m;
    return r < 0n ? r + m : r;
  };
  const gcdCoefficient = (a: bigint, b: bigint): { g: bigint; x: bigint } => {
    let r0 = a;
    let r1 = b;
    let s0 = 1n;
    let s1 = 0n;
    while (r1 !== 0n) {
      const q = r0 / r1;
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
    }
    return { g: r0, x: s0 };
  };
  const seen = { guard: 0, unit: 0, t: 0 };
  let curM = moduli[0] as bigint;
  let curR = mod(remainders[0] as bigint, curM);
  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as bigint;
    const r = mod(remainders[i] as bigint, m);
    const diff = r - curR;
    const { g, x: u } = gcdCoefficient(curM, m);
    seen.guard++;
    if (diff % g !== 0n) return seen;
    seen.unit++;
    const unit = m / g;
    seen.t++;
    const t = mod((diff / g) * u, unit);
    curR = curR + curM * t;
    curM = curM * unit;
  }
  return seen;
}

/** 변이 하나를 입력 여럿에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  label: string,
  impl: Ref,
  site: "guard" | "unit" | "t",
): string {
  const rows: string[][] = [
    ["입력", "정본", label, "바꾼 줄을 지나간 횟수", "판정"],
  ];
  for (const [name, r, m] of FOUR) {
    const ok = crt(r, m);
    const bad = impl.crt(r, m);
    rows.push([
      name,
      show(ok),
      show(bad),
      comma(visits(r, m)[site]),
      same(ok, bad) ? "같다" : "어긋난다",
    ]);
  }
  return table(rows, [3]).join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 후보를 나열하는 방법의 규모 — 조건이 늘 때 주기가 얼마가 되는가. */
  "naive-scale": () => {
    const ps = primes(15);
    const rows: string[][] = [
      ["조건 수 k", "법 목록", "주기 M", "최악 후보 수", "초당 1억 번 기준"],
    ];
    for (const k of [2, 4, 6, 8, 10, 12, 15]) {
      const ms = ps.slice(0, k);
      const M = lcmAll(ms);
      const worst = M / (ms[k - 1] as bigint);
      rows.push([
        String(k),
        k <= 4
          ? ms.join(" · ")
          : `${ms.slice(0, 3).join(" · ")} · … · ${ms[k - 1]}`,
        comma(M),
        comma(worst),
        duration(Number(worst) / 1e8),
      ]);
    }
    return table(rows, [0, 2, 3, 4]).join("\n");
  },

  /** 전개 입력에서 기준 법을 바꿔 본다 — 후보 수는 무엇에 달렸는가. */
  "naive-base": () => {
    const rows: string[][] = [
      ["기준으로 삼은 법", "만든 후보 수", "나머지 조건 확인 횟수", "찾은 값"],
    ];
    for (let base = 0; base < WALK_M.length; base++) {
      const r = byListing(WALK_R, WALK_M, base);
      rows.push([
        `m${base + 1} = ${WALK_M[base]}`,
        comma(r.tried),
        comma(r.checks),
        r.found === null ? "없다" : comma(r.found),
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 결론 — 후보를 나열하는 것과 합치는 것이 무엇에 달렸는가. */
  "concept-gain": () => {
    const ps = primes(12);
    const rows: string[][] = [
      ["입력", "최악 후보 수", "합치기 횟수", "나눗셈 횟수"],
    ];
    const cases: [string, bigint[], bigint[]][] = [
      ["전개가 쓰는 [3,5,7]", WALK_R, WALK_M],
      ["소수 여섯 2 … 13", ps.slice(0, 6).map((p) => p - 1n), ps.slice(0, 6)],
      ["소수 열둘 2 … 37", ps.slice(0, 12).map((p) => p - 1n), ps.slice(0, 12)],
      ["10 자리 소수 둘", [12_345n, 67_890n], [1_000_000_007n, 998_244_353n]],
    ];
    for (const [name, r, ms] of cases) {
      const M = lcmAll(ms);
      const biggest = ms.reduce((a, b) => (a > b ? a : b));
      const walk = walkSteps(r, ms);
      rows.push([
        name,
        comma(M / biggest),
        comma(ms.length - 1),
        comma(walk.divisions),
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 나머지 쌍이 값을 유일하게 정한다 — 법 3 과 5 에서 열다섯 값. */
  "residue-map": () => {
    const span = Number(lcmAll([3n, 5n]));
    const at = <T>(f: (i: number) => T): T[] =>
      Array.from({ length: span }, (_, i) => f(i));
    const rows: string[][] = [["x", ...at((i) => String(i))]];
    rows.push(["x mod 3", ...at((i) => String(i % 3))]);
    rows.push(["x mod 5", ...at((i) => String(i % 5))]);
    const seen = new Set(at((i) => `${i % 3},${i % 5}`));
    const back = at((i) => {
      const got = crt([BigInt(i % 3), BigInt(i % 5)], [3n, 5n]);
      return got === null ? "?" : String(got.x);
    });
    rows.push(["되돌린 x", ...back]);
    const body = table(
      rows,
      Array.from({ length: span + 1 }, (_, i) => i),
    ).join("\n");
    const wrong = back.filter((v, i) => v !== String(i)).length;
    return `${body}\n서로 다른 나머지 쌍 ${comma(seen.size)} 개 · 값 ${comma(span)} 개 · 되돌린 값이 원래 값과 다른 자리 ${comma(wrong)} 개`;
  },

  /** 전개 입력의 걸음별 값. */
  "walk-trace": () => {
    const { steps } = walkSteps(WALK_R, WALK_M);
    const rows: string[][] = [
      [
        "걸음",
        "합치는 조건",
        "diff",
        "g",
        "u",
        "unit",
        "t",
        "curM × t",
        "다음 curR",
        "다음 curM",
      ],
    ];
    for (const step of steps.slice(1)) {
      rows.push([
        step.label,
        `x ≡ ${step.r} (mod ${step.m})`,
        comma(step.diff),
        comma(step.g),
        comma(step.u),
        comma(step.unit),
        comma(step.t),
        comma((step.curM / step.unit) * step.t),
        comma(step.curR),
        comma(step.curM),
      ]);
    }
    return table(rows, [2, 3, 4, 5, 6, 7, 8, 9]).join("\n");
  },

  /** 남은 자유도를 `m` 으로 잡은 판. */
  "pause-unit": () =>
    mutantTable("남은 자유도를 m 으로 잡은 판", fullUnit, "unit"),

  /** 모순 판정을 지운 판. */
  "pause-guard": () => mutantTable("모순 판정을 지운 판", noGuard, "guard"),

  /** 모순 판정을 지운 판이 낸 값이 실제로 조건을 어기는가. */
  "pause-guard-check": () => {
    const bad = noGuard.crt(SHARED_BAD_R, SHARED_OK_M);
    const rows: string[][] = [
      ["조건", "요구하는 나머지", "그 값의 나머지", "그 조건을"],
    ];
    for (let i = 0; i < SHARED_OK_M.length; i++) {
      const m = SHARED_OK_M[i] as bigint;
      const want = SHARED_BAD_R[i] as bigint;
      const got = bad === null ? null : bad.x % m;
      rows.push([
        `x ≡ ${want} (mod ${m})`,
        comma(want),
        got === null ? "—" : comma(got),
        got === want ? "만족한다" : "만족하지 않는다",
      ]);
    }
    return `${table(rows, [1, 2]).join("\n")}\n지운 판이 낸 값: ${show(bad)} · 정본: ${show(
      crt(SHARED_BAD_R, SHARED_OK_M),
    )}`;
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const rows: string[][] = [
      ["입력", "반환값", "0 ≤ x < M", "M 이 최소공배수"],
    ];
    const cases: [string, bigint[], bigint[]][] = [
      ...FOUR,
      ["나머지가 음수인 [-1,-1] mod [3,5]", [-1n, -1n], [3n, 5n]],
      ["법에 1 이 든 [0,3] mod [1,5]", [0n, 3n], [1n, 5n]],
      [
        "큰 소수 둘 [12345,67890] mod [1000000007,998244353]",
        [12_345n, 67_890n],
        [1_000_000_007n, 998_244_353n],
      ],
    ];
    for (const [name, r, m] of cases) {
      const got = crt(r, m);
      rows.push([
        name,
        show(got),
        got === null ? "—" : got.x >= 0n && got.x < got.M ? "그렇다" : "아니다",
        got === null ? "—" : got.M === lcmAll(m) ? "그렇다" : "아니다",
      ]);
    }
    return table(rows).join("\n");
  },

  /** 부호가 남는 나머지를 쓴 판 — 불변식을 지키던 그 줄이다. */
  "mutant-t-raw": () =>
    mutantTable("부호가 남는 나머지를 쓴 판", rawRemainder, "t"),

  /** 부호가 남는 나머지를 쓴 판이 걸음마다 어떤 t 를 내는가. */
  "mutant-t-steps": () => {
    const mod = (a: bigint, m: bigint): bigint => {
      const r = a % m;
      return r < 0n ? r + m : r;
    };
    const gcdCoefficient = (a: bigint, b: bigint): { g: bigint; x: bigint } => {
      let r0 = a;
      let r1 = b;
      let s0 = 1n;
      let s1 = 0n;
      while (r1 !== 0n) {
        const q = r0 / r1;
        [r0, r1] = [r1, r0 - q * r1];
        [s0, s1] = [s1, s0 - q * s1];
      }
      return { g: r0, x: s0 };
    };
    /** 두 판을 나란히 굴리며 걸음마다의 t 와 curR 을 낸다. */
    function pair(
      remainders: bigint[],
      moduli: bigint[],
    ): {
      i: number;
      diffOk: bigint;
      diffBad: bigint;
      tOk: bigint;
      tBad: bigint;
      okR: bigint;
      badR: bigint;
    }[] {
      let okM = moduli[0] as bigint;
      let okR = mod(remainders[0] as bigint, okM);
      let badM = okM;
      let badR = okR;
      const out: {
        i: number;
        diffOk: bigint;
        diffBad: bigint;
        tOk: bigint;
        tBad: bigint;
        okR: bigint;
        badR: bigint;
      }[] = [];
      for (let i = 1; i < moduli.length; i++) {
        const m = moduli[i] as bigint;
        const r = mod(remainders[i] as bigint, m);
        const a = gcdCoefficient(okM, m);
        const diffOk = r - okR;
        if (diffOk % a.g !== 0n) break;
        const unitOk = m / a.g;
        const tOk = mod((diffOk / a.g) * a.x, unitOk);
        const b = gcdCoefficient(badM, m);
        const diffBad = r - badR;
        const unitBad = m / b.g;
        const tBad = ((diffBad / b.g) * b.x) % unitBad;
        okR = okR + okM * tOk;
        okM = okM * unitOk;
        badR = badR + badM * tBad;
        badM = badM * unitBad;
        out.push({ i, diffOk, diffBad, tOk, tBad, okR, badR });
      }
      return out;
    }
    const rows: string[][] = [
      [
        "입력",
        "합치기",
        "정본 diff",
        "변이 diff",
        "정본 t",
        "변이 t",
        "정본 curR",
        "변이 curR",
      ],
    ];
    for (const [name, r, m] of [
      FOUR[0] as [string, bigint[], bigint[]],
      FOUR[1] as [string, bigint[], bigint[]],
    ]) {
      const steps = pair(r, m);
      if (!중화됨) {
        const last = steps[steps.length - 1];
        const real = rawRemainder.crt(r, m);
        if (last === undefined || real === null || real.x !== last.badR) {
          throw new Error(`${name} — 사본이 기계로 만든 변이와 다른 값을 냈다`);
        }
      }
      for (const step of steps) {
        rows.push([
          name,
          `${step.i} 번째`,
          comma(step.diffOk),
          comma(step.diffBad),
          comma(step.tOk),
          comma(step.tBad),
          comma(step.okR),
          comma(step.badR),
        ]);
      }
    }
    return table(rows, [2, 3, 4, 5, 6, 7]).join("\n");
  },

  /** 불변식이 걸음마다 유지되는지 실행이 판정한 결과. */
  "invariant-steps": () => {
    const rows: string[][] = [
      [
        "입력 묶음",
        "확인한 걸음 수",
        "0 ≤ curR < curM 을 어긴 걸음",
        "curM 이 최소공배수가 아닌 걸음",
      ],
    ];
    const groups: [string, () => Iterable<[bigint[], bigint[]]>][] = [
      [
        "전개 입력 하나",
        function* () {
          yield [WALK_R, WALK_M];
        },
      ],
      [
        "법 셋을 1..12 로 전수",
        function* () {
          for (let a = 1n; a <= 12n; a++)
            for (let b = 1n; b <= 12n; b++)
              for (let c = 1n; c <= 12n; c++)
                yield [
                  [a - 1n, b - 1n, c - 1n],
                  [a, b, c],
                ];
        },
      ],
      [
        "법 둘을 1..40 으로 전수 · 나머지도 전수",
        function* () {
          for (let a = 1n; a <= 40n; a++)
            for (let b = 1n; b <= 40n; b++)
              for (let x = 0n; x < a; x++)
                for (let y = 0n; y < b; y++)
                  yield [
                    [x, y],
                    [a, b],
                  ];
        },
      ],
    ];
    for (const [name, gen] of groups) {
      let seen = 0;
      let outOfRange = 0;
      let notLcm = 0;
      for (const [r, m] of gen()) {
        const { steps, answer } = walkSteps(r, m);
        if (answer === null) continue;
        for (const [i, s] of steps.entries()) {
          seen++;
          if (!(s.curR >= 0n && s.curR < s.curM)) outOfRange++;
          if (s.curM !== lcmAll(m.slice(0, i + 1))) notLcm++;
        }
      }
      rows.push([name, comma(seen), comma(outOfRange), comma(notLcm)]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 경계 입력. */
  "edge-values": () => {
    const rows: string[][] = [["입력", "반환값", "왜 경계인가"]];
    const cases: [string, bigint[], bigint[], string][] = [
      [
        "[5] mod [7]",
        [5n],
        [7n],
        "조건이 하나라 합치기가 한 번도 실행되지 않는다",
      ],
      [
        "[0,3] mod [1,5]",
        [0n, 3n],
        [1n, 5n],
        "법 1 은 모든 정수를 받아 조건이 되지 않는다",
      ],
      [
        "[-1,-1] mod [3,5]",
        [-1n, -1n],
        [3n, 5n],
        "나머지가 음수라 첫 줄의 맞춤이 실행된다",
      ],
      [
        "[0,0] mod [4,6]",
        [0n, 0n],
        [4n, 6n],
        "서로소가 아니고 나머지 차가 0 이다",
      ],
      [
        "[1,0] mod [2,2]",
        [1n, 0n],
        [2n, 2n],
        "같은 법에 다른 나머지라 반드시 모순이다",
      ],
      [
        "[3,3] mod [12,18]",
        [3n, 3n],
        [12n, 18n],
        "최대공약수가 6 으로 두 법 다 합성수다",
      ],
      [
        "[2,2,2] mod [4,4,4]",
        [2n, 2n, 2n],
        [4n, 4n, 4n],
        "법이 전부 같아 주기가 늘지 않는다",
      ],
    ];
    for (const [name, r, m, why] of cases) {
      rows.push([name, show(crt(r, m)), why]);
    }
    return table(rows).join("\n");
  },

  /** 정의를 전개 입력에 넣어 검산한다. */
  "math-check": () => {
    const { steps } = walkSteps(WALK_R, WALK_M);
    const rows: string[][] = [
      [
        "i",
        "m_i",
        "g_i",
        "unit_i",
        "t_i",
        "curM_i · t_i",
        "curR_i",
        "curM_i",
        "lcm(m_1..m_i)",
      ],
    ];
    for (const [i, s] of steps.entries()) {
      const first = i === 0;
      rows.push([
        String(i + 1),
        comma(s.m),
        first ? "—" : comma(s.g),
        first ? "—" : comma(s.unit),
        first ? "—" : comma(s.t),
        first ? "—" : comma((s.curM / s.unit) * s.t),
        comma(s.curR),
        comma(s.curM),
        comma(lcmAll(WALK_M.slice(0, i + 1))),
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4, 5, 6, 7, 8]).join("\n");
  },

  /** 걸음이 만드는 가장 큰 중간 값이 M 과 어떻게 견주어지는가 — 작은 값 전수. */
  "math-peak": () => {
    const rows: string[][] = [
      [
        "입력 묶음",
        "해가 있는 입력",
        "곱 curM × t 가 M 을 넘은 입력",
        "가장 큰 중간 값이 M 을 넘은 입력",
        "그 최대 비",
      ],
    ];
    const groups: [string, () => Iterable<[bigint[], bigint[]]>][] = [
      [
        "법 둘을 1..40 으로 전수 · 나머지도 전수",
        function* () {
          for (let a = 1n; a <= 40n; a++)
            for (let b = 1n; b <= 40n; b++)
              for (let x = 0n; x < a; x++)
                for (let y = 0n; y < b; y++)
                  yield [
                    [x, y],
                    [a, b],
                  ];
        },
      ],
      [
        "법 셋을 1..14 로 전수 · 나머지도 전수",
        function* () {
          for (let a = 1n; a <= 14n; a++)
            for (let b = 1n; b <= 14n; b++)
              for (let c = 1n; c <= 14n; c++)
                for (let x = 0n; x < a; x++)
                  for (let y = 0n; y < b; y++)
                    for (let z = 0n; z < c; z++)
                      yield [
                        [x, y, z],
                        [a, b, c],
                      ];
        },
      ],
    ];
    for (const [name, gen] of groups) {
      let solved = 0;
      let shiftOver = 0;
      let peakOver = 0;
      let worst = 0;
      for (const [r, m] of gen()) {
        const { steps, answer } = walkSteps(r, m);
        if (answer === null) continue;
        solved++;
        const M = answer.M;
        for (const step of steps.slice(1)) {
          if ((step.curM / step.unit) * step.t > M) shiftOver++;
          if (step.biggest > M) {
            peakOver++;
            worst = Math.max(worst, Number(step.biggest) / Number(M));
          }
        }
      }
      rows.push([
        name,
        comma(solved),
        comma(shiftOver),
        comma(peakOver),
        worst === 0 ? "—" : `${worst.toFixed(2)} 배`,
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },

  /** 배정밀도로 옮기면 어디서 처음 갈리는가 — 두 계열. */
  "math-double": () => {
    const ps = primes(15);
    const rows: string[][] = [
      [
        "조건 수 k",
        "주기 M",
        "M 이 2^53 을 넘는가",
        "정본 x",
        "배정밀도 x",
        "판정",
      ],
    ];
    for (const k of [12, 13, 14, 15]) {
      const ms = ps.slice(0, k);
      const rs = ms.map((p) => p - 1n);
      const big = crt(rs, ms);
      const num = asDouble(
        rs.map((v) => Number(v)),
        ms.map((v) => Number(v)),
      );
      const M = lcmAll(ms);
      rows.push([
        String(k),
        comma(M),
        M > SAFE ? "넘는다" : "안 넘는다",
        big === null ? "null" : comma(big.x),
        num === null ? "null" : comma(num.x),
        big !== null && num !== null && BigInt(num.x) === big.x
          ? "같다"
          : "어긋난다",
      ]);
    }
    return table(rows, [0, 1, 3, 4]).join("\n");
  },

  /** 이웃한 두 법 계열 — 닫힌 형태가 낸 자리와 실측이 같은가. */
  "math-flip": () => {
    // m(m+1) > 2^53 을 푸는 자리를 정수로 낸다.
    let closed = 1n;
    while (closed * (closed + 1n) <= SAFE) closed++;
    const rows: string[][] = [
      ["m", "M = m(m+1)", "M > 2^53", "정본 x", "배정밀도 x", "판정"],
    ];
    for (const m of [
      Number(closed) - 2,
      Number(closed) - 1,
      Number(closed),
      Number(closed) + 1,
    ]) {
      const { r, mods, M } = neighbourPair(m);
      const big = crt(r.map(BigInt), mods.map(BigInt));
      const num = asDouble(r, mods);
      rows.push([
        comma(m),
        comma(M),
        M > SAFE ? "넘는다" : "안 넘는다",
        big === null ? "null" : comma(big.x),
        num === null ? "null" : comma(num.x),
        big !== null && num !== null && BigInt(num.x) === big.x
          ? "같다"
          : "어긋난다",
      ]);
    }
    // 닫힌 형태가 낸 자리 아래를 실제로 재서 더 이른 자리가 없는지 본다.
    let earlier = 0;
    const SWEEP = 200_000;
    for (let m = Number(closed) - SWEEP; m < Number(closed); m++) {
      if (neighbourDiffers(m)) earlier++;
    }
    return `${table(rows, [0, 1, 3, 4]).join("\n")}
닫힌 형태가 낸 첫 자리 ${comma(closed)} · 그 아래 ${comma(SWEEP)} 칸 중 갈리는 자리 ${comma(earlier)} 개`;
  },

  /** 제약 상한에서 중간 값이 얼마가 되는가. */
  "math-scale": () => {
    const cap = 10n ** 18n;
    const rows: string[][] = [
      [
        "조건 수 k",
        "법 하나의 상한",
        "주기 M 의 상한",
        "그 자릿수",
        "2^53 보다 몇 자리 큰가",
      ],
    ];
    for (const k of [2, 3, 5, 10]) {
      const M = cap ** BigInt(k);
      rows.push([
        String(k),
        "10^18",
        `10^${18 * k}`,
        comma(M.toString().length),
        comma(M.toString().length - SAFE.toString().length),
      ]);
    }
    return `${table(rows, [0, 3, 4]).join("\n")}
2^53 = ${comma(SAFE)} 이고 16 자리다`;
  },

  /** 경쟁 설계 대조 — 값은 `.alt.ts` 를 불러서 얻는다. */
  "alt-counts": () => {
    const rows: string[][] = [
      [
        "질의 수",
        "정본 기본 연산",
        "정본 자릿수 일",
        "한 번에 합치는 판 기본 연산",
        "한 번에 합치는 판 자릿수 일",
        "자릿수 일이 적은 쪽",
      ],
    ];
    for (const q of [1, 2, 7, 8, 64]) {
      const { merge, oneShot } = totals(q);
      rows.push([
        comma(q),
        comma(merge.ops),
        comma(merge.work),
        comma(oneShot.ops),
        comma(oneShot.work),
        merge.work <= oneShot.work ? "정본" : "한 번에 합치는 판",
      ]);
    }
    const first = totals(1);
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
저장 자릿수는 정본 ${comma(first.merge.cells)} · 한 번에 합치는 판 ${comma(first.oneShot.cells)} 로 질의 수와 무관하다
기본 연산 축은 질의 ${comma(뒤집히는_자리("ops"))} 회 · 자릿수 일 축은 질의 ${comma(뒤집히는_자리("work"))} 회에서 순서가 뒤집힌다`;
  },

  /** 경쟁 설계의 적용 범위 — 법이 서로소가 아니면 무엇이 되는가. */
  "alt-range": () => {
    const rows: string[][] = [
      ["법 목록", "쌍마다 서로소인가", "정본", "한 번에 합치는 판"],
    ];
    const cases: [bigint[], bigint[]][] = [
      [WALK_R, WALK_M],
      [SHARED_OK_R, SHARED_OK_M],
      [
        [2n, 2n],
        [6n, 4n],
      ],
    ];
    for (const [r, m] of cases) {
      let coprime = true;
      for (let i = 0; i < m.length; i++) {
        for (let j = i + 1; j < m.length; j++) {
          if (gcdBig(m[i] as bigint, m[j] as bigint) !== 1n) coprime = false;
        }
      }
      const pre = prepare(m, { ops: 0, work: 0, cells: 0 });
      rows.push([
        `[${m.join(", ")}]`,
        coprime ? "그렇다" : "아니다",
        show(crt(r, m)),
        pre === null ? "역원이 없어 답을 못 낸다" : "답을 낸다",
      ]);
    }
    return table(rows).join("\n");
  },

  /** 전개 입력에서 실제로 한 일. */
  "perf-ops": () => {
    const kinds = countByKind(WALK_R, WALK_M);
    const { steps, divisions } = walkSteps(WALK_R, WALK_M);
    const rows: string[][] = [
      ["어디서", "곱셈", "나눗셈과 나머지", "덧셈과 뺄셈", "합"],
    ];
    const sum = (v: [number, number, number]): number => v[0] + v[1] + v[2];
    rows.push([
      "확장 유클리드 바깥",
      comma(kinds.outside[0]),
      comma(kinds.outside[1]),
      comma(kinds.outside[2]),
      comma(sum(kinds.outside)),
    ]);
    rows.push([
      "확장 유클리드 안",
      comma(kinds.inside[0]),
      comma(kinds.inside[1]),
      comma(kinds.inside[2]),
      comma(sum(kinds.inside)),
    ]);
    rows.push([
      "합",
      comma(kinds.outside[0] + kinds.inside[0]),
      comma(kinds.outside[1] + kinds.inside[1]),
      comma(kinds.outside[2] + kinds.inside[2]),
      comma(sum(kinds.outside) + sum(kinds.inside)),
    ]);
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
합치기 ${comma(steps.length - 1)} 번(T2~T4 와 T5~T7) · 확장 유클리드는 T2 와 T5 에서 한 번씩 실행되고 그 안의 나눗셈이 ${comma(divisions)} 번이다`;
  },

  /** 최악을 만드는 입력 — 모양별로 실제로 재 본다. */
  "worst-shapes": () => {
    const fib = (n: number): bigint => {
      let a = 0n;
      let b = 1n;
      for (let i = 0; i < n; i++) [a, b] = [b, a + b];
      return a;
    };
    const rows: string[][] = [
      [
        "입력 모양",
        "법 둘",
        "작은 쪽 자릿수",
        "서로소",
        "몫이 1 인 걸음",
        "나눗셈 횟수",
        "주기 M 의 자릿수",
      ],
    ];
    const cases: [string, bigint, bigint][] = [
      [
        "한쪽이 다른 쪽의 배수",
        999_999_999_999_999_999n,
        333_333_333_333_333_333n,
      ],
      ["두 값의 차가 1", 10n ** 18n, 10n ** 18n - 1n],
      ["10 자리 소수 둘", 1_000_000_007n, 998_244_353n],
      ["피보나치 이웃", fib(88), fib(87)],
    ];
    for (const [name, a, b] of cases) {
      const walk = walkSteps([0n, 0n], [a, b]);
      // 나머지를 바꿔도 나눗셈 횟수가 같은지를 실행으로 확인한다.
      const other = walkSteps([1n, 1n], [a, b]).divisions;
      const kinds = countByKind([0n, 0n], [a, b]);
      rows.push([
        name,
        `${comma(a)} 과 ${comma(b)}`,
        comma(Math.min(a.toString().length, b.toString().length)),
        gcdBig(a, b) === 1n
          ? "그렇다"
          : `아니다 (gcd = ${comma(gcdBig(a, b))})`,
        `${comma(kinds.quotientOne[0])} / ${comma(kinds.quotientOne[1])}`,
        walk.divisions === other
          ? comma(walk.divisions)
          : `${comma(walk.divisions)} (나머지를 바꾸면 ${comma(other)})`,
        comma(lcmAll([a, b]).toString().length),
      ]);
    }
    return table(rows, [2, 5, 6]).join("\n");
  },

  /** 스스로 점검하기의 답. */
  "check-answer": () => {
    const rows: string[][] = [
      ["법 둘", "gcd", "나머지 차", "차 mod gcd", "답"],
    ];
    const cases: [bigint, bigint, bigint, bigint][] = [
      [1n, 4n, 3n, 6n],
      [2n, 4n, 3n, 6n],
      [3n, 4n, 3n, 6n],
      [0n, 4n, 2n, 6n],
    ];
    for (const [r1, m1, r2, m2] of cases) {
      const g = gcdBig(m1, m2);
      const got = crt([r1, r2], [m1, m2]);
      rows.push([
        `x ≡ ${r1} (mod ${m1}) · x ≡ ${r2} (mod ${m2})`,
        comma(g),
        comma(r2 - r1),
        comma((((r2 - r1) % g) + g) % g),
        show(got),
      ]);
    }
    return table(rows, [1, 2, 3]).join("\n");
  },
};
