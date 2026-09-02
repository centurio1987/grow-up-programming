/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts \
 *     src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { searchInRotatedSortedArray } from "./searchInRotatedSortedArray-guide.ref.ts";

const REF = new URL(
  "./searchInRotatedSortedArray-guide.ref.ts",
  import.meta.url,
).pathname;

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

/** `[4 5 6 7 0 1 2]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
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

/* ─────────────────────── 공통 입력 ─────────────────────── */

/** 「아이디어 상세」가 쓰는 작은 입력. 문제 문서의 예시와 같다. */
const SMALL = [4, 5, 6, 7, 0, 1, 2];

/** 「수행으로 알아보는 알고리즘」이 끝까지 쓰는 입력. `S = 0 1 … 20` 을 열일곱째에서 끊었다. */
const WALK = (() => {
  const S = Array.from({ length: 21 }, (_, i) => i);
  return [...S.slice(17), ...S.slice(0, 17)];
})();

/** 길이 `n` 짜리 오름차순 배열을 `k` 째 칸에서 끊어 이어 붙인 것. 값 사이에 빈틈을 둔다. */
function rotate(n: number, k: number): number[] {
  const S = Array.from({ length: n }, (_, i) => i * 2);
  return [...S.slice(k), ...S.slice(0, k)];
}

/** 배열 안팎의 값을 전부 넣어 본다. 없는 값과 사이값이 함께 든다. */
function everyTarget(n: number): number[] {
  return Array.from({ length: 2 * n + 2 }, (_, i) => i - 1);
}

/* ───────── ① 평범한 이분 탐색을 회전된 배열에 적용하면 ───────── */

/** 정렬 조건만 믿고 `A[mid]` 와 `target` 만 견주는 절차. `binarySearch` 편이 가르친 것이다. */
function plain(A: number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (A[mid] === target) return mid;
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  return -1;
}

function plainTable(): string {
  const rows = SMALL.map((t) => ({
    t,
    got: plain(SMALL, t),
    want: SMALL.indexOf(t),
  }));
  const wrong = rows.filter((r) => r.got !== r.want).length;
  return table(
    ["target", "평범한 이분 탐색", "실제 인덱스"],
    rows.map((r) => [String(r.t), String(r.got), String(r.want)]),
    `└ 일곱 값 중 ${wrong} 개가 어긋난다`,
  );
}

/* ───────── ② 한 칸을 읽는가, 두 칸을 읽는가 ───────── */

/** 읽은 칸을 세는 평범한 판. */
function plainReads(A: number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  let reads = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    reads++;
    if (A[mid] === target) return reads;
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  return reads;
}

/**
 * 읽은 칸을 세는 정본. **정본 소스에서 기계로 만든다** — `mid` 를 정하는 그 한 줄에만 맞아야
 * 하고, 아니면 `loadMutant` 가 던진다. 계수를 손으로 세면 「이 코드가 그만큼 읽는다」가
 * 검사되지 않는다.
 */
const traced = await loadMutant<{
  searchInRotatedSortedArray(A: number[], target: number): number;
}>(REF, {
  swap: [
    /^(\s*)const mid = lo \+ Math\.floor\(\(hi - lo\) \/ 2\);$/,
    "$1const mid = lo + Math.floor((hi - lo) / 2);\n$1(globalThis as any).__reads += ((A[mid] as number) === target) ? 1 : (2 + (((A[lo] as number) <= (A[mid] as number)) ? 0 : 1));",
  ],
});

/** 그 한 번의 호출이 읽은 배열 칸 수. */
function refReads(A: number[], target: number): number {
  const g = globalThis as unknown as { __reads: number };
  g.__reads = 0;
  const got = traced.searchInRotatedSortedArray([...A], target);
  const want = searchInRotatedSortedArray([...A], target);
  if (got !== want) {
    throw new Error(
      `계측한 사본이 정본과 다른 답을 냈다 — ${show(A)} target ${target}: ${got} ≠ ${want}`,
    );
  }
  return g.__reads;
}

function readsTable(): string {
  const rows = SMALL.map((t) => [
    String(t),
    String(plainReads(SMALL, t)),
    String(plain(SMALL, t)),
    String(refReads(SMALL, t)),
    String(searchInRotatedSortedArray([...SMALL], t)),
  ]);
  const sumPlain = SMALL.reduce((a, t) => a + plainReads(SMALL, t), 0);
  const sumRef = SMALL.reduce((a, t) => a + refReads(SMALL, t), 0);
  const wrong = SMALL.filter(
    (t) => plain(SMALL, t) !== SMALL.indexOf(t),
  ).length;
  rows.push(["합", String(sumPlain), "—", String(sumRef), "—"]);
  return table(
    ["target", "한 칸 읽기 칸 수", "그 답", "두 칸 읽기 칸 수", "그 답"],
    rows,
    `└ 칸은 ${sumPlain} 에서 ${sumRef} 로 늘고, 어긋난 답 ${wrong} 개가 0 이 된다`,
  );
}

/* ───────── ③ 어느 칸과 견주어 정렬된 쪽을 정하는가 ───────── */

type Anchor = {
  name: string;
  /** 왼쪽 조각 `[lo, mid]` 에 끊긴 자리가 없다고 볼 것인가. */
  leftSorted: (A: number[], lo: number, mid: number, hi: number) => boolean;
  /** 그 판정에 후보 구간 밖의 칸을 읽는가. */
  outside: (A: number[], lo: number, hi: number) => boolean;
};

const ANCHORS: Anchor[] = [
  {
    name: "A[0] 과 견준다",
    leftSorted: (A, _lo, mid) => (A[0] as number) <= (A[mid] as number),
    outside: (_A, lo) => lo > 0,
  },
  {
    name: "A[lo] 와 견준다",
    leftSorted: (A, lo, mid) => (A[lo] as number) <= (A[mid] as number),
    outside: () => false,
  },
  {
    name: "A[hi] 와 견준다",
    leftSorted: (A, _lo, mid, hi) => (A[mid] as number) > (A[hi] as number),
    outside: () => false,
  },
  {
    name: "A[N-1] 과 견준다",
    leftSorted: (A, _lo, mid) =>
      (A[mid] as number) > (A[A.length - 1] as number),
    outside: (A, _lo, hi) => hi < A.length - 1,
  },
];

function searchWith(
  A: number[],
  target: number,
  anchor: Anchor,
  meter: { outside: number },
): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const vMid = A[mid] as number;
    if (vMid === target) return mid;
    if (anchor.outside(A, lo, hi)) meter.outside++;
    if (anchor.leftSorted(A, lo, mid, hi)) {
      if ((A[lo] as number) <= target && target < vMid) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (vMid < target && target <= (A[hi] as number)) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

/** 길이 1~9 의 모든 회전 × 모든 target. 이 범위에서는 전수로 확인할 수 있다. */
function sweep(run: (A: number[], target: number) => boolean): {
  ok: number;
  total: number;
} {
  let ok = 0;
  let total = 0;
  for (let n = 1; n <= 9; n++) {
    for (let k = 0; k < n; k++) {
      const A = rotate(n, k);
      for (const t of everyTarget(n)) {
        total++;
        if (run(A, t)) ok++;
      }
    }
  }
  return { ok, total };
}

function anchorTable(): string {
  const rows = ANCHORS.map((anchor) => {
    const meter = { outside: 0 };
    const { ok, total } = sweep(
      (A, t) => searchWith(A, t, anchor, meter) === A.indexOf(t),
    );
    return [anchor.name, `${ok} / ${total}`, String(meter.outside)];
  });
  return table(
    ["정렬된 쪽을 정하는 기준", "답이 맞은 횟수", "후보 구간 밖을 읽은 횟수"],
    rows,
    "└ 네 기준 다 답은 맞는다. 갈리는 것은 이 열이다",
  );
}

/* ───────── ④ 정렬된 조각의 아래 끝만 보면 ───────── */

/** 값 범위의 위 끝을 빼고 `A[lo] <= target` 하나로 갈래를 정하는 판. */
function oneSided(A: number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const vMid = A[mid] as number;
    if (vMid === target) return mid;
    const vLo = A[lo] as number;
    if (vLo <= vMid) {
      if (vLo <= target) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (target <= (A[hi] as number)) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

function oneSidedTable(): string {
  const rows = SMALL.map((t) => [
    String(t),
    String(oneSided(SMALL, t)),
    String(searchInRotatedSortedArray([...SMALL], t)),
  ]);
  const { ok, total } = sweep((A, t) => oneSided(A, t) === A.indexOf(t));
  return table(
    ["target", "아래 끝만 보는 판", "양 끝을 다 보는 판"],
    rows,
    `└ 길이 1~9 를 전수로 재면 ${total} 중 ${total - ok} 개가 어긋난다`,
  );
}

/* ───────── ⑤ 갈래 다섯을 한 번에 실행하는 가장 작은 배열 ───────── */

/** 한 번의 호출이 실행한 갈래 번호를 차례로 모은다. */
function branchTrace(A: number[], target: number): string[] {
  const out: string[] = [];
  let lo = 0;
  let hi = A.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const vMid = A[mid] as number;
    if (vMid === target) {
      out.push("1");
      return out;
    }
    const vLo = A[lo] as number;
    if (vLo <= vMid) {
      if (vLo <= target && target < vMid) {
        out.push("2");
        hi = mid - 1;
      } else {
        out.push("3");
        lo = mid + 1;
      }
    } else {
      if (vMid < target && target <= (A[hi] as number)) {
        out.push("4");
        lo = mid + 1;
      } else {
        out.push("5");
        hi = mid - 1;
      }
    }
  }
  return out;
}

/** 표에 실을 길이. 나머지 길이도 아래에서 함께 재고, 처음 다섯이 되는 자리만 붙임말로 낸다. */
const SHOWN_LENGTHS = new Set([3, 7, 12, 20, 21, 22]);

function coverageTable(): string {
  const rows: string[][] = [];
  let firstFive = 0;
  for (let n = 1; n <= 24; n++) {
    let best = 0;
    for (let k = 0; k < n; k++) {
      const A = rotate(n, k);
      for (const t of everyTarget(n)) {
        best = Math.max(best, new Set(branchTrace(A, t)).size);
      }
    }
    if (best === 5 && firstFive === 0) firstFive = n;
    if (SHOWN_LENGTHS.has(n)) rows.push([`${n} 칸`, String(best)]);
  }
  return table(
    ["배열 길이", "한 번의 호출이 실행한 갈래 수의 최댓값"],
    rows,
    `└ ${firstFive} 칸에서 처음으로 다섯이 된다`,
  );
}

/* ───────── ⑥ 원소가 중복되면 ───────── */

const DUPES: [number[], number][] = [
  [[1, 0, 1, 1, 1], 0],
  [[0, 1, 0, 0, 0], 1],
  [[1, 0, 1, 1, 1, 1], 0],
];

function duplicateTable(): string {
  const rows = DUPES.map(([A, t]) => ({
    A,
    t,
    got: searchInRotatedSortedArray([...A], t),
    want: A.indexOf(t),
  }));
  const wrong = rows.filter((r) => r.got !== r.want).length;
  return table(
    ["배열", "target", "이 코드의 답", "그 값이 있는 자리"],
    rows.map((r) => [show(r.A), String(r.t), String(r.got), String(r.want)]),
    wrong === rows.length
      ? "└ 세 벌 다 그 값이 배열에 있는데 -1 이 나온다"
      : `└ 세 벌 중 ${wrong} 벌에서 -1 이 나온다`,
  );
}

/* ───────── ⑦ 판정의 등호를 빼면 ───────── */

/**
 * `vLo <= vMid` 를 `vLo < vMid` 로 바꾼 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const strict = await loadMutant<{
  searchInRotatedSortedArray(A: number[], target: number): number;
}>(REF, { swap: [/^(\s*)if \(vLo <= vMid\) \{$/, "$1if (vLo < vMid) {"] });

const STRICT_CASES: [number[], number][] = [
  [[3, 1], 1],
  [[2, 4, 6, 0], 0],
  [[8, 0, 2, 4, 6], 0],
];

const strictRows = STRICT_CASES.map(([A, t]) => ({
  A,
  t,
  correct: searchInRotatedSortedArray([...A], t),
  broken: strict.searchInRotatedSortedArray([...A], t),
}));

// 하나도 안 어긋나면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (strictRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
  );
}

function strictTable(): string {
  const { ok, total } = sweep(
    (A, t) => strict.searchInRotatedSortedArray([...A], t) === A.indexOf(t),
  );
  return table(
    ["배열", "target", "바른 코드", "vLo < vMid 로 적은 코드"],
    strictRows.map((r) => [
      show(r.A),
      String(r.t),
      String(r.correct),
      String(r.broken),
    ]),
    `└ 길이 1~9 를 전수로 재면 ${total} 중 ${total - ok} 개가 어긋난다`,
  );
}

/* ───────── ⑧ 배열 칸 접근이 가장 많은 입력 ───────── */

function worstTable(): string {
  const N = WALK.length;
  const S = Array.from({ length: N }, (_, i) => i);
  const targets = Array.from({ length: N + 2 }, (_, i) => i - 1);
  const counts = new Map<number, number>();
  let worst = 0;
  const worstAt: string[] = [];
  let noRotation = 0;
  for (let k = 0; k < N; k++) {
    const A = [...S.slice(k), ...S.slice(0, k)];
    for (const t of targets) {
      const c = refReads(A, t);
      counts.set(c, (counts.get(c) ?? 0) + 1);
      if (k === 0) noRotation = Math.max(noRotation, c);
      if (c > worst) {
        worst = c;
        worstAt.length = 0;
      }
      if (c === worst && worstAt.length < 3) {
        worstAt.push(`${k} 칸 회전 · target ${t}`);
      }
    }
  }
  const rows = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([c, n]) => [`${c} 칸`, String(n)]);
  return [
    table(
      ["읽은 배열 칸 수", "그 값이 나온 (회전, target) 짝의 수"],
      rows,
      `└ 가장 많은 것이 ${worst} 칸이다`,
    ),
    "",
    `${worst} 칸을 읽는 짝   ${worstAt.join(" · ")}`,
    `회전이 없을 때 최대   ${noRotation} 칸`,
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ③ — 정렬 조건만 믿은 절차가 회전된 배열에서 무엇을 내는가. */
  "plain-binary-search": plainTable,
  /** `deep.build` ④ — 한 칸을 읽는 판과 두 칸을 읽는 판의 계수와 답. */
  "two-reads": readsTable,
  /** `deep.build` ⑥ — 견주는 상대 넷을 전수로 재면 무엇이 갈리는가. */
  "anchor-choice": anchorTable,
  /** `deep.build` ⑤ — 값 범위의 위 끝을 빼면 무엇이 어긋나는가. */
  "one-sided-range": oneSidedTable,
  /** `deep.walk` 도입부 — 갈래 다섯을 한 번에 실행하는 가장 작은 배열 길이. */
  "five-branch-min": coverageTable,
  /** `deep.walk.pause` — 원소가 서로 다르다는 제약이 빠지면 무엇이 어긋나는가. */
  "duplicate-break": duplicateTable,
  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 옛 이해 시험 `V5` 가 묻던 자리이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만
   * 달라도 잡는다.
   */
  "mutant-strict": strictTable,
  /** `perf.worst` — 어떤 (회전, target) 짝이 배열 칸 접근을 가장 많이 하는가. */
  "worst-reads": worstTable,
};
