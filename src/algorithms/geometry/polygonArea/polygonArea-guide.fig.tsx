/**
 * `polygonArea-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 변마다의 항과 누적은 정본과 같은 반복을 변마다 기록하는
 * `walkLog`(`-guide.proof.ts`)가 내고, `walkLog` 는 마지막 누적을 정본의 `shoelaceTwice` 와 대조한다.
 * 귀 자르기의 삼각형은 `earClip` 이 내고, 그 넓이도 정본과 대조한다.
 *
 * **평면 위의 점은 「그래프」 무대(`NodeGraph`)로 그린다** — `convexHull` · `segmentsIntersect` ·
 * `pointInPolygon` 세 편이 세운 약속 그대로다. 점의 좌표를 정점 자리로 주고, 화면은 아래로 갈수록
 * `y` 가 커지므로 `y` 만 뒤집는다(`YMAX − y`). 다각형의 변은 굵은 실선 간선이고 화살촉이 변의
 * 방향(앞 끝점 → 뒤 끝점)이다. 원점에서 꼭짓점으로 가는 선은 대시 간선이고, 부채꼴 삼각형의 옆변이다.
 * 옆변이 다각형의 변과 한 직선 위에 겹치는 자리(원점이 꼭짓점이면 그 이웃 꼭짓점)는 그리지 않는다 —
 * 겹쳐 그리면 변 하나가 두 겹으로 보인다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps`·`layout` 은
 * 그 결과를 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `polygonArea-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { josa, 으로, 은는, 이가 } from "../../../../tools/josa.ts";
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
import type { GraphLayout, GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  area,
  bignum,
  earClip,
  edges,
  fanCounted,
  L,
  L_CW,
  L_FAR,
  MAX_N,
  num,
  PENT,
  pt,
  REVERSE_FROM,
  ring,
  seg,
  vertexFan,
  WALK_FROM,
  walkLog,
} from "./polygonArea-guide.proof.ts";
import { type Point, polygonArea } from "./polygonArea-guide.ref.ts";
import { areaReverse, areaWalk } from "./polygonArea-guide.sim.ts";

/* ── 평면 배치 ── */

const same = (p: Point, q: Point) => p[0] === q[0] && p[1] === q[1];
const isOrigin = (p: Point) => p[0] === 0 && p[1] === 0;
const ORIGIN: Point = [0, 0];

/** 전개 입력 L 자의 평면 한 칸 — 꼭짓점끼리 가장 가까운 거리가 2 칸이다. */
const WALK_UNIT = { x: 72, y: 56 } as const;
/** 옮긴 L 자의 평면 한 칸 — 원점에서 (14,14) 까지 한 장에 담는다. */
const FAR_UNIT = { x: 84, y: 60 } as const;

const nodeId = (p: Point): string => `p${p[0]}_${p[1]}`;
const ymaxOf = (points: readonly Point[]): number =>
  Math.max(...points.map((p) => p[1]));

/** 꼭짓점의 이름 — 원점과 같은 자리면 그렇게 밝힌다. */
const vertexLabel = (p: Point): string =>
  isOrigin(p) ? `${pt(p)} 원점` : pt(p);

/**
 * 원점에서 그어 그릴 옆변의 끝 — 원점이 아닌 꼭짓점 가운데, 원점과 이웃하지 않은 것. 원점이 꼭짓점이면
 * 그 이웃으로 가는 옆변은 다각형의 변과 겹친다.
 */
function spokeEnds(polygon: Point[]): Point[] {
  const at = polygon.findIndex(isOrigin);
  const n = polygon.length;
  return polygon.filter((p, k) => {
    if (isOrigin(p)) return false;
    if (at < 0) return true;
    return k !== (at + 1) % n && k !== (at + n - 1) % n;
  });
}

/** 다각형 · 원점 · 옆변의 자리 — 패널(`layout`)과 정적 그림이 같이 쓴다. */
function planeLayout(
  polygon: Point[],
  unit: { x: number; y: number },
): GraphLayout {
  const ymax = ymaxOf([...polygon, ORIGIN]);
  const nodes = polygon.map((p) => ({
    id: nodeId(p),
    x: p[0],
    y: ymax - p[1],
    label: vertexLabel(p),
  }));
  if (!polygon.some(isOrigin)) {
    nodes.push({ id: nodeId(ORIGIN), x: 0, y: ymax, label: "(0,0) 원점" });
  }
  return {
    nodes,
    edges: [
      ...edges(polygon).map(([, a, b]) => ({ from: nodeId(a), to: nodeId(b) })),
      ...spokeEnds(polygon).map((p) => ({
        from: nodeId(ORIGIN),
        to: nodeId(p),
      })),
    ],
    directed: true,
    unit,
  };
}

/** 패널 둘의 자리. `.sim.ts` 의 `layout` 이 이것과 같은지 가이드 시험이 잰다. */
export const WALK_LAYOUT = planeLayout(L, WALK_UNIT);
export const REVERSE_LAYOUT = planeLayout(L_CW, WALK_UNIT);

/* ── 걸음 재생 패널 — 정본과 같은 반복을 기록한 것에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 변 하나를 더하는 걸음의 설명 — 실행 값으로 짓는다. 값 뒤의 조사는 `tools/josa.ts` 가 값에서 고른다. */
function edgeText(s: ReturnType<typeof walkLog>[number]): string {
  const t = bignum(s.t);
  const head = `${s.name}${은는(s.name)} ${seg(s.a, s.b)} 입니다.`;
  if (s.t === 0n) {
    return `${head} 원점과 두 끝점이 한 직선 위라 삼각형이 납작해서 항이 0 이고, twice 는 그대로 ${bignum(s.after)} 입니다.`;
  }
  const way = s.t > 0n ? "반시계" : "시계";
  return `${head} 원점에서 두 끝점을 ${way} 방향으로 읽는 삼각형이라 항이 ${t}${이가(t)} 되고, twice 가 ${bignum(s.before)} 에서 ${bignum(s.after)}${으로(bignum(s.after))} 바뀝니다.`;
}

/** 패널 하나의 걸음 — 변마다 한 걸음, 반복문이 끝난 뒤 한 걸음. */
function panelSteps(polygon: Point[], from: number): SimStep[] {
  const log = walkLog(polygon);
  const spokes = spokeEnds(polygon);
  const out: SimStep[] = [];
  const termStrip = (upto: number, now: number | null) => ({
    label: "항 t",
    values: log.map((s, k) => (k <= upto ? bignum(s.t) : "")),
    slots: log.length,
    states: now === null ? {} : { [now]: "focus" as CellState },
  });
  const sumStrip = (upto: number, now: number | null) => ({
    label: "twice",
    values: log.map((s, k) => (k <= upto ? bignum(s.after) : "")),
    slots: log.length,
    states: now === null ? {} : { [now]: "focus" as CellState },
  });
  for (const [k, s] of log.entries()) {
    const ends = new Set([nodeId(s.a), nodeId(s.b)]);
    out.push({
      title: `T${from + k} ${s.name} ${seg(s.a, s.b)} — 항 ${bignum(s.t)}`,
      text: edgeText(s),
      nodes: WALK_LAYOUT_OF(polygon).nodes.map((n) =>
        ends.has(String(n.id)) || n.id === nodeId(ORIGIN)
          ? { state: "read" as const }
          : {},
      ),
      edges: [
        ...log.map((e, j) =>
          j < k
            ? { kind: "tree" as const, label: `${e.name} ${bignum(e.t)}` }
            : j === k
              ? {
                  kind: "tree" as const,
                  state: "focus" as const,
                  label: `${e.name} t = ${bignum(e.t)}`,
                }
              : { kind: "tree" as const, state: "out" as const, label: e.name },
        ),
        ...spokes.map((p) =>
          s.t !== 0n && (same(p, s.a) || same(p, s.b))
            ? { kind: "back" as const, state: "read" as const }
            : { hidden: true },
        ),
      ],
      strips: [termStrip(k, k), sumStrip(k, k)],
      calc: {
        expr: `${s.a[0]}·${s.b[1]} − ${s.b[0]}·${s.a[1]} =`,
        result: bignum(s.t),
      },
      vars: `twice ${bignum(s.before)} → ${bignum(s.after)}`,
    });
  }
  const twice = (log.at(-1) as (typeof log)[number]).after;
  const size = twice < 0n ? -twice : twice;
  const answer = area(polygonArea(polygon));
  const last = log.length - 1;
  out.push({
    title: `T${from + log.length} 반복문이 끝났다 — 답 ${answer}`,
    text: `twice < 0n 이 ${twice < 0n ? "참이라 부호를 뒤집어" : "거짓이라 그대로 두어"} size 가 ${bignum(size)}${이가(bignum(size))} 되고, 배정밀도로 옮겨 2 로 나눈 ${answer}${josa(answer, "이", "가")} 답입니다.`,
    nodes: WALK_LAYOUT_OF(polygon).nodes.map(() => ({})),
    edges: [
      ...log.map((e) => ({
        kind: "tree" as const,
        label: `${e.name} ${bignum(e.t)}`,
      })),
      ...spokes.map(() => ({ hidden: true })),
    ],
    strips: [termStrip(last, null), sumStrip(last, last)],
    calc: { expr: `|${bignum(twice)}| / 2 =`, result: answer },
    vars: `size ${bignum(size)}`,
  });
  return out;
}

function WALK_LAYOUT_OF(polygon: Point[]): GraphLayout {
  return polygon === L ? WALK_LAYOUT : REVERSE_LAYOUT;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 앞으로 읽는 L 자(T1~T7)와 뒤집은 L 자(T8~T14). `.sim.ts` 의 `steps`
 * 는 이 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): { walk: SimStep[]; reverse: SimStep[] } {
  return {
    walk: panelSteps(L, WALK_FROM),
    reverse: panelSteps(L_CW, REVERSE_FROM),
  };
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

/* ── 정적 그림 ── */

/** 다각형 하나와 원점 부채꼴 — 변 머리말에 항을 적고, 옆변은 대시로. */
function fanPicture(
  polygon: Point[],
  unit: { x: number; y: number },
  title: string,
) {
  const layout = planeLayout(polygon, unit);
  const log = walkLog(polygon);
  const nodes: GraphNode[] = layout.nodes.map((n) => ({ ...n }));
  const lines: GraphEdge[] = [
    ...log.map((s) => ({
      from: nodeId(s.a),
      to: nodeId(s.b),
      kind: "tree" as const,
      state: s.t < 0n ? ("focus" as const) : undefined,
      label: `${s.name} ${bignum(s.t)}`,
    })),
    ...spokeEnds(polygon).map((p) => ({
      from: nodeId(ORIGIN),
      to: nodeId(p),
      kind: "back" as const,
    })),
  ];
  return <NodeGraph title={title} unit={unit} nodes={nodes} edges={lines} />;
}

/** 시도 셋 — 수치는 실행에서. */
function approaches(): Approach[] {
  const ear = earClip(ring(1_024, 1000));
  const estimate = ear.ops * (MAX_N / 1_024) ** 2;
  const unsigned =
    Number(
      vertexFan(PENT).reduce(
        (s, f) => s + (f.signed < 0n ? -f.signed : f.signed),
        0n,
      ),
    ) / 2;
  const fan = fanCounted(ring(1_024, 1000), ring(1_024, 1000)[0] as Point);
  return [
    {
      name: "귀 자르기",
      idea: "다른 꼭짓점을 품지 않은 삼각형을 하나씩 떼어 넓이를 더한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "L 자 · 볼록 다각형 모두 정본과 같다", ok: true },
        {
          label: "시간",
          value: `꼭짓점 ${num(MAX_N)} 개에 기본 연산 어림 ${estimate.toExponential(2)} 번`,
          ok: false,
        },
      ],
      lesson:
        "삼각형이 다각형 안에 있어야 해서 비었는지 확인하느라 느렸다 — 한 꼭짓점에서 부채꼴로 가르면 확인이 없다",
    },
    {
      name: "첫 꼭짓점 부채꼴 · 넓이만 더하기",
      idea: "첫 꼭짓점과 이웃한 꼭짓점 둘로 삼각형을 만들어 넓이를 더한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `오목 오각형에서 ${area(unsigned)} · 정본 ${area(polygonArea(PENT))}`,
          ok: false,
        },
      ],
      lesson:
        "다각형 밖으로 나간 삼각형까지 넓이로 더했다 — 그 삼각형은 거꾸로 읽히니 부호를 살려 보자",
    },
    {
      name: "부호 있는 부채꼴",
      idea: "삼각형마다 읽는 방향에 따라 부호를 붙여 더하고, 끝에 한 번 절댓값을 취한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "오목 오각형에서도 정본과 같다", ok: true },
        {
          label: "시간",
          value: `꼭짓점 ${num(1_024)} 개에 기본 연산 ${num(fan.ops)} 번 · 변 수에 비례`,
          ok: true,
        },
      ],
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-fan": () =>
    fanPicture(
      L,
      WALK_UNIT,
      `L 자 여섯 변과 원점 부채꼴 — 변 머리말은 그 변의 항 · 합 ${bignum(walkLog(L).at(-1)?.after ?? 0n)}`,
    ),
  "origin-ears": () => {
    const r = earClip(L);
    const layout = planeLayout(L, WALK_UNIT);
    const cuts: GraphEdge[] = r.ears.slice(0, -1).map(([p, , q], k) => ({
      from: nodeId(p),
      to: nodeId(q),
      kind: "back" as const,
      label: `귀 ${k + 1}`,
    }));
    return (
      <NodeGraph
        title={`귀 자르기 — L 자를 삼각형 ${r.ears.length} 개로 떼어 낸다 · 확인한 꼭짓점 ${r.checks} 개`}
        unit={WALK_UNIT}
        nodes={layout.nodes.map((n) => ({
          ...n,
          label: pt([n.x, ymaxOf(L) - n.y]),
        }))}
        edges={[
          ...edges(L).map(([name, a, b]) => ({
            from: nodeId(a),
            to: nodeId(b),
            kind: "tree" as const,
            label: name,
          })),
          ...cuts,
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint="꼭짓점 10^5 개 이하 · 좌표는 절댓값 10^9 이하의 정수 · 흔한 채점 환경의 1 초(초당 기본 연산 1 억 번)"
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-fan-far": () =>
    fanPicture(
      L_FAR,
      FAR_UNIT,
      `L 자를 (10,10) 만큼 옮긴 다각형과 원점 부채꼴 — 음의 항 ${walkLog(L_FAR).filter((s) => s.t < 0n).length} 개는 강조선 · 합 ${bignum(walkLog(L_FAR).at(-1)?.after ?? 0n)}`,
    ),
  "walk-area": () => <Film spec={areaWalk as unknown as PlayerSpec} />,
  "walk-reverse": () => <Film spec={areaReverse as unknown as PlayerSpec} />,
};
