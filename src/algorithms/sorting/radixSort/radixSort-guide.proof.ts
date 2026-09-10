/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/radixSort/radixSort-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  BASE,
  type Counts,
  LIMIT,
  mergeCounts,
  radixCounts,
  spread,
  WALK,
} from "./radixSort-guide.alt.ts";
import { radixSort } from "./radixSort-guide.ref.ts";

const REF = new URL("./radixSort-guide.ref.ts", import.meta.url).pathname;

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

/** `[513 45 258]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
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

/** 뒤에서 앞으로 놓는 그 한 줄 — 같은 자리 값의 순서를 지키던 줄이다. */
const PLACE_LINE = /^(\s*)for \(let i = src\.length - 1; i >= 0; i--\) \{$/;

type Sorter = { radixSort(A: number[]): number[] };

/** 배치를 앞에서 뒤로 바꾼 사본. 같은 자리 값끼리의 순서가 뒤집힌다. */
const forward = await loadMutant<Sorter>(REF, {
  swap: [PLACE_LINE, "$1for (let i = 0; i < src.length; i++) {"],
});

/* ─────────────── 계측한 사본들 — 손으로 적지 않고 실행해 센다 ─────────────── */

/** 문제의 제약 상한. `1 ≤ N ≤ 100,000`. */
const BIG = 100_000;
/** 값의 상한. `0 ≤ A[i] ≤ 10^9`. */
const MAX_VALUE = 1_000_000_000;

/** 최댓값이 늘 `10^9` 인 입력. 바퀴 수가 `B` 에만 달리게 만들어 스윕을 갈라 본다. */
function wide(n: number): number[] {
  const A = spread(n);
  A[0] = MAX_VALUE;
  return A;
}

/** 최댓값을 `base` 진법으로 적었을 때의 자릿수. `0` 이면 바퀴가 없다. */
function passCount(max: number, base: number): number {
  let d = 0;
  for (let place = 1; Math.floor(max / place) > 0; place *= base) d++;
  return d;
}

/**
 * 가장 단순한 방법 — **모든 쌍을 견주어 순서가 틀렸으면 맞바꾼다.** 값의 자리를 하나도
 * 쓰지 않으므로 견주기가 입력과 무관하게 `N(N−1)/2` 다.
 */
function naiveCounts(A: number[]): {
  access: number;
  compares: number;
  out: number[];
} {
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
 * 같은 절차를 **높은 자리부터** 되풀이한 것. `deep.build` ⑤ 가 먼저 시험해 반박하는 후보다.
 * 마지막에 처리한 자리가 가장 센 자리가 되므로, 낮은 자리로 끝나면 그 자리가 답을 정한다.
 */
function msdRepeat(A: number[], base: number = BASE): number[] {
  let src = [...A];
  let dst = new Array<number>(A.length).fill(0);
  let max = 0;
  for (const x of src) if (x > max) max = x;
  if (max === 0) return src;

  let top = 1;
  while (Math.floor(max / (top * base)) > 0) top *= base;

  for (let place = top; place >= 1; place = Math.floor(place / base)) {
    const count = new Array<number>(base).fill(0);
    for (const x of src) {
      const d = Math.floor(x / place) % base;
      count[d] = (count[d] as number) + 1;
    }
    for (let d = 1; d < base; d++) {
      count[d] = (count[d] as number) + (count[d - 1] as number);
    }
    for (let i = src.length - 1; i >= 0; i--) {
      const x = src[i] as number;
      const d = Math.floor(x / place) % base;
      count[d] = (count[d] as number) - 1;
      dst[count[d] as number] = x;
    }
    [src, dst] = [dst, src];
  }
  return src;
}

/** 값을 `base` 진법 자리 목록으로 편다. 왼쪽이 가장 높은 자리다. */
function digitsOf(x: number, base: number = BASE): number[] {
  if (x === 0) return [0];
  const out: number[] = [];
  for (let y = x; y > 0; y = Math.floor(y / base)) out.unshift(y % base);
  return out;
}

/**
 * 자리를 **왼쪽 끝에 맞춰** 견준 것 — 멈춤 1 이 반박하는 오해다. 자릿수가 다른 값을
 * 오른쪽 끝이 아니라 왼쪽 끝에 맞추면 사전식 순서가 나온다.
 */
function leftAligned(A: number[], base: number = BASE): number[] {
  return [...A].sort((a, b) => {
    const da = digitsOf(a, base);
    const db = digitsOf(b, base);
    for (let t = 0; t < Math.min(da.length, db.length); t++) {
      if (da[t] !== db[t]) return (da[t] as number) - (db[t] as number);
    }
    return da.length - db.length;
  });
}

/**
 * 누적합 없이 개수만 세어 이어 쓴 것 — 멈춤 2 가 반박하는 오해다. 자리 값 `d` 를
 * `count[d]` 번 이어 쓰면 나오는 것은 **원래 값이 아니라 자리 값**이다.
 */
function countOnlyPass(
  A: number[],
  place: number,
  base: number = BASE,
): number[] {
  const count = new Array<number>(base).fill(0);
  for (const x of A) {
    const d = Math.floor(x / place) % base;
    count[d] = (count[d] as number) + 1;
  }
  const out: number[] = [];
  for (let d = 0; d < base; d++) {
    for (let t = count[d] as number; t > 0; t--) out.push(d);
  }
  return out;
}

/** 정본과 같은 절차를 한 바퀴만 돌린 것 — 첫 바퀴의 결과를 그대로 본다. */
function onePass(A: number[], place: number, base: number = BASE): number[] {
  const src = [...A];
  const dst = new Array<number>(A.length).fill(0);
  const count = new Array<number>(base).fill(0);
  for (const x of src) {
    const d = Math.floor(x / place) % base;
    count[d] = (count[d] as number) + 1;
  }
  for (let d = 1; d < base; d++) {
    count[d] = (count[d] as number) + (count[d - 1] as number);
  }
  for (let i = src.length - 1; i >= 0; i--) {
    const x = src[i] as number;
    const d = Math.floor(x / place) % base;
    count[d] = (count[d] as number) - 1;
    dst[count[d] as number] = x;
  }
  return dst;
}

/* ───────── 실행이 판정하는 사실들 — 어긋나면 그 자리에서 던진다 ───────── */

/** 저장소 테스트가 쓰는 입출력 케이스 중 **난수가 없는** 여덟 벌. */
const REPO_CASES: number[][] = [
  [170, 45, 75, 90, 802, 24, 2, 66],
  [1, 10, 100, 1000],
  [5, 4, 3, 2, 1],
  [12, 12, 1, 1, 100, 100],
  [0, 10, 0, 1],
  [321, 213, 132, 123],
  [12345],
  [1_000_000_000, 0, 999_999_999, 1],
];

// ① 계측 사본이 `base = 256` 에서 정본과 같은 답을 내는가.
for (const A of [WALK, [], [0, 0, 0], ...REPO_CASES, spread(500)]) {
  if (JSON.stringify(radixCounts(A).out) !== JSON.stringify(radixSort(A))) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — ${show(A.slice(0, 8))}`,
    );
  }
}

/**
 * ② 접근 수의 닫힌 형태 `4N + d(7N + 4B − 3)` 이 실측과 같은가. 본문이 이 식으로 값을 낸다.
 */
const closed = (n: number, base: number, max: number): number =>
  4 * n + passCount(max, base) * (7 * n + 4 * base - 3);

for (const [A, base] of [
  [WALK, 8],
  [WALK, BASE],
  [wide(1), BASE],
  [wide(1_000), 1_024],
  [wide(BIG), BASE],
] as [number[], number][]) {
  const max = A.reduce((m, x) => (x > m ? x : m), 0);
  if (radixCounts(A, base).access !== closed(A.length, base, max)) {
    throw new Error(
      `접근 수가 4N + d(7N + 4B − 3) 과 다르다 — N=${A.length}, B=${base}`,
    );
  }
}

// ③ 모든 쌍 견주기의 견주기 횟수가 `N(N−1)/2` 인가. 큰 `N` 은 이 식으로 값을 낸다.
for (const A of [WALK, spread(200), [0, 0, 0]]) {
  const n = A.length;
  if (naiveCounts(A).compares !== (n * (n - 1)) / 2) {
    throw new Error(`모든 쌍 견주기의 횟수가 N(N−1)/2 와 다르다 — N=${n}`);
  }
  if (JSON.stringify(naiveCounts(A).out) !== JSON.stringify(radixSort(A))) {
    throw new Error(`가장 단순한 방법이 다른 답을 냈다 — ${show(A)}`);
  }
}

// ④ 전개가 쓰는 입력이 실제로 두 바퀴인가. 본문 전체가 그 수 위에 선다.
if (passCount(513, BASE) !== 2 || radixCounts(WALK).passes !== 2) {
  throw new Error("전개 입력의 바퀴 수가 둘이 아니다");
}

/* ───────── deep.build ② — 제약 상한에서의 계수 ───────── */

/**
 * `N = 100,000` 에서 모든 쌍 견주기를 실제로 실행하면 50 억 바퀴라 검사를 돌릴 수 없다.
 * 대신 위 ③ 이 확인한 닫힌 형태 `N(N−1)/2` 로 값을 낸다 — 작은 `N` 에서 실행과 같음을
 * 확인한 식이다.
 */
const allPairs = (n: number): number => (n * (n - 1)) / 2;

const SCALE: [string, number[]][] = [
  ["전개 입력 일곱 칸", WALK],
  ["100 칸", spread(100)],
  ["1,000 칸", spread(1_000)],
  ["100,000 칸", spread(BIG)],
];

function scaleTable(): string {
  return table(
    ["입력 칸 수", "모든 쌍 견주기", "이 절차의 견주기", "이 절차의 배열 접근"],
    SCALE.map(([name, A]) => [
      name,
      num(allPairs(A.length)),
      num(radixCounts(A).compares),
      num(radixCounts(A).access),
    ]),
    "└ 가운데 열이 0 이다. 이 절차에는 두 값을 견주는 자리가 없다",
  );
}

/* ───────── deep.build ④ — 키를 그대로 두는 쪽과 자리로 쪼개는 쪽 ───────── */

/**
 * 키를 그대로 두면 `count` 의 칸이 값의 상한만큼이라 `N = 1,000` 에서도 10 억 칸이다.
 * 그것을 실제로 잡을 수 없으므로 위 ② 가 확인한 닫힌 형태로 값을 낸다 — 칸을 잡을 수 있는
 * 크기에서 실행과 같음을 아래에서 한 번 더 확인한다.
 */
{
  const A = WALK;
  const k = 514; // 전개 입력의 최댓값 513 에 자리 하나를 더한 것
  if (radixCounts(A, k).access !== closed(A.length, k, 513)) {
    throw new Error("키를 그대로 둔 쪽의 닫힌 형태가 실측과 다르다");
  }
  if (radixCounts(A, k).passes !== 1) {
    throw new Error("키를 그대로 두면 바퀴가 하나여야 한다");
  }
}

const SPLIT: [string, number[]][] = [
  ["전개 입력 일곱 칸", WALK],
  ["1,000 칸", spread(1_000)],
  ["100,000 칸", spread(BIG)],
];

function splitTable(): string {
  return table(
    ["입력", "최댓값", "키 그대로 접근", "키 그대로 칸 수", "자리로 쪼갠 접근"],
    SPLIT.map(([name, A]) => {
      const max = A.reduce((m, x) => (x > m ? x : m), 0);
      const k = max + 1;
      return [
        name,
        num(max),
        num(closed(A.length, k, max)),
        num(k),
        num(radixCounts(A).access),
      ];
    }),
    "└ 오른쪽 열의 count 는 최댓값이 얼마든 256 칸이다",
  );
}

/* ───────── deep.build ⑤ — 높은 자리부터 되풀이하면 ───────── */

const MSD_CASES: number[][] = [
  WALK,
  [170, 45, 75, 90, 802, 24, 2, 66],
  [321, 213, 132, 123],
  [12, 12, 1, 1, 100, 100],
  [0, 10, 0, 1],
];

{
  const wrong = MSD_CASES.filter(
    (A) => JSON.stringify(msdRepeat(A)) !== JSON.stringify(radixSort(A)),
  );
  if (wrong.length === 0) {
    throw new Error(
      "높은 자리부터 되풀이한 후보가 어느 입력에서도 답을 바꾸지 못했다 — 「낮은 자리부터여야 한다」가 거짓이다",
    );
  }
}

function msdTable(): string {
  const wrong = MSD_CASES.filter(
    (A) => JSON.stringify(msdRepeat(A)) !== JSON.stringify(radixSort(A)),
  ).length;
  return tableLeft(
    ["입력", "낮은 자리부터", "높은 자리부터"],
    MSD_CASES.map((A) => [show(A), show(radixSort(A)), show(msdRepeat(A))]),
    `└ 다섯 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── deep.build ⑥ — 자리 하나의 가짓수를 바꿔 가며 ───────── */

const SWEEP_BASES = [2, 16, 64, 256, 1_024, 32_768];
const SWEEP_SIZES = [1, 1_000, BIG];

function sweepTable(): string {
  const cols = SWEEP_SIZES.map((n) => wide(n));
  const rows = SWEEP_BASES.map((b) => [
    num(b),
    num(passCount(MAX_VALUE, b)),
    ...cols.map((A) => num(radixCounts(A, b).access)),
  ]);
  // 열마다 어느 진법이 가장 적은지 실행으로 찾는다.
  const best = cols.map((A) => {
    let pick = SWEEP_BASES[0] as number;
    let low = Number.POSITIVE_INFINITY;
    for (const b of SWEEP_BASES) {
      const v = radixCounts(A, b).access;
      if (v < low) {
        low = v;
        pick = b;
      }
    }
    return pick;
  });
  return table(
    ["자리 하나의 가짓수 B", "바퀴 수 d", "N = 1", "N = 1,000", "N = 100,000"],
    rows,
    `└ 가장 적은 값이 N = 1 에서 B = ${num(best[0] as number)}, N = 1,000 에서 B = ${num(best[1] as number)}, N = 100,000 에서 B = ${num(best[2] as number)} 로 옮겨 간다`,
  );
}

/* ───────── 멈춤 1 — 자리를 왼쪽 끝에 맞추면 ───────── */

const ALIGN_CASES: number[][] = [
  WALK,
  [1, 10, 100, 1000],
  [170, 45, 75, 90, 802, 24, 2, 66],
  [0, 10, 0, 1],
];

{
  const wrong = ALIGN_CASES.filter(
    (A) => JSON.stringify(leftAligned(A)) !== JSON.stringify(radixSort(A)),
  );
  if (wrong.length === 0) {
    throw new Error("왼쪽 끝에 맞춘 후보가 어느 입력에서도 답을 바꾸지 못했다");
  }
}

function alignTable(): string {
  const wrong = ALIGN_CASES.filter(
    (A) => JSON.stringify(leftAligned(A)) !== JSON.stringify(radixSort(A)),
  ).length;
  return tableLeft(
    ["입력", "오른쪽 끝에 맞춤(이 절차)", "왼쪽 끝에 맞춤"],
    ALIGN_CASES.map((A) => [show(A), show(radixSort(A)), show(leftAligned(A))]),
    `└ 네 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/* ───────── 멈춤 2 — 누적합 없이 개수만 세면 ───────── */

const NO_PREFIX_CASES: [string, number[], number][] = [
  ["전개 입력 자리 0", WALK, 1],
  ["전개 입력 자리 1", WALK, 256],
  ["[12 12 1 1 100 100] 자리 0", [12, 12, 1, 1, 100, 100], 1],
];

{
  const same = NO_PREFIX_CASES.filter(
    ([, A, place]) =>
      JSON.stringify(countOnlyPass(A, place)) ===
      JSON.stringify(onePass(A, place)),
  );
  if (same.length === NO_PREFIX_CASES.length) {
    throw new Error("누적합을 뺀 후보가 어느 입력에서도 다른 답을 내지 못했다");
  }
}

function noPrefixTable(): string {
  return tableLeft(
    ["한 바퀴", "누적합을 쓴 쪽", "개수만 세어 이어 쓴 쪽"],
    NO_PREFIX_CASES.map(([name, A, place]) => [
      name,
      show(onePass(A, place)),
      show(countOnlyPass(A, place)),
    ]),
    "└ 오른쪽에 남은 것은 원래 값이 아니라 자리 값이다",
  );
}

/* ───────── 불변식 ③ — 앞에서 뒤로 놓으면 ───────── */

const FORWARD_CASES: number[][] = [
  WALK,
  [170, 45, 75, 90, 802, 24, 2, 66],
  [12, 12, 1, 1, 100, 100],
  [0, 10, 0, 1],
  [12345],
];

{
  const rows = FORWARD_CASES.map((A) => ({
    correct: radixSort(A),
    broken: forward.radixSort(A),
  }));
  if (
    rows.every((r) => JSON.stringify(r.correct) === JSON.stringify(r.broken))
  ) {
    throw new Error(
      "앞에서 뒤로 놓은 변이가 어느 입력에서도 답을 바꾸지 못했다",
    );
  }
}

function forwardTable(): string {
  const wrong = FORWARD_CASES.filter(
    (A) =>
      JSON.stringify(radixSort(A)) !== JSON.stringify(forward.radixSort(A)),
  ).length;
  return tableLeft(
    ["입력", "뒤에서 앞으로(바른 코드)", "앞에서 뒤로 놓은 코드"],
    FORWARD_CASES.map((A) => [
      show(A),
      show(radixSort(A)),
      show(forward.radixSort(A)),
    ]),
    `└ 다섯 벌 중 ${wrong} 벌에서 답이 어긋난다`,
  );
}

/** 정본과 같은 한 바퀴를 **앞에서 뒤로** 읽으며 놓은 것. 변이가 하는 일과 같다. */
function onePassForward(
  A: number[],
  place: number,
  base: number = BASE,
): number[] {
  const src = [...A];
  const dst = new Array<number>(A.length).fill(0);
  const count = new Array<number>(base).fill(0);
  for (const x of src) {
    const dig = Math.floor(x / place) % base;
    count[dig] = (count[dig] as number) + 1;
  }
  for (let dig = 1; dig < base; dig++) {
    count[dig] = (count[dig] as number) + (count[dig - 1] as number);
  }
  for (let i = 0; i < src.length; i++) {
    const x = src[i] as number;
    const dig = Math.floor(x / place) % base;
    count[dig] = (count[dig] as number) - 1;
    dst[count[dig] as number] = x;
  }
  return dst;
}

/** 자리 1 이 0 인 원소만 순서대로 남긴다. 안정성이 실제로 지키는 그 무리다. */
const zeroAtOne = (xs: number[]): string =>
  xs.filter((x) => Math.floor(x / BASE) % BASE === 0).join(" ");

{
  const a = zeroAtOne(radixSort(WALK));
  const b = zeroAtOne(forward.radixSort(WALK));
  if (a === b) {
    throw new Error(
      "앞에서 뒤로 놓은 변이가 자리 1 이 0 인 무리의 앞뒤를 안 바꿨다",
    );
  }
}

function groupTable(): string {
  return tableLeft(
    ["자리 1 이 0 인 넷의 앞뒤", "첫 바퀴 뒤", "마지막 바퀴 뒤"],
    [
      [
        "뒤에서 앞으로(바른 코드)",
        zeroAtOne(onePass(WALK, 1)),
        zeroAtOne(radixSort(WALK)),
      ],
      [
        "앞에서 뒤로 놓은 코드",
        zeroAtOne(onePassForward(WALK, 1)),
        zeroAtOne(forward.radixSort(WALK)),
      ],
    ],
    "└ 첫 바퀴가 낸 앞뒤는 같고, 마지막 바퀴가 그 넷을 뒤집었다",
  );
}

/* ───────── perf.worst — 최악을 만드는 입력 ───────── */

/** 같은 다중집합의 서로 다른 배치 전부. 일곱 칸이 다 다른 값이라 7! = 5,040 가지다. */
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

const ARRANGEMENTS = arrangements(WALK);
const SORTED_WALK = [...WALK].sort((a, b) => a - b);

{
  const accesses = ARRANGEMENTS.map((A) => radixCounts(A).access);
  if (Math.min(...accesses) !== Math.max(...accesses)) {
    throw new Error("같은 다중집합의 배치가 접근 횟수를 바꿨다");
  }
  for (const A of ARRANGEMENTS) {
    if (JSON.stringify(radixSort(A)) !== JSON.stringify(SORTED_WALK)) {
      throw new Error(`배치 하나가 다른 답을 냈다 — ${show(A)}`);
    }
  }
}

const WORST: [string, number[]][] = [
  ["최댓값 255 인 일곱 칸", [255, 45, 2, 66, 90, 30, 7]],
  ["전개 입력 일곱 칸 (최댓값 513)", WALK],
  ["최댓값 10^9 인 일곱 칸", [MAX_VALUE, 45, 2, 66, 90, 30, 7]],
  ["최댓값 10^9 인 한 칸", [MAX_VALUE]],
  ["최댓값 10^9 인 100,000 칸", wide(BIG)],
];

function worstTable(): string {
  return table(
    ["입력", "바퀴 수", "배열 접근", "원소당 접근"],
    WORST.map(([name, A]) => {
      const m = radixCounts(A);
      return [name, num(m.passes), num(m.access), num1(m.access / A.length)];
    }),
    `└ 전개 입력의 배치 ${num(ARRANGEMENTS.length)} 가지는 접근이 전부 ${num(radixCounts(WALK).access)} 번으로 같다`,
  );
}

/* ───────── purpose.alt — 우열이 뒤집히는 자리 ───────── */

/**
 * 병합 정렬의 계수는 `radixSort-guide.alt.ts` 에서 가져온다 — `purpose.alt` 의 표와 같은
 * 코드라야 두 자리의 값이 어긋나지 않는다.
 *
 * 칸 수를 하나씩 늘려 가며 **자릿수 정렬의 접근이 병합 정렬 이하가 되는 첫 `N`** 을 찾는다.
 * 「어느 조건에서 뒤집히는가」의 답이 그 `N` 이다.
 */
function crossoverN(): number {
  for (let n = 2; n <= 2_000; n++) {
    const A = spread(n);
    if (radixCounts(A).access <= mergeCounts(A).access) return n;
  }
  throw new Error("2,000 칸까지 뒤집히는 자리를 못 찾았다");
}

function crossoverTable(): string {
  const at = crossoverN();
  const rows = [200, at - 1, at, BIG].map((n) => {
    const A = spread(n);
    const r = radixCounts(A).access;
    const m = mergeCounts(A).access;
    return [
      `${num(n)} 칸`,
      num(r),
      num(m),
      r <= m ? "자릿수 정렬이 적다" : "병합 정렬이 적다",
    ];
  });
  return table(
    [
      "생성식으로 만든 입력",
      "자릿수 정렬 접근",
      "병합 정렬 접근",
      "어느 쪽이 적은가",
    ],
    rows,
    `└ ${num(at)} 칸에서 처음으로 순서가 뒤집힌다`,
  );
}

/* ───────── deep.math ④ — 바퀴 수를 자유롭게 두면 ───────── */

/** 바퀴를 `d` 번으로 정했을 때 한 자리가 담아야 하는 값의 최소 가짓수. `B^d > M` 인 최소 `B`. */
function minBase(d: number, max: number): number {
  let b = 2;
  while (true) {
    let covered = 1;
    let over = false;
    for (let t = 0; t < d; t++) {
      covered *= b;
      if (covered > max) {
        over = true;
        break;
      }
    }
    if (over) return b;
    b++;
  }
}

/** 닫힌 형태 `T(N, B, d) = 4N + d(7N + 4B − 3)`. `d` 는 밖에서 준다. */
const costOf = (n: number, base: number, d: number): number =>
  4 * n + d * (7 * n + 4 * base - 3);

// 닫힌 형태가 실측과 같은지 다시 확인한다. 위 ② 가 이미 본 것이지만 이 표가 그 식을 쓴다.
if (costOf(7, BASE, 2) !== radixCounts(WALK).access) {
  throw new Error("4N + d(7N + 4B − 3) 이 전개 입력의 실측과 다르다");
}
// `minBase` 가 실제로 그 바퀴 수를 내는지 확인한다.
for (const d of [2, 3, 4, 5]) {
  if (passCount(MAX_VALUE, minBase(d, MAX_VALUE)) !== d) {
    throw new Error(`minBase(${d}) 가 바퀴 ${d} 를 내지 않는다`);
  }
}

/** `d` 바퀴가 `d + 1` 바퀴보다 접근이 적어지는 첫 `N`. 없으면 `null`. */
function switchN(d: number): number | null {
  const a = minBase(d, MAX_VALUE);
  const b = minBase(d + 1, MAX_VALUE);
  for (let n = 1; n <= 10_000_000; n++) {
    if (costOf(n, a, d) <= costOf(n, b, d + 1)) return n;
  }
  return null;
}

function mathTable(): string {
  const rows = [2, 3, 4, 5].map((d) => {
    const b = minBase(d, MAX_VALUE);
    const at = switchN(d);
    return [
      num(d),
      num(b),
      num(costOf(BIG, b, d)),
      at === null ? "없다" : `${num(at)} 칸부터`,
    ];
  });
  const mine = radixCounts(wide(BIG)).access;
  const best = Math.min(
    ...[2, 3, 4, 5].map((d) => costOf(BIG, minBase(d, MAX_VALUE), d)),
  );
  return table(
    [
      "바퀴 수 d",
      "한 자리 최소 가짓수",
      "N = 100,000 에서의 T",
      "d + 1 바퀴보다 적어지는 첫 N",
    ],
    rows,
    `└ 이 편의 B = 256 은 같은 자리에서 ${num(mine)} 번이라 최솟값 ${num(best)} 번의 ${num1(mine / best)} 배다`,
  );
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 제약 상한까지 넓혀 본 모든 쌍 견주기와 이 절차의 계수. */
  "scale-100k": scaleTable,
  /** `deep.build` ④ — 키를 그대로 두는 쪽과 자리로 쪼개는 쪽의 접근·칸 수. */
  "wide-vs-split": splitTable,
  /** `deep.build` ⑤ — 높은 자리부터 되풀이하면 나오는 **실제 값**. */
  "msd-repeat": msdTable,
  /** `deep.build` ⑥ — 자리 하나의 가짓수를 여섯 가지로 두고 실제 접근을 센다. */
  "base-sweep": sweepTable,
  /** `deep.walk.pause` — 자리를 왼쪽 끝에 맞추면 사전식 순서가 된다. */
  "pause-left-align": alignTable,
  /** `deep.walk.pause` — 누적합 없이 개수만 세면 원래 값이 사라진다. */
  "pause-no-prefix": noPrefixTable,
  /** `invariant` ③ — 뒤에서 앞으로 놓던 그 줄을 바꿨을 때 나오는 **실제 값**. */
  "mutant-forward": forwardTable,
  /** `invariant` ③ — 그 변이가 무엇의 앞뒤를 뒤집었는가. */
  "mutant-forward-groups": groupTable,
  /** `perf.worst` — 배치는 비용을 못 바꾸고, 최악은 최댓값과 원소당 비용에서 나온다. */
  "worst-input": worstTable,
  /** `purpose.alt` — 칸 수를 늘려 가며 두 설계의 순서가 뒤집히는 자리를 찾는다. */
  "alt-crossover": crossoverTable,
  /** `deep.math` ④ — 바퀴 수를 자유롭게 두었을 때의 최소와 그 경계. */
  "math-scale": mathTable,
};

/** 쓰지 않는 값이 남지 않게 한 번 확인한다 — `LIMIT` 은 생성식의 나머지 연산에 쓰인다. */
if (LIMIT !== 1_000_000_001) throw new Error("생성식의 나머지가 바뀌었다");

export type { Counts };
