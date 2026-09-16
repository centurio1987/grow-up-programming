/**
 * `hash/lruCache` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./lruCache.ts` 헤더 한 곳이고(규약1), 여기 있는
 * 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** `runContract` 는 인자 없는 팩토리를 받는데 이 구조는
 * **용량을 생성자로 받는다.** 축1은 용량 하나(4)에서 돌면 되지만 축3은 용량을 사다리에 올려야
 * 하므로, 껍데기가 `reset(capacity)` 로 그 용량의 캐시를 다시 세우고 버린 캐시의 비용을 이어서
 * 센다. 펴기 함수는 껍데기에 넘기는 팩토리가 붙들고 있다. `reset` 은 시나리오의 준비 작업이라
 * 걸음에 안 들어간다. 껍데기는 계약의 일부가 아니다.
 *
 * **축1의 용량을 4 로, 키 범위를 8 로 좁게 잡는다.** 이 계약이 사전과 갈리는 자리는 **용량에
 * 닿은 뒤**에만 열리고, 사용 순서가 답을 가르는 자리는 밀어내기가 일어날 때만 관측된다. 키가
 * 넓으면 500 회짜리 무작위 시퀀스에서 `get` 이 거의 다 빗나가 순서를 고치는 경로가 안 돈다.
 *
 * **생성자 행을 축1이 재는 자리가 `reset` 연산이다**(`heap/vanEmdeBoasTree` 와 같은 모양 — 불변 사실
 * 304). 무작위 시퀀스는 `reset` 에 **거절될 용량만** 뽑는다. 받아들이는 `reset` 은 담긴 것을 비우므로
 * 섞이면 시퀀스가 짧은 조각으로 끊긴다. 받아들이는 자리(용량 1)는 경계 케이스가 짚는다. 범위 밖
 * 용량의 `RangeError` 는 양쪽을 같은 방식으로 감싸 문자열 하나로 바꾸고, `RangeError` 가 아닌
 * 예외는 그대로 올려보낸다(스텁의 `Not implemented` 가 통과로 읽히면 안 된다).
 *
 * **불변식 절이 빈 것은 판별 절차의 결과다**(헤더 「불변식」). 이 계약에서 담긴 것을 읽는 공개
 * 연산은 `get` 하나이고, 그것이 맞으면 사용 순서를 고친다 — 축2의 검사가 `get` 을 부르면 그
 * 검사가 상태를 바꾼다(불변 사실 124).
 *
 * **적대적 입력은 키 묶음 `i * 65536` 이다**(`hash/hashMapChaining` 스위트와 같은 자리 · 불변 사실
 * 143). 계약의 용어만으로 적히고 주입 정책을 전부 지키는데, 펴기 값의 나머지로 칸을 정하는 계열을
 * 한 칸으로 몬다.
 *
 * **`put` 의 덮어쓰기만 재는 시나리오는 두지 않았다.** 덮어쓰기는 `get` 이 맞았을 때와 같은 일(찾기 ·
 * 가장 최근으로 옮기기)에 값 쓰기 하나가 붙은 것이다. 지어 재 보니(채운 키를 섞은 순서로 덮어쓰기 ·
 * `i * 65536` 키로 덮어쓰기) 결함 셋이 `get` 시나리오 둘과 같은 판정을 받았다 — 배열 한 줄은 둘 다
 * 1,025 · 4,097 · 16,385 로 걸리고, 시각 훑기는 둘 다 1.00 으로 통과하고, 나머지 칸은 무작위 4.00 통과 ·
 * 적대적 515.5 · 2,051.5 · 8,195.5 걸림이다(정본 4.24 안팎). 가르지 못하는 시나리오는 두지 않는다(불변
 * 사실 57). 덮어쓰기의 **의미**는 경계 케이스 둘이 짚는다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **두 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface LRUCacheContract<K, V> {
  get(key: K): V | null;
  put(key: K, value: V): void;
}

type Built = LRUCacheContract<number, number> & { __cost?: number };

/** 축1이 도는 용량. 무작위 시퀀스가 경계를 자주 넘도록 좁게 잡는다. */
export const CAPACITY = 4;

/** 축1 무작위 시퀀스가 쓰는 키 범위. 용량의 두 배라 `get` 이 절반쯤 맞는다. */
const KEY_SPACE = 8;

/**
 * 적대적 키의 간격. 낮은 16 비트를 0 으로 만든다.
 *
 * 축3 사다리 맨 위(용량 $2^{14}$)에서도 칸 수는 $2^{15}$ 를 넘지 않으므로, 펴기 값을 칸 수로 나눈
 * 나머지로 칸을 정하는 구현은 **크기와 무관하게 한 칸**에 전부 몰린다.
 */
export const CLUMP = 1 << 16;

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

/** 하네스용 껍데기. `reset(capacity)` 로 그 용량의 캐시를 다시 세운다. */
export class CacheSite implements LRUCacheContract<number, number> {
  readonly #make: (capacity: number) => Built;
  #impl: Built;
  #carried = 0;

  constructor(make: (capacity: number) => Built) {
    this.#make = make;
    this.#impl = make(CAPACITY);
  }

  get __cost(): number {
    return this.#carried + (this.#impl.__cost ?? 0);
  }

  /** 새 캐시를 세운다. 생성자가 던지면 앞의 캐시가 그대로 남는다. */
  reset(capacity: number): void {
    const next = this.#make(capacity);
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = next;
  }

  get(key: number): number | null {
    return this.#impl.get(key);
  }

  put(key: number, value: number): void {
    this.#impl.put(key, value);
  }
}

/**
 * 축1 참조 모델. 언어의 `Map` 이 넣은 순서를 기억하는 성질을 사용 순서로 쓴다 — 쓸 때마다 지우고
 * 다시 넣으면 맨 앞이 가장 오래 안 쓴 키다. 축1은 의미만 보므로 이것으로 충분하다.
 */
interface Model {
  capacity: number;
  entries: Map<number, number>;
}

function validCapacity(capacity: number): boolean {
  return Number.isInteger(capacity) && capacity >= 1;
}

function modelGet(model: Model, key: number): number | null {
  if (!model.entries.has(key)) return null;
  const value = model.entries.get(key) as number;
  model.entries.delete(key);
  model.entries.set(key, value);
  return value;
}

function modelPut(model: Model, key: number, value: number): void {
  if (model.entries.has(key)) {
    model.entries.delete(key);
  } else if (model.entries.size === model.capacity) {
    const oldest = model.entries.keys().next().value as number;
    model.entries.delete(oldest);
  }
  model.entries.set(key, value);
}

/** 무작위 시퀀스가 `reset` 에 넘기는 값. 전부 거절된다(파일 머리말). */
const REJECTED_CAPACITIES = [0, -2, 2.5] as const;

/** `0 … n-1` 을 섞은 배열. 서로 다른 키 n 개를 무작위 순서로 주는 자리다. */
function shuffledRange(n: number, rng: () => number): number[] {
  const made: number[] = [];
  for (let value = 0; value < n; value++) made.push(value);
  for (let at = n - 1; at > 0; at--) {
    const swap = Math.floor(rng() * (at + 1));
    [made[at], made[swap]] = [made[swap] as number, made[at] as number];
  }
  return made;
}

export const lruCacheContract: ContractSpec<CacheSite, Model> = {
  name: "LRUCache",
  grade: "complexity",
  model: () => ({ capacity: CAPACITY, entries: new Map<number, number>() }),

  ops: [
    {
      name: "get",
      arg: (rng) => Math.floor(rng() * KEY_SPACE),
      onImpl: (impl, arg) => impl.get(arg as number),
      onModel: (model, arg) => modelGet(model, arg as number),
    },
    {
      name: "put",
      arg: (rng) => [Math.floor(rng() * KEY_SPACE), Math.floor(rng() * 1000)],
      onImpl: (impl, arg) => {
        const [key, value] = arg as [number, number];
        impl.put(key, value);
        return undefined;
      },
      onModel: (model, arg) => {
        const [key, value] = arg as [number, number];
        modelPut(model, key, value);
        return undefined;
      },
    },
    {
      name: "reset",
      arg: (rng) =>
        REJECTED_CAPACITIES[Math.floor(rng() * REJECTED_CAPACITIES.length)],
      onImpl: (impl, arg) => observe(() => impl.reset(arg as number)),
      onModel: (model, arg) => {
        const capacity = arg as number;
        if (!validCapacity(capacity)) return OUT_OF_RANGE;
        model.capacity = capacity;
        model.entries.clear();
        return undefined;
      },
    },
  ],

  edges: [
    {
      name: "빈 캐시의 get 은 null 이고 상태가 바뀌지 않는다",
      steps: [
        { op: "get", arg: 1 },
        { op: "put", arg: [1, 10] },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
      ],
    },
    {
      // 이 계약이 사전과 갈리는 자리다. 용량을 무시하는 구현은 여기서 값이 갈린다.
      name: "가득 찬 뒤 새 키를 넣으면 가장 오래 안 쓴 키가 밀려난다",
      steps: [
        { op: "put", arg: [1, 10] },
        { op: "put", arg: [2, 20] },
        { op: "put", arg: [3, 30] },
        { op: "put", arg: [4, 40] },
        { op: "put", arg: [5, 50] },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "get", arg: 3 },
        { op: "get", arg: 4 },
        { op: "get", arg: 5 },
      ],
    },
    {
      // 「최근에 쓴」에 맞은 `get` 이 든다. 넣은 순서로만 밀어내는 구현이 여기서 갈린다.
      name: "맞은 get 은 그 키를 가장 최근으로 올린다",
      steps: [
        { op: "put", arg: [1, 10] },
        { op: "put", arg: [2, 20] },
        { op: "put", arg: [3, 30] },
        { op: "put", arg: [4, 40] },
        { op: "get", arg: 1 },
        { op: "put", arg: [5, 50] },
        { op: "get", arg: 2 },
        { op: "get", arg: 1 },
        { op: "get", arg: 3 },
      ],
    },
    {
      // 「최근에 쓴」에 덮어쓰기도 든다. 덮어쓰기가 값만 바꾸고 순서를 두는 구현이 여기서 갈린다.
      name: "덮어쓰기는 값을 바꾸고 그 키를 가장 최근으로 올린다",
      steps: [
        { op: "put", arg: [1, 10] },
        { op: "put", arg: [2, 20] },
        { op: "put", arg: [3, 30] },
        { op: "put", arg: [4, 40] },
        { op: "put", arg: [1, 11] },
        { op: "put", arg: [5, 50] },
        { op: "get", arg: 2 },
        { op: "get", arg: 1 },
        { op: "get", arg: 3 },
      ],
    },
    {
      // 덮어쓰기는 새 키가 아니므로 가득 찬 상태에서도 아무것도 밀어내지 않는다.
      name: "가득 찬 상태의 덮어쓰기는 아무것도 밀어내지 않는다",
      steps: [
        { op: "put", arg: [1, 10] },
        { op: "put", arg: [2, 20] },
        { op: "put", arg: [3, 30] },
        { op: "put", arg: [4, 40] },
        { op: "put", arg: [3, 33] },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "get", arg: 3 },
        { op: "get", arg: 4 },
      ],
    },
    {
      // 빗나간 `get` 은 사용이 아니다. 빗나간 물음도 순서를 건드리는 구현이 여기서 갈린다.
      name: "빗나간 get 은 사용 순서를 바꾸지 않는다",
      steps: [
        { op: "put", arg: [1, 10] },
        { op: "put", arg: [2, 20] },
        { op: "put", arg: [3, 30] },
        { op: "put", arg: [4, 40] },
        { op: "get", arg: 7 },
        { op: "put", arg: [5, 50] },
        { op: "get", arg: 1 },
        { op: "get", arg: 7 },
        { op: "get", arg: 2 },
      ],
    },
    {
      // 밀려난 키는 다시 들어올 때 새 키다 — 가득 찬 상태라 또 하나를 밀어낸다.
      name: "밀려난 키를 다시 넣으면 새 키로 들어오고 또 하나를 밀어낸다",
      steps: [
        { op: "put", arg: [1, 10] },
        { op: "put", arg: [2, 20] },
        { op: "put", arg: [3, 30] },
        { op: "put", arg: [4, 40] },
        { op: "put", arg: [5, 50] },
        { op: "put", arg: [1, 100] },
        { op: "get", arg: 2 },
        { op: "get", arg: 1 },
        { op: "get", arg: 3 },
        { op: "get", arg: 5 },
      ],
    },
    {
      // 용량 1. 새 키마다 앞의 것이 밀려나고, 같은 키는 덮어써진다.
      name: "용량 1 은 마지막에 쓴 키 하나만 담는다",
      steps: [
        { op: "reset", arg: 1 },
        { op: "put", arg: [1, 10] },
        { op: "put", arg: [2, 20] },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "put", arg: [2, 22] },
        { op: "get", arg: 2 },
        { op: "put", arg: [3, 30] },
        { op: "get", arg: 2 },
        { op: "get", arg: 3 },
      ],
    },
    {
      name: "용량이 1 이상의 정수가 아니면 RangeError 이고 앞의 캐시가 남는다",
      steps: [
        { op: "put", arg: [1, 10] },
        { op: "reset", arg: 0 },
        { op: "reset", arg: -2 },
        { op: "reset", arg: 2.5 },
        { op: "get", arg: 1 },
        { op: "put", arg: [2, 20] },
        { op: "put", arg: [3, 30] },
        { op: "put", arg: [4, 40] },
        { op: "put", arg: [5, 50] },
        { op: "get", arg: 1 },
      ],
    },
    {
      // 한 칸으로 몰리는 키 다섯. 칸을 어떻게 정하든 서로를 가리지 않고, 밀어내기가 맞는 키를 뺀다.
      name: "같은 칸으로 몰리는 키들도 서로를 가리지 않고 순서대로 밀려난다",
      steps: [
        { op: "put", arg: [0, 1] },
        { op: "put", arg: [CLUMP, 2] },
        { op: "put", arg: [2 * CLUMP, 3] },
        { op: "put", arg: [3 * CLUMP, 4] },
        { op: "get", arg: 0 },
        { op: "put", arg: [4 * CLUMP, 5] },
        { op: "get", arg: CLUMP },
        { op: "get", arg: 0 },
        { op: "get", arg: 2 * CLUMP },
        { op: "get", arg: 4 * CLUMP },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 담긴 것을 읽는 연산이 `get` 하나이고 그 호출이 사용 순서를
  // 고치므로, 상태를 바꾸지 않고 두 경로를 대조할 자리가 없다(불변 사실 124).
  invariants: [],

  scenarios: [
    {
      covers: ["put"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // **용량 n 을 서로 다른 키 n 개로 채운 뒤 새 키 n 개를 넣기 — 호출마다 하나가 밀려난다.**
      // 밀어낼 키를 담긴 것 전부에서 찾는 계열(`_contract/_fixtures/stampScanningCache.ts`)과
      // 사용 순서를 배열 한 줄에 두고 앞을 지우는 계열(`_contract/_fixtures/recencyArrayCache.ts`)이
      // 여기서 걸린다. 펴기 값의 나머지로 칸을 정하는 계열은 무작위 키라 통과한다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        const filled = shuffledRange(n, ctx.rng);
        for (let index = 0; index < n; index++)
          impl.put(filled[index] as number, index);
        const fresh = shuffledRange(n, ctx.rng);
        for (let index = 0; index < n; index++) {
          const key = n + (fresh[index] as number);
          ctx.step(() => impl.put(key, index));
        }
      },
    },
    {
      covers: ["put"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: true,
      // **낮은 비트가 전부 0 인 키로 채우고 같은 모양의 새 키 n 개를 넣기.** 펴기 값의 나머지로 칸을
      // 정하는 계열(`_contract/_fixtures/remainderSlotCache.ts`)을 가르는 자리다. 위 무작위
      // 시나리오와 짝을 이룬다 — 하나만 두면 결함 셋 중 하나는 반드시 놓친다(불변 사실 24).
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let index = 0; index < n; index++) impl.put(index * CLUMP, index);
        for (let index = 0; index < n; index++) {
          const key = (n + index) * CLUMP;
          ctx.step(() => impl.put(key, index));
        }
      },
    },
    {
      covers: ["get"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: false,
      // **용량 n 을 채운 뒤 절반은 맞는 키, 절반은 빗나가는 키로 묻기.** 맞는 물음은 그 키를
      // 가장 최근으로 올린다. 사용 순서를 배열 한 줄에 두는 계열이 옮길 자리를 찾고 당기느라
      // 여기서 걸린다. 밀어낼 키를 훑어 찾는 계열은 `get` 이 상수라 여기를 통과한다 — 두 결함이
      // **서로 다른 행**에서 걸리는 것이 시나리오를 행마다 둔 이유다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        const filled = shuffledRange(n, ctx.rng);
        for (let index = 0; index < n; index++)
          impl.put(filled[index] as number, index);
        const asked = shuffledRange(n, ctx.rng);
        for (let index = 0; index < n; index++) {
          const key = index % 2 === 0 ? (asked[index] as number) : n + index;
          ctx.step(() => impl.get(key));
        }
      },
    },
    {
      covers: ["get"],
      qualifier: "expected",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let index = 0; index < n; index++) impl.put(index * CLUMP, index);
        for (let index = 0; index < n; index++) {
          const key = index % 2 === 0 ? index * CLUMP : (n + index) * CLUMP;
          ctx.step(() => impl.get(key));
        }
      },
    },
  ],
};
