/**
 * `articulationPoints-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 단절점은 정본(`-guide.ref.ts`)이 낸 답이고, 발견 순서 ·
 * low 값 · 간선 종류 · 걸음마다의 상태는 정본과 같은 절차에 세는 자리만 덧붙인 사본(`-guide.proof.ts`
 * 의 `counted`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `articulationPoints-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 삼각형 `0−1−2` 를 왼쪽에, 꼬리 `0−3−4` 를 오른쪽으로
 * 늘어뜨려 단절점 0 과 3 이 목이 되는 자리에 오게 했다. 나무 모양 그림은 좌표를 손으로 두지 않고
 * 실행이 낸 부모 관계에서 `treeLayout` 으로 낸다. 간선에 방향이 없으므로 `directed: false` 다.
 */

import type { ReactElement } from "react";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type EdgeKind,
  type GraphEdge,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  BRIDGE_EDGES,
  BRIDGE_N,
  bfsRule,
  blocks,
  byDeletion,
  candidateAnswer,
  comma,
  counted,
  E_LIMIT,
  type EdgeKindKo,
  ed,
  OPS_PER_SEC,
  type Step,
  tree,
  V_LIMIT,
  WALK_EDGES,
  WALK_N,
} from "./articulationPoints-guide.proof.ts";
import { articulationPoints } from "./articulationPoints-guide.ref.ts";
import { apWalk } from "./articulationPoints-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1, y: 0 },
    { id: 1, x: 0, y: 1.2 },
    { id: 2, x: 2, y: 1.2 },
    { id: 3, x: 3, y: 0 },
    { id: 4, x: 4.2, y: 0 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const RUN = counted(WALK_N, WALK_EDGES);
const ANSWER = articulationPoints(WALK_N, WALK_EDGES);
const E = WALK_EDGES.length;
const SLOTS = 2 * E;

const KIND: Record<EdgeKindKo, EdgeKind> = {
  나무: "tree",
  되돌아감: "back",
};
const kindOf = (k: EdgeKindKo | null | undefined): EdgeKind =>
  k === null || k === undefined ? "plain" : KIND[k];

/** 나무 모양 그림의 격자 — 깊이 사이를 넓혀 나무 간선이 보이게 한다. */
const TREE_UNIT = { x: 104, y: 112 } as const;

/** 깊이 우선 탐색 트리 배치 — 실행이 낸 부모 관계에서. */
function treeNodes(
  value: (v: number) => string,
  state: (v: number) => CellState | undefined = () => undefined,
): GraphNode[] {
  const children = new Map<number, number[]>(
    RUN.children.map((c, v) => [v, c] as [number, number[]]),
  );
  const xy = treeLayout(RUN.roots, children);
  return Array.from({ length: WALK_N }, (_, v) => {
    const p = xy.get(v) as { x: number; y: number };
    return { id: v, x: p.x * 1.4, y: p.y, value: value(v), state: state(v) };
  });
}

/** 간선 다섯 — 종류는 실행이 가른 것. 나무 모양 배치에서는 두 칸 넘게 오르는 간선을 옆으로 휜다. */
function kindEdges(
  opts: {
    label?: boolean;
    tree?: boolean;
    state?: (k: number) => GraphEdge["state"];
    text?: (k: number) => string | undefined;
  } = {},
): GraphEdge[] {
  const names: Record<EdgeKind, string> = {
    tree: "나무",
    back: "되돌아감",
    cross: "",
    forward: "",
    plain: "",
  };
  return WALK_EDGES.map(([from, to], k) => {
    const kind = kindOf(RUN.kinds[k]);
    const up =
      opts.tree === true &&
      kind === "back" &&
      Math.abs((RUN.depth[from] as number) - (RUN.depth[to] as number)) > 1;
    return {
      from,
      to,
      kind,
      state: opts.state?.(k),
      label: opts.text?.(k) ?? (opts.label ? names[kind] : undefined),
      ...(up ? { bend: 0.5 } : {}),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행과 식에서 ── */

function approaches(): Approach[] {
  const scans = V_LIMIT + 1;
  const upper = scans * 2 * E_LIMIT;
  const t = tree(BRIDGE_N, BRIDGE_EDGES);
  const truth = articulationPoints(BRIDGE_N, BRIDGE_EDGES);
  const guess = candidateAnswer(BRIDGE_N, BRIDGE_EDGES);
  const said =
    guess.length === 0
      ? "빈 배열을"
      : `[${guess.join(", ")}]${을를(String(guess.at(-1)))}`;
  const del = byDeletion(WALK_N, WALK_EDGES);
  return [
    {
      name: "정점마다 지워 보기",
      idea: "정점을 하나씩 지우고 남은 그래프의 덩어리를 다시 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `V = E = ${comma(V_LIMIT)} 에서 이웃 자리 읽기 최대 ${comma(upper)} 번 · ${(upper / OPS_PER_SEC).toFixed(0)} 초`,
          ok: false,
        },
        { label: "메모리", value: "탐색 한 번에 방문 표 V 칸", ok: true },
      ],
      lesson: `탐색 한 번의 결과를 정점 하나에만 쓴다 — 전개 입력에서도 ${del.scans} 번 탐색했다`,
    },
    {
      name: "되돌아가는 간선이 있는가",
      idea: "깊이 우선 탐색 트리에서 자식의 서브트리에 되돌아가는 간선이 하나라도 있으면 부모를 지워도 붙어 있다고 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `삼각형 둘을 간선 하나가 이은 그래프에서 ${said} 낸다 — 정답은 [${truth.join(", ")}]`,
          ok: false,
        },
        { label: "시간", value: "순회 한 번", ok: true },
        {
          label: "메모리",
          value: `되돌아가는 간선 ${t.backEdges.map(([b, a]) => ed(b, a)).join(" · ")}${을를(String(t.backEdges.at(-1)?.[1] ?? ""))} 서브트리마다 찾는다`,
          ok: null,
        },
      ],
      lesson: "있는가가 아니라 어디까지 가는가를 수로 적어야 한다",
    },
    {
      name: "low 값으로 판정하기",
      idea: "정점마다 서브트리가 되돌아가는 간선으로 이르는 가장 이른 발견 순서를 적고, 자식의 low 를 부모의 disc 와 맞댄다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 — 전개 입력에서 [${ANSWER.join(", ")}]`,
          ok: true,
        },
        {
          label: "시간",
          value: `이웃 자리 읽기 2(E − L) 번 · 전개 입력에서 ${RUN.reads} 번`,
          ok: true,
        },
        {
          label: "메모리",
          value: "정점마다 칸 셋 + 호출 스택 배열 셋",
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차를 실행해 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

function stepTitle(s: Step, t: number): string {
  const v = String(s.v);
  switch (s.kind) {
    case "진입":
      return s.w === null
        ? `T${t} 정점 ${v} 에 들어간다`
        : `T${t} 간선 ${ed(s.w, s.v)}${으로(v)} 내려간다`;
    case "건너뜀":
      return `T${t} 이웃 ${s.w} — 부모라 건너뛴다`;
    case "줄임":
      return `T${t} 이웃 ${s.w} — 이미 들어갔던 정점`;
    case "복귀":
      return `T${t} 정점 ${v}${을를(v)} 뺀다`;
    case "판정":
      return `T${t} 정점 ${v}${을를(v)} 빼며 ${s.parent}${을를(String(s.parent))} 단절점으로 적는다`;
    default:
      return `T${t} 뿌리 ${v}${을를(v)} 판정한다`;
  }
}

function stepText(s: Step): string {
  const v = String(s.v);
  switch (s.kind) {
    case "진입":
      return s.w === null
        ? `바깥 반복이 아직 안 들어간 정점 ${v}${을를(v)} 찾아 들어갑니다. 발견 순서 ${s.disc[s.v]}${을를(String(s.disc[s.v]))} disc 와 low 에 함께 적고, 부모 칸에는 뿌리 표시 -1 을 넣습니다.`
        : `정점 ${s.w} 의 이웃 ${v}${이가(v)} 처음 보는 정점이라 내려갑니다. disc 와 low 에 ${s.disc[s.v]}${을를(String(s.disc[s.v]))} 적고, 부모 칸에 ${s.w}${을를(String(s.w))} 넣습니다.`;
    case "건너뜀":
      return `이웃 ${s.w}${은는(String(s.w))} 정점 ${v} 의 부모입니다. 방금 내려온 나무 간선을 거꾸로 본 것이라 low[${v}]${을를(v)} 건드리지 않습니다.`;
    case "줄임": {
      const w = s.w as number;
      const before = s.lowFrom?.before as number;
      return (s.disc[w] as number) < before
        ? `이웃 ${w}${은는(String(w))} 이미 들어갔던 정점이고 부모가 아닙니다. 되돌아가는 간선이라 low[${v}]${을를(v)} disc[${w}] = ${s.disc[w]} 까지 줄입니다.`
        : `이웃 ${w}${은는(String(w))} 이미 들어갔다 나온 자손입니다. disc[${w}] = ${s.disc[w]}${이가(String(s.disc[w]))} low[${v}] = ${before} 보다 커서 값이 그대로입니다.`;
    }
    case "복귀":
      return s.parent === null
        ? `정점 ${v} 의 이웃을 다 봤습니다. 부모가 없는 뿌리라 넘길 곳이 없고, 호출 스택이 비었습니다.`
        : s.judge?.rooted
          ? `정점 ${v} 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[${v}] = ${s.low[s.v]}${을를(String(s.low[s.v]))} 부모 ${s.parent} 에게 넘기고, 부모가 뿌리라 판정하지 않습니다.`
          : `정점 ${v} 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[${v}] = ${s.low[s.v]}${을를(String(s.low[s.v]))} 부모 ${s.parent} 에게 넘깁니다. ${s.low[s.v]}${이가(String(s.low[s.v]))} disc[${s.parent}] = ${s.judge?.discP} 보다 작아 부모를 적지 않습니다.`;
    case "판정":
      return `정점 ${v} 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[${v}] = ${s.judge?.lowC}${이가(String(s.judge?.lowC))} disc[${s.parent}] = ${s.judge?.discP} 이상이라, 서브트리가 정점 ${s.parent} 위로 못 갑니다. 정점 ${s.parent}${을를(String(s.parent))} 단절점으로 적습니다.`;
    default:
      return `뿌리 ${v} 의 탐색이 끝났습니다. 나무 자식이 ${s.rootKids} 개라 ${(s.rootKids ?? 0) >= 2 ? `뿌리 ${v}${을를(v)} 단절점으로 적습니다` : "뿌리를 적지 않습니다"}.`;
  }
}

function stepCalc(s: Step): SimStep["calc"] {
  const v = s.v;
  switch (s.kind) {
    case "진입":
      return {
        expr: `disc[${v}] = low[${v}] = timer =`,
        result: String(s.disc[v]),
      };
    case "건너뜀":
      return { expr: `callP 맨 위 = ${s.w} = 이웃`, result: "건너뜀" };
    case "줄임":
      return {
        expr: `low[${v}] = min(${s.lowFrom?.before}, disc[${s.w}]) =`,
        result: String(s.low[v]),
      };
    case "복귀":
      return s.parent === null
        ? null
        : {
            expr: `low[${s.parent}] = min(${s.lowFrom?.before}, low[${v}]) =`,
            result: String(s.low[s.parent]),
          };
    case "판정":
      return {
        expr: `low[${v}] = ${s.judge?.lowC} ≥ disc[${s.parent}] = ${s.judge?.discP} →`,
        result: "참",
      };
    default:
      return {
        expr: "rootKids ≥ 2 →",
        result: (s.rootKids ?? 0) >= 2 ? "참" : "거짓",
      };
  }
}

/** 걸음 하나의 무대 — 정점 · 간선 · 호출 스택 · 단절점 목록. */
function stepStage(s: Step | null): GraphStep {
  const disc = s?.disc ?? Array(WALK_N).fill(-1);
  const low = s?.low ?? Array(WALK_N).fill(-1);
  const focusV = new Set<number>();
  const readV = new Set<number>();
  if (s !== null) {
    const changed =
      s.lowFrom !== null && s.low[s.lowFrom.vertex] !== s.lowFrom.before;
    switch (s.kind) {
      case "진입":
        focusV.add(s.v);
        if (s.w !== null) readV.add(s.w);
        break;
      case "건너뜀":
        readV.add(s.v);
        readV.add(s.w as number);
        break;
      case "줄임":
        (changed ? focusV : readV).add(s.v);
        readV.add(s.w as number);
        break;
      case "뿌리 판정":
        ((s.rootKids ?? 0) >= 2 ? focusV : readV).add(s.v);
        break;
      default:
        readV.add(s.v);
        if (s.parent !== null) {
          (changed || s.kind === "판정" ? focusV : readV).add(s.parent);
        }
    }
  }
  const nodes = Array.from({ length: WALK_N }, (_, v) => {
    if ((disc[v] as number) < 0) return { value: "", state: "empty" as const };
    const state: CellState | undefined = focusV.has(v)
      ? "focus"
      : readV.has(v)
        ? "read"
        : undefined;
    return {
      value: `${disc[v]} / ${low[v]}`,
      ...(state ? { state } : {}),
    };
  });
  const edges = WALK_EDGES.map(([from, to], k) => {
    const kind = kindOf(s?.kinds[k]);
    let state: GraphEdge["state"];
    if (s !== null && s.edge === k) {
      const changed =
        s.kind === "진입" ||
        (s.kind === "줄임" &&
          s.lowFrom !== null &&
          s.low[s.lowFrom.vertex] !== s.lowFrom.before);
      state = changed ? "focus" : "read";
    } else if (
      s !== null &&
      (s.kind === "복귀" || s.kind === "판정") &&
      s.parent !== null &&
      ((s.parent === from && s.v === to) ||
        (s.parent === to && s.v === from)) &&
      kind === "tree"
    ) {
      state = "read";
    }
    return {
      ...(kind === "plain" ? {} : { kind }),
      ...(state ? { state } : {}),
    };
  });
  const call = s?.call ?? [];
  const cut = s?.cut ?? [];
  const pushed = s?.kind === "진입";
  const marked =
    s !== null &&
    (s.kind === "판정" || (s.kind === "뿌리 판정" && (s.rootKids ?? 0) >= 2));
  const newCut = marked
    ? cut.indexOf(s.kind === "판정" ? (s.parent as number) : s.v)
    : -1;
  return {
    nodes,
    edges,
    strips: [
      {
        label: "호출 스택",
        values: call,
        slots: WALK_N,
        ...(call.length > 0
          ? {
              states: {
                [call.length - 1]: pushed
                  ? ("focus" as const)
                  : ("read" as const),
              },
            }
          : {}),
      },
      {
        label: "단절점",
        values: cut,
        slots: WALK_N,
        ...(newCut >= 0 ? { states: { [newCut]: "focus" as const } } : {}),
      },
    ],
    calc: s === null ? null : stepCalc(s),
    vars: `timer = ${s?.timer ?? 0} · 읽은 이웃 자리 ${s?.reads ?? 0} / ${SLOTS}`,
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차를 실행해 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  const all: SimStep[] = [
    {
      title: "T1 준비",
      text: "간선마다 두 끝의 이웃 목록에 서로를 넣고, disc · low 를 모두 -1 로, cut 을 모두 거짓으로 둡니다. 아직 들어간 정점이 없어 호출 스택이 비어 있습니다.",
      ...stepStage(null),
      calc: null,
    },
  ];
  RUN.steps.forEach((s, i) => {
    all.push({
      title: stepTitle(s, i + 2),
      text: stepText(s),
      ...stepStage(s),
    });
  });
  const last = RUN.steps.at(-1) as Step;
  const tail = String(RUN.cut.at(-1) ?? "");
  all.push({
    title: `T${RUN.steps.length + 2} 반환`,
    text: `cut 이 참인 정점을 번호 순서로 모아 [${RUN.cut.join(", ")}]${을를(tail)} 돌려줍니다.`,
    ...stepStage({
      ...last,
      kind: "복귀",
      parent: null,
      lowFrom: null,
      edge: null,
    }),
    calc: null,
  });
  return all;
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
function Film({ spec, pick }: { spec: PlayerSpec; pick?: readonly string[] }) {
  const frames = playerFrames(spec).filter(
    (f) => pick === undefined || pick.includes(f.id),
  );
  return (
    <NodeGraphFilm
      title={spec.title}
      frames={frames.map((f) => ({
        id: f.id,
        text: f.calc ? `${f.title} · ${f.calc.expr} ${f.calc.result}` : f.title,
        scene: f.scene ?? { nodes: [], edges: [] },
      }))}
    />
  );
}

/** 너비 우선 탐색 트리 — 같은 입력, 같은 시작 정점. */
function bfsScene(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const b = bfsRule(WALK_N, WALK_EDGES);
  const children = new Map<number, number[]>(
    b.children.map((c, v) => [v, c] as [number, number[]]),
  );
  const xy = treeLayout(b.roots, children);
  const nodes = Array.from({ length: WALK_N }, (_, v) => {
    const p = xy.get(v) as { x: number; y: number };
    return { id: v, x: p.x * 1.4, y: p.y };
  });
  const nonTree = new Set(b.nonTree.map(([u, v]) => `${u}-${v}`));
  const edges = WALK_EDGES.map(([from, to]): GraphEdge => {
    const off = nonTree.has(`${from}-${to}`);
    return off
      ? {
          from,
          to,
          kind: "cross",
          state: "focus",
          label: "형제를 잇는다",
        }
      : { from, to, kind: "tree", label: "나무" };
  });
  return { nodes, edges };
}

/** 블록-컷 나무 — 블록 하나를 점 하나로, 단절점을 또 다른 점으로 놓고 「이 블록에 든다」를 잇는다. */
function blockCut(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const bs = blocks(WALK_N, WALK_EDGES);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const order: (string | number)[] = [];
  // 블록과 단절점을 번갈아 한 줄로 놓는다 — 블록 차례대로, 사이에 두 블록이 함께 쓰는 단절점.
  bs.forEach((b, i) => {
    if (i > 0) {
      const prev = bs[i - 1] as number[];
      const shared = b.find((v) => prev.includes(v) && ANSWER.includes(v));
      if (shared !== undefined) order.push(shared);
    }
    order.push(`b${i}`);
  });
  order.forEach((id, i) => {
    if (typeof id === "number") {
      nodes.push({
        id: `c${id}`,
        x: i * 1.2,
        y: 0,
        label: String(id),
        value: "단절점",
        state: "focus",
      });
    } else {
      const b = bs[Number(id.slice(1))] as number[];
      nodes.push({ id, x: i * 1.2, y: 0, label: b.join("·"), value: "블록" });
    }
  });
  for (let i = 1; i < order.length; i++) {
    const a = order[i - 1] as string | number;
    const b = order[i] as string | number;
    edges.push({
      from: typeof a === "number" ? `c${a}` : a,
      to: typeof b === "number" ? `c${b}` : b,
    });
  }
  return { nodes, edges };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-cut": () => (
    <NodeGraph
      title={`전개 입력 — 강조한 정점 ${ANSWER.join(" · ")}${이가(String(ANSWER.at(-1)))} 단절점`}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        ...(ANSWER.includes(n.id) ? { state: "focus" as const } : {}),
      }))}
      edges={LAYOUT.edges}
      directed={false}
    />
  ),
  "concept-dfs-low": () => (
    <NodeGraph
      title="깊이 우선 탐색 트리 — 정점 안의 두 수는 disc / low"
      unit={TREE_UNIT}
      nodes={treeNodes(
        (v) => `${RUN.disc[v]} / ${RUN.low[v]}`,
        (v) => (ANSWER.includes(v) ? "focus" : undefined),
      )}
      edges={kindEdges({ label: true, tree: true })}
      directed={false}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 V = E = ${comma(V_LIMIT)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-dfs-edges": () => (
    <NodeGraph
      title="입력 그래프 위의 간선 종류 — 정점 안의 수는 disc"
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `disc ${RUN.disc[n.id]}`,
      }))}
      edges={kindEdges({ label: true })}
      directed={false}
    />
  ),
  "build-dfs-tree": () => (
    <NodeGraph
      title="같은 탐색을 나무 모양으로 — y 는 깊이"
      unit={TREE_UNIT}
      nodes={treeNodes((v) => `disc ${RUN.disc[v]}`)}
      edges={kindEdges({ label: true, tree: true })}
      directed={false}
    />
  ),
  "build-bfs-tree": () => {
    const s = bfsScene();
    return (
      <NodeGraph
        title="같은 입력의 너비 우선 탐색 트리 — 나무 간선이 아닌 간선이 형제를 잇는다"
        unit={TREE_UNIT}
        nodes={s.nodes}
        edges={s.edges}
        directed={false}
      />
    );
  },
  "build-low-tree": () => (
    <NodeGraph
      title="low 값 — 되돌아가는 간선이 서브트리의 low 를 줄인다"
      unit={TREE_UNIT}
      nodes={treeNodes(
        (v) => `${RUN.disc[v]} / ${RUN.low[v]}`,
        (v) => (RUN.low[v] !== RUN.disc[v] ? "focus" : undefined),
      )}
      edges={kindEdges({
        tree: true,
        state: (k) => (RUN.kinds[k] === "되돌아감" ? "focus" : undefined),
        text: (k) => {
          const [a, b] = WALK_EDGES[k] as [number, number];
          const top = (RUN.disc[a] as number) < (RUN.disc[b] as number) ? a : b;
          return RUN.kinds[k] === "되돌아감"
            ? `disc[${top}] = ${RUN.disc[top]}`
            : undefined;
        },
      })}
      directed={false}
    />
  ),
  "build-judge": () => (
    <Film spec={apWalk as unknown as PlayerSpec} pick={["T15", "T16", "T18"]} />
  ),
  "walk-ap": () => <Film spec={apWalk as unknown as PlayerSpec} />,
  "related-blockcut": () => {
    const c = blockCut();
    return (
      <NodeGraph
        title="전개 입력의 블록-컷 나무 — 블록 셋과 단절점 둘"
        nodes={c.nodes}
        edges={c.edges}
        directed={false}
      />
    );
  },
};
