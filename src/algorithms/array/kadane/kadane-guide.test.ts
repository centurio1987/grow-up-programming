/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/kadane/kadane.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 「성능」 케이스는
 * 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**(N=100,000 에서의
 * 반환값)은 아래에 모든 쌍을 세는 방식과 대조해 따로 확인한다.
 */
import { expect, test } from "bun:test";
import { kadane } from "./kadane-guide.ref.ts";

const CASES: [number[], number][] = [
  // 기본
  [[-2, 1, -3, 4, -1, 2, 1, -5, 4], 6],
  [[1, 2, 3, 4, 5], 15],
  [[5, -3, 5], 7],
  // 엣지
  [[-3, -1, -4, -2], -1],
  [[-1, 0, -2], 0],
  [[10, -1, -1, -100], 10],
  [[-100, -1, -1, 10], 10],
  // 바운더리
  [[7], 7],
  [[-7], -7],
  [[0], 0],
  [[10000, -1, 10000], 19999],
];

for (const [A, want] of CASES) {
  test(`정본 — [${A.join(" ")}]`, () => {
    expect(kadane(A)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4])).toBe(6);
});

/** 모든 `(l, r)` 쌍의 합을 각각 만드는 방식. 느리지만 정의를 그대로 옮긴 것이라 기준이 된다. */
function byAllPairs(A: number[]): number {
  let best = A[0] as number;
  for (let l = 0; l < A.length; l++) {
    let s = 0;
    for (let r = l; r < A.length; r++) {
      s += A[r] as number;
      best = Math.max(best, s);
    }
  }
  return best;
}

test("작은 입력 전수에서 모든 쌍을 세는 방식과 같은 답을 낸다", () => {
  // 길이 1~7, 값 −2..2 를 규칙으로 만든 입력 400 개.
  for (let n = 1; n <= 7; n++) {
    for (let seed = 0; seed < 400; seed++) {
      const A = Array.from(
        { length: n },
        (_, k) => (((seed + 1) * (k + 3) * 37) % 5) - 2,
      );
      expect(kadane(A)).toBe(byAllPairs(A));
    }
  }
});

test("제약 최댓값에서 모든 쌍을 세는 방식과 같은 답을 낸다", () => {
  const N = 100_000;
  const A = Array.from({ length: N }, (_, i) => ((i * 37) % 20001) - 10000);
  expect(kadane(A)).toBe(byAllPairs(A));
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const N = 100_000;
  expect(kadane(new Array<number>(N).fill(1))).toBe(N);
});

test("모든 원소가 음수면 가장 큰 원소 하나가 답이다", () => {
  const A = [-9, -3, -7, -1, -5];
  expect(kadane(A)).toBe(-1);
  expect(kadane(A)).toBe(Math.max(...A));
});

test("답이 배열의 가운데에서 끝나도 찾아낸다", () => {
  // 마지막 칸의 값(3)과 답(6)이 다른 입력이다.
  expect(kadane([1, 2, 3, -10, 3])).toBe(6);
});
