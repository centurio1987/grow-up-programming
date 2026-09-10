/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를
 * 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**
 * (N=100,000 · Q=100,000 에서의 결과 배열)은 아래에 구간 순회로 따로 만들어 대조한다.
 */
import { expect, test } from "bun:test";
import { diffArrayRangeUpdate } from "./diffArrayRangeUpdate-guide.ref.ts";

const CASES: [number, Array<[number, number, number]>, number[]][] = [
  // 기본
  [
    5,
    [
      [0, 2, 1],
      [1, 3, 2],
      [2, 4, 3],
    ],
    [1, 3, 6, 5, 3],
  ],
  [4, [[0, 3, 5]], [5, 5, 5, 5]],
  // 문제 문서의 예시
  [5, [[0, 2, 3]], [3, 3, 3, 0, 0]],
  [
    5,
    [
      [0, 2, 3],
      [1, 4, 2],
      [2, 2, -10],
    ],
    [3, 5, -5, 2, 2],
  ],
  // 엣지
  [3, [], [0, 0, 0]],
  [
    4,
    [
      [0, 2, 5],
      [1, 3, -3],
    ],
    [5, 2, 2, -3],
  ],
  [5, [[2, 2, 7]], [0, 0, 7, 0, 0]],
  [
    3,
    [
      [0, 2, 1],
      [0, 2, 1],
      [0, 2, 1],
    ],
    [3, 3, 3],
  ],
  // 바운더리
  [1, [[0, 0, 5]], [5]],
  [3, [[0, 0, 9]], [9, 0, 0]],
  [3, [[2, 2, 9]], [0, 0, 9]],
];

for (const [N, updates, want] of CASES) {
  test(`정본 — N=${N} · 갱신 ${updates.length}개`, () => {
    expect(diffArrayRangeUpdate(N, updates)).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(
    diffArrayRangeUpdate(7, [
      [1, 3, 2],
      [0, 2, -1],
      [5, 6, 3],
    ]),
  ).toEqual([-1, 1, 1, 2, 0, 3, 3]);
});

/** 구간을 통째로 순회하는 방식. 느리지만 정의를 그대로 옮긴 것이라 정답의 기준이 된다. */
function byScanning(
  N: number,
  updates: Array<[number, number, number]>,
): number[] {
  const A = new Array<number>(N).fill(0);
  for (const [l, r, v] of updates) {
    for (let i = l; i <= r; i++) A[i] = (A[i] as number) + v;
  }
  return A;
}

test("제약 최댓값에서 구간 순회와 같은 배열을 낸다", () => {
  const N = 100_000;
  const Q = 100_000;
  const updates: Array<[number, number, number]> = Array.from(
    { length: Q },
    (_, i) => [i % N, Math.min(N - 1, (i % N) + (i % 1000)), (i % 20) - 10],
  );

  const got = diffArrayRangeUpdate(N, updates);
  expect(got.length).toBe(N);
  expect(got).toEqual(byScanning(N, updates));
});

test("갱신이 없으면 모든 칸이 0 이다", () => {
  expect(diffArrayRangeUpdate(1, [])).toEqual([0]);
  expect(diffArrayRangeUpdate(5, [])).toEqual([0, 0, 0, 0, 0]);
});

test("같은 구간을 여러 번 갱신하면 값이 그대로 합쳐진다", () => {
  const updates: Array<[number, number, number]> = Array.from(
    { length: 100 },
    () => [2, 5, 3] as [number, number, number],
  );
  expect(diffArrayRangeUpdate(8, updates)).toEqual([
    0, 0, 300, 300, 300, 300, 0, 0,
  ]);
});

test("갱신 순서를 바꿔도 같은 배열이 나온다", () => {
  const updates: Array<[number, number, number]> = [
    [1, 3, 2],
    [0, 2, -1],
    [5, 6, 3],
  ];
  const reversed = [...updates].reverse();
  expect(diffArrayRangeUpdate(7, reversed)).toEqual(
    diffArrayRangeUpdate(7, updates),
  );
});
