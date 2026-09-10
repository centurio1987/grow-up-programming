/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(N=100,000 · Q=100,000 에서 답의 개수와 값)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { sparseTableRangeMin } from "./sparseTableRangeMin-guide.ref.ts";

const CASES: [number[], [number, number][], number[]][] = [
  // 기본
  [
    [3, 1, 4, 1, 5, 9, 2, 6],
    [
      [0, 3],
      [2, 5],
      [4, 7],
    ],
    [1, 1, 2],
  ],
  [
    [1, 2, 3, 4, 5],
    [
      [0, 4],
      [3, 4],
    ],
    [1, 4],
  ],
  // 엣지
  [[-3, -1, -5, 2], [[0, 3]], [-5]],
  [[5, 5, 5, 5], [[1, 2]], [5]],
  [[1, 2, 3], [], []],
  [[3, 1, 4], [[1, 1]], [1]],
  // 바운더리
  [[42], [[0, 0]], [42]],
  [[5, 3, 7, 1, 9], [[0, 4]], [1]],
  [
    [3, 1, 4, 1, 5],
    [
      [0, 2],
      [1, 3],
    ],
    [1, 1],
  ],
  // 문제 문서의 예시
  [
    [3, 1, 4, 1, 5, 9, 2, 6],
    [
      [0, 7],
      [0, 2],
      [2, 2],
      [4, 7],
      [4, 5],
    ],
    [1, 1, 4, 2, 5],
  ],
  [
    [7, -3, 2, -1],
    [
      [0, 3],
      [1, 1],
      [2, 3],
    ],
    [-3, -3, -1],
  ],
];

for (const [A, queries, want] of CASES) {
  test(`정본 — ${JSON.stringify(A)} · 질의 ${queries.length} 개`, () => {
    expect(
      sparseTableRangeMin(
        [...A],
        queries.map((q) => [...q] as [number, number]),
      ),
    ).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts`·`.proof.ts` 가 모두 이 입력을 쓴다.
  expect(
    sparseTableRangeMin(
      [5, 2, 7, 4, 6, 3],
      [
        [0, 4],
        [1, 2],
        [3, 3],
        [0, 5],
        [2, 5],
      ],
    ),
  ).toEqual([2, 2, 4, 2, 3]);
});

test("N=100,000 · Q=100,000 에서 답의 개수와 값", () => {
  const N = 100_000;
  const Q = 100_000;
  const A = Array.from({ length: N }, (_, i) => (i * 31) % 997);
  const queries: Array<[number, number]> = Array.from({ length: Q }, (_, i) => [
    i % N,
    Math.min(N - 1, (i % N) + 100),
  ]);
  const result = sparseTableRangeMin(A, queries);
  expect(result.length).toBe(Q);
  // 정의를 직접 계산한 값과 앞뒤 몇 자리를 대조한다.
  const direct = ([l, r]: [number, number]): number => {
    let best = A[l] as number;
    for (let i = l + 1; i <= r; i++) best = Math.min(best, A[i] as number);
    return best;
  };
  for (const i of [0, 1, 12_345, N - 101, N - 1]) {
    expect(result[i]).toBe(direct(queries[i] as [number, number]));
  }
});

test("구간의 칸 수가 2 의 거듭제곱일 때와 아닐 때가 같은 식으로 나온다", () => {
  const A = [9, 4, 8, 1, 7, 3, 6, 2];
  const queries: Array<[number, number]> = [];
  for (let l = 0; l < A.length; l++) {
    for (let r = l; r < A.length; r++) queries.push([l, r]);
  }
  const got = sparseTableRangeMin([...A], queries);
  const want = queries.map(([l, r]) => Math.min(...A.slice(l, r + 1)));
  expect(got).toEqual(want);
});

test("값이 전부 같아도, 음수만 있어도 정의와 같다", () => {
  expect(sparseTableRangeMin([-1, -1, -1], [[0, 2]])).toEqual([-1]);
  expect(
    sparseTableRangeMin(
      [-10, -20, -30, -40],
      [
        [0, 1],
        [1, 3],
        [0, 3],
      ],
    ),
  ).toEqual([-20, -40, -40]);
});
