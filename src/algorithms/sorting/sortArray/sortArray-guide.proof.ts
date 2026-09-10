/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/sortArray/sortArray-guide.md
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를 } from "../../../../tools/josa.ts";
import { sortArray } from "./sortArray-guide.ref.ts";

const REF = new URL("./sortArray-guide.ref.ts", import.meta.url).pathname;

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

/** `[5 2 4 1 2 6]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** 「세 벌」 처럼 세는 말. 열까지만 쓰고 그 위는 숫자로 둔다. */
const countWord = (n: number): string =>
  ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"][
    n
  ] ?? String(n);

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

/** 왼쪽 정렬만 하는 표. 결과 배열처럼 자릿수가 제각각인 칸에 쓴다. */
function tableLeft(head: string[], rows: string[][], note: string): string {
  const cols = head.length;
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(width(head[c] as string), ...rows.map((r) => width(r[c] ?? ""))),
    );
  }
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) => pad(cell, w[c] as number))
      .join("   ")
      .replace(/\s+$/, "");
  const lead = w.slice(0, cols - 1).reduce((a, b) => a + b + 3, 0);
  return [line(head), ...rows.map(line), " ".repeat(lead) + note].join("\n");
}

/* ─────────────────── 정본을 계측한 사본 ─────────────────── */

/** 머리 둘을 견주는 그 한 줄. 변이는 전부 이 줄에만 맞아야 한다. */
const COMPARE_LINE =
  /^(\s*)if \(\(L\[i\] as number\) <= \(R\[j\] as number\)\) \{$/;

type Sorter = { sortArray(A: number[]): number[] };

/**
 * 비교 횟수를 세는 사본. **정본 소스에서 기계로 만든다** — 머리를 견주는 그 한 줄에만 맞아야
 * 하고, 아니면 `loadMutant` 가 던진다. 비교를 손으로 세면 「이 코드가 그만큼 비교한다」가
 * 검사되지 않는다.
 */
const counted = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if ((() => { ((globalThis as never as { __cmp: { n: number } }).__cmp).n++; return (L[i] as number) <= (R[j] as number); })()) {",
  ],
});

/** 그 한 번의 호출이 한 비교 횟수. 답이 정본과 다르면 계측이 절차를 바꾼 것이다. */
function comparisons(A: number[]): number {
  const g = globalThis as unknown as { __cmp: { n: number } };
  g.__cmp = { n: 0 };
  const got = counted.sortArray([...A]);
  const want = sortArray([...A]);
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`계측한 사본이 정본과 다른 답을 냈다 — ${show(A)}`);
  }
  return g.__cmp.n;
}

/** 머리가 같을 때 오른쪽을 먼저 꺼내는 사본. 안정 정렬을 잃은 쪽이다. */
const strict = await loadMutant<Sorter>(REF, {
  swap: [COMPARE_LINE, "$1if ((L[i] as number) < (R[j] as number)) {"],
});

/** 값을 `반 * 1000 + 점수` 로 읽고 **점수만** 견주는 사본. 같은 점수가 실제로 생긴다. */
const byScore = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if (((L[i] as number) % 1000) <= ((R[j] as number) % 1000)) {",
  ],
});

/** 같은 점수 견주기에서 오른쪽을 먼저 꺼내는 사본. */
const byScoreStrict = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1if (((L[i] as number) % 1000) < ((R[j] as number) % 1000)) {",
  ],
});

/** 기저에서 복사하지 않고 입력을 그대로 돌려주는 사본. */
const aliased = await loadMutant<Sorter>(REF, {
  swap: [/^(\s*)return A\.slice\(\);$/, "$1return A;"],
});

/** 머리 둘 중 **큰** 쪽을 꺼내는 사본 — 불변식을 지키던 그 줄을 뒤집은 것이다. */
const larger = await loadMutant<Sorter>(REF, {
  swap: [COMPARE_LINE, "$1if ((L[i] as number) > (R[j] as number)) {"],
});

/* ───────── 분할 자리를 바꿔 가며 최악 비교 횟수를 센다 ───────── */

/** 크기 `n` 인 조각을 왼쪽 몇 칸으로 가를 것인가. 오른쪽은 `n - p` 칸이다. */
type Split = (n: number) => number;

const SPLITS: [string, Split][] = [
  ["첫 칸", () => 1],
  ["1/4 지점", (n) => Math.max(1, Math.floor(n / 4))],
  ["한가운데", (n) => n >> 1],
];

/**
 * 그 규칙으로 갈랐을 때의 **최악 비교 횟수**.
 *
 * 크기 `p`·`q` 인 두 조각을 합치는 데 드는 비교는 많아야 `p + q - 1` 이다 — 반복이 한쪽을
 * 비우면 끝나므로, 마지막에 한 칸만 남을 때가 가장 많다. 그러니 전체 최악은 아래 재귀로 닫힌다.
 * 이 값이 실제로 나오는 입력이 있다는 것은 `worstInput` 이 만들고 아래에서 전수로 확인한다.
 */
function worstCount(
  split: Split,
  n: number,
  memo = new Map<number, number>(),
): number {
  if (n <= 1) return 0;
  const hit = memo.get(n);
  if (hit !== undefined) return hit;
  const p = Math.min(Math.max(1, split(n)), n - 1);
  const value =
    worstCount(split, p, memo) + worstCount(split, n - p, memo) + n - 1;
  memo.set(n, value);
  return value;
}

/** 그 규칙에서 최악을 실제로 내는 입력. 가장 큰 값과 그다음 값을 서로 다른 조각에 둔다. */
function worstInput(split: Split, values: number[]): number[] {
  const n = values.length;
  if (n <= 1) return [...values];
  const p = Math.min(Math.max(1, split(n)), n - 1);
  const left: number[] = [];
  const right: number[] = [];
  for (let t = n - 1; t >= 0; t--) {
    const toRight = (n - 1 - t) % 2 === 0;
    if (toRight && right.length < n - p) right.push(values[t] as number);
    else if (!toRight && left.length < p) left.push(values[t] as number);
    else if (right.length < n - p) right.push(values[t] as number);
    else left.push(values[t] as number);
  }
  left.reverse();
  right.reverse();
  return [...worstInput(split, left), ...worstInput(split, right)];
}

/** 그 규칙으로 가르는 절차의 비교 횟수. `한가운데` 줄은 정본과 같은 값을 내야 한다. */
function countWith(split: Split, A: number[]): number {
  let count = 0;
  const rec = (xs: number[]): number[] => {
    if (xs.length <= 1) return xs.slice();
    const p = Math.min(Math.max(1, split(xs.length)), xs.length - 1);
    const L = rec(xs.slice(0, p));
    const R = rec(xs.slice(p));
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < L.length && j < R.length) {
      count++;
      if ((L[i] as number) <= (R[j] as number)) out.push(L[i++] as number);
      else out.push(R[j++] as number);
    }
    while (i < L.length) out.push(L[i++] as number);
    while (j < R.length) out.push(R[j++] as number);
    return out;
  };
  rec(A);
  return count;
}

/** 길이 `n` 인 모든 순열. 전수 확인에만 쓴다. */
function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  const build = (used: boolean[], acc: number[]): void => {
    if (acc.length === n) {
      out.push([...acc]);
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      acc.push(v);
      build(used, acc);
      acc.pop();
      used[v] = false;
    }
  };
  build(new Array<boolean>(n).fill(false), []);
  return out;
}

// ① 계측한 사본과 「한가운데」 규칙이 같은 값을 내는가. 아니면 아래 표가 다른 절차를 잰 것이다.
// ② 재귀로 닫은 최악이 실제로 순열 전수의 최댓값과 같은가.
const HALVE = SPLITS[2]?.[1] as Split;
for (let n = 1; n <= 7; n++) {
  const perms = permutations(n);
  for (const p of perms) {
    if (countWith(HALVE, p) !== comparisons(p)) {
      throw new Error(`「한가운데」 규칙이 정본과 어긋난다 — ${show(p)}`);
    }
  }
  for (const [name, split] of SPLITS) {
    const bound = worstCount(split, n);
    const seen = Math.max(...perms.map((p) => countWith(split, p)));
    if (bound !== seen) {
      throw new Error(
        `${name} — 재귀로 닫은 최악 ${bound} 이 전수 최댓값 ${seen} 과 다르다 (n = ${n})`,
      );
    }
    if (countWith(split, worstInput(split, [...Array(n).keys()])) !== bound) {
      throw new Error(
        `${name} — 만든 최악 입력이 최악을 내지 못한다 (n = ${n})`,
      );
    }
  }
}

const SIZES = [8, 16, 64];

/** 닫힌 형태 `n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1`. 「수식 정의와 유도」가 이 식을 낸다. */
function closedForm(n: number): number {
  if (n <= 1) return 0;
  const k = Math.ceil(Math.log2(n));
  return n * k - 2 ** k + 1;
}

function splitTable(): string {
  const rows = SPLITS.map(([name, split]) => [
    name,
    ...SIZES.map((n) => String(worstCount(split, n))),
  ]);
  rows.push([
    "n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1",
    ...SIZES.map((n) => String(closedForm(n))),
  ]);
  return table(
    ["분할 자리", ...SIZES.map((n) => `n = ${n}`)],
    rows,
    "└ 한가운데로 가른 줄과 같다",
  );
}

/* ───────── 같은 값을 만났을 때 어느 쪽을 먼저 꺼내는가 ───────── */

/** 저장소 테스트가 쓰는 입력 중 같은 값이 들어 있는 것들. */
const TIE_CASES: number[][] = [
  [3, 1, 4, 1, 5, 9, 2, 6],
  [2, 2, 2, 1, 1, 1, 3, 3],
  [7, 7, 7, 7],
];

/** `반 * 1000 + 점수`. 40 점 둘은 3반이 먼저, 50 점 둘은 2반이 먼저 들어 있다. */
const SCORED = [2050, 1050, 3040, 1040];

function stableTable(): string {
  const same = TIE_CASES.filter(
    (A) =>
      JSON.stringify(sortArray([...A])) ===
      JSON.stringify(strict.sortArray([...A])),
  ).length;
  const first = tableLeft(
    ["입력", "L[i] <= R[j]", "L[i] < R[j]"],
    TIE_CASES.map((A) => [
      show(A),
      show(sortArray([...A])),
      show(strict.sortArray([...A])),
    ]),
    `└ ${countWord(same)} 벌 다 결과가 같다`,
  );

  const stable = byScore.sortArray([...SCORED]);
  const unstable = byScoreStrict.sortArray([...SCORED]);
  const second = tableLeft(
    ["점수만 견주면", "L[i] <= R[j]", "L[i] < R[j]"],
    [[show(SCORED), show(stable), show(unstable)]],
    "└ 40 점 둘의 앞뒤가 갈린다",
  );

  return `${first}\n\n${second}`;
}

/* ───────── 기저에서 복사하지 않으면 ───────── */

/** 저장소 테스트가 쓰는 입출력 케이스. 두 코드가 여기서 갈리는지 본다. */
const REPO_CASES: number[][] = [
  [3, 1, 4, 1, 5, 9, 2, 6],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [-3, 1, -4, 1, -5, 9, -2, 6],
  [2, 2, 2, 1, 1, 1, 3, 3],
  [7, 7, 7, 7],
  [42],
  [1_000_000_000, -1_000_000_000, 0],
];

function aliasTable(): string {
  const agree = REPO_CASES.filter(
    (A) =>
      JSON.stringify(sortArray([...A])) ===
      JSON.stringify(aliased.sortArray([...A])),
  ).length;

  const probe = (fn: (A: number[]) => number[]): string[] => {
    const one = [42];
    const out = fn(one);
    const shared = out === one;
    out[0] = 7;
    return [
      show([42]),
      shared ? "그렇다" : "아니다",
      one[0] === 7 ? "그렇다" : "아니다",
    ];
  };

  return table(
    [
      "기저가 돌려주는 것",
      "결과",
      "입력과 같은 배열인가",
      "결과를 고치면 입력도 바뀌는가",
    ],
    [
      ["A.slice() — 정본", ...probe((A) => sortArray(A))],
      ["A — 한 줄만 바꾼 것", ...probe((A) => aliased.sortArray(A))],
    ],
    `└ 저장소 테스트 케이스 ${agree} 벌은 두 코드가 같은 값을 낸다`,
  );
}

/* ───────── 불변식을 지키던 줄을 뒤집으면 ───────── */

const MUTANT_CASES: number[][] = [
  [5, 2, 4, 1, 2, 6],
  [3, 1, 4, 1, 5, 9, 2, 6],
  [-3, 1, -4, 1, -5, 9, -2, 6],
];

const mutantRows = MUTANT_CASES.map((A) => ({
  A,
  correct: sortArray([...A]),
  broken: larger.sortArray([...A]),
}));

// 하나도 안 어긋나면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (
  mutantRows.every(
    (r) => JSON.stringify(r.correct) === JSON.stringify(r.broken),
  )
) {
  throw new Error(
    "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
  );
}

function mutantTable(): string {
  const wrong = mutantRows.filter(
    (r) => JSON.stringify(r.correct) !== JSON.stringify(r.broken),
  ).length;
  return tableLeft(
    ["입력", "바른 코드", "<= 를 > 로 적은 코드"],
    mutantRows.map((r) => [show(r.A), show(r.correct), show(r.broken)]),
    wrong === mutantRows.length
      ? "└ 세 벌 다 답이 어긋난다"
      : `└ 세 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── 최악을 만드는 입력 ───────── */

const WORST_N = 8;

function worstTable(): string {
  const sorted = [...Array(WORST_N).keys()];
  const reversed = [...sorted].reverse();
  const built = worstInput(HALVE, sorted);
  const perms = permutations(WORST_N);
  const max = Math.max(...perms.map((p) => comparisons(p)));

  return table(
    ["입력", "비교 횟수"],
    [
      [`이미 정렬 ${show(sorted)}`, String(comparisons(sorted))],
      [`역순 ${show(reversed)}`, String(comparisons(reversed))],
      [`번갈아 짠 ${show(built)}`, String(comparisons(built))],
      ["닫힌 형태가 내는 값", String(closedForm(WORST_N))],
    ],
    `└ 순열 ${perms.length.toLocaleString("en-US")} 개를 전부 세어도 ${max}${을를(max)} 넘지 않는다`,
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ⑥ — 분할 자리를 셋으로 두고 최악 비교 횟수를 닫았을 때 어느 쪽이 적은가. */
  "split-choice": splitTable,
  /** `deep.walk.pause` — 같은 값에서 어느 쪽을 먼저 꺼내는가가 무엇을 바꾸는가. */
  "stable-tie": stableTable,
  /** `deep.walk.pause` — 기저에서 복사하지 않으면 무엇이 어긋나는가. */
  "alias-base": aliasTable,
  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 변이는 정본 소스에서 기계로 만들고, 한 줄에만 맞지 않으면 그 자리에서 던진다.
   */
  "mutant-take-larger": mutantTable,
  /** `perf.worst` — 최악을 실제로 내는 입력은 무엇인가. */
  "worst-input": worstTable,
};
