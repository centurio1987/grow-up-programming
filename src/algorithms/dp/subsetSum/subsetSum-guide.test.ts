/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/subsetSum/subsetSum.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { subsetSum } from "./subsetSum-guide.ref.ts";

const CASES: [number[], number, boolean][] = [
  // 기본
  [[3, 34, 4, 12, 5, 2], 9, true],
  [[3, 34, 4, 12, 5, 2], 30, false],
  [[1, 2, 3, 4], 7, true],
  // 엣지
  [[1, 2, 3], 0, true],
  [[], 0, true],
  [[], 5, false],
  [[0, 1, 2], 0, true],
  [[7], 7, true],
  [[7], 8, false],
  [[1, 2, 3, 4], 10, true],
  // 바운더리
  [[100, 200], 50, false],
  [[10_000], 10_000, true],
];

for (const [nums, target, want] of CASES) {
  test(`정본 — subsetSum([${nums.join(", ")}], ${target}) = ${want}`, () => {
    expect(subsetSum(nums, target)).toBe(want);
  });
}

test("바운더리 — 1 이 1,000 개, target 500", () => {
  expect(subsetSum(new Array(1000).fill(1), 500)).toBe(true);
});

test("제약 최대 — n=1000, target=10^4 에서 참/거짓이 나온다", () => {
  const nums = Array.from({ length: 1000 }, (_, i) => (i % 100) + 1);
  expect(subsetSum(nums, 10_000)).toBe(true);
});

test("본문 perf.worst 가 드는 자리 — 21 의 배수만 만들 수 있으면 10,000 은 못 만든다", () => {
  expect(subsetSum(new Array(1000).fill(21), 10_000)).toBe(false);
  expect(subsetSum(new Array(1000).fill(20), 10_000)).toBe(true);
});

test("본문 invariant 가 드는 자리 — 원소 하나를 두 번 쓸 수 없다", () => {
  expect(subsetSum([3], 9)).toBe(false);
  expect(subsetSum([3, 4], 8)).toBe(false);
  expect(subsetSum([3, 4], 7)).toBe(true);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./subsetSum-guide.sim.ts");
  const {
    simStepsFromRef,
    trace,
    trueCols,
    setText,
    SPLIT_ROW,
    TABLE_OPTIONS,
  } = await import("./subsetSum-guide.fig.tsx");
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.upper.steps)).toEqual(plain(want.upper));
  expect(plain(sim.lower.steps)).toEqual(plain(want.lower));
  for (const part of [sim.upper, sim.lower]) {
    expect(plain(part.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
    expect(plain(part.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
  }
  // 패널이 내미는 값이 정본의 DP 테이블 · 답과 같은지 — 정본에 직접 다시 묻는다.
  const rows = trace([3, 34, 4, 12, 5, 2], 9).rows;
  expect(sim.upper.result).toBe(setText(trueCols(rows[SPLIT_ROW] ?? [])));
  expect(sim.lower.result).toBe(
    subsetSum([3, 34, 4, 12, 5, 2], 9) ? "참" : "거짓",
  );
});
