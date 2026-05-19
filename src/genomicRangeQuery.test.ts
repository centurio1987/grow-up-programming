import { test, expect, describe } from "bun:test";
import { solution } from "./genomicRangeQuery";

describe("genomicRangeQuery", () => {
  // 기본 동작 — 문제 예시
  test('S="CAGCCTA", P=[2,5,0], Q=[4,5,6] → [2,4,1]', () => {
    expect(solution("CAGCCTA", [2, 5, 0], [4, 5, 6])).toEqual([2, 4, 1]);
  });

  // 단일 뉴클레오타이드 쿼리 — 각 문자별 충격 지수 확인
  test('S="ACGT", 단일 위치 쿼리 → [1,2,3,4]', () => {
    expect(solution("ACGT", [0, 1, 2, 3], [0, 1, 2, 3])).toEqual([1, 2, 3, 4]);
  });

  // 구간 내 최솟값이 범위 시작/중간/끝에 위치하는 경우
  test('S="TCGA", P=[0], Q=[3] → [1] (A가 끝에 위치)', () => {
    expect(solution("TCGA", [0], [3])).toEqual([1]);
  });

  test('S="ATCG", P=[0], Q=[3] → [1] (A가 처음에 위치)', () => {
    expect(solution("ATCG", [0], [3])).toEqual([1]);
  });

  test('S="TCAG", P=[0], Q=[3] → [1] (A가 중간에 위치)', () => {
    expect(solution("TCAG", [0], [3])).toEqual([1]);
  });

  // 전체 구간 쿼리
  test('S="CAGCCTA", P=[0], Q=[6] → [1] (전체 범위, A 포함)', () => {
    expect(solution("CAGCCTA", [0], [6])).toEqual([1]);
  });

  // A가 없는 구간
  test('S="CAGCCTA", P=[0], Q=[0] → [2] (C 하나)', () => {
    expect(solution("CAGCCTA", [0], [0])).toEqual([2]);
  });

  // 엣지 케이스 — N=1, M=1
  test('S="A", P=[0], Q=[0] → [1]', () => {
    expect(solution("A", [0], [0])).toEqual([1]);
  });

  test('S="T", P=[0], Q=[0] → [4]', () => {
    expect(solution("T", [0], [0])).toEqual([4]);
  });

  // 엣지 케이스 — 단일 종류 뉴클레오타이드
  test('S="AAAA", 모든 쿼리 → 항상 1', () => {
    expect(solution("AAAA", [0, 1, 0], [3, 2, 1])).toEqual([1, 1, 1]);
  });

  test('S="TTTT", 모든 쿼리 → 항상 4', () => {
    expect(solution("TTTT", [0, 1, 0], [3, 2, 1])).toEqual([4, 4, 4]);
  });

  // 엣지 케이스 — P[K] == Q[K] (단일 위치 쿼리 다수)
  test('S="GCAT", P[K]==Q[K] for all K → [3,2,1,4]', () => {
    expect(solution("GCAT", [0, 1, 2, 3], [0, 1, 2, 3])).toEqual([3, 2, 1, 4]);
  });

  // 바운더리 — P[K]=0, Q[K]=N-1 (전체 범위 반복 쿼리)
  test('S="GTCA", P=[0,0], Q=[3,3] → [1,1] (전체 범위 반복)', () => {
    expect(solution("GTCA", [0, 0], [3, 3])).toEqual([1, 1]);
  });

  // 바운더리 — A가 없는 구간 vs A가 있는 구간
  test('S="GCTA", A 포함 구간과 미포함 구간 혼합', () => {
    // [0,1]="GC" → min=2, [0,3]="GCTA" → min=1, [2,3]="TA" → min=1
    expect(solution("GCTA", [0, 0, 2], [1, 3, 3])).toEqual([2, 1, 1]);
  });

  // 성능 테스트 — N=100,000, M=50,000 기준 1000ms 이내
  test("N=100,000 M=50,000 혼합 쿼리를 1000ms 이내에 처리한다", () => {
    const N = 100_000;
    const M = 50_000;
    const nucleotides = ["A", "C", "G", "T"] as const;
    const S = Array.from({ length: N }, (_, i) => nucleotides[i % 4]!).join("");
    const P = Array.from({ length: M }, (_, i) => i % N);
    const Q = Array.from({ length: M }, (_, i) => Math.min((i * 2) % N, N - 1));
    // P[K] <= Q[K] 보장
    const safeP = P.map((p, k) => Math.min(p, Q[k]!));
    const safeQ = Q.map((q, k) => Math.max(q, P[k]!));

    const start = performance.now();
    solution(S, safeP, safeQ);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
