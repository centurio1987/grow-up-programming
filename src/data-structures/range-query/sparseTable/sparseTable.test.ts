import { test, expect, describe } from "bun:test";
import { SparseTable } from "./sparseTable";

describe("SparseTable", () => {
  describe("기본 — 구간 최솟값 (DNS TTL)", () => {
    test("전체 구간 최솟값", () => {
      const ttls = [300, 60, 3600, 120, 900];
      const st = new SparseTable(ttls, Math.min);
      expect(st.query(0, 4)).toBe(60);
    });

    test("부분 구간 최솟값", () => {
      const ttls = [300, 60, 3600, 120, 900];
      const st = new SparseTable(ttls, Math.min);
      expect(st.query(0, 1)).toBe(60);  // min(300, 60)
      expect(st.query(2, 4)).toBe(120); // min(3600, 120, 900)
      expect(st.query(0, 2)).toBe(60);  // min(300, 60, 3600)
    });

    test("단일 원소 질의", () => {
      const arr = [5, 3, 8, 1, 7];
      const st = new SparseTable(arr, Math.min);
      expect(st.query(0, 0)).toBe(5);
      expect(st.query(2, 2)).toBe(8);
      expect(st.query(3, 3)).toBe(1);
    });
  });

  describe("기본 — 구간 최댓값", () => {
    test("전체 구간 최댓값", () => {
      const arr = [3, 1, 4, 1, 5, 9, 2, 6];
      const st = new SparseTable(arr, Math.max);
      expect(st.query(0, 7)).toBe(9);
    });

    test("부분 구간 최댓값", () => {
      const arr = [3, 1, 4, 1, 5, 9, 2, 6];
      const st = new SparseTable(arr, Math.max);
      expect(st.query(0, 4)).toBe(5);
      expect(st.query(5, 7)).toBe(9);
      expect(st.query(1, 3)).toBe(4);
    });
  });

  describe("기본 — GCD (최대공약수, 멱등 연산)", () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

    test("구간 GCD 기본", () => {
      const arr = [12, 8, 6, 4];
      const st = new SparseTable(arr, gcd);
      expect(st.query(0, 3)).toBe(2); // gcd(12,8,6,4)=2
      expect(st.query(0, 1)).toBe(4); // gcd(12,8)=4
      expect(st.query(2, 3)).toBe(2); // gcd(6,4)=2
    });
  });

  describe("엣지", () => {
    test("단일 원소 배열", () => {
      const st = new SparseTable([42], Math.min);
      expect(st.query(0, 0)).toBe(42);
    });

    test("크기 2 배열", () => {
      const st = new SparseTable([7, 3], Math.min);
      expect(st.query(0, 1)).toBe(3);
      expect(st.query(0, 0)).toBe(7);
      expect(st.query(1, 1)).toBe(3);
    });

    test("음수 포함 배열 최솟값", () => {
      const arr = [-5, -1, -3, -8, -2];
      const st = new SparseTable(arr, Math.min);
      expect(st.query(0, 4)).toBe(-8);
      expect(st.query(0, 2)).toBe(-5);
    });

    test("동일 값 배열", () => {
      const arr = [7, 7, 7, 7, 7];
      const st = new SparseTable(arr, Math.min);
      expect(st.query(0, 4)).toBe(7);
      expect(st.query(2, 3)).toBe(7);
    });

    test("크기 1짜리 구간 여러 번 질의해도 일관성 유지", () => {
      const arr = [9, 3, 6, 1, 8];
      const st = new SparseTable(arr, Math.min);
      for (let i = 0; i < arr.length; i++) {
        expect(st.query(i, i)).toBe(arr[i] ?? 0);
      }
    });

    test("2의 거듭제곱 크기 배열", () => {
      const arr = [4, 2, 8, 1, 5, 7, 3, 6]; // length = 8
      const st = new SparseTable(arr, Math.min);
      expect(st.query(0, 7)).toBe(1);
      expect(st.query(0, 3)).toBe(1);
      expect(st.query(4, 7)).toBe(3);
    });
  });

  describe("정확도 — 세그먼트 트리 결과와 대조", () => {
    test("무작위 배열 50회 쿼리 최솟값 brute-force 대조", () => {
      const arr = Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000));
      const st = new SparseTable(arr, Math.min);

      for (let t = 0; t < 50; t++) {
        const l = Math.floor(Math.random() * arr.length);
        const r = l + Math.floor(Math.random() * (arr.length - l));
        let expected = Infinity;
        for (let i = l; i <= r; i++) {
          expected = Math.min(expected, arr[i] ?? Infinity);
        }
        expect(st.query(l, r)).toBe(expected);
      }
    });

    test("무작위 배열 50회 쿼리 최댓값 brute-force 대조", () => {
      const arr = Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000));
      const st = new SparseTable(arr, Math.max);

      for (let t = 0; t < 50; t++) {
        const l = Math.floor(Math.random() * arr.length);
        const r = l + Math.floor(Math.random() * (arr.length - l));
        let expected = -Infinity;
        for (let i = l; i <= r; i++) {
          expected = Math.max(expected, arr[i] ?? -Infinity);
        }
        expect(st.query(l, r)).toBe(expected);
      }
    });
  });

  describe("성능", () => {
    test("n=10^6 빌드 + 10^5 query 200ms 이내", () => {
      const n = 1_000_000;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 1_000_000));
      const start = performance.now();
      const st = new SparseTable(arr, Math.min);
      for (let i = 0; i < 100_000; i++) {
        const l = Math.floor(Math.random() * n);
        const r = l + Math.floor(Math.random() * (n - l));
        st.query(l, r);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(200);
    });
  });
});
