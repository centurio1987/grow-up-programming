/**
 * `linear/bitArray` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./bitArray.ts` 헤더 한 곳이고(규약1), 여기 있는 것은
 * 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 생성자가 **자리 수**를 받으므로 축3 사다리를 오르려면 그
 * 크기의 배열을 다시 세워야 한다. 껍데기는 계약의 일부가 아니다. `graph-repr/graphAdjMatrix` 의
 * 껍데기와 다른 것이 하나 있다 — **생성자 행을 축1 연산 하나(`constructor`)로 부른다.** 그 연산이
 * 껍데기 안의 배열을 인자 크기로 다시 세우고, 생성자가 `RangeError` 를 던지면 이전 배열을 그대로
 * 둔다. 그래서 「0 은 정당하다 · 음수와 정수가 아닌 자리 수는 `RangeError` · 새로 세우면 전부 꺼져
 * 있다」가 스텁과 정본에 같은 경로로 닿고 vector 에도 실린다(그래프 행렬은 그 조항을 정본에 대해서만
 * 자기시험에서 짚었다). **무작위 시퀀스에서는 크기를 드물게 바꾼다** — 받아들이는 크기를 열에 하나로 두었더니
 * 켜 둔 자리가 쌓이지 않아 묶음 수를 내림으로 셈한 정본 변이가 무작위 500 회를 통과했다(탐침). 지금 값에서 seed 1
 * 의 500 회 중 생성자 연산 86 회, 받아들여진 것은 둘이다(둘 다 같은 크기로 다시 세운다).
 *
 * **범위 밖 첨자를 관측값으로 만든다.** 계약이 세 연산에 `RangeError` 를 적었는데 하네스는 던진 것을
 * 값으로 대조하지 못한다(`runContract.ts` 의 축1은 반환값만 본다). 양쪽을 같은 방식으로 감싸 문자열
 * 하나로 바꾸고, `RangeError` 가 아닌 예외는 그대로 올려보낸다 — 스텁의 `Not implemented` 가 통과로
 * 읽히면 안 된다(`linear/dynamicArray` 와 같은 처리).
 *
 * **축1이 도는 자리 수는 70 이다.** 32 와 64 를 넘고 32 의 배수가 아니다 — 자리를 묶어 담는 구현이
 * 묶음 경계(31 · 32 · 63 · 64)와 마지막 묶음의 남는 비트에서 틀리면 여기서 갈린다.
 *
 * **축3 시나리오에 적대적인 것이 없다.** 네 행 모두 켜는 순서 · 끄는 순서를 섞은 입력이 결함 둘을
 * 이미 가르고, 한 방향 차례(오름차순 · 내림차순)는 그 둘 중 어느 것도 더 가르지 못했다(불변 사실 57 —
 * 가르지 못하는 시나리오는 두지 않는다). 수치는 자기시험 머리말에 있다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **네 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface BitArrayContract {
  set(index: number): void;
  clear(index: number): void;
  get(index: number): boolean;
  size(): number;
}

type Built = BitArrayContract & { __cost?: number };

/** 축1이 도는 자리 수. 파일 머리 설명 참고. */
const SLOTS = 70;

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

/** 하네스용 껍데기. 배열 하나를 들고, `reset(n)` 으로 크기 n 인 새 배열로 바꾼다. */
export class SizedBits {
  readonly #make: (n: number) => Built;
  #bits: Built;
  #carried = 0;

  constructor(make: (n: number) => Built) {
    this.#make = make;
    this.#bits = make(SLOTS);
  }

  get __cost(): number {
    return this.#carried + (this.#bits.__cost ?? 0);
  }

  get bits(): BitArrayContract {
    return this.#bits;
  }

  /** 크기 n 인 배열로 바꾼다. 생성자가 던지면 이전 배열을 그대로 두고 그 예외를 올려보낸다. */
  reset(n: number): void {
    const next = this.#make(n);
    this.#carried += this.#bits.__cost ?? 0;
    this.#bits = next;
  }
}

/** 축1 참조 모델. 자리마다 불리언 하나 — 축1은 의미만 보므로 자명한 구현으로 충분하다. */
interface Model {
  bits: boolean[];
}

/** 모델 쪽 범위 판정 — 헤더의 「`[0, size())` 안의 정수」. */
function inRange(model: Model, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < model.bits.length;
}

/** 축1 무작위 첨자. 범위 밖(-1 · 자리 수 이상)과 정수가 아닌 값이 섞이게 잡는다. */
function someIndex(rng: () => number): number {
  if (rng() < 0.1) return 0.5;
  return Math.floor(rng() * (SLOTS + 2)) - 1;
}

/**
 * 축1 무작위 자리 수. 쉰에 마흔아홉은 생성자가 거절하는 값이라 배열이 그대로 남고, 받아들이는 값은 `SLOTS` 하나다
 * — 다시 세우면 전부 꺼진다는 것만 무작위가 본다. 다른 크기(0 · 1 · 5)는 경계 케이스가 짚는다. 무작위가 작은
 * 배열로 바꾸면 남은 시퀀스가 거의 전부 범위 밖 호출이 된다(seed 1 에서 123번째에 0 으로 바뀐 실측).
 */
function someSize(rng: () => number): number {
  if (rng() < 0.02) return SLOTS;
  return rng() < 0.5 ? -1 : 2.5;
}

/** 0 부터 n - 1 까지를 섞은 차례. 시나리오의 `rng` 로 섞으므로 seed 가 같으면 차례도 같다. */
function shuffled(n: number, rng: () => number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  return order;
}

export const bitArrayContract: ContractSpec<SizedBits, Model> = {
  name: "BitArray",
  grade: "basic",
  model: () => ({ bits: new Array<boolean>(SLOTS).fill(false) }),

  ops: [
    {
      name: "constructor",
      arg: (rng) => someSize(rng),
      onImpl: (impl, arg) => observe(() => impl.reset(arg as number)),
      onModel: (model, arg) => {
        const n = arg as number;
        if (!Number.isInteger(n) || n < 0) return OUT_OF_RANGE;
        model.bits = new Array<boolean>(n).fill(false);
        return undefined;
      },
    },
    {
      name: "set",
      arg: (rng) => someIndex(rng),
      onImpl: (impl, arg) => observe(() => impl.bits.set(arg as number)),
      onModel: (model, arg) => {
        const index = arg as number;
        if (!inRange(model, index)) return OUT_OF_RANGE;
        model.bits[index] = true;
        return undefined;
      },
    },
    {
      name: "clear",
      arg: (rng) => someIndex(rng),
      onImpl: (impl, arg) => observe(() => impl.bits.clear(arg as number)),
      onModel: (model, arg) => {
        const index = arg as number;
        if (!inRange(model, index)) return OUT_OF_RANGE;
        model.bits[index] = false;
        return undefined;
      },
    },
    {
      name: "get",
      arg: (rng) => someIndex(rng),
      onImpl: (impl, arg) => observe(() => impl.bits.get(arg as number)),
      onModel: (model, arg) => {
        const index = arg as number;
        if (!inRange(model, index)) return OUT_OF_RANGE;
        return model.bits[index] as boolean;
      },
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.bits.size(),
      onModel: (model) => model.bits.length,
    },
  ],

  edges: [
    {
      name: "처음에는 모든 자리가 꺼져 있고 size 는 생성 인자다",
      steps: [
        { op: "size" },
        { op: "get", arg: 0 },
        { op: "get", arg: 31 },
        { op: "get", arg: 32 },
        { op: "get", arg: SLOTS - 1 },
      ],
    },
    {
      // 묶음 경계 양쪽을 짚는다. 자리를 묶어 담는 구현이 묶음 번호나 묶음 안 위치를 잘못 셈하면
      // 이웃 자리가 함께 켜지거나 다른 묶음의 자리가 켜진다.
      name: "set 은 그 자리 하나만 켜고 켜진 자리를 다시 켜도 그대로다",
      steps: [
        { op: "set", arg: 31 },
        { op: "get", arg: 30 },
        { op: "get", arg: 31 },
        { op: "get", arg: 32 },
        { op: "set", arg: 31 },
        { op: "get", arg: 31 },
        { op: "set", arg: 64 },
        { op: "get", arg: 63 },
        { op: "get", arg: 64 },
        { op: "get", arg: 0 },
      ],
    },
    {
      name: "clear 는 그 자리 하나만 끄고 꺼진 자리를 다시 꺼도 그대로다",
      steps: [
        { op: "set", arg: 31 },
        { op: "set", arg: 32 },
        { op: "set", arg: 33 },
        { op: "clear", arg: 32 },
        { op: "get", arg: 31 },
        { op: "get", arg: 32 },
        { op: "get", arg: 33 },
        { op: "clear", arg: 32 },
        { op: "get", arg: 32 },
        { op: "clear", arg: 5 },
        { op: "get", arg: 5 },
      ],
    },
    {
      // 경계가 `[0, n)` 이므로 n 과 n - 1 을 함께 짚는다(`docs/ORD-006-conventions.md` 「경계가
      // `[0, n]` 인 인자는 경계 케이스가 `n` 을 짚는다」의 반열린 판). 묶어 담는 구현은 마지막 묶음에
      // n 이상의 비트가 남아 있어, 범위 검사를 빠뜨리면 그 비트를 켜고 읽는다.
      name: "마지막 자리 n-1 은 자리이고 n 은 범위 밖이라 세 연산 모두 RangeError 다",
      steps: [
        { op: "set", arg: SLOTS - 1 },
        { op: "get", arg: SLOTS - 1 },
        { op: "get", arg: SLOTS },
        { op: "set", arg: SLOTS },
        { op: "clear", arg: SLOTS },
        { op: "get", arg: SLOTS - 1 },
        { op: "clear", arg: SLOTS - 1 },
        { op: "get", arg: SLOTS - 1 },
      ],
    },
    {
      name: "-1 · 정수가 아닌 첨자는 RangeError 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "set", arg: 0 },
        { op: "set", arg: -1 },
        { op: "clear", arg: 0.5 },
        { op: "get", arg: -1 },
        { op: "get", arg: 0.5 },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
        { op: "size" },
      ],
    },
    {
      // 생성자 행을 껍데기 연산으로 짚는다(파일 머리 설명). 거절된 생성은 이전 배열을 남긴다.
      name: "다시 세우면 전부 꺼지고, 자리 수 0 은 정당하며 음수 · 정수가 아닌 자리 수는 RangeError 다",
      steps: [
        { op: "set", arg: 3 },
        { op: "constructor", arg: 5 },
        { op: "size" },
        { op: "get", arg: 3 },
        { op: "get", arg: 5 },
        { op: "constructor", arg: 0 },
        { op: "size" },
        { op: "get", arg: 0 },
        { op: "set", arg: 0 },
        { op: "constructor", arg: -1 },
        { op: "constructor", arg: 2.5 },
        { op: "size" },
        { op: "constructor", arg: 1 },
        { op: "set", arg: 0 },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
      ],
    },
  ],

  invariants: [],

  scenarios: [
    {
      // 크기 n 으로 세우고 모든 자리를 섞은 차례로 켠다. 상각이므로 n 회 측정한다(§규약2 시나리오
      // 규칙 4). 켜진 자리 번호를 목록으로 드는 계열이 여기서 걸린다 — 켜진 수가 n 까지 자란다.
      covers: ["set"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const bits = impl.bits;
        for (const index of shuffled(n, ctx.rng))
          ctx.step(() => bits.set(index));
      },
    },
    {
      // 전부 켠 뒤 섞은 차례로 끈다. 켜진 자리 번호를 찾아 지우는 계열이 여기서 걸린다.
      covers: ["clear"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const bits = impl.bits;
        for (let i = 0; i < n; i++) bits.set(i);
        for (const index of shuffled(n, ctx.rng))
          ctx.step(() => bits.clear(index));
      },
    },
    {
      // 짝수 자리만 켠 뒤 모든 자리를 한 번씩 읽는다. 한 호출 최대가 통계이므로 꺼진 자리를 목록
      // 전부를 훑어 확인하는 계열이 드러난다.
      covers: ["get"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const bits = impl.bits;
        for (let i = 0; i < n; i += 2) bits.set(i);
        for (let i = 0; i < n; i++) ctx.step(() => bits.get(i));
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const bits = impl.bits;
        for (let i = 0; i < n; i += 2) bits.set(i);
        for (let i = 0; i < 8; i++) ctx.step(() => bits.size());
      },
    },
  ],
};
