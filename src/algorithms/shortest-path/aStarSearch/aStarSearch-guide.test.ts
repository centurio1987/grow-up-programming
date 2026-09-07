/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/shortest-path/aStarSearch/aStarSearch.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`aStarSearch-guide.ref.ts`)에
 * 다시 건다. 벽시계를 재는 케이스(`V=10^4` 그래프를 100ms 안에)는 옮기지 않았다 — 실행마다
 * 값이 달라 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { aStarSearch, type Edge } from "./aStarSearch-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;
const zero = (_v: number): number => 0;

const CASES: [
  string,
  number,
  Edge[],
  number,
  number,
  (v: number) => number,
  number,
][] = [
  ["src 와 goal 이 같으면 0", 3, [], 0, 0, zero, 0],
  [
    "선형 그래프, 추정이 전부 0 이면 다익스트라와 같은 답",
    4,
    [
      [0, 1, 1],
      [1, 2, 2],
      [2, 3, 3],
    ],
    0,
    3,
    zero,
    6,
  ],
  [
    "돌아가는 경로가 더 비용이 작다",
    3,
    [
      [0, 1, 1],
      [1, 2, 1],
      [0, 2, 5],
    ],
    0,
    2,
    zero,
    2,
  ],
  [
    "허용 가능한 추정 — 목표에 가까울수록 작다",
    4,
    [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [0, 2, 10],
    ],
    0,
    3,
    (v: number) => Math.max(0, 3 - v),
    3,
  ],
  ["목표로 가는 간선이 없으면 Infinity", 3, [[0, 1, 1]], 0, 2, zero, INF],
  ["간선이 하나도 없고 src 와 goal 이 다르면 Infinity", 2, [], 0, 1, zero, INF],
  [
    "같은 두 정점 사이의 다중 간선 — 가중치가 더 작은 쪽을 고른다",
    2,
    [
      [0, 1, 10],
      [0, 1, 3],
    ],
    0,
    1,
    zero,
    3,
  ],
  [
    "가중치 0 인 간선",
    3,
    [
      [0, 1, 0],
      [1, 2, 0],
    ],
    0,
    2,
    zero,
    0,
  ],
  ["방향 그래프 — 역방향 간선은 쓸 수 없다", 2, [[0, 1, 5]], 1, 0, zero, INF],
  ["정점이 하나이고 src 와 goal 이 그 정점", 1, [], 0, 0, zero, 0],
  [
    "큰 가중치(10^9)도 그대로 더한다",
    3,
    [
      [0, 1, 1_000_000_000],
      [1, 2, 1_000_000_000],
    ],
    0,
    2,
    zero,
    2_000_000_000,
  ],
  [
    "추정이 전부 0 이면 여러 경로 중 최소를 고른다",
    3,
    [
      [0, 1, 4],
      [0, 2, 2],
      [2, 1, 1],
    ],
    0,
    1,
    zero,
    3,
  ],
];

for (const [name, n, edges, src, goal, h, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(aStarSearch(n, edges, src, goal, h)).toBe(want);
  });
}

test("3×3 격자에서 맨해튼 거리 추정 — 답은 추정 없이 푼 것과 같다", () => {
  const at = (r: number, c: number): number => r * 3 + c;
  const edges: Edge[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (r + 1 < 3) {
        edges.push([at(r, c), at(r + 1, c), 1]);
        edges.push([at(r + 1, c), at(r, c), 1]);
      }
      if (c + 1 < 3) {
        edges.push([at(r, c), at(r, c + 1), 1]);
        edges.push([at(r, c + 1), at(r, c), 1]);
      }
    }
  }
  const goal = at(2, 2);
  const man = (v: number): number =>
    Math.abs(2 - Math.floor(v / 3)) + Math.abs(2 - (v % 3));
  expect(aStarSearch(9, edges, 0, goal, man)).toBe(4);
  expect(aStarSearch(9, edges, 0, goal, zero)).toBe(4);
});

test("본문 전개가 쓰는 고정 입력", () => {
  const xy: [number, number][] = [
    [0, 0],
    [2, 1],
    [3, 0],
    [5, 0],
    [4, 1],
    [6, 0],
    [8, 0],
    [0, 5],
  ];
  const man = (v: number): number => {
    const [x, y] = xy[v] as [number, number];
    return Math.abs(8 - x) + Math.abs(0 - y);
  };
  const edges: Edge[] = [
    [0, 1, 3],
    [0, 2, 4],
    [0, 7, 5],
    [1, 4, 2],
    [2, 3, 7],
    [4, 3, 3],
    [3, 5, 2],
    [5, 6, 6],
  ];
  expect(aStarSearch(8, edges, 0, 6, man)).toBe(16);
  expect(aStarSearch(8, edges, 0, 6, zero)).toBe(16);
});

test("추정이 일관되지 않아도 답은 정확하다", () => {
  const xy: [number, number][] = [
    [0, 0],
    [2, 1],
    [3, 0],
    [5, 0],
    [4, 1],
    [6, 0],
    [8, 0],
    [0, 5],
  ];
  const man = (v: number): number => {
    const [x, y] = xy[v] as [number, number];
    return Math.abs(8 - x) + Math.abs(0 - y);
  };
  // 정점 3 에 0, 정점 4 에 실제 값 11 을 준다. 허용 가능하지만 간선 4→3 에서 일관성이 깨진다.
  const broken = (v: number): number => (v === 3 ? 0 : v === 4 ? 11 : man(v));
  const edges: Edge[] = [
    [0, 1, 3],
    [0, 2, 4],
    [0, 7, 5],
    [1, 4, 2],
    [2, 3, 7],
    [4, 3, 3],
    [3, 5, 2],
    [5, 6, 6],
  ];
  expect(aStarSearch(8, edges, 0, 6, broken)).toBe(16);
});

test("최악을 만드는 입력에서도 답은 정확하다", () => {
  // 32×32 격자에서 정점의 30% 에만 정확한 추정을 주고 나머지에 0 을 준다.
  const k = 32;
  const at = (r: number, c: number): number => r * k + c;
  const edges: Edge[] = [];
  for (let r = 0; r < k; r++) {
    for (let c = 0; c < k; c++) {
      if (r + 1 < k) {
        edges.push([at(r, c), at(r + 1, c), 1]);
        edges.push([at(r + 1, c), at(r, c), 1]);
      }
      if (c + 1 < k) {
        edges.push([at(r, c), at(r, c + 1), 1]);
        edges.push([at(r, c + 1), at(r, c), 1]);
      }
    }
  }
  const man = (v: number): number =>
    Math.abs(k - 1 - Math.floor(v / k)) + Math.abs(k - 1 - (v % k));
  const scatter = (v: number): number => {
    let x = (v * 2654435761) >>> 0;
    x ^= x >>> 15;
    x = (x * 2246822519) >>> 0;
    x ^= x >>> 13;
    return x >>> 0;
  };
  const patchy = (v: number): number => (scatter(v) % 100 < 30 ? man(v) : 0);
  expect(aStarSearch(k * k, edges, 0, at(k - 1, k - 1), patchy)).toBe(62);
  expect(aStarSearch(k * k, edges, 0, at(k - 1, k - 1), man)).toBe(62);
});
