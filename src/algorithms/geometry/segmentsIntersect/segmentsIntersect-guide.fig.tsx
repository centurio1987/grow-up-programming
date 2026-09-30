/**
 * `segmentsIntersect-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 판정값 · 갈래 · 칸 검사는 정본과 같은 절차를 세면서
 * 실행하는 `judge`(`-guide.proof.ts`)가 내고, `judge` 는 쌍마다 정본의 답과 대조한다.
 *
 * **평면 위의 점은 「그래프」 무대(`NodeGraph`)로 그린다** — `convexHull` 편이 세운 약속 그대로다. 점의
 * 좌표를 정점 자리로 주고, 화면은 아래로 갈수록 `y` 가 커지므로 `y` 만 뒤집는다(`YMAX − y`). 선분은
 * 간선이고, 첫 인자는 굵은 실선 · 둘째 인자는 대시로 그린다. 여러 배치를 한 장에 늘어놓는 그림은
 * 배치마다 좌표를 같은 비율로 줄여 같은 크기의 칸에 넣는다 — 정점 이름은 실제 좌표 그대로다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `segmentsIntersect-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 은는, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type EdgeKind,
  type GraphEdge,
  type GraphGroup,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  exactMismatch,
  judge,
  ladderWrong,
  NAMED,
  naiveWrong,
  num,
  PAIRS,
  pt,
  S1,
  S2,
  S3,
  S4,
  SHAPES,
  triplesOf,
  WALK,
} from "./segmentsIntersect-guide.proof.ts";
import {
  type Point,
  type Segment,
  sideOf,
} from "./segmentsIntersect-guide.ref.ts";
import { pairWalk } from "./segmentsIntersect-guide.sim.ts";

/* ── 평면 배치 ── */

const same = (p: Point, q: Point) => p[0] === q[0] && p[1] === q[1];

/** 전개 입력의 서로 다른 끝점 — 선분 넷의 순서대로. */
const POINTS: Point[] = [];
for (const [, s] of NAMED) {
  for (const p of s) if (!POINTS.some((q) => same(p, q))) POINTS.push(p);
}
const YMAX = Math.max(...POINTS.map((p) => p[1]));
const idOf = (p: Point): number => POINTS.findIndex((q) => same(p, q));

/** 평면 한 칸의 픽셀 — 좌표 1 이 가로 64 · 세로 52(`convexHull` 과 같다). */
const PLANE_UNIT = { x: 64, y: 52 } as const;

const D_NAMES = ["d1", "d2", "d3", "d4"];

/** 걸음 재생 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: POINTS.map((p, id) => ({ id, x: p[0], y: YMAX - p[1], label: pt(p) })),
  edges: NAMED.map(([, s]) => ({ from: idOf(s[0]), to: idOf(s[1]) })),
  directed: false,
  unit: PLANE_UNIT,
};

/* ── 여러 배치를 한 장에 — 배치마다 같은 비율로 줄여 같은 칸에 넣는다 ── */

interface Config {
  readonly tag: string;
  readonly label: string;
  readonly s1: Segment;
  readonly s2: Segment;
  /** 정점 아래 값. */
  readonly value?: (p: Point) => string | undefined;
  readonly state?: (p: Point) => CellState | undefined;
  /** 더 그릴 점과 선(직선의 연장 같은 것). */
  readonly extra?: { from: Point; to: Point; label: string };
}

/** 칸 하나의 크기(격자 단위)와 칸 사이 틈. */
const BOX = { w: 4, h: 3 } as const;
const GAP = { x: 1.5, y: 1.5 } as const;
const PACK_UNIT = { x: 80, y: 90 } as const;

/** 쌍 하나를 실제 비율 그대로 그리는 칸과 그 픽셀 — 끝점이 상대 선분에 가까워도 정점이 선을 덮지 않는다. */
const PAIR_BOX = { w: 6, h: 4 } as const;
const PAIR_UNIT = { x: 72, y: 60 } as const;

function packScene(
  configs: readonly Config[],
  perRow: number,
  box: { readonly w: number; readonly h: number } = BOX,
): { nodes: GraphNode[]; edges: GraphEdge[]; groups: GraphGroup[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const groups: GraphGroup[] = [];
  configs.forEach((c, k) => {
    const pts: Point[] = [];
    const add = (p: Point) => {
      if (!pts.some((q) => same(p, q))) pts.push(p);
    };
    for (const p of [...c.s1, ...c.s2]) add(p);
    if (c.extra) add(c.extra.to);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    const scale = Math.min(
      w === 0 ? Number.POSITIVE_INFINITY : box.w / w,
      h === 0 ? Number.POSITIVE_INFINITY : box.h / h,
    );
    const ox = (k % perRow) * (box.w + GAP.x);
    const oy = Math.floor(k / perRow) * (box.h + GAP.y);
    const minX = Math.min(...xs);
    const maxY = Math.max(...ys);
    const id = (p: Point) => `${c.tag}${pts.findIndex((q) => same(p, q))}`;
    for (const p of pts) {
      const isExtra = c.extra !== undefined && same(p, c.extra.to);
      nodes.push({
        id: id(p),
        x: ox + (p[0] - minX) * scale,
        y: oy + (maxY - p[1]) * scale,
        label: isExtra ? c.extra?.label : pt(p),
        value: isExtra ? undefined : c.value?.(p),
        state: isExtra ? "out" : c.state?.(p),
      });
    }
    const kinds: [Segment, EdgeKind, string][] = [
      [c.s1, "tree", "첫 인자"],
      [c.s2, "back", "둘째 인자"],
    ];
    for (const [s, kind] of kinds) {
      if (same(s[0], s[1])) continue;
      edges.push({ from: id(s[0]), to: id(s[1]), kind });
    }
    if (c.extra) {
      edges.push({ from: id(c.extra.from), to: id(c.extra.to), state: "out" });
    }
    groups.push({ members: pts.map(id), label: c.label });
  });
  return { nodes, edges, groups };
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const naive = naiveWrong();
  const collinear = naive[2] as { wrong: number; total: number };
  const small = naive[0] as { wrong: number; total: number };
  const ladder = ladderWrong();
  const exact = exactMismatch();
  return [
    {
      name: "교점을 구한다",
      idea: "두 직선을 연립해 매개변수 t · u 를 나눗셈으로 구하고 둘 다 0 과 1 사이인지 본다. 분모가 0 이면 안 만난다고 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `같은 직선 위에서 구간을 공유하는 ${num(collinear.total)} 쌍을 ${num(collinear.wrong)} 쌍 틀린다 · 좌표 0~6 에서 ${num(small.wrong)} 쌍`,
          ok: false,
        },
        {
          label: "원인",
          value: "틀린 답이 전부 분모가 0 인 갈래에서 나온다",
          ok: false,
        },
      ],
      lesson:
        "분모가 0 인 갈래를 가르려면 끝점이 상대의 직선 위인지부터 재야 한다 — 그 방향 판정만으로 답을 낼 수 없을까",
    },
    {
      name: "첫 인자만 걸치는지 잰다",
      idea: "첫 인자의 두 끝점이 둘째 인자의 직선을 사이에 두고 갈리면 참으로 답한다",
      verdict: "drop",
      checks: [
        { label: "나눗셈", value: "0 번 — 방향 판정 둘", ok: true },
        {
          label: "답",
          value: `좌표 0~6 의 ${num(PAIRS)} 쌍 가운데 ${num(ladder.oneSide)} 쌍을 틀린다`,
          ok: false,
        },
      ],
      lesson:
        "두 직선이 만나는 점이 둘째 인자 밖일 수 있다 — 둘째 인자 쪽도 재야 한다",
    },
    {
      name: "서로 걸침만 본다",
      idea: "두 선분이 서로의 직선을 걸치면 참, 아니면 거짓으로 답한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `판정값에 0 이 있는 쌍을 전부 거짓으로 낸다 — 좌표 0~6 에서 ${num(ladder.bothOnly[0] ?? 0)} 쌍 · 같은 직선 위 ${num(ladder.bothOnly[2] ?? 0)} 쌍`,
          ok: false,
        },
      ],
      lesson:
        "판정값이 0 인 끝점은 상대의 직선 위다 — 선분 위인지만 따로 보면 된다",
    },
    {
      name: "방향 판정 넷",
      idea: "서로 걸침을 보고, 판정값이 0 인 끝점은 상대 선분의 좌표 칸 안인지 본다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `세 가족 ${num(exact.total)} 쌍에서 교점을 유리수로 정확히 푼 판정과 다른 답 ${num(exact.mismatch)} 쌍`,
          ok: true,
        },
        {
          label: "연산",
          value: "방향 판정 넷 · 칸 검사 많아야 넷 · 나눗셈 0 번",
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차를 센 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const TOTAL_TESTS = WALK.length * 4;

/** 쌍 하나가 쓰는 정점 — 끝점 넷의 자리(d1~d4 가 재는 끝점의 차례). */
const measured = (s1: Segment, s2: Segment): Point[] => [
  s1[0],
  s1[1],
  s2[0],
  s2[1],
];

/** 걸음 하나의 무대. `phase` 가 무엇을 강조할지 정한다. */
function pairStage(
  k: number,
  phase: "measure" | "straddle" | "box",
  done: { tests: number; boxes: number },
  answers: (string | null)[],
): GraphStep {
  const [, s1, s2] = WALK[k] as [string, Segment, Segment];
  const r = judge(s1, s2);
  const ends = measured(s1, s2);
  const triples = triplesOf(s1, s2);
  const inPair = new Set(ends.map(idOf));
  const pairEdges = new Set([idOf(s1[0]), idOf(s2[0])]);
  const boxHit = r.boxCalls.find((c) => c.hit);
  const nodes = POINTS.map((p, id) => {
    if (!inPair.has(id)) return { state: "out" as const };
    const at = ends.findIndex((q) => same(p, q));
    const value = `${D_NAMES[at]} ${r.d[at]}`;
    let state: CellState | undefined;
    if (phase === "measure") state = "focus";
    else if (phase === "straddle") state = "read";
    else {
      const call = r.boxCalls.find((c) => c.at === at);
      state = call === undefined ? undefined : call.hit ? "focus" : "read";
    }
    return state ? { value, state } : { value };
  });
  // 칸 검사가 참이 된 끝점은 상대 선분의 칸 안이다 — 그 칸을 준 선분을 새로 씀으로 그린다.
  const hitOwner =
    boxHit === undefined
      ? null
      : (triples[boxHit.at] as [Point, Point, Point])[0];
  const edges = NAMED.map(([, s]) => {
    if (!pairEdges.has(idOf(s[0]))) return { state: "out" as const };
    const kind: EdgeKind = same(s[0], s1[0]) ? "tree" : "back";
    if (phase === "measure") return { kind, state: "read" as const };
    if (phase === "straddle" && r.branch === "③") {
      return { kind, state: "focus" as const };
    }
    if (phase === "box" && hitOwner !== null && same(hitOwner, s[0])) {
      return { kind, state: "focus" as const };
    }
    return { kind };
  });
  const states: Partial<Record<number, CellState>> = {};
  for (let at = 0; at < 4; at++) {
    states[at] = phase === "measure" ? "focus" : "read";
  }
  const answerStates: Partial<Record<number, CellState>> = {};
  if (answers[k] !== null) answerStates[k] = "focus";
  let calc: GraphStep["calc"] = null;
  if (phase === "measure") {
    calc = { expr: "d1 d2 d3 d4 =", result: r.d.join(" ") };
  } else if (phase === "straddle") {
    calc = {
      expr: `straddles(${r.d[0]}, ${r.d[1]}) && straddles(${r.d[2]}, ${r.d[3]}) =`,
      result: String(r.branch === "③"),
    };
  } else {
    calc = {
      expr: `칸 검사 ${r.boxes} 번 →`,
      result: String(r.answer),
    };
  }
  return {
    nodes,
    edges,
    strips: [
      { label: "판정값", values: r.d.map(String), slots: 4, states },
      {
        label: "답",
        values: answers.map((a) => a ?? ""),
        slots: WALK.length,
        states: answerStates,
      },
    ],
    calc,
    vars: `방향 판정 ${done.tests} / ${TOTAL_TESTS} · 칸 검사 ${done.boxes}`,
  };
}

/** 걸음 설명 — 실행 값으로 짓는다. */
function stepText(k: number, phase: "measure" | "straddle" | "box"): string {
  const [label, s1, s2] = WALK[k] as [string, Segment, Segment];
  const r = judge(s1, s2);
  const [n1, n2] = label.split("·") as [string, string];
  if (phase === "measure") {
    return `${n2} 의 직선에서 ${n1} 의 두 끝점이 어느 쪽인지(d1 · d2), ${n1} 의 직선에서 ${n2} 의 두 끝점이 어느 쪽인지(d3 · d4) 잽니다. 네 값은 ${r.d.join(" ")} 입니다.`;
  }
  if (phase === "straddle") {
    const first = r.d[0] !== 0 && r.d[1] !== 0 && r.d[0] !== r.d[1];
    const second = r.d[2] !== 0 && r.d[3] !== 0 && r.d[2] !== r.d[3];
    const part = (ok: boolean, a: number, b: number) =>
      ok
        ? "갈립니다"
        : a === 0 || b === 0
          ? "0 이 있어 걸침이 아닙니다"
          : "같은 쪽입니다";
    return `d1 · d2 는 ${part(first, r.d[0], r.d[1])}. d3 · d4 는 ${part(second, r.d[2], r.d[3])}. ${
      r.branch === "③"
        ? `서로 걸치므로 답은 ${r.answer} 입니다.`
        : "서로 걸침이 거짓이라 판정값이 0 인 끝점을 보러 갑니다."
    }`;
  }
  if (r.boxes === 0) {
    return `판정값에 0 이 하나도 없어 칸 검사를 한 번도 부르지 않습니다. 네 검사가 다 거짓이라 답은 ${r.answer} 입니다.`;
  }
  const names = ["p1", "p2", "p3", "p4"];
  const triples = triplesOf(s1, s2);
  const said = r.boxCalls.map((c) => {
    const [, , p] = triples[c.at] as [Point, Point, Point];
    return `${names[c.at]} ${pt(p)}${은는(String(p[1]))} 상대 선분의 칸 ${c.hit ? "안" : "밖"}`;
  });
  return `판정값이 0 인 끝점을 차례로 칸에 대어 봅니다. ${said.join(", ")}이라 답은 ${r.answer} 입니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차를 센 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  const out: SimStep[] = [];
  const done = { tests: 0, boxes: 0 };
  const answers: (string | null)[] = WALK.map(() => null);
  let t = 1;
  WALK.forEach(([label, s1, s2], k) => {
    const r = judge(s1, s2);
    done.tests += 4;
    out.push({
      title: `T${t++} ${label} · 네 방향 판정을 잰다`,
      text: stepText(k, "measure"),
      ...pairStage(k, "measure", { ...done }, [...answers]),
    });
    if (r.branch === "③") answers[k] = String(r.answer);
    out.push({
      title: `T${t++} ${label} · ③ 양쪽이 다 갈리는가`,
      text: stepText(k, "straddle"),
      ...pairStage(k, "straddle", { ...done }, [...answers]),
    });
    if (r.branch === "③") return;
    done.boxes += r.boxes;
    answers[k] = String(r.answer);
    out.push({
      title: `T${t++} ${label} · ④ 판정값이 0 인 끝점을 칸으로 본다`,
      text: stepText(k, "box"),
      ...pairStage(k, "box", { ...done }, [...answers]),
    });
  });
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

/** 쌍 하나의 끝점마다 판정값 — 「d1 -1 · 오른쪽」. */
function dValue(s1: Segment, s2: Segment): (p: Point) => string | undefined {
  const r = judge(s1, s2);
  const ends = measured(s1, s2);
  const side = (v: number) => (v > 0 ? "왼쪽" : v < 0 ? "오른쪽" : "직선 위");
  return (p) => {
    const at = ends.findIndex((q) => same(p, q));
    return at < 0
      ? undefined
      : `${D_NAMES[at]} ${r.d[at]} · ${side(r.d[at] as number)}`;
  };
}

/** 걸침 하나의 그림 — 쌍 하나를 실제 좌표로. */
function straddleConfig(
  label: string,
  s1: Segment,
  s2: Segment,
  extra?: Config["extra"],
): Config {
  const r = judge(s1, s2);
  const first = r.d[0] !== 0 && r.d[1] !== 0 && r.d[0] !== r.d[1];
  const second = r.d[2] !== 0 && r.d[3] !== 0 && r.d[2] !== r.d[3];
  const [n1, n2] = label.split("·") as [string, string];
  return {
    tag: label,
    label: `${n1}${이가(n1)} ${n2} 의 직선을 ${first ? "걸친다" : "안 걸친다"} · ${n2}${이가(n2)} ${n1} 의 직선을 ${
      second ? "걸친다" : "안 걸친다"
    } · 답 ${r.answer}`,
    s1,
    s2,
    value: dValue(s1, s2),
    ...(extra ? { extra } : {}),
  };
}

/** s3 의 직선을 위로 늘인 끝 — s1 이 그 직선을 지나는 자리보다 위까지. */
const S3_LINE_TOP: Point = [S3[0][0], S1[1][1]];

export const FIGS: Record<string, () => ReactElement> = {
  "concept-shapes": () => {
    const scene = packScene(
      SHAPES.map(([label, s1, s2], k) => {
        const r = judge(s1, s2);
        return { tag: `c${k}`, label: `${label} · ${r.answer}`, s1, s2 };
      }),
      3,
    );
    return (
      <NodeGraph
        title="여섯 배치 — 굵은 실선이 첫 인자, 대시가 둘째 인자"
        directed={false}
        unit={PACK_UNIT}
        nodes={scene.nodes}
        edges={scene.edges}
        groups={scene.groups}
      />
    );
  },
  "concept-turns": () => {
    const [o, a] = S1;
    const triples: [Point, Point, Point][] = [
      [o, a, S2[0]],
      [o, a, S2[1]],
      [o, a, S4[0]],
    ];
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const groups: GraphGroup[] = [];
    const roles = ["o", "a", "b"];
    const top = Math.max(...triples.flat().map((p) => p[1]));
    triples.forEach((three, k) => {
      const ids = three.map((_, j) => `t${k}${j}`);
      const ox = k * (BOX.w + GAP.x);
      three.forEach((p, j) => {
        nodes.push({
          id: ids[j] as string,
          x: ox + p[0] / 2,
          y: (top - p[1]) / 2,
          label: pt(p),
          value: roles[j],
        });
      });
      edges.push({ from: ids[0] as string, to: ids[1] as string });
      edges.push({
        from: ids[1] as string,
        to: ids[2] as string,
        bend: k === 2 ? 0.25 : 0,
      });
      const s = sideOf(...three);
      groups.push({
        members: ids,
        label: `sideOf = ${s} · ${s > 0 ? "왼쪽으로 꺾인다" : s < 0 ? "오른쪽으로 꺾인다" : "한 직선 위"}`,
      });
    });
    return (
      <NodeGraph
        title="방향 판정 셋 — o 에서 a 로 간 다음 b 로 갈 때"
        unit={PACK_UNIT}
        nodes={nodes}
        edges={edges}
        groups={groups}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`좌표는 절댓값 10^9 이하의 정수 · 입력 가족 셋 각 ${num(PAIRS)} 쌍`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-straddle-both": () => {
    const scene = packScene([straddleConfig("s1·s2", S1, S2)], 1, PAIR_BOX);
    return (
      <NodeGraph
        title="서로 걸치는 쌍 s1·s2 — 정점 아래는 상대 직선에서 잰 판정값"
        directed={false}
        unit={PAIR_UNIT}
        nodes={scene.nodes}
        edges={scene.edges}
        groups={scene.groups}
      />
    );
  },
  "build-straddle-one": () => {
    const scene = packScene(
      [
        straddleConfig("s1·s3", S1, S3, {
          from: S3[1],
          to: S3_LINE_TOP,
          label: "s3 의 직선",
        }),
      ],
      1,
      PAIR_BOX,
    );
    return (
      <NodeGraph
        title="한쪽만 걸치는 쌍 s1·s3 — 흐린 선은 s3 을 위로 늘인 직선"
        directed={false}
        unit={PAIR_UNIT}
        nodes={scene.nodes}
        edges={scene.edges}
        groups={scene.groups}
      />
    );
  },
  "build-collinear": () => {
    const [, a5, b5] = SHAPES[4] as [string, Segment, Segment];
    const boxWord = (s1: Segment, s2: Segment) => (p: Point) => {
      const other = s1.some((q) => same(p, q)) ? s2 : s1;
      const inside =
        Math.min(other[0][0], other[1][0]) <= p[0] &&
        p[0] <= Math.max(other[0][0], other[1][0]) &&
        Math.min(other[0][1], other[1][1]) <= p[1] &&
        p[1] <= Math.max(other[0][1], other[1][1]);
      return inside ? "상대 칸 안" : "상대 칸 밖";
    };
    const config = (tag: string, s1: Segment, s2: Segment): Config => {
      const r = judge(s1, s2);
      return {
        tag,
        label: `판정값 ${r.d.join(" ")} · 답 ${r.answer}`,
        s1,
        s2,
        value: boxWord(s1, s2),
        state: (p) =>
          boxWord(s1, s2)(p) === "상대 칸 안" ? "focus" : undefined,
      };
    };
    const scene = packScene([config("k0", S1, S4), config("k1", a5, b5)], 2, {
      w: 4.5,
      h: 3,
    });
    return (
      <NodeGraph
        title="같은 직선 위의 두 배치 — 판정값은 같고 좌표 칸이 답을 가른다"
        directed={false}
        unit={PACK_UNIT}
        nodes={scene.nodes}
        edges={scene.edges}
        groups={scene.groups}
      />
    );
  },
  "walk-pairs": () => <Film spec={pairWalk as unknown as PlayerSpec} />,
};
