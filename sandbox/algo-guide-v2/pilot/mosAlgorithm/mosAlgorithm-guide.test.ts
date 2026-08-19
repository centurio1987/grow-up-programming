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
    // 가이드 「한 입력으로 끝까지 굴려 보기」와 같은 입력이다. 다섯째 질의 [2,3] 은
    // 창 옮기기의 네 갈래 중 R−(오른쪽 좁힘)를 밟게 하려고 둔 것이다.
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
