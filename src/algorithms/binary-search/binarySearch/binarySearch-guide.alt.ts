/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts binarySearch-guide.alt.ts
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `[1, 3, 5, 7, 9, 11]` 여섯 칸을 쓰는데, 값 여섯
 * 개로는 「값이 고르게 놓였는가」를 말할 수 없다. 이 대조가 갈리는 축이 바로 그것이라
 * 같은 길이의 배열 두 벌을 규칙으로 만들어 쓴다. **난수를 쓰지 않으므로 시드가 없다** —
 * 아래 두 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

/** 값이 고르게 놓인 배열. `A[i] = 2i`, `i = 0 … 1023`. */
export const UNIFORM: number[] = Array.from({ length: 1024 }, (_, i) => i * 2);

/** 앞쪽이 촘촘하고 뒤로 갈수록 벌어지는 배열. `A[i] = i²`, `i = 0 … 1023`. */
export const SKEWED: number[] = Array.from({ length: 1024 }, (_, i) => i * i);

/** 두 설계가 나눠 쓰는 질의 — 각 배열의 **모든 원소**를 한 번씩 찾는다. */
const queries = (A: number[]): number[] => A;

/** 정본과 같은 절차. 읽은 칸 수만 덧붙여 센다. */
function binaryReads(A: number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  let reads = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    reads++;
    if (A[mid] === target) return reads;
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  return reads;
}

/**
 * 경쟁 설계 — **보간 탐색**.
 *
 * 같은 목표(정렬된 배열에서 값 하나 찾기)를 노리고 절차가 다르다. 가운데를 읽는 대신
 * `target` 이 `A[lo]` 와 `A[hi]` 사이 어디쯤인지를 비례식으로 계산해 그 자리를 읽는다.
 * 값이 고르게 놓인 배열에서는 한 번에 맞히고, 값이 한쪽으로 몰린 배열에서는 한 칸씩 밀린다.
 */
function interpolationReads(A: number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  let reads = 0;
  while (
    lo <= hi &&
    target >= (A[lo] as number) &&
    target <= (A[hi] as number)
  ) {
    const span = (A[hi] as number) - (A[lo] as number);
    const pos =
      span === 0
        ? lo
        : lo +
          Math.floor(
            (((target - (A[lo] as number)) * (hi - lo)) as number) / span,
          );
    reads++;
    if (A[pos] === target) return reads;
    if ((A[pos] as number) < target) lo = pos + 1;
    else hi = pos - 1;
  }
  return reads;
}

function tally(
  A: number[],
  search: (a: number[], t: number) => number,
): { 합: number; 최악: number } {
  const counts = queries(A).map((t) => search(A, t));
  return {
    합: counts.reduce((a, b) => a + b, 0),
    최악: Math.max(...counts),
  };
}

function counts(
  search: (a: number[], t: number) => number,
): Record<string, number> {
  const uniform = tally(UNIFORM, search);
  const skewed = tally(SKEWED, search);
  return {
    "균등 입력 읽은 칸 합": uniform.합,
    "균등 입력 최악": uniform.최악,
    "편향 입력 읽은 칸 합": skewed.합,
    "편향 입력 최악": skewed.최악,
  };
}

export const cases = {
  "이진 탐색": () => counts(binaryReads),
  "보간 탐색": () => counts(interpolationReads),
};
