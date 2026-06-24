import { test, expect, describe } from "bun:test";
import { solution } from "./numberOfDisintersection";

describe("numberOfDisintersection", () => {
  // 기본 동작 — 문제 예시
  test("A=[1,5,2,1,4,0] → 11", () => {
    expect(solution([1, 5, 2, 1, 4, 0])).toBe(11);
  });

  // 교차 없음
  test("A=[0,0,0] → 0 (반지름 0, 인접 원판 비접촉)", () => {
    // disc 0: [0,0], disc 1: [1,1], disc 2: [2,2] — 공유점 없음
    expect(solution([0, 0, 0])).toBe(0);
  });

  // 두 원판이 경계에서 접촉 → 교차로 간주
  test("A=[1,1] → 1 (경계 접촉)", () => {
    // disc 0: [-1,1], disc 1: [0,2] — 겹침
    expect(solution([1, 1])).toBe(1);
  });

  // 두 원판이 딱 붙어있지 않음
  test("A=[0,0] → 0 (거리 1, 반지름 합 0)", () => {
    // disc 0: [0,0], disc 1: [1,1] — 공유점 없음
    expect(solution([0, 0])).toBe(0);
  });

  // 모든 쌍이 교차
  test("A=[10,10,10] → 3 (모두 교차)", () => {
    // disc 0: [-10,10], disc 1: [-9,11], disc 2: [-8,12] — 전부 겹침
    expect(solution([10, 10, 10])).toBe(3);
  });

  // 10,000,000 초과 → -1
  test("N=4473, 모두 큰 반지름 → -1 (쌍 수 > 10,000,000)", () => {
    // 4473 * 4472 / 2 = 10,001,628 > 10,000,000
    const N = 4473;
    const A = new Array(N).fill(N);
    expect(solution(A)).toBe(-1);
  });

  // 10,000,000 이하 — -1 아님
  test("N=4472, 모두 큰 반지름 → 9,997,156 (쌍 수 ≤ 10,000,000)", () => {
    // 4472 * 4471 / 2 = 9,997,156
    const N = 4472;
    const A = new Array(N).fill(N);
    expect(solution(A)).toBe(9_997_156);
  });

  // 엣지 케이스 — 빈 배열
  test("A=[] → 0 (N=0)", () => {
    expect(solution([])).toBe(0);
  });

  // 엣지 케이스 — 원판 1개
  test("A=[5] → 0 (N=1, 쌍 없음)", () => {
    expect(solution([5])).toBe(0);
  });

  // 엣지 케이스 — 최대 반지름
  test("A=[2147483647, 2147483647] → 1 (최대 반지름 두 원판)", () => {
    expect(solution([2_147_483_647, 2_147_483_647])).toBe(1);
  });

  // 바운더리 — N=100,000, 교차 없음
  test("N=100,000, A=[0,...,0] → 0 (모두 반지름 0)", () => {
    const N = 100_000;
    expect(solution(new Array(N).fill(0))).toBe(0);
  });

  // 바운더리 — N=100,000, 교차 초과
  test("N=100,000, A=[N,...] → -1 (교차 수 10,000,000 초과)", () => {
    const N = 100_000;
    expect(solution(new Array(N).fill(N))).toBe(-1);
  });

  // 성능 테스트 — O(N log N) 기준 1000ms 이내
  test("N=100,000 혼합 연산을 1000ms 이내에 처리한다", () => {
    const N = 100_000;
    const A = Array.from({ length: N }, (_, i) => i % 2 === 0 ? i : 1);
    const start = performance.now();
    solution(A);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
