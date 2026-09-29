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

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본에 계측
 * 원소를 넘겨 실제 비교 목록을 받고, 그것을 정본의 갈래 순서로 읽어 만든 걸음 — 와 글자 그대로 같아야
 * 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./minMaxPair-guide.sim.ts");
  const { simStepsFromRef, A8 } = await import("./minMaxPair-guide.fig.tsx");
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.pairwalk.steps)).toEqual(plain(simStepsFromRef().pairwalk));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  const r = minMaxPair([...A8]);
  expect(sim.pairwalk.result).toBe(`{ min: ${r.min}, max: ${r.max} }`);
});

test("계측이 센 비교 횟수가 본문의 식 ⌈3n/2⌉ − 2 와 같다", async () => {
  const { countOf, formula } = await import("./minMaxPair-guide.fig.tsx");
  for (let n = 1; n <= 40; n++) {
    const arr = Array.from({ length: n }, (_, i) => (i * 13) % 17);
    expect(countOf(arr, (xs) => minMaxPair(xs))).toBe(formula(n));
  }
});
