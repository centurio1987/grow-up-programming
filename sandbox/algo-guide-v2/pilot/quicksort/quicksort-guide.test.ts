/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/quicksort/quicksort.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 두 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 */
import { expect, test } from "bun:test";
import { quickSort } from "./quicksort-guide.ref.ts";

const CASES: [number[], number[]][] = [
  [
    [5, 2, 3, 1],
    [1, 2, 3, 5],
  ],
  [
    [5, 1, 1, 2, 0, 0],
    [0, 0, 1, 1, 2, 5],
  ],
  [[], []],
  [[1], [1]],
  [
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
  ],
  [
    [5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
  ],
  [
    [2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2],
  ],
  [
    [-10, 5, -3, 0, 8, -1],
    [-10, -3, -1, 0, 5, 8],
  ],
];

for (const [input, want] of CASES) {
  test(`정본 — ${JSON.stringify(input)}`, () => {
    expect(quickSort([...input])).toEqual(want);
  });
}

test("본문이 인용한 최악 입력도 정렬은 정확하다", () => {
  // perf.worst 가 드는 입력. 느린 것과 틀린 것은 다른 문제다.
  expect(quickSort([0, 3, 5, 7, 1, 4, 2, 6])).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
});
