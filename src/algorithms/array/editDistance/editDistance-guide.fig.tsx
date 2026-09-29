/**
 * `editDistance-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸 하나를 정하는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `editDistance-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import {
  type TableCell,
  type TableOptions,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import { editDistance } from "./editDistance-guide.ref.ts";

const REF = new URL("./editDistance-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 칸 하나를 정하기 직전에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지
 * 않으면 `loadMutant` 가 던진다. 기록은 줄 두 개(`prev`·`cur`)를 가리키기만 하고, 값은 호출이 끝난
 * 뒤 읽는다. 칸은 한 번만 쓰이고 `prev` 는 그 뒤로 바뀌지 않으므로 끝난 뒤의 값이 곧 그 순간의 값이다.
 */
const probed = await loadMutant<{
  editDistance(s: string, t: string): number;
}>(REF, {
  swap: [
    /^(\s*)if \(s\[i - 1\] === t\[j - 1\]\) \{$/,
    "$1(globalThis as any).__cells.push({ i, j, prev, cur });\n$1if (s[i - 1] === t[j - 1]) {",
  ],
});

/**
 * 테두리를 적은 직후의 모습과 호출이 끝난 모습을 붙잡는 사본 — 역시 정본 소스에서 기계로 만든다.
 * 한쪽이 빈 문자열이라 칸을 하나도 정하지 않는 입력도 이 사본으로 DP 테이블을 본다.
 */
const probedTable = await loadMutant<{
  editDistance(s: string, t: string): number;
}>(REF, {
  swap: [
    /^(\s*)for \(let i = 1; i <= n; i\+\+\) \{$/,
    "$1(globalThis as any).__init = dp.map((r) => [...r]);\n$1(globalThis as any).__dp = dp;\n$1for (let i = 1; i <= n; i++) {",
  ],
});

/** 칸 하나를 정한 갈래 — ④ 두 글자가 같다 · ⑤ 다르다. */
export type Branch = "same" | "diff";

export const BRANCH_MARK: Record<Branch, string> = {
  same: "④",
  diff: "⑤",
};

/** ⑤ 의 세 후보 — 왼쪽 위는 교체, 위는 삭제, 왼쪽은 삽입이다. */
export type Pick = "sub" | "del" | "ins";

export const PICK_NAME: Record<Pick, string> = {
  sub: "교체",
  del: "삭제",
  ins: "삽입",
};

/** 칸 하나를 정한 기록. */
export interface Cell {
  readonly i: number;
  readonly j: number;
  /** 이 칸이 비교한 두 글자 `s[i-1]` · `t[j-1]`. */
  readonly a: string;
  readonly b: string;
  readonly branch: Branch;
  readonly value: number;
  /** 왼쪽 위 `dp[i-1][j-1]` — ⑤ 에서는 교체 후보. */
  readonly diag: number;
  /** 위 `dp[i-1][j]` — 삭제 후보. */
  readonly up: number;
  /** 왼쪽 `dp[i][j-1]` — 삽입 후보. */
  readonly left: number;
  /** ⑤ 에서 가장 작은 값을 낸 후보 전부. ④ 에서는 빈 목록이다. */
  readonly best: readonly Pick[];
  /** 읽은 칸 — ④ 는 왼쪽 위 하나, ⑤ 는 왼쪽 위 · 위 · 왼쪽. */
  readonly reads: readonly TableCell[];
}

export interface Trace {
  readonly cells: readonly Cell[];
  /** 호출이 끝난 뒤의 DP 테이블 전체(`dp[0]` 부터 `dp[n]` 까지). */
  readonly rows: readonly (readonly number[])[];
  /** 테두리를 적은 직후 — 안쪽 칸은 `fill` 이 둔 0 이다. */
  readonly init: readonly (readonly number[])[];
  readonly result: number;
}

/** 정본 한 번 호출의 기록. 답은 정본과 대조하고, 칸마다 전이식이 실제로 성립했는지도 대조한다. */
export function trace(s: string, t: string): Trace {
  const g = globalThis as unknown as {
    __init: number[][];
    __dp: number[][];
    __cells: { i: number; j: number; prev: number[]; cur: number[] }[];
  };
  g.__cells = [];
  const result = probed.editDistance(s, t);
  const want = editDistance(s, t);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — "${s}" · "${t}": ${result} ≠ ${want}`,
    );
  }
  const raw = g.__cells;
  if (probedTable.editDistance(s, t) !== want) {
    throw new Error("DP 테이블을 붙잡는 사본이 정본과 다른 답을 냈다");
  }
  const init = g.__init.map((r) => [...r]);
  const rows = g.__dp.map((r) => [...r]);
  const cells: Cell[] = raw.map(({ i, j, prev, cur }) => {
    const value = cur[j] as number;
    if (value !== rows[i]?.[j]) {
      throw new Error(`두 사본의 dp[${i}][${j}] 가 다르다`);
    }
    const a = s[i - 1] as string;
    const b = t[j - 1] as string;
    const diag = prev[j - 1] as number;
    const up = prev[j] as number;
    const left = cur[j - 1] as number;
    const branch: Branch = a === b ? "same" : "diff";
    const low = Math.min(diag, up, left);
    const want = branch === "same" ? diag : low + 1;
    if (value !== want) {
      throw new Error(`dp[${i}][${j}] 가 전이식과 다르다`);
    }
    const best: Pick[] =
      branch === "same"
        ? []
        : (
            [
              ["sub", diag],
              ["del", up],
              ["ins", left],
            ] as [Pick, number][]
          )
            .filter(([, v]) => v === low)
            .map(([p]) => p);
    return {
      i,
      j,
      a,
      b,
      branch,
      value,
      diag,
      up,
      left,
      best,
      reads:
        branch === "same"
          ? [[i - 1, j - 1]]
          : [
              [i - 1, j - 1],
              [i - 1, j],
              [i, j - 1],
            ],
    };
  });
  // 칸을 정한 차례가 줄 → 열 오름차순인가. 아니면 걸음 번호가 코드의 차례와 어긋난다.
  cells.forEach((cell, k) => {
    const i = Math.floor(k / t.length) + 1;
    const j = (k % t.length) + 1;
    if (cell.i !== i || cell.j !== j) {
      throw new Error(`${k} 번째로 정한 칸이 dp[${i}][${j}] 가 아니다`);
    }
  });
  if ((rows[s.length]?.[t.length] ?? -1) !== result) {
    throw new Error("오른쪽 아래 칸이 반환값과 다르다");
  }
  return { cells, rows, init, result };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const S = "horse";
export const T = "ros";

/** 과제 규모 — 두 문자열 길이의 위 끝. */
export const LIMIT = 1000;

const num = (x: number): string => x.toLocaleString("en-US");

/** 줄 머리 — `i` 와 그 줄에서 새로 보는 `s` 의 글자. */
export const rowHead = (s: string, i: number): string =>
  i === 0 ? "i=0 · ∅" : `i=${i} · ${s[i - 1]}`;

/** 열 머리 — 그 열에서 새로 보는 `t` 의 글자. `j=0` 열은 빈 접두어다. */
export const colHead = (t: string, j: number): string =>
  j === 0 ? "∅" : (t[j - 1] as string);

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: S.length + 1 }, (_, i) => rowHead(S, i)),
  colHeads: Array.from({ length: T.length + 1 }, (_, j) => colHead(T, j)),
  colLabel: "t 의 글자",
};

/** 줄 곁말 — 그 줄까지 본 `s` 의 앞부분. */
const rowSeen = (i: number): string =>
  i === 0 ? "s 를 안 봤다" : `s 의 앞 "${S.slice(0, i)}"`;

export const cellName = ([r, c]: TableCell): string => `dp[${r}][${c}]`;

/** 칸 하나를 정한 기록 — 본문이 짚는 칸을 기록에서 찾는다. */
export function cellOf(i: number, j: number): Cell {
  const cell = trace(S, T).cells.find((x) => x.i === i && x.j === j);
  if (!cell) throw new Error(`dp[${i}][${j}] 의 기록이 없다`);
  return cell;
}

/** 걸음 하나의 계산 한 줄과 설명 — 필름·패널·본문 표가 같이 쓴다. */
export function cellText(cell: Cell): { expr: string; detail: string } {
  const at = cellName([cell.i, cell.j]);
  const diag = cellName([cell.i - 1, cell.j - 1]);
  const up = cellName([cell.i - 1, cell.j]);
  const left = cellName([cell.i, cell.j - 1]);
  const cmp = `s[${cell.i - 1}] = '${cell.a}'${과와L(cell.a)} t[${cell.j - 1}] = '${cell.b}'${이가L(cell.b)}`;
  if (cell.branch === "same") {
    return {
      expr: `${diag} =`,
      detail: `${cmp} 같아 ④ 입니다. 왼쪽 위 ${diag} = ${cell.diag}${을를(String(cell.diag))} 편집 없이 그대로 받아 ${at} = ${cell.value} 입니다.`,
    };
  }
  const low = Math.min(cell.diag, cell.up, cell.left);
  const who = cell.best.map((p) => PICK_NAME[p]).join(" · ");
  return {
    expr: `min(${cell.diag}, ${cell.up}, ${cell.left}) + 1 =`,
    detail: `${cmp} 달라 ⑤ 입니다. 교체(왼쪽 위 ${diag}) ${cell.diag} · 삭제(위 ${up}) ${cell.up} · 삽입(왼쪽 ${left}) ${cell.left} 가운데 가장 작은 ${low} 에 1 을 더해 ${at} = ${cell.value} 입니다. 가장 작은 후보는 ${who} 입니다.`,
  };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

/** 걸음 전부 — 테두리를 적는 한 걸음 + 칸마다 한 걸음 + 답을 읽는 한 걸음. */
export function walkSteps(): Step[] {
  const tr = trace(S, T);
  const n = S.length;
  const m = T.length;
  const rows: (number | null)[][] = tr.init.map((row, i) =>
    row.map((v, j) => (i === 0 || j === 0 ? v : null)),
  );
  const snapshot = () => rows.map((r) => [...r]);
  const border: TableCell[] = [];
  for (let j = 0; j <= m; j++) border.push([0, j]);
  for (let i = 1; i <= n; i++) border.push([i, 0]);
  const steps: Step[] = [];
  let k = 1;
  steps.push({
    id: `T${k++}`,
    title: "테두리 = 지우기 · 넣기 비용",
    detail: `DP 테이블을 ${n + 1} 줄 × ${m + 1} 칸으로 깔고 테두리 ${border.length} 칸을 적습니다. 0 번째 열은 t 가 빈 문자열이라 s 의 앞 i 글자를 지우는 비용 i, 0 번째 줄은 s 가 빈 문자열이라 t 의 앞 j 글자를 넣는 비용 j 입니다. 아래 끝 dp[${n}][0] = ${tr.init[n]?.[0]}, 오른쪽 끝 dp[0][${m}] = ${tr.init[0]?.[m]} 입니다.`,
    step: {
      table: snapshot(),
      write: border,
      calc: {
        expr: `dp[${n}][0] = ${tr.init[n]?.[0]} · dp[0][${m}] =`,
        result: String(tr.init[0]?.[m]),
      },
    },
  });
  for (const cell of tr.cells) {
    const row = rows[cell.i] as (number | null)[];
    row[cell.j] = cell.value;
    const { expr, detail } = cellText(cell);
    steps.push({
      id: `T${k++}`,
      title: `${cellName([cell.i, cell.j])} = ${cell.value} ${BRANCH_MARK[cell.branch]}`,
      detail,
      step: {
        table: snapshot(),
        read: cell.reads,
        write: [[cell.i, cell.j]],
        calc: { expr, result: String(cell.value) },
      },
    });
  }
  steps.push({
    id: `T${k++}`,
    title: `dp[${n}][${m}] = ${tr.result} 반환`,
    detail: `오른쪽 아래 칸 dp[${n}][${m}] 를 읽어 ${tr.result}${을를(String(tr.result))} 돌려줍니다.`,
    step: {
      table: snapshot(),
      read: [[n, m]],
      calc: { expr: `dp[${n}][${m}] =`, result: String(tr.result) },
    },
  });
  return steps;
}

/**
 * 필름과 패널을 가르는 자리 — 테두리 걸음과 i=1 · i=2 줄, i=3 · i=4 줄, i=5 줄과 답을 읽는 걸음.
 * 한 벌에 모으면 정적 필름이 열일곱 장이라 줄 둘씩 가른다.
 */
export function walkParts(): { row12: Step[]; row34: Step[]; row5: Step[] } {
  const all = walkSteps();
  const width = T.length;
  return {
    row12: all.slice(0, 1 + 2 * width),
    row34: all.slice(1 + 2 * width, 1 + 4 * width),
    row5: all.slice(1 + 4 * width),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `editDistance-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const p = walkParts();
  return {
    row12: p.row12.map(toStep),
    row34: p.row34.map(toStep),
    row5: p.row5.map(toStep),
  };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 DP 테이블 한 장 — 줄 곁말은 그 줄까지 본 `s` 의 앞부분이다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const tr = trace(S, T);
  return tableStage(
    {
      table: tr.rows.map((r) => [...r]),
      rowSide: tr.rows.map((_, i) => rowSeen(i)),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

function ruleFrame(i: number, j: number): StageFrame {
  const cell = cellOf(i, j);
  const { expr } = cellText(cell);
  const who =
    cell.branch === "same"
      ? "같다"
      : `다르다 · 가장 작은 후보 ${cell.best.map((p) => PICK_NAME[p]).join(" · ")}`;
  return {
    id: `${BRANCH_MARK[cell.branch]} ${i},${j}`,
    text: `${cellName([i, j])} — '${cell.a}'${과와L(cell.a)} '${cell.b}'${이가L(cell.b)} ${who} · ${expr} ${cell.value}`,
    rows: fullTable({ read: cell.reads, write: [[i, j]] }),
  };
}

/** 테두리만 적은 DP 테이블 — 1단계 그림. 줄 곁말은 첫 열의 칸이 뜻하는 일이다. */
function borderRows(): StageRow[] {
  const tr = trace(S, T);
  const table = tr.init.map((row, i) =>
    row.map((v, j) => (i === 0 || j === 0 ? v : null)),
  );
  const border: TableCell[] = [];
  table.forEach((row, i) => {
    row.forEach((v, j) => {
      if (v !== null) border.push([i, j]);
    });
  });
  return tableStage(
    {
      table,
      write: border,
      rowSide: table.map((_, i) =>
        i === 0
          ? `t 의 앞 j 글자를 넣는다 · 끝 칸 ${tr.init[0]?.[T.length]}`
          : `"${S.slice(0, i)}" 를 지운다 · ${tr.init[i]?.[0]} 번`,
      ),
    },
    TABLE_OPTIONS,
  );
}

/* ───────────────── 편집 목록 — 거슬러 찾기와 그 적용 ───────────────── */

export type Move = "교체" | "그대로" | "삭제" | "삽입";

/** 거슬러 찾은 편집 하나 — `from` 칸에서 `cell` 칸으로 가는 걸음이다. */
export interface Stepped {
  readonly cell: TableCell;
  readonly from: TableCell;
  readonly move: Move;
  /** 그대로 · 교체는 결과에 남는 글자, 삭제는 지운 글자, 삽입은 넣은 글자. */
  readonly letter: string;
  readonly cost: number;
}

/**
 * 다 채운 DP 테이블을 오른쪽 아래에서 거슬러 따라가며 편집 목록 하나를 만든다. 정본은 횟수만 돌려주므로
 * 이 걸음은 정본의 DP 테이블(`trace` 가 붙잡은 것)을 읽기만 하고 새 값을 만들지 않는다. 같은 값을 내는
 * 길이 여럿이면 두 글자가 같을 때 왼쪽 위, 아니면 교체 · 삭제 · 삽입 차례로 고른다. 비용 합이 정본의
 * 답과 다르면 던진다.
 */
export function backtrack(s: string, t: string): Stepped[] {
  const { rows, result } = trace(s, t);
  const at = (i: number, j: number) => rows[i]?.[j] as number;
  const out: Stepped[] = [];
  let i = s.length;
  let j = t.length;
  while (i > 0 || j > 0) {
    const here = at(i, j);
    const diag = i > 0 && j > 0 ? at(i - 1, j - 1) : -1;
    if (i > 0 && j > 0 && s[i - 1] === t[j - 1] && here === diag) {
      out.push({
        cell: [i, j],
        from: [i - 1, j - 1],
        move: "그대로",
        letter: s[i - 1] as string,
        cost: 0,
      });
      i--;
      j--;
    } else if (i > 0 && j > 0 && here === diag + 1) {
      out.push({
        cell: [i, j],
        from: [i - 1, j - 1],
        move: "교체",
        letter: t[j - 1] as string,
        cost: 1,
      });
      i--;
      j--;
    } else if (i > 0 && here === at(i - 1, j) + 1) {
      out.push({
        cell: [i, j],
        from: [i - 1, j],
        move: "삭제",
        letter: s[i - 1] as string,
        cost: 1,
      });
      i--;
    } else {
      out.push({
        cell: [i, j],
        from: [i, j - 1],
        move: "삽입",
        letter: t[j - 1] as string,
        cost: 1,
      });
      j--;
    }
  }
  const script = out.reverse();
  const cost = script.reduce((a, x) => a + x.cost, 0);
  if (cost !== result) {
    throw new Error(
      `거슬러 찾은 편집의 비용 합 ${cost} 가 답 ${result} 와 다르다`,
    );
  }
  return script;
}

/** 편집 하나를 적용하기 직전의 문자열과, 그 편집이 손대는 자리. */
export interface Applied {
  readonly step: Stepped;
  readonly before: string;
  readonly after: string;
  readonly at: number;
}

/**
 * 편집 목록을 `s` 에 앞에서부터 차례로 적용한다. 그대로 · 교체 · 삭제는 `s` 의 글자 하나를 지나가고
 * 삽입은 지나가지 않는다. 목록이 `s` 를 끝까지 안 쓰면 남은 글자를 그대로 잇는다.
 */
export function applyScript(s: string, script: readonly Stepped[]): Applied[] {
  let out = "";
  let from = 0;
  const done: Applied[] = [];
  for (const step of script) {
    const before = out + s.slice(from);
    const at = out.length;
    if (step.move === "그대로") {
      out += s[from] as string;
      from++;
    } else if (step.move === "교체") {
      out += step.letter;
      from++;
    } else if (step.move === "삭제") {
      from++;
    } else {
      out += step.letter;
    }
    done.push({ step, before, after: out + s.slice(from), at });
  }
  return done;
}

/** 적용이 끝난 문자열. */
export const scriptResult = (s: string, script: readonly Stepped[]): string =>
  applyScript(s, script).at(-1)?.after ?? s;

/**
 * 영문 글자 하나 뒤의 조사. `tools/josa.ts` 는 한글과 숫자의 받침을 보므로 영문 글자는 여기서 읽는다 —
 * 글자 이름의 끝소리로 가른다(l 엘 · r 알 은 ㄹ, m 엠 · n 엔 은 그 밖의 받침, 나머지는 받침이 없다).
 */
const TAIL: Record<string, "none" | "rieul" | "other"> = {
  l: "rieul",
  r: "rieul",
  m: "other",
  n: "other",
};
const tail = (x: string) => TAIL[x.toLowerCase()] ?? "none";
export const 을를L = (x: string): string =>
  tail(x) === "none" ? " 를" : " 을";
export const 으로L = (x: string): string =>
  tail(x) === "other" ? " 으로" : " 로";
export const 은는L = (x: string): string =>
  tail(x) === "none" ? " 는" : " 은";
export const 이가L = (x: string): string =>
  tail(x) === "none" ? " 가" : " 이";
export const 과와L = (x: string): string =>
  tail(x) === "none" ? " 와" : " 과";

/** 편집 한 번을 적은 말 — 「h 를 r 로 교체」. */
export function editText(a: Applied): string {
  const x = a.step;
  const was = a.before[a.at] as string;
  if (x.move === "교체")
    return `${was}${을를L(was)} ${x.letter}${으로L(x.letter)} 교체`;
  if (x.move === "삭제") return `${x.letter}${을를L(x.letter)} 삭제`;
  if (x.move === "삽입") return `${x.letter}${을를L(x.letter)} 삽입`;
  return `${x.letter}${은는L(x.letter)} 그대로`;
}

/** 전체 컨셉의 필름 — 편집 하나마다 한 장, 마지막에 결과 한 장. 그대로 둔 글자는 장을 만들지 않는다. */
function editFilm(): StageFrame[] {
  const applied = applyScript(S, backtrack(S, T)).filter(
    (a) => a.step.move !== "그대로",
  );
  const width = Math.max(S.length, T.length);
  const row = (word: string, focus: number | null, side: string): StageRow => {
    const states: Partial<Record<number, CellState>> = {};
    if (focus !== null) states[focus] = "focus";
    const values: (string | null)[] = Array.from(
      { length: width },
      (_, k) => word[k] ?? null,
    );
    return { kind: "cells", label: "문자열", values, states, side };
  };
  const frames: StageFrame[] = applied.map((a, k) => ({
    id: `편집 ${k + 1}`,
    text: `${editText(a)} → "${a.after}"`,
    rows: [
      { kind: "index", label: "자리", focus: [a.at] },
      row(a.before, a.at, `편집 전 "${a.before}"`),
    ],
  }));
  const last = applied.at(-1)?.after ?? S;
  frames.push({
    id: "끝",
    text: `편집 ${applied.length} 번 만에 "${last}"`,
    rows: [{ kind: "index", label: "자리" }, row(last, null, `t 와 같다`)],
  });
  return frames;
}

/** 거슬러 따라가는 필름 — 오른쪽 아래에서 출발해 한 걸음마다 한 장. */
function backFilm(): StageFrame[] {
  const script = backtrack(S, T);
  const walk = [...script].reverse();
  const cells: TableCell[] = [
    ...walk.map((x) => x.cell),
    walk.at(-1)?.from ?? [0, 0],
  ];
  return cells.map((c, k) => {
    const x = walk[k];
    const sum = walk.slice(0, k).reduce((a, y) => a + y.cost, 0);
    const text = x
      ? `${cellName(c)} — ${x.move} ${x.letter} · ${cellName(x.from)} 로 간다`
      : `${cellName(c)} — 테두리 끝에 이르렀다`;
    return {
      id: `${k + 1}`,
      text,
      rows: fullTable({
        read: cells.slice(0, k),
        write: [c],
        rowSide: trace(S, T).rows.map((_, r) =>
          r === 0 ? `지나온 칸 ${k} · 지나온 비용 ${sum}` : rowSeen(r),
        ),
      }),
    };
  });
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 ───────────────── */

/**
 * 가장 단순한 방법 — **한 번의 편집으로 갈 수 있는 문자열을 전부 만들며 너비 우선으로 찾아간다.**
 * 정의를 그대로 옮긴 것이라 답의 기준이 된다. 알파벳은 두 문자열에 나오는 글자로 제한한다 — 최소
 * 편집 목록은 두 문자열에 없는 글자를 새로 넣을 이유가 없어 답이 달라지지 않는다.
 */
export function byBreadthFirst(
  s: string,
  t: string,
): { answer: number; perDepth: number[] } {
  const perDepth: number[] = [];
  if (s === t) return { answer: 0, perDepth };
  const alphabet = [...new Set([...s, ...t])];
  let frontier = new Set([s]);
  const seen = new Set([s]);
  for (let depth = 1; depth <= 8; depth++) {
    const next = new Set<string>();
    let found = false;
    const push = (y: string): void => {
      if (y === t) found = true;
      if (seen.has(y)) return;
      seen.add(y);
      next.add(y);
    };
    for (const x of frontier) {
      for (let k = 0; k < x.length; k++) {
        push(x.slice(0, k) + x.slice(k + 1));
        for (const ch of alphabet) {
          if (ch !== x[k]) push(x.slice(0, k) + ch + x.slice(k + 1));
        }
      }
      for (let k = 0; k <= x.length; k++) {
        for (const ch of alphabet) push(x.slice(0, k) + ch + x.slice(k));
      }
    }
    perDepth.push(next.size);
    if (found) return { answer: depth, perDepth };
    frontier = next;
  }
  throw new Error(`깊이 8 안에서 "${t}" 에 도달하지 못했다`);
}

/** 한 번 편집해 만들 수 있는 문자열 수 — 교체 · 삭제 · 삽입을 다 센다(겹침은 안 뺀다). */
export const oneEditCount = (len: number, alphabet: number): number =>
  len * (alphabet - 1) + len + (len + 1) * alphabet;

/**
 * 후보 — **자리마다 비교하기.** 앞에서부터 같은 자리끼리 비교해 다른 자리를 세고, 길이 차이만큼
 * 더한다. 삽입과 삭제가 뒤의 글자를 옮긴다는 것을 아예 안 본다.
 */
export function bySlot(s: string, t: string): number {
  const shared = Math.min(s.length, t.length);
  let diff = 0;
  for (let k = 0; k < shared; k++) if (s[k] !== t[k]) diff++;
  return diff + Math.abs(s.length - t.length);
}

/** 기억 없이 그대로 부르는 재귀. 호출 횟수와 상태마다 불린 횟수를 센다. */
export function byPlainRecursion(
  s: string,
  t: string,
): { answer: number; calls: number; perState: Map<string, number> } {
  let calls = 0;
  const perState = new Map<string, number>();
  const f = (i: number, j: number): number => {
    calls++;
    const key = `${i},${j}`;
    perState.set(key, (perState.get(key) ?? 0) + 1);
    if (i === 0) return j;
    if (j === 0) return i;
    if (s[i - 1] === t[j - 1]) return f(i - 1, j - 1);
    return 1 + Math.min(f(i - 1, j - 1), f(i - 1, j), f(i, j - 1));
  };
  const answer = f(s.length, t.length);
  return { answer, calls, perState };
}

/** 자릿수. 과제 규모의 값이 화면에 안 들어갈 때 쓴다. */
export const digits = (n: bigint): number => n.toString().length;

/** 반례 — 자리마다 비교하는 방식이 틀리는 입력. */
export const SLOT_CASE: [string, string] = ["abcd", "bcda"];

/**
 * 기억 없는 재귀의 호출 수 — 공통 글자가 없는 길이 `n` 두 문자열. 점화식
 * `K(i,j) = 1 + K(i-1,j-1) + K(i-1,j) + K(i,j-1)` 을 BigInt 로 채운다. 과제 규모에서 호출 수를 낼 때 쓴다.
 */
const callCache = new Map<number, bigint>();

export function callsWithoutCommon(n: number): bigint {
  const hit = callCache.get(n);
  if (hit !== undefined) return hit;
  const k: bigint[][] = Array.from({ length: n + 1 }, () =>
    new Array<bigint>(n + 1).fill(1n),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= n; j++) {
      (k[i] as bigint[])[j] =
        1n +
        ((k[i - 1] as bigint[])[j - 1] as bigint) +
        ((k[i - 1] as bigint[])[j] as bigint) +
        ((k[i] as bigint[])[j - 1] as bigint);
    }
  }
  const out = (k[n] as bigint[])[n] as bigint;
  callCache.set(n, out);
  return out;
}

function approaches(): Approach[] {
  const step = BigInt(oneEditCount(LIMIT, 26));
  const bfs = digits(step ** BigInt(LIMIT));
  const calls = digits(callsWithoutCommon(LIMIT));
  const cells = (LIMIT + 1) * (LIMIT + 1);
  const [ss, st] = SLOT_CASE;
  return [
    {
      name: "편집을 한 번씩 해 보기",
      idea: "s 에 편집 한 번을 한 결과를 전부 만들고, t 가 없으면 그 결과들에 또 한 번씩 편집한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `답이 ${num(LIMIT)} 이면 확인할 문자열 ${num(bfs)} 자리 수`,
          ok: false,
        },
      ],
      lesson: "편집하지 않고 두 문자열을 자리마다 비교하면 어떨까",
    },
    {
      name: "자리마다 비교하기",
      idea: "같은 자리의 글자가 다른 곳을 세고 길이 차이를 더한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `"${ss}" 와 "${st}" 에서 ${editDistance(ss, st)} 가 아니라 ${bySlot(ss, st)} — 뒤가 한 칸씩 옮겨진 것을 못 봤다`,
          ok: false,
        },
        { label: "시간", value: "두 문자열을 한 번씩", ok: true },
      ],
      lesson: "어느 자리를 고쳤는지 대신 마지막 한 번의 편집을 정하면 어떨까",
    },
    {
      name: "마지막 편집으로 줄이는 재귀",
      idea: "마지막 두 글자가 같으면 둘 다 떼고, 다르면 교체 · 삭제 · 삽입 셋 중 작은 쪽에 1",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `공통 글자가 없는 길이 ${num(LIMIT)} 쌍이면 호출 ${num(calls)} 자리 수`,
          ok: false,
        },
      ],
      lesson: "같은 (i, j) 를 거듭 부른다 — 답을 칸에 적어 두면 어떨까",
    },
    {
      name: "접두어 쌍 DP 테이블",
      idea: "(s 의 앞 i 글자, t 의 앞 j 글자) 칸마다 최소 편집 횟수를 적는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "시간", value: `칸 ${num(cells)} 개`, ok: true },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

const COLS = T.length + 1;

export const FIGS: Record<string, () => ReactElement> = {
  "concept-edits": () => (
    <CellStageFilm
      title={`"${S}" 를 "${T}" 로 바꾸는 편집 — 편집 한 번에 한 장`}
      columns={Math.max(S.length, T.length)}
      frames={editFilm()}
    />
  ),
  "concept-table": () => (
    <CellStage
      title={`editDistance("${S}", "${T}") 의 DP 테이블 — 줄은 s 의 글자, 열은 t 의 글자`}
      rows={fullTable({})}
      columns={COLS}
    />
  ),
  "concept-rule": () => (
    <CellStageFilm
      title="칸 하나가 읽는 자리 — 글자가 같으면 왼쪽 위, 다르면 왼쪽 위 · 위 · 왼쪽"
      columns={COLS}
      frames={[ruleFrame(2, 2), ruleFrame(3, 2)]}
    />
  ),
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`두 문자열 길이 ${num(LIMIT)} 까지`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-border": () => (
    <CellStage
      title="테두리 — 0 번째 열은 지우는 횟수, 0 번째 줄은 넣는 횟수"
      rows={borderRows()}
      columns={COLS}
    />
  ),
  "build-read-cell": () => {
    const i = 3;
    const j = 2;
    const tr = trace(S, T);
    const out: TableCell[] = [];
    tr.rows.forEach((row, r) => {
      row.forEach((_, c) => {
        if (r !== i || c !== j) out.push([r, c]);
      });
    });
    return (
      <CellStage
        title={`dp[${i}][${j}] — s 의 앞 "${S.slice(0, i)}" 를 t 의 앞 "${T.slice(0, j)}" 로 바꾸는 최소 편집 횟수`}
        rows={fullTable({ write: [[i, j]], out })}
        columns={COLS}
      />
    );
  },
  "build-reads": () => (
    <CellStageFilm
      title="칸 하나를 정하는 네 모양 — 같은 글자 · 교체가 가장 작은 칸 · 삭제가 가장 작은 칸 · 삽입이 가장 작은 칸"
      columns={COLS}
      frames={[
        ruleFrame(2, 2),
        ruleFrame(1, 1),
        ruleFrame(3, 2),
        ruleFrame(2, 3),
      ]}
    />
  ),
  "build-trace-back": () => (
    <CellStageFilm
      title={`dp[${S.length}][${T.length}] 에서 거슬러 따라가기 — 걸음 하나가 편집 하나다`}
      columns={COLS}
      frames={backFilm()}
    />
  ),
  "walk-row12": () => {
    const s = walkParts().row12;
    return (
      <CellStageFilm
        title={`editDistance — ${s[0]?.id}~${s.at(-1)?.id} · 테두리와 i=1 · i=2 줄`}
        columns={COLS}
        frames={film(s)}
      />
    );
  },
  "walk-row34": () => {
    const s = walkParts().row34;
    return (
      <CellStageFilm
        title={`editDistance — ${s[0]?.id}~${s.at(-1)?.id} · i=3 · i=4 줄`}
        columns={COLS}
        frames={film(s)}
      />
    );
  },
  "walk-row5": () => {
    const s = walkParts().row5;
    return (
      <CellStageFilm
        title={`editDistance — ${s[0]?.id}~${s.at(-1)?.id} · i=5 줄과 답`}
        columns={COLS}
        frames={film(s)}
      />
    );
  },
  "related-path": () => {
    const script = backtrack(S, T);
    const path: TableCell[] = [[0, 0], ...script.map((x) => x.cell)];
    return (
      <CellStage
        title={`격자 위의 경로 — (0, 0) 에서 (${S.length}, ${T.length}) 까지 비용 ${editDistance(S, T)} 인 길`}
        rows={fullTable({
          read: path.slice(0, -1),
          write: path.slice(-1),
          rowSide: trace(S, T).rows.map((_, r) => {
            const on = path.filter(([i]) => i === r).map(([, j]) => j);
            return on.length > 0 ? `경로가 지나는 열 ${on.join(" · ")}` : "—";
          }),
        })}
        columns={COLS}
      />
    );
  },
};
