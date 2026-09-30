/**
 * `digitDp-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 재귀 호출 하나하나가 어느 상태로
 * 들어가 무엇을 돌려주었는지는 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록한다 — `count`
 * 앞뒤에 기록을 끼운 사본이고, 몸통은 정본 그대로다. 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은
 * 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는 `digitDp-guide.test.ts` 가 잰다.
 *
 * 무대는 「2 차원 표」(`tableStage`)다. 열이 앞 숫자의 합 `sum = 0 … K` 이고, 줄은 **자리마다 둘**이다 —
 * 위 줄이 붙은 상태(`tight` 참), 아래 줄이 풀린 상태(`tight` 거짓)다. 풀린 줄이 곧 DP 테이블
 * `memo[pos]` 이고, 붙은 줄은 DP 테이블 밖이다(정본은 그 값을 적지 않고 돌려주기만 한다). 상한 `N` 의
 * 숫자는 줄 머리와 줄 곁말에 둔다 — 줄이 자리라서 자리의 숫자가 줄에 붙는다. 표 아래 입력 줄(`strip`)은
 * 표의 **열**과 짝인 입력을 싣는 자리인데 이 편의 열은 합이라 쓰지 않는다. 이 입력에서 한 번도 오지
 * 않는 상태는 「이번 걸음 밖」(대시)이다.
 *
 * 큰 입력은 이 기록을 쓰지 않는다 — 걸음마다 DP 테이블을 베끼므로 자리가 열다섯이면 메모리가 모자란다.
 * 큰 입력의 계수는 `.proof.ts` 의 가벼운 판(`instrumented`)이 센다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import {
  type TableCell,
  type TableOptions,
  type TablePiece,
  type TableStep,
  tableStage,
} from "../../../_viz/player/tableStage";
import { digitDp } from "./digitDp-guide.ref.ts";

const REF = new URL("./digitDp-guide.ref.ts", import.meta.url).pathname;

type Fn = { digitDp(N: number, K: number): number };

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). 본문의 다른 자리도 이 값을 가리킨다. */
export const WALK_N = 194;
export const WALK_K = 10;

/** 과제 규모 — 상한 `N` 의 위 끝과 목표 합 `K` 의 위 끝. */
export const N_MAX = 10 ** 15;
export const K_MAX = 135;

/** `1961241` → `1,961,241`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 자릿수 배열 — 정본과 같은 식이다. */
export const digitsOf = (N: number): number[] => [...String(N)].map(Number);

/* ───────────────────────── 정본 계측 ───────────────────────── */

/**
 * `count` 앞뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히 맞지 않으면
 * `loadMutant` 가 던진다. 정본의 `count` 를 `counted` 로 옮기고, 같은 이름의 겉함수가 들어갈 때와
 * 나올 때를 알린 뒤 `counted` 를 부른다. 재귀 호출은 겉함수를 거치므로 호출마다 기록이 남는다.
 */
const probed = await loadMutant<Fn>(REF, {
  swap: [
    /^(\s*)function count\(pos: number, sum: number, tight: boolean\): number \{$/,
    [
      "$1function count(pos: number, sum: number, tight: boolean): number {",
      "$1  const probe = (globalThis as any).__digitProbe;",
      "$1  probe.enter(pos, sum, tight, memo);",
      "$1  const value = counted(pos, sum, tight);",
      "$1  probe.leave(value, memo);",
      "$1  return value;",
      "$1}",
      "$1function counted(pos: number, sum: number, tight: boolean): number {",
    ].join("\n"),
  ],
});

/** 호출 하나가 어디서 끝났는가 — ① 가지치기 · ② 기저 · ③ DP 테이블 읽기 · 숫자를 놓아 본 반복. */
export type Kind = "prune" | "base" | "hit" | "loop";

export interface CallNode {
  readonly pos: number;
  readonly sum: number;
  readonly tight: boolean;
  /** 부모가 이 자리 앞에 놓은 숫자. 첫 호출은 `null`. */
  readonly x: number | null;
  /** 첫 호출부터 이 호출 앞까지 놓은 숫자. */
  readonly prefix: readonly number[];
  kind: Kind;
  value: number;
  /** 들어갈 때 `memo[pos][sum]` 의 값(풀린 상태만). 붙은 상태와 `pos = L` 은 `null`. */
  memoBefore: number | null;
  readonly children: CallNode[];
  /** 이번 자리의 상한 — 반복한 호출만. */
  limit: number | null;
  /** ④ 로 반복을 끊었는가. */
  broke: boolean;
  /** 호출이 들어간 차례와 나온 차례(기록 전체에서의 번호). */
  readonly enterAt: number;
  leaveAt: number;
}

/** 기록 한 줄 — 들어감이나 나옴과, 그 순간의 DP 테이블 사본. */
export interface LogLine {
  readonly type: "enter" | "leave";
  readonly node: CallNode;
  /** 그 순간의 `memo`. `snap` 을 끈 기록에서는 `null`. */
  readonly memo: readonly (readonly number[])[] | null;
}

export interface Trace {
  readonly N: number;
  readonly K: number;
  readonly digits: readonly number[];
  readonly L: number;
  readonly root: CallNode;
  readonly log: readonly LogLine[];
  /** 호출이 끝난 뒤의 DP 테이블. */
  readonly memo: readonly (readonly number[])[];
  readonly answer: number;
}

const traceCache = new Map<string, Trace>();

/**
 * 정본 한 번 호출의 기록. 답을 정본과 대조하고, 호출마다 코드의 갈래가 실제로 그 값을 냈는지 대조한다.
 * 갈래는 정본이 쓰는 식(가지치기 조건 · 기저 · DP 테이블 값)으로 가른다 — 가른 결과가 돌려준 값과
 * 어긋나면 던진다.
 */
export function trace(N: number, K: number, snap = true): Trace {
  const key = `${N}|${K}|${snap}`;
  const hit = traceCache.get(key);
  if (hit) return hit;
  const digits = digitsOf(N);
  const L = digits.length;
  const stack: CallNode[] = [];
  const log: LogLine[] = [];
  let root: CallNode | null = null;
  let finalMemo: number[][] = [];
  let tick = 0;
  const copy = (memo: number[][]) =>
    snap ? memo.map((row) => [...row]) : null;
  (globalThis as unknown as { __digitProbe: unknown }).__digitProbe = {
    enter(pos: number, sum: number, tight: boolean, memo: number[][]) {
      const parent = stack.at(-1) ?? null;
      const x = parent === null ? null : sum - parent.sum;
      const node: CallNode = {
        pos,
        sum,
        tight,
        x,
        prefix: parent === null ? [] : [...parent.prefix, x as number],
        kind: "loop",
        value: 0,
        memoBefore:
          !tight && pos < L ? ((memo[pos] as number[])[sum] as number) : null,
        children: [],
        limit: null,
        broke: false,
        enterAt: tick++,
        leaveAt: -1,
      };
      if (parent) parent.children.push(node);
      else root = node;
      stack.push(node);
      log.push({ type: "enter", node, memo: copy(memo) });
    },
    leave(value: number, memo: number[][]) {
      const node = stack.pop() as CallNode;
      node.value = value;
      node.leaveAt = tick++;
      finalMemo = memo;
      const { pos, sum, tight } = node;
      if (sum + 9 * (L - pos) < K) node.kind = "prune";
      else if (pos === L) node.kind = "base";
      else if (!tight && node.memoBefore !== -1) node.kind = "hit";
      else node.kind = "loop";
      const where = `(${pos}, ${sum}, ${tight})`;
      if (node.kind === "prune" && value !== 0)
        throw new Error(`${where} 가지치기가 0 이 아닌 ${value} 를 냈다`);
      if (node.kind === "base" && value !== (sum === K ? 1 : 0))
        throw new Error(`${where} 기저가 ${value} 를 냈다`);
      if (node.kind === "hit" && value !== node.memoBefore)
        throw new Error(`${where} DP 테이블에서 읽은 값이 다르다`);
      if (node.kind !== "loop" && node.children.length > 0)
        throw new Error(`${where} 반복하지 않았는데 자식이 있다`);
      if (node.kind === "loop") {
        const d = digits[pos] as number;
        node.limit = tight ? d : 9;
        node.children.forEach((c, x) => {
          if (c.sum !== sum + x || c.tight !== (tight && x === d))
            throw new Error(`${where} 의 ${x} 번째 자식 상태가 다르다`);
        });
        const total = node.children.reduce((s, c) => s + c.value, 0);
        if (total !== value)
          throw new Error(`${where} 합이 ${value} 가 아니다`);
        node.broke = node.children.length < node.limit + 1;
        if (node.broke && sum + node.children.length <= K)
          throw new Error(`${where} 가 합이 K 를 넘기 전에 멈췄다`);
        const stored = (memo[pos] as number[])[sum] as number;
        if (!tight && stored !== value)
          throw new Error(`${where} 풀린 상태인데 DP 테이블에 적지 않았다`);
      }
      log.push({ type: "leave", node, memo: copy(memo) });
    },
  };
  const answer = probed.digitDp(N, K);
  const want = digitDp(N, K);
  if (answer !== want)
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${N}, ${K}`);
  if (root === null) throw new Error("첫 호출 기록이 없다");
  const r = root as CallNode;
  if (r.value - (K === 0 ? 1 : 0) !== answer)
    throw new Error("첫 호출의 값에서 ⑥ 을 뺀 것이 답과 다르다");
  const t: Trace = {
    N,
    K,
    digits,
    L,
    root: r,
    log,
    memo: finalMemo.map((row) => [...row]),
    answer,
  };
  traceCache.set(key, t);
  return t;
}

/** 기록의 호출 전부를 들어간 차례로. */
export function allCalls(t: Trace): CallNode[] {
  return t.log.filter((l) => l.type === "enter").map((l) => l.node);
}

/* ───────────────────────── 단순한 방법들 ───────────────────────── */

/** 1 부터 N 까지의 자릿수 개수 합 — 하나씩 세는 방법이 자리를 떼어내는 횟수. 자리 수별로 세어 더한다. */
export function stripCount(N: bigint): bigint {
  let total = 0n;
  let low = 1n;
  let d = 1n;
  while (low <= N) {
    const high = low * 10n - 1n;
    const last = high < N ? high : N;
    total += (last - low + 1n) * d;
    low *= 10n;
    d += 1n;
  }
  return total;
}

/** 하나씩 세는 방법 — 자리를 떼어낸 횟수를 함께 돌려준다. */
export function oneByOne(
  N: number,
  K: number,
): { answer: number; strips: number } {
  let answer = 0;
  let strips = 0;
  for (let x = 1; x <= N; x++) {
    let s = 0;
    let v = x;
    while (v > 0) {
      strips++;
      s += v % 10;
      v = Math.floor(v / 10);
    }
    if (s === K) answer++;
  }
  return { answer, strips };
}

/** 기억하지 않는 재귀 — 정본의 갈래 그대로이고 DP 테이블만 없다. 호출 수와 서로 다른 상태 수를 센다. */
export function noMemo(
  N: number,
  K: number,
): { answer: number; calls: number; states: number } {
  const digits = digitsOf(N);
  const L = digits.length;
  let calls = 0;
  const seen = new Set<string>();
  const go = (pos: number, sum: number, tight: boolean): number => {
    calls++;
    seen.add(`${pos}|${sum}|${tight ? 1 : 0}`);
    if (sum + 9 * (L - pos) < K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    const limit = tight ? (digits[pos] as number) : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      if (sum + x > K) break;
      total += go(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }
    return total;
  };
  const answer = go(0, 0, true) - (K === 0 ? 1 : 0);
  return { answer, calls, states: seen.size };
}

/** 상태를 `(pos, sum)` 둘로 두고 상한을 언제나 9 로 두는 판 — `tight` 를 아예 보지 않는다. */
export function alwaysNine(N: number, K: number): number {
  const L = digitsOf(N).length;
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );
  const go = (pos: number, sum: number): number => {
    if (sum + 9 * (L - pos) < K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    const done = (memo[pos] as number[])[sum] as number;
    if (done !== -1) return done;
    let total = 0;
    for (let x = 0; x <= 9; x++) {
      if (sum + x > K) break;
      total += go(pos + 1, sum + x);
    }
    (memo[pos] as number[])[sum] = total;
    return total;
  };
  return go(0, 0) - (K === 0 ? 1 : 0);
}

/** `(pos, sum)` 한 칸에 붙은 상태의 값과 풀린 상태의 값을 함께 담는 판. */
export function sharedTable(N: number, K: number): number {
  const digits = digitsOf(N);
  const L = digits.length;
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );
  const go = (pos: number, sum: number, tight: boolean): number => {
    if (sum + 9 * (L - pos) < K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    const done = (memo[pos] as number[])[sum] as number;
    if (done !== -1) return done;
    const limit = tight ? (digits[pos] as number) : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      if (sum + x > K) break;
      total += go(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }
    (memo[pos] as number[])[sum] = total;
    return total;
  };
  return go(0, 0, true) - (K === 0 ? 1 : 0);
}

/* ───────────────── 무대 — 줄은 (자리, 붙음), 열은 합 ───────────────── */

/** 무대의 줄 번호 — 자리 `pos` 의 붙은 줄이 `2·pos`, 풀린 줄이 `2·pos + 1`. */
export const rowOf = (pos: number, tight: boolean): number =>
  2 * pos + (tight ? 0 : 1);

const cellOf = (n: { pos: number; sum: number; tight: boolean }): TableCell =>
  [rowOf(n.pos, n.tight), n.sum] as const;

/** `memo[2][1]` 꼴의 이름. */
export const memoName = (pos: number, sum: number): string =>
  `memo[${pos}][${sum}]`;

/** 상태 이름 — 「자리 2 · 합 1 · 풀린 상태」. */
export const stateName = (n: {
  pos: number;
  sum: number;
  tight: boolean;
}): string => `자리 ${n.pos} · 합 ${n.sum} · ${n.tight ? "붙은" : "풀린"} 상태`;

/** 무대의 줄 머리 — 자리마다 붙은 줄과 풀린 줄. */
export function rowHeadsOf(L: number): string[] {
  return Array.from({ length: L }, (_, p) => [
    `자리 ${p} 붙음`,
    `자리 ${p} 풀림`,
  ]).flat();
}

export function tableOptionsOf(t: Trace): TableOptions {
  return {
    rowHeads: rowHeadsOf(t.L),
    colHeads: Array.from({ length: t.K + 1 }, (_, s) => s),
    colLabel: "합 sum",
  };
}

/** 이 입력에서 한 번이라도 들어간 상태(`pos < L`). 나머지 칸이 「이번 걸음 밖」이다. */
export function reachable(t: Trace): Set<string> {
  const out = new Set<string>();
  for (const n of allCalls(t))
    if (n.pos < t.L) out.add(`${rowOf(n.pos, n.tight)}|${n.sum}`);
  return out;
}

function outCells(t: Trace): TableCell[] {
  const r = reachable(t);
  const cells: TableCell[] = [];
  for (let row = 0; row < 2 * t.L; row++)
    for (let s = 0; s <= t.K; s++)
      if (!r.has(`${row}|${s}`)) cells.push([row, s]);
  return cells;
}

/** 무대 표 한 장 — 풀린 줄은 그 순간의 DP 테이블, 붙은 줄은 그때까지 끝난 붙은 상태의 값. */
function tableAt(
  t: Trace,
  memo: readonly (readonly number[])[],
  tightDone: ReadonlyMap<number, CallNode>,
): (string | null)[][] {
  const rows: (string | null)[][] = [];
  for (let p = 0; p < t.L; p++) {
    const done = tightDone.get(p);
    rows.push(
      Array.from({ length: t.K + 1 }, (_, s) =>
        done && done.sum === s ? comma(done.value) : null,
      ),
    );
    rows.push(
      Array.from({ length: t.K + 1 }, (_, s) => {
        const v = (memo[p] as number[])[s] as number;
        return v === -1 ? null : comma(v);
      }),
    );
  }
  return rows;
}

function rowSideAt(t: Trace, table: (string | null)[][]): string[] {
  const r = reachable(t);
  return table.map((row, i) => {
    const pos = Math.floor(i / 2);
    if (i % 2 === 0) return `상한 ${t.digits[pos]} · DP 테이블 밖`;
    const reach = row.filter((_, s) => r.has(`${i}|${s}`)).length;
    const filled = row.filter((v) => v !== null).length;
    return `상한 9 · 채움 ${filled} / ${reach}`;
  });
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

/**
 * 걸음 하나가 무엇을 보이는가.
 *
 * - `enter` — 반복하는 상태에 들어가 숫자를 놓기 시작한다. 그 아래에 또 반복하는 상태가 있을 때만
 *   걸음으로 세운다(마지막 자리처럼 아래가 기저뿐이면 끝낼 때 한 걸음이면 된다).
 * - `finish` — 반복을 끝내고 값을 정한다. 풀린 상태면 DP 테이블에 적는다(⑤).
 * - `prune` — ① 이 0 을 돌려준다(`pos < L` 인 것만 — 마지막 자리 뒤의 판정은 부모의 걸음이 센다).
 * - `hit` — ③ 이 DP 테이블에서 읽는다.
 *
 * 한 부모 아래에서 잇달아 일어난 같은 모양의 일(갈래 표지가 같은 `finish` · 모든 `hit`)은 한 걸음으로
 * 묶는다. 묶지 않으면 같은 그림이 여덟 장씩 늘어선다.
 */
export type StepKind = "init" | "enter" | "finish" | "prune" | "hit";

export interface Step {
  readonly id: string;
  readonly kind: StepKind;
  readonly nodes: readonly CallNode[];
  readonly title: string;
  readonly detail: string;
  readonly step: TableStep;
}

/** 반복을 끝낸 상태가 거친 갈래 — 자식이 끝난 자리와 ④. */
export function branchesOf(n: CallNode): string[] {
  const out = new Set<string>();
  for (const c of n.children) {
    if (c.kind === "prune") out.add("①");
    if (c.kind === "base") out.add("②");
    if (c.kind === "hit") out.add("③");
  }
  if (n.broke) out.add("④");
  if (!n.tight) out.add("⑤");
  return ["①", "②", "③", "④", "⑤"].filter((b) => out.has(b));
}

const signature = (kind: StepKind, n: CallNode): string =>
  kind === "finish" ? `${kind}|${branchesOf(n).join("")}` : kind;

/** 걸음이 될 일을 기록 차례로 뽑는다. */
function rawEvents(t: Trace): { kind: StepKind; node: CallNode; at: number }[] {
  const out: { kind: StepKind; node: CallNode; at: number }[] = [];
  t.log.forEach((line, at) => {
    const n = line.node;
    if (n.pos >= t.L) return;
    if (line.type === "enter") {
      if (n.kind === "loop" && n.children.some((c) => c.kind === "loop"))
        out.push({ kind: "enter", node: n, at });
      return;
    }
    if (n.kind === "loop") out.push({ kind: "finish", node: n, at });
    if (n.kind === "prune") out.push({ kind: "prune", node: n, at });
    if (n.kind === "hit") out.push({ kind: "hit", node: n, at });
  });
  return out;
}

/** 이웃한 같은 모양의 일을 묶는다. 묶음마다 마지막 일의 기록 번호를 무대의 시점으로 쓴다. */
function grouped(
  t: Trace,
): { kind: StepKind; nodes: CallNode[]; at: number }[] {
  const parentOf = new Map<CallNode, CallNode>();
  for (const n of allCalls(t)) for (const c of n.children) parentOf.set(c, n);
  const out: { kind: StepKind; nodes: CallNode[]; at: number }[] = [];
  for (const e of rawEvents(t)) {
    const last = out.at(-1);
    const mergeable = e.kind === "finish" || e.kind === "hit";
    if (
      last &&
      mergeable &&
      last.kind === e.kind &&
      parentOf.get(last.nodes[0] as CallNode) === parentOf.get(e.node) &&
      signature(last.kind, last.nodes[0] as CallNode) ===
        signature(e.kind, e.node)
    ) {
      last.nodes.push(e.node);
      last.at = e.at;
      continue;
    }
    out.push({ kind: e.kind, nodes: [e.node], at: e.at });
  }
  return out;
}

const range = (a: number, b: number): string =>
  a === b ? `${a}` : b === a + 1 ? `${a} · ${b}` : `${a} … ${b}`;

const memoRange = (pos: number, sums: readonly number[]): string =>
  sums.length === 1
    ? memoName(pos, sums[0] as number)
    : `${memoName(pos, sums[0] as number)} … ${memoName(pos, sums.at(-1) as number)}`;

/** 숫자를 놓아 본 범위 괄호 — 다음 자리의 합이 어디까지 가는가. */
function xPiece(n: CallNode): TablePiece {
  const m = n.children.length;
  const cut = n.broke ? ` · x=${m} 에서 ④` : "";
  return {
    label: "놓은 x",
    from: n.sum,
    to: n.sum + m - 1,
    tone: "query",
    text: `x = ${range(0, m - 1)}`,
    side: `상한 ${n.limit}${cut}`,
  };
}

/** 자식이 끝난 모양을 갈래로 센 한 문장 — 마지막 자리처럼 자식이 전부 기저·가지치기일 때. */
function leafSentence(n: CallNode, K: number): string {
  const base = n.children.filter((c) => c.kind === "base");
  const prune = n.children.filter((c) => c.kind === "prune");
  const parts: string[] = [];
  if (prune.length > 0) {
    const xs = prune.map((c) => c.x as number);
    parts.push(
      `x = ${range(xs[0] as number, xs.at(-1) as number)}${josa(String(xs.at(-1)), "은", "는")} 합이 ${K} 에 못 미쳐 ① 이 0 을`,
    );
  }
  const hitBase = base.filter((c) => c.value === 1);
  if (hitBase.length > 0) {
    const x = hitBase[0]?.x as number;
    parts.push(
      `x = ${x}${josa(String(x), "은", "는")} 합이 ${K}${josa(String(K), "이라", "라")} ② 가 1 을`,
    );
  }
  return `${parts.join(", ")} 돌려줍니다.`;
}

function detailOf(
  t: Trace,
  kind: StepKind,
  nodes: readonly CallNode[],
  writtenBy: ReadonlyMap<string, string>,
): string {
  const n = nodes[0] as CallNode;
  const d = t.digits[n.pos] as number;
  const m = n.children.length;
  const prefix =
    n.prefix.length === 0
      ? ""
      : `앞에 ${n.prefix.join(" ")}${을를(String(n.prefix.at(-1)))} 놓고 `;
  if (kind === "enter") {
    const head = `${prefix}${stateName(n)}로 들어왔습니다.`;
    const lim = n.tight
      ? `붙은 상태라 상한이 digits[${n.pos}] = ${d} 입니다.`
      : `풀린 상태라 상한이 9 입니다. ${memoName(n.pos, n.sum)} 이 아직 -1 이라 ③ 이 읽을 값이 없습니다.`;
    const free = n.children.filter((c) => !c.tight).map((c) => c.x as number);
    const tight = n.children.find((c) => c.tight);
    const xs = (a: number, b: number) => `x = ${range(a, b)}${을를(String(b))}`;
    const go: string[] = [];
    if (n.tight && free.length > 0)
      go.push(
        `${xs(free[0] as number, free.at(-1) as number)} 놓으면 ${d} 보다 작아 다음 자리가 풀린 상태가 되고`,
      );
    if (!n.tight && free.length > 0)
      go.push(
        `${xs(free[0] as number, free.at(-1) as number)} 놓은 다음 자리도 모두 풀린 상태입니다.`,
      );
    if (tight)
      go.push(
        `${xs(tight.x as number, tight.x as number)} 놓으면 digits[${n.pos}] = ${d}${과와(String(d))} 같아 붙은 채로 갑니다.`,
      );
    const cut = n.broke
      ? ` x = ${m}${josa(String(m), "은", "는")} 합이 ${n.sum + m}${josa(String(n.sum + m), "이라", "라")} ④ 로 끊습니다.`
      : "";
    return `${head} ${lim} ${go.join(", ")}${cut}`;
  }
  if (kind === "prune") {
    const left = t.L - n.pos;
    const most = n.sum + 9 * left;
    return `${prefix}${stateName(n)}로 왔습니다. 남은 ${left} 자리를 전부 9 로 채워도 ${n.sum} + 9 × ${left} = ${most}${이가(String(most))} K = ${t.K} 보다 작아 ① 이 0 을 돌려줍니다. DP 테이블에는 적지 않습니다.`;
  }
  if (kind === "hit") {
    const sums = nodes.map((c) => c.sum);
    const from = [
      ...new Set(sums.map((s) => writtenBy.get(`${n.pos}|${s}`))),
    ].join(" · ");
    const total = nodes.reduce((s, c) => s + c.value, 0);
    return `x = ${range(n.x as number, nodes.at(-1)?.x as number)}${josa(String(nodes.at(-1)?.x), "을", "를")} 놓은 다음 상태는 자리 ${n.pos} · 합 ${range(sums[0] as number, sums.at(-1) as number)} · 풀린 상태이고, ${from}${이가(from)} 이미 정한 칸입니다. ③ 이 ${memoRange(n.pos, sums)}${josa(String(nodes.length), "을", "를")} ${nodes.length} 번 읽어 합 ${total}${을를(String(total))} 받습니다.`;
  }
  // finish
  if (nodes.length > 1) {
    const sums = nodes.map((c) => c.sum);
    const values = [...new Set(nodes.map((c) => c.value))];
    return `${memoRange(n.pos, sums)} ${nodes.length} 칸이 같은 모양입니다. 칸마다 합을 ${t.K}${으로(String(t.K))} 만드는 숫자 하나에서 ② 가 1 을, 그보다 작은 숫자에서 ① 이 0 을 돌려주고, 그보다 큰 숫자는 ④ 로 끊습니다. ${nodes.length} 칸 모두 ${values.join(" · ")}${을를(String(values.at(-1)))} 적습니다 ⑤.`;
  }
  const leaves = n.children.every(
    (c) => c.kind === "base" || c.kind === "prune",
  );
  const head = `${prefix}${stateName(n)}의 반복을 끝냅니다.`;
  const body = leaves
    ? leafSentence(n, t.K)
    : `x = ${range(0, m - 1)}${josa(String(m - 1), "을", "를")} 놓아 얻은 값 ${n.children.map((c) => comma(c.value)).join(" · ")}${을를(comma(n.children.at(-1)?.value ?? 0))} 더하면 ${comma(n.value)} 입니다.`;
  const over = n.sum + m;
  const cut = n.broke
    ? ` x = ${m}${josa(String(m), "은", "는")} 합이 ${over}${josa(String(over), "이라", "라")} ④ 로 끊습니다.`
    : "";
  const one =
    n.tight && leaves
      ? ` 수 ${[...n.prefix, ...n.children.filter((c) => c.value === 1).map((c) => c.x as number)].join("")} 하나입니다.`
      : "";
  const end = n.tight
    ? ` 붙은 상태라 DP 테이블에 적지 않고 ${comma(n.value)}${을를(comma(n.value))} 돌려주기만 합니다.`
    : ` 풀린 상태라 ${memoName(n.pos, n.sum)} 에 ${comma(n.value)}${을를(comma(n.value))} 적습니다 ⑤.`;
  const root =
    n.pos === 0 && n.tight
      ? ` K = ${t.K}${이가(String(t.K))} 0 이 아니라 ⑥ 은 빼지 않고, 답은 ${comma(t.answer)} 입니다.`
      : "";
  return `${head} ${body}${cut}${one}${end}${root}`;
}

function titleOf(t: Trace, kind: StepKind, nodes: readonly CallNode[]): string {
  const n = nodes[0] as CallNode;
  const tag = n.tight ? "붙음" : "풀림";
  if (kind === "enter")
    return `자리 ${n.pos} · 합 ${n.sum} · ${tag} — 상한 ${n.tight ? t.digits[n.pos] : 9}`;
  if (kind === "prune") return `자리 ${n.pos} · 합 ${n.sum} · ${tag} → 0 ①`;
  if (kind === "hit")
    return `${memoRange(
      n.pos,
      nodes.map((c) => c.sum),
    )} 읽기 ③ × ${nodes.length}`;
  if (nodes.length > 1)
    return `${memoRange(
      n.pos,
      nodes.map((c) => c.sum),
    )} = ${comma(n.value)} ⑤`;
  if (n.tight) return `자리 ${n.pos} · 합 ${n.sum} · 붙음 = ${comma(n.value)}`;
  return `${memoName(n.pos, n.sum)} = ${comma(n.value)} ⑤`;
}

function calcOf(
  t: Trace,
  kind: StepKind,
  nodes: readonly CallNode[],
): { expr: string; result: string } {
  const n = nodes[0] as CallNode;
  if (kind === "enter")
    return {
      expr: n.tight ? `상한 = digits[${n.pos}] =` : "상한 =",
      result: String(n.limit),
    };
  if (kind === "prune")
    return {
      expr: `${n.sum} + 9 × ${t.L - n.pos} < ${t.K} →`,
      result: "0",
    };
  if (kind === "hit") {
    const total = nodes.reduce((s, c) => s + c.value, 0);
    return {
      expr: `${nodes.map((c) => comma(c.value)).join(" + ")} =`,
      result: comma(total),
    };
  }
  if (nodes.length > 1)
    return {
      expr: `${memoRange(
        n.pos,
        nodes.map((c) => c.sum),
      )} =`,
      result: [...new Set(nodes.map((c) => comma(c.value)))].join(" · "),
    };
  return {
    expr: `${n.children.map((c) => comma(c.value)).join(" + ")} =`,
    result: comma(n.value),
  };
}

/** 걸음 전부 — DP 테이블을 까는 한 걸음 + 묶은 일마다 한 걸음. */
export function walkSteps(N = WALK_N, K = WALK_K): Step[] {
  const t = trace(N, K);
  const out = outCells(t);
  const steps: Step[] = [];
  const empty = t.log[0]?.memo as readonly (readonly number[])[];
  const tightDone = new Map<number, CallNode>();
  const writtenBy = new Map<string, string>();
  const table0 = tableAt(t, empty, tightDone);
  steps.push({
    id: "T1",
    kind: "init",
    nodes: [],
    title: `DP 테이블 ${t.L} × ${t.K + 1}${을를(String(t.K + 1))} 깐다`,
    detail: `N = ${N}${을를(String(N))} 자리로 가르면 digits = [${t.digits.join(", ")}] 이고 L = ${t.L} 입니다. DP 테이블 memo 를 ${t.L} × ${t.K + 1}${으로(String(t.K + 1))} 만들어 전부 -1(아직 안 정함)로 둡니다. 무대의 풀린 줄이 그 DP 테이블이고, 붙은 줄은 DP 테이블 밖입니다. 이 입력에서 한 번도 들어가지 않는 상태는 대시로 그렸습니다.`,
    step: {
      table: table0,
      out,
      rowSide: rowSideAt(t, table0),
      calc: { expr: "DP 테이블 L × (K+1) =", result: `${t.L} × ${t.K + 1}` },
      vars: `digits = [${t.digits.join(", ")}] · K = ${K}`,
    },
  });
  for (const g of grouped(t)) {
    const id = `T${steps.length + 1}`;
    const n = g.nodes[0] as CallNode;
    const memo = t.log[g.at]?.memo as readonly (readonly number[])[];
    if (g.kind === "finish")
      for (const c of g.nodes) if (c.tight) tightDone.set(c.pos, c);
    const table = tableAt(t, memo, tightDone);
    const shown = (c: CallNode): boolean =>
      c.pos < t.L &&
      (c.kind === "hit" ||
        (c.kind === "loop" && !c.tight) ||
        (c.kind === "loop" && c.tight));
    let read: TableCell[] = [];
    let write: TableCell[] = [];
    let target: TableCell[] = [];
    let pieces: TablePiece[] = [];
    if (g.kind === "enter") {
      target = [cellOf(n)];
      pieces = [xPiece(n)];
    } else if (g.kind === "prune") {
      target = [cellOf(n)];
    } else if (g.kind === "hit") {
      read = g.nodes.map(cellOf);
    } else {
      write = g.nodes.map(cellOf);
      read = g.nodes.flatMap((c) => c.children.filter(shown).map(cellOf));
      if (g.nodes.length === 1) pieces = [xPiece(n)];
    }
    const detail = detailOf(t, g.kind, g.nodes, writtenBy);
    if (g.kind === "finish")
      for (const c of g.nodes)
        if (!c.tight) writtenBy.set(`${c.pos}|${c.sum}`, id);
    steps.push({
      id,
      kind: g.kind,
      nodes: g.nodes,
      title: titleOf(t, g.kind, g.nodes),
      detail,
      step: {
        table,
        ...(read.length > 0 ? { read } : {}),
        ...(write.length > 0 ? { write } : {}),
        ...(target.length > 0 ? { target } : {}),
        out,
        ...(pieces.length > 0 ? { pieces } : {}),
        rowSide: rowSideAt(t, table),
        calc: calcOf(t, g.kind, g.nodes),
        vars: `앞 숫자 ${n.prefix.length === 0 ? "없음" : n.prefix.join(" ")} · N 의 숫자 ${t.digits.join(" ")}`,
      },
    });
  }
  return steps;
}

/**
 * 필름과 패널을 가르는 자리 — 풀린 상태가 DP 테이블을 채우는 벌(`free`)과, 붙은 상태가 N 을 따라가며
 * 그 DP 테이블을 읽는 벌(`tight`). 첫 호출이 `x = digits[0]` 을 놓아 붙은 채 둘째 자리로 들어가는
 * 걸음이 둘째 벌의 머리다.
 */
export function walkParts(): { free: Step[]; tight: Step[] } {
  const all = walkSteps();
  const cut = all.findIndex(
    (s) => s.kind === "enter" && s.nodes[0]?.tight && s.nodes[0]?.pos === 1,
  );
  if (cut < 0) throw new Error("붙은 채 자리 1 로 들어가는 걸음이 없다");
  return { free: all.slice(0, cut), tight: all.slice(cut) };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `digitDp-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...s.step,
  });
  const parts = walkParts();
  return { free: parts.free.map(toStep), tight: parts.tight.map(toStep) };
}

/** 패널 `result` — 첫 벌은 그 벌이 마지막에 적은 칸의 값, 둘째 벌은 반환값. */
export function simResults(): { free: string; tight: string } {
  const parts = walkParts();
  const last = parts.free.at(-1)?.nodes[0] as CallNode;
  return {
    free: comma(last.value),
    tight: comma(trace(WALK_N, WALK_K).answer),
  };
}

export const TABLE_OPTIONS = tableOptionsOf(trace(WALK_N, WALK_K));

const film = (steps: Step[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: tableStage(s.step, TABLE_OPTIONS),
  }));

/* ───────────────── 정적 한 장 ───────────────── */

/** 호출이 다 끝난 뒤의 상태 전부 — 붙은 줄에는 붙은 상태가 돌려준 값을 적는다. */
function finalTable(t: Trace): TableStep {
  const tightDone = new Map<number, CallNode>();
  for (const n of allCalls(t))
    if (n.tight && n.kind === "loop" && n.pos < t.L) tightDone.set(n.pos, n);
  const table = tableAt(t, t.memo, tightDone);
  return { table, out: outCells(t), rowSide: rowSideAt(t, table) };
}

/** 자리마다 붙은 상태 하나와 풀린 상태가 오는 합 — 「먼저 알아 둘 개념」의 그림. */
export function positionsOf(t: Trace): {
  tightSum: (number | null)[];
  freeSums: number[][];
} {
  const tightSum: (number | null)[] = new Array(t.L).fill(null);
  const freeSums: number[][] = Array.from({ length: t.L }, () => []);
  for (const n of allCalls(t)) {
    if (n.pos >= t.L) continue;
    if (n.tight) tightSum[n.pos] = n.sum;
    else if (!(freeSums[n.pos] as number[]).includes(n.sum))
      (freeSums[n.pos] as number[]).push(n.sum);
  }
  for (const s of freeSums) s.sort((a, b) => a - b);
  return { tightSum, freeSums };
}

function positionRows(t: Trace): StageRow[] {
  const { tightSum, freeSums } = positionsOf(t);
  const sums = (xs: number[]) =>
    xs.length === 0
      ? "없음"
      : xs.length === 1
        ? String(xs[0])
        : `${xs[0]} … ${xs.at(-1)}`;
  return [
    {
      kind: "index",
      label: "자리 pos",
      labels: t.digits.map((_, p) => p),
    },
    { kind: "cells", label: "N 의 숫자", values: [...t.digits] },
    {
      kind: "cells",
      label: "붙은 상태의 합",
      values: tightSum.map((s) => (s === null ? "없음" : String(s))),
      states: Object.fromEntries(tightSum.map((_, p) => [p, "focus"])),
      side: "자리마다 하나",
    },
    {
      kind: "cells",
      label: "붙은 상태의 상한",
      values: [...t.digits],
      side: "N 의 그 자리 숫자",
    },
    {
      kind: "cells",
      label: "풀린 상태의 합",
      values: freeSums.map(sums),
      states: Object.fromEntries(
        freeSums.map((s, p) => [p, s.length === 0 ? "out" : "read"]),
      ),
      side: "여러 합",
    },
    {
      kind: "cells",
      label: "풀린 상태의 상한",
      values: t.digits.map(() => 9),
      side: "언제나 9",
    },
  ];
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 ───────────────── */

function approaches(): Approach[] {
  const strips = stripCount(BigInt(N_MAX));
  const nines = 999_999_999_999_999;
  const rec = noMemo(nines, WALK_K);
  const want194 = digitDp(WALK_N, WALK_K);
  const nine194 = alwaysNine(WALK_N, WALK_K);
  const want100 = digitDp(100, 2);
  const shared100 = sharedTable(100, 2);
  const L = digitsOf(N_MAX).length;
  return [
    {
      name: "하나씩 세기",
      idea: "1 부터 N 까지 수마다 자리를 떼어 더하고 K 와 비교한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "정확하다", ok: true },
        {
          label: "시간",
          value: `N = 10^15 에서 자리 떼기 ${comma(strips)} 번`,
          ok: false,
        },
      ],
      lesson: "수를 왼쪽 자리부터 만들면 남은 일이 같은 갈래가 많다",
    },
    {
      name: "기억하지 않는 재귀",
      idea: "자리마다 숫자를 다 놓아 보고 합이 K 인 것을 센다",
      verdict: "drop",
      checks: [
        { label: "답", value: "정확하다", ok: true },
        {
          label: "호출",
          value: `9 가 열다섯인 N · K = ${WALK_K} 에서 ${comma(rec.calls)} 번 · 서로 다른 상태는 ${comma(rec.states)} 개`,
          ok: false,
        },
      ],
      lesson: "같은 상태의 답을 칸에 적어 두자 — 상태를 무엇으로 둘까",
    },
    {
      name: "상태 (자리, 합) · 상한 9",
      idea: "앞의 숫자를 잊고 자리마다 0 부터 9 까지 놓는다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `N = ${WALK_N} · K = ${WALK_K} 에서 ${nine194} (정답 ${want194})`,
          ok: false,
        },
      ],
      lesson: "N 을 넘는 수를 막으려면 이번 자리의 상한을 알아야 한다",
    },
    {
      name: "(자리, 합) 한 칸을 함께 쓰기",
      idea: "상한은 가려 쓰되 붙은 상태와 풀린 상태가 칸 하나를 나눈다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `N = 100 · K = 2 에서 ${shared100} (정답 ${want100})`,
          ok: false,
        },
      ],
      lesson: "상한이 다른 두 상태는 칸을 갈라야 한다",
    },
    {
      name: "붙음 표시를 단 자릿수 DP 테이블",
      idea: "상태 (자리, 합, 붙음) 중 풀린 상태만 DP 테이블 memo[자리][합] 에 적는다",
      verdict: "keep",
      checks: [
        {
          label: "답",
          value: `N = ${WALK_N} · K = ${WALK_K} 에서 ${want194}`,
          ok: true,
        },
        {
          label: "칸",
          value: `N ≤ 10^15 · K ≤ ${K_MAX} 에서 ${L} × ${K_MAX + 1} = ${comma(L * (K_MAX + 1))} 칸`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-states": () => {
    const t = trace(WALK_N, WALK_K);
    return (
      <CellStage
        title={`digitDp(${WALK_N}, ${WALK_K}) 의 상태 — 줄은 자리와 붙음 여부, 열은 앞 숫자의 합`}
        rows={tableStage(finalTable(t), TABLE_OPTIONS)}
        columns={t.K + 1}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`N ≤ 10^15 · K ≤ ${K_MAX} · 1 초 · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-positions": () => {
    const t = trace(WALK_N, WALK_K);
    return (
      <CellStage
        title={`N = ${WALK_N} 의 자리마다 — 붙은 상태는 합 하나, 풀린 상태는 여러 합`}
        rows={positionRows(t)}
        columns={t.L}
      />
    );
  },
  "walk-free": () => {
    const s = walkParts().free;
    return (
      <CellStageFilm
        title={`digitDp(${WALK_N}, ${WALK_K}) — ${s[0]?.id}~${s.at(-1)?.id} · 풀린 상태가 DP 테이블을 채운다`}
        columns={WALK_K + 1}
        frames={film(s)}
      />
    );
  },
  "walk-tight": () => {
    const s = walkParts().tight;
    return (
      <CellStageFilm
        title={`digitDp(${WALK_N}, ${WALK_K}) — ${s[0]?.id}~${s.at(-1)?.id} · 붙은 상태가 N 을 따라가며 DP 테이블을 읽는다`}
        columns={WALK_K + 1}
        frames={film(s)}
      />
    );
  },
};
