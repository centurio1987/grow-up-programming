/**
 * 통계 판정 러너 자기시험 — 한계 계산(`./judgeTrials.ts`)이 원칙 B 적용표와 같은가, 러너(`./runTrials.ts`)가 조용히 통과하지 않는가,
 * 워커마다 모듈을 새로 읽는가.
 *
 * **적용표와의 대조.** `docs/ORD-006-conventions.md` 「원칙 B」 적용표의 시행 수 T · 한계 k · [보장] 상한 · 스위트 한 번의 합 · 새 실행
 * 수 합(800)을 확률 다섯의 계획(`<name>.contract.ts` 의 `<name>Trials`)에서 **다시 셈해** 같음을 고정한다. 표는 사람이 적은 수라 계산을
 * 믿는다 — 어긋나면 이 시험이 먼저 떨어진다. T 자체는 fixture 를 놓칠 **모형 확률**로 고른 값이라 [경험]이고(`trialsFor`), 뻐꾸기 필터
 * ε 0.01 모양만 모형 최소값 8 대신 ε 0.1 과 워커를 함께 쓰려고 16 이다.
 *
 * **조용히 통과하지 않는다.** 시행 함수의 예외 · 없는 export · 모양이 틀린 결과 · 판정 이름 누락 · 결정적 위반 · 멈춘 워커(생존 감시)가
 * 전부 `ok: false` 와 까닭을 낸다. 판정 도구 모듈은 `./_fixtures/trialProbeModule.ts`.
 *
 * CI 의 `trials` 모드가 이 이름(`runTrials.`)으로 고른다(`tools/ci.ts`).
 */

import { describe, expect, test } from "bun:test";
import { bloomFilterTrials } from "../probabilistic/bloomFilter/bloomFilter.contract";
import { countMinSketchTrials } from "../probabilistic/countMinSketch/countMinSketch.contract";
import { cuckooFilterTrials } from "../probabilistic/cuckooFilter/cuckooFilter.contract";
import { hyperLogLogTrials } from "../probabilistic/hyperLogLog/hyperLogLog.contract";
import { minHashTrials } from "../probabilistic/minHash/minHash.contract";
import {
  binomialAtMost,
  fixtureMiss,
  hoeffdingBound,
  planLimits,
  SUITE_MISJUDGE,
  type TrialPlan,
  trialLimit,
  trialSeed,
  trialsFor,
} from "./judgeTrials";
import { HOST_TRIALS, runTrials, type TrialTarget } from "./runTrials";

const exp2 = (value: number) => value.toExponential(2);

/** 적용표 한 행 — 모양마다 [T, δ, k, 상한]. */
const TABLE: readonly {
  plan: TrialPlan<unknown, unknown>;
  shapes: readonly [number, number, number, string][];
  judgmentsPerShape: number;
  suite: string;
}[] = [
  {
    plan: bloomFilterTrials as TrialPlan<unknown, unknown>,
    shapes: [
      [16, 0.1, 11, "1.22e-7"],
      [312, 0.001, 7, "2.61e-7"],
    ],
    judgmentsPerShape: 1,
    suite: "3.83e-7",
  },
  {
    plan: cuckooFilterTrials as TrialPlan<unknown, unknown>,
    shapes: [
      [16, 0.1, 11, "1.22e-7"],
      [16, 0.01, 6, "3.58e-8"],
    ],
    judgmentsPerShape: 3,
    suite: "4.74e-7",
  },
  {
    plan: countMinSketchTrials as TrialPlan<unknown, unknown>,
    shapes: [
      [16, 0.1, 11, "1.22e-7"],
      [320, 0.01, 17, "3.39e-7"],
    ],
    judgmentsPerShape: 1,
    suite: "4.62e-7",
  },
  {
    plan: hyperLogLogTrials as TrialPlan<unknown, unknown>,
    shapes: [
      [16, 0.3, 15, "4.23e-7"],
      [56, 0.1, 21, "3.08e-7"],
    ],
    judgmentsPerShape: 1,
    suite: "7.31e-7",
  },
  {
    plan: minHashTrials as TrialPlan<unknown, unknown>,
    shapes: [
      [24, 0.1, 13, "4.84e-7"],
      [96, 0.05, 20, "4.19e-7"],
    ],
    judgmentsPerShape: 1,
    suite: "9.03e-7",
  },
];

describe("판정 한계 — Hoeffding 상대 엔트로피 상한", () => {
  test("상한의 끝 값 — k/T ≤ δ 면 1, k ≥ T 면 0", () => {
    expect(hoeffdingBound(16, 0.1, 1)).toBe(1);
    expect(hoeffdingBound(16, 0.1, 16)).toBe(0);
    expect(trialLimit(4, 0.9, 1e-12)).toEqual({ limit: 4, bound: 0 });
  });

  test("한계는 상한이 목표 이하인 가장 작은 정수다 — 한 칸 아래는 목표를 넘는다", () => {
    const { limit, bound } = trialLimit(312, 0.001, SUITE_MISJUDGE / 2);
    expect(bound).toBeLessThanOrEqual(SUITE_MISJUDGE / 2);
    expect(hoeffdingBound(312, 0.001, limit - 1)).toBeGreaterThan(
      SUITE_MISJUDGE / 2,
    );
  });

  test("상한은 몰린 구현(Z_t 가 베르누이(δ))의 정확한 꼬리보다 크다 — 상한이 최악 경우를 덮는다", () => {
    for (const [T, delta, k] of [
      [16, 0.1, 11],
      [312, 0.001, 7],
      [56, 0.1, 21],
      [96, 0.05, 20],
    ] as const) {
      const exact = 1 - binomialAtMost(T, delta, k);
      expect(exact).toBeLessThanOrEqual(hoeffdingBound(T, delta, k));
    }
  });
});

describe("판정 한계 — 원칙 B 적용표와 같다", () => {
  for (const row of TABLE) {
    test(`${row.plan.name} — 시행 수 · 한계 · [보장] 상한 · 스위트 한 번의 합`, () => {
      const limits = planLimits(row.plan);
      expect(limits).toHaveLength(row.shapes.length * row.judgmentsPerShape);
      const found = row.plan.shapes.map((shape) => {
        const mine = limits.filter((l) => l.shape === shape.name);
        const first = mine[0];
        if (first === undefined) throw new Error(`한계가 없다: ${shape.name}`);
        for (const other of mine) expect(other.limit).toBe(first.limit);
        return [first.trials, first.delta, first.limit, exp2(first.bound)];
      });
      expect(found).toEqual(row.shapes.map((shape) => [...shape]));
      expect(exp2(limits.reduce((sum, l) => sum + l.bound, 0))).toBe(row.suite);
    });
  }

  test("계획 다섯의 새 실행(워커) 수 합은 스위트 한 번에 800 이다", () => {
    const workers = TABLE.reduce(
      (sum, row) =>
        sum + Math.max(...row.plan.shapes.map((shape) => shape.trials)),
      0,
    );
    expect(workers).toBe(800);
  });

  test("[경험] 모형 — T 는 fixture 를 놓칠 모형 확률이 10^−6 이하인 가장 작은 8 의 배수다(뻐꾸기 ε 0.01 은 워커를 함께 쓰려고 16)", () => {
    const half = SUITE_MISJUDGE / 2;
    const sixth = SUITE_MISJUDGE / 6;
    expect([
      trialsFor(0.1, half, 1, 64),
      trialsFor(0.001, half, 0.0283, 64),
      trialsFor(0.1, sixth, 1, 64),
      trialsFor(0.01, sixth, 1, 64),
      trialsFor(0.1, half, 1, 64),
      trialsFor(0.01, half, 0.062, 64),
      trialsFor(0.3, half, 1, 4),
      trialsFor(0.1, half, 0.55, 4),
      trialsFor(0.1, half, 0.9, 4),
      trialsFor(0.05, half, 0.33, 4),
    ]).toEqual([16, 312, 16, 8, 16, 320, 16, 56, 24, 96]);
    expect(
      [
        fixtureMiss(312, 7, 0.0283, 64),
        fixtureMiss(320, 17, 0.062, 64),
        fixtureMiss(56, 21, 0.55, 4),
        fixtureMiss(24, 13, 0.9, 4),
        fixtureMiss(96, 20, 0.33, 4),
      ].map(exp2),
    ).toEqual(["1.29e-7", "3.89e-8", "1.05e-7", "2.21e-19", "9.38e-8"]);
  });
});

describe("입력 seed", () => {
  test("시행 번호 · 모양 번호가 다르면 섞은 값이 다르고, 같으면 같다", () => {
    expect(trialSeed(1, 0, 0)).toBe(trialSeed(1, 0, 0));
    const seen = new Set<number>();
    for (let t = 0; t < 400; t++)
      for (let shape = 0; shape < 3; shape++) seen.add(trialSeed(1, t, shape));
    expect(seen.size).toBe(1200);
  });
});

// ── 러너 ──

const PROBE = new URL("./_fixtures/trialProbeModule.ts", import.meta.url).href;
const TARGET: TrialTarget = {
  label: "fixture DrawCoin",
  implementation: { module: PROBE, exportName: "DrawCoin" },
};

function probePlan(
  exportName: string,
  trials: number,
  rate: number,
): TrialPlan<readonly [number], { events: number }> {
  return {
    name: "probe",
    trial: { module: PROBE, exportName },
    seed: 1,
    shapes: [
      {
        name: "probe",
        params: [rate],
        trials,
        judgments: [{ id: "coin", delta: 0.1 }],
        input: () => ({ events: 4 }),
      },
    ],
  };
}

describe("러너 — 워커마다 모듈 그래프를 새로 읽는다", () => {
  test("워커 여덟에서 모듈을 읽을 때 뽑은 값이 전부 다르다", async () => {
    const draws: string[] = [];
    for (let i = 0; i < 8; i++) {
      const verdict = await runTrials(probePlan("drawTrial", 1, 1), TARGET, {
        stopEarly: false,
      });
      expect(verdict.workers).toBe(1);
      draws.push(verdict.judgments[0]?.first ?? "");
    }
    expect(new Set(draws).size).toBe(8);
  });

  test("받은 시행 수 · 워커 수 · 합을 돌려준다 — 몫 0 인 시행 T 개면 통과하고 워커 수가 T 다", async () => {
    const verdict = await runTrials(probePlan("drawTrial", 12, 0), TARGET);
    expect(verdict.ok ? "" : verdict.reason).toBe("");
    expect([verdict.workers, verdict.trials, verdict.plannedTrials]).toEqual([
      12, 12, 12,
    ]);
    expect(verdict.judgments[0]?.sum).toBe(0);
  });

  test(`호스트 프로세스 하나가 워커를 ${HOST_TRIALS} 개까지 맡는다 — 시행 ${HOST_TRIALS + 1} 개면 호스트 둘`, async () => {
    const verdict = await runTrials(
      probePlan("drawTrial", HOST_TRIALS + 1, 0),
      TARGET,
    );
    expect(verdict.ok ? "" : verdict.reason).toBe("");
    expect([verdict.workers, verdict.hosts]).toEqual([HOST_TRIALS + 1, 2]);
  });

  test("몫 1 인 시행이 한계를 넘으면 떨어지고 [보장] 표기와 S · T · k 를 싣는다", async () => {
    const verdict = await runTrials(probePlan("drawTrial", 12, 1), TARGET, {
      parallel: 1,
    });
    expect(verdict.ok).toBe(false);
    const limit = trialLimit(12, 0.1, SUITE_MISJUDGE).limit;
    expect(verdict.workers).toBe(limit + 1);
    expect(verdict.reason).toContain("[보장] Hoeffding(1963) 정리 1");
    expect(verdict.reason).toContain(`한계 k = ${limit}`);
  });
});

describe("러너 — 조용히 통과하지 않는다", () => {
  const cases: [string, string, string][] = [
    ["시행 함수가 던진다", "throwingTrial", "시행 함수가 던졌다"],
    ["시행 모듈에 export 가 없다", "noSuchTrial", "함수 noSuchTrial 이 없다"],
    ["사건 수가 0 이다", "malformedTrial", "양의 정수가 아니다"],
    ["판정 이름을 빠뜨렸다", "missingJudgmentTrial", "값을 돌려주지 않았다"],
    ["결정적 문장을 어겼다", "violatingTrial", "결정적 문장 위반"],
  ];
  for (const [name, exportName, reason] of cases) {
    test(name, async () => {
      const verdict = await runTrials(probePlan(exportName, 4, 0), TARGET, {
        parallel: 1,
      });
      expect(verdict.ok).toBe(false);
      expect(verdict.reason).toContain(reason);
    });
  }

  test("구현 모듈에 생성자가 없다", async () => {
    const verdict = await runTrials(
      probePlan("drawTrial", 4, 0),
      {
        label: "없는 생성자",
        implementation: { module: PROBE, exportName: "NoSuchCoin" },
      },
      { parallel: 1 },
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("생성자 NoSuchCoin 이 없다");
  });

  test("워커 호스트 프로세스가 죽으면 떨어뜨린다", async () => {
    const verdict = await runTrials(probePlan("killHostTrial", 4, 0), TARGET, {
      parallel: 2,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain(
      "워커 호스트 프로세스가 결과를 다 내기 전에 끝났다",
    );
  });

  test("멈춘 워커는 생존 감시가 끊고 떨어뜨린다", async () => {
    const verdict = await runTrials(probePlan("spinningTrial", 2, 0), TARGET, {
      parallel: 2,
      deadlineMs: 300,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("워커 무응답");
  });
});
