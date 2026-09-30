/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 칸 하나를 정한 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/subsetSum/subsetSum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  A,
  B,
  E19,
  E20,
  fillTable,
  gen,
  type Input,
  meetInTheMiddle,
} from "./subsetSum-guide.alt.ts";
import {
  A_MAX,
  big,
  cellsAtMax,
  comma,
  N_MAX,
  NUMS,
  ONE_ROW_TARGET,
  oneRowAscending,
  segments,
  setText,
  subsetsAtMax,
  sumsetRows,
  T_MAX,
  TARGET,
  trace,
  trueCols,
  walkSteps,
  yn,
} from "./subsetSum-guide.fig.tsx";
import { subsetSum } from "./subsetSum-guide.ref.ts";

const REF = new URL("./subsetSum-guide.ref.ts", import.meta.url).pathname;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 열 폭을 내용에서 잰 뒤 글자 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0 ? pad(c, w[0] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

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

/** 표 아래에 실행이 낸 문장을 붙인다 — 본문은 이 블록을 `<!--/proof-->` 로 닫는다. */
const withNote = (tbl: string, note: string): string =>
  [tbl, "", note].join("\n");

/** `[3, 34, 4, 12, 5, 2] / 9` 꼴. */
const label = (nums: readonly number[], target: number): string =>
  `[${nums.join(", ")}] / ${target}`;

const list = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

const repeat = (v: number, n: number): number[] => new Array(n).fill(v);

/** 전개 입력의 기록 — 여러 블록이 같은 실행을 본다. */
const T = trace(NUMS, TARGET);
const dpv = (i: number, t: number): boolean =>
  (T.rows[i] as readonly boolean[])[t] as boolean;

/* ────────────────────────── 부분집합을 직접 센다 ────────────────────────── */

/**
 * 부분집합 전부 — 원소 번호의 목록으로. 정본과 무관하게 정의 그대로 만든다. 정본의 값과 맞대는 쪽이다.
 * 번호가 작은 원소부터 적는다.
 */
function subsets(nums: readonly number[]): number[][] {
  const out: number[][] = [];
  const n = nums.length;
  for (let m = 0; m < 1 << n; m++) {
    const s: number[] = [];
    for (let k = 0; k < n; k++) if (m & (1 << k)) s.push(k);
    out.push(s);
  }
  return out;
}

const sumOf = (nums: readonly number[], s: readonly number[]): number =>
  s.reduce((acc, k) => acc + (nums[k] as number), 0);

/** 부분집합을 값으로 적는다 — `{3, 4}`. 빈 부분집합은 `{}` 다. */
const valuesOf = (nums: readonly number[], s: readonly number[]): string =>
  setText(s.map((k) => nums[k] as number));

/** 합이 `target` 인 부분집합 전부. */
const hitting = (nums: readonly number[], target: number): number[][] =>
  subsets(nums).filter((s) => sumOf(nums, s) === target);

/** 앞의 원소들로 만들 수 있는 합 가운데 `cap` 이하인 것 — 정의 그대로 모은다. */
const sumsUpTo = (nums: readonly number[], cap: number): number[] =>
  [
    ...new Set(
      subsets(nums)
        .map((s) => sumOf(nums, s))
        .filter((x) => x <= cap),
    ),
  ].sort((p, q) => p - q);

// 정의대로 모은 답이 정본과 같은가 — 작은 입력 전부에서 맞대어 둔다. 어긋나면 아래 블록이 모두 틀린 말을 한다.
for (const nums of [NUMS, [1, 2, 3], [3, 4], [7], [0, 1, 2], [5, 5, 10]]) {
  for (let t = 0; t <= 20; t++) {
    if (hitting(nums, t).length > 0 !== subsetSum([...nums], t)) {
      throw new Error(`${label(nums, t)} 에서 직접 모은 답이 정본과 다르다`);
    }
  }
}

/** 부분집합을 실제로 하나씩 만들어 세고, 합이 `target` 인 것이 있으면 참. */
function enumerate(
  nums: number[],
  target: number,
): { 부분집합: number; 답: boolean } {
  const n = nums.length;
  let 부분집합 = 0;
  let 답 = false;
  for (let m = 0; m < 1 << n; m++) {
    부분집합++;
    let s = 0;
    for (let i = 0; i < n; i++) if (m & (1 << i)) s += nums[i] as number;
    if (s === target) 답 = true;
  }
  return { 부분집합, 답 };
}

/** 층마다 만들 수 있는 합의 가짓수. `target` 을 넘는 합은 버린다. */
function reachable(nums: readonly number[], target: number): number[] {
  const sizes = [1];
  let cur = new Set<number>([0]);
  for (const a of nums) {
    const next = new Set<number>(cur);
    for (const s of cur) if (s + a <= target) next.add(s + a);
    cur = next;
    sizes.push(cur.size);
  }
  return sizes;
}

/* ────────────────────────── 정본과 다른 절차 ────────────────────────── */

/** 합 하나만 기억하는 한 줄짜리 배열을 **내림차순**으로 채운 것 — 원소를 한 번씩만 쓴다. */
function oneRowDescending(nums: readonly number[], target: number): boolean {
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;
  for (const a of nums) {
    for (let t = target; t >= a; t--) if (dp[t - a]) dp[t] = true;
  }
  return dp[target] as boolean;
}

/** 열을 `0 … cap` 까지 두고 채운 뒤 `target` 칸을 읽는다. */
function tableWithCap(nums: number[], target: number, cap: number): boolean {
  const n = nums.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(cap + 1).fill(false),
  );
  (dp[0] as boolean[])[0] = true;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const prev = dp[i - 1] as boolean[];
    const cur = dp[i] as boolean[];
    for (let t = 0; t <= cap; t++) {
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (prev[t - a] as boolean);
    }
  }
  return (dp[n] as boolean[])[target] as boolean;
}

/** 칸의 뜻을 「합 `t` **이하**를 만들 수 있는가」로 두고 채운 DP 테이블. */
function atMostTable(nums: number[], target: number): boolean {
  const n = nums.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(target + 1).fill(false),
  );
  // 빈 부분집합의 합 0 은 어떤 t 에 대해서도 t 이하다.
  for (let t = 0; t <= target; t++) (dp[0] as boolean[])[t] = true;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const prev = dp[i - 1] as boolean[];
    const cur = dp[i] as boolean[];
    for (let t = 0; t <= target; t++) {
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (prev[t - a] as boolean);
    }
  }
  return (dp[n] as boolean[])[target] as boolean;
}

interface NegativeRead {
  i: number;
  t: number;
  a: number;
  src: number;
  inside: boolean;
  value: boolean;
}

/**
 * 음수가 섞인 배열에 이 DP 테이블을 그대로 건다. 열 밖을 가리키는 자리는 거짓으로 읽는다.
 * 칸마다 읽은 자리를 함께 남긴다 — 본문이 그 자리를 따라간다.
 */
function tableAllowingNegative(
  nums: number[],
  target: number,
): { result: boolean; log: NegativeRead[] } {
  const n = nums.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(target + 1).fill(false),
  );
  (dp[0] as boolean[])[0] = true;
  const log: NegativeRead[] = [];
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const prev = dp[i - 1] as boolean[];
    const cur = dp[i] as boolean[];
    for (let t = 0; t <= target; t++) {
      const src = t - a;
      const inside = src >= 0 && src <= target;
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (inside ? (prev[src] as boolean) : false);
      log.push({ i, t, a, src, inside, value: cur[t] as boolean });
    }
  }
  return { result: (dp[n] as boolean[])[target] as boolean, log };
}

/** 값을 정한 칸 수. `early` 면 `dp[i][target]` 이 참이 된 줄에서 멈춘다. */
function decidedCells(nums: number[], target: number, early: boolean): number {
  const n = nums.length;
  let cells = target + 1;
  let prev = new Array<boolean>(target + 1).fill(false);
  prev[0] = true;
  if (early && (prev[target] as boolean)) return cells;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const cur = new Array<boolean>(target + 1).fill(false);
    for (let t = 0; t <= target; t++) {
      cells++;
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (prev[t - a] as boolean);
    }
    prev = cur;
    if (early && (prev[target] as boolean)) return cells;
  }
  return cells;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Solver = { subsetSum(nums: number[], target: number): boolean };

/**
 * 불변식을 지키던 줄 — `t - a` 를 **윗 줄**에서 읽는 자리 — 를 **이번 줄**로 바꾼 사본.
 * 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 같은줄에서읽기 = await loadMutant<Solver>(REF, {
  swap: [/\(prev\[t - a\] as boolean\)/, "(cur[t - a] as boolean)"],
});

/**
 * 중화 실행인가 — `check-proof` 가 변이를 끈 채 이 파일을 한 번 더 부를 때는 `loadMutant` 가 정본을
 * 그대로 돌려준다. 값에서 알아낸다(변이 모듈의 함수가 정본과 같은 객체인가). 그때는 「변이가 답을
 * 바꿨다」는 자기검사만 건너뛴다 — 안 그러면 중화 실행이 모듈 머리에서 던져 갈림 대조가 한 번도 돌지 않는다.
 */
const 중화 = 같은줄에서읽기.subsetSum === subsetSum;

const 변이표: [number[], number][] = [
  [NUMS, 9],
  [NUMS, 30],
  [[3], 9],
  [[3, 4], 8],
  [[7], 14],
  [[100, 200], 50],
];

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (
  !중화 &&
  변이표.every(
    ([nums, target]) =>
      subsetSum(nums, target) === 같은줄에서읽기.subsetSum(nums, target),
  )
) {
  throw new Error(
    "같은 줄에서 읽는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

/* ────────────────── 바깥 자료가 적은 값 (대조용) ────────────────── */

/** 인용한 소스가 적어 둔 상수. 값이 어긋나면 인용이 낡은 것이라 여기서 실패한다. */
const COIN = 100_000_000n;
const MAX_MONEY = 21_000_000n * COIN;
if (MAX_MONEY !== 2_100_000_000_000_000n) {
  throw new Error("MAX_MONEY 계산이 인용한 정의와 어긋난다");
}

/* ────────────────────────── 파트 1 — 전체 컨셉 ────────────────────────── */

/** `concept` — 전개 입력의 답과 부분집합의 수. */
function conceptScale(): string {
  const hits = hitting(NUMS, TARGET);
  const r = subsetSum(NUMS, TARGET);
  if (hits.length > 0 !== r) throw new Error("직접 모은 답이 정본과 다르다");
  const n = NUMS.length;
  const rows: [string, string][] = [
    [
      `합이 ${TARGET} 인 부분집합`,
      hits.map((s) => valuesOf(NUMS, s)).join(" · "),
    ],
    ["고를 수 있는 부분집합", `2^${n} = ${comma(2 ** n)} 가지`],
    [
      `원소가 ${comma(N_MAX)} 개이면`,
      `2^${N_MAX} = ${big(subsetsAtMax())} 가지`,
    ],
  ];
  const w = Math.max(...rows.map(([k]) => width(k)));
  return [
    `원소 ${list(NUMS)} · 목표 합 ${TARGET}   →  ${yn(r)}`,
    ...rows.map(([k, v]) => `  ${pad(k, w)}   ${v}`),
  ].join("\n");
}

/** `concept` — 칸 수는 원소 수와 목표 합의 곱으로 막힌다. */
function conceptCost(): string {
  return [
    `전개 입력   (n+1)(T+1) = ${NUMS.length + 1} × ${TARGET + 1} = ${comma((NUMS.length + 1) * (TARGET + 1))} 칸`,
    `규모의 끝   (n+1)(T+1) = ${comma(N_MAX + 1)} × ${comma(T_MAX + 1)} = ${comma(cellsAtMax())} 칸`,
  ].join("\n");
}

/* ────────────────────────── 파트 1 — 떠올리는 과정 ────────────────────────── */

/** `deep.origin` ② — 부분집합을 하나씩 만드는 길이 어디서 끊기는가. */
function subsetCount(): string {
  const rows = [6, 12, 20].map((n) => {
    const nums = Array.from({ length: n }, (_, i) => i + 1);
    const r = enumerate(nums, 10_000);
    return [comma(n), comma(r.부분집합), big(2n ** BigInt(n))];
  });
  rows.push(["40", "세지 못했다", big(2n ** 40n)]);
  rows.push([comma(N_MAX), "세지 못했다", big(subsetsAtMax())]);
  return table(["원소 수", "실제로 만들어 센 부분집합", "2^n"], rows);
}

/** `deep.origin` ② — 1 초에 1 억 개씩 만든다면 걸리는 시간(§14 시간 어림). */
function subsetTime(): string {
  const rate = 10n ** 8n;
  const s40 = 2n ** 40n / rate;
  const sMax = subsetsAtMax() / rate;
  return [
    "1 초에 부분집합을 1 억 개씩 만든다면",
    `  원소 40 개      2^40 개    →  ${comma(s40)} 초 (약 ${Math.round(Number(s40) / 60)} 분)`,
    `  원소 ${comma(N_MAX)} 개   2^${N_MAX} 개  →  ${big(sMax)} 초`,
  ].join("\n");
}

/** `deep.origin` ③ — 서로 다른 부분집합이 같은 합을 갖는 자리. */
function sameSum(): string {
  const sum = 7;
  const hits = hitting(NUMS, sum);
  if (hits.length < 2) throw new Error("합이 같은 부분집합이 둘 이상이 아니다");
  const lines = hits.map(
    (s, k) =>
      `${pad(valuesOf(NUMS, s), 10)}  합 ${sum}   ${k === 0 ? "┐" : k === hits.length - 1 ? "┘" : "│"}`,
  );
  return [
    ...lines,
    `  둘 다 「합 ${sum}${을를(sum)} 만들었다」 — 남은 원소로 할 수 있는 일이 두 경우에 같다`,
  ].join("\n");
}

/** `deep.origin` ④ — 같은 입력을 두 방식으로 처리하고 층마다 항목 수를 센다. */
function mergeSameSum(): string {
  const sizes = reachable(NUMS, TARGET);
  const rows = sizes.map((size, i) => [
    i === 0 ? "i=0 (원소 없음)" : `i=${i} · a=${NUMS[i - 1]}`,
    comma(2 ** i),
    comma(size),
  ]);
  const total = (xs: number[]) => xs.reduce((s, v) => s + v, 0);
  const cap = Math.max(...sizes);
  if (cap > TARGET + 1) throw new Error("합의 가짓수가 목표 합 + 1 을 넘었다");
  return withNote(
    md(["층", "부분집합마다 따로 센 수", "같은 합을 합친 수"], rows, [1, 2]),
    `모두 더하면 ${comma(total(sizes.map((_, i) => 2 ** i)))} 대 ${comma(total(sizes))} 입니다. 합이 같으면 합친 쪽은 가장 많은 층에서도 ${cap} 가지이고, 목표 합 + 1 = ${TARGET + 1}${을를(TARGET + 1)} 넘지 않습니다.`,
  );
}

/** `deep.origin` ⑤ — 합 하나만 기억하면 같은 원소를 여러 번 쓴다. */
function oneRowOnly(): string {
  return table(
    ["입력", "정본", "합 t 하나만 기억한 배열"],
    (
      [
        [NUMS, 9],
        [NUMS, ONE_ROW_TARGET],
        [[3], 9],
        [[3, 4], 8],
        [[7], 14],
        [[100, 200], 50],
      ] as [number[], number][]
    ).map(([nums, target]) => [
      label(nums, target),
      yn(subsetSum(nums, target)),
      yn(oneRowAscending(nums, target)[target] as boolean),
    ]),
  );
}

/** `deep.origin` ⑤ — 원소 3 하나만 처리한 한 줄이 무엇을 셌는가. */
function oneRowTrace(): string {
  const a = 3;
  const target = ONE_ROW_TARGET;
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;
  const lines: string[] = [];
  for (let t = a; t <= target; t++) {
    if (dp[t - a]) {
      dp[t] = true;
      const k = t / a;
      lines.push(
        `  t=${pad(String(t), 3)} dp[${t - a}]${이가(t - a)} 참이라 dp[${t}] ← 참    ${a}${을를(a)} ${k} 번 쓴 합`,
      );
    }
  }
  if ((oneRowAscending([a], target)[target] as boolean) !== true) {
    throw new Error("한 줄 배열이 목표 칸을 참으로 두지 않았다");
  }
  const shown = [...lines.slice(0, 3), "  …", ...lines.slice(-1)];
  return [
    `원소 ${a} 하나만 처리한 한 줄 (t 를 오름차순으로 채운다)`,
    "",
    ...shown,
  ].join("\n");
}

/* ────────────────────────── 파트 1 — 아이디어 상세 ────────────────────────── */

/** 1단계 — DP 테이블의 크기. */
function buildSize(): string {
  const rows = [
    [NUMS.length, TARGET],
    [N_MAX, T_MAX],
  ].map(([nn, tt]) => {
    const r = (nn as number) + 1;
    const c = (tt as number) + 1;
    return [
      comma(nn as number),
      comma(tt as number),
      comma(r),
      comma(c),
      comma(r * c),
    ];
  });
  const got = T.rows.length * (T.rows[0]?.length ?? 0);
  return withNote(
    md(
      ["원소 수 n", "목표 합 T", "줄 수 n+1", "줄마다 칸 수 T+1", "모든 칸"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    `전개 입력에서 정본이 만든 DP 테이블은 ${T.rows.length} 줄 × ${T.rows[0]?.length} 칸, 모두 ${got} 칸입니다.`,
  );
}

/** 1단계 — 칸 하나를 읽는 법. `dp[3][7]` 이 가리키는 부분집합을 직접 모은다. */
function buildReadOne(): string {
  const i = 3;
  const x = 7;
  const nums = NUMS.slice(0, i);
  const rows = subsets(nums).map((s) => {
    const sum = sumOf(nums, s);
    return [valuesOf(nums, s), String(sum), sum === x ? "맞다" : "—"];
  });
  const hits = hitting(nums, x);
  return withNote(
    md(["앞의 세 원소에서 고른 부분집합", "합", `합이 ${x}`], rows, [1]),
    `원소 ${nums.join(" · ")} 로 합 ${x}${을를(x)} 정확히 만드는 부분집합은 ${hits.length} 개이고, DP 테이블의 dp[${i}][${x}] 도 ${yn(dpv(i, x))} 입니다.`,
  );
}

/** 2단계 — `dp[5][9]` 의 부분집합을 원소 5 를 골랐는가로 가른다. */
function buildSplit(): string {
  const i = 5;
  const x = TARGET;
  const a = NUMS[i - 1] as number;
  const nums = NUMS.slice(0, i);
  const hits = hitting(nums, x);
  const without = hits.filter((s) => !s.includes(i - 1));
  const withA = hits.filter((s) => s.includes(i - 1));
  if (
    without.length > 0 !== dpv(i - 1, x) ||
    withA.length > 0 !== dpv(i - 1, x - a)
  ) {
    throw new Error("두 무리가 윗 줄의 두 칸과 맞지 않는다");
  }
  const rows: string[][] = [
    [
      `${a}${을를(a)} 안 고른 것`,
      without.length === 0
        ? "없다"
        : without.map((s) => valuesOf(nums, s)).join(" · "),
      "—",
      `dp[${i - 1}][${x}] = ${yn(dpv(i - 1, x))}`,
    ],
    ...withA.map((s) => [
      `${a}${을를(a)} 고른 것`,
      valuesOf(nums, s),
      valuesOf(
        nums,
        s.filter((k) => k !== i - 1),
      ),
      `dp[${i - 1}][${x - a}] = ${yn(dpv(i - 1, x - a))}`,
    ]),
  ];
  return withNote(
    md(
      [
        "무리",
        `dp[${i}][${x}] 의 부분집합`,
        `${a}${을를(a)} 뺀 부분집합`,
        "뺀 부분집합이 있는 칸",
      ],
      rows,
    ),
    `${a}${을를(a)} 안 고른 부분집합은 ${without.length} 개, 고른 부분집합은 ${withA.length} 개이고, 두 무리를 보는 칸이 모두 윗 줄 i=${i - 1} 에 있습니다.`,
  );
}

/** 2단계 — i=5 줄을 왼쪽부터 채우며 읽은 칸이 언제 정해졌는지. */
function buildFillRow(): string {
  const i = 5;
  const a = NUMS[i - 1] as number;
  const order = new Map(T.cells.map((c, k) => [`${c.i},${c.t}`, k + 1]));
  const mine = T.cells.filter((c) => c.i === i);
  const rows = mine.map((c) => {
    const [up, left] = c.reads;
    return [
      String(c.t),
      c.branch === "copy" ? "②" : "③",
      `dp[${i - 1}][${c.t}] = ${yn(up?.value ?? false)}`,
      left ? `dp[${i - 1}][${c.t - a}] = ${yn(left.value)}` : "—",
      yn(c.value),
    ];
  });
  const start = order.get(`${i},0`) ?? 0;
  const reads = mine.flatMap((c) => c.reads);
  const upper = reads.filter((r) => r.at[0] === i - 1);
  const before = reads.filter(
    (r) => (order.get(`${r.at[0]},${r.at[1]}`) ?? 0) < start,
  );
  return withNote(
    md(["t", "갈래", "윗 칸", `윗 줄 ${a} 칸 왼쪽`, `dp[${i}][t]`], rows, [0]),
    `i=${i} 줄의 칸 ${rows.length} 개가 읽은 자리는 ${reads.length} 곳이고, 그중 ${upper.length} 곳이 윗 줄 i=${i - 1} 에 있습니다. ${before.length} 곳 모두 i=${i} 줄의 첫 칸을 정하기 전에 정해져 있었습니다.`,
  );
}

/** 3단계 — 마지막 줄과 목표 합마다 따로 호출한 답. */
function buildAnswer(): string {
  const n = NUMS.length;
  const last = T.rows[n] as readonly boolean[];
  const rows = last.map((v, t) => [
    String(t),
    yn(v),
    yn(subsetSum([...NUMS], t)),
  ]);
  const same = last.filter((v, t) => v === subsetSum([...NUMS], t)).length;
  return withNote(
    md(["합 t", `dp[${n}][t]`, `subsetSum(${list(NUMS)}, t)`], rows, [0]),
    `${last.length} 합 가운데 ${same} 합에서 두 값이 같습니다. 정본이 돌려주는 것은 오른쪽 끝 dp[${n}][${TARGET}] = ${yn(T.result)} 하나입니다.`,
  );
}

/** 설계 선택 — 상태 후보 셋을 실제로 시험한다. */
function stateCandidates(): string {
  const target = ONE_ROW_TARGET;
  const sum = NUMS.reduce((x, y) => x + y, 0);
  const n = NUMS.length;
  const sigmaMax = BigInt(N_MAX) * BigInt(A_MAX);
  const capCells = BigInt(N_MAX + 1) * (sigmaMax + 1n);
  const cutCells = BigInt(cellsAtMax());
  const oneRow = oneRowAscending(NUMS, target)[target] as boolean;
  const rows = [
    ["합 t 하나 (한 줄)", yn(oneRow), comma(target + 1), comma(T_MAX + 1)],
    [
      "(i, t) · 열을 0 … T 로 자른다",
      yn(subsetSum(NUMS, target)),
      comma((n + 1) * (target + 1)),
      comma(cutCells),
    ],
    [
      "(i, t) · 열을 0 … Σa 로 둔다",
      yn(tableWithCap(NUMS, target, sum)),
      comma((n + 1) * (sum + 1)),
      comma(capCells),
    ],
  ];
  const ratio = (Number(capCells) / Number(cutCells)).toFixed(1);
  return withNote(
    md(
      [
        "상태",
        `${label(NUMS, target)} 의 답`,
        "그때 칸 수",
        "규모의 끝의 칸 수",
      ],
      rows,
      [2, 3],
    ),
    `정본의 답은 ${yn(subsetSum(NUMS, target))}, 합 하나만 둔 상태의 답은 ${yn(oneRow)} 입니다. 규모의 끝에서 Σa 는 ${comma(N_MAX)} × ${comma(A_MAX)} = ${comma(sigmaMax)} 이고, 열을 거기까지 두면 칸이 ${ratio} 배가 됩니다.`,
  );
}

/* ────────────────────────── 파트 1 — 수행으로 알아보는 알고리즘 ────────────────────────── */

/** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
function walkInput(): string {
  return [
    `const nums = ${list(NUMS)};`,
    `const target = ${TARGET};`,
    `// 이 절이 끝나면 ${yn(subsetSum(NUMS, TARGET))}이 나와야 한다`,
  ].join("\n");
}

/** walk 1 — 첫 칸을 정한 직후의 DP 테이블. 원소가 없는 입력도 함께. */
function walkInit(): string {
  const first = T.init[0] as readonly boolean[];
  const empty = [5, 0].map((x) => {
    const t = trace([], x);
    return `nums = [], target = ${x}  →  ${t.rows.length} 줄 × ${t.rows[0]?.length} 칸, 칸을 하나도 안 정하고 dp[0][${x}] = ${yn(t.result)} 반환`;
  });
  return [
    `DP 테이블 ${T.init.length} 줄 × ${first.length} 칸`,
    `  i=0 줄         ${first.map(yn).join(" ")}`,
    `  i=1 … ${T.init.length - 1} 줄     아직 안 정한 줄 — fill(false) 가 깔아 둔 거짓`,
    "",
    ...empty,
  ].join("\n");
}

/** walk 2 — 두 반복문이 칸을 정하는 차례. */
function walkOrder(): string {
  const lines = NUMS.map((a, j) => {
    const i = j + 1;
    const ts = T.cells.filter((x) => x.i === i).map((x) => x.t);
    return `${pad(`i=${i} (a=${a})`, 12)}t = ${ts.join(" → ")}`;
  });
  return [
    ...lines,
    "  └ 한 줄을 왼쪽 끝부터 오른쪽 끝까지 다 정한 뒤 다음 줄로 간다",
  ].join("\n");
}

/** walk 3 — 윗 줄에서 읽는 값과 같은 줄에서 읽었다면 읽었을 값. */
function walkBranchRead(): string {
  const i = 1;
  const a = NUMS[i - 1] as number;
  const cells = T.cells.filter((x) => x.i === i && x.t >= a);
  const rows = cells.map((x) => [
    `t = ${x.t}`,
    `prev[${x.t - a}] = ${yn(dpv(i - 1, x.t - a))}`,
    `cur[${x.t - a}] = ${yn(dpv(i, x.t - a))}`,
  ]);
  const firstDiff = cells.find((x) => dpv(i, x.t - a) !== dpv(i - 1, x.t - a));
  const at = firstDiff?.t ?? 0;
  return [
    table(
      [`i=${i} 줄, a = ${a}`, `윗 줄 prev[t-${a}]`, `같은 줄 cur[t-${a}]`],
      rows,
    ),
    `  └ 두 값이 처음 달라지는 자리는 t = ${at} 이다. cur[${at - a}] 에는 ${a}${을를(a)} 이미 쓴 합이 들어 있다`,
  ].join("\n");
}

/** `deep.walk.pause` — `[5, -2] / 3` 을 DP 테이블에 그대로 걸면 읽을 칸이 열 밖이다. */
function negativeTrace(): string {
  const nums = [5, -2];
  const target = 3;
  const run = tableAllowingNegative(nums, target);
  const at = (i: number): NegativeRead => {
    const r = run.log.find((x) => x.i === i && x.t === target);
    if (!r) throw new Error(`i=${i} 의 t=${target} 기록이 없다`);
    return r;
  };
  const r1 = at(1);
  const r2 = at(2);
  const right = enumerate(nums, target).답;
  const ra = (x: number) => josa(x, "이라", "라");
  return [
    `nums = ${list(nums)},  target = ${target}        옳은 답: ${yn(right)}`,
    "",
    `  i=1  a=${r1.a}    t=${target}${은는(target)} ${target} < ${r1.a}${ra(r1.a)} ② — dp[1][${target}] = dp[0][${target}] = ${yn(r1.value)}`,
    `  i=2  a=${r2.a}   t=${target}${은는(target)} ${target} ≥ ${r2.a}${ra(r2.a)} ③ — dp[2][${target}] = dp[1][${target}] 또는 dp[1][${r2.src}]`,
    `               열이 0 … ${target} 뿐이라 dp[1][${r2.src}] 라는 칸이 ${r2.inside ? "있다" : "아예 없다"}`,
    `               그 자리를 거짓으로 읽으면 dp[2][${target}] = ${yn(r2.value)}`,
  ].join("\n");
}

/** `deep.walk.pause` — 음수가 섞이면 이 DP 테이블이 답을 못 낸다. */
function negativeElement(): string {
  return table(
    ["입력", "전부 세어 본 답", "이 DP 테이블이 내는 답"],
    (
      [
        [[5, -2], 3],
        [[10, -7], 3],
        [[8, -5, 1], 4],
        [[4, -1, 2], 5],
        [[3, -3, 6], 6],
      ] as [number[], number][]
    ).map(([nums, target]) => [
      label(nums, target),
      yn(enumerate(nums, target).답),
      yn(tableAllowingNegative(nums, target).result),
    ]),
  );
}

/** `deep.walk.pause` — 음수를 허용하려면 열을 얼마나 넓혀야 하는가. */
function negativeCost(): string {
  const sigma = BigInt(N_MAX) * BigInt(A_MAX);
  const cols = 2n * sigma + 1n;
  const cells = BigInt(N_MAX + 1) * cols;
  const rows: [string, string][] = [
    ["열 0 … T", comma(T_MAX + 1)],
    ["열 −Σ|a| … +Σ|a|", comma(cols)],
    ["그때 칸 (n+1)(2Σ|a|+1)", comma(cells)],
  ];
  const wk = Math.max(...rows.map(([k]) => width(k)));
  const wv = Math.max(...rows.map(([, v]) => width(v)));
  return [
    `원소 ${comma(N_MAX)} 개 · |원소| ≤ ${comma(A_MAX)} 이면 Σ|a| ≤ ${comma(sigma)}`,
    ...rows.map(([k, v]) => `  ${pad(k, wk)}   ${padL(v, wv)} 개`),
  ].join("\n");
}

/** walk 4 — 걸음 전부. 조건 판정은 실제 값으로 적는다. */
function walkTrace(): string {
  const steps = walkSteps();
  const segs = segments(T);
  const rows: string[][] = [
    [steps[0]?.id ?? "", "dp[0][0]", "—", "첫 칸 → ①", "0"],
  ];
  segs.forEach((s, k) => {
    const first = s.cells[0]?.t ?? 0;
    const last = s.cells.at(-1)?.t ?? 0;
    const range = first === last ? `${first}` : `${first} … ${last}`;
    const truth = s.branch === "copy" ? "**참**" : "**거짓**";
    const trues = s.cells.filter((c) => c.value).map((c) => c.t);
    rows.push([
      steps[k + 1]?.id ?? "",
      `i=${s.i} · t = ${range}`,
      String(s.a),
      `\`t < ${s.a}\` ${truth} → ${s.branch === "copy" ? "②" : "③"}`,
      trues.length === 0 ? "없다" : trues.join(" "),
    ]);
  });
  const n = NUMS.length;
  rows.push([
    steps.at(-1)?.id ?? "",
    `dp[${n}][${TARGET}]`,
    "—",
    "읽기",
    `반환 ${yn(T.result)}`,
  ]);
  const copies = T.cells.filter((c) => c.branch === "copy").length;
  const ors = T.cells.length - copies;
  return withNote(
    md(["단계", "칸", "a", "조건 판정", "참인 열"], rows, [2]),
    `① 이 1 칸, ② 가 ${copies} 칸, ③ 이 ${ors} 칸이고, 반환값은 ${yn(T.result)} 입니다.`,
  );
}

/** `deep.walk.pause` — 칸의 뜻을 「이하」로 두면 DP 테이블이 통째로 참이 된다. */
function exactVsAtMost(): string {
  return table(
    ["입력", "칸이 「정확히 t」 (정본)", "칸이 「t 이하」"],
    (
      [
        [NUMS, 9],
        [NUMS, 30],
        [[3, 4], 6],
        [[100, 200], 50],
        [[], 5],
      ] as [number[], number][]
    ).map(([nums, target]) => [
      label(nums, target),
      yn(subsetSum(nums, target)),
      yn(atMostTable(nums, target)),
    ]),
  );
}

/** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
function finalRun(): string {
  const 목록: [number[], number][] = [
    [NUMS, 9],
    [NUMS, 30],
    [[1, 2, 3, 4], 7],
    [[1, 2, 3], 0],
    [[], 0],
    [[], 5],
    [[0, 1, 2], 0],
    [[10_000], 10_000],
  ];
  const 이름 = 목록.map(
    ([nums, target]) => `subsetSum([${nums.join(", ")}], ${target})`,
  );
  const 폭 = Math.max(...이름.map((s) => s.length));
  return 목록
    .map(
      ([nums, target], i) =>
        `${pad(이름[i] as string, 폭)}  →  ${yn(subsetSum(nums, target))}`,
    )
    .join("\n");
}

/** `related` — 한 줄이 윗 줄과 그 옮긴 사본의 합집합이다. */
function relatedSets(): string {
  const i = NUMS.length - 1;
  const { up, row, a } = sumsetRows(i);
  const R = trueCols(up);
  const moved = R.map((x) => x + a);
  const kept = moved.filter((x) => x <= TARGET);
  const dropped = moved.filter((x) => x > TARGET);
  const union = [...new Set([...R, ...kept])].sort((p, q) => p - q);
  if (setText(union) !== setText(trueCols(row))) {
    throw new Error("합집합이 DP 테이블의 줄과 다르다");
  }
  const tail =
    dropped.length > 0
      ? `← ${dropped.join(" · ")}${이가(dropped.at(-1) ?? 0)} 열 밖이라 버린다`
      : "";
  const rows: [string, string, string][] = [
    ["R", setText(R), `= i=${i - 1} 줄에서 참인 열`],
    [`${a} + R`, setText(moved), tail],
    [`R ∪ (${a} + R)`, setText(union), `= i=${i} 줄에서 참인 열`],
  ];
  const w = Math.max(...rows.map(([k]) => width(k)));
  const wv = Math.max(...rows.map(([, v]) => width(v)));
  return rows
    .map(([k, v, note]) => `${pad(k, w)}   ${pad(v, wv)}   ${note}`.trimEnd())
    .join("\n");
}

/* ────────────────────────── 파트 2 — 적용 조건 ────────────────────────── */

/** `purpose.real` — 인용한 상수를 넣으면 DP 테이블의 열이 몇 개가 되는가. */
function satoshiColumns(): string {
  const n = 20n;
  return table(
    ["무엇", "값"],
    [
      ["COIN — 1 BTC 의 사토시", comma(COIN)],
      ["MAX_MONEY — 21,000,000 × COIN", comma(MAX_MONEY)],
      ["DP 테이블의 열 수 (0 … MAX_MONEY)", comma(MAX_MONEY + 1n)],
      ["원소 20 개일 때 DP 테이블 칸 수", big((n + 1n) * (MAX_MONEY + 1n))],
      ["원소 20 개를 절반으로 갈랐을 때 부분합", comma(2n ** 10n + 2n ** 10n)],
    ],
  );
}

const TABLE_NAME = "DP 테이블 채우기 (이 가이드)";
const MITM = "중간에서 만나기";
const OPS = "기본 연산";
const HELD = "추가 칸";
const get = (r: Record<string, number>, k: string): number => r[k] as number;

/** `purpose.alt` — 전개 입력으로는 두 설계가 갈리지 않는다. */
function altWalkInput(): string {
  const input = { nums: NUMS, target: TARGET };
  const f = get(fillTable(input), OPS);
  const m = get(meetInTheMiddle(input), OPS);
  return `전개 입력 ${label(NUMS, TARGET)}   ${TABLE_NAME} ${f} · ${MITM} ${m}  →  기본 연산이 ${(Math.max(f, m) / Math.min(f, m)).toFixed(1)} 배 차이`;
}

/** `purpose.alt` — 두 입력의 생성식 매개변수. 입력 자체에서 다시 만들어 맞댄다. */
function altInputs(): string {
  const spec: [string, number, number, number, Input][] = [
    ["A", 36, 37, 97, A],
    ["B", 20, 37_003, 99_991, B],
  ];
  for (const [name, n, P, M, input] of spec) {
    if (JSON.stringify(gen(n, P, M)) !== JSON.stringify(input.nums)) {
      throw new Error(`입력 ${name} 의 매개변수가 생성식과 다르다`);
    }
  }
  return md(
    ["입력", "원소 수", "`P`", "`M`", "목표 합"],
    spec.map(([name, n, P, M, input]) => [
      name,
      comma(n),
      comma(P),
      comma(M),
      comma(input.target),
    ]),
    [1, 2, 3, 4],
  );
}

/** `purpose.alt` — 두 입력에서 두 설계의 계수. */
function altCounts(): string {
  const fa = fillTable(A);
  const ma = meetInTheMiddle(A);
  const fb = fillTable(B);
  const mb = meetInTheMiddle(B);
  const ra = Math.round(get(ma, OPS) / get(fa, OPS));
  const rb = Math.round(get(fb, OPS) / get(mb, OPS));
  const halfA = A.nums.length >> 1;
  const halfB = 2 ** (B.nums.length >> 1);
  return withNote(
    md(
      ["설계", "A 기본 연산", "A 추가 칸", "B 기본 연산", "B 추가 칸"],
      [
        [
          `**${TABLE_NAME}**`,
          `**${comma(get(fa, OPS))}**`,
          `**${comma(get(fa, HELD))}**`,
          comma(get(fb, OPS)),
          comma(get(fb, HELD)),
        ],
        [
          MITM,
          comma(get(ma, OPS)),
          comma(get(ma, HELD)),
          `**${comma(get(mb, OPS))}**`,
          `**${comma(get(mb, HELD))}**`,
        ],
      ],
      [1, 2, 3, 4],
    ),
    `A 에서는 DP 테이블 쪽 기본 연산이 ${ra} 배 적습니다. 원소가 ${A.nums.length} 개라 절반씩 갈라도 부분합이 2^${halfA} 개씩 나옵니다. B 에서는 중간에서 만나기가 ${rb} 배 적습니다. 원소가 ${B.nums.length} 개뿐이라 부분합이 ${comma(halfB)} 개씩이고, DP 테이블은 목표 합 ${comma(B.target)} 까지 열을 깔아야 합니다.`,
  );
}

/** `purpose.alt` — 목표 합을 고정하고 원소 수만 바꾼 경계. */
function altBoundary(): string {
  const rows = (
    [
      [19, E19],
      [20, E20],
    ] as [number, Input][]
  ).map(([n, input]) => {
    const f = get(fillTable(input), OPS);
    const m = get(meetInTheMiddle(input), OPS);
    return [comma(n), comma(f), comma(m), f < m ? `**${TABLE_NAME}**` : MITM];
  });
  return withNote(
    md(["원소 수", TABLE_NAME, MITM, "더 적은 쪽"], rows, [0, 1, 2]),
    `두 입력 모두 목표 합은 ${comma(E19.target)} 입니다.`,
  );
}

/* ────────────────────────── 파트 2 — 수식 ────────────────────────── */

/** `deep.math` ② — 정의를 `i = 3` 에 넣어 직접 모은다. */
function mathCheck(): string {
  const i = 3;
  const nums = NUMS.slice(0, i);
  const lines = subsets(nums).map((s) => {
    const sum = sumOf(nums, s);
    const name = `S = {${s.map((k) => k + 1).join(",")}}`;
    return `  ${pad(name, 14)}  합 ${pad(String(sum), 4)} ${sum <= TARGET ? `≤ ${TARGET}   ✓` : `> ${TARGET}   버린다`}`;
  });
  const R = sumsUpTo(nums, TARGET);
  if (setText(R) !== setText(trueCols(T.rows[i] as boolean[]))) {
    throw new Error("정의로 모은 R_3 이 DP 테이블의 줄과 다르다");
  }
  return [
    `S ⊆ {1, 2, 3},  Σa_k ≤ ${TARGET}   (a_1 = ${nums[0]}, a_2 = ${nums[1]}, a_3 = ${nums[2]})`,
    "",
    ...lines,
    `${" ".repeat(32)}R_3 = ${setText(R)}`,
  ].join("\n");
}

/** `deep.math` — 식을 옮긴 코드와 그 값. 값은 식을 기록된 DP 테이블 위에서 실행해 받는다. */
function mathCode(): string {
  const dp = T.rows;
  const cell = (i: number, t: number): boolean => {
    const a = NUMS[i - 1] as number;
    const prev = dp[i - 1] as readonly boolean[];
    return t < a
      ? (prev[t] as boolean)
      : (prev[t] as boolean) || (prev[t - a] as boolean);
  };
  const i = NUMS.length - 1;
  const a = NUMS[i - 1] as number;
  const v = cell(i, TARGET);
  if (v !== dpv(i, TARGET)) throw new Error("식이 DP 테이블과 다른 값을 낸다");
  return [
    "const cell = (i: number, t: number): boolean => {",
    "  const a = nums[i - 1] as number;",
    "  const prev = dp[i - 1] as boolean[];",
    "  return t < a",
    "    ? (prev[t] as boolean)",
    "    : (prev[t] as boolean) || (prev[t - a] as boolean);",
    "};",
    "",
    `cell(${i}, ${TARGET}); // → dp[${i - 1}][${TARGET}] 또는 dp[${i - 1}][${TARGET - a}] = ${yn(dpv(i - 1, TARGET))} 또는 ${yn(dpv(i - 1, TARGET - a))} = ${yn(v)}`,
  ].join("\n");
}

/** `deep.math` ③ — 두 상한이 갈리는 `i*` 를 규모의 끝에서 푼다. */
function mathIStar(): string {
  const cap = T_MAX + 1;
  let k = 0;
  while (2 ** k <= cap) k++;
  const before = k - 1;
  if (Math.ceil(Math.log2(cap)) !== k) throw new Error("i* 계산이 식과 다르다");
  return [
    `T = ${comma(T_MAX)} 이면 T+1 = ${comma(cap)}`,
    `  2^${before} = ${padL(comma(2 ** before), 6)} ≤ ${comma(cap)}    → i = ${before} 까지는 두 배로 늘 수 있다`,
    `  2^${k} = ${padL(comma(2 ** k), 6)} > ${comma(cap)}    → i = ${k} 부터는 T+1 이 막는다`,
    `  i* = ⌈log₂ ${comma(cap)}⌉ = ${k}`,
  ].join("\n");
}

/** `deep.math` ② — `|R_i| ≤ min(2^i, T+1)` 을 등호가 서는 입력에서 검산한다. */
function saturation(): string {
  const pow = Array.from({ length: 17 }, (_, k) => 2 ** k);
  const sizes = reachable(pow, T_MAX);
  return table(
    ["i", "2^i", "T+1", "min(2^i, T+1)", "실제 |R_i|"],
    [0, 6, 12, 13, 14, 15, 16].map((i) => [
      String(i),
      comma(2 ** i),
      comma(T_MAX + 1),
      comma(Math.min(2 ** i, T_MAX + 1)),
      comma(sizes[i] as number),
    ]),
  );
}

/** `deep.math` ④ — 부분집합 수와 DP 테이블 칸 수가 어디서 뒤집히는가. */
function crossover(): string {
  return table(
    ["원소 수 n", "부분집합 2^n", "DP 테이블 칸 수 (n+1)(T+1)", "더 적은 쪽"],
    [16, 17, 18, 19, N_MAX].map((n) => {
      const subsetsN = 2n ** BigInt(n);
      const cells = BigInt(n + 1) * BigInt(T_MAX + 1);
      return [
        comma(n),
        big(subsetsN),
        comma(cells),
        subsetsN < cells ? "부분집합" : "DP 테이블",
      ];
    }),
  );
}

/* ────────────────────────── 파트 2 — 불변식 ────────────────────────── */

/** `invariant` ② — 모든 칸을 정의대로 직접 모은 합과 맞댄다. */
function invariantCells(): string {
  let checked = 0;
  let wrong = 0;
  const rows = T.rows.map((row, i) => {
    const direct = sumsUpTo(NUMS.slice(0, i), TARGET);
    let bad = 0;
    row.forEach((v, t) => {
      checked++;
      if (v !== direct.includes(t)) bad++;
    });
    wrong += bad;
    return [
      i === 0 ? "i=0" : `i=${i} · a=${NUMS[i - 1]}`,
      setText(trueCols(row)),
      setText(direct),
      String(bad),
    ];
  });
  return withNote(
    md(
      [
        "줄",
        "DP 테이블에서 참인 열",
        "부분집합을 직접 모아 얻은 합",
        "어긋난 칸",
      ],
      rows,
      [3],
    ),
    `정의대로 직접 모은 합과 DP 테이블의 값을 ${checked} 칸에서 대조했고, 어긋난 칸은 ${wrong} 개입니다.`,
  );
}

/** `invariant` ② — 경계 입력에서 칸을 어느 갈래로 정했는지. */
function invariantEdges(): string {
  const cases: [number[], number][] = [
    [[], 0],
    [[], 5],
    [[1, 2, 3], 0],
    [[0, 1, 2], 0],
    [[100, 200], 50],
    [[10_000], 10_000],
  ];
  const rows = cases.map(([nums, target]) => {
    const t = trace(nums, target);
    const copies = t.cells.filter((c) => c.branch === "copy").length;
    const ors = t.cells.filter((c) => c.branch === "or").length;
    if (copies + ors !== t.cells.length) {
      throw new Error("두 갈래 밖에서 정한 칸이 있다");
    }
    const answer = subsetSum([...nums], target);
    if (answer !== t.result) throw new Error("기록이 정본과 다른 답을 냈다");
    return [
      `\`nums=${list(nums)}, target=${comma(target)}\``,
      `${t.rows.length} × ${comma(t.rows[0]?.length ?? 0)}`,
      comma(copies),
      comma(ors),
      yn(answer),
    ];
  });
  return withNote(
    md(
      [
        "입력",
        "줄 × 칸",
        "윗 칸을 옮긴 칸",
        "두 칸을 「또는」으로 이은 칸",
        "반환",
      ],
      rows,
      [2, 3],
    ),
    `${cases.length} 입력 모두 칸을 두 갈래 가운데 하나로만 정했습니다.`,
  );
}

/** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
function mutantSameRow(): string {
  return table(
    ["입력", "바른 코드", "같은 줄에서 읽은 코드"],
    변이표.map(([nums, target]) => [
      label(nums, target),
      yn(subsetSum(nums, target)),
      yn(같은줄에서읽기.subsetSum(nums, target)),
    ]),
  );
}

/** `invariant` ③ — `[3]` 하나로 두 코드가 만들 수 있다고 보는 합. 목표 합마다 실제로 묻는다. */
function mutantThree(): string {
  const nums = [3];
  const goal = 9;
  const upto = 12;
  const right: number[] = [];
  const mutant: number[] = [];
  for (let t = 0; t <= upto; t++) {
    if (subsetSum(nums, t)) right.push(t);
    if (같은줄에서읽기.subsetSum(nums, t)) mutant.push(t);
  }
  const hit = (xs: number[]) =>
    xs.includes(goal)
      ? `${goal}${이가(goal)} 있다   참`
      : `${goal}${이가(goal)} 없다   거짓`;
  return [
    `${list(nums)} / ${goal} 에서 두 코드가 만들 수 있다고 보는 합 (t = 0 … ${upto} 를 하나씩 물었다)`,
    "",
    `  바른 코드   ${pad(right.join(" · "), 20)} → ${hit(right)}`,
    `  바뀐 코드   ${pad(mutant.join(" · "), 20)} → ${hit(mutant)}`,
  ].join("\n");
}

/* ────────────────────────── 파트 2 — 비용 계산 ────────────────────────── */

/** `perf.derive` — 전개의 걸음이 무엇을 셌는가. */
function perfDerive(): string {
  const steps = walkSteps();
  const copies = T.cells.filter((c) => c.branch === "copy").length;
  const ors = T.cells.length - copies;
  const first = steps[1]?.id ?? "";
  const lastSeg = steps.at(-2)?.id ?? "";
  return [
    `${pad(steps[0]?.id ?? "", 9)}  DP 테이블 ${T.rows.length} × ${T.rows[0]?.length} 칸을 거짓으로 깔고 dp[0][0] 하나를 참으로`,
    `${pad(`${first}~${lastSeg}`, 9)}  칸 ${T.cells.length} 개를 줄마다 갈래 토막으로 — ② ${copies} 칸 · ③ ${ors} 칸`,
    `${pad(steps.at(-1)?.id ?? "", 9)}  dp[${NUMS.length}][${TARGET}] 한 칸을 읽는다`,
    `${" ".repeat(11)}└ 칸마다 비교 1 번, ③ 이면 「또는」이 1 번 더`,
  ].join("\n");
}

/** `perf.derive` — 줄을 하나로 줄이면 `t` 를 어느 방향으로 채워야 하는가. */
function oneRowDirection(): string {
  const cases: [number[], number][] = [
    [NUMS, 9],
    [NUMS, 30],
    [[3], 9],
    [[3, 4], 8],
    [[1, 2, 3, 4], 10],
  ];
  return table(
    ["입력", "정본", "한 줄 · t 내림차순", "한 줄 · t 오름차순"],
    cases.map(([nums, target]) => [
      label(nums, target),
      yn(subsetSum(nums, target)),
      yn(oneRowDescending(nums, target)),
      yn(oneRowAscending(nums, target)[target] as boolean),
    ]),
  );
}

/** `perf.bounds` — 목표 합을 적는 글자 수와 열 수. */
function pseudoPoly(): string {
  const small = BigInt(T_MAX);
  const large = 10n ** 14n;
  const ds = String(small).length;
  const dl = String(large).length;
  const ratio = Number(large + 1n) / Number(small + 1n);
  const line = (v: bigint, d: number) =>
    `  목표 합 ${pad(`${v}${을를(v)}`, 17)} 적는 데 글자 ${pad(String(d), 2)} 개  →  열 ${comma(v + 1n)} 개`;
  return [
    "nT 의 T 는 입력의 「크기」가 아니라 「값」이다",
    "",
    line(small, ds),
    line(large, dl),
    `  글자 수는 ${dl / ds} 배인데 열은 약 10^${Math.round(Math.log10(ratio))} 배다`,
  ].join("\n");
}

/** `perf.worst` — 조기 종료를 붙이면 입력이 비용을 가른다. */
function earlyExit(): string {
  const target = T_MAX;
  const 입력: [string, number[]][] = [
    [`원소 ${comma(N_MAX)} 개가 전부 ${comma(A_MAX)}`, repeat(A_MAX, N_MAX)],
    [`원소 ${comma(N_MAX)} 개가 전부 20`, repeat(20, N_MAX)],
    [
      `원소 ${comma(N_MAX)} 개가 (i mod 100) + 1`,
      Array.from({ length: N_MAX }, (_, i) => (i % 100) + 1),
    ],
    [`원소 ${comma(N_MAX)} 개가 전부 1`, repeat(1, N_MAX)],
    [`원소 ${comma(N_MAX)} 개가 전부 21`, repeat(21, N_MAX)],
  ];
  return table(
    [
      `입력 (target = ${comma(target)})`,
      "답",
      "원소 총합",
      "정본이 정한 칸",
      "조기 종료판이 정한 칸",
    ],
    입력.map(([이름, nums]) => [
      이름,
      yn(subsetSum(nums, target)),
      comma(nums.reduce((x, y) => x + y, 0)),
      comma(decidedCells(nums, target, false)),
      comma(decidedCells(nums, target, true)),
    ]),
  );
}

/** `perf.worst` — 원소가 전부 21 이면 목표 칸이 끝까지 거짓인 까닭. */
function worst21(): string {
  const a = 21;
  const target = T_MAX;
  const lo = Math.floor(target / a);
  return [
    `원소가 전부 ${a} 이면 만들 수 있는 합은 ${a} 의 배수뿐이다`,
    `  ${a} × ${lo} = ${comma(a * lo)}    ${a} × ${lo + 1} = ${comma(a * (lo + 1))}`,
    `  ${comma(target)}${은는(target)} 그 사이라 ${a} 의 배수가 아니다  →  dp[i][${comma(target)}]${이가(target)} 끝까지 ${yn(subsetSum(repeat(a, N_MAX), target))}`,
  ].join("\n");
}

/* ────────────────────────── 파트 2 — 스스로 점검하기 ────────────────────────── */

/** 이 칸이 들어 있는 걸음 번호. */
function stepOf(i: number, t: number): string {
  const segs = segments(T);
  const k = segs.findIndex((s) => s.cells.some((c) => c.i === i && c.t === t));
  return walkSteps()[k + 1]?.id ?? "";
}

/** 스스로 점검하기 — 물음의 자리. */
function selfcheckQ(): string {
  const i = 5;
  const a = NUMS[i - 1] as number;
  const id = stepOf(i, TARGET);
  const up = `dp[${i - 1}][${TARGET}]`;
  const left = `dp[${i - 1}][${TARGET - a}]`;
  const head = `${id} :  dp[${i}][${TARGET}] = ${up} 또는 ${left}`;
  const values = `      ${up} = ${yn(dpv(i - 1, TARGET))} · ${left} = ${yn(dpv(i - 1, TARGET - a))}`;
  return [
    head,
    values,
    `      dp[${i - 1}][${TARGET - a}]${이가(TARGET - a)} 뜻하는 부분집합 = ?`,
  ].join("\n");
}

/** 스스로 점검하기 답 — 이웃 칸의 부분집합과 dp[5][9] 의 부분집합을 짝짓는다. */
function selfcheckA(): string {
  const i = 5;
  const a = NUMS[i - 1] as number;
  const before = NUMS.slice(0, i - 1);
  const left = hitting(before, TARGET - a);
  const up = hitting(before, TARGET);
  if (left.length > 0 !== dpv(i - 1, TARGET - a)) {
    throw new Error("직접 모은 부분집합이 dp[4][4] 와 다르다");
  }
  return [
    `dp[${i - 1}][${TARGET - a}] 의 부분집합 ${left.length} 개 — ${a}${을를(a)} 더하면`,
    ...left.map(
      (s) =>
        `  ${pad(valuesOf(before, s), 10)}→  ${setText([...s.map((k) => before[k] as number), a])}   합 ${TARGET}`,
    ),
    `dp[${i - 1}][${TARGET}] 의 부분집합 ${up.length} 개 — ${a}${을를(a)} 안 쓴 것`,
    ...(up.length === 0
      ? ["  없다"]
      : up.map((s) => `  ${valuesOf(before, s)}`)),
    `  └ 둘 중 하나라도 있으니 dp[${i}][${TARGET}] = ${yn(dpv(i, TARGET))}`,
  ].join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  "concept-scale": conceptScale,
  "concept-cost": conceptCost,
  "subset-count": subsetCount,
  "subset-time": subsetTime,
  "same-sum": sameSum,
  "merge-same-sum": mergeSameSum,
  "one-row-only": oneRowOnly,
  "one-row-trace": oneRowTrace,
  "build-size": buildSize,
  "build-read-one": buildReadOne,
  "build-split": buildSplit,
  "build-fill-row": buildFillRow,
  "build-answer": buildAnswer,
  "state-candidates": stateCandidates,
  "walk-input": walkInput,
  "walk-init": walkInit,
  "walk-order": walkOrder,
  "walk-branch-read": walkBranchRead,
  "negative-trace": negativeTrace,
  "negative-element": negativeElement,
  "negative-cost": negativeCost,
  "walk-trace": walkTrace,
  "exact-vs-at-most": exactVsAtMost,
  "final-run": finalRun,
  "related-sets": relatedSets,
  "satoshi-columns": satoshiColumns,
  "alt-walk-input": altWalkInput,
  "alt-inputs": altInputs,
  "alt-counts": altCounts,
  "alt-boundary": altBoundary,
  "math-check": mathCheck,
  "math-code": mathCode,
  "math-istar": mathIStar,
  saturation,
  crossover,
  "invariant-cells": invariantCells,
  "invariant-edges": invariantEdges,
  "mutant-same-row": mutantSameRow,
  "mutant-three": mutantThree,
  "perf-derive": perfDerive,
  "one-row-direction": oneRowDirection,
  "pseudo-poly": pseudoPoly,
  "early-exit": earlyExit,
  "worst-21": worst21,
  "selfcheck-q": selfcheckQ,
  "selfcheck-a": selfcheckA,
};
