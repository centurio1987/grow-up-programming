/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/advanced/minMaxPair/minMaxPair.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 원본의 마지막 케이스(`N=100,000` 을 100ms 이내)는 **벽시계 단언을 뺀 채로** 옮겼다 —
 * 실행마다 값이 달라 판정이 안 된다. 그 자리를 **비교 횟수 대조**가 대신한다. 가이드가
 * 내미는 `⌈3n/2⌉ − 2` 는 결정론적이라 한 번 어긋나면 언제나 어긋난다.
 */
import { expect, test } from "bun:test";
import { minMaxPair } from "./minMaxPair-guide.ref.ts";

const CASES: [number[], { min: number; max: number }][] = [
  [[3, 1, 4, 1, 5, 9, 2, 6], { min: 1, max: 9 }],
  [[1, 2, 3, 4, 5], { min: 1, max: 5 }],
  [[5, 4, 3, 2, 1], { min: 1, max: 5 }],
  [[7], { min: 7, max: 7 }],
  [[1, 2], { min: 1, max: 2 }],
  [[2, 1], { min: 1, max: 2 }],
  [[5, 5, 5, 5], { min: 5, max: 5 }],
  [[-3, -1, -4, -1, -5], { min: -5, max: -1 }],
  [[-10, 0, 10], { min: -10, max: 10 }],
  [[0, 0, 0], { min: 0, max: 0 }],
  [[2, 9, 5], { min: 2, max: 9 }],
  [[100, 50, 70, -10], { min: -10, max: 100 }],
];

for (const [입력, 답] of CASES) {
  test(`정본 — minMaxPair([${입력.join(", ")}]) = { min: ${답.min}, max: ${답.max} }`, () => {
    expect(minMaxPair(입력)).toEqual(답);
  });
}

test("제약 상단 N=100,000 에서도 두 극값이 맞는다", () => {
  const N = 100_000;
  const arr = Array.from({ length: N }, (_, i) => (i * 37) % 9973);
  expect(minMaxPair(arr)).toEqual({ min: 0, max: 9972 });
});

test("본문이 내미는 비교 횟수 ⌈3n/2⌉-2 가 실제 실행과 같다", async () => {
  const { PROOFS } = await import("./minMaxPair-guide.proof.ts");
  // `formula-check` 는 n = 1..10 의 실측 비교 횟수와 식을 나란히 적는다. 한 줄이라도
  // 어긋나면 마지막 칸이 "다르다" 가 된다.
  expect(PROOFS["formula-check"]?.()).not.toContain("다르다");
});
