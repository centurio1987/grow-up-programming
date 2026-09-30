/**
 * `longestPalindrome-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 자리마다 적는 반지름은 정본 소스에서
 * 기계로 만든 계측 사본(`logged`)이 기록한다. 자리 하나 안의 일(이어받기 · 글자 비교 · 오른쪽 끝 옮기기)은
 * 같은 절차를 다시 쓴 `replay` 가 만들고, `trace` 가 자리마다 적은 반지름을 계측 기록과 대조한다. 걸음 재생
 * 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `longestPalindrome-guide.test.ts` 가 잰다.
 *
 * `replay` 는 계측이 없는 다시 쓰기라 변이를 중화한 실행(`check-proof` 가 두 번째로 부르는 실행)에서도
 * 값이 나온다. 중화 실행에서는 계측 사본이 정본 그대로라 기록이 비고 `trace` 가 던진다 — 그래서 판정
 * 줄(「같다」·「어긋난다」)이 있는 증명 블록은 `trace` 를 부르지 않는다.
 *
 * 비용은 원고 전체에서 **자료 접근** 하나로 센다 — 배열 칸을 읽거나 쓴 횟수와 문자열 글자를 읽은 횟수의
 * 합이다. 같은 갈래의 접미사 배열 · 카사이 LCP 편과 같은 기준이다. 칸을 잡으며 0 으로 채우는 일은 세지
 * 않는다. 계수기(`count*`)는 정본과 같은 줄 순서에 셈만 덧붙인 것이고, 부를 때마다 답을 정본이나 정의와
 * 대조한다. 큰 입력에서는 자리마다 기록을 남기지 않는다 — 기록이 걸음마다 배열을 베끼면 메모리가 모자란다.
 */

import type { ReactElement } from "react";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  type Approach,
  ApproachLadder,
  approachLadderWidth,
} from "../../../_viz/patterns/ApproachLadder";
import type { CellState } from "../../../_viz/patterns/ArrayStrip";
import {
  CellStage,
  CellStageFilm,
  type StageFrame,
  type StageRow,
} from "../../../_viz/patterns/CellStage";
import { LayerBars } from "../../../_viz/patterns/LayerBars";
import {
  type ArrayOptions,
  type ArrayStep,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { longestPalindrome } from "./longestPalindrome-guide.ref.ts";

const REF = new URL("./longestPalindrome-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 공용 값 ───────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 일곱 글자이고 넓히면 열다섯 자리가 된다. 이어받기의 세 갈래(대칭 값 그대로 ·
 * 오른쪽 끝에 잘림 · 오른쪽 끝과 같음)가 한 입력에서 전부 나오고, 답이 짝수 길이라 한가운데가 구분자
 * 자리이며, 답의 시작 자리가 0 이 아니라 되돌리는 줄이 실제로 값을 한다.
 */
export const WALK = "ababbaa";

/** 과제 규모의 상한 — 같은 갈래의 접미사 배열 편과 같다. */
export const LIMIT = 100_000;

/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const OPS_PER_SEC = 100_000_000;

/** 구분자 — 정본이 끼우는 것과 같다. */
export const SEP = "#";

export const num = (x: number | bigint): string => x.toLocaleString("en-US");
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** 넓힌 문자열 — 정본의 ① 과 같은 식이다. */
export const widen = (s: string): string =>
  s.length === 0 ? "" : `${SEP}${[...s].join(SEP)}${SEP}`;

/** 결정론적 입력 — mulberry32(씨앗 `0x9e3779b9`). 접미사 배열 · 카사이 LCP 편과 같은 생성식이다. */
export function makeText(n: number, sigma: number): string {
  let a = 0x9e3779b9;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(String.fromCharCode(97 + (((t ^ (t >>> 14)) >>> 0) % sigma)));
  }
  return out.join("");
}

/** 본문이 쓰는 입력 모양 — 이름과 생성식. */
export const SHAPES: readonly (readonly [string, (n: number) => string])[] = [
  ["전부 같은 글자", (n) => "a".repeat(n)],
  ["두 글자 번갈이", (n) => "ab".repeat(Math.ceil(n / 2)).slice(0, n)],
  [
    "양 끝만 다른 글자",
    (n) => `a${"b".repeat(Math.max(0, n - 2))}a`.slice(0, n),
  ],
  [
    "글자 26 개 되풀이",
    (n) =>
      Array.from({ length: n }, (_, i) =>
        String.fromCharCode(97 + (i % 26)),
      ).join(""),
  ],
  ["무작위 두 글자", (n) => makeText(n, 2)],
  ["무작위 26 글자", (n) => makeText(n, 26)],
];

export const shape = (name: string, n: number): string => {
  const hit = SHAPES.find(([label]) => label === name);
  if (hit === undefined) throw new Error(`없는 입력 모양 — ${name}`);
  return hit[1](n);
};

export const isPalindrome = (w: string): boolean => {
  for (let a = 0, b = w.length - 1; a < b; a++, b--) {
    if (w[a] !== w[b]) return false;
  }
  return true;
};

/** 정의를 그대로 옮긴 답의 길이 — 부분 문자열을 전부 잘라 본다. 계측 없는 기준이다. */
export function bruteLength(s: string): number {
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + best; j < s.length; j++) {
      if (isPalindrome(s.slice(i, j + 1))) best = j - i + 1;
    }
  }
  return best;
}

/* ───────────────────────── 정본 계측 ───────────────────────── */

/** 자리 하나가 반지름을 적은 순간의 기록 — 계측 사본이 `p[i] = k;` 바로 뒤에서 남긴다. */
interface WriteLog {
  readonly i: number;
  readonly k: number;
}

type Log = { __palLog?: WriteLog[] };

const logged = await loadMutant<{ longestPalindrome(s: string): string }>(REF, {
  swap: [
    /^(\s*)p\[i\] = k;$/,
    "$1p[i] = k;\n$1(globalThis as unknown as { __palLog?: { i: number; k: number }[] }).__palLog?.push({ i, k });",
  ],
});

/* ───────────────── 같은 절차 — 자리마다 기록하며 ───────────────── */

/** 이어받기의 갈래 — 구간 밖 · 대칭 값 그대로 · 오른쪽 끝에 잘림 · 오른쪽 끝과 같음. */
export type Branch = "out" | "keep" | "clip" | "edge";

export const BRANCH_NAME: Record<Branch, string> = {
  out: "구간 밖",
  keep: "대칭 값 그대로",
  clip: "오른쪽 끝에 잘림",
  edge: "오른쪽 끝과 같음",
};

/** 자리 하나를 처리한 기록. */
export interface Row {
  /** 넓힌 문자열에서의 자리. */
  readonly i: number;
  readonly ch: string;
  /** 자리에 들어올 때의 기준 자리와 오른쪽 끝. */
  readonly cIn: number;
  readonly rIn: number;
  readonly inside: boolean;
  /** 대칭 자리 `2c − i`. 구간 밖이면 `null`. */
  readonly mirror: number | null;
  readonly pMirror: number | null;
  /** 이어받은 값. 구간 밖이면 `null`. */
  readonly carried: number | null;
  readonly branch: Branch;
  /** 글자가 같아 반지름을 늘린 비교. */
  readonly grow: number;
  /** 글자가 달라 멈춘 비교 — 0 또는 1. 문자열 끝이라 멈추면 글자를 안 읽어 0 이다. */
  readonly stop: number;
  /** 왜 멈췄는가. */
  readonly why: "differ" | "left" | "right";
  /** 맞대 본 두 자리 — 비교마다 한 쌍. */
  readonly pairs: readonly (readonly [number, number])[];
  /** 적은 반지름. */
  readonly p: number;
  /** 자리를 끝낸 뒤의 기준 자리 · 오른쪽 끝 · 가장 긴 자리. */
  readonly c: number;
  readonly r: number;
  readonly best: number;
  readonly movedEdge: boolean;
  readonly movedBest: boolean;
}

export interface Replay {
  readonly s: string;
  readonly t: string;
  readonly m: number;
  readonly p: readonly number[];
  readonly rows: readonly Row[];
  readonly best: number;
  readonly ans: string;
  readonly grow: number;
  readonly stop: number;
  /** 라벨 ①~⑥ 이 실행된 횟수. */
  readonly hits: readonly number[];
}

/** 정본과 같은 절차를 자리마다 멈춰 기록한다. 계측이 없어 중화 실행에서도 값이 나온다. */
export function replay(s: string): Replay {
  const hits = [0, 0, 0, 0, 0, 0];
  if (s.length === 0) {
    return {
      s,
      t: "",
      m: 0,
      p: [],
      rows: [],
      best: 0,
      ans: "",
      grow: 0,
      stop: 0,
      hits,
    };
  }
  const t = widen(s);
  hits[0] = 1;
  const m = t.length;
  const p = new Array<number>(m).fill(0);
  let c = 0;
  let r = 0;
  let best = 0;
  let grow = 0;
  let stop = 0;
  const rows: Row[] = [];
  for (let i = 0; i < m; i++) {
    const cIn = c;
    const rIn = r;
    const inside = i < r;
    const mirror = inside ? 2 * c - i : null;
    const pMirror = mirror === null ? null : (p[mirror] as number);
    let k = inside ? Math.min(r - i, pMirror as number) : 0;
    const carried = inside ? k : null;
    const branch: Branch = !inside
      ? "out"
      : (pMirror as number) < r - i
        ? "keep"
        : (pMirror as number) > r - i
          ? "clip"
          : "edge";
    if (inside) hits[1] = (hits[1] as number) + 1;
    let g = 0;
    let f = 0;
    let why: Row["why"] = "left";
    const pairs: [number, number][] = [];
    for (;;) {
      if (i - k - 1 < 0) {
        why = "left";
        break;
      }
      if (i + k + 1 >= m) {
        why = "right";
        break;
      }
      pairs.push([i - k - 1, i + k + 1]);
      if (t[i - k - 1] !== t[i + k + 1]) {
        f = 1;
        why = "differ";
        break;
      }
      k++;
      g++;
    }
    if (g + f > 0) hits[2] = (hits[2] as number) + 1;
    grow += g;
    stop += f;
    p[i] = k;
    let movedEdge = false;
    let movedBest = false;
    if (i + k > r) {
      c = i;
      r = i + k;
      movedEdge = true;
      hits[3] = (hits[3] as number) + 1;
    }
    if (k > (p[best] as number)) {
      best = i;
      movedBest = true;
      hits[4] = (hits[4] as number) + 1;
    }
    rows.push({
      i,
      ch: t[i] as string,
      cIn,
      rIn,
      inside,
      mirror,
      pMirror,
      carried,
      branch,
      grow: g,
      stop: f,
      why,
      pairs,
      p: k,
      c,
      r,
      best,
      movedEdge,
      movedBest,
    });
  }
  hits[5] = 1;
  const start = (best - (p[best] as number)) / 2;
  const ans = s.slice(start, start + (p[best] as number));
  if (ans !== longestPalindrome(s)) {
    throw new Error(`다시 쓴 절차가 정본과 다른 답을 냈다 — "${s}"`);
  }
  return { s, t, m, p, rows, best, ans, grow, stop, hits };
}

/** `replay` 를 정본 계측 기록과 자리마다 대조한다. 어긋나면 다른 절차를 기록한 것이라 던진다. */
export function trace(s: string): Replay {
  const r = replay(s);
  const g = globalThis as unknown as Log;
  g.__palLog = [];
  const byLog = logged.longestPalindrome(s);
  const log = g.__palLog;
  g.__palLog = undefined;
  if (byLog !== longestPalindrome(s)) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — "${s}"`);
  }
  if (log.length !== r.rows.length) {
    throw new Error(
      `반지름을 적은 자리 수가 정본 기록과 다르다 — 기록 ${log.length} · 다시 쓴 절차 ${r.rows.length}`,
    );
  }
  r.rows.forEach((row, at) => {
    const e = log[at] as WriteLog;
    if (e.i !== row.i || e.k !== row.p) {
      throw new Error(`자리 ${row.i} 의 기록이 정본과 다르다 — "${s}"`);
    }
  });
  return r;
}

let walkMemo: Replay | undefined;
/** 전개 입력의 기록 — 정본 계측과 대조한 것. */
export const walkRun = (): Replay => {
  walkMemo ??= trace(WALK);
  return walkMemo;
};

/* ───────────────────────── 계수기 ───────────────────────── */

/**
 * 이어받는 방식 — **정본은 `"min"`**(대칭 자리의 반지름과 남은 칸 중 작은 값). `"none"` 은 자리마다 0 에서
 * 넓히고, `"mirror"` 는 대칭 자리의 값을 그대로, `"edge"` 는 남은 칸만큼을 그대로 이어받는다.
 */
export type CarryRule = "none" | "mirror" | "edge" | "min";

export const RULE_NAME: Record<CarryRule, string> = {
  none: "이어받지 않는다",
  mirror: "대칭 값 그대로",
  edge: "남은 칸 그대로",
  min: "둘 중 작은 값",
};

/** 셈 한 벌. */
export interface Cost {
  readonly ans: string;
  /** 글자가 같아 늘린 비교. */
  readonly grow: number;
  /** 글자가 달라 멈춘 비교. */
  readonly stop: number;
  /** 구간 안에서 시작한 자리. */
  readonly inside: number;
  /** 배열 칸 읽기 · 쓰기와 글자 읽기의 합. */
  readonly access: number;
}

/**
 * 매내처 알고리즘에 셈만 덧붙인 것 — 정본과 같은 줄 순서다. 칸 접근은 정본이 적은 대로 센다. 자리 넓히기가
 * 글자 `n` 개를 읽고 `t` 의 `m` 칸을 쓰고, 자리마다 대칭 자리의 반지름 읽기(구간 안일 때) 한 번 · 글자 비교
 * 하나에 글자 둘 · `p[i]` 쓰기 한 번 · `p[best]` 읽기 한 번이다. 끝에서 `p[best]` 를 두 번 읽고, 답의 글자를
 * 읽어 잘라 낸다. `p` 를 잡으며 0 으로 채우는 일은 세지 않는다.
 */
export function countManacher(s: string, rule: CarryRule = "min"): Cost {
  const n = s.length;
  if (n === 0) return { ans: "", grow: 0, stop: 0, inside: 0, access: 0 };
  const t = widen(s);
  const m = t.length;
  let access = n + m;
  const p = new Array<number>(m).fill(0);
  let c = 0;
  let r = 0;
  let best = 0;
  let grow = 0;
  let stop = 0;
  let inside = 0;
  for (let i = 0; i < m; i++) {
    let k = 0;
    if (i < r) {
      inside++;
      if (rule === "min") {
        k = Math.min(r - i, p[2 * c - i] as number);
        access++;
      } else if (rule === "mirror") {
        k = p[2 * c - i] as number;
        access++;
      } else if (rule === "edge") {
        k = r - i;
      }
    }
    while (i - k - 1 >= 0 && i + k + 1 < m) {
      access += 2;
      if (t[i - k - 1] !== t[i + k + 1]) {
        stop++;
        break;
      }
      k++;
      grow++;
    }
    p[i] = k;
    access++;
    if (i + k > r) {
      c = i;
      r = i + k;
    }
    access++;
    if (k > (p[best] as number)) best = i;
  }
  const len = p[best] as number;
  access += 2 + len;
  const start = (best - len) / 2;
  const ans = s.slice(start, start + len);
  if (rule === "min" && ans !== longestPalindrome(s)) {
    throw new Error("매내처 계수기와 정본의 답이 다르다");
  }
  return { ans, grow, stop, inside, access };
}

/**
 * 부분 문자열을 전부 확인하는 방법 — 조각마다 양 끝에서 안쪽으로 글자를 맞대고(한 번에 글자 둘), 더 긴
 * 회문이면 그 조각의 글자를 읽어 잘라 둔다.
 */
export function countBrute(s: string): Cost & { cmp: number } {
  const n = s.length;
  let access = 0;
  let cmp = 0;
  let best = "";
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let ok = true;
      for (let a = i, b = j; a < b; a++, b--) {
        cmp++;
        access += 2;
        if (s[a] !== s[b]) {
          ok = false;
          break;
        }
      }
      if (ok && j - i + 1 > best.length) {
        best = s.slice(i, j + 1);
        access += j - i + 1;
      }
    }
  }
  if (best.length !== longestPalindrome(s).length) {
    throw new Error("부분 문자열 전수 계수기가 다른 길이를 냈다");
  }
  return { ans: best, grow: 0, stop: 0, inside: 0, access, cmp };
}

/**
 * 한가운데에서 넓히는 방법 — 넓힌 문자열 없이 한가운데 `2n − 1` 곳을 차례로 잡는다. 글자 위의 한가운데는
 * `a = b = j`, 글자 `j` 와 `j + 1` 사이는 `a = j · b = j + 1` 에서 시작해 글자가 같은 동안 양쪽으로 한 칸씩
 * 넓힌다. 끝에서 답의 글자를 읽어 잘라 낸다.
 */
export function countCenter(s: string): Cost & { cmp: number } {
  const n = s.length;
  let cmp = 0;
  let bestLen = 0;
  let bestStart = 0;
  for (let ctr = 0; ctr < 2 * n - 1; ctr++) {
    let a = ctr >> 1;
    let b = (ctr >> 1) + (ctr & 1);
    while (a >= 0 && b < n) {
      cmp++;
      if (s[a] !== s[b]) break;
      a--;
      b++;
    }
    const len = b - a - 1;
    if (len > bestLen) {
      bestLen = len;
      bestStart = a + 1;
    }
  }
  const ans = s.slice(bestStart, bestStart + bestLen);
  if (ans.length !== longestPalindrome(s).length) {
    throw new Error("한가운데에서 넓히는 계수기가 다른 길이를 냈다");
  }
  return { ans, grow: 0, stop: 0, inside: 0, access: 2 * cmp + bestLen, cmp };
}

/**
 * 전부 같은 글자 `n` 개에서 두 방법의 셈을 **실행하지 않고** 식으로 낸다. 부분 문자열 전수는 길이 `L` 조각
 * `n − L + 1` 개마다 `⌊L/2⌋` 번 맞대고, 시작 자리 0 에서 조각이 길어질 때마다 그 글자를 읽어 잘라 둔다.
 * 한가운데에서 넓히기는 한가운데마다 문자열 끝까지 넓혀 비교가 `n(n+1)/2` 번이다. 작은 `n` 에서는 실제로
 * 센 값과 같은지 대조한다.
 */
export function allSameClosed(n: number): { brute: bigint; center: bigint } {
  const N = BigInt(n);
  let pairs = 0n;
  for (let L = 1n; L <= N; L++) pairs += (N - L + 1n) * (L / 2n);
  const brute = 2n * pairs + (N * (N + 1n)) / 2n;
  const center = N * (N + 1n) + N;
  if (n <= 300) {
    const s = "a".repeat(n);
    if (BigInt(countBrute(s).access) !== brute) {
      throw new Error(`부분 문자열 전수의 식이 실제 셈과 다르다 — n = ${n}`);
    }
    if (BigInt(countCenter(s).access) !== center) {
      throw new Error(`한가운데에서 넓히기의 식이 실제 셈과 다르다 — n = ${n}`);
    }
  }
  return { brute, center };
}
// 식이 실제 셈과 같은지 이 파일을 읽을 때 확인한다.
for (const n of [1, 2, 7, 8, 100, 300]) allSameClosed(n);

/* ───────────────── 사다리 값 — 증명 블록과 그림이 같은 셈을 쓴다 ───────────────── */

export interface OriginCounts {
  readonly closed: { brute: bigint; center: bigint };
  /** 매내처 알고리즘이 규모 상한에서 모양마다 낸 셈 중 가장 큰 것. */
  readonly manacherWorst: { name: string; cost: Cost };
  /** 대칭 값을 그대로 이어받은 사본이 전개 입력에서 낸 답. */
  readonly mirrorWalk: string;
}

let originMemo: OriginCounts | undefined;
export function originCounts(): OriginCounts {
  if (originMemo !== undefined) return originMemo;
  let worst = { name: "", cost: countManacher("a") };
  for (const [name, make] of SHAPES) {
    const cost = countManacher(make(LIMIT));
    if (cost.access > worst.cost.access) worst = { name, cost };
  }
  originMemo = {
    closed: allSameClosed(LIMIT),
    manacherWorst: worst,
    mirrorWalk: countManacher(WALK, "mirror").ans,
  };
  return originMemo;
}

export const seconds = (access: number | bigint): string => {
  const x = Number(access) / OPS_PER_SEC;
  return x >= 10 ? `${num(Math.round(x))} 초` : `${x.toFixed(3)} 초`;
};

function approaches(): Approach[] {
  const c = originCounts();
  const cells = (BigInt(LIMIT) * BigInt(LIMIT + 1)) / 2n;
  return [
    {
      name: "부분 문자열 전부 확인하기",
      idea: "시작과 끝을 모두 골라 조각마다 양 끝에서 안쪽으로 글자를 맞대 본다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자에서 자료 접근 ${num(c.closed.brute)} 번 · ${seconds(c.closed.brute)}`,
          ok: false,
        },
      ],
      lesson: "짧은 조각에서 맞대 본 안쪽 짝을 긴 조각이 처음부터 다시 맞댄다",
    },
    {
      name: "구간마다 판정을 표에 적어 두기",
      idea: "판정 DP 테이블에 구간마다 회문인지 적고, 긴 구간은 안쪽 구간의 칸을 읽는다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "메모리",
          value: `칸 ${num(cells)} 개 · 칸 하나 1 바이트로 잡아도 ${num(Number(cells) / 1e9)} GB`,
          ok: false,
        },
      ],
      lesson:
        "다시 읽기는 없어지지만 구간 수만큼 칸이 든다 — 구간 대신 한가운데로 세면 어떨까",
    },
    {
      name: "한가운데에서 양쪽으로 넓히기",
      idea: "한가운데 2n − 1 곳마다 글자가 같은 동안 양쪽으로 한 칸씩 넓힌다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `전부 같은 글자에서 자료 접근 ${num(c.closed.center)} 번 · ${seconds(c.closed.center)}`,
          ok: false,
        },
      ],
      lesson:
        "이미 확인한 회문 안의 한가운데도 처음부터 넓힌다 — 대칭 자리가 이미 답을 안다",
    },
    {
      name: "대칭 자리의 반지름을 그대로 이어받기",
      idea: "가장 오른쪽까지 간 회문 안이면 대칭 자리의 반지름에서 넓히기를 시작한다",
      verdict: "drop",
      checks: [
        {
          label: "답",
          value: `"${WALK}" 에서 "${c.mirrorWalk}" — 바른 답은 "${longestPalindrome(WALK)}"`,
          ok: false,
        },
      ],
      lesson: "대칭 자리의 회문이 구간 밖까지 가면 그 바깥은 확인한 적이 없다",
    },
    {
      name: "반지름 이어받기",
      idea: "대칭 자리의 반지름을 이어받되 오른쪽 끝까지 남은 칸에서 자른다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `${c.manacherWorst.name}에서 자료 접근 ${num(c.manacherWorst.cost.access)} 번 · ${seconds(c.manacherWorst.cost.access)}`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────── 걸음 — 필름과 걸음 재생 패널이 같은 기록을 쓴다 ───────────────── */

export interface Step {
  readonly id: string;
  readonly kind: "init" | "place" | "done";
  readonly row: Row | null;
  readonly title: string;
  readonly detail: string;
  /** 이 걸음이 끝난 뒤의 반지름 배열. 아직 안 적은 칸은 `null`. */
  readonly p: readonly (number | null)[];
  /** 이 걸음까지 한 글자 비교의 누적. */
  readonly compares: number;
}

function placeTitle(r: Row): string {
  if (r.branch === "out") {
    return r.p === 0
      ? `자리 ${r.i} — 구간 밖 · 반지름 0`
      : `자리 ${r.i} — 구간 밖 · 넓혀서 반지름 ${r.p}`;
  }
  if (r.grow > 0) {
    return `자리 ${r.i} — ${BRANCH_NAME[r.branch]} · 넓혀서 반지름 ${r.p}`;
  }
  return `자리 ${r.i} — ${BRANCH_NAME[r.branch]} · 반지름 ${r.p}`;
}

function placeDetail(r: Row): string {
  const head = r.inside
    ? `i = ${r.i}${이가(r.i)} r = ${r.rIn} 보다 작아 구간 안입니다. 대칭 자리 2 × ${r.cIn} − ${r.i} = ${r.mirror} 의 반지름 ${r.pMirror}${과와(r.pMirror as number)} 남은 칸 ${r.rIn - r.i} 중 작은 ${r.carried}${을를(r.carried as number)} 이어받습니다.`
    : `i = ${r.i}${이가(r.i)} r = ${r.rIn} 보다 작지 않아 구간 밖입니다. 0 에서 시작합니다.`;
  const grew =
    r.grow > 0
      ? ` 글자가 같은 쌍 ${r.grow} 개로 반지름이 ${r.p}${이가(r.p)} 됩니다.`
      : "";
  const last = r.pairs.at(-1);
  const t = walkRun().t;
  const stop =
    r.why === "differ" && last !== undefined
      ? ` t[${last[0]}] = ${t[last[0]]}${과와(t[last[0]] as string)} t[${last[1]}] = ${t[last[1]]}${이가(t[last[1]] as string)} 달라 멈춥니다.`
      : r.why === "left"
        ? ` 왼쪽이 문자열 밖이라 멈춥니다.`
        : ` 오른쪽이 문자열 밖이라 멈춥니다.`;
  const edge = r.movedEdge
    ? ` i + p[i] = ${r.i + r.p}${이가(r.i + r.p)} r 보다 커서 c = ${r.c}, r = ${r.r}${으로(r.r)} 옮깁니다.`
    : "";
  const best = r.movedBest
    ? ` 가장 긴 자리가 ${r.best}${으로(r.best)} 바뀝니다.`
    : "";
  return `${head}${grew}${stop} p[${r.i}] = ${r.p}${을를(r.p)} 적습니다.${edge}${best}`;
}

/** 전개 입력의 걸음 — T1 자리 넓히기, 자리마다 한 걸음, 마지막에 답을 잘라 낸다. */
export function walkSteps(): Step[] {
  const run = walkRun();
  const steps: Step[] = [];
  let n = 1;
  const p: (number | null)[] = Array.from({ length: run.m }, () => null);
  let compares = 0;
  steps.push({
    id: `T${n++}`,
    kind: "init",
    row: null,
    title: "자리를 넓힌다",
    detail: `글자 ${WALK.length} 개 사이와 양 끝에 구분자를 끼웁니다. 넓힌 문자열은 t = ${run.t} 이고 자리가 ${run.m} 개입니다. c 와 r 은 0 에서 시작합니다.`,
    p: [...p],
    compares,
  });
  for (const row of run.rows) {
    p[row.i] = row.p;
    compares += row.grow + row.stop;
    steps.push({
      id: `T${n++}`,
      kind: "place",
      row,
      title: placeTitle(row),
      detail: placeDetail(row),
      p: [...p],
      compares,
    });
  }
  const len = run.p[run.best] as number;
  const start = (run.best - len) / 2;
  steps.push({
    id: `T${n++}`,
    kind: "done",
    row: null,
    title: "답을 잘라 낸다",
    detail: `가장 긴 자리는 ${run.best}${josa(run.best, "이고", "고")} 반지름은 ${len} 입니다. 시작 자리 (${run.best} − ${len}) / 2 = ${start} 에서 ${len} 글자를 잘라 낸 답은 "${run.ans}" 입니다. 글자 비교는 모두 ${compares} 번입니다.`,
    p: [...p],
    compares,
  });
  return steps;
}

/**
 * 걸음 하나를 배열 무대(`arrayStage`)의 걸음으로. 값 줄은 넓힌 문자열 `t` 이고, 그 아래에 반지름 배열 `p`
 * 한 줄을 쌓는다 — 둘 다 칸 번호가 `t` 의 자리다. 쥔 구간은 이 자리에 들어올 때 기억해 둔 가장 오른쪽 회문
 * `[c − p[c], r]` 이고, 조각 괄호는 이번 자리의 회문과 대칭 자리의 회문이다.
 */
function arrayStep(step: Step): ArrayStep {
  const run = walkRun();
  const row = step.row;
  const t = [...run.t];
  if (row === null) {
    const done = step.kind === "done";
    const last = run.rows.at(-1) as Row;
    const len = run.p[run.best] as number;
    return {
      array: t,
      range: done ? [last.c - (run.p[last.c] as number), last.r] : [0, 0],
      rangeSide: done ? `c = ${last.c} · r = ${last.r}` : "c = 0 · r = 0",
      read: [],
      write: [],
      layers: [
        {
          name: "p",
          values: [...step.p],
          read: done ? [run.best] : [],
          write: [],
        },
      ],
      ...(done
        ? {
            pieces: [
              {
                label: "답",
                from: run.best - len,
                to: run.best + len,
                tone: "left" as const,
                text: `"${run.ans}"`,
              },
            ],
          }
        : {}),
      calc: done
        ? {
            expr: `(${run.best} − p[${run.best}]) / 2 = (${run.best} − ${len}) / 2`,
            result: `${(run.best - len) / 2}`,
          }
        : { expr: "m = 2n + 1", result: `${run.m}` },
      vars: `글자 비교 누적 ${step.compares} 번`,
    };
  }
  const read = [...new Set(row.pairs.flat())].sort((x, y) => x - y);
  const pieces: ArrayStep["pieces"] = [
    ...(row.p > 0
      ? [
          {
            label: `자리 ${row.i}`,
            from: row.i - row.p,
            to: row.i + row.p,
            tone: "left" as const,
            text: `p[${row.i}] = ${row.p}`,
          },
        ]
      : []),
    ...(row.mirror !== null && (row.pMirror as number) > 0
      ? [
          {
            label: `대칭 ${row.mirror}`,
            from: row.mirror - (row.pMirror as number),
            to: row.mirror + (row.pMirror as number),
            tone: "right" as const,
            text: `p[${row.mirror}] = ${row.pMirror}`,
          },
        ]
      : []),
  ];
  return {
    array: t,
    range: [row.cIn - (run.p[row.cIn] as number), row.rIn],
    rangeSide: `c = ${row.cIn} · r = ${row.rIn}`,
    read,
    write: [],
    pointers:
      row.mirror === null
        ? { i: row.i }
        : { "2c−i": row.mirror, c: row.cIn, i: row.i },
    ...(pieces.length > 0 ? { pieces } : {}),
    layers: [
      {
        name: "p",
        values: [...step.p],
        read: row.mirror === null ? [] : [row.mirror],
        write: [row.i],
      },
    ],
    calc: row.inside
      ? {
          expr: `min(r − i, p[2c − i]) = min(${row.rIn - row.i}, ${row.pMirror})`,
          result: `${row.carried}`,
        }
      : { expr: `i = ${row.i} ≥ r = ${row.rIn}`, result: "0 에서 시작" },
    vars: `글자 비교 누적 ${step.compares} 번 · best = ${row.best}`,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "t",
  rangeLabel: "가장 오른쪽 회문",
};

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자
 * 그대로 옮긴 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `longestPalindrome-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return walkSteps().map((s) => ({
    title: `${s.id} ${s.title}`,
    text: s.detail,
    ...arrayStep(s),
  }));
}

function film(): StageFrame[] {
  return walkSteps().map((s) => ({
    id: s.id,
    text: s.title,
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 넓힌 문자열 줄 · 반지름 줄 — 개념 그림과 대칭 그림이 함께 쓴다. */
function tRows(
  run: Replay,
  pStates: Partial<Record<number, CellState>> = {},
): StageRow[] {
  return [
    { kind: "index", label: "t 의 자리" },
    { kind: "cells", label: "t", values: [...run.t] },
    {
      kind: "cells",
      label: "p",
      values: [...run.p],
      states: pStates,
      side: `반지름 ${run.m} 칸`,
    },
  ];
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-radius": () => {
    const run = walkRun();
    const len = run.p[run.best] as number;
    return (
      <CellStage
        title={`"${WALK}" 를 넓힌 t 와 반지름 배열 p — 가장 큰 칸 p[${run.best}] = ${len} 에서 답 "${run.ans}" 가 나온다`}
        rows={[
          ...tRows(run, { [run.best]: "focus" }),
          {
            kind: "bracket",
            label: `p[${run.best}] 의 회문`,
            from: run.best - len,
            to: run.best + len,
            tone: "query",
            text: `[${run.best - len},${run.best + len}] · s 에서 "${run.ans}"`,
          },
        ]}
        columns={run.m}
      />
    );
  },
  "origin-centers": () => {
    const run = walkRun();
    const states: Partial<Record<number, CellState>> = {
      0: "out",
      [run.m - 1]: "out",
    };
    const n = WALK.length;
    return (
      <CellStage
        title={`한가운데 ${2 * n - 1} 곳 — 글자 위 ${n} 곳은 홀수 자리, 글자 사이 ${n - 1} 곳은 짝수 자리가 된다`}
        rows={[
          { kind: "index", label: "t 의 자리" },
          {
            kind: "cells",
            label: "t",
            values: [...run.t],
            states,
            side: `양 끝 2 곳은 한가운데가 아니다`,
          },
          {
            kind: "bracket",
            label: "글자 위",
            from: 1,
            to: run.m - 2,
            tone: "left",
            text: `홀수 자리 1 · 3 · … · ${run.m - 2} — ${n} 곳`,
          },
          {
            kind: "bracket",
            label: "글자 사이",
            from: 2,
            to: run.m - 3,
            tone: "right",
            text: `짝수 자리 2 · 4 · … · ${run.m - 3} — ${n - 1} 곳`,
          },
        ]}
        columns={run.m}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 다섯 — 넷은 버렸고 하나가 남았다"
        constraint={`문자열 길이 ${num(LIMIT)} 이하 · 1 초(자료 접근 1 초에 1 억 번 기준) · 256 MB`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-radius-bars": () => {
    const run = walkRun();
    const bars = run.rows
      .filter((row) => row.p > 0)
      .map((row) => {
        const start = (row.i - row.p) / 2;
        return [
          {
            label: `p[${row.i}] = ${row.p}`,
            from: row.i - row.p,
            to: row.i + row.p,
            note: `s 에서 "${WALK.slice(start, start + row.p)}" · 길이 ${row.p}`,
          },
        ];
      });
    return (
      <LayerBars
        title={`반지름이 0 이 아닌 자리 ${bars.length} 곳 — 자리마다 그 자리를 한가운데로 하는 가장 긴 회문`}
        values={[...run.t]}
        valuesLabel="t"
        indexLabel="t 의 자리"
        groups={bars}
      />
    );
  },
  "build-clip": () => {
    const run = walkRun();
    const row = run.rows.find((x) => x.branch === "clip") as Row;
    const pc = run.p[row.cIn] as number;
    const pm = row.pMirror as number;
    const mirror = row.mirror as number;
    const pStates: Partial<Record<number, CellState>> = {
      [mirror]: "read",
      [row.i]: "focus",
    };
    return (
      <CellStage
        title={`자리 ${row.i} — 대칭 자리 ${mirror} 의 회문이 구간 밖으로 나가 남은 칸 ${row.rIn - row.i} 만 이어받는다`}
        rows={[
          ...tRows(run, pStates),
          {
            kind: "bracket",
            label: "가장 오른쪽 회문",
            from: row.cIn - pc,
            to: row.rIn,
            tone: "query",
            text: `c = ${row.cIn} · [${row.cIn - pc},${row.rIn}]`,
          },
          {
            kind: "bracket",
            label: `대칭 ${mirror} 의 회문`,
            from: mirror - pm,
            to: mirror + pm,
            tone: "right",
            text: `p[${mirror}] = ${pm} · [${mirror - pm},${mirror + pm}]`,
          },
          {
            kind: "bracket",
            label: `자리 ${row.i}${이가(row.i)} 이어받는 몫`,
            from: row.i - (row.carried as number),
            to: row.i + (row.carried as number),
            tone: "left",
            text: `min(${row.rIn - row.i}, ${pm}) = ${row.carried}`,
          },
        ]}
        columns={run.m}
      />
    );
  },
  "walk-manacher": () => {
    const frames = film();
    return (
      <CellStageFilm
        title={`longestPalindrome("${WALK}") — ${frames[0]?.id}~${frames.at(-1)?.id}`}
        columns={walkRun().m}
        frames={frames}
      />
    );
  },
};
