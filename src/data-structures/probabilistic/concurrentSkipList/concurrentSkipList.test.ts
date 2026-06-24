import { test, expect, describe } from "bun:test";
import { ConcurrentSkipList } from "./concurrentSkipList";

describe("ConcurrentSkipList", () => {
  describe("기본", () => {
    test("삽입 후 정렬 순서 유지", () => {
      const sl = new ConcurrentSkipList<number>();
      sl.insert(3);
      sl.insert(1);
      sl.insert(2);
      expect(sl.toArray()).toEqual([1, 2, 3]);
    });

    test("size — 삽입된 원소 수 반환", () => {
      const sl = new ConcurrentSkipList<number>();
      expect(sl.size()).toBe(0);
      sl.insert(10);
      sl.insert(20);
      sl.insert(30);
      expect(sl.size()).toBe(3);
    });

    test("has — 존재하는 원소는 true, 없는 원소는 false", () => {
      const sl = new ConcurrentSkipList<number>();
      sl.insert(5);
      sl.insert(15);
      expect(sl.has(5)).toBe(true);
      expect(sl.has(15)).toBe(true);
      expect(sl.has(10)).toBe(false);
    });

    test("insert — 중복 삽입 무시", () => {
      const sl = new ConcurrentSkipList<number>();
      sl.insert(7);
      sl.insert(7);
      sl.insert(7);
      expect(sl.size()).toBe(1);
      expect(sl.toArray()).toEqual([7]);
    });

    test("delete — 원소 제거 후 false 반환 확인", () => {
      const sl = new ConcurrentSkipList<number>();
      sl.insert(1);
      sl.insert(2);
      sl.insert(3);
      expect(sl.delete(2)).toBe(true);
      expect(sl.toArray()).toEqual([1, 3]);
      expect(sl.size()).toBe(2);
    });

    test("delete — 없는 원소 제거 시 false", () => {
      const sl = new ConcurrentSkipList<number>();
      sl.insert(1);
      expect(sl.delete(99)).toBe(false);
      expect(sl.size()).toBe(1);
    });

    test("min / max — 최솟값, 최댓값 반환", () => {
      const sl = new ConcurrentSkipList<number>();
      sl.insert(5);
      sl.insert(2);
      sl.insert(9);
      sl.insert(1);
      expect(sl.min()).toBe(1);
      expect(sl.max()).toBe(9);
    });
  });

  describe("정렬 유지 — 다양한 삽입 순서", () => {
    test("역순 삽입 후 정렬 확인", () => {
      const sl = new ConcurrentSkipList<number>();
      [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].forEach((v) => sl.insert(v));
      expect(sl.toArray()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    test("무작위 순서 삽입 후 정렬 확인", () => {
      const sl = new ConcurrentSkipList<number>();
      const values = [42, 7, 99, 1, 55, 3, 28];
      values.forEach((v) => sl.insert(v));
      expect(sl.toArray()).toEqual([...values].sort((a, b) => a - b));
    });

    test("삽입/삭제 반복 후 정렬 유지", () => {
      const sl = new ConcurrentSkipList<number>();
      [5, 3, 7, 1, 9].forEach((v) => sl.insert(v));
      sl.delete(3);
      sl.delete(7);
      sl.insert(4);
      sl.insert(6);
      expect(sl.toArray()).toEqual([1, 4, 5, 6, 9]);
    });

    test("커스텀 comparator — 내림차순 정렬", () => {
      const sl = new ConcurrentSkipList<number>(16, (a, b) => b - a);
      [3, 1, 4, 1, 5, 9, 2, 6].forEach((v) => sl.insert(v));
      // 중복 제거 후 내림차순
      expect(sl.toArray()).toEqual([9, 6, 5, 4, 3, 2, 1]);
    });

    test("문자열 스킵 리스트 — 사전순 정렬", () => {
      const sl = new ConcurrentSkipList<string>();
      ["cherry", "apple", "banana", "date"].forEach((v) => sl.insert(v));
      expect(sl.toArray()).toEqual(["apple", "banana", "cherry", "date"]);
    });
  });

  describe("엣지", () => {
    test("빈 리스트 — min/max는 undefined", () => {
      const sl = new ConcurrentSkipList<number>();
      expect(sl.min()).toBeUndefined();
      expect(sl.max()).toBeUndefined();
      expect(sl.size()).toBe(0);
      expect(sl.toArray()).toEqual([]);
    });

    test("단일 원소 삽입/삭제 후 빈 상태", () => {
      const sl = new ConcurrentSkipList<number>();
      sl.insert(42);
      sl.delete(42);
      expect(sl.size()).toBe(0);
      expect(sl.has(42)).toBe(false);
      expect(sl.min()).toBeUndefined();
      expect(sl.max()).toBeUndefined();
    });

    test("음수 포함 정렬", () => {
      const sl = new ConcurrentSkipList<number>();
      [-5, 0, -10, 3, -5].forEach((v) => sl.insert(v));
      // 중복 -5는 하나만
      expect(sl.toArray()).toEqual([-10, -5, 0, 3]);
    });

    test("maxLevel=1 — 단일 레벨 스킵 리스트도 동작", () => {
      const sl = new ConcurrentSkipList<number>(1);
      [3, 1, 2].forEach((v) => sl.insert(v));
      expect(sl.toArray()).toEqual([1, 2, 3]);
    });

    test("min 삭제 후 새 min 반영", () => {
      const sl = new ConcurrentSkipList<number>();
      [1, 2, 3].forEach((v) => sl.insert(v));
      sl.delete(1);
      expect(sl.min()).toBe(2);
    });

    test("max 삭제 후 새 max 반영", () => {
      const sl = new ConcurrentSkipList<number>();
      [1, 2, 3].forEach((v) => sl.insert(v));
      sl.delete(3);
      expect(sl.max()).toBe(2);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert/delete/has 연산 100ms 이내", () => {
      const sl = new ConcurrentSkipList<number>();
      const n = 10_000;
      const start = performance.now();

      for (let i = 0; i < n; i++) {
        sl.insert(Math.floor(Math.random() * n));
      }
      for (let i = 0; i < n / 2; i++) {
        sl.has(Math.floor(Math.random() * n));
      }
      for (let i = 0; i < n / 4; i++) {
        sl.delete(Math.floor(Math.random() * n));
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("n=10^4 toArray 정렬 순서 검증", () => {
      const sl = new ConcurrentSkipList<number>();
      const n = 10_000;
      const inserted = new Set<number>();

      for (let i = 0; i < n; i++) {
        const v = Math.floor(Math.random() * n);
        sl.insert(v);
        inserted.add(v);
      }

      const result = sl.toArray();
      expect(result.length).toBe(inserted.size);

      // 정렬 확인
      for (let i = 1; i < result.length; i++) {
        expect(result[i]!).toBeGreaterThanOrEqual(result[i - 1]!);
      }
    });
  });
});
