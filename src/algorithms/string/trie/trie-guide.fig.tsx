/**
 * `trie-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 트라이의 모양 · 걸음마다의 상태 · 변이가 만든 모양은
 * 증명 사이드카(`-guide.proof.ts`)의 기록에서 받고, 그 기록이 정본(`-guide.ref.ts`)과 같은 트라이를
 * 만드는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 트리는 `NodeGraph` 로 그리고, 자리는 손으로 두지 않고 부모 관계에서 `treeLayout` 으로 낸다. 노드
 * 이름은 그 노드의 **경로 문자열**이고(뿌리만 「뿌리」), 글자는 부모에서 들어오는 간선에 붙는다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `trie-guide.test.ts` 가 잰다. 무대는 「그래프」(`stage: "graph"`)다 — 완성된 트라이의 자리를 첫
 * 걸음부터 두고, 아직 없는 노드는 점선으로 둔다(SPEC §13 트리 줄).
 */

import type { ReactElement } from "react";
import { 으로, 을를 } from "../../../../tools/josa.ts";
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
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphLayout, GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  buildTrie,
  countNodes,
  DICT_N,
  LIMIT,
  mutantShapes,
  nodeName,
  num,
  Q,
  SHARED_DICT,
  secondsOf,
  shapeOf,
  type WalkStep,
  WORDS,
  walkSteps,
  worstQueryReads,
  yn,
} from "./trie-guide.proof.ts";
import { Trie } from "./trie-guide.ref.ts";
import { trieOps } from "./trie-guide.sim.ts";

/** 노드 id — 경로 문자열. 뿌리는 빈 문자열이라 따로 이름을 둔다. */
const idOf = (path: string): string => (path === "" ? "root" : path);

/** 트리 그림의 격자 — 깊이 사이에 간선 글자가 들어갈 틈을 둔다. */
const TREE_UNIT = { x: 96, y: 78 } as const;

/** 경로 목록(만든 차례)에서 나무 자리를 낸다. 부모는 경로에서 끝 글자를 뗀 것이다. */
function placeTree(
  paths: readonly string[],
): Map<string, { x: number; y: number }> {
  const children = new Map<string, string[]>();
  for (const p of paths) {
    if (p === "") continue;
    const parent = p.slice(0, -1);
    children.set(parent, [...(children.get(parent) ?? []), p]);
  }
  const xy = treeLayout([""], children);
  return new Map(
    [...xy].map(([p, v]) => [String(p), { x: v.x * 1.25, y: v.y }]),
  );
}

/** 모양 하나를 정적 트리로 — 노드 이름은 경로 문자열, 값은 끝 표시, 간선에 글자. */
function treeOf(
  shape: readonly (readonly [string, boolean])[],
  opts: {
    value?: (path: string, end: boolean) => string;
    state?: (path: string) => CellState | undefined;
    edgeState?: (child: string) => GraphEdge["state"];
  } = {},
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const xy = placeTree(shape.map(([p]) => p));
  const nodes = shape.map(([p, end]) => {
    const at = xy.get(p) as { x: number; y: number };
    const state = opts.state?.(p);
    return {
      id: idOf(p),
      label: nodeName(p),
      x: at.x,
      y: at.y,
      value: opts.value ? opts.value(p, end) : end ? "끝 표시" : "",
      ...(state ? { state } : {}),
    };
  });
  const edges = shape
    .filter(([p]) => p !== "")
    .map(([p]) => {
      const state = opts.edgeState?.(p);
      return {
        from: idOf(p.slice(0, -1)),
        to: idOf(p),
        kind: "tree" as const,
        label: p.at(-1) as string,
        ...(state ? { state } : {}),
      };
    });
  return { nodes, edges };
}

/* ── 전개 입력의 트라이 — 정본의 뿌리와 같은지는 증명 사이드카가 확인했다 ── */

const STEPS = walkSteps();
const FINAL = (STEPS.at(-1) as WalkStep).shape;

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const r = worstQueryReads();
  return [
    {
      name: "목록에 담고 매번 대조",
      idea: "단어를 배열에 담고, 물을 때마다 모든 단어를 앞에서부터 대조한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 하나에 ${num(r.list)} 글자 · ${num(Q)} 번이면 ${num(r.list * Q)} 글자 · ${secondsOf(r.list * Q)}`,
          ok: false,
        },
        { label: "메모리", value: "길이 합만큼", ok: true },
      ],
      lesson:
        "같은 앞부분을 단어마다 다시 읽는다 — 첫 글자로 나눠 담으면 어떨까",
    },
    {
      name: "첫 글자로 나눈 묶음",
      idea: "첫 글자가 같은 단어끼리 묶어 두고, 묶음 하나 안에서만 대조한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `앞 97 글자가 같은 ${num(DICT_N)} 단어가 한 묶음에 들어가 조회 하나에 ${num(r.bucket)} 글자`,
          ok: false,
        },
        { label: "메모리", value: "길이 합만큼", ok: true },
      ],
      lesson: "묶음 안에서도 둘째 글자, 셋째 글자로 계속 나눠야 한다",
    },
    {
      name: "글자마다 갈래 나누기",
      idea: "글자 하나를 읽을 때마다 갈래를 하나 고른다 — 같은 앞부분은 한 번만 적힌다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 하나에 ${num(r.trie)} 글자 · ${num(Q)} 번이면 ${num(r.trie * Q)} 글자`,
          ok: true,
        },
        {
          label: "메모리",
          value: `같은 사전에서 노드 ${num(countNodes(buildTrie(SHARED_DICT)))} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 증명 사이드카의 걸음 기록에서 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 패널의 자리 — 완성된 트라이의 노드와 간선. 첫 걸음부터 이 자리를 쓴다. */
export const LAYOUT: GraphLayout = (() => {
  const t = treeOf(FINAL);
  return {
    nodes: t.nodes.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      label: n.label as string,
    })),
    edges: t.edges.map((e) => ({ from: e.from, to: e.to })),
    unit: TREE_UNIT,
  };
})();

/** 경로 문자열 목록 — `a · p · p` 꼴. */
const letters = (cs: readonly string[]): string => cs.join(" · ");
const nodesText = (ps: readonly string[]): string => ps.join(" · ");

function stepTitle(s: WalkStep): string {
  if (s.kind === "start") return `T${s.t} 빈 트라이`;
  if (s.kind === "query") return `T${s.t} ${s.op}`;
  const part = s.word.slice(s.from, s.to);
  const how =
    s.made.length === 0
      ? "이어 쓴다"
      : s.reused.length === 0
        ? "만든다"
        : "이어 쓰고 만든다";
  return `T${s.t} ${s.op} 의 ${part} — ${how}`;
}

function stepText(s: WalkStep): string {
  if (s.kind === "start") {
    return "빈 트라이는 뿌리 하나입니다. 뿌리는 빈 문자열에 해당하는 노드이고, 점선 노드는 뒤 걸음에서 만들어질 자리입니다.";
  }
  const from = nodeName(s.startAt);
  const fromPlace = s.startAt === "" ? "뿌리에서" : `${from} 노드에서`;
  if (s.kind === "query") {
    const path = s.looks.filter((l) => l.found).map((l) => l.ch);
    if (s.at === null) {
      const miss = s.looks.at(-1)?.ch as string;
      return `뿌리에 ${miss}${으로(miss)} 가는 자식이 없어 nodeAt 이 null 을 돌려줍니다. ${s.queryOp} 는 ${yn(s.answer ?? false)}을 돌려줍니다.`;
    }
    const last = path.at(-1) as string;
    const arrive = `뿌리에서 ${letters(path)}${을를(last)} 따라 ${s.at} 노드에 도착합니다.`;
    return s.queryOp === "search"
      ? `${arrive} search 는 끝 표시까지 보고, 끝 표시가 ${yn(s.answer ?? false)}이라 ${yn(s.answer ?? false)}을 돌려줍니다.`
      : `${arrive} startsWith 는 끝 표시를 보지 않고 도착했으므로 참을 돌려줍니다.`;
  }
  const found = s.looks.filter((l) => l.found).map((l) => l.ch);
  const missing = s.looks.filter((l) => !l.found).map((l) => l.ch);
  const parts: string[] = [];
  if (found.length > 0) {
    const last = found.at(-1) as string;
    parts.push(
      `${fromPlace} ${letters(found)}${으로(last)} 가는 자식이 이미 있어 새로 만들지 않고 이어 씁니다.`,
    );
  }
  if (missing.length > 0) {
    const last = missing.at(-1) as string;
    const where = found.length > 0 ? "그다음" : fromPlace;
    parts.push(
      `${where} ${letters(missing)}${으로(last)} 가는 자식이 없어 ${nodesText(s.made)} 노드를 새로 만듭니다.`,
    );
  }
  if (s.endSet) {
    parts.push(`문자열이 끝나 ${s.at} 노드의 끝 표시를 참으로 둡니다.`);
  }
  return parts.join(" ");
}

function stepCalc(s: WalkStep): SimStep["calc"] {
  if (s.kind === "start") return null;
  if (s.kind === "insert") {
    return {
      expr: `${s.looks.map((l) => `get("${l.ch}")`).join(" · ")} =`,
      result: `${s.looks.map((l) => (l.found ? "있음" : "없음")).join(" · ")}${s.endSet ? " · end = 참" : ""}`,
    };
  }
  if (s.queryOp === "search") {
    return { expr: `nodeAt("${s.word}").end =`, result: yn(s.answer ?? false) };
  }
  return {
    expr: `nodeAt("${s.word}") !== null =`,
    result: yn(s.answer ?? false),
  };
}

/** 걸음 하나의 무대 — 노드 · 간선 · 읽는 문자열. */
function stepStage(s: WalkStep): GraphStep {
  const exists = new Map(s.shape);
  const read = new Set<string>(
    s.kind === "start" ? [] : [s.startAt, ...s.reused],
  );
  const made = new Set<string>(s.kind === "start" ? [""] : s.made);
  const nodes = LAYOUT.nodes.map((n) => {
    const path = n.id === "root" ? "" : String(n.id);
    if (!exists.has(path)) return { value: "", state: "empty" as const };
    const focus = made.has(path) || (s.endSet && s.at === path);
    const state: CellState | undefined = focus
      ? "focus"
      : read.has(path)
        ? "read"
        : undefined;
    return {
      value: exists.get(path) ? "끝 표시" : "",
      ...(state ? { state } : {}),
    };
  });
  const edges = LAYOUT.edges.map((e) => {
    const child = String(e.to);
    if (!exists.has(child)) return { state: "out" as const };
    const state: GraphEdge["state"] = made.has(child)
      ? "focus"
      : s.reused.includes(child)
        ? "read"
        : undefined;
    return {
      kind: "tree" as const,
      label: child.at(-1) as string,
      ...(state ? { state } : {}),
    };
  });
  const states: Record<number, CellState> = {};
  for (let i = 0; i < s.word.length; i++) {
    if (i >= s.from && i < s.to) states[i] = "read";
    else if (i >= s.to) states[i] = "out";
  }
  return {
    nodes,
    edges,
    strips: [
      {
        label: "읽는 문자열",
        values: [...s.word],
        slots: Math.max(...WORDS.map((w) => w.length)),
        ...(Object.keys(states).length > 0 ? { states } : {}),
      },
    ],
    calc: stepCalc(s),
    vars: `노드 수 ${s.shape.length}`,
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

/** 단어마다 따로 적은 사슬 — 뿌리 아래에 단어 하나가 사슬 하나다. 헷갈리기 쉬운 모양. */
function unsharedChains(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [
    { id: "root", label: "뿌리", x: 0, y: 0, value: "" },
  ];
  const edges: GraphEdge[] = [];
  const spread = WORDS.length - 1;
  WORDS.forEach((w, i) => {
    for (let k = 1; k <= w.length; k++) {
      const id = `${i}:${k}`;
      nodes.push({
        id,
        label: w.slice(0, k),
        x: (i - spread / 2) * 1.25,
        y: k,
        value: k === w.length ? "끝 표시" : "",
      });
      edges.push({
        from: k === 1 ? "root" : `${i}:${k - 1}`,
        to: id,
        kind: "tree",
        label: w[k - 1] as string,
      });
    }
  });
  return { nodes, edges };
}

/** 노드마다 그 경로로 시작하는 담은 단어의 수 — 정본의 `startsWith` 와 맞댄다. */
function shareCount(path: string): number {
  const trie = new Trie();
  for (const w of WORDS) trie.insert(w);
  const n = WORDS.filter((w) => w.startsWith(path)).length;
  if (n > 0 !== trie.startsWith(path)) {
    throw new Error(`노드 ${path} 의 단어 수가 정본과 어긋난다`);
  }
  return n;
}

const READ_PATH = "appl";

export const FIGS: Record<string, () => ReactElement> = {
  "concept-trie": () => {
    const t = treeOf(FINAL);
    return (
      <NodeGraph
        title={`${WORDS.join(" · ")} 를 담은 트라이 — 노드 이름은 뿌리에서 내려온 글자들`}
        unit={TREE_UNIT}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`길이 합 S = ${num(LIMIT)} · 조회 ${num(Q)} 번 · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-trie-share": () => {
    const t = treeOf(FINAL, {
      value: (p) => `단어 ${shareCount(p)} 개`,
    });
    return (
      <NodeGraph
        title="노드마다 그 경로로 시작하는 담은 단어의 수"
        unit={TREE_UNIT}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
  "build-read-one": () => {
    const on = (p: string) => READ_PATH.startsWith(p);
    const t = treeOf(FINAL, {
      state: (p) => (p === READ_PATH ? "focus" : on(p) ? "read" : "out"),
      edgeState: (c) => (on(c) ? "read" : "out"),
    });
    return (
      <NodeGraph
        title={`노드 ${READ_PATH} 를 읽는 길 — 뿌리에서 간선의 글자를 차례로 잇는다`}
        unit={TREE_UNIT}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
  "build-unshared": () => {
    const c = unsharedChains();
    return (
      <NodeGraph
        title={`단어마다 따로 적은 사슬 — 노드 ${c.nodes.length} 개`}
        unit={TREE_UNIT}
        nodes={c.nodes}
        edges={c.edges}
      />
    );
  },
  "build-apple": () => (
    <Film
      spec={trieOps as unknown as PlayerSpec}
      pick={["T5", "T6"]}
      title={`insert("apple") — 앞 세 글자는 이어 쓰고 뒤 두 글자는 만든다`}
    />
  ),
  "walk-insert-shapes": () => (
    <Film
      spec={trieOps as unknown as PlayerSpec}
      pick={["T4", "T6", "T7"]}
      title="단어 하나를 다 담은 걸음 셋 — T4 · T6 · T7"
    />
  ),
  "walk-trie-ops": () => <Film spec={trieOps as unknown as PlayerSpec} />,
  "invariant-mutant": () => {
    const { bad } = mutantShapes();
    const t = treeOf(bad);
    return (
      <NodeGraph
        title={`경로를 안 잇는 코드가 같은 세 단어로 만든 모양 — 노드 ${bad.length} 개`}
        unit={TREE_UNIT}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
};

// 정본의 모양과 그림의 모양이 같은가 — 그림이 사본만 보고 그려지지 않게 한 번 더 맞댄다.
{
  const ref = new Trie();
  for (const w of WORDS) ref.insert(w);
  const root = (ref as unknown as { root: Parameters<typeof shapeOf>[0] }).root;
  if (JSON.stringify(shapeOf(root)) !== JSON.stringify(FINAL)) {
    throw new Error("그림의 트라이가 정본과 다르다");
  }
}
