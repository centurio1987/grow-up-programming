/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/extendedEuclidean/extendedEuclidean.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(큰 bigint 1,000 회를 100ms 안에)는 그대로 옮기지 않았다 — 실행마다
 * 값이 달라 판정이 안 된다. 그 케이스가 지키던 것은 **큰 bigint 에서 항등식이 성립한다**는
 * 것이라 반환값으로 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 걸음 수로 진다.
 *
 * **원본에 없던 케이스 넷을 더 걸었다.** ① 작은 값 전수에서 항등식과 `g` 가 정의대로인가
 * ② 두 인자 순서를 바꾸면 계수도 자리를 바꾸는가 ③ 계수 상한 `|x| ≤ B/(2g)` 를 지키는가
 * ④ 본문 「수식 정의와 유도」가 세운 항등식이 걸음마다 참인가.
 */
import { expect, test } from "bun:test";
import { extendedEuclidean } from "./extendedEuclidean-guide.ref.ts";

const abs = (v: bigint): bigint => (v < 0n ? -v : v);

/** 정의대로의 최대공약수 — 작은 값 전수 대조에 쓴다. */
function naiveGcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x;
}

const CASES: [string, bigint, bigint, bigint][] = [
  ["30 과 18", 30n, 18n, 6n],
  ["35 와 15", 35n, 15n, 5n],
  ["서로소 17 과 5", 17n, 5n, 1n],
  ["3 과 11 — 모듈러 역원의 자리", 3n, 11n, 1n],
  ["둘 다 0", 0n, 0n, 0n],
  ["7 과 0", 7n, 0n, 7n],
  ["0 과 9", 0n, 9n, 9n],
  ["음수 -30 과 18", -30n, 18n, 6n],
  ["같은 값 13 과 13", 13n, 13n, 13n],
  ["큰 소수 쌍", 1_000_000_007n, 998_244_353n, 1n],
  ["본문 전개가 쓰는 -510 과 183", -510n, 183n, 3n],
];

for (const [name, a, b, want] of CASES) {
  test(`정본 — ${name}`, () => {
    const { g, x, y } = extendedEuclidean(a, b);
    expect(g).toBe(want);
    expect(a * x + b * y).toBe(g);
  });
}

test("3^-1 mod 11 = 4", () => {
  const { g, x } = extendedEuclidean(3n, 11n);
  expect(g).toBe(1n);
  expect(((x % 11n) + 11n) % 11n).toBe(4n);
});

test("계약의 경계 넷 — 0 과 부호", () => {
  expect(extendedEuclidean(0n, 0n)).toEqual({ g: 0n, x: 0n, y: 0n });
  expect(extendedEuclidean(7n, 0n)).toEqual({ g: 7n, x: 1n, y: 0n });
  expect(extendedEuclidean(-7n, 0n)).toEqual({ g: 7n, x: -1n, y: 0n });
  expect(extendedEuclidean(0n, -9n)).toEqual({ g: 9n, x: 0n, y: -1n });
});

test("작은 값 전수에서 g 가 정의대로이고 항등식이 성립한다", () => {
  let checked = 0;
  for (let a = -40n; a <= 40n; a++) {
    for (let b = -40n; b <= 40n; b++) {
      const { g, x, y } = extendedEuclidean(a, b);
      expect(g).toBe(naiveGcd(a, b));
      expect(a * x + b * y).toBe(g);
      checked++;
    }
  }
  expect(checked).toBe(81 * 81);
});

test("두 인자의 순서를 바꾸면 g 가 같고 항등식도 성립한다", () => {
  for (let a = 0n; a <= 60n; a++) {
    for (let b = 0n; b <= 60n; b++) {
      const first = extendedEuclidean(a, b);
      const second = extendedEuclidean(b, a);
      expect(second.g).toBe(first.g);
      expect(b * second.x + a * second.y).toBe(second.g);
    }
  }
});

test("계수 상한 — A > B >= 1 에서 |x| <= B/(2g) 이고 |y| <= A/(2g)", () => {
  // 본문 「수식 정의와 유도」가 닫은 상한. A = B 는 그 상한 밖이라 뺀다.
  for (let a = 2n; a <= 200n; a++) {
    for (let b = 1n; b < a; b++) {
      const { g, x, y } = extendedEuclidean(a, b);
      expect(2n * abs(x) <= b / g).toBe(true);
      expect(2n * abs(y) <= a / g).toBe(true);
    }
  }
});

test("걸음마다 A·s + B·t = r 이 참이다", () => {
  // 정본과 같은 절차에 상태를 덧붙여, 본문이 세운 불변식을 전개 입력에서 확인한다.
  const A = 510n;
  const B = 183n;
  let r0 = A;
  let r1 = B;
  let s0 = 1n;
  let s1 = 0n;
  let t0 = 0n;
  let t1 = 1n;
  let steps = 0;
  while (r1 !== 0n) {
    expect(A * s0 + B * t0).toBe(r0);
    expect(A * s1 + B * t1).toBe(r1);
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
    steps++;
  }
  expect(steps).toBe(6);
  expect(r0).toBe(3n);
  expect(s0).toBe(14n);
  expect(t0).toBe(-39n);
  // 마지막에 남는 계수 쌍은 0 을 만드는 조합이다.
  expect(A * s1 + B * t1).toBe(0n);
});

test("피보나치 이웃 같은 큰 bigint 에서 항등식이 성립한다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 재는 것은 시간이 아니라 반환값이다.
  let x = 0n;
  let y = 1n;
  for (let i = 0; i < 200; i++) {
    const next = x + y;
    x = y;
    y = next;
  }
  const one = extendedEuclidean(y, x);
  expect(one.g).toBe(1n);
  expect(y * one.x + x * one.y).toBe(1n);
  const three = extendedEuclidean(y * 3n, x * 3n);
  expect(three.g).toBe(3n);
  expect(y * 3n * three.x + x * 3n * three.y).toBe(3n);
});
