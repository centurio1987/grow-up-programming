import { test, expect, describe } from "bun:test";
import { DAG } from "./dag";

describe("DAG", () => {
  describe("기본", () => {
    test("정점 추가 및 vertexCount", () => {
      const dag = new DAG();
      dag.addVertex(0);
      dag.addVertex(1);
      dag.addVertex(2);
      expect(dag.vertexCount()).toBe(3);
    });

    test("간선 추가 및 edgeCount", () => {
      const dag = new DAG();
      dag.addVertex(0);
      dag.addVertex(1);
      dag.addVertex(2);
      dag.addEdge(0, 1);
      dag.addEdge(1, 2);
      expect(dag.edgeCount()).toBe(2);
    });

    test("hasCycle — DAG는 항상 false", () => {
      const dag = new DAG();
      dag.addVertex(0);
      dag.addVertex(1);
      dag.addVertex(2);
      dag.addEdge(0, 1);
      dag.addEdge(1, 2);
      expect(dag.hasCycle()).toBe(false);
    });

    test("위상 정렬 — 선형 그래프", () => {
      const dag = new DAG();
      [0, 1, 2, 3].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 1);
      dag.addEdge(1, 2);
      dag.addEdge(2, 3);
      const sorted = dag.topologicalSort();
      // 선형 구조이므로 유일한 위상 순서
      expect(sorted).toEqual([0, 1, 2, 3]);
    });

    test("위상 정렬 — 의존성 순서 보장", () => {
      const dag = new DAG();
      // 0 → 2, 1 → 2, 2 → 3
      [0, 1, 2, 3].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 2);
      dag.addEdge(1, 2);
      dag.addEdge(2, 3);
      const sorted = dag.topologicalSort();
      expect(sorted.length).toBe(4);
      // 2는 0, 1보다 뒤에
      expect(sorted.indexOf(0)).toBeLessThan(sorted.indexOf(2));
      expect(sorted.indexOf(1)).toBeLessThan(sorted.indexOf(2));
      // 3은 2보다 뒤에
      expect(sorted.indexOf(2)).toBeLessThan(sorted.indexOf(3));
    });

    test("위상 정렬 — 여러 출발점", () => {
      const dag = new DAG();
      // 0 → 3, 1 → 3, 2 → 4, 3 → 4
      [0, 1, 2, 3, 4].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 3);
      dag.addEdge(1, 3);
      dag.addEdge(2, 4);
      dag.addEdge(3, 4);
      const sorted = dag.topologicalSort();
      expect(sorted.length).toBe(5);
      expect(sorted.indexOf(0)).toBeLessThan(sorted.indexOf(3));
      expect(sorted.indexOf(1)).toBeLessThan(sorted.indexOf(3));
      expect(sorted.indexOf(3)).toBeLessThan(sorted.indexOf(4));
    });

    test("최장 경로 — 선형 그래프 가중치 합", () => {
      const dag = new DAG();
      [0, 1, 2, 3].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 1, 2);
      dag.addEdge(1, 2, 3);
      dag.addEdge(2, 3, 5);
      // 최장 경로: 0→1→2→3, 합 = 2+3+5 = 10
      expect(dag.longestPath()).toBe(10);
    });

    test("최장 경로 — 분기 구조에서 더 긴 경로 선택", () => {
      const dag = new DAG();
      // 0 → 1 (w=1), 0 → 2 (w=10), 1 → 3 (w=1), 2 → 3 (w=1)
      [0, 1, 2, 3].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 1, 1);
      dag.addEdge(0, 2, 10);
      dag.addEdge(1, 3, 1);
      dag.addEdge(2, 3, 1);
      // 경로 0→1→3: 1+1=2, 0→2→3: 10+1=11
      expect(dag.longestPath()).toBe(11);
    });
  });

  describe("사이클 감지", () => {
    test("직접 순환 — A→B→A는 throw", () => {
      const dag = new DAG();
      dag.addVertex(0);
      dag.addVertex(1);
      dag.addEdge(0, 1);
      expect(() => dag.addEdge(1, 0)).toThrow();
    });

    test("간접 순환 — A→B→C→A는 throw", () => {
      const dag = new DAG();
      [0, 1, 2].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 1);
      dag.addEdge(1, 2);
      expect(() => dag.addEdge(2, 0)).toThrow();
    });

    test("자기 루프 — A→A는 throw", () => {
      const dag = new DAG();
      dag.addVertex(0);
      expect(() => dag.addEdge(0, 0)).toThrow();
    });

    test("사이클 아닌 간선은 정상 추가", () => {
      const dag = new DAG();
      [0, 1, 2, 3].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 1);
      dag.addEdge(0, 2);
      dag.addEdge(1, 3);
      dag.addEdge(2, 3); // 다이아몬드 구조 — 사이클 아님
      expect(dag.edgeCount()).toBe(4);
    });

    test("사이클 throw 후 DAG 무결성 유지", () => {
      const dag = new DAG();
      [0, 1].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 1);
      try {
        dag.addEdge(1, 0); // throw 발생
      } catch (_) {
        // 무시
      }
      // 원래 간선은 유지
      expect(dag.edgeCount()).toBe(1);
      expect(dag.hasCycle()).toBe(false);
    });
  });

  describe("엣지", () => {
    test("빈 DAG — vertexCount 0, edgeCount 0", () => {
      const dag = new DAG();
      expect(dag.vertexCount()).toBe(0);
      expect(dag.edgeCount()).toBe(0);
    });

    test("단일 정점 위상 정렬", () => {
      const dag = new DAG();
      dag.addVertex(42);
      expect(dag.topologicalSort()).toEqual([42]);
    });

    test("단일 정점 최장 경로 — 0 반환", () => {
      const dag = new DAG();
      dag.addVertex(0);
      expect(dag.longestPath()).toBe(0);
    });

    test("고립 정점 포함 위상 정렬", () => {
      const dag = new DAG();
      [0, 1, 2, 3].forEach((v) => dag.addVertex(v));
      dag.addEdge(0, 1);
      // 2, 3은 고립 정점
      const sorted = dag.topologicalSort();
      expect(sorted.length).toBe(4);
      expect(sorted.indexOf(0)).toBeLessThan(sorted.indexOf(1));
    });

    test("addEdge — 정점이 없으면 자동 생성", () => {
      const dag = new DAG();
      dag.addEdge(0, 1);
      expect(dag.vertexCount()).toBe(2);
    });

    test("중복 addVertex — 정점 수 증가 없음", () => {
      const dag = new DAG();
      dag.addVertex(0);
      dag.addVertex(0);
      expect(dag.vertexCount()).toBe(1);
    });
  });

  describe("성능", () => {
    test("V=1000 E=2000 위상 정렬 100ms 이내", () => {
      const dag = new DAG();
      const V = 1000;
      for (let i = 0; i < V; i++) dag.addVertex(i);
      // 선형 체인 — 사이클 없음 보장
      for (let i = 0; i < V - 1; i++) dag.addEdge(i, i + 1);
      // 추가 간선 (앞 → 뒤 방향만)
      for (let i = 0; i < 1001; i++) {
        const u = Math.floor(Math.random() * (V - 1));
        const v = u + 1 + Math.floor(Math.random() * (V - 1 - u));
        try {
          dag.addEdge(u, v);
        } catch (_) {
          // 이미 존재하거나 사이클인 경우 무시
        }
      }
      const start = performance.now();
      dag.topologicalSort();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("V=1000 E=2000 최장 경로 100ms 이내", () => {
      const dag = new DAG();
      const V = 1000;
      for (let i = 0; i < V; i++) dag.addVertex(i);
      for (let i = 0; i < V - 1; i++) dag.addEdge(i, i + 1, 1);
      const start = performance.now();
      dag.longestPath();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
