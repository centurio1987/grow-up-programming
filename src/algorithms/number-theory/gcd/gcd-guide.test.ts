/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/gcd/gcd.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(피보나치 유사 큰 수 1,000 회를 100ms 안에)는 그대로 옮기지 않았다 —
 * 실행마다 값이 달라 판정이 안 된다. 그 케이스가 지키던 것은 **큰 bigint 에서 답이 나온다**는
 * 것이라 반환값으로 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 나눗셈 횟수로 진다.
 *
 * **원본에 없던 케이스 셋을 더 걸었다.** ① 정의대로의 풀이(작은 값 전수)와 답이 같은가
 * ② 두 인자 순서를 바꿔도 같은가 ③ 부호 네 조합이 전부 같은가.
 */
import { expect, test } from "bun:test";
import { gcd } from "./gcd-guide.ref.ts";

const CASES: [string, bigint, bigint, bigint][] = [
  ["12 와 18", 12n, 18n, 6n],
  ["100 과 75", 100n, 75n, 25n],
  ["서로소 7 과 13", 7n, 13n, 1n],
  ["한쪽이 배수 15 와 45", 15n, 45n, 15n],
  ["둘 다 0", 0n, 0n, 0n],
  ["7 과 0", 7n, 0n, 7n],
  ["0 과 9", 0n, 9n, 9n],
  ["같은 값 7 과 7", 7n, 7n, 7n],
  ["-12 와 18", -12n, 18n, 6n],
  ["-12 와 -18", -12n, -18n, 6n],
  ["2^60 과 2^30", 1n << 60n, 1n << 30n, 1n << 30n],
  ["1000003 과 2000006", 1_000_003n, 2_000_006n, 1_000_003n],
  ["본문 전개가 쓰는 -273 과 441", -273n, 441n, 21n],
];

for (const [name, a, b, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(gcd(a, b)).toBe(want);
  });
}

test("작은 값 전수에서 정의대로의 풀이와 답이 같다", () => {
  // 0~120 의 모든 쌍에서, 둘 다 나누는 가장 큰 수를 하나씩 찾아 대조한다.
  const naive = (a: bigint, b: bigint): bigint => {
    if (a === 0n) return b;
    if (b === 0n) return a;
    const limit = a < b ? a : b;
    let best = 1n;
    for (let d = 1n; d <= limit; d++)
      if (a % d === 0n && b % d === 0n) best = d;
    return best;
  };
  let checked = 0;
  for (let a = 0n; a <= 120n; a++) {
    for (let b = 0n; b <= 120n; b++) {
      expect(gcd(a, b)).toBe(naive(a, b));
      checked++;
    }
  }
  expect(checked).toBe(121 * 121);
});

test("두 인자의 순서를 바꿔도 같다", () => {
  for (let a = 0n; a <= 60n; a++) {
    for (let b = 0n; b <= 60n; b++) expect(gcd(a, b)).toBe(gcd(b, a));
  }
});

test("부호 네 조합이 전부 같다", () => {
  for (const [a, b] of [
    [12n, 18n],
    [273n, 441n],
    [1_000_003n, 2_000_006n],
  ] as [bigint, bigint][]) {
    const want = gcd(a, b);
    expect(gcd(-a, b)).toBe(want);
    expect(gcd(a, -b)).toBe(want);
    expect(gcd(-a, -b)).toBe(want);
  }
});

test("피보나치 이웃 쌍 같은 큰 bigint 에서 답이 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 재는 것은 시간이 아니라 반환값이다.
  let x = 0n;
  let y = 1n;
  for (let i = 0; i < 200; i++) {
    const next = x + y;
    x = y;
    y = next;
  }
  // 이웃한 피보나치 수는 서로소다.
  expect(gcd(y, x)).toBe(1n);
  // 같은 수를 21 배 하면 최대공약수도 21 배가 된다.
  expect(gcd(y * 21n, x * 21n)).toBe(21n);
});
