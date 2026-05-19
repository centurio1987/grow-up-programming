import { test, expect, describe } from "bun:test";
import { BloomFilter } from "./bloomFilter";

describe("BloomFilter", () => {
  describe("기본", () => {
    test("add 후 has는 true", () => {
      const bf = new BloomFilter(10_000, 5);
      bf.add("apple");
      expect(bf.has("apple")).toBe(true);
    });

    test("여러 원소 add 후 모두 has true", () => {
      const bf = new BloomFilter(10_000, 5);
      const items = ["a", "b", "c", "hello", "world"];
      items.forEach((x) => bf.add(x));
      for (const x of items) expect(bf.has(x)).toBe(true);
    });

    test("add하지 않은 원소는 대부분 false", () => {
      const bf = new BloomFilter(100_000, 7);
      bf.add("known");
      // 충분히 큰 배열이라 false positive는 거의 없음
      let fp = 0;
      for (let i = 0; i < 100; i++) {
        if (bf.has(`unknown-${i}`)) fp++;
      }
      expect(fp).toBeLessThan(10);
    });
  });

  describe("엣지 (확률적 자료구조 — false negative 없음)", () => {
    test("추가된 원소는 항상 has true (no false negative)", () => {
      const bf = new BloomFilter(20_000, 5);
      const items: string[] = [];
      for (let i = 0; i < 1000; i++) {
        const x = `key-${i}`;
        items.push(x);
        bf.add(x);
      }
      for (const x of items) expect(bf.has(x)).toBe(true);
    });

    test("false positive rate가 이론적 상한 근처 (실험적으로 < 5%)", () => {
      // m=100000, k=7, n=1000 → p ≈ (1 - e^(-0.07))^7 ≈ 7.5e-9 → 매우 작음
      const bf = new BloomFilter(100_000, 7);
      for (let i = 0; i < 1000; i++) bf.add(`present-${i}`);

      let fp = 0;
      const trials = 10_000;
      for (let i = 0; i < trials; i++) {
        if (bf.has(`missing-${i}`)) fp++;
      }
      const rate = fp / trials;
      expect(rate).toBeLessThan(0.05);
    });

    test("빈 필터에서 has는 false", () => {
      const bf = new BloomFilter(1000, 3);
      expect(bf.has("anything")).toBe(false);
    });

    test("같은 원소를 여러 번 add 해도 has 결과 동일", () => {
      const bf = new BloomFilter(10_000, 5);
      bf.add("dup");
      bf.add("dup");
      bf.add("dup");
      expect(bf.has("dup")).toBe(true);
    });
  });

  describe("바운더리", () => {
    test("size=1, hashCount=1 — 단일 비트", () => {
      const bf = new BloomFilter(1, 1);
      bf.add("x");
      // 비트 하나만 있으므로 모든 질의는 true
      expect(bf.has("x")).toBe(true);
      expect(bf.has("y")).toBe(true);
    });

    test("n=10^5 add 후에도 모든 원소 has true (no false negative)", () => {
      const n = 100_000;
      const bf = new BloomFilter(1_000_000, 7);
      const items: string[] = [];
      for (let i = 0; i < n; i++) {
        const x = `i${i}`;
        items.push(x);
        bf.add(x);
      }
      // 무작위 1000개 샘플 검증
      for (let i = 0; i < 1000; i++) {
        const idx = (i * 97) % n;
        expect(bf.has(items[idx]!)).toBe(true);
      }
    });
  });

  describe("성능", () => {
    test("n=10^5 add + 10^5 has를 100ms 이내에 처리한다", () => {
      const bf = new BloomFilter(1_000_000, 7);

      const start = performance.now();
      for (let i = 0; i < 100_000; i++) bf.add(`k${i}`);
      let hits = 0;
      for (let i = 0; i < 100_000; i++) if (bf.has(`k${i}`)) hits++;
      const elapsed = performance.now() - start;

      expect(hits).toBe(100_000);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
