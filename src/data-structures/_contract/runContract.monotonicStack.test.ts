/**
 * 하네스 자기시험 — `linear/monotonicStack` 계약 앞에 선 정본 · 결함 둘.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는
 * 가이드들이 밀린다(불변 사실 106 · 215).
 *
 * 보는 것은 셋이다.
 *
 * 1. **셋 다 동작상 옳다.** 축1 · 축2를 전부 통과한다. 이 계약에서 셋을 가르는 것은 값이 아니라 비용이다.
 * 2. **결함 둘이 축3에서 서로 다른 행에 걸린다.** 행 단위로 적는다(불변 사실 84). 걸리지 않는 행에서는
 *    정본과 같은 계급이라 통과하는 자리에 숨은 계약 위반이 없다(불변 사실 62).
 * 3. **최솟값을 묻는 스택은 이 계약이다.** 같은 정본에 뒤집은 비교자를 주입하고, 참조 모델이 최솟값을
 *    답하도록 같은 함수로 지은 스위트를 축1로 돌린다(헤더 주입 정책).
 *
 * | 시나리오 (n = 1,024 → 4,096) | 정본 | `ScanningMaxStack` | `RescanningMaxStack` |
 * |---|---|---|---|
 * | `push` amortized O(1) | 2.00 → 2.00 | 통과 | 통과 |
 * | `pop` amortized O(1) (적대적) | 3.00 → 3.00 | 통과 | **걸림** 1,025.00 → 4,097.00 |
 * | `max` worst O(1) | 1 → 1 | **걸림** 2,046 → 8,190 | 통과 |
 * | `peek` worst O(1) | 1 → 1 | 통과 | 통과 |
 * | 축1 · 축2 | 통과 | 통과 | 통과 |
 */

import { describe, expect, test } from "bun:test";
import { MonotonicStack as Reference } from "../linear/monotonicStack/_reference/monotonicStack";
import {
  ascending,
  descending,
  type MonotonicStackContract,
  monotonicStackContract,
  monotonicStackSpec,
} from "../linear/monotonicStack/monotonicStack.contract";
import { RescanningMaxStack } from "./_fixtures/rescanningMaxStack";
import { ScanningMaxStack } from "./_fixtures/scanningMaxStack";
import { type CostSource, judgeScenario, runContract } from "./runContract";

type Surface = MonotonicStackContract<number>;

function source(make: () => Surface & { __cost: number }): CostSource<Surface> {
  return { kind: "self-reported", make };
}

const reference = source(() => new Reference<number>(ascending));
const scanning = source(() => new ScanningMaxStack(ascending));
const rescanning = source(() => new RescanningMaxStack(ascending));

/** 시나리오마다 `행 (적대적) → 통과 여부`. 이 계약은 이름이 겹치는 시나리오가 없다. */
function verdicts(cost: CostSource<Surface>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of monotonicStackContract.scenarios) {
    const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
    found[label] = judgeScenario(
      cost,
      scenario,
      monotonicStackContract.grade,
    ).ok;
  }
  return found;
}

const ALL_PASS = {
  push: true,
  "pop (적대적)": true,
  max: true,
  peek: true,
};

// 1. 셋 다 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new ScanningMaxStack(ascending), monotonicStackContract, {
  label: "결함 fixture ScanningMaxStack",
});
runContract(() => new RescanningMaxStack(ascending), monotonicStackContract, {
  label: "결함 fixture RescanningMaxStack",
});

// 3. 뒤집은 비교자 — 같은 정본이 최솟값을 답한다. 참조 모델도 같은 비교자로 짓는다.
runContract(
  () => new Reference<number>(descending),
  monotonicStackSpec(descending, "MonotonicStack(뒤집은 비교자)"),
  { label: "정본 뒤집은 비교자" },
);

describe("MonotonicStack 축3 — 결함 둘이 서로 다른 행에서 걸린다", () => {
  test("정본은 네 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("최댓값을 매번 훑는 구현은 max 에서만 걸린다", () => {
    expect(verdicts(scanning)).toEqual({ ...ALL_PASS, max: false });
  });

  test("최댓값 하나만 기억하는 구현은 pop 에서만 걸린다", () => {
    expect(verdicts(rescanning)).toEqual({
      ...ALL_PASS,
      "pop (적대적)": false,
    });
  });
});

describe("MonotonicStack 등급 근거 — 정본이 호출 하나하나로도 상수다", () => {
  test("pop 시나리오를 한 호출 최대로 재도 정본은 통과한다", () => {
    const removal = monotonicStackContract.scenarios.find((scenario) =>
      scenario.covers.includes("pop"),
    );
    if (removal === undefined) throw new Error("pop 시나리오가 없다");
    const asWorst = { ...removal, qualifier: "worst" as const };
    expect(judgeScenario(reference, asWorst, "basic").ok).toBe(true);
  });
});
