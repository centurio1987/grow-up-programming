/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 계수를 실측하는 하네스 — `L13`.
 *
 * 재는 것은 **기본 연산 수**와 **저장 칸 수** 둘이다. 기본 연산은 곱셈 · 덧셈 · 나머지
 * 연산을 각각 한 번으로 세고, 두 설계가 같은 단위를 쓴다. 둘 다 같은 입력에서 늘 같은 값이
 * 나오는 결정론적 계수다 — 벽시계는 안 잰다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/binomialModP/binomialModP-guide.alt.ts
 *
 * **입력을 왜 전개 입력만으로 안 두는가.** 전개가 쓰는 법은 7 이라 페르마 역원의 거듭제곱이
 * 곱셈 열 번으로 끝난다. 두 설계가 갈리는 축이 「역원 한 번의 비용 대 표 채우기 비용」이라
 * 법이 작으면 그 축이 거의 0 이 되어 뒤집히는 자리가 안 보인다. 그래서 전개 입력을 그대로
 * 한 줄로 두고, 법을 제약 규모의 `10^9 + 7` 로 올린 줄들을 더한다. 생성식은 `k = ⌊n/2⌋`
 * 하나이고 난수가 없다.
 */

/** 제약 규모의 법. 경시 대회 관례값이고 소수다. */
export const BIG_P = 1_000_000_007n;

/** 작은 법 — 뒤집히는 자리가 법에 따라 옮겨 가는 것을 보이는 데 쓴다. */
export const SMALL_P = 101n;

/** 전개 절이 쓰는 입력. */
export const WALK: [bigint, bigint, bigint] = [34n, 20n, 7n];

/* ─────────────── 이 글의 절차 — 자릿수 분해 + 페르마 역원 ─────────────── */

/**
 * 정본과 같은 절차에 기본 연산 계수만 덧붙인 사본. 답이 맞는지는 정본이 지고
 * (`*.proof.ts` 가 정본을 부른다), 여기서는 계수만 낸다.
 */
export function ourOps(n: bigint, k: bigint, p: bigint): { ops: number } {
  let ops = 0;
  const rec = (a: bigint, b: bigint): bigint => {
    if (b < 0n || b > a) return 0n;
    if (b === 0n || b === a) return 1n;
    if (a >= p) {
      const lo = rec(a % p, b % p);
      const hi = rec(a / p, b / p);
      ops += 2; // 곱셈 하나와 나머지 하나
      return (lo * hi) % p;
    }
    const j = a - b < b ? a - b : b;
    let num = 1n;
    let den = 1n;
    for (let i = 0n; i < j; i++) {
      num = (num * (a - i)) % p;
      den = (den * (i + 1n)) % p;
      ops += 4; // 곱셈 둘과 나머지 둘
    }
    let inv = 1n;
    let bb = den;
    let e = p - 2n;
    while (e > 0n) {
      if ((e & 1n) === 1n) {
        inv = (inv * bb) % p;
        ops += 2;
      }
      bb = (bb * bb) % p;
      ops += 2;
      e >>= 1n;
    }
    ops += 2;
    return (num * inv) % p;
  };
  rec(n, k);
  return { ops };
}

/** 이 절차가 동시에 들고 있는 칸 — `num`·`den`·`inv`·`b`·`e`·`i`·`j` 일곱이다. */
export const OUR_CELLS = 7;

/* ─────────────────── 경쟁 설계 — 파스칼 삼각형(덧셈만) ─────────────────── */

/**
 * 한 줄만 들고 아래로 채워 가는 파스칼 삼각형. 나눗셈도 역원도 쓰지 않으므로 법이 소수가
 * 아니어도 되고 `n` 이 법보다 커도 자릿수 분해가 필요 없다.
 *
 * 기본 연산은 덧셈 하나와 나머지 하나로 두 번이다.
 */
export function pascalRun(n: bigint, k: bigint, p: bigint): { ops: number } {
  const kk = Number(n - k < k ? n - k : k);
  const nn = Number(n);
  const row = new Array<bigint>(kk + 1).fill(0n);
  row[0] = 1n % p;
  let ops = 0;
  for (let i = 1; i <= nn; i++) {
    for (let j = Math.min(i, kk); j >= 1; j--) {
      row[j] = ((row[j] as bigint) + (row[j - 1] as bigint)) % p;
      ops += 2;
    }
  }
  return { ops };
}

/**
 * 같은 계수의 닫힌 형태 — `2·(Σ_{i=1..n} min(i, kk))` 다.
 *
 * `n` = 100,000 에서 실제로 실행하면 칸 갱신이 37 억 번이라 재는 데만 몇 분이 걸린다.
 * 닫힌 형태가 실행과 같은 값을 내는지는 `closedFormAgrees()` 가 작은 `n` 전수로 확인한다.
 */
export function pascalOps(n: bigint, k: bigint): { ops: number } {
  const kk = n - k < k ? n - k : k;
  const inner = (kk * (kk + 1n)) / 2n + (n - kk) * kk;
  return { ops: Number(2n * inner) };
}

/** 닫힌 형태가 실행 계수와 같은가 — `n` = 1…60 전수 대조. */
export function closedFormAgrees(): boolean {
  for (let n = 1; n <= 60; n++) {
    const bn = BigInt(n);
    const bk = bn / 2n;
    if (pascalRun(bn, bk, BIG_P).ops !== pascalOps(bn, bk).ops) return false;
  }
  const [wn, wk, wp] = WALK;
  return pascalRun(wn, wk, wp).ops === pascalOps(wn, wk).ops;
}

/** 파스칼 판이 들고 있는 칸 — 한 줄의 길이다. */
export function pascalCells(n: bigint, k: bigint): number {
  return Number(n - k < k ? n - k : k) + 1;
}

/* ───────────────────────── 뒤집히는 자리 찾기 ───────────────────────── */

/**
 * `k = ⌊n/2⌋` 로 두고 `n` 을 2 부터 키우며 **파스칼이 더는 적지 않은 첫 `n`** 을 찾는다.
 * 법이 커질수록 역원 한 번의 값이 커져 이 자리가 앞으로 옮겨 간다.
 */
export function firstFlip(p: bigint, limit = 400): number {
  for (let n = 2; n <= limit; n++) {
    const bn = BigInt(n);
    const bk = bn / 2n;
    if (pascalOps(bn, bk).ops >= ourOps(bn, bk, p).ops) return n;
  }
  return -1;
}

const half = (n: number): [bigint, bigint] => [BigInt(n), BigInt(n) / 2n];

export const cases = {
  "자릿수 분해와 페르마 역원": () => {
    const [wn, wk, wp] = WALK;
    const [a12, b12] = half(12);
    const [a13, b13] = half(13);
    const [a7, b7] = half(7);
    const [a8, b8] = half(8);
    const [big, bigk] = half(100_000);
    return {
      "전개 입력 기본 연산": ourOps(wn, wk, wp).ops,
      "n=12 기본 연산": ourOps(a12, b12, BIG_P).ops,
      "n=13 기본 연산": ourOps(a13, b13, BIG_P).ops,
      "n=100,000 기본 연산": ourOps(big, bigk, BIG_P).ops,
      "법 101 n=7 기본 연산": ourOps(a7, b7, SMALL_P).ops,
      "법 101 n=8 기본 연산": ourOps(a8, b8, SMALL_P).ops,
      "n=100,000 저장 칸": OUR_CELLS,
      "뒤집히는 첫 n (법 10^9+7)": firstFlip(BIG_P),
      "뒤집히는 첫 n (법 101)": firstFlip(SMALL_P),
    };
  },
  "파스칼 삼각형": () => {
    const [wn, wk] = WALK;
    const [a12, b12] = half(12);
    const [a13, b13] = half(13);
    const [a7, b7] = half(7);
    const [a8, b8] = half(8);
    const [big, bigk] = half(100_000);
    return {
      "전개 입력 기본 연산": pascalOps(wn, wk).ops,
      "n=12 기본 연산": pascalOps(a12, b12).ops,
      "n=13 기본 연산": pascalOps(a13, b13).ops,
      "n=100,000 기본 연산": pascalOps(big, bigk).ops,
      "법 101 n=7 기본 연산": pascalOps(a7, b7).ops,
      "법 101 n=8 기본 연산": pascalOps(a8, b8).ops,
      "n=100,000 저장 칸": pascalCells(big, bigk),
    };
  },
};

/** 두 설계가 같은 답을 내는지 — 대조가 같은 문제를 재고 있다는 것의 근거다. */
export function valuesAgree(): boolean {
  const checks: [bigint, bigint, bigint][] = [
    WALK,
    [12n, 6n, BIG_P],
    [13n, 6n, BIG_P],
    [7n, 3n, SMALL_P],
    [8n, 4n, SMALL_P],
  ];
  for (const [n, k, p] of checks) {
    const kk = Number(n - k < k ? n - k : k);
    const row = new Array<bigint>(kk + 1).fill(0n);
    row[0] = 1n % p;
    for (let i = 1; i <= Number(n); i++) {
      for (let j = Math.min(i, kk); j >= 1; j--) {
        row[j] = ((row[j] as bigint) + (row[j - 1] as bigint)) % p;
      }
    }
    let exact = 1n;
    for (let i = 0n; i < BigInt(kk); i++) exact = (exact * (n - i)) / (i + 1n);
    if ((row[kk] as bigint) !== exact % p) return false;
  }
  return true;
}
