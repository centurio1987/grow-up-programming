import { test, expect, describe } from "bun:test";
import { kthSmallest } from "./kthSmallest";

describe("kthSmallest", () => {
  // 본문 예시 = 테스트 케이스 (problem.md "예시"와 기대값이 1:1로 일치해야 한다)
  describe("문서 예시", () => {
    test("[3,1,2] — k=1/2/3", () => {
      expect(kthSmallest([3, 1, 2], 1)).toBe(1);
      expect(kthSmallest([3, 1, 2], 2)).toBe(2);
      expect(kthSmallest([3, 1, 2], 3)).toBe(3);
    });

    test("[7,10,4,3,20,15] — k=3 → 7", () => {
      // 정렬 [3,4,7,10,15,20] → 3번째 → 7
      expect(kthSmallest([7, 10, 4, 3, 20, 15], 3)).toBe(7);
    });

    test("[7,10,4,3,20,15] — k=4 → 10", () => {
      expect(kthSmallest([7, 10, 4, 3, 20, 15], 4)).toBe(10);
    });

    test("음수 섞인 배열 — k=1 → 최솟값", () => {
      // 정렬 [-10,-5,0,5,10] → 1번째 → -10
      expect(kthSmallest([-5, 0, 5, -10, 10], 1)).toBe(-10);
    });

    test("중복은 각각 한 자리 — [2,1,2,1,3,1] k=4 → 2", () => {
      // 정렬 [1,1,1,2,2,3] → 4번째 → 2
      expect(kthSmallest([2, 1, 2, 1, 3, 1], 4)).toBe(2);
    });
  });

  // 바운더리 테스트 (입력 경계: 길이·값 범위·k 양끝)
  describe("바운더리", () => {
    test("최소 길이 (N=1, k=1)", () => {
      expect(kthSmallest([42], 1)).toBe(42);
    });

    test("길이 2 — 작은 쪽 / 큰 쪽", () => {
      expect(kthSmallest([10, 5], 1)).toBe(5);
      expect(kthSmallest([10, 5], 2)).toBe(10);
    });

    test("k=1(최솟값)과 k=N(최댓값) 경계", () => {
      expect(kthSmallest([7, 10, 4, 3, 20, 15], 1)).toBe(3);
      expect(kthSmallest([7, 10, 4, 3, 20, 15], 6)).toBe(20);
    });

    test("값 범위 경계 ±1e9 — [1e9,-1e9,0] k=2 → 0", () => {
      // 정렬 [-1e9, 0, 1e9] → 2번째 → 0
      expect(kthSmallest([1_000_000_000, -1_000_000_000, 0], 2)).toBe(0);
    });
  });

  // 엣지 케이스 (문제 상세가 규정한 예외: 중복·음수·전부 동일)
  describe("엣지 케이스", () => {
    test("모든 원소가 같은 배열 — 어떤 k든 그 값", () => {
      expect(kthSmallest([5, 5, 5, 5], 1)).toBe(5);
      expect(kthSmallest([5, 5, 5, 5], 3)).toBe(5);
      expect(kthSmallest([5, 5, 5, 5], 4)).toBe(5);
    });

    test("중복 경계 — [1,1,2] k=2 → 1", () => {
      expect(kthSmallest([1, 1, 2], 2)).toBe(1);
    });

    test("음수만 있는 배열", () => {
      // 정렬 [-5,-3,-1] → k=2 → -3
      expect(kthSmallest([-1, -5, -3], 2)).toBe(-3);
    });
  });

  // 성능 테스트 — N=100,000 입력을 100ms 이내 (정답은 정렬 비교로 독립 검증)
  test("N=100,000 입력을 100ms 이내에 처리한다", () => {
    const N = 100_000;
    const A: number[] = new Array(N);
    for (let i = 0; i < N; i++)
      A[i] = Math.floor(Math.random() * 2_000_000_001) - 1_000_000_000;
    const k = Math.floor(N / 2) + 1;

    // 입력을 복제해 함수가 원본을 in-place로 바꿔도 검증이 흔들리지 않게 한다.
    const expected = [...A].sort((a, b) => a - b)[k - 1]!;

    const start = performance.now();
    const result = kthSmallest(A, k);
    const elapsed = performance.now() - start;

    expect(result).toBe(expected);
    expect(elapsed).toBeLessThan(100);
  });

  // 무작위 대조 테스트 — 정렬 기준값과 항상 일치하는가 (모든 k에 대해)
  test("무작위 입력에서 정렬 기준값과 일치한다", () => {
    for (let trial = 0; trial < 200; trial++) {
      const N = 1 + Math.floor(Math.random() * 50);
      const A = Array.from({ length: N }, () => Math.floor(Math.random() * 21) - 10);
      const sorted = [...A].sort((a, b) => a - b);
      const k = 1 + Math.floor(Math.random() * N);
      expect(kthSmallest([...A], k)).toBe(sorted[k - 1]!);
    }
  });
});
