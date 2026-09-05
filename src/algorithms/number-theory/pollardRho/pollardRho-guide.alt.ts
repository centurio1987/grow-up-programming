/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 계수를 실측하는 하네스 — `L13`.
 *
 * 재는 것은 **기본 연산 수**와 **갈리는 부분이 동시에 들고 있는 스칼라 칸 수**, 그리고
 * **고를 값의 개수** 셋이다. 스칼라 칸은 두 설계가 공유하는 앞단(짝수 검사·소수 판정)을 빼고
 * 센다 — 그 앞단은 두 설계에서 글자 그대로 같은 코드라 저울질의 대상이 아니다. 기본 연산은 `n` 크기의 두 수를
 * 곱하거나 나누는 것 하나를 1 로 센다 — `(t * t + c) % n` 은 곱 하나와 나머지 하나라 2 이고,
 * 유클리드 호제법의 `x % y` 한 번은 1 이다. 두 설계가 같은 단위를 쓰고 같은 입력에서 늘 같은
 * 값을 낸다 — 벽시계는 안 잰다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/pollardRho/pollardRho-guide.alt.ts
 *
 * **경쟁 설계는 폴라드 p-1 을 앞에 세운 두 단계 판이다.** 짝수·소수를 거른 뒤 `p-1` 이
 * `B` 이하의 소수만으로 이뤄진 소인수를 먼저 노리고, 못 찾으면 정본과 **같은** 로 절차로
 * 내려간다. 두 설계 모두 언제나 비자명한 약수를 돌려주므로 계수가 저울질이 된다.
 *
 * **갈리는 축은 `p - 1` 의 소인수 크기 하나다.** `B` 는 아래 `bestBound` 가 `10^12` 규모에서
 * 실측으로 고른 200 이고, 그 값은 규모를 따라 다시 골라야 하는 값이다.
 *
 * **입력은 생성식으로 고정한다**(`L20`). `q` 를 `1,000,003` 으로 고정하고 `p` 만 두 가족에서
 * 뽑는다 — 「`10^6` 위에서 처음 나오는, `p - 1` 의 소인수가 전부 200 이하인 소수」와
 * 「`10^6` 위에서 처음 나오는, `(p - 1) / 2` 도 소수인 소수」다. 한 번 정한 입력은 수치가
 * 마음에 안 든다는 이유로 바꾸지 않는다.
 *
 * **답을 대조하지 않은 계수는 저울질이 아니다.** `약수인가()` 가 매 실행마다 두 설계의
 * 반환값이 정본(`.ref.ts`)의 답과 함께 실제 약수인지 확인한다.
 */
import { pollardRho } from "./pollardRho-guide.ref.ts";

/** 정본이 쓰는 밑 열둘 — 처음 열두 소수. */
const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/** 전개 절이 쓰는 입력. `8,051 = 83 × 97` 이다. */
export const WALK = 8_051n;

/** 경쟁 설계의 매끄러움 한계. 이 값 이하의 소수만으로 이뤄진 `p - 1` 을 노린다. */
export const BOUND = 200;

/** 두 입력 가족이 공유하는 큰 쪽 소인수. */
export const Q = 1_000_003n;

/** 입력 가족을 뽑기 시작하는 자리. */
export const FROM = 1_000_000n;

/* ────────────────────────── 계수 ────────────────────────── */

/** 이 모듈이 세는 기본 연산. 함수마다 0 으로 되돌리고 쓴다. */
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

/** 정본의 소수 판정에 세는 자리만 덧붙인 사본. */
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

/** 로 절차 본체. 앞단(짝수·소수)을 이미 지난 홀수 합성수만 받는다. */
function rhoCore(n: bigint): bigint {
  for (let c = 1n; ; c += 1n) {
    const f = (t: bigint): bigint => {
      ops += 2;
      return (t * t + c) % n;
    };
    let x = 2n;
    let y = 2n;
    let d = 1n;
    while (d === 1n) {
      x = f(x);
      y = f(f(y));
      d = gcdCounted(x > y ? x - y : y - x, n);
    }
    if (d !== n) return d;
  }
}

/**
 * 폴라드 p-1 의 1 단계. `a` 를 `2, 3, …, B` 로 차례로 거듭제곱해 `a^(B!) mod n` 을 만들고
 * 64 걸음마다 `gcd(a - 1, n)` 을 본다. `p - 1` 이 `B` 이하의 소수만으로 이뤄져 있으면
 * `p | a - 1` 이 되어 그 자리에서 `p` 가 나온다.
 */
function pMinusOneCore(n: bigint, limit: number): bigint | null {
  let a = 2n;
  for (let j = 2; j <= limit; j++) {
    a = modPowCounted(a, BigInt(j), n);
    if (j % 64 !== 0) continue;
    const g = gcdCounted(a - 1n, n);
    if (g > 1n && g < n) return g;
    if (g === n) return null;
  }
  const g = gcdCounted(a - 1n, n);
  return g > 1n && g < n ? g : null;
}

export interface Result {
  d: bigint;
  ops: number;
  /** 경쟁 설계에서 p-1 단계가 답을 냈는가. 정본에서는 언제나 거짓이다. */
  bySmooth: boolean;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function countRho(n: bigint): Result {
  ops = 0;
  ops++;
  if (n % 2n === 0n) return { d: 2n, ops, bySmooth: false };
  if (isPrimeCounted(n)) return { d: n, ops, bySmooth: false };
  return { d: rhoCore(n), ops, bySmooth: false };
}

/** 경쟁 설계 — p-1 을 먼저 걸고 못 찾으면 같은 로 절차로 내려간다. */
export function countTwoStage(n: bigint, limit: number = BOUND): Result {
  ops = 0;
  ops++;
  if (n % 2n === 0n) return { d: 2n, ops, bySmooth: false };
  if (isPrimeCounted(n)) return { d: n, ops, bySmooth: false };
  const g = pMinusOneCore(n, limit);
  if (g !== null) return { d: g, ops, bySmooth: true };
  return { d: rhoCore(n), ops, bySmooth: false };
}

/* ────────────────────────── 입력 가족 ────────────────────────── */

/** 소인수를 오름차순으로. 작은 수에만 쓴다. */
function factorize(v: bigint): bigint[] {
  const out: bigint[] = [];
  let x = v;
  for (let p = 2n; p * p <= x; p += p === 2n ? 1n : 2n) {
    while (x % p === 0n) {
      out.push(p);
      x /= p;
    }
  }
  if (x > 1n) out.push(x);
  return out;
}

const isPrimeQuiet = (n: bigint): boolean => {
  const save = ops;
  const r = isPrimeCounted(n);
  ops = save;
  return r;
};

/** `from` 위에서 처음 나오는, `p - 1` 의 소인수가 전부 `limit` 이하인 소수. */
export function smoothPrime(from: bigint, limit: bigint): bigint {
  for (let x = from | 1n; ; x += 2n) {
    if (!isPrimeQuiet(x)) continue;
    if (factorize(x - 1n).every((p) => p <= limit)) return x;
  }
}

/** `from` 위에서 처음 나오는, `(p - 1) / 2` 도 소수인 소수. */
export function safePrime(from: bigint): bigint {
  for (let x = from | 1n; ; x += 2n) {
    if (!isPrimeQuiet(x)) continue;
    if (isPrimeQuiet((x - 1n) / 2n)) return x;
  }
}

export const SMOOTH_P = smoothPrime(FROM, 200n);
export const SAFE_P = safePrime(FROM);
export const SMOOTH_N = SMOOTH_P * Q;
export const SAFE_N = SAFE_P * Q;

/** 두 설계가 낸 값이 정본의 답과 함께 실제 약수인지 확인한다. */
function 약수인가(): void {
  for (const n of [WALK, SMOOTH_N, SAFE_N]) {
    for (const d of [pollardRho(n), countRho(n).d, countTwoStage(n).d]) {
      if (n % d !== 0n || d <= 1n || d >= n) {
        throw new Error(`${n} 에서 ${d} 는 비자명한 약수가 아니다`);
      }
    }
  }
}
약수인가();

/**
 * `10^12` 규모에서 총 기본 연산을 가장 작게 만드는 한계.
 *
 * 두 가족을 함께 재서 고른다 — 한쪽만 보면 매끄러운 쪽에서는 한계가 클수록 좋고 안전
 * 소수 쪽에서는 작을수록 좋아 값이 정해지지 않는다.
 */
export function bestBound(limits: number[]): { limit: number; ops: number } {
  let best = { limit: 0, ops: Number.MAX_SAFE_INTEGER };
  for (const limit of limits) {
    const total =
      countTwoStage(SMOOTH_N, limit).ops + countTwoStage(SAFE_N, limit).ops;
    if (total < best.ops) best = { limit, ops: total };
  }
  return best;
}

export const cases = {
  "폴라드 로": () => {
    // 로 절차가 동시에 들고 있는 스칼라는 c·x·y·d 넷이다.
    const walk = countRho(WALK);
    const smooth = countRho(SMOOTH_N);
    const safe = countRho(SAFE_N);
    return {
      "전개 입력 8,051 기본 연산": walk.ops,
      "매끄러운 p 기본 연산": smooth.ops,
      "안전 소수 p 기본 연산": safe.ops,
      "갈리는 부분이 동시에 들고 있는 스칼라 칸": 4,
      "고를 값의 개수": 0,
    };
  },
  "p-1 을 앞에 세운 두 단계 판": () => {
    // p-1 단계는 a·j·g 셋을, 로 단계는 c·x·y·d 넷을 들고 있어 동시 최대는 넷이다.
    // 대신 한계 B 라는 고를 값이 하나 더 있다.
    const walk = countTwoStage(WALK);
    const smooth = countTwoStage(SMOOTH_N);
    const safe = countTwoStage(SAFE_N);
    return {
      "전개 입력 8,051 기본 연산": walk.ops,
      "매끄러운 p 기본 연산": smooth.ops,
      "안전 소수 p 기본 연산": safe.ops,
      "갈리는 부분이 동시에 들고 있는 스칼라 칸": 4,
      "고를 값의 개수": 1,
    };
  },
};
