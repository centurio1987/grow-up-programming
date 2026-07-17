import { test, expect, describe } from "bun:test";
import { dfsTraversal } from "./dfsTraversal";

describe("dfsTraversal", () => {
  // 기본 동작
  test("분기 그래프 — 작은 이웃 먼저 깊이 우선", () => {
    // 0 - {1,2}, 1 - 3, 2 - 4
    const result = dfsTraversal(5, [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
    ], 0);
    expect(result).toEqual([0, 1, 3, 2, 4]);
  });

  test("이웃 방문 순서는 입력 순서가 아니라 오름차순", () => {
    // edges에 [0,2]가 [0,1]보다 먼저 나오지만 1을 먼저 방문
    const result = dfsTraversal(4, [
      [0, 2],
      [0, 1],
      [1, 3],
    ], 0);
    expect(result).toEqual([0, 1, 3, 2]);
  });

  test("시작 정점이 0이 아닌 경우", () => {
    // 경로 0-1-2-3, start=2
    const result = dfsTraversal(4, [
      [0, 1],
      [1, 2],
      [2, 3],
    ], 2);
    expect(result).toEqual([2, 1, 0, 3]);
  });

  // 엣지 케이스 — 도달 불가능
  test("도달할 수 없는 정점은 제외한다", () => {
    // 0-1 | 2-3, 정점 4는 고립. start=0
    const result = dfsTraversal(5, [
      [0, 1],
      [2, 3],
    ], 0);
    expect(result).toEqual([0, 1]);
  });

  test("자기 루프와 중복 간선은 결과에 영향 없음", () => {
    const result = dfsTraversal(3, [
      [0, 0],
      [0, 1],
      [0, 1],
    ], 0);
    expect(result).toEqual([0, 1]);
  });

  test("고립된 시작 정점", () => {
    // 0-1 존재하지만 start=2는 고립
    const result = dfsTraversal(3, [[0, 1]], 2);
    expect(result).toEqual([2]);
  });

  // 바운더리 테스트
  test("최소 입력 n=1", () => {
    expect(dfsTraversal(1, [], 0)).toEqual([0]);
  });

  test("n=2, 간선 1개", () => {
    expect(dfsTraversal(2, [[0, 1]], 0)).toEqual([0, 1]);
  });

  test("n=2, 간선 없음 — 시작만 반환", () => {
    expect(dfsTraversal(2, [], 1)).toEqual([1]);
  });

  test("입력 edges 배열을 변형하지 않는다", () => {
    const edges: [number, number][] = [
      [0, 2],
      [0, 1],
      [1, 3],
    ];
    const snapshot = JSON.stringify(edges);
    dfsTraversal(4, edges, 0);
    expect(JSON.stringify(edges)).toBe(snapshot);
  });

  // 성능 테스트 — 긴 체인에서도 스택 오버플로 없이 처리
  test("n=10^5 체인 그래프를 100ms 이내에 처리한다", () => {
    const V = 100_000;
    const edges: [number, number][] = [];
    for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

    const start = performance.now();
    const result = dfsTraversal(V, edges, 0);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(V);
    expect(result[0]).toBe(0);
    expect(result[V - 1]).toBe(V - 1);
    expect(elapsed).toBeLessThan(100);
  });
});
