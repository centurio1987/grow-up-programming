/**
 * `disjoint-set/unionFind` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./unionFind.ts` 헤더 한 곳이고(규약1), 여기 있는
 * 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** `runContract` 는 인자 없는 팩토리를 받는데 이 구조는
 * **원소 수를 생성자로 받는다.** 축1은 원소 수 하나(48)에서 돌면 되지만 축3은 원소 수를 사다리에 올려야
 * 하므로, 껍데기가 `reset(n)` 으로 그 크기의 구조를 다시 세우고 버린 구조의 비용을 이어서 센다.
 * `reset` 은 시나리오의 준비 작업이라 걸음에 안 들어간다. 껍데기는 계약의 일부가 아니다.
 *
 * **범위 밖 인자를 관측값으로 만든다**(`tree/linkCutTree` · `heap/vanEmdeBoasTree` 와 같다). 계약이 원소
 * 번호와 원소 수의 범위 밖에 `RangeError` 를 적었는데 하네스는 던진 것을 값으로 대조하지 못한다. 양쪽을
 * 같은 방식으로 감싸 문자열 하나로 바꾸고, `RangeError` 가 아닌 예외는 그대로 올려보낸다(스텁의
 * `Not implemented` 가 통과로 읽히면 안 된다). 무작위 시퀀스의 원소 번호는 양 끝에서 둘씩 범위를 넘친다.
 *
 * **생성자 행을 축1이 재는 자리가 `reset` 연산이다**(불변 사실 304). 무작위 시퀀스는 `reset` 에 **거절될
 * 원소 수만** 뽑는다. 받아들이는 자리(원소 0 개 · 1 개)는 경계 케이스가 짚는다.
 *
 * **원소 수 48 은 합치기가 한 집합으로 몰리는 속도에 맞춘 값이다.** 이 계약에는 가르는 연산이 없어
 * 무작위 합치기가 쌓이면 전부 한 집합이 되고, 그 뒤로는 `find` 가 0 만 돌려준다. 원소가 적으면 시퀀스
 * 앞머리에서 그렇게 된다.
 *
 * **축3의 사다리는 원소 수 n 을 오르고, 시나리오의 bound 는 전부 `O(1)` 이다**(헤더 「연산 계약」 ·
 * `docs/ORD-006-conventions.md` 「`unionFind` 의 Bound 는 늘리지 않는다」). 표의 상한은
 * $O(\alpha(n))$ 인데 사다리 세 점에서 역아커만 함수가 같은 값이라 `O(1)` 과 같은 계급으로 판정한다.
 * 그러므로 이 스위트가 판정하는 것은 **「원소 수의 어떤 거듭제곱보다도 느리게 자란다」**이고, 로그 인수만큼
 * 어기는 계열(길을 줄이지 않고 높이로 거는 숲 · 작은 쪽 번호표를 다시 적는 구현)은 통과한다(불변 사실 53·62).
 *
 * **시나리오 셋이 겨누는 것.**
 *
 * | 시나리오 | 걸리는 계열 | 정본에게 시키는 일 |
 * |---|---|---|
 * | 합치기 (적대적) | 거는 방향이 인자 순서로 정해지는 숲 두 방향 · 앞 인자 쪽 번호표를 다시 적는 구현 | 홀로인 원소를 큰 집합에 붙이기 — 나무가 별 모양이라 길 줄이기가 하는 일이 없다 |
 * | 찾기·묻기 (적대적) | 거는 방향이 인자 순서로 정해지는 숲 두 방향 | 별 모양 나무에서 묻기 |
 * | 섞기 (무작위) | 위 셋 전부 | **길 줄이기가 실제로 일하는 유일한 자리다** — 무작위 합치기가 깊이 둘 이상의 나무를 만든다 |
 *
 * **섞기가 적대적 둘이 잡는 계열을 전부 잡는데도 적대적 둘을 둔다.** 섞기는 세 행을 한 걸음에 묶어 어느 행이
 * 걸렸는지 말하지 못한다. 적대적 둘은 행을 갈라 번호표 구현이 합치기에서만, 숲이 두 행 다에서 걸린다는 것을
 * 보인다(불변 사실 84 — 걸리는 행을 행 단위로 적는다). 섞기를 두는 근거는 잡는 fixture 가 아니라 정본의
 * 일이다(§「약한 한정자의 근거를 정본에서 재되 …」의 딸린 규칙 — 적대적 시나리오가 정본에게 그 행의 일을 한
 * 번도 안 시킬 수 있다).
 *
 * **셋 다 `amortized` 라 n 회를 잰다**(§규약2 시나리오 규칙 4).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **세 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface UnionFindContract {
  find(x: number): number;
  union(x: number, y: number): void;
  connected(x: number, y: number): boolean;
}

type Built = UnionFindContract & { __cost?: number };

/** 축1이 도는 원소 수(파일 머리말). */
export const ELEMENTS = 48;

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

/** 하네스용 껍데기. `reset(n)` 으로 그 크기의 구조를 다시 세운다. */
export class PartitionSite implements UnionFindContract {
  readonly #make: (n: number) => Built;
  #impl: Built;
  #carried = 0;

  constructor(make: (n: number) => Built) {
    this.#make = make;
    this.#impl = make(ELEMENTS);
  }

  get __cost(): number {
    return this.#carried + (this.#impl.__cost ?? 0);
  }

  /** 새 구조를 세운다. 생성자가 던지면 앞의 구조가 그대로 남는다. */
  reset(n: number): void {
    const next = this.#make(n);
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = next;
  }

  find(x: number): number {
    return this.#impl.find(x);
  }

  union(x: number, y: number): void {
    this.#impl.union(x, y);
  }

  connected(x: number, y: number): boolean {
    return this.#impl.connected(x, y);
  }
}

/**
 * 축1 참조 모델. 원소마다 「그 집합의 가장 작은 원소」를 적어 두고 합칠 때 한쪽을 전부 다시 적는다 —
 * 축1은 의미만 보므로 자명한 구현으로 충분하다. 같은 모양이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/relabelingPartition.ts`).
 */
interface Model {
  smallest: number[];
}

function inRange(model: Model, x: number): boolean {
  return Number.isInteger(x) && x >= 0 && x < model.smallest.length;
}

function validSize(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

function modelUnion(model: Model, x: number, y: number): string | undefined {
  if (!inRange(model, x) || !inRange(model, y)) return OUT_OF_RANGE;
  const left = model.smallest[x] as number;
  const right = model.smallest[y] as number;
  if (left === right) return undefined;
  const kept = Math.min(left, right);
  const dropped = Math.max(left, right);
  for (let at = 0; at < model.smallest.length; at++) {
    if (model.smallest[at] === dropped) model.smallest[at] = kept;
  }
  return undefined;
}

/** 무작위 원소 번호. 양 끝에서 둘씩 범위를 넘친다 — 거절 경로를 무작위 시퀀스에서도 짚는다. */
function element(rng: () => number): number {
  return Math.floor(rng() * (ELEMENTS + 4)) - 2;
}

function pair(rng: () => number): [number, number] {
  return [element(rng), element(rng)];
}

/** 무작위 시퀀스가 `reset` 에 넘기는 값. 전부 거절된다(파일 머리말). */
const REJECTED_SIZES = [-1, 2.5] as const;

export const unionFindContract: ContractSpec<PartitionSite, Model> = {
  name: "UnionFind",
  grade: "complexity",
  model: () => ({
    smallest: Array.from({ length: ELEMENTS }, (_, at) => at),
  }),

  ops: [
    {
      name: "find",
      arg: element,
      onImpl: (impl, arg) => observe(() => impl.find(arg as number)),
      onModel: (model, arg) => {
        const x = arg as number;
        if (!inRange(model, x)) return OUT_OF_RANGE;
        return model.smallest[x] as number;
      },
    },
    {
      name: "union",
      arg: pair,
      onImpl: (impl, arg) => {
        const [x, y] = arg as [number, number];
        return observe(() => impl.union(x, y));
      },
      onModel: (model, arg) => {
        const [x, y] = arg as [number, number];
        return modelUnion(model, x, y);
      },
    },
    {
      name: "connected",
      arg: pair,
      onImpl: (impl, arg) => {
        const [x, y] = arg as [number, number];
        return observe(() => impl.connected(x, y));
      },
      onModel: (model, arg) => {
        const [x, y] = arg as [number, number];
        if (!inRange(model, x) || !inRange(model, y)) return OUT_OF_RANGE;
        return model.smallest[x] === model.smallest[y];
      },
    },
    {
      name: "reset",
      arg: (rng) => REJECTED_SIZES[Math.floor(rng() * REJECTED_SIZES.length)],
      onImpl: (impl, arg) => observe(() => impl.reset(arg as number)),
      onModel: (model, arg) => {
        const n = arg as number;
        if (!validSize(n)) return OUT_OF_RANGE;
        model.smallest = Array.from({ length: n }, (_, at) => at);
        return undefined;
      },
    },
  ],

  edges: [
    {
      name: "처음에는 원소마다 홀로이고 이름표가 자기 자신이다",
      steps: [
        { op: "find", arg: 0 },
        { op: "find", arg: 5 },
        { op: "find", arg: ELEMENTS - 1 },
        { op: "connected", arg: [0, 1] },
        { op: "connected", arg: [3, 3] },
      ],
    },
    {
      // 이름표는 합친 순서와 무관하게 그 집합의 가장 작은 원소다. 뿌리를 그대로 돌려주는 숲이 여기서
      // 갈린다 — 실측: 앞 인자 쪽 뿌리를 뒤 쪽 아래에 걸면 다섯째 걸음 `find(9)` 에서 9 / 2, 반대로 걸거나 크기로
      // 걸면 둘째 걸음 `find(5)` 에서 5 / 2.
      name: "합치면 이름표가 합친 집합의 가장 작은 원소가 된다",
      steps: [
        { op: "union", arg: [5, 2] },
        { op: "find", arg: 5 },
        { op: "find", arg: 2 },
        { op: "union", arg: [2, 9] },
        { op: "find", arg: 9 },
        { op: "connected", arg: [5, 9] },
        { op: "union", arg: [9, 1] },
        { op: "find", arg: 5 },
        { op: "find", arg: 1 },
        { op: "union", arg: [30, 31] },
        { op: "union", arg: [30, 1] },
        { op: "find", arg: 31 },
      ],
    },
    {
      name: "이미 같은 집합인 둘을 합쳐도 아무것도 바뀌지 않는다",
      steps: [
        { op: "union", arg: [3, 4] },
        { op: "union", arg: [4, 3] },
        { op: "union", arg: [3, 3] },
        { op: "find", arg: 4 },
        { op: "connected", arg: [3, 4] },
        { op: "find", arg: 5 },
        { op: "connected", arg: [3, 5] },
      ],
    },
    {
      // 합치기에 끼지 않은 집합의 이름표는 그대로다. 그리고 한 번 같은 집합이 된 둘은 계속 같은 집합이다.
      name: "합치기에 끼지 않은 집합은 이름표가 그대로이고, 합친 것은 되돌려지지 않는다",
      steps: [
        { op: "union", arg: [7, 8] },
        { op: "union", arg: [10, 11] },
        { op: "find", arg: 8 },
        { op: "find", arg: 11 },
        { op: "union", arg: [8, 11] },
        { op: "find", arg: 11 },
        { op: "find", arg: 10 },
        { op: "union", arg: [20, 21] },
        { op: "find", arg: 21 },
        { op: "connected", arg: [7, 10] },
        { op: "find", arg: 0 },
      ],
    },
    {
      // 큰 집합 둘을 합칠 때 가장 작은 원소가 어느 쪽에 있든 그것이 이름표다.
      name: "큰 집합 둘을 합치면 어느 쪽에 있든 가장 작은 원소가 이름표다",
      steps: [
        { op: "union", arg: [20, 21] },
        { op: "union", arg: [21, 3] },
        { op: "union", arg: [11, 12] },
        { op: "union", arg: [12, 10] },
        { op: "union", arg: [10, 13] },
        { op: "find", arg: 13 },
        { op: "find", arg: 20 },
        { op: "union", arg: [13, 21] },
        { op: "find", arg: 12 },
        { op: "find", arg: 10 },
        { op: "connected", arg: [11, 3] },
      ],
    },
    {
      name: "범위 밖 원소는 세 연산 모두 RangeError 이고 상태가 바뀌지 않는다",
      steps: [
        { op: "union", arg: [1, 2] },
        { op: "union", arg: [-1, 2] },
        { op: "union", arg: [2, ELEMENTS] },
        { op: "union", arg: [2.5, 1] },
        { op: "find", arg: ELEMENTS },
        { op: "find", arg: -1 },
        { op: "find", arg: 1.5 },
        { op: "connected", arg: [0, ELEMENTS] },
        { op: "connected", arg: [-2, 1] },
        { op: "find", arg: 2 },
        { op: "connected", arg: [1, 2] },
        { op: "find", arg: 0 },
      ],
    },
    {
      name: "원소 수가 0 이상의 정수가 아니면 RangeError 이고 앞의 구조가 남는다",
      steps: [
        { op: "union", arg: [0, 1] },
        { op: "reset", arg: -1 },
        { op: "reset", arg: 2.5 },
        { op: "connected", arg: [0, 1] },
        { op: "find", arg: ELEMENTS - 1 },
      ],
    },
    {
      name: "원소가 0 개면 어떤 원소 번호도 RangeError 다",
      steps: [
        { op: "reset", arg: 0 },
        { op: "find", arg: 0 },
        { op: "connected", arg: [0, 0] },
        { op: "union", arg: [0, 0] },
      ],
    },
    {
      name: "원소가 1 개면 원소 0 하나가 홀로 선다",
      steps: [
        { op: "reset", arg: 1 },
        { op: "find", arg: 0 },
        { op: "connected", arg: [0, 0] },
        { op: "union", arg: [0, 0] },
        { op: "find", arg: 0 },
        { op: "find", arg: 1 },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 관측 경로가 둘인 정합(같은 집합인가 ↔ 이름표가 같은가)을 `connected`
  // 행이 이미 적고 있어 그 연산의 의미이고, 나머지 후보는 경로가 하나거나 시간에 걸친 성질이다.
  invariants: [],

  scenarios: [
    {
      covers: ["union"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      // **원소를 반으로 나눠, 앞 절반은 큰 집합을 앞 인자로 · 뒤 절반은 큰 집합을 뒤 인자로 넘기며
      // 홀로인 원소를 하나씩 붙인다.** 두 쪽을 번갈아 부른다. 거는 방향이 인자 순서로 정해지는 숲은 어느
      // 방향이든 한쪽 절반에 사슬이 서서 그 절반의 뿌리를 찾는 일이 붙인 수에 비례한다
      // (`_contract/_fixtures/linkingPartition.ts` 의 `underSecond`·`underFirst`). 앞 인자 쪽 번호표를 다시
      // 적는 구현은 앞 절반에서 호출마다 그 집합 전부를 다시 적는다(`_contract/_fixtures/relabelingPartition.ts`
      // 의 `first`). 작은 쪽을 거는 정본은 나무가 별 모양이다. 마지막 두 걸음은 이미 같은 집합인 둘을 합쳐
      // 걸음 수를 n 에 맞춘다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        const half = n / 2;
        for (let i = 1; i < half; i++) {
          ctx.step(() => impl.union(0, i));
          ctx.step(() => impl.union(half + i, half));
        }
        ctx.step(() => impl.union(half - 1, 0));
        ctx.step(() => impl.union(half, n - 1));
      },
    },
    {
      covers: ["find", "connected"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      // **위와 같은 두 절반을 준비로 세운 뒤, 무작위 원소의 이름표와 무작위 두 원소의 같은 집합 여부를 n 번
      // 묻는다.** 거는 방향이 인자 순서로 정해지는 숲은 한쪽 절반이 사슬이라 그 절반에서 묻는 호출이 사슬
      // 길이에 비례한다. 번호표 구현은 묻기가 상수라 여기를 통과한다 — 걸리는 자리가 합치기라서다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        const half = n / 2;
        for (let i = 1; i < half; i++) {
          impl.union(0, i);
          impl.union(half + i, half);
        }
        for (let step = 0; step < n; step++) {
          const x = Math.floor(ctx.rng() * n);
          const y = Math.floor(ctx.rng() * n);
          ctx.step(() => {
            impl.find(x);
            impl.connected(x, y);
          });
        }
      },
    },
    {
      covers: ["union", "find", "connected"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      // **한 걸음에 무작위 두 원소를 합치고 · 무작위 원소의 이름표를 묻고 · 무작위 두 원소를 묻는다. n 걸음.**
      // 합치기가 n 번이라 절반쯤 지나면 원소 대부분을 담는 집합 하나가 서고, 앞 인자 쪽 번호표를 다시 적는
      // 구현이 그 집합을 거듭 다시 적어 걸린다. 정본에게는 **길 줄이기가 일하는 유일한 자리다**(파일 머리말).
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let step = 0; step < n; step++) {
          const x = Math.floor(ctx.rng() * n);
          const y = Math.floor(ctx.rng() * n);
          const z = Math.floor(ctx.rng() * n);
          ctx.step(() => {
            impl.union(x, y);
            impl.find(z);
            impl.connected(x, z);
          });
        }
      },
    },
  ],
};
