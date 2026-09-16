/**
 * `disjoint-set/disjointSetRollback` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./disjointSetRollback.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 원소 수를 생성자로 받는 구조라 `unionFind` 와 같은 이유로
 * `reset(n)` 이 그 크기의 구조를 다시 세우고 버린 구조의 비용을 이어서 센다. 껍데기는 계약의 일부가 아니다.
 * 범위 밖 인자를 문자열 하나로 바꾸는 것도, 무작위 시퀀스가 `reset` 에 거절될 원소 수만 넘기는 것도
 * `../unionFind/unionFind.contract.ts` 머리말 그대로다.
 *
 * **`unionFind` 에서 가져온 것 — 경계 케이스 아홉.** 그 케이스들이 부르는 연산(`find`·`union`·`connected`·
 * `reset`)의 의미가 되돌리기 몫을 빼고 두 계약에서 같으므로 **같은 객체**를 펼쳐 넣는다
 * (`docs/ORD-006-conventions.md` 「연산 집합이 다른 이웃에게서는 스위트 항목을 따로 판정해 가져온다」). 저쪽
 * 케이스가 움직이면 이 스위트가 따라 움직이고 헤더는 따라가지 않는다. `model`·`ops` 는 되돌리기 기록을 들어야 해
 * 따로 적었고, **시나리오는 하나도 가져오지 않았다** — 표의 상한이 저쪽 $O(\alpha(n))$(판정 `O(1)`)과 이쪽
 * `O(log n)` 으로 갈려 bound 문자열이 다르다.
 *
 * **축3의 사다리는 원소 수 n 을 오르고, 시나리오의 bound 는 표의 상한 그대로다** — 찾기·합치기·묻기가 든
 * 시나리오는 `O(log n)`, 되돌리기만 재는 시나리오는 `O(1)`. 되돌리기를 합치기·묻기와 한 호출열에 섞어 재는
 * 시나리오는 셋 중 느슨한 `O(log n)` 으로 판정한다(헤더 「연산 계약」).
 *
 * **시나리오 다섯이 겨누는 것.**
 *
 * | 시나리오 | 걸리는 계열 | 정본에게 시키는 일 |
 * |---|---|---|
 * | 합치기 (적대적) | 인자 순서로 거는 숲 두 방향(줄이기 끔) · 앞 인자 쪽 번호표를 다시 적는 구현 | 홀로인 원소를 큰 집합에 붙이기 |
 * | 찾기·묻기 (적대적) | 인자 순서로 거는 숲 두 방향(줄이기 끔) | 별 모양 나무에서 묻기 |
 * | 섞기 (무작위) | 위 셋 | 무작위로 합친 나무에서 찾기 — 앞의 둘은 나무가 별 모양이다 |
 * | **되돌린 뒤 같은 합치기 거듭하기 (적대적)** | 위 셋 + **인자 순서로 거는 숲 두 방향(줄이기 켬) · 작은 쪽 번호표를 다시 적는 구현 · 되돌릴 때 처음부터 다시 합치는 구현** | 크기가 같은 두 집합을 합치고 묻고 되돌리기 |
 * | 되돌리기 (적대적) | 앞 인자 쪽 번호표를 다시 적는 구현 · 되돌릴 때 처음부터 다시 합치는 구현 | 쌓인 합치기를 전부 되돌리기 |
 *
 * **넷째가 이 계약의 시나리오다.** 앞의 셋은 `unionFind` 스위트와 같은 입력이고, 굵게 적은 계열 넷은 그 셋을
 * 전부 통과한다 — 상각 논증(줄이기 · 두 배 논증 · 안쪽 정본의 상각)이 되돌리기가 없는 호출열에서는 서기
 * 때문이다. 넷째는 **마지막 합치기를 되돌린 뒤 같은 합치기를 다시 하는 일을 n 번** 되풀이해, 되돌리기가 그
 * 논증이 쌓아 둔 것을 무르게 한다. 되돌리기가 상각을 깨뜨리는지를 이 시나리오가 판정한다(헤더 「연산 계약」).
 *
 * **다섯 다 `amortized` 라 n 회 이상을 잰다**(§규약2 시나리오 규칙 4).
 */

import type { ContractSpec } from "../../_contract/runContract";
import { unionFindContract } from "../unionFind/unionFind.contract";

/** 헤더 연산 계약 표의 **네 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface DisjointSetRollbackContract {
  find(x: number): number;
  union(x: number, y: number): void;
  connected(x: number, y: number): boolean;
  rollback(): boolean;
}

type Built = DisjointSetRollbackContract & { __cost?: number };

/** 축1이 도는 원소 수. 가져온 경계 케이스가 이 값을 쓴다(`unionFind.contract.ts` 의 `ELEMENTS`). */
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
export class RollbackSite implements DisjointSetRollbackContract {
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

  rollback(): boolean {
    return this.#impl.rollback();
  }
}

/**
 * 축1 참조 모델. 원소마다 「그 집합의 가장 작은 원소」를 적어 두고, 합치기 **호출마다** 그 표 전체의
 * 사본을 쌓는다 — 되돌리기는 사본 하나를 꺼내 되돌린다. 축1은 의미만 보므로 자명한 구현으로 충분하다.
 */
interface Model {
  smallest: number[];
  history: number[][];
}

function inRange(model: Model, x: number): boolean {
  return Number.isInteger(x) && x >= 0 && x < model.smallest.length;
}

function validSize(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

function freshModel(n: number): Model {
  return { smallest: Array.from({ length: n }, (_, at) => at), history: [] };
}

function modelUnion(model: Model, x: number, y: number): string | undefined {
  if (!inRange(model, x) || !inRange(model, y)) return OUT_OF_RANGE;
  model.history.push([...model.smallest]);
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

/** 무작위 시퀀스가 `reset` 에 넘기는 값. 전부 거절된다. */
const REJECTED_SIZES = [-1, 2.5] as const;

/**
 * 짝지어 두 배씩 합친다 — 크기 1 끼리, 2 끼리, 4 끼리 …. 합치기 호출은 `n - 1` 번이다. 시나리오의 준비로
 * 쓰지 않고 하네스 자기시험이 쓴다.
 */
export function mergeByDoubling(
  impl: Pick<DisjointSetRollbackContract, "union">,
  n: number,
): void {
  for (let width = 1; width < n; width *= 2) {
    for (let at = 0; at + width < n; at += 2 * width) {
      impl.union(at, at + width);
    }
  }
}

/**
 * 원소를 반으로 나눠 앞 절반은 큰 집합을 앞 인자로 · 뒤 절반은 뒤 인자로 넘기며 홀로인 원소를 하나씩
 * 붙인다 — `unionFind` 합치기 시나리오의 준비와 같다. 거는 방향이 인자 순서로 정해지는 숲은 어느 방향이든 한쪽
 * 절반에 사슬이 선다. `measure` 가 주어지면 합치기 호출 하나하나를 잰다.
 */
function buildMirroredHalves(
  impl: RollbackSite,
  n: number,
  measure?: (call: () => void) => void,
): void {
  const run = measure ?? ((call: () => void) => call());
  const half = n / 2;
  for (let i = 1; i < half; i++) {
    run(() => impl.union(0, i));
    run(() => impl.union(half + i, half));
  }
}

export const disjointSetRollbackContract: ContractSpec<RollbackSite, Model> = {
  name: "DisjointSetRollback",
  grade: "complexity",
  model: () => freshModel(ELEMENTS),

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
      name: "rollback",
      arg: () => undefined,
      onImpl: (impl) => impl.rollback(),
      onModel: (model) => {
        const previous = model.history.pop();
        if (previous === undefined) return false;
        model.smallest = previous;
        return true;
      },
    },
    {
      name: "reset",
      arg: (rng) => REJECTED_SIZES[Math.floor(rng() * REJECTED_SIZES.length)],
      onImpl: (impl, arg) => observe(() => impl.reset(arg as number)),
      onModel: (model, arg) => {
        const n = arg as number;
        if (!validSize(n)) return OUT_OF_RANGE;
        const fresh = freshModel(n);
        model.smallest = fresh.smallest;
        model.history = fresh.history;
        return undefined;
      },
    },
  ],

  edges: [
    ...unionFindContract.edges,
    {
      // 되돌리기는 **마지막 합치기 호출**부터 하나씩 되돌리고, 되돌린 뒤의 이름표는 그 호출 전의 가장 작은
      // 원소다.
      name: "되돌리기는 나중 합치기부터 하나씩 되돌리고 이름표도 그 전으로 돌아간다",
      steps: [
        { op: "union", arg: [7, 9] },
        { op: "union", arg: [9, 3] },
        { op: "union", arg: [12, 9] },
        { op: "find", arg: 12 },
        { op: "find", arg: 7 },
        { op: "rollback" },
        { op: "find", arg: 12 },
        { op: "find", arg: 7 },
        { op: "rollback" },
        { op: "find", arg: 7 },
        { op: "find", arg: 9 },
        { op: "find", arg: 3 },
        { op: "connected", arg: [3, 9] },
        { op: "rollback" },
        { op: "connected", arg: [7, 9] },
        { op: "find", arg: 9 },
      ],
    },
    {
      // 이미 같은 집합이라 아무것도 안 바꾼 합치기 호출도 되돌릴 합치기 하나다. 합친 일만 세는 구현은 셋째
      // 걸음 뒤 `connected(4, 5)` 에서 갈린다.
      name: "아무것도 안 바꾼 합치기 호출도 되돌릴 합치기 하나로 친다",
      steps: [
        { op: "union", arg: [4, 5] },
        { op: "union", arg: [5, 4] },
        { op: "rollback" },
        { op: "connected", arg: [4, 5] },
        { op: "union", arg: [6, 6] },
        { op: "rollback" },
        { op: "connected", arg: [4, 5] },
        { op: "rollback" },
        { op: "connected", arg: [4, 5] },
        { op: "rollback" },
      ],
    },
    {
      name: "되돌릴 합치기가 없으면 false 이고 상태가 바뀌지 않는다",
      steps: [
        { op: "rollback" },
        { op: "find", arg: 0 },
        { op: "union", arg: [0, 1] },
        { op: "rollback" },
        { op: "rollback" },
        { op: "find", arg: 1 },
        { op: "connected", arg: [0, 1] },
      ],
    },
    {
      // 되돌리기와 합치기를 섞어도 되돌리는 것은 **아직 안 되돌린 호출 중 마지막 것**이다.
      name: "되돌린 뒤 다시 합치면 그 새 호출이 먼저 되돌려진다",
      steps: [
        { op: "union", arg: [0, 1] },
        { op: "union", arg: [2, 3] },
        { op: "rollback" },
        { op: "union", arg: [4, 5] },
        { op: "connected", arg: [2, 3] },
        { op: "connected", arg: [4, 5] },
        { op: "rollback" },
        { op: "connected", arg: [4, 5] },
        { op: "connected", arg: [0, 1] },
        { op: "rollback" },
        { op: "connected", arg: [0, 1] },
        { op: "rollback" },
      ],
    },
    {
      // 스냅숏·되살리기 연산이 계약에 없는 이유의 실물이다(헤더 「목적」). 호출자가 합치기 호출 수를 세어
      // 두었다가 그만큼 되돌리면 그 시점의 분할로 돌아간다 — 셋 중 하나는 아무것도 안 바꾼 호출이다.
      name: "호출자가 센 합치기 호출 수만큼 되돌리면 그 시점의 분할로 돌아간다",
      steps: [
        { op: "union", arg: [0, 1] },
        { op: "union", arg: [1, 2] },
        { op: "union", arg: [0, 2] },
        { op: "union", arg: [3, 4] },
        { op: "find", arg: 2 },
        { op: "rollback" },
        { op: "rollback" },
        { op: "rollback" },
        { op: "connected", arg: [0, 1] },
        { op: "connected", arg: [1, 2] },
        { op: "connected", arg: [3, 4] },
        { op: "find", arg: 2 },
      ],
    },
    {
      // 던진 합치기 호출은 상태를 안 바꾸므로 되돌릴 합치기로 쌓이지도 않는다.
      name: "범위 밖 원소로 던진 합치기는 되돌릴 합치기로 치지 않는다",
      steps: [
        { op: "union", arg: [0, 1] },
        { op: "union", arg: [-1, 2] },
        { op: "union", arg: [2, ELEMENTS] },
        { op: "rollback" },
        { op: "connected", arg: [0, 1] },
        { op: "rollback" },
      ],
    },
    {
      // 원소 수를 다시 정하면 새 구조이고 되돌릴 합치기가 없다. 거절된 `reset` 은 앞의 구조와 그 기록을 남긴다.
      name: "원소 수를 다시 정하면 되돌릴 합치기도 비고, 거절되면 기록이 남는다",
      steps: [
        { op: "union", arg: [0, 1] },
        { op: "reset", arg: -1 },
        { op: "rollback" },
        { op: "connected", arg: [0, 1] },
        { op: "union", arg: [2, 3] },
        { op: "reset", arg: 6 },
        { op: "rollback" },
        { op: "find", arg: 3 },
        { op: "union", arg: [5, 0] },
        { op: "find", arg: 5 },
        { op: "rollback" },
        { op: "find", arg: 5 },
        { op: "rollback" },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. `unionFind` 의 후보 넷에 되돌리기 몫 둘이 더해졌는데, 둘 다 시간에 걸친
  // 성질이거나 읽는 경로가 `rollback` 하나다.
  invariants: [],

  scenarios: [
    {
      covers: ["union"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **`unionFind` 합치기 시나리오와 같은 입력이다.** 앞 절반은 큰 집합을 앞 인자로, 뒤 절반은 뒤 인자로
      // 넘기며 번갈아 붙인다(`buildMirroredHalves`). 마지막 두 걸음은 이미 같은 집합인 둘을 합쳐 걸음 수를 n 에
      // 맞춘다 — 그 두 호출도 되돌릴 합치기로 쌓인다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        buildMirroredHalves(impl, n, (call) => ctx.step(call));
        ctx.step(() => impl.union(n / 2 - 1, 0));
        ctx.step(() => impl.union(n / 2, n - 1));
      },
    },
    {
      covers: ["find", "connected"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **위와 같은 두 절반을 준비로 세운 뒤 무작위 원소의 이름표와 무작위 두 원소를 n 번 묻는다**(`unionFind`
      // 찾기·묻기 시나리오와 같다). 인자 순서로 거는 숲은 줄이기가 없으면 한쪽 절반의 사슬을 묻는 호출마다 훑는다.
      // 줄이는 숲은 사슬을 한 번 훑고 펴 두어 통과한다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        buildMirroredHalves(impl, n);
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
      bound: "O(log n)",
      adversarial: false,
      // **한 걸음에 무작위 두 원소를 합치고 · 무작위 원소의 이름표를 묻고 · 무작위 두 원소를 묻는다. n 걸음**
      // (`unionFind` 섞기 시나리오와 같다). 앞 인자 쪽 번호표를 다시 적는 구현이 절반쯤 지나 선 큰 집합을 거듭
      // 다시 적어 걸린다. 정본에게는 **무작위로 합친 나무를 오르는 유일한 자리**다 — 앞의 두 시나리오에서는 나무가
      // 별 모양이다. 크기로 걸면 무작위 합치기의 나무가 낮아 정본의 걸음은 7.35 · 7.65 · 7.64 에 머문다(한 호출이
      // 로그만큼 걷는 입력은 하네스 자기시험의 짝지어 두 배씩 합치기다).
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
    {
      covers: ["union", "connected", "rollback"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **되돌린 뒤 같은 합치기를 거듭한다.** 두 절반을 세우고 두 절반을 합친 뒤(`union(n/2 - 1, n - 1)`), n 번
      // 되풀이한다 — 앞 절반에서 둘째로 붙인 원소와 뒤 절반에서 둘째로 붙인 원소가 같은 집합인지 묻고, 마지막
      // 합치기를 되돌리고, 같은 합치기를 다시 한다. 세 호출을 따로 잰다.
      //
      // - **두 절반을 합치는 호출은 두 절반의 뿌리 가까이에 있는 원소 둘로 부른다.** 인자 순서로 거는 숲은 방향이
      //   어느 쪽이든 두 원소가 뿌리이거나 뿌리 바로 아래라, 다시 하는 합치기가 사슬을 훑지 않는다 — 그래서 줄이는
      //   숲의 줄이기가 앞 호출 몫으로 가라앉지 않는다(`_contract/_fixtures/loggingForest.ts` 머리말).
      // - **묻는 두 원소는 사슬의 바닥 가까이에 있다.** 방향이 어느 쪽이든 둘 중 하나가 절반 깊이다. 줄이는 숲은
      //   그 길을 펴지만 편 기록이 마지막 합치기 뒤에 쌓여 다음 되돌리기가 함께 무른다.
      // - **크기가 같은 두 집합을 합치고 되돌리므로** 작은 쪽을 다시 적는 구현이 호출마다 절반을 옮기고 되옮긴다.
      // - 되돌릴 때 처음부터 다시 합치는 구현은 되돌리기마다 원소 수만큼 다시 세운다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        const half = n / 2;
        buildMirroredHalves(impl, n);
        impl.union(half - 1, n - 1);
        for (let step = 0; step < n; step++) {
          ctx.step(() => void impl.connected(1, half + 1));
          ctx.step(() => void impl.rollback());
          ctx.step(() => impl.union(half - 1, n - 1));
        }
      },
    },
    {
      covers: ["rollback"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      // **두 절반을 세운 뒤 n 번 되돌린다** — 쌓인 합치기 호출이 `n - 2` 개라 마지막 둘은 `false` 다. 되돌리기
      // 행만 재는 자리다(불변 사실 84 — 걸리는 행을 행 단위로 적는다). 앞 인자 쪽 번호표를 다시 적는 구현은
      // 준비에서 큰 집합을 호출마다 옮겨 두었으므로 되돌릴 때도 호출마다 되옮긴다. 처음부터 다시 합치는 구현은
      // 남은 합치기 수에 비례한다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        buildMirroredHalves(impl, n);
        for (let step = 0; step < n; step++) {
          ctx.step(() => void impl.rollback());
        }
      },
    },
  ],
};
