/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/insertionSort/insertionSort-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { insertionSort } from "./insertionSort-guide.ref.ts";

const REF = new URL("./insertionSort-guide.ref.ts", import.meta.url).pathname;

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

/** `[5 2 4 6 1 3]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** 자릿수가 넷을 넘으면 천 단위로 끊는다. 본문 표기와 같은 규칙이다. */
const num = (n: number): string => n.toLocaleString("en-US");

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

/** 두 값을 견주는 그 한 줄. 변이는 전부 이 줄에만 맞아야 한다. */
const COMPARE_LINE = /^(\s*)while \(j >= 0 && \(B\[j\] as number\) > key\) \{$/;
/** 큰 값을 오른쪽으로 옮기는 그 한 줄. */
const SHIFT_LINE = /^(\s*)B\[j \+ 1\] = B\[j\] as number;$/;
/** 멈춘 자리에 키를 넣는 그 한 줄 — 불변식을 지키던 줄이다. */
const INSERT_LINE = /^\s*B\[j \+ 1\] = key;$/;

type Sorter = { insertionSort(A: number[]): number[] };

interface Meter {
  c: number;
  s: number;
}
const meter = (): Meter => {
  const g = globalThis as unknown as { __ins: Meter };
  g.__ins = { c: 0, s: 0 };
  return g.__ins;
};

/** 견주기를 세는 사본. **정본 소스에서 기계로 만든다** — 그 한 줄에만 맞아야 한다. */
const countCompare = await loadMutant<Sorter>(REF, {
  swap: [
    COMPARE_LINE,
    "$1while (j >= 0 && (() => { ((globalThis as never as { __ins: { c: number; s: number } }).__ins).c++; return (B[j] as number) > key; })()) {",
  ],
});

/** 이동을 세는 사본. 옮기는 그 한 줄 앞에 계수만 끼운다. */
const countShift = await loadMutant<Sorter>(REF, {
  swap: [
    SHIFT_LINE,
    "$1{ ((globalThis as never as { __ins: { c: number; s: number } }).__ins).s++; B[j + 1] = B[j] as number; }",
  ],
});

/** 두 조건의 순서를 바꾼 사본. `j >= 0` 이 뒤로 갔다. */
const reordered = await loadMutant<Sorter>(REF, {
  swap: [COMPARE_LINE, "$1while ((B[j] as number) > key && j >= 0) {"],
});

/** 옮기는 방향을 반대로 적은 사본 — 왼쪽 값을 오른쪽 값으로 덮어쓴다. */
const backwards = await loadMutant<Sorter>(REF, {
  swap: [SHIFT_LINE, "$1B[j] = B[j + 1] as number;"],
});

/** 멈춘 자리에 키를 넣는 줄을 지운 사본 — 불변식을 지키던 줄이 사라진 것이다. */
const noInsert = await loadMutant<Sorter>(REF, { drop: INSERT_LINE });

/** 그 한 번의 호출이 한 견주기·이동 횟수. 답이 정본과 다르면 계측이 절차를 바꾼 것이다. */
function measure(A: number[]): { compares: number; shifts: number } {
  const want = JSON.stringify(insertionSort([...A]));
  const g1 = meter();
  const got1 = JSON.stringify(countCompare.insertionSort([...A]));
  const compares = g1.c;
  const g2 = meter();
  const got2 = JSON.stringify(countShift.insertionSort([...A]));
  const shifts = g2.s;
  if (got1 !== want || got2 !== want) {
    throw new Error(`계측한 사본이 정본과 다른 답을 냈다 — ${show(A)}`);
  }
  return { compares, shifts };
}

/* ───────────────── 물리치는 두 후보 — 정본이 아니다 ───────────────── */

/**
 * 가장 단순한 방법 — **모든 쌍을 견주어 순서가 틀렸으면 맞바꾼다.** 왼쪽이 정렬돼 있다는
 * 사실을 하나도 안 쓰므로 견주기가 입력과 무관하게 `N(N−1)/2` 다.
 */
function naiveCompares(A: number[]): number {
  const B = Array.from(A);
  let compares = 0;
  for (let p = 0; p < B.length; p++) {
    for (let q = p + 1; q < B.length; q++) {
      compares++;
      if ((B[p] as number) > (B[q] as number)) {
        const tmp = B[p] as number;
        B[p] = B[q] as number;
        B[q] = tmp;
      }
    }
  }
  return compares;
}

/**
 * 자리를 **왼쪽 끝에서부터** 찾는 후보. 정렬된 구역의 앞에서부터 보며 `key` 보다 큰 첫
 * 값을 만나면 거기가 자리다. 답은 정본과 같고 이동 횟수도 같다 — 갈리는 것은 견주기다.
 */
function leftScanCompares(A: number[]): number {
  const B = Array.from(A);
  let compares = 0;
  for (let i = 1; i < B.length; i++) {
    const key = B[i] as number;
    let p = 0;
    while (p < i) {
      compares++;
      if ((B[p] as number) > key) break;
      p++;
    }
    for (let q = i; q > p; q--) B[q] = B[q - 1] as number;
    B[p] = key;
  }
  if (JSON.stringify(B) !== JSON.stringify(insertionSort(A))) {
    throw new Error("왼쪽부터 찾는 후보가 정본과 다른 답을 냈다");
  }
  return compares;
}

/* ───────────────────────── 입력들 ───────────────────────── */

/** 전개가 쓰는 입력. */
const SIX = [5, 2, 4, 6, 1, 3];
/** 칸 수 64. 견주기 상한 `N(N−1)/2` 가 2,016 이라 대조가 눈으로 된다. */
const N = 64;
const range = (n: number): number[] => Array.from({ length: n }, (_, t) => t);
const reversed = (n: number): number[] =>
  Array.from({ length: n }, (_, t) => n - 1 - t);

/** `A[t] = t` 로 두고 서로 떨어진 이웃 쌍 `k` 개를 맞바꾼다. 역순쌍이 정확히 `k` 개다. */
function withSwaps(n: number, k: number): number[] {
  const out = range(n);
  for (let s = 0; s < k; s++) {
    const t = 2 * s;
    const tmp = out[t] as number;
    out[t] = out[t + 1] as number;
    out[t + 1] = tmp;
  }
  return out;
}

/** 역순쌍 개수 — `p < q` 이고 `A[p] > A[q]` 인 쌍의 수. 정의를 그대로 센다. */
function inversions(A: number[]): number {
  let count = 0;
  for (let p = 0; p < A.length; p++) {
    for (let q = p + 1; q < A.length; q++) {
      if ((A[p] as number) > (A[q] as number)) count++;
    }
  }
  return count;
}

/* ───────── 실행이 판정하는 사실들 — 어긋나면 그 자리에서 던진다 ───────── */

// ① 이동 횟수가 역순쌍 개수와 같은가. 본문 전체가 이 등식 위에 서 있다.
for (const A of [
  SIX,
  range(6),
  reversed(6),
  [4, 4, 4, 4],
  [-1, 3, -1, 2, 0, 2],
  withSwaps(N, 4),
  reversed(N),
]) {
  if (measure(A).shifts !== inversions(A)) {
    throw new Error(`이동 횟수가 역순쌍 개수와 다르다 — ${show(A)}`);
  }
}

// ② 왼쪽부터 찾는 후보가 정본과 **같은 답**을 내는가. 열등한 상대를 세우지 않기 위한 확인이다.
for (const A of [SIX, range(6), reversed(6), withSwaps(N, 4)]) leftScanCompares(A);

/* ───────── ④ 가장 단순한 방법과 나란히 ───────── */

/** `deep.build` ④ 가 쓰는 입력 셋. 여섯 칸으로 고정하고 정렬 상태만 바꾼다. */
const FOUR_CASES: [string, number[]][] = [
  ["전개 입력", SIX],
  ["이미 정렬", range(6).map((t) => t + 1)],
  ["역순", reversed(6).map((t) => t + 1)],
];

function naiveTable(): string {
  return table(
    ["여섯 칸 입력", "모든 쌍 견주기", "정렬된 구역을 쓰는 견주기"],
    FOUR_CASES.map(([name, A]) => [
      `${name} ${show(A)}`,
      num(naiveCompares(A)),
      num(measure(A).compares),
    ]),
    "└ 왼쪽 열은 입력이 달라도 같은 값이다",
  );
}

/* ───────── ⑤ 자리를 어느 끝에서부터 찾는가 ───────── */

const SCAN_CASES: [string, number[]][] = [
  ["전개 입력 여섯 칸", SIX],
  ["이미 정렬된 64 칸", range(N)],
  ["이웃 4 쌍만 뒤바뀐 64 칸", withSwaps(N, 4)],
  ["역순 64 칸", reversed(N)],
];

function scanTable(): string {
  return table(
    ["입력", "왼쪽 끝부터", "오른쪽 끝부터"],
    SCAN_CASES.map(([name, A]) => [
      name,
      num(leftScanCompares(A)),
      num(measure(A).compares),
    ]),
    "└ 두 후보의 이동 횟수는 어느 입력에서도 같다",
  );
}

/* ───────── ⑥ 흐트러진 정도를 바꿔 가며 ───────── */

const DISORDER: [string, number[]][] = [
  ["뒤바뀐 이웃 0 쌍", withSwaps(N, 0)],
  ["뒤바뀐 이웃 4 쌍", withSwaps(N, 4)],
  ["뒤바뀐 이웃 16 쌍", withSwaps(N, 16)],
  ["뒤바뀐 이웃 32 쌍", withSwaps(N, 32)],
  ["완전한 역순", reversed(N)],
];

function disorderTable(): string {
  return table(
    ["64 칸 입력", "역순쌍", "견주기", "이동", "모든 쌍 견주기"],
    DISORDER.map(([name, A]) => {
      const m = measure(A);
      return [
        name,
        num(inversions(A)),
        num(m.compares),
        num(m.shifts),
        num(naiveCompares(A)),
      ];
    }),
    "└ 이동 열이 역순쌍 열과 글자 그대로 같다",
  );
}

/* ───────── 제약 규모에서의 계수 ───────── */

/** 문제의 제약 상한. `1 ≤ N ≤ 10,000` 이다. */
const BIG = 10_000;

/**
 * 저장소의 성능 시험이 쓰는 입력 — `A[t] = t` 로 두고 `t = 0, 100, 200, …` 에서 이웃 두
 * 칸을 맞바꾼다. 맞바꾼 쌍이 서로 떨어져 있어 역순쌍이 정확히 그 쌍의 개수다.
 */
function nearlySortedBig(): number[] {
  const out = range(BIG);
  for (let t = 0; t + 1 < BIG; t += 100) {
    const tmp = out[t] as number;
    out[t] = out[t + 1] as number;
    out[t + 1] = tmp;
  }
  return out;
}

const BIG_CASES: [string, number[]][] = [
  ["이미 정렬", range(BIG)],
  ["이웃 100 쌍만 뒤바뀜", nearlySortedBig()],
  ["완전한 역순", reversed(BIG)],
];

function scaleTable(): string {
  return table(
    ["10,000 칸 입력", "역순쌍", "모든 쌍 견주기", "이 절차의 견주기", "이동"],
    BIG_CASES.map(([name, A]) => {
      const m = measure(A);
      return [
        name,
        num(inversions(A)),
        num((BIG * (BIG - 1)) / 2),
        num(m.compares),
        num(m.shifts),
      ];
    }),
    "└ 가운데 열만 입력과 무관하게 같은 값이다",
  );
}

/* ───────── 멈춤 1 — 두 조건의 순서 ───────── */

/** 저장소 테스트가 쓰는 입출력 케이스. 두 코드가 여기서 갈리는지 본다. */
const REPO_CASES: number[][] = [
  [5, 2, 4, 6, 1, 3],
  [1, 2, 3, 4, 5],
  [1, 3, 2, 4, 5],
  [5, 4, 3, 2, 1],
  [-1, 3, -1, 2, 0, 2],
  [4, 4, 4, 4],
  [42],
  [2, 1],
];

function orderTable(): string {
  const same = REPO_CASES.filter(
    (A) =>
      JSON.stringify(insertionSort([...A])) ===
      JSON.stringify(reordered.insertionSort([...A])),
  ).length;
  const rows = REPO_CASES.slice(0, 4).map((A) => [
    show(A),
    show(insertionSort([...A])),
    show(reordered.insertionSort([...A])),
  ]);
  return tableLeft(
    ["입력", "j >= 0 을 먼저", "j >= 0 을 나중에"],
    rows,
    `└ 저장소 테스트 케이스 ${same} 벌이 전부 같은 값을 낸다`,
  );
}

/* ───────── 멈춤 2 — 옮기는 방향 ───────── */

const BACKWARD_CASES: number[][] = [
  [5, 2, 4, 6, 1, 3],
  [5, 4, 3, 2, 1],
  [-1, 3, -1, 2, 0, 2],
];

const backwardRows = BACKWARD_CASES.map((A) => ({
  A,
  correct: insertionSort([...A]),
  broken: backwards.insertionSort([...A]),
}));

if (
  backwardRows.every(
    (r) => JSON.stringify(r.correct) === JSON.stringify(r.broken),
  )
) {
  throw new Error(
    "방향을 뒤집은 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「값이 사라진다」가 거짓이다",
  );
}

function backwardTable(): string {
  return tableLeft(
    ["입력", "B[j+1] = B[j]", "B[j] = B[j+1] 로 적은 코드"],
    backwardRows.map((r) => [show(r.A), show(r.correct), show(r.broken)]),
    "└ 세 벌 다 값이 사라지고 다른 값이 그 자리를 채운다",
  );
}

/* ───────── 불변식 ③ — 키를 넣는 줄을 지우면 ───────── */

const dropRows = REPO_CASES.slice(0, 5).map((A) => ({
  A,
  correct: insertionSort([...A]),
  broken: noInsert.insertionSort([...A]),
}));

if (
  dropRows.every((r) => JSON.stringify(r.correct) === JSON.stringify(r.broken))
) {
  throw new Error(
    "키를 넣는 줄을 지운 변이가 어느 입력에서도 답을 바꾸지 못했다",
  );
}

function dropTable(): string {
  const wrong = dropRows.filter(
    (r) => JSON.stringify(r.correct) !== JSON.stringify(r.broken),
  ).length;
  return tableLeft(
    ["입력", "바른 코드", "B[j+1] = key 를 지운 코드"],
    dropRows.map((r) => [show(r.A), show(r.correct), show(r.broken)]),
    `└ 다섯 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── 최악을 만드는 입력 ───────── */

/** 길이 `n` 인 모든 순열. 전수 확인에만 쓴다. */
function permutations(n: number): number[][] {
  const out: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const acc: number[] = [];
  const build = (): void => {
    if (acc.length === n) {
      out.push([...acc]);
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      acc.push(v);
      build();
      acc.pop();
      used[v] = false;
    }
  };
  build();
  return out;
}

const WORST_N = 6;

function worstTable(): string {
  const perms = permutations(WORST_N);
  const measured = perms.map((p) => measure(p));
  const maxCompare = Math.max(...measured.map((m) => m.compares));
  const maxShift = Math.max(...measured.map((m) => m.shifts));
  const byCompare = measured.filter((m) => m.compares === maxCompare).length;
  const byShift = measured.filter((m) => m.shifts === maxShift).length;
  const sorted = range(WORST_N);
  const rows: string[][] = [
    ["이미 정렬", sorted],
    ["전개 입력에서 값만 0…5 로", [4, 1, 3, 5, 0, 2]],
    ["역순", reversed(WORST_N)],
  ].map(([name, A]) => {
    const m = measure(A as number[]);
    return [
      `${name as string} ${show(A as number[])}`,
      num(m.compares),
      num(m.shifts),
    ];
  });
  rows.push([
    "N(N−1)/2 이 내는 값",
    num((WORST_N * (WORST_N - 1)) / 2),
    num((WORST_N * (WORST_N - 1)) / 2),
  ]);
  return table(
    ["여섯 칸 입력", "견주기", "이동"],
    rows,
    `└ 순열 ${num(perms.length)} 개 중 견주기 ${maxCompare} 번은 ${byCompare} 개가 내고 이동 ${maxShift} 번은 ${byShift} 개가 낸다`,
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 가장 단순한 방법과 정렬된 구역을 쓰는 방법을 같은 입력에서 나란히. */
  "naive-vs-prefix": naiveTable,
  /** `deep.build` ⑤ — 자리를 어느 끝에서부터 찾느냐가 견주기를 어떻게 가르는가. */
  "scan-direction": scanTable,
  /** `deep.build` ⑥ — 흐트러진 정도를 다섯 가지로 두고 실제 계수를 낸다. */
  "disorder-scale": disorderTable,
  /** `deep.build` ② · `perf.bounds` — 제약 상한 `N = 10,000` 에서의 실제 계수. */
  "scale-10k": scaleTable,
  /** `deep.walk.pause` — 두 조건의 순서를 바꿔도 이 문제의 답은 안 틀린다. */
  "mutant-order": orderTable,
  /** `deep.walk.pause` — 옮기는 방향을 반대로 적으면 값이 사라진다. */
  "mutant-backwards": backwardTable,
  /** `invariant` ③ — 불변식을 지키던 줄을 지웠을 때 나오는 **실제 값**. */
  "mutant-drop-insert": dropTable,
  /** `perf.worst` — 최악을 실제로 내는 입력은 무엇이고 몇 개인가. */
  "worst-input": worstTable,
};
