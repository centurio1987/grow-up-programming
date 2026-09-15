/**
 * `probabilistic/hyperLogLog` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./hyperLogLog.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을
 * 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **오차 판정은 `probabilistic/bloomFilter` 가 세운 모양을 따른다**(`docs/ORD-006-conventions.md` 「A군 확률 필터 둘」) — 축1
 * 연산 하나(`errorCheck`)가 인자 `[ε, δ, seed]` 로 새 인스턴스를 세워 판정을 불리언 관측값으로 돌려주고 참조 모델은 늘 `true`
 * 를 낸다. 하네스는 고치지 않았다. **다른 것은 한 번에 무엇을 세느냐다.** 블룸 필터의 확률 문장은 넣지 않은 원소 하나씩에
 * 대한 것이라 필터 하나에 원소를 많이 물어 모았다. 이 계약의 확률 문장은 **들어온 원소 집합 하나에 대한 추정 하나**에 대한
 * 것이라, 한 인스턴스에서 모을 것이 하나뿐이다. 그래서 판정 하나가 인스턴스를 여럿 세운다.
 *
 * 1. `⌈QUOTA / δ⌉` 번 되풀이한다. 매번 새 인스턴스를 세우고, seed 로 정한 원소 수 n 을 1 부터
 *    `max(4,096, ⌈16 / (ε² · δ)⌉)` 까지 로그 고르게 뽑는다 — 원소 수가 작은 구간 · 큰 구간을 고르게 짚고, ε · δ 가 작을수록
 *    추정기가 크게 세워지므로 범위를 함께 늘린다. 이 범위는 구현을 읽지 않고 매개변수에서만 정한다(불변 사실 44).
 * 2. 서로 다른 원소 n 개(`+<꼬리표>:<차례>:<번호>`)를 넣되 **둘에 한 번 앞서 넣은 원소를 다시 넣는다** — 넣은 호출 수를
 *    세는 구현이 여기서 드러난다(호출 수는 약 1.5 n).
 * 3. `count()` 가 n 에서 ε · n 넘게 벗어난 횟수를 세고, **그 수가 `MARGIN × QUOTA` 이하인지** 본다 — 헤더의 판정 문장 그대로다.
 *
 * **`QUOTA = 16` · `MARGIN = 3` 의 근거.** 되풀이마다 확률 δ 로 벗어나는 구현 — 헤더의 확률 문장을 경계에서 지키는 구현 —
 * 이 한 판정에서 떨어질 확률은 체르노프 부등식으로 e^{−16} ≈ 1.1 × 10^−7 이하다. 인스턴스를 세워 넣는 일이 한 번의 되풀이라
 * 블룸 필터의 64 · 2 를 그대로 쓰면 판정 하나가 네 배 무겁고, 16 · 2 면 체르노프 상한이 e^{−16/3} ≈ 5 × 10^−3 이라 올바른
 * 구현이 스위트 한 번에 떨어질 몫이 보인다. 그 구현을 판정 도구 fixture 로 두고 실측했다
 * (`../../_contract/_fixtures/boundaryErrorSketch.ts`, 수치는 `../../_contract/runContract.hyperLogLog.test.ts` 머리말).
 *
 * **결정적인 쪽은 한 문장이다 — 「같은 실행 · 같은 매개변수에서 추정은 들어온 원소 집합의 함수다」.** 한 번의 추정은 확률적이라
 * 참조 모델이 대조할 값이 없다. 그래서 껍데기가 인스턴스마다 **들어온 원소의 집합**을 기록하고 관측값을 판정으로 바꾼다
 * (`graph-repr/dag` 의 순서 판정과 같은 모양 — 불변 사실 284).
 *
 * - `count` — 같은 매개변수로 새 인스턴스를 세워 기록한 집합을 **다른 순서로**(내림차순) 넣고 두 추정이 같은지(`Object.is`).
 * - `add` — 이미 들어온 원소면 넣기 전후의 추정이 같은지 보고 `"unchanged"` 를, 새 원소면 `"added"` 를 낸다.
 * - `merge` — 두 쪽의 추정이 합치기 전후로 같은지 · 돌려받은 것이 새 인스턴스인지 · 그 추정이 합집합을 새 인스턴스에 넣은
 *   추정과 같은지 보고 `true` 를 낸다. 매개변수가 다르면 `"RangeError"` 다. 받아들이면 돌려받은 인스턴스가 이쪽 자리를 잇는다.
 * - `mergeSelf` — 자기 자신과 합친다. 같은 판정이다.
 *
 * **껍데기가 인스턴스 둘을 든다**(`hash/hashSet` 의 `SetPair` 와 같은 자리). 합치기의 인자 쪽을 따로 채우고 매개변수를 따로
 * 바꾸는 연산(`otherConstructor`)을 둔다 — 매개변수가 다른 합치기의 거절이 무작위 시퀀스에 들어온다. 생성자 행은
 * `linear/bitArray` 처럼 축1 연산(`constructor`)으로 부른다(「껍데기가 생성자 행을 축1 연산으로 부른다」의 규칙).
 *
 * **축3 시나리오의 n 은 들어온 서로 다른 원소의 수다.** 원소 길이 L 과 ε · δ 는 상수로 눌러(§규약2 시나리오 규칙 3) 헤더의
 * 상한 셋이 n 에 대해 `O(1)` 로 판정된다. `merge` 시나리오는 두 쪽에 n 개씩 넣고 합친다 — 원소를 옮기는 합치기가 여기서 걸린다.
 * 적대적 시나리오는 두지 않았다 — 비용을 가르는 입력은 구현의 해시를 읽어야 지어진다(불변 사실 44).
 */

import { rngFrom } from "../../_contract/judge";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **세 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface HyperLogLogContract {
  add(item: string): void;
  count(): number;
  merge(other: HyperLogLogContract): HyperLogLogContract;
}

type Built = HyperLogLogContract & { __cost?: number };

/** 인스턴스를 세우는 함수. 스텁 · 정본 · fixture 가 같은 모양으로 넘긴다. */
export type SketchMaker = (epsilon: number, delta: number) => Built;

/** 축1 무작위 시퀀스가 도는 기본 인스턴스의 모양. */
const EPSILON = 0.3;
const DELTA = 0.3;
/** 인자 쪽에 줄 수 있는 다른 매개변수. 합치기가 거절해야 한다. */
const OTHER_SHAPE: readonly [number, number] = [0.2, 0.3];

/** 판정 한 번에서 경계 구현이 벗어나기를 기대하는 횟수 — `되풀이 수 · δ`. 파일 머리 설명 참고. */
export const QUOTA = 16;
/** 헤더가 정한 여유. 벗어난 횟수가 `MARGIN × QUOTA` 를 넘으면 떨어진다. */
export const MARGIN = 3;
/** 원소 수 범위의 아래 상한. 파일 머리 설명 참고. */
const SPAN_FLOOR = 4096;

const OUT_OF_RANGE = "RangeError";
const ADDED = "added";
const UNCHANGED = "unchanged";

function observe<T>(call: () => T): T | string {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 판정의 원소 수 범위 위 끝. */
export function spanOf(epsilon: number, delta: number): number {
  return Math.max(SPAN_FLOOR, Math.ceil(16 / (epsilon * epsilon * delta)));
}

/** 판정 한 번의 수치. 자기시험과 탐침이 한계를 바꿔 보려고 판정과 나눠 둔다. */
export interface Deviation {
  /** 추정이 n 에서 ε·n 넘게 벗어난 되풀이 수. */
  misses: number;
  rounds: number;
  /** 벗어난 되풀이 중 첫 자리의 설명. 없으면 `null`. */
  first: string | null;
}

/** `rounds` 번 새 인스턴스를 세워 넣고 센다. 판정은 하지 않는다. */
export function measureDeviation(
  make: SketchMaker,
  epsilon: number,
  delta: number,
  seed: number,
  rounds = Math.ceil(QUOTA / delta),
): Deviation {
  const rng = rngFrom(seed);
  const tag = Math.floor(rng() * 36 ** 5).toString(36);
  const logSpan = Math.log(spanOf(epsilon, delta) + 1);
  let misses = 0;
  let first: string | null = null;
  for (let t = 0; t < rounds; t++) {
    const n = Math.max(1, Math.floor(Math.exp(rng() * logSpan)));
    const sketch = make(epsilon, delta);
    for (let i = 0; i < n; i++) {
      sketch.add(`+${tag}:${t}:${i}`);
      if (i % 2 === 1) sketch.add(`+${tag}:${t}:${i >> 1}`);
    }
    const guess = sketch.count();
    if (!(Math.abs(guess - n) <= epsilon * n + 1e-9)) {
      misses++;
      first ??= `서로 다른 원소 ${n} 개에 추정 ${guess}`;
    }
  }
  return { misses, rounds, first };
}

/**
 * 오차 판정 하나. 통과하면 `true`, 아니면 벗어난 수와 첫 자리를 적은 문자열을 돌려준다.
 * 자기시험과 탐침이 같은 판정을 쓰도록 내보낸다.
 */
export function judgeRelativeError(
  make: SketchMaker,
  epsilon: number,
  delta: number,
  seed: number,
): true | string {
  const d = measureDeviation(make, epsilon, delta, seed);
  const limit = MARGIN * QUOTA;
  if (d.misses <= limit) return true;
  return (
    `상대 오차 초과 ${d.misses} / 한계 ${limit} — 인스턴스 ${d.rounds} 개 중(ε = ${epsilon}, δ = ${delta}, 여유 ${MARGIN}). ` +
    `첫 자리: ${d.first}`
  );
}

/** 집합을 같은 매개변수의 새 인스턴스에 내림차순으로 넣은 추정. 기록한 순서와 다른 순서로 넣으려고 뒤집는다. */
function freshCount(
  make: SketchMaker,
  shape: readonly [number, number],
  items: ReadonlySet<string>,
): number {
  const fresh = make(shape[0], shape[1]);
  for (const item of [...items].sort().reverse()) fresh.add(item);
  return fresh.count();
}

/**
 * 하네스용 껍데기. 인스턴스 둘(이쪽 · 인자 쪽)과 저마다 들어온 원소의 집합을 든다. 인자 쪽의 매개변수는 들지 않는다 —
 * 매개변수가 다른 합치기를 거절하는지는 구현이 답하고 참조 모델이 대조한다.
 */
export class SketchPair {
  readonly #make: SketchMaker;
  #mine: Built;
  #other: Built;
  #mineShape: readonly [number, number] = [EPSILON, DELTA];
  #mineItems = new Set<string>();
  #otherItems = new Set<string>();
  #carried = 0;

  constructor(make: SketchMaker) {
    this.#make = make;
    this.#mine = make(EPSILON, DELTA);
    this.#other = make(EPSILON, DELTA);
  }

  get __cost(): number {
    return this.#carried + (this.#mine.__cost ?? 0) + (this.#other.__cost ?? 0);
  }

  get mine(): HyperLogLogContract {
    return this.#mine;
  }

  get other(): HyperLogLogContract {
    return this.#other;
  }

  /** 두 쪽을 같은 매개변수의 새 인스턴스로 바꾼다. 생성자가 던지면 그대로 두고 예외를 올려보낸다. */
  reset(epsilon: number, delta: number): void {
    const mine = this.#make(epsilon, delta);
    const other = this.#make(epsilon, delta);
    this.#carried += (this.#mine.__cost ?? 0) + (this.#other.__cost ?? 0);
    this.#mine = mine;
    this.#other = other;
    this.#mineShape = [epsilon, delta];
    this.#mineItems = new Set<string>();
    this.#otherItems = new Set<string>();
  }

  /** 인자 쪽만 새 인스턴스로 바꾼다. */
  resetOther(epsilon: number, delta: number): void {
    const other = this.#make(epsilon, delta);
    this.#carried += this.#other.__cost ?? 0;
    this.#other = other;
    this.#otherItems = new Set<string>();
  }

  /** `side` 0 은 이쪽, 1 은 인자 쪽. 이미 들어온 원소면 추정이 그대로인지 본다. */
  add(side: number, item: string): string {
    const sketch = side === 0 ? this.#mine : this.#other;
    const items = side === 0 ? this.#mineItems : this.#otherItems;
    if (!items.has(item)) {
      sketch.add(item);
      items.add(item);
      return ADDED;
    }
    const before = sketch.count();
    sketch.add(item);
    const after = sketch.count();
    return Object.is(before, after)
      ? UNCHANGED
      : `이미 들어온 원소를 다시 넣자 추정이 ${before} → ${after}`;
  }

  /** 이쪽의 추정이 같은 집합을 새 인스턴스에 다른 순서로 넣은 추정과 같은지. */
  count(): true | string {
    const guess = this.#mine.count();
    const fresh = freshCount(this.#make, this.#mineShape, this.#mineItems);
    return Object.is(guess, fresh)
      ? true
      : `추정 ${guess} — 같은 집합(${this.#mineItems.size} 개)을 새 인스턴스에 넣으면 ${fresh}`;
  }

  /** 이쪽.merge(인자 쪽). 받아들이면 돌려받은 인스턴스가 이쪽 자리를 잇는다. */
  merge(): true | string {
    return this.#mergeWith(this.#other, this.#otherItems);
  }

  /** 이쪽.merge(이쪽). */
  mergeSelf(): true | string {
    return this.#mergeWith(this.#mine, this.#mineItems);
  }

  #mergeWith(partner: Built, partnerItems: ReadonlySet<string>): true | string {
    const mineBefore = this.#mine.count();
    const partnerBefore = partner.count();
    const merged = observe(() => this.#mine.merge(partner) as Built);
    if (typeof merged === "string") return merged;
    if (merged === this.#mine || merged === partner)
      return "합치기가 새 인스턴스가 아니라 받은 인스턴스를 돌려줬다";
    const mineAfter = this.#mine.count();
    if (!Object.is(mineBefore, mineAfter))
      return `합치기가 이쪽의 추정을 바꿨다 ${mineBefore} → ${mineAfter}`;
    const partnerAfter = partner.count();
    if (!Object.is(partnerBefore, partnerAfter))
      return `합치기가 인자 쪽의 추정을 바꿨다 ${partnerBefore} → ${partnerAfter}`;
    const union = new Set([...this.#mineItems, ...partnerItems]);
    const guess = merged.count();
    const fresh = freshCount(this.#make, this.#mineShape, union);
    if (!Object.is(guess, fresh))
      return `합친 추정 ${guess} — 합집합(${union.size} 개)을 새 인스턴스에 넣으면 ${fresh}`;
    this.#carried += this.#mine.__cost ?? 0;
    this.#mine = merged;
    this.#mineItems = union;
    return true;
  }

  judge(epsilon: number, delta: number, seed: number): true | string {
    return judgeRelativeError(this.#make, epsilon, delta, seed);
  }
}

/** 축1 참조 모델. 두 쪽의 매개변수와 들어온 원소 집합. 추정 값은 들지 않는다 — 판정은 껍데기가 한다. */
interface Model {
  mineShape: readonly [number, number];
  otherShape: readonly [number, number];
  mine: Set<string>;
  other: Set<string>;
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

/** 거절되는 매개변수 넷. */
const BAD_SHAPES: readonly (readonly [number, number])[] = [
  [0, DELTA],
  [1, DELTA],
  [EPSILON, 0],
  [EPSILON, 1],
];

/**
 * 축1 무작위 생성 인자. 쉰에 마흔아홉은 생성자가 거절하는 값이라 인스턴스가 그대로 남고, 받아들이는 값은 기본 모양
 * 하나다(`linear/bitArray` 의 규칙).
 */
function someShape(rng: () => number): [number, number] {
  if (rng() < 0.02) return [EPSILON, DELTA];
  return [
    ...(BAD_SHAPES[Math.floor(rng() * BAD_SHAPES.length)] as [number, number]),
  ];
}

/** 인자 쪽 생성 인자. 셋에 하나씩 기본 모양 · 다른 모양 · 거절되는 값이다. */
function someOtherShape(rng: () => number): [number, number] {
  const roll = rng();
  if (roll < 1 / 3) return [EPSILON, DELTA];
  if (roll < 2 / 3) return [...OTHER_SHAPE] as [number, number];
  return [
    ...(BAD_SHAPES[Math.floor(rng() * BAD_SHAPES.length)] as [number, number]),
  ];
}

/** 축1 무작위 판정 인자. 가벼운 모양 둘 중 하나와 seed. */
function someCheck(rng: () => number): [number, number, number] {
  const shape = rng() < 0.5 ? [0.3, 0.3] : [0.2, 0.2];
  return [
    shape[0] as number,
    shape[1] as number,
    Math.floor(rng() * 0x7fff_ffff),
  ];
}

/** 모델 쪽 생성 인자 판정 — 헤더 「주입 정책」의 조건. */
function validShape(epsilon: number, delta: number): boolean {
  return epsilon > 0 && epsilon < 1 && delta > 0 && delta < 1;
}

function sameShape(
  a: readonly [number, number],
  b: readonly [number, number],
): boolean {
  return a[0] === b[0] && a[1] === b[1];
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

/** 축3 에서 추정 · 합치기를 부르는 횟수. 둘은 n 에 비례해 부를 까닭이 없다(`expected` 는 횟수를 요구하지 않는다). */
const QUERY_STEPS = 64;

export const hyperLogLogContract: ContractSpec<SketchPair, Model> = {
  name: "HyperLogLog",
  grade: "basic",
  model: () => ({
    mineShape: [EPSILON, DELTA],
    otherShape: [EPSILON, DELTA],
    mine: new Set<string>(),
    other: new Set<string>(),
  }),

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
        model.mineShape = [epsilon, delta];
        model.otherShape = [epsilon, delta];
        model.mine = new Set<string>();
        model.other = new Set<string>();
        return undefined;
      },
    },
    {
      name: "otherConstructor",
      arg: (rng) => someOtherShape(rng),
      onImpl: (impl, arg) => {
        const [epsilon, delta] = arg as [number, number];
        return observe(() => impl.resetOther(epsilon, delta));
      },
      onModel: (model, arg) => {
        const [epsilon, delta] = arg as [number, number];
        if (!validShape(epsilon, delta)) return OUT_OF_RANGE;
        model.otherShape = [epsilon, delta];
        model.other = new Set<string>();
        return undefined;
      },
    },
    {
      name: "add",
      arg: (rng) => [
        rng() < 0.75 ? 0 : 1,
        POOL[Math.floor(rng() * POOL.length)] as string,
      ],
      onImpl: (impl, arg) => {
        const [side, item] = arg as [number, string];
        return impl.add(side, item);
      },
      onModel: (model, arg) => {
        const [side, item] = arg as [number, string];
        const items = side === 0 ? model.mine : model.other;
        if (items.has(item)) return UNCHANGED;
        items.add(item);
        return ADDED;
      },
    },
    {
      name: "count",
      arg: () => undefined,
      onImpl: (impl) => impl.count(),
      onModel: () => true,
    },
    {
      name: "merge",
      arg: () => undefined,
      onImpl: (impl) => impl.merge(),
      onModel: (model) => {
        if (!sameShape(model.mineShape, model.otherShape)) return OUT_OF_RANGE;
        model.mine = new Set([...model.mine, ...model.other]);
        return true;
      },
    },
    {
      name: "mergeSelf",
      arg: () => undefined,
      onImpl: (impl) => impl.mergeSelf(),
      onModel: () => true,
    },
    {
      name: "errorCheck",
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
      name: "이미 들어온 원소를 다시 넣어도 추정이 바뀌지 않는다 — 빈 문자열 · 16비트 글자 포함",
      steps: [
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [0, ""] },
        { op: "add", arg: [0, ""] },
        { op: "add", arg: [0, "가나"] },
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [0, "가나"] },
        { op: "count" },
      ],
    },
    {
      // 껍데기는 새 인스턴스에 내림차순으로 넣는다 — 여기서는 오름차순이 아닌 순서로 넣어 두 순서가 갈리게 한다.
      name: "추정은 들어온 원소 집합의 함수다 — 빈 인스턴스 · 넣은 순서가 달라도 같은 추정",
      steps: [
        { op: "count" },
        { op: "add", arg: [0, "b"] },
        { op: "count" },
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [0, "c"] },
        { op: "count" },
        { op: "add", arg: [0, "ab"] },
        { op: "add", arg: [0, "a"] },
        { op: "count" },
      ],
    },
    {
      name: "합치기는 새 인스턴스를 돌려주고 두 쪽을 바꾸지 않으며, 두 쪽 원소를 한 인스턴스에 넣은 것과 같다",
      steps: [
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [0, "b"] },
        { op: "add", arg: [1, "b"] },
        { op: "add", arg: [1, "c"] },
        { op: "merge" },
        { op: "count" },
        { op: "add", arg: [0, "c"] },
        { op: "add", arg: [1, "d"] },
        { op: "merge" },
        { op: "add", arg: [0, "d"] },
        { op: "count" },
        { op: "add", arg: [0, "e"] },
        { op: "merge" },
        { op: "count" },
      ],
    },
    {
      name: "빈 쪽과 합치기 · 자기 자신과 합치기도 같은 판정을 받는다",
      steps: [
        { op: "merge" },
        { op: "mergeSelf" },
        { op: "count" },
        { op: "add", arg: [0, "x"] },
        { op: "mergeSelf" },
        { op: "add", arg: [0, "x"] },
        { op: "merge" },
        { op: "count" },
        { op: "add", arg: [1, "y"] },
        { op: "add", arg: [1, "y"] },
        { op: "merge" },
        { op: "mergeSelf" },
        { op: "count" },
      ],
    },
    {
      // 거절된 생성은 이전 인스턴스와 그 안의 원소를 남긴다. 매개변수가 다른 합치기는 두 쪽을 그대로 둔다.
      name: "0 이하 · 1 이상인 ε · δ 는 RangeError 이며 이전 인스턴스를 남기고, 매개변수가 다른 인스턴스와의 합치기는 RangeError 다",
      steps: [
        { op: "add", arg: [0, "k"] },
        { op: "constructor", arg: [0, 0.3] },
        { op: "constructor", arg: [1, 0.3] },
        { op: "constructor", arg: [-0.5, 0.3] },
        { op: "constructor", arg: [0.3, 0] },
        { op: "constructor", arg: [0.3, 1] },
        { op: "constructor", arg: [0.3, 1.5] },
        { op: "add", arg: [0, "k"] },
        { op: "otherConstructor", arg: [0.3, 0] },
        { op: "otherConstructor", arg: [0.2, 0.3] },
        { op: "add", arg: [1, "j"] },
        { op: "merge" },
        { op: "count" },
        { op: "add", arg: [0, "k"] },
        { op: "otherConstructor", arg: [0.3, 0.2] },
        { op: "merge" },
        { op: "otherConstructor", arg: [0.3, 0.3] },
        { op: "add", arg: [1, "j"] },
        { op: "merge" },
        { op: "count" },
        { op: "constructor", arg: [0.999, 0.999] },
        { op: "count" },
        { op: "add", arg: [1, "k"] },
        { op: "merge" },
        { op: "add", arg: [0, "k"] },
        { op: "count" },
      ],
    },
    {
      // 목표 셋. 매개변수를 읽지 않고 크기를 정하는 구현은 작은 ε · δ 에서 떨어진다. 무작위 시퀀스는 가벼운 둘만 쓴다.
      name: "오차 판정 — 16/δ 개 인스턴스에서 추정이 ε·n 넘게 벗어난 수가 48 개 이하다 ((ε, δ) = (0.3, 0.3) · (0.1, 0.1) · (0.05, 0.2))",
      steps: [
        { op: "errorCheck", arg: [0.3, 0.3, 1] },
        { op: "errorCheck", arg: [0.1, 0.1, 2] },
        { op: "errorCheck", arg: [0.05, 0.2, 3] },
      ],
    },
  ],

  invariants: [],

  scenarios: [
    {
      // 서로 다른 원소 n 개를 넣는다. 들어온 원소를 늘어놓고 겹침을 훑는 계열이 여기서 걸린다.
      covers: ["add"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(EPSILON, DELTA);
        const sketch = impl.mine;
        for (const item of corpus(n, ctx.rng, "+"))
          ctx.step(() => sketch.add(item));
      },
    },
    {
      // 서로 다른 원소 n 개를 넣은 뒤 추정을 거듭 묻는다. 물을 때 들어온 원소를 훑는 계열이 여기서 걸린다.
      covers: ["count"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(EPSILON, DELTA);
        const sketch = impl.mine;
        for (const item of corpus(n, ctx.rng, "+")) sketch.add(item);
        for (let i = 0; i < QUERY_STEPS; i++) ctx.step(() => sketch.count());
      },
    },
    {
      // 두 쪽에 서로 다른 원소 n 개씩 넣고 거듭 합친다. 합칠 때 들어온 원소를 옮기는 계열이 여기서 걸린다.
      covers: ["merge"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(EPSILON, DELTA);
        const mine = impl.mine;
        const other = impl.other;
        for (const item of corpus(n, ctx.rng, "+")) mine.add(item);
        for (const item of corpus(n, ctx.rng, "-")) other.add(item);
        for (let i = 0; i < QUERY_STEPS; i++)
          ctx.step(() => {
            mine.merge(other);
          });
      },
    },
  ],
};
