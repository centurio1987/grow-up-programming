import { test, expect, describe } from "bun:test";
import { maxProfit } from "./maxProfit";

describe("maxProfit", () => {
  // 기본 동작 — 문제 예시
  test("[23171,21011,21123,21366,21013,21367] → P=1, Q=5 → 356", () => {
    expect(maxProfit([23171, 21011, 21123, 21366, 21013, 21367])).toBe(356);
  });

  // 단조 증가 — 전체 구간이 최대 이익
  test("단조 증가 [1,2,3,4,5] → 4", () => {
    expect(maxProfit([1, 2, 3, 4, 5])).toBe(4);
  });

  // 단조 감소 — 이익 불가능
  test("단조 감소 [5,4,3,2,1] → 0", () => {
    expect(maxProfit([5, 4, 3, 2, 1])).toBe(0);
  });

  // 모두 같은 값
  test("모두 동일 [7,7,7,7] → 0", () => {
    expect(maxProfit([7, 7, 7, 7])).toBe(0);
  });

  // 최저점 이후 최고점이 오는 경우
  test("[7,1,5,3,6,4] → P=1(=1), Q=4(=6) → 5", () => {
    expect(maxProfit([7, 1, 5, 3, 6, 4])).toBe(5);
  });

  // 최저점이 최고점보다 뒤에 오는 경우
  test("[10,1] → Q는 P보다 뒤여야 함 → P=0,Q=1 → 1−10=−9, 음수이므로 0", () => {
    // P=0: A[Q]-A[P] 최대 = 1-10 = -9 → 0
    expect(maxProfit([10, 1])).toBe(0);
  });

  test("최저점이 마지막에 위치 [5,4,3,2,1,0] → 0", () => {
    expect(maxProfit([5, 4, 3, 2, 1, 0])).toBe(0);
  });

  // 정답이 배열 앞부분에서 결정되는 경우
  test("이익이 앞부분에서 결정 [1,100,2,3] → P=0,Q=1 → 99", () => {
    expect(maxProfit([1, 100, 2, 3])).toBe(99);
  });

  // 정답이 배열 뒷부분에서 결정되는 경우
  test("이익이 뒷부분에서 결정 [5,6,1,100] → P=2,Q=3 → 99", () => {
    expect(maxProfit([5, 6, 1, 100])).toBe(99);
  });

  // 엣지 케이스 — 빈 배열
  test("N=0 (빈 배열) → 0", () => {
    expect(maxProfit([])).toBe(0);
  });

  // 엣지 케이스 — 원소 1개 (거래 불가)
  test("N=1, [42] → 거래 불가 → 0", () => {
    expect(maxProfit([42])).toBe(0);
  });

  test("N=1, [0] → 0", () => {
    expect(maxProfit([0])).toBe(0);
  });

  // 엣지 케이스 — 원소 2개
  test("N=2, [0,200000] → 최대 이익 200000", () => {
    expect(maxProfit([0, 200_000])).toBe(200_000);
  });

  test("N=2, [200000,0] → 0", () => {
    expect(maxProfit([200_000, 0])).toBe(0);
  });

  test("N=2, [0,0] → 0", () => {
    expect(maxProfit([0, 0])).toBe(0);
  });

  // 바운더리 — 값 범위 최댓값
  test("0과 200,000 혼합 [200000,0,200000] → 200000", () => {
    expect(maxProfit([200_000, 0, 200_000])).toBe(200_000);
  });

  test("모두 0 [0,0,0,0] → 0", () => {
    expect(maxProfit([0, 0, 0, 0])).toBe(0);
  });

  test("모두 최댓값 [200000,200000,200000] → 0", () => {
    expect(maxProfit([200_000, 200_000, 200_000])).toBe(0);
  });

  // 동일한 최저점이 여러 번 등장
  test("최저점이 여러 번 [3,1,4,1,5,9,2,6] → P=1 or 3, Q=5 → 8", () => {
    expect(maxProfit([3, 1, 4, 1, 5, 9, 2, 6])).toBe(8);
  });

  // V자 패턴
  test("V자 패턴 [10,5,1,5,10] → P=2(=1), Q=4(=10) → 9", () => {
    expect(maxProfit([10, 5, 1, 5, 10])).toBe(9);
  });

  // 바운더리 — N=400,000
  test("N=400,000, 단조 증가 → A[N-1]-A[0] = 정답", () => {
    const N = 400_000;
    // 0..N-1을 200_000 범위에 맞추기 위해 i % 200_001 사용은 단조성을 깨므로
    // 단조 증가 패턴을 작은 단위로 구성: A[i] = Math.floor(i * 200_000 / (N-1))
    const A = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      A[i] = Math.floor((i * 200_000) / (N - 1));
    }
    expect(maxProfit(A)).toBe(200_000);
  });

  // 성능 테스트 — N=400,000을 O(N)으로 처리 (CPU 10^8 ops/sec 기준, 충분히 여유)
  test("N=400,000 입력을 100ms 이내에 처리한다", () => {
    const N = 400_000;
    // 톱니파 패턴으로 다양한 최저/최고점이 등장하도록 구성
    const A = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      A[i] = (i * 7919) % 200_001;
    }

    const start = performance.now();
    const result = maxProfit(A);
    const elapsed = performance.now() - start;

    expect(result).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(100);
  });

  // 성능 테스트 — 최악 케이스 (단조 감소: 매번 최저점 갱신)
  test("N=400,000 단조 감소 (최저점 매번 갱신)를 100ms 이내에 처리한다", () => {
    const N = 400_000;
    const A = new Array<number>(N);
    for (let i = 0; i < N; i++) {
      A[i] = 200_000 - Math.floor((i * 200_000) / (N - 1));
    }

    const start = performance.now();
    const result = maxProfit(A);
    const elapsed = performance.now() - start;

    expect(result).toBe(0);
    expect(elapsed).toBeLessThan(100);
  });
});
