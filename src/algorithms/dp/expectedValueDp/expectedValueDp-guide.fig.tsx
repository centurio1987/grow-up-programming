/**
 * `expectedValueDp-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 칸 하나를 채우는 자리마다 무엇을
 * 읽었는지는 정본 소스에서 기계로 만든 계측 사본 셋(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `expectedValueDp-guide.test.ts` 가 잰다.
 *
 * **칸에는 배정밀도 값을 분수로 되돌려 적는다.** 정본의 칸은 `0.1388…` 같은 실수라 열세 칸에 늘어서면
 * 표가 안 읽힌다. 그래서 칸 값 `p` 에 `6^i` 를 곱해 가장 가까운 정수 `w` 를 얻고 `w/6^i` 로 적는다.
 * 되돌린 분수가 칸 값과 상대 오차 `2^-50` 안에서 같지 않으면 던진다 — 그림이 정본과 다른 값을 적을
 * 수 없다. 이 기록은 작은 입력(던지는 횟수 다섯 이하)에만 쓴다. 칸 하나마다 줄 둘을 가리키는 기록을
 * 남기므로 큰 입력에 쓰면 메모리가 모자란다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { expectedValueDp } from "./expectedValueDp-guide.ref.ts";

const REF = new URL("./expectedValueDp-guide.ref.ts", import.meta.url).pathname;

type Ref = { expectedValueDp(N: number, K: number): number };

/** 주사위 한 개의 면 수 — 정본의 `FACES` 와 같다. */
export const FACES = 6;

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * 칸 하나를 채운 직후에 기록을 끼운 사본. 기록은 줄 둘(`prev`·`curr`)을 가리키기만 하고 값은 호출이
 * 끝난 뒤 읽는다. 정본은 줄마다 새 배열을 잡고 다 채운 줄을 다시 고치지 않으므로, 끝난 뒤의 값이 곧
 * 그 칸을 채운 순간의 값이다.
 */
const probedCells = await loadMutant<Ref>(REF, {
  swap: [
    /^(\s*)curr\[s\] = sum \/ FACES;$/,
    "$1curr[s] = sum / FACES;\n$1(globalThis as any).__cells.push({ i, s, from, prev, curr });",
  ],
});

/** 0 번 던진 줄을 놓은 직후를 붙잡는 사본. 확실한 자리에서 먼저 답하면 이 기록이 비어 있다. */
const probedInit = await loadMutant<Ref>(REF, {
  swap: [
    /^(\s*)prev\[0\] = 1;$/,
    "$1prev[0] = 1;\n$1(globalThis as any).__init = Array.from(prev);",
  ],
});

/** 마지막 줄과, 꼬리를 한 칸 더할 때마다의 누적값을 붙잡는 사본. */
const probedTail = await loadMutant<Ref>(REF, {
  swap: [
    /^(\s*)for \(let s = maxSum; s >= K; s--\) answer \+= prev\[s\] as number;$/,
    "$1(globalThis as any).__last = Array.from(prev);\n$1for (let s = maxSum; s >= K; s--) {\n$1  answer += prev[s] as number;\n$1  (globalThis as any).__tail.push({ s, answer });\n$1}",
  ],
});

/** 칸 하나를 채운 기록. */
export interface Cell {
  readonly i: number;
  readonly s: number;
  /** 더한 칸의 왼쪽 끝. 오른쪽 끝은 `s − 1` 이다. */
  readonly from: number;
  readonly value: number;
  /** 더한 칸과 그 값 — 직전 줄 `i − 1` 의 `[from, s − 1]`. */
  readonly reads: readonly { readonly u: number; readonly value: number }[];
  /** 읽은 칸의 합 — 6 으로 나누기 전. */
  readonly sum: number;
}

export interface Trace {
  readonly N: number;
  readonly K: number;
  /** 표를 채우러 갔는가 — 두 비교가 다 거짓이었는가. */
  readonly filled: boolean;
  /** 0 번 던진 줄. 표를 안 채우면 빈 배열이다. */
  readonly init: readonly number[];
  readonly cells: readonly Cell[];
  /** 줄마다 다 채운 뒤의 값 — `rows[0]` 이 0 번 던진 줄이다. 표를 안 채우면 빈 배열이다. */
  readonly rows: readonly (readonly number[])[];
  /** 꼬리를 한 칸 더할 때마다 — 더한 칸 `s` 와 그때까지의 합. */
  readonly tail: readonly { readonly s: number; readonly answer: number }[];
  readonly result: number;
}

interface Globals {
  __cells: {
    i: number;
    s: number;
    from: number;
    prev: Float64Array;
    curr: Float64Array;
  }[];
  __init: number[] | undefined;
  __last: number[] | undefined;
  __tail: { s: number; answer: number }[];
}

/** 정본 한 번 호출의 기록. 답은 세 사본 모두 정본과 대조하고, 칸마다 전이식이 성립했는지도 대조한다. */
export function trace(N: number, K: number): Trace {
  if (N > 5) throw new Error("기록 사본은 던지는 횟수 다섯 이하에만 쓴다");
  const g = globalThis as unknown as Globals;
  g.__cells = [];
  g.__init = undefined;
  g.__last = undefined;
  g.__tail = [];
  const want = expectedValueDp(N, K);
  for (const [name, impl] of [
    ["칸 기록", probedCells],
    ["첫 줄 기록", probedInit],
    ["꼬리 기록", probedTail],
  ] as const) {
    const got = impl.expectedValueDp(N, K);
    if (!Object.is(got, want)) {
      throw new Error(
        `${name} 사본이 정본과 다른 답을 냈다 — N=${N}, K=${K}: ${got} ≠ ${want}`,
      );
    }
  }
  const maxSum = FACES * N;
  const filled = g.__init !== undefined;
  const init = g.__init ?? [];
  const cells: Cell[] = g.__cells.map(({ i, s, from, prev, curr }) => {
    const reads: { u: number; value: number }[] = [];
    let sum = 0;
    for (let u = from; u < s; u++) {
      const v = prev[u] as number;
      reads.push({ u, value: v });
      sum += v;
    }
    const value = curr[s] as number;
    if (value !== sum / FACES) {
      throw new Error(`p[${i}][${s}] 가 읽은 칸의 합 ÷ ${FACES} 와 다르다`);
    }
    return { i, s, from, value, reads, sum };
  });
  // 채운 차례가 줄 → 합 오름차순인가. 아니면 걸음 번호가 코드의 차례와 어긋난다.
  cells.forEach((cell, k) => {
    const i = Math.floor(k / maxSum) + 1;
    const s = (k % maxSum) + 1;
    if (cell.i !== i || cell.s !== s) {
      throw new Error(`${k} 번째로 채운 칸이 p[${i}][${s}] 가 아니다`);
    }
  });
  const rows: number[][] = [];
  if (filled) {
    rows.push([...init]);
    for (let i = 1; i <= N; i++) {
      const first = g.__cells.find((c) => c.i === i);
      if (!first) throw new Error(`${i} 번째 줄의 기록이 없다`);
      rows.push(Array.from(first.curr));
    }
    const last = g.__last ?? [];
    if (last.some((v, s) => v !== rows[N]?.[s])) {
      throw new Error("마지막 줄의 두 기록이 다르다");
    }
  }
  const tail = g.__tail.map((t) => ({ ...t }));
  if (filled && (tail.at(-1)?.answer ?? 0) !== want) {
    throw new Error("꼬리를 다 더한 값이 반환값과 다르다");
  }
  return { N, K, filled, init, cells, rows, tail, result: want };
}

/* ───────────────────────── 칸 값 적기 ───────────────────────── */

/** 칸 값을 `w/6^i` 로 되돌린다. 되돌린 값이 칸 값과 상대 오차 `2^-50` 안이 아니면 던진다. */
export function count(p: number, i: number): number {
  const scale = FACES ** i;
  const w = Math.round(p * scale);
  const back = w / scale;
  if (Math.abs(back - p) > Math.abs(p) * 2 ** -50) {
    throw new Error(`${p} 를 ${scale} 분의 정수로 되돌릴 수 없다`);
  }
  return w;
}

/** 칸 값 하나를 그림에 적는 모양 — 0 번 던진 줄은 분모 1 이라 정수로, 0 은 0 으로. */
export function frac(p: number, i: number): string {
  const w = count(p, i);
  if (w === 0) return "0";
  return i === 0 ? String(w) : `${w}/${FACES ** i}`;
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_N = 2;
export const WALK_K = 10;

const WALK_MAX = FACES * WALK_N;

/** 2 차원 표 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const TABLE_OPTIONS: TableOptions = {
  rowHeads: Array.from({ length: WALK_N + 1 }, (_, i) => `i=${i}`),
  colHeads: Array.from({ length: WALK_MAX + 1 }, (_, s) => s),
  colLabel: "합 s",
};

const cellName = (i: number, s: number): string => `p[${i}][${s}]`;

/** 줄 곁말 — 그 줄의 확률 합을 분수로. */
function rowTotal(row: readonly number[], i: number): string {
  let total = 0;
  for (let s = row.length - 1; s >= 0; s--) total += row[s] as number;
  const w = row.reduce((n, p) => n + count(p, i), 0);
  if (count(total, i) !== w) throw new Error("줄 합을 두 길로 센 값이 다르다");
  return `합 ${w}/${FACES ** i}`;
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

/** 걸음 전부 — 확실한 자리 걸러내기 · 0 번 줄 · 칸마다 한 걸음 · 꼬리 한 칸마다 · 반환. */
export function walkSteps(): Step[] {
  const t = trace(WALK_N, WALK_K);
  if (!t.filled) throw new Error("전개 입력이 표를 채우지 않는다");
  const table: (string | null)[][] = Array.from({ length: WALK_N + 1 }, () =>
    new Array<string | null>(WALK_MAX + 1).fill(null),
  );
  const snapshot = () => table.map((r) => [...r]);
  const steps: Step[] = [];
  let k = 1;
  steps.push({
    id: `T${k++}`,
    title: "확실한 자리를 걸러낸다 ①",
    detail: `K <= N 은 ${WALK_K} <= ${WALK_N}${josa(WALK_N, "이라", "라")} 거짓이고, K > 6N 은 ${WALK_K} > ${WALK_MAX}${josa(WALK_MAX, "이라", "라")} 거짓입니다. 둘 다 거짓이라 표를 채우러 갑니다.`,
    step: {
      table: snapshot(),
      calc: {
        expr: `${WALK_K} <= ${WALK_N} · ${WALK_K} > ${WALK_MAX} →`,
        result: "둘 다 거짓",
      },
    },
  });
  t.init.forEach((p, s) => {
    (table[0] as (string | null)[])[s] = frac(p, 0);
  });
  steps.push({
    id: `T${k++}`,
    title: `${cellName(0, 0)} = ${frac(t.init[0] as number, 0)} ②`,
    detail: `0 번 던진 줄을 ${WALK_MAX + 1} 칸으로 잡습니다. 칸은 처음에 모두 0 이고, 합 0 칸에만 ${frac(t.init[0] as number, 0)}${을를(frac(t.init[0] as number, 0))} 둡니다.`,
    step: {
      table: snapshot(),
      write: [[0, 0]],
      calc: { expr: "prev[0] =", result: frac(t.init[0] as number, 0) },
    },
  });
  for (const cell of t.cells) {
    const row = table[cell.i] as (string | null)[];
    if (cell.s === 1) {
      // 줄을 새로 잡은 걸음 — 반복이 건드리지 않는 합 0 칸은 새 배열의 0 그대로다.
      row[0] = frac(t.rows[cell.i]?.[0] as number, cell.i);
    }
    row[cell.s] = frac(cell.value, cell.i);
    const lo = cell.from;
    const hi = cell.s - 1;
    const range = lo === hi ? `[${lo}]` : `[${lo}, ${hi}]`;
    const sumText = frac(cell.sum, cell.i - 1);
    const clipped = cell.s - FACES < 0;
    steps.push({
      id: `T${k++}`,
      title: `${cellName(cell.i, cell.s)} = ${frac(cell.value, cell.i)} ③`,
      detail: `${clipped ? `${cell.s} − 6 < 0 이 참이라 왼쪽 끝을 0 으로 자릅니다. ` : `${cell.s} − 6 < 0 이 거짓이라 왼쪽 끝이 ${cell.from} 입니다. `}직전 줄의 ${range} 칸 ${cell.reads.length} 개를 더하면 ${sumText}${josa(sumText, "이고", "고")}, 6 으로 나눠 ${frac(cell.value, cell.i)}${을를(frac(cell.value, cell.i))} 적습니다.`,
      step: {
        table: snapshot(),
        read: cell.reads.map((r): TableCell => [cell.i - 1, r.u]),
        write: [[cell.i, cell.s]],
        calc: {
          expr: `p[${cell.i - 1}]${range} 의 합 ${sumText} ÷ 6 =`,
          result: frac(cell.value, cell.i),
        },
      },
    });
  }
  let before = 0;
  for (const { s, answer } of t.tail) {
    const add = t.rows[WALK_N]?.[s] as number;
    steps.push({
      id: `T${k++}`,
      title: `answer += ${cellName(WALK_N, s)} ④`,
      detail: `${s} >= ${WALK_K}${이가(WALK_K)} 참이라 ${cellName(WALK_N, s)} = ${frac(add, WALK_N)}${을를(frac(add, WALK_N))} 더합니다. answer 는 ${frac(answer, WALK_N)}${이가(frac(answer, WALK_N))} 됩니다.`,
      step: {
        table: snapshot(),
        read: [[WALK_N, s]],
        calc: {
          expr: `${frac(before, WALK_N)} + ${frac(add, WALK_N)} =`,
          result: frac(answer, WALK_N),
        },
        vars: `answer = ${frac(answer, WALK_N)}`,
      },
    });
    before = answer;
  }
  const stop = (t.tail.at(-1)?.s ?? WALK_K) - 1;
  steps.push({
    id: `T${k++}`,
    title: `${frac(t.result, WALK_N)} 반환`,
    detail: `${stop} >= ${WALK_K}${이가(WALK_K)} 거짓이라 반복이 끝납니다. 더해 온 answer = ${frac(t.result, WALK_N)}${을를(frac(t.result, WALK_N))} 돌려줍니다. 배정밀도로는 ${t.result} 입니다.`,
    step: {
      table: snapshot(),
      calc: { expr: `${stop} >= ${WALK_K} →`, result: "거짓" },
      vars: `answer = ${frac(t.result, WALK_N)}`,
    },
  });
  return steps;
}

/** 필름과 패널을 가르는 자리 — 첫 줄까지 · 둘째 줄 · 꼬리와 반환. */
export function walkParts(): { row1: Step[]; row2: Step[]; tail: Step[] } {
  const all = walkSteps();
  return {
    row1: all.slice(0, 2 + WALK_MAX),
    row2: all.slice(2 + WALK_MAX, 2 + 2 * WALK_MAX),
    tail: all.slice(2 + 2 * WALK_MAX),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `expectedValueDp-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const p = walkParts();
  return {
    row1: p.row1.map(toStep),
    row2: p.row2.map(toStep),
    tail: p.tail.map(toStep),
  };
}

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 다 채운 DP 테이블 한 장 — 줄 곁말은 그 줄의 확률 합이다. */
function fullTable(extra: Partial<TableStep>): StageRow[] {
  const t = trace(WALK_N, WALK_K);
  return tableStage(
    {
      table: t.rows.map((r, i) => r.map((p) => frac(p, i))),
      rowSide: t.rows.map((r, i) => rowTotal(r, i)),
      ...extra,
    },
    TABLE_OPTIONS,
  );
}

/** 칸 하나를 채운 기록 — 본문이 짚는 칸을 기록에서 찾는다. */
export function cellOf(i: number, s: number): Cell {
  const cell = trace(WALK_N, WALK_K).cells.find((c) => c.i === i && c.s === s);
  if (!cell) throw new Error(`p[${i}][${s}] 의 기록이 없다`);
  return cell;
}

function ruleFrame(i: number, s: number): StageFrame {
  const cell = cellOf(i, s);
  const lo = cell.from;
  const hi = s - 1;
  return {
    id: cellName(i, s),
    text: `p[${i - 1}][${lo}..${hi}] 의 합 ${frac(cell.sum, i - 1)} ÷ 6 = ${frac(cell.value, i)}`,
    rows: fullTable({
      read: cell.reads.map((r): TableCell => [i - 1, r.u]),
      write: [[i, s]],
    }),
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 셋 ───────────────── */

/** 과제 규모 — 던지는 횟수의 위 끝. */
export const N_MAX = 1000;

const num = (x: number | bigint): string =>
  String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 「합만」 을 상태로 잡은 판 — 배열 한 장을 제자리에서 고쳐 쓴다. 정본과 다른 절차라 여기 적는다. */
export function sumOnly(N: number, K: number): number {
  const maxSum = FACES * N;
  const p = new Float64Array(maxSum + 1);
  p[0] = 1;
  for (let i = 1; i <= N; i++) {
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) sum += p[u] as number;
      p[s] = sum / FACES;
    }
  }
  let answer = 0;
  for (let s = maxSum; s >= K; s--) answer += p[s] as number;
  return answer;
}

function approaches(): Approach[] {
  const digits = (6n ** BigInt(N_MAX)).toString().length;
  const cells = N_MAX * (FACES * N_MAX + 1);
  const ok = expectedValueDp(2, 7);
  const bad = sumOnly(2, 7);
  return [
    {
      name: "눈의 나열을 전부 만들어 세기",
      idea: "나올 수 있는 눈의 나열을 하나씩 만들고, 합이 K 이상인 것의 비율을 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `던지는 횟수 ${num(N_MAX)} 이면 나열이 6^${N_MAX} 개 — ${num(digits)} 자리 수`,
          ok: false,
        },
      ],
      lesson:
        "답에 쓰이는 것은 나열이 아니라 합뿐이다 — 합마다 확률 하나만 들면 어떨까",
    },
    {
      name: "합만 기억하기",
      idea: "합마다 확률을 칸 하나에 적고, 던질 때마다 그 칸들을 제자리에서 고친다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `N=2, K=7 에서 ${ok.toFixed(4)} 가 아니라 ${bad.toFixed(4)} — 확률이 1 을 넘는다`,
          ok: false,
        },
        { label: "시간", value: `칸 ${num(FACES * N_MAX + 1)} 개`, ok: true },
      ],
      lesson:
        "한 칸을 채우는 동안 이번 던짐의 값이 섞여 든다 — 던진 횟수를 함께 적으면 어떨까",
    },
    {
      name: "합의 분포를 한 줄씩 갱신하는 DP 테이블",
      idea: "(던진 횟수, 합) 칸에 확률을 적고, 직전 줄의 여섯 칸으로 다음 줄을 채운다",
      verdict: "keep",
      checks: [
        { label: "답", value: `${ok.toFixed(4)} — 맞다`, ok: true },
        { label: "시간", value: `칸 ${num(cells)} 개`, ok: true },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-table": () => (
    <CellStage
      title={`expectedValueDp(${WALK_N}, ${WALK_K}) 의 DP 테이블 — 줄은 던진 횟수, 열은 합, 칸은 그 합이 나올 확률`}
      rows={fullTable({})}
      columns={WALK_MAX + 1}
    />
  ),
  "concept-rule": () => {
    const f = ruleFrame(WALK_N, 7);
    return (
      <CellStage
        title={`${f.id} 를 채우는 자리 — ${f.text}`}
        rows={f.rows}
        columns={WALK_MAX + 1}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`던지는 횟수 ${num(N_MAX)} 까지 · 합은 0 부터 6N 까지`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-distribution": () => {
    const t = trace(WALK_N, WALK_K);
    const row = t.rows[WALK_N] as readonly number[];
    const states: Partial<Record<number, CellState>> = {};
    row.forEach((p, s) => {
      if (p === 0) states[s] = "out";
    });
    const ways = row.map((p) => count(p, WALK_N));
    const rows: StageRow[] = [
      { kind: "index", label: "합 s", labels: row.map((_, s) => s) },
      {
        kind: "cells",
        label: "나열 수",
        values: ways,
        states,
        side: `합 ${ways.reduce((a, b) => a + b, 0)}`,
      },
      {
        kind: "cells",
        label: `p[${WALK_N}][s]`,
        values: row.map((p) => frac(p, WALK_N)),
        states,
        side: rowTotal(row, WALK_N),
      },
    ];
    return (
      <CellStage
        title={`${WALK_N} 번 던진 뒤의 합의 분포 — 합마다 그 합이 되는 나열 수와 확률`}
        rows={rows}
        columns={WALK_MAX + 1}
      />
    );
  },
  "build-read-cell": () => {
    const i = WALK_N;
    const s = 7;
    const t = trace(WALK_N, WALK_K);
    const out: TableCell[] = [];
    t.rows.forEach((row, r) => {
      row.forEach((_, c) => {
        if (r !== i || c !== s) out.push([r, c]);
      });
    });
    return (
      <CellStage
        title={`${cellName(i, s)} — ${i} 번 던진 뒤 합이 ${s} 일 확률`}
        rows={fullTable({ write: [[i, s]], out })}
        columns={WALK_MAX + 1}
      />
    );
  },
  "build-neighbors": () => (
    <CellStageFilm
      title="같은 줄의 이웃한 두 칸 — 직전 줄에서 읽는 여섯 칸이 한 칸씩 옮겨 간다"
      columns={WALK_MAX + 1}
      frames={[ruleFrame(WALK_N, 7), ruleFrame(WALK_N, 8)]}
    />
  ),
  "build-contrast": () => {
    const t = trace(WALK_N, WALK_K);
    const sums = t.rows[WALK_N] as readonly number[];
    const one = t.rows[1] as readonly number[];
    const tails = sums.map((_, s) => expectedValueDp(WALK_N, s));
    const rows: StageRow[] = [
      { kind: "index", label: "합 s", labels: sums.map((_, s) => s) },
      {
        kind: "cells",
        label: "합의 분포",
        values: sums.map((p) => frac(p, WALK_N)),
        side: `p[${WALK_N}][s]`,
      },
      {
        kind: "cells",
        label: "둘째 눈 하나",
        values: one.map((p) => frac(p, 1)),
        side: "둘째 눈이 s",
      },
      {
        kind: "cells",
        label: "합이 s 이상",
        values: tails.map((p) => frac(p, WALK_N)),
        side: `expectedValueDp(${WALK_N}, s)`,
      },
    ];
    return (
      <CellStage
        title={`${WALK_N} 번 던진 뒤 — 합의 분포와 헷갈리기 쉬운 두 줄`}
        rows={rows}
        columns={WALK_MAX + 1}
      />
    );
  },
  "walk-row1": () => {
    const s = walkParts().row1;
    return (
      <CellStageFilm
        title={`expectedValueDp(${WALK_N}, ${WALK_K}) — ${s[0]?.id}~${s.at(-1)?.id} · 걸러내기와 i=0 · i=1 줄`}
        columns={WALK_MAX + 1}
        frames={film(s)}
      />
    );
  },
  "walk-row2": () => {
    const s = walkParts().row2;
    return (
      <CellStageFilm
        title={`expectedValueDp(${WALK_N}, ${WALK_K}) — ${s[0]?.id}~${s.at(-1)?.id} · i=2 줄`}
        columns={WALK_MAX + 1}
        frames={film(s)}
      />
    );
  },
  "walk-tail": () => {
    const s = walkParts().tail;
    return (
      <CellStageFilm
        title={`expectedValueDp(${WALK_N}, ${WALK_K}) — ${s[0]?.id}~${s.at(-1)?.id} · 꼬리를 더하고 답을 낸다`}
        columns={WALK_MAX + 1}
        frames={film(s)}
      />
    );
  },
};
