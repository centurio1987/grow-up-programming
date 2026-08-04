/**
 * 축3(복잡도 계약) 판정의 순수 부분.
 *
 * 이 파일은 `bun:test` 에 의존하지 않는다. 그래서 하네스를 거치지 않고 판정 자체를
 * 시험할 수 있다 — 결함 fixture 를 넣었을 때 실제로 실패 판정이 나오는지 보려면
 * 판정이 값을 돌려주는 함수여야 한다.
 *
 * 규격의 정본은 `docs/ORD-006-conventions.md` §규약2 다. 여기 상수를 고칠 때는 거기도 고친다.
 */

export type Qualifier = "worst" | "amortized" | "expected";
export type Bound = "O(1)" | "O(log n)" | "O(n)";
export type Grade = "basic" | "invariant" | "complexity" | "concurrency";

/**
 * 축3 엄격도. 등급이 축을 켜고 끄는 것이 아니라 **엄격도를 가른다.**
 *
 * - `regression` — 클래스 이탈만 잡는다. O(1)/O(log n) 사이는 포기하고 O(n) 이탈을 잡는다.
 * - `discriminating` — 상한을 실제로 판별한다. 적대적 입력이 필수다.
 */
export type Rigor = "regression" | "discriminating";

export const RIGOR_OF_GRADE: Record<Grade, Rigor> = {
  basic: "regression",
  invariant: "regression",
  complexity: "discriminating",
  concurrency: "discriminating",
};

/** 입력 크기. 이웃한 값은 항상 4배여야 한다 — 판정이 $r = C(4n)/C(n)$ 이기 때문이다. */
export const SIZES: Record<Rigor, readonly number[]> = {
  regression: [1 << 10, 1 << 12],
  discriminating: [1 << 10, 1 << 12, 1 << 14],
};

/**
 * 허용치. `discriminating` 의 ±30% 는 전략(`docs/ORD-006-strategy.md:125`)이 정한 값이다.
 *
 * `regression` 의 ±60% 는 목표에서 유도했다. 회귀 수준의 목표는 등급 판별이 아니라 클래스
 * 이탈 감지다 — 연산당 O(1)(기대 비율 1.0)이라 적어 놓고 실제로 O(n)(4.0)인 것을 잡는 것.
 * 허용 상한 1.6 이 4.0 보다 한참 낮으므로 그 격차는 잡히고, 대신 1.0 과 O(log n) 의 1.2 는
 * 구분하지 않는다. 작은 n 에서 오는 잡음을 등급 오판으로 바꾸지 않기 위한 교환이다.
 */
export const TOLERANCE: Record<Rigor, number> = {
  regression: 0.6,
  discriminating: 0.3,
};

/**
 * 한정자별 seed 수.
 *
 * `expected` 만 여러 seed 를 돈다. 기대 시간 계약은 입력 하나로 판정할 수 없기 때문이다.
 */
export const SEEDS: Record<Qualifier, readonly number[]> = {
  worst: [1],
  amortized: [1],
  expected: [1, 2, 3, 4, 5],
};

/**
 * 연산 1회 비용이 $f(n)$ 일 때 $n \to 4n$ 에서 기대되는 비율 $f(4n)/f(n)$.
 *
 * 한정자는 이 값을 **바꾸지 않는다.** 한정자가 바꾸는 것은 무엇을 통계로 삼는지다
 * (`statistic` 참고). `worst` 든 `amortized` 든 연산당 O(log n) 이면 기대 비율은 같다.
 */
export function expectedRatio(bound: Bound, n: number): number {
  switch (bound) {
    case "O(1)":
      return 1;
    case "O(log n)":
      return Math.log2(4 * n) / Math.log2(n);
    case "O(n)":
      return 4;
  }
}

/**
 * 한정자별 대표 통계. 입력은 seed 별 "연산당 비용" 배열이다.
 *
 * - `worst` — 단일 연산 최대 비용
 * - `amortized` — 시퀀스 평균. 개별 연산의 일시적 증가는 실패로 보지 않는다
 * - `expected` — seed 별 평균의 중앙값
 */
export function statistic(
  qualifier: Qualifier,
  samples: readonly (readonly number[])[],
): number {
  if (samples.length === 0) return 0;

  if (qualifier === "worst") {
    let best = 0;
    for (const seed of samples) {
      for (const cost of seed) if (cost > best) best = cost;
    }
    return best;
  }

  const means = samples.map((seed) => {
    if (seed.length === 0) return 0;
    let sum = 0;
    for (const cost of seed) sum += cost;
    return sum / seed.length;
  });

  if (qualifier === "amortized") return means[0] ?? 0;
  return median(means);
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export interface GrowthPoint {
  /** 입력 크기. */
  n: number;
  /** 그 크기에서의 대표 통계(`statistic` 결과). */
  stat: number;
}

export interface RatioVerdict {
  from: number;
  to: number;
  /** 실측 비율 $r = \text{stat}(4n)/\text{stat}(n)$. */
  r: number;
  expected: number;
  lo: number;
  hi: number;
  ok: boolean;
}

export interface GrowthVerdict {
  ok: boolean;
  /** 실패 사유. 통과면 빈 문자열. */
  reason: string;
  ratios: RatioVerdict[];
}

/**
 * 성장률 판정. 이웃한 두 크기의 통계 비율이 기대 비율의 허용치 안에 드는지 본다.
 *
 * 절대 카운트를 보지 않는 이유는 그것이 특정 구현을 강제하기 때문이다(불변 사실 6).
 * "이동 횟수 n 회 이하" 같은 기준은 무엇이 이동인지를 이미 정해 버린다.
 */
export function judgeGrowth(
  bound: Bound,
  rigor: Rigor,
  points: readonly GrowthPoint[],
): GrowthVerdict {
  if (points.length < 2) {
    return {
      ok: false,
      reason: "측정점이 2개 미만이라 비율을 낼 수 없다",
      ratios: [],
    };
  }

  for (const point of points) {
    if (!(point.stat > 0)) {
      return {
        ok: false,
        reason: `n=${point.n} 의 계측값이 ${point.stat} 이다 — 계측이 비어 있으면 판정할 수 없다`,
        ratios: [],
      };
    }
  }

  const tolerance = TOLERANCE[rigor];
  const ratios: RatioVerdict[] = [];

  let lower: GrowthPoint | undefined;
  for (const upper of points) {
    if (lower !== undefined) {
      if (upper.n !== lower.n * 4) {
        return {
          ok: false,
          reason: `측정점이 4배 간격이 아니다 — ${lower.n} 다음이 ${upper.n}`,
          ratios: [],
        };
      }
      const expected = expectedRatio(bound, lower.n);
      const r = upper.stat / lower.stat;
      const lo = expected * (1 - tolerance);
      const hi = expected * (1 + tolerance);
      ratios.push({
        from: lower.n,
        to: upper.n,
        r,
        expected,
        lo,
        hi,
        ok: r >= lo && r <= hi,
      });
    }
    lower = upper;
  }

  const bad = ratios.filter((entry) => !entry.ok);
  if (bad.length === 0) return { ok: true, reason: "", ratios };

  const detail = bad
    .map(
      (entry) =>
        `${entry.from}->${entry.to}: r=${entry.r.toFixed(2)} ` +
        `(${bound} 기대 ${entry.expected.toFixed(2)}, 허용 ${entry.lo.toFixed(2)}~${entry.hi.toFixed(2)})`,
    )
    .join(" / ");
  return {
    ok: false,
    reason: `성장률이 ${bound} 계약을 벗어났다 — ${detail}`,
    ratios,
  };
}

/**
 * 결정적 난수원(mulberry32). seed 를 고정해야 실패를 재현할 수 있다.
 */
export function rngFrom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
