/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { unboundedKnapsack } from "./unboundedKnapsack-guide.ref.ts";

const CASES: [number[], number, number][] = [
  // 기본
  [[1, 2, 5], 11, 3],
  [[2], 3, -1],
  [[1], 0, 0],
  [[1, 3, 4], 6, 2],
  // 엣지
  [[2, 5], 0, 0],
  [[], 0, 0],
  [[], 5, -1],
  [[7, 7, 7], 7, 1],
  // 바운더리
  [[1, 2, 5], 1, 1],
  [[1], 10_000, 10_000],
  [[10_000], 10_000, 1],
  [[5, 10], 3, -1],
];

for (const [coins, amount, want] of CASES) {
  test(`정본 — unboundedKnapsack([${coins.join(", ")}], ${amount}) = ${want}`, () => {
    expect(unboundedKnapsack(coins, amount)).toBe(want);
  });
}

test("성능 케이스와 같은 입력 — n=100, amount=10,000 에서 답이 나온다", () => {
  const coins = Array.from({ length: 100 }, (_, i) => i + 1);
  expect(unboundedKnapsack(coins, 10_000)).toBe(100);
});

test("전개가 쓰는 입력 — 액면가 순서를 바꿔도 답이 같다", () => {
  expect(unboundedKnapsack([3, 4, 1], 6)).toBe(2);
  expect(unboundedKnapsack([1, 3, 4], 6)).toBe(2);
  expect(unboundedKnapsack([4, 1, 3], 6)).toBe(2);
});

test("본문 불변식이 드는 자리 — 같은 액면가를 몇 개든 쓴다", () => {
  expect(unboundedKnapsack([3], 9)).toBe(3);
  expect(unboundedKnapsack([3], 10)).toBe(-1);
  expect(unboundedKnapsack([3, 4], 6)).toBe(2);
});

test("본문 수식 절이 드는 자리 — 액면가 3 과 4 로 못 만드는 가장 큰 금액은 5 다", () => {
  for (const a of [1, 2, 5]) expect(unboundedKnapsack([3, 4], a)).toBe(-1);
  for (let a = 6; a <= 40; a++) {
    expect(unboundedKnapsack([3, 4], a)).toBeGreaterThan(0);
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./unboundedKnapsack-guide.sim.ts");
  const { simStepsFromRef, trace, TABLE_OPTIONS, fmt } = await import(
    "./unboundedKnapsack-guide.fig.tsx"
  );
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.row1.steps)).toEqual(plain(want.row1));
  expect(plain(sim.row2.steps)).toEqual(plain(want.row2));
  expect(plain(sim.row3.steps)).toEqual(plain(want.row3));
  for (const part of [sim.row1, sim.row2, sim.row3]) {
    expect(plain(part.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
    expect(plain(part.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
  }
  // 패널이 내미는 값이 정본의 DP 테이블 · 답과 같은지 — 정본에 직접 다시 묻는다.
  const rows = trace([3, 4, 1], 6).rows;
  expect(sim.row1.result).toBe(`[${rows[1]?.map(fmt).join(", ")}]`);
  expect(sim.row2.result).toBe(`[${rows[2]?.map(fmt).join(", ")}]`);
  expect(sim.row3.result).toBe(String(unboundedKnapsack([3, 4, 1], 6)));
});
