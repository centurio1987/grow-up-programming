/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts suffixArray-guide.alt.ts
 *
 * **경쟁 설계는 갈라 정렬(DC3, Kärkkäinen–Sanders skew)이다.** 같은 답(접미사 배열)을
 * 내되 절차가 다르다 — 자리를 3 으로 나눈 나머지로 갈라, 나머지가 1·2 인 자리를 **재귀로**
 * 정렬한 뒤 나머지가 0 인 자리를 그 결과에서 유도해 합친다. 바퀴를 되풀이하지 않으므로
 * 입력이 얼마나 되풀이되는지와 상관없이 비용이 정해진다.
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 문자열을 만드는 규칙 하나(mulberry32, 씨앗
 * `0x9e3779b9`, 알파벳 26 글자)를 고정하고 **길이 `n` 하나만** 바꾼다 — 뒤집히는 자리를
 * 그 축에서 찾는 것이 이 대조의 전부다. 전개 입력(여섯 글자)을 그대로 쓰지 않은 이유는
 * 두 설계의 계수가 그 규모에서는 계수 정렬 칸 배열 같은 상수 항에 묻히기 때문이다.
 *
 * **두 설계가 같은 답을 내는지 실행마다 대조한다**(`measure`). 다르면 대조가 아니라 다른
 * 문제를 푼 것이라 그 자리에서 던진다.
 */
import { suffixArray } from "./suffixArray-guide.ref.ts";

/** 제약의 최댓값. */
const LIMIT = 100_000;

/** 배가 기법이 바퀴를 두 번만 쓰는 마지막 길이. `n` 을 2 부터 훑어 찾은 값이다. */
const BEFORE = 1_039;

/** 바로 다음 길이. 여기서 배가 기법이 바퀴를 하나 더 쓴다. */
const AFTER = 1_040;

/** 아래쪽 경계 — 여기까지는 갈라 정렬이 적다. */
const SMALL_BEFORE = 90;

/** 아래쪽 경계 바로 다음 — 여기서부터 배가 기법이 적어진다. */
const SMALL_AFTER = 91;

/** 결정론적 난수 — mulberry32. 32비트 정수 연산만 써서 배정밀도 손실이 없다. */
export function makeText(n: number, sigma: number): string {
  let a = 0x9e3779b9;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(String.fromCharCode(97 + (((t ^ (t >>> 14)) >>> 0) % sigma)));
  }
  return out.join("");
}

/* ────────────────────────── 계측 ────────────────────────── */

let access = 0;
let live = 0;
let peak = 0;

const rd = (a: number[], i: number): number => {
  access++;
  return a[i] as number;
};

const wr = (a: number[], i: number, v: number): void => {
  access++;
  a[i] = v;
};

/** 칸을 새로 잡는다. 동시에 잡혀 있는 칸의 최댓값을 기록한다. */
function alloc(size: number): number[] {
  live += size;
  peak = Math.max(peak, live);
  return new Array<number>(size).fill(0);
}

/** 잡았던 칸을 놓는다. */
function free(size: number): void {
  live -= size;
}

function reset(): void {
  access = 0;
  live = 0;
  peak = 0;
}

/* ────────────────────────── 이 가이드가 가르치는 절차 ────────────────────────── */

/** 정본과 같은 절차에 계수만 덧붙인 것. */
export function byDoubling(s: string): {
  sa: number[];
  access: number;
  cells: number;
  rounds: number;
} {
  reset();
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  live = 2 * n;
  peak = live;
  access += n;
  let span = 128;
  let rounds = 0;

  const sortBy = (
    order: number[],
    key: (i: number) => number,
    k: number,
  ): number[] => {
    const count = alloc(k);
    for (let p = 0; p < order.length; p++) {
      const v = key(rd(order, p));
      wr(count, v, rd(count, v) + 1);
    }
    for (let v = 1; v < k; v++) wr(count, v, rd(count, v) + rd(count, v - 1));
    const out = alloc(order.length);
    for (let p = order.length - 1; p >= 0; p--) {
      const i = rd(order, p);
      const v = key(i);
      wr(count, v, rd(count, v) - 1);
      wr(out, rd(count, v), i);
    }
    free(k);
    // 옛 `order` 는 여기서 놓는다 — `out` 이 그 자리를 잇는다.
    free(order.length);
    return out;
  };

  for (let gap = 1; gap < n; gap *= 2) {
    rounds++;
    const front = (i: number): number => rd(rank, i);
    const back = (i: number): number =>
      i + gap < n ? rd(rank, i + gap) + 1 : 0;
    for (const key of [back, front]) sa = sortBy(sa, key, span + 1);

    const next = alloc(n);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = rd(sa, j - 1);
      const b = rd(sa, j);
      if (front(a) !== front(b) || back(a) !== back(b)) top++;
      wr(next, b, top);
    }
    rank = next;
    free(n);
    span = top + 1;
    if (span === n) break;
  }
  return { sa, access, cells: peak, rounds };
}

/* ────────────────────────── 경쟁 설계 — 갈라 정렬(DC3) ────────────────────────── */

/** 값이 `[0, K]` 안의 정수인 키로 안정 정렬한다. `r` 의 `rOff` 만큼 뒤 자리를 키로 본다. */
function radixPass(
  a: number[],
  b: number[],
  r: number[],
  rOff: number,
  n: number,
  K: number,
): void {
  const c = alloc(K + 1);
  for (let i = 0; i < n; i++) {
    const k = rd(r, rOff + rd(a, i));
    wr(c, k, rd(c, k) + 1);
  }
  let sum = 0;
  for (let i = 0; i <= K; i++) {
    const t = rd(c, i);
    wr(c, i, sum);
    sum += t;
  }
  for (let i = 0; i < n; i++) {
    const ai = rd(a, i);
    const k = rd(r, rOff + ai);
    wr(b, rd(c, k), ai);
    wr(c, k, rd(c, k) + 1);
  }
  free(K + 1);
}

const leq2 = (a1: number, a2: number, b1: number, b2: number): boolean =>
  a1 < b1 || (a1 === b1 && a2 <= b2);

const leq3 = (
  a1: number,
  a2: number,
  a3: number,
  b1: number,
  b2: number,
  b3: number,
): boolean => a1 < b1 || (a1 === b1 && leq2(a2, a3, b2, b3));

/**
 * `s` 는 길이 `n + 3` 이고 마지막 세 칸이 0 이며 값은 `1..K` 다. `SA[0..n-1]` 를 채운다.
 *
 * 절차는 Kärkkäinen–Sanders 의 원본 배치를 그대로 옮긴 것이다 — 나머지 1·2 자리를 세 글자
 * 묶음으로 기수 정렬해 이름을 붙이고, 이름이 다 다르지 않으면 그 이름 배열에 재귀한 뒤,
 * 나머지 0 자리를 그 결과에서 유도해 두 줄을 합친다.
 */
function skew(s: number[], SA: number[], n: number, K: number): void {
  const n0 = Math.floor((n + 2) / 3);
  const n1 = Math.floor((n + 1) / 3);
  const n2 = Math.floor(n / 3);
  const n02 = n0 + n2;
  const s12 = alloc(n02 + 3);
  const SA12 = alloc(n02 + 3);
  const s0 = alloc(n0);
  const SA0 = alloc(n0);

  for (let i = 0, j = 0; i < n + (n0 - n1); i++) {
    if (i % 3 !== 0) wr(s12, j++, i);
  }

  radixPass(s12, SA12, s, 2, n02, K);
  radixPass(SA12, s12, s, 1, n02, K);
  radixPass(s12, SA12, s, 0, n02, K);

  let name = 0;
  let c0 = -1;
  let c1 = -1;
  let c2 = -1;
  for (let i = 0; i < n02; i++) {
    const p = rd(SA12, i);
    if (rd(s, p) !== c0 || rd(s, p + 1) !== c1 || rd(s, p + 2) !== c2) {
      name++;
      c0 = rd(s, p);
      c1 = rd(s, p + 1);
      c2 = rd(s, p + 2);
    }
    if (p % 3 === 1) wr(s12, Math.floor(p / 3), name);
    else wr(s12, Math.floor(p / 3) + n0, name);
  }

  if (name < n02) {
    skew(s12, SA12, n02, name);
    for (let i = 0; i < n02; i++) wr(s12, rd(SA12, i), i + 1);
  } else {
    for (let i = 0; i < n02; i++) wr(SA12, rd(s12, i) - 1, i);
  }

  for (let i = 0, j = 0; i < n02; i++) {
    const v = rd(SA12, i);
    if (v < n0) wr(s0, j++, 3 * v);
  }
  radixPass(s0, SA0, s, 0, n0, K);

  let p = 0;
  let t = n0 - n1;
  for (let k = 0; k < n; k++) {
    const st = rd(SA12, t);
    const i = st < n0 ? st * 3 + 1 : (st - n0) * 3 + 2;
    const j = rd(SA0, p);
    const smaller =
      st < n0
        ? leq2(rd(s, i), rd(s12, st + n0), rd(s, j), rd(s12, Math.floor(j / 3)))
        : leq3(
            rd(s, i),
            rd(s, i + 1),
            rd(s12, st - n0 + 1),
            rd(s, j),
            rd(s, j + 1),
            rd(s12, Math.floor(j / 3) + n0),
          );
    if (smaller) {
      wr(SA, k, i);
      t++;
      if (t === n02) {
        for (k++; p < n0; p++, k++) wr(SA, k, rd(SA0, p));
      }
    } else {
      wr(SA, k, j);
      p++;
      if (p === n0) {
        for (k++; t < n02; t++, k++) {
          const st2 = rd(SA12, t);
          wr(SA, k, st2 < n0 ? st2 * 3 + 1 : (st2 - n0) * 3 + 2);
        }
      }
    }
  }
  free(n02 + 3);
  free(n02 + 3);
  free(n0);
  free(n0);
}

export function bySkew(str: string): {
  sa: number[];
  access: number;
  cells: number;
} {
  reset();
  const n = str.length;
  if (n < 2) return { sa: n === 0 ? [] : [0], access: 0, cells: 0 };
  const s = alloc(n + 3);
  access += n;
  for (let i = 0; i < n; i++) s[i] = str.charCodeAt(i) - 96;
  const SA = alloc(n);
  skew(s, SA, n, 26);
  return { sa: SA, access, cells: peak };
}

/* ────────────────────────── 대조 ────────────────────────── */

/** 두 설계가 같은 답을 내는지 확인한다. 다르면 대조가 아니라 다른 문제를 푼 것이다. */
function measure(s: string): {
  mine: ReturnType<typeof byDoubling>;
  theirs: ReturnType<typeof bySkew>;
} {
  const mine = byDoubling(s);
  const theirs = bySkew(s);
  const want = suffixArray(s).join(",");
  if (mine.sa.join(",") !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — n=${s.length}`);
  }
  if (theirs.sa.join(",") !== want) {
    throw new Error(`두 설계의 답이 다르다 — n=${s.length}`);
  }
  return { mine, theirs };
}

const SB = measure(makeText(SMALL_BEFORE, 26));
const SA = measure(makeText(SMALL_AFTER, 26));
const B = measure(makeText(BEFORE, 26));
const A = measure(makeText(AFTER, 26));
const R = measure(makeText(LIMIT, 26));
const S = measure("a".repeat(LIMIT));

export const cases = {
  "배가 기법": () => ({
    "n=90 자료 접근": SB.mine.access,
    "n=91 자료 접근": SA.mine.access,
    "n=1,039 자료 접근": B.mine.access,
    "n=1,040 자료 접근": A.mine.access,
    "n=100,000 무작위 자료 접근": R.mine.access,
    "n=100,000 전부 같은 글자 자료 접근": S.mine.access,
    "n=100,000 잡는 칸 최대": R.mine.cells,
  }),
  "갈라 정렬": () => ({
    "n=90 자료 접근": SB.theirs.access,
    "n=91 자료 접근": SA.theirs.access,
    "n=1,039 자료 접근": B.theirs.access,
    "n=1,040 자료 접근": A.theirs.access,
    "n=100,000 무작위 자료 접근": R.theirs.access,
    "n=100,000 전부 같은 글자 자료 접근": S.theirs.access,
    "n=100,000 잡는 칸 최대": R.theirs.cells,
  }),
};
