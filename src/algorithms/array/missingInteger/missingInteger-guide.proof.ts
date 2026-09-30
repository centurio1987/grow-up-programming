/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/missingInteger/missingInteger-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 비교 수나 걸음을 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만 낸다. 사본이
 * 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 이가 } from "../../../../tools/josa.ts";
import { BIG, runAll, type tableRun } from "./missingInteger-guide.alt.ts";
import { missingInteger } from "./missingInteger-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 두 자리. */
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 초 단위. 0.01 초보다 작으면 자릿수가 다 0 이 되므로 그렇게 적는다. */
const seconds = (x: number): string =>
  x < 0.01 ? "0.01 초 미만" : `${fixed2(x)} 초`;

/** `[4 -1 9 1 1 2]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const show = (xs: readonly unknown[]): string => `[${xs.join(" ")}]`;

const tf = (b: boolean): string => (b ? "참" : "거짓");

/** 마크다운 표. 수가 든 열은 오른쪽 정렬(`---:`)이다. */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  const rule = `| ${head.map((_, c) => (align[c] === "r" ? "---:" : "---")).join(" | ")} |`;
  return [line(head), rule, ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 배열. 음수 · n 보다 큰 값 · 중복이 하나씩 들어 있고 답은 3 이다. */
export const WALK: number[] = [4, -1, 9, 1, 1, 2];

/** 1 부터 n 까지 다 찬 배열. 찾기 루프가 끝까지 가는 갈래를 실행한다. */
export const FULL: number[] = [1, 2, 3];

/** 시험 파일의 입출력 케이스(벽시계 케이스 제외) — 변이 표가 쓴다. */
const TEST_CASES: number[][] = [
  [1, 3, 6, 4, 1, 2],
  [1, 2, 3],
  [-1, -3],
  [2, 3, 4],
  [1, 1, 1, 1],
  [1, 2, 2, 3, 3],
  [0, -1, 1, 2],
  [-1_000_000, 1_000_000],
  [1],
  [2],
  [-5],
];

/** 변이 표가 쓰는 작은 입력 열. 첫 줄이 전개 입력이다. */
const SMALL: number[][] = [WALK, ...TEST_CASES];

/**
 * 길이 1 ~ 4, 값 −1 ~ 6 인 배열 전부. 작은 입력을 빠짐없이 실행해 「언제나」 를 값으로 재는 데 쓴다.
 */
function allSmallArrays(): number[][] {
  const values = [-1, 0, 1, 2, 3, 4, 5, 6];
  const out: number[][] = [];
  const grow = (prefix: number[]): void => {
    if (prefix.length > 0) out.push(prefix);
    if (prefix.length === 4) return;
    for (const v of values) grow([...prefix, v]);
  };
  grow([]);
  return out;
}
const EXHAUSTIVE = allSmallArrays();

/** 정의 그대로의 답 — 양수 집합을 만들고 1 부터 올라간다. 정본과 맞대는 기준이다. */
function byDefinition(A: number[]): number {
  const S = new Set(A.filter((x) => x > 0));
  let x = 1;
  while (S.has(x)) x++;
  return x;
}

/* ────────────────────────── 계수를 세는 사본 ────────────────────────── */

/** 1 부터 차례로, 배열 전체를 읽어 그 수가 있는지 본다. 세는 것은 **비교 수**다. */
function naiveRun(A: number[]): { answer: number; compares: number } {
  let compares = 0;
  for (let x = 1; ; x++) {
    let found = false;
    for (const v of A) {
      compares++;
      if (v === x) {
        found = true;
        break;
      }
    }
    if (!found) return { answer: x, compares };
  }
}

/** 정렬한 뒤 앞에서부터 읽는다. 세는 것은 정렬의 비교 수와 읽기의 비교 수다. */
function sortRun(A: number[]): {
  answer: number;
  sortCompares: number;
  scanCompares: number;
  sorted: number[];
  scan: { v: number; want: number; act: string }[];
} {
  let sortCompares = 0;
  const sorted = [...A].sort((a, b) => {
    sortCompares++;
    return a - b;
  });
  let want = 1;
  let scanCompares = 0;
  const scan: { v: number; want: number; act: string }[] = [];
  for (const v of sorted) {
    scanCompares++;
    if (v === want) {
      scan.push({
        v,
        want,
        act: `찾던 수라 찾을 수를 ${want + 1}${으로(want + 1)} 올린다`,
      });
      want++;
      continue;
    }
    scanCompares++;
    if (v > want) {
      scan.push({
        v,
        want,
        act: `찾던 수를 건너뛰었으니 ${want}${이가(want)} 답이다`,
      });
      break;
    }
    scan.push({ v, want, act: "찾던 수보다 작아 건너뛴다" });
  }
  return { answer: want, sortCompares, scanCompares, sorted, scan };
}

/** 정본과 같은 절차의 비교 수 — 거르기의 비교(짧은 평가)와 찾기의 칸 읽기. */
function tableCompares(A: number[]): {
  answer: number;
  filter: number;
  find: number;
  marks: number;
} {
  const n = A.length;
  const seen = new Array<boolean>(n + 1).fill(false);
  let filter = 0;
  let marks = 0;
  for (const x of A) {
    filter++;
    if (x < 1) continue;
    filter++;
    if (x > n) continue;
    seen[x] = true;
    marks++;
  }
  let find = 0;
  for (let x = 1; x <= n; x++) {
    find++;
    if (!seen[x]) return { answer: x, filter, find, marks };
  }
  return { answer: n + 1, filter, find, marks };
}

/** 칸을 `m` 개(칸 1 … m) 둔 테이블. `m = n` 이 정본이다. */
function sizedRun(A: number[], m: number): number {
  const seen = new Array<boolean>(m + 1).fill(false);
  for (const x of A) if (x >= 1 && x <= m) seen[x] = true;
  for (let x = 1; x <= m; x++) if (!seen[x]) return x;
  return m + 1;
}

/** 표시를 마친 직후의 테이블(칸 0 … n). */
function marked(A: number[]): boolean[] {
  const n = A.length;
  const seen = new Array<boolean>(n + 1).fill(false);
  for (const x of A) if (x >= 1 && x <= n) seen[x] = true;
  return seen;
}

/* ────────────────────────── 걸음 ────────────────────────── */

interface Step {
  t: string;
  input: string;
  phase: "만들기" | "표시" | "찾기" | "끝";
  x: number | null;
  /** 이 걸음이 본 조건과 그 값. */
  cond: string;
  branch: string;
  /** 걸음이 끝난 뒤 칸 1 … n. */
  cells: boolean[];
}

/** 정본과 같은 절차를 걸음마다 기록한다. 번호는 `start` 부터 붙인다. */
function trace(A: number[], start: number): { steps: Step[]; answer: number } {
  const n = A.length;
  const input = show(A);
  const steps: Step[] = [];
  let t = start;
  const seen = new Array<boolean>(n + 1).fill(false);
  const snap = (): boolean[] => seen.slice(1);
  steps.push({
    t: `T${t++}`,
    input,
    phase: "만들기",
    x: null,
    cond: `칸 ${n + 1} 개를 거짓으로`,
    branch: "—",
    cells: snap(),
  });
  for (const x of A) {
    const lo = x >= 1;
    const hi = lo ? x <= n : null;
    if (lo && hi) seen[x] = true;
    steps.push({
      t: `T${t++}`,
      input,
      phase: "표시",
      x,
      cond: hi === null ? `x >= 1 거짓` : `x >= 1 참 · x <= ${n} ${tf(hi)}`,
      branch: lo && hi ? "①" : "건너뜀",
      cells: snap(),
    });
  }
  for (let x = 1; x <= n; x++) {
    const empty = !seen[x];
    steps.push({
      t: `T${t++}`,
      input,
      phase: "찾기",
      x,
      cond: `!seen[${x}] ${tf(empty)}`,
      branch: empty ? "②" : "다음 칸",
      cells: snap(),
    });
    if (empty) return { steps, answer: x };
  }
  steps.push({
    t: `T${t++}`,
    input,
    phase: "끝",
    x: null,
    cond: `x = ${n + 1} 에서 x <= ${n} 거짓`,
    branch: "③",
    cells: snap(),
  });
  return { steps, answer: n + 1 };
}

const RUN_WALK = trace(WALK, 1);
const RUN_FULL = trace(FULL, (RUN_WALK.steps.length as number) + 1);
const ALL_STEPS = [...RUN_WALK.steps, ...RUN_FULL.steps];

const cellsShow = (cells: boolean[]): string =>
  cells.map((c, i) => (c ? String(i + 1) : "·")).join(" ");

/* ────────────────────────── 자기대조 ────────────────────────── */

function 자기대조(): void {
  for (const A of [...SMALL, ...EXHAUSTIVE, BIG]) {
    const want = missingInteger([...A]);
    if (byDefinition(A) !== want)
      throw new Error(`정의와 정본이 다르다 ${show(A)}`);
    if (tableCompares(A).answer !== want)
      throw new Error(`세는 사본이 정본과 다르다 ${show(A)}`);
    if (sizedRun(A, A.length) !== want)
      throw new Error(`칸 n 개 사본이 정본과 다르다 ${show(A)}`);
    if (A.length <= 1000 && sortRun(A).answer !== want)
      throw new Error(`정렬 사본이 정본과 다르다 ${show(A)}`);
    if (A.length <= 1000 && naiveRun(A).answer !== want)
      throw new Error(`차례로 찾기 사본이 정본과 다르다 ${show(A)}`);
  }
  if (RUN_WALK.answer !== missingInteger([...WALK]))
    throw new Error("걸음 사본이 전개 입력에서 정본과 다르다");
  if (RUN_FULL.answer !== missingInteger([...FULL]))
    throw new Error("걸음 사본이 다 찬 입력에서 정본과 다르다");
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./missingInteger-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  missingInteger(A: number[]): number;
}

/** 1 보다 작은 값을 거르는 조건을 뺀 사본 — 음수와 0 도 「칸」에 쓴다. */
const noLower = await loadMutant<Impl>(REF, {
  swap: [/x >= 1 && x <= n/, "x <= n"],
});

/** **불변식을 지키던 줄** — 위쪽 경계에서 등호를 뺀 사본. 값 n 이 표시되지 않는다. */
const strictUpper = await loadMutant<Impl>(REF, {
  swap: [/x >= 1 && x <= n/, "x >= 1 && x < n"],
});

/** 루프가 끝난 뒤 돌려주는 줄을 지운 사본. */
const noTail = await loadMutant<Impl>(REF, {
  drop: /return n \+ 1;/,
});

const 중화됨 = strictUpper.missingInteger === missingInteger;

if (!중화됨) {
  // 답을 바꾼다고 적은 두 변이는 적어도 한 입력에서 답을 바꿔야 한다.
  for (const [name, impl] of [
    ["등호를 뺀 변이", strictUpper],
    ["마지막 줄을 지운 변이", noTail],
  ] as const) {
    const same = SMALL.every(
      (A) =>
        String(missingInteger([...A])) === String(impl.missingInteger([...A])),
    );
    if (same) throw new Error(`${name}가 어느 입력에서도 답을 바꾸지 못했다`);
  }
  // 거르기를 뺀 변이는 **어느 입력에서도 답을 안 바꾼다** — 그것이 멈춤의 주장이다.
  for (const A of [...SMALL, ...EXHAUSTIVE]) {
    if (missingInteger([...A]) !== noLower.missingInteger([...A])) {
      throw new Error(`거르기를 뺀 변이가 ${show(A)} 에서 답을 바꿨다`);
    }
  }
}

/** 변이 하나를 작은 입력 열에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  head: string,
  impl: Impl,
  passHead: string,
  passes: (A: number[]) => number,
): string {
  const rows = SMALL.map((A) => {
    const bare = missingInteger([...A]);
    const mutated = impl.missingInteger([...A]);
    const label = A === WALK ? `전개 입력 ${show(A)}` : show(A);
    return [
      label,
      num(passes(A)),
      String(bare),
      String(mutated),
      String(bare) === String(mutated) ? "같다" : "어긋난다",
    ];
  });
  return table(["입력", passHead, "정본", head, "판정"], rows, [
    "l",
    "r",
    "r",
    "r",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 배열의 값이 테이블의 어느 칸을 채우는가. */
  "concept-table": () => {
    const n = WALK.length;
    const seen = marked(WALK);
    const idx = WALK.map((_, i) => String(i));
    const target = WALK.map((x) => (x >= 1 && x <= n ? `칸 ${x}` : "칸 없음"));
    const cellIdx = Array.from({ length: n }, (_, i) => `칸 ${i + 1}`);
    const cellVal = Array.from({ length: n }, (_, i) =>
      tf(seen[i + 1] as boolean),
    );
    const first = cellVal.indexOf("거짓") + 1;
    return [
      `배열의 자리마다 값이 가리키는 칸은 이렇습니다.`,
      "",
      table(
        ["배열의 자리", ...idx],
        [
          ["값 A[i]", ...WALK.map(String)],
          ["표시할 칸", ...target],
        ],
        ["l", ...idx.map(() => "r" as const)],
      ),
      "",
      `표시를 마친 직접 주소 테이블은 이렇습니다.`,
      "",
      table(
        ["칸", ...cellIdx],
        [["seen", ...cellVal]],
        ["l", ...cellIdx.map(() => "r" as const)],
      ),
      "",
      `처음 거짓인 칸은 ${first} 이고, 정본의 답도 ${missingInteger([...WALK])} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 1 부터 차례로 배열 전체를 읽는 방법의 비교 수. */
  "cost-naive": () => {
    const rows = [6, 100, 1_000, 100_000].map((n) => {
      const formula = (n * (n + 1)) / 2 + n;
      const A = Array.from({ length: n }, (_, i) => n - i);
      const measured =
        n <= 1_000 ? num(naiveRun(A).compares) : "(실행하지 않음)";
      return [num(n), measured, num(formula), seconds(formula / 1e8)];
    });
    return table(
      ["n", "비교(실측)", "n(n+1)/2 + n", "초당 1억 번 기준"],
      rows,
      ["r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ③ — 정렬한 뒤 앞에서부터 읽는 방법을 전개 입력에 실행한다. */
  "origin-sort-scan": () => {
    const r = sortRun(WALK);
    const rows = r.scan.map((s, i) => [
      String(i),
      String(s.v),
      String(s.want),
      s.act,
    ]);
    return [
      `정렬한 배열은 ${show(r.sorted)} 입니다.`,
      "",
      table(["정렬한 자리", "읽은 값", "찾는 수", "한 일"], rows, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `답은 ${r.answer} 이고 정본의 답과 같습니다. 정렬에 비교 ${r.sortCompares} 번, 읽기에 비교 ${r.scanCompares} 번을 썼습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리한 비교 수. */
  "origin-two-ways": () => {
    const rows = [
      ["전개 입력", WALK],
      ["규모를 키운 입력", BIG],
    ].map(([label, A]) => {
      const arr = A as number[];
      const s = sortRun(arr);
      const t = tableCompares(arr);
      const useful = arr.filter((x) => x >= 1 && x <= arr.length).length;
      return [
        label as string,
        num(arr.length),
        num(useful),
        num(s.sortCompares + s.scanCompares),
        num(t.filter + t.find),
        num(s.answer),
      ];
    });
    return table(
      [
        "입력",
        "n",
        "1 이상 n 이하인 값",
        "정렬하고 읽기의 비교",
        "칸에 표시하고 찾기의 비교",
        "답",
      ],
      rows,
      ["l", "r", "r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ⑤ — 값의 범위만큼 칸을 두는 테이블과 칸을 n 개 두는 테이블. */
  "origin-range-table": () => {
    const n = WALK.length;
    const rangeAnswer = sizedRun(WALK, 1_000_000);
    const nAnswer = missingInteger([...WALK]);
    const rows = [
      [
        "값의 범위만큼(칸 1 … 최댓값)",
        num(1_000_000 + 1),
        num(1_000_000_000 + 1),
        String(rangeAnswer),
      ],
      [`n 개만큼(칸 1 … n)`, num(n + 1), num(n + 1), String(nAnswer)],
    ];
    return table(
      [
        "칸을 두는 법",
        "값이 ±10^6 일 때 칸 수",
        "값이 ±10^9 일 때 칸 수",
        "전개 입력의 답",
      ],
      rows,
      ["l", "r", "r", "r"],
    );
  },

  /** `deep.build.concept` (d) — 한 칸을 가리키는 자리가 여럿이거나 하나도 없는 경우. */
  "concept-many-to-one": () => {
    const n = WALK.length;
    const rows: string[][] = [];
    for (let x = 1; x <= n; x++) {
      const at = WALK.flatMap((v, i) => (v === x ? [String(i)] : []));
      rows.push([
        `칸 ${x}`,
        at.length === 0 ? "없음" : at.join(" · "),
        String(at.length),
        tf(at.length > 0),
      ]);
    }
    const outside = WALK.flatMap((v, i) =>
      v >= 1 && v <= n ? [] : [`${i}(값 ${v})`],
    );
    rows.push(["칸 없음", outside.join(" · "), String(outside.length), "—"]);
    return table(
      ["칸", "그 칸을 가리키는 배열의 자리", "자리 수", "seen"],
      rows,
      ["l", "l", "r", "l"],
    );
  },

  /** `deep.build.concept` (e) — 배열을 자리로 읽는 것과 테이블을 값으로 읽는 것. */
  "concept-index-vs-value": () => {
    const n = WALK.length;
    const seen = marked(WALK);
    const rows = Array.from({ length: n }, (_, i) => {
      const x = i + 1;
      return [
        String(x),
        String(WALK[x - 1]),
        tf(seen[x] as boolean),
        tf(WALK.includes(x)),
      ];
    });
    return table(
      ["수 x", "자리로 읽은 A[x−1]", "값으로 읽은 seen[x]", "A 에 x 가 있음"],
      rows,
      ["r", "r", "l", "l"],
    );
  },

  /** `deep.build` 1단계 — 답이 n + 1 을 넘지 않는다. 작은 배열을 빠짐없이 돌린다. */
  "build-bound": () => {
    const rows = [WALK, ...TEST_CASES.slice(0, 6)].map((A) => {
      const a = missingInteger([...A]);
      return [
        show(A),
        String(A.length),
        String(a),
        String(A.length + 1),
        a <= A.length + 1 ? "넘지 않는다" : "넘는다",
      ];
    });
    let over = 0;
    let equal = 0;
    for (const A of EXHAUSTIVE) {
      const a = missingInteger([...A]);
      if (a > A.length + 1) over++;
      if (a === A.length + 1) equal++;
    }
    return [
      table(["배열", "n", "답", "n + 1", "n + 1 과"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `길이가 1 부터 4 까지이고 값이 −1 부터 6 까지인 배열 ${num(EXHAUSTIVE.length)} 개를 모두 실행했습니다. 답이 n + 1 을 넘은 배열은 ${over} 개이고, 답이 정확히 n + 1 인 배열은 ${num(equal)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 전개 입력의 원소마다 무엇을 하는가. */
  "build-mark": () => {
    const n = WALK.length;
    const seen = new Array<boolean>(n + 1).fill(false);
    const rows = WALK.map((x, i) => {
      let act: string;
      if (x < 1) act = "1 보다 작아 칸이 없다";
      else if (x > n) act = `${n} 보다 커서 칸이 없다`;
      else if (seen[x]) act = `칸 ${x} 에 이미 표시가 있어 다시 쓴다`;
      else act = `칸 ${x} 에 표시한다`;
      if (x >= 1 && x <= n) seen[x] = true;
      return [String(i), String(x), act, cellsShow(seen.slice(1))];
    });
    return table(["자리", "값", "한 일", "표시된 칸(1 … 6)"], rows, [
      "r",
      "r",
      "l",
      "l",
    ]);
  },

  /** `deep.build` 3단계 — 1 부터 읽어 처음 비어 있는 칸. 입력 둘. */
  "build-find": () => {
    const out: string[] = [];
    for (const A of [WALK, FULL]) {
      const n = A.length;
      const seen = marked(A);
      const rows: string[][] = [];
      let answer = n + 1;
      for (let x = 1; x <= n; x++) {
        const s = seen[x] as boolean;
        rows.push([String(x), tf(s), s ? "다음 칸으로" : `답 ${x}`]);
        if (!s) {
          answer = x;
          break;
        }
      }
      if (answer === n + 1)
        rows.push([
          `${n + 1}`,
          "칸 없음",
          `칸 1 … ${n} 이 다 참이라 답 ${n + 1}`,
        ]);
      out.push(`${show(A)} 에서 읽으면 이렇습니다.`);
      out.push("");
      out.push(table(["칸 x", "seen[x]", "한 일"], rows, ["r", "l", "l"]));
      out.push("");
    }
    out.push(
      `두 답 ${missingInteger([...WALK])} 과 ${missingInteger([...FULL])} 는 정본의 답과 같습니다.`,
    );
    return out.join("\n");
  },

  /** `deep.build` 설계 선택 — 칸 수를 바꿔 가며 작은 배열 전부에 실행한다. */
  "build-size": () => {
    const inputs = [...TEST_CASES, ...EXHAUSTIVE];
    const choices: [string, (n: number) => number][] = [
      ["⌊n/2⌋", (n) => Math.floor(n / 2)],
      ["n − 1", (n) => n - 1],
      ["n", (n) => n],
      ["2n", (n) => 2 * n],
      ["1,000,000", () => 1_000_000],
    ];
    const rows = choices.map(([label, m]) => {
      let wrong = 0;
      for (const A of inputs) {
        if (sizedRun(A, m(A.length)) !== missingInteger([...A])) wrong++;
      }
      return [label, num(m(6) + 1), num(m(100_000) + 1), num(wrong)];
    });
    return [
      table(
        [
          "칸 1 … m 의 m",
          "n = 6 일 때 칸 수",
          "n = 100,000 일 때 칸 수",
          "틀린 입력",
        ],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `입력은 시험 파일의 케이스 ${TEST_CASES.length} 개와 길이 1 ~ 4 · 값 −1 ~ 6 인 배열 ${num(EXHAUSTIVE.length)} 개입니다. 칸 수에는 쓰지 않는 칸 0 을 넣었습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 테이블을 만든 직후. */
  "walk-init": () => {
    const s = RUN_WALK.steps[0] as Step;
    const n = WALK.length;
    const idx = Array.from({ length: n + 1 }, (_, i) => String(i));
    return [
      `${s.t} 걸음이 끝난 뒤의 seen 입니다.`,
      "",
      table(
        ["칸", ...idx],
        [["seen", ...idx.map(() => "거짓")]],
        ["l", ...idx.map(() => "r" as const)],
      ),
    ].join("\n");
  },

  /** `deep.walk` 2 — 표시 걸음. */
  "walk-mark": () => {
    const rows = RUN_WALK.steps
      .filter((s) => s.phase === "표시")
      .map((s) => [s.t, String(s.x), s.cond, s.branch, cellsShow(s.cells)]);
    return table(
      ["걸음", "읽은 값 x", "조건의 값", "갈래", "표시된 칸(1 … 6)"],
      rows,
      ["l", "r", "l", "l", "l"],
    );
  },

  /** `deep.walk.pause` — 1 보다 작은 값을 거르지 않아도 답은 같다. */
  "pause-no-lower": () =>
    mutantTable(
      "거르기를 뺀 판",
      noLower,
      "1 보다 작은 값",
      (A) => A.filter((x) => x < 1).length,
    ),

  /** `deep.walk.pause` — 그 대신 테이블에 무엇이 붙는가. */
  "pause-no-lower-keys": () => {
    const A = [0, -1, 1, 2];
    const n = A.length;
    const plain = new Array<boolean>(n + 1).fill(false);
    const typed = new Uint8Array(n + 1);
    for (const x of A) {
      if (x <= n) {
        plain[x] = true;
        typed[x] = 1;
      }
    }
    const extra = Object.keys(plain).filter((k) => !/^\d+$/.test(k));
    const typedKeys = Object.keys(typed).filter((k) => !/^\d+$/.test(k));
    const same =
      plain.slice(1).every((v, i) => v === marked(A)[i + 1]) &&
      Array.from(typed.slice(1)).every(
        (v, i) => (v === 1) === marked(A)[i + 1],
      );
    if (!same) throw new Error("거르기를 뺀 사본의 칸 1 … n 이 정본과 다르다");
    return [
      table(
        ["테이블", "length", "칸 번호가 아닌 이름", "칸 0 에 쓴 값"],
        [
          [
            "Array<boolean>",
            String(plain.length),
            extra.length === 0 ? "없음" : extra.join(" · "),
            String(plain[0]),
          ],
          [
            "Uint8Array",
            String(typed.length),
            typedKeys.length === 0 ? "없음" : typedKeys.join(" · "),
            String(typed[0]),
          ],
        ],
        ["l", "r", "l", "l"],
      ),
      "",
      `거르기를 뺀 조건으로 배열 ${show(A)} 의 값을 표시한 결과입니다. 두 테이블 모두 칸 1 … ${n}${은는(n)} 정본과 같습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 찾기 걸음(전개 입력). */
  "walk-find": () => {
    const rows = RUN_WALK.steps
      .filter((s) => s.phase === "찾기")
      .map((s) => [s.t, String(s.x), s.cond, s.branch]);
    return [
      table(["걸음", "칸 x", "조건의 값", "갈래"], rows, ["l", "r", "l", "l"]),
      "",
      `반환값은 ${RUN_WALK.answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 루프 뒤의 줄을 지우면. */
  "pause-no-tail": () =>
    mutantTable("마지막 줄을 지운 판", noTail, "루프를 끝까지 간 횟수", (A) =>
      missingInteger([...A]) === A.length + 1 ? 1 : 0,
    ),

  /** `deep.walk` 4 — 다 찬 입력의 걸음. */
  "walk-full": () => {
    const rows = RUN_FULL.steps.map((s) => [
      s.t,
      s.phase,
      s.x === null ? "—" : String(s.x),
      s.cond,
      s.branch,
      cellsShow(s.cells),
    ]);
    return [
      table(
        ["걸음", "하는 일", "x", "조건의 값", "갈래", "표시된 칸(1 … 3)"],
        rows,
        ["l", "l", "r", "l", "l", "l"],
      ),
      "",
      `반환값은 ${RUN_FULL.answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 5 — 두 입력의 걸음 전부와 갈래별 횟수. */
  "walk-all": () => {
    const rows = ALL_STEPS.map((s) => [
      s.t,
      s.input,
      s.phase,
      s.x === null ? "—" : String(s.x),
      s.branch,
    ]);
    const by = (b: string): string[] =>
      ALL_STEPS.filter((s) => s.branch === b).map((s) => s.t);
    const tally = ["①", "②", "③"].map((b) => [
      b,
      by(b).join(" "),
      `${by(b).length} 번`,
    ]);
    return [
      table(["걸음", "입력", "하는 일", "x", "갈래"], rows, [
        "l",
        "l",
        "l",
        "r",
        "l",
      ]),
      "",
      `갈래마다 실행된 걸음을 모으면 이렇습니다.`,
      "",
      table(["갈래", "걸음", "횟수"], tally, ["l", "l", "r"]),
    ].join("\n");
  },

  /** `related` — 비둘기집 원리를 전개 입력에 그린다. */
  "related-pigeonhole": () => {
    const n = WALK.length;
    const seen = marked(WALK);
    const boxes = Array.from({ length: n + 1 }, (_, i) => `상자 ${i + 1}`);
    const into = boxes.map((_, i) => {
      const x = i + 1;
      const k = WALK.filter((v) => v === x).length;
      return k === 0 ? "빈다" : `${k} 개`;
    });
    const empty = into.filter((c) => c === "빈다").length;
    const filled = seen.slice(1).filter(Boolean).length;
    return [
      table(
        ["후보", ...boxes],
        [["들어간 값", ...into]],
        ["l", ...boxes.map(() => "r" as const)],
      ),
      "",
      `값 ${n} 개를 상자 ${n + 1} 개에 넣었습니다. 값이 든 상자는 ${filled} 개이고 빈 상자는 ${empty} 개입니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 세 설계를 같은 입력에 걸었다. 수는 `.alt.ts` 에서 온다. */
  "alt-compare": () => {
    const small = runAll(WALK);
    const big = runAll(BIG);
    const rows = Object.keys(small).map((name) => {
      const s = small[name] as ReturnType<typeof tableRun>;
      const b = big[name] as ReturnType<typeof tableRun>;
      return [
        name,
        num(s.accesses),
        num(s.cells),
        num(b.accesses),
        num(b.cells),
        b.intact ? "그대로다" : "바뀐다",
      ];
    });
    return table(
      [
        "설계",
        "n = 6 칸 접근",
        "n = 6 추가 칸",
        "n = 100,000 칸 접근",
        "n = 100,000 추가 칸",
        "실행 뒤 입력",
      ],
      rows,
      ["l", "r", "r", "r", "r", "l"],
    );
  },

  /** `invariant` ② — 표시를 마친 시점에 칸마다 「x 가 A 에 있다」와 같은가. */
  "invariant-state": () => {
    const n = WALK.length;
    const seen = marked(WALK);
    const rows = Array.from({ length: n }, (_, i) => {
      const x = i + 1;
      const inA = WALK.includes(x);
      return [
        `칸 ${x}`,
        tf(seen[x] as boolean),
        tf(inA),
        seen[x] === inA ? "같다" : "어긋난다",
      ];
    });
    let cells = 0;
    let wrong = 0;
    for (const A of EXHAUSTIVE) {
      const s = marked(A);
      for (let x = 1; x <= A.length; x++) {
        cells++;
        if (s[x] !== A.includes(x)) wrong++;
      }
    }
    return [
      table(["칸", "seen[x]", "A 에 x 가 있음", "판정"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `길이 1 ~ 4 · 값 −1 ~ 6 인 배열 ${num(EXHAUSTIVE.length)} 개에서도 대조했습니다. 칸은 모두 ${num(cells)} 개예요. 어긋난 칸은 ${wrong} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const edges: [string, number[]][] = [
      ["원소 하나 · 1", [1]],
      ["원소 하나 · 1 이 아님", [2]],
      ["원소 하나 · 음수", [-5]],
      ["양수가 없음", [-1, -3]],
      ["값이 전부 같음", [1, 1, 1, 1]],
      ["값 범위의 양 끝", [-1_000_000, 1_000_000]],
      ["0 이 섞임", [0, -1, 1, 2]],
      ["1 … n 이 다 있음", [3, 1, 2]],
    ];
    const rows = edges.map(([label, A]) => {
      const a = missingInteger([...A]);
      return [
        label,
        show(A),
        String(a),
        a === byDefinition(A) ? "같다" : "어긋난다",
      ];
    });
    return table(["경계", "배열", "답", "정의로 구한 값과"], rows, [
      "l",
      "l",
      "r",
      "l",
    ]);
  },

  /** `invariant` ③ — 불변식을 지키던 줄에서 등호를 빼면. */
  "mutant-strict-upper": () =>
    mutantTable(
      "등호를 뺀 판",
      strictUpper,
      "n 과 같은 값",
      (A) => A.filter((x) => x === A.length).length,
    ),

  /** `perf.derive` — 규모별 계수. 입력은 칸 찾기가 가장 길어지는 1 … n 의 순열이다. */
  "perf-scale": () => {
    const rows = [6, 1_000, 100_000].map((n) => {
      const A = Array.from({ length: n }, (_, i) => n - i);
      const t = tableCompares(A);
      const naive = n <= 1_000 ? num(naiveRun(A).compares) : "(실행하지 않음)";
      return [
        num(n),
        num(t.filter),
        num(t.find),
        num(t.filter + t.find),
        num(2 * n + n),
        naive,
      ];
    });
    return table(
      [
        "n",
        "거르기의 비교",
        "찾기의 칸 읽기",
        "합",
        "3n",
        "차례로 찾기의 비교",
      ],
      rows,
      ["r", "r", "r", "r", "r", "r"],
    );
  },

  /** `perf.worst` — 모양을 바꿔 가며 센다. */
  "worst-shape": () => {
    const n = 1_000;
    const shapes: [string, number[]][] = [
      ["전부 음수", Array.from({ length: n }, (_, i) => -(i + 1))],
      ["전부 n 보다 큼", Array.from({ length: n }, (_, i) => n + i + 1)],
      ["1 만 n 번", Array.from({ length: n }, () => 1)],
      ["2 … n+1", Array.from({ length: n }, (_, i) => i + 2)],
      ["오름차순 1 … n", Array.from({ length: n }, (_, i) => i + 1)],
      ["내림차순 n … 1", Array.from({ length: n }, (_, i) => n - i)],
      [
        "섞인 순열 (7i mod n) + 1",
        Array.from({ length: n }, (_, i) => ((7 * i) % n) + 1),
      ],
    ];
    const rows = shapes.map(([label, A]) => {
      const t = tableCompares(A);
      return [
        label,
        num(missingInteger([...A])),
        num(t.filter),
        num(t.find),
        num(t.filter + t.find),
      ];
    });
    return [
      `n = ${num(n)} 에서 배열의 모양만 바꿔 세었습니다.`,
      "",
      table(
        ["배열의 모양", "답", "거르기의 비교", "찾기의 칸 읽기", "합"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
    ].join("\n");
  },
};
