/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 분할 안의 걸음 하나하나는 그림 사이드카의 `run`(정본 소스에서 기계로 만든 계측 사본과 걸음마다
 * 대조한 기록)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/quicksort/quicksort-guide.md
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  A4,
  afterPivot,
  type Call,
  CHOICES,
  COMPARE_LINE,
  cmpsOf,
  comparisons,
  countWith,
  FIRST,
  killer,
  MIDDLE,
  N,
  num,
  permutations,
  type QsEvent,
  quickWith,
  run,
  scale,
  secondsOf,
  selectionCount,
  selectionRounds,
  selectKth,
  show,
  sorted,
  stats8,
  type Trace,
  walkSteps,
  worstCount,
} from "./quicksort-guide.fig.tsx";
import { quickSort } from "./quicksort-guide.ref.ts";

const REF = new URL("./quicksort-guide.ref.ts", import.meta.url).pathname;

type Sorter = { quickSort(nums: number[]): number[] };
type Cmp = Extract<QsEvent, { kind: "cmp" }>;
type Place = Extract<QsEvent, { kind: "place" }>;
type Enter = Extract<QsEvent, { kind: "enter" }>;
type Base = Extract<QsEvent, { kind: "base" }>;
type PivotMove = Extract<QsEvent, { kind: "pivot" }>;

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

/** 칸을 맞춘 줄들. 열 사이는 세 칸이다. 칸이 하나뿐인 줄은 폭 계산에서 뺀다. */
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

const range = (lo: number, hi: number): string =>
  hi < lo ? "비었다" : `[${lo},${hi}]`;
const valuesIn = (arr: readonly number[], lo: number, hi: number): string =>
  hi < lo ? "[ ]" : show(arr.slice(lo, hi + 1));

const places = (t: Trace): Place[] =>
  t.events.filter((e): e is Place => e.kind === "place");
const enters = (t: Trace): Enter[] =>
  t.events.filter((e): e is Enter => e.kind === "enter");
/** 맨 바깥 부름의 비교들 — 첫 분할이다. */
const firstCmps = (t: Trace): Cmp[] => {
  const c = t.calls[0] as Call;
  return cmpsOf(t).filter((e) => e.lo === c.lo && e.hi === c.hi);
};

/* ───────────────────────── 전체 컨셉 ───────────────────────── */

/** 한 번 가르면 기준값이 정렬이 끝난 뒤의 자리에 이미 와 있다. */
function conceptPartition(): string {
  const t = run(A4);
  const first = t.calls[0] as Call;
  const after = (places(t)[0] as Place).arr;
  const done = quickSort([...A4]);
  const finalAt = done.indexOf(first.pivot);
  return proofTable(
    md(
      [
        "입력",
        "기준값",
        "한 번 가른 뒤",
        "기준값의 자리",
        "정렬을 마친 배열에서 그 값의 자리",
      ],
      [
        [
          show(A4),
          String(first.pivot),
          show(after),
          `인덱스 ${first.at}`,
          `인덱스 ${finalAt}`,
        ],
      ],
    ),
    `기준값 ${first.pivot}${이가(first.pivot)} 한 번 가른 뒤 놓인 자리와 정렬을 마친 배열 ${show(done)} 에서의 자리가 ${first.at === finalAt ? "같습니다" : "다릅니다"}.`,
  );
}

/** 갈림에 따라 비용이 `n log n` 규모에서 `n(n−1)/2` 까지 걸친다. */
function conceptCost(): string {
  const s = scale();
  return proofTable(
    md(
      [
        "갈림",
        `칸 ${num(N)} 개의 입력`,
        "비교",
        "시간(초당 1 억 번)",
        "가장 깊은 부름",
      ],
      [
        [
          "반씩 갈린다",
          `정렬된 0 … ${num(N - 1)}`,
          num(s.middleSorted),
          secondsOf(s.middleSorted),
          `깊이 ${num(s.middleDepth)}`,
        ],
        [
          "한쪽이 매번 빈다",
          "최악으로 만든 입력",
          num(s.worst),
          secondsOf(s.worst),
          `깊이 ${num(s.worstDepth)}`,
        ],
      ],
      [2, 3],
    ),
    "반씩 갈리는 줄은 정본으로 실제로 세었습니다. 한쪽이 비는 줄은 식 n(n−1)/2 로 냈고, 이 식은 칸 1 개부터 400 개까지와 1,000 개 · 2,000 개에서 만든 최악 입력을 정본에 넣어 센 값과 일치합니다.",
  );
}

/* ───────────────── 아이디어를 떠올리는 과정 ───────────────── */

function originCost(): string {
  const s = scale();
  return proofTable(
    md(
      ["방법", `칸 ${num(N)} 개의 비교`, "시간(초당 1 억 번)", "할당 칸"],
      [["선택 정렬", num(s.selection), secondsOf(s.selection), "0"]],
      [1, 2, 3],
    ),
    "선택 정렬은 바퀴마다 남은 칸을 전부 비교하므로 비교 횟수가 입력과 무관하게 n(n−1)/2 이고, 칸 1 개부터 200 개까지 실제로 세어 이 식과 대조했습니다.",
  );
}

function originSelection(): string {
  const rounds = selectionRounds(A4);
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
    `비교는 ${rounds.map((r) => r.compares).join(" + ")} = ${total} 번이고, 바퀴 하나가 자리 하나를 정합니다.`,
  );
}

function originMerge(): string {
  const s = scale();
  return proofTable(
    md(
      [
        "방법",
        `정렬된 0 … ${num(N - 1)} 의 비교`,
        "할당 칸",
        "가장 큰 합치기 한 번의 새 칸",
      ],
      [
        ["선택 정렬", num(selectionCount(N)), "0", "없음"],
        [
          "병합 정렬",
          num(s.mergeCompares),
          num(s.mergeCells),
          num(s.mergeLast),
        ],
      ],
      [1, 2, 3],
    ),
    "병합 정렬은 합치기마다 두 조각의 칸 수만큼 새 배열을 잡고, 그 칸 수를 모두 더했습니다. 두 방법 모두 답은 정본과 같습니다.",
  );
}

/** 값 하나로 한 번 읽으며 가른다 — 정본의 첫 분할. */
function originOnePass(): string {
  const t = run(A4);
  const first = t.calls[0] as Call;
  const moved = t.events.find((e) => e.kind === "pivot") as PivotMove;
  const rows: string[][] = [
    [
      "",
      "",
      "",
      `기준값 ${moved.pivot}${을를(moved.pivot)} 끝 칸으로 옮긴다`,
      show(moved.arr),
      String(moved.lo),
    ],
    ...firstCmps(t).map((e) => [
      String(e.j),
      String(e.a),
      e.small ? `${e.a} < ${first.pivot}` : `${e.a} ≥ ${first.pivot}`,
      e.small
        ? `arr[${e.iBefore}]${과와(e.iBefore)} 맞바꾸고 i 를 늘린다`
        : "그대로 둔다",
      show(e.arr),
      String(e.iAfter),
    ]),
  ];
  const place = places(t)[0] as Place;
  rows.push([
    "",
    "",
    "",
    `기준값을 인덱스 ${place.at} 에 놓는다`,
    show(place.arr),
    String(place.at),
  ]);
  const left = valuesIn(place.arr, first.lo, first.at - 1);
  return proofTable(
    md(
      [
        "j",
        "읽은 값",
        `${first.pivot}${과와(first.pivot)}의 비교`,
        "한 일",
        "배열",
        "i",
      ],
      rows,
      [0, 1, 5],
    ),
    `새로 잡은 칸은 0 개이고, ${first.pivot}${이가(first.pivot)} 인덱스 ${first.at} 에 놓였습니다. 남은 일은 ${left}${과와(place.arr[first.at - 1] as number)} ${valuesIn(place.arr, first.at + 1, first.hi)} 입니다.`,
  );
}

/** 비교 횟수는 부름마다 (구간 크기 − 1) 을 더한 값이다. */
function originSum(): string {
  const t = run(A4);
  const rows = t.calls.map((c) => [
    `sort(${c.lo},${c.hi})`,
    String(c.hi - c.lo + 1),
    String(c.compares),
  ]);
  const sum = t.calls.reduce((s, c) => s + (c.hi - c.lo), 0);
  const want = comparisons(A4);
  return proofTable(
    md(["원소가 둘 이상인 부름", "구간 크기", "비교"], rows, [1, 2]),
    `(구간 크기 − 1) 을 더하면 ${t.calls.map((c) => c.hi - c.lo).join(" + ")} = ${sum} 이고, 정본이 센 비교 ${want} 번과 ${sum === want ? "같습니다" : "다릅니다"}. 원소가 하나 이하인 부름은 비교가 없습니다.`,
  );
}

/** 정렬된 여덟 칸에 첫 원소와 가운데 칸을 기준값으로 — 부름마다 구간과 갈림. */
function originTwoWays(): string {
  const A = sorted(8);
  const a = quickWith(FIRST, A);
  const b = run(A);
  const cell = (c: Call | undefined): [string, string] =>
    c === undefined
      ? ["", ""]
      : [
          `구간 ${c.hi - c.lo + 1} → 왼 ${c.at - c.lo} · 오 ${c.hi - c.at}`,
          String(c.compares),
        ];
  const rows: string[][] = [];
  for (let k = 0; k < Math.max(a.calls.length, b.calls.length); k++) {
    rows.push([String(k + 1), ...cell(a.calls[k]), ...cell(b.calls[k])]);
  }
  const same = show(a.out) === show(b.out);
  return proofTable(
    md(
      ["부름", "(가) 첫 원소 기준값", "비교", "(나) 가운데 칸 기준값", "비교"],
      rows,
      [0, 2, 4],
    ),
    `(가) 는 비교 ${a.compares} 번, (나) 는 ${b.compares} 번이고, 답은 ${same ? `둘 다 ${show(b.out)} 입니다` : "서로 다릅니다"}.`,
  );
}

/** 첫 원소 기준값의 정렬된 입력은 선택 정렬과 같은 `n(n−1)/2` 다. */
function originFirstPivot(): string {
  const sizes = [8, 64, N];
  const rows = sizes.map((n) => {
    const got = n <= 400 ? quickWith(FIRST, sorted(n)).compares : worstCount(n);
    return [num(n), num(got), num(selectionCount(n))];
  });
  return proofTable(
    md(
      ["칸 수 n", "첫 원소 기준값 · 정렬된 입력의 비교", "선택 정렬의 비교"],
      rows,
      [0, 1, 2],
    ),
    "칸 400 개까지는 첫 원소를 기준값으로 고르는 절차를 정렬된 입력에 실제로 실행해 n(n−1)/2 와 대조했고, 그보다 큰 칸 수는 그 식으로 냈습니다.",
  );
}

/* ───────────────── 아이디어 상세 — 먼저 알아 둘 개념 ───────────────── */

/** 첫 분할에서 두 번째 칸을 읽은 직후의 상태 — 그림 `build-regions` 와 같은 순간이다. */
const regionMoment = (): Cmp => firstCmps(run(A4))[1] as Cmp;

function regionOf(e: Cmp, k: number): string {
  if (k === e.hi) return "기준값";
  if (k < e.iAfter) return "작음";
  if (k <= e.j) return "큼";
  return "아직";
}

function buildRegionsRead(): string {
  const e = regionMoment();
  const rows = e.arr.map((v, k) => {
    const r = regionOf(e, k);
    const rel =
      r === "기준값"
        ? "기준값 그 자체"
        : r === "아직"
          ? "아직 비교하지 않았다"
          : `${v} ${v < e.pivot ? "<" : "≥"} ${e.pivot}`;
    return [String(k), String(v), r, rel];
  });
  return proofTable(
    md(
      ["인덱스", "값", "구역", `기준값 ${e.pivot}${과와(e.pivot)}의 관계`],
      rows,
      [0, 1],
    ),
    `i = ${e.iAfter}, j = ${e.j} 인 순간입니다. 작음 구역은 인덱스 ${range(e.lo, e.iAfter - 1)}, 큼 구역은 ${range(e.iAfter, e.j)}, 아직 구역은 ${range(e.j + 1, e.hi - 1)} 입니다.`,
  );
}

function buildRegionsGrow(): string {
  const t = run(A4);
  const first = t.calls[0] as Call;
  const size = (lo: number, hi: number) => Math.max(0, hi - lo + 1);
  const rows = [
    ["읽기 전", "", "0", "0", String(size(first.lo, first.hi - 1))],
    ...firstCmps(t).map((e) => [
      `j = ${e.j}${을를(e.j)} 읽은 뒤`,
      e.small ? "①" : "②",
      String(size(e.lo, e.iAfter - 1)),
      String(size(e.iAfter, e.j)),
      String(size(e.j + 1, e.hi - 1)),
    ]),
  ];
  return proofTable(
    md(
      ["시점", "갈래", "작음 칸 수", "큼 칸 수", "아직 칸 수"],
      rows,
      [2, 3, 4],
    ),
    "한 칸을 읽을 때마다 아직 구역이 한 칸 줄고, 작음과 큼 중 한 구역이 한 칸 늡니다.",
  );
}

/** 헷갈리기 쉬운 모양 — 작은 값과 큰 값을 새 배열 둘에 나눠 담는 가르기. */
function buildRegionsCopy(): string {
  const start = afterPivot();
  const pivot = start.at(-1) as number;
  const rest = start.slice(0, -1);
  const small = rest.filter((v) => v < pivot);
  const big = rest.filter((v) => v >= pivot);
  const copied = [...small, pivot, ...big];
  const inPlace = (places(run(A4))[0] as Place).arr;
  const bigOf = (xs: readonly number[]) =>
    show(xs.slice(xs.indexOf(pivot) + 1));
  return proofTable(
    md(
      ["가르는 모양", "가른 결과", "할당 칸", "큰 쪽의 순서"],
      [
        [
          "새 배열 둘에 나눠 담는다",
          show(copied),
          String(small.length + big.length),
          bigOf(copied),
        ],
        ["한 배열 안에서 맞바꾼다", show(inPlace), "0", bigOf(inPlace)],
      ],
      [2],
    ),
    `두 모양 모두 기준값 ${pivot}${이가(pivot)} 인덱스 ${copied.indexOf(pivot)} 에 오고 작은 쪽도 같습니다. 큰 쪽은 값은 같지만 순서가 다릅니다.`,
  );
}

/* ───────────────── 아이디어 상세 — 단계 ───────────────── */

function buildPivot(): string {
  const rows: string[][] = [];
  const seen = new Set<string>();
  for (const A of [A4, sorted(8)]) {
    for (const e of enters(run(A))) {
      const key = `${e.lo},${e.hi}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push([
        `[${e.lo},${e.hi}]`,
        String(e.hi - e.lo + 1),
        `${e.lo} + ⌊${e.hi - e.lo}/2⌋ = ${e.pivotIdx}`,
      ]);
    }
  }
  rows.sort(
    (x, y) =>
      Number(y[1]) - Number(x[1]) ||
      (x[0] as string).localeCompare(y[0] as string),
  );
  return proofTable(
    md(["구간", "칸 수", "pivotIdx"], rows, [1]),
    "칸 수가 짝수이면 가운데 두 칸 중 왼쪽 칸을 고릅니다. 칸이 둘이면 그 칸이 lo 입니다.",
  );
}

function buildPivotMove(): string {
  const t = run(A4);
  const e = enters(t)[0] as Enter;
  const m = t.events.find((x) => x.kind === "pivot") as PivotMove;
  return columns([
    [
      "처음",
      show(e.arr),
      `lo=${e.lo} hi=${e.hi} · pivotIdx = ${e.lo} + ⌊${e.hi - e.lo}/2⌋ = ${e.pivotIdx}`,
    ],
    [
      "맞바꾼 뒤",
      show(m.arr),
      `인덱스 ${e.pivotIdx}${과와(e.pivotIdx)} ${e.hi}${을를(e.hi)} 맞바꿔 pivot = ${m.pivot}${이가(m.pivot)} hi=${e.hi} 에 있다`,
    ],
  ]);
}

/** 한 칸을 읽는 두 갈래 — 앞뒤 상태를 나란히. */
function scanRows(e: Cmp): string[][] {
  const at = (arr: readonly number[], i: number, j: number) => [
    show(arr),
    valuesIn(arr, e.lo, i - 1),
    valuesIn(arr, i, j),
    String(i),
  ];
  return [
    [
      `arr[${e.j}] = ${e.a}${을를(e.a)} 읽기 전`,
      ...at(e.before, e.iBefore, e.j - 1),
    ],
    [
      `${e.a} < ${e.pivot} ${e.small ? "참 → ①" : "거짓 → ②"}`,
      ...at(e.arr, e.iAfter, e.j),
    ],
  ];
}

function buildScanEasy(): string {
  const e = firstCmps(run(A4)).find((x) => !x.small) as Cmp;
  return proofTable(
    md(
      ["시점", "배열", "작음 구역의 값", "큼 구역의 값", "i"],
      scanRows(e),
      [4],
    ),
    `맞바꾸지 않고 j 만 나아가서, 읽은 ${e.a}${이가(e.a)} 그 자리에서 큼 구역의 끝이 됩니다.`,
  );
}

function buildScanSwap(): string {
  const e = firstCmps(run(A4)).find((x) => x.small) as Cmp;
  const moved = e.before[e.iBefore] as number;
  return proofTable(
    md(
      ["시점", "배열", "작음 구역의 값", "큼 구역의 값", "i"],
      scanRows(e),
      [4],
    ),
    `${e.a}${이가(e.a)} 작음 구역 끝(인덱스 ${e.iBefore})으로 가고, 그 자리에 있던 ${moved}${이가(moved)} 인덱스 ${e.j} 로 옮겨져 큼 구역의 끝이 됩니다. ${moved}${은는(moved)} 직전까지 큼 구역의 첫 값이었으므로 기준값 ${e.pivot} 이상입니다.`,
  );
}

function buildPlace(): string {
  const t = run(A4);
  const rows = t.calls.map((c) => {
    const p = places(t).find((e) => e.lo === c.lo && e.hi === c.hi) as Place;
    return [
      `sort(${c.lo},${c.hi})`,
      String(c.pivot),
      `인덱스 ${c.at}`,
      show(p.arr),
      range(c.lo, c.at - 1),
      range(c.at + 1, c.hi),
    ];
  });
  const singles = t.events.filter(
    (e): e is Base => e.kind === "base" && e.hi === e.lo,
  ).length;
  return proofTable(
    md(
      [
        "부름",
        "기준값",
        "놓인 자리",
        "놓은 뒤의 배열",
        "왼쪽 구간",
        "오른쪽 구간",
      ],
      rows,
    ),
    `원소가 둘 이상인 부름은 ${countWord(t.calls.length)} 번이고, 부름마다 기준값 하나가 최종 자리에 놓였습니다. 나머지 ${countWord(singles)} 칸은 원소가 하나인 부름에서 그대로 남았습니다.`,
  );
}

/** 깊이마다 (구간 크기 − 1) 의 합 — 정렬된 여덟 칸에서 기준값 자리 둘. */
function buildDepth(): string {
  const A = sorted(8);
  const traces: [string, Trace][] = [
    ["가운데 칸", run(A)],
    ["첫 칸", quickWith(FIRST, A)],
  ];
  const rows = traces.map(([name, t]) => {
    const byDepth: number[] = [];
    for (const c of t.calls) {
      byDepth[c.depth] = (byDepth[c.depth] ?? 0) + c.compares;
    }
    return [
      name,
      byDepth.map((x) => String(x ?? 0)).join(" · "),
      String(byDepth.length),
      String(t.compares),
    ];
  });
  return proofTable(
    md(
      ["기준값", "깊이마다 비교의 합", "비교가 있는 깊이 수", "비교 합"],
      rows,
      [2, 3],
    ),
    `어느 깊이에서도 비교의 합이 칸 수 ${A.length} 을 넘지 않습니다.`,
  );
}

/* ───────────────── 전제 · 설계 선택 ───────────────── */

function premiseBalance(): string {
  const cases: [string, number[]][] = [
    ["정렬된 입력", sorted(8)],
    ["최악으로 만든 입력", killer(8)],
  ];
  const rows = cases.map(([name, A]) => {
    const t = run(A);
    return [
      `${name} ${show(A)}`,
      show(t.out),
      String(t.compares),
      String(t.depth),
    ];
  });
  return proofTable(
    md(["입력", "결과", "비교", "가장 깊은 부름"], rows, [2, 3]),
    "두 입력 모두 답은 오름차순으로 맞게 나옵니다. 갈림이 고르지 않으면 틀리지 않고 느려집니다.",
  );
}

const CHOICE_INPUTS: [string, number[]][] = [
  ["정렬된", sorted(8)],
  ["역순", sorted(8).reverse()],
  ["가운데 칸 최악", killer(8)],
  ["섞인", [5, 2, 8, 1, 9, 3, 7, 4]],
  ["전부 같음", Array(8).fill(2) as number[]],
];

function pivotChoice(): string {
  if (
    CHOICE_INPUTS.some(
      ([, A]) => countWith(MIDDLE, A).compares !== comparisons(A),
    )
  ) {
    throw new Error("가운데 칸 줄이 정본과 다르다");
  }
  const rows = CHOICE_INPUTS.map(([name, A]) => [
    `${name} \`${show(A)}\``,
    ...CHOICES.map(([, c]) => {
      const r = countWith(c, A);
      return `${r.compares} (${r.depth})`;
    }),
  ]);
  return proofTable(
    md(["입력 (n = 8)", ...CHOICES.map(([name]) => name)], rows),
    "칸마다 비교 횟수이고, 괄호 안은 맨 바깥 부름을 0 으로 센 가장 깊은 부름의 깊이입니다. 중앙 열은 정본으로 센 값과 같습니다.",
  );
}

function pivotChoicePerm(): string {
  const rows = CHOICES.map(([name, c]) => {
    const s = stats8(c);
    return [
      name,
      String(s.min),
      s.mean.toFixed(2),
      String(s.max),
      num(s.maxCount),
    ];
  });
  const total = stats8(MIDDLE).total;
  return proofTable(
    md(
      [
        "기준값 자리",
        "가장 적을 때",
        "평균",
        "가장 많을 때",
        "가장 많은 순열 수",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    `값 0 … 7 의 순열 ${num(total)} 개를 전부 넣어 센 비교 횟수입니다.`,
  );
}

/* ───────────────────── 수행으로 알아보는 알고리즘 ───────────────────── */

function walkInput(): string {
  const out = quickSort([...A4]);
  return [
    `const nums = [${A4.join(", ")}];`,
    `// 이 절이 끝나면 [${out.join(", ")}] 가 나와야 한다`,
  ].join("\n");
}

function walkLoop(): string {
  const t = run(A4);
  const first = t.calls[0] as Call;
  return columns([
    ...firstCmps(t).map((e) => [
      `j=${e.j}`,
      `${e.a} < ${e.pivot} ${e.small ? "참" : "거짓"}`,
      e.small ? "①" : "②",
      show(e.arr),
      e.small ? `i ${e.iBefore}→${e.iAfter}` : `i ${e.iAfter}`,
    ]),
    [`루프 끝 i = ${first.at}`],
  ]);
}

function walkPlace(): string {
  const t = run(A4);
  const last = firstCmps(t).at(-1) as Cmp;
  const p = places(t)[0] as Place;
  return columns([
    ["루프 끝", show(last.arr), `i = ${p.at}`],
    [
      "맞바꾼 뒤",
      show(p.arr),
      `arr[${p.at}]${과와(p.at)} arr[${p.hi}]${을를(p.hi)} 맞바꿔 기준값 ${p.pivot}${이가(p.pivot)} 인덱스 ${p.at} 에 놓였다`,
    ],
    ["다음 부름", `sort(${p.lo},${p.at - 1}) · sort(${p.at + 1},${p.hi})`],
  ]);
}

function pauseSorted(): string {
  const cases: [string, number[]][] = [
    ["정렬된", sorted(8)],
    ["역순", sorted(8).reverse()],
    ["가운데 칸 최악", killer(8)],
  ];
  const rows = cases.map(([name, A]) => {
    const r = run(A);
    return [`${name} ${show(A)}`, String(r.compares), String(r.depth)];
  });
  const s = stats8(MIDDLE);
  return proofTable(
    md(["입력 (n = 8)", "비교", "가장 깊은 부름"], rows, [1, 2]),
    `순열 ${num(s.total)} 개를 전부 넣으면 비교는 가장 적을 때 ${s.min} 번, 가장 많을 때 ${s.max} 번입니다.`,
  );
}

function pauseSortedSplit(): string {
  const t = run(sorted(8));
  return columns(
    t.calls.slice(0, 2).map((c) => {
      const p = places(t).find((e) => e.lo === c.lo && e.hi === c.hi) as Place;
      return [
        `구간 [${c.lo},${c.hi}]`,
        `가운데 칸의 값 ${c.pivot}`,
        `→ ${valuesIn(p.arr, c.lo, c.at - 1)} ${c.pivot} ${valuesIn(p.arr, c.at + 1, c.hi)}`,
      ];
    }),
  );
}

function walkTrace(): string {
  const steps = walkSteps();
  const t = run(A4);
  const rows = t.events.map((e, k) => {
    const id = steps[k]?.id as string;
    let what: string;
    let judge: string;
    let i = "";
    if (e.kind === "enter") {
      what = `\`sort(${e.lo},${e.hi})\` 시작`;
      judge = `\`hi-lo = ${e.hi - e.lo} ≥ 1\` 이라 계속, \`pivotIdx = ${e.pivotIdx}\``;
    } else if (e.kind === "base") {
      what = `\`sort(${e.lo},${e.hi})\``;
      judge = `\`hi-lo = ${e.hi - e.lo} < 1\` 이라 즉시 반환`;
    } else if (e.kind === "pivot") {
      what = `기준값 ${e.pivot}${을를(e.pivot)} 끝으로`;
      judge = `인덱스 ${e.pivotIdx}${과와(e.pivotIdx)} ${e.hi}${을를(e.hi)} 맞바꾼다`;
      i = String(e.lo);
    } else if (e.kind === "cmp") {
      what = `\`j=${e.j}\``;
      judge = `\`${e.a} < ${e.pivot}\` ${e.small ? "**참** → ①" : "**거짓** → ②"}`;
      i = e.small ? `${e.iBefore}→${e.iAfter}` : String(e.iAfter);
    } else {
      what = "기준값을 경계 자리로";
      judge = `\`i = ${e.at}\`${이가(e.at)} 값 ${e.pivot} 의 최종 자리`;
      i = String(e.at);
    }
    return [id, what, judge, `\`${show(e.arr)}\``, i];
  });
  return proofTable(md(["단계", "무슨 일", "조건 판정", "배열", "`i`"], rows));
}

function walkBranches(): string {
  const steps = walkSteps();
  const t = run(A4);
  const ids = (small: boolean) =>
    t.events
      .map((e, k) =>
        e.kind === "cmp" && e.small === small ? (steps[k]?.id as string) : null,
      )
      .filter((x): x is string => x !== null)
      .join(" · ");
  const parts = t.calls.map((c) => `(구간 ${c.hi - c.lo + 1} − 1)`).join(" + ");
  const vals = t.calls.map((c) => String(c.hi - c.lo)).join(" + ");
  return columns([
    ["①  작다", ids(true)],
    ["②  크거나 같다", ids(false)],
    [""],
    [`비교 ${t.compares} 번 = ${parts} = ${vals}`],
  ]);
}

/** 비교를 `<=` 로 적은 사본 — 비교 횟수도 함께 센다. 같은 값이 전부 왼쪽으로 간다. */
const lessEq = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if ((() => { (globalThis as unknown as { __qsLe: { n: number } }).__qsLe.n++; return (arr[j] as number) <= pivot; })()) {",
  ],
});

function lessEqCount(A: readonly number[]): {
  out: number[];
  compares: number;
} {
  const g = globalThis as unknown as { __qsLe: { n: number } };
  g.__qsLe = { n: 0 };
  const out = lessEq.quickSort([...A]);
  return { out, compares: g.__qsLe.n };
}

const EQUAL8 = Array(8).fill(2) as number[];

function pauseEqual(): string {
  const t = run(EQUAL8);
  const le = lessEqCount(EQUAL8);
  const s = run(sorted(8));
  const rows = [
    ["바른 코드 `<`", show(EQUAL8), show(t.out), String(t.compares)],
    ["`<=` 로 적은 코드", show(EQUAL8), show(le.out), String(le.compares)],
    ["바른 코드 `<`", show(sorted(8)), show(s.out), String(s.compares)],
  ];
  return proofTable(
    md(["코드", "입력", "결과", "비교"], rows, [3]),
    `값이 전부 같은 입력은 두 코드 모두 답이 맞고, 비교는 ${t.compares} 번 = 8 · 7 / 2 입니다.`,
  );
}

// 아래 블록의 「= lo」 가 거짓이면 그 블록이 옛말을 한다 — 실행으로 확인한다.
for (const c of run(EQUAL8).calls) {
  if (c.at !== c.lo) {
    throw new Error("같은 값 입력에서 기준값이 lo 에 놓이지 않았다");
  }
}

function pauseEqualCalls(): string {
  const t = run(EQUAL8);
  return columns(
    t.calls.map((c) => [
      `구간 ${c.hi - c.lo + 1} → 왼 ${c.at - c.lo} · 오 ${c.hi - c.at}`,
      `비교 ${c.compares}`,
      `기준값이 놓인 자리 ${c.at} = lo`,
    ]),
  );
}

function finalCalls(): string {
  const calls: number[][] = [A4, [], [7], [2, 2, 2], [-10, 5, -3, 0, 8, -1]];
  return columns(
    calls.map((A) => [
      `quickSort([${A.join(", ")}])`,
      `→  [${quickSort([...A]).join(", ")}]`,
    ]),
  );
}

/* ───────────────────── 알아 두면 좋은 개념 ───────────────────── */

function relatedSelect(): string {
  const t = run(A4);
  const first = t.calls[0] as Call;
  const p = places(t)[0] as Place;
  const rows = A4.map((_, k) => {
    const side =
      k === first.at
        ? "이미 찾았다 — 더 가르지 않는다"
        : k < first.at
          ? `왼쪽 ${valuesIn(p.arr, first.lo, first.at - 1)} 만 따라간다`
          : `오른쪽 ${valuesIn(p.arr, first.at + 1, first.hi)} 만 따라간다`;
    return [String(k), String(selectKth(A4, k).value), side];
  });
  return proofTable(
    md(
      ["k", "k 번째로 작은 값", `첫 분할 뒤 ${show(p.arr)} 에서 할 일`],
      rows,
      [0, 1],
    ),
  );
}

function relatedCost(): string {
  const k = N / 2;
  const a = selectKth(sorted(N), k);
  const small = 2_000;
  const w = killer(small);
  const b = selectKth(w, small - 1);
  const rows = [
    [
      `정렬된 0 … ${num(N - 1)}`,
      num(N),
      num(k),
      num(comparisons(sorted(N))),
      num(a.compares),
      num(2 * N),
    ],
    [
      "가운데 칸 최악으로 만든 입력",
      num(small),
      num(small - 1),
      num(comparisons(w)),
      num(b.compares),
      num(2 * small),
    ],
  ];
  return proofTable(
    md(
      ["입력", "n", "k", "정렬 전체의 비교", "k 번째 하나만의 비교", "2n"],
      rows,
      [1, 2, 3, 4, 5],
    ),
    `반씩 갈리는 입력에서는 한쪽만 따라가는 비교가 2n 아래이고, 한쪽이 매번 비는 입력에서는 정렬 전체와 같은 n(n−1)/2 = ${num(worstCount(small))} 번입니다.`,
  );
}

/* ───────────────────── 수식 정의와 유도 ───────────────────── */

/** 점화식 그대로 — `k` 가 갈림의 모양을 정한다. */
const T = (n: number, k: (n: number) => number): number =>
  n <= 1 ? 0 : T(k(n), k) + T(n - k(n) - 1, k) + (n - 1);
const HALF = (n: number) => Math.floor((n - 1) / 2);
const EMPTY = () => 0;

/** 점화식을 펴 가며 분할마다 `n → k · n−k−1` 과 그 분할의 비교 `n−1` 을 적는다. */
function unfold(n: number, k: (n: number) => number): [string, number][] {
  const out: [string, number][] = [];
  const go = (m: number): void => {
    if (m <= 1) return;
    const l = k(m);
    out.push([`${m} → ${l} · ${m - l - 1}`, m - 1]);
    go(l);
    go(m - l - 1);
  };
  go(n);
  return out;
}

function mathCheck(): string {
  const n = 8;
  const rows = (
    [
      ["절반씩", HALF],
      ["한쪽이 빔", EMPTY],
    ] as [string, (n: number) => number][]
  ).map(([name, k]) => {
    const u = unfold(n, k);
    return [
      name,
      u.map(([s]) => s).join(" · "),
      `${u.map(([, c]) => c).join(" + ")} = ${T(n, k)}`,
    ];
  });
  const mid8 = run(sorted(n)).compares;
  const first8 = quickWith(FIRST, sorted(n)).compares;
  return proofTable(
    md(["갈림", "펴 나간 분할 (n → k · n−k−1)", "분할마다 n−1 의 합"], rows),
    `두 합은 정렬된 여덟 칸을 가운데 칸으로 실행해 센 ${mid8} 번, 첫 칸으로 실행해 센 ${first8} 번과 ${mid8 === T(n, HALF) && first8 === T(n, EMPTY) ? "같습니다" : "다릅니다"}.`,
  );
}

function mathCode(): string {
  return [
    "const T = (n: number, k: (n: number) => number): number =>",
    "  n <= 1 ? 0 : T(k(n), k) + T(n - k(n) - 1, k) + (n - 1);",
    "",
    `T(8, (n) => Math.floor((n - 1) / 2)); // 절반씩    → ${T(8, HALF)}`,
    `T(8, () => 0); //                        한쪽이 빔 → ${T(8, EMPTY)}`,
  ].join("\n");
}

function mathClosed(): string {
  const sizes = [8, N];
  const s = scale();
  if (T(N, HALF) !== s.middleSorted) {
    throw new Error(
      "절반씩 갈린 T(50,000) 이 정렬된 입력의 실제 비교와 다르다",
    );
  }
  const rows = sizes.map((n) => [
    num(n),
    num(T(n, HALF)),
    num(Math.round(n * Math.log2(n))),
    num(worstCount(n)),
  ]);
  const ratio = Math.round(worstCount(N) / T(N, HALF));
  return proofTable(
    md(
      [
        "n",
        "절반씩 갈릴 때 T(n)",
        "n log₂ n (반올림)",
        "한쪽이 빌 때 n(n−1)/2",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    `n = ${num(N)} 에서 절반씩 갈릴 때의 T(n) 은 정렬된 입력을 정본으로 센 비교와 같고, 한쪽이 빌 때는 그 약 ${num(ratio)} 배입니다.`,
  );
}

/* ───────────────────────── 불변식 ───────────────────────── */

/** 바퀴를 마칠 때마다 두 문장이 참인가 — 한 기록에서 센다. */
function holds(e: Cmp): boolean {
  const small = e.arr.slice(e.lo, e.iAfter);
  const big = e.arr.slice(e.iAfter, e.j + 1);
  return small.every((v) => v < e.pivot) && big.every((v) => v >= e.pivot);
}

function invariantSteps(): string {
  const t = run(A4);
  const rows = firstCmps(t).map((e) => [
    `j = ${e.j}`,
    `${e.a} < ${e.pivot} ${e.small ? "참" : "거짓"}`,
    valuesIn(e.arr, e.lo, e.iAfter - 1),
    valuesIn(e.arr, e.iAfter, e.j),
    holds(e) ? "참" : "거짓",
  ]);
  let rounds = 0;
  let broken = 0;
  for (let n = 1; n <= 7; n++) {
    for (const p of permutations(n)) {
      for (const e of cmpsOf(run(p))) {
        rounds++;
        if (!holds(e)) broken++;
      }
    }
  }
  return proofTable(
    md(["바퀴", "읽은 값", "arr[lo..i-1]", "arr[i..j]", "두 문장"], rows),
    `칸 1 개부터 7 개까지 모든 순열의 모든 바퀴 ${num(rounds)} 번에서도 두 문장을 확인했고, 거짓인 바퀴는 ${broken} 번입니다.`,
  );
}

function invariantEdges(): string {
  const cases: [string, number[]][] = [
    ["빈 배열", []],
    ["원소 하나", [7]],
    ["원소 둘", [2, 1]],
    ["전부 같음", [2, 2, 2, 2, 2]],
    ["음수가 섞임", [-10, 5, -3]],
  ];
  const rows = cases.map(([name, A]) => {
    const t = run(A);
    const first = t.events[0] as QsEvent;
    let where: string;
    if (first.kind === "base") {
      where = `\`hi - lo = ${first.hi - first.lo} < 1\` → 즉시 반환`;
    } else {
      const c = t.calls[0] as Call;
      const e = first as Enter;
      where = `pivotIdx = ${e.pivotIdx} · 기준값 ${c.pivot}${이가(c.pivot)} 인덱스 ${c.at} 에 · 비교 ${t.compares} 번`;
    }
    return [`${name} \`${show(A)}\``, where, `\`${show(t.out)}\``];
  });
  return proofTable(md(["입력", "처리되는 곳", "결과"], rows));
}

/** 불변식을 지키던 줄(`i++`) 하나를 지운 사본. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다. */
const broken = await loadMutant<Sorter>(REF, { drop: /^\s*i\+\+;\s*$/ });

const MUTANT_CASES: number[][] = [
  [5, 2, 3, 1],
  [5, 1, 1, 2, 0, 0],
  [-10, 5, -3, 0, 8, -1],
];

const isSorted = (xs: readonly number[]) =>
  xs.every((v, k) => k === 0 || (xs[k - 1] as number) <= v);

// 하나도 안 깨지면 이 절의 주장이 성립하지 않는다. 중화 실행(변이를 적용하지 않은 실행)에서는
// 사본이 정본 그대로라 이 검사를 건너뛴다 — 중화 여부는 함수가 정본과 같은 객체인가로 안다.
if (
  broken.quickSort !== quickSort &&
  MUTANT_CASES.every(
    (A) => show(quickSort([...A])) === show(broken.quickSort([...A])),
  )
) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
  );
}

function mutantTable(): string {
  const rows = MUTANT_CASES.map((A) => [
    show(A),
    show(quickSort([...A])),
    show(broken.quickSort([...A])),
  ]);
  const wrong = MUTANT_CASES.filter(
    (A) => !isSorted(broken.quickSort([...A])),
  ).length;
  return proofTable(
    md(["입력", "바른 코드", "`i++` 를 지운 코드"], rows),
    wrong === MUTANT_CASES.length
      ? `${countWord(wrong)} 벌 모두 결과가 오름차순이 아닙니다.`
      : `${countWord(MUTANT_CASES.length)} 벌 중 ${wrong} 벌에서 결과가 오름차순이 아닙니다.`,
  );
}

/**
 * 같은 줄(`i++`)을 기록 한 줄로 바꾼 사본 — 경계를 늘리지 않는 것은 `broken` 과 같고, ① 로 맞바꾼
 * 순간의 배열을 남긴다. 이 사본이 `broken` 과 같은 답을 내는지 대조한다.
 */
const brokenLogged = await loadMutant<Sorter>(REF, {
  swap: [
    /^(\s*)i\+\+;\s*$/,
    "$1(globalThis as unknown as { __qsNoInc: { arr: number[]; lo: number; hi: number; i: number; j: number }[] }).__qsNoInc.push({ arr: [...arr], lo, hi, i, j });",
  ],
});

function invariantMutantStep(): string {
  const g = globalThis as unknown as {
    __qsNoInc: {
      arr: number[];
      lo: number;
      hi: number;
      i: number;
      j: number;
    }[];
  };
  g.__qsNoInc = [];
  const out = brokenLogged.quickSort([...A4]);
  if (show(out) !== show(broken.quickSort([...A4]))) {
    throw new Error("기록하는 사본이 i++ 를 지운 사본과 다른 답을 냈다");
  }
  const first = run(A4).calls[0] as Call;
  const logs = g.__qsNoInc.filter(
    (r) => r.lo === first.lo && r.hi === first.hi,
  );
  const rows: string[][] = [
    [
      show(afterPivot()),
      `기준값 ${first.pivot}${을를(first.pivot)} 끝으로 뺀 뒤`,
    ],
  ];
  for (const r of logs) {
    const v = r.arr[r.i] as number;
    rows.push([
      show(r.arr),
      `j=${r.j}  ${v} < ${first.pivot} 참 → arr[${r.i}]${과와(r.i)} arr[${r.j}]${을를(r.j)} 맞바꾼다 · i 는 ${r.i} 그대로`,
    ]);
  }
  const last = logs.at(-1);
  if (last !== undefined) {
    const placed = [...last.arr];
    [placed[last.i], placed[first.hi]] = [
      placed[first.hi] as number,
      placed[last.i] as number,
    ];
    const right = placed[first.hi] as number;
    rows.push([
      show(placed),
      `루프 끝 i = ${last.i} — arr[${last.i}]${과와(last.i)} arr[${first.hi}]${을를(first.hi)} 맞바꾼다`,
    ]);
    rows.push([
      `기준값 ${first.pivot}${이가(first.pivot)} 인덱스 ${last.i} 에 갔는데 오른쪽 끝의 ${right}${이가(right)} 그보다 작다`,
    ]);
  }
  return columns(rows);
}

/* ───────────────────────── 비용 계산 ───────────────────────── */

function perfDerive(): string {
  const steps = walkSteps();
  const t = run(A4);
  const idOf = (e: QsEvent) => steps[t.events.indexOf(e)]?.id as string;
  const rows: string[][] = [];
  for (const c of t.calls) {
    const enter = enters(t).find(
      (e) => e.lo === c.lo && e.hi === c.hi,
    ) as Enter;
    const cs = cmpsOf(t).filter((e) => e.lo === c.lo && e.hi === c.hi);
    rows.push([
      idOf(enter),
      `구간 [${c.lo},${c.hi}] 크기 ${c.hi - c.lo + 1}`,
      `비교 ${c.compares} 번`,
      cs.map(idOf).join(" · "),
    ]);
  }
  const bases = t.events.filter((e): e is Base => e.kind === "base");
  rows.push([bases.map(idOf).join(" · "), "즉시 반환", "비교 0 번"]);
  rows.push(["", "", `합 ${t.compares} 번`]);
  return columns(rows);
}

function perfPerm(): string {
  const s = stats8(MIDDLE);
  const n = 8;
  return proofTable(
    md(
      [
        "n",
        "순열 수",
        "가장 적을 때",
        "평균",
        "가장 많을 때",
        "가장 많은 순열 수",
        "n log₂ n",
      ],
      [
        [
          String(n),
          num(s.total),
          String(s.min),
          s.mean.toFixed(2),
          `${s.max} = ${n}·${n - 1}/2`,
          num(s.maxCount),
          String(n * Math.log2(n)),
        ],
      ],
      [0, 1, 2, 3, 5, 6],
    ),
    "정본을 모든 순열에 실행해 센 값이고, 평균은 순열마다 같은 확률을 준 평균입니다.",
  );
}

function worstTable(): string {
  const rows: [string, number[]][] = [
    ["가운데 칸 최악으로 만든 입력", killer(8)],
    ["순열을 사전 순으로 돌며 처음 만난 최악", stats8(MIDDLE).firstMax],
    ["역순", sorted(8).reverse()],
    ["정렬된", sorted(8)],
    ["전부 같음", EQUAL8],
  ];
  return proofTable(
    md(
      ["입력 (n = 8)", "배열", "비교"],
      rows.map(([name, A]) => [name, show(A), String(comparisons(A))]),
      [2],
    ),
    `최악은 8 · 7 / 2 = ${worstCount(8)} 번이고, 정렬된 입력은 최악이 아닙니다.`,
  );
}

/** 최악 입력을 정본에 넣어 부름마다 — 가운데 칸의 값이 구간의 최솟값인가. */
function worstBuilt(): string {
  const A = killer(8);
  const t = run(A);
  const rows = enters(t).map((e) => {
    const seg = e.arr.slice(e.lo, e.hi + 1);
    return [
      `sort(${e.lo},${e.hi})`,
      show(seg),
      `인덱스 ${e.pivotIdx}`,
      String(e.arr[e.pivotIdx]),
      String(Math.min(...seg)),
    ];
  });
  const all = enters(t).every(
    (e) => e.arr[e.pivotIdx] === Math.min(...e.arr.slice(e.lo, e.hi + 1)),
  );
  return proofTable(
    md(
      ["부름", "그때의 구간", "가운데 칸", "가운데 칸의 값", "구간의 최솟값"],
      rows,
      [3, 4],
    ),
    `${show(A)}${을를(A.at(-1) as number)} 정본에 넣어 부름마다 기록했습니다. 가운데 칸의 값이 ${all ? "모든 부름에서" : "일부 부름에서만"} 구간의 최솟값이고, 비교는 ${t.compares} 번입니다.`,
  );
}

/* ───────────────────────── 스스로 점검하기 ───────────────────────── */

function selfcheckMisfile(): string {
  const t = run(A4);
  const first = t.calls[0] as Call;
  const firstCmp = firstCmps(t)[0] as Cmp;
  const bad = quickWith(MIDDLE, A4, {
    lo: first.lo,
    hi: first.hi,
    j: firstCmp.j,
  });
  const badFirst = bad.calls[0] as Call;
  return columns([
    [
      "T3 에서 i 를 늘렸다면",
      `첫 분할이 끝난 배열 ${show((places(bad)[0] as Place).arr)}`,
      `기준값 ${badFirst.pivot} 의 자리 인덱스 ${badFirst.at}`,
    ],
    [
      "바른 코드",
      `첫 분할이 끝난 배열 ${show((places(t)[0] as Place).arr)}`,
      `기준값 ${first.pivot} 의 자리 인덱스 ${first.at}`,
    ],
    [""],
    [`T3 에서 i 를 늘린 채 끝까지 정렬하면 ${show(bad.out)}`],
  ]);
}

export const PROOFS: Record<string, () => string> = {
  "concept-partition": conceptPartition,
  "concept-cost": conceptCost,
  "origin-cost": originCost,
  "origin-selection": originSelection,
  "origin-merge": originMerge,
  "origin-one-pass": originOnePass,
  "origin-sum": originSum,
  "origin-two-ways": originTwoWays,
  "origin-first-pivot": originFirstPivot,
  "build-regions-read": buildRegionsRead,
  "build-regions-grow": buildRegionsGrow,
  "build-regions-copy": buildRegionsCopy,
  "build-pivot": buildPivot,
  "build-scan-easy": buildScanEasy,
  "build-scan-swap": buildScanSwap,
  "build-place": buildPlace,
  "build-depth": buildDepth,
  "premise-balance": premiseBalance,
  "pivot-choice": pivotChoice,
  "pivot-choice-perm": pivotChoicePerm,
  "walk-input": walkInput,
  "walk-pivot": buildPivotMove,
  "walk-loop": walkLoop,
  "walk-place": walkPlace,
  "pause-sorted": pauseSorted,
  "pause-sorted-split": pauseSortedSplit,
  "walk-trace": walkTrace,
  "walk-branches": walkBranches,
  "pause-equal": pauseEqual,
  "pause-equal-calls": pauseEqualCalls,
  "final-calls": finalCalls,
  "related-select": relatedSelect,
  "related-cost": relatedCost,
  "math-check": mathCheck,
  "math-code": mathCode,
  "math-closed": mathClosed,
  "invariant-steps": invariantSteps,
  "invariant-edges": invariantEdges,
  "mutant-i-inc": mutantTable,
  "invariant-mutant-step": invariantMutantStep,
  "perf-derive": perfDerive,
  "perf-perm": perfPerm,
  "worst-input": worstTable,
  "worst-built": worstBuilt,
  "selfcheck-misfile": selfcheckMisfile,
};
