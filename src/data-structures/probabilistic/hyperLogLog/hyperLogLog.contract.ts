/**
 * `probabilistic/hyperLogLog` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./hyperLogLog.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을
 * 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **확률 문장은 축1 통계 판정으로 본다 — `../../_contract/runTrials.ts`(`docs/ORD-006-conventions.md` 「원칙 B」 · 그 적용 절).**
 * 무작위 시퀀스 · 경계 케이스는 결정적인 쪽만 대조하고, 오차는 **독립 시행**으로 판정한다(`runContract.ts` 는 고치지 않았다).
 * 시행 하나(`hyperLogLogTrial`)는 이렇다.
 *
 * 1. **새 워커 하나.** 헤더가 구현 무작위의 공유 범위를 「실행」으로 적었으므로 시행마다 새 실행이다(원칙 B 의 B3). 워커는
 *    모듈 그래프를 새로 읽어 해시를 새로 뽑는다.
 * 2. **인스턴스 넷.** 저마다 서로 다른 원소 수 n 을 1 ~ `spanOf(ε, δ)` = max(4,096, ⌈16/(ε² · δ)⌉) 의 로그 눈금 네 칸에 하나씩
 *    뽑고, 원소(`+<꼬리표>:<시행>:<인스턴스>:<번호>`) n 개를 넣되 둘에 한 번 앞서 넣은 원소를 다시 넣는다(넣은 호출 수를 세는
 *    구현이 드러난다). **원소 목록은 워커를 띄우기 전에 seed · 시행 번호 · 모양만으로 정한다**(B1 — 구현의 관측값을 읽을 길이
 *    없다). 범위는 구현을 읽지 않고 매개변수에서만 정한다(불변 사실 44).
 * 3. **Z_t** = (추정이 n 에서 ε · n 넘게 벗어난 인스턴스 수) ÷ 4. 모양마다 합 S = Σ Z_t 가 한계 k 를 넘으면 떨어진다.
 *
 * | 모양 (ε, δ) | 시행 T | 한계 k | [보장] 상한 exp(−T · D(k/T ‖ δ)) |
 * |---|---|---|---|
 * | (0.3, 0.3) | 16 | 15 | 4.23 × 10^−7 |
 * | (0.1, 0.1) | 56 | 21 | 3.08 × 10^−7 |
 *
 * **[보장]** 계약을 지키는 어느 구현이든 한 판정에서 떨어질 확률이 위 상한 이하이고 스위트 한 번에 7.31 × 10^−7 이하다 —
 * Hoeffding(1963) 정리 1(평균이 δ 이하인 [0, 1] 값 독립 변수의 합). **전제 셋:** ① 입력이 구현 무작위와 독립으로 정해진다(위 2)
 * ② 시행끼리 독립 — 계약의 공유 범위가 실행이고 시행마다 새 워커다(워커 사이 `Math.random` 의 독립은 실행 환경의 전제이고
 * 확인하지 않았다) ③ 시행당 E[Z_t] ≤ δ — 확률 문장이 인스턴스마다 δ 를 누르므로 기댓값의 선형성으로 선다(인스턴스 사이의
 * 독립은 필요 없다). 그래서 **한 시행 안의 네 추정이 함께 틀리는 구현도** 부당하게 더 떨어지지 않는다 — Z_t 가 베르누이(δ)인
 * 그 구현이 이 상한의 최악 경우다. k 는 「상한 ≤ 10^−6 ÷ 판정 수 2」 인 가장 작은 정수다(`../../_contract/judgeTrials.ts`).
 *
 * **[경험]** T 는 목표를 읽지 않는 fixture(`FixedPrecisionSketch`, 벗어난 몫을 0.55 로 둔 이항 모형)를 놓칠 모형 확률이 10^−6
 * 이하인 가장 작은 8 의 배수다(모형 확률 1.05 × 10^−7) — 모형이고 보장이 아니다. fixture 들의 실제 판정 수치 · 반복 수는
 * `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」 표.
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

import { seededInput } from "../../_contract/expectedRepeat";
import { rngFrom } from "../../_contract/judge";
import {
  type TrialPlan,
  type TrialResult,
  trialSeed,
} from "../../_contract/judgeTrials";
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
  ],

  invariants: [],

  scenarios: [
    seededInput({
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
    }),
    seededInput({
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
    }),
    seededInput({
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
    }),
  ],
};

// ── 축1 통계 판정 — `../../_contract/runTrials.ts` 가 시행마다 새 워커에서 `hyperLogLogTrial` 을 부른다 ──

/** 통계 판정의 이름. 헤더 「오차 보장」의 확률 문장이다. */
const RELATIVE_ERROR = "추정이 ε·n 넘게 벗어남";

/** 시행 하나에 세우는 인스턴스 수. 원소 수의 로그 눈금을 이만큼의 칸으로 나눠 칸마다 하나씩 짚는다. */
const INSTANCES = 4;

/** 시행 하나의 입력 — 인스턴스마다 서로 다른 원소 수와 넣을 차례. 워커를 띄우기 전에 정해진다. */
export interface CardinalityInput {
  instances: readonly { distinct: number; items: readonly string[] }[];
}

/** 시행 t 의 입력. seed · 시행 번호 · 모양 번호와 매개변수만 읽는다(원칙 B 의 B1). */
export function cardinalityInput(
  epsilon: number,
  delta: number,
  seed: number,
  trial: number,
  shape: number,
): CardinalityInput {
  const rng = rngFrom(trialSeed(seed, trial, shape));
  const tag = Math.floor(rng() * 36 ** 5).toString(36);
  const logSpan = Math.log(spanOf(epsilon, delta) + 1);
  const instances = Array.from({ length: INSTANCES }, (_, j) => {
    const distinct = Math.max(
      1,
      Math.floor(Math.exp(((j + rng()) / INSTANCES) * logSpan)),
    );
    const items: string[] = [];
    for (let i = 0; i < distinct; i++) {
      items.push(`+${tag}:${trial}:${j}:${i}`);
      if (i % 2 === 1) items.push(`+${tag}:${trial}:${j}:${i >> 1}`);
    }
    return { distinct, items };
  });
  return { instances };
}

/** 시행 함수. 워커 안에서 인스턴스를 넷 세워 넣고 추정이 벗어난 수를 센다. 판정은 하지 않는다. */
export function hyperLogLogTrial(
  make: SketchMaker,
  params: readonly [number, number],
  input: CardinalityInput,
): TrialResult {
  const [epsilon, delta] = params;
  let misses = 0;
  let first: string | null = null;
  let cost = 0;
  for (const { distinct, items } of input.instances) {
    const sketch = make(epsilon, delta);
    for (const item of items) sketch.add(item);
    const guess = sketch.count();
    cost += sketch.__cost ?? 0;
    if (!(Math.abs(guess - distinct) <= epsilon * distinct + 1e-9)) {
      misses++;
      first ??= `서로 다른 원소 ${distinct} 개에 추정 ${guess}`;
    }
  }
  return {
    violation: null,
    tallies: {
      [RELATIVE_ERROR]: { events: input.instances.length, misses, first },
    },
    cost,
  };
}

function trialShape(epsilon: number, delta: number, trials: number) {
  return {
    name: `(ε, δ) = (${epsilon}, ${delta})`,
    params: [epsilon, delta] as const,
    trials,
    judgments: [{ id: RELATIVE_ERROR, delta }],
    input: (seed: number, trial: number, shape: number) =>
      cardinalityInput(epsilon, delta, seed, trial, shape),
  };
}

/** 통계 판정 계획. 시행 수는 `docs/ORD-006-conventions.md` 「원칙 B」 적용표 — 파일 머리 설명 참고. */
export const hyperLogLogTrials: TrialPlan<
  readonly [number, number],
  CardinalityInput
> = {
  name: "HyperLogLog",
  trial: { module: import.meta.url, exportName: "hyperLogLogTrial" },
  seed: 1,
  shapes: [trialShape(0.3, 0.3, 16), trialShape(0.1, 0.1, 56)],
};
