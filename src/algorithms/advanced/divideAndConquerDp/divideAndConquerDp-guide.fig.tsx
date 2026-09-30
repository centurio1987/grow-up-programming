/**
 * `divideAndConquerDp-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 실행에서 받는다. DP 테이블과 최적 가르는 자리는 정본(`-guide.ref.ts`)과
 * 같은 절차를 세는 자리만 덧붙여 적은 사본(`-guide.proof.ts` 의 `record` · `fullScan` · `walkSteps`)이
 * 낸다. 그 사본들은 이 파일을 읽을 때 정본과 같은 답을 내는지 스스로 대조한다.
 *
 * **DP 테이블은 2 차원 표 무대(`tableStage`)로 그린다** — 줄이 구역 수 `g`, 열이 칸 `i` 다(행렬 체인 곱셈
 * 편의 DP 테이블 약속과 같다). 표 아래에 입력 `a` 줄을 두고, 호출이 맡은 칸 범위는 그 줄 위 괄호, 후보
 * 범위(가르는 자리 `j`)는 그 줄 아래 괄호로 건다. **칸이 입력의 어느 자리를 맡는지는 층 막대
 * (`LayerBars`)로 그린다** — 최적 가르는 자리가 정하는 마지막 구역, 그리고 재귀가 깊이마다 넘기는 후보
 * 범위다.
 *
 * 걸음 재생 패널의 걸음 데이터도 여기서 만든다(`simStepsFromRef`). `.sim.ts` 의 `steps` 는 그 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `divideAndConquerDp-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  buildCost,
  type Call,
  callName,
  candidatesOf,
  cell,
  chooseDigits,
  fullFormula,
  fullScan,
  head,
  N_MAX,
  num,
  REC_N,
  record,
  SMALL_A,
  SMALL_K,
  seconds,
  seq,
  show,
  stepTitle,
  sweep,
  WALK_A,
  WALK_K,
  type WalkStep,
  walkSteps,
} from "./divideAndConquerDp-guide.proof.ts";

const N = WALK_A.length;
const WALK_COST = buildCost(WALK_A);
const SMALL_COST = buildCost(SMALL_A);

/** 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: WALK_K }, (_, r) => `dp[${r + 1}]`),
  colHeads: Array.from({ length: N }, (_, c) => c),
  colLabel: "i",
  strip: {
    label: "a",
    values: [...WALK_A],
    side: "cost[i][j] = (a[i] + … + a[j])²",
  },
};

/** 칸 값 — 아직 안 쓴 칸은 `null`, `INF` 는 글자 그대로. */
const shown = (row: readonly (number | null)[]): (string | null)[] =>
  row.map((v) => (v === null ? null : cell(v)));

/** 줄마다의 곁말 — 이 걸음에서 그 줄이 맡은 몫과 채운 칸 수. */
function rowSides(s: WalkStep): string[] {
  return s.table.map((row, r) => {
    const g = r + 1;
    const filled = row.filter((v) => v !== null).length;
    const fill = `채움 ${filled} / ${row.length}`;
    if (s.kind === "base" && g === 1) return `이번 줄 · ${fill}`;
    if (s.kind === "call" && g === s.layer - 1) return `이전 줄 · ${fill}`;
    if (s.kind === "call" && g === s.layer) return `이번 줄 · ${fill}`;
    if (s.kind === "swap" && g === s.layer)
      return `다음 줄이 읽을 이전 줄 · ${fill}`;
    if (s.kind === "return" && g === s.layer) return `마지막 줄 · ${fill}`;
    return fill;
  });
}

/** 호출 하나의 괄호 — 입력 줄 위에 칸 범위, 아래에 후보 범위. */
function piecesOf(c: Call): TablePiece[] {
  const out: TablePiece[] = [
    {
      label: "칸",
      from: c.lo,
      to: c.hi,
      tone: "query",
      text: `[${c.lo},${c.hi}]`,
      side: `가운데 칸 ${c.mid}`,
    },
  ];
  if (c.upper >= c.optLo)
    out.push({
      label: "후보 j",
      from: c.optLo,
      to: c.upper,
      tone: "left",
      text: `[${c.optLo},${c.upper}]`,
      side: `상한 min(${c.optHi}, ${c.mid - 1}) = ${c.upper}`,
    });
  return out;
}

/** 걸음 하나의 설명 — 값은 기록에서. */
function textOf(s: WalkStep): string {
  const n = N;
  switch (s.kind) {
    case "base": {
      const row = s.table[0] as number[];
      return `구역이 하나면 [0,i] 를 통째로 한 구역으로 묶는 수밖에 없어 dp[1][i] = cost[0][i] 입니다. ① 줄 1 의 값은 ${show(row)} 입니다.`;
    }
    case "swap":
      return `⑦ prev = cur 로 줄 ${s.layer}${을를(s.layer)} 이전 줄로 삼습니다. 다음 줄은 이 줄만 읽습니다.`;
    case "return": {
      const v = cell((s.table[s.layer - 1] as number[])[n - 1] as number);
      return `줄 ${s.layer} 의 마지막 칸 dp[${s.layer}][${n - 1}] = ${v}${이가(v)} 네 칸을 ${WALK_K} 구역으로 나눈 가장 작은 비용입니다. 그 값을 돌려줍니다.`;
    }
    default: {
      const c = s.call as Call;
      const name = callName(c);
      const head = `${name}${은는(String(c.optHi))} 칸 [${c.lo},${c.hi}]${을를(c.hi)} 맡습니다. 가운데 칸 ${c.mid} 의 후보 상한은 min(${c.optHi}, ${c.mid - 1}) = ${c.upper} 입니다.`;
      if (c.cands.length === 0)
        return `${head} 후보가 하나도 없어 칸 ${c.mid}${은는(c.mid)} INF 로 남고, 양옆 자식 호출은 빈 범위라 ③ 곧장 돌아옵니다.`;
      const vals = c.cands
        .map((x) => `j = ${x.j} 에서 ${cell(x.val)}`)
        .join(", ");
      const best = cell(c.best);
      return `${head} 후보 값은 ${vals} 입니다. 가장 작은 ${best}${이가(best)} 칸 ${c.mid} 의 값이고 찾은 자리는 ${c.bestOpt} 입니다. 왼쪽은 후보 [${c.optLo},${c.bestOpt}], 오른쪽은 [${c.bestOpt},${c.optHi}]${을를(c.optHi)} 넘겨받습니다.`;
    }
  }
}

/** 걸음 하나의 표 무대 데이터. */
export function tableStep(s: WalkStep, acc: number): TableStep {
  const table = s.table.map(shown);
  const rowSide = rowSides(s);
  const vars = `후보 수 누적 ${acc}`;
  switch (s.kind) {
    case "base":
      return {
        table,
        write: Array.from({ length: N }, (_, i) => [0, i] as TableCell),
        rowSide,
        calc: {
          expr: "dp[1][i] = cost[0][i] →",
          result: show(s.table[0] as number[]),
        },
        vars,
      };
    case "swap":
      return {
        table,
        read: Array.from(
          { length: N },
          (_, i) => [s.layer - 1, i] as TableCell,
        ),
        rowSide,
        calc: { expr: "prev = cur →", result: `줄 ${s.layer}` },
        vars,
      };
    case "return":
      return {
        table,
        read: [[s.layer - 1, N - 1]],
        rowSide,
        calc: {
          expr: `prev[${N - 1}] =`,
          result: cell((s.table[s.layer - 1] as number[])[N - 1] as number),
        },
        vars,
      };
    default: {
      const c = s.call as Call;
      const g = c.layer;
      return {
        table,
        read: c.cands.map((x) => [g - 2, x.j] as TableCell),
        write: [[g - 1, c.mid]],
        pieces: piecesOf(c),
        rowSide,
        calc:
          c.cands.length === 0
            ? { expr: "후보 없음 →", result: "INF" }
            : {
                expr: `min(${c.cands.map((x) => cell(x.val)).join(", ")}) =`,
                result: `${cell(c.best)} · 찾은 자리 ${c.bestOpt}`,
              },
        vars,
      };
    }
  }
}

const STEPS = walkSteps();

/** 걸음마다 누적 후보 수. */
const ACC = (() => {
  let acc = 0;
  return STEPS.map((s) => {
    acc += s.call?.cands.length ?? 0;
    return acc;
  });
})();

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본과 대조한 기록에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를
 * 글자 그대로 옮긴 인라인 리터럴이고, 둘이 같은지는 `divideAndConquerDp-guide.test.ts` 가 잰다.
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

/* ───────────────── 시도한 방법 ───────────────── */

function approaches(): Approach[] {
  const half = N_MAX / 2;
  const full = fullFormula(N_MAX, N_MAX);
  const headCost = buildCost(head(256));
  const sw = sweep(headCost, 3).checks;
  const all = fullScan(headCost, 3).checks;
  const { dc } = atScale();
  return [
    {
      name: "분할 전부 만들기",
      idea: "연속 구역 k 개로 나누는 방법을 하나씩 다 만들어 합을 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "가장 작은 합이 나온다", ok: true },
        {
          label: "시간",
          value: `n = ${num(N_MAX)} · k = ${num(half)} 이면 방법이 ${num(chooseDigits(N_MAX - 1, half - 1))} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "같은 앞 구역을 여러 번 만든다 → 칸마다 가장 작은 값만 DP 테이블에 적는다",
    },
    {
      name: "가르는 자리 전부 계산",
      idea: "칸 dp[g][i] 마다 가르는 자리 j = 0 … i−1 을 다 넣어 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "가장 작은 합이 나온다", ok: true },
        {
          label: "시간",
          value: `n = k = ${num(N_MAX)} 이면 후보 ${num(full)} 개 · 어림 ${seconds(full)}`,
          ok: false,
        },
      ],
      lesson:
        "최적 가르는 자리가 칸을 따라 줄지 않는다 → 직전 칸의 자리부터 넣는다",
    },
    {
      name: "하한만 옮기기",
      idea: "왼쪽 칸부터 채우며 후보를 직전 칸의 최적 가르는 자리부터 넣는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "가장 작은 합이 나온다", ok: true },
        {
          label: "시간",
          value: `첫 칸만 큰 배열 n = 256 에서 후보 ${num(sw)} 개 · 전부 계산의 ${Math.round((sw / all) * 100)} %`,
          ok: false,
        },
      ],
      lesson: "상한이 그대로 i−1 이다 → 뒤 칸의 자리를 먼저 알아 상한도 자른다",
    },
    {
      name: "가운데 칸부터 채우기",
      idea: "가운데 칸의 최적 가르는 자리로 왼쪽의 상한과 오른쪽의 하한을 한꺼번에 자른다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: "사각 부등식이 성립하면 가장 작은 합이 나온다",
          ok: true,
        },
        {
          label: "시간",
          value: `n = k = ${num(N_MAX)} 에서 후보 ${num(dc)} 개 · 어림 ${seconds(dc)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 층 막대 ───────────────── */

/** 줄 g 의 칸마다 마지막 구역 `[opt + 1, i]`. */
function lastPieceBars(g: number): LayerBar[] {
  const f = fullScan(SMALL_COST, SMALL_K);
  const o = f.opts[g - 2] as number[];
  const dp = f.rows[g - 1] as number[];
  const out: LayerBar[] = [];
  for (let i = 0; i < SMALL_A.length; i++) {
    const at = o[i] as number;
    if (at < 0) continue;
    out.push({
      label: `줄 ${g} · 칸 ${i}`,
      from: at + 1,
      to: i,
      note: `opt(${g}, ${i}) = ${at} · dp = ${cell(dp[i] as number)}`,
    });
  }
  return out;
}

/** 줄 2 하나의 호출을 깊이마다 묶는다 — 막대는 그 호출이 넣는 후보 범위. */
function recursionBars(): LayerBar[][] {
  const r = record(buildCost(seq(REC_N)), 2);
  const depths = [...new Set(r.calls.map((c) => c.depth))].sort(
    (a, b) => a - b,
  );
  return depths.map((d) =>
    r.calls
      .filter((c) => c.depth === d && c.upper >= c.optLo)
      .map((c) => ({
        label: `깊이 ${d} · 칸 ${c.mid}`,
        from: c.optLo,
        to: c.upper,
        note: `칸 [${c.lo},${c.hi}] · 후보 ${c.cands.length} 개`,
      })),
  );
}

/* ───────────────── 정적 표 ───────────────── */

/** 「전체 컨셉」 — 전개 입력의 DP 테이블 전부와 최적 가르는 자리. */
function conceptRows() {
  const f = fullScan(WALK_COST, WALK_K);
  const table: (string | null)[][] = [
    ...f.rows.map((row) => row.map(cell)),
    ...f.opts.map((o) => o.map((v) => (v < 0 ? "없음" : String(v)))),
  ];
  const out: TableCell[] = [];
  for (const [r, row] of table.entries())
    for (const [c, v] of row.entries())
      if (v === "INF" || v === "없음") out.push([r, c]);
  return tableStage(
    {
      table,
      out,
      rowSide: [
        ...f.rows.map((_, g) => `구역 ${g + 1} 개 · 값`),
        ...f.opts.map((_, g) => `줄 ${g + 2} 의 최적 가르는 자리`),
      ],
    },
    {
      ...TABLE_OPTIONS,
      rowHeads: [
        ...f.rows.map((_, g) => `dp[${g + 1}]`),
        ...f.opts.map((_, g) => `opt(${g + 2}, i)`),
      ],
    },
  );
}

/** 「알아 두면 좋은 개념」 — 줄 2 의 후보 행렬과 행마다 최솟값의 자리. */
function matrixRows() {
  const n = SMALL_A.length;
  const f = fullScan(SMALL_COST, SMALL_K);
  const o = f.opts[0] as number[];
  const table: (string | null)[][] = [];
  const out: TableCell[] = [];
  const write: TableCell[] = [];
  for (let i = 0; i < n; i++) {
    const cands = candidatesOf(SMALL_COST, SMALL_K, 2, i);
    const row: (string | null)[] = [];
    for (let j = 0; j < n - 1; j++) {
      const c = cands.find((x) => x.j === j);
      row.push(c === undefined ? null : num(c.val));
      if (c === undefined) out.push([i, j]);
    }
    if ((o[i] as number) >= 0) write.push([i, o[i] as number]);
    table.push(row);
  }
  return tableStage(
    {
      table,
      out,
      write,
      rowSide: o.map((v) => (v < 0 ? "후보 없음" : `최솟값의 자리 ${v}`)),
    },
    {
      rowHeads: Array.from({ length: n }, (_, i) => `i = ${i}`),
      colHeads: Array.from({ length: n - 1 }, (_, j) => j),
      colLabel: "j",
    },
  );
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`a = [${WALK_A.join(", ")}]${을를(String(WALK_A.at(-1)))} ${WALK_K} 구역까지 나누는 DP 테이블 — 칸마다 값과 그 값을 만든 가르는 자리`}
      rows={conceptRows()}
      columns={N}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`n ≤ ${num(N_MAX)} · k ≤ n · 1 초(후보 1 억 개 기준) · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-opt-bars": () => (
    <LayerBars
      title={`a = [${SMALL_A.join(", ")}] 의 최적 가르는 자리 — 막대가 칸 i 의 마지막 구역 [opt + 1, i]`}
      values={[...SMALL_A]}
      valuesLabel="a"
      indexLabel="i"
      groups={[lastPieceBars(2), lastPieceBars(3)]}
    />
  ),
  "build-recursion": () => (
    <LayerBars
      title={`a = [1, 2, …, ${REC_N}] 의 줄 2 — 깊이마다 호출이 넣는 후보 범위(가르는 자리 j)`}
      values={seq(REC_N)}
      valuesLabel="a"
      indexLabel="j"
      groups={recursionBars()}
    />
  ),
  "walk-dp": () => (
    <CellStageFilm
      title={`divideAndConquerDp — a = [${WALK_A.join(", ")}] · k = ${WALK_K} 의 열두 걸음 ${STEPS[0]?.id}~${STEPS.at(-1)?.id}`}
      columns={N}
      frames={walkFilm()}
    />
  ),
  "related-matrix": () => (
    <CellStage
      title={`줄 2 의 후보 행렬 M[i][j] = dp[1][j] + cost[j+1][i] — 굵은 칸이 행마다의 최솟값`}
      rows={matrixRows()}
      columns={SMALL_A.length - 1}
    />
  ),
};
