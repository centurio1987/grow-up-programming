/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/subsetSum/subsetSum.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { subsetSum } from "./subsetSum-guide.ref.ts";

const CASES: [number[], number, boolean][] = [
  // 기본
  [[3, 34, 4, 12, 5, 2], 9, true],
  [[3, 34, 4, 12, 5, 2], 30, false],
  [[1, 2, 3, 4], 7, true],
  // 엣지
  [[1, 2, 3], 0, true],
  [[], 0, true],
  [[], 5, false],
  [[0, 1, 2], 0, true],
  [[7], 7, true],
  [[7], 8, false],
  [[1, 2, 3, 4], 10, true],
  // 바운더리
  [[100, 200], 50, false],
  [[10_000], 10_000, true],
];

for (const [nums, target, want] of CASES) {
  test(`정본 — subsetSum([${nums.join(", ")}], ${target}) = ${want}`, () => {
    expect(subsetSum(nums, target)).toBe(want);
  });
}

test("바운더리 — 1 이 1,000 개, target 500", () => {
  expect(subsetSum(new Array(1000).fill(1), 500)).toBe(true);
});

test("제약 최대 — n=1000, target=10^4 에서 참/거짓이 나온다", () => {
  const nums = Array.from({ length: 1000 }, (_, i) => (i % 100) + 1);
  expect(subsetSum(nums, 10_000)).toBe(true);
});

test("본문 perf.worst 가 드는 자리 — 21 의 배수만 만들 수 있으면 10,000 은 못 만든다", () => {
  expect(subsetSum(new Array(1000).fill(21), 10_000)).toBe(false);
  expect(subsetSum(new Array(1000).fill(20), 10_000)).toBe(true);
});

test("본문 invariant 가 드는 자리 — 원소 하나를 두 번 쓸 수 없다", () => {
  expect(subsetSum([3], 9)).toBe(false);
  expect(subsetSum([3, 4], 8)).toBe(false);
  expect(subsetSum([3, 4], 7)).toBe(true);
});
