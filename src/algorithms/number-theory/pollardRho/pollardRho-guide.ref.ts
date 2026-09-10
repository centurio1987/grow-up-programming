/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/pollardRho/pollardRho.ts` 는 학습자가 채우는 자리라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **무작위가 없다.** 시작값 `X0` 과 첫 상수 `C0` 이 상수로 박혀 있고, 실패하면 `c` 를 1 씩
 * 올린다. 같은 `n` 을 두 번 넣으면 반환값도 걸음 수도 같다 — 본문이 내미는 값이 실행마다
 * 흔들리면 `check-proof` 가 통과하지 못한다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 줄을
 * 각각 바꾼다 — 소수 판정 한 줄과 `d !== n` 검사 한 줄. 맞는 줄이 정확히 하나가 아니면
 * 던지므로, 그 두 식을 주석에 다시 적지 않는다.
 *
 * **`bigint` 를 쓰는 이유는 계약에 있다.** `n` 이 `2^64` 규모까지 오는데 `(t * t + c) % n`
 * 의 곱이 `n^2` 규모라 `2^128` 까지 자란다. 배정밀도 실수가 정수를 오차 없이 담는 범위는
 * `2^53 - 1` 이라 `number` 로는 그 곱을 담을 수 없다.
 */

/** 결정론적 소수 판정에 쓰는 밑 열둘 — 처음 열두 소수다. */
const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/** 수열의 시작값. 이 값과 `C0` 이 이 절차의 씨앗 전부다. */
const X0 = 2n;

/** 첫 상수. 이 상수로 못 찾으면 1 씩 올려 다른 수열을 만든다. */
const C0 = 1n;

/** 유클리드 호제법. 두 인자는 음이 아니고 `b` 는 `n` 이라 언제나 양수다. */
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

/** `base` 의 `exp` 제곱을 법 `mod` 에서 구한다 — `fastPower` 편의 절차를 그대로 쓴다. */
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

/**
 * 밑 열둘을 고정한 밀러-라빈 판정 — `millerRabin` 편의 절차를 부품으로 그대로 쓴다.
 *
 * `n < 2^64` 에서 확정 판정이다. 여기서는 「비자명한 약수가 아예 없는 입력」을 걸러 내는
 * 자리에만 쓴다.
 */
function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const a of BASES) {
    if (n === a) return true;
    if (n % a === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1;
  }
  for (const a of BASES) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let witness = true;
    for (let i = 1; i < s; i++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    if (witness) return false;
  }
  return true;
}

/**
 * `n` 의 약수 하나를 돌려준다 — 합성수이면 `1 < d < n`, 소수이면 `n` 자신.
 *
 * `n >= 2` 를 받는다. 반환값은 언제나 `n` 의 약수이고, 그 값이 소수라는 보장은 없다.
 */
export function pollardRho(n: bigint): bigint {
  // ① 짝수는 2 가 곧 답이다. 아래 수열은 홀수만 다룬다.
  if (n % 2n === 0n) return 2n;

  // ② 소수에는 비자명한 약수가 없다. 이 줄이 없으면 소수 입력에서 절차가 끝나지 않는다.
  if (isPrime(n)) return n;

  for (let c = C0; ; c += 1n) {
    // ③ 상수 c 하나가 수열 하나를 정한다. 두 자리를 같은 값에서 출발시킨다.
    const f = (t: bigint): bigint => (t * t + c) % n;
    let x = X0;
    let y = X0;
    // ④ 계산이 아니라 의도적인 초기화다. gcd(0, n) 이 n 이라 계산해 넣으면 루프 조건이
    //    처음부터 거짓이 된다.
    let d = 1n;

    while (d === 1n) {
      // ⑤ 느린 자리는 한 걸음, 빠른 자리는 두 걸음 나아간다.
      x = f(x);
      y = f(f(y));
      // ⑥ 두 자리의 차와 n 의 최대공약수. mod p 에서 겹치면 여기서 p 의 배수가 나온다.
      d = gcd(x > y ? x - y : y - x, n);
    }

    // ⑦ 1 도 n 도 아니면 비자명한 약수다.
    if (d !== n) return d;

    // ⑧ d = n 이면 이 c 로는 못 찾는다. 다음 c 가 다른 수열을 만든다.
  }
}
