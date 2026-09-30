/**
 * `knuthOptimization-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. DP 테이블(`dp` 와 `opt`)은 정본(`-guide.ref.ts`)과 같은
 * 절차를 세는 자리만 덧붙여 적은 사본(`-guide.proof.ts` 의 `counted` · `fullScan` · `walkSteps`)이 낸다.
 * 그 사본들은 이 파일을 읽을 때 정본과 같은 답을 내는지 스스로 대조한다.
 *
 * **DP 테이블은 2 차원 표 무대(`tableStage`)로 그린다** — 줄이 구간의 시작 `i`, 열이 구간의 끝 `j` 다(행렬
 * 체인 곱셈 편의 DP 테이블 약속과 같다). 위 네 줄이 `dp`, 아래 네 줄이 `opt` 이고, `i > j` 인 칸은 구간이
 * 아니라 「이번 걸음 밖」으로 둔다. 표 아래에 입력 `freq` 줄을 두고, 채우는 칸의 구간은 그 줄 위 괄호, 넣는
 * 후보 범위(가르는 자리 `k`)는 그 줄 아래 괄호로 건다. **칸이 입력의 어느 자리를 가르는지는 층 막대
 * (`LayerBars`)로 그린다** — 최적 가르는 자리가 정하는 왼쪽 · 오른쪽 조각, 그리고 대각선마다의 후보 범위다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`simStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `knuthOptimization-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import {
  type TableCell,
  type TableOptions,
  type TablePiece,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import {
  atScale,
  byLen,
  type Cell,
  cell,
  counted,
  FOCUS,
  fullBound,
  fullScan,
  head,
  middlePick,
  N_MAX,
  num,
  orderDigits,
  prefixOf,
  SMALL,
  seconds,
  show,
  stepTitle,
  WALK,
  type WalkStep,
  walkSteps,
} from "./knuthOptimization-guide.proof.ts";
import { knuthOptimization } from "./knuthOptimization-guide.ref.ts";

const N = WALK.length;

/** 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: [
    ...Array.from({ length: N }, (_, i) => `dp[${i}]`),
    ...Array.from({ length: N }, (_, i) => `opt[${i}]`),
  ],
  colHeads: Array.from({ length: N }, (_, j) => j),
  colLabel: "j",
  strip: {
    label: "freq",
    values: [...WALK],
    side: "S(i, j) = freq[i] + … + freq[j]",
  },
};

/** 구간이 아닌 칸(`i > j`) — dp 와 opt 두 벌. */
function lowerCells(n: number): TableCell[] {
  const out: TableCell[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < i; j++) out.push([i, j], [n + i, j]);
  return out;
}

/** 칸 값 — 아직 안 쓴 칸은 `null`, 구간이 아닌 칸도 `null`(대시로 그린다). */
const shown = (rows: readonly (readonly (number | null)[])[]) =>
  rows.map((row) => row.map((v) => (v === null ? null : cell(v))));

/** 줄마다의 곁말 — 채운 칸 수와 그 줄의 구간 수. */
function rowSides(s: WalkStep): string[] {
  const side = (row: readonly (number | null)[], i: number) =>
    `채움 ${row.filter((v) => v !== null).length} / ${N - i}`;
  return [...s.dp.map(side), ...s.opt.map(side)];
}

/** 칸 하나의 괄호 — 입력 줄 위에 채우는 구간, 아래에 후보 범위. */
function piecesOf(x: Cell): TablePiece[] {
  return [
    {
      label: "구간",
      from: x.i,
      to: x.j,
      tone: "query",
      text: `[${x.i},${x.j}]`,
      side: `S(${x.i}, ${x.j}) = ${num(x.sum)}`,
    },
    {
      label: "후보 k",
      from: x.lo,
      to: x.hi,
      tone: "left",
      text: `[${x.lo},${x.hi}]`,
      side: `opt[${x.i}][${x.j - 1}] = ${x.lo} · min(opt[${x.i + 1}][${x.j}], ${x.j - 1}) = ${x.hi}`,
    },
  ];
}

/** 걸음 하나의 설명 — 값은 기록에서. */
function textOf(s: WalkStep): string {
  if (s.kind === "prep") {
    const p = show(prefixOf(WALK));
    return `② 구간 합을 prefix = ${p}${으로(p)} 미리 더해 둡니다. ③ 파일 하나짜리 구간은 합칠 것이 없어 dp[i][i] = 0 이고, 가르는 자리를 자기 번호로 둡니다.`;
  }
  if (s.kind === "return") {
    const v = cell((s.dp[0] as number[])[N - 1] as number);
    return `맨 위 오른쪽 칸 dp[0][${N - 1}] = ${v}${이가(v)} 파일 ${N} 개를 하나로 합치는 가장 작은 비용입니다. 그 값을 돌려줍니다.`;
  }
  const x = s.cell as Cell;
  const vals = x.cands.map((c) => `k = ${c.k} 에서 ${cell(c.val)}`).join(", ");
  const v = cell(x.best + x.sum);
  return `④ 칸 [${x.i},${x.j}] 의 하한은 왼쪽 이웃 opt[${x.i}][${x.j - 1}] = ${x.lo}, 상한은 아래 이웃 opt[${x.i + 1}][${x.j}] = ${x.raw}${을를(x.raw)} ${x.j - 1}${으로(x.j - 1)} 자른 ${x.hi} 입니다. ⑤ 후보 값은 ${vals} 입니다. ⑥ 가장 작은 ${cell(x.best)} 에 S(${x.i}, ${x.j}) = ${num(x.sum)}${을를(num(x.sum))} 더해 dp = ${v}, opt = ${x.bestK}${을를(x.bestK)} 적습니다.`;
}

/** 걸음 하나의 표 무대 데이터. */
export function tableStep(s: WalkStep, acc: number): TableStep {
  const table = shown([...s.dp, ...s.opt]);
  const rowSide = rowSides(s);
  const out = lowerCells(N);
  const vars = `후보 수 누적 ${acc}`;
  if (s.kind === "prep") {
    const write: TableCell[] = [];
    for (let i = 0; i < N; i++) write.push([i, i], [N + i, i]);
    return {
      table,
      write,
      out,
      rowSide,
      calc: { expr: "prefix =", result: show(prefixOf(WALK)) },
      vars,
    };
  }
  if (s.kind === "return") {
    return {
      table,
      read: [[0, N - 1]],
      out,
      rowSide,
      calc: {
        expr: `dp[0][${N - 1}] =`,
        result: cell((s.dp[0] as number[])[N - 1] as number),
      },
      vars,
    };
  }
  const x = s.cell as Cell;
  const read: TableCell[] = [
    [N + x.i, x.j - 1],
    [N + x.i + 1, x.j],
  ];
  for (const c of x.cands) read.push([x.i, c.k], [c.k + 1, x.j]);
  return {
    table,
    read,
    write: [
      [x.i, x.j],
      [N + x.i, x.j],
    ],
    out,
    pieces: piecesOf(x),
    rowSide,
    calc: {
      expr: `min(${x.cands.map((c) => cell(c.val)).join(", ")}) + ${num(x.sum)} =`,
      result: `${cell(x.best + x.sum)} · opt ${x.bestK}`,
    },
    vars,
  };
}

const STEPS = walkSteps();

/** 걸음마다 누적 후보 수. */
const ACC = (() => {
  let acc = 0;
  return STEPS.map((s) => {
    acc += s.cell?.cands.length ?? 0;
    return acc;
  });
})();

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본과 대조한 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `knuthOptimization-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return STEPS.map((s, i) => ({
    title: `${s.id} ${stepTitle(s)} ${s.branches.join("")}`.trim(),
    text: textOf(s),
    ...tableStep(s, ACC[i] as number),
  }));
}

const walkFilm = (): StageFrame[] =>
  STEPS.map((s, i) => ({
    id: s.id,
    text: `${stepTitle(s)} ${s.branches.join("")}`.trim(),
    rows: tableStage(tableStep(s, ACC[i] as number), TABLE_OPTIONS),
  }));

/* ───────────────── 전체 컨셉 ───────────────── */

/** 전개 입력의 DP 테이블 전부 — 칸 [0,3] 과 그 두 이웃을 짚는다. */
function conceptRows() {
  const f = fullScan(WALK);
  const table: (string | null)[][] = [
    ...f.dp.map((row, i) => row.map((v, j) => (j < i ? null : cell(v)))),
    ...f.opt.map((row, i) => row.map((v, j) => (j < i ? null : String(v)))),
  ];
  const x = counted(WALK).cells.find((c) => c.i === 0 && c.j === N - 1) as Cell;
  return tableStage(
    {
      table,
      out: lowerCells(N),
      read: [
        [N + 0, N - 2],
        [N + 1, N - 1],
      ],
      write: [
        [0, N - 1],
        [N + 0, N - 1],
      ],
      pieces: piecesOf(x),
      rowSide: [
        ...f.dp.map((_, i) => `구간 [${i}, …] 의 가장 작은 비용`),
        ...f.opt.map((_, i) => `구간 [${i}, …] 의 최적 가르는 자리`),
      ],
    },
    TABLE_OPTIONS,
  );
}

/* ───────────────── 시도한 방법 ───────────────── */

function approaches(): Approach[] {
  const full = fullBound(N_MAX);
  const h = head(9);
  const kn = atScale();
  return [
    {
      name: "병합 순서 전부 만들기",
      idea: "이웃한 두 묶음을 합치는 순서를 하나씩 다 만들어 합을 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "가장 작은 합이 나온다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 이면 순서가 ${num(orderDigits(N_MAX))} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "같은 구간을 여러 번 합친다 → 구간마다 가장 작은 비용만 DP 테이블에 적는다",
    },
    {
      name: "가르는 자리 전부 넣기",
      idea: "칸 dp[i][j] 마다 가르는 자리 k = i … j−1 을 다 넣어 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "가장 작은 합이 나온다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 이면 후보 ${num(full)} 개 · 어림 ${seconds(full)}`,
          ok: false,
        },
      ],
      lesson:
        "최적 가르는 자리가 오른쪽으로도 아래로도 줄지 않는다 → 후보를 줄일 자리가 있다",
    },
    {
      name: "자리 하나만 찍기",
      idea: "구간의 가운데나 왼쪽 이웃의 자리 하나만 넣는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `첫 파일만 큰 배열 n = ${h.length} 에서 ${num(middlePick(h))} (가장 작은 합 ${num(knuthOptimization(h))})`,
          ok: false,
        },
        { label: "시간", value: "칸마다 후보 1 개", ok: true },
      ],
      lesson:
        "가장 작은 값의 자리가 그 하나가 아니면 틀린다 → 점이 아니라 범위로 가둔다",
    },
    {
      name: "이웃 두 칸 사이로 가두기",
      idea: "후보를 왼쪽 이웃과 아래 이웃의 최적 가르는 자리 사이만 넣는다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: "사각 부등식과 단조성이 성립하면 가장 작은 합이 나온다",
          ok: true,
        },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} 에서 후보 ${num(kn)} 개 · 어림 ${seconds(kn)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 층 막대 ───────────────── */

/** 칸 하나가 입력을 가르는 모양 — 왼쪽 조각과 오른쪽 조각 두 막대. */
function splitBars(i: number, j: number, name: string): LayerBar[] {
  const f = fullScan(SMALL);
  const k = (f.opt[i] as number[])[j] as number;
  return [
    {
      label: `${name} [${i},${j}] 왼쪽`,
      from: i,
      to: k,
      note: `opt[${i}][${j}] = ${k}`,
    },
    {
      label: `${name} [${i},${j}] 오른쪽`,
      from: k + 1,
      to: j,
      note: `dp[${i}][${j}] = ${cell((f.dp[i] as number[])[j] as number)}`,
    },
  ];
}

/** 대각선마다 칸의 후보 범위 — 이웃한 칸의 막대가 끝점 하나를 함께 쓴다. */
function diagonalBars(): LayerBar[][] {
  const c = counted(SMALL);
  const m = byLen(c);
  return [3, 4, 5].map((len) =>
    (m.get(len) as Cell[]).map((x) => ({
      label: `길이 ${len} · 칸 [${x.i},${x.j}]`,
      from: x.lo,
      to: x.hi,
      note: `후보 ${x.cands.length} 개`,
    })),
  );
}

/* ───────────────── 정적 표 ───────────────── */

/** 「먼저 알아 둘 개념」 — 파일 여덟 개의 opt 전부와 한 칸의 두 이웃. */
function optRows() {
  const n = SMALL.length;
  const { opt } = fullScan(SMALL);
  const out: TableCell[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) out.push([i, j]);
  const { i, j } = FOCUS;
  return tableStage(
    {
      table: opt.map((row, r) => row.map((v, c) => (c < r ? null : String(v)))),
      out,
      read: [
        [i, j - 1],
        [i + 1, j],
      ],
      write: [[i, j]],
      rowSide: opt.map((row, r) =>
        row.slice(r).every((v, t, xs) => t === 0 || (xs[t - 1] as number) <= v)
          ? "오른쪽으로 줄지 않는다"
          : "오른쪽으로 줄어드는 칸이 있다",
      ),
    },
    {
      rowHeads: Array.from({ length: n }, (_, r) => `opt[${r}]`),
      colHeads: Array.from({ length: n }, (_, c) => c),
      colLabel: "j",
    },
  );
}

/* ───────────────────────── 그림 ───────────────────────── */

const { i: FI, j: FJ } = FOCUS;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`freq = [${WALK.join(", ")}] 의 DP 테이블 — 칸 [0,${N - 1}] 의 후보를 두 이웃의 자리로 가둔다`}
      rows={conceptRows()}
      columns={N}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n ≤ ${num(N_MAX)} · 1 초(후보 1 억 개 기준) · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-split-bars": () => (
    <LayerBars
      title={`freq = [${SMALL.join(", ")}] — 칸 [${FI},${FJ}] 과 두 이웃이 입력을 가르는 자리`}
      values={[...SMALL]}
      valuesLabel="freq"
      indexLabel="k"
      groups={[
        splitBars(FI, FJ - 1, "왼쪽 이웃"),
        splitBars(FI, FJ, "칸"),
        splitBars(FI + 1, FJ, "아래 이웃"),
      ]}
    />
  ),
  "build-opt-table": () => (
    <CellStage
      title={`freq = [${SMALL.join(", ")}] 의 opt 전부 — 칸 [${FI},${FJ}] 과 두 이웃`}
      rows={optRows()}
      columns={SMALL.length}
    />
  ),
  "build-diagonal": () => (
    <LayerBars
      title={`freq = [${SMALL.join(", ")}] — 구간 길이 3 · 4 · 5 대각선의 후보 범위`}
      values={[...SMALL]}
      valuesLabel="freq"
      indexLabel="k"
      groups={diagonalBars()}
    />
  ),
  "walk-knuth": () => (
    <CellStageFilm
      title={`knuthOptimization([${WALK.join(", ")}]) 의 여덟 걸음 ${STEPS[0]?.id}~${STEPS.at(-1)?.id}`}
      columns={N}
      frames={walkFilm()}
    />
  ),
};
