/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/houseRobber/houseRobber.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 「성능」 케이스는
 * 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**(N=100,000 에서의
 * 반환값)은 아래에서 따로 확인한다.
 */
import { expect, test } from "bun:test";
import { houseRobber } from "./houseRobber-guide.ref.ts";

const CASES: [number[], number][] = [
  // 기본
  [[1, 2, 3, 1], 4],
  [[2, 7, 9, 3, 1], 12],
  [[2, 1, 1, 2], 4],
  // 엣지
  [[], 0],
  [[0, 0, 0], 0],
  [[5, 5, 5, 5, 5], 15],
  [[1, 3, 1], 3],
  // 바운더리
  [[5], 5],
  [[2, 7], 7],
  [[10000, 1, 10000], 20000],
];

for (const [nums, want] of CASES) {
  test(`정본 — [${nums.join(" ")}]`, () => {
    expect(houseRobber(nums)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(houseRobber([2, 7, 9, 3, 1, 5])).toBe(16);
});

/**
 * 인접하지 않은 부분집합을 전부 만들어 합을 견주는 방식. 느리지만 정의를 그대로 옮긴 것이라
 * 기준이 된다.
 */
function byAllSubsets(nums: number[]): number {
  let best = 0;
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let sum = 0;
    let ok = true;
    for (let i = 0; i < nums.length; i++) {
      if ((mask & (1 << i)) === 0) continue;
      if (i > 0 && (mask & (1 << (i - 1))) !== 0) ok = false;
      sum += nums[i] as number;
    }
    if (ok) best = Math.max(best, sum);
  }
  return best;
}

/**
 * 칸 `N` 개짜리 표를 실제로 만드는 방식. 두 변수만 이어받는 정본과 같은 답을 내야 하는
 * 독립 구현이라 큰 입력의 기준이 된다.
 */
function byTable(nums: number[]): number {
  const n = nums.length;
  if (n === 0) return 0;
  const dp = new Array<number>(n);
  dp[0] = nums[0] as number;
  for (let i = 1; i < n; i++) {
    const skip = dp[i - 1] as number;
    const take = (i >= 2 ? (dp[i - 2] as number) : 0) + (nums[i] as number);
    dp[i] = Math.max(skip, take);
  }
  return dp[n - 1] as number;
}

test("작은 입력 전수에서 부분집합을 다 만드는 방식과 같은 답을 낸다", () => {
  // 길이 0~9, 값 0..6 을 규칙으로 만든 입력 400 개.
  for (let n = 0; n <= 9; n++) {
    for (let seed = 0; seed < 400; seed++) {
      const nums = Array.from(
        { length: n },
        (_, k) => ((seed + 1) * (k + 3) * 37) % 7,
      );
      expect(houseRobber(nums)).toBe(byAllSubsets(nums));
    }
  }
});

test("0 이 많이 섞인 입력 전수에서도 같은 답을 낸다", () => {
  // 값이 0·1·2 만 나오는 입력 — 고를 이유가 없는 집이 자주 끼어든다.
  for (let n = 0; n <= 10; n++) {
    for (let seed = 0; seed < 300; seed++) {
      const nums = Array.from(
        { length: n },
        (_, k) => ((seed + 2) * (k + 5) * 13) % 3,
      );
      expect(houseRobber(nums)).toBe(byAllSubsets(nums));
    }
  }
});

test("제약 최댓값에서 표를 만드는 방식과 같은 답을 낸다", () => {
  const N = 100_000;
  const nums = Array.from({ length: N }, (_, i) => (i * 37) % 10_001);
  expect(houseRobber(nums)).toBe(byTable(nums));
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const N = 100_000;
  expect(houseRobber(new Array<number>(N).fill(1))).toBe(Math.ceil(N / 2));
});

test("값이 전부 같으면 한 칸 걸러 고른 개수가 답이다", () => {
  for (const n of [1, 2, 3, 7, 8, 999]) {
    expect(houseRobber(new Array<number>(n).fill(4))).toBe(
      4 * Math.ceil(n / 2),
    );
  }
});

test("답이 마지막 집을 안 고르는 입력도 맞힌다", () => {
  // 마지막 집을 고르면 9 이고, 안 고르면 10 이다.
  expect(houseRobber([1, 10, 1, 1])).toBe(11);
  expect(houseRobber([9, 1, 9, 1])).toBe(18);
});

test("제약 최댓값에서 답이 안전한 정수 범위 안에 든다", () => {
  // `A[i] ≤ 10,000` 이고 고를 수 있는 집이 최대 50,000 채라 답의 상한이 5 억이다.
  const N = 100_000;
  const got = houseRobber(new Array<number>(N).fill(10_000));
  expect(got).toBe(500_000_000);
  expect(Number.isSafeInteger(got)).toBe(true);
});
