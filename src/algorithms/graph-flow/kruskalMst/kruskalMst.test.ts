import { test, expect, describe } from "bun:test";
import { kruskalMst } from "./kruskalMst";

describe("kruskalMst", () => {
  describe("기본 동작", () => {
    test("CLRS 예시 그래프 → MST 가중치 합 37", () => {
      // CLRS Fig. 23.1 그래프 (정점 9, 간선 14)
      // 정점: a=0,b=1,c=2,d=3,e=4,f=5,g=6,h=7,i=8
      // MST 간선: (a,b)=4, (b,c)=8, (c,d)=7, (d,e)=9, (c,f)=4, (f,g)=2, (g,h)=1, (g,i)=6 ... 합 = 37
      const edges: [number, number, number][] = [
        [0, 1, 4],
        [0, 7, 8],
        [1, 2, 8],
        [1, 7, 11],
        [2, 3, 7],
        [2, 5, 4],
        [2, 8, 2],
        [3, 4, 9],
        [3, 5, 14],
        [4, 5, 10],
        [5, 6, 2],
        [6, 7, 1],
        [6, 8, 6],
        [7, 8, 7],
      ];
      expect(kruskalMst(9, edges)).toBe(37);
    });

    test("삼각형 그래프 → MST는 가장 가벼운 두 간선의 합", () => {
      // 3-cycle (0-1=1, 1-2=2, 0-2=3) → MST = {0-1, 1-2} = 3
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 2],
        [0, 2, 3],
      ];
      expect(kruskalMst(3, edges)).toBe(3);
    });

    test("이미 트리인 그래프 → 모든 간선 가중치 합", () => {
      // 트리: 0-1=5, 1-2=3, 1-3=4 → 합 = 12
      const edges: [number, number, number][] = [
        [0, 1, 5],
        [1, 2, 3],
        [1, 3, 4],
      ];
      expect(kruskalMst(4, edges)).toBe(12);
    });
  });

  describe("엣지 케이스", () => {
    test("정점 1개, 간선 없음 → 0", () => {
      expect(kruskalMst(1, [])).toBe(0);
    });

    test("연결되지 않은 그래프 → -1", () => {
      // 0-1만 연결, 2는 고립
      const edges: [number, number, number][] = [[0, 1, 5]];
      expect(kruskalMst(3, edges)).toBe(-1);
    });

    test("간선 없음에 정점 다수 → -1", () => {
      expect(kruskalMst(4, [])).toBe(-1);
    });

    test("중복 간선 (멀티 엣지) 중 가벼운 것을 선택", () => {
      // 0-1 사이에 가중치 1과 100 두 개 → 1을 선택
      const edges: [number, number, number][] = [
        [0, 1, 100],
        [0, 1, 1],
      ];
      expect(kruskalMst(2, edges)).toBe(1);
    });

    test("동일 가중치 간선이 다수일 때 정상 동작", () => {
      // 4정점 사각형, 모든 간선 가중치 1 → MST 합 = 3
      const edges: [number, number, number][] = [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
        [0, 3, 1],
      ];
      expect(kruskalMst(4, edges)).toBe(3);
    });

    test("가중치 0인 간선 포함", () => {
      // 0-1=0, 1-2=5 → MST = 5
      const edges: [number, number, number][] = [
        [0, 1, 0],
        [1, 2, 5],
      ];
      expect(kruskalMst(3, edges)).toBe(5);
    });
  });

  describe("바운더리", () => {
    test("정점 2개, 간선 1개 (최소 비자명 케이스)", () => {
      expect(kruskalMst(2, [[0, 1, 7]])).toBe(7);
    });

    test("최대 가중치 (1e9) 간선", () => {
      const edges: [number, number, number][] = [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ];
      expect(kruskalMst(3, edges)).toBe(2_000_000_000);
    });
  });

  describe("성능", () => {
    test("V=1e5, E=2e5 입력을 100ms 이내에 처리한다", () => {
      const V = 100_000;
      const edges: [number, number, number][] = [];
      // 일자형 트리 (보장 연결) + 랜덤 추가 간선
      for (let i = 0; i < V - 1; i++) {
        edges.push([i, i + 1, ((i * 1009) % 1000) + 1]);
      }
      // 추가 간선 (사이클 유발)
      const extra = 100_000;
      let seed = 12345;
      for (let i = 0; i < extra; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const u = seed % V;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const v = seed % V;
        if (u !== v) {
          edges.push([u, v, ((i * 31) % 1000) + 1]);
        }
      }

      const start = performance.now();
      kruskalMst(V, edges);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
