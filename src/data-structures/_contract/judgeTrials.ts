/**
 * 통계 판정의 순수부 — 판정 한계 · 상한 · 시행 계획의 타입.
 *
 * `./runTrials.ts` 가 워커를 띄워 시행을 돌리고, 여기 있는 함수가 **몇 번 돌려 얼마를 넘으면 떨어뜨리는가**를 정한다.
 * `./judge.ts`(축3 판정의 순수부)와 같은 자리이고, 구현을 돌리지 않으므로 워커 없이 시험한다.
 *
 * 규격의 정본은 `docs/ORD-006-conventions.md` 「원칙 B — 무작위 계약의 검증」 B5 와 그 적용 절(`S24`)이다. 요지만 옮긴다.
 *
 * - 시행 t 의 통계는 Z_t = (그 시행에서 확률 문장이 누르는 사건 중 벗어난 수) ÷ (사건 수) ∈ [0, 1] 이다.
 * - 판정은 S = Σ_{t=1..T} Z_t 가 한계 k 를 넘으면 떨어뜨린다.
 * - **[보장]** 입력이 구현 무작위와 독립으로 정해지고(B1) 시행끼리 독립이며(B3) 시행마다 E[Z_t] ≤ δ 이면
 *   P(S > k) ≤ exp(−T · D(k/T ‖ δ)) 다 — Hoeffding(1963) 정리 1(평균이 δ 이하인 [0, 1] 값 독립 변수의 합). D 는 베르누이
 *   상대 엔트로피(자연로그)다. 시행 안의 사건이 전부 함께 틀리는 구현은 Z_t 가 베르누이(δ)라 이 상한의 최악 경우 그 자체다.
 * - 한계 k 는 그 상한이 「스위트 한 번의 오판 목표 β ÷ 판정 수 J」 이하인 가장 작은 정수다.
 */

/** 스위트 한 번에서 계약을 지키는 구현을 떨어뜨릴 확률의 목표 β. 판정 수로 나눠 판정마다 쓴다(합집합 상한). */
export const SUITE_MISJUDGE = 1e-6;

/** 시행 수 T 를 고르는 목표 — 알려진 결함 fixture 를 놓칠 모형 확률(원칙 B 의 B5). 이 모형은 [경험]이다. */
export const FIXTURE_MISS = 1e-6;

/** 베르누이 상대 엔트로피 D(a ‖ p), 자연로그. 0 < p < 1, 0 ≤ a ≤ 1. */
export function relativeEntropy(a: number, p: number): number {
  const up = a === 0 ? 0 : a * Math.log(a / p);
  const down = a === 1 ? 0 : (1 - a) * Math.log((1 - a) / (1 - p));
  return up + down;
}

/**
 * Hoeffding 상대 엔트로피 상한 — 평균이 δ 이하인 [0, 1] 값 독립 변수 T 개의 합 S 에 대해 P(S > k) 의 상한.
 * k/T ≤ δ 면 상한이 서지 않아 1, k ≥ T 면 S > k 가 불가능해 0 이다.
 */
export function hoeffdingBound(
  trials: number,
  delta: number,
  limit: number,
): number {
  if (limit >= trials) return 0;
  const a = limit / trials;
  if (a <= delta) return 1;
  return Math.exp(-trials * relativeEntropy(a, delta));
}

/** 판정 하나의 한계와 그 [보장] 상한. */
export interface TrialLimit {
  /** S 가 이 값을 넘으면 떨어진다. */
  limit: number;
  /** 계약을 지키는 구현이 이 판정에서 떨어질 확률의 상한 exp(−T · D(k/T ‖ δ)). */
  bound: number;
}

/** 상한이 `budget` 이하가 되는 가장 작은 정수 한계. T 를 넘기지 않는다(k = T 면 상한 0). */
export function trialLimit(
  trials: number,
  delta: number,
  budget: number,
): TrialLimit {
  if (!(Number.isInteger(trials) && trials > 0))
    throw new RangeError(`시행 수 ${trials}`);
  if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
  for (let limit = Math.floor(trials * delta); limit < trials; limit++) {
    const bound = hoeffdingBound(trials, delta, limit);
    if (bound <= budget) return { limit, bound };
  }
  return { limit: trials, bound: 0 };
}

/** 0! ~ n! 의 자연로그. 이항 질량을 곱셈 누적 없이 셈하려고 한 번에 만든다. */
function logFactorials(n: number): Float64Array {
  const table = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++)
    table[i] = (table[i - 1] as number) + Math.log(i);
  return table;
}

/** P(Bin(n, p) ≤ k). 작은 쪽 꼬리를 더한다. [경험] 모형 계산에만 쓴다. */
export function binomialAtMost(n: number, p: number, k: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  const logFact = logFactorials(n);
  const logP = Math.log(p);
  const logQ = Math.log1p(-p);
  const mass = (j: number) =>
    Math.exp(
      (logFact[n] as number) -
        (logFact[j] as number) -
        (logFact[n - j] as number) +
        j * logP +
        (n - j) * logQ,
    );
  if (k < n * p) {
    let sum = 0;
    for (let j = 0; j <= k; j++) sum += mass(j);
    return Math.min(1, sum);
  }
  let upper = 0;
  for (let j = k + 1; j <= n; j++) upper += mass(j);
  return Math.max(0, 1 - upper);
}

/**
 * 시행 수를 고르는 모형 계산 — **[경험] 모형이지 [보장]이 아니다.** 결함 fixture 의 사건이 시행 안에서 서로 독립이고 벗어날
 * 확률이 `missRate` 라고 두면 T 시행의 벗어난 사건은 Bin(T · m, missRate) 이고, 그 수가 k · m 이하면 판정이 놓친다.
 * 놓칠 확률이 `FIXTURE_MISS` 이하가 되는 가장 작은 8 의 배수 T 를 돌려준다. 못 찾으면 `null`.
 */
export function trialsFor(
  delta: number,
  budget: number,
  missRate: number,
  eventsPerTrial: number,
  ceiling = 100_000,
): number | null {
  for (let trials = 8; trials <= ceiling; trials += 8) {
    const { limit } = trialLimit(trials, delta, budget);
    if (limit >= trials) continue;
    const miss = binomialAtMost(
      trials * eventsPerTrial,
      missRate,
      limit * eventsPerTrial,
    );
    if (miss <= FIXTURE_MISS) return trials;
  }
  return null;
}

/** 모형에서 결함 fixture 를 놓칠 확률 P(Bin(T · m, missRate) ≤ k · m). [경험] 모형. */
export function fixtureMiss(
  trials: number,
  limit: number,
  missRate: number,
  eventsPerTrial: number,
): number {
  return binomialAtMost(
    trials * eventsPerTrial,
    missRate,
    limit * eventsPerTrial,
  );
}

/**
 * 입력 seed 를 시행 번호 · 모양 번호와 섞은 32비트 값. **입력만 정하고 구현 무작위와 무관하다**(원칙 B 의 B1 · B2 (가)).
 * 같은 세 값이면 같은 입력이다.
 */
export function trialSeed(seed: number, trial: number, shape: number): number {
  let x = Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= Math.imul(trial + 1, 0xc2b2ae35);
  x = Math.imul(x ^ (x >>> 15), 0x27d4eb2f);
  x ^= Math.imul(shape + 1, 0x165667b1);
  x = Math.imul(x ^ (x >>> 13), 0x85ebca6b);
  return (x ^ (x >>> 16)) >>> 0;
}

// ── 시행 계획의 타입. 계약 스위트(`<name>.contract.ts`)가 값을 채우고 `./runTrials.ts` 가 읽는다 ──

/** 워커가 `import()` 로 읽을 모듈 주소와 그 안의 export 이름. 팩토리 함수는 워커 경계를 못 넘어서 이것으로 받는다. */
export interface ModuleExport {
  /** `import()` 에 넘길 주소. 파일 URL(`new URL("./x.ts", import.meta.url).href`) 또는 절대 경로. */
  module: string;
  exportName: string;
}

/**
 * 워커 안에서 도는 시행 함수의 모양은 `(make, params, input) => TrialResult` 다. `make(...params 의 값)` 이 구현 모듈의 export 를
 * `new` 로 부른다. 타입으로 묶지 않는 까닭은 워커가 `import()` 로 받아 부르는 값이라 타입 검사가 닿지 않기 때문이다 —
 * 모양을 어기면 워커가 던지고 판정이 떨어진다(`./runTrials.ts`).
 */

/** 한 시행에서 판정 하나가 센 값. */
export interface Tally {
  /** 확률 문장이 누르는 사건의 수. 0 보다 커야 한다. */
  events: number;
  /** 그중 벗어난 수. */
  misses: number;
  /** 벗어난 사건 중 첫 자리의 설명. 없으면 `null`. */
  first: string | null;
}

/** 시행 함수가 모양 하나에 대해 돌려주는 값. 워커에서 구조화 복제로 넘어온다. */
export interface TrialResult {
  /** 결정적 문장의 위반. 하나라도 있으면 한계 없이 떨어진다. 없으면 `null`. */
  violation: string | null;
  /** 판정 이름 → 센 값. 모양의 `judgments` 전부가 있어야 한다. */
  tallies: Record<string, Tally>;
  /** 이 시행에서 세운 인스턴스의 `__cost` 합. 계측기가 없으면 0. 비용 보고용이고 판정에 쓰지 않는다. */
  cost: number;
}

/** 모양 하나 — 같은 매개변수 · 같은 시행 수로 도는 판정 묶음. */
export interface TrialShape<Params, Input> {
  /** 보고용 이름. 예: `ε 0.001`. */
  name: string;
  /** 워커로 넘겨 시행 함수가 받는 매개변수. 구조화 복제가 되는 값이어야 한다. */
  params: Params;
  /** 이 모양의 시행 수 T. */
  trials: number;
  /** 이 모양이 세는 판정. `delta` 는 그 확률 문장의 δ 다. */
  judgments: readonly { id: string; delta: number }[];
  /**
   * 시행 t 의 입력. **seed · 시행 번호 · 이 모양만 읽는다** — 워커를 띄우기 전에 부르고 결과를 워커로 넘기므로 구현의 관측값에
   * 기댈 길이 없다(원칙 B 의 B1). 구조화 복제가 되는 값이어야 한다.
   */
  input(seed: number, trial: number, shape: number): Input;
}

/** 계약 스위트 하나의 통계 판정 계획. */
export interface TrialPlan<Params, Input> {
  /** 구조 이름. `describe` 라벨이 된다. */
  name: string;
  /** 시행 함수가 사는 모듈(보통 계약 스위트 자신의 `import.meta.url`)과 export 이름. */
  trial: ModuleExport;
  /** 입력 seed. 확률 공간이 아니다(원칙 B 의 B2 (가)). */
  seed: number;
  shapes: readonly TrialShape<Params, Input>[];
}

/** 판정 하나의 한계 표 — 계획에서 따라 나오는 값. 워커를 띄우지 않고 셈한다. */
export interface PlannedJudgment {
  shape: string;
  id: string;
  delta: number;
  trials: number;
  limit: number;
  bound: number;
}

/** 계획의 판정 전부에 한계를 매긴다. 판정마다 목표는 β ÷ J 다. */
export function planLimits(
  plan: TrialPlan<unknown, unknown>,
  beta = SUITE_MISJUDGE,
): PlannedJudgment[] {
  const count = plan.shapes.reduce(
    (sum, shape) => sum + shape.judgments.length,
    0,
  );
  const budget = beta / count;
  return plan.shapes.flatMap((shape) =>
    shape.judgments.map((judgment) => {
      const { limit, bound } = trialLimit(shape.trials, judgment.delta, budget);
      return {
        shape: shape.name,
        id: judgment.id,
        delta: judgment.delta,
        trials: shape.trials,
        limit,
        bound,
      };
    }),
  );
}
