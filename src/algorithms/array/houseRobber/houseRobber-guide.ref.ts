/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/houseRobber/houseRobber.ts` 는 학습자 스텁이라 가이드가 그대로
 * 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 자리를
 * 각각 하나씩 바꾼다 — 집 하나를 고른 답을 만드는 줄 · 두 값을 한 칸씩 옮기는 줄. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 각 집의 현금 `nums` 에서 **인접한 두 집을 함께 고르지 않는다**는 조건 아래, 고른 집의 값을
 * 더한 합 중 최댓값을 돌려준다.
 *
 * 집 하나를 고르면 그 옆집이 후보에서 빠지므로, 집 `i` 를 정할 때 필요한 과거는 「집 `i−1`
 * 까지의 답」과 「집 `i−2` 까지의 답」 둘이다. 집을 한 채도 안 고르는 것도 후보라서 답은
 * 언제나 0 이상이다.
 */
export function houseRobber(nums: number[]): number {
  // ① 집이 하나도 없으면 답이 0 이다 — 아래에서 첫 칸을 읽기 전에 막는다.
  if (nums.length === 0) return 0;

  // ② 두 값을 시작값으로 둔다. prev 는 집 0 을 넣기 전까지의 답이라 0 이고, cur 는 집 0
  //    까지의 답이라 첫 집의 값이다.
  let prev = 0;
  let cur = nums[0] as number;

  for (let i = 1; i < nums.length; i++) {
    // ③ 순회할 집이 남았는가 — 남아 있으면 아래를 한 번 실행한다.
    // ④ 집 i 를 건너뛴 답과 집 i 를 고른 답을 각각 만든다. 고른 쪽은 옆집을 뺀 답에서
    //    이어받으므로 cur 가 아니라 prev 를 쓴다.
    const skip = cur;
    const take = prev + (nums[i] as number);
    // ⑤ 두 값을 한 칸씩 옮긴다. prev 가 먼저 옛 cur 를 받아야 다음 걸음에서 두 칸 앞이 된다.
    prev = cur;
    cur = Math.max(skip, take);
  }

  return cur;
}
