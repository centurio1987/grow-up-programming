import { test, expect, describe } from "bun:test";
import { treeIsomorphism } from "./treeIsomorphism";

describe("treeIsomorphism", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("단일 노드 트리 두 개는 동형", () => {
      expect(treeIsomorphism(1, [], [])).toBe(true);
    });

    test("두 노드 트리 두 개는 동형", () => {
      expect(treeIsomorphism(2, [[0, 1]], [[1, 0]])).toBe(true);
    });

    test("동일한 구조의 작은 트리는 동형 (라벨만 다름)", () => {
      // T1: 0-1, 0-2, 1-3
      // T2: 4-3, 4-2, 3-1 (정점 라벨만 바꿈)
      // 두 트리 모두: 차수 [2,2,1,1] 구조
      const e1: [number, number][] = [
        [0, 1],
        [0, 2],
        [1, 3],
      ];
      const e2: [number, number][] = [
        [3, 2],
        [3, 1],
        [2, 0],
      ];
      expect(treeIsomorphism(4, e1, e2)).toBe(true);
    });

    test("동일한 구조의 트리에서 정점 번호만 치환 (균형 이진)", () => {
      // 0-1, 0-2, 1-3, 1-4 vs 동형(라벨 치환)
      const e1: [number, number][] = [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
      ];
      const e2: [number, number][] = [
        [4, 3],
        [4, 2],
        [3, 1],
        [3, 0],
      ];
      expect(treeIsomorphism(5, e1, e2)).toBe(true);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("체인 트리 두 개는 동형 (방향 반대 입력)", () => {
      // 0-1-2-3-4
      const n = 5;
      const e1: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) e1.push([i, i + 1]);
      // 역순 라벨링한 체인
      const e2: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) e2.push([n - 1 - i, n - 2 - i]);
      expect(treeIsomorphism(n, e1, e2)).toBe(true);
    });

    test("체인 트리와 스타 트리는 동형이 아니다 (n≥4)", () => {
      const n = 5;
      const chain: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) chain.push([i, i + 1]);
      const star: [number, number][] = [];
      for (let i = 1; i < n; i++) star.push([0, i]);
      expect(treeIsomorphism(n, chain, star)).toBe(false);
    });

    test("스타 트리 두 개는 동형", () => {
      const n = 6;
      const s1: [number, number][] = [];
      for (let i = 1; i < n; i++) s1.push([0, i]);
      const s2: [number, number][] = [];
      // 중심이 n-1번 정점인 스타
      for (let i = 0; i < n - 1; i++) s2.push([n - 1, i]);
      expect(treeIsomorphism(n, s1, s2)).toBe(true);
    });

    test("구조는 같지만 깊이가 다른 경우 동형이 아니다", () => {
      // T1: 0-1, 1-2, 2-3, 0-4  (간선 4, 차수: 0=2, 1=2, 2=2, 3=1, 4=1)
      // T2: 0-1, 0-2, 0-3, 0-4  (스타, 차수: 0=4)
      const e1: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [0, 4],
      ];
      const e2: [number, number][] = [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ];
      expect(treeIsomorphism(5, e1, e2)).toBe(false);
    });

    test("동일하지만 동형이 아닌 차수 분포(트리 구조 차이)", () => {
      // T1 (caterpillar-ish): 0-1, 1-2, 2-3, 1-4
      // T2: 0-1, 1-2, 2-3, 3-4 (단순 체인)
      // 둘 다 차수합 같지만 구조가 다르다 (T1은 1번 정점 차수=3)
      const e1: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
      ];
      const e2: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ];
      expect(treeIsomorphism(5, e1, e2)).toBe(false);
    });

    test("중심이 두 개인 트리 (짝수 길이 경로)", () => {
      // T1: 0-1-2-3 (중심 1과 2)
      // T2: 3-2-1-0 (라벨 반전)
      const e1: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      const e2: [number, number][] = [
        [3, 2],
        [2, 1],
        [1, 0],
      ];
      expect(treeIsomorphism(4, e1, e2)).toBe(true);
    });
  });

  // 바운더리 테스트
  describe("바운더리 테스트", () => {
    test("n=1 두 트리는 동형", () => {
      expect(treeIsomorphism(1, [], [])).toBe(true);
    });

    test("n=2 두 트리는 동형", () => {
      expect(treeIsomorphism(2, [[0, 1]], [[0, 1]])).toBe(true);
    });

    test("n=3 경로 두 개는 동형", () => {
      const e1: [number, number][] = [
        [0, 1],
        [1, 2],
      ];
      const e2: [number, number][] = [
        [2, 0],
        [0, 1],
      ];
      expect(treeIsomorphism(3, e1, e2)).toBe(true);
    });
  });

  // 성능 테스트
  describe("성능 테스트", () => {
    test("체인 트리 n=10,000 두 개를 100ms 이내에 판정한다", () => {
      const n = 10_000;
      const e1: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) e1.push([i, i + 1]);
      const e2: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) e2.push([n - 1 - i, n - 2 - i]);

      const start = performance.now();
      const result = treeIsomorphism(n, e1, e2);
      const elapsed = performance.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("스타 트리 n=100,000 두 개를 100ms 이내에 판정한다", () => {
      const n = 100_000;
      const s1: [number, number][] = [];
      for (let i = 1; i < n; i++) s1.push([0, i]);
      const s2: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) s2.push([n - 1, i]);

      const start = performance.now();
      const result = treeIsomorphism(n, s1, s2);
      const elapsed = performance.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });

    test("체인 vs 스타 n=10,000 비동형 판정을 100ms 이내", () => {
      const n = 10_000;
      const chain: [number, number][] = [];
      for (let i = 0; i < n - 1; i++) chain.push([i, i + 1]);
      const star: [number, number][] = [];
      for (let i = 1; i < n; i++) star.push([0, i]);

      const start = performance.now();
      const result = treeIsomorphism(n, chain, star);
      const elapsed = performance.now() - start;

      expect(result).toBe(false);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
