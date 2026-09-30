/**
 * `heavyLightDecomposition-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 부모 · 깊이 · 부분트리 크기 · 무거운 자식 · 사슬 머리 ·
 * 자리 번호 · 기저 배열 · 걸음마다 더한 사슬 조각은 정본과 같은 절차에 걸음 기록만 덧붙인 사본
 * (`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본(`-guide.ref.ts`)과
 * 맞댄다. 시도 사다리의 수는 배열 칸을 세는 사본과 사슬만 만드는 사본(`-guide.alt.ts`)이 낸다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `heavyLightDecomposition-guide.test.ts` 가 잰다.
 *
 * **무대는 「그래프」다**(`stage: "graph"`). 전하려는 것이 「트리를 사슬로 가르고, 경로를 사슬 조각
 * 몇 개로 나눠 더한다」라서, 어느 간선이 무거운 간선이고 경로가 트리 위 어디를 지나는지가 요점이다.
 * 이웃 편 `lowestCommonAncestor` 와 같이 뿌리 0 에서 매단 트리를 `treeLayout` 으로 놓고, 무대 아래 띠에
 * 배열을 한 줄씩 적는다. 띠는 두 무리다 — 위 넷(정점 번호 · depth · size · head · pos)은 칸 차례가
 * **정점 번호**이고, 그 아래 셋(자리 번호 · 그 자리의 정점 · 기저 배열)은 칸 차례가 **자리 번호**다.
 * 무리마다 맨 위 띠가 그 번호를 적는다. 맨 아래가 답 목록이다.
 *
 * 정점 안의 값은 그 정점의 지금 값(「값 5」)이고 끝까지 뜻을 바꾸지 않는다 — 갱신이 바꾸는 것이 이
 * 값이다. 무거운 간선은 굵은 실선(`kind: "tree"`), 가벼운 간선은 가는 실선이다. 간선에 방향이 없으므로
 * `directed: false` 다.
 */

import type { ReactElement } from "react";
import { 으로 as 으로To, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphGroup,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
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
  caterpillar,
  chain,
  decompose,
  heightTrap,
  leafFirstCaterpillar,
  naiveWalk,
  plainPos,
} from "./heavyLightDecomposition-guide.alt.ts";
import {
  comma,
  list,
  maxRuns,
  maxSegments,
  opText,
  type Piece,
  pieceText,
  READY,
  stepDoing,
  stepMarks,
  stepOf,
  WALK,
  WALK_EDGES,
  WALK_N,
  WALK_OPS,
  WALK_ROOT,
  type WalkStep,
} from "./heavyLightDecomposition-guide.proof.ts";
import { hldWalk } from "./heavyLightDecomposition-guide.sim.ts";

const PARENT = READY.parent as number[];
const HEAVY = READY.heavy as number[];
const HEAD = READY.head as number[];
const POS = READY.pos as number[];
const SIZE = READY.size as number[];
const DEPTH = READY.depth as number[];

/** 뿌리 0 에서 매단 트리의 자리. 자식은 이웃 목록의 차례대로 왼쪽부터 놓는다. */
function place(): { id: number; x: number; y: number }[] {
  const children = new Map<NodeId, number[]>();
  for (let u = 0; u < WALK_N; u++) {
    children.set(
      u,
      (WALK.near[u] as number[]).filter(
        (v) => v !== WALK_ROOT && PARENT[v] === u,
      ),
    );
  }
  const xy = treeLayout([WALK_ROOT], children);
  return Array.from({ length: WALK_N }, (_, v) => {
    const p = xy.get(v) as { x: number; y: number };
    return { id: v, x: p.x, y: p.y };
  });
}

/** 입력 트리의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT: GraphLayout = {
  nodes: place(),
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

/** 간선 `e` 의 아래쪽(자식) 끝. */
const childOf = (e: number): number => {
  const [a, b] = WALK_EDGES[e] as [number, number];
  return PARENT[b] === a ? b : a;
};

/** 간선 `e` 가 무거운 간선인가 — 자식 끝이 부모의 무거운 자식이다. */
const isHeavy = (e: number): boolean => {
  const c = childOf(e);
  return HEAVY[PARENT[c] as number] === c;
};

/** 정점 `x` 와 `y` 를 잇는 간선의 차례. 없으면 -1. */
const edgeOf = (x: number, y: number): number =>
  WALK_EDGES.findIndex(
    ([a, b]) => (a === x && b === y) || (a === y && b === x),
  );

const IDS = [...Array(WALK_N).keys()];
const at = (p: number): number => POS.indexOf(p);

/** 띠 한 줄 — 아직 안 정한 칸(`null`)은 점선으로 둔다. */
function strip(
  label: string,
  values: readonly (number | null)[],
  marks: Partial<Record<number, CellState>> = {},
  show: (x: number) => string = String,
): GraphStrip {
  const states: Partial<Record<number, CellState>> = {};
  values.forEach((x, i) => {
    if (x === null) states[i] = "empty";
  });
  for (const [k, st] of Object.entries(marks)) states[Number(k)] = st;
  return {
    label,
    values: values.map((x) => (x === null ? "" : show(x))),
    states,
  };
}

interface Marks {
  depth?: Partial<Record<number, CellState>>;
  size?: Partial<Record<number, CellState>>;
  head?: Partial<Record<number, CellState>>;
  pos?: Partial<Record<number, CellState>>;
  seat?: Partial<Record<number, CellState>>;
  base?: Partial<Record<number, CellState>>;
  answer?: boolean;
}

const all = (st: CellState): Partial<Record<number, CellState>> =>
  Object.fromEntries(IDS.map((i) => [i, st]));

/** 무대 아래 띠 — 정점 번호 무리 넷, 자리 번호 무리 셋, 답 목록. */
function strips(s: WalkStep, m: Marks): GraphStrip[] {
  const seats: (number | null)[] = IDS.map((p) =>
    s.pos.includes(p) ? s.pos.indexOf(p) : null,
  );
  const answerStates: Partial<Record<number, CellState>> = {};
  if (m.answer) answerStates[s.answers.length - 1] = "focus";
  return [
    { label: "정점 v", values: IDS },
    strip("depth", s.depth, m.depth),
    strip("size", s.size, m.size),
    strip("head", s.head, m.head),
    strip("pos", s.pos, m.pos),
    { label: "자리 p", values: IDS },
    strip("그 자리의 정점", seats, m.seat),
    strip("기저 배열", s.base ?? IDS.map(() => null), m.base),
    {
      label: "답 목록",
      values: [...s.answers],
      states: answerStates,
      slots: WALK_OPS.filter((op) => op.kind === "query").length,
    },
  ];
}

/** 연산 `op` 의 경로 위 정점. */
function pathOf(opIndex: number): Set<number> {
  const steps = WALK.steps.filter((x) => x.op === opIndex);
  const out = new Set<number>();
  for (const x of steps) for (const v of x.piece?.vertices ?? []) out.add(v);
  return out;
}

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const s = WALK.steps[i] as WalkStep;
  const nodeState: Partial<Record<number, CellState>> = {};
  const edgeState: Partial<Record<number, GraphEdge["state"]>> = {};
  const groups: GraphGroup[] = [];
  const m: Marks = {};
  const known = s.heavy.every((h) => h !== null);

  if (s.kind === "lists") {
    for (const e of WALK_EDGES.keys()) edgeState[e] = "out";
  } else if (s.kind === "dfs") {
    for (const e of WALK_EDGES.keys()) edgeState[e] = "focus";
    m.depth = all("focus");
  } else if (s.kind === "size") {
    m.size = all("focus");
  } else if (s.kind === "heavy") {
    for (const e of WALK_EDGES.keys()) if (isHeavy(e)) edgeState[e] = "focus";
    const read: Partial<Record<number, CellState>> = {};
    for (const p of s.picks ?? []) {
      if (p.children.length < 2) continue;
      for (const c of p.children) read[c.c] = "read";
    }
    m.size = read;
  } else if (s.kind === "chains") {
    m.head = all("focus");
    m.pos = all("focus");
    m.seat = all("focus");
  } else if (s.kind === "fenwick") {
    m.base = all("focus");
  } else if (s.kind === "update") {
    const node = s.node as number;
    nodeState[node] = "focus";
    m.pos = { [node]: "read" };
    m.base = { [POS[node] as number]: "focus" };
  } else {
    const onPath = pathOf(s.op as number);
    const piece = s.piece as Piece;
    const now = new Set(piece.vertices);
    for (const v of IDS) {
      if (now.has(v)) nodeState[v] = "focus";
      else if (!onPath.has(v)) nodeState[v] = "out";
    }
    for (const [e, [a, b]] of WALK_EDGES.entries()) {
      if (now.has(a) && now.has(b)) edgeState[e] = "focus";
      else if (!onPath.has(a) || !onPath.has(b)) edgeState[e] = "out";
    }
    if (s.kind === "round") {
      const h = piece.vertices[0] as number;
      const jump = edgeOf(h, PARENT[h] as number);
      if (jump >= 0) edgeState[jump] = "read";
    }
    const base: Partial<Record<number, CellState>> = {};
    for (let p = 0; p < WALK_N; p++) {
      if (p >= piece.l && p <= piece.r) base[p] = "focus";
      else if (!onPath.has(at(p))) base[p] = "out";
    }
    m.base = base;
    m.head = { [s.uIn as number]: "read", [s.vIn as number]: "read" };
    if (s.kind === "round") {
      const u = s.u as number;
      const v = s.v as number;
      if (u === v) groups.push({ members: [u], label: "u = v" });
      else {
        groups.push({ members: [u], label: "u" });
        groups.push({ members: [v], label: "v" });
      }
    } else {
      m.answer = true;
    }
  }

  return {
    nodes: IDS.map((v) => {
      const st = nodeState[v];
      return { value: `값 ${s.values[v]}`, ...(st ? { state: st } : {}) };
    }),
    edges: WALK_EDGES.map((_, e) => {
      const st = edgeState[e];
      return {
        ...(known && isHeavy(e) ? { kind: "tree" as const } : {}),
        ...(st ? { state: st } : {}),
      };
    }),
    groups,
    strips: strips(s, m),
    calc: stageCalc(s),
    vars: stageVars(i),
  };
}

function stageCalc(s: WalkStep): GraphStep["calc"] {
  if (s.kind === "lists") {
    const total = WALK.near.reduce((n, l) => n + l.length, 0);
    return { expr: "near 목록 길이의 합 =", result: `${total} = 2E` };
  }
  if (s.kind === "dfs") {
    const skipped = (s.pops ?? []).reduce((n, p) => n + p.skipped.length, 0);
    return { expr: "이미 본 이웃을 건너뛴 횟수 =", result: String(skipped) };
  }
  if (s.kind === "size") {
    const kids = IDS.filter((v) => v !== WALK_ROOT && PARENT[v] === WALK_ROOT);
    return {
      expr: `size[${WALK_ROOT}] = 1 + ${kids.map((c) => `size[${c}]`).join(" + ")} =`,
      result: `1 + ${kids.map((c) => SIZE[c]).join(" + ")} = ${SIZE[WALK_ROOT]}`,
    };
  }
  if (s.kind === "heavy") {
    const p = (s.picks ?? []).find((x) => x.children.length > 1);
    if (!p) return null;
    return {
      expr: `heavy[${p.p}] = 크기가 가장 큰 자식(${p.children.map((c) => `${c.c}: ${c.size}`).join(" · ")}) =`,
      result: String(p.heavy),
    };
  }
  if (s.kind === "chains") {
    const runs = s.runs ?? [];
    return {
      expr: `사슬 ${runs.length} 개의 자리 =`,
      result: runs
        .map((r) => {
          const a = POS[r.members[0] as number] as number;
          const b = POS[r.members.at(-1) as number] as number;
          return a === b ? `${a}` : `${a}~${b}`;
        })
        .join(" · "),
    };
  }
  if (s.kind === "fenwick") {
    return { expr: "기저 배열 =", result: list(s.base as number[]) };
  }
  if (s.kind === "update") {
    const d = (s.to as number) - (s.from as number);
    return {
      expr: `delta = ${s.to} − ${s.from} =`,
      result: `${d} → ${(s.bitNodes ?? []).map((x) => `bit[${x}]`).join(" · ")}`,
    };
  }
  const piece = s.piece as Piece;
  if (s.kind === "round") {
    const hu = DEPTH[s.headU as number] as number;
    const hv = DEPTH[s.headV as number] as number;
    return {
      expr: `depth[head[${s.uIn}]] = ${hu} · depth[head[${s.vIn}]] = ${hv}`,
      result: `${pieceText(piece)} 합 ${piece.sum} → total ${s.total}`,
    };
  }
  return {
    expr: `head[${s.u}] = head[${s.v}] = ${s.headU}`,
    result: `${pieceText(piece)} 합 ${piece.sum} → 답 ${s.total}`,
  };
}

const PREP = WALK.steps.findIndex((s) => s.op !== undefined);

function stageVars(i: number): string {
  const s = WALK.steps[i] as WalkStep;
  if (s.op === undefined) return `준비 걸음 ${i + 1} / ${PREP}`;
  return `연산 ${(s.op as number) + 1} / ${WALK_OPS.length}`;
}

function stepTitle(i: number): string {
  const marks = stepMarks(i);
  return `${stepOf(i)} ${stepDoing(i)}${marks.length > 0 ? ` ${marks.join(" ")}` : ""}`;
}

function stepText(i: number): string {
  const s = WALK.steps[i] as WalkStep;
  if (s.kind === "lists") {
    return `간선 ${WALK_EDGES.length} 개를 양쪽 정점의 목록에 한 번씩 넣었습니다. 아직 어느 쪽이 부모인지 모르므로 간선을 흐리게 그리고, 아래 띠의 배열은 모두 점선입니다.`;
  }
  if (s.kind === "dfs") {
    const skipped = (s.pops ?? []).reduce((n, p) => n + p.skipped.length, 0);
    return `뿌리 ${WALK_ROOT} 에서 스택으로 따라가며 ${WALK.order.join(" → ")} 차례로 꺼냈습니다. 새로 만난 이웃마다 부모와 깊이를 적었고, 이미 본 이웃 ${skipped} 개는 건너뛰었습니다.`;
  }
  if (s.kind === "size") {
    return `꺼낸 차례를 뒤에서부터 거슬러 오며 정점마다 자기 크기를 부모에 더했습니다. 자식이 언제나 부모보다 뒤에 꺼내졌으므로, 부모 차례가 오면 그 아래가 이미 다 합쳐져 있습니다.`;
  }
  if (s.kind === "heavy") {
    const branching = (s.picks ?? []).filter((p) => p.children.length > 1);
    return `자식이 둘 이상인 정점 ${branching.map((p) => p.p).join(" · ")} 에서 크기를 비교해 가장 큰 자식을 무거운 자식으로 골랐습니다. 굵게 칠한 간선이 무거운 간선이고, 가는 간선이 가벼운 간선입니다.`;
  }
  if (s.kind === "chains") {
    const runs = s.runs ?? [];
    return `사슬 머리를 하나씩 꺼내 무거운 자식을 끝까지 따라가며 자리 번호를 이어 붙였습니다. 사슬 ${runs.length} 개가 머리 ${runs.map((r) => r.top).join(" · ")} 차례로 이어진 자리를 받았습니다.`;
  }
  if (s.kind === "fenwick") {
    return "정점 값을 자리 번호 차례로 옮겨 기저 배열을 만들고, 그 위에 펜윅 트리를 세웠습니다. 준비는 여기서 끝나고, 연산은 이 배열들을 읽기만 합니다.";
  }
  if (s.kind === "update") {
    const node = s.node as number;
    const d = (s.to as number) - (s.from as number);
    return `정점 ${node} 의 값을 ${s.from} 에서 ${s.to}${으로To(s.to as number)} 바꿨습니다. 기저 배열의 자리 ${POS[node]} 하나가 바뀌고, 펜윅 트리는 그 자리를 담는 칸 ${(s.bitNodes ?? []).length} 개에 ${d}${을를(d)} 더합니다. 사슬과 자리 번호는 그대로입니다.`;
  }
  const piece = s.piece as Piece;
  const op = WALK_OPS[s.op as number] as Extract<
    (typeof WALK_OPS)[number],
    { kind: "query" }
  >;
  if (s.kind === "round") {
    const deeper = s.swapped ? s.vIn : s.uIn;
    const h = piece.vertices[0] as number;
    return `${opText(op)} — 두 정점의 사슬 머리 ${s.headU} · ${s.headV}${이가(s.headV as number)} 달라서, 머리가 더 깊은 ${deeper} 쪽의 조각 ${pieceText(piece)}(정점 ${piece.vertices.join(" ")})${을를(piece.r)} 더했습니다. 그다음 머리 ${h} 의 부모 ${s.u}${으로To(s.u as number)} 가벼운 간선 하나를 건너 올라갑니다.`;
  }
  return `${opText(op)} — 두 정점이 같은 사슬 머리 ${s.headU}${을를(s.headU as number)} 가지니 남은 경로는 자리 번호에서 이어져 있습니다. 조각 ${pieceText(piece)}${을를(piece.r)} 더해 답 ${s.total}${을를(s.total as number)} 냅니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): ({
  title: string;
  text: string;
} & GraphStep)[] {
  return WALK.steps.map((_, i) => ({
    title: stepTitle(i),
    text: stepText(i),
    ...stage(i),
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

/* ── 정적 그림 — 걸음 재생 패널 밖 ── */

/** 정점 값만 적은 트리. */
const valueNodes = () =>
  LAYOUT.nodes.map((n) => ({
    ...n,
    value: `값 ${WALK.steps[0]?.values[n.id as number]}`,
  }));

/** `concept` — 전개 입력. */
function conceptTree(): ReactElement {
  return (
    <NodeGraph
      title={`이 글이 끝까지 쓰는 트리 — 정점 ${WALK_N} · 간선 ${WALK_EDGES.length} · 뿌리 ${WALK_ROOT}, 정점 안은 그 정점의 값`}
      directed={false}
      nodes={valueNodes()}
      edges={WALK_EDGES.map(([from, to]) => ({ from, to }))}
    />
  );
}

/** `concept` — 무거운 간선과 가벼운 간선. 정점 안은 부분트리 크기. */
function conceptChains(): ReactElement {
  const chains = new Set(HEAD).size;
  return (
    <NodeGraph
      title={`자식 중 부분트리가 가장 큰 쪽으로 이은 간선(굵은 선)이 무거운 간선이다 — 정점 안은 부분트리 크기, 사슬 ${chains} 개`}
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `size ${SIZE[n.id as number]}`,
        ...(HEAD[n.id as number] === n.id ? { state: "read" as const } : {}),
      }))}
      edges={WALK_EDGES.map(([from, to], e) => ({
        from,
        to,
        ...(isHeavy(e) ? { kind: "tree" as const } : { label: "가벼운" }),
      }))}
    />
  );
}

/** `concept` — 경로 하나를 사슬 조각으로 덮는다. */
function conceptCover(): ReactElement {
  const opIndex = 1;
  const op = WALK_OPS[opIndex] as Extract<
    (typeof WALK_OPS)[number],
    { kind: "query" }
  >;
  const steps = WALK.steps.filter((s) => s.op === opIndex);
  const pieces = (steps.at(-1)?.pieces ?? []) as Piece[];
  const onPath = pathOf(opIndex);
  const base = READY.base as number[];
  const states: Partial<Record<number, CellState>> = {};
  for (let p = 0; p < WALK_N; p++) if (!onPath.has(at(p))) states[p] = "out";
  const ranges: Range[] = pieces.map((pc, k) => ({
    from: pc.l,
    to: pc.r,
    tone: k % 2 === 0 ? "left" : "right",
    note: `조각 ${k + 1} · 머리 ${HEAD[pc.vertices[0] as number]} · 정점 ${pc.vertices.join(" ")} · 합 ${pc.sum}`,
  }));
  return (
    <RangeCover
      title={`${opText(op)} 의 경로가 기저 배열에서 조각 ${pieces.length} 개로 덮인다 — 흐린 칸은 경로 밖 정점, 답 ${steps.at(-1)?.total}`}
      indexLabel="자리 p"
      row={{ label: "기저 배열", values: base, states }}
      ranges={ranges}
    />
  );
}

/** `deep.origin` — 시도 사다리. */
function approaches(): Approach[] {
  const V = 100_000;
  const ones = Array.from({ length: V }, () => 1);
  const naivePer =
    naiveWalk(V, chain(V), 0, ones, [[0, V - 1]]).cells - (3 * V + 2 * (V - 1));
  const cv = 256;
  const ce = caterpillar(cv);
  const cd = decompose(cv, ce, 0, "size");
  const plainRuns = maxRuns(cd, plainPos(cv, ce, 0), cv);
  const trap = heightTrap(15);
  const leafFirst = leafFirstCaterpillar(255);
  return [
    {
      name: "경로를 한 정점씩 걷기",
      idea: "두 정점 중 깊은 쪽을 한 칸씩 올리며 값을 더하다가 만나는 자리에서 멈춘다",
      verdict: "drop",
      checks: [
        { label: "준비", value: "부모와 깊이만", ok: true },
        {
          label: "시간",
          value: `사슬 ${comma(V)} 정점 · 질의 ${comma(V)} 개에서 배열 칸 ${comma(naivePer * V)}`,
          ok: false,
        },
      ],
      lesson:
        "정점을 하나씩 더하지 않으려면 경로 위 정점이 배열에서 이어져 있어야 한다",
    },
    {
      name: "이웃 번호순으로 자리 번호 매기기",
      idea: "뿌리에서 따라가며 만나는 차례대로 자리 번호를 주고, 경로를 이어진 덩어리들의 합으로 낸다",
      verdict: "drop",
      checks: [
        {
          label: "덩어리",
          value: `애벌레 ${cv} 정점에서 경로 하나가 ${plainRuns} 덩어리`,
          ok: false,
        },
      ],
      lesson: "어느 자식을 부모 바로 뒤에 이어 붙이느냐가 덩어리 수를 정한다",
    },
    {
      name: "처음 만난 자식 · 가장 깊은 자식 잇기",
      idea: "부모마다 자식 하나를 골라 부모 바로 뒤에 잇는다 — 목록의 첫 자식이나 가장 깊이 내려가는 자식을 고른다",
      verdict: "drop",
      checks: [
        {
          label: "처음",
          value: `잎이 먼저 나오는 애벌레 ${leafFirst.length + 1} 정점에서 조각 ${maxSegments(leafFirst.length + 1, leafFirst, "first")}`,
          ok: false,
        },
        {
          label: "깊은",
          value: `높이 덫 ${trap.v} 정점에서 조각 ${maxSegments(trap.v, trap.edges, "deep")}`,
          ok: false,
        },
      ],
      lesson:
        "크기를 보지 않으면 안 고른 형제가 얼마나 큰지에 아무 제약이 없다",
    },
    {
      name: "무거운 경로 분할",
      idea: "부모마다 부분트리가 가장 큰 자식을 잇고, 이은 줄(사슬)마다 이어진 자리 번호를 준다",
      verdict: "keep",
      checks: [
        {
          label: "조각",
          value: `같은 두 트리에서 ${maxSegments(leafFirst.length + 1, leafFirst, "size")} · ${maxSegments(trap.v, trap.edges, "size")}`,
          ok: true,
        },
      ],
    },
  ];
}

/** `deep.build` (b) — 사슬을 기저 배열에 놓은 모습. 정점 안은 자리 번호. */
function buildChains(): ReactElement {
  const base = READY.base as number[];
  return (
    <NodeGraph
      title="사슬마다 이어진 자리 번호를 받는다 — 정점 안은 자리 번호 pos, 아래 띠는 자리 차례로 늘어놓은 정점 · 사슬 머리 · 값"
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `pos ${POS[n.id as number]}`,
        ...(HEAD[n.id as number] === n.id ? { state: "read" as const } : {}),
      }))}
      edges={WALK_EDGES.map(([from, to], e) => ({
        from,
        to,
        ...(isHeavy(e) ? { kind: "tree" as const } : {}),
      }))}
      strips={[
        { label: "자리 p", values: IDS },
        { label: "그 자리의 정점", values: IDS.map(at) },
        { label: "사슬 머리", values: IDS.map((p) => HEAD[at(p)] as number) },
        { label: "기저 배열", values: base },
      ]}
    />
  );
}

/** `deep.build` (c) — 정점 하나에서 사슬과 자리까지 읽는다. */
function buildRead(): ReactElement {
  const x = 5;
  const h = HEAD[x] as number;
  const members = IDS.filter((v) => HEAD[v] === h);
  const seats = members.map((v) => POS[v] as number);
  const base = READY.base as number[];
  const mark = (): Partial<Record<number, CellState>> => {
    const st: Partial<Record<number, CellState>> = {};
    for (const p of seats) st[p] = "read";
    st[POS[x] as number] = "focus";
    return st;
  };
  return (
    <NodeGraph
      title={`정점 ${x} 읽기 — head[${x}] = ${h} 라 사슬 ${members.join(" · ")} 에 들고, 그 사슬이 자리 ${Math.min(...seats)}~${Math.max(...seats)}${을를(Math.max(...seats))} 차지하며, pos[${x}] = ${POS[x]} 칸에 값 ${base[POS[x] as number]}${이가(base[POS[x] as number] as number)} 있다`}
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `pos ${POS[n.id as number]}`,
        ...(n.id === x
          ? { state: "focus" as const }
          : members.includes(n.id as number)
            ? { state: "read" as const }
            : {}),
      }))}
      edges={WALK_EDGES.map(([from, to], e) => ({
        from,
        to,
        ...(isHeavy(e) ? { kind: "tree" as const } : {}),
        ...(members.includes(from) && members.includes(to)
          ? { state: "focus" as const }
          : {}),
      }))}
      strips={[
        { label: "자리 p", values: IDS },
        { label: "그 자리의 정점", values: IDS.map(at), states: mark() },
        {
          label: "사슬 머리",
          values: IDS.map((p) => HEAD[at(p)] as number),
          states: mark(),
        },
        { label: "기저 배열", values: base, states: mark() },
      ]}
    />
  );
}

/** 걸음 하나를 정적 그림 한 장으로 — 패널 무대와 같은 장면이다. */
function moment(i: number, title: string): ReactElement {
  return (
    <NodeGraph title={title} {...graphScene(stage(i), { layout: LAYOUT })} />
  );
}

/** 불변식 그림의 걸음 — 둘째 질의가 둘째 바퀴를 끝낸 자리. */
const INV_STEP = WALK.steps.findIndex(
  (s, i) =>
    s.kind === "round" && WALK.steps[i + 1]?.kind === "last" && s.op === 1,
);

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tree": conceptTree,
  "concept-chains": conceptChains,
  "concept-cover": conceptCover,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(100_000)} · 연산 ≤ ${comma(100_000)} · 1 초에 배열 칸 1 억 개`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-chains": buildChains,
  "build-read": buildRead,
  "walk-film": () => <Film spec={hldWalk as unknown as PlayerSpec} />,
  "invariant-moment": () => {
    const s = WALK.steps[INV_STEP] as WalkStep;
    return moment(
      INV_STEP,
      `${stepOf(INV_STEP)} 직후 — 더한 조각은 정점 ${(s.pieces ?? []).flatMap((p) => p.vertices).join(" ")}, 아직 안 더한 것은 u = ${s.u} 와 v = ${s.v} 사이 경로다`,
    );
  },
};

/** 원고가 쓰는 반환값 문자열 — 패널의 `result` 와 같다. */
export const WALK_RESULT = list(WALK.answers);
