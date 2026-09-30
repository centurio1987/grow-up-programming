/**
 * `zeroOneBfs-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 거리 · 덱의 내용 · 간선 검사 수는 정본과 같은 절차에 기록만
 * 덧붙인 사본(`-guide.proof.ts` 의 `record` · `counted`)이 내고, 그 사본은 부를 때마다 자기 답을 정본
 * (`-guide.ref.ts`)과 맞댄다.
 *
 * ## 덱을 무대에 보이는 법
 *
 * 그래프 무대의 **띠 둘**(`strips`)로 그린다 — 다익스트라 편이 우선순위 큐를 「꺼낼 차례」 띠 둘로 그린
 * 약속과 같다. 덱은 넣은 자리가 곧 꺼낼 차례라서, 띠의 **왼쪽 끝이 앞**(다음에 꺼낼 항목) · **오른쪽 끝이
 * 뒤**다. 칸 수는 전개에서 덱이 가장 길었을 때로 고정한다(단조 덱 · 스택 띠와 같은 약속). 윗줄이 정점,
 * 아랫줄이 **넣을 때 적은 거리**이고 같은 칸 번호가 한 항목이다. 이번 걸음에 넣은 항목은 새로 씀,
 * 뒤처진 항목(넣을 때 거리가 지금 적힌 거리보다 큰 항목)은 이번 걸음 밖이다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 정점 0 을 왼쪽에 두고 들어오는 간선이 없는 정점 5 는
 * 오른쪽 아래에 떨어뜨려 둔다. 간선 옆 수는 간선의 가중치(0 또는 1)이다.
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
  type EdgeKind,
  type GraphEdge,
  type GraphNode,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import { grid } from "./zeroOneBfs-guide.alt.ts";
import {
  CANDIDATE_LABELS,
  candidateOps,
  comma,
  counted,
  type EdgeRead,
  GROUP_STEP,
  type Item,
  isStale,
  num,
  POPS,
  prevOf,
  type Step,
  show,
  WALK,
  WALK_EDGES,
  WALK_SRC,
} from "./zeroOneBfs-guide.proof.ts";
import { zeroOneWalk } from "./zeroOneBfs-guide.sim.ts";

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 1 },
    { id: 1, x: 1.3, y: 0 },
    { id: 2, x: 1.3, y: 2 },
    { id: 3, x: 2.6, y: 1 },
    { id: 4, x: 3.9, y: 0 },
    { id: 5, x: 3.9, y: 2 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: true,
};

const INF = Number.POSITIVE_INFINITY;

/** 덱 띠의 칸 수 — 전개에서 덱이 가장 길었을 때. */
const SLOTS = Math.max(...WALK.map((s) => s.dq.length));
const TOTAL_SCANS = (WALK.at(-1) as Step).scans;

/** 덱 띠 둘 — 왼쪽 끝이 앞. 새로 넣은 항목은 새로 씀, 뒤처진 항목은 이번 걸음 밖. */
function dequeStrips(s: Step, slots = SLOTS): GraphStrip[] {
  const states: Partial<Record<number, CellState>> = {};
  s.dq.forEach((x, i) => {
    if (isStale(s, x)) states[i] = "out";
    else if (s.pushedAt === i) states[i] = "focus";
  });
  return [
    {
      label: "덱 · 정점 (왼쪽이 앞)",
      values: s.dq.map((x) => x.v),
      states,
      slots,
    },
    {
      label: "덱 · 넣을 때 거리",
      values: s.dq.map((x) => x.key),
      states,
      slots,
    },
  ];
}

/** 간선이 지금 거리를 낸 간선인가 — 굵은 실선(`tree`)으로 그린다. */
const isTree = (s: Step, index: number): boolean =>
  s.pred[(WALK_EDGES[index] as [number, number, number])[1]] === index;

/* ── 「아이디어를 떠올리는 과정」의 시도 넷 ── */

function approaches(): Approach[] {
  const ops = candidateOps();
  const g8 = grid(8);
  const at = CANDIDATE_LABELS.indexOf("격자 8×8");
  const opsOf = (name: string): number =>
    (ops.find((c) => c.name === name) as { ops: number[] }).ops[at] as number;
  const queue = counted(g8.n, g8.edges, 0, "backOnly");
  const deque = counted(g8.n, g8.edges, 0, "deque");
  const V = 100_000;
  const sweep = 3 * (Math.floor((V - 1) / 2) + 1) * (V - 1);
  return [
    {
      name: "거리 층마다 간선 목록을 다시 읽기",
      idea: "거리 0 인 정점부터 한 층씩, 가중치 0 간선으로 같은 층을 채우고 가중치 1 간선으로 다음 층을 연다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `0 과 1 이 번갈아 나오는 사슬 V = ${comma(V)} 에서 기본 연산 ${comma(sweep)} 번 · ${(sweep / 1e8).toFixed(0)} 초`,
          ok: false,
        },
      ],
      lesson:
        "값을 새로 적는 간선은 거리가 막 바뀐 정점에서 나가는 간선뿐이다 — 그 정점을 담아 두고 하나씩 꺼내자",
    },
    {
      name: "큐 — 전부 뒤에 넣고 앞에서 꺼내기",
      idea: "거리를 고친 정점을 큐 뒤에 넣고 앞에서 꺼내 그 정점의 간선만 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `격자 8×8 에서 간선 검사 ${comma(queue.scans)} 번 — 간선 ${comma(g8.edges.length)} 개보다 많다`,
          ok: false,
        },
      ],
      lesson:
        "거리 d + 1 인 정점이 d 인 정점보다 먼저 나와 다시 꺼낸다 — 거리 차례로 꺼내자",
    },
    {
      name: "우선순위 큐 — 키가 가장 작은 항목 꺼내기",
      idea: "이진 힙에 (정점, 거리) 를 넣고 거리가 가장 작은 항목부터 꺼낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `격자 8×8 에서 기본 연산 ${comma(opsOf("우선순위 큐"))} 번 — 넣고 꺼낼 때마다 키를 비교한다`,
          ok: false,
        },
      ],
      lesson:
        "새로 생기는 거리는 d 아니면 d + 1 두 가지뿐이다 — 비교 없이 앞과 뒤로 가르자",
    },
    {
      name: "덱 — 가중치 0 간선은 앞, 가중치 1 간선은 뒤에 넣기",
      idea: "거리를 고친 정점을 간선 가중치가 0 이면 덱 앞에, 1 이면 덱 뒤에 넣고 앞에서 꺼낸다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `격자 8×8 에서 기본 연산 ${comma(opsOf("덱"))} 번 · 간선 검사 ${comma(deque.scans)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 하나의 무대. */
function stage(i: number): GraphStep {
  const s = WALK[i] as Step;
  const r = s.read;
  const nodes = s.dist.map((d, v) => {
    if (s.kind === "end" && d === -1) {
      return { value: "-1", state: "out" as const };
    }
    if (d === INF) return { value: "", state: "empty" as const };
    let state: CellState | undefined;
    if (s.kind === "start" && v === WALK_SRC) state = "focus";
    else if (r?.improved === true && v === r.v) state = "focus";
    else if (s.popped && s.kind !== "end" && v === s.popped.v) state = "read";
    return { value: String(d), ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map(([, , w], index) => {
    const kind: EdgeKind | undefined = isTree(s, index) ? "tree" : undefined;
    const state: GraphEdge["state"] =
      r?.index === index ? (r.improved ? "focus" : "read") : undefined;
    return {
      ...(kind ? { kind } : {}),
      ...(state ? { state } : {}),
      label: String(w),
    };
  });
  let calc: GraphStep["calc"];
  if (s.kind === "start") calc = { expr: `dist[${WALK_SRC}] =`, result: "0" };
  else if (s.kind === "end") {
    calc = { expr: "deque.size() > 0 →", result: "거짓" };
  } else if (s.kind === "none") {
    calc = {
      expr: `adj[${(s.popped as Item).v}] 의 간선 →`,
      result: "0 개",
    };
  } else {
    const e = r as EdgeRead;
    calc = e.improved
      ? {
          expr: `${e.du} + ${e.w} = ${e.nd} < ${num(e.before)} →`,
          result: e.side === "front" ? "앞에 넣는다" : "뒤에 넣는다",
        }
      : {
          expr: `${e.du} + ${e.w} = ${e.nd} >= ${num(e.before)} →`,
          result: "그대로",
        };
  }
  return {
    nodes,
    edges,
    strips: dequeStrips(s),
    calc,
    vars: `간선 검사 ${s.scans} / ${TOTAL_SCANS}`,
  };
}

function stepTitle(i: number): string {
  const s = WALK[i] as Step;
  if (s.kind === "start") return `${s.t} 시작값 — 덱에 정점 ${WALK_SRC}`;
  if (s.kind === "end") return `${s.t} 덱이 비어 ∞ 칸을 -1 로 적는다`;
  const p = s.popped as Item;
  const who = `정점 ${p.v}${을를(p.v)}`;
  if (s.kind === "none") return `${s.t} ${who} 꺼낸다 — 나가는 간선이 없다`;
  const r = s.read as EdgeRead;
  const stale = p.key > (prevOf(WALK, s).dist[p.v] as number);
  const head = s.firstOfPop
    ? `${who} ${stale ? "다시 " : ""}꺼내 `
    : `정점 ${p.v} 의 `;
  return `${s.t} ${head}${r.u}→${r.v}${을를(r.v)} 본다`;
}

function stepText(i: number): string {
  const s = WALK[i] as Step;
  if (s.kind === "start") {
    return `dist[${WALK_SRC}] 에 0 을 적고 나머지는 ∞ 로 둡니다. 덱에는 정점 ${WALK_SRC}${이가(WALK_SRC)} 넣을 때 거리 0 으로 들어갑니다.`;
  }
  if (s.kind === "end") {
    const out = s.dist
      .map((d, v) => ({ d, v }))
      .filter((x) => x.d === -1)
      .map((x) => x.v);
    const list = out.join(" · ");
    return `덱이 비어 반복이 끝납니다. 한 번도 값을 받지 못한 정점 ${list}${이가(list)} -1 로 적히고, 반환값은 ${show(s.dist)} 입니다.`;
  }
  const p = s.popped as Item;
  const before = prevOf(WALK, s);
  const popLine = s.firstOfPop
    ? `덱 앞에서 정점 ${p.v}${을를(p.v)} 꺼냅니다. 넣을 때 거리는 ${p.key}${josa(p.key, "이고", "고")} 지금 dist[${p.v}] 는 ${num(before.dist[p.v] as number)} 입니다. `
    : "";
  if (s.kind === "none") {
    return `${popLine}이 정점에서 나가는 간선이 없어 볼 것이 없습니다.`;
  }
  const r = s.read as EdgeRead;
  if (!r.improved) {
    return `${popLine}간선 ${r.u}→${r.v} 의 새 값 ${r.du} + ${r.w} = ${r.nd}${이가(r.nd)} 지금 dist[${r.v}] = ${num(r.before)} 보다 작지 않아 그대로 둡니다.`;
  }
  const where =
    r.side === "front"
      ? "가중치가 0 이라 거리가 그대로이므로 덱 앞에 넣습니다"
      : "가중치가 1 이라 거리가 하나 커졌으므로 덱 뒤에 넣습니다";
  return `${popLine}간선 ${r.u}→${r.v} 의 새 값 ${r.du} + ${r.w} = ${r.nd}${이가(r.nd)} 지금 dist[${r.v}] = ${num(r.before)} 보다 작아 고쳐 적고, ${where}.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return WALK.map((_, i) => ({
    title: stepTitle(i),
    text: stepText(i),
    ...stage(i),
  }));
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
function Film({ spec }: { spec: PlayerSpec }) {
  return (
    <NodeGraphFilm
      title={spec.title}
      frames={playerFrames(spec).map((f) => ({
        id: f.id,
        text: f.calc ? `${f.title} · ${f.calc.expr} ${f.calc.result}` : f.title,
        scene: f.scene ?? { nodes: [], edges: [] },
      }))}
    />
  );
}

/* ── 정적 그림들 ── */

const END = WALK.at(-1) as Step;

/** 최종 거리를 정점 안에 적은 정점들. 도달하지 못한 정점은 이번 걸음 밖. */
function finalNodes(): GraphNode[] {
  return LAYOUT.nodes.map((n) => {
    const d = END.dist[n.id] as number;
    return d === -1
      ? { ...n, value: "-1", state: "out" as const }
      : { ...n, value: String(d) };
  });
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => {
    const pops = POPS.map((s) => s.popped as Item);
    const states: Partial<Record<number, CellState>> = {};
    POPS.forEach((s, i) => {
      const p = s.popped as Item;
      if (p.key > (prevOf(WALK, s).dist[p.v] as number)) states[i] = "out";
    });
    return (
      <NodeGraph
        title="전개 입력 — 간선 옆 수는 가중치, 정점 안의 수는 정점 0 에서의 거리"
        nodes={finalNodes()}
        edges={WALK_EDGES.map(([from, to, w], index) => ({
          from,
          to,
          label: String(w),
          ...(isTree(END, index) ? { kind: "tree" as const } : {}),
        }))}
        strips={[
          { label: "꺼낸 차례 · 정점", values: pops.map((x) => x.v), states },
          {
            label: "넣을 때 거리",
            values: pops.map((x) => x.key),
            states,
          },
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint="규모 V ≤ 100,000 · E ≤ 100,000 · 단순 연산 1 초에 1 억 번 기준"
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-groups": () => {
    const s = GROUP_STEP;
    const min = Math.min(...s.dq.map((x) => x.key));
    return (
      <NodeGraph
        title={`${s.t}${이가(s.t)} 끝난 뒤의 덱 — 앞 무리는 넣을 때 거리 ${min}, 뒤 무리는 ${min + 1}, 흐린 칸은 뒤처진 항목`}
        nodes={LAYOUT.nodes.map((n) => {
          const d = s.dist[n.id] as number;
          if (d === INF) return { ...n, value: "", state: "empty" as const };
          const inDeque = s.dq.some((x) => x.v === n.id && !isStale(s, x));
          return {
            ...n,
            value: String(d),
            ...(inDeque ? { state: "read" as const } : {}),
          };
        })}
        edges={WALK_EDGES.map(([from, to, w], index) => ({
          from,
          to,
          label: String(w),
          ...(isTree(s, index) ? { kind: "tree" as const } : {}),
        }))}
        strips={dequeStrips(s)}
      />
    );
  },
  "walk-zero-one-bfs": () => (
    <Film spec={zeroOneWalk as unknown as PlayerSpec} />
  ),
  "related-relabel": () => {
    const writes = WALK.filter((s) => s.read?.v === 1 && s.read.improved);
    const history = ["∞", ...writes.map((s) => String(s.dist[1]))].join("→");
    return (
      <NodeGraph
        title="정점 1 에 적힌 값의 차례 — 두 간선이 차례로 더 작은 값을 적었다"
        nodes={finalNodes().map((n) =>
          n.id === 1 ? { ...n, value: history, state: "focus" as const } : n,
        )}
        edges={WALK_EDGES.map(([from, to, w], index) => {
          const hit = writes.find((s) => s.read?.index === index);
          const r = hit?.read;
          return {
            from,
            to,
            ...(r
              ? {
                  label: `${r.du} + ${r.w} = ${r.nd}`,
                  state: "focus" as const,
                }
              : { label: String(w), state: "out" as const }),
          };
        })}
      />
    );
  },
};
