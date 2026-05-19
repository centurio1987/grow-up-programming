import { test, expect, describe } from "bun:test";
import { twoSum } from "./twoSum";

describe("twoSum", () => {
  // 기본 동작
  test("합이 target인 두 인덱스를 반환한다", () => {
    const result = twoSum([2, 7, 11, 15], 9);
    expect(result).toEqual([0, 1]);
  });

  test("배열 중간에 정답이 있는 경우", () => {
    const result = twoSum([3, 2, 4], 6);
    expect(result).toEqual([1, 2]);
  });

  // 엣지 케이스
  test("같은 값 두 개를 사용하는 경우", () => {
    const result = twoSum([3, 3], 6);
    expect(result).toEqual([0, 1]);
  });

  test("음수가 포함된 경우", () => {
    const result = twoSum([-1, -2, 3], 1);
    expect(result).toEqual([1, 2]);
  });

  test("target이 음수인 경우", () => {
    const result = twoSum([-3, 4, -7], -10);
    expect(result).toEqual([0, 2]);
  });

  test("0이 포함된 경우", () => {
    const result = twoSum([0, 5, 0], 0);
    expect(result).toEqual([0, 2]);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=2)", () => {
    const result = twoSum([1, 2], 3);
    expect(result).toEqual([0, 1]);
  });

  test("최대 길이 배열 (N=10,000)에서 정답이 끝에 있는 경우", () => {
    const nums = new Array<number>(10000).fill(0);
    nums[9998] = 99;
    nums[9999] = 1;
    const result = twoSum(nums, 100);
    expect(result).toEqual([9998, 9999]);
  });

  // 성능 테스트 (CPU 10^8 ops/sec 기준, N=10,000 → O(N)이면 충분히 여유)
  test("N=10,000 입력을 100ms 이내에 처리한다", () => {
    const N = 10000;
    const nums = Array.from({ length: N }, (_, i) => i);
    // 정답: index 9998(9998) + index 9999(9999) = 19997
    const target = (N - 2) + (N - 1);

    const start = performance.now();
    const result = twoSum(nums, target);
    const elapsed = performance.now() - start;

    expect(result).toEqual([N - 2, N - 1]);
    expect(elapsed).toBeLessThan(100);
  });
});
