/**
 * `bridgesInGraph-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 다리는 정본(`-guide.ref.ts`)이 낸 답이고, 발견 순서 ·
 * low 값 · 간선 종류 · 걸음마다의 상태는 정본과 같은 절차에 세는 자리만 덧붙인 사본(`-guide.proof.ts`
 * 의 `counted`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `bridgesInGraph-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 삼각형 `1−2−3` 을 아래쪽에 두고 그 위로 `0−1` 을, 왼쪽으로
 * `0−5` 를, 오른쪽으로 꼬리 `3−4` 를 늘어뜨려 다리 셋이 그림에서 목이 되는 자리에 오게 했다. 나무 모양
 * 그림은 좌표를 손으로 두지 않고 실행이 낸 부모 관계에서 `treeLayout` 으로 낸다. 간선에 방향이 없으므로
 * `directed: false` 다. 간선마다 번호(`간선 k`)를 붙이는 것은 이 편이 내려온 간선을 번호로 건너뛰기 때문이다.
 */

import type { ReactElement } from "react";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  byDeletion,
  candidateAnswer,
  comma,
  counted,
  E_LIMIT,
  type EdgeKindKo,
  ed,
  OPS_PER_SEC,
  type Step,
  TWIN_TAIL_EDGES,
  TWIN_TAIL_N,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./bridgesInGraph-guide.proof.ts";
import { bridgesInGraph } from "./bridgesInGraph-guide.ref.ts";
import { bridgesWalk } from "./bridgesInGraph-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1.2, y: 0 },
    { id: 1, x: 2.4, y: 0 },
    { id: 2, x: 1.3, y: 1.4 },
    { id: 3, x: 3.5, y: 1.4 },
    { id: 4, x: 4.8, y: 1.4 },
    { id: 5, x: 0, y: 0 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const RUN = WALK.counts;
const WALK_ANSWER = bridgesInGraph(WALK_N, WALK_EDGES);
const SLOTS = 2 * WALK_EDGES.length;
const BRIDGE_KEYS = new Set(WALK_ANSWER.map(([a, b]) => ed(a, b)));
const isBridge = (k: number): boolean => {
  const [u, v] = WALK_EDGES[k] as [number, number];
  return BRIDGE_KEYS.has(u < v ? ed(u, v) : ed(v, u));
};

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

/** 간선 여섯 — 종류는 실행이 가른 것. 나무 모양 배치에서는 두 칸 넘게 오르는 간선을 옆으로 휜다. */
function kindEdges(
  opts: {
    tree?: boolean;
    state?: (k: number) => GraphEdge["state"];
    text?: (k: number) => string | undefined;
  } = {},
): GraphEdge[] {
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
      label: opts.text?.(k),
      ...(up ? { bend: 0.5 } : {}),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행과 식에서 ── */

function approaches(): Approach[] {
  const scans = E_LIMIT + 1;
  const reads = 2 * E_LIMIT * E_LIMIT;
  const del = byDeletion(WALK_N, WALK_EDGES);
  const guess = candidateAnswer(WALK_N, WALK_EDGES);
  const extra = guess.filter(
    ([a, b]) => !WALK_ANSWER.some(([c, d]) => a === c && b === d),
  );
  const extraText = extra.map(([a, b]) => ed(a, b)).join(" · ");
  return [
    {
      name: "간선마다 지워 보기",
      idea: "간선을 하나씩 지우고 남은 그래프의 덩어리를 다시 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `E = ${comma(E_LIMIT)} 에서 탐색 ${comma(scans)} 번 · 이웃 자리 읽기 ${comma(reads)} 번 · ${comma(reads / OPS_PER_SEC)} 초`,
          ok: false,
        },
        { label: "메모리", value: "탐색 한 번에 방문 표 V 칸", ok: true },
      ],
      lesson: `탐색 한 번의 결과를 간선 하나에만 쓴다 — 전개 입력에서도 ${del.scans} 번 탐색했다`,
    },
    {
      name: "나무 간선이면 다리",
      idea: "깊이 우선 탐색 트리의 나무 간선은 다리로, 되돌아가는 간선은 다리가 아닌 것으로 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 삼각형 위의 ${extraText}${을를(extraText)} 다리로 낸다`,
          ok: false,
        },
        { label: "시간", value: "순회 한 번", ok: true },
        { label: "메모리", value: "정점마다 부모 한 칸", ok: true },
      ],
      lesson:
        "나무 간선마다 자식의 부분트리가 부모나 그 위로 되돌아가는지를 수로 적어야 한다",
    },
    {
      name: "low 값으로 판정하기",
      idea: "정점마다 부분트리가 되돌아가는 간선으로 이르는 가장 이른 발견 순서를 적고, 자식의 low 를 부모의 disc 와 맞댄다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 — 전개 입력에서 ${WALK_ANSWER.map(([a, b]) => ed(a, b)).join(" · ")}`,
          ok: true,
        },
        {
          label: "시간",
          value: `이웃 자리 읽기 2E 번 · 전개 입력에서 ${RUN.reads} 번`,
          ok: true,
        },
        {
          label: "메모리",
          value: "정점마다 칸 둘 + 호출 스택 배열 셋",
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
        : `T${t} 간선 ${s.edge} 로 정점 ${v} 에 내려간다`;
    case "건너뜀":
      return `T${t} 간선 ${s.edge} — 내려온 간선이라 건너뛴다`;
    case "줄임":
      return `T${t} 간선 ${s.edge} — 이미 들어갔던 정점 ${s.w}`;
    case "복귀":
      return s.parent === null
        ? `T${t} 뿌리 ${v}${을를(v)} 뺀다`
        : `T${t} 정점 ${v}${을를(v)} 빼며 ${ed(s.parent, s.v)}${을를(ed(s.parent, s.v))} 판정한다`;
    default: {
      const e = ed(s.parent as number, s.v);
      return `T${t} 정점 ${v}${을를(v)} 빼며 ${e}${을를(e)} 다리로 적는다`;
    }
  }
}

function stepText(s: Step): string {
  const v = String(s.v);
  switch (s.kind) {
    case "진입":
      return s.w === null
        ? `바깥 반복이 아직 안 들어간 정점 ${v}${을를(v)} 찾아 들어갑니다. 발견 순서 ${s.disc[s.v]}${을를(String(s.disc[s.v]))} disc 와 low 에 함께 적고, 내려온 간선 칸에는 뿌리 표시 -1 을 넣습니다.`
        : `정점 ${s.w} 의 이웃 ${v}${이가(v)} 처음 보는 정점이라 간선 ${s.edge}${으로(String(s.edge))} 내려갑니다. disc 와 low 에 ${s.disc[s.v]}${을를(String(s.disc[s.v]))} 적고, 내려온 간선 칸에 ${s.edge}${을를(String(s.edge))} 넣습니다.`;
    case "건너뜀":
      return `읽은 자리의 간선 번호 ${s.edge}${이가(String(s.edge))} 내려온 간선 칸의 ${s.came}${과와(String(s.came))} 같습니다. 방금 타고 내려온 간선을 거꾸로 본 것이라 low[${v}]${을를(v)} 건드리지 않습니다.`;
    case "줄임": {
      const w = s.w as number;
      const before = s.lowFrom?.before as number;
      return (s.disc[w] as number) < before
        ? `이웃 ${w}${은는(String(w))} 이미 들어갔던 정점이고 간선 ${s.edge}${은는(String(s.edge))} 내려온 간선이 아닙니다. 되돌아가는 간선이라 low[${v}]${을를(v)} disc[${w}] = ${s.disc[w]} 까지 줄입니다.`
        : `이웃 ${w}${은는(String(w))} 이미 들어갔다 나온 자손입니다. disc[${w}] = ${s.disc[w]}${이가(String(s.disc[w]))} low[${v}] = ${before} 보다 커서 값이 그대로입니다.`;
    }
    case "복귀":
      return s.parent === null
        ? `정점 ${v} 의 이웃을 다 봤습니다. 내려온 간선 칸이 -1 인 뿌리라 넘길 곳도 판정할 간선도 없고, 호출 스택이 비었습니다.`
        : `정점 ${v} 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[${v}] = ${s.low[s.v]}${을를(String(s.low[s.v]))} 부모 ${s.parent} 에게 넘깁니다. ${s.judge?.lowC}${이가(String(s.judge?.lowC))} disc[${s.parent}] = ${s.judge?.discP} 보다 크지 않아 간선 ${ed(s.parent, s.v)}${은는(ed(s.parent, s.v))} 다리가 아닙니다.`;
    default: {
      const e = ed(s.parent as number, s.v);
      return `정점 ${v} 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[${v}] = ${s.judge?.lowC}${이가(String(s.judge?.lowC))} disc[${s.parent}] = ${s.judge?.discP} 보다 커서, 부분트리가 간선 ${e} 없이는 부모에도 그 위에도 못 갑니다. ${e}${을를(e)} 다리로 적습니다.`;
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
    case "건너뜀":
      return {
        expr: `간선 ${s.edge} = stackE 맨 위 ${s.came}`,
        result: "건너뜀",
      };
    case "줄임":
      return {
        expr: `low[${v}] = min(${s.lowFrom?.before}, disc[${s.w}]) =`,
        result: String(s.low[v]),
      };
    case "복귀":
      return s.parent === null
        ? null
        : {
            expr: `low[${v}] = ${s.judge?.lowC} > disc[${s.parent}] = ${s.judge?.discP} →`,
            result: "거짓",
          };
    default:
      return {
        expr: `low[${v}] = ${s.judge?.lowC} > disc[${s.parent}] = ${s.judge?.discP} →`,
        result: "참",
      };
  }
}

/** 걸음 하나의 무대 — 정점 · 간선 · 호출 스택 · 내려온 간선 · 다리 목록. */
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
  const edges = WALK_EDGES.map((_, k) => {
    const kind = kindOf(s?.kinds[k]);
    let state: GraphEdge["state"];
    if (s !== null && s.edge === k) {
      const changed =
        s.kind === "진입" ||
        s.kind === "판정" ||
        (s.kind === "줄임" &&
          s.lowFrom !== null &&
          s.low[s.lowFrom.vertex] !== s.lowFrom.before);
      state = changed ? "focus" : "read";
    }
    return {
      ...(kind === "plain" ? {} : { kind }),
      ...(state ? { state } : {}),
      label: `간선 ${k}`,
    };
  });
  const call = s?.call ?? [];
  const came = s?.callE ?? [];
  const found = (s?.found ?? []).map(([a, b]) => ed(a, b));
  const pushed = s?.kind === "진입";
  const newBridge =
    s?.kind === "판정"
      ? found.indexOf(
          ed(
            Math.min(s.parent as number, s.v),
            Math.max(s.parent as number, s.v),
          ),
        )
      : -1;
  const top = call.length - 1;
  const topState = pushed ? ("focus" as const) : ("read" as const);
  return {
    nodes,
    edges,
    strips: [
      {
        label: "호출 스택",
        values: call,
        slots: WALK_N,
        ...(top >= 0 ? { states: { [top]: topState } } : {}),
      },
      {
        label: "내려온 간선",
        values: came,
        slots: WALK_N,
        ...(top >= 0 ? { states: { [top]: topState } } : {}),
      },
      {
        label: "다리",
        values: found,
        slots: WALK_N - 1,
        ...(newBridge >= 0
          ? { states: { [newBridge]: "focus" as const } }
          : {}),
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
      text: "간선마다 두 끝의 이웃 목록에 서로를 넣고 같은 자리에 간선 번호를 적습니다. disc · low 를 모두 -1 로 둡니다. 아직 들어간 정점이 없어 호출 스택이 비어 있습니다.",
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
  const list = RUN.found.map(([a, b]) => ed(a, b)).join(" · ");
  all.push({
    title: `T${RUN.steps.length + 2} 반환`,
    text: `모은 다리를 앞 번호로, 같으면 뒤 번호로 세워 ${list}${을를(list)} 돌려줍니다.`,
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

/** 겹친 간선 한 쌍에 꼬리 — 같은 두 정점 사이의 간선 둘을 번호로 가른다. */
function twinScene(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const c = counted(TWIN_TAIL_N, TWIN_TAIL_EDGES, false);
  const nodes: GraphNode[] = Array.from({ length: TWIN_TAIL_N }, (_, v) => ({
    id: v,
    x: 0,
    y: v * 1.4,
    value: `${c.disc[v]} / ${c.low[v]}`,
  }));
  const bends = [0.35, -0.35];
  let twin = 0;
  const edges = TWIN_TAIL_EDGES.map(([from, to], k): GraphEdge => {
    const kind = kindOf(c.kinds[k]);
    const same = TWIN_TAIL_EDGES.filter(
      ([a, b]) => (a === from && b === to) || (a === to && b === from),
    ).length;
    const bend = same > 1 ? bends[twin++] : undefined;
    return {
      from,
      to,
      kind,
      label: `간선 ${k} · ${c.kinds[k] ?? ""}`,
      ...(kind === "back" ? { state: "focus" as const } : {}),
      ...(bend === undefined ? {} : { bend }),
    };
  });
  return { nodes, edges };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-bridges": () => {
    const names = WALK_ANSWER.map(([a, b]) => ed(a, b)).join(" · ");
    return (
      <NodeGraph
        title={`전개 입력 — 강조한 간선 ${names}${이가(names)} 다리`}
        nodes={LAYOUT.nodes}
        edges={LAYOUT.edges.map((e, k) => ({
          ...e,
          ...(isBridge(k) ? { state: "focus" as const, label: "다리" } : {}),
        }))}
        directed={false}
      />
    );
  },
  "concept-dfs-low": () => (
    <NodeGraph
      title="깊이 우선 탐색 트리 — 정점 안의 두 수는 disc / low"
      unit={TREE_UNIT}
      nodes={treeNodes(
        (v) => `${RUN.disc[v]} / ${RUN.low[v]}`,
        (v) => (RUN.low[v] !== RUN.disc[v] ? "focus" : undefined),
      )}
      edges={kindEdges({
        tree: true,
        state: (k) => (isBridge(k) ? "focus" : undefined),
        text: (k) =>
          isBridge(k)
            ? "다리"
            : RUN.kinds[k] === "되돌아감"
              ? "되돌아감"
              : undefined,
      })}
      directed={false}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 V = E = ${comma(E_LIMIT)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-parallel": () => {
    const s = twinScene();
    return (
      <NodeGraph
        title="겹친 간선 한 쌍에 꼬리 — 정점 안의 두 수는 disc / low"
        nodes={s.nodes}
        edges={s.edges}
        directed={false}
      />
    );
  },
  "build-judge": () => (
    <Film
      spec={bridgesWalk as unknown as PlayerSpec}
      pick={["T12", "T14", "T16"]}
    />
  ),
  "walk-bridges": () => <Film spec={bridgesWalk as unknown as PlayerSpec} />,
};
