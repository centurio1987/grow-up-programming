import { test, expect, describe } from "bun:test";
import { directedCycleDetection } from "./directedCycleDetection";

describe("directedCycleDetection", () => {
  // 기본 동작 — 사이클 있음
  test("단순 유향 사이클 0→1→2→0", () => {
    expect(
      directedCycleDetection(3, [
        [0, 1],
        [1, 2],
        [2, 0],
      ]),
    ).toBe(true);
  });

  test("자기 루프 → 사이클", () => {
    expect(directedCycleDetection(1, [[0, 0]])).toBe(true);
  });

  test("이중 간선 0→1, 1→0 → 사이클", () => {
    expect(
      directedCycleDetection(2, [
        [0, 1],
        [1, 0],
      ]),
    ).toBe(true);
  });

  test("DAG 안에 작은 사이클 포함", () => {
    // 0→1, 1→2, 2→3, 3→1 (사이클 1-2-3-1)
    expect(
      directedCycleDetection(4, [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 1],
      ]),
    ).toBe(true);
  });

  // 기본 동작 — 사이클 없음 (DAG)
  test("DAG: 선형 체인", () => {
    expect(
      directedCycleDetection(4, [
        [0, 1],
        [1, 2],
        [2, 3],
      ]),
    ).toBe(false);
  });

  test("DAG: 다이아몬드 (사이클 아님)", () => {
    // 0→1, 0→2, 1→3, 2→3
    expect(
      directedCycleDetection(4, [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ]),
    ).toBe(false);
  });

  test("DAG: 별 모양 (out-star)", () => {
    expect(
      directedCycleDetection(4, [
        [0, 1],
        [0, 2],
        [0, 3],
      ]),
    ).toBe(false);
  });

  // 엣지 케이스
  test("간선이 없는 그래프 — 사이클 없음", () => {
    expect(directedCycleDetection(5, [])).toBe(false);
  });

  test("분리된 두 성분 — 한쪽에만 사이클 있을 때 true", () => {
    // 0→1→2→0 | 3→4
    expect(
      directedCycleDetection(5, [
        [0, 1],
        [1, 2],
        [2, 0],
        [3, 4],
      ]),
    ).toBe(true);
  });

  test("교차 간선(cross edge)은 사이클이 아님", () => {
    // 0→1, 0→2, 1→2 (back edge 없음)
    expect(
      directedCycleDetection(3, [
        [0, 1],
        [0, 2],
        [1, 2],
      ]),
    ).toBe(false);
  });

  // 바운더리
  test("V=1, 간선 없음 → 사이클 없음", () => {
    expect(directedCycleDetection(1, [])).toBe(false);
  });

  test("V=2, 간선 1개 → 사이클 없음", () => {
    expect(directedCycleDetection(2, [[0, 1]])).toBe(false);
  });

  // 성능 테스트
  test("V=10^5 DAG를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = directedCycleDetection(V, edges);
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
    const result = directedCycleDetection(V, edges);
    const elapsed = performance.now() - start;

    expect(result).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });
});
