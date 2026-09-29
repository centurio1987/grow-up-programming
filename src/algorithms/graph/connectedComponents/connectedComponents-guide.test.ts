/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/connectedComponents/connectedComponents.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 케이스(`V=10^5` 체인을 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { connectedComponents } from "./connectedComponents-guide.ref.ts";

const CASES: [string, number, [number, number][], number[][]][] = [
  [
    "단순 분리된 두 성분",
    5,
    [
      [0, 1],
      [1, 2],
      [3, 4],
    ],
    [
      [0, 1, 2],
      [3, 4],
    ],
  ],
  [
    "하나의 연결된 성분 — 사이클 0-1-2-3-0",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    [[0, 1, 2, 3]],
  ],
  [
    "세 개의 성분 — 각각 정렬된 결과",
    6,
    [
      [0, 4],
      [1, 3],
      [3, 5],
    ],
    [[0, 4], [1, 3, 5], [2]],
  ],
  ["간선이 없는 경우 — 각 정점이 독립 성분", 4, [], [[0], [1], [2], [3]]],
  ["자기 루프만 존재", 3, [[1, 1]], [[0], [1], [2]]],
  [
    "중복 간선 — 결과에 영향 없음",
    3,
    [
      [0, 1],
      [0, 1],
      [1, 0],
    ],
    [[0, 1], [2]],
  ],
  ["최소 입력 V=1", 1, [], [[0]]],
  ["V=2, 간선 1개", 2, [[0, 1]], [[0, 1]]],
  ["V=2, 간선 없음", 2, [], [[0], [1]]],
];

for (const [name, n, edges, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(connectedComponents(n, edges)).toEqual(want);
  });
}

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    connectedComponents(6, [
      [0, 4],
      [4, 2],
      [2, 0],
      [1, 3],
    ]),
  ).toEqual([[0, 2, 4], [1, 3], [5]]);
});

test("V=10^5 체인은 성분 하나이고 정점이 전부 오름차순으로 담긴다", () => {
  const V = 100_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

  const got = connectedComponents(V, edges);
  expect(got.length).toBe(1);
  expect((got[0] as number[]).length).toBe(V);
  expect((got[0] as number[])[V - 1]).toBe(V - 1);
});

test("최악을 만드는 입력 — 성분 수가 V 인 그래프", () => {
  const V = 100_000;
  const got = connectedComponents(V, []);
  expect(got.length).toBe(V);
  expect(got.every((c) => c.length === 1)).toBe(true);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가. `.sim.ts` 의 `steps` 는 P3 이 정적으로 세도록
 * 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `stageStepsFromRef()` — 정본과 같은 절차에 기록만
 * 덧붙인 사본의 기록에서 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./connectedComponents-guide.sim.ts");
  const fig = await import("./connectedComponents-guide.fig.tsx");
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.ccWalk.steps)).toEqual(plain(fig.stageStepsFromRef()));
  expect(plain(sim.ccWalk.layout)).toEqual(plain(fig.LAYOUT));

  // 사이드카가 정본을 제대로 불렀는지 — 마지막 걸음의 묶음을 정본의 답에 직접 다시 묻는다.
  const answer = connectedComponents(6, [
    [0, 4],
    [4, 2],
    [2, 0],
    [1, 3],
  ]);
  const last = sim.ccWalk.steps.at(-1);
  expect(last?.groups?.map((g) => g.members)).toEqual(answer);
  expect(sim.ccWalk.result).toBe(JSON.stringify(answer));
});
