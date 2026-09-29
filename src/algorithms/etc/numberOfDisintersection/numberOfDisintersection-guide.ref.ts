/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection.ts` 는 학습자
 * 스텁이라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 곳을
 * 바꾼다 — 원판을 여는 조건의 비교 연산자 하나와, 쌍을 더하는 줄의 뺄셈 항 하나다. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 두 식을 주석에 다시 적지 않는다.
 */

/** 교차 쌍이 이 수를 넘으면 세기를 멈추고 −1 을 돌려준다. */
export const DEFAULT_LIMIT = 10_000_000;

/**
 * 중심이 `(j, 0)` 이고 반지름이 `A[j]` 인 원판들 가운데 서로 교차하는(경계 접촉 포함) 순서 없는
 * 쌍의 수를 센다. 그 수가 `limit` 을 넘으면 −1 을 돌려준다.
 */
export function countIntersectingDiscs(
  A: number[],
  limit = DEFAULT_LIMIT,
): number {
  const n = A.length;
  // 원판 j 는 수직선 위의 구간 [j − A[j], j + A[j]] 이다. 두 끝을 따로 모아 오름차순으로 둔다.
  const starts = A.map((r, j) => j - r).sort((a, b) => a - b);
  const ends = A.map((r, j) => j + r).sort((a, b) => a - b);

  let count = 0;
  let opened = 0;
  for (let i = 0; i < n; i++) {
    const end = ends[i] as number;
    while (opened < n && (starts[opened] as number) <= end) {
      // ① 열기 — 이 오른쪽 끝 이하에서 시작한 원판을 하나 더 센다.
      opened++;
    }
    // ② 세기 — 열린 원판에서 먼저 닫힌 i 개와 자기 자신을 뺀 나머지가 새로 만나는 원판이다.
    count += opened - (i + 1);
    if (count > limit) {
      // ③ 넘침 — 상한을 넘었으니 더 세지 않는다.
      return -1;
    }
  }
  return count;
}
