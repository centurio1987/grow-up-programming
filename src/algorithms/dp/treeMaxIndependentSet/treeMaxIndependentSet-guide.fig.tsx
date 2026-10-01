/**
 * `treeMaxIndependentSet-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. DP 테이블의 두 칸 · 방문 순서 · 부모는 정본과 같은 절차에
 * 걸음 기록만 덧붙인 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수도 증명 사이드카가 실행해서 낸 값을 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `treeMaxIndependentSet-guide.test.ts` 가 잰다.
 *
 * **DP 테이블의 칸은 정점 안에 둔다.** 이 글이 보이려는 것은 「자식의 두 칸이 간선을 타고 부모의 두
 * 칸으로 올라간다」이고, 그 흐름은 칸이 정점에 붙어 있을 때 간선 위에서 바로 보인다. 칸을 정점 번호
 * 차례의 두 줄 띠로 떼어 놓으면 부모와 자식 칸이 번호 줄에서 떨어져 앉아(「먼저 알아 둘 개념」의
 * 대조 그림) 올라가는 길이 사라진다. 그래서 정점 안 아랫줄에 `dp0 · dp1` 두 수를 적고, 무대 아래 띠는
 * 두 칸이 아니라 읽는 차례 `order` 를 싣는다.
 *
 * 정점 자리(`LAYOUT`)는 값이 아니라 배치다 — 뿌리 0 에서 매단 트리를 `treeLayout` 으로 놓았다. 자식은
 * 방문한 차례대로 왼쪽부터다. 정점 이름에 가중치를 함께 적는다(`2 (w=-2)`). 간선에 방향이 없으므로
 * `directed: false` 다.
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
  bestSet,
  cellOf,
  childrenOf,
  comma,
  depths,
  EDGES,
  FINAL,
  ladderNumbers,
  N,
  type Snap,
  setOf,
  stepOf,
  subtree,
  W,
  WALK,
} from "./treeMaxIndependentSet-guide.proof.ts";
import { misWalk } from "./treeMaxIndependentSet-guide.sim.ts";

/** 트리 그림의 격자. */
const UNIT = { x: 104, y: 84 } as const;

const nameOf = (v: number): string => `${v} (w=${W[v]})`;

/** 뿌리 0 에서 매단 트리의 자리. 자식은 방문한 차례대로 왼쪽부터 놓는다. */
function place(): { id: number; x: number; y: number; label: string }[] {
  const kids = childrenOf(N, EDGES);
  const children = new Map<NodeId, number[]>();
  kids.forEach((cs, v) => {
    children.set(v, cs);
  });
  const xy = treeLayout([0], children);
  return Array.from({ length: N }, (_, v) => {
    const at = xy.get(v) as { x: number; y: number };
    return {
      id: v,
      x: Math.round(at.x * 140) / 100,
      y: at.y,
      label: nameOf(v),
    };
  });
}

/** 입력 트리의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT: GraphLayout = {
  nodes: place(),
  edges: EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
  unit: UNIT,
};

const touches = (i: number, x: number, y: number): boolean => {
  const [a, b] = EDGES[i] as [number, number];
  return (a === x && b === y) || (a === y && b === x);
};

/** 정점 `v` 의 두 칸이 걸음 `s` 에서 이미 다 채운 값인가 — 자식을 더할 것이 남지 않았는가. */
function settled(k: number, v: number): boolean {
  const s = WALK.steps[k] as Snap;
  if (s.dp0[v] === null) return false;
  const kids = childrenOf(N, EDGES)[v] as number[];
  if (kids.length === 0) return true;
  if (s.kind === "init") return false;
  // 자식이 모두 이 걸음까지 부모 v 에 더해졌는가.
  const added = new Set<number>();
  for (let i = 0; i <= k; i++) {
    const t = WALK.steps[i] as Snap;
    if (t.kind === "fold" && t.p === v) added.add(t.v as number);
  }
  return kids.every((c) => added.has(c));
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const FOLDS = WALK.steps.filter((s) => s.kind === "fold").length;

/** 걸음 하나의 무대. `k` 는 기록의 걸음 차례다. */
function stage(k: number): GraphStep {
  const s = WALK.steps[k] as Snap;
  const nodes = Array.from({ length: N }, (_, v) => {
    let state: CellState | undefined;
    if (s.kind === "init") state = "focus";
    else if (s.kind === "fold" && v === s.p) state = "focus";
    else if (s.kind === "fold" && v === s.v) state = "read";
    else if (s.kind === "answer" && v === 0) state = "read";
    // 두 칸을 아직 적지 않은 정점만 「아직」이다. 시작값을 적은 뒤로는 자식이 남았어도 값이 있는 칸이다.
    else if (s.dp0[v] === null) state = "empty";
    return { value: cellOf(s, v), ...(state ? { state } : {}) };
  });
  const tree = s.kind !== "build" && s.kind !== "init";
  // 자식의 두 칸이 이미 부모로 올라간 간선. 아직 안 올라간 나무 간선은 흐린 선(`out`)이라, 흐린 선이
  // 아래로 남은 정점은 두 칸이 아직 끝값이 아니다.
  const folded = new Set<number>();
  for (let t = 0; t <= k; t++) {
    const x = WALK.steps[t] as Snap;
    if (x.kind !== "fold") continue;
    EDGES.forEach((_, i) => {
      if (touches(i, x.v as number, x.p as number)) folded.add(i);
    });
  }
  const edges = EDGES.map((_, i) => {
    let state: GraphEdge["state"];
    if (s.kind === "build" || s.kind === "bfs") state = "focus";
    else if (s.kind === "fold" && touches(i, s.v as number, s.p as number)) {
      state = "focus";
    } else if (tree && !folded.has(i)) state = "out";
    return {
      ...(tree ? { kind: "tree" as const } : {}),
      ...(state ? { state } : {}),
    };
  });
  const orderValues = s.order.every((x) => x === null)
    ? []
    : (s.order as number[]);
  const states: Partial<Record<number, CellState>> = {};
  if (s.kind === "bfs") {
    for (let i = 0; i < N; i++) states[i] = "focus";
  } else if (s.kind === "fold") {
    states[s.k as number] = "read";
  }
  const done = WALK.steps
    .slice(0, k + 1)
    .filter((t) => t.kind === "fold").length;
  return {
    nodes,
    edges,
    strips: [{ label: "order", values: orderValues, states, slots: N }],
    calc: stageCalc(s),
    vars:
      s.kind === "fold" || s.kind === "answer"
        ? `더하기 ${done} / ${FOLDS}`
        : null,
  };
}

function stageCalc(s: Snap): GraphStep["calc"] {
  if (s.kind === "build") {
    const total = WALK.adj.reduce((n, l) => n + l.length, 0);
    return {
      expr: "adj 목록 길이의 합 =",
      result: `${total} = 2 × ${EDGES.length}`,
    };
  }
  if (s.kind === "init") {
    return { expr: `DP 테이블 칸 2 × ${N} =`, result: String(2 * N) };
  }
  if (s.kind === "bfs") {
    return { expr: "order =", result: (s.order as number[]).join(" ") };
  }
  if (s.kind === "fold") {
    const v = s.v as number;
    const p = s.p as number;
    return {
      expr: `dp0[${p}] = ${s.before?.dp0} + max(${s.dp0[v]}, ${s.dp1[v]}) · dp1[${p}] = ${s.before?.dp1} + ${s.dp0[v]} →`,
      result: cellOf(s, p),
    };
  }
  return {
    expr: `max(dp0[0], dp1[0]) = max(${s.dp0[0]}, ${s.dp1[0]}) =`,
    result: String(s.answer),
  };
}

function stepTitle(k: number): string {
  const s = WALK.steps[k] as Snap;
  const id = stepOf(k);
  if (s.kind === "build") return `${id} 간선 목록을 이웃 목록으로 옮긴다`;
  if (s.kind === "init") return `${id} 정점마다 두 칸의 시작값을 적는다 ①`;
  if (s.kind === "bfs") return `${id} 뿌리 0 에서 순서와 부모를 정한다 ② ③`;
  if (s.kind === "fold") {
    const v = s.v as number;
    return `${id} 자식 ${v}${을를(v)} 부모 ${s.p} 에 더한다 ④ ⑤`;
  }
  return `${id} 뿌리의 두 칸 중 큰 쪽을 돌려준다 ⑥`;
}

function stepText(k: number): string {
  const s = WALK.steps[k] as Snap;
  if (s.kind === "build") {
    return `간선 ${EDGES.length} 개를 양쪽 정점의 이웃 목록에 한 번씩 넣었습니다. 아직 DP 테이블의 칸은 없습니다.`;
  }
  if (s.kind === "init") {
    const leaves = Array.from({ length: N }, (_, v) => v).filter(
      (v) => (childrenOf(N, EDGES)[v] as number[]).length === 0,
    );
    return `정점마다 dp0 에 0 을, dp1 에 자기 가중치를 적었습니다. 잎 ${leaves.join(" · ")}${은는(leaves.at(-1) as number)} 더할 자식이 없어 이 값이 끝이고, 나머지 정점은 자식을 더해야 두 칸이 끝납니다.`;
  }
  if (s.kind === "bfs") {
    return `뿌리 0 에서 너비 우선으로 방문 순서 order 와 부모를 정했습니다. 부모 쪽 간선은 건너뛰어 간선 ${EDGES.length} 개가 모두 부모와 자식을 잇는 나무 간선이 됐습니다. 이제 order 를 뒤에서부터 읽습니다.`;
  }
  if (s.kind === "fold") {
    const v = s.v as number;
    const p = s.p as number;
    const c0 = s.dp0[v] as number;
    const c1 = s.dp1[v] as number;
    const big = Math.max(c0, c1);
    const tail = settled(k, p)
      ? ` 정점 ${p} 의 자식을 모두 더해 두 칸이 끝났습니다.`
      : ` 정점 ${p} 에는 더할 자식이 아직 남았습니다.`;
    return `order[${s.k}] = ${v} 입니다. 부모 ${p}${을를(p)} 안 고르는 칸 dp0[${p}] 에는 자식의 두 칸 ${c0} · ${c1} 가운데 큰 ${big}${을를(big)}, 고르는 칸 dp1[${p}] 에는 자식의 dp0 ${c0}${을를(c0)} 더합니다.${tail}`;
  }
  const a = s.dp0[0] as number;
  const b = s.dp1[0] as number;
  return `뿌리는 부모가 없어 두 칸 중 아무 쪽이나 고를 수 있습니다. ${b}${과와(b)} ${a} 가운데 큰 ${s.answer}${을를(s.answer as number)} 돌려줍니다.`;
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

const plainEdges = (
  mark?: (a: number, b: number) => GraphEdge["state"] | undefined,
): GraphEdge[] =>
  EDGES.map(([from, to]) => {
    const state = mark?.(from, to);
    return { from, to, ...(state ? { state } : {}) };
  });

/** `concept` — 전개 입력과 답이 되는 독립집합. */
function conceptTree(): ReactElement {
  const best = bestSet(N, EDGES, W, 0, true);
  const pick = new Set(best.set);
  return (
    <NodeGraph
      title={`전개 입력 — 정점 ${N} · 간선 ${EDGES.length}, 강조한 정점 ${setOf(best.set)} 의 합 ${best.sum}${이가(best.sum)} 가장 크다`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) =>
        pick.has(n.id as number) ? { ...n, state: "focus" as const } : n,
      )}
      edges={plainEdges()}
    />
  );
}

/** `concept` — 정점에 달린 DP 테이블 전체. */
function conceptTable(): ReactElement {
  return (
    <NodeGraph
      title={`DP 테이블 — 정점 안 아랫줄이 두 칸 dp0 · dp1, 뿌리의 두 칸은 ${cellOf(FINAL, 0)}`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: cellOf(FINAL, n.id as number),
        ...(n.id === 0 ? { state: "read" as const } : {}),
      }))}
      edges={EDGES.map(([from, to]) => ({ from, to, kind: "tree" as const }))}
    />
  );
}

/** `deep.build` (b) — DP 테이블 전체. 잎을 진한 테로 가른다. */
function buildTable(): ReactElement {
  const kids = childrenOf(N, EDGES);
  const leaves = LAYOUT.nodes
    .map((n) => n.id as number)
    .filter((v) => (kids[v] as number[]).length === 0);
  return (
    <NodeGraph
      title={`DP 테이블 전체 — 진한 테가 잎 ${leaves.join(" · ")}, 잎의 두 칸은 0 과 자기 가중치`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: cellOf(FINAL, n.id as number),
        ...(leaves.includes(n.id as number) ? { state: "read" as const } : {}),
      }))}
      edges={EDGES.map(([from, to]) => ({ from, to, kind: "tree" as const }))}
    />
  );
}

/** `deep.origin` — 뿌리의 두 자식 아래 부분트리 둘. */
function originSubtrees(): ReactElement {
  const kids = childrenOf(N, EDGES);
  const [c1, c2] = kids[0] as [number, number];
  const s1 = subtree(kids, c1);
  const s2 = subtree(kids, c2);
  const cross = EDGES.filter(
    ([a, b]) =>
      (s1.includes(a) && s2.includes(b)) || (s1.includes(b) && s2.includes(a)),
  ).length;
  return (
    <NodeGraph
      title={`뿌리의 두 자식 ${c1} · ${c2} 의 부분트리 — 두 묶음 사이를 잇는 간선은 ${cross} 개`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) =>
        n.id === 0 ? { ...n, state: "read" as const } : n,
      )}
      edges={plainEdges((a, b) => (a === 0 || b === 0 ? "read" : undefined))}
      groups={[
        { members: s1, label: `정점 ${c1} 의 부분트리 ${setOf(s1)}` },
        { members: s2, label: `정점 ${c2} 의 부분트리 ${setOf(s2)}` },
      ]}
    />
  );
}

/** `deep.origin` — 시도 사다리. */
function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "부분집합 전부 만들기",
      idea: "정점 부분집합을 모두 만들어 이웃한 두 정점이 함께 든 것을 버리고, 남은 것 중 합이 가장 큰 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${n.bruteN} 개에서 기본 연산 ${comma(n.bruteOps)} · 정점 하나 늘 때마다 두 배`,
          ok: false,
        },
      ],
      lesson:
        "같은 부분트리의 조합이 나머지 정점의 조합마다 되풀이된다 — 부분트리마다 몇 가지만 기억하면 된다",
    },
    {
      name: "정점마다 값 하나",
      idea: "부분트리에서 얻는 최대 합 하나만 정점에 적어 부모에 그대로 더한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 ${n.oneValue} — 바른 답은 ${n.answer}`,
          ok: false,
        },
        { label: "시간", value: "정점마다 한 번", ok: true },
      ],
      lesson:
        "부모는 자식의 값에 자식 자신이 들었는지를 알아야 한다 — 값을 그 기준으로 둘로 가른다",
    },
    {
      name: "정점마다 칸 둘 — 트리 DP",
      idea: "자식을 안 고른 최대 합과 고른 최대 합을 따로 적고, 부모를 고를 때는 안 고른 쪽만 받는다",
      verdict: "keep",
      checks: [
        { label: "답", value: `전개 입력에서 ${n.answer}`, ok: true },
        {
          label: "시간",
          value: `정점 ${comma(n.bigN)} 개에서 기본 연산 ${comma(n.bigOps)}`,
          ok: true,
        },
      ],
    },
  ];
}

/** `deep.build` (c) — 칸 하나를 읽는 법. */
function buildReadCell(): ReactElement {
  const kids = childrenOf(N, EDGES);
  const v = 1;
  const sub = subtree(kids, v);
  const b = bestSet(N, EDGES, W, v, false);
  const pick = new Set(b.set);
  return (
    <NodeGraph
      title={`dp0[${v}] = ${b.sum} — 정점 ${v}${을를(v)} 안 담고 부분트리 ${setOf(sub)} 에서 고른 ${setOf(b.set)} 의 합`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) => {
        const id = n.id as number;
        if (id === v) {
          return { ...n, value: cellOf(FINAL, id), state: "read" as const };
        }
        if (pick.has(id)) return { ...n, state: "focus" as const };
        if (!sub.includes(id)) return { ...n, state: "out" as const };
        return n;
      })}
      edges={plainEdges((a, c) =>
        sub.includes(a) && sub.includes(c) ? undefined : "out",
      )}
      groups={[{ members: sub, label: `정점 ${v} 의 부분트리` }]}
    />
  );
}

/**
 * `deep.build` (e) — 같은 두 칸을 정점 번호 차례의 두 줄로 옮긴 모양. 트리에서는 간선 하나로 이웃한
 * 부모와 자식 칸이 번호 줄에서는 떨어져 앉는다. 번호 줄은 무대 아래 띠로 그린다.
 */
function buildContrast(): ReactElement {
  const p = 1;
  const kids = childrenOf(N, EDGES)[p] as number[];
  const states: Partial<Record<number, CellState>> = { [p]: "focus" };
  for (const c of kids) states[c] = "read";
  const ids = Array.from({ length: N }, (_, v) => v);
  return (
    <NodeGraph
      title={`같은 두 칸을 정점 번호 차례의 두 줄로 옮기면 — 부모 ${p}${이가(p)} 읽는 자식 ${kids.join(" · ")} 의 칸이 번호 줄에서 떨어져 있다`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) => {
        const id = n.id as number;
        const value = cellOf(FINAL, id);
        if (id === p) return { ...n, value, state: "focus" as const };
        if (kids.includes(id)) return { ...n, value, state: "read" as const };
        return { ...n, value };
      })}
      edges={plainEdges((a, b) =>
        (a === p && kids.includes(b)) || (b === p && kids.includes(a))
          ? "focus"
          : undefined,
      )}
      strips={[
        { label: "정점", values: ids, states },
        {
          label: "dp0",
          values: ids.map((v) => FINAL.dp0[v] as number),
          states,
        },
        {
          label: "dp1",
          values: ids.map((v) => FINAL.dp1[v] as number),
          states,
        },
      ]}
    />
  );
}

/** `related` — 고른 쪽과 남은 쪽. */
function relatedCover(): ReactElement {
  const best = bestSet(N, EDGES, W, 0, true);
  const pick = new Set(best.set);
  const rest = LAYOUT.nodes
    .map((n) => n.id as number)
    .filter((v) => !pick.has(v));
  const restSum = rest.reduce((a, v) => a + (W[v] as number), 0);
  return (
    <NodeGraph
      title={`굵은 테가 고른 쪽 ${setOf(best.set)}, 진한 테가 남은 쪽 ${setOf(rest)} — 남은 쪽의 합 ${restSum}${이가(restSum)} 간선 ${EDGES.length} 개를 모두 덮는다`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) =>
        pick.has(n.id as number)
          ? { ...n, state: "focus" as const }
          : { ...n, state: "read" as const },
      )}
      edges={plainEdges(() => "read")}
    />
  );
}

/** `deep.math` — 깊이의 홀짝으로 가른 두 무리. */
function mathColoring(): ReactElement {
  const d = depths(N, EDGES);
  const even = d.flatMap((x, v) => (x % 2 === 0 ? [v] : []));
  const odd = d.flatMap((x, v) => (x % 2 === 1 ? [v] : []));
  return (
    <NodeGraph
      title={`깊이가 짝수인 정점 ${setOf(even)}(진한 테)과 홀수인 정점 ${setOf(odd)} — 간선마다 두 무리를 하나씩 잇는다`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `깊이 ${d[n.id as number]}`,
        ...(even.includes(n.id as number) ? { state: "read" as const } : {}),
      }))}
      edges={plainEdges()}
    />
  );
}

const RELATION_STEP = WALK.steps.findIndex(
  (s) => s.kind === "fold" && s.p === 1 && s.v === 3,
);
const MOMENT_STEP = WALK.steps.findIndex(
  (s) => s.kind === "fold" && s.p === 1 && s.v === 4,
);

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tree": conceptTree,
  "concept-table": conceptTable,
  "origin-subtrees": originSubtrees,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 n ≤ ${comma(100_000)} · 기본 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-table": buildTable,
  "build-read-cell": buildReadCell,
  "build-relation": () => {
    const s = WALK.steps[RELATION_STEP] as Snap;
    const v = s.v as number;
    const p = s.p as number;
    return moment(
      RELATION_STEP,
      `${stepOf(RELATION_STEP)} — 자식 ${v} 의 두 칸 ${cellOf(s, v)} 에서 부모 ${p} 의 두 칸이 ${cellOf(s, p)}${으로(s.dp1[p] as number)} 자란다`,
    );
  },
  "build-contrast": buildContrast,
  "walk-film": () => <Film spec={misWalk as unknown as PlayerSpec} />,
  "related-cover": relatedCover,
  "math-coloring": mathColoring,
  "invariant-moment": () => {
    const s = WALK.steps[MOMENT_STEP] as Snap;
    return moment(
      MOMENT_STEP,
      `${stepOf(MOMENT_STEP)} 직후 — 정점 1 은 자식 ${s.v} 하나만 더해 두 칸이 ${cellOf(s, 1)}, 자식 3 에서 오는 간선이 아직 흐린 선`,
    );
  },
};
