/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph-flow/minCut/minCut.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 케이스(격자 네트워크를
 * 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 같은 입력을 **연산 수**로
 * 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { minCut } from "./minCut-guide.ref.ts";

type Edge = [number, number, number];

const CASES: [string, number, Edge[], number, number, number][] = [
  [
    "CLRS Fig. 26.1 예시",
    6,
    [
      [0, 1, 16],
      [0, 2, 13],
      [1, 3, 12],
      [2, 1, 4],
      [2, 4, 14],
      [3, 2, 9],
      [3, 5, 20],
      [4, 3, 7],
      [4, 5, 4],
    ],
    0,
    5,
    23,
  ],
  [
    "직렬 그래프 — 병목 간선이 최소 컷",
    3,
    [
      [0, 1, 10],
      [1, 2, 5],
    ],
    0,
    2,
    5,
  ],
  [
    "병렬 두 경로 — 컷은 두 경로 용량 합",
    4,
    [
      [0, 1, 3],
      [1, 3, 3],
      [0, 2, 4],
      [2, 3, 4],
    ],
    0,
    3,
    7,
  ],
  [
    "역방향 간선을 쓸 수 있어야 하는 그래프",
    4,
    [
      [0, 1, 3],
      [0, 2, 3],
      [1, 2, 2],
      [1, 3, 3],
      [2, 3, 3],
    ],
    0,
    3,
    6,
  ],
  ["소스에서 싱크로 가는 경로가 없다", 3, [[0, 1, 10]], 0, 2, 0],
  ["간선 없음", 2, [], 0, 1, 0],
  ["소스와 싱크가 직접 이어져 있다", 2, [[0, 1, 100]], 0, 1, 100],
  ["용량 0 인 간선뿐", 2, [[0, 1, 0]], 0, 1, 0],
  [
    "평행 간선은 용량이 더해진 것처럼 동작한다",
    2,
    [
      [0, 1, 5],
      [0, 1, 7],
    ],
    0,
    1,
    12,
  ],
  [
    "병목이 싱크 바로 앞에 있다",
    4,
    [
      [0, 1, 100],
      [1, 2, 100],
      [2, 3, 1],
    ],
    0,
    3,
    1,
  ],
  ["V=2 최소 케이스", 2, [[0, 1, 1]], 0, 1, 1],
  [
    "용량 상한 10^6",
    3,
    [
      [0, 1, 1_000_000],
      [1, 2, 1_000_000],
    ],
    0,
    2,
    1_000_000,
  ],
  [
    "자기 자신을 가리키는 간선은 컷에 안 든다",
    2,
    [
      [0, 0, 100],
      [0, 1, 5],
    ],
    0,
    1,
    5,
  ],
];

for (const [name, n, edges, source, sink, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(minCut(n, edges, source, sink)).toEqual({ cut: want });
  });
}

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    minCut(
      7,
      [
        [0, 1, 5],
        [1, 2, 3],
        [2, 5, 3],
        [0, 3, 4],
        [3, 2, 5],
        [1, 4, 6],
        [4, 5, 4],
        [5, 6, 12],
        [5, 3, 2],
      ],
      0,
      6,
    ),
  ).toEqual({ cut: 7 });
});

test("문제 지문의 예시", () => {
  expect(
    minCut(
      4,
      [
        [0, 1, 3],
        [0, 2, 2],
        [1, 2, 1],
        [1, 3, 2],
        [2, 3, 3],
      ],
      0,
      3,
    ),
  ).toEqual({ cut: 5 });
});

test("격자 네트워크 — 제약 규모에서도 답이 정확하다", () => {
  const W = 20;
  const H = 10;
  const at = (r: number, c: number): number => r * W + c + 2;
  const V = H * W + 2;
  const edges: Edge[] = [];
  for (let r = 0; r < H; r++) {
    edges.push([0, at(r, 0), 100]);
    edges.push([at(r, W - 1), 1, 100]);
  }
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W - 1; c++) edges.push([at(r, c), at(r, c + 1), 10]);
  }
  for (let r = 0; r < H - 1; r++) {
    for (let c = 0; c < W; c++) {
      edges.push([at(r, c), at(r + 1, c), 5]);
      edges.push([at(r + 1, c), at(r, c), 5]);
    }
  }
  expect(minCut(V, edges, 0, 1)).toEqual({ cut: 100 });
});

test("최악을 만드는 계단 입력도 컷이 정확하다", () => {
  // 소스에서 싱크로 가는 경로의 길이가 1, 2, …, m 으로 서로 다르다.
  const m = 200;
  const edges: Edge[] = [
    [0, m, 1],
    [0, 1, m],
  ];
  for (let i = 1; i <= m - 2; i++) edges.push([i, i + 1, m]);
  for (let i = 1; i <= m - 1; i++) edges.push([i, m, 1]);
  expect(minCut(m + 1, edges, 0, m)).toEqual({ cut: m });
});

test("컷 용량은 최대 유량과 같다 — 분할을 전수로 나열해 확인한다", () => {
  const cases: [number, Edge[], number, number][] = [
    [
      7,
      [
        [0, 1, 5],
        [1, 2, 3],
        [2, 5, 3],
        [0, 3, 4],
        [3, 2, 5],
        [1, 4, 6],
        [4, 5, 4],
        [5, 6, 12],
        [5, 3, 2],
      ],
      0,
      6,
    ],
    [
      4,
      [
        [0, 1, 1],
        [0, 2, 1],
        [1, 2, 1],
        [1, 3, 1],
        [2, 3, 1],
      ],
      0,
      3,
    ],
    [
      4,
      [
        [0, 1, 100],
        [1, 2, 100],
        [2, 3, 1],
      ],
      0,
      3,
    ],
  ];
  for (const [n, edges, source, sink] of cases) {
    const free: number[] = [];
    for (let v = 0; v < n; v++) if (v !== source && v !== sink) free.push(v);
    let best = Number.POSITIVE_INFINITY;
    for (let mask = 0; mask < 2 ** free.length; mask++) {
      const inS: boolean[] = Array.from({ length: n }, () => false);
      inS[source] = true;
      for (const [k, v] of free.entries()) {
        if (((mask >> k) & 1) === 1) inS[v] = true;
      }
      let value = 0;
      for (const [u, v, c] of edges) {
        if (inS[u] === true && inS[v] === false) value += c;
      }
      best = Math.min(best, value);
    }
    expect(minCut(n, edges, source, sink)).toEqual({ cut: best });
  }
});
