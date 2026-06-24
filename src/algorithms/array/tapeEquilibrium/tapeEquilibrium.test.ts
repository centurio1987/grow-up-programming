import { test, expect, describe } from "bun:test";
import { tapeEquilibrium } from "./tapeEquilibrium";

describe("tapeEquilibrium", () => {
  // 기본 동작 — 문제 예시
  test("[3,1,2,4,3] → P=3에서 |6-7|=1 → 최솟값 1", () => {
    expect(tapeEquilibrium([3, 1, 2, 4, 3])).toBe(1);
  });

  // 분할 위치별 차이값 확인
  test("[1,2,3,4] → P=2에서 |3-7|=4, P=3에서 |6-4|=2 → 최솟값 2", () => {
    expect(tapeEquilibrium([1, 2, 3, 4])).toBe(2);
  });

  // 음수 포함
  test("[-3,-1,-2,-4,-3] → P=3에서 |-6-(-7)|=1 → 최솟값 1", () => {
    expect(tapeEquilibrium([-3, -1, -2, -4, -3])).toBe(1);
  });

  test("양수·음수 혼합 [-1,-2,3,4] → P=3에서 |0-4|=4 → 최솟값 4", () => {
    // P=1: |-1-5|=6, P=2: |-3-7|=10, P=3: |0-4|=4
    expect(tapeEquilibrium([-1, -2, 3, 4])).toBe(4);
  });

  // 차이가 0인 경우
  test("[5,5,5,5] → P=2에서 |10-10|=0 → 최솟값 0", () => {
    expect(tapeEquilibrium([5, 5, 5, 5])).toBe(0);
  });

  test("[1,-1,1,-1] → P=2에서 |0-0|=0 → 최솟값 0", () => {
    expect(tapeEquilibrium([1, -1, 1, -1])).toBe(0);
  });

  // 모두 같은 값 홀수 개
  test("[5,5,5] → P=1:|5-10|=5, P=2:|10-5|=5 → 최솟값 5", () => {
    expect(tapeEquilibrium([5, 5, 5])).toBe(5);
  });

  // 엣지 케이스 — N=2 (최솟값)
  test("N=2, [1,2] → P=1만 가능 → |1-2|=1", () => {
    expect(tapeEquilibrium([1, 2])).toBe(1);
  });

  test("N=2, [0,0] → |0-0|=0", () => {
    expect(tapeEquilibrium([0, 0])).toBe(0);
  });

  // 바운더리 — 원소값 최댓값
  test("N=2, [-1000,1000] → |−1000−1000|=2000", () => {
    expect(tapeEquilibrium([-1000, 1000])).toBe(2000);
  });

  test("N=2, [1000,1000] → |1000−1000|=0", () => {
    expect(tapeEquilibrium([1000, 1000])).toBe(0);
  });

  // 바운더리 — N=100,000 균등 분할
  test("N=100,000, 모두 1 → P=50000에서 차이=0", () => {
    const A = new Array(100_000).fill(1);
    expect(tapeEquilibrium(A)).toBe(0);
  });

  // 성능 테스트 — O(N) 기준 10^5 원소를 100ms 이내
  test("N=100,000 배열을 100ms 이내에 처리한다", () => {
    const A = Array.from({ length: 100_000 }, (_, i) => (i % 2001) - 1000);
    const start = performance.now();
    tapeEquilibrium(A);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
