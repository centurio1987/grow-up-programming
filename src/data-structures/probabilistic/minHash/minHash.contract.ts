/**
 * `probabilistic/minHash` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./minHash.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을 기계가
 * 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **확률 문장은 축1 통계 판정으로 본다 — `../../_contract/runTrials.ts`(`docs/ORD-006-conventions.md` 「원칙 B」 · 그 적용 절).**
 * 무작위 시퀀스 · 경계 케이스는 결정적인 쪽만 대조한다. 시행 하나(`minHashTrial`)는 이렇다.
 *
 * 1. **새 워커 하나.** 헤더가 구현 무작위의 공유 범위를 「실행」으로 적었으므로 시행마다 새 실행이다(원칙 B 의 B3).
 * 2. **인스턴스 짝 넷.** 짝마다 합집합 크기 u 를 1 ~ `spanOf(ε, δ)` = max(256, ⌈4/(ε² · δ)⌉) 의 로그 눈금 네 칸에 하나씩, 교집합
 *    크기 c 를 0 ~ u 에서 고르게 뽑고 나머지를 두 쪽에 나눠 원소(`+<꼬리표>:<시행>:<짝>:<번호>`)를 넣되 쪽마다 둘에 한 번 방금 넣은
 *    원소를 다시 넣는다. **원소 목록은 워커를 띄우기 전에 seed · 시행 번호 · 모양만으로 정한다**(B1).
 * 3. **Z_t** = (닮음이 c/u 에서 ε 넘게 벗어난 짝의 수) ÷ 4. 모양마다 합 S = Σ Z_t 가 한계 k 를 넘으면 떨어진다.
 *
 * **[보장]** (ε, δ) = (0.1, 0.1) 은 T 24 · k 13 · 상한 4.84 × 10^−7, (0.1, 0.05) 는 T 96 · k 20 · 상한 4.19 × 10^−7 이고 스위트 한 번에
 * 9.03 × 10^−7 이하다 — Hoeffding(1963) 정리 1, P(S > k) ≤ exp(−T · D(k/T ‖ δ)). **전제 셋:** ① 입력이 구현 무작위와 독립으로 정해진다
 * (위 2) ② 시행끼리 독립 — 공유 범위가 실행이고 시행마다 새 워커다(워커 사이 `Math.random` 의 독립은 실행 환경의 전제이고 확인하지
 * 않았다) ③ 시행당 E[Z_t] ≤ δ — 확률 문장이 짝마다 δ 를 누르므로 기댓값의 선형성으로 선다(짝 사이 독립은 필요 없다). **한 시행의 네
 * 짝이 함께 틀리는 구현도** 부당하게 더 떨어지지 않는다. k 는 「상한 ≤ 10^−6 ÷ 판정 수 2」 인 가장 작은 정수다
 * (`../../_contract/judgeTrials.ts`). **(0.3, 0.3) 모양은 두지 않았다** — 늘 1 을 돌려주는 구현이 참 닮음 0.7 이상에서 맞아 δ 가 큰
 * 모양을 지나는 틈(불변 사실 378)을 δ 작은 두 모양이 닫는다.
 *
 * **[경험]** T 는 목표를 읽지 않는 fixture(`FixedSizeMinHash`, 벗어난 몫을 0.33 으로 둔 이항 모형)를 놓칠 모형 확률이 10^−6 이하인
 * 가장 작은 8 의 배수다(모형 확률 9.38 × 10^−8) — 모형이고 보장이 아니다. fixture 들의 실제 판정 수치 · 반복 수는
 * `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」 표.
 *
 * **결정적인 쪽은 두 문장이다 — 「같은 실행 · 같은 매개변수에서 닮음은 두 쪽에 들어온 원소 집합의 짝만으로 정해진다」 ·
 * 「두 집합이 같으면 1 이다」.** 한 번의 닮음은 확률적이라 참조 모델이 대조할 값이 없다. 그래서 껍데기가 인스턴스마다
 * **들어온 원소의 집합**을 기록하고 관측값을 판정으로 바꾼다(`graph-repr/dag` 의 순서 판정과 같은 모양 — 불변 사실 284).
 *
 * - `similarity` — 이쪽.similarity(인자 쪽)가 [0, 1] 안인지 · 인자 쪽.similarity(이쪽)와 같은지 · 두 집합이 같으면 1 인지 ·
 *   같은 매개변수로 새 인스턴스 둘을 세워 기록한 두 집합을 **다른 순서로**(내림차순) 넣은 닮음과 같은지(`Object.is`) 보고
 *   `true` 를 낸다. 매개변수가 다르면 `"RangeError"` 다.
 * - `similaritySelf` — 이쪽.similarity(이쪽)가 1 인지.
 * - `add` — 새 원소면 `"added"` 를, 이미 들어온 원소면 넣은 뒤 **같은 집합을 새 인스턴스에 넣은 것과의 닮음이 1 인지** 보고
 *   `"unchanged"` 를 낸다.
 *
 * **껍데기가 인스턴스 둘을 든다**(`probabilistic/hyperLogLog` 의 `SketchPair` 와 같은 자리). 인자 쪽의 매개변수를 따로 바꾸는
 * 연산(`otherConstructor`)을 둔다 — 매개변수가 다른 인스턴스와의 닮음 거절이 무작위 시퀀스에 들어온다. 생성자 행은
 * `linear/bitArray` 처럼 축1 연산(`constructor`)으로 부른다(「껍데기가 생성자 행을 축1 연산으로 부른다」의 규칙).
 *
 * **축3 시나리오의 n 은 한 인스턴스에 들어온 서로 다른 원소의 수다.** 원소 길이 L 과 ε · δ 는 상수로 눌러(§규약2 시나리오
 * 규칙 3) 헤더의 상한 둘이 n 에 대해 `O(1)` 로 판정된다. `similarity` 시나리오는 두 쪽에 n 개씩(절반은 같은 원소) 넣고
 * 거듭 견준다 — 들어온 원소를 훑어 견주는 구현이 여기서 걸린다. 적대적 시나리오는 두지 않았다 — 비용을 가르는 입력은
 * 구현의 해시를 읽어야 지어진다(불변 사실 44).
 */

import { rngFrom } from "../../_contract/judge";
import {
  type TrialPlan,
  type TrialResult,
  trialSeed,
} from "../../_contract/judgeTrials";
import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **두 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface MinHashContract {
  add(item: string): void;
  similarity(other: MinHashContract): number;
}

type Built = MinHashContract & { __cost?: number };

/** 인스턴스를 세우는 함수. 스텁 · 정본 · fixture 가 같은 모양으로 넘긴다. */
export type SimilarityMaker = (epsilon: number, delta: number) => Built;

/** 축1 무작위 시퀀스가 도는 기본 인스턴스의 모양. */
const EPSILON = 0.3;
const DELTA = 0.3;
/** 인자 쪽에 줄 수 있는 다른 매개변수. 닮음을 거절해야 한다. */
const OTHER_SHAPE: readonly [number, number] = [0.2, 0.3];

/** 합집합 크기 범위의 아래 상한. 파일 머리 설명 참고. */
const SPAN_FLOOR = 256;

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

/** 판정의 합집합 크기 범위 위 끝. */
export function spanOf(epsilon: number, delta: number): number {
  return Math.max(SPAN_FLOOR, Math.ceil(4 / (epsilon * epsilon * delta)));
}

/** 집합을 같은 매개변수의 새 인스턴스에 내림차순으로 넣는다. 기록한 순서와 다른 순서로 넣으려고 뒤집는다. */
function freshWith(
  make: SimilarityMaker,
  shape: readonly [number, number],
  items: ReadonlySet<string>,
): Built {
  const fresh = make(shape[0], shape[1]);
  for (const item of [...items].sort().reverse()) fresh.add(item);
  return fresh;
}

function sameItems(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

/**
 * 하네스용 껍데기. 인스턴스 둘(이쪽 · 인자 쪽)과 저마다의 매개변수 · 들어온 원소의 집합을 든다. 매개변수는 같은 집합을
 * 새 인스턴스에 넣어 견줄 때만 쓴다 — 매개변수가 다른 인스턴스와의 닮음을 거절하는지는 구현이 답하고 참조 모델이 대조한다.
 */
export class MinHashPair {
  readonly #make: SimilarityMaker;
  #mine: Built;
  #other: Built;
  #mineShape: readonly [number, number] = [EPSILON, DELTA];
  #otherShape: readonly [number, number] = [EPSILON, DELTA];
  #mineItems = new Set<string>();
  #otherItems = new Set<string>();
  #carried = 0;

  constructor(make: SimilarityMaker) {
    this.#make = make;
    this.#mine = make(EPSILON, DELTA);
    this.#other = make(EPSILON, DELTA);
  }

  get __cost(): number {
    return this.#carried + (this.#mine.__cost ?? 0) + (this.#other.__cost ?? 0);
  }

  get mine(): MinHashContract {
    return this.#mine;
  }

  get other(): MinHashContract {
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
    this.#otherShape = [epsilon, delta];
    this.#mineItems = new Set<string>();
    this.#otherItems = new Set<string>();
  }

  /** 인자 쪽만 새 인스턴스로 바꾼다. */
  resetOther(epsilon: number, delta: number): void {
    const other = this.#make(epsilon, delta);
    this.#carried += this.#other.__cost ?? 0;
    this.#other = other;
    this.#otherShape = [epsilon, delta];
    this.#otherItems = new Set<string>();
  }

  /** `side` 0 은 이쪽, 1 은 인자 쪽. 이미 들어온 원소면 넣은 뒤에도 같은 집합을 새로 넣은 인스턴스와 닮음이 1 인지 본다. */
  add(side: number, item: string): string {
    const sketch = side === 0 ? this.#mine : this.#other;
    const items = side === 0 ? this.#mineItems : this.#otherItems;
    const shape = side === 0 ? this.#mineShape : this.#otherShape;
    if (!items.has(item)) {
      sketch.add(item);
      items.add(item);
      return ADDED;
    }
    sketch.add(item);
    const fresh = freshWith(this.#make, shape, items);
    const value = sketch.similarity(fresh);
    return Object.is(value, 1)
      ? UNCHANGED
      : `이미 들어온 원소를 다시 넣자 같은 집합(${items.size} 개)을 새로 넣은 인스턴스와의 닮음이 ${value}`;
  }

  /** 이쪽.similarity(인자 쪽)의 결정적 쪽 판정. */
  similarity(): true | string {
    const value = observe(() => this.#mine.similarity(this.#other));
    if (typeof value === "string") return value;
    if (!(value >= 0 && value <= 1)) return `닮음 ${value} 가 [0, 1] 밖이다`;
    const reversed = this.#other.similarity(this.#mine);
    if (!Object.is(value, reversed))
      return `부르는 방향을 바꾸자 닮음이 ${value} → ${reversed}`;
    if (sameItems(this.#mineItems, this.#otherItems) && value !== 1)
      return `두 쪽 집합이 같은데(${this.#mineItems.size} 개) 닮음이 ${value}`;
    const freshMine = freshWith(this.#make, this.#mineShape, this.#mineItems);
    const freshOther = freshWith(this.#make, this.#mineShape, this.#otherItems);
    const fresh = freshMine.similarity(freshOther);
    return Object.is(value, fresh)
      ? true
      : `닮음 ${value} — 같은 두 집합(${this.#mineItems.size} · ${this.#otherItems.size} 개)을 새 인스턴스 둘에 넣으면 ${fresh}`;
  }

  /** 이쪽.similarity(이쪽). */
  similaritySelf(): true | string {
    const value = this.#mine.similarity(this.#mine);
    return Object.is(value, 1) ? true : `자기 자신과의 닮음이 ${value}`;
  }
}

/** 축1 참조 모델. 두 쪽의 매개변수와 들어온 원소 집합. 닮음 값은 들지 않는다 — 판정은 껍데기가 한다. */
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

/** 축3 에서 닮음을 묻는 횟수. n 에 비례해 부를 까닭이 없다(`expected` 는 횟수를 요구하지 않는다). */
const QUERY_STEPS = 64;

export const minHashContract: ContractSpec<MinHashPair, Model> = {
  name: "MinHash",
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
        rng() < 0.5 ? 0 : 1,
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
      name: "similarity",
      arg: () => undefined,
      onImpl: (impl) => impl.similarity(),
      onModel: (model) =>
        sameShape(model.mineShape, model.otherShape) ? true : OUT_OF_RANGE,
    },
    {
      name: "similaritySelf",
      arg: () => undefined,
      onImpl: (impl) => impl.similaritySelf(),
      onModel: () => true,
    },
  ],

  edges: [
    {
      name: "이미 들어온 원소를 다시 넣어도 관측이 바뀌지 않는다 — 빈 문자열 · 16비트 글자 포함",
      steps: [
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [0, ""] },
        { op: "add", arg: [0, ""] },
        { op: "add", arg: [0, "가나"] },
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [1, "가나"] },
        { op: "add", arg: [1, "a"] },
        { op: "add", arg: [1, "가나"] },
        { op: "similarity" },
        { op: "add", arg: [1, ""] },
        { op: "similarity" },
        { op: "add", arg: [1, ""] },
        { op: "similaritySelf" },
        { op: "similarity" },
      ],
    },
    {
      // 껍데기는 새 인스턴스에 내림차순으로 넣는다 — 여기서는 오름차순이 아닌 순서로 넣어 두 순서가 갈리게 한다.
      name: "닮음은 두 쪽 원소 집합의 짝의 함수다 — 빈 인스턴스 둘 · 한쪽만 빈 짝 · 넣은 순서와 부른 방향이 달라도 같다",
      steps: [
        { op: "similarity" },
        { op: "similaritySelf" },
        { op: "add", arg: [0, "b"] },
        { op: "similarity" },
        { op: "similaritySelf" },
        { op: "add", arg: [1, "c"] },
        { op: "similarity" },
        { op: "add", arg: [0, "a"] },
        { op: "add", arg: [1, "a"] },
        { op: "add", arg: [0, "c"] },
        { op: "similarity" },
        { op: "add", arg: [1, "ab"] },
        { op: "add", arg: [0, "ab"] },
        { op: "similarity" },
      ],
    },
    {
      name: "두 쪽에 같은 원소를 다른 순서로 넣으면 닮음이 1 이고, 한쪽에 하나를 더하면 다시 같은 판정을 받는다",
      steps: [
        { op: "add", arg: [0, "x"] },
        { op: "add", arg: [0, "y"] },
        { op: "add", arg: [0, "z"] },
        { op: "add", arg: [1, "z"] },
        { op: "add", arg: [1, "x"] },
        { op: "similarity" },
        { op: "add", arg: [1, "y"] },
        { op: "similarity" },
        { op: "add", arg: [1, "w"] },
        { op: "similarity" },
        { op: "add", arg: [0, "w"] },
        { op: "similarity" },
        { op: "similaritySelf" },
      ],
    },
    {
      // 거절된 생성은 이전 인스턴스와 그 안의 원소를 남긴다. 매개변수가 다른 인스턴스와의 닮음은 두 쪽을 그대로 둔다.
      name: "0 이하 · 1 이상인 ε · δ 는 RangeError 이며 이전 인스턴스를 남기고, 매개변수가 다른 인스턴스와의 닮음은 RangeError 다",
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
        { op: "add", arg: [1, "k"] },
        { op: "similarity" },
        { op: "similaritySelf" },
        { op: "otherConstructor", arg: [0.3, 0.2] },
        { op: "similarity" },
        { op: "otherConstructor", arg: [0.3, 0.3] },
        { op: "add", arg: [1, "k"] },
        { op: "similarity" },
        { op: "constructor", arg: [0.999, 0.999] },
        { op: "similarity" },
        { op: "add", arg: [1, "k"] },
        { op: "add", arg: [0, "j"] },
        { op: "similarity" },
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
      // 두 쪽에 서로 다른 원소 n 개씩(절반은 같은 원소) 넣고 거듭 견준다. 들어온 원소를 훑어 견주는 계열이 여기서 걸린다.
      covers: ["similarity"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(EPSILON, DELTA);
        const mine = impl.mine;
        const other = impl.other;
        const shared = corpus(n, ctx.rng, "+");
        const own = corpus(n, ctx.rng, "-");
        for (const item of shared) mine.add(item);
        for (let i = 0; i < n; i++)
          other.add((i % 2 === 0 ? shared[i] : own[i]) as string);
        for (let i = 0; i < QUERY_STEPS; i++)
          ctx.step(() => {
            mine.similarity(other);
          });
      },
    },
  ],
};

// ── 축1 통계 판정 — `../../_contract/runTrials.ts` 가 시행마다 새 워커에서 `minHashTrial` 을 부른다 ──

/** 통계 판정의 이름. 헤더 「오차 보장」의 확률 문장이다. */
const SIMILARITY_ERROR = "닮음이 ε 넘게 벗어남";

/** 시행 하나에 세우는 인스턴스 짝 수. 합집합 크기의 로그 눈금을 이만큼의 칸으로 나눠 칸마다 하나씩 짚는다. */
const PAIRS = 4;

/** 시행 하나의 입력 — 짝마다 두 쪽에 넣을 차례와 참 닮음. 워커를 띄우기 전에 정해진다. */
export interface SimilarityInput {
  pairs: readonly {
    mine: readonly string[];
    other: readonly string[];
    union: number;
    common: number;
  }[];
}

/** 쪽 하나에 넣을 차례 — 원소 번호 목록을 받아 둘에 한 번 방금 넣은 원소를 다시 넣는다. */
function insertions(prefix: string, indices: readonly number[]): string[] {
  const out: string[] = [];
  for (const [call, index] of indices.entries()) {
    out.push(`${prefix}${index}`);
    if (call % 2 === 1) out.push(`${prefix}${index}`);
  }
  return out;
}

/** 시행 t 의 입력. seed · 시행 번호 · 모양 번호와 매개변수만 읽는다(원칙 B 의 B1). */
export function similarityInput(
  epsilon: number,
  delta: number,
  seed: number,
  trial: number,
  shape: number,
): SimilarityInput {
  const rng = rngFrom(trialSeed(seed, trial, shape));
  const tag = Math.floor(rng() * 36 ** 5).toString(36);
  const logSpan = Math.log(spanOf(epsilon, delta) + 1);
  const pairs = Array.from({ length: PAIRS }, (_, j) => {
    const union = Math.max(
      1,
      Math.floor(Math.exp(((j + rng()) / PAIRS) * logSpan)),
    );
    const common = Math.floor(rng() * (union + 1));
    const onlyMine = Math.floor(rng() * (union - common + 1));
    const range = (from: number, to: number) =>
      Array.from({ length: to - from }, (_, i) => from + i);
    const prefix = `+${tag}:${trial}:${j}:`;
    return {
      mine: insertions(prefix, range(0, common + onlyMine)),
      other: insertions(prefix, [
        ...range(0, common),
        ...range(common + onlyMine, union),
      ]),
      union,
      common,
    };
  });
  return { pairs };
}

/** 시행 함수. 워커 안에서 짝을 넷 세워 넣고 닮음이 벗어난 수를 센다. 판정은 하지 않는다. */
export function minHashTrial(
  make: SimilarityMaker,
  params: readonly [number, number],
  input: SimilarityInput,
): TrialResult {
  const [epsilon, delta] = params;
  let misses = 0;
  let first: string | null = null;
  let violation: string | null = null;
  let cost = 0;
  for (const { mine, other, union, common } of input.pairs) {
    const a = make(epsilon, delta);
    const b = make(epsilon, delta);
    for (const item of mine) a.add(item);
    for (const item of other) b.add(item);
    const guess = a.similarity(b);
    cost += (a.__cost ?? 0) + (b.__cost ?? 0);
    if (!(guess >= 0 && guess <= 1))
      violation ??= `닮음 ${guess} 가 [0, 1] 밖이다`;
    const truth = common / union;
    if (!(Math.abs(guess - truth) <= epsilon + 1e-9)) {
      misses++;
      first ??= `합집합 ${union} · 교집합 ${common} (참 닮음 ${truth}) 에 닮음 ${guess}`;
    }
  }
  return {
    violation,
    tallies: {
      [SIMILARITY_ERROR]: { events: input.pairs.length, misses, first },
    },
    cost,
  };
}

function trialShape(epsilon: number, delta: number, trials: number) {
  return {
    name: `(ε, δ) = (${epsilon}, ${delta})`,
    params: [epsilon, delta] as const,
    trials,
    judgments: [{ id: SIMILARITY_ERROR, delta }],
    input: (seed: number, trial: number, shape: number) =>
      similarityInput(epsilon, delta, seed, trial, shape),
  };
}

/** 통계 판정 계획. 시행 수는 `docs/ORD-006-conventions.md` 「원칙 B」 적용표 — 파일 머리 설명 참고. */
export const minHashTrials: TrialPlan<
  readonly [number, number],
  SimilarityInput
> = {
  name: "MinHash",
  trial: { module: import.meta.url, exportName: "minHashTrial" },
  seed: 1,
  shapes: [trialShape(0.1, 0.1, 24), trialShape(0.1, 0.05, 96)],
};
