/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 적용하고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 값이
 * 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts searchInRotatedSortedArray-guide.alt.ts
 *
 * **입력은 전개 절과 같은 것이다**(L20) — `A = [17, 18, 19, 20, 0, 1, …, 16]` 스물한 칸.
 * 질의 목록도 그 배열의 원소를 자리 순서대로 쓰므로 난수가 없고 시드가 없다. 갱신은
 * 배열을 왼쪽으로 한 칸 회전시키는 것이고, 그러면 원소 집합은 그대로이면서 끊긴 자리만
 * 바뀐다 — 두 설계가 같은 답을 내야 하는 조건이 유지된다.
 *
 * 세는 것은 **배열 칸 접근**(`A[...]` 를 한 번 읽는 것) 하나다.
 */

/** 전개 절과 같은 배열. `S = 0 1 … 20` 을 열일곱째 칸에서 끊어 이어 붙인 것이다. */
export const BASE: number[] = (() => {
  const S = Array.from({ length: 21 }, (_, i) => i);
  return [...S.slice(17), ...S.slice(0, 17)];
})();

/** 질의 목록 — 배열의 원소를 자리 순서대로 하나씩 찾는다. 난수가 없다. */
export const QUERIES: number[] = [...BASE];

interface Meter {
  n: number;
}

/* ───────────────── 이 가이드가 가르치는 설계 — 한 번 통과 ───────────────── */

/**
 * 걸음마다 `A[mid]` 와 `A[lo]` 를 함께 읽어 어느 조각에 끊긴 자리가 없는지 정하고, 그 조각의
 * 값 범위로 갈래를 정한다. 전처리가 없다.
 */
function onePass(A: number[], target: number, m: Meter): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    m.n++;
    const vMid = A[mid] as number;
    if (vMid === target) return mid;
    m.n++;
    const vLo = A[lo] as number;
    if (vLo <= vMid) {
      if (vLo <= target && target < vMid) hi = mid - 1;
      else lo = mid + 1;
    } else {
      m.n++;
      const vHi = A[hi] as number;
      if (vMid < target && target <= vHi) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

/* ───────── 경쟁 설계 — 최솟값이 있는 자리를 먼저 찾는 두 번 통과 ───────── */

/**
 * 최솟값이 있는 자리 `p`(끊긴 자리 바로 다음 칸)를 이분 탐색으로 찾는다. 배열 하나당 한 번만 한다.
 * 걸음마다 `A[mid]` 와 `A[hi]` 를 읽는다.
 */
function findPivot(A: number[], m: Meter): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    m.n++;
    const vMid = A[mid] as number;
    m.n++;
    const vHi = A[hi] as number;
    if (vMid > vHi) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * `p` 를 알고 나면 논리 인덱스 `j` 를 물리 자리 `(j + p) mod N` 으로 사상해 표준 이분 탐색을
 * 한다. 걸음마다 읽는 칸이 하나다 — 정렬된 쪽을 판정할 필요가 없다.
 */
function searchWithPivot(
  A: number[],
  p: number,
  target: number,
  m: Meter,
): number {
  const N = A.length;
  let lo = 0;
  let hi = N - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const at = (mid + p) % N;
    m.n++;
    const v = A[at] as number;
    if (v === target) return at;
    if (target < v) hi = mid - 1;
    else lo = mid + 1;
  }
  return -1;
}

/* ─────────────────────────── 계측 ─────────────────────────── */

/** 두 설계가 같은 답을 냈는지 그 자리에서 확인한다. 다르면 대조가 성립하지 않는다. */
function agree(A: number[], p: number, target: number, a: Meter, b: Meter) {
  const want = A.indexOf(target);
  const one = onePass(A, target, a);
  const two = searchWithPivot(A, p, target, b);
  if (one !== want || two !== want) {
    throw new Error(
      `두 설계의 답이 실제 자리와 다르다 — target ${target}: ${one} · ${two} ≠ ${want}`,
    );
  }
}

/** 배열을 고정하고 질의 수만 늘린다. */
function fixedArray(q: number): { one: number; two: number } {
  const a: Meter = { n: 0 };
  const b: Meter = { n: 0 };
  const p = findPivot(BASE, b);
  for (let i = 0; i < q; i++) agree(BASE, p, QUERIES[i] as number, a, b);
  return { one: a.n, two: b.n };
}

/**
 * 질의 스물한 개 사이에 갱신 `u` 회를 고르게 끼운다. 갱신은 왼쪽으로 한 칸 회전이고,
 * 두 번 통과는 그때마다 `p` 를 다시 찾는다.
 */
function withUpdates(u: number): { one: number; two: number } {
  const N = BASE.length;
  let A = [...BASE];
  const a: Meter = { n: 0 };
  const b: Meter = { n: 0 };
  let p = findPivot(A, b);
  const every =
    u === 0 ? Number.POSITIVE_INFINITY : Math.max(1, Math.floor(N / u));
  let done = 0;
  for (let i = 0; i < N; i++) {
    agree(A, p, QUERIES[i] as number, a, b);
    if (done < u && (i + 1) % every === 0) {
      A = [...A.slice(1), A[0] as number];
      done++;
      p = findPivot(A, b);
    }
  }
  return { one: a.n, two: b.n };
}

const q1 = fixedArray(1);
const q2 = fixedArray(2);
const q3 = fixedArray(3);
const u0 = withUpdates(0);
const u7 = withUpdates(7);
const u8 = withUpdates(8);

export const cases = {
  "한 번 통과": () => ({
    "질의 1 회 칸 접근": q1.one,
    "질의 2 회 칸 접근": q2.one,
    "질의 3 회 칸 접근": q3.one,
    "질의 21 회 칸 접근": u0.one,
    "질의 21 회 · 갱신 7 회 칸 접근": u7.one,
    "질의 21 회 · 갱신 8 회 칸 접근": u8.one,
    "전처리로 들고 있는 칸": 0,
  }),
  "두 번 통과": () => ({
    "질의 1 회 칸 접근": q1.two,
    "질의 2 회 칸 접근": q2.two,
    "질의 3 회 칸 접근": q3.two,
    "질의 21 회 칸 접근": u0.two,
    "질의 21 회 · 갱신 7 회 칸 접근": u7.two,
    "질의 21 회 · 갱신 8 회 칸 접근": u8.two,
    "전처리로 들고 있는 칸": 1,
  }),
};
