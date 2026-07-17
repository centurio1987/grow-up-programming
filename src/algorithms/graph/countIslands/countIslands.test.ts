import { test, expect, describe } from "bun:test";
import { countIslands } from "./countIslands";

describe("countIslands", () => {
  // 기본 동작
  test("L자 덩어리 + 고립된 낱개 = 2섬", () => {
    expect(countIslands([
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
    ])).toBe(2);
  });

  test("체커보드 — 대각선만 닿아 전부 분리 = 5섬", () => {
    expect(countIslands([
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ])).toBe(5);
  });

  test("전부 이어진 땅 = 1섬", () => {
    expect(countIslands([
      [1, 1],
      [1, 1],
    ])).toBe(1);
  });

  test("한 행에서 물로 갈라짐 = 2섬", () => {
    expect(countIslands([[1, 0, 1, 1]])).toBe(2);
  });

  test("대각선만 닿음 = 2섬", () => {
    expect(countIslands([
      [1, 0],
      [0, 1],
    ])).toBe(2);
  });

  test("N행 1열 — 세로로 물에 갈라짐 = 2섬", () => {
    expect(countIslands([[1], [1], [0], [1]])).toBe(2);
  });

  // 엣지 케이스
  test("전부 물 = 0섬", () => {
    expect(countIslands([
      [0, 0],
      [0, 0],
    ])).toBe(0);
  });

  test("단일 칸 — 땅", () => {
    expect(countIslands([[1]])).toBe(1);
  });

  test("단일 칸 — 물", () => {
    expect(countIslands([[0]])).toBe(0);
  });

  test("빈 격자 = 0섬", () => {
    expect(countIslands([])).toBe(0);
  });

  test("빈 행(열 없음) = 0섬", () => {
    expect(countIslands([[]])).toBe(0);
  });

  test("입력 grid를 변형하지 않는다", () => {
    const grid = [
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const snapshot = JSON.stringify(grid);
    countIslands(grid);
    expect(JSON.stringify(grid)).toBe(snapshot);
  });

  // 성능 테스트 — 큰 그리드에서도 스택 오버플로 없이 처리
  test("1000x1000 전부 땅(10^6 칸)을 200ms 이내에 1섬으로 센다", () => {
    const N = 1000;
    const grid: number[][] = Array.from({ length: N }, () => new Array(N).fill(1));

    const start = performance.now();
    const result = countIslands(grid);
    const elapsed = performance.now() - start;

    expect(result).toBe(1);
    expect(elapsed).toBeLessThan(200);
  });
});
