/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/binary-search/binarySearch/binarySearch-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { binarySearch } from "./binarySearch-guide.ref.ts";

const REF = new URL("./binarySearch-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 칸 맞춤 ───────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[1 3 5 7 9 11]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/**
 * 칸을 맞춰 표를 그린다. 첫 열은 왼쪽 정렬, 나머지는 오른쪽 정렬이고 칸 사이는 세 칸이다.
 * 붙임말(`note`)은 마지막 열의 왼쪽 끝에 맞춰 단다.
 */
function table(head: string[], rows: string[][], note: string): string {
  const cols = head.length;
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(width(head[c] as string), ...rows.map((r) => width(r[c] ?? ""))),
    );
  }
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        c === 0 ? pad(cell, w[c] as number) : padLeft(cell, w[c] as number),
      )
      .join("   ")
      .replace(/\s+$/, "");
  const lead = w.slice(0, cols - 1).reduce((a, b) => a + b + 3, 0);
  return [line(head), ...rows.map(line), " ".repeat(lead) + note].join("\n");
}

/* ─────────────────── 정본을 계측한 사본 ─────────────────── */

/**
 * 읽은 칸을 기록하는 사본. **정본 소스에서 기계로 만든다** — `mid` 를 정하는 그 한 줄에만
 * 맞아야 하고, 아니면 `loadMutant` 가 던진다. 비교 횟수를 손으로 세면 「이 코드가 그만큼
 * 읽는다」가 검사되지 않는다.
 */
const traced = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, {
  swap: [
    /^(\s*)const mid = lo \+ Math\.floor\(\(hi - lo\) \/ 2\);$/,
    "$1const mid = lo + Math.floor((hi - lo) / 2);\n$1(globalThis as any).__reads.push(mid);",
  ],
});

/** 그 한 번의 호출이 읽은 인덱스들. 길이가 곧 비교 횟수다. */
function reads(A: number[], target: number): number[] {
  const g = globalThis as unknown as { __reads: number[] };
  g.__reads = [];
  const got = traced.binarySearch([...A], target);
  const want = binarySearch([...A], target);
  if (got !== want) {
    throw new Error(
      `계측한 사본이 정본과 다른 답을 냈다 — ${show(A)} target ${target}: ${got} ≠ ${want}`,
    );
  }
  return g.__reads;
}

/* ───────── ① 읽는 자리를 바꿔 가며 최악 비교 횟수를 센다 ───────── */

/** 후보 구간 `[lo, hi]` 에서 이번에 읽을 인덱스를 정하는 규칙. */
type Spot = (lo: number, hi: number) => number;

const SPOTS: [string, Spot][] = [
  ["첫 칸", (lo) => lo],
  ["1/4 지점", (lo, hi) => lo + Math.floor((hi - lo) / 4)],
  ["가운데", (lo, hi) => lo + Math.floor((hi - lo) / 2)],
  ["마지막 칸", (_lo, hi) => hi],
];

/** 읽는 자리만 바꾼 절차. 나머지 갱신 규칙은 정본과 같다. */
function countWith(A: number[], target: number, spot: Spot): number {
  let lo = 0;
  let hi = A.length - 1;
  let count = 0;
  while (lo <= hi) {
    const mid = spot(lo, hi);
    count++;
    if (A[mid] === target) return count;
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  return count;
}

/** 배열의 값과 그 사이·바깥의 없는 값까지 전부 넣어 본다. */
function allTargets(A: number[]): number[] {
  const out: number[] = [];
  for (
    let v = (A[0] as number) - 2;
    v <= (A[A.length - 1] as number) + 2;
    v++
  ) {
    out.push(v);
  }
  return out;
}

const ARRAYS: [string, number[]][] = [
  ["n = 6", [1, 3, 5, 7, 9, 11]],
  ["n = 15", Array.from({ length: 15 }, (_, i) => (i + 1) * 2)],
  ["n = 63", Array.from({ length: 63 }, (_, i) => (i + 1) * 2)],
];

// 「가운데」 줄은 정본이 실제로 읽는 횟수와 같아야 한다. 아니면 이 표가 다른 절차를 잰 것이다.
for (const [, A] of ARRAYS) {
  for (const t of allTargets(A)) {
    const byRule = countWith(A, t, SPOTS[2]?.[1] as Spot);
    if (byRule !== reads(A, t).length) {
      throw new Error(`가운데 규칙이 정본과 어긋난다 — ${show(A)} target ${t}`);
    }
  }
}

function worstTable(): string {
  const rows = SPOTS.map(([name, spot]) => [
    name,
    ...ARRAYS.map(([, A]) =>
      String(Math.max(...allTargets(A).map((t) => countWith(A, t, spot)))),
    ),
  ]);
  rows.push([
    "⌊log₂ n⌋ + 1",
    ...ARRAYS.map(([, A]) => String(Math.floor(Math.log2(A.length)) + 1)),
  ]);
  return table(
    ["읽는 자리", ...ARRAYS.map(([n]) => n)],
    rows,
    "└ 가운데를 읽은 줄과 같다",
  );
}

/* ───────── ② 최악을 내는 target ───────── */

const A6 = [1, 3, 5, 7, 9, 11];

function targetTable(): string {
  const groups = new Map<number, number[]>();
  for (const t of allTargets(A6)) {
    const c = reads(A6, t).length;
    groups.set(c, [...(groups.get(c) ?? []), t]);
  }
  const keys = [...groups.keys()].sort((a, b) => a - b);
  const worst = keys[keys.length - 1] as number;
  const total = allTargets(A6).length;
  const atWorst = (groups.get(worst) as number[]).length;

  const head = (k: number): string => `  비교 ${k} 번   `;
  const lines = [
    `${show(A6)} 에 target 을 ${allTargets(A6)[0]} 부터 ${allTargets(A6)[total - 1]} 까지 넣는다`,
    "",
  ];
  for (const k of keys) {
    lines.push(head(k) + (groups.get(k) as number[]).join(" · "));
  }
  lines.push(
    `${" ".repeat(width(head(worst)))}└ 가장 많은 것이 ${worst} 번 = ⌊log₂ 6⌋ + 1. ${total} 개 중 ${atWorst} 개가 여기 든다`,
  );
  return lines.join("\n");
}

/* ───────── ③ 중복된 값에서 어느 인덱스가 나오는가 ───────── */

const DUPES: [number[], number][] = [
  [[1, 3, 3, 3, 3, 5], 3],
  [[3, 3, 3, 3], 3],
  [[2, 4, 4, 6], 4],
];

function duplicateTable(): string {
  const rows = DUPES.map(([A, t]) => ({
    A,
    t,
    got: binarySearch([...A], t),
    left: A.indexOf(t),
  }));
  const differ = rows.filter((r) => r.got !== r.left).length;
  return table(
    ["배열", "target", "이 코드가 준 인덱스", "가장 왼쪽 인덱스"],
    rows.map((r) => [show(r.A), String(r.t), String(r.got), String(r.left)]),
    `└ 세 벌 중 ${differ} 벌에서 어긋난다`,
  );
}

/* ───────── ④ 정렬돼 있지 않은 배열을 넣으면 ───────── */

const UNSORTED: [number[], number][] = [
  [[5, 1, 3], 5],
  [[3, 1, 2], 2],
  [[9, 7, 5, 3, 1], 1],
];

function unsortedTable(): string {
  const rows = UNSORTED.map(([A, t]) => ({
    A,
    t,
    got: binarySearch([...A], t),
    real: A.indexOf(t),
  }));
  const same = rows.filter((r) => r.got === r.real).length;
  return table(
    ["배열", "target", "이 코드의 답", "실제 인덱스"],
    rows.map((r) => [show(r.A), String(r.t), String(r.got), String(r.real)]),
    `└ 예외는 나지 않는다. ${same} 벌만 우연히 맞는다`,
  );
}

/* ───────── ⑤ 불변식을 지키던 줄을 한 칸 더 버리게 바꾸면 ───────── */

/**
 * `hi = mid - 1` 을 `hi = mid - 2` 로 바꾼 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const broken = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, { swap: [/^(\s*)hi = mid - 1;$/, "$1hi = mid - 2;"] });

const MUTANT_CASES: [number[], number][] = [
  [[1, 3, 5, 7, 9, 11], 3],
  [[1, 3, 5, 7, 9, 11], 7],
  [[-10, -5, 0, 5, 10], -5],
];

const mutantRows = MUTANT_CASES.map(([A, t]) => ({
  A,
  t,
  correct: binarySearch([...A], t),
  broken: broken.binarySearch([...A], t),
}));

// 하나도 안 어긋나면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (mutantRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
  );
}

function mutantTable(): string {
  const wrong = mutantRows.filter((r) => r.correct !== r.broken).length;
  return table(
    ["배열", "target", "바른 코드", "hi = mid - 2 로 적은 코드"],
    mutantRows.map((r) => [
      show(r.A),
      String(r.t),
      String(r.correct),
      String(r.broken),
    ]),
    wrong === mutantRows.length
      ? "└ 세 벌 다 답이 어긋난다"
      : `└ 세 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ⑥ — 읽는 자리를 네 가지로 두고 실제로 세었을 때 어느 쪽이 적은가. */
  "spot-choice": worstTable,
  /** `perf.worst` — 어떤 target 이 최악 비교 횟수를 내는가. */
  "worst-targets": targetTable,
  /** `deep.walk.pause` — 값이 중복되면 이 코드가 어느 인덱스를 주는가. */
  "duplicate-index": duplicateTable,
  /** `deep.walk.pause` — 정렬 전제가 어긋난 배열을 넣으면 무엇이 나오는가. */
  "unsorted-answer": unsortedTable,
  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 옛 이해 시험 `V5` 가 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만
   * 달라도 잡는다.
   */
  "mutant-hi-step": mutantTable,
};
