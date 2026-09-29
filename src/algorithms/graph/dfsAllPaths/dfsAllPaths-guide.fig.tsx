/**
 * `dfsAllPaths-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 경로 · 표시 · 상태 공간 트리의 마디는 정본과 같은 절차에
 * 기록만 덧붙인 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수는 증명 사이드카가 실행과 맞대어 확인한 식에서 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `dfsAllPaths-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 정점 0 에서 두 갈래가 아래로 갈리고, 막다른 정점 5 는
 * 오른쪽 아래, 간선이 하나도 없는 정점 3 은 오른쪽 위에 떨어뜨려 둔다.
 */

import type { ReactElement } from "react";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type EdgeKind,
  type GraphEdge,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
  type NodeId,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import { grid, trap } from "./dfsAllPaths-guide.alt.ts";
import {
  ladderNumbers,
  type Step,
  show,
  WALK,
  WALK_EDGES,
  WALK_N,
  WALK_S,
  WALK_T,
} from "./dfsAllPaths-guide.proof.ts";
import { allPathsWalk } from "./dfsAllPaths-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1, y: 0 },
    { id: 1, x: 0, y: 1 },
    { id: 2, x: 2, y: 1 },
    { id: 3, x: 3.2, y: 0 },
    { id: 4, x: 1, y: 2 },
    { id: 5, x: 3.2, y: 2 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: true,
};

/** 간선 번호 — 방향이 있으므로 `a → b` 만 찾는다. */
const edgeIndex = (a: number, b: number): number =>
  WALK_EDGES.findIndex(([u, v]) => u === a && v === b);

/** path 위의 간선들 — 그림에서 굵은 실선(`tree`)으로 그린다. */
function pathEdges(path: readonly number[]): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i + 1 < path.length; i++)
    out.add(edgeIndex(path[i] as number, path[i + 1] as number));
  return out;
}

const PATH_SLOTS = Math.max(...WALK.steps.map((s) => s.path.length), 1);
const RESULT_SLOTS = Math.max(...WALK.result.map((p) => p.length), 1);

/* ── 「아이디어를 떠올리는 과정」의 시도 다섯 — 수치는 실행과, 실행으로 확인한 식에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "정점 나열을 전부 만들어 거르기",
      idea: "두 끝 사이에 올 정점의 나열을 전부 만들고, 나열마다 간선으로 이어지는지 확인한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${n.big} 개에서 간선 확인 ${n.naiveChecks} 번 · ${n.naiveSeconds}`,
          ok: false,
        },
      ],
      lesson:
        "후보 대부분이 간선으로 이어지지 않았다 — 지금 정점의 이웃으로만 한 칸씩 늘리자",
    },
    {
      name: "간선을 따라 한 칸씩 늘리기, 표시 없이",
      idea: "지금 정점의 이웃 목록을 따라 경로를 늘리고, 도착 정점에서 담는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `사이클이 있는 전개 입력에서 ${n.noMark}`,
          ok: false,
        },
      ],
      lesson:
        "경로 안에 이미 있는 정점으로 다시 들어갔다 — 경로 안에 있는 정점을 표시해 거르자",
    },
    {
      name: "순회의 방문 표시 그대로 쓰기",
      idea: "정점에 들어갈 때 표시를 켜고, 한 번 켠 표시는 끝까지 둔다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력의 경로 ${n.want} 개 가운데 ${n.globalGot} 개만 나온다`,
          ok: false,
        },
      ],
      lesson:
        "앞 경로가 지나간 정점이 다음 경로를 막았다 — 경로에서 빠질 때 표시를 지우자",
    },
    {
      name: "되돌아갈 때 표시만 지우기",
      idea: "되돌아가는 자리에서 표시를 지우되, path 에서는 빼지 않는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `다이아몬드에서 ${n.noPopGot}`,
          ok: false,
        },
      ],
      lesson: "표시와 path 가 어긋났다 — 켠 자리와 짝을 맞춰 둘 다 되돌리자",
    },
    {
      name: "되돌아갈 때 표시를 지우고 path 에서도 빼기",
      idea: "들어갈 때 표시를 켜고 path 에 담고, 나올 때 표시를 지우고 path 에서 뺀다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전개 입력에서 진입 ${n.enters} 번 — 들어간 부분 경로 수만큼`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const TOTAL_ENTERS = WALK.enters;

/** 걸음 하나의 무대. */
function stage(st: Step): GraphStep {
  const onPath = new Set(st.marks);
  const nodes = Array.from({ length: WALK_N }, (_, v) => {
    const at = st.path.indexOf(v);
    if (st.kind === "leave" && st.popped.includes(v))
      return { value: "지움", state: "focus" as const };
    if (!onPath.has(v)) return { value: "", state: "empty" as const };
    let state: CellState | undefined;
    if (st.kind === "enter" && v === st.u) state = "focus";
    return { value: `path[${at}]`, ...(state ? { state } : {}) };
  });
  const tree = pathEdges(st.path);
  const came = st.kind === "enter" && st.v >= 0 ? edgeIndex(st.v, st.u) : -1;
  const blocked = st.kind === "skip" ? edgeIndex(st.u, st.v) : -1;
  if (st.kind === "skip") {
    const blockedNode = nodes[st.v];
    if (blockedNode) nodes[st.v] = { ...blockedNode, state: "read" };
  }
  const edges = WALK_EDGES.map((_, i) => {
    const kind: EdgeKind | undefined =
      i === blocked ? "back" : tree.has(i) ? "tree" : undefined;
    const state: GraphEdge["state"] =
      i === came ? "focus" : i === blocked ? "read" : undefined;
    return {
      ...(kind ? { kind } : {}),
      ...(state ? { state } : {}),
      ...(i === blocked ? { label: "건너뜀" } : {}),
    };
  });
  const pathStates: Partial<Record<number, CellState>> = {};
  if (st.kind === "enter") pathStates[st.path.length - 1] = "focus";
  const strips: GraphStrip[] = [
    {
      label: "path",
      values: [...st.path],
      states: pathStates,
      slots: PATH_SLOTS,
    },
    ...WALK.result.map((_, r) => {
      const got = st.results[r];
      const states: Partial<Record<number, CellState>> = {};
      if (st.hit && r === st.results.length - 1 && got)
        for (let i = 0; i < got.length; i++) states[i] = "focus";
      return {
        label: `result[${r}]`,
        values: got ? [...got] : [],
        states,
        slots: RESULT_SLOTS,
      };
    }),
  ];
  const calc: GraphStep["calc"] =
    st.kind === "enter"
      ? st.hit
        ? { expr: `${st.u} === target →`, result: "참" }
        : st.v < 0
          ? { expr: `walk(${st.u}) · ${st.u} === target →`, result: "거짓" }
          : { expr: `onPath[${st.u}] →`, result: "거짓" }
      : st.kind === "skip"
        ? { expr: `onPath[${st.v}] →`, result: "참" }
        : { expr: `onPath[${st.popped.join(", ")}] ←`, result: "거짓" };
  return {
    nodes,
    edges,
    strips,
    calc,
    vars: `진입 ${st.enters} / ${TOTAL_ENTERS}`,
  };
}

function stepTitle(st: Step): string {
  if (st.kind === "enter") {
    if (st.hit) return `${st.id} walk(${st.u}) 에 들어가 경로를 담는다 — ①`;
    return st.v < 0
      ? `${st.id} 출발 정점 ${st.u} 에서 walk 를 시작한다`
      : `${st.id} walk(${st.u}) 에 들어간다 — ③`;
  }
  if (st.kind === "skip")
    return `${st.id} 이웃 ${st.v}${이가(st.v)} 경로 안에 있어 건너뛴다 — ②`;
  return `${st.id} ${st.popped.join(" · ")} 에서 되돌아간다 — 표시를 지운다`;
}

function stepText(st: Step): string {
  if (st.kind === "enter") {
    const mark = `정점 ${st.u} 의 표시를 켜고 path 끝에 담습니다.`;
    if (st.hit) {
      const p = show(st.path);
      return `${mark} 도착 정점이라 path ${p}${을를(said(p))} 복사해 result 에 담고, 이웃 목록은 읽지 않습니다.`;
    }
    const list = show(WALK.adj[st.u] as number[]);
    return st.v < 0
      ? `${mark} 도착 정점이 아니라 이웃 목록 ${list}${을를(said(list))} 차례로 봅니다.`
      : `정점 ${st.v} 의 이웃 ${st.u}${은는(st.u)} 경로에 없어 한 칸 내려갑니다. ${mark}`;
  }
  if (st.kind === "skip")
    return `정점 ${st.u} 의 이웃 ${st.v}${은는(st.v)} 이미 경로 안에 있습니다. 다시 담으면 같은 정점이 두 번 들어가므로 건너뜁니다.`;
  const back = st.path.at(-1);
  const lastCall = st.popped.at(-1) as number;
  return `${st.popped.map((x) => `walk(${x})`).join(" · ")}${이가(lastCall)} 끝나 ${st.popped.join(" · ")} 의 표시를 지우고 path 에서 뺍니다. ${back === undefined ? "path 가 비어 전체가 끝납니다." : `정점 ${back} 의 다음 이웃으로 이어갑니다.`}`;
}

/** 조사를 고를 때 읽는 앞말 — 닫는 괄호는 소리가 없으니 떼고 마지막 수를 읽는다. */
const said = (t: string): string => t.replace(/[\]})]+$/, "");

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return WALK.steps.map((st) => ({
    title: stepTitle(st),
    text: stepText(st),
    ...stage(st),
  }));
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
function Film({ spec }: { spec: PlayerSpec }) {
  return (
    <NodeGraphFilm
      title={spec.title}
      frames={playerFrames(spec).map((f) => ({
        id: f.id,
        text: f.calc ? `${f.title} · ${f.calc.expr} ${f.calc.result}` : f.title,
        scene: f.scene ?? { nodes: [], edges: [] },
      }))}
    />
  );
}

/* ── 정적 그림들 ── */

/** 전개 입력과 그 위의 세 경로 — 띠 하나가 경로 하나다. */
function conceptPaths(): ReactElement {
  const used = new Set<number>();
  for (const p of WALK.result) for (const i of pathEdges(p)) used.add(i);
  return (
    <NodeGraph
      title={`전개 입력 — 정점 ${WALK_S} 에서 ${WALK_T} 까지의 단순 경로 ${WALK.result.length} 개`}
      directed
      nodes={LAYOUT.nodes.map((n) => {
        const inPath = WALK.result.some((p) => p.includes(n.id));
        const value =
          n.id === WALK_S
            ? "출발"
            : n.id === WALK_T
              ? "도착"
              : inPath
                ? ""
                : "경로 밖";
        return inPath
          ? { ...n, value }
          : { ...n, value, state: "out" as const };
      })}
      edges={WALK_EDGES.map(([from, to], i) => ({
        from,
        to,
        ...(used.has(i) ? { kind: "tree" as const } : {}),
      }))}
      strips={WALK.result.map((p, i) => ({
        label: `경로 ${i + 1}`,
        values: [...p],
      }))}
    />
  );
}

/** 상태 공간 트리 — 마디 하나가 진입 하나, 마디 이름은 끝 정점, 값은 뿌리부터의 path. */
function buildTree(): ReactElement {
  const id = (i: number): NodeId => `m${i}`;
  const children = new Map<NodeId, NodeId[]>();
  WALK.nodes.forEach((x, i) => {
    if (x.parent < 0) return;
    const list = children.get(id(x.parent)) ?? [];
    list.push(id(i));
    children.set(id(x.parent), list);
  });
  const xy = treeLayout([id(0)], children);
  const kidsOf = (i: number) => children.get(id(i))?.length ?? 0;
  return (
    <NodeGraph
      title="전개 입력의 상태 공간 트리 — 마디 이름은 끝 정점, 값은 뿌리부터의 path"
      directed
      unit={{ x: 92, y: 80 }}
      nodes={WALK.nodes.map((x, i) => {
        const last = x.path.at(-1) as number;
        const state: CellState | undefined =
          last === WALK_T ? "focus" : kidsOf(i) === 0 ? "out" : undefined;
        return {
          id: id(i),
          label: String(last),
          ...(xy.get(id(i)) as { x: number; y: number }),
          value: x.path.join(" "),
          ...(state ? { state } : {}),
        };
      })}
      edges={WALK.nodes.flatMap((x, i) =>
        x.parent < 0
          ? []
          : [{ from: id(x.parent), to: id(i), kind: "tree" as const }],
      )}
      strips={[
        {
          label: "답이 된 마디",
          values: WALK.nodes.flatMap((x, i) =>
            x.path.at(-1) === WALK_T ? [i + 1] : [],
          ),
        },
        {
          label: "막다른 마디",
          values: WALK.nodes.flatMap((x, i) =>
            x.path.at(-1) !== WALK_T && kidsOf(i) === 0 ? [i + 1] : [],
          ),
        },
      ]}
    />
  );
}

/** 덫 그래프 — 막다른 무리 1 … k 에서 도착 정점으로 가는 간선이 없다. */
function altTrap(): ReactElement {
  const k = 4;
  const g = trap(k);
  const spot: Record<number, { x: number; y: number }> = {
    0: { x: 0, y: 1 },
    1: { x: 1.3, y: 1 },
    2: { x: 2.6, y: 0.2 },
    3: { x: 3.9, y: 1 },
    4: { x: 2.6, y: 1.8 },
    [g.t]: { x: 0, y: -0.4 },
  };
  return (
    <NodeGraph
      title={`덫 그래프 k = ${k} — 무리 1 … ${k} 에서 도착 정점 ${g.t} 로 가는 간선이 없다`}
      directed
      nodes={Array.from({ length: g.n }, (_, v) => ({
        id: v,
        ...(spot[v] as { x: number; y: number }),
        value: v === 0 ? "출발" : v === g.t ? "도착" : "",
        ...(v === g.t ? { state: "focus" as const } : {}),
      }))}
      edges={g.edges.map(([from, to]) => ({
        from,
        to,
        ...(from === 0 && to === g.t ? { kind: "tree" as const } : {}),
      }))}
      groups={[
        {
          members: Array.from({ length: k }, (_, i) => i + 1),
          label: `막다른 무리 — 정점 ${k} 개가 서로 전부 이어진다`,
        },
      ]}
    />
  );
}

/** 오른쪽 · 아래로만 가는 m = 2 격자. */
function mathGrid(): ReactElement {
  const m = 2;
  const g = grid(m);
  return (
    <NodeGraph
      title={`m = ${m} 격자 — 오른쪽과 아래로만 간선이 있다`}
      directed
      unit={{ x: 104, y: 76 }}
      nodes={Array.from({ length: g.n }, (_, v) => ({
        id: v,
        x: v % (m + 1),
        y: Math.floor(v / (m + 1)),
        value: `(${Math.floor(v / (m + 1))},${v % (m + 1)})`,
        ...(v === 0 || v === g.t ? { state: "focus" as const } : {}),
      }))}
      edges={g.edges.map(([from, to]) => ({ from, to }))}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-paths": conceptPaths,
  "origin-approaches": () => {
    const steps = approaches();
    const n = ladderNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`정점 ${n.big} 개 · 단순 연산 1 초에 1 억 번 기준 · 전개 입력은 정점 ${WALK_N} 개`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-tree": buildTree,
  "walk-paths": () => <Film spec={allPathsWalk as unknown as PlayerSpec} />,
  "alt-trap": altTrap,
  "math-grid": mathGrid,
};
