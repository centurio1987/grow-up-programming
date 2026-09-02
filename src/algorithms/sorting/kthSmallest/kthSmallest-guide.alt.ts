/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts kthSmallest-guide.alt.ts
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개가 쓰는 `[7, 10, 4, 3, 20, 15]` 는 칸이 여섯이라
 * **뒤집힘 자체가 안 일어난다** — 역산한 최악 입력을 넣어도 견주기가 15 대 26 으로 이 가이드의
 * 절차가 적다(실측). 뒤집히는 첫 칸 수는 12 이고(`n`=11 은 55 대 60, `n`=12 는 66 대 52),
 * 그래서 대조만 `n = 1,024` 를 쓰고 그 사유를 본문에도 적는다.
 *
 * 입력 두 벌을 쓰는 이유는 이 대조의 갈림이 **입력의 모양**에 있기 때문이다. 한 벌은 생성식
 * 하나로 만든 뒤섞인 배열이고, 다른 한 벌은 **이 가이드의 기준값 규칙을 겨냥해 역산한 배열**
 * 이다. 뒤 배열의 구성 절차는 `perf.worst` 가 본문에 코드로 싣는다.
 */

/** 대조에 쓰는 칸 수. 한 번 정하면 바꾸지 않는다. */
export const N = 1024;

/** 뒤섞인 입력 — 생성식 하나로 만든다. 독자가 이 식으로 같은 배열을 다시 만들 수 있다. */
export const SHUFFLED: number[] = Array.from(
  { length: N },
  (_, i) => (i * 7919) % 10_007,
);

/** 뒤섞인 입력에서 묻는 순번. 가운데다. */
export const SHUFFLED_K = 512;

interface Counter {
  cmp: number;
  cells: number;
}

const swap = (a: number[], x: number, y: number): void => {
  const t = a[x] as number;
  a[x] = a[y] as number;
  a[y] = t;
};

/* ────────────────────── 이 가이드의 절차 ────────────────────── */

/** 정본과 같은 절차(구간의 중앙을 기준값으로). 세는 것만 덧붙였다. */
function guideSelect(src: number[], k: number, c: Counter): number {
  const a = [...src];
  const target = k - 1;
  let lo = 0;
  let hi = a.length - 1;
  while (lo < hi) {
    const m = lo + Math.floor((hi - lo) / 2);
    swap(a, m, hi);
    const pivot = a[hi] as number;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      c.cmp++;
      if ((a[j] as number) < pivot) {
        swap(a, i, j);
        i++;
      }
    }
    swap(a, i, hi);
    if (i === target) return a[i] as number;
    if (i > target) hi = i - 1;
    else lo = i + 1;
  }
  // 제자리에서 맞바꾸기만 하므로 새로 잡는 칸이 없다.
  return a[lo] as number;
}

/* ────────────────────── 경쟁 설계 — 중앙값의 중앙값 ────────────────────── */

/**
 * 경쟁 설계 — **중앙값의 중앙값**(median of medians, BFPRT).
 *
 * 같은 목표(정렬하지 않고 `k` 번째 값 하나를 고르기)를 노리고, **최악에도 선형**이라는
 * 이 가이드의 절차에 없는 약속을 한다. 다섯 칸씩 묶어 각 묶음의 중앙값을 모으고, 그 모임의
 * 중앙값을 같은 절차로 다시 골라 기준값으로 쓴다. 그 기준값은 양쪽에 최소 30 % 씩을 남긴다.
 */
function insertionRange(a: number[], lo: number, hi: number, c: Counter): void {
  for (let x = lo + 1; x <= hi; x++) {
    const v = a[x] as number;
    let y = x - 1;
    while (y >= lo) {
      c.cmp++;
      if ((a[y] as number) <= v) break;
      a[y + 1] = a[y] as number;
      y--;
    }
    a[y + 1] = v;
  }
}

function momPartition(a: number[], lo: number, hi: number, c: Counter): number {
  const pv = medianOfMedians(a, lo, hi, c);
  let idx = lo;
  for (let t = lo; t <= hi; t++) {
    c.cmp++;
    if (a[t] === pv) {
      idx = t;
      break;
    }
  }
  swap(a, idx, hi);
  const pivot = a[hi] as number;
  let i = lo;
  for (let j = lo; j < hi; j++) {
    c.cmp++;
    if ((a[j] as number) < pivot) {
      swap(a, i, j);
      i++;
    }
  }
  swap(a, i, hi);
  return i;
}

function medianOfMedians(
  a: number[],
  lo: number,
  hi: number,
  c: Counter,
): number {
  const n = hi - lo + 1;
  if (n <= 5) {
    insertionRange(a, lo, hi, c);
    return a[lo + ((n - 1) >> 1)] as number;
  }
  const medians: number[] = [];
  for (let s = lo; s <= hi; s += 5) {
    const e = Math.min(s + 4, hi);
    insertionRange(a, s, e, c);
    medians.push(a[s + ((e - s) >> 1)] as number);
  }
  // 중앙값을 모으는 배열이 이 설계가 새로 잡는 칸이다.
  c.cells += medians.length;
  return selectValue(medians, (medians.length - 1) >> 1, c);
}

function selectValue(arr: number[], targetIdx: number, c: Counter): number {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi) {
    const p = momPartition(arr, lo, hi, c);
    if (p === targetIdx) return arr[p] as number;
    if (p > targetIdx) hi = p - 1;
    else lo = p + 1;
  }
  return arr[lo] as number;
}

function momSelect(src: number[], k: number, c: Counter): number {
  return selectValue([...src], k - 1, c);
}

/* ────────────────────── 최악 입력 구성 ────────────────────── */

/**
 * 이 가이드의 기준값 규칙(구간의 중앙)을 겨냥해 역산한 배열.
 *
 * 절차가 어느 자리를 고르는지 알고 있으므로, **그 자리에 놓일 값을 매 단계 그 구간의
 * 최솟값으로** 정해 두면 분할이 매번 한쪽으로 완전히 치우친다.
 */
export function worstInput(n: number): number[] {
  const pos = Array.from({ length: n }, (_, i) => i);
  const rank = new Array<number>(n).fill(-1);
  for (let round = 0; round < n - 1; round++) {
    const lo = round;
    const hi = n - 1;
    swap(pos, lo + Math.floor((hi - lo) / 2), hi);
    swap(pos, lo, hi);
    rank[pos[lo] as number] = round;
  }
  rank[pos[n - 1] as number] = n - 1;
  return rank;
}

/** 역산한 배열에서 묻는 순번. 구간이 왼쪽부터 한 칸씩 줄므로 목표는 오른쪽 끝이다. */
export const WORST_K = N;

const WORST: number[] = worstInput(N);

const measure = (
  fn: (src: number[], k: number, c: Counter) => number,
  src: number[],
  k: number,
): Counter => {
  const c: Counter = { cmp: 0, cells: 0 };
  fn(src, k, c);
  return c;
};

export const cases = {
  "이 가이드의 절차": (): Record<string, number> => {
    const s = measure(guideSelect, SHUFFLED, SHUFFLED_K);
    const w = measure(guideSelect, WORST, WORST_K);
    return {
      "뒤섞인 입력 견주기": s.cmp,
      "최악 입력 견주기": w.cmp,
      "뒤섞인 입력 새로 잡는 칸": s.cells,
      "최악 입력 새로 잡는 칸": w.cells,
    };
  },
  "중앙값의 중앙값": (): Record<string, number> => {
    const s = measure(momSelect, SHUFFLED, SHUFFLED_K);
    const w = measure(momSelect, WORST, WORST_K);
    return {
      "뒤섞인 입력 견주기": s.cmp,
      "최악 입력 견주기": w.cmp,
      "뒤섞인 입력 새로 잡는 칸": s.cells,
      "최악 입력 새로 잡는 칸": w.cells,
    };
  },
};
