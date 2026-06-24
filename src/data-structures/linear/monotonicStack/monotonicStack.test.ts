import { test, expect, describe } from "bun:test";
import { MonotonicStack } from "./monotonicStack";

describe("MonotonicStack", () => {
  describe("nextGreater — 다음 더 큰 원소 인덱스", () => {
    test("기본 예시: [2, 1, 2, 4, 3]", () => {
      const ms = new MonotonicStack();
      // 인덱스별 nextGreater:
      //   0(2) -> 3(4), 1(1) -> 2(2), 2(2) -> 3(4), 3(4) -> -1, 4(3) -> -1
      expect(ms.nextGreater([2, 1, 2, 4, 3])).toEqual([3, 2, 3, -1, -1]);
    });

    test("단조 증가 배열: [1, 2, 3, 4, 5]", () => {
      const ms = new MonotonicStack();
      // 각 원소의 nextGreater는 바로 오른쪽
      expect(ms.nextGreater([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, -1]);
    });

    test("단조 감소 배열: [5, 4, 3, 2, 1]", () => {
      const ms = new MonotonicStack();
      // 모두 nextGreater 없음
      expect(ms.nextGreater([5, 4, 3, 2, 1])).toEqual([-1, -1, -1, -1, -1]);
    });

    test("단일 원소: [42]", () => {
      const ms = new MonotonicStack();
      expect(ms.nextGreater([42])).toEqual([-1]);
    });

    test("동일값 배열: [3, 3, 3]", () => {
      const ms = new MonotonicStack();
      // 같으면 '더 큰' 것이 없으므로 -1
      expect(ms.nextGreater([3, 3, 3])).toEqual([-1, -1, -1]);
    });

    test("주식 가격 시나리오: [73, 74, 75, 71, 69, 72, 76, 73]", () => {
      const ms = new MonotonicStack();
      // 0(73)->2(75), 1(74)->2(75), 2(75)->6(76), 3(71)->5(72), 4(69)->5(72),
      // 5(72)->6(76), 6(76)->-1, 7(73)->-1
      expect(ms.nextGreater([73, 74, 75, 71, 69, 72, 76, 73])).toEqual([
        2, 2, 6, 5, 5, 6, -1, -1,
      ]);
    });

    test("두 원소: [1, 2]", () => {
      const ms = new MonotonicStack();
      expect(ms.nextGreater([1, 2])).toEqual([1, -1]);
    });

    test("두 원소 역순: [2, 1]", () => {
      const ms = new MonotonicStack();
      expect(ms.nextGreater([2, 1])).toEqual([-1, -1]);
    });
  });

  describe("prevGreater — 이전 더 큰 원소 인덱스", () => {
    test("기본 예시: [2, 1, 2, 4, 3]", () => {
      const ms = new MonotonicStack();
      // 0(2)->-1, 1(1)->0(2), 2(2)->-1(2와 같으므로), 3(4)->-1, 4(3)->3(4)
      expect(ms.prevGreater([2, 1, 2, 4, 3])).toEqual([-1, 0, -1, -1, 3]);
    });

    test("단조 감소 배열: [5, 4, 3, 2, 1]", () => {
      const ms = new MonotonicStack();
      // 각 원소의 prevGreater는 바로 왼쪽
      expect(ms.prevGreater([5, 4, 3, 2, 1])).toEqual([-1, 0, 1, 2, 3]);
    });

    test("단조 증가 배열: [1, 2, 3, 4, 5]", () => {
      const ms = new MonotonicStack();
      // 모두 prevGreater 없음
      expect(ms.prevGreater([1, 2, 3, 4, 5])).toEqual([-1, -1, -1, -1, -1]);
    });

    test("단일 원소: [7]", () => {
      const ms = new MonotonicStack();
      expect(ms.prevGreater([7])).toEqual([-1]);
    });

    test("동일값 배열: [5, 5, 5]", () => {
      const ms = new MonotonicStack();
      expect(ms.prevGreater([5, 5, 5])).toEqual([-1, -1, -1]);
    });
  });

  describe("nextSmaller — 다음 더 작은 원소 인덱스", () => {
    test("기본 예시: [3, 1, 2, 4, 0]", () => {
      const ms = new MonotonicStack();
      // 0(3)->1(1), 1(1)->4(0), 2(2)->4(0), 3(4)->4(0), 4(0)->-1
      expect(ms.nextSmaller([3, 1, 2, 4, 0])).toEqual([1, 4, 4, 4, -1]);
    });

    test("단조 증가 배열: [1, 2, 3, 4, 5]", () => {
      const ms = new MonotonicStack();
      // 모두 nextSmaller 없음
      expect(ms.nextSmaller([1, 2, 3, 4, 5])).toEqual([-1, -1, -1, -1, -1]);
    });

    test("단조 감소 배열: [5, 4, 3, 2, 1]", () => {
      const ms = new MonotonicStack();
      // 각 원소의 nextSmaller는 바로 오른쪽
      expect(ms.nextSmaller([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, -1]);
    });

    test("단일 원소: [0]", () => {
      const ms = new MonotonicStack();
      expect(ms.nextSmaller([0])).toEqual([-1]);
    });

    test("동일값 배열: [2, 2, 2]", () => {
      const ms = new MonotonicStack();
      expect(ms.nextSmaller([2, 2, 2])).toEqual([-1, -1, -1]);
    });

    test("[2, 1, 5, 6, 2, 3]", () => {
      const ms = new MonotonicStack();
      // 0(2)->1(1), 1(1)->-1, 2(5)->4(2), 3(6)->4(2), 4(2)->-1, 5(3)->-1
      expect(ms.nextSmaller([2, 1, 5, 6, 2, 3])).toEqual([1, -1, 4, 4, -1, -1]);
    });
  });

  describe("엣지 케이스", () => {
    test("빈 배열 — nextGreater", () => {
      const ms = new MonotonicStack();
      expect(ms.nextGreater([])).toEqual([]);
    });

    test("빈 배열 — prevGreater", () => {
      const ms = new MonotonicStack();
      expect(ms.prevGreater([])).toEqual([]);
    });

    test("빈 배열 — nextSmaller", () => {
      const ms = new MonotonicStack();
      expect(ms.nextSmaller([])).toEqual([]);
    });

    test("음수값 포함: [-3, -1, -2]", () => {
      const ms = new MonotonicStack();
      // 0(-3)->1(-1), 1(-1)->-1, 2(-2)->-1
      expect(ms.nextGreater([-3, -1, -2])).toEqual([1, -1, -1]);
    });

    test("nextGreater 결과 길이는 입력과 동일", () => {
      const ms = new MonotonicStack();
      const arr = [1, 3, 2, 5, 4];
      expect(ms.nextGreater(arr)).toHaveLength(arr.length);
    });
  });

  describe("바운더리", () => {
    test("두 원소 — nextSmaller [3, 1]", () => {
      const ms = new MonotonicStack();
      expect(ms.nextSmaller([3, 1])).toEqual([1, -1]);
    });

    test("두 원소 — prevGreater [1, 3]", () => {
      const ms = new MonotonicStack();
      expect(ms.prevGreater([1, 3])).toEqual([-1, -1]);
    });

    test("모두 최댓값: [MAX, MAX, MAX] — nextGreater", () => {
      const ms = new MonotonicStack();
      const MAX = Number.MAX_SAFE_INTEGER;
      expect(ms.nextGreater([MAX, MAX, MAX])).toEqual([-1, -1, -1]);
    });
  });

  describe("성능", () => {
    test("nextGreater: 10^5 원소 100ms 이내", () => {
      const ms = new MonotonicStack();
      const n = 100_000;
      const arr = Array.from({ length: n }, (_, i) => i % 1000);
      const start = performance.now();
      const result = ms.nextGreater(arr);
      const elapsed = performance.now() - start;
      expect(result).toHaveLength(n);
      expect(elapsed).toBeLessThan(100);
    });

    test("prevGreater: 10^5 원소 100ms 이내", () => {
      const ms = new MonotonicStack();
      const n = 100_000;
      const arr = Array.from({ length: n }, (_, i) => Math.sin(i) * 1000);
      const start = performance.now();
      const result = ms.prevGreater(arr);
      const elapsed = performance.now() - start;
      expect(result).toHaveLength(n);
      expect(elapsed).toBeLessThan(100);
    });

    test("nextSmaller: 10^5 원소 100ms 이내", () => {
      const ms = new MonotonicStack();
      const n = 100_000;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 10_000));
      const start = performance.now();
      const result = ms.nextSmaller(arr);
      const elapsed = performance.now() - start;
      expect(result).toHaveLength(n);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
