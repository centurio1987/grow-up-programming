import { test, expect, describe } from "bun:test";
import { lowestSetBit } from "./lowestSetBit";

describe("lowestSetBit", () => {
  // 기본 동작
  test("12 (0b1100) → 4 (0b0100)", () => {
    expect(lowestSetBit(12)).toBe(4);
  });

  test("1 → 1", () => {
    expect(lowestSetBit(1)).toBe(1);
  });

  test("2 → 2", () => {
    expect(lowestSetBit(2)).toBe(2);
  });

  test("6 (0b110) → 2", () => {
    expect(lowestSetBit(6)).toBe(2);
  });

  test("0b10110 → 2", () => {
    expect(lowestSetBit(0b10110)).toBe(2);
  });

  test("0b10000 → 16 (단일 비트인 경우 자신을 반환)", () => {
    expect(lowestSetBit(0b10000)).toBe(16);
  });

  test("0b101010 → 2", () => {
    expect(lowestSetBit(0b101010)).toBe(2);
  });

  // 2의 거듭제곱은 자기 자신을 반환
  test("2의 거듭제곱은 자기 자신을 반환한다", () => {
    for (let k = 0; k < 30; k++) {
      const v = 1 << k;
      expect(lowestSetBit(v)).toBe(v);
    }
  });

  // 엣지 케이스
  test("0 → 0", () => {
    expect(lowestSetBit(0)).toBe(0);
  });

  test("음수 -1 (모든 비트 1) → 1", () => {
    // -1 & 1 = 1
    expect(lowestSetBit(-1)).toBe(1);
  });

  test("음수 -12 → 4", () => {
    // -12 in 2's complement: ...11110100, & 12 (0b1100) = 0b0100 = 4
    expect(lowestSetBit(-12)).toBe(4);
  });

  // 바운더리 — 32-bit 최상위 비트 (부호 비트)
  test("2^30 → 2^30", () => {
    expect(lowestSetBit(1 << 30)).toBe(1 << 30);
  });

  // 성능 테스트 — 10^6 calls 100ms 이내
  test("10^6 번 호출을 100ms 이내에 처리한다", () => {
    const N = 1_000_000;
    let sink = 0;

    const start = performance.now();
    for (let i = 1; i <= N; i++) {
      sink ^= lowestSetBit(i);
    }
    const elapsed = performance.now() - start;

    // 결과를 사용하여 옵티마이저가 호출을 제거하지 못하도록 함
    expect(typeof sink).toBe("number");
    expect(elapsed).toBeLessThan(100);
  });
});
