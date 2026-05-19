import { test, expect, describe } from "bun:test";
import { topologicalSort } from "./topologicalSort";

/**
 * 유효한 위상 정렬인지 검증한다.
 * - 모든 정점이 정확히 한 번씩 등장하는 순열인지
 * - 모든 간선 (u, v)에 대해 u가 v보다 앞에 오는지
 */
function isValidTopologicalOrder(
  order: number[],
  n: number,
  edges: [number, number][],
): boolean {
  if (order.length !== n) return false;

  const position = new Array<number>(n).fill(-1);
  for (let i = 0; i < order.length; i++) {
    const v = order[i]!;
    if (v < 0 || v >= n) return false;
    if (position[v] !== -1) return false;
    position[v] = i;
  }
  for (let i = 0; i < n; i++) if (position[i] === -1) return false;

  for (const [u, v] of edges) {
    if (position[u]! >= position[v]!) return false;
  }
  return true;
}

describe("topologicalSort", () => {
  // 기본 동작
  test("선형 체인 DAG", () => {
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
    ];
    const result = topologicalSort(4, edges);
    expect(result).not.toBeNull();
    expect(isValidTopologicalOrder(result!, 4, edges)).toBe(true);
  });

  test("다이아몬드 DAG", () => {
    const edges: [number, number][] = [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ];
    const result = topologicalSort(4, edges);
    expect(result).not.toBeNull();
    expect(isValidTopologicalOrder(result!, 4, edges)).toBe(true);
  });

  test("분리된 두 DAG", () => {
    const edges: [number, number][] = [
      [0, 1],
      [2, 3],
    ];
    const result = topologicalSort(4, edges);
    expect(result).not.toBeNull();
    expect(isValidTopologicalOrder(result!, 4, edges)).toBe(true);
  });

  test("복잡한 DAG", () => {
    const edges: [number, number][] = [
      [5, 2],
      [5, 0],
      [4, 0],
      [4, 1],
      [2, 3],
      [3, 1],
    ];
    const result = topologicalSort(6, edges);
    expect(result).not.toBeNull();
    expect(isValidTopologicalOrder(result!, 6, edges)).toBe(true);
  });

  // 엣지 케이스 — 사이클 → null
  test("단순 사이클 → null", () => {
    expect(
      topologicalSort(3, [
        [0, 1],
        [1, 2],
        [2, 0],
      ]),
    ).toBeNull();
  });

  test("자기 루프 → null", () => {
    expect(topologicalSort(1, [[0, 0]])).toBeNull();
  });

  test("부분적으로 사이클을 포함한 그래프 → null", () => {
    expect(
      topologicalSort(4, [
        [0, 1],
        [1, 2],
        [2, 1],
      ]),
    ).toBeNull();
  });

  // 엣지 케이스 — 간선 없음
  test("간선이 없는 그래프 — 모든 순열이 유효", () => {
    const result = topologicalSort(4, []);
    expect(result).not.toBeNull();
    expect(isValidTopologicalOrder(result!, 4, [])).toBe(true);
  });

  // 바운더리
  test("V=1, 간선 없음", () => {
    const result = topologicalSort(1, []);
    expect(result).toEqual([0]);
  });

  test("V=2, 간선 1개", () => {
    const result = topologicalSort(2, [[0, 1]]);
    expect(result).toEqual([0, 1]);
  });

  // 성능 테스트
  test("V=10^5 체인 DAG를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = topologicalSort(V, edges);
    const elapsed = performance.now() - start;

    expect(result).not.toBeNull();
    expect(result!.length).toBe(V);
    expect(isValidTopologicalOrder(result!, V, edges)).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });
});
