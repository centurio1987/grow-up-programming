/**
 * `suffixAutomaton-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 상태 · 전이 · 접미사 링크 · 걸음마다의 상태는 증명
 * 사이드카(`-guide.proof.ts`)의 기록에서 받고, 그 기록이 정본(`-guide.ref.ts`)과 같은 자동자를
 * 가리키는지는 증명 사이드카가 읽힐 때 스스로 확인한다.
 *
 * 접미사 자동자는 `NodeGraph` 로 그린다. **간선은 두 종류다** — 전이는 굵은 실선(`tree`)에 글자를 붙이고,
 * 접미사 링크는 대시(`back`)다. 아호–코라식 자동자 편이 트라이 간선을 굵은 실선, 실패 링크를 대시로
 * 그린 것과 같은 약속이라 두 편을 오가도 선 모양이 같은 뜻이다. 선 모양이 종류를 가르므로 흑백에서도
 * 갈린다.
 *
 * 상태의 자리는 손으로 두지 않는다 — 가로는 그 상태의 `len`, 세로는 같은 `len` 을 앞서 받은 상태 수다.
 * 그래서 왼쪽에서 오른쪽으로 갈수록 담는 문자열이 길다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`stageStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `suffixAutomaton-guide.test.ts` 가 잰다. 무대는 「그래프」(`stage: "graph"`)다 — 전개가 끝난 자동자의
 * 상태 일곱과, 한 번이라도 있었던 간선을 첫 걸음부터 둔다. 아직 안 만든 상태는 점선 테(`empty`),
 * 아직 안 생긴 간선은 흐린 선(`out`), 복제 뒤 옮겨 가 없어진 간선은 뺀다(`hidden`, SPEC §13).
 */

import type { ReactElement } from "react";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import {
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
  built,
  bySet,
  bySetFormula,
  type EdgeKey,
  edgesOf,
  endpos,
  endposGroups,
  MEMBERS,
  N_LIMIT,
  num,
  runOn,
  type Snapshot,
  secondsOf,
  stateOf,
  suffixTrie,
  varied,
  WALK,
  type WalkStep,
  walkSteps,
} from "./suffixAutomaton-guide.proof.ts";
import { SuffixAutomaton } from "./suffixAutomaton-guide.ref.ts";
import { samWalk } from "./suffixAutomaton-guide.sim.ts";

/* ── 전개 입력의 자동자 — 정본과 같은지는 증명 사이드카가 확인했다 ── */

const STEPS = walkSteps();
const FINAL: Snapshot = (STEPS.at(-1) as WalkStep).snap;

/** 패널 격자 — 상태 이름이 번호라 좁게 둔다. */
const STAGE_UNIT = { x: 110, y: 124 } as const;
/** 상태 이름에 담는 문자열을 적는 그림 — 이름 폭만큼 벌린다. */
const WIDE_UNIT = { x: 212, y: 120 } as const;

/**
 * 상태의 자리 — 세로는 같은 len 을 앞서 받은 상태 수, 가로는 len 이다. 아래 줄의 상태(복제 상태)는 반 칸
 * 왼쪽에 두어, 윗줄에서 그리로 내려오는 전이가 윗줄 상태를 지나지 않게 한다.
 */
function placeStates(snap: Snapshot): { x: number; y: number }[] {
  const seen = new Map<number, number>();
  return snap.len.map((l) => {
    const row = seen.get(l) ?? 0;
    seen.set(l, row + 1);
    return { x: row === 0 ? l : l - 0.5, y: row };
  });
}

const XY = placeStates(FINAL);

/** 간선 이름을 풀어 쓴다. */
function parseKey(key: EdgeKey): {
  kind: "tree" | "back";
  from: number;
  to: number;
  c?: string;
} {
  const parts = key.split(":");
  if (parts[0] === "t") {
    return {
      kind: "tree",
      from: Number(parts[1]),
      c: parts[2] as string,
      to: Number(parts[3]),
    };
  }
  return { kind: "back", from: Number(parts[1]), to: Number(parts[2]) };
}

/**
 * 간선의 휨 — 값은 모양만 정한다. 같은 줄에서 한 칸을 넘는 간선은 상태 위(전이)나 아래(링크)로 휘어
 * 가운데 상태를 비켜 가고, 서로 반대 방향인 전이와 링크는 양쪽으로 갈라 그린다.
 */
function bendOf(key: EdgeKey): number | undefined {
  const e = parseKey(key);
  const a = XY[e.from] as { x: number; y: number };
  const b = XY[e.to] as { x: number; y: number };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (e.kind === "tree") {
    if (dy === 0 && Math.abs(dx) > 1) return 0.18;
    // 같은 두 상태 사이에 반대 방향 접미사 링크가 있으면 그것과 갈라 그린다.
    if (dy !== 0 && FINAL.link[e.to] === e.from) return 0.2;
    return 0;
  }
  return dy === 0 ? 0.3 : 0.18;
}

/** 걸음 기록 전체에서 한 번이라도 있었던 간선 — 처음 생긴 차례로. */
const EVER: EdgeKey[] = (() => {
  const out: EdgeKey[] = [];
  for (const s of STEPS) {
    for (const k of edgesOf(s.snap)) if (!out.includes(k)) out.push(k);
  }
  return out;
})();

/** 간선이 처음 생긴 걸음의 차례. */
const BORN = new Map<EdgeKey, number>(
  EVER.map((k) => [k, STEPS.findIndex((s) => edgesOf(s.snap).includes(k))]),
);

/* ── 정적 그림의 그래프 ── */

interface AutoOpts {
  /** 상태 이름 — 기본은 번호. */
  readonly label?: (v: number) => string;
  readonly value?: (v: number) => string;
  readonly state?: (v: number) => CellState | undefined;
  readonly transState?: (key: EdgeKey) => EdgeState | undefined;
  readonly linkState?: (key: EdgeKey) => EdgeState | undefined;
  readonly links?: boolean;
  readonly trans?: boolean;
}

/** 다 만든 자동자 하나를 정적 그래프로. */
function automatonOf(
  snap: Snapshot,
  opts: AutoOpts = {},
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const xy = placeStates(snap);
  const nodes = snap.len.map((_, v) => {
    const at = xy[v] as { x: number; y: number };
    const state = opts.state?.(v);
    return {
      id: v,
      label: opts.label ? opts.label(v) : String(v),
      x: at.x,
      y: at.y,
      value: opts.value ? opts.value(v) : `len ${snap.len[v]}`,
      ...(state ? { state } : {}),
    };
  });
  const edges: GraphEdge[] = [];
  for (const key of edgesOf(snap)) {
    const e = parseKey(key);
    if (e.kind === "tree" && opts.trans === false) continue;
    if (e.kind === "back" && opts.links === false) continue;
    const state =
      e.kind === "tree" ? opts.transState?.(key) : opts.linkState?.(key);
    const bend = bendOf(key);
    edges.push({
      from: e.from,
      to: e.to,
      kind: e.kind,
      ...(e.c ? { label: e.c } : {}),
      ...(bend !== undefined ? { bend } : {}),
      ...(state ? { state } : {}),
    });
  }
  return { nodes, edges };
}

/** 상태 이름에 그 상태가 담는 문자열을 적는다. 뿌리는 「뿌리」. */
const memberLabel = (v: number): string =>
  v === 0 ? "뿌리" : (MEMBERS[v] as string[]).join(" · ");

/* ── 걸음 재생 패널 — 증명 사이드카의 걸음 기록에서 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 패널의 자리 — 전개가 끝난 자동자의 상태 일곱과, 한 번이라도 있었던 간선 전부. */
export const LAYOUT: GraphLayout = {
  nodes: FINAL.len.map((_, v) => ({
    id: v,
    x: (XY[v] as { x: number }).x,
    y: (XY[v] as { y: number }).y,
    label: String(v),
  })),
  edges: EVER.map((k) => {
    const e = parseKey(k);
    const bend = bendOf(k);
    return {
      from: e.from,
      to: e.to,
      ...(bend !== undefined ? { bend } : {}),
    };
  }),
  unit: STAGE_UNIT,
};

/** 검색 문자열 띠의 칸 수 — 전개가 던지는 검색 문자열 가운데 가장 긴 것. */
const QUERY_SLOTS = Math.max(
  ...STEPS.filter((s) => s.kind === "query").map((s) => s.query?.t.length ?? 0),
);

function stepTitle(s: WalkStep): string {
  const st = s.char;
  if (s.kind === "root") return `T${s.t} 뿌리 상태 하나로 시작한다`;
  if (s.kind === "char" && st) {
    return `T${s.t} 자리 ${st.pos} 의 ${st.c} — ${st.kind}`;
  }
  if (s.kind === "fill" && st) {
    return `T${s.t} 자리 ${st.pos} 의 ${st.c} — 전이를 채우고 멈춘다`;
  }
  if (s.kind === "clone" && st) {
    return `T${s.t} 복제 상태 ${st.clone}${을를(st.clone as number)} 만든다`;
  }
  if (s.kind === "rewire") return `T${s.t} 전이와 접미사 링크를 옮긴다`;
  if (s.kind === "query") return `T${s.t} 찾기 — "${s.query?.t}"`;
  return `T${s.t} 개수 세기`;
}

function stepText(s: WalkStep): string {
  const st = s.char;
  if (s.kind === "root") {
    return "빈 문자열만 담는 상태 0 하나로 시작합니다. 점선 테는 앞으로 만들 상태 자리이고, 흐린 선은 앞으로 생길 간선 자리입니다.";
  }
  if (s.kind === "query") {
    const q = s.query as NonNullable<WalkStep["query"]>;
    const path = q.path.join(" → ");
    return q.ok
      ? `뿌리에서 글자마다 전이를 따라가 ${path} 에 도착했습니다. 글자를 끝까지 따라갔으므로 부분 문자열입니다.`
      : `${path} 까지 갔는데 상태 ${q.path.at(-1)} 에 ${q.t[q.stuckAt as number]} 전이가 없습니다. 중간에 멈췄으므로 부분 문자열이 아닙니다.`;
  }
  if (s.kind === "count") {
    return `뿌리를 뺀 상태마다 len 과 접미사 링크의 len 의 차를 더합니다. 합이 ${s.total} 입니다.`;
  }
  if (!st) return "";
  const filled =
    st.filled.length === 0
      ? ""
      : `상태 ${st.filled.join(" · ")} 에 ${st.c} 전이가 없어 ${st.cur}${을를(st.cur)} 적었습니다.`;
  if (s.kind === "char") {
    if (st.kind === "뿌리로 잇는다") {
      return `새 상태 ${st.cur} 의 len 은 ${st.len[st.cur]} 입니다. ${filled} 뿌리를 지나쳐 멈출 곳이 없었으므로 상태 ${st.cur} 의 접미사 링크는 뿌리입니다.`;
    }
    return `새 상태 ${st.cur} 의 len 은 ${st.len[st.cur]} 입니다. ${filled} 상태 ${st.stopAt} 에는 ${st.c} 전이가 이미 있어 멈췄고, 그 전이가 가리키는 q 는 상태 ${st.q} 입니다. len[${st.stopAt}] + 1 과 len[${st.q}]${이가(`len[${st.q}]`)} 같아 q 를 그대로 접미사 링크로 씁니다.`;
  }
  if (s.kind === "fill") {
    return `새 상태 ${st.cur} 의 len 은 ${st.len[st.cur]} 입니다. ${filled} 상태 ${st.stopAt} 에서 ${st.c} 전이가 이미 있어 멈췄고 q 는 상태 ${st.q} 입니다. len[${st.stopAt}] + 1 이 len[${st.q}] 보다 작아 q 를 그대로 쓸 수 없습니다.`;
  }
  if (s.kind === "clone") {
    return `q 의 전이 표를 복사하고 q 의 접미사 링크를 물려받은 상태 ${st.clone}${을를(st.clone as number)} 만들었습니다. len 은 len[${st.stopAt}] + 1 입니다.`;
  }
  return `q 를 가리키던 ${st.c} 전이 가운데 상태 ${st.rewired.join(" · ")} 의 것을 복제 상태 ${st.clone}${으로(st.clone as number)} 옮기고, q 와 cur 의 접미사 링크를 복제 상태로 둡니다.`;
}

function stepCalc(s: WalkStep): SimStep["calc"] {
  const st = s.char;
  const snap = s.snap;
  if (s.kind === "root") return { expr: "상태 수 =", result: "1" };
  if (s.kind === "query") {
    return { expr: `contains("${s.query?.t}") =`, result: String(s.query?.ok) };
  }
  if (s.kind === "count") {
    return {
      expr: `${(s.adds as number[]).join(" + ")} =`,
      result: String(s.total),
    };
  }
  if (!st) return null;
  if (s.kind === "char" && st.kind === "뿌리로 잇는다") {
    return { expr: `link[${st.cur}] =`, result: "0" };
  }
  if (s.kind === "char") {
    return {
      expr: `len[${st.stopAt}] + 1 = len[${st.q}] =`,
      result: String(snap.len[st.q as number]),
    };
  }
  if (s.kind === "fill") {
    return {
      expr: `len[${st.stopAt}] + 1 · len[${st.q}] =`,
      result: `${(snap.len[st.stopAt] as number) + 1} · ${snap.len[st.q as number]}`,
    };
  }
  if (s.kind === "clone") {
    return {
      expr: `len[${st.clone}] = len[${st.stopAt}] + 1 =`,
      result: String(snap.len[st.clone as number]),
    };
  }
  return {
    expr: `link[${st.q}] = link[${st.cur}] =`,
    result: String(st.clone),
  };
}

function stepVars(s: WalkStep): string | null {
  const st = s.char;
  if (!st) return null;
  if (st.stopAt === -1) return `cur = ${st.cur} · p = -1`;
  return `cur = ${st.cur} · p = ${st.stopAt} · q = ${st.q}`;
}

/** 걸음 하나의 무대 — 상태 · 간선 · 문자열 띠 · 검색 문자열 띠. */
function stepStage(s: WalkStep, index: number): GraphStep {
  const snap = s.snap;
  const nodes = LAYOUT.nodes.map((_, v) => {
    if (v >= snap.len.length) return { state: "empty" as const };
    const state: CellState | undefined = s.wroteNodes.includes(v)
      ? "focus"
      : s.readNodes.includes(v)
        ? "read"
        : undefined;
    return { value: `len ${snap.len[v]}`, ...(state ? { state } : {}) };
  });
  const now = new Set(edgesOf(snap));
  const edges = EVER.map((key) => {
    const e = parseKey(key);
    const base = {
      kind: e.kind,
      ...(e.c ? { label: e.c } : {}),
    };
    if (!now.has(key)) {
      const born = BORN.get(key) as number;
      return born > index
        ? { ...base, state: "out" as const }
        : { ...base, hidden: true };
    }
    const state: EdgeState | undefined = s.wroteEdges.includes(key)
      ? "focus"
      : s.readEdges.includes(key)
        ? "read"
        : undefined;
    return { ...base, ...(state ? { state } : {}) };
  });
  const sStates: Record<number, CellState> = {};
  const st = s.char;
  for (let i = 0; i < WALK.length; i++) {
    if (s.kind === "root") sStates[i] = "out";
    else if (st && i === st.pos) sStates[i] = "read";
    else if (st && i > st.pos) sStates[i] = "out";
  }
  const q = s.query;
  const tStates: Record<number, CellState> = {};
  if (q) {
    const read = q.stuckAt === null ? q.t.length : q.stuckAt + 1;
    for (let i = 0; i < q.t.length; i++) tStates[i] = i < read ? "read" : "out";
  }
  return {
    nodes,
    edges,
    strips: [
      {
        label: "s",
        values: [...WALK],
        ...(Object.keys(sStates).length > 0 ? { states: sStates } : {}),
      },
      {
        label: "t",
        values: q ? [...q.t] : [],
        slots: QUERY_SLOTS,
        ...(Object.keys(tStates).length > 0 ? { states: tStates } : {}),
      },
    ],
    calc: stepCalc(s),
    vars: stepVars(s),
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 증명 사이드카의 걸음 기록(`walkSteps`)에서 만든다. `.sim.ts` 의
 * `steps` 는 이 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return STEPS.map((s, i) => ({
    title: stepTitle(s),
    text: stepText(s),
    ...stepStage(s, i),
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

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 — 수치는 실행에서 ── */

function approaches(): Approach[] {
  const big = varied(N_LIMIT);
  const setOps = bySetFormula(N_LIMIT);
  const trieNodes = new SuffixAutomaton(big).countDistinctSubstrings() + 1;
  const b = built(big, false);
  const samOps = b.ops + runOn(b, []).countOps;
  const small = bySet(WALK);
  const gb = `${((trieNodes * 4) / 1e9).toFixed(1)} GB`;
  return [
    {
      name: "부분 문자열을 전부 집합에 담기",
      idea: "시작 자리와 끝 자리를 다 잡아 토막을 만들고 집합에 넣는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${num(setOps)} 번 · ${secondsOf(setOps)}`,
          ok: false,
        },
      ],
      lesson: `"${WALK}" 에서 ${small.made} 개를 만들어 ${small.distinct} 개를 얻는다 — 같은 토막을 한 번만 적으면 어떨까`,
    },
    {
      name: "모든 접미사를 트라이에 담기",
      idea: "서로 다른 부분 문자열마다 마디 하나를 둔다",
      verdict: "drop",
      checks: [
        { label: "찾기", value: "검색 문자열 길이만큼", ok: true },
        {
          label: "메모리",
          value: `마디 ${num(trieNodes)} 개 · 어림 ${gb}`,
          ok: false,
        },
      ],
      lesson:
        "끝나는 자리가 같은 마디가 여럿이다 — 그런 마디를 하나로 합치면 어떨까",
    },
    {
      name: "트라이를 만든 뒤 끝나는 자리가 같은 마디 합치기",
      idea: "접미사 트라이를 다 만들고 나서 같은 끝나는 자리의 마디를 한 상태로 모은다",
      verdict: "drop",
      checks: [
        {
          label: "상태 수",
          value: `${num(b.states)} 개 이하로 준다`,
          ok: true,
        },
        {
          label: "만드는 동안",
          value: `트라이 마디 ${num(trieNodes)} 개를 먼저 만든다`,
          ok: false,
        },
      ],
      lesson:
        "합친 모양을 트라이 없이 곧바로, 글자를 하나씩 붙이며 만들 수는 없을까",
    },
    {
      name: "끝나는 자리 집합으로 묶은 상태를 글자마다 늘리기",
      idea: "글자를 하나씩 붙이며 상태를 한두 개 늘리고 접미사 링크로 전이를 채운다",
      verdict: "keep",
      checks: [
        {
          label: "시간",
          value: `${num(samOps)} 번 · ${secondsOf(samOps)}`,
          ok: true,
        },
        { label: "상태 수", value: `2n-1 개 이하`, ok: true },
      ],
    },
  ];
}

/* ── 그림마다의 모양 ── */

/** 끝나는 자리 무리마다 그 무리의 문자열이 놓이는 자리 전부. */
function occurrenceBars(longestOnly: boolean): LayerBar[][] {
  const at = endpos(WALK);
  return endposGroups(WALK).map((g) => {
    const v = stateOf(FINAL, g.words.at(-1) as string);
    const ws = longestOnly ? [g.words.at(-1) as string] : g.words;
    const bars: LayerBar[] = [];
    for (const w of ws) {
      for (const e of at.get(w) as number[]) {
        bars.push({
          label: `${w} · 끝 ${e}`,
          from: e - w.length + 1,
          to: e,
          ...(bars.length === 0
            ? { note: `상태 ${v} · 끝나는 자리 {${g.at.join(", ")}}` }
            : {}),
        });
      }
    }
    return bars;
  });
}

const STAGE_SPEC = samWalk as unknown as PlayerSpec;

/** 그림의 트라이 — 접미사 트라이의 마디 열둘. 값 칸에 합쳐질 상태를 적는다. */
function suffixTrieGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const trie = suffixTrie(WALK);
  const children = new Map<string, string[]>();
  for (const n of trie) {
    if (n.parent === null) continue;
    children.set(n.parent, [...(children.get(n.parent) ?? []), n.path]);
  }
  for (const [k, v] of children) children.set(k, v.sort());
  const xy = treeLayout([""], children);
  const id = (p: string): string => (p === "" ? "root" : p);
  const nodes = trie.map((n) => {
    const at = xy.get(n.path) as { x: number; y: number };
    return {
      id: id(n.path),
      label: n.path === "" ? "뿌리" : n.path,
      x: at.x * 1.4,
      y: at.y,
      value: `상태 ${stateOf(FINAL, n.path)}`,
    };
  });
  const edges: GraphEdge[] = trie
    .filter((n) => n.parent !== null)
    .map((n) => ({
      from: id(n.parent as string),
      to: id(n.path),
      kind: "tree" as const,
      label: n.path.at(-1) as string,
    }));
  return { nodes, edges };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-endpos": () => (
    <LayerBars
      title={`${WALK} 의 부분 문자열이 놓인 자리 전부 — 끝나는 자리 집합이 같은 것끼리 한 묶음`}
      values={[...WALK]}
      valuesLabel="s"
      indexLabel="자리"
      groups={occurrenceBars(false)}
    />
  ),
  "concept-automaton": () => {
    const g = automatonOf(FINAL, {
      label: memberLabel,
      value: (v) => `상태 ${v}`,
    });
    return (
      <NodeGraph
        title={`${WALK} 의 접미사 자동자 — 굵은 실선은 전이, 대시는 접미사 링크`}
        unit={WIDE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "origin-trie-merge": () => {
    const g = suffixTrieGraph();
    return (
      <NodeGraph
        title={`${WALK} 의 접미사 트라이 — 마디마다 끝나는 자리가 같은 마디끼리 합쳐질 상태`}
        unit={{ x: 76, y: 78 }}
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
        constraint={`무작위 26 글자 n = ${num(N_LIMIT)} · 자료 접근 1 초에 1 억 번 · 256 MB 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-endpos-longest": () => (
    <LayerBars
      title={`상태마다 가장 긴 문자열이 놓인 자리 — 막대의 오른쪽 끝이 끝나는 자리다`}
      values={[...WALK]}
      valuesLabel="s"
      indexLabel="자리"
      groups={occurrenceBars(true)}
    />
  ),
  "build-links": () => {
    const g = automatonOf(FINAL, {
      label: memberLabel,
      value: (v) => `상태 ${v}`,
      transState: () => "out",
    });
    return (
      <NodeGraph
        title="상태마다 접미사 링크 하나 — 대시가 접미사 링크, 흐린 실선이 전이"
        unit={WIDE_UNIT}
        nodes={g.nodes}
        edges={g.edges}
      />
    );
  },
  "build-fill-frame": () => (
    <Film
      spec={STAGE_SPEC}
      pick={["T4"]}
      title="자리 2 의 b — 상태 2 · 1 · 0 에 b 전이를 적고 뿌리를 지나친다"
    />
  ),
  "build-clone-film": () => (
    <Film
      spec={STAGE_SPEC}
      pick={["T6", "T7", "T8"]}
      title="자리 4 의 b — 멈추고, 복제하고, 옮긴다"
    />
  ),
  "walk-sam": () => <Film spec={STAGE_SPEC} />,
  "selfcheck-start": () => (
    <Film
      spec={STAGE_SPEC}
      pick={["T8"]}
      title={`T8 이 낸 ${WALK} 의 접미사 자동자 — 예측 문제의 출발점`}
    />
  ),
};

// 그림의 자동자가 정본과 같은가 — 상태가 담는 개수의 합을 정본의 개수와 한 번 더 맞댄다.
{
  const sum = MEMBERS.slice(1).reduce((a, m) => a + m.length, 0);
  if (sum !== new SuffixAutomaton(WALK).countDistinctSubstrings()) {
    throw new Error("그림의 자동자가 정본과 다른 개수를 담는다");
  }
}
