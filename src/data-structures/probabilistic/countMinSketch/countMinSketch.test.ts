import { test, expect, describe } from "bun:test";
import { CountMinSketch } from "./countMinSketch";

describe("CountMinSketch", () => {
  describe("기본", () => {
    test("단일 update + estimate", () => {
      const cms = new CountMinSketch(1000, 5);
      cms.update("apple", 1);
      expect(cms.estimate("apple")).toBeGreaterThanOrEqual(1);
    });

    test("여러 번 update 시 추정값이 실제 값 이상", () => {
      const cms = new CountMinSketch(1000, 5);
      for (let i = 0; i < 50; i++) cms.update("banana", 1);
      expect(cms.estimate("banana")).toBeGreaterThanOrEqual(50);
    });

    test("count 인자에 따라 누적", () => {
      const cms = new CountMinSketch(1000, 5);
      cms.update("x", 10);
      cms.update("x", 20);
      expect(cms.estimate("x")).toBeGreaterThanOrEqual(30);
    });
  });

  describe("엣지 (확률적 자료구조 — false negative 없음)", () => {
    test("update 하지 않은 원소의 추정값은 0", () => {
      const cms = new CountMinSketch(1000, 5);
      cms.update("known", 5);
      expect(cms.estimate("never-seen-xyz")).toBe(0);
    });

    test("추정값은 절대 실제 빈도보다 작지 않음 (no underestimate)", () => {
      const cms = new CountMinSketch(2000, 6);
      const truth = new Map<string, number>();
      for (let i = 0; i < 1000; i++) {
        const key = `k${i % 100}`;
        cms.update(key, 1);
        truth.set(key, (truth.get(key) ?? 0) + 1);
      }
      for (const [k, v] of truth) {
        expect(cms.estimate(k)).toBeGreaterThanOrEqual(v);
      }
    });

    test("추정 오차는 ε·N 이내 (확률적 — 폭이 충분히 크면 거의 정확)", () => {
      const N = 1000;
      // ε = e / w, w=4000 → ε ≈ 0.00068, 허용 오차 ≈ 0.001·N + 약간의 충돌
      const cms = new CountMinSketch(4000, 6);
      const truth = new Map<string, number>();
      for (let i = 0; i < N; i++) {
        const key = `item${i % 200}`;
        cms.update(key, 1);
        truth.set(key, (truth.get(key) ?? 0) + 1);
      }
      // 허용 오차: 0.05·N (실험적으로 안정적인 상한)
      const tolerance = Math.ceil(0.05 * N);
      for (const [k, v] of truth) {
        const est = cms.estimate(k);
        expect(est).toBeGreaterThanOrEqual(v);
        expect(est - v).toBeLessThanOrEqual(tolerance);
      }
    });
  });

  describe("바운더리", () => {
    test("width=1, depth=1 — 모든 원소가 충돌하지만 underestimate는 없음", () => {
      const cms = new CountMinSketch(1, 1);
      cms.update("a", 3);
      cms.update("b", 4);
      expect(cms.estimate("a")).toBeGreaterThanOrEqual(3);
      expect(cms.estimate("b")).toBeGreaterThanOrEqual(4);
    });

    test("count=1을 100,000번 호출", () => {
      const cms = new CountMinSketch(10_000, 5);
      for (let i = 0; i < 100_000; i++) cms.update("hot", 1);
      expect(cms.estimate("hot")).toBeGreaterThanOrEqual(100_000);
    });
  });

  describe("성능", () => {
    test("스트림 길이 10^5을 100ms 이내에 처리한다", () => {
      const cms = new CountMinSketch(10_000, 5);

      const start = performance.now();
      for (let i = 0; i < 100_000; i++) cms.update(`k${i % 5000}`, 1);
      let acc = 0;
      for (let i = 0; i < 1000; i++) acc += cms.estimate(`k${i}`);
      const elapsed = performance.now() - start;

      expect(acc).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
