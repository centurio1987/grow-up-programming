/**
 * `./expectedRepeat.ts` 자기시험 — 반복 축 둘이 **실제로 갈렸는지**를 수치로 고정한다.
 *
 * 규격의 정본은 그 파일의 머리말과 `docs/ORD-006-conventions.md` 「원칙 B 적용 — 축3 `expected` 반복 축
 * 둘」이다. 여기서 보는 것은 넷이다.
 *
 * | 무엇 | 왜 |
 * |---|---|
 * | 계획의 모양(단위 수 · 씨앗 · 시행 번호) | 「축이 둘」이 주석이 아니라 값이어야 한다 |
 * | 같은 씨앗의 시행이 **같은 입력 · 다른 인스턴스** | 축을 가른 목적이 이것 하나다 |
 * | 선언과 실제(`ctx.rng` 호출)의 대조 | 선언만 두면 시나리오가 바뀔 때 조용히 틀린다 |
 * | 탐침에서 걸음 평균과 걸음 합의 성장률이 같다 | H2 의 「합을 표본 하나로」를 코드 없이 만족한다는 근거 |
 *
 * 계측 수(비용)도 여기서 고정한다 — 판정 하나가 크기 한 점에서 인스턴스를 몇 개 세우는지가 이 규격의
 * 대가이고, 그 수가 말없이 바뀌면 안 된다.
 */

import { describe, expect, test } from "bun:test";
import {
  FIXED_SEED,
  fixedInput,
  INPUT_SEEDS,
  REPEAT_UNITS,
  repeatAxes,
  repeatPlan,
  seededInput,
} from "./expectedRepeat";
import { median, SEEDS, SIZES, statistic } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
  measureScenario,
} from "./runContract";

/** 탐침 걸음 수. n 과 무관한 상수라 「합을 표본 하나로」가 성립한다. */
const PROBE_STEPS = 16;

/** 인스턴스마다 무작위를 뽑는 구현. 걸음 하나가 로그에 ±1 흔들린다. */
class JitteredLog {
  __cost = 0;
  /** 인스턴스를 세울 때 한 번 뽑는다 — 시행이 갈리는 자리가 여기다. */
  private readonly bump = Math.random() < 0.5 ? 0 : 1;
  visit(n: number): void {
    this.__cost += Math.ceil(Math.log2(n)) + this.bump;
  }
}

/** 걸음 하나가 원소 수에 비례하는 결정론 구현. `O(log n)` 계약에서 걸려야 한다. */
class LinearWalk {
  __cost = 0;
  visit(n: number): void {
    this.__cost += n;
  }
}

interface Visitor {
  __cost: number;
  visit(n: number): void;
}

function source(make: () => Visitor): CostSource<Visitor> {
  return {
    kind: "self-reported",
    make: () => make() as Visitor & { __cost: number },
  };
}

/** 입력을 씨앗으로 짓지 않는 탐침 시나리오. */
function probeScenario(watch?: (impl: Visitor) => void): CostScenario<Visitor> {
  return fixedInput<Visitor>({
    covers: ["visit"],
    qualifier: "expected",
    bound: "O(log n)",
    adversarial: true,
    run: (impl, n, ctx) => {
      for (let step = 0; step < PROBE_STEPS; step++)
        ctx.step(() => {
          impl.visit(n);
        });
      watch?.(impl);
    },
  });
}

/** 입력을 씨앗으로 짓는 시나리오. 뽑은 값을 밖으로 흘려 입력열을 견줄 수 있게 한다. */
function seededScenario(
  watch?: (impl: Visitor, drawn: number[]) => void,
): CostScenario<Visitor> {
  return seededInput<Visitor>({
    covers: ["visit"],
    qualifier: "expected",
    bound: "O(log n)",
    adversarial: false,
    run: (impl, n, ctx) => {
      const drawn: number[] = [];
      for (let step = 0; step < PROBE_STEPS; step++) {
        drawn.push(ctx.rng());
        ctx.step(() => {
          impl.visit(n);
        });
      }
      watch?.(impl, drawn);
    },
  });
}

describe("축3 expected 반복 축 둘 — 계획의 모양", () => {
  test("선언이 없으면 옛 경로다 — 한정자별 seed 목록 그대로", () => {
    for (const qualifier of ["worst", "amortized", "expected"] as const) {
      const plan = repeatPlan({
        covers: ["x"],
        qualifier,
        bound: "O(1)",
        adversarial: false,
        run: () => {},
      });
      expect(plan.map((unit) => unit.seed)).toEqual([...SEEDS[qualifier]]);
      expect(plan.every((unit) => unit.trial === 0)).toBe(true);
    }
  });

  test("입력이 고정이면 씨앗 하나 × 시행 열 — 단위가 전부 시행 축이다", () => {
    const axes = repeatAxes(probeScenario());
    expect(axes).toEqual({ inputSeeds: [FIXED_SEED], trials: REPEAT_UNITS });
    const plan = repeatPlan(probeScenario());
    expect(plan.map((unit) => unit.seed)).toEqual(
      Array.from({ length: REPEAT_UNITS }, () => FIXED_SEED),
    );
    expect(plan.map((unit) => unit.trial)).toEqual(
      Array.from({ length: REPEAT_UNITS }, (_, i) => i),
    );
  });

  test("씨앗이 입력을 만들면 씨앗 둘 × 시행 다섯 — 축 둘의 곱이 예산과 같다", () => {
    const axes = repeatAxes(seededScenario());
    expect(axes).toEqual({
      inputSeeds: [...INPUT_SEEDS],
      trials: REPEAT_UNITS / INPUT_SEEDS.length,
    });
    const plan = repeatPlan(seededScenario());
    expect(plan.map((unit) => unit.seed)).toEqual([
      1, 1, 1, 1, 1, 2, 2, 2, 2, 2,
    ]);
    expect(plan.map((unit) => unit.trial)).toEqual([
      0, 1, 2, 3, 4, 0, 1, 2, 3, 4,
    ]);
  });

  test("나눔이 달라도 단위 수는 같다 — 계측 수가 시나리오 종류를 안 탄다", () => {
    expect(repeatPlan(probeScenario())).toHaveLength(REPEAT_UNITS);
    expect(repeatPlan(seededScenario())).toHaveLength(REPEAT_UNITS);
  });
});

describe("축3 expected 반복 축 둘 — 선언", () => {
  test("worst · amortized 는 규격 밖이라 감싸는 자리에서 던진다", () => {
    for (const qualifier of ["worst", "amortized"] as const)
      expect(() =>
        fixedInput({
          covers: ["x"],
          qualifier,
          bound: "O(1)",
          adversarial: false,
          run: () => {},
        }),
      ).toThrow(/expected 전용/);
  });

  test("한 시나리오에 선언은 하나다", () => {
    expect(() => seededInput(probeScenario())).toThrow(/이미 선언됐다/);
  });

  test("입력 고정이라 해 놓고 ctx.rng 를 읽으면 던진다", () => {
    const lying = fixedInput<Visitor>({
      covers: ["visit"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        ctx.rng();
        ctx.step(() => {
          impl.visit(n);
        });
      },
    });
    expect(() =>
      measureScenario(
        source(() => new JitteredLog()),
        lying,
        1 << 10,
        1,
      ),
    ).toThrow(/입력 고정으로 선언했는데 ctx.rng 를 1 번 읽었다/);
  });

  test("씨앗이 입력을 만든다 해 놓고 안 읽으면 던진다", () => {
    const lying = seededInput<Visitor>({
      covers: ["visit"],
      qualifier: "expected",
      bound: "O(log n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        ctx.step(() => {
          impl.visit(n);
        });
      },
    });
    expect(() =>
      measureScenario(
        source(() => new JitteredLog()),
        lying,
        1 << 10,
        1,
      ),
    ).toThrow(/한 번도 안 읽었다/);
  });
});

describe("축3 expected 반복 축 둘 — 같은 입력 · 다른 인스턴스", () => {
  test("같은 씨앗의 시행 열은 입력열이 한 자리도 안 다르고 인스턴스는 전부 새것이다", () => {
    const seen: { impl: Visitor; drawn: number[] }[] = [];
    const scenario = seededScenario((impl, drawn) => {
      seen.push({ impl, drawn });
    });
    const cost = source(() => new JitteredLog());
    for (const unit of repeatPlan(scenario))
      measureScenario(cost, scenario, 1 << 10, unit.seed);

    expect(seen).toHaveLength(REPEAT_UNITS);
    const bySeed = [seen.slice(0, 5), seen.slice(5, 10)];
    for (const block of bySeed)
      for (const run of block) expect(run.drawn).toEqual(block[0]?.drawn ?? []);
    // 씨앗이 다르면 입력열도 달라야 축이 헛돌지 않는다.
    expect(bySeed[0]?.[0]?.drawn).not.toEqual(bySeed[1]?.[0]?.drawn);
    // 인스턴스는 열 개가 전부 다른 객체다 — 구현 무작위가 다시 뽑힌 자리가 여기다.
    expect(new Set(seen.map((run) => run.impl)).size).toBe(REPEAT_UNITS);
  });

  test("입력이 고정인 시나리오는 씨앗을 바꿔도 같은 입력이다 — 그래서 씨앗 축이 하나다", () => {
    const seen: Visitor[] = [];
    const scenario = probeScenario((impl) => {
      seen.push(impl);
    });
    const cost = source(() => new JitteredLog());
    const first = measureScenario(cost, scenario, 1 << 10, 1);
    const other = measureScenario(cost, scenario, 1 << 10, 7);
    expect(first.perOp).toHaveLength(PROBE_STEPS);
    expect(other.perOp).toHaveLength(PROBE_STEPS);
    expect(new Set(seen).size).toBe(2);
  });
});

describe("축3 expected 반복 축 둘 — 탐침의 합과 평균", () => {
  test("걸음 수가 상수면 평균으로 잰 성장률과 합으로 잰 성장률이 같다", () => {
    const scenario = probeScenario();
    const cost = source(() => new JitteredLog());
    const byMean: number[] = [];
    const bySum: number[] = [];
    for (const n of SIZES.discriminating) {
      const samples = repeatPlan(scenario).map(
        (unit) => measureScenario(cost, scenario, n, unit.seed).perOp,
      );
      for (const perOp of samples) expect(perOp).toHaveLength(PROBE_STEPS);
      byMean.push(statistic("expected", samples));
      bySum.push(
        median(samples.map((perOp) => perOp.reduce((a, b) => a + b, 0))),
      );
    }
    for (let i = 1; i < byMean.length; i++) {
      const meanRatio = (byMean[i] as number) / (byMean[i - 1] as number);
      const sumRatio = (bySum[i] as number) / (bySum[i - 1] as number);
      expect(sumRatio).toBeCloseTo(meanRatio, 12);
    }
  });
});

describe("축3 expected 반복 축 둘 — 판정과 계측 수", () => {
  test("선언한 시나리오는 크기마다 인스턴스를 REPEAT_UNITS 개 세운다", () => {
    let built = 0;
    const cost: CostSource<Visitor> = {
      kind: "self-reported",
      make: () => {
        built++;
        return new JitteredLog();
      },
    };
    judgeScenario(cost, probeScenario(), "complexity");
    expect(built).toBe(REPEAT_UNITS * SIZES.discriminating.length);

    built = 0;
    judgeScenario(
      cost,
      {
        covers: ["visit"],
        qualifier: "expected",
        bound: "O(log n)",
        adversarial: true,
        run: (impl, n, ctx) => {
          for (let step = 0; step < PROBE_STEPS; step++)
            ctx.step(() => {
              impl.visit(n);
            });
        },
      },
      "complexity",
    );
    expect(built).toBe(SEEDS.expected.length * SIZES.discriminating.length);
  });

  test("무작위 정본 꼴은 통과하고 걸음이 원소 수에 비례하는 결정론은 걸린다", () => {
    const passed = judgeScenario(
      source(() => new JitteredLog()),
      probeScenario(),
      "complexity",
    );
    expect(passed.ok ? "" : passed.reason).toBe("");

    const caught = judgeScenario(
      source(() => new LinearWalk()),
      probeScenario(),
      "complexity",
    );
    expect(caught.ok).toBe(false);
    expect(caught.points.map((point) => point.stat)).toEqual([
      1 << 10,
      1 << 12,
      1 << 14,
    ]);
  });
});
