/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/pollardRho/pollardRho-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **한도를 둔 사본이 하나 있다.** 소수 판정을 뺀 판은 소수 입력에서 `c` 를 끝없이 올리며
 * 멈추지 않는다 — `loadMutant` 이 만든 변이 모듈을 그대로 부르면 검사가 끝나지 않으므로,
 * `c` 라운드 수에 한도를 둔 사본으로 그 자리를 보인다. 합성수에서 그 사본이 변이와 같은
 * 답을 내는지도 `자기대조()` 가 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  BOUND,
  bestBound,
  cases,
  countRho,
  countTwoStage,
  SAFE_N,
  SAFE_P,
  SMOOTH_N,
  SMOOTH_P,
} from "./pollardRho-guide.alt.ts";
import { pollardRho } from "./pollardRho-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 입력. `8,051 = 83 × 97` 이다.
 *
 * 갈래 여섯을 한 입력에서 실행한다 — 홀수 갈래 · 합성수 갈래 · 초기화 · 두 걸음 진행 ·
 * 최대공약수 · 반환. 첫 상수 `c = 1` 로 세 걸음 만에 답이 나와 손으로 따라갈 수 있고,
 * 작은 소인수 97 에서만 충돌이 생겨 「mod p 충돌이 mod n 충돌보다 먼저」가 값으로 나온다.
 */
export const WALK = 8_051n;

/** 전개 입력의 두 소인수. */
export const WALK_P = 83n;
export const WALK_Q = 97n;

/** 첫 상수로 답을 못 내는 가장 작은 홀 합성수 둘. */
export const RETRY_SMALL = 21n;
export const RETRY_SECOND = 25n;

/** 반환값이 합성수가 되는 입력. `63 = 3 × 3 × 7` 이다. */
export const COMPOSITE_D = 63n;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `20,000,000,000` 꼴 — 본문 표기와 같다. */
const comma = (n: bigint | number): string =>
  typeof n === "bigint" ? n.toLocaleString("en-US") : n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 낸다. 첫 행이 머리줄이다. */
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
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

let ops = 0;

function gcdCounted(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) {
    ops++;
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** 세지 않는 최대공약수. 입력을 만들 때 쓴다. */
function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function modPowCounted(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n % mod;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) {
      result = (result * b) % mod;
      ops += 2;
    }
    b = (b * b) % mod;
    ops += 2;
    e >>= 1n;
  }
  return result;
}

function isPrimeCounted(n: bigint): boolean {
  if (n < 2n) return false;
  for (const a of BASES) {
    if (n === a) return true;
    ops++;
    if (n % a === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1;
  }
  for (const a of BASES) {
    let x = modPowCounted(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let i = 1; i < s; i++) {
      x = (x * x) % n;
      ops += 2;
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    if (witness) return false;
  }
  return true;
}

/** 계수를 세지 않는 소수 판정. 입력을 만들 때 쓴다. */
function isPrime(n: bigint): boolean {
  const save = ops;
  const r = isPrimeCounted(n);
  ops = save;
  return r;
}

/** 걸음 하나의 기록. */
export interface Frame {
  c: bigint;
  k: number;
  x: bigint;
  y: bigint;
  diff: bigint;
  d: bigint;
}

export interface Counts {
  d: bigint;
  /** 기본 연산 — `n` 크기의 두 수를 곱하거나 나눈 횟수. */
  ops: number;
  /** 소수 판정이 쓴 기본 연산. */
  primeOps: number;
  /** 로 루프의 걸음 수 합. */
  iters: number;
  /** 유클리드 호제법의 나눗셈 횟수 합. */
  gcdSteps: number;
  /** 상수 `c` 를 몇 번 썼는가. */
  rounds: number;
  /** 어느 갈래가 답했는가. */
  exit: "짝수" | "소수" | "로";
  frames: Frame[];
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(n: bigint): Counts {
  ops = 0;
  const frames: Frame[] = [];
  ops++;
  if (n % 2n === 0n) {
    return {
      d: 2n,
      ops,
      primeOps: 0,
      iters: 0,
      gcdSteps: 0,
      rounds: 0,
      exit: "짝수",
      frames,
    };
  }
  const before = ops;
  if (isPrimeCounted(n)) {
    return {
      d: n,
      ops,
      primeOps: ops - before,
      iters: 0,
      gcdSteps: 0,
      rounds: 0,
      exit: "소수",
      frames,
    };
  }
  const primeOps = ops - before;
  let iters = 0;
  let gcdSteps = 0;
  let rounds = 0;
  for (let c = 1n; ; c += 1n) {
    rounds++;
    const f = (t: bigint): bigint => {
      ops += 2;
      return (t * t + c) % n;
    };
    let x = 2n;
    let y = 2n;
    let d = 1n;
    let k = 0;
    while (d === 1n) {
      k++;
      iters++;
      x = f(x);
      y = f(f(y));
      const g0 = ops;
      const diff = x > y ? x - y : y - x;
      d = gcdCounted(diff, n);
      gcdSteps += ops - g0;
      if (frames.length < 64) frames.push({ c, k, x, y, diff, d });
    }
    if (d !== n) {
      return {
        d,
        ops,
        primeOps,
        iters,
        gcdSteps,
        rounds,
        exit: "로",
        frames,
      };
    }
  }
}

/** 걸음 수만 세는 경량 사본. 큰 입력에서 프레임을 쌓지 않으려고 따로 둔다. */
export function countedLite(n: bigint): {
  d: bigint;
  ops: number;
  iters: number;
  gcdSteps: number;
  rounds: number;
} {
  ops = 0;
  ops++;
  if (n % 2n === 0n) return { d: 2n, ops, iters: 0, gcdSteps: 0, rounds: 0 };
  if (isPrimeCounted(n)) return { d: n, ops, iters: 0, gcdSteps: 0, rounds: 0 };
  let iters = 0;
  let gcdSteps = 0;
  let rounds = 0;
  for (let c = 1n; ; c += 1n) {
    rounds++;
    const f = (t: bigint): bigint => {
      ops += 2;
      return (t * t + c) % n;
    };
    let x = 2n;
    let y = 2n;
    let d = 1n;
    while (d === 1n) {
      iters++;
      x = f(x);
      y = f(f(y));
      const g0 = ops;
      d = gcdCounted(x > y ? x - y : y - x, n);
      gcdSteps += ops - g0;
    }
    if (d !== n) return { d, ops, iters, gcdSteps, rounds };
  }
}

/**
 * 소수 판정을 뺀 판. `c` 라운드 수에 한도를 둔다.
 *
 * 소수 입력에서는 어떤 `c` 로도 비자명한 약수가 나오지 않아 절차가 끝나지 않는다. 한도가
 * 없으면 이 파일이 멈추지 않으므로 라운드를 세어 끊는다.
 */
export function cappedNoPrimeGuard(
  n: bigint,
  cap: number,
): { d: bigint | null; rounds: number; iters: number } {
  if (n % 2n === 0n) return { d: 2n, rounds: 0, iters: 0 };
  let iters = 0;
  let c = 1n;
  for (let r = 0; r < cap; r++, c += 1n) {
    const f = (t: bigint): bigint => (t * t + c) % n;
    let x = 2n;
    let y = 2n;
    let d = 1n;
    while (d === 1n) {
      iters++;
      x = f(x);
      y = f(f(y));
      d = gcd(x > y ? x - y : y - x, n);
    }
    if (d !== n) return { d, rounds: r + 1, iters };
  }
  return { d: null, rounds: cap, iters };
}

/** 상수 `c` 한 벌만 실행한 결과. 그 라운드가 낸 `d` 와 걸음 수. */
export function oneRound(
  n: bigint,
  c: bigint,
): { d: bigint; steps: number; frames: Frame[] } {
  const f = (t: bigint): bigint => (t * t + c) % n;
  let x = 2n;
  let y = 2n;
  let d = 1n;
  let steps = 0;
  const frames: Frame[] = [];
  while (d === 1n) {
    steps++;
    x = f(x);
    y = f(f(y));
    const diff = x > y ? x - y : y - x;
    d = gcd(diff, n);
    frames.push({ c, k: steps, x, y, diff, d });
  }
  return { d, steps, frames };
}

/**
 * 두 자리의 속도를 `slow` 대 `fast` 로 놓고 첫 충돌까지의 `f` 호출 수를 센다.
 *
 * 비가 같으면 두 자리가 언제나 같은 값이라 차가 0 이고, 그때 `gcd(0, n)` 이 `n` 이라 이
 * 라운드는 답을 못 낸다. 한도를 두는 것은 그 경우에도 끝내기 위해서다.
 */
export function speedRatio(
  n: bigint,
  c: bigint,
  fast: number,
  cap: number,
): { d: bigint; calls: number; steps: number } {
  const f = (t: bigint): bigint => (t * t + c) % n;
  let x = 2n;
  let y = 2n;
  let d = 1n;
  let calls = 0;
  let steps = 0;
  while (d === 1n && steps < cap) {
    steps++;
    x = f(x);
    calls++;
    for (let i = 0; i < fast; i++) {
      y = f(y);
      calls++;
    }
    d = gcd(x > y ? x - y : y - x, n);
  }
  return { d, calls, steps };
}

/**
 * 법 `m` 위에서 두 자리가 처음 같아지는 걸음.
 *
 * `x_i mod m` 이 같은 점화식을 따르므로 법을 바꿔 따로 실행해도 같은 수열이다.
 */
export function collisionStep(m: bigint, c: bigint, cap: number): number {
  const f = (t: bigint): bigint => (t * t + c) % m;
  let x = 2n % m;
  let y = 2n % m;
  for (let k = 1; k <= cap; k++) {
    x = f(x);
    y = f(f(y));
    if (x === y) return k;
  }
  return -1;
}

/**
 * 법 `m` 위 수열의 꼬리 길이와 순환 마디 길이.
 *
 * 값을 전부 기억해 두고 처음 되풀이되는 자리를 찾는다 — 이 함수는 계수를 내는 자리가 아니라
 * 수열의 모양을 재는 자리라 메모리를 써도 된다.
 */
export function rhoShape(m: bigint, c: bigint): { mu: number; lam: number } {
  const f = (t: bigint): bigint => (t * t + c) % m;
  const seen = new Map<string, number>();
  let x = 2n % m;
  for (let i = 0; ; i++) {
    const key = x.toString();
    const prev = seen.get(key);
    if (prev !== undefined) return { mu: prev, lam: i - prev };
    seen.set(key, i);
    x = f(x);
  }
}

/** 두 수의 최소공배수. */
function lcm(a: number, b: number): number {
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  return (a / g(a, b)) * b;
}

/** 정의를 그대로 옮긴 약수 찾기. 답의 기준이 된다. */
export function trialDivision(n: bigint): bigint {
  if (n % 2n === 0n) return 2n;
  for (let d = 3n; d * d <= n; d += 2n) {
    if (n % d === 0n) return d;
  }
  return n;
}

/** `n` 의 소인수를 오름차순으로. 작은 수에만 쓴다. */
export function factorize(n: bigint): bigint[] {
  const out: bigint[] = [];
  let x = n;
  for (let p = 2n; p * p <= x; p += p === 2n ? 1n : 2n) {
    while (x % p === 0n) {
      out.push(p);
      x /= p;
    }
  }
  if (x > 1n) out.push(x);
  return out;
}

/** `v` 의 제곱근을 내림한 정수. 규모 칸을 실행 없이 세는 데 쓴다. */
export function isqrt(v: bigint): bigint {
  if (v < 2n) return v;
  let x = v;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + v / x) / 2n;
  }
  return x;
}

/** `from` 이상에서 처음 나오는 소수. */
export function nextPrime(from: bigint): bigint {
  let x = from | 1n;
  while (!isPrime(x)) x += 2n;
  return x;
}

/** `from` 이하에서 처음 나오는 소수. */
export function prevPrime(from: bigint): bigint {
  let x = (from - 1n) | 1n;
  while (!isPrime(x)) x -= 2n;
  return x;
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs = [
    WALK,
    RETRY_SMALL,
    RETRY_SECOND,
    COMPOSITE_D,
    9n,
    15n,
    49n,
    1_000_003n,
    2n * 1_000_003n,
    10_403n,
  ];
  for (const n of inputs) {
    const want = pollardRho(n);
    if (counted(n).d !== want) throw new Error(`세는 사본이 ${n} 에서 다르다`);
    if (countedLite(n).d !== want)
      throw new Error(`경량 사본이 ${n} 에서 다르다`);
    if (countRho(n).d !== want)
      throw new Error(`대조 하네스가 ${n} 에서 다르다`);
    if (counted(n).ops !== countRho(n).ops)
      throw new Error(`두 사본의 기본 연산이 ${n} 에서 다르다`);
    if (n % want !== 0n) throw new Error(`${n} 에서 ${want} 는 약수가 아니다`);
  }
  // 한도를 둔 사본은 합성수에서 소수 판정이 있으나 없으나 같은 답을 내야 한다.
  for (const n of [WALK, RETRY_SMALL, COMPOSITE_D, 10_403n]) {
    if (cappedNoPrimeGuard(n, 64).d !== pollardRho(n)) {
      throw new Error(`한도 사본이 ${n} 에서 정본과 다르다`);
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./pollardRho-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  pollardRho(n: bigint): bigint;
}

/** 소수 판정 한 줄을 통째로 뺀 사본. */
const noPrimeGuard = await loadMutant<Impl>(REF, {
  drop: /if \(isPrime\(n\)\) return n;/,
});

/** **불변식을 지키던 줄** 하나 — `d` 가 `n` 인지 보는 검사를 뺀 사본. */
const returnAny = await loadMutant<Impl>(REF, {
  swap: [/if \(d !== n\) return d;/, "return d;"],
});

/** 차의 절댓값을 안 취하고 그대로 뺀 사본. */
const noAbs = await loadMutant<Impl>(REF, {
  swap: [/d = gcd\(x > y \? x - y : y - x, n\);/, "d = gcd(x - y, n);"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noPrimeGuard.pollardRho === pollardRho;

// `returnAny` 는 답을 바꾸는 변이다. 하나도 안 갈리면 그 절의 주장이 성립하지 않는다.
if (!중화됨) {
  const 갈리는가 = [RETRY_SMALL, RETRY_SECOND].some(
    (n) => returnAny.pollardRho(n) !== pollardRho(n),
  );
  if (!갈리는가) {
    throw new Error("반환 검사를 뺀 변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
  const 절댓값이갈리는가 = [WALK, COMPOSITE_D].some(
    (n) => noAbs.pollardRho(n) !== pollardRho(n),
  );
  if (!절댓값이갈리는가) {
    throw new Error("절댓값을 뺀 변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
}

/* ────────────────────────── 규모 ────────────────────────── */

/** 비용을 세는 규모의 상한. 원본 시험 파일의 가장 큰 입력이 이 안쪽이다. */
export const LIMIT = 1n << 64n;

/** 균형 잡힌 반소수 — 두 소인수가 모두 `10^e` 근방이다. */
export function balanced(e: number): { n: bigint; p: bigint; q: bigint } {
  const p = nextPrime(10n ** BigInt(e));
  const q = nextPrime(10n ** BigInt(e) + 1_000n);
  return { n: p * q, p, q };
}

export const PROOFS: Record<string, () => string> = {
  /** concept — 같은 수열을 두 법으로 읽으면 겹치는 자리가 다르다. */
  "concept-two-mods": () => {
    const f = (t: bigint): bigint => (t * t + 1n) % WALK;
    const xs: bigint[] = [2n];
    for (let i = 0; i < 6; i++) xs.push(f(xs[i] as bigint));
    const head = ["걸음", ...xs.map((_, i) => `x${i}`)];
    const rows = [
      head,
      [`법 ${comma(WALK)}`, ...xs.map((v) => comma(v))],
      [`법 ${comma(WALK_Q)}`, ...xs.map((v) => comma(v % WALK_Q))],
      [`법 ${comma(WALK_P)}`, ...xs.map((v) => comma(v % WALK_P))],
    ];
    const first = xs.findIndex(
      (v, i) => i > 0 && xs.slice(0, i).some((w) => w % WALK_Q === v % WALK_Q),
    );
    return [
      ...table(
        rows,
        xs.map((_, i) => i + 1),
      ),
      "",
      `└ 둘째 줄은 값이 놓일 자리가 ${comma(WALK)} 개이고 셋째 줄은 ${comma(WALK_Q)} 개다.`,
      `  셋째 줄에서 x${first}${이가(first)} 앞에 나온 값과 같아지고, 같은 자리에서 둘째 줄의 값은 아직`,
      `  앞의 어느 값과도 같지 않다. 넷째 줄(법 ${comma(WALK_P)})도 아직 겹치지 않았다`,
    ].join("\n");
  },

  /** deep.build ② — 정의를 그대로 옮긴 방법이 규모에서 몇 번이 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [];
    for (const e of [2, 3, 4, 5, 6, 7, 8, 9]) {
      const { n } = balanced(e);
      const c = countedLite(n);
      rows.push([
        `10^${2 * e} 근방`,
        comma(n),
        comma((isqrt(n) - 1n) / 2n + 1n),
        comma(c.ops),
      ]);
    }
    return [
      ...table(
        [["입력 규모", "n", "3 부터 √n 까지 홀수", "이 글의 절차"], ...rows],
        [1, 2, 3],
      ),
      "",
      "└ 셋째 칸은 실행하지 않고 √n 을 구해 센 값이고, 넷째 칸은 정본을 실행해 센",
      "  기본 연산이다. 두 칸의 단위는 같다 — n 크기의 두 수를 곱하거나 나눈 횟수다.",
      "  셋째 칸은 줄마다 커지는데 넷째 칸은 그렇지 않다 — 걸음 수가 수열이 언제 겹치는가에",
      "  달려 있어서 같은 자릿수 안에서도 값이 갈린다",
    ].join("\n");
  },

  /** deep.build ③ — 전개 입력에서 mod p 충돌이 mod n 충돌보다 먼저 온다. */
  "mod-p-collision": () => {
    const r = oneRound(WALK, 1n);
    const rows = r.frames.map((f) => [
      String(f.k),
      comma(f.x),
      comma(f.y),
      comma(f.x % WALK_Q),
      comma(f.y % WALK_Q),
      comma(f.x % WALK_P),
      comma(f.y % WALK_P),
      comma(f.diff),
      comma(f.d),
    ]);
    return [
      ...table(
        [
          [
            "걸음",
            "x",
            "y",
            "x mod 97",
            "y mod 97",
            "x mod 83",
            "y mod 83",
            "|x − y|",
            "gcd(|x − y|, 8051)",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6, 7, 8],
      ),
      "",
      `└ 넷째 칸과 다섯째 칸이 ${r.steps} 걸음에서 처음 같아지고, 그때 두 칸의 값은 ${comma(
        (r.frames.at(-1)?.x ?? 0n) % WALK_Q,
      )} 이다.`,
      "  같은 걸음에서 여섯째 칸과 일곱째 칸은 다르고 둘째 칸과 셋째 칸도 다르다 —",
      `  법 97 에서만 겹쳤다. 마지막 칸이 그 자리에서 ${comma(r.d)}${을를(comma(r.d))} 낸다`,
    ].join("\n");
  },

  /** deep.build ④ — 같은 수열을 두 법으로 읽으면 첫 충돌 걸음이 갈린다. */
  "two-waits": () => {
    const rows: string[][] = [];
    for (const e of [2, 3, 4, 5]) {
      const { n, p } = balanced(e);
      rows.push([
        comma(n),
        comma(p),
        comma(collisionStep(p, 1n, 5_000_000)),
        comma(collisionStep(n, 1n, 5_000_000)),
        comma(isqrt(p)),
        comma(isqrt(n)),
      ]);
    }
    const walk = [
      comma(WALK),
      comma(WALK_Q),
      comma(collisionStep(WALK_Q, 1n, 5_000_000)),
      comma(collisionStep(WALK, 1n, 5_000_000)),
      comma(isqrt(WALK_Q)),
      comma(isqrt(WALK)),
    ];
    return [
      ...table(
        [
          [
            "n",
            "작은 소인수 p",
            "법 p 의 첫 충돌",
            "법 n 의 첫 충돌",
            "√p 를 내림",
            "√n 을 내림",
          ],
          walk,
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "└ 같은 수열 하나를 두 법으로 따로 읽은 결과다. 첫 줄이 전개 입력이고 나머지 넷은",
      "  두 소인수가 같은 자릿수인 입력이다. 셋째 칸이 넷째 칸보다 줄마다 작다.",
      "  셋째 칸은 다섯째 칸과 같은 자릿수인데 넷째 칸은 여섯째 칸보다 작은 줄이 있다",
    ].join("\n");
  },

  /** deep.build ⑤ — 법 n 의 마디가 법 p 와 법 q 의 마디에서 어떻게 나오는가. */
  "cycle-lcm": () => {
    const rows: string[][] = [];
    const pairs: [bigint, bigint][] = [[WALK_Q, WALK_P]];
    for (const e of [2, 3, 4]) {
      const b = balanced(e);
      pairs.push([b.p, b.q]);
    }
    for (const [p, q] of pairs) {
      const a = rhoShape(p, 1n);
      const b = rhoShape(q, 1n);
      const n = rhoShape(p * q, 1n);
      rows.push([
        comma(p * q),
        String(a.lam),
        String(b.lam),
        comma(lcm(a.lam, b.lam)),
        comma(n.lam),
        String(Math.max(a.mu, b.mu)),
        String(n.mu),
      ]);
    }
    return [
      ...table(
        [
          [
            "n = p × q",
            "λp",
            "λq",
            "λp 와 λq 의 최소공배수",
            "λn",
            "μp 와 μq 중 큰 쪽",
            "μn",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      "└ 넷째 칸과 다섯째 칸이 네 줄 내내 같고, 여섯째 칸과 일곱째 칸도 네 줄 내내 같다.",
      "  법 n 의 값 하나가 법 p 의 값과 법 q 의 값 한 쌍으로 정해지므로 마디는 두 마디의",
      "  최소공배수이고 꼬리는 두 꼬리 중 긴 쪽이다 — 최소공배수가 곱보다 작으면 법 n 의",
      "  첫 겹침도 √n 보다 앞선다",
    ].join("\n");
  },

  /** deep.build ⑥ — 두 자리의 속도 비를 네 가지로 시험한다. */
  "speed-ratio": () => {
    const family = [WALK, 10_403n, balanced(3).n, balanced(4).n, balanced(5).n];
    const rows: string[][] = [];
    for (const fast of [1, 2, 3, 4]) {
      const per = family.map((n) => speedRatio(n, 1n, fast, 200_000));
      const 못찾음 = per.filter((r, i) => r.d === family[i]).length;
      rows.push([
        `1 대 ${fast}`,
        String(못찾음),
        comma(per.reduce((a, r) => a + r.steps, 0)),
        comma(per.reduce((a, r) => a + r.calls, 0)),
      ]);
    }
    return [
      ...table(
        [["속도 비", "약수를 못 낸 입력", "걸음 합", "f 호출 합"], ...rows],
        [1, 2, 3],
      ),
      "",
      `└ 입력 다섯은 ${comma(WALK)} · ${comma(10_403n)} 과 두 소인수가 각각 10^3 · 10^4 · 10^5`,
      "  근방인 반소수 셋이고, 상수는 다섯 줄 모두 c = 1 이다. 첫 줄은 두 자리가 언제나 같은",
      "  값이라 차가 0 이고 gcd(0, n) = n 이므로 다섯 입력 모두 약수를 못 낸다. 나머지 셋 중",
      "  마지막 칸이 가장 작은 것이 1 대 2 다",
    ].join("\n");
  },

  /** deep.build ⑥ — 여러 p 에서 첫 충돌 걸음이 √p 를 따라가는가. */
  "birthday-sweep": () => {
    const rows: string[][] = [];
    for (const e of [2, 3, 4, 5, 6, 7]) {
      const p = nextPrime(10n ** BigInt(e));
      const root = isqrt(p);
      const k = collisionStep(p, 1n, 5_000_000);
      rows.push([
        comma(p),
        comma(root),
        comma(k),
        (k / Number(root)).toFixed(2),
      ]);
    }
    const first = rows[0] as string[];
    const last = rows.at(-1) as string[];
    const firstP = nextPrime(10n ** 2n);
    const lastP = nextPrime(10n ** 7n);
    const firstK = collisionStep(firstP, 1n, 5_000_000);
    const lastK = collisionStep(lastP, 1n, 5_000_000);
    return [
      ...table(
        [["소수 p", "√p 를 내림한 값", "첫 충돌 걸음 k", "k / √p"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      "└ f(t) = (t² + 1) mod p 를 p 마다 따로 실행해 잰 값이다. 첫 칸이",
      `  ${first[0]} 에서 ${comma(lastP)}${으로(comma(lastP))} 약 10 만 배 커지는 동안 셋째 칸은`,
      `  ${comma(firstK)} 에서 ${comma(lastK)}${으로(comma(lastK))} 커지고 마지막 칸은 ${first[3]} 과 ${last[3]} 사이에 머문다.`,
      "  표본이 여섯이라 이 여섯에서 그렇다는 것이고 모든 p 에 대한 주장이 아니다",
    ].join("\n");
  },

  /** deep.walk.step 3 — 차의 절댓값을 안 취하면 무엇이 나오는가. */
  "mutant-no-abs": () => {
    const rows: string[][] = [];
    for (const n of [
      9n,
      WALK,
      10_403n,
      COMPOSITE_D,
      325n,
      1_000_036_000_099n,
    ]) {
      const mine = pollardRho(n);
      const theirs = noAbs.pollardRho(n);
      rows.push([
        comma(n),
        comma(mine),
        comma(theirs),
        theirs > 0n && n % theirs === 0n ? "약수다" : "약수가 아니다",
        mine === theirs ? "같다" : "어긋난다",
      ]);
    }
    const 음수 = rows.filter((r) => (r[2] ?? "").startsWith("-")).length;
    return [
      ...table(
        [
          ["입력", "정본", "절댓값을 안 취한 판", "셋째 칸은", "두 칸"],
          ...rows,
        ],
        [0, 1, 2],
      ),
      "",
      `└ 셋째 칸이 ${음수 === rows.length ? "줄마다" : `${rows.length} 줄 중 ${음수} 줄에서`} 음수다. 유클리드 호제법이 나머지의 부호를`,
      "  피제수에서 가져오므로 음수를 넣으면 결과의 부호가 따라오고, 그 값은 n 의 약수가 아니다.",
      "  9 의 줄은 크기가 3 이라 절댓값은 정본과 같지만 부호가 어긋나 계약의 「1 < d」를 지키지 못한다",
    ].join("\n");
  },

  /** deep.walk — 전개 입력을 처음부터 끝까지 실행한 기록. */
  "walk-trace": () => {
    const c = counted(WALK);
    const rows: string[][] = [
      ["T1", "①", "—", "—", "—", "8,051 은 홀수 — 다음으로"],
      ["T2", "②", "—", "—", "—", "8,051 은 합성수 — 다음으로"],
      ["T3", "③④", comma(2n), comma(2n), "—", "c = 1, x = y = 2, d = 1"],
    ];
    for (const f of c.frames) {
      rows.push([
        `T${3 + f.k}`,
        "⑤⑥",
        comma(f.x),
        comma(f.y),
        comma(f.diff),
        f.d === 1n ? "d = 1 — 계속" : `d = ${comma(f.d)} — 루프 종료`,
      ]);
    }
    rows.push([
      `T${4 + c.frames.length}`,
      "⑦",
      comma(c.frames.at(-1)?.x ?? 0n),
      comma(c.frames.at(-1)?.y ?? 0n),
      comma(c.frames.at(-1)?.diff ?? 0n),
      `${comma(c.d)} ≠ 8,051 이라 반환`,
    ]);
    return [
      ...table(
        [["걸음", "갈래", "x", "y", "|x − y|", "그 자리의 판정"], ...rows],
        [2, 3, 4],
      ),
      "",
      `└ n = 8,051 이고 반환값은 ${comma(c.d)}${josa(comma(c.d), "이다", "다")}. 로 루프가 ${c.iters} 걸음이고 상수는 c = 1 하나로 끝났다.`,
      `  기본 연산은 모두 ${comma(c.ops)} 번이고 그중 ${comma(c.primeOps)} 번이 소수 판정의 몫이다`,
    ].join("\n");
  },

  /** deep.walk — 갈래 여덟이 여섯 입력에서 몇 번씩 실행되는가. */
  "walk-branch": () => {
    const inputs: [string, bigint][] = [
      ["8,051", WALK],
      ["21", RETRY_SMALL],
      ["25", RETRY_SECOND],
      ["4", 4n],
      ["1,000,003", 1_000_003n],
      ["10,403", 10_403n],
    ];
    const labels = [
      "① 짝수인가",
      "② 소수인가",
      "③ 수열을 시작한다",
      "④ d 를 1 로 둔다",
      "⑤ 두 자리를 나아가게 한다",
      "⑥ 차의 최대공약수",
      "⑦ 비자명한 약수를 반환",
      "⑧ c 를 올려 다시",
    ];
    const cols = inputs.map(([, n]) => {
      const c = counted(n);
      const 짝수 = 1;
      const 소수 = c.exit === "짝수" ? 0 : 1;
      const 시작 = c.rounds;
      const 반환 = c.exit === "로" ? 1 : 0;
      const 재시작 = c.rounds === 0 ? 0 : c.rounds - 1;
      return [짝수, 소수, 시작, 시작, c.iters, c.iters, 반환, 재시작];
    });
    const rows = labels.map((label, i) => [
      label,
      ...cols.map((col) => String(col[i] ?? 0)),
    ]);
    return [
      ...table(
        [["갈래", ...inputs.map(([label]) => label)], ...rows],
        inputs.map((_, i) => i + 1),
      ),
      "",
      "└ 첫 칸이 전개 입력이고 그 열에서 ⑧ 이 0 이다 — c = 1 하나로 끝났다는 뜻이다.",
      "  21 과 25 의 열에서 ⑧ 이 1 이고, 4 의 열은 ① 만으로 끝나며 1,000,003 의 열은",
      "  ② 까지만 실행한다. 여섯 입력을 합쳐 한 번도 안 실행된 갈래는 0 개다",
    ].join("\n");
  },

  /** deep.walk.pause — 소수 판정을 뺀 판. 합성수에서는 답이 안 바뀐다. */
  "mutant-no-prime-guard": () => {
    const rows: string[][] = [];
    for (const n of [WALK, RETRY_SMALL, RETRY_SECOND, COMPOSITE_D, 10_403n]) {
      const mine = pollardRho(n);
      const theirs = noPrimeGuard.pollardRho(n);
      rows.push([
        comma(n),
        factorize(n).map(String).join(" × "),
        comma(mine),
        comma(theirs),
        mine === theirs ? "같다" : "어긋난다",
      ]);
    }
    return [
      ...table(
        [["입력", "소인수", "정본", "소수 판정을 뺀 판", "두 칸"], ...rows],
        [0, 2, 3],
      ),
      "",
      "└ 다섯 줄 다 합성수이고 셋째 칸과 넷째 칸이 줄마다 같다. 소수 판정은 합성수 입력의",
      "  답에 아무것도 더하지 않는다 — 그 줄이 무엇을 막는지는 아래 표가 보인다",
    ].join("\n");
  },

  /** deep.walk.pause — 소수 입력에서는 그 줄이 없으면 절차가 끝나지 않는다. */
  "pause-prime-loops": () => {
    const rows: string[][] = [];
    for (const n of [97n, 8_053n, 1_000_003n]) {
      const capped = cappedNoPrimeGuard(n, 30);
      rows.push([
        comma(n),
        isPrime(n) ? "소수" : "합성수",
        comma(pollardRho(n)),
        capped.d === null ? "c = 30 까지 없음" : comma(capped.d),
        comma(capped.iters),
      ]);
    }
    return [
      ...table(
        [
          ["입력", "정의대로", "정본", "소수 판정을 뺀 판", "그때까지의 걸음"],
          ...rows,
        ],
        [0, 2, 4],
      ),
      "",
      "└ 세 줄 다 소수라 비자명한 약수가 없다. 넷째 칸은 c 를 30 까지 올려도 답이 없고,",
      "  한도를 안 두면 그 자리에서 끝나지 않는다. 셋째 칸은 소수 판정이 그 자리에서",
      "  n 자신을 돌려준 값이다",
    ].join("\n");
  },

  /** deep.walk.pause — 반환값이 소수라는 보장이 없다. */
  "pause-composite-divisor": () => {
    const rows: string[][] = [];
    for (const n of [COMPOSITE_D, 105n, 325n, 8_051n, 10_403n]) {
      const d = pollardRho(n);
      rows.push([
        comma(n),
        factorize(n).map(String).join(" × "),
        comma(d),
        factorize(d).map(String).join(" × "),
        isPrime(d) ? "소수" : "합성수",
        comma(n / d),
      ]);
    }
    return [
      ...table(
        [
          ["입력", "n 의 소인수", "반환값 d", "d 의 소인수", "d 는", "n / d"],
          ...rows,
        ],
        [0, 2, 5],
      ),
      "",
      "└ 다섯 줄 모두 n 을 d 로 나눈 나머지가 0 이다. 다섯째 칸이 「합성수」인 줄에서는",
      "  d 를 한 번 더 갈라야 소인수가 나온다 — 계약이 요구하는 것은 「비자명한 약수」이지",
      "  「소인수」가 아니다",
    ].join("\n");
  },

  /** deep.math ② — √p 예측과 실제 첫 충돌 걸음. */
  "math-check": () => {
    const rows: string[][] = [];
    for (const p of [97n, 1_009n, 10_007n, 100_003n]) {
      const root = isqrt(p);
      const cs = [1n, 2n, 3n, 4n];
      const ks = cs.map((c) => collisionStep(p, c, 5_000_000));
      rows.push([
        comma(p),
        comma(root),
        ...ks.map(String),
        (ks.reduce((a, b) => a + b, 0) / ks.length / Number(root)).toFixed(2),
      ]);
    }
    return [
      ...table(
        [
          [
            "p",
            "√p 를 내림한 값",
            "c = 1",
            "c = 2",
            "c = 3",
            "c = 4",
            "네 값의 평균 / √p",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      "└ 셋째 칸부터 여섯째 칸까지가 같은 p 를 상수 넷으로 실행해 잰 첫 충돌 걸음이다.",
      "  같은 p 에서도 상수에 따라 값이 갈리고, 마지막 칸은 네 값의 평균을 √p 로 나눈 것이다.",
      "  p 가 97 에서 100,003 으로 약 1,000 배 커지는 동안 마지막 칸은 1 근방에 머문다",
    ].join("\n");
  },

  /** deep.math ④ — 식에 제약 규모를 넣어 수치를 낸다. */
  "math-scale": () => {
    const rows: string[][] = [];
    const scales: [string, bigint][] = [
      ["10^4", 10n ** 4n],
      ["10^8", 10n ** 8n],
      ["10^12", 10n ** 12n],
      ["10^16", 10n ** 16n],
      ["2^64", LIMIT],
      ["10^20", 10n ** 20n],
    ];
    for (const [label, n] of scales) {
      const root = isqrt(n);
      const quarter = isqrt(root);
      const divisions = (root - 1n) / 2n + 1n;
      rows.push([
        label,
        comma(n),
        comma(divisions),
        comma(quarter),
        comma(divisions / quarter),
      ]);
    }
    return [
      ...table(
        [
          [
            "규모",
            "n",
            "정의를 옮긴 방법의 나눗셈 √n / 2",
            "이 절차의 걸음 n^(1/4)",
            "셋째를 넷째로 나눈 값",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      `└ 계약 상한 2^64 = ${comma(LIMIT)} 이 다섯째 줄이다.`,
      "  셋째 칸과 넷째 칸은 실행하지 않고 √ 를 한 번과 두 번 구해 센 값이라 상수 배가",
      "  안 담겨 있다 — 마지막 칸은 두 방법의 걸음 수 비이지 실행 시간의 비가 아니다",
    ].join("\n");
  },

  /** invariant ② — 경계 입력에서 어느 갈래가 답하는가. */
  "edge-values": () => {
    const rows: string[][] = [];
    for (const n of [
      2n,
      3n,
      4n,
      9n,
      15n,
      21n,
      25n,
      49n,
      63n,
      8_051n,
      1_000_003n,
      2n * 1_000_003n,
    ]) {
      const c = counted(n);
      const t = trialDivision(n);
      rows.push([
        comma(n),
        c.exit,
        comma(c.d),
        comma(t),
        n % c.d === 0n ? "약수" : "약수 아님",
        c.d === n ? "n 자신" : "1 < d < n",
      ]);
    }
    return [
      ...table(
        [
          [
            "입력 n",
            "어느 갈래가 답하나",
            "정본",
            "시행 나눗셈",
            "d 는",
            "자리",
          ],
          ...rows,
        ],
        [0, 2, 3],
      ),
      "",
      "└ 다섯째 칸이 열두 줄 내내 「약수」다. 셋째 칸과 넷째 칸이 갈리는 줄이 있는데",
      "  두 절차가 같은 약수를 고를 이유가 없어서다 — 계약이 요구하는 것은 「어느 것이든",
      "  하나」다. 여섯째 칸이 「n 자신」인 줄은 둘째 칸이 「소수」인 줄과 정확히 같다",
    ].join("\n");
  },

  /** invariant ③ — 반환 검사를 뺀 판이 내는 잘못된 값. */
  "mutant-return-any": () => {
    const rows: string[][] = [];
    for (const n of [9n, 15n, RETRY_SMALL, RETRY_SECOND, COMPOSITE_D, WALK]) {
      const mine = pollardRho(n);
      const theirs = returnAny.pollardRho(n);
      rows.push([
        comma(n),
        factorize(n).map(String).join(" × "),
        comma(mine),
        comma(theirs),
        theirs === n ? "n 자신이다" : "1 < d < n",
        mine === theirs ? "같다" : "어긋난다",
      ]);
    }
    return [
      ...table(
        [
          [
            "입력",
            "소인수",
            "정본",
            "반환 검사를 뺀 판",
            "뺀 판이 낸 d 의 자리",
            "두 칸",
          ],
          ...rows,
        ],
        [0, 2, 3],
      ),
      "",
      "└ 넷째 칸이 21 과 25 에서 입력 자신과 같은 값이다. 합성수인데 n 자신을 돌려준 것이라",
      "  계약의 「1 < d < n」이 깨진다. 나머지 네 줄은 첫 상수 c = 1 이 곧바로 비자명한",
      "  약수를 내는 줄이라 두 판의 답이 같다",
    ].join("\n");
  },

  /** perf.derive — 식이 내는 기본 연산과 실행이 센 값. */
  "perf-formula": () => {
    const rows: string[][] = [];
    for (const n of [
      2n * 1_000_003n,
      1_000_003n,
      WALK,
      RETRY_SMALL,
      10_403n,
      balanced(4).n,
      balanced(6).n,
    ]) {
      const c = counted(n);
      const formula = 1 + c.primeOps + 6 * c.iters + c.gcdSteps;
      rows.push([
        comma(n),
        comma(c.primeOps),
        comma(c.iters),
        comma(c.gcdSteps),
        comma(formula),
        comma(c.ops),
      ]);
    }
    return [
      ...table(
        [
          [
            "입력",
            "소수 판정 P",
            "로 루프 걸음 합 Σk",
            "유클리드 나눗셈 G",
            "식이 내는 기본 연산",
            "실행이 센 기본 연산",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      "└ 다섯째 칸과 여섯째 칸이 일곱 줄 내내 같다. 다섯째 칸은 1 + P + 6Σk + G 를 계산한",
      "  값이고 앞의 세 칸이 그 P·Σk·G 다. 위 두 줄은 로 루프에 내려가지 않아 Σk 와 G 가 0 이다",
    ].join("\n");
  },

  /** perf.worst — 같은 규모에서 무엇이 계수를 정하는가. */
  "worst-shapes": () => {
    const rows: string[][] = [];
    const big = balanced(9);
    const huge = nextPrime(10n ** 18n);
    const shapes: [string, bigint][] = [
      ["짝수", 2n * huge],
      ["가장 작은 소인수가 3", 3n * huge],
      [
        "가장 작은 소인수가 10^3 근방",
        nextPrime(1_000n) * nextPrime(10n ** 15n),
      ],
      [
        "가장 작은 소인수가 10^6 근방",
        nextPrime(10n ** 6n) * nextPrime(10n ** 12n),
      ],
      ["두 소인수가 모두 10^9 근방", big.n],
      ["2^64 아래 두 소인수가 가장 큰 모양", prevPrime(1n << 32n) ** 2n],
      ["소수", huge],
    ];
    for (const [label, n] of shapes) {
      const c = countedLite(n);
      rows.push([label, comma(n), comma(c.iters), comma(c.ops)]);
    }
    const 최소 = Math.min(
      ...rows.map((r) => Number((r[3] ?? "0").replaceAll(",", ""))),
    );
    const 최대 = Math.max(
      ...rows.map((r) => Number((r[3] ?? "0").replaceAll(",", ""))),
    );
    return [
      ...table(
        [["입력 모양", "n", "로 루프 걸음", "기본 연산"], ...rows],
        [1, 2, 3],
      ),
      "",
      `└ 일곱 줄의 n 이 전부 10^18 이상인데 마지막 칸이 ${comma(최소)} 과 ${comma(최대)} 사이로`,
      "  갈린다. n 이 아니라 가장 작은 소인수가 계수를 정한다 — 마지막 줄은 소수라 로 루프에",
      `  내려가지도 않는다. 여섯째 줄은 ${comma(prevPrime(1n << 32n))} 의 제곱이고 2^64 아래에서`,
      "  가장 작은 소인수가 가장 클 수 있는 모양이다",
    ].join("\n");
  },

  /** purpose.alt — 두 설계의 계수. */
  "alt-counts": () => {
    const ours = cases["폴라드 로"]();
    const alt = cases["p-1 을 앞에 세운 두 단계 판"]();
    const keys = Object.keys(ours);
    const rows = keys.map((k) => {
      const a = ours[k as keyof typeof ours] as number;
      const b = alt[k as keyof typeof alt] as number;
      return [
        k,
        comma(a),
        comma(b),
        a === b ? "같다" : a < b ? "폴라드 로" : "두 단계 판",
      ];
    });
    return [
      ...table(
        [["무엇", "폴라드 로", "두 단계 판", "적은 쪽"], ...rows],
        [1, 2],
      ),
      "",
      `└ 매끄러운 p 는 ${comma(SMOOTH_P)} 이고 안전 소수 p 는 ${comma(SAFE_P)} 이다.`,
      `  두 입력은 각각 ${comma(SMOOTH_N)}${과와(comma(SMOOTH_N))} ${comma(SAFE_N)} 이고 큰 쪽 소인수는 둘 다 1,000,003 이다.`,
      `  마지막 칸이 위 세 줄에서 갈리고 넷째 줄에서는 두 설계가 같다 — 한계 B = ${comma(BOUND)}${으로(comma(BOUND))} 잰 값이다`,
    ].join("\n");
  },

  /** purpose.alt — 한계 B 를 바꾸면 무엇이 바뀌는가. */
  "alt-bound": () => {
    const rows: string[][] = [];
    for (const limit of [50, 100, 200, 400, 800, 1_600]) {
      const smooth = countTwoStage(SMOOTH_N, limit);
      const safe = countTwoStage(SAFE_N, limit);
      rows.push([
        comma(limit),
        smooth.bySmooth ? "p-1 단계" : "로 단계",
        comma(smooth.ops),
        comma(safe.ops),
        comma(smooth.ops + safe.ops),
      ]);
    }
    const best = bestBound([50, 100, 200, 400, 800, 1_600]);
    return [
      ...table(
        [
          [
            "한계 B",
            "매끄러운 p 를 어디서 찾나",
            "매끄러운 p",
            "안전 소수 p",
            "둘의 합",
          ],
          ...rows,
        ],
        [0, 2, 3, 4],
      ),
      "",
      `└ 마지막 칸이 가장 작은 줄은 B = ${comma(best.limit)} 이고 그때 ${comma(best.ops)} 이다.`,
      "  B 를 올리면 매끄러운 쪽은 좋아지다 멈추고 안전 소수 쪽은 계속 나빠진다 —",
      `  안전 소수의 p − 1 은 ${comma(SAFE_P - 1n)} = 2 × ${comma((SAFE_P - 1n) / 2n)} 이라`,
      `  B 가 ${comma((SAFE_P - 1n) / 2n)} 보다 작으면 p-1 단계가 그 소인수를 못 찾는다`,
    ].join("\n");
  },

  /** selfcheck 가 인용하는 값. */
  "check-retry": () => {
    const r1 = oneRound(RETRY_SMALL, 1n);
    const r2 = oneRound(RETRY_SMALL, 2n);
    const c = counted(RETRY_SMALL);
    return [
      ...table(
        [
          ["상수 c", "걸음", "x", "y", "|x − y|", "d"],
          ...[...r1.frames, ...r2.frames].map((f) => [
            String(f.c),
            String(f.k),
            comma(f.x),
            comma(f.y),
            comma(f.diff),
            comma(f.d),
          ]),
        ],
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `└ c = 1 의 첫 걸음에서 d 가 ${comma(r1.d)}${이가(comma(r1.d))} 되는데 그것이 n 자신이라 ⑧ 이 실행된다.`,
      `  c = 2 가 ${r2.steps} 걸음에서 ${comma(r2.d)}${을를(comma(r2.d))} 내고 정본의 반환값도 ${comma(pollardRho(RETRY_SMALL))} 이다.`,
      `  기본 연산은 모두 ${comma(c.ops)} 번이다`,
    ].join("\n");
  },
};
