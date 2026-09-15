/**
 * 하네스 자기시험 — `linear/singlyLinkedList` 계약 앞에 선 정본 · 결함 둘 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로
 * 인용하는 가이드들이 밀린다(불변 사실 106 · 215).
 *
 * 보는 것은 셋이다.
 *
 * 1. **셋 다 동작상 옳다.** 축1 · 축2를 전부 통과한다. 이 계약에서 넷을 가르는 것은 값이 아니라 비용이다.
 * 2. **결함 둘이 축3에서 서로 다른 행에 걸린다.** 행 단위로 적는다(불변 사실 84). 통과하는 자리에
 *    숨은 계약 위반은 없다 — 둘 다 걸리지 않는 행에서는 정본과 같은 계급이다(불변 사실 62).
 * 3. **넣는 자리를 둘로 나눠 드는 구현은 `removeFirst` 를 상각으로 통과하고 한 호출 최대로는 걸린다.**
 *    계약이 그 행을 `worst` 가 아니라 `amortized` 로 적은 근거의 실측이다(불변 사실 195 의 방식 — 같은
 *    시나리오를 두 통계로 잰다).
 *
 * | 시나리오 (n = 1,024 → 4,096) | 정본 | `HeadOnlyLinkedList` | `FrontShiftingList` | `TwoPileSequence` |
 * |---|---|---|---|---|
 * | `prepend` amortized O(1) | 1.00 → 1.00 | 통과 | **걸림** 512.50 → 2,048.50 | 통과 |
 * | `append` amortized O(1) | 1.00 → 1.00 | **걸림** 511.50 → 2,047.50 | 통과 | 통과 |
 * | `removeFirst` amortized O(1) (적대적) | 1.00 → 1.00 | 통과 | **걸림** 512.50 → 2,048.50 | 통과 2.00 → 2.00 — 한 호출 최대 1,025 → 4,097 |
 * | `toArray` worst O(n) | 1,024 → 4,096 | 통과 | 통과 | 통과 |
 * | `size` worst O(1) | 1 → 1 | 통과 | 통과 | 통과 |
 */

import { describe, expect, test } from "bun:test";
import { SinglyLinkedList as Reference } from "../linear/singlyLinkedList/_reference/singlyLinkedList";
import {
  type SinglyLinkedListContract,
  singlyLinkedListContract,
} from "../linear/singlyLinkedList/singlyLinkedList.contract";
import { FrontShiftingList } from "./_fixtures/frontShiftingList";
import { HeadOnlyLinkedList } from "./_fixtures/headOnlyLinkedList";
import { TwoPileSequence } from "./_fixtures/twoPileSequence";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
  runContract,
} from "./runContract";

type Surface = SinglyLinkedListContract<number>;

function source(make: () => Surface & { __cost: number }): CostSource<Surface> {
  return { kind: "self-reported", make };
}

const reference = source(() => new Reference<number>());
const headOnly = source(() => new HeadOnlyLinkedList());
const frontShifting = source(() => new FrontShiftingList());
const twoPiles = source(() => new TwoPileSequence());

/** 시나리오마다 `행 (적대적) → 통과 여부`. 이 계약은 행마다 시나리오가 하나라 이름이 겹치지 않는다. */
function verdicts(cost: CostSource<Surface>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of singlyLinkedListContract.scenarios) {
    const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
    found[label] = judgeScenario(
      cost,
      scenario,
      singlyLinkedListContract.grade,
    ).ok;
  }
  return found;
}

const ALL_PASS = {
  prepend: true,
  append: true,
  "removeFirst (적대적)": true,
  toArray: true,
  size: true,
};

// 1. 셋 다 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new HeadOnlyLinkedList(), singlyLinkedListContract, {
  label: "결함 fixture HeadOnlyLinkedList",
});
runContract(() => new FrontShiftingList(), singlyLinkedListContract, {
  label: "결함 fixture FrontShiftingList",
});
runContract(() => new TwoPileSequence(), singlyLinkedListContract, {
  label: "판정 도구 TwoPileSequence",
});

describe("SinglyLinkedList 축3 — 결함 둘이 반대쪽에서 걸린다", () => {
  test("정본은 다섯 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("뒤 끝을 기억하지 않는 사슬은 append 에서만 걸린다", () => {
    expect(verdicts(headOnly)).toEqual({ ...ALL_PASS, append: false });
  });

  test("앞 끝을 배열 첫 칸에 두면 prepend · removeFirst 에서 걸린다", () => {
    expect(verdicts(frontShifting)).toEqual({
      ...ALL_PASS,
      prepend: false,
      "removeFirst (적대적)": false,
    });
  });
});

describe("SinglyLinkedList 한정자 — removeFirst 를 amortized 로 적은 근거", () => {
  const removal = singlyLinkedListContract.scenarios.find((scenario) =>
    scenario.covers.includes("removeFirst"),
  ) as CostScenario<Surface>;

  test("두 무더기 구현은 다섯 시나리오를 전부 통과한다", () => {
    expect(verdicts(twoPiles)).toEqual(ALL_PASS);
  });

  test("같은 시나리오를 한 호출 최대로 재면 두 무더기 구현만 걸린다", () => {
    const asWorst: CostScenario<Surface> = { ...removal, qualifier: "worst" };
    const piles = judgeScenario(twoPiles, asWorst, "invariant");
    expect(piles.ok).toBe(false);
    // 옮기는 호출 하나가 담긴 수를 따라간다.
    for (const point of piles.points)
      expect(point.stat).toBeGreaterThan(point.n);
    expect(judgeScenario(reference, asWorst, "invariant").ok).toBe(true);
  });
});
