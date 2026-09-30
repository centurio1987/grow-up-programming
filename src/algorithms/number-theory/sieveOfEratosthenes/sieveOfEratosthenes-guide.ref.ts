/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes.ts` 는 학습자
 * 스텁이라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 코드 줄
 * 하나씩을 바꾸거나 뺀다 — 지워진 수를 건너뛰는 줄 · 안쪽 루프(시작값 · 간격) · 수집 루프
 * (시작값 · 상한). 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 같은 모양으로
 * 다시 적지 않는다.
 */

/**
 * `n` 이하의 소수를 오름차순으로 담은 배열을 돌려준다.
 *
 * `n` 이 2 보다 작으면 빈 배열이다(이 과제의 규약).
 */
export function sieveOfEratosthenes(n: number): number[] {
  // ① 소수가 하나도 없는 상한을 먼저 따로 처리한다 — 가장 작은 소수가 2 다.
  if (n < 2) return [];

  // isComposite[k] 가 참이면 k 를 합성수로 지웠다는 뜻이다. 처음에는 아무 칸도 지우지 않았다.
  const isComposite = new Array<boolean>(n + 1).fill(false);

  for (let i = 2; i * i <= n; i++) {
    // ② 아직 지워지지 않은 i 는 소수다. 지워졌으면 건너뛴다 — i 의 배수는
    //    i 의 가장 작은 소인수가 이미 전부 지웠다.
    if (isComposite[i]) continue;
    // ③ 소수 i 의 배수를 i 의 제곱부터 i 간격으로 지운다.
    for (let j = i * i; j <= n; j += i) isComposite[j] = true;
  }

  // ④ 2 부터 n 까지 중 지워지지 않은 칸을 오름차순으로 모은다.
  const primes: number[] = [];
  for (let k = 2; k <= n; k++) if (!isComposite[k]) primes.push(k);
  return primes;
}
