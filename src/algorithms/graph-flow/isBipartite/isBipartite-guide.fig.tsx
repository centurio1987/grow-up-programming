/**
 * `isBipartite-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 쪽 배열 · 걸음 · 나무 경로 걸음 수는 정본과 같은 절차에
 * 기록만 덧붙인 사본(`-guide.proof.ts` 의 `traced` · `sidesFrom`)이 내고, 그 사본은 부를 때마다 자기
 * 답을 정본(`-guide.ref.ts`)과 맞댄다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `isBipartite-guide.test.ts` 가 잰다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 길이 4 짜리 고리 0 · 1 · 2 · 3 을 왼쪽 네모로, 삼각형
 * 4 · 5 · 6 을 그 오른쪽에 둔다. 쪽은 정점 안의 값(「쪽 0」·「쪽 1」)으로 적는다 — 칸 상태(새로 씀 ·
 * 읽음)는 걸음의 강조가 쓰므로 쪽을 상태로 칠하지 않는다.
 */

import type { ReactElement } from "react";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  BIG_E,
  BIG_V,
  bigDigits,
  comma,
  type Edge,
  ladderNumbers,
  ring,
  type Step,
  sidesFrom,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./isBipartite-guide.proof.ts";
import { isBipartite } from "./isBipartite-guide.ref.ts";
import { bipartiteWalk } from "./isBipartite-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 0 },
    { id: 1, x: 1.3, y: 0 },
    { id: 2, x: 1.3, y: 1.3 },
    { id: 3, x: 0, y: 1.3 },
    { id: 4, x: 3.3, y: 0 },
    { id: 5, x: 4, y: 1.3 },
    { id: 6, x: 2.6, y: 1.3 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
};

const sideText = (s: number): string => (s === -1 ? "" : `쪽 ${s}`);

/** 간선 번호 — 무향이라 두 방향 어느 쪽으로 물어도 같은 간선이다. */
const edgeIndex = (edges: readonly Edge[], a: number, b: number): number =>
  edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행과 식에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "쪽 나눔 전부 시험",
      idea: "정점마다 쪽 0 과 쪽 1 을 고르는 2^V 가지를 만들어 간선마다 두 끝을 확인한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전개 입력에서 간선 확인 ${comma(n.walkChecks)} 번 · V = ${comma(BIG_V)} 이면 후보가 ${comma(bigDigits())} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "정점 하나의 쪽을 정하면 이웃의 쪽이 정해진다 — 고를 것을 연결 성분마다 하나로 줄이자",
    },
    {
      name: "방문 여부만 적으며 전파",
      idea: "시작 정점에서 이웃으로 퍼져 나가되, 정점마다 「봤다」 하나만 적는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `본 이웃에서 false 를 내면 길이 4 짜리 고리가 ${n.ringF}, 넘어가면 삼각형이 ${n.triS}`,
          ok: false,
        },
        { label: "시간", value: "이웃 항목 확인 2E 번 이하", ok: true },
      ],
      lesson:
        "이미 본 이웃이 어느 쪽인지 모른다 — 「봤다」 대신 그 정점의 쪽을 적자",
    },
    {
      name: "쪽 배열 탐색",
      idea: "정점마다 쪽 0 · 1 을 적고 이웃에는 반대쪽을 적는다. 이미 적힌 이웃의 쪽이 자기와 같으면 false",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `이웃 항목 확인 2E 번 이하 · 전개 입력에서 ${n.walkEntries} 번 · V = ${comma(BIG_V)}, E = ${comma(BIG_E)} 에서 칸 접근 ${comma(n.bigCells)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 전개에서 스택이 가장 길었던 길이 — 띠의 칸 수를 걸음 사이에 고정한다. */
const STACK_SLOTS = Math.max(...WALK.steps.map((s) => s.stack.length));
const ENTRIES = 2 * WALK_EDGES.length;

/** 걸음 i 까지 ③ 에서 쓴 간선 — 쪽을 적어 준 간선이라 굵은 실선(`tree`)으로 그린다. */
function treeUpTo(i: number): Set<number> {
  const out = new Set<number>();
  WALK.steps.forEach((s, j) => {
    if (j <= i && s.branch === 3) {
      out.add(edgeIndex(WALK_EDGES, s.u, s.v as number));
    }
  });
  return out;
}

function stage(i: number): GraphStep {
  const s = WALK.steps[i] as Step;
  const focusV = new Set<number>();
  const readV = new Set<number>();
  if (s.kind === "start") focusV.add(s.u);
  else {
    readV.add(s.u);
    if (s.branch === 3) focusV.add(s.v as number);
    else readV.add(s.v as number);
  }
  const nodes = s.side.map((x, v) => {
    const state: CellState | undefined = focusV.has(v)
      ? "focus"
      : readV.has(v)
        ? "read"
        : x === -1
          ? "empty"
          : undefined;
    return { value: sideText(x), ...(state ? { state } : {}) };
  });
  const tree = treeUpTo(i);
  const here =
    s.kind === "check" ? edgeIndex(WALK_EDGES, s.u, s.v as number) : -1;
  const edges = WALK_EDGES.map((_, j) => {
    const state: GraphEdge["state"] =
      j === here ? (s.branch === 3 ? "focus" : "read") : undefined;
    return {
      ...(tree.has(j) ? { kind: "tree" as const } : {}),
      ...(state ? { state } : {}),
      ...(j === here && s.branch === 1 ? { label: "두 끝이 같은 쪽" } : {}),
    };
  });
  const pushed = s.kind === "start" || s.branch === 3;
  const calc: GraphStep["calc"] =
    s.kind === "start"
      ? { expr: `side[${s.u}] = FIRST_SIDE =`, result: "0" }
      : s.branch === 3
        ? {
            expr: `side[${s.v}] = 1 - side[${s.u}] = 1 - ${s.su} =`,
            result: String(1 - s.su),
          }
        : {
            expr: `side[${s.v}] === side[${s.u}] → ${s.before} === ${s.su} →`,
            result: s.branch === 1 ? "참" : "거짓",
          };
  const checks = WALK.steps
    .slice(0, i + 1)
    .filter((t) => t.kind === "check").length;
  return {
    nodes,
    edges,
    strips: [
      {
        label: "stack",
        values: [...s.stack],
        slots: STACK_SLOTS,
        ...(pushed
          ? { states: { [s.stack.length - 1]: "focus" as const } }
          : {}),
      },
    ],
    calc,
    vars: `확인한 이웃 항목 ${checks} / ${ENTRIES}`,
  };
}

function stepTitle(s: Step): string {
  if (s.kind === "start") return `${s.id} 시작 정점 ${s.u} 에 쪽 0`;
  const what =
    s.branch === 1 ? "쪽이 같다" : s.branch === 2 ? "이미 반대쪽" : "쪽이 없다";
  return `${s.id} 정점 ${s.u} 의 이웃 ${s.v} — ${what}`;
}

function stepText(s: Step): string {
  if (s.kind === "start") {
    return `바깥 반복이 쪽이 없는 정점 ${s.u}${을를(s.u)} 찾았습니다. 연결 성분의 첫 정점이라 쪽 0 을 적고 스택에 넣습니다.`;
  }
  const v = s.v as number;
  const lead = s.popped
    ? `정점 ${s.u}${을를(s.u)} 스택에서 꺼냈습니다. 자기 쪽이 ${s.su}${이가(s.su)}라 이웃에 적을 쪽은 ${1 - s.su} 입니다. `
    : "";
  if (s.branch === 3) {
    return `${lead}이웃 ${v}${이가(v)} 아직 쪽이 없어 ${1 - s.su}${을를(1 - s.su)} 적고 스택에 넣습니다.`;
  }
  if (s.branch === 2) {
    return `${lead}이웃 ${v} 의 쪽 ${s.before}${이가(s.before)} 자기 쪽 ${s.su}${과와(s.su)} 달라 넘어갑니다.`;
  }
  return `${lead}이웃 ${v} 의 쪽 ${s.before}${이가(s.before)} 자기 쪽 ${s.su}${과와(s.su)} 같습니다. 간선 [${s.u},${v}] 의 두 끝이 한 쪽에 들어가므로 false 를 반환합니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return WALK.steps.map((s, i) => ({
    title: stepTitle(s),
    text: stepText(s),
    ...stage(i),
  }));
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

/* ── 정적 그림들 ── */

const RING = ring(4);
const RING_RUN = sidesFrom(4, RING, 0);

/** 길이 4 짜리 고리를 쪽마다 한 줄로 — 쪽 0 이 위 줄, 쪽 1 이 아래 줄이다. */
function rows(): GraphNode[] {
  const col = [0, 0];
  return RING_RUN.side.map((x, v) => {
    const at = col[x] as number;
    col[x] = at + 1;
    return { id: v, x: at * 1.6 + x * 0.8, y: x * 1.6, value: sideText(x) };
  });
}

/** 삼각형 성분의 탐색 나무 — 시작 정점 4 에서 나무 경로 걸음 수 `d` 를 정점 안에 적는다. */
function oddCycle(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const run = sidesFrom(WALK_N, WALK_EDGES, 0);
  const members = [4, 5, 6];
  const xy: Record<number, { x: number; y: number }> = {
    4: { x: 1, y: 0 },
    5: { x: 2, y: 1.4 },
    6: { x: 0, y: 1.4 },
  };
  const nodes = members.map((v) => ({
    id: v,
    ...(xy[v] as { x: number; y: number }),
    label: v === 4 ? "4 (w)" : String(v),
    value: `d = ${run.depth[v]}`,
  }));
  const edges: GraphEdge[] = WALK_EDGES.filter(
    ([a, b]) => members.includes(a) && members.includes(b),
  ).map(([a, b]) => {
    const tree = run.parent[a] === b || run.parent[b] === a;
    return tree
      ? { from: a, to: b, kind: "tree" as const, label: "나무 경로" }
      : { from: a, to: b, state: "focus" as const, label: "어긋나는 간선" };
  });
  return { nodes, edges };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-sides": () => {
    const side = WALK.side;
    return (
      <NodeGraph
        title="전개 입력 — 정점 안은 절차가 멈춘 시점에 적힌 쪽"
        directed={false}
        nodes={LAYOUT.nodes.map((n) => ({
          ...n,
          value: sideText(side[n.id] as number),
        }))}
        edges={WALK_EDGES.map(([from, to]) =>
          side[from] === side[to]
            ? { from, to, state: "focus" as const, label: "두 끝이 쪽 1" }
            : { from, to },
        )}
        groups={[
          {
            members: [0, 1, 2, 3],
            label: `연결 성분 [0, 1, 2, 3] · ${isBipartite(4, RING) ? "두 쪽으로 나뉜다" : "나뉘지 않는다"}`,
          },
          {
            members: [4, 5, 6],
            label: `연결 성분 [4, 5, 6] · ${isBipartite(3, ring(3)) ? "두 쪽으로 나뉜다" : "나뉘지 않는다"}`,
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 V = ${comma(BIG_V)} · E = ${comma(BIG_E)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-rows": () => (
    <NodeGraph
      title="길이 4 짜리 고리를 쪽마다 한 줄로 — 모든 간선이 두 줄 사이를 잇는다"
      directed={false}
      nodes={rows()}
      edges={RING.map(([from, to]) => ({ from, to }))}
      groups={[0, 1].map((x) => ({
        members: RING_RUN.side.flatMap((s, v) => (s === x ? [v] : [])),
        label: `쪽 ${x}`,
      }))}
    />
  ),
  "build-clash": () => (
    <Film
      spec={bipartiteWalk as unknown as PlayerSpec}
      pick={["T11", "T12", "T13"]}
    />
  ),
  "walk-bipartite": () => (
    <Film spec={bipartiteWalk as unknown as PlayerSpec} />
  ),
  "math-odd-cycle": () => {
    const g = oddCycle();
    const d = sidesFrom(WALK_N, WALK_EDGES, 0).depth;
    const len = (d[5] as number) + (d[6] as number) + 1 - 2 * (d[4] as number);
    return (
      <NodeGraph
        title={`어긋나는 간선 [5,6] 과 두 나무 경로가 길이 ${len} 짜리 고리를 이룬다`}
        directed={false}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
};
