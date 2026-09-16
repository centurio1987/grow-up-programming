/**
 * `heap/vanEmdeBoasTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./vanEmdeBoasTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** `runContract` 는 인자 없는 팩토리를 받는데 이 구조는
 * **우주 크기 u 를 생성자로 받는다.** 축1은 u 하나(100)에서 돌면 되지만 축3은 u 를 사다리에 올려야
 * 하므로, 껍데기가 `reset(u)` 로 그 우주의 구조를 다시 세우고 버린 구조의 비용을 이어서 센다.
 * `reset` 은 시나리오의 준비 작업이라 걸음에 안 들어간다. 껍데기는 계약의 일부가 아니다.
 *
 * **범위 밖 인자를 관측값으로 만든다.** 계약이 키와 우주 크기의 범위 밖에 `RangeError` 를 적었는데
 * 하네스는 던진 것을 값으로 대조하지 못한다. 양쪽을 같은 방식으로 감싸 문자열 하나로 바꾸고,
 * `RangeError` 가 아닌 예외는 그대로 올려보낸다(스텁의 `Not implemented` 가 통과로 읽히면 안 된다).
 *
 * **생성자 행을 축1이 재는 자리가 `reset` 연산이다.** 무작위 시퀀스는 `reset` 에 **거절될 우주만**
 * 뽑는다 — 받아들이는 `reset` 은 담긴 것을 비우므로 무작위 시퀀스에 섞이면 시퀀스가 짧은 조각으로
 * 끊긴다. 받아들이는 자리(u = 1 · 2 · 6)는 경계 케이스가 짚는다.
 *
 * **축3의 사다리가 무엇을 오르는지가 시나리오마다 다르다**(헤더 「연산 계약」 · §규약2 「상한이
 * 우주의 로그 로그인 계약은 Bound 를 늘리지 않는다」). 계약의 상한에 원소 수 n 이 없고 우주 u 만
 * 있으므로 시나리오를 둘로 가른다.
 *
 * | 사다리가 오르는 것 | 고정하는 것 | bound | 잡는 계열 |
 * |---|---|---|---|
 * | 담긴 원소 수 n | 우주 $2^{16}$ | `O(1)` | 원소 수에 비례하는 계열(정렬 배열) |
 * | 우주 u | 담긴 원소 몇 개 | `O(1)` | 우주 크기의 거듭제곱에 비례하는 계열(비트 배열 · 제곱근 묶음) |
 *
 * **둘 다 bound 가 `O(1)` 이다.** 앞쪽은 상한에 n 이 없으니 그대로이고, 뒤쪽은 $\log\log u$ 가 이
 * 사다리에서 비율 1.06~1.08 이라 `O(1)` 구간(0.70~1.30) 한복판에 놓이기 때문이다 — 이 정본은 u =
 * $2^{10}$ · $2^{12}$ · $2^{14}$ 에서 내려가는 깊이가 넷으로 같다. **그러므로 뒤쪽 시나리오가 판정하는
 * 것은 「u 의 로그 로그」가 아니라 「u 의 어떤 거듭제곱보다도 느리게 자란다」이다.** 로그 인수만큼
 * 어기는 계열(비트 하나씩 내려가는 트라이 · 이진 탐색)은 이 스위트를 통과한다(불변 사실 53·62).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **일곱 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface IntegerUniverseSet {
  insert(x: number): void;
  delete(x: number): boolean;
  has(x: number): boolean;
  min(): number | null;
  max(): number | null;
  successor(x: number): number | null;
  predecessor(x: number): number | null;
}

type Built = IntegerUniverseSet & { __cost?: number };

/** 축1이 도는 우주 크기. 2의 거듭제곱이 아닌 값을 골라 올려 담는 구현의 경계를 짚는다. */
export const UNIVERSE = 100;

/** 축3에서 원소 수를 키우는 시나리오가 고정하는 우주. 사다리 꼭대기(16,384)의 네 배다. */
export const FIXED_UNIVERSE = 1 << 16;

/** 조회 시나리오의 걸음 수. `worst` 통계가 최댓값이라 원소 수만큼 부를 필요가 없다. */
const QUERIES = 256;

/**
 * 같은 상태를 다시 재는 횟수. `worst` 통계가 최댓값이라 표본이 하나면 그 하나의 흔들림이 곧
 * 판정이 된다.
 */
const ROUNDS = 3;

/** 범위 밖 호출의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";

function observe<T>(call: () => T): T | string {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 하네스용 껍데기. `reset(u)` 로 그 우주의 구조를 다시 세운다. */
export class UniverseSite {
  readonly #make: (universe: number) => Built;
  #impl: Built;
  #universe: number;
  #carried = 0;

  constructor(make: (universe: number) => Built) {
    this.#make = make;
    this.#impl = make(UNIVERSE);
    this.#universe = UNIVERSE;
  }

  get __cost(): number {
    return this.#carried + (this.#impl.__cost ?? 0);
  }

  /** 지금 구조의 우주 크기. 불변식 검사가 훑을 범위다. */
  get universe(): number {
    return this.#universe;
  }

  /** 새 구조를 세운다. 생성자가 던지면 앞의 구조가 그대로 남는다. */
  reset(universe: number): void {
    const next = this.#make(universe);
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = next;
    this.#universe = universe;
  }

  insert(x: number): void {
    this.#impl.insert(x);
  }

  delete(x: number): boolean {
    return this.#impl.delete(x);
  }

  has(x: number): boolean {
    return this.#impl.has(x);
  }

  min(): number | null {
    return this.#impl.min();
  }

  max(): number | null {
    return this.#impl.max();
  }

  successor(x: number): number | null {
    return this.#impl.successor(x);
  }

  predecessor(x: number): number | null {
    return this.#impl.predecessor(x);
  }
}

/**
 * 축1 참조 모델. 담긴 키의 집합 하나이고 이웃은 매번 한 칸씩 훑는다 — 축1은 의미만 보므로
 * 자명한 구현으로 충분하다. 같은 모양이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/scanningBitSet.ts`).
 */
interface Model {
  universe: number;
  items: Set<number>;
}

function inRange(model: Model, x: number): boolean {
  return Number.isInteger(x) && x >= 0 && x < model.universe;
}

function validUniverse(universe: number): boolean {
  return Number.isSafeInteger(universe) && universe >= 1;
}

function modelSuccessor(model: Model, x: number): number | string | null {
  if (!inRange(model, x)) return OUT_OF_RANGE;
  for (let y = x + 1; y < model.universe; y++) if (model.items.has(y)) return y;
  return null;
}

function modelPredecessor(model: Model, x: number): number | string | null {
  if (!inRange(model, x)) return OUT_OF_RANGE;
  for (let y = x - 1; y >= 0; y--) if (model.items.has(y)) return y;
  return null;
}

function modelMin(model: Model): number | null {
  let found: number | null = null;
  for (const item of model.items)
    if (found === null || item < found) found = item;
  return found;
}

function modelMax(model: Model): number | null {
  let found: number | null = null;
  for (const item of model.items)
    if (found === null || item > found) found = item;
  return found;
}

/** 무작위 키. 네 칸씩 우주 밖으로 넘친다 — 거절 경로를 무작위 시퀀스에서도 짚는다. */
function key(rng: () => number): number {
  return Math.floor(rng() * (UNIVERSE + 8)) - 4;
}

/** 무작위 시퀀스가 `reset` 에 넘기는 값. 전부 거절된다(파일 머리말). */
const REJECTED_UNIVERSES = [0, -3, 2.5, 2 ** 53] as const;

/**
 * 불변식 검사가 쓰는 한 줄 — 우주 전체를 `has` 로 훑어 담긴 키를 오름차순으로 모은다.
 * 불변식 넷이 전부 이 수열을 **다른 경로 하나**와 대조한다.
 */
function presentByHas(impl: UniverseSite): number[] {
  const present: number[] = [];
  for (let x = 0; x < impl.universe; x++) if (impl.has(x)) present.push(x);
  return present;
}

function show(value: unknown): string {
  return value === null ? "null" : String(value);
}

export const vanEmdeBoasTreeContract: ContractSpec<UniverseSite, Model> = {
  name: "VanEmdeBoasTree",
  grade: "complexity",
  model: () => ({ universe: UNIVERSE, items: new Set<number>() }),

  ops: [
    {
      name: "insert",
      arg: key,
      onImpl: (impl, arg) => observe(() => impl.insert(arg as number)),
      onModel: (model, arg) => {
        const x = arg as number;
        if (!inRange(model, x)) return OUT_OF_RANGE;
        model.items.add(x);
        return undefined;
      },
    },
    {
      name: "delete",
      arg: key,
      onImpl: (impl, arg) => observe(() => impl.delete(arg as number)),
      onModel: (model, arg) => {
        const x = arg as number;
        if (!inRange(model, x)) return OUT_OF_RANGE;
        return model.items.delete(x);
      },
    },
    {
      name: "has",
      arg: key,
      onImpl: (impl, arg) => observe(() => impl.has(arg as number)),
      onModel: (model, arg) => {
        const x = arg as number;
        if (!inRange(model, x)) return OUT_OF_RANGE;
        return model.items.has(x);
      },
    },
    {
      name: "min",
      arg: () => undefined,
      onImpl: (impl) => impl.min(),
      onModel: (model) => modelMin(model),
    },
    {
      name: "max",
      arg: () => undefined,
      onImpl: (impl) => impl.max(),
      onModel: (model) => modelMax(model),
    },
    {
      name: "successor",
      arg: key,
      onImpl: (impl, arg) => observe(() => impl.successor(arg as number)),
      onModel: (model, arg) => modelSuccessor(model, arg as number),
    },
    {
      name: "predecessor",
      arg: key,
      onImpl: (impl, arg) => observe(() => impl.predecessor(arg as number)),
      onModel: (model, arg) => modelPredecessor(model, arg as number),
    },
    {
      name: "reset",
      arg: (rng) =>
        REJECTED_UNIVERSES[Math.floor(rng() * REJECTED_UNIVERSES.length)],
      onImpl: (impl, arg) => observe(() => impl.reset(arg as number)),
      onModel: (model, arg) => {
        const universe = arg as number;
        if (!validUniverse(universe)) return OUT_OF_RANGE;
        model.universe = universe;
        model.items.clear();
        return undefined;
      },
    },
  ],

  edges: [
    {
      name: "빈 집합은 양 끝도 이웃도 없다",
      steps: [
        { op: "min" },
        { op: "max" },
        { op: "has", arg: 0 },
        { op: "successor", arg: 0 },
        { op: "predecessor", arg: UNIVERSE - 1 },
        { op: "delete", arg: 5 },
        { op: "min" },
      ],
    },
    {
      name: "넣은 키 사이에서 이웃을 찾고, 지운 키는 이웃에서 빠진다",
      steps: [
        { op: "insert", arg: 8 },
        { op: "insert", arg: 2 },
        { op: "insert", arg: 11 },
        { op: "insert", arg: 5 },
        { op: "min" },
        { op: "max" },
        { op: "successor", arg: 0 },
        { op: "successor", arg: 5 },
        { op: "successor", arg: 6 },
        { op: "successor", arg: 11 },
        { op: "predecessor", arg: 8 },
        { op: "predecessor", arg: 2 },
        { op: "predecessor", arg: UNIVERSE - 1 },
        { op: "delete", arg: 5 },
        { op: "has", arg: 5 },
        { op: "successor", arg: 2 },
        { op: "predecessor", arg: 8 },
      ],
    },
    {
      // 집합이므로 같은 키를 두 번 넣어도 한 벌이다. 두 벌이 들어갔다면 한 번 지운 뒤에도 남는다.
      name: "같은 키를 두 번 넣어도 한 벌이다",
      steps: [
        { op: "insert", arg: 7 },
        { op: "insert", arg: 7 },
        { op: "delete", arg: 7 },
        { op: "has", arg: 7 },
        { op: "delete", arg: 7 },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      // 최소를 지우면 다음 최소가 그 자리에 선다. 최소를 따로 드는 구현이 다음 최소를 못 찾으면 갈린다.
      name: "양 끝을 지우면 다음 원소가 양 끝이 된다",
      steps: [
        { op: "insert", arg: 10 },
        { op: "insert", arg: 30 },
        { op: "insert", arg: 20 },
        { op: "delete", arg: 10 },
        { op: "min" },
        { op: "successor", arg: 10 },
        { op: "predecessor", arg: 20 },
        { op: "delete", arg: 30 },
        { op: "max" },
        { op: "predecessor", arg: 99 },
        { op: "delete", arg: 20 },
        { op: "min" },
        { op: "max" },
      ],
    },
    {
      name: "우주의 첫 키와 마지막 키",
      steps: [
        { op: "insert", arg: 0 },
        { op: "insert", arg: UNIVERSE - 1 },
        { op: "successor", arg: 0 },
        { op: "predecessor", arg: UNIVERSE - 1 },
        { op: "successor", arg: UNIVERSE - 1 },
        { op: "predecessor", arg: 0 },
        { op: "delete", arg: 0 },
        { op: "min" },
        { op: "predecessor", arg: UNIVERSE - 1 },
        { op: "delete", arg: UNIVERSE - 1 },
        { op: "max" },
      ],
    },
    {
      // 계약의 주입 정책. 우주 밖 키는 받는 연산 다섯이 전부 던지고, 던진 호출은 상태를 바꾸지 않는다.
      name: "우주 밖 키는 다섯 연산 모두 RangeError 이고 상태가 바뀌지 않는다",
      steps: [
        { op: "insert", arg: 3 },
        { op: "insert", arg: -1 },
        { op: "insert", arg: UNIVERSE },
        { op: "insert", arg: 2.5 },
        { op: "delete", arg: UNIVERSE },
        { op: "has", arg: -1 },
        { op: "successor", arg: -1 },
        { op: "predecessor", arg: UNIVERSE },
        { op: "successor", arg: 0.5 },
        { op: "min" },
        { op: "max" },
        { op: "delete", arg: 3 },
      ],
    },
    {
      // 받아들이지 않는 우주 크기. 던진 뒤에도 앞의 구조(우주 100)가 그대로다.
      name: "우주 크기가 1 이상의 안전한 정수가 아니면 RangeError 이고 앞의 구조가 남는다",
      steps: [
        { op: "insert", arg: 50 },
        { op: "reset", arg: 0 },
        { op: "reset", arg: -4 },
        { op: "reset", arg: 2.5 },
        { op: "reset", arg: 2 ** 53 },
        { op: "has", arg: 50 },
        { op: "insert", arg: UNIVERSE - 1 },
        { op: "max" },
      ],
    },
    {
      // 2의 거듭제곱이 아닌 우주. 위로 올려 담는 구현이 올린 자리의 키를 받아들이면 갈린다.
      name: "우주 6 은 키 0 부터 5 까지만 받는다",
      steps: [
        { op: "reset", arg: 6 },
        { op: "insert", arg: 5 },
        { op: "insert", arg: 6 },
        { op: "insert", arg: 7 },
        { op: "successor", arg: 6 },
        { op: "insert", arg: 1 },
        { op: "successor", arg: 1 },
        { op: "predecessor", arg: 5 },
        { op: "max" },
      ],
    },
    {
      name: "우주 1 은 키 0 하나를 담는다",
      steps: [
        { op: "reset", arg: 1 },
        { op: "has", arg: 0 },
        { op: "min" },
        { op: "insert", arg: 0 },
        { op: "insert", arg: 1 },
        { op: "min" },
        { op: "max" },
        { op: "successor", arg: 0 },
        { op: "predecessor", arg: 0 },
        { op: "delete", arg: 0 },
        { op: "max" },
      ],
    },
    {
      name: "우주 2 에서 두 키 사이의 이웃",
      steps: [
        { op: "reset", arg: 2 },
        { op: "insert", arg: 1 },
        { op: "insert", arg: 0 },
        { op: "successor", arg: 0 },
        { op: "predecessor", arg: 1 },
        { op: "delete", arg: 0 },
        { op: "min" },
        { op: "predecessor", arg: 1 },
        { op: "delete", arg: 1 },
        { op: "max" },
      ],
    },
  ],

  // 헤더 불변식 절의 넷. 넷 다 `has` 로 모은 수열을 다른 경로 하나와 대조한다.
  invariants: [
    {
      name: "min() 은 has 가 참인 가장 작은 키다",
      check: (impl) => {
        const present = presentByHas(impl);
        const expected = present[0] ?? null;
        const got = impl.min();
        return got === expected
          ? null
          : `min() ${show(got)} / has 로 모은 첫 키 ${show(expected)}`;
      },
    },
    {
      name: "max() 는 has 가 참인 가장 큰 키다",
      check: (impl) => {
        const present = presentByHas(impl);
        const expected = present[present.length - 1] ?? null;
        const got = impl.max();
        return got === expected
          ? null
          : `max() ${show(got)} / has 로 모은 끝 키 ${show(expected)}`;
      },
    },
    {
      name: "successor(x) 는 has 가 참인 x 다음 키다",
      check: (impl) => {
        const present = new Set(presentByHas(impl));
        let next: number | null = null;
        for (let x = impl.universe - 1; x >= 0; x--) {
          const got = impl.successor(x);
          if (got !== next)
            return `successor(${x}) ${show(got)} / has 로 모은 다음 키 ${show(next)}`;
          if (present.has(x)) next = x;
        }
        return null;
      },
    },
    {
      name: "predecessor(x) 는 has 가 참인 x 앞 키다",
      check: (impl) => {
        const present = new Set(presentByHas(impl));
        let previous: number | null = null;
        for (let x = 0; x < impl.universe; x++) {
          const got = impl.predecessor(x);
          if (got !== previous)
            return `predecessor(${x}) ${show(got)} / has 로 모은 앞 키 ${show(previous)}`;
          if (present.has(x)) previous = x;
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      covers: ["insert"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **원소 수를 키운다 — 우주 $2^{16}$ 고정, 내림차순 넣기.** 키를 크기 순으로 늘어놓는 계열에는
      // 새 키가 늘 맨 앞이라 매번 전부 민다(`_contract/_fixtures/sortedArrayIntegerSet.ts` — 1,024 ·
      // 4,096 · 16,384). 우주 크기에만 기대는 계열에는 원소 수가 보이지 않는다. 넣기를 쌓아 두는
      // 계열(`_contract/_fixtures/flushingIntegerSet.ts`)은 넣기 자체가 줄에 붙이기라 1 · 1 · 1 로
      // 통과하고, 쌓인 몫을 아래 두 시나리오의 첫 호출이 떠안는다.
      run: (impl, n, ctx) => {
        impl.reset(FIXED_UNIVERSE);
        for (let i = n - 1; i >= 0; i--) ctx.step(() => impl.insert(4 * i));
      },
    },
    {
      covers: ["delete"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **원소 수를 키운다 — 우주 $2^{16}$ 고정, 오름차순으로 채운 뒤 작은 키부터 지우기.** 크기 순
      // 배열에서 맨 앞을 지우면 뒤가 전부 당겨진다(`_contract/_fixtures/sortedArrayIntegerSet.ts` —
      // 1,025 · 4,097 · 16,385). 최소를 따로 드는 구현에는 지울 때마다 다음 최소를 찾는 일이 붙는데,
      // 이 순서에서는 다음 최소가 네 칸 뒤라 칸을 훑는 계열도 5 · 5 · 5 로 통과한다 — 그 계열은 우주를
      // 키우는 시나리오가 잡는다. **`worst` 가 사는 자리 하나** — 넣기를 쌓아 두는 계열이 첫 지우기에서
      // n 개를 한꺼번에 넣어 18,841 · 75,377 · 301,529 로 걸린다(헤더 「한정자」).
      run: (impl, n, ctx) => {
        impl.reset(FIXED_UNIVERSE);
        for (let i = 0; i < n; i++) impl.insert(4 * i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.delete(4 * i));
      },
    },
    {
      covers: ["has", "successor", "predecessor"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      // **원소 수를 키운다 — 우주 $2^{16}$ 고정, 네 칸마다 키 하나를 무작위 자리에.** 조회 셋이 담긴
      // 수에 기대지 않는가를 본다. 크기 순 배열을 한 칸씩 훑는 계열이 여기서 원소 수에 비례하고
      // (`_contract/_fixtures/sortedArrayIntegerSet.ts` — 3,063 · 12,280 · 48,999), 넣기를 쌓아 두는
      // 계열이 첫 조회에서 걸린다(18,858 · 75,392 · 301,545). **크기 순 배열에 이분 탐색하는 계열은
      // 통과한다** — 실측용 사본이 33 · 39 · 45 로 원소 수의 로그를 그대로 찍는데 비율 1.18 · 1.15 가
      // `O(1)` 구간 안이다. 계약을 로그 인수만큼 어기는 통과다(불변 사실 53·62).
      //
      // **키 사이의 틈을 일곱 칸 아래로 묶는 것이 요점이다.** 이웃을 한 칸씩 훑는 계열의 비용은 틈이
      // 정하는데, 0 이상 4n 미만에서 키를 그냥 무작위로 뽑으면 **가장 넓은 틈**이 원소 수의 로그를
      // 따라 넓어져 칸을 훑는 계열이 31 · 45 · 47($r$ = 1.45)로 걸렸다 — 원소 수가 아니라 틈의 흔들림을 잰
      // 것이다. 우주 전체에 흩으면 반대로 틈이 n 에 반비례해 `O(1)` 구간 **아래로** 걸린다(계약 위반이
      // 아니다 — 불변 사실 49). 묶으면 이 시나리오가 원소 수 하나만 잰다.
      run: (impl, n, ctx) => {
        impl.reset(FIXED_UNIVERSE);
        const span = 4 * n;
        const order = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(ctx.rng() * (i + 1));
          [order[i], order[j]] = [order[j] as number, order[i] as number];
        }
        for (const slot of order)
          impl.insert(4 * slot + Math.floor(ctx.rng() * 4));
        for (let i = 0; i < QUERIES; i++) {
          const x = Math.floor(ctx.rng() * span);
          ctx.step(() => {
            impl.has(x);
            impl.successor(x);
            impl.predecessor(x);
          });
        }
      },
    },
    {
      covers: ["successor", "predecessor", "min", "max", "has"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **우주를 키운다 — u = n, 담긴 키는 우주의 양 끝 둘.** 사다리의 n 을 우주 크기로 읽는다. 두 키
      // 사이의 틈이 우주만큼이라 이웃을 한 칸씩 훑는 계열은 u 에 비례하고
      // (`_contract/_fixtures/scanningBitSet.ts` — 2,049 · 8,193 · 32,769), 제곱근 크기로 묶어 훑는
      // 계열은 $\sqrt u$ 에 비례해 비율 2.0 으로 걸린다(실측용 사본 191 · 383 · 767 — 저장소에 두지
      // 않았다). **비트 하나씩 내려가는 계열은 여기서 통과한다**
      // (`_contract/_fixtures/bitTrieIntegerSet.ts` — 73 · 87 · 101, 비율 1.19 · 1.16 이 `O(1)` 구간
      // 안이다). 이 정본은 내려가는 깊이가 사다리 세 점에서 넷으로 같아 19 · 19 · 19 다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        impl.insert(0);
        impl.insert(n - 1);
        for (let round = 0; round < ROUNDS; round++) {
          ctx.step(() => {
            impl.successor(1);
            impl.predecessor(n - 2);
            impl.min();
            impl.max();
            impl.has(n - 1);
          });
        }
      },
    },
    {
      covers: ["insert", "delete"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **우주를 키운다 — u = n, 키 0 하나를 둔 채 우주의 마지막 키를 넣었다 지우기.** 최대를 지우면
      // 다음 최대가 우주 반대편에 있다 — 칸을 한 칸씩 훑어 다음 최대를 찾는 계열이 u 에 비례한다
      // (`_contract/_fixtures/scanningBitSet.ts` — 1,025 · 4,097 · 16,385). 키마다 다음 키를 적어 두는
      // 표 계열은 넣기·지우기가 그 틈의 칸을 전부 고쳐 여기서만 걸린다(실측용 사본 2,052 · 8,196 ·
      // 32,772 — 조회 시나리오 셋은 전부 통과했다).
      run: (impl, n, ctx) => {
        impl.reset(n);
        impl.insert(0);
        for (let round = 0; round < ROUNDS; round++) {
          ctx.step(() => {
            impl.insert(n - 1);
            impl.delete(n - 1);
          });
        }
      },
    },
  ],
};
