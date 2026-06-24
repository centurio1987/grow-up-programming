import { test, expect, describe } from "bun:test";
import { LRUCache } from "./lruCache";

describe("LRUCache", () => {
  describe("기본", () => {
    test("put 후 get은 값을 반환한다", () => {
      const cache = new LRUCache(2);
      cache.put(1, 10);
      cache.put(2, 20);
      expect(cache.get(1)).toBe(10);
      expect(cache.get(2)).toBe(20);
    });

    test("없는 키에 대한 get은 -1을 반환한다", () => {
      const cache = new LRUCache(2);
      expect(cache.get(99)).toBe(-1);
    });

    test("용량 초과 시 LRU 항목이 제거된다", () => {
      const cache = new LRUCache(2);
      cache.put(1, 1);
      cache.put(2, 2);
      cache.put(3, 3); // key=1이 LRU → 제거
      expect(cache.get(1)).toBe(-1);
      expect(cache.get(2)).toBe(2);
      expect(cache.get(3)).toBe(3);
    });

    test("get 호출이 LRU 순서를 갱신한다", () => {
      const cache = new LRUCache(2);
      cache.put(1, 1);
      cache.put(2, 2);
      cache.get(1); // key=1이 최근 사용으로 갱신
      cache.put(3, 3); // key=2가 LRU → 제거
      expect(cache.get(2)).toBe(-1);
      expect(cache.get(1)).toBe(1);
      expect(cache.get(3)).toBe(3);
    });

    test("put으로 기존 값을 업데이트할 수 있다", () => {
      const cache = new LRUCache(2);
      cache.put(1, 100);
      cache.put(1, 200);
      expect(cache.get(1)).toBe(200);
    });
  });

  describe("엣지", () => {
    test("capacity=1이면 새 put마다 기존 항목이 제거된다", () => {
      const cache = new LRUCache(1);
      cache.put(1, 1);
      cache.put(2, 2);
      expect(cache.get(1)).toBe(-1);
      expect(cache.get(2)).toBe(2);
    });

    test("put 업데이트가 LRU 순서를 갱신한다", () => {
      const cache = new LRUCache(2);
      cache.put(1, 1);
      cache.put(2, 2);
      cache.put(1, 10); // key=1 갱신 → 최근 사용
      cache.put(3, 3);  // key=2가 LRU → 제거
      expect(cache.get(2)).toBe(-1);
      expect(cache.get(1)).toBe(10);
    });

    test("동일 키를 반복 put해도 LRU에서 마지막 값이 유지된다", () => {
      const cache = new LRUCache(3);
      cache.put(1, 1);
      cache.put(1, 2);
      cache.put(1, 3);
      expect(cache.get(1)).toBe(3);
    });
  });

  describe("바운더리", () => {
    test("LeetCode 146 예시 — capacity=2", () => {
      const cache = new LRUCache(2);
      cache.put(1, 1);
      cache.put(2, 2);
      expect(cache.get(1)).toBe(1);
      cache.put(3, 3);
      expect(cache.get(2)).toBe(-1);
      cache.put(4, 4);
      expect(cache.get(1)).toBe(-1);
      expect(cache.get(3)).toBe(3);
      expect(cache.get(4)).toBe(4);
    });
  });

  describe("성능", () => {
    test("10^5 put/get을 100ms 이내에 처리한다", () => {
      const cache = new LRUCache(1000);
      const N = 100_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) cache.put(i % 2000, i);
      for (let i = 0; i < N; i++) cache.get(i % 2000);
      expect(performance.now() - start).toBeLessThan(100);
    });
  });
});
