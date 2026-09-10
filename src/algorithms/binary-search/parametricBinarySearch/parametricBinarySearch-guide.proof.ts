/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  feasible,
  parametricBinarySearch,
} from "./parametricBinarySearch-guide.ref.ts";

const REF = new URL("./parametricBinarySearch-guide.ref.ts", import.meta.url)
  .pathname;

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

/** `[7 2 5 10 8]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** 세 자리마다 쉼표. 본문이 큰 수를 그렇게 적는다. */
const comma = (n: number): string => n.toLocaleString("en-US");

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
 * 판정한 후보값을 기록하는 사본. **정본 소스에서 기계로 만든다** — 후보값을 정하는 그 한
 * 줄에만 맞아야 하고, 아니면 `loadMutant` 가 던진다. 판정 횟수를 손으로 세면 「이 절차가
 * 그만큼 판정한다」가 검사되지 않는다.
 */
const traced = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, {
  swap: [
    /^(\s*)const mid = lo \+ Math\.floor\(\(hi - lo\) \/ 2\);$/,
    "$1const mid = lo + Math.floor((hi - lo) / 2);\n$1(globalThis as any).__probes.push(mid);",
  ],
});

/** 그 한 번의 호출이 판정한 후보값들. 길이가 곧 판정 횟수다. */
function probes(A: number[], K: number): number[] {
  const g = globalThis as unknown as { __probes: number[] };
  g.__probes = [];
  const got = traced.parametricBinarySearch(A, K);
  const want = parametricBinarySearch(A, K);
  if (got !== want) {
    throw new Error(
      `계측한 사본이 정본과 다른 답을 냈다 — ${show(A.slice(0, 8))} K=${K}: ${got} ≠ ${want}`,
    );
  }
  return g.__probes;
}

const maxOf = (A: number[]): number =>
  A.reduce((best, x) => (x > best ? x : best), 0);
const sumOf = (A: number[]): number => A.reduce((acc, x) => acc + x, 0);

/* ───────── ① 후보값마다 필요한 최소 묶음 수 ───────── */

const A5 = [7, 2, 5, 10, 8];
const K5 = 2;

/**
 * 묶음 합이 `m` 이하가 되게 나눌 때 필요한 최소 묶음 수.
 *
 * 정본의 `feasible` 은 참·거짓만 돌려주므로, `K` 를 1 부터 올리며 처음 참이 되는 자리를
 * 찾는다. 값을 여기서 다시 세지 않고 **정본의 판정으로만** 구하는 것이 요점이다.
 */
function minGroups(A: number[], m: number): number {
  for (let k = 1; k <= A.length; k++) {
    if (feasible(A, k, m)) return k;
  }
  return A.length + 1;
}

function groupTable(): string {
  const lo = maxOf(A5);
  const hi = sumOf(A5);
  /** 같은 값이 이어지는 구간을 한 줄로 접는다. */
  const runs: { g: number; from: number; to: number }[] = [];
  for (let m = lo; m <= hi; m++) {
    const g = minGroups(A5, m);
    const last = runs[runs.length - 1];
    if (last !== undefined && last.g === g) last.to = m;
    else runs.push({ g, from: m, to: m });
  }
  const answer = parametricBinarySearch(A5, K5);
  return table(
    ["최소 묶음 수", "그 값이 나오는 m"],
    runs.map((r) => [
      String(r.g),
      r.from === r.to ? String(r.from) : `${r.from} ~ ${r.to}`,
    ]),
    `└ 묶음 수가 ${K5} 이하로 처음 내려가는 m = ${answer}`,
  );
}

/* ───────── ② 후보값을 고르는 두 방식의 판정 횟수 ───────── */

/** 큰 입력 — 저장소 테스트가 쓰는 것과 같은 생성식이다. */
const BIG = Array.from({ length: 100_000 }, (_, i) => (i * 37) % 1_000_000);
const BIG_K = 100;

function probeTable(): string {
  const small = probes(A5, K5).length;
  const big = probes(BIG, BIG_K).length;
  /** 아래에서부터 1 씩 올리면 답에 이를 때까지 판정한 횟수다. */
  const oneByOne = (A: number[], K: number): number =>
    parametricBinarySearch(A, K) - maxOf(A) + 1;
  const span = (A: number[]): number => sumOf(A) - maxOf(A) + 1;
  return table(
    ["후보값을 고르는 방식", `N = ${A5.length}`, `N = ${comma(BIG.length)}`],
    [
      [
        "1 씩 올리며 판정한다",
        comma(oneByOne(A5, K5)),
        comma(oneByOne(BIG, BIG_K)),
      ],
      ["후보 구간을 반씩 접는다", comma(small), comma(big)],
      ["후보값은 모두 몇 개인가", comma(span(A5)), comma(span(BIG))],
    ],
    "└ 후보가 늘어도 반씩 접는 쪽은 거의 안 늘어난다",
  );
}

/* ───────── ③ 후보 구간의 아래 끝을 max(A) 로 안 잡으면 ───────── */

/**
 * `lo` 를 배열의 최댓값까지 올리는 줄을 지운 사본. **정본 소스에서 기계로 만든다** —
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noLowerBound = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, { drop: /^\s*if \(x > lo\) lo = x;$/ });

const BOUND_CASES: [number[], number][] = [
  [[10, 0, 0], 3],
  [[1, 4, 4], 3],
  [[3, 5], 2],
  [[7, 2, 5, 10, 8], 2],
];

function boundTable(): string {
  const rows = BOUND_CASES.map(([A, K]) => ({
    A,
    K,
    correct: parametricBinarySearch([...A], K),
    broken: noLowerBound.parametricBinarySearch([...A], K),
  }));
  const wrong = rows.filter((r) => r.correct !== r.broken).length;
  if (wrong === 0) {
    throw new Error("아래 끝을 안 올린 사본이 어느 입력에서도 답을 안 바꿨다");
  }
  return table(
    ["배열", "K", "바른 코드", "아래 끝을 0 으로 둔 코드"],
    rows.map((r) => [
      show(r.A),
      String(r.K),
      String(r.correct),
      String(r.broken),
    ]),
    `└ 네 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── ④ 부등호를 `>=` 로 적으면 ───────── */

/** `accSum + x > m` 을 `accSum + x >= m` 으로 바꾼 사본. */
const orEqual = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, {
  swap: [/^(\s*)if \(accSum \+ x > m\) \{$/, "$1if (accSum + x >= m) {"],
});

const GE_CASES: [number[], number][] = [
  [[7, 2, 5, 10, 8], 2],
  [[1, 2, 3, 4, 5], 2],
  [[0, 0, 0, 0], 2],
  [[10, 0, 0], 3],
];

function orEqualTable(): string {
  const rows = GE_CASES.map(([A, K]) => ({
    A,
    K,
    correct: parametricBinarySearch([...A], K),
    broken: orEqual.parametricBinarySearch([...A], K),
  }));
  const wrong = rows.filter((r) => r.correct !== r.broken).length;
  if (wrong === 0) {
    throw new Error("`>=` 사본이 어느 입력에서도 답을 안 바꿨다");
  }
  return table(
    ["배열", "K", "바른 코드", "`>=` 로 적은 코드"],
    rows.map((r) => [
      show(r.A),
      String(r.K),
      String(r.correct),
      String(r.broken),
    ]),
    `└ 네 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── ⑤ 반복 조건을 `lo < hi` 로 적으면 ───────── */

/** `while (lo <= hi)` 를 `while (lo < hi)` 로 바꾼 사본. */
const strictLoop = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, { swap: [/^(\s*)while \(lo <= hi\) \{$/, "$1while (lo < hi) {"] });

const LOOP_CASES: [number[], number][] = [
  [[7, 2, 5, 10, 8], 2],
  [[7, 7, 7], 2],
  [[5, 8, 9, 7], 2],
  [[1, 2, 3, 4, 5], 2],
];

function loopTable(): string {
  const rows = LOOP_CASES.map(([A, K]) => ({
    A,
    K,
    correct: parametricBinarySearch([...A], K),
    broken: strictLoop.parametricBinarySearch([...A], K),
  }));
  const wrong = rows.filter((r) => r.correct !== r.broken).length;
  if (wrong === 0) {
    throw new Error("`lo < hi` 사본이 어느 입력에서도 답을 안 바꿨다");
  }
  const gaps = new Set(rows.map((r) => r.correct - r.broken));
  gaps.delete(0);
  const gap = [...gaps];
  return table(
    ["배열", "K", "바른 코드", "`lo < hi` 로 적은 코드"],
    rows.map((r) => [
      show(r.A),
      String(r.K),
      String(r.correct),
      String(r.broken),
    ]),
    `└ 네 벌 중 ${wrong} 벌에서 답이 ${gap.join("·")} 씩 작다`,
  );
}

/* ───────── ⑥ 판정 횟수를 늘리는 입력 ───────── */

const SHAPES: [string, number[], number][] = [
  ["값이 전부 0 · N = 4", [0, 0, 0, 0], 2],
  ["한 칸만 큼 · N = 4", [1, 1, 1, 1_000_000], 2],
  ["전개가 쓴 입력 · N = 5", A5, 2],
  ["값이 전부 10^6 · N = 5", Array.from({ length: 5 }, () => 1_000_000), 2],
  ["값이 전부 10^6 · N = 100", Array.from({ length: 100 }, () => 1_000_000), 2],
  [
    "값이 전부 10^6 · N = 100,000",
    Array.from({ length: 100_000 }, () => 1_000_000),
    2,
  ],
];

function shapeTable(): string {
  const rows = SHAPES.map(([name, A, K]) => {
    const span = sumOf(A) - maxOf(A) + 1;
    return [
      name,
      comma(span),
      comma(probes(A, K).length),
      comma(Math.floor(Math.log2(span)) + 1),
    ];
  });
  return table(
    ["입력 모양", "후보값 개수", "판정 횟수", "⌊log₂ 개수⌋ + 1"],
    rows,
    "└ 판정 횟수는 N 이 아니라 후보값 개수를 따라간다",
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ⑤ — 후보값이 커질 때 필요한 묶음 수가 어떻게 변하는가. */
  "group-steps": groupTable,
  /** `deep.build` ⑥ — 후보값을 1 씩 올릴 때와 반씩 접을 때의 판정 횟수. */
  "probe-count": probeTable,
  /** `deep.walk.pause` — 후보 구간의 아래 끝을 0 으로 두면 무엇이 나오는가. */
  "lower-bound": boundTable,
  /** `deep.walk.pause` — 판정의 부등호를 `>=` 로 적으면 무엇이 나오는가. */
  "or-equal": orEqualTable,
  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 반복 조건 한 곳을 바꾸면 종료 시점의 `lo` 가 무엇을 가리키는지가 함께 바뀐다.
   */
  "loop-condition": loopTable,
  /** `perf.worst` — 어떤 입력이 판정 횟수를 최대로 만드는가. */
  "probe-shapes": shapeTable,
};
