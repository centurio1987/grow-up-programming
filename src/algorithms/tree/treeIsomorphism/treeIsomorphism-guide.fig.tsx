/**
 * `treeIsomorphism-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 중심 · 벗긴 바퀴 · 방문 차례 · 모양 번호는 정본과 같은
 * 절차에 걸음 기록만 덧붙인 사본(`-guide.proof.ts` 의 `WALK` · `RUN`)이 내고, 그 사본은 자기 값을 정본
 * (`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수도 증명 사이드카가 실행해서 낸 값을 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `treeIsomorphism-guide.test.ts` 가 잰다.
 *
 * **두 트리를 한 무대에 나란히 둔다.** 이 글이 보이려는 것은 두 트리가 **같은 겹**에서 잎을 잃고,
 * **같은 모양 번호표**에서 번호를 받는다는 것이라 한쪽만 그리면 비교가 사라진다. 정점 이름은 트리마다
 * `A0`…`A7` · `B0`…`B7` 로 가르고, 정점 안 이름은 번호만 적는다.
 *
 * **정점 자리는 값이 아니라 배치다.** 패널과 「벗긴 바퀴」 그림은 트리마다 중심을 맨 위 줄에 두고 그 아래로
 * 매단다(중심이 둘이면 둘을 잇는 간선이 맨 위 줄에 가로로 놓인다) — 중심에서 멀수록 아래 줄에 놓여,
 * 벗기는 바퀴가 대체로 아래 줄에서 위 줄로 올라온다. 뿌리 하나에서 매긴 모양 번호를 보이는 그림은 그 뿌리를 맨 위에 두고 매단다.
 * 자식은 정본 ③ 의 방문 차례대로 왼쪽부터 놓는다. 간선에 방향이 없으므로 `directed: false` 다.
 *
 * 무대 아래 띠 셋은 정점에 붙일 자리가 없는 목록 — 방문 차례 `order` 와 모양 번호표(열쇠 줄과 그 열쇠가
 * 받은 모양 번호 줄) — 를 싣는다. 모양 번호는 열쇠를 처음 넣은 차례라 두 줄의 칸 번호가 곧 모양 번호다.
 */

import type { ReactElement } from "react";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphGroup,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
  type NodeId,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphLayout, GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  childrenFrom,
  comma,
  keyText,
  ladderNumbers,
  PQ_N,
  RUN,
  type Side,
  type Snap,
  show,
  stepOf,
  TREE_A,
  TREE_B,
  TREE_P,
  TREE_Q,
  WALK,
  WALK_N,
} from "./treeIsomorphism-guide.proof.ts";
import { centers, type Edge, neighbors } from "./treeIsomorphism-guide.ref.ts";
import { isoWalk } from "./treeIsomorphism-guide.sim.ts";

/** 트리 그림의 격자. */
const UNIT = { x: 84, y: 84 } as const;
/** 두 트리 사이의 빈 칸(격자 단위). */
const GAP = 1.4;

type Spot = { x: number; y: number };

/** 뿌리 `root` 에서 매단 자리 — 자식은 정본 ③ 의 방문 차례대로 왼쪽부터. */
function rooted(n: number, edges: readonly Edge[], root: number): Spot[] {
  const { kids } = childrenFrom(n, edges, root);
  const children = new Map<NodeId, number[]>();
  kids.forEach((cs, v) => {
    children.set(v, cs);
  });
  const xy = treeLayout([root], children);
  return Array.from({ length: n }, (_, v) => xy.get(v) as Spot);
}

/**
 * 중심을 맨 위 줄에 둔 자리. 중심이 둘이면 첫 중심에서 매단 뒤 두 중심 사이 간선을 끊어 두 뿌리의 숲으로
 * 놓는다 — 두 중심이 맨 위 줄에 나란히 서고, 그 아래로 벗긴 겹이 쌓인다.
 */
function fromCenters(n: number, edges: readonly Edge[]): Spot[] {
  const cs = centers(n, neighbors(n, [...edges]));
  const c1 = cs[0] as number;
  const { kids } = childrenFrom(n, edges, c1);
  const children = new Map<NodeId, number[]>();
  kids.forEach((k, v) => {
    children.set(v, v === c1 ? k.filter((w) => !cs.includes(w)) : k);
  });
  const xy = treeLayout(cs, children);
  return Array.from({ length: n }, (_, v) => xy.get(v) as Spot);
}

/** 트리 둘을 나란히 — 오른쪽 트리를 왼쪽 트리의 폭만큼 옮긴다. */
function sideBySide(
  left: { prefix: string; spots: Spot[] },
  right: { prefix: string; spots: Spot[] },
): { id: string; x: number; y: number; label: string }[] {
  const shift = Math.max(...left.spots.map((p) => p.x)) + GAP;
  const put = (prefix: string, spots: Spot[], dx: number) =>
    spots.map((p, v) => ({
      id: `${prefix}${v}`,
      x: Math.round((p.x + dx) * 100) / 100,
      y: p.y,
      label: `${v}`,
    }));
  return [
    ...put(left.prefix, left.spots, 0),
    ...put(right.prefix, right.spots, shift),
  ];
}

const edgesOf = (prefix: string, edges: readonly Edge[]) =>
  edges.map(([u, v]) => ({ from: `${prefix}${u}`, to: `${prefix}${v}` }));

/** 전개 입력의 배치 — 패널(`.sim.ts` 의 `layout`)과 「벗긴 바퀴」 그림이 같은 자리를 쓴다. */
export const LAYOUT: GraphLayout = {
  nodes: sideBySide(
    { prefix: "A", spots: fromCenters(WALK_N, TREE_A) },
    { prefix: "B", spots: fromCenters(WALK_N, TREE_B) },
  ),
  edges: [...edgesOf("A", TREE_A), ...edgesOf("B", TREE_B)],
  directed: false,
  unit: UNIT,
};

const SIDES: Side[] = ["A", "B"];
const EDGES: Record<Side, Edge[]> = { A: TREE_A, B: TREE_B };
const range = (n: number): number[] => Array.from({ length: n }, (_, v) => v);

const GROUPS: GraphGroup[] = SIDES.map((side) => ({
  members: range(WALK_N).map((v) => `${side}${v}`),
  label: `트리 ${side}`,
}));

/** 걸음마다 표에 든 열쇠 수가 가장 많을 때 — 띠의 칸 수를 걸음 사이에 고정한다. */
const TABLE_SLOTS = Math.max(...WALK.steps.map((s) => s.table.length));

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const numbering = (s: Snap): boolean =>
  s.kind === "order" || s.kind === "code" || s.kind === "match";

/** 걸음 하나에서 정점 하나의 상태와 값. */
function nodeOf(
  s: Snap,
  side: Side,
  v: number,
): { value?: string; state?: CellState } {
  if (s.kind === "build") {
    return { value: `차수 ${s.left[side][v]}` };
  }
  if (!numbering(s)) {
    const found = s.found[side];
    const gone = s.gone[side][v] as number;
    const here = s.kind === "peel" && s.tree === side;
    if (found?.includes(v)) {
      return {
        value: "중심",
        ...(s.kind === "count" || here ? { state: "read" as const } : {}),
      };
    }
    if (gone > 0) {
      const now = here && s.round === gone;
      return { value: `벗김 ${gone}`, state: now ? "read" : "out" };
    }
    const touched = here && (s.touched as number[]).includes(v);
    return {
      value: `차수 ${s.left[side][v]}`,
      ...(touched ? { state: "focus" as const } : {}),
    };
  }
  if (s.tree !== side) return { state: "out" };
  const c = s.code[v];
  const value = c === null || c === undefined ? "—" : `번호 ${c}`;
  if (s.kind === "order") {
    return { value, state: v === s.root ? "read" : "empty" };
  }
  if (s.kind === "match") {
    return { value, ...(v === s.root ? { state: "read" as const } : {}) };
  }
  if (v === s.v) return { value, state: "focus" };
  if ((s.kids as number[]).includes(v)) return { value, state: "read" };
  return { value, ...(c === null ? { state: "empty" as const } : {}) };
}

/** 걸음 하나의 무대. `k` 는 기록의 걸음 차례다. */
function stage(k: number): GraphStep {
  const s = WALK.steps[k] as Snap;
  const nodes = SIDES.flatMap((side) =>
    range(WALK_N).map((v) => nodeOf(s, side, v)),
  );
  const edges = SIDES.flatMap((side) =>
    EDGES[side].map(([a, b]) => {
      if (s.kind === "build") return { state: "focus" as const };
      if (!numbering(s)) {
        const gone = s.gone[side];
        const here = s.kind === "peel" && s.tree === side;
        const ga = gone[a] as number;
        const gb = gone[b] as number;
        const now = (g: number) => here && g === s.round;
        if (now(ga) || now(gb)) return { state: "read" as const };
        if (ga > 0 || gb > 0) return { state: "out" as const };
        return {};
      }
      if (s.tree !== side) return { state: "out" as const };
      const parent = s.parent as number[];
      const tree = { kind: "tree" as const };
      if (s.kind === "order") return { ...tree, state: "focus" as const };
      if (s.kind === "code") {
        const v = s.v as number;
        if ((parent[a] === v && b === v) || (parent[b] === v && a === v)) {
          return { ...tree, state: "read" as const };
        }
      }
      return tree;
    }),
  );
  const orderStates: Partial<Record<number, CellState>> = {};
  const keyStates: Partial<Record<number, CellState>> = {};
  if (s.kind === "order") {
    s.order.forEach((_, i) => {
      orderStates[i] = "focus";
    });
  } else if (s.kind === "code") {
    orderStates[s.i as number] = "read";
    keyStates[s.code[s.v as number] as number] = s.fresh ? "focus" : "read";
  }
  return {
    nodes,
    edges,
    groups: GROUPS,
    strips: [
      {
        label: "order",
        values: numbering(s) ? [...s.order] : [],
        states: orderStates,
        slots: WALK_N,
      },
      {
        label: "열쇠",
        values: s.table.map(keyText),
        states: keyStates,
        slots: TABLE_SLOTS,
      },
      {
        label: "모양 번호",
        values: s.table.map((_, i) => i),
        states: keyStates,
        slots: TABLE_SLOTS,
      },
    ],
    calc: stageCalc(s),
    vars: s.code2.length === 0 ? null : `B 의 중심 번호 ${show(s.code2)}`,
  };
}

function stageCalc(s: Snap): GraphStep["calc"] {
  if (s.kind === "build") {
    return {
      expr: "link 항목 수의 합 =",
      result: `A ${TREE_A.length * 2} · B ${TREE_B.length * 2}`,
    };
  }
  if (s.kind === "peel") {
    const leaves = s.leaves as number[];
    return {
      expr: `alive = ${(s.alive as number) + leaves.length} − ${leaves.length} =`,
      result: `${s.alive}`,
    };
  }
  if (s.kind === "count") {
    return {
      expr: `root1.length !== root2.length → ${(s.found.A as number[]).length} !== ${(s.found.B as number[]).length} =`,
      result: "false",
    };
  }
  if (s.kind === "order") return { expr: "order =", result: show(s.order) };
  if (s.kind === "code") {
    return {
      expr: `table.get(${JSON.stringify(s.key)}) →`,
      result: `${s.code[s.v as number]}${s.fresh ? " (새로)" : ""}`,
    };
  }
  const a = s.code[s.root as number] as number;
  return { expr: `${show(s.code2)}.includes(${a}) =`, result: `${s.hit}` };
}

function stepTitle(k: number): string {
  const s = WALK.steps[k] as Snap;
  const id = stepOf(k);
  if (s.kind === "build")
    return `${id} 두 트리의 간선 목록을 이웃 목록으로 옮긴다 ①`;
  if (s.kind === "peel") {
    const leaves = s.leaves as number[];
    return `${id} ${s.tree} 의 잎 ${leaves.join(" · ")}${을를(leaves.at(-1) as number)} 벗긴다 ②`;
  }
  if (s.kind === "count") return `${id} 두 트리의 중심 개수를 비교한다 ⑦`;
  if (s.kind === "order") {
    return `${id} ${s.tree} 를 정점 ${s.root} 에 매달고 방문 차례를 적는다 ${s.labels}`;
  }
  if (s.kind === "code") {
    return `${id} ${s.tree} 의 정점 ${s.v} 에 모양 번호를 준다 ④⑤⑥`;
  }
  return `${id} A 의 뿌리 번호를 B 의 중심 번호와 비교한다 ⑨`;
}

function stepText(k: number): string {
  const s = WALK.steps[k] as Snap;
  if (s.kind === "build") {
    return `간선 ${TREE_A.length} 개씩을 양쪽 정점의 이웃 목록에 넣었습니다. 정점 안의 수가 목록 길이, 곧 차수입니다.`;
  }
  if (s.kind === "peel") {
    const side = s.tree as Side;
    const leaves = s.leaves as number[];
    const touched = [...new Set(s.touched as number[])];
    const found = s.found[side];
    const tail =
      found === null
        ? `차수가 1 이 된 ${(s.next as number[]).join(" · ")}${이가((s.next as number[]).at(-1) as number)} 다음 바퀴의 잎입니다.`
        : `남은 정점이 ${s.alive} 개라 반복이 끝나고, 남은 ${found.join(" · ")}${이가(found.at(-1) as number)} 중심입니다.`;
    return `${side} 에서 차수 1 인 ${leaves.join(" · ")}${을를(leaves.at(-1) as number)} 한꺼번에 벗기고, 이웃 ${touched.join(" · ")} 의 차수를 하나씩 줄였습니다. ${tail}`;
  }
  if (s.kind === "count") {
    return `두 트리 다 중심이 ${(s.found.A as number[]).length} 개라 이른 반환을 타지 않고 번호 매기기로 갑니다.`;
  }
  if (s.kind === "order") {
    const first = s.labels.includes("⑧")
      ? "모양 번호표를 비어 있는 채로 만들고, "
      : "모양 번호표는 그대로 두고, ";
    return `${first}${s.tree} 를 정점 ${s.root} 에 매달아 부모가 자식보다 앞에 오는 방문 차례를 적었습니다. 번호는 이 차례를 뒤에서부터 읽으며 줍니다.`;
  }
  if (s.kind === "code") {
    const raw = s.raw as number[];
    const kids =
      raw.length === 0
        ? "자식이 없어 열쇠가 빈 문자열입니다."
        : `자식 번호 ${show(raw)}${을를(show(raw))} 정렬해 열쇠 ${keyText(s.key as string)}${을를(keyText(s.key as string))} 만들었습니다.`;
    const got = s.fresh
      ? `표에 없던 열쇠라 새 번호 ${s.code[s.v as number]}${을를(s.code[s.v as number] as number)} 줬습니다.`
      : `표에 있던 열쇠라 번호 ${s.code[s.v as number]}${을를(s.code[s.v as number] as number)} 그대로 받았습니다.`;
    return `order[${s.i}] = ${s.v} 입니다. ${kids} ${got}`;
  }
  const a = s.code[s.root as number] as number;
  return `A 의 뿌리 ${s.root} 가 받은 번호 ${a}${이가(a)} B 의 중심 번호 ${show(s.code2)} 안에 있어 true 를 돌려줍니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return WALK.steps.map((_, k) => ({
    title: stepTitle(k),
    text: stepText(k),
    ...stage(k),
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

/** 트리 둘을 나란히 놓은 한 장. `mark` 가 정점마다의 값과 상태를 정한다. */
function pair(
  title: string,
  left: {
    prefix: string;
    edges: readonly Edge[];
    spots: Spot[];
    label: string;
  },
  right: {
    prefix: string;
    edges: readonly Edge[];
    spots: Spot[];
    label: string;
  },
  mark: (prefix: string, v: number) => Partial<GraphNode>,
  kind?: "tree",
): ReactElement {
  const n = left.spots.length;
  const nodes = sideBySide(left, right).map((p) => {
    const prefix = p.id.slice(0, 1);
    return { ...p, ...mark(prefix, Number(p.id.slice(1))) };
  });
  const edges: GraphEdge[] = [
    ...edgesOf(left.prefix, left.edges),
    ...edgesOf(right.prefix, right.edges),
  ].map((e) => (kind ? { ...e, kind } : e));
  return (
    <NodeGraph
      title={title}
      directed={false}
      unit={UNIT}
      nodes={nodes}
      edges={edges}
      groups={[
        {
          members: range(n).map((v) => `${left.prefix}${v}`),
          label: left.label,
        },
        {
          members: range(n).map((v) => `${right.prefix}${v}`),
          label: right.label,
        },
      ]}
    />
  );
}

const CENTER_A = RUN.cA;
const CENTER_B = RUN.cB;

/** `concept` — 동형인 두 트리. 중심을 맨 위 줄에 둔다. */
function conceptPair(): ReactElement {
  return pair(
    "트리 A 와 B — 정점 번호는 다르게 붙었지만 번호를 옮기면 간선이 하나씩 맞물린다 · 맨 위 줄의 둘이 중심",
    {
      prefix: "A",
      edges: TREE_A,
      spots: fromCenters(WALK_N, TREE_A),
      label: "트리 A",
    },
    {
      prefix: "B",
      edges: TREE_B,
      spots: fromCenters(WALK_N, TREE_B),
      label: "트리 B",
    },
    (prefix, v) =>
      (prefix === "A" ? CENTER_A : CENTER_B).includes(v)
        ? { state: "read" }
        : {},
  );
}

/** `concept` — A 를 중심 2, B 를 중심 7 에 매단 모양 번호. */
function conceptCodes(): ReactElement {
  const rb = CENTER_B[1] as number;
  const cb = RUN.bAt.get(rb) as number[];
  return pair(
    `A 를 정점 ${RUN.aRoot}, B 를 정점 ${rb} 에 매달고 매긴 모양 번호 — 두 뿌리가 같은 번호 ${RUN.aCode[RUN.aRoot]}${을를(RUN.aCode[RUN.aRoot] as number)} 받는다`,
    {
      prefix: "A",
      edges: TREE_A,
      spots: rooted(WALK_N, TREE_A, RUN.aRoot),
      label: `트리 A · 뿌리 ${RUN.aRoot}`,
    },
    {
      prefix: "B",
      edges: TREE_B,
      spots: rooted(WALK_N, TREE_B, rb),
      label: `트리 B · 뿌리 ${rb}`,
    },
    (prefix, v) => {
      const code =
        prefix === "A" ? (RUN.aCode[v] as number) : (cb[v] as number);
      const root = prefix === "A" ? RUN.aRoot : rb;
      return {
        value: `번호 ${code}`,
        ...(v === root ? { state: "read" as const } : {}),
      };
    },
    "tree",
  );
}

/** `deep.origin` — 차수 수열이 같은 P 와 Q. */
function originDegree(): ReactElement {
  const deg = (edges: Edge[]) => neighbors(PQ_N, edges).map((r) => r.length);
  const dp = deg(TREE_P);
  const dq = deg(TREE_Q);
  return pair(
    `트리 P 와 Q — 정점 안이 차수이고 차수 수열 ${[...dp].sort((a, b) => a - b).join(" ")}${이가(Math.max(...dp))} 같다`,
    {
      prefix: "P",
      edges: TREE_P,
      spots: fromCenters(PQ_N, TREE_P),
      label: "트리 P",
    },
    {
      prefix: "Q",
      edges: TREE_Q,
      spots: fromCenters(PQ_N, TREE_Q),
      label: "트리 Q",
    },
    (prefix, v) => ({ value: `차수 ${(prefix === "P" ? dp : dq)[v]}` }),
  );
}

/** `deep.origin` — 시도 사다리. */
function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "정점 대응 전부 해 보기",
      idea: "A 의 정점을 B 의 정점으로 옮기는 대응을 하나씩 만들어 간선이 전부 맞는지 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${comma(n.n)} 개에서 대응이 ${comma(n.digits)} 자리 수`,
          ok: false,
        },
      ],
      lesson: "대응을 만들지 않고 두 트리를 비교할 값이 필요하다",
    },
    {
      name: "차수 수열 비교",
      idea: "정점마다 차수를 세어 크기 순으로 늘어놓고 두 나열을 비교한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `P 와 Q 의 차수 수열이 ${n.pqSeqSame ? "같은데" : "다른데"} 정본은 ${n.pqAnswer}`,
          ok: false,
        },
        { label: "시간", value: "정점마다 한 번", ok: true },
      ],
      lesson:
        "차수가 아니라 정점 아래에 매달린 모양 전체를 봐야 한다 — 뿌리가 필요하다",
    },
    {
      name: "정점 0 에 뿌리를 두고 모양 번호 비교",
      idea: "두 트리 다 정점 0 에 매달아 뿌리의 모양 번호 하나씩을 비교한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `짝 ${comma(n.zeroSeen)} 개 가운데 ${comma(n.zeroWrong)} 개가 틀린다`,
          ok: false,
        },
        { label: "시간", value: "번호 매기기 두 벌", ok: true },
      ],
      lesson: "두 트리에서 대응하는 자리를 뿌리로 잡아야 한다",
    },
    {
      name: "모든 정점을 뿌리로",
      idea: "B 의 정점을 차례로 뿌리로 삼아 A 의 정점 0 에서 매긴 번호와 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${comma(n.n)} 개에서 기본 연산 ${comma(n.allEstimate)} (식으로 늘린 어림)`,
          ok: false,
        },
      ],
      lesson:
        "대응하는 자리가 정점 수와 무관하게 하나나 둘로 정해지는 곳 — 중심 — 에 뿌리를 둔다",
    },
    {
      name: "중심에 뿌리를 둔 모양 번호 — AHU 정규형",
      idea: "잎 벗기기로 찾은 중심에 뿌리를 두고, 모양 번호표 하나로 두 트리의 뿌리 번호를 비교한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${comma(n.n)} 개에서 기본 연산 ${comma(n.centerOps)}`,
          ok: true,
        },
      ],
    },
  ];
}

/** `deep.build` (b) — A 를 중심 2 에 매단 열쇠와 모양 번호. */
function buildCodes(): ReactElement {
  const spots = rooted(WALK_N, TREE_A, RUN.aRoot);
  const keys = [...RUN.table.keys()];
  return (
    <NodeGraph
      title={`A 를 정점 ${RUN.aRoot} 에 매단 모양 — 정점 안은 열쇠와 받은 모양 번호`}
      directed={false}
      unit={{ x: 104, y: 84 }}
      nodes={spots.map((p, v) => {
        const code = RUN.aCode[v] as number;
        return {
          id: v,
          x: p.x,
          y: p.y,
          label: `${v}`,
          value: `${keyText(keys[code] as string)} → ${code}`,
          ...(v === RUN.aRoot ? { state: "read" as const } : {}),
        };
      })}
      edges={TREE_A.map(([from, to]) => ({ from, to, kind: "tree" as const }))}
    />
  );
}

/** `deep.build` (e) — 같은 트리 B 를 두 중심에 매단 모양 번호. */
function buildContrast(): ReactElement {
  const [r1, r2] = CENTER_B as [number, number];
  const c1 = RUN.bAt.get(r1) as number[];
  const c2 = RUN.bAt.get(r2) as number[];
  return pair(
    `B 를 정점 ${r1} 에 매단 모양과 정점 ${r2} 에 매단 모양 — 강조한 정점만 모양 번호가 다르다`,
    {
      prefix: "L",
      edges: TREE_B,
      spots: rooted(WALK_N, TREE_B, r1),
      label: `트리 B · 뿌리 ${r1}`,
    },
    {
      prefix: "R",
      edges: TREE_B,
      spots: rooted(WALK_N, TREE_B, r2),
      label: `트리 B · 뿌리 ${r2}`,
    },
    (prefix, v) => {
      const code = (prefix === "L" ? c1 : c2)[v] as number;
      return {
        value: `번호 ${code}`,
        ...(c1[v] !== c2[v] ? { state: "focus" as const } : {}),
      };
    },
    "tree",
  );
}

/** `deep.build` 2단계 — 두 트리를 바퀴마다 벗긴 모양. */
function buildLayers(): ReactElement {
  const last = WALK.steps.filter((s) => s.kind === "peel").at(-1) as Snap;
  return pair(
    "A 와 B 를 바퀴마다 벗긴 모양 — 정점 안은 벗긴 바퀴, 맨 위 줄 둘이 중심",
    {
      prefix: "A",
      edges: TREE_A,
      spots: fromCenters(WALK_N, TREE_A),
      label: "트리 A",
    },
    {
      prefix: "B",
      edges: TREE_B,
      spots: fromCenters(WALK_N, TREE_B),
      label: "트리 B",
    },
    (prefix, v) => {
      const side = prefix as Side;
      const gone = last.gone[side][v] as number;
      return gone > 0
        ? { value: `${gone} 바퀴` }
        : { value: "중심", state: "read" as const };
    },
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-pair": conceptPair,
  "concept-codes": conceptCodes,
  "origin-degree": originDegree,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title={`시도한 방법 ${steps.length} 가지 — ${steps.filter((x) => x.verdict === "drop").length} 가지는 버렸고 하나가 남았다`}
        constraint={`규모 N ≤ ${comma(100_000)} · 기본 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-codes": buildCodes,
  "build-contrast": buildContrast,
  "build-layers": buildLayers,
  "walk-film": () => <Film spec={isoWalk as unknown as PlayerSpec} />,
};
