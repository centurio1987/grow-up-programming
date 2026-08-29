/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum.ts` 는 학습자
 * 스텁이라 `Not implemented` 를 던진다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 곳을
 * 바꾼다 — 축소 루프의 조건 한 줄이 그 대상이다. 맞는 줄이 정확히 하나가 아니면 던지므로,
 * 그 조건식을 주석에 다시 적지 않는다.
 */

/**
 * 합이 `S` 이하인 연속 부분 배열 중 가장 긴 것의 길이. 그런 부분 배열이 없으면 `0`.
 *
 * `nums` 의 모든 원소가 비음의 정수라는 것을 전제한다.
 */
export function longestSubarrayAtMostSum(nums: number[], S: number): number {
  let best = 0;
  // 창 [l, r] 안의 값을 더한 것. 매번 다시 더하지 않고 증분으로 유지한다.
  let windowSum = 0;
  let l = 0;

  for (let r = 0; r < nums.length; r++) {
    // 오른쪽 끝을 한 칸 넓히고 새로 들어온 값을 창의 합에 더한다.
    windowSum += nums[r] as number;

    while (windowSum > S) {
      // ① 합이 상한을 넘는다 — 왼쪽 끝의 값을 빼고 l 을 한 칸 오른쪽으로 옮긴다.
      windowSum -= nums[l] as number;
      l++;
    }

    // ② 합이 상한 이하다 — 줄일 것이 없다. 지금 창의 길이가 답 후보다.
    best = Math.max(best, r - l + 1);
  }

  return best;
}
