/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean.ts` 는 학습자
 * 스텁이라 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로**
 * 같은 절차다 — 나머지 수열을 만들면서 같은 몫으로 계수 두 벌을 함께 갱신한다.
 *
 * **`bigint` 로 받는다.** 계약이 그렇고, 계수의 자릿수가 입력의 자릿수만큼 커질 수 있어
 * 고정폭 정수로는 계약을 못 지킨다 — 본문 「수식 정의와 유도」가 그 상한을 닫는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 계수 두 벌을 한 줄씩 나눠 대입하면 옛 값이 덮어써져 계수가 0 으로 남는다.
 * - `t` 갱신의 뺄셈을 덧셈으로 바꾸면 항등식이 깨진다.
 */

/**
 * 두 정수 `a`, `b` 에 대해 `a * x + b * y = g = gcd(a, b)` 를 만족하는 `{ g, x, y }` 를
 * 돌려준다. `g` 는 언제나 0 이상이고, 둘 다 0 이면 셋 다 0 이다.
 */
export function extendedEuclidean(
  a: bigint,
  b: bigint,
): { g: bigint; x: bigint; y: bigint } {
  // ① 부호를 따로 적어 두고 절댓값으로 시작한다. 계수 두 벌의 처음 값도 여기서 정한다.
  const signA = a < 0n ? -1n : 1n;
  const signB = b < 0n ? -1n : 1n;
  let r0 = a < 0n ? -a : a;
  let r1 = b < 0n ? -b : b;
  let s0 = 1n;
  let s1 = 0n;
  let t0 = 0n;
  let t1 = 1n;

  // ② 나머지를 만든 몫 q 로 계수 두 벌을 같은 식으로 갱신한다.
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
  }

  // ③ r1 이 0 이 된 순간의 r0 가 g 다. 절댓값으로 계산했으므로 계수에 부호를 다시 붙인다.
  if (r0 === 0n) return { g: 0n, x: 0n, y: 0n };
  return { g: r0, x: signA * s0, y: signB * t0 };
}
