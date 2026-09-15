/**
 * 하네스 자기시험 — `probabilistic/hyperLogLog` 계약 앞에 선 정본 · 결함 다섯 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는 가이드들이
 * 밀린다(불변 사실 106 · 215).
 *
 * **오차는 이 파일이 보지 않는다 — 통계 판정 자기시험 `./runTrials.hyperLogLog.test.ts` 로 옮겼다(원칙 B, `S24`).** 한 실행 안에서
 * 인스턴스를 모아 세던 축1 연산(`errorCheck`)과 그 경계 케이스를 계약 스위트에서 걷어냈다 — 같은 실행의 인스턴스는 해시를 함께 써
 * 독립이 아니다(`docs/ORD-006-conventions.md` 「원칙 B」 B3 · B5). 여기 남은 것은 결정적 쪽과 축3 이다. 보는 것은 넷이다.
 *
 * 1. **퇴화 구현은 결정적 쪽을 공짜로 지킨다.** `ZeroSketch`(추정이 늘 0)는 결정적 경계 다섯 · 무작위 시퀀스 · 축3을 전부 통과한다 —
 *    잡는 것은 통계 판정뿐이다.
 * 2. **넣은 호출 수를 세는 구현은 결정적 쪽이 잡는다.** `CallCountSketch` 는 결정적 경계 다섯에서 모두 걸린다 — 중복 경계는
 *    둘째 단계(같은 원소를 다시 넣자 1 → 2), 합치기 경계는 두 쪽에 같은 원소가 있는 첫 합치기(다섯째 단계)다. 무작위 시퀀스(seed 1)는
 *    20 번째 호출(`mergeSelf`)에서 잡는다. 이 구현에는 무작위가 없어 그 자리가 실행마다 같다.
 * 3. **목표를 읽지 않는 구현 · 확률 문장을 지키며 몰리는 구현 · 해시를 고정한 구현은 축1 결정적 쪽을 전부 통과한다.**
 *    `FixedPrecisionSketch`(늘 자리 16 개) · `BoundaryErrorSketch`(집합마다 확률 δ 로 한계를 딱 넘음) — 앞은 통계 판정이 잡고 뒤는
 *    통계 판정도 통과한다(`./runTrials.hyperLogLog.test.ts`).
 * 4. **합치기의 상한이 정확한 구현을 가른다.** `ExactSetSketch`(언어 `Set`)는 축1 전부와 `add` · `count` 를 통과하고 `merge` 에서만
 *    걸린다. `AppendListSketch`(중복째 붙이고 물을 때 센다)는 `add` 를 통과하고 `count` · `merge` 에서 걸린다.
 *
 * | 판정 (n = 1,024 → 4,096 · 축1) | 정본 | `Zero` | `CallCount` | `FixedPrecision` | `ExactSet` | `AppendList` | `BoundaryError` |
 * |---|---|---|---|---|---|---|---|
 * | `add` expected O(1) | 통과 | 통과 | 통과 | 통과 | 통과 | 통과 | — |
 * | `count` expected O(1) | 통과 | 통과 | 통과 | 통과 | 통과 | **걸림** | — |
 * | `merge` expected O(1) | 통과 | 통과 | 통과 | 통과 | **걸림** | **걸림** | — |
 * | 축1 경계 — 결정적인 다섯 | 통과 | 통과 | **걸림**(다섯 모두) | 통과 | 통과 | 통과 | 통과 |
 * | 축1 무작위 500 회 | 통과 | 통과 | **걸림** | 통과 | 통과 | 통과 | 통과 |
 * | 축1 통계 판정(`./runTrials.hyperLogLog.test.ts`) | 통과 | **걸림** | **걸림** | **걸림** | — | — | — |
 *
 * 축3 수치는 아래 단정의 주석에 있다. `BoundaryErrorSketch` 는 언어 `Set` 에 담아 계측기가 없다(축1 전용).
 */

import { describe, expect, test } from "bun:test";
import { HyperLogLog as Reference } from "../probabilistic/hyperLogLog/_reference/hyperLogLog";
import {
  hyperLogLogContract,
  type SketchMaker,
  SketchPair,
} from "../probabilistic/hyperLogLog/hyperLogLog.contract";
import { AppendListSketch } from "./_fixtures/appendListSketch";
import { BoundaryErrorSketch } from "./_fixtures/boundaryErrorSketch";
import { CallCountSketch } from "./_fixtures/callCountSketch";
import { ExactSetSketch } from "./_fixtures/exactSetSketch";
import { FixedPrecisionSketch } from "./_fixtures/fixedPrecisionSketch";
import { ZeroSketch } from "./_fixtures/zeroSketch";
import { rngFrom } from "./judge";
import { type CostSource, judgeScenario, runContract } from "./runContract";

function source(make: SketchMaker): CostSource<SketchPair> {
  return { kind: "self-reported", make: () => new SketchPair(make) };
}

const reference: SketchMaker = (e, d) => new Reference(e, d);
const zero: SketchMaker = (e, d) => new ZeroSketch(e, d);
const callCount: SketchMaker = (e, d) => new CallCountSketch(e, d);
const fixedPrecision: SketchMaker = (e, d) => new FixedPrecisionSketch(e, d);
const exactSet: SketchMaker = (e, d) => new ExactSetSketch(e, d);
const appendList: SketchMaker = (e, d) => new AppendListSketch(e, d);

/** 시나리오마다 `행 → 통과 여부`. 이 계약은 행마다 시나리오가 하나라 이름이 겹치지 않는다. */
function verdicts(make: SketchMaker): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of hyperLogLogContract.scenarios) {
    found[scenario.covers.join("·")] = judgeScenario(
      source(make),
      scenario,
      hyperLogLogContract.grade,
    ).ok;
  }
  return found;
}

const byName = new Map(hyperLogLogContract.ops.map((op) => [op.name, op]));

/** 경계 케이스 하나를 돌려 처음 어긋난 차례를 돌려준다. 다 맞으면 `null`. `runContract` 축1과 같은 대조다. */
function edgeMismatch(make: SketchMaker, edgeName: string): number | null {
  const edge = hyperLogLogContract.edges.find((e) => e.name === edgeName);
  if (edge === undefined) throw new Error(`경계 케이스가 없다: ${edgeName}`);
  const impl = new SketchPair(make);
  const model = hyperLogLogContract.model();
  for (const [index, step] of edge.steps.entries()) {
    const op = byName.get(step.op);
    if (op === undefined) throw new Error(`연산이 없다: ${step.op}`);
    if (op.onImpl(impl, step.arg) !== op.onModel(model, step.arg)) return index;
  }
  return null;
}

/** 무작위 교차검증(seed 1 · 500 회)에서 처음 어긋난 `[차례, 연산 이름]`. 다 맞으면 `null`. */
function randomMismatch(make: SketchMaker): [number, string] | null {
  const rng = rngFrom(1);
  const impl = new SketchPair(make);
  const model = hyperLogLogContract.model();
  const ops = hyperLogLogContract.ops;
  for (let index = 0; index < 500; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (op.onImpl(impl, arg) !== op.onModel(model, arg))
      return [index, op.name];
  }
  return null;
}

const EDGE_NAMES = hyperLogLogContract.edges.map((e) => e.name);
const DETERMINISTIC_EDGES = EDGE_NAMES;
/** 결정적 경계의 이름을 앞머리로 찾는다. */
function edgeNamed(prefix: string): string {
  const found = EDGE_NAMES.find((name) => name.startsWith(prefix));
  if (found === undefined) throw new Error(`경계 케이스가 없다: ${prefix}`);
  return found;
}

const ALL_PASS = { add: true, count: true, merge: true };

// 판정 도구와 정확한 두 구현 · 자리를 고정한 구현은 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(
  () => new SketchPair((e, d) => new BoundaryErrorSketch(e, d)),
  hyperLogLogContract,
  { label: "판정 도구 fixture BoundaryErrorSketch" },
);
runContract(() => new SketchPair(exactSet), hyperLogLogContract, {
  label: "결함 fixture ExactSetSketch",
});
runContract(() => new SketchPair(appendList), hyperLogLogContract, {
  label: "결함 fixture AppendListSketch",
});

describe("HyperLogLog 축1 — 퇴화 구현은 결정적 쪽을 공짜로 지킨다", () => {
  test("추정이 늘 0 인 구현은 결정적인 경계 다섯과 무작위 시퀀스를 전부 통과한다 — 잡는 것은 통계 판정뿐이다", () => {
    expect(DETERMINISTIC_EDGES).toHaveLength(5);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(zero, name)]).toEqual([name, null]);
    expect(randomMismatch(zero)).toBeNull();
  });

  test("축3은 그 구현을 통과시킨다 — 호출마다 상수다", () => {
    // 세 행 모두 1.00 → 1.00.
    expect(verdicts(zero)).toEqual(ALL_PASS);
  });
});

describe("HyperLogLog 축1 — 넣은 호출 수를 세는 구현은 결정적 쪽이 잡는다", () => {
  test("같은 원소를 다시 넣는 둘째 단계 · 두 쪽에 같은 원소가 있는 첫 합치기에서 걸리고, 결정적 경계 다섯 모두에서 걸린다", () => {
    expect(edgeMismatch(callCount, edgeNamed("이미 들어온 원소"))).toBe(1);
    expect(edgeMismatch(callCount, edgeNamed("합치기는 새 인스턴스"))).toBe(4);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(callCount, name) !== null]).toEqual([
        name,
        true,
      ]);
  });

  test("무작위 시퀀스도 그 구현을 잡는다 — 무작위가 없어 자리가 늘 같다", () => {
    expect(randomMismatch(callCount)).toEqual([19, "mergeSelf"]);
  });
});

describe("HyperLogLog 축1 — 목표를 읽지 않는 구현은 결정적 쪽을 통과한다", () => {
  test("자리 수를 고정한 구현은 결정적인 다섯 · 무작위 시퀀스를 통과한다 — 통계 판정이 잡는다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(fixedPrecision, name)]).toEqual([name, null]);
    expect(randomMismatch(fixedPrecision)).toBeNull();
  });

  test("그 구현도 축3은 통과한다", () => {
    // add 21.00 → 21.00 · count 16.00 → 16.00 · merge 16.00 → 16.00.
    expect(verdicts(fixedPrecision)).toEqual(ALL_PASS);
  });
});

describe("HyperLogLog 축3 — 비용 행", () => {
  test("정본은 세 시나리오를 통과한다", () => {
    // 자리 128 개(ε = δ = 0.3): add 21.00 → 21.00(글자 10 × 줄 2 + 자리 1) · count 128.00 → 128.00 · merge 128.00 → 128.00.
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("정확한 집합은 합치기에서만 걸린다 — 합칠 때 원소를 옮긴다", () => {
    // merge 2,049.00 → 8,193.00. add · count 는 1.00 → 1.00.
    expect(verdicts(exactSet)).toEqual({ ...ALL_PASS, merge: false });
  });

  test("붙이기만 하고 물을 때 세는 구현은 추정 · 합치기에서 걸린다", () => {
    // count 1,025.00 → 4,097.00 · merge 2,049.00 → 8,193.00. add 는 1.00 → 1.00.
    expect(verdicts(appendList)).toEqual({
      add: true,
      count: false,
      merge: false,
    });
  });
});
