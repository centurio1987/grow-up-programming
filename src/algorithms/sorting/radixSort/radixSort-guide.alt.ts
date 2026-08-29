/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts radixSort-guide.alt.ts
 *
 * **입력 셋을 쓰는 이유**(L20). 전개가 쓰는 `[513 45 258 2 66 90 301]` 을 그대로 넣지만,
 * 일곱 칸에서는 자릿수 정렬의 비용이 거의 전부 `count` 의 칸 수 `B = 256` 에서 나와 두 설계의
 * 성질이 안 갈린다. 그래서 같은 생성식으로 만든 200 칸 · 100,000 칸을 함께 잰다.
 * **난수를 쓰지 않으므로 시드가 없다** — 생성식 `A[i] = (i × 999,983) mod (10^9 + 1)` 이
 * 입력의 전부이고, 그 식을 본문에도 적는다.
 *
 * 계수 셋의 정의를 여기서 못 박는다.
 *
 * - **배열 접근** — 배열 칸을 읽거나 쓴 횟수 전부. 두 설계가 쓰는 배열이 서로 달라
 *   (`count`·`src`·`dst` 대 복사본·보조 배열) 어느 한쪽만 빼면 대조가 성립하지 않는다.
 * - **견주기** — 배열의 두 값을 견준 횟수. 인덱스 판정(`i >= 0`)은 안 센다.
 * - **새로 잡는 칸** — 입력 말고 새로 만든 배열의 칸 수 합. 자릿수 정렬은 바퀴마다 `count` 를
 *   다시 만들므로 `2N + d·B` 이고, 병합 정렬은 복사본과 보조 배열로 `2N` 이다.
 */

/** 전개가 쓰는 입력. 최댓값이 513 이라 바퀴가 둘이다. */
export const WALK = [513, 45, 258, 2, 66, 90, 301];

/** 자리 하나가 담는 값의 가짓수. 값을 256 진법으로 본다. */
export const BASE = 256;

/** 값의 상한. 문제의 제약 `0 ≤ A[i] ≤ 10^9` 이 정한다. */
export const LIMIT = 1_000_000_001;

/** 난수 없는 생성식. `A[i] = (i × 999,983) mod (10^9 + 1)` 이라 값이 0 … 10^9 에 고루 놓인다. */
export const spread = (n: number): number[] =>
  Array.from({ length: n }, (_, t) => (t * 999_983) % LIMIT);

export interface Counts {
  /** 배열 칸을 읽거나 쓴 횟수. */
  access: number;
  /** 배열의 두 값을 견준 횟수. */
  compares: number;
  /** 입력 말고 새로 만든 배열의 칸 수 합. */
  cells: number;
  /** 바퀴 수. 병합 정렬은 0 으로 둔다 — 그쪽에는 자리라는 것이 없다. */
  passes: number;
  /** 정렬 결과. 두 설계가 같은 답을 내는지 확인하는 데 쓴다. */
  out: number[];
}

/**
 * 이 가이드가 가르치는 절차 — **자릿수 정렬**. `radixSort-guide.ref.ts` 와 같은 절차이고
 * 계수만 덧붙였다. 자리 하나가 담는 값의 가짓수 `base` 를 밖에서 받는 것만 다르다 — 정본은
 * 그 값이 256 으로 고정이라 `base` 를 바꿔 가며 잴 수 없다.
 */
export function radixCounts(A: number[], base: number = BASE): Counts {
  let access = 0;
  let src = [...A];
  let dst = new Array<number>(A.length).fill(0);
  access += 2 * A.length; // 사본 — 읽기 N + 쓰기 N
  access += A.length; // 쓰는 쪽 배열 초기화 — 쓰기 N

  let max = 0;
  for (const x of src) {
    access += 1; // 최댓값을 찾느라 한 번씩 읽는다
    if (x > max) max = x;
  }

  let passes = 0;
  for (let place = 1; Math.floor(max / place) > 0; place *= base) {
    passes++;
    const count = new Array<number>(base).fill(0);
    access += base; // ③ 초기화 — base 칸에 0 을 적는다

    for (const x of src) {
      access += 3; // src 읽기 · count 읽기 · count 쓰기
      const d = Math.floor(x / place) % base;
      count[d] = (count[d] as number) + 1;
    }

    for (let d = 1; d < base; d++) {
      access += 3; // ④ count[d] 읽기 · count[d-1] 읽기 · count[d] 쓰기
      count[d] = (count[d] as number) + (count[d - 1] as number);
    }

    for (let i = src.length - 1; i >= 0; i--) {
      access += 4; // ⑤ src 읽기 · count 읽기 · count 쓰기 · dst 쓰기
      const x = src[i] as number;
      const d = Math.floor(x / place) % base;
      count[d] = (count[d] as number) - 1;
      dst[count[d] as number] = x;
    }

    [src, dst] = [dst, src];
  }

  return {
    access,
    compares: 0,
    cells: 2 * A.length + passes * base,
    passes,
    out: src,
  };
}

/**
 * 경쟁 설계 — **병합 정렬**.
 *
 * 같은 목표(정수 배열을 오름차순으로 정렬한 새 배열 돌려주기)를 노리고 절차가 다르다. 값을
 * 자리로 쪼개지 않고 **두 값을 견주는 것만으로** 순서를 정한다. 그래서 값이 고정 폭 정수가
 * 아니어도, 견주기만 되는 값(문자열·객체)이어도 그대로 통한다.
 *
 * 위에서 아래로 반씩 가르고, 정렬된 두 구간을 보조 배열을 거쳐 합친다.
 */
export function mergeCounts(A: number[]): Counts {
  let access = 0;
  let compares = 0;

  const B = Array.from(A);
  access += 2 * A.length; // 복사 — 읽기 N + 쓰기 N
  const tmp = new Array<number>(A.length).fill(0);
  access += A.length; // 보조 배열 초기화

  const merge = (lo: number, mid: number, hi: number): void => {
    for (let t = lo; t <= hi; t++) {
      access += 2; // B[t] 읽기 + tmp[t] 쓰기
      tmp[t] = B[t] as number;
    }
    let p = lo;
    let q = mid + 1;
    for (let t = lo; t <= hi; t++) {
      if (p > mid) {
        access += 2; // tmp 읽기 + B 쓰기
        B[t] = tmp[q++] as number;
      } else if (q > hi) {
        access += 2;
        B[t] = tmp[p++] as number;
      } else {
        access += 2; // 견주기가 읽는 두 칸
        compares++;
        if ((tmp[q] as number) < (tmp[p] as number)) {
          access += 2;
          B[t] = tmp[q++] as number;
        } else {
          access += 2;
          B[t] = tmp[p++] as number;
        }
      }
    }
  };

  const sort = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  };
  sort(0, B.length - 1);

  // 답이 정렬돼 있지 않으면 이 계수는 다른 절차를 잰 값이다.
  for (let t = 1; t < B.length; t++) {
    if ((B[t - 1] as number) > (B[t] as number)) {
      throw new Error("병합 정렬이 정렬되지 않은 결과를 냈다");
    }
  }
  return { access, compares, cells: 2 * A.length, passes: 0, out: B };
}

const TWO_HUNDRED = spread(200);
const BIG = spread(100_000);

function counts(sort: (A: number[]) => Counts): Record<string, number> {
  return {
    "일곱 칸 배열 접근": sort(WALK).access,
    "일곱 칸 견주기": sort(WALK).compares,
    "200 칸 배열 접근": sort(TWO_HUNDRED).access,
    "200 칸 견주기": sort(TWO_HUNDRED).compares,
    "10 만 칸 배열 접근": sort(BIG).access,
    "10 만 칸 견주기": sort(BIG).compares,
    "10 만 칸 새로 잡는 칸": sort(BIG).cells,
  };
}

export const cases = {
  "자릿수 정렬": () => counts((A) => radixCounts(A)),
  "병합 정렬": () => counts(mergeCounts),
};
