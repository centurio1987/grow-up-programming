/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts countingSort-guide.alt.ts
 *
 * **입력 넷을 쓰는 이유**(L20). 전개가 쓰는 `[3 1 3 0 5 1 3]` 을 그대로 넣지만, 일곱 칸에서는
 * 계수 정렬의 비용이 거의 전부 키 공간 `K = 1001` 에서 나와 두 설계의 성질이 안 갈린다.
 * 그래서 같은 생성식으로 만든 20 칸 · 200 칸 · 100,000 칸을 함께 잰다. **난수를 쓰지 않으므로
 * 시드가 없다** — 생성식 `A[i] = (i × 37) mod 1001` 이 입력의 전부이고, 그 식을 본문에도 적는다.
 *
 * 계수 셋의 정의를 여기서 못 박는다.
 *
 * - **배열 접근** — 배열 칸을 읽거나 쓴 횟수 전부. 두 설계가 쓰는 배열이 서로 달라
 *   (`count`·`out` 대 복사본·보조 배열) 어느 한쪽만 빼면 대조가 성립하지 않는다.
 * - **견주기** — 배열의 두 값을 견준 횟수. 인덱스 판정(`t <= hi`)은 안 센다.
 * - **새로 잡는 칸** — 입력 말고 새로 만든 배열의 칸 수 합.
 */

/** 전개가 쓰는 입력. */
export const SEVEN = [3, 1, 3, 0, 5, 1, 3];

/** 키 값 공간의 칸 수. 문제의 제약 `0 ≤ A[i] ≤ 1000` 이 정한다. */
const K = 1001;

/** 난수 없는 생성식. `A[i] = (i × 37) mod 1001` 이라 값이 0 … 1000 에 고루 놓인다. */
export const spread = (n: number): number[] =>
  Array.from({ length: n }, (_, t) => (t * 37) % K);

export interface Counts {
  /** 배열 칸을 읽거나 쓴 횟수. */
  access: number;
  /** 배열의 두 값을 견준 횟수. */
  compares: number;
  /** 입력 말고 새로 만든 배열의 칸 수 합. */
  cells: number;
}

/**
 * 이 가이드가 가르치는 절차 — **계수 정렬**. `countingSort-guide.ref.ts` 와 같은 절차이고
 * 계수만 덧붙였다. 값을 그대로 배열의 자리로 써서 개수를 세고, 자리를 오름차순으로 읽어
 * 센 만큼 이어 쓴다.
 */
export function countingCounts(A: number[]): Counts {
  let access = 0;
  const count = new Array<number>(K).fill(0);
  access += K;

  for (const v of A) {
    access += 3;
    count[v] = (count[v] as number) + 1;
  }

  const out: number[] = [];
  for (let v = 0; v < K; v++) {
    access += 1;
    for (let t = count[v] as number; t > 0; t--) {
      access += 1;
      out.push(v);
    }
  }
  return { access, compares: 0, cells: K + A.length };
}

/**
 * 경쟁 설계 — **병합 정렬**.
 *
 * 같은 목표(정수 배열을 오름차순으로 정렬한 새 배열 돌려주기)를 노리고 절차가 다르다.
 * 값의 범위를 하나도 쓰지 않고 **두 값을 견주는 것만으로** 순서를 정한다. 그래서 값이
 * 어떤 범위에 있든, 심지어 견주기만 되는 값(문자열·객체)이어도 그대로 통한다.
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
  return { access, compares, cells: 2 * A.length };
}

const TWENTY = spread(20);
const TWO_HUNDRED = spread(200);
const BIG = spread(100_000);

function counts(sort: (A: number[]) => Counts): Record<string, number> {
  return {
    "일곱 칸 배열 접근": sort(SEVEN).access,
    "일곱 칸 견주기": sort(SEVEN).compares,
    "20 칸 배열 접근": sort(TWENTY).access,
    "20 칸 견주기": sort(TWENTY).compares,
    "200 칸 배열 접근": sort(TWO_HUNDRED).access,
    "200 칸 견주기": sort(TWO_HUNDRED).compares,
    "10 만 칸 배열 접근": sort(BIG).access,
    "10 만 칸 견주기": sort(BIG).compares,
    "10 만 칸 새로 잡는 칸": sort(BIG).cells,
  };
}

export const cases = {
  "계수 정렬": () => counts(countingCounts),
  "병합 정렬": () => counts(mergeCounts),
};
