/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/millerRabin/millerRabin.test.ts` 는 학습자가 채우는
 * 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를
 * 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(메르센 소수 `2^61 − 1`)은 아래에서 반환값으로 확인하고, 같은 자리에서 이 편이
 * 세는 계수(모듈러 곱셈 2,892 기본 연산)가 상수 시간 안에 끝나는 크기라는 것도 함께 본다.
 *
 * **두 번째 판정기로 시행 나눗셈을 쓴다.** 정본이 스스로를 근거로 통과하는 것을 막으려면
 * 다른 절차의 답과 맞춰야 한다. 시행 나눗셈은 `10^7` 안쪽에서 실용적이라 그 범위를 전수로
 * 대조하고, 그 밖은 알려진 값과 성질로 확인한다.
 */
import { expect, test } from "bun:test";
import { millerRabin } from "./millerRabin-guide.ref.ts";

/** 정의를 그대로 옮긴 판정. 답의 기준이 된다. */
function isPrimeByTrial(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

test("작은 소수를 모두 판별한다", () => {
  const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n];
  for (const p of primes) expect(millerRabin(p)).toBe(true);
});

test("작은 합성수를 모두 판별한다", () => {
  const composites = [4n, 6n, 8n, 9n, 15n, 21n, 25n, 27n, 33n, 35n];
  for (const c of composites) expect(millerRabin(c)).toBe(false);
});

test("큰 소수 — 10^9 + 7", () => {
  expect(millerRabin(1_000_000_007n)).toBe(true);
});

test("큰 소수 — 998,244,353 (NTT 소수)", () => {
  expect(millerRabin(998_244_353n)).toBe(true);
});

test("큰 합성수 — 10^9", () => {
  expect(millerRabin(1_000_000_000n)).toBe(false);
});

test("561 은 카마이클 수이고 합성수다", () => {
  expect(millerRabin(561n)).toBe(false);
  expect(561n).toBe(3n * 11n * 17n);
});

test("1,105 도 카마이클 수이고 합성수다", () => {
  expect(millerRabin(1_105n)).toBe(false);
  expect(1_105n).toBe(5n * 13n * 17n);
});

test("0 과 1 은 소수가 아니고 2 는 소수다", () => {
  expect(millerRabin(0n)).toBe(false);
  expect(millerRabin(1n)).toBe(false);
  expect(millerRabin(2n)).toBe(true);
});

test("메르센 소수 2^31 − 1 은 소수이고 2^31 은 합성수다", () => {
  expect(millerRabin((1n << 31n) - 1n)).toBe(true);
  expect(millerRabin(1n << 31n)).toBe(false);
});

test("2^64 아래 가장 큰 소수 18,446,744,073,709,551,557", () => {
  expect(millerRabin(18_446_744_073_709_551_557n)).toBe(true);
});

test("2^64 − 1 은 합성수다", () => {
  const n = (1n << 64n) - 1n;
  expect(millerRabin(n)).toBe(false);
  // 3 · 5 · 17 · 257 · 641 · 65537 · 6700417 로 갈라진다 — 가장 작은 소인수가 3 이라
  // ② 가 두 번째 나눗셈에서 답한다.
  expect(n % 3n).toBe(0n);
});

test("원본 성능 케이스와 같은 입력 — 메르센 소수 2^61 − 1", () => {
  expect(millerRabin((1n << 61n) - 1n)).toBe(true);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(millerRabin(49_141n)).toBe(false);
  expect(49_141n).toBe(157n * 313n);
});

test("0 부터 20,000 까지 시행 나눗셈과 답이 전부 같다", () => {
  for (let v = 0; v <= 20_000; v++) {
    expect(millerRabin(BigInt(v))).toBe(isPrimeByTrial(v));
  }
});

test("음수는 소수가 아니다", () => {
  for (const v of [-1n, -2n, -7n, -1_000_000_007n]) {
    expect(millerRabin(v)).toBe(false);
  }
});

test("밑 목록의 소수 자신과 그 제곱을 가른다", () => {
  const bases = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const a of bases) {
    expect(millerRabin(a)).toBe(true);
    expect(millerRabin(a * a)).toBe(false);
  }
});

test("밑 열둘로는 안 잡히는 수가 계약 범위 안에 없다는 것의 두 근거", () => {
  // 밑 열하나를 통과하는 가장 작은 합성수는 2^64 안쪽이라 열하나로는 모자란다.
  const psi11 = 3_825_123_056_546_413_051n;
  expect(psi11 < 1n << 64n).toBe(true);
  expect(psi11).toBe(747_451n * 149_491n * 34_233_211n);
  expect(millerRabin(psi11)).toBe(false);

  // 밑 열둘을 통과하는 가장 작은 합성수는 2^64 의 17,000 배가 넘어 계약 밖이다.
  const psi12 = 318_665_857_834_031_151_167_461n;
  expect(psi12 > 1n << 64n).toBe(true);
  expect(psi12).toBe(399_165_290_221n * 798_330_580_441n);
});

test("작은 밑 목록에 속는 수들을 정본은 합성수로 판정한다", () => {
  // 밑 하나 · 둘 · 셋을 통과하는 가장 작은 홀 합성수.
  for (const [n, factors] of [
    [2_047n, [23n, 89n]],
    [1_373_653n, [829n, 1_657n]],
    [25_326_001n, [2_251n, 11_251n]],
  ] as [bigint, bigint[]][]) {
    expect(millerRabin(n)).toBe(false);
    expect(factors.reduce((a, b) => a * b, 1n)).toBe(n);
  }
});

test("소수 계수 — 10^6 아래 소수 개수가 78,498 이다", () => {
  // 소수 정리가 주는 알려진 값과 맞춘다. 시행 나눗셈이 아니라 체로 센다.
  const limit = 1_000_000;
  const sieve = new Uint8Array(limit + 1).fill(1);
  sieve[0] = 0;
  sieve[1] = 0;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i] === 0) continue;
    for (let j = i * i; j <= limit; j += i) sieve[j] = 0;
  }
  let count = 0;
  for (let i = 2; i <= limit; i++) if (sieve[i] === 1) count += 1;
  expect(count).toBe(78_498);

  // 그 체와 정본이 마지막 1,000 개 자리에서 같은 답을 낸다.
  for (let i = limit - 1_000; i <= limit; i++) {
    expect(millerRabin(BigInt(i))).toBe(sieve[i] === 1);
  }
});

test("페르마의 소정리 — 소수 p 에서 2^(p−1) ≡ 1 (mod p)", () => {
  const modPow = (b: bigint, e: bigint, m: bigint): bigint => {
    let r = 1n % m;
    let x = b % m;
    let k = e;
    while (k > 0n) {
      if ((k & 1n) === 1n) r = (r * x) % m;
      x = (x * x) % m;
      k >>= 1n;
    }
    return r;
  };
  for (const p of [1_000_000_007n, 998_244_353n, (1n << 61n) - 1n]) {
    expect(millerRabin(p)).toBe(true);
    expect(modPow(2n, p - 1n, p)).toBe(1n);
  }
});
