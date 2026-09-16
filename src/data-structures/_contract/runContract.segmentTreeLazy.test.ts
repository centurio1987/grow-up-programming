/**
 * 하네스 자기시험 — `range-query/segmentTreeLazy` 계약(구간 갱신을 가진 구간 질의 · T4-03).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 **계약을 어긴 구현을 실제로 떨어뜨리는지**, 그리고
 * **떨어뜨리지 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts`
 * 머리말과 같다(불변 사실 106·255).
 *
 * 묶음이 다섯이다 — 축3 결함 계열의 행 귀속, `worst` 의 근거, 축1 차례 변이, 주입 법칙(스위트 대수가 세 법칙을
 * 지키는가 · 법칙이 깨지면 답이 구현마다 갈리는가), 그리고 **자리 수 오전달이 스위트 둘째 벌에서만 관측된다**(S20).
 */

import { describe, expect, test } from "bun:test";
import { SegmentTreeLazy as Reference } from "../range-query/segmentTreeLazy/_reference/segmentTreeLazy";
import {
  type Act,
  addAct,
  addCompose,
  COUNTED_SLOTS,
  type Combine,
  type Compose,
  coverAct,
  coverCompose,
  firstNonZero,
  IDENTITY,
  LazySized,
  type SegmentTreeLazyContract,
  SLOTS,
  segmentTreeLazyContract,
  segmentTreeLazyCountedContract,
  sum,
} from "../range-query/segmentTreeLazy/segmentTreeLazy.contract";
import { BufferedLazyRangeFold } from "./_fixtures/bufferedLazyRangeFold";
import {
  MiscountedLazyRangeFold,
  type MiscountPolicy,
} from "./_fixtures/miscountedLazyRangeFold";
import {
  MisorderedLazyRangeFold,
  type MisorderPolicy,
} from "./_fixtures/misorderedLazyRangeFold";
import { PointwiseLazyRangeFold } from "./_fixtures/pointwiseLazyRangeFold";
import { ScanningLazyRangeFold } from "./_fixtures/scanningLazyRangeFold";
import { rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = SegmentTreeLazyContract & { __cost: number };
type Maker = (
  values: number[],
  combine: Combine,
  identity: number,
  act: Act,
  compose: Compose,
) => Measured;

/** 스위트 대수를 주입하고 세 함수의 호출을 밖에서 센다(`./segmentTreeLazy.test.ts` 와 같은 경로). */
function injected(make: Maker): CostSource<LazySized> {
  return {
    kind: "injected",
    make: (tick) =>
      new LazySized((values) =>
        make(
          values,
          (a, b) => {
            tick();
            return firstNonZero(a, b);
          },
          IDENTITY,
          (update, value, count) => {
            tick();
            return coverAct(update, value, count);
          },
          (later, earlier) => {
            tick();
            return coverCompose(later, earlier);
          },
        ),
      ),
  };
}

const makers = {
  reference: (v, c, i, a, o) => new Reference(v, c, i, a, o),
  scanning: (v, c, i, a, o) => new ScanningLazyRangeFold(v, c, i, a, o),
  pointwise: (v, c, i, a, o) => new PointwiseLazyRangeFold(v, c, i, a, o),
  buffered: (v, c, i, a, o) => new BufferedLazyRangeFold(v, c, i, a, o),
} satisfies Record<string, Maker>;

function misordered(policy: MisorderPolicy): Maker {
  return (v, c, i, a, o) => new MisorderedLazyRangeFold(v, c, i, a, o, policy);
}

const APPLY = "apply";
const QUERY = "query";

function verdicts(
  cost: CostSource<LazySized>,
): Record<string, { ok: boolean; stats: number[] }> {
  const result: Record<string, { ok: boolean; stats: number[] }> = {};
  for (const scenario of segmentTreeLazyContract.scenarios) {
    const verdict = judgeScenario(cost, scenario, "complexity");
    result[scenario.covers.join("·")] = {
      ok: verdict.ok,
      stats: verdict.points.map((point) => point.stat),
    };
  }
  return result;
}

describe("축3 — 구간 갱신 계약의 정본과 결함 계열(행 귀속)", () => {
  test("정본이 두 시나리오를 통과한다", () => {
    expect(verdicts(injected(makers.reference))).toEqual({
      [APPLY]: { ok: true, stats: [146, 178, 210] },
      [QUERY]: { ok: true, stats: [57, 69, 81] },
    });
  });

  test("값 배열은 둘 다 걸린다 — 자명한 구현", () => {
    expect(verdicts(injected(makers.scanning))).toEqual({
      [APPLY]: { ok: false, stats: [2046, 8190, 32766] },
      [QUERY]: { ok: false, stats: [2044, 8188, 32764] },
    });
  });

  /**
   * **B19 표 「단일 갱신만 하는 구현은 구간 갱신이 $O(k\log n)$ 이다」의 실물.** `range-query/segmentTree` 정본에 구간
   * 갱신을 자리 하나 바꾸기로 풀어 붙이면 갱신 시나리오에서만 걸린다(비율 4.59 · 4.52).
   */
  test("segmentTree 정본에 자리마다 바꾸기를 붙인 구현은 갱신에서만 걸린다", () => {
    expect(verdicts(injected(makers.pointwise))).toEqual({
      [APPLY]: { ok: false, stats: [27652, 126982, 573448] },
      [QUERY]: { ok: true, stats: [37, 45, 53] },
    });
  }, 60_000);

  test("갱신을 쌓아 두었다 질의 때 적용하는 구현은 질의에서만 걸린다", () => {
    expect(verdicts(injected(makers.buffered))).toEqual({
      [APPLY]: { ok: true, stats: [1, 1, 1] },
      [QUERY]: { ok: false, stats: [53853, 234460, 1021717] },
    });
  });
});

describe("축3 — 두 행이 worst 인 근거", () => {
  function narrowAppliesThenQueries(
    qualifier: "worst" | "amortized",
  ): CostScenario<LazySized> {
    return {
      covers: ["apply", "query"],
      qualifier,
      bound: "O(log n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let step = 0; step < n; step++) {
          const from = (step * 7) % (n - 4);
          ctx.step(() => impl.apply(from, from + 4, (step % 5) + 1));
        }
        for (let k = 0; k < n; k++) ctx.step(() => void impl.query(1, n - 1));
      },
    };
  }

  /**
   * **쌓아 두는 계열은 호출열 평균으로는 정본과 같은 계급이다** — 갱신 n 번과 질의 n 번을 전부 잰 호출열에서
   * 단일 호출 최대는 걸리고 호출 평균은 통과한다. 정본이 두 행을 호출마다 지키므로 그 계열을 배제해도 잃는 것이
   * 없다(`heap/vanEmdeBoasTree` 의 `flushingIntegerSet` 과 같은 근거).
   */
  test("쌓아 두는 계열은 worst 로 걸리고 amortized 로 통과한다", () => {
    const cost = injected(makers.buffered);
    const worst = judgeScenario(
      cost,
      narrowAppliesThenQueries("worst"),
      "complexity",
    );
    const average = judgeScenario(
      cost,
      narrowAppliesThenQueries("amortized"),
      "complexity",
    );
    expect({
      worst: worst.ok,
      worstStats: worst.points.map((point) => point.stat),
      average: average.ok,
      averageStats: average.points.map(
        (point) => Math.round(point.stat * 100) / 100,
      ),
    }).toEqual({
      worst: false,
      worstStats: [50650, 230490, 1016992],
      average: true,
      averageStats: [53.7, 63.13, 72.03],
    });
  }, 60_000);
});

/** 축1 경계 케이스에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit(make: Maker): string | null {
  const byName = new Map(
    segmentTreeLazyContract.ops.map((op) => [op.name, op] as const),
  );
  for (const edge of segmentTreeLazyContract.edges) {
    const impl = new LazySized((values) =>
      make(values, firstNonZero, IDENTITY, coverAct, coverCompose),
    );
    const model = segmentTreeLazyContract.model();
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
  return null;
}

describe("축1 — 접는 차례와 합성 차례가 관측된다", () => {
  test("정본과 축3 결함 계열 셋은 경계 케이스를 전부 통과한다", () => {
    for (const make of Object.values(makers)) {
      expect(firstBehaviorSplit(make)).toBeNull();
    }
  });

  /**
   * 정본에서 한 줄씩 뒤집은 변이 둘이 각자 겨눈 경계 케이스에서 갈리고, 축3 에서는 정본과 계측값이 한 자리도
   * 다르지 않다(불변 사실 72 — 걸리는 축이 축1 하나다).
   */
  test("접는 차례와 합성 차례를 뒤집은 변이는 경계 케이스에서만 갈린다", () => {
    expect(firstBehaviorSplit(misordered("fold"))).toBe(
      "갱신 뒤에도 왼쪽부터 접는다 — 차례를 바꾸면 답이 갈린다 / 4번째 query — 관측 9 / 모델 -3",
    );
    expect(firstBehaviorSplit(misordered("compose"))).toBe(
      "겹친 갱신은 나중 것이 이긴다 — 합성 차례를 바꾸면 답이 갈린다 / 2번째 query — 관측 5 / 모델 7",
    );
    for (const policy of ["fold", "compose"] as const) {
      expect(verdicts(injected(misordered(policy)))).toEqual(
        verdicts(injected(makers.reference)),
      );
    }
  });
});

describe("주입 법칙 — 스위트 대수가 세 법칙을 지키고, 법칙이 깨지면 답이 구현마다 갈린다", () => {
  const DOMAIN = [-2, -1, 0, 1, 2];

  function foldAll(values: readonly number[]): number {
    return values.reduce(firstNonZero, IDENTITY);
  }

  /** 길이 0~3 의 수열 전부. */
  function sequences(): number[][] {
    const result: number[][] = [[]];
    let frontier: number[][] = [[]];
    for (let length = 1; length <= 3; length++) {
      frontier = frontier.flatMap((prefix) =>
        DOMAIN.map((value) => [...prefix, value]),
      );
      result.push(...frontier);
    }
    return result;
  }

  test("결합법칙 · 분배 · 합성이 작은 정의역 전부에서 선다", () => {
    let checked = 0;
    for (const a of DOMAIN)
      for (const b of DOMAIN)
        for (const c of DOMAIN) {
          expect(firstNonZero(firstNonZero(a, b), c)).toBe(
            firstNonZero(a, firstNonZero(b, c)),
          );
        }
    for (const whole of sequences()) {
      for (let cut = 0; cut <= whole.length; cut++) {
        const left = whole.slice(0, cut);
        const right = whole.slice(cut);
        for (const update of DOMAIN) {
          checked += 1;
          expect(coverAct(update, foldAll(whole), whole.length)).toBe(
            firstNonZero(
              coverAct(update, foldAll(left), left.length),
              coverAct(update, foldAll(right), right.length),
            ),
          );
        }
      }
    }
    for (const later of DOMAIN)
      for (const earlier of DOMAIN)
        for (const value of DOMAIN)
          for (const count of [0, 1, 2, 3]) {
            expect(coverAct(coverCompose(later, earlier), value, count)).toBe(
              coverAct(later, coverAct(earlier, value, count), count),
            );
          }
    expect(coverAct(3, IDENTITY, 0)).toBe(IDENTITY);
    expect(checked).toBe(2930);
  });

  /**
   * **분배가 깨지면 계약의 답이 정해지지 않는다**(헤더 「필요충분조건」). 합 결합에 「자리마다 제곱」 갱신은 분배하지
   * 않는다 — `[1, 3]` 과 `[2, 2]` 는 합 4 · 자리 수 2 가 같은데 제곱한 뒤 합이 10 과 8 이다. 정본은 덮는 마디의 접은 값에
   * 갱신을 한 번 적용하므로 16 을 내고, 자리마다 적용하는 값 배열은 10 을 낸다.
   */
  test("분배하지 않는 갱신에서는 정본과 값 배열의 답이 갈린다", () => {
    const sum: Combine = (a, b) => a + b;
    const square: Act = (_update, value) => value * value;
    const squareTwice: Compose = (later) => later;
    for (const [values, expected] of [
      [[1, 3], 10],
      [[2, 2], 8],
    ] as const) {
      const scanning = new ScanningLazyRangeFold(
        [...values],
        sum,
        0,
        square,
        squareTwice,
      );
      const reference = new Reference([...values], sum, 0, square, squareTwice);
      scanning.apply(0, 2, 1);
      reference.apply(0, 2, 1);
      expect({
        scanning: scanning.query(0, 2),
        reference: reference.query(0, 2),
      }).toEqual({
        scanning: expected,
        reference: 16,
      });
    }
  });
});

describe("축1 — 자리 수 오전달은 둘째 벌(자리 수 대수)에서만 관측된다", () => {
  function miscounted(policy: MiscountPolicy): Maker {
    return (v, c, i, a, o) =>
      new MiscountedLazyRangeFold(v, c, i, a, o, policy);
  }

  /** 스위트 한 벌의 경계 케이스와 무작위 시퀀스(seed 1 · 500 회)에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
  function firstSplitIn(
    spec: typeof segmentTreeLazyContract,
    slots: number,
    build: (make: Maker) => (values: number[]) => Measured,
    make: Maker,
  ): string | null {
    const byName = new Map(spec.ops.map((op) => [op.name, op] as const));
    for (const edge of spec.edges) {
      const impl = new LazySized(build(make), slots);
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
    const impl = new LazySized(build(make), slots);
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

  const cover = (make: Maker) => (values: number[]) =>
    make(values, firstNonZero, IDENTITY, coverAct, coverCompose);
  const counted = (make: Maker) => (values: number[]) =>
    make(values, sum, 0, addAct, addCompose);

  test("두 벌이 시나리오 배열을 같은 객체로 쓰고 나머지는 따로 적는다", () => {
    expect(segmentTreeLazyCountedContract.scenarios).toBe(
      segmentTreeLazyContract.scenarios,
    );
    expect(segmentTreeLazyCountedContract.ops).not.toBe(
      segmentTreeLazyContract.ops,
    );
    expect(segmentTreeLazyCountedContract.edges).not.toBe(
      segmentTreeLazyContract.edges,
    );
    expect({ first: SLOTS, second: COUNTED_SLOTS }).toEqual({
      first: 16,
      second: 13,
    });
  });

  test("정본과 결함 계열 셋은 둘째 벌도 전부 통과한다", () => {
    for (const make of Object.values(makers)) {
      expect(
        firstSplitIn(
          segmentTreeLazyCountedContract,
          COUNTED_SLOTS,
          counted,
          make,
        ),
      ).toBeNull();
    }
  });

  /**
   * **불변 사실 175 가 적은 구멍이 첫째 벌에 실제로 있었다** — 자리 수를 늘 1 로 넘기는 변이와 부모 마디의 자리 수를
   * 내려보내는 변이가 첫째 벌의 경계 케이스 일곱과 무작위 500 회를 전부 통과한다. 둘째 벌은 첫 경계 케이스에서 둘 다 잡는다.
   */
  test("자리 수를 잘못 넘기는 변이 둘은 첫째 벌을 통과하고 둘째 벌 경계 케이스에서 갈린다", () => {
    const verdict = (policy: MiscountPolicy) => ({
      cover: firstSplitIn(
        segmentTreeLazyContract,
        SLOTS,
        cover,
        miscounted(policy),
      ),
      counted: firstSplitIn(
        segmentTreeLazyCountedContract,
        COUNTED_SLOTS,
        counted,
        miscounted(policy),
      ),
    });
    expect(verdict("one")).toEqual({
      cover: null,
      counted:
        "넓게 더한 뒤 쪼개 물으면 덮인 자리 수만큼 더해져 있다 / 2번째 query — 관측 2 / 모델 22",
    });
    expect(verdict("parent")).toEqual({
      cover: null,
      counted:
        "넓게 더한 뒤 쪼개 물으면 덮인 자리 수만큼 더해져 있다 / 3번째 query — 관측 41 / 모델 25",
    });
  });

  test("걸리는 축이 축1 하나다 — 두 대수 모두 축3 계측값이 정본과 같다", () => {
    const countedCost = (make: Maker): CostSource<LazySized> => ({
      kind: "injected",
      make: (tick) =>
        new LazySized(
          (values) =>
            make(
              values,
              (a, b) => {
                tick();
                return sum(a, b);
              },
              0,
              (update, value, count) => {
                tick();
                return addAct(update, value, count);
              },
              (later, earlier) => {
                tick();
                return addCompose(later, earlier);
              },
            ),
          COUNTED_SLOTS,
        ),
    });
    const reference = {
      [APPLY]: { ok: true, stats: [146, 178, 210] },
      [QUERY]: { ok: true, stats: [57, 69, 81] },
    };
    expect(verdicts(countedCost(makers.reference))).toEqual(reference);
    for (const policy of ["one", "parent"] as const) {
      expect(verdicts(injected(miscounted(policy)))).toEqual(reference);
      expect(verdicts(countedCost(miscounted(policy)))).toEqual(reference);
    }
  });

  test("둘째 벌의 대수가 세 법칙을 지키고 자리 수가 답에 곱해진다", () => {
    const DOMAIN = [-2, -1, 0, 1, 2];
    for (const a of DOMAIN)
      for (const b of DOMAIN)
        for (const c of DOMAIN) {
          expect(sum(sum(a, b), c)).toBe(sum(a, sum(b, c)));
        }
    for (const u of DOMAIN)
      for (const a of DOMAIN)
        for (const b of DOMAIN)
          for (const m of [0, 1, 2, 3])
            for (const k of [0, 1, 2, 3]) {
              expect(addAct(u, sum(a, b), m + k)).toBe(
                sum(addAct(u, a, m), addAct(u, b, k)),
              );
            }
    for (const later of DOMAIN)
      for (const earlier of DOMAIN)
        for (const value of DOMAIN)
          for (const count of [0, 1, 2, 3]) {
            expect(addAct(addCompose(later, earlier), value, count)).toBe(
              addAct(later, addAct(earlier, value, count), count),
            );
          }
    expect(addAct(3, 0, 0)).toBe(0);
    // 첫째 벌의 대수는 자리 수가 0 인지만 본다 — 1 과 5 가 같은 값을 낸다.
    expect(coverAct(3, 7, 1)).toBe(coverAct(3, 7, 5));
    expect(addAct(3, 7, 1)).not.toBe(addAct(3, 7, 5));
  });
});
