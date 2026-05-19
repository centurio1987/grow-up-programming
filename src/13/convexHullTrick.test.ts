import { test, expect, describe } from "bun:test";
import { ConvexHullTrick } from "./convexHullTrick";

describe("ConvexHullTrick", () => {
  // 기본 동작
  test("두 직선의 최솟값 쿼리", () => {
    const cht = new ConvexHullTrick();
    cht.addLine(1, 0); // y = x
    cht.addLine(2, -5); // y = 2x - 5
    // x=0: min(0, -5) = -5
    expect(cht.query(0)).toBe(-5);
    // x=10: min(10, 15) = 10
    expect(cht.query(10)).toBe(10);
    // x=5: min(5, 5) = 5
    expect(cht.query(5)).toBe(5);
  });

  test("세 직선 — 중간 직선이 가장 유리한 구간 검증", () => {
    const cht = new ConvexHullTrick();
    cht.addLine(0, 10); // y = 10
    cht.addLine(1, 0); // y = x
    cht.addLine(2, -10); // y = 2x - 10
    // x=0: min(10,0,-10) = -10
    expect(cht.query(0)).toBe(-10);
    // x=-100: min(10, -100, -210) = -210
    expect(cht.query(-100)).toBe(-210);
    // x=100: min(10, 100, 190) = 10
    expect(cht.query(100)).toBe(10);
  });

  // 엣지 케이스
  test("단일 직선만 등록 → 그 직선의 값", () => {
    const cht = new ConvexHullTrick();
    cht.addLine(3, 7);
    expect(cht.query(0)).toBe(7);
    expect(cht.query(10)).toBe(37);
    expect(cht.query(-5)).toBe(-8);
  });

  test("같은 기울기 두 직선 — 절편이 작은 쪽이 항상 더 작음", () => {
    const cht = new ConvexHullTrick();
    cht.addLine(2, 10);
    cht.addLine(2, 5); // 동일 기울기, 더 작은 절편
    expect(cht.query(0)).toBe(5);
    expect(cht.query(100)).toBe(205);
  });

  test("기울기 0 직선 — 상수 함수", () => {
    const cht = new ConvexHullTrick();
    cht.addLine(0, 5);
    cht.addLine(1, 10);
    expect(cht.query(0)).toBe(5);
    expect(cht.query(-100)).toBe(-90);
  });

  // 바운더리 테스트
  test("음수 기울기 → 양수 기울기 순서로 추가", () => {
    const cht = new ConvexHullTrick();
    cht.addLine(-2, 0);
    cht.addLine(-1, 0);
    cht.addLine(1, 0);
    cht.addLine(2, 0);
    // x=10: min(-20, -10, 10, 20) = -20
    expect(cht.query(10)).toBe(-20);
    // x=-10: min(20, 10, -10, -20) = -20
    expect(cht.query(-10)).toBe(-20);
    // x=0: 0
    expect(cht.query(0)).toBe(0);
  });

  test("불필요한 직선 제거 — 가운데 직선이 무용지물", () => {
    const cht = new ConvexHullTrick();
    cht.addLine(0, -100); // y = -100 (모든 x에서 매우 낮음)
    cht.addLine(1, 0); // y = x (양수 영역에서 큼)
    cht.addLine(2, 100); // y = 2x + 100
    // 어떤 x에서도 y=-100이 가장 작거나 비등
    expect(cht.query(-1000)).toBe(-2000 + 100); // -1900 vs -1000 vs -100 → -1900
    expect(cht.query(0)).toBe(-100);
    expect(cht.query(1000)).toBe(-100); // min(-100, 1000, 2100) = -100
  });

  // 성능 테스트 — n=10^5 라인 추가 + 10^5 쿼리 < 500ms
  test("N=10,000 직선 추가 + 10,000 쿼리 — 500ms 이내", () => {
    const cht = new ConvexHullTrick();
    const N = 10_000;
    const start = performance.now();
    for (let i = 0; i < N; i++) {
      cht.addLine(i, -i * i);
    }
    for (let i = 0; i < N; i++) {
      cht.query(i * 2);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
