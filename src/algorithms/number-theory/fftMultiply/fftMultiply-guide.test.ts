/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/fftMultiply/fftMultiply.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`fftMultiply-guide.ref.ts`)에
 * 다시 건다.
 *
 * 벽시계를 재는 케이스(`2^16` 짜리 배열 둘을 3,000ms 안에)는 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「비용을 세는 과정」이 지고,
 * 여기서는 그 규모에서 **답이 맞는지**를 본다.
 *
 * 정답의 정의는 **큰 정수 곱 하나**다. 자리 하나를 `2^bits` 로 잡아 두 다항식을 정수
 * 하나씩으로 묶고 곱한 뒤 자리마다 잘라 내면, 자리가 넘치지 않는 한 부동소수가 한 번도
 * 끼지 않은 계수가 나온다.
 */
import { expect, test } from "bun:test";
import { fftMultiply } from "./fftMultiply-guide.ref.ts";

/** 정의를 그대로 옮긴 이중 반복. */
function naive(a: number[], b: number[]): number[] {
  if (a.length === 0 || b.length === 0) return [];
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] = (out[i + j] as number) + (a[i] as number) * (b[j] as number);
    }
  }
  return out;
}

/** 자리 하나를 `2^bits` 로 잡아 큰 정수 곱 한 번으로 정확한 계수를 낸다. */
function exactConv(a: number[], b: number[], bits: bigint): bigint[] {
  const mask = (1n << bits) - 1n;
  let packedA = 0n;
  for (let i = a.length - 1; i >= 0; i--) {
    packedA = (packedA << bits) | BigInt(a[i] as number);
  }
  let packedB = 0n;
  for (let i = b.length - 1; i >= 0; i--) {
    packedB = (packedB << bits) | BigInt(b[i] as number);
  }
  let product = packedA * packedB;
  const out: bigint[] = [];
  for (let k = 0; k < a.length + b.length - 1; k++) {
    out.push(product & mask);
    product >>= bits;
  }
  return out;
}

/** 생성식 — 선형 합동 생성기 하나로 `[0, cap]` 을 고르게 지난다. */
function coeffs(n: number, cap: number, salt: number): number[] {
  let seed = (20260906 + salt * 7919) & 0x7fffffff;
  return Array.from({ length: n }, () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return Math.floor((seed / 0x80000000) * (cap + 1));
  });
}

/* ───────────────────────── 기본 동작 ───────────────────────── */

const CASES: [string, number[], number[], number[]][] = [
  ["(1 + 2x)(3 + 4x) = 3 + 10x + 8x^2", [1, 2], [3, 4], [3, 10, 8]],
  [
    "(1 + x + x^2)(1 + x) = 1 + 2x + 2x^2 + x^3",
    [1, 1, 1],
    [1, 1],
    [1, 2, 2, 1],
  ],
  [
    "(2 + 3x + 4x^2)(5 + 6x) = 10 + 27x + 38x^2 + 24x^3",
    [2, 3, 4],
    [5, 6],
    [10, 27, 38, 24],
  ],
  ["상수 다항식 (5)(7) = 35", [5], [7], [35]],
  ["앞이 빈 배열", [], [1, 2, 3], []],
  ["뒤가 빈 배열", [1, 2, 3], [], []],
  ["0 계수가 낀 경우", [1, 0, 1], [1, 1], [1, 1, 1, 1]],
  ["양쪽 모두 0 하나", [0], [0], [0]],
  ["음수 계수 (1 - x)(1 + x) = 1 - x^2", [1, -1], [1, 1], [1, 0, -1]],
  ["계수가 큰 경우 (1000)(1000)", [1000], [1000], [1000000]],
  ["본문 전개가 쓰는 입력", [3, 1, 4, 1], [2, 5], [6, 17, 13, 22, 5]],
];

for (const [name, a, b, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(fftMultiply(a, b)).toEqual(want);
  });
}

test("정본 — 결과 길이가 정확히 n + m - 1", () => {
  const a = [1, 2, 3, 4, 5];
  const b = [6, 7, 8];
  expect(fftMultiply(a, b).length).toBe(a.length + b.length - 1);
});

test("정본 — 교환법칙이 성립한다", () => {
  const a = [3, 1, 4, 1, 5];
  const b = [9, 2, 6, 5];
  expect(fftMultiply(a, b)).toEqual(fftMultiply(b, a));
});

/* ───────────────────────── 정의와의 대조 ───────────────────────── */

test("정본 — 생성식으로 만든 배열 200 벌에서 정의 그대로 센 값과 같다", () => {
  let seed = 20260906;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let round = 0; round < 200; round++) {
    const n = 1 + (next() % 24);
    const m = 1 + (next() % 24);
    const a = Array.from({ length: n }, () => (next() % 41) - 20);
    const b = Array.from({ length: m }, () => (next() % 41) - 20);
    expect(fftMultiply(a, b)).toEqual(naive(a, b));
  }
});

test("정본 — 결과 길이가 2 의 거듭제곱을 한 칸 넘는 자리에서도 답이 맞는다", () => {
  for (const n of [3, 5, 9, 17, 33, 65]) {
    const a = coeffs(n, 30, 1);
    const b = coeffs(n, 30, 2);
    expect(fftMultiply(a, b)).toEqual(naive(a, b));
  }
});

/* ───────────────────────── 큰 규모 ───────────────────────── */

test("정본 — 2^16 짜리 배열 둘을 곱해 정의 그대로 센 계수와 같다", () => {
  const N = 1 << 16;
  const a = Array.from({ length: N }, (_, i) => i % 10);
  const b = Array.from({ length: N }, (_, i) => (i * 3) % 10);

  const got = fftMultiply(a, b);
  expect(got.length).toBe(2 * N - 1);

  // 이 규모에서 모든 자리를 정의 그대로 세면 곱셈이 43 억 번이라 자리를 골라 확인한다.
  // 계수의 참값은 최대 65,536 × 81 이라 `number` 로 세도 오차가 없다.
  const spots = [0, 1, 2, N - 1, N, N + 1, 2 * N - 3, 2 * N - 2];
  for (let t = 0; t < 40; t++) spots.push((t * 3271) % (2 * N - 1));
  for (const k of spots) {
    let want = 0;
    const from = Math.max(0, k - (N - 1));
    for (let i = from; i <= Math.min(k, N - 1); i++) {
      want += (a[i] as number) * (b[k - i] as number);
    }
    if (got[k] !== want) {
      throw new Error(
        `자리 ${k} 가 다르다 — 실행 ${got[k]} · 정의 그대로 ${want}`,
      );
    }
  }
});

test("정본 — 길이가 서로 크게 다른 입력에서도 답이 맞는다", () => {
  const a = coeffs(1 << 12, 100, 5);
  const b = coeffs(7, 100, 6);
  const got = fftMultiply(a, b);
  const want = exactConv(a, b, 64n);
  expect(got.length).toBe(want.length);
  for (let k = 0; k < want.length; k++) {
    expect(BigInt(got[k] as number)).toBe(want[k] as bigint);
  }
});

test("정본 — 계수가 상한 근처여도 큰 정수 곱과 같은 계수를 낸다", () => {
  const n = 512;
  const a = coeffs(n, 2_000_000, 1);
  const b = coeffs(n, 2_000_000, 2);
  const got = fftMultiply(a, b);
  const want = exactConv(a, b, 96n);
  for (let k = 0; k < want.length; k++) {
    expect(BigInt(got[k] as number)).toBe(want[k] as bigint);
  }
});
