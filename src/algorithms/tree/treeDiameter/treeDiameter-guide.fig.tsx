/**
 * `treeDiameter-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 거리 · 부모 · 스택 · 가장 먼 정점은 정본과 같은 절차에
 * 걸음 기록만 덧붙인 사본(`-guide.proof.ts` 의 `traced`)이 내고, 그 사본은 부를 때마다 자기 답을
 * 정본(`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수도 증명 사이드카가 실행해서 낸 값을 받는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `treeDiameter-guide.test.ts` 가 잰다.
 *
 * 정점 자리(`LAYOUT`)는 값이 아니라 배치다 — 정점 0 에서 매단 탐색 트리를 `treeLayout` 으로 놓았다.
 * 트리 자체에는 뿌리가 없어서, 둘째 탐색이 정점 6 에서 다시 시작해도 자리는 그대로 두고 거리와
 * 나무 간선만 새로 칠한다. 같은 트리를 6 에서 매단 모양은 「먼저 알아 둘 개념」의 그림 하나가 따로
 * 보인다. 거리는 정점 안의 값(「dist 6」), 가중치는 간선 머리말, 가장 먼 정점은 「best」 묶음 하나다.
 * 간선에 방향이 없으므로 `directed: false` 다.
 */

import type { ReactElement } from "react";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphGroup,
  NodeGraph,
  NodeGraphFilm,
  type NodeGraphScene,
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
  comma,
  diameterPath,
  END1,
  END2,
  eccentricities,
  ladderNumbers,
  median,
  parentsFrom,
  type Step,
  stepOf,
  WALK,
  WALK_DIAMETER,
  WALK_EDGES,
  WALK_N,
  WALK_TABLE,
} from "./treeDiameter-guide.proof.ts";
import { diameterWalk } from "./treeDiameter-guide.sim.ts";

/** 트리 그림의 격자 — 간선 머리말(가중치)이 들어갈 틈을 둔다. */
const UNIT = { x: 104, y: 84 } as const;

/** `root` 에서 매단 탐색 트리의 자리. 자식은 이웃 목록의 차례대로 왼쪽부터 놓는다. */
function placeFrom(root: number): { id: number; x: number; y: number }[] {
  const par = parentsFrom(WALK_N, WALK_EDGES, root);
  const children = new Map<NodeId, number[]>();
  for (let u = 0; u < WALK_N; u++) {
    const kids = (WALK.near[u] as [number, number][])
      .map(([v]) => v)
      .filter((v) => par[v] === u);
    children.set(u, kids);
  }
  const xy = treeLayout([root], children);
  return Array.from({ length: WALK_N }, (_, v) => {
    const at = xy.get(v) as { x: number; y: number };
    return { id: v, x: at.x * 1.25, y: at.y };
  });
}

/** 입력 트리의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT: GraphLayout = {
  nodes: placeFrom(0),
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: false,
  unit: UNIT,
};

const weightLabel = (i: number): string =>
  String((WALK_EDGES[i] as number[])[2]);

/** 간선 `i` 가 정점 `v` 와 그 부모를 잇는가. */
const isParentEdge = (par: readonly (number | null)[], i: number): boolean => {
  const [a, b] = WALK_EDGES[i] as [number, number, number];
  return par[a] === b || par[b] === a;
};

const touches = (i: number, x: number, y: number): boolean => {
  const [a, b] = WALK_EDGES[i] as [number, number, number];
  return (a === x && b === y) || (a === y && b === x);
};

const sweepName = (s: Step): string =>
  s.sweep === 1 ? "첫 탐색" : "둘째 탐색";

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const STACK_SLOTS = Math.max(...WALK.steps.map((s) => s.stack.length), 1);

/** 걸음 하나의 무대. `k` 는 기록의 걸음 차례다. */
function stage(k: number): GraphStep {
  const s = WALK.steps[k] as Step;
  const prev = k > 0 ? (WALK.steps[k - 1] as Step) : null;
  const written = new Set(
    s.checks.filter((c) => c.kind === "write").map((c) => c.v),
  );
  const skipped = s.checks.filter((c) => c.kind === "skip").map((c) => c.v);
  const nodes = s.dist.map((d, v) => {
    let state: CellState | undefined;
    if (s.kind === "start" && v === s.start) state = "focus";
    else if (s.kind === "pop" && written.has(v)) state = "focus";
    else if (s.kind === "pop" && v === s.u) state = "read";
    else if (d < 0) state = "empty";
    return { value: d < 0 ? "" : `dist ${d}`, ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map((_, i) => {
    const tree = s.sweep !== 0 && isParentEdge(s.par, i);
    let state: GraphEdge["state"];
    if (s.kind === "pop" && [...written].some((v) => touches(i, s.u, v))) {
      state = "focus";
    } else if (s.kind === "pop" && skipped.some((v) => touches(i, s.u, v))) {
      state = "read";
    } else if (!tree) state = "out";
    return {
      ...(tree ? { kind: "tree" as const } : {}),
      ...(state ? { state } : {}),
      label: weightLabel(i),
    };
  });
  const moved =
    s.kind === "pop" ? s.checks.some((c) => c.moved) : s.kind === "start";
  const groups: GraphGroup[] =
    s.best < 0
      ? []
      : [
          {
            members: [s.best],
            label: "best",
            ...(moved ? { state: "focus" as const } : {}),
          },
        ];
  const pushed: Partial<Record<number, CellState>> = {};
  const before = prev?.sweep === s.sweep ? prev.stack.length - 1 : 0;
  for (let i = Math.max(0, before); i < s.stack.length; i++) {
    if (s.kind === "start" || written.has(s.stack[i] as number)) {
      pushed[i] = "focus";
    }
  }
  return {
    nodes,
    edges,
    groups,
    strips: [
      {
        label: "stack",
        values: [...s.stack],
        states: pushed,
        slots: STACK_SLOTS,
      },
    ],
    calc: stageCalc(s),
    vars:
      s.sweep === 0
        ? "탐색 전"
        : `${sweepName(s)} · 꺼낸 정점 ${s.popped.filter(Boolean).length} / ${WALK_N}`,
  };
}

function stageCalc(s: Step): GraphStep["calc"] {
  if (s.kind === "build") {
    const total = WALK.near.reduce((n, l) => n + l.length, 0);
    return { expr: "near 목록 길이의 합 =", result: `${total} = 2E` };
  }
  if (s.kind === "start") {
    return s.sweep === 1
      ? { expr: `dist[${s.start}] = 0 · best =`, result: String(s.start) }
      : { expr: "a = 첫 탐색의 best =", result: String(s.start) };
  }
  if (s.last && s.sweep === 2) {
    return {
      expr: `반환 dist[${s.best}] =`,
      result: String(s.dist[s.best]),
    };
  }
  const writes = s.checks.filter((c) => c.kind === "write");
  if (writes.length === 0) {
    const c = s.checks[0];
    return c
      ? { expr: `dist[${c.v}] = ${c.value} ≥ 0 →`, result: "건너뜀" }
      : null;
  }
  return {
    expr: writes
      .map((c) => `dist[${c.v}] = ${s.dist[s.u]} + ${c.w}`)
      .join(" · "),
    result: writes.map((c) => String(c.value)).join(" · "),
  };
}

function stepTitle(k: number): string {
  const s = WALK.steps[k] as Step;
  const id = stepOf(k);
  if (s.kind === "build") return `${id} 간선 목록을 이웃 목록으로 옮긴다`;
  if (s.kind === "start") {
    return s.sweep === 1
      ? `${id} 첫 탐색 — 정점 ${s.start} 의 거리를 0 으로 두고 스택에 넣는다`
      : `${id} 둘째 탐색 — 첫 탐색의 best ${s.start} 에서 다시 시작한다 ③`;
  }
  const marks = s.checks.flatMap((c) =>
    c.kind === "skip" ? ["①"] : c.moved ? ["②"] : [],
  );
  if (s.last && s.sweep === 2) marks.push("④");
  const tail = [...new Set(marks)].join(" ");
  return `${id} ${sweepName(s)} — ${s.u}${을를(s.u)} 꺼낸다${tail ? ` ${tail}` : ""}`;
}

function stepText(k: number): string {
  const s = WALK.steps[k] as Step;
  if (s.kind === "build") {
    return `간선 ${WALK_EDGES.length} 개를 양쪽 정점의 목록에 한 번씩 넣었습니다. 아직 어느 정점의 거리도 정하지 않았습니다.`;
  }
  if (s.kind === "start") {
    return s.sweep === 1
      ? `dist 를 전부 -1 로 만들고 dist[${s.start}] = 0 으로 둔 뒤 정점 ${s.start}${을를(s.start)} 스택에 넣습니다. 지금까지 가장 먼 정점은 ${s.start} 자신입니다.`
      : `첫 탐색이 찾은 가장 먼 정점 ${s.start}${을를(s.start)} 새 시작 정점으로 잡습니다. dist 를 새로 만들어 전부 -1 로 두고 dist[${s.start}] = 0 입니다. 첫 탐색의 거리는 쓰지 않습니다.`;
  }
  const parts: string[] = [];
  for (const c of s.checks) {
    if (c.kind === "skip") {
      parts.push(
        `이웃 ${c.v}${은는(c.v)} 이미 거리 ${c.value}${이가(c.value)} 적힌 부모라 건너뜁니다.`,
      );
    } else {
      const sum = `${s.dist[s.u]} + ${c.w} = ${c.value}`;
      parts.push(
        c.moved
          ? `이웃 ${c.v} 에 ${sum}${을를(c.value)} 적고 스택에 넣습니다. dist[best] ${c.bestDistBefore} 보다 커서 best 를 ${c.v}${으로(c.v)} 옮깁니다.`
          : `이웃 ${c.v} 에 ${sum}${을를(c.value)} 적고 스택에 넣습니다. dist[best] ${c.bestDistBefore} 보다 크지 않아 best 는 ${c.bestBefore} 그대로입니다.`,
      );
    }
  }
  if (s.last) {
    parts.push(
      s.sweep === 1
        ? `스택이 비어 첫 탐색이 끝납니다. 가장 먼 정점은 ${s.best}${josa(s.best, "이고", "고")} 거리는 ${s.dist[s.best]} 입니다.`
        : `스택이 비어 둘째 탐색이 끝납니다. dist[${s.best}] = ${s.dist[s.best]}${을를(s.dist[s.best] as number)} 반환합니다.`,
    );
  }
  return `${s.u}${을를(s.u)} 꺼냈습니다. ${parts.join(" ")}`;
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

/** 한 탐색이 끝난 뒤의 트리 — 정점 안은 거리, 시작 정점에서 가장 먼 정점까지의 길을 강조한다. */
function sweepScene(k: number): NodeGraphScene {
  const s = WALK.steps[k] as Step;
  const path = new Set<number>();
  let cur: number = s.best;
  path.add(cur);
  while ((s.par[cur] ?? -1) !== -1) {
    cur = s.par[cur] as number;
    path.add(cur);
  }
  return {
    nodes: LAYOUT.nodes.map((n) => ({
      ...n,
      value: `dist ${s.dist[n.id as number]}`,
      ...(n.id === s.start
        ? { state: "read" as const }
        : n.id === s.best
          ? { state: "focus" as const }
          : {}),
    })),
    edges: WALK_EDGES.map(([from, to], i) => ({
      from,
      to,
      label: weightLabel(i),
      ...(path.has(from) && path.has(to) && isParentEdge(s.par, i)
        ? { state: "focus" as const }
        : {}),
    })),
    directed: false,
    unit: UNIT,
  };
}

/** `concept` — 전개 입력과 지름. */
function conceptTree(): ReactElement {
  const path = diameterPath();
  const on = (a: number, b: number) =>
    path.some(
      (v, i) =>
        i + 1 < path.length &&
        ((v === a && path[i + 1] === b) || (v === b && path[i + 1] === a)),
    );
  const ends = [path[0] as number, path.at(-1) as number];
  return (
    <NodeGraph
      title={`전개 입력 — 정점 ${WALK_N} · 간선 ${WALK_EDGES.length}, 강조한 길 ${path.join(" → ")} 의 거리 ${WALK_DIAMETER.D}${이가(WALK_DIAMETER.D)} 지름`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) =>
        ends.includes(n.id as number) ? { ...n, state: "read" as const } : n,
      )}
      edges={WALK_EDGES.map(([from, to], i) => ({
        from,
        to,
        label: weightLabel(i),
        ...(on(from, to) ? { state: "focus" as const } : {}),
      }))}
    />
  );
}

/** `concept` — 두 번 탐색이 한 일. */
function conceptSweeps(): ReactElement {
  const e1 = WALK.steps[END1] as Step;
  const e2 = WALK.steps[END2] as Step;
  return (
    <NodeGraphFilm
      title={`두 번 탐색 — 정점 ${e1.start} 에서 가장 먼 ${e1.best}, 그 ${e1.best} 에서 가장 먼 ${e2.best} 까지가 ${e2.dist[e2.best]}`}
      frames={[
        {
          id: "첫째",
          text: `정점 ${e1.start} 에서 잰 거리 — 가장 먼 정점 ${e1.best} (dist ${e1.dist[e1.best]})`,
          scene: sweepScene(END1),
        },
        {
          id: "둘째",
          text: `정점 ${e2.start} 에서 잰 거리 — 가장 먼 정점 ${e2.best} (dist ${e2.dist[e2.best]})`,
          scene: sweepScene(END2),
        },
      ]}
    />
  );
}

/** `deep.origin` — 시도 사다리. */
function approaches(): Approach[] {
  const n = ladderNumbers();
  return [
    {
      name: "정점마다 한 번씩 재기",
      idea: "정점마다 탐색을 한 번씩 해서 가장 먼 곳까지의 거리를 재고, 그 최댓값을 답으로 낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `한 줄 ${comma(n.v)} 정점에서 칸 접근 ${comma(n.everyCells)} · 약 ${n.everySeconds.toFixed(0)} 초`,
          ok: false,
        },
      ],
      lesson: "탐색 한 번은 이미 정점 수에 비례한다 — 줄일 것은 탐색 횟수다",
    },
    {
      name: "아무 정점에서 한 번만 재기",
      idea: "정점 하나에서 한 번 재고 그 최댓값을 답으로 낸다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `정점 ${n.worstStart} 에서 시작하면 ${n.worstFirst} — 지름은 ${n.D}`,
          ok: false,
        },
        { label: "시간", value: "탐색 한 번", ok: true },
      ],
      lesson:
        "최댓값은 틀렸지만, 가장 먼 정점은 시작 정점과 상관없이 지름의 끝이었다",
    },
    {
      name: "두 번 탐색",
      idea: "한 번 재서 가장 먼 정점을 찾고, 그 정점에서 한 번 더 잰 최댓값을 답으로 낸다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `시작 정점 ${WALK_N} 가지 모두 ${n.D}`,
          ok: true,
        },
        {
          label: "시간",
          value: `한 줄 ${comma(n.v)} 정점에서 칸 접근 ${comma(n.twoCells)}`,
          ok: true,
        },
      ],
    },
  ];
}

/** 탐색 트리 한 벌 — 자리와 부모와 거리를 받아 그린다. */
function treeFigure(
  title: string,
  nodes: readonly { id: number; x: number; y: number }[],
  par: readonly (number | null)[],
  dist: readonly number[],
  root: number,
): ReactElement {
  return (
    <NodeGraph
      title={title}
      directed={false}
      unit={UNIT}
      nodes={nodes.map((n) => ({
        ...n,
        value: `dist ${dist[n.id]}`,
        ...(n.id === root ? { state: "read" as const } : {}),
      }))}
      edges={WALK_EDGES.map(([from, to], i) => ({
        from,
        to,
        label: weightLabel(i),
        ...(isParentEdge(par, i) ? { kind: "tree" as const } : {}),
      }))}
    />
  );
}

/** `related` — 이심률과 중심. */
function relatedEcc(): ReactElement {
  const ecc = eccentricities(WALK_N, WALK_EDGES);
  const R = Math.min(...ecc);
  const D = Math.max(...ecc);
  const path = diameterPath();
  const on = (a: number, b: number) =>
    path.some(
      (v, i) =>
        i + 1 < path.length &&
        ((v === a && path[i + 1] === b) || (v === b && path[i + 1] === a)),
    );
  const centers = ecc.flatMap((e, v) => (e === R ? [v] : []));
  return (
    <NodeGraph
      title={`정점 안은 이심률 — 가장 작은 ${R} 의 정점 ${centers.join(" · ")}${이가(centers.at(-1) as number)} 중심, 가장 큰 ${D} 의 두 정점이 지름의 양 끝`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) => ({
        ...n,
        value: `ecc ${ecc[n.id as number]}`,
        ...(ecc[n.id as number] === R
          ? { state: "focus" as const }
          : ecc[n.id as number] === D
            ? { state: "read" as const }
            : {}),
      }))}
      edges={WALK_EDGES.map(([from, to], i) => ({
        from,
        to,
        label: weightLabel(i),
        ...(on(from, to) ? { state: "read" as const } : {}),
      }))}
    />
  );
}

/** `deep.math` — 세 정점과 그 중앙점. */
function mathMedian(): ReactElement {
  const [u, v, x] = [4, 3, 6] as const;
  const m = median(WALK_TABLE, u, v, x) as number;
  const onPath = (a: number, b: number): Set<string> => {
    const par = parentsFrom(WALK_N, WALK_EDGES, a);
    const out = new Set<string>();
    let cur = b;
    while ((par[cur] ?? -1) !== -1) {
      const p = par[cur] as number;
      out.add(`${Math.min(p, cur)}-${Math.max(p, cur)}`);
      cur = p;
    }
    return out;
  };
  const used = new Set([...onPath(u, v), ...onPath(v, x), ...onPath(u, x)]);
  return (
    <NodeGraph
      title={`세 정점 ${u} · ${v} · ${x} 와 중앙점 ${m} — 세 쌍의 경로가 모두 ${m}${을를(m)} 지난다`}
      directed={false}
      unit={UNIT}
      nodes={LAYOUT.nodes.map((n) =>
        n.id === m
          ? { ...n, state: "focus" as const, value: "중앙점" }
          : [u, v, x].includes(n.id as 4 | 3 | 6)
            ? { ...n, state: "read" as const }
            : n,
      )}
      edges={WALK_EDGES.map(([a, b], i) => ({
        from: a,
        to: b,
        label: weightLabel(i),
        ...(used.has(`${Math.min(a, b)}-${Math.max(a, b)}`)
          ? { state: "read" as const }
          : {}),
      }))}
    />
  );
}

const INV_STEP = 4;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-tree": conceptTree,
  "concept-sweeps": conceptSweeps,
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${comma(100_000)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-tree-0": () => {
    const e1 = WALK.steps[END1] as Step;
    return treeFigure(
      `정점 ${e1.start} 에서 매단 탐색 트리 — 굵은 실선이 나무 간선, 정점 안은 ${e1.start} 에서의 거리`,
      LAYOUT.nodes as { id: number; x: number; y: number }[],
      e1.par,
      e1.dist,
      e1.start,
    );
  },
  "build-tree-6": () => {
    const e2 = WALK.steps[END2] as Step;
    return treeFigure(
      `같은 트리를 정점 ${e2.start} 에서 매단 탐색 트리 — 간선은 그대로이고 부모와 깊이와 거리가 바뀐다`,
      placeFrom(e2.start),
      e2.par,
      e2.dist,
      e2.start,
    );
  },
  "walk-film": () => <Film spec={diameterWalk as unknown as PlayerSpec} />,
  "invariant-moment": () => {
    const s = WALK.steps[INV_STEP] as Step;
    const set = s.dist.flatMap((d, v) => (d >= 0 ? [v] : []));
    const unset = s.dist.flatMap((d, v) => (d < 0 ? [v] : []));
    return moment(
      INV_STEP,
      `${stepOf(INV_STEP)} 직후 — 거리를 정한 정점 ${set.length} 개(${set.join(" · ")}), 아직 -1 인 정점 ${unset.join(" · ")}`,
    );
  },
  "related-ecc": relatedEcc,
  "math-median": mathMedian,
};
