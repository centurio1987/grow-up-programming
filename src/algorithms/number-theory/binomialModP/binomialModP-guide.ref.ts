/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/binomialModP/binomialModP.ts` 는 학습자가 채우는
 * 자리라 가이드가 그대로 인용할 수 없다. 본문의 전체 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **`bigint` 로 받는다.** 계약이 그렇고, 법이 `10^9 + 7` 규모일 때 두 나머지의 곱이
 * `10^18` 을 넘어 배정밀도 부동소수점의 안전 정수 범위 밖으로 나간다.
 *
 * **역원을 따로 부르지 않고 이 파일 안에서 구한다.** 거듭제곱을 반으로 접는 절차 자체는
 * 선행 가이드(`fastPower`)의 것이지만, 다른 편의 정본을 부르면 이 편의 변이가 그쪽 파일의
 * 줄 모양에 매이게 된다. 변이는 이 파일 원문에서 기계로 만든다
 * (`tools/check-proof.ts` 의 `loadMutant`) — 아래 세 자리가 각각 정확히 한 줄이다.
 *
 * - 자릿수를 떼어 낼지 판정하는 줄의 오른쪽을 키우면, 자릿수를 안 떼어 내 분자가 `p` 의
 *   배수가 된다.
 * - 페르마 지수를 하나 올리면 역원 대신 1 이 나온다.
 * - 분모를 갱신하는 줄에서 1 을 더하지 않으면 첫 반복에서 분모가 0 이 된다.
 */

/**
 * 이항 계수 `C(n, k)` 를 소수 `p` 로 나눈 나머지를 돌려준다.
 *
 * `k` 가 `[0, n]` 밖이면 0 이고, `k` 가 0 이거나 `n` 이면 1 이다. `n` 은 `p` 보다 커도
 * 되며, 반환값은 언제나 `[0, p)` 안이다.
 */
export function binomialModP(n: bigint, k: bigint, p: bigint): bigint {
  // ① 경계를 먼저 거른다. 범위 밖이면 0 이고 양 끝이면 1 이다.
  if (k < 0n || k > n) return 0n;
  if (k === 0n || k === n) return 1n;

  // ② n 이 p 이상이면 가장 낮은 자리 하나를 떼어 내고 남은 자리는 같은 문제로 넘긴다.
  if (n >= p) {
    return (binomialModP(n % p, k % p, p) * binomialModP(n / p, k / p, p)) % p;
  }

  // ③ 대칭성으로 반복 횟수를 작은 쪽에 맞춘다.
  const j = n - k < k ? n - k : k;

  // ④ 분자와 분모를 한 반복문에서 함께 모은다. 여기까지 오면 n < p 라 둘 다 p 의 배수가
  //    아니다.
  let num = 1n;
  let den = 1n;
  for (let i = 0n; i < j; i++) {
    num = (num * (n - i)) % p;
    den = (den * (i + 1n)) % p;
  }

  // ⑤ 분모의 역원을 페르마의 소정리로 구해 분자에 곱한다. 지수를 반으로 접어 올리므로
  //    곱셈이 지수의 비트 수에 비례한다.
  let inv = 1n;
  let b = den;
  let e = p - 2n;
  while (e > 0n) {
    if ((e & 1n) === 1n) inv = (inv * b) % p;
    b = (b * b) % p;
    e >>= 1n;
  }
  return (num * inv) % p;
}
