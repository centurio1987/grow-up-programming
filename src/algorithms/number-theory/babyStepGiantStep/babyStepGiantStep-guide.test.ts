/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/babyStepGiantStep/babyStepGiantStep.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 대신 같은 규모(`m = 10^9+7`)를 **값으로** 확인하는 케이스를 남긴다.
 */
import { expect, test } from "bun:test";
import {
  babyStepGiantStep,
  ceilSqrt,
  power,
} from "./babyStepGiantStep-guide.ref.ts";

const CASES: [bigint, bigint, bigint, bigint][] = [
  // 가이드 「수행으로 알아보는 알고리즘」과 같은 입력이다.
  [5n, 33n, 58n, 9n],
  [2n, 3n, 5n, 3n],
  [3n, 13n, 17n, 4n],
  [2n, 1n, 7n, 0n], // 가장 작은 x 를 돌려준다
  [7n, 1n, 13n, 0n],
  [2n, 3n, 4n, -1n], // 해가 없다
  [3n, 3n, 7n, 1n],
  [2n, 5n, 13n, 9n],
  [15n, 3n, 12n, 1n], // a 를 m 으로 정규화한다. 가이드 두 번째 멈춤의 입력이다
];

for (const [a, b, m, want] of CASES) {
  test(`babyStepGiantStep(${a}n, ${b}n, ${m}n) = ${want}n`, () => {
    expect(babyStepGiantStep(a, b, m)).toBe(want);
  });
}

test("큰 소수 m = 10^9+7 에서 실제 해를 찾는다", () => {
  const p = 1000000007n;
  const a = 5n;
  const k = 12345n;
  let b = 1n;
  for (let i = 0n; i < k; i++) b = (b * a) % p;

  const x = babyStepGiantStep(a, b, p);
  expect(x).toBe(12345n);
  expect(power(a, x, p)).toBe(b);
});

test("ceilSqrt 는 ⌈√m⌉ 이다", () => {
  expect(ceilSqrt(58n)).toBe(8n); // 7.61… → 8
  expect(ceilSqrt(64n)).toBe(8n); // 정확한 제곱수는 그대로
  expect(ceilSqrt(65n)).toBe(9n);
  expect(ceilSqrt(1n)).toBe(1n);
  expect(ceilSqrt(0n)).toBe(0n);
});

test("power 는 반복 제곱으로 같은 값을 낸다", () => {
  expect(power(5n, 8n, 58n)).toBe(53n);
  expect(power(5n, 9n, 58n)).toBe(33n); // 전개의 검산
  expect(power(3n, 0n, 7n)).toBe(1n);
});
