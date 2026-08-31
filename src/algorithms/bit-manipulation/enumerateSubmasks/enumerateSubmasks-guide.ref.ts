/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks.ts` 는 학습자가
 * 채우는 자리라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고,
 * 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로
 * `borrowed & mask` 한 줄을 바꾼다. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식을
 * 주석에 다시 적지 않는다.
 */

/**
 * `mask` 의 모든 서브마스크를 내림차순으로 담아 돌려준다.
 *
 * 서브마스크는 `(s & mask) === s` 를 만족하는 `s` 다. `mask` 의 1 비트 개수를 `k` 라 하면
 * 서브마스크는 정확히 `2 ** k` 개이고, 빈 집합 `0` 이 언제나 마지막 원소다.
 *
 * `mask` 는 0 이상이고 JavaScript 비트 연산이 32 비트 부호 있는 정수로 자르므로
 * `2 ** 31` 미만이라고 본다. 이 문제의 제약은 `2 ** 20` 까지라 그 안에 있다.
 */
export function enumerateSubmasks(mask: number): number[] {
  // ① mask 자신이 가장 큰 서브마스크다. 결과의 첫 칸에 두고 여기서 출발한다.
  const subMasks = [mask];
  let sub = mask;

  while (sub > 0) {
    // ② sub 가 0 보다 크면 그보다 작은 서브마스크가 적어도 하나 남아 있다.
    // ③ 1 을 빼면 sub 의 최하위 1 비트가 0 이 되고 그보다 아래 자리가 전부 1 이 된다.
    const borrowed = sub - 1;
    // ④ mask 에서 0 인 자리를 AND 로 지운다. 남은 값이 다음 서브마스크다.
    const next = borrowed & mask;
    // ⑤ 그 값을 결과에 담고 다음 바퀴의 sub 로 둔다.
    subMasks.push(next);
    sub = next;
  }

  return subMasks;
}
