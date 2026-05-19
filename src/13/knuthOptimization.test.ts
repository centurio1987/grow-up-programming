import { test, expect, describe } from "bun:test";
import { knuthOptimization } from "./knuthOptimization";

describe("knuthOptimization", () => {
  // 기본 동작
  test("[10,20,30] → 90", () => {
    // (10+20)=30, 그 후 (30+30)=60 → 총 90
    expect(knuthOptimization([10, 20, 30])).toBe(90);
  });

  test("[40,30,30,20] 검증", () => {
    // 최적 병합: ((40+30)=70) + (30+20=50) + (70+50=120) = 240
    expect(knuthOptimization([40, 30, 30, 20])).toBe(240);
  });

  test("[1,2,3,4,5] 검증", () => {
    // dp[0..4] 직접 계산: 정답은 33
    expect(knuthOptimization([1, 2, 3, 4, 5])).toBe(33);
  });

  // 엣지 케이스
  test("길이 1 — 병합할 것 없음 → 0", () => {
    expect(knuthOptimization([100])).toBe(0);
  });

  test("길이 2 — 단일 병합", () => {
    expect(knuthOptimization([5, 7])).toBe(12);
  });

  test("모두 같은 값 [10,10,10,10]", () => {
    // (10+10)+(10+10) = 20+20 = 40, 그 후 40+40 = 80 → 총 40+40+80=… 검증
    // dp[0..3]: prefix합 40, 분할 k=1: dp[0..1]+dp[2..3]+40 = 20+20+40=80
    expect(knuthOptimization([10, 10, 10, 10])).toBe(80);
  });

  test("0 포함 [0,5,0]", () => {
    // (0+5)+(0)=5, 5+0=5 → 10 또는 (0)+(5+0)=5, 0+5=5 → 10
    expect(knuthOptimization([0, 5, 0])).toBe(10);
  });

  // 바운더리 테스트
  test("모두 0인 배열 → 0", () => {
    expect(knuthOptimization([0, 0, 0, 0])).toBe(0);
  });

  test("매우 큰 값 단일 [10^6]", () => {
    expect(knuthOptimization([1_000_000])).toBe(0);
  });

  // 성능 테스트 — O(n^2)이면 n=2000에서 500ms 이내
  test("n=500 입력을 500ms 이내에 처리한다", () => {
    const N = 500;
    const freq = Array.from({ length: N }, (_, i) => (i % 97) + 1);
    const start = performance.now();
    knuthOptimization(freq);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
