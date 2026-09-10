/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/subarraySumEqualsK/subarraySumEqualsK.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**
 * (N=100,000 · k=5 에서의 답)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { subarraySumEqualsK } from "./subarraySumEqualsK-guide.ref.ts";

const CASES: [number[], number, number][] = [
  // 기본
  [[1, 1, 1], 2, 2],
  [[1, 2, 3], 3, 2],
  [[3, 4, 7, 2, -3, 1, 4, 2], 7, 4],
  // 엣지
  [[1, -1, 1, -1], 0, 4],
  [[0, 0, 0], 0, 6],
  [[1, 2, 3], 100, 0],
  [[-1, -1, 1], -2, 1],
  // 바운더리
  [[5], 5, 1],
  [[5], 1, 0],
  [[0], 0, 1],
];

for (const [nums, k, want] of CASES) {
  test(`정본 — ${JSON.stringify(nums)} · k=${k}`, () => {
    expect(subarraySumEqualsK([...nums], k)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(subarraySumEqualsK([3, 4, 7, 2, -3, 1, 4, 2], 7)).toBe(4);
});

test("N=100,000 · 전부 1 · k=5 에서의 답", () => {
  const N = 100_000;
  const nums = new Array<number>(N).fill(1);
  // 길이 5 짜리 구간이 N−4 개이고 그 밖에는 합이 5 인 구간이 없다.
  expect(subarraySumEqualsK(nums, 5)).toBe(N - 4);
});

test("답이 가장 많아지는 입력 — 전부 0 · k=0", () => {
  const N = 1_000;
  const nums = new Array<number>(N).fill(0);
  expect(subarraySumEqualsK(nums, 0)).toBe((N * (N + 1)) / 2);
});

test("배열이 비면 0 이다", () => {
  expect(subarraySumEqualsK([], 0)).toBe(0);
  expect(subarraySumEqualsK([], 7)).toBe(0);
});
