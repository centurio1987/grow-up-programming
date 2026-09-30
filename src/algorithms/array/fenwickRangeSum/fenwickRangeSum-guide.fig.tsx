/**
 * `fenwickRangeSum-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본 소스에서 **기록 줄만 끼운 사본**을
 * 기계로 만들고(`traced`), 그 기록으로 펜윅 트리의 칸 값 · 읽은 칸 · 고친 칸을 얻는다. 걸음 재생 패널의
 * 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `fenwickRangeSum-guide.test.ts` 가 잰다.
 *
 * 기록 사본은 걸음마다 트리 배열 전체를 베낀다. 큰 입력에서 그렇게 하면 메모리가 모자라므로 기록은 작은
 * 입력(64 칸 이하)에만 쓰고, 규모를 재는 자리는 접근 수만 세는 가벼운 판(`fenwickCount` 등)을 쓴다.
 */

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ReactElement } from "react";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
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
import { type LayerBar, LayerBars } from "../../../_viz/patterns/LayerBars";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import {
  type FenwickOp,
  fenwickRangeSum,
} from "./fenwickRangeSum-guide.ref.ts";

const REF = new URL("./fenwickRangeSum-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 공용 값 ───────────────────────── */

/** 칸 `k` 의 최하위 1 비트 — 칸 `k` 가 맡는 구간의 길이. 정본의 `lowbit` 과 같은 식이다. */
export const lowbit = (k: number): number => k & -k;

/** 칸 `k`(1 부터)가 맡는 인덱스 구간 `[k − lowbit(k), k − 1]`(0 부터, 양끝 포함). */
export const coverOf = (k: number): [number, number] => [k - lowbit(k), k - 1];

/** 인덱스 구간 표기 `[a,b]`(L25). */
export const span = (a: number, b: number): string => `[${a},${b}]`;
/** 값 나열 표기 `[1 2 3]`(L25). */
export const values = (xs: readonly number[]): string => `[${xs.join(" ")}]`;
/** 천 단위 구분. */
export const num = (x: number): string => x.toLocaleString("en-US");
/** 이진 표기에 ₂ 를 붙인다. */
export const bin = (x: number, width = 1): string =>
  `${x.toString(2).padStart(width, "0")}₂`;
/** 1 비트의 개수. */
export const popcount = (x: number): number => {
  let c = 0;
  for (let v = x; v > 0; v &= v - 1) c++;
  return c;
};

export const range = (lo: number, hi: number): number[] =>
  Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
export const sumOf = (A: readonly number[], l: number, r: number): number =>
  range(l, r).reduce((s, i) => s + (A[i] as number), 0);

/** 단순 연산 1 초에 1 억 번 기준의 초. */
export const seconds = (ops: number): string =>
  ops < 1e6 ? "0.01 초 미만" : `${(ops / 1e8).toFixed(2)} 초`;

/** 본문 전개 입력(「수행으로 알아보는 알고리즘」과 같다). */
export const WALK: readonly number[] = [1, 2, 3, 4, 5];

/** 그 입력에 거는 연산 넷 — 질의 셋과 갱신 하나이고, 갱신이 가운데에 있다. */
export const WALK_OPS: readonly FenwickOp[] = [
  { type: "query", l: 0, r: 4 },
  { type: "update", i: 2, v: 10 },
  { type: "query", l: 0, r: 4 },
  { type: "query", l: 2, r: 3 },
];

/** 칸이 많을 때의 모양을 보이는 길이 16 배열 — 값은 인덱스에 1 을 더한 수다. */
export const SHAPE: readonly number[] = range(1, 16);

/** 칸 `k` 가 맡는 구간의 합 — 정의대로 직접 더한다. */
export const coverSum = (A: readonly number[], k: number): number => {
  const [a, b] = coverOf(k);
  return sumOf(A, a, b);
};

/** 정의로 만든 트리 배열(칸 0 은 0). */
export const treeByDef = (A: readonly number[]): number[] => [
  0,
  ...range(1, A.length).map((k) => coverSum(A, k)),
];

/** `prefix(r)` 가 읽는 칸 — 최하위 1 비트를 지워 가며. */
export const prefixChain = (r: number): number[] => {
  const out: number[] = [];
  for (let k = r; k > 0; k -= lowbit(k)) out.push(k);
  return out;
};

/** `add(i, …)` 가 고치는 칸 — 최하위 1 비트를 더해 가며. */
export const addChain = (i: number, N: number): number[] => {
  const out: number[] = [];
  for (let k = i; k <= N; k += lowbit(k)) out.push(k);
  return out;
};

/* ───────────────────────── 정본 기록 ───────────────────────── */

/**
 * 정본 소스의 일곱 줄 뒤에 기록 한 줄씩을 끼운다. 줄마다 정확히 한 번 맞아야 하고, 아니면 던진다 —
 * 정본이 바뀌었는데 기록이 옛 줄을 붙들고 있으면 그림이 옛말을 한다. 절차는 한 글자도 안 바꾼다.
 */
const PROBES: readonly [RegExp, string][] = [
  [
    /^(\s*)for \(let i = 1; i <= N; i\+\+\) tree\[i\] = arr\[i - 1\] \?\? 0;.*$/,
    '$&\n$1(globalThis as any).__fw.push({ kind: "own", tree: tree.slice() });',
  ],
  [
    /^(\s*)if \(j <= N\) tree\[j\] = \(tree\[j\] \?\? 0\) \+ \(tree\[i\] \?\? 0\);.*$/,
    '$1if (j <= N) { tree[j] = (tree[j] ?? 0) + (tree[i] ?? 0); (globalThis as any).__fw.push({ kind: "give", i, j, tree: tree.slice() }); } else (globalThis as any).__fw.push({ kind: "skip", i, j });',
  ],
  [
    /^(\s*)let sum = 0;$/,
    '$&\n$1(globalThis as any).__fw.push({ kind: "prefix", r });',
  ],
  [
    /^(\s*)sum \+= tree\[k\] \?\? 0;.*$/,
    '$&\n$1(globalThis as any).__fw.push({ kind: "read", k, value: tree[k] ?? 0, sum });',
  ],
  [
    /^(\s*)const delta = op\.v - \(arr\[op\.i\] \?\? 0\);.*$/,
    '$&\n$1(globalThis as any).__fw.push({ kind: "delta", i: op.i, old: arr[op.i] ?? 0, v: op.v, delta });',
  ],
  [
    /^(\s*)tree\[k\] = \(tree\[k\] \?\? 0\) \+ delta;.*$/,
    '$&\n$1(globalThis as any).__fw.push({ kind: "add", k, delta, tree: tree.slice() });',
  ],
  [
    /^(\s*)result\.push\(prefix\(op\.r \+ 1\) - prefix\(op\.l\)\);.*$/,
    '$&\n$1(globalThis as any).__fw.push({ kind: "answer", l: op.l, r: op.r, value: result[result.length - 1] });',
  ],
];

interface Impl {
  fenwickRangeSum(A: number[], ops: FenwickOp[]): number[];
}

async function traced(): Promise<Impl> {
  let text = readFileSync(REF, "utf8");
  for (const [pattern, replacement] of PROBES) {
    const lines = text.split("\n");
    const hits = lines.filter((l) => pattern.test(l)).length;
    if (hits !== 1) {
      throw new Error(`기록 줄 ${pattern} 이 정본 ${hits} 줄에 맞았다`);
    }
    text = lines
      .map((l) => (pattern.test(l) ? l.replace(pattern, replacement) : l))
      .join("\n");
  }
  const dir = mkdtempSync(join(tmpdir(), "fenwick-trace-"));
  const path = join(dir, "fenwickRangeSum-guide.ref.ts");
  writeFileSync(path, text, "utf8");
  return (await import(path)) as Impl;
}

const probe = await traced();

export type Event =
  | { kind: "own"; tree: number[] }
  | { kind: "give"; i: number; j: number; tree: number[] }
  | { kind: "skip"; i: number; j: number }
  | { kind: "prefix"; r: number }
  | { kind: "read"; k: number; value: number; sum: number }
  | { kind: "delta"; i: number; old: number; v: number; delta: number }
  | { kind: "add"; k: number; delta: number; tree: number[] }
  | { kind: "answer"; l: number; r: number; value: number };

export interface Trace {
  readonly events: readonly Event[];
  readonly result: readonly number[];
}

/**
 * 정본 한 번 호출의 기록. 답은 정본과 대조하고, 채우기가 끝난 트리와 갱신이 끝난 트리는 정의(칸이 맡는
 * 구간의 합)와 대조한다. 기록이 걸음마다 트리를 베끼므로 작은 입력에만 쓴다.
 */
export function trace(A: readonly number[], ops: readonly FenwickOp[]): Trace {
  if (A.length > 64) {
    throw new Error(
      "기록 사본은 작은 입력에만 쓴다 — 큰 입력은 셈만 하는 판으로",
    );
  }
  const g = globalThis as unknown as { __fw: Event[] };
  g.__fw = [];
  const got = probe.fenwickRangeSum(
    [...A],
    ops.map((o) => ({ ...o })),
  );
  const events = [...g.__fw];
  const want = fenwickRangeSum(
    [...A],
    ops.map((o) => ({ ...o })),
  );
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error("기록 사본이 정본과 다른 답을 냈다");
  }
  // 연산을 차례로 적용한 배열로, 채우기가 끝난 시점과 갱신이 끝난 시점의 트리를 정의와 맞댄다.
  const arr = [...A];
  const check = (tree: readonly number[], when: string) => {
    const def = treeByDef(arr);
    if (JSON.stringify(tree.slice(1)) !== JSON.stringify(def.slice(1))) {
      throw new Error(`${when} 의 트리가 정의와 다르다`);
    }
  };
  let tree: number[] = [];
  let built = false;
  let pending = 0;
  for (const e of events) {
    if (e.kind === "own" || e.kind === "give" || e.kind === "add") {
      tree = e.tree;
    }
    if (!built && e.kind !== "own" && e.kind !== "give" && e.kind !== "skip") {
      check(tree, "채우기가 끝난 뒤");
      built = true;
    }
    if (e.kind === "delta") {
      arr[e.i] = e.v;
      pending = addChain(e.i + 1, A.length).length;
    }
    if (e.kind === "add") {
      pending--;
      if (pending === 0) check(tree, "갱신이 끝난 뒤");
    }
  }
  if (!built && tree.length > 0) check(tree, "채우기가 끝난 뒤");
  return { events, result: got };
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

type Branch = "①" | "②" | "③" | "④" | "⑤" | "⑥";

export interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 무엇을 하는 걸음인가 — 표와 설명이 이 이름으로 부른다. */
  readonly op: string;
  readonly branch: readonly Branch[];
  /** 이 걸음이 끝난 뒤의 논리 배열 `arr`. */
  readonly arr: readonly number[];
  readonly range: readonly [number, number] | null;
  readonly readArr: readonly number[];
  readonly writeArr: readonly number[];
  /** 이 걸음이 끝난 뒤의 트리 배열(칸 0 포함). 아직 안 쓴 칸은 `null`. */
  readonly tree: readonly (number | null)[];
  readonly readTree: readonly number[];
  readonly writeTree: readonly number[];
  /** 이 걸음이 이어 붙이거나 넘겨받은 칸 — 칸 번호. */
  readonly pieces: readonly number[];
  readonly answers: readonly (number | null)[];
  readonly writeAnswer: readonly number[];
  readonly calc: { readonly expr: string; readonly result: string };
  readonly vars: string | null;
}

/**
 * 전개의 걸음. 채우기의 첫 바퀴가 한 걸음, 둘째 바퀴의 넘기기가 한 번에 한 걸음, 질의는 `prefix` 호출
 * 하나에 한 걸음(두 번째 호출 걸음이 답을 쓴다), 갱신은 변화량 만들기 한 걸음과 고친 칸마다 한 걸음이다.
 */
export function walkSteps(
  A: readonly number[] = WALK,
  ops: readonly FenwickOp[] = WALK_OPS,
): Step[] {
  const t = trace(A, ops);
  const N = A.length;
  const arr = [...A];
  let tree: (number | null)[] = [0, ...new Array<null>(N).fill(null)];
  const qn = ops.filter((o) => o.type === "query").length;
  const answers: (number | null)[] = new Array<null>(qn).fill(null);
  const steps: Step[] = [];
  const push = (s: Omit<Step, "id" | "arr" | "tree" | "answers">) =>
    steps.push({
      id: `T${steps.length + 1}`,
      arr: [...arr],
      tree: [...tree],
      answers: [...answers],
      ...s,
    });

  const ev = [...t.events];
  let answered = 0;
  let delta = 0;
  let updIndex = 0;
  while (ev.length > 0) {
    const e = ev.shift() as Event;
    if (e.kind === "own") {
      tree = [...e.tree];
      push({
        title: "자기 몫 채우기 · ③",
        detail: `첫 바퀴가 칸 1 부터 칸 ${N} 까지 tree[k] 에 arr[k−1] 하나씩만 넣습니다. 칸 0 은 비워 둡니다. 아직 길이가 2 이상인 칸은 맡는 구간 전체의 합이 아닙니다.`,
        op: "채우기",
        branch: ["③"],
        range: null,
        readArr: range(0, N - 1),
        writeArr: [],
        readTree: [],
        writeTree: range(1, N),
        pieces: [],
        writeAnswer: [],
        calc: {
          expr: `tree[k] = arr[k − 1] (k = 1…${N})`,
          result: values(e.tree.slice(1)),
        },
        vars: null,
      });
    } else if (e.kind === "skip") {
      // 받을 칸이 배열 밖이라 아무것도 쓰지 않는다 — 걸음이 아니다. 표는 이 기록을 따로 읽는다.
    } else if (e.kind === "give") {
      const before = tree[e.j] as number;
      tree = [...e.tree];
      const [a, b] = coverOf(e.j);
      push({
        title: `칸 ${e.i} → 칸 ${e.j} · ④`,
        detail: `칸 ${e.i} 의 위 칸은 ${e.i} + ${lowbit(e.i)} = ${e.j} 입니다. 칸 ${e.i} 의 값 ${e.tree[e.i]}${을를(e.tree[e.i] as number)} 칸 ${e.j} 에 더하면 칸 ${e.j}${이가(e.j)} ${e.tree[e.j]}${이가(e.tree[e.j] as number)} 되어, 맡는 구간 ${span(a, b)} 에 칸 ${e.i} 의 몫이 들어옵니다.`,
        op: "채우기",
        branch: ["④"],
        range: [a, b],
        readArr: [],
        writeArr: [],
        readTree: [e.i],
        writeTree: [e.j],
        pieces: [e.i],
        writeAnswer: [],
        calc: {
          expr: `tree[${e.j}] + tree[${e.i}] = ${before} + ${e.tree[e.i]}`,
          result: String(e.tree[e.j]),
        },
        vars: null,
      });
    } else if (e.kind === "prefix") {
      const reads: { k: number; value: number; sum: number }[] = [];
      while (ev[0]?.kind === "read") {
        const r = ev.shift() as Extract<Event, { kind: "read" }>;
        reads.push(r);
      }
      const q = ops.filter((o) => o.type === "query")[answered] as Extract<
        FenwickOp,
        { type: "query" }
      >;
      const total = reads.at(-1)?.sum ?? 0;
      const expr =
        reads.length === 0
          ? `prefix(${e.r}) = 0`
          : reads.length === 1
            ? `tree[${reads[0]?.k}]`
            : `${reads.map((x) => `tree[${x.k}]`).join(" + ")} = ${reads.map((x) => x.value).join(" + ")}`;
      const cells = `칸 ${reads.map((x) => x.k).join(" · 칸 ")}${을를(reads.at(-1)?.k ?? 0)}`;
      const covers = reads.map((x) => span(...coverOf(x.k))).join(" · ");
      const isRight = e.r === q.r + 1 && ev[0]?.kind === "prefix";
      if (isRight) {
        push({
          title: `prefix(${e.r}) · ②`,
          detail:
            reads.length === 0
              ? `질의 ${span(q.l, q.r)} 의 오른쪽 호출 prefix(${e.r}) 에서는 루프가 한 번도 실행되지 않아 0 입니다.`
              : `질의 ${span(q.l, q.r)} 의 오른쪽 호출입니다. ${cells} 읽습니다. 맡는 구간은 ${covers} 이고, 이어 붙이면 앞 ${e.r} 개 ${span(0, e.r - 1)} 입니다. 합은 ${total} 입니다.`,
          op: `질의 ${span(q.l, q.r)}`,
          branch: ["②"],
          range: [q.l, q.r],
          readArr: [],
          writeArr: [],
          readTree: reads.map((x) => x.k),
          writeTree: [],
          pieces: reads.map((x) => x.k),
          writeAnswer: [],
          calc: { expr, result: String(total) },
          vars: `prefix(${e.r}) = ${total}`,
        });
      } else {
        const ans = ev.shift() as Extract<Event, { kind: "answer" }>;
        const right = sumOf(arr, 0, q.r);
        answers[answered] = ans.value;
        push({
          title: `prefix(${e.r}) · ⑥`,
          detail:
            reads.length === 0
              ? `왼쪽 호출 prefix(${e.r}) 에서는 루프가 한 번도 실행되지 않아 0 입니다. 답 ${right} − 0 = ${ans.value}${을를(ans.value)} 답 목록 칸 ${answered} 에 씁니다.`
              : `왼쪽 호출입니다. ${cells} 읽습니다. 맡는 구간은 ${covers} 이고, 앞 ${e.r} 개의 합은 ${total} 입니다. 답 ${right} − ${total} = ${ans.value}${을를(ans.value)} 답 목록 칸 ${answered} 에 씁니다.`,
          op: `질의 ${span(q.l, q.r)}`,
          branch: reads.length === 0 ? ["⑥"] : ["②", "⑥"],
          range: [q.l, q.r],
          readArr: [],
          writeArr: [],
          readTree: reads.map((x) => x.k),
          writeTree: [],
          pieces: reads.map((x) => x.k),
          writeAnswer: [answered],
          calc: {
            expr: `prefix(${q.r + 1}) − prefix(${q.l}) = ${right} − ${total}`,
            result: String(ans.value),
          },
          vars: null,
        });
        answered++;
      }
    } else if (e.kind === "delta") {
      arr[e.i] = e.v;
      delta = e.delta;
      updIndex = e.i;
      push({
        title: `변화량 만들기 · ⑤`,
        detail: `갱신 i=${e.i} v=${e.v} 입니다. 옛 값 arr[${e.i}] = ${e.old} 에서 새 값까지의 차이 ${e.v} − ${e.old} = ${e.delta}${을를(e.delta)} 만들고 arr[${e.i}]${을를(e.i)} ${e.v}${으로(e.v)} 고칩니다. 트리는 아직 그대로입니다.`,
        op: `갱신 i=${e.i} v=${e.v}`,
        branch: ["⑤"],
        range: [e.i, e.i],
        readArr: [e.i],
        writeArr: [e.i],
        readTree: [],
        writeTree: [],
        pieces: [],
        writeAnswer: [],
        calc: { expr: `${e.v} − ${e.old}`, result: String(e.delta) },
        vars: `delta = ${e.delta}`,
      });
    } else if (e.kind === "add") {
      const before = tree[e.k] as number;
      tree = [...e.tree];
      const next = e.k + lowbit(e.k);
      const i = updIndex;
      push({
        title: `칸 ${e.k} 고치기 · ①`,
        detail: `칸 ${e.k}${이가(e.k)} 맡는 구간 ${span(...coverOf(e.k))} 안에 인덱스 ${i}${이가(i)} 있으므로 변화량 ${delta}${을를(delta)} 더합니다. 다음 칸은 ${e.k} + ${lowbit(e.k)} = ${next} 이고, ${next <= N ? `${N} 이하라 이어 갑니다` : `${N}${을를(N)} 넘어 멈춥니다`}.`,
        op: steps.at(-1)?.op ?? "",
        branch: ["①"],
        range: [i, i],
        readArr: [],
        writeArr: [],
        readTree: [],
        writeTree: [e.k],
        pieces: [e.k],
        writeAnswer: [],
        calc: {
          expr: `tree[${e.k}] + delta = ${before} + ${delta}`,
          result: String(e.tree[e.k]),
        },
        vars: `delta = ${delta}`,
      });
    }
  }
  return steps;
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "arr",
  rangeLabel: "구간",
};

/**
 * 걸음 하나를 배열 무대의 걸음으로. 펜윅 트리의 칸 `k` 는 **인덱스 `k − 1` 아래**에 둔다 — 칸이 맡는
 * 구간의 오른쪽 끝과 같은 열이라, 칸이 어디까지 맡는지가 열로 읽힌다. 칸 0 은 쓰지 않는 칸이라 줄에서
 * 빼고 곁말에 적는다.
 */
export function arrayStep(s: Step): ArrayStep {
  const n = s.arr.length;
  const col = (k: number) => k - 1;
  let tone: "left" | "right" = "left";
  return {
    array: [...s.arr],
    range: s.range === null ? null : [s.range[0], s.range[1]],
    read: [...s.readArr],
    write: [...s.writeArr],
    calc: { ...s.calc },
    vars: s.vars,
    pieces: s.pieces.map((k) => {
      const [a, b] = coverOf(k);
      const piece = {
        label: `칸 ${k}`,
        from: a,
        to: b,
        tone,
        text: span(a, b),
      };
      tone = tone === "left" ? "right" : "left";
      return piece;
    }),
    layers: [
      {
        name: "칸 k",
        values: range(1, n),
        caret: false,
        side: "칸 0 은 비워 둔다",
      },
      {
        name: "tree",
        values: s.tree.slice(1),
        read: s.readTree.map(col),
        write: s.writeTree.map(col),
      },
      { name: "답", values: [...s.answers], write: [...s.writeAnswer] },
    ],
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로
 * 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `fenwickRangeSum-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return {
    walk: walkSteps().map((s) => ({
      title: `${s.id} ${s.title}`,
      text: s.detail,
      ...arrayStep(s),
    })),
  };
}

/* ───────────────── 셈하는 판 — 배열 접근 수(읽기 + 쓰기) ───────────────── */

/**
 * 세는 것은 **배열 접근 수**(배열 칸을 읽거나 쓴 횟수)다. 벽시계는 실행마다 달라 본문의 수치가 실측과
 * 같은지를 정의할 수 없다. 넷 모두 같은 연산 목록을 받아 같은 답을 내야 하고, `fenwickCount` 는 정본과
 * 같은 절차에 셈만 덧붙였다.
 */
export interface Counted {
  readonly out: number[];
  readonly build: number;
  readonly query: number;
  readonly update: number;
  readonly cells: number;
}

export const total = (c: Counted): number => c.build + c.query + c.update;

/** 질의마다 구간을 직접 더한다. 갱신은 칸 하나를 쓴다. */
export function scanEach(
  A: readonly number[],
  ops: readonly FenwickOp[],
): Counted {
  const a = [...A];
  const out: number[] = [];
  let query = 0;
  let update = 0;
  for (const op of ops) {
    if (op.type === "update") {
      update++; // a[i] 쓰기
      a[op.i] = op.v;
      continue;
    }
    let s = 0;
    for (let k = op.l; k <= op.r; k++) {
      query++; // a[k] 읽기
      s += a[k] as number;
    }
    out.push(s);
  }
  return { out, build: 0, query, update, cells: 0 };
}

/** 누적합 표 — `P[k]` 에 앞 `k` 개의 합을 담는다. 질의는 칸 둘, 갱신은 뒤쪽 칸 전부다. */
export function prefixTable(
  A: readonly number[],
  ops: readonly FenwickOp[],
): Counted {
  const N = A.length;
  const a = [...A];
  const P = new Array<number>(N + 1).fill(0);
  let build = 0;
  for (let i = 0; i < N; i++) {
    build += 3; // P[i] 읽기 · a[i] 읽기 · P[i+1] 쓰기
    P[i + 1] = (P[i] as number) + (a[i] as number);
  }
  let query = 0;
  let update = 0;
  const out: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      update += 2; // a[i] 읽기 · a[i] 쓰기
      const d = op.v - (a[op.i] as number);
      a[op.i] = op.v;
      for (let k = op.i + 1; k <= N; k++) {
        update += 2; // P[k] 읽기 · P[k] 쓰기
        P[k] = (P[k] as number) + d;
      }
      continue;
    }
    query += 2; // P[r+1] 읽기 · P[l] 읽기
    out.push((P[op.r + 1] as number) - (P[op.l] as number));
  }
  return { out, build, query, update, cells: N + 1 };
}

/** 고정 길이 묶음 — `B` 칸씩 끊어 묶음마다 합 하나를 둔다. 갱신은 칸 하나와 묶음 합 하나다. */
export function blockTable(
  A: readonly number[],
  ops: readonly FenwickOp[],
  B: number,
): Counted {
  const N = A.length;
  const a = [...A];
  const nb = Math.ceil(N / B);
  const sums = new Array<number>(nb).fill(0);
  let build = 0;
  for (let i = 0; i < N; i++) {
    build++; // a[i] 읽기 — 묶음 합은 지역 변수에 모았다가 한 번 쓴다
    const j = Math.floor(i / B);
    sums[j] = (sums[j] as number) + (a[i] as number);
  }
  build += nb; // 묶음 합 쓰기
  let query = 0;
  let update = 0;
  const out: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      update += 4; // a[i] 읽기·쓰기 · 묶음 합 읽기·쓰기
      const d = op.v - (a[op.i] as number);
      a[op.i] = op.v;
      const j = Math.floor(op.i / B);
      sums[j] = (sums[j] as number) + d;
      continue;
    }
    let s = 0;
    let k = op.l;
    while (k <= op.r) {
      query++; // 묶음 합 또는 a[k] 읽기
      if (k % B === 0 && k + B - 1 <= op.r) {
        s += sums[k / B] as number;
        k += B;
      } else {
        s += a[k] as number;
        k++;
      }
    }
    out.push(s);
  }
  return { out, build, query, update, cells: nb };
}

/** 펜윅 트리 — 정본과 같은 절차에 접근 셈만 덧붙였다. 큰 입력에서도 트리를 베끼지 않는다. */
export function fenwickCount(
  A: readonly number[],
  ops: readonly FenwickOp[],
): Counted {
  const N = A.length;
  const a = [...A];
  const tree = new Array<number>(N + 1).fill(0);
  let build = 0;
  for (let i = 1; i <= N; i++) {
    build += 2; // a[i-1] 읽기 · tree[i] 쓰기
    tree[i] = a[i - 1] as number;
  }
  for (let i = 1; i <= N; i++) {
    const j = i + lowbit(i);
    if (j > N) continue;
    build += 3; // tree[i] 읽기 · tree[j] 읽기 · tree[j] 쓰기
    tree[j] = (tree[j] as number) + (tree[i] as number);
  }
  let query = 0;
  let update = 0;
  const out: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      update += 2; // a[i] 읽기 · a[i] 쓰기
      const d = op.v - (a[op.i] as number);
      a[op.i] = op.v;
      for (let k = op.i + 1; k <= N; k += lowbit(k)) {
        update += 2; // tree[k] 읽기 · tree[k] 쓰기
        tree[k] = (tree[k] as number) + d;
      }
      continue;
    }
    let s = 0;
    for (let k = op.r + 1; k > 0; k -= lowbit(k)) {
      query++; // tree[k] 읽기
      s += tree[k] as number;
    }
    for (let k = op.l; k > 0; k -= lowbit(k)) {
      query++; // tree[k] 읽기
      s -= tree[k] as number;
    }
    out.push(s);
  }
  return { out, build, query, update, cells: N + 1 };
}

/** 넷 이상의 셈이 같은 답을 냈는지 — 다르면 대조가 성립하지 않는다. */
export function sameAnswers(...runs: Counted[]): void {
  const first = JSON.stringify(runs[0]?.out ?? []);
  for (const r of runs) {
    if (JSON.stringify(r.out) !== first) {
      throw new Error("방식마다 답이 다르다 — 대조가 성립하지 않는다");
    }
  }
}

/* ───────────────── 작업 목록 ───────────────── */

/** 갱신 `k` 번째 — `A[(59k) mod N]` 를 `((31k) mod 1000) − 500` 으로 덮어쓴다. */
export const updateAt = (k: number, N: number): FenwickOp => ({
  type: "update",
  i: (k * 59) % N,
  v: ((k * 31) % 1000) - 500,
});

/**
 * 과제 규모의 작업 목록 — 연산 `Q` 개를 갱신과 질의로 번갈아 두고(갱신이 먼저), 질의는 전부 양 끝을 한
 * 칸씩 안으로 당긴 `[1, N−2]` 다. 거의 배열 전체를 읽는 모양이라 직접 더하기에는 최악에 가깝다.
 */
export function scaleOps(N: number, Q: number): FenwickOp[] {
  return Array.from({ length: Q }, (_, t) =>
    t % 2 === 0 ? updateAt(t / 2, N) : { type: "query", l: 1, r: N - 2 },
  );
}

/** 규모별 입력 배열 — `A[i] = (41i) mod 97`. 값 자체는 접근 수에 영향을 주지 않는다. */
export const bigArray = (N: number): number[] =>
  Array.from({ length: N }, (_, i) => (i * 41) % 97);

/** 과제 규모. */
export const N_MAX = 100_000;

/** 직접 더하기의 접근 수 — 식. 질의 하나가 `N − 2` 칸, 갱신 하나가 1 번이다. */
export const scanFormula = (N: number, Q: number): number =>
  Math.floor(Q / 2) * (N - 2) + Math.ceil(Q / 2);

/** 누적합 표의 접근 수 — 식. 만들기 `3N`, 질의 2 번, 갱신 `2 + 2(N − i)` 번. */
export function prefixFormula(
  N: number,
  Q: number,
): {
  build: number;
  query: number;
  update: number;
} {
  let update = 0;
  for (let k = 0; k < Math.ceil(Q / 2); k++) {
    const op = updateAt(k, N) as Extract<FenwickOp, { type: "update" }>;
    update += 2 + 2 * (N - op.i);
  }
  return { build: 3 * N, query: 2 * Math.floor(Q / 2), update };
}

/** 과제 규모의 제곱근 분할 — 고정 길이 묶음의 크기를 `⌊√N⌋` 으로 둔다. */
export const SCALE_B = Math.floor(Math.sqrt(N_MAX));

/** 과제 규모 한 벌 — 「아이디어를 떠올리는 과정」의 규모 표와 사다리 그림이 같은 값을 쓴다. */
export function scaleNumbers() {
  const A = bigArray(N_MAX);
  const ops = scaleOps(N_MAX, N_MAX);
  const block = blockTable(A, ops, SCALE_B);
  const fen = fenwickCount(A, ops);
  sameAnswers(block, fen);
  const scan = scanFormula(N_MAX, N_MAX);
  const pre = prefixFormula(N_MAX, N_MAX);
  return {
    scan,
    pre,
    preTotal: pre.build + pre.query + pre.update,
    block,
    fen,
  };
}

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

function approaches(): Approach[] {
  const n = scaleNumbers();
  return [
    {
      name: "질의마다 직접 더하기",
      idea: "배열을 그대로 들고, 질의가 오면 구간을 왼쪽 끝부터 오른쪽 끝까지 더한다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        { label: "갱신", value: "칸 하나를 쓴다", ok: true },
        {
          label: "시간",
          value: `배열 접근 ${num(n.scan)} 번 · ${seconds(n.scan)}`,
          ok: false,
        },
      ],
      lesson:
        "질의 하나가 구간 길이만큼 읽는다 — 앞부분의 합을 미리 적어 두면 어떨까",
    },
    {
      name: "누적합 표",
      idea: "칸 k 에 앞 k 개의 합을 적어 두고, 질의는 두 칸의 차로 답한다",
      verdict: "drop",
      checks: [
        { label: "질의", value: "칸 두 개", ok: true },
        {
          label: "시간",
          value: `갱신이 뒤쪽 칸을 전부 고친다 · 합 ${num(n.preTotal)} 번 · ${seconds(n.preTotal)}`,
          ok: false,
        },
      ],
      lesson:
        "칸 하나가 넓은 구간을 맡을수록 갱신이 그 칸을 자주 고친다 — 짧게 끊어 적으면 어떨까",
    },
    {
      name: `제곱근 분할 B=${SCALE_B}`,
      idea: "배열을 B = ⌊√N⌋ 칸씩 끊어 묶음마다 합을 적고, 질의는 온전한 묶음과 양 끝 칸을 읽는다",
      verdict: "drop",
      checks: [
        { label: "갱신", value: "배열 접근 4 번", ok: true },
        {
          label: "시간",
          value: `배열 접근 ${num(total(n.block))} 번 · ${seconds(total(n.block))}`,
          ok: true,
        },
        {
          label: "질의",
          value:
            "남는 칸 2(B − 1) 과 묶음 N / B 를 함께 읽는다 — 어느 B 에서도 √N 규모",
          ok: false,
        },
      ],
      lesson: "칸이 맡는 길이가 하나뿐이다 — 칸마다 길이를 다르게 두면 어떨까",
    },
    {
      name: "최하위 1 비트 길이로 나눠 담기",
      idea: "칸 k 가 오른쪽 끝이 k − 1 이고 길이가 k 의 최하위 1 비트인 구간의 합을 적는다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `배열 접근 ${num(total(n.fen))} 번 · ${seconds(total(n.fen))}`,
          ok: true,
        },
        {
          label: "메모리",
          value: `트리 배열 ${num(n.fen.cells)} 칸`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 비트 그림 ───────────────────────── */

/** 비트 그림의 폭 — 아래 여덟 자리(`lowestSetBit` 편과 같은 약속). */
const W = 8;
const bitAt = (v: number, j: number): number => (v >>> j) & 1;
/** 높은 자리부터의 비트 — 정적 그림의 칸 `c` 가 자리 `W − 1 − c` 다. */
const bitsHigh = (v: number): number[] =>
  Array.from({ length: W }, (_, c) => bitAt(v, W - 1 - c));
/** 자리 `j` 가 정적 그림에서 서는 칸. */
const colOf = (j: number): number => W - 1 - j;
/** 자리 번호를 높은 것부터 적는 인덱스 줄. */
const HIGH_INDEX: StageRow = {
  kind: "index",
  label: "자리",
  labels: Array.from({ length: W }, (_, c) => W - 1 - c),
};
/** 최하위 1 비트의 자리 번호. */
const lowPos = (v: number): number => Math.log2(lowbit(v));

/** 칸 12 를 읽는 그림에 쓰는 칸. */
export const READ_CELL = 12;
/** 앞부분 합의 이동을 보이는 `r`. */
export const ERASE_R = 7;

/* ───────────────────────── 그림 ───────────────────────── */

/** 「불변식」 그림이 멈춰 세우는 걸음 — 갱신이 칸 하나만 고친 순간. */
export const INVARIANT_MOMENT = "T8";

/** 칸마다 한 줄 — 맡는 자리에만 값을 놓는다. */
function bars(A: readonly number[], ks: readonly number[]): LayerBar[] {
  return ks.map((k) => {
    const [a, b] = coverOf(k);
    return {
      label: `칸 ${k}`,
      from: a,
      to: b,
      note: `최하위 1 비트 ${lowbit(k)} · ${span(a, b)} 의 합 ${coverSum(A, k)}`,
    };
  });
}

/** 트리 배열 줄 — 칸 `k` 를 인덱스 `k − 1` 아래에 둔다(걸음 재생 패널과 같다). */
function treeRow(
  label: string,
  tree: readonly (number | null)[],
  states: Partial<Record<number, CellState>> = {},
  side?: string,
): StageRow {
  return {
    kind: "cells",
    label,
    values: tree.slice(1),
    states,
    ...(side === undefined ? {} : { side }),
  };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-cells": () => (
    <LayerBars
      title={`A = [${WALK.join(", ")}] 의 펜윅 트리 — 칸마다 맡는 자리`}
      values={[...WALK]}
      indexLabel="인덱스"
      groups={[bars(WALK, range(1, WALK.length))]}
    />
  ),
  "concept-prefix": () => {
    const r = WALK.length;
    const chain = prefixChain(r);
    let tone: "left" | "right" = "left";
    const pieces = chain.map((k) => {
      const [a, b] = coverOf(k);
      const piece = {
        from: a,
        to: b,
        tone,
        note: `칸 ${k} ${span(a, b)} = ${coverSum(WALK, k)}`,
      };
      tone = tone === "left" ? "right" : "left";
      return piece;
    });
    const got = chain.reduce((s, k) => s + coverSum(WALK, k), 0);
    return (
      <RangeCover
        title={`앞 ${r} 개의 합 = 칸 ${chain.join(" + 칸 ")} = ${got}`}
        indexLabel="인덱스"
        row={{ label: "A 의 값", values: [...WALK] }}
        ranges={[
          {
            from: 0,
            to: r - 1,
            tone: "query",
            note: `앞 ${r} 개 ${span(0, r - 1)} = ${got}`,
          },
          ...pieces,
        ]}
      />
    );
  },
  "concept-update": () => {
    const op = WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>;
    const before = treeByDef(WALK);
    const after = [...WALK];
    after[op.i] = op.v;
    const tAfter = treeByDef(after);
    const touched = addChain(op.i + 1, WALK.length);
    const focus: Partial<Record<number, CellState>> = {};
    for (const k of touched) focus[k - 1] = "focus";
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스", focus: [op.i] },
      {
        kind: "cells",
        label: "A 의 값",
        values: after,
        states: { [op.i]: "focus" },
        side: `A[${op.i}] 를 ${WALK[op.i]} 에서 ${op.v}${으로(op.v)}`,
      },
      ...touched.map(
        (k): StageRow => ({
          kind: "bracket",
          label: `칸 ${k}`,
          from: coverOf(k)[0],
          to: coverOf(k)[1],
          tone: k === touched[0] ? "left" : "right",
          text: span(...coverOf(k)),
          side: `인덱스 ${op.i}${을를(op.i)} 품는다`,
        }),
      ),
      { kind: "cells", label: "칸 k", values: range(1, WALK.length) },
      treeRow("tree 전", before),
      treeRow(
        "tree 뒤",
        tAfter,
        focus,
        `바뀐 칸 ${touched.length} 개 · 나머지 ${WALK.length - touched.length} 개는 그대로`,
      ),
    ];
    return (
      <CellStage
        title={`A[${op.i}] 를 ${op.v} 로 고치면 — 인덱스 ${op.i}${을를(op.i)} 품는 칸만 바뀐다`}
        rows={rows}
        columns={WALK.length}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title={`시도한 방법 ${steps.length} 가지 — 하나가 남았다`}
        constraint={`N = Q = ${num(N_MAX)} · 갱신과 질의 절반씩 · 시간 1 초 · 메모리 256 MB(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-bars": () => {
    const N = SHAPE.length;
    const lengths = [...new Set(range(1, N).map(lowbit))].sort((a, b) => a - b);
    return (
      <LayerBars
        title={`길이 ${N} 배열의 펜윅 트리 — 최하위 1 비트가 같은 칸끼리 한 묶음`}
        values={[...SHAPE]}
        indexLabel="인덱스"
        groups={lengths.map((len) =>
          bars(
            SHAPE,
            range(1, N).filter((k) => lowbit(k) === len),
          ),
        )}
      />
    );
  },
  "build-bits": () => {
    const k = READ_CELL;
    const low = lowbit(k);
    const p = lowPos(k);
    const ones = range(0, W - 1)
      .filter((j) => bitAt(k, j) === 1)
      .reverse();
    const rows: StageRow[] = [
      HIGH_INDEX,
      {
        kind: "cells",
        label: `k = ${k}`,
        values: bitsHigh(k),
        states: { [colOf(p)]: "read" },
        side: `1 인 자리 ${ones.join(" · ")}`,
      },
      {
        kind: "cells",
        label: `-k = ${-k}`,
        values: bitsHigh(-k),
        states: { [colOf(p)]: "read" },
        side: "k 를 뒤집고 1 을 더한 값",
      },
      {
        kind: "cells",
        label: `k & -k = ${low}`,
        values: bitsHigh(low),
        states: { [colOf(p)]: "focus" },
        side: `최하위 1 비트 자리 ${p} — 길이 ${low}`,
      },
    ];
    return (
      <CellStage
        title={`칸 ${k} 의 최하위 1 비트 — 맡는 구간의 길이 ${low}`}
        rows={rows}
        columns={W}
      />
    );
  },
  "build-erase": () => {
    const chain = [...prefixChain(ERASE_R), 0];
    const rows: StageRow[] = [HIGH_INDEX];
    for (const [n, k] of chain.entries()) {
      if (k === 0) {
        rows.push({
          kind: "cells",
          label: "k = 0",
          values: bitsHigh(0),
          side: "1 비트가 없다 — 멈춘다",
        });
        continue;
      }
      const p = lowPos(k);
      const next = chain[n + 1] as number;
      const [a, b] = coverOf(k);
      rows.push({
        kind: "cells",
        label: `k = ${k}`,
        values: bitsHigh(k),
        states: { [colOf(p)]: "focus" },
        side: `칸 ${k}${을를(k)} 읽는다(맡는 구간 ${span(a, b)}) · 자리 ${p} 의 1 을 지우면 ${next}`,
      });
    }
    return (
      <CellStage
        title={`prefix(${ERASE_R}) — 최하위 1 비트를 하나씩 지우며 칸 ${prefixChain(ERASE_R).join(" · ")} 을 읽는다`}
        rows={rows}
        columns={W}
      />
    );
  },
  "build-climb": () => {
    const op = WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>;
    const N = WALK.length;
    const start = op.i + 1;
    const chain = addChain(start, N);
    const last = chain.at(-1) as number;
    const ks = [...chain, last + lowbit(last)];
    const rows: StageRow[] = [HIGH_INDEX];
    for (const k of ks) {
      const p = lowPos(k);
      if (k > N) {
        rows.push({
          kind: "cells",
          label: `k = ${k}`,
          values: bitsHigh(k),
          states: { [colOf(p)]: "out" },
          side: `${N}${을를(N)} 넘는다 — 멈춘다`,
        });
        continue;
      }
      const [a, b] = coverOf(k);
      rows.push({
        kind: "cells",
        label: `k = ${k}`,
        values: bitsHigh(k),
        states: { [colOf(p)]: "focus" },
        side: `칸 ${k}${을를(k)} 고친다(맡는 구간 ${span(a, b)}) · 자리 ${p} 에 1 을 더하면 ${k + lowbit(k)}`,
      });
    }
    return (
      <CellStage
        title={`add(${start}, …) — 최하위 1 비트에 1 을 더하며 칸 ${chain.join(" · ")} 을 고친다`}
        rows={rows}
        columns={W}
      />
    );
  },
  "walk-run": () => {
    const steps = walkSteps();
    const frames: StageFrame[] = steps.map((s) => ({
      id: s.id,
      text: `${s.title} — ${s.calc.expr} = ${s.calc.result}`,
      rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
    }));
    return (
      <CellStageFilm
        title={`fenwickRangeSum([${WALK.join(", ")}], 연산 ${WALK_OPS.length} 개) — ${steps[0]?.id}~${steps.at(-1)?.id}`}
        columns={arrayColumns(arrayStep(steps[0] as Step))}
        frames={frames}
      />
    );
  },
  "invariant-moment": () => {
    const steps = walkSteps();
    const s = steps.find((x) => x.id === INVARIANT_MOMENT) as Step;
    const tree = s.tree as number[];
    const def = treeByDef(s.arr);
    const bad = range(1, s.arr.length).filter((k) => tree[k] !== def[k]);
    const states: Partial<Record<number, CellState>> = {};
    for (const k of bad) states[k - 1] = "overlap";
    for (const k of s.writeTree) states[k - 1] = "focus";
    const rows: StageRow[] = [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "arr",
        values: [...s.arr],
        states: { [s.range?.[0] ?? 0]: "read" },
      },
      { kind: "cells", label: "칸 k", values: range(1, s.arr.length) },
      treeRow("tree", tree, states, `정의와 어긋난 칸 ${bad.join(" · ")}`),
      treeRow("정의", def, {}, "칸이 맡는 구간의 합"),
    ];
    return (
      <CellStage
        title={`${s.id} 직후 — 칸 ${s.writeTree.join(" · ")} 만 고쳐졌고 칸 ${bad.join(" · ")} 은 옛 값`}
        rows={rows}
        columns={s.arr.length}
      />
    );
  },
};
