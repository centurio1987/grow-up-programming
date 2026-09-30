/**
 * `closestPairOfPoints-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 답은 정본(`-guide.ref.ts`)이 낸 것이고, 재귀가 걸음마다
 * 가른 구간 · 분할선 · 띠 · 비교한 쌍은 정본과 같은 절차를 걸음마다 기록한 사본(`-guide.proof.ts` 의
 * `record`)이 낸다. 그 기록의 답과 셈이 정본 · 값만 세는 판과 같은지는 증명 사이드카가 읽힐 때 스스로
 * 확인한다.
 *
 * **평면 위의 점은 「그래프」 무대(`NodeGraph`)로 그린다** — 볼록 껍질 편(`convexHull`)의 약속을 잇는다.
 * 점의 좌표를 그대로 정점 자리로 주고, 화면은 아래로 갈수록 `y` 가 커지므로 `y` 만 뒤집는다(`YMAX − y`).
 * 분할선은 세로 기준선(`rules`), 분할선 양옆의 띠는 세로 띠(`bands`), 지금 맡은 구간은 묶음(`groups`),
 * 비교한 쌍은 간선이다. 무대 아래 칸 줄 셋이 x 순서 목록(지금 구간 밖은 흐리게) · 그 구간의 `byY` ·
 * `strip` 이다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `closestPairOfPoints-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  answerPair,
  CELL_BOUND,
  dist,
  ladderValues,
  list,
  MAX_N,
  num,
  ops,
  PER_SECOND,
  pt,
  type Step,
  seconds,
  TOP_STRIP,
  WALK,
  WALK_RUN,
} from "./closestPairOfPoints-guide.proof.ts";
import type { Point } from "./closestPairOfPoints-guide.ref.ts";
import { walkLeft, walkRight } from "./closestPairOfPoints-guide.sim.ts";

/* ── 평면 배치 ── */

const YMAX = Math.max(...WALK.map((p) => p[1]));

/** 점의 번호 — 입력 목록의 자리. */
const idOf = (p: Point): number =>
  WALK.findIndex((q) => q[0] === p[0] && q[1] === p[1]);

/** 평면 한 칸의 픽셀 — 좌표 1 이 가로 70 · 세로 50. */
const PLANE_UNIT = { x: 70, y: 50 } as const;

/** 칸 줄의 칸 수 — 점의 수. */
const SLOTS = WALK.length;

/** 걸음 기록에서 거리 계산을 한 번이라도 한 점 쌍 — 걸음 재생 패널의 간선 자리. 처음 나온 차례로. */
function comparedPairs(): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  const push = (a: Point, b: Point) => {
    const x = idOf(a);
    const y = idOf(b);
    const key = `${Math.min(x, y)}-${Math.max(x, y)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push([x, y]);
  };
  for (const s of WALK_RUN.steps) {
    if (s.kind === "base") for (const q of s.pairs) push(q.a, q.b);
    if (s.kind === "strip") {
      for (const c of s.checks) if (!c.stop) push(c.a, c.b);
    }
  }
  return out;
}

const PAIRS = comparedPairs();

/** 걸음 재생 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: WALK.map((p, id) => ({
    id,
    x: p[0],
    y: YMAX - p[1],
    label: pt(p),
  })),
  edges: PAIRS.map(([from, to]) => ({ from, to })),
  directed: false,
  unit: PLANE_UNIT,
};

const same = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1];
const has = (ps: readonly Point[], p: Point) => ps.some((q) => same(p, q));

/** 평면 위의 점 — 정점 자리는 좌표 그대로. */
const planeNodes = (
  value: (p: Point) => string | undefined,
  state: (p: Point) => CellState | undefined = () => undefined,
): GraphNode[] =>
  WALK.map((p, id) => ({
    id,
    x: p[0],
    y: YMAX - p[1],
    label: pt(p),
    value: value(p),
    state: state(p),
  }));

/** 띠의 가로 폭 — 들어온 best 의 제곱근. */
const halfWidth = (best: number): number => Math.sqrt(best);

/** 띠의 머리말 — 「띠 · 분할선에서 가로로 √8 안쪽」. */
const bandLabel = (best: number): string => `띠 — 가로 거리 √${num(best)} 안쪽`;

/* ── 걸음 재생 패널 — 걸음 기록 한 줄을 무대 한 장으로 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 제목의 뒤쪽. */
function titleOf(s: Step): string {
  switch (s.kind) {
    case "sort":
      return "x 순서로 정렬";
    case "base":
      return `기저 ${list(s.span)}`;
    case "merge":
      return `분할선 x = ${s.splitX} · 두 절반을 합친다`;
    case "strip":
      return `분할선 x = ${s.splitX} 옆 띠`;
    case "root":
      return "제곱근을 한 번";
  }
}

/** 걸음 설명 한두 문장 — 기록의 값에서 만든다. */
function textOf(s: Step): string {
  switch (s.kind) {
    case "sort":
      return `점 ${num(s.span.length)} 개를 x 순서로 한 번 정렬합니다. 재귀는 이 목록의 이어진 토막을 맡습니다.`;
    case "base": {
      const q = s.pairs[0];
      return q === undefined
        ? "점이 하나라 비교할 쌍이 없습니다."
        : `점이 ${num(s.span.length)} 개라 기저입니다. ${list(s.span)}${을를(tail(s.span))} 직접 비교해 best = ${num(s.best)} 입니다.`;
    }
    case "merge":
      return `점이 ${num(s.span.length)} 개라 x = ${s.splitX} 에서 반으로 가릅니다. 두 절반이 낸 best 중 작은 ${num(s.opened)}${을를(s.opened)} 잡고, 두 byY 를 합쳐 y 순서 목록 하나로 만듭니다.`;
    case "strip": {
      const compared = s.checks.filter((c) => !c.stop).length;
      const stops = s.checks.length - compared;
      return `분할선에서 가로 차의 제곱이 ${num(s.opened)} 보다 작은 ${num(s.strip.length)} 점이 띠에 듭니다. y 순서로 읽으며 ${num(compared)} 번 비교하고 ${num(stops)} 번 멈춰, best 가 ${num(s.best)}${이가(s.best)} 됩니다.`;
    }
    case "root":
      return `지금까지 다룬 값은 거리의 제곱입니다. 제곱근을 한 번 부르면 답 ${dist(s.answer)} 이 나옵니다.`;
  }
}

/** 점 목록 끝의 조사 받침 — 닫는 괄호 앞의 수. */
const tail = (ps: readonly Point[]): number => (ps.at(-1) as Point)[1];

/** 걸음 하나의 무대. `run` 은 그 걸음까지의 기본 연산 누적이다. */
function stageOf(s: Step, run: number): GraphStep {
  const sorted = (WALK_RUN.steps[0] as Extract<Step, { kind: "sort" }>).sorted;
  const inSpan = (p: Point) => has(s.span, p);
  const xRow = {
    label: "x 순서",
    values: sorted.map(pt),
    slots: SLOTS,
    states: Object.fromEntries(
      sorted.flatMap((p, k) =>
        s.kind === "root" || inSpan(p) ? [] : [[k, "out" as CellState]],
      ),
    ),
  };
  const byYRow = (ps: readonly Point[], state?: CellState) => ({
    label: "byY",
    values: ps.map(pt),
    slots: SLOTS,
    ...(state
      ? { states: Object.fromEntries(ps.map((_, k) => [k, state])) }
      : {}),
  });
  const stripRow = (
    ps: readonly Point[],
    states?: Record<number, CellState>,
  ) => ({
    label: "strip",
    values: ps.map(pt),
    slots: SLOTS,
    ...(states ? { states } : {}),
  });
  const vars = `기본 연산 누적 ${num(run)}`;
  const hidden = PAIRS.map(() => ({ hidden: true }));
  const nodeState = (p: Point): CellState | undefined =>
    s.kind === "root" || inSpan(p) ? undefined : "out";
  const group = (label: string) => [{ members: s.span.map(idOf), label }];

  switch (s.kind) {
    case "sort":
      return {
        nodes: WALK.map(() => ({})),
        edges: hidden,
        groups: [],
        rules: [],
        bands: [],
        strips: [xRow, byYRow([]), stripRow([])],
        calc: null,
        vars,
      };
    case "base": {
      const ids = new Set(s.pairs.map((q) => `${idOf(q.a)}-${idOf(q.b)}`));
      const bestPair = s.pairs.find((q) => q.d === s.best);
      return {
        nodes: WALK.map((p) => {
          const st = nodeState(p);
          return st ? { state: st } : { state: "read" as const };
        }),
        edges: PAIRS.map(([a, b]) =>
          ids.has(`${a}-${b}`) || ids.has(`${b}-${a}`)
            ? { state: "focus" as const, label: num(s.best) }
            : { hidden: true },
        ),
        groups: group(`기저 · 점 ${num(s.span.length)}`),
        rules: [],
        bands: [],
        strips: [xRow, byYRow(s.byY, "focus"), stripRow([])],
        calc: bestPair
          ? {
              expr: `D(${pt(bestPair.a)}, ${pt(bestPair.b)}) =`,
              result: num(s.best),
            }
          : null,
        vars,
      };
    }
    case "merge":
      return {
        nodes: WALK.map((p) => {
          const st = nodeState(p);
          return st ? { state: st } : {};
        }),
        edges: hidden,
        groups: group(`구간 · 점 ${num(s.span.length)}`),
        rules: [{ x: s.splitX, label: `x = ${s.splitX}` }],
        bands: [],
        strips: [xRow, byYRow(s.byY, "focus"), stripRow([])],
        calc: {
          expr: `min(${num(s.left.best)}, ${num(s.right.best)}) =`,
          result: num(s.opened),
        },
        vars,
      };
    case "strip": {
      const dx2 = new Map(s.dx2.map((d) => [pt(d.p), d.dx2]));
      const improved = s.checks.filter((c) => c.improved);
      const last = improved.at(-1);
      const focusIds = new Set(
        last ? [idOf(last.a), idOf(last.b)] : ([] as number[]),
      );
      const compared = new Map<string, boolean>();
      for (const c of s.checks) {
        if (c.stop) continue;
        compared.set(`${idOf(c.a)}-${idOf(c.b)}`, c === last);
      }
      const r = halfWidth(s.opened);
      return {
        nodes: WALK.map((p) => {
          const st = nodeState(p);
          if (st) return { state: st };
          const value = `dx² ${num(dx2.get(pt(p)) ?? 0)}`;
          if (focusIds.has(idOf(p))) return { value, state: "focus" as const };
          return has(s.strip, p)
            ? { value, state: "read" as const }
            : { value };
        }),
        edges: PAIRS.map(([a, b]) => {
          const key = compared.has(`${a}-${b}`)
            ? `${a}-${b}`
            : compared.has(`${b}-${a}`)
              ? `${b}-${a}`
              : null;
          if (key === null) return { hidden: true };
          const c = s.checks.find(
            (q) => !q.stop && `${idOf(q.a)}-${idOf(q.b)}` === key,
          );
          return {
            state: compared.get(key) ? ("focus" as const) : ("read" as const),
            label: num(c?.d ?? 0),
          };
        }),
        groups: group(`구간 · 점 ${num(s.span.length)}`),
        rules: [{ x: s.splitX, label: `x = ${s.splitX}` }],
        bands: [
          {
            from: s.splitX - r,
            to: s.splitX + r,
            label: bandLabel(s.opened),
          },
        ],
        strips: [
          xRow,
          byYRow(s.byY),
          stripRow(
            s.strip,
            Object.fromEntries(
              s.strip.flatMap((p, k) =>
                focusIds.has(idOf(p))
                  ? [[k, "focus" as CellState]]
                  : [[k, "read" as CellState]],
              ),
            ),
          ),
        ],
        calc: {
          expr: `best ${num(s.opened)} →`,
          result: num(s.best),
        },
        vars,
      };
    }
    case "root": {
      const [a, b] = answerPair(WALK);
      const key = PAIRS.findIndex(
        ([x, y]) =>
          (x === idOf(a) && y === idOf(b)) || (x === idOf(b) && y === idOf(a)),
      );
      return {
        nodes: WALK.map((p) =>
          same(p, a) || same(p, b) ? { state: "focus" as const } : {},
        ),
        edges: PAIRS.map((_, k) =>
          k === key
            ? { state: "focus" as const, label: `√${num(s.best)}` }
            : { hidden: true },
        ),
        groups: [],
        rules: [],
        bands: [],
        strips: [xRow, byYRow([]), stripRow([])],
        calc: { expr: `√${num(s.best)} =`, result: dist(s.answer) },
        vars,
      };
    }
  }
}

/** 왼쪽 절반까지의 걸음과 나머지 — 패널 두 벌로 가른다. 가르는 자리는 첫 띠 걸음 다음이다. */
const FIRST_STRIP = WALK_RUN.steps.findIndex((s) => s.kind === "strip");

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): {
  walkLeft: SimStep[];
  walkRight: SimStep[];
} {
  let run = 0;
  const all: SimStep[] = WALK_RUN.steps.map((s) => {
    run += ops(s.counted);
    return {
      title: `${s.tag} ${titleOf(s)}`,
      text: textOf(s),
      ...stageOf(s, run),
    };
  });
  return {
    walkLeft: all.slice(0, FIRST_STRIP + 1),
    walkRight: all.slice(FIRST_STRIP + 1),
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

/* ── 「아이디어를 떠올리는 과정」의 시도 다섯 — 수치는 실행과 식에서 ── */

function approaches(): Approach[] {
  const v = ladderValues();
  const [a, b] = answerPair(WALK);
  const truth = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  return [
    {
      name: "모든 쌍 비교",
      idea: "쌍을 하나도 거르지 않고 전부 재서 가장 작은 제곱 거리를 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(MAX_N)} 에서 기본 연산 ${num(v.at)} 번 · ${seconds(v.at)}`,
          ok: false,
        },
      ],
      lesson: "먼 쌍을 재기 전에 거르려면 점이 자리 순서로 놓여 있어야 한다",
    },
    {
      name: "x 순서로 이웃한 쌍만 비교",
      idea: "x 로 정렬한 뒤 바로 옆 점끼리만 잰다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 제곱 거리 ${num(v.near)} — 답 ${num(truth)} 인 ${pt(a)}–${pt(b)} 를 놓친다`,
          ok: false,
        },
      ],
      lesson:
        "가까운 두 점이 x 순서로 이웃한다는 보장이 없다 — 이웃 대신 반으로 갈라 보자",
    },
    {
      name: "반으로 가르기만",
      idea: "x 순서로 반씩 갈라 두 절반을 풀고, 두 절반에 걸친 쌍은 전부 잰다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `거리 계산이 쌍의 수 그대로 — n = ${num(MAX_N)} 에서 ${num(v.at)} 번`,
          ok: false,
        },
      ],
      lesson:
        "걸친 쌍 가운데 두 절반의 답보다 가까울 수 있는 것은 분할선 가까이에만 있다",
    },
    {
      name: "분할선 옆 띠 안의 쌍을 모두 비교",
      idea: "두 절반의 답 δ 를 폭으로 분할선 양옆 띠만 남기고, 띠 안의 쌍은 전부 잰다",
      verdict: "drop",
      checks: [
        { label: "균등 배치", value: "띠가 작아 빠르다", ok: true },
        {
          label: "한 세로줄",
          value: `띠가 구간 전체 — 점 4 배에 ${v.growth.toFixed(2)} 배, n = ${num(MAX_N)} 어림 ${num(Math.round(v.guess))} 번 · ${seconds(v.guess)}`,
          ok: false,
        },
      ],
      lesson: "띠를 y 순서로 늘어놓으면 y 차가 δ 이상인 자리에서 멈출 수 있다",
    },
    {
      name: "분할선 띠",
      idea: "띠를 y 순서로 읽으며 y 차가 δ 이상이면 그 자리에서 멈춘다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${num(MAX_N)} 균등 ${num(v.mineUniform)} 번 · 한 세로줄 ${num(v.mineColumn)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 재귀가 가른 구간 — 나무 한 장 ── */

function treeScene() {
  const steps = WALK_RUN.steps;
  const key = (ps: readonly Point[]) => list(ps);
  const children = new Map<string, string[]>();
  const info = new Map<string, { label: string; value: string }>();
  for (const s of steps) {
    if (s.kind === "base") {
      info.set(key(s.span), {
        label: list(s.span),
        value: `best ${num(s.best)}`,
      });
    }
    if (s.kind === "merge") {
      children.set(key(s.span), [key(s.left.span), key(s.right.span)]);
    }
    if (s.kind === "strip") {
      info.set(key(s.span), {
        label: `점 ${num(s.span.length)} · x = ${s.splitX}`,
        value: `best ${num(s.best)}`,
      });
    }
  }
  const root = key(WALK);
  const at = treeLayout([root], children);
  const nodes: GraphNode[] = [...at.entries()].map(([node, p]) => {
    const id = String(node);
    return {
      id,
      // 잎 이름이 기본 폭보다 넓어 왼쪽 끝 잎이 그림 밖으로 나가지 않게 한 칸의 4 분의 1 만큼 민다.
      x: p.x + 0.25,
      y: p.y,
      label: info.get(id)?.label ?? id,
      value: info.get(id)?.value,
    };
  });
  const edges = [...children.entries()].flatMap(([from, kids]) =>
    kids.map((to) => ({ from, to, kind: "tree" as const })),
  );
  return { nodes, edges };
}

/* ── 칸 논증 — 분할선 위 δ × 2δ 직사각형을 δ/2 칸 여덟으로 ── */

function cellsScene() {
  const nodes: GraphNode[] = [];
  for (const row of [0, 1]) {
    for (const [k, x] of [-1.5, -0.5, 0.5, 1.5].entries()) {
      nodes.push({
        id: `c${row}${k}`,
        x,
        y: row,
        label: x < 0 ? "왼쪽 칸" : "오른쪽 칸",
        value: "점 ≤ 1",
      });
    }
  }
  return nodes;
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-strip": () => {
    const s = TOP_STRIP;
    const [a, b] = answerPair(WALK);
    const r = halfWidth(s.opened);
    const key = PAIRS.findIndex(
      ([x, y]) =>
        (x === idOf(a) && y === idOf(b)) || (x === idOf(b) && y === idOf(a)),
    );
    const [ea, eb] = PAIRS[key] as [number, number];
    return (
      <NodeGraph
        title={`전개 입력 여덟 점 — 분할선 x = ${s.splitX} 과 그 양옆의 띠, 답인 두 점`}
        directed={false}
        unit={PLANE_UNIT}
        nodes={planeNodes(
          () => undefined,
          (p) =>
            same(p, a) || same(p, b)
              ? "focus"
              : has(s.strip, p)
                ? "read"
                : undefined,
        )}
        edges={[
          {
            from: ea,
            to: eb,
            state: "focus",
            label: `√${num(s.best)}`,
          },
        ]}
        rules={[{ x: s.splitX, label: `분할선 x = ${s.splitX}` }]}
        bands={[
          { from: s.splitX - r, to: s.splitX + r, label: bandLabel(s.opened) },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`점 n = ${num(MAX_N)} · 좌표는 절댓값 10^9 이하의 정수 · 기본 연산 1 초에 ${num(PER_SECOND)} 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-tree": () => {
    const t = treeScene();
    return (
      <NodeGraph
        title="재귀가 가른 구간 — 마디마다 분할선과 그 구간이 올려 보내는 best"
        directed={false}
        unit={{ x: 150, y: 80 }}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
  "build-strip": () => {
    const s = TOP_STRIP;
    const r = halfWidth(s.opened);
    const dx2 = new Map(s.dx2.map((d) => [pt(d.p), d.dx2]));
    return (
      <NodeGraph
        title={`맨 위 단계의 띠 — 점 아래 수는 분할선 x = ${s.splitX} 에서 가로 차의 제곱`}
        directed={false}
        unit={PLANE_UNIT}
        nodes={planeNodes(
          (p) => `dx² ${num(dx2.get(pt(p)) ?? 0)}`,
          (p) => (has(s.strip, p) ? "read" : "out"),
        )}
        edges={[]}
        rules={[{ x: s.splitX, label: `x = ${s.splitX}` }]}
        bands={[
          { from: s.splitX - r, to: s.splitX + r, label: bandLabel(s.opened) },
        ]}
        strips={[
          { label: "byY", values: s.byY.map(pt), slots: SLOTS },
          {
            label: "strip",
            values: s.strip.map(pt),
            slots: SLOTS,
            states: Object.fromEntries(s.strip.map((_, k) => [k, "read"])),
          },
        ]}
      />
    );
  },
  "math-cells": () => (
    <NodeGraph
      title={`p 의 y 부터 위로 δ · 분할선 양옆으로 δ 인 직사각형 — δ/2 칸 ${num(CELL_BOUND + 1)} 개`}
      directed={false}
      unit={{ x: 96, y: 60 }}
      nodes={cellsScene()}
      edges={[]}
      rules={[{ x: 0, label: "분할선" }]}
      bands={[{ from: -2, to: 2, label: "가로 거리 δ 안쪽" }]}
    />
  ),
  "walk-left": () => <Film spec={walkLeft as unknown as PlayerSpec} />,
  "walk-right": () => <Film spec={walkRight as unknown as PlayerSpec} />,
};
