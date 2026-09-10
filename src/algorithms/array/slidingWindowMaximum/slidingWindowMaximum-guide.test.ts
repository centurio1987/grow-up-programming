/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를
 * 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**
 * (`N` = 100,000 · `k` = 1,000 에서 답의 개수와 값)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { slidingWindowMaximum } from "./slidingWindowMaximum-guide.ref.ts";

const CASES: [string, number[], number, number[]][] = [
  // 기본
  [
    "[1,3,-1,-3,5,3,6,7], k=3",
    [1, 3, -1, -3, 5, 3, 6, 7],
    3,
    [3, 3, 5, 5, 6, 7],
  ],
  ["[9,8,7,6,5], k=2", [9, 8, 7, 6, 5], 2, [9, 8, 7, 6]],
  ["[1,2,3,4,5], k=3", [1, 2, 3, 4, 5], 3, [3, 4, 5]],
  // 엣지
  ["모두 같은 값 [5,5,5,5], k=2", [5, 5, 5, 5], 2, [5, 5, 5]],
  ["음수만 [-3,-1,-4,-2], k=2", [-3, -1, -4, -2], 2, [-1, -1, -2]],
  ["k=N → 전체 최댓값 한 개", [3, 1, 5, 2], 4, [5]],
  ["k=1 → 원본 그대로", [3, 1, 5, 2], 1, [3, 1, 5, 2]],
  // 바운더리
  ["N=1, k=1", [7], 1, [7]],
  ["최댓값이 첫 창에만", [10, 1, 1, 1], 2, [10, 1, 1]],
  ["최댓값이 마지막 창에만", [1, 1, 1, 10], 2, [1, 1, 10]],
  // 문제 문서의 예시
  ["문제 문서 예시 — 증가 배열", [1, 2, 3, 4, 5], 3, [3, 4, 5]],
  ["문제 문서 예시 — 감소 배열", [5, 4, 3, 2, 1], 2, [5, 4, 3, 2]],
];

for (const [name, nums, k, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(slidingWindowMaximum([...nums], k)).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(slidingWindowMaximum([1, 3, -1, -3, 5, 3, 6, 7], 3)).toEqual([
    3, 3, 5, 5, 6, 7,
  ]);
});

test("입력 배열을 고치지 않는다", () => {
  const nums = [1, 3, -1, -3, 5, 3, 6, 7];
  slidingWindowMaximum(nums, 3);
  expect(nums).toEqual([1, 3, -1, -3, 5, 3, 6, 7]);
});

test("답의 길이는 언제나 N − k + 1 이다", () => {
  const nums = Array.from({ length: 64 }, (_, i) => (i * 2731) % 1201);
  for (let k = 1; k <= nums.length; k++) {
    expect(slidingWindowMaximum([...nums], k).length).toBe(nums.length - k + 1);
  }
});

test("N=100,000 · k=1,000 에서 답의 개수와 값", () => {
  const N = 100_000;
  const k = 1_000;
  const nums = Array.from({ length: N }, (_, i) => (i * 31) % 10_000);
  const result = slidingWindowMaximum(nums, k);
  expect(result.length).toBe(N - k + 1);
  // (31 i) mod 10,000 은 323 칸마다 꼭대기를 한 번씩 지난다. 창 1,000 칸에는 그 꼭대기가
  // 적어도 하나 들어가므로 모든 답이 9,987 이상이다.
  expect(Math.min(...result)).toBe(9_987);
  expect(Math.max(...result)).toBe(9_999);
});

test("N=100,000 감소 수열은 창의 왼쪽 끝이 답이다", () => {
  const N = 100_000;
  const k = 1_000;
  const nums = Array.from({ length: N }, (_, i) => N - i);
  const result = slidingWindowMaximum(nums, k);
  expect(result.length).toBe(N - k + 1);
  expect(result[0]).toBe(N);
  expect(result[result.length - 1]).toBe(k);
});

test("정의를 그대로 만족한다", () => {
  // 정의: result[i] 는 nums[i..i+k-1] 의 최댓값이다.
  const nums = Array.from({ length: 300 }, (_, i) => ((i * 7919) % 101) - 50);
  for (const k of [1, 2, 3, 7, 64, 299, 300]) {
    const result = slidingWindowMaximum([...nums], k);
    for (let i = 0; i + k <= nums.length; i++) {
      let want = nums[i] ?? 0;
      for (let j = i + 1; j < i + k; j++) {
        const v = nums[j] ?? 0;
        if (v > want) want = v;
      }
      expect(result[i]).toBe(want);
    }
  }
});
