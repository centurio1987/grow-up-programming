/**
 * `graph-repr/graphAdjList` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./graphAdjList.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 여기서 껍데기가 나르는 것은 크기가 아니라 **방향
 * 여부**다. 생성자가 방향 그래프인지를 정하고 그 뒤로 바뀌지 않으므로, 인자 없는 팩토리 하나로는
 * 두 모드를 한 시퀀스에서 돌 수 없다. 껍데기가 방향 그래프와 무방향 그래프를 하나씩 세우고, 연산
 * 인자의 첫 칸(`directed`)이 어느 쪽에 부를지 고른다. 축1 무작위 시퀀스가 두 모드를 섞어 돌고,
 * 축2가 매 연산 뒤 두 그래프를 다 본다. 껍데기는 계약의 일부가 아니고 `tools/check-contract.ts` 의
 * 명세↔스텁·정본 대조에도 걸리지 않는다.
 *
 * **범위 밖 번호를 관측값으로 만든다.** 계약이 그 자리에 `RangeError` 를 적었는데 하네스는 던진
 * 것을 값으로 대조하지 못한다(`runContract.ts` 의 축1은 반환값만 본다). 양쪽을 같은 방식으로 감싸
 * 문자열 하나로 바꾸고, `RangeError` 가 아닌 예외는 그대로 올려보낸다 — 스텁의 `Not implemented` 가
 * 통과로 읽히면 안 된다(`tree/linkCutTree` 와 같은 처리).
 *
 * **`neighbors` 는 정렬한 쌍 배열로 관측한다.** 두 가지 이유다. 계약이 순서를 정하지 않으므로
 * 정렬해야 두 구현이 같은 값을 낸다. 그리고 하네스의 비교가 배열만 원소별로 보고 객체는 동일성으로
 * 본다(`src/data-structures/_contract/runContract.ts:349-356`) — `{ vertex, weight }` 객체를 그대로
 * 넘기면 늘 갈린다. 관측한 뒤 돌려받은 배열과 항목을 **일부러 망가뜨린다.** 「돌려준 것을 고쳐도
 * 그래프는 바뀌지 않는다」가 다음 `neighbors` 에서 관측되게 하려는 것이다.
 *
 * **축3 시나리오는 무방향 그래프로만 돈다.** 무방향 쪽이 두 끝을 함께 고치므로 걸음이 더 많고,
 * 방향 여부는 상한의 계급을 바꾸지 않는다. **차수로 적힌 세 행은 시나리오를 둘씩 둔다**(불변 사실
 * 191) — 차수를 상수로 누른 쪽(bound `O(1)`)과 차수를 n 으로 키운 쪽(bound `O(n)`)이다. 앞쪽이 칸을
 * 훑는 행렬 · 간선을 한 줄로 늘어놓은 목록을 겨누고, 뒤쪽이 상한이 실제로 차수를 따라가는지 본다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **여섯 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface GraphAdjListContract {
  addVertex(): number;
  addEdge(u: number, v: number, weight?: number): void;
  removeEdge(u: number, v: number): void;
  neighbors(u: number): Array<{ vertex: number; weight: number }>;
  vertexCount(): number;
  edgeCount(): number;
}

type Built = GraphAdjListContract & { __cost?: number };

/** 축1 무작위 인자가 고르는 번호의 폭. `-1` 과 이 값 이상이 범위 밖 호출을 만든다. */
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

/** 하네스용 껍데기. 방향 그래프와 무방향 그래프를 하나씩 들고, `reset()` 으로 둘을 다시 세운다. */
export class BothGraphs {
  readonly #make: (directed: boolean) => Built;
  #undirected: Built;
  #directed: Built;
  #carried = 0;

  constructor(make: (directed: boolean) => Built) {
    this.#make = make;
    this.#undirected = make(false);
    this.#directed = make(true);
  }

  get __cost(): number {
    return (
      this.#carried +
      (this.#undirected.__cost ?? 0) +
      (this.#directed.__cost ?? 0)
    );
  }

  graph(directed: boolean): GraphAdjListContract {
    return directed ? this.#directed : this.#undirected;
  }

  reset(): void {
    this.#carried +=
      (this.#undirected.__cost ?? 0) + (this.#directed.__cost ?? 0);
    this.#undirected = this.#make(false);
    this.#directed = this.#make(true);
  }
}

/** `neighbors` 의 관측값. 정렬한 `[vertex, weight]` 쌍 배열이다. */
export function neighborPairs(
  entries: Array<{ vertex: number; weight: number }>,
): number[][] {
  const pairs = entries.map((entry) => [entry.vertex, entry.weight]);
  // 돌려받은 것을 망가뜨린다. 구현이 속을 그대로 내줬다면 다음 관측이 갈린다.
  for (const entry of entries) {
    entry.vertex = -1;
    entry.weight = -1;
  }
  entries.length = 0;
  return pairs.sort(byPair);
}

function byPair(a: number[], b: number[]): number {
  return (
    (a[0] as number) - (b[0] as number) || (a[1] as number) - (b[1] as number)
  );
}

/**
 * 축1 참조 모델. 간선을 쌍 문자열 → 무게 표 하나에 담고 `neighbors` 는 매번 표 전체를 훑는다 —
 * 축1은 의미만 보므로 자명한 구현으로 충분하다. 같은 모양이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/edgeListGraph.ts`).
 */
interface ModelGraph {
  directed: boolean;
  vertices: number;
  edges: Map<string, number>;
}

interface Model {
  undirected: ModelGraph;
  directed: ModelGraph;
}

function modelOf(model: Model, directed: boolean): ModelGraph {
  return directed ? model.directed : model.undirected;
}

function inRange(graph: ModelGraph, vertex: number): boolean {
  return Number.isInteger(vertex) && vertex >= 0 && vertex < graph.vertices;
}

function edgeKey(graph: ModelGraph, u: number, v: number): string {
  if (graph.directed) return `${u}>${v}`;
  return u <= v ? `${u}-${v}` : `${v}-${u}`;
}

function modelNeighbors(graph: ModelGraph, u: number): number[][] {
  const pairs: number[][] = [];
  for (const [key, weight] of graph.edges) {
    if (graph.directed) {
      const [from, to] = key.split(">").map(Number);
      if (from === u) pairs.push([to as number, weight]);
      continue;
    }
    const [a, b] = key.split("-").map(Number);
    if (a === u) pairs.push([b as number, weight]);
    else if (b === u) pairs.push([a as number, weight]);
  }
  return pairs.sort(byPair);
}

type EdgeArg = [boolean, number, number] | [boolean, number, number, number];

function vertexArg(rng: () => number): number {
  return Math.floor(rng() * (IDS + 1)) - 1;
}

export const graphAdjListContract: ContractSpec<BothGraphs, Model> = {
  name: "GraphAdjList",
  grade: "invariant",
  model: () => ({
    undirected: { directed: false, vertices: 0, edges: new Map() },
    directed: { directed: true, vertices: 0, edges: new Map() },
  }),

  ops: [
    {
      name: "addVertex",
      arg: (rng) => [rng() < 0.5],
      onImpl: (impl, arg) => {
        const [directed] = arg as [boolean];
        return impl.graph(directed).addVertex();
      },
      onModel: (model, arg) => {
        const [directed] = arg as [boolean];
        const graph = modelOf(model, directed);
        graph.vertices += 1;
        return graph.vertices - 1;
      },
    },
    {
      name: "addEdge",
      arg: (rng) => {
        const directed = rng() < 0.5;
        const u = vertexArg(rng);
        const v = vertexArg(rng);
        // 다섯에 하나는 무게를 생략해 기본값 1 을 짚는다.
        return rng() < 0.2
          ? [directed, u, v]
          : [directed, u, v, 1 + Math.floor(rng() * 9)];
      },
      onImpl: (impl, arg) => {
        const [directed, u, v, weight] = arg as EdgeArg;
        const graph = impl.graph(directed);
        return observe(() => {
          if (weight === undefined) graph.addEdge(u, v);
          else graph.addEdge(u, v, weight);
        });
      },
      onModel: (model, arg) => {
        const [directed, u, v, weight] = arg as EdgeArg;
        const graph = modelOf(model, directed);
        if (!inRange(graph, u) || !inRange(graph, v)) return OUT_OF_RANGE;
        graph.edges.set(edgeKey(graph, u, v), weight ?? 1);
        return undefined;
      },
    },
    {
      name: "removeEdge",
      arg: (rng) => [rng() < 0.5, vertexArg(rng), vertexArg(rng)],
      onImpl: (impl, arg) => {
        const [directed, u, v] = arg as [boolean, number, number];
        const graph = impl.graph(directed);
        return observe(() => {
          graph.removeEdge(u, v);
        });
      },
      onModel: (model, arg) => {
        const [directed, u, v] = arg as [boolean, number, number];
        const graph = modelOf(model, directed);
        if (!inRange(graph, u) || !inRange(graph, v)) return OUT_OF_RANGE;
        graph.edges.delete(edgeKey(graph, u, v));
        return undefined;
      },
    },
    {
      name: "neighbors",
      arg: (rng) => [rng() < 0.5, vertexArg(rng)],
      onImpl: (impl, arg) => {
        const [directed, u] = arg as [boolean, number];
        const graph = impl.graph(directed);
        return observe(() => neighborPairs(graph.neighbors(u)));
      },
      onModel: (model, arg) => {
        const [directed, u] = arg as [boolean, number];
        const graph = modelOf(model, directed);
        if (!inRange(graph, u)) return OUT_OF_RANGE;
        return modelNeighbors(graph, u);
      },
    },
    {
      name: "vertexCount",
      arg: (rng) => [rng() < 0.5],
      onImpl: (impl, arg) => {
        const [directed] = arg as [boolean];
        return impl.graph(directed).vertexCount();
      },
      onModel: (model, arg) => {
        const [directed] = arg as [boolean];
        return modelOf(model, directed).vertices;
      },
    },
    {
      name: "edgeCount",
      arg: (rng) => [rng() < 0.5],
      onImpl: (impl, arg) => {
        const [directed] = arg as [boolean];
        return impl.graph(directed).edgeCount();
      },
      onModel: (model, arg) => {
        const [directed] = arg as [boolean];
        return modelOf(model, directed).edges.size;
      },
    },
  ],

  edges: [
    {
      name: "빈 그래프에서는 어느 번호도 범위 밖이고 수는 0 이다",
      steps: [
        { op: "vertexCount", arg: [false] },
        { op: "edgeCount", arg: [false] },
        { op: "neighbors", arg: [false, 0] },
        { op: "addEdge", arg: [false, 0, 0] },
        { op: "removeEdge", arg: [true, 0, 0] },
        { op: "edgeCount", arg: [false] },
      ],
    },
    {
      // 정점 번호 모형이 관측되는 자리다. 번호는 호출 직전의 수이고 그 수 이상은 범위 밖이다.
      name: "addVertex 는 호출 직전의 vertexCount 를 번호로 돌려준다",
      steps: [
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "vertexCount", arg: [false] },
        { op: "neighbors", arg: [false, 2] },
        { op: "neighbors", arg: [false, 3] },
        { op: "vertexCount", arg: [true] },
      ],
    },
    {
      name: "무방향 간선은 두 끝에서 보이고 하나로 센다",
      steps: [
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "addEdge", arg: [false, 0, 1, 5] },
        { op: "addEdge", arg: [false, 2, 1, 6] },
        { op: "neighbors", arg: [false, 0] },
        { op: "neighbors", arg: [false, 1] },
        { op: "neighbors", arg: [false, 2] },
        { op: "edgeCount", arg: [false] },
      ],
    },
    {
      name: "방향 간선은 나가는 쪽에서만 보이고 반대 방향은 다른 간선이다",
      steps: [
        { op: "addVertex", arg: [true] },
        { op: "addVertex", arg: [true] },
        { op: "addEdge", arg: [true, 0, 1, 5] },
        { op: "neighbors", arg: [true, 0] },
        { op: "neighbors", arg: [true, 1] },
        { op: "addEdge", arg: [true, 1, 0, 7] },
        { op: "neighbors", arg: [true, 1] },
        { op: "edgeCount", arg: [true] },
      ],
    },
    {
      // 다중 간선을 받지 않는 자리다. 간선 수를 따로 세는 구현이 여기서 불변식 1번을 어긴다.
      name: "같은 간선을 다시 넣으면 무게만 바뀐다",
      steps: [
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "addEdge", arg: [false, 0, 1, 3] },
        { op: "addEdge", arg: [false, 1, 0, 9] },
        { op: "edgeCount", arg: [false] },
        { op: "neighbors", arg: [false, 0] },
        { op: "neighbors", arg: [false, 1] },
        { op: "addEdge", arg: [false, 0, 1] },
        { op: "neighbors", arg: [false, 1] },
        { op: "edgeCount", arg: [false] },
      ],
    },
    {
      name: "제자리 간선은 한 번 보이고 하나로 센다",
      steps: [
        { op: "addVertex", arg: [false] },
        { op: "addEdge", arg: [false, 0, 0, 4] },
        { op: "neighbors", arg: [false, 0] },
        { op: "edgeCount", arg: [false] },
        { op: "removeEdge", arg: [false, 0, 0] },
        { op: "neighbors", arg: [false, 0] },
        { op: "edgeCount", arg: [false] },
        { op: "addVertex", arg: [true] },
        { op: "addEdge", arg: [true, 0, 0, 2] },
        { op: "neighbors", arg: [true, 0] },
        { op: "edgeCount", arg: [true] },
      ],
    },
    {
      name: "없는 간선을 지우면 상태가 바뀌지 않는다",
      steps: [
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "addEdge", arg: [false, 0, 1, 2] },
        { op: "removeEdge", arg: [false, 0, 2] },
        { op: "edgeCount", arg: [false] },
        { op: "removeEdge", arg: [false, 1, 0] },
        { op: "neighbors", arg: [false, 0] },
        { op: "neighbors", arg: [false, 1] },
        { op: "edgeCount", arg: [false] },
        { op: "addVertex", arg: [true] },
        { op: "addVertex", arg: [true] },
        { op: "addEdge", arg: [true, 0, 1, 2] },
        { op: "removeEdge", arg: [true, 1, 0] },
        { op: "neighbors", arg: [true, 0] },
        { op: "edgeCount", arg: [true] },
      ],
    },
    {
      // 한쪽 끝만 범위 밖인 호출이 반쯤 적용되면 여기서 갈린다.
      name: "범위 밖 · 정수가 아닌 번호는 RangeError 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "addVertex", arg: [false] },
        { op: "addVertex", arg: [false] },
        { op: "addEdge", arg: [false, 0, 2, 1] },
        { op: "addEdge", arg: [false, -1, 0, 1] },
        { op: "addEdge", arg: [false, 0.5, 1, 1] },
        { op: "neighbors", arg: [false, 0] },
        { op: "edgeCount", arg: [false] },
        { op: "addEdge", arg: [false, 0, 1, 1] },
        { op: "removeEdge", arg: [false, 1, 2] },
        { op: "neighbors", arg: [false, 1] },
        { op: "neighbors", arg: [false, -1] },
      ],
    },
  ],

  invariants: [
    {
      name: "간선 수와 이웃 항목 수가 맞는다",
      check: (impl) => {
        for (const directed of [false, true]) {
          const graph = impl.graph(directed);
          const vertices = graph.vertexCount();
          let listed = 0;
          for (let u = 0; u < vertices; u++) {
            for (const entry of graph.neighbors(u)) {
              if (directed || entry.vertex >= u) listed += 1;
            }
          }
          const counted = graph.edgeCount();
          if (listed !== counted) {
            const mode = directed ? "방향" : "무방향";
            return `${mode} 그래프 — 이웃 항목으로 센 간선 ${listed} / edgeCount() ${counted}`;
          }
        }
        return null;
      },
    },
    {
      name: "무방향 간선은 두 끝에서 같은 무게로 보인다",
      check: (impl) => {
        const graph = impl.graph(false);
        const vertices = graph.vertexCount();
        for (let u = 0; u < vertices; u++) {
          for (const entry of graph.neighbors(u)) {
            const back = graph
              .neighbors(entry.vertex)
              .some(
                (other) =>
                  other.vertex === u && Object.is(other.weight, entry.weight),
              );
            if (!back) {
              return `neighbors(${u}) 에 {${entry.vertex}, ${entry.weight}} 가 있는데 neighbors(${entry.vertex}) 에 {${u}, ${entry.weight}} 가 없다`;
            }
          }
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
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i < n; i++) ctx.step(() => graph.addVertex());
      },
    },
    {
      // 차수를 2 로 누른다(고리). 간선을 한 줄로 늘어놓고 같은 간선을 찾느라 전부 훑는 계열이
      // 여기서 걸린다 — 아래 차수를 키운 쪽은 그 계열도 통과한다(간선 수가 곧 차수다).
      covers: ["addEdge"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i < n; i++) graph.addVertex();
        for (let i = 0; i < n; i++) {
          ctx.step(() => graph.addEdge(i, (i + 1) % n, 1));
        }
      },
    },
    {
      // 차수를 n 으로 키운다(별). 가운데 정점을 **첫 인자**로 둔다 — 정본은 첫 인자의 이웃을
      // 훑어 같은 간선을 찾는다. 두 끝 중 작은 쪽을 골라 훑는 구현은 여기서 계급 **아래로**
      // 걸리고, 그것은 계약 위반이 아니다(불변 사실 49).
      covers: ["addEdge"],
      qualifier: "amortized",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i <= n; i++) graph.addVertex();
        for (let i = 1; i <= n; i++) ctx.step(() => graph.addEdge(0, i, 1));
      },
    },
    {
      covers: ["removeEdge"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i < n; i++) graph.addVertex();
        for (let i = 0; i < n; i++) graph.addEdge(i, (i + 1) % n, 1);
        for (let i = 0; i < n; i++) {
          ctx.step(() => graph.removeEdge(i, (i + 1) % n));
        }
      },
    },
    {
      // 별의 잎을 **섞은 차례로** 뗀다. 넣은 차례나 그 반대로 떼면 앞이나 뒤에서 훑는 구현
      // 하나가 매번 첫 자리에서 찾아 상수가 되고, 그것은 이 행이 재려는 것이 아니다.
      covers: ["removeEdge"],
      qualifier: "amortized",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i <= n; i++) graph.addVertex();
        for (let i = 1; i <= n; i++) graph.addEdge(0, i, 1);
        const leaves = Array.from({ length: n }, (_, i) => i + 1);
        for (let i = leaves.length - 1; i > 0; i--) {
          const j = Math.floor(ctx.rng() * (i + 1));
          [leaves[i], leaves[j]] = [leaves[j] as number, leaves[i] as number];
        }
        for (const leaf of leaves) ctx.step(() => graph.removeEdge(0, leaf));
      },
    },
    {
      // **이 계약이 행렬과 갈리는 자리다.** 차수 2 인 정점의 이웃을 받는 데 행 하나를 끝까지
      // 훑는 계열(칸을 늘리는 행렬)과 간선 목록 전체를 훑는 계열이 여기서 걸린다.
      covers: ["neighbors"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i < n; i++) graph.addVertex();
        for (let i = 0; i < n; i++) graph.addEdge(i, (i + 1) % n, 1);
        for (let i = 0; i < n; i++) ctx.step(() => graph.neighbors(i));
      },
    },
    {
      // 차수 n 인 가운데 정점. `worst` 통계는 단일 호출 최대라 몇 번만 불러도 된다.
      covers: ["neighbors"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i <= n; i++) graph.addVertex();
        for (let i = 1; i <= n; i++) graph.addEdge(0, i, 1);
        for (let i = 0; i < 8; i++) ctx.step(() => graph.neighbors(0));
      },
    },
    {
      // 둘을 한 걸음에 묶는다. 수를 세어 두지 않고 매번 훑는 계열이 여기서만 걸린다.
      covers: ["vertexCount", "edgeCount"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset();
        const graph = impl.graph(false);
        for (let i = 0; i < n; i++) graph.addVertex();
        for (let i = 0; i < n; i++) graph.addEdge(i, (i + 1) % n, 1);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            graph.vertexCount();
            graph.edgeCount();
          });
        }
      },
    },
  ],
};
