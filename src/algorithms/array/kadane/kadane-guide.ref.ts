/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/kadane/kadane.ts` 는 학습자 스텁이라 가이드가 그대로 인용할 수
 * 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와 재실행
 * 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 줄을
 * 각각 하나씩 바꾼다 — 두 갈래를 고르는 줄 · 두 번째 상태의 초기값 줄 · 반환 줄. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 식들을 주석에 다시 적지 않는다.
 */

/**
 * 정수 배열 `A` 에서 **비어 있지 않은 연속 부분 배열**의 합 중 최댓값을 돌려준다.
 *
 * 빈 부분 배열은 후보가 아니므로 모든 원소가 음수인 배열에서는 가장 큰 원소 하나가 답이 된다.
 * 배열의 길이는 1 이상이라고 본다.
 */
export function kadane(A: number[]): number {
  // ① 두 상태를 첫 원소로 시작한다 — 빈 부분 배열이 후보가 아니라서 0 에서 출발하지 않는다.
  //    prev 는 칸 0 에서 끝나는 최대합이고, best 는 지금까지 본 최대합이다.
  let prev = A[0] as number;
  let best = A[0] as number;

  for (let i = 1; i < A.length; i++) {
    // ② 순회할 칸이 남았는가 — 남아 있으면 아래 두 줄을 한 번 실행한다.
    // ③ 새로 시작하기(A[i] 하나)와 이어 붙이기(직전 최대합에 A[i] 를 더한 것) 중 큰 쪽이
    //    칸 i 에서 끝나는 최대합이다.
    prev = Math.max(A[i] as number, prev + (A[i] as number));
    // ④ 지금까지 본 최댓값을 갱신한다. prev 를 먼저 고친 뒤라 칸 i 의 값이 후보에 들어간다.
    best = Math.max(best, prev);
  }

  return best;
}
