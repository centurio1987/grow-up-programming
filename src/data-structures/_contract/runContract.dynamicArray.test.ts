/**
 * 하네스 자기시험 — `linear/dynamicArray` 계약 앞에 선 정본과 결함 셋.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로
 * 인용하는 가이드들이 밀린다(불변 사실 106 · 215).
 *
 * 보는 것은 셋이다.
 *
 * 1. **결함 셋은 동작상 옳다.** 축1 · 축2를 전부 통과한다. 이 계약에서 넷을 가르는 것은 값이 아니라 비용이다.
 * 2. **결함 셋이 축3에서 서로 다른 행에 걸린다.** 행 단위로 적는다(불변 사실 84). 통과하는 자리에 숨은
 *    계약 위반은 없다 — 걸리지 않는 행에서는 정본과 같은 계급이다(불변 사실 62).
 * 3. **정본의 넣기 · 빼기는 상각으로 통과하고 한 호출 최대로는 걸린다.** 계약이 두 행을 `worst` 가 아니라
 *    `amortized` 로 적은 근거가 정본 자신이다 — 칸을 옮기는 호출 하나가 담긴 수를 따라간다(불변 사실
 *    195 의 방식 — 같은 시나리오를 두 통계로 잰다).
 *
 * | 시나리오 (n = 1,024 → 4,096) | 정본 | `StepGrowthArray` | `HalfShrinkArray` | `WalkingIndexList` |
 * |---|---|---|---|---|
 * | `push` amortized O(1) | 2.00 → 2.00 — 한 호출 최대 513 → 2,049 | **걸림** 32.50 → 128.50 | 통과 | 통과 |
 * | `pop` amortized O(1) | 1.50 → 1.50 — 한 호출 최대 257 → 1,025 | 통과 | 통과 | **걸림** 512.50 → 2,048.50 |
 * | `push`·`pop` 경계에서 번갈아 (적대적) | 1.50 → 1.50 | 통과 | **걸림** 1,025 → 4,097 | **걸림** 513 → 2,049 |
 * | `get` worst O(1) | 1 → 1 | 통과 | 통과 | **걸림** 1,024 → 4,096 |
 * | `set` amortized O(1) | 1.00 → 1.00 | 통과 | 통과 | **걸림** 512.50 → 2,048.50 |
 * | `toArray` worst O(n) | 1,024 → 4,096 | 통과 | 통과 | 통과 |
 *
 * **`HalfShrinkArray` 를 잡는 것은 적대적 시나리오 하나다.** 넣기만 · 빼기만 하는 두 시나리오에서는 정본과
 * 같은 계급이다(2.00 · 2.00). 그리고 그 시나리오는 칸 수가 사다리 크기와 맞을 때만 경계를 만난다 —
 * `dynamicArray.contract.ts` 머리말에 처음 칸 수를 바꾼 실측이 있다.
 */

import { describe, expect, test } from "bun:test";
import { DynamicArray as Reference } from "../linear/dynamicArray/_reference/dynamicArray";
import {
  type DynamicArrayContract,
  dynamicArrayContract,
} from "../linear/dynamicArray/dynamicArray.contract";
import { HalfShrinkArray } from "./_fixtures/halfShrinkArray";
import { StepGrowthArray } from "./_fixtures/stepGrowthArray";
import { WalkingIndexList } from "./_fixtures/walkingIndexList";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
  runContract,
} from "./runContract";

type Surface = DynamicArrayContract<number>;

function source(make: () => Surface & { __cost: number }): CostSource<Surface> {
  return { kind: "self-reported", make };
}

const reference = source(() => new Reference<number>());
const stepGrowth = source(() => new StepGrowthArray());
const halfShrink = source(() => new HalfShrinkArray());
const walking = source(() => new WalkingIndexList());

/** 시나리오마다 `행 (적대적) → 통과 여부`. 이 계약은 이름이 겹치는 시나리오가 없다. */
function verdicts(cost: CostSource<Surface>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of dynamicArrayContract.scenarios) {
    const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
    found[label] = judgeScenario(cost, scenario, dynamicArrayContract.grade).ok;
  }
  return found;
}

const ALL_PASS = {
  push: true,
  pop: true,
  "push·pop (적대적)": true,
  get: true,
  set: true,
  toArray: true,
};

// 1. 결함 셋은 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new StepGrowthArray(), dynamicArrayContract, {
  label: "결함 fixture StepGrowthArray",
});
runContract(() => new HalfShrinkArray(), dynamicArrayContract, {
  label: "결함 fixture HalfShrinkArray",
});
runContract(() => new WalkingIndexList(), dynamicArrayContract, {
  label: "결함 fixture WalkingIndexList",
});

describe("DynamicArray 축3 — 결함 셋이 서로 다른 행에서 걸린다", () => {
  test("정본은 여섯 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("칸을 일정한 수씩만 늘리면 push 에서만 걸린다", () => {
    expect(verdicts(stepGrowth)).toEqual({ ...ALL_PASS, push: false });
  });

  test("절반 이하에서 곧바로 줄이면 경계에서 번갈아 넣고 뺄 때만 걸린다", () => {
    expect(verdicts(halfShrink)).toEqual({
      ...ALL_PASS,
      "push·pop (적대적)": false,
    });
  });

  test("마디를 앞에서부터 세면 pop · 번갈아 · get · set 에서 걸린다", () => {
    expect(verdicts(walking)).toEqual({
      ...ALL_PASS,
      pop: false,
      "push·pop (적대적)": false,
      get: false,
      set: false,
    });
  });
});

describe("DynamicArray 한정자 — push · pop 을 amortized 로 적은 근거", () => {
  const only = (row: string) =>
    dynamicArrayContract.scenarios.find(
      (scenario) => scenario.covers.length === 1 && scenario.covers[0] === row,
    ) as CostScenario<Surface>;

  test("정본의 push · pop 을 한 호출 최대로 재면 칸을 옮기는 호출이 담긴 수를 따라간다", () => {
    for (const row of ["push", "pop"]) {
      const asWorst: CostScenario<Surface> = {
        ...only(row),
        qualifier: "worst",
      };
      const verdict = judgeScenario(reference, asWorst, "invariant");
      expect(`${row}: ${verdict.ok}`).toBe(`${row}: false`);
      expect(judgeScenario(reference, only(row), "invariant").ok).toBe(true);
    }
  });
});
