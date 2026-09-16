/**
 * 하네스 자기시험 — `probabilistic/countMinSketch` 계약 앞에 선 정본 · 결함 셋 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는 가이드들이
 * 밀린다(불변 사실 106 · 215).
 *
 * **오차는 이 파일이 보지 않는다 — 통계 판정 자기시험 `./runTrials.countMinSketch.test.ts` 로 옮겼다(원칙 B, `S24`).** 스케치 하나에서
 * 넣지 않은 원소를 모아 세던 축1 연산(`overestimateCheck`)과 그 경계 케이스를 계약 스위트에서 걷어냈다 — 한 스케치의 원소 답은 서로
 * 독립이 아니다(`docs/ORD-006-conventions.md` 「원칙 B」 B3 · B5). 여기 남은 것은 결정적 쪽과 축3 이다. 보는 것은 둘이다.
 *
 * 1. **퇴화 · 실패 확률을 읽지 않는 구현은 결정적 쪽을 공짜로 지킨다.** `TotalSumSketch`(어느 원소든 증분 전체의 합) ·
 *    `SingleRowSketch`(줄 하나)는 결정적 경계 다섯 · 무작위 시퀀스 · 축3을 전부 통과한다 — 잡는 것은 통계 판정뿐이다.
 * 2. **정확하게 세는 구현은 오차를 전부 통과하고 비용 행에서만 걸린다.** `ScanningCounterList`(원소 · 빈도 쌍을 늘어놓고 훑기)는
 *    과대 추정이 0 이라 축1 전부를 통과하고 `update` · `estimate` 시나리오에서 걸린다 — 계약이 공간을 말하지 않으므로 정확함은
 *    계약 안이고, 어기는 것은 서로 다른 원소 수에 비례하는 비용이다.
 *
 * | 판정 (n = 1,024 → 4,096 · 축1) | 정본 | `TotalSum` | `SingleRow` | `ScanningCounterList` | `BoundaryOvercount` |
 * |---|---|---|---|---|---|
 * | `update` expected O(1) | 통과 | 통과 | 통과 | **걸림** | — |
 * | `estimate` expected O(1) | 통과 | 통과 | 통과 | **걸림** | — |
 * | 축1 경계 — 결정적인 다섯 | 통과 | 통과 | 통과 | 통과 | 통과 |
 * | 축1 무작위 500 회 | 통과 | 통과 | 통과 | 통과 | 통과 |
 * | 축1 통계 판정(`./runTrials.countMinSketch.test.ts`) | 통과 | **걸림** | **걸림**((0.1, 0.01)) | — | — |
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

const DETERMINISTIC_EDGES = countMinSketchContract.edges.map((e) => e.name);

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

describe("CountMinSketch 축1 — 퇴화 · 실패 확률을 읽지 않는 구현은 결정적 쪽을 공짜로 지킨다", () => {
  test("증분 전체의 합을 돌려주는 구현은 결정적인 경계 다섯과 무작위 시퀀스를 전부 통과한다 — 잡는 것은 통계 판정뿐이다", () => {
    expect(DETERMINISTIC_EDGES).toHaveLength(5);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(totalSum, name)]).toEqual([name, null]);
    expect(randomMismatch(totalSum)).toBeNull();
  });

  test("줄을 하나만 두는 구현도 결정적인 다섯과 무작위 시퀀스를 통과한다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(singleRow, name)]).toEqual([name, null]);
    expect(randomMismatch(singleRow)).toBeNull();
  });

  test("축3은 두 구현을 통과시킨다", () => {
    expect(verdicts(totalSum)).toEqual(ALL_PASS);
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
