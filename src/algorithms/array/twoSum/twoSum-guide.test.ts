/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/twoSum/twoSum.test.ts` 는 학습자 스텁을 가져오므로 그대로 재사용할
 * 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스의 **입출력**(N=10,000 에서 답이 끝에 있는 경우)은 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { twoSum } from "./twoSum-guide.ref.ts";

const CASES: [number[], number, [number, number]][] = [
  // 기본 동작
  [[2, 7, 11, 15], 9, [0, 1]],
  [[3, 2, 4], 6, [1, 2]],
  // 엣지 케이스
  [[3, 3], 6, [0, 1]],
  [[-1, -2, 3], 1, [1, 2]],
  [[-3, 4, -7], -10, [0, 2]],
  [[0, 5, 0], 0, [0, 2]],
  // 바운더리
  [[1, 2], 3, [0, 1]],
];

for (const [nums, target, want] of CASES) {
  test(`정본 — ${JSON.stringify(nums)} · target ${target}`, () => {
    expect(twoSum([...nums], target)).toEqual(want);
  });
}

test("최대 길이 배열 (N=10,000)에서 정답이 끝에 있는 경우", () => {
  const nums = new Array<number>(10000).fill(0);
  nums[9998] = 99;
  nums[9999] = 1;
  expect(twoSum(nums, 100)).toEqual([9998, 9999]);
});

test("N=10,000 · 0 부터 차례로 늘어나는 배열에서 마지막 두 원소", () => {
  const N = 10000;
  const nums = Array.from({ length: N }, (_, i) => i);
  expect(twoSum(nums, N - 2 + (N - 1))).toEqual([N - 2, N - 1]);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.origin`·`deep.build`·`deep.walk`·`.proof.ts` 가 모두 이 입력을 쓴다.
  expect(twoSum([5, 8, 3, 8, 12, 2], 10)).toEqual([3, 5]);
});

test("짝이 없으면 오류를 던진다", () => {
  expect(() => twoSum([1, 2, 3], 100)).toThrow();
  expect(() => twoSum([5], 10)).toThrow();
});

test("돌려준 두 인덱스는 언제나 i < j 이고 합이 target 이다", () => {
  const nums = [4, -1, 9, 4, 0, 7, -6, 3];
  for (let a = 0; a < nums.length; a++) {
    for (let b = a + 1; b < nums.length; b++) {
      const target = (nums[a] as number) + (nums[b] as number);
      const [i, j] = twoSum([...nums], target);
      expect(i).toBeLessThan(j);
      expect((nums[i] as number) + (nums[j] as number)).toBe(target);
    }
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./twoSum-guide.sim.ts");
  const { simStepsFromRef, WALK, WALK_T } = await import(
    "./twoSum-guide.fig.tsx"
  );
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.scan.steps)).toEqual(plain(simStepsFromRef().scan));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  const [i, j] = twoSum([...WALK], WALK_T);
  expect(sim.scan.result).toBe(`[${i}, ${j}]`);
});
