/**
 * `convexHull-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 답은 정본(`-guide.ref.ts`)이 낸 것이고, 두 사슬이 걸음마다
 * 담고 걷어낸 점과 방향 판정값은 정본과 같은 절차를 걸음마다 기록한 사본(`-guide.proof.ts` 의
 * `chainEvents`)이 낸다. 그 기록을 이은 것이 정본의 답과 같은지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * **평면 위의 점은 「그래프」 무대(`NodeGraph`)로 그린다.** 그 패턴은 정점 자리를 격자 좌표로 받으므로,
 * 점의 좌표를 그대로 정점 자리로 준다 — 화면은 아래로 갈수록 `y` 가 커지므로 `y` 만 뒤집는다(`YMAX − y`).
 * 껍질의 변과 사슬의 이음은 간선이고, 사슬(스택)은 무대 아래 띠다. 띠는 바닥이 왼쪽이고 칸 수는 전개에서
 * 사슬이 가장 길었을 때로 고정하며, 담은 칸은 새로 씀 · 비교한 끝 두 칸은 읽음으로 그린다(방향 그래프 편들과
 * `nextGreaterElement` 의 스택 띠 약속).
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `convexHull-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { josa, 을를, 이가 } from "../../../../tools/josa.ts";
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
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  costOf,
  HULL,
  LIMIT,
  LOWER,
  list,
  num,
  type Push,
  pt,
  roleOf,
  scattered,
  sortByAngle,
  tail,
  UPPER,
  WALK,
  WALK_UNIQ,
} from "./convexHull-guide.proof.ts";
import { type Point, sideOf } from "./convexHull-guide.ref.ts";
import { walkLower, walkUpper } from "./convexHull-guide.sim.ts";

/* ── 평면 배치 ── */

const YMAX = Math.max(...WALK_UNIQ.map((p) => p[1]));

/** 점의 번호 — 좌표 순서로 정렬해 합친 목록의 자리. */
const idOf = (p: Point): number =>
  WALK_UNIQ.findIndex((q) => q[0] === p[0] && q[1] === p[1]);

/** 이웃한 두 점의 간선 목록 — 사슬이나 꺾은선의 이음. */
const links = (ps: readonly Point[]): [number, number][] =>
  ps.slice(1).map((p, k) => [idOf(ps[k] as Point), idOf(p)]);

/** 껍질 한 바퀴의 변. */
const HULL_EDGES: [number, number][] = HULL.map((p, k) => [
  idOf(p),
  idOf(HULL[(k + 1) % HULL.length] as Point),
]);

const LOWER_CHAIN = (LOWER.at(-1) as Push).after;
const UPPER_CHAIN = (UPPER.at(-1) as Push).after;

/** 평면 한 칸의 픽셀 — 좌표 1 이 가로 64 · 세로 52. */
const PLANE_UNIT = { x: 64, y: 52 } as const;

/** 두 사슬이 한 번이라도 이은 점 쌍 — 걸음 재생 패널의 간선 자리. 처음 생긴 차례로. */
function chainEdges(): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const e of [...LOWER, ...UPPER]) {
    for (const [a, b] of links(e.after)) {
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([a, b]);
    }
  }
  return out;
}

/** 걸음 재생 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: WALK_UNIQ.map((p, id) => ({
    id,
    x: p[0],
    y: YMAX - p[1],
    label: pt(p),
  })),
  edges: chainEdges().map(([from, to]) => ({ from, to })),
  directed: true,
  unit: PLANE_UNIT,
};

/** 평면 위의 점 — 정점 자리는 좌표 그대로. */
const planeNodes = (
  value: (p: Point) => string | undefined,
  state: (p: Point) => CellState | undefined = () => undefined,
): GraphNode[] =>
  WALK_UNIQ.map((p, id) => ({
    id,
    x: p[0],
    y: YMAX - p[1],
    label: pt(p),
    value: value(p),
    state: state(p),
  }));

const isHull = (p: Point) => HULL.some((q) => q[0] === p[0] && q[1] === p[1]);

/** 껍질에서의 자리를 정점 값 한 줄로. */
const roleShort = (p: Point): string => {
  const role = roleOf(p, HULL);
  return role === "꼭짓점" ? "꼭짓점" : role === "껍질 안쪽" ? "안쪽" : "변 위";
};

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행과 식에서 ── */

const PER_SECOND = 100_000_000;

function approaches(): Approach[] {
  const cube = LIMIT * (LIMIT - 1) * (LIMIT - 2);
  const days = Math.round(cube / PER_SECOND / 86_400);
  const big = costOf(scattered(LIMIT));
  const oneChainMissing = HULL.filter(
    (p) => !LOWER_CHAIN.some((q) => q[0] === p[0] && q[1] === p[1]),
  );
  const angleTests = sortByAngle(scattered(LIMIT)).tests;
  return [
    {
      name: "점 쌍마다 나머지 전부 확인",
      idea: "두 점을 이은 직선의 한쪽에 나머지 점이 전부 있으면 그 두 점을 껍질의 변으로 잡는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value:
            "변 위의 공선 중간 점까지 섞인다 — 꼭짓점만 남길 규칙이 더 든다",
          ok: false,
        },
        {
          label: "시간",
          value: `m = ${num(LIMIT)} 에서 방향 판정 ${num(cube)} 번 · ${num(days)} 일`,
          ok: false,
        },
      ],
      lesson: "점을 어떤 순서로 늘어놓으면 확인할 후보가 줄지 않을까",
    },
    {
      name: "기준점에서 본 각도로 정렬해 한 바퀴",
      idea: "가장 아래 점에서 본 각도 순서로 점을 늘어놓고 한 바퀴 돌며 오른쪽으로 꺾는 점을 뺀다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "정렬",
          value: `비교마다 방향 판정이 붙는다 — 점 ${num(LIMIT)} 개에서 정렬에만 ${num(angleTests)} 번`,
          ok: false,
        },
      ],
      lesson: "방향 판정 없이 좌표만 비교해서 순서를 정할 수 없을까",
    },
    {
      name: "좌표 순서로 정렬해 사슬 하나",
      idea: "x 를 먼저, 같으면 y 로 정렬하고 왼쪽에서 오른쪽으로 한 번 차례로 읽으며 왼쪽으로 안 꺾이는 점을 뺀다",
      verdict: "drop",
      checks: [
        { label: "정렬", value: "좌표 비교만 — 방향 판정 0 번", ok: true },
        {
          label: "답",
          value: `위쪽 경계의 ${list(oneChainMissing)}${을를(tail(oneChainMissing.at(-1) as Point))} 놓친다`,
          ok: false,
        },
      ],
      lesson: "놓친 점은 전부 위쪽 경계에 있다 — 거꾸로 한 번 더 읽으면 어떨까",
    },
    {
      name: "좌표 순서로 정렬해 단조 사슬 둘",
      idea: "같은 규칙으로 정렬 순서를 한 번, 거꾸로 한 번 읽어 아래 사슬과 위 사슬을 쌓고 끝점을 떼어 잇는다",
      verdict: "keep",
      checks: [
        { label: "답", value: `맞다 — 전개 입력에서 ${list(HULL)}`, ok: true },
        {
          label: "시간",
          value: `점 ${num(LIMIT)} 개에서 기본 연산 ${num(big.ops)} 번 · ${(big.ops / PER_SECOND).toFixed(3)} 초`,
          ok: true,
        },
        {
          label: "메모리",
          value: `추가 칸 n + 2m + h — ${num(big.cells)} 칸`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 띠의 칸 수 — 두 사슬 가운데 가장 길었을 때. */
const STACK_SLOTS = Math.max(
  ...[...LOWER, ...UPPER].map((e) => e.after.length),
);
const TOTAL_TESTS = [...LOWER, ...UPPER].reduce(
  (s, e) => s + e.tests.length,
  0,
);

const turnPhrase = (s: number): string =>
  s > 0 ? "왼쪽으로 꺾여" : s < 0 ? "오른쪽으로 꺾여" : "한 직선 위라";

/** 걸음 설명 — 판정마다 한 문장. */
function pushText(e: Push): string {
  const p = pt(e.p);
  const before = e.after.length - 1 + e.popped.length;
  if (e.tests.length === 0) {
    return before === 0
      ? `사슬이 비어 있어 방향 판정 없이 ${p}${을를(tail(e.p))} 담습니다.`
      : `사슬에 점이 ${before} 개뿐이라 방향 판정 없이 ${p}${을를(tail(e.p))} 담습니다.`;
  }
  const out: string[] = [];
  for (const t of e.tests) {
    const three = `${pt(t.o)} → ${pt(t.a)} → ${p}`;
    out.push(
      t.side > 0
        ? `${three}${이가(tail(e.p))} 왼쪽으로 꺾여 멈추고 ${p}${을를(tail(e.p))} 담습니다.`
        : `${three}${이가(tail(e.p))} ${turnPhrase(t.side)} ${pt(t.a)}${을를(tail(t.a))} 걷어냅니다.`,
    );
  }
  if ((e.tests.at(-1) as { side: number }).side <= 0) {
    out.push(
      `사슬에 점이 하나만 남아 판정 없이 ${p}${을를(tail(e.p))} 담습니다.`,
    );
  }
  return out.join(" ");
}

/** 걸음 하나의 무대. */
function pushStage(
  e: Push,
  pass: readonly Point[],
  step: number,
  done: { tests: number; pops: number },
  lowerFinal: readonly Point[] | null,
): GraphStep {
  const visited = new Set(pass.slice(0, step + 1).map(idOf));
  const inChain = new Set(e.after.map(idOf));
  const popped = new Set(e.popped.map(idOf));
  const last = e.tests.at(-1);
  const kept = last !== undefined && last.side > 0;
  const read = new Set<number>(popped);
  if (kept) {
    read.add(idOf(last.o));
    read.add(idOf(last.a));
  }
  const nodes = WALK_UNIQ.map((_, id) => {
    let state: CellState | undefined;
    if (id === idOf(e.p)) state = "focus";
    else if (read.has(id)) state = "read";
    else if (inChain.has(id)) state = undefined;
    else if (visited.has(id)) state = "out";
    else state = "empty";
    return {
      value: popped.has(id) ? "걷어냄" : `순서 ${id}`,
      ...(state ? { state } : {}),
    };
  });
  const chainLinks = new Set(links(e.after).map(([a, b]) => `${a}-${b}`));
  const lowerLinks = new Set(
    (lowerFinal ? links(lowerFinal) : []).map(([a, b]) => `${a}-${b}`),
  );
  const fresh =
    e.after.length >= 2
      ? `${idOf(e.after.at(-2) as Point)}-${idOf(e.p)}`
      : null;
  const edges = LAYOUT.edges.map(({ from, to }) => {
    const key = `${from}-${to}`;
    if (chainLinks.has(key)) {
      return key === fresh
        ? { kind: "tree" as const, state: "focus" as const }
        : { kind: "tree" as const };
    }
    if (lowerLinks.has(key)) return {};
    return { hidden: true };
  });
  const states: Partial<Record<number, CellState>> = {
    [e.after.length - 1]: "focus",
  };
  if (kept) {
    states[e.after.length - 2] = "read";
    states[e.after.length - 3] = "read";
  }
  return {
    nodes,
    edges,
    strips: [
      {
        label: lowerFinal ? "위 사슬" : "아래 사슬",
        values: e.after.map(pt),
        slots: STACK_SLOTS,
        states,
      },
    ],
    calc: last
      ? {
          expr: `sideOf(${pt(last.o)}, ${pt(last.a)}, ${pt(e.p)}) =`,
          result: String(last.side),
        }
      : null,
    vars: `방향 판정 ${done.tests} / ${TOTAL_TESTS} · 걷어낸 점 ${done.pops}`,
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): {
  walkLower: SimStep[];
  walkUpper: SimStep[];
} {
  const lower: SimStep[] = [
    {
      title: "T1 좌표 순서로 정렬하고 같은 좌표를 합친다",
      text: `입력 ${WALK.length} 개를 x 를 먼저, 같으면 y 로 정렬하고 이웃한 같은 좌표를 하나로 합칩니다. 서로 다른 점 ${WALK_UNIQ.length} 개가 정렬 순서로 번호를 받습니다.`,
      nodes: WALK_UNIQ.map((_, id) => ({
        value: `순서 ${id}`,
        state: "focus" as const,
      })),
      edges: LAYOUT.edges.map(() => ({ hidden: true })),
      strips: [{ label: "아래 사슬", values: [], slots: STACK_SLOTS }],
      calc: null,
      vars: `방향 판정 0 / ${TOTAL_TESTS} · 걷어낸 점 0`,
    },
  ];
  const done = { tests: 0, pops: 0 };
  let t = 2;
  LOWER.forEach((e, k) => {
    done.tests += e.tests.length;
    done.pops += e.popped.length;
    lower.push({
      title: `T${t++} 아래 사슬 · 점 ${pt(e.p)}`,
      text: pushText(e),
      ...pushStage(e, WALK_UNIQ, k, { ...done }, null),
    });
  });
  const upper: SimStep[] = [];
  const reversed = [...WALK_UNIQ].reverse();
  UPPER.forEach((e, k) => {
    done.tests += e.tests.length;
    done.pops += e.popped.length;
    upper.push({
      title: `T${t++} 위 사슬 · 점 ${pt(e.p)}`,
      text:
        k === 0
          ? `정렬 순서를 거꾸로 읽어 위 사슬을 쌓습니다. ${pushText(e)}`
          : pushText(e),
      ...pushStage(e, reversed, k, { ...done }, LOWER_CHAIN),
    });
  });
  const hullIds = new Set(HULL.map(idOf));
  const hullLinks = new Set(HULL_EDGES.map(([a, b]) => `${a}-${b}`));
  const lowerEnd = LOWER_CHAIN.at(-1) as Point;
  const upperEnd = UPPER_CHAIN.at(-1) as Point;
  upper.push({
    title: `T${t} 두 사슬의 마지막 점을 떼고 잇는다`,
    text: `아래 사슬의 마지막 점 ${pt(lowerEnd)}${josa(tail(lowerEnd), "은", "는")} 위 사슬의 첫 점과 같고, 위 사슬의 마지막 점 ${pt(upperEnd)}${josa(tail(upperEnd), "은", "는")} 아래 사슬의 첫 점과 같습니다. 두 점을 하나씩 떼고 이으면 꼭짓점 ${HULL.length} 개가 반시계 방향으로 남습니다.`,
    nodes: WALK_UNIQ.map((p, id) => ({
      value: roleShort(p),
      ...(hullIds.has(id)
        ? { state: "focus" as const }
        : { state: "out" as const }),
    })),
    edges: LAYOUT.edges.map(({ from, to }) =>
      hullLinks.has(`${from}-${to}`)
        ? { kind: "tree" as const, state: "focus" as const }
        : { hidden: true },
    ),
    strips: [
      {
        label: "답",
        values: HULL.map(pt),
        slots: STACK_SLOTS,
        states: Object.fromEntries(HULL.map((_, k) => [k, "focus" as const])),
      },
    ],
    calc: null,
    vars: `방향 판정 ${done.tests} / ${TOTAL_TESTS} · 걷어낸 점 ${done.pops}`,
  });
  return { walkLower: lower, walkUpper: upper };
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

/** 두 사슬을 평면에 — 아래 사슬은 굵은 실선, 위 사슬은 긴 대시와 점. */
function chainScene(value: (p: Point) => string | undefined): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const on = new Set([...LOWER_CHAIN, ...UPPER_CHAIN].map(idOf));
  return {
    nodes: planeNodes(value, (p) => (on.has(idOf(p)) ? undefined : "out")),
    edges: [
      ...links(LOWER_CHAIN).map(([from, to], k) => ({
        from,
        to,
        kind: "tree" as const,
        ...(k === 0 ? { label: "아래 사슬" } : {}),
      })),
      ...links(UPPER_CHAIN).map(([from, to], k) => ({
        from,
        to,
        kind: "forward" as const,
        ...(k === 1 ? { label: "위 사슬" } : {}),
      })),
    ],
  };
}

/** 방향 판정 셋 — 전개 입력의 세 점 묶음을 나란히. */
function turnsScene(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: { members: string[]; label: string }[];
} {
  const triples: [string, [Point, Point, Point]][] = [
    [
      "L",
      [
        [0, 0],
        [3, 0],
        [3, 2],
      ],
    ],
    [
      "R",
      [
        [0, 0],
        [0, 3],
        [3, 0],
      ],
    ],
    [
      "Z",
      [
        [0, 0],
        [3, 0],
        [6, 0],
      ],
    ],
  ];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: { members: string[]; label: string }[] = [];
  let offset = 0;
  const roles = ["o", "a", "b"];
  for (const [tag, three] of triples) {
    const ids = three.map((_, k) => `${tag}${k}`);
    three.forEach((p, k) => {
      nodes.push({
        id: ids[k] as string,
        x: offset + p[0],
        y: 3 - p[1],
        label: pt(p),
        value: roles[k],
      });
    });
    edges.push({ from: ids[0] as string, to: ids[1] as string });
    edges.push({ from: ids[1] as string, to: ids[2] as string });
    const s = sideOf(...three);
    groups.push({
      members: ids,
      label: `sideOf = ${s} · ${s > 0 ? "왼쪽으로 꺾인다" : s < 0 ? "오른쪽으로 꺾인다" : "한 직선 위"}`,
    });
    offset += Math.max(...three.map((p) => p[0])) + 4;
  }
  return { nodes, edges, groups };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-hull": () => (
    <NodeGraph
      title="전개 입력의 볼록 껍질 — 정점 아래 말은 껍질에서의 자리"
      directed={false}
      unit={PLANE_UNIT}
      nodes={planeNodes(roleShort, (p) =>
        isHull(p) ? undefined : roleShort(p) === "안쪽" ? "out" : "read",
      )}
      edges={HULL_EDGES.map(([from, to]) => ({ from, to, kind: "tree" }))}
    />
  ),
  "concept-turns": () => {
    const scene = turnsScene();
    return (
      <NodeGraph
        title="방향 판정 셋 — o 에서 a 로 간 다음 b 로 갈 때"
        unit={{ x: 44, y: 44 }}
        nodes={scene.nodes}
        edges={scene.edges}
        groups={scene.groups}
      />
    );
  },
  "concept-chains": () => {
    const scene = chainScene(() => undefined);
    return (
      <NodeGraph
        title="아래 사슬(굵은 실선)과 위 사슬(긴 대시와 점)"
        unit={PLANE_UNIT}
        nodes={scene.nodes}
        edges={scene.edges}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`점 n = ${num(LIMIT)} · 좌표는 절댓값 10^9 이하의 정수 · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-chains": () => {
    const scene = chainScene((p) => `순서 ${idOf(p)}`);
    return (
      <NodeGraph
        title="두 사슬과 정렬 순서 — 정점 아래 수는 정렬한 목록의 자리"
        unit={PLANE_UNIT}
        nodes={scene.nodes}
        edges={scene.edges}
      />
    );
  },
  "build-polyline": () => {
    const turn = new Map<number, number>();
    for (let at = 1; at + 1 < WALK_UNIQ.length; at++) {
      turn.set(
        at,
        sideOf(
          WALK_UNIQ[at - 1] as Point,
          WALK_UNIQ[at] as Point,
          WALK_UNIQ[at + 1] as Point,
        ),
      );
    }
    return (
      <NodeGraph
        title="정렬 순서대로 모든 점을 이은 꺾은선 — 정점 아래 수는 그 점에서 꺾는 방향의 sideOf"
        unit={PLANE_UNIT}
        nodes={planeNodes(
          (p) => {
            const s = turn.get(idOf(p));
            return s === undefined ? "끝" : `sideOf ${s}`;
          },
          (p) => {
            const s = turn.get(idOf(p));
            return s === undefined || s > 0 ? undefined : "read";
          },
        )}
        edges={links(WALK_UNIQ).map(([from, to]) => ({ from, to }))}
      />
    );
  },
  "build-lower-film": () => {
    const spec = walkLower as unknown as PlayerSpec;
    const frames = playerFrames(spec);
    // 걷어낼 것 없이 담는 걸음 하나와, 한 걸음에 두 번 걷어내는 걸음 하나.
    const easy = LOWER.findIndex(
      (e) => e.tests.length > 0 && e.popped.length === 0,
    );
    const hard = LOWER.findIndex((e) => e.popped.length >= 2);
    const pick = [frames[easy + 1]?.id, frames[hard + 1]?.id].filter(
      (x): x is string => x !== undefined,
    );
    return <Film spec={spec} pick={pick} />;
  },
  "walk-lower": () => <Film spec={walkLower as unknown as PlayerSpec} />,
  "walk-upper": () => <Film spec={walkUpper as unknown as PlayerSpec} />,
};
