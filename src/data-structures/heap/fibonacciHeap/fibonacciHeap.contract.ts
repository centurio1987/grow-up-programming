/**
 * `heap/fibonacciHeap` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./fibonacciHeap.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **이웃 계약과 무엇을 같은 객체로 쓰는가 — 항목마다 갈린다.** 불변 사실 251 은 「의미 열이 같고
 * 비용 열만 갈린 두 계약은 `model`·`ops`·`edges` 를 같은 객체로 쓴다」였다. 이 계약은 그
 * 조건에 들지 않는다 — **연산이 하나 더 있고**, 같은 이름의 연산도 의미 열이 핸들 몫만큼 다르다
 * (`enqueue` 가 핸들을 돌려주고, `dequeue` 가 그 핸들을 죽이고, `merge` 가 넘겨받은 핸들을 옮긴다).
 * 그래서 항목마다 따로 판정했다.
 *
 * | 항목 | 어디서 | 이유 |
 * |---|---|---|
 * | `model`·`ops` | 이 파일 | 모델이 값의 모음이 아니라 **받은 순서대로 이름 붙은 원소의 모음**이어야 핸들을 대조할 수 있다 |
 * | `edges` | `heap/leftistHeap` 의 여덟 **+** 이 파일의 여섯 | 저쪽 경계 케이스는 핸들 없는 여섯 연산만 부르고, 그 여섯의 핸들 몫을 뺀 의미가 이 계약에서도 같다. 케이스 객체를 그대로 펼쳐 넣는다 |
 * | `scenarios` | `heap/pairingHeap` 의 넷 **+** 이 파일의 셋 | 넣기·빼기·합치기 행은 상한·한정자까지 같아 저쪽 시나리오를 같은 객체로 쓴다. 조회 셋은 채우기에 키 낮추기를 넣어야 해서 따로 적었다 |
 *
 * 하네스 자기시험(`_contract/runContract.fibonacciHeap.test.ts`)이 공유한 것의 참조가 같다는 것을
 * `toBe` 로 고정한다. **저쪽이 움직이면 이 스위트도 따라 움직이고, 헤더는 따라가지 않는다**(불변
 * 사실 251 의 딸린 사실과 같다).
 *
 * **껍데기(`DecreaseSite`)는 저쪽 껍데기(`MergeSite`)가 하던 일에 핸들을 받은 순서대로 들고 있는
 * 일을 더한다.** 축1 무작위 시퀀스는 인자를 모델 없이 지으므로(불변 사실 82) 「지금 담긴 원소의
 * 핸들」을 인자로 줄 수 없다 — 대신 받은 순서 번호를 주고 껍데기와 모델이 같은 번호를 같은 원소로
 * 읽는다. 번호가 가리키는 원소가 이미 빠졌을 수 있고, 그 자리가 곧 거절 경로의 검사다.
 *
 * **n 은 담긴 원소 수다.** `merge` 행에서만 「합친 뒤의 원소 수」로 읽는다.
 */

import type { ContractSpec, CostScenario } from "../../_contract/runContract";
import {
  leftistHeapContract,
  type MergeSite,
} from "../leftistHeap/leftistHeap.contract";
import { pairingHeapContract } from "../pairingHeap/pairingHeap.contract";

/** 헤더 연산 계약 표의 일곱 행을 옮긴 표면. `H` 는 구현이 내주는 핸들의 타입이다. */
export interface DecreasableQueue<T, H> {
  enqueue(item: T): H;
  dequeue(): T | null;
  decreaseKey(handle: H, item: T): boolean;
  merge(other: DecreasableQueue<T, H>): void;
  peek(): T | null;
  size(): number;
  isEmpty(): boolean;
}

type Measured<T, H> = DecreasableQueue<T, H> & { __cost?: number };

/**
 * 하네스용 껍데기. `heap/leftistHeap` 의 `MergeSite` 가 하는 일(합칠 큐를 따로 짓고 합치는
 * 일만 걸음으로 재기)에 **핸들을 받은 순서대로 들고 있는 일**을 더한다.
 */
export class DecreaseSite<T, H = unknown> {
  readonly #make: () => Measured<T, H>;
  #main: Measured<T, H>;
  #staged: Measured<T, H> | null = null;
  /** 넣기와 합칠 큐 채우기가 돌려준 핸들. 받은 순서 그대로다. */
  readonly #handles: H[] = [];
  /** 합쳐져 비워진 큐가 쓴 걸음. 그 객체를 놓아 버리기 전에 옮겨 담는다. */
  #carried = 0;

  constructor(make: () => Measured<T, H>) {
    this.#make = make;
    this.#main = make();
  }

  get __cost(): number {
    return (
      this.#carried + (this.#main.__cost ?? 0) + (this.#staged?.__cost ?? 0)
    );
  }

  enqueue(item: T): H {
    const handle = this.#main.enqueue(item);
    this.#handles.push(handle);
    return handle;
  }

  dequeue(): T | null {
    return this.#main.dequeue();
  }

  decreaseKey(handle: H, item: T): boolean {
    return this.#main.decreaseKey(handle, item);
  }

  /**
   * 받은 순서로 `pick` 번째(핸들 수로 나눈 나머지) 핸들의 원소를 낮춘다. 받은 핸들이 하나도
   * 없으면 구현을 부르지 않고 `null` 이다 — 축1 무작위 시퀀스가 인자를 모델 없이 지으므로
   * (`runContract.ts` 의 `BehaviorOp.arg`) 핸들을 번호로 고르는 자리가 여기다.
   */
  decreaseKeyAt(pick: number, item: T): boolean | null {
    if (this.#handles.length === 0) return null;
    const handle = this.#handles[pick % this.#handles.length] as H;
    return this.#main.decreaseKey(handle, item);
  }

  peek(): T | null {
    return this.#main.peek();
  }

  size(): number {
    return this.#main.size();
  }

  isEmpty(): boolean {
    return this.#main.isEmpty();
  }

  /** 합칠 큐를 지어 채우고 그 핸들들을 받는다. 준비 작업이므로 `ctx.step` 밖에서 부른다. */
  stage(values: readonly T[]): H[] {
    const other = this.#make();
    const handles: H[] = [];
    for (const value of values) handles.push(other.enqueue(value));
    this.#handles.push(...handles);
    this.#staged = other;
    return handles;
  }

  /** 지어 둔 큐를 합치고 `[이 큐의 크기, 넘겨받은 큐의 크기]` 를 돌려준다. */
  absorb(): [number, number] {
    const other = this.#staged;
    if (other === null) throw new Error("합칠 큐를 먼저 지어야 한다");

    this.#main.merge(other);
    const left = other.size();
    const mine = this.#main.size();
    this.#carried += other.__cost ?? 0;
    this.#staged = null;
    return [mine, left];
  }
}

/**
 * 축1 참조 모델. 받은 순서대로 늘어놓은 원소 목록이고, 아직 담긴 것만 큐의 내용이다. 최우선
 * 원소는 매번 훑어 찾는다 — 축1은 의미만 보므로 자명한 구현으로 충분하다.
 */
interface Entry {
  value: number;
  alive: boolean;
}
type Model = Entry[];

/**
 * 무작위 시퀀스의 값 범위. **우선순위가 겹치지 않도록 넓게 잡는다.**
 *
 * 계약은 같은 우선순위 원소 중 어느 것이 먼저 빠지는지 정하지 않는다. 핸들이 없는 계약에서는
 * 그것이 관측되지 않지만(값이 같으므로) 여기서는 **빠진 원소의 핸들을 키 낮추기가 거절한다**
 * — 겹친 둘 중 어느 쪽이 빠졌는지가 다음 키 낮추기의 답을 가른다. 참조 모델은 그 갈림을 하나로
 * 골라야 하므로, 겹침이 생기면 계약을 지키는 구현이 모델과 어긋날 수 있다. 값이 겹치지 않는
 * 시퀀스에서는 그런 자리가 없다. 무작위 시퀀스에 겹침이 하나도 없다는 것을 하네스 자기시험이
 * 고정한다(`_contract/runContract.fibonacciHeap.test.ts`).
 *
 * 같은 우선순위 원소를 여러 벌 담는 자리는 `heap/leftistHeap` 에서 가져온 경계 케이스가 짚는다.
 * 그 케이스들에는 키 낮추기가 없다.
 */
const DOMAIN = 2 ** 31;

/** 합칠 큐에 담는 원소 수의 상한. 빈 큐를 합치는 자리도 나오도록 0 을 포함한다. */
const MERGE_BATCH = 5;

/** 키 낮추기가 고르는 핸들 번호의 범위. 받은 핸들 수로 나눈 나머지를 쓴다. */
const PICK_RANGE = 1 << 16;

function modelTop(model: Model): number | null {
  let best: number | null = null;
  for (const entry of model) {
    if (entry.alive && (best === null || entry.value < best))
      best = entry.value;
  }
  return best;
}

function modelSize(model: Model): number {
  let count = 0;
  for (const entry of model) if (entry.alive) count += 1;
  return count;
}

function modelDequeue(model: Model): number | null {
  const top = modelTop(model);
  if (top === null) return null;
  const entry = model.find((each) => each.alive && each.value === top);
  if (entry !== undefined) entry.alive = false;
  return top;
}

function modelDecreaseKey(model: Model, pick: number, value: number) {
  if (model.length === 0) return null;
  const entry = model[pick % model.length] as Entry;
  if (!entry.alive || value > entry.value) return false;
  entry.value = value;
  return true;
}

type Site = DecreaseSite<number>;

/** 계약 C 의 시나리오가 껍데기에서 부르는 이름들. 저쪽 껍데기의 공개 표면에서 뽑는다. */
type PairingSiteSurface = Pick<
  MergeSite<number>,
  "enqueue" | "dequeue" | "isEmpty" | "peek" | "size" | "absorb"
> & { stage(values: readonly number[]): unknown };

/**
 * 계약 C 의 시나리오를 **같은 객체 그대로** 이 껍데기의 시나리오로 읽는다.
 *
 * 저쪽 껍데기(`MergeSite`)가 `#` 필드를 들어 두 껍데기는 타입으로 서로 대입되지 않는다. 그래서
 * 옮기는 자리가 여기 하나이고, 타입 매개변수의 제약(`S extends PairingSiteSurface`)이 **이 껍데기가
 * 저쪽 시나리오가 부르는 이름을 같은 모양으로 내주는지**를 컴파일 시점에 본다. 객체를 새로 짓지
 * 않으므로 하네스 자기시험이 참조가 같다는 것을 `toBe` 로 고정할 수 있다.
 */
function sameObjects<S extends PairingSiteSurface>(
  scenarios: readonly CostScenario<MergeSite<number>>[],
): readonly CostScenario<S>[] {
  return scenarios as readonly CostScenario<unknown>[] as readonly CostScenario<S>[];
}

/**
 * 계약 C(`heap/pairingHeap`)의 시나리오 다섯 중 이 스위트가 **같은 객체로** 쓰는 넷 — 넣기 ·
 * 빼기 둘 · 합치기. 그 넷이 재는 행은 두 계약에서 의미(핸들 몫을 뺀)·상한·한정자가 같다.
 * **조회 셋의 시나리오만 가져오지 않는다** — 최우선 자리를 바꾸는 연산이 이 계약에 하나 더
 * 있어 채우기에 그 연산을 넣어야 하기 때문이다(아래 조회 시나리오 주석).
 */
const sharedWithPairing = sameObjects<Site>(
  pairingHeapContract.scenarios.filter(
    (scenario) => !scenario.covers.includes("peek"),
  ),
);

export const fibonacciHeapContract: ContractSpec<Site, Model> = {
  name: "FibonacciHeap",
  grade: "complexity",
  model: () => [],

  ops: [
    {
      name: "enqueue",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => {
        impl.enqueue(arg as number);
      },
      onModel: (model, arg) => {
        model.push({ value: arg as number, alive: true });
      },
    },
    {
      name: "dequeue",
      arg: () => undefined,
      onImpl: (impl) => impl.dequeue(),
      onModel: (model) => modelDequeue(model),
    },
    {
      name: "decreaseKey",
      // `[받은 순서 번호, 새 값]`. 번호는 받은 핸들 수로 나눈 나머지로 읽는다.
      arg: (rng) => [
        Math.floor(rng() * PICK_RANGE),
        Math.floor(rng() * DOMAIN),
      ],
      onImpl: (impl, arg) => {
        const [pick, value] = arg as [number, number];
        return impl.decreaseKeyAt(pick, value);
      },
      onModel: (model, arg) => {
        const [pick, value] = arg as [number, number];
        return modelDecreaseKey(model, pick, value);
      },
    },
    {
      name: "merge",
      arg: (rng) => {
        const count = Math.floor(rng() * (MERGE_BATCH + 1));
        return Array.from({ length: count }, () => Math.floor(rng() * DOMAIN));
      },
      onImpl: (impl, arg) => {
        impl.stage(arg as number[]);
        return impl.absorb();
      },
      onModel: (model, arg) => {
        for (const value of arg as number[]) model.push({ value, alive: true });
        return [modelSize(model), 0];
      },
    },
    {
      name: "peek",
      arg: () => undefined,
      onImpl: (impl) => impl.peek(),
      onModel: (model) => modelTop(model),
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => modelSize(model),
    },
    {
      name: "isEmpty",
      arg: () => undefined,
      onImpl: (impl) => impl.isEmpty(),
      onModel: (model) => modelSize(model) === 0,
    },
  ],

  edges: [
    ...leftistHeapContract.edges,
    {
      name: "낮춘 원소가 최우선이 되면 보기와 빼기가 따라 바뀐다",
      steps: [
        { op: "enqueue", arg: 5 },
        { op: "enqueue", arg: 9 },
        { op: "enqueue", arg: 7 },
        { op: "peek" },
        { op: "decreaseKey", arg: [1, 2] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "peek" },
        { op: "size" },
      ],
    },
    {
      // 거절은 상태를 바꾸지 않는다. 비교자가 0 을 돌려주는 값은 뒤서지 않으므로 받아들인다.
      name: "뒤서게 하는 값은 거절하고 같은 우선순위는 받아들인다",
      steps: [
        { op: "enqueue", arg: 4 },
        { op: "enqueue", arg: 6 },
        { op: "decreaseKey", arg: [0, 8] },
        { op: "peek" },
        { op: "decreaseKey", arg: [1, 6] },
        { op: "size" },
        { op: "decreaseKey", arg: [1, 3] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "빠진 원소의 핸들은 거절하고 상태를 바꾸지 않는다",
      steps: [
        { op: "enqueue", arg: 3 },
        { op: "enqueue", arg: 8 },
        { op: "dequeue" },
        { op: "decreaseKey", arg: [0, 1] },
        { op: "peek" },
        { op: "size" },
        { op: "dequeue" },
        { op: "decreaseKey", arg: [1, 0] },
        { op: "isEmpty" },
      ],
    },
    {
      // 넘겨받은 큐에서 받은 핸들이 합친 뒤 이 큐의 원소를 가리키는 자리.
      name: "합치기로 옮겨 온 원소의 핸들은 받은 큐에서 그 원소를 가리킨다",
      steps: [
        { op: "enqueue", arg: 10 },
        { op: "merge", arg: [20, 30] },
        { op: "decreaseKey", arg: [2, 5] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "decreaseKey", arg: [2, 1] },
        { op: "dequeue" },
        { op: "decreaseKey", arg: [1, 15] },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      // 빼기가 한 번 돌아 원소들이 서로의 아래로 들어간 뒤에 낮추는 자리. 뿌리가 아닌 원소를
      // 낮추는 일이 여기서 처음 나온다.
      name: "빼기 뒤 아래에 든 원소를 거듭 낮춰도 순서가 맞다",
      steps: [
        { op: "enqueue", arg: 10 },
        { op: "enqueue", arg: 20 },
        { op: "enqueue", arg: 30 },
        { op: "enqueue", arg: 40 },
        { op: "enqueue", arg: 50 },
        { op: "enqueue", arg: 60 },
        { op: "enqueue", arg: 70 },
        { op: "enqueue", arg: 80 },
        { op: "enqueue", arg: 90 },
        { op: "dequeue" },
        { op: "decreaseKey", arg: [8, 5] },
        { op: "decreaseKey", arg: [7, 6] },
        { op: "decreaseKey", arg: [6, 7] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "decreaseKey", arg: [5, 25] },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "size" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "같은 원소를 거듭 낮출 수 있고 빼고 나면 그 핸들은 거절된다",
      steps: [
        { op: "enqueue", arg: 50 },
        { op: "enqueue", arg: 40 },
        { op: "decreaseKey", arg: [0, 30] },
        { op: "decreaseKey", arg: [0, 20] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "decreaseKey", arg: [0, 10] },
        { op: "peek" },
        { op: "size" },
      ],
    },
  ],

  // 헤더 불변식 절이 「없다」이므로 빈 배열이다. 항목을 지우는 것과 다르다.
  invariants: [],

  scenarios: [
    ...sharedWithPairing,
    {
      covers: ["decreaseKey"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      // **내림차순으로 n 개를 넣고, 먼저 넣은 원소부터 차례로 최우선보다 앞서게 낮추기.**
      // 넣기를 뿌리 둘 잇기로 하는 계열에서는 새 원소가 늘 뿌리가 되어 원소들이 한 줄로 서고,
      // 먼저 넣은 원소일수록 깊다. 앞당긴 원소를 부모와 자리를 바꿔 올리는 계열
      // (`_contract/_fixtures/siftingLinkingHeap.ts`)은 줄의 길이만큼 바꾸고, 올라간 원소 대신
      // 나머지가 한 칸씩 내려가 다음 원소도 같은 깊이다 — 호출 평균 1,024 · 4,096 · 16,384.
      // 나중에 넣은 원소부터 낮추면 512.5 · 2,048.5 · 8,192.5 로 걸리고 오름차순으로 넣으면 2.00
      // 고정으로 통과한다.
      //
      // **이 계약의 정본은 여기서 한 번도 떼지 않는다** — 빼기가 없어 원소가 전부 뿌리이고,
      // 뿌리를 앞당기는 일은 최우선 자리 비교 한 번이다(1.00 고정). 떼기와 이어 떼기를 재는
      // 자리는 아래 시나리오다.
      run: (impl, n, ctx) => {
        const handles: unknown[] = [];
        for (let i = 0; i < n; i++) handles.push(impl.enqueue((n - i) * 4));
        for (let i = 0; i < n; i++) {
          const handle = handles[i];
          ctx.step(() => {
            impl.decreaseKey(handle, -1 - i);
          });
        }
      },
    },
    {
      covers: ["decreaseKey"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      // **섞은 값으로 n 개를 넣고 한 번 뺀 뒤, 무작위로 고른 원소를 매번 최우선보다 앞서게
      // 낮추기.** 빼기가 한 번 돌아 원소들이 서로의 아래로 들어간 상태에서 앞당기므로, 뿌리가
      // 아닌 원소를 앞당기는 일이 여기서 처음 나온다. 정본은 호출 평균 1.69 · 1.69 · 1.68 이고
      // 한 호출의 이어 떼기가 6 · 6 · 7 걸음까지 간다 — **위 시나리오가 못 재는 정본의 떼기를
      // 재는 자리가 여기뿐이다.**
      //
      // **저장소의 결함 fixture 중 여기서만 걸리는 것은 없다.** 자리를 바꿔 올리는 계열도 한 번
      // 뺀 뒤에는 뿌리 아래가 얕아 통과한다(3.16 · 3.36 · 2.49). 겨누는 계열이 위와 겹치지 않는
      // 것이 아니라 **이쪽이 잡는 계열이 없다**는 사실을 적어 두고, 그래도 두는 이유는 위
      // 시나리오가 정본에서 이 행의 일을 한 번도 시키지 않기 때문이다(불변 사실 130 의 이유와
      // 같은 모양이다 — 상태를 달리 지나간다).
      run: (impl, n, ctx) => {
        const order = shuffled(n, ctx.rng);
        const handles: unknown[] = [];
        for (let i = 0; i < n; i++)
          handles.push(impl.enqueue(((order[i] as number) + 1) * 4));
        impl.dequeue();

        let lowest = 0;
        for (let i = 0; i < n; i++) {
          const handle = handles[Math.floor(ctx.rng() * n)];
          lowest -= 1;
          const value = lowest;
          ctx.step(() => {
            impl.decreaseKey(handle, value);
          });
        }
      },
    },
    {
      covers: ["peek", "size", "isEmpty"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // 세 조회를 한 걸음으로 묶어 잰다. 세 행이 같은 상한·한정자라 갈라 잴 이유가 없다.
      //
      // **넣기·합치기로 채우고, 보기마다 바로 앞에서 원소 하나를 최우선보다 앞서게 낮춘다.**
      // 최우선 자리를 바꾸는 연산이 셋(넣기·합치기·키 낮추기)이고, 그중 하나에서만 자리를 놓치는
      // 구현은 채우기가 그 연산을 안 거치면 드러나지 않는다 — `heap/pairingHeap` 의 조회
      // 시나리오가 넣기와 합치기를 섞은 이유와 같다. 그 시나리오를 가져오지 않은 이유가 이것이다.
      //
      // 앞당긴 뒤 최우선 자리를 고치지 않고 보기가 뿌리를 다시 훑는 계열
      // (`_contract/_fixtures/rescanningTopHeap.ts`)이 여기서 1,027 · 4,099 · 16,387 로 걸리고,
      // `heap/pairingHeap` 의 조회 시나리오에서는 3.00 고정으로 통과한다. 합치기로 옮겨 온 원소도
      // 앞당기도록 넘겨받은 큐의 핸들을 함께 모은다. 정본은 3.00 고정이다.
      run: (impl, n, ctx) => {
        const handles: unknown[] = [];
        let filled = 0;
        while (filled + 2 <= n) {
          handles.push(impl.enqueue((filled + 1) * 4));
          handles.push(...impl.stage([(filled + 2) * 4]));
          impl.absorb();
          filled += 2;
        }
        while (filled < n) {
          handles.push(impl.enqueue((filled + 1) * 4));
          filled += 1;
        }

        let lowest = 0;
        for (let i = 0; i < n; i++) {
          lowest -= 1;
          impl.decreaseKey(handles[Math.floor(ctx.rng() * n)], lowest);
          ctx.step(() => {
            impl.peek();
            impl.size();
            impl.isEmpty();
          });
        }
      },
    },
  ],
};

/** `0..n-1` 을 섞은 배열. 시나리오의 준비 작업이다. */
function shuffled(n: number, rng: () => number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = order[i] as number;
    order[i] = order[j] as number;
    order[j] = swap;
  }
  return order;
}
