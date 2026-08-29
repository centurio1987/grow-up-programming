/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts sortArray-guide.alt.ts
 *
 * **입력 셋을 쓰는 이유**(L20). 전개가 쓰는 `[5 2 4 1 2 6]` 도 그대로 넣지만, 여섯 칸에서는
 * 두 설계의 비교가 한 자릿수 차이라 계수가 상수에 묻힌다. 그래서 같은 길이의 배열 두 벌을
 * 규칙으로 만들어 함께 잰다. **난수를 쓰지 않으므로 시드가 없다** — 아래 두 생성식이 입력의
 * 전부이고, 그 식을 본문에도 적는다. 한 벌은 뒤섞인 입력, 한 벌은 이미 정렬된 입력이다.
 */

/** 전개가 쓰는 입력. 같은 값 `2` 가 두 자리에 있다. */
export const SIX = [5, 2, 4, 1, 2, 6];

/** 뒤섞인 입력. `A[i] = (37i) mod 64`, `i = 0 … 63`. 64 와 37 이 서로소라 재배열이 된다. */
export const SHUFFLED: number[] = Array.from(
  { length: 64 },
  (_, i) => (i * 37) % 64,
);

/** 이미 오름차순인 입력. `A[i] = i`, `i = 0 … 63`. */
export const SORTED: number[] = Array.from({ length: 64 }, (_, i) => i);

interface Counts {
  /** 두 값을 견준 횟수. */
  compares: number;
  /** 새로 잡은 배열 칸의 총합. 결과 배열과 중간 배열을 모두 센다. */
  cells: number;
}

/**
 * 이 가이드가 가르치는 절차 — **병합 정렬**. `sortArray-guide.ref.ts` 와 같은 절차이고
 * 계수만 덧붙였다. 반으로 갈라 각각 정렬한 다음 머리를 견주며 합친다.
 */
function mergeSortCounts(A: number[]): Counts {
  const c: Counts = { compares: 0, cells: 0 };
  const rec = (xs: number[]): number[] => {
    if (xs.length <= 1) {
      c.cells += xs.length;
      return xs.slice();
    }
    const mid = xs.length >> 1;
    c.cells += xs.length; // 두 조각으로 잘라 담은 칸
    const L = rec(xs.slice(0, mid));
    const R = rec(xs.slice(mid));
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < L.length && j < R.length) {
      c.compares++;
      if ((L[i] as number) <= (R[j] as number)) out.push(L[i++] as number);
      else out.push(R[j++] as number);
    }
    while (i < L.length) out.push(L[i++] as number);
    while (j < R.length) out.push(R[j++] as number);
    c.cells += out.length; // 합친 결과를 담은 칸
    return out;
  };
  rec(A);
  return c;
}

/**
 * 경쟁 설계 — **퀵 정렬**(마지막 값을 기준으로 삼는 로무토 분할).
 *
 * 같은 목표(정수 배열을 오름차순으로 정렬한 새 배열 돌려주기)를 노리고 절차가 다르다. 반으로
 * 가르지 않고 기준값 하나를 제자리에 놓아 구간을 둘로 나눈다. 원본을 지켜야 하므로 복사본
 * 하나를 잡고 그 위에서 자리를 맞바꾼다 — 그 뒤로는 새 칸을 잡지 않는다.
 */
function quickSortCounts(A: number[]): Counts {
  const c: Counts = { compares: 0, cells: 0 };
  const B = A.slice();
  c.cells += B.length; // 원본을 지키려고 잡는 복사본 하나

  const swap = (x: number, y: number): void => {
    const t = B[x] as number;
    B[x] = B[y] as number;
    B[y] = t;
  };

  const rec = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const pivot = B[hi] as number;
    let store = lo;
    for (let k = lo; k < hi; k++) {
      c.compares++;
      if ((B[k] as number) < pivot) {
        swap(k, store);
        store++;
      }
    }
    swap(store, hi);
    rec(lo, store - 1);
    rec(store + 1, hi);
  };

  rec(0, B.length - 1);
  return c;
}

function counts(sort: (A: number[]) => Counts): Record<string, number> {
  return {
    "여섯 칸 입력 비교": sort(SIX).compares,
    "뒤섞인 입력 비교": sort(SHUFFLED).compares,
    "정렬된 입력 비교": sort(SORTED).compares,
    "뒤섞인 입력 새로 잡는 칸": sort(SHUFFLED).cells,
  };
}

export const cases = {
  "병합 정렬": () => counts(mergeSortCounts),
  "퀵 정렬": () => counts(quickSortCounts),
};
