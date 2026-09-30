/**
 * `bentleyOttmann-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 답은 정본(`-guide.ref.ts`)이 낸 것이고, 걸음마다의 상태
 * 배열 · 사건 큐 · 예약 · 센 짝은 정본과 같은 절차를 걸음마다 기록한 사본(`-guide.proof.ts` 의
 * `WALK_STEPS`)이 낸다. 그 사본은 부를 때마다 자기 답을 정본과 맞댄다.
 *
 * **평면 위의 선분은 「그래프」 무대(`NodeGraph`)로 그린다** — 볼록 껍질 편(`convexHull`) · 가장 가까운
 * 두 점 편(`closestPairOfPoints`)의 약속을 잇는다. 끝점과 교차점을 정점으로 두고 좌표를 그대로 정점
 * 자리로 주며, 화면은 아래로 갈수록 `y` 가 커지므로 `y` 만 뒤집는다(`YMAX − y`). 선분은 그 선분 위의
 * 정점을 차례로 잇는 간선 토막들이고, 선분 이름은 첫 토막에 붙인다. 스위프 선은 세로 기준선(`rules`)이다.
 *
 * 무대 아래 띠는 셋이다. 상태 배열(`status`, 아래 칸부터 y 가 작은 선분), 열린 세로 선분(`upright`),
 * 사건 큐다. **사건 큐는 다익스트라 편의 「꺼낼 차례」 띠 둘을 따른다**(`dijkstra-guide.fig.tsx` 머리
 * 주석) — 큐에 든 자리를 꺼낼 차례대로 늘어놓고, 윗줄이 x · 아랫줄이 y 이며 같은 칸 번호가 자리 하나다.
 * 첫 칸이 곧 다음 걸음에 꺼낼 사건점이고, 이번 걸음에 예약한 교차점은 새로 씀이다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `bentleyOttmann-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type EdgeKind,
  type EdgeState,
  type GraphEdge,
  type GraphNode,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import { segmentsIntersect } from "../segmentsIntersect/segmentsIntersect-guide.ref.ts";
import {
  cmpSpot,
  crossingSpot,
  type Seg,
  type Spot,
  zero,
} from "./bentleyOttmann-guide.alt.ts";
import {
  edgePair,
  kindOf,
  ladderValues,
  MAX_N,
  names,
  nm,
  num,
  PER_SECOND,
  pairText,
  type Step,
  seconds,
  spotText,
  spotX,
  spotXf,
  spotY,
  spotYf,
  WALK,
  WALK_SEGS,
  WALK_STEPS,
  yAt,
} from "./bentleyOttmann-guide.proof.ts";
import type { Segment } from "./bentleyOttmann-guide.ref.ts";
import { sweepFirst, sweepSecond } from "./bentleyOttmann-guide.sim.ts";

/* ── 평면 배치 ── */

const cmp = (a: Spot, b: Spot): number => cmpSpot(a, b, zero());
const same = (a: Spot, b: Spot): boolean => cmp(a, b) === 0;

const YMAX = Math.max(...WALK.flatMap((s) => [s[0][1], s[1][1]]));

/** 평면 한 칸의 픽셀 — 좌표 1 이 가로 100 · 세로 64. */
const PLANE_UNIT = { x: 100, y: 64 } as const;

const lo = (g: Seg): Spot => ({ x: g.lox, y: g.loy, d: 1n });
const hi = (g: Seg): Spot => ({ x: g.hix, y: g.hiy, d: 1n });

/** 교차하는 두 선분의 짝과 그 교차점 — 실행에서 받는다. 짝이 모두 한 점에서 만나는 입력이다. */
const MEETS: { pair: [number, number]; spot: Spot }[] = [];
for (let i = 0; i < WALK.length; i++) {
  for (let j = i + 1; j < WALK.length; j++) {
    if (!segmentsIntersect(WALK[i] as Segment, WALK[j] as Segment)) continue;
    const q = crossingSpot(WALK_SEGS[i] as Seg, WALK_SEGS[j] as Seg, zero());
    if (q === null) throw new Error("전개 입력의 교차가 한 점이 아니다");
    MEETS.push({ pair: [i, j], spot: q });
  }
}

/** 정점 — 끝점 `2·id`(lo) · `2·id + 1`(hi), 그 뒤에 교차점을 사전순으로. */
const CROSS = [...MEETS].sort((a, b) => cmp(a.spot, b.spot));
const SPOTS: Spot[] = [
  ...WALK_SEGS.flatMap((g) => [lo(g), hi(g)]),
  ...CROSS.map((m) => m.spot),
];
const CROSS_BASE = 2 * WALK.length;

/** 선분 위에 놓인 정점을 사전순으로 — 그 차례로 이은 것이 간선 토막이다. */
function onSegment(id: number): number[] {
  const ids = [2 * id, 2 * id + 1];
  CROSS.forEach((m, k) => {
    if (m.pair.includes(id)) ids.push(CROSS_BASE + k);
  });
  return ids.sort((a, b) => cmp(SPOTS[a] as Spot, SPOTS[b] as Spot));
}

/** 간선 토막 — 선분마다 이웃한 정점 둘. `seg` 는 그 토막이 속한 선분. */
const PIECES: { from: number; to: number; seg: number; first: boolean }[] =
  WALK_SEGS.flatMap((g) => {
    const on = onSegment(g.id);
    return on.slice(1).map((to, k) => ({
      from: on[k] as number,
      to,
      seg: g.id,
      first: k === 0,
    }));
  });

/** 걸음 재생 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: SPOTS.map((p, id) => ({
    id,
    x: spotXf(p),
    y: YMAX - spotYf(p),
    label: spotText(p),
  })),
  edges: PIECES.map((e) => ({ from: e.from, to: e.to })),
  directed: false,
  unit: PLANE_UNIT,
};

/** 정적 그림의 정점 — 자리는 `LAYOUT` 그대로. */
const planeNodes = (
  state: (id: number) => CellState | undefined = () => undefined,
): GraphNode[] => LAYOUT.nodes.map((n) => ({ ...n, state: state(n.id) }));

/** 정적 그림의 간선 — 선분 이름은 첫 토막에. */
const planeEdges = (
  kind: (seg: number) => EdgeKind | undefined = () => undefined,
  state: (seg: number) => EdgeState | undefined = () => undefined,
): GraphEdge[] =>
  PIECES.map((e) => ({
    from: e.from,
    to: e.to,
    kind: kind(e.seg),
    state: state(e.seg),
    label: e.first ? nm(e.seg) : undefined,
  }));

/** x = `xn/xd` 의 스위프 선 위에 있는 세로가 아닌 선분을 아래부터. */
function orderAt(xn: bigint, xd: bigint): number[] {
  const on = WALK_SEGS.filter(
    (g) => !g.vertical && g.lox * xd <= xn && xn <= g.hix * xd,
  );
  const y = (g: Seg) =>
    Number(g.loy * g.dx * xd + g.dy * (xn - g.lox * xd)) / Number(g.dx * xd);
  return on.sort((a, b) => y(a) - y(b)).map((g) => g.id);
}

/** 스위프 선 하나 위의 상태 배열 띠 둘 — 선분 이름과 그 x 에서의 y. */
function statusStrips(x: bigint, slots: number): GraphStrip[] {
  const ids = orderAt(x, 1n);
  return [
    {
      label: `x = ${x} · status`,
      values: ids.map(nm),
      slots,
    },
    {
      label: `x = ${x} · y`,
      values: ids.map((id) => yAt(WALK_SEGS[id] as Seg, x, 1n)),
      slots,
    },
  ];
}

/* ── 걸음 재생 패널 — 걸음 기록 한 줄을 무대 한 장으로 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 상태 배열 · 사건 큐 띠의 칸 수 — 가장 컸을 때에 맞춰 고정한다. */
const STATUS_SLOTS = Math.max(...WALK_STEPS.map((s) => s.status.length));
const QUEUE_SLOTS = Math.max(...WALK_STEPS.map((s) => s.queue.length));
const UPRIGHT_SLOTS = Math.max(1, ...WALK_STEPS.map((s) => s.upright.length));

/** 교차점 정점이 이 걸음에 새로 센 짝의 자리인가. */
const freshAt = (s: Step, k: number): boolean => {
  const m = CROSS[k] as (typeof CROSS)[number];
  return s.fresh.some(([a, b]) => a === m.pair[0] && b === m.pair[1]);
};

/** 걸음 설명 한두 문장 — 기록의 값에서 만든다. */
function textOf(s: Step): string {
  const out: string[] = [];
  for (const o of s.opening) {
    const hit = names(s.opened.find((x) => x.id === o)?.hits ?? []);
    out.push(
      `세로 선분 ${nm(o)}${을를(nm(o))} 열고, x = ${spotX(s.now)} 에서 y 범위에 드는 ${hit}${과와(hit)} 짝을 셉니다.`,
    );
  }
  if (s.starting.length > 0) {
    const st = names(s.starting);
    const status = names(s.status);
    out.push(
      `${st}${이가(st)} 시작해 상태 배열이 ${status}${이가(status)} 됩니다.`,
    );
  }
  if (
    s.opening.length === 0 &&
    s.starting.length === 0 &&
    s.through.length > 1
  ) {
    const th = names(s.through);
    const af = names(s.after);
    out.push(
      `이 점을 지나는 토막 ${th}${을를(th)} 기울기 순 ${af}${으로(af)} 다시 놓습니다.`,
    );
  }
  if (s.ended.length > 0) {
    const en = names(s.ended);
    out.push(`${en}${이가(en)} 끝나 상태 배열에서 빠집니다.`);
  }
  for (const c of s.closing) {
    out.push(`세로 선분 ${nm(c)}${을를(nm(c))} 닫습니다.`);
  }
  for (const k of s.checks) {
    if (k.pair === null) continue;
    const pair = edgePair(k.pair);
    if (k.booked && k.spot !== null) {
      const at = spotText(k.spot);
      out.push(
        `새 이웃 ${pair} 의 교차점 ${at}${josa(spotY(k.spot), "을", "를")} 사건 큐에 넣습니다.`,
      );
    }
  }
  if (out.length === 0) out.push("상태 배열이 그대로입니다.");
  return out.join(" ");
}

/** 걸음 하나의 무대. */
function stageOf(s: Step, done: ReadonlySet<number>): GraphStep {
  const inQueue = (p: Spot) => s.queue.some((q) => same(q, p));
  const nodes = SPOTS.map((p, id) => {
    if (same(p, s.now)) return { value: "now", state: "read" as const };
    if (s.booked.some((q) => same(q, p))) return { state: "focus" as const };
    if (id >= CROSS_BASE && freshAt(s, id - CROSS_BASE)) {
      return { state: "focus" as const };
    }
    if (inQueue(p)) return { state: "empty" as const };
    if (done.has(id)) return {};
    return { state: "out" as const };
  });
  const active = new Set([...s.status, ...s.upright]);
  const touched = new Set([
    ...s.after,
    ...s.starting,
    ...s.ended,
    ...s.opening,
    ...s.closing,
  ]);
  const read = new Set([
    ...s.through,
    ...s.checks.flatMap((k) => (k.pair === null ? [] : [...k.pair])),
    ...s.opened.flatMap((o) => o.hits),
  ]);
  const edges = PIECES.map((e) => {
    const g = WALK_SEGS[e.seg] as Seg;
    const label = e.first ? nm(e.seg) : undefined;
    if (cmp(lo(g), s.now) > 0) {
      return { state: "out" as const, ...(label ? { label } : {}) };
    }
    const kind = active.has(e.seg) ? ("tree" as const) : undefined;
    const state = touched.has(e.seg)
      ? ("focus" as const)
      : read.has(e.seg)
        ? ("read" as const)
        : undefined;
    return {
      ...(kind ? { kind } : {}),
      ...(state ? { state } : {}),
      ...(label ? { label } : {}),
    };
  });
  const placed = new Set(s.after);
  const booked = (p: Spot) => s.booked.some((q) => same(q, p));
  const queueStates = Object.fromEntries(
    s.queue.flatMap((p, k) => (booked(p) ? [[k, "focus" as CellState]] : [])),
  );
  const strips: GraphStrip[] = [
    {
      label: "status",
      values: s.status.map(nm),
      states: Object.fromEntries(
        s.status.flatMap((id, k) =>
          placed.has(id) ? [[k, "focus" as CellState]] : [],
        ),
      ),
      slots: STATUS_SLOTS,
    },
    {
      label: "upright",
      values: s.upright.map(nm),
      states: Object.fromEntries(
        s.upright.flatMap((id, k) =>
          s.opening.includes(id) ? [[k, "focus" as CellState]] : [],
        ),
      ),
      slots: UPRIGHT_SLOTS,
    },
    {
      label: "큐 · x",
      values: s.queue.map(spotX),
      states: queueStates,
      slots: QUEUE_SLOTS,
    },
    {
      label: "큐 · y",
      values: s.queue.map(spotY),
      states: queueStates,
      slots: QUEUE_SLOTS,
    },
  ];
  const calc =
    s.fresh.length > 0
      ? {
          expr: `센 짝 ${s.fresh.map(pairText).join(", ")} →`,
          result: `pairs ${num(s.pairs)}`,
        }
      : s.booked.length > 0
        ? {
            expr: `${s.checks
              .filter((k) => k.booked && k.pair !== null)
              .map((k) => edgePair(k.pair as [number, number]))
              .join(", ")} 의 교차점 =`,
            result: s.booked.map(spotText).join(" "),
          }
        : null;
  return {
    nodes,
    edges,
    groups: [],
    strips,
    rules: [{ x: spotXf(s.now), label: `스위프 선 x = ${spotX(s.now)}` }],
    calc,
    vars: `pairs ${num(s.pairs)}`,
  };
}

/** 두 벌로 가르는 자리 — 첫 교차점 사건까지가 첫 벌이다. */
const SPLIT = WALK_STEPS.findIndex((s) => kindOf(s) === "교차") + 1;

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): {
  sweepFirst: SimStep[];
  sweepSecond: SimStep[];
} {
  const done = new Set<number>();
  const all: SimStep[] = WALK_STEPS.map((s) => {
    const step: SimStep = {
      title: `${s.tag} ${spotText(s.now)} — ${kindOf(s)}`,
      text: textOf(s),
      ...stageOf(s, done),
    };
    SPOTS.forEach((p, id) => {
      if (same(p, s.now)) done.add(id);
      if (id >= CROSS_BASE && freshAt(s, id - CROSS_BASE)) done.add(id);
    });
    return step;
  });
  return { sweepFirst: all.slice(0, SPLIT), sweepSecond: all.slice(SPLIT) };
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
function Film({ spec }: { spec: PlayerSpec }) {
  const frames = playerFrames(spec);
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

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행과 하한식에서 ── */

function approaches(): Approach[] {
  const v = ladderValues();
  return [
    {
      name: "모든 쌍 판정",
      idea: "선분 쌍을 하나도 거르지 않고 전부 교차 판정한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(MAX_N)} 에서 기본 연산 ${num(v.brute)} 번 이상 · ${seconds(v.brute)}`,
          ok: false,
        },
      ],
      lesson: "x 구간이 겹치지도 않는 짝까지 판정한다 — 먼저 x 로 걸러 보자",
    },
    {
      name: "x 구간이 겹치는 짝만",
      idea: "끝점을 x 차례로 지나며, 시작하는 선분을 지금 열린 선분 전부와 판정한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "가로로 나란한 512",
          value: `교차 ${num(v.flatOverlap.pairs)} 인데 판정한 짝 ${num(v.flatOverlap.judged)} — 쌍 전부`,
          ok: false,
        },
      ],
      lesson:
        "열린 선분끼리도 멀리 떨어진 짝이 있다 — 스위프 선 위의 y 순서로 늘어놓고 이웃만 보자",
    },
    {
      name: "끝점에서만 이웃 판정",
      idea: "상태 배열을 y 순서로 들고, 선분이 들어오고 나갈 때 새로 이웃이 된 짝만 판정한다",
      verdict: "drop",
      checks: [
        {
          label: "가로로 나란한 512",
          value: `판정한 짝 ${num(v.flatEndpoints.judged)}`,
          ok: true,
        },
        {
          label: "s1 을 늘인 전개 입력",
          value: `답 ${num(v.stretchEndpoints)} — 정답 ${num(v.stretchBrute)} 에서 하나를 놓친다`,
          ok: false,
        },
      ],
      lesson:
        "순서는 교차점에서 바뀐다 — 교차점도 사건으로 삼아 그 자리에서 순서를 고치자",
    },
    {
      name: "이웃 교차 예약",
      idea: "새로 이웃이 된 두 선분의 교차점을 사건 큐에 예약하고, 그 사건점에서 순서를 뒤집는다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `s1 을 늘인 전개 입력에서 ${num(v.stretchSweep)}`,
          ok: true,
        },
        {
          label: "가로로 나란한 512",
          value: `기본 연산 ${num(v.flatSweep)} · x 구간 판 ${num(v.flatOverlap.ops)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 교차점 정점의 상태 ── */

const isCross = (id: number): boolean => id >= CROSS_BASE;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-sweep": () => (
    <NodeGraph
      title={`선분 다섯과 교차점 ${num(CROSS.length)} 개 — 스위프 선 x = 1 과 그 위의 상태 배열`}
      directed={false}
      unit={PLANE_UNIT}
      nodes={planeNodes((id) => (isCross(id) ? "focus" : undefined))}
      edges={planeEdges((seg) =>
        orderAt(1n, 1n).includes(seg) ? "tree" : undefined,
      )}
      rules={[{ x: 1, label: "스위프 선 x = 1" }]}
      strips={statusStrips(1n, STATUS_SLOTS)}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`선분 n = ${num(MAX_N)} · 좌표는 절댓값 10^9 이하의 정수 · 기본 연산 1 초에 ${num(PER_SECOND)} 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-status": () => (
    <NodeGraph
      title="스위프 선 x = 1 과 x = 5 — 두 자리의 상태 배열"
      directed={false}
      unit={PLANE_UNIT}
      nodes={planeNodes((id) => (isCross(id) ? "focus" : undefined))}
      edges={planeEdges((seg) =>
        orderAt(1n, 1n).includes(seg) ? "tree" : undefined,
      )}
      rules={[
        { x: 1, label: "x = 1" },
        { x: 5, label: "x = 5" },
      ]}
      strips={[
        ...statusStrips(1n, STATUS_SLOTS),
        ...statusStrips(5n, STATUS_SLOTS),
      ]}
    />
  ),
  "walk-first": () => <Film spec={sweepFirst as unknown as PlayerSpec} />,
  "walk-second": () => <Film spec={sweepSecond as unknown as PlayerSpec} />,
};
