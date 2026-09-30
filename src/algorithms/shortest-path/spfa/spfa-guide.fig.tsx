/**
 * `spfa-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 거리 · 꺼낸 정점 · 읽은 간선 · 큐의 내용은 정본과 같은
 * 절차에 기록만 덧붙인 사본(`-guide.proof.ts` 의 `record`)이 내고, 그 사본은 이 파일을 읽을 때 자기
 * 답을 정본(`-guide.ref.ts`)과 맞댄다. 시도 사다리의 수도 같은 사이드카의 실행에서 받는다.
 *
 * ## 꺼낸 정점 하나를 무대에 보이는 법 — 새 무대를 만들지 않는다(KAN-058)
 *
 * 이 절차의 걸음 하나는 **정점 하나를 큐에서 꺼내 그 정점의 간선만 읽는 일**이다. 독자가 걸음마다
 * 알아야 할 것은 넷이다 — 정점마다 지금 적힌 거리, 이번에 꺼낸 정점과 그 정점에서 읽은 간선, 간선
 * 목록 가운데 **읽지 않은 간선**, 그리고 큐에 남은 정점이 다음에 나오는 차례. 앞의 둘은 그래프 무대의
 * 정점과 간선이 싣고, 뒤의 둘은 무대 아래 띠 셋(`strips`)이 싣는다. `bellmanFord` 가 세운 간선 목록 ·
 * 후보 띠 둘에 `dijkstra` 가 세운 「꺼낼 차례」 큐 띠를 하나 더한 것이라 무대 · 패턴을 넓히지 않았다
 * (SPEC §13 그래프 줄 — 띠 수는 무대가 정하지 않는다).
 *
 * - 윗 띠 「간선 목록」은 간선을 **적힌 차례대로** 늘어놓는다. 둘째 띠 「dist[u] + w」는 이번 걸음에서
 *   그 간선을 읽을 때 만든 후보다. 같은 칸 번호가 간선 하나다. 값을 고친 간선은 새로 씀(`focus`),
 *   읽었지만 못 고친 간선은 읽음(`read`), **이번 걸음이 읽지 않은 간선은 이번 걸음 밖(`out`)** 이다 —
 *   라운드 방식이라면 읽었을 간선이 흐리게 남는 것이 이 편의 요점이다.
 * - 셋째 띠 「큐 · 정점」은 걸음이 끝난 뒤 큐에 남은 정점을 **꺼낼 차례대로** 늘어놓는다(`dijkstra`
 *   의 띠와 같은 규약). 이번 걸음에 넣은 정점은 새로 씀이다. 칸 수는 큐가 가장 길었을 때에 맞춘다.
 * - 정점 안의 값은 걸음이 끝난 뒤의 `dist` 이고, 이번에 꺼낸 정점은 읽음, 값이 바뀐 정점은 새로 씀이다.
 *   아직 값이 없는 정점은 점선(`empty`)이고 끝난 뒤에도 값이 없으면 이번 걸음 밖에 `Infinity` 를 적는다.
 * - 굵은 실선(`tree`)은 지금 그 정점의 값을 낸 간선이다.
 *
 * 정점 좌표(`LAYOUT`)는 값이 아니라 배치다 — 시작 정점 0 과 정점 3 을 윗줄 양 끝에 두어 곧장 가는 간선
 * `0 → 3` 이 맨 위를 지나게 하고, 돌아가는 길의 정점 1 · 2 를 그 아래 가운데에 위아래로 놓았다. 그러면
 * 정점 0 · 1 · 2 · 3 사이의 간선 여섯이 서로 겹치지 않는다. 들어오는 간선이 없는 정점 5 는 오른쪽 아래에
 * 둔다.
 */

import type { ReactElement } from "react";
import { josa } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
} from "../../../_viz/patterns/NodeGraph";
import type { GraphStep } from "../../../_viz/player/graphStage";
import { type PlayerSpec, playerFrames } from "../../../_viz/player/StepPlayer";
import {
  arrow,
  chain,
  comma,
  complete,
  counted,
  countSimplePaths,
  E_LIMIT,
  num,
  type Pop,
  plusW,
  qshow,
  rounds,
  show,
  V_LIMIT,
  WALK,
  WALK_EDGES,
  WALK_N,
  WALK_SRC,
  으로,
  은는,
  을를,
  이가,
} from "./spfa-guide.proof.ts";
import { spfaWalk } from "./spfa-guide.sim.ts";

const INF = Number.POSITIVE_INFINITY;

/** 입력 그래프의 배치 — 패널(`.sim.ts` 의 `layout`)과 정적 그림이 같은 자리를 쓴다. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 0 },
    { id: 1, x: 1.4, y: 0.75 },
    { id: 2, x: 1.4, y: 1.75 },
    { id: 3, x: 2.8, y: 0 },
    { id: 4, x: 4.1, y: 0 },
    { id: 5, x: 4.1, y: 1.2 },
  ],
  edges: WALK_EDGES.map(([from, to]) => ({ from, to })),
  directed: true,
};

const TOTAL_READS = WALK.pops.reduce((a, p) => a + p.reads.length, 0);
/** 큐 띠의 칸 수 — 큐가 가장 길었을 때. 시작할 때의 한 칸도 센다. */
const SLOTS = Math.max(1, ...WALK.pops.map((p) => p.queue.length));

/** 무대 아래 띠 셋 — 간선 목록 · 그 걸음의 후보 · 큐. */
function strips(p: Pop | null, queue: readonly number[]): GraphStrip[] {
  const states: Partial<Record<number, CellState>> = {};
  const cands: string[] = WALK_EDGES.map(() => "");
  if (p) {
    WALK_EDGES.forEach((_, at) => {
      states[at] = "out";
    });
    for (const r of p.reads) {
      states[r.at] = r.improved ? "focus" : "read";
      cands[r.at] = num(r.cand);
    }
  }
  const pushed = new Set(
    p ? p.reads.filter((r) => r.pushed).map((r) => r.v) : [WALK_SRC],
  );
  const qStates: Partial<Record<number, CellState>> = {};
  queue.forEach((v, i) => {
    if (pushed.has(v)) qStates[i] = "focus";
  });
  return [
    {
      label: "간선 목록",
      values: WALK_EDGES.map((e) => arrow(e)),
      states,
      slots: WALK_EDGES.length,
    },
    {
      label: "dist[u] + w",
      values: cands,
      states,
      slots: WALK_EDGES.length,
    },
    {
      label: "큐 · 정점",
      values: [...queue],
      states: qStates,
      slots: SLOTS,
    },
  ];
}

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & GraphStep;

/** 걸음 `i` — 0 이 T1(준비), 1..P 가 꺼내기, P+1 이 반환. */
function stage(i: number): GraphStep {
  const P = WALK.pops.length;
  const p = i >= 1 && i <= P ? (WALK.pops[i - 1] as Pop) : null;
  const end = i === P + 1;
  const dist = i === 0 ? WALK.start : end ? WALK.dist : (p as Pop).dist;
  const pred =
    i === 0
      ? WALK_EDGES.map(() => -1)
      : ((WALK.pops[Math.min(i, P) - 1] as Pop).pred as number[]);
  const written = new Set(
    p ? p.reads.filter((r) => r.improved).map((r) => r.v) : [],
  );
  const nodes = dist.map((d, v) => {
    if (d === INF) {
      return end
        ? { value: "Infinity", state: "out" as const }
        : { value: "", state: "empty" as const };
    }
    let state: CellState | undefined;
    if (i === 0 && v === WALK_SRC) state = "focus";
    else if (written.has(v)) state = "focus";
    else if (p && v === p.u) state = "read";
    return { value: `dist ${num(d)}`, ...(state ? { state } : {}) };
  });
  const edges = WALK_EDGES.map((e, at) => {
    const r = p?.reads.find((x) => x.at === at);
    const state = r ? (r.improved ? "focus" : "read") : undefined;
    return {
      ...(pred[e[1]] === at ? { kind: "tree" as const } : {}),
      ...(state ? { state: state as "focus" | "read" } : {}),
      label: String(e[2]),
    };
  });
  const queue = i === 0 ? [WALK_SRC] : end ? [] : (p as Pop).queue;
  const done = WALK.pops
    .slice(0, Math.min(i, P))
    .reduce((a, x) => a + x.reads.length, 0);
  let calc: GraphStep["calc"];
  if (i === 0) calc = { expr: `dist[${WALK_SRC}] =`, result: "0" };
  else if (end) calc = { expr: `head < queue.length =`, result: "거짓" };
  else {
    const q = p as Pop;
    calc = {
      expr: `head ${q.headBefore} < 길이 ${q.lenBefore} → 꺼낸 정점 =`,
      result: String(q.u),
    };
  }
  return {
    nodes,
    edges,
    strips: strips(i === 0 || end ? null : p, queue),
    calc,
    vars: `간선 읽기 ${done} / ${TOTAL_READS} · 꺼내기 ${Math.min(i, P)} / ${P}`,
  };
}

function stepTitle(i: number): string {
  const P = WALK.pops.length;
  if (i === 0) return "T1 이웃 목록 · 시작값 · 큐";
  if (i === P + 1) return `T${i + 1} 큐가 비어 dist 를 돌려준다`;
  const p = WALK.pops[i - 1] as Pop;
  const fixed = p.reads.filter((r) => r.improved).map((r) => `dist[${r.v}]`);
  const head = `T${i + 1} 정점 ${p.u}${을를(p.u)} 꺼낸다`;
  if (p.reads.length === 0) return `${head} — 나가는 간선이 없다`;
  if (fixed.length === 0) return `${head} — 고친 칸이 없다`;
  const lastV = (p.reads.filter((r) => r.improved).at(-1) as { v: number }).v;
  return `${head} — ${fixed.join(" · ")}${을를(String(lastV))} 고친다`;
}

function stepText(i: number): string {
  const P = WALK.pops.length;
  if (i === 0) {
    return `간선 ${WALK_EDGES.length} 개를 꼬리 정점별로 모아 이웃 목록을 만들고, dist[${WALK_SRC}] 에 0 을 적은 뒤 나머지 ${WALK_N - 1} 칸은 Infinity 로 둡니다. 큐에는 시작 정점 ${WALK_SRC} 하나가 들어 있습니다.`;
  }
  if (i === P + 1) {
    const out = WALK.dist.flatMap((d, v) => (d === INF ? [v] : []));
    return `head 가 queue.length 와 같아져 반복이 끝났습니다. ${show(WALK.dist)}${을를(show(WALK.dist))} 돌려줍니다. 들어오는 간선이 없는 정점 ${out.join(" · ")}${은는(out.join(" · "))} 한 번도 큐에 들지 않아 Infinity 로 남았습니다.`;
  }
  const p = WALK.pops[i - 1] as Pop;
  const skipped = WALK_EDGES.length - p.reads.length;
  const head = `정점 ${p.u}${을를(p.u)} 꺼내 표시를 내리고, 그 정점에서 나가는 간선 ${p.reads.length} 개만 읽습니다. 간선 목록의 나머지 ${skipped} 개는 읽지 않습니다.`;
  if (p.reads.length === 0) {
    return `정점 ${p.u}${을를(p.u)} 꺼냈지만 나가는 간선이 없어 한 개도 읽지 않습니다. 큐에는 ${qshow(p.queue)}${이가(qshow(p.queue))} 남습니다.`;
  }
  const parts = p.reads.map((r) => {
    const e = arrow([r.u, r.v, r.w]);
    const calc = `${num(r.du)} + ${plusW(r.w)} = ${num(r.cand)}`;
    if (!r.improved)
      return `${e}${은는(e)} ${calc}${이가(num(r.cand))} ${num(r.before)} 보다 작지 않아 그대로입니다`;
    const fix =
      r.before === INF
        ? `${e}${이가(e)} ${calc}${을를(num(r.cand))} 처음 적습니다`
        : `${e}${이가(e)} ${num(r.before)}${을를(num(r.before))} ${calc}${으로(num(r.cand))} 고칩니다`;
    if (r.pushed)
      return `${fix}. 정점 ${r.v}${은는(r.v)} 큐에 없어 뒤에 넣습니다`;
    return `${fix}. 정점 ${r.v}${은는(r.v)} 이미 큐에 있어 넣지 않습니다`;
  });
  return `${head} ${parts.join(". ")}. 큐에는 ${qshow(p.queue)}${이가(qshow(p.queue))} 남습니다.`;
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이
 * 결과를 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return Array.from({ length: WALK.pops.length + 2 }, (_, i) => ({
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

/* ── 「아이디어를 떠올리는 과정」의 시도 셋 ── */

function approaches(): Approach[] {
  const ten = countSimplePaths(10, complete(10), 0);
  const early = rounds(WALK_N, WALK_EDGES, WALK_SRC, true);
  const desc = chain(64, true);
  const descRounds = rounds(64, desc, 0, true);
  const mine = counted(WALK_N, WALK_EDGES, WALK_SRC);
  const mineDesc = counted(64, desc, 0);
  return [
    {
      name: "경로를 전부 나열하기",
      idea: "시작 정점에서 나가는 단순 경로를 전부 만들어 도착 정점마다 가장 작은 비용을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "음수 가중치가 있어도 맞다", ok: true },
        {
          label: "시간",
          value: `정점 10 개 완전 그래프에서 경로 ${comma(ten)} 개 · V = ${V_LIMIT}${josa(V_LIMIT, "이면", "면")} ${V_LIMIT - 1}! 개 이상`,
          ok: false,
        },
      ],
      lesson: "경로가 아니라 정점마다 거리 하나를 들고 완화를 되풀이하자",
    },
    {
      name: "간선 목록을 라운드마다 다시 읽기 — 벨만-포드",
      idea: "간선 전부를 차례로 읽어 완화하고, 한 라운드가 한 칸도 못 고치면 멈춘다",
      verdict: "drop",
      checks: [
        { label: "답", value: "음수 사이클이 없으면 맞다", ok: true },
        {
          label: "헛읽기",
          value: `전개 입력에서 간선 읽기 ${early.reads} 번 중 ${early.reads - early.writes} 번이 아무것도 못 고친다`,
          ok: false,
        },
        {
          label: "시간",
          value: `내림차순 사슬 V = 64 에서 라운드 ${descRounds.rows.length} 번 · 간선 읽기 ${comma(descRounds.reads)} 번`,
          ok: false,
        },
      ],
      lesson:
        "「고친 칸이 있었다」만 남기면 다음 라운드가 목록 전체를 읽는다 — 무엇이 바뀌었는지를 남기자",
    },
    {
      name: "값이 바뀐 정점만 큐에 넣어 그 간선만 다시 읽기",
      idea: "값이 줄어든 정점을 큐에 넣고, 하나씩 꺼내 그 정점에서 나가는 간선만 완화한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "음수 사이클이 없으면 맞다", ok: true },
        {
          label: "헛읽기",
          value: `전개 입력에서 간선 읽기 ${mine.reads} 번 중 ${mine.reads - mine.writes} 번`,
          ok: true,
        },
        {
          label: "시간",
          value: `내림차순 사슬 V = 64 에서 간선 읽기 ${comma(mineDesc.reads)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 묶음 필름 — 묶음 k 마다 꺼낸 정점과 그 동안 넣은 정점 ── */

/** 큐에 들어온 차례 — 시작 정점과 이후에 넣은 정점을 넣은 차례대로. 묶음 번호도 함께. */
function entries(): { v: number; wave: number }[] {
  const out = [{ v: WALK_SRC, wave: 0 }];
  for (const p of WALK.pops) {
    for (const r of p.reads)
      if (r.pushed) out.push({ v: r.v, wave: p.wave + 1 });
  }
  return out;
}

function WaveFilm() {
  const all = entries();
  const frames = WALK.waves.map((members, k) => {
    const pops = WALK.pops.filter((p) => p.wave === k);
    const last = pops.at(-1) as Pop;
    const dist = WALK.waveDist[k] as number[];
    const written = new Set(
      pops.flatMap((p) => p.reads.filter((r) => r.improved).map((r) => r.v)),
    );
    const readAt = new Map<number, "focus" | "read">();
    for (const p of pops) {
      for (const r of p.reads) {
        if (r.improved) readAt.set(r.at, "focus");
        else if (!readAt.has(r.at)) readAt.set(r.at, "read");
      }
    }
    const pushed = pops.flatMap((p) =>
      p.reads.filter((r) => r.pushed).map((r) => r.v),
    );
    const qStates: Partial<Record<number, CellState>> = {};
    all.forEach((x, i) => {
      if (x.wave === k) qStates[i] = "read";
      else if (x.wave === k + 1) qStates[i] = "focus";
      else if (x.wave > k + 1) qStates[i] = "out";
    });
    return {
      id: `묶음 ${k}`,
      text: `꺼낸 정점 ${members.join(" · ")} — 이 묶음이 넣은 정점 ${pushed.length === 0 ? "없음" : pushed.join(" · ")}`,
      scene: {
        nodes: LAYOUT.nodes.map((n) => {
          const d = dist[n.id] as number;
          if (d === INF) return { ...n, value: "", state: "empty" as const };
          const state = written.has(n.id)
            ? ("focus" as const)
            : members.includes(n.id)
              ? ("read" as const)
              : undefined;
          return { ...n, value: `dist ${num(d)}`, ...(state ? { state } : {}) };
        }),
        edges: WALK_EDGES.map((e, at) => {
          const st = readAt.get(at);
          return {
            ...LAYOUT.edges[at],
            from: e[0],
            to: e[1],
            label: String(e[2]),
            ...(last.pred[e[1]] === at ? { kind: "tree" as const } : {}),
            ...(st ? { state: st } : {}),
          };
        }),
        strips: [
          {
            label: "큐에 들어온 차례",
            values: all.map((x) => x.v),
            states: qStates,
            slots: all.length,
          },
          {
            label: "묶음",
            values: all.map((x) => x.wave),
            states: qStates,
            slots: all.length,
          },
        ],
      },
    };
  });
  return (
    <NodeGraphFilm
      title="묶음 k = 0 … 4 — 굵은 테는 이 묶음에서 값이 바뀐 정점, 띠의 읽음 칸이 이 묶음, 새로 씀 칸이 이 묶음이 넣은 다음 묶음"
      frames={frames}
    />
  );
}

/* ── 정적 그림들 ── */

/** 최종 거리를 정점 안에 적은 정점들. 도달하지 못한 정점은 이번 걸음 밖. */
function finalScene() {
  const last = WALK.pops.at(-1) as Pop;
  return {
    nodes: LAYOUT.nodes.map((n) => {
      const d = WALK.dist[n.id] as number;
      return d === INF
        ? { ...n, value: "Infinity", state: "out" as const }
        : { ...n, value: `거리 ${num(d)}` };
    }),
    edges: WALK_EDGES.map((e, at) => ({
      ...LAYOUT.edges[at],
      from: e[0],
      to: e[1],
      label: String(e[2]),
      ...(last.pred[e[1]] === at ? { kind: "tree" as const } : {}),
    })),
  };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title="전개 입력 — 간선 옆 수는 가중치, 정점 안의 수는 정점 0 에서의 최단 거리"
      {...finalScene()}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${V_LIMIT} · E ≤ ${comma(E_LIMIT)} · 가중치에 음수가 있다 · 시작 정점에서 갈 수 있는 음수 사이클은 없다`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-waves": () => <WaveFilm />,
  "walk-spfa": () => <Film spec={spfaWalk as unknown as PlayerSpec} />,
};
