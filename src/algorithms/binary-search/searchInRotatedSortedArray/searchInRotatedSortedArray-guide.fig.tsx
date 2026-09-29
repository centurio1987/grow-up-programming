/**
 * `searchInRotatedSortedArray-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 반복 한 바퀴의 `lo`·`hi`·`mid` 는
 * 정본 소스에서 기계로 만든 계측 사본(`trace`)이 기록하고, 답은 정본이 낸다. 걸음 재생 패널의
 * 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `searchInRotatedSortedArray-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  CellStageFilm,
  type StageFrame,
} from "../../../_viz/patterns/CellStage";
import { RangeCover } from "../../../_viz/patterns/RangeCover";
import {
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { searchInRotatedSortedArray } from "./searchInRotatedSortedArray-guide.ref.ts";

const REF = new URL(
  "./searchInRotatedSortedArray-guide.ref.ts",
  import.meta.url,
).pathname;

/* ───────────────────────── 입력 ───────────────────────── */

/** 길이 `n` 오름차순 배열 `S` 의 앞 `k` 칸을 잘라 뒤에 이어 붙인다 — 이 글이 「k 칸 회전」이라 부르는 것. */
export function rotate(S: readonly number[], k: number): number[] {
  return [...S.slice(k), ...S.slice(0, k)];
}

/** 「전체 컨셉」·「아이디어를 떠올리는 과정」·「아이디어 상세」가 쓰는 작은 입력의 회전 전 배열. */
export const S7 = [0, 1, 2, 4, 5, 6, 7];
/** 작은 입력 — `S7` 을 3 칸 회전한 것. */
export const SMALL_K = 3;
export const SMALL = rotate(S7, SMALL_K);

/** 「수행으로 알아보는 알고리즘」이 끝까지 쓰는 입력 — `S = 0 1 … 20` 을 17 칸 회전한 것. */
export const S21 = Array.from({ length: 21 }, (_, i) => i);
export const WALK_K = 17;
export const WALK = rotate(S21, WALK_K);
/** 전개가 찾는 값 둘 — 있는 값 2 와 없는 값 21. */
export const HIT = 2;
export const MISS = 21;

/** 끊긴 자리 — `A[i] > A[i+1]` 인 `i` 전부. 회전된 정렬 배열이면 많아야 하나다. */
export function breaks(A: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < A.length; i++) {
    if ((A[i] as number) > (A[i + 1] as number)) out.push(i);
  }
  return out;
}

/** 구간 `[a, b]` 가 정렬돼 있는가 — 이웃 쌍을 전부 본다(판정 규칙과 따로 잰다). */
export function isSorted(A: readonly number[], a: number, b: number): boolean {
  for (let i = a; i < b; i++) {
    if ((A[i] as number) > (A[i + 1] as number)) return false;
  }
  return true;
}

const range = (lo: number, hi: number): number[] =>
  Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
const num = (x: number): string => x.toLocaleString("en-US");

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 갈래 번호 — 정본 주석의 ①~⑤ 와 같다. */
export type Branch = 1 | 2 | 3 | 4 | 5;
export const MARK: Record<Branch, string> = {
  1: "①",
  2: "②",
  3: "③",
  4: "④",
  5: "⑤",
};

/** 반복 한 바퀴 — 그 바퀴가 시작할 때의 후보 구간과, 정본이 그 바퀴에 한 일. */
export interface Round {
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly vMid: number;
  /** `A[lo]` — 읽은 칸이 답이면 읽지 않으므로 `undefined`. */
  readonly vLo?: number;
  /** `A[hi]` — 오른쪽 반쪽이 정렬된 바퀴에서만 읽는다. */
  readonly vHi?: number;
  /** 정렬된 반쪽 — 읽은 칸이 답이면 가리지 않는다. */
  readonly sorted?: "left" | "right";
  readonly branch: Branch;
  /** 이 바퀴가 읽은 배열 칸 수(1 · 2 · 3). */
  readonly reads: number;
  /** 이 바퀴가 끝난 뒤의 후보 구간. */
  readonly next: { readonly lo: number; readonly hi: number };
}

export interface Trace {
  readonly rounds: readonly Round[];
  readonly result: number;
  readonly end: { readonly lo: number; readonly hi: number };
}

/**
 * `mid` 를 정하는 한 줄 뒤에 기록을 끼운 사본. **정본 소스에서 기계로 만든다** — 그 줄에 정확히
 * 맞지 않으면 `loadMutant` 가 던진다. 바퀴의 상태를 손으로 다시 계산하면 「이 코드가 그렇게
 * 움직인다」가 검사되지 않는다.
 */
const probed = await loadMutant<{
  searchInRotatedSortedArray(A: number[], target: number): number;
}>(REF, {
  swap: [
    /^(\s*)const mid = lo \+ Math\.floor\(\(hi - lo\) \/ 2\);$/,
    "$1const mid = lo + Math.floor((hi - lo) / 2);\n$1(globalThis as any).__rounds.push({ lo, hi, mid });",
  ],
});

/** 기록된 `lo`·`hi`·`mid` 에서 그 바퀴가 간 갈래를 정본의 조건 그대로 읽는다. */
function roundOf(
  A: readonly number[],
  target: number,
  lo: number,
  hi: number,
  mid: number,
): Round {
  const vMid = A[mid] as number;
  if (vMid === target) {
    return { lo, hi, mid, vMid, branch: 1, reads: 1, next: { lo, hi } };
  }
  const vLo = A[lo] as number;
  if (vLo <= vMid) {
    const inside = vLo <= target && target < vMid;
    return {
      lo,
      hi,
      mid,
      vMid,
      vLo,
      sorted: "left",
      branch: inside ? 2 : 3,
      reads: 2,
      next: inside ? { lo, hi: mid - 1 } : { lo: mid + 1, hi },
    };
  }
  const vHi = A[hi] as number;
  const inside = vMid < target && target <= vHi;
  return {
    lo,
    hi,
    mid,
    vMid,
    vLo,
    vHi,
    sorted: "right",
    branch: inside ? 4 : 5,
    reads: 3,
    next: inside ? { lo: mid + 1, hi } : { lo, hi: mid - 1 },
  };
}

/** 정본 한 번 호출의 반복 기록. 답은 정본과 대조하고, 바퀴 사이의 구간 변화도 대조한다. */
export function trace(A: readonly number[], target: number): Trace {
  const g = globalThis as unknown as {
    __rounds: { lo: number; hi: number; mid: number }[];
  };
  g.__rounds = [];
  const result = probed.searchInRotatedSortedArray([...A], target);
  const want = searchInRotatedSortedArray([...A], target);
  if (result !== want) {
    throw new Error(
      `계측 사본이 정본과 다른 답을 냈다 — [${A.join(" ")}] target ${target}: ${result} ≠ ${want}`,
    );
  }
  const rounds = g.__rounds.map(({ lo, hi, mid }) =>
    roundOf(A, target, lo, hi, mid),
  );
  // 다음 바퀴가 기록한 구간이 앞 바퀴의 갱신 결과와 같아야 한다. 아니면 갈래를 잘못 읽은 것이다.
  for (let i = 1; i < rounds.length; i++) {
    const a = (rounds[i - 1] as Round).next;
    const b = rounds[i] as Round;
    if (a.lo !== b.lo || a.hi !== b.hi) {
      throw new Error(`바퀴 ${i} 의 구간이 앞 바퀴의 갱신과 다르다`);
    }
  }
  const last = rounds.at(-1);
  const end = last === undefined ? { lo: 0, hi: A.length - 1 } : last.next;
  if (result === -1 && end.lo <= end.hi) {
    throw new Error("-1 로 끝났는데 후보 구간이 비지 않았다");
  }
  if (result !== -1 && last?.branch !== 1) {
    throw new Error("답을 냈는데 마지막 바퀴가 ① 이 아니다");
  }
  return { rounds, result, end };
}

/** 한 번의 호출이 읽은 배열 칸 수. */
export const readsOf = (A: readonly number[], target: number): number =>
  trace(A, target).rounds.reduce((n, r) => n + r.reads, 0);

/** 정렬된 반쪽의 구간. */
export const sortedHalf = (r: Round): [number, number] =>
  r.sorted === "left" ? [r.lo, r.mid] : [r.mid, r.hi];

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

interface Step {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 끝난 뒤의 후보 구간. */
  readonly lo: number;
  readonly hi: number;
  readonly mid?: number;
  /** 이 걸음에 읽은 칸. */
  readonly read: readonly number[];
  /** 답을 찾은 칸. */
  readonly found?: number;
  /** 이 걸음이 가린 정렬된 반쪽. */
  readonly piece?: ArrayPiece;
}

const tf = (b: boolean): string => (b ? "참" : "거짓");
const sideName = (s: "left" | "right"): string =>
  s === "left" ? "왼쪽" : "오른쪽";

/** 정렬된 반쪽의 괄호 — 왼쪽 반쪽은 실선, 오른쪽 반쪽은 대시. 값을 아는 걸음이면 값 범위를 적는다. */
function pieceOf(r: Round, withValues: boolean): ArrayPiece {
  const [from, to] = sortedHalf(r);
  const low = r.sorted === "left" ? r.vLo : r.vMid;
  const high = r.sorted === "left" ? r.vMid : r.vHi;
  return {
    label: "정렬된 반쪽",
    from,
    to,
    tone: r.sorted === "left" ? "left" : "right",
    text:
      withValues && low !== undefined && high !== undefined
        ? `[${from},${to}] · 값 ${low}~${high}`
        : `[${from},${to}]`,
  };
}

/** 값 범위 판정 한 줄 — 정본의 조건식 그대로. */
function rangeVerdict(r: Round, target: number): string {
  if (r.sorted === "left") {
    const a = (r.vLo as number) <= target;
    const b = target < r.vMid;
    return `${r.vLo} <= ${target}${이가(target)} ${tf(a)}, ${target} < ${r.vMid}${이가(r.vMid)} ${tf(b)}`;
  }
  const a = r.vMid < target;
  const b = target <= (r.vHi as number);
  return `${r.vMid} < ${target}${이가(target)} ${tf(a)}, ${target} <= ${r.vHi}${이가(r.vHi as number)} ${tf(b)}`;
}

/** 갱신 한 줄 — `hi = 9` 꼴. */
const update = (r: Round): string =>
  r.branch === 2 || r.branch === 5 ? `hi = ${r.next.hi}` : `lo = ${r.next.lo}`;

/** 있는 값을 찾는 벌 — 초기화 한 걸음 + 바퀴마다 「반쪽 가리기」·「갈래」 두 걸음. */
function hitSteps(A: readonly number[], target: number, from: number): Step[] {
  const t = trace(A, target);
  const steps: Step[] = [];
  let n = from;
  const first = t.rounds[0] as Round;
  steps.push({
    id: `T${n++}`,
    title: `후보 [${first.lo},${first.hi}]`,
    detail: `후보 구간을 배열 전체로 잡습니다. lo = ${first.lo}, hi = ${first.hi}, 후보 ${first.hi - first.lo + 1} 칸입니다.`,
    lo: first.lo,
    hi: first.hi,
    read: [],
  });
  for (const r of t.rounds) {
    const enter = `${r.lo} <= ${r.hi}${이가(r.hi)} 참이라 반복에 들어갑니다. mid = ${r.lo} + ⌊${r.hi - r.lo}/2⌋ = ${r.mid} 입니다.`;
    if (r.branch === 1) {
      steps.push({
        id: `T${n++}`,
        title: `mid = ${r.mid}`,
        detail: `${enter} A[${r.mid}] = ${r.vMid}${을를(r.vMid)} 읽습니다.`,
        lo: r.lo,
        hi: r.hi,
        mid: r.mid,
        read: [r.mid],
      });
      steps.push({
        id: `T${n++}`,
        title: `A[${r.mid}] = ${r.vMid} ①`,
        detail: `${r.vMid} === ${target}${이가(target)} 참이라 ① ${r.mid}${을를(r.mid)} 돌려줍니다.`,
        lo: r.lo,
        hi: r.hi,
        mid: r.mid,
        read: [],
        found: r.mid,
      });
      continue;
    }
    const side = r.sorted as "left" | "right";
    const [a, b] = sortedHalf(r);
    steps.push({
      id: `T${n++}`,
      title: `mid = ${r.mid} · ${sideName(side)} 반쪽 정렬`,
      detail: `${enter} A[${r.mid}] = ${r.vMid}${은는(r.vMid)} ${target}${이가(target)} 아니라 ${r.lo === r.mid ? `A[lo] 를 읽는데, lo 도 ${r.lo} 라 같은 칸입니다.` : `A[${r.lo}] = ${r.vLo}${을를(r.vLo as number)} 함께 읽습니다.`} ${r.vLo} <= ${r.vMid}${이가(r.vMid)} ${tf(side === "left")}이라 ${sideName(side)} 반쪽 [${a},${b}]${이가(b)} 정렬돼 있습니다.`,
      lo: r.lo,
      hi: r.hi,
      mid: r.mid,
      read: [...new Set([r.mid, r.lo])].sort((x, y) => x - y),
      piece: pieceOf(r, side === "left"),
    });
    const low = side === "left" ? r.vLo : r.vMid;
    const high = side === "left" ? r.vMid : r.vHi;
    const span =
      side === "left" ? `${low} 이상 ${high} 미만` : `${low} 초과 ${high} 이하`;
    steps.push({
      id: `T${n++}`,
      title:
        side === "right"
          ? `A[${r.hi}] = ${r.vHi} · ${MARK[r.branch]} ${update(r)}`
          : `${MARK[r.branch]} ${update(r)}`,
      detail: `${side === "right" ? `A[${r.hi}] = ${r.vHi}${을를(r.vHi as number)} 읽습니다. ` : ""}정렬된 반쪽에서 target 이 있을 수 있는 값은 ${span}입니다. ${rangeVerdict(r, target)}이라 ${MARK[r.branch]} ${update(r)} 입니다.`,
      lo: r.next.lo,
      hi: r.next.hi,
      mid: r.mid,
      read: side === "right" ? [r.hi] : [],
      piece: pieceOf(r, true),
    });
  }
  return steps;
}

/** 없는 값을 찾는 벌 — 바퀴마다 한 걸음 + 반복이 끝나는 한 걸음. */
function missSteps(A: readonly number[], target: number, from: number): Step[] {
  const t = trace(A, target);
  const steps: Step[] = [];
  let n = from;
  for (const r of t.rounds) {
    const side = r.sorted as "left" | "right";
    const [a, b] = sortedHalf(r);
    const reads =
      side === "right"
        ? `A[${r.mid}] = ${r.vMid} · A[${r.lo}] = ${r.vLo} · A[${r.hi}] = ${r.vHi}`
        : r.lo === r.mid
          ? `A[${r.mid}] = ${r.vMid}`
          : `A[${r.mid}] = ${r.vMid} · A[${r.lo}] = ${r.vLo}`;
    const cells = side === "right" ? [r.lo, r.mid, r.hi] : [r.lo, r.mid];
    const lastRead = side === "right" ? r.vHi : r.lo === r.mid ? r.vMid : r.vLo;
    steps.push({
      id: `T${n++}`,
      title: `후보 [${r.lo},${r.hi}] · ${MARK[r.branch]} ${update(r)}`,
      detail: `mid = ${r.mid} 이고 ${reads}${을를(lastRead as number)} 읽습니다. ${r.vLo} <= ${r.vMid}${이가(r.vMid)} ${tf(side === "left")}이라 ${sideName(side)} 반쪽 [${a},${b}]${이가(b)} 정렬돼 있고, ${rangeVerdict(r, target)}이라 ${MARK[r.branch]} ${update(r)} 입니다. 후보가 ${Math.max(0, r.next.hi - r.next.lo + 1)} 칸 남습니다.`,
      lo: r.next.lo,
      hi: r.next.hi,
      mid: r.mid,
      read: [...new Set(cells)].sort((x, y) => x - y),
      piece: pieceOf(r, true),
    });
  }
  steps.push({
    id: `T${n++}`,
    title: `lo = ${t.end.lo} > hi = ${t.end.hi}`,
    detail: `lo <= hi 가 거짓이라 반복이 끝나고 ${t.result}${을를(t.result)} 돌려줍니다.`,
    lo: t.end.lo,
    hi: t.end.hi,
    read: [],
  });
  return steps;
}

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다.
 * 쥔 구간은 후보 구간이고(비면 `null`), 읽은 칸은 이번에 읽은 배열 칸, 새로 쓴 칸은 찾은 답이다.
 * 정렬된 반쪽은 조각(`pieces`) 괄호 하나로 단다.
 */
function arrayStep(s: Step, A: readonly number[]): ArrayStep {
  return {
    array: [...A],
    range: s.lo <= s.hi ? [s.lo, s.hi] : null,
    read: [...s.read],
    write: s.found !== undefined ? [s.found] : [],
    pointers:
      s.found !== undefined
        ? { mid: s.found }
        : s.mid === undefined
          ? { lo: s.lo, hi: s.hi }
          : { lo: s.lo, mid: s.mid, hi: s.hi },
    ...(s.piece ? { pieces: [s.piece] } : {}),
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "A",
  rangeLabel: "후보",
};

const film = (steps: Step[], A: readonly number[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(arrayStep(s, A), ARRAY_OPTIONS),
  }));

/** 본문이 인용하는 걸음 — 필름과 표가 같은 번호를 쓴다. */
export const walkSteps = () => {
  const hit = hitSteps(WALK, HIT, 1);
  return { hit, miss: missSteps(WALK, MISS, hit.length + 1) };
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `searchInRotatedSortedArray-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  const toStep = (s: Step) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...arrayStep(s, WALK),
  });
  const { hit, miss } = walkSteps();
  return { descent: hit.map(toStep), miss: miss.map(toStep) };
}

/** 전개의 `i` 번째 바퀴(0 부터)가 시작하는 걸음 번호 — 초기화 한 걸음 뒤로 바퀴마다 두 걸음이다. */
export const roundStartId = (i: number): string => {
  const id = walkSteps().hit[1 + 2 * i]?.id;
  if (id === undefined) throw new Error(`바퀴 ${i} 가 없다`);
  return id;
};

/* ───────────────── 「아이디어를 떠올리는 과정」 ───────────────── */

/** 과제 규모 — 길이 `N` 배열에 조회 `Q` 번. */
export const N = 1_000_000;
export const Q = 1_000;
/** 단순 연산 1 초에 1 억 번 기준. */
export const secondsOf = (ops: number): string =>
  `${(ops / 1e8).toFixed(2)} 초`;

/** 정렬만 믿고 `A[mid]` 와 `target` 만 비교하는 절차 — 이진 탐색 편의 정본과 같은 모양이다. */
export function plainSearch(A: readonly number[], target: number): number {
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

/** 선형 탐색이 읽는 칸 수. */
export function linearReads(A: readonly number[], target: number): number {
  let reads = 0;
  for (let k = 0; k < A.length; k++) {
    reads++;
    if (A[k] === target) return reads;
  }
  return reads;
}

/**
 * 길이 `N` 배열을 가운데에서 끊은 것(`N / 2` 칸 회전)에 배열 안팎의 값을 전부 넣어, 두 절차가 읽는
 * 칸의 최악을 센다. 정렬된 반쪽 가리기는 계측 사본을 그대로 부르고 답을 정의와 대조한다.
 */
export function scaleCounts(): { linear: number; ours: number } {
  const half = N / 2;
  const A = Array.from({ length: N }, (_, i) => (i + half) % N);
  const linear = linearReads(A, N);
  const g = globalThis as unknown as {
    __rounds: { lo: number; hi: number; mid: number }[];
  };
  let ours = 0;
  for (let t = -1; t <= N; t++) {
    g.__rounds = [];
    const got = probed.searchInRotatedSortedArray(A, t);
    const want = t >= 0 && t < N ? (t - half + N) % N : -1;
    if (got !== want) throw new Error(`N = ${N} 에서 ${t} 의 답이 ${got} 이다`);
    let reads = 0;
    for (const { lo, hi, mid } of g.__rounds) {
      reads += roundOf(A, t, lo, hi, mid).reads;
    }
    ours = Math.max(ours, reads);
  }
  return { linear, ours };
}

let scaleMemo: ReturnType<typeof scaleCounts> | undefined;
export const scale = (): ReturnType<typeof scaleCounts> => {
  scaleMemo ??= scaleCounts();
  return scaleMemo;
};

function approaches(): Approach[] {
  const s = scale();
  const wrong = SMALL.filter(
    (t) => plainSearch(SMALL, t) !== SMALL.indexOf(t),
  ).length;
  return [
    {
      name: "왼쪽부터 하나씩 확인하기",
      idea: "칸을 왼쪽부터 읽으며 target 과 같은지만 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 ${num(Q)} 번에 ${num(s.linear * Q)} 칸 · ${secondsOf(s.linear * Q)}`,
          ok: false,
        },
      ],
      lesson:
        "정렬된 배열이었다면 이진 탐색을 걸었을 것이다 — 그대로 걸면 어떨까",
    },
    {
      name: "이진 탐색을 그대로 걸기",
      idea: "가운데 칸만 읽고 target 과 크기를 비교해 한쪽을 뺀다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `[${SMALL.join(" ")}] 의 값 ${SMALL.length} 개 중 ${wrong} 개를 못 찾는다`,
          ok: false,
        },
      ],
      lesson:
        "끊긴 자리가 뺀 쪽에 숨는다 — 칸을 하나 더 읽어 끊긴 자리가 어느 쪽인지 알 수 있을까",
    },
    {
      name: "정렬된 반쪽 가리기",
      idea: "A[lo] 와 A[mid] 로 정렬된 반쪽을 가리고, 그 반쪽의 값 범위로 한쪽을 뺀다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `조회 하나에 최악 ${num(s.ours)} 칸 · ${num(Q)} 번에 ${num(s.ours * Q)} 칸`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 정렬된 반쪽 — 회전마다 ───────────────── */

/** `S7` 의 회전 하나를 후보 `[0, 6]` · `mid = 3` 으로 가른 결과. 판정 규칙과 실제 정렬을 함께 잰다. */
export interface HalfSplit {
  readonly k: number;
  readonly A: number[];
  readonly lo: number;
  readonly mid: number;
  readonly hi: number;
  readonly leftSorted: boolean;
  readonly rightSorted: boolean;
  /** 정본의 판정 `A[lo] <= A[mid]`. */
  readonly rule: boolean;
  readonly breakAt: number | undefined;
}

export function halfSplits(): HalfSplit[] {
  return S7.map((_, k) => {
    const A = rotate(S7, k);
    const lo = 0;
    const hi = A.length - 1;
    const mid = lo + Math.floor((hi - lo) / 2);
    // 정본 계측 사본이 첫 바퀴에 같은 mid 를 고르는지 — 배열에 없는 값으로 첫 바퀴를 연다.
    const first = trace(A, -1).rounds[0] as Round;
    if (first.mid !== mid || first.lo !== lo || first.hi !== hi) {
      throw new Error("첫 바퀴의 mid 가 가른 자리와 다르다");
    }
    const leftSorted = isSorted(A, lo, mid);
    const rightSorted = isSorted(A, mid, hi);
    const rule = (A[lo] as number) <= (A[mid] as number);
    if (rule && !leftSorted) throw new Error(`${k} 칸 회전 — 판정이 거짓이다`);
    if (!rule && !rightSorted)
      throw new Error(`${k} 칸 회전 — 판정이 거짓이다`);
    if (rule !== (first.sorted === "left")) {
      throw new Error(`${k} 칸 회전 — 정본의 판정과 다르다`);
    }
    return {
      k,
      A,
      lo,
      mid,
      hi,
      leftSorted,
      rightSorted,
      rule,
      breakAt: breaks(A)[0],
    };
  });
}

function splitFrames(): StageFrame[] {
  return halfSplits().map((h) => ({
    id: `${h.k} 칸`,
    text: `A[0] = ${h.A[0]} ≤ A[3] = ${h.A[3]} 이 ${tf(h.rule)} → ${h.rule ? "왼쪽" : "오른쪽"} 반쪽이 정렬돼 있다${h.leftSorted && h.rightSorted ? " (두 반쪽 다 정렬)" : ""}`,
    rows: [
      { kind: "index", label: "인덱스" },
      {
        kind: "cells",
        label: "A",
        values: h.A,
        side:
          h.breakAt === undefined
            ? "끊긴 자리 없음"
            : `끊긴 자리 ${h.breakAt}${과와(h.breakAt)} ${h.breakAt + 1} 사이`,
      },
      { kind: "caret", cells: [h.lo, h.mid], side: "A[lo] · A[mid]" },
      {
        kind: "bracket",
        label: "왼쪽",
        from: h.lo,
        to: h.mid,
        tone: "left",
        text: h.leftSorted ? "정렬" : "끊김",
      },
      {
        kind: "bracket",
        label: "오른쪽",
        from: h.mid,
        to: h.hi,
        tone: "right",
        text: h.rightSorted ? "정렬" : "끊김",
      },
    ],
  }));
}

/* ───────────────────────── 그림 ───────────────────────── */

export const FIGS: Record<string, () => ReactElement> = {
  "concept-break": () => {
    const [b] = breaks(SMALL);
    if (b === undefined || breaks(SMALL).length !== 1) {
      throw new Error("작은 입력의 끊긴 자리가 하나가 아니다");
    }
    return (
      <RangeCover
        title={`회전된 정렬 배열 [${SMALL.join(" ")}] — 끊긴 자리는 한 군데다`}
        row={{ label: "A 의 값", values: SMALL }}
        indexLabel="인덱스"
        ranges={[
          {
            from: 0,
            to: b,
            tone: "left",
            note: `오름차순 ${SMALL.slice(0, b + 1).join(" ")}`,
          },
          {
            from: b + 1,
            to: SMALL.length - 1,
            tone: "right",
            note: `오름차순 ${SMALL.slice(b + 1).join(" ")}`,
          },
        ]}
        annotation={{
          cells: [b, b + 1],
          text: `A[${b}] = ${SMALL[b]} > A[${b + 1}] = ${SMALL[b + 1]} — 앞 칸보다 작아지는 자리는 여기뿐이다`,
        }}
      />
    );
  },
  "concept-halves": () => {
    const r = trace(SMALL, 5).rounds[0] as Round;
    const [a, b] = sortedHalf(r);
    const other: [number, number] =
      r.sorted === "left" ? [r.mid, r.hi] : [r.lo, r.mid];
    return (
      <RangeCover
        title={`후보 [${r.lo},${r.hi}]${을를(r.hi)} mid = ${r.mid} 에서 가르면 — 한쪽은 정렬돼 있다`}
        row={{ label: "A 의 값", values: SMALL }}
        indexLabel="인덱스"
        ranges={[
          {
            from: r.lo,
            to: r.hi,
            tone: "query",
            note: `후보 [${r.lo},${r.hi}]`,
          },
          {
            from: a,
            to: b,
            tone: "left",
            note: `정렬된 반쪽 · 값 ${SMALL[a]}~${SMALL[b]}`,
          },
          {
            from: other[0],
            to: other[1],
            tone: "right",
            note: "끊긴 자리를 품은 반쪽",
          },
        ]}
        annotation={{
          cells: [r.mid],
          text: `mid = ${r.mid} — 두 반쪽이 함께 쓰는 칸`,
        }}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 셋 — 둘은 버렸고 하나가 남았다"
        constraint={`길이 ${num(N)} 배열에 조회 ${num(Q)} 번 · 1 초(단순 연산 1 초에 1 억 번 기준)`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "concept-rotations": () => (
    <CellStageFilm
      title={`[${S7.join(" ")}] 의 회전 일곱 벌을 mid = 3 에서 가르면`}
      columns={S7.length}
      frames={splitFrames()}
    />
  ),
  "walk-first-cut": () => {
    const r = trace(WALK, HIT).rounds[0] as Round;
    const [a, b] = sortedHalf(r);
    const low = r.sorted === "left" ? r.vLo : r.vMid;
    const high = r.sorted === "left" ? r.vMid : r.vHi;
    const states: Partial<Record<number, CellState>> = {};
    for (const i of range(0, WALK.length - 1)) {
      if (i < r.next.lo || i > r.next.hi) states[i] = "out";
    }
    return (
      <RangeCover
        title={`첫 바퀴 — 정렬된 반쪽 [${a},${b}] 의 값은 ${low}~${high}, ${HIT}${은는(HIT)} 그 밖이다`}
        row={{ label: "A 의 값", values: WALK, states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: r.next.lo,
            to: r.next.hi,
            tone: "query",
            note: `남은 후보 [${r.next.lo},${r.next.hi}]`,
          },
          {
            from: a,
            to: b,
            tone: r.sorted === "left" ? "left" : "right",
            note: `정렬된 반쪽 · 값 ${low}~${high} · 통째로 뺀다`,
          },
        ]}
        annotation={{
          cells: [r.lo, r.mid, r.hi],
          text: `A[${r.lo}] = ${r.vLo} · A[${r.mid}] = ${r.vMid} · A[${r.hi}] = ${r.vHi}${을를(r.vHi as number)} 읽었다 → ${MARK[r.branch]} ${update(r)}`,
        }}
      />
    );
  },
  "walk-descent": () => (
    <CellStageFilm
      title={`searchInRotatedSortedArray(A, ${HIT}) — T1~T${walkSteps().hit.length}`}
      columns={WALK.length}
      frames={film(walkSteps().hit, WALK)}
    />
  ),
  "walk-miss": () => {
    const { miss } = walkSteps();
    return (
      <CellStageFilm
        title={`searchInRotatedSortedArray(A, ${MISS}) — ${miss[0]?.id}~${miss.at(-1)?.id}`}
        columns={WALK.length}
        frames={film(miss, WALK)}
      />
    );
  },
  "invariant-range": () => {
    const r = trace(WALK, HIT).rounds[1] as Round;
    const [b] = breaks(WALK);
    if (b === undefined) throw new Error("전개 입력에 끊긴 자리가 없다");
    const states: Partial<Record<number, CellState>> = {};
    for (const i of range(0, WALK.length - 1)) {
      if (i < r.lo || i > r.hi) states[i] = "out";
    }
    const inside = r.lo <= b && b + 1 <= r.hi;
    return (
      <RangeCover
        title={`${roundStartId(1)} 가 시작할 때 — 후보 [${r.lo},${r.hi}] 도 회전된 정렬 배열이다`}
        row={{ label: "A 의 값", values: WALK, states }}
        indexLabel="인덱스"
        ranges={[
          {
            from: r.lo,
            to: r.hi,
            tone: "query",
            note: `후보 [${r.lo},${r.hi}] · 끊긴 자리 ${inside ? "하나" : "없음"}`,
          },
        ]}
        annotation={{
          cells: [b, b + 1],
          text: `A[${b}] = ${WALK[b]} > A[${b + 1}] = ${WALK[b + 1]} — 후보 안의 끊긴 자리는 이것 하나다`,
        }}
      />
    );
  },
};
