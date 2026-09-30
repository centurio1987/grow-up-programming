/**
 * `rotatingCalipersDiameter-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 껍질 · 변마다의 far · 대척점 쌍 · 제곱 거리는 정본과 같은
 * 절차를 걸음마다 기록한 사본(`-guide.proof.ts` 의 `WALK_RUN`)이 낸 것이고, 그 기록의 답은 증명
 * 사이드카가 읽힐 때 정본과 맞대어 확인된다.
 *
 * **평면 위의 점은 「그래프」 무대(`NodeGraph`)로 그린다** — 볼록 껍질 편(`convexHull`)의 약속을 잇는다.
 * 점의 좌표를 그대로 정점 자리로 주고, 화면은 아래로 갈수록 `y` 가 커지므로 `y` 만 뒤집는다(`YMAX − y`).
 * 껍질의 변은 가는 실선, 대척점 쌍은 대시 간선, 변에 대는 지지선과 그 반대편의 평행한 지지선은 기울어진
 * 기준선(`lines`)이다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `rotatingCalipersDiameter-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { josa, 과와, 은는, 을를 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphEdge,
  type GraphLine,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  area2,
  diameterPair,
  type EdgeStep,
  edgeName,
  hn,
  LIMIT,
  ladderValues,
  num,
  PER_SECOND,
  pairName,
  pt,
  seconds,
  WALK,
  WALK_RUN,
} from "./rotatingCalipersDiameter-guide.proof.ts";
import type { Point } from "./rotatingCalipersDiameter-guide.ref.ts";
import { calipersWalk } from "./rotatingCalipersDiameter-guide.sim.ts";

/* ── 평면 배치 ── */

const { hull: HULL, k: K, edges: EDGES } = WALK_RUN;

const YMAX = Math.max(...WALK.map((p) => p[1]));

/** 평면 한 칸의 픽셀 — 좌표 1 이 가로 · 세로 72. 가로세로를 같게 두어야 수직과 거리가 그림에서도 맞다. */
const PLANE_UNIT = { x: 72, y: 72 } as const;

const same = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1];

/** 입력 점의 껍질 첨자 — 안쪽 점이면 -1. */
const hullIndex = (p: Point): number => HULL.findIndex((q) => same(p, q));

/** 껍질 첨자의 정점 번호 — 입력 목록의 자리. */
const nodeOf = (h: number): number =>
  WALK.findIndex((p) => same(p, HULL[h] as Point));

/** 정점 이름 — 껍질 꼭짓점은 첨자와 좌표, 안쪽 점은 좌표만. */
const labelOf = (p: Point): string => {
  const h = hullIndex(p);
  return h < 0 ? pt(p) : `${hn(h)} ${pt(p)}`;
};

/** 대척점 쌍 — 기록에 처음 나온 차례로. 걸음 재생 패널의 간선 자리다. */
function antipodalPairs(): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const e of EDGES) {
    for (const x of [e.i, (e.i + 1) % K]) {
      const key = pairName(x, e.far);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([x, e.far]);
    }
  }
  return out;
}

const PAIRS = antipodalPairs();

/** 껍질의 변 — 첨자 차례로. */
const HULL_EDGES: [number, number][] = HULL.map((_, i) => [i, (i + 1) % K]);

/** 걸음 재생 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. 변 여섯 다음에 대척점 쌍 일곱. */
export const LAYOUT = {
  nodes: WALK.map((p, id) => ({
    id,
    x: p[0],
    y: YMAX - p[1],
    label: labelOf(p),
  })),
  edges: [...HULL_EDGES, ...PAIRS].map(([from, to]) => ({
    from: nodeOf(from),
    to: nodeOf(to),
  })),
  directed: false,
  unit: PLANE_UNIT,
};

/** 평면 위의 점 — 정점 자리는 좌표 그대로. */
const planeNodes = (
  value: (p: Point) => string | undefined,
  state: (p: Point) => CellState | undefined,
): GraphNode[] =>
  WALK.map((p, id) => ({
    id,
    x: p[0],
    y: YMAX - p[1],
    label: labelOf(p),
    value: value(p),
    state: state(p),
  }));

/** 안쪽 점은 흐리게 — 껍질을 세운 뒤로는 후보가 아니다. */
const innerOut = (p: Point): CellState | undefined =>
  hullIndex(p) < 0 ? "out" : undefined;

/** 격자 점 하나와 방향 하나 — `y` 를 뒤집어 기울어진 기준선으로. */
const lineThrough = (p: Point, dir: Point, label?: string): GraphLine => ({
  x: p[0],
  y: YMAX - p[1],
  dx: dir[0],
  dy: -dir[1],
  ...(label ? { label } : {}),
});

/** 변 `i` 에 대는 지지선과 그 반대편 far 를 지나는 평행한 지지선. */
const calipers = (e: EdgeStep): GraphLine[] => {
  const dir: Point = [e.b[0] - e.a[0], e.b[1] - e.a[1]];
  return [
    lineThrough(e.a, dir, `변 ${edgeName(e.i, K)} 의 지지선`),
    lineThrough(e.f, dir, `${hn(e.far)} 의 지지선`),
  ];
};

/** 껍질의 변과 대척점 쌍을 한 목록으로 — `LAYOUT.edges` 의 차례와 같다. */
const sceneEdges = (
  hullEdge: (i: number) => Partial<GraphEdge> | null,
  pair: (x: number, y: number) => Partial<GraphEdge> | null,
): GraphEdge[] => {
  const out: GraphEdge[] = [];
  HULL_EDGES.forEach(([x, y], i) => {
    const got = hullEdge(i);
    if (got !== null)
      out.push({ kind: "plain", ...got, from: nodeOf(x), to: nodeOf(y) });
  });
  for (const [x, y] of PAIRS) {
    const got = pair(x, y);
    if (got !== null)
      out.push({ kind: "back", ...got, from: nodeOf(x), to: nodeOf(y) });
  }
  return out;
};

/* ── 걸음 재생 패널 — 기록 한 줄을 무대 한 장으로 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const hidden = { hidden: true } as const;

/** 변 하나의 걸음 — 이번 변 · 넓이 · far · 대척점 쌍 둘 · 지지선 둘. */
function edgeStage(e: EdgeStep): GraphStep {
  const ai = e.i;
  const bi = (e.i + 1) % K;
  const passed = new Set(e.tests.map((t) => t.c));
  const done = new Set(
    EDGES.filter((x) => x.i < e.i).flatMap((x) => [
      pairName(x.i, x.far),
      pairName((x.i + 1) % K, x.far),
    ]),
  );
  const now = new Map([
    [pairName(ai, e.far), e.d1],
    [pairName(bi, e.far), e.d2],
  ]);
  return {
    nodes: WALK.map((p) => {
      const h = hullIndex(p);
      if (h < 0) return { state: "out" as const };
      const value = `넓이 ${num(area2(e.a, e.b, p))}`;
      if (h === e.far) return { value, state: "focus" as const };
      if (h === ai || h === bi || passed.has(h))
        return { value, state: "read" as const };
      return { value };
    }),
    edges: [
      ...HULL_EDGES.map((_, i) =>
        i === e.i ? { state: "focus" as const } : {},
      ),
      ...PAIRS.map(([x, y]) => {
        const key = pairName(x, y);
        const d = now.get(key);
        if (d !== undefined)
          return {
            kind: "back" as const,
            state: "read" as const,
            label: num(d),
          };
        return done.has(key) ? { kind: "back" as const } : hidden;
      }),
    ],
    lines: calipers(e),
    calc: {
      expr: `max(${num(e.bestBefore)}, ${num(e.d1)}, ${num(e.d2)}) =`,
      result: num(e.best),
    },
    vars: `전진 ${num(e.tests.length - 1)} 회`,
  };
}

/** 첫 걸음 — 껍질을 세우고 far 를 1 에 둔다. */
function hullStage(): GraphStep {
  return {
    nodes: WALK.map((p) => {
      const h = hullIndex(p);
      if (h < 0) return { state: "out" as const };
      return h === 1
        ? { value: "far", state: "focus" as const }
        : { state: "focus" as const };
    }),
    edges: [
      ...HULL_EDGES.map(() => ({ state: "focus" as const })),
      ...PAIRS.map(() => hidden),
    ],
    lines: [],
    calc: { expr: "k =", result: num(K) },
    vars: "best 0",
  };
}

/** 마지막 걸음 — 반복이 끝나 best 를 배정밀도로 옮겨 낸다. */
function returnStage(): GraphStep {
  const [x, y] = diameterPair(HULL);
  const answer = pairName(x, y);
  return {
    nodes: WALK.map((p) => {
      const h = hullIndex(p);
      if (h < 0) return { state: "out" as const };
      return h === x || h === y ? { state: "focus" as const } : {};
    }),
    edges: [
      ...HULL_EDGES.map(() => ({})),
      ...PAIRS.map(([a, b]) =>
        pairName(a, b) === answer
          ? {
              kind: "back" as const,
              state: "focus" as const,
              label: num(WALK_RUN.best),
            }
          : { kind: "back" as const },
      ),
    ],
    lines: [],
    calc: {
      expr: `Number(${num(WALK_RUN.best)}n) =`,
      result: num(WALK_RUN.best),
    },
    vars: null,
  };
}

/** 걸음 제목의 뒤쪽. */
function titleOf(e: EdgeStep): string {
  return `변 ${edgeName(e.i, K)} · far ${hn(e.far)}`;
}

/** 걸음 설명 한두 문장 — 기록의 값에서 만든다. */
function textOf(e: EdgeStep): string {
  const adv = e.tests.length - 1;
  const move =
    adv === 0
      ? `다음 꼭짓점이 더 멀지 않아 far 가 ${hn(e.far)} 에 그대로 있습니다.`
      : `넓이가 늘어나는 동안 far 가 ${hn(e.before)} 에서 ${hn(e.far)} 까지 ${num(adv)} 칸 전진합니다.`;
  return `${move} 변의 두 끝과 짝지은 대척점 쌍 둘의 제곱 거리는 ${num(e.d1)} · ${num(e.d2)}${josa(num(e.d2), "이고", "고")}, best 는 ${num(e.best)} 입니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  const first: SimStep = {
    title: "T1 껍질을 세운다",
    text: `점 ${num(WALK.length)} 개에서 볼록 껍질을 세우면 꼭짓점이 ${num(K)} 개 남고, 안쪽 점 둘은 흐리게 그렸습니다. 첫 변을 보기 전 far 는 ${hn(1)} 입니다.`,
    ...hullStage(),
  };
  const mid: SimStep[] = EDGES.map((e) => ({
    title: `${e.tag} ${titleOf(e)}`,
    text: textOf(e),
    ...edgeStage(e),
  }));
  const [x, y] = diameterPair(HULL);
  const last: SimStep = {
    title: `T${K + 2} best 를 낸다`,
    text: `변 ${num(K)} 개를 다 봤습니다. best ${num(WALK_RUN.best)}${은는(num(WALK_RUN.best))} 대척점 쌍 ${pairName(x, y)} 의 제곱 거리이고, 배정밀도로 옮겨 그대로 돌려줍니다.`,
    ...returnStage(),
  };
  return [first, ...mid, last];
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. `pick` 을 주면 그 걸음만. */
function Film({
  spec,
  pick,
  title,
}: {
  spec: PlayerSpec;
  pick?: readonly string[];
  title?: string;
}) {
  const frames = playerFrames(spec).filter(
    (f) => pick === undefined || pick.includes(f.id),
  );
  return (
    <NodeGraphFilm
      title={title ?? spec.title}
      frames={frames.map((f) => ({
        id: f.id,
        text: f.calc ? `${f.title} · ${f.calc.expr} ${f.calc.result}` : f.title,
        scene: f.scene ?? { nodes: [], edges: [] },
      }))}
    />
  );
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const v = ladderValues();
  return [
    {
      name: "모든 쌍 재기",
      idea: "점 쌍을 하나도 거르지 않고 전부 재서 가장 큰 제곱 거리를 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(LIMIT)} 에서 기본 연산 ${num(v.brute)} 번 · ${seconds(v.brute)}`,
          ok: false,
        },
      ],
      lesson: "껍질 안쪽 점이 낀 쌍은 답이 될 수 없다 — 껍질 꼭짓점만 남기자",
    },
    {
      name: "껍질 꼭짓점 쌍만 재기",
      idea: "볼록 껍질을 세운 뒤 껍질 꼭짓점 쌍을 전부 잰다",
      verdict: "drop",
      checks: [
        {
          label: "흩어진 점",
          value: `껍질 꼭짓점 ${num(v.mScatter)} 개 · ${seconds(v.hullScatter)}`,
          ok: true,
        },
        {
          label: "원 위의 점",
          value: `모든 점이 껍질 꼭짓점 — 기본 연산 ${num(v.hullCircle)} 번 · ${seconds(v.hullCircle)}`,
          ok: false,
        },
      ],
      lesson:
        "지름은 평행한 두 지지선 위의 쌍이다 — 변마다 가장 먼 꼭짓점만 짝지으면 된다",
    },
    {
      name: "변마다 가장 먼 꼭짓점을 처음부터 찾기",
      idea: "변마다 다음 꼭짓점에서 출발해 넓이가 늘어나는 동안 far 를 전진시킨다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "원 위의 점",
          value: `기본 연산 ${num(v.resetCircle)} 번 · ${seconds(v.resetCircle)}`,
          ok: false,
        },
      ],
      lesson:
        "변이 한 칸 갈 때 가장 먼 꼭짓점은 앞으로만 간다 — far 를 되돌리지 말자",
    },
    {
      name: "회전하는 캘리퍼스",
      idea: "far 를 반복 바깥에 두고 변을 따라 앞으로만 보내며 대척점 쌍 둘씩 잰다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `원 위의 점 ${num(v.calCircle)} 번 · 흩어진 점 ${num(v.calScatter)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-calipers": () => {
    const [x, y] = diameterPair(HULL);
    const at = EDGES.find(
      (e) =>
        (e.far === x || e.far === y) && pairName(e.i, e.far) === pairName(x, y),
    ) as EdgeStep;
    return (
      <NodeGraph
        title={`전개 입력 여덟 점의 볼록 껍질 — 변 ${edgeName(at.i, K)}${과와(edgeName(at.i, K))} ${hn(at.far)} 에 댄 평행한 두 지지선, 지름인 대척점 쌍 ${pairName(x, y)}`}
        directed={false}
        unit={PLANE_UNIT}
        nodes={planeNodes(
          () => undefined,
          (p) => {
            const h = hullIndex(p);
            return h === x || h === y ? "focus" : innerOut(p);
          },
        )}
        edges={sceneEdges(
          () => ({}),
          (a, b) =>
            pairName(a, b) === pairName(x, y)
              ? { state: "focus", label: num(WALK_RUN.best) }
              : null,
        )}
        lines={calipers(at)}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`점 n = ${num(LIMIT)} · 좌표는 절댓값 10^9 이하의 정수 · 기본 연산 1 초에 ${num(PER_SECOND)} 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-antipodal": () => {
    const [x, y] = diameterPair(HULL);
    const d = new Map<string, bigint>();
    for (const e of EDGES) {
      d.set(pairName(e.i, e.far), e.d1);
      d.set(pairName((e.i + 1) % K, e.far), e.d2);
    }
    return (
      <NodeGraph
        title={`전개 입력의 대척점 쌍 ${num(PAIRS.length)} 개 — 간선 위 수는 그 쌍의 제곱 거리`}
        directed={false}
        unit={PLANE_UNIT}
        nodes={planeNodes(() => undefined, innerOut)}
        edges={sceneEdges(
          () => ({}),
          (a, b) => ({
            label: num(d.get(pairName(a, b)) ?? 0n),
            ...(pairName(a, b) === pairName(x, y)
              ? { state: "focus" as const }
              : {}),
          }),
        )}
      />
    );
  },
  "build-read": () => {
    const e = EDGES[0] as EdgeStep;
    const bi = (e.i + 1) % K;
    return (
      <NodeGraph
        title={`변 ${edgeName(e.i, K)} 에서 넓이를 읽는다 — 가장 큰 ${hn(e.far)} 에 평행한 지지선이 지나고, 대척점 쌍은 ${pairName(e.i, e.far)} · ${pairName(bi, e.far)}`}
        directed={false}
        unit={PLANE_UNIT}
        nodes={planeNodes(
          (p) =>
            hullIndex(p) < 0 ? undefined : `넓이 ${num(area2(e.a, e.b, p))}`,
          (p) => {
            const h = hullIndex(p);
            if (h === e.far) return "focus";
            if (h === e.i || h === bi) return "read";
            return innerOut(p);
          },
        )}
        edges={sceneEdges(
          (i) => (i === e.i ? { state: "focus" } : {}),
          (a, b) => {
            const key = pairName(a, b);
            if (key === pairName(e.i, e.far))
              return { state: "read", label: num(e.d1) };
            if (key === pairName(bi, e.far))
              return { state: "read", label: num(e.d2) };
            return null;
          },
        )}
        lines={calipers(e)}
      />
    );
  },
  "build-why": () => {
    const [x, y] = diameterPair(HULL);
    const a = HULL[x] as Point;
    const b = HULL[y] as Point;
    const dir: Point = [b[0] - a[0], b[1] - a[1]];
    const normal: Point = [-dir[1], dir[0]];
    const proj = (p: Point): bigint =>
      BigInt(p[0] - a[0]) * BigInt(dir[0]) +
      BigInt(p[1] - a[1]) * BigInt(dir[1]);
    return (
      <NodeGraph
        title={`지름 ${pairName(x, y)} 에 수직인 두 직선 — 점 아래 수는 ${hn(x)} 에서 잰 ${hn(x)}→${hn(y)} 방향의 성분`}
        directed={false}
        unit={PLANE_UNIT}
        nodes={planeNodes(
          (p) => `성분 ${num(proj(p))}`,
          (p) => {
            const h = hullIndex(p);
            return h === x || h === y ? "focus" : innerOut(p);
          },
        )}
        edges={sceneEdges(
          () => ({}),
          (p, q) =>
            pairName(p, q) === pairName(x, y)
              ? { state: "focus", label: num(WALK_RUN.best) }
              : null,
        )}
        lines={[
          lineThrough(a, normal, `${hn(x)}${을를(hn(x))} 지나는 수직선`),
          lineThrough(b, normal, `${hn(y)}${을를(hn(y))} 지나는 수직선`),
        ]}
      />
    );
  },
  "build-advance-film": () => (
    <Film
      spec={calipersWalk as unknown as PlayerSpec}
      pick={["T2", "T3"]}
      title="far 를 이어 보내는 두 걸음 — 세 칸 전진하는 변과 한 칸도 안 가는 변"
    />
  ),
  "walk-calipers": () => <Film spec={calipersWalk as unknown as PlayerSpec} />,
};
