/**
 * `heap/priorityQueue` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./priorityQueue.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **행마다 시나리오가 둘인 것이 이 스위트의 요점이다.** 적대성은 (계약, 구현) 쌍에 대해
 * 정의되므로(불변 사실 57) 한 행에 입력 하나만 두면 그 행을 어기는 구현의 절반을 놓친다.
 * - `enqueue` — 내림차순 넣기는 **정본에 최악**(매 호출이 뿌리까지 올라간다)인데 정렬 배열
 *   구현에는 **최선**이다(늘 끝에 붙는다). 정렬 배열을 잡는 것은 무작위 넣기 하나뿐이다.
 * - `dequeue` — 크기를 유지하며 번갈아 부르는 쪽만 **미뤄 두었다 한꺼번에 정렬하는 계열**을
 *   잡는다. 채운 뒤 전부 빼는 쪽에서는 그 계열의 상각이 실제로 성립한다.
 *
 * **`peek`·`size`·`isEmpty` 는 한 시나리오가 함께 덮는다.** 세 행이 같은 상한·한정자이고
 * 세 호출을 한 걸음으로 묶어 재므로 갈라 잴 이유가 없다. `worst` 통계가 최댓값이라 **첫
 * 호출에 값을 만드는 계열**이 여기서 걸린다 — 그것이 세 행을 `worst` 로 적은 이유다.
 *
 * `constructor` 행에는 시나리오가 없다. n 에 대해 반복 호출되는 연산이 아니므로 성장률을
 * 잴 대상이 아니다(§규약2 축3 면제).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 다섯 행을 그대로 옮긴 표면. */
export interface PriorityQueueContract<T> {
  enqueue(item: T): void;
  dequeue(): T | null;
  peek(): T | null;
  size(): number;
  isEmpty(): boolean;
}

/**
 * 축1 참조 모델. 순서 없는 배열 하나이고 최우선 원소는 매번 훑어 찾는다 — 축1은 의미만
 * 보므로 자명한 구현으로 충분하다.
 *
 * 같은 모양이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/scanningPriorityQueue.ts`). 축이 보는 것이 다르기 때문이다.
 */
type Model = number[];

/** 같은 우선순위 원소가 자주 겹치도록 좁게 잡는다. */
const DOMAIN = 24;

/**
 * 스위트가 쓰는 비교자. 원소 타입은 `number` 다(§규약2).
 *
 * **이 방향은 계약의 일부가 아니다.** 계약은 비교자를 주입받고 「최우선」을 그 비교자로
 * 정의하므로, 뒤집어 주입하면 같은 코드가 최대를 먼저 내놓는다 — `heap/minHeap` 과
 * `heap/maxHeap` 이 같은 계약인 것이 그 사실이다. 스위트가 하나를 골라야 해서 고른 것뿐이다.
 */
export const ascending = (a: number, b: number): number => a - b;

function modelTop(model: Model): number | null {
  if (model.length === 0) return null;
  let best = model[0] as number;
  for (const value of model) if (value < best) best = value;
  return best;
}

function modelDequeue(model: Model): number | null {
  const top = modelTop(model);
  if (top === null) return null;
  model.splice(model.indexOf(top), 1);
  return top;
}

export const priorityQueueContract: ContractSpec<
  PriorityQueueContract<number>,
  Model
> = {
  name: "PriorityQueue",
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
        model.push(arg as number);
      },
    },
    {
      name: "dequeue",
      arg: () => undefined,
      onImpl: (impl) => impl.dequeue(),
      onModel: (model) => modelDequeue(model),
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
      onModel: (model) => model.length,
    },
    {
      name: "isEmpty",
      arg: () => undefined,
      onImpl: (impl) => impl.isEmpty(),
      onModel: (model) => model.length === 0,
    },
  ],

  edges: [
    {
      name: "빈 큐의 조회는 전부 비어 있음을 말하고 상태를 바꾸지 않는다",
      steps: [
        { op: "peek" },
        { op: "size" },
        { op: "isEmpty" },
        { op: "dequeue" },
        { op: "size" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      // 집합이 아니다. 같은 우선순위 원소를 여러 벌 담고 담은 수만큼 돌려준다.
      name: "같은 원소를 여러 번 넣으면 그 수만큼 담긴다",
      steps: [
        { op: "enqueue", arg: 5 },
        { op: "enqueue", arg: 5 },
        { op: "enqueue", arg: 5 },
        { op: "size" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "넣은 순서와 무관하게 비교자가 앞세우는 것부터 나온다",
      steps: [
        { op: "enqueue", arg: 9 },
        { op: "enqueue", arg: 1 },
        { op: "enqueue", arg: 5 },
        { op: "enqueue", arg: 3 },
        { op: "enqueue", arg: 7 },
        { op: "peek" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
      ],
    },
    {
      // 최우선 원소가 뒤늦게 들어오는 자리. 앞의 것을 캐시해 두고 갱신을 빠뜨린 구현이
      // 여기서 갈린다.
      name: "넣기와 빼기를 섞어도 최우선 원소가 따라 바뀐다",
      steps: [
        { op: "enqueue", arg: 5 },
        { op: "enqueue", arg: 3 },
        { op: "dequeue" },
        { op: "enqueue", arg: 4 },
        { op: "peek" },
        { op: "enqueue", arg: 1 },
        { op: "peek" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "peek 은 몇 번을 불러도 상태를 바꾸지 않는다",
      steps: [
        { op: "enqueue", arg: 2 },
        { op: "enqueue", arg: 1 },
        { op: "peek" },
        { op: "peek" },
        { op: "peek" },
        { op: "size" },
        { op: "dequeue" },
        { op: "size" },
        { op: "peek" },
      ],
    },
    {
      name: "전부 비웠다가 다시 채워도 정상이다",
      steps: [
        { op: "enqueue", arg: 2 },
        { op: "dequeue" },
        { op: "isEmpty" },
        { op: "peek" },
        { op: "enqueue", arg: 8 },
        { op: "enqueue", arg: 6 },
        { op: "peek" },
        { op: "size" },
        { op: "dequeue" },
        { op: "peek" },
      ],
    },
  ],

  // 헤더 불변식 절이 「없다」이므로 빈 배열이다. 항목을 지우는 것과 다르다.
  invariants: [],

  scenarios: [
    {
      covers: ["enqueue"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **내림차순 넣기.** 새로 들어오는 원소가 늘 최우선이므로, 담는 모양을 고쳐 쓰는
      // 계열은 매 호출이 맨 위까지 올라간다. 정본이 이 계약의 계급을 실제로 내는 자리다.
      //
      // **정렬 배열 구현에는 이 입력이 최선이다** — 늘 끝에 붙으므로 상수로 통과한다
      // (불변 사실 57). 그 계열을 잡는 것은 아래 무작위 시나리오 하나뿐이다.
      run: (impl, n, ctx) => {
        for (let i = n; i > 0; i--) ctx.step(() => impl.enqueue(i));
      },
    },
    {
      covers: ["enqueue"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // **무작위 넣기.** 새 원소가 위까지 올라갈 일이 드물어 정본은 상수에 가깝고, 자리를
      // 유지하는 계열은 여기서 뒤를 통째로 민다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const value = Math.floor(ctx.rng() * n * 4);
          ctx.step(() => impl.enqueue(value));
        }
      },
    },
    {
      covers: ["dequeue"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: true,
      // **크기를 n 으로 유지하며 번갈아 부르기.** 빼기 하나가 늘 원소 n 개짜리 구조에서
      // 일어나므로 정본은 매번 끝까지 내려간다.
      //
      // **미뤄 두었다 한꺼번에 정렬하는 계열을 잡는 유일한 시나리오다** — 새로 들어온
      // 원소가 매번 하나씩 밀려 있으므로 빼기마다 그것을 자리에 넣어야 하고, 그 일이
      // 원소 수에 비례한다. 아래 시나리오에서는 그 정렬이 한 번뿐이라 상각이 성립한다.
      //
      // 넣는 호출은 걸음에 넣지 않는다. 재려는 것이 빼기의 비용이기 때문이다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) {
          impl.enqueue(Math.floor(ctx.rng() * n * 4));
          ctx.step(() => {
            impl.dequeue();
          });
        }
      },
    },
    {
      covers: ["dequeue"],
      qualifier: "amortized",
      bound: "O(log n)",
      adversarial: false,
      // **무작위로 채운 뒤 전부 빼기.** 구조가 줄어드는 방향이라 위 시나리오와 다른 걸음
      // 분포를 낸다. 최우선 원소를 훑어 찾는 계열이 여기서 걸린다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.dequeue();
          });
        }
      },
    },
    {
      covers: ["peek", "size", "isEmpty"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      // 세 조회를 한 걸음으로 묶어 잰다. 통계는 **걸음별 합의 최댓값**이고, 세 행이 같은
      // 상한·한정자라 갈라 잴 이유가 없다(`tree/redBlackTree` 의 조회 시나리오와 같은 자리).
      //
      // **`worst` 라서 잡는 것이 둘이다.** 매번 훑어 최우선을 찾는 계열은 모든 호출에서
      // 걸리고, **첫 호출에만 값을 만들어 두는 계열**은 그 한 번이 최댓값으로 보고돼
      // 걸린다. 시퀀스 평균으로 재면 뒤엣것이 묻힌다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) {
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
