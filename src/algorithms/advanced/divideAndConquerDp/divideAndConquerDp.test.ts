import { test, expect, describe } from "bun:test";
import { divideAndConquerDp } from "./divideAndConquerDp";

/**
 * 헬퍼: 구간합의 제곱을 비용으로 사용하는 cost matrix 생성
 * cost[i][j] = (sum(a[i..j]))^2 — 사각 부등식을 만족하는 전형 예시
 */
function buildCost(a: number[]): number[][] {
  const n = a.length;
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + a[i]!;
  const cost: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const s = prefix[j + 1] - prefix[i];
      cost[i]![j] = s * s;
    }
  }
  return cost;
}

describe("divideAndConquerDp", () => {
  // 기본 동작
  test("k=1 — 전체 한 구간으로 묶음", () => {
    const cost = buildCost([1, 2, 3, 4]);
    // (1+2+3+4)^2 = 100
    expect(divideAndConquerDp(cost, 1)).toBe(100);
  });

  test("k=n — 각 원소가 한 구간이면 합 = sum(a[i]^2)", () => {
    const cost = buildCost([1, 2, 3, 4]);
    // 1+4+9+16 = 30
    expect(divideAndConquerDp(cost, 4)).toBe(30);
  });

  test("k=2 분할 — [1,2,3,4] 최적 (1+2)+(3+4)=9+49=58 또는 (1)+(2+3+4)=1+81=82 또는 (1+2+3)+(4)=36+16=52", () => {
    const cost = buildCost([1, 2, 3, 4]);
    // 최적: [1,2,3]+[4] = 36+16 = 52
    expect(divideAndConquerDp(cost, 2)).toBe(52);
  });

  // 엣지 케이스
  test("n=1, k=1 → cost[0][0]", () => {
    const cost = [[7]];
    expect(divideAndConquerDp(cost, 1)).toBe(7);
  });

  test("균등 분할이 최적인 경우 [2,2,2,2], k=2", () => {
    const cost = buildCost([2, 2, 2, 2]);
    // [2,2]+[2,2] = 16+16 = 32
    expect(divideAndConquerDp(cost, 2)).toBe(32);
  });

  test("k=2, n=2 강제 분할 [3,5]", () => {
    const cost = buildCost([3, 5]);
    // [3]+[5] = 9+25 = 34
    expect(divideAndConquerDp(cost, 2)).toBe(34);
  });

  test("k=3 [1,1,1,1,1] → 균등 (1,2,2) 또는 (2,1,2) … 최적값 검증", () => {
    const cost = buildCost([1, 1, 1, 1, 1]);
    // 1+4+4=9, 4+1+4=9, 4+4+1=9, 1+1+9=11, … 최솟값=9
    expect(divideAndConquerDp(cost, 3)).toBe(9);
  });

  // 바운더리 테스트
  test("n=3, k=3 — 모두 단일 구간", () => {
    const cost = buildCost([5, 10, 15]);
    // 25+100+225=350
    expect(divideAndConquerDp(cost, 3)).toBe(350);
  });

  test("n=3, k=1 — 한 구간", () => {
    const cost = buildCost([5, 10, 15]);
    expect(divideAndConquerDp(cost, 1)).toBe(900);
  });

  // 성능 테스트 — n=200, k=20, O(k n log n) 충분히 여유
  test("n=200, k=20 — 500ms 이내", () => {
    const N = 200;
    const a = Array.from({ length: N }, (_, i) => ((i * 13) % 7) + 1);
    const cost = buildCost(a);
    const start = performance.now();
    divideAndConquerDp(cost, 20);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
