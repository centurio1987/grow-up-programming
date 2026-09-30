/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/shortest-path/bellmanFord/bellmanFord.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`bellmanFord-guide.ref.ts`)에
 * 다시 건다. 벽시계를 재는 케이스(`V=200` 그래프를 100ms 안에)는 옮기지 않았다 — 실행마다
 * 값이 달라 판정이 안 된다. 같은 규모를 **간선을 읽은 횟수**로 재는 자리는 「최악을 만드는
 * 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { bellmanFord, type Edge } from "./bellmanFord-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

const CASES: [string, number, Edge[], number, number[], boolean][] = [
  ["단일 정점, 자기 자신까지의 거리는 0", 1, [], 0, [0], false],
  [
    "양수 가중치만 — 간선 하나를 더 지나는 쪽이 더 작다",
    3,
    [
      [0, 1, 1],
      [1, 2, 2],
      [0, 2, 10],
    ],
    0,
    [0, 1, 3],
    false,
  ],
  [
    "음수 간선이 있고 음수 사이클은 없다",
    3,
    [
      [0, 1, 4],
      [0, 2, 5],
      [1, 2, -3],
    ],
    0,
    [0, 4, 1],
    false,
  ],
  ["도달할 수 없는 정점은 Infinity", 3, [[0, 1, 5]], 0, [0, 5, INF], false],
  ["간선이 하나도 없으면 시작점만 0", 3, [], 1, [INF, 0, INF], false],
  [
    "가중치 0 인 간선",
    3,
    [
      [0, 1, 0],
      [1, 2, 0],
    ],
    0,
    [0, 0, 0],
    false,
  ],
  [
    "큰 가중치(10^9)도 그대로 더한다",
    3,
    [
      [0, 1, 1_000_000_000],
      [1, 2, 1_000_000_000],
    ],
    0,
    [0, 1_000_000_000, 2_000_000_000],
    false,
  ],
  [
    "가장 작은 가중치(−10^9)도 그대로 더한다",
    3,
    [
      [0, 1, 1_000_000_000],
      [0, 2, 1_000_000_000],
      [1, 2, -1_000_000_000],
    ],
    0,
    [0, 1_000_000_000, 0],
    false,
  ],
  [
    "본문 전개가 쓰는 고정 입력",
    7,
    [
      [4, 5, 1],
      [3, 4, 2],
      [2, 3, -3],
      [1, 2, 3],
      [0, 1, 4],
      [0, 2, 9],
      [6, 5, 2],
      [5, 1, 7],
    ],
    0,
    [0, 4, 7, 4, 6, 7, INF],
    false,
  ],
];

for (const [name, n, edges, src, wantDist, wantNeg] of CASES) {
  test(`정본 — ${name}`, () => {
    const got = bellmanFord(n, edges, src);
    expect(got.dist).toEqual(wantDist);
    expect(got.hasNegativeCycle).toBe(wantNeg);
  });
}

const CYCLE_CASES: [string, number, Edge[], number, boolean][] = [
  [
    "두 정점 음수 사이클 0→1→0",
    2,
    [
      [0, 1, 1],
      [1, 0, -3],
    ],
    0,
    true,
  ],
  [
    "세 정점 음수 사이클 0→1→2→0",
    3,
    [
      [0, 1, 1],
      [1, 2, 1],
      [2, 0, -5],
    ],
    0,
    true,
  ],
  [
    "시작점에서 도달할 수 없는 음수 사이클은 false",
    3,
    [
      [1, 2, 1],
      [2, 1, -5],
    ],
    0,
    false,
  ],
  [
    "시작점 자신의 음수 셀프 루프",
    2,
    [
      [0, 0, -1],
      [0, 1, 1],
    ],
    0,
    true,
  ],
  [
    "가중치 합이 0 인 사이클은 음수 사이클이 아니다",
    3,
    [
      [0, 1, 2],
      [1, 2, -1],
      [2, 1, 1],
    ],
    0,
    false,
  ],
];

for (const [name, n, edges, src, want] of CYCLE_CASES) {
  test(`음수 사이클 — ${name}`, () => {
    expect(bellmanFord(n, edges, src).hasNegativeCycle).toBe(want);
  });
}

test("자기 자신을 가리키는 양수 간선은 거리에 영향이 없다", () => {
  const got = bellmanFord(
    2,
    [
      [0, 0, 5],
      [0, 1, 2],
    ],
    0,
  );
  expect(got.dist).toEqual([0, 2]);
  expect(got.hasNegativeCycle).toBe(false);
});

test("같은 두 정점 사이의 다중 간선 — 가중치가 더 작은 쪽이 남는다", () => {
  expect(
    bellmanFord(
      2,
      [
        [0, 1, 10],
        [0, 1, 3],
        [0, 1, 7],
      ],
      0,
    ).dist,
  ).toEqual([0, 3]);
});

test("라운드 수를 최대로 만드는 입력에서도 거리는 정확하다", () => {
  // 사슬을 내림차순으로 적으면 라운드 하나가 정점 하나씩만 값을 정한다 — 라운드 수가 V 에 이른다.
  const V = 200;
  const descending: Edge[] = [];
  for (let i = V - 2; i >= 0; i--) descending.push([i, i + 1, 1]);
  const got = bellmanFord(V, descending, 0);
  expect(got.hasNegativeCycle).toBe(false);
  expect(got.dist[V - 1]).toBe(V - 1);

  // 같은 사슬을 오름차순으로 적으면 답이 같고 라운드만 준다.
  const ascending: Edge[] = [...descending].reverse();
  expect(bellmanFord(V, ascending, 0).dist).toEqual(got.dist);
});

test("정점 200 개 · 간선 600 개 그래프에서 음수 사이클이 없다", () => {
  const V = 200;
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) edges.push([i, i + 1, 1]);
  let seed = 42;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let i = 0; i < V * 2; i++) {
    edges.push([next() % V, next() % V, (next() % 100) + 1]);
  }
  const got = bellmanFord(V, edges, 0);
  expect(got.hasNegativeCycle).toBe(false);
  expect(got.dist[0]).toBe(0);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가. `.sim.ts` 의 `steps` 는 P3 이 정적으로 세도록
 * 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `stageStepsFromRef()` — 정본과 같은 절차에 기록만
 * 덧붙인 사본의 기록에서 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./bellmanFord-guide.sim.ts");
  const fig = await import("./bellmanFord-guide.fig.tsx");
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.bellmanFordWalk.steps)).toEqual(
    plain(fig.stageStepsFromRef()),
  );
  expect(plain(sim.bellmanFordWalk.layout)).toEqual(plain(fig.LAYOUT));

  // 사이드카가 정본을 제대로 불렀는지 — 마지막 걸음의 정점 값을 정본의 답에 직접 다시 묻는다.
  const answer = bellmanFord(
    7,
    [
      [4, 5, 1],
      [3, 4, 2],
      [2, 3, -3],
      [1, 2, 3],
      [0, 1, 4],
      [0, 2, 9],
      [6, 5, 2],
      [5, 1, 7],
    ],
    0,
  );
  const last = sim.bellmanFordWalk.steps.at(-1);
  expect(last?.nodes.map((n) => n.value)).toEqual(
    answer.dist.map((d) => (d === INF ? "Infinity" : `dist ${d}`)),
  );
  expect(sim.bellmanFordWalk.result).toBe(
    `{ dist: [${answer.dist.join(", ")}], hasNegativeCycle: ${answer.hasNegativeCycle} }`,
  );
});
