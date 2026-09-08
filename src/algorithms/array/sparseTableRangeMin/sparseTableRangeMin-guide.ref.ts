/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 곳을
 * 바꾼다 — 층마다 반복하는 범위를 정하는 줄 하나와, 아래층 오른쪽 조각의 자리를 정하는 줄
 * 하나다. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 두 식을 주석에 다시 적지 않는다.
 */

/**
 * 정적 배열 `A` 에 대한 구간 최솟값 질의를 입력 순서대로 답한다.
 *
 * 질의 `[l, r]` 은 양끝을 포함하는 인덱스 구간이고, `0 ≤ l ≤ r < A.length` 를 전제한다.
 * 질의 목록이 비면 빈 배열을 돌려준다.
 */
export function sparseTableRangeMin(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  const n = A.length;

  // 칸 수가 `m` 인 구간이 쓸 층 번호를 정수 연산만으로 미리 적어 둔다. 절반 자리의 값에
  // 1 을 더한 것이 그 자리의 값이다.
  const logTable = new Array<number>(n + 1).fill(0);
  for (let m = 2; m <= n; m++) {
    logTable[m] = (logTable[m >> 1] as number) + 1;
  }

  // 층 `k` 의 칸 `i` 에는 인덱스 구간 [i, i + 2^k − 1] 의 최솟값을 담는다. 0 층은 배열
  // 그대로이고, 위층은 아래층 두 칸에서 나온다.
  const st: number[][] = [A.slice()];
  for (let k = 1; k <= (logTable[n] as number); k++) {
    const below = st[k - 1] as number[];
    const width = 1 << k;
    const half = width >> 1;
    const row = new Array<number>(n - width + 1);
    for (let i = 0; i + width <= n; i++) {
      // ① 표 쌓기 — 아래층의 두 칸을 견줘 위층 한 칸을 정한다.
      row[i] = Math.min(below[i] as number, below[i + half] as number);
    }
    st.push(row);
  }

  const result: number[] = [];
  for (const [l, r] of queries) {
    // ② 질의 — 구간을 칸 수가 같은 두 조각으로 덮는다. 왼쪽 끝에서 한 조각, 오른쪽 끝에서
    // 한 조각이고 가운데가 겹쳐도 최솟값은 안 바뀐다.
    const k = logTable[r - l + 1] as number;
    const row = st[k] as number[];
    result.push(Math.min(row[l] as number, row[r - (1 << k) + 1] as number));
  }

  return result;
}
