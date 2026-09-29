/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/twoSum/twoSum.ts` 는 학습자 스텁이라 가이드가 그대로 인용할 수
 * 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와 재실행
 * 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 곳을
 * 바꾼다 — 해시 맵을 조회하는 줄, 조회 결과를 검사하는 조건, 지금 원소를 적는 줄이다. 맞는
 * 줄이 정확히 하나가 아니면 던지므로, 그 세 식을 주석에 다시 적지 않는다.
 */

/**
 * 합이 `target` 인 두 원소의 인덱스 `[i, j]`(`i < j`)를 돌려준다.
 *
 * 앞에서부터 한 번 지나가며, 지금 원소와 짝이 될 값이 앞에 있었는지 해시 맵에서 조회한다.
 * 그런 짝이 없으면 오류를 던진다.
 */
export function twoSum(nums: number[], target: number): [number, number] {
  // 해시 맵에는 지금 원소보다 앞에 있는 원소만 들어 있다. 키는 원소의 값, 값은 그 값이
  // 마지막으로 나온 인덱스다.
  const seen = new Map<number, number>();
  for (let j = 0; j < nums.length; j++) {
    const x = nums[j] as number;
    const i = seen.get(target - x);
    if (i !== undefined) {
      // ① 짝을 찾음 — 앞에서 지나온 원소 가운데 보수가 있다.
      return [i, j];
    }
    // ② 짝이 없음 — 지금 원소를 적어 두고 다음 원소로 간다.
    seen.set(x, j);
  }
  throw new Error("합이 target 인 두 원소가 없다");
}
