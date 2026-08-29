/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/advanced/minMaxPair/minMaxPair.ts` 는 학습자 스텁이라
 * `Not implemented` 를 던진다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 두 곳을
 * 따로 바꾼다 — 길이의 홀짝을 가르는 줄과, 작은 쪽을 `min` 과 대조하는 줄이다. 맞는 줄이
 * 정확히 하나가 아니면 던지므로, 그 두 줄과 같은 문자열을 다른 자리(주석 포함)에 다시
 * 적지 않는다.
 */

/**
 * 정수 배열의 최솟값과 최댓값을 함께 돌려준다.
 *
 * 원소를 둘씩 묶어 **쌍 안에서 먼저 한 번 비교**하고, 작은 쪽만 `min` 과 큰 쪽만 `max` 와
 * 대조한다. 길이 `n` 짜리 입력에 드는 비교는 `⌈3n/2⌉ − 2` 번이다.
 */
export function minMaxPair(arr: number[]): { min: number; max: number } {
  const n = arr.length;
  let min: number;
  let max: number;
  let i: number;

  if (n % 2 === 1) {
    // ① 홀수 길이 — 첫 원소 하나를 두 시작값으로 쓴다. 비교가 없다.
    min = arr[0] as number;
    max = arr[0] as number;
    i = 1;
  } else {
    // ② 짝수 길이 — 첫 두 원소를 한 번 비교해 두 시작값을 함께 정한다.
    if ((arr[0] as number) < (arr[1] as number)) {
      min = arr[0] as number;
      max = arr[1] as number;
    } else {
      min = arr[1] as number;
      max = arr[0] as number;
    }
    i = 2;
  }

  for (; i < n; i += 2) {
    const a = arr[i] as number;
    const b = arr[i + 1] as number;

    // ③ 쌍 안에서 작은 쪽과 큰 쪽을 가른다. 여기서 큰 쪽은 min 후보에서, 작은 쪽은
    //    max 후보에서 함께 빠진다.
    let lo: number;
    let hi: number;
    if (a < b) {
      lo = a;
      hi = b;
    } else {
      lo = b;
      hi = a;
    }

    // ④ 작은 쪽만 min 과, 큰 쪽만 max 와 대조한다. 쌍 하나에 비교 세 번이다.
    if (lo < min) min = lo;
    if (hi > max) max = hi;
  }

  return { min, max };
}
