/**
 * `probabilistic/countMinSketch` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./countMinSketch.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그
 * 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **오차 판정은 `probabilistic/bloomFilter` 가 세운 방식을 그대로 쓴다**(`docs/ORD-006-conventions.md` 「A군 확률
 * 필터 둘」) — 축1 연산 하나(`overestimateCheck`)가 인자 `[ε, δ, seed]` 로 **새 스케치를 하나 세워** 판정을 불리언
 * 관측값으로 돌려주고 참조 모델은 늘 `true` 를 낸다. 하네스는 고치지 않았다. 판정은 이렇게 본다.
 *
 * 1. seed 로 정한 흐름을 넣는다 — 무거운 원소 ⌈1/(4ε)⌉ 개에 증분 3 과 5 를 따로 넣고(원소마다 빈도 8), 그 사이에 가벼운
 *    원소 ⌈2/ε⌉ 개를 증분 1 로 넣는다. 총증분 N 은 ε·N 이 4 안팎이 되는 크기라 **무거운 원소 하나와 같은 칸을 쓰면 그
 *    칸이 한계를 넘는다**. 원소는 `+<꼬리표>:h<차례>` · `+<꼬리표>:l<차례>` 의 줄지은 문자열이다 — 헤더가 확률의 출처를
 *    구현 무작위로 정했으므로 어떤 흐름이든 판정의 입력이 된다.
 * 2. 넣은 원소가 전부 추정 ≥ 실제 빈도인지 본다(결정적인 쪽).
 * 3. 넣지 않은 서로 다른 원소 `QUOTA / δ` 개(`?<꼬리표>:<차례>`, 실제 빈도 0)를 묻고, 추정이 0 보다 작으면 떨어뜨리고,
 *    **추정이 ε·N 을 넘은 원소의 수가 `MARGIN × QUOTA` 이하인지** 본다 — 헤더의 판정 문장 그대로다.
 *
 * **넣지 않은 원소를 물음으로 고른 이유.** 확률 문장은 어느 원소에나 서는데, 넣지 않은 원소는 실제 빈도가 0 이라 과대
 * 추정이 곧 추정이고 흐름의 모양이 판정에 드러나지 않게 원소를 얼마든지 지을 수 있다. 원소마다 확률 δ 로 한계를 넘는
 * 구현 — 확률 문장을 경계에서 지키는 구현 — 이 이 판정에서 떨어질 확률은 블룸 필터 판정과 같은 모양이라 체르노프
 * 부등식으로 e^{−64/3} 이하다. 그 구현을 판정 도구 fixture 로 두고 실측했다
 * (`../../_contract/_fixtures/boundaryOvercountSketch.ts`, 수치는 `../../_contract/runContract.countMinSketch.test.ts` 머리말).
 *
 * **한 번의 추정은 관측값에서 뺀다.** 한 번의 과대 추정은 계약을 지키므로 참조 모델이 대조할 값이 없다. 껍데기가 원소마다
 * 넣은 빈도를 기록하고, `estimate` 의 관측값을 「추정 ≥ 기록한 빈도」의 판정(`true` 또는 어긋남을 적은 문자열)으로 바꾼다
 * — `graph-repr/dag` 의 순서 판정과 같은 모양이다(불변 사실 284).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 생성자가 목표 오차 · 실패 확률을 받으므로 판정 연산이 새 스케치를 세우고, 생성자
 * 행은 `linear/bitArray` 처럼 축1 연산(`constructor`)으로 부른다 — 받아들이면 새 스케치로 바꾸고 기록을 비우며, `RangeError`
 * 면 이전 스케치를 그대로 둔다(「껍데기가 생성자 행을 축1 연산으로 부른다」의 규칙).
 *
 * **축3 시나리오의 n 은 넣은 서로 다른 원소의 수다.** 원소 길이 L 과 ε · δ 는 상수로 눌러(§규약2 시나리오 규칙 3) 헤더의
 * `O(L · log(1/δ))` 가 n 에 대해 `O(1)` 로 판정된다. 서로 다른 원소 수가 비용에서 빠지는 것이 이 계약의 비용 조건이다.
 * 적대적 시나리오는 두지 않았다 — 비용을 가르는 입력은 구현의 해시를 읽어야 지어진다(불변 사실 44).
 */

import { rngFrom } from "../../_contract/judge";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **두 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface CountMinSketchContract {
  update(item: string, count: number): void;
  estimate(item: string): number;
}

type Built = CountMinSketchContract & { __cost?: number };

/** 스케치를 세우는 함수. 스텁 · 정본 · fixture 가 같은 모양으로 넘긴다. */
export type SketchMaker = (epsilon: number, delta: number) => Built;

/** 축1 무작위 시퀀스가 도는 기본 스케치의 모양. */
const EPSILON = 0.01;
const DELTA = 0.01;

/** 판정 한 번에서 넣지 않은 원소 중 한계를 넘기를 기대하는 수 — `N_q · δ`. 파일 머리 설명 참고. */
export const QUOTA = 64;
/** 헤더가 정한 여유. 넘은 원소가 `MARGIN × QUOTA` 를 넘으면 떨어진다. */
export const MARGIN = 2;
/** 무거운 원소 하나의 빈도. 두 번에 나눠 넣는다. */
const HEAVY_PARTS = [3, 5] as const;

/** 범위 밖 인자의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";

function observe<T>(call: () => T): T | string {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 판정 흐름의 모양. 자기시험 · 탐침이 같은 흐름을 쓰도록 내보낸다. */
export function streamShape(epsilon: number): {
  heavy: number;
  light: number;
  total: number;
} {
  const heavy = Math.ceil(1 / (4 * epsilon));
  const light = Math.ceil(2 / epsilon);
  return {
    heavy,
    light,
    total: heavy * (HEAVY_PARTS[0] + HEAVY_PARTS[1]) + light,
  };
}

/** 판정 한 번의 수치. 자기시험과 탐침이 한계를 바꿔 보려고 판정과 나눠 둔다. */
export interface Overcount {
  /** 넣은 원소 중 추정이 실제 빈도보다 작았던 첫 자리. 없으면 `null`. */
  under: string | null;
  /** 넣지 않은 원소 중 추정이 ε·N 을 넘은 수. */
  hits: number;
  queries: number;
  total: number;
}

/** 새 스케치를 세워 흐름을 넣고 묻는다. 판정은 하지 않고 센 값을 돌려준다. */
export function measureOvercount(
  make: SketchMaker,
  epsilon: number,
  delta: number,
  seed: number,
): Overcount {
  const sketch = make(epsilon, delta);
  const tag = Math.floor(rngFrom(seed)() * 36 ** 5).toString(36);
  const { heavy, light, total } = streamShape(epsilon);
  const truth = new Map<string, number>();
  const put = (item: string, count: number) => {
    sketch.update(item, count);
    truth.set(item, (truth.get(item) ?? 0) + count);
  };
  for (let i = 0; i < heavy; i++) put(`+${tag}:h${i}`, HEAVY_PARTS[0]);
  for (let i = 0; i < light; i++) put(`+${tag}:l${i}`, 1);
  for (let i = 0; i < heavy; i++) put(`+${tag}:h${i}`, HEAVY_PARTS[1]);

  const queries = Math.round(QUOTA / delta);
  for (const [item, frequency] of truth) {
    const guess = sketch.estimate(item);
    if (!(guess >= frequency))
      return {
        under: `과소 추정 — ${item} 의 추정 ${guess} < 실제 ${frequency}`,
        hits: 0,
        queries,
        total,
      };
  }
  const threshold = epsilon * total + 1e-9;
  let hits = 0;
  for (let i = 0; i < queries; i++) {
    const guess = sketch.estimate(`?${tag}:${i}`);
    if (!(guess >= 0))
      return {
        under: `과소 추정 — 넣지 않은 원소의 추정 ${guess} < 0`,
        hits,
        queries,
        total,
      };
    if (guess > threshold) hits++;
  }
  return { under: null, hits, queries, total };
}

/**
 * 오차 판정 하나. 통과하면 `true`, 아니면 처음 어긋난 자리를 적은 문자열을 돌려준다.
 * 자기시험과 탐침이 같은 판정을 쓰도록 내보낸다.
 */
export function judgeOverestimates(
  make: SketchMaker,
  epsilon: number,
  delta: number,
  seed: number,
): true | string {
  const m = measureOvercount(make, epsilon, delta, seed);
  if (m.under !== null) return m.under;
  const limit = MARGIN * QUOTA;
  if (m.hits <= limit) return true;
  return (
    `과대 추정 초과 ${m.hits} / 한계 ${limit} — 총증분 ${m.total} 뒤 넣지 않은 원소 ${m.queries} 개를 물었다` +
    `(ε = ${epsilon}, δ = ${delta}, 여유 ${MARGIN})`
  );
}

/** 하네스용 껍데기. 스케치 하나와 원소마다 넣은 빈도의 기록을 들고, `reset` 으로 새 스케치로 바꾼다. */
export class SizedSketch {
  readonly #make: SketchMaker;
  #sketch: Built;
  #truth = new Map<string, number>();
  #carried = 0;

  constructor(make: SketchMaker) {
    this.#make = make;
    this.#sketch = make(EPSILON, DELTA);
  }

  get __cost(): number {
    return this.#carried + (this.#sketch.__cost ?? 0);
  }

  get sketch(): CountMinSketchContract {
    return this.#sketch;
  }

  /** 새 스케치로 바꾼다. 생성자가 던지면 이전 스케치와 기록을 그대로 두고 그 예외를 올려보낸다. */
  reset(epsilon: number, delta: number): void {
    const next = this.#make(epsilon, delta);
    this.#carried += this.#sketch.__cost ?? 0;
    this.#sketch = next;
    this.#truth = new Map<string, number>();
  }

  /** 받아들인 증분만 기록한다. 던지면 기록하지 않고 예외를 올려보낸다. */
  update(item: string, count: number): void {
    this.#sketch.update(item, count);
    this.#truth.set(item, (this.#truth.get(item) ?? 0) + count);
  }

  /** 추정이 기록한 빈도 이상이면 `true`, 아니면 어긋남을 적은 문자열. */
  estimate(item: string): true | string {
    const guess = this.#sketch.estimate(item);
    const frequency = this.#truth.get(item) ?? 0;
    return guess >= frequency ? true : `추정 ${guess} < 실제 빈도 ${frequency}`;
  }

  judge(epsilon: number, delta: number, seed: number): true | string {
    return judgeOverestimates(this.#make, epsilon, delta, seed);
  }
}

/** 축1 참조 모델. 받아들인 증분의 합 — 넘치는 증분의 거절을 가를 때만 쓴다. 추정은 결정적인 쪽만 판정하므로 빈도를 들 필요가 없다. */
interface Model {
  total: number;
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

/** 축1 무작위 증분. 열에 아홉은 0 ~ 5, 나머지는 헤더가 거절하는 값(음수 · 정수 아님 · 안전한 정수 밖)이다. */
function someUpdate(rng: () => number): [string, number] {
  const item = someItem(rng);
  if (rng() < 0.9) return [item, Math.floor(rng() * 6)];
  const bad = [-1, 1.5, 2 ** 53];
  return [item, bad[Math.floor(rng() * bad.length)] as number];
}

/**
 * 축1 무작위 생성 인자. 쉰에 마흔아홉은 생성자가 거절하는 값이라 스케치가 그대로 남고, 받아들이는 값은 기본 모양
 * 하나다(`linear/bitArray` 의 규칙). 다른 모양은 판정 연산 · 경계 케이스가 짚는다.
 */
function someShape(rng: () => number): [number, number] {
  if (rng() < 0.02) return [EPSILON, DELTA];
  const bad: [number, number][] = [
    [0, DELTA],
    [1, DELTA],
    [EPSILON, 0],
    [EPSILON, 1],
  ];
  return bad[Math.floor(rng() * bad.length)] as [number, number];
}

/** 축1 무작위 판정 인자. 가벼운 모양 넷 중 하나와 seed. 파일 머리 설명 참고. */
function someCheck(rng: () => number): [number, number, number] {
  const epsilon = rng() < 0.5 ? 0.1 : 0.01;
  const delta = rng() < 0.5 ? 0.1 : 0.01;
  return [epsilon, delta, Math.floor(rng() * 0x7fff_ffff)];
}

/** 모델 쪽 생성 인자 판정 — 헤더 「주입 정책」의 조건. */
function validShape(epsilon: number, delta: number): boolean {
  return epsilon > 0 && epsilon < 1 && delta > 0 && delta < 1;
}

/** 모델 쪽 증분 판정 — 헤더 「주입 정책」의 조건. */
function validCount(total: number, count: number): boolean {
  return (
    Number.isSafeInteger(count) &&
    count >= 0 &&
    count <= Number.MAX_SAFE_INTEGER - total
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

export const countMinSketchContract: ContractSpec<SizedSketch, Model> = {
  name: "CountMinSketch",
  grade: "basic",
  model: () => ({ total: 0 }),

  ops: [
    {
      name: "constructor",
      arg: (rng) => someShape(rng),
      onImpl: (impl, arg) => {
        const [epsilon, delta] = arg as [number, number];
        return observe(() => impl.reset(epsilon, delta));
      },
      onModel: (model, arg) => {
        const [epsilon, delta] = arg as [number, number];
        if (!validShape(epsilon, delta)) return OUT_OF_RANGE;
        model.total = 0;
        return undefined;
      },
    },
    {
      name: "update",
      arg: (rng) => someUpdate(rng),
      onImpl: (impl, arg) => {
        const [item, count] = arg as [string, number];
        return observe(() => impl.update(item, count));
      },
      onModel: (model, arg) => {
        const [, count] = arg as [string, number];
        if (!validCount(model.total, count)) return OUT_OF_RANGE;
        model.total += count;
        return undefined;
      },
    },
    {
      name: "estimate",
      arg: (rng) => someItem(rng),
      onImpl: (impl, arg) => impl.estimate(arg as string),
      onModel: () => true,
    },
    {
      name: "overestimateCheck",
      arg: (rng) => someCheck(rng),
      onImpl: (impl, arg) => {
        const [epsilon, delta, seed] = arg as [number, number, number];
        return impl.judge(epsilon, delta, seed);
      },
      onModel: () => true,
    },
  ],

  edges: [
    {
      name: "넣은 원소의 추정은 실제 빈도 이상이다 — 증분 0 · 빈 문자열 · 16비트 글자 · 여러 번 나눠 넣기",
      steps: [
        { op: "update", arg: ["a", 3] },
        { op: "estimate", arg: "a" },
        { op: "update", arg: ["a", 2] },
        { op: "estimate", arg: "a" },
        { op: "update", arg: ["b", 0] },
        { op: "estimate", arg: "b" },
        { op: "update", arg: ["", 7] },
        { op: "estimate", arg: "" },
        { op: "update", arg: ["가나", 1] },
        { op: "estimate", arg: "가나" },
        { op: "estimate", arg: "a" },
      ],
    },
    {
      // 넣지 않은 원소의 한 번의 추정은 0 보다 커도 된다 — 0 이상만 결정적이다.
      name: "넣지 않은 원소의 추정은 0 이상이고, 넣은 뒤에는 넣은 빈도 이상이다",
      steps: [
        { op: "estimate", arg: "z" },
        { op: "update", arg: ["y", 4] },
        { op: "estimate", arg: "z" },
        { op: "update", arg: ["z", 1] },
        { op: "estimate", arg: "z" },
        { op: "estimate", arg: "y" },
      ],
    },
    {
      // 거절된 증분은 상태를 바꾸지 않는다 — 음수가 칸에 들어가면 뒤의 추정이 실제 빈도 아래로 내려간다.
      name: "음수 · 정수가 아닌 증분 · 안전한 정수 밖의 증분은 RangeError 이고 넣은 원소의 추정을 내리지 않는다",
      steps: [
        { op: "update", arg: ["p", 5] },
        { op: "update", arg: ["p", -3] },
        { op: "estimate", arg: "p" },
        { op: "update", arg: ["p", 0.5] },
        { op: "update", arg: ["p", 2 ** 53] },
        { op: "update", arg: ["q", -1] },
        { op: "estimate", arg: "p" },
        { op: "estimate", arg: "q" },
        { op: "update", arg: ["p", 1] },
        { op: "estimate", arg: "p" },
      ],
    },
    {
      // 총증분이 안전한 정수를 넘기는 증분은 거절된다. 증분 0 은 넘기지 않으므로 받아들인다.
      name: "총증분이 Number.MAX_SAFE_INTEGER 를 넘기는 증분은 RangeError 이고, 딱 닿는 증분과 증분 0 은 받아들인다",
      steps: [
        { op: "update", arg: ["big", Number.MAX_SAFE_INTEGER - 1] },
        { op: "update", arg: ["small", 2] },
        { op: "update", arg: ["small", 1] },
        { op: "update", arg: ["small", 1] },
        { op: "update", arg: ["small", 0] },
        { op: "estimate", arg: "big" },
        { op: "estimate", arg: "small" },
      ],
    },
    {
      // 거절된 생성은 이전 스케치와 그 안의 빈도를 남긴다. 받아들인 생성은 기록을 비운다.
      name: "0 이하 · 1 이상인 ε · δ 는 RangeError 이며 이전 스케치를 남기고, 받아들인 생성은 빈 스케치다",
      steps: [
        { op: "update", arg: ["k", 9] },
        { op: "constructor", arg: [0, 0.01] },
        { op: "constructor", arg: [1, 0.01] },
        { op: "constructor", arg: [-0.5, 0.01] },
        { op: "constructor", arg: [0.01, 0] },
        { op: "constructor", arg: [0.01, 1] },
        { op: "constructor", arg: [0.01, 1.5] },
        { op: "estimate", arg: "k" },
        { op: "constructor", arg: [0.999, 0.999] },
        { op: "estimate", arg: "k" },
        { op: "update", arg: ["k", 2] },
        { op: "estimate", arg: "k" },
        { op: "update", arg: ["m", Number.MAX_SAFE_INTEGER - 2] },
        { op: "constructor", arg: [0.5, 0.5] },
        { op: "update", arg: ["m", 3] },
        { op: "estimate", arg: "m" },
      ],
    },
    {
      // 목표 오차 · 실패 확률 셋. 둘 중 하나를 읽지 않고 크기를 정하는 구현은 작은 값에서 떨어진다.
      name: "오차 판정 — 흐름을 넣고 넣지 않은 원소 64/δ 개를 물으면 ε·N 을 넘는 추정이 128 개 이하다 ((ε, δ) = (0.1, 0.1) · (0.01, 0.01) · (0.001, 0.001))",
      steps: [
        { op: "overestimateCheck", arg: [0.1, 0.1, 1] },
        { op: "overestimateCheck", arg: [0.01, 0.01, 2] },
        { op: "overestimateCheck", arg: [0.001, 0.001, 3] },
      ],
    },
  ],

  invariants: [],

  scenarios: [
    {
      // 서로 다른 원소 n 개를 증분 1 로 넣는다. 원소마다 칸을 늘어놓고 겹침을 훑는 계열이 여기서 걸린다.
      covers: ["update"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(EPSILON, DELTA);
        const sketch = impl.sketch;
        for (const item of corpus(n, ctx.rng, "+"))
          ctx.step(() => sketch.update(item, 1));
      },
    },
    {
      // 서로 다른 원소 n 개를 넣은 뒤 넣은 원소와 넣지 않은 원소를 번갈아 묻는다. 담긴 것을 훑어 답하는 계열이 걸린다.
      covers: ["estimate"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(EPSILON, DELTA);
        const sketch = impl.sketch;
        const inside = corpus(n, ctx.rng, "+");
        const outside = corpus(n, ctx.rng, "?");
        for (const item of inside) sketch.update(item, 1);
        for (let i = 0; i < n; i++) {
          const item = (i % 2 === 0 ? inside[i] : outside[i]) as string;
          ctx.step(() => sketch.estimate(item));
        }
      },
    },
  ],
};
