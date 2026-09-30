/**
 * `lowestCommonAncestor-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 깊이 · 2^k 조상 표 · 걸음마다의 `u` 와 `v` 는 정본과 같은
 * 절차에 걸음 기록만 덧붙인 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을
 * 정본(`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수는 배열 칸을 세는 사본(`-guide.alt.ts`)이 낸다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `lowestCommonAncestor-guide.test.ts` 가 잰다.
 *
 * **무대는 「그래프」다**(`stage: "graph"`). 전하려는 것이 「두 정점을 같은 깊이로 맞춘 뒤 함께 2^k 칸씩
 * 올린다」라서, 두 정점이 트리 위 어디에 서 있고 어디로 뛰는지가 요점이다. 파일럿 `sparseTableRangeMin`
 * 의 「층」 무대는 배열 위 구간(괄호와 `min` 알약)을 그리는 무대라 트리를 담지 못한다. 대신 그 파일럿의
 * 말을 그대로 잇는다 — `2^k` 칸 위 조상을 정점마다 적은 줄이 `k` 층이고, 무대 아래 띠 한 줄이 층 하나다.
 * 띠의 칸 차례는 정점 번호이고 맨 위 띠가 그 번호를 적는다.
 *
 * 정점 자리(`LAYOUT`)는 값이 아니라 배치다 — 뿌리 0 에서 매단 트리를 `treeLayout` 으로 놓았다. 자식은
 * 이웃 목록의 차례대로 왼쪽부터 놓는다. 정점 안의 값은 깊이(「depth 2」)이고, 질의 걸음에서 지금 `u` ·
 * `v` 가 선 정점을 묶음 머리말로 두른다. 간선에 방향이 없으므로 `directed: false` 다.
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
  type GraphEdge,
  type GraphGroup,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
  type NodeId,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import {
  type GraphLayout,
  type GraphStep,
  graphScene,
} from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  chain,
  columns,
  liftCounted,
  naiveCounted,
} from "./lowestCommonAncestor-guide.alt.ts";
import {
  at,
  comma,
  lcaText,
  list,
  READ_CELLS,
  stepDoing,
  stepJudge,
  stepOf,
  WALK,
  WALK_EDGES,
  WALK_N,
  WALK_QUERIES,
  WALK_ROOT,
  WALK_TABLE,
  type WalkStep,
} from "./lowestCommonAncestor-guide.proof.ts";
import { lcaWalk } from "./lowestCommonAncestor-guide.sim.ts";

const T = WALK_TABLE;

/** 뿌리 0 에서 매단 트리의 자리. 자식은 이웃 목록의 차례대로 왼쪽부터 놓는다. */
function place(): { id: number; x: number; y: number }[] {
  const children = new Map<NodeId, number[]>();
  for (let u = 0; u < WALK_N; u++) {
    children.set(
      u,
      (T.near[u] as number[]).filter(
        (v) => v !== WALK_ROOT && at(T, v, 0) === u,
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

/** 정점 `x` 에서 조상 `y` 까지 지나는 간선의 차례들. */
function pathEdges(x: number, y: number): Set<number> {
  const out = new Set<number>();
  let cur = x;
  while (cur !== y && cur !== WALK_ROOT) {
    const p = at(T, cur, 0);
    const i = WALK_EDGES.findIndex(
      ([a, b]) => (a === cur && b === p) || (a === p && b === cur),
    );
    if (i >= 0) out.add(i);
    cur = p;
  }
  return out;
}

const layerLabel = (k: number): string => `${k} 층 · ${2 ** k} 칸 위`;

/** 무대 아래 띠 — 정점 번호 한 줄, 층마다 한 줄, 답 목록 한 줄. */
function strips(
  s: WalkStep,
  marks: {
    read?: [number, number][];
    write?: [number, number][];
    newAnswer?: boolean;
  },
): GraphStrip[] {
  const out: GraphStrip[] = [
    {
      label: "정점 v",
      values: Array.from({ length: WALK_N }, (_, v) => v),
    },
  ];
  s.layers.forEach((values, k) => {
    const states: Partial<Record<number, CellState>> = {};
    values.forEach((x, v) => {
      if (x === null) states[v] = "empty";
    });
    for (const [kk, v] of marks.read ?? []) if (kk === k) states[v] = "read";
    for (const [kk, v] of marks.write ?? []) if (kk === k) states[v] = "focus";
    out.push({
      label: layerLabel(k),
      values: values.map((x) => (x === null ? "" : x)),
      states,
    });
  });
  const answerStates: Partial<Record<number, CellState>> = {};
  if (marks.newAnswer) answerStates[s.answers.length - 1] = "focus";
  out.push({
    label: "답 목록",
    values: [...s.answers],
    states: answerStates,
    slots: WALK_QUERIES.length,
  });
  return out;
}

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const s = WALK.steps[i] as WalkStep;
  const nodeState: Partial<Record<number, CellState>> = {};
  const edgeFocus = new Set<number>();
  const read: [number, number][] = [];
  const write: [number, number][] = [];
  const groups: GraphGroup[] = [];

  if (s.kind === "lists") {
    for (let v = 0; v < WALK_N; v++) nodeState[v] = "empty";
  } else if (s.kind === "dfs") {
    for (let v = 0; v < WALK_N; v++) {
      nodeState[v] = "focus";
      if (v !== WALK_ROOT) write.push([0, v]);
    }
    for (let e = 0; e < WALK_EDGES.length; e++) edgeFocus.add(e);
  } else if (s.kind === "layer") {
    const k = s.k as number;
    for (let v = 0; v < WALK_N; v++) {
      write.push([k, v]);
      read.push([k - 1, v]);
    }
  } else {
    const u = s.u as number;
    const v = s.v as number;
    if (s.kind === "align") {
      nodeState[s.uIn as number] = "read";
      nodeState[s.vIn as number] = "read";
      const jumps = s.jumps ?? [];
      for (const j of jumps) read.push([j.k, j.from]);
      const first = jumps[0];
      if (first) {
        nodeState[u] = "focus";
        for (const e of pathEdges(first.from, u)) edgeFocus.add(e);
      }
    } else {
      const k = s.k as number;
      read.push([k, s.uIn as number], [k, s.vIn as number]);
      if (s.moved) {
        nodeState[u] = "focus";
        nodeState[v] = "focus";
        for (const e of pathEdges(s.uIn as number, u)) edgeFocus.add(e);
        for (const e of pathEdges(s.vIn as number, v)) edgeFocus.add(e);
      } else {
        nodeState[s.up as number] = "read";
        nodeState[s.vp as number] = "read";
      }
      if (s.answer !== undefined) read.push([0, u]);
    }
    const moved = s.kind === "align" ? (s.jumps ?? []).length > 0 : s.moved;
    if (u === v) {
      groups.push({
        members: [u],
        label: s.answer !== undefined ? "u = v = 답" : "u = v",
        state: "focus",
      });
    } else {
      groups.push({
        members: [u],
        label: "u",
        ...(moved ? { state: "focus" as const } : {}),
      });
      groups.push({
        members: [v],
        label: "v",
        ...(s.kind === "lift" && s.moved ? { state: "focus" as const } : {}),
      });
      if (s.answer !== undefined) {
        groups.push({ members: [s.answer], label: "답", state: "focus" });
        nodeState[s.answer] = "focus";
      }
    }
  }

  const prev = i > 0 ? (WALK.steps[i - 1] as WalkStep) : null;
  const newAnswer = prev !== null && s.answers.length > prev.answers.length;
  return {
    nodes: Array.from({ length: WALK_N }, (_, v) => {
      const d = s.depth[v];
      const state = nodeState[v];
      return {
        value: d === null || d === undefined ? "" : `depth ${d}`,
        ...(state ? { state } : {}),
      };
    }),
    edges: WALK_EDGES.map((_, e) => {
      const tree = s.kind !== "lists";
      let state: GraphEdge["state"];
      if (s.kind === "lists") state = "out";
      else if (edgeFocus.has(e)) state = "focus";
      return {
        ...(tree ? { kind: "tree" as const } : {}),
        ...(state ? { state } : {}),
      };
    }),
    groups,
    strips: strips(s, { read, write, newAnswer }),
    calc: stageCalc(s),
    vars: stageVars(s),
  };
}

function stageCalc(s: WalkStep): GraphStep["calc"] {
  if (s.kind === "lists") {
    const total = T.near.reduce((n, l) => n + l.length, 0);
    return { expr: "near 목록 길이의 합 =", result: `${total} = 2E` };
  }
  if (s.kind === "dfs") {
    const skipped = (s.pops ?? []).reduce((n, p) => n + p.skipped.length, 0);
    return { expr: "이미 본 이웃을 건너뛴 횟수 =", result: String(skipped) };
  }
  if (s.kind === "layer") {
    const k = s.k as number;
    const mid = at(T, 6, k - 1);
    return {
      expr: `anc[6][${k}] = anc[anc[6][${k - 1}]][${k - 1}] = anc[${mid}][${k - 1}] =`,
      result: String(at(T, 6, k)),
    };
  }
  if (s.kind === "align") {
    const q = WALK_QUERIES[s.q as number] as [number, number];
    const deep =
      (T.depth[q[0]] as number) >= (T.depth[q[1]] as number) ? q[0] : q[1];
    const shallow = deep === q[0] ? q[1] : q[0];
    const tail =
      s.answer !== undefined
        ? ` → u = v = ${s.u}`
        : (s.jumps ?? []).length > 0
          ? ` → u = ${s.u}`
          : " → 그대로";
    return {
      expr: `gap = depth[${deep}] − depth[${shallow}] =`,
      result: `${s.gap}${tail}`,
    };
  }
  const k = s.k as number;
  const cmp = s.moved ? `≠ → u = ${s.u} · v = ${s.v}` : "= → 그대로";
  return {
    expr: `anc[${s.uIn}][${k}] = ${s.up} · anc[${s.vIn}][${k}] = ${s.vp}`,
    result: s.answer !== undefined ? `${cmp} · 답 ${s.answer}` : cmp,
  };
}

function stageVars(s: WalkStep): string {
  if (s.kind === "lists") return "쌓은 층 0 / 4";
  if (s.kind === "dfs") return `쌓은 층 1 / ${T.LOG}`;
  if (s.kind === "layer") return `쌓은 층 ${(s.k as number) + 1} / ${T.LOG}`;
  const q = `질의 ${(s.q as number) + 1} / ${WALK_QUERIES.length}`;
  return s.kind === "lift" ? `${q} · k = ${s.k}` : q;
}

function stepTitle(i: number): string {
  const j = stepJudge(i);
  return `${stepOf(i)} ${stepDoing(i)}${j.marks.length > 0 ? ` ${j.marks.join(" ")}` : ""}`;
}

function stepText(i: number): string {
  const s = WALK.steps[i] as WalkStep;
  if (s.kind === "lists") {
    return `간선 ${WALK_EDGES.length} 개를 양쪽 정점의 목록에 한 번씩 넣었습니다. 깊이는 아직 정하지 않았고, anc 는 전부 뿌리 ${WALK_ROOT}${으로(WALK_ROOT)} 채워 두었지만 계산한 칸이 아니라서 점선으로 그립니다.`;
  }
  if (s.kind === "dfs") {
    const order = (s.pops ?? []).map((p) => p.u).join(" → ");
    const skipped = (s.pops ?? []).reduce((n, p) => n + p.skipped.length, 0);
    return `뿌리 ${WALK_ROOT} 에서 스택으로 따라가며 ${order} 차례로 꺼냈습니다. 새로 만난 이웃마다 깊이와 부모를 적었고, 이미 본 이웃 ${skipped} 개는 건너뛰었습니다. 0 층이 곧 부모이고, 뿌리의 칸은 처음 채워 둔 뿌리 자신입니다.`;
  }
  if (s.kind === "layer") {
    const k = s.k as number;
    const clamped = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => v !== WALK_ROOT && (T.depth[v] as number) < 2 ** k,
    ).length;
    return `${k} 층의 칸 v 마다 ${k - 1} 층을 두 번 따라간 값을 적었습니다 — anc[anc[v][${k - 1}]][${k - 1}]. ${2 ** k} 칸 위가 뿌리를 넘는 정점 ${clamped} 개는 뿌리 ${WALK_ROOT} 에 머뭅니다.`;
  }
  const q = WALK_QUERIES[s.q as number] as [number, number];
  if (s.kind === "align") {
    const jumps = s.jumps ?? [];
    const moved =
      jumps.length === 0
        ? "gap 이 0 이라 올리지 않습니다."
        : `gap 의 켜진 자리마다 올렸습니다 — ${jumps.map((j) => `anc[${j.from}][${j.k}] = ${j.to}`).join(" · ")}.`;
    const end =
      s.answer !== undefined
        ? `깊이를 맞춘 자리에서 두 정점이 모두 ${s.u}${이가(s.u as number)} 되어 ${s.u}${이가(s.u as number)} 답입니다. 함께 올리기로 가지 않습니다.`
        : `u = ${s.u} · v = ${s.v}${은는(s.v as number)} 서로 다른 정점이라 함께 올리기로 갑니다.`;
    return `${lcaText(q)}${을를(q[1])} 받았습니다. ${moved} ${end}`;
  }
  const k = s.k as number;
  const judge = s.moved
    ? `${2 ** k} 칸 위 두 조상 ${s.up}${과와(s.up as number)} ${s.vp}${이가(s.vp as number)} 달라서 둘 다 올렸습니다. 이제 u = ${s.u} · v = ${s.v} 입니다.`
    : `${2 ** k} 칸 위 두 조상이 모두 ${s.up}${이가(s.up as number)}라서 올리지 않습니다.`;
  const end =
    s.answer !== undefined
      ? ` k 를 다 봤으니 u 의 부모 anc[${s.u}][0] = ${s.answer}${을를(s.answer)} 답으로 냅니다.`
      : "";
  return `${judge}${end}`;
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

/** 깊이만 적은 트리. */
const plainNodes = () =>
  LAYOUT.nodes.map((n) => ({
    ...n,
    value: `depth ${T.depth[n.id as number]}`,
  }));

/** `concept` — 전개 입력과 최소 공통 조상 하나. */
function conceptTree(): ReactElement {
  const [a, b] = WALK_QUERIES[0] as [number, number];
  const ans = WALK.answers[0] as number;
  const used = new Set([...pathEdges(a, ans), ...pathEdges(b, ans)]);
  return (
    <NodeGraph
      title={`전개 입력 — 정점 ${WALK_N} · 간선 ${WALK_EDGES.length} · 뿌리 ${WALK_ROOT}, 정점 안은 깊이. ${a}${과와(a)} ${b} 에서 올라가 처음 만나는 ${ans}${이가(ans)} ${lcaText([a, b])}`}
      directed={false}
      nodes={plainNodes().map((n) =>
        n.id === ans
          ? { ...n, state: "focus" as const }
          : n.id === a || n.id === b
            ? { ...n, state: "read" as const }
            : n,
      )}
      edges={WALK_EDGES.map(([from, to], i) => ({
        from,
        to,
        kind: "tree" as const,
        ...(used.has(i) ? { state: "read" as const } : {}),
      }))}
    />
  );
}

/** 층 넷이 다 쌓인 2^k 조상 표. */
const fullStrips = (read: [number, number][] = []): GraphStrip[] =>
  strips(WALK.steps[4] as WalkStep, { read }).filter(
    (s) => s.label !== "답 목록",
  );

/** `concept` — 2^k 조상 표의 생김새. */
function conceptTable(): ReactElement {
  return (
    <NodeGraph
      title={`2^k 조상 표 — 정점마다 1 · 2 · 4 · 8 칸 위 조상을 적은 층 ${T.LOG} 줄. 띠의 칸 차례가 정점 번호다`}
      directed={false}
      nodes={plainNodes()}
      edges={WALK_EDGES.map(([from, to]) => ({
        from,
        to,
        kind: "tree" as const,
      }))}
      strips={fullStrips()}
    />
  );
}

/** `concept` — 질의 하나가 하는 일. 전개 입력의 둘째 질의를 걸음 셋으로. */
function conceptQuery(): ReactElement {
  const q = 1;
  const idx = WALK.steps.flatMap((s, i) => (s.q === q ? [i] : []));
  const align = idx[0] as number;
  const moved = idx.find((i) => (WALK.steps[i] as WalkStep).moved) as number;
  const last = idx.at(-1) as number;
  const pick: [string, number][] = [
    ["시작", align],
    ["올림", moved],
    ["답", last],
  ];
  const qq = WALK_QUERIES[q] as [number, number];
  return (
    <NodeGraphFilm
      title={`${lcaText(qq)} — 깊이가 같으니 큰 칸부터 비교해 두 조상이 다를 때만 함께 올리고, 끝에서 부모 한 칸을 답으로 낸다`}
      frames={pick.map(([id, i]) => {
        const c = stageCalc(WALK.steps[i] as WalkStep);
        return {
          id,
          text: c ? `${c.expr} ${c.result}` : "",
          scene: graphScene(stage(i), { layout: LAYOUT }),
        };
      })}
    />
  );
}

/** `deep.build` — 층 하나를 트리 위에 놓은 모습. 정점 안은 그 정점의 1 층 칸. */
function buildLayer(): ReactElement {
  const k = 1;
  const cells: [number, number][] = Array.from(
    { length: WALK_N },
    (_, v) => [k, v] as [number, number],
  );
  return (
    <NodeGraph
      title={`${k} 층을 트리 위에 놓은 모습 — 정점 안은 그 정점의 ${2 ** k} 칸 위 조상, 아래 띠의 ${k} 층 칸과 같은 값`}
      directed={false}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `${2 ** k} 칸 위 ${at(T, n.id as number, k)}`,
        ...(at(T, n.id as number, k) !== WALK_ROOT
          ? { state: "read" as const }
          : {}),
      }))}
      edges={WALK_EDGES.map(([from, to]) => ({
        from,
        to,
        kind: "tree" as const,
      }))}
      strips={fullStrips(cells)}
    />
  );
}

/** `deep.origin` — 시도 사다리. */
function approaches(): Approach[] {
  const V = 100_000;
  const e = chain(V);
  const q: [number, number][] = [[0, V - 1]];
  const nv = naiveCounted(V, e, 0, q);
  const lf = liftCounted(V, e, 0, q);
  const naiveAll = nv.setup + nv.query * V;
  const liftAll = lf.setup + lf.query * V;
  const cellsIn256 = (256 * 1024 * 1024) / 4;
  return [
    {
      name: "한 칸씩 올라가기",
      idea: "깊은 쪽을 한 칸씩 올려 깊이를 맞추고, 두 정점을 함께 한 칸씩 올려 만나는 자리를 답으로 낸다",
      verdict: "drop",
      checks: [
        { label: "저장", value: `부모 ${comma(V)} 칸`, ok: true },
        {
          label: "시간",
          value: `사슬 ${comma(V)} 정점 · 질의 ${comma(V)} 개에서 배열 칸 ${comma(naiveAll)}`,
          ok: false,
        },
      ],
      lesson: "올라가는 칸 수가 곧 비용이다 — 한 번에 여러 칸을 뛰어야 한다",
    },
    {
      name: "모든 거리의 조상 적어 두기",
      idea: "정점마다 1 칸부터 V − 1 칸 위까지의 조상을 다 적어 두고 한 번에 뛴다",
      verdict: "drop",
      checks: [
        {
          label: "저장",
          value: `${comma(V * (V - 1))} 칸 — 256 MB 는 ${comma(cellsIn256)} 칸`,
          ok: false,
        },
        { label: "시간", value: "d 칸 위를 배열 칸 1 개로", ok: true },
      ],
      lesson: "뛸 거리를 전부 적을 필요는 없다 — 거리를 쪼개 여러 번 뛰면 된다",
    },
    {
      name: "2^k 조상 표",
      idea: "1 · 2 · 4 · 8 … 칸 위 조상만 적어 두고, 올라갈 거리를 2 의 거듭제곱 합으로 쪼개 뛴다",
      verdict: "keep",
      checks: [
        { label: "저장", value: `${comma(V * columns(V))} 칸`, ok: true },
        {
          label: "시간",
          value: `같은 입력에서 배열 칸 ${comma(liftAll)}`,
          ok: true,
        },
      ],
    },
  ];
}

/** `deep.build` — 칸 하나를 읽는 법. */
function buildRead(): ReactElement {
  const [v, k] = READ_CELLS[1] as [number, number];
  const to = at(T, v, k);
  const used = pathEdges(v, to);
  return (
    <NodeGraph
      title={`anc[${v}][${k}] 읽기 — ${k} 층의 정점 ${v} 칸은 ${v} 에서 ${2 ** k} 칸 위, 굵게 칠한 길의 끝 ${to}`}
      directed={false}
      nodes={plainNodes().map((n) =>
        n.id === to
          ? { ...n, state: "focus" as const }
          : n.id === v
            ? { ...n, state: "read" as const }
            : n,
      )}
      edges={WALK_EDGES.map(([from, to2], i) => ({
        from,
        to: to2,
        kind: "tree" as const,
        ...(used.has(i) ? { state: "focus" as const } : {}),
      }))}
      strips={fullStrips([[k, v]])}
    />
  );
}

/** 걸음 하나를 정적 그림 한 장으로 — 패널 무대와 같은 장면이다. */
function moment(i: number, title: string): ReactElement {
  return (
    <NodeGraph title={title} {...graphScene(stage(i), { layout: LAYOUT })} />
  );
}

const INV_STEP = WALK.steps.findIndex((s) => s.moved === true);

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tree": conceptTree,
  "concept-table": conceptTable,
  "concept-query": conceptQuery,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(100_000)} · 질의 ≤ ${comma(100_000)} · 1 초에 배열 칸 1 억 개 · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-layer": buildLayer,
  "build-read": buildRead,
  "walk-film": () => <Film spec={lcaWalk as unknown as PlayerSpec} />,
  "invariant-moment": () => {
    const s = WALK.steps[INV_STEP] as WalkStep;
    return moment(
      INV_STEP,
      `${stepOf(INV_STEP)} 직후 — k = ${s.k} 에서 두 조상 ${s.up} · ${s.vp}${이가(s.vp as number)} 달라 함께 올렸다. u = ${s.u} · v = ${s.v}${은는(s.v as number)} 서로 다르고 답까지 한 칸 남았다`,
    );
  },
};

/** 원고가 쓰는 반환값 문자열 — 패널의 `result` 와 같다. */
export const WALK_RESULT = list(WALK.answers);
