/**
 * `segmentTreeRangeMin-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 노드의 담당 구간과 값은 증명 사이드카의 `treeShape`
 * (값은 정본에 그 구간을 물어 받는다)와 `traced`(정본과 같은 절차에 걸음 기록만 덧붙인 판 — 부를
 * 때마다 자기 답을 정본과 맞댄다)가 내고, 시도 사다리의 수도 증명 사이드카가 실행과 식으로 낸 값이다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `segmentTreeRangeMin-guide.test.ts` 가 잰다.
 *
 * 노드 자리(`LAYOUT`)는 값이 아니라 배치다 — 뿌리 1 에서 자식 `2·node` · `2·node+1` 을 왼쪽부터
 * 놓은 트리를 `treeLayout` 으로 놓았다. 리프가 왼쪽부터 한 단위씩 자리를 받으므로 리프의 가로 자리가
 * 곧 배열 인덱스다. 노드 안에는 번호(「노드1」)와 「담당 구간 = 값」을 적는다. 간선은 부모와 자식을
 * 잇는 선이라 방향이 없다(`directed: false`).
 */

import type { ReactElement } from "react";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import {
  type GraphGroup,
  NodeGraph,
  NodeGraphFilm,
  type NodeGraphScene,
  type NodeId,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import { type Range, RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type GraphLayout,
  type GraphStep,
  graphScene,
} from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  cell,
  ladderNumbers,
  lastNum,
  MARK,
  num,
  opName,
  queryPath,
  range,
  seconds,
  stepOf,
  type TraceEvent,
  type TraceStep,
  treeShape,
  VERDICT_NAME,
  WALK,
  WALK_OPS,
  WALK_TRACE,
} from "./segmentTreeRangeMin-guide.proof.ts";
import { build, ops } from "./segmentTreeRangeMin-guide.sim.ts";

/** 트리 그림의 격자 — 노드 네모(66 px)가 이웃과 붙지 않을 만큼 띄운다. */
const UNIT = { x: 92, y: 74 } as const;

/** 전개 입력의 노드 — 번호 순서. 담당 구간과 값은 정본에서 온다. */
const SHAPE = treeShape(WALK);
const NODE_IDS = SHAPE.map((x) => x.node);
const BY_NODE = new Map(SHAPE.map((x) => [x.node, x]));

/** 부모와 자식을 잇는 간선 — 자식이 있는 노드마다 왼쪽 자식 · 오른쪽 자식 순서. */
const EDGES: [number, number][] = SHAPE.flatMap((x) =>
  x.s === x.e
    ? []
    : ([
        [x.node, 2 * x.node],
        [x.node, 2 * x.node + 1],
      ] as [number, number][]),
);

/** 트리 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT: GraphLayout = (() => {
  const children = new Map<NodeId, number[]>();
  for (const [p, c] of EDGES) children.set(p, [...(children.get(p) ?? []), c]);
  const xy = treeLayout([1], children);
  return {
    nodes: NODE_IDS.map((n) => {
      const at = xy.get(n) as { x: number; y: number };
      return { id: n, x: at.x, y: at.y, label: `노드${n}` };
    }),
    edges: EDGES.map(([from, to]) => ({ from, to })),
    directed: false,
    unit: UNIT,
  };
})();

/** 노드 안의 값 줄 — 「담당 구간 = 값」, 아직 안 채운 노드는 담당 구간만. */
const nodeText = (n: number, tree: readonly number[]): string => {
  const x = BY_NODE.get(n);
  if (!x) return "";
  const v = tree[n];
  return v === undefined || v === Number.MAX_SAFE_INTEGER
    ? range(x.s, x.e)
    : `${range(x.s, x.e)}=${cell(v)}`;
};

/** 담당 구간이 질의 구간과 한 칸도 안 겹치는가. */
const outside = (n: number, l: number, r: number): boolean => {
  const x = BY_NODE.get(n);
  return x !== undefined && (r < x.s || x.e < l);
};

/** 간선 `i` 가 노드 `n` 에서 자식으로 내려가는 간선인가. */
const fromNode = (i: number, n: number): boolean =>
  (EDGES[i] as [number, number])[0] === n;

/** 조사를 고를 때 `INF` 는 「인프」로 읽는다 — 영문 약어라 받침 판정이 따로 서지 않는다. */
const say = (v: string): string => (v === "INF" ? "인프" : v);

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

const BUILD_TOTAL = WALK_TRACE.steps.filter(
  (s) => s.event.kind === "build",
).length;
const ANSWER_SLOTS = WALK_OPS.filter((o) => o.type === "query").length;

/** 채우는 걸음 하나의 무대. */
function buildStage(k: number): GraphStep {
  const s = WALK_TRACE.steps[k] as TraceStep;
  const e = s.event as Extract<TraceEvent, { kind: "build" }>;
  const kids = e.leaf ? [] : [2 * e.node, 2 * e.node + 1];
  const nodes = NODE_IDS.map((n) => {
    const empty =
      (s.tree[n] ?? Number.MAX_SAFE_INTEGER) === Number.MAX_SAFE_INTEGER;
    let state: CellState | undefined;
    if (n === e.node) state = "focus";
    else if (kids.includes(n)) state = "read";
    else if (empty) state = "empty";
    return { value: nodeText(n, s.tree), ...(state ? { state } : {}) };
  });
  const edges = EDGES.map((_, i) =>
    kids.length > 0 && fromNode(i, e.node) ? { state: "read" as const } : {},
  );
  return {
    nodes,
    edges,
    groups: [],
    strips: [
      {
        label: "A",
        values: [...WALK],
        states: e.leaf ? { [e.s]: "read" as const } : {},
      },
    ],
    calc: e.leaf
      ? { expr: `tree[${e.node}] = A[${e.s}] =`, result: cell(e.value) }
      : {
          expr: `min(tree[${2 * e.node}], tree[${2 * e.node + 1}]) = min(${cell(e.left)}, ${cell(e.right)}) =`,
          result: cell(e.value),
        },
    vars: `채운 노드 ${k + 1} / ${BUILD_TOTAL}`,
  };
}

function buildTitle(k: number): string {
  const e = (WALK_TRACE.steps[k] as TraceStep).event as Extract<
    TraceEvent,
    { kind: "build" }
  >;
  return `${stepOf(k)} 노드${e.node} ${range(e.s, e.e)} 채우기`;
}

function buildText(k: number): string {
  const e = (WALK_TRACE.steps[k] as TraceStep).event as Extract<
    TraceEvent,
    { kind: "build" }
  >;
  const v = cell(e.value);
  if (e.leaf) {
    return `담당 구간이 한 칸이라 리프입니다. A[${e.s}] = ${v}${을를(v)} 그대로 씁니다.`;
  }
  const a = 2 * e.node;
  const b = 2 * e.node + 1;
  return `자식 노드${a}${과와(a)} 노드${b}${이가(b)} 먼저 채워졌습니다. 두 값 ${cell(e.left)} · ${cell(e.right)} 가운데 작은 ${v}${을를(v)} 씁니다.`;
}

/** 연산 걸음 하나의 무대. */
function opStage(k: number): GraphStep {
  const s = WALK_TRACE.steps[k] as TraceStep;
  const e = s.event;
  if (e.kind === "build") throw new Error("채우는 걸음은 buildStage 가 맡는다");
  const op = WALK_OPS[e.op];
  const kids =
    e.kind === "pull" || e.kind === "combine"
      ? [2 * e.node, 2 * e.node + 1]
      : [];
  const nodes = NODE_IDS.map((n) => {
    let state: CellState | undefined;
    if (e.kind === "leaf" || e.kind === "pull") {
      if (n === e.node) state = "focus";
      else if (e.kind === "pull" && kids.includes(n)) state = "read";
    } else if (op?.type === "query") {
      if (n === e.node && e.kind === "visit" && e.verdict === "inside")
        state = "read";
      else if (outside(n, op.l, op.r)) state = "out";
    }
    return { value: nodeText(n, s.tree), ...(state ? { state } : {}) };
  });
  const edges = EDGES.map((_, i) =>
    kids.length > 0 && fromNode(i, e.node) ? { state: "read" as const } : {},
  );
  const groups: GraphGroup[] =
    e.kind === "visit"
      ? [
          {
            members: [e.node],
            label: `${VERDICT_NAME[e.verdict]} ${MARK[e.verdict]}`,
            state: "focus",
          },
        ]
      : e.kind === "combine"
        ? [{ members: [e.node], label: "두 답을 합친다 ③", state: "focus" }]
        : [];
  const prev = (WALK_TRACE.steps[k - 1] as TraceStep).answers.length;
  const pushed: Partial<Record<number, CellState>> =
    s.answers.length > prev ? { [s.answers.length - 1]: "focus" } : {};
  return {
    nodes,
    edges,
    groups,
    strips: [
      {
        label: "답",
        values: [...s.answers],
        states: pushed,
        slots: ANSWER_SLOTS,
      },
    ],
    calc: opCalc(e),
    vars: op ? opName(op) : null,
  };
}

function opCalc(e: TraceEvent): GraphStep["calc"] {
  if (e.kind === "visit") {
    if (e.verdict === "disjoint")
      return { expr: `${e.r} < ${e.s} 또는 ${e.e} < ${e.l} →`, result: "INF" };
    if (e.verdict === "inside")
      return { expr: `tree[${e.node}] =`, result: cell(e.value) };
    return {
      expr: `${range(e.s, e.e)} 가 ${range(e.l, e.r)} 에 걸친다 →`,
      result: "자식 둘에게",
    };
  }
  if (e.kind === "combine")
    return {
      expr: `min(${cell(e.left)}, ${cell(e.right)}) =`,
      result: cell(e.value),
    };
  if (e.kind === "leaf")
    return { expr: `tree[${e.node}] =`, result: cell(e.v) };
  if (e.kind === "pull")
    return {
      expr: `min(tree[${2 * e.node}], tree[${2 * e.node + 1}]) = min(${cell(e.left)}, ${cell(e.right)}) =`,
      result: cell(e.value),
    };
  return null;
}

function opTitle(k: number): string {
  const e = (WALK_TRACE.steps[k] as TraceStep).event;
  if (e.kind === "build") throw new Error("채우는 걸음은 buildTitle 이 맡는다");
  const op = opName(WALK_OPS[e.op] as (typeof WALK_OPS)[number]);
  const at = `노드${e.node} ${range(e.s, e.kind === "leaf" ? e.s : e.e)}`;
  if (e.kind === "visit")
    return `${stepOf(k)} ${op} — ${at} ${VERDICT_NAME[e.verdict]} ${MARK[e.verdict]}`;
  if (e.kind === "combine")
    return `${stepOf(k)} ${op} — ${at} 두 답을 합친다 ③`;
  if (e.kind === "leaf") return `${stepOf(k)} ${op} — ${at} 리프에 쓴다 ④`;
  return `${stepOf(k)} ${op} — ${at} 다시 계산한다 ⑤`;
}

function opText(k: number): string {
  const s = WALK_TRACE.steps[k] as TraceStep;
  const e = s.event;
  if (e.kind === "build") throw new Error("채우는 걸음은 buildText 가 맡는다");
  const q = range(e.s, e.kind === "leaf" ? e.s : e.e);
  if (e.kind === "visit") {
    const lr = range(e.l, e.r);
    if (e.verdict === "disjoint") {
      return `담당 구간 ${q}${이가(lastNum(q))} 질의 ${lr}${과와(lastNum(lr))} 한 칸도 안 겹칩니다. 답에 아무것도 보태지 않도록 INF 를 돌려줍니다.`;
    }
    if (e.verdict === "inside") {
      const v = cell(e.value);
      const tail =
        e.node === 1
          ? ` 뿌리에서 끝났으니 ${v}${이가(v)} 이 질의의 답입니다.`
          : "";
      return `담당 구간 ${q}${이가(lastNum(q))} 질의 ${lr} 안에 통째로 들어갑니다. 적어 둔 값 ${v}${을를(v)} 그대로 돌려줍니다.${tail}`;
    }
    return `담당 구간 ${q}${이가(lastNum(q))} 질의 ${lr}${과와(lastNum(lr))} 겹치지만 통째로 들어가지는 않습니다. 자식 둘에게 나눠 묻습니다.`;
  }
  if (e.kind === "combine") {
    const v = cell(e.value);
    return `왼쪽 자식이 ${cell(e.left)}, 오른쪽 자식이 ${cell(e.right)}${을를(say(cell(e.right)))} 돌려줬습니다. 작은 ${v}${이가(v)} 이 질의의 답입니다.`;
  }
  if (e.kind === "leaf") {
    return `A[${e.i}] 의 리프에 닿았습니다. 옛 값 ${cell(e.old)} 대신 새 값 ${cell(e.v)}${을를(cell(e.v))} 씁니다. 조상 노드는 아직 옛 값입니다.`;
  }
  const a = 2 * e.node;
  const b = 2 * e.node + 1;
  const v = cell(e.value);
  return `자식 노드${a}${과와(a)} 노드${b}${을를(b)} 다시 읽어 min(${cell(e.left)}, ${cell(e.right)}) = ${v}${을를(v)} 씁니다. 옛 값은 ${cell(e.old)} 였습니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): { build: SimStep[]; ops: SimStep[] } {
  const out = { build: [] as SimStep[], ops: [] as SimStep[] };
  for (const [k, s] of WALK_TRACE.steps.entries()) {
    if (s.event.kind === "build") {
      out.build.push({
        title: buildTitle(k),
        text: buildText(k),
        ...buildStage(k),
      });
    } else {
      out.ops.push({ title: opTitle(k), text: opText(k), ...opStage(k) });
    }
  }
  return out;
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

/* ── 정적 그림 — 걸음 재생 패널 밖 ── */

/** 트리 한 벌의 장면 — 노드 안은 「담당 구간 = 값」. */
function treeScene(
  tree: readonly number[],
  states: Partial<Record<number, CellState>> = {},
  groups?: GraphGroup[],
  strip = true,
): NodeGraphScene {
  const scene = graphScene(
    {
      nodes: NODE_IDS.map((n) => ({
        value: nodeText(n, tree),
        ...(states[n] ? { state: states[n] } : {}),
      })),
      edges: EDGES.map(() => ({})),
      ...(groups ? { groups } : {}),
      ...(strip ? { strips: [{ label: "A", values: [...WALK] }] } : {}),
    },
    { layout: LAYOUT },
  );
  return scene;
}

/** 트리를 다 채운 뒤의 값 — 채우는 마지막 걸음의 기록. */
const BUILT = (
  WALK_TRACE.steps.filter((s) => s.event.kind === "build").at(-1) as TraceStep
).tree;

/** `concept` — 전개 입력의 세그먼트 트리. */
function conceptTree(): ReactElement {
  return (
    <NodeGraph
      title={`세그먼트 트리 — A = [${WALK.join(", ")}] 의 노드 ${SHAPE.length} 개, 노드 안은 담당 구간과 그 최솟값`}
      {...treeScene(BUILT)}
    />
  );
}

/** `concept` — 질의 [1,3] 을 겹치지 않는 조각으로 덮기. */
function cover(l: number, r: number): Range[] {
  const p = queryPath(WALK, l, r);
  return [
    {
      from: l,
      to: r,
      tone: "query",
      note: `질의 ${range(l, r)} · ${r - l + 1} 칸`,
    },
    ...p.read.map((n, k): Range => {
      const x = BY_NODE.get(n);
      return {
        from: x?.s ?? 0,
        to: x?.e ?? 0,
        tone: k % 2 === 0 ? "left" : "right",
        note: `노드${n} ${range(x?.s ?? 0, x?.e ?? 0)} · 값 ${cell(x?.value)}`,
      };
    }),
  ];
}

/** `concept` — 원소 하나를 고친 뒤의 트리. 값이 바뀐 노드를 새로 씀으로 칠한다. */
function conceptUpdate(): ReactElement {
  const upd = WALK_OPS.findIndex((o) => o.type === "update");
  const last = WALK_TRACE.steps.filter(
    (s) => s.event.kind !== "build" && s.event.op === upd,
  );
  const after = (last.at(-1) as TraceStep).tree;
  const changed = NODE_IDS.filter((n) => after[n] !== BUILT[n]);
  const u = WALK_OPS[upd] as { type: "update"; i: number; v: number };
  const states: Partial<Record<number, CellState>> = {};
  for (const n of changed) states[n] = "focus";
  return (
    <NodeGraph
      title={`A[${u.i}]${을를(u.i)} ${u.v}${으로(u.v)} 고친 뒤 — 값이 바뀐 노드 ${changed.length} 개(${changed.map((n) => `노드${n}`).join(" · ")})가 리프에서 뿌리까지 한 줄기다`}
      {...treeScene(after, states, undefined, false)}
    />
  );
}

/** `deep.build` (b) — 노드마다 배열의 어느 자리를 맡는가. 깊이마다 한 묶음. */
function nodeBars(): LayerBar[][] {
  const maxD = Math.max(...SHAPE.map((x) => x.depth));
  return Array.from({ length: maxD + 1 }, (_, d) =>
    SHAPE.filter((x) => x.depth === d)
      .sort((a, b) => a.s - b.s)
      .map((x) => ({
        label: `깊이 ${d} 노드${x.node}`,
        from: x.s,
        to: x.e,
        note: `${range(x.s, x.e)} 의 최솟값 ${cell(x.value)}`,
      })),
  );
}

/** `deep.origin` — 시도 사다리. 수는 전부 증명 사이드카가 실행과 식에서 낸다. */
function approaches(): Approach[] {
  const n = ladderNumbers();
  const mib = (cells: number) => ((cells * 8) / 1024 / 1024).toFixed(2);
  return [
    {
      name: "질의마다 차례로 읽기",
      idea: "질의가 올 때마다 구간을 처음부터 끝까지 읽고, 갱신은 배열 칸 하나를 고친다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `배열 접근 ${num(n.scan)} 번 · ${seconds(n.scan)}`,
          ok: false,
        },
        { label: "메모리", value: "더 적어 두는 칸이 없다", ok: true },
      ],
      lesson:
        "질의 하나가 구간 길이만큼 읽는다 — 최솟값을 미리 적어 두면 어떨까",
    },
    {
      name: "접두 최솟값 표",
      idea: "앞에서부터 누적한 최솟값을 칸마다 적어 두고, 칸 하나로 답한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `질의 ${n.prefix.q} 에 정답 ${n.prefix.want} 대신 ${n.prefix.got}`,
          ok: false,
        },
        { label: "시간", value: "질의 하나에 칸 하나", ok: true },
      ],
      lesson:
        "최솟값은 앞부분을 덜어 낼 수 없다 — 시작이 0 이 아닌 구간도 적어 두면 어떨까",
    },
    {
      name: "Sparse Table",
      idea: "칸 수가 2ᵏ 인 구간을 모든 시작 자리에 적고, 질의는 겹치는 두 조각으로 덮는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "질의", value: "칸 두 개", ok: true },
        {
          label: "갱신",
          value: `가운데 원소 하나를 덮는 칸 ${num(n.sparseCover)} 개 · 합 ${num(n.sparse)} 번 · ${seconds(n.sparse)}`,
          ok: false,
        },
      ],
      lesson:
        "칸이 겹쳐 있어서 원소 하나를 여러 칸이 덮는다 — 겹치지 않게 나눈 묶음이면 어떨까",
    },
    {
      name: n.blockName,
      idea: "배열을 B 칸씩 끊어 묶음마다 최솟값을 적고, 질의는 온전한 묶음과 양 끝 칸을 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `배열 접근 ${num(n.block)} 번 · ${seconds(n.block)}`,
          ok: true,
        },
        {
          label: "두 비용",
          value: `1,024 칸에서 B 를 1 → 32 로 키우면 질의 ${num(n.b1.query)} → ${num(n.b32.query)}, 갱신 ${num(n.b1.update)} → ${num(n.b32.update)}`,
          ok: false,
        },
      ],
      lesson:
        "묶음 크기가 하나라 질의와 갱신을 함께 줄이지 못한다 — 크기가 다른 묶음을 반씩 갈라 층층이 두면 어떨까",
    },
    {
      name: "반씩 가른 구간으로 덮기",
      idea: "구간을 반씩 갈라 조각마다 최솟값을 적고, 질의는 겹치지 않는 조각 몇 개로 덮는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `배열 접근 ${num(n.seg)} 번 · ${seconds(n.seg)}`,
          ok: true,
        },
        {
          label: "메모리",
          value: `${num(n.segCells)} 칸 · 8 바이트씩 ${mib(n.segCells)} MiB`,
          ok: true,
        },
      ],
    },
  ];
}

/** 불변식 — 갱신이 리프만 쓴 순간. 조상 둘이 아직 옛 값이다. */
function invariantMoment(): ReactElement {
  const k = WALK_TRACE.steps.findIndex((s) => s.event.kind === "leaf");
  const s = WALK_TRACE.steps[k] as TraceStep;
  const e = s.event as Extract<TraceEvent, { kind: "leaf" }>;
  const after = WALK.slice();
  after[e.i] = e.v;
  const truth = new Map(treeShape(after).map((x) => [x.node, x.value]));
  const stale = NODE_IDS.filter((n) => s.tree[n] !== truth.get(n));
  const states: Partial<Record<number, CellState>> = { [e.node]: "focus" };
  const groups: GraphGroup[] = stale.map((n) => ({
    members: [n],
    label: `옛 값 — 참값 ${cell(truth.get(n))}`,
  }));
  return (
    <NodeGraph
      title={`${stepOf(k)} 직후 — 리프 노드${e.node} 만 ${cell(e.v)}${으로(cell(e.v))} 바뀌었고, 담당 구간의 최솟값과 어긋난 노드 ${stale.length} 개(${stale.map((n) => `노드${n}`).join(" · ")})`}
      {...treeScene(s.tree, states, groups, false)}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tree": conceptTree,
  "concept-cover": () => (
    <RangeCover
      title="구간 [1,3] 을 겹치지 않는 노드 셋으로 덮기"
      row={{ label: "A 의 값", values: WALK }}
      indexLabel="인덱스"
      ranges={cover(1, 3)}
    />
  ),
  "concept-update": conceptUpdate,
  "origin-approaches": () => {
    const steps = approaches();
    const n = ladderNumbers();
    return (
      <ApproachLadder
        title={`시도한 방법 ${steps.length} 가지 — 하나가 남았다`}
        constraint={`제약 N = Q = ${num(n.N)} · 갱신과 질의 절반씩 · 시간 1 초 · 메모리 256 MB(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-bars": () => (
    <LayerBars
      title="노드마다 맡는 자리 — 깊이마다 한 묶음"
      values={WALK}
      indexLabel="인덱스"
      groups={nodeBars()}
    />
  ),
  "walk-build": () => <Film spec={build as unknown as PlayerSpec} />,
  "walk-ops": () => <Film spec={ops as unknown as PlayerSpec} />,
  "invariant-moment": invariantMoment,
};
