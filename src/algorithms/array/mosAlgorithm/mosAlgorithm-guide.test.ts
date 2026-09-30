/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 테스트는 학습자 스텁을 가져오므로 재사용할 수 없다. **케이스만** 옮겼다.
 * 벽시계를 재는 성능 케이스는 안 옮겼다 — 실행마다 값이 달라 판정이 안 된다.
 * 대신 그 케이스의 **입력 규모와 결과 길이**만 확인한다.
 */
import { expect, test } from "bun:test";
import { mosAlgorithm } from "./mosAlgorithm-guide.ref.ts";

const CASES: [number[], [number, number][], number[]][] = [
  [
    [1, 1, 2, 1, 3],
    // 가이드 「수행으로 알아보는 알고리즘」과 같은 입력이다. 다섯째 질의 [2,3] 은
    // 창 옮기기의 네 갈래 중 R−(오른쪽 좁힘)를 실행하게 하려고 둔 것이다.
    [
      [0, 4],
      [0, 2],
      [2, 4],
      [1, 3],
      [2, 3],
    ],
    [3, 2, 3, 2, 2],
  ],
  [
    [1, 2, 3, 4, 5],
    [
      [0, 4],
      [1, 3],
      [2, 2],
    ],
    [5, 3, 1],
  ],
  [
    [1, 2, 1, 2, 1],
    [
      [4, 4],
      [0, 4],
      [0, 1],
    ],
    [1, 2, 2],
  ],
  [
    [7, 7, 7, 7],
    [
      [0, 3],
      [1, 2],
      [0, 0],
    ],
    [1, 1, 1],
  ],
  [[1, 2, 3], [], []],
  [
    [9, 8, 7],
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    [1, 1, 1],
  ],
  [
    [-1, 0, -1, 2, 0],
    [
      [0, 4],
      [0, 2],
    ],
    [3, 2],
  ],
  [[42], [[0, 0]], [1]],
];

for (const [arr, queries, want] of CASES) {
  test(`정본 — ${JSON.stringify(arr)} × ${queries.length}질의`, () => {
    expect(mosAlgorithm(arr, queries)).toEqual(want);
  });
}

test("n=10^4, 같은 값이면 모두 1", () => {
  const n = 10_000;
  expect(
    mosAlgorithm(new Array(n).fill(5), [
      [0, n - 1],
      [100, 200],
    ]),
  ).toEqual([1, 1]);
});

test("n=q=10^4 규모에서 결과 길이가 질의 수와 같다", () => {
  const n = 10_000;
  const q = 10_000;
  const arr = Array.from({ length: n }, (_, i) => i % 100);
  const queries: [number, number][] = Array.from({ length: q }, (_, i) => {
    const a = i % n;
    const b = (i * 13 + 7) % n;
    return [Math.min(a, b), Math.max(a, b)];
  });
  expect(mosAlgorithm(arr, queries).length).toBe(q);
});

test("무작위 교차검증 — 순진한 방법과 답이 같다", () => {
  // 결정론적 의사난수. 시드를 고정해 실행마다 같은 입력을 만든다.
  let seed = 12345;
  const next = (): number => (seed = (seed * 1103515245 + 12345) % 2147483648);
  const arr = Array.from({ length: 60 }, () => next() % 12);
  const queries: [number, number][] = Array.from({ length: 40 }, () => {
    const a = next() % 60;
    const b = next() % 60;
    return [Math.min(a, b), Math.max(a, b)];
  });
  const naive = queries.map(([l, r]) => new Set(arr.slice(l, r + 1)).size);
  expect(mosAlgorithm(arr, queries)).toEqual(naive);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본을 실행해
 * 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./mosAlgorithm-guide.sim.ts");
  const { simStepsFromRef } = await import("./mosAlgorithm-guide.fig.tsx");
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.window.steps)).toEqual(plain(simStepsFromRef().window));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.window.result).toBe(
    JSON.stringify(
      mosAlgorithm(
        [1, 1, 2, 1, 3],
        [
          [0, 4],
          [0, 2],
          [2, 4],
          [1, 3],
          [2, 3],
        ],
      ),
    ),
  );
});

test("최악을 만드는 입력에서도 답은 새로 센 값과 같다", async () => {
  // perf.worst 가 드는 입력의 모양을 작은 규모로 줄여 답을 대조한다. 옮긴 칸이 많은 것과 틀린 것은 다른 문제다.
  const { worstInput } = await import("./mosAlgorithm-guide.fig.tsx");
  const n = 400;
  const arr = Array.from({ length: n }, (_, i) => (i * 7) % 13);
  const queries = worstInput(n, n, Math.floor(Math.sqrt(n)));
  const naive = queries.map(([l, r]) => new Set(arr.slice(l, r + 1)).size);
  expect(mosAlgorithm(arr, queries)).toEqual(naive);
});
