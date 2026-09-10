/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 계수를 실측하는 하네스 — `L13`.
 *
 * 재는 것은 **기본 연산 수**와 **저장 칸 수** 둘이다. 기본 연산은 `n` 크기의 두 수를 곱하거나
 * 나누는 것 하나를 1 로 센다 — 모듈러 곱셈 `(x * y) % n` 은 곱 하나와 나머지 하나라 2 이고,
 * 사전 나눗셈 `n % p` 는 1 이다. 두 설계가 같은 단위를 쓰고, 같은 입력에서 늘 같은 값이
 * 나오는 결정론적 계수다 — 벽시계는 안 잰다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/millerRabin/millerRabin-guide.alt.ts
 *
 * **경쟁 설계는 두 단계 판이다.** 작은 소수 표로 먼저 나눠 보고, 거기서 안 걸린 것만 같은
 * 밑 열둘 판정으로 넘긴다. 정본도 밑 열둘로 나눠 보므로 갈리는 것은 **표 크기 하나**이고,
 * 그것이 실제 라이브러리가 비트 수에 맞춰 조정하는 값이다(OpenSSL 의 `calc_trial_divisions`).
 * 표 크기는 아래 `bestTableSize` 가 `10^18` 규모에서 실측으로 고른 **54**(251 까지)다.
 *
 * **입력을 왜 전개 입력만으로 안 두는가.** 전개가 쓰는 `n` 은 49,141 이라 두 설계가 37 대
 * 120 으로 갈린 채 끝나고, 갈리는 축(사전 나눗셈이 아끼는 거듭제곱 대 그 나눗셈 자신의
 * 값)이 `n` 의 비트 수에 붙어 있어 규모를 올려야 순서가 뒤집히는 자리가 나타난다. 그래서
 * 전개 입력을 한 줄로 그대로 두고, 계약 상한 `2^64` 까지 규모를 올린 작업 묶음을 더한다.
 * 묶음은 **`10^e + 1` 부터 연속한 홀수 2,000 개**라는 생성식 하나이고 난수가 없다.
 *
 * **답을 대조하지 않은 계수는 저울질이 아니다.** `verdictsAgree` 가 매 실행마다 두 설계와
 * 정본(`*.ref.ts`)의 답을 맞춰 본다. 답이 다른 구현으로 잰 값은 다른 문제의 값이다.
 */
import { millerRabin } from "./millerRabin-guide.ref.ts";

/** 전개 절이 쓰는 입력. `49,141 = 157 × 313` 이고 밑 2 의 강한 유사소수다. */
export const WALK = 49_141n;

/** 정본이 쓰는 밑 목록 — 처음 열두 소수. */
export const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/** 작업 묶음의 크기. 생성식은 `10^e + 1` 부터 이만큼의 연속한 홀수다. */
export const WORKLOAD = 2_000;

/** 경쟁 설계의 사전 나눗셈 표 크기 — 처음 이만큼의 소수를 쓴다. */
export const TABLE_SIZE = 54;

/** `limit` 미만의 소수를 오름차순으로. 표와 스윕이 함께 쓴다. */
function primesBelow(limit: number): bigint[] {
  const flag = new Uint8Array(limit).fill(1);
  flag[0] = 0;
  flag[1] = 0;
  for (let i = 2; i * i < limit; i++) {
    if (flag[i] === 0) continue;
    for (let j = i * i; j < limit; j += i) flag[j] = 0;
  }
  const out: bigint[] = [];
  for (let i = 2; i < limit; i++) if (flag[i] === 1) out.push(BigInt(i));
  return out;
}

/** 스윕이 쓸 수 있는 소수 전부. 표 크기를 120 까지 재 보므로 넉넉히 잡는다. */
const PRIMES = primesBelow(2_000);

/** 경쟁 설계의 표에 실제로 들어가는 마지막 소수. */
export const TABLE_LAST = PRIMES[TABLE_SIZE - 1] as bigint;

/* ─────────────────────────── 계수기 ─────────────────────────── */

interface Counter {
  ops: number;
  mul(a: bigint, b: bigint, m: bigint): bigint;
  rem(a: bigint, b: bigint): bigint;
}

function counter(): Counter {
  return {
    ops: 0,
    mul(a, b, m) {
      this.ops += 2;
      return (a * b) % m;
    },
    rem(a, b) {
      this.ops += 1;
      return a % b;
    },
  };
}

/**
 * 사전 나눗셈을 지난 뒤의 밑 열둘 판정 — 두 설계가 **글자 그대로 같은 것**을 쓴다.
 *
 * 정본과 같은 절차에 계수만 덧붙인 사본이다. 판정이 맞는지는 정본이 지고
 * (`verdictsAgree` 가 매 실행 대조한다) 여기서는 계수만 낸다.
 */
function twelveBases(n: bigint, c: Counter): boolean {
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1;
  }
  for (const a of BASES) {
    let result = 1n % n;
    let b = a % n;
    let e = d;
    while (e > 0n) {
      if ((e & 1n) === 1n) result = c.mul(result, b, n);
      b = c.mul(b, b, n);
      e >>= 1n;
    }
    let x = result;
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let i = 1; i < s; i++) {
      x = c.mul(x, x, n);
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    if (witness) return false;
  }
  return true;
}

/** 사전 나눗셈 표를 `size` 개로 잡은 판. `size = 12` 가 정본과 같은 절차다. */
function sieved(n: bigint, size: number): { ops: number; result: boolean } {
  const c = counter();
  if (n < 2n) return { ops: c.ops, result: false };
  for (const p of PRIMES.slice(0, size)) {
    if (n === p) return { ops: c.ops, result: true };
    if (c.rem(n, p) === 0n) return { ops: c.ops, result: false };
  }
  // 판정을 먼저 끝내고 계수를 읽는다 — 객체 리터럴은 위 칸부터 계산하므로 `ops` 를 먼저
  // 적으면 밑 열둘이 쓴 연산이 통째로 빠진다.
  const result = twelveBases(n, c);
  return { ops: c.ops, result };
}

/** 정본과 같은 절차 — 사전 나눗셈이 밑 목록 열둘 그대로다. */
export function ourOps(n: bigint): { ops: number; result: boolean } {
  return sieved(n, BASES.length);
}

/** 경쟁 설계 — 사전 나눗셈 표를 `TABLE_SIZE` 개로 키운 두 단계 판. */
export function altOps(n: bigint): { ops: number; result: boolean } {
  return sieved(n, TABLE_SIZE);
}

/** 정본이 동시에 들고 있는 칸 — 밑 열둘과 `n`·`d`·`s`·`a`·`x`·`i` 다. */
export const OUR_CELLS = BASES.length;

/** 경쟁 판이 들고 있는 칸 — 밑 열둘이 표에 흡수되고 표가 그만큼 커진다. */
export const ALT_CELLS = TABLE_SIZE;

/* ────────────────────── 작업 묶음과 규모 스윕 ────────────────────── */

/** `10^e + 1` 부터 연속한 홀수 `WORKLOAD` 개. 난수가 없는 생성식 하나다. */
export function workload(e: number): bigint[] {
  const start = 10n ** BigInt(e) + 1n;
  const out: bigint[] = [];
  for (let i = 0n; i < BigInt(WORKLOAD); i += 1n) out.push(start + 2n * i);
  return out;
}

/** 그 묶음을 표 크기 `size` 로 처리했을 때의 총 기본 연산. */
export function workloadOps(e: number, size: number): number {
  let total = 0;
  for (const n of workload(e)) total += sieved(n, size).ops;
  return total;
}

/**
 * 규모를 올리며 두 설계의 순서가 처음 뒤집히는 자릿수를 찾는다.
 *
 * `10^4` 부터 `10^18` 까지 재고, 뒤집힌 뒤로 다시 돌아오는 자리가 없다는 것도 함께 본다 —
 * 계수가 요동치면 「첫 자리」가 뜻을 잃기 때문이다(`isPrimeTrial` 이 겪은 자리다).
 */
export function flipScale(): { at: number; stable: boolean } {
  let at = -1;
  for (let e = 4; e <= 18; e++) {
    const ahead = workloadOps(e, TABLE_SIZE) < workloadOps(e, BASES.length);
    if (ahead && at < 0) at = e;
    if (!ahead && at >= 0) return { at, stable: false };
  }
  return { at, stable: at >= 0 };
}

/** 그 규모에서 작업 묶음의 총 연산을 가장 작게 만드는 표 크기. */
export function bestTableSize(e: number): number {
  let best = BASES.length;
  let least = workloadOps(e, BASES.length);
  for (let size = BASES.length + 1; size <= 120; size++) {
    const ops = workloadOps(e, size);
    if (ops < least) {
      least = ops;
      best = size;
    }
  }
  return best;
}

/** 표의 `index` 번째 소수(1 부터 센다). 본문이 「54 번째 소수는 251」 을 적을 때 쓴다. */
export function nthPrime(index: number): bigint {
  return PRIMES[index - 1] as bigint;
}

/** 그 소수가 표에서 몇 번째인가. 「가장 작은 소인수」 표가 쓴다. */
export function primeIndex(p: bigint): number {
  return PRIMES.findIndex((q) => q === p) + 1;
}

/** `n` 이상인 첫 소수. 정본으로 판정한다. */
export function nextPrimeFrom(n: bigint): bigint {
  let x = n % 2n === 0n ? n + 1n : n;
  while (!millerRabin(x)) x += 2n;
  return x;
}

/** 가장 작은 소인수가 `p` 이고 크기가 `10^e` 근방인 합성수를 만든다. */
export function compositeWithLeastFactor(p: bigint, e: number): bigint {
  return p * nextPrimeFrom(10n ** BigInt(e) / p);
}

/* ─────────────────────────── 실측 계수 ─────────────────────────── */

const MERSENNE61 = (1n << 61n) - 1n;

export const cases = {
  "밑 열둘 고정 판정": () => ({
    "전개 입력 n=49,141 기본 연산": ourOps(WALK).ops,
    "메르센 소수 2^61-1 기본 연산": ourOps(MERSENNE61).ops,
    "10^9 묶음 총 기본 연산": workloadOps(9, BASES.length),
    "10^10 묶음 총 기본 연산": workloadOps(10, BASES.length),
    "10^18 묶음 총 기본 연산": workloadOps(18, BASES.length),
    "저장 칸": OUR_CELLS,
  }),
  "소수 54 개 사전 나눗셈": () => ({
    "전개 입력 n=49,141 기본 연산": altOps(WALK).ops,
    "메르센 소수 2^61-1 기본 연산": altOps(MERSENNE61).ops,
    "10^9 묶음 총 기본 연산": workloadOps(9, TABLE_SIZE),
    "10^10 묶음 총 기본 연산": workloadOps(10, TABLE_SIZE),
    "10^18 묶음 총 기본 연산": workloadOps(18, TABLE_SIZE),
    "저장 칸": ALT_CELLS,
  }),
};

/**
 * 두 설계와 정본이 같은 답을 내는가 — 대조가 같은 문제를 재고 있다는 것의 근거다.
 *
 * 작은 입력은 전수로 보고, 큰 입력은 작업 묶음 넷을 그대로 다시 판정한다. 배정밀도로 잰
 * 계수가 생략 판정의 근거가 됐던 `digitDp` 의 실패가 이 대조를 규칙으로 만들었다.
 */
export function verdictsAgree(): boolean {
  for (let v = 0n; v <= 5_000n; v += 1n) {
    const truth = millerRabin(v);
    if (ourOps(v).result !== truth) return false;
    if (altOps(v).result !== truth) return false;
  }
  for (const e of [9, 10, 18]) {
    for (const n of workload(e)) {
      const truth = millerRabin(n);
      if (ourOps(n).result !== truth) return false;
      if (altOps(n).result !== truth) return false;
    }
  }
  return true;
}
