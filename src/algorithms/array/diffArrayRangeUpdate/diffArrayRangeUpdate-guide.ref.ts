/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 취소
 * 이벤트를 적는 줄 하나를 지우거나 바꾼다. 맞는 줄이 정확히 하나가 아니면 던지므로,
 * 그 식을 주석에 다시 적지 않는다.
 */

/**
 * 길이 `N` 의 제로 배열에 구간 덧셈 `updates` 를 모두 적용한 결과 배열을 돌려준다.
 *
 * 각 갱신 `[l, r, v]` 는 인덱스 `l` 부터 `r` 까지 양끝을 포함해 `v` 를 더한다. `v` 는 음수일
 * 수 있고, 갱신 목록이 비면 모든 칸이 `0` 인 배열이 나온다.
 */
export function diffArrayRangeUpdate(
  N: number,
  updates: Array<[number, number, number]>,
): number[] {
  // 갱신을 결과 배열에 바로 반영하지 않고 경계 두 칸에만 적어 두는 차분 배열.
  // 칸이 N+1 개인 것은 오른쪽 끝이 N−1 인 갱신이 마지막 칸에 취소를 적기 때문이다.
  const D = new Array<number>(N + 1).fill(0);

  for (const [l, r, v] of updates) {
    // ① 처리할 갱신이 남았는가 — 남아 있으면 아래 두 줄을 한 번 실행한다.
    // ② 시작 이벤트 — 인덱스 l 부터 v 가 더해진다.
    D[l] = (D[l] as number) + v;
    // ③ 취소 이벤트 — 인덱스 r+1 부터 그 v 가 없어진다.
    D[r + 1] = (D[r + 1] as number) - v;
  }

  const A = new Array<number>(N);
  let running = 0;
  for (let i = 0; i < N; i++) {
    // ④ 복원할 칸이 남았는가 — 앞에서부터 누적한 값이 인덱스 i 의 최종 값이다.
    running += D[i] as number;
    A[i] = running;
  }

  return A;
}
