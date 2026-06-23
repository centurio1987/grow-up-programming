import { test, expect, describe } from "bun:test";
import { SkipList } from "./skipList";

describe("SkipList", () => {
  describe("기본", () => {
    test("insert 후 search는 true를 반환한다", () => {
      const sl = new SkipList();
      sl.insert(3);
      sl.insert(1);
      sl.insert(5);
      expect(sl.search(1)).toBe(true);
      expect(sl.search(3)).toBe(true);
      expect(sl.search(5)).toBe(true);
    });

    test("없는 키에 대해 search는 false를 반환한다", () => {
      const sl = new SkipList();
      sl.insert(10);
      expect(sl.search(99)).toBe(false);
    });

    test("toArray는 오름차순으로 반환한다", () => {
      const sl = new SkipList();
      [5, 2, 8, 1, 4].forEach((k) => sl.insert(k));
      expect(sl.toArray()).toEqual([1, 2, 4, 5, 8]);
    });
  });

  describe("delete", () => {
    test("delete 후 search는 false를 반환한다", () => {
      const sl = new SkipList();
      sl.insert(1);
      sl.insert(2);
      sl.insert(3);
      sl.delete(2);
      expect(sl.search(2)).toBe(false);
      expect(sl.toArray()).toEqual([1, 3]);
    });

    test("없는 키 delete는 에러 없이 무시한다", () => {
      const sl = new SkipList();
      sl.insert(5);
      expect(() => sl.delete(99)).not.toThrow();
      expect(sl.toArray()).toEqual([5]);
    });

    test("유일한 원소를 delete하면 빈 리스트가 된다", () => {
      const sl = new SkipList();
      sl.insert(42);
      sl.delete(42);
      expect(sl.search(42)).toBe(false);
      expect(sl.toArray()).toEqual([]);
    });
  });

  describe("엣지", () => {
    test("중복 insert는 무시된다", () => {
      const sl = new SkipList();
      sl.insert(7);
      sl.insert(7);
      sl.insert(7);
      expect(sl.toArray()).toEqual([7]);
    });

    test("빈 스킵 리스트의 toArray는 빈 배열을 반환한다", () => {
      const sl = new SkipList();
      expect(sl.toArray()).toEqual([]);
    });

    test("insert/delete 반복 후 toArray가 일관성을 유지한다", () => {
      const sl = new SkipList();
      for (let i = 1; i <= 10; i++) sl.insert(i);
      for (let i = 2; i <= 10; i += 2) sl.delete(i);
      expect(sl.toArray()).toEqual([1, 3, 5, 7, 9]);
    });
  });

  describe("바운더리", () => {
    test("오름차순으로 삽입해도 올바르게 동작한다", () => {
      const sl = new SkipList();
      for (let i = 1; i <= 5; i++) sl.insert(i);
      expect(sl.toArray()).toEqual([1, 2, 3, 4, 5]);
    });

    test("내림차순으로 삽입해도 올바르게 동작한다", () => {
      const sl = new SkipList();
      for (let i = 5; i >= 1; i--) sl.insert(i);
      expect(sl.toArray()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("성능", () => {
    test("무작위 순서 10^4 insert/search/delete를 200ms 이내에 처리한다", () => {
      const sl = new SkipList();
      const N = 10_000;
      const keys = Array.from({ length: N }, (_, i) => i + 1).sort(
        () => Math.random() - 0.5
      );
      const start = performance.now();
      for (const k of keys) sl.insert(k);
      for (const k of keys) expect(sl.search(k)).toBe(true);
      for (const k of keys) sl.delete(k);
      expect(sl.toArray()).toEqual([]);
      expect(performance.now() - start).toBeLessThan(200);
    });
  });
});
