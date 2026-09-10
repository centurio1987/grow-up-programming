/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/millerRabin/millerRabin.ts` 는 학습자가 채우는 자리라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 줄을
 * 각각 바꾼다 — 밑 목록 한 줄 · 첫 값 검사 한 줄 · 제곱 루프 안의 비교 한 줄. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 세 식을 주석에 다시 적지 않는다.
 *
 * **`bigint` 를 쓰는 이유는 계약에 있다.** `n` 이 `2^64` 까지 오는데 `(x * x) % n` 의 곱이
 * `n^2` 규모라 `2^127` 까지 자란다. 배정밀도 실수가 정수를 오차 없이 담는 범위는
 * `2^53 - 1` 이므로 `number` 로는 그 곱을 담을 수 없다.
 */

/**
 * 결정론적 판정에 쓰는 밑 열둘 — 처음 열두 소수다.
 *
 * 이 목록이 `n < 318665857834031151167461` 에서 오판을 내지 않는다는 것은 Sorenson 과
 * Webster 가 2015 년에 낸 결과다(arXiv:1509.00864, Theorem 1.1). 계약의 상한 `2^64` 는
 * 그 값의 1/17,275 이라 목록 안쪽이다.
 */
const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/**
 * `base` 의 `exp` 제곱을 법 `mod` 에서 구한다 — `fastPower` 편의 절차를 그대로 쓴다.
 *
 * 모듈러 곱셈을 `B(exp) + P(exp)` 번 한다. `B` 는 `exp` 의 이진 자릿수이고 `P` 는 그중
 * 1 인 자리의 개수다.
 */
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
 * `n` 이 소수이면 `true`, 아니면 `false`.
 *
 * `0 <= n < 2^64` 를 받는다. 이 범위에서 확률이 아니라 **확정 판정**이다 — 밑을 무작위로
 * 고르지 않고 위 목록으로 고정했고, 그 목록이 이 범위를 덮는다는 것이 확인돼 있다.
 */
export function millerRabin(n: bigint): boolean {
  // ① 소수의 정의가 2 이상을 요구한다. 음수와 0 과 1 이 이 한 줄에서 걸린다.
  if (n < 2n) return false;

  // ② 밑 목록의 소수 자신이면 소수이고, 그 소수로 나누어떨어지면 합성수다. 여기를 지나면
  //    n 은 37 보다 크고 밑 열둘과 서로소다.
  for (const a of BASES) {
    if (n === a) return true;
    if (n % a === 0n) return false;
  }

  // ③ n - 1 에서 2 를 모두 걷어 내 홀수 d 와 개수 s 를 얻는다.
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1;
  }

  for (const a of BASES) {
    // ④ 제곱 수열의 첫 값 a^d 를 구한다.
    let x = modPow(a, d, n);
    // ⑤ 첫 값이 1 이거나 n - 1 이면 이 밑은 n 을 합성수라고 말하지 않는다.
    if (x === 1n || x === n - 1n) continue;

    let witness = true;
    for (let i = 1; i < s; i++) {
      // ⑥ 제곱해 가며 n - 1 이 나오는지 본다.
      x = (x * x) % n;
      if (x === n - 1n) {
        witness = false;
        break;
      }
    }
    // ⑦ 끝까지 n - 1 이 안 나왔으면 이 밑이 증인이고 n 은 합성수다.
    if (witness) return false;
  }

  // ⑧ 밑 열둘이 하나도 증인이 아니다.
  return true;
}
