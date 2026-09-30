/**
 * `floydWarshall-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. 라운드마다의 거리 행렬 · 고친 칸 · 건너뛴 행은 정본과 같은
 * 절차에 기록만 덧붙인 사본(`-guide.proof.ts` 의 `counted`)이 내고, 그 사본은 증명 사이드카를 읽을 때 자기
 * 답을 정본(`-guide.ref.ts`)과 맞댄다. 층(`opt_k`)은 증명 사이드카의 `byDefinition` 이 단순 경로를 전부
 * 만들어 낸다.
 *
 * ## 무대 — 「2 차원 표」를 넓히지 않고 쓴다(KAN-058)
 *
 * 이 절차가 쌓는 구조는 거리 행렬 하나이고, 줄이 출발 정점 `u` · 열이 도착 정점 `v` 다. 독자가 걸음마다
 * 알아야 할 것은 셋이다 — 라운드 `k` 가 **`k` 행과 `k` 열만 읽는다**는 것, 그 둘을 더한 후보가 더 작은
 * 칸만 고친다는 것, 그리고 `dist[u][k]` 가 `INF` 인 행은 통째로 건너뛴다는 것. 셋 다 2 차원 표 무대의
 * 칸 상태 셋(`read` · `write` · `out`)에 그대로 들어가므로 무대 · 패턴을 넓히지 않았다.
 *
 * - `read` 는 `k` 행과 `k` 열의 칸 전부다. 이 라운드의 후보는 전부 그 두 줄에서 만든다.
 * - `write` 는 이번 라운드에 고친 칸이다.
 * - `out`(이번 걸음 밖)은 건너뛴 행의 칸이다. 그 행의 `k` 열 칸은 건너뛸지 판정할 때 읽었으므로 `read` 로 둔다.
 * - `INF` 칸은 `null`(점선 · 값 없음)로 그린다. 곁말 「채움 x / n」이 곧 그 행에서 길을 찾은 칸 수다.
 *
 * 입력 그래프의 배치(`LAYOUT`)는 값이 아니라 자리다 — 사이클 `0 → 1 → 2 → 0` 을 왼쪽 삼각형으로 두고, 3 과
 * 4 를 오른쪽에 둔다. 같은 방향 간선 둘(`0 → 1` 의 3 과 4)은 무거운 쪽을 휘어 겹치지 않게 한다.
 */

import type { ReactElement } from "react";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import { CellStage, CellStageFilm } from "../../../_viz/patterns/CellStage";
import { NodeGraph } from "../../../_viz/patterns/NodeGraph";
import {
  playerFrames,
  type TablePlayerSpec,
} from "../../../_viz/player/StepPlayer";
import {
  type TableCell,
  type TableOptions,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import {
  at,
  byDefinition,
  comma,
  countedLite,
  cycle,
  dense,
  doubling,
  E_LIMIT,
  type Edge,
  kInnermost,
  oneRound,
  pathCount,
  pathDigits,
  plus,
  type Round,
  V_LIMIT,
  WALK,
  WALK_EDGES,
  WALK_N,
  WALK_STEPS,
  다른칸,
} from "./floydWarshall-guide.proof.ts";
import { floydWarshall, INF } from "./floydWarshall-guide.ref.ts";

/** 거리 행렬 무대의 줄 머리 · 열 머리 — 패널(`.sim.ts`)과 정적 그림이 같은 머리를 쓴다. */
export function tableOptions(n: number): TableOptions {
  return {
    rowHeads: Array.from({ length: n }, (_, u) => `u=${u}`),
    colHeads: Array.from({ length: n }, (_, v) => v),
    colLabel: "v",
  };
}

export const TABLE_OPTIONS = tableOptions(WALK_N);

/** 무대에 싣는 거리 행렬 — `INF` 는 값 없는 칸(`null`)이다. */
const shown = (m: number[][]): (number | null)[][] =>
  m.map((row) => row.map((x) => (x === INF ? null : x)));

/** `k` 행과 `k` 열의 칸 전부. */
function crossOf(n: number, k: number): TableCell[] {
  const out: TableCell[] = [];
  for (let v = 0; v < n; v++) out.push([k, v]);
  for (let u = 0; u < n; u++) if (u !== k) out.push([u, k]);
  return out;
}

/** 건너뛴 행의 칸 — `k` 열 칸만 뺀다(그 칸은 건너뛸지 판정할 때 읽었다). */
function skippedCells(n: number, k: number, rows: number[]): TableCell[] {
  const out: TableCell[] = [];
  for (const u of rows) {
    for (let v = 0; v < n; v++) if (v !== k) out.push([u, v]);
  }
  return out;
}

/** 고친 칸 하나를 `(3, 0) = -1 + 5 = 4` 꼴로. */
const fixText = (f: Round["changed"][number]): string =>
  `${at(f.u, f.v)} = ${f.a} + ${plus(f.b)} = ${f.value}`;

/* ── 걸음 재생 패널 — 정본과 같은 절차의 기록에서 걸음을 만든다 ── */

type SimStep = { readonly title: string; readonly text: string } & TableStep;

const TOTAL_OPS = WALK.ops;

/** 걸음 `i` — 0 이 T1(간선 옮겨 적기), 1..V 가 라운드, V+1 이 반환. */
function simStep(i: number): SimStep {
  const n = WALK_N;
  if (i === 0) {
    const start = WALK.start;
    const write: TableCell[] = [];
    start.forEach((row, u) => {
      row.forEach((x, v) => {
        if (x !== INF) write.push([u, v]);
      });
    });
    const dup = WALK_EDGES.filter(([u, v]) => u === 0 && v === 1).map(
      ([, , w]) => w,
    );
    const finite = write.length;
    return {
      title: "T1 거리 행렬을 간선으로 채운다",
      text: `대각선 ${n} 칸에 0 을 적고 간선 ${WALK_EDGES.length} 개를 옮겨 적습니다. 0 → 1 은 가중치 ${dup.join(" · ")} 로 둘이라 작은 ${Math.min(...dup)} 만 남습니다. 값이 있는 칸은 ${finite} 개이고 나머지는 아직 길을 못 찾은 INF 입니다.`,
      table: shown(start),
      write,
      calc: {
        expr: `dist[0][1] = min(${dup.join(", ")}) =`,
        result: String(Math.min(...dup)),
      },
      vars: `기본 연산 ${WALK.cells + WALK.copies} / ${TOTAL_OPS}`,
    };
  }
  if (i === WALK_STEPS - 1) {
    const inf = WALK.dist.flat().filter((x) => x === INF).length;
    const dead = WALK.dist.map((row) => row.filter((x) => x === INF).length);
    return {
      title: `T${i + 1} 거리 행렬을 돌려준다`,
      text: `라운드 ${n - 1} 까지 끝나 모든 정점을 중간에 쓸 수 있게 됐으므로 이 거리 행렬이 답입니다. 점선으로 남은 ${inf} 칸은 값을 못 채운 것이 아니라 그 쌍 사이에 길이 없다는 뜻이고, 전부 열 4 에 있습니다 — 정점 4 로 들어오는 간선이 없습니다.`,
      table: shown(WALK.dist),
      rowSide: dead.map((d) => (d === 0 ? null : `INF ${d} 칸`)),
      calc: { expr: "INF 로 남은 칸 =", result: `${inf} 개` },
      vars: `기본 연산 ${TOTAL_OPS} / ${TOTAL_OPS}`,
    };
  }
  const r = WALK.rounds[i - 1] as Round;
  const k = r.k;
  const done =
    WALK.cells +
    WALK.copies +
    WALK.rounds.slice(0, i).reduce((a, x) => a + x.ops, 0);
  const skip =
    r.skipped.length === 0
      ? `건너뛰는 행이 없습니다.`
      : `dist[u][${k}]${이가(k)} INF 인 행 ${r.skipped.join(" · ")}${은는(r.skipped.at(-1) as number)} 건너뜁니다.`;
  const fixes =
    r.changed.length === 0
      ? "후보가 더 작은 칸이 없어 한 칸도 고치지 않습니다."
      : `${r.changed.map((f) => `${fixText(f)}`).join(" · ")}${으로(r.changed.at(-1)?.value as number)} 고칩니다.`;
  return {
    title:
      r.changed.length === 0
        ? `T${i + 1} 라운드 ${k} — 고친 칸이 없다`
        : `T${i + 1} 라운드 ${k} — 칸 ${r.changed.length} 개를 고친다`,
    text: `${k} 행과 ${k} 열을 읽어 후보 dist[u][${k}] + dist[${k}][v] 를 만듭니다. ${skip} ${fixes}`,
    table: shown(r.snapshot),
    read: crossOf(n, k),
    write: r.changed.map((f) => [f.u, f.v] as TableCell),
    out: skippedCells(n, k, r.skipped),
    calc: {
      expr: `dist[u][${k}] + dist[${k}][v] < dist[u][v] 인 칸 =`,
      result: `${r.changed.length} 개`,
    },
    vars: `기본 연산 ${done} / ${TOTAL_OPS}`,
  };
}

/**
 * 걸음 재생 패널의 걸음 데이터 — 정본과 같은 절차의 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 가이드 시험이 잰다.
 */
export function stageStepsFromRef(): SimStep[] {
  return Array.from({ length: WALK_STEPS }, (_, i) => simStep(i));
}

/** 패널과 같은 설정 — 정적 그림이 패널과 같은 무대를 그리게 한다. */
export function walkSpec(): TablePlayerSpec {
  return {
    player: "stage",
    stage: "table",
    ...TABLE_OPTIONS,
    title:
      "floydWarshall(5, [[0,1,3],[0,1,4],[1,2,-2],[2,0,5],[2,3,3],[3,1,1],[4,3,2]])",
    steps: stageStepsFromRef(),
  };
}

/** 걸음 재생 패널의 정적 그림 — 패널과 같은 무대를 걸음마다 한 장씩. */
function Film({ spec }: { spec: TablePlayerSpec }) {
  const frames = playerFrames(spec);
  return (
    <CellStageFilm
      title={`${spec.title} — 행은 출발 u, 열은 도착 v, 점선 칸은 INF`}
      columns={frames[0]?.columns ?? 0}
      frames={frames.map((f) => ({
        id: f.id,
        text: f.calc ? `${f.title} · ${f.calc.expr} ${f.calc.result}` : f.title,
        rows: f.rows,
      }))}
    />
  );
}

/* ── 입력 그래프 ── */

/** 입력 그래프의 배치. */
export const LAYOUT = {
  nodes: [
    { id: 0, x: 0, y: 1 },
    { id: 1, x: 1.4, y: 0 },
    { id: 2, x: 1.4, y: 2 },
    { id: 3, x: 3, y: 1 },
    { id: 4, x: 4.4, y: 1 },
  ],
  bend: (e: Edge, at0: number): number | undefined => {
    // 같은 방향 간선이 둘이면 뒤에 적힌 것을 휜다.
    const first = WALK_EDGES.findIndex(([u, v]) => u === e[0] && v === e[1]);
    return first !== at0 ? 0.35 : undefined;
  },
};

function inputEdges() {
  return WALK_EDGES.map((e, at0) => {
    const b = LAYOUT.bend(e, at0);
    return {
      from: e[0],
      to: e[1],
      label: String(e[2]),
      ...(b === undefined ? {} : { bend: b }),
    };
  });
}

/* ── 「아이디어를 떠올리는 과정」의 시도 다섯 ── */

function approaches(): Approach[] {
  const want = floydWarshall(WALK_N, WALK_EDGES);
  const once = oneRound(WALK_N, WALK_EDGES);
  const wrongOnce = 다른칸(once, want);
  const big = 128;
  const d = doubling(big, dense(big));
  const f = countedLite(big, dense(big));
  const perSourceBound = V_LIMIT * (V_LIMIT + (V_LIMIT - 1) * E_LIMIT);
  const fw = V_LIMIT ** 3 + 2 * V_LIMIT ** 2 + E_LIMIT;
  return [
    {
      name: "경로를 전부 나열하기",
      idea: "정점 쌍마다 단순 경로를 전부 만들어 가장 작은 비용을 고른다",
      verdict: "drop",
      checks: [
        { label: "답", value: "음수 가중치가 있어도 맞다", ok: true },
        {
          label: "시간",
          value: `정점 10 개에서 경로 ${comma(pathCount(10))} 개 · 정점 ${V_LIMIT} 이면 ${comma(pathDigits(V_LIMIT))} 자리 수`,
          ok: false,
        },
      ],
      lesson: "경로가 아니라 쌍마다 거리 하나를 들고 고쳐 가자",
    },
    {
      name: "출발점마다 벨만-포드",
      idea: "출발점 하나의 최단 거리를 구하는 절차를 정점 수만큼 되풀이한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "음수 가중치가 있어도 맞다", ok: true },
        {
          label: "시간",
          value: `라운드를 다 채우면 V · (V + (V − 1) · E) = ${comma(perSourceBound)} 번`,
          ok: false,
        },
      ],
      lesson:
        "출발점이 바뀔 때마다 같은 간선을 처음부터 다시 읽는다 — 모든 쌍을 거리 행렬 하나에 담아 함께 채우자",
    },
    {
      name: "경유를 한 번만 허용하기",
      idea: "모든 칸에 dist[u][k] + dist[k][v] 를 한 번씩 넣어 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `전개 입력에서 ${wrongOnce} 칸이 틀린다 — 중간 정점이 둘 이상인 길을 못 본다`,
          ok: false,
        },
      ],
      lesson:
        "경유를 넓혀야 한다 — 넓히는 축은 경유 횟수와 경유 정점의 번호 둘이다",
    },
    {
      name: "경유 횟수를 배로 늘리기",
      idea: "거리 행렬끼리 (min, +) 곱을 해 간선 수 한도를 1 · 2 · 4 … 로 늘린다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `정점 ${big} 에서 기본 연산 ${comma(d.ops)} 번 — 번호를 넓히는 쪽의 ${(d.ops / f.ops).toFixed(2)} 배`,
          ok: false,
        },
      ],
      lesson:
        "곱 한 번이 V³ 이고 그것을 log V 번 한다 — 거리 행렬을 곱하지 말고 제자리에서 고치자",
    },
    {
      name: "경유 정점을 번호 순으로 넓히기",
      idea: "k = 0 부터 V − 1 까지 정점 k 를 중간에 허용하며 모든 칸을 한 번씩 완화한다",
      verdict: "keep",
      checks: [
        { label: "답", value: "음수 가중치가 있어도 맞다", ok: true },
        {
          label: "시간",
          value: `V³ + 2V² + E 이하 — V = ${V_LIMIT} 이면 ${comma(fw)} 번`,
          ok: true,
        },
      ],
    },
  ];
}

/* ── 층(opt_k) 필름 ── */

function LayerFilm() {
  const n = WALK_N;
  let prev: number[][] | null = null;
  const frames = [];
  for (let k = -1; k < n; k++) {
    const cur = byDefinition(n, WALK_EDGES, k);
    const lower: TableCell[] = [];
    if (prev) {
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          if (
            ((cur[u] as number[])[v] as number) <
            ((prev[u] as number[])[v] as number)
          ) {
            lower.push([u, v]);
          }
        }
      }
    }
    const text =
      k < 0
        ? "중간 정점 없음 — 빈 경로와 간선 하나짜리 경로만"
        : lower.length === 0
          ? `중간 정점 0..${k} — 줄어든 칸이 없다`
          : `중간 정점 0..${k} — 줄어든 칸 ${lower.map(([u, v]) => at(u, v)).join(" · ")}`;
    frames.push({
      id: `k=${k}`,
      text,
      rows: tableStage(
        {
          table: shown(cur),
          ...(k >= 0 ? { read: crossOf(n, k) } : {}),
          write: lower,
        },
        TABLE_OPTIONS,
      ),
    });
    prev = cur;
  }
  return (
    <CellStageFilm
      title="층 k = -1 … 4 — 칸 (u, v) 는 중간 정점을 0..k 만 쓰는 최단 비용, 강조한 칸이 앞 층보다 줄어든 칸"
      columns={n}
      frames={frames}
    />
  );
}

/* ── 반복문 순서를 바꾼 판 ── */

function LoopOrderFilm() {
  const n = 6;
  const edges = cycle(n);
  const want = floydWarshall(n, edges);
  const run = kInnermost(n, edges);
  const opts = tableOptions(n);
  const frames = run.rows.map((row) => {
    const out: TableCell[] = [];
    for (let u = row.u + 1; u < n; u++) {
      for (let v = 0; v < n; v++) out.push([u, v]);
    }
    const wrongInRow = (row.snapshot[row.u] as number[]).filter(
      (x, v) => x !== (want[row.u] as number[])[v],
    ).length;
    return {
      id: `u=${row.u}`,
      text: `행 ${row.u}${을를(row.u)} 끝냈다 — 고친 칸 ${row.fixed.length} 개 · 정본과 다른 칸 ${wrongInRow} 개`,
      rows: tableStage(
        {
          table: shown(row.snapshot),
          write: row.fixed.map((v) => [row.u, v] as TableCell),
          out,
        },
        opts,
      ),
    };
  });
  const bad: TableCell[] = [];
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if ((run.dist[u] as number[])[v] !== (want[u] as number[])[v])
        bad.push([u, v]);
    }
  }
  frames.push({
    id: "정본",
    text: `k 를 바깥에 둔 정본의 답 — 강조한 ${bad.length} 칸이 k 를 안쪽에 둔 판에서 INF 로 남은 칸`,
    rows: tableStage({ table: shown(want), write: bad }, opts),
  });
  return (
    <CellStageFilm
      title={`k 를 가장 안쪽에 둔 판 — 사이클 ${edges.map(([u, v]) => `${u}→${v}`).join(" ")}, 대시 행은 아직 안 채운 행`}
      columns={n}
      frames={frames}
    />
  );
}

/* ── 그림 ── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-graph": () => (
    <NodeGraph
      title={`전개 입력 — 정점 ${WALK_N} · 간선 ${WALK_EDGES.length}, 간선 옆 수는 가중치`}
      nodes={LAYOUT.nodes}
      edges={inputEdges()}
    />
  ),
  "concept-matrix": () => (
    <CellStage
      title="답인 거리 행렬 — 칸 (u, v) 는 u 에서 v 로 가는 최단 거리, 점선 칸은 INF"
      rows={tableStage({ table: shown(WALK.dist) }, TABLE_OPTIONS)}
      columns={WALK_N}
    />
  ),
  "concept-relax": () => {
    const r = WALK.rounds[2] as Round;
    const f = r.changed.find(
      (x) => x.u === 3 && x.v === 0,
    ) as Round["changed"][number];
    const before = (WALK.rounds[1] as Round).snapshot.map((row) => row.slice());
    (before[f.u] as number[])[f.v] = f.value;
    return (
      <CellStage
        title={`라운드 ${r.k}${이가(r.k)} 칸 ${at(f.u, f.v)}${을를(f.v)} 완화 — dist[${f.u}][${r.k}] + dist[${r.k}][${f.v}] = ${f.a} + ${plus(f.b)} = ${f.value} < INF`}
        rows={tableStage(
          {
            table: shown(before),
            read: [
              [f.u, r.k],
              [r.k, f.v],
            ],
            write: [[f.u, f.v]],
          },
          TABLE_OPTIONS,
        )}
        columns={WALK_N}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`규모 V ≤ ${V_LIMIT} · E ≤ ${comma(E_LIMIT)} · 가중치에 음수가 있다 · 단순 연산 1 초에 1 억 번 기준`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-layers": () => <LayerFilm />,
  "pause-loop-order": () => <LoopOrderFilm />,
  "walk-floyd": () => <Film spec={walkSpec()} />,
};
