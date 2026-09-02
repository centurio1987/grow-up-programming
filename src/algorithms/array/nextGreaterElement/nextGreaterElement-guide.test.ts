/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/nextGreaterElement/nextGreaterElement.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**
 * (`N` = 100,000 인 증가 수열에서 답의 개수와 값)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { nextGreaterElement } from "./nextGreaterElement-guide.ref.ts";

const CASES: [string, number[], number[]][] = [
  // 기본
  ["[2,1,2,4,3]", [2, 1, 2, 4, 3], [4, 2, 4, -1, -1]],
  ["[1,3,2,4]", [1, 3, 2, 4], [3, 4, 4, -1]],
  ["[1,2,3,4]", [1, 2, 3, 4], [2, 3, 4, -1]],
  // 엣지
  ["감소 수열 [4,3,2,1]", [4, 3, 2, 1], [-1, -1, -1, -1]],
  ["모두 같은 값 [5,5,5]", [5, 5, 5], [-1, -1, -1]],
  ["음수 포함 [-1,-2,-3]", [-1, -2, -3], [-1, -1, -1]],
  ["음수 포함 증가 [-3,-2,-1]", [-3, -2, -1], [-2, -1, -1]],
  // 바운더리
  ["N=1", [5], [-1]],
  ["N=2 증가", [1, 2], [2, -1]],
  ["N=2 감소", [2, 1], [-1, -1]],
  // 문제 문서의 예시
  ["문제 문서 예시 — [2,7,3,5,1,6]", [2, 7, 3, 5, 1, 6], [7, -1, 5, 6, 6, -1]],
];

for (const [name, nums, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(nextGreaterElement([...nums])).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(nextGreaterElement([2, 1, 2, 4, 3])).toEqual([4, 2, 4, -1, -1]);
});

test("입력 배열을 고치지 않는다", () => {
  const nums = [2, 1, 2, 4, 3];
  nextGreaterElement(nums);
  expect(nums).toEqual([2, 1, 2, 4, 3]);
});

test("N=100,000 증가 수열에서 답의 개수와 값", () => {
  const N = 100_000;
  const nums = Array.from({ length: N }, (_, i) => i);
  const result = nextGreaterElement(nums);
  expect(result.length).toBe(N);
  expect(result[0]).toBe(1);
  expect(result[N - 2]).toBe(N - 1);
  expect(result[N - 1]).toBe(-1);
});

test("N=100,000 감소 수열은 전부 답이 없다", () => {
  const N = 100_000;
  const nums = Array.from({ length: N }, (_, i) => N - i);
  const result = nextGreaterElement(nums);
  expect(result.length).toBe(N);
  expect(result.every((v) => v === -1)).toBe(true);
});

test("답이 있는 자리는 정의를 그대로 만족한다", () => {
  // 정의: result[i] 는 i 보다 오른쪽에서 처음 만나는 엄격하게 큰 값이다.
  const nums = Array.from({ length: 400 }, (_, i) => (i * 7919) % 101);
  const result = nextGreaterElement(nums);
  for (let i = 0; i < nums.length; i++) {
    let want = -1;
    for (let j = i + 1; j < nums.length; j++) {
      if ((nums[j] ?? 0) > (nums[i] ?? 0)) {
        want = nums[j] ?? 0;
        break;
      }
    }
    expect(result[i]).toBe(want);
  }
});
