/**
 * 하네스 자기시험 — `tree/cartesianTree` 계약(수열이 정하는 트리 · T1-06)의 **지연 구성 계열**.
 *
 * `./runContract.test.ts` 가 이 구조의 결함 셋을 이미 재고 있다(구간을 훑어 나누는 것 · 수열만 들고 다시 훑는 것 · 부분트리마다
 * 길을 복사하는 것). 여기 있는 것은 그 뒤에 온 **넷째 계열**이고, 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` ·
 * `./runContract.sparseTable.test.ts` 머리말과 같다 — 저 공유 파일에 줄을 넣으면 이 카드 범위 밖 가이드의 인용이 통째로
 * 밀린다(불변 사실 106·255).
 *
 * 묶음이 둘이다 — 구성 시점과 다섯 행 `worst` 의 근거(축3), 그리고 값이 전부 옳다는 것(축1). **축2는 돌 것이 없다** —
 * 이 계약의 불변식 절이 「없다」이고 스위트의 `invariants` 가 빈 배열이다(불변 사실 52 ①).
 */

import { describe, expect, test } from "bun:test";
import { CartesianTree as Reference } from "../tree/cartesianTree/_reference/cartesianTree";
import {
  type CartesianTreeContract,
  cartesianTreeContract,
  Walkable,
} from "../tree/cartesianTree/cartesianTree.contract";
import { DeferredCartesianTree } from "./_fixtures/deferredCartesianTree";
import { RescanningCartesianView } from "./_fixtures/rescanningCartesianView";
import { rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = CartesianTreeContract<number> & { __cost: number };
type Maker = (seq: readonly number[]) => Measured;

const makers = {
  reference: (seq) => new Reference<number>(seq),
  deferred: (seq) => new DeferredCartesianTree<number>(seq),
  rescanning: (seq) => new RescanningCartesianView<number>(seq),
} satisfies Record<string, Maker>;

function source(make: Maker): CostSource<Walkable<number>> {
  return { kind: "self-reported", make: () => new Walkable<number>(make) };
}

/** 시나리오 이름 — `runContract.test.ts` 의 `outcomes` 와 같은 규칙으로 적는다. */
function label(scenario: CostScenario<Walkable<number>>): string {
  return `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
}

function verdicts(
  make: Maker,
): Record<string, { ok: boolean; stats: number[] }> {
  const result: Record<string, { ok: boolean; stats: number[] }> = {};
  for (const scenario of cartesianTreeContract.scenarios) {
    const verdict = judgeScenario(source(make), scenario, "complexity");
    result[label(scenario)] = {
      ok: verdict.ok,
      stats: verdict.points.map((point) => point.stat),
    };
  }
  return result;
}

/**
 * 훑기 시나리오 하나를 **한정자만 바꿔** 읽는다. 재는 입력도 걸음도 그대로다.
 *
 * 세 한정자가 보는 통계가 다르다(`./judge.ts` 의 `statistic`) — `worst` 는 단일 호출 최대, `amortized` 는 seed 1 의 시퀀스
 * 평균, `expected` 는 seed 다섯의 시퀀스 평균 중 중앙값이다. **약한 둘을 나란히 박는 이유가 그것이다** — 한쪽만 재고
 * 다른 쪽을 미루어 적으면 통계 정의가 다른 자리에서 틀린다(검토 반려 2026-09-17 · `S3`).
 */
function readAs(
  covers: string,
  adversarial: boolean,
  qualifier: "worst" | "amortized" | "expected",
  make: Maker,
): { ok: boolean; stats: number[] } {
  const base = cartesianTreeContract.scenarios.find(
    (scenario) =>
      scenario.covers.includes(covers) && scenario.adversarial === adversarial,
  );
  if (!base) throw new Error(`시나리오를 못 찾았다: ${covers}`);
  const verdict = judgeScenario(
    source(make),
    { ...base, qualifier },
    "complexity",
  );
  return {
    ok: verdict.ok,
    stats: verdict.points.map((point) => Math.round(point.stat * 100) / 100),
  };
}

function same(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, i) => same(item, b[i]));
  return Object.is(a, b);
}

/** 경계 케이스와 무작위 시퀀스(seed 1 · 500 회)에서 참조 모델과 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit(make: Maker): string | null {
  const byName = new Map(
    cartesianTreeContract.ops.map((op) => [op.name, op] as const),
  );
  for (const edge of cartesianTreeContract.edges) {
    const impl = new Walkable<number>(make);
    const model = cartesianTreeContract.model();
    for (const [index, step] of edge.steps.entries()) {
      const op = byName.get(step.op);
      if (!op) throw new Error(`없는 연산: ${step.op}`);
      const observed = op.onImpl(impl, step.arg);
      const expected = op.onModel(model, step.arg);
      if (!same(observed, expected)) {
        return `${edge.name} / ${index}번째 ${step.op} — 관측 ${JSON.stringify(observed)} / 모델 ${JSON.stringify(expected)}`;
      }
    }
  }
  const rng = rngFrom(1);
  const impl = new Walkable<number>(make);
  const model = cartesianTreeContract.model();
  for (let index = 0; index < 500; index++) {
    const op =
      cartesianTreeContract.ops[
        Math.floor(rng() * cartesianTreeContract.ops.length)
      ];
    if (!op) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (!same(op.onImpl(impl, arg), op.onModel(model, arg))) {
      return `무작위 ${index}번째 ${op.name}`;
    }
  }
  return null;
}

describe("축3 — 구성 시점(불변 사실 52 ③)과 다섯 행 worst 의 근거", () => {
  /**
   * **구성 둘을 통과하고 훑기 둘에서 걸린다.** 생성자가 베끼기뿐이라 구성 시나리오에서는 정본보다 **싸고**(무작위 3,061 ·
   * 오름차순 2,047 대 1,024), 처음 불린 질의 하나가 트리를 통째로 지어 훑기 상한 `O(1)` 을 어긴다.
   *
   * **`inOrder` 시나리오는 통과한다** — 그 행의 상한이 `O(n)` 이라 지은 몫이 계급 안에 들어온다(정본 2,048 의 두 배).
   * 걸리는 자리가 훑기 **둘 다**인 것은 `range-query/sparseTable` 선례(질의 시나리오 하나에서만 걸림)와 갈리는 자리다.
   */
  test("짓기를 첫 질의로 미루는 구현은 구성 둘을 통과하고 훑기 둘에서 걸린다", () => {
    expect(verdicts(makers.deferred)).toEqual({
      constructor: { ok: true, stats: [1024, 4096, 16384] },
      "constructor (적대적)": { ok: true, stats: [1024, 4096, 16384] },
      value·left·right: { ok: false, stats: [3063, 12276, 49133] },
      "value·left·right (적대적)": {
        ok: false,
        stats: [2049, 8193, 32769],
      },
      "inOrder (적대적)": { ok: true, stats: [4095, 16383, 65535] },
    });
  }, 120_000);

  /**
   * **이 계열은 약한 읽기 둘을 실제로 지킨다 — 해상도 아래라 통과하는 것이 아니다.**
   *
   * `range-query/sparseTable` 에서는 같은 계열의 호출 평균이 20.02 · 24.01 · 28 로 **자랐고**(구성이 자리 수 × 층 수라
   * 로그를 따른다) 그것이 축3 해상도 아래라 통과했다(불변 사실 53·328). 이쪽은 구성이 선형인데 그것을 나눠 갚을 걸음이
   * n 개라 평균이 **상수로 고정된다.** 그러니 이 계약에서 그 계열을 배제하는 것은 `worst` 하나다.
   *
   * **`amortized` 와 `expected` 를 나란히 박는다.** 둘은 보는 통계가 달라(seed 1 의 평균 / seed 다섯의 평균 중앙값) 한쪽
   * 값에서 다른 쪽을 미루어 적을 수 없다. 여기 둘 다 재 두는 것이 「한쪽만 재고 다른 쪽을 단정하는 것」을 막는 자리다.
   *
   * **통과·실패 모양만으로는 `rescanningCartesianView` 와 구별되지 않는다**(둘 다 구성 둘 통과 · 훑기 둘 실패). 갈리는
   * 자리가 호출 평균이다 — 수열만 들고 물을 때마다 다시 훑는 쪽은 평균으로도, 중앙값으로도 걸린다. 같은 행을 겨눈
   * 결함이 둘일 때 무엇이 더 잡히는지는 통계를 갈라야 보인다(불변 사실 118 과 같은 자리).
   */
  test("짓기를 미루는 계열은 worst 로만 걸리고 amortized · expected 로는 통과한다", () => {
    expect({
      deferredWorst: readAs("value", true, "worst", makers.deferred),
      deferredAverage: readAs("value", true, "amortized", makers.deferred),
      deferredExpected: readAs("value", true, "expected", makers.deferred),
      rescanningAverage: readAs("value", true, "amortized", makers.rescanning),
      rescanningExpected: readAs("value", true, "expected", makers.rescanning),
      referenceAverage: readAs("value", true, "amortized", makers.reference),
      referenceExpected: readAs("value", true, "expected", makers.reference),
    }).toEqual({
      deferredWorst: { ok: false, stats: [2049, 8193, 32769] },
      deferredAverage: { ok: true, stats: [4.51, 4.5, 4.5] },
      deferredExpected: { ok: true, stats: [4.5, 4.5, 4.5] },
      rescanningAverage: {
        ok: false,
        stats: [1285.89, 5129.45, 20495.46],
      },
      rescanningExpected: {
        ok: false,
        stats: [1277.07, 5122.87, 20478.39],
      },
      referenceAverage: { ok: true, stats: [2.51, 2.5, 2.5] },
      referenceExpected: { ok: true, stats: [2.5, 2.5, 2.5] },
    });
  }, 300_000);

  /** 무작위 수열에서도 같은 갈림이다 — 사슬이라서 나오는 결과가 아니라는 것을 이 자리가 고정한다. */
  test("무작위 수열에서도 약한 읽기 둘은 통과하고 최대만 걸린다", () => {
    expect({
      deferredWorst: readAs("value", false, "worst", makers.deferred),
      deferredAverage: readAs("value", false, "amortized", makers.deferred),
      deferredExpected: readAs("value", false, "expected", makers.deferred),
      rescanningAverage: readAs("value", false, "amortized", makers.rescanning),
      rescanningExpected: readAs("value", false, "expected", makers.rescanning),
      referenceAverage: readAs("value", false, "amortized", makers.reference),
      referenceExpected: readAs("value", false, "expected", makers.reference),
    }).toEqual({
      deferredWorst: { ok: false, stats: [3063, 12276, 49133] },
      deferredAverage: { ok: true, stats: [5.19, 5.16, 5.13] },
      deferredExpected: { ok: true, stats: [5.17, 5.16, 5.15] },
      rescanningAverage: { ok: false, stats: [578.67, 1551.29, 5108.18] },
      rescanningExpected: { ok: false, stats: [471.86, 1562.69, 5785.64] },
      referenceAverage: { ok: true, stats: [2.2, 2.16, 2.14] },
      referenceExpected: { ok: true, stats: [2.19, 2.16, 2.15] },
    });
  }, 300_000);
});

describe("축1 — 값은 전부 옳다(축3만 어기는 계열이어야 근거가 된다)", () => {
  /**
   * **이것이 서지 않으면 이 fixture 는 `worst` 근거의 증거가 아니다.** 답이 갈리는 구현은 「배제해도 잃는 것이 없는
   * 계열」이 아니라 그냥 틀린 구현이고, 계약이 그것을 막는 자리는 한정자가 아니라 축1이다.
   */
  test("지연 구성 fixture 가 경계 케이스 여덟과 무작위 시퀀스를 정본과 같게 답한다", () => {
    expect(firstBehaviorSplit(makers.deferred)).toBeNull();
    expect(firstBehaviorSplit(makers.reference)).toBeNull();
  });
});
