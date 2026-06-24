import { test, expect, describe } from "bun:test";
import { fftMultiply } from "./fftMultiply";

describe("fftMultiply", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("(1 + 2x) * (3 + 4x) = 3 + 10x + 8x^2", () => {
      expect(fftMultiply([1, 2], [3, 4])).toEqual([3, 10, 8]);
    });

    test("(1 + x + x^2) * (1 + x) = 1 + 2x + 2x^2 + x^3", () => {
      expect(fftMultiply([1, 1, 1], [1, 1])).toEqual([1, 2, 2, 1]);
    });

    test("(2 + 3x + 4x^2) * (5 + 6x) = 10 + 27x + 38x^2 + 24x^3", () => {
      expect(fftMultiply([2, 3, 4], [5, 6])).toEqual([10, 27, 38, 24]);
    });

    test("상수 다항식 곱셈 (5)*(7) = 35", () => {
      expect(fftMultiply([5], [7])).toEqual([35]);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("한쪽이 빈 배열 - []", () => {
      expect(fftMultiply([], [1, 2, 3])).toEqual([]);
      expect(fftMultiply([1, 2, 3], [])).toEqual([]);
    });

    test("0 계수가 포함된 경우 - (1 + 0x + x^2)*(1 + x) = 1 + x + x^2 + x^3", () => {
      expect(fftMultiply([1, 0, 1], [1, 1])).toEqual([1, 1, 1, 1]);
    });

    test("양쪽 모두 단일 항 - 결과 길이는 1", () => {
      expect(fftMultiply([0], [0])).toEqual([0]);
    });

    test("음수 계수 - (1 - x)*(1 + x) = 1 - x^2", () => {
      expect(fftMultiply([1, -1], [1, 1])).toEqual([1, 0, -1]);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("계수가 큰 경우 - (1000)(1000) = 1000000", () => {
      expect(fftMultiply([1000], [1000])).toEqual([1000000]);
    });

    test("결과 길이가 정확히 n+m-1", () => {
      const a = [1, 2, 3, 4, 5]; // length 5
      const b = [6, 7, 8]; // length 3
      const result = fftMultiply(a, b);
      expect(result.length).toBe(5 + 3 - 1);
    });

    test("교환법칙 - a*b = b*a", () => {
      const a = [3, 1, 4, 1, 5];
      const b = [9, 2, 6, 5];
      expect(fftMultiply(a, b)).toEqual(fftMultiply(b, a));
    });
  });

  // 성능
  describe("성능", () => {
    test("n=2^16 (= 65536) 배열 곱셈을 3000ms 이내", () => {
      const N = 1 << 16;
      const a = new Array<number>(N);
      const b = new Array<number>(N);
      for (let i = 0; i < N; i++) {
        a[i] = i % 10;
        b[i] = (i * 3) % 10;
      }

      const start = performance.now();
      const result = fftMultiply(a, b);
      const elapsed = performance.now() - start;

      expect(result.length).toBe(2 * N - 1);
      expect(elapsed).toBeLessThan(3000);
    });
  });
});
