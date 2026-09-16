/**
 * 하네스 자기시험 — `range-query/persistentSegmentTree` 계약(옛 버전을 묻는 구간 질의 · T4-04).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 **계약을 어긴 구현을 실제로 떨어뜨리는지**, 그리고
 * **떨어뜨리지 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts`
 * 머리말과 같다(불변 사실 106·255).
 *
 * 묶음이 넷이다 — 축3 결함 계열의 행 귀속, `worst` 의 근거, 축1(옛 버전을 들고 있지 않는 구현 · 불변 사실 67 의 셋째
 * 걸음), `range-query/segmentTree` 와의 포섭.
 */

import { describe, expect, test } from "bun:test";
import { PersistentSegmentTree as Reference } from "../range-query/persistentSegmentTree/_reference/persistentSegmentTree";
import {
  firstNonZero,
  IDENTITY,
  type PersistentSegmentTreeContract,
  persistentSegmentTreeContract,
  VersionedSized,
} from "../range-query/persistentSegmentTree/persistentSegmentTree.contract";
import {
  Sized,
  segmentTreeContract,
} from "../range-query/segmentTree/segmentTree.contract";
import { BufferedPersistentFold } from "./_fixtures/bufferedPersistentFold";
import { LatestOnlyPersistentFold } from "./_fixtures/latestOnlyPersistentFold";
import { ReplayingPersistentFold } from "./_fixtures/replayingPersistentFold";
import { RerootingPersistentFold } from "./_fixtures/rerootingPersistentFold";
import { rngFrom } from "./judge";
import {
  type ContractSpec,
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = PersistentSegmentTreeContract & { __cost: number };
type Combine = (a: number, b: number) => number;
type Maker = (values: number[], combine: Combine, identity: number) => Measured;

/** 스위트 결합을 주입하고 호출을 밖에서 센다(`../range-query/persistentSegmentTree/persistentSegmentTree.test.ts` 와 같은 경로). */
function injected(make: Maker): CostSource<VersionedSized> {
  return {
    kind: "injected",
    make: (tick) =>
      new VersionedSized((values) =>
        make(
          values,
          (a, b) => {
            tick();
            return firstNonZero(a, b);
          },
          IDENTITY,
        ),
      ),
  };
}

const makers = {
  reference: (v, c, i) => new Reference(v, c, i),
  latestOnly: (v, c, i) => new LatestOnlyPersistentFold(v, c, i),
  replaying: (v, c, i) => new ReplayingPersistentFold(v, c, i),
  rerooting: (v, c, i) => new RerootingPersistentFold(v, c, i),
  buffered: (v, c, i) => new BufferedPersistentFold(v, c, i),
} satisfies Record<string, Maker>;

const UPDATE = "update";
const QUERY = "query";

function verdicts(
  cost: CostSource<VersionedSized>,
): Record<string, { ok: boolean; stats: number[] }> {
  const result: Record<string, { ok: boolean; stats: number[] }> = {};
  for (const scenario of persistentSegmentTreeContract.scenarios) {
    const verdict = judgeScenario(cost, scenario, "complexity");
    result[scenario.covers.join("·")] = {
      ok: verdict.ok,
      stats: verdict.points.map((point) => point.stat),
    };
  }
  return result;
}

/** 스위트 한 벌의 경계 케이스와 무작위 시퀀스(seed 1 · 500 회)에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit<Impl, Model>(
  spec: ContractSpec<Impl, Model>,
  factory: () => Impl,
): string | null {
  const byName = new Map(spec.ops.map((op) => [op.name, op] as const));
  for (const edge of spec.edges) {
    const impl = factory();
    const model = spec.model();
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
  const impl = factory();
  const model = spec.model();
  for (let index = 0; index < 500; index++) {
    const op = spec.ops[Math.floor(rng() * spec.ops.length)];
    if (!op) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (!Object.is(op.onImpl(impl, arg), op.onModel(model, arg))) {
      return `무작위 ${index}번째 ${op.name}`;
    }
  }
  return null;
}

function suiteFactory(make: Maker): () => VersionedSized {
  return () =>
    new VersionedSized((values) => make(values, firstNonZero, IDENTITY));
}

describe("축3 — 옛 버전 계약의 정본과 결함 계열(행 귀속)", () => {
  test("정본이 두 시나리오를 통과한다", () => {
    expect(verdicts(injected(makers.reference))).toEqual({
      [UPDATE]: { ok: true, stats: [21, 25, 29] },
      [QUERY]: { ok: true, stats: [55, 67, 79] },
    });
  });

  /** 자명한 구현 — 바뀐 자리만 적어 두고 물을 때 다시 모은다. 갱신은 상수로 통과하고 질의가 사슬 길이 + 폭이다. */
  test("바뀐 자리만 적어 두는 구현은 질의에서만 걸린다", () => {
    expect(verdicts(injected(makers.replaying))).toEqual({
      [UPDATE]: { ok: true, stats: [1, 1, 1] },
      [QUERY]: { ok: false, stats: [4092, 16380, 65532] },
    });
  });

  /** 살아 있는 구조를 버전 사이로 옮기는 구현 — 첫 버전과 사슬 끝을 번갈아 가리키면 두 행 모두 사슬 길이 × 로그다. */
  test("살아 있는 구조를 옮겨 다니는 구현은 두 행 모두 걸린다", () => {
    expect(verdicts(injected(makers.rerooting))).toEqual({
      [UPDATE]: { ok: false, stats: [22905, 106941, 492033] },
      [QUERY]: { ok: false, stats: [22565, 106541, 491573] },
    });
  });

  test("짓기를 미루는 구현은 질의에서만 걸린다", () => {
    expect(verdicts(injected(makers.buffered))).toEqual({
      [UPDATE]: { ok: true, stats: [1, 1, 1] },
      [QUERY]: { ok: false, stats: [22583, 106563, 491599] },
    });
  });

  /**
   * **옛 버전을 들고 있지 않는 구현은 축3을 정본과 같은 계급으로 통과한다**(질의 37 · 45 · 53 은 `segmentTree` 정본 그대로다).
   * 걸리는 축은 아래 축1 묶음이다 — 자기시험이 두 축을 나란히 적어야 「두 시나리오 통과」가 「계약을 지킨다」로 읽히지
   * 않는다(§「축1이 혼자 잡는 결함 fixture」).
   */
  test("옛 버전을 들고 있지 않는 구현은 두 시나리오를 통과한다", () => {
    expect(verdicts(injected(makers.latestOnly))).toEqual({
      [UPDATE]: { ok: true, stats: [21, 25, 29] },
      [QUERY]: { ok: true, stats: [37, 45, 53] },
    });
  });
});

describe("축3 — 두 행이 worst 인 근거", () => {
  function chainThenAlternate(
    qualifier: "worst" | "amortized",
  ): CostScenario<VersionedSized> {
    return {
      covers: ["update", "query"],
      qualifier,
      bound: "O(log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        let tip = 0;
        for (let step = 0; step < n; step++) {
          ctx.step(() => {
            tip = impl.update(tip, (step * 7) % n, (step % 5) + 1);
          });
        }
        for (let k = 0; k < n; k++) {
          const version = k % 2 === 0 ? 0 : tip;
          ctx.step(() => void impl.query(version, 1, n - 1));
        }
      },
    };
  }

  /**
   * **짓기를 미루는 계열은 호출열 평균으로는 정본과 같은 계급이다** — 갱신 n 번과 질의 n 번을 전부 잰 호출열에서 단일
   * 호출 최대는 걸리고 호출 평균은 통과한다. 정본이 두 행을 호출마다 지키므로 그 계열을 배제해도 잃는 것이 없다
   * (`range-query/segmentTreeLazy` 의 `bufferedLazyRangeFold` 와 같은 근거 — 불변 사실 179).
   */
  test("짓기를 미루는 계열은 worst 로 걸리고 amortized 로 통과한다", () => {
    const read = (make: Maker, qualifier: "worst" | "amortized") => {
      const verdict = judgeScenario(
        injected(make),
        chainThenAlternate(qualifier),
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
      bufferedWorst: read(makers.buffered, "worst"),
      bufferedAverage: read(makers.buffered, "amortized"),
      referenceWorst: read(makers.reference, "worst"),
    }).toEqual({
      bufferedWorst: { ok: false, stats: [22583, 106563, 491599] },
      bufferedAverage: { ok: true, stats: [39, 47, 55] },
      referenceWorst: { ok: true, stats: [55, 67, 79] },
    });
  });
});

describe("축1 — 옛 버전을 들고 있는가(불변 사실 67 의 셋째 걸음)", () => {
  test("정본과 축3 결함 계열 셋은 경계 케이스와 무작위 시퀀스를 전부 통과한다", () => {
    for (const make of [
      makers.reference,
      makers.replaying,
      makers.rerooting,
      makers.buffered,
    ]) {
      expect(
        firstBehaviorSplit(persistentSegmentTreeContract, suiteFactory(make)),
      ).toBeNull();
    }
  });

  test("제자리에서 고치는 구현은 첫 경계 케이스에서 옛 버전을 묻는 순간 갈린다", () => {
    expect(
      firstBehaviorSplit(
        persistentSegmentTreeContract,
        suiteFactory(makers.latestOnly),
      ),
    ).toBe(
      "갱신은 만든 차례의 번호를 돌려주고 바탕 버전은 그대로다 / 3번째 query — 관측 7 / 모델 0",
    );
  });

  /** 무작위 시퀀스의 버전 인자가 실제로 여러 버전에 퍼지는지 — 나눈 나머지 규칙의 효과(계약 스위트 머리말). */
  test("무작위 시퀀스가 버전 222 개를 짓고 거절 경로도 지난다", () => {
    const rng = rngFrom(1);
    const model = persistentSegmentTreeContract.model();
    const byOp = { update: 0, rejectedUpdate: 0, query: 0, rejectedQuery: 0 };
    for (let index = 0; index < 500; index++) {
      const op =
        persistentSegmentTreeContract.ops[
          Math.floor(rng() * persistentSegmentTreeContract.ops.length)
        ];
      if (!op) throw new Error("연산 목록이 비었다");
      const expected = op.onModel(model, op.arg(rng));
      if (op.name === "update") {
        byOp.update += 1;
        if (expected === "RangeError") byOp.rejectedUpdate += 1;
      } else {
        byOp.query += 1;
        if (expected === "RangeError") byOp.rejectedQuery += 1;
      }
    }
    expect({ ...byOp, versions: model.versions.length }).toEqual({
      update: 253,
      rejectedUpdate: 32,
      query: 247,
      rejectedQuery: 1,
      versions: 222,
    });
  });
});

describe("포섭 — segmentTree 계약과의 관계", () => {
  /** 이쪽 구현에 「마지막 버전 번호를 드는 껍데기」를 씌운 것. 저쪽 표면(`update(i, value)` · `query(from, to)`)을 낸다. */
  class LatestVersion {
    readonly #inner: Measured;
    #tip = 0;

    constructor(inner: Measured) {
      this.#inner = inner;
    }

    get __cost(): number {
      return this.#inner.__cost;
    }

    update(i: number, value: number): void {
      this.#tip = this.#inner.update(this.#tip, i, value);
    }

    query(from: number, to: number): number {
      return this.#inner.query(this.#tip, from, to);
    }
  }

  /**
   * **이쪽 계약이 저쪽을 담는다.** 이쪽 정본에 마지막 버전을 드는 껍데기만 씌우면 `segmentTree` 스위트의 경계 케이스 ·
   * 무작위 시퀀스 · 시나리오 셋을 전부 통과한다. 반대쪽은 아래 둘째 시험이다 — 저쪽 정본을 그대로 쓴 구현이 이쪽 축1 에서
   * 갈린다. **포섭은 「같다」가 아니라 「다르다」의 증거다**(불변 사실 43).
   */
  test("이쪽 정본에 마지막 버전을 드는 껍데기를 씌우면 segmentTree 스위트를 전부 통과한다", () => {
    expect(
      firstBehaviorSplit(
        segmentTreeContract,
        () =>
          new Sized(
            (values) =>
              new LatestVersion(new Reference(values, firstNonZero, IDENTITY)),
          ),
      ),
    ).toBeNull();
    const cost: CostSource<Sized> = {
      kind: "injected",
      make: (tick) =>
        new Sized(
          (values) =>
            new LatestVersion(
              new Reference(
                values,
                (a, b) => {
                  tick();
                  return firstNonZero(a, b);
                },
                IDENTITY,
              ),
            ),
        ),
    };
    expect(
      segmentTreeContract.scenarios.map((scenario) => {
        const verdict = judgeScenario(cost, scenario, "complexity");
        return { ok: verdict.ok, stats: verdict.points.map((p) => p.stat) };
      }),
    ).toEqual([
      { ok: true, stats: [21, 25, 29] },
      { ok: true, stats: [30, 36, 42] },
      { ok: true, stats: [55, 67, 79] },
    ]);
  });

  test("segmentTree 정본을 제자리에서 쓰는 구현은 이쪽 계약을 못 지킨다", () => {
    expect(
      firstBehaviorSplit(
        persistentSegmentTreeContract,
        suiteFactory(makers.latestOnly),
      ),
    ).not.toBeNull();
  });
});
