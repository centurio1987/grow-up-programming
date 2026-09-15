/**
 * 하네스 자기시험 — `probabilistic/hyperLogLog` 계약 앞에 선 정본 · 결함 다섯 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는 가이드들이
 * 밀린다(불변 사실 106 · 215).
 *
 * **오차 판정은 `probabilistic/bloomFilter` 의 모양(새 인스턴스 · 고정 seed · 모은 수 · 여유 · 모델 `true`)을 따르고, 모으는
 * 단위가 원소가 아니라 인스턴스다(2026-09-15 유저 결정).** 보는 것은 다섯이다.
 *
 * 1. **퇴화 구현을 잡는 것은 오차 판정 하나뿐이다.** `ZeroSketch`(추정이 늘 0)는 결정적 경계 다섯과 축3을 통과하고 오차 판정
 *    경계의 첫 단계와 무작위 시퀀스의 첫 판정 연산(3번째 호출)에서 걸린다.
 * 2. **넣은 호출 수를 세는 구현은 결정적 쪽이 먼저 잡는다.** `CallCountSketch` 는 결정적 경계 다섯에서 모두 걸린다 — 중복 경계는
 *    둘째 단계(같은 원소를 다시 넣자 1 → 2), 합치기 경계는 두 쪽에 같은 원소가 있는 첫 합치기(다섯째 단계)다. 오차 판정도 첫 단계에서 잡는다(판정이 둘에 한 번
 *    원소를 다시 넣는다 — (0.3, 0.3) seed 1 에서 54 중 50). 이 구현에는 무작위가 없어 그 수가 실행마다 같다.
 * 3. **판정이 목표 오차를 읽는다.** `FixedPrecisionSketch`(늘 자리 16 개)는 결정적 경계 다섯 · 무작위 시퀀스 · 축3을 통과하고 오차
 *    판정 경계의 둘째 단계((0.1, 0.1))에서 걸린다. 탐침 20 회에서 벗어난 인스턴스 수가 (0.3, 0.3) 7 ~ 18 · (0.2, 0.2) 19 ~ 32 ·
 *    (0.15, 0.15) 40 ~ 58 · (0.1, 0.1) 88 ~ 117 이었다(한계 48). **무작위 시퀀스의 가벼운 두 모양은 이 구현을 못 잡는다** — (0.1, 0.1)
 *    판정 하나는 넣기 호출이 약 40 만 번으로 가벼운 두 모양(약 4 만 · 6 만 번)의 7 ~ 10 배라(판정 50 회 평균을 셌다) 무작위
 *    시퀀스의 판정 66 회에 넣지 않고 경계 케이스 한 번에 두었다.
 * 4. **여유 3 이 경계 구현을 지킨다.** `BoundaryErrorSketch`(집합마다 확률 δ 로 상대 오차 한계를 딱 넘는 정확한 집합)가 축1 전부를
 *    통과한다. 탐침 — 네 모양((ε, δ) = (0.3, 0.3) · (0.2, 0.2) · (0.2, 0.1) · (0.1, 0.1)) × seed 2,000 = 판정 8,000 회에서 벗어난 수가
 *    5 ~ 32 였고, 한계를 16(여유 1)으로 두면 3,475 회 · 24(1.5)면 97 회 · 32(2)면 0 회 · 40(2.5) · **48(3)도 0 회** 떨어졌다. 같은
 *    8,000 회에서 **정본은 0 ~ 3** 이었다. 여유 2 도 8,000 회에서 0 이었지만 이항 분포의 꼬리를 셈하면 한 판정에서 떨어질 확률이
 *    되풀이 54 · δ 0.3 에서 2.2 × 10^−6, 80 · 0.2 에서 1.2 × 10^−5, 160 · 0.1 에서 4.7 × 10^−5 라, 가벼운 두 모양의 판정이 66 회(seed 1
 *    시퀀스)인 스위트 한 번에 약 5 × 10^−4 이다. 여유 3 에서는 셋 중 가장 큰 것이 4.9 × 10^−13 이다.
 *    정본의 수는 무작위라 실행마다 다르다 — 범위만 적는다(「무작위를 쓰는 정본과 재현성」 규칙 3).
 * 5. **합치기의 상한이 정확한 구현을 가른다.** `ExactSetSketch`(언어 `Set`)는 축1 전부와 `add` · `count` 를 통과하고 `merge` 에서만
 *    걸린다. `AppendListSketch`(중복째 붙이고 물을 때 센다)는 `add` 를 통과하고 `count` · `merge` 에서 걸린다.
 *
 * | 판정 (n = 1,024 → 4,096 · 축1) | 정본 | `Zero` | `CallCount` | `FixedPrecision` | `ExactSet` | `AppendList` | `BoundaryError` |
 * |---|---|---|---|---|---|---|---|
 * | `add` expected O(1) | 통과 | 통과 | 통과 | 통과 | 통과 | 통과 | — |
 * | `count` expected O(1) | 통과 | 통과 | 통과 | 통과 | 통과 | **걸림** | — |
 * | `merge` expected O(1) | 통과 | 통과 | 통과 | 통과 | **걸림** | **걸림** | — |
 * | 축1 경계 — 결정적인 다섯 | 통과 | 통과 | **걸림**(다섯 모두) | 통과 | 통과 | 통과 | 통과 |
 * | 축1 경계 — 오차 판정 셋 | 통과 | **걸림**(첫 단계) | **걸림**(첫 단계) | **걸림**(둘째 단계) | 통과 | 통과 | 통과 |
 * | 축1 무작위 500 회 | 통과 | **걸림** | **걸림** | 통과 | 통과 | 통과 | 통과 |
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
const DETERMINISTIC_EDGES = EDGE_NAMES.filter(
  (name) => !name.startsWith("오차 판정"),
);
const ERROR_EDGE = EDGE_NAMES.find((name) =>
  name.startsWith("오차 판정"),
) as string;
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

describe("HyperLogLog 축1 — 퇴화 구현을 잡는 것은 오차 판정 하나뿐이다", () => {
  test("추정이 늘 0 인 구현은 결정적인 경계 다섯을 전부 통과한다", () => {
    expect(DETERMINISTIC_EDGES).toHaveLength(5);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(zero, name)]).toEqual([name, null]);
  });

  test("그 구현은 오차 판정 경계의 첫 단계에서 걸리고, 무작위 시퀀스에서도 판정 연산이 잡는다", () => {
    expect(edgeMismatch(zero, ERROR_EDGE)).toBe(0);
    expect(randomMismatch(zero)?.[1]).toBe("errorCheck");
  });

  test("축3은 그 구현을 통과시킨다 — 호출마다 상수다", () => {
    // 세 행 모두 1.00 → 1.00.
    expect(verdicts(zero)).toEqual(ALL_PASS);
  });
});

describe("HyperLogLog 축1 — 넣은 호출 수를 세는 구현은 결정적 쪽이 먼저 잡는다", () => {
  test("같은 원소를 다시 넣는 둘째 단계 · 두 쪽에 같은 원소가 있는 첫 합치기에서 걸리고, 결정적 경계 다섯 모두에서 걸린다", () => {
    expect(edgeMismatch(callCount, edgeNamed("이미 들어온 원소"))).toBe(1);
    expect(edgeMismatch(callCount, edgeNamed("합치기는 새 인스턴스"))).toBe(4);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(callCount, name) !== null]).toEqual([
        name,
        true,
      ]);
  });

  test("오차 판정도 첫 단계에서 잡는다 — 판정이 둘에 한 번 원소를 다시 넣는다", () => {
    expect(edgeMismatch(callCount, ERROR_EDGE)).toBe(0);
  });
});

describe("HyperLogLog 축1 — 오차 판정이 목표 오차를 읽는다", () => {
  test("자리 수를 고정한 구현은 결정적인 다섯 · 무작위 시퀀스를 통과하고 오차 판정의 (0.1, 0.1) 단계에서 걸린다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(fixedPrecision, name)]).toEqual([name, null]);
    expect(randomMismatch(fixedPrecision)).toBeNull();
    expect(edgeMismatch(fixedPrecision, ERROR_EDGE)).toBe(1);
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
