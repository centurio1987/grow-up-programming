import { test, expect, describe } from "bun:test";
import { dfsAllPaths } from "./dfsAllPaths";

describe("dfsAllPaths", () => {
  // 기본 동작
  test("다이아몬드 DAG — 두 경로", () => {
    const result = dfsAllPaths(4, [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ], 0, 3);
    expect(result).toEqual([
      [0, 1, 3],
      [0, 2, 3],
    ]);
  });

  test("여러 경로 — 사전식 정렬", () => {
    const result = dfsAllPaths(4, [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 3],
    ], 0, 3);
    expect(result).toEqual([
      [0, 1, 2, 3],
      [0, 1, 3],
      [0, 2, 3],
    ]);
  });

  // 엣지 케이스
  test("경로가 없으면 빈 배열", () => {
    expect(dfsAllPaths(3, [[0, 1]], 0, 2)).toEqual([]);
  });

  test("역방향 간선만 있어 도달 불가", () => {
    expect(dfsAllPaths(2, [[1, 0]], 0, 1)).toEqual([]);
  });

  test("source === target — 길이 1 경로 하나", () => {
    expect(dfsAllPaths(3, [[0, 1], [1, 2]], 1, 1)).toEqual([[1]]);
  });

  test("사이클이 있어도 단순 경로만 반환", () => {
    const result = dfsAllPaths(3, [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 2],
    ], 0, 2);
    expect(result).toEqual([
      [0, 1, 2],
      [0, 2],
    ]);
  });

  test("자기 루프는 무시된다", () => {
    expect(dfsAllPaths(2, [[0, 0], [0, 1]], 0, 1)).toEqual([[0, 1]]);
  });

  test("중복 간선은 경로를 중복 생성하지 않는다", () => {
    const result = dfsAllPaths(3, [
      [0, 1],
      [0, 1],
      [1, 2],
    ], 0, 2);
    expect(result).toEqual([[0, 1, 2]]);
  });

  // 바운더리
  test("최소 입력 n=1, source=target", () => {
    expect(dfsAllPaths(1, [], 0, 0)).toEqual([[0]]);
  });

  test("직접 간선 하나", () => {
    expect(dfsAllPaths(2, [[0, 1]], 0, 1)).toEqual([[0, 1]]);
  });

  test("입력 edges 배열을 변형하지 않는다", () => {
    const edges: [number, number][] = [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ];
    const snapshot = JSON.stringify(edges);
    dfsAllPaths(4, edges, 0, 3);
    expect(JSON.stringify(edges)).toBe(snapshot);
  });

  // 성능 테스트 — m×m 격자 DAG, 경로 수 C(2m, m)
  test("7x7 격자 DAG (3432개 경로)를 100ms 이내에 열거한다", () => {
    const m = 7;
    const id = (r: number, c: number) => r * (m + 1) + c;
    const edges: [number, number][] = [];
    for (let r = 0; r <= m; r++) {
      for (let c = 0; c <= m; c++) {
        if (c < m) edges.push([id(r, c), id(r, c + 1)]);
        if (r < m) edges.push([id(r, c), id(r + 1, c)]);
      }
    }
    const n = (m + 1) * (m + 1);

    const start = performance.now();
    const result = dfsAllPaths(n, edges, id(0, 0), id(m, m));
    const elapsed = performance.now() - start;

    expect(result.length).toBe(3432); // C(14, 7)
    expect(result[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63]);
    expect(elapsed).toBeLessThan(100);
  });
});
