/**
 * `graph-repr/graphAdjMatrix` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./graphAdjMatrix.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 나르는 것이 둘이다. 생성자가 **정점 수**를 받으므로 축3
 * 사다리를 오르려면 그 크기의 그래프를 다시 세워야 하고, 생성자가 **방향 여부**도 정하므로 두
 * 모드를 한 시퀀스에서 돌려면 그래프를 모드마다 하나씩 들어야 한다. 축1은 정점 수 `NODES` 인 두
 * 그래프에서 돌고 연산 인자의 첫 칸(`directed`)이 어느 쪽에 부를지 고른다. 축3의 `reset(n)` 은
 * 무방향 그래프만 크기 n 으로 다시 세운다 — 칸이 n² 이라 두 모드를 다 세우면 사다리 끝(n = 4,096)
 * 에서 칸 3,300 만 개를 잡는다. 껍데기는 계약의 일부가 아니다.
 *
 * **범위 밖 번호를 관측값으로 만든다.** `graph-repr/graphAdjList` 스위트와 같은 처리다 —
 * `RangeError` 만 문자열 하나로 바꾸고 다른 예외는 올려보낸다.
 *
 * **`neighbors` 는 정렬한 배열로 관측하고, 돌려받은 배열을 일부러 비운다.** 계약이 순서를 정하지
 * 않고, 「돌려준 배열을 고쳐도 그래프는 바뀌지 않는다」가 다음 관측에서 보이게 하려는 것이다.
 *
 * **축3의 적대적 시나리오는 전부 별(차수 n-1 인 가운데 정점)이다.** 이 계약이 목록 계약과 갈리는
 * 자리가 「차수가 큰 정점을 다루는 쌍 연산」이기 때문이다. 차수가 작은 그래프에서는 이웃 배열을
 * 훑는 구현도 네 행을 상수에 하므로 아무것도 가르지 못한다(불변 사실 57 — 가르지 못하는 시나리오는
 * 두지 않는다). 쌍 질의 시나리오의 잎끼리 묻기는 **없는 간선**을 묻는 자리다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **일곱 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface GraphAdjMatrixContract {
  addEdge(u: number, v: number, weight?: number): void;
  removeEdge(u: number, v: number): void;
  hasEdge(u: number, v: number): boolean;
  weight(u: number, v: number): number | null;
  neighbors(u: number): number[];
  vertexCount(): number;
}

type Built = GraphAdjMatrixContract & { __cost?: number };

/** 축1이 도는 정점 수. 무작위 쌍이 이미 있는 간선을 자주 맞도록 좁게 잡는다. */
const NODES = 5;

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

/** 하네스용 껍데기. 모드마다 그래프 하나를 들고, `reset(n)` 으로 무방향 그래프를 크기 n 으로 다시 세운다. */
export class SizedGraphs {
  readonly #make: (n: number, directed: boolean) => Built;
  #undirected: Built;
  #directed: Built;
  #carried = 0;

  constructor(make: (n: number, directed: boolean) => Built) {
    this.#make = make;
    this.#undirected = make(NODES, false);
    this.#directed = make(NODES, true);
  }

  get __cost(): number {
    return (
      this.#carried +
      (this.#undirected.__cost ?? 0) +
      (this.#directed.__cost ?? 0)
    );
  }

  graph(directed: boolean): GraphAdjMatrixContract {
    return directed ? this.#directed : this.#undirected;
  }

  reset(n: number): void {
    this.#carried += this.#undirected.__cost ?? 0;
    this.#undirected = this.#make(n, false);
  }
}

/** `neighbors` 의 관측값. 정렬한 사본을 내고 돌려받은 배열은 비운다. */
function neighborList(found: number[]): number[] {
  const copy = [...found].sort((a, b) => a - b);
  found.length = 0;
  return copy;
}

/**
 * 축1 참조 모델. 간선을 쌍 문자열 → 무게 표 하나에 담는다 — 축1은 의미만 보므로 자명한 구현으로
 * 충분하다.
 */
interface ModelGraph {
  directed: boolean;
  edges: Map<string, number>;
}

interface Model {
  undirected: ModelGraph;
  directed: ModelGraph;
}

function modelOf(model: Model, directed: boolean): ModelGraph {
  return directed ? model.directed : model.undirected;
}

function inRange(vertex: number): boolean {
  return Number.isInteger(vertex) && vertex >= 0 && vertex < NODES;
}

function edgeKey(graph: ModelGraph, u: number, v: number): string {
  if (graph.directed) return `${u}>${v}`;
  return u <= v ? `${u}-${v}` : `${v}-${u}`;
}

function vertexArg(rng: () => number): number {
  return Math.floor(rng() * (NODES + 2)) - 1;
}

type PairArg = [boolean, number, number];
type EdgeArg = PairArg | [boolean, number, number, number];

export const graphAdjMatrixContract: ContractSpec<SizedGraphs, Model> = {
  name: "GraphAdjMatrix",
  grade: "invariant",
  model: () => ({
    undirected: { directed: false, edges: new Map() },
    directed: { directed: true, edges: new Map() },
  }),

  ops: [
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
        if (!inRange(u) || !inRange(v)) return OUT_OF_RANGE;
        const graph = modelOf(model, directed);
        graph.edges.set(edgeKey(graph, u, v), weight ?? 1);
        return undefined;
      },
    },
    {
      name: "removeEdge",
      arg: (rng) => [rng() < 0.5, vertexArg(rng), vertexArg(rng)],
      onImpl: (impl, arg) => {
        const [directed, u, v] = arg as PairArg;
        const graph = impl.graph(directed);
        return observe(() => {
          graph.removeEdge(u, v);
        });
      },
      onModel: (model, arg) => {
        const [directed, u, v] = arg as PairArg;
        if (!inRange(u) || !inRange(v)) return OUT_OF_RANGE;
        const graph = modelOf(model, directed);
        graph.edges.delete(edgeKey(graph, u, v));
        return undefined;
      },
    },
    {
      name: "hasEdge",
      arg: (rng) => [rng() < 0.5, vertexArg(rng), vertexArg(rng)],
      onImpl: (impl, arg) => {
        const [directed, u, v] = arg as PairArg;
        return observe(() => impl.graph(directed).hasEdge(u, v));
      },
      onModel: (model, arg) => {
        const [directed, u, v] = arg as PairArg;
        if (!inRange(u) || !inRange(v)) return OUT_OF_RANGE;
        const graph = modelOf(model, directed);
        return graph.edges.has(edgeKey(graph, u, v));
      },
    },
    {
      name: "weight",
      arg: (rng) => [rng() < 0.5, vertexArg(rng), vertexArg(rng)],
      onImpl: (impl, arg) => {
        const [directed, u, v] = arg as PairArg;
        return observe(() => impl.graph(directed).weight(u, v));
      },
      onModel: (model, arg) => {
        const [directed, u, v] = arg as PairArg;
        if (!inRange(u) || !inRange(v)) return OUT_OF_RANGE;
        const graph = modelOf(model, directed);
        return graph.edges.get(edgeKey(graph, u, v)) ?? null;
      },
    },
    {
      name: "neighbors",
      arg: (rng) => [rng() < 0.5, vertexArg(rng)],
      onImpl: (impl, arg) => {
        const [directed, u] = arg as [boolean, number];
        const graph = impl.graph(directed);
        return observe(() => neighborList(graph.neighbors(u)));
      },
      onModel: (model, arg) => {
        const [directed, u] = arg as [boolean, number];
        if (!inRange(u)) return OUT_OF_RANGE;
        const graph = modelOf(model, directed);
        const found: number[] = [];
        for (let v = 0; v < NODES; v++) {
          if (graph.edges.has(edgeKey(graph, u, v))) found.push(v);
        }
        return found;
      },
    },
    {
      name: "vertexCount",
      arg: (rng) => [rng() < 0.5],
      onImpl: (impl, arg) => {
        const [directed] = arg as [boolean];
        return impl.graph(directed).vertexCount();
      },
      onModel: () => NODES,
    },
  ],

  edges: [
    {
      name: "처음에는 간선이 없고 정점 수는 생성 인자다",
      steps: [
        { op: "vertexCount", arg: [false] },
        { op: "vertexCount", arg: [true] },
        { op: "hasEdge", arg: [false, 0, 1] },
        { op: "weight", arg: [false, 0, 1] },
        { op: "neighbors", arg: [false, 0] },
        { op: "hasEdge", arg: [true, 4, 4] },
      ],
    },
    {
      name: "무방향 간선은 두 방향에서 같게 읽힌다",
      steps: [
        { op: "addEdge", arg: [false, 0, 1, 5] },
        { op: "hasEdge", arg: [false, 1, 0] },
        { op: "weight", arg: [false, 1, 0] },
        { op: "neighbors", arg: [false, 0] },
        { op: "neighbors", arg: [false, 1] },
        { op: "neighbors", arg: [false, 2] },
      ],
    },
    {
      name: "방향 간선은 나가는 쪽에서만 있고 반대 방향은 다른 간선이다",
      steps: [
        { op: "addEdge", arg: [true, 0, 1, 5] },
        { op: "hasEdge", arg: [true, 0, 1] },
        { op: "hasEdge", arg: [true, 1, 0] },
        { op: "weight", arg: [true, 1, 0] },
        { op: "neighbors", arg: [true, 1] },
        { op: "addEdge", arg: [true, 1, 0, 7] },
        { op: "weight", arg: [true, 0, 1] },
        { op: "weight", arg: [true, 1, 0] },
      ],
    },
    {
      name: "같은 간선을 다시 넣으면 무게만 바뀐다",
      steps: [
        { op: "addEdge", arg: [false, 0, 1, 3] },
        { op: "addEdge", arg: [false, 1, 0, 9] },
        { op: "weight", arg: [false, 0, 1] },
        { op: "neighbors", arg: [false, 0] },
        { op: "addEdge", arg: [false, 2, 3] },
        { op: "weight", arg: [false, 3, 2] },
      ],
    },
    {
      name: "제자리 간선은 이웃에 한 번 나온다",
      steps: [
        { op: "addEdge", arg: [false, 2, 2, 4] },
        { op: "hasEdge", arg: [false, 2, 2] },
        { op: "neighbors", arg: [false, 2] },
        { op: "removeEdge", arg: [false, 2, 2] },
        { op: "hasEdge", arg: [false, 2, 2] },
        { op: "weight", arg: [false, 2, 2] },
      ],
    },
    {
      // 있음 표시와 무게를 따로 드는 구현이 한쪽만 지우면 여기서 `weight` 가 갈린다.
      name: "지운 간선은 무게도 사라지고 없는 간선을 지우면 상태가 그대로다",
      steps: [
        { op: "removeEdge", arg: [false, 0, 1] },
        { op: "addEdge", arg: [false, 0, 1, 6] },
        { op: "removeEdge", arg: [false, 1, 0] },
        { op: "hasEdge", arg: [false, 0, 1] },
        { op: "weight", arg: [false, 0, 1] },
        { op: "addEdge", arg: [true, 0, 1, 2] },
        { op: "removeEdge", arg: [true, 1, 0] },
        { op: "weight", arg: [true, 0, 1] },
        { op: "neighbors", arg: [true, 0] },
      ],
    },
    {
      // 번호 `NODES` 는 정점 수와 같아 범위 밖이다. 한쪽 끝만 범위 밖인 갱신이 반쯤 적용되면 갈린다.
      name: "범위 밖 · 정수가 아닌 번호는 RangeError 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "hasEdge", arg: [false, 0, NODES] },
        { op: "weight", arg: [false, -1, 0] },
        { op: "addEdge", arg: [false, 0, NODES, 1] },
        { op: "addEdge", arg: [true, 1.5, 0, 1] },
        { op: "removeEdge", arg: [false, 0, -1] },
        { op: "neighbors", arg: [false, NODES] },
        { op: "neighbors", arg: [false, 0] },
        { op: "neighbors", arg: [true, 0] },
        { op: "vertexCount", arg: [false] },
      ],
    },
  ],

  invariants: [
    {
      name: "hasEdge 와 weight 가 간선의 있고 없음을 같게 읽는다",
      check: (impl) => {
        for (const directed of [false, true]) {
          const graph = impl.graph(directed);
          const n = graph.vertexCount();
          for (let u = 0; u < n; u++) {
            for (let v = 0; v < n; v++) {
              if (graph.hasEdge(u, v) !== (graph.weight(u, v) !== null)) {
                return `${directed ? "방향" : "무방향"} (${u}, ${v}) — hasEdge ${graph.hasEdge(u, v)} / weight ${graph.weight(u, v)}`;
              }
            }
          }
        }
        return null;
      },
    },
    {
      name: "neighbors 가 hasEdge 가 참인 정점 전부다",
      check: (impl) => {
        for (const directed of [false, true]) {
          const graph = impl.graph(directed);
          const n = graph.vertexCount();
          for (let u = 0; u < n; u++) {
            const listed = [...graph.neighbors(u)].sort((a, b) => a - b);
            const asked: number[] = [];
            for (let v = 0; v < n; v++) if (graph.hasEdge(u, v)) asked.push(v);
            if (listed.join(",") !== asked.join(",")) {
              return `${directed ? "방향" : "무방향"} neighbors(${u}) [${listed}] / hasEdge 가 참인 정점 [${asked}]`;
            }
          }
        }
        return null;
      },
    },
    {
      name: "무방향 간선은 두 방향에서 같은 무게로 읽힌다",
      check: (impl) => {
        const graph = impl.graph(false);
        const n = graph.vertexCount();
        for (let u = 0; u < n; u++) {
          for (let v = u + 1; v < n; v++) {
            if (
              graph.hasEdge(u, v) !== graph.hasEdge(v, u) ||
              !Object.is(graph.weight(u, v), graph.weight(v, u))
            ) {
              return `(${u}, ${v}) 와 (${v}, ${u}) 가 갈린다 — 무게 ${graph.weight(u, v)} / ${graph.weight(v, u)}`;
            }
          }
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      // 가운데 정점 0 에 잎 n-1 개를 잇는다. 이웃 배열에서 같은 간선을 찾는 계열이 여기서 걸린다.
      covers: ["addEdge"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const graph = impl.graph(false);
        for (let i = 0; i < n; i++) ctx.step(() => graph.addEdge(0, i % n, 1));
      },
    },
    {
      // 별의 잎을 섞은 차례로 뗀다. 넣은 차례로 떼면 앞에서 훑는 계열이 매번 첫 자리에서 찾는다.
      covers: ["removeEdge"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const graph = impl.graph(false);
        for (let i = 1; i < n; i++) graph.addEdge(0, i, 1);
        const leaves = Array.from({ length: n }, (_, i) => i);
        for (let i = leaves.length - 1; i > 0; i--) {
          const j = Math.floor(ctx.rng() * (i + 1));
          [leaves[i], leaves[j]] = [leaves[j] as number, leaves[i] as number];
        }
        for (const leaf of leaves) ctx.step(() => graph.removeEdge(0, leaf));
      },
    },
    {
      // **이 계약이 목록과 갈리는 자리다.** 가운데 정점에서 잎마다 있는지 · 무게를 묻고, 잎끼리
      // 없는 간선도 묻는다. 둘을 한 걸음에 묶는 것은 같은 칸을 읽는 두 경로라서다.
      covers: ["hasEdge", "weight"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const graph = impl.graph(false);
        for (let i = 1; i < n; i++) graph.addEdge(0, i, 1);
        for (let i = 1; i < n; i++) {
          ctx.step(() => {
            graph.hasEdge(0, i);
            graph.weight(0, i);
            graph.hasEdge(i, n - i);
          });
        }
      },
    },
    {
      // 행 하나를 끝까지 지나는 몫이 n 을 따라가는지 본다. 가운데와 잎 몇을 섞어 묻는다 — `worst`
      // 통계는 단일 호출 최대라 몇 번만 불러도 된다.
      covers: ["neighbors"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const graph = impl.graph(false);
        for (let i = 1; i < n; i++) graph.addEdge(0, i, 1);
        for (let i = 0; i < 8; i++) ctx.step(() => graph.neighbors(i));
      },
    },
    {
      covers: ["vertexCount"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.reset(n);
        const graph = impl.graph(false);
        for (let i = 0; i < n; i++) ctx.step(() => graph.vertexCount());
      },
    },
  ],
};
