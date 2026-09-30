/**
 * `largestRectangleInHistogram-guide.md` 의 그림 — 규약은 `tools/render-figs.ts` 머리 주석(KAN-057).
 *
 * 그림과 증명 블록에 들어가는 값은 전부 정본(`-guide.ref.ts`)을 실행해 받는다. 정본이 **무엇을 어떤 차례로
 * 읽었는가**는 입력 배열을 `Proxy` 로 감싸 기록한다 — 정본 소스를 바꾸지 않으므로 `check-proof` 가 변이를
 * 중화한 실행에서도 기록이 그대로 나온다. 정본이 `heights` 를 읽는 자리는 셋이다 — 지금 높이 `heights[i]`,
 * 꼭대기와 비교하는 `heights[top]`, 꺼낸 자리의 넓이를 내는 `heights[top]`. 꼭대기는 언제나 `i` 보다
 * 왼쪽이고, 넓이를 내는 읽기는 꺼낸 비교 바로 뒤에 같은 칸을 한 번 더 읽는 것이라 읽은 칸 번호만으로 셋이
 * 갈린다. 마지막 보초 걸음(`i = N`)은 지금 높이를 읽지 않으므로, 앞 걸음의 반복이 끝난 뒤에 새 자리가 아닌
 * 칸을 읽으면 보초 걸음으로 본다. 그 기록을 다시 재생해 단조 스택을 세우고, 재생한 답이 정본의 답과 다르면
 * 던진다.
 *
 * 걸음 재생 패널의 걸음(`simStepsFromRef`)도 같은 기록에서 만들고, `.sim.ts` 의 리터럴이 그것과 같은지는
 * `largestRectangleInHistogram-guide.test.ts` 가 잰다.
 */

import type { ReactElement } from "react";
import { 을를, 이가 } from "../../../../tools/josa.ts";
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
  type ArrayLayer,
  type ArrayOptions,
  type ArrayPiece,
  type ArrayStep,
  arrayColumns,
  arrayStage,
} from "../../../_viz/player/arrayStage";
import { largestRectangleInHistogram } from "./largestRectangleInHistogram-guide.ref.ts";

/* ───────────────────────── 고정 입력 ───────────────────────── */

/** 본문 전개가 쓰는 입력. `concept`·`deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
export const WALK: readonly number[] = [2, 1, 5, 6, 2, 3];

/**
 * 작은 입력으로는 계수가 안 갈리는 자리에서 쓰는 큰 입력. 난수를 쓰지 않는다.
 *
 * `+ 1` 이 붙은 이유가 있다. 나머지만 쓰면 `i` 가 211 의 배수인 다섯 칸의 높이가 0 이 되고, 높이 0 인 막대는
 * 보초와 비교해도 안 꺼내져 그 다섯 자리가 단조 스택에 남는다. 모양별 비교에서 한 줄만 `P ≠ N` 이 되므로
 * 여기서는 높이를 1 이상으로 둔다. 높이 0 이 하는 일은 「케이스별 비용과 그 경계」가 따로 잰다.
 */
export const BIG_N = 1024;
export const BIG: readonly number[] = Array.from(
  { length: BIG_N },
  (_, i) => ((i * 4093) % 211) + 1,
);

/** 과제 규모 — 배열 길이 `N` 의 상한. */
export const TASK_N = 100_000;
/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const OPS_PER_SECOND = 100_000_000;

export const num = (x: number): string => x.toLocaleString("en-US");
/** `[2 1 5 6 2 3]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(" ")}]`;
/** `1 · 4 · 5` 꼴의 자리 나열. */
export const dots = (xs: readonly (number | string)[]): string =>
  xs.join(" · ");

export const up = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => i + 1);
export const down = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => n - i);
export const flat = (n: number, v = 7): number[] =>
  Array.from({ length: n }, () => v);
/** 가운데가 가장 높은 산 모양. */
export const hill = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => Math.min(i + 1, n - i));
/** 앞 절반은 내려가고 뒤 절반은 올라가는 계곡 모양. */
export const valley = (n: number): number[] => {
  const h = Math.floor(n / 2);
  return Array.from({ length: n }, (_, i) => (i < h ? h - i : i - h + 1));
};

/* ───────────────────────── 정본 실행 기록 ───────────────────────── */

/**
 * 정본이 한 일 하나. `cur` 는 지금 높이를 읽은 것(보초 걸음은 읽지 않고 `sentinel` 이 참이다), `cmp` 는 꼭대기
 * `top` 의 높이를 읽어 지금 높이와 비교한 것(`pop` 이 참이면 꺼냈다), `area` 는 꺼낸 자리의 높이를 한 번 더
 * 읽어 넓이를 낸 것, `push` 는 지금 자리를 넣은 것이다. `push` 는 `heights` 읽기가 아니라서 기록에 직접 남지
 * 않는다 — 반복이 끝난 뒤 다음 읽기가 오거나 순회가 끝나는 자리에 넣고, 그렇게 재생한 단조 스택의 꼭대기가
 * 정본이 실제로 읽은 칸과 다르면 던진다.
 */
export type Event =
  | { readonly kind: "cur"; readonly i: number; readonly sentinel: boolean }
  | {
      readonly kind: "cmp";
      readonly i: number;
      readonly top: number;
      readonly pop: boolean;
    }
  | {
      readonly kind: "area";
      readonly i: number;
      readonly top: number;
      readonly left: number;
      readonly width: number;
      readonly area: number;
    }
  | { readonly kind: "push"; readonly i: number };

export interface Run {
  readonly best: number;
  readonly events: readonly Event[];
}

/** 읽은 칸 번호를 차례로 모으는 감시 배열. */
function watched(
  heights: readonly number[],
  onRead: (k: number) => void,
): number[] {
  return new Proxy([...heights], {
    get(target, key, receiver) {
      if (typeof key === "string" && /^\d+$/.test(key)) onRead(Number(key));
      return Reflect.get(target, key, receiver);
    },
  });
}

/** 꺼내는 조건 — 꼭대기의 높이 `top` 과 지금 높이 `cur` 를 받는다. 정본은 엄격하게 높을 때만 꺼낸다. */
export type PopIf = (top: number, cur: number) => boolean;
export const strictPop: PopIf = (top, cur) => top > cur;

/** 정본과 같은 모양의 구현 — 변이 사본도 이 모양이다. */
export type Impl = (heights: number[]) => number;

/**
 * 읽은 칸의 차례를 다시 재생하는 기계 — `run` 과 `count` 가 같은 규칙을 쓴다. 한 칸을 읽을 때마다 `read` 를
 * 부르고, 끝나면 `finish` 를 부른다. 재생이 정본의 읽은 칸과 어긋나면 던진다.
 */
function replayer(
  heights: readonly number[],
  emit: (e: Event, stack: readonly number[]) => void,
  popIf: PopIf = strictPop,
) {
  const n = heights.length;
  const h = (p: number): number => (p < n ? (heights[p] as number) : 0);
  const stack: number[] = [];
  let i = -1;
  let next = 0;
  let cur = 0;
  let loopDone = true;
  let areaOf: number | null = null;
  const push = (): void => {
    stack.push(i);
    emit({ kind: "push", i }, stack);
  };
  const begin = (at: number, sentinel: boolean): void => {
    if (i >= 0) push();
    i = at;
    cur = sentinel ? 0 : h(at);
    loopDone = stack.length === 0;
    emit({ kind: "cur", i, sentinel }, stack);
  };
  return {
    read(k: number): void {
      if (areaOf !== null) {
        if (k !== areaOf) {
          throw new Error(
            `꺼낸 자리 ${areaOf} 의 넓이를 낼 차례에 정본이 칸 ${k} 을 읽었다`,
          );
        }
        const left = stack.at(-1) ?? -1;
        const width = i - left - 1;
        emit(
          { kind: "area", i, top: k, left, width, area: h(k) * width },
          stack,
        );
        areaOf = null;
        loopDone = stack.length === 0;
        return;
      }
      if (loopDone) {
        if (k === next && next < n) {
          next++;
          begin(k, false);
          return;
        }
        if (next !== n) {
          throw new Error(`정본이 새 자리 ${next} 대신 칸 ${k} 을 읽었다`);
        }
        begin(n, true);
      }
      if (k !== stack.at(-1)) {
        throw new Error(
          `정본이 읽은 칸 ${k} 이 재생한 단조 스택의 꼭대기 ${stack.at(-1)} 와 다르다`,
        );
      }
      const pop = popIf(h(k), cur);
      emit({ kind: "cmp", i, top: k, pop }, stack);
      if (pop) {
        stack.pop();
        areaOf = k;
      } else loopDone = true;
    },
    finish(): void {
      if (areaOf !== null || !loopDone)
        throw new Error("재생이 걸음 도중에 끝났다");
      if (i < n) {
        if (next !== n) throw new Error("재생이 모든 자리를 읽지 않았다");
        begin(n, true);
      }
      push();
    },
  };
}

/**
 * 정본 한 번 호출의 기록 — 작은 입력용. 기록이 걸음마다 쌓이므로 큰 입력에는 `count` 를 쓴다. `impl` 과
 * `popIf` 를 주면 꺼내는 조건을 바꾼 변이 사본을 같은 규칙으로 기록한다.
 */
export function run(
  heights: readonly number[],
  impl: Impl = largestRectangleInHistogram,
  popIf: PopIf = strictPop,
): Run {
  const events: Event[] = [];
  let best = 0;
  const r = replayer(
    heights,
    (e) => {
      events.push(e);
      if (e.kind === "area" && e.area > best) best = e.area;
    },
    popIf,
  );
  const got = impl(watched(heights, (k) => r.read(k)));
  r.finish();
  if (got !== best) {
    throw new Error(`재생한 답 ${best} 이 정본의 답 ${got} 과 다르다`);
  }
  return { best: got, events };
}

/**
 * 한 번의 실행을 세는 가벼운 판 — 값만 센다(기록을 남기지 않는다). 세는 규칙은 `run` 과 같다.
 *
 * 배열 접근은 `heights` 읽기(감시 배열이 센다)에 단조 스택 읽기와 쓰기를 더한다 — 비교마다 꼭대기 읽기 한 번 ·
 * 꺼낸 뒤 단조 스택이 비지 않았으면 왼쪽 경계로 새 꼭대기 읽기 한 번 · 자리 넣기 한 번(보초 자리까지 `N + 1`
 * 번). `heights` 읽기는 지금 높이 `N` 번 · 비교마다 한 번 · 넓이마다 한 번이다.
 */
export interface Counts {
  readonly n: number;
  /** 비교한 횟수 — 꼭대기의 높이를 읽어 지금 높이와 비교한 횟수. `P + B` 다. */
  readonly cmp: number;
  /** 꺼낸 횟수 `P`. */
  readonly pops: number;
  /** 꼭대기가 남은 채로 꺼내기를 멈춘 걸음의 수 `B`. */
  readonly stops: number;
  /** 꺼내고 나서 단조 스택이 빈 횟수 `M`. */
  readonly empties: number;
  /** `heights` 를 읽은 횟수. */
  readonly reads: number;
  /** 단조 스택이 가장 깊었을 때의 칸 수. */
  readonly peak: number;
  /** 배열 접근 수(읽기 + 쓰기). */
  readonly acc: number;
  readonly best: number;
}

export function count(heights: readonly number[]): Counts {
  let cmp = 0;
  let pops = 0;
  let stops = 0;
  let empties = 0;
  let reads = 0;
  let pushes = 0;
  let peak = 0;
  let best = 0;
  const r = replayer(heights, (e, stack) => {
    if (e.kind === "cmp") {
      cmp++;
      if (e.pop) pops++;
      else stops++;
    } else if (e.kind === "area") {
      if (stack.length === 0) empties++;
      if (e.area > best) best = e.area;
    } else if (e.kind === "push") {
      pushes++;
      if (stack.length > peak) peak = stack.length;
    }
  });
  const got = largestRectangleInHistogram(
    watched(heights, (k) => {
      reads++;
      r.read(k);
    }),
  );
  r.finish();
  const n = heights.length;
  if (got !== best) throw new Error("재생한 답이 정본의 답과 다르다");
  if (reads !== n + cmp + pops) {
    throw new Error("heights 읽기가 N + 비교 횟수 + 꺼낸 횟수와 다르다");
  }
  const stackReads = cmp + (pops - empties);
  return {
    n,
    cmp,
    pops,
    stops,
    empties,
    reads,
    peak,
    acc: reads + stackReads + pushes,
    best,
  };
}

/**
 * 걸음마다 단조 스택을 들여다보는 가벼운 판 — 기록을 남기지 않고, 정본이 한 일 하나마다 그 직후의 단조
 * 스택을 `visit` 에 넘긴다. 큰 입력에서 불변식을 잴 때 쓴다.
 */
export function eachMoment(
  heights: readonly number[],
  visit: (e: Event, stack: readonly number[]) => void,
): number {
  let best = 0;
  const r = replayer(heights, (e, stack) => {
    if (e.kind === "area" && e.area > best) best = e.area;
    visit(e, stack);
  });
  const got = largestRectangleInHistogram(watched(heights, (k) => r.read(k)));
  r.finish();
  if (got !== best) throw new Error("재생한 답이 정본의 답과 다르다");
  return got;
}

/* ───────────────────────── 다른 방법 — 비교용 ───────────────────────── */

/** 가장 단순한 방법 — 모든 구간을 열거하며 최솟값을 이어 간다. 구간 하나에 `heights` 를 한 번 읽는다. */
export function allIntervals(heights: readonly number[]): {
  best: number;
  acc: number;
} {
  const n = heights.length;
  let best = 0;
  let acc = 0;
  for (let l = 0; l < n; l++) {
    let low = Number.POSITIVE_INFINITY;
    for (let r = l; r < n; r++) {
      acc++;
      low = Math.min(low, heights[r] as number);
      best = Math.max(best, low * (r - l + 1));
    }
  }
  return { best, acc };
}

/**
 * 막대마다 양쪽으로 뻗어 보는 방법. 자리 `j` 에서 왼쪽·오른쪽으로 `heights[j]` 이상인 동안 걸어가 폭을 잰다.
 * 배열 접근은 `heights` 읽기뿐이다. 작은 입력(64 칸 이하)에서는 자리마다 읽은 칸을 남긴다.
 */
export function expandBoth(heights: readonly number[]): {
  best: number;
  acc: number;
  spans: { j: number; l: number; r: number; read: number[] }[];
} {
  const n = heights.length;
  const keep = n <= 64;
  let best = 0;
  let acc = 0;
  const spans: { j: number; l: number; r: number; read: number[] }[] = [];
  for (let j = 0; j < n; j++) {
    acc++;
    const h = heights[j] as number;
    const read: number[] = [];
    let l = j;
    while (l - 1 >= 0) {
      acc++;
      if (keep) read.push(l - 1);
      if ((heights[l - 1] as number) < h) break;
      l--;
    }
    let r = j;
    while (r + 1 < n) {
      acc++;
      if (keep) read.push(r + 1);
      if ((heights[r + 1] as number) < h) break;
      r++;
    }
    best = Math.max(best, h * (r - l + 1));
    if (keep) spans.push({ j, l, r, read: read.sort((a, b) => a - b) });
  }
  return { best, acc, spans };
}

/**
 * 단조 스택을 두 번 쓰는 방법 — 한 번은 오른쪽 경계(오른쪽에서 처음 만나는 더 낮은 막대)를, 한 번은 왼쪽
 * 경계(왼쪽에서 처음 만나는 이하인 막대)를 배열에 적고, 마지막에 자리마다 넓이를 낸다. 배열 접근은 정본과
 * 같은 규칙으로 센다 — 경계 배열을 까는 쓰기 · `heights` 읽기 · 꼭대기 읽기 · 경계 쓰기 · 자리 넣기 ·
 * 마지막 순회의 세 배열 읽기.
 */
export function twoPass(heights: readonly number[]): {
  best: number;
  acc: number;
  extra: number;
  right: number[];
  leftOf: number[];
} {
  const n = heights.length;
  let acc = 0;
  let peak = 0;
  const right = new Array<number>(n).fill(n);
  acc += n;
  let stack: number[] = [];
  for (let i = 0; i < n; i++) {
    acc++;
    const cur = heights[i] as number;
    while (stack.length > 0) {
      const top = stack[stack.length - 1] as number;
      acc += 2;
      if ((heights[top] as number) <= cur) break;
      stack.pop();
      right[top] = i;
      acc++;
    }
    stack.push(i);
    acc++;
    peak = Math.max(peak, stack.length);
  }
  const leftOf = new Array<number>(n).fill(-1);
  acc += n;
  stack = [];
  for (let i = n - 1; i >= 0; i--) {
    acc++;
    const cur = heights[i] as number;
    while (stack.length > 0) {
      const top = stack[stack.length - 1] as number;
      acc += 2;
      if ((heights[top] as number) < cur) break;
      stack.pop();
      leftOf[top] = i;
      acc++;
    }
    stack.push(i);
    acc++;
    peak = Math.max(peak, stack.length);
  }
  let best = 0;
  for (let j = 0; j < n; j++) {
    acc += 3;
    const area =
      (heights[j] as number) *
      ((right[j] as number) - (leftOf[j] as number) - 1);
    if (area > best) best = area;
  }
  if (best !== largestRectangleInHistogram([...heights])) {
    throw new Error("두 번 쓰는 방법의 답이 정본과 다르다");
  }
  return { best, acc, extra: 2 * n + peak, right, leftOf };
}

/**
 * 단조 스택에 자리 대신 **높이**를 담는 방법. 비교는 그대로 되지만, 폭을 내려면 왼쪽 경계의 자리가 필요해
 * 꺼낸 뒤 새 꼭대기의 높이가 `i` 왼쪽에서 가장 가까이 나오는 자리를 찾아 읽는다. 배열 접근은 정본과 같은
 * 규칙으로 센다 — 지금 높이 읽기 · 비교마다 꼭대기 읽기(높이가 단조 스택에 있으니 `heights` 는 안 읽는다) ·
 * 꺼낸 뒤 새 꼭대기 읽기와 그 자리를 찾는 `heights` 읽기 · 넣기.
 */
export function heightStack(heights: readonly number[]): {
  best: number;
  acc: number;
} {
  const n = heights.length;
  const stack: number[] = [];
  let best = 0;
  let acc = 0;
  for (let i = 0; i <= n; i++) {
    let cur = 0;
    if (i < n) {
      acc++;
      cur = heights[i] as number;
    }
    while (stack.length > 0) {
      acc++;
      const top = stack[stack.length - 1] as number;
      if (top <= cur) break;
      stack.pop();
      let left = -1;
      if (stack.length > 0) {
        acc++;
        const want = stack[stack.length - 1] as number;
        for (let k = i - 1; k >= 0; k--) {
          acc++;
          if ((heights[k] as number) === want) {
            left = k;
            break;
          }
        }
      }
      best = Math.max(best, top * (i - left - 1));
    }
    stack.push(cur);
    acc++;
  }
  if (best !== largestRectangleInHistogram([...heights])) {
    throw new Error("높이를 담는 방법의 답이 정본과 다르다");
  }
  return { best, acc };
}

/** 자리 `j` 의 왼쪽 경계 — `j` 왼쪽에서 처음 만나는 `heights[j]` **이하**인 자리. 없으면 `-1`. */
export function leftBound(heights: readonly number[], j: number): number {
  for (let k = j - 1; k >= 0; k--) {
    if ((heights[k] as number) <= (heights[j] as number)) return k;
  }
  return -1;
}

/** 자리 `j` 의 오른쪽 경계 — `j` 오른쪽에서 처음 만나는 `heights[j]` **미만**인 자리. 없으면 `N`. */
export function rightBound(heights: readonly number[], j: number): number {
  for (let k = j + 1; k < heights.length; k++) {
    if ((heights[k] as number) < (heights[j] as number)) return k;
  }
  return heights.length;
}

/** 정의만으로 답을 낸다 — 후보 `N` 개의 최댓값. */
export function byDefinition(heights: readonly number[]): number {
  let best = 0;
  for (let j = 0; j < heights.length; j++) {
    const w = rightBound(heights, j) - leftBound(heights, j) - 1;
    best = Math.max(best, (heights[j] as number) * w);
  }
  return best;
}

/** 길이 `1..len` · 값 `0..max` 인 배열을 전부 만든다. */
export function everyArray(
  len: number,
  max: number,
  visit: (a: number[]) => void,
): void {
  const walk = (acc: number[]): void => {
    if (acc.length > 0) visit(acc);
    if (acc.length === len) return;
    for (let v = 0; v <= max; v++) walk([...acc, v]);
  };
  walk([]);
}

/* ───────────── 걸음 — 필름 · 걸음 재생 패널 · 증명 표가 같은 기록을 쓴다 ───────────── */

export interface WalkStep {
  readonly id: string;
  /**
   * `push` 단조 스택이 비어 바로 넣음 · `stop` 꼭대기가 높지 않아 멈추고 넣음 · `pop` 꺼내고 넓이를 냄 ·
   * `end` 보초 자리를 넣고 순회를 마침.
   */
  readonly kind: "push" | "stop" | "pop" | "end";
  readonly i: number;
  /** 이번 걸음의 높이 — 보초 걸음이면 0. */
  readonly cur: number;
  readonly top?: number;
  readonly left?: number;
  readonly width?: number;
  readonly area?: number;
  /** 이 걸음이 끝난 뒤의 단조 스택(바닥 → 꼭대기)과 가장 큰 넓이. */
  readonly stack: readonly number[];
  readonly best: number;
  readonly pushes: number;
  readonly pops: number;
  /** 같은 `i` 에서 이 걸음 앞에 꺼낸 것이 있었는가. */
  readonly afterPops: boolean;
}

export function walkOf(heights: readonly number[]): WalkStep[] {
  const { events } = run(heights);
  const n = heights.length;
  const steps: WalkStep[] = [];
  const stack: number[] = [];
  let best = 0;
  let pushes = 0;
  let pops = 0;
  let cur = 0;
  let stopTop: number | null = null;
  let poppedHere = false;
  const add = (s: Omit<WalkStep, "id" | "stack" | "best">): void => {
    steps.push({ id: `T${steps.length + 1}`, ...s, stack: [...stack], best });
  };
  for (const e of events) {
    if (e.kind === "cur") {
      cur = e.sentinel ? 0 : (heights[e.i] as number);
      poppedHere = false;
      continue;
    }
    if (e.kind === "cmp") {
      if (e.pop) stack.pop();
      else stopTop = e.top;
      continue;
    }
    if (e.kind === "area") {
      pops++;
      if (e.area > best) best = e.area;
      add({
        kind: "pop",
        i: e.i,
        cur,
        top: e.top,
        left: e.left,
        width: e.width,
        area: e.area,
        pushes,
        pops,
        afterPops: poppedHere,
      });
      poppedHere = true;
      continue;
    }
    stack.push(e.i);
    pushes++;
    const top = stopTop ?? undefined;
    const kind = e.i === n ? "end" : stopTop !== null ? "stop" : "push";
    add({
      kind,
      i: e.i,
      cur,
      ...(top === undefined ? {} : { top }),
      pushes,
      pops,
      afterPops: poppedHere,
    });
    stopTop = null;
  }
  return steps;
}

/** 전개 입력의 걸음 — 본문 · 필름 · 패널이 같은 번호를 쓴다. */
export const WALK_STEPS: readonly WalkStep[] = walkOf(WALK);

/** 단조 스택 띠의 칸 수 — 전개에서 단조 스택이 가장 깊었을 때(nextGreaterElement 의 스택 띠와 같은 약속). */
export const STACK_SLOTS = Math.max(...WALK_STEPS.map((s) => s.stack.length));

const pad = <T,>(xs: readonly T[], slots: number): (T | null)[] =>
  Array.from({ length: slots }, (_, k) => xs[k] ?? null);

/** 자리 `p` 의 높이 — 보초 자리 `N` 은 0 이다. */
const heightAt = (heights: readonly number[], p: number): number =>
  p < heights.length ? (heights[p] as number) : 0;

/** 단조 스택 띠 두 줄 — 자리 번호 줄(`stack`)과 그 자리의 높이 줄. 바닥이 왼쪽, 꼭대기가 오른쪽이다. */
export function stackLayers(
  heights: readonly number[],
  stack: readonly number[],
  marks: { read?: number[]; write?: number[] } = {},
  slots = STACK_SLOTS,
): ArrayLayer[] {
  const hs = stack.map((p) => heightAt(heights, p));
  return [
    {
      name: "stack",
      values: pad(stack, slots),
      read: marks.read ?? [],
      write: marks.write ?? [],
      caret: false,
      side: stack.length === 0 ? "비었다" : `꼭대기 = 자리 ${stack.at(-1)}`,
    },
    {
      name: "stack 의 높이",
      values: pad(hs, slots),
      read: marks.read ?? [],
      write: marks.write ?? [],
      caret: false,
      side: hs.length === 0 ? "비었다" : hs.join(" ≤ "),
    },
  ];
}

/** 꺼낸 자리가 높이를 정하는 직사각형 — 두 경계 사이의 칸을 괄호로 덮는다. */
export function rectPiece(
  heights: readonly number[],
  top: number,
  left: number,
  width: number,
  tone: "left" | "right" = "left",
): ArrayPiece {
  const h = heightAt(heights, top);
  return {
    label: `자리 ${top}`,
    from: left + 1,
    to: left + width,
    tone,
    text: `높이 ${h} · 폭 ${width} · 넓이 ${h * width}`,
  };
}

/** 배열 무대의 이름표 — 패널(`.sim.ts`)과 필름이 같이 쓴다. 쥔 구간은 이미 읽은 자리다. */
export const ARRAY_OPTIONS: ArrayOptions = {
  arrayName: "heights",
  rangeLabel: "읽은 자리",
};

const iName = (i: number): string =>
  i === WALK.length ? `i = ${i}(보초)` : `i = ${i}`;

function stepTitle(s: WalkStep): string {
  const h = (p: number) => heightAt(WALK, p);
  switch (s.kind) {
    case "push":
      return `자리 ${s.i} 넣기`;
    case "stop":
      return `${h(s.top as number)} ≤ ${s.cur} · 멈추고 자리 ${s.i} 넣기`;
    case "pop":
      return `${h(s.top as number)} > ${s.cur} · 자리 ${s.top} 꺼내고 넓이 ${s.area}`;
    case "end":
      return `보초 자리 ${s.i} 넣고 best ${s.best} 반환`;
  }
}

function stepText(s: WalkStep): string {
  const h = (p: number) => heightAt(WALK, p);
  const where =
    s.i === WALK.length ? "보초 걸음이라 지금 높이가 0 입니다. " : "";
  switch (s.kind) {
    case "push":
      return s.afterPops
        ? `꺼낼 꼭대기가 더 없어 반복이 끝났습니다. 자리 ${s.i}${을를(s.i)} 넣습니다. 그 높이는 ${h(s.i)} 입니다.`
        : `단조 스택이 비어 비교할 꼭대기가 없습니다. 자리 ${s.i}${을를(s.i)} 넣습니다. 그 높이는 ${h(s.i)} 입니다.`;
    case "stop": {
      const t = s.top as number;
      return `꼭대기 자리 ${t} 의 높이 ${h(t)}${이가(h(t))} 지금 높이 ${s.cur} 보다 높지 않아 멈춥니다. 자리 ${s.i}${을를(s.i)} 넣습니다.`;
    }
    case "pop": {
      const t = s.top as number;
      const left =
        s.left === -1
          ? "꺼낸 뒤 단조 스택이 비어 왼쪽 경계는 -1 입니다"
          : `꺼낸 뒤 꼭대기 자리 ${s.left}${이가(s.left as number)} 왼쪽 경계입니다`;
      return `${where}꼭대기 자리 ${t} 의 높이 ${h(t)}${이가(h(t))} 지금 높이 ${s.cur} 보다 높아 꺼냅니다. 오른쪽 경계는 ${s.i} 이고, ${left}. 폭 ${s.width} 의 넓이는 ${s.area} 입니다.`;
    }
    case "end":
      return `꺼낼 꼭대기가 더 없어 반복이 끝났습니다. 보초 자리 ${s.i}${을를(s.i)} 넣고 순회를 마칩니다. best ${s.best}${을를(s.best)} 돌려줍니다.`;
  }
}

function stepCalc(s: WalkStep): ArrayStep["calc"] {
  const h = (p: number) => heightAt(WALK, p);
  switch (s.kind) {
    case "push":
      return { expr: "stack.length > 0", result: "거짓 · 넣는다" };
    case "stop":
      return {
        expr: `heights[${s.top}] > cur → ${h(s.top as number)} > ${s.cur}`,
        result: "거짓 · 멈춘다",
      };
    case "pop":
      return {
        expr: `${h(s.top as number)} × (${s.i} − (${s.left}) − 1)`,
        result: `${s.area}`,
      };
    case "end":
      return { expr: "stack.length > 0", result: "거짓 · 반복이 끝난다" };
  }
}

/** 걸음 하나를 배열 무대의 걸음으로 — 걸음 재생 패널과 정적 필름이 같은 값을 쓴다. */
export function arrayStep(s: WalkStep): ArrayStep {
  const n = WALK.length;
  const topSlot = s.stack.length - 1;
  const inArray = (p: number[]) => p.filter((q) => q < n);
  const read =
    s.kind === "end"
      ? []
      : s.top === undefined
        ? inArray([s.i])
        : inArray([s.top, s.i]).sort((a, b) => a - b);
  const stackRead =
    s.kind === "stop"
      ? [topSlot - 1]
      : s.kind === "pop" && topSlot >= 0
        ? [topSlot]
        : [];
  const stackWrite = s.kind === "pop" ? [] : [topSlot];
  return {
    array: [...WALK],
    range: [0, Math.min(s.i, n - 1)],
    read,
    write: [],
    pointers: s.top === undefined || s.kind === "end" ? {} : { top: s.top },
    calc: stepCalc(s),
    vars: `${iName(s.i)} · best = ${s.best} · 넣기 ${s.pushes} · 꺼내기 ${s.pops}`,
    ...(s.kind === "pop"
      ? {
          pieces: [
            rectPiece(
              WALK,
              s.top as number,
              s.left as number,
              s.width as number,
            ),
          ],
        }
      : {}),
    layers: stackLayers(WALK, s.stack, { read: stackRead, write: stackWrite }),
  };
}

/**
 * 걸음 재생 패널(`.sim.ts`)의 걸음 — 정본 실행에서 만든다. `.sim.ts` 의 `steps` 는 이 결과를 글자 그대로 옮긴
 * 인라인 리터럴이고(P3 이 정적으로 세려면 리터럴이어야 한다), 둘이 같은지는
 * `largestRectangleInHistogram-guide.test.ts` 가 잰다.
 */
export function simStepsFromRef() {
  return WALK_STEPS.map((s) => ({
    title: `${s.id} ${stepTitle(s)}`,
    text: stepText(s),
    ...arrayStep(s),
  }));
}

const filmOf = (steps: readonly WalkStep[]): StageFrame[] =>
  steps.map((s) => ({
    id: s.id,
    text: stepTitle(s),
    rows: arrayStage(arrayStep(s), ARRAY_OPTIONS),
  }));

/** 자리 `i` 까지 처리를 마친 뒤(넣기까지 끝난 뒤)의 걸음. */
export const afterRead = (i: number): WalkStep =>
  [...WALK_STEPS]
    .reverse()
    .find(
      (s) => (s.kind === "push" || s.kind === "stop") && s.i === i,
    ) as WalkStep;

/** 전개 입력에서 자리마다 꺼낼 때 받은 두 경계 · 폭 · 넓이. */
export const POPPED: readonly WalkStep[] = [...WALK_STEPS]
  .filter((s) => s.kind === "pop")
  .sort((a, b) => (a.top as number) - (b.top as number));

/* ───────────────── 「아이디어를 떠올리는 과정」의 시도 넷 ───────────────── */

/** 과제 규모에서 구간을 전부 열거하는 방법의 접근 수 — 식 `N(N+1)/2` 로 낸다. 식은 작은 N 에서 실측과 대조한다. */
export const naiveCount = (n: number): number => (n * (n + 1)) / 2;
/** 증가 수열에서 정본의 접근 수 — 식 `8N − 2`. 작은 N 에서 실측과 대조한다. */
export const stackOnUp = (n: number): number => 8 * n - 2;

for (const n of [1_000, 2_000]) {
  if (allIntervals(up(n)).acc !== naiveCount(n)) {
    throw new Error(`N = ${n} 에서 구간 열거의 실측이 식과 다르다`);
  }
  if (count(up(n)).acc !== stackOnUp(n)) {
    throw new Error(`N = ${n} 증가 수열에서 정본의 실측이 8N − 2 와 다르다`);
  }
}

export const seconds = (ops: number): string =>
  `${(ops / OPS_PER_SECOND).toFixed(2)} 초`;

function approaches(): Approach[] {
  const naive = naiveCount(TASK_N);
  const flatBig = expandBoth(flat(BIG_N));
  const two = twoPass(BIG);
  const one = count(BIG);
  return [
    {
      name: "구간을 전부 열거하기",
      idea: "왼쪽 끝을 고정하고 오른쪽 끝을 늘리며 (칸 수) × (최솟값) 을 잰다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `N = ${num(TASK_N)} 에서 배열 접근 ${num(naive)} 번 · ${seconds(naive)}`,
          ok: false,
        },
      ],
      lesson:
        "구간의 높이는 그 안의 가장 낮은 막대가 정한다 — 막대마다 가장 넓은 구간 하나만 보면 되지 않을까",
    },
    {
      name: "막대마다 양쪽으로 뻗기",
      idea: "자리 j 에서 heights[j] 이상인 동안 왼쪽 · 오른쪽으로 걸어가 폭을 잰다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "시간",
          value: `높이가 전부 같은 ${num(BIG_N)} 칸에서 배열 접근 ${num(flatBig.acc)} 번 · 구간 열거와 같은 규모`,
          ok: false,
        },
      ],
      lesson:
        "경계는 「처음 만나는 더 낮은 막대」다 — 단조 스택이 한 번의 순회로 답하는 물음이다",
    },
    {
      name: "단조 스택을 두 번 쓰기",
      idea: "오른쪽 경계와 왼쪽 경계를 한 번씩 따로 구해 배열에 적고, 자리마다 넓이를 낸다",
      verdict: "drop",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "비용",
          value: `${num(BIG_N)} 칸에서 배열 접근 ${num(two.acc)} 번 · 추가로 잡는 칸 ${num(two.extra)} 칸`,
          ok: false,
        },
      ],
      lesson:
        "꺼낼 때 남은 꼭대기가 이미 왼쪽 경계다 — 한 번의 순회에서 두 경계를 함께 얻을 수 없을까",
    },
    {
      name: "단조 스택 한 번 · 꺼낼 때 넓이 내기",
      idea: "꺼내는 순간 오른쪽 경계는 지금 자리, 왼쪽 경계는 남은 꼭대기로 넓이를 낸다",
      verdict: "keep",
      checks: [
        { label: "답", value: "맞다", ok: true },
        {
          label: "비용",
          value: `${num(BIG_N)} 칸에서 배열 접근 ${num(one.acc)} 번 · 추가로 잡는 칸 ${num(one.peak)} 칸`,
          ok: true,
        },
      ],
    },
  ];
}

/* ───────────────────────── 그림 ───────────────────────── */

/** 높이 줄 하나와 괄호들 — 걸음 표지 없이 그 순간의 모양만 그린다. */
function heightsRows(
  states: Partial<Record<number, CellState>> = {},
  side?: string,
): StageRow[] {
  return [
    { kind: "index", label: "자리" },
    {
      kind: "cells",
      label: "heights",
      values: [...WALK],
      states,
      ...(side === undefined ? {} : { side }),
    },
  ];
}

/** 자리 `i` 까지 읽은 뒤의 무대 줄 — 걸음 표지 없이 그 순간의 상태만 그린다. */
function momentStep(
  s: WalkStep,
  extra: { read?: number[]; pieces?: ArrayPiece[] } = {},
): ArrayStep {
  return {
    array: [...WALK],
    range: [0, Math.min(s.i, WALK.length - 1)],
    read: extra.read ?? [],
    write: [],
    ...(extra.pieces === undefined ? {} : { pieces: extra.pieces }),
    layers: stackLayers(WALK, s.stack),
  };
}

export const FIGS: Record<string, () => ReactElement> = {
  "concept-answer": () => {
    const top = [...POPPED].sort(
      (a, b) => (b.area as number) - (a.area as number),
    )[0] as WalkStep;
    const rows: StageRow[] = [
      ...heightsRows(),
      {
        kind: "bracket",
        label: "답",
        from: (top.left as number) + 1,
        to: (top.left as number) + (top.width as number),
        tone: "query",
        text: `높이 ${WALK[top.top as number]} · 폭 ${top.width} · 넓이 ${top.area}`,
      },
    ];
    return (
      <CellStage
        title={`heights = ${show(WALK)} 에서 가장 큰 직사각형 — 자리 ${(top.left as number) + 1}~${(top.left as number) + (top.width as number)}`}
        columns={WALK.length}
        rows={rows}
      />
    );
  },
  "concept-per-bar": () => (
    <LayerBars
      title="막대마다 자기가 가장 낮은 막대인 가장 넓은 구간"
      values={[...WALK]}
      valuesLabel="heights"
      indexLabel="자리"
      groups={[
        POPPED.map((s) => ({
          label: `자리 ${s.top}`,
          from: (s.left as number) + 1,
          to: (s.left as number) + (s.width as number),
          note: `높이 ${WALK[s.top as number]} · 폭 ${s.width} · 넓이 ${s.area}`,
        })),
      ]}
    />
  ),
  "concept-one-read": () => {
    const before = afterRead(3);
    const after = afterRead(4);
    const here = WALK_STEPS.filter((s) => s.kind === "pop" && s.i === 4);
    const frames: StageFrame[] = [
      {
        id: "전",
        text: `자리 3 까지 읽은 뒤 — 단조 스택에 자리 ${dots(before.stack)}`,
        rows: arrayStage(momentStep(before), ARRAY_OPTIONS),
      },
      {
        id: "후",
        text: `자리 4 의 높이 ${WALK[4]}${을를(WALK[4] as number)} 읽은 뒤 — 자리 ${dots(here.map((s) => s.top as number))}${이가(here.at(-1)?.top ?? "")} 꺼내지며 직사각형 ${here.length} 개가 정해진다`,
        rows: arrayStage(
          momentStep(after, {
            read: [4],
            pieces: here.map((s, k) =>
              rectPiece(
                WALK,
                s.top as number,
                s.left as number,
                s.width as number,
                k % 2 === 0 ? "left" : "right",
              ),
            ),
          }),
          ARRAY_OPTIONS,
        ),
      },
    ];
    return (
      <CellStageFilm
        title={`높이 ${WALK[4]} 하나를 읽는 순간 직사각형 ${here.length} 개의 양 끝이 정해진다`}
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "origin-expand": () => {
    const { spans } = expandBoth(WALK);
    const frames: StageFrame[] = spans.map(({ j, l, r, read }) => ({
      id: `j=${j}`,
      text: `자리 ${j}(높이 ${WALK[j]}) — 자리 ${dots(read)}${을를(read.at(-1) ?? "")} 읽고 폭 ${r - l + 1} · 넓이 ${(WALK[j] as number) * (r - l + 1)}`,
      rows: arrayStage(
        {
          array: [...WALK],
          range: [l, r],
          read,
          write: [],
          pointers: { j },
        },
        { arrayName: "heights", rangeLabel: "뻗은 구간" },
      ),
    }));
    return (
      <CellStageFilm
        title="막대마다 양쪽으로 뻗으면 — 같은 칸을 여러 막대가 다시 읽는다"
        columns={WALK.length}
        frames={frames}
      />
    );
  },
  "origin-approaches": () => {
    const steps = approaches();
    return (
      <ApproachLadder
        title="시도한 방법 넷 — 셋은 버렸고 하나가 남았다"
        constraint={`배열 길이 N ≤ ${num(TASK_N)} · 1 초(단순 연산 1 초에 1 억 번 기준) · 비용은 배열 접근 수`}
        steps={steps}
        width={approachLadderWidth(steps)}
      />
    );
  },
  "build-on-input": () => {
    const s = afterRead(5);
    const states: Partial<Record<number, CellState>> = {};
    WALK.forEach((_, p) => {
      if (!s.stack.includes(p)) states[p] = "out";
    });
    const layers = stackLayers(WALK, s.stack);
    const rows: StageRow[] = [
      ...heightsRows(states, `단조 스택에 ${s.stack.length} 자리`),
      ...layers.map(
        (l): StageRow => ({
          kind: "cells",
          label: l.name,
          values: l.values,
          ...(l.side === undefined ? {} : { side: l.side }),
        }),
      ),
    ];
    return (
      <CellStage
        title={`자리 ${s.i} 까지 읽은 뒤의 단조 스택 — 칸마다 heights 의 한 자리를 가리킨다`}
        columns={WALK.length}
        rows={rows}
      />
    );
  },
  "pause-width-wide": () => {
    const s = WALK_STEPS.find(
      (t) => t.kind === "pop" && t.top === 2,
    ) as WalkStep;
    const left = s.left as number;
    const h = WALK[s.top as number] as number;
    const rows: StageRow[] = [
      ...heightsRows({ [left]: "read" }),
      {
        kind: "bracket",
        label: "i − left − 1",
        from: left + 1,
        to: s.i - 1,
        tone: "left",
        text: `폭 ${s.i - left - 1} · 넓이 ${h * (s.i - left - 1)}`,
      },
      {
        kind: "bracket",
        label: "i − left",
        from: left,
        to: s.i - 1,
        tone: "right",
        text: `폭 ${s.i - left} · 넓이 ${h * (s.i - left)}`,
      },
    ];
    return (
      <CellStage
        title={`자리 ${s.top}${을를(s.top as number)} 자리 ${s.i} 에서 꺼낼 때 — 1 을 안 빼면 왼쪽 경계 자리 ${left} 까지 덮는다`}
        columns={WALK.length}
        rows={rows}
      />
    );
  },
  "walk-film": () => (
    <CellStageFilm
      title={`largestRectangleInHistogram(${show(WALK).replace(/ /g, ", ")}) — T1~T${WALK_STEPS.length}`}
      columns={arrayColumns(arrayStep(WALK_STEPS[0] as WalkStep))}
      frames={filmOf(WALK_STEPS)}
    />
  ),
  "related-groups": () => {
    const n = WALK.length;
    const rows: StageRow[] = [
      ...heightsRows(),
      ...POPPED.map((s): StageRow => {
        const j = s.top as number;
        let size = 0;
        for (let l = 0; l < n; l++) {
          for (let r = l; r < n; r++) {
            let m = l;
            for (let p = l; p <= r; p++)
              if ((WALK[p] as number) < (WALK[m] as number)) m = p;
            if (m === j) size++;
          }
        }
        return {
          kind: "bracket",
          label: `자리 ${j}`,
          from: (s.left as number) + 1,
          to: (s.left as number) + (s.width as number),
          tone: j % 2 === 0 ? "left" : "right",
          text: `구간 ${size} 개`,
        };
      }),
    ];
    return (
      <CellStage
        title="구간마다 가장 왼쪽 최솟값 자리를 대표로 — 대표마다 맡는 구간의 수"
        columns={n}
        rows={rows}
      />
    );
  },
};
