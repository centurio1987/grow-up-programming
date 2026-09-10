/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/prefixSumRangeQuery/prefixSumRangeQuery.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(N=100,000 · Q=100,000 에서 답의 개수와 값)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { prefixSumRangeQuery } from "./prefixSumRangeQuery-guide.ref.ts";

const CASES: [number[], [number, number][], number[]][] = [
  // 기본
  [
    [1, 2, 3, 4, 5],
    [
      [0, 4],
      [1, 3],
      [2, 2],
    ],
    [15, 9, 3],
  ],
  [[7], [[0, 0]], [7]],
  // 엣지
  [[-1, -2, -3], [[0, 2]], [-6]],
  [[0, 0, 0, 0], [[1, 3]], [0]],
  [[1, 2, 3], [], []],
  [
    [1, 2, 3],
    [
      [0, 2],
      [0, 2],
      [0, 2],
    ],
    [6, 6, 6],
  ],
  // 바운더리
  [[10, 20, 30], [[0, 0]], [10]],
  [[10, 20, 30], [[2, 2]], [30]],
  [[10, 20, 30], [[0, 2]], [60]],
  // 문제 문서의 예시
  [
    [-1, 2, -3, 4],
    [
      [0, 3],
      [1, 2],
    ],
    [2, -1],
  ],
];

for (const [A, queries, want] of CASES) {
  test(`정본 — ${JSON.stringify(A)} · 질의 ${queries.length} 개`, () => {
    expect(
      prefixSumRangeQuery(
        [...A],
        queries.map((q) => [...q] as [number, number]),
      ),
    ).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(
    prefixSumRangeQuery(
      [3, 1, 4, 1, 5, 9],
      [
        [1, 3],
        [0, 5],
        [4, 4],
        [0, 2],
        [2, 5],
      ],
    ),
  ).toEqual([6, 23, 5, 8, 19]);
});

test("N=100,000 · Q=100,000 에서 답의 개수와 값", () => {
  const N = 100_000;
  const Q = 100_000;
  const A = new Array<number>(N).fill(1);
  const queries: Array<[number, number]> = Array.from({ length: Q }, (_, i) => [
    0,
    i % N,
  ]);
  const result = prefixSumRangeQuery(A, queries);
  expect(result.length).toBe(Q);
  // 원소가 전부 1 이므로 [0, r] 의 합은 r + 1 이다.
  expect(result[0]).toBe(1);
  expect(result[Q - 1]).toBe(Q);
});

test("음수와 0 이 섞여도 뺄셈이 부호를 그대로 가져온다", () => {
  expect(
    prefixSumRangeQuery(
      [-5, 0, 5, 0, -5],
      [
        [0, 4],
        [1, 3],
        [2, 2],
      ],
    ),
  ).toEqual([-5, 5, 5]);
});
