/**
 * `graph-repr/dag` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./dag.ts` 헤더 한 곳이고(규약1), 여기 있는 것은
 * 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **껍데기를 하나 씌운다(불변 사실 83 · 215).** 여기서 껍데기가 나르는 것은 크기도 모드도 아니라
 * **구현이 받아들였다고 답한 간선의 기록**이다. `topologicalOrder` 의 행이 순서를 하나로 정하지 않으므로
 * 참조 모델이 같은 배열을 내놓을 수 없고, 하네스의 비교는 배열을 원소마다 · 나머지를 `Object.is` 로
 * 본다(`src/data-structures/_contract/runContract.ts:328-335`). 그래서 관측값을 배열이 아니라 **판정**으로
 * 바꾼다 — 돌려받은 순서가 모든 정점을 한 번씩 담고 모든 간선 방향을 지키면 `true`, 아니면 첫 어긋남을
 * 적은 문자열이다. 참조 모델은 늘 `true` 를 낸다. 그 판정에는 간선 목록이 드는데 `onImpl` 은 구현만
 * 받으므로(모델을 받지 않는다) 껍데기가 들고 있어야 한다.
 *
 * 껍데기는 간선을 **구현의 답**으로 적는다 — `addEdge` 가 `true` 를 돌려준 간선만 적는다. 구현이 사이클을
 * 닫는 간선에 `true` 를 돌려주면 그 호출에서 축1이 모델의 `false` 와 갈려 시퀀스가 멈추므로, 판정이
 * 불리는 시점의 기록은 언제나 모델의 간선과 같다. 정점 수도 `vertexCount()` 가 아니라 `addVertex` 가
 * 불린 수로 센다 — 판정이 구현의 다른 관측에 기대지 않게 하려는 것이다. 껍데기는 계약의 일부가 아니고
 * `tools/check-contract.ts` 의 명세↔스텁·정본 대조에도 걸리지 않는다.
 *
 * **범위 밖 번호를 관측값으로 만든다.** 계약이 그 자리에 `RangeError` 를 적었는데 하네스는 던진 것을
 * 값으로 대조하지 못한다. 양쪽을 같은 방식으로 감싸 문자열 하나로 바꾸고, `RangeError` 가 아닌 예외는
 * 그대로 올려보낸다 — 스텁의 `Not implemented` 가 통과로 읽히면 안 된다(`graph-repr/graphAdjList` 와
 * 같은 처리).
 *
 * **순서는 판정한 뒤 일부러 망가뜨린다.** 「돌려준 배열을 고쳐도 그래프는 바뀌지 않는다」가 다음
 * 판정에서 관측되게 하려는 것이다.
 *
 * **축3 시나리오는 `addEdge` 에 둘이다(불변 사실 191 · 211).** 상한의 파라미터가 n 이 아니라 **닿는 부분의
 * 크기** k(u, v) — 호출 전 그래프와 넣는 간선만으로 정해지는 양, 헤더 연산 계약 첫 문단 — 이므로 그 양 끝을 둔다.
 * 떨어진 쌍을 잇는 쪽은 닿는 부분이 두 정점이고 닿는 간선이 없어 k = 2(bound `O(1)`), 사슬의 끝을 처음에
 * 잇는 쪽은 닿는 부분이 사슬 전체라 k = 2n − 1(bound `O(n)`)이다. 앞쪽이 넣을 때마다 그래프 전체를 훑는 계열을
 * 겨누고, 뒤쪽이 상한이 실제로 닿는 부분을 따라가는지 본다. k 를 u · v 에 붙은 간선 수로만 키우는 쪽(별)은
 * 두지 않았다 — 결함 fixture 셋 어느 것도 가르지 못하고, 들어오는 간선으로 같은 간선을 찾는 정당한
 * 구현만 계급 아래로 떨어뜨린다(불변 사실 57 — 뒤엣것은 논증이고 짓지 않았다).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **다섯 행**을 그대로 옮긴 표면. 생성자 행은 팩토리가 나른다. */
export interface DagContract {
  addVertex(): number;
  addEdge(u: number, v: number): boolean;
  topologicalOrder(): number[];
  vertexCount(): number;
  edgeCount(): number;
}

type Built = DagContract & { __cost?: number };

/** 축1 무작위 인자가 고르는 번호의 폭. `-1` 과 그 정점 수 이상이 범위 밖 호출을 만든다. */
const IDS = 8;

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

/**
 * 돌려받은 순서의 판정. 정점 `vertices` 개를 한 번씩 담고 `edges` 의 방향을 전부 지키면 `true`,
 * 아니면 첫 어긋남을 적은 문자열이다.
 */
export function orderVerdict(
  order: readonly number[],
  vertices: number,
  edges: readonly (readonly [number, number])[],
): true | string {
  if (order.length !== vertices) {
    return `순서의 길이 ${order.length} / 정점 ${vertices}`;
  }
  const at: number[] = new Array(vertices).fill(-1);
  for (let index = 0; index < order.length; index++) {
    const vertex = order[index] as number;
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= vertices) {
      return `${index}번째 값 ${vertex} 는 정점 번호가 아니다`;
    }
    if (at[vertex] !== -1) return `정점 ${vertex} 가 두 번 나온다`;
    at[vertex] = index;
  }
  for (const [from, to] of edges) {
    if ((at[from] as number) > (at[to] as number)) {
      return `간선 ${from}→${to} 인데 ${to} 가 ${from} 보다 앞이다`;
    }
  }
  return true;
}

/** 하네스용 껍데기. 구현 하나를 들고, 받아들여진 간선과 `addVertex` 가 불린 수를 적어 둔다. */
export class DagShell {
  /** 시나리오와 불변식 검사는 기록을 거치지 않고 구현을 바로 부른다. */
  readonly dag: Built;
  #vertices = 0;
  readonly #accepted: Array<[number, number]> = [];

  constructor(dag: Built) {
    this.dag = dag;
  }

  get __cost(): number {
    return this.dag.__cost ?? 0;
  }

  addVertex(): number {
    const vertex = this.dag.addVertex();
    this.#vertices += 1;
    return vertex;
  }

  addEdge(u: number, v: number): boolean {
    const accepted = this.dag.addEdge(u, v);
    if (accepted === true) this.#accepted.push([u, v]);
    return accepted;
  }

  /** `topologicalOrder` 의 관측값. 판정한 뒤 돌려받은 배열을 망가뜨린다. */
  orderObserved(): true | string {
    const order = this.dag.topologicalOrder();
    const verdict = orderVerdict(order, this.#vertices, this.#accepted);
    // 구현이 속을 그대로 내줬다면 다음 판정이 갈린다.
    order.fill(-1);
    order.length = 0;
    return verdict;
  }
}

/**
 * 축1 참조 모델. 정점마다 나가는 간선의 끝을 담고 사이클은 매번 표를 새로 잡아 찾는다 — 축1은 의미만
 * 보므로 자명한 구현으로 충분하다. 같은 모양(찾을 때마다 정점 수만큼 표시를 새로 잡는다)이 축3에서는
 * 헤더 필요충분조건이 적는 결함이 된다.
 */
interface Model {
  out: number[][];
  edges: number;
}

function inRange(model: Model, vertex: number): boolean {
  return Number.isInteger(vertex) && vertex >= 0 && vertex < model.out.length;
}

function modelReaches(model: Model, from: number, goal: number): boolean {
  const seen = new Array<boolean>(model.out.length).fill(false);
  const pending = [from];
  seen[from] = true;
  while (pending.length > 0) {
    const vertex = pending.pop() as number;
    if (vertex === goal) return true;
    for (const target of model.out[vertex] as number[]) {
      if (seen[target]) continue;
      seen[target] = true;
      pending.push(target);
    }
  }
  return false;
}

function vertexArg(rng: () => number): number {
  return Math.floor(rng() * (IDS + 1)) - 1;
}

export const dagContract: ContractSpec<DagShell, Model> = {
  name: "DAG",
  grade: "invariant",
  model: () => ({ out: [], edges: 0 }),

  ops: [
    {
      name: "addVertex",
      arg: () => undefined,
      onImpl: (impl) => impl.addVertex(),
      onModel: (model) => {
        model.out.push([]);
        return model.out.length - 1;
      },
    },
    {
      name: "addEdge",
      arg: (rng) => [vertexArg(rng), vertexArg(rng)],
      onImpl: (impl, arg) => {
        const [u, v] = arg as [number, number];
        return observe(() => impl.addEdge(u, v));
      },
      onModel: (model, arg) => {
        const [u, v] = arg as [number, number];
        if (!inRange(model, u) || !inRange(model, v)) return OUT_OF_RANGE;
        const targets = model.out[u] as number[];
        if (targets.includes(v)) return true;
        if (modelReaches(model, v, u)) return false;
        targets.push(v);
        model.edges += 1;
        return true;
      },
    },
    {
      name: "topologicalOrder",
      arg: () => undefined,
      onImpl: (impl) => impl.orderObserved(),
      onModel: () => true,
    },
    {
      name: "vertexCount",
      arg: () => undefined,
      onImpl: (impl) => impl.dag.vertexCount(),
      onModel: (model) => model.out.length,
    },
    {
      name: "edgeCount",
      arg: () => undefined,
      onImpl: (impl) => impl.dag.edgeCount(),
      onModel: (model) => model.edges,
    },
  ],

  edges: [
    {
      name: "빈 그래프에서는 어느 번호도 범위 밖이고 순서는 빈 배열이다",
      steps: [
        { op: "vertexCount" },
        { op: "edgeCount" },
        { op: "topologicalOrder" },
        { op: "addEdge", arg: [0, 0] },
        { op: "edgeCount" },
      ],
    },
    {
      // 정점 번호 모형이 관측되는 자리다. 번호는 호출 직전의 수이고 그 수 이상은 범위 밖이다.
      name: "addVertex 는 호출 직전의 vertexCount 를 번호로 돌려준다",
      steps: [
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "vertexCount" },
        { op: "addEdge", arg: [2, 3] },
        { op: "addEdge", arg: [3, 0] },
        { op: "topologicalOrder" },
      ],
    },
    {
      name: "제자리 간선은 사이클이라 거부되고 상태가 바뀌지 않는다",
      steps: [
        { op: "addVertex" },
        { op: "addEdge", arg: [0, 0] },
        { op: "edgeCount" },
        { op: "topologicalOrder" },
      ],
    },
    {
      name: "반대 방향 간선은 두 정점 사이클이라 거부된다",
      steps: [
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addEdge", arg: [0, 1] },
        { op: "addEdge", arg: [1, 0] },
        { op: "edgeCount" },
        { op: "topologicalOrder" },
      ],
    },
    {
      // 사이클 찾기의 방향을 거꾸로 짠 구현이 여기서 갈린다 — 지름길을 사이클로 읽는다.
      name: "긴 사이클을 닫는 간선은 거부하고 지름길은 받는다",
      steps: [
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addEdge", arg: [0, 1] },
        { op: "addEdge", arg: [1, 2] },
        { op: "addEdge", arg: [2, 3] },
        { op: "addEdge", arg: [0, 3] },
        { op: "addEdge", arg: [3, 0] },
        { op: "addEdge", arg: [2, 1] },
        { op: "addEdge", arg: [3, 1] },
        { op: "edgeCount" },
        { op: "topologicalOrder" },
      ],
    },
    {
      // 같은 간선을 두 번 세는 구현이 여기서 불변식이 아니라 축1에서 갈린다(간선을 늘어놓는 연산이 없다).
      name: "같은 간선을 다시 넣으면 true 이고 간선 수는 그대로다",
      steps: [
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addEdge", arg: [0, 1] },
        { op: "addEdge", arg: [0, 1] },
        { op: "edgeCount" },
        { op: "topologicalOrder" },
      ],
    },
    {
      // 거부된 간선이 반쯤 남으면 뒤의 정당한 간선이 사이클로 읽힌다.
      name: "거부된 간선은 뒤 판정에 남지 않는다",
      steps: [
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addEdge", arg: [0, 1] },
        { op: "addEdge", arg: [1, 0] },
        { op: "addEdge", arg: [0, 2] },
        { op: "addEdge", arg: [2, 1] },
        { op: "edgeCount" },
        { op: "topologicalOrder" },
      ],
    },
    {
      // 간선이 큰 번호에서 작은 번호로 간다. 번호 차례를 그대로 순서로 내는 구현이 여기서 갈린다.
      name: "순서는 모든 간선 방향을 지키고 돌려준 배열을 고쳐도 바뀌지 않는다",
      steps: [
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addEdge", arg: [3, 1] },
        { op: "addEdge", arg: [3, 2] },
        { op: "addEdge", arg: [1, 0] },
        { op: "addEdge", arg: [2, 0] },
        { op: "addEdge", arg: [4, 3] },
        { op: "topologicalOrder" },
        { op: "topologicalOrder" },
        { op: "addEdge", arg: [0, 4] },
        { op: "vertexCount" },
        { op: "topologicalOrder" },
      ],
    },
    {
      // 한쪽 끝만 범위 밖인 호출이 반쯤 적용되면 여기서 갈린다.
      name: "범위 밖 · 정수가 아닌 번호는 RangeError 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "addVertex" },
        { op: "addVertex" },
        { op: "addEdge", arg: [0, 2] },
        { op: "addEdge", arg: [-1, 0] },
        { op: "addEdge", arg: [0.5, 1] },
        { op: "edgeCount" },
        { op: "addEdge", arg: [0, 1] },
        { op: "addEdge", arg: [1, 2] },
        { op: "addEdge", arg: [2, 1] },
        { op: "edgeCount" },
        { op: "addEdge", arg: [1, 0] },
        { op: "topologicalOrder" },
      ],
    },
  ],

  invariants: [
    {
      name: "순서의 길이와 정점 수가 맞는다",
      check: (impl) => {
        const vertices = impl.dag.vertexCount();
        const listed = impl.dag.topologicalOrder().length;
        if (listed !== vertices) {
          return `topologicalOrder() 길이 ${listed} / vertexCount() ${vertices}`;
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      covers: ["addVertex"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const dag = impl.dag;
        for (let i = 0; i < n; i++) ctx.step(() => dag.addVertex());
      },
    },
    {
      // k 를 상수로 누른다 — 정점 2n 개를 두고 떨어진 쌍만 잇는다. 새 간선이 닿는 부분은 두 정점뿐이고 닿는 간선이 없는데(k = 2)
      // 그래프는 계속 커진다. 넣을 때마다 그래프 전체를 훑는 계열과 찾을 때마다 정점 수만큼 표시를 새로
      // 잡는 계열이 여기서 걸린다.
      covers: ["addEdge"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const dag = impl.dag;
        for (let i = 0; i < 2 * n; i++) dag.addVertex();
        for (let i = 0; i < n; i++)
          ctx.step(() => dag.addEdge(2 * i, 2 * i + 1));
      },
    },
    {
      // k 를 n 으로 키운다(k = 2n − 1) — 사슬 0→1→…→n-1 의 끝을 처음에 잇는 간선을 n 번 넣는다. 매번 사이클이라
      // 거부되고 상태가 안 바뀐다. 사이클을 찾으려면 어느 방향으로 찾든 사슬 전체를 지나야 한다(v = 0 에서
      // 갈 수 있는 부분도, u = n-1 로 올 수 있는 부분도 사슬 전체다). 사이클을 못 찾고 받아들이는 구현은
      // 첫 호출 뒤로 같은 간선을 찾기만 해서 계급 아래로 걸린다.
      covers: ["addEdge"],
      qualifier: "amortized",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const dag = impl.dag;
        for (let i = 0; i < n; i++) dag.addVertex();
        for (let i = 0; i + 1 < n; i++) dag.addEdge(i, i + 1);
        for (let i = 0; i < n; i++) ctx.step(() => dag.addEdge(n - 1, 0));
      },
    },
    {
      // 사슬을 **큰 번호에서 작은 번호로** 짓는다. 순서의 다음 정점을 매번 앞 번호부터 찾는 계열이 매
      // 걸음 끝까지 가게 하려는 것이다. `worst` 통계는 단일 호출 최대라 몇 번만 불러도 된다.
      covers: ["topologicalOrder"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const dag = impl.dag;
        for (let i = 0; i < n; i++) dag.addVertex();
        for (let i = n - 1; i > 0; i--) dag.addEdge(i, i - 1);
        for (let i = 0; i < 4; i++) ctx.step(() => dag.topologicalOrder());
      },
    },
    {
      // 둘을 한 걸음에 묶는다. 수를 세어 두지 않고 매번 훑는 계열이 여기서만 걸린다.
      covers: ["vertexCount", "edgeCount"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const dag = impl.dag;
        for (let i = 0; i < n; i++) dag.addVertex();
        for (let i = 0; i + 1 < n; i++) dag.addEdge(i, i + 1);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            dag.vertexCount();
            dag.edgeCount();
          });
        }
      },
    },
  ],
};
