/**
 * `purpose.alt` 의 수치 — L13. 같은 개수를 **전혀 다른 축에서** 세는 두 설계를 같은 입력에
 * 걸고 계수를 센다.
 *
 * 대조 상대는 **별과 막대 + 포함배제로 낸 닫힌 형태**다. 자유 자리 `m` 개를 합 `t` 로 채우는
 * 방법 수를 표로 세지 않고 식 하나로 낸다 —
 * `W(m,t) = Σ_j (−1)^j C(m,j) C(t−10j+m−1, m−1)`. 자릿수를 왼쪽부터 차례로 읽으면서
 * 「이 자리에서 `N` 보다 작아지는」 무리마다 그 식을 한 번 부르면 답이 나오므로 표가 아예 없다.
 *
 * **채택이 갈리는 축은 `K` 다.** 닫힌 형태의 비용은 포함배제 항 수 `⌊t/10⌋+1` 에 붙어 `K` 가
 * 커질수록 늘고, 자릿수 DP 의 비용은 상태 수가 `K = 67` 근처에서 가장 크고 그 뒤로는 가지치기
 * 가 늘어 줄어든다. 두 곡선이 실제로 교차한다.
 *
 * 계수 둘. **기본 연산**은 두 설계 모두 산술 연산 하나와 표 접근 하나를 각각 1 로 센다 —
 * 자릿수 DP 는 가지치기 검사 3 · 기저 검사 1 · 표 읽기 1 · 표 쓰기 1 · 자리마다 숫자 하나를
 * 놓아 보는 일 1 · 그 결과를 더하고 다음 tight 를 정하는 일 2 이고, 닫힌 형태는 포함배제 항
 * 하나마다 3 · 이항계수의 곱셈과 나눗셈마다 2 · 무리 하나를 더할 때마다 1 이다.
 * **잡는 칸**은 두 설계가 실제로 들고 있어야 하는 칸 수다.
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `N = 194` · `K = 10` 이라 자리가 셋뿐이고, 그
 * 크기에서는 기본 연산이 536 대 77 이라 어느 쪽이 왜 적은지가 값에서 나오지 않는다 —
 * 입력 D 가 그 값이고, 본문이 그 사유를 적는 자리에 함께 싣는다. 그래서 대조는 **제약 상한**
 * 에서 한다 — `N` 은 십오 자리이고 `K` 만 갈아 끼운다. 입력 A 와 B 는 `K` 를 115 와 116 으로
 * **하나만** 다르게 둔 경계이고, 입력 C 는 `N` 의 모양을 바꿔(`10^15` 은 자릿수 합이 1 이다)
 * 경계가 사라지는 자리를 보인다.
 */
import type { BenchCase } from "../../../../tools/bench-alt.ts";
import { digitDp } from "./digitDp-guide.ref.ts";

/** 입력 A — 아홉이 열다섯 개, 목표 합 115. */
const A: [number, number] = [999_999_999_999_999, 115];
/** 입력 B — 같은 `N` 에 목표 합만 하나 더 큰 116. 여기서 순서가 뒤집힌다. */
const B: [number, number] = [999_999_999_999_999, 116];
/** 입력 C — `N` 의 모양이 다르다. 자릿수 합이 1 이라 갈라지는 무리가 하나뿐이다. */
const C: [number, number] = [10 ** 15, 50];
/** 입력 D — 전개 입력. 왜 이 크기로 대조하지 않는지를 값으로 보이려고 함께 잰다. */
const D: [number, number] = [194, 10];

let ops = 0;
const bump = (k: number): void => {
  ops += k;
};

const digitsOf = (N: number): number[] => [...String(N)].map(Number);

/** 이 가이드의 절차. 정본과 같은 자리에 계수만 붙였다. */
function digitTable(N: number, K: number): number {
  const digits = digitsOf(N);
  const L = digits.length;
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );
  const count = (pos: number, sum: number, tight: boolean): number => {
    bump(3);
    if (sum + 9 * (L - pos) < K) return 0;
    bump(1);
    if (pos === L) return sum === K ? 1 : 0;
    if (!tight) {
      bump(1);
      const done = (memo[pos] as number[])[sum] as number;
      if (done !== -1) return done;
    }
    const limit = tight ? (digits[pos] as number) : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      bump(1);
      if (sum + x > K) break;
      bump(2);
      total += count(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }
    if (!tight) {
      bump(1);
      (memo[pos] as number[])[sum] = total;
    }
    return total;
  };
  const t = count(0, 0, true);
  bump(1);
  return K === 0 ? t - 1 : t;
}

/** 이항계수. 중간 항이 배정밀도 정수의 정확 범위를 넘어서 `BigInt` 로 센다. */
function binom(n: number, r: number): bigint {
  if (r < 0 || n < 0 || r > n) return 0n;
  const k = Math.min(r, n - r);
  let v = 1n;
  for (let i = 1; i <= k; i++) {
    bump(2);
    v = (v * BigInt(n - k + i)) / BigInt(i);
  }
  return v;
}

/** 자유 자리 `m` 개를 합 `t` 로 채우는 방법 수 — 포함배제 닫힌 형태. */
function ways(m: number, t: number): bigint {
  if (t < 0) return 0n;
  if (m === 0) return t === 0 ? 1n : 0n;
  let s = 0n;
  for (let j = 0; j * 10 <= t; j++) {
    bump(3);
    const term = binom(m, j) * binom(t - 10 * j + m - 1, m - 1);
    s += j % 2 === 0 ? term : -term;
  }
  return s;
}

/** 경쟁 설계 — 표 없이 무리마다 닫힌 형태를 한 번씩 부른다. */
function closedForm(N: number, K: number): number {
  const d = digitsOf(N);
  const L = d.length;
  let total = 0n;
  let prefix = 0;
  for (let pos = 0; pos < L; pos++) {
    for (let x = 0; x < (d[pos] as number); x++) {
      bump(2);
      const t = K - prefix - x;
      if (t < 0) break;
      bump(1);
      total += ways(L - pos - 1, t);
    }
    bump(1);
    prefix += d[pos] as number;
    if (prefix > K) break;
  }
  bump(1);
  if (prefix === K) total += 1n;
  bump(1);
  return Number(K === 0 ? total - 1n : total);
}

/** 계수를 0 에서 시작해 한 번 재고, 답이 정본과 같은지 함께 확인한다. */
function measure(
  fn: (N: number, K: number) => number,
  [N, K]: [number, number],
): number {
  ops = 0;
  const got = fn(N, K);
  const want = digitDp(N, K);
  if (got !== want) {
    throw new Error(`답이 정본과 다르다 — N=${N} K=${K} ${got} ≠ ${want}`);
  }
  return ops;
}

export const cases: Record<string, BenchCase> = {
  "자릿수 DP (이 가이드)": () => ({
    "입력 A · 기본 연산": measure(digitTable, A),
    "입력 B · 기본 연산": measure(digitTable, B),
    "입력 C · 기본 연산": measure(digitTable, C),
    "입력 D(전개) · 기본 연산": measure(digitTable, D),
    "입력 A · 잡는 칸": digitsOf(A[0]).length * (A[1] + 1),
    "입력 C · 잡는 칸": digitsOf(C[0]).length * (C[1] + 1),
  }),
  "별과 막대 닫힌 형태": () => ({
    "입력 A · 기본 연산": measure(closedForm, A),
    "입력 B · 기본 연산": measure(closedForm, B),
    "입력 C · 기본 연산": measure(closedForm, C),
    "입력 D(전개) · 기본 연산": measure(closedForm, D),
    "입력 A · 잡는 칸": 0,
    "입력 C · 잡는 칸": 0,
  }),
};
