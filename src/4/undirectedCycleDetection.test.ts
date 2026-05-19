import { test, expect, describe } from "bun:test";
import { undirectedCycleDetection } from "./undirectedCycleDetection";

describe("undirectedCycleDetection", () => {
  // 기본 동작 — 사이클 있음
  test("삼각형 (3-사이클)", () => {
    expect(
      undirectedCycleDetection(3, [
        [0, 1],
        [1, 2],
        [2, 0],
      ]),
    ).toBe(true);
  });

  test("사각형 (4-사이클)", () => {
    expect(
      undirectedCycleDetection(4, [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ]),
    ).toBe(true);
  });

  test("분리된 두 성분 중 하나에만 사이클 — true", () => {
    // 0-1-2-0 | 3-4
    expect(
      undirectedCycleDetection(5, [
        [0, 1],
        [1, 2],
        [2, 0],
        [3, 4],
      ]),
    ).toBe(true);
  });

  // 기본 동작 — 사이클 없음
  test("트리 (체인) — 사이클 없음", () => {
    expect(
      undirectedCycleDetection(4, [
        [0, 1],
        [1, 2],
        [2, 3],
      ]),
    ).toBe(false);
  });

  test("별 모양 트리 — 사이클 없음", () => {
    expect(
      undirectedCycleDetection(4, [
        [0, 1],
        [0, 2],
        [0, 3],
      ]),
    ).toBe(false);
  });

  test("포레스트 (분리된 트리들) — 사이클 없음", () => {
    expect(
      undirectedCycleDetection(6, [
        [0, 1],
        [1, 2],
        [3, 4],
        [4, 5],
      ]),
    ).toBe(false);
  });

  // 엣지 케이스
  test("자기 루프 — 사이클로 판정 (true)", () => {
    expect(undirectedCycleDetection(2, [[0, 0]])).toBe(true);
  });

  test("중복 간선 (0-1, 0-1) — 사이클로 판정 (true)", () => {
    expect(
      undirectedCycleDetection(2, [
        [0, 1],
        [0, 1],
      ]),
    ).toBe(true);
  });

  test("간선이 없는 그래프 — 사이클 없음", () => {
    expect(undirectedCycleDetection(5, [])).toBe(false);
  });

  // 바운더리
  test("V=1, 간선 없음", () => {
    expect(undirectedCycleDetection(1, [])).toBe(false);
  });

  test("V=2, 간선 1개", () => {
    expect(undirectedCycleDetection(2, [[0, 1]])).toBe(false);
  });

  // 성능 테스트
  test("V=10^5 체인 그래프(사이클 없음)를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = undirectedCycleDetection(V, edges);
    const elapsed = performance.now() - start;

    expect(result).toBe(false);
    expect(elapsed).toBeLessThan(100);
  });

  test("V=10^5 사이클 그래프를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
    edges.push([V - 1, 0]);

    const start = performance.now();
    const result = undirectedCycleDetection(V, edges);
    const elapsed = performance.now() - start;

    expect(result).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });
});
