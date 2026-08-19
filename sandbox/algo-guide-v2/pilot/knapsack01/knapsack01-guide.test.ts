/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/knapsack01/knapsack01.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 대신 같은 규모(n=100, W=10000)를 **값으로** 확인하는 케이스를 남긴다.
 */
import { expect, test } from "bun:test";
import { knapsack01 } from "./knapsack01-guide.ref.ts";

const CASES: [number[], number[], number, number][] = [
  // 가이드 「한 입력으로 끝까지 굴려 보기」와 같은 입력이다.
  [[1, 3, 4, 5], [1, 4, 5, 7], 7, 9],
  [[3, 4], [4, 5], 4, 5],
  [[1, 2, 3], [10, 20, 30], 10, 60],
  [[], [], 10, 0],
  [[1, 2, 3], [10, 20, 30], 0, 0],
  [[10, 20, 30], [100, 200, 300], 5, 0],
  [[5], [42], 5, 42],
  [[3, 3, 3], [1, 5, 3], 3, 5],
  [[10], [100], 5, 0],
  [[10000], [10000], 10000, 10000],
];

for (const [weights, values, W, want] of CASES) {
  test(`knapsack01([${weights}], [${values}], ${W}) = ${want}`, () => {
    expect(knapsack01(weights, values, W)).toBe(want);
  });
}

test("무게 1짜리 100개는 전부 담긴다", () => {
  const w = new Array(100).fill(1);
  const v = new Array(100).fill(7);
  expect(knapsack01(w, v, 10_000)).toBe(700);
});
