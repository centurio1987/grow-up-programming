/**
 * `probabilistic/cuckooFilter` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./cuckooFilter.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을
 * 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **확률 문장은 축1 통계 판정으로 본다 — `../../_contract/runTrials.ts`(`docs/ORD-006-conventions.md` 「원칙 B」 · 그 적용 절).**
 * 무작위 시퀀스 · 경계 케이스는 결정적인 쪽만 대조한다. 시행 하나(`cuckooFilterTrial`)는 새 워커 하나(헤더의 공유 범위가
 * 「실행」이라 시행마다 새 실행 — 원칙 B 의 B3)에서 용량 128 필터 둘로 이렇게 본다. **넣을 원소 · 물을 원소 · 지우는 차례는 전부
 * 워커를 띄우기 전에 seed · 시행 번호 · 모양만으로 정한다**(B1) — 앞 판정은 지우는 차례가 `add` 의 반환에 기댔다.
 *
 * 1. **넣기(결정적).** 서로 다른 원소 112 개를 넣되 넣기 전에 `has` 를 묻는다. 담긴 사본이 용량 미만이고 `has` 가 거짓이던 원소가
 *    거절되면 떨어진다. 앞쪽 16 개를 한 번 더 넣는다(받아들이든 거절하든 된다). 받아들여진 원소는 전부 `has` 참이어야 한다.
 * 2. **찬 필터의 거짓 양성(확률).** 넣지 않은 원소 64 개를 묻는다. 몫 = 참의 수 ÷ 64.
 * 3. **지우기(결정적).** 입력이 정한 차례로 원소마다 넣은 횟수만큼(앞쪽 16 개는 두 번) 지운다. 사본이 남은 원소의 지우기는 참이어야
 *    하고, 사본이 남으면 `has` 가 참이어야 한다. 사본이 없는 원소의 지우기(거절된 넣기의 몫)가 참이면 헷갈린 지우기로 보고 그 뒤로
 *    결정적 판정을 멈춘다(헤더 「결정적 문장의 범위」).
 * 4. **다 지운 필터의 참(확률).** 원소 112 개를 다시 묻는다. 몫 = (사본 수가 0 이하인데 참인 원소 수) ÷ 112. **지우지 않고 참만 돌려주는
 *    구현이 여기서 걸린다** — 블룸 필터 계약과의 반례(`docs/ORD-006-conventions.md` 「A군 17종 판정」 ②)가 실행되는 자리다.
 * 5. **넣지 않은 원소의 지우기(확률).** 다른 필터를 원소 128 개로 채우고 넣지 않은 원소 64 개를 지운다. 몫 = 참의 수 ÷ 64. 헷갈린
 *    지우기는 다른 원소의 사본을 뺄 수 있으므로 판정 2 · 4 와 다른 필터에서 한다.
 *
 * | 모양 | 시행 T | 한계 k(판정 셋 공통) | [보장] 상한 exp(−T · D(k/T ‖ ε)) |
 * |---|---|---|---|
 * | 용량 128 · ε 0.1 | 16 | 11 | 1.22 × 10^−7 |
 * | 용량 128 · ε 0.01 | 16 | 6 | 3.58 × 10^−8 |
 *
 * **[보장]** 판정은 모양 둘 × 확률 판정 셋 = 여섯이고, 계약을 지키는 어느 구현이든 스위트 한 번에 떨어질 확률이 4.74 × 10^−7 이하다 —
 * Hoeffding(1963) 정리 1. **전제 셋:** ① 입력이 구현 무작위와 독립으로 정해진다(위) ② 시행끼리 독립 — 공유 범위가 실행이고 시행마다
 * 새 워커다(워커 사이 `Math.random` 의 독립은 실행 환경의 전제이고 확인하지 않았다) ③ 시행당 E[Z_t] ≤ ε — 확률 문장 둘이 원소마다 ε 를
 * 누르므로 기댓값의 선형성으로 선다. 판정 4 의 사건은 「사본이 없는 원소」라는 조건이 관측에 기대므로 확률 문장을 **그 조건 아래의
 * 확률**로 읽는다는 전제가 더 붙는다. k 는 「상한 ≤ 10^−6 ÷ 판정 수 6」 인 가장 작은 정수다(`../../_contract/judgeTrials.ts`).
 *
 * **[경험]** T 16 은 퇴화 fixture(`AlwaysYesCuckooFilter`, 몫 1)를 반드시 잡는 값이고, ε 0.01 모양은 ε 0.1 과 워커를 함께 쓰려고
 * 같은 T 로 두었다. fixture 들의 실제 판정 수치 · 반복 수는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * **무작위 시퀀스는 결정적인 문장만 짚는다 — 껍데기가 사본 수를 기록하고 셋을 관측값에서 뺀다.**
 *
 * - 사본이 있는 원소의 `add` 는 구현을 **부르지 않고** `"duplicate"` 를 낸다. 받아들이든 거절하든 계약이 허용하므로 참조
 *   모델이 뒤따를 수 없다. 사본의 판정은 통계 판정의 시행(위 1 · 3)이 한다.
 * - 사본이 없는 원소의 `has` 는 구현을 부르되 `"not-added"` 를 낸다(블룸 필터와 같다).
 * - 사본이 없는 원소의 `delete` 는 구현을 **부르지 않고** `"not-added"` 를 낸다. 헷갈린 지우기가 참이면 다른 원소의 사본이
 *   빠져 그 뒤의 결정적 관측이 전부 흔들린다. 그 지우기의 판정은 통계 판정(위 5)이 한다.
 * - 담긴 사본이 용량 이상일 때의 `add` 는 구현을 부르고 기록하되 `"over-capacity"` 를 낸다. 참조 모델은 그 뒤를 뒤따르지
 *   못하므로 경계 케이스 끝에만 둔다(무작위 시퀀스의 기본 용량 64 는 원소 40 개로 닿지 않는다).
 *
 * **무작위 시퀀스의 기본 필터는 ε = 10^−6 으로 세운다.** 사본이 없는 원소의 `add` 는 넣기 전 `has` 가 거짓일 때만 참이
 * 요구되는데, 껍데기는 그 `has` 를 먼저 묻지 않고 참을 기대한다 — 헷갈림이 드물어야(원소마다 확률 10^−6 이하) 그 기대가
 * 헤더와 어긋나지 않는다. 먼저 물어 보고 관측값을 가르면 참조 모델이 헷갈림을 알 수 없어 뒤따르지 못한다.
 *
 * **축3 시나리오의 n 은 용량이자 넣은 원소 수다.** L · ε 는 상수로 누른다(§규약2 시나리오 규칙 3). 적대적 시나리오는 두지
 * 않았다 — 비용을 가르는 입력은 구현의 해시를 읽어야 지어진다(불변 사실 44).
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
export interface CuckooFilterContract {
  add(item: string): boolean;
  has(item: string): boolean;
  delete(item: string): boolean;
}

type Built = CuckooFilterContract & { __cost?: number };

/** 필터를 세우는 함수. 스텁 · 정본 · fixture 가 같은 모양으로 넘긴다. */
export type CuckooMaker = (
  capacity: number,
  falsePositiveRate: number,
) => Built;

/** 축1 무작위 시퀀스가 도는 기본 필터의 모양. 파일 머리 설명 참고. */
const CAPACITY = 64;
const RATE = 1e-6;

const OUT_OF_RANGE = "RangeError";
const NOT_ADDED = "not-added";
const DUPLICATE = "duplicate";
const OVER_CAPACITY = "over-capacity";

function observe<T>(call: () => T): T | string {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 하네스용 껍데기. 필터 하나와 원소마다 받아들여진 사본 수를 들고, `reset` 으로 새 필터로 바꾼다. */
export class SizedCuckoo {
  readonly #make: CuckooMaker;
  #filter: Built;
  #copies = new Map<string, number>();
  #count = 0;
  #capacity = CAPACITY;
  #carried = 0;

  constructor(make: CuckooMaker) {
    this.#make = make;
    this.#filter = make(CAPACITY, RATE);
  }

  get __cost(): number {
    return this.#carried + (this.#filter.__cost ?? 0);
  }

  get filter(): CuckooFilterContract {
    return this.#filter;
  }

  /** 새 필터로 바꾼다. 생성자가 던지면 이전 필터와 기록을 그대로 두고 그 예외를 올려보낸다. */
  reset(capacity: number, falsePositiveRate: number): void {
    const next = this.#make(capacity, falsePositiveRate);
    this.#carried += this.#filter.__cost ?? 0;
    this.#filter = next;
    this.#copies = new Map<string, number>();
    this.#count = 0;
    this.#capacity = capacity;
  }

  add(item: string): boolean | string {
    const held = this.#copies.get(item) ?? 0;
    if (this.#count < this.#capacity && held > 0) return DUPLICATE;
    const accepted = this.#filter.add(item);
    if (accepted) {
      this.#copies.set(item, held + 1);
      this.#count += 1;
    }
    return this.#count - (accepted ? 1 : 0) >= this.#capacity
      ? OVER_CAPACITY
      : accepted;
  }

  has(item: string): boolean | string {
    const answer = this.#filter.has(item);
    return (this.#copies.get(item) ?? 0) > 0 ? answer : NOT_ADDED;
  }

  delete(item: string): boolean | string {
    const held = this.#copies.get(item) ?? 0;
    if (held === 0) return NOT_ADDED;
    const removed = this.#filter.delete(item);
    if (removed) {
      this.#copies.set(item, held - 1);
      this.#count -= 1;
    }
    return removed;
  }
}

/** 축1 참조 모델. 원소마다 사본 수 · 담긴 사본 수 · 용량. */
interface Model {
  copies: Map<string, number>;
  count: number;
  capacity: number;
}

/** 축1 무작위 원소 40 개. `probabilistic/bloomFilter` 와 같은 모양이다. */
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

/** 축1 무작위 생성 인자. 받아들이는 값은 기본 모양 하나다(`linear/bitArray` 의 규칙). */
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

function validShape(capacity: number, falsePositiveRate: number): boolean {
  return (
    Number.isInteger(capacity) &&
    capacity >= 0 &&
    falsePositiveRate > 0 &&
    falsePositiveRate < 1
  );
}

/** 축3 시나리오용 원소 n 개. 길이를 10 으로 고정해 L 을 상수로 누른다. */
function corpus(n: number, rng: () => number, mark: string): string[] {
  const tag = Math.floor(rng() * 36 ** 3)
    .toString(36)
    .padStart(3, "0");
  return Array.from(
    { length: n },
    (_, i) => `${mark}${tag}${i.toString(36).padStart(6, "0")}`,
  );
}

/** 0 부터 n − 1 까지를 섞은 차례. */
function shuffled(n: number, rng: () => number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  return order;
}

/** 축3 시나리오의 목표 오차. 무작위 시퀀스의 10^−6 과 달리 흔한 값으로 둔다 — L · ε 는 어느 값이든 상수다. */
const SCENARIO_RATE = 0.01;

export const cuckooFilterContract: ContractSpec<SizedCuckoo, Model> = {
  name: "CuckooFilter",
  grade: "basic",
  model: () => ({ copies: new Map(), count: 0, capacity: CAPACITY }),

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
        model.copies = new Map();
        model.count = 0;
        model.capacity = capacity;
        return undefined;
      },
    },
    {
      name: "add",
      arg: (rng) => someItem(rng),
      onImpl: (impl, arg) => impl.add(arg as string),
      onModel: (model, arg) => {
        const item = arg as string;
        if (model.count >= model.capacity) return OVER_CAPACITY;
        if ((model.copies.get(item) ?? 0) > 0) return DUPLICATE;
        model.copies.set(item, 1);
        model.count += 1;
        return true;
      },
    },
    {
      name: "has",
      arg: (rng) => someItem(rng),
      onImpl: (impl, arg) => impl.has(arg as string),
      onModel: (model, arg) =>
        (model.copies.get(arg as string) ?? 0) > 0 ? true : NOT_ADDED,
    },
    {
      name: "delete",
      arg: (rng) => someItem(rng),
      onImpl: (impl, arg) => impl.delete(arg as string),
      onModel: (model, arg) => {
        const item = arg as string;
        const held = model.copies.get(item) ?? 0;
        if (held === 0) return NOT_ADDED;
        model.copies.set(item, held - 1);
        model.count -= 1;
        return true;
      },
    },
  ],

  edges: [
    {
      name: "넣은 원소는 has 가 참이고 delete 가 참이며, 지운 원소는 다시 넣을 수 있다 · 빈 문자열 · 16비트 글자",
      steps: [
        { op: "add", arg: "a" },
        { op: "has", arg: "a" },
        { op: "delete", arg: "a" },
        { op: "has", arg: "a" },
        { op: "delete", arg: "a" },
        { op: "add", arg: "a" },
        { op: "has", arg: "a" },
        { op: "add", arg: "" },
        { op: "has", arg: "" },
        { op: "delete", arg: "" },
        { op: "add", arg: "가나" },
        { op: "has", arg: "가나" },
      ],
    },
    {
      // 지우기가 원소 하나만 뺀다. 칸을 함께 쓰는 구현이 끄기로 지우면 이웃이 거짓 음성이 된다.
      name: "하나를 지워도 나머지는 전부 참이다",
      steps: [
        { op: "add", arg: "p" },
        { op: "add", arg: "q" },
        { op: "add", arg: "r" },
        { op: "add", arg: "s" },
        { op: "add", arg: "t" },
        { op: "delete", arg: "r" },
        { op: "has", arg: "p" },
        { op: "has", arg: "q" },
        { op: "has", arg: "s" },
        { op: "has", arg: "t" },
        { op: "delete", arg: "p" },
        { op: "delete", arg: "t" },
        { op: "has", arg: "q" },
        { op: "has", arg: "s" },
      ],
    },
    {
      // 용량을 채울 때까지 새 원소는 전부 참이다. 그다음 넣기는 계약이 정하지 않으므로 이 경계의 끝에만 둔다.
      name: "용량까지 새 원소는 거절되지 않고, 넘는 넣기는 정하지 않으며 앞서 넣은 원소는 그대로 참이다",
      steps: [
        { op: "constructor", arg: [3, 1e-6] },
        { op: "add", arg: "u" },
        { op: "add", arg: "v" },
        { op: "add", arg: "w" },
        { op: "add", arg: "x" },
        { op: "has", arg: "u" },
        { op: "has", arg: "v" },
        { op: "has", arg: "w" },
      ],
    },
    {
      // 지운 뒤에는 담긴 사본이 줄어 용량 안으로 돌아온다.
      name: "지우면 용량이 다시 난다",
      steps: [
        { op: "constructor", arg: [2, 1e-6] },
        { op: "add", arg: "u" },
        { op: "add", arg: "v" },
        { op: "delete", arg: "u" },
        { op: "add", arg: "w" },
        { op: "has", arg: "v" },
        { op: "has", arg: "w" },
        { op: "delete", arg: "v" },
        { op: "delete", arg: "w" },
        { op: "add", arg: "u" },
        { op: "has", arg: "u" },
      ],
    },
    {
      name: "용량 0 · 음수 · 정수가 아닌 용량 · 0 이하 · 1 이상 오차 — 거절된 생성은 이전 필터를 남긴다",
      steps: [
        { op: "add", arg: "k" },
        { op: "constructor", arg: [-1, 0.01] },
        { op: "constructor", arg: [2.5, 0.01] },
        { op: "constructor", arg: [8, 0] },
        { op: "constructor", arg: [8, 1] },
        { op: "constructor", arg: [8, -0.5] },
        { op: "constructor", arg: [8, 1.5] },
        { op: "has", arg: "k" },
        { op: "delete", arg: "k" },
        { op: "constructor", arg: [1, 0.999] },
        { op: "add", arg: "k" },
        { op: "has", arg: "k" },
        { op: "constructor", arg: [0, 0.01] },
        { op: "has", arg: "k" },
        { op: "add", arg: "k" },
      ],
    },
  ],

  invariants: [],

  scenarios: [
    seededInput({
      // 용량 n 으로 세우고 서로 다른 원소 n 개를 넣는다. 끝으로 갈수록 찬 칸이 많아진다.
      covers: ["add"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n, SCENARIO_RATE);
        const filter = impl.filter;
        for (const item of corpus(n, ctx.rng, "+"))
          ctx.step(() => filter.add(item));
      },
    }),
    seededInput({
      // 용량을 채운 뒤 넣은 원소와 넣지 않은 원소를 번갈아 묻는다.
      covers: ["has"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n, SCENARIO_RATE);
        const filter = impl.filter;
        const inside = corpus(n, ctx.rng, "+");
        const outside = corpus(n, ctx.rng, "?");
        for (const item of inside) filter.add(item);
        for (let i = 0; i < n; i++) {
          const item = (i % 2 === 0 ? inside[i] : outside[i]) as string;
          ctx.step(() => filter.has(item));
        }
      },
    }),
    seededInput({
      // 용량을 채운 뒤 섞은 차례로 전부 지운다. 담긴 것을 훑어 찾는 계열이 여기서 걸린다.
      covers: ["delete"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n, SCENARIO_RATE);
        const filter = impl.filter;
        const inside = corpus(n, ctx.rng, "+");
        for (const item of inside) filter.add(item);
        for (const index of shuffled(n, ctx.rng)) {
          const item = inside[index] as string;
          ctx.step(() => filter.delete(item));
        }
      },
    }),
  ],
};

// ── 축1 통계 판정 — `../../_contract/runTrials.ts` 가 시행마다 새 워커에서 `cuckooFilterTrial` 을 부른다 ──

/** 통계 판정의 이름 셋. 헤더 「오차 보장」의 확률 문장 둘을 판정 자리 셋으로 나눈 것이다. */
const FULL_HITS = "찬 필터의 거짓 양성";
const EMPTIED_HITS = "다 지운 필터의 참";
const STRAY_DELETES = "넣지 않은 원소의 지우기 참";

/** 시행 하나의 용량 · 다시 넣는 원소 수 · 묻는 수. 파일 머리 설명 참고. */
const TRIAL_CAPACITY = 128;
const TRIAL_EXTRA = 16;
const TRIAL_QUERIES = 64;

/** 시행 하나의 입력. 워커를 띄우기 전에 정해진다. */
export interface CuckooInput {
  /** 첫 필터에 넣는 서로 다른 원소. 앞쪽 `extra` 개는 한 번 더 넣는다. */
  distinct: readonly string[];
  extra: number;
  /** 찬 필터에 묻는 넣지 않은 원소. */
  absent: readonly string[];
  /** `distinct` 의 번호를 지우는 차례. */
  deleteOrder: readonly number[];
  /** 둘째 필터를 채우는 원소와, 그 필터에서 지우는 넣지 않은 원소. */
  fill: readonly string[];
  stray: readonly string[];
}

/** 시행 t 의 입력. seed · 시행 번호 · 모양 번호와 용량만 읽는다(원칙 B 의 B1). */
export function cuckooInput(
  capacity: number,
  seed: number,
  trial: number,
  shape: number,
): CuckooInput {
  const rng = rngFrom(trialSeed(seed, trial, shape));
  const tag = Math.floor(rng() * 36 ** 5).toString(36);
  const extra = Math.min(TRIAL_EXTRA, Math.floor(capacity / 4));
  const count = capacity - extra;
  return {
    distinct: Array.from({ length: count }, (_, i) => `+${tag}:${i}`),
    extra,
    absent: Array.from({ length: TRIAL_QUERIES }, (_, i) => `?${tag}:${i}`),
    deleteOrder: shuffled(count, rng),
    fill: Array.from({ length: capacity }, (_, i) => `=${tag}:${i}`),
    stray: Array.from({ length: TRIAL_QUERIES }, (_, i) => `!${tag}:${i}`),
  };
}

/** 시행 함수. 워커 안에서 필터 둘을 세워 넣고 · 묻고 · 지운다. 판정은 하지 않는다. */
export function cuckooFilterTrial(
  make: CuckooMaker,
  params: readonly [number, number],
  input: CuckooInput,
): TrialResult {
  const [capacity, rate] = params;
  let violation: string | null = null;
  const fail = (text: string) => {
    violation ??= text;
  };

  const filter = make(capacity, rate);
  const copies = input.distinct.map(() => 0);
  let held = 0;
  for (const [i, item] of input.distinct.entries()) {
    const confused = filter.has(item);
    if (filter.add(item)) {
      copies[i] = 1;
      held += 1;
    } else if (!confused && held < capacity) {
      fail(`용량 미만의 새 원소가 거절됐다 — ${i}번째(넣기 전 has 거짓)`);
    }
  }
  for (let i = 0; i < input.extra; i++) {
    if (filter.add(input.distinct[i] as string)) {
      copies[i] = (copies[i] as number) + 1;
      held += 1;
    }
  }
  for (const [i, item] of input.distinct.entries()) {
    if ((copies[i] as number) > 0 && !filter.has(item)) {
      fail(`거짓 음성 — ${item}`);
      break;
    }
  }

  let fullMisses = 0;
  let fullFirst: string | null = null;
  for (const item of input.absent) {
    if (filter.has(item)) {
      fullMisses++;
      fullFirst ??= `찬 필터에서 넣지 않은 원소 ${item} 에 참`;
    }
  }

  let confusedDelete = false;
  for (const i of input.deleteOrder) {
    const item = input.distinct[i] as string;
    const rounds = i < input.extra ? 2 : 1;
    for (let round = 0; round < rounds; round++) {
      const had = copies[i] as number;
      const removed = filter.delete(item);
      if (had > 0) {
        if (removed) {
          copies[i] = had - 1;
          if (had > 1 && !confusedDelete && !filter.has(item))
            fail(`${item} 의 사본이 ${had - 1} 개 남았는데 has 가 거짓`);
        } else if (!confusedDelete) {
          fail(`${item} 의 사본 ${had} 개가 남았는데 delete 가 거짓`);
        }
      } else if (removed) {
        copies[i] = had - 1;
        confusedDelete = true;
      }
    }
  }

  let emptiedMisses = 0;
  let emptiedFirst: string | null = null;
  for (const [i, item] of input.distinct.entries()) {
    if ((copies[i] as number) <= 0 && filter.has(item)) {
      emptiedMisses++;
      emptiedFirst ??= `사본을 다 지운 원소 ${item} 에 참`;
    }
  }

  const other = make(capacity, rate);
  for (const item of input.fill) other.add(item);
  let strayMisses = 0;
  let strayFirst: string | null = null;
  for (const item of input.stray) {
    if (other.delete(item)) {
      strayMisses++;
      strayFirst ??= `넣지 않은 원소 ${item} 의 지우기가 참`;
    }
  }

  return {
    violation,
    tallies: {
      [FULL_HITS]: {
        events: input.absent.length,
        misses: fullMisses,
        first: fullFirst,
      },
      [EMPTIED_HITS]: {
        events: input.distinct.length,
        misses: emptiedMisses,
        first: emptiedFirst,
      },
      [STRAY_DELETES]: {
        events: input.stray.length,
        misses: strayMisses,
        first: strayFirst,
      },
    },
    cost: (filter.__cost ?? 0) + (other.__cost ?? 0),
  };
}

function trialShape(rate: number, trials: number) {
  return {
    name: `용량 ${TRIAL_CAPACITY} · ε ${rate}`,
    params: [TRIAL_CAPACITY, rate] as const,
    trials,
    judgments: [
      { id: FULL_HITS, delta: rate },
      { id: EMPTIED_HITS, delta: rate },
      { id: STRAY_DELETES, delta: rate },
    ],
    input: (seed: number, trial: number, shape: number) =>
      cuckooInput(TRIAL_CAPACITY, seed, trial, shape),
  };
}

/** 통계 판정 계획. 시행 수는 `docs/ORD-006-conventions.md` 「원칙 B」 적용표 — 파일 머리 설명 참고. */
export const cuckooFilterTrials: TrialPlan<
  readonly [number, number],
  CuckooInput
> = {
  name: "CuckooFilter",
  trial: { module: import.meta.url, exportName: "cuckooFilterTrial" },
  seed: 1,
  shapes: [trialShape(0.1, 16), trialShape(0.01, 16)],
};
