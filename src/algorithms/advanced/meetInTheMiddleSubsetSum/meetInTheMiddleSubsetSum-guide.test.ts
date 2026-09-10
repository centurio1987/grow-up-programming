/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/advanced/meetInTheMiddleSubsetSum/meetInTheMiddleSubsetSum.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨
 * 정본(`meetInTheMiddleSubsetSum-guide.ref.ts`)에 다시 건다.
 *
 * **벽시계를 재는 케이스 둘은 판정을 바꿔 옮겼다.** 원본은 원소 40 개를 100ms 안에 처리하라고
 * 적었는데 그 값은 실행마다 달라 판정이 안 된다. 여기서는 같은 입력으로 **답이 맞는지**를 재고,
 * 같은 규모를 결정론적 계수로 재는 자리는 본문 「비용 계산」이 진다.
 *
 * 원소 40 개짜리 케이스는 옮겼다. 두 합 목록이 각각 1,048,576 칸이라 실행에 시간이 들지만,
 * **제약 상한이 실제로 처리되는지**는 이 편이 답해야 하는 것이다.
 */
import { expect, test } from "bun:test";
import {
  binarySearchExists,
  meetInTheMiddleSubsetSum,
  subsetSums,
} from "./meetInTheMiddleSubsetSum-guide.ref.ts";

/** 모든 부분집합을 만들어 보는 기준 구현. 답의 기준으로만 쓴다. */
function bruteForce(nums: number[], target: number): boolean {
  const n = nums.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) s += nums[i] as number;
    }
    if (s === target) return true;
  }
  return false;
}

test("[1,2,3,4,5], target=9 — 4+5 도 2+3+4 도 답이다", () => {
  expect(meetInTheMiddleSubsetSum([1, 2, 3, 4, 5], 9)).toBe(true);
});

test("[1,2,3,4,5], target=20 — 전체 합이 15 라 만들 수 없다", () => {
  expect(meetInTheMiddleSubsetSum([1, 2, 3, 4, 5], 20)).toBe(false);
});

test("[3,34,4,12,5,2], target=9 — 전개가 쓰는 입력", () => {
  expect(meetInTheMiddleSubsetSum([3, 34, 4, 12, 5, 2], 9)).toBe(true);
});

test("[3,34,4,12,5,2], target=30 — 답이 없다", () => {
  expect(meetInTheMiddleSubsetSum([3, 34, 4, 12, 5, 2], 30)).toBe(false);
});

test("target=0 은 공집합으로 언제나 참이다", () => {
  expect(meetInTheMiddleSubsetSum([1, 2, 3], 0)).toBe(true);
});

test("원소 하나 — 그 원소와 목표가 같다", () => {
  expect(meetInTheMiddleSubsetSum([7], 7)).toBe(true);
});

test("원소 하나 — target=0 이면 공집합으로 참이다", () => {
  expect(meetInTheMiddleSubsetSum([7], 0)).toBe(true);
});

test("원소 하나 — 목표가 그 원소도 0 도 아니면 거짓이다", () => {
  expect(meetInTheMiddleSubsetSum([7], 5)).toBe(false);
});

test("전체 합과 목표가 같다", () => {
  expect(meetInTheMiddleSubsetSum([1, 2, 3, 4], 10)).toBe(true);
});

test("음수가 섞인 [-3,-1,2,5], target=4 — -1+5 가 답이다", () => {
  expect(meetInTheMiddleSubsetSum([-3, -1, 2, 5], 4)).toBe(true);
});

test("음수 목표 [-5,3,1], target=-4 — -5+1 이 답이다", () => {
  expect(meetInTheMiddleSubsetSum([-5, 3, 1], -4)).toBe(true);
});

test("빈 배열, target=0", () => {
  expect(meetInTheMiddleSubsetSum([], 0)).toBe(true);
});

test("빈 배열, target≠0", () => {
  expect(meetInTheMiddleSubsetSum([], 5)).toBe(false);
});

test("원소가 전부 0 이고 target=0", () => {
  expect(meetInTheMiddleSubsetSum([0, 0, 0], 0)).toBe(true);
});

test("원소 40 개 — 전체 합이 목표이면 참이다", () => {
  const n = 40;
  const nums = Array.from({ length: n }, (_, i) => i + 1);
  expect(meetInTheMiddleSubsetSum(nums, (n * (n + 1)) / 2)).toBe(true);
});

test("원소 40 개 — 짝수만으로 홀수 1 을 만들 수 없다", () => {
  const n = 40;
  const nums = Array.from({ length: n }, (_, i) => (i + 1) * 2);
  expect(meetInTheMiddleSubsetSum(nums, 1)).toBe(false);
});

test("원소 0~14 개의 생성식 배열에서 전수 탐색과 답이 같다", () => {
  for (let n = 0; n <= 14; n++) {
    const nums = Array.from({ length: n }, (_, i) => ((i * 7 + 13) % 19) - 9);
    for (let t = -20; t <= 20; t++) {
      expect(meetInTheMiddleSubsetSum(nums, t)).toBe(bruteForce(nums, t));
    }
  }
});

test("subsetSums 는 길이 2^m 짜리 목록에 부분집합 합을 빠짐없이 담는다", () => {
  const nums = [3, 34, 4, 12, 5, 2];
  for (let m = 0; m <= nums.length; m++) {
    const got = [...subsetSums(nums, 0, m)];
    expect(got.length).toBe(2 ** m);
    const want: number[] = [];
    for (let mask = 0; mask < 1 << m; mask++) {
      let s = 0;
      for (let i = 0; i < m; i++) if ((mask >> i) & 1) s += nums[i] as number;
      want.push(s);
    }
    expect([...got].sort((a, b) => a - b)).toEqual(want.sort((a, b) => a - b));
  }
});

test("binarySearchExists 는 정렬된 목록에서 있는 값과 없는 값을 가른다", () => {
  const sorted = Float64Array.from([-3, 0, 2, 5, 7, 9]);
  for (const v of [-3, 0, 2, 5, 7, 9]) {
    expect(binarySearchExists(sorted, v)).toBe(true);
  }
  for (const v of [-4, -1, 1, 3, 6, 8, 10]) {
    expect(binarySearchExists(sorted, v)).toBe(false);
  }
  expect(binarySearchExists(Float64Array.from([]), 0)).toBe(false);
  expect(binarySearchExists(Float64Array.from([4]), 4)).toBe(true);
  expect(binarySearchExists(Float64Array.from([4]), 5)).toBe(false);
});

test("문제 설명의 예시 여덟", () => {
  expect(meetInTheMiddleSubsetSum([1, 2, 3], 5)).toBe(true);
  expect(meetInTheMiddleSubsetSum([1, 2, 3], 7)).toBe(false);
  expect(meetInTheMiddleSubsetSum([1, 2, 3], 0)).toBe(true);
  expect(meetInTheMiddleSubsetSum([-3, -1, 2, 5], 4)).toBe(true);
  expect(meetInTheMiddleSubsetSum([], 0)).toBe(true);
  expect(meetInTheMiddleSubsetSum([], 5)).toBe(false);
  expect(meetInTheMiddleSubsetSum([7], 7)).toBe(true);
  expect(meetInTheMiddleSubsetSum([-5, 3, 1], -4)).toBe(true);
});

test("원소 절댓값 상한 10^9 에서도 합이 정확하다", () => {
  const n = 20;
  const nums = Array.from({ length: n }, () => 1000000000);
  expect(meetInTheMiddleSubsetSum(nums, 20000000000)).toBe(true);
  expect(meetInTheMiddleSubsetSum(nums, 19999999999)).toBe(false);
});
