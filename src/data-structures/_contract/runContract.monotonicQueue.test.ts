/**
 * 하네스 자기시험 — `linear/monotonicQueue` 계약 앞에 선 정본 · 결함 셋 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는
 * 가이드들이 밀린다(불변 사실 106 · 215).
 *
 * 보는 것은 넷이다.
 *
 * 1. **다섯 다 동작상 옳다.** 축1 · 축2를 전부 통과한다. 이 계약에서 다섯을 가르는 것은 값이 아니라 비용이다.
 * 2. **결함 셋이 축3에서 서로 다른 행에 걸린다** — 헤더 검증 등급 문단의 자명한 길 셋이 각자 놓는 행이다.
 *    행 단위로 적는다(불변 사실 84). 걸리지 않는 행에서는 정본과 같은 계급이다(불변 사실 62).
 * 3. **넣기 · 빼기를 둘 다 `amortized` 로 적은 근거.** 같은 시나리오를 한 호출 최대로 다시 재면 넣기에서는
 *    정본(후보를 버리는 계열)이, 빼기에서는 두 무더기 구현이 걸리고 반대쪽은 통과한다(불변 사실 195 의
 *    방식). 정본은 빼기에서도 걸리는데 까닭이 다르다 — 줄을 되돌려 쓰느라 옮기는 호출이 있다(`linear/queue`
 *    정본과 같은 자리이고, 그 계열도 `amortized` 가 살린다).
 * 4. **최솟값을 묻는 큐는 이 계약이다.** 같은 정본에 뒤집은 비교자를 주입하고, 참조 모델이 최솟값을 답하도록
 *    같은 함수로 지은 스위트를 축1로 돌린다(헤더 주입 정책).
 *
 * | 시나리오 (n = 1,024 → 4,096 → 16,384) | 정본 | `ScanningMaxQueue` | `RescanningMaxQueue` | `RaisingSuffixMaxQueue` | `TwoStackMaxQueue` |
 * |---|---|---|---|---|---|
 * | `enqueue` amortized O(1) (적대적) | 3.50 → 3.50 → 3.50 | 통과 | 통과 | **걸림** 769.50 → 3,073.50 → 12,289.50 | 통과 2.00 |
 * | ↳ 한 호출 최대로 다시 재면 | 514 → 2,050 → 8,194 **걸림** | — | — | — | 2 → 2 → 2 통과 |
 * | `dequeue` amortized O(1) (적대적) | 4.00 → 4.00 → 4.00 | 통과 | **걸림** 1,025 → 4,097 → 16,385 | 통과 | 통과 3.00 |
 * | ↳ 한 호출 최대로 다시 재면 | 1,026 → 4,098 → 16,386 **걸림**(되돌려 쓰기) | — | — | — | 2,049 → 8,193 → 32,769 **걸림** |
 * | `max` worst O(1) | 1 → 1 → 1 | **걸림** 2,046 → 8,190 → 32,766 | 통과 | 통과 | 통과 |
 * | `front` worst O(1) | 1 → 1 → 1 | 통과 | 통과 | 통과 | 통과 |
 * | 축1 · 축2 | 통과 | 통과 | 통과 | 통과 | 통과 |
 *
 * `max` 시나리오가 빼기 뒤에 묻는 이유의 실측 — 최댓값이 나가면 표시만 하고 `max` 에서 몰아 다시 훑는 구현(탐침,
 * 저장소에 두지 않았다)이 그 시나리오에서 2,047 → 8,191 → 32,767 로 걸리고 나머지 셋은 통과한다.
 */

import { describe, expect, test } from "bun:test";
import { MonotonicQueue as Reference } from "../linear/monotonicQueue/_reference/monotonicQueue";
import {
  ascending,
  descending,
  type MonotonicQueueContract,
  monotonicQueueContract,
  monotonicQueueSpec,
} from "../linear/monotonicQueue/monotonicQueue.contract";
import { RaisingSuffixMaxQueue } from "./_fixtures/raisingSuffixMaxQueue";
import { RescanningMaxQueue } from "./_fixtures/rescanningMaxQueue";
import { ScanningMaxQueue } from "./_fixtures/scanningMaxQueue";
import { TwoStackMaxQueue } from "./_fixtures/twoStackMaxQueue";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
  runContract,
} from "./runContract";

type Surface = MonotonicQueueContract<number>;

function source(make: () => Surface & { __cost: number }): CostSource<Surface> {
  return { kind: "self-reported", make };
}

const reference = source(() => new Reference<number>(ascending));
const scanning = source(() => new ScanningMaxQueue(ascending));
const rescanning = source(() => new RescanningMaxQueue(ascending));
const raising = source(() => new RaisingSuffixMaxQueue(ascending));
const twoStacks = source(() => new TwoStackMaxQueue(ascending));

/** 시나리오마다 `행 (적대적) → 통과 여부`. 이 계약은 이름이 겹치는 시나리오가 없다. */
function verdicts(cost: CostSource<Surface>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of monotonicQueueContract.scenarios) {
    const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
    found[label] = judgeScenario(
      cost,
      scenario,
      monotonicQueueContract.grade,
    ).ok;
  }
  return found;
}

const ALL_PASS = {
  "enqueue (적대적)": true,
  "dequeue (적대적)": true,
  max: true,
  front: true,
};

function scenarioOf(row: string): CostScenario<Surface> {
  const found = monotonicQueueContract.scenarios.find((scenario) =>
    scenario.covers.includes(row),
  );
  if (found === undefined) throw new Error(`${row} 시나리오가 없다`);
  return found;
}

/** 같은 시나리오를 한 호출 최대 통계로 다시 잰다. 등급(엄격도)은 그대로다. */
function asWorst(cost: CostSource<Surface>, row: string) {
  return judgeScenario(
    cost,
    { ...scenarioOf(row), qualifier: "worst" },
    monotonicQueueContract.grade,
  );
}

// 1. 다섯 다 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new ScanningMaxQueue(ascending), monotonicQueueContract, {
  label: "결함 fixture ScanningMaxQueue",
});
runContract(() => new RescanningMaxQueue(ascending), monotonicQueueContract, {
  label: "결함 fixture RescanningMaxQueue",
});
runContract(
  () => new RaisingSuffixMaxQueue(ascending),
  monotonicQueueContract,
  { label: "결함 fixture RaisingSuffixMaxQueue" },
);
runContract(() => new TwoStackMaxQueue(ascending), monotonicQueueContract, {
  label: "판정 도구 TwoStackMaxQueue",
});

// 4. 뒤집은 비교자 — 같은 정본이 최솟값을 답한다. 참조 모델도 같은 비교자로 짓는다.
runContract(
  () => new Reference<number>(descending),
  monotonicQueueSpec(descending, "MonotonicQueue(뒤집은 비교자)"),
  { label: "정본 뒤집은 비교자" },
);

describe("MonotonicQueue 축3 — 결함 셋이 서로 다른 행에서 걸린다", () => {
  test("정본은 네 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("최댓값을 매번 훑는 구현은 max 에서만 걸린다", () => {
    expect(verdicts(scanning)).toEqual({ ...ALL_PASS, max: false });
  });

  test("최댓값 하나만 들고 있는 구현은 dequeue 에서만 걸린다", () => {
    expect(verdicts(rescanning)).toEqual({
      ...ALL_PASS,
      "dequeue (적대적)": false,
    });
  });

  test("뒤쪽 최댓값을 올려 적는 구현은 enqueue 에서만 걸린다", () => {
    expect(verdicts(raising)).toEqual({
      ...ALL_PASS,
      "enqueue (적대적)": false,
    });
  });
});

describe("MonotonicQueue 한정자 — enqueue · dequeue 를 둘 다 amortized 로 적은 근거", () => {
  test("두 무더기 구현은 네 시나리오를 전부 통과한다", () => {
    expect(verdicts(twoStacks)).toEqual(ALL_PASS);
  });

  test("enqueue 를 한 호출 최대로 재면 정본만 걸린다", () => {
    const canonical = asWorst(reference, "enqueue");
    expect(canonical.ok).toBe(false);
    // 내림차순 절반 뒤 첫 큰 값이 절반을 버린다.
    for (const point of canonical.points)
      expect(point.stat).toBeGreaterThan(point.n / 2);
    expect(asWorst(twoStacks, "enqueue").ok).toBe(true);
  });

  test("dequeue 를 한 호출 최대로 재면 두 무더기 구현이 걸린다", () => {
    const piles = asWorst(twoStacks, "dequeue");
    expect(piles.ok).toBe(false);
    // 첫 빼기가 넣는 무더기 전부를 옮긴다.
    for (const point of piles.points)
      expect(point.stat).toBeGreaterThan(point.n);
  });
});
