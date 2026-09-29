/**
 * `connectedComponents-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 성분 번호와 걸음은 정본과 같은 절차에 기록만 덧붙인
 * 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본(`-guide.ref.ts`)과
 * 맞댄다. 시도 사다리의 수는 증명 사이드카가 작은 규모의 실행과 맞대어 확인한 식에서 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `connectedComponents-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 성분 묶음 테가 겹치지 않게 삼각형 0 · 4 · 2 를 왼쪽에,
 * 간선 하나로 이어진 1 · 3 을 가운데에, 간선이 없는 정점 5 를 오른쪽에 둔다.
 */

import type { ReactElement } from "react";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type EdgeKind,
  type GraphEdge,
  type GraphGroup,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  comma,
  type Edge,
  FOREST,
  ladderNumbers,
  pending,
  type Step,
  seconds,
  show,
  showGroups,
  stats,
  stepOf,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./connectedComponents-guide.proof.ts";
import { connectedComponents } from "./connectedComponents-guide.ref.ts";
import { ccWalk } from "./connectedComponents-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1, y: 0 },
    { id: 1, x: 3.4, y: 0 },
    { id: 2, x: 2, y: 1.3 },
    { id: 3, x: 3.4, y: 1.3 },
    { id: 4, x: 0, y: 1.3 },
    { id: 5, x: 4.8, y: 0.65 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const compText = (c: number): string => (c === -1 ? "" : `comp ${c}`);

/** 간선 번호 — 무향이라 두 방향 어느 쪽으로 물어도 같은 간선이다. */
const edgeIndex = (edges: readonly Edge[], a: number, b: number): number =>
  edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));

/** 성분 번호가 적힌 정점을 번호별로 묶는다. */
function groupsOf(comp: readonly number[], focus: number | null): GraphGroup[] {
  const top = Math.max(-1, ...comp);
  return Array.from({ length: top + 1 }, (_, c) => ({
    members: comp.flatMap((x, v) => (x === c ? [v] : [])),
    label: `성분 ${c}`,
    ...(c === focus ? { state: "focus" as const } : {}),
  }));
}

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행과, 실행으로 확인한 식에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "정점마다 새로 탐색하기",
      idea: "정점마다 방문 표시를 새로 만들어 너비 우선 탐색을 하고, 같은 모임은 마지막에 지운다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 V = ${comma(n.big)} 에서 ${comma(n.naiveOps)} 번 · ${seconds(n.naiveOps)}`,
          ok: false,
        },
      ],
      lesson:
        "이미 어느 성분에 든 정점에서 다시 시작한 탐색이 헛일이다 — 방문 표시를 지우지 말자",
    },
    {
      name: "참·거짓 방문 표시를 지우지 않기",
      idea: "방문 표시를 한 번만 만들고, 표시가 없는 정점에서만 탐색을 시작한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `탐색이 만난 순서 ${show(n.firstUnsorted)}${을를(String(n.firstUnsorted.at(-1)))} ${show(n.firstSorted)}${으로(String(n.firstSorted.at(-1)))} 따로 정렬해야 한다`,
          ok: false,
        },
        { label: "시간", value: "탐색 부분은 V + 2E 번", ok: true },
      ],
      lesson:
        "참·거짓은 어느 성분이었는지를 잊는다 — 표에 성분 번호를 적으면 번호 순서로 한 번 담아 정렬이 된다",
    },
    {
      name: "성분 번호를 지우지 않기",
      idea: "comp[v] 에 성분 번호를 적고, comp 가 -1 인 정점에서만 탐색을 시작한 뒤 정점 번호 순서로 담는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다 · 정렬 호출 없음", ok: true },
        {
          label: "시간",
          value: `2V + 2E 번 · 사슬 V = ${comma(n.big)} 에서 ${comma(n.shareOps)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 전개에서 큐가 가장 길었던 길이 — 띠의 칸 수를 걸음 사이에 고정한다. */
const QUEUE_SLOTS = Math.max(...WALK.steps.map((s) => s.queue.length));

/** 걸음 i 까지 ③ 에서 쓴 간선 — 그림에서 굵은 실선(`tree`)으로 그린다. */
function treeUpTo(i: number): Set<number> {
  const out = new Set<number>();
  WALK.steps.forEach((st, j) => {
    const e = st.event;
    if (j <= i && e.kind === "check" && e.fresh) {
      out.add(edgeIndex(WALK_EDGES, e.node, e.next));
    }
  });
  return out;
}

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const st = WALK.steps[i] as Step;
  const e = st.event;
  const written =
    e.kind === "start" ? e.s : e.kind === "check" && e.fresh ? e.next : null;
  const read: number[] =
    e.kind === "skip"
      ? [e.s]
      : e.kind === "check"
        ? e.fresh
          ? [e.node]
          : [e.node, e.next]
        : [];
  const nodes = st.comp.map((c, v) => {
    let state: CellState | undefined;
    if (v === written) state = "focus";
    else if (read.includes(v)) state = "read";
    if (c === -1) return { value: "", state: state ?? ("empty" as const) };
    return { value: compText(c), ...(state ? { state } : {}) };
  });
  const tree = treeUpTo(i);
  const here = e.kind === "check" ? edgeIndex(WALK_EDGES, e.node, e.next) : -1;
  const edges = WALK_EDGES.map((_, j) => {
    const kind: EdgeKind | undefined = tree.has(j) ? "tree" : undefined;
    const state: GraphEdge["state"] =
      j === here && e.kind === "check"
        ? e.fresh
          ? "focus"
          : "read"
        : undefined;
    return { ...(kind ? { kind } : {}), ...(state ? { state } : {}) };
  });
  const states: Partial<Record<number, CellState>> = {};
  st.queue.forEach((_, q) => {
    if (q < st.head - 1) states[q] = "out";
    else if (q === st.head - 1) states[q] = "read";
  });
  if (e.kind === "start") states[0] = "focus";
  else if (e.kind === "check" && e.fresh) states[st.queue.length - 1] = "focus";
  const calc: GraphStep["calc"] =
    e.kind === "init"
      ? { expr: `comp[0 … ${WALK_N - 1}] =`, result: "-1" }
      : e.kind === "start"
        ? { expr: `comp[${e.s}] = count =`, result: String(st.comp[e.s]) }
        : e.kind === "skip"
          ? { expr: `comp[${e.s}] !== -1 →`, result: "참" }
          : e.kind === "check"
            ? e.fresh
              ? {
                  expr: `comp[${e.next}] = count =`,
                  result: String(st.comp[e.next]),
                }
              : { expr: `comp[${e.next}] !== -1 →`, result: "참" }
            : { expr: "out =", result: showGroups(WALK.out) };
  const s = e.kind === "init" ? null : e.kind === "collect" ? WALK_N : e.s;
  const focusGroup = written === null ? null : (st.comp[written] as number);
  return {
    nodes,
    edges,
    groups: groupsOf(st.comp, focusGroup),
    strips: [
      {
        label: "큐",
        values: [...st.queue],
        states,
        slots: QUEUE_SLOTS,
      },
    ],
    calc,
    vars: s === null ? `count = ${st.count}` : `s = ${s} · count = ${st.count}`,
  };
}

function stepTitle(i: number): string {
  const st = WALK.steps[i] as Step;
  const e = st.event;
  const id = stepOf(i);
  if (e.kind === "init") return `${id} comp 를 -1 로 채운다`;
  if (e.kind === "start")
    return `${id} 시작점 ${e.s} — 새 성분 ${st.comp[e.s]}`;
  if (e.kind === "skip") {
    const c = st.comp[e.s] as number;
    return `${id} 시작점 ${e.s} — 이미 성분 ${c}${이가(String(c)) === " 이" ? " 이라" : "라"} 건너뛴다`;
  }
  if (e.kind === "check") {
    return `${id} 정점 ${e.node} 의 이웃 ${e.next} — ${e.fresh ? "처음 만난다" : "이미 번호가 있다"}`;
  }
  return `${id} 정점 번호 오름차순으로 담는다`;
}

function stepText(i: number): string {
  const st = WALK.steps[i] as Step;
  const e = st.event;
  if (e.kind === "init") {
    return `이웃 목록을 만들고 comp 를 전부 -1 로 둡니다. 아직 어느 정점도 성분에 들지 않았습니다.`;
  }
  if (e.kind === "start") {
    return `comp[${e.s}]${이가(String(e.s))} -1 이라 새 성분의 시작점입니다. 번호 ${st.comp[e.s]}${을를(String(st.comp[e.s]))} 적고 큐에 넣습니다.`;
  }
  if (e.kind === "skip") {
    return `comp[${e.s}] 에 이미 ${st.comp[e.s]}${이가(String(st.comp[e.s]))} 적혀 있습니다. 앞선 탐색이 이 정점을 담았으니 새 탐색을 시작하지 않습니다.`;
  }
  if (e.kind === "check") {
    const left = pending(st);
    return e.fresh
      ? `comp[${e.next}]${이가(String(e.next))} -1 이라 처음 만나는 이웃입니다. 같은 번호 ${st.comp[e.next]}${을를(String(st.comp[e.next]))} 적고 큐 뒤에 넣습니다.`
      : `comp[${e.next}] 에 이미 ${st.comp[e.next]}${이가(String(st.comp[e.next]))} 적혀 있어 그대로 둡니다.${left.length === 0 ? " 큐가 비어 이 성분의 탐색이 끝납니다." : ""}`;
  }
  return `s 가 ${WALK_N} 에 이르러 바깥 반복이 끝났습니다. 정점 0 부터 차례로 comp 가 가리키는 칸에 넣으면 반환값은 ${showGroups(WALK.out)} 입니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
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

/* ── 정적 그림들 ── */

/** 최악을 만드는 세 모양을 정점 여섯으로 줄여 한 장에 — 별 · 고리 · 간선 없음. 번호는 정본이 낸다. */
function worstShapes(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
} {
  const v = 6;
  const shapes: {
    key: string;
    name: string;
    edges: Edge[];
    at: (i: number) => { x: number; y: number };
  }[] = [
    {
      key: "s",
      name: "별 모양",
      edges: Array.from({ length: v - 1 }, (_, i) => [0, i + 1] as Edge),
      at: (i) =>
        i === 0
          ? { x: 1, y: 0.8 }
          : ([
              { x: 0, y: 0 },
              { x: 1, y: -0.1 },
              { x: 2, y: 0 },
              { x: 0.3, y: 1.7 },
              { x: 1.7, y: 1.7 },
            ][i - 1] as { x: number; y: number }),
    },
    {
      key: "r",
      name: "고리 하나",
      edges: Array.from({ length: v }, (_, i) => [i, (i + 1) % v] as Edge),
      at: (i) =>
        [
          { x: 3.8, y: 0 },
          { x: 4.8, y: 0 },
          { x: 5.8, y: 0.8 },
          { x: 4.8, y: 1.7 },
          { x: 3.8, y: 1.7 },
          { x: 3.3, y: 0.8 },
        ][i] as { x: number; y: number },
    },
    {
      key: "e",
      name: "간선 없음",
      edges: [],
      at: (i) => ({ x: 7.3 + (i % 2) * 1, y: Math.floor(i / 2) * 0.85 }),
    },
  ];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  for (const sh of shapes) {
    const out = connectedComponents(v, sh.edges);
    const s = stats(v, sh.edges);
    const comp = Array.from({ length: v }, () => -1);
    out.forEach((c, i) => {
      for (const x of c) comp[x] = i;
    });
    comp.forEach((c, i) => {
      nodes.push({
        id: `${sh.key}${i}`,
        label: String(i),
        ...sh.at(i),
        value: compText(c),
      });
    });
    for (const [a, b] of sh.edges) {
      edges.push({ from: `${sh.key}${a}`, to: `${sh.key}${b}` });
    }
    groups.push({
      members: comp.map((_, i) => `${sh.key}${i}`),
      label: `${sh.name} · 성분 ${out.length} · 큐 최대 ${s.peak}`,
    });
  }
  return { nodes, edges, groups };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-components": () => (
    <NodeGraph
      title="전개 입력의 연결 성분 셋 — 점선 테 하나가 성분 하나"
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: compText(WALK.comp[n.id] as number),
      }))}
      edges={LAYOUT.edges}
      groups={groupsOf(WALK.comp, null)}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    const n = ladderNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`제약 V = E = ${comma(n.big)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-skip": () => {
    const i = WALK.steps.findIndex(
      (s) => s.event.kind === "skip" && s.event.s === 2,
    );
    const st = WALK.steps[i] as Step;
    const tree = treeUpTo(i);
    return (
      <NodeGraph
        title={`${stepOf(i)} — 바깥 반복이 s = 2 를 볼 때 comp[2] = ${st.comp[2]} 이라 건너뛴다`}
        directed={false}
        nodes={LAYOUT.nodes.map((n) => {
          const c = st.comp[n.id] as number;
          const state: CellState | undefined =
            n.id === 2 ? "read" : c === -1 ? "empty" : undefined;
          return {
            ...n,
            value: compText(c),
            ...(state ? { state } : {}),
          };
        })}
        edges={WALK_EDGES.map(([from, to], j) => ({
          from,
          to,
          ...(tree.has(j) ? { kind: "tree" as const } : {}),
        }))}
        groups={groupsOf(st.comp, null)}
      />
    );
  },
  "walk-cc": () => <Film spec={ccWalk as unknown as PlayerSpec} />,
  "related-forest": () => (
    <NodeGraph
      title="탐색이 만든 숲 — 굵은 실선이 ③ 에서 쓴 간선, 흐린 선은 쓰지 않은 간선"
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: compText(WALK.comp[n.id] as number),
      }))}
      edges={WALK_EDGES.map(([from, to]) => {
        const used = FOREST.some(
          ([a, b]) => (a === from && b === to) || (a === to && b === from),
        );
        return used
          ? { from, to, kind: "tree" as const }
          : { from, to, state: "out" as const, label: "숲 밖" };
      })}
      groups={WALK.out.map((c, i) => ({
        members: [...c],
        label: `트리 ${i} · 간선 ${c.length - 1}`,
      }))}
    />
  ),
  "worst-shapes": () => {
    const g = worstShapes();
    return (
      <NodeGraph
        title="정점 여섯으로 줄여 그린 세 모양 — 정점 안은 성분 번호"
        directed={false}
        nodes={g.nodes}
        edges={g.edges}
        groups={g.groups}
      />
    );
  },
};
