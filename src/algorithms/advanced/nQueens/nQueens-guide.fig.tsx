/**
 * `nQueens-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 재귀 호출 하나하나의 상태(`row` 와
 * 세 정수)는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 되돌린 뒤의
 * 세 정수도 따로 만든 계측 사본이 기록한다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서
 * 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `nQueens-guide.test.ts` 가 잰다.
 *
 * 판(N×N)은 새 무대를 만들지 않고 칸 줄로 그린다 — 판의 행마다 `CellStage` 의 `cells` 줄 하나다.
 * 부분 배치 나무는 `NodeGraph` + `treeLayout`(dfsAllPaths 편과 같은 방식)이다.
 *
 * 증명 사이드카(`-guide.proof.ts`)가 이 파일의 계측과 비교용 절차를 가져다 쓴다 — 그림과 표가 같은
 * 기록을 쓰게 하려는 것이다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 은는, 을를, 이가 } from "../../../../tools/josa.ts";
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
  NodeGraph,
  type NodeId,
  treeLayout,
} from "../../../_viz/patterns/NodeGraph";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { nQueens } from "./nQueens-guide.ref.ts";

const REF = new URL("./nQueens-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 정본 계측 ───────────────────────── */

interface Masks {
  readonly row: number;
  readonly cols: number;
  readonly diag1: number;
  readonly diag2: number;
}

interface Undo extends Masks {
  readonly c: number;
}

const g = globalThis as unknown as { __calls: Masks[]; __undos: Undo[] };

/**
 * `place` 에 들어올 때마다 `row` 와 세 정수를 기록하는 사본. **정본 소스에서 기계로 만든다** — 그 줄에
 * 정확히 맞지 않으면 `loadMutant` 가 던진다. 상태를 손으로 다시 계산하면 「이 코드가 그렇게
 * 움직인다」가 검사되지 않는다.
 */
const entered = await loadMutant<{ nQueens(n: number): number }>(REF, {
  swap: [
    /^(\s*)if \(row === n\) \{$/,
    "$1(globalThis as any).__calls.push({ row, cols, diag1, diag2 });\n$1if (row === n) {",
  ],
});

/** 켠 비트 셋을 다 끈 **직후**의 세 정수를 기록하는 사본. 되돌리기가 실제로 판을 되돌리는지 잰다. */
const undone = await loadMutant<{ nQueens(n: number): number }>(REF, {
  swap: [
    /^(\s*)diag2 \^= 1 << d2;$/,
    "$1diag2 ^= 1 << d2;\n$1(globalThis as any).__undos.push({ row, c, cols, diag1, diag2 });",
  ],
});

/**
 * `cols` 를 되돌리는 줄을 **기록으로 바꾼** 사본 — 그 줄이 하던 일(열 비트 끄기)은 사라지고, 그 자리의
 * 세 정수가 남는다. 불변식 절이 「이 줄을 지우면 무엇이 남는가」를 값으로 보일 때 쓴다.
 */
const noColsUndo = await loadMutant<{ nQueens(n: number): number }>(REF, {
  swap: [
    /^(\s*)cols \^= 1 << c;$/,
    "$1(globalThis as any).__undos.push({ row, c, cols, diag1, diag2 });",
  ],
});

/** 열 하나를 판정한 결과 — 코드의 `||` 는 앞에서부터 보고 처음 켜진 비트에서 멈춘다. */
export type Verdict = "cols" | "diag1" | "diag2" | "place";

export interface Try {
  readonly c: number;
  readonly d1: number;
  readonly d2: number;
  readonly verdict: Verdict;
}

/** 재귀 호출 하나. 들어온 순서가 곧 걸음 번호다(`index + 1` = `T#`). */
export interface Call extends Masks {
  readonly index: number;
  /** 이 호출을 부른 호출. 첫 호출은 `-1`. */
  readonly parent: number;
  /** 이 호출에 들어올 때 판에 놓인 퀸 `(행, 열)` — 행 순서. */
  readonly queens: readonly (readonly [number, number])[];
  /** 부모가 이 호출을 부르기 직전에 놓은 퀸. 첫 호출에는 없다. */
  readonly placed?: {
    readonly r: number;
    readonly c: number;
    readonly d1: number;
    readonly d2: number;
  };
  /** 행 `row` 의 열 후보마다 판정. `row === n` 이면 비어 있다. */
  readonly tries: readonly Try[];
  readonly children: readonly number[];
}

export interface Trace {
  readonly n: number;
  readonly calls: readonly Call[];
  readonly count: number;
  /** 되돌린 직후의 세 정수 — 돌아온 차례대로. */
  readonly undos: readonly Undo[];
}

export const d1Of = (n: number, r: number, c: number): number =>
  r - c + (n - 1);
export const d2Of = (r: number, c: number): number => r + c;
const bit = (x: number, k: number): boolean => ((x >> k) & 1) === 1;

/** 세 정수로 열 하나를 판정한다 — 정본의 `if` 와 같은 순서로 본다. */
function judge(n: number, m: Masks, c: number): Try {
  const d1 = d1Of(n, m.row, c);
  const d2 = d2Of(m.row, c);
  const verdict: Verdict = bit(m.cols, c)
    ? "cols"
    : bit(m.diag1, d1)
      ? "diag1"
      : bit(m.diag2, d2)
        ? "diag2"
        : "place";
  return { c, d1, d2, verdict };
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 부모와 자식 사이의 세 정수 변화도 대조한다 —
 * 자식의 세 정수가 「부모 것 + 새 퀸의 세 비트」가 아니면 기록을 잘못 읽은 것이다.
 */
function traceOf(n: number): Trace {
  g.__calls = [];
  const got = entered.nQueens(n);
  const want = nQueens(n);
  if (got !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — n = ${n}: ${got} ≠ ${want}`,
    );
  }
  const raw = g.__calls;
  const calls: Call[] = [];
  const kids: number[][] = [];
  const last: number[] = [];
  for (const [index, m] of raw.entries()) {
    kids.push([]);
    last[m.row] = index;
    if (m.row === 0) {
      calls.push({
        ...m,
        index,
        parent: -1,
        queens: [],
        tries: [],
        children: [],
      });
      continue;
    }
    const parent = last[m.row - 1] as number;
    const p = calls[parent] as Call;
    const diff = m.cols ^ p.cols;
    const c = Math.log2(diff);
    if (!Number.isInteger(c) || (p.cols & diff) !== 0) {
      throw new Error(
        `호출 ${index + 1} 의 cols 가 부모에서 비트 하나만 켠 값이 아니다`,
      );
    }
    const r = m.row - 1;
    const d1 = d1Of(n, r, c);
    const d2 = d2Of(r, c);
    if (
      m.diag1 !== (p.diag1 | (1 << d1)) ||
      m.diag2 !== (p.diag2 | (1 << d2))
    ) {
      throw new Error(
        `호출 ${index + 1} 의 대각선 비트가 새 퀸 (${r},${c}) 과 맞지 않는다`,
      );
    }
    calls.push({
      ...m,
      index,
      parent,
      queens: [...p.queens, [r, c] as const],
      placed: { r, c, d1, d2 },
      tries: [],
      children: [],
    });
    (kids[parent] as number[]).push(index);
  }
  // 판정은 들어올 때의 세 정수로 다시 내고, 「놓는다」로 판정한 열이 실제 자식과 차례까지 같은지 본다.
  const done = calls.map((call, i) => {
    const tries =
      call.row === n
        ? []
        : Array.from({ length: n }, (_, c) => judge(n, call, c));
    const placedCols = tries
      .filter((t) => t.verdict === "place")
      .map((t) => t.c);
    const childCols = (kids[i] as number[]).map(
      (k) => (calls[k] as Call).placed?.c,
    );
    if (placedCols.join(",") !== childCols.join(",")) {
      throw new Error(`호출 ${i + 1} 의 판정과 실제로 부른 자식이 다르다`);
    }
    return { ...call, tries, children: kids[i] as number[] };
  });
  const count = done.filter((c) => c.row === n).length;
  if (count !== want)
    throw new Error(`잎의 수 ${count} 가 답 ${want} 과 다르다`);

  // 되돌린 직후의 세 정수가 그 호출에 들어올 때와 같은지 — 되돌리기 사본의 기록과 맞댄다.
  g.__undos = [];
  if (undone.nQueens(n) !== want)
    throw new Error("되돌리기 계측 사본이 다른 답을 냈다");
  const undos = [...g.__undos];
  const expect: Undo[] = [];
  const walk = (i: number): void => {
    const call = done[i] as Call;
    for (const k of call.children) {
      walk(k);
      const child = done[k] as Call;
      expect.push({
        row: call.row,
        c: child.placed?.c as number,
        cols: call.cols,
        diag1: call.diag1,
        diag2: call.diag2,
      });
    }
  };
  walk(0);
  const key = (u: Undo) => `${u.row}:${u.c}:${u.cols}:${u.diag1}:${u.diag2}`;
  if (expect.map(key).join("|") !== undos.map(key).join("|")) {
    throw new Error("되돌린 뒤의 세 정수가 그 호출에 들어올 때와 다르다");
  }
  return { n, calls: done, count, undos };
}

const traceMemo = new Map<number, Trace>();
export function trace(n: number): Trace {
  let t = traceMemo.get(n);
  if (t === undefined) {
    t = traceOf(n);
    traceMemo.set(n, t);
  }
  return t;
}

/** `cols` 되돌리기를 뺀 사본이 되돌려야 했던 자리에 남긴 세 정수 — 돌아온 차례대로. */
export function traceNoColsUndo(n: number): {
  count: number;
  undos: readonly Undo[];
} {
  g.__undos = [];
  const count = noColsUndo.nQueens(n);
  return { count, undos: [...g.__undos] };
}

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK_N = 4;

export const num = (x: number | bigint): string => x.toLocaleString("en-US");

/** 켜진 비트 자리 — 낮은 자리부터. 무대의 눈금과 같은 차례다. */
export const on = (x: number): number[] => {
  const out: number[] = [];
  for (let k = 0; k < 32; k++) if (bit(x, k)) out.push(k);
  return out;
};
export const set = (x: number): string => `{${on(x).join(", ")}}`;
const bits = (x: number, width: number): number[] =>
  Array.from({ length: width }, (_, k) => (bit(x, k) ? 1 : 0));

export const cell = (r: number, c: number): string => `(${r},${c})`;
export const queensText = (qs: Call["queens"]): string =>
  qs.length === 0 ? "—" : qs.map(([r, c]) => cell(r, c)).join("");

/** 판정의 짧은 이름 — 표와 무대가 같은 말을 쓴다. */
export const VERDICT_TEXT: Record<Verdict, string> = {
  cols: "열",
  diag1: "\\",
  diag2: "/",
  place: "놓음",
};
const MARK: Record<Verdict, string> = {
  cols: "②열",
  diag1: "②\\",
  diag2: "②/",
  place: "③",
};

/** `n` 의 해 목록 — 계측 기록의 잎에서 받는다. */
export function solutions(
  n: number,
): (readonly (readonly [number, number])[])[] {
  return trace(n)
    .calls.filter((c) => c.row === n)
    .map((c) => c.queens);
}

/* ───────────────── 비교에 쓰는 다른 절차 — 증명 사이드카와 그림이 함께 쓴다 ───────────────── */

/** 정본과 같은 절차에 방문 노드 · 해 · 열 시도 수만 덧붙여 센다. `n = 12` 처럼 큰 입력에 쓴다. */
export function 가지치기(n: number): {
  노드: number;
  해: number;
  시도: number;
} {
  let 노드 = 0;
  let 해 = 0;
  let 시도 = 0;
  const go = (row: number, cols: number, d1m: number, d2m: number): void => {
    노드++;
    if (row === n) {
      해++;
      return;
    }
    for (let c = 0; c < n; c++) {
      시도++;
      const d1 = row - c + (n - 1);
      const d2 = row + c;
      if (
        ((cols >> c) & 1) === 1 ||
        ((d1m >> d1) & 1) === 1 ||
        ((d2m >> d2) & 1) === 1
      ) {
        continue;
      }
      go(row + 1, cols | (1 << c), d1m | (1 << d1), d2m | (1 << d2));
    }
  };
  go(0, 0, 0, 0);
  if (해 !== nQueens(n))
    throw new Error(`가지치기 계측이 정본과 다르다 — n = ${n}`);
  return { 노드, 해, 시도 };
}

/** 대각선을 **바로 앞 행**의 퀸과만 대조한다. 열은 그대로 전부 본다. 받아들인 배치를 돌려준다. */
export function 앞행만(n: number): number[][] {
  const out: number[][] = [];
  const p: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const go = (row: number): void => {
    if (row === n) {
      out.push([...p]);
      return;
    }
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      if (row > 0 && Math.abs((p[row - 1] as number) - c) === 1) continue;
      used[c] = true;
      p[row] = c;
      go(row + 1);
      used[c] = false;
    }
  };
  go(0);
  return out;
}

/** 이항 계수 — 큰 값이라 `bigint` 로 센다. */
export function choose(n: number, k: number): bigint {
  let r = 1n;
  for (let i = 0; i < k; i++) r = (r * BigInt(n - i)) / BigInt(i + 1);
  return r;
}
export const factorial = (n: number): bigint => {
  let r = 1n;
  for (let i = 2; i <= n; i++) r *= BigInt(i);
  return r;
};
/** `Σ_{k=0}^{n} n!/k!` — 열만 검사할 때의 노드 수. 정수 산술로만 낸다. */
export const e계승 = (n: number): number => {
  let s = 0;
  let 항 = 1; // n!/n! = 1 부터 거꾸로 올라간다
  for (let k = n; k >= 0; k--) {
    s += 항;
    항 *= k === 0 ? 1 : k;
  }
  return s;
};

/** 초당 1 억 번 기준의 시간 — 자릿수가 벌어지므로 단위를 골라 적는다. */
export function duration(ops: bigint): string {
  const s = Number(ops) / 1e8;
  if (s < 1) return `${s.toFixed(4)} 초`;
  if (s < 60) return `${s.toFixed(2)} 초`;
  if (s < 3600) return `${(s / 60).toFixed(0)} 분`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} 시간`;
  if (s < 86400 * 365) return `${(s / 86400).toFixed(0)} 일`;
  return `${num(Math.round(s / (86400 * 365)))} 년`;
}

/** 「아이디어를 떠올리는 과정」이 버린 방법과 남은 방법의 수 — 사다리와 표가 같은 값을 쓴다. */
export const TOP = 12;
export function originNumbers() {
  const n = TOP;
  const pairs = choose(n, 2);
  const pick = choose(n * n, n);
  const perms = factorial(n);
  const eight = 8;
  return {
    n,
    pairs,
    pickPairs: pick * pairs,
    perms,
    permNodes: e계승(n),
    permPairs: perms * pairs,
    prevRow: { n: eight, got: 앞행만(eight).length, want: nQueens(eight) },
    pruned: 가지치기(n).노드,
  };
}

/* ───────────────── 판 그림 — 판의 행마다 칸 줄 하나 ───────────────── */

/** 판 `n × n` 을 칸 줄로. `mark(r, c)` 가 칸의 글자와 상태를 준다. */
function boardRows(
  n: number,
  mark: (r: number, c: number) => { v: string; s?: CellState },
): StageRow[] {
  return [
    { kind: "index", label: "열" },
    ...Array.from({ length: n }, (_, r): StageRow => {
      const states: Partial<Record<number, CellState>> = {};
      const values = Array.from({ length: n }, (_, c) => {
        const m = mark(r, c);
        if (m.s) states[c] = m.s;
        return m.v;
      });
      return { kind: "cells", label: `행 ${r}`, values, states };
    }),
  ];
}

/** 퀸 하나가 공격하는 칸 — 정의(같은 행 · 같은 열 · 행 차이 = 열 차이)로 가른다. */
export function attackOf(
  n: number,
  qr: number,
  qc: number,
): { r: number; c: number; how: "행" | "열" | "\\" | "/" }[] {
  const out: { r: number; c: number; how: "행" | "열" | "\\" | "/" }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (r === qr && c === qc) continue;
      const dr = r - qr;
      const dc = c - qc;
      const how =
        dr === 0
          ? "행"
          : dc === 0
            ? "열"
            : dr === dc
              ? "\\"
              : dr === -dc
                ? "/"
                : null;
      if (how === null) continue;
      // 대각선 번호로 가른 것과 정의로 가른 것이 같아야 한다.
      const byNumber =
        how === "\\"
          ? d1Of(n, r, c) === d1Of(n, qr, qc)
          : how === "/"
            ? d2Of(r, c) === d2Of(qr, qc)
            : true;
      if (!byNumber)
        throw new Error(`대각선 번호가 정의와 어긋난다 — ${cell(r, c)}`);
      out.push({ r, c, how });
    }
  }
  return out;
}

export const ATTACK_AT = [1, 2] as const;

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

/** 이 호출까지 센 배치의 수. */
const countUpTo = (t: Trace, i: number): number =>
  t.calls.slice(0, i + 1).filter((c) => c.row === t.n).length;

function stepTitle(t: Trace, call: Call): string {
  const head = `T${call.index + 1} place(${call.row})`;
  if (call.row === t.n) return `${head} · 행 ${t.n} 도달 ①`;
  if (!call.placed) return `${head} · 빈 판`;
  return `${head} · ${cell(call.placed.r, call.placed.c)}${을를(call.placed.c)} 놓은 뒤`;
}

function stepText(t: Trace, call: Call): string {
  if (call.row === t.n) {
    const k = countUpTo(t, call.index);
    return `row = ${call.row}${이가(call.row)} n 과 같아 ① count 가 ${k}${이가(k)} 됩니다. 판에 놓인 퀸은 ${queensText(call.queens)} 입니다.`;
  }
  const parts = call.tries.map((x) =>
    x.verdict === "place"
      ? `c=${x.c} ③`
      : `c=${x.c}${은는(x.c)} ${x.verdict} 비트에 막혀 ②`,
  );
  const none = call.tries.every((x) => x.verdict !== "place");
  return `행 ${call.row} 의 열 ${t.n} 개를 판정합니다 — ${parts.join(" · ")}.${none ? " 놓을 열이 없어 자식 없이 돌아갑니다." : ""}`;
}

/**
 * 호출 하나를 배열 무대(`arrayStage`)의 걸음으로. 「놓은 열」 줄이 행마다 놓은 퀸의 열이고, 쥔 구간은
 * 이미 채운 행이다. 그 아래에 세 정수를 비트 자리마다 칸 하나로 쌓고(읽음은 이번 판정에서 열을 막은
 * 비트, 새로 씀은 부모가 방금 켠 비트), 맨 아래 「판정」 줄에 행 `row` 의 열마다 판정을 적는다.
 */
export function walkStep(t: Trace, call: Call): ArrayStep {
  const { n } = t;
  const w = 2 * n - 1;
  const blocked = (v: Verdict, key: "c" | "d1" | "d2") =>
    call.tries.filter((x) => x.verdict === v).map((x) => x[key]);
  const p = call.placed;
  const array = Array.from(
    { length: n },
    (_, r) => call.queens.find(([qr]) => qr === r)?.[1] ?? null,
  );
  return {
    array,
    range: call.row > 0 ? [0, call.row - 1] : null,
    rangeSide: `채운 행 ${call.row} 개`,
    read: [],
    write: p ? [p.r] : [],
    pointers: { row: call.row },
    calc: p
      ? { expr: `${cell(p.r, p.c)} 의 d1 · d2`, result: `${p.d1} · ${p.d2}` }
      : null,
    vars: `count = ${countUpTo(t, call.index)}`,
    layers: [
      {
        name: "cols",
        values: bits(call.cols, n),
        read: blocked("cols", "c"),
        write: p ? [p.c] : [],
        side: `켜짐 ${on(call.cols).length}`,
      },
      {
        name: "diag1",
        values: bits(call.diag1, w),
        read: blocked("diag1", "d1"),
        write: p ? [p.d1] : [],
        side: `켜짐 ${on(call.diag1).length}`,
      },
      {
        name: "diag2",
        values: bits(call.diag2, w),
        read: blocked("diag2", "d2"),
        write: p ? [p.d2] : [],
        side: `켜짐 ${on(call.diag2).length}`,
      },
      {
        name: "판정",
        values:
          call.row === n
            ? Array.from({ length: n }, () => null)
            : call.tries.map((x) => MARK[x.verdict]),
        write: call.row === n ? [] : call.tries.map((x) => x.c),
        side: call.row === n ? `row = ${n} · 판정 없음` : `행 ${call.row}`,
      },
    ],
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "놓은 열",
  rangeLabel: "채운 행",
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `nQueens-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const t = trace(WALK_N);
  return t.calls.map((call) => ({
    title: stepTitle(t, call),
    text: stepText(t, call),
    ...walkStep(t, call),
  }));
}

function walkFilm(): StageFrame[] {
  const t = trace(WALK_N);
  return t.calls.map((call) => ({
    id: `T${call.index + 1}`,
    text: stepTitle(t, call).replace(/^T\d+ /, ""),
    rows: arrayStage(walkStep(t, call), ARRAY_OPTIONS),
  }));
}

/* ───────────────────────── 시도 사다리 ───────────────────────── */

function approaches(): Approach[] {
  const o = originNumbers();
  return [
    {
      name: "칸 n 개 고르기",
      idea: "n² 칸에서 n 칸을 고르는 조합을 전부 만들고, 퀸 쌍마다 공격하는지 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${o.n} 에서 쌍 대조 ${num(o.pickPairs)} 번 · ${duration(o.pickPairs)}`,
          ok: false,
        },
      ],
      lesson:
        "같은 행에 둘을 고른 조합은 만들 필요가 없다 — 행마다 하나씩 고르면 어떨까",
    },
    {
      name: "순열을 끝까지 만들고 검사",
      idea: "행마다 서로 다른 열 하나 — 순열을 다 만든 다음 대각선을 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${o.n} 에서 부분 배치 ${num(o.permNodes)} 개(식으로 셈) · 완성 배치 ${num(o.perms)} 개`,
          ok: false,
        },
      ],
      lesson:
        "충돌은 그 충돌을 만든 행에서 이미 정해진다 — 그 자리에서 멈추면 어떨까",
    },
    {
      name: "바로 앞 행과만 대조하며 멈추기",
      idea: "한 행을 놓을 때 바로 위 행의 퀸과 열 차이가 1 인지만 본다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `n = ${o.prevRow.n} 에서 ${num(o.prevRow.want)} 가 아니라 ${num(o.prevRow.got)}`,
          ok: false,
        },
        { label: "시간", value: "따질 것 없음 — 답이 틀린다", ok: null },
      ],
      lesson:
        "두 행 이상 떨어진 대각선을 못 본다 — 이미 놓은 퀸 전부와 대조해야 한다",
    },
    {
      name: "가지치기",
      idea: "한 행을 놓을 때마다 이미 놓은 퀸 전부와 대조하고, 충돌이면 그 아래를 만들지 않는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `n = ${o.n} 에서 부분 배치 ${num(o.pruned)} 개`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 부분 배치 나무 — 마디 하나가 호출 하나. 이름은 마지막에 놓은 퀸, 값은 채운 행 수. */
function tree(n: number): ReactElement {
  const t = trace(n);
  const id = (i: number): NodeId => `m${i}`;
  const children = new Map<NodeId, NodeId[]>();
  for (const c of t.calls) children.set(id(c.index), c.children.map(id));
  const xy = treeLayout([id(0)], children);
  return (
    <NodeGraph
      title={`n = ${n} 의 부분 배치 나무 — 마디 ${t.calls.length} 개 가운데 완성 배치 ${t.count} 개`}
      directed
      unit={{ x: 80, y: 74 }}
      nodes={t.calls.map((c) => {
        const state: CellState | undefined =
          c.row === n ? "focus" : c.children.length === 0 ? "out" : undefined;
        return {
          id: id(c.index),
          label: c.placed ? cell(c.placed.r, c.placed.c) : "빈 판",
          ...(xy.get(id(c.index)) as { x: number; y: number }),
          value:
            c.row === n
              ? "완성"
              : c.children.length === 0
                ? "막힘"
                : `행 ${c.row}`,
          ...(state ? { state } : {}),
        };
      })}
      edges={t.calls.flatMap((c) =>
        c.parent < 0
          ? []
          : [{ from: id(c.parent), to: id(c.index), kind: "tree" as const }],
      )}
    />
  );
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-attack": () => {
    const [qr, qc] = ATTACK_AT;
    const hit = attackOf(WALK_N, qr, qc);
    return (
      <CellStage
        title={`${cell(qr, qc)} 에 놓은 퀸이 공격하는 칸 ${hit.length} 개`}
        columns={WALK_N}
        rows={boardRows(WALK_N, (r, c) => {
          if (r === qr && c === qc) return { v: "Q", s: "focus" };
          const h = hit.find((x) => x.r === r && x.c === c);
          return h ? { v: h.how, s: "read" } : { v: "" };
        })}
      />
    );
  },
  "concept-solutions": () => {
    const sols = solutions(WALK_N);
    return (
      <CellStageFilm
        title={`n = ${WALK_N} 의 배치 ${sols.length} 개`}
        columns={WALK_N}
        frames={sols.map((qs, i) => ({
          id: `해 ${i + 1}`,
          text: qs.map(([r, c]) => `행 ${r} → 열 ${c}`).join(" · "),
          rows: boardRows(WALK_N, (r, c) =>
            qs.some(([qr, qc]) => qr === r && qc === c)
              ? { v: "Q", s: "focus" }
              : { v: "" },
          ),
        }))}
      />
    );
  },
  "concept-tree": () => tree(WALK_N),
  "build-diag-numbers": () => {
    const [qr, qc] = ATTACK_AT;
    const n = WALK_N;
    const frame = (
      name: "d1" | "d2",
      of: (r: number, c: number) => number,
      text: string,
    ): StageFrame => ({
      id: name,
      text,
      rows: boardRows(n, (r, c) => ({
        v: String(of(r, c)),
        ...(r === qr && c === qc
          ? { s: "focus" as const }
          : of(r, c) === of(qr, qc)
            ? { s: "read" as const }
            : {}),
      })),
    });
    return (
      <CellStageFilm
        title={`n = ${n} 판의 칸마다 적은 대각선 번호 — 굵은 칸 ${cell(qr, qc)} 과 번호가 같은 칸을 옅게 칠했다`}
        columns={n}
        frames={[
          frame(
            "d1",
            (r, c) => d1Of(n, r, c),
            `\\ 대각선 번호 d1 = row − c + ${n - 1}`,
          ),
          frame("d2", (r, c) => d2Of(r, c), "/ 대각선 번호 d2 = row + c"),
        ]}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`판의 한 변 n 은 ${TOP} 까지 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "walk-board": () => {
    const t = trace(WALK_N);
    return (
      <CellStageFilm
        title={`nQueens(${WALK_N}) — T1~T${t.calls.length} · count ${t.count}${을를(t.count)} 낸다`}
        columns={2 * WALK_N - 1}
        frames={walkFilm()}
      />
    );
  },
};
