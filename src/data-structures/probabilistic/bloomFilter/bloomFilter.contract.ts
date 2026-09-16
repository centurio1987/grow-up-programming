/**
 * `probabilistic/bloomFilter` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./bloomFilter.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을
 * 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **확률 문장은 축1 통계 판정으로 본다 — `../../_contract/runTrials.ts`(2026-09-15 유저 결정 「축을 늘리지 않는다」 · 2026-09-16
 * 결재 「H1 러너」, `docs/ORD-006-conventions.md` 「원칙 B」 · 그 적용 절).** 무작위 시퀀스 · 경계 케이스는 결정적인 쪽만 대조한다.
 * 시행 하나(`bloomFilterTrial`)는 이렇다.
 *
 * 1. **새 워커 하나.** 헤더가 구현 무작위의 공유 범위를 「실행」으로 적었으므로 시행마다 새 실행이다(원칙 B 의 B3).
 * 2. **필터 하나.** 용량 128 로 세워 서로 다른 원소 128 개(`+<꼬리표>:<차례>`)를 넣고 넣은 원소가 전부 참인지 본다(결정적 — 어기면
 *    한계 없이 떨어진다). 넣지 않은 서로 다른 원소 64 개(`?<꼬리표>:<차례>`)를 묻는다. **원소는 워커를 띄우기 전에 seed · 시행
 *    번호 · 모양만으로 정한다**(B1). 줄지은 문자열이라 고정 해시가 약하면 드러나는 모양이다 — 출처가 구현 무작위라 어떤 묶음이든 입력이다.
 * 3. **Z_t** = (넣지 않은 원소 중 참의 수) ÷ 64. 모양마다 합 S = Σ Z_t 가 한계 k 를 넘으면 떨어진다.
 *
 * | 모양 | 시행 T | 한계 k | [보장] 상한 exp(−T · D(k/T ‖ ε)) |
 * |---|---|---|---|
 * | 용량 128 · ε 0.1 | 16 | 11 | 1.22 × 10^−7 |
 * | 용량 128 · ε 0.001 | 312 | 7 | 2.61 × 10^−7 |
 *
 * **[보장]** 계약을 지키는 어느 구현이든 한 판정에서 떨어질 확률이 위 상한 이하이고 스위트 한 번에 3.83 × 10^−7 이하다 —
 * Hoeffding(1963) 정리 1(평균이 ε 이하인 [0, 1] 값 독립 변수의 합). **전제 셋:** ① 입력이 구현 무작위와 독립으로 정해진다(위 2)
 * ② 시행끼리 독립 — 공유 범위가 실행이고 시행마다 새 워커다(워커 사이 `Math.random` 의 독립은 실행 환경의 전제이고 확인하지 않았다)
 * ③ 시행당 E[Z_t] ≤ ε — 확률 문장이 원소마다 ε 를 누르므로 기댓값의 선형성으로 선다(원소 사이 독립은 필요 없다). 그래서 **생성 때
 * 동전 하나로 넣지 않은 원소 전부에 참을 내는 구현도** 부당하게 더 떨어지지 않는다. k 는 「상한 ≤ 10^−6 ÷ 판정 수 2」 인 가장 작은
 * 정수다(`../../_contract/judgeTrials.ts`).
 *
 * **[경험]** T 는 목표를 읽지 않는 fixture(`FixedWidthBloomFilter`, 참의 몫을 0.0283 으로 둔 이항 모형)를 놓칠 모형 확률이 10^−6
 * 이하인 가장 작은 8 의 배수다(모형 확률 1.29 × 10^−7) — 모형이고 보장이 아니다. fixture 들의 실제 판정 수치 · 반복 수는
 * `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」 표.
 *
 * **넣지 않은 원소의 `has` 는 관측값에서 뺀다.** 한 번의 답은 참이든 거짓이든 계약을 지키므로 참조 모델이 대조할 값이
 * 없다. 껍데기가 넣은 원소를 기록하고(`add` 가 반환값이 없어 넣은 것은 전부 담긴다), 기록에 없는 원소의 `has` 는
 * 구현을 부르되 관측값을 `"not-added"` 로 바꾼다. 그 답들의 판정은 위 통계 판정이 독립 시행으로 한다.
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 생성자가 용량 · 목표 오차를 받으므로 축3 사다리를 오르려면 그 크기의 필터를
 * 다시 세워야 한다. `linear/bitArray` 처럼 **생성자 행을 축1 연산(`constructor`)으로
 * 부른다** — 받아들이면 새 필터로 바꾸고 기록을 비우며, `RangeError` 면 이전 필터를 그대로 둔다. 무작위 시퀀스는 크기를
 * 드물게, 기본 모양으로만 바꾼다(`docs/ORD-006-conventions.md` 「껍데기가 생성자 행을 축1 연산으로 부른다」의 규칙).
 *
 * **축3 시나리오의 n 은 용량이자 넣은 원소 수다.** 원소 길이 L 과 목표 오차 ε 는 상수로 눌러(§규약2 시나리오 규칙 3)
 * 헤더의 `O(L · log(1/ε))` 가 n 에 대해 `O(1)` 로 판정된다. 담긴 수가 비용에서 빠지는 것이 이 계약의 비용 조건이다.
 * 적대적 시나리오는 두지 않았다 — 입력이 비용을 가르려면 구현의 해시를 읽어야 하고 그런 입력은 시나리오가 아니다(불변
 * 사실 44).
 */

import { rngFrom } from "../../_contract/judge";
import {
  type TrialPlan,
  type TrialResult,
  trialSeed,
} from "../../_contract/judgeTrials";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **두 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface BloomFilterContract {
  add(item: string): void;
  has(item: string): boolean;
}

type Built = BloomFilterContract & { __cost?: number };

/** 필터를 세우는 함수. 스텁 · 정본 · fixture 가 같은 모양으로 넘긴다. */
export type FilterMaker = (
  capacity: number,
  falsePositiveRate: number,
) => Built;

/** 축1 무작위 시퀀스가 도는 기본 필터의 모양. */
const CAPACITY = 64;
const RATE = 0.01;

/** 범위 밖 생성 인자의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";
/** 넣지 않은 원소에 대한 `has` 의 관측값. 한 번의 답은 판정하지 않는다. */
const NOT_ADDED = "not-added";

function observe<T>(call: () => T): T | string {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 하네스용 껍데기. 필터 하나와 그 필터에 넣은 원소의 기록을 들고, `reset` 으로 새 필터로 바꾼다. */
export class SizedFilter {
  readonly #make: FilterMaker;
  #filter: Built;
  #added = new Set<string>();
  #carried = 0;

  constructor(make: FilterMaker) {
    this.#make = make;
    this.#filter = make(CAPACITY, RATE);
  }

  get __cost(): number {
    return this.#carried + (this.#filter.__cost ?? 0);
  }

  get filter(): BloomFilterContract {
    return this.#filter;
  }

  /** 새 필터로 바꾼다. 생성자가 던지면 이전 필터와 기록을 그대로 두고 그 예외를 올려보낸다. */
  reset(capacity: number, falsePositiveRate: number): void {
    const next = this.#make(capacity, falsePositiveRate);
    this.#carried += this.#filter.__cost ?? 0;
    this.#filter = next;
    this.#added = new Set<string>();
  }

  add(item: string): void {
    this.#filter.add(item);
    this.#added.add(item);
  }

  /** 넣은 원소면 구현의 답을, 아니면 구현을 부르되 `"not-added"` 를 돌려준다. */
  has(item: string): boolean | string {
    const answer = this.#filter.has(item);
    return this.#added.has(item) ? answer : NOT_ADDED;
  }
}

/** 축1 참조 모델. 넣은 원소의 집합 — 넣은 원소의 답만 결정적이므로 이것으로 충분하다. */
interface Model {
  added: Set<string>;
}

/** 축1 무작위 원소. 빈 문자열과 16비트 코드 단위(`가`)가 섞이도록 짧은 원소 40 개에서 고른다. */
const POOL: readonly string[] = (() => {
  const out = [""];
  let layer = [""];
  for (let length = 1; length <= 3; length++) {
    const next: string[] = [];
    for (const prefix of layer)
      for (const letter of ["a", "b", "가"]) next.push(prefix + letter);
    out.push(...next);
    layer = next;
  }
  return out;
})();

function someItem(rng: () => number): string {
  return POOL[Math.floor(rng() * POOL.length)] as string;
}

/**
 * 축1 무작위 생성 인자. 쉰에 마흔아홉은 생성자가 거절하는 값이라 필터가 그대로 남고, 받아들이는 값은 기본 모양
 * 하나다(`linear/bitArray` 의 규칙). 다른 모양(용량 0 · 1 · 넘치는 넣기)은 경계 케이스가 짚는다.
 */
function someShape(rng: () => number): [number, number] {
  if (rng() < 0.02) return [CAPACITY, RATE];
  const bad: [number, number][] = [
    [-1, RATE],
    [2.5, RATE],
    [CAPACITY, 0],
    [CAPACITY, 1],
  ];
  return bad[Math.floor(rng() * bad.length)] as [number, number];
}

/** 모델 쪽 생성 인자 판정 — 헤더 「주입 정책」의 조건. */
function validShape(capacity: number, falsePositiveRate: number): boolean {
  return (
    Number.isInteger(capacity) &&
    capacity >= 0 &&
    falsePositiveRate > 0 &&
    falsePositiveRate < 1
  );
}

/** 축3 시나리오용 원소 n 개. 길이를 10 으로 고정해 L 을 상수로 누른다. seed 가 꼬리표를 바꾼다. */
function corpus(n: number, rng: () => number, mark: string): string[] {
  const tag = Math.floor(rng() * 36 ** 3)
    .toString(36)
    .padStart(3, "0");
  return Array.from(
    { length: n },
    (_, i) => `${mark}${tag}${i.toString(36).padStart(6, "0")}`,
  );
}

export const bloomFilterContract: ContractSpec<SizedFilter, Model> = {
  name: "BloomFilter",
  grade: "basic",
  model: () => ({ added: new Set<string>() }),

  ops: [
    {
      name: "constructor",
      arg: (rng) => someShape(rng),
      onImpl: (impl, arg) => {
        const [capacity, rate] = arg as [number, number];
        return observe(() => impl.reset(capacity, rate));
      },
      onModel: (model, arg) => {
        const [capacity, rate] = arg as [number, number];
        if (!validShape(capacity, rate)) return OUT_OF_RANGE;
        model.added = new Set<string>();
        return undefined;
      },
    },
    {
      name: "add",
      arg: (rng) => someItem(rng),
      onImpl: (impl, arg) => impl.add(arg as string),
      onModel: (model, arg) => {
        model.added.add(arg as string);
        return undefined;
      },
    },
    {
      name: "has",
      arg: (rng) => someItem(rng),
      onImpl: (impl, arg) => impl.has(arg as string),
      onModel: (model, arg) =>
        model.added.has(arg as string) ? true : NOT_ADDED,
    },
  ],

  edges: [
    {
      name: "넣은 원소는 has 가 참이고, 같은 원소를 다시 넣어도 · 빈 문자열 · 16비트 글자도 참이다",
      steps: [
        { op: "add", arg: "a" },
        { op: "has", arg: "a" },
        { op: "add", arg: "a" },
        { op: "has", arg: "a" },
        { op: "add", arg: "" },
        { op: "has", arg: "" },
        { op: "add", arg: "가나" },
        { op: "has", arg: "가나" },
        { op: "has", arg: "a" },
      ],
    },
    {
      // 넣기 전의 답은 관측값에서 빠지고, 넣은 뒤의 답은 참이어야 한다.
      name: "넣지 않은 원소의 답은 한 번으로 판정하지 않고, 넣은 뒤에는 참이다",
      steps: [
        { op: "has", arg: "b" },
        { op: "add", arg: "b" },
        { op: "has", arg: "b" },
        { op: "has", arg: "ba" },
      ],
    },
    {
      // 확률 쪽 보장은 용량 이내에서만 서지만 결정적인 쪽은 넘겨도 선다.
      name: "용량을 넘겨 넣어도 넣은 원소는 전부 참이다",
      steps: [
        { op: "constructor", arg: [2, 0.5] },
        { op: "add", arg: "p" },
        { op: "add", arg: "q" },
        { op: "add", arg: "r" },
        { op: "add", arg: "s" },
        { op: "add", arg: "t" },
        { op: "has", arg: "p" },
        { op: "has", arg: "q" },
        { op: "has", arg: "r" },
        { op: "has", arg: "s" },
        { op: "has", arg: "t" },
      ],
    },
    {
      // 거절된 생성은 이전 필터와 그 안의 원소를 남긴다. 받아들인 생성은 기록을 비운다.
      name: "용량 0 은 정당하고, 음수 · 정수가 아닌 용량 · 0 이하 · 1 이상 오차는 RangeError 이며 이전 필터를 남긴다",
      steps: [
        { op: "add", arg: "k" },
        { op: "constructor", arg: [-1, 0.01] },
        { op: "constructor", arg: [2.5, 0.01] },
        { op: "constructor", arg: [8, 0] },
        { op: "constructor", arg: [8, 1] },
        { op: "constructor", arg: [8, -0.5] },
        { op: "constructor", arg: [8, 1.5] },
        { op: "has", arg: "k" },
        { op: "constructor", arg: [0, 0.01] },
        { op: "has", arg: "k" },
        { op: "add", arg: "k" },
        { op: "has", arg: "k" },
        { op: "constructor", arg: [1, 0.999] },
        { op: "add", arg: "k" },
        { op: "has", arg: "k" },
      ],
    },
  ],

  invariants: [],

  scenarios: [
    {
      // 용량 n 으로 세우고 서로 다른 원소 n 개를 넣는다. 넣은 원소를 목록에 늘어놓고 겹침을 훑는 계열이 여기서 걸린다.
      covers: ["add"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n, RATE);
        const filter = impl.filter;
        for (const item of corpus(n, ctx.rng, "+"))
          ctx.step(() => filter.add(item));
      },
    },
    {
      // 용량을 채운 뒤 넣은 원소와 넣지 않은 원소를 번갈아 묻는다. 담긴 것을 훑어 답하는 계열이 여기서 걸린다.
      covers: ["has"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n, RATE);
        const filter = impl.filter;
        const inside = corpus(n, ctx.rng, "+");
        const outside = corpus(n, ctx.rng, "?");
        for (const item of inside) filter.add(item);
        for (let i = 0; i < n; i++) {
          const item = (i % 2 === 0 ? inside[i] : outside[i]) as string;
          ctx.step(() => filter.has(item));
        }
      },
    },
  ],
};

// ── 축1 통계 판정 — `../../_contract/runTrials.ts` 가 시행마다 새 워커에서 `bloomFilterTrial` 을 부른다 ──

/** 통계 판정의 이름. 헤더 「오차 보장」의 확률 문장이다. */
const FALSE_POSITIVE = "넣지 않은 원소에 참";

/** 시행 하나의 필터 용량과 물을 원소 수. 파일 머리 설명 참고. */
const TRIAL_CAPACITY = 128;
const TRIAL_QUERIES = 64;

/** 시행 하나의 입력 — 넣을 원소와 물을 원소. 워커를 띄우기 전에 정해진다. */
export interface MembershipInput {
  added: readonly string[];
  absent: readonly string[];
}

/** 시행 t 의 입력. seed · 시행 번호 · 모양 번호와 용량만 읽는다(원칙 B 의 B1). */
export function membershipInput(
  capacity: number,
  seed: number,
  trial: number,
  shape: number,
): MembershipInput {
  const tag = Math.floor(
    rngFrom(trialSeed(seed, trial, shape))() * 36 ** 5,
  ).toString(36);
  return {
    added: Array.from({ length: capacity }, (_, i) => `+${tag}:${i}`),
    absent: Array.from({ length: TRIAL_QUERIES }, (_, i) => `?${tag}:${i}`),
  };
}

/** 시행 함수. 워커 안에서 필터 하나를 세워 넣고 묻는다. 판정은 하지 않는다. */
export function bloomFilterTrial(
  make: FilterMaker,
  params: readonly [number, number],
  input: MembershipInput,
): TrialResult {
  const [capacity, rate] = params;
  const filter = make(capacity, rate);
  for (const item of input.added) filter.add(item);
  let violation: string | null = null;
  for (const [index, item] of input.added.entries()) {
    if (!filter.has(item)) {
      violation = `거짓 음성 — ${index}번째로 넣은 원소가 has 거짓 (용량 ${capacity})`;
      break;
    }
  }
  let misses = 0;
  let first: string | null = null;
  for (const item of input.absent) {
    if (filter.has(item)) {
      misses++;
      first ??= `넣지 않은 원소 ${item} 에 참 (ε = ${rate})`;
    }
  }
  return {
    violation,
    tallies: {
      [FALSE_POSITIVE]: { events: input.absent.length, misses, first },
    },
    cost: filter.__cost ?? 0,
  };
}

function trialShape(rate: number, trials: number) {
  return {
    name: `용량 ${TRIAL_CAPACITY} · ε ${rate}`,
    params: [TRIAL_CAPACITY, rate] as const,
    trials,
    judgments: [{ id: FALSE_POSITIVE, delta: rate }],
    input: (seed: number, trial: number, shape: number) =>
      membershipInput(TRIAL_CAPACITY, seed, trial, shape),
  };
}

/** 통계 판정 계획. 시행 수는 `docs/ORD-006-conventions.md` 「원칙 B」 적용표 — 파일 머리 설명 참고. */
export const bloomFilterTrials: TrialPlan<
  readonly [number, number],
  MembershipInput
> = {
  name: "BloomFilter",
  trial: { module: import.meta.url, exportName: "bloomFilterTrial" },
  seed: 1,
  shapes: [trialShape(0.1, 16), trialShape(0.001, 312)],
};
