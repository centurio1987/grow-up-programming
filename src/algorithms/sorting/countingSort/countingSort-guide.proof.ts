/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/countingSort/countingSort-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { mergeCounts } from "./countingSort-guide.alt.ts";
import { countingSort } from "./countingSort-guide.ref.ts";

const REF = new URL("./countingSort-guide.ref.ts", import.meta.url).pathname;

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

/** `[3 1 3 0 5 1 3]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** 자릿수가 넷을 넘으면 천 단위로 끊는다. 본문 표기와 같은 규칙이다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 첫째 자리까지. 원소당 비용처럼 나눗셈이 들어간 칸에 쓴다. */
const num1 = (n: number): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

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

/* ─────────────────── 정본에서 기계로 만든 변이 ─────────────────── */

/** 키 값 공간의 칸 수를 정하는 그 한 줄. */
const K_LINE = /^const K = 1001;$/;
/** 개수를 하나 늘리는 그 한 줄 — 불변식을 지키던 줄이다. */
const COUNT_LINE =
  /^(\s*)for \(const v of A\) count\[v\] = \(count\[v\] as number\) \+ 1;$/;

type Sorter = { countingSort(A: number[]): number[] };

/** 칸을 1000 개만 잡은 사본. 값 1000 이 자리를 못 갖는다. */
const size1000 = await loadMutant<Sorter>(REF, {
  swap: [K_LINE, "const K = 1000;"],
});

/** 개수 대신 「나왔다」만 적는 사본. 같은 값이 여럿이어도 1 로 남는다. */
const flagOnly = await loadMutant<Sorter>(REF, {
  swap: [COUNT_LINE, "$1for (const v of A) count[v] = 1;"],
});

/* ─────────────── 계측한 사본들 — 손으로 적지 않고 실행해 센다 ─────────────── */

/** 이 가이드가 쓰는 계수. **배열 칸을 읽거나 쓴 횟수 전부**를 접근으로 센다. */
interface Counts {
  /** 배열 칸을 읽거나 쓴 횟수. */
  access: number;
  /** 배열의 두 값을 견준 횟수. */
  compares: number;
}

/**
 * 정본과 **같은 절차**를 계수만 붙여 다시 적은 것. 키 값 공간의 칸 수 `k` 를 밖에서 받는
 * 것만 다르다 — 정본은 그 값이 1001 로 고정이라 `k` 를 바꿔 가며 잴 수 없다.
 *
 * `k = 1001` 일 때 정본과 **같은 답을 내는지** 아래에서 실행으로 확인한다. 안 그러면 이
 * 계수는 다른 절차를 잰 값이 된다.
 */
function countingCounts(A: number[], k: number): Counts & { out: number[] } {
  let access = 0;
  const count = new Array<number>(k).fill(0);
  access += k; // ① 초기화 — k 칸에 0 을 적는다

  for (const v of A) {
    access += 3; // ② A[i] 읽기 · count[v] 읽기 · count[v] 쓰기
    count[v] = (count[v] as number) + 1;
  }

  const out: number[] = [];
  for (let v = 0; v < k; v++) {
    access += 1; // ③ count[v] 읽기
    for (let t = count[v] as number; t > 0; t--) {
      access += 1; // ④ out 에 한 칸 쓰기
      out.push(v);
    }
  }
  return { access, compares: 0, out };
}

/** 정본의 키 값 공간. 계측 사본이 이 값에서 정본과 같은 답을 내야 한다. */
const K = 1001;

/**
 * 가장 단순한 방법 — **모든 쌍을 견주어 순서가 틀렸으면 맞바꾼다.** 값의 범위를 하나도
 * 쓰지 않으므로 견주기가 입력과 무관하게 `N(N−1)/2` 다.
 */
function naiveCounts(A: number[]): Counts & { out: number[] } {
  let access = 0;
  let compares = 0;
  const B = Array.from(A);
  access += 2 * A.length; // 복사 — 읽기 N + 쓰기 N

  for (let p = 0; p < B.length; p++) {
    for (let q = p + 1; q < B.length; q++) {
      access += 2;
      compares++;
      if ((B[p] as number) > (B[q] as number)) {
        access += 4; // 맞바꿈 — 읽기 2 + 쓰기 2
        const tmp = B[p] as number;
        B[p] = B[q] as number;
        B[q] = tmp;
      }
    }
  }
  return { access, compares, out: B };
}

/**
 * 개수를 세는 **가장 단순한 후보** — 값 `v` 마다 배열 전체를 다시 읽어 몇 개인지 센다.
 * 답은 자리를 쓰는 방식과 같고, 갈리는 것은 접근 횟수다.
 */
function rescanCount(A: number[], k: number): number {
  let access = 0;
  const count = new Array<number>(k).fill(0);
  access += k;
  for (let v = 0; v < k; v++) {
    let c = 0;
    for (let i = 0; i < A.length; i++) {
      access += 1;
      if (A[i] === v) c++;
    }
    count[v] = c;
    access += 1;
  }
  return access;
}

/** 집계 단계만 잰 값 — 자리를 그대로 쓰는 방식. 초기화 `k` 칸과 원소당 세 번이다. */
function directCount(A: number[], k: number): number {
  return k + 3 * A.length;
}

/* ───────────────────────── 입력들 ───────────────────────── */

/** 전개가 쓰는 입력. 값 0 과 중복 셋, 그리고 개수가 0 인 자리 둘(2 와 4)이 함께 나온다. */
const SEVEN = [3, 1, 3, 0, 5, 1, 3];
/** 같은 일곱 칸을 오름차순으로 놓은 것. */
const SEVEN_SORTED = [0, 1, 1, 3, 3, 3, 5];
/** 같은 일곱 칸을 내림차순으로 놓은 것. */
const SEVEN_REVERSED = [5, 3, 3, 3, 1, 1, 0];

/** 문제의 제약 상한. `1 ≤ N ≤ 100,000` 이다. */
const BIG = 100_000;

/** 난수를 쓰지 않는 생성식. `A[i] = (i × 37) mod 1001` 이라 값이 0 … 1000 에 고루 놓인다. */
const spread = (n: number): number[] =>
  Array.from({ length: n }, (_, t) => (t * 37) % 1001);

/* ───────── 실행이 판정하는 사실들 — 어긋나면 그 자리에서 던진다 ───────── */

// ① 계측 사본이 `k = 1001` 에서 정본과 같은 답을 내는가.
for (const A of [
  SEVEN,
  SEVEN_SORTED,
  SEVEN_REVERSED,
  [],
  [1000, 0, 500, 1000, 0],
  spread(500),
]) {
  const got = JSON.stringify(countingCounts(A, K).out);
  if (got !== JSON.stringify(countingSort(A))) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${show(A)}`);
  }
}

// ② 접근 수의 닫힌 형태 `2K + 4N` 이 실측과 같은가. 본문이 이 식으로 값을 낸다.
for (const [A, k] of [
  [SEVEN, 8],
  [SEVEN, K],
  [spread(1_000), K],
  [spread(BIG), K],
] as [number[], number][]) {
  if (countingCounts(A, k).access !== 2 * k + 4 * A.length) {
    throw new Error(`접근 수가 2K + 4N 과 다르다 — N=${A.length}, K=${k}`);
  }
}

// ③ 모든 쌍 견주기의 견주기 횟수가 `N(N−1)/2` 인가. 큰 `N` 은 이 식으로 값을 낸다.
for (const A of [SEVEN, SEVEN_SORTED, SEVEN_REVERSED, spread(200)]) {
  const n = A.length;
  if (naiveCounts(A).compares !== (n * (n - 1)) / 2) {
    throw new Error(`모든 쌍 견주기의 횟수가 N(N−1)/2 와 다르다 — N=${n}`);
  }
  if (JSON.stringify(naiveCounts(A).out) !== JSON.stringify(countingSort(A))) {
    throw new Error(`가장 단순한 방법이 다른 답을 냈다 — ${show(A)}`);
  }
}

/* ───────── deep.build ② — 제약 상한에서의 계수 ───────── */

/**
 * `N = 100,000` 에서 모든 쌍 견주기를 실제로 실행하면 50 억 바퀴라 검사를 돌릴 수 없다.
 * 대신 위 ③ 이 확인한 닫힌 형태 `N(N−1)/2` 로 값을 낸다 — 작은 `N` 에서 실행과 같음을
 * 확인한 식이다.
 */
const allPairs = (n: number): number => (n * (n - 1)) / 2;

function scaleTable(): string {
  const rows = [1, 100, 1_000, BIG].map((n) => {
    const A = spread(n);
    const m = countingCounts(A, K);
    return [`${num(n)} 칸`, num(allPairs(n)), num(m.compares), num(m.access)];
  });
  return table(
    ["입력 칸 수", "모든 쌍 견주기", "이 절차의 견주기", "이 절차의 배열 접근"],
    rows,
    "└ 가운데 열이 0 이다. 이 절차에는 두 값을 견주는 자리가 없다",
  );
}

/* ───────── deep.build ④ — 같은 입력에서 두 방식 ───────── */

const FOUR_CASES: [string, number[]][] = [
  ["전개 입력", SEVEN],
  ["이미 정렬", SEVEN_SORTED],
  ["역순", SEVEN_REVERSED],
];

function naiveTable(): string {
  return table(
    [
      "일곱 칸 입력",
      "모든 쌍 견주기",
      "모든 쌍 배열 접근",
      "값을 세는 방식의 접근",
    ],
    FOUR_CASES.map(([name, A]) => {
      const a = naiveCounts(A);
      return [
        `${name} ${show(A)}`,
        num(a.compares),
        num(a.access),
        num(countingCounts(A, K).access),
      ];
    }),
    "└ 오른쪽 열은 입력이 달라도 같은 값이다",
  );
}

/* ───────── deep.build ⑤ — 개수를 어떻게 세는가 ───────── */

const SCAN_CASES: [string, number[]][] = [
  ["전개 입력 일곱 칸", SEVEN],
  ["100 칸", spread(100)],
  ["1,000 칸", spread(1_000)],
  ["100,000 칸", spread(BIG)],
];

function scanTable(): string {
  return table(
    ["집계 단계만 잰 접근", "값마다 배열을 다시 읽기", "값을 자리로 쓰기"],
    SCAN_CASES.map(([name, A]) => [
      name,
      num(rescanCount(A, K)),
      num(directCount(A, K)),
    ]),
    "└ 두 방식이 만드는 count 배열은 어느 입력에서도 같다",
  );
}

// 두 방식이 같은 개수 표를 만드는지 확인한다. 열등한 상대를 세우지 않기 위한 자리다.
for (const [, A] of SCAN_CASES.slice(0, 3)) {
  const byRescan = new Array<number>(K).fill(0);
  for (let v = 0; v < K; v++) {
    byRescan[v] = A.filter((x) => x === v).length;
  }
  const byDirect = new Array<number>(K).fill(0);
  for (const v of A) byDirect[v] = (byDirect[v] as number) + 1;
  if (JSON.stringify(byRescan) !== JSON.stringify(byDirect)) {
    throw new Error("두 집계 방식이 다른 개수 표를 만들었다");
  }
}

/* ───────── deep.build ⑥ — 칸 수를 바꿔 가며 ───────── */

const SWEEP: [number, number][] = [
  [7, 8],
  [7, 64],
  [7, K],
  [7, 1_000_000],
  [BIG, K],
  [BIG, 1_000_000],
];

function sweepTable(): string {
  return table(
    ["칸 수 N", "키 공간 K", "배열 접근", "원소당 접근"],
    SWEEP.map(([n, k]) => {
      const A = n === 7 ? SEVEN : spread(n);
      const m = countingCounts(A, k);
      return [num(n), num(k), num(m.access), num1(m.access / n)];
    }),
    "└ 접근이 2K + 4N 이라 K 가 N 보다 크면 원소당 비용이 K/N 을 따라간다",
  );
}

/* ───────── 멈춤 1 — 칸을 1000 개만 잡으면 ───────── */

/** 저장소 테스트가 쓰는 입출력 케이스 중 **난수가 없는** 여덟 벌. */
const REPO_CASES: number[][] = [
  [4, 2, 2, 8, 3, 3, 1],
  [0, 1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1, 0],
  [3, 3, 3, 1, 1, 2],
  [7, 7, 7],
  [0, 0, 1, 0],
  [5],
  [1000, 0, 500, 1000, 0],
];

const sizeRows = REPO_CASES.map((A) => ({
  A,
  correct: countingSort(A),
  broken: size1000.countingSort(A),
}));

if (
  sizeRows.every((r) => JSON.stringify(r.correct) === JSON.stringify(r.broken))
) {
  throw new Error(
    "칸을 1000 개만 잡은 변이가 어느 케이스에서도 답을 바꾸지 못했다 — 「값 1000 이 사라진다」가 거짓이다",
  );
}

function sizeTable(): string {
  const wrong = sizeRows.filter(
    (r) => JSON.stringify(r.correct) !== JSON.stringify(r.broken),
  ).length;
  return tableLeft(
    ["입력", "K = 1001", "K = 1000 으로 적은 코드"],
    [sizeRows[0], sizeRows[3], sizeRows[6], sizeRows[7]].map((r) => [
      show((r as (typeof sizeRows)[number]).A),
      show((r as (typeof sizeRows)[number]).correct),
      show((r as (typeof sizeRows)[number]).broken),
    ]),
    `└ 난수 없는 케이스 여덟 벌 중 ${wrong} 벌에서만 답이 어긋난다`,
  );
}

/* ───────── 멈춤 2 — 이중 반복의 총 실행 횟수 ───────── */

/** 바깥 반복과 안쪽 반복이 각각 몇 번 실행되는지 센다. */
function loopCounts(A: number[], k: number): { outer: number; inner: number } {
  const count = new Array<number>(k).fill(0);
  for (const v of A) count[v] = (count[v] as number) + 1;
  let outer = 0;
  let inner = 0;
  for (let v = 0; v < k; v++) {
    outer++;
    for (let t = count[v] as number; t > 0; t--) inner++;
  }
  return { outer, inner };
}

const LOOP_CASES: [string, number[]][] = [
  ["전개 입력 일곱 칸", SEVEN],
  ["값이 전부 같은 일곱 칸", [7, 7, 7, 7, 7, 7, 7]],
  ["1,000 칸", spread(1_000)],
  ["100,000 칸", spread(BIG)],
];

// 안쪽 반복의 총 실행이 정확히 `N` 인지 확인한다. 본문의 주장이 이 등식이다.
for (const [, A] of LOOP_CASES) {
  if (loopCounts(A, K).inner !== A.length) {
    throw new Error(`안쪽 반복의 총 실행이 N 과 다르다 — N=${A.length}`);
  }
}

function loopTable(): string {
  return table(
    ["입력", "바깥 반복", "안쪽 반복 총 실행", "N × K 가 내는 값"],
    LOOP_CASES.map(([name, A]) => {
      const c = loopCounts(A, K);
      return [name, num(c.outer), num(c.inner), num(A.length * K)];
    }),
    "└ 안쪽 열이 칸 수 N 과 글자 그대로 같다",
  );
}

/* ───────── 불변식 ③ — 개수 대신 「나왔다」만 적으면 ───────── */

const flagRows = [
  SEVEN,
  SEVEN_SORTED,
  [7, 7, 7],
  [0, 1, 2, 3, 4, 5],
  [0, 0, 1, 0],
].map((A) => ({
  A,
  correct: countingSort(A),
  broken: flagOnly.countingSort(A),
}));

if (
  flagRows.every((r) => JSON.stringify(r.correct) === JSON.stringify(r.broken))
) {
  throw new Error(
    "개수 대신 1 을 적은 변이가 어느 입력에서도 답을 바꾸지 못했다",
  );
}

function flagTable(): string {
  const wrong = flagRows.filter(
    (r) => JSON.stringify(r.correct) !== JSON.stringify(r.broken),
  ).length;
  return tableLeft(
    ["입력", "바른 코드", "count[v] = 1 로 적은 코드"],
    flagRows.map((r) => [show(r.A), show(r.correct), show(r.broken)]),
    `└ 다섯 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── 최악을 만드는 입력 ───────── */

/** 같은 다중집합의 서로 다른 배치 전부. `[0 1 1 3 3 3 5]` 는 7!/(2!·3!) = 420 가지다. */
function arrangements(multiset: number[]): number[][] {
  const out: number[][] = [];
  const rest = [...multiset].sort((a, b) => a - b);
  const acc: number[] = [];
  const used = new Array<boolean>(rest.length).fill(false);
  const build = (): void => {
    if (acc.length === rest.length) {
      out.push([...acc]);
      return;
    }
    let last: number | null = null;
    for (let t = 0; t < rest.length; t++) {
      if (used[t] === true) continue;
      const v = rest[t] as number;
      if (last === v) continue; // 같은 값을 같은 자리에 두 번 놓지 않는다
      last = v;
      used[t] = true;
      acc.push(v);
      build();
      acc.pop();
      used[t] = false;
    }
  };
  build();
  return out;
}

const ARRANGEMENTS = arrangements(SEVEN);

// 배치가 접근 횟수를 바꾸지 못하는지 전수로 확인한다. `perf.worst` 의 주장이 이것이다.
{
  const accesses = ARRANGEMENTS.map((A) => countingCounts(A, K).access);
  if (Math.min(...accesses) !== Math.max(...accesses)) {
    throw new Error("같은 다중집합의 배치가 접근 횟수를 바꿨다");
  }
  for (const A of ARRANGEMENTS) {
    if (JSON.stringify(countingSort(A)) !== JSON.stringify(SEVEN_SORTED)) {
      throw new Error(`배치 하나가 다른 답을 냈다 — ${show(A)}`);
    }
  }
}

function worstTable(): string {
  const accesses = ARRANGEMENTS.map((A) => countingCounts(A, K).access);
  const rows = [1, 7, 1_000, BIG].map((n) => {
    const A = n === 7 ? SEVEN : spread(n);
    const m = countingCounts(A, K);
    return [`${num(n)} 칸`, num(m.access), num1(m.access / n)];
  });
  return table(
    ["K = 1001 에서의 입력", "배열 접근", "원소당 접근"],
    rows,
    `└ 일곱 칸의 배치 ${num(ARRANGEMENTS.length)} 가지는 접근이 전부 ${num(accesses[0] as number)} 번으로 같다`,
  );
}

/* ───────── deep.math ④ — 제약 규모에서의 계수 ───────── */

/**
 * $\log_2 N!$ 을 정의대로 더해서 낸다. 스털링 근사를 쓰지 않는 이유는 근사가 아래쪽으로
 * 어긋날 때 「하한」이라는 말이 거짓이 되기 때문이다 — 여기서는 정의를 그대로 더한다.
 */
function log2Factorial(n: number): number {
  let sum = 0;
  for (let t = 2; t <= n; t++) sum += Math.log2(t);
  return sum;
}

/** `T(N, K) = 2K + 4N` — `deep.math` 가 유도한 닫힌 형태. */
const totalAccess = (n: number, k: number): number => 2 * k + 4 * n;

// 닫힌 형태가 실측과 같은지 다시 확인한다. 위 ② 가 이미 본 것이지만 이 표가 그 식을 쓴다.
if (totalAccess(7, K) !== countingCounts(SEVEN, K).access) {
  throw new Error("2K + 4N 이 실측과 다르다");
}

/** `K = 1001` 에서 이 절차의 접근이 비교 정렬의 견주기 하한 이하가 되는 첫 `N`. */
function mathCrossover(): number {
  let sum = 0;
  for (let n = 2; n <= 5_000; n++) {
    sum += Math.log2(n);
    if (totalAccess(n, K) <= sum) return n;
  }
  throw new Error("5,000 칸까지 뒤집히는 자리를 못 찾았다");
}

function mathScaleTable(): string {
  const n = BIG;
  const t = totalAccess(n, K);
  const bound = Math.floor(log2Factorial(n));
  return table(
    ["제약 규모에서의 두 값", "값"],
    [
      ["키 공간 K", num(K)],
      ["칸 수 N", num(n)],
      ["T(N, K) = 2K + 4N", num(t)],
      ["log2(N!) 의 내림값", num(bound)],
      ["두 값의 비", `${num1(bound / t)} 배`],
    ],
    `└ K = ${num(K)} 에서 T(N,K) ≤ log2(N!) 이 되는 첫 N 은 ${num(mathCrossover())} 다`,
  );
}

/* ───────── purpose.alt — 우열이 뒤집히는 자리 ───────── */

/**
 * 병합 정렬의 계수는 `countingSort-guide.alt.ts` 에서 가져온다 — `purpose.alt` 의 표와 같은
 * 코드라야 두 자리의 값이 어긋나지 않는다.
 *
 * 칸 수를 하나씩 늘려 가며 **계수 정렬의 접근이 병합 정렬 이하가 되는 첫 `N`** 을 찾는다.
 * 「어느 조건에서 뒤집히는가」의 답이 그 `N` 이다.
 */
function crossoverN(): number {
  for (let n = 2; n <= 400; n++) {
    const A = spread(n);
    if (countingCounts(A, K).access <= mergeCounts(A).access) return n;
  }
  throw new Error("400 칸까지 뒤집히는 자리를 못 찾았다");
}

function crossoverTable(): string {
  const at = crossoverN();
  const rows = [20, at - 1, at, 200].map((n) => {
    const A = spread(n);
    const c = countingCounts(A, K).access;
    const m = mergeCounts(A).access;
    return [
      `${num(n)} 칸`,
      num(c),
      num(m),
      c <= m ? "계수 정렬이 적다" : "병합 정렬이 적다",
    ];
  });
  return table(
    [
      "생성식으로 만든 입력",
      "계수 정렬 접근",
      "병합 정렬 접근",
      "어느 쪽이 적은가",
    ],
    rows,
    `└ ${num(at)} 칸에서 처음으로 순서가 뒤집힌다`,
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 제약 상한까지 넓혀 본 모든 쌍 견주기와 이 절차의 계수. */
  "scale-100k": scaleTable,
  /** `deep.build` ④ — 같은 일곱 칸에서 모든 쌍 방식과 값을 세는 방식을 나란히. */
  "naive-vs-count": naiveTable,
  /** `deep.build` ⑤ — 개수를 세는 두 방법. 값마다 다시 읽기 대 값을 자리로 쓰기. */
  "rescan-vs-direct": scanTable,
  /** `deep.build` ⑥ — 키 공간의 칸 수를 다섯 가지로 두고 실제 접근을 센다. */
  "k-sweep": sweepTable,
  /** `deep.walk.pause` — 칸을 1000 개만 잡으면 값 1000 이 사라진다. */
  "size-1000": sizeTable,
  /** `deep.walk.pause` — 이중 반복이지만 안쪽 반복의 총 실행은 N 이다. */
  "loop-total": loopTable,
  /** `invariant` ③ — 개수를 세던 그 줄을 바꿨을 때 나오는 **실제 값**. */
  "mutant-flag-only": flagTable,
  /** `perf.worst` — 배치는 비용을 못 바꾸고, 최악은 원소당 비용에서 나온다. */
  "worst-input": worstTable,
  /** `purpose.alt` — 칸 수를 늘려 가며 두 설계의 순서가 뒤집히는 자리를 찾는다. */
  "alt-crossover": crossoverTable,
  /** `deep.math` ④ — 제약 상한에서 닫힌 형태와 비교 정렬의 하한을 나란히. */
  "math-scale": mathScaleTable,
};
