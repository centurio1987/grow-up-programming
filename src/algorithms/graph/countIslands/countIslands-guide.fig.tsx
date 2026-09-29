/**
 * `countIslands-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 걸음과 섬 번호는 정본과 같은 절차에 기록만 덧붙인
 * 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을 정본(`-guide.ref.ts`)과
 * 맞댄다. 시도 사다리의 수는 증명 사이드카가 작은 격자의 실행과 맞대어 확인한 식에서 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `countIslands-guide.test.ts` 가 잰다.
 *
 * **격자를 그래프 무대에 그대로 놓는다**(SPEC §13 「그래프」 무대, `NodeGraph`). 칸 하나가 정점이고
 * 자리는 격자 자리 그대로다(`x` 는 열, `y` 는 행). 간선은 변을 공유하는 두 땅 칸 사이에만 긋는다 —
 * 이 편의 요점이 「격자를 그래프로 본다」이므로, 칸 줄을 쌓는 칸 무대보다 이웃 관계가 선으로 보이는
 * 이 무대가 전하려는 것에 맞다. 물 칸은 정점 자리만 두고 「이번 걸음 밖」 모양(대시 테)으로 흐리게
 * 그린다. 섬을 테로 묶지 않는 것은 L 자 섬의 테가 가운데 물 칸까지 덮기 때문이다 — 섬 번호는 정점
 * 안의 값으로 적는다.
 */

import type { ReactElement } from "react";
import { 으로 } from "../../../../tools/josa.ts";
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
import { 전부땅 } from "./countIslands-guide.alt.ts";
import {
  cell,
  comma,
  D4,
  D8,
  type Event,
  type Grid,
  labelsWith,
  ladderNumbers,
  landPairs,
  type Run,
  type Step,
  sidePairs,
  stepOf,
  traced,
  U자,
  WALK,
  WALK_RUN,
  왼쪽위규칙,
} from "./countIslands-guide.proof.ts";
import { countIslands } from "./countIslands-guide.ref.ts";
import { islandScan } from "./countIslands-guide.sim.ts";

const W = WALK_RUN;
const WC = W.C;

/** 격자의 칸을 정점으로 — 번호는 `r·C + c`, 자리는 `x = c` · `y = r`. */
function gridNodes(grid: Grid, prefix = "", dx = 0): GraphNode[] {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  return Array.from({ length: R * C }, (_, i) => ({
    id: `${prefix}${i}`,
    x: dx + (i % C),
    y: Math.floor(i / C),
    label: cell(i, C),
  }));
}

/** 입력 격자의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: Array.from({ length: W.R * WC }, (_, i) => ({
    id: i,
    x: i % WC,
    y: Math.floor(i / WC),
    label: cell(i, WC),
  })),
  edges: landPairs(WALK).map(([from, to]) => ({ from, to })),
  directed: false,
};

const isWater = (grid: Grid, i: number, C: number): boolean =>
  (grid[Math.floor(i / C)] as number[])[i % C] === 0;

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;
type Pop = Extract<Event, { kind: "pop" }>;

/** 두 칸을 잇는 간선의 차례 — 없으면 -1. */
const edgeIndex = (a: number, b: number): number =>
  LAYOUT.edges.findIndex(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
  );

/** 걸음 i 까지 처음 보는 땅을 담을 때 쓴 간선 — 굵은 실선(`tree`)으로 그린다. */
function treeUpTo(i: number): Set<number> {
  const out = new Set<number>();
  W.steps.forEach((st, j) => {
    const e = st.event;
    if (j > i || e.kind !== "pop") return;
    for (const k of e.checks) {
      if (k.look === "push") out.add(edgeIndex(e.cell, k.cell as number));
    }
  });
  return out;
}

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const st = W.steps[i] as Step;
  const e = st.event;
  const read =
    e.kind === "pop"
      ? [e.cell]
      : e.kind === "skip"
        ? e.cells.map((x) => x.cell)
        : [];
  const write =
    e.kind === "start"
      ? [e.cell]
      : e.kind === "pop"
        ? e.checks.flatMap((k) => (k.look === "push" ? [k.cell as number] : []))
        : [];
  const nodes = st.label.map((lab, v) => {
    const state: CellState | undefined = write.includes(v)
      ? "focus"
      : read.includes(v)
        ? "read"
        : undefined;
    const empty: CellState = "empty";
    const out: CellState = "out";
    if (isWater(WALK, v, WC)) return { value: "물", state: state ?? out };
    if (lab === 0) return { value: "땅", state: state ?? empty };
    return { value: `섬 ${lab}`, ...(state ? { state } : {}) };
  });
  const tree = treeUpTo(i);
  const edges = LAYOUT.edges.map((_, j) => {
    let state: GraphEdge["state"];
    if (e.kind === "pop") {
      for (const k of e.checks) {
        if (k.cell === null || edgeIndex(e.cell, k.cell) !== j) continue;
        if (k.look === "push") state = "focus";
        else if (k.look === "seen") state = "read";
      }
    }
    return {
      ...(tree.has(j) ? { kind: "tree" as const } : {}),
      ...(state ? { state } : {}),
    };
  });
  const pushed = write.length;
  const states: Partial<Record<number, CellState>> = {};
  if (e.kind !== "skip") {
    for (let q = st.stack.length - pushed; q < st.stack.length; q++) {
      states[q] = "focus";
    }
  }
  const calc: GraphStep["calc"] =
    e.kind === "start"
      ? { expr: "islands =", result: String(st.islands) }
      : e.kind === "pop"
        ? { expr: "stack.pop() =", result: cell(e.cell, WC) }
        : { expr: "건너뛴 칸 =", result: `${e.cells.length} 개` };
  return {
    nodes,
    edges,
    strips: [
      {
        label: "스택",
        values: st.stack.map((x) => cell(x, WC)),
        states,
        slots: W.maxStack,
      },
    ],
    calc,
    vars: `islands = ${st.islands}`,
  };
}

function stepTitle(i: number): string {
  const st = W.steps[i] as Step;
  const e = st.event;
  const id = stepOf(i);
  if (e.kind === "start")
    return `${id} ${cell(e.cell, WC)} — 새 섬 ${st.islands} 시작`;
  if (e.kind === "pop")
    return `${id} ${cell(e.cell, WC)} 꺼내기 — 이웃 넷 확인`;
  return `${id} 바깥 반복 — ${e.cells.map((x) => cell(x.cell, WC)).join(" ")} 건너뛰기`;
}

function stepText(i: number): string {
  const st = W.steps[i] as Step;
  const e = st.event;
  if (e.kind === "start") {
    return `땅이고 표시가 없는 칸이라 ② 로 갑니다. islands 를 ${st.islands}${으로(st.islands)} 올리고, 이 칸에 표시를 켠 뒤 스택에 담습니다.`;
  }
  if (e.kind === "pop") {
    const n = (look: string) =>
      (e as Pop).checks.filter((k) => k.look === look).length;
    const pushed = e.checks.flatMap((k) =>
      k.look === "push" ? [cell(k.cell as number, WC)] : [],
    );
    const head = `이웃 넷 가운데 격자 밖이 ${n("out")} 개, 물이 ${n("water")} 개, 이미 표시된 칸이 ${n("seen")} 개, 처음 보는 땅이 ${n("push")} 개입니다.`;
    const body =
      pushed.length > 0
        ? ` 처음 보는 땅 ${pushed.join(" ")} 에 표시를 켜고 스택에 담습니다.`
        : " 담는 칸이 없습니다.";
    const tail =
      st.stack.length === 0
        ? ` 스택이 비어 섬 ${st.islands} 의 표시가 끝납니다.`
        : "";
    return head + body + tail;
  }
  const water = e.cells.filter((x) => x.why === "water").length;
  const seen = e.cells.length - water;
  const parts: string[] = [];
  if (water > 0) parts.push(`물 칸 ${water} 개`);
  if (seen > 0) parts.push(`이미 표시된 땅 칸 ${seen} 개`);
  return `${parts.join("와 ")}라 ① 로 건너뜁니다. 새 섬을 시작하지 않습니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return W.steps.map((_, i) => ({
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

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행과, 실행으로 확인한 식에서 ── */

function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "땅 칸마다 덩어리 다시 구하기",
      idea: "땅 칸마다 그 칸이 속한 덩어리를 처음부터 구하고, 서로 다른 덩어리를 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${comma(n.big)} × ${comma(n.big)} 전부 땅에서 칸 읽기 ${comma(n.naiveOps)} 번 · ${n.naiveSeconds}`,
          ok: false,
        },
      ],
      lesson:
        "같은 섬의 어느 칸에서 시작해도 같은 덩어리가 나온다 — 섬마다 한 번만 구하자",
    },
    {
      name: "왼쪽·위 칸만 보고 판정하기",
      idea: "왼쪽이나 위가 땅이면 이미 센 섬의 칸으로 보고 건너뛴다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `ㄷ 자 격자에서 섬 ${n.uLeftUp} 개 · 정본은 ${n.uRef} 개`,
          ok: false,
        },
        { label: "시간", value: "칸마다 이웃 둘만 읽는다", ok: true },
      ],
      lesson:
        "굽은 섬은 아래로 돌아 이어진다 — 덩어리를 실제로 구하면서 칸마다 표시를 남기자",
    },
    {
      name: "표시를 남기는 플러드 필",
      idea: "표시 없는 땅 칸에서만 새 섬을 시작하고, 스택으로 그 덩어리를 전부 표시한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `같은 격자에서 칸 읽기 ${comma(n.markOps)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 정적 그림들 ── */

/** 전개 입력의 끝 상태 — 섬 번호를 정점 안에. */
function finalScene(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const last = W.steps.at(-1) as Step;
  return {
    nodes: LAYOUT.nodes.map((n) =>
      isWater(WALK, n.id, WC)
        ? { ...n, value: "물", state: "out" as const }
        : { ...n, value: `섬 ${last.label[n.id]}` },
    ),
    edges: LAYOUT.edges.map((e) => ({ ...e, kind: "tree" as const })),
  };
}

/** 칸 번호와 이웃 짝 전부 — 두 끝이 다 땅인 짝만 굵게, 나머지는 흐리게. */
function gridGraphScene(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const land = new Set(landPairs(WALK).map(([a, b]) => `${a}-${b}`));
  return {
    nodes: LAYOUT.nodes.map((n) =>
      isWater(WALK, n.id, WC)
        ? { ...n, value: `번호 ${n.id}`, state: "out" as const }
        : { ...n, value: `번호 ${n.id}` },
    ),
    edges: sidePairs(W.R, WC).map(([from, to]) =>
      land.has(`${from}-${to}`)
        ? { from, to, kind: "tree" as const }
        : { from, to, state: "out" as const },
    ),
  };
}

/** 같은 격자를 두 이웃 정의로 — 왼쪽은 상하좌우 넷, 오른쪽은 대각선까지 여덟. */
function diagonalScene() {
  const sets = [
    { key: "a", dirs: D4, name: "상하좌우 넷", dx: 0 },
    { key: "b", dirs: D8, name: "대각선까지 여덟", dx: WC + 1 },
  ];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: { members: string[]; label: string }[] = [];
  for (const s of sets) {
    const label = labelsWith(WALK, s.dirs);
    for (const n of gridNodes(WALK, s.key, s.dx)) {
      const i = Number(String(n.id).slice(1));
      nodes.push(
        label[i] === 0
          ? { ...n, value: "물", state: "out" }
          : { ...n, value: `섬 ${label[i]}` },
      );
    }
    for (let a = 0; a < W.R * WC; a++) {
      if (label[a] === 0) continue;
      for (const [dr, dc] of s.dirs) {
        const r = Math.floor(a / WC) + dr;
        const c = (a % WC) + dc;
        if (r < 0 || r >= W.R || c < 0 || c >= WC) continue;
        const b = r * WC + c;
        if (b <= a || label[b] === 0) continue;
        const diagonal = dr !== 0 && dc !== 0;
        edges.push({
          from: `${s.key}${a}`,
          to: `${s.key}${b}`,
          kind: "tree",
          ...(diagonal ? { state: "focus" as const } : {}),
        });
      }
    }
    groups.push({
      members: gridNodes(WALK, s.key, s.dx).map((n) => String(n.id)),
      label: `${s.name} — 섬 ${Math.max(...label)} 개`,
    });
  }
  return { nodes, edges, groups };
}

/** ㄷ 자 격자 — 왼쪽·위 규칙이 땅 칸마다 낸 판정. */
function uShapeScene() {
  const C = (U자[0] as number[]).length;
  const got = 왼쪽위규칙(U자);
  const nodes = gridNodes(U자).map((n) => {
    const i = Number(n.id);
    if (isWater(U자, i, C)) return { ...n, value: "물", state: "out" as const };
    const r = got.기록.find((x) => x.칸 === i);
    return r?.새섬 === null || r === undefined
      ? { ...n, value: "건너뜀" }
      : {
          ...n,
          value: `새 섬 ${r.새섬}`,
          ...(r.새섬 > 1 ? { state: "focus" as const } : {}),
        };
  });
  return {
    nodes,
    edges: landPairs(U자).map(([a, b]) => ({
      from: String(a),
      to: String(b),
      kind: "tree" as const,
    })),
    groups: [
      {
        members: nodes.map((n) => String(n.id)),
        label: `왼쪽·위 규칙 섬 ${got.섬} 개 · 정본 섬 ${countIslands(U자)} 개`,
      },
    ],
  };
}

/** 칸 (r, c) 의 이웃 넷과, 이웃이 아닌 대각선 넷. */
function neighboursScene() {
  const at = (dr: number, dc: number) => ({ x: 1 + dc, y: 1 + dr });
  const name = (dr: number, dc: number) => {
    const rr = dr === 0 ? "r" : dr < 0 ? "r−1" : "r+1";
    const cc = dc === 0 ? "c" : dc < 0 ? "c−1" : "c+1";
    return `(${rr},${cc})`;
  };
  const DIR_WORD = ["위", "아래", "왼쪽", "오른쪽"];
  const nodes: GraphNode[] = [
    { id: "o", ...at(0, 0), label: "지금 칸", value: "(r,c)", state: "read" },
  ];
  const edges: GraphEdge[] = [];
  D8.forEach(([dr, dc], k) => {
    const id = `n${k}`;
    const side = k < 4;
    nodes.push({
      id,
      ...at(dr, dc),
      label: side ? (DIR_WORD[k] as string) : "대각선",
      value: name(dr, dc),
      ...(side ? {} : { state: "out" as const }),
    });
    if (side) edges.push({ from: "o", to: id, kind: "tree" });
  });
  return { nodes, edges };
}

/** 4×4 전부 땅 — 스택이 가장 길어진 걸음 직후. */
function worstScene() {
  const g = 전부땅(4);
  const run: Run = traced(g);
  const i = run.steps.findIndex((s) => s.stack.length === run.maxStack);
  const st = run.steps[i] as Step;
  const inStack = new Set(st.stack);
  const nodes = gridNodes(g).map((n) => {
    const v = Number(n.id);
    if (inStack.has(v))
      return { ...n, value: "스택 안", state: "focus" as const };
    if (st.label[v] !== 0) return { ...n, value: "꺼냄" };
    return { ...n, value: "", state: "empty" as const };
  });
  return {
    title: `4×4 전부 땅 — ${stepOf(i)} 직후 스택 ${st.stack.length} 칸 · 칸 ${g.length * g.length} 개`,
    nodes,
    edges: landPairs(g).map(([a, b]) => ({ from: String(a), to: String(b) })),
    strips: [
      {
        label: "스택",
        values: st.stack.map((x) => cell(x, 4)),
        slots: run.maxStack,
      },
    ],
  };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-grid": () => (
    <NodeGraph
      title="3×4 격자를 그래프로 — 땅 칸이 정점, 변을 공유한 두 땅 칸 사이가 간선"
      directed={false}
      {...finalScene()}
    />
  ),
  "concept-neighbours": () => (
    <NodeGraph
      title="칸 (r,c) 의 이웃 넷 — 대각선 넷은 이웃이 아니다"
      directed={false}
      {...neighboursScene()}
    />
  ),
  "origin-u-shape": () => (
    <NodeGraph
      title="ㄷ 자 격자 — 왼쪽·위 규칙은 (0,2) 에서 새 섬을 시작한다"
      directed={false}
      {...uShapeScene()}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    const n = ladderNumbers();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`칸 ${comma(n.big * n.big)} 개 격자 · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-grid-graph": () => (
    <NodeGraph
      title="칸 열둘과 변을 공유한 짝 전부 — 굵은 선이 두 칸 다 땅인 짝"
      directed={false}
      {...gridGraphScene()}
    />
  ),
  "build-diagonal": () => (
    <NodeGraph
      title="같은 격자, 두 이웃 정의 — 강조한 선이 대각선 간선"
      directed={false}
      {...diagonalScene()}
    />
  ),
  "build-skip": () => {
    const frames = playerFrames(islandScan as unknown as PlayerSpec);
    const i = W.steps.findIndex(
      (s) =>
        s.event.kind === "skip" && s.event.cells.some((x) => x.why === "seen"),
    );
    const f = frames[i];
    return (
      <NodeGraph
        title={`${f?.id} — ${f?.title}`}
        directed={false}
        {...(f?.scene ?? { nodes: [], edges: [] })}
      />
    );
  },
  "walk-islands": () => <Film spec={islandScan as unknown as PlayerSpec} />,
  "worst-stack": () => {
    const s = worstScene();
    return (
      <NodeGraph
        title={s.title}
        directed={false}
        nodes={s.nodes}
        edges={s.edges}
        strips={s.strips}
      />
    );
  },
};
