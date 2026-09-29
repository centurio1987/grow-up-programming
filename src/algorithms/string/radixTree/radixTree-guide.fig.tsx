/**
 * `radixTree-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 라딕스 트리의 모양 · 걸음마다의 상태 · 변이가 만든 모양은
 * 증명 사이드카(`-guide.proof.ts`)의 기록에서 받고, 그 기록이 정본(`-guide.ref.ts`)과 같은 트리를
 * 만드는지는 증명 사이드카가 읽힐 때 삽입마다 스스로 확인한다.
 *
 * 트리는 `NodeGraph` 로 그린다. 노드 이름은 그 노드의 **경로 문자열**이고(뿌리만 「뿌리」), **라벨은
 * 부모에서 들어오는 간선에 붙는다** — 트라이 편(`../trie/trie-guide.fig.tsx`)과 같은 읽기이고, 간선의
 * 글자가 한 글자에서 글자 묶음으로 넓어진 것만 다르다.
 *
 * ## 자리 — 첫 자식을 부모 바로 아래에 둔다
 *
 * 걸음 재생 패널은 완성된 트리의 자리를 첫 걸음부터 둔다(SPEC §13 · `L48`). 그런데 라딕스 트리는 라벨을
 * 가를 때 **부모가 바뀐다** — T2 에서 뿌리의 자식이던 `apple` 이 T3 에서 `appl` 의 자식이 된다. 그래서
 * 자리는 `treeLayout` 대신 **첫 자식을 부모 바로 아래에 두는 배치**로 낸다. 가르기 전의 긴 라벨이 가른
 * 뒤 생길 노드 자리를 세로로 지나가고, 가르기 전 간선은 왼쪽으로 휘어 뒤에 생길 간선과 겹치지 않는다.
 * 가른 뒤로는 그 옛 간선을 그리지 않는다(`hidden` — 그래프 무대의 일반형, KAN-058 에서 넓혔다).
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `radixTree-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphLayout, GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  buildTrie,
  type Compare,
  DICT_N,
  foldAnswer,
  foldedNodes,
  LIMIT,
  nodeName,
  num,
  Q,
  radixNodes,
  refShape,
  relinkMutantRoot,
  type ShapeNode,
  SPLIT_DICT,
  secondsOf,
  trieNodes,
  trieShape,
  type WalkStep,
  WORDS,
  walkSteps,
  worstQueryReads,
  yn,
} from "./radixTree-guide.proof.ts";
import { RadixTree } from "./radixTree-guide.ref.ts";
import { radixOps } from "./radixTree-guide.sim.ts";

/** 노드 id — 경로 문자열. 뿌리는 빈 문자열이라 따로 이름을 둔다. */
const idOf = (path: string): string => (path === "" ? "root" : path);

/** 라딕스 트리 그림의 격자 — 긴 라벨이 간선 옆에 들어갈 틈을 둔다. */
const RADIX_UNIT = { x: 120, y: 84 } as const;

/** 트라이 그림의 격자 — 깊이가 11 까지 가서 세로를 좁힌다. */
const TRIE_UNIT = { x: 120, y: 62 } as const;

/** 트라이 위에 라벨 묶음을 두르는 그림의 격자 — 묶음 테와 머리말이 들어갈 틈을 둔다. */
const GROUP_UNIT = { x: 130, y: 104 } as const;

/** 가르기 전 간선이 휘는 정도 — 왼쪽으로 휘어 뒤에 생길 세로 간선과 겹치지 않는다. */
const OLD_EDGE_BEND = -0.35;

/* ── 전개 입력의 걸음 — 정본과 같은지는 증명 사이드카가 삽입마다 확인했다 ── */

const STEPS = walkSteps();
const FINAL = (STEPS.at(-1) as WalkStep).shape;

/**
 * 첫 자식을 부모 바로 아래에 두는 배치. 잎은 왼쪽부터 한 단위씩 자리를 받고, 부모는 첫 자식의 `x` 에
 * 선다. `y` 는 라벨 개수로 센 깊이다. 걸음 재생 패널은 `start = 1` 로 왼쪽에 한 단위를 비워, 가르기 전
 * 간선이 휠 자리를 둔다 — 그 자리를 안 두면 휜 간선의 머리말이 그림을 오른쪽으로 밀어 걸음마다 자리가 흔들린다.
 */
function spineLayout(
  shape: readonly ShapeNode[],
  start = 0,
): Map<string, { x: number; y: number }> {
  const kids = new Map<string, string[]>();
  for (const n of shape) {
    if (n.parent === null) continue;
    kids.set(n.parent, [...(kids.get(n.parent) ?? []), n.path]);
  }
  const out = new Map<string, { x: number; y: number }>();
  let next = start;
  const place = (p: string, depth: number): number => {
    const ks = kids.get(p) ?? [];
    if (ks.length === 0) {
      const x = next;
      next += 1;
      out.set(p, { x, y: depth });
      return x;
    }
    const xs = ks.map((k) => place(k, depth + 1));
    const x = xs[0] as number;
    out.set(p, { x, y: depth });
    return x;
  };
  place("", 0);
  return out;
}

/** 모양 하나를 정적 트리로 — 노드 이름은 경로 문자열, 값은 끝 표시, 간선에 라벨. */
function radixOf(
  shape: readonly ShapeNode[],
  opts: {
    state?: (path: string) => CellState | undefined;
    edgeState?: (child: string) => GraphEdge["state"];
    edgeLabel?: (n: ShapeNode) => string;
  } = {},
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const xy = spineLayout(shape);
  const nodes = shape.map((n) => {
    const at = xy.get(n.path) as { x: number; y: number };
    const state = opts.state?.(n.path);
    return {
      id: idOf(n.path),
      label: nodeName(n.path),
      x: at.x,
      y: at.y,
      value: n.end ? "끝 표시" : "",
      ...(state ? { state } : {}),
    };
  });
  const edges = shape
    .filter((n) => n.parent !== null)
    .map((n) => {
      const state = opts.edgeState?.(n.path);
      return {
        from: idOf(n.parent ?? ""),
        to: idOf(n.path),
        kind: "tree" as const,
        label: opts.edgeLabel ? opts.edgeLabel(n) : n.label,
        ...(state ? { state } : {}),
      };
    });
  return { nodes, edges };
}

/** 글자마다 노드를 둔 트라이 — 지나가기만 하는 노드는 대시 테로 흐리게. */
function trieOf(groups?: readonly GraphGroup[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups?: readonly GraphGroup[];
} {
  const shape = trieShape();
  const children = new Map<string, string[]>();
  for (const n of shape) {
    if (n.path === "") continue;
    const parent = n.path.slice(0, -1);
    children.set(parent, [...(children.get(parent) ?? []), n.path]);
  }
  const xy = treeLayout([""], children);
  const nodes = shape.map((n) => {
    const at = xy.get(n.path) as { x: number; y: number };
    const pass = n.path !== "" && n.kids === 1 && !n.end;
    return {
      id: idOf(n.path),
      label: nodeName(n.path),
      x: at.x * 1.1,
      y: at.y,
      value: n.end ? "끝 표시" : "",
      ...(pass ? { state: "out" as const } : {}),
    };
  });
  const edges = shape
    .filter((n) => n.path !== "")
    .map((n) => ({
      from: idOf(n.path.slice(0, -1)),
      to: idOf(n.path),
      kind: "tree" as const,
      label: n.path.at(-1) as string,
    }));
  return { nodes, edges, ...(groups ? { groups } : {}) };
}

/** 라딕스 트리의 간선 하나가 덮는 트라이 노드들 — 라벨 글자마다 하나. */
function labelRuns(): GraphGroup[] {
  return refShape()
    .filter((n) => n.parent !== null)
    .map((n) => {
      const base = n.parent ?? "";
      const members = [...n.label].map((_, i) =>
        idOf(base + n.label.slice(0, i + 1)),
      );
      return { members, label: `라벨 ${n.label}` };
    });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const r = worstQueryReads();
  const splitTrie = trieNodes(buildTrie(SPLIT_DICT));
  const splitRadix = radixNodes(SPLIT_DICT);
  const wrong = !foldAnswer("search", "app");
  return [
    {
      name: "목록에 담고 매번 대조",
      idea: "단어를 배열에 담고, 물을 때마다 모든 단어를 앞에서부터 대조한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 하나에 ${num(r.list)} 글자 · ${num(Q)} 번이면 ${secondsOf(r.list * Q)}`,
          ok: false,
        },
      ],
      lesson: "같은 앞부분을 단어마다 다시 읽는다 — 앞부분을 한 번만 적어 두자",
    },
    {
      name: "글자마다 노드를 두는 트라이",
      idea: "글자 하나를 읽을 때마다 노드를 한 칸 내려간다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 하나에 ${num(r.trie)} 글자`,
          ok: true,
        },
        {
          label: "노드",
          value: `앞 3 글자에서 갈리는 ${num(DICT_N)} 단어에 ${num(splitTrie)} 개 — 글자 수를 따라간다`,
          ok: false,
        },
      ],
      lesson:
        "노드 대부분이 지나가기만 한다 — 자식이 하나뿐인 노드를 접어 보자",
    },
    {
      name: "자식이 하나뿐인 노드를 전부 접기",
      idea: "단어 끝인지 보지 않고, 자식이 하나뿐인 노드를 간선 라벨로 합친다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: wrong
            ? `search("app") 가 ${yn(false)} — 단어 app 이 사라진다`
            : "맞다",
          ok: !wrong,
        },
        {
          label: "노드",
          value: `네 단어에 ${num(foldedNodes())} 개`,
          ok: true,
        },
      ],
      lesson: "단어가 끝나는 노드는 접으면 안 된다",
    },
    {
      name: "갈림 없는 구간 접기",
      idea: "갈림도 단어 끝도 아닌 노드만 없애고, 그 글자를 간선 라벨 하나로 잇는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "노드",
          value: `앞 3 글자에서 갈리는 ${num(DICT_N)} 단어에 ${num(splitRadix)} 개 — 단어 수를 따라간다`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 증명 사이드카의 걸음 기록에서 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

const finalEdges = new Set(
  FINAL.filter((n) => n.parent !== null).map(
    (n) => `${idOf(n.parent ?? "")}->${idOf(n.path)}`,
  ),
);

/** 걸음 기록 전체에서 한 번이라도 있었던 간선 — 처음 생긴 차례. */
function everyEdge(): { from: string; to: string }[] {
  const seen = new Map<string, { from: string; to: string }>();
  for (const s of STEPS) {
    for (const n of s.shape) {
      if (n.parent === null) continue;
      const e = { from: idOf(n.parent), to: idOf(n.path) };
      const key = `${e.from}->${e.to}`;
      if (!seen.has(key)) seen.set(key, e);
    }
  }
  return [...seen.values()];
}

/** 패널의 자리 — 완성된 트리의 노드와, 한 번이라도 있었던 간선. 첫 걸음부터 이 자리를 쓴다. */
export const LAYOUT: GraphLayout = (() => {
  const xy = spineLayout(FINAL, 1);
  return {
    nodes: FINAL.map((n) => {
      const at = xy.get(n.path) as { x: number; y: number };
      return { id: idOf(n.path), x: at.x, y: at.y, label: nodeName(n.path) };
    }),
    edges: everyEdge().map((e) =>
      finalEdges.has(`${e.from}->${e.to}`) ? e : { ...e, bend: OLD_EDGE_BEND },
    ),
    unit: RADIX_UNIT,
  };
})();

/** 라벨 여럿 — `app · l` 꼴. */
const labels = (cs: readonly Compare[]): string =>
  cs.map((c) => c.label).join(" · ");

/** 경로 문자열에서 노드 하나의 라벨. */
function labelAt(s: WalkStep, path: string): string {
  return (s.shape.find((n) => n.path === path) as ShapeNode).label;
}

function stepTitle(s: WalkStep): string {
  if (s.kind === "start") return `T${s.t} 빈 트리`;
  if (s.kind === "query") return `T${s.t} ${s.op}`;
  const b = s.branches;
  const how = b.includes("②")
    ? "잎을 단다"
    : b.includes("⑥ 거짓")
      ? "라벨을 가르고 잎을 단다"
      : b.includes("⑥ 참")
        ? "라벨을 가르고 끝 표시를 남긴다"
        : "라벨을 다 쓰고 끝 표시를 남긴다";
  return `T${s.t} ${s.op} — ${how}`;
}

function stepText(s: WalkStep): string {
  if (s.kind === "start") {
    return "빈 트리는 뿌리 하나입니다. 뿌리의 라벨은 빈 문자열이고, 점선 노드는 뒤 걸음에서 만들어질 자리입니다.";
  }
  if (s.kind === "insert") {
    const b = s.branches;
    if (b.includes("②")) {
      const head = s.word[0] as string;
      const leaf = s.leaf as string;
      return `뿌리에 ${head}${으로(head)} 시작하는 자식이 없어, 남은 글자 ${leaf}${을를(leaf)} 라벨 하나로 단 잎을 만들고 끝 표시를 참으로 둡니다. 글자를 한 번도 대조하지 않았습니다.`;
    }
    if (b.includes("④")) {
      const c = s.compares.at(-1) as Compare;
      const front = c.label.slice(0, c.k);
      const back = c.label.slice(c.k);
      const mid = s.made[0] as string;
      const head = c.rest[0] as string;
      const split = `라벨 ${c.label}${과와(c.label)} 앞 ${c.k} 글자 ${front}까지 같고 그다음이 갈려, 라벨을 ${front}${과와(front)} ${back}${으로(back)} 가르고 그 자리에 중간 노드 ${mid}${을를(mid)} 세웁니다. 부모의 ${head} 자리를 중간 노드로 바꿉니다.`;
      if (b.includes("⑥ 참")) {
        return `${split} 새 단어에 남은 글자가 없어 중간 노드 ${mid}의 끝 표시를 참으로 둡니다.`;
      }
      const leaf = s.leaf as string;
      return `${split} 새 단어에 남은 ${leaf}${을를(leaf)} 라벨로 단 잎을 중간 노드 아래에 답니다.`;
    }
    const at = s.at as string;
    const ls = labels(s.compares);
    return `라벨 ${ls}${을를(ls)} 차례로 다 쓰고 남은 글자가 없어, ${at} 노드의 끝 표시를 참으로 둡니다. 새 노드는 없습니다.`;
  }
  const op = s.queryOp as "search" | "startsWith";
  if (s.at === null) {
    const tail = `${op} 는 거짓을 돌려줍니다.`;
    if (s.branches.includes("⑧")) {
      const ch = (s.lookups.at(-1) as { ch: string }).ch;
      return `뿌리에 ${ch}${으로(ch)} 시작하는 자식이 없어 locate 가 null 을 돌려줍니다. ${tail}`;
    }
    const c = s.compares.at(-1) as Compare;
    const passed = labels(s.compares.slice(0, -1));
    return `라벨 ${passed}${을를(passed)} 다 쓴 뒤 라벨 ${c.label} 의 ${c.k + 1} 번째 글자에서 어긋나 locate 가 null 을 돌려줍니다. ${tail}`;
  }
  const last = labelAt(s, s.at);
  const ls = labels(s.compares);
  const arrive = `뿌리에서 라벨 ${ls}${을를(ls)} 따라 라벨 ${last}${이가(last)} 붙은 노드에 도착했고, 라벨에 남은 글자는 ${s.leftover} 개입니다.`;
  if (op === "startsWith") {
    return `${arrive} startsWith 는 도착했으므로 참을 돌려줍니다.`;
  }
  if (s.leftover !== 0) {
    return `${arrive} search 는 남은 글자가 0 이 아니라 거짓을 돌려줍니다.`;
  }
  return `${arrive} search 는 끝 표시가 ${yn(s.answer ?? false)}이라 ${yn(s.answer ?? false)}을 돌려줍니다.`;
}

function stepCalc(s: WalkStep): SimStep["calc"] {
  if (s.kind === "start") return null;
  if (s.kind === "insert") {
    if (s.branches.includes("②")) {
      const head = s.word[0] as string;
      return { expr: `children.get("${head}") =`, result: "없음" };
    }
    if (s.branches.includes("④")) {
      const c = s.compares.at(-1) as Compare;
      return {
        expr: `commonPrefixLength("${c.rest}", "${c.label}") =`,
        result: `${c.k}`,
      };
    }
    return { expr: 'rest === "" → end =', result: "참" };
  }
  if (s.at === null) {
    return { expr: `locate("${s.word}") =`, result: "null" };
  }
  if (s.queryOp === "search") {
    return { expr: "leftover === 0 && end =", result: yn(s.answer ?? false) };
  }
  return {
    expr: `locate("${s.word}") !== null =`,
    result: yn(s.answer ?? false),
  };
}

/** 이번 걸음에 라벨을 맞춰 본 자식들의 경로. */
function touched(s: WalkStep): Set<string> {
  const out = new Set<string>([...s.visited]);
  if (s.at !== null && s.kind === "query") out.add(s.at);
  const last = s.compares.at(-1);
  if (last !== undefined && s.kind === "query") {
    out.add((s.visited.at(-1) ?? "") + last.label);
  }
  return out;
}

const WORD_SLOTS = Math.max(...STEPS.map((s) => s.word.length));
const LABEL_SLOTS = Math.max(
  ...STEPS.flatMap((s) => s.compares.map((c) => c.label.length)),
);

/** 걸음 하나의 무대 — 노드 · 간선 · 읽는 문자열 · 맞춰 본 라벨. */
function stepStage(s: WalkStep): GraphStep {
  const exists = new Map(s.shape.map((n) => [n.path, n]));
  const read = touched(s);
  const made = new Set<string>(s.kind === "start" ? [""] : s.made);
  const nodes = LAYOUT.nodes.map((n) => {
    const path = n.id === "root" ? "" : String(n.id);
    const node = exists.get(path);
    if (node === undefined) return { value: "", state: "empty" as const };
    const state: CellState | undefined =
      made.has(path) || s.endSet === path
        ? "focus"
        : read.has(path) || (path === "" && s.kind !== "start")
          ? "read"
          : undefined;
    return {
      value: node.end ? "끝 표시" : "",
      ...(state ? { state } : {}),
    };
  });
  const edges = LAYOUT.edges.map((e) => {
    const child = e.to === "root" ? "" : String(e.to);
    const node = exists.get(child);
    const parent = e.from === "root" ? "" : String(e.from);
    if (node === undefined || node.parent !== parent) {
      return finalEdges.has(`${e.from}->${e.to}`)
        ? { state: "out" as const }
        : { hidden: true };
    }
    const state: GraphEdge["state"] =
      made.has(child) || s.relabeled.includes(child)
        ? "focus"
        : read.has(child)
          ? "read"
          : undefined;
    return {
      kind: "tree" as const,
      label: node.label,
      ...(state ? { state } : {}),
    };
  });
  const wordStates: Record<number, CellState> = {};
  for (let i = 0; i < s.word.length; i++) {
    if (i < s.matched) wordStates[i] = "read";
    else if (s.leaf !== null) wordStates[i] = "focus";
    else wordStates[i] = "out";
  }
  const last = s.compares.at(-1);
  const labelStates: Record<number, CellState> = {};
  for (let i = 0; i < (last?.label.length ?? 0); i++) {
    labelStates[i] = i < (last?.k ?? 0) ? "read" : "out";
  }
  return {
    nodes,
    edges,
    strips: [
      {
        label: "읽는 문자열",
        values: [...s.word],
        slots: WORD_SLOTS,
        ...(Object.keys(wordStates).length > 0 ? { states: wordStates } : {}),
      },
      {
        label: "맞춰 본 라벨",
        values: last === undefined ? [] : [...last.label],
        slots: LABEL_SLOTS,
        ...(Object.keys(labelStates).length > 0 ? { states: labelStates } : {}),
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

const READ_PATH = "application";

export const FIGS: Record<string, () => ReactElement> = {
  "concept-trie": () => {
    const t = trieOf();
    const pass = t.nodes.filter((n) => n.state === "out").length;
    return (
      <NodeGraph
        title={`글자마다 노드를 둔 트라이 — 노드 ${t.nodes.length} 개, 대시 테 ${pass} 개는 지나가기만 한다`}
        unit={TRIE_UNIT}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
  "concept-radix": () => {
    const t = radixOf(FINAL);
    return (
      <NodeGraph
        title={`같은 네 단어의 라딕스 트리 — 노드 ${t.nodes.length} 개, 간선마다 라벨 한 묶음`}
        unit={RADIX_UNIT}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`길이 합 S = ${num(LIMIT)} · 조회 ${num(Q)} 번 · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-over-trie": () => {
    const runs = labelRuns();
    const t = trieOf(runs);
    return (
      <NodeGraph
        title={`라딕스 트리의 간선 ${runs.length} 개가 트라이의 어느 노드를 덮는가`}
        unit={GROUP_UNIT}
        nodes={t.nodes}
        edges={t.edges}
        groups={t.groups}
      />
    );
  },
  "build-read-one": () => {
    const on = (p: string) => READ_PATH.startsWith(p);
    const t = radixOf(FINAL, {
      state: (p) => (p === READ_PATH ? "focus" : on(p) ? "read" : "out"),
      edgeState: (c) => (on(c) ? "read" : "out"),
    });
    return (
      <NodeGraph
        title={`노드 ${READ_PATH} 를 읽는 길 — 뿌리에서 라벨 셋을 차례로 잇는다`}
        unit={RADIX_UNIT}
        nodes={t.nodes}
        edges={t.edges}
      />
    );
  },
  "build-split": () => (
    <Film
      spec={radixOps as unknown as PlayerSpec}
      pick={["T3", "T4"]}
      title="라벨 도중에 갈리는 삽입 둘 — T3 · T4"
    />
  ),
  "walk-insert-shapes": () => (
    <Film
      spec={radixOps as unknown as PlayerSpec}
      pick={["T2", "T3", "T4", "T5"]}
      title="단어 하나를 다 담은 걸음 넷 — T2 · T3 · T4 · T5"
    />
  ),
  "pause-relink": () => {
    const kids = relinkMutantRoot();
    const nodes: GraphNode[] = [
      { id: "root", label: "뿌리", x: 0, y: 0, value: "" },
      ...kids.map((k, i) => ({
        id: `k${i}`,
        label: k.label,
        x: i,
        y: 1,
        value: k.end ? "끝 표시" : "",
      })),
    ];
    const edges: GraphEdge[] = kids.map((k, i) => ({
      from: "root",
      to: `k${i}`,
      kind: "tree",
      label: `키 ${k.key} · 라벨 ${k.label}`,
    }));
    return (
      <NodeGraph
        title={`부모를 안 바꾼 코드가 네 단어로 만든 모양 — 노드 ${nodes.length} 개`}
        unit={RADIX_UNIT}
        nodes={nodes}
        edges={edges}
      />
    );
  },
  "walk-radix-ops": () => <Film spec={radixOps as unknown as PlayerSpec} />,
};

// 정본의 모양과 그림의 모양이 같은가 — 그림이 사본만 보고 그려지지 않게 한 번 더 맞댄다.
{
  const ref = new RadixTree();
  for (const w of WORDS) ref.insert(w);
  const root = (ref as unknown as { root: object }).root;
  if (
    root === undefined ||
    JSON.stringify(refShape()) !== JSON.stringify(FINAL)
  ) {
    throw new Error("그림의 라딕스 트리가 정본과 다르다");
  }
}
