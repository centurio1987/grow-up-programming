/**
 * 하네스 자기시험 — `probabilistic/bloomFilter` 계약 앞에 선 정본 · 결함 셋 · 판정 도구 둘.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는 가이드들이
 * 밀린다(불변 사실 106 · 215).
 *
 * **오차는 이 파일이 보지 않는다 — 통계 판정 자기시험 `./runTrials.bloomFilter.test.ts` 로 옮겼다(원칙 B, `S24`).** 필터 하나에서
 * 넣지 않은 원소를 모아 세던 축1 연산(`falsePositiveCheck`)과 그 경계 케이스를 계약 스위트에서 걷어냈다 — 한 필터의 원소 답은
 * 서로 독립이 아니다(`docs/ORD-006-conventions.md` 「원칙 B」 B3 · B5). 여기 남은 것은 결정적 쪽 · 축3 · 확률의 출처다. 보는 것은 셋이다.
 *
 * 1. **퇴화 · 목표를 읽지 않는 구현은 결정적 쪽을 공짜로 지킨다.** `AlwaysYesFilter`(`has` 가 늘 참) · `FixedWidthBloomFilter`(ε 를
 *    읽지 않고 용량당 자리 8 · 자리 3 개)는 경계 케이스 넷 · 무작위 시퀀스 · 축3을 전부 통과한다 — 잡는 것은 통계 판정뿐이다.
 * 2. **정확한 목록은 비용 행이 잡는다.** `ScanningListFilter` 는 축1 전부를 통과하고 `has` 에서만 걸린다.
 * 3. **확률의 출처를 어긴 구현은 스위트를 통과한다 — 이름으로 적는다(불변 사실 62).** `FixedSeedBloomFilter`(해시 상수
 *    고정)가 축1 · 축3 전부를 통과하고 통계 판정도 통과한다(`./runTrials.bloomFilter.test.ts`). 위반은 스위트 밖에서 보인다 — 필터
 *    하나에서 거짓 양성 원소 256 개를 모아 **같은 원소를 넣은 새 필터**에 물으면 이 구현은 256 개 전부 참이고, 정본은 새로 뽑은
 *    무작위 때문에 몇 개로 돌아간다. 그 원소 묶음은 구현의 상수를 읽어야(여기서는 그 구현을 돌려 봐야) 지을 수 있으므로 시나리오가
 *    되지 못한다(불변 사실 44).
 *
 * | 판정 (n = 1,024 → 4,096 · 축1) | 정본 | `AlwaysYes` | `FixedWidth` | `ScanningList` | `FixedSeed` | `BoundaryRate` |
 * |---|---|---|---|---|---|---|
 * | `add` expected O(1) | 통과 | 통과 | 통과 | 통과 | 통과 | — |
 * | `has` expected O(1) | 통과 | 통과 | 통과 | **걸림** | 통과 | — |
 * | 축1 경계 — 결정적인 넷 | 통과 | 통과 | 통과 | 통과 | 통과 | 통과 |
 * | 축1 무작위 500 회 | 통과 | 통과 | 통과 | 통과 | 통과 | 통과 |
 * | 축1 통계 판정(`./runTrials.bloomFilter.test.ts`) | 통과 | **걸림** | **걸림**(ε 0.001) | — | 통과 | — |
 *
 * 축3 수치는 아래 단정의 주석에 있다. `BoundaryRateFilter` 는 언어 `Set` 에 담아 계측기가 없다(축1 전용).
 */

import { describe, expect, test } from "bun:test";
import { BloomFilter as Reference } from "../probabilistic/bloomFilter/_reference/bloomFilter";
import {
  bloomFilterContract,
  type FilterMaker,
  SizedFilter,
} from "../probabilistic/bloomFilter/bloomFilter.contract";
import { AlwaysYesFilter } from "./_fixtures/alwaysYesFilter";
import { BoundaryRateFilter } from "./_fixtures/boundaryRateFilter";
import { FixedSeedBloomFilter } from "./_fixtures/fixedSeedBloomFilter";
import { FixedWidthBloomFilter } from "./_fixtures/fixedWidthBloomFilter";
import { ScanningListFilter } from "./_fixtures/scanningListFilter";
import { rngFrom } from "./judge";
import { type CostSource, judgeScenario, runContract } from "./runContract";

function source(make: FilterMaker): CostSource<SizedFilter> {
  return { kind: "self-reported", make: () => new SizedFilter(make) };
}

const reference: FilterMaker = (n, rate) => new Reference(n, rate);
const alwaysYes: FilterMaker = (n, rate) => new AlwaysYesFilter(n, rate);
const fixedWidth: FilterMaker = (n, rate) => new FixedWidthBloomFilter(n, rate);
const scanningList: FilterMaker = (n, rate) => new ScanningListFilter(n, rate);
const fixedSeed: FilterMaker = (n, rate) => new FixedSeedBloomFilter(n, rate);

/** 시나리오마다 `행 → 통과 여부`. 이 계약은 행마다 시나리오가 하나라 이름이 겹치지 않는다. */
function verdicts(make: FilterMaker): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of bloomFilterContract.scenarios) {
    found[scenario.covers.join("·")] = judgeScenario(
      source(make),
      scenario,
      bloomFilterContract.grade,
    ).ok;
  }
  return found;
}

const byName = new Map(bloomFilterContract.ops.map((op) => [op.name, op]));

/** 경계 케이스 하나를 돌려 처음 어긋난 차례를 돌려준다. 다 맞으면 `null`. `runContract` 축1과 같은 대조다. */
function edgeMismatch(make: FilterMaker, edgeName: string): number | null {
  const edge = bloomFilterContract.edges.find((e) => e.name === edgeName);
  if (edge === undefined) throw new Error(`경계 케이스가 없다: ${edgeName}`);
  const impl = new SizedFilter(make);
  const model = bloomFilterContract.model();
  for (const [index, step] of edge.steps.entries()) {
    const op = byName.get(step.op);
    if (op === undefined) throw new Error(`연산이 없다: ${step.op}`);
    if (op.onImpl(impl, step.arg) !== op.onModel(model, step.arg)) return index;
  }
  return null;
}

/** 무작위 교차검증(seed 1 · 500 회)에서 처음 어긋난 연산의 이름. 다 맞으면 `null`. */
function randomMismatch(make: FilterMaker): string | null {
  const rng = rngFrom(1);
  const impl = new SizedFilter(make);
  const model = bloomFilterContract.model();
  const ops = bloomFilterContract.ops;
  for (let index = 0; index < 500; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (op.onImpl(impl, arg) !== op.onModel(model, arg)) return op.name;
  }
  return null;
}

const DETERMINISTIC_EDGES = bloomFilterContract.edges.map((e) => e.name);

const ALL_PASS = { add: true, has: true };

// 판정 도구 둘과 목록 결함은 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(
  () => new SizedFilter((n, rate) => new BoundaryRateFilter(n, rate)),
  bloomFilterContract,
  { label: "판정 도구 fixture BoundaryRateFilter" },
);
runContract(() => new SizedFilter(fixedSeed), bloomFilterContract, {
  label: "판정 도구 fixture FixedSeedBloomFilter",
});
runContract(() => new SizedFilter(scanningList), bloomFilterContract, {
  label: "결함 fixture ScanningListFilter",
});

describe("BloomFilter 축1 — 퇴화 · 목표를 읽지 않는 구현은 결정적 쪽을 공짜로 지킨다", () => {
  test("has 가 늘 참인 구현은 결정적인 경계 넷과 무작위 시퀀스를 전부 통과한다 — 잡는 것은 통계 판정뿐이다", () => {
    expect(DETERMINISTIC_EDGES).toHaveLength(4);
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(alwaysYes, name)]).toEqual([name, null]);
    expect(randomMismatch(alwaysYes)).toBeNull();
  });

  test("ε 를 읽지 않고 크기를 정하는 구현도 결정적인 넷과 무작위 시퀀스를 통과한다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(fixedWidth, name)]).toEqual([name, null]);
    expect(randomMismatch(fixedWidth)).toBeNull();
  });

  test("축3은 두 구현을 통과시킨다 — 호출마다 상수다", () => {
    expect(verdicts(alwaysYes)).toEqual(ALL_PASS);
    expect(verdicts(fixedWidth)).toEqual(ALL_PASS);
  });
});

describe("BloomFilter 축3 — 비용 행", () => {
  test("정본은 두 시나리오를 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("넣은 원소를 목록에 늘어놓고 훑는 정확한 구현은 has 에서만 걸린다(add 는 뒤에 붙이기라 상수)", () => {
    expect(verdicts(scanningList)).toEqual({ ...ALL_PASS, has: false });
  });

  test("해시 상수를 고정한 구현은 두 시나리오를 통과한다", () => {
    expect(verdicts(fixedSeed)).toEqual(ALL_PASS);
  });
});

describe("BloomFilter 확률의 출처 — 고정 해시는 계약을 어기는데 스위트 밖에서만 보인다", () => {
  const CAPACITY = 1024;
  const RATE = 0.01;
  const WANTED = 256;

  /** 필터 하나를 채우고 거짓 양성 원소 `WANTED` 개를 모은다. */
  function collectFalsePositives(make: FilterMaker): string[] {
    const filter = make(CAPACITY, RATE);
    for (let i = 0; i < CAPACITY; i++) filter.add(`+src:${i}`);
    const found: string[] = [];
    for (let i = 0; found.length < WANTED; i++) {
      const item = `?src:${i}`;
      if (filter.has(item)) found.push(item);
    }
    return found;
  }

  /** 같은 원소를 넣은 새 필터에 모은 원소를 묻고 참의 수를 센다. */
  function transferHits(make: FilterMaker, found: readonly string[]): number {
    const filter = make(CAPACITY, RATE);
    for (let i = 0; i < CAPACITY; i++) filter.add(`+src:${i}`);
    return found.filter((item) => filter.has(item)).length;
  }

  test("고정 해시 구현에서 모은 거짓 양성은 새 필터에서도 전부 참이다 — 그 원소를 미리 고른 호출자에게 확률이 1 이다", () => {
    const found = collectFalsePositives(fixedSeed);
    expect(transferHits(fixedSeed, found)).toBe(WANTED);
  });

  test("정본에서 모은 거짓 양성은 새 필터에서 거의 다 거짓으로 돌아간다(흔들리는 값이라 느슨한 한계만 단정한다)", () => {
    // 기대는 256 × 새 필터의 거짓 양성 몫(ε 의 절반 안팎)이라 한두 개다. 64 는 흔들림과 무관하게 떨어져 있다.
    const found = collectFalsePositives(reference);
    expect(transferHits(reference, found)).toBeLessThan(64);
  });
});
