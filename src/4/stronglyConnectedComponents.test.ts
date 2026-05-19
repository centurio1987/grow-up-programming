import { test, expect, describe } from "bun:test";
import { stronglyConnectedComponents } from "./stronglyConnectedComponents";

/**
 * 두 SCC 분할이 동일한지 비교한다 (정점 집합 단위로).
 * 각 SCC 내부는 정렬되어 있고, 전체도 첫 원소 기준 정렬되어 있다고 가정한다.
 */
function sccsEqual(actual: number[][], expected: number[][]): boolean {
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i]!;
    const e = expected[i]!;
    if (a.length !== e.length) return false;
    for (let j = 0; j < a.length; j++) if (a[j] !== e[j]) return false;
  }
  return true;
}

/**
 * 반환 형식 검증: 각 SCC는 오름차순, 전체는 첫 원소 기준 오름차순,
 * 모든 정점이 정확히 하나의 SCC에 등장.
 */
function isWellFormedSCC(sccs: number[][], n: number): boolean {
  const seen = new Set<number>();
  let prevHead = -Infinity;
  for (const comp of sccs) {
    if (comp.length === 0) return false;
    for (let i = 1; i < comp.length; i++) {
      if (comp[i - 1]! >= comp[i]!) return false;
    }
    if (comp[0]! <= prevHead) return false;
    prevHead = comp[0]!;
    for (const v of comp) {
      if (seen.has(v)) return false;
      seen.add(v);
    }
  }
  return seen.size === n;
}

describe("stronglyConnectedComponents", () => {
  // 기본 동작
  test("단일 SCC: 사이클 0→1→2→0", () => {
    const result = stronglyConnectedComponents(3, [
      [0, 1],
      [1, 2],
      [2, 0],
    ]);
    expect(isWellFormedSCC(result, 3)).toBe(true);
    expect(sccsEqual(result, [[0, 1, 2]])).toBe(true);
  });

  test("두 개의 SCC가 한 방향 간선으로 연결", () => {
    // {0,1,2}는 SCC, {3,4}도 SCC, 2→3 간선 (단방향)
    const result = stronglyConnectedComponents(5, [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 3],
    ]);
    expect(isWellFormedSCC(result, 5)).toBe(true);
    expect(sccsEqual(result, [[0, 1, 2], [3, 4]])).toBe(true);
  });

  test("선형 DAG — 각 정점이 자기 자신 SCC", () => {
    const result = stronglyConnectedComponents(4, [
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    expect(isWellFormedSCC(result, 4)).toBe(true);
    expect(sccsEqual(result, [[0], [1], [2], [3]])).toBe(true);
  });

  test("두 SCC가 양방향으로 연결되어 하나의 큰 SCC가 되는 경우", () => {
    // 0→1, 1→0, 1→2, 2→1
    const result = stronglyConnectedComponents(3, [
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
    ]);
    expect(isWellFormedSCC(result, 3)).toBe(true);
    expect(sccsEqual(result, [[0, 1, 2]])).toBe(true);
  });

  // 엣지 케이스
  test("간선이 없는 그래프 — 각 정점이 자기 자신 SCC", () => {
    const result = stronglyConnectedComponents(4, []);
    expect(isWellFormedSCC(result, 4)).toBe(true);
    expect(sccsEqual(result, [[0], [1], [2], [3]])).toBe(true);
  });

  test("자기 루프만 존재 — 여전히 각각 단일 SCC", () => {
    const result = stronglyConnectedComponents(3, [
      [0, 0],
      [1, 1],
    ]);
    expect(isWellFormedSCC(result, 3)).toBe(true);
    expect(sccsEqual(result, [[0], [1], [2]])).toBe(true);
  });

  test("분리된 두 SCC", () => {
    // {0,1} SCC | {2,3} SCC
    const result = stronglyConnectedComponents(4, [
      [0, 1],
      [1, 0],
      [2, 3],
      [3, 2],
    ]);
    expect(isWellFormedSCC(result, 4)).toBe(true);
    expect(sccsEqual(result, [[0, 1], [2, 3]])).toBe(true);
  });

  // 바운더리
  test("V=1, 간선 없음", () => {
    const result = stronglyConnectedComponents(1, []);
    expect(sccsEqual(result, [[0]])).toBe(true);
  });

  test("V=1, 자기 루프", () => {
    const result = stronglyConnectedComponents(1, [[0, 0]]);
    expect(sccsEqual(result, [[0]])).toBe(true);
  });

  // 성능 테스트
  test("V=10^5 큰 사이클 — 단일 SCC를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
    edges.push([V - 1, 0]);

    const start = performance.now();
    const result = stronglyConnectedComponents(V, edges);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(1);
    expect(result[0]!.length).toBe(V);
    expect(elapsed).toBeLessThan(100);
  });

  test("V=10^5 선형 DAG — 모두 단일 정점 SCC를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = stronglyConnectedComponents(V, edges);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(V);
    expect(elapsed).toBeLessThan(100);
  });
});
