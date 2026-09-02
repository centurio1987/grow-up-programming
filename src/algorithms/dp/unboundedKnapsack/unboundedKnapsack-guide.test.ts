/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { unboundedKnapsack } from "./unboundedKnapsack-guide.ref.ts";

const CASES: [number[], number, number][] = [
  // 기본
  [[1, 2, 5], 11, 3],
  [[2], 3, -1],
  [[1], 0, 0],
  [[1, 3, 4], 6, 2],
  // 엣지
  [[2, 5], 0, 0],
  [[], 0, 0],
  [[], 5, -1],
  [[7, 7, 7], 7, 1],
  // 바운더리
  [[1, 2, 5], 1, 1],
  [[1], 10_000, 10_000],
  [[10_000], 10_000, 1],
  [[5, 10], 3, -1],
];

for (const [coins, amount, want] of CASES) {
  test(`정본 — unboundedKnapsack([${coins.join(", ")}], ${amount}) = ${want}`, () => {
    expect(unboundedKnapsack(coins, amount)).toBe(want);
  });
}

test("성능 케이스와 같은 입력 — n=100, amount=10,000 에서 답이 나온다", () => {
  const coins = Array.from({ length: 100 }, (_, i) => i + 1);
  expect(unboundedKnapsack(coins, 10_000)).toBe(100);
});

test("전개가 쓰는 입력 — 액면가 순서를 바꿔도 답이 같다", () => {
  expect(unboundedKnapsack([3, 4, 1], 6)).toBe(2);
  expect(unboundedKnapsack([1, 3, 4], 6)).toBe(2);
  expect(unboundedKnapsack([4, 1, 3], 6)).toBe(2);
});

test("본문 불변식이 드는 자리 — 같은 액면가를 몇 개든 쓴다", () => {
  expect(unboundedKnapsack([3], 9)).toBe(3);
  expect(unboundedKnapsack([3], 10)).toBe(-1);
  expect(unboundedKnapsack([3, 4], 6)).toBe(2);
});

test("본문 수식 절이 드는 자리 — 액면가 3 과 4 로 못 만드는 가장 큰 금액은 5 다", () => {
  for (const a of [1, 2, 5]) expect(unboundedKnapsack([3, 4], a)).toBe(-1);
  for (let a = 6; a <= 40; a++) {
    expect(unboundedKnapsack([3, 4], a)).toBeGreaterThan(0);
  }
});
