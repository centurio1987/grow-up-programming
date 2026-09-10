/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/coinChangeWays/coinChangeWays.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { coinChangeWays } from "./coinChangeWays-guide.ref.ts";

const CASES: [number[], number, number][] = [
  // 기본
  [[1, 2, 5], 5, 4],
  [[2], 3, 0],
  [[1, 2, 3], 4, 4],
  // 엣지
  [[1, 2, 5], 0, 1],
  [[], 0, 1],
  [[], 5, 0],
  [[10], 10, 1],
  // 바운더리
  [[1, 5, 10], 1, 1],
  [[1], 10_000, 1],
  [[5, 10], 3, 0],
];

for (const [coins, amount, want] of CASES) {
  test(`정본 — coinChangeWays([${coins.join(", ")}], ${amount}) = ${want}`, () => {
    expect(coinChangeWays(coins, amount)).toBe(want);
  });
}

test("순서는 구분하지 않는다 — [1,2] 와 [2,1] 이 같은 값", () => {
  expect(coinChangeWays([1, 2], 3)).toBe(coinChangeWays([2, 1], 3));
});

test("제약 최대 — n=100, amount=10^4 에서 음이 아닌 값이 나온다", () => {
  const coins = Array.from({ length: 100 }, (_, i) => i + 1);
  expect(coinChangeWays(coins, 10_000)).toBeGreaterThanOrEqual(0);
});

test("본문 perf.worst 가 드는 자리 — 답이 2^53 을 넘으면 정확한 정수가 아니다", () => {
  const coins = Array.from({ length: 100 }, (_, i) => i + 1);
  // 정확한 답은 9,210,000,088,861,191 이고 이 코드는 3 만큼 큰 값을 낸다.
  expect(coinChangeWays(coins, 300)).toBe(9_210_000_088_861_194);
  // 2^53 아래에서는 정확하다.
  expect(coinChangeWays(coins, 200)).toBe(3_971_546_606_112);
});
