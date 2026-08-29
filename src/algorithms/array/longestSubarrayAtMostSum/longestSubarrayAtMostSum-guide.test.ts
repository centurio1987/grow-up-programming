/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(N=100,000 에서 답이 N)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { longestSubarrayAtMostSum } from "./longestSubarrayAtMostSum-guide.ref.ts";

const CASES: [number[], number, number][] = [
  // 기본
  [[1, 2, 3, 4, 5], 8, 3],
  [[1, 1, 1, 1, 1], 3, 3],
  [[1, 2, 3], 10, 3],
  // 엣지
  [[10, 20, 30], 5, 0],
  [[0, 0, 0, 1, 0], 0, 3],
  [[1, 2, 3], 0, 0],
  [[0, 0, 0, 0], 0, 4],
  // 바운더리
  [[5], 10, 1],
  [[5], 1, 0],
];

for (const [nums, S, want] of CASES) {
  test(`정본 — ${JSON.stringify(nums)} · S=${S}`, () => {
    expect(longestSubarrayAtMostSum([...nums], S)).toBe(want);
  });
}

test("S 가 매우 크면 전체 길이", () => {
  const N = 100;
  expect(
    longestSubarrayAtMostSum(new Array<number>(N).fill(100), 1_000_000_000),
  ).toBe(N);
});

test("N=100,000 에서도 답은 N", () => {
  const N = 100_000;
  expect(longestSubarrayAtMostSum(new Array<number>(N).fill(1), N)).toBe(N);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(longestSubarrayAtMostSum([1, 2, 1, 0, 1, 1, 0], 4)).toBe(5);
});

test("최악을 만드는 입력도 답은 정확하다", () => {
  // perf.worst 가 드는 입력. 연산이 가장 많은 것과 틀린 것은 다른 문제다.
  const N = 1_000;
  expect(longestSubarrayAtMostSum(new Array<number>(N).fill(1), 0)).toBe(0);
});
