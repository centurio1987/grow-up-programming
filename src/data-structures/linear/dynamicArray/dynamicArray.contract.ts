/**
 * `linear/dynamicArray` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./dynamicArray.ts` 헤더 한 곳이고(규약1), 여기
 * 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **범위 밖 첨자를 관측값으로 만든다.** 계약이 `set` 자리에 `RangeError` 를 적었는데 하네스는 던진
 * 것을 값으로 대조하지 못한다(`runContract.ts` 의 축1은 반환값만 본다). 양쪽을 같은 방식으로 감싸
 * 문자열 하나로 바꾸고, `RangeError` 가 아닌 예외는 그대로 올려보낸다 — 스텁의 `Not implemented` 가
 * 통과로 읽히면 안 된다(`linear/gapBuffer` 와 같은 처리).
 *
 * **늘어놓는 연산이 없어 원소를 첨자마다 `get` 으로 짚는다.** 헤더가 `toArray` 를 뺐으므로(원칙 A5′) 경계
 * 케이스가 상태를 보는 길은 `get` · `size` 뿐이다. 칸을 옮기다 하나를 빠뜨리는 구현을 잡으려면 옮긴 뒤 모든 첨자를
 * 읽어야 해서, 늘었다 줄어드는 케이스는 담긴 첨자를 전부 짚는다. 불변식은 없다 — 헤더 불변식 절.
 *
 * **적대적 시나리오가 하나 있다 — 넣고 빼기를 경계에서 번갈아 한다.** 사다리 크기(2의 거듭제곱)만큼
 * 채운 뒤 넣기 · 빼기를 번갈아 부른다. 칸 수를 2의 거듭제곱으로 늘리는 구현에게 그 크기는 칸이 꽉
 * 찬 자리이고, 절반 이하에서 곧바로 절반으로 줄이는 구현이 거기서 호출마다 칸을 옮긴다. **정당한
 * 구현은 어느 것도 떨어뜨리지 않는다** — `amortized O(1)` 은 어떤 호출열에도 서는 약속이기 때문이다.
 * 대신 칸 수가 사다리 크기와 어긋나는 줄이기 구현은 이 입력에서 경계를 못 만나 통과한다 — 같은
 * fixture(`_contract/_fixtures/halfShrinkArray.ts`)의 처음 칸 수만 4 에서 3 으로 바꾸면 1 → 1 로 통과했다
 * (실측 · 적대성은 (계약, 구현) 쌍에 대해 정의된다 — 불변 사실 57). 경계를 찾는 입력은 칸 수를 읽어야
 * 지을 수 있고, 칸 수는 계약 표면에 없다(불변 사실 44).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 다섯 행을 그대로 옮긴 표면. */
export interface DynamicArrayContract<T> {
  push(item: T): void;
  pop(): T | null;
  get(index: number): T | null;
  set(index: number, item: T): void;
  size(): number;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

/** 범위 밖 호출의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";

function observe(call: () => unknown): unknown {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/** 모델 쪽 범위 판정 — 헤더의 「`[0, size())` 안의 정수」. */
function inRange(model: Model, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < model.length;
}

/** 축1 무작위 첨자. 범위 밖(-1 · 담긴 수 이상)과 정수가 아닌 값이 섞이게 잡는다. */
function someIndex(rng: () => number): number {
  if (rng() < 0.1) return 1.5;
  return Math.floor(rng() * 10) - 1;
}

export const dynamicArrayContract: ContractSpec<
  DynamicArrayContract<number>,
  Model
> = {
  name: "DynamicArray",
  grade: "basic",
  model: () => [],

  ops: [
    {
      name: "push",
      arg: (rng) => Math.floor(rng() * 100) - 20,
      onImpl: (impl, arg) => {
        impl.push(arg as number);
      },
      onModel: (model, arg) => {
        model.push(arg as number);
      },
    },
    {
      name: "pop",
      arg: () => undefined,
      onImpl: (impl) => impl.pop(),
      onModel: (model) => (model.length === 0 ? null : (model.pop() as number)),
    },
    {
      name: "get",
      arg: (rng) => someIndex(rng),
      onImpl: (impl, arg) => impl.get(arg as number),
      onModel: (model, arg) =>
        inRange(model, arg as number) ? (model[arg as number] as number) : null,
    },
    {
      name: "set",
      arg: (rng) => [someIndex(rng), Math.floor(rng() * 100) - 20],
      onImpl: (impl, arg) => {
        const [index, item] = arg as [number, number];
        return observe(() => impl.set(index, item));
      },
      onModel: (model, arg) => {
        const [index, item] = arg as [number, number];
        if (!inRange(model, index)) return OUT_OF_RANGE;
        model[index] = item;
        return undefined;
      },
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.length,
    },
  ],

  edges: [
    {
      name: "빈 수열에서 pop · get 은 null, set 은 RangeError 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "pop" },
        { op: "get", arg: 0 },
        { op: "set", arg: [0, 1] },
        { op: "size" },
        { op: "get", arg: 0 },
      ],
    },
    {
      // 경계가 `[0, n)` 이므로 n 과 n - 1 을 함께 짚는다(`docs/ORD-006-conventions.md` 「경계가
      // `[0, n]` 인 인자는 경계 케이스가 `n` 을 짚는다」의 반열린 판).
      name: "넣은 차례가 첨자이고 -1 · size() · 정수가 아닌 첨자는 get 이 null 이다",
      steps: [
        { op: "push", arg: 10 },
        { op: "push", arg: 20 },
        { op: "push", arg: 30 },
        { op: "get", arg: 0 },
        { op: "get", arg: 2 },
        { op: "get", arg: 3 },
        { op: "get", arg: -1 },
        { op: "get", arg: 1.5 },
        { op: "get", arg: 1 },
        { op: "size" },
      ],
    },
    {
      name: "set 은 그 첨자 하나만 바꾸고 범위 밖이면 RangeError 이며 아무것도 바꾸지 않는다",
      steps: [
        { op: "push", arg: 1 },
        { op: "push", arg: 2 },
        { op: "push", arg: 3 },
        { op: "set", arg: [1, 9] },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "set", arg: [3, 5] },
        { op: "set", arg: [-1, 5] },
        { op: "set", arg: [0.5, 5] },
        { op: "size" },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "set", arg: [2, 7] },
        { op: "pop" },
      ],
    },
    {
      name: "비울 때까지 빼고 다시 넣으면 첨자가 0 부터 다시 매겨진다",
      steps: [
        { op: "push", arg: 1 },
        { op: "pop" },
        { op: "pop" },
        { op: "push", arg: 2 },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
        { op: "size" },
      ],
    },
    {
      // 칸을 늘리거나 줄이며 옮겨 담는 구현이 옮기다 칸 하나를 빠뜨리면 여기서 갈린다.
      name: "여러 번 늘었다 줄어도 남은 원소와 첨자가 그대로다",
      steps: [
        { op: "push", arg: 1 },
        { op: "push", arg: 2 },
        { op: "push", arg: 3 },
        { op: "push", arg: 4 },
        { op: "push", arg: 5 },
        { op: "push", arg: 6 },
        { op: "push", arg: 7 },
        { op: "push", arg: 8 },
        { op: "push", arg: 9 },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "get", arg: 3 },
        { op: "get", arg: 4 },
        { op: "get", arg: 5 },
        { op: "get", arg: 6 },
        { op: "get", arg: 7 },
        { op: "get", arg: 8 },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
        { op: "pop" },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "size" },
        { op: "push", arg: 10 },
        { op: "get", arg: 0 },
        { op: "get", arg: 1 },
        { op: "get", arg: 2 },
        { op: "size" },
      ],
    },
  ],

  // 헤더 불변식 절이 비었다 — 늘어놓기를 빼서 두 불변식의 한쪽 경로가 사라졌다(`basic`).
  invariants: [],

  scenarios: [
    {
      // 상각이므로 n 회 측정한다(§규약2 시나리오 규칙 4). 칸을 일정한 수씩만 늘리며 매번 옮기는
      // 구현이 여기서 걸린다.
      covers: ["push"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.push(i));
      },
    },
    {
      // 채우고 전부 뺀다. 뒤 끝의 앞 원소를 앞에서부터 찾는 사슬이 여기서 걸린다.
      covers: ["pop"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.pop());
      },
    },
    {
      // **경계에서 넣고 빼기를 번갈아 한다.** 파일 머리의 적대적 시나리오 설명 참고. 넣기 n 번과
      // 빼기 n 번을 번갈아 재므로 측정이 2n 회다.
      covers: ["push", "pop"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) {
          ctx.step(() => impl.push(i));
          ctx.step(() => impl.pop());
        }
      },
    },
    {
      // 모든 첨자를 한 번씩 읽는다. 한 호출 최대가 통계이므로 뒤 끝 가까운 첨자가 앞에서부터 세는
      // 구현을 드러낸다.
      covers: ["get"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.get(i));
      },
    },
    {
      covers: ["set"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.set(i, -i));
      },
    },
    {
      covers: ["size"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.push(i);
        for (let i = 0; i < 8; i++) ctx.step(() => impl.size());
      },
    },
  ],
};
