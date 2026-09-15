/**
 * `probabilistic/cuckooFilter` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./cuckooFilter.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을
 * 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **오차 판정은 `probabilistic/bloomFilter` 가 세운 방식을 그대로 쓴다** — 축1 연산 하나(`errorCheck`)가 새 필터를 세워
 * 판정을 불리언 관측값으로 돌려주고 참조 모델은 늘 `true` 다. 여유(2) · 한 판정에 기대하는 참의 수(64)도 같다 — 근거는
 * `../bloomFilter/bloomFilter.contract.ts` 머리말. 하네스는 고치지 않았다. 판정이 보는 것은 여섯이다.
 *
 * 1. **용량 미만의 새 원소는 거절되지 않는다.** seed 로 정한 서로 다른 원소를 넣되, 넣기 전에 `has` 가 거짓이던 원소가
 *    거절되면 떨어진다. 넣기 전에 참이던 원소(헷갈린 원소)의 거절은 헤더가 허용한다.
 * 2. **사본.** 앞쪽 원소 몇 개를 한 번 더 넣는다. 받아들여지든 거절되든 되지만, 받아들인 수만큼 지우기가 참이어야 한다.
 * 3. **거짓 음성이 없다.** 받아들여진 원소는 전부 `has` 참.
 * 4. **거짓 양성(찬 필터).** 넣지 않은 원소 `64 / ε` 개 중 `has` 참이 128 개 이하.
 * 5. **지우기가 지운다.** 받아들인 사본을 전부 지우고(매번 참이어야 하고, 사본이 둘인 원소는 첫 지우기 뒤에도 `has` 참),
 *    빈 필터에 지운 원소와 넣지 않은 원소를 함께 물어 참이 2 · ε · (물은 수) 이하. **지우지 않고 참만 돌려주는 구현이
 *    여기서 걸린다** — 블룸 필터 계약과의 반례(`docs/ORD-006-conventions.md` 「A군 17종 판정」 ②)가 실행되는 자리다.
 * 6. **넣지 않은 원소의 지우기.** 새 필터를 채우고 넣지 않은 원소 `64 / ε` 개를 지워 참이 128 개 이하. 헷갈린 지우기는
 *    다른 원소의 사본을 뺄 수 있으므로 **판정 4 · 5 와 다른 필터**에서 한다.
 *
 * **무작위 시퀀스는 결정적인 문장만 짚는다 — 껍데기가 사본 수를 기록하고 셋을 관측값에서 뺀다.**
 *
 * - 사본이 있는 원소의 `add` 는 구현을 **부르지 않고** `"duplicate"` 를 낸다. 받아들이든 거절하든 계약이 허용하므로 참조
 *   모델이 뒤따를 수 없다. 사본의 판정은 위 2 · 5 가 한다.
 * - 사본이 없는 원소의 `has` 는 구현을 부르되 `"not-added"` 를 낸다(블룸 필터와 같다).
 * - 사본이 없는 원소의 `delete` 는 구현을 **부르지 않고** `"not-added"` 를 낸다. 헷갈린 지우기가 참이면 다른 원소의 사본이
 *   빠져 그 뒤의 결정적 관측이 전부 흔들린다. 그 지우기의 판정은 위 6 이 한다.
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

import { rngFrom } from "../../_contract/judge";
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

/** `probabilistic/bloomFilter` 와 같은 값. 근거는 그쪽 머리말. */
const QUOTA = 64;
const MARGIN = 2;

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

/** 오차 판정 하나에서 센 값. 자기시험과 탐침이 판정과 같은 수를 읽도록 내보낸다. */
export interface CuckooMeasure {
  /** 넣기 전 `has` 가 거짓이었는데 거절된 새 원소의 차례. 없으면 `null`. */
  refusedNew: number | null;
  /** 헷갈려 거절된 새 원소 수(허용). */
  refusedConfused: number;
  /** 한 번 더 넣은 사본 중 받아들여진 수. */
  acceptedDuplicates: number;
  /** 받아들인 원소 중 `has` 가 거짓인 첫 원소. 없으면 `null`. */
  falseNegative: string | null;
  /** 찬 필터에서 넣지 않은 원소 `queries` 개 중 참의 수. */
  fullHits: number;
  queries: number;
  /** 받아들인 사본을 지우다 거짓이 나온 첫 원소(또는 사본이 남았는데 `has` 거짓). 없으면 `null`. */
  failedDelete: string | null;
  /** 빈 필터에서 지운 원소 + 넣지 않은 원소 `emptyAsked` 개 중 참의 수. */
  emptyHits: number;
  emptyAsked: number;
  /** 다른 필터를 채우고 넣지 않은 원소 `queries` 개를 지웠을 때 참의 수. */
  strayDeletes: number;
}

export function measureCuckoo(
  make: CuckooMaker,
  capacity: number,
  falsePositiveRate: number,
  seed: number,
): CuckooMeasure {
  const tag = Math.floor(rngFrom(seed)() * 36 ** 5).toString(36);
  const extra = Math.min(16, Math.floor(capacity / 4));
  const distinct = capacity - extra;
  const queries = Math.round(QUOTA / falsePositiveRate);

  const filter = make(capacity, falsePositiveRate);
  const copies: number[] = [];
  let refusedNew: number | null = null;
  let refusedConfused = 0;
  for (let i = 0; i < distinct; i++) {
    const item = `+${tag}:${i}`;
    const confused = filter.has(item);
    const accepted = filter.add(item);
    copies.push(accepted ? 1 : 0);
    if (!accepted && !confused && refusedNew === null) refusedNew = i;
    if (!accepted && confused) refusedConfused += 1;
  }
  let acceptedDuplicates = 0;
  for (let i = 0; i < extra; i++) {
    if (filter.add(`+${tag}:${i}`)) {
      copies[i] = (copies[i] as number) + 1;
      acceptedDuplicates += 1;
    }
  }

  let falseNegative: string | null = null;
  for (let i = 0; i < distinct && falseNegative === null; i++) {
    if ((copies[i] as number) > 0 && !filter.has(`+${tag}:${i}`))
      falseNegative = `+${tag}:${i}`;
  }

  let fullHits = 0;
  for (let i = 0; i < queries; i++) if (filter.has(`?${tag}:${i}`)) fullHits++;

  let failedDelete: string | null = null;
  for (let i = 0; i < distinct && failedDelete === null; i++) {
    const item = `+${tag}:${i}`;
    for (let left = copies[i] as number; left > 0; left--) {
      if (!filter.delete(item)) {
        failedDelete = `${item} 의 사본 ${left} 개가 남았는데 delete 가 거짓`;
        break;
      }
      if (left > 1 && !filter.has(item)) {
        failedDelete = `${item} 의 사본이 ${left - 1} 개 남았는데 has 가 거짓`;
        break;
      }
    }
  }

  let emptyHits = 0;
  for (let i = 0; i < distinct; i++)
    if (filter.has(`+${tag}:${i}`)) emptyHits++;
  for (let i = 0; i < queries; i++) if (filter.has(`?${tag}:${i}`)) emptyHits++;

  const other = make(capacity, falsePositiveRate);
  for (let i = 0; i < capacity; i++) other.add(`+${tag}:${i}`);
  let strayDeletes = 0;
  for (let i = 0; i < queries; i++)
    if (other.delete(`!${tag}:${i}`)) strayDeletes++;

  return {
    refusedNew,
    refusedConfused,
    acceptedDuplicates,
    falseNegative,
    fullHits,
    queries,
    failedDelete,
    emptyHits,
    emptyAsked: distinct + queries,
    strayDeletes,
  };
}

/** 오차 판정 하나. 통과하면 `true`, 아니면 처음 어긋난 판정을 적은 문자열. */
export function judgeCuckoo(
  make: CuckooMaker,
  capacity: number,
  falsePositiveRate: number,
  seed: number,
): true | string {
  const m = measureCuckoo(make, capacity, falsePositiveRate, seed);
  const limit = MARGIN * QUOTA;
  if (m.refusedNew !== null)
    return `용량 미만의 새 원소가 거절됐다 — ${m.refusedNew}번째(넣기 전 has 거짓)`;
  if (m.falseNegative !== null) return `거짓 음성 — ${m.falseNegative}`;
  if (m.fullHits > limit)
    return `찬 필터의 거짓 양성 ${m.fullHits} / 한계 ${limit} (물은 수 ${m.queries}, ε = ${falsePositiveRate})`;
  if (m.failedDelete !== null) return `지우기 — ${m.failedDelete}`;
  const emptyLimit = Math.floor(MARGIN * falsePositiveRate * m.emptyAsked);
  if (m.emptyHits > emptyLimit)
    return `다 지운 필터의 참 ${m.emptyHits} / 한계 ${emptyLimit} (물은 수 ${m.emptyAsked}) — 지우기가 지우지 않는다`;
  if (m.strayDeletes > limit)
    return `넣지 않은 원소의 지우기 참 ${m.strayDeletes} / 한계 ${limit} (지운 수 ${m.queries})`;
  return true;
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

  judge(
    capacity: number,
    falsePositiveRate: number,
    seed: number,
  ): true | string {
    return judgeCuckoo(this.#make, capacity, falsePositiveRate, seed);
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

/** 축1 무작위 판정 인자. 가벼운 모양(용량 128 · ε ∈ {0.1, 0.01}) 과 seed. */
function someCheck(rng: () => number): [number, number, number] {
  const rate = rng() < 0.5 ? 0.1 : 0.01;
  return [128, rate, Math.floor(rng() * 0x7fff_ffff)];
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
    {
      name: "errorCheck",
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
    {
      name: "오차 판정 — 새 원소 거절 없음 · 거짓 음성 없음 · 찬 필터와 다 지운 필터의 참 · 넣지 않은 원소의 지우기 (ε = 0.1 · 0.01 · 0.001)",
      steps: [
        { op: "errorCheck", arg: [256, 0.1, 1] },
        { op: "errorCheck", arg: [1024, 0.01, 2] },
        { op: "errorCheck", arg: [1024, 0.001, 3] },
      ],
    },
  ],

  invariants: [],

  scenarios: [
    {
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
    },
    {
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
    },
    {
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
    },
  ],
};
