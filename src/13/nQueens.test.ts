import { test, expect, describe } from "bun:test";
import { nQueens } from "./nQueens";

describe("nQueens", () => {
  // 기본 동작
  test("n=8 → 92 (고전적 정답)", () => {
    expect(nQueens(8)).toBe(92);
  });

  test("n=4 → 2", () => {
    expect(nQueens(4)).toBe(2);
  });

  test("n=5 → 10", () => {
    expect(nQueens(5)).toBe(10);
  });

  test("n=6 → 4", () => {
    expect(nQueens(6)).toBe(4);
  });

  test("n=7 → 40", () => {
    expect(nQueens(7)).toBe(40);
  });

  // 엣지 케이스
  test("n=1 → 1 (퀸 하나, 1×1 보드)", () => {
    expect(nQueens(1)).toBe(1);
  });

  test("n=2 → 0 (해 없음)", () => {
    expect(nQueens(2)).toBe(0);
  });

  test("n=3 → 0 (해 없음)", () => {
    expect(nQueens(3)).toBe(0);
  });

  // 바운더리 테스트
  test("n=9 → 352", () => {
    expect(nQueens(9)).toBe(352);
  });

  // 성능 테스트 — n=10에서 500ms 이내
  test("n=10 → 724, 500ms 이내", () => {
    const start = performance.now();
    const result = nQueens(10);
    const elapsed = performance.now() - start;
    expect(result).toBe(724);
    expect(elapsed).toBeLessThan(500);
  });
});
