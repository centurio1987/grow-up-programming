/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci.test.ts` 는
 * 학습자가 채우는 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시
 * 건다. 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 *
 * **원본의 `n = 10^18` 케이스 둘은 옮길 수 없다.** 「양의 bigint 를 돌려준다」와 「100ms
 * 이내에 처리한다」인데, `F(10^18)` 은 십진 자릿수가 208,987,640,249,978,734 자리라
 * 메모리 제한 256 MB 의 3 억 배가 넘는 값이다. 이 절차의 문제가 아니라 출력 크기의 문제라
 * **어떤 구현으로도** 그 값을 정확히 돌려줄 수 없다. 원본 케이스가 실제로 확인하려던 것
 * (「지수 규모가 커도 걸음 수가 로그로 끝난다」)은 아래 「행렬 곱 횟수」 케이스가 값을
 * 담을 수 있는 규모에서 벽시계 없이 확인한다. 그 사실은 가이드 본문의 두 번째 「멈춤」과
 * 「비용 계산」이 값으로 적어 두었다.
 */
import { expect, test } from "bun:test";
import {
  IDENTITY,
  type Mat,
  matrixPowerFibonacci,
  multiply,
  TRANSITION,
} from "./matrixPowerFibonacci-guide.ref.ts";

const CASES: [bigint, bigint][] = [
  // 기본 동작 — 문제 예시
  [0n, 0n],
  [1n, 1n],
  [2n, 1n],
  [3n, 2n],
  [10n, 55n],
  [20n, 6765n],
  [50n, 12_586_269_025n],
  [100n, 354_224_848_179_261_915_075n],
  [200n, 280_571_172_992_510_140_037_611_932_413_038_677_189_525n],
];

for (const [n, want] of CASES) {
  test(`정본 — F(${n})`, () => {
    expect(matrixPowerFibonacci(n)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(matrixPowerFibonacci(10n)).toBe(55n);
});

test("점화식 F(n) = F(n-1) + F(n-2) 가 성립한다 (n = 2..30)", () => {
  let a = 0n;
  let b = 1n;
  for (let n = 2; n <= 30; n++) {
    const expected = a + b;
    expect(matrixPowerFibonacci(BigInt(n))).toBe(expected);
    a = b;
    b = expected;
  }
});

test("반환값은 bigint 다", () => {
  expect(typeof matrixPowerFibonacci(10n)).toBe("bigint");
});

/** 정의를 그대로 옮긴 답. 한 걸음씩 더한다. */
function byAddition(n: number): bigint {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

test("0 이상 512 미만 전수에서 한 걸음씩 더한 답과 같다", () => {
  for (let n = 0; n < 512; n++) {
    expect(matrixPowerFibonacci(BigInt(n))).toBe(byAddition(n));
  }
});

test("M^n 의 네 칸이 연속한 세 피보나치 수다", () => {
  for (const n of [1, 2, 3, 5, 10, 64, 100]) {
    let acc: Mat = IDENTITY;
    let step: Mat = TRANSITION;
    let e = BigInt(n);
    while (e > 0n) {
      if ((e & 1n) === 1n) acc = multiply(acc, step);
      step = multiply(step, step);
      e >>= 1n;
    }
    expect(acc[0][0]).toBe(byAddition(n + 1));
    expect(acc[0][1]).toBe(byAddition(n));
    expect(acc[1][0]).toBe(byAddition(n));
    expect(acc[1][1]).toBe(byAddition(n - 1));
  }
});

test("행렬 곱 횟수가 비트 수와 1 인 비트의 합이다", () => {
  // 원본의 「n = 10^18 성능」 케이스가 확인하려던 것 — 걸음 수가 n 이 아니라 로그다.
  // 벽시계를 재지 않고 횟수만 센다.
  const counted = (n: bigint): number => {
    let e = n;
    let muls = 0;
    while (e > 0n) {
      if ((e & 1n) === 1n) muls++;
      muls++;
      e >>= 1n;
    }
    return muls;
  };
  const shape = (n: bigint): number => {
    const bits = n === 0n ? "" : n.toString(2);
    return bits.length + [...bits].filter((c) => c === "1").length;
  };
  for (const n of [0n, 1n, 10n, 1_000n, 1_000_000n, 10n ** 18n]) {
    expect(counted(n)).toBe(shape(n));
  }
  expect(counted(10n ** 18n)).toBe(84);
});

test("곱하는 두 행렬의 좌우를 바꿔도 답이 같다", () => {
  // 같은 M 의 거듭제곱끼리는 교환된다 — 첫 번째 「멈춤」이 값으로 보인 것이다.
  const rightToLeft = (n: bigint): bigint => {
    let acc: Mat = IDENTITY;
    let step: Mat = TRANSITION;
    let e = n;
    while (e > 0n) {
      if ((e & 1n) === 1n) acc = multiply(step, acc);
      step = multiply(step, step);
      e >>= 1n;
    }
    return acc[0][1];
  };
  for (const n of [0n, 1n, 2n, 3n, 5n, 10n, 13n, 20n, 100n]) {
    expect(rightToLeft(n)).toBe(matrixPowerFibonacci(n));
  }
});

test("누적과 제곱의 앞뒤를 바꾸면 F(2n) 이 나온다", () => {
  // 첫 번째 「멈춤」의 반례. 답이 여전히 피보나치 수라 눈으로는 안 갈린다.
  const squareFirst = (n: bigint): bigint => {
    let acc: Mat = IDENTITY;
    let step: Mat = TRANSITION;
    let e = n;
    while (e > 0n) {
      step = multiply(step, step);
      if ((e & 1n) === 1n) acc = multiply(acc, step);
      e >>= 1n;
    }
    return acc[0][1];
  };
  for (const n of [0n, 1n, 2n, 3n, 5n, 10n, 13n, 20n]) {
    expect(squareFirst(n)).toBe(matrixPowerFibonacci(2n * n));
  }
  expect(squareFirst(10n)).toBe(6765n);
});
