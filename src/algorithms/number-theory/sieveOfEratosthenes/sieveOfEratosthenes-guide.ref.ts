/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes.ts` 는 학습자
 * 스텁이라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 줄을
 * 각각 하나씩 바꾼다 — 안쪽 루프의 시작값 · 안쪽 루프의 간격 · 수집 루프의 시작값 ·
 * 수집 루프의 상한. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로
 * 다시 적지 않는다.
 */

/**
 * `n` 이하의 소수를 오름차순으로 담은 배열을 돌려준다.
 *
 * `n` 이 2 보다 작으면 빈 배열이다(문제의 규약).
 */
export function sieveOfEratosthenes(n: number): number[] {
  // ① 소수가 하나도 없는 상한을 먼저 따로 처리한다 — 가장 작은 소수가 2 다.
  if (n < 2) return [];

  // isComposite[k] 가 참이면 k 는 합성수라고 이미 적어 둔 자리다. 처음에는 전부 거짓이다.
  const isComposite = new Array<boolean>(n + 1).fill(false);

  for (let i = 2; i * i <= n; i++) {
    // ② 아직 적히지 않은 i 는 소수다. 적혀 있으면 이 자리를 건너뛴다 — i 의 배수는
    //    i 의 소인수 중 가장 작은 것이 이미 전부 적었다.
    if (isComposite[i]) continue;
    // ③ i 의 배수를 i 의 제곱부터 i 간격으로 합성수라고 적는다.
    for (let j = i * i; j <= n; j += i) isComposite[j] = true;
  }

  // ④ 2 부터 n 까지 중 적히지 않은 자리를 오름차순으로 모은다.
  const primes: number[] = [];
  for (let k = 2; k <= n; k++) if (!isComposite[k]) primes.push(k);
  return primes;
}
