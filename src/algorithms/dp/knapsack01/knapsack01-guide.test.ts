/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/knapsack01/knapsack01.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 대신 같은 규모(n=100, W=10000)를 **값으로** 확인하는 케이스를 남긴다.
 */
import { expect, test } from "bun:test";
import { knapsack01 } from "./knapsack01-guide.ref.ts";

const CASES: [number[], number[], number, number][] = [
  // 가이드 「수행으로 알아보는 알고리즘」과 같은 입력이다.
  [[1, 3, 4, 5], [1, 4, 5, 7], 7, 9],
  [[3, 4], [4, 5], 4, 5],
  [[1, 2, 3], [10, 20, 30], 10, 60],
  [[], [], 10, 0],
  [[1, 2, 3], [10, 20, 30], 0, 0],
  [[10, 20, 30], [100, 200, 300], 5, 0],
  [[5], [42], 5, 42],
  [[3, 3, 3], [1, 5, 3], 3, 5],
  [[10], [100], 5, 0],
  [[10000], [10000], 10000, 10000],
];

for (const [weights, values, W, want] of CASES) {
  test(`knapsack01([${weights}], [${values}], ${W}) = ${want}`, () => {
    expect(knapsack01(weights, values, W)).toBe(want);
  });
}

test("무게 1짜리 100개는 전부 담긴다", () => {
  const w = new Array(100).fill(1);
  const v = new Array(100).fill(7);
  expect(knapsack01(w, v, 10_000)).toBe(700);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./knapsack01-guide.sim.ts");
  const { simStepsFromRef, trace, TABLE_OPTIONS } = await import(
    "./knapsack01-guide.fig.tsx"
  );
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.row1.steps)).toEqual(plain(want.row1));
  expect(plain(sim.row2.steps)).toEqual(plain(want.row2));
  expect(plain(sim.row3.steps)).toEqual(plain(want.row3));
  expect(plain(sim.row4.steps)).toEqual(plain(want.row4));
  for (const part of [sim.row1, sim.row2, sim.row3, sim.row4]) {
    expect(plain(part.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
    expect(plain(part.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
  }
  // 패널이 내미는 값이 정본의 DP 테이블 · 답과 같은지 — 정본에 직접 다시 묻는다.
  const rows = trace([1, 3, 4, 5], [1, 4, 5, 7], 7).rows;
  expect(sim.row1.result).toBe(`[${rows[1]?.join(", ")}]`);
  expect(sim.row2.result).toBe(`[${rows[2]?.join(", ")}]`);
  expect(sim.row3.result).toBe(`[${rows[3]?.join(", ")}]`);
  expect(sim.row4.result).toBe(
    String(knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)),
  );
});
