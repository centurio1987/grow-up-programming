/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep.ts` 는 학습자
 * 스텁이라 `Not implemented` 를 던진다. 이 파일이 그 계약을 실제로 지키는 쪽이고, 가이드
 * 본문의 코드는 여기서 옮긴다.
 *
 * **가장 작은 해를 돌려주는 것이 계약이다.** 그래서 두 자리를 손본다 — ① `x = 0` 을 먼저
 * 확인하고 ② 아기 걸음 표에 같은 값이 여러 번 나오면 **큰 `j` 를 남긴다**(`x = i·n − j`
 * 이므로 `j` 가 클수록 `x` 가 작다).
 */

/** `⌈√m⌉` — bigint 라 `Math.sqrt` 를 쓸 수 없어 뉴턴법으로 구한다. */
export function ceilSqrt(m: bigint): bigint {
  if (m < 2n) return m;
  let x = m;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + m / x) / 2n;
  }
  return x * x === m ? x : x + 1n;
}

/** `base^exp mod m` — 지수를 이진 자리로 나눠 제곱을 되풀이한다. */
export function power(base: bigint, exp: bigint, m: bigint): bigint {
  let result = 1n;
  let b = base % m;
  let e = exp;
  while (e > 0n) {
    if (e % 2n === 1n) result = (result * b) % m;
    b = (b * b) % m;
    e /= 2n;
  }
  return result;
}

/** `a^x ≡ b (mod m)` 를 만족하는 가장 작은 `x ≥ 0`. 없으면 `-1n`. */
export function babyStepGiantStep(a: bigint, b: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;

  const A = ((a % m) + m) % m;
  const B = ((b % m) + m) % m;
  if (B === 1n) return 0n; // a^0 = 1 이라 x = 0 이 답이다

  const n = ceilSqrt(m);

  // 아기 걸음 — b·A^j 를 j = 0 … n-1 까지 적어 둔다.
  // 같은 값이 다시 나오면 덮어써서 **큰 j** 를 남긴다.
  const table = new Map<bigint, bigint>();
  let baby = B;
  for (let j = 0n; j < n; j++) {
    table.set(baby, j);
    baby = (baby * A) % m;
  }

  // 큰 걸음 — A^(i·n) 을 i = 1 … n 까지 만들며 표에 있는지 본다.
  const stride = power(A, n, m);
  let giant = 1n;
  for (let i = 1n; i <= n; i++) {
    giant = (giant * stride) % m;
    const j = table.get(giant);
    if (j !== undefined) {
      // ① 표에 있다 — a^(i·n) ≡ b·a^j 이므로 x = i·n − j
      return i * n - j;
    }
    // ② 표에 없다 — i 를 하나 늘려 다시 본다
  }

  return -1n; // 해가 없다
}
