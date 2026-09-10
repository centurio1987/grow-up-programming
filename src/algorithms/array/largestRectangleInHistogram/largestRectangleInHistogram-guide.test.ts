/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram.test.ts`
 * 는 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(`N` = 100,000 인 높이 1 짜리 배열에서 답이 `N`)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { largestRectangleInHistogram } from "./largestRectangleInHistogram-guide.ref.ts";

const CASES: [string, number[], number][] = [
  // 기본
  ["[2,1,5,6,2,3]", [2, 1, 5, 6, 2, 3], 10],
  ["[2,4]", [2, 4], 4],
  // **원본 테스트는 이 줄의 답을 15 로 적어 두었고 그 값이 틀렸다.** 원본 주석이 후보를
  // 손으로 열거하다 배열 전체를 빠뜨렸다 — 전체 구간 [0,7] 은 최솟값이 2 이고 폭이 8 이라
  // 넓이가 16 이다. 아래 「구간 열거와 맞춘다」 시험이 같은 값을 독립으로 낸다.
  ["[6,7,5,2,4,5,9,3]", [6, 7, 5, 2, 4, 5, 9, 3], 16],
  // 엣지
  ["모두 같은 높이 [3,3,3,3]", [3, 3, 3, 3], 12],
  ["0 포함 [2,0,2]", [2, 0, 2], 2],
  ["모두 0 [0,0,0]", [0, 0, 0], 0],
  ["증가 [1,2,3,4,5]", [1, 2, 3, 4, 5], 9],
  ["감소 [5,4,3,2,1]", [5, 4, 3, 2, 1], 9],
  // 바운더리
  ["N=1, 단일 높이", [7], 7],
  ["N=1, 0", [0], 0],
  ["최대 높이 단일", [10_000], 10_000],
  // 문제 문서의 나머지 예시
  ["[1,1,1,1]", [1, 1, 1, 1], 4],
];

for (const [name, heights, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(largestRectangleInHistogram([...heights])).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(largestRectangleInHistogram([2, 1, 5, 6, 2, 3])).toBe(10);
});

test("입력 배열을 고치지 않는다", () => {
  const heights = [2, 1, 5, 6, 2, 3];
  largestRectangleInHistogram(heights);
  expect(heights).toEqual([2, 1, 5, 6, 2, 3]);
});

test("N=100,000 · 높이 1 이면 답이 N 이다", () => {
  const N = 100_000;
  expect(largestRectangleInHistogram(new Array<number>(N).fill(1))).toBe(N);
});

test("N=100,000 증가 수열", () => {
  // 높이 i+1 인 증가 수열에서는 자리 j 가 폭 N−j 로 뻗는다. 최댓값을 직접 세어 맞춘다.
  const N = 100_000;
  const heights = Array.from({ length: N }, (_, i) => i + 1);
  let want = 0;
  for (let j = 0; j < N; j++) want = Math.max(want, (j + 1) * (N - j));
  expect(largestRectangleInHistogram(heights)).toBe(want);
});

test("N=100,000 감소 수열", () => {
  const N = 100_000;
  const heights = Array.from({ length: N }, (_, i) => N - i);
  let want = 0;
  for (let j = 0; j < N; j++) want = Math.max(want, (N - j) * (j + 1));
  expect(largestRectangleInHistogram(heights)).toBe(want);
});

test("모든 구간을 열거한 답과 같다", () => {
  // 정의: 답은 max over l ≤ r 인 (r−l+1) × min(heights[l..r]) 이다.
  const brute = (heights: number[]): number => {
    let best = 0;
    for (let l = 0; l < heights.length; l++) {
      let low = Number.POSITIVE_INFINITY;
      for (let r = l; r < heights.length; r++) {
        low = Math.min(low, heights[r] ?? 0);
        best = Math.max(best, low * (r - l + 1));
      }
    }
    return best;
  };
  const shapes: number[][] = [
    [2, 1, 5, 6, 2, 3],
    Array.from({ length: 300 }, (_, i) => (i * 4093) % 211),
    Array.from({ length: 300 }, (_, i) => 300 - i),
    Array.from({ length: 300 }, (_, i) => i + 1),
    Array.from({ length: 300 }, (_, i) => Math.min(i + 1, 300 - i)),
    Array.from({ length: 300 }, () => 0),
  ];
  for (const heights of shapes) {
    expect(largestRectangleInHistogram([...heights])).toBe(brute(heights));
  }
});

test("길이 1~7 · 값 0~3 인 배열을 전수로 구간 열거와 맞춘다", () => {
  const brute = (heights: number[]): number => {
    let best = 0;
    for (let l = 0; l < heights.length; l++) {
      let low = Number.POSITIVE_INFINITY;
      for (let r = l; r < heights.length; r++) {
        low = Math.min(low, heights[r] ?? 0);
        best = Math.max(best, low * (r - l + 1));
      }
    }
    return best;
  };
  let checked = 0;
  const walk = (acc: number[]): void => {
    if (acc.length > 0) {
      checked++;
      expect(largestRectangleInHistogram([...acc])).toBe(brute(acc));
    }
    if (acc.length === 7) return;
    for (let v = 0; v <= 3; v++) walk([...acc, v]);
  };
  walk([]);
  expect(checked).toBe(21_844);
});
