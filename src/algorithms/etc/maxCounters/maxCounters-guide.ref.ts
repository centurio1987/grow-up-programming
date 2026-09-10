/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/etc/maxCounters/maxCounters.ts` 는 학습자가 고쳐 쓰는 자리라 가이드가
 * 그것을 인용하지 않는다. 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 곳을
 * 따로 바꾼다 — 증가 갈래의 출발점을 정하는 줄 · 마지막 채우기가 적는 값 · 최대 맞추기가
 * 바닥값을 정하는 줄이다. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 세 줄과 같은 문자열을
 * 다른 자리(주석 포함)에 다시 적지 않는다.
 */

/**
 * 카운터 `N` 개에 연산 배열 `A` 를 순서대로 적용한 뒤의 최종 값 배열.
 *
 * `A[k]` 가 `1` 이상 `N` 이하이면 그 번호의 카운터를 1 증가시키고, `N + 1` 이면 모든 카운터를
 * 그 시점의 최댓값으로 맞춘다. 두 번째 연산을 배열에 즉시 적지 않고 **바닥값 하나**로 적어
 * 두는 것이 이 구현의 전부다.
 */
export function maxCounters(N: number, A: number[]): number[] {
  const counter = new Array<number>(N).fill(0);
  // 마지막 최대 맞추기가 정한 값. 이 값보다 작은 저장값은 아직 옛 값이다.
  let base = 0;
  // 지금까지 어떤 카운터가 가진 가장 큰 값.
  let high = 0;

  for (let k = 0; k < A.length; k++) {
    const op = A[k] as number;

    if (op === N + 1) {
      // ② 최대 맞추기 — 카운터 배열을 건드리지 않고 바닥값만 옮긴다.
      base = high;
      continue;
    }

    // ① 증가 — 저장값이 바닥값보다 작으면 바닥값을 출발점으로 삼는다.
    const i = op - 1;
    const from = (counter[i] as number) < base ? base : (counter[i] as number);
    counter[i] = from + 1;
    if (from + 1 > high) high = from + 1;
  }

  for (let i = 0; i < N; i++) {
    // ③ 마지막 채우기 — 바닥값에 못 미치는 칸에만 바닥값을 적는다.
    if ((counter[i] as number) >= base) continue;
    counter[i] = base;
  }

  return counter;
}
