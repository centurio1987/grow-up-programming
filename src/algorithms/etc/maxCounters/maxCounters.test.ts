import { test, expect, describe } from "bun:test";
import { maxCounters } from "./maxCounters";

describe("maxCounters", () => {
  // 기본 동작 — 문제 예시
  test("N=5, A=[3,4,4,6,1,4,4] → [3,2,2,4,2]", () => {
    expect(maxCounters(5, [3, 4, 4, 6, 1, 4, 4])).toEqual([3, 2, 2, 4, 2]);
  });

  // max counter 없음
  test("N=3, A=[1,2,3,1] → [2,1,1] (increase만)", () => {
    expect(maxCounters(3, [1, 2, 3, 1])).toEqual([2, 1, 1]);
  });

  // max counter만 존재 (증가 연산 없음 → 모두 0)
  test("N=3, A=[4,4,4] → [0,0,0] (max counter만, 증가 없음)", () => {
    expect(maxCounters(3, [4, 4, 4])).toEqual([0, 0, 0]);
  });

  // max counter가 맨 앞
  test("N=2, A=[3,1,2] → [1,1] (max counter 후 각각 증가)", () => {
    // A[0]=3=N+1 → all=0, A[1]=1 → c1=1, A[2]=2 → c2=1
    expect(maxCounters(2, [3, 1, 2])).toEqual([1, 1]);
  });

  // max counter가 맨 뒤
  test("N=3, A=[1,2,3,4] → [1,1,1] (마지막에 max counter)", () => {
    // c=[1,1,1] after increments, then max=1 → all stay 1
    expect(maxCounters(3, [1, 2, 3, 4])).toEqual([1, 1, 1]);
  });

  // max counter 연속 여러 번
  test("N=3, A=[1,4,2,4,3] → [2,2,3]", () => {
    // c=[1,0,0] → max=1,all→[1,1,1] → c2++→[1,2,1] → max=2,all→[2,2,2] → c3++→[2,2,3]
    expect(maxCounters(3, [1, 4, 2, 4, 3])).toEqual([2, 2, 3]);
  });

  // 특정 카운터에 연산이 몰리는 경우
  test("N=3, A=[1,1,1,4,1] → [4,1,1] (카운터 1에 집중)", () => {
    // c1=3, then max=3 all→[3,3,3], c1++ → [4,3,3]
    expect(maxCounters(3, [1, 1, 1, 4, 1])).toEqual([4, 3, 3]);
  });

  // 엣지 케이스 — N=1
  test("N=1, A=[1] → [1]", () => {
    expect(maxCounters(1, [1])).toEqual([1]);
  });

  test("N=1, A=[2] → [0] (max counter만, 초기값 0)", () => {
    expect(maxCounters(1, [2])).toEqual([0]);
  });

  test("N=1, A=[1,1,2,1] → [3] (증가 후 max counter 후 증가)", () => {
    // c=2, max→[2], c++ → [3]
    expect(maxCounters(1, [1, 1, 2, 1])).toEqual([3]);
  });

  // 바운더리 — M=1
  test("N=3, M=1, A=[2] → [0,1,0] (단일 increase 연산)", () => {
    expect(maxCounters(3, [2])).toEqual([0, 1, 0]);
  });

  // 바운더리 — N=100,000, 모두 max counter
  test("N=100,000, A=[N+1 반복] → 모두 0", () => {
    const N = 100_000;
    const A = new Array(100_000).fill(N + 1);
    expect(maxCounters(N, A)).toEqual(new Array(N).fill(0));
  });

  // 성능 테스트 — O(N+M) 기준 100ms 이내
  test("N=M=100,000 혼합 연산을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A = Array.from({ length: 100_000 }, (_, i) =>
      i % 3 === 0 ? N + 1 : (i % N) + 1
    );
    const start = performance.now();
    maxCounters(N, A);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
