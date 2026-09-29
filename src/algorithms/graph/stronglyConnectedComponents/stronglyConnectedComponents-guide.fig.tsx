/**
 * `stronglyConnectedComponents-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 강한 연결 요소는 정본(`-guide.ref.ts`)이 낸 답이고,
 * 발견 순서 · low-link 값 · 간선 종류 · 걸음마다의 상태는 정본과 같은 절차에 세는 자리만 덧붙인
 * 사본(`-guide.proof.ts` 의 `counted`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가
 * 읽힐 때 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `stronglyConnectedComponents-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 사이클 0 → 1 → 2 → 0 을 왼쪽 삼각형으로, 3 ⇄ 4 를 그
 * 오른쪽에, 들어오는 간선이 없는 5 를 3 위에 둔다. 깊이 우선 탐색 트리 그림은 좌표를 손으로 두지
 * 않고 실행이 낸 부모 관계에서 `treeLayout` 으로 낸다.
 */

import type { ReactElement } from "react";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  comma,
  counted,
  type EdgeKindKo,
  type Step,
  TRAP_EDGES,
  TRAP_N,
  WALK_EDGES,
  WALK_N,
} from "./stronglyConnectedComponents-guide.proof.ts";
import { stronglyConnectedComponents } from "./stronglyConnectedComponents-guide.ref.ts";
import {
  walkFirst,
  walkSecond,
} from "./stronglyConnectedComponents-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 0 },
    { id: 1, x: 0, y: 2 },
    { id: 2, x: 1.3, y: 1 },
    { id: 3, x: 2.7, y: 1 },
    { id: 4, x: 4.1, y: 1 },
    { id: 5, x: 2.7, y: -0.6 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
};

const RUN = counted(WALK_N, WALK_EDGES);
const ANSWER = stronglyConnectedComponents(WALK_N, WALK_EDGES);

const KIND: Record<EdgeKindKo, EdgeKind> = {
  나무: "tree",
  되돌아감: "back",
  "앞으로 감": "forward",
  가로지름: "cross",
};
const kindOf = (k: EdgeKindKo | null | undefined): EdgeKind =>
  k === null || k === undefined ? "plain" : KIND[k];

const at = (id: number) => LAYOUT.nodes.find((n) => n.id === id) as GraphNode;
const groupLabel = (g: readonly number[]) => `[${g.join(", ")}]`;

/** 나무 모양 그림의 격자 — 깊이 사이를 넓혀 나무 간선이 보이게 한다. */
const TREE_UNIT = { x: 104, y: 112 } as const;

/** 깊이 우선 탐색 트리 배치 — 실행이 낸 부모 관계에서. 뿌리가 둘(0 · 5)이라 숲이다. */
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

/** 간선 일곱 — 종류는 실행이 가른 것. 나무 모양 배치에서는 위로 가는 간선을 옆으로 휜다. */
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
    cross: "가로지름",
    forward: "앞으로 감",
    plain: "",
  };
  return WALK_EDGES.map(([from, to], k) => {
    const kind = kindOf(RUN.kinds[k]);
    const up =
      opts.tree === true &&
      kind === "back" &&
      (RUN.depth[from] as number) - (RUN.depth[to] as number) > 1;
    return {
      from,
      to,
      kind,
      state: opts.state?.(k),
      label: opts.text?.(k) ?? (opts.label ? names[kind] : undefined),
      ...(up ? { bend: -0.5 } : {}),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행과 식에서 ── */

const N = 100_000;
const secondsOf = (ops: number): string => `${(ops / 1e8).toFixed(0)} 초`;

function approaches(): Approach[] {
  const pairs = N * (N - 1);
  const trap = counted(TRAP_N, TRAP_EDGES);
  const back = trap.steps.find((s) => s.kind === "줄임") as Step;
  const guess = back.stack.slice().sort((a, b) => a - b);
  return [
    {
      name: "정점 쌍마다 왕복 탐색",
      idea: "두 정점마다 앞으로 한 번, 거꾸로 한 번 탐색해 둘 다 되면 묶는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 V = ${comma(N)} 에서 탐색 ${comma(pairs)} 번 · ${secondsOf(pairs)} 넘게`,
          ok: false,
        },
        {
          label: "메모리",
          value: "탐색 한 번에 방문 표 V 칸",
          ok: true,
        },
      ],
      lesson: `탐색 한 번의 결과를 쌍 하나에만 쓴다 — 정점마다 도달 집합을 한 번에 구하면 어떨까`,
    },
    {
      name: "정점마다 앞뒤 도달 집합",
      idea: "정점마다 갈 수 있는 정점과 올 수 있는 정점을 구해 교집합을 잡는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `탐색 2V = ${comma(2 * N)} 번 · 간선 읽기 최대 2VE = ${comma(2 * N * N)} 번 · ${secondsOf(2 * N * N)}`,
          ok: false,
        },
        { label: "메모리", value: "정점마다 집합 둘", ok: true },
      ],
      lesson:
        "탐색 횟수가 아직 V 에 비례한다 — 깊이 우선 탐색 한 번이 지나가며 가를 수 없을까",
    },
    {
      name: "되돌아가는 간선에서 스택 전부 묶기",
      idea: "간선이 스택 위 정점에 이르면 그때 스택에 있는 정점을 한 묶음으로 둔다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `간선 ${back.v}→${back.w} 에서 정점 ${guess.join(" · ")}${을를(String(guess.at(-1)))} 묶지만 답은 ${trap.groups.map(groupLabel).join(" · ")}`,
          ok: false,
        },
        { label: "시간", value: "간선 읽기 E 번", ok: true },
        { label: "메모리", value: "스택 V 칸", ok: true },
      ],
      lesson:
        "스택 전부가 아니라 「어디까지 되돌아가는가」를 정점마다 적어야 한다",
    },
    {
      name: "low-link 값으로 끊기",
      idea: "정점마다 되돌아갈 수 있는 가장 이른 발견 순서를 적고, low = disc 인 정점에서 스택을 끊는다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 — 전개 입력에서 ${ANSWER.map(groupLabel).join(" · ")}`,
          ok: true,
        },
        {
          label: "시간",
          value: `간선 읽기 E 번 + 정점 만짐 3V 번 · 전개 입력에서 간선 읽기 ${RUN.reads} 번`,
          ok: true,
        },
        { label: "메모리", value: "정점마다 칸 셋 + 스택 두 개", ok: true },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차를 실행해 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const E = WALK_EDGES.length;
const CUT = (s: Step) => s.cut.slice().sort((a, b) => a - b);

function stepTitle(s: Step, t: number): string {
  switch (s.kind) {
    case "진입":
      return s.w === null
        ? `T${t} 정점 ${s.v} 에 들어간다`
        : `T${t} 간선 ${s.w}→${s.v}${으로(String(s.v))} 내려간다`;
    case "줄임":
      return `T${t} 간선 ${s.v}→${s.w} — 스택 위 정점`;
    case "무시":
      return `T${t} 간선 ${s.v}→${s.w} — 끊겨 나간 정점`;
    case "복귀":
      return `T${t} 정점 ${s.v}${을를(String(s.v))} 끝낸다`;
    default:
      return `T${t} 정점 ${s.v}${을를(String(s.v))} 끝내고 끊는다`;
  }
}

function stepText(s: Step): string {
  const v = String(s.v);
  switch (s.kind) {
    case "진입":
      return s.w === null
        ? `바깥 반복이 아직 안 본 정점 ${v}${을를(v)} 찾아 들어갑니다. 발견 순서 ${s.disc[s.v]}${을를(String(s.disc[s.v]))} disc 와 low 에 함께 적고 두 스택에 담습니다.`
        : `정점 ${s.w} 의 이웃 ${v}${이가(v)} 처음 보는 정점이라 내려갑니다. disc 와 low 에 ${s.disc[s.v]}${을를(String(s.disc[s.v]))} 적고 두 스택에 담습니다.`;
    case "줄임":
      return `정점 ${s.w}${이가(String(s.w))} 아직 스택에 있어 low[${v}]${을를(v)} disc[${s.w}] = ${s.disc[s.w as number]}${과와(String(s.disc[s.w as number]))} 비교해 줄입니다. 정점 ${v} 에서 정점 ${s.w}${으로(String(s.w))} 되돌아갈 수 있다는 기록입니다.`;
    case "무시":
      return `정점 ${s.w}${은는(String(s.w))} 이미 강한 연결 요소로 끊겨 나가 스택에 없습니다. 그 정점에서 ${v}${으로(v)} 돌아오는 길이 없으니 low[${v}]${을를(v)} 그대로 둡니다.`;
    case "복귀":
      return s.parent === null
        ? `정점 ${v} 의 이웃을 다 봤습니다.`
        : `정점 ${v} 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[${v}] = ${s.low[s.v]}${을를(String(s.low[s.v]))} 부모 ${s.parent} 에게 넘기고, low[${v}]${이가(v)} disc[${v}] 보다 작아 뿌리가 아닙니다.`;
    default: {
      const cut = CUT(s).join(" · ");
      return `low[${v}] = disc[${v}] = ${s.disc[s.v]}${josa(String(s.disc[s.v]), "이라", "라")} 정점 ${v}${이가(v)} 뿌리입니다. 스택에서 ${v}${이가(v)} 나올 때까지 빼서 정점 ${cut}${을를(String(CUT(s).at(-1)))} 한 강한 연결 요소로 끊습니다.`;
    }
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
    case "줄임":
      return {
        expr: `low[${v}] = min(${s.lowFrom?.before}, disc[${s.w}]) =`,
        result: String(s.low[v]),
      };
    case "무시":
      return { expr: `onStack[${s.w}] =`, result: "false" };
    case "복귀":
      return s.parent === null
        ? null
        : {
            expr: `low[${s.parent}] = min(${s.lowFrom?.before}, low[${v}]) =`,
            result: String(s.low[s.parent]),
          };
    default:
      return { expr: `low[${v}] = disc[${v}] =`, result: String(s.disc[v]) };
  }
}

/** 걸음 하나의 무대 — 정점 · 간선 · 끊어 낸 강한 연결 요소 · 두 스택. */
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
      case "줄임":
        (changed ? focusV : readV).add(s.v);
        readV.add(s.w as number);
        break;
      case "무시":
        readV.add(s.v);
        readV.add(s.w as number);
        break;
      default:
        readV.add(s.v);
        if (s.parent !== null) (changed ? focusV : readV).add(s.parent);
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
      (s.kind === "복귀" || s.kind === "뿌리") &&
      s.parent === from &&
      s.v === to &&
      kind === "tree"
    ) {
      state = "read";
    }
    return {
      ...(kind === "plain" ? {} : { kind }),
      ...(state ? { state } : {}),
    };
  });
  const groups = (s?.groups ?? []).map((g, i, all) => ({
    members: g,
    label: groupLabel(g),
    ...(s?.kind === "뿌리" && i === all.length - 1
      ? { state: "focus" as const }
      : {}),
  }));
  const stack = s?.stack ?? [];
  const call = s?.call ?? [];
  const pushed = s?.kind === "진입";
  return {
    nodes,
    edges,
    groups,
    strips: [
      {
        label: "스택",
        values: stack,
        slots: WALK_N,
        ...(pushed ? { states: { [stack.length - 1]: "focus" as const } } : {}),
      },
      {
        label: "호출 스택",
        values: call,
        slots: WALK_N,
        ...(call.length > 0
          ? { states: { [call.length - 1]: "read" as const } }
          : {}),
      },
    ],
    calc: s === null ? null : stepCalc(s),
    vars: `timer = ${s?.timer ?? 0} · 읽은 간선 ${s?.reads ?? 0} / ${E}`,
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차를 실행해 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): {
  walkFirst: SimStep[];
  walkSecond: SimStep[];
} {
  const all: SimStep[] = [
    {
      title: "T1 준비",
      text: "이웃 목록을 만들고 disc · low 를 모두 -1 로 둡니다. 아직 들어간 정점이 없어 두 스택이 비어 있습니다.",
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
  const found = RUN.steps
    .filter((s) => s.kind === "뿌리")
    .map((s) => groupLabel(CUT(s)))
    .join(" · ");
  all.push({
    title: `T${RUN.steps.length + 2} 반환`,
    text: `끊어 낸 차례는 ${found} 입니다. 반환하기 직전에 첫 원소 기준으로 정렬합니다.`,
    ...stepStage({
      ...last,
      kind: "복귀",
      parent: null,
      lowFrom: null,
      cut: [],
    }),
    calc: null,
  });
  // 정점 0 에서 시작한 탐색이 끝나는 걸음(T13)까지가 첫 패널이다.
  const split =
    RUN.steps.findIndex((s) => s.kind === "진입" && s.w === null && s.v !== 0) +
    1;
  return { walkFirst: all.slice(0, split), walkSecond: all.slice(split) };
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

/** 강한 연결 요소를 점 하나로 접은 그래프 — 점 사이 간선은 원래 간선에서 온다. */
function condensation(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const id = (v: number) => ANSWER.findIndex((g) => g.includes(v));
  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const [u, v] of WALK_EDGES) {
    const a = id(u);
    const b = id(v);
    if (a === b || seen.has(`${a}-${b}`)) continue;
    seen.add(`${a}-${b}`);
    edges.push({ from: a, to: b });
  }
  const nodes = ANSWER.map((g, k) => {
    const xs = g.map((v) => at(v).x);
    const ys = g.map((v) => at(v).y);
    return {
      id: k,
      label: g.join("·"),
      x: xs.reduce((p, q) => p + q, 0) / xs.length,
      y: ys.reduce((p, q) => p + q, 0) / ys.length,
    };
  });
  return { nodes, edges };
}

export const FIGS: Record<string, () => ReactElement> = {
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`제약 V = E = ${comma(N)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "concept-scc": () => (
    <NodeGraph
      title="전개 입력의 강한 연결 요소 셋"
      nodes={LAYOUT.nodes}
      edges={LAYOUT.edges}
      groups={ANSWER.map((g) => ({ members: g, label: groupLabel(g) }))}
    />
  ),
  "concept-dfs-low": () => (
    <NodeGraph
      title="깊이 우선 탐색 트리 — 정점 안의 두 수는 disc / low"
      unit={TREE_UNIT}
      nodes={treeNodes((v) => `${RUN.disc[v]} / ${RUN.low[v]}`)}
      edges={kindEdges({ label: true, tree: true })}
    />
  ),
  "build-dfs-edges": () => (
    <NodeGraph
      title="입력 그래프 위의 간선 종류 — 정점 안의 수는 disc"
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `disc ${RUN.disc[n.id]}`,
      }))}
      edges={kindEdges({ label: true })}
    />
  ),
  "build-dfs-tree": () => (
    <NodeGraph
      title="같은 탐색을 나무 모양으로 — y 는 깊이"
      unit={TREE_UNIT}
      nodes={treeNodes((v) => `disc ${RUN.disc[v]}`)}
      edges={kindEdges({ label: true, tree: true })}
    />
  ),
  "build-low-tree": () => (
    <NodeGraph
      title="low-link 값 — 스택 위 정점으로 가는 간선 둘이 low 를 줄인다"
      unit={TREE_UNIT}
      nodes={treeNodes(
        (v) => `${RUN.disc[v]} / ${RUN.low[v]}`,
        (v) => (RUN.low[v] === RUN.disc[v] ? "focus" : undefined),
      )}
      edges={kindEdges({
        tree: true,
        state: (k) =>
          RUN.kinds[k] === "되돌아감"
            ? "focus"
            : RUN.kinds[k] === "가로지름"
              ? "out"
              : undefined,
        text: (k) => {
          const [, w] = WALK_EDGES[k] as [number, number];
          return RUN.kinds[k] === "되돌아감"
            ? `disc[${w}] = ${RUN.disc[w]}`
            : RUN.kinds[k] === "가로지름"
              ? "끊겨 나간 정점"
              : undefined;
        },
      })}
    />
  ),
  "build-cut": () => (
    <Film
      spec={walkFirst as unknown as PlayerSpec}
      pick={["T9", "T10", "T13"]}
    />
  ),
  "walk-first": () => <Film spec={walkFirst as unknown as PlayerSpec} />,
  "walk-second": () => <Film spec={walkSecond as unknown as PlayerSpec} />,
  "related-condensation": () => {
    const c = condensation();
    return (
      <NodeGraph
        title="강한 연결 요소를 점 하나로 접은 그래프"
        nodes={c.nodes}
        edges={c.edges}
      />
    );
  },
  "math-low-terms": () => {
    const v = 2;
    const child = (RUN.children[v] as number[])[0] as number;
    const backTo = RUN.steps.find((s) => s.kind === "줄임" && s.v === v)
      ?.w as number;
    return (
      <NodeGraph
        title={`low[${v}] 의 세 항 — 자기 disc · 스택 위 정점의 disc · 자식의 low`}
        unit={TREE_UNIT}
        nodes={treeNodes(
          (x) =>
            x === v
              ? `${RUN.disc[x]} / ${RUN.low[x]}`
              : x === child
                ? `low ${RUN.low[x]}`
                : x === backTo
                  ? `disc ${RUN.disc[x]}`
                  : "",
          (x) =>
            x === v ? "focus" : x === child || x === backTo ? "read" : "out",
        )}
        edges={kindEdges({
          tree: true,
          state: (k) => {
            const [a, b] = WALK_EDGES[k] as [number, number];
            return a === v && (b === child || b === backTo) ? "read" : "out";
          },
          text: (k) => {
            const [a, b] = WALK_EDGES[k] as [number, number];
            if (a !== v) return undefined;
            return b === child
              ? "셋째 항"
              : b === backTo
                ? "둘째 항"
                : undefined;
          },
        })}
      />
    );
  },
};
