/**
 * `treeRerooting-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 방문 순서 · 부모 · 부분트리 크기 · 답은 정본과 같은 절차에
 * 걸음 기록만 덧붙인 사본(`-guide.proof.ts` 의 `traced` · `counted`)이 내고, 그 사본은 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수도 증명 사이드카가 실행해서 낸 값을 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `treeRerooting-guide.test.ts` 가 잰다.
 *
 * **올림 값과 내림 값은 정점 안에 둔다.** 이 글이 보이려는 것은 「부분트리 크기가 간선을 타고 자식에서
 * 부모로 올라가고, 답이 간선을 타고 부모에서 자식으로 내려온다」이고, 두 흐름은 값이 정점에 붙어 있을
 * 때 간선 위에서 바로 보인다. 그래서 정점 안 아랫줄에 `size · answer` 두 수를 적는다(아직 안 적은 답은
 * `—`). 무대 아래 띠 둘은 정점에 붙일 자리가 없는 목록 — 스택과 방문 순서 `order` — 를 싣는다. 깊이는
 * 따로 적지 않는다 — 기준 뿌리 0 에서 매단 그림이라 정점이 놓인 줄이 곧 깊이다.
 *
 * 정점 자리(`LAYOUT`)는 값이 아니라 배치다 — 기준 뿌리 0 에서 매단 트리를 `treeLayout` 으로 놓았고,
 * 자식은 번호가 작은 쪽을 왼쪽에 둔다. 간선에 방향이 없으므로 `directed: false` 다.
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
  type GraphNode,
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
  childrenOf,
  comma,
  counted,
  type Edges,
  FINAL,
  ladderNumbers,
  pieceOf,
  SMALL_EDGES,
  SMALL_N,
  type Snap,
  setOf,
  stepOf,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./treeRerooting-guide.proof.ts";
import { rerootWalk } from "./treeRerooting-guide.sim.ts";

/** 트리 그림의 격자. */
const UNIT = { x: 104, y: 84 } as const;

/** 기준 뿌리 `base` 에서 매단 트리의 자리. 자식은 번호가 작은 쪽을 왼쪽에 놓는다. */
function place(
  n: number,
  edges: Edges,
  base = 0,
): { id: number; x: number; y: number; label: string }[] {
  const kids = childrenOf(n, edges, base);
  const children = new Map<NodeId, number[]>();
  kids.forEach((cs, v) => {
    children.set(
      v,
      [...cs].sort((a, b) => a - b),
    );
  });
  const xy = treeLayout([base], children);
  return Array.from({ length: n }, (_, v) => {
    const at = xy.get(v) as { x: number; y: number };
    return {
      id: v,
      x: Math.round(at.x * 140) / 100,
      y: at.y,
      label: `${v}`,
    };
  });
}

/** 전개 입력의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT: GraphLayout = {
  nodes: place(WALK_N, WALK_EDGES),
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
  unit: UNIT,
};

const SMALL_LAYOUT = place(SMALL_N, SMALL_EDGES);

const touches = (edges: Edges, i: number, x: number, y: number): boolean => {
  const [a, b] = edges[i] as [number, number];
  return (a === x && b === y) || (a === y && b === x);
};

/** 정점 안 아랫줄 — 올림 값(부분트리 크기)과 내림 값(답). 아직 안 적은 답은 `—` 다. */
const cellOf = (size: number, answer: number | null): string =>
  `${size} · ${answer === null ? "—" : answer}`;

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const count = (kind: Snap["kind"]): number =>
  WALK.steps.filter((s) => s.kind === kind).length;
const PEAK = Math.max(...WALK.steps.map((s) => s.stack.length));

/** 걸음 `k` 까지 같은 갈래의 걸음이 몇 번째인가. */
const nth = (k: number): number => {
  const kind = (WALK.steps[k] as Snap).kind;
  return WALK.steps.slice(0, k + 1).filter((s) => s.kind === kind).length;
};

/** 걸음 하나의 무대. `k` 는 기록의 걸음 차례다. */
function stage(k: number): GraphStep {
  const s = WALK.steps[k] as Snap;
  const nodes = Array.from({ length: WALK_N }, (_, v) => {
    if (s.kind === "build" || !s.seen[v]) return { state: "empty" as const };
    let state: CellState | undefined;
    if (s.kind === "pop") {
      if (v === s.u) state = "read";
      else if ((s.pushed as number[]).includes(v)) state = "focus";
    } else if (s.kind === "size") {
      if (v === s.p) state = "focus";
      else if (v === s.w) state = "read";
      else if (!s.sizeDone[v]) state = "empty";
    } else if (s.kind === "root") {
      state = v === 0 ? "focus" : "read";
    } else {
      if (v === s.w) state = "focus";
      else if (v === s.p) state = "read";
      else if (s.answer[v] === null) state = "empty";
    }
    return {
      value: cellOf(s.size[v] as number, s.answer[v] ?? null),
      ...(state ? { state } : {}),
    };
  });
  const edges = WALK_EDGES.map((_, i) => {
    const [a, b] = WALK_EDGES[i] as [number, number];
    const found =
      s.kind !== "build" &&
      ((s.seen[a] && s.parent[b] === a) || (s.seen[b] && s.parent[a] === b));
    let state: GraphEdge["state"];
    if (s.kind === "build") state = "focus";
    else if (s.kind === "pop") {
      const pu = s.pushed as number[];
      if (pu.some((w) => touches(WALK_EDGES, i, s.u as number, w))) {
        state = "focus";
      }
    } else if (
      (s.kind === "size" || s.kind === "down") &&
      touches(WALK_EDGES, i, s.w as number, s.p as number)
    ) {
      state = "focus";
    }
    return {
      ...(found ? { kind: "tree" as const } : {}),
      ...(state ? { state } : {}),
    };
  });
  const orderStates: Partial<Record<number, CellState>> = {};
  const stackStates: Partial<Record<number, CellState>> = {};
  if (s.kind === "pop") {
    orderStates[s.order.length - 1] = "focus";
    const pu = s.pushed as number[];
    s.stack.forEach((x, i) => {
      if (pu.includes(x)) stackStates[i] = "focus";
    });
  } else if (s.kind === "size" || s.kind === "down") {
    orderStates[s.i as number] = "read";
  }
  const vars =
    s.kind === "pop"
      ? `꺼냄 ${nth(k)} / ${count("pop")}`
      : s.kind === "size"
        ? `올림 ${nth(k)} / ${count("size")}`
        : s.kind === "down"
          ? `내림 ${nth(k)} / ${count("down")}`
          : null;
  return {
    nodes,
    edges,
    strips: [
      {
        label: "stack",
        values: [...s.stack],
        states: stackStates,
        slots: PEAK,
      },
      {
        label: "order",
        values: [...s.order],
        states: orderStates,
        slots: WALK_N,
      },
    ],
    calc: stageCalc(s),
    vars,
  };
}

function stageCalc(s: Snap): GraphStep["calc"] {
  if (s.kind === "build") {
    const total = WALK.near.reduce((n, l) => n + l.length, 0);
    return {
      expr: "near 항목 수의 합 =",
      result: `${total} = 2 × ${WALK_EDGES.length}`,
    };
  }
  if (s.kind === "pop") {
    const pu = s.pushed as number[];
    return {
      expr: `stack.pop() = ${s.u} · 새로 담은 정점 =`,
      result: pu.length === 0 ? "없음" : pu.join(" · "),
    };
  }
  if (s.kind === "size") {
    const w = s.w as number;
    const p = s.p as number;
    return {
      expr: `size[${p}] = ${s.before} + size[${w}] = ${s.before} + ${s.size[w]} =`,
      result: String(s.size[p]),
    };
  }
  if (s.kind === "root") {
    return {
      expr: `answer[0] = ${s.depth.join(" + ")} =`,
      result: String(s.answer[0]),
    };
  }
  const w = s.w as number;
  return {
    expr: `answer[${w}] = ${s.before} + ${WALK_N} − 2 × ${s.size[w]} =`,
    result: String(s.answer[w]),
  };
}

function stepTitle(k: number): string {
  const s = WALK.steps[k] as Snap;
  const id = stepOf(k);
  if (s.kind === "build") return `${id} 간선 목록을 이웃 목록으로 옮긴다 ①`;
  if (s.kind === "pop")
    return `${id} 스택에서 정점 ${s.u}${을를(s.u as number)} 꺼낸다 ②`;
  if (s.kind === "size") {
    return `${id} 자식 ${s.w} 의 크기를 부모 ${s.p} 에 올린다 ③`;
  }
  if (s.kind === "root") return `${id} 깊이를 더해 기준 뿌리의 답을 낸다 ④`;
  return `${id} 부모 ${s.p} 의 답에서 자식 ${s.w} 의 답을 내린다 ⑤`;
}

function stepText(k: number): string {
  const s = WALK.steps[k] as Snap;
  if (s.kind === "build") {
    return `간선 ${WALK_EDGES.length} 개를 양쪽 정점의 이웃 목록에 한 번씩 넣었습니다. 아직 어느 정점도 스택에서 꺼내지 않아 모든 정점이 점선 테입니다.`;
  }
  if (s.kind === "pop") {
    const sk = s.skipped as number[];
    const pu = s.pushed as number[];
    const skip =
      sk.length === 0
        ? "건너뛴 이웃은 없습니다."
        : `이웃 ${sk.join(" · ")}${은는(sk.at(-1) as number)} 이미 지나온 정점이라 건너뛰었습니다.`;
    const push =
      pu.length === 0
        ? "새로 담은 정점은 없습니다."
        : `이웃 ${pu.join(" · ")} 에 부모 ${s.u}${과와(s.u as number)} 깊이를 적고 스택에 담았습니다.`;
    return `정점 ${s.u}${을를(s.u as number)} 꺼내 order 뒤에 붙였습니다. ${skip} ${push}`;
  }
  if (s.kind === "size") {
    const p = s.p as number;
    const tail = s.sizeDone[p]
      ? ` 정점 ${p} 의 자식을 모두 올려 받아 크기가 끝값이 됐습니다.`
      : ` 정점 ${p} 에는 올려 받을 자식이 아직 남았습니다.`;
    return `order[${s.i}] = ${s.w} 입니다. 자식 ${s.w} 의 크기 ${s.size[s.w as number]}${을를(s.size[s.w as number] as number)} 부모 ${p} 의 크기에 더했습니다.${tail}`;
  }
  if (s.kind === "root") {
    return `기준 뿌리 0 에서 정점까지의 거리가 곧 깊이라, 깊이를 모두 더한 ${s.answer[0]}${이가(s.answer[0] as number)} 뿌리의 답입니다. 이제 order 를 앞에서부터 읽으며 답을 내립니다.`;
  }
  const w = s.w as number;
  const sw = s.size[w] as number;
  return `order[${s.i}] = ${w} 입니다. 뿌리를 부모 ${s.p} 에서 자식 ${w}${으로(w)} 옮기면 자식 쪽 ${sw} 개가 한 칸 가까워지고 나머지 ${WALK_N - sw} 개가 한 칸 멀어져, 답이 ${WALK_N} − 2 × ${sw} 만큼 달라집니다.`;
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

/** 걸음 하나를 정적 그림 한 장으로 — 패널 무대와 같은 장면이다. */
function moment(k: number, title: string): ReactElement {
  const scene = graphScene(stage(k), { layout: LAYOUT });
  return <NodeGraph title={title} {...scene} />;
}

/* ── 정적 그림 — 걸음 재생 패널 밖 ── */

const walkNodes = (
  f: (n: GraphNode & { id: number }) => Partial<GraphNode>,
): GraphNode[] =>
  LAYOUT.nodes.map((n) => ({ ...n, ...f(n as GraphNode & { id: number }) }));

const treeEdges = (
  edges: Edges,
  mark?: (a: number, b: number) => Partial<GraphEdge>,
): GraphEdge[] =>
  edges.map(([from, to]) => ({
    from,
    to,
    kind: "tree" as const,
    ...(mark?.(from, to) ?? {}),
  }));

const SMALL_ANSWER = counted(SMALL_N, SMALL_EDGES).answer;
const SMALL_SIZE = counted(SMALL_N, SMALL_EDGES).size;

/** `concept` — 정점 다섯짜리 트리와 정점마다의 답. */
function conceptTree(): ReactElement {
  const best = Math.min(...SMALL_ANSWER);
  return (
    <NodeGraph
      title={`정점 다섯짜리 트리 — 정점 안 아랫줄이 그 정점의 답 S(v), 가장 작은 답은 ${best}`}
      directed={false}
      unit={UNIT}
      nodes={SMALL_LAYOUT.map((n) => ({
        ...n,
        value: `S = ${SMALL_ANSWER[n.id]}`,
        ...(SMALL_ANSWER[n.id] === best ? { state: "read" as const } : {}),
      }))}
      edges={SMALL_EDGES.map(([from, to]) => ({ from, to }))}
    />
  );
}

/** `concept` — 간선 (0, 1) 을 지우면 갈라지는 두 조각. */
function conceptSplit(): ReactElement {
  const near = pieceOf(SMALL_N, SMALL_EDGES, 0, 1);
  const far = pieceOf(SMALL_N, SMALL_EDGES, 1, 0);
  return (
    <NodeGraph
      title={`간선 (0, 1) 을 지우면 — 1 쪽 조각 ${near.length} 개는 뿌리를 0 에서 1 로 옮길 때 한 칸씩 가까워지고, 0 쪽 조각 ${far.length} 개는 한 칸씩 멀어진다`}
      directed={false}
      unit={UNIT}
      nodes={SMALL_LAYOUT.map((n) =>
        near.includes(n.id) ? { ...n, state: "focus" as const } : n,
      )}
      edges={SMALL_EDGES.map(([from, to]) =>
        (from === 0 && to === 1) || (from === 1 && to === 0)
          ? { from, to, state: "out" as const }
          : { from, to },
      )}
      groups={[
        { members: near, label: `1 쪽 조각 ${setOf(near)}`, state: "focus" },
        { members: far, label: `0 쪽 조각 ${setOf(far)}` },
      ]}
    />
  );
}

/** `concept` — 올림 값과 내림 값. */
function conceptUpDown(): ReactElement {
  return (
    <NodeGraph
      title="기준 뿌리 0 에서 매단 트리 — 정점 안 아랫줄 앞이 올림 값 size, 뒤가 내림 값 S"
      directed={false}
      unit={UNIT}
      nodes={SMALL_LAYOUT.map((n) => ({
        ...n,
        value: cellOf(SMALL_SIZE[n.id] as number, SMALL_ANSWER[n.id] as number),
        ...(n.id === 0 ? { state: "read" as const } : {}),
      }))}
      edges={treeEdges(SMALL_EDGES)}
    />
  );
}

/** `deep.origin` — 시도 사다리. */
function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "정점마다 다시 따라가기",
      idea: "정점마다 그 정점을 뿌리로 삼아 트리를 처음부터 따라가고, 깊이를 더해 답 하나를 낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${comma(n.naiveN)} 개에서 기본 연산 ${comma(n.naiveOps)} (식으로 늘린 어림)`,
          ok: false,
        },
      ],
      lesson:
        "뿌리를 이웃으로 옮기면 옮겨 간 쪽 조각만 한 칸씩 가까워진다 — 조각의 정점 수만 알면 답을 고칠 수 있다",
    },
    {
      name: "옮길 때마다 조각 세기",
      idea: "기준 뿌리의 답에서 시작해, 뿌리를 옮길 때마다 가까워지는 조각을 따라가 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `사슬 정점 ${comma(n.recountN)} 개에서 기본 연산 ${comma(n.recountOps)}`,
          ok: false,
        },
      ],
      lesson:
        "옮김마다 세는 조각이 기준 뿌리에서 본 부분트리와 같다 — 한 번 올려 두면 다시 셀 일이 없다",
    },
    {
      name: "크기를 한 벌 올리고 답을 내리기 — 트리 재루팅",
      idea: "기준 뿌리에서 부분트리 크기를 잎에서 뿌리 쪽으로 올리고, 답을 뿌리에서 잎 쪽으로 내린다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${comma(n.bigN)} 개에서 기본 연산 ${comma(n.bigOps)}`,
          ok: true,
        },
      ],
    },
  ];
}

/** `deep.build` (b) — 전개 입력 위의 간선마다 두 조각. */
function buildPieces(): ReactElement {
  const pairs = new Map<string, number>();
  for (const w of FINAL.order.slice(1)) {
    const p = FINAL.parent[w] as number;
    pairs.set(`${p}-${w}`, w);
    pairs.set(`${w}-${p}`, w);
  }
  return (
    <NodeGraph
      title={`전개 입력의 간선 ${WALK_EDGES.length} 개 — 간선 옆의 두 수가 자식 쪽 조각 size[자식] 과 부모 쪽 조각 N − size[자식]`}
      directed={false}
      unit={UNIT}
      nodes={walkNodes((n) => ({ value: `size ${FINAL.size[n.id]}` }))}
      edges={treeEdges(WALK_EDGES, (a, b) => {
        const w = pairs.get(`${a}-${b}`) as number;
        const sw = FINAL.size[w] as number;
        return { label: `${sw} | ${WALK_N - sw}` };
      })}
    />
  );
}

/** `deep.build` (c) — 간선 하나를 읽는 법. */
function buildReadEdge(): ReactElement {
  const p = 0;
  const w = 2;
  const low = pieceOf(WALK_N, WALK_EDGES, p, w);
  const high = pieceOf(WALK_N, WALK_EDGES, w, p);
  const sw = FINAL.size[w] as number;
  return (
    <NodeGraph
      title={`간선 (${p}, ${w}) — 자식 ${w} 의 size ${sw}${이가(sw)} 자식 쪽 조각 ${setOf(low)}, 나머지 ${WALK_N} − ${sw} = ${WALK_N - sw} 개가 부모 쪽 조각`}
      directed={false}
      unit={UNIT}
      nodes={walkNodes((n) => ({
        value: `size ${FINAL.size[n.id]}`,
        ...(n.id === w ? { state: "read" as const } : {}),
        ...(low.includes(n.id) && n.id !== w
          ? { state: "focus" as const }
          : {}),
      }))}
      edges={treeEdges(WALK_EDGES, (a, b) =>
        (a === p && b === w) || (a === w && b === p) ? { state: "out" } : {},
      )}
      groups={[
        { members: low, label: `자식 쪽 조각 ${setOf(low)}`, state: "focus" },
        { members: high, label: `부모 쪽 조각 ${setOf(high)}` },
      ]}
    />
  );
}

/** `deep.build` (e) — 뿌리를 옮겨 다시 잰 크기. */
function buildContrast(): ReactElement {
  const base = 5;
  const nodes = place(WALK_N, WALK_EDGES, base);
  const size = counted(WALK_N, WALK_EDGES, base).size;
  const changed = size.filter((x, v) => x !== FINAL.size[v]).length;
  return (
    <NodeGraph
      title={`정점 ${base}${을를(base)} 뿌리로 다시 매달고 크기를 새로 재면 — 강조한 ${changed} 자리가 기준 뿌리 0 의 size 와 다르다`}
      directed={false}
      unit={UNIT}
      nodes={nodes.map((n) => ({
        ...n,
        value: `size ${size[n.id]}`,
        ...(size[n.id] !== FINAL.size[n.id] ? { state: "focus" as const } : {}),
      }))}
      edges={treeEdges(WALK_EDGES)}
    />
  );
}

/** `deep.math` — 간선 (p, c) 가 가르는 두 무리 A · B. */
function mathSplit(): ReactElement {
  const p = 0;
  const c = 2;
  const a = pieceOf(WALK_N, WALK_EDGES, p, c);
  const b = pieceOf(WALK_N, WALK_EDGES, c, p);
  return (
    <NodeGraph
      title={`p = ${p} · c = ${c} — A 로 가는 경로는 c 를, B 로 가는 경로는 p 를 지난다`}
      directed={false}
      unit={UNIT}
      nodes={walkNodes((n) =>
        n.id === p || n.id === c ? { state: "read" as const } : {},
      )}
      edges={treeEdges(WALK_EDGES, (x, y) =>
        (x === p && y === c) || (x === c && y === p) ? { state: "focus" } : {},
      )}
      groups={[
        {
          members: a,
          label: `A = ${setOf(a)} · |A| = size(c) = ${a.length}`,
          state: "focus",
        },
        {
          members: b,
          label: `B = ${setOf(b)} · |B| = N − size(c) = ${b.length}`,
        },
      ]}
    />
  );
}

const RELATION_STEP = WALK.steps.findIndex(
  (s) => s.kind === "size" && s.p === 1 && s.sizeDone[1],
);
const MOMENT_STEP = WALK.steps.findIndex((s) => s.kind === "down" && s.i === 3);

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tree": conceptTree,
  "concept-split": conceptSplit,
  "concept-updown": conceptUpDown,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 N ≤ ${comma(100_000)} · 기본 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-pieces": buildPieces,
  "build-read-edge": buildReadEdge,
  "build-relation": () => {
    const s = WALK.steps[RELATION_STEP] as Snap;
    return moment(
      RELATION_STEP,
      `${stepOf(RELATION_STEP)} — 자식 ${s.w} 의 크기를 올려 받아 size[${s.p}] = ${s.size[s.p as number]}, 정점 ${s.p} 의 부분트리 크기가 끝값이 된다`,
    );
  },
  "build-contrast": buildContrast,
  "walk-film": () => <Film spec={rerootWalk as unknown as PlayerSpec} />,
  "math-split": mathSplit,
  "invariant-moment": () => {
    const s = WALK.steps[MOMENT_STEP] as Snap;
    const done = s.order.slice(0, (s.i as number) + 1);
    return moment(
      MOMENT_STEP,
      `${stepOf(MOMENT_STEP)} 직후 — order 의 앞부분 ${setOf(done)} 만 답이 적혔고, 나머지는 점선 테로 비어 있다`,
    );
  },
};
