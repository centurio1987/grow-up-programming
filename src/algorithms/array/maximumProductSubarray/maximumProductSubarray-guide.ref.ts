/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/maximumProductSubarray/maximumProductSubarray.ts` 는 학습자
 * 스텁이라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 자리를
 * 각각 하나씩 바꾼다 — 최댓값을 정하는 줄 · 최솟값을 정하는 줄(둘로 나뉜다) · 반환 줄.
 * 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 정수 배열 `A` 에서 **비어 있지 않은 연속 부분 배열**의 곱 중 최댓값을 돌려준다.
 *
 * 곱셈은 음수를 곱할 때 대소 관계를 뒤집으므로, 칸마다 최댓값 하나만 이어받으면 다음 칸에서
 * 최댓값이 될 수 있는 큰 음수를 잃는다. 그래서 최솟값을 함께 이어받는다.
 * 배열의 길이는 1 이상이라고 본다.
 */
export function maximumProductSubarray(A: number[]): number {
  // ① 세 값을 첫 칸의 값으로 시작한다 — 빈 부분 배열이 후보가 아니라서 1 이나 0 에서
  //    출발하지 않는다. curMax 와 curMin 은 칸 0 에서 끝나는 곱의 최댓값과 최솟값이고,
  //    best 는 지금까지 본 최댓값이다.
  let curMax = A[0] as number;
  let curMin = A[0] as number;
  let best = A[0] as number;

  for (let i = 1; i < A.length; i++) {
    // ② 순회할 칸이 남았는가 — 남아 있으면 아래를 한 번 실행한다.
    const x = A[i] as number;
    // ③ 이어 붙이는 후보 둘을 갱신 전에 만들어 둔다. 아래 두 줄이 같은 후보 셋을 본다.
    const grown = curMax * x;
    const flipped = curMin * x;
    // ④ 칸 i 에서 끝나는 곱의 최댓값과 최솟값을 같은 후보 셋에서 함께 정한다.
    curMax = Math.max(x, grown, flipped);
    curMin = Math.min(x, grown, flipped);
    // ⑤ 지금까지 본 최댓값을 갱신한다. curMax 를 먼저 고친 뒤라 칸 i 의 값이 후보에 들어간다.
    best = Math.max(best, curMax);
  }

  return best;
}
