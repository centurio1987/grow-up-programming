/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph-flow/isBipartite/isBipartite.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스 하나(`V=10^5`·`E=2·10^5` 를 100ms 안에)는 그대로 옮기지 않았다 —
 * 실행마다 값이 달라 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **정점 100,000 이 한
 * 줄로 이어져도 결과가 나온다**(호출 깊이로 실패하지 않는다)는 것이라, 아래에서 반환값으로
 * 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 배열 칸 접근 수로 진다.
 */
import { expect, test } from "bun:test";
import { isBipartite } from "./isBipartite-guide.ref.ts";

type Edge = [number, number];

const BIPARTITE: [string, number, Edge[]][] = [
  [
    "짝수 길이 사이클 (길이 4)",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  ],
  [
    "완전 이분 그래프 (왼쪽 둘 · 오른쪽 셋)",
    5,
    [
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 2],
      [1, 3],
      [1, 4],
    ],
  ],
  [
    "나무",
    6,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
    ],
  ],
  ["정점 하나 · 간선 없음", 1, []],
  ["간선이 없는 열 정점", 10, []],
  [
    "나뉜 덩어리가 모두 이분",
    6,
    [
      [0, 1],
      [2, 3],
      [4, 5],
    ],
  ],
  [
    "같은 쌍을 두 번 이은 간선은 판정을 바꾸지 않는다",
    3,
    [
      [0, 1],
      [0, 1],
      [1, 2],
    ],
  ],
  ["정점 둘 · 간선 하나", 2, [[0, 1]]],
];

for (const [name, n, edges] of BIPARTITE) {
  test(`정본 — ${name} → true`, () => {
    expect(isBipartite(n, edges)).toBe(true);
  });
}

const NOT_BIPARTITE: [string, number, Edge[]][] = [
  [
    "홀수 길이 사이클 (삼각형)",
    3,
    [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  ],
  [
    "홀수 길이 사이클 (길이 5)",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  ],
  [
    "덩어리 둘 중 하나만 홀수 사이클",
    7,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 4],
    ],
  ],
  ["자기 자신을 잇는 간선", 1, [[0, 0]]],
];

for (const [name, n, edges] of NOT_BIPARTITE) {
  test(`정본 — ${name} → false`, () => {
    expect(isBipartite(n, edges)).toBe(false);
  });
}

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    isBipartite(7, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 4],
    ]),
  ).toBe(false);
});

test("간선을 어느 끝부터 적어도 답이 같다", () => {
  // 무향이므로 [1,0] 과 [0,1] 은 같은 간선이다. 한쪽 목록에만 넣으면 여기서 갈린다.
  expect(
    isBipartite(3, [
      [1, 0],
      [2, 1],
    ]),
  ).toBe(true);
  expect(
    isBipartite(3, [
      [1, 0],
      [2, 1],
      [0, 2],
    ]),
  ).toBe(false);
});

test("입력 edges 배열을 변형하지 않는다", () => {
  const edges: Edge[] = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  const snapshot = JSON.stringify(edges);
  isBipartite(3, edges);
  expect(JSON.stringify(edges)).toBe(snapshot);
});

test("정점 100,000 이 한 줄로 이어져도 결과가 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 호출 깊이가 아니라 배열 길이로 깊이를 잡는다.
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  expect(isBipartite(V, edges)).toBe(true);
});

test("정점 100,000 에 간선 200,000 개를 얹어도 결과가 나온다", () => {
  // 번호 차가 홀수인 짝만 이으므로 얼마를 더해도 이분 그래프다 — 제약 상한을 둘 다 채운다.
  const V = 100_000;
  const edges: Edge[] = [];
  for (let d = 1; d < V && edges.length < 200_000; d += 2) {
    for (let i = 0; i + d < V && edges.length < 200_000; i++)
      edges.push([i, i + d]);
  }
  expect(edges.length).toBe(200_000);
  expect(isBipartite(V, edges)).toBe(true);
});

test("정점 100,000 짜리 한 줄의 양 끝을 이으면 길이가 홀수라 이분이 아니다", () => {
  // 정점이 100,000 개면 고리의 길이가 100,000 이라 짝수다. 하나를 빼서 홀수 고리로 만든다.
  const V = 99_999;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  edges.push([V - 1, 0]);
  expect(isBipartite(V, edges)).toBe(false);
});

test("정점 100,000 짜리 별 모양은 이분이다", () => {
  // 목록 하나가 99,999 칸이라 한 정점의 이웃 목록이 가장 길어지는 입력이다.
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 1; i < V; i++) edges.push([0, i]);
  expect(isBipartite(V, edges)).toBe(true);
});
