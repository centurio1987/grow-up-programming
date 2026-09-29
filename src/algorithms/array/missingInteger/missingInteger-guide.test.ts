/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/missingInteger/missingInteger.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 케이스는 옮기지
 * 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**(N=100,000 에서 홀수 자리에
 * 음수를 둔 배열의 답)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { missingInteger } from "./missingInteger-guide.ref.ts";

const CASES: [string, number[], number][] = [
  // 기본 동작 — 문제 예시
  ["[1,3,6,4,1,2]", [1, 3, 6, 4, 1, 2], 5],
  ["[1,2,3]", [1, 2, 3], 4],
  ["[-1,-3]", [-1, -3], 1],
  // 1이 없는 경우
  ["[2,3,4]", [2, 3, 4], 1],
  // 중복 포함
  ["[1,1,1,1]", [1, 1, 1, 1], 2],
  ["[1,2,2,3,3]", [1, 2, 2, 3, 3], 4],
  // 음수·0 혼합
  ["[0,-1,1,2]", [0, -1, 1, 2], 3],
  ["[-1000000,1000000]", [-1_000_000, 1_000_000], 1],
  // 엣지 케이스 — N=1
  ["[1]", [1], 2],
  ["[2]", [2], 1],
  ["[-5]", [-5], 1],
];

for (const [name, A, want] of CASES) {
  test(`정본 — ${name} → ${want}`, () => {
    const copy = [...A];
    expect(missingInteger(copy)).toBe(want);
    // 입력을 바꾸지 않는다 — 본문의 「경쟁 설계와의 대조」가 기대는 성질이다.
    expect(copy).toEqual(A);
  });
}

test("정본 — 1~100,000 완전 집합 → 100,001", () => {
  const A = Array.from({ length: 100_000 }, (_, i) => i + 1);
  expect(missingInteger(A)).toBe(100_001);
});

test("정본 — N=100,000, 짝수 자리 i+1 · 홀수 자리 −(i+1) → 2", () => {
  const A = Array.from({ length: 100_000 }, (_, i) =>
    i % 2 === 0 ? i + 1 : -(i + 1),
  );
  // 양수는 1 · 3 · 5 … 뿐이라 2 가 빠진다.
  expect(missingInteger(A)).toBe(2);
});
