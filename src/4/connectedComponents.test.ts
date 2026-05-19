import { test, expect, describe } from "bun:test";
import { connectedComponents } from "./connectedComponents";

describe("connectedComponents", () => {
  // 기본 동작
  test("단순 분리된 두 성분", () => {
    // 0-1-2  |  3-4
    const result = connectedComponents(5, [
      [0, 1],
      [1, 2],
      [3, 4],
    ]);
    expect(result).toEqual([
      [0, 1, 2],
      [3, 4],
    ]);
  });

  test("하나의 연결된 성분", () => {
    // 사이클: 0-1-2-3-0
    const result = connectedComponents(4, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ]);
    expect(result).toEqual([[0, 1, 2, 3]]);
  });

  test("세 개의 성분 — 각각 정렬된 결과", () => {
    // 0-4 | 1-3-5 | 2
    const result = connectedComponents(6, [
      [0, 4],
      [1, 3],
      [3, 5],
    ]);
    expect(result).toEqual([[0, 4], [1, 3, 5], [2]]);
  });

  // 엣지 케이스
  test("간선이 없는 경우 — 각 정점이 독립 성분", () => {
    const result = connectedComponents(4, []);
    expect(result).toEqual([[0], [1], [2], [3]]);
  });

  test("자기 루프만 존재", () => {
    const result = connectedComponents(3, [[1, 1]]);
    expect(result).toEqual([[0], [1], [2]]);
  });

  test("중복 간선 — 결과에 영향 없음", () => {
    const result = connectedComponents(3, [
      [0, 1],
      [0, 1],
      [1, 0],
    ]);
    expect(result).toEqual([[0, 1], [2]]);
  });

  // 바운더리 테스트
  test("최소 입력 V=1", () => {
    expect(connectedComponents(1, [])).toEqual([[0]]);
  });

  test("V=2, 간선 1개", () => {
    expect(connectedComponents(2, [[0, 1]])).toEqual([[0, 1]]);
  });

  test("V=2, 간선 없음", () => {
    expect(connectedComponents(2, [])).toEqual([[0], [1]]);
  });

  // 성능 테스트
  test("V=10^5 체인 그래프를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = connectedComponents(V, edges);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(1);
    expect(result[0]!.length).toBe(V);
    expect(elapsed).toBeLessThan(100);
  });
});
