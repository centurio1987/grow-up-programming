/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 곳을
 * 바꾼다 — 빈 누적합을 미리 세어 두는 줄 하나와 개수 맵에 개수를 더하는 줄 하나다. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 두 식을 주석에 다시 적지 않는다.
 */

/**
 * 합이 정확히 `k` 인 연속 부분 배열의 개수를 돌려준다.
 *
 * 원소는 음수를 포함할 수 있고 `k` 도 음수일 수 있다. 배열이 비면 0 이다.
 */
export function subarraySumEqualsK(nums: number[], k: number): number {
  // 개수 맵 — 지금까지 지나온 누적합을 키로, 그 값이 나온 횟수를 값으로 담는다.
  const seen = new Map<number, number>();
  // 원소를 하나도 더하지 않은 누적합 P[0] 은 0 이다. 그 한 번을 미리 세어 둔다.
  seen.set(0, 1);

  let prefix = 0;
  let answer = 0;
  for (const value of nums) {
    prefix += value;
    // ① 조회 — 지금 누적합에서 k 를 뺀 값이 앞에 몇 번 나왔는지 그대로 더한다.
    answer += seen.get(prefix - k) ?? 0;
    // ② 기록 — 이번 누적합의 개수를 하나 늘린다.
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }

  return answer;
}
