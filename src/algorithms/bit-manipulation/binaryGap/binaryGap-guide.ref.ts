/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/bit-manipulation/binaryGap/binaryGap.ts` 는 학습자 스텁이라 가이드가
 * 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 곳을
 * 바꾼다 — 한 자리 내리는 줄, 0 개수를 재는 식, 직전 1 이 있는지 보는 조건이다. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 세 식을 주석에 다시 적지 않는다.
 */

/**
 * 양의 정수 `n` 의 이진 표현에서 양쪽이 1 로 닫힌 0 구간 가운데 가장 긴 것의 길이를 돌려준다.
 * 그런 구간이 없으면 0 이다.
 */
export function binaryGap(n: number): number {
  let best = 0;
  let last = -1;
  let x = n;
  for (let i = 0; x !== 0; i++) {
    if ((x & 1) === 1) {
      if (last >= 0) {
        // ① 재기 — 직전 1 의 자리 last 와 지금 자리 i 사이에 0 이 i − last − 1 개 있다.
        best = Math.max(best, i - last - 1);
      }
      // ② 기억 — 지금 자리를 다음 1 이 재는 기준으로 둔다.
      last = i;
    }
    x >>>= 1;
  }
  return best;
}
