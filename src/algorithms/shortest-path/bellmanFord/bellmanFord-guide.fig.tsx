/**
 * `bellmanFord-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 거리 · 라운드마다 읽은 간선 · 그 값을 낸 간선은 정본과
 * 같은 절차에 기록만 덧붙인 사본(`-guide.proof.ts` 의 `record`)이 내고, 그 사본은 이 파일을 읽을 때
 * 자기 답을 정본(`-guide.ref.ts`)과 맞댄다. 층(`opt_k`)은 증명 사이드카의 `optAtMost` 가 낸다.
 *
 * ## 라운드 하나를 무대에 보이는 법 — 새 무대를 만들지 않는다(KAN-058)
 *
 * 이 절차의 걸음 하나는 **라운드 하나**, 곧 간선 목록 전체를 한 번 읽는 일이다. 독자가 걸음마다 알아야
 * 할 것은 셋이다 — 정점마다 지금 적힌 거리, 이번 라운드에 값을 고친 간선, 그리고 **목록의 차례대로
 * 읽었다는 것**(앞에서 읽은 간선이 적은 값을 뒤에서 읽은 간선이 다시 고친다). 앞의 둘은 그래프 무대의
 * 정점과 간선이 그대로 싣고, 셋째는 무대 아래 띠 둘(`strips`)이 싣는다. `dijkstra` 가 우선순위 큐를
 * 띠로 그린 것과 같은 자리라 무대 · 패턴을 넓히지 않았다(SPEC §13 그래프 줄).
 *
 * - 윗 띠 「간선 목록」은 간선을 **적힌 차례대로** 늘어놓는다. 아랫 띠 「dist[u] + w」는 그 라운드에서
 *   그 간선을 읽을 때 만든 후보다. 같은 칸 번호가 간선 하나다.
 * - 칸의 상태는 간선의 상태와 같다 — 값을 고친 간선은 새로 씀(`focus`), 읽었지만 못 고친 간선은
 *   읽음(`read`), 꼬리의 값이 없어 ③ 으로 넘어간 간선은 이번 걸음 밖(`out`)이다.
 * - 정점 안의 값은 라운드가 끝난 뒤의 `dist` 이고, 이번 라운드에 값이 바뀐 정점은 새로 씀이다. 아직
 *   값이 없는 정점은 점선(`empty`)이고 끝난 뒤에도 값이 없으면 이번 걸음 밖에 `Infinity` 를 적는다.
 * - 굵은 실선(`tree`)은 지금 그 정점의 값을 낸 간선이다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 사슬 `0 → 1 → … → 5` 를 두 줄에 지그재그로 놓고, 간선
 * `5 → 1` 은 위로 휘어 정점 3 을 비켜 가게 했다. 들어오는 간선이 없는 정점 6 은 오른쪽 아래에 둔다.
 */

import type { ReactElement } from "react";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  arrow,
  comma,
  complete,
  countSimplePaths,
  DIJKSTRA_NEGATIVE,
  E_LIMIT,
  NEG_EDGES,
  num,
  optAtMost,
  orderSweep,
  plusW,
  type Round,
  record,
  settleOnce,
  show,
  untilStable,
  V_LIMIT,
  WALK,
  WALK_EDGES,
  WALK_N,
  WALK_SRC,
} from "./bellmanFord-guide.proof.ts";
import { bellmanFordWalk } from "./bellmanFord-guide.sim.ts";

const INF = Number.POSITIVE_INFINITY;

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 2 },
    { id: 1, x: 1, y: 1 },
    { id: 2, x: 2, y: 2 },
    { id: 3, x: 3, y: 1 },
    { id: 4, x: 4, y: 2 },
    { id: 5, x: 5, y: 1 },
    { id: 6, x: 5.6, y: 2.4 },
  ],
  edges: WALK_EDGES.map(([from, to]) =>
    from === 5 && to === 1 ? { from, to, bend: -0.22 } : { from, to },
  ),
  directed: true,
};

/** 간선 번호 `at` 가 라운드 `r` 이 끝난 뒤 정점의 값을 낸 간선인가. */
const isTree = (pred: readonly number[], at: number): boolean => {
  const v = (WALK_EDGES[at] as [number, number, number])[1];
  return pred[v] === at;
};

const STATE_OF = (e: {
  skipped: boolean;
  improved: boolean;
}): CellState & GraphEdge["state"] =>
  e.skipped ? "out" : e.improved ? "focus" : "read";

/** 무대 아래 띠 둘 — 간선 목록과 그 라운드의 후보. */
function listStrips(r: Round | null): GraphStrip[] {
  const states: Partial<Record<number, CellState>> = {};
  if (r) {
    for (const e of r.reads) states[e.at] = STATE_OF(e);
  }
  return [
    {
      label: "간선 목록",
      values: WALK_EDGES.map((e) => arrow(e)),
      states,
      slots: WALK_EDGES.length,
    },
    {
      label: "dist[u] + w",
      values: WALK_EDGES.map((_, at) => {
        const e = r?.reads[at];
        if (!e) return "";
        return e.cand === null ? "—" : num(e.cand);
      }),
      states,
      slots: WALK_EDGES.length,
    },
  ];
}

const TOTAL_READS = WALK.rounds.reduce((a, r) => a + r.reads.length, 0);

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 `i` — 0 이 T1(시작값), 1..R 이 라운드, R+1 이 반환. */
function stage(i: number): GraphStep {
  const R = WALK.rounds.length;
  const r = i >= 1 && i <= R ? (WALK.rounds[i - 1] as Round) : null;
  const end = i === R + 1;
  const dist = i === 0 ? WALK.start : end ? WALK.dist : (r as Round).dist;
  const pred =
    i === 0
      ? WALK_EDGES.map(() => -1)
      : ((WALK.rounds[Math.min(i, R) - 1] as Round).pred as number[]);
  const written = new Set(
    r ? r.reads.filter((e) => e.improved).map((e) => e.v) : [],
  );
  const nodes = dist.map((d, v) => {
    if (d === INF) {
      return end
        ? { value: "Infinity", state: "out" as const }
        : { value: "", state: "empty" as const };
    }
    const state: CellState | undefined =
      (i === 0 && v === WALK_SRC) || written.has(v) ? "focus" : undefined;
    return { value: `dist ${num(d)}`, ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map((e, at) => {
    const read = r?.reads[at];
    const state = read ? STATE_OF(read) : undefined;
    return {
      ...(isTree(pred, at) ? { kind: "tree" as const } : {}),
      ...(state ? { state } : {}),
      label: String(e[2]),
    };
  });
  const done = WALK.rounds
    .slice(0, Math.min(i, R))
    .reduce((a, x) => a + x.reads.length, 0);
  let calc: GraphStep["calc"];
  if (i === 0) calc = { expr: `dist[${WALK_SRC}] =`, result: "0" };
  else if (end)
    calc = {
      expr: "hasNegativeCycle =",
      result: String(WALK.hasNegativeCycle),
    };
  else {
    const rr = r as Round;
    const n = rr.reads.filter((e) => e.improved).length;
    calc = {
      expr: `고친 칸 ${n} 개 → !changed =`,
      result: rr.changed ? "거짓" : "참",
    };
  }
  return {
    nodes,
    edges,
    strips: listStrips(r),
    calc,
    vars: `간선 읽기 ${done} / ${TOTAL_READS}`,
  };
}

function stepTitle(i: number): string {
  const R = WALK.rounds.length;
  if (i === 0) return "T1 시작값";
  if (i === R + 1) return `T${i + 1} dist 와 판정을 돌려준다`;
  const r = WALK.rounds[i - 1] as Round;
  const fixed = r.reads.filter((e) => e.improved).map((e) => `dist[${e.v}]`);
  return fixed.length === 0
    ? `T${i + 1} 라운드 ${r.k} — 고친 칸이 없다`
    : `T${i + 1} 라운드 ${r.k} — ${fixed.join(" · ")}${을를(String(r.reads.filter((e) => e.improved).at(-1)?.v))} 고친다`;
}

function stepText(i: number): string {
  const R = WALK.rounds.length;
  if (i === 0) {
    return `dist[${WALK_SRC}] 에 0 을 적고 나머지 ${WALK_N - 1} 칸은 Infinity 로 둡니다. 아직 간선을 하나도 읽지 않았습니다.`;
  }
  if (i === R + 1) {
    const out = WALK.dist.flatMap((d, v) => (d === INF ? [v] : []));
    return `마지막 라운드가 한 칸도 못 고쳐 ⑤ 에서 끝났습니다. 음수 사이클은 없다고 판정하고 ${show(WALK.dist)} 와 false 를 돌려줍니다. 들어오는 간선이 없는 정점 ${out.join(" · ")}${은는(out.join(" · "))} Infinity 로 남았습니다.`;
  }
  const r = WALK.rounds[i - 1] as Round;
  const skipped = r.reads.filter((e) => e.skipped).length;
  const parts = r.reads
    .filter((e) => e.improved)
    .map((e) => {
      const c = num(e.cand as number);
      const calc = `${num(e.du)} + ${plusW(e.w)} = ${c}`;
      return e.before === INF
        ? `${arrow([e.u, e.v, e.w])}${이가(String(e.v))} ${calc}${을를(c)} 처음 적습니다`
        : `${arrow([e.u, e.v, e.w])}${이가(String(e.v))} ${calc}${으로(c)} ${num(e.before)}${을를(num(e.before))} 고칩니다`;
    });
  const head = `간선 ${WALK_EDGES.length} 개를 적힌 차례대로 읽습니다. 꼬리의 값이 없는 간선 ${skipped} 개는 ③ 으로 넘어갑니다.`;
  if (parts.length === 0) {
    return `${head} 나머지 간선도 적힌 값을 못 줄여 고친 칸이 없고, changed 가 거짓이라 여기서 반복을 끝냅니다.`;
  }
  return `${head} ${parts.join(". ")}. 고친 칸이 있어 다음 라운드로 갑니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return Array.from({ length: WALK.rounds.length + 2 }, (_, i) => ({
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

/* ── 「아이디어를 떠올리는 과정」의 시도 다섯 ── */

function approaches(): Approach[] {
  const d2 = DIJKSTRA_NEGATIVE[1] as (typeof DIJKSTRA_NEGATIVE)[number];
  const settled = settleOnce(d2.n, d2.edges, 0).dist;
  const truth = record(d2.n, d2.edges, 0).dist;
  const noStop = untilStable(3, NEG_EDGES, 0, 6);
  const sweep = orderSweep();
  const roundKeys = [...sweep.rounds.keys()].sort((a, b) => a - b);
  const best = roundKeys[0] as number;
  const bestShare = (
    ((sweep.rounds.get(best) ?? 0) / sweep.total) *
    100
  ).toFixed(1);
  const ten = countSimplePaths(10, complete(10), 0);
  return [
    {
      name: "경로를 전부 나열하기",
      idea: "출발점에서 나가는 단순 경로를 전부 만들어 도착 정점마다 가장 작은 비용을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "음수 가중치가 있어도 맞다", ok: true },
        {
          label: "시간",
          value: `정점 10 개 완전 그래프에서 경로 ${comma(ten)} 개 · V = ${V_LIMIT} 이면 ${V_LIMIT - 1}! 개 이상`,
          ok: false,
        },
      ],
      lesson: "경로가 아니라 정점마다 거리 하나를 들고 고쳐 가자",
    },
    {
      name: "거리가 가장 작은 정점부터 확정하기",
      idea: "dijkstra 처럼 거리가 가장 작은 정점을 꺼내 확정하고 다시 보지 않는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `${d2.label} 에서 ${show(settled)} — 맞는 답은 ${show(truth)}`,
          ok: false,
        },
      ],
      lesson:
        "음수 간선이 확정한 값을 뒤에서 줄인다 — 확정하지 말고 간선 목록 전체를 다시 읽자",
    },
    {
      name: "고칠 것이 없을 때까지 간선 목록을 라운드마다 다시 읽기",
      idea: "간선 전부를 읽어 dist[u] + w 가 더 작으면 dist[v] 를 고치고, 한 라운드가 아무것도 못 고치면 멈춘다",
      verdict: "drop",
      checks: [
        { label: "답", value: "음수 사이클이 없으면 맞다", ok: true },
        {
          label: "멈춤",
          value: `음수 사이클 0→1→2→0 에서 ${noStop.length} 라운드 모두 값을 고쳐 끝나지 않는다`,
          ok: false,
        },
      ],
      lesson: "몇 라운드면 충분한지 상한이 있어야 한다",
    },
    {
      name: "간선 목록을 좋은 순서로 정렬해 두기",
      idea: "값이 정해지는 차례대로 간선을 적어 두면 라운드가 줄어든다",
      verdict: "drop",
      checks: [
        {
          label: "라운드",
          value: `순서 ${comma(sweep.total)} 가지 중 가장 적은 ${best} 라운드짜리가 ${bestShare} %`,
          ok: null,
        },
        {
          label: "조건",
          value: "그 순서를 고르려면 최단 경로를 이미 알아야 한다",
          ok: false,
        },
      ],
      lesson:
        "순서를 고르지 말고 어떤 순서에서도 충분한 라운드 수를 상한으로 잡자",
    },
    {
      name: "V−1 라운드 완화하고 한 라운드 더 읽기",
      idea: "최단 경로의 간선은 많아야 V−1 개라 V−1 라운드면 끝나고, V 번째 라운드가 고치면 음수 사이클이다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `순서 ${comma(sweep.total)} 가지 모두 정답`,
          ok: true,
        },
        {
          label: "시간",
          value: `간선 읽기 V × E 이하 — V = ${V_LIMIT} · E = ${comma(E_LIMIT)} 이면 ${comma(V_LIMIT * E_LIMIT)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 층(opt_k) 필름 — k 마다 그 층의 값을 낸 간선 ── */

/** 층 `k` 에서 정점마다 그 값을 낸 간선의 번호. 값이 그대로면 앞 층의 간선을 이어받는다. */
function layerPreds(K: number): number[][] {
  const out: number[][] = [Array.from({ length: WALK_N }, () => -1)];
  for (let k = 1; k <= K; k++) {
    const prev = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k - 1);
    const cur = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k);
    const p = (out[k - 1] as number[]).slice();
    for (let v = 0; v < WALK_N; v++) {
      if ((cur[v] as number) >= (prev[v] as number)) continue;
      p[v] = WALK_EDGES.findIndex(
        ([a, b, w]) => b === v && (prev[a] as number) + w === cur[v],
      );
    }
    out.push(p);
  }
  return out;
}

function LayerFilm() {
  const K = WALK_N - 1;
  const preds = layerPreds(K);
  const frames = Array.from({ length: K + 1 }, (_, k) => {
    const cur = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k);
    const prev =
      k === 0 ? null : optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k - 1);
    const changed = prev
      ? cur.flatMap((d, v) => (d < (prev[v] as number) ? [v] : []))
      : [WALK_SRC];
    const p = preds[k] as number[];
    return {
      id: `k=${k}`,
      text:
        k === 0
          ? "간선 0 개 — 출발점만 0"
          : changed.length === 0
            ? `간선 ${k} 개 이하 — 줄어든 정점이 없다`
            : `간선 ${k} 개 이하 — 줄어든 정점 ${changed.join(" · ")}`,
      scene: {
        nodes: LAYOUT.nodes.map((n) => {
          const d = cur[n.id] as number;
          if (d === INF) return { ...n, value: "", state: "empty" as const };
          return {
            ...n,
            value: `opt ${num(d)}`,
            ...(changed.includes(n.id) ? { state: "focus" as const } : {}),
          };
        }),
        edges: WALK_EDGES.map((e, at) => ({
          ...LAYOUT.edges[at],
          from: e[0],
          to: e[1],
          label: String(e[2]),
          ...(p[e[1]] === at
            ? { kind: "tree" as const }
            : { state: "out" as const }),
        })),
      },
    };
  });
  return (
    <NodeGraphFilm
      title="층 k = 0 … 6 — 정점 안의 값은 간선을 k 개 이하로 쓰는 최단 비용, 굵은 간선이 그 값을 낸 경로"
      frames={frames}
    />
  );
}

/* ── 정적 그림들 ── */

/** 최종 거리를 정점 안에 적은 정점들. 도달하지 못한 정점은 이번 걸음 밖. */
function finalScene() {
  const last = WALK.rounds.at(-1) as Round;
  return {
    nodes: LAYOUT.nodes.map((n) => {
      const d = WALK.dist[n.id] as number;
      return d === INF
        ? { ...n, value: "Infinity", state: "out" as const }
        : { ...n, value: `거리 ${num(d)}` };
    }),
    edges: WALK_EDGES.map((e, at) => ({
      ...LAYOUT.edges[at],
      from: e[0],
      to: e[1],
      label: String(e[2]),
      ...(isTree(last.pred, at) ? { kind: "tree" as const } : {}),
    })),
  };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title="전개 입력 — 간선 옆 수는 가중치, 정점 안의 수는 정점 0 에서의 최단 거리"
      {...finalScene()}
    />
  ),
  "concept-cycle": () => {
    const sum = NEG_EDGES.reduce((a, [, , w]) => a + w, 0);
    return (
      <NodeGraph
        title={`음수 사이클 0→1→2→0 — 가중치 합 ${NEG_EDGES.map(([, , w]) => plusW(w)).join(" + ")} = ${sum}`}
        nodes={[
          { id: 0, x: 0, y: 1 },
          { id: 1, x: 1.2, y: 0 },
          { id: 2, x: 2.4, y: 1 },
        ]}
        edges={NEG_EDGES.map(([from, to, w]) => ({
          from,
          to,
          label: String(w),
          kind: "tree" as const,
        }))}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${V_LIMIT} · E ≤ ${comma(E_LIMIT)} · 가중치에 음수가 있다 · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-layers": () => <LayerFilm />,
  "walk-bellman-ford": () => (
    <Film spec={bellmanFordWalk as unknown as PlayerSpec} />
  ),
};
