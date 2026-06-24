import { test, expect, describe } from "bun:test";
import { CuckooFilter } from "./cuckooFilter";

describe("CuckooFilter", () => {
  describe("기본", () => {
    test("add 후 has는 true를 반환한다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.add("hello")).toBe(true);
      expect(cf.has("hello")).toBe(true);
    });

    test("추가하지 않은 항목에 has는 false를 반환한다", () => {
      const cf = new CuckooFilter(100);
      cf.add("hello");
      expect(cf.has("world")).toBe(false);
    });

    test("여러 항목을 추가하고 모두 has로 확인할 수 있다", () => {
      const cf = new CuckooFilter(200);
      const items = ["apple", "banana", "cherry", "date", "elderberry"];
      for (const item of items) {
        expect(cf.add(item)).toBe(true);
      }
      for (const item of items) {
        expect(cf.has(item)).toBe(true);
      }
    });

    test("size는 추가된 항목 수를 반환한다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.size()).toBe(0);
      cf.add("a");
      expect(cf.size()).toBe(1);
      cf.add("b");
      expect(cf.size()).toBe(2);
    });

    test("loadFactor는 0에서 1 사이 값을 반환한다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.loadFactor()).toBeGreaterThanOrEqual(0);
      expect(cf.loadFactor()).toBeLessThanOrEqual(1);
      cf.add("hello");
      expect(cf.loadFactor()).toBeGreaterThan(0);
      expect(cf.loadFactor()).toBeLessThanOrEqual(1);
    });
  });

  describe("삭제 (BloomFilter와의 핵심 차이)", () => {
    test("delete 후 has는 false를 반환한다", () => {
      const cf = new CuckooFilter(100);
      cf.add("hello");
      expect(cf.has("hello")).toBe(true);
      expect(cf.delete("hello")).toBe(true);
      expect(cf.has("hello")).toBe(false);
    });

    test("delete 후 size가 줄어든다", () => {
      const cf = new CuckooFilter(100);
      cf.add("hello");
      cf.add("world");
      expect(cf.size()).toBe(2);
      cf.delete("hello");
      expect(cf.size()).toBe(1);
    });

    test("존재하지 않는 항목 delete는 false를 반환한다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.delete("nonexistent")).toBe(false);
    });

    test("delete 후 재삽입할 수 있다", () => {
      const cf = new CuckooFilter(100);
      cf.add("item");
      cf.delete("item");
      expect(cf.has("item")).toBe(false);
      expect(cf.add("item")).toBe(true);
      expect(cf.has("item")).toBe(true);
    });

    test("여러 항목 중 하나만 삭제해도 나머지는 유지된다", () => {
      const cf = new CuckooFilter(200);
      const items = ["a", "b", "c", "d", "e"];
      for (const item of items) cf.add(item);
      cf.delete("c");
      expect(cf.has("a")).toBe(true);
      expect(cf.has("b")).toBe(true);
      expect(cf.has("c")).toBe(false);
      expect(cf.has("d")).toBe(true);
      expect(cf.has("e")).toBe(true);
    });
  });

  describe("특수 기능", () => {
    test("fingerprintSize가 클수록 false positive가 낮아진다 (구조 테스트)", () => {
      const cf8 = new CuckooFilter(1000, 8);
      const cf16 = new CuckooFilter(1000, 16);
      // 구조 자체가 생성 가능한지 확인
      expect(cf8.loadFactor()).toBe(0);
      expect(cf16.loadFactor()).toBe(0);
    });

    test("false negative가 없다 — 추가한 항목은 반드시 has가 true", () => {
      const cf = new CuckooFilter(500);
      const items: string[] = [];
      for (let i = 0; i < 100; i++) {
        items.push(`item-${i}`);
      }
      for (const item of items) cf.add(item);
      for (const item of items) {
        expect(cf.has(item)).toBe(true);
      }
    });

    test("같은 항목을 중복 추가해도 false negative가 없다", () => {
      const cf = new CuckooFilter(100);
      cf.add("dup");
      cf.add("dup");
      expect(cf.has("dup")).toBe(true);
    });
  });

  describe("엣지", () => {
    test("빈 필터의 size는 0이다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.size()).toBe(0);
    });

    test("빈 필터의 loadFactor는 0이다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.loadFactor()).toBe(0);
    });

    test("빈 필터에서 has는 false를 반환한다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.has("anything")).toBe(false);
    });

    test("capacity 초과 시 add는 false를 반환한다", () => {
      const cf = new CuckooFilter(4); // 매우 작은 용량
      let success = 0;
      let failure = 0;
      for (let i = 0; i < 100; i++) {
        const result = cf.add(`item-${i}`);
        if (result) success++;
        else failure++;
      }
      // 일부 삽입은 실패해야 함
      expect(failure).toBeGreaterThan(0);
    });

    test("빈 문자열도 처리한다", () => {
      const cf = new CuckooFilter(100);
      expect(cf.add("")).toBe(true);
      expect(cf.has("")).toBe(true);
      expect(cf.delete("")).toBe(true);
      expect(cf.has("")).toBe(false);
    });

    test("특수문자가 포함된 문자열을 처리한다", () => {
      const cf = new CuckooFilter(100);
      const special = "192.168.0.1:8080/api?q=hello&lang=ko";
      expect(cf.add(special)).toBe(true);
      expect(cf.has(special)).toBe(true);
    });
  });

  describe("성능", () => {
    test("10^5 삽입 및 조회가 100ms 이내 완료된다", () => {
      const cf = new CuckooFilter(200000);
      const start = Date.now();
      for (let i = 0; i < 100000; i++) {
        cf.add(`ip-${i}`);
      }
      for (let i = 0; i < 100000; i++) {
        cf.has(`ip-${i}`);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("10^4 삭제가 50ms 이내 완료된다", () => {
      const cf = new CuckooFilter(50000);
      for (let i = 0; i < 10000; i++) {
        cf.add(`item-${i}`);
      }
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        cf.delete(`item-${i}`);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });
});
