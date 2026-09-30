/**
 * `pointInPolygon-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 변마다의 판정값 · 높이 판정 · 뒤집기는 정본과 같은 절차를
 * 변마다 기록하는 `trace`(`-guide.proof.ts`)가 내고, `trace` 는 질의마다 정본의 답과 대조한다.
 *
 * **평면 위의 점은 「그래프」 무대(`NodeGraph`)로 그린다** — `convexHull` · `segmentsIntersect` 두 편이
 * 세운 약속 그대로다. 점의 좌표를 정점 자리로 주고, 화면은 아래로 갈수록 `y` 가 커지므로 `y` 만
 * 뒤집는다(`YMAX − y`). 다각형의 변은 굵은 실선 간선이고 화살촉이 변의 방향(앞 끝점 → 뒤 끝점)이다.
 * 반직선은 대시 간선이고, 반직선이 변과 만나는 자리는 따로 정점을 둔다. 한 칸의 픽셀은 가로 84 · 세로
 * 60 이다 — 전개 입력의 `q2 (3,3)` 과 `q3 (2,3)` 이 한 칸 떨어져 있어서, 두 편의 64 · 52 로는 정점 네모가
 * 겹친다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `pointInPolygon-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { josa, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  AT_VERTEX_OUT,
  type EdgeLog,
  edges,
  fillGrid,
  gridFacts,
  judge,
  L,
  LEFT_OUT,
  meetX,
  num,
  pt,
  Q1,
  QUOTIENT_POINT,
  QUOTIENT_POLYGON,
  quotientFacts,
  trace,
  WALK,
  walkSteps,
} from "./pointInPolygon-guide.proof.ts";
import { type Point, pointInPolygon } from "./pointInPolygon-guide.ref.ts";
import { pointWalk } from "./pointInPolygon-guide.sim.ts";

/* ── 평면 배치 ── */

const YMAX = Math.max(...L.map((v) => v[1]));

/** 평면 한 칸의 픽셀. 머리 주석의 까닭으로 두 편보다 넓다. */
const PLANE_UNIT = { x: 84, y: 60 } as const;

/** 반직선이 끝나는 `x` — 다각형의 가장 오른쪽 꼭짓점보다 한 칸 오른쪽. */
const RAY_END = Math.max(...L.map((v) => v[0])) + 1;

const same = (p: Point, q: Point) => p[0] === q[0] && p[1] === q[1];

/** 꼭짓점 번호 — `L` 의 자리. */
const vid = (p: Point): string => `v${L.findIndex((q) => same(p, q))}`;

/** 다각형의 변 여섯 — 굵은 실선, 화살촉이 변의 방향. */
function polygonEdges(
  label?: (name: string) => string | undefined,
  splits: ReadonlyMap<string, readonly { id: string; at: Point }[]> = new Map(),
): GraphEdge[] {
  return edges(L).flatMap(([name, a, b]) => {
    const cuts = [...(splits.get(name) ?? [])].sort(
      (u, v) =>
        Math.abs(u.at[0] - a[0]) +
        Math.abs(u.at[1] - a[1]) -
        (Math.abs(v.at[0] - a[0]) + Math.abs(v.at[1] - a[1])),
    );
    if (cuts.length === 0) {
      return [
        {
          from: vid(a),
          to: vid(b),
          kind: "tree" as const,
          label: label ? label(name) : name,
        },
      ];
    }
    // 반직선이 이 변과 만나는 자리에 정점을 두었으면 그 정점에서 변을 끊어 잇는다. 머리말은 그 정점이 진다.
    const chain = [vid(a), ...cuts.map((c) => c.id), vid(b)];
    return chain.slice(1).map((to, k) => ({
      from: chain[k] as string,
      to,
      kind: "tree" as const,
    }));
  });
}

/** 꼭짓점 여섯. `value` 가 있으면 이름 아래에 붙인다. */
function polygonNodes(
  value?: (p: Point) => string | undefined,
  state?: (p: Point) => CellState | undefined,
): GraphNode[] {
  return L.map((p) => ({
    id: vid(p),
    x: p[0],
    y: YMAX - p[1],
    label: pt(p),
    value: value?.(p),
    state: state?.(p),
  }));
}

/** 높이 `py` 에 대어 본 꼭짓점 — 「위」 이거나 「아래」(같은 높이는 아래로 친다). */
const aboveWord = (py: number) => (p: Point) => (p[1] > py ? "위" : "아래");

/** 교점의 `x` — 정수가 아니면 그림에 못 놓으므로 던진다(이 편의 그림은 축에 나란한 변만 쓴다). */
function meetAt(e: EdgeLog, py: number): number {
  const x = Number(meetX(e.a, e.b, py));
  if (!Number.isInteger(x)) throw new Error("교점의 x 가 정수가 아니다");
  return x;
}

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const g = gridFacts();
  const q = quotientFacts();
  return [
    {
      name: "격자 표",
      idea: "좌표 칸마다 안팎을 미리 적어 두고, 질의는 그 칸을 읽는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `L 자 ${num(g.cells)} 칸 가운데 ${num(g.same)} 칸이 정본과 같다`,
          ok: true,
        },
        {
          label: "메모리",
          value: `좌표 범위에서 칸 ${g.full.toLocaleString("en-US")} 개 · 256 MB 의 ${g.times.toLocaleString("en-US")} 배`,
          ok: false,
        },
      ],
      lesson:
        "모든 점의 답을 만들어서 커졌다 — 묻는 점 하나에서 오른쪽으로 반직선을 뻗어 변과 만나는 횟수만 세 보자",
    },
    {
      name: "반직선 교차 · 교점의 x 를 나눗셈으로",
      idea: "높이를 지나는 변마다 그 높이의 x 를 나눗셈으로 구해 점의 x 와 비교한다",
      verdict: "drop",
      checks: [
        {
          label: "값",
          value: `질의 ${num(q.points)} 개에서 나눗셈 ${num(q.arith.div)} 번 · 정수가 아닌 값 ${num(q.arith.fractional)} 개`,
          ok: false,
        },
        {
          label: "답",
          value: `좌표 상한에 붙은 배치 ${pt(QUOTIENT_POINT)} 에서 정본 ${pointInPolygon(QUOTIENT_POINT, QUOTIENT_POLYGON)} · 이 방법 true`,
          ok: false,
        },
      ],
      lesson:
        "묻는 것은 교점이 오른쪽인가 하나다 — 좌표를 구하지 않고 점이 변의 어느 쪽인지만 부호로 재 보자",
    },
    {
      name: "반직선 교차 세기",
      idea: "변마다 방향 판정의 부호와 변의 방향으로 교점이 오른쪽인지 보고, 교차할 때마다 홀짝을 뒤집는다",
      verdict: "keep",
      checks: [
        {
          label: "값",
          value: "나눗셈 0 번 · 만들어지는 값이 전부 정수",
          ok: true,
        },
        {
          label: "메모리",
          value: "홀짝 하나 — 미리 만들어 두는 것이 없다",
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차를 기록한 것에서 걸음을 만든다 ── */

/** 질의 점과 반직선 끝의 자리. 반직선 끝은 높이마다 하나다. */
const QUERY_IDS = WALK.map(([name]) => name);
const END_HEIGHTS = [...new Set(WALK.map(([, p]) => p[1]))];
const endId = (py: number) => `end${py}`;

/** 걸음 재생 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    ...L.map((p) => ({ id: vid(p), x: p[0], y: YMAX - p[1], label: pt(p) })),
    ...WALK.map(([name, p]) => ({
      id: name,
      x: p[0],
      y: YMAX - p[1],
      label: name,
    })),
    ...END_HEIGHTS.map((py) => ({
      id: endId(py),
      x: RAY_END,
      y: YMAX - py,
      label: "반직선",
    })),
  ],
  edges: [
    ...edges(L).map(([, a, b]) => ({ from: vid(a), to: vid(b) })),
    ...WALK.map(([name, p]) => ({ from: name, to: endId(p[1]) })),
  ],
  directed: true,
  unit: PLANE_UNIT,
};

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 변 하나가 이번 걸음에 한 일 — 띠와 간선 머리말에 쓴다. */
const DONE_WORD: Record<ReturnType<typeof doneOf>, string> = {
  left: "왼쪽",
  skip: "높이 밖",
  flip: "뒤집음",
  edge: "변 위",
};
function doneOf(e: EdgeLog): "left" | "skip" | "flip" | "edge" {
  return e.onEdge ? "edge" : !e.passes ? "skip" : e.flip ? "flip" : "left";
}

/** 걸음 설명 — 실행 값으로 짓는다. 값 뒤의 조사는 `tools/josa.ts` 가 값에서 고른다. */
function stepText(s: ReturnType<typeof walkSteps>[number]): string {
  const names = s.logs.map((e) => e.name).join(" · ");
  const first = s.logs[0] as EdgeLog;
  const py = s.p[1];
  const x = meetX(first.a, first.b, py) ?? "";
  if (s.did === "skip") {
    return `${names}${은는(names)} 두 끝점이 높이 ${py} 에 대어 둘 다 위이거나 둘 다 아래라 반직선의 높이를 지나지 않습니다. inside 는 그대로 ${s.after} 입니다.`;
  }
  if (s.did === "left") {
    return `${first.name}${은는(first.name)} 높이 ${py}${을를(py)} 지나는데 그 자리의 x 가 ${x}${josa(x, "이라", "라")} 점의 x ${s.p[0]} 보다 왼쪽입니다. onLeft 는 ${first.onLeft}, goesUp 은 ${first.goesUp} 로 서로 달라 inside 는 그대로 ${s.after} 입니다.`;
  }
  if (s.did === "flip") {
    return `${first.name}${은는(first.name)} 높이 ${py}${을를(py)} 지나고 그 자리의 x 가 ${x}${josa(x, "이라", "라")} 점의 오른쪽입니다. onLeft 와 goesUp 이 둘 다 ${first.onLeft} 라 inside 가 뒤집혀 ${s.after} 가 됩니다.`;
  }
  return `${first.name}${은는(first.name)} 판정값이 0 이고 점 ${pt(s.p)}${이가(s.p[1])} 좌표 칸 안이라 변 위입니다. 홀짝을 세기 전에 답이 true 로 정해지고 남은 변은 보지 않습니다.`;
}

/** 걸음 하나의 계산 알약. */
function stepCalc(s: ReturnType<typeof walkSteps>[number]): {
  expr: string;
  result: string;
} {
  const e = s.logs[0] as EdgeLog;
  if (s.did === "skip") {
    return {
      expr: s.logs
        .map((x) => `${x.name} aboveA ${x.aboveA} · aboveB ${x.aboveB}`)
        .join(" / "),
      result: "건너뛴다",
    };
  }
  if (s.did === "edge") {
    return { expr: `${e.name} d = ${e.d} · 칸 안 →`, result: "true" };
  }
  return {
    expr: `${e.name} onLeft ${e.onLeft} === goesUp ${e.goesUp} →`,
    result: e.flip ? "뒤집는다" : "그대로",
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차를 기록한 것에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  const steps = walkSteps();
  const answers: (string | null)[] = WALK.map(() => null);
  const out: SimStep[] = [];
  for (const s of steps) {
    const qi = QUERY_IDS.indexOf(s.query);
    const py = s.p[1];
    const now = new Set(s.logs.map((e) => e.name));
    const seen = trace(s.p, L).logs;
    const upto = seen.findIndex(
      (e) => e.name === (s.logs.at(-1) as EdgeLog).name,
    );
    const done = seen.slice(0, upto + 1);
    const last = s === steps.filter((x) => x.query === s.query).at(-1);
    if (last) answers[qi] = String(pointInPolygon(s.p, L));
    const endpoints = new Set(s.logs.flatMap((e) => [vid(e.a), vid(e.b)]));
    const nodes = [
      ...L.map((p) => {
        const value = aboveWord(py)(p);
        return endpoints.has(vid(p))
          ? { value, state: "read" as const }
          : { value };
      }),
      ...WALK.map(([name, p]) =>
        name === s.query
          ? { value: pt(p), state: "read" as const }
          : { state: "out" as const },
      ),
      ...END_HEIGHTS.map((h) => (h === py ? {} : { state: "out" as const })),
    ];
    const edgeSteps = [
      ...edges(L).map(([name]) => {
        if (!now.has(name)) return { kind: "tree" as const };
        const e = s.logs.find((x) => x.name === name) as EdgeLog;
        return {
          kind: "tree" as const,
          state: e.flip || e.onEdge ? ("focus" as const) : ("read" as const),
          label: `${name} ${DONE_WORD[doneOf(e)]}`,
        };
      }),
      ...WALK.map(([name]) =>
        name === s.query
          ? { kind: "back" as const, state: "read" as const }
          : { hidden: true },
      ),
    ];
    const strip = edges(L).map(([name]) => {
      const e = done.find((x) => x.name === name);
      return e ? DONE_WORD[doneOf(e)] : "";
    });
    const stripStates: Partial<Record<number, CellState>> = {};
    edges(L).forEach(([name], k) => {
      if (now.has(name)) {
        const e = s.logs.find((x) => x.name === name) as EdgeLog;
        stripStates[k] = e.flip || e.onEdge ? "focus" : "read";
      }
    });
    const answerStates: Partial<Record<number, CellState>> = {};
    if (last) answerStates[qi] = "focus";
    const crossings = done.filter((e) => e.flip).length;
    out.push({
      title: `T${s.t} ${s.query} · ${s.logs.map((e) => e.name).join(" ")} — ${
        {
          left: "왼쪽이라 그대로 둔다",
          skip: "높이 밖이라 건너뛴다",
          flip: "교차해 뒤집는다",
          edge: "변 위라 그 자리에서 참",
        }[s.did]
      }`,
      text: stepText(s),
      nodes,
      edges: edgeSteps,
      strips: [
        {
          label: `${s.query} 의 변`,
          values: strip,
          slots: edges(L).length,
          states: stripStates,
        },
        {
          label: "답",
          values: answers.map((a) => a ?? ""),
          slots: WALK.length,
          states: answerStates,
        },
      ],
      calc: stepCalc(s),
      vars: `inside ${s.did === "edge" ? "—" : String(s.after)} · 교차 수 ${crossings}`,
    });
  }
  return out;
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

/* ── 개별 그림 ── */

/** 한 점에서 뻗은 반직선 — 교차하는 자리마다 정점을 두고 조각을 잇는다. */
function rayPieces(
  tag: string,
  p: Point,
  pieceLabel: (k: number, inside: boolean) => string | undefined,
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  splits: Map<string, { id: string; at: Point }[]>;
} {
  const { logs, answer } = trace(p, L);
  const hits = logs
    .filter((e) => e.flip)
    .map((e) => ({ name: e.name, x: meetAt(e, p[1]) }))
    .sort((u, v) => u.x - v.x);
  const nodes: GraphNode[] = hits.map((h, k) => ({
    id: `${tag}x${k}`,
    x: h.x,
    y: YMAX - p[1],
    label: `${h.name} 교차`,
    value: `x = ${h.x}`,
  }));
  nodes.push({ id: `${tag}end`, x: RAY_END, y: YMAX - p[1], label: "반직선" });
  const splits = new Map<string, { id: string; at: Point }[]>();
  hits.forEach((h, k) => {
    const list = splits.get(h.name) ?? [];
    list.push({ id: `${tag}x${k}`, at: [h.x, p[1]] });
    splits.set(h.name, list);
  });
  const chain = [tag, ...hits.map((_, k) => `${tag}x${k}`), `${tag}end`];
  const out: GraphEdge[] = [];
  let inside = answer;
  for (let k = 0; k + 1 < chain.length; k++) {
    out.push({
      from: chain[k] as string,
      to: chain[k + 1] as string,
      kind: "back",
      label: pieceLabel(k, inside),
    });
    inside = !inside;
  }
  return { nodes, edges: out, splits };
}

/** 여러 반직선의 끊는 자리를 하나로 모은다. */
function mergeSplits(
  all: readonly Map<string, { id: string; at: Point }[]>[],
): Map<string, { id: string; at: Point }[]> {
  const out = new Map<string, { id: string; at: Point }[]>();
  for (const m of all) {
    for (const [k, v] of m) out.set(k, [...(out.get(k) ?? []), ...v]);
  }
  return out;
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-rays": () => {
    const shown = WALK.filter(([name]) => name !== "q3");
    const nodes: GraphNode[] = [...polygonNodes()];
    const rays = shown.map(([name, p]) => rayPieces(name, p, () => undefined));
    const lines: GraphEdge[] = [
      ...polygonEdges(undefined, mergeSplits(rays.map((r) => r.splits))),
    ];
    shown.forEach(([name, p], k) => {
      const r = judge(p, L);
      nodes.push({
        id: name,
        x: p[0],
        y: YMAX - p[1],
        label: `${name} ${pt(p)}`,
        value: `교차 ${r.flips} · ${r.answer ? "안" : "밖"}`,
        state: "read",
      });
      const ray = rays[k] as ReturnType<typeof rayPieces>;
      nodes.push(...ray.nodes);
      lines.push(...ray.edges);
    });
    return (
      <NodeGraph
        title={`L 자 다각형과 두 점의 반직선 — ${shown
          .map(([name, p]) => `${name} 교차 ${judge(p, L).flips}`)
          .join(" · ")}`}
        unit={PLANE_UNIT}
        nodes={nodes}
        edges={lines}
      />
    );
  },
  "origin-grid": () => {
    const grid = fillGrid(L);
    const nodes: GraphNode[] = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < (grid[y] as boolean[]).length; x++) {
        const p: Point = [x, y];
        const inside = (grid[y] as boolean[])[x] as boolean;
        const onEdge = judge(p, L).onEdge;
        const corner = L.some((v) => same(v, p));
        nodes.push({
          id: corner ? vid(p) : `g${x}_${y}`,
          x,
          y: YMAX - y,
          label: pt(p),
          value: !inside ? "밖" : onEdge ? "경계" : "안",
          state: inside ? undefined : "out",
        });
      }
    }
    const g = gridFacts();
    return (
      <NodeGraph
        title={`격자 표 — ${num(g.cells)} 칸마다 안팎을 미리 적는다 · 정본과 같은 칸 ${num(g.same)}`}
        unit={PLANE_UNIT}
        nodes={nodes}
        edges={polygonEdges(() => undefined)}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint="꼭짓점 10^5 개 이하 · 좌표는 절댓값 10^9 이하의 정수 · 흔한 채점 환경의 256 MB"
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-ray-q1": () => {
    const p = Q1;
    const { logs } = trace(p, L);
    const word = (name: string) => {
      const e = logs.find((x) => x.name === name) as EdgeLog;
      return `${name} ${!e.passes ? "안 지남" : e.flip ? "교차" : "왼쪽"}`;
    };
    const ray = rayPieces("q1", p, () => undefined);
    return (
      <NodeGraph
        title={`q1 ${pt(p)} 의 반직선 — 꼭짓점 아래는 높이 ${p[1]} 에 대어 본 자리`}
        unit={PLANE_UNIT}
        nodes={[
          ...polygonNodes(aboveWord(p[1])),
          { id: "q1", x: p[0], y: YMAX - p[1], label: "q1", state: "read" },
          ...ray.nodes,
        ]}
        edges={[...polygonEdges(word, ray.splits), ...ray.edges]}
      />
    );
  },
  "build-alternate": () => {
    const nodes: GraphNode[] = [...polygonNodes()];
    const rays = LEFT_OUT.map(([name, p]) =>
      rayPieces(name, p, (_, inside) => (inside ? "안" : "밖")),
    );
    const lines: GraphEdge[] = [
      ...polygonEdges(() => undefined, mergeSplits(rays.map((r) => r.splits))),
    ];
    LEFT_OUT.forEach(([name, p], k) => {
      nodes.push({
        id: name,
        x: p[0],
        y: YMAX - p[1],
        label: name,
        value: pt(p),
        state: "read",
      });
      const ray = rays[k] as ReturnType<typeof rayPieces>;
      nodes.push(...ray.nodes);
      lines.push(...ray.edges);
    });
    return (
      <NodeGraph
        title="반직선 위의 조각 — 교차할 때마다 안과 밖이 바뀐다"
        unit={PLANE_UNIT}
        nodes={nodes}
        edges={lines}
      />
    );
  },
  "build-vertex": () => {
    const p = AT_VERTEX_OUT;
    const { logs } = trace(p, L);
    const word = (name: string) => {
      const e = logs.find((x) => x.name === name) as EdgeLog;
      const low = Math.min(e.a[1], e.b[1]);
      const high = Math.max(e.a[1], e.b[1]);
      const closed = low <= p[1] && p[1] <= high;
      if (!closed) return undefined;
      return `${name} ${e.passes ? "둘 다 센다" : "닫힌 구간만 센다"}`;
    };
    return (
      <NodeGraph
        title={`점 ${pt(p)} — 높이 ${p[1]} 에 꼭짓점이 둘 있다 · 꼭짓점 아래는 그 높이에 대어 본 자리`}
        unit={PLANE_UNIT}
        nodes={[
          ...polygonNodes(aboveWord(p[1]), (v) =>
            v[1] === p[1] ? "read" : undefined,
          ),
          {
            id: "p",
            x: p[0],
            y: YMAX - p[1],
            label: pt(p),
            state: "read",
          },
          {
            id: "pend",
            x: p[0] + 1,
            y: YMAX - p[1],
            label: "반직선",
          },
        ]}
        edges={[...polygonEdges(word), { from: "p", to: "pend", kind: "back" }]}
      />
    );
  },
  "build-direction": () => {
    // 세 장면 — 같은 L 자의 변 둘을 점 셋에 대어 본다. 장면마다 좌표를 옆으로 옮겨 한 장에 놓는다.
    const scenes: { tag: string; edge: string; p: Point; name: string }[] = [
      { tag: "a", edge: "e3", p: Q1, name: "q1" },
      { tag: "b", edge: "e1", p: LEFT_OUT[0]?.[1] as Point, name: "r1" },
      { tag: "c", edge: "e1", p: Q1, name: "q1" },
    ];
    const nodes: GraphNode[] = [];
    const lines: GraphEdge[] = [];
    const groups: GraphGroup[] = [];
    let ox = 0;
    for (const sc of scenes) {
      const e = trace(sc.p, L).logs.find((x) => x.name === sc.edge) as EdgeLog;
      const xs = [e.a[0], sc.p[0]];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs) + 1;
      const at = (x: number) => ox + (x - minX);
      const ids = [`${sc.tag}a`, `${sc.tag}b`, `${sc.tag}p`, `${sc.tag}end`];
      nodes.push(
        {
          id: ids[0] as string,
          x: at(e.a[0]),
          y: YMAX - e.a[1],
          label: pt(e.a),
        },
        {
          id: ids[1] as string,
          x: at(e.b[0]),
          y: YMAX - e.b[1],
          label: pt(e.b),
        },
        {
          id: ids[2] as string,
          x: at(sc.p[0]),
          y: YMAX - sc.p[1],
          label: sc.name,
          value: pt(sc.p),
          state: "read",
        },
        {
          id: ids[3] as string,
          x: at(maxX),
          y: YMAX - sc.p[1],
          label: "반직선",
        },
      );
      lines.push(
        {
          from: ids[0] as string,
          to: ids[1] as string,
          kind: "tree",
          label: sc.edge,
          state: e.flip ? "focus" : undefined,
        },
        { from: ids[2] as string, to: ids[3] as string, kind: "back" },
      );
      groups.push({
        members: ids,
        label: `${sc.edge} ${e.goesUp ? "위로" : "아래로"} · d = ${e.d} · ${e.flip ? "뒤집는다" : "그대로"}`,
      });
      ox = at(maxX) + 1.5;
    }
    return (
      <NodeGraph
        title="판정값과 변의 방향 — onLeft 와 goesUp 가 같을 때만 교점이 점의 오른쪽이다"
        unit={PLANE_UNIT}
        nodes={nodes}
        edges={lines}
        groups={groups}
      />
    );
  },
  "walk-points": () => <Film spec={pointWalk as unknown as PlayerSpec} />,
};
