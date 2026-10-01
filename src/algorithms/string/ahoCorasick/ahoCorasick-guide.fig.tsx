/**
 * `ahoCorasick-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 트라이의 모양 · 실패 링크 · 출력 링크 · 걸음마다의 상태는
 * 증명 사이드카(`-guide.proof.ts`)의 기록에서 받고, 그 기록이 정본(`-guide.ref.ts`)과 같은 자동자를
 * 가리키는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 트라이는 `NodeGraph` 로 그리고, 자리는 손으로 두지 않고 부모 관계에서 `treeLayout` 으로 낸다(트라이
 * 가이드와 같은 방식). 노드 이름은 그 노드의 **경로 문자열**이고(뿌리만 「뿌리」), 글자는 부모에서
 * 들어오는 간선에 붙는다. **간선은 세 종류다** — 트라이의 간선은 굵은 실선(`tree`), 실패 링크는
 * 대시(`back`), 출력 링크는 짧은 점선(`cross`)이다. 선 모양이 종류를 가르므로 흑백에서도 갈린다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `ahoCorasick-guide.test.ts` 가 잰다. 무대는 「그래프」(`stage: "graph"`)다 — 트라이 전체와 링크 둘을
 * 첫 걸음부터 두고, 아직 안 생긴 링크는 흐린 선(`state: "out"`)으로 둔다(SPEC §13 트리 줄).
 */

import type { ReactElement } from "react";
import { 을를 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import { LayerBars } from "../../../_viz/patterns/LayerBars";
import {
  type EdgeKind,
  type EdgeState,
  type GraphEdge,
  type GraphNode,
  NodeGraph,
  NodeGraphFilm,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphLayout, GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  inPatternLink,
  LIMIT_TEXT,
  LIMIT_TOTAL,
  LONG_M,
  type NodeInfo,
  nodeName,
  nodesOf,
  num,
  originCosts,
  SHARED_K,
  SKIP,
  secondsOf,
  showMatches,
  TWO_HOP,
  WALK_PATTERNS,
  WALK_TEXT,
  type WalkStep,
  walkSteps,
} from "./ahoCorasick-guide.proof.ts";
import { ahoCorasick, type Match } from "./ahoCorasick-guide.ref.ts";
import { acScan } from "./ahoCorasick-guide.sim.ts";

const WALK_P: string[] = [...WALK_PATTERNS];

/** 노드 id — 경로 문자열. 뿌리는 빈 문자열이라 따로 이름을 둔다. */
const idOf = (path: string): string => (path === "" ? "root" : path);

/** 트리 그림의 격자 — 깊이 사이에 간선 글자가 들어갈 틈을 둔다. */
const TREE_UNIT = { x: 96, y: 78 } as const;

/** 노드 목록(만든 차례)에서 나무 자리를 낸다. 가로는 두 배로 벌려 링크가 지날 틈을 둔다. */
function placeTree(
  nodes: readonly NodeInfo[],
): Map<string, { x: number; y: number }> {
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.parent === null) continue;
    children.set(n.parent, [...(children.get(n.parent) ?? []), n.path]);
  }
  const xy = treeLayout([""], children);
  return new Map([...xy].map(([p, v]) => [String(p), { x: v.x * 2, y: v.y }]));
}

/** 끝나는 패턴 — 노드의 값 칸에 적는다. */
const endsText = (n: NodeInfo): string =>
  n.ends.length === 0 ? "" : `끝 ${n.ends.join(" · ")} 번`;

/**
 * 실패 링크 간선의 휨 — 뿌리로 가는 링크는 오른쪽으로 크게, 그 밖은 조금 휘어 트라이의 간선과
 * 겹치지 않게 한다. 값은 모양만 정한다.
 */
function linkBend(n: NodeInfo): number {
  if (n.link === "") return n.depth === 1 ? 0.35 : -0.25;
  return 0.12;
}

interface TreeOpts {
  readonly value?: (n: NodeInfo) => string;
  readonly state?: (n: NodeInfo) => CellState | undefined;
  readonly treeState?: (child: NodeInfo) => EdgeState | undefined;
  /** 실패 링크를 그린다. `false` 면 트라이만. */
  readonly links?: boolean;
  /** 실패 링크 대신 쓸 링크(헷갈리기 쉬운 모양 · 변이가 만든 모양). */
  readonly linkOf?: (n: NodeInfo) => string;
  readonly linkState?: (n: NodeInfo) => EdgeState | undefined;
  /** 출력 링크를 그린다. */
  readonly outs?: boolean;
  readonly outState?: (n: NodeInfo) => EdgeState | undefined;
}

/** 자동자 하나를 정적 그래프로 — 트라이 간선 · 실패 링크 · 출력 링크. */
function automatonOf(
  nodes: readonly NodeInfo[],
  opts: TreeOpts = {},
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const xy = placeTree(nodes);
  const gnodes = nodes.map((n) => {
    const at = xy.get(n.path) as { x: number; y: number };
    const state = opts.state?.(n);
    return {
      id: idOf(n.path),
      label: nodeName(n.path),
      x: at.x,
      y: at.y,
      value: opts.value ? opts.value(n) : endsText(n),
      ...(state ? { state } : {}),
    };
  });
  const edges: GraphEdge[] = [];
  for (const n of nodes) {
    if (n.parent === null) continue;
    const state = opts.treeState?.(n);
    edges.push({
      from: idOf(n.parent),
      to: idOf(n.path),
      kind: "tree",
      label: n.path.at(-1) as string,
      ...(state ? { state } : {}),
    });
  }
  if (opts.links !== false) {
    for (const n of nodes) {
      if (n.parent === null) continue;
      const target = opts.linkOf ? opts.linkOf(n) : n.link;
      const state = opts.linkState?.(n);
      edges.push({
        from: idOf(n.path),
        to: idOf(target),
        kind: "back",
        bend: linkBend({ ...n, link: target }),
        ...(state ? { state } : {}),
      });
    }
  }
  if (opts.outs === true) {
    for (const n of nodes) {
      if (n.out === null) continue;
      const state = opts.outState?.(n);
      edges.push({
        from: idOf(n.path),
        to: idOf(n.out),
        kind: "cross",
        bend: -0.3,
        ...(state ? { state } : {}),
      });
    }
  }
  return { nodes: gnodes, edges };
}

/* ── 전개 입력의 자동자 — 정본과 같은지는 증명 사이드카가 확인했다 ── */

const NODES = nodesOf(WALK_P);
const BY_PATH = new Map(NODES.map((n) => [n.path, n]));
const STEPS = walkSteps();

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const c = originCosts();
  const t = (v: number) => `${num(v)} 번 · ${secondsOf(v)}`;
  return [
    {
      name: "패턴마다 모든 시작 자리에서 대조",
      idea: "패턴을 하나씩 꺼내 텍스트의 모든 시작 자리에서 글자를 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "입력 가", value: t(c.brute.a), ok: false },
      ],
      lesson:
        "패턴들이 함께 가진 앞 97 글자를 패턴마다, 시작 자리마다 다시 읽는다 — 트라이에 담으면 어떨까",
    },
    {
      name: "시작 자리마다 트라이를 내려가기",
      idea: "패턴을 트라이 하나에 담고, 텍스트의 시작 자리마다 뿌리에서 새로 내려간다",
      verdict: "drop",
      checks: [
        { label: "입력 가", value: t(c.restart.a), ok: true },
        { label: "입력 나", value: t(c.restart.b), ok: false },
      ],
      lesson:
        "시작 자리를 옮길 때마다 뿌리로 돌아가 읽은 것을 버린다 — 패턴 하나라면 실패 함수가 그것을 막는다",
    },
    {
      name: "패턴마다 실패 함수",
      idea: "패턴마다 실패 함수를 만들어 텍스트를 한 번씩 읽는다",
      verdict: "drop",
      checks: [
        { label: "입력 나", value: t(c.kmp.b), ok: true },
        { label: "입력 가", value: t(c.kmp.a), ok: false },
      ],
      lesson:
        "텍스트를 패턴 수만큼 다시 읽는다 — 실패 함수를 트라이 하나 위에 두면 한 번에 끝나지 않을까",
    },
    {
      name: "트라이 위의 실패 링크",
      idea: "패턴 전부를 담은 트라이의 노드마다 실패 링크를 달고, 텍스트를 한 번만 읽는다",
      verdict: "keep",
      checks: [
        { label: "입력 가", value: t(c.aho.a), ok: true },
        { label: "입력 나", value: t(c.aho.b), ok: true },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 증명 사이드카의 걸음 기록에서 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 패널 간선의 차례 — 트라이 간선 일곱, 실패 링크 일곱, 출력 링크. 걸음의 `edges` 도 같은 차례다. */
interface EdgeSlot {
  readonly kind: EdgeKind;
  /** 트라이 간선 · 실패 링크 · 출력 링크의 출발 노드(경로 문자열). */
  readonly node: NodeInfo;
}

const WALK_GRAPH = automatonOf(NODES, { outs: true });

const SLOTS: EdgeSlot[] = [
  ...NODES.filter((n) => n.parent !== null).map((node) => ({
    kind: "tree" as const,
    node,
  })),
  ...NODES.filter((n) => n.parent !== null).map((node) => ({
    kind: "back" as const,
    node,
  })),
  ...NODES.filter((n) => n.out !== null).map((node) => ({
    kind: "cross" as const,
    node,
  })),
];

/** 패널의 자리 — 전개 입력의 자동자 전체. 첫 걸음부터 이 자리를 쓴다. */
export const LAYOUT: GraphLayout = {
  nodes: WALK_GRAPH.nodes.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
    label: n.label as string,
  })),
  edges: WALK_GRAPH.edges.map((e) => ({
    from: e.from,
    to: e.to,
    ...(e.bend !== undefined ? { bend: e.bend } : {}),
  })),
  unit: TREE_UNIT,
};

type CharStep = Extract<WalkStep, { kind: "char" }>;

function stepTitle(s: WalkStep): string {
  if (s.kind === "build") return `T${s.t} 패턴 셋을 트라이에 담는다`;
  if (s.kind === "links") return `T${s.t} 링크와 전이표를 채운다`;
  if (s.kind === "sort") return `T${s.t} 시작 자리 순서로 맞춘다`;
  return `T${s.t} 자리 ${s.pos} 의 글자 ${s.ch}`;
}

function stepText(s: WalkStep): string {
  if (s.kind === "build") {
    return `${WALK_P.join(" · ")} 를 트라이 하나에 담았습니다. he 와 hers 가 앞 두 글자를 함께 써서 노드는 뿌리를 포함해 ${NODES.length} 개입니다. 흐린 대시와 점선은 다음 걸음에 매길 실패 링크와 출력 링크 자리입니다.`;
  }
  if (s.kind === "links") {
    const outs = NODES.filter((n) => n.out !== null);
    return `얕은 노드부터 실패 링크를 매겼습니다. 뿌리가 아닌 곳을 가리키는 링크는 ${NODES.filter(
      (n) => n.parent !== null && n.link !== "",
    )
      .map((n) => `${n.path} → ${n.link}`)
      .join(
        " · ",
      )} 이고, 출력 링크는 ${outs.map((n) => `${n.path} → ${n.out}`).join(" · ")} 하나입니다.`;
  }
  if (s.kind === "sort") {
    return `찾은 차례는 끝난 자리의 차례였습니다. 시작 자리 순서로 맞춰 ${showMatches(s.result)}${을를(showMatches(s.result))} 돌려줍니다.`;
  }
  const from = nodeName(s.from);
  const move =
    s.how === "child"
      ? `${from === "뿌리" ? "뿌리" : `${from} 노드`}에 ${s.ch} 자식이 있어 ${s.to} 노드로 내려갑니다.`
      : s.how === "root"
        ? `${from === "뿌리" ? "뿌리" : `${from} 노드`}의 ${s.ch} 칸이 뿌리라 뿌리에 머뭅니다.`
        : `${from} 노드에는 ${s.ch} 자식이 없고, 그 칸에는 실패 링크 ${s.via.map(nodeName).join(" → ")} 에서 물려받은 ${s.to} 노드가 적혀 있습니다.`;
  const got =
    s.found.length === 0
      ? "이 자리에서 끝나는 패턴은 없습니다."
      : s.chain.length > 1
        ? `출력 링크를 따라 ${s.chain.join(" → ")} 에서 매칭 ${showMatches(s.found)} 를 거둡니다.`
        : `${s.to} 노드에서 패턴이 끝나 매칭 ${showMatches(s.found)} 를 거둡니다.`;
  return `${move} ${got}`;
}

function stepCalc(s: WalkStep): SimStep["calc"] {
  if (s.kind === "build")
    return { expr: "노드 수 =", result: `${NODES.length}` };
  if (s.kind === "links") {
    return {
      expr: "link[she] = next[h][e] =",
      result: nodeName(BY_PATH.get("she")?.link ?? ""),
    };
  }
  if (s.kind === "sort") {
    return { expr: "found.sort(byPosition) =", result: showMatches(s.result) };
  }
  return {
    expr: `next[${nodeName(s.from)}][${s.ch}] =`,
    result: nodeName(s.to),
  };
}

/** 걸음 하나의 무대 — 노드 · 간선 · 텍스트 띠 · 찾은 매칭 띠. */
function stepStage(s: WalkStep): GraphStep {
  const c = s.kind === "char" ? (s as CharStep) : null;
  const read = new Set<string>();
  const focus = new Set<string>();
  if (s.kind === "build") for (const n of NODES) focus.add(n.path);
  if (c) {
    focus.add(c.to);
    read.add(c.from);
    for (const v of c.via) read.add(v);
    for (const t of c.chain.slice(1)) read.add(t);
  }
  const nodes = LAYOUT.nodes.map((ln) => {
    const path = ln.id === "root" ? "" : String(ln.id);
    const n = BY_PATH.get(path) as NodeInfo;
    const state: CellState | undefined = focus.has(path)
      ? "focus"
      : read.has(path)
        ? "read"
        : undefined;
    return { value: endsText(n), ...(state ? { state } : {}) };
  });
  // 이번 걸음에 지난 간선 — 자식으로 내려간 트라이 간선, 물려받은 칸을 정한 실패 링크와 그 끝의 자식 간선.
  const usedTree = new Set<string>();
  const usedLink = new Set<string>();
  if (c) {
    if (c.how === "child") usedTree.add(c.to);
    if (c.how === "inherit") {
      let at = c.from;
      for (const v of c.via) {
        usedLink.add(at);
        at = v;
      }
      usedTree.add(c.to);
    }
  }
  const usedOut = new Set<string>(c ? c.chain.slice(0, -1) : []);
  const edges = SLOTS.map((slot) => {
    const p = slot.node.path;
    if (slot.kind === "tree") {
      const state: EdgeState | undefined =
        s.kind === "build" ? "focus" : usedTree.has(p) ? "read" : undefined;
      return {
        kind: "tree" as const,
        label: p.at(-1) as string,
        ...(state ? { state } : {}),
      };
    }
    const before = s.kind === "build";
    const made = s.kind === "links";
    const used = slot.kind === "back" ? usedLink.has(p) : usedOut.has(p);
    const state: EdgeState | undefined = before
      ? "out"
      : made
        ? "focus"
        : used
          ? "read"
          : undefined;
    return { kind: slot.kind, ...(state ? { state } : {}) };
  });
  const textStates: Record<number, CellState> = {};
  for (let i = 0; i < WALK_TEXT.length; i++) {
    if (c && i === c.pos) textStates[i] = "read";
    else if (s.kind !== "sort" && (!c || i > c.pos)) textStates[i] = "out";
  }
  const found: readonly Match[] =
    s.kind === "sort" ? s.result : c ? c.sofar : [];
  const foundStates: Record<number, CellState> = {};
  if (c)
    for (let i = found.length - c.found.length; i < found.length; i++)
      foundStates[i] = "focus";
  if (s.kind === "sort")
    for (let i = 0; i < found.length; i++) foundStates[i] = "focus";
  const total = ahoCorasick(WALK_TEXT, WALK_P).length;
  return {
    nodes,
    edges,
    strips: [
      {
        label: "텍스트",
        values: [...WALK_TEXT],
        ...(Object.keys(textStates).length > 0 ? { states: textStates } : {}),
      },
      {
        label: s.kind === "sort" ? "돌려주는 매칭" : "찾은 매칭",
        values: found.map((m) => `${m.patternIndex}@${m.position}`),
        slots: total,
        ...(Object.keys(foundStates).length > 0 ? { states: foundStates } : {}),
      },
    ],
    calc: stepCalc(s),
    vars: null,
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 증명 사이드카의 걸음 기록(`walkSteps`)에서 만든다. `.sim.ts` 의
 * `steps` 는 이 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return STEPS.map((s) => ({
    title: stepTitle(s),
    text: stepText(s),
    ...stepStage(s),
  }));
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
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

/* ── 그림마다의 모양 ── */

const TWO_NODES = nodesOf([...TWO_HOP]);
const SKIP_NODES = nodesOf([...SKIP]);

/** 한 패턴 안에서만 찾은 링크 — 증명 사이드카의 표와 같은 함수. */
const inPatternLinkOf = (n: NodeInfo): string => inPatternLink(n.path, WALK_P);

export const FIGS: Record<string, () => ReactElement> = {
  "concept-matches": () => {
    const found = ahoCorasick(WALK_TEXT, WALK_P);
    return (
      <LayerBars
        title={`${WALK_TEXT} 에서 ${WALK_P.join(" · ")} 가 시작하는 자리 — 세 매칭이 겹쳐 있다`}
        values={[...WALK_TEXT]}
        valuesLabel="텍스트"
        indexLabel="자리"
        groups={[
          found.map((m) => {
            const p = WALK_P[m.patternIndex] as string;
            return {
              label: `${m.patternIndex} 번 ${p}`,
              from: m.position,
              to: m.position + p.length - 1,
              note: `자리 ${m.position} 에서 시작`,
            };
          }),
        ]}
      />
    );
  },
  "concept-automaton": () => {
    const g = automatonOf(NODES, { outs: true });
    return (
      <NodeGraph
        title={`${WALK_P.join(" · ")} 의 아호–코라식 자동자 — 실선은 트라이, 대시는 실패 링크, 점선은 출력 링크`}
        unit={TREE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`입력 가: 텍스트 a × ${num(LIMIT_TEXT)} · 앞 97 글자가 같은 패턴 ${num(SHARED_K)} 개 · 입력 나: 텍스트 a × ${num(LIMIT_TEXT)} · 패턴 a × ${num(LONG_M)} · 자료 접근 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-fail-links": () => {
    const g = automatonOf(NODES, {
      value: (n) => `깊이 ${n.depth}`,
      treeState: () => "out",
    });
    return (
      <NodeGraph
        title="노드마다 실패 링크 하나 — 대시가 실패 링크, 흐린 실선이 트라이의 간선"
        unit={TREE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "build-read-one": () => {
    const on = new Set(["she", "he", "e", ""]);
    const g = automatonOf(NODES, {
      value: (n) => `깊이 ${n.depth}`,
      state: (n) =>
        n.path === "she" ? "focus" : n.path === "he" ? "read" : "out",
      treeState: (n) => (on.has(n.path) && n.path !== "she" ? "read" : "out"),
      linkState: (n) => (n.path === "she" ? "focus" : "out"),
    });
    return (
      <NodeGraph
        title="노드 she 의 실패 링크 — 진 접미사 he 가 트라이에 노드로 있다"
        unit={TREE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "build-in-pattern": () => {
    const g = automatonOf(NODES, {
      linkOf: inPatternLinkOf,
      linkState: (n) => (inPatternLinkOf(n) !== n.link ? "focus" : undefined),
    });
    return (
      <NodeGraph
        title="한 패턴 안에서만 찾은 링크 — 강조한 셋이 실패 링크와 다르다"
        unit={TREE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "build-two-hop": () => {
    const walk = new Set(["abc", "bc", "c", "cd"]);
    const g = automatonOf(TWO_NODES, {
      state: (n) =>
        n.path === "abcd" ? "focus" : walk.has(n.path) ? "read" : "out",
      treeState: (n) => (n.path === "cd" ? "read" : "out"),
      linkState: (n) =>
        n.path === "abcd"
          ? "focus"
          : n.path === "abc" || n.path === "bc"
            ? "read"
            : "out",
    });
    return (
      <NodeGraph
        title={`${TWO_HOP.join(" · ")} — abcd 의 실패 링크는 abc → bc → c 를 거쳐 cd 에 이른다`}
        unit={TREE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "build-outlink-skip": () => {
    const g = automatonOf(SKIP_NODES, {
      outs: true,
      state: (n) =>
        n.path === "cba" ? "focus" : n.path === "a" ? "read" : undefined,
      outState: (n) => (n.path === "cba" ? "focus" : undefined),
    });
    return (
      <NodeGraph
        title={`${SKIP.join(" · ")} — cba 의 출력 링크는 패턴이 안 끝나는 ba 를 건너뛰어 a 로 간다`}
        unit={TREE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "walk-ac-scan": () => <Film spec={acScan as unknown as PlayerSpec} />,
  "invariant-mutant": () => {
    const g = automatonOf(NODES, {
      linkOf: () => "",
      linkState: (n) => (n.link !== "" ? "focus" : undefined),
    });
    return (
      <NodeGraph
        title="실패 링크를 전부 뿌리로 둔 아호–코라식 자동자 — 강조한 셋이 정본과 다르다"
        unit={TREE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
};

// 그림의 자동자가 정본과 같은가 — 끝나는 패턴의 합이 정본의 매칭 대상과 같은지 한 번 더 맞댄다.
{
  const ends = NODES.flatMap((n) => n.ends).sort((a, b) => a - b);
  if (ends.join(",") !== WALK_P.map((_, i) => i).join(",")) {
    throw new Error("그림의 자동자가 패턴을 빠뜨렸다");
  }
  void LIMIT_TOTAL;
}
