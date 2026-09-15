/**
 * 하네스 자기시험 — `probabilistic/countMinSketch` 계약 앞에 선 정본 · 결함 셋 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는 가이드들이
 * 밀린다(불변 사실 106 · 215).
 *
 * **오차 판정은 `probabilistic/bloomFilter` 가 세운 방식을 그대로 쓴다(2026-09-15 유저 결정).** 보는 것은 넷이다.
 *
 * 1. **퇴화 구현을 잡는 것은 오차 판정 하나뿐이다.** `TotalSumSketch`(어느 원소든 증분 전체의 합)는 결정적 경계 다섯과 축3을
 *    통과하고 오차 판정 경계의 첫 단계와 무작위 시퀀스의 첫 판정 연산에서 걸린다 — 넣지 않은 원소의 추정이 전부 N 이다.
 * 2. **판정이 실패 확률 δ 를 읽는다.** `SingleRowSketch`(줄 하나)는 δ = 0.1 판정을 통과하고 δ = 0.01 에서 걸린다. 탐침 50 회에서
 *    한계(128)를 넘는 추정의 수가 (ε, δ) = (0.1, 0.1) 19 ~ 86 · (0.01, 0.1) 45 ~ 69 · (0.02, 0.05) 96 ~ 143 · (0.1, 0.01) 397 ~ 794 ·
 *    (0.01, 0.01) 496 ~ 641 이었고, (0.001, 0.001) 은 5 회에 5,568 ~ 6,028 이었다 — 무작위 시퀀스의 가벼운 판정에 δ 0.01 을 둔 근거다.
 * 3. **여유 2 가 경계 구현을 지킨다.** `BoundaryOvercountSketch`(원소마다 확률 δ 로 한계를 딱 넘는 정확한 사전)가 축1 전부를
 *    통과한다. 탐침 — 네 모양((ε, δ) = (0.1, 0.1) · (0.01, 0.1) · (0.1, 0.02) · (0.02, 0.05)) × seed 2,000 = 판정 8,000 회에서 넘은 수가
 *    39 ~ 103 이었고, 한계를 64(여유 1)로 두면 3,731 회 · 80(1.25)이면 161 회 · 96(1.5)이면 1 회 · **128(2)이면 0 회** 떨어졌다.
 *    같은 8,000 회에서 **정본은 0 ~ 7** 이었다(여유 1 에서도 0 회). 정본의 수는 무작위라 실행마다 다르다 — 범위만 적는다
 *    (`docs/ORD-006-conventions.md` 「무작위를 쓰는 정본과 재현성」 규칙 3). 블룸 필터의 같은 탐침(3,787 · 165 · 1 · 0)과 거의 같다
 *    — 원소마다 확률로 넘는 모양이 같기 때문이다.
 * 4. **정확하게 세는 구현은 오차를 전부 통과하고 비용 행에서만 걸린다.** `ScanningCounterList`(원소 · 빈도 쌍을 늘어놓고 훑기)는
 *    과대 추정이 0 이라 축1 전부를 통과하고 `update` · `estimate` 시나리오에서 걸린다 — 계약이 공간을 말하지 않으므로 정확함은
 *    계약 안이고, 어기는 것은 서로 다른 원소 수에 비례하는 비용이다.
 *
 * | 판정 (n = 1,024 → 4,096 · 축1) | 정본 | `TotalSum` | `SingleRow` | `ScanningCounterList` | `BoundaryOvercount` |
 * |---|---|---|---|---|---|
 * | `update` expected O(1) | 통과 | 통과 | 통과 | **걸림** | — |
 * | `estimate` expected O(1) | 통과 | 통과 | 통과 | **걸림** | — |
 * | 축1 경계 — 결정적인 다섯 | 통과 | 통과 | 통과 | 통과 | 통과 |
 * | 축1 경계 — 오차 판정 셋 | 통과 | **걸림**(첫 단계) | **걸림**(둘째 단계) | 통과 | 통과 |
 * | 축1 무작위 500 회 | 통과 | **걸림** | **걸림** | 통과 | 통과 |
 *
 * 축3 수치는 아래 단정의 주석에 있다. `BoundaryOvercountSketch` 는 언어 `Map` 에 담아 계측기가 없다(축1 전용).
 */

import { describe, expect, test } from "bun:test";
import { CountMinSketch as Reference } from "../probabilistic/countMinSketch/_reference/countMinSketch";
import {
  countMinSketchContract,
  SizedSketch,
  type SketchMaker,
} from "../probabilistic/countMinSketch/countMinSketch.contract";
import { BoundaryOvercountSketch } from "./_fixtures/boundaryOvercountSketch";
import { ScanningCounterList } from "./_fixtures/scanningCounterList";
import { SingleRowSketch } from "./_fixtures/singleRowSketch";
import { TotalSumSketch } from "./_fixtures/totalSumSketch";
import { rngFrom } from "./judge";
import { type CostSource, judgeScenario, runContract } from "./runContract";

function source(make: SketchMaker): CostSource<SizedSketch> {
  return { kind: "self-reported", make: () => new SizedSketch(make) };
}

const reference: SketchMaker = (e, d) => new Reference(e, d);
const totalSum: SketchMaker = (e, d) => new TotalSumSketch(e, d);
const singleRow: SketchMaker = (e, d) => new SingleRowSketch(e, d);
const scanning: SketchMaker = (e, d) => new ScanningCounterList(e, d);

/** 시나리오마다 `행 → 통과 여부`. 이 계약은 행마다 시나리오가 하나라 이름이 겹치지 않는다. */
function verdicts(make: SketchMaker): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of countMinSketchContract.scenarios) {
    found[scenario.covers.join("·")] = judgeScenario(
      source(make),
      scenario,
      countMinSketchContract.grade,
    ).ok;
  }
  return found;
}

const byName = new Map(countMinSketchContract.ops.map((op) => [op.name, op]));

/** 경계 케이스 하나를 돌려 처음 어긋난 차례를 돌려준다. 다 맞으면 `null`. `runContract` 축1과 같은 대조다. */
function edgeMismatch(make: SketchMaker, edgeName: string): number | null {
  const edge = countMinSketchContract.edges.find((e) => e.name === edgeName);
  if (edge === undefined) throw new Error(`경계 케이스가 없다: ${edgeName}`);
  const impl = new SizedSketch(make);
  const model = countMinSketchContract.model();
  for (const [index, step] of edge.steps.entries()) {
    const op = byName.get(step.op);
    if (op === undefined) throw new Error(`연산이 없다: ${step.op}`);
    if (op.onImpl(impl, step.arg) !== op.onModel(model, step.arg)) return index;
  }
  return null;
}

/** 무작위 교차검증(seed 1 · 500 회)에서 처음 어긋난 연산의 이름. 다 맞으면 `null`. */
function randomMismatch(make: SketchMaker): string | null {
  const rng = rngFrom(1);
  const impl = new SizedSketch(make);
  const model = countMinSketchContract.model();
  const ops = countMinSketchContract.ops;
  for (let index = 0; index < 500; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (op.onImpl(impl, arg) !== op.onModel(model, arg)) return op.name;
  }
  return null;
}

const DETERMINISTIC_EDGES = countMinSketchContract.edges
  .map((e) => e.name)
  .filter((name) => !name.startsWith("오차 판정"));
const ERROR_EDGE = countMinSketchContract.edges
  .map((e) => e.name)
  .find((name) => name.startsWith("오차 판정")) as string;

const ALL_PASS = { update: true, estimate: true };

// 판정 도구와 정확한 목록은 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(
  () => new SizedSketch((e, d) => new BoundaryOvercountSketch(e, d)),
  countMinSketchContract,
  { label: "판정 도구 fixture BoundaryOvercountSketch" },
);
runContract(() => new SizedSketch(scanning), countMinSketchContract, {
  label: "결함 fixture ScanningCounterList",
});

describe("CountMinSketch 축1 — 퇴화 구현을 잡는 것은 오차 판정 하나뿐이다", () => {
  test("증분 전체의 합을 돌려주는 구현은 결정적인 경계 다섯을 전부 통과한다", () => {
    expect(DETERMINISTIC_EDGES).toHaveLength(5);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(totalSum, name)]).toEqual([name, null]);
  });

  test("그 구현은 오차 판정 경계의 첫 단계에서 걸리고, 무작위 시퀀스에서도 판정 연산이 잡는다", () => {
    expect(edgeMismatch(totalSum, ERROR_EDGE)).toBe(0);
    expect(randomMismatch(totalSum)).toBe("overestimateCheck");
  });

  test("축3은 그 구현을 통과시킨다 — 호출마다 상수다", () => {
    expect(verdicts(totalSum)).toEqual(ALL_PASS);
  });
});

describe("CountMinSketch 축1 — 오차 판정이 실패 확률을 읽는다", () => {
  test("줄을 하나만 두는 구현은 결정적인 다섯을 통과하고 δ = 0.1 판정을 통과한 뒤 δ = 0.01 에서 걸린다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(singleRow, name)]).toEqual([name, null]);
    expect(edgeMismatch(singleRow, ERROR_EDGE)).toBe(1);
    expect(randomMismatch(singleRow)).toBe("overestimateCheck");
  });

  test("그 구현도 축3은 통과한다", () => {
    expect(verdicts(singleRow)).toEqual(ALL_PASS);
  });
});

describe("CountMinSketch 축3 — 비용 행", () => {
  test("정본은 두 시나리오를 통과한다", () => {
    // 줄 5 × (글자 10 + 칸 1): 55.00 → 55.00 둘 다. 증분 전체의 합은 1.00 → 1.00, 줄 하나는 11.00 → 11.00.
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("원소와 빈도를 늘어놓고 훑는 정확한 구현은 두 시나리오에서 모두 걸린다", () => {
    // update 513.50 → 2,049.50 · estimate 768.50 → 3,072.50(넣은 원소와 넣지 않은 원소를 번갈아 묻는다).
    expect(verdicts(scanning)).toEqual({ update: false, estimate: false });
  });
});
