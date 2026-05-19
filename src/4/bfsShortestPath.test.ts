import { test, expect, describe } from "bun:test";
import { bfsShortestPath } from "./bfsShortestPath";

describe("bfsShortestPath", () => {
  // 기본 동작
  test("직선 그래프 0-1-2-3, source=0", () => {
    const result = bfsShortestPath(
      4,
      [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
      0,
    );
    expect(result).toEqual([0, 1, 2, 3]);
  });

  test("사이클 그래프 — 더 짧은 경로 선택", () => {
    // 0-1, 0-2, 1-3, 2-3 → 0에서 3까지 거리는 2
    const result = bfsShortestPath(
      4,
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ],
      0,
    );
    expect(result).toEqual([0, 1, 1, 2]);
  });

  test("source가 중간 정점인 경우", () => {
    // 0-1-2-3-4, source=2
    const result = bfsShortestPath(
      5,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      2,
    );
    expect(result).toEqual([2, 1, 0, 1, 2]);
  });

  // 엣지 케이스 — 도달 불가능
  test("도달 불가능한 정점은 -1", () => {
    // 0-1 분리 그래프 | 2-3
    const result = bfsShortestPath(
      4,
      [
        [0, 1],
        [2, 3],
      ],
      0,
    );
    expect(result).toEqual([0, 1, -1, -1]);
  });

  test("간선이 전혀 없는 경우 — source만 0, 나머지는 -1", () => {
    expect(bfsShortestPath(4, [], 1)).toEqual([-1, 0, -1, -1]);
  });

  test("자기 루프는 거리에 영향 없음", () => {
    const result = bfsShortestPath(
      2,
      [
        [0, 0],
        [0, 1],
      ],
      0,
    );
    expect(result).toEqual([0, 1]);
  });

  // 바운더리
  test("V=1, 자기 자신만 source인 경우", () => {
    expect(bfsShortestPath(1, [], 0)).toEqual([0]);
  });

  test("V=2, 간선 1개", () => {
    expect(bfsShortestPath(2, [[0, 1]], 0)).toEqual([0, 1]);
  });

  // 성능 테스트
  test("V=10^5 체인 그래프를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = bfsShortestPath(V, edges, 0);
    const elapsed = performance.now() - start;

    expect(result[0]).toBe(0);
    expect(result[V - 1]).toBe(V - 1);
    expect(elapsed).toBeLessThan(100);
  });
});
