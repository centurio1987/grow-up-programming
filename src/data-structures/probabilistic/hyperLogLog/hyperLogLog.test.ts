import { test, expect, describe } from "bun:test";
import { HyperLogLog } from "./hyperLogLog";

describe("HyperLogLog", () => {
  describe("기본", () => {
    test("빈 HLL의 count는 0이다", () => {
      const hll = new HyperLogLog(10);
      expect(hll.count()).toBe(0);
    });

    test("add 후 count는 양수다", () => {
      const hll = new HyperLogLog(10);
      hll.add("hello");
      expect(hll.count()).toBeGreaterThan(0);
    });

    test("원소를 많이 추가할수록 count 추정값이 증가한다", () => {
      const hll = new HyperLogLog(12);
      for (let i = 0; i < 100; i++) hll.add(`item-${i}`);
      const count100 = hll.count();
      for (let i = 100; i < 1000; i++) hll.add(`item-${i}`);
      const count1000 = hll.count();
      expect(count1000).toBeGreaterThan(count100);
    });

    test("같은 원소를 중복 추가해도 count는 크게 변하지 않는다", () => {
      const hll = new HyperLogLog(12);
      hll.add("dup");
      const count1 = hll.count();
      for (let i = 0; i < 100; i++) hll.add("dup");
      const count2 = hll.count();
      // 중복 추가는 cardinality를 1 이상 늘리지 않아야 함
      expect(count2).toBeLessThan(5);
    });

    test("error()는 1.04/sqrt(2^precision) 값을 반환한다", () => {
      const hll = new HyperLogLog(10);
      const m = 2 ** 10; // 1024
      const expected = 1.04 / Math.sqrt(m);
      expect(hll.error()).toBeCloseTo(expected, 5);
    });
  });

  describe("cardinality 추정 정확도", () => {
    test("n=1000일 때 오차 15% 이내 (precision=12)", () => {
      const hll = new HyperLogLog(12);
      const n = 1000;
      for (let i = 0; i < n; i++) hll.add(`user-${i}`);
      const estimated = hll.count();
      const error = Math.abs(estimated - n) / n;
      expect(error).toBeLessThan(0.15);
    });

    test("n=10000일 때 오차 10% 이내 (precision=14)", () => {
      const hll = new HyperLogLog(14);
      const n = 10000;
      for (let i = 0; i < n; i++) hll.add(`visitor-${i}`);
      const estimated = hll.count();
      const error = Math.abs(estimated - n) / n;
      expect(error).toBeLessThan(0.10);
    });

    test("n=100000일 때 오차 5% 이내 (precision=16)", () => {
      const hll = new HyperLogLog(16);
      const n = 100000;
      for (let i = 0; i < n; i++) hll.add(`page-${i}`);
      const estimated = hll.count();
      const error = Math.abs(estimated - n) / n;
      expect(error).toBeLessThan(0.05);
    });

    test("소규모(n=10)에서 count는 합리적인 범위 내에 있다", () => {
      const hll = new HyperLogLog(10);
      for (let i = 0; i < 10; i++) hll.add(`item-${i}`);
      const estimated = hll.count();
      // 소규모는 오차가 클 수 있으나 0~50 사이는 되어야 함
      expect(estimated).toBeGreaterThan(0);
      expect(estimated).toBeLessThan(50);
    });
  });

  describe("merge", () => {
    test("두 disjoint HLL 병합 후 count는 합산에 근사한다", () => {
      const hll1 = new HyperLogLog(12);
      const hll2 = new HyperLogLog(12);
      for (let i = 0; i < 1000; i++) hll1.add(`a-${i}`);
      for (let i = 0; i < 1000; i++) hll2.add(`b-${i}`);
      const merged = hll1.merge(hll2);
      const estimated = merged.count();
      // 실제 cardinality = 2000, 오차 20% 이내
      expect(estimated).toBeGreaterThan(1600);
      expect(estimated).toBeLessThan(2400);
    });

    test("동일한 HLL 두 개 병합 후 count는 원본과 유사하다", () => {
      const hll1 = new HyperLogLog(12);
      for (let i = 0; i < 1000; i++) hll1.add(`item-${i}`);
      const hll2 = new HyperLogLog(12);
      for (let i = 0; i < 1000; i++) hll2.add(`item-${i}`);
      const merged = hll1.merge(hll2);
      const original = hll1.count();
      const mergedCount = merged.count();
      // 같은 데이터를 두 번 합쳐도 cardinality는 늘지 않음
      expect(mergedCount).toBeGreaterThan(original * 0.8);
      expect(mergedCount).toBeLessThan(original * 1.2);
    });

    test("merge는 새 인스턴스를 반환하고 원본을 수정하지 않는다", () => {
      const hll1 = new HyperLogLog(10);
      const hll2 = new HyperLogLog(10);
      hll1.add("a");
      hll2.add("b");
      const countBefore = hll1.count();
      const merged = hll1.merge(hll2);
      expect(merged).not.toBe(hll1);
      expect(hll1.count()).toBe(countBefore);
    });

    test("merge 결과 HLL에도 add가 가능하다", () => {
      const hll1 = new HyperLogLog(10);
      const hll2 = new HyperLogLog(10);
      hll1.add("hello");
      hll2.add("world");
      const merged = hll1.merge(hll2);
      expect(() => merged.add("new-item")).not.toThrow();
    });
  });

  describe("엣지", () => {
    test("precision=4 (최소)도 동작한다", () => {
      const hll = new HyperLogLog(4);
      for (let i = 0; i < 100; i++) hll.add(`x-${i}`);
      expect(hll.count()).toBeGreaterThan(0);
    });

    test("precision=16 (최대)도 동작한다", () => {
      const hll = new HyperLogLog(16);
      for (let i = 0; i < 1000; i++) hll.add(`y-${i}`);
      expect(hll.count()).toBeGreaterThan(0);
    });

    test("빈 문자열도 처리한다", () => {
      const hll = new HyperLogLog(10);
      expect(() => hll.add("")).not.toThrow();
      expect(hll.count()).toBeGreaterThanOrEqual(0);
    });

    test("유니코드 문자열도 처리한다", () => {
      const hll = new HyperLogLog(10);
      const items = ["안녕하세요", "こんにちは", "你好", "مرحبا", "🎉🎊"];
      for (const item of items) hll.add(item);
      expect(hll.count()).toBeGreaterThan(0);
    });

    test("error()는 precision이 클수록 작아진다", () => {
      const hll4 = new HyperLogLog(4);
      const hll16 = new HyperLogLog(16);
      expect(hll16.error()).toBeLessThan(hll4.error());
    });
  });

  describe("성능", () => {
    test("10^5 add가 200ms 이내 완료된다", () => {
      const hll = new HyperLogLog(12);
      const start = Date.now();
      for (let i = 0; i < 100000; i++) hll.add(`event-${i}`);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(200);
    });

    test("10^3번 merge가 100ms 이내 완료된다", () => {
      const base = new HyperLogLog(10);
      for (let i = 0; i < 100; i++) base.add(`item-${i}`);
      const other = new HyperLogLog(10);
      for (let i = 0; i < 100; i++) other.add(`other-${i}`);
      const start = Date.now();
      for (let i = 0; i < 1000; i++) base.merge(other);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
