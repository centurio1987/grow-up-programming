/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 합치기 안의 비교 하나하나는 그림 사이드카의 `run`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/sortArray/sortArray-guide.md
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  A6,
  closedForm,
  comparisons,
  FIRST,
  HALVE,
  lastMerge,
  levels,
  type MergeEvent,
  mergeRef,
  mergesOf,
  N,
  num,
  permutations,
  run,
  SPLITS,
  scale,
  secondsOf,
  selectionCount,
  selectionRounds,
  show,
  sortWith,
  splitsOf,
  walkSteps,
  worstCount,
  worstInput,
} from "./sortArray-guide.fig.tsx";
import { sortArray } from "./sortArray-guide.ref.ts";

const REF = new URL("./sortArray-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 표 그리기 ───────────────────────── */

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

/** 증명 표 — 표 아래 문장까지 사이드카가 낸다. 원고는 그 뒤를 `<!--/proof-->` 로 닫는다(SPEC §12). */
const proofTable = (table: string, sentence?: string): string =>
  [table, ...(sentence === undefined ? [] : ["", sentence])].join("\n");

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 글자 폭으로 칸을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 칸을 맞춘 줄들. 열 사이는 세 칸이다. */
function columns(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(...rows.map((r) => (r.length > 1 ? width(r[c] ?? "") : 0))),
    );
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) =>
          c === r.length - 1 ? cell : pad(cell, w[c] as number),
        )
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** 「세 벌」 처럼 세는 말. 열까지만 쓰고 그 위는 숫자로 둔다. */
const countWord = (n: number): string =>
  ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"][
    n
  ] ?? String(n);

const branch = (left: boolean): string => (left ? "②" : "③");
const tailMark = (m: MergeEvent): string => (m.tail.side === "L" ? "④" : "⑤");
const lastOf = (xs: readonly number[]): number => xs.at(-1) as number;

/** 반복이 끝났을 때의 머리 자리와 반복이 담은 값. */
function loopEnd(m: MergeEvent): { i: number; j: number; out: number[] } {
  const last = m.cmps.at(-1);
  return {
    i: (last?.i ?? 0) + (last?.left ? 1 : 0),
    j: (last?.j ?? 0) + (last?.left ? 0 : 1),
    out: m.cmps.map((c) => (c.left ? c.a : c.b)),
  };
}

/** 칸 수만으로 정한 층 수 — 조각 크기가 1 이 될 때까지 가른 횟수. */
function depthOf(split: (n: number) => number, n: number): number {
  let depth = 0;
  let m = n;
  while (m > 1) {
    const p = Math.min(Math.max(1, split(m)), m - 1);
    m = Math.max(p, m - p);
    depth++;
  }
  return depth;
}

// 칸 수만으로 센 층 수가 정본 기록의 층 수와 같은가 — 전개 입력으로 확인한다.
if (levels(run(A6)).length - 1 !== depthOf(HALVE, A6.length)) {
  throw new Error("층 수가 정본 기록과 다르다");
}

/* ───────────────────────── 전체 컨셉 ───────────────────────── */

/** 이미 오름차순인 두 조각을 한 번 지나가며 합친다 — 정본의 마지막 합치기. */
function conceptMerge(): string {
  const m = lastMerge();
  const out: number[] = [];
  const rows = m.cmps.map((c) => {
    const taken = c.left ? c.a : c.b;
    out.push(taken);
    return [
      `${c.a} · ${c.b}`,
      `${taken} (${c.left ? "왼쪽" : "오른쪽"})`,
      show(out),
    ];
  });
  out.push(...m.tail.values);
  rows.push([
    `${m.tail.side === "L" ? "오른쪽" : "왼쪽"} 조각이 비었다`,
    `남은 ${m.tail.values.join(" ")}`,
    show(out),
  ]);
  return proofTable(
    md(["두 조각의 맨 앞", "꺼낸 값", "결과"], rows),
    `비교 ${m.cmps.length} 번으로 여섯 칸이 모두 결과에 들어갔고, 결과 ${show(out)}${josa(lastOf(out), "은", "는")} 정본의 답과 일치합니다.`,
  );
}

function conceptDepth(): string {
  const s = scale();
  return proofTable(
    md(
      ["가르는 방법", `칸 ${num(N)} 개의 층 수`, "최악 비교"],
      [
        ["반씩 가른다", num(depthOf(HALVE, N)), num(s.merge)],
        ["한 칸씩 뗀다", num(depthOf(FIRST, N)), num(s.peel)],
      ],
      [1, 2],
    ),
    "층 수는 조각이 한 칸이 될 때까지 가른 횟수입니다. 반씩 가르는 쪽의 최악 비교는 최악 입력을 만들어 정본으로 실제로 세었습니다.",
  );
}

/* ───────────────── 아이디어를 떠올리는 과정 ───────────────── */

function originCost(): string {
  const s = scale();
  return proofTable(
    md(
      ["방법", `칸 ${num(N)} 개의 비교`, "시간(초당 1 억 번)"],
      [["선택 정렬", num(s.selection), secondsOf(s.selection)]],
      [1, 2],
    ),
    "선택 정렬은 바퀴마다 남은 칸을 전부 비교하므로 비교 횟수가 입력과 무관하게 n(n−1)/2 이고, 칸 1 개부터 200 개까지 실제로 세어 이 식과 대조했습니다.",
  );
}

function originSelection(): string {
  const rounds = selectionRounds(A6);
  const rows = rounds.map((r, k) => [
    String(k + 1),
    String(r.compares),
    String(r.min),
    show(r.after),
  ]);
  const total = rounds.reduce((s, r) => s + r.compares, 0);
  return proofTable(
    md(
      ["바퀴", "비교", "그 자리에 놓은 값", "바퀴가 끝난 배열"],
      rows,
      [0, 1, 2],
    ),
    `비교는 ${rounds.map((r) => r.compares).join(" + ")} = ${total} 번입니다.`,
  );
}

function originMergeOnce(): string {
  const m = lastMerge();
  const sel = selectionRounds(A6).reduce((s, r) => s + r.compares, 0);
  return proofTable(
    md(
      ["방법", "비교"],
      [
        [
          `이미 오름차순인 ${show(m.L)}${과와(lastOf(m.L))} ${show(m.R)}${을를(lastOf(m.R))} 합치기`,
          String(m.cmps.length),
        ],
        [`선택 정렬로 ${show(A6)}${을를(lastOf(A6))} 처음부터`, String(sel)],
      ],
      [1],
    ),
  );
}

/** (가) 한 칸씩 떼어 합치기 · (나) 반씩 갈라 합치기 — 같은 입력의 합치기 순서. */
function originTwoWays(): string {
  const peel = sortWith(FIRST, A6);
  const half = mergesOf(run(A6));
  const hTotal = half.reduce((s, m) => s + m.cmps.length, 0);
  if (sortWith(HALVE, A6).count !== hTotal) {
    throw new Error("반씩 가르는 절차가 정본과 다른 비교 횟수를 냈다");
  }
  const rows = peel.merges.map((m, k) => {
    const h = half[k] as MergeEvent;
    return [
      String(k + 1),
      `${show(m.L)} + ${show(m.R)} → ${show(m.out)}`,
      String(m.count),
      `${show(h.L)} + ${show(h.R)} → ${show(h.out)}`,
      String(h.cmps.length),
    ];
  });
  return proofTable(
    md(
      [
        "순서",
        "(가) 한 칸씩 떼어 합치기",
        "비교",
        "(나) 반씩 갈라 합치기",
        "비교",
      ],
      rows,
      [0, 2, 4],
    ),
    `(가) 는 비교 ${peel.count} 번, (나) 는 ${hTotal} 번이고, 답은 둘 다 ${show(peel.out)} 입니다.`,
  );
}

function originSizes(): string {
  const peel = sortWith(FIRST, A6).merges.map((m) => m.L.length + m.R.length);
  const half = mergesOf(run(A6)).map((m) => m.L.length + m.R.length);
  const bound = (xs: number[]) => xs.reduce((s, x) => s + x - 1, 0);
  return proofTable(
    md(
      ["방식", "합치기마다 두 조각의 칸 수 합", "(칸 수 합 − 1) 의 합"],
      [
        ["(가) 한 칸씩 떼어 합치기", peel.join(" · "), String(bound(peel))],
        ["(나) 반씩 갈라 합치기", half.join(" · "), String(bound(half))],
      ],
      [2],
    ),
    `합치기 횟수는 둘 다 ${countWord(peel.length)} 번이고, 칸 수 합이 어떻게 흩어졌는가만 다릅니다.`,
  );
}

function originPeel(): string {
  const rows = [A6.length, 64, N].map((n) => [
    num(n),
    num(worstCount(FIRST, n)),
    num(selectionCount(n)),
  ]);
  return proofTable(
    md(
      ["칸 수 n", "한 칸씩 떼어 합치기의 최악 비교", "선택 정렬의 비교"],
      rows,
      [0, 1, 2],
    ),
    "한 칸씩 떼는 쪽의 최악은 합치기마다 (칸 수 합 − 1) 번을 더한 값이고, 칸 7 개까지는 모든 순열을 넣어 실제 최댓값과 대조했습니다.",
  );
}

/* ───────────────────────── 아이디어 상세 ───────────────────────── */

/** 합치기 한 번의 자취 — 비교마다 머리 자리 · 머리 값 · 꺼낸 쪽 · 결과. */
function mergeTrace(m: MergeEvent): string[][] {
  const out: number[] = [];
  return m.cmps.map((c) => {
    out.push(c.left ? c.a : c.b);
    return [
      String(c.i),
      String(c.j),
      String(c.a),
      String(c.b),
      `${c.a} ${c.left ? "≤" : ">"} ${c.b} → ${c.left ? "L" : "R"}`,
      show(out),
    ];
  });
}

function buildMergeEasy(): string {
  const m = lastMerge();
  const end = loopEnd(m);
  return proofTable(
    md(["i", "j", "L[i]", "R[j]", "비교", "out"], mergeTrace(m), [0, 1, 2, 3]),
    `i 가 ${end.i}${이가(end.i)} 되어 L 을 다 쓰면서 반복이 끝나고, R 에 남은 ${m.tail.values.join(" ")}${을를(lastOf(m.tail.values))} 이어 붙여 ${show(m.out)}${이가(lastOf(m.out))} 됩니다.`,
  );
}

/** 한쪽이 훨씬 일찍 비는 합치기 — 전개 입력에서 실제로 나오는, 왼쪽에 값이 남는 합치기. */
function earlyMerge(): MergeEvent {
  const m = mergesOf(run(A6)).find((x) => x.tail.side === "L");
  if (m === undefined) throw new Error("왼쪽이 남는 합치기가 전개 입력에 없다");
  return m;
}

function buildMergeEarly(): string {
  const m = earlyMerge();
  const end = loopEnd(m);
  return proofTable(
    md(["i", "j", "L[i]", "R[j]", "비교", "out"], mergeTrace(m), [0, 1, 2, 3]),
    `j 가 ${end.j}${이가(end.j)} 되어 R 을 다 쓰면서 반복이 끝났을 때 out 은 ${show(end.out)} 이고, L 에 ${m.tail.values.join(" ")}${이가(lastOf(m.tail.values))} 남아 있습니다. 이것을 이어 붙여야 ${show(m.out)}${이가(lastOf(m.out))} 됩니다.`,
  );
}

function buildSplit(): string {
  const seen = new Map<number, { seg: number[]; mid: number }>();
  for (const input of [A6, [3, 1, 4, 1, 5, 9, 2]]) {
    for (const s of splitsOf(run(input))) {
      const n = s.hi - s.lo + 1;
      if (!seen.has(n)) {
        seen.set(n, { seg: s.after.slice(s.lo, s.hi + 1), mid: s.mid });
      }
    }
  }
  const rows = [...seen.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([n, { seg, mid }]) => [
      show(seg),
      String(n),
      String(mid),
      show(seg.slice(0, mid)),
      show(seg.slice(mid)),
    ]);
  return proofTable(
    md(
      ["조각", "칸 수 n", "mid = n >> 1", "왼쪽 조각", "오른쪽 조각"],
      rows,
      [1, 2],
    ),
    "칸 수가 홀수인 조각에서는 왼쪽 조각이 오른쪽보다 한 칸 적습니다.",
  );
}

function buildLevelSum(): string {
  const r = run(A6);
  const merges = mergesOf(r);
  const rows: string[][] = [];
  for (const [d, pieces] of levels(r).entries()) {
    const ms = merges.filter((m) => m.depth === d);
    if (ms.length === 0) continue;
    const cells = pieces.reduce((s, p) => s + p.hi - p.lo + 1, 0);
    rows.push([
      `${d} 층`,
      ms.map((m) => `${show(m.L)} + ${show(m.R)}`).join(" · "),
      String(ms.reduce((s, m) => s + m.cmps.length, 0)),
      String(ms.reduce((s, m) => s + m.hi - m.lo, 0)),
      String(cells),
    ]);
  }
  const total = merges.reduce((s, m) => s + m.cmps.length, 0);
  return proofTable(
    md(
      [
        "층",
        "그 층의 합치기",
        "비교",
        "상한 (칸 수 − 1 의 합)",
        "그 층의 칸 수",
      ],
      rows,
      [2, 3, 4],
    ),
    `합치기가 있는 층은 ${countWord(rows.length)} 개이고 비교는 모두 ${total} 번입니다. 어느 층도 비교가 그 층의 칸 수 ${A6.length}${을를(A6.length)} 넘지 않습니다.`,
  );
}

function buildDepth(): string {
  const rows = [A6.length, 8, 64, N].map((n) => [
    num(n),
    num(depthOf(HALVE, n)),
    num(Math.ceil(Math.log2(n))),
    num(n * depthOf(HALVE, n)),
    num(worstCount(HALVE, n)),
  ]);
  return proofTable(
    md(
      ["칸 수 n", "합치는 층 수", "⌈log₂ n⌉", "층 수 × 칸 수", "최악 비교"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "합치는 층 수는 칸 수만 보고 가르는 규칙대로 센 값이고, 최악 비교는 합치기마다 (칸 수 합 − 1) 번을 더한 값입니다.",
  );
}

function premiseUnsorted(): string {
  const cases: [number[], number[]][] = [
    [
      [2, 5],
      [1, 3],
    ],
    [
      [5, 2],
      [1, 3],
    ],
  ];
  const asc = (xs: readonly number[]) =>
    xs.every((v, k) => k === 0 || (xs[k - 1] as number) <= v)
      ? "오름차순"
      : "오름차순 아님";
  const rows = cases.map(([L, R]) => {
    const out = mergeRef(L, R);
    return [show(L), show(R), asc(L), show(out), asc(out)];
  });
  return proofTable(
    md(["L", "R", "L 의 정렬 상태", "merge 결과", "결과의 정렬 상태"], rows),
  );
}

const SIZES = [8, 16, 64];

function splitChoice(): string {
  const rows = SPLITS.map(([name, split]) => [
    name,
    ...SIZES.map((n) => num(worstCount(split, n))),
  ]);
  rows.push([
    "n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1",
    ...SIZES.map((n) => num(closedForm(n))),
  ]);
  const matches = SIZES.every((n) => closedForm(n) === worstCount(HALVE, n));
  return proofTable(
    md(["가르는 자리", ...SIZES.map((n) => `n = ${n}`)], rows, [1, 2, 3]),
    `한가운데로 가르는 줄이 세 칸 수 모두에서 가장 작고, 그 값이 마지막 줄의 식과 ${matches ? "하나하나 일치합니다" : "어긋납니다"}. 칸 7 개까지는 모든 순열을 넣어 실제 최댓값과 대조했습니다.`,
  );
}

function splitMax(): string {
  const n = A6.length;
  const rows: string[][] = [];
  for (let mid = 1; mid < n; mid++) {
    rows.push([String(mid), String(n - mid), String(Math.max(mid, n - mid))]);
  }
  const best = Math.min(...rows.map((r) => Number(r[2])));
  return proofTable(
    md(["mid", `${n} − mid`, "다음 층의 가장 큰 조각"], rows, [0, 1, 2]),
    `다음 층의 가장 큰 조각은 mid = ${n >> 1} 에서 ${best} 칸으로 가장 작습니다.`,
  );
}

/* ───────────────────── 수행으로 알아보는 알고리즘 ───────────────────── */

function walkInput(): string {
  const out = sortArray([...A6]);
  return [
    `const A = [${A6.join(", ")}];`,
    `// 이 절이 끝나면 [${out.join(", ")}] 이 나와야 한다`,
  ].join("\n");
}

function walkMergeTrace(): string {
  const { merge } = walkSteps();
  const m = lastMerge();
  const out: number[] = [];
  const rows = m.cmps.map((c, k) => {
    out.push(c.left ? c.a : c.b);
    return [
      (merge[k] as { id: string }).id,
      String(c.i),
      String(c.j),
      `\`${c.a} <= ${c.b}\` ${c.left ? "**참**" : "**거짓**"}`,
      branch(c.left),
      show(out),
    ];
  });
  const end = loopEnd(m);
  out.push(...m.tail.values);
  const stop =
    m.tail.side === "R"
      ? `\`${end.i} < ${m.L.length}\` **거짓** → 반복이 끝난다`
      : `\`${end.j} < ${m.R.length}\` **거짓** → 반복이 끝난다`;
  rows.push([
    (merge.at(-1) as { id: string }).id,
    String(end.i),
    String(end.j),
    stop,
    tailMark(m),
    show(out),
  ]);
  return proofTable(
    md(["단계", "i", "j", "조건 판정", "갈래", "out"], rows, [1, 2]),
  );
}

function walkTail(): string {
  const lines: string[][] = [];
  for (const m of [lastMerge(), earlyMerge()]) {
    const end = loopEnd(m);
    lines.push([
      `${show(m.L)} + ${show(m.R)}`,
      `반복이 끝난 out ${show(end.out)}, i = ${end.i}, j = ${end.j}`,
    ]);
    lines.push([
      "",
      `${tailMark(m)} 가 ${m.tail.values.join(" ")}${을를(lastOf(m.tail.values))} 잇는다 → ${show(m.out)}`,
    ]);
  }
  return columns(lines);
}

function walkCalls(): string {
  const r = run(A6);
  const rows: string[][] = [];
  const rec = (lo: number, hi: number, depth: number): void => {
    const seg = r.input.slice(lo, hi + 1);
    const n = hi - lo + 1;
    if (n <= 1) {
      rows.push([
        String(rows.length + 1),
        String(depth),
        `sortArray(${show(seg)})`,
        "칸이 하나 → ① 복사본",
      ]);
      return;
    }
    const mid = n >> 1;
    rows.push([
      String(rows.length + 1),
      String(depth),
      `sortArray(${show(seg)})`,
      `mid = ${mid} → ${show(seg.slice(0, mid))} · ${show(seg.slice(mid))}`,
    ]);
    rec(lo, lo + mid - 1, depth + 1);
    rec(lo + mid, hi, depth + 1);
  };
  rec(0, A6.length - 1, 0);
  if (rows.length !== splitsOf(r).length + r.bases) {
    throw new Error("부름 수가 정본 기록과 다르다");
  }
  return proofTable(
    md(["부른 순서", "깊이", "부름", "하는 일"], rows, [0, 1]),
    `부름은 ${rows.length} 번이고, 그중 칸이 하나인 부름이 ${r.bases} 번, 합치기가 ${mergesOf(r).length} 번입니다.`,
  );
}

/* ───────── 같은 값을 만났을 때 어느 쪽을 먼저 꺼내는가 ───────── */

const COMPARE_LINE =
  /^(\s*)if \(\(L\[i\] as number\) <= \(R\[j\] as number\)\) \{$/;

type Sorter = { sortArray(A: number[]): number[] };

/** 머리가 같을 때 오른쪽을 먼저 꺼내는 사본. */
const strict = await loadMutant<Sorter>(REF, {
  swap: [COMPARE_LINE, "$1if ((L[i] as number) < (R[j] as number)) {"],
});

/** 값을 `반 * 1000 + 점수` 로 읽고 **점수만** 비교하는 사본. */
const byScore = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if (((L[i] as number) % 1000) <= ((R[j] as number) % 1000)) {",
  ],
});

/** 같은 점수에서 오른쪽을 먼저 꺼내는 사본. */
const byScoreStrict = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if (((L[i] as number) % 1000) < ((R[j] as number) % 1000)) {",
  ],
});

/** 같은 값이 들어 있는 입력. */
const TIE_CASES: number[][] = [
  [3, 1, 4, 1, 5, 9, 2, 6],
  [2, 2, 2, 1, 1, 1, 3, 3],
  [7, 7, 7, 7],
];

/** `반 * 1000 + 점수`. 40 점 둘은 3반이 먼저, 50 점 둘은 2반이 먼저 들어 있다. */
const SCORED = [2050, 1050, 3040, 1040];

function stableTie(): string {
  const agree = TIE_CASES.filter(
    (A) => show(sortArray([...A])) === show(strict.sortArray([...A])),
  ).length;
  return proofTable(
    md(
      ["입력", "L[i] <= R[j]", "L[i] < R[j]"],
      TIE_CASES.map((A) => [
        show(A),
        show(sortArray([...A])),
        show(strict.sortArray([...A])),
      ]),
    ),
    agree === TIE_CASES.length
      ? `${countWord(agree)} 벌 모두 두 코드의 결과 배열이 일치합니다.`
      : `${countWord(TIE_CASES.length)} 벌 중 ${agree} 벌에서 두 코드의 결과 배열이 일치합니다.`,
  );
}

const who = (v: number): string => `${Math.floor(v / 1000)}반`;

/** 같은 점수의 두 값이 결과에서 어느 반 순서로 놓였는가. */
function orderOf(out: readonly number[], score: number): string {
  return out
    .filter((v) => v % 1000 === score)
    .map(who)
    .join(" → ");
}

function stableScore(): string {
  const stable = byScore.sortArray([...SCORED]);
  const unstable = byScoreStrict.sortArray([...SCORED]);
  return proofTable(
    md(
      ["점수 비교", "결과", "40 점 둘", "50 점 둘"],
      [
        ["입력 그대로", show(SCORED), orderOf(SCORED, 40), orderOf(SCORED, 50)],
        ["`% 1000 <=`", show(stable), orderOf(stable, 40), orderOf(stable, 50)],
        [
          "`% 1000 <`",
          show(unstable),
          orderOf(unstable, 40),
          orderOf(unstable, 50),
        ],
      ],
    ),
  );
}

/* ───────── 전체 실행 ───────── */

function walkTrace(): string {
  const { whole } = walkSteps();
  const r = run(A6);
  const rows = r.events.map((e, k) => {
    const id = (whole[k] as { id: string }).id;
    const seg = e.after.slice(e.lo, e.hi + 1);
    if (e.kind === "split") {
      const n = e.hi - e.lo + 1;
      return [
        id,
        `${show(seg)}${을를(lastOf(seg))} 가른다`,
        `\`${n} <= 1\` **거짓**, mid = ${e.mid}`,
        "0",
        `${show(seg.slice(0, e.mid))} · ${show(seg.slice(e.mid))}`,
      ];
    }
    return [
      id,
      `${show(e.L)}${과와(lastOf(e.L))} ${show(e.R)}${을를(lastOf(e.R))} 합친다`,
      `${e.cmps.map((c) => `\`${c.a} <= ${c.b}\` ${c.left ? "참" : "거짓"} ${branch(c.left)}`).join(", ")} · ${tailMark(e)}`,
      String(e.cmps.length),
      show(e.out),
    ];
  });
  return proofTable(
    md(["단계", "하는 일", "조건 판정", "비교", "결과 조각"], rows, [3]),
    `칸이 하나인 부름 ${r.bases} 번은 가르는 단계 안에서 \`1 <= 1\` 이 참이라 ① 로 돌아왔습니다. 비교는 모두 ${r.comparisons} 번이고 반환값은 [${r.result.join(", ")}] 입니다.`,
  );
}

/* ───────── 기저에서 복사하지 않으면 ───────── */

const aliased = await loadMutant<Sorter>(REF, {
  swap: [/^(\s*)return A\.slice\(\);$/, "$1return A;"],
});

/** 값만 확인하는 입력 여덟 벌. */
const VALUE_CASES: number[][] = [
  [3, 1, 4, 1, 5, 9, 2, 6],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [-3, 1, -4, 1, -5, 9, -2, 6],
  [2, 2, 2, 1, 1, 1, 3, 3],
  [7, 7, 7, 7],
  [42],
  [1_000_000_000, -1_000_000_000, 0],
];

function aliasBase(): string {
  const agree = VALUE_CASES.filter(
    (A) => show(sortArray([...A])) === show(aliased.sortArray([...A])),
  ).length;
  const probe = (fn: (A: number[]) => number[]): string[] => {
    const one = [42];
    const out = fn(one);
    const result = show(out);
    const shared = out === one;
    out[0] = 7;
    return [
      result,
      shared ? "입력과 한 배열" : "새 배열",
      one[0] === 7 ? "함께 바뀐다" : "그대로다",
    ];
  };
  return proofTable(
    md(
      ["기저가 돌려주는 것", "결과", "돌려준 배열", "결과를 고친 뒤의 입력"],
      [
        ["`A.slice()` — 정본", ...probe((A) => sortArray(A))],
        ["`A` — 한 줄만 바꾼 코드", ...probe((A) => aliased.sortArray(A))],
      ],
    ),
    agree === VALUE_CASES.length
      ? `값만 확인하는 입력 ${countWord(agree)} 벌에서는 두 코드의 결과 배열이 모두 일치합니다.`
      : `값만 확인하는 입력 ${countWord(VALUE_CASES.length)} 벌 중 ${agree} 벌에서 두 코드의 결과 배열이 일치합니다.`,
  );
}

function aliasDemo(): string {
  const tryIt = (fn: (A: number[]) => number[]): string => {
    const a = [42];
    const b = fn(a);
    b[0] = 7;
    return `a 는 ${show(a)}, b 는 ${show(b)}`;
  };
  return columns([
    ["const a = [42];  const b = sortArray(a);  b[0] = 7;"],
    [""],
    ["  A.slice() 로 돌려주면", tryIt((A) => sortArray(A))],
    ["  A 로 돌려주면", tryIt((A) => aliased.sortArray(A))],
  ]);
}

function finalCalls(): string {
  const calls = [
    A6,
    [3, 1, 4, 1, 5, 9, 2, 6],
    [-3, 1, -4, 1, -5, 9, -2, 6],
    [42],
    [],
  ];
  return columns(
    calls.map((A) => [
      `sortArray([${A.join(", ")}])`,
      `→   [${sortArray([...A]).join(", ")}]`,
    ]),
  );
}

/* ───────── 알아 두면 좋은 개념 ───────── */

function relatedStable(): string {
  const pairs = (xs: readonly number[]) =>
    xs.map((v) => `(${who(v)} ${v % 1000})`).join(" ");
  const stable = byScore.sortArray([...SCORED]);
  const unstable = byScoreStrict.sortArray([...SCORED]);
  return proofTable(
    md(
      ["정렬", "(반, 점수) 를 점수만 비교한 결과", "40 점끼리", "50 점끼리"],
      [
        ["입력", pairs(SCORED), orderOf(SCORED, 40), orderOf(SCORED, 50)],
        ["안정 정렬", pairs(stable), orderOf(stable, 40), orderOf(stable, 50)],
        [
          "안정이 아닌 정렬",
          pairs(unstable),
          orderOf(unstable, 40),
          orderOf(unstable, 50),
        ],
      ],
    ),
  );
}

/* ───────── 수식 정의와 유도 ───────── */

/** 식 그대로의 재귀 — 한가운데로 가른다. */
const C = (n: number): number =>
  n <= 1 ? 0 : C(n >> 1) + C(n - (n >> 1)) + n - 1;

// 식의 값이 정본의 최악(순열 전수)과 같은가 — 칸 7 개까지.
for (let n = 1; n <= 7; n++) {
  const seen = Math.max(...permutations(n).map((p) => comparisons(p)));
  if (C(n) !== seen) throw new Error(`C(${n}) 이 정본의 최악과 다르다`);
}

function mathHalves(): string {
  return columns(
    [A6.length, 7].map((n) => [
      `n = ${n} 이면`,
      `왼쪽 ⌊${n}/2⌋ = ${Math.floor(n / 2)} 칸 · 오른쪽 ⌈${n}/2⌉ = ${Math.ceil(n / 2)} 칸`,
    ]),
  );
}

function mathCheck(): string {
  const line = (n: number): string => {
    const a = n >> 1;
    const b = n - a;
    return `C(${n}) = C(${a}) + C(${b}) + ${n - 1} = ${C(a)} + ${C(b)} + ${n - 1} = ${C(n)}`;
  };
  const counted = run(A6).comparisons;
  return [
    ...[2, 3, 4, 6].map(line),
    `       └ 전개 입력 ${show(A6)} 에서 정본이 실제로 한 비교는 ${counted} 번이다.`,
    `         그 입력이 최악이 아니라서 C(${A6.length}) = ${C(A6.length)} 보다 적다`,
  ].join("\n");
}

function mathAk(): string {
  const a = (k: number): number => C(2 ** k);
  const lines: string[][] = [[`a_0 = ${a(0)}`, ""]];
  for (let k = 1; k <= 3; k++) {
    const v = 2 * a(k - 1) + 2 ** k - 1;
    if (v !== a(k)) throw new Error("점화식이 재귀와 다르다");
    lines.push([
      `a_${k} = 2 × ${a(k - 1)} + ${2 ** k} − 1 = ${v}`,
      `   C(${2 ** k}) = ${a(k)}`,
    ]);
  }
  return columns(lines);
}

/** 분수를 기약분수 문자열로. */
function frac(p: number, q: number): string {
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  const d = g(Math.abs(p), q);
  return q / d === 1 ? String(p / d) : `${p / d}/${q / d}`;
}

function mathBk(): string {
  const lines: string[] = [];
  for (let k = 1; k <= 3; k++) {
    const q = 2 ** k;
    const prev = C(2 ** (k - 1)) * 2; // b_{k-1} 를 분모 2^k 로 옮긴 분자
    const now = C(q);
    if (prev + q - 1 !== now) throw new Error("b_k 점화식이 재귀와 다르다");
    const back = k === 3 ? `      a_3 = 8 × ${frac(now, q)} = ${C(8)}` : "";
    lines.push(
      `b_${k} = ${frac(prev, q)} + 1 − 1/${q} = ${frac(now, q)}${back}`,
    );
  }
  return lines.join("\n");
}

function mathBk3(): string {
  const k = 3;
  const q = 2 ** k;
  const value = frac(k * q - (q - 1), q);
  if (value !== frac(C(q), q)) throw new Error("닫은 b_k 가 점화식과 다르다");
  return `k = ${k} 에 넣으면   ${k} − (1 − 1/${q}) = ${k} − ${frac(q - 1, q)} = ${value}      위에서 센 b_3 = ${frac(C(q), q)}`;
}

function mathAk34(): string {
  return columns(
    [3, 4].map((k) => {
      const v = k * 2 ** k - 2 ** k + 1;
      if (v !== C(2 ** k)) throw new Error("닫힌 형태가 재귀와 다르다");
      return [
        `k = ${k} 이면   ${k} × ${2 ** k} − ${2 ** k} + 1 = ${v}`,
        `   n = ${2 ** k} 의 최악 C(${2 ** k}) = ${C(2 ** k)}`,
      ];
    }),
  );
}

function mathCode(): string {
  if (C(A6.length) !== closedForm(A6.length)) {
    throw new Error("C(6) 이 닫힌 형태와 다르다");
  }
  return [
    "const C = (n: number): number =>",
    "  n <= 1 ? 0 : C(n >> 1) + C(n - (n >> 1)) + n - 1;",
    "",
    "const closed = (n: number): number => {",
    "  const k = Math.ceil(Math.log2(n));",
    "  return n * k - 2 ** k + 1;",
    "};",
    "",
    `C(${A6.length}); // → ${C(A6.length)}`,
    `closed(${A6.length}); // → ${closedForm(A6.length)}`,
    `closed(100_000); // → ${closedForm(N)}`,
  ].join("\n");
}

function mathClosed(): string {
  const rows = [8, 16, 64, N].map((n) => {
    const worst = comparisons(worstInput(HALVE, [...Array(n).keys()]));
    return [
      num(n),
      num(Math.ceil(Math.log2(n))),
      num(closedForm(n)),
      num(worst),
    ];
  });
  return proofTable(
    md(
      ["n", "⌈log₂ n⌉", "C(n)", "최악 입력을 넣어 정본이 센 비교"],
      rows,
      [0, 1, 2, 3],
    ),
    "최악 입력은 정렬된 값을 거꾸로 두 조각에 번갈아 나눠 담아 만들었고, 칸 7 개까지는 모든 순열의 최댓값과도 대조했습니다.",
  );
}

/* ───────── 불변식 ───────── */

function invariantEdges(): string {
  const cases: [string, number[]][] = [
    ["빈 배열", []],
    ["칸 하나", [42]],
    ["칸 둘", [2, 1]],
    ["값이 전부 같음", [7, 7, 7, 7]],
    ["음수가 섞임", [-3, 1, -4]],
    ["값 범위의 끝", [1_000_000_000, -1_000_000_000, 0]],
  ];
  const rows = cases.map(([name, A]) => {
    const out = sortArray(A);
    const where =
      A.length <= 1
        ? `\`${A.length} <= 1\` 이 참 → 기저가 ${out === A ? "입력 그대로를" : "복사본을"} 돌려준다`
        : mergesOf(run(A))
            .map(
              (m) =>
                `${show(m.L)} + ${show(m.R)}: ${m.cmps.map((c) => `${c.a} <= ${c.b} ${c.left ? "참" : "거짓"}`).join(", ")} → ${m.tail.side === "L" ? "왼쪽 잇기" : "오른쪽 잇기"}`,
            )
            .join(" · ");
    return [`${name} \`${show(A)}\``, where, `\`${show(out)}\``];
  });
  return proofTable(md(["입력", "처리되는 자리", "결과"], rows));
}

/** 머리 둘 중 **큰** 쪽을 꺼내는 사본 — 불변식을 지키던 그 줄을 뒤집은 것이다. */
const larger = await loadMutant<Sorter>(REF, {
  swap: [COMPARE_LINE, "$1if ((L[i] as number) > (R[j] as number)) {"],
});

const MUTANT_CASES: number[][] = [
  [5, 2, 4, 1, 2, 6],
  [3, 1, 4, 1, 5, 9, 2, 6],
  [-3, 1, -4, 1, -5, 9, -2, 6],
];

// 하나도 안 어긋나면 이 절의 주장이 성립하지 않는다. 중화 실행(변이를 적용하지 않은 실행)에서는
// 사본이 정본 그대로라 이 검사를 건너뛴다 — 중화 여부는 함수가 정본과 같은 객체인가로 안다.
if (
  larger.sortArray !== sortArray &&
  MUTANT_CASES.every(
    (A) => show(sortArray([...A])) === show(larger.sortArray([...A])),
  )
) {
  throw new Error("변이가 어느 입력에서도 답을 바꾸지 못했다");
}

function mutantTable(): string {
  const rows = MUTANT_CASES.map((A) => [
    show(A),
    show(sortArray([...A])),
    show(larger.sortArray([...A])),
  ]);
  const wrong = MUTANT_CASES.filter(
    (A) => show(sortArray([...A])) !== show(larger.sortArray([...A])),
  ).length;
  return proofTable(
    md(["입력", "바른 코드", "`<=` 를 `>` 로 적은 코드"], rows),
    wrong === MUTANT_CASES.length
      ? `${countWord(wrong)} 벌 모두 답이 틀립니다.`
      : `${countWord(MUTANT_CASES.length)} 벌 중 ${wrong} 벌에서 답이 틀립니다.`,
  );
}

/** 뒤집은 줄에 기록을 끼운 사본 — 그 코드가 실제로 어떤 조각을 합쳤는지 본다. */
const largerLogged = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if ((() => { (globalThis as unknown as { __mut: { L: number[]; R: number[]; i: number; j: number }[] }).__mut.push({ L: [...L], R: [...R], i, j }); return (L[i] as number) > (R[j] as number); })()) {",
  ],
});

/** 그 사본이 부른 합치기의 입력 — 합치기마다 첫 비교(`i = j = 0`)의 두 조각이다. */
function mergeInputs(
  fn: Sorter,
  A: number[],
): { calls: string[]; out: number[] } {
  const g = globalThis as unknown as {
    __mut: { L: number[]; R: number[]; i: number; j: number }[];
  };
  g.__mut = [];
  const out = fn.sortArray([...A]);
  const calls = g.__mut
    .filter((c) => c.i === 0 && c.j === 0)
    .map((c) => `merge(${show(c.L)}, ${show(c.R)})`);
  return { calls, out };
}

function invariantMutantStep(): string {
  const A = [5, 2, 4];
  const good = mergesOf(run(A)).map((m) => `merge(${show(m.L)}, ${show(m.R)})`);
  const bad = mergeInputs(largerLogged, A);
  return columns([
    [`${show(A)}${을를(lastOf(A))} 정렬한다`],
    [""],
    ["  바른 코드", ...good, `→ ${show(sortArray([...A]))}`],
    ["  > 로 적은 코드", ...bad.calls, `→ ${show(bad.out)}`],
  ]);
}

/* ───────── 비용 계산 ───────── */

function perfDerive(): string {
  const { whole } = walkSteps();
  const r = run(A6);
  const lines: string[][] = [];
  r.events.forEach((e, k) => {
    if (e.kind !== "merge") return;
    lines.push([
      (whole[k] as { id: string }).id,
      `${show(e.L)} + ${show(e.R)}`,
      `비교 ${e.cmps.length} 번`,
      `조각 크기 ${e.L.length} + ${e.R.length}`,
    ]);
  });
  lines.push(["", "", `└ 합 ${r.comparisons} 번`]);
  return columns(lines);
}

function perfLevels(): string {
  const { whole } = walkSteps();
  const r = run(A6);
  const idOf = (m: MergeEvent) =>
    (whole[r.events.indexOf(m)] as { id: string }).id;
  const merges = mergesOf(r);
  const lines: string[][] = [];
  let layers = 0;
  for (const [d, pieces] of levels(r).entries()) {
    const ms = merges.filter((m) => m.depth === d);
    if (ms.length === 0) continue;
    layers++;
    const count = ms.reduce((s, m) => s + m.cmps.length, 0);
    const bound = ms.map((m) => `(${m.hi - m.lo + 1} − 1)`).join(" + ");
    lines.push([
      `${d} 층`,
      ms.map(idOf).join(" · "),
      `비교 ${count}`,
      `≤ ${bound}`,
      `칸 ${pieces.reduce((s, p) => s + p.hi - p.lo + 1, 0)}`,
    ]);
  }
  const body = columns(lines);
  const indent = " ".repeat(width(`${lines[0]?.[0] ?? ""}   `));
  return `${body}\n${indent}└ 합치는 층 ${layers} × 칸 ${A6.length} = ${layers * A6.length} 이 상한이다`;
}

const WORST_N = 8;

function worstTable(): string {
  const sorted = [...Array(WORST_N).keys()];
  const reversed = [...sorted].reverse();
  const built = worstInput(HALVE, sorted);
  const perms = permutations(WORST_N);
  const max = Math.max(...perms.map((p) => comparisons(p)));
  return proofTable(
    md(
      ["입력", "비교 횟수"],
      [
        [`이미 정렬 ${show(sorted)}`, String(comparisons(sorted))],
        [`역순 ${show(reversed)}`, String(comparisons(reversed))],
        [`번갈아 짠 ${show(built)}`, String(comparisons(built))],
        ["닫힌 형태가 내는 값", String(closedForm(WORST_N))],
      ],
      [1],
    ),
    `순열 ${num(perms.length)} 개를 전부 넣어 세어도 비교는 ${max} 번을 넘지 않습니다.`,
  );
}

function lastMergeLines(A: number[]): string {
  const m = mergesOf(run(A)).at(-1) as MergeEvent;
  const steps = m.cmps
    .map((c) => `${c.a} ${c.left ? "≤" : ">"} ${c.b} → ${c.left ? c.a : c.b}`)
    .join(",  ");
  return columns([
    [`${show(A)} 의 마지막 합치기`],
    [""],
    [`  왼쪽 조각 ${show(m.L)}`, `오른쪽 조각 ${show(m.R)}`],
    [`  ${steps}`],
    [
      `       └ 비교 ${m.cmps.length} 번. ${tailMark(m)} 가 ${m.tail.values.join(" ")}${을를(lastOf(m.tail.values))} 비교 없이 잇는다`,
    ],
  ]);
}

function worstReversed(): string {
  return lastMergeLines([...Array(WORST_N).keys()].reverse());
}

function worstBuilt(): string {
  return lastMergeLines(worstInput(HALVE, [...Array(WORST_N).keys()]));
}

/* ───────── 스스로 점검하기 ───────── */

/** ④ 의 반복을 막은 사본 — 오른쪽이 먼저 비면 왼쪽에 남은 값을 아무도 담지 않는다. */
const dropLeftTail = await loadMutant<Sorter>(REF, {
  swap: [
    /^(\s*)while \(i < L\.length\) \{$/,
    "$1while (false && i < L.length) {",
  ],
});

function selfcheckDropTail(): string {
  const left = A6.slice(0, A6.length >> 1);
  const right = A6.slice(A6.length >> 1);
  return columns([
    ["④ 를 지운 코드"],
    [""],
    [`  sortArray(${show(left)})`, `→ ${show(dropLeftTail.sortArray(left))}`],
    [`  sortArray(${show(right)})`, `→ ${show(dropLeftTail.sortArray(right))}`],
    [`  sortArray(${show(A6)})`, `→ ${show(dropLeftTail.sortArray([...A6]))}`],
  ]);
}

export const PROOFS: Record<string, () => string> = {
  "concept-merge": conceptMerge,
  "concept-depth": conceptDepth,
  "origin-cost": originCost,
  "origin-selection": originSelection,
  "origin-merge-once": originMergeOnce,
  "origin-two-ways": originTwoWays,
  "origin-sizes": originSizes,
  "origin-peel": originPeel,
  "build-merge-easy": buildMergeEasy,
  "build-merge-early": buildMergeEarly,
  "build-split": buildSplit,
  "build-level-sum": buildLevelSum,
  "build-depth": buildDepth,
  "premise-unsorted": premiseUnsorted,
  "split-choice": splitChoice,
  "split-max": splitMax,
  "walk-input": walkInput,
  "walk-merge-trace": walkMergeTrace,
  "walk-tail": walkTail,
  "walk-calls": walkCalls,
  "stable-tie": stableTie,
  "stable-score": stableScore,
  "walk-trace": walkTrace,
  "alias-base": aliasBase,
  "alias-demo": aliasDemo,
  "final-calls": finalCalls,
  "related-stable": relatedStable,
  "math-halves": mathHalves,
  "math-check": mathCheck,
  "math-ak": mathAk,
  "math-bk": mathBk,
  "math-bk3": mathBk3,
  "math-ak34": mathAk34,
  "math-code": mathCode,
  "math-closed": mathClosed,
  "invariant-edges": invariantEdges,
  "mutant-take-larger": mutantTable,
  "invariant-mutant-step": invariantMutantStep,
  "perf-derive": perfDerive,
  "perf-levels": perfLevels,
  "worst-input": worstTable,
  "worst-reversed": worstReversed,
  "worst-built": worstBuilt,
  "selfcheck-drop-tail": selfcheckDropTail,
};
