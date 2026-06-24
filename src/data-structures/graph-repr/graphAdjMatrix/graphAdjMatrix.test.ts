import { test, expect, describe } from "bun:test";
import { GraphAdjMatrix } from "./graphAdjMatrix";

describe("GraphAdjMatrix", () => {
  describe("기본", () => {
    test("vertexCount — size 만큼 정점", () => {
      const g = new GraphAdjMatrix(5);
      expect(g.vertexCount()).toBe(5);
    });

    test("무방향 간선 추가 및 hasEdge 양방향", () => {
      const g = new GraphAdjMatrix(4, false);
      g.addEdge(0, 1);
      expect(g.hasEdge(0, 1)).toBe(true);
      expect(g.hasEdge(1, 0)).toBe(true);
    });

    test("방향 간선 추가 — 단방향만 hasEdge true", () => {
      const g = new GraphAdjMatrix(4, true);
      g.addEdge(0, 1);
      expect(g.hasEdge(0, 1)).toBe(true);
      expect(g.hasEdge(1, 0)).toBe(false);
    });

    test("가중치 기본값 1", () => {
      const g = new GraphAdjMatrix(3);
      g.addEdge(0, 1);
      expect(g.weight(0, 1)).toBe(1);
    });

    test("사용자 지정 가중치", () => {
      const g = new GraphAdjMatrix(3);
      g.addEdge(0, 2, 7);
      expect(g.weight(0, 2)).toBe(7);
      expect(g.weight(2, 0)).toBe(7); // 무방향
    });

    test("간선 없는 정점 weight — undefined 반환", () => {
      const g = new GraphAdjMatrix(3);
      expect(g.weight(0, 2)).toBeUndefined();
    });

    test("간선 제거 후 hasEdge false", () => {
      const g = new GraphAdjMatrix(3, false);
      g.addEdge(0, 1);
      g.removeEdge(0, 1);
      expect(g.hasEdge(0, 1)).toBe(false);
      expect(g.hasEdge(1, 0)).toBe(false);
    });

    test("neighbors — 연결된 정점 목록 반환", () => {
      const g = new GraphAdjMatrix(4, false);
      g.addEdge(0, 1);
      g.addEdge(0, 2);
      g.addEdge(0, 3);
      expect(g.neighbors(0).sort()).toEqual([1, 2, 3]);
    });

    test("neighbors — 간선 없으면 빈 배열", () => {
      const g = new GraphAdjMatrix(4);
      expect(g.neighbors(2)).toEqual([]);
    });

    test("BFS 방문 순서 — 선형 그래프", () => {
      const g = new GraphAdjMatrix(4, false);
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      g.addEdge(2, 3);
      const visited = g.bfs(0);
      expect(visited).toEqual([0, 1, 2, 3]);
    });

    test("BFS — 모든 정점 방문 (연결 그래프)", () => {
      const g = new GraphAdjMatrix(5, false);
      g.addEdge(0, 1);
      g.addEdge(0, 2);
      g.addEdge(1, 3);
      g.addEdge(2, 4);
      const visited = g.bfs(0);
      expect(visited.length).toBe(5);
      expect(visited[0]).toBe(0);
    });

    test("DFS 방문 순서 — 선형 그래프", () => {
      const g = new GraphAdjMatrix(4, false);
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      g.addEdge(2, 3);
      const visited = g.dfs(0);
      expect(visited).toEqual([0, 1, 2, 3]);
    });

    test("DFS — 모든 정점 방문 (연결 그래프)", () => {
      const g = new GraphAdjMatrix(5, false);
      g.addEdge(0, 1);
      g.addEdge(0, 2);
      g.addEdge(1, 3);
      g.addEdge(2, 4);
      const visited = g.dfs(0);
      expect(visited.length).toBe(5);
      expect(visited[0]).toBe(0);
    });
  });

  describe("경로", () => {
    test("BFS — 비연결 정점은 방문하지 않음", () => {
      const g = new GraphAdjMatrix(4, false);
      g.addEdge(0, 1);
      // 2, 3은 고립
      const visited = g.bfs(0);
      expect(visited.includes(2)).toBe(false);
      expect(visited.includes(3)).toBe(false);
    });

    test("DFS — 비연결 정점은 방문하지 않음", () => {
      const g = new GraphAdjMatrix(4, false);
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      const visited = g.dfs(0);
      expect(visited.includes(3)).toBe(false);
    });

    test("방향 그래프 BFS — 단방향 경로만 탐색", () => {
      const g = new GraphAdjMatrix(3, true);
      g.addEdge(0, 1);
      g.addEdge(1, 2);
      const fromZero = g.bfs(0);
      expect(fromZero).toEqual([0, 1, 2]);
      const fromTwo = g.bfs(2);
      expect(fromTwo).toEqual([2]); // 2에서 갈 수 있는 곳 없음
    });
  });

  describe("엣지", () => {
    test("size=1 — 단일 정점 BFS", () => {
      const g = new GraphAdjMatrix(1);
      expect(g.bfs(0)).toEqual([0]);
    });

    test("size=1 — 단일 정점 DFS", () => {
      const g = new GraphAdjMatrix(1);
      expect(g.dfs(0)).toEqual([0]);
    });

    test("자기 루프 addEdge(v, v)", () => {
      const g = new GraphAdjMatrix(3);
      g.addEdge(1, 1, 3);
      expect(g.hasEdge(1, 1)).toBe(true);
      expect(g.weight(1, 1)).toBe(3);
    });

    test("간선 재추가 — 가중치 덮어쓰기", () => {
      const g = new GraphAdjMatrix(3);
      g.addEdge(0, 1, 2);
      g.addEdge(0, 1, 9);
      expect(g.weight(0, 1)).toBe(9);
    });

    test("완전 그래프(complete graph) 구성", () => {
      const n = 4;
      const g = new GraphAdjMatrix(n, false);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          g.addEdge(i, j);
        }
      }
      // 모든 정점 쌍이 연결
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i !== j) expect(g.hasEdge(i, j)).toBe(true);
        }
      }
    });
  });

  describe("성능", () => {
    test("V=200 완전 그래프 BFS 100ms 이내", () => {
      const V = 200;
      const g = new GraphAdjMatrix(V, false);
      for (let i = 0; i < V; i++) {
        for (let j = i + 1; j < V; j++) {
          g.addEdge(i, j);
        }
      }
      const start = performance.now();
      g.bfs(0);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("V=200 완전 그래프 DFS 100ms 이내", () => {
      const V = 200;
      const g = new GraphAdjMatrix(V, false);
      for (let i = 0; i < V; i++) {
        for (let j = i + 1; j < V; j++) {
          g.addEdge(i, j);
        }
      }
      const start = performance.now();
      g.dfs(0);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
