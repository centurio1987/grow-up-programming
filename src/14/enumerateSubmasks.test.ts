import { test, expect, describe } from "bun:test";
import { enumerateSubmasks } from "./enumerateSubmasks";

describe("enumerateSubmasks", () => {
  // 기본 동작
  test("0b1011 → [11,10,9,8,3,2,1,0]", () => {
    expect(enumerateSubmasks(0b1011)).toEqual([11, 10, 9, 8, 3, 2, 1, 0]);
  });

  test("0b101 → [5,4,1,0]", () => {
    expect(enumerateSubmasks(0b101)).toEqual([5, 4, 1, 0]);
  });

  test("0b111 → [7,6,5,4,3,2,1,0] — 모든 3비트 마스크", () => {
    expect(enumerateSubmasks(0b111)).toEqual([7, 6, 5, 4, 3, 2, 1, 0]);
  });

  test("단일 비트 mask=0b1000 → [8,0]", () => {
    expect(enumerateSubmasks(0b1000)).toEqual([8, 0]);
  });

  test("내림차순으로 정렬되어 있어야 한다", () => {
    const result = enumerateSubmasks(0b10110);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!).toBeGreaterThan(result[i]!);
    }
  });

  test("모든 결과는 mask의 서브마스크여야 한다 ((s & mask) === s)", () => {
    const mask = 0b101101;
    const result = enumerateSubmasks(mask);
    for (const s of result) {
      expect((s & mask) === s).toBe(true);
    }
  });

  test("popcount(mask)=k 이면 결과 길이는 2^k 이다", () => {
    const mask = 0b10110; // popcount = 3
    expect(enumerateSubmasks(mask).length).toBe(2 ** 3);
  });

  test("중복 없이 유일한 값으로 구성된다", () => {
    const result = enumerateSubmasks(0b1111);
    expect(new Set(result).size).toBe(result.length);
  });

  // 엣지 케이스
  test("mask=0 → [0] (공집합만 존재)", () => {
    expect(enumerateSubmasks(0)).toEqual([0]);
  });

  test("mask=1 → [1,0]", () => {
    expect(enumerateSubmasks(1)).toEqual([1, 0]);
  });

  // 바운더리 — popcount = 20 (2^20 서브마스크)
  test("mask=(2^20 - 1) → 길이 2^20, 첫 원소=2^20-1, 마지막=0", () => {
    const mask = (1 << 20) - 1;
    const result = enumerateSubmasks(mask);
    expect(result.length).toBe(1 << 20);
    expect(result[0]).toBe(mask);
    expect(result[result.length - 1]).toBe(0);
  });

  // 성능 테스트 — 2^20 entries 100ms 이내
  test("mask=(2^20 - 1) (20 bits, 2^20 entries) 를 100ms 이내에 처리한다", () => {
    const mask = (1 << 20) - 1;

    const start = performance.now();
    const result = enumerateSubmasks(mask);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(1 << 20);
    expect(elapsed).toBeLessThan(100);
  });
});
