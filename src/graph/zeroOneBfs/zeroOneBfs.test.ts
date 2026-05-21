import { test, expect, describe } from "bun:test";
import { zeroOneBfs } from "./zeroOneBfs";

describe("zeroOneBfs", () => {
  // 기본 동작
  test("모든 간선 가중치 1 — 일반 BFS와 동일", () => {
    const result = zeroOneBfs(
      4,
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ],
      0,
    );
    expect(result).toEqual([0, 1, 2, 3]);
  });

  test("모든 간선 가중치 0 — 모두 거리 0", () => {
    const result = zeroOneBfs(
      4,
      [
        [0, 1, 0],
        [1, 2, 0],
        [2, 3, 0],
      ],
      0,
    );
    expect(result).toEqual([0, 0, 0, 0]);
  });

  test("0-1 혼합 — 가중치 0 경로를 우선 선택", () => {
    // 0 →(1)→ 1 →(1)→ 2,  0 →(0)→ 3 →(0)→ 2  → 2까지 거리는 0
    const result = zeroOneBfs(
      4,
      [
        [0, 1, 1],
        [1, 2, 1],
        [0, 3, 0],
        [3, 2, 0],
      ],
      0,
    );
    expect(result).toEqual([0, 1, 0, 0]);
  });

  test("교묘한 0-1 혼합 그래프", () => {
    // 0 →(1)→ 1, 0 →(0)→ 2, 2 →(1)→ 1  → 1 거리는 1
    const result = zeroOneBfs(
      3,
      [
        [0, 1, 1],
        [0, 2, 0],
        [2, 1, 1],
      ],
      0,
    );
    expect(result).toEqual([0, 1, 0]);
  });

  // 엣지 케이스
  test("도달 불가능한 정점은 -1", () => {
    const result = zeroOneBfs(
      4,
      [
        [0, 1, 1],
        [2, 3, 0],
      ],
      0,
    );
    expect(result).toEqual([0, 1, -1, -1]);
  });

  test("source만 존재하는 경우 — 자기 자신은 0", () => {
    expect(zeroOneBfs(3, [], 1)).toEqual([-1, 0, -1]);
  });

  test("0 간선의 사이클 — 무한 루프 없음", () => {
    const result = zeroOneBfs(
      3,
      [
        [0, 1, 0],
        [1, 2, 0],
        [2, 0, 0],
      ],
      0,
    );
    expect(result).toEqual([0, 0, 0]);
  });

  // 바운더리
  test("V=1, 결과는 [0]", () => {
    expect(zeroOneBfs(1, [], 0)).toEqual([0]);
  });

  test("V=2, 가중치 1 간선 1개", () => {
    expect(zeroOneBfs(2, [[0, 1, 1]], 0)).toEqual([0, 1]);
  });

  test("V=2, 가중치 0 간선 1개", () => {
    expect(zeroOneBfs(2, [[0, 1, 0]], 0)).toEqual([0, 0]);
  });

  // 성능 테스트
  test("V=10^5 0-1 체인 그래프를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1, i % 2]);

    const start = performance.now();
    const result = zeroOneBfs(V, edges, 0);
    const elapsed = performance.now() - start;

    expect(result[0]).toBe(0);
    expect(result[V - 1]).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(100);
  });
});
