import { test, expect, describe } from "bun:test";
import { bridgesInGraph } from "./bridgesInGraph";

describe("bridgesInGraph", () => {
  // 기본 동작
  test("체인 0-1-2-3 — 모든 간선이 다리", () => {
    expect(
      bridgesInGraph(4, [
        [0, 1],
        [1, 2],
        [2, 3],
      ]),
    ).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  test("사이클 — 다리 없음", () => {
    expect(
      bridgesInGraph(4, [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ]),
    ).toEqual([]);
  });

  test("두 사이클이 한 간선(bridge)으로 연결", () => {
    // 사이클 {0,1,2}, 사이클 {3,4,5}, 다리 2-3
    expect(
      bridgesInGraph(6, [
        [0, 1],
        [1, 2],
        [2, 0],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 3],
      ]),
    ).toEqual([[2, 3]]);
  });

  test("별 모양 트리 — 모든 간선이 다리", () => {
    expect(
      bridgesInGraph(4, [
        [0, 1],
        [0, 2],
        [0, 3],
      ]),
    ).toEqual([
      [0, 1],
      [0, 2],
      [0, 3],
    ]);
  });

  test("사이클에 꼬리(tail)가 붙은 경우 — 꼬리 간선만 다리", () => {
    // 사이클 0-1-2-0 + 꼬리 2-3
    expect(
      bridgesInGraph(4, [
        [0, 1],
        [1, 2],
        [2, 0],
        [2, 3],
      ]),
    ).toEqual([[2, 3]]);
  });

  // 엣지 케이스
  test("간선이 없는 그래프 — 다리 없음", () => {
    expect(bridgesInGraph(5, [])).toEqual([]);
  });

  test("단일 간선 — 그 간선이 다리", () => {
    expect(bridgesInGraph(2, [[0, 1]])).toEqual([[0, 1]]);
  });

  test("분리된 두 트리", () => {
    // 0-1-2 | 3-4
    expect(
      bridgesInGraph(5, [
        [0, 1],
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([
      [0, 1],
      [1, 2],
      [3, 4],
    ]);
  });

  test("중복 간선(parallel edges) — 더 이상 다리 아님", () => {
    // 0-1, 0-1 두 번 → 둘 다 다리 아님
    expect(
      bridgesInGraph(2, [
        [0, 1],
        [0, 1],
      ]),
    ).toEqual([]);
  });

  // 바운더리
  test("V=1, 간선 없음", () => {
    expect(bridgesInGraph(1, [])).toEqual([]);
  });

  test("V=2, 단일 간선", () => {
    expect(bridgesInGraph(2, [[1, 0]])).toEqual([[0, 1]]);
  });

  // 성능 테스트
  test("V=10^5 체인 그래프 — 모든 간선이 다리, 100ms 이내", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = bridgesInGraph(V, edges);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(V - 1);
    expect(result[0]).toEqual([0, 1]);
    expect(result[result.length - 1]).toEqual([V - 2, V - 1]);
    expect(elapsed).toBeLessThan(100);
  });

  test("V=10^5 사이클 — 다리 없음, 100ms 이내", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
    edges.push([V - 1, 0]);

    const start = performance.now();
    const result = bridgesInGraph(V, edges);
    const elapsed = performance.now() - start;

    expect(result).toEqual([]);
    expect(elapsed).toBeLessThan(100);
  });
});
