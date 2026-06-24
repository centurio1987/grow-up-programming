import { test, expect, describe } from "bun:test";
import { MonotonicQueue } from "./monotonicQueue";

describe("MonotonicQueue", () => {
  describe("slidingWindowMax — 슬라이딩 윈도우 최댓값", () => {
    test("기본 예시: [1,3,-1,-3,5,3,6,7], k=3", () => {
      const mq = new MonotonicQueue();
      // 윈도우별 최댓값: [3,3,5,5,6,7]
      expect(mq.slidingWindowMax([1, 3, -1, -3, 5, 3, 6, 7], 3)).toEqual([
        3, 3, 5, 5, 6, 7,
      ]);
    });

    test("k=1이면 입력 배열 그대로 반환", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([4, 2, 7, 1, 5], 1)).toEqual([4, 2, 7, 1, 5]);
    });

    test("k=n이면 전체 최댓값 하나", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([4, 2, 7, 1, 5], 5)).toEqual([7]);
    });

    test("단조 증가 배열: [1,2,3,4,5], k=3", () => {
      const mq = new MonotonicQueue();
      // 윈도우 최댓값은 항상 오른쪽 끝
      expect(mq.slidingWindowMax([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
    });

    test("단조 감소 배열: [5,4,3,2,1], k=3", () => {
      const mq = new MonotonicQueue();
      // 윈도우 최댓값은 항상 왼쪽 끝
      expect(mq.slidingWindowMax([5, 4, 3, 2, 1], 3)).toEqual([5, 4, 3]);
    });

    test("동일값 배열: [3,3,3,3], k=2", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([3, 3, 3, 3], 2)).toEqual([3, 3, 3]);
    });

    test("음수 포함: [-5,-3,-1,-4,-2], k=2", () => {
      const mq = new MonotonicQueue();
      // [-5,-3]->-3, [-3,-1]->-1, [-1,-4]->-1, [-4,-2]->-2
      expect(mq.slidingWindowMax([-5, -3, -1, -4, -2], 2)).toEqual([
        -3, -1, -1, -2,
      ]);
    });

    test("결과 배열 길이가 nums.length - k + 1", () => {
      const mq = new MonotonicQueue();
      const nums = [1, 2, 3, 4, 5, 6, 7];
      const k = 3;
      const result = mq.slidingWindowMax(nums, k);
      expect(result).toHaveLength(nums.length - k + 1);
    });

    test("기온 모니터링 시나리오: [20,22,18,25,24,21,23,19], k=3", () => {
      const mq = new MonotonicQueue();
      // 최근 3분 최고 기온
      expect(
        mq.slidingWindowMax([20, 22, 18, 25, 24, 21, 23, 19], 3)
      ).toEqual([22, 25, 25, 25, 24, 23]);
    });
  });

  describe("slidingWindowMin — 슬라이딩 윈도우 최솟값", () => {
    test("기본 예시: [1,3,-1,-3,5,3,6,7], k=3", () => {
      const mq = new MonotonicQueue();
      // 윈도우별 최솟값: [-1,-3,-3,-3,3,3]
      expect(mq.slidingWindowMin([1, 3, -1, -3, 5, 3, 6, 7], 3)).toEqual([
        -1, -3, -3, -3, 3, 3,
      ]);
    });

    test("k=1이면 입력 배열 그대로 반환", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMin([4, 2, 7, 1, 5], 1)).toEqual([4, 2, 7, 1, 5]);
    });

    test("k=n이면 전체 최솟값 하나", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMin([4, 2, 7, 1, 5], 5)).toEqual([1]);
    });

    test("단조 증가 배열: [1,2,3,4,5], k=3", () => {
      const mq = new MonotonicQueue();
      // 윈도우 최솟값은 항상 왼쪽 끝
      expect(mq.slidingWindowMin([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
    });

    test("단조 감소 배열: [5,4,3,2,1], k=3", () => {
      const mq = new MonotonicQueue();
      // 윈도우 최솟값은 항상 오른쪽 끝
      expect(mq.slidingWindowMin([5, 4, 3, 2, 1], 3)).toEqual([3, 2, 1]);
    });

    test("음수 포함: [-5,-3,-1,-4,-2], k=2", () => {
      const mq = new MonotonicQueue();
      // [-5,-3]->-5, [-3,-1]->-3, [-1,-4]->-4, [-4,-2]->-4
      expect(mq.slidingWindowMin([-5, -3, -1, -4, -2], 2)).toEqual([
        -5, -3, -4, -4,
      ]);
    });

    test("기온 최저 시나리오: [20,22,18,25,24,21,23,19], k=3", () => {
      const mq = new MonotonicQueue();
      // 최근 3분 최저 기온
      expect(
        mq.slidingWindowMin([20, 22, 18, 25, 24, 21, 23, 19], 3)
      ).toEqual([18, 18, 18, 21, 21, 19]);
    });
  });

  describe("엣지 케이스", () => {
    test("단일 원소, k=1 — slidingWindowMax", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([42], 1)).toEqual([42]);
    });

    test("단일 원소, k=1 — slidingWindowMin", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMin([42], 1)).toEqual([42]);
    });

    test("k=n인 경우 두 원소: [1,2], k=2 — max", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([1, 2], 2)).toEqual([2]);
    });

    test("k=n인 경우 두 원소: [1,2], k=2 — min", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMin([1, 2], 2)).toEqual([1]);
    });

    test("모든 원소 동일: [7,7,7,7,7], k=3", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([7, 7, 7, 7, 7], 3)).toEqual([7, 7, 7]);
      expect(mq.slidingWindowMin([7, 7, 7, 7, 7], 3)).toEqual([7, 7, 7]);
    });
  });

  describe("바운더리", () => {
    test("최솟값 = 최댓값인 배열: [5], k=1", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([5], 1)).toEqual([5]);
      expect(mq.slidingWindowMin([5], 1)).toEqual([5]);
    });

    test("두 원소, k=1: [3,7]", () => {
      const mq = new MonotonicQueue();
      expect(mq.slidingWindowMax([3, 7], 1)).toEqual([3, 7]);
      expect(mq.slidingWindowMin([3, 7], 1)).toEqual([3, 7]);
    });

    test("slidingWindowMax와 slidingWindowMin 결과는 항상 max >= min", () => {
      const mq = new MonotonicQueue();
      const nums = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
      const k = 4;
      const maxResult = mq.slidingWindowMax(nums, k);
      const minResult = mq.slidingWindowMin(nums, k);
      for (let i = 0; i < maxResult.length; i++) {
        expect((maxResult[i] ?? 0) >= (minResult[i] ?? 0)).toBe(true);
      }
    });
  });

  describe("성능", () => {
    test("slidingWindowMax: 10^5 원소, k=100, 100ms 이내", () => {
      const mq = new MonotonicQueue();
      const n = 100_000;
      const k = 100;
      const nums = Array.from({ length: n }, () =>
        Math.floor(Math.random() * 10_000)
      );
      const start = performance.now();
      const result = mq.slidingWindowMax(nums, k);
      const elapsed = performance.now() - start;
      expect(result).toHaveLength(n - k + 1);
      expect(elapsed).toBeLessThan(100);
    });

    test("slidingWindowMin: 10^5 원소, k=1000, 100ms 이내", () => {
      const mq = new MonotonicQueue();
      const n = 100_000;
      const k = 1000;
      const nums = Array.from({ length: n }, (_, i) => Math.sin(i) * 500);
      const start = performance.now();
      const result = mq.slidingWindowMin(nums, k);
      const elapsed = performance.now() - start;
      expect(result).toHaveLength(n - k + 1);
      expect(elapsed).toBeLessThan(100);
    });

    test("slidingWindowMax: k=n (전체 최댓값), 10^5 원소", () => {
      const mq = new MonotonicQueue();
      const n = 100_000;
      const nums = Array.from({ length: n }, (_, i) => i);
      const start = performance.now();
      const result = mq.slidingWindowMax(nums, n);
      const elapsed = performance.now() - start;
      expect(result).toEqual([n - 1]);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
