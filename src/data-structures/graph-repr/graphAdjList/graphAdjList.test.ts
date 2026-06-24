import { test, expect, describe } from "bun:test";
import { GraphAdjList } from "./graphAdjList";

describe("GraphAdjList", () => {
  describe("기본", () => {
    test("정점 추가 및 vertexCount", () => {
      const g = new GraphAdjList();
      g.addVertex(0);
      g.addVertex(1);
      g.addVertex(2);
      expect(g.vertexCount()).toBe(3);
    });

    test("무방향 간선 추가 및 edgeCount", () => {
      const g = new GraphAdjList(false);
      g.addVertex(0);
      g.addVertex(1);
      g.addEdge(0, 1);
      // 무방향이므로 논리적 간선 1개
      expect(g.edgeCount()).toBe(1);
    });

    test("방향 간선 추가 및 edgeCount", () => {
      const g = new GraphAdjList(true);
      g.addVertex(0);
      g.addVertex(1);
      g.addVertex(2);
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      expect(g.edgeCount()).toBe(2);
    });

    test("무방향 그래프 neighbors — 양방향 확인", () => {
      const g = new GraphAdjList(false);
      g.addVertex(0);
      g.addVertex(1);
      g.addEdge(0, 1, 5);
      const n0 = g.neighbors(0);
      const n1 = g.neighbors(1);
      expect(n0.some((e) => e.vertex === 1 && e.weight === 5)).toBe(true);
      expect(n1.some((e) => e.vertex === 0 && e.weight === 5)).toBe(true);
    });

    test("방향 그래프 neighbors — 단방향 확인", () => {
      const g = new GraphAdjList(true);
      g.addVertex(0);
      g.addVertex(1);
      g.addEdge(0, 1);
      expect(g.neighbors(0).some((e) => e.vertex === 1)).toBe(true);
      expect(g.neighbors(1).some((e) => e.vertex === 0)).toBe(false);
    });

    test("BFS 방문 순서 — 간단한 선형 그래프", () => {
      const g = new GraphAdjList(false);
      [0, 1, 2, 3].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      g.addEdge(2, 3);
      const visited = g.bfs(0);
      expect(visited).toEqual([0, 1, 2, 3]);
    });

    test("BFS 방문 순서 — 트리 구조", () => {
      const g = new GraphAdjList(false);
      [0, 1, 2, 3, 4].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(0, 2);
      g.addEdge(1, 3);
      g.addEdge(1, 4);
      const visited = g.bfs(0);
      // BFS: 0 → 1,2 → 3,4
      expect(visited[0]).toBe(0);
      expect(visited.indexOf(1)).toBeLessThan(visited.indexOf(3));
      expect(visited.indexOf(2)).toBeLessThan(visited.indexOf(3));
    });

    test("DFS 방문 순서 — 선형 그래프", () => {
      const g = new GraphAdjList(false);
      [0, 1, 2, 3].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      g.addEdge(2, 3);
      const visited = g.dfs(0);
      expect(visited).toEqual([0, 1, 2, 3]);
    });

    test("DFS 방문 순서 — 모든 정점 방문", () => {
      const g = new GraphAdjList(false);
      [0, 1, 2, 3, 4].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(0, 2);
      g.addEdge(1, 3);
      g.addEdge(2, 4);
      const visited = g.dfs(0);
      expect(visited.length).toBe(5);
      expect(visited[0]).toBe(0);
      expect(visited.includes(1)).toBe(true);
      expect(visited.includes(2)).toBe(true);
      expect(visited.includes(3)).toBe(true);
      expect(visited.includes(4)).toBe(true);
    });

    test("간선 제거", () => {
      const g = new GraphAdjList(false);
      g.addVertex(0);
      g.addVertex(1);
      g.addEdge(0, 1);
      g.removeEdge(0, 1);
      expect(g.neighbors(0).some((e) => e.vertex === 1)).toBe(false);
      expect(g.neighbors(1).some((e) => e.vertex === 0)).toBe(false);
      expect(g.edgeCount()).toBe(0);
    });
  });

  describe("경로", () => {
    test("연결된 정점 간 경로 존재", () => {
      const g = new GraphAdjList(false);
      [0, 1, 2, 3].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      g.addEdge(2, 3);
      expect(g.hasPath(0, 3)).toBe(true);
    });

    test("직접 연결되지 않아도 경로 존재", () => {
      const g = new GraphAdjList(false);
      [0, 1, 2].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      expect(g.hasPath(0, 2)).toBe(true);
    });

    test("연결 안 된 정점 간 경로 없음", () => {
      const g = new GraphAdjList(false);
      [0, 1, 2, 3].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(2, 3);
      expect(g.hasPath(0, 3)).toBe(false);
    });

    test("방향 그래프 — 단방향 경로", () => {
      const g = new GraphAdjList(true);
      [0, 1, 2].forEach((v) => g.addVertex(v));
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      expect(g.hasPath(0, 2)).toBe(true);
      expect(g.hasPath(2, 0)).toBe(false);
    });

    test("자기 자신으로의 경로", () => {
      const g = new GraphAdjList(false);
      g.addVertex(0);
      expect(g.hasPath(0, 0)).toBe(true);
    });
  });

  describe("엣지", () => {
    test("빈 그래프 — vertexCount 0, edgeCount 0", () => {
      const g = new GraphAdjList();
      expect(g.vertexCount()).toBe(0);
      expect(g.edgeCount()).toBe(0);
    });

    test("단일 정점 그래프 BFS", () => {
      const g = new GraphAdjList();
      g.addVertex(42);
      expect(g.bfs(42)).toEqual([42]);
    });

    test("단일 정점 그래프 DFS", () => {
      const g = new GraphAdjList();
      g.addVertex(42);
      expect(g.dfs(42)).toEqual([42]);
    });

    test("가중치 기본값 1", () => {
      const g = new GraphAdjList(false);
      g.addVertex(0);
      g.addVertex(1);
      g.addEdge(0, 1);
      const n = g.neighbors(0);
      expect(n[0]?.weight).toBe(1);
    });

    test("중복 addVertex — 정점 수 증가 없음", () => {
      const g = new GraphAdjList();
      g.addVertex(0);
      g.addVertex(0);
      expect(g.vertexCount()).toBe(1);
    });

    test("addEdge — 정점이 없으면 자동 생성", () => {
      const g = new GraphAdjList(false);
      g.addEdge(0, 1);
      expect(g.vertexCount()).toBe(2);
    });
  });

  describe("성능", () => {
    test("V=1000 E=5000 BFS 100ms 이내", () => {
      const g = new GraphAdjList(false);
      const V = 1000;
      const E = 5000;
      for (let i = 0; i < V; i++) g.addVertex(i);
      // 먼저 선형 연결로 연결 보장
      for (let i = 0; i < V - 1; i++) g.addEdge(i, i + 1);
      // 나머지 랜덤 간선
      const rand = (n: number) => Math.floor(Math.random() * n);
      for (let i = 0; i < E - (V - 1); i++) {
        g.addEdge(rand(V), rand(V));
      }
      const start = performance.now();
      g.bfs(0);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("V=1000 E=5000 DFS 100ms 이내", () => {
      const g = new GraphAdjList(false);
      const V = 1000;
      for (let i = 0; i < V; i++) g.addVertex(i);
      for (let i = 0; i < V - 1; i++) g.addEdge(i, i + 1);
      const rand = (n: number) => Math.floor(Math.random() * n);
      for (let i = 0; i < 4001; i++) {
        g.addEdge(rand(V), rand(V));
      }
      const start = performance.now();
      g.dfs(0);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
