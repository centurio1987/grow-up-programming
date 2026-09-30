/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.md
 *
 * **이 편의 정본은 실제로 파일을 읽고 적는다.** 그래서 여기 있는 실행은 전부 임시 디렉터리에
 * 파일을 만들어 정본을 그대로 부른 것이고, 그 결과를 모듈 최상위에서 미리 받아 둔다
 * (`PROOFS` 의 함수는 동기라 안에서 `await` 을 할 수 없다).
 *
 * ## 기록 사본
 *
 * 걸음마다의 상태(런 · 최소 힙 · 출력)는 **정본 소스에 기록 줄만 끼운 사본**이 낸다(`기록판`). 정본 원문을
 * 읽어 네 줄 뒤에 기록 한 줄씩을 붙이고 두 클래스를 내보내게 바꾼 것이라, 절차는 정본과 글자 그대로 같다.
 * `loadMutant` 를 쓰지 않는 까닭은 하나다 — `check-proof` 의 중화 실행에서 `loadMutant` 는 정본을
 * 그대로 돌려주므로 기록이 비고, 그러면 기록에 기대는 블록이 중화 실행에서 모두 깨진다. 기록판의 답은
 * 매번 정본의 답과 맞대고, 다르면 던진다.
 *
 * ## 세는 사본
 *
 * 정본은 계수를 내보내지 않으므로 ① 정수 입출력과 메모리에 든 정수를 세는 사본(`-guide.alt.ts` 의
 * `한번에_합치기`) ② 런의 맨 앞을 모두 비교해 최솟값을 고르는 사본(`모두_비교`) ③ 파일 전체를 바퀴마다
 * 다시 읽는 반복 선택 사본(`반복_선택`) ④ 규모가 큰 입력에서 값만 세는 가벼운 판(`가벼운_셈`)이 그 몫을
 * 진다. **넷 다 답을 정렬 결과와 대조한 뒤에만 계수를 쓴다** — 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 과제의 값이다. 가벼운 판은 기록을 남기지 않고 수만 센다 — 정수 천만 개에서 걸음마다
 * 상태를 베끼면 메모리가 모자란다. 가벼운 판이 세는 사본과 같은 수를 내는지는 작은 규모 셋에서 맞대 본다.
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** 중화 여부는 변이 모듈의 함수가
 * 정본과 **같은 객체인가**로 알아낸다.
 */

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 이가 } from "../../../../tools/josa.ts";
import {
  대조_k,
  대조_M,
  대조_N,
  런수,
  메모리_칸,
  생성식,
  여러바퀴_합치기,
  한번에_합치기,
} from "./externalMergeSort-guide.alt.ts";
import { externalMergeSort } from "./externalMergeSort-guide.ref.ts";

const REF = new URL("./externalMergeSort-guide.ref.ts", import.meta.url)
  .pathname;

type Ref = {
  externalMergeSort: (
    inputPath: string,
    outputPath: string,
    memoryLimit: number,
  ) => Promise<string>;
};

/* ────────────────────────── 표 그리기 ────────────────────────── */

export const comma = (n: number): string => n.toLocaleString("en-US");

export const 나열 = (xs: readonly number[]): string =>
  xs.length === 0 ? "비어 있음" : xs.join(" ");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 한글을 두 칸으로 세는 폭. 등폭 펜스의 열을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 줄 — 열 폭을 값에서 잰다. 마지막 칸은 채우지 않는다. */
function columns(rows: string[][], gap = "   "): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows.map((r) =>
    r
      .map((cell, c) => (c === r.length - 1 ? cell : pad(cell, w[c] ?? 0)))
      .join(gap)
      .replace(/\s+$/, ""),
  );
}

/** 배수를 소수 둘째 자리까지. */
const 배수 = (a: number, b: number): string =>
  `${(a / b).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 배`;

/* ────────────────────── 정본을 파일 위에서 부른다 ────────────────────── */

const TMP = mkdtempSync(join(tmpdir(), "ems-proof-"));
let 일련 = 0;

/** 정본이나 변이를 실제 파일에 대고 실행해 출력 파일의 내용을 정수 배열로 돌려준다. */
async function 실행(
  impl: Ref,
  values: readonly number[],
  M: number,
  미리?: string,
): Promise<{ 답: number[]; 안덮인_바이트: number }> {
  const at = 일련++;
  const input = join(TMP, `case${at}.in`);
  const output = join(TMP, `case${at}.out`);
  await Bun.write(input, `${values.join("\n")}\n`);
  const 미리_바이트 = 미리 === undefined ? 0 : 미리.length;
  if (미리 !== undefined) await Bun.write(output, 미리);
  await impl.externalMergeSort(input, output, M);
  const text = await Bun.file(output).text();
  // 새로 적을 내용이 이미 있던 파일보다 짧으면 그 차이만큼이 뒤에 남는다.
  const 새내용 = `${[...values].sort((a, b) => a - b).join("\n")}\n`.length;
  return {
    답: text
      .split("\n")
      .filter((s) => s.length > 0)
      .map(Number),
    안덮인_바이트: Math.max(0, 미리_바이트 - 새내용),
  };
}

const 정렬 = (xs: readonly number[]): number[] => [...xs].sort((a, b) => a - b);

/* ────────────────────────── 기록 사본 ────────────────────────── */

/** 최소 힙에 담는 항목 — 정본의 `Entry` 와 같다. */
export interface Entry {
  readonly value: number;
  readonly run: number;
}

/** 기록판이 남기는 사건. */
export type 사건 =
  | {
      readonly kind: "run";
      readonly values: number[];
      readonly full: boolean;
      readonly tail: boolean;
    }
  | {
      readonly kind: "init";
      readonly run: number;
      readonly value: number;
      readonly heap: Entry[];
    }
  | {
      readonly kind: "merge";
      readonly value: number;
      readonly run: number;
      readonly next: number | null;
      readonly heap: Entry[];
    };

const 스냅샷 = "(heap as any).items.map((e: any) => ({ ...e }))";

/** 정본 원문에 기록 줄을 끼운 사본의 소스. 맞출 줄이 정확히 하나가 아니면 던진다. */
function 기록판_소스(): string {
  const 바꿀것: [string, string][] = [
    ["class LineReader {", "export class LineReader {"],
    ["class MinHeap {", "export class MinHeap {"],
    [
      "      const block = await this.reader.read();",
      "      const block = await this.reader.read();\n      (globalThis as any).__emsBlocks?.push(block.done ? 0 : block.value.length);",
    ],
    [
      "      runPaths.push(path);",
      '      runPaths.push(path);\n      (globalThis as any).__emsRec?.push({ kind: "run", values: [...chunk], full, tail });',
    ],
    [
      "    if (value !== null) heap.push({ value, run });",
      `    if (value !== null) heap.push({ value, run });\n    if (value !== null) (globalThis as any).__emsRec?.push({ kind: "init", run, value, heap: ${스냅샷} });`,
    ],
    [
      "    if (next !== null) heap.push({ value: next, run });",
      `    if (next !== null) heap.push({ value: next, run });\n    (globalThis as any).__emsRec?.push({ kind: "merge", value, run, next, heap: ${스냅샷} });`,
    ],
  ];
  let s = readFileSync(REF, "utf8");
  for (const [a, b] of 바꿀것) {
    const n = s.split(a).length - 1;
    if (n !== 1) {
      throw new Error(`기록 줄을 끼울 자리가 ${n} 곳이다 — 「${a}」`);
    }
    s = s.replace(a, b);
  }
  return s;
}

const 기록판_경로 = join(TMP, "recorded-ref.ts");
writeFileSync(기록판_경로, 기록판_소스(), "utf8");

interface 기록판_모듈 extends Ref {
  LineReader: new (path: string) => { next(): Promise<number | null> };
  MinHeap: new () => {
    readonly size: number;
    push(e: Entry): void;
    pop(): Entry;
  };
}
const 기록판 = (await import(기록판_경로)) as 기록판_모듈;

type 기록통 = { __emsRec?: 사건[]; __emsBlocks?: number[] };
const g = globalThis as unknown as 기록통;

/** 기록판을 파일 위에서 실행해 사건 목록을 받는다. 답은 정본과 맞댄다. */
async function 기록(values: readonly number[], M: number): Promise<사건[]> {
  const 사건들: 사건[] = [];
  g.__emsRec = 사건들;
  const 답 = (await 실행(기록판, values, M)).답;
  g.__emsRec = undefined;
  const 정본답 = (await 실행({ externalMergeSort }, values, M)).답;
  if (나열(답) !== 나열(정본답)) {
    throw new Error("기록판이 정본과 다른 답을 냈다");
  }
  return 사건들;
}

/** 힙 배열을 **꺼낼 차례대로** — 정본의 `MinHeap` 으로 사본을 떠서 비울 때까지 꺼낸다. */
export function 꺼낼차례(heap: readonly Entry[]): Entry[] {
  const h = new 기록판.MinHeap();
  // 올바른 힙 배열을 앞에서부터 차례로 넣으면 한 번도 자리를 바꾸지 않아 같은 배열이 된다.
  for (const e of heap) h.push({ ...e });
  const out: Entry[] = [];
  while (h.size > 0) out.push(h.pop());
  return out;
}

/* ────────────────────────── 전개 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 정수 여덟에 메모리 3 이라 런이 셋 생기고, 여덟이 셋의 배수가 아니라
 * **자투리 갈래가 실제로 실행된다.**
 */
export const WALK = [5, 1, 8, 3, 7, 2, 9, 4];
export const WALK_M = 3;

const WALK_사건 = await 기록(WALK, WALK_M);

/** 전개 입력의 런 — 기록판이 적은 차례대로. */
export const RUNS: number[][] = WALK_사건.flatMap((e) =>
  e.kind === "run" ? [e.values] : [],
);

/** 런 `r` 이 입력에서 차지하는 자리 `[from, to]`. 런 `r` 은 입력의 `r` 번째 `M` 칸을 정렬한 것이다. */
export function 런자리(runs: readonly number[][]): [number, number][] {
  const out: [number, number][] = [];
  let at = 0;
  for (const r of runs) {
    out.push([at, at + r.length - 1]);
    at += r.length;
  }
  return out;
}

/* ────────────────────── 걸음 — 필름 · 패널 · 표가 같이 쓴다 ────────────────────── */

/** 걸음 하나가 끝난 뒤의 상태. */
export interface 걸음 {
  readonly id: string;
  readonly phase: "run" | "merge";
  /** 런 만들기 걸음이면 이번에 적은 런의 번호. */
  readonly runIndex: number | null;
  /** 이번 걸음까지 적은 런. */
  readonly runs: readonly number[][];
  /** 런마다 최소 힙으로 읽어 들인 값의 개수. 합치기 전에는 모두 0. */
  readonly taken: readonly number[];
  /** 걸음이 끝난 뒤 최소 힙 — 꺼낼 차례대로. */
  readonly heap: readonly Entry[];
  /** 이번에 최소 힙에 올린 항목. 첫 값을 올리는 걸음은 런 수만큼이다. */
  readonly pushed: readonly Entry[];
  /** 이번에 출력에 적은 값과 그 값이 나온 런. */
  readonly out: Entry | null;
  /** 걸음이 끝난 뒤 출력 파일. */
  readonly output: readonly number[];
  /** 이번 걸음이 꺼내기 전의 최소 힙(꺼낼 차례). 계산 알약이 쓴다. */
  readonly before: readonly Entry[];
  /** 누적 정수 입출력. */
  readonly 읽은: number;
  readonly 적은: number;
  /** 걸음이 끝난 순간 메모리에 든 정수. */
  readonly 메모리: number;
  /** 런을 적은 걸음의 두 조건. */
  readonly full: boolean | null;
  readonly tail: boolean | null;
  /** 합치기 걸음의 `next`. 합치기 걸음이 아니면 `undefined`. */
  readonly next: number | null | undefined;
  readonly 갈래: string;
}

/** 사건 목록을 걸음으로 묶는다 — T1 시작 · 런마다 한 걸음 · 첫 값 올리기 한 걸음 · 꺼낼 때마다 한 걸음. */
export function 걸음들(values: readonly number[], 사건들: 사건[]): 걸음[] {
  const out: 걸음[] = [];
  const runs: number[][] = [];
  let 읽은 = 0;
  let 적은 = 0;
  let n = 1;
  const id = () => `T${n++}`;
  const 빈걸음 = {
    runIndex: null,
    heap: [],
    pushed: [],
    out: null,
    output: [],
    before: [],
    full: null,
    tail: null,
    next: undefined,
  } as const;
  out.push({
    ...빈걸음,
    id: id(),
    phase: "run",
    runs: [],
    taken: [],
    읽은,
    적은,
    메모리: 0,
    갈래: "—",
  });
  for (const e of 사건들) {
    if (e.kind !== "run") continue;
    runs.push(e.values);
    읽은 += e.values.length;
    적은 += e.values.length;
    out.push({
      ...빈걸음,
      id: id(),
      phase: "run",
      runIndex: runs.length - 1,
      runs: runs.map((r) => [...r]),
      taken: runs.map(() => 0),
      읽은,
      적은,
      메모리: e.values.length,
      full: e.full,
      tail: e.tail,
      갈래: e.full ? "①" : "②",
    });
  }
  const taken = runs.map(() => 0);
  let 첫값수 = 0;
  let 첫힙: Entry[] = [];
  for (const e of 사건들) {
    if (e.kind !== "init") continue;
    taken[e.run] = 1;
    첫값수++;
    첫힙 = e.heap;
  }
  if (첫값수 === 0) return out;
  읽은 += 첫값수;
  let heap = 꺼낼차례(첫힙);
  out.push({
    ...빈걸음,
    id: id(),
    phase: "merge",
    runs: runs.map((r) => [...r]),
    taken: [...taken],
    heap,
    pushed: heap,
    읽은,
    적은,
    메모리: heap.length,
    갈래: "③",
  });
  const output: number[] = [];
  for (const e of 사건들) {
    if (e.kind !== "merge") continue;
    const before = heap;
    output.push(e.value);
    적은++;
    if (e.next !== null) {
      읽은++;
      taken[e.run] = (taken[e.run] ?? 0) + 1;
    }
    heap = 꺼낼차례(e.heap);
    out.push({
      ...빈걸음,
      id: id(),
      phase: "merge",
      runs: runs.map((r) => [...r]),
      taken: [...taken],
      heap,
      pushed: e.next === null ? [] : [{ value: e.next, run: e.run }],
      out: { value: e.value, run: e.run },
      output: [...output],
      before,
      읽은,
      적은,
      메모리: heap.length,
      next: e.next,
      갈래: "④",
    });
  }
  if (나열(output) !== 나열(정렬(values))) {
    throw new Error("걸음이 낸 출력이 정렬 결과와 다르다");
  }
  return out;
}

const WALK_걸음 = 걸음들(WALK, WALK_사건);

/** 전개의 걸음 전부. */
export const walk = (): 걸음[] => WALK_걸음;

const 항목 = (e: Entry): string => `${e.value}(런 ${e.run})`;
const 항목들 = (es: readonly Entry[]): string =>
  es.length === 0 ? "비어 있음" : es.map(항목).join(" ");

/** 런마다 아직 최소 힙으로 안 읽은 값. */
export const 남은값 = (s: 걸음): number[][] =>
  s.runs.map((r, i) => r.slice(s.taken[i] ?? 0));

/* ────────────────────────── 세는 사본 ────────────────────────── */

/** 정본과 같은 규칙으로 런을 만든다. 런의 내용을 보이는 자리와 세는 사본이 쓴다. */
function 런내기(values: readonly number[], M: number): number[][] {
  const out: number[][] = [];
  for (let at = 0; at < values.length; at += M) {
    out.push(정렬(values.slice(at, at + M)));
  }
  return out;
}

/** 「문자열 순서로 정렬하는 판」이 만드는 런. 비교 함수만 뺀 사본이다. */
function 문자열_런(values: readonly number[], M: number): number[][] {
  const out: number[][] = [];
  for (let at = 0; at < values.length; at += M) {
    out.push(values.slice(at, at + M).sort());
  }
  return out;
}

/** 최소 힙을 안 쓰고 **모든 런의 맨 앞을 비교해** 최솟값을 고르는 사본. 비교 횟수만 센다. */
function 모두_비교(runs: readonly number[][]): { 비교: number; 답: number[] } {
  const 자리: number[] = runs.map(() => 0);
  let 비교 = 0;
  const out: number[] = [];
  for (;;) {
    let best = -1;
    for (let r = 0; r < runs.length; r++) {
      const 런 = runs[r] as number[];
      if ((자리[r] as number) >= 런.length) continue;
      if (best === -1) {
        best = r;
        continue;
      }
      비교++;
      const 이쪽 = 런[자리[r] as number] as number;
      const 저쪽 = (runs[best] as number[])[자리[best] as number] as number;
      if (이쪽 < 저쪽) best = r;
    }
    if (best === -1) break;
    const 런 = runs[best] as number[];
    out.push(런[자리[best] as number] as number);
    자리[best] = (자리[best] as number) + 1;
  }
  return { 비교, 답: out };
}

/**
 * 메모리 `M` 개만 쓰는 가장 단순한 방법 — **반복 선택**. 바퀴마다 입력 파일 전체를 앞에서부터 읽으며,
 * 아직 안 적은 값 가운데 가장 작은 `M` 개를 골라 출력에 잇는다. 같은 값은 (값, 자리) 쌍으로 갈라 한 번씩만
 * 고른다. 세는 사본이라 고르는 일은 배열로 하고, 파일에서 읽은 정수와 적은 정수만 센다.
 */
function 반복_선택(
  values: readonly number[],
  M: number,
): { 답: number[]; 읽은: number; 적은: number; 바퀴: number[][] } {
  const key = values.map((v, i) => [v, i] as const);
  const 앞 = (a: readonly [number, number], b: readonly [number, number]) =>
    a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1];
  let last: readonly [number, number] = [Number.NEGATIVE_INFINITY, -1];
  const 답: number[] = [];
  const 바퀴: number[][] = [];
  let 읽은 = 0;
  while (답.length < values.length) {
    읽은 += values.length;
    const 고른 = key
      .filter((k) => 앞(k, last) > 0)
      .sort(앞)
      .slice(0, M);
    바퀴.push(고른.map((k) => k[0]));
    for (const k of 고른) 답.push(k[0]);
    last = 고른.at(-1) as readonly [number, number];
  }
  if (나열(답) !== 나열(정렬(values))) {
    throw new Error("반복 선택 사본이 정렬 결과와 다른 답을 냈다");
  }
  return { 답, 읽은, 적은: values.length, 바퀴 };
}

/** 반복 선택의 정수 입출력 — 바퀴 `⌈N/M⌉` 번에 파일 전체를 읽고, 출력은 한 번 적는다. */
const 반복선택_입출력 = (N: number, M: number): number => N * 런수(N, M) + N;

/**
 * 규모가 큰 입력에서 **값만 세는 가벼운 판**. 걸음 기록을 남기지 않고, 정수 배열 하나(`Int32Array`)에
 * 런을 제자리 정렬한 뒤 `-guide.alt.ts` 의 `세는힙` 과 같은 절차로 합치며 비교를 센다. 런의 맨 앞을
 * 모두 비교하는 방법의 비교 횟수도 여기서 함께 낸다 — 값 하나를 낼 때 아직 안 끝난 런이 `a` 개면 그
 * 방법은 `a − 1` 번 비교하므로, 합치는 동안 런이 끝나는 차례만 알면 된다.
 */
function 가벼운_셈(
  N: number,
  M: number,
): { 합치기_비교: number; 모두_비교: number; 런: number } {
  const vals = new Int32Array(N);
  for (let i = 0; i < N; i++) vals[i] = ((i * 48_271) % 1_000_003) - 500_000;
  const R = 런수(N, M);
  for (let r = 0; r < R; r++) {
    vals.subarray(r * M, Math.min(N, (r + 1) * M)).sort();
  }
  const hv = new Int32Array(R);
  const hr = new Int32Array(R);
  const pos = new Int32Array(R);
  let size = 0;
  let 비교 = 0;
  const swap = (a: number, b: number): void => {
    const tv = hv[a] as number;
    const tr = hr[a] as number;
    hv[a] = hv[b] as number;
    hr[a] = hr[b] as number;
    hv[b] = tv;
    hr[b] = tr;
  };
  const push = (value: number, run: number): void => {
    let i = size++;
    hv[i] = value;
    hr[i] = run;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      비교++;
      if ((hv[parent] as number) <= (hv[i] as number)) break;
      swap(i, parent);
      i = parent;
    }
  };
  const pop = (): [number, number] => {
    const top: [number, number] = [hv[0] as number, hr[0] as number];
    size--;
    if (size > 0) {
      hv[0] = hv[size] as number;
      hr[0] = hr[size] as number;
      let i = 0;
      for (;;) {
        let small = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < size) {
          비교++;
          if ((hv[left] as number) < (hv[small] as number)) small = left;
        }
        if (right < size) {
          비교++;
          if ((hv[right] as number) < (hv[small] as number)) small = right;
        }
        if (small === i) break;
        swap(i, small);
        i = small;
      }
    }
    return top;
  };
  for (let r = 0; r < R; r++) {
    push(vals[r * M] as number, r);
    pos[r] = 1;
  }
  let 살아있는 = R;
  let 모두 = 0;
  let 앞값 = Number.NEGATIVE_INFINITY;
  let 낸 = 0;
  while (size > 0) {
    모두 += 살아있는 - 1;
    const [value, run] = pop();
    if (value < 앞값) throw new Error("가벼운 판의 출력이 오름차순이 아니다");
    앞값 = value;
    낸++;
    const end = Math.min(N, (run + 1) * M);
    const at = run * M + (pos[run] as number);
    if (at < end) {
      push(vals[at] as number, run);
      pos[run] = (pos[run] as number) + 1;
    } else {
      살아있는--;
    }
  }
  if (낸 !== N) throw new Error("가벼운 판이 낸 값의 수가 N 이 아니다");
  return { 합치기_비교: 비교, 모두_비교: 모두, 런: R };
}

/** 가벼운 판이 작은 규모에서 세는 사본 둘과 같은 수를 내는가. 다르면 큰 규모의 수도 못 믿는다. */
for (const [N, M] of [
  [1_000, 100],
  [10_000, 100],
  [10_000, 7],
] as [number, number][]) {
  const 가벼운 = 가벼운_셈(N, M);
  const 힙 = 한번에_합치기(생성식(N), M);
  const 모두 = 모두_비교(런내기(생성식(N), M));
  if (가벼운.합치기_비교 !== 힙.합치기_비교 || 가벼운.모두_비교 !== 모두.비교) {
    throw new Error(`가벼운 판이 세는 사본과 다른 수를 냈다 — N ${N}, M ${M}`);
  }
}

/* ────────────────────────── 과제 규모 ────────────────────────── */

/** 과제의 규모 — 정수 천만 개, 메모리에 한 번에 드는 정수 1 만 개(입력의 천분의 일). */
export const 과제_N = 10_000_000;
export const 과제_M = 10_000;

let 과제_셈_값: ReturnType<typeof 가벼운_셈> | null = null;
/** 과제 규모의 비교 횟수 — 무거워서 부를 때 한 번만 센다. */
function 과제_셈(): ReturnType<typeof 가벼운_셈> {
  if (과제_셈_값 === null) 과제_셈_값 = 가벼운_셈(과제_N, 과제_M);
  return 과제_셈_값;
}

/** 방법 넷이 과제 규모에서 드는 것 — 시도 사다리와 표가 같이 쓴다. */
export function 과제_비교표() {
  const N = 과제_N;
  const M = 과제_M;
  const 셈 = 과제_셈();
  return {
    N,
    M,
    R: 셈.런,
    전부_메모리: N,
    전부_입출력: 2 * N,
    선택_메모리: M,
    선택_입출력: 반복선택_입출력(N, M),
    런_메모리: 메모리_칸(N, M),
    런_입출력: 4 * N,
    모두_비교: 셈.모두_비교,
    힙_비교: 셈.합치기_비교,
  };
}

/* ────────────────────────── 변이 ────────────────────────── */

/** 런을 정렬할 때 비교 함수를 빼서 문자열 순서로 정렬하는 판. */
const 문자열정렬판 = await loadMutant<Ref>(REF, {
  swap: [/^ {6}chunk\.sort\(\(a, b\) => a - b\);$/, "      chunk.sort();"],
});

/** 입력이 끝났을 때 남은 자투리를 적지 않는 판. */
const 자투리없는판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}const tail = value === null && chunk\.length > 0;$/,
    "    const tail = false;",
  ],
});

/** 런마다 첫 값 하나가 아니라 런 전체를 최소 힙에 올리는 판. */
const 전부올리는판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}if \(value !== null\) heap\.push\(\{ value, run \}\);$/,
    "    for (let v = value; v !== null; v = await (readers[run] as LineReader).next()) heap.push({ value: v, run });",
  ],
});

/** 출력 파일을 미리 비우지 않는 판. */
const 안비우는판 = await loadMutant<Ref>(REF, {
  drop: /^ {2}await Bun\.write\(outputPath, ""\);$/,
});

/** 꺼낸 자리를 그 런의 다음 값으로 다시 채우지 않는 판. */
const 안채우는판 = await loadMutant<Ref>(REF, {
  drop: /^ {4}if \(next !== null\) heap\.push\(\{ value: next, run \}\);$/,
});

/** 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않으면 두 함수가 **같은 객체**다. */
const 중화됨 = 문자열정렬판.externalMergeSort === externalMergeSort;

/* ────────────────────── 변이 표가 쓰는 입력 묶음 ────────────────────── */

interface 줄 {
  이름: string;
  값: number[];
  M: number;
  미리?: string;
}

const 정렬입력: 줄[] = [
  { 이름: "전개가 쓰는 한 자리 수 여덟", 값: WALK, M: WALK_M },
  { 이름: "두 자리 수가 섞인 여덟", 값: [5, 1, 80, 3, 7, 20, 9, 4], M: 3 },
  { 이름: "열 이상만 든 여섯", 값: [30, 7, 25, 9, 100, 8], M: 2 },
  { 이름: "정수 하나뿐인 입력", 값: [42], M: 1 },
];

const 자투리입력: 줄[] = [
  { 이름: "전개가 쓰는 여덟 · 메모리 3", 값: WALK, M: WALK_M },
  { 이름: "배수인 아홉 · 메모리 3", 값: [5, 1, 8, 3, 7, 2, 9, 4, 6], M: 3 },
  { 이름: "배수인 여섯 · 메모리 2", 값: [3, 1, 3, 1, 3, 1], M: 2 },
  { 이름: "배수가 아닌 다섯 · 메모리 2", 값: [4, 2, 5, 1, 3], M: 2 },
];

const 전부올리기입력: 줄[] = [
  { 이름: "전개가 쓰는 여덟 · 메모리 3", 값: WALK, M: WALK_M },
  { 이름: "런이 하나인 여덟 · 메모리 100", 값: WALK, M: 100 },
  { 이름: "런이 여덟인 여덟 · 메모리 1", 값: WALK, M: 1 },
  { 이름: "음수가 섞인 여섯 · 메모리 2", 값: [-3, 1, -1, 2, 0, -2], M: 2 },
];

const 비우기입력: 줄[] = [
  { 이름: "출력 파일이 아직 없다", 값: WALK, M: WALK_M },
  {
    이름: "앞서 정수 스물을 적어 둔 파일",
    값: WALK,
    M: WALK_M,
    미리: `${Array.from({ length: 20 }, (_, i) => 100 + i).join("\n")}\n`,
  },
  { 이름: "앞서 정수 하나를 적어 둔 파일", 값: WALK, M: WALK_M, 미리: "7\n" },
  {
    이름: "앞서 세 자리 수 하나를 적어 둔 파일",
    값: WALK,
    M: WALK_M,
    미리: "123\n",
  },
];

const 되채우기입력: 줄[] = [
  { 이름: "전개가 쓰는 여덟 · 메모리 3", 값: WALK, M: WALK_M },
  { 이름: "런이 하나인 여덟 · 메모리 100", 값: WALK, M: 100 },
  { 이름: "정수 하나뿐인 입력 · 메모리 1", 값: [42], M: 1 },
  { 이름: "런이 여덟인 여덟 · 메모리 1", 값: WALK, M: 1 },
];

/** 그 줄을 이 입력이 몇 번 지나가는가. 실행으로 센다. */
function 지나간_횟수(
  값: number[],
  M: number,
): { 정렬: number; 자투리: number; 초기올리기: number; 되채우기: number } {
  const rs = 런내기(값, M);
  return {
    정렬: rs.length,
    자투리: 값.length === 0 || 값.length % M === 0 ? 0 : 1,
    초기올리기: rs.length,
    되채우기: 값.length - rs.length,
  };
}

type 자리이름 = "정렬" | "자투리" | "초기올리기" | "되채우기";

/** 변이 하나를 입력 여럿에 적용해 정본과 나란히 놓는다. */
async function 변이표(
  label: string,
  impl: Ref,
  줄들: 줄[],
  siteLabel: string,
  site: 자리이름 | "안덮인_바이트",
): Promise<string> {
  const rows: string[][] = [];
  for (const 줄 of 줄들) {
    const ok = await 실행({ externalMergeSort }, 줄.값, 줄.M, 줄.미리);
    const bad = await 실행(impl, 줄.값, 줄.M, 줄.미리);
    const 횟수 =
      site === "안덮인_바이트"
        ? bad.안덮인_바이트
        : 지나간_횟수(줄.값, 줄.M)[site];
    rows.push([
      줄.이름,
      나열(ok.답),
      나열(bad.답),
      comma(횟수),
      나열(ok.답) === 나열(bad.답) ? "같다" : "어긋난다",
    ]);
  }
  return md(["입력", "정본", label, siteLabel, "판정"], rows, [3]);
}

const 문자열정렬표 = await 변이표(
  "문자열 순서로 정렬하는 판",
  문자열정렬판,
  정렬입력,
  "정렬한 런 수",
  "정렬",
);
const 자투리표 = await 변이표(
  "자투리를 안 적는 판",
  자투리없는판,
  자투리입력,
  "자투리 갈래를 지나간 횟수",
  "자투리",
);
const 전부올리기표 = await 변이표(
  "런 전체를 올리는 판",
  전부올리는판,
  전부올리기입력,
  "그 줄을 지나간 횟수",
  "초기올리기",
);
const 비우기표 = await 변이표(
  "출력을 안 비우는 판",
  안비우는판,
  비우기입력,
  "새 내용이 덮지 못한 바이트",
  "안덮인_바이트",
);
const 되채우기표 = await 변이표(
  "다시 안 채우는 판",
  안채우는판,
  되채우기입력,
  "다시 채운 횟수",
  "되채우기",
);

/** 「런 전체를 올리는 판」이 메모리에 드는 정수. 그 판의 답도 함께 만든다. */
function 전부_올린_메모리(
  values: number[],
  M: number,
): { 최대_정수_칸: number; 답: number[] } {
  const runs = 런내기(values, M);
  let 담긴것 = 0;
  for (const r of runs) 담긴것 += r.length;
  return {
    최대_정수_칸: Math.max(Math.min(values.length, M), 담긴것),
    답: 모두_비교(runs).답,
  };
}

/* ─────────────── 사본과 변이가 같은 절차인지 답으로 확인 ─────────────── */

if (!중화됨) {
  const 갈리는_변이: { label: string; impl: Ref; 줄: 줄 }[] = [
    {
      label: "문자열 순서로 정렬하는 판",
      impl: 문자열정렬판,
      줄: 정렬입력[1] as 줄,
    },
    {
      label: "자투리를 안 적는 판",
      impl: 자투리없는판,
      줄: 자투리입력[0] as 줄,
    },
    { label: "출력을 안 비우는 판", impl: 안비우는판, 줄: 비우기입력[1] as 줄 },
    { label: "다시 안 채우는 판", impl: 안채우는판, 줄: 되채우기입력[0] as 줄 },
  ];
  for (const { label, impl, 줄 } of 갈리는_변이) {
    const ok = await 실행({ externalMergeSort }, 줄.값, 줄.M, 줄.미리);
    const bad = await 실행(impl, 줄.값, 줄.M, 줄.미리);
    if (나열(ok.답) === 나열(bad.답)) {
      throw new Error(`${label} 변이가 그 입력에서 답을 바꾸지 못했다`);
    }
  }
  for (const 줄 of 전부올리기입력) {
    const bad = await 실행(전부올리는판, 줄.값, 줄.M);
    if (나열(전부_올린_메모리(줄.값, 줄.M).답) !== 나열(bad.답)) {
      throw new Error(`전부 올리는 사본이 변이와 다른 답을 냈다 — ${줄.이름}`);
    }
  }
  for (const 줄 of 정렬입력) {
    const bad = await 실행(문자열정렬판, 줄.값, 줄.M);
    if (나열(모두_비교(문자열_런(줄.값, 줄.M)).답) !== 나열(bad.답)) {
      throw new Error(`문자열 런 사본이 변이와 다른 답을 냈다 — ${줄.이름}`);
    }
  }
}

for (const [값, M] of [
  [WALK, WALK_M],
  [[5, 1, 8, 3, 7, 2, 9, 4, 6], 3],
  [[-3, 1, -1, 2, 0, -2], 2],
] as [number[], number][]) {
  const 정답 = 나열(정렬(값));
  if (나열((await 실행({ externalMergeSort }, 값, M)).답) !== 정답) {
    throw new Error("정본이 정렬 결과와 다른 답을 냈다");
  }
  if (나열(모두_비교(런내기(값, M)).답) !== 정답) {
    throw new Error("모두 비교하는 사본이 정본과 다른 답을 냈다");
  }
  const c = 한번에_합치기(값, M);
  if (c.읽은 + c.적은 !== 4 * 값.length) {
    throw new Error("세는 사본의 입출력이 4N 이 아니다");
  }
}

/* ─────────────── 블록 크기 실측 ─────────────── */

/** 파일 하나를 스트림으로 읽어 블록마다의 바이트를 잰다. */
async function 블록들(path: string): Promise<number[]> {
  const out: number[] = [];
  const reader = Bun.file(path).stream().getReader();
  for (;;) {
    const 받은것 = await reader.read();
    if (받은것.done) break;
    out.push(받은것.value.length);
  }
  return out;
}

const 블록입력 = join(TMP, "block.in");
await Bun.write(블록입력, `${생성식(대조_N).join("\n")}\n`);
const 블록크기 = await 블록들(블록입력);
const 블록_바이트 = 블록크기[0] as number;
const 블록입력_바이트 = 블록크기.reduce((a, b) => a + b, 0);

/** 과제 규모의 첫 런을 파일로 적고, 스트림이 몇 블록으로 주는지 잰다. */
const 런파일 = join(TMP, "run0.in");
const 런파일_내용 = `${정렬(생성식(과제_M)).join("\n")}\n`;
await Bun.write(런파일, 런파일_내용);
const 런블록 = await 블록들(런파일);

/** 과제 규모의 런 파일마다 바이트 — 정수 하나에 줄바꿈 하나. 값만 세고 파일은 안 만든다. */
function 과제_런_바이트(): number[] {
  const out: number[] = [];
  const R = 런수(과제_N, 과제_M);
  for (let r = 0; r < R; r++) {
    let bytes = 0;
    const end = Math.min(과제_N, (r + 1) * 과제_M);
    for (let i = r * 과제_M; i < end; i++) {
      bytes += String(((i * 48_271) % 1_000_003) - 500_000).length + 1;
    }
    out.push(bytes);
  }
  return out;
}

/* ─────────────── 대조 계수 ─────────────── */

const 대조값 = 생성식(대조_N);
const 한번에 = 한번에_합치기(대조값, 대조_M);
const 여러바퀴 = 여러바퀴_합치기(대조값, 대조_M, 대조_k);
const 한번에_입출력 = 한번에.읽은 + 한번에.적은;
const 여러바퀴_입출력 = 여러바퀴.읽은 + 여러바퀴.적은;

/** 정수 입출력 한 번을 비교 `c/1000` 번으로 환산했을 때 두 판의 순서가 뒤집히는 첫 `c`. */
function 환산_경계(): number {
  for (let c = 0; c <= 1_000_000; c++) {
    const a = 한번에_입출력 * c + 한번에.합치기_비교 * 1000;
    const b = 여러바퀴_입출력 * c + 여러바퀴.합치기_비교 * 1000;
    if (a < b) return c;
  }
  return -1;
}
const 경계c = 환산_경계();

/* ─────────────── 미리 받아 두는 실행 결과 ─────────────── */

const 결과입력: [string, number[], number][] = [
  ["전개가 쓰는 여덟", WALK, WALK_M],
  ["이미 오름차순인 여섯", [1, 2, 3, 4, 5, 6], 2],
  ["중복이 많은 여섯", [3, 1, 3, 1, 3, 1], 2],
  ["음수가 섞인 여섯", [-3, 1, -1, 2, 0, -2], 2],
  ["정수 하나", [42], 1],
  ["런이 하나인 다섯", [4, 2, 5, 1, 3], 100],
  ["정수마다 런 하나인 여덟", [3, 1, 4, 1, 5, 9, 2, 6], 1],
];

const 결과답 = new Map<string, number[]>();
for (const [이름, 값, M] of 결과입력) {
  결과답.set(이름, (await 실행({ externalMergeSort }, 값, M)).답);
}

const 경계입력: [string, number[], number, string][] = [
  ["정수가 하나뿐이다", [42], 1, "런이 하나이고 합치기가 값 하나로 끝난다"],
  [
    "메모리가 정수 개수보다 크다",
    [4, 2, 5, 1, 3],
    100,
    "런이 하나라 최소 힙에 항목이 하나뿐이다",
  ],
  [
    "메모리가 1 이다",
    [5, 1, 8, 3],
    1,
    "정수마다 런이 하나라 최소 힙이 입력 전체만큼 커진다",
  ],
  [
    "값이 전부 같다",
    [7, 7, 7, 7],
    2,
    "꼭대기를 고르는 비교가 모두 같은 값 사이에서 일어난다",
  ],
  [
    "이미 오름차순이다",
    [1, 2, 3, 4, 5, 6],
    2,
    "런 하나를 다 낸 뒤에야 다음 런으로 넘어간다",
  ],
  [
    "음수와 0 이 섞여 있다",
    [-3, 1, -1, 2, 0, -2],
    2,
    "부호가 갈려도 비교 함수가 그대로 쓰인다",
  ],
];

const 경계답 = new Map<string, number[]>();
for (const [이름, 값, M] of 경계입력) {
  경계답.set(이름, (await 실행({ externalMergeSort }, 값, M)).답);
}

const 불변식입력: [string, number[], number][] = [
  ["전개가 쓰는 여덟 · 메모리 3", WALK, WALK_M],
  ["정수 100 · 메모리 7", 생성식(100), 7],
  ["정수 1,000 · 메모리 1", 생성식(1_000), 1],
  ["정수 1,000 · 메모리 1,000", 생성식(1_000), 1_000],
  ["정수 3,000 · 메모리 32", 생성식(3_000), 32],
];

/** 기록판의 걸음마다 세 성질을 판정한다. 손으로 적지 않는다. */
function 불변식_판정(
  values: readonly number[],
  사건들: 사건[],
): {
  걸음: number;
  오름차순_깨짐: number;
  합_어긋남: number;
  꼭대기_어긋남: number;
} {
  const ss = 걸음들(values, 사건들).filter((s) => s.phase === "merge");
  let 오름차순_깨짐 = 0;
  let 합_어긋남 = 0;
  let 꼭대기_어긋남 = 0;
  for (const s of ss) {
    const out = s.output;
    if (out.length > 1 && (out.at(-2) as number) > (out.at(-1) as number)) {
      오름차순_깨짐++;
    }
    const 남은 = 남은값(s).flat();
    const 힙값 = s.heap.map((e) => e.value);
    if (힙값.length + 남은.length + out.length !== values.length) 합_어긋남++;
    const 안적은 = [...힙값, ...남은];
    if (안적은.length > 0 && Math.min(...안적은) !== 힙값[0]) 꼭대기_어긋남++;
  }
  return { 걸음: ss.length, 오름차순_깨짐, 합_어긋남, 꼭대기_어긋남 };
}

const 불변식결과: ReturnType<typeof 불변식_판정>[] = [];
for (const [, 값, M] of 불변식입력) {
  불변식결과.push(불변식_판정(값, await 기록(값, M)));
}

const 비용입력: [string, number[], number][] = [
  ["전개가 쓰는 여덟", WALK, WALK_M],
  ["정수 1,000", 생성식(1_000), 32],
  ["정수 10,000", 생성식(10_000), 100],
  ["정수 100,000", 생성식(100_000), 100],
];

const 최악후보: [string, number[], number][] = [
  ["뒤섞인 입력 · 메모리 100", 생성식(10_000), 100],
  ["이미 오름차순인 입력 · 메모리 100", 정렬(생성식(10_000)), 100],
  [
    "내림차순인 입력 · 메모리 100",
    [...생성식(10_000)].sort((a, b) => b - a),
    100,
  ],
  ["값이 전부 같은 입력 · 메모리 100", new Array(10_000).fill(7), 100],
  ["뒤섞인 입력 · 메모리 10,000", 생성식(10_000), 10_000],
  ["뒤섞인 입력 · 메모리 1", 생성식(10_000), 1],
];

/* ─────────────── 읽개 한 벌 — 전개 1 번 ─────────────── */

const 읽개입력 = join(TMP, "reader.in");
await Bun.write(읽개입력, `${WALK.join("\n")}\n`);
const 읽개블록: number[] = [];
g.__emsBlocks = 읽개블록;
const 읽개 = new 기록판.LineReader(읽개입력);
const 읽개기록: { value: number | null; blocks: number[] }[] = [];
for (;;) {
  const before = 읽개블록.length;
  const value = await 읽개.next();
  읽개기록.push({ value, blocks: 읽개블록.slice(before) });
  if (value === null) break;
}
g.__emsBlocks = undefined;

/* ────────────────────────── 증명 블록 ────────────────────────── */

const 합치는걸음 = (): 걸음[] => WALK_걸음.filter((s) => s.phase === "merge");
const 런걸음 = (): 걸음[] => WALK_걸음.filter((s) => s.phase === "run");

export const PROOFS: Record<string, () => string> = {
  /** 전체 컨셉 — 런의 맨 앞 셋과 입력 전체의 최솟값. */
  "concept-heads": () => {
    const 자리 = 런자리(RUNS);
    const rows = RUNS.map((r, i) => {
      const [from, to] = 자리[i] as [number, number];
      return [`런 ${i}`, `[${from},${to}]`, 나열(r), String(r[0])];
    });
    const heads = RUNS.map((r) => r[0] as number);
    const 최소 = Math.min(...heads);
    const 전체최소 = Math.min(...WALK);
    return [
      md(["런", "입력의 자리", "런의 값", "맨 앞"], rows),
      "",
      `런 ${RUNS.length} 개의 맨 앞 ${heads.join(" · ")} 가운데 가장 작은 ${최소}${이가(최소)} 입력 ${WALK.length} 개 전체의 최솟값 ${전체최소}${과와(전체최소)} 같습니다.`,
    ].join("\n");
  },

  /** 아이디어를 떠올리는 과정 ② — 전부 올려 정렬하는 방법의 메모리. */
  "origin-naive": () => {
    const rows: string[][] = [
      [
        "전개 입력(실행)",
        comma(WALK.length),
        comma(WALK_M),
        comma(WALK.length),
        배수(WALK.length, WALK_M),
      ],
      [
        "과제 규모(식)",
        comma(과제_N),
        comma(과제_M),
        comma(과제_N),
        배수(과제_N, 과제_M),
      ],
    ];
    return [
      md(
        [
          "규모",
          "정수 N",
          "메모리 M",
          "전부 올리는 방법이 든 정수",
          "M 의 몇 배",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `전부 올리는 방법은 정수 N 개를 배열 하나에 모두 듭니다. 과제 규모에서 정수 하나를 8 바이트로 잡으면 ${comma(8 * 과제_N)} 바이트이고, 메모리 M 개는 ${comma(8 * 과제_M)} 바이트입니다.`,
    ].join("\n");
  },

  /** ③ — 반복 선택을 전개 입력에 걸었을 때 바퀴마다. */
  "origin-select-walk": () => {
    const s = 반복_선택(WALK, WALK_M);
    let 누적 = 0;
    const rows = s.바퀴.map((b, i) => {
      누적 += WALK.length;
      return [String(i + 1), comma(WALK.length), 나열(b), comma(누적)];
    });
    const 합 = s.읽은 + s.적은;
    return [
      md(
        ["바퀴", "이번에 읽은 정수", "고른 값", "지금까지 읽은 정수"],
        rows,
        [0, 1, 3],
      ),
      "",
      `바퀴 ${s.바퀴.length} 번에 파일에서 정수를 ${comma(s.읽은)} 개 읽었고, 출력에 ${comma(s.적은)} 개를 적어 정수 입출력이 ${comma(합)} 입니다. 답 ${나열(s.답)}${은는(나열(s.답))} 정렬 결과와 같습니다.`,
    ].join("\n");
  },

  /** ③ — 전개 입력을 메모리만큼씩 끊어 정렬한 결과. */
  "origin-runs": () => {
    const 자리 = 런자리(RUNS);
    const rows = RUNS.map((r, i) => {
      const [from, to] = 자리[i] as [number, number];
      return [`런 ${i}`, 나열(WALK.slice(from, to + 1)), 나열(r), String(r[0])];
    });
    const 최대 = Math.max(...RUNS.map((r) => r.length));
    return [
      md(["런", "읽은 값", "정렬한 뒤", "맨 앞"], rows),
      "",
      `입력을 ${comma(WALK_M)} 개씩 읽어 정렬해 적으니 런이 ${RUNS.length} 개이고, 그 사이 메모리에 든 정수는 많아야 ${최대} 개입니다.`,
    ].join("\n");
  },

  /** ④ — 반복 선택과 런을 만들어 합치는 방법의 정수 입출력. */
  "origin-two-ways": () => {
    const rows: string[][] = [];
    for (const [N, M] of [
      [WALK.length, WALK_M],
      [1_000, 10],
      [10_000, 100],
    ] as [number, number][]) {
      const 값 = N === WALK.length ? WALK : 생성식(N);
      const s = 반복_선택(값, M);
      const c = 한번에_합치기(값, M);
      const 선택 = s.읽은 + s.적은;
      const 런 = c.읽은 + c.적은;
      if (선택 !== 반복선택_입출력(N, M) || 런 !== 4 * N) {
        throw new Error("실측이 닫힌 형태와 다르다");
      }
      rows.push([
        `${comma(N)}(실행)`,
        comma(M),
        comma(런수(N, M)),
        comma(선택),
        comma(런),
        배수(선택, 런),
      ]);
    }
    const t = 과제_비교표();
    rows.push([
      `${comma(t.N)}(식)`,
      comma(t.M),
      comma(t.R),
      comma(t.선택_입출력),
      comma(t.런_입출력),
      배수(t.선택_입출력, t.런_입출력),
    ]);
    return [
      md(
        [
          "정수 N",
          "메모리 M",
          "런 수 R",
          "반복 선택",
          "런을 만들어 합치기",
          "몇 배",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      "실행한 세 줄에서 반복 선택은 N × R + N 과, 런을 만들어 합치는 쪽은 4N 과 한 자리도 다르지 않았습니다. 마지막 줄은 두 식에 과제 규모를 넣은 값입니다.",
    ].join("\n");
  },

  /** ⑤ — 런의 맨 앞을 모두 비교하는 방법과 최소 힙의 비교 횟수. */
  "origin-heads-two-ways": () => {
    const rows: string[][] = [];
    const 케이스: [number[], number][] = [
      [WALK, WALK_M],
      [생성식(1_000), 100],
      [생성식(10_000), 100],
      [생성식(100_000), 100],
    ];
    for (const [값, M] of 케이스) {
      const 선형 = 모두_비교(런내기(값, M));
      const 힙 = 한번에_합치기(값, M);
      rows.push([
        `${comma(값.length)}(실행)`,
        comma(M),
        comma(런수(값.length, M)),
        comma(선형.비교),
        comma(힙.합치기_비교),
        배수(선형.비교, 힙.합치기_비교),
      ]);
    }
    const t = 과제_비교표();
    rows.push([
      `${comma(t.N)}(가벼운 판 실행)`,
      comma(t.M),
      comma(t.R),
      comma(t.모두_비교),
      comma(t.힙_비교),
      배수(t.모두_비교, t.힙_비교),
    ]);
    return [
      md(
        [
          "정수 N",
          "메모리 M",
          "런 수 R",
          "맨 앞을 모두 비교",
          "최소 힙",
          "몇 배",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `런이 ${RUNS.length} 개뿐인 전개 입력에서는 두 방법의 비교 횟수가 같고, 런 수가 늘면서 갈립니다. 마지막 줄은 기록을 남기지 않고 수만 세는 가벼운 판으로 과제 규모를 실제로 센 값입니다.`,
    ].join("\n");
  },

  /** 먼저 알아 둘 개념 (c) — 런 하나를 읽는 법. */
  "build-read-run": () => {
    const i = 1;
    const [from, to] = 런자리(RUNS)[i] as [number, number];
    const r = RUNS[i] as number[];
    const bytes = `${r.join("\n")}\n`.length;
    return columns([
      ["입력의 자리", `[${from},${to}]`, ""],
      ["읽은 값", 나열(WALK.slice(from, to + 1)), ""],
      ["정렬한 뒤", 나열(r), `→ 런 ${i} 파일 하나(${bytes} 바이트)`],
      [
        "맨 앞",
        String(r[0]),
        "← 이 런에서 아직 안 적은 값 가운데 가장 작은 값",
      ],
    ]).join("\n");
  },

  /** (d) — 런끼리의 관계. */
  "build-run-relation": () => {
    const 자리 = 런자리(RUNS);
    const rows = RUNS.map((r, i) => {
      const [from, to] = 자리[i] as [number, number];
      return [
        `런 ${i}`,
        `[${from},${to}]`,
        comma(r.length),
        String(r[0]),
        String(Math.min(...r)),
      ];
    });
    const 덮은 = RUNS.reduce((s, r) => s + r.length, 0);
    const 맞는 = RUNS.filter((r) => r[0] === Math.min(...r)).length;
    return [
      md(
        ["런", "입력의 자리", "값 개수", "맨 앞", "런 안의 최솟값"],
        rows,
        [2],
      ),
      "",
      `런 ${RUNS.length} 개가 입력의 자리 ${덮은} 개를 겹치지 않고 모두 덮고, ${RUNS.length} 개 가운데 ${맞는} 개에서 맨 앞이 그 런의 최솟값입니다.`,
    ].join("\n");
  },

  /** (e) — 정렬하지 않은 조각과 런. */
  "build-contrast": () => {
    const 조각 = 런자리(RUNS).map(([f, t]) => WALK.slice(f, t + 1));
    const 전체 = Math.min(...WALK);
    const row = (이름: string, parts: number[][]): string[] => {
      const heads = parts.map((p) => p[0] as number);
      const m = Math.min(...heads);
      return [
        이름,
        parts.map(나열).join(" · "),
        heads.join(" · "),
        String(m),
        m === 전체 ? "같다" : "다르다",
      ];
    };
    return [
      md(
        [
          "모양",
          "세 묶음",
          "맨 앞 셋",
          "맨 앞의 최솟값",
          "입력 전체의 최솟값과 비교",
        ],
        [row("정렬하지 않은 조각", 조각), row("런", RUNS)],
        [3],
      ),
      "",
      `입력 전체의 최솟값은 ${전체} 입니다. 정렬하지 않은 조각의 맨 앞으로는 그 값이 안 나오고, 런의 맨 앞으로는 나옵니다.`,
    ].join("\n");
  },

  /** 1단계 — 메모리만큼 읽어 런으로 적는 걸음. */
  "build-chunk": () => {
    const 자리 = 런자리(RUNS);
    const rows = 런걸음()
      .filter((s) => s.runIndex !== null)
      .map((s) => {
        const i = s.runIndex as number;
        const [from, to] = 자리[i] as [number, number];
        return [
          `런 ${i}`,
          나열(WALK.slice(from, to + 1)),
          s.full ? "메모리가 찼다" : "입력이 끝났다",
          나열(RUNS[i] as number[]),
          comma(s.메모리),
        ];
      });
    const 끝런 = RUNS.at(-1) as number[];
    return [
      md(
        [
          "런",
          "메모리에 모은 값",
          "적는 까닭",
          "정렬해 적은 값",
          "메모리에 든 정수",
        ],
        rows,
        [4],
      ),
      "",
      `정수 ${WALK.length} 개가 런 ${RUNS.length} 개가 됐고, 마지막 런은 값이 ${끝런.length} 개입니다.`,
    ].join("\n");
  },

  /** 2단계 — 런마다 첫 값 하나씩 최소 힙에 올리는 동안. */
  "build-heap-init": () => {
    const rows: string[][] = [];
    let k = 0;
    for (const e of WALK_사건) {
      if (e.kind !== "init") continue;
      k++;
      rows.push([
        String(k),
        `런 ${e.run}`,
        String(e.value),
        e.heap.map((x) => x.value).join(" "),
        꺼낼차례(e.heap)
          .map((x) => x.value)
          .join(" "),
        comma(e.heap.length),
      ]);
    }
    return [
      md(
        [
          "올린 차례",
          "런",
          "그 런의 맨 앞",
          "힙 배열",
          "꺼낼 차례",
          "메모리에 든 정수",
        ],
        rows,
        [0, 2, 5],
      ),
      "",
      `런 ${RUNS.length} 개에 든 정수 ${WALK.length} 개 가운데 메모리에 올라온 것은 ${k} 개이고, 나머지 ${WALK.length - k} 개는 런 파일에 남아 있습니다.`,
    ].join("\n");
  },

  /** 3단계 — 값을 하나 낼 때마다 세 자리의 개수. */
  "build-merge": () => {
    const rows = 합치는걸음()
      .filter((s) => s.out !== null)
      .map((s, i) => {
        const 남은 = 남은값(s).flat().length;
        const out = s.out as Entry;
        const 올린 = s.pushed[0];
        return [
          String(i + 1),
          `${out.value}(런 ${out.run})`,
          올린 === undefined ? "런이 끝났다" : String(올린.value),
          comma(s.heap.length),
          comma(남은),
          comma(s.output.length),
          comma(s.heap.length + 남은 + s.output.length),
        ];
      });
    const 끝난 = rows.filter((r) => r[2] === "런이 끝났다").length;
    return [
      md(
        [
          "낸 차례",
          "꺼낸 값",
          "같은 런에서 올린 값",
          "최소 힙",
          "런에 남은 값",
          "출력",
          "셋의 합",
        ],
        rows,
        [0, 3, 4, 5, 6],
      ),
      "",
      `값을 ${rows.length} 번 냈고, 그중 ${끝난} 번은 꺼낸 값의 런이 끝나 아무것도 올리지 않았습니다. 셋의 합은 어느 줄에서도 ${WALK.length} 입니다.`,
    ].join("\n");
  },

  /** 설계 선택 — 런 크기 M 을 바꿔 가며. */
  "build-memory-sweep": () => {
    const N = 10_000;
    const 값 = 생성식(N);
    const rows: string[][] = [];
    for (const M of [1, 10, 50, 99, 100, 500, 1_000, 10_000]) {
      const c = 한번에_합치기(값, M);
      rows.push([
        comma(M),
        comma(c.런),
        comma(c.최대_정수_칸),
        c.최대_정수_칸 <= M ? "넘지 않는다" : "넘는다",
        comma(c.합치기_비교),
        comma(c.읽은 + c.적은),
      ]);
    }
    let 가장작은M = 0;
    for (let M = 1; M <= N; M++) {
      if (메모리_칸(N, M) <= M) {
        가장작은M = M;
        break;
      }
    }
    return [
      md(
        [
          "메모리 M",
          "런 수 R",
          "메모리에 든 정수",
          "M 과의 관계",
          "합치기 비교",
          "정수 입출력",
        ],
        rows,
        [0, 1, 2, 4, 5],
      ),
      "",
      `정수 ${comma(N)} 개에서 M 을 1 부터 ${comma(N)} 까지 전부 재면, 메모리에 든 정수가 M 을 넘지 않는 가장 작은 M 은 ${comma(가장작은M)} 입니다. 정수 입출력은 모든 M 에서 ${comma(4 * N)} 입니다.`,
    ].join("\n");
  },

  /** 전개 1 — 읽개가 블록을 받고 정수를 내는 모습. */
  "walk-reader": () => {
    const lines: string[][] = [];
    const bytes = `${WALK.join("\n")}\n`.length;
    lines.push(["입력 파일", `${나열(WALK)}  (${bytes} 바이트)`]);
    for (const [i, r] of 읽개기록.entries()) {
      const 받은 = r.blocks.filter((b) => b > 0);
      const 끝 = r.blocks.filter((b) => b === 0).length;
      const 곁말 = [
        받은.length > 0 ? `블록 ${받은.join(" · ")} 바이트를 받았다` : "",
        끝 > 0 ? "스트림이 끝났다고 알렸다" : "",
      ]
        .filter((x) => x !== "")
        .join(" · ");
      lines.push([
        `next() ${i + 1} 번째`,
        `${r.value === null ? "null" : String(r.value)}${곁말 === "" ? "" : `   ← ${곁말}`}`,
      ]);
    }
    return columns(lines).join("\n");
  },

  /** 전개 2 — 런을 적는 순간의 두 조건. */
  "walk-trace-runs": () => {
    const 자리 = 런자리(RUNS);
    const rows = 런걸음().map((s) => {
      if (s.runIndex === null) {
        return [s.id, "아직 읽지 않았다", "-", "-", "-", "비어 있음"];
      }
      const i = s.runIndex;
      const [from, to] = 자리[i] as [number, number];
      const len = to - from + 1;
      return [
        s.id,
        나열(WALK.slice(from, to + 1)),
        `\`${len} === ${WALK_M}\` ${s.full ? "**참**" : "**거짓**"}`,
        s.full
          ? "-"
          : `\`value === null\` · \`${len} > 0\` ${s.tail ? "**참**" : "**거짓**"}`,
        s.갈래,
        s.runs.map((r, k) => `런 ${k} ${나열(r)}`).join(" · "),
      ];
    });
    return md(
      ["걸음", "메모리에 모은 값", "full", "tail", "갈래", "걸음 뒤 런 파일"],
      rows,
    );
  },

  /** 전개 2 — 런 파일 셋의 바이트와 내용. */
  "walk-runs": () => {
    const 입력_바이트 = `${WALK.join("\n")}\n`.length;
    const rows: string[][] = [["입력 파일", 나열(WALK), comma(입력_바이트)]];
    let 합 = 0;
    for (const [i, r] of RUNS.entries()) {
      const bytes = `${r.join("\n")}\n`.length;
      합 += bytes;
      rows.push([`out.run${i}`, 나열(r), comma(bytes)]);
    }
    return [
      md(["파일", "내용", "바이트"], rows, [2]),
      "",
      `런 파일 ${RUNS.length} 개의 바이트를 더하면 ${comma(합)}${josa(comma(합), "이라", "라")} 입력 파일과 같습니다. 정수 ${WALK.length} 개와 줄바꿈 ${WALK.length} 개입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 문자열 순서로 정렬하는 판. */
  "pause-string-order": () => 문자열정렬표,

  /** 짚고 가기 — 그 판이 만든 런을 정본의 런과 나란히. */
  "pause-string-order-runs": () => {
    const rows: string[][] = [];
    let 갈린 = 0;
    for (const 줄 of 정렬입력) {
      const 바른것 = 런내기(줄.값, 줄.M);
      const 문자열것 = 문자열_런(줄.값, 줄.M);
      for (const [i, r] of 바른것.entries()) {
        const s = 문자열것[i] as number[];
        if (나열(r) !== 나열(s)) 갈린++;
        rows.push([i === 0 ? 줄.이름 : "", `런 ${i}`, 나열(r), 나열(s)]);
      }
    }
    return [
      md(["입력", "런", "정본이 만든 런", "문자열 순서로 만든 런"], rows),
      "",
      `런 ${rows.length} 개 가운데 ${갈린} 개에서 두 열이 갈립니다. 한 자리 수만 든 런은 문자열 순서와 값 순서가 같고, 자릿수가 섞이는 순간 갈립니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 자투리를 안 적는 판. */
  "pause-tail": () => 자투리표,

  /** 전개 3 — 첫 값을 올린 뒤의 상태. */
  "walk-heap-init": () => {
    const s = 합치는걸음()[0] as 걸음;
    const 남은 = 남은값(s);
    return columns([
      ["최소 힙(꺼낼 차례)", 항목들(s.heap)],
      ["런에 남은 값", 남은.map((r, i) => `런 ${i} ${나열(r)}`).join(" · ")],
      [
        "메모리에 든 정수",
        `${s.메모리} 개 · 런 파일에 남은 정수 ${남은.flat().length} 개`,
      ],
    ]).join("\n");
  },

  /** 짚고 가기 — 런 전체를 최소 힙에 올리는 판. */
  "pause-heap-all": () => 전부올리기표,

  /** 짚고 가기 — 그 판이 메모리에 드는 정수. */
  "pause-heap-all-memory": () => {
    const rows = 전부올리기입력.map((줄) => {
      const 바른것 = 한번에_합치기(줄.값, 줄.M);
      const 전부 = 전부_올린_메모리(줄.값, 줄.M);
      return [
        줄.이름,
        comma(바른것.런),
        comma(바른것.최대_정수_칸),
        comma(전부.최대_정수_칸),
        배수(전부.최대_정수_칸, 바른것.최대_정수_칸),
      ];
    });
    return [
      md(
        [
          "입력",
          "런 수",
          "정본이 든 정수",
          "런 전체를 올린 판이 든 정수",
          "몇 배",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `과제 규모(정수 ${comma(과제_N)} 개 · 메모리 ${comma(과제_M)})에 식을 넣으면 정본은 ${comma(메모리_칸(과제_N, 과제_M))} 개, 이 판은 ${comma(과제_N)} 개를 듭니다.`,
    ].join("\n");
  },

  /** 전개 4 — 합치는 걸음마다 조건과 상태. */
  "walk-trace-merge": () => {
    const rows = 합치는걸음().map((s) => {
      if (s.out === null) {
        return [
          s.id,
          "-",
          "-",
          `런마다 첫 값 ${s.pushed.map((e) => e.value).join(" · ")}`,
          s.갈래,
          항목들(s.heap),
          나열(s.output),
        ];
      }
      const next = s.next ?? null;
      return [
        s.id,
        `${s.out.value}(런 ${s.out.run})`,
        `\`${next === null ? "null" : next} !== null\` ${next === null ? "**거짓**" : "**참**"}`,
        next === null ? "올리지 않는다" : `${next}(런 ${s.out.run})`,
        s.갈래,
        항목들(s.heap),
        나열(s.output),
      ];
    });
    return md(
      [
        "걸음",
        "꺼낸 값",
        "next !== null",
        "올린 값",
        "갈래",
        "걸음 뒤 최소 힙(꺼낼 차례)",
        "출력 파일",
      ],
      rows,
    );
  },

  /** 전개 4 — 라벨 넷이 실행된 걸음. */
  "walk-labels": () => {
    const 걸음id = (f: (s: 걸음) => boolean): string =>
      WALK_걸음.filter(f)
        .map((s) => s.id)
        .join(" ") || "-";
    const rows = [
      ["①", "메모리가 찼다 — 런을 적는다", 걸음id((s) => s.full === true)],
      [
        "②",
        "입력이 끝났고 값이 남았다 — 자투리 런을 적는다",
        걸음id((s) => s.tail === true && s.full === false),
      ],
      ["③", "런마다 첫 값 하나씩 올린다", 걸음id((s) => s.갈래 === "③")],
      ["④", "꼭대기를 적고 그 런에서 올린다", 걸음id((s) => s.갈래 === "④")],
    ];
    const 참 = 걸음id((s) => s.갈래 === "④" && s.next !== null);
    const 거짓 = 걸음id((s) => s.갈래 === "④" && s.next === null);
    return [
      md(["라벨", "하는 일", "실행된 걸음"], rows),
      "",
      `라벨 넷이 모두 실행됐습니다. ④ 에서 \`next !== null\` 은 ${참} 에서 참이고 ${거짓} 에서 거짓입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 출력 파일을 미리 비우지 않는 판. */
  "pause-truncate": () => 비우기표,

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const rows = 결과입력.map(([이름, 값, M]) => [
      이름,
      comma(M),
      comma(런수(값.length, M)),
      나열(결과답.get(이름) ?? []),
    ]);
    return md(["입력", "메모리 M", "런 수", "출력 파일의 내용"], rows, [1, 2]);
  },

  /** 알아 두면 좋은 개념 — 스트림이 한 번에 주는 바이트. */
  "related-block": () => {
    const 정수당 = 블록입력_바이트 / 대조_N;
    return [
      md(
        [
          "파일",
          "파일 바이트",
          "받은 블록 수",
          "블록마다 바이트",
          "블록 하나에 든 정수",
        ],
        [
          [
            `정수 ${comma(대조_N)} 개`,
            comma(블록입력_바이트),
            comma(블록크기.length),
            블록크기.map(comma).join(" · "),
            comma(Math.floor(블록_바이트 / 정수당)),
          ],
          [
            `런 하나(정수 ${comma(과제_M)} 개)`,
            comma(런파일_내용.length),
            comma(런블록.length),
            런블록.map(comma).join(" · "),
            comma(과제_M),
          ],
        ],
        [1, 2, 4],
      ),
      "",
      `스트림은 파일을 많아야 ${comma(블록_바이트)} 바이트씩 줍니다. 그보다 작은 파일은 블록 하나로 통째로 옵니다.`,
    ].join("\n");
  },

  /** 알아 두면 좋은 개념 — 과제 규모에서 읽개들이 쥐는 블록. */
  "related-buffers": () => {
    const 런바이트 = 과제_런_바이트();
    if (런블록.length !== 1) {
      throw new Error("과제 규모의 런 파일이 블록 하나로 오지 않았다");
    }
    if (Math.max(...런바이트) > 블록_바이트) {
      throw new Error(
        "블록 하나보다 큰 런 파일이 있다 — 아래 문장이 거짓이 된다",
      );
    }
    const 쥔 = 런바이트.reduce((s, b) => s + Math.min(b, 블록_바이트), 0);
    return [
      md(
        [
          "런 수",
          "가장 큰 런 파일",
          "읽개들이 처음 받는 바이트 합",
          "정수 M 개를 8 바이트로 잡은 크기",
        ],
        [
          [
            comma(런바이트.length),
            comma(Math.max(...런바이트)),
            comma(쥔),
            comma(8 * 과제_M),
          ],
        ],
        [0, 1, 2, 3],
      ),
      "",
      `런 파일이 모두 블록 하나(${comma(블록_바이트)} 바이트)보다 작아서, 합치기를 시작하며 읽개마다 첫 next() 를 부르는 순간 런 파일 ${comma(런바이트.length)} 개가 통째로 메모리에 들어옵니다. 그 합 ${comma(쥔)} 바이트는 입력 파일 전체의 바이트와 같습니다.`,
    ].join("\n");
  },

  /** 경쟁 설계와 나란히 — 여섯 축. */
  "alt-counts": () => {
    const 줄들: [string, number, number][] = [
      ["정수 입출력", 한번에_입출력, 여러바퀴_입출력],
      ["합치기 비교", 한번에.합치기_비교, 여러바퀴.합치기_비교],
      ["메모리에 든 정수", 한번에.최대_정수_칸, 여러바퀴.최대_정수_칸],
      ["동시에 연 런 파일", 한번에.연_런_파일, 여러바퀴.연_런_파일],
      ["합치기 바퀴 수", 한번에.합치기_바퀴, 여러바퀴.합치기_바퀴],
      ["런 정렬 비교", 한번에.정렬_비교, 여러바퀴.정렬_비교],
    ];
    const rows = 줄들.map(([이름, a, b]) => [
      이름,
      comma(a),
      comma(b),
      a === b ? "같다" : a < b ? "한 번에" : "여러 바퀴",
      배수(Math.max(a, b), Math.min(a, b)),
    ]);
    return [
      md(
        [
          "계수",
          "런을 한 번에 합치기",
          "두 런씩 여러 바퀴 합치기",
          "적은 쪽",
          "몇 배",
        ],
        rows,
        [1, 2, 4],
      ),
      "",
      `정수 ${comma(대조_N)} 개 · 메모리 ${comma(대조_M)} · 런 수 ${comma(한번에.런)} 에서 잰 값입니다. 경쟁 설계가 한 바퀴에 합치는 런 수는 ${대조_k} 개입니다.`,
    ].join("\n");
  },

  /** 두 축을 하나로 환산했을 때 뒤집히는 자리. */
  "alt-exchange": () => {
    const rows: string[][] = [];
    for (const c of [0, 100, 250, 경계c - 1, 경계c, 1_000, 10_000]) {
      const a = 한번에_입출력 * c + 한번에.합치기_비교 * 1000;
      const b = 여러바퀴_입출력 * c + 여러바퀴.합치기_비교 * 1000;
      rows.push([
        `${comma(c)}/1000`,
        comma(a),
        comma(b),
        a < b ? "한 번에" : "여러 바퀴",
      ]);
    }
    const 경계 = `${comma(경계c)}/1000`;
    return [
      md(
        [
          "정수 입출력 한 번의 무게(비교 기준)",
          "런을 한 번에 합치기",
          "두 런씩 여러 바퀴 합치기",
          "적은 쪽",
        ],
        rows,
        [0, 1, 2],
      ),
      "",
      `가운데 두 열은 비교 횟수를 1000 배 한 정수라 나눗셈이 한 번도 없습니다. 순서가 뒤집히는 첫 자리는 ${경계}${josa(경계, "이고", "고")}, 그 앞 ${comma(경계c - 1)}/1000 까지는 여러 바퀴 쪽이 적습니다.`,
    ].join("\n");
  },

  /** 수식 — 정의를 전개 입력에 넣은 검산. */
  "math-verify": () => {
    const N = WALK.length;
    const M = WALK_M;
    const R = 런수(N, M);
    const s = 합치는걸음().at(-1) as 걸음;
    const 최대 = Math.max(...WALK_걸음.map((x) => x.메모리));
    return columns([
      [
        `R(${M}) = ⌈${N}/${M}⌉ = ${R}`,
        `런 파일 ${RUNS.length} 개가 만들어졌다`,
      ],
      [
        `Mem(${M}) = max(${M}, ${R}) = ${메모리_칸(N, M)}`,
        `전개에서 메모리에 든 정수의 최댓값도 ${최대}${josa(최대, "이다", "다")}`,
      ],
      [
        `IO = 4 × ${N} = ${4 * N}`,
        `전개가 읽은 ${s.읽은} 개와 적은 ${s.적은} 개를 더한 값이다`,
      ],
    ]).join("\n");
  },

  /** 닫힌 형태와 실측 대조. */
  "math-check": () => {
    const rows: string[][] = [];
    for (const [N, M] of [
      [8, 3],
      [9, 3],
      [1_000, 32],
      [10_000, 100],
      [10_000, 1],
    ] as [number, number][]) {
      const 값 = N === 8 ? WALK : 생성식(N);
      const c = 한번에_합치기(값, M);
      rows.push([
        comma(N),
        comma(M),
        comma(c.런),
        comma(런수(N, M)),
        comma(c.최대_정수_칸),
        comma(메모리_칸(N, M)),
        comma(c.읽은 + c.적은),
        comma(4 * N),
      ]);
    }
    const 다른 = rows.filter(
      (r) => r[2] !== r[3] || r[4] !== r[5] || r[6] !== r[7],
    ).length;
    return [
      md(
        [
          "N",
          "M",
          "실측 R",
          "식 ⌈N/M⌉",
          "실측 메모리",
          "식 max(M, R)",
          "실측 입출력",
          "식 4N",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6, 7],
      ),
      "",
      `${rows.length} 줄 가운데 실측과 식이 한 쌍이라도 다른 줄은 ${다른} 줄입니다.`,
    ].join("\n");
  },

  /** 한 바퀴 합치기가 M 안에 드는 가장 작은 M 과 √N. */
  "math-sqrt": () => {
    const rows: string[][] = [];
    for (const N of [100, 10_000, 1_000_000, 과제_N]) {
      let 가장작은 = Number.POSITIVE_INFINITY;
      let 가장작은M = 0;
      let 드는M = 0;
      for (let M = 1; M <= N; M++) {
        const m = 메모리_칸(N, M);
        if (m < 가장작은) {
          가장작은 = m;
          가장작은M = M;
        }
        if (드는M === 0 && m <= M) 드는M = M;
        // 드는 M 을 찾은 뒤로는 메모리가 M 과 같아 더 줄지 않는다.
        if (드는M !== 0 && M > 드는M + 1) break;
      }
      rows.push([
        comma(N),
        comma(가장작은M),
        comma(가장작은),
        comma(드는M),
        comma(Math.ceil(Math.sqrt(N))),
        Math.sqrt(N).toFixed(4),
      ]);
    }
    const 같은 = rows.filter((r) => r[2] === r[4] && r[3] === r[4]).length;
    const 하나작은 = rows.filter((r) => r[1] !== r[4]).length;
    return [
      md(
        [
          "N",
          "메모리가 가장 적은 M",
          "그때 메모리",
          "Mem(M) ≤ M 인 가장 작은 M",
          "⌈√N⌉",
          "√N",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 규모 가운데 ${같은} 규모에서 셋째 열과 넷째 열이 모두 ⌈√N⌉ 과 같습니다. 둘째 열이 ⌈√N⌉ 과 다른 규모는 ${하나작은} 규모입니다.`,
    ].join("\n");
  },

  /** 불변식 — 걸음마다 값이 어디에 있는가. */
  "invariant-places": () => {
    const rows = 합치는걸음().map((s) => {
      const 남은 = 남은값(s);
      const n = s.heap.length + 남은.flat().length + s.output.length;
      return [
        s.id,
        s.heap.map((e) => e.value).join(" ") || "비어 있음",
        남은.map(나열).join(" · "),
        나열(s.output),
        comma(n),
      ];
    });
    const 다른 = rows.filter((r) => r[4] !== comma(WALK.length)).length;
    return [
      md(
        [
          "걸음",
          "최소 힙(꺼낼 차례)",
          "런 0 · 런 1 · 런 2 에 남은 값",
          "출력 파일",
          "개수의 합",
        ],
        rows,
        [4],
      ),
      "",
      `${rows.length} 걸음 가운데 개수의 합이 ${WALK.length}${이가(WALK.length)} 아닌 걸음은 ${다른} 걸음입니다.`,
    ].join("\n");
  },

  /** 경계 입력들. */
  "invariant-values": () => {
    const rows = 경계입력.map(([이름, , M, 사유]) => [
      이름,
      comma(M),
      나열(경계답.get(이름) ?? []),
      사유,
    ]);
    return md(
      ["입력", "메모리 M", "출력 파일의 내용", "경계인 까닭"],
      rows,
      [1],
    );
  },

  /** 걸음마다 세 성질을 실행이 판정한 결과. */
  "invariant-steps": () => {
    let 총걸음 = 0;
    const rows = 불변식입력.map(([이름], i) => {
      const r = 불변식결과[i] as ReturnType<typeof 불변식_판정>;
      총걸음 += r.걸음;
      return [
        이름,
        comma(r.걸음),
        comma(r.오름차순_깨짐),
        comma(r.합_어긋남),
        comma(r.꼭대기_어긋남),
      ];
    });
    const 깨진 = 불변식결과.reduce(
      (s, r) => s + r.오름차순_깨짐 + r.합_어긋남 + r.꼭대기_어긋남,
      0,
    );
    return [
      md(
        [
          "입력 묶음",
          "확인한 걸음",
          "순서가 깨진 걸음",
          "자리가 어긋난 걸음",
          "꼭대기가 최솟값이 아닌 걸음",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `기록판이 낸 걸음 ${comma(총걸음)} 개에서 세 성질이 깨진 자리는 모두 ${comma(깨진)} 곳입니다.`,
    ].join("\n");
  },

  /** 불변식을 지키던 줄을 바꾸면. */
  "mutant-refill": () => 되채우기표,

  /** 총식과 실측. */
  "perf-ops": () => {
    const rows = 비용입력.map(([이름, 값, M]) => {
      const c = 한번에_합치기(값, M);
      return [
        이름,
        comma(M),
        comma(c.런),
        comma(c.읽은),
        comma(c.적은),
        comma(c.읽은 + c.적은),
        comma(4 * 값.length),
        comma(c.정렬_비교),
        comma(c.합치기_비교),
      ];
    });
    const 같은 = rows.filter((r) => r[5] === r[6]).length;
    return [
      md(
        [
          "입력",
          "메모리 M",
          "런 수 R",
          "읽은 정수",
          "적은 정수",
          "정수 입출력",
          "식 4N",
          "런 정렬 비교",
          "합치기 비교",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7, 8],
      ),
      "",
      `${rows.length} 줄 가운데 ${같은} 줄에서 정수 입출력이 4N 과 같습니다. 읽은 정수와 적은 정수가 각각 2N 입니다.`,
    ].join("\n");
  },

  /** 최악을 만드는 입력. */
  "perf-worst": () => {
    const rows = 최악후보.map(([이름, 값, M]) => {
      const c = 한번에_합치기(값, M);
      return [
        이름,
        comma(M),
        comma(c.런),
        comma(c.읽은 + c.적은),
        comma(c.합치기_비교),
        comma(c.최대_정수_칸),
      ];
    });
    const io = new Set(rows.map((r) => r[3]));
    const 같은값 = rows[0]?.[3] ?? "";
    const 가장큰 = rows.reduce((a, b) =>
      Number((b[4] ?? "0").replaceAll(",", "")) >
      Number((a[4] ?? "0").replaceAll(",", ""))
        ? b
        : a,
    );
    return [
      md(
        [
          "후보",
          "메모리 M",
          "런 수 R",
          "정수 입출력",
          "합치기 비교",
          "메모리에 든 정수",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${rows.length} 줄에서 정수 입출력은 ${io.size === 1 ? `모두 ${같은값}${으로(같은값)} 같습니다` : "갈립니다"}. 합치기 비교가 가장 많은 줄은 「${가장큰[0]}」입니다.`,
    ].join("\n");
  },

  /** 스스로 점검하기의 답. */
  "check-answer": () => {
    const rows = [2, 3, 4].map((M) => {
      const c = 한번에_합치기(WALK, M);
      return [
        comma(M),
        comma(c.런),
        comma(c.최대_정수_칸),
        comma(c.읽은 + c.적은),
        comma(c.합치기_비교),
      ];
    });
    const 뿌리 = Math.ceil(Math.sqrt(WALK.length));
    return [
      md(
        [
          "메모리 M",
          "런 수 R",
          "메모리에 든 정수",
          "정수 입출력",
          "합치기 비교",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `정수 ${WALK.length} 개짜리 전개 입력에서 잰 값입니다. 메모리에 든 정수가 가장 적은 M 은 ${뿌리}${josa(뿌리, "이고", "고")}, 그 값이 ⌈√${WALK.length}⌉${과와(WALK.length)} 같습니다.`,
    ].join("\n");
  },
};
