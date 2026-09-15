/**
 * 하네스 자기시험 — `probabilistic/minHash` 계약 앞에 선 정본 · 결함 다섯 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는 가이드들이
 * 밀린다(불변 사실 106 · 215).
 *
 * **오차 판정은 `probabilistic/hyperLogLog` 의 모양(새 인스턴스 · 고정 seed · 모은 수 · 여유 · 모델 `true`)을 따르고, 모으는
 * 단위가 인스턴스 짝이다(2026-09-15 유저 결정).** 보는 것은 여섯이다.
 *
 * 1. **퇴화 구현을 잡는 것은 오차 판정 하나뿐이다.** `AlwaysOneSimilarity`(닮음이 늘 1)는 결정적 경계 넷과 축3을 통과하고 오차
 *    판정 경계의 **둘째** 단계((0.1, 0.1))에서 걸린다. 첫 단계 (0.3, 0.3) 은 통과한다 — 되풀이 54 번에 한계가 48 이라 벗어난 몫이
 *    89 % 를 넘어야 걸리는데, 참 닮음이 0.7 이상인 짝에서는 늘 1 도 맞는다. 무작위 시퀀스는 가벼운 둘째 모양 (0.2, 0.2) 의 판정이
 *    잡는다.
 * 2. **판정이 목표 오차를 읽는다.** `FixedSizeMinHash`(늘 서명 칸 8 개)는 결정적 경계 넷 · 무작위 시퀀스 · 축3을 통과하고 오차 판정
 *    경계의 둘째나 셋째 단계에서 걸린다. 탐침에서 벗어난 짝의 수가 (0.3, 0.3) 0 ~ 6 · (0.2, 0.2) 3 ~ 19(각 200 회) · (0.1, 0.1) 44 ~ 76
 *    (100 회) · **(0.1, 0.05) 106 ~ 148**(100 회)이었다(한계 48). (0.1, 0.1) 은 경계에 붙어 있어 셋째 모양을 δ 0.05 로 두었다 —
 *    되풀이가 320 번이라 한계 48 이 벗어난 몫 15 % 에 해당한다. 무거운 모양 둘은 판정 하나의 넣기 호출이 약 15 만 · 60 만 번으로
 *    가벼운 둘(약 6 천 · 1 만 4 천 번)의 10 ~ 100 배라 경계 케이스 한 번에만 두었다.
 * 3. **결정적 쪽의 둘째 문장이 무작위를 뽑는 단위를 실행으로 옮긴다.** `PerInstanceSeedMinHash`(해시를 인스턴스마다 뽑는다)는 따로
 *    세운 두 인스턴스에 같은 집합이 들어간 자리에서 걸린다 — 중복 경계는 둘째 단계(다시 넣은 뒤 같은 집합을 새로 넣은 인스턴스와의
 *    닮음 0), 같은 원소 경계 · 거절 경계는 여덟째 단계. **두 집합이 끝까지 같지 않은 경계(짝의 함수 경계)는 통과한다** — 서로 다른
 *    해시로 센 닮음이 늘 0 이라 새 인스턴스 짝의 답과도 같다. 결정적으로 잡는 것은 「같은 집합이면 1」 하나다.
 * 4. **여유 3 이 경계 구현을 지킨다.** `BoundaryErrorSimilarity`(서로 다른 짝마다 확률 δ 로 한계를 딱 넘는 정확한 닮음)가 축1 전부를
 *    통과한다. 탐침 — 네 모양((ε, δ) = (0.3, 0.3) · (0.2, 0.2) · (0.2, 0.1) · (0.1, 0.1)) × seed 2,000 = 판정 8,000 회에서 벗어난 수가
 *    4 ~ 29 였고, 한계를 16(여유 1)으로 두면 1,900 회 · 24(1.5)면 19 회 · 32(2) · 40(2.5) · **48(3)은 0 회** 떨어졌다. 같은 네 모양에서
 *    **정본은 0 ~ 6** 이었다(판정 2,000 · 2,000 · 400 · 100 회 — 정본은 넣기가 칸 k 개를 고쳐 무거운 모양의 회수를 줄였다). 여유 2 의
 *    이항 꼬리는 `probabilistic/hyperLogLog` 와 같은 수(되풀이 160 · δ 0.1 에서 4.7 × 10^−5)라 같은 까닭으로 3 을 쓴다 — 가벼운 두 모양의
 *    판정이 무작위 시퀀스(seed 1)에 75 회(34 · 41) 든다. 정본의 수는 무작위라 실행마다 다르다 — 범위만 적는다(「무작위를 쓰는 정본과
 *    재현성」 규칙 3).
 * 5. **닮음의 상한이 정확한 구현을 가른다.** `ExactSetSimilarity`(언어 `Set`, 정확한 닮음)는 축1 전부와 `add` 를 통과하고
 *    `similarity` 에서만 걸린다.
 * 6. **넣기의 상한이 겹침을 훑는 구현을 가른다.** `ScanningDedupMinHash`(정본 앞에 들어온 원소 목록 훑기)는 결정적 경계 넷과
 *    `similarity` 를 통과하고 `add` 에서만 걸린다. 오차 판정 · 무작위 시퀀스는 돌리지 않는다 — 판정 하나의 합집합이 최대 수천이라
 *    목록 훑기가 제곱으로 무거워지고, 서명은 정본의 것이라 볼 것이 없다.
 *
 * | 판정 (n = 1,024 → 4,096 · 축1) | 정본 | `AlwaysOne` | `FixedSize` | `PerInstanceSeed` | `ExactSet` | `ScanningDedup` | `BoundaryError` |
 * |---|---|---|---|---|---|---|---|
 * | `add` expected O(1) | 통과 | 통과 | 통과 | 통과 | 통과 | **걸림** | — |
 * | `similarity` expected O(1) | 통과 | 통과 | 통과 | 통과 | **걸림** | 통과 | — |
 * | 축1 경계 — 결정적인 넷 | 통과 | 통과 | 통과 | **걸림**(셋) | 통과 | 통과 | 통과 |
 * | 축1 경계 — 오차 판정 셋 | 통과 | **걸림**(둘째 단계) | **걸림**(둘째나 셋째) | **걸림** | 통과 | — | 통과 |
 * | 축1 무작위 500 회 | 통과 | **걸림** | 통과 | **걸림** | 통과 | — | 통과 |
 *
 * 축3 수치는 아래 단정의 주석에 있다. `BoundaryErrorSimilarity` 는 언어 `Set` 에 담아 계측기가 없다(축1 전용).
 */

import { describe, expect, test } from "bun:test";
import { MinHash as Reference } from "../probabilistic/minHash/_reference/minHash";
import {
  MinHashPair,
  minHashContract,
  type SimilarityMaker,
} from "../probabilistic/minHash/minHash.contract";
import { AlwaysOneSimilarity } from "./_fixtures/alwaysOneSimilarity";
import { BoundaryErrorSimilarity } from "./_fixtures/boundaryErrorSimilarity";
import { ExactSetSimilarity } from "./_fixtures/exactSetSimilarity";
import { FixedSizeMinHash } from "./_fixtures/fixedSizeMinHash";
import { PerInstanceSeedMinHash } from "./_fixtures/perInstanceSeedMinHash";
import { ScanningDedupMinHash } from "./_fixtures/scanningDedupMinHash";
import { rngFrom } from "./judge";
import { type CostSource, judgeScenario, runContract } from "./runContract";

function source(make: SimilarityMaker): CostSource<MinHashPair> {
  return { kind: "self-reported", make: () => new MinHashPair(make) };
}

const reference: SimilarityMaker = (e, d) => new Reference(e, d);
const alwaysOne: SimilarityMaker = (e, d) => new AlwaysOneSimilarity(e, d);
const fixedSize: SimilarityMaker = (e, d) => new FixedSizeMinHash(e, d);
const perInstance: SimilarityMaker = (e, d) => new PerInstanceSeedMinHash(e, d);
const exactSet: SimilarityMaker = (e, d) => new ExactSetSimilarity(e, d);
const scanningDedup: SimilarityMaker = (e, d) => new ScanningDedupMinHash(e, d);

/** 시나리오마다 `행 → 통과 여부`. 이 계약은 행마다 시나리오가 하나라 이름이 겹치지 않는다. */
function verdicts(make: SimilarityMaker): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of minHashContract.scenarios) {
    found[scenario.covers.join("·")] = judgeScenario(
      source(make),
      scenario,
      minHashContract.grade,
    ).ok;
  }
  return found;
}

const byName = new Map(minHashContract.ops.map((op) => [op.name, op]));

/** 경계 케이스 하나를 돌려 처음 어긋난 차례를 돌려준다. 다 맞으면 `null`. `runContract` 축1과 같은 대조다. */
function edgeMismatch(make: SimilarityMaker, edgeName: string): number | null {
  const edge = minHashContract.edges.find((e) => e.name === edgeName);
  if (edge === undefined) throw new Error(`경계 케이스가 없다: ${edgeName}`);
  const impl = new MinHashPair(make);
  const model = minHashContract.model();
  for (const [index, step] of edge.steps.entries()) {
    const op = byName.get(step.op);
    if (op === undefined) throw new Error(`연산이 없다: ${step.op}`);
    if (op.onImpl(impl, step.arg) !== op.onModel(model, step.arg)) return index;
  }
  return null;
}

/** 무작위 교차검증(seed 1 · 500 회)에서 처음 어긋난 `[차례, 연산 이름]`. 다 맞으면 `null`. */
function randomMismatch(make: SimilarityMaker): [number, string] | null {
  const rng = rngFrom(1);
  const impl = new MinHashPair(make);
  const model = minHashContract.model();
  const ops = minHashContract.ops;
  for (let index = 0; index < 500; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (op.onImpl(impl, arg) !== op.onModel(model, arg))
      return [index, op.name];
  }
  return null;
}

const EDGE_NAMES = minHashContract.edges.map((e) => e.name);
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

const ALL_PASS = { add: true, similarity: true };

// 판정 도구와 정확한 구현은 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(
  () => new MinHashPair((e, d) => new BoundaryErrorSimilarity(e, d)),
  minHashContract,
  { label: "판정 도구 fixture BoundaryErrorSimilarity" },
);
runContract(() => new MinHashPair(exactSet), minHashContract, {
  label: "결함 fixture ExactSetSimilarity",
});

describe("MinHash 축1 — 퇴화 구현을 잡는 것은 오차 판정 하나뿐이다", () => {
  test("닮음이 늘 1 인 구현은 결정적인 경계 넷을 전부 통과한다", () => {
    expect(DETERMINISTIC_EDGES).toHaveLength(4);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(alwaysOne, name)]).toEqual([name, null]);
  });

  test("그 구현은 오차 판정 경계의 둘째 단계에서 걸리고, 무작위 시퀀스에서도 판정 연산이 잡는다", () => {
    expect(edgeMismatch(alwaysOne, ERROR_EDGE)).toBe(1);
    expect(randomMismatch(alwaysOne)?.[1]).toBe("errorCheck");
  });

  test("축3은 그 구현을 통과시킨다 — 호출마다 상수다", () => {
    // 두 행 모두 1.00 → 1.00.
    expect(verdicts(alwaysOne)).toEqual(ALL_PASS);
  });
});

describe("MinHash 축1 — 오차 판정이 목표 오차를 읽는다", () => {
  test("서명 칸 수를 고정한 구현은 결정적인 넷 · 무작위 시퀀스를 통과하고 오차 판정의 둘째나 셋째 단계에서 걸린다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(fixedSize, name)]).toEqual([name, null]);
    expect(randomMismatch(fixedSize)).toBeNull();
    const caught = edgeMismatch(fixedSize, ERROR_EDGE);
    expect(caught === 1 || caught === 2).toBe(true);
  });

  test("그 구현도 축3은 통과한다", () => {
    // add 28.00 → 28.00(글자 10 × 줄 2 + 칸 8) · similarity 8.00 → 8.00.
    expect(verdicts(fixedSize)).toEqual(ALL_PASS);
  });
});

describe("MinHash 축1 — 인스턴스마다 해시를 뽑으면 「같은 집합이면 1」이 잡는다", () => {
  test("같은 집합이 따로 세운 두 인스턴스에 든 경계 셋에서 걸리고, 두 집합이 끝까지 다른 경계는 통과한다", () => {
    expect(edgeMismatch(perInstance, edgeNamed("이미 들어온 원소"))).toBe(1);
    expect(edgeMismatch(perInstance, edgeNamed("두 쪽에 같은 원소"))).toBe(7);
    expect(edgeMismatch(perInstance, edgeNamed("0 이하"))).toBe(7);
    expect(edgeMismatch(perInstance, edgeNamed("닮음은 두 쪽"))).toBeNull();
    expect(randomMismatch(perInstance)).not.toBeNull();
  });

  test("그 구현은 축3을 정본과 같은 값으로 통과한다", () => {
    // add 31.00 → 31.00 · similarity 11.00 → 11.00.
    expect(verdicts(perInstance)).toEqual(ALL_PASS);
  });
});

describe("MinHash 축3 — 비용 행", () => {
  test("정본은 두 시나리오를 통과한다", () => {
    // 칸 11 개(ε = δ = 0.3): add 31.00 → 31.00(글자 10 × 줄 2 + 칸 11) · similarity 11.00 → 11.00.
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("정확한 집합은 닮음에서만 걸린다 — 교집합을 세려고 원소를 훑는다", () => {
    // similarity 1,025.00 → 4,097.00. add 는 1.00 → 1.00.
    expect(verdicts(exactSet)).toEqual({ ...ALL_PASS, similarity: false });
  });

  test("들어온 원소 목록을 훑고 넣는 구현은 넣기에서만 걸리고 결정적 경계 넷은 통과한다", () => {
    // add 543.50 → 2,079.50. similarity 는 11.00 → 11.00(정본의 서명).
    expect(verdicts(scanningDedup)).toEqual({ ...ALL_PASS, add: false });
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(scanningDedup, name)]).toEqual([name, null]);
  });
});
