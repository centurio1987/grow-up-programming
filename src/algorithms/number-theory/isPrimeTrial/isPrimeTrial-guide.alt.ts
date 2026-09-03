/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 계수를 실측하는 하네스 — `L13`.
 *
 * 재는 것은 **기본 연산 수**와 **저장 칸 수** 둘이다. 기본 연산은 곱셈 · 나눗셈 · 나머지를
 * 각각 한 번으로 세고, 두 설계가 같은 단위를 쓴다. 둘 다 같은 입력에서 늘 같은 값이 나오는
 * 결정론적 계수다 — 벽시계는 안 잰다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/isPrimeTrial/isPrimeTrial-guide.alt.ts
 *
 * **입력을 왜 전개 입력만으로 안 두는가.** 전개가 쓰는 `n` 은 187 이라 후보가 셋뿐이고, 두
 * 설계가 갈리는 축이 「후보 수가 `√n` 에 비례해 늘어나는 것 대 밑마다 거듭제곱 한 번」이라
 * `n` 이 작으면 그 축이 거의 안 벌어진다. 그래서 전개 입력을 그대로 한 줄로 두고, 계약이
 * 권장하는 상한 `10^12` 까지 규모를 올린 소수들을 더한다. 입력은 **각 규모의 가장 큰 소수**
 * 하나로 정하는 생성식이고 난수가 없다 — 소수가 이 절차의 최악 입력이라 대조가 이쪽에
 * 유리하게 기울지 않는다.
 */

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
 * 정본과 같은 절차에 기본 연산 계수만 덧붙인 사본. 답이 맞는지는 정본이 지고
 * (`*.proof.ts` 가 정본을 부른다), 여기서는 계수만 낸다.
 *
 * 세는 자리는 셋이다 — 사전 판정의 나머지(`n % 2` 와 `n % 3` 을 각각 실행한 만큼), 루프
 * 조건의 곱셈 `d * d`, 루프 안의 나머지 `n % d`.
 */
export function ourOps(n: number): { ops: number; result: boolean } {
  let ops = 0;
  if (n < 2) return { ops, result: false };
  if (n === 2 || n === 3) return { ops, result: true };
  ops += 1; // n % 2
  if (n % 2 === 0) return { ops, result: false };
  ops += 1; // n % 3
  if (n % 3 === 0) return { ops, result: false };
  let d = 5;
  let step = 2;
  for (;;) {
    ops += 1; // d * d
    if (d * d > n) return { ops, result: true };
    ops += 1; // n % d
    if (n % d === 0) return { ops, result: false };
    d += step;
    step = 6 - step;
  }
}

/** 이 절차가 동시에 들고 있는 칸 — `n`·`d`·`step` 셋이다. */
export const OUR_CELLS = 3;

/* ─────────────── 경쟁 설계 — 결정론적 밀러-라빈 ─────────────── */

/**
 * 밑을 고정한 밀러-라빈. 상한마다 알려진 밑 목록을 쓰므로 그 상한 아래에서는 확률이 아니라
 * **확정 판정**이다.
 *
 * 기본 연산은 모듈러 곱셈 한 번을 둘(곱셈 하나 · 나머지 하나)로 세고, `n - 1` 을 `r · 2^s`
 * 로 가르는 자리도 나머지 하나와 나눗셈 하나로 함께 센다. 나눗셈을 시프트로 바꾸는 구현이
 * 흔하지만, 그렇게 하면 이 글의 절차가 쓰는 나머지 연산과 단위가 달라진다.
 */
export function millerOps(value: number): { ops: number; result: boolean } {
  const n = BigInt(value);
  let ops = 0;
  if (n < 2n) return { ops, result: false };
  if (n === 2n) return { ops, result: true };
  ops += 1; // n % 2
  if (n % 2n === 0n) return { ops, result: false };

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

  const modMul = (a: bigint, b: bigint): bigint => {
    ops += 2; // 곱셈 하나와 나머지 하나
    return (a * b) % n;
  };
  const modPow = (base: bigint, exp: bigint): bigint => {
    let acc = 1n;
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
    if (a % n === 0n) continue; // 밑이 n 의 배수면 이 밑으로는 판정할 수 없다
    let x = modPow(a, r);
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let i = 1n; i < s; i++) {
      x = modMul(x, x);
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    if (witness) return { ops, result: false };
  }
  return { ops, result: true };
}

/** 밀러-라빈 판이 들고 있는 칸 — `n`·`r`·`s`·`a`·`x`·`i`·`witness` 일곱 + 밑 목록. */
export function millerCells(value: number): number {
  return 7 + basesFor(BigInt(value)).length;
}

/* ───────────────────────── 뒤집히는 자리 찾기 ───────────────────────── */

/** 각 규모의 가장 큰 소수. 이 절차의 최악 입력이라 대조가 이쪽에 유리하지 않다. */
export const LARGEST_PRIME_AT: Record<string, number> = {
  "10^3": 997,
  "10^4": 9_973,
  "10^6": 999_983,
  "10^9": 999_999_937,
  "10^12": 999_999_999_989,
};

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
