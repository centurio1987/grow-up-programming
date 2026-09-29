/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/countIslands/countIslands.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(1000×1000 을 200ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **칸 10^6 짜리 격자에서 호출 한도에
 * 걸리지 않고 답이 나온다**는 것이라, 아래에서 전부 땅인 격자와 한 줄로 이어진 섬으로 다시
 * 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 스택 최대 크기로 진다.
 */
import { expect, test } from "bun:test";
import { countIslands } from "./countIslands-guide.ref.ts";

const CASES: [string, number[][], number][] = [
  [
    "L자 덩어리 + 고립된 낱개 = 2섬",
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    2,
  ],
  [
    "체커보드 — 대각선만 닿아 전부 분리 = 5섬",
    [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ],
    5,
  ],
  [
    "전부 이어진 땅 = 1섬",
    [
      [1, 1],
      [1, 1],
    ],
    1,
  ],
  ["한 행에서 물로 갈라짐 = 2섬", [[1, 0, 1, 1]], 2],
  [
    "대각선만 닿음 = 2섬",
    [
      [1, 0],
      [0, 1],
    ],
    2,
  ],
  ["N행 1열 — 세로로 물에 갈라짐 = 2섬", [[1], [1], [0], [1]], 2],
  [
    "전부 물 = 0섬",
    [
      [0, 0],
      [0, 0],
    ],
    0,
  ],
  ["단일 칸 — 땅", [[1]], 1],
  ["단일 칸 — 물", [[0]], 0],
  ["빈 격자 = 0섬", [], 0],
  ["빈 행(열 없음) = 0섬", [[]], 0],
  [
    "본문 전개가 쓰는 3×4 격자 = 3섬",
    [
      [1, 1, 0, 1],
      [1, 0, 0, 1],
      [0, 0, 1, 0],
    ],
    3,
  ],
];

for (const [name, grid, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(countIslands(grid)).toBe(want);
  });
}

test("입력 grid 를 변형하지 않는다", () => {
  const grid = [
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const snapshot = JSON.stringify(grid);
  countIslands(grid);
  expect(JSON.stringify(grid)).toBe(snapshot);
});

test("1000×1000 전부 땅(10^6 칸)을 1섬으로 센다", () => {
  const N = 1000;
  const grid: number[][] = Array.from({ length: N }, () =>
    new Array<number>(N).fill(1),
  );
  expect(countIslands(grid)).toBe(1);
});

test("한 줄로 이어진 섬 10^6 칸에서도 호출 한도에 걸리지 않는다", () => {
  // 재귀로 적으면 깊이가 이 섬의 칸 수까지 자라는 모양이다.
  const N = 1000;
  const grid: number[][] = Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) =>
      r % 2 === 0 || c === (r % 4 === 1 ? N - 1 : 0) ? 1 : 0,
    ),
  );
  expect(countIslands(grid)).toBe(1);
});

test("체커보드 1000×1000 은 섬이 500,000 개다", () => {
  const N = 1000;
  const grid: number[][] = Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) => ((r + c) % 2 === 0 ? 1 : 0)),
  );
  expect(countIslands(grid)).toBe((N * N) / 2);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가. `.sim.ts` 의 `steps` 는 P3 이 정적으로 세도록
 * 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `stageStepsFromRef()` — 정본과 같은 절차에 기록만
 * 덧붙인 사본의 기록에서 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./countIslands-guide.sim.ts");
  const fig = await import("./countIslands-guide.fig.tsx");
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.islandScan.steps)).toEqual(plain(fig.stageStepsFromRef()));
  expect(plain(sim.islandScan.layout)).toEqual(plain(fig.LAYOUT));

  // 사이드카가 정본을 제대로 불렀는지 — 마지막 걸음의 섬 번호 최댓값을 정본의 답에 직접 다시 묻는다.
  const grid = [
    [1, 1, 0, 1],
    [1, 0, 0, 1],
    [0, 0, 1, 0],
  ];
  const answer = countIslands(grid);
  const last = sim.islandScan.steps.at(-1);
  const islands = (last?.nodes ?? []).flatMap((n) =>
    n.value.startsWith("섬 ") ? [Number(n.value.slice(2))] : [],
  );
  expect(Math.max(...islands)).toBe(answer);
  expect(sim.islandScan.result).toBe(String(answer));
});
