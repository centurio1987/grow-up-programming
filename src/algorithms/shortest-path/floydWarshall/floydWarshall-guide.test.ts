/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/shortest-path/floydWarshall/floydWarshall.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`floydWarshall-guide.ref.ts`)에
 * 다시 건다. 벽시계를 재는 케이스(`V = 200` 을 100ms 안에)는 시간 판정을 뺀 채로 옮겼다 —
 * 실행마다 값이 달라 판정이 안 된다. 같은 규모를 **견준 횟수**로 재는 자리는 「최악을 만드는
 * 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { floydWarshall, INF } from "./floydWarshall-guide.ref.ts";

/** 단순 경로를 전부 만들어 최솟값을 고른다. 답의 기준으로만 쓴다. */
function byPaths(n: number, edges: [number, number, number][]): number[][] {
  const w: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (const [u, v, c] of edges) {
    const row = w[u] as number[];
    if (c < (row[v] as number)) row[v] = c;
  }
  const out: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );
  for (let s = 0; s < n; s++) {
    const seen = new Array<boolean>(n).fill(false);
    seen[s] = true;
    const walk = (at: number, cost: number): void => {
      if (cost < ((out[s] as number[])[at] as number)) {
        (out[s] as number[])[at] = cost;
      }
      for (let nx = 0; nx < n; nx++) {
        if (seen[nx]) continue;
        const e = (w[at] as number[])[nx] as number;
        if (e === INF) continue;
        seen[nx] = true;
        walk(nx, cost + e);
        seen[nx] = false;
      }
    };
    walk(s, 0);
  }
  return out;
}

test("정본 — 단일 정점", () => {
  expect(floydWarshall(1, [])).toEqual([[0]]);
});

test("정본 — 대각선은 모두 0", () => {
  const m = floydWarshall(3, [
    [0, 1, 1],
    [1, 2, 1],
  ]);
  expect(m[0]?.[0]).toBe(0);
  expect(m[1]?.[1]).toBe(0);
  expect(m[2]?.[2]).toBe(0);
});

test("정본 — 선형 그래프", () => {
  const edges: [number, number, number][] = [
    [0, 1, 1],
    [1, 2, 1],
    [2, 3, 1],
  ];
  const m = floydWarshall(4, edges);
  expect(m[0]).toEqual([0, 1, 2, 3]);
  expect(m[1]).toEqual([INF, 0, 1, 2]);
  expect(m[2]).toEqual([INF, INF, 0, 1]);
  expect(m[3]).toEqual([INF, INF, INF, 0]);
});

test("정본 — 간접 경로가 직접 간선보다 짧은 경우 (음수 포함)", () => {
  const edges: [number, number, number][] = [
    [0, 1, 4],
    [0, 2, 5],
    [1, 2, -3],
  ];
  expect(floydWarshall(3, edges)[0]?.[2]).toBe(1);
});

test("정본 — 방향성. 역방향 간선은 별도", () => {
  const m = floydWarshall(2, [
    [0, 1, 3],
    [1, 0, 7],
  ]);
  expect(m[0]?.[1]).toBe(3);
  expect(m[1]?.[0]).toBe(7);
});

test("정본 — 간선이 없는 그래프는 대각선만 0 이다", () => {
  expect(floydWarshall(3, [])).toEqual([
    [0, INF, INF],
    [INF, 0, INF],
    [INF, INF, 0],
  ]);
});

test("정본 — 같은 방향 간선이 여럿이면 작은 가중치를 쓴다", () => {
  const m = floydWarshall(2, [
    [0, 1, 10],
    [0, 1, 3],
    [0, 1, 7],
  ]);
  expect(m[0]?.[1]).toBe(3);
});

test("정본 — 도달할 수 없는 쌍은 INF 다", () => {
  const m = floydWarshall(3, [[0, 1, 5]]);
  expect(m[0]?.[2]).toBe(INF);
  expect(m[2]?.[0]).toBe(INF);
});

test("정본 — 가중치 0 을 그대로 더한다", () => {
  const m = floydWarshall(3, [
    [0, 1, 0],
    [1, 2, 0],
  ]);
  expect(m[0]?.[2]).toBe(0);
});

test("정본 — 음수 간선이 있고 음수 사이클이 없는 경우", () => {
  const m = floydWarshall(3, [
    [0, 1, -1],
    [1, 2, -2],
  ]);
  expect(m[0]?.[2]).toBe(-3);
});

test("정본 — 큰 양수 가중치 (10^6)", () => {
  const m = floydWarshall(3, [
    [0, 1, 1_000_000],
    [1, 2, 1_000_000],
  ]);
  expect(m[0]?.[2]).toBe(2_000_000);
});

test("정본 — 정점 둘짜리 완전 그래프", () => {
  expect(
    floydWarshall(2, [
      [0, 1, 5],
      [1, 0, 3],
    ]),
  ).toEqual([
    [0, 5],
    [3, 0],
  ]);
});

test("정본 — 본문 전개가 쓰는 고정 입력", () => {
  const edges: [number, number, number][] = [
    [0, 1, 3],
    [0, 1, 4],
    [1, 2, -2],
    [2, 0, 5],
    [2, 3, 3],
    [3, 1, 1],
    [4, 3, 2],
  ];
  expect(floydWarshall(5, edges)).toEqual([
    [0, 3, 1, 4, INF],
    [3, 0, -2, 1, INF],
    [5, 4, 0, 3, INF],
    [4, 1, -1, 0, INF],
    [6, 3, 1, 2, 0],
  ]);
});

test("정본 — 문제 문서의 예시 그래프", () => {
  const edges: [number, number, number][] = [
    [0, 1, 3],
    [1, 2, 2],
    [0, 2, 10],
    [2, 0, 4],
  ];
  expect(floydWarshall(3, edges)).toEqual([
    [0, 3, 5],
    [6, 0, 2],
    [4, 7, 0],
  ]);
});

test("정본 — 정점 200 짜리 완전 그래프의 모양과 대각선", () => {
  const V = 200;
  const edges: [number, number, number][] = [];
  let seed = 12345;
  const rand = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let u = 0; u < V; u++) {
    for (let v = 0; v < V; v++) {
      if (u !== v) edges.push([u, v, (rand() % 1000) + 1]);
    }
  }
  const m = floydWarshall(V, edges);
  expect(m.length).toBe(V);
  expect(m[0]?.length).toBe(V);
  for (let v = 0; v < V; v++) expect(m[v]?.[v]).toBe(0);
});

test("정본 — 단순 경로를 전부 만든 답과 같다 (정점 1~7 · 간선 목록 40 벌)", () => {
  for (let n = 1; n <= 7; n++) {
    for (let seed = 0; seed < 40; seed++) {
      const edges: [number, number, number][] = [];
      const pot = (v: number): number => (v * 13) % 50;
      for (let i = 0; i < n * 2 + (seed % 5); i++) {
        const t = (i * 7919 + seed * 131) % (n * n);
        const u = Math.floor(t / n);
        const v = t % n;
        if (u === v) continue;
        edges.push([u, v, ((i * 37) % 20) + 1 + pot(u) - pot(v)]);
      }
      expect(floydWarshall(n, edges)).toEqual(byPaths(n, edges));
    }
  }
});
