import { test, expect, describe } from "bun:test";
import { singleNumberXor } from "./singleNumberXor";

describe("singleNumberXor", () => {
  // 기본 동작 — 문제 예시
  test("[4,1,2,1,2] → 4", () => {
    expect(singleNumberXor([4, 1, 2, 1, 2])).toBe(4);
  });

  test("[2,2,1] → 1", () => {
    expect(singleNumberXor([2, 2, 1])).toBe(1);
  });

  test("[1,3,1,3,99] → 99", () => {
    expect(singleNumberXor([1, 3, 1, 3, 99])).toBe(99);
  });

  test("정답 원소의 등장 위치와 무관 — 맨 앞", () => {
    expect(singleNumberXor([7, 1, 1, 2, 2])).toBe(7);
  });

  test("정답 원소의 등장 위치와 무관 — 맨 뒤", () => {
    expect(singleNumberXor([1, 1, 2, 2, 7])).toBe(7);
  });

  // 음수·0 포함
  test("음수 원소가 정답인 경우 [−5,1,1] → −5", () => {
    expect(singleNumberXor([-5, 1, 1])).toBe(-5);
  });

  test("0이 정답인 경우 [0,1,1,2,2] → 0", () => {
    expect(singleNumberXor([0, 1, 1, 2, 2])).toBe(0);
  });

  test("음수와 양수 혼합 [−1,−1,−2,3,3] → −2", () => {
    expect(singleNumberXor([-1, -1, -2, 3, 3])).toBe(-2);
  });

  // 엣지 케이스
  test("단일 원소 [42] → 42", () => {
    expect(singleNumberXor([42])).toBe(42);
  });

  test("단일 원소 [0] → 0", () => {
    expect(singleNumberXor([0])).toBe(0);
  });

  test("정답 원소가 3번(홀수) 나오는 경우 [5,5,5,1,1] → 5", () => {
    expect(singleNumberXor([5, 5, 5, 1, 1])).toBe(5);
  });

  // 바운더리 — 큰 값
  test("32비트 큰 값 [2^30, 1, 1] → 2^30", () => {
    expect(singleNumberXor([1 << 30, 1, 1])).toBe(1 << 30);
  });

  // 성능 테스트 — N=10^6 100ms 이내
  test("N=10^6 입력을 100ms 이내에 처리한다", () => {
    const N = 1_000_000; // 짝수
    const nums: number[] = new Array(N + 1);
    // 각 정수 i (1..N/2) 를 두 번씩 넣고, 마지막에 unique = 12345 추가
    for (let i = 0; i < N / 2; i++) {
      nums[2 * i] = i + 1;
      nums[2 * i + 1] = i + 1;
    }
    nums[N] = 12345;

    const start = performance.now();
    const result = singleNumberXor(nums);
    const elapsed = performance.now() - start;

    expect(result).toBe(12345);
    expect(elapsed).toBeLessThan(100);
  });
});
