/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor.test.ts` 는 학습자가
 * 채우는 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스의 **입출력**(길이 `10^6 + 1`, 답 12,345)은 아래 규모 케이스가 그대로 확인한다.
 */
import { expect, test } from "bun:test";
import { singleNumberXor } from "./singleNumberXor-guide.ref.ts";

const CASES: [number[], number][] = [
  // 기본 동작 — 문제 예시
  [[4, 1, 2, 1, 2], 4],
  [[2, 2, 1], 1],
  [[1, 3, 1, 3, 99], 99],
  // 정답 원소의 등장 위치와 무관
  [[7, 1, 1, 2, 2], 7],
  [[1, 1, 2, 2, 7], 7],
  // 음수·0 포함
  [[-5, 1, 1], -5],
  [[0, 1, 1, 2, 2], 0],
  [[-1, -1, -2, 3, 3], -2],
  // 엣지 케이스
  [[42], 42],
  [[0], 0],
  [[5, 5, 5, 1, 1], 5],
  // 바운더리 — 큰 값
  [[2 ** 30, 1, 1], 2 ** 30],
];

for (const [nums, want] of CASES) {
  test(`정본 — singleNumberXor([${nums.join(", ")}])`, () => {
    expect(singleNumberXor(nums)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(singleNumberXor([4, 1, 2, 1, 2])).toBe(4);
});

test("칸 순서를 바꿔도 답이 같다", () => {
  const base = [4, 1, 2, 1, 2];
  const permutations: number[][] = [];
  const walk = (rest: number[], acc: number[]): void => {
    if (rest.length === 0) {
      permutations.push([...acc]);
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      acc.push(rest[i] as number);
      walk([...rest.slice(0, i), ...rest.slice(i + 1)], acc);
      acc.pop();
    }
  };
  walk(base, []);
  expect(permutations.length).toBe(120);
  for (const order of permutations) expect(singleNumberXor(order)).toBe(4);
});

test("등장 횟수의 홀짝만 결과를 정한다", () => {
  for (let c = 0; c <= 8; c++) {
    const nums = Array.from({ length: c }, () => 5);
    expect(singleNumberXor(nums)).toBe(c % 2 === 0 ? 0 : 5);
  }
});

/** 정의를 그대로 옮긴 답. 값마다 등장 횟수를 세어 홀수인 것을 돌려준다. */
function answerByDefinition(nums: number[]): number | null {
  const count = new Map<number, number>();
  for (const v of nums) count.set(v, (count.get(v) ?? 0) + 1);
  for (const [v, c] of count) if (c % 2 === 1) return v;
  return null;
}

test("무작위 입력 200 벌에서 정의가 낸 답과 같다", () => {
  // 시드를 고정한 선형 합동 생성기 — 실행마다 같은 입력이 나온다.
  let seed = 20_260_903;
  const next = (): number => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed;
  };
  for (let round = 0; round < 200; round++) {
    const pairCount = next() % 40;
    const nums: number[] = [];
    for (let k = 0; k < pairCount; k++) {
      const v = (next() % 2_000) - 1_000;
      nums.push(v, v);
    }
    const unique = (next() % 4_001) + 2_000; // 짝으로 넣은 값과 겹치지 않는 범위
    nums.push(unique);
    // 시드로 정해지는 자리에서 한 번 섞는다.
    for (let i = nums.length - 1; i > 0; i--) {
      const j = next() % (i + 1);
      const t = nums[i] as number;
      nums[i] = nums[j] as number;
      nums[j] = t;
    }
    const want = answerByDefinition(nums);
    expect(want).not.toBeNull();
    expect(singleNumberXor(nums)).toBe(want as number);
  }
});

test("규모 — 길이 10^6 + 1 에서 답이 12,345 다", () => {
  const half = 500_000;
  const nums: number[] = new Array(2 * half + 1);
  for (let i = 0; i < half; i++) {
    nums[2 * i] = i + 1;
    nums[2 * i + 1] = i + 1;
  }
  nums[2 * half] = 12_345;
  expect(nums.length).toBe(1_000_001);
  expect(singleNumberXor(nums)).toBe(12_345);
});

test("빈 배열에서는 항등원 0 이 그대로 나온다", () => {
  // 제약(N ≥ 1) 밖이지만 바퀴가 한 번도 실행되지 않아 acc 가 초기값 그대로다.
  expect(singleNumberXor([])).toBe(0);
});
