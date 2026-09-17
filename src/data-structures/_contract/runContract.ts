/**
 * 규약2 계약 스위트 하네스.
 *
 * `runContract(factory, spec, target)` 는 팩토리로 받은 **아무 구현에나** 같은 스위트를 돌린다.
 * 학습자 스텁·정본(`_reference/`)·결함 fixture·나중의 Rust 포트가 모두 같은 계약을 받는다.
 *
 * 축은 넷이고 셋만 여기서 돈다.
 *
 * | 축 | 무엇 | 대상 |
 * |---|---|---|
 * | 축1 동작 | 자명한 참조 모델과 교차검증 + 결정적 경계 케이스 | 모든 구현 |
 * | 축2 불변식 | 매 연산 후 불변식 검사 | 불변식 절이 빈 구조는 공집합 |
 * | 축3 복잡도 | 성장률 $r = C(4n)/C(n)$ | 계측기가 붙은 구현만 |
 * | 축4 동시성 | 선형화·진행 보장 | **여기서 돌지 않는다.** Rust 하네스의 일 |
 *
 * 규격의 정본은 `docs/ORD-006-conventions.md` §규약2 다.
 */

import { describe, expect, test } from "bun:test";
import {
  type Bound,
  type Grade,
  type GrowthPoint,
  judgeGrowth,
  type Qualifier,
  RIGOR_OF_GRADE,
  rngFrom,
  SEEDS,
  SIZES,
  statistic,
} from "./judge";

/** 축1 — 무작위 교차검증의 연산 하나. */
export interface BehaviorOp<Impl, Model> {
  name: string;
  /** 무작위 인자. 인자가 없는 연산은 `undefined` 를 돌려준다. */
  arg(rng: () => number): unknown;
  /** 검사 대상에 적용하고 **관측값**을 돌려준다. 반환이 없는 연산은 `undefined`. */
  onImpl(impl: Impl, arg: unknown): unknown;
  /** 참조 모델에 같은 것을 적용한다. */
  onModel(model: Model, arg: unknown): unknown;
}

/** 축1 — 결정적 경계 케이스. 무작위로는 잘 안 나오는 상태를 손으로 짚는다. */
export interface EdgeCase {
  name: string;
  steps: readonly { op: string; arg?: unknown }[];
}

/** 축2 — 불변식 하나. 위반이면 설명을, 만족이면 `null` 을 돌려준다. */
export interface Invariant<Impl> {
  name: string;
  check(impl: Impl): string | null;
}

/**
 * 축3 — 걸음의 반환값에 거는 기대. 위반이면 설명을, 만족이면 `null` 을 돌려준다
 * (`Invariant.check` 와 같은 모양이다).
 *
 * **측정 실행은 이것을 평가하지 않는다.** 평가하는 것은 검증 실행(`./runValues.ts`)뿐이고,
 * 그쪽은 새 인스턴스에서 계측 없는 문맥으로 시나리오를 다시 돌린다 — 검증 비용이 측정할
 * 구현의 비용에 섞일 길이 구조로 없다.
 */
export type StepCheck = (observed: unknown) => string | null;

export interface ScenarioCtx {
  rng(): number;
  /**
   * 측정할 연산 하나를 감싼다. 감싸지 않은 호출은 준비 작업으로 취급되어 연산당 비용에
   * 들어가지 않는다(총 비용에는 들어간다).
   *
   * 둘째 인자는 **선택**이고 검증 실행만 읽는다(`StepCheck`). 주지 않으면 지금까지와 같고,
   * 주어도 측정 실행의 동작은 달라지지 않는다.
   */
  step(fn: () => unknown, check?: StepCheck): void;
}

/** 축3 — 시나리오 하나. 계약 표의 한 행 이상을 덮는다. */
export interface CostScenario<Impl> {
  /** 이 시나리오가 덮는 연산 계약 표의 행 이름들. */
  covers: readonly string[];
  qualifier: Qualifier;
  bound: Bound;
  /** 적대적 입력인가. `discriminating` 엄격도는 최소 하나를 요구한다. */
  adversarial: boolean;
  /** 크기 n 에서 시나리오를 수행한다. 측정할 연산은 `ctx.step` 으로 감싼다. */
  run(impl: Impl, n: number, ctx: ScenarioCtx): void;
  /**
   * **선택** — 시나리오가 끝난 상태에 거는 기대. 위반이면 설명을, 만족이면 `null`.
   *
   * 측정 실행은 부르지 않는다. 검증 실행(`./runValues.ts`)만 부른다 — 준비 작업이 남긴
   * 상태를 아무도 안 보는 자리가 여기였다(`docs/ORD-006-conventions.md` 「축3 시나리오의
   * 준비 상태는 아무도 값을 보지 않는다」).
   */
  endState?(impl: Impl, n: number): string | null;
}

export interface ContractSpec<Impl, Model> {
  /** 구조 이름. `describe` 라벨이 된다. */
  name: string;
  /** `<name>.ts` 헤더의 **검증 등급** 항목과 같은 값이어야 한다. */
  grade: Grade;
  model(): Model;
  ops: readonly BehaviorOp<Impl, Model>[];
  edges: readonly EdgeCase[];
  /** 헤더의 불변식 절이 "없다"면 빈 배열이다. 항목을 지우는 것과 다르다. */
  invariants: readonly Invariant<Impl>[];
  scenarios: readonly CostScenario<Impl>[];
}

/**
 * 축3 계측기.
 *
 * - `self-reported` — 구현이 `__cost` 로 스스로 보고한다. 주입점이 없는 구조의 유일한 경로다.
 * - `injected` — 위에 더해, 하네스가 **밖에서** 주입 콜백 호출 횟수를 센다. 자기 보고가
 *   외부 계수보다 작으면 보고가 거짓이므로 실패시킨다.
 */
export type CostSource<Impl> =
  | { kind: "self-reported"; make(): Impl & { __cost: number } }
  | { kind: "injected"; make(tick: () => void): Impl & { __cost: number } };

export interface Target<Impl> {
  /** 보고용 라벨. 예: `스텁`, `정본`. */
  label: string;
  /** 없으면 축3을 돌지 않는다. */
  cost?: CostSource<Impl>;
}

export interface Measurement {
  /** 연산당 비용. `ctx.step` 으로 감싼 것만 들어간다. */
  perOp: number[];
  /** 준비 작업을 포함한 총 비용(`__cost` 최종값). */
  total: number;
  /** 주입 콜백이 실제로 불린 횟수. `self-reported` 경로에서는 0. */
  ticks: number;
}

/** 시나리오를 크기 n · seed 하나로 실행하고 비용을 잰다. */
export function measureScenario<Impl>(
  cost: CostSource<Impl>,
  scenario: CostScenario<Impl>,
  n: number,
  seed: number,
): Measurement {
  let ticks = 0;
  const impl =
    cost.kind === "injected"
      ? cost.make(() => {
          ticks++;
        })
      : cost.make();

  const perOp: number[] = [];
  const ctx: ScenarioCtx = {
    rng: rngFrom(seed),
    step(fn) {
      const before = impl.__cost;
      fn();
      perOp.push(impl.__cost - before);
    },
  };
  scenario.run(impl, n, ctx);
  return { perOp, total: impl.__cost, ticks };
}

export interface ScenarioVerdict {
  ok: boolean;
  reason: string;
  points: GrowthPoint[];
}

/**
 * 시나리오 하나를 전 크기에 대해 재고 판정한다.
 *
 * 순수 함수는 아니지만(구현을 돌린다) 값을 돌려주므로 `bun:test` 없이 시험할 수 있다.
 * 결함 fixture 가 실제로 걸리는지 확인하는 자리가 이 함수다.
 */
export function judgeScenario<Impl>(
  cost: CostSource<Impl>,
  scenario: CostScenario<Impl>,
  grade: Grade,
): ScenarioVerdict {
  const rigor = RIGOR_OF_GRADE[grade];
  const points: GrowthPoint[] = [];

  for (const n of SIZES[rigor]) {
    const samples: number[][] = [];
    for (const seed of SEEDS[scenario.qualifier]) {
      const measured = measureScenario(cost, scenario, n, seed);

      if (cost.kind === "injected" && measured.total < measured.ticks) {
        return {
          ok: false,
          reason:
            `자기 보고 비용이 외부 계수보다 작다 — n=${n} 에서 __cost=${measured.total}, ` +
            `주입 호출=${measured.ticks}. 계측이 실제 작업량을 담고 있지 않다`,
          points,
        };
      }
      if (scenario.qualifier === "amortized" && measured.perOp.length < n) {
        return {
          ok: false,
          reason:
            `amortized 계약은 n 회 측정이 필요하다 — n=${n} 인데 측정 ${measured.perOp.length} 회. ` +
            "상각은 시퀀스 평균이라 짧은 시퀀스로는 판정되지 않는다",
          points,
        };
      }
      samples.push(measured.perOp);
    }
    points.push({ n, stat: statistic(scenario.qualifier, samples) });
  }

  const verdict = judgeGrowth(scenario.bound, rigor, points);
  return { ok: verdict.ok, reason: verdict.reason, points };
}

/**
 * 계약 스위트를 돌린다.
 *
 * `target.cost` 가 없으면 축1·축2만 돈다. 학습자 스텁이 그 경우다 — 스텁에 계측기를
 * 요구하지 않는다(§규약2 "계측은 계약이 아니다").
 */
export function runContract<Impl, Model>(
  factory: () => Impl,
  spec: ContractSpec<Impl, Model>,
  target: Target<Impl> = { label: "구현" },
): void {
  describe(`${spec.name} 계약 [${target.label}]`, () => {
    if (spec.grade === "concurrency") {
      test("축4 동시성 — TS 스위트는 이 등급을 판정하지 못한다", () => {
        throw new Error(
          `${spec.name} 은 concurrency 등급이다. 선형화·진행 보장은 단일 스레드 TS 에서 ` +
            "표현되지 않으므로 축4는 Rust 하네스가 돈다(규약4 (가) 등급). TS 스위트를 붙이지 않는다.",
        );
      });
      return;
    }

    const byName = new Map(spec.ops.map((op) => [op.name, op] as const));

    describe("축1 동작", () => {
      for (const edge of spec.edges) {
        test(`경계 — ${edge.name}`, () => {
          const impl = factory();
          const model = spec.model();
          edge.steps.forEach((step, index) => {
            const op = byName.get(step.op);
            if (!op)
              throw new Error(`경계 케이스가 없는 연산을 부른다: ${step.op}`);
            assertSame(op.onImpl(impl, step.arg), op.onModel(model, step.arg), {
              index,
              op: step.op,
              arg: step.arg,
            });
          });
        });
      }

      test("무작위 교차검증 — 참조 모델과 관측값이 매 연산 일치한다", () => {
        const rng = rngFrom(1);
        const impl = factory();
        const model = spec.model();
        for (let index = 0; index < RANDOM_OPS; index++) {
          const op = pick(spec.ops, rng);
          const arg = op.arg(rng);
          assertSame(op.onImpl(impl, arg), op.onModel(model, arg), {
            index,
            op: op.name,
            arg,
          });
        }
      });
    });

    describe("축2 불변식", () => {
      if (spec.invariants.length === 0) {
        test("불변식 절이 비어 있다 — 검사할 성질이 공집합이다", () => {
          expect(spec.invariants).toHaveLength(0);
        });
        return;
      }

      test("무작위 시퀀스 중 매 연산 후 전부 성립한다", () => {
        const rng = rngFrom(2);
        const impl = factory();
        for (let index = 0; index < INVARIANT_OPS; index++) {
          const op = pick(spec.ops, rng);
          op.onImpl(impl, op.arg(rng));
          for (const invariant of spec.invariants) {
            const violation = invariant.check(impl);
            if (violation !== null) {
              throw new Error(
                `${index}번째 ${op.name} 후 불변식 "${invariant.name}" 위반 — ${violation}`,
              );
            }
          }
        }
      });
    });

    const cost = target.cost;
    if (!cost) return;

    describe("축3 복잡도", () => {
      const rigor = RIGOR_OF_GRADE[spec.grade];

      test("계약 표의 각 행이 시나리오에 덮인다", () => {
        expect(spec.scenarios.length).toBeGreaterThan(0);
      });

      if (rigor === "discriminating") {
        test("적대적 입력 시나리오가 최소 하나 있다", () => {
          expect(spec.scenarios.some((scenario) => scenario.adversarial)).toBe(
            true,
          );
        });
      }

      for (const scenario of spec.scenarios) {
        const label = `${scenario.covers.join("·")} — ${scenario.qualifier} ${scenario.bound}`;
        test(scenario.adversarial ? `${label} (적대적)` : label, () => {
          const verdict = judgeScenario(cost, scenario, spec.grade);
          expect(verdict.ok ? "" : verdict.reason).toBe("");
        });
      }
    });
  });
}

/**
 * 축1 관측값 비교.
 *
 * `expect(...).toEqual(...)` 를 바로 쓰지 않는 이유는 **몇 번째 연산이 갈렸는지**가 축1의
 * 유일한 실마리이기 때문이다. 500 회 시퀀스에서 값 두 개만 보여 주는 실패는 재현이 어렵다.
 */
function assertSame(
  observed: unknown,
  expected: unknown,
  where: { index: number; op: string; arg: unknown },
): void {
  if (sameValue(observed, expected)) return;
  const arg = where.arg === undefined ? "" : format(where.arg);
  throw new Error(
    `${where.index}번째 ${where.op}(${arg}) — 관측 ${format(observed)} / 참조 모델 ${format(expected)}`,
  );
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    return a.every((item, i) => sameValue(item, b[i]));
  }
  return Object.is(a, b);
}

function format(value: unknown): string {
  if (value === undefined) return "undefined";
  return JSON.stringify(value) ?? String(value);
}

function pick<T>(items: readonly T[], rng: () => number): T {
  const chosen = items[Math.floor(rng() * items.length)];
  if (chosen === undefined)
    throw new Error("연산 목록이 비어 있어 시퀀스를 만들 수 없다");
  return chosen;
}

/** 축1 무작위 교차검증의 연산 수. */
const RANDOM_OPS = 500;

/**
 * 축2 무작위 시퀀스의 연산 수. 축1보다 짧다 — 매 연산 후 전 불변식을 다시 보므로
 * 검사 비용이 연산 수에 대해 제곱으로 는다.
 */
const INVARIANT_OPS = 200;
