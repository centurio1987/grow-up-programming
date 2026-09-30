/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 * 비용은 원고 전체가 **기본 연산** 하나로 센다 — 산술 연산 하나 · 자료 읽기나 쓰기 하나 · 비교 하나를
 * 각각 1 로 센다. 그 잣대는 대안 비교 사이드카(`-guide.alt.ts`)의 것이고, 여기서는 그 파일의
 * `countHull` · `countScan` 을 부른다(둘 다 답과 아래 껍질을 정본과 대조한다).
 *
 * 전개의 걸음 기록(`walkSteps`)은 정본과 같은 절차를 걸음마다 적은 사본이다. 직선 하나를 넣을 때마다
 * 사본의 아래 껍질이 정본의 `hull` 과 같은지, 질의마다 사본의 답이 정본의 `query` 와 같은지 스스로
 * 확인한다. 그림 사이드카(`-guide.fig.tsx`)도 이 기록을 받아 그린다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/convexHullTrick/convexHullTrick-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  countHull,
  countScan,
  flipExponent,
} from "./convexHullTrick-guide.alt.ts";
import {
  ConvexHullTrick,
  evalAt,
  isCovered,
  type Line,
} from "./convexHullTrick-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** `1961241` → `1,961,241`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const num = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const align = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(align), ...rows.map(line)].join("\n");
}

/** 직선 이름 — 본문 표기 `(m, b)`. */
export const ln = (l: Line | readonly [number, number]): string =>
  Array.isArray(l)
    ? `(${l[0]}, ${l[1]})`
    : `(${(l as Line).m}, ${(l as Line).b})`;

/** 아래 껍질 한 벌을 본문 표기로 — 비면 「비었다」. */
export const hullText = (h: readonly Line[]): string =>
  h.length === 0 ? "비었다" : h.map(ln).join(" ");

/** 음수는 괄호로 싼다 — `(0 − (-3))`. */
const par = (v: number): string => (v < 0 ? `(${v})` : String(v));

/** 식의 마지막 낱말 — 조사를 고를 때 쓴다. */
const last = (expr: string): string => expr.split(" ").at(-1) as string;

/** 교점 좌표 — 정수면 정수, 아니면 소수. */
const xs = (v: number): string =>
  Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);

/* ────────────────────────── 입력 ────────────────────────── */

/** 「전체 컨셉」과 「아이디어를 떠올리는 과정」·「아이디어 상세」가 쓰는 작은 입력. */
export const SMALL: [number, number][] = [
  [-2, 0],
  [-1, 5],
  [0, -1],
  [1, 2],
  [2, 8],
];
/** 작은 입력을 그리는 좌표 범위와, 최솟값을 적어 보는 자리. */
export const SMALL_X: [number, number] = [-8, 6];
export const SMALL_AT = [-8, -6, -4, -2, 0, 2, 4, 6];
/** 「전체 컨셉」이 아래 껍질을 자리 순서로 계산해 보는 자리. */
export const CONCEPT_X = -4;

/** 전개가 쓰는 직선 목록과 질의. */
export const WALK: [number, number][] = [
  [-2, 0],
  [-1, 5],
  [0, -1],
  [0, -3],
  [2, 0],
  [2, 7],
];
export const WALK_X = [0, -4, 4];

/** 한 번의 등록이 여러 개를 빼는 입력. */
export const CHAIN: [number, number][] = [
  [-3, 9],
  [-2, 4],
  [-1, 1],
  [0, 0],
  [1, 1],
  [2, -1000],
];

/** 준무작위 직선 — `m_i = i` · `b_i = (i × 48,271) mod 65,537`. */
export const quasi = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => [i, (i * 48_271) % 65_537]);

/** 모든 직선이 아래 껍질에 남는 입력 — 기울기 `m = i − ⌊n/2⌋`, 절편 `b = m²`. */
export const convex = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const m = i - Math.floor(n / 2);
    return [m, m * m];
  });

/** 아래 껍질이 둘로 줄어드는 입력 — 절편 `b = −m²`. */
const concave = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const m = i - Math.floor(n / 2);
    return [m, -(m * m)];
  });

/** 규모를 잴 때의 질의 — `x_j = j − ⌊q/2⌋`. */
export const queriesOf = (q: number): number[] =>
  Array.from({ length: q }, (_, j) => j - Math.floor(q / 2));

/** 과제 규모 — 직선 수 `n` 과 질의 수 `q` 의 상한. */
export const N_MAX = 100_000;
/** 단순 연산 1 초에 1 억 번 기준. */
export const PER_SEC = 100_000_000;
export const seconds = (ops: number): string =>
  `${(ops / PER_SEC).toFixed(ops / PER_SEC < 1 ? 2 : 0)} 초`;

/** 직선 목록을 등록한 정본. */
export const build = (lines: readonly [number, number][]): ConvexHullTrick => {
  const cht = new ConvexHullTrick();
  for (const [m, b] of lines) cht.addLine(m, b);
  return cht;
};

/** 등록한 직선을 전부 계산한 최솟값 — 대조군. */
export const brute = (lines: readonly [number, number][], x: number): number =>
  Math.min(...lines.map(([m, b]) => m * x + b));

/** `hull[k]` 와 `hull[k+1]` 이 만나는 자리 `X_k`. */
export const crossX = (a: Line, c: Line): number => (c.b - a.b) / (a.m - c.m);

/** 아래 껍질의 이웃 교점 전부. */
export const crossings = (h: readonly Line[]): number[] =>
  h.slice(0, -1).map((l, k) => crossX(l, h[k + 1] as Line));

/**
 * 아래 껍질의 꺾은 점 — 좌표 범위 `[x0, x1]` 양 끝과 그 안의 이웃 교점. `x` 오름차순. 교점의 값은
 * 두 직선 가운데 하나를 그 자리에서 계산한 것이고, 두 값이 같은지 스스로 확인한다.
 */
export function envelopePoints(
  h: readonly Line[],
  x0: number,
  x1: number,
): { x: number; y: number }[] {
  const cross = crossings(h);
  const inside = cross
    .map((x, k) => ({ x, k }))
    .filter((c) => c.x > x0 && c.x < x1)
    .sort((a, b) => a.x - b.x);
  const at = (x: number): number => Math.min(...h.map((l) => evalAt(l, x)));
  const pts = [{ x: x0, y: at(x0) }];
  for (const c of inside) {
    const a = evalAt(h[c.k] as Line, c.x);
    const b = evalAt(h[c.k + 1] as Line, c.x);
    if (a !== b) throw new Error(`교점 X_${c.k} 에서 두 직선의 값이 다르다`);
    pts.push({ x: c.x, y: a });
  }
  pts.push({ x: x1, y: at(x1) });
  return pts;
}

/** 담당 구간을 본문 표기로 — 양 끝은 부등식으로. */
export function coverText(h: readonly Line[], k: number): string {
  const cross = crossings(h);
  if (h.length === 1) return "모든 x";
  if (k === 0) return `x ≥ ${xs(cross[0] as number)}`;
  if (k === h.length - 1) return `x ≤ ${xs(cross[k - 1] as number)}`;
  return `${xs(cross[k] as number)} ≤ x ≤ ${xs(cross[k - 1] as number)}`;
}

/* ────────────────────────── 전개의 걸음 기록 ────────────────────────── */

/** 원문자 갈래 — 정본 주석의 번호와 같다. */
export type Branch = "①" | "②" | "③" | "④" | "⑤" | "⑥" | "⑦";

export interface WalkStep {
  readonly id: string;
  /** 등록하는 직선의 입력 자리 — 질의 걸음이면 `null`. */
  readonly line: number | null;
  /** 질의 자리 — 등록 걸음이면 `null`. */
  readonly x: number | null;
  readonly branch: Branch;
  /** 이 걸음이 읽은 아래 껍질 칸. */
  readonly read: readonly number[];
  /** 이 걸음이 새로 쓴 칸(넣은 자리). */
  readonly write: readonly number[];
  /** 걸음 **앞**의 아래 껍질 — 읽은 칸은 이 목록의 자리다. */
  readonly before: readonly Line[];
  /** 걸음 **뒤**의 아래 껍질. */
  readonly after: readonly Line[];
  /** 조건 판정 한 줄(예: `6 >= -5`)과 그 참 · 거짓. */
  readonly cond: string;
  readonly truth: boolean | null;
  /** 이진 탐색의 후보 — 걸음 앞 · 뒤. */
  readonly lo?: number;
  readonly hi?: number;
  readonly mid?: number;
  readonly nextLo?: number;
  readonly nextHi?: number;
  /** ⑦ 이 돌려준 답. */
  readonly answer?: number;
}

/**
 * 정본의 `addLine` · `query` 와 같은 절차를 걸음마다 적는다. 직선 하나를 넣을 때마다 사본의 아래 껍질이
 * 정본과 같은지, 질의마다 답이 정본과 같은지 확인한다 — 어긋나면 던진다.
 */
export function walkSteps(
  lines: readonly [number, number][] = WALK,
  queries: readonly number[] = WALK_X,
): WalkStep[] {
  const ref = new ConvexHullTrick();
  const hull: Line[] = [];
  const out: WalkStep[] = [];
  const snap = (): Line[] => hull.map((l) => ({ ...l }));
  const push = (s: Omit<WalkStep, "id">): void => {
    out.push({ id: `T${out.length + 1}`, ...s });
  };
  for (const [i, [m, b]] of lines.entries()) {
    const line: Line = { m, b };
    const top = hull[hull.length - 1];
    if (top !== undefined && top.m === m) {
      const before = snap();
      if (top.b <= b) {
        push({
          line: i,
          x: null,
          branch: "①",
          read: [hull.length - 1],
          write: [],
          before,
          after: before,
          cond: `${top.b} <= ${b}`,
          truth: true,
        });
        ref.addLine(m, b);
        continue;
      }
      hull.pop();
      push({
        line: i,
        x: null,
        branch: "②",
        read: [before.length - 1],
        write: [],
        before,
        after: snap(),
        cond: `${top.b} <= ${b}`,
        truth: false,
      });
    }
    for (;;) {
      if (hull.length < 2) break;
      const l1 = hull[hull.length - 2] as Line;
      const l2 = hull[hull.length - 1] as Line;
      const left = (line.b - l2.b) * (l1.m - l2.m);
      const right = (l2.b - l1.b) * (l2.m - line.m);
      const covered = isCovered(l1, l2, line);
      if (covered !== left >= right) throw new Error("판정식 재현이 어긋났다");
      if (!covered) {
        // 거짓이면 빼지 않고 곧바로 넣는다 — 판정과 넣기를 한 걸음에 적는다(④).
        const before = snap();
        hull.push(line);
        push({
          line: i,
          x: null,
          branch: "④",
          read: [before.length - 2, before.length - 1],
          write: [before.length],
          before,
          after: snap(),
          cond: `${left} >= ${right}`,
          truth: false,
        });
        break;
      }
      const before = snap();
      hull.pop();
      push({
        line: i,
        x: null,
        branch: "③",
        read: [before.length - 2, before.length - 1],
        write: [],
        before,
        after: snap(),
        cond: `${left} >= ${right}`,
        truth: true,
      });
    }
    const last = out.at(-1);
    const pushed = last !== undefined && last.line === i && last.branch === "④";
    if (!pushed) {
      const before = snap();
      hull.push(line);
      push({
        line: i,
        x: null,
        branch: "④",
        read: [],
        write: [before.length],
        before,
        after: snap(),
        cond: `hull.length >= 2`,
        truth: false,
      });
    }
    ref.addLine(m, b);
    if (hullText(hull) !== hullText(ref.hull)) {
      throw new Error(
        `${ln([m, b])} 을 넣은 뒤 사본의 아래 껍질이 정본과 다르다`,
      );
    }
  }
  for (const x of queries) {
    let lo = 0;
    let hi = hull.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const here = evalAt(hull[mid] as Line, x);
      const next = evalAt(hull[mid + 1] as Line, x);
      const go = here <= next;
      const nextLo = go ? lo : mid + 1;
      const nextHi = go ? mid : hi;
      push({
        line: null,
        x,
        branch: go ? "⑤" : "⑥",
        read: [mid, mid + 1],
        write: [],
        before: snap(),
        after: snap(),
        cond: `${here} <= ${next}`,
        truth: go,
        lo,
        hi,
        mid,
        nextLo,
        nextHi,
      });
      lo = nextLo;
      hi = nextHi;
    }
    const answer = evalAt(hull[lo] as Line, x);
    if (answer !== ref.query(x))
      throw new Error(`query(${x}) 가 정본과 다르다`);
    push({
      line: null,
      x,
      branch: "⑦",
      read: [lo],
      write: [],
      before: snap(),
      after: snap(),
      cond: `${lo} < ${hi}`,
      truth: false,
      lo,
      hi,
      answer,
    });
  }
  return out;
}

/** 직선 이름 뒤의 조사 — 읽는 소리의 끝은 절편 `b` 다(「(-1, 5) 를」). */
const lnJo = (l: Line | readonly [number, number]): string =>
  을를(Array.isArray(l) ? (l[1] as number) : (l as Line).b);

/** 걸음 하나를 한 줄 설명으로 — 표와 걸음 재생 패널이 같은 문장을 쓴다. */
export function stepText(
  s: WalkStep,
  lines: readonly [number, number][] = WALK,
): string {
  const add = s.line === null ? null : (lines[s.line] as [number, number]);
  const top = s.before.at(-1) as Line;
  const tf = (t: boolean | null) => (t ? "참" : "거짓");
  switch (s.branch) {
    case "①":
      return `꼭대기 ${ln(top)}${과와(top.b)} 기울기가 같고 ${s.cond}${이가(last(s.cond))} 참이라 ① 새 직선 ${ln(add as [number, number])}${lnJo(add as [number, number])} 버립니다.`;
    case "②":
      return `꼭대기 ${ln(top)}${과와(top.b)} 기울기가 같고 ${s.cond}${이가(last(s.cond))} 거짓이라 ② 꼭대기를 뺍니다.`;
    case "③":
      return `isCovered 의 두 곱이 ${s.cond} 로 참이라 ③ 꼭대기 ${ln(top)}${lnJo(top)} 뺍니다. 새 꼭대기로 다시 판정합니다.`;
    case "④":
      return s.read.length > 0
        ? `isCovered 의 두 곱이 ${s.cond} 로 ${tf(s.truth)}이라 아무것도 빼지 않고 ④ ${ln(add as [number, number])}${lnJo(add as [number, number])} 뒤에 붙입니다.`
        : `아래 껍질이 ${s.before.length} 칸이라 판정 없이 ④ ${ln(add as [number, number])}${lnJo(add as [number, number])} 뒤에 붙입니다.`;
    case "⑤":
      return `후보 [${s.lo},${s.hi}] 에서 mid = ${s.mid} 입니다. ${s.cond}${이가(last(s.cond))} 참이라 ⑤ hi = ${s.nextHi} 로 좁힙니다.`;
    case "⑥":
      return `후보 [${s.lo},${s.hi}] 에서 mid = ${s.mid} 입니다. ${s.cond}${이가(last(s.cond))} 거짓이라 ⑥ lo = ${s.nextLo} 로 좁힙니다.`;
    case "⑦":
      return `lo 와 hi 가 ${s.lo} 에서 만나 ⑦ hull[${s.lo}] 의 값 ${s.answer}${을를(String(s.answer))} 돌려줍니다.`;
  }
}

/** 걸음의 동작 이름 — `addLine(0, -3)` · `query(0)`. */
export const stepCall = (s: WalkStep): string =>
  s.line === null
    ? `query(${s.x})`
    : `addLine(${(WALK[s.line] as [number, number]).join(", ")})`;

/* ────────────────────────── 계측 ────────────────────────── */

/** 넣기와 빼기가 몇 번씩 일어나는가 — 정본을 한 번씩 부르며 길이 차이로 센다. */
export function pushPop(lines: readonly [number, number][]): {
  pushes: number;
  pops: number;
  worstOnce: number;
  size: number;
} {
  const cht = new ConvexHullTrick();
  let pushes = 0;
  let pops = 0;
  let worstOnce = 0;
  for (const [m, b] of lines) {
    const before = cht.hull.length;
    const same =
      before > 0 &&
      (cht.hull[before - 1] as Line).m === m &&
      (cht.hull[before - 1] as Line).b <= b;
    cht.addLine(m, b);
    const pushed = same ? 0 : 1;
    const dropped = before + pushed - cht.hull.length;
    pushes += pushed;
    pops += dropped;
    worstOnce = Math.max(worstOnce, dropped);
  }
  return { pushes, pops, worstOnce, size: cht.hull.length };
}

/**
 * 이진 탐색이 도는 반복 수 — 큰 입력에도 쓰는 가벼운 판이다. 걸음 기록(`walkSteps`)은 걸음마다 아래 껍질
 * 전체를 베끼므로 직선 10 만 개에서는 메모리가 모자란다. 여기서는 정본이 남긴 아래 껍질 위에서 반복만
 * 세고, 끝난 자리의 값이 정본의 답과 같은지 확인한다.
 */
export function roundsOf(
  lines: readonly [number, number][],
  x: number,
): number {
  const cht = build(lines);
  const h = cht.hull;
  let lo = 0;
  let hi = h.length - 1;
  let rounds = 0;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (evalAt(h[mid] as Line, x) <= evalAt(h[mid + 1] as Line, x)) hi = mid;
    else lo = mid + 1;
    rounds++;
  }
  if (evalAt(h[lo] as Line, x) !== cht.query(x)) {
    throw new Error(`반복을 센 판의 답이 정본과 다르다 — x=${x}`);
  }
  return rounds;
}

/** 점 (m, b) 들의 아래 사슬 — 방향 판정으로 끝 점을 걷어낸다(`convexHull` 편의 아래 사슬과 같은 규칙). */
export function lowerChain(
  points: readonly [number, number][],
): [number, number][] {
  const out: [number, number][] = [];
  for (const p of points) {
    while (out.length >= 2) {
      const a = out[out.length - 2] as [number, number];
      const c = out[out.length - 1] as [number, number];
      const turn =
        (c[0] - a[0]) * (p[1] - a[1]) - (c[1] - a[1]) * (p[0] - a[0]);
      if (turn > 0) break;
      out.pop();
    }
    out.push(p);
  }
  return out;
}

/** 아래 껍질 위 이진 탐색의 첫 비교 하나 — 변이 판이 남긴 아래 껍질에도 쓴다. */
function searchStep(
  h: readonly Line[],
  x: number,
): { mid: number; cond: string; truth: boolean; lo: number; hi: number } {
  const lo = 0;
  const hi = h.length - 1;
  const mid = Math.floor((lo + hi) / 2);
  const here = evalAt(h[mid] as Line, x);
  const next = evalAt(h[mid + 1] as Line, x);
  const truth = here <= next;
  return {
    mid,
    cond: `${here} <= ${next}`,
    truth,
    lo: truth ? lo : mid + 1,
    hi: truth ? mid : hi,
  };
}

/** 배정밀도 정수가 하나씩 셀 수 있는 경계. */
const EXACT_LIMIT = 2 ** 53;

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./convexHullTrick-guide.ref.ts", import.meta.url).pathname;

type Impl = {
  addLine(m: number, b: number): void;
  query(x: number): number;
  hull: Line[];
};
type RefModule = { ConvexHullTrick: new () => Impl };

/** 판정식의 부등호를 뒤집은 판. */
const 뒤집기 = await loadMutant<RefModule>(REF, {
  swap: [/\) >= \(/, ") <= ("],
});

/** 꼭대기를 한 번만 빼는 판 — 연쇄 제거를 끊는다. */
const 한번만 = await loadMutant<RefModule>(REF, {
  swap: [/while \(topCovered\(\)\)/, "if (topCovered())"],
});

/** 같은 기울기 처리를 건너뛰는 판. */
const 기울기처리없이 = await loadMutant<RefModule>(REF, {
  swap: [/top !== undefined && top\.m === m/, "false"],
});

/** 어떤 판이든 같은 방식으로 실행한다. */
function runWith(
  Ctor: new () => Impl,
  lines: readonly [number, number][],
  qs: readonly number[],
): { answers: number[]; size: number; hull: string } {
  const it = new Ctor();
  for (const [m, b] of lines) it.addLine(m, b);
  return {
    answers: qs.map((x) => it.query(x)),
    size: it.hull.length,
    hull: hullText(it.hull),
  };
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 「전체 컨셉」 — 작은 입력의 아래 껍질과 담당 구간. */
  "concept-hull": () => {
    const cht = build(SMALL);
    const h = cht.hull;
    const rows = SMALL.map(([m, b]) => {
      const k = h.findIndex((l) => l.m === m && l.b === b);
      return [
        ln([m, b]),
        k < 0 ? "없다 — 버린다" : `hull[${k}]`,
        k < 0 ? "빈 구간" : coverText(h, k),
      ];
    });
    const dropped = SMALL.length - h.length;
    return `${md(["직선", "아래 껍질의 자리", "담당 구간"], rows)}

직선 ${SMALL.length} 개 가운데 ${h.length} 개가 아래 껍질에 남고 ${dropped} 개는 어느 자리에서도 가장 낮지 않아 버립니다.`;
  },

  /** 「전체 컨셉」 — 한 자리에서 아래 껍질을 자리 순서로 계산하면 내려갔다 올라간다. */
  "concept-unimodal": () => {
    const h = build(SMALL).hull;
    const vals = h.map((l) => evalAt(l, CONCEPT_X));
    const low = vals.indexOf(Math.min(...vals));
    const rows = h.map((l, k) => [
      `hull[${k}]`,
      ln(l),
      num(vals[k] as number),
      k === low
        ? "가장 낮다"
        : k < low
          ? "다음 자리가 더 낮다"
          : "앞 자리가 더 낮다",
    ]);
    return `${md(["자리", "직선", `x = ${CONCEPT_X} 에서의 값`, "이웃과의 비교"], rows, [2])}

가장 낮은 값은 hull[${low}] 의 ${vals[low]} 이고, 직선 ${SMALL.length} 개를 전부 계산한 최솟값도 ${brute(SMALL, CONCEPT_X)} 입니다.`;
  },

  /** 「아이디어를 떠올리는 과정」 — 전부 계산하는 방법의 기본 연산. */
  "origin-naive": () => {
    const rows: string[][] = [];
    for (const n of [10, 100, 1_000, 3_000]) {
      const c = countScan(quasi(n), queriesOf(n));
      if (c.ops !== 5 * n * n + 2 * n) throw new Error("5n² + 2n 이 아니다");
      rows.push([num(n), num(c.ops), "센 값", seconds(c.ops)]);
    }
    const big = 5 * N_MAX * N_MAX + 2 * N_MAX;
    rows.push([num(N_MAX), num(big), "어림 — 5n² + 2n", seconds(big)]);
    return `${md(["n = q", "기본 연산", "출처", "시간(초당 1 억 번)"], rows, [0, 1, 3])}

위 네 줄은 실제로 센 값이고, 네 줄 모두 5n² + 2n 과 같습니다. 마지막 줄은 그 식에 n = ${num(N_MAX)} 을 넣어 늘린 어림입니다.`;
  },

  /** 작은 입력에서 자리마다 어느 직선이 가장 낮은가. */
  "origin-who": () => {
    const head = ["직선", ...SMALL_AT.map((x) => `x = ${x}`)];
    const rows = SMALL.map(([m, b]) => [
      ln([m, b]),
      ...SMALL_AT.map((x) => num(m * x + b)),
    ]);
    const mins = SMALL_AT.map((x) => brute(SMALL, x));
    rows.push(["최솟값", ...mins.map((v) => num(v))]);
    rows.push([
      "가장 낮은 직선의 기울기",
      ...SMALL_AT.map((x, i) =>
        SMALL.filter(([m, b]) => m * x + b === mins[i])
          .map(([m]) => String(m))
          .join(" · "),
      ),
    ]);
    const never = SMALL.filter(
      ([m, b]) => !SMALL_AT.some((x, i) => m * x + b === mins[i]),
    );
    return `${md(
      head,
      rows,
      SMALL_AT.map((_, i) => i + 1),
    )}

여덟 자리 어디에서도 가장 낮지 않은 직선은 ${never.map(ln).join(" · ")} 하나입니다.`;
  },

  /** 담당 구간이 없는 직선을 버리면 질의 하나의 비용이 얼마로 주는가 — 준무작위 입력. */
  "origin-keep": () => {
    const rows: string[][] = [];
    for (const n of [16, 64, 256, 1_024, 4_096]) {
      const lines = quasi(n);
      const h = build(lines).hull;
      const x = [0];
      const all = countScan(lines, x).ops;
      const kept = countScan(
        h.map((l) => [l.m, l.b] as [number, number]),
        x,
      ).ops;
      rows.push([num(n), num(h.length), num(all), num(kept)]);
    }
    return md(
      [
        "직선 수 n",
        "아래 껍질 크기 s",
        "전부 계산하는 질의 하나",
        "아래 껍질만 계산하는 질의 하나",
      ],
      rows,
      [0, 1, 2, 3],
    );
  },

  /** 「절편이 가장 작은 직선 하나만 남긴다」를 값으로 반박한다. */
  "origin-intercept": () => {
    const best = SMALL.reduce((acc, l) => (l[1] < acc[1] ? l : acc));
    const rows = [-8, -4, 0, 4, 6].map((x) => {
      const only = best[0] * x + best[1];
      const real = brute(SMALL, x);
      return [
        `x = ${x}`,
        num(only),
        num(real),
        only === real ? "같다" : `${num(only - real)} 만큼 크다`,
      ];
    });
    return md(
      ["자리", `${ln(best)} 하나의 값`, "실제 최솟값", "차이"],
      rows,
      [1, 2],
    );
  },

  /** 모든 직선이 아래 껍질에 남는 입력에서는 버리기만으로 안 준다. */
  "origin-convex": () => {
    const rows: string[][] = [];
    for (const n of [16, 64, 256, 1_024, 4_096]) {
      const lines = convex(n);
      const c = countHull(lines, [0]);
      const kept = countScan(
        c.hull.map((l) => [l.m, l.b] as [number, number]),
        [0],
      ).ops;
      rows.push([num(n), num(c.hull.length), num(kept), num(c.queryOps)]);
    }
    return md(
      [
        "직선 수 n",
        "아래 껍질 크기 s",
        "아래 껍질만 계산하는 질의 하나",
        "아래 껍질을 이진 탐색하는 질의 하나",
      ],
      rows,
      [0, 1, 2, 3],
    );
  },

  /** 과제 규모에서 세 방법 — 시도 사다리와 같은 값. */
  "origin-scale": () => {
    const naive = 5 * N_MAX * N_MAX + 2 * N_MAX;
    const qs = queriesOf(N_MAX);
    const c = countHull(convex(N_MAX), qs);
    const kept = 5 * N_MAX * N_MAX + 2 * N_MAX;
    const total = c.addOps + c.queryOps;
    return `${md(
      ["방법", "기본 연산", "출처", "시간(초당 1 억 번)"],
      [
        ["전부 계산", num(naive), "어림 — 5n² + 2n", seconds(naive)],
        [
          "아래 껍질만 전부 계산 (b = m², s = n)",
          num(kept),
          "어림 — 5s·q + 2q",
          seconds(kept),
        ],
        [
          "아래 껍질 이진 탐색 (b = m²)",
          num(total),
          `센 값 — 등록 ${num(c.addOps)} · 질의 ${num(c.queryOps)}`,
          seconds(total),
        ],
      ],
      [1, 3],
    )}

직선과 질의가 ${num(N_MAX)} 개씩이고, 질의 자리는 x = j − ${num(N_MAX / 2)} (j = 0 … ${num(N_MAX - 1)}) 입니다.`;
  },

  /** 「먼저 알아 둘 개념」 — 아래 껍질의 직선 하나를 읽는 법. */
  "build-read": () => {
    const h = build(SMALL).hull;
    const cross = crossings(h);
    const rows = h.map((l, k) => {
      const lo = k === h.length - 1 ? SMALL_X[0] : (cross[k] as number);
      const hi = k === 0 ? SMALL_X[1] : (cross[k - 1] as number);
      const x = Math.round((lo + hi) / 2);
      return [
        `hull[${k}]`,
        ln(l),
        coverText(h, k),
        `x = ${x}`,
        num(evalAt(l, x)),
        num(brute(SMALL, x)),
      ];
    });
    return `${md(
      [
        "자리",
        "직선",
        "담당 구간",
        "구간 안의 한 자리",
        "그 직선의 값",
        "전부 계산한 최솟값",
      ],
      rows,
      [4, 5],
    )}

${h.length} 줄 모두 담당 구간 안의 자리에서 그 직선의 값이 전부 계산한 최솟값과 같습니다.`;
  },

  /** 이웃 교점이 자리 순서로 작아진다. */
  "build-cross": () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["작은 입력", SMALL],
      ["전개 입력", WALK],
      ["b = m² · n = 8", convex(8)],
    ] as [string, [number, number][]][]) {
      const h = build(lines).hull;
      const c = crossings(h);
      const falling = c.every((v, k) => k === 0 || (c[k - 1] as number) > v);
      rows.push([
        name,
        num(h.length),
        h.map((l) => String(l.m)).join(" < "),
        c.map(xs).join(" > "),
        falling ? "작아진다" : "안 작아진다",
      ]);
    }
    return md(
      [
        "입력",
        "아래 껍질 크기",
        "자리 차례의 기울기",
        "자리 차례의 이웃 교점 X_k",
        "교점의 차례",
      ],
      rows,
      [1],
    );
  },

  /** 헷갈리기 쉬운 모양 — 자리마다 최솟값을 적어 둔 표와의 칸 수 비교. */
  "build-table": () => {
    const s = build(SMALL).hull.length;
    const rows = (
      [
        [SMALL_X[0], SMALL_X[1]],
        [-1_000, 1_000],
        [-1_000_000_000, 1_000_000_000],
      ] as [number, number][]
    ).map(([a, b]) => [`${num(a)} … ${num(b)}`, num(b - a + 1), num(s)]);
    return md(
      ["질의 자리 x 의 범위(정수)", "최솟값 표의 칸", "아래 껍질의 칸"],
      rows,
      [1, 2],
    );
  },

  /** 1단계 — 기울기가 같은 두 직선은 절편 차이가 자리와 무관하다. */
  "build-same-slope": () => {
    const pairs: [[number, number], [number, number]][] = [
      [
        [0, -1],
        [0, -3],
      ],
      [
        [2, 0],
        [2, 7],
      ],
    ];
    const at = [-4, 0, 4];
    const rows = pairs.map(([p, q]) => {
      const diffs = at.map((x) => q[0] * x + q[1] - (p[0] * x + p[1]));
      const cht = build([p, q]);
      return [
        `${ln(p)} 다음 ${ln(q)}`,
        diffs.map(num).join(" · "),
        hullText(cht.hull),
      ];
    });
    return md(
      [
        "꼭대기 다음 새 직선",
        `x = ${at.join(" · ")} 에서 새 직선 − 꼭대기`,
        "정본이 남긴 아래 껍질",
      ],
      rows,
    );
  },

  /** 2단계 — 판정식의 두 곱과 두 교점. */
  "build-covered": () => {
    const cases: [Line, Line, Line][] = [
      [
        { m: -2, b: 0 },
        { m: -1, b: 5 },
        { m: 0, b: -1 },
      ],
      [
        { m: -2, b: 0 },
        { m: 0, b: -3 },
        { m: 2, b: 0 },
      ],
      [
        { m: -1, b: 0 },
        { m: 0, b: 0 },
        { m: 1, b: 0 },
      ],
    ];
    const rows = cases.map(([a, c, e]) => {
      const left = (e.b - c.b) * (a.m - c.m);
      const right = (c.b - a.b) * (c.m - e.m);
      return [
        `${ln(a)} · ${ln(c)} · ${ln(e)}`,
        xs(crossX(c, e)),
        xs(crossX(a, c)),
        num(left),
        num(right),
        isCovered(a, c, e) ? "참 — 가운데를 뺀다" : "거짓 — 둔다",
      ];
    });
    return md(
      [
        "l1 · l2 · l3",
        "l2 와 l3 의 교점",
        "l1 과 l2 의 교점",
        "왼쪽 곱",
        "오른쪽 곱",
        "isCovered",
      ],
      rows,
      [1, 2, 3, 4],
    );
  },

  /** 3단계 — 한 번의 등록이 여럿을 빼는 자리를 걸음마다. */
  "build-pop": () => {
    const steps = walkSteps(CHAIN, []);
    const last = CHAIN.length - 1;
    const rows = steps
      .filter((s) => s.line === last)
      .map((s) => [
        hullText(s.before),
        s.read.length === 2
          ? `${ln(s.before[s.read[0] as number] as Line)} · ${ln(s.before[s.read[1] as number] as Line)}`
          : "—",
        s.read.length === 2
          ? `${s.cond} → ${s.truth ? "참" : "거짓"}`
          : "길이 1",
        s.branch === "③" ? "꼭대기를 뺀다" : "새 직선을 붙인다",
        hullText(s.after),
      ]);
    const pops = steps.filter(
      (s) => s.line === last && s.branch === "③",
    ).length;
    return `${md(
      [
        "걸음 앞 아래 껍질",
        "아래 · 꼭대기",
        "판정",
        "하는 일",
        "걸음 뒤 아래 껍질",
      ],
      rows,
    )}

${ln(CHAIN[last] as [number, number])} 하나를 넣는 동안 꼭대기를 ${pops} 번 연달아 뺐고, 매번 새 꼭대기와 그 아래로 다시 판정했습니다.`;
  },

  /** 3단계 — 넣기와 빼기의 합이 2n 을 넘지 않는다. */
  "build-amort": () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["연쇄 입력", CHAIN],
      ["전개 입력", WALK],
      ["준무작위 n = 1,024", quasi(1_024)],
      ["b = m² · n = 1,024", convex(1_024)],
      ["b = −m² · n = 1,024", concave(1_024)],
    ] as [string, [number, number][]][]) {
      const p = pushPop(lines);
      rows.push([
        name,
        num(lines.length),
        num(p.pushes),
        num(p.pops),
        num(p.pushes + p.pops),
        num(2 * lines.length),
      ]);
    }
    return md(
      ["입력", "직선 수 n", "넣기", "빼기", "넣기 + 빼기", "2n"],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** 4단계 — 아래 껍질 위의 이진 탐색을 여러 자리에서. */
  "build-query": () => {
    const rows = [SMALL_X[0], -6, -4, 0.5, SMALL_X[1]].map((x) => {
      const steps = walkSteps(SMALL, [x]).filter((s) => s.x !== null);
      const path = steps
        .filter((s) => s.branch !== "⑦")
        .map(
          (s) =>
            `[${s.lo},${s.hi}] mid ${s.mid}: ${s.cond} ${s.truth ? "참" : "거짓"}`,
        )
        .join(" → ");
      const end = steps.at(-1) as WalkStep;
      return [
        `x = ${x}`,
        path,
        `hull[${end.lo}]`,
        num(end.answer as number),
        num(brute(SMALL, x)),
      ];
    });
    return md(
      ["자리", "후보와 판정", "만난 자리", "답", "전부 계산한 최솟값"],
      rows,
      [3, 4],
    );
  },

  /** 전제 — 기울기 순서가 깨지면 답이 틀린다. */
  "build-premise": () => {
    // 기울기가 순서대로 들어오지 않는 직선 셋 가운데 답이 틀리는 첫 입력을 찾는다(작은 수부터 차례로).
    const R = [-2, -1, 0, 1, 2];
    const at = [-4, -2, 0, 2, 4];
    for (const m1 of R)
      for (const m2 of R)
        for (const m3 of R) {
          if (m1 <= m2 && m2 <= m3) continue;
          if (m1 === m2 || m2 === m3 || m1 === m3) continue;
          for (const b1 of R)
            for (const b2 of R)
              for (const b3 of R) {
                const lines: [number, number][] = [
                  [m1, b1],
                  [m2, b2],
                  [m3, b3],
                ];
                const cht = build(lines);
                const bad = at.filter((x) => cht.query(x) !== brute(lines, x));
                if (bad.length === 0) continue;
                const rows = at.map((x) => [
                  `x = ${x}`,
                  num(cht.query(x)),
                  num(brute(lines, x)),
                  cht.query(x) === brute(lines, x) ? "같다" : "다르다",
                ]);
                return `등록 순서 ${lines.map(ln).join(" · ")} — 기울기가 ${lines.map(([m]) => m).join(" · ")} 순서로 들어온다

${md(["자리", "정본의 답", "전부 계산한 최솟값", "판정"], rows, [1, 2])}

정본이 남긴 아래 껍질은 ${hullText(cht.hull)} 이고, 다섯 자리 가운데 ${bad.length} 자리에서 답이 틀립니다.`;
              }
        }
    throw new Error("틀리는 입력을 못 찾았다");
  },

  /** 설계 선택 — 아래 껍질을 전부 계산하는 것과 이진 탐색의 질의 하나 비용. */
  "build-choice": () => {
    const rows: string[][] = [];
    const scanWins: number[] = [];
    for (const s of [1, 2, 4, 8, 16, 64, 256, 1_024]) {
      const lines = convex(s);
      const c = countHull(lines, [0]);
      const scan = countScan(
        c.hull.map((l) => [l.m, l.b] as [number, number]),
        [0],
      ).ops;
      if (scan < c.queryOps) scanWins.push(s);
      rows.push([
        num(s),
        num(roundsOf(lines, 0)),
        num(scan),
        num(c.queryOps),
        scan < c.queryOps
          ? "전부 계산"
          : scan > c.queryOps
            ? "이진 탐색"
            : "같다",
      ]);
    }
    return `${md(
      [
        "아래 껍질 크기 s",
        "이진 탐색 반복",
        "전부 계산",
        "이진 탐색",
        "적은 쪽",
      ],
      rows,
      [0, 1, 2, 3],
    )}

전부 계산이 적은 것은 아래 껍질이 ${scanWins.join(" · ")} 칸일 때뿐이고, ${Math.max(...scanWins) * 2} 칸부터는 이진 탐색이 적습니다. 두 열 모두 질의 x = 0 하나의 기본 연산입니다.`;
  },

  /** 전개 — 입력. */
  "walk-input": () => `const 등록 = [
${WALK.map(([m, b]) => `  [${m}, ${b}],`).join("\n")}
];
const 질의 = [${WALK_X.join(", ")}];
// 이 절이 끝나면 ${WALK_X.map((x) => build(WALK).query(x)).join(" · ")} 이 나와야 한다`,

  /** 전개 1 — 처음 둘. */
  "walk-first": () => {
    const s = walkSteps().slice(0, 2);
    return s
      .map((t) => `${t.id}  ${stepCall(t)}   아래 껍질 = ${hullText(t.after)}`)
      .join("\n");
  },

  /** 전개 2 — 판정이 참이라 뺀다. */
  "walk-pop": () => {
    const s = walkSteps();
    const t3 = s[2] as WalkStep;
    const t4 = s[3] as WalkStep;
    const [a, c] = [t3.before[0] as Line, t3.before[1] as Line];
    const e: Line = { m: WALK[2]?.[0] as number, b: WALK[2]?.[1] as number };
    return `isCovered(${ln(a)}, ${ln(c)}, ${ln(e)})

  왼쪽 곱   (b3 − b2)(m1 − m2) = (${e.b} − ${c.b})(${a.m} − (${c.m})) = ${(e.b - c.b) * (a.m - c.m)}
  오른쪽 곱 (b2 − b1)(m2 − m3) = (${c.b} − ${a.b})(${c.m} − ${e.m}) = ${(c.b - a.b) * (c.m - e.m)}
  ${t3.cond}${이가(last(t3.cond))} ${t3.truth ? "참" : "거짓"}

${t3.id} 뒤   아래 껍질 = ${hullText(t3.after)}
${t4.id} 뒤   아래 껍질 = ${hullText(t4.after)}`;
  },

  /** 짚고 가기 — 꼭대기를 한 번만 빼면. */
  "pause-chain": () => {
    const qs = [0, -2, 3, 10, -10];
    const good = runWith(ConvexHullTrick, CHAIN, qs);
    const bad = runWith(한번만.ConvexHullTrick, CHAIN, qs);
    const rows = qs.map((x, i) => [
      `query(${x})`,
      num(good.answers[i] as number),
      num(bad.answers[i] as number),
      good.answers[i] === bad.answers[i] ? "같다" : "다르다",
    ]);
    return md(
      ["연쇄 입력의 질의", "바른 코드", "한 번만 빼는 코드", "판정"],
      rows,
      [1, 2],
    );
  },

  /** 짚고 가기 — 두 판이 남긴 아래 껍질과 전개 입력의 답. */
  "pause-chain-hull": () => {
    const good = runWith(ConvexHullTrick, CHAIN, [3]);
    const bad = runWith(한번만.ConvexHullTrick, CHAIN, [3]);
    const wg = runWith(ConvexHullTrick, WALK, WALK_X);
    const wb = runWith(한번만.ConvexHullTrick, WALK, WALK_X);
    const vals = CHAIN.map(([m, b]) => num(m * 3 + b)).join(" · ");
    const it = new 한번만.ConvexHullTrick();
    for (const [m, b] of CHAIN) it.addLine(m, b);
    const at3 = it.hull.map((l) => evalAt(l, 3));
    const first = searchStep(it.hull, 3);
    return `${md(
      ["판", "연쇄 입력의 아래 껍질", "칸 수", "전개 입력의 답"],
      [
        ["바른 코드", good.hull, num(good.size), wg.answers.join(" · ")],
        ["한 번만 빼는 코드", bad.hull, num(bad.size), wb.answers.join(" · ")],
        ["x = 3 에서 여섯 직선의 값", vals, "—", "—"],
      ],
      [2],
    )}

한 번만 빼는 판의 아래 껍질을 x = 3 에서 자리 차례로 계산하면 ${at3.map(num).join(" · ")} 입니다. 이진 탐색의 첫 비교는 mid = ${first.mid} 에서 ${first.cond}${이가(last(first.cond))} ${first.truth ? "참" : "거짓"}이라 후보가 [${first.lo},${first.hi}] 로 줄고, 그 판의 답은 ${num(bad.answers[0] as number)} 입니다.`;
  },

  /** 전개 3 — 기울기가 같은 두 걸음. */
  "walk-same": () => {
    const s = walkSteps();
    const rows = s
      .filter((t) => t.branch === "①" || t.branch === "②" || t.id === "T6")
      .map((t) => [
        t.id,
        stepCall(t),
        t.branch === "④"
          ? `아래 껍질이 ${t.before.length} 칸 — 판정 없이 ④`
          : `꼭대기 ${ln(t.before.at(-1) as Line)} · \`${t.cond}\` ${t.truth ? "참" : "거짓"} → ${t.branch}`,
        hullText(t.after),
      ]);
    return md(["걸음", "동작", "판정", "걸음 뒤 아래 껍질"], rows);
  },

  /** 전개 4 — 판정이 거짓이라 그대로 붙인다. */
  "walk-keep": () => {
    const t7 = walkSteps()[6] as WalkStep;
    const a = t7.before[0] as Line;
    const c = t7.before[1] as Line;
    const e: Line = { m: WALK[4]?.[0] as number, b: WALK[4]?.[1] as number };
    return `isCovered(${ln(a)}, ${ln(c)}, ${ln(e)})

  왼쪽 곱   (${e.b} − (${c.b}))(${a.m} − ${c.m}) = ${(e.b - c.b) * (a.m - c.m)}
  오른쪽 곱 (${c.b} − ${a.b})(${c.m} − ${e.m}) = ${(c.b - a.b) * (c.m - e.m)}
  ${t7.cond}${이가(last(t7.cond))} ${t7.truth ? "참" : "거짓"}

${t7.id} 뒤   아래 껍질 = ${hullText(t7.after)}
        ${ln(c)} 의 담당 구간은 ${coverText(t7.after, 1)}`;
  },

  /** 짚고 가기 — 같은 기울기 처리를 빼면. */
  "pause-slope": () => {
    const qs: number[] = [];
    for (let x = -10; x <= 10; x++) qs.push(x);
    let cases = 0;
    let sameAnswer = 0;
    let bigger = 0;
    const R = [-3, -2, -1, 0, 1, 2, 3];
    for (const a of R)
      for (const b of R)
        for (const c of R)
          for (const d of R) {
            const lines: [number, number][] = [
              [0, a],
              [0, b],
              [1, c],
              [1, d],
            ];
            const good = runWith(ConvexHullTrick, lines, qs);
            const off = runWith(기울기처리없이.ConvexHullTrick, lines, qs);
            cases++;
            if (good.answers.join() === off.answers.join()) sameAnswer++;
            if (off.size > good.size) bigger++;
          }
    const wg = runWith(ConvexHullTrick, WALK, WALK_X);
    const wo = runWith(기울기처리없이.ConvexHullTrick, WALK, WALK_X);
    return `${md(
      ["판", "전개 입력의 답", "전개 입력의 아래 껍질"],
      [
        ["바른 코드", wg.answers.join(" · "), wg.hull],
        ["같은 기울기 처리 없이", wo.answers.join(" · "), wo.hull],
      ],
    )}

기울기가 0 · 0 · 1 · 1 이고 절편이 -3 … 3 인 직선 넷을 전부 만든 ${num(cases)} 벌에 질의 x = -10 … 10 을 두 판으로 실행했습니다. 답이 21 자리 모두 같은 벌이 ${num(sameAnswer)} 벌이고, 아래 껍질이 더 커진 벌이 ${num(bigger)} 벌입니다.`;
  },

  /** 전개 5 — 열여섯 걸음 전부. */
  "walk-trace": () => {
    const s = walkSteps();
    const rows = s.map((t) => [
      t.id,
      stepCall(t),
      t.branch,
      `\`${t.cond}\` ${t.truth ? "**참**" : "**거짓**"}`,
      t.x === null
        ? hullText(t.after)
        : t.branch === "⑦"
          ? `답 ${t.answer}`
          : `후보 [${t.nextLo},${t.nextHi}]`,
    ]);
    const seen = new Set(s.map((t) => t.branch));
    return `${md(["걸음", "동작", "갈래", "조건 판정", "걸음 뒤"], rows)}

갈래 ${[...seen].sort().join("")}${이가("⑦")} 모두 한 번 이상 나왔고, 답은 ${WALK_X.map((x) => build(WALK).query(x)).join(" · ")} 입니다.`;
  },

  /** 짚고 가기 — 배정밀도가 어긋나는 자리. */
  "pause-precision": () => {
    const exact = (m: number, x: number, b: number): bigint =>
      BigInt(m) * BigInt(x) + BigInt(b);
    const trials: [number, number, number][] = [
      [1, 1, 1],
      [999_999, 999_999, 1],
      [999_999_999, 999_999_999, 1],
      [123_456_789, 987_654_321, 10 ** 18],
      [10 ** 9, 10 ** 9, 10 ** 18],
    ];
    const rows = trials.map(([m, x, b]) => {
      const got = build([[m, b]]).query(x);
      const want = exact(m, x, b);
      return [
        `m = ${num(m)} · x = ${num(x)} · b = ${num(b)}`,
        num(BigInt(got)),
        num(want),
        num(BigInt(got) - want),
      ];
    });
    const prod = 4n * 10n ** 27n;
    return `${md(["직선 하나와 질의 하나", "정본이 낸 값", "정확한 값", "차이"], rows, [1, 2, 3])}

배정밀도 정수가 정확한 범위는 2^53 = ${num(EXACT_LIMIT)} 까지이고, 정본의 \`number\` 에서 2^53 + 1 은 2^53 과 ${EXACT_LIMIT + 1 === EXACT_LIMIT ? "같습니다" : "다릅니다"}. 값의 범위가 허용하는 판정식의 곱은 ${num(prod)} 까지 가서 2^53 의 ${num(prod / BigInt(EXACT_LIMIT))} 배입니다.`;
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "final-calls": () => {
    const rows: string[][] = [];
    const show = (
      name: string,
      lines: [number, number][],
      qs: number[],
    ): void => {
      const cht = build(lines);
      for (const x of qs) {
        if (cht.query(x) !== brute(lines, x)) throw new Error(`${name} x=${x}`);
      }
      rows.push([
        name,
        num(lines.length),
        num(cht.hull.length),
        qs.map((x) => `query(${x}) = ${num(cht.query(x))}`).join(" · "),
      ]);
    };
    show("전개 입력", WALK, WALK_X);
    show("작은 입력", SMALL, [-8, 0, 6]);
    show("연쇄 입력", CHAIN, [0, 3, 10]);
    show("직선 하나 (3, 7)", [[3, 7]], [0, 10, -5]);
    show(
      "평행선만 (2, 10) · (2, 5)",
      [
        [2, 10],
        [2, 5],
      ],
      [0, 100],
    );
    show("b = m² · n = 64", convex(64), [-100, 0, 100]);
    show("준무작위 n = 1,024", quasi(1_024), [-1_000, 0, 1_000]);
    return md(["입력", "직선 수", "아래 껍질 크기", "질의와 답"], rows, [1, 2]);
  },

  /** 알아 두면 좋은 개념 — 살아남은 직선과 점들의 아래 사슬. */
  "related-dual": () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["작은 입력", SMALL],
      ["연쇄 입력", CHAIN],
      ["b = m² · n = 8", convex(8)],
      ["준무작위 n = 256", quasi(256)],
      ["준무작위 n = 1,024", quasi(1_024)],
    ] as [string, [number, number][]][]) {
      const kept = build(lines).hull.map((l) => [l.m, l.b] as [number, number]);
      const chain = lowerChain(lines);
      rows.push([
        name,
        num(lines.length),
        num(kept.length),
        num(chain.length),
        kept.map(String).join() === chain.map(String).join()
          ? "같다"
          : "다르다",
      ]);
    }
    const pts = quasi(12).map(
      ([m, b]) => [m - 6, (b % 11) - 5] as [number, number],
    );
    let triples = 0;
    let agree = 0;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        for (let k = j + 1; k < pts.length; k++) {
          const [a, c, e] = [pts[i], pts[j], pts[k]] as [number, number][];
          const [m1, b1] = a as [number, number];
          const [m2, b2] = c as [number, number];
          const [m3, b3] = e as [number, number];
          const turn = (m2 - m1) * (b3 - b1) - (b2 - b1) * (m3 - m1);
          triples++;
          if (
            isCovered({ m: m1, b: b1 }, { m: m2, b: b2 }, { m: m3, b: b3 }) ===
            -turn >= 0
          )
            agree++;
        }
    return `${md(
      [
        "입력",
        "직선 수",
        "아래 껍질의 직선",
        "점 (m, b) 의 아래 사슬",
        "두 목록",
      ],
      rows,
      [1, 2, 3],
    )}

기울기 차례로 놓인 세 점 묶음 ${num(triples)} 개에서 isCovered 의 참 · 거짓이 방향 판정의 부호를 뒤집은 값 ≥ 0 과 ${num(agree)} 개에서 같았습니다.`;
  },

  /** 경쟁 설계와 순서가 뒤집히는 좌표 범위. */
  "alt-flip": () => {
    const f = flipExponent();
    return md(
      [
        "좌표 범위 C",
        "볼록 껍질 트릭의 기본 연산",
        "리 차오 트리의 기본 연산",
        "적은 쪽",
      ],
      [
        [
          `2^${f.prevExp} = ${num(2 ** f.prevExp)}`,
          num(f.prevHull),
          num(f.prevLiChao),
          f.prevHull < f.prevLiChao ? "볼록 껍질 트릭" : "리 차오 트리",
        ],
        [
          `2^${f.exp} = ${num(2 ** f.exp)}`,
          num(f.hull),
          num(f.liChao),
          f.hull < f.liChao ? "볼록 껍질 트릭" : "리 차오 트리",
        ],
      ],
      [1, 2],
    );
  },

  /** 수식 절의 검산 — 정의를 전개의 아래 껍질에 넣는다. */
  "math-check": () => {
    const h = build(WALK).hull;
    const rows = h.slice(0, -1).map((a, k) => {
      const c = h[k + 1] as Line;
      const X = crossX(a, c);
      return [
        `X_${k}`,
        `(${c.b} − ${par(a.b)}) / (${a.m} − ${par(c.m)})`,
        xs(X),
        num(evalAt(a, X)),
        num(evalAt(c, X)),
      ];
    });
    return md(
      ["교점", "정의에 넣은 값", "X_k", "hull[k] 의 값", "hull[k+1] 의 값"],
      rows,
      [2, 3, 4],
    );
  },

  /** 수식 절의 계수 — 과제 규모에서. */
  "math-scale": () => {
    const qs = queriesOf(N_MAX);
    const c = countHull(convex(N_MAX), qs);
    const p = pushPop(convex(N_MAX));
    const r = roundsOf(convex(N_MAX), 0);
    const naive = 5 * N_MAX * N_MAX + 2 * N_MAX;
    const total = c.addOps + c.queryOps;
    return `${md(
      ["항목", "값"],
      [
        ["넣기 + 빼기", num(p.pushes + p.pops)],
        ["상한 2n", num(2 * N_MAX)],
        ["질의 하나의 반복", num(r)],
        ["⌈log₂ n⌉", num(Math.ceil(Math.log2(N_MAX)))],
        ["등록 전체의 기본 연산", num(c.addOps)],
        ["질의 전체의 기본 연산", num(c.queryOps)],
        ["합", num(total)],
        ["전부 계산의 어림 5n² + 2n", num(naive)],
      ],
      [1],
    )}

b = m² 로 직선 ${num(N_MAX)} 개를 넣고 질의 ${num(N_MAX)} 번을 답한 값입니다. 전부 계산하는 어림은 이 합의 ${num(Math.round(naive / total))} 배입니다.`;
  },

  /** 불변식 — 경계에 있는 입력들. */
  "invariant-edges": () => {
    const cases: [string, [number, number][], number][] = [
      ["직선 하나", [[3, 7]], 0],
      [
        "평행선만",
        [
          [2, 10],
          [2, 5],
        ],
        0,
      ],
      [
        "교점이 하나뿐",
        [
          [0, 5],
          [1, 10],
        ],
        -100,
      ],
      [
        "가운데 직선의 담당 구간이 비었다",
        [
          [0, -100],
          [1, 0],
          [2, 100],
        ],
        1_000,
      ],
      [
        "세 직선이 한 점에서 만난다",
        [
          [-1, 0],
          [0, 0],
          [1, 0],
        ],
        0,
      ],
      ["전개 입력", WALK, 0],
    ];
    const rows = cases.map(([name, lines, x]) => {
      const cht = build(lines);
      const c = crossings(cht.hull);
      return [
        `${name} ${lines.map(ln).join(" · ")}`,
        hullText(cht.hull),
        c.length === 0 ? "없다" : c.map(xs).join(" > "),
        `query(${x}) = ${num(cht.query(x))}`,
        num(brute(lines, x)),
      ];
    });
    return md(
      ["입력", "아래 껍질", "이웃 교점", "정본의 답", "전부 계산한 최솟값"],
      rows,
      [4],
    );
  },

  /** 불변식을 지키던 줄 하나를 바꾸면. */
  "invariant-mutant": () => {
    const qs = [0, -4, 4, -1, 1];
    const good = runWith(ConvexHullTrick, WALK, qs);
    const bad = runWith(뒤집기.ConvexHullTrick, WALK, qs);
    const rows = qs.map((x, i) => [
      `query(${x})`,
      num(good.answers[i] as number),
      num(bad.answers[i] as number),
      good.answers[i] === bad.answers[i] ? "같다" : "다르다",
    ]);
    return md(
      ["전개 입력의 질의", "바른 코드", "부등호를 뒤집은 코드", "판정"],
      rows,
      [1, 2],
    );
  },

  /** 두 판이 남긴 아래 껍질. */
  "invariant-mutant-hull": () => {
    const good = runWith(ConvexHullTrick, WALK, [0]);
    const bad = runWith(뒤집기.ConvexHullTrick, WALK, [0]);
    const at0 = (h: string) =>
      h
        .split(") (")
        .map((t) => t.replace(/[()]/g, "").split(", ").map(Number))
        .map(([m, b]) => num((m as number) * 0 + (b as number)))
        .join(" · ");
    const it = new 뒤집기.ConvexHullTrick();
    for (const [m, b] of WALK) it.addLine(m, b);
    const first = searchStep(it.hull, 0);
    return `${md(
      ["판", "아래 껍질", "x = 0 에서 자리 차례의 값", "답"],
      [
        [
          "바른 코드",
          good.hull,
          at0(good.hull),
          num(good.answers[0] as number),
        ],
        [
          "부등호를 뒤집은 코드",
          bad.hull,
          at0(bad.hull),
          num(bad.answers[0] as number),
        ],
      ],
      [3],
    )}

부등호를 뒤집은 판에서 이진 탐색의 첫 비교는 mid = ${first.mid} 에서 ${first.cond}${이가(last(first.cond))} ${first.truth ? "참" : "거짓"}이라 후보가 [${first.lo},${first.hi}] 로 줄어듭니다.`;
  },

  /** 비용을 세는 과정 — 전개 입력의 걸음과 기본 연산. */
  "perf-walk": () => {
    const s = walkSteps();
    const c = countHull(WALK, WALK_X);
    const count = (b: Branch[]) => s.filter((t) => b.includes(t.branch)).length;
    return md(
      ["무엇", "전개 입력에서"],
      [
        [
          "넣기 ④",
          `${count(["④"])} 번 — ${s
            .filter((t) => t.branch === "④")
            .map((t) => t.id)
            .join(" · ")}`,
        ],
        [
          "빼기 ② · ③",
          `${count(["②", "③"])} 번 — ${s
            .filter((t) => t.branch === "②" || t.branch === "③")
            .map((t) => t.id)
            .join(" · ")}`,
        ],
        [
          "새 직선을 버리기 ①",
          `${count(["①"])} 번 — ${s
            .filter((t) => t.branch === "①")
            .map((t) => t.id)
            .join(" · ")}`,
        ],
        [
          "이진 탐색 반복 ⑤ · ⑥",
          `${count(["⑤", "⑥"])} 번 — ${s
            .filter((t) => t.branch === "⑤" || t.branch === "⑥")
            .map((t) => t.id)
            .join(" · ")}`,
        ],
        [`등록 ${WALK.length} 번의 기본 연산`, num(c.addOps)],
        [`질의 ${WALK_X.length} 번의 기본 연산`, num(c.queryOps)],
      ],
    );
  },

  /** 비용을 세는 과정 — 입력별 넣기 · 빼기와 기본 연산. */
  "perf-count": () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["준무작위 n = 1,024", quasi(1_024)],
      ["b = m² · n = 1,024", convex(1_024)],
      ["b = m² · n = 100,000", convex(N_MAX)],
    ] as [string, [number, number][]][]) {
      const p = pushPop(lines);
      const c = countHull(lines, queriesOf(lines.length));
      rows.push([
        name,
        num(p.pushes + p.pops),
        num(p.size),
        num(roundsOf(lines, 0)),
        num(c.addOps),
        num(c.queryOps),
      ]);
    }
    return md(
      [
        "입력 (질의 수 q = n)",
        "넣기 + 빼기",
        "아래 껍질 크기 s",
        "질의 x = 0 의 반복",
        "등록 기본 연산",
        "질의 기본 연산",
      ],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** 최악을 만드는 입력. */
  "perf-worst": () => {
    const rows: string[][] = [];
    for (const [name, lines] of [
      ["b = m² · n = 100,000", convex(N_MAX)],
      ["준무작위 n = 100,000", quasi(N_MAX)],
      ["b = −m² · n = 100,000", concave(N_MAX)],
    ] as [string, [number, number][]][]) {
      const p = pushPop(lines);
      rows.push([
        name,
        num(p.size),
        num(p.worstOnce),
        num(p.pushes + p.pops),
        num(roundsOf(lines, 0)),
      ]);
    }
    const spike: string[][] = [];
    for (const n of [8, 1_024, N_MAX]) {
      const it = new ConvexHullTrick();
      const lines = convex(n);
      for (const [m, b] of lines.slice(0, -1)) it.addLine(m, b);
      const before = it.hull.length;
      it.addLine(n, -(10 ** 15));
      spike.push([
        num(n),
        num(before),
        num(it.hull.length),
        num(before + 1 - it.hull.length),
      ]);
    }
    return `${md(
      [
        "입력",
        "아래 껍질 크기 s",
        "한 번의 등록이 뺀 최대 개수",
        "넣기 + 빼기",
        "질의 x = 0 의 반복",
      ],
      rows,
      [1, 2, 3, 4],
    )}

b = m² 로 n − 1 개를 넣고 마지막에 y = n·x − 10^15 하나를 넣으면 이렇습니다.

${md(["n", "넣기 전 아래 껍질", "넣은 뒤 아래 껍질", "그 한 번이 뺀 개수"], spike, [0, 1, 2, 3])}`;
  },

  /** 스스로 점검하기 — 네 배마다 질의 하나의 기본 연산. */
  "check-growth": () => {
    const rows: string[][] = [];
    for (const s of [4, 16, 64, 256, 1_024]) {
      const c = countHull(convex(s), [0]);
      const r = roundsOf(convex(s), 0);
      if (c.queryOps !== 5 + 11 * r) throw new Error("5 + 11 × 반복이 아니다");
      rows.push([num(s), num(r), num(c.queryOps), num(5 + 11 * r)]);
    }
    return md(
      [
        "아래 껍질 크기 s",
        "이진 탐색 반복",
        "질의 하나의 기본 연산",
        "5 + 11 × 반복",
      ],
      rows,
      [0, 1, 2, 3],
    );
  },
};
