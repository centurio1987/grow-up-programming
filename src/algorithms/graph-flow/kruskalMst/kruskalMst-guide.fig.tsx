/**
 * `kruskalMst-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 최소 신장 트리의 합은 정본(`-guide.ref.ts`)이 낸 답이고,
 * 걸음마다의 `parent` · `rank` · 고른 간선 · 덩어리는 정본과 같은 절차에 기록만 덧붙인 사본
 * (`-guide.proof.ts` 의 `traced`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때
 * 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `kruskalMst-guide.test.ts` 가 잰다.
 *
 * ## 그래프 무대를 최소 신장 트리에 쓰는 규약 (graph-flow 첫 편)
 *
 * 그래프 편들은 무대에 **탐색이 어디까지 갔는가**를 그렸다. 이 편에서는 지나가는 것이 없고, 그리는 것은
 * **어느 간선을 골랐는가**와 **정점이 어느 덩어리에 속하는가**다. 그래서 무대의 네 자리를 이렇게 쓴다.
 *
 * - **간선** — 가중치를 머리말로 늘 붙인다(가중치 순으로 보는 것이 절차 전체다). 고른 간선은 굵은 실선
 *   (`tree`), 사이클을 만들어 건너뛴 간선은 대시(`back`), 아직 안 본 간선은 가는 실선이다. 이번 걸음에
 *   고른 간선은 새로 씀, 이번 걸음에 건너뛴 간선은 읽음이다. 무향 그래프라 화살촉이 없다.
 * - **정점** — 값 줄에 `parent` 칸과 `rank` 칸을 함께 적는다(`3 · 2` — 앞이 parent, 뒤가 rank). 대표(`find` 의 결과)가
 *   아니라 **배열에 실제로 적힌 값**이다 — 둘이 갈리는 순간(경로 압축)이 이 편의 요점이라 무대가 배열을
 *   그대로 비춰야 한다. 이번 걸음에 찾은 두 끝점은 읽음, `parent` 칸이 바뀐 정점은 새로 씀이다.
 * - **묶음** — 정점이 둘 이상인 덩어리마다 테 하나. 머리말은 그 덩어리의 대표다. 이번 걸음에 합쳐 새로
 *   생긴 덩어리는 강조 테다.
 * - **띠** — 무대 아래 두 줄이 정렬한 간선 목록이다. 윗줄이 간선, 아랫줄이 가중치이고 같은 칸 번호가
 *   간선 하나다. 이번 걸음에 본 간선은 고르면 새로 씀 · 건너뛰면 읽음, 앞서 건너뛴 간선은 이번 걸음 밖
 *   (대시 테)이다.
 *
 * 뒤의 `primMst` 는 같은 간선 규약을 쓰고 띠만 우선순위 큐로 바꾸면 된다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 이 입력의 간선 일곱이 2 × 3 격자의 가로 넷과 세로 셋에
 * 정확히 맞아 선이 서로 건너지 않는다. 대표 트리 그림은 좌표를 손으로 두지 않고 실행이 낸 `parent`
 * 에서 `treeLayout` 으로 낸다.
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
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
  type NodeGraphScene,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  comma,
  cutAt,
  type Edge,
  edgeName,
  FOCUS_T,
  LAST_T,
  type Look,
  MST,
  originNumbers,
  parentAfter,
  rankAfter,
  rootsOf,
  setsOf,
  WALK,
  WALK_EDGES,
  WALK_N,
} from "./kruskalMst-guide.proof.ts";
import { kruskalMst } from "./kruskalMst-guide.ref.ts";
import { kruskalWalk } from "./kruskalMst-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. 간선은 정렬한 차례다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 1.5, y: 0 },
    { id: 1, x: 3, y: 0 },
    { id: 2, x: 3, y: 1.6 },
    { id: 3, x: 1.5, y: 1.6 },
    { id: 4, x: 0, y: 1.6 },
    { id: 5, x: 0, y: 0 },
  ],
  edges: WALK.sorted.map(([from, to]) => ({ from, to })),
  directed: false,
};

const ANSWER = kruskalMst(WALK_N, WALK_EDGES);
const SORTED = WALK.sorted;
const sameEdge = (a: Edge, b: Edge) =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const inMst = (e: Edge) => MST.some((m) => sameEdge(m, e));

/* ── 입력 그래프 ── */

function inputEdges(state?: (e: Edge) => GraphEdge["state"]): GraphEdge[] {
  return SORTED.map((e) => ({
    from: e[0],
    to: e[1],
    label: String(e[2]),
    ...(state?.(e) ? { state: state(e) } : {}),
    ...(inMst(e) && state ? { kind: "tree" as const } : {}),
  }));
}

/* ── 대표 트리 — parent 를 따라 그린 나무 ── */

const FOREST_UNIT = { x: 88, y: 96 } as const;

/** `parent` 배열을 나무로 — 화살표가 정점에서 그 parent 칸이 가리키는 정점으로 간다. 대표만 rank 를 적는다. */
function forestScene(
  parent: readonly number[],
  rank: readonly number[],
  mark: (v: number) => CellState | undefined = () => undefined,
  markEdge: (v: number) => GraphEdge["state"] = () => undefined,
): NodeGraphScene {
  const roots = parent.map((p, v) => (p === v ? v : -1)).filter((v) => v >= 0);
  const children = new Map<number, number[]>();
  for (const [v, p] of parent.entries()) {
    if (p === v) continue;
    children.set(p, [...(children.get(p) ?? []), v]);
  }
  const xy = treeLayout(roots, children);
  const nodes: GraphNode[] = parent.map((p, v) => {
    const at = xy.get(v) as { x: number; y: number };
    const state = mark(v);
    return {
      id: v,
      x: at.x,
      y: at.y,
      ...(p === v ? { value: `rank ${rank[v]}` } : {}),
      ...(state ? { state } : {}),
    };
  });
  const edges: GraphEdge[] = parent.flatMap((p, v) =>
    p === v
      ? []
      : [
          {
            from: v,
            to: p,
            ...(markEdge(v) ? { state: markEdge(v) } : {}),
          },
        ],
  );
  return { nodes, edges, unit: FOREST_UNIT, directed: true };
}

function forestFrames(ts: readonly number[]): {
  id: string;
  text: string;
  scene: NodeGraphScene;
}[] {
  return ts.map((t) => {
    const l = WALK.looks.find((x) => x.t === t) as Look;
    const changed = new Set<number>([
      ...(l.child === null ? [] : [l.child]),
      ...l.compressed.map((c) => c.x),
    ]);
    const read = new Set<number>([...l.pathU, ...l.pathV]);
    const text =
      l.branch === "skip"
        ? `간선 ${edgeName(l.u, l.v)} — 대표가 둘 다 ${l.ru}, 건너뛴다${l.compressed.length > 0 ? ` · 경로 압축 ${l.compressed.map((c) => `parent[${c.x}] ${c.from} → ${c.to}`).join(" · ")}` : ""}`
        : `간선 ${edgeName(l.u, l.v)} — 대표 ${l.child}${을를(String(l.child))} ${l.root} 밑에${l.rankUp ? ` · rank[${l.root}] = ${l.rank[l.root as number]}` : " · rank 그대로"}`;
    return {
      id: `T${t}`,
      text,
      scene: forestScene(
        l.parent,
        l.rank,
        (v) => (changed.has(v) ? "focus" : read.has(v) ? "read" : undefined),
        (v) => (changed.has(v) ? "focus" : undefined),
      ),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행과 식에서 ── */

function approaches(): Approach[] {
  const o = originNumbers();
  return [
    {
      name: "간선 부분집합 전부 만들기",
      idea: "간선 V − 1 개를 고르는 모든 방법을 만들어 모든 정점을 잇는 것 중 합이 가장 작은 것을 남긴다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `V = ${comma(100_000)} · E = ${comma(200_000)} 에서 부분집합 수만 ${comma(o.digits)} 자리`,
          ok: false,
        },
      ],
      lesson:
        "부분집합을 통째로 고르지 말고 가벼운 간선부터 하나씩 고를지 정하면 어떨까",
    },
    {
      name: "가벼운 것부터 · 탐색으로 사이클 판정",
      idea: "두 끝점이 이미 이어졌는지를 고른 간선 위의 너비 우선 탐색으로 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `한 줄로 이은 100 정점에서 칸 접근 ${comma(o.scan100)} — V² 에 비례`,
          ok: false,
        },
      ],
      lesson:
        "길 자체는 쓰지 않는다 — 「같은 덩어리인가」만 답하는 이름표를 두면 어떨까",
    },
    {
      name: "가벼운 것부터 · 이름표 배열",
      idea: "정점마다 자기 덩어리의 이름표를 그대로 적어 두고, 합칠 때 한쪽 덩어리를 전부 고쳐 쓴다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `비교는 칸 둘이지만 합치기가 한쪽 덩어리 전체 — 한 줄로 이은 100 정점에서 ${comma(o.label100)}`,
          ok: false,
        },
      ],
      lesson:
        "합칠 때 한 칸만 고치려면 정점이 이름표 대신 다음 정점 하나를 가리키게 하면 어떨까",
    },
    {
      name: "가벼운 것부터 · 유니온 파인드",
      idea: "정점마다 parent 칸 하나로 대표 트리를 만들고, 두 끝점의 대표가 같으면 건너뛴다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `맞다 — 전개 입력에서 ${comma(ANSWER)}`,
          ok: true,
        },
        {
          label: "시간",
          value: `한 줄로 이은 100 정점에서 칸 접근 ${comma(o.dsu100)} · 전체는 정렬 E log E 가 덮는다`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차를 실행해 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 하나의 무대. `l` 이 없으면 정렬만 마친 T1 이다. `done` 은 반환 걸음이다. */
function stepStage(l: Look | null, done = false): GraphStep {
  const parent = l?.parent ?? parentAfter(1);
  const rank = l?.rank ?? rankAfter(1);
  const upTo = l?.t ?? 1;
  const seen = WALK.looks.filter((x) => x.t <= upTo);
  const current = done ? null : l;
  const changed = new Set<number>(
    current === null
      ? []
      : [
          ...(current.child === null ? [] : [current.child]),
          ...current.compressed.map((c) => c.x),
        ],
  );
  const read = new Set<number>(current === null ? [] : [current.u, current.v]);
  const nodes = parent.map((p, v) => {
    const state: CellState | undefined = changed.has(v)
      ? "focus"
      : read.has(v)
        ? "read"
        : undefined;
    return { value: `${p} · ${rank[v]}`, ...(state ? { state } : {}) };
  });
  const edges = SORTED.map((e, k) => {
    const look = seen.find((x) => x.k === k);
    const kind =
      look === undefined
        ? undefined
        : look.branch === "skip"
          ? ("back" as const)
          : ("tree" as const);
    const state =
      current !== null && current.k === k
        ? current.branch === "skip"
          ? ("read" as const)
          : ("focus" as const)
        : undefined;
    return {
      label: String(e[2]),
      ...(kind ? { kind } : {}),
      ...(state ? { state } : {}),
    };
  });
  const groups = setsOf(parent)
    .filter((g) => g.length > 1)
    .map((g) => {
      const root = rootsOf(parent)[g[0] as number] as number;
      return {
        members: g,
        label: `대표 ${root}`,
        ...(current !== null &&
        current.branch !== "skip" &&
        g.includes(current.u)
          ? { state: "focus" as const }
          : {}),
      };
    });
  const stripState = (k: number): CellState | undefined => {
    if (current !== null && current.k === k)
      return current.branch === "skip" ? "read" : "focus";
    const look = seen.find((x) => x.k === k);
    return look?.branch === "skip" ? "out" : undefined;
  };
  const states: Partial<Record<number, CellState>> = {};
  for (let k = 0; k < SORTED.length; k++) {
    const s = stripState(k);
    if (s) states[k] = s;
  }
  const last = seen.at(-1);
  const calc =
    l === null
      ? null
      : done
        ? { expr: "picked = n − 1 =", result: String(l.picked) }
        : {
            expr: `find(${l.u}), find(${l.v}) =`,
            result: `${l.ru}, ${l.rv}`,
          };
  return {
    nodes,
    edges,
    groups,
    strips: [
      {
        label: "정렬한 간선",
        values: SORTED.map(([u, v]) => edgeName(u, v)),
        states,
      },
      { label: "가중치", values: SORTED.map((e) => e[2]), states },
    ],
    calc,
    vars: `total = ${last?.total ?? 0} · picked = ${last?.picked ?? 0} / ${WALK_N - 1}`,
  };
}

function stepTitle(l: Look): string {
  return l.branch === "skip"
    ? `T${l.t} ${edgeName(l.u, l.v)} 가중치 ${l.w} — 대표가 같아 건너뛴다`
    : `T${l.t} ${edgeName(l.u, l.v)} 가중치 ${l.w} — 대표가 달라 고른다`;
}

function stepText(l: Look): string {
  const u = String(l.u);
  const v = String(l.v);
  const find = `정점 ${u} 의 대표는 ${l.ru}, 정점 ${v} 의 대표는 ${l.rv} 입니다.`;
  if (l.branch === "skip") {
    const squash =
      l.compressed.length > 0
        ? ` 대표를 찾는 동안 ${l.compressed.map((c) => `parent[${c.x}]${을를(String(c.x))} ${c.from} 에서 ${c.to}${으로(String(c.to))}`).join(" · ")} 고쳐 썼습니다.`
        : "";
    return `${find} 이미 같은 덩어리라 이 간선을 넣으면 사이클이 생기므로 건너뜁니다.${squash}`;
  }
  const child = String(l.child);
  const how =
    l.branch === "gt"
      ? `rank 가 ${l.rankRu} 대 ${l.rankRv}${josa(l.rankRv, "이라", "라")} 낮은 쪽 대표 ${child}${을를(child)} ${l.root} 밑에 붙이고 rank 는 그대로 둡니다.`
      : `rank 가 둘 다 ${l.rankRu}${josa(l.rankRu, "이라", "라")} 대표 ${child}${을를(child)} ${l.root} 밑에 붙이고 rank[${l.root}]${을를(String(l.root))} ${l.rank[l.root as number]}${으로(l.rank[l.root as number] as number)} 올립니다.`;
  return `${find} ${how} total 에 ${l.w}${을를(String(l.w))} 더합니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차를 실행해 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  const last = WALK.looks.at(-1) as Look;
  const [lu, lv] = WALK.unseen[0] as Edge;
  return [
    {
      title: "T1 간선을 가중치 오름차순으로 놓는다",
      text: `간선 ${SORTED.length} 개를 가중치 오름차순으로 정렬했습니다. 아직 아무 간선도 고르지 않아 정점 ${WALK_N} 개가 저마다 자기 자신을 가리킵니다.`,
      ...stepStage(null),
    },
    ...WALK.looks.map((l) => ({
      title: stepTitle(l),
      text: stepText(l),
      ...stepStage(l),
    })),
    {
      title: `T${LAST_T} 고른 간선이 ${last.picked} 개 — ${ANSWER}${을를(String(ANSWER))} 돌려준다`,
      text: `picked 가 n − 1 = ${WALK_N - 1}${이가(String(WALK_N - 1))} 되어 반복을 끝냅니다. 남은 간선 ${edgeName(lu, lv)}${은는(lv)} 보지 않습니다.`,
      ...stepStage(last, true),
    },
  ];
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

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title={`전개 입력 — 정점 ${WALK_N} · 간선 ${WALK_EDGES.length}, 간선 옆 수는 가중치`}
      nodes={LAYOUT.nodes}
      edges={inputEdges()}
      directed={false}
    />
  ),
  "concept-mst": () => (
    <NodeGraph
      title={`최소 신장 트리 — 굵은 간선 ${MST.length} 개, 가중치 합 ${ANSWER}`}
      nodes={LAYOUT.nodes}
      edges={inputEdges((e) => (inMst(e) ? undefined : "out"))}
      directed={false}
    />
  ),
  "concept-forest": () => (
    <NodeGraph
      title={`유니온 파인드 — T${LAST_T - 1} 뒤의 parent 를 화살표로, 대표는 자기 자신을 가리킨다`}
      {...forestScene(
        (WALK.looks.at(-1) as Look).parent,
        (WALK.looks.at(-1) as Look).rank,
      )}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`V = ${comma(100_000)} · E = ${comma(200_000)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-forest": () => {
    const parent = parentAfter(FOCUS_T);
    const deep = parent.findIndex((_, v) => {
      let d = 0;
      let c = v;
      while (parent[c] !== c) {
        c = parent[c] as number;
        d++;
      }
      return d >= 2;
    });
    const walk = new Set<number>();
    let c = deep;
    walk.add(c);
    while (parent[c] !== c) {
      c = parent[c] as number;
      walk.add(c);
    }
    return (
      <NodeGraph
        title={`T${FOCUS_T} 뒤의 유니온 파인드 — 정점 ${deep} 에서 대표까지 ${walk.size - 1} 칸`}
        {...forestScene(
          parent,
          rankAfter(FOCUS_T),
          (v) => (walk.has(v) ? "read" : undefined),
          (v) => (walk.has(v) && parent[v] !== v ? "read" : undefined),
        )}
      />
    );
  },
  "build-compress": () => (
    <NodeGraphFilm
      title="찾기가 지나온 정점을 대표에 바로 붙인다"
      frames={forestFrames(
        WALK.looks
          .filter((l) => l.compressed.length > 0)
          .flatMap((l) => [l.t - 1, l.t]),
      )}
    />
  ),
  "build-union": () => (
    <NodeGraphFilm
      title="대표끼리 붙인다 — rank 가 같으면 올리고, 다르면 낮은 쪽을 높은 쪽 밑에"
      frames={forestFrames(
        WALK.looks
          .filter((l) => l.branch === "eq" || l.branch === "gt")
          .map((l) => l.t),
      )}
    />
  ),
  "walk-film": () => <Film spec={kruskalWalk as unknown as PlayerSpec} />,
  "invariant-cut": () => {
    const { look, side, crossing } = cutAt();
    const before = WALK.looks.filter((l) => l.t < look.t);
    const chosen = before.filter((l) => l.branch !== "skip");
    const isCross = (e: Edge) => crossing.some((c) => sameEdge(c, e));
    const parent = parentAfter(look.t - 1);
    return (
      <NodeGraph
        title={`T${look.t} 직전 — 두 덩어리를 잇는 간선 ${crossing.length} 개 중 가장 가벼운 ${edgeName(look.u, look.v)}`}
        nodes={LAYOUT.nodes}
        edges={SORTED.map((e) => ({
          from: e[0],
          to: e[1],
          label: String(e[2]),
          ...(chosen.some((l) => l.k === SORTED.indexOf(e))
            ? { kind: "tree" as const }
            : {}),
          ...(sameEdge(e, [look.u, look.v, look.w])
            ? { state: "focus" as const }
            : isCross(e)
              ? { state: "read" as const }
              : chosen.some((l) => l.k === SORTED.indexOf(e))
                ? {}
                : { state: "out" as const }),
        }))}
        groups={setsOf(parent)
          .filter((g) => g.length > 1 || side.includes(g[0] as number))
          .map((g) => ({
            members: g,
            label: g.includes(look.u) ? "한쪽" : "다른 쪽",
          }))}
        directed={false}
      />
    );
  },
};
