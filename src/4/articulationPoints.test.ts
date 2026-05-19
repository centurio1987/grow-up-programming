import { test, expect, describe } from "bun:test";
import { articulationPoints } from "./articulationPoints";

describe("articulationPoints", () => {
  // 기본 동작
  test("체인 0-1-2-3-4 — 양 끝을 제외한 중간 정점이 단절점", () => {
    expect(
      articulationPoints(5, [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ]),
    ).toEqual([1, 2, 3]);
  });

  test("별 모양 트리 — 중심이 단절점", () => {
    expect(
      articulationPoints(4, [
        [0, 1],
        [0, 2],
        [0, 3],
      ]),
    ).toEqual([0]);
  });

  test("사이클 — 단절점 없음", () => {
    expect(
      articulationPoints(4, [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ]),
    ).toEqual([]);
  });

  test("두 사이클이 한 정점으로 연결 — 그 정점이 단절점", () => {
    // {0,1,2}-사이클 + {2,3,4}-사이클, 2가 공유 → 2가 단절점
    expect(
      articulationPoints(5, [
        [0, 1],
        [1, 2],
        [2, 0],
        [2, 3],
        [3, 4],
        [4, 2],
      ]),
    ).toEqual([2]);
  });

  test("두 사이클이 한 다리(bridge)로 연결", () => {
    // 사이클 {0,1,2}, 사이클 {3,4,5}, 다리 2-3 → 2와 3 모두 단절점
    expect(
      articulationPoints(6, [
        [0, 1],
        [1, 2],
        [2, 0],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 3],
      ]),
    ).toEqual([2, 3]);
  });

  // 엣지 케이스
  test("간선이 없는 그래프 — 단절점 없음", () => {
    expect(articulationPoints(5, [])).toEqual([]);
  });

  test("두 정점 단일 간선 — 단절점 없음", () => {
    expect(articulationPoints(2, [[0, 1]])).toEqual([]);
  });

  test("분리된 두 성분 (체인 + 단일 정점)", () => {
    // 0-1-2 체인 + 3
    expect(
      articulationPoints(4, [
        [0, 1],
        [1, 2],
      ]),
    ).toEqual([1]);
  });

  test("자기 루프 포함 (사이클 정점은 단절점 아님)", () => {
    // 0-1-2-0 사이클 + 0에 self loop
    expect(
      articulationPoints(3, [
        [0, 0],
        [0, 1],
        [1, 2],
        [2, 0],
      ]),
    ).toEqual([]);
  });

  // 바운더리
  test("V=1, 간선 없음", () => {
    expect(articulationPoints(1, [])).toEqual([]);
  });

  test("V=3 트리 — 중간 정점 1만 단절점", () => {
    expect(
      articulationPoints(3, [
        [0, 1],
        [1, 2],
      ]),
    ).toEqual([1]);
  });

  // 성능 테스트
  test("V=10^5 체인 그래프를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = articulationPoints(V, edges);
    const elapsed = performance.now() - start;

    // 체인의 단절점은 양 끝(0, V-1)을 제외한 모든 정점
    expect(result.length).toBe(V - 2);
    expect(result[0]).toBe(1);
    expect(result[result.length - 1]).toBe(V - 2);
    expect(elapsed).toBeLessThan(100);
  });
});
