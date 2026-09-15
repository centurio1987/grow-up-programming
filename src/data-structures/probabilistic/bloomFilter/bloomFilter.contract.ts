/**
 * `probabilistic/bloomFilter` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./bloomFilter.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을
 * 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **오차 보장을 축1 안에서 판정한다(2026-09-15 유저 결정 — `docs/ORD-006-conventions.md` 「A군 판정 — 사람 결정
 * 넷」).** 축을 늘리지 않고 하네스도 고치지 않았다 — 축1 연산 하나(`falsePositiveCheck`)가 판정을 불리언 관측값으로
 * 돌려주고 참조 모델은 늘 `true` 를 낸다(`graph-repr/dag` 의 `topologicalOrder` 와 같은 모양, 불변 사실 284). 그 연산은
 * 인자 `[용량 n, 목표 ε, seed]` 로 **새 필터를 하나 세워** 이렇게 본다.
 *
 * 1. seed 로 정한 서로 다른 원소 n 개를 넣는다. 원소는 필터가 무작위를 뽑기 전에 정해진다 — 헤더가 확률의 출처를
 *    「구현이 뽑는 무작위」로 정했으므로 **어떤 원소 묶음이든** 이 판정의 입력이 된다. 그래서 원소를 무작위 문자열이
 *    아니라 `+<꼬리표>:<차례>` 의 **줄지은 문자열**로 둔다 — 고정 해시가 약하면 드러나는 모양이다.
 * 2. 넣은 n 개가 전부 `has` 참인지 본다(결정적인 쪽).
 * 3. 넣지 않은 서로 다른 원소 `QUOTA / ε` 개(`?<꼬리표>:<차례>`)를 묻고 참의 수가 `MARGIN × QUOTA` 이하인지 본다 —
 *    헤더의 판정 문장 「참의 수 ≤ 2 · ε · N」 그대로다(`N · ε = QUOTA`).
 *
 * 관측값은 `true` 또는 처음 어긋난 자리를 적은 문자열이다. **판정은 시퀀스가 도는 필터를 건드리지 않는다** — 새 필터를
 * 세우므로 무작위 시퀀스의 상태와 섞이지 않고, 참조 모델이 필터의 확률적 답을 흉내 낼 필요가 없다.
 *
 * **`QUOTA = 64` · `MARGIN = 2` 의 근거.** 넣지 않은 원소마다 따로 확률 ε 로 참을 내는 구현 — 헤더의 확률 문장을
 * 경계에서 지키는 구현 — 이 이 판정에서 떨어질 확률은 체르노프 부등식으로 e^{−64/3} ≈ 5.4 × 10^−10 이하다. 그 구현을
 * 판정 도구 fixture 로 두고 실제로 돌렸다(`../../_contract/_fixtures/boundaryRateFilter.ts`). 판정 8,000 회 탐침에서 그
 * 구현은 여유 1 이면 3,787 회 · 1.25 면 165 회 · 1.5 면 1 회 · **2 면 0 회** 떨어졌다 — 여유를 줄이면 **올바른 구현을
 * 떨어뜨리는 스위트**가 된다. 정본은 거짓 양성의 몫이 ε 의 절반 안팎이라 더 멀리 있다(같은 8,000 회에서 참 10 ~ 53 개,
 * 여유 1 에서도 0 회). 수치와 모양은 `../../_contract/runContract.bloomFilter.test.ts` 머리말.
 *
 * **넣지 않은 원소의 `has` 는 관측값에서 뺀다.** 한 번의 답은 참이든 거짓이든 계약을 지키므로 참조 모델이 대조할 값이
 * 없다. 껍데기가 넣은 원소를 기록하고(`add` 가 반환값이 없어 넣은 것은 전부 담긴다), 기록에 없는 원소의 `has` 는
 * 구현을 부르되 관측값을 `"not-added"` 로 바꾼다. 그 답들의 판정은 위 연산이 모아서 한다.
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 생성자가 용량 · 목표 오차를 받으므로 축3 사다리를 오르려면 그 크기의 필터를
 * 다시 세워야 하고, 판정 연산도 새 필터를 세운다. `linear/bitArray` 처럼 **생성자 행을 축1 연산(`constructor`)으로
 * 부른다** — 받아들이면 새 필터로 바꾸고 기록을 비우며, `RangeError` 면 이전 필터를 그대로 둔다. 무작위 시퀀스는 크기를
 * 드물게, 기본 모양으로만 바꾼다(`docs/ORD-006-conventions.md` 「껍데기가 생성자 행을 축1 연산으로 부른다」의 규칙).
 *
 * **무작위 시퀀스의 판정 연산은 가벼운 모양만 쓴다** — 용량 128 · ε ∈ {0.1, 0.01}(물을 원소 640 · 6,400 개). 무거운
 * 모양(ε = 0.001, 물을 원소 64,000 개)은 경계 케이스가 한 번 짚는다. 목표 오차를 읽지 않고 크기를 정하는 구현은 ε 가
 * 작을수록 드러나므로 세 모양을 모두 둔다(`../../_contract/_fixtures/fixedWidthBloomFilter.ts`).
 *
 * **축3 시나리오의 n 은 용량이자 넣은 원소 수다.** 원소 길이 L 과 목표 오차 ε 는 상수로 눌러(§규약2 시나리오 규칙 3)
 * 헤더의 `O(L · log(1/ε))` 가 n 에 대해 `O(1)` 로 판정된다. 담긴 수가 비용에서 빠지는 것이 이 계약의 비용 조건이다.
 * 적대적 시나리오는 두지 않았다 — 입력이 비용을 가르려면 구현의 해시를 읽어야 하고 그런 입력은 시나리오가 아니다(불변
 * 사실 44).
 */

import { rngFrom } from "../../_contract/judge";
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

/** 판정 한 번에서 넣지 않은 원소에 기대하는 참의 수 — `N · ε`. 파일 머리 설명 참고. */
export const QUOTA = 64;
/** 헤더가 정한 여유. 참의 수가 `MARGIN × QUOTA` 를 넘으면 떨어진다. */
export const MARGIN = 2;

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

/**
 * 오차 판정 하나. 새 필터를 세워 넣고 묻고, 통과하면 `true`, 아니면 처음 어긋난 자리를 적은 문자열을 돌려준다.
 * 자기시험과 탐침이 같은 판정을 쓰도록 내보낸다.
 */
export function judgeFalsePositives(
  make: FilterMaker,
  capacity: number,
  falsePositiveRate: number,
  seed: number,
): true | string {
  const filter = make(capacity, falsePositiveRate);
  const tag = Math.floor(rngFrom(seed)() * 36 ** 5).toString(36);
  for (let i = 0; i < capacity; i++) filter.add(`+${tag}:${i}`);
  for (let i = 0; i < capacity; i++) {
    if (!filter.has(`+${tag}:${i}`))
      return `거짓 음성 — ${i}번째로 넣은 원소가 has 거짓 (용량 ${capacity})`;
  }
  const queries = Math.round(QUOTA / falsePositiveRate);
  let hits = 0;
  for (let i = 0; i < queries; i++) if (filter.has(`?${tag}:${i}`)) hits++;
  const limit = MARGIN * QUOTA;
  if (hits <= limit) return true;
  return (
    `거짓 양성 ${hits} / 한계 ${limit} — 용량 ${capacity} 을 채우고 넣지 않은 원소 ${queries} 개를 ` +
    `물었다(ε = ${falsePositiveRate}, 여유 ${MARGIN})`
  );
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

  judge(
    capacity: number,
    falsePositiveRate: number,
    seed: number,
  ): true | string {
    return judgeFalsePositives(this.#make, capacity, falsePositiveRate, seed);
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

/** 축1 무작위 판정 인자. 가벼운 모양 둘 중 하나와 seed. 파일 머리 설명 참고. */
function someCheck(rng: () => number): [number, number, number] {
  const rate = rng() < 0.5 ? 0.1 : 0.01;
  return [128, rate, Math.floor(rng() * 0x7fff_ffff)];
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
    {
      name: "falsePositiveCheck",
      arg: (rng) => someCheck(rng),
      onImpl: (impl, arg) => {
        const [capacity, rate, seed] = arg as [number, number, number];
        return impl.judge(capacity, rate, seed);
      },
      onModel: () => true,
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
    {
      // 목표 오차 셋. 목표를 읽지 않고 크기를 정하는 구현은 작은 ε 에서 떨어진다.
      name: "오차 판정 — 용량을 채우고 넣지 않은 원소 64/ε 개를 물으면 참이 128 개 이하다 (ε = 0.1 · 0.01 · 0.001)",
      steps: [
        { op: "falsePositiveCheck", arg: [256, 0.1, 1] },
        { op: "falsePositiveCheck", arg: [1024, 0.01, 2] },
        { op: "falsePositiveCheck", arg: [1024, 0.001, 3] },
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
