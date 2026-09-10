/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/maximumProductSubarray/maximumProductSubarray.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스의 **입출력**(N=100,000 에서의 반환값)은 아래에서 따로 확인한다.
 */
import { expect, test } from "bun:test";
import { maximumProductSubarray } from "./maximumProductSubarray-guide.ref.ts";

const CASES: [number[], number][] = [
  // 기본
  [[2, 3, -2, 4], 6],
  [[-2, 3, -4], 24],
  [[2, 3, 4], 24],
  // 엣지
  [[-2, 0, -1], 0],
  [[0, 2], 2],
  [[-2, -3, 7], 42],
  [[-2], -2],
  [[2, -5, -2, -4, 3], 24],
  // 바운더리
  [[5], 5],
  [[0], 0],
  [[-10, -10], 100],
];

for (const [A, want] of CASES) {
  test(`정본 — [${A.join(" ")}]`, () => {
    expect(maximumProductSubarray(A)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(maximumProductSubarray([2, -3, -2, 4, 0, -1])).toBe(48);
});

/** 모든 `(l, r)` 쌍의 곱을 각각 만드는 방식. 느리지만 정의를 그대로 옮긴 것이라 기준이 된다. */
function byAllPairs(A: number[]): number {
  let best = A[0] as number;
  for (let l = 0; l < A.length; l++) {
    let p = 1;
    for (let r = l; r < A.length; r++) {
      p *= A[r] as number;
      best = Math.max(best, p);
    }
  }
  return best;
}

/**
 * 왼쪽에서 한 번, 오른쪽에서 한 번 누적곱을 만드는 방식. 최솟값을 안 들고도 같은 답을 내는
 * 독립 구현이라 큰 입력의 기준이 된다 — 0 을 만나면 누적곱을 1 로 되돌린다.
 */
function byTwoPasses(A: number[]): number {
  let best = A[0] as number;
  let p = 1;
  for (let i = 0; i < A.length; i++) {
    p *= A[i] as number;
    best = Math.max(best, p);
    if (p === 0) p = 1;
  }
  p = 1;
  for (let i = A.length - 1; i >= 0; i--) {
    p *= A[i] as number;
    best = Math.max(best, p);
    if (p === 0) p = 1;
  }
  return best;
}

test("작은 입력 전수에서 모든 쌍을 세는 방식과 같은 답을 낸다", () => {
  // 길이 1~7, 값 −3..3 을 규칙으로 만든 입력 400 개.
  for (let n = 1; n <= 7; n++) {
    for (let seed = 0; seed < 400; seed++) {
      const A = Array.from(
        { length: n },
        (_, k) => (((seed + 1) * (k + 3) * 37) % 7) - 3,
      );
      expect(maximumProductSubarray(A)).toBe(byAllPairs(A));
    }
  }
});

test("0 이 많이 섞인 입력 전수에서도 같은 답을 낸다", () => {
  // 값이 −1·0·1 만 나오는 입력 — 구간이 0 으로 자주 끊긴다.
  for (let n = 1; n <= 8; n++) {
    for (let seed = 0; seed < 300; seed++) {
      const A = Array.from(
        { length: n },
        (_, k) => (((seed + 2) * (k + 5) * 13) % 3) - 1,
      );
      expect(maximumProductSubarray(A)).toBe(byAllPairs(A));
    }
  }
});

test("제약 최댓값에서 두 번 순회하는 방식과 같은 답을 낸다", () => {
  // 값을 −1·0·1 로 둔다 — 100,000 칸의 곱은 double 의 표현 범위를 넘어 대조가 성립하지 않는다.
  const N = 100_000;
  const A = Array.from({ length: N }, (_, i) => ((i * 37) % 3) - 1);
  expect(maximumProductSubarray(A)).toBe(byTwoPasses(A));
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const N = 100_000;
  expect(maximumProductSubarray(new Array<number>(N).fill(1))).toBe(1);
});

test("모든 원소가 음수면 음수를 짝수 개 고른 구간이 답이다", () => {
  const A = [-9, -3, -7, -1, -5];
  // (-9)×(-3)×(-7)×(-1) = 189 이 가장 크다.
  expect(maximumProductSubarray(A)).toBe(189);
  expect(maximumProductSubarray(A)).toBe(byAllPairs(A));
});

test("답이 배열의 가운데에서 끝나도 찾아낸다", () => {
  // 마지막 칸의 curMax(0)와 답(48)이 다른 입력이다.
  expect(maximumProductSubarray([2, -3, -2, 4, 0, -1])).toBe(48);
});

test("답이 double 의 표현 범위를 넘으면 Infinity 가 나온다", () => {
  // `deep.math` ④ 가 값으로 보이는 자리다. 308 칸까지는 표현되고 309 칸부터 넘어간다.
  expect(
    Number.isFinite(maximumProductSubarray(new Array<number>(308).fill(10))),
  ).toBe(true);
  expect(
    Number.isFinite(maximumProductSubarray(new Array<number>(309).fill(10))),
  ).toBe(false);
});

test("답이 정확한 정수로 남는 것은 22 칸까지다", () => {
  // 같은 절의 첫 표가 보이는 자리다. 23 칸부터는 표현은 되지만 값이 어긋난다.
  const at = (k: number): bigint =>
    BigInt(maximumProductSubarray(new Array<number>(k).fill(10)));
  expect(at(22)).toBe(10n ** 22n);
  expect(at(23)).not.toBe(10n ** 23n);
});
