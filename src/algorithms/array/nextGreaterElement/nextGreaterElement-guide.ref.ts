/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/nextGreaterElement/nextGreaterElement.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 본문의 코드는 이 파일에서 옮기고, 증명 사이드카
 * (`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 곳을
 * 바꾼다 — 꺼내기를 되풀이하는 줄 · 꺼내는 조건의 부등호 한 줄 · 답 없음을 깔아 두는 줄 ·
 * 꺼낸 자리에 무엇을 적는가 한 줄. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 네 식을
 * 주석에 다시 적지 않는다.
 */

/**
 * 각 자리에 대해 **오른쪽에서 처음 만나는 더 큰 값**을 담은 배열을 돌려준다.
 *
 * 「더 크다」는 엄격한 부등호다 — 같은 값은 답이 되지 않는다. 오른쪽에 더 큰 값이 없으면
 * 그 자리의 답은 `-1` 이고, 마지막 자리는 언제나 `-1` 이다.
 */
export function nextGreaterElement(nums: number[]): number[] {
  const n = nums.length;
  // 답이 없는 자리의 값을 미리 깔아 둔다. 순회가 끝나고 스택에 남은 자리가 이 값을 그대로 쓴다.
  const result = new Array<number>(n).fill(-1); // ① 답 없음을 초기값으로 깐다
  // 답이 아직 정해지지 않은 **자리**만 담는다. 값이 아니라 자리다 — 답을 적을 칸을 알아야 한다.
  const stack: number[] = [];

  for (let i = 0; i < n; i++) {
    const cur = nums[i] ?? 0;
    while (stack.length > 0) {
      const top = stack[stack.length - 1] ?? 0;
      // ② 꼭대기의 값이 지금 값보다 **엄격하게** 작을 때만 꺼낸다.
      if ((nums[top] ?? 0) >= cur) break;
      stack.pop();
      result[top] = cur; // ③ 꺼낸 자리의 답이 지금 값으로 정해진다
    }
    stack.push(i); // ④ 답이 아직 없는 자리로 넣는다
  }

  return result; // ⑤ 스택에 남은 자리는 ① 이 깔아 둔 -1 을 그대로 쓴다
}
