import { test, expect, describe } from "bun:test";
import { maxSubarraySum } from "./kadane";

describe("maxSubarraySum", () => {
  // 기본 동작
  test("연속된 부분 배열의 최대 합을 반환한다", () => {
    // [-2,1,-3,4,-1,2,1,-5,4] → [4,-1,2,1] = 6
    expect(maxSubarraySum([-2, 1, -3, 4, -1, 2, 1, -5, 4])).toBe(6);
  });

  test("전체 배열이 정답인 경우 (모두 양수)", () => {
    expect(maxSubarraySum([1, 2, 3, 4, 5])).toBe(15);
  });

  // 엣지 케이스
  test("모두 음수인 경우 — 가장 큰 단일 원소를 반환한다", () => {
    expect(maxSubarraySum([-3, -1, -4, -2])).toBe(-1);
  });

  test("양수와 음수가 섞인 경우", () => {
    // [5,-3,5] → 전체 합 7이 최대
    expect(maxSubarraySum([5, -3, 5])).toBe(7);
  });

  test("0이 포함된 경우", () => {
    expect(maxSubarraySum([-1, 0, -2])).toBe(0);
  });

  test("정답이 배열 앞부분에 있는 경우", () => {
    expect(maxSubarraySum([10, -1, -1, -100])).toBe(10);
  });

  test("정답이 배열 뒷부분에 있는 경우", () => {
    expect(maxSubarraySum([-100, -1, -1, 10])).toBe(10);
  });

  // 바운더리 테스트
  test("최소 길이 배열 (N=1) — 양수", () => {
    expect(maxSubarraySum([7])).toBe(7);
  });

  test("최소 길이 배열 (N=1) — 음수", () => {
    expect(maxSubarraySum([-7])).toBe(-7);
  });

  // 성능 테스트 (CPU 10^8 ops/sec 기준, N=100,000 → O(N)이면 충분히 여유)
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    // 전체 합이 최대가 되도록 모두 1로 구성
    const nums = new Array<number>(N).fill(1);

    const start = performance.now();
    const result = maxSubarraySum(nums);
    const elapsed = performance.now() - start;

    expect(result).toBe(N);
    expect(elapsed).toBeLessThan(100);
  });
});
