/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram.ts` 는
 * 학습자 스텁이라 가이드가 그대로 인용할 수 없다. 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 곳을
 * 바꾼다 — 폭을 내는 줄 · 왼쪽 경계가 없을 때의 값 한 줄 · 꺼내는 조건의 부등호 한 줄 ·
 * 보초 걸음을 만드는 순회 범위 한 줄. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 네 식을
 * 주석에 다시 적지 않는다.
 */

/**
 * 히스토그램 막대 높이 배열을 받아 **막대들 안에 그릴 수 있는 가장 큰 직사각형의 넓이**를
 * 돌려준다. 막대의 너비는 모두 1 이다.
 *
 * 자리 `j` 를 높이로 삼는 직사각형은 두 경계 **사이**까지 넓어진다 — 오른쪽 경계는 `j` 보다
 * **엄격하게 낮은** 막대를 오른쪽에서 처음 만나는 자리이고, 왼쪽 경계는 `heights[j]` **이하**인
 * 막대를 왼쪽에서 처음 만나는 자리다. 부등호가 한쪽만 엄격한 것은 높이가 같은 막대가 이어질 때
 * 전체 폭을 받는 자리를 하나로 정하기 위해서다. 그 두 자리는 `j` 가 꺼내지는 순간 함께 정해진다.
 */
export function largestRectangleInHistogram(heights: number[]): number {
  const n = heights.length;
  // 오른쪽 경계가 아직 안 정해진 **자리**만 담는다. 높이가 아니라 자리다 — 폭을 재려면 몇
  // 번째 칸이었는지를 알아야 한다.
  const stack: number[] = [];
  let best = 0; // ① 넓이의 시작값. 높이가 전부 0 이면 이 값이 그대로 답이다

  for (let i = 0; i <= n; i++) {
    const cur = i === n ? 0 : (heights[i] ?? 0); // ② 마지막 한 바퀴는 높이 0 인 보초다
    while (stack.length > 0) {
      const top = stack[stack.length - 1] ?? 0;
      // ③ 꼭대기가 지금 높이보다 **엄격하게** 높을 때만 꺼낸다.
      if ((heights[top] ?? 0) <= cur) break;
      stack.pop();
      // 꺼낸 자리의 왼쪽 경계는 그 아래 남은 자리다. 통이 비면 왼쪽에 더 낮은 막대가 없다.
      const left = stack.length > 0 ? (stack[stack.length - 1] ?? 0) : -1;
      const width = i - left - 1; // ④ 두 경계 **사이**의 칸 수다
      const area = (heights[top] ?? 0) * width;
      if (area > best) best = area;
    }
    stack.push(i); // ⑤ 오른쪽 경계를 아직 못 받은 자리로 넣는다
  }

  return best; // ⑥ 보초 걸음이 남은 자리를 전부 꺼냈으므로 뒷정리가 없다
}
