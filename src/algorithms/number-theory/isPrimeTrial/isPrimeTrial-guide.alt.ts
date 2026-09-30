/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 계수를 실측하는 하네스 — `L13`.
 *
 * 재는 것은 **기본 연산 수**와 **저장 칸 수** 둘이다. 기본 연산은 본문 전체와 같은 단위다 — 나머지 연산
 * (나눗셈) 한 번 · 배열 칸 하나를 읽거나 쓰는 것 한 번을 각각 하나로 세고, 반복 변수를 올리고 비교하는 일은
 * 세지 않는다(체 편 `sieveOfEratosthenes-guide.md` 와 같은 단위). 두 설계 다 배열을 안 쓰므로 세는 것은
 * `%` 와 `/` 뿐이다. 둘 다 같은 입력에서 늘 같은 값이 나오는 결정론적 계수다 — 벽시계는 안 잰다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.alt.ts
 *
 * **입력을 왜 전개 입력만으로 안 두는가.** 전개가 쓰는 `n` 은 187 이라 후보가 셋뿐이고, 두
 * 설계가 갈리는 축이 「후보 수가 `√n` 에 비례해 늘어나는 것 대 밑마다 거듭제곱 한 번」이라
 * `n` 이 작으면 그 축이 거의 안 벌어진다. 그래서 전개 입력을 그대로 한 줄로 두고, 과제 규모의
 * 상한 `10^12` 까지 규모를 올린 소수들을 더한다. 입력은 **각 규모의 가장 큰 소수**
 * 하나로 정하는 생성식이고 난수가 없다 — 소수가 이 절차의 최악 입력이라 대조가 이쪽에
 * 유리하게 기울지 않는다.
 *
 * **2026-09-30 세는 단위를 바꿨다**(KAN-058 재집필). 옛 단위는 곱셈 한 번 · 나머지 연산 한 번이었고, 본문의
 * 다른 절은 나눗셈만 셌다. 원고 전체의 단위를 하나로 두면서 체 편과 같은 단위로 맞췄다. 입력은 그대로다.
 */

import { countRun, LARGEST_PRIME_AT } from "./isPrimeTrial-guide.fig.tsx";

/** 전개 절이 쓰는 입력. */
export const WALK = 187;

/**
 * 결정론적 밀러-라빈이 쓰는 밑 목록. `n` 이 커질수록 밑이 늘어난다.
 *
 * 이 표는 대조를 **밀러-라빈 쪽에 가장 유리하게** 잡은 것이다. 상한마다 알려진 가장 짧은
 * 밑 목록을 쓰므로, 아래 계수는 밀러-라빈이 낼 수 있는 가장 작은 값이다.
 */
export const MR_BASES: [bigint, bigint[]][] = [
  [2_047n, [2n]],
  [1_373_653n, [2n, 3n]],
  [25_326_001n, [2n, 3n, 5n]],
  [3_215_031_751n, [2n, 3n, 5n, 7n]],
  [2_152_302_898_747n, [2n, 3n, 5n, 7n, 11n]],
  [3_474_749_660_383n, [2n, 3n, 5n, 7n, 11n, 13n]],
  [341_550_071_728_321n, [2n, 3n, 5n, 7n, 11n, 13n, 17n]],
];

/** 그 `n` 을 확정 판정하는 데 쓰는 밑 목록. 표의 마지막 상한을 넘으면 던진다. */
export function basesFor(n: bigint): bigint[] {
  for (const [limit, bases] of MR_BASES) {
    if (n < limit) return bases;
  }
  throw new Error(
    `${n} 은 이 표가 덮는 상한 밖이다 — 확정 판정을 세울 수 없다`,
  );
}

/* ─────────────── 이 글의 절차 — √n 까지의 6k±1 시행 나눗셈 ─────────────── */

/**
 * 정본과 같은 절차의 기본 연산 — 나머지 연산 `n % 2` · `n % 3` · `n % d` 를 실행한 만큼. 루프 조건의 `d * d`
 * 는 비교하는 일이라 세지 않는다. 세는 사본은 그림 사이드카의 `countRun` 이고, 답은 거기서 정본과 대조한다.
 */
export function ourOps(n: number): { ops: number; result: boolean } {
  const c = countRun(n);
  return { ops: c.divisions, result: c.prime };
}

/** 이 절차가 동시에 들고 있는 칸(저장 칸, 입력 `n` 포함) — `n`·`d`·`step` 셋이다. 재지 않고 적은 개수다. */
export const OUR_CELLS = 3;

/* ─────────────── 경쟁 설계 — 결정론적 밀러-라빈 ─────────────── */

/**
 * 밑을 고정한 밀러-라빈. 상한마다 알려진 밑 목록을 쓰므로 그 상한 아래에서는 확률이 아니라
 * **확정 판정**이다.
 *
 * 기본 연산은 이 절차가 실행하는 `%` 와 `/` 를 한 번씩 센다 — 모듈러 곱셈 `(a * b) % n` 은 나머지 연산 한
 * 번이고, `n - 1` 을 `r · 2^s` 로 가르는 자리의 `r % 2` 와 `r / 2` 도 각각 센다. 곱셈과 비트 연산은 이 글의
 * 절차의 `d * d` 처럼 세지 않는다. `r / 2` 를 시프트로 바꾸는 구현이 흔하지만, 그렇게 하면 나눗셈을 세는
 * 이 글의 단위와 어긋나므로 나눗셈으로 둔다.
 */
export interface MillerCount {
  readonly ops: number;
  readonly result: boolean;
  /** `n - 1` 을 `r · 2^s` 로 가르는 데 든 기본 연산. */
  readonly split: number;
  /** 밑마다 든 기본 연산 — 밑 목록 순서. 판정이 도중에 끝나면 거기까지만. */
  readonly perBase: readonly number[];
}

export function millerOps(value: number): MillerCount {
  const n = BigInt(value);
  let ops = 0;
  let split = 0;
  const perBase: number[] = [];
  const out = (result: boolean): MillerCount => ({
    ops,
    result,
    split,
    perBase,
  });
  if (n < 2n) return out(false);
  if (n === 2n) return out(true);
  ops += 1; // n % 2
  if (n % 2n === 0n) return out(false);

  // n - 1 = r · 2^s
  let r = n - 1n;
  let s = 0n;
  for (;;) {
    ops += 1; // r % 2
    if (r % 2n !== 0n) break;
    ops += 1; // r / 2
    r /= 2n;
    s += 1n;
  }
  split = ops - 1;

  const modMul = (a: bigint, b: bigint): bigint => {
    ops += 1; // (a * b) % n
    return (a * b) % n;
  };
  const modPow = (base: bigint, exp: bigint): bigint => {
    let acc = 1n;
    ops += 1; // base % n
    let b = base % n;
    let e = exp;
    while (e > 0n) {
      if ((e & 1n) === 1n) acc = modMul(acc, b);
      b = modMul(b, b);
      e >>= 1n;
    }
    return acc;
  };

  for (const a of basesFor(n)) {
    const before = ops;
    const closeBase = () => perBase.push(ops - before);
    ops += 1; // a % n
    if (a % n === 0n) {
      closeBase();
      continue; // 밑이 n 의 배수면 이 밑으로는 판정할 수 없다
    }
    let x = modPow(a, r);
    if (x === 1n || x === n - 1n) {
      closeBase();
      continue;
    }
    let witness = true;
    for (let i = 1n; i < s; i++) {
      x = modMul(x, x);
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    closeBase();
    if (witness) return out(false);
  }
  return out(true);
}

/** 밀러-라빈 판이 들고 있는 칸(저장 칸, 입력 `n` 포함) — `n`·`r`·`s`·`a`·`x`·`i`·`witness` 일곱 + 밑 목록. 재지 않고 적은 개수다. */
export function millerCells(value: number): number {
  return 7 + basesFor(BigInt(value)).length;
}

/* ───────────────────────── 뒤집히는 자리 찾기 ───────────────────────── */

/** 소수인지 정직하게 확인한다 — 스윕이 쓰는 보조 함수다. */
function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

/** 뒤집히는 자리를 찾을 때 훑은 범위. 본문이 이 값을 그대로 적는다. */
export const SWEEP_LIMIT = 600_000;

/**
 * **이 절차가 마지막으로 적은 소수**를 찾는다 — 5 부터 `SWEEP_LIMIT` 까지 소수를 전부 잰다.
 *
 * 「뒤집히는 첫 자리」로 안 적는 것은 밀러-라빈의 계수가 단조롭지 않기 때문이다. 지수
 * `r` 의 비트 수와 1 인 비트 수가 `n` 마다 달라서 이웃한 두 소수의 계수가 오르내린다.
 * 마지막으로 앞선 자리는 그 요동에 안 흔들린다.
 *
 * 소수만 보는 것은 그것이 이 절차의 최악 입력이기 때문이다. 합성수는 이 절차가 도중에
 * 멈추므로 대조가 이쪽에 유리해진다.
 */
export function lastAhead(limit = SWEEP_LIMIT): number {
  let last = -1;
  for (let n = 5; n <= limit; n += 2) {
    if (!isPrime(n)) continue;
    if (ourOps(n).ops < millerOps(n).ops) last = n;
  }
  return last;
}

/** 그 다음 소수 — 순서가 뒤집힌 첫 자리다. */
export function nextPrime(n: number): number {
  for (let x = n + 2; ; x += 2) if (isPrime(x)) return x;
}

export const cases = {
  "√n 까지의 시행 나눗셈": () => {
    const last = lastAhead();
    return {
      "전개 입력 n=187 기본 연산": ourOps(WALK).ops,
      "n=997 기본 연산": ourOps(LARGEST_PRIME_AT["10^3"] as number).ops,
      "n=9,973 기본 연산": ourOps(LARGEST_PRIME_AT["10^4"] as number).ops,
      "n=999,983 기본 연산": ourOps(LARGEST_PRIME_AT["10^6"] as number).ops,
      "n=999,999,937 기본 연산": ourOps(LARGEST_PRIME_AT["10^9"] as number).ops,
      "n=999,999,999,989 기본 연산": ourOps(LARGEST_PRIME_AT["10^12"] as number)
        .ops,
      "마지막으로 앞선 소수": last,
      "그 다음 소수": nextPrime(last),
      "마지막으로 앞선 자리의 기본 연산": ourOps(last).ops,
      "그 다음 소수의 기본 연산": ourOps(nextPrime(last)).ops,
      "n=999,999,999,989 저장 칸": OUR_CELLS,
    };
  },
  "결정론적 밀러-라빈": () => {
    const last = lastAhead();
    return {
      "전개 입력 n=187 기본 연산": millerOps(WALK).ops,
      "n=997 기본 연산": millerOps(LARGEST_PRIME_AT["10^3"] as number).ops,
      "n=9,973 기본 연산": millerOps(LARGEST_PRIME_AT["10^4"] as number).ops,
      "n=999,983 기본 연산": millerOps(LARGEST_PRIME_AT["10^6"] as number).ops,
      "n=999,999,937 기본 연산": millerOps(LARGEST_PRIME_AT["10^9"] as number)
        .ops,
      "n=999,999,999,989 기본 연산": millerOps(
        LARGEST_PRIME_AT["10^12"] as number,
      ).ops,
      "마지막으로 앞선 자리의 기본 연산": millerOps(last).ops,
      "그 다음 소수의 기본 연산": millerOps(nextPrime(last)).ops,
      "n=999,999,999,989 저장 칸": millerCells(
        LARGEST_PRIME_AT["10^12"] as number,
      ),
    };
  },
};

/** 두 설계가 같은 답을 내는가 — 대조가 같은 문제를 재고 있다는 것의 근거다. */
export function verdictsAgree(): boolean {
  for (let n = 0; n <= 5_000; n++) {
    if (ourOps(n).result !== millerOps(n).result) return false;
    if (ourOps(n).result !== isPrime(n)) return false;
  }
  for (const n of Object.values(LARGEST_PRIME_AT)) {
    if (!ourOps(n).result || !millerOps(n).result) return false;
  }
  return true;
}
