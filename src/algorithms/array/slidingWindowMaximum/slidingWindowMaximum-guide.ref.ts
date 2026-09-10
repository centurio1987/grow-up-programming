/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 본문의 코드는 이 파일에서 옮기고, 증명 사이드카
 * (`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 곳을
 * 바꾼다 — 맨 앞 후보를 버리는 줄 · 답을 적는 조건 한 줄 · 창을 벗어났는지 판정하는 부등호
 * 한 줄. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 세 식을 주석에 다시 적지 않는다.
 */

/**
 * 크기 `k` 인 창이 왼쪽에서 오른쪽으로 한 칸씩 이동할 때, 창마다의 최댓값을 순서대로 담은
 * 배열을 돌려준다. 결과의 길이는 `nums.length - k + 1` 이다.
 *
 * 후보 통 `cand` 에는 값이 아니라 **자리 번호**를 담는다. 자리 번호라야 창을 벗어났는지를
 * 판정할 수 있고, 통 안의 값은 앞에서 뒤로 커지지 않는다.
 */
export function slidingWindowMaximum(nums: number[], k: number): number[] {
  const n = nums.length;
  const result: number[] = []; // ① 창 하나에 답 하나. 길이가 n - k + 1 이 된다
  // 앞으로 답이 될 수 있는 **자리**만 담는다. 앞이 창의 왼쪽에 가깝고 뒤가 오른쪽에 가깝다.
  const cand: number[] = [];

  for (let i = 0; i < n; i++) {
    const cur = nums[i] ?? 0;
    // ② 창을 벗어난 맨 앞 후보를 버린다. 한 걸음에 많아야 하나다.
    if (cand.length > 0 && (cand[0] ?? 0) <= i - k) cand.shift();
    // ③ 지금 값보다 작은 뒤쪽 후보를 버린다. 값이 같으면 멈춘다.
    while (cand.length > 0 && (nums[cand[cand.length - 1] ?? 0] ?? 0) < cur) {
      cand.pop();
    }
    cand.push(i); // ④ 지금 자리를 뒤에 붙인다
    // ⑤ 창이 다 찼으면 맨 앞 후보의 값이 그 창의 답이다
    if (i >= k - 1) result.push(nums[cand[0] ?? 0] ?? 0);
  }

  return result;
}
