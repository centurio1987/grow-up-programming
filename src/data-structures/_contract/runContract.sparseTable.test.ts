/**
 * 하네스 자기시험 — `range-query/sparseTable` 계약(불변 수열의 구간 접기 · T4-05).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 **계약을 어긴 구현을 실제로 떨어뜨리는지**, 그리고
 * **떨어뜨리지 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts`
 * 머리말과 같다(불변 사실 106·255).
 *
 * 묶음이 넷이다 — 축3 결함 계열의 행 귀속(통과하는 계약 위반 포함), 구성 시점과 `worst` 의 근거, 멱등 판정(필요조건이
 * 아니고 충분조건이다), 축1 과 스위트 결합의 세 의무.
 */

import { describe, expect, test } from "bun:test";
import { SegmentTree } from "../range-query/segmentTree/_reference/segmentTree";
import { SparseTable as Reference } from "../range-query/sparseTable/_reference/sparseTable";
import {
  firstNonZero,
  IDENTITY,
  initialValues,
  Reindexable,
  type SparseTableContract,
  sparseTableContract,
} from "../range-query/sparseTable/sparseTable.contract";
import { DeferredSparseTable } from "./_fixtures/deferredSparseTable";
import { NonOverlappingFoldTable } from "./_fixtures/nonOverlappingFoldTable";
import { RescanningSparseTable } from "./_fixtures/rescanningSparseTable";
import { ScanningRangeFold } from "./_fixtures/scanningRangeFold";
import { rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = SparseTableContract & { __cost: number };
type Combine = (a: number, b: number) => number;
type Maker = (values: number[], combine: Combine, identity: number) => Measured;

function injected(
  make: Maker,
  combine: Combine = firstNonZero,
  identity = IDENTITY,
): CostSource<Reindexable> {
  return {
    kind: "injected",
    make: (tick) =>
      new Reindexable((values) =>
        make(
          values,
          (a, b) => {
            tick();
            return combine(a, b);
          },
          identity,
        ),
      ),
  };
}

const makers = {
  reference: (v, c, i) => new Reference(v, c, i),
  nonOverlapping: (v, c, i) => new NonOverlappingFoldTable(v, c, i),
  rescanning: (v, c, i) => new RescanningSparseTable(v, c, i),
  deferred: (v, c, i) => new DeferredSparseTable(v, c, i),
  scanning: (v, c, i) => new ScanningRangeFold(v, c, i),
  segmentTree: (v, c, i) => new SegmentTree(v, c, i),
} satisfies Record<string, Maker>;

const BUILD = "constructor";
const QUERY = "query";

function verdicts(
  cost: CostSource<Reindexable>,
): Record<string, { ok: boolean; stats: number[] }> {
  const result: Record<string, { ok: boolean; stats: number[] }> = {};
  for (const scenario of sparseTableContract.scenarios) {
    const verdict = judgeScenario(cost, scenario, "complexity");
    result[scenario.covers.join("·")] = {
      ok: verdict.ok,
      stats: verdict.points.map((point) => point.stat),
    };
  }
  return result;
}

/** 경계 케이스와 무작위 시퀀스(seed 1 · 500 회)에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit(make: Maker): string | null {
  const byName = new Map(
    sparseTableContract.ops.map((op) => [op.name, op] as const),
  );
  const fresh = () =>
    new Reindexable((values) => make(values, firstNonZero, IDENTITY));
  for (const edge of sparseTableContract.edges) {
    const impl = fresh();
    const model = sparseTableContract.model();
    for (const [index, step] of edge.steps.entries()) {
      const op = byName.get(step.op);
      if (!op) throw new Error(`없는 연산: ${step.op}`);
      const observed = op.onImpl(impl, step.arg);
      const expected = op.onModel(model, step.arg);
      if (!Object.is(observed, expected)) {
        return `${edge.name} / ${index}번째 ${step.op} — 관측 ${observed} / 모델 ${expected}`;
      }
    }
  }
  const rng = rngFrom(1);
  const impl = fresh();
  const model = sparseTableContract.model();
  for (let index = 0; index < 500; index++) {
    const op =
      sparseTableContract.ops[
        Math.floor(rng() * sparseTableContract.ops.length)
      ];
    if (!op) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (!Object.is(op.onImpl(impl, arg), op.onModel(model, arg))) {
      return `무작위 ${index}번째 ${op.name}`;
    }
  }
  return null;
}

describe("축3 — 불변 구간 접기의 정본과 결함 계열(행 귀속)", () => {
  test("정본과 겹치지 않게 접는 구현이 두 시나리오를 통과한다", () => {
    expect(verdicts(injected(makers.reference))).toEqual({
      [BUILD]: { ok: true, stats: [17432, 86044, 409632] },
      [QUERY]: { ok: true, stats: [3, 3, 3] },
    });
    expect(verdicts(injected(makers.nonOverlapping))).toEqual({
      [BUILD]: { ok: true, stats: [21504, 102400, 475136] },
      [QUERY]: { ok: true, stats: [4, 4, 4] },
    });
  });

  test("칸마다 처음부터 훑어 짓는 구현은 구성에서만 걸린다", () => {
    expect(verdicts(injected(makers.rescanning))).toEqual({
      [BUILD]: { ok: false, stats: [1399124, 22373716, 357930324] },
      [QUERY]: { ok: true, stats: [3, 3, 3] },
    });
  }, 60_000);

  /**
   * 값 배열 — 자명한 구현. 질의가 폭에 비례해 걸린다. 이 fixture 는 `range-query/segmentTree` 의 것을 읽기만 했고 생성자가
   * 베끼기를 세지 않아 구성 시나리오의 계측이 0 이다 — 하네스가 「판정할 수 없다」로 떨어뜨리는 것이지 계급 판정이 아니다.
   */
  test("값 배열은 질의에서 걸린다(구성은 계측이 비어 판정 불가)", () => {
    expect(verdicts(injected(makers.scanning))).toEqual({
      [BUILD]: { ok: false, stats: [0, 0, 0] },
      [QUERY]: { ok: false, stats: [2044, 8188, 32764] },
    });
  });

  /**
   * **통과하는 계약 위반**(불변 사실 62). `range-query/segmentTree` 정본을 그대로 넣으면 질의가 `O(log n)` 으로 이 계약의
   * `O(1)` 을 어기는데 비율 1.22 · 1.18 이 `O(1)` 구간 안이고, 구성은 `O(n)` 이라 비율 4.0 이 `O(n log n)` 구간 안이다
   * (불변 사실 53 — 로그 인수는 해상도 아래). 두 계약이 이 방향으로 갈리는 자리 전체가 판정 규격 아래에 있다.
   */
  test("segmentTree 정본은 로그 인수만큼 어기면서 두 시나리오를 통과한다", () => {
    expect(verdicts(injected(makers.segmentTree))).toEqual({
      [BUILD]: { ok: true, stats: [3070, 12286, 49150] },
      [QUERY]: { ok: true, stats: [37, 45, 53] },
    });
  });
});

describe("축3 — 구성 시점(불변 사실 52 ③)과 질의 행 worst 의 근거", () => {
  function queriesAfterBuild(
    qualifier: "worst" | "amortized",
  ): CostScenario<Reindexable> {
    return {
      covers: ["query"],
      qualifier,
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reindex(initialValues(n));
        for (let k = 0; k < n; k++) {
          const from = 1 + (k % 8);
          const to = n - 1 - ((k * 3) % 8);
          ctx.step(() => void impl.query(from, to));
        }
      },
    };
  }

  test("짓기를 첫 질의로 미루는 구현은 구성을 통과하고 질의에서 걸린다", () => {
    expect(verdicts(injected(makers.deferred))).toEqual({
      [BUILD]: { ok: true, stats: [1024, 4096, 16384] },
      [QUERY]: { ok: false, stats: [17435, 86047, 409635] },
    });
  });

  /**
   * **불변 구조에도 `worst` 가 추가로 배제하는 계열이 있다** — 구성을 첫 질의로 미루는 계열. 질의 n 번을 전부 재면 단일
   * 호출 최대가 걸리고 호출 평균(생성자 몫을 질의 n 번에 나눈 것 — 로그를 따라 자라 해상도 아래)은 통과한다. 정본은 두
   * 통계 모두 3 이다. `docs/ORD-006-conventions.md` T1-06 「`worst` 만 있는 계약의 한정자 근거」 문단이 든 두 계열 밖이다.
   */
  test("짓기를 미루는 계열은 worst 로 걸리고 amortized 로 통과한다", () => {
    const read = (make: Maker, qualifier: "worst" | "amortized") => {
      const verdict = judgeScenario(
        injected(make),
        queriesAfterBuild(qualifier),
        "complexity",
      );
      return {
        ok: verdict.ok,
        stats: verdict.points.map(
          (point) => Math.round(point.stat * 100) / 100,
        ),
      };
    };
    expect({
      deferredWorst: read(makers.deferred, "worst"),
      deferredAverage: read(makers.deferred, "amortized"),
      referenceWorst: read(makers.reference, "worst"),
    }).toEqual({
      deferredWorst: { ok: false, stats: [17435, 86047, 409635] },
      deferredAverage: { ok: true, stats: [20.02, 24.01, 28] },
      referenceWorst: { ok: true, stats: [3, 3, 3] },
    });
  });
});

describe("멱등 판정 — 상수 질의의 필요조건이 아니고 충분조건이다", () => {
  const sum: Combine = (a, b) => a + b;

  /**
   * **충분하다** — 정본은 겹치는 두 칸을 접고 멱등이 두 번 덮인 가운데를 한 번으로 줄인다(위 첫 묶음이 멱등인 스위트 결합으로
   * 통과를 고정했다). **어기면 답이 구현마다 갈린다** — 합에서 `[1, 2, 3]` 전체를 정본은 8(가운데 2 를 두 번), 값 배열과
   * 겹치지 않게 접는 구현은 6 으로 답한다.
   */
  test("멱등이 아닌 결합(합)에서는 겹쳐 접는 구현의 답이 갈린다", () => {
    const answer = (make: Maker) => make([1, 2, 3], sum, 0).query(0, 3);
    expect({
      reference: answer(makers.reference),
      nonOverlapping: answer(makers.nonOverlapping),
      scanning: answer(makers.scanning),
    }).toEqual({ reference: 8, nonOverlapping: 6, scanning: 6 });
  });

  /**
   * **필요하지 않다** — 겹치지 않게 접는 구현은 결합법칙만 쓰고, 합을 주입해도 무작위 수열 · 구간에서 값 배열과 답이 같으며
   * 스위트 두 시나리오를 같은 계급(구성 21,504 · 102,400 · 475,136 / 질의 4 · 4 · 4)으로 통과한다.
   */
  test("겹치지 않게 접는 구현은 멱등 없이 옳은 답을 상수 질의로 낸다", () => {
    const rng = rngFrom(3);
    let checked = 0;
    for (let round = 0; round < 40; round++) {
      const length = Math.floor(rng() * 40);
      const values = Array.from({ length }, () => Math.floor(rng() * 21) - 10);
      const table = new NonOverlappingFoldTable(values, sum, 0);
      const scan = new ScanningRangeFold(values, sum, 0);
      for (let from = 0; from <= length; from++) {
        for (let to = from; to <= length; to++) {
          checked += 1;
          expect(table.query(from, to)).toBe(scan.query(from, to));
        }
      }
    }
    expect(checked).toBe(12067);
    expect(verdicts(injected(makers.nonOverlapping, sum, 0))).toEqual({
      [BUILD]: { ok: true, stats: [21504, 102400, 475136] },
      [QUERY]: { ok: true, stats: [4, 4, 4] },
    });
  });
});

describe("축1 과 스위트 결합", () => {
  test("정본 · 결함 계열 · 비교 구현이 전부 경계 케이스와 무작위 시퀀스를 통과한다", () => {
    for (const make of Object.values(makers)) {
      expect(firstBehaviorSplit(make)).toBeNull();
    }
  });

  /** 접는 두 칸의 차례를 뒤집은 정본 사본 — 교환적이지 않은 멱등 결합이라서 경계 케이스 하나에서 갈린다(불변 사실 172). */
  test("두 칸의 차례를 뒤집으면 경계 케이스에서 갈린다", () => {
    const flipped: Maker = (values, combine, identity) =>
      new Reference(values, (a, b) => combine(b, a), identity);
    expect(firstBehaviorSplit(flipped)).toBe(
      "왼쪽부터 접는다 — 겹쳐 덮인 가운데가 있어도 차례를 바꾸면 답이 갈린다 / 1번째 query — 관측 7 / 모델 2",
    );
  });

  test("스위트 결합이 결합법칙 · 항등원 · 멱등을 지키고 교환적이지 않다", () => {
    const DOMAIN = [-2, -1, 0, 1, 2];
    for (const a of DOMAIN) {
      expect(firstNonZero(a, a)).toBe(a);
      expect(firstNonZero(IDENTITY, a)).toBe(a);
      expect(firstNonZero(a, IDENTITY)).toBe(a);
      for (const b of DOMAIN)
        for (const c of DOMAIN) {
          expect(firstNonZero(firstNonZero(a, b), c)).toBe(
            firstNonZero(a, firstNonZero(b, c)),
          );
        }
    }
    expect(firstNonZero(1, 2)).not.toBe(firstNonZero(2, 1));
  });
});
