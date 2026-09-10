/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/advanced/nQueens/nQueens.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * `n=10` 케이스의 벽시계 단언(`500ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 값 대조는 그대로 남긴다.
 */
import { expect, test } from "bun:test";
import { nQueens } from "./nQueens-guide.ref.ts";

const CASES: [number, number][] = [
  [1, 1],
  [2, 0],
  [3, 0],
  [4, 2],
  [5, 10],
  [6, 4],
  [7, 40],
  [8, 92],
  [9, 352],
  [10, 724],
];

for (const [n, want] of CASES) {
  test(`정본 — nQueens(${n}) = ${want}`, () => {
    expect(nQueens(n)).toBe(want);
  });
}

test("본문이 인용한 제약 상단 n=12 도 정확하다", () => {
  // perf.worst 가 드는 입력. 느린 것과 틀린 것은 다른 문제다.
  expect(nQueens(12)).toBe(14200);
});
