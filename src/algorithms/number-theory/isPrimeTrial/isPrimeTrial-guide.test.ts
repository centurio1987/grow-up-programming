/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/isPrimeTrial/isPrimeTrial.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(`n = 10^9 + 7` 을 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스가 지키던 것은 **제약 규모에서도 답이 나오고 시도 횟수가
 * `√n` 규모에 머문다는 것**이라, 반환값과 나눗셈 횟수로 다시 건다. 같은 규모의 비용은 본문
 * 「최악을 만드는 입력」이 나눗셈 횟수로 진다.
 *
 * **원본에 없던 케이스 넷을 더 걸었다.** ① 0 부터 2,000 까지 전수에서 정의대로의 판정과
 * 같은가 ② 소수의 제곱이 전부 합성수로 나오는가(루프 조건의 등호가 지키는 자리다)
 * ③ `6k±1` 이면서 합성수인 수를 소수로 착각하지 않는가 ④ 본문 「불변식」이 세운 두 절이
 * 걸음마다 참인가.
 */
import { expect, test } from "bun:test";
import { isPrimeTrial } from "./isPrimeTrial-guide.ref.ts";

/** 정의대로의 판정 — 2 부터 n-1 까지 전부 나눠 본다. */
function primeByDefinition(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d < n; d++) if (n % d === 0) return false;
  return true;
}

const CASES: [string, number, boolean][] = [
  ["2 는 소수", 2, true],
  ["3 은 소수", 3, true],
  ["17 은 소수", 17, true],
  ["100 은 소수가 아니다", 100, false],
  ["0 은 소수가 아니다", 0, false],
  ["1 은 소수가 아니다", 1, false],
  ["음수는 소수가 아니다 (-7)", -7, false],
  ["9 = 3 × 3 은 합성수", 9, false],
  ["49 = 7 × 7 은 합성수", 49, false],
  ["큰 소수 — 999983", 999_983, true],
  ["큰 합성수 — 999999", 999_999, false],
  ["1000003 은 소수", 1_000_003, true],
  ["본문 전개가 쓰는 187 = 11 × 17", 187, false],
];

for (const [name, n, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(isPrimeTrial(n)).toBe(want);
  });
}

test("작은 소수 목록을 모두 판별한다", () => {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  for (const p of primes) expect(isPrimeTrial(p)).toBe(true);
});

test("작은 합성수 목록을 모두 판별한다", () => {
  const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];
  for (const c of composites) expect(isPrimeTrial(c)).toBe(false);
});

test("제약 상한 — n = 10^9 + 7 이 소수로 나오고 시도 횟수가 √n 규모다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 재는 것은 시간이 아니라 반환값과 시도 횟수다.
  const n = 1_000_000_007;
  expect(isPrimeTrial(n)).toBe(true);
  let tries = 0;
  let d = 5;
  let step = 2;
  while (d * d <= n) {
    tries++;
    d += step;
    step = 6 - step;
  }
  expect(tries).toBe(10_540);
  expect(tries).toBeLessThan(Math.sqrt(n));
});

test("작은 값 전수 — 정의대로의 판정과 같다", () => {
  let checked = 0;
  for (let n = -50; n <= 2_000; n++) {
    expect(isPrimeTrial(n)).toBe(primeByDefinition(n));
    checked++;
  }
  expect(checked).toBe(2_051);
});

test("소수의 제곱은 전부 합성수다 — 루프 조건의 등호가 지키는 자리", () => {
  const primes: number[] = [];
  for (let n = 2; n <= 1_000; n++) if (primeByDefinition(n)) primes.push(n);
  expect(primes.length).toBe(168);
  for (const p of primes) expect(isPrimeTrial(p * p)).toBe(false);
});

test("6k±1 이면서 합성수인 수를 소수로 보지 않는다", () => {
  const composites: number[] = [];
  for (let n = 5; n <= 5_000; n++) {
    if (n % 6 !== 1 && n % 6 !== 5) continue;
    if (primeByDefinition(n)) continue;
    composites.push(n);
    expect(isPrimeTrial(n)).toBe(false);
  }
  expect(composites.length).toBe(999);
});

test("불변식 — 루프가 끝날 때까지 √n 이하의 모든 6k±1 후보가 약수가 아니었다", () => {
  for (const n of [97, 187, 999_983, 1_000_003]) {
    const tried: number[] = [];
    let d = 5;
    let step = 2;
    let found = -1;
    while (d * d <= n) {
      tried.push(d);
      if (n % d === 0) {
        found = d;
        break;
      }
      d += step;
      step = 6 - step;
    }
    // 시도한 후보는 전부 6k±1 이고 √n 이하다.
    for (const c of tried) {
      expect(c % 6 === 1 || c % 6 === 5).toBe(true);
      expect(c * c).toBeLessThanOrEqual(n);
    }
    // 마지막 하나를 뺀 나머지는 약수가 아니었다.
    const clean = found === -1 ? tried : tried.slice(0, -1);
    for (const c of clean) expect(n % c).not.toBe(0);
    expect(isPrimeTrial(n)).toBe(found === -1);
  }
});
