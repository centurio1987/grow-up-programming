/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/binomialModP/binomialModP.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(`C(10^5, 5×10^4) mod 10^9+7` 을 200ms 안에)는 그대로 옮기지 않았다 —
 * 실행마다 값이 달라 판정이 안 된다. 그 케이스가 지키던 것은 **제약 상한에서도 값이 나오고
 * 범위 안이라는 것**이라 반환값으로 다시 건다. 같은 규모의 비용은 본문 「최악을 만드는
 * 입력」이 반복 횟수로 진다.
 *
 * **원본에 없던 케이스 넷을 더 걸었다.** ① 작은 값 전수에서 정의대로의 이항 계수와 같은가
 * ② 자릿수 분해가 정의대로의 값과 어긋나지 않는가(`n ≥ p` 를 전수로) ③ 파스칼 규칙
 * `C(n,k) = C(n-1,k-1) + C(n-1,k)` 가 법 안에서 성립하는가 ④ 본문 「불변식」이 세운 두 누적이
 * 걸음마다 참인가.
 */
import { expect, test } from "bun:test";
import { binomialModP } from "./binomialModP-guide.ref.ts";

/** 정의대로의 이항 계수 — 나머지를 쓰지 않고 큰 정수로 그대로 계산한다. */
function exactBinomial(n: bigint, k: bigint): bigint {
  if (k < 0n || k > n) return 0n;
  const j = n - k < k ? n - k : k;
  let r = 1n;
  for (let i = 0n; i < j; i++) r = (r * (n - i)) / (i + 1n);
  return r;
}

const P = 1_000_000_007n;

const CASES: [string, bigint, bigint, bigint, bigint][] = [
  ["C(5, 2) = 10", 5n, 2n, P, 10n],
  ["C(10, 3) = 120", 10n, 3n, P, 120n],
  ["C(20, 10) = 184756", 20n, 10n, P, 184756n],
  ["작은 법 — C(6, 3) mod 7", 6n, 3n, 7n, 6n],
  ["C(n, 0) = 1", 100n, 0n, P, 1n],
  ["C(n, n) = 1", 100n, 100n, P, 1n],
  ["C(0, 0) = 1", 0n, 0n, 7n, 1n],
  ["k > n 이면 0", 5n, 10n, P, 0n],
  ["C(n, 1) = n mod p", 123_456_789n, 1n, P, 123_456_789n],
  ["자릿수 분해 — C(10, 3) mod 3", 10n, 3n, 3n, 0n],
  ["자릿수 분해 — C(7, 3) mod 5", 7n, 3n, 5n, 0n],
  ["자릿수 분해 — C(6, 2) mod 5", 6n, 2n, 5n, 0n],
  ["본문 전개가 쓰는 C(34, 20) mod 7", 34n, 20n, 7n, 6n],
  ["자릿수가 안 지워지는 C(15, 7) mod 7", 15n, 7n, 7n, 2n],
];

for (const [name, n, k, p, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(binomialModP(n, k, p)).toBe(want);
  });
}

test("대칭성 — C(30, 7) 과 C(30, 23) 이 같다", () => {
  expect(binomialModP(30n, 7n, P)).toBe(binomialModP(30n, 23n, P));
});

test("C(100, 50) mod 10^9+7 이 미리 계산한 값과 같다", () => {
  const exact = 100_891_344_545_564_193_334_812_497_256n;
  expect(binomialModP(100n, 50n, P)).toBe(exact % P);
});

test("제약 상한 — C(10^5, 5×10^4) mod 10^9+7 이 범위 안의 값을 낸다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 재는 것은 시간이 아니라 반환값이다.
  const result = binomialModP(100_000n, 50_000n, P);
  expect(result).toBe(149_033_233n);
  expect(result >= 0n && result < P).toBe(true);
});

test("작은 값 전수 — 정의대로의 이항 계수와 같다", () => {
  let checked = 0;
  for (let n = 0n; n <= 40n; n++) {
    for (let k = 0n; k <= 40n; k++) {
      expect(binomialModP(n, k, P)).toBe(exactBinomial(n, k) % P);
      checked++;
    }
  }
  expect(checked).toBe(41 * 41);
});

test("자릿수 분해 전수 — n 이 p 보다 큰 자리에서도 정의대로다", () => {
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n]) {
    for (let n = 0n; n <= 60n; n++) {
      for (let k = 0n; k <= n; k++) {
        expect(binomialModP(n, k, p)).toBe(exactBinomial(n, k) % p);
      }
    }
  }
});

test("파스칼 규칙이 법 안에서 성립한다", () => {
  for (const p of [7n, 101n, P]) {
    for (let n = 1n; n <= 60n; n++) {
      for (let k = 1n; k <= n; k++) {
        const left = binomialModP(n, k, p);
        const right =
          (binomialModP(n - 1n, k - 1n, p) + binomialModP(n - 1n, k, p)) % p;
        expect(left).toBe(right);
      }
    }
  }
});

test("불변식 — 반복 i 번을 마치면 num 이 내림차순 곱이고 den 이 i! 이다", () => {
  // 정본과 같은 반복문에 확인만 덧붙여, 본문 「불변식」이 세운 두 누적을 값으로 건다.
  const n = 34n;
  const k = 20n;
  const p = 7n;
  // 자릿수 하나를 떼어 낸 뒤의 자리 — n = 4, k = 2 다.
  const a = n / p;
  const b = k / p;
  const j = a - b < b ? a - b : b;
  let num = 1n;
  let den = 1n;
  let wantNum = 1n;
  let wantDen = 1n;
  for (let i = 0n; i < j; i++) {
    num = (num * (a - i)) % p;
    den = (den * (i + 1n)) % p;
    wantNum *= a - i;
    wantDen *= i + 1n;
    expect(num).toBe(wantNum % p);
    expect(den).toBe(wantDen % p);
    expect(num % p === 0n).toBe(false);
    expect(den % p === 0n).toBe(false);
  }
  expect(j).toBe(2n);
  expect(num).toBe(5n);
  expect(den).toBe(2n);
});

test("반환값이 언제나 [0, p) 안이다", () => {
  for (const p of [2n, 5n, 7n, 1009n, P]) {
    for (let n = 0n; n <= 30n; n++) {
      for (let k = -2n; k <= 32n; k++) {
        const r = binomialModP(n, k, p);
        expect(r >= 0n && r < p).toBe(true);
      }
    }
  }
});
