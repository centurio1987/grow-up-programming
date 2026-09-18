/**
 * `linear/circularBuffer` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./circularBuffer.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** `runContract` 는 인자 없는 팩토리를 받는데 이
 * 구조는 **용량을 생성자로 받는다.** 축1은 고정된 용량 하나에서 돌면 되지만 축3은 크기
 * 사다리를 오르므로, 껍데기가 `reset(capacity)` 로 그 용량의 버퍼를 다시 세우고 버린
 * 버퍼의 비용을 이어서 센다. 껍데기는 계약의 일부가 아니고 `tools/check-contract.ts` 의
 * 명세↔스텁·정본 대조에도 걸리지 않는다(그 대조가 보는 것은 `<name>.ts` 와
 * `_reference/<name>.ts` 다).
 *
 * **축1의 용량을 4 로 좁게 잡는다.** 이 계약이 큐와 갈리는 자리가 **경계를 넘긴 뒤**에만
 * 열리므로, 용량이 크면 500 회짜리 무작위 시퀀스가 그 자리에 한 번도 닿지 않는다. 4 로
 * 두면 넣기와 빼기가 같은 확률로 뽑히는 시퀀스에서도 경계를 여러 번 넘는다. 넘긴 뒤의
 * 값은 경계 케이스 넷이 따로 짚는다 — 무작위에 기대지 않는다.
 *
 * **`basic` 인데 적대적 시나리오가 하나 있다.** 엄격도가 적대적 입력을 요구하지 않을 뿐
 * 금지하지도 않는다. 「꽉 찬 뒤에도 계속 쓰기」는 담긴 것을 배열 앞부터 들고 앞을 실제로
 * 지우는 계열을 겨누고, 그 계열은 **안 찬 상태의 쓰기 시나리오를 통과한다**(꽉 차기 전에는
 * 뒤에 붙이기만 하면 되기 때문이다). 하나만 두면 그 계열이 통과한다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **다섯 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface CircularBufferContract<T> {
  write(item: T): void;
  read(): T | null;
  peek(): T | null;
  isFull(): boolean;
  size(): number;
}

type Built = CircularBufferContract<number> & { __cost?: number };

/** 축1이 도는 용량. 무작위 시퀀스가 경계를 자주 넘도록 좁게 잡는다. */
const CAPACITY = 4;

/** 하네스용 껍데기. `reset(capacity)` 으로 그 용량의 버퍼를 다시 세운다. */
export class Capacitated implements CircularBufferContract<number> {
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

  reset(capacity: number): void {
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = this.#make(capacity);
  }

  write(item: number): void {
    this.#impl.write(item);
  }

  read(): number | null {
    return this.#impl.read();
  }

  peek(): number | null {
    return this.#impl.peek();
  }

  isFull(): boolean {
    return this.#impl.isFull();
  }

  size(): number {
    return this.#impl.size();
  }
}

/**
 * 축1 참조 모델. 배열 하나에 담고 용량을 넘기면 앞을 지운다 — 축1은 의미만 보고 비용은
 * 보지 않으므로 자명한 구현으로 충분하다.
 *
 * 같은 모양이 축3에서는 결함 fixture 가 된다(`_contract/_fixtures/shiftingRingBuffer.ts`).
 */
interface Model {
  items: number[];
}

export const circularBufferContract: ContractSpec<Capacitated, Model> = {
  name: "CircularBuffer",
  grade: "basic",
  model: () => ({ items: [] }),

  ops: [
    {
      name: "write",
      arg: (rng) => Math.floor(rng() * 100),
      onImpl: (impl, arg) => {
        impl.write(arg as number);
      },
      onModel: (model, arg) => {
        if (model.items.length === CAPACITY) model.items.shift();
        model.items.push(arg as number);
      },
    },
    {
      name: "read",
      arg: () => undefined,
      onImpl: (impl) => impl.read(),
      onModel: (model) =>
        model.items.length === 0 ? null : (model.items.shift() as number),
    },
    {
      name: "peek",
      arg: () => undefined,
      onImpl: (impl) => impl.peek(),
      onModel: (model) =>
        model.items.length === 0 ? null : (model.items[0] as number),
    },
    {
      name: "isFull",
      arg: () => undefined,
      onImpl: (impl) => impl.isFull(),
      onModel: (model) => model.items.length === CAPACITY,
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.items.length,
    },
  ],

  edges: [
    {
      name: "빈 버퍼에서 read·peek 은 null 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "read" },
        { op: "peek" },
        { op: "size" },
        { op: "isFull" },
        { op: "size" },
        { op: "read" },
        { op: "size" },
      ],
    },
    {
      name: "용량 안에서는 먼저 들어온 것이 먼저 나간다",
      steps: [
        { op: "write", arg: 1 },
        { op: "write", arg: 2 },
        { op: "write", arg: 3 },
        { op: "isFull" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
      ],
    },
    {
      // 이 계약이 큐와 갈리는 자리다. 담을 수 있는 수를 무시하는 구현은 여기서 값이 갈린다.
      name: "꽉 찬 뒤의 쓰기는 가장 오래된 것을 밀어낸다",
      steps: [
        { op: "write", arg: 1 },
        { op: "write", arg: 2 },
        { op: "write", arg: 3 },
        { op: "write", arg: 4 },
        { op: "isFull" },
        { op: "size" },
        { op: "write", arg: 5 },
        { op: "size" },
        { op: "peek" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
      ],
    },
    {
      // 용량만큼 더 쓰면 처음 넣은 것이 하나도 안 남는다.
      name: "용량만큼 덮어쓰면 처음 것이 하나도 남지 않는다",
      steps: [
        { op: "write", arg: 1 },
        { op: "write", arg: 2 },
        { op: "write", arg: 3 },
        { op: "write", arg: 4 },
        { op: "write", arg: 5 },
        { op: "write", arg: 6 },
        { op: "write", arg: 7 },
        { op: "write", arg: 8 },
        { op: "size" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
        { op: "size" },
      ],
    },
    {
      // 읽어서 자리를 비우면 밀어내지 않고 받는다. `isFull` 이 다시 거짓이 되는 자리다.
      name: "읽어서 자리를 비우면 다음 쓰기는 밀어내지 않는다",
      steps: [
        { op: "write", arg: 1 },
        { op: "write", arg: 2 },
        { op: "write", arg: 3 },
        { op: "write", arg: 4 },
        { op: "isFull" },
        { op: "read" },
        { op: "isFull" },
        { op: "write", arg: 5 },
        { op: "size" },
        { op: "peek" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
        { op: "read" },
      ],
    },
    {
      name: "다 비운 뒤에도 자리가 다시 돌아온다",
      steps: [
        { op: "write", arg: 1 },
        { op: "write", arg: 2 },
        { op: "read" },
        { op: "read" },
        { op: "size" },
        { op: "write", arg: 3 },
        { op: "write", arg: 4 },
        { op: "write", arg: 5 },
        { op: "write", arg: 6 },
        { op: "isFull" },
        { op: "peek" },
        { op: "write", arg: 7 },
        { op: "peek" },
        { op: "size" },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 관측 경로가 둘 이상인 성질 넷의 정합을 계약 표가 이미
  // 적고 있어 각 연산의 의미이고, 대조는 축1이 참조 모델과 하는 일이다.
  invariants: [],

  scenarios: [
    {
      // 용량 n 인 빈 버퍼를 n 회 채운다. 경계에 닿기 전까지의 쓰기다.
      covers: ["write"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) ctx.step(() => impl.write(i));
      },
    },
    {
      // **이 계약 고유의 자리다.** 다 채운 뒤로도 계속 쓰면 매 호출이 하나를 밀어낸다.
      // 담긴 것을 배열 앞부터 들고 앞을 실제로 지우는 계열이 정확히 여기서 걸린다 —
      // 위 시나리오는 통과한다.
      covers: ["write"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) impl.write(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.write(n + i));
      },
    },
    {
      // 다 채우고 전부 읽는다. 앞을 실제로 지우는 계열이 여기서도 걸린다.
      covers: ["read"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) impl.write(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.read());
      },
    },
    {
      // 셋을 한 걸음에 묶는 이유는 `isFull` 혼자로는 잴 것이 적기 때문이다.
      // 크기를 세어 두지 않고 매번 칸을 훑는 계열이 여기서만 걸린다.
      covers: ["peek", "isFull", "size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) impl.write(i);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.peek();
            impl.isFull();
            impl.size();
          });
        }
      },
    },
  ],
};
