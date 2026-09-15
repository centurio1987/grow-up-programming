/**
 * 하네스 자기시험 — `probabilistic/cuckooFilter` 계약 앞에 선 정본 · 결함 넷 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다**(불변 사실 106 · 215).
 *
 * **오차의 판정은 통계 판정 자기시험 `./runTrials.cuckooFilter.test.ts` 로 옮겼다(원칙 B, `S24`).** 필터 하나에서 원소를 모아
 * 세던 축1 연산(`errorCheck`)과 그 경계 케이스를 계약 스위트에서 걷어냈다. 이 파일은 결정적 쪽 · 축3 과, **시행 함수
 * `cuckooFilterTrial` 을 워커 없이 한 번 불러** 반례가 어느 판정 자리에서 드러나는지를 본다(판정은 하지 않는다). 보는 것은 넷이다.
 *
 * 1. **자명한 구현이 네 축을 통과한다 — 등급 `basic` 의 실행 근거.** `CountingBloomFilter`(칸마다 수를 센다)가 이 계약의
 *    스위트를 축3까지 통과한다. 같은 구현이 `probabilistic/bloomFilter` 스위트도 축3까지 통과한다 — 두 계약을 다 지키는
 *    구현이다(불변 사실 54 의 셋째 줄). 통계 판정도 두 계약에서 통과한다(`./runTrials.cuckooFilter.test.ts`).
 * 2. **블룸 계약과의 반례 둘이 실행된다.** 지우지 못하는 비트 배열 둘이 이 계약의 시행에서 드러나고(① — 「다 지운 필터」 몫 ·
 *    지우기 위반), 이 계약의 정본은 블룸 계약의 「용량을 넘겨 넣어도 넣은 원소는 참」에서 걸린다(② ).
 * 3. **퇴화 구현은 결정적 쪽을 공짜로 지킨다.** `AlwaysYesCuckooFilter` 가 결정적 경계 다섯 · 무작위 시퀀스 · 축3을 통과하고 시행의
 *    「찬 필터의 거짓 양성」 몫이 1 이다 — 잡는 것은 통계 판정뿐이다.
 * 4. **비용 행.** `ScanningMultisetFilter` 는 `has` · `delete` 에서 걸리고 `add` 는 통과한다.
 *
 * | 판정 (n = 1,024 → 4,096 · 축1) | 정본 | `CountingBloom` | `AlwaysYes` | `PretendDeleting` | `Clearing` | `ScanningMultiset` |
 * |---|---|---|---|---|---|---|
 * | `add` expected O(1) | 22.09 → 22.12 | 37.00 → 37.00 | 통과 | 통과 | 통과 | 통과 1.00 → 1.00 |
 * | `has` expected O(1) | 25.03 → 25.03 | 34.42 → 34.44 | 통과 | 통과 | 통과 | **걸림** 768.50 → 3,072.50 |
 * | `delete` expected O(1) | 22.08 → 22.06 | 37.00 → 37.00 | 통과 | 통과 | 통과 | **걸림** 260.32 → 1,026.69 |
 * | 축1 경계 — 결정적인 다섯 | 통과 | 통과 | 통과 | 통과 | 걸림(용량 2 필터 · 탐침 200/200, 단정하지 않음) | 통과 |
 * | 시행 한 번(용량 128 · ε 0.1, 워커 없이) | — | — | 찬 필터 몫 1 | 다 지운 필터 몫 1 | 결정적 위반(지우기) | — |
 * | 축1 통계 판정(`./runTrials.cuckooFilter.test.ts`) | 통과 | 통과 | **걸림** | **걸림** | **걸림** | — |
 *
 * 정본의 앞 판정 수치(한 실행 안 seed 1,000 회 — 원칙 B 이전의 [경험]): 찬 필터의 거짓 양성 4 ~ 48 · 넣지 않은 원소의 지우기 참
 * 8 ~ 47(한계 128) · 다 지운 필터의 참 0. 한 번 더 넣은 사본은 약 95% 가 받아들여지고 나머지는 제 자리 둘이 차 있어
 * 거절됐다(헤더가 허용한 거절). 무작위라 실행마다 다르다 — 범위만 적는다.
 */

import { describe, expect, test } from "bun:test";
import {
  bloomFilterContract,
  SizedFilter,
} from "../probabilistic/bloomFilter/bloomFilter.contract";
import { CuckooFilter as Reference } from "../probabilistic/cuckooFilter/_reference/cuckooFilter";
import {
  type CuckooMaker,
  cuckooFilterContract,
  cuckooFilterTrial,
  cuckooInput,
  SizedCuckoo,
} from "../probabilistic/cuckooFilter/cuckooFilter.contract";
import { AlwaysYesCuckooFilter } from "./_fixtures/alwaysYesCuckooFilter";
import { CountingBloomFilter } from "./_fixtures/countingBloomFilter";
import {
  ClearingBloomFilter,
  PretendDeletingBloomFilter,
} from "./_fixtures/nonDeletingBloomFilter";
import { ScanningMultisetFilter } from "./_fixtures/scanningMultisetFilter";
import { rngFrom } from "./judge";
import { type CostSource, judgeScenario, runContract } from "./runContract";

const reference: CuckooMaker = (n, rate) => new Reference(n, rate);
const counting: CuckooMaker = (n, rate) => new CountingBloomFilter(n, rate);
const alwaysYes: CuckooMaker = (n, rate) => new AlwaysYesCuckooFilter(n, rate);
const pretend: CuckooMaker = (n, rate) =>
  new PretendDeletingBloomFilter(n, rate);
const clearing: CuckooMaker = (n, rate) => new ClearingBloomFilter(n, rate);
const scanning: CuckooMaker = (n, rate) => new ScanningMultisetFilter(n, rate);

function source(make: CuckooMaker): CostSource<SizedCuckoo> {
  return { kind: "self-reported", make: () => new SizedCuckoo(make) };
}

function verdicts(make: CuckooMaker): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of cuckooFilterContract.scenarios) {
    found[scenario.covers.join("·")] = judgeScenario(
      source(make),
      scenario,
      cuckooFilterContract.grade,
    ).ok;
  }
  return found;
}

const byName = new Map(cuckooFilterContract.ops.map((op) => [op.name, op]));

/** 경계 케이스 하나에서 처음 어긋난 차례. 다 맞으면 `null`. `runContract` 축1과 같은 대조다. */
function edgeMismatch(make: CuckooMaker, edgeName: string): number | null {
  const edge = cuckooFilterContract.edges.find((e) => e.name === edgeName);
  if (edge === undefined) throw new Error(`경계 케이스가 없다: ${edgeName}`);
  const impl = new SizedCuckoo(make);
  const model = cuckooFilterContract.model();
  for (const [index, step] of edge.steps.entries()) {
    const op = byName.get(step.op);
    if (op === undefined) throw new Error(`연산이 없다: ${step.op}`);
    if (op.onImpl(impl, step.arg) !== op.onModel(model, step.arg)) return index;
  }
  return null;
}

/** 무작위 교차검증(seed 1 · 500 회)에서 처음 어긋난 연산의 이름. 다 맞으면 `null`. */
function randomMismatch(make: CuckooMaker): string | null {
  const rng = rngFrom(1);
  const impl = new SizedCuckoo(make);
  const model = cuckooFilterContract.model();
  const ops = cuckooFilterContract.ops;
  for (let index = 0; index < 500; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (op.onImpl(impl, arg) !== op.onModel(model, arg)) return op.name;
  }
  return null;
}

const DETERMINISTIC_EDGES = cuckooFilterContract.edges.map((e) => e.name);

/** 시행 함수를 워커 없이 한 번 부른다 — 반례가 드러나는 자리를 보려는 것이고 판정이 아니다. */
function oneTrial(make: CuckooMaker, rate: number) {
  return cuckooFilterTrial(make, [128, rate], cuckooInput(128, 1, 0, 0));
}

const ALL_PASS = { add: true, has: true, delete: true };

// 1. 자명한 구현이 두 계약의 스위트를 축3까지 통과한다.
runContract(() => new SizedCuckoo(counting), cuckooFilterContract, {
  label: "판정 도구 fixture CountingBloomFilter",
  cost: { kind: "self-reported", make: () => new SizedCuckoo(counting) },
});
runContract(() => new SizedFilter(counting), bloomFilterContract, {
  label: "판정 도구 fixture CountingBloomFilter",
  cost: { kind: "self-reported", make: () => new SizedFilter(counting) },
});
// 4. 목록 결함은 축1 · 축2 를 통과한다(계측기를 넘기지 않아 축3은 아래에서 따로 본다).
runContract(() => new SizedCuckoo(scanning), cuckooFilterContract, {
  label: "결함 fixture ScanningMultisetFilter",
});

describe("CuckooFilter 반례 ① — 지우지 못하는 비트 배열은 시행에서 드러난다", () => {
  test("지우는 척 참만 돌려주는 구현은 결정적 경계 다섯과 축3을 통과하고, 시행의 다 지운 필터 몫이 1 이다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(pretend, name)]).toEqual([name, null]);
    expect(verdicts(pretend)).toEqual(ALL_PASS);
    const result = oneTrial(pretend, 0.1);
    expect(result.violation).toBeNull();
    const emptied = result.tallies["다 지운 필터의 참"];
    expect(emptied?.misses).toBe(emptied?.events);
  });

  test("비트를 끄는 구현은 시행의 지우기 단계에서 결정적 위반으로 드러난다(사본이 남은 원소의 지우기 · has 가 거짓)", () => {
    expect(oneTrial(clearing, 0.1).violation).not.toBeNull();
    expect(verdicts(clearing)).toEqual(ALL_PASS);
  });
});

describe("CuckooFilter 반례 ② — 이 계약의 정본은 블룸 필터 계약의 「넘겨 넣어도 참」을 어긴다", () => {
  test("용량 2 · ε 10^−6 에 다섯을 넣으면 뒤 셋이 거절되어 블룸 스위트의 has 관측이 참조 모델과 갈린다", () => {
    const ops = new Map(bloomFilterContract.ops.map((op) => [op.name, op]));
    const steps: { op: string; arg?: unknown }[] = [
      { op: "constructor", arg: [2, 1e-6] },
      ...["p", "q", "r", "s", "t"].map((arg) => ({ op: "add", arg })),
      ...["p", "q", "r", "s", "t"].map((arg) => ({ op: "has", arg })),
    ];
    const impl = new SizedFilter(reference);
    const model = bloomFilterContract.model();
    let first: number | null = null;
    for (const [index, step] of steps.entries()) {
      const op = ops.get(step.op);
      if (op === undefined) throw new Error(step.op);
      if (op.onImpl(impl, step.arg) !== op.onModel(model, step.arg)) {
        first = index;
        break;
      }
    }
    // 차례 8 = 셋째 원소 r 의 has. p · q 는 받아들여져 참이다.
    expect(first).toBe(8);
  });
});

describe("CuckooFilter 축1 — 퇴화 구현은 결정적 쪽을 공짜로 지킨다", () => {
  test("늘 참인 구현은 결정적 경계 다섯 · 무작위 시퀀스 · 축3을 통과한다", () => {
    for (const name of DETERMINISTIC_EDGES)
      expect([name, edgeMismatch(alwaysYes, name)]).toEqual([name, null]);
    expect(randomMismatch(alwaysYes)).toBeNull();
    expect(verdicts(alwaysYes)).toEqual(ALL_PASS);
  });

  test("그 구현의 시행은 찬 필터의 거짓 양성 몫이 1 이다 — 잡는 것은 통계 판정뿐이다", () => {
    const full = oneTrial(alwaysYes, 0.1).tallies["찬 필터의 거짓 양성"];
    expect(full?.misses).toBe(full?.events);
  });
});

describe("CuckooFilter 축3 — 비용 행", () => {
  test("정본과 칸마다 세는 블룸 필터는 세 시나리오를 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
    expect(verdicts(counting)).toEqual(ALL_PASS);
  });

  test("사본을 늘어놓고 훑는 정확한 구현은 has · delete 에서 걸리고 add 는 통과한다", () => {
    expect(verdicts(scanning)).toEqual({
      add: true,
      has: false,
      delete: false,
    });
  });
});
