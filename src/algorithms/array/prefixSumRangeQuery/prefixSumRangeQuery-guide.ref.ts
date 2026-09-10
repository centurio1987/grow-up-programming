/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 곳을
 * 바꾼다 — 누적을 만드는 줄 하나와 오른쪽 끝을 읽는 줄 하나다. 맞는 줄이 정확히 하나가
 * 아니면 던지므로, 그 두 식을 주석에 다시 적지 않는다.
 */

/**
 * 정적 배열 `A` 에 대한 구간 합 질의를 입력 순서대로 답한다.
 *
 * 질의 `[l, r]` 은 양끝을 포함하는 인덱스 구간이고, `0 ≤ l ≤ r < A.length` 를 전제한다.
 * 질의 목록이 비면 빈 배열을 돌려준다.
 */
export function prefixSumRangeQuery(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  const n = A.length;
  // 표의 칸 `i` 에는 A 의 앞 `i` 개 원소의 합을 담는다. 칸이 n+1 개라 오른쪽 끝이
  // 배열의 마지막인 질의도 표 밖으로 나가지 않는다.
  const P = new Array<number>(n + 1);
  // 빈 구간의 합은 0 이다. 이 한 칸이 왼쪽 끝 0 을 특수한 경우로 가르지 않게 한다.
  P[0] = 0;

  for (let i = 0; i < n; i++) {
    // ① 전처리 — 직전 칸에 A[i] 를 한 번만 더해 다음 칸을 채운다.
    P[i + 1] = (P[i] as number) + (A[i] as number);
  }

  const result: number[] = [];
  for (const [l, r] of queries) {
    // ② 질의 — 저장해 둔 두 칸을 읽어 뺀다. 왼쪽 끝이 0 이어도 같은 식이다.
    result.push((P[r + 1] as number) - (P[l] as number));
  }

  return result;
}
