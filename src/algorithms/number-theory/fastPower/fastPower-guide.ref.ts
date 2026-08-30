/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/fastPower/fastPower.ts` 는 학습자가 채우는 자리라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 밑을
 * 갱신하는 줄 하나를 바꾼다. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식을 주석에 다시
 * 적지 않는다.
 */

/**
 * `base` 의 `exp` 제곱을 법 `mod` 에서 구한다.
 *
 * `exp` 는 0 이상이고 `mod` 는 1 이상이라고 본다. `base` 는 음수여도 되고, 반환값은 언제나
 * `[0, mod)` 안이다. `exp` 가 0 이면 `1 % mod` 이므로 `mod` 가 1 일 때 0 이 나온다.
 */
export function fastPower(base: bigint, exp: bigint, mod: bigint): bigint {
  // ① 두 값을 법 안으로 옮기고 시작한다 — result 는 1 을 mod 로 나눈 나머지이고(mod 가 1
  //    이면 이 값이 0 이다), b 는 base 를 [0, mod) 로 옮긴 값이다.
  let result = 1n % mod;
  let b = ((base % mod) + mod) % mod;
  let e = exp;

  while (e > 0n) {
    // ② 아직 처리할 비트가 남았는가 — 남아 있으면 아래 세 줄을 한 번 실행한다.
    if ((e & 1n) === 1n) {
      // ③ 이번 비트가 1 이면 그 자리의 값을 result 에 곱해 둔다.
      result = (result * b) % mod;
    }
    // ④ 밑을 제곱해 다음 비트 자리의 값으로 만든다.
    b = (b * b) % mod;
    // ⑤ 지수를 오른쪽으로 한 칸 옮겨 다음 비트를 최하위로 보낸다.
    e >>= 1n;
  }

  return result;
}
