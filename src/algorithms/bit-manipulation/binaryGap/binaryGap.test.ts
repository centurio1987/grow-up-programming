import { test, expect, describe } from "bun:test";
import { binaryGap } from "./binaryGap";

describe("binaryGap", () => {
  // 기본 동작 — 문제 예시
  test("9 (1001) → 0 두 개가 1로 둘러싸임 → 2", () => {
    expect(binaryGap(9)).toBe(2);
  });

  test("529 (1000010001) → gap 4, 3 → 최대 4", () => {
    expect(binaryGap(529)).toBe(4);
  });

  test("20 (10100) → gap 1 → 1", () => {
    expect(binaryGap(20)).toBe(1);
  });

  test("1041 (10000010001) → gap 5, 3 → 최대 5", () => {
    expect(binaryGap(1041)).toBe(5);
  });

  // 엣지 케이스
  test("15 (1111) → 1 사이에 0 없음 → 0", () => {
    expect(binaryGap(15)).toBe(0);
  });

  test("32 (100000) → 오른쪽 끝이 1로 닫히지 않음 → 0", () => {
    expect(binaryGap(32)).toBe(0);
  });

  test("1 (1) → 1이 하나뿐 → 0", () => {
    expect(binaryGap(1)).toBe(0);
  });

  test("6 (110) → 인접한 1들 → 0", () => {
    // 110: 두 1이 붙어있어 gap이 0
    expect(binaryGap(6)).toBe(0);
  });

  test("1073741825 (2^30 + 1, 100...001) → gap 29", () => {
    // 이진: 1 + 29개의 0 + 1 → gap = 29
    expect(binaryGap(2 ** 30 + 1)).toBe(29);
  });

  // 바운더리 테스트
  test("최솟값 N=1 → 0", () => {
    expect(binaryGap(1)).toBe(0);
  });

  test("최댓값 N=2,147,483,647 (2^31-1, 31개의 1) → 인접한 1들만 → 0", () => {
    expect(binaryGap(2_147_483_647)).toBe(0);
  });

  // 성능 테스트 (비트 연산 O(log N), 10^8 ops/sec 기준 충분)
  test("10^6번 호출을 100ms 이내에 처리한다", () => {
    const start = performance.now();
    for (let i = 1; i <= 1_000_000; i++) {
      binaryGap(i);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
