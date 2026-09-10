/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/pollardRho/pollardRho.test.ts` 는 학습자가 채우는
 * 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를
 * 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(`999,999,937 × 1,000,000,007`)은 아래에서 반환값으로 확인하고, 같은 자리에서
 * 이 편이 세는 계수도 함께 본다.
 *
 * **두 번째 판정기로 시행 나눗셈을 쓴다.** 정본이 스스로를 근거로 통과하는 것을 막으려면
 * 다른 절차의 답과 맞춰야 한다. 시행 나눗셈은 `10^7` 안쪽에서 실용적이라 그 범위를 전수로
 * 대조하고, 그 밖은 소인수를 곱해 되돌리는 방식으로 확인한다.
 */
import { expect, test } from "bun:test";
import { counted, factorize, trialDivision } from "./pollardRho-guide.proof.ts";
import { pollardRho } from "./pollardRho-guide.ref.ts";

/** 반환값이 계약을 지키는가 — `n` 의 약수이고, 합성수이면 `1 < d < n` 이다. */
function 계약을지키는가(n: bigint, composite: boolean): void {
  const d = pollardRho(n);
  expect(n % d).toBe(0n);
  expect(d > 1n).toBe(true);
  expect(d <= n).toBe(true);
  if (composite) expect(d < n).toBe(true);
  else expect(d).toBe(n);
}

test("n = 15 는 3 이나 5 를 돌려준다", () => {
  계약을지키는가(15n, true);
  expect([3n, 5n]).toContain(pollardRho(15n));
});

test("n = 21 은 3 이나 7 을 돌려준다", () => {
  계약을지키는가(21n, true);
  expect([3n, 7n]).toContain(pollardRho(21n));
});

test("본문 전개가 쓰는 입력 — 8,051 = 83 × 97", () => {
  expect(8_051n).toBe(83n * 97n);
  계약을지키는가(8_051n, true);
  expect([83n, 97n]).toContain(pollardRho(8_051n));
});

test("두 큰 소수의 곱 — 1,000,007 × 1,000,003", () => {
  const n = 1_000_007n * 1_000_003n;
  계약을지키는가(n, true);
});

test("짝수는 2 를 돌려준다", () => {
  expect(pollardRho(2n * 1_000_003n)).toBe(2n);
  expect(pollardRho(4n)).toBe(2n);
  expect(pollardRho(1n << 40n)).toBe(2n);
});

test("제곱수 49 = 7 × 7", () => {
  expect(pollardRho(49n)).toBe(7n);
});

test("세제곱수 27 = 3 × 3 × 3", () => {
  계약을지키는가(27n, true);
});

test("64 비트 근방 합성수 — 1,000,000,007 × 1,000,000,009", () => {
  const p = 1_000_000_007n;
  const q = 1_000_000_009n;
  계약을지키는가(p * q, true);
  expect([p, q]).toContain(pollardRho(p * q));
});

test("작은 소인수를 포함한 합성수 — 3 × 1,000,000,007", () => {
  계약을지키는가(3n * 1_000_000_007n, true);
});

test("원본 성능 케이스와 같은 입력 — 999,999,937 × 1,000,000,007", () => {
  const n = 999_999_937n * 1_000_000_007n;
  계약을지키는가(n, true);
  // 벽시계 대신 결정론적 계수를 본다. 이 편이 세는 단위로 백만 번 아래다.
  const c = counted(n);
  expect(c.ops).toBeLessThan(1_000_000);
  expect(c.rounds).toBe(1);
});

test("소수는 자기 자신을 돌려준다", () => {
  for (const p of [3n, 5n, 97n, 1_000_003n, 1_000_000_007n, (1n << 61n) - 1n]) {
    계약을지키는가(p, false);
  }
});

test("반환값이 소수라는 보장은 없다 — 63 은 21 을 돌려준다", () => {
  const d = pollardRho(63n);
  expect(d).toBe(21n);
  expect(factorize(d)).toEqual([3n, 7n]);
  expect(63n % d).toBe(0n);
});

test("첫 상수로 못 찾는 입력 — 21 과 25 는 c 를 한 번 올린다", () => {
  for (const n of [21n, 25n]) {
    expect(counted(n).rounds).toBe(2);
    계약을지키는가(n, true);
  }
});

test("3 부터 20,001 까지 홀수에서 시행 나눗셈과 어긋나지 않는다", () => {
  for (let v = 3n; v <= 20_001n; v += 2n) {
    const d = pollardRho(v);
    const t = trialDivision(v);
    expect(v % d).toBe(0n);
    // 시행 나눗셈이 v 자신을 낸 줄은 소수이고, 그때만 정본도 v 자신을 낸다.
    expect(d === v).toBe(t === v);
  }
});

test("반복 제곱 소인수도 특별 취급 없이 처리한다", () => {
  for (const [n, factors] of [
    [9n, [3n, 3n]],
    [25n, [5n, 5n]],
    [121n, [11n, 11n]],
    [1_000_003n * 1_000_003n, [1_000_003n, 1_000_003n]],
  ] as [bigint, bigint[]][]) {
    expect(factors.reduce((a, b) => a * b, 1n)).toBe(n);
    계약을지키는가(n, true);
  }
});

test("같은 입력을 두 번 넣으면 반환값도 계수도 같다", () => {
  for (const n of [8_051n, 10_403n, 63n, 1_000_036_000_099n]) {
    expect(pollardRho(n)).toBe(pollardRho(n));
    expect(counted(n).ops).toBe(counted(n).ops);
  }
});

test("전개 입력의 두 소인수가 모두 소수다", () => {
  for (const p of [83n, 97n]) {
    expect(trialDivision(p)).toBe(p);
  }
});
