/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../tools/bench-alt.ts quicksort-guide.alt.ts
 *
 * **왜 전개 입력을 안 쓰는가**(L20). `INPUT` 을 전개의 `[5, 2, 3, 1]` 로 바꿔 돌리면
 * 퀵 비교 4 · 병합 비교 5 다. 한 번 차이라 계수가 갈리지 않는다. 그래서 대조만 n=16 을
 * 쓰고, 그 사실을 본문에도 적는다.
 */

/** 두 설계가 나눠 쓰는 고정 입력. 손으로 고르되 한 번 정하면 바꾸지 않는다. */
export const INPUT = [
  23, 4, 91, 8, 15, 42, 7, 66, 30, 1, 58, 12, 77, 25, 3, 49,
];

interface Counts {
  비교: number;
  보조칸: number;
}

/** 정본과 같은 절차. 세는 것만 덧붙였다. */
function quickCounts(src: number[]): Counts {
  const a = [...src];
  let 비교 = 0;
  const sort = (lo: number, hi: number): void => {
    if (hi - lo < 1) return;
    const p = lo + Math.floor((hi - lo) / 2);
    [a[p], a[hi]] = [a[hi] as number, a[p] as number];
    const pivot = a[hi] as number;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      비교++;
      if ((a[j] as number) < pivot) {
        [a[i], a[j]] = [a[j] as number, a[i] as number];
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi] as number, a[i] as number];
    sort(lo, i - 1);
    sort(i + 1, hi);
  };
  sort(0, a.length - 1);
  // 제자리 정렬이라 새로 잡는 칸이 없다.
  return { 비교, 보조칸: 0 };
}

/**
 * 경쟁 설계 — 병합 정렬.
 *
 * 같은 목표(비교 기반 정렬)를 노리고, **최악에도 n log n 을 보장한다**는 점에서 오히려
 * 더 강한 약속을 한다. 그래서 "왜 퀵인가" 가 진짜 물음이 된다.
 */
function mergeCounts(src: number[]): Counts {
  let 비교 = 0;
  let 보조칸 = 0;
  const go = (xs: number[]): number[] => {
    if (xs.length < 2) return xs;
    const mid = xs.length >> 1;
    const left = go(xs.slice(0, mid));
    const right = go(xs.slice(mid));
    // merge 가 새로 잡는 칸. 이것이 퀵과 갈리는 자리다.
    보조칸 += xs.length;
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      비교++;
      out.push(
        (left[i] as number) <= (right[j] as number)
          ? (left[i++] as number)
          : (right[j++] as number),
      );
    }
    while (i < left.length) out.push(left[i++] as number);
    while (j < right.length) out.push(right[j++] as number);
    return out;
  };
  go([...src]);
  return { 비교, 보조칸 };
}

export const cases = {
  "퀵 정렬": () => quickCounts(INPUT) as unknown as Record<string, number>,
  "병합 정렬": () => mergeCounts(INPUT) as unknown as Record<string, number>,
};
