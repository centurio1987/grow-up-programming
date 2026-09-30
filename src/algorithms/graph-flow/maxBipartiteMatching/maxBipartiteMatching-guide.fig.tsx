/**
 * `maxBipartiteMatching-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 매칭 크기는 정본(`-guide.ref.ts`)이 낸 답이고, 걸음마다의
 * 짝 배열 · 방문 배열 · 호출 스택 · 증가 경로는 정본과 같은 절차에 기록만 덧붙인 사본(`-guide.proof.ts` 의
 * `counted`)이 낸다. 그 사본이 정본과 같은 답을 내는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `maxBipartiteMatching-guide.test.ts` 가 잰다.
 *
 * **두 쪽은 두 줄로 놓는다.** 왼쪽 정점을 `x = 0` 의 세로 줄에, 오른쪽 정점을 `x = 2.4` 의 세로 줄에
 * 세운다 — 간선이 언제나 두 줄 사이를 건너므로 이분 그래프라는 것이 배치에서 바로 보인다. 좌표는 값이
 * 아니라 배치다.
 *
 * **매칭은 간선 종류로 그린다.** 매칭 안 간선은 굵은 실선(`kind: "tree"`), 매칭 밖 간선은 가는 실선이다.
 * 이번 걸음에 짝을 적은 간선은 새로 씀(`focus`), 이번 걸음에 읽은 간선은 읽음(`read`)이다. 무향이라
 * 화살촉을 달지 않는다(`directed: false`). 정점 안의 값은 그 정점의 짝이다 — 오른쪽 정점은 짝 배열
 * `matchR` 의 칸 그대로이고, 왼쪽 정점은 그 칸들에서 거꾸로 읽은 것이라 재배정 도중에는 짝이 둘로
 * 보이는 걸음이 있다(T7). 방문 배열 `seen` 과 호출 스택은 무대 아래 띠 둘이다.
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
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  CONTRAST_PATHS,
  comma,
  E_LIMIT,
  type Edge,
  en,
  flippedPath,
  greedy,
  L_LIMIT,
  opsOf,
  reachAndCover,
  type Step,
  WALK,
  WALK_EDGES,
  WALK_L,
  WALK_R,
  WORST_4,
  walkStep,
} from "./maxBipartiteMatching-guide.proof.ts";
import { maxBipartiteMatching } from "./maxBipartiteMatching-guide.ref.ts";
import { matchWalk } from "./maxBipartiteMatching-guide.sim.ts";

const X_RIGHT = 2.4;

/** 두 쪽을 두 줄로 — 왼쪽 `l` 개 · 오른쪽 `r` 개. */
function columns(l: number, r: number): { id: string; x: number; y: number }[] {
  return [
    ...Array.from({ length: l }, (_, u) => ({ id: `L${u}`, x: 0, y: u })),
    ...Array.from({ length: r }, (_, v) => ({
      id: `R${v}`,
      x: X_RIGHT,
      y: v,
    })),
  ];
}

/**
 * 전개 입력에서 가운데가 겹치는 두 간선 — `L0R1` 과 `L1R0` 이 두 줄 사이에서 X 자로 엇갈려 머리말이
 * 한자리에 겹친다. 하나는 아래로, 하나는 위로 조금 휘어 가운데를 갈라 놓는다. 휘는 정도는 배치에 적어 두므로
 * 걸음 사이에 선 모양이 바뀌지 않는다.
 */
const BEND: Readonly<Record<string, number>> = { L0R1: -0.15, L1R0: 0.15 };
const bendOf = (e: Edge): { bend?: number } =>
  BEND[en(e)] === undefined ? {} : { bend: BEND[en(e)] as number };

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: columns(WALK_L, WALK_R),
  edges: WALK_EDGES.map((e) => ({
    from: `L${e[0]}`,
    to: `R${e[1]}`,
    ...bendOf(e),
  })),
  directed: false,
};

const ANSWER = maxBipartiteMatching(WALK_L, WALK_R, WALK_EDGES);

/** 짝 배열에서 왼쪽 정점의 짝을 거꾸로 읽는다 — 재배정 도중에는 둘일 수 있다. */
const leftMates = (matchR: readonly number[], u: number): number[] =>
  matchR.flatMap((x, v) => (x === u ? [v] : []));

const mateText = (xs: readonly string[]): string =>
  xs.length === 0 ? "짝 없음" : `짝 ${xs.join("·")}`;

/** 짝 배열 하나로 정점 값과 간선 종류를 낸다. */
function matchingScene(
  l: number,
  r: number,
  edges: readonly Edge[],
  matchR: readonly number[],
  opts: {
    node?: (id: string) => { value?: string; state?: CellState } | undefined;
    edge?: (e: Edge) => { state?: GraphEdge["state"]; label?: string };
  } = {},
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = columns(l, r).map((n) => {
    const id = Number(n.id.slice(1));
    const value = n.id.startsWith("L")
      ? mateText(leftMates(matchR, id).map((v) => `R${v}`))
      : mateText((matchR[id] as number) < 0 ? [] : [`L${matchR[id]}`]);
    const extra = opts.node?.(n.id);
    return { ...n, value, ...extra };
  });
  const walk = edges === WALK_EDGES;
  const out: GraphEdge[] = edges.map(([u, v]) => ({
    from: `L${u}`,
    to: `R${v}`,
    ...(walk ? bendOf([u, v]) : {}),
    ...(matchR[v] === u ? { kind: "tree" as const } : {}),
    ...opts.edge?.([u, v]),
  }));
  return { nodes, edges: out };
}

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행과 식에서 ── */

function approaches(): Approach[] {
  const g = greedy(WALK_L, WALK_R, WALK_EDGES);
  return [
    {
      name: "간선 부분집합 전수",
      idea: "간선의 부분집합을 전부 만들어, 매칭인 것 중 가장 큰 것을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `간선 ${comma(E_LIMIT)} 개면 부분집합 2^${comma(E_LIMIT)} 개`,
          ok: false,
        },
        { label: "메모리", value: "부분집합 하나를 적는 E 칸", ok: true },
      ],
      lesson:
        "검사한 부분집합이 매칭이었다는 사실을 다음 부분집합에 쓰지 않는다 — 매칭 하나를 쥐고 한 칸씩 키우면 어떨까",
    },
    {
      name: "빈자리만 잡는 그리디",
      idea: "왼쪽 정점마다 이웃 목록에서 비어 있는 첫 오른쪽 정점을 잡는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 ${g.size} — 가장 큰 매칭은 ${ANSWER}`,
          ok: false,
        },
        {
          label: "시간",
          value: `기본 연산 E + 이웃 자리 읽기 · 전개 입력에서 ${WALK_EDGES.length + g.reads}`,
          ok: true,
        },
        { label: "메모리", value: "짝 배열 R 칸", ok: true },
      ],
      lesson:
        "이미 짝이 있는 오른쪽 정점에서 멈춘다 — 그 짝을 다른 자리로 옮길 수 있는지 따라가면 어떨까",
    },
    {
      name: "증가 경로 뒤집기",
      idea: "짝이 있는 자리를 만나면 그 짝을 옮길 수 있는지 따라가고, 빈 오른쪽 정점에 도달하면 지나온 경로를 뒤집는다",
      verdict: "keep",
      checks: [
        { label: "답", value: `맞다 — 전개 입력에서 ${ANSWER}`, ok: true },
        {
          label: "시간",
          value: `기본 연산 E + L·R + 이웃 자리 읽기 · 전개 입력에서 ${opsOf(WALK_L, WALK_R, WALK_EDGES)}`,
          ok: true,
        },
        { label: "메모리", value: "짝 배열 · 방문 배열 R 칸씩", ok: true },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차를 실행해 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const L = (u: number): string => `L${u}`;
const R = (v: number): string => `R${v}`;

function stepTitle(s: Step, t: number): string {
  const u = L(s.u);
  const v = s.v === null ? "" : R(s.v);
  switch (s.kind) {
    case "시작":
      return `T${t} ${u} 에서 탐색을 시작한다`;
    case "잇는다":
      return `T${t} ${u}${이가(u)} 빈 ${v}${을를(v)} 받는다`;
    case "내려간다":
      return `T${t} ${v} 의 짝 ${L(s.owner as number)}${으로(L(s.owner as number))} 내려간다`;
    case "넘어간다":
      return `T${t} ${u}${이가(u)} 이미 본 ${v}${을를(v)} 넘긴다`;
    case "옮긴다":
      return `T${t} ${L(s.owner as number)}${이가(L(s.owner as number))} 옮겨 가고 ${u}${이가(u)} ${v}${을를(v)} 받는다`;
    default:
      return `T${t} ${u} 의 탐색이 실패한다`;
  }
}

function stepText(s: Step): string {
  const u = L(s.u);
  const v = s.v === null ? "" : R(s.v);
  switch (s.kind) {
    case "시작":
      return `바깥 반복이 ${u}${을를(u)} 잡습니다. 방문 배열을 전부 거짓으로 다시 채우고 증가 경로 탐색에 들어갑니다.`;
    case "잇는다":
      return `${v}${이가(v)} 아직 안 본 자리이고 짝이 없습니다. 증가 경로의 끝이라 matchR[${s.v}] 에 ${s.u}${을를(String(s.u))} 적고 참을 돌려줍니다.`;
    case "내려간다": {
      const o = L(s.owner as number);
      return `${v}${이가(v)} 아직 안 본 자리라 방문 배열에 적습니다. 짝 ${o}${이가(o)} 있으니, ${o}${이가(o)} 다른 오른쪽 정점으로 옮겨 갈 수 있는지 같은 탐색을 한 번 더 부릅니다.`;
    }
    case "넘어간다":
      return `${v}${은는(v)} 이번 탐색이 이미 본 자리라 다시 보지 않고 다음 이웃으로 갑니다.`;
    case "옮긴다": {
      const o = L(s.owner as number);
      return `안쪽 탐색이 참을 돌려줬습니다. ${o}${이가(o)} 다른 자리를 받았으니 matchR[${s.v}] = ${s.u}${으로(String(s.u))} 고쳐 적습니다.`;
    }
    default:
      return `${u} 의 이웃을 다 봤는데 빈 오른쪽 정점에 도달하지 못했습니다. 아무것도 적지 않고 거짓을 돌려줍니다.`;
  }
}

function stepCalc(s: Step): SimStep["calc"] {
  switch (s.kind) {
    case "시작":
      return {
        expr: "seen.fill(false) →",
        result: `[${s.seen.map((b) => (b ? "T" : "F")).join(", ")}]`,
      };
    case "잇는다":
    case "옮긴다":
      return { expr: `matchR[${s.v}] =`, result: String(s.u) };
    case "내려간다":
      return {
        expr: `augment(matchR[${s.v}]) = augment(`,
        result: `${s.owner})`,
      };
    case "넘어간다":
      return { expr: `seen[${s.v}] =`, result: "true" };
    default:
      return { expr: `augment(${s.u}) =`, result: "false" };
  }
}

/** 걸음 하나의 무대 — 정점 · 간선 · 방문 배열 · 호출 스택. */
function stepStage(s: Step | null): GraphStep {
  const matchR = s?.matchR ?? Array(WALK_R).fill(-1);
  const seen = s?.seen ?? Array(WALK_R).fill(false);
  const write = s !== null && (s.kind === "잇는다" || s.kind === "옮긴다");
  const read = s !== null && (s.kind === "내려간다" || s.kind === "넘어간다");
  const scene = matchingScene(WALK_L, WALK_R, WALK_EDGES, matchR);
  const nodes = scene.nodes.map((n) => {
    let state: CellState | undefined;
    if (s !== null) {
      if (write && (n.id === L(s.u) || n.id === R(s.v as number)))
        state = "focus";
      else if (n.id === L(s.u)) state = "read";
      else if (read && n.id === R(s.v as number)) state = "read";
      else if (s.kind === "내려간다" && n.id === L(s.owner as number))
        state = "read";
    }
    return { value: n.value, ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map(([u, v]) => {
    const kind = matchR[v] === u ? ("tree" as const) : undefined;
    let state: GraphEdge["state"];
    if (s !== null && s.v === v && s.u === u)
      state = write ? "focus" : read ? "read" : undefined;
    return { ...(kind ? { kind } : {}), ...(state ? { state } : {}) };
  });
  const seenStates: Partial<Record<number, CellState>> = {};
  if (s !== null && s.v !== null) {
    if (s.kind === "넘어간다") seenStates[s.v] = "read";
    else if (s.kind === "잇는다" || s.kind === "내려간다")
      seenStates[s.v] = "focus";
  }
  const call = s?.call ?? [];
  return {
    nodes,
    edges,
    strips: [
      {
        label: "seen",
        values: seen.map((b: boolean) => (b ? "T" : "F")),
        slots: WALK_R,
        ...(Object.keys(seenStates).length > 0 ? { states: seenStates } : {}),
      },
      {
        label: "호출 스택",
        values: call.map(L),
        slots: WALK_L,
        ...(call.length > 0
          ? { states: { [call.length - 1]: "read" as const } }
          : {}),
      },
    ],
    calc: s === null ? null : stepCalc(s),
    vars: `size = ${s?.size ?? 0} · 이웃 자리 읽기 ${s?.reads ?? 0}`,
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차를 실행해 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): { matchWalk: SimStep[] } {
  const all: SimStep[] = [
    {
      title: "T1 준비",
      text: "간선 목록을 왼쪽 정점별로 나눠 이웃 목록을 만들고, 짝 배열을 전부 -1 로, 방문 배열을 전부 거짓으로 둡니다. 아직 짝을 지은 간선이 없습니다.",
      ...stepStage(null),
      calc: null,
    },
  ];
  WALK.steps.forEach((s, i) => {
    all.push({
      title: stepTitle(s, i + 2),
      text: stepText(s),
      ...stepStage(s),
    });
  });
  const last = WALK.steps.at(-1) as Step;
  all.push({
    title: `T${WALK.steps.length + 2} 반환`,
    text: `왼쪽 정점을 다 봤습니다. 성공한 탐색의 수 ${WALK.size}${이가(String(WALK.size))} 매칭의 크기이고, 그것을 돌려줍니다.`,
    ...stepStage({ ...last, kind: "실패", call: [] }),
    calc: { expr: "size =", result: String(WALK.size) },
  });
  // 반환 걸음은 무엇도 읽거나 쓰지 않는다 — 실패 걸음의 강조를 걷는다.
  const ret = all.at(-1) as SimStep;
  all[all.length - 1] = {
    ...ret,
    nodes: ret.nodes.map((n) => ({ value: n.value })),
    edges: ret.edges.map((e) => (e.kind ? { kind: e.kind } : {})),
  };
  return { matchWalk: all };
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

/** 증가 경로 L1 의 탐색이 뒤집은 경로 — 그 탐색 직전과 직후. */
const PATH = flippedPath(WALK, 1);
const onPath = (e: Edge): boolean => PATH.edges.some((p) => en(p) === en(e));

export const FIGS: Record<string, () => ReactElement> = {
  "concept-matching": () => {
    const sc = matchingScene(WALK_L, WALK_R, WALK_EDGES, WALK.matchR);
    const pairs = WALK.matchR.flatMap((u, v) => (u < 0 ? [] : [`L${u}R${v}`]));
    return (
      <NodeGraph
        title={`왼쪽 셋 · 오른쪽 셋 · 간선 넷 — 굵은 선이 가장 큰 매칭 {${pairs.join(", ")}}`}
        nodes={sc.nodes}
        edges={sc.edges}
        directed={false}
      />
    );
  },
  "concept-flip": () => {
    const before = matchingScene(WALK_L, WALK_R, WALK_EDGES, PATH.before, {
      edge: (e) =>
        onPath(e)
          ? { state: "read", label: PATH.before[e[1]] === e[0] ? "안" : "밖" }
          : { state: "out" },
    });
    const after = matchingScene(WALK_L, WALK_R, WALK_EDGES, PATH.after, {
      edge: (e) =>
        onPath(e)
          ? { state: "focus", label: PATH.after[e[1]] === e[0] ? "안" : "밖" }
          : { state: "out" },
    });
    const size = (m: readonly number[]) => m.filter((x) => x >= 0).length;
    return (
      <NodeGraphFilm
        title={`증가 경로 ${PATH.names.join(" — ")}${을를(PATH.names.at(-1) as string)} 뒤집는다`}
        frames={[
          {
            id: "전",
            text: `뒤집기 전 — 매칭 크기 ${size(PATH.before)}`,
            scene: { ...before, directed: false },
          },
          {
            id: "후",
            text: `뒤집은 뒤 — 매칭 크기 ${size(PATH.after)}`,
            scene: { ...after, directed: false },
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 L = R = ${comma(L_LIMIT)} · E ≤ ${comma(E_LIMIT)} · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-path": () => {
    const order = new Map(PATH.names.map((n, i) => [n, i]));
    const sc = matchingScene(WALK_L, WALK_R, WALK_EDGES, PATH.before, {
      node: (id) => {
        const i = order.get(id);
        if (i === undefined) return { state: "out" };
        return { state: "read" };
      },
      edge: (e) =>
        onPath(e)
          ? {
              state: "read",
              label: PATH.before[e[1]] === e[0] ? "매칭 안" : "매칭 밖",
            }
          : { state: "out" },
    });
    const nodes = sc.nodes.map((n) => {
      const i = order.get(String(n.id));
      return i === undefined ? n : { ...n, value: `x${i}` };
    });
    return (
      <NodeGraph
        title={`매칭 {L0R0} 위의 증가 경로 — ${PATH.names.join(" — ")}`}
        nodes={nodes}
        edges={sc.edges}
        directed={false}
      />
    );
  },
  "build-contrast": () => {
    const M = walkStep(3).matchR;
    const frames = CONTRAST_PATHS.map(([name, names, es], i) => {
      const inP = (e: Edge) => es.some((p) => en(p) === en(e));
      const sc = matchingScene(WALK_L, WALK_R, WALK_EDGES, M, {
        node: (id) =>
          names.includes(id) ? { state: "read" } : { state: "out" },
        edge: (e) =>
          inP(e)
            ? { state: "read", label: M[e[1]] === e[0] ? "안" : "밖" }
            : { state: "out" },
      });
      return {
        id: String(i + 1),
        text: `${name} — ${names.join(" — ")}`,
        scene: { ...sc, directed: false },
      };
    });
    return (
      <NodeGraphFilm title="같은 매칭 {L0R0} 위의 세 경로" frames={frames} />
    );
  },
  "build-flip-order": () => (
    <Film spec={matchWalk as unknown as PlayerSpec} pick={["T6", "T7", "T8"]} />
  ),
  "walk-film": () => <Film spec={matchWalk as unknown as PlayerSpec} />,
  "related-konig": () => {
    const c = reachAndCover(WALK_L, WALK_R, WALK_EDGES);
    const cover = new Set([
      ...c.coverL.map((u) => `L${u}`),
      ...c.coverR.map((v) => `R${v}`),
    ]);
    const reach = new Set([
      ...c.zl.map((u) => `L${u}`),
      ...c.zr.map((v) => `R${v}`),
    ]);
    const sc = matchingScene(WALK_L, WALK_R, WALK_EDGES, c.matchR, {
      node: (id) => {
        const tags = [
          reach.has(id) ? "도달" : "",
          cover.has(id) ? "덮개" : "",
        ].filter((x) => x !== "");
        return {
          value: tags.join("·"),
          ...(cover.has(id) ? { state: "focus" as const } : {}),
        };
      },
    });
    return (
      <NodeGraph
        title={`짝 없는 왼쪽 정점에서 도달한 정점과 덮개 {${[...cover].join(", ")}}`}
        nodes={sc.nodes}
        edges={sc.edges}
        directed={false}
      />
    );
  },
  "worst-block": () => {
    const n = 4;
    const f = WORST_4;
    const matchR = Array(n).fill(-1);
    // 이 그림의 짝은 정본이 낸 크기와 같은 매칭을 세는 사본의 결과로 그린다.
    const run = reachAndCover(n, n, f.edges);
    for (let v = 0; v < n; v++) matchR[v] = run.matchR[v];
    const sc = matchingScene(n, n, f.edges, matchR);
    return (
      <NodeGraph
        title={`L = R = ${n} 에서 이웃 자리 읽기가 가장 많은 그래프 — 읽기 ${f.best} · 매칭 크기 ${maxBipartiteMatching(n, n, f.edges)}`}
        nodes={sc.nodes}
        edges={sc.edges}
        directed={false}
      />
    );
  },
};
