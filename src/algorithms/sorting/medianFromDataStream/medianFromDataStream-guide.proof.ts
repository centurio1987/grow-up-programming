/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.md
 *
 * **전개의 걸음은 정본 실행에 기록을 붙여 받는다**(`walkSteps`). 정본 `MedianFinder` 한 벌을 만들고, 그 안의
 * 두 힙 객체(정본의 `Heap`)의 `push`·`pop` 만 감싸 연산마다 두 힙의 배열을 떠 둔다. `addNum` 의 세 줄은
 * 정본이 그대로 실행하므로 「이 코드가 그렇게 움직인다」가 기록에서 나온다. 그림 사이드카와 걸음 재생
 * 패널도 같은 기록을 쓴다.
 *
 * **계수를 세는 힙 사본은 `.alt.ts` 가 갖는다.** 정본은 몇 번 비교했는지를 내보내지 않으므로 세는 자리를
 * 덧붙인 사본이 있어야 하는데, 그 사본이 두 벌이면 두 벌이 갈린다. 경쟁 설계와 같은 자로 재야 하는
 * 것도 같은 이유다. 큰 입력(수 4,096 개 · 50,000 개)은 이 세는 사본으로만 재고 배열을 베끼지 않는다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 블록의 「답」 칸은 전부 정본이나 정본에서 기계로
 * 만든 변이가 낸 값이다. 손으로 적은 절차가 둘 있는데(값으로만 갈라 넣는 판 · 알맞은 쪽에 바로 넣는
 * 판) 둘 다 **줄을 더하고 빼는 변경**이라 `loadMutant`(한 줄 삭제·치환)로 만들 수 없다. 앞의 판은
 * 힙으로 정본의 `Heap` 을 쓴다.
 */
import { join } from "node:path";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  CountedHeap,
  CountedMedianFinder,
  type Counts,
  runHeaps,
  runSelect,
  streamValue,
  total,
} from "./medianFromDataStream-guide.alt.ts";
import { Heap, MedianFinder } from "./medianFromDataStream-guide.ref.ts";

const REF = join(import.meta.dir, "medianFromDataStream-guide.ref.ts");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 수열. 다섯 개이고 갈래를 한 벌에서 전부 실행한다 — 도로 옮기는 갈래의
 * 참과 거짓, 중앙값의 두 갈래(두 크기가 같을 때와 다를 때)다. 마지막 `5` 는 앞에 이미 있는
 * 값이라 중복이 어떻게 다뤄지는지도 같은 자리에서 나온다.
 */
export const WALK: readonly number[] = [5, 15, 1, 3, 5];

/** 전개 입력 다섯에 일곱을 이어 붙인 열둘. 경계 자리를 스윕하는 자리가 쓴다. */
const SWEEP_INPUT: readonly number[] = [5, 15, 1, 3, 5, 9, 2, 12, 7, 4, 11, 8];

/** 오름차순으로만 들어오는 짧은 수열. 「값으로만 가른다」가 어디서 실패하는지 보이는 자리다. */
const ASCENDING: readonly number[] = [1, 2, 3, 4, 5, 6];

/** 과제의 규모 — 호출 100,000 번을 넣기와 묻기로 반씩 나눈다. */
export const CALLS = 100_000;
export const ADDS = CALLS / 2;

/** 생성식 입력의 길이 — `.alt.ts` 와 같다. */
const GEN = 4096;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** `19,999,600,002` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 단순 연산 1 초에 1 억 번 기준(본문과 같다). */
export const seconds = (ops: number): string => {
  const s = ops / 1e8;
  return `${s >= 10 ? s.toFixed(0) : s.toFixed(2)} 초`;
};

/** 힙 내용을 `5 1 3` 꼴로 적는다. 비면 「비어 있음」. */
export const row = (xs: readonly number[]): string =>
  xs.length === 0 ? "비어 있음" : xs.join(" ");

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

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 등폭 표 한 벌 — 펜스 블록에 싣는다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 이름과 값 목록 — 값 열의 자리를 가장 긴 이름에서 잰다. */
function list(rows: [string, string][], gap = 2): string[] {
  const w = Math.max(...rows.map(([name]) => width(name)));
  return rows.map(
    ([name, value]) => `  ${pad(name, w)}${" ".repeat(gap)}${value}`,
  );
}

/** 「이라/라」·「이고/고」 — 계사가 갈리는 자리. */
const 이라 = (x: string | number): string => josa(x, "이라", "라");

/* ────────────────────── 참값 — 정렬해서 고른다 ────────────────────── */

/** 정의 그대로의 중앙값. 다른 절차가 낸 답을 비교하는 기준이다. */
export function trueMedian(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (n % 2 === 1) return s[(n - 1) / 2] as number;
  return ((s[n / 2 - 1] as number) + (s[n / 2] as number)) / 2;
}

export const sorted = (xs: readonly number[]): number[] =>
  [...xs].sort((a, b) => a - b);

/** 정본이 그 수열에서 걸음마다 내놓는 답. */
function refAnswers(values: readonly number[]): number[] {
  const mf = new MedianFinder();
  return values.map((v) => {
    mf.addNum(v);
    return mf.findMedian();
  });
}

/* ───────────────── 정본 힙의 안 — 배열과 꺼낼 차례 ───────────────── */

/** 힙 하나의 배열(정렬하지 않은 실제 순서)과 방향. 정본의 비공개 필드를 실행 중에 읽는다. */
interface HeapInside {
  items: number[];
  sign: number;
}

const inside = (h: unknown): HeapInside => h as HeapInside;

/** 두 힙 쌍 — 정본 `MedianFinder` 의 비공개 필드 `low`·`high`. */
const pair = (mf: unknown): { low: Heap; high: Heap } =>
  mf as { low: Heap; high: Heap };

/**
 * 힙 배열을 **꺼낼 차례대로** — 같은 방향의 정본 힙 하나에 다 넣고 빌 때까지 꺼낸 차례다. 첫 칸이 곧
 * 다음에 꺼낼 꼭대기다(`dijkstra` 편이 세운 우선순위 큐 띠 규약).
 */
export function drainOrder(items: readonly number[], sign: number): number[] {
  const h = new Heap(sign);
  for (const v of items) h.push(v);
  const out: number[] = [];
  while (h.size() > 0) out.push(h.pop());
  return out;
}

export const LOW = -1;
export const HIGH = 1;

/** 두 힙을 꺼낼 차례로. */
export const lowOrder = (s: { low: readonly number[] }): number[] =>
  drainOrder(s.low, LOW);
export const highOrder = (s: { high: readonly number[] }): number[] =>
  drainOrder(s.high, HIGH);

/* ───────────────── 전개 — 정본 실행에 기록을 붙인다 ───────────────── */

/** 힙 연산 하나와 그 직후 두 힙의 배열. */
export interface Op {
  readonly heap: "low" | "high";
  readonly kind: "push" | "pop";
  readonly value: number;
  readonly low: readonly number[];
  readonly high: readonly number[];
}

/** 정본 `MedianFinder` 한 벌 — 두 힙 객체의 `push`·`pop` 에만 기록을 붙였다. */
function recorded(): { mf: MedianFinder; ops: Op[] } {
  const mf = new MedianFinder();
  const heaps = pair(mf);
  const ops: Op[] = [];
  const snap = () => ({
    low: [...inside(heaps.low).items],
    high: [...inside(heaps.high).items],
  });
  for (const side of ["low", "high"] as const) {
    const h = heaps[side];
    const push = h.push.bind(h);
    const pop = h.pop.bind(h);
    h.push = (v: number) => {
      push(v);
      ops.push({ heap: side, kind: "push", value: v, ...snap() });
    };
    h.pop = () => {
      const v = pop();
      ops.push({ heap: side, kind: "pop", value: v, ...snap() });
      return v;
    };
  }
  return { mf, ops };
}

/** 두 힙의 배열 한 쌍. */
export interface Pair {
  readonly low: readonly number[];
  readonly high: readonly number[];
}

/** `addNum` 한 번이 남긴 연산을 세 줄로 가른다. */
export interface AddRecord {
  readonly num: number;
  /** ① 뒤 — 작은 쪽에 넣은 직후. */
  readonly afterPush: Pair;
  /** ② 뒤 — 작은 쪽 꼭대기를 큰 쪽에 넣은 직후. */
  readonly afterMove: Pair;
  /** ② 에서 넘어간 값. */
  readonly moved: number;
  /** ③ 이 참이면 도로 옮긴 값. 거짓이면 `null`. */
  readonly returned: number | null;
  /** ③ 뒤 — 이 `addNum` 이 끝난 상태. */
  readonly end: Pair;
  /** 이 `addNum` 이 부른 힙 연산 전부. */
  readonly ops: readonly Op[];
}

/** 수열을 정본에 차례로 넣으며 `addNum` 마다 세 줄의 자취와 그 뒤 `findMedian` 의 답을 받는다. */
export function runRecorded(values: readonly number[]): {
  adds: AddRecord[];
  answers: number[];
} {
  const { mf, ops } = recorded();
  const adds: AddRecord[] = [];
  const answers: number[] = [];
  for (const num of values) {
    const from = ops.length;
    mf.addNum(num);
    const mine = ops.slice(from);
    const [p1, pop, p2, back, p3] = mine;
    const shape =
      p1?.heap === "low" &&
      p1.kind === "push" &&
      pop?.heap === "low" &&
      pop.kind === "pop" &&
      p2?.heap === "high" &&
      p2.kind === "push" &&
      (mine.length === 3 ||
        (mine.length === 5 &&
          back?.heap === "high" &&
          back.kind === "pop" &&
          p3?.heap === "low" &&
          p3.kind === "push"));
    if (!shape || p1 === undefined || p2 === undefined || pop === undefined) {
      throw new Error(`addNum(${num}) 의 힙 연산이 세 줄의 모양이 아니다`);
    }
    const last = mine.at(-1) as Op;
    adds.push({
      num,
      afterPush: p1,
      afterMove: p2,
      moved: pop.value,
      returned: back === undefined ? null : back.value,
      end: { low: last.low, high: last.high },
      ops: mine,
    });
    answers.push(mf.findMedian());
  }
  const want = refAnswers(values);
  if (answers.join(",") !== want.join(",")) {
    throw new Error("기록을 붙인 정본이 정본과 다른 답을 냈다");
  }
  return { adds, answers };
}

/** 전개 걸음 하나 — 그 걸음이 끝난 뒤의 상태. */
export interface WalkStep extends Pair {
  readonly id: string;
  /** 한 일 — 표의 「한 일」 칸과 패널 제목이 쓴다. */
  readonly did: string;
  /** 이 걸음에 실행한 갈래 — `①` · `②` · `③ 참 · ④ 거짓` 꼴. 없으면 `-`. */
  readonly branch: string;
  /** 이 걸음이 끝났을 때 들어온 수의 개수. */
  readonly n: number;
  /** 이 걸음에 넣고 있는 수의 자리(전개 입력의 인덱스). 없으면 `null`. */
  readonly current: number | null;
  /** 이 걸음이 시작할 때의 두 힙. */
  readonly before: Pair;
  /** 이 걸음에 부른 힙 연산. */
  readonly ops: readonly Op[];
  /** 이 걸음이 물어본 답. 안 물었으면 `null`. */
  readonly median: number | null;
  /** 답을 만든 식 — 알약에 싣는다. 안 물었으면 `null`. */
  readonly expr: string | null;
  /** ③ 이 참이었나 · ④ 가 참이었나. 그 갈래를 안 지났으면 `null`. */
  readonly moveBack: boolean | null;
  readonly even: boolean | null;
  /** 이 걸음의 한 줄 설명(패널과 필름이 쓴다). */
  readonly text: string;
}

/** 답을 만드는 식 한 줄. */
function answerExpr(s: Pair): string {
  const a = lowOrder(s)[0] as number;
  if (s.low.length === s.high.length) {
    const b = highOrder(s)[0] as number;
    return `(${a} + ${b}) / 2`;
  }
  return `작은 쪽 꼭대기 ${a}`;
}

/**
 * 전개의 아홉 걸음. 첫 수 하나는 `addNum` 의 세 줄을 갈라 T2·T3·T4 로 보이고, 그 뒤 넷은 한 걸음이
 * `addNum` 한 벌과 `findMedian` 한 벌이다. T9 는 다섯 수가 다 들어온 상태다.
 */
export function walkSteps(): WalkStep[] {
  const { adds, answers } = runRecorded(WALK);
  const empty: Pair = { low: [], high: [] };
  const steps: WalkStep[] = [];
  steps.push({
    id: "T1",
    did: "시작값",
    branch: "-",
    ...empty,
    n: 0,
    current: null,
    before: empty,
    ops: [],
    median: null,
    expr: null,
    moveBack: null,
    even: null,
    text: "두 힙이 모두 비어 있습니다. 아직 들어온 수가 없어 물어볼 수도 없습니다.",
  });
  const first = adds[0] as AddRecord;
  const v0 = first.num;
  steps.push({
    id: "T2",
    did: `addNum(${v0}) ①`,
    branch: "①",
    ...first.afterPush,
    n: 1,
    current: 0,
    before: empty,
    ops: first.ops.slice(0, 1),
    median: null,
    expr: null,
    moveBack: null,
    even: null,
    text: `${v0}${을를(v0)} 어느 쪽에 속하는지 비교하지 않고 작은 쪽에 넣습니다. 갈래 ① 입니다.`,
  });
  steps.push({
    id: "T3",
    did: `addNum(${v0}) ②`,
    branch: "②",
    ...first.afterMove,
    n: 1,
    current: 0,
    before: first.afterPush,
    ops: first.ops.slice(1, 3),
    median: null,
    expr: null,
    moveBack: null,
    even: null,
    text: `작은 쪽의 꼭대기 ${first.moved}${을를(first.moved)} 꺼내 큰 쪽에 넣습니다. 갈래 ② 입니다.`,
  });
  const a0 = answers[0] as number;
  const back0 = first.returned !== null;
  const even0 = first.end.low.length === first.end.high.length;
  steps.push({
    id: "T4",
    did: `addNum(${v0}) ③ · findMedian`,
    branch: `③ ${back0 ? "참" : "거짓"} · ④ ${even0 ? "참" : "거짓"}`,
    ...first.end,
    n: 1,
    current: 0,
    before: first.afterMove,
    ops: first.ops.slice(3),
    median: a0,
    expr: answerExpr(first.end),
    moveBack: back0,
    even: even0,
    text: `큰 쪽 ${first.afterMove.high.length} 개가 작은 쪽 ${first.afterMove.low.length} 개보다 많아 ${first.returned}${을를(String(first.returned))} 도로 옮깁니다(③ 참). 두 크기가 ${first.end.low.length}${과와(first.end.low.length)} ${first.end.high.length}${으로(first.end.high.length)} 달라 작은 쪽 꼭대기 ${a0}${이가(a0)} 답입니다(④ 거짓).`,
  });
  for (let i = 1; i < adds.length; i++) {
    const r = adds[i] as AddRecord;
    const prev = adds[i - 1] as AddRecord;
    const back = r.returned !== null;
    const even = r.end.low.length === r.end.high.length;
    const ans = answers[i] as number;
    const moveText = back
      ? `큰 쪽이 ${r.afterMove.high.length} 개로 많아져 ${r.returned}${을를(String(r.returned))} 도로 옮깁니다(③ 참)`
      : `두 크기가 ${r.afterMove.low.length}${과와(r.afterMove.low.length)} ${r.afterMove.high.length}${이라(r.afterMove.high.length)} 도로 옮기지 않습니다(③ 거짓)`;
    const ansText = even
      ? `두 크기가 같아 두 꼭대기의 평균 ${ans}${이가(ans)} 답입니다(④ 참)`
      : `두 크기가 달라 작은 쪽 꼭대기 ${ans}${이가(ans)} 답입니다(④ 거짓)`;
    steps.push({
      id: `T${i + 4}`,
      did: `addNum(${r.num}) · findMedian`,
      branch: `③ ${back ? "참" : "거짓"} · ④ ${even ? "참" : "거짓"}`,
      ...r.end,
      n: i + 1,
      current: i,
      before: prev.end,
      ops: r.ops,
      median: ans,
      expr: answerExpr(r.end),
      moveBack: back,
      even,
      text: `${r.num}${을를(r.num)} 작은 쪽에 넣고 꼭대기 ${r.moved}${을를(r.moved)} 큰 쪽으로 옮깁니다. ${moveText}. ${ansText}.`,
    });
  }
  const last = adds.at(-1) as AddRecord;
  const final = answers.at(-1) as number;
  const med = trueMedian(WALK);
  steps.push({
    id: `T${adds.length + 4}`,
    did: "종료",
    branch: "-",
    ...last.end,
    n: WALK.length,
    current: null,
    before: last.end,
    ops: [],
    median: final,
    expr: answerExpr(last.end),
    moveBack: null,
    even: null,
    text: `다섯 수가 다 들어왔습니다. 정렬하면 ${sorted(WALK).join(" ")} 이고, 가운데 자리의 값 ${med}${이가(med)} 작은 쪽 꼭대기와 같습니다.`,
  });
  return steps;
}

let walkMemo: WalkStep[] | undefined;
export const walk = (): WalkStep[] => {
  walkMemo ??= walkSteps();
  return walkMemo;
};

/* ────────────── 기법 없는 설계 둘 — 비교와 칸 쓰기를 센다 ────────────── */

/** 병합 정렬. 계수가 실행마다 같아야 해서 언어가 주는 정렬을 쓰지 않는다. */
function mergeSortCounted(a: number[], c: Counts): number[] {
  if (a.length <= 1) return a;
  const mid = a.length >> 1;
  const left = mergeSortCounted(a.slice(0, mid), c);
  const right = mergeSortCounted(a.slice(mid), c);
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    c.compares++;
    if ((left[i] as number) <= (right[j] as number)) {
      out.push(left[i++] as number);
    } else {
      out.push(right[j++] as number);
    }
    c.writes++;
  }
  while (i < left.length) {
    out.push(left[i++] as number);
    c.writes++;
  }
  while (j < right.length) {
    out.push(right[j++] as number);
    c.writes++;
  }
  return out;
}

/** 방식 A — 넣기는 칸 하나로 끝내고, 물어볼 때 전부 정렬한다. */
function runSortEveryTime(values: readonly number[]): Counts {
  const c: Counts = { compares: 0, writes: 0 };
  const kept: number[] = [];
  for (const v of values) {
    kept.push(v);
    c.writes++;
    mergeSortCounted(kept, c);
  }
  return c;
}

/** 방식 B — 정렬된 배열을 그대로 두고 새 수만 알맞은 자리에 끼워 넣는다. 셈만 남긴다. */
function runKeepSorted(values: readonly number[]): Counts {
  const c: Counts = { compares: 0, writes: 0 };
  const kept: number[] = [];
  for (const v of values) {
    let lo = 0;
    let hi = kept.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      c.compares++;
      if ((kept[mid] as number) < v) lo = mid + 1;
      else hi = mid;
    }
    kept.push(v);
    c.writes++;
    for (let t = kept.length - 1; t > lo; t--) {
      kept[t] = kept[t - 1] as number;
      c.writes++;
    }
    kept[lo] = v;
  }
  if (trueMedian(kept) !== trueMedian(values)) {
    throw new Error("끼워 넣기 판의 배열이 정렬 결과와 다르다");
  }
  return c;
}

/** `Σ_{n=1..N} (2n⌈log2 n⌉ − 2^⌈log2 n⌉ + 1)` — 매번 정렬하는 설계의 닫힌 형태 상한. */
function sortEveryTimeBound(n: number): number {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    const h = Math.ceil(Math.log2(i));
    sum += 2 * i * h - 2 ** h + 1;
  }
  return sum;
}

/** `Σ_{n=1..N} ⌈log2 n⌉ = N⌈log2 N⌉ − 2^⌈log2 N⌉ + 1`. */
function logSum(n: number): number {
  const h = Math.ceil(Math.log2(n));
  return n * h - 2 ** h + 1;
}

/**
 * 두 힙 설계의 비교 + 칸 쓰기 상한 — `17·Σ⌈log2 i⌉ + 5N`.
 *
 * 한 번의 `addNum` 은 힙 연산 다섯을 넘지 않는다(넣기 셋 · 꺼내기 둘). 힙 높이를 `h` 라 하면
 * 넣기 하나가 `3h + 1`, 꺼내기 하나가 `4h + 1` 이하이므로 `3(3h+1) + 2(4h+1) = 17h + 5` 다.
 */
function heapBound(n: number): number {
  return 17 * logSum(n) + 5 * n;
}

/** 과제 규모의 값 — 매번 정렬(상한) · 끼워 넣기(실측) · 두 힙(상한과 실측). */
export interface Scale {
  sortBound: number;
  keepSorted: number;
  heapBound: number;
  heapMeasured: number;
}

let scaleMemo: Scale | undefined;
export function scale(): Scale {
  if (scaleMemo !== undefined) return scaleMemo;
  const values = Array.from({ length: ADDS }, (_, i) => streamValue(i));
  const c: Counts = { compares: 0, writes: 0 };
  const mf = new CountedMedianFinder(c);
  for (const v of values) mf.addNum(v);
  if (mf.findMedian() !== trueMedian(values)) {
    throw new Error("세는 사본의 답이 정의와 다르다");
  }
  scaleMemo = {
    sortBound: sortEveryTimeBound(ADDS),
    keepSorted: total(runKeepSorted(values)),
    heapBound: heapBound(ADDS),
    heapMeasured: total(c),
  };
  return scaleMemo;
}

/** 중앙값 하나만 들고 있는 판을 반박하는 두 수열 — 옛 중앙값과 새 수가 같은데 새 중앙값이 다르다. */
export const ONE_VALUE_CASES: readonly (readonly number[])[] = [
  [1, 5, 15],
  [4, 5, 15],
];
export const ONE_VALUE_ADD = 3;

/* ────────────── 손으로 적은 두 판 — 변이로는 못 만든다 ────────────── */

/** 값이 작은 쪽 꼭대기 이하면 작은 쪽에, 아니면 큰 쪽에 넣고 **개수는 맞추지 않는다**. */
class ValueSplitMedian {
  readonly low = new Heap(LOW);
  readonly high = new Heap(HIGH);

  addNum(num: number): void {
    if (this.low.size() === 0 || num <= this.low.peek()) this.low.push(num);
    else this.high.push(num);
  }

  findMedian(): number {
    if (this.low.size() === this.high.size()) {
      return (this.low.peek() + this.high.peek()) / 2;
    }
    return this.low.peek();
  }
}

/** 알맞은 쪽에 바로 넣고 그다음 개수를 맞춘다. 답은 정본과 같고 계수만 갈린다. */
class DirectPushMedian {
  readonly low: CountedHeap;
  readonly high: CountedHeap;

  constructor(private readonly c: Counts) {
    this.low = new CountedHeap(LOW, c);
    this.high = new CountedHeap(HIGH, c);
  }

  addNum(num: number): void {
    this.c.compares++;
    if (this.low.size() === 0 || num <= this.low.peek()) this.low.push(num);
    else this.high.push(num);
    if (this.low.size() > this.high.size() + 1) this.high.push(this.low.pop());
    else if (this.high.size() > this.low.size()) this.low.push(this.high.pop());
  }

  findMedian(): number {
    if (this.low.size() === this.high.size()) {
      return (this.low.peek() + this.high.peek()) / 2;
    }
    return this.low.peek();
  }
}

/* ────────────────────── 변이 — 정본 소스에서 기계로 ────────────────────── */

interface Impl {
  MedianFinder: new () => {
    addNum: (n: number) => void;
    findMedian: () => number;
  };
}

/** 작은 쪽을 최대 힙으로 두던 자리를 최소 힙으로 바꾼다. 맞는 줄이 하나가 아니면 던진다. */
const sameDirection = await loadMutant<Impl>(REF, {
  swap: [/new Heap\(-1\)/, "new Heap(1)"],
});

/** 개수를 맞추는 판정을 `>` 에서 `>=` 로 바꾼다. */
const looseSize = await loadMutant<Impl>(REF, {
  swap: [/> this\.low\.size\(\)/, ">= this.low.size()"],
});

function mutantAnswers(mod: Impl, values: readonly number[]): string[] {
  const mf = new mod.MedianFinder();
  return values.map((v) => {
    mf.addNum(v);
    const got = mf.findMedian();
    return Number.isNaN(got) || got === undefined ? "없다" : String(got);
  });
}

interface State {
  low: number[];
  high: number[];
  answer: string;
}

/** 한 판(정본 또는 변이)에 수열을 넣으며 걸음마다 두 힙을 **그 힙이 꺼낼 차례**로 떠 둔다. */
function statesOf(
  make: () => { addNum: (n: number) => void; findMedian: () => number },
  values: readonly number[],
): State[] {
  const mf = make();
  const heaps = pair(mf);
  return values.map((v) => {
    mf.addNum(v);
    const lo = inside(heaps.low);
    const hi = inside(heaps.high);
    const got = mf.findMedian();
    return {
      low: drainOrder(lo.items, lo.sign),
      high: drainOrder(hi.items, hi.sign),
      answer: Number.isNaN(got) || got === undefined ? "없다" : String(got),
    };
  });
}

/* ────────────────────────── 블록 — 전체 컨셉 ────────────────────────── */

/** `concept` — 수 다섯을 넣을 때마다의 정렬 결과와 정본의 답. */
function conceptStream(): string {
  const answers = refAnswers(WALK);
  let same = 0;
  const rows = WALK.map((_, i) => {
    const values = WALK.slice(0, i + 1);
    if (answers[i] === trueMedian(values)) same++;
    return [values.join(" "), sorted(values).join(" "), String(answers[i])];
  });
  return [
    md(["넣은 순서", "정렬하면", "중앙값"], rows, [2]),
    "",
    `중앙값 열은 정본이 낸 답이고, ${WALK.length} 줄 중 ${same} 줄에서 정렬한 줄의 가운데 자리로 고른 값과 같습니다.`,
  ].join("\n");
}

/* ─────────────────── 블록 — 아이디어를 떠올리는 과정 ─────────────────── */

/** `deep.origin` ② — 가장 단순한 방법의 값. */
function naiveScale(): string {
  const rows: string[][] = [
    ["수의 개수 N", "실측 비교 + 칸 쓰기", "닫힌 형태 상한"],
  ];
  for (const n of [32, 64, 128, 256]) {
    const values = Array.from({ length: n }, (_, i) => streamValue(i));
    rows.push([
      comma(n),
      comma(total(runSortEveryTime(values))),
      comma(sortEveryTimeBound(n)),
    ]);
  }
  const bound = sortEveryTimeBound(ADDS);
  return [
    ...table(rows, [0, 1, 2]),
    "",
    `호출 ${comma(CALLS)} 번 (넣기 ${comma(ADDS)} · 묻기 ${comma(ADDS)}) 이면`,
    ...list([
      ["물어볼 때마다 전부 정렬한다", `${comma(bound)} 번 이하`],
      ["초당 1 억 번 기준", seconds(bound)],
    ]),
  ].join("\n");
}

/** `deep.origin` ③ — 정렬이 만든 자리 중 답이 읽는 자리. */
function halfOnly(): string {
  const rows: string[][] = [["넣은 수", "정렬 결과", "답이 읽는 자리", "답"]];
  let made = 0;
  let read = 0;
  for (let i = 0; i < WALK.length; i++) {
    const values = WALK.slice(0, i + 1);
    const n = values.length;
    const spot =
      n % 2 === 1 ? `${(n + 1) / 2} 번째` : `${n / 2}·${n / 2 + 1} 번째`;
    made += n;
    read += n % 2 === 1 ? 1 : 2;
    rows.push([
      values.join(" "),
      sorted(values).join(" "),
      spot,
      String(trueMedian(values)),
    ]);
  }
  return [
    ...table(rows),
    "",
    `정렬이 만든 자리 ${made} 개 중 답이 읽은 자리는 ${read} 개다`,
  ].join("\n");
}

/** `deep.origin` ④ — 같은 입력을 두 방식으로. */
function twoWays(): string {
  const rows: string[][] = [["수의 개수 N", "방식", "비교", "칸 쓰기", "합"]];
  for (const n of [WALK.length, 256]) {
    const values =
      n === WALK.length
        ? WALK
        : Array.from({ length: n }, (_, i) => streamValue(i));
    const a = runSortEveryTime(values);
    const b = runKeepSorted(values);
    rows.push([
      comma(n),
      "물어볼 때마다 전부 정렬",
      comma(a.compares),
      comma(a.writes),
      comma(total(a)),
    ]);
    rows.push([
      comma(n),
      "정렬된 자리에 끼워 넣기",
      comma(b.compares),
      comma(b.writes),
      comma(total(b)),
    ]);
  }
  const big = Array.from({ length: 256 }, (_, i) => streamValue(i));
  const b = runKeepSorted(big);
  return [
    ...table(rows, [0, 2, 3, 4]),
    "",
    `N = 256 에서 끼워 넣기의 비교는 ${comma(b.compares)} 번인데 칸 쓰기가 ${comma(b.writes)} 번이다`,
  ].join("\n");
}

/** `deep.origin` ⑤ — 중앙값 하나만 들고 있으면 새 중앙값이 정해지지 않는다. */
function originOneValue(): string {
  const add = ONE_VALUE_ADD;
  const rows = ONE_VALUE_CASES.map((kept) => {
    const after = [...kept, add];
    return [
      kept.join(" "),
      String(trueMedian(kept)),
      String(add),
      sorted(after).join(" "),
      String(trueMedian(after)),
    ];
  });
  const olds = ONE_VALUE_CASES.map((k) => trueMedian(k));
  const news = ONE_VALUE_CASES.map((k) => trueMedian([...k, add]));
  if (olds[0] !== olds[1] || news[0] === news[1]) {
    throw new Error("두 줄의 옛 중앙값이 같고 새 중앙값이 달라야 한다");
  }
  const [n0, n1] = news as [number, number];
  return [
    md(
      ["담긴 수", "중앙값", "새로 넣은 수", "넣은 뒤의 정렬", "새 중앙값"],
      rows,
      [1, 2, 4],
    ),
    "",
    `두 줄 다 옛 중앙값이 ${olds[0]} · 새로 넣은 수가 ${add} 인데, 새 중앙값은 ${n0}${과와(n0)} ${n1}${으로(n1)} 갈립니다.`,
  ].join("\n");
}

/* ─────────────────────── 블록 — 아이디어 상세 ─────────────────────── */

/** `deep.build` 개념 — 두 힙에서 차례로 꺼낸 값과 정렬했을 때의 자리. */
function buildRead(): string {
  const mf = new MedianFinder();
  for (const v of WALK) mf.addNum(v);
  const heaps = pair(mf);
  const low = drainOrder(inside(heaps.low).items, LOW);
  const high = drainOrder(inside(heaps.high).items, HIGH);
  const s = sorted(WALK);
  const k = low.length;
  const rows: string[][] = [];
  let matched = 0;
  low.forEach((v, i) => {
    const at = k - i;
    if (s[at - 1] === v) matched++;
    rows.push(["작은 쪽 low", String(i + 1), String(v), `${at} 번째`]);
  });
  high.forEach((v, i) => {
    const at = k + i + 1;
    if (s[at - 1] === v) matched++;
    rows.push(["큰 쪽 high", String(i + 1), String(v), `${at} 번째`]);
  });
  if (matched !== WALK.length) {
    throw new Error("꺼낸 차례와 정렬 자리가 어긋났다");
  }
  return [
    md(["힙", "꺼내는 차례", "값", "정렬했을 때의 자리"], rows, [1, 2]),
    "",
    `정렬하면 ${s.join(" ")} 이고, ${matched} 칸 모두 그 자리의 값과 같습니다.`,
  ].join("\n");
}

/** `deep.build` 개념 — 걸음이 끝날 때마다 두 힙의 관계. */
function buildRelation(): string {
  const { adds } = runRecorded(WALK);
  let ordered = 0;
  let balanced = 0;
  const rows = adds.map((r, i) => {
    const low = lowOrder(r.end);
    const high = highOrder(r.end);
    const max = low[0] as number;
    const min = high[0];
    if (min === undefined || max <= min) ordered++;
    const diff = low.length - high.length;
    if (diff === 0 || diff === 1) balanced++;
    return [
      String(i + 1),
      row(low),
      row(high),
      String(max),
      min === undefined ? "없음" : String(min),
      String(diff),
    ];
  });
  return [
    md(
      [
        "N",
        "작은 쪽(꺼낼 차례)",
        "큰 쪽(꺼낼 차례)",
        "작은 쪽 최댓값",
        "큰 쪽 최솟값",
        "크기 차",
      ],
      rows,
      [0, 3, 4, 5],
    ),
    "",
    `${adds.length} 줄 중 ${ordered} 줄에서 작은 쪽 최댓값이 큰 쪽 최솟값 이하이고(큰 쪽이 빈 줄 포함), ${balanced} 줄에서 크기 차가 0 또는 1 입니다.`,
  ].join("\n");
}

/** `deep.build` 개념 — 힙 배열과 꺼낼 차례와 정렬한 반쪽. */
function buildArray(): string {
  const { adds } = runRecorded(WALK);
  const rows: string[][] = [];
  let unsorted = 0;
  let topOk = 0;
  for (const n of [4, 5]) {
    const r = adds[n - 1] as AddRecord;
    for (const [name, items, sign] of [
      ["작은 쪽 low", r.end.low, LOW],
      ["큰 쪽 high", r.end.high, HIGH],
    ] as const) {
      const asc = sorted(items);
      const isSorted = items.join(" ") === asc.join(" ");
      if (!isSorted) unsorted++;
      const order = drainOrder(items, sign);
      const end = sign === LOW ? asc.at(-1) : asc[0];
      if (order[0] === end && items[0] === end) topOk++;
      rows.push([
        String(n),
        name,
        row(items),
        row(order),
        row(asc),
        isSorted ? "예" : "아니오",
      ]);
    }
  }
  return [
    md(
      [
        "N",
        "힙",
        "배열에 놓인 순서",
        "꺼낼 차례",
        "정렬한 반쪽",
        "배열의 오름차순 여부",
      ],
      rows,
      [0],
    ),
    "",
    `네 줄 중 ${unsorted} 줄은 배열이 오름차순으로 놓여 있지 않고, ${topOk} 줄에서 배열의 첫 칸과 꺼낼 차례의 첫 값이 그 반쪽의 끝값입니다.`,
  ].join("\n");
}

/** `deep.build` 2단계 — 새 수가 어느 절반에 속하든 ①② 두 줄로 처리된다. */
function buildCases(): string {
  const { adds } = runRecorded(WALK);
  // 새 수가 큰 쪽에 속하면 ② 에서 넘어가는 값이 새 수 자신이다.
  const belongsHigh = (r: AddRecord) => r.moved === r.num;
  const pick = (want: boolean) =>
    adds.findIndex((r, i) => i > 0 && belongsHigh(r) === want);
  const rows: string[][] = [];
  let ok = 0;
  for (const [label, at] of [
    ["새 수가 작은 쪽에 속한다", pick(false)],
    ["새 수가 큰 쪽에 속한다", pick(true)],
  ] as const) {
    const r = adds[at] as AddRecord;
    const prev = adds[at - 1] as AddRecord;
    const name = `${label} (${r.num})`;
    rows.push([
      name,
      "넣기 전",
      row(lowOrder(prev.end)),
      row(highOrder(prev.end)),
      "-",
    ]);
    rows.push([
      name,
      `① ${r.num}${을를(r.num)} 작은 쪽에 넣는다`,
      row(lowOrder(r.afterPush)),
      row(highOrder(r.afterPush)),
      "-",
    ]);
    const low = lowOrder(r.afterMove);
    const high = highOrder(r.afterMove);
    rows.push([
      name,
      "② 작은 쪽 꼭대기를 큰 쪽으로",
      row(low),
      row(high),
      String(r.moved),
    ]);
    if (low.length === 0 || (low[0] as number) <= (high[0] as number)) ok++;
  }
  return [
    md(
      ["경우", "줄", "작은 쪽(꺼낼 차례)", "큰 쪽(꺼낼 차례)", "넘어간 값"],
      rows,
      [4],
    ),
    "",
    `두 경우 중 ${ok} 경우에서 ② 가 끝났을 때 작은 쪽 최댓값이 큰 쪽 최솟값 이하입니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — ③ 앞뒤의 두 크기. */
function buildSizes(): string {
  const { adds } = runRecorded(WALK);
  let hit = 0;
  const rows = adds.map((r, i) => {
    const n = i + 1;
    const k = Math.ceil(n / 2);
    if (r.end.low.length === k) hit++;
    return [
      String(n),
      `${r.afterMove.low.length} · ${r.afterMove.high.length}`,
      r.returned === null
        ? "거짓"
        : `참 — ${r.returned}${을를(r.returned)} 도로 옮긴다`,
      `${r.end.low.length} · ${r.end.high.length}`,
      String(k),
    ];
  });
  return [
    md(
      ["N", "② 뒤 두 크기(작은 쪽 · 큰 쪽)", "③", "③ 뒤 두 크기", "⌈N/2⌉"],
      rows,
      [0, 4],
    ),
    "",
    `${adds.length} 줄 중 ${hit} 줄에서 ③ 뒤 작은 쪽 크기가 ⌈N/2⌉ 와 같습니다.`,
  ].join("\n");
}

/** `deep.build` 4단계 — 두 꼭대기로 답을 만든다. */
function buildAnswer(): string {
  const { adds, answers } = runRecorded(WALK);
  let same = 0;
  const rows = adds.map((r, i) => {
    const truth = trueMedian(WALK.slice(0, i + 1));
    const ans = answers[i] as number;
    if (ans === truth) same++;
    return [
      String(i + 1),
      `${r.end.low.length} · ${r.end.high.length}`,
      r.end.low.length === r.end.high.length ? "같다" : "다르다",
      answerExpr(r.end),
      String(ans),
      String(truth),
    ];
  });
  return [
    md(
      [
        "N",
        "두 크기",
        "두 크기의 비교",
        "답을 만드는 식",
        "정본의 답",
        "정렬해서 고른 답",
      ],
      rows,
      [0, 4, 5],
    ),
    "",
    `${adds.length} 줄 중 ${same} 줄에서 정본의 답이 정렬해서 고른 답과 같습니다.`,
  ].join("\n");
}

/** 작은 쪽을 `size` 칸으로 두었을 때 두 꼭대기만 읽어 낸 답. 자리가 없으면 `null`. */
function topsAnswer(values: readonly number[], size: number): number | null {
  const s = sorted(values);
  const n = s.length;
  if (size < 1 || size > n) return null;
  const lowTop = s[size - 1] as number;
  const highTop = size < n ? (s[size] as number) : Number.NaN;
  return size === n - size ? (lowTop + highTop) / 2 : lowTop;
}

function sweepRow(shift: number, from: number, limit: number) {
  let ok = 0;
  let firstBad = "-";
  let gave = "-";
  let want = "-";
  for (let n = from; n <= limit; n++) {
    const values = SWEEP_INPUT.slice(0, n);
    const truth = trueMedian(values);
    const got = topsAnswer(values, Math.ceil(n / 2) + shift);
    if (got === truth) ok++;
    else if (firstBad === "-") {
      firstBad = String(n);
      gave = got === null ? "자리가 없다" : String(got);
      want = String(truth);
    }
  }
  return { ok, firstBad, gave, want };
}

/** `deep.build` 설계 선택 — 경계 자리를 다섯 값으로 놓고 맞은 답 수를 센다. */
function boundarySweep(): string {
  const limit = SWEEP_INPUT.length;
  // `N` 이 5 보다 작으면 `⌈N/2⌉ ± 2` 가 배열 밖으로 나가서 「자리가 없다」만 나온다.
  // 그 자리는 답이 틀린 것이 아니라 물어볼 수 없는 것이라 스윕을 5 부터 시작한다.
  const from = 5;
  const tried = limit - from + 1;
  const rows: string[][] = [
    ["작은 쪽의 크기", "맞은 답", "처음 어긋나는 N", "그때 낸 답", "참 중앙값"],
  ];
  for (const s of [-2, -1, 0, 1, 2]) {
    const r = sweepRow(s, from, limit);
    rows.push([
      `⌈N/2⌉ ${s === 0 ? "그대로" : s > 0 ? `+ ${s}` : `− ${-s}`}`,
      `${r.ok} / ${tried}`,
      r.firstBad,
      r.gave,
      r.want,
    ]);
  }
  return [
    ...table(rows),
    "",
    `N = ${from} … ${limit} 을 전부 시험한 값이다. 가운데 줄만 ${tried} 번 다 맞다`,
  ].join("\n");
}

/** `deep.build` 설계 선택 — N = 5 에서 경계를 옮기면 무엇이 어긋나는가. */
function boundaryAtFive(): string {
  const n = WALK.length;
  const s = sorted(WALK);
  const truth = trueMedian(WALK);
  const k = Math.ceil(n / 2);
  const rows: string[][] = [];
  for (let size = 2; size <= n; size++) {
    const got = topsAnswer(WALK, size) as number;
    rows.push([
      size === k ? `${size} (= ⌈${n}/2⌉)` : String(size),
      row(s.slice(0, size)),
      row(s.slice(size)),
      String(got),
      String(truth),
      got === truth ? "맞다" : "틀리다",
    ]);
  }
  const plus = sweepRow(1, n, SWEEP_INPUT.length);
  return [
    md(
      [
        "작은 쪽의 크기",
        "작은 쪽에 드는 값",
        "큰 쪽에 드는 값",
        "꼭대기로 낸 답",
        "참 중앙값",
        "판정",
      ],
      rows,
      [3, 4],
    ),
    "",
    `크기 ${k + 1}${은는(k + 1)} N = ${n} 에서는 맞지만, 같은 규칙으로 수를 더 넣으면 N = ${plus.firstBad} 에서 ${plus.gave}${을를(plus.gave)} 내어 참 중앙값 ${plus.want}${과와(plus.want)} 어긋납니다.`,
  ].join("\n");
}

/* ─────────────────── 블록 — 수행으로 알아보는 알고리즘 ─────────────────── */

/** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
function walkInput(): string {
  const answers = refAnswers(WALK);
  return [
    `const stream = [${WALK.join(", ")}];`,
    `// 넣을 때마다 findMedian 을 부르면 ${answers.join(" · ")}${이가(String(answers.at(-1)))} 나와야 한다`,
  ].join("\n");
}

/** `deep.walk` 1 — 같은 수를 방향만 다른 두 힙에 넣은 배열. */
function walkHeapSign(): string {
  const values = [5, 1, 3];
  const rows: string[][] = [];
  for (const [label, sign] of [
    ["sign = +1 (최소 힙)", HIGH],
    ["sign = -1 (최대 힙)", LOW],
  ] as const) {
    const h = new Heap(sign);
    for (const v of values) h.push(v);
    rows.push([
      label,
      `배열 ${inside(h).items.join(" ")}`,
      `꼭대기 ${h.peek()}`,
    ]);
  }
  return [
    `같은 수 ${values.join(" · ")}${을를(values.at(-1) as number)} 차례로 넣으면`,
    "",
    ...table(rows).map((l) => `  ${l}`),
  ].join("\n");
}

/** 짚고 가기 — 두 힙을 같은 방향으로 둔 변이의 답. */
function pauseSameDirection(): string {
  const rows: string[][] = [
    ["수열", "정본이 낸 답", "둘 다 최소 힙인 답", "판정"],
  ];
  for (const [name, values] of [
    ["전개 입력", WALK],
    ["오름차순 1 … 6", ASCENDING],
  ] as const) {
    const a = refAnswers(values).map(String);
    const b = mutantAnswers(sameDirection, values);
    rows.push([
      name,
      a.join(" "),
      b.join(" "),
      a.join(",") === b.join(",") ? "같다" : "틀리다",
    ]);
  }
  return table(rows).join("\n");
}

/** 짚고 가기 — 두 판의 상태가 갈리는 자리(전개 입력의 앞 세 수). */
function pauseSameStates(): string {
  const head = WALK.slice(0, 3);
  const refS = statesOf(() => new MedianFinder(), head);
  const mutS = statesOf(() => new sameDirection.MedianFinder(), head);
  const rows: string[][] = [];
  let firstDiff = -1;
  refS.forEach((r, i) => {
    const m = mutS[i] as State;
    if (firstDiff < 0 && r.answer !== m.answer) firstDiff = i;
    const v = String(WALK[i]);
    rows.push([
      `${i + 1} 번째 수 ${v}`,
      "정본",
      row(r.low),
      row(r.high),
      r.answer,
    ]);
    rows.push([
      `${i + 1} 번째 수 ${v}`,
      "둘 다 최소 힙",
      row(m.low),
      row(m.high),
      m.answer,
    ]);
  });
  const r = refS[firstDiff];
  const m = mutS[firstDiff];
  const tail =
    r === undefined || m === undefined
      ? "세 수를 넣는 동안 두 판의 답이 갈리는 자리가 없습니다."
      : `${firstDiff + 1} 번째 수 ${WALK[firstDiff]}${을를(String(WALK[firstDiff]))} 넣은 뒤 두 판의 답이 ${r.answer}${과와(r.answer)} ${m.answer}${으로(m.answer)} 처음 갈립니다.`;
  return [
    md(
      ["넣은 수", "판", "작은 쪽(꺼낼 차례)", "큰 쪽(꺼낼 차례)", "답"],
      rows,
      [4],
    ),
    "",
    tail,
  ].join("\n");
}

/** `deep.walk` 2 — 첫 두 수를 넣을 때 세 줄 각각의 상태. */
function walkAddTwo(): string {
  const { adds } = runRecorded(WALK.slice(0, 2));
  const out: string[] = [];
  adds.forEach((r, i) => {
    out.push(
      i === 0
        ? `addNum(${r.num}) 만 실행하면`
        : `이어서 addNum(${r.num}) 까지 실행하면`,
    );
    const back = r.returned !== null;
    const rows: string[][] = [
      [
        `① 작은 쪽에 ${r.num}${을를(r.num)} 넣는다`,
        `작은 쪽 ${row(lowOrder(r.afterPush))}`,
        `큰 쪽 ${row(highOrder(r.afterPush))}`,
      ],
      [
        `② 꼭대기 ${r.moved}${을를(r.moved)} 큰 쪽으로`,
        `작은 쪽 ${row(lowOrder(r.afterMove))}`,
        `큰 쪽 ${row(highOrder(r.afterMove))}`,
      ],
      [
        `③ 큰 쪽 ${r.afterMove.high.length} > 작은 쪽 ${r.afterMove.low.length}${이가(r.afterMove.low.length)} ${back ? "참" : "거짓"}`,
        `작은 쪽 ${row(lowOrder(r.end))}`,
        `큰 쪽 ${row(highOrder(r.end))}`,
      ],
    ];
    out.push(...table(rows).map((l) => `  ${l}`));
    if (i < adds.length - 1) out.push("");
  });
  return out.join("\n");
}

/** 짚고 가기 — 값으로만 가르고 개수를 안 맞춘 판의 답. */
function pauseValueSplit(): string {
  const make = (values: readonly number[]) => {
    const v = new ValueSplitMedian();
    return values.map((x) => {
      v.addNum(x);
      return String(v.findMedian());
    });
  };
  const rows: string[][] = [
    ["수열", "정본이 낸 답", "값으로만 가른 답", "판정"],
  ];
  for (const [name, values] of [
    ["전개 입력", WALK],
    ["오름차순 1 … 6", ASCENDING],
  ] as const) {
    const a = refAnswers(values).map(String);
    const b = make(values);
    rows.push([
      name,
      a.join(" "),
      b.join(" "),
      a.join(",") === b.join(",") ? "같다" : "틀리다",
    ]);
  }
  return table(rows).join("\n");
}

/** 짚고 가기 — 값으로만 가른 판에 1 … 6 을 넣을 때의 두 힙. */
function pauseSplitStates(): string {
  const states = statesOf(() => new ValueSplitMedian(), ASCENDING);
  const answers = refAnswers(ASCENDING);
  const rows = states.map((s, i) => [
    String(ASCENDING[i]),
    row(s.low),
    row(s.high),
    s.answer,
    String(answers[i]),
  ]);
  const lowSizes = new Set(states.map((s) => s.low.length));
  const stuck = lowSizes.size === 1 ? [...lowSizes][0] : null;
  return [
    md(
      [
        "넣은 수",
        "작은 쪽(꺼낼 차례)",
        "큰 쪽(꺼낼 차례)",
        "값으로만 가른 답",
        "정본이 낸 답",
      ],
      rows,
      [0, 3, 4],
    ),
    "",
    stuck === null || stuck === undefined
      ? "작은 쪽의 크기가 걸음마다 달라집니다."
      : `여섯 걸음 내내 작은 쪽의 크기가 ${stuck} 에 머물고, 둘째 수부터는 전부 큰 쪽으로 갑니다.`,
  ].join("\n");
}

/** `deep.walk` 3 — 아홉 걸음의 상태와 답. */
function walkTrace(): string {
  const steps = walk();
  const rows = steps.map((s) => [
    s.id,
    s.did,
    s.branch,
    row(lowOrder(s)),
    row(highOrder(s)),
    String(s.n),
    s.median === null ? "-" : String(s.median),
  ]);
  const last = steps.at(-1) as WalkStep;
  return [
    md(
      [
        "걸음",
        "한 일",
        "갈래",
        "작은 쪽(꺼낼 차례)",
        "큰 쪽(꺼낼 차례)",
        "N",
        "중앙값",
      ],
      rows,
      [5, 6],
    ),
    "",
    `마지막 findMedian 이 돌려준 값 ${last.median}${은는(String(last.median))} 정렬한 수열 ${sorted(WALK).join(" ")} 의 가운데 자리 값과 같습니다.`,
  ].join("\n");
}

/** `deep.walk` 3 — 라벨 넷이 어느 걸음에서 실행됐는가. */
function walkLabels(): string {
  const steps = walk();
  const pushAt = steps
    .filter((s) => s.ops[0]?.heap === "low" && s.ops[0]?.kind === "push")
    .map((s) => s.id);
  const moveAt = steps
    .filter((s) => s.ops.some((o) => o.heap === "high" && o.kind === "push"))
    .map((s) => s.id);
  const ids = (f: (s: WalkStep) => boolean | null, want: boolean) =>
    steps.filter((s) => f(s) === want).map((s) => s.id);
  const back = [ids((s) => s.moveBack, true), ids((s) => s.moveBack, false)];
  const even = [ids((s) => s.even, true), ids((s) => s.even, false)];
  const rows = [
    ["①", "새 수를 작은 쪽에 넣는다", pushAt.join(" "), "-"],
    ["②", "작은 쪽 꼭대기를 큰 쪽으로 옮긴다", moveAt.join(" "), "-"],
    [
      "③",
      "큰 쪽이 더 많은가",
      (back[0] ?? []).join(" "),
      (back[1] ?? []).join(" "),
    ],
    [
      "④",
      "두 크기가 같은가",
      (even[0] ?? []).join(" "),
      (even[1] ?? []).join(" "),
    ],
  ];
  const covered =
    pushAt.length > 0 &&
    moveAt.length > 0 &&
    back.every((x) => x.length > 0) &&
    even.every((x) => x.length > 0);
  return [
    md(["라벨", "하는 일", "실행된 걸음 · 참인 걸음", "거짓인 걸음"], rows),
    "",
    covered
      ? "라벨 넷이 모두 실행됐고, ③ 과 ④ 는 참과 거짓이 둘 다 나왔습니다."
      : "한 번도 실행되지 않은 갈래가 있습니다.",
  ].join("\n");
}

/** 짚고 가기 — 알맞은 쪽에 바로 넣는 판. 답은 같고 계수만 갈린다. */
function pauseDirectPush(): string {
  const direct = (values: readonly number[], c: Counts) => {
    const d = new DirectPushMedian(c);
    return values.map((x) => {
      d.addNum(x);
      return String(d.findMedian());
    });
  };
  const rows: string[][] = [
    ["수열", "정본이 낸 답", "바로 넣은 판의 답", "판정"],
  ];
  for (const [name, values] of [
    ["전개 입력", WALK],
    ["오름차순 1 … 6", ASCENDING],
  ] as const) {
    const c: Counts = { compares: 0, writes: 0 };
    const a = refAnswers(values).map(String);
    const b = direct(values, c);
    rows.push([
      name,
      a.join(" "),
      b.join(" "),
      a.join(",") === b.join(",") ? "같다" : "틀리다",
    ]);
  }
  const c: Counts = { compares: 0, writes: 0 };
  const d = new DirectPushMedian(c);
  for (let i = 0; i < GEN; i++) d.addNum(streamValue(i));
  const ours = runHeaps(0);
  return [
    ...table(rows),
    "",
    `생성식 입력 ${comma(GEN)} 개를 넣는 동안의 계수`,
    ...list(
      [
        ["두 힙", `${comma(total(ours))} 번`],
        ["바로 넣은 판", `${comma(total(c))} 번`],
        [
          "줄어드는 비율",
          `${(100 - (100 * total(c)) / total(ours)).toFixed(1)} %`,
        ],
      ],
      7,
    ),
  ].join("\n");
}

/** 짚고 가기 — `addNum` 하나가 부른 힙 연산 수의 분포. */
function pauseDirectOps(): string {
  const opsOf = (h: { low: CountedHeap; high: CountedHeap }) =>
    h.low.pushes + h.low.pops + h.high.pushes + h.high.pops;
  const tally = (d: {
    low: CountedHeap;
    high: CountedHeap;
    addNum: (n: number) => void;
  }): Map<number, number> => {
    const m = new Map<number, number>();
    let seen = 0;
    for (let i = 0; i < GEN; i++) {
      d.addNum(streamValue(i));
      const now = opsOf(d);
      m.set(now - seen, (m.get(now - seen) ?? 0) + 1);
      seen = now;
    }
    return m;
  };
  const ours = tally(new CountedMedianFinder({ compares: 0, writes: 0 }));
  const theirs = tally(new DirectPushMedian({ compares: 0, writes: 0 }));
  const rows: string[][] = [];
  for (const [name, m] of [
    ["두 힙", ours],
    ["바로 넣은 판", theirs],
  ] as const) {
    for (const [ops, count] of [...m].sort((a, b) => a[0] - b[0])) {
      rows.push([name, String(ops), comma(count)]);
    }
  }
  return [
    md(["판", "addNum 하나의 힙 연산", "그런 addNum 의 수"], rows, [1, 2]),
    "",
    `생성식 입력 ${comma(GEN)} 개를 넣으며 addNum 마다 넣기와 꺼내기를 합쳐 셌습니다.`,
  ].join("\n");
}

/** `deep.walk.final` — 전체 코드에 다섯 입력을 넣은 답. */
function finalCalls(): string {
  const cases: number[][] = [
    [5, 15, 1, 3, 5],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [2, 2, 2, 2],
  ];
  const rows: string[][] = cases.map((values) => [
    `addNum ${values.join(" ")}${을를(values.at(-1) as number)} 넣으며 매번 findMedian`,
    `→ ${refAnswers(values).join(" ")}`,
  ]);
  const ends = [-1_000_000_000, 1_000_000_000];
  rows.push([
    `addNum ${ends.join(" ")} 뒤 findMedian`,
    `→ ${refAnswers(ends).at(-1)}`,
  ]);
  return table(rows).join("\n");
}

/* ─────────────────── 블록 — 알아 두면 좋은 개념 ─────────────────── */

/** `related` — 다섯 수를 다 넣은 상태의 자리와 그 값이 담긴 힙. */
function relatedRank(): string {
  const mf = new MedianFinder();
  for (const v of WALK) mf.addNum(v);
  const heaps = pair(mf);
  const k = heaps.low.size();
  const s = sorted(WALK);
  const top = heaps.low.peek();
  if (s[k - 1] !== top) throw new Error("작은 쪽 꼭대기가 k 번째 값이 아니다");
  return [
    md(
      ["자리", ...s.map((_, i) => String(i + 1))],
      [
        ["값", ...s.map(String)],
        ["담긴 힙", ...s.map((_, i) => (i < k ? "작은 쪽" : "큰 쪽"))],
      ],
    ),
    "",
    `작은 쪽 꼭대기 ${top}${은는(top)} 자리 ${k} 의 값이고, 수 ${s.length} 개에서 ⌈${s.length}/2⌉ = ${k} 번째 순서통계량입니다.`,
  ].join("\n");
}

/* ─────────────────── 블록 — 경쟁 설계와의 대조 ─────────────────── */

/** `purpose.alt` 의 뒷받침 — 뒤집히는 자리 둘레를 한 회씩 재 본다. */
function altAround(): string {
  const rows: string[][] = [
    ["물어본 횟수 q", "두 힙", "매번 골라내기", "적은 쪽"],
  ];
  for (const q of [69, 70, 71, 72, 73, 74]) {
    const a = total(runHeaps(q));
    const b = total(runSelect(q));
    rows.push([
      comma(q),
      comma(a),
      comma(b),
      a < b ? "두 힙" : "매번 골라내기",
    ]);
  }
  let last = -1;
  for (let q = 0; q <= 300; q++) {
    if (total(runSelect(q)) <= total(runHeaps(q))) last = q;
  }
  return [
    ...table(rows, [0, 1, 2]),
    "",
    `q 를 0 부터 300 까지 전부 재면 골라내기가 마지막으로 적은 자리가 ${last} 회다`,
    `그 뒤로는 다시 뒤집히지 않는다`,
  ].join("\n");
}

/* ─────────────────── 블록 — 수식 정의와 유도 ─────────────────── */

/** `deep.math` ① — 정의를 자리 번호로 읽는다. */
function mathPositions(): string {
  const out: string[] = [];
  for (const n of [5, 4]) {
    const s = sorted(WALK.slice(0, n));
    const med = trueMedian(s);
    const spot =
      n % 2 === 1
        ? `N = ${n}${은는(n)} 홀수라 (${n}+1)/2 = ${(n + 1) / 2} 번째 자리`
        : `N = ${n}${은는(n)} 짝수라 ${n / 2} 번째와 ${n / 2 + 1} 번째 자리`;
    out.push(
      ...table([
        ["자리", ...s.map((_, i) => String(i + 1))],
        ["값", ...s.map(String)],
      ]).map((l) => `  ${l}`),
      `  ${spot} → 답 ${med}`,
    );
    if (n === 5) out.push("");
  }
  return out.join("\n");
}

/** `deep.math` ① — `k = ⌈N/2⌉` 로 자른 두 무리. */
function mathCut(): string {
  const rows = [5, 4, 3].map((n) => {
    const s = sorted(WALK.slice(0, n));
    const k = Math.ceil(n / 2);
    return [
      `N = ${n}`,
      `k = ${k}`,
      `${s.slice(0, k).join(" ")} | ${s.slice(k).join(" ")}`,
      `L 의 원소 ${k} 개 · H 의 원소 ${n - k} 개`,
    ];
  });
  return table(rows)
    .map((l) => `  ${l}`)
    .join("\n");
}

/** `deep.math` ② — 정의를 전개 입력에 넣어 확인한다. */
function mathCheck(): string {
  const rows: string[][] = [
    [
      "N",
      "정렬 수열",
      "⌈N/2⌉",
      "작은 쪽 꼭대기",
      "큰 쪽 꼭대기",
      "식이 내는 값",
      "정본의 답",
    ],
  ];
  const mf = new MedianFinder();
  for (let i = 0; i < WALK.length; i++) {
    const s = sorted(WALK.slice(0, i + 1));
    const n = s.length;
    const k = Math.ceil(n / 2);
    const lowTop = s[k - 1] as number;
    const highTop = k < n ? (s[k] as number) : Number.NaN;
    const byFormula = n % 2 === 0 ? (lowTop + highTop) / 2 : lowTop;
    mf.addNum(WALK[i] as number);
    rows.push([
      String(n),
      s.join(" "),
      String(k),
      String(lowTop),
      Number.isNaN(highTop) ? "없음" : String(highTop),
      String(byFormula),
      String(mf.findMedian()),
    ]);
  }
  return table(rows, [0, 2, 3, 4, 5, 6]).join("\n");
}

/** `deep.math` ③ — 크기가 정해지면 두 꼭대기의 자리도 정해진다. */
function mathTops(): string {
  const rows: string[][] = [];
  for (const n of [5, 4]) {
    const mf = new MedianFinder();
    for (const v of WALK.slice(0, n)) mf.addNum(v);
    const heaps = pair(mf);
    const k = heaps.low.size();
    const s = sorted(WALK.slice(0, n));
    if (s[k - 1] !== heaps.low.peek() || s[k] !== heaps.high.peek()) {
      throw new Error("두 꼭대기가 k · k+1 번째 자리의 값이 아니다");
    }
    const lowAt = s.slice(0, k).map((_, i) => i + 1);
    const highAt = s.slice(k).map((_, i) => k + i + 1);
    rows.push([
      `N = ${n} · k = ${k}`,
      `L 은 자리 ${lowAt.join(" ")}`,
      `max L = 자리 ${k} 의 값 ${heaps.low.peek()}`,
    ]);
    rows.push([
      "",
      `H 는 자리 ${highAt.join(" ")}`,
      `min H = 자리 ${k + 1} 의 값 ${heaps.high.peek()}`,
    ]);
  }
  return table(rows)
    .map((l) => `  ${l}`)
    .join("\n");
}

/** `deep.math` ② — 닫힌 형태를 작은 값에 넣어 확인한다. */
function mathLogSum(): string {
  const rows = [4, 8].map((n) => {
    const terms = Array.from({ length: n }, (_, i) =>
      Math.ceil(Math.log2(i + 1)),
    );
    const byHand = terms.reduce((a, b) => a + b, 0);
    const h = Math.ceil(Math.log2(n));
    const closed = logSum(n);
    return [
      `N = ${n}`,
      `더해 보면 ${terms.join(" + ")} = ${byHand}`,
      `식으로 ${n}·${h} − 2^${h} + 1 = ${closed}`,
      byHand === closed ? "같다" : "다르다",
    ];
  });
  return table(rows)
    .map((l) => `  ${l}`)
    .join("\n");
}

/** `deep.math` ④ — 닫힌 형태에 규모를 넣는다. */
function mathScale(): string {
  const rows: string[][] = [
    ["수의 개수 N", "실측 비교 + 칸 쓰기", "17·Σ⌈log2 i⌉ + 5N 상한"],
  ];
  for (const n of [256, 1024, GEN]) {
    const c: Counts = { compares: 0, writes: 0 };
    const mf = new CountedMedianFinder(c);
    for (let i = 0; i < n; i++) mf.addNum(streamValue(i));
    rows.push([comma(n), comma(total(c)), comma(heapBound(n))]);
  }
  return [
    ...table(rows, [0, 1, 2]),
    "",
    `호출 ${comma(CALLS)} 번 (넣기 ${comma(ADDS)} · 묻기 ${comma(ADDS)}) 이면`,
    ...list([
      ["두 힙", `${comma(heapBound(ADDS))} 번 이하`],
      [
        "물어볼 때마다 전부 정렬한다",
        `${comma(sortEveryTimeBound(ADDS))} 번 이하`,
      ],
      [
        "두 값의 비",
        `${comma(Math.round(sortEveryTimeBound(ADDS) / heapBound(ADDS)))} 배`,
      ],
    ]),
  ].join("\n");
}

/* ─────────────────────── 블록 — 불변식 ─────────────────────── */

/** `invariant` ② — 경계 입력에서 정본이 내는 답. */
function edgeCases(): string {
  const rows: string[][] = [
    ["경계 입력", "넣은 수", "정본의 답", "정의대로 고른 답"],
  ];
  const cases: [string, number[]][] = [
    ["수가 하나뿐이다", [7]],
    ["수가 둘이다", [7, 8]],
    ["전부 같은 값이다", [5, 5, 5, 5]],
    ["음수만 들어온다", [-5, -10]],
    ["값의 양 끝", [-1_000_000_000, 1_000_000_000]],
    ["내림차순으로 들어온다", [5, 4, 3, 2, 1]],
  ];
  for (const [name, values] of cases) {
    rows.push([
      name,
      values.join(" "),
      String(refAnswers(values).at(-1)),
      String(trueMedian(values)),
    ]);
  }
  return table(rows).join("\n");
}

/** `invariant` ③ — 개수 규칙을 지키던 줄을 한 글자 바꾼다. */
function mutantSizeRule(): string {
  const rows: string[][] = [
    ["수열", "정본이 낸 답", "`>` 를 `>=` 로 바꾼 답", "판정"],
  ];
  for (const [name, values] of [
    ["전개 입력", WALK],
    ["오름차순 1 … 6", ASCENDING],
  ] as const) {
    const a = refAnswers(values).map(String);
    const b = mutantAnswers(looseSize, values);
    rows.push([
      name,
      a.join(" "),
      b.join(" "),
      a.join(",") === b.join(",") ? "같다" : "틀리다",
    ]);
  }
  return table(rows).join("\n");
}

/** `invariant` ③ — 두 판의 두 힙이 갈리는 자리. */
function mutantSizeStates(): string {
  const rows: string[][] = [];
  const pick = (name: string, values: readonly number[], at: number) => {
    const r = statesOf(() => new MedianFinder(), values)[at] as State;
    const m = statesOf(() => new looseSize.MedianFinder(), values)[at] as State;
    for (const [label, s] of [
      ["정본", r],
      [">= 로 바꾼 판", m],
    ] as const) {
      rows.push([
        `${name} · ${at + 1} 번째 수 ${values[at]} 뒤`,
        label,
        row(s.low),
        row(s.high),
        `${s.low.length} · ${s.high.length}`,
        s.answer,
      ]);
    }
  };
  pick("전개 입력", WALK, 1);
  pick("오름차순 1 … 6", ASCENDING, ASCENDING.length - 1);
  return md(
    ["자리", "판", "작은 쪽(꺼낼 차례)", "큰 쪽(꺼낼 차례)", "두 크기", "답"],
    rows,
    [5],
  );
}

/* ─────────────────────── 블록 — 비용 계산 ─────────────────────── */

/** `perf.derive` — 전개 아홉 걸음에서 힙 연산이 몇 번인가. */
function perfCount(): string {
  const steps = walk();
  const rows: string[][] = [["무리", "어느 걸음에서", "횟수"]];
  const kinds: [string, Op["heap"], Op["kind"]][] = [
    ["작은 쪽에 넣기", "low", "push"],
    ["작은 쪽에서 꺼내기", "low", "pop"],
    ["큰 쪽에 넣기", "high", "push"],
    ["큰 쪽에서 꺼내기", "high", "pop"],
  ];
  let pushes = 0;
  let pops = 0;
  for (const [name, heap, kind] of kinds) {
    const at = steps
      .filter((s) => s.ops.some((o) => o.heap === heap && o.kind === kind))
      .map((s) => s.id);
    const n = steps.reduce(
      (a, s) =>
        a + s.ops.filter((o) => o.heap === heap && o.kind === kind).length,
      0,
    );
    if (kind === "push") pushes += n;
    else pops += n;
    rows.push([name, at.join(" "), String(n)]);
  }

  const c: Counts = { compares: 0, writes: 0 };
  const mf = new CountedMedianFinder(c);
  for (const v of WALK) {
    mf.addNum(v);
    mf.findMedian();
  }
  if (
    mf.low.pushes + mf.high.pushes !== pushes ||
    mf.low.pops + mf.high.pops !== pops
  ) {
    throw new Error("세는 사본의 힙 연산 수가 정본 기록과 다르다");
  }
  const before = total(c);
  mf.findMedian();
  const byAsk = total(c) - before;
  return [
    ...table(rows, [2]),
    "",
    `수 ${WALK.length} 개를 넣고 그때마다 물어본 실측`,
    ...list([
      ["힙 연산", `넣기 ${pushes} · 꺼내기 ${pops}`],
      ["비교", `${comma(c.compares)} 번`],
      ["칸 쓰기", `${comma(c.writes)} 번`],
      ["합", `${comma(before)} 번`],
      ["물어보기 한 번이 더한 비교와 칸 쓰기", `${byAsk} 번`],
    ]),
  ].join("\n");
}

/** 수 `GEN` 개의 입력 모양 여섯. */
function shapes(): [string, number[]][] {
  const n = GEN;
  return [
    ["오름차순", Array.from({ length: n }, (_, i) => i)],
    ["내림차순", Array.from({ length: n }, (_, i) => n - i)],
    ["전부 같은 값", Array.from({ length: n }, () => 7)],
    [
      "작은 값과 큰 값을 번갈아",
      Array.from({ length: n }, (_, i) =>
        i % 2 === 0 ? -(i >> 1) - 1 : (i >> 1) + 1,
      ),
    ],
    [
      "바깥에서 가운데로",
      Array.from({ length: n }, (_, i) =>
        i % 2 === 0 ? -n + (i >> 1) : n - (i >> 1),
      ),
    ],
    ["생성식 입력", Array.from({ length: n }, (_, i) => streamValue(i))],
  ];
}

let shapeMemo: { name: string; c: Counts }[] | undefined;
function shapeCounts(): { name: string; c: Counts }[] {
  shapeMemo ??= shapes().map(([name, values]) => {
    const c: Counts = { compares: 0, writes: 0 };
    const mf = new CountedMedianFinder(c);
    for (const v of values) mf.addNum(v);
    if (mf.findMedian() !== trueMedian(values)) {
      throw new Error(`${name} 에서 세는 사본의 답이 정의와 다르다`);
    }
    return { name, c };
  });
  return shapeMemo;
}

/** `perf.worst` — 입력 모양 여섯을 실제로 만들어 잰다. */
function worstShape(): string {
  const all = shapeCounts();
  const rows = all.map(({ name, c }) => [
    name,
    comma(c.compares),
    comma(c.writes),
    comma(total(c)),
  ]);
  const most = all.reduce((a, b) => (total(b.c) > total(a.c) ? b : a));
  const asc = all.find((x) => x.name === "오름차순") as {
    name: string;
    c: Counts;
  };
  const more = ((100 * (total(most.c) - total(asc.c))) / total(asc.c)).toFixed(
    0,
  );
  const rest = all.filter((x) => x.name !== "전부 같은 값");
  const fewest = rest.reduce((a, b) => (total(b.c) < total(a.c) ? b : a));
  return [
    md(["입력 모양", "비교", "칸 쓰기", "합"], rows, [1, 2, 3]),
    "",
    `수 ${comma(GEN)} 개를 넣는 동안의 값입니다. 합이 가장 큰 모양은 「${most.name}」이고, 「전부 같은 값」을 빼면 가장 작은 모양은 「${fewest.name}」입니다. 「${most.name}」의 합이 「${asc.name}」보다 ${more} % 많습니다. 질의를 ${comma(GEN)} 번 섞어도 생성식 입력의 합은 ${comma(total(runHeaps(GEN)))} 그대로입니다.`,
  ].join("\n");
}

/** `perf.worst` — 바깥에서 가운데로 좁혀 오는 수열의 앞부분이 두 꼭대기에 대해 놓이는 자리. */
function worstSequence(): string {
  const values = (
    shapes().find(([n]) => n === "바깥에서 가운데로") as [string, number[]]
  )[1];
  const head = values.slice(0, 8);
  const mf = new MedianFinder();
  const heaps = pair(mf);
  let between = 0;
  const rows = head.map((v) => {
    const lowTop = heaps.low.size() > 0 ? heaps.low.peek() : null;
    const highTop = heaps.high.size() > 0 ? heaps.high.peek() : null;
    const spot =
      lowTop === null
        ? "두 힙이 비어 있다"
        : highTop === null
          ? v > lowTop
            ? "작은 쪽 꼭대기보다 크다"
            : "작은 쪽 꼭대기 이하"
          : v > lowTop && v < highTop
            ? "두 꼭대기 사이"
            : v <= lowTop
              ? "작은 쪽 꼭대기 이하"
              : "큰 쪽 꼭대기 이상";
    if (spot === "두 꼭대기 사이") between++;
    mf.addNum(v);
    return [
      String(v),
      lowTop === null ? "없음" : String(lowTop),
      highTop === null ? "없음" : String(highTop),
      spot,
    ];
  });
  return [
    md(
      [
        "들어온 수",
        "넣기 전 작은 쪽 꼭대기",
        "넣기 전 큰 쪽 꼭대기",
        "들어온 수의 자리",
      ],
      rows,
      [0, 1, 2],
    ),
    "",
    `앞 ${head.length} 개 중 ${between} 개가 두 꼭대기 사이에 들어옵니다.`,
  ].join("\n");
}

/** `perf.worst` — 축마다 최악을 만드는 입력. */
function worstAxes(): string {
  const all = shapeCounts();
  const byCmp = all.reduce((a, b) => (b.c.compares > a.c.compares ? b : a));
  const byWrite = all.reduce((a, b) => (b.c.writes > a.c.writes ? b : a));
  const mf = new MedianFinder();
  for (let i = 0; i < CALLS; i++) mf.addNum(i);
  const lowSize = pair(mf).low.size();
  const ends = [-1_000_000_000, 1_000_000_000];
  return md(
    ["최악으로 만들 축", "입력", "값"],
    [
      [
        "비교",
        `「${byCmp.name}」`,
        `수 ${comma(GEN)} 개에 ${comma(byCmp.c.compares)} 번`,
      ],
      [
        "칸 쓰기",
        `「${byWrite.name}」`,
        `수 ${comma(GEN)} 개에 ${comma(byWrite.c.writes)} 번`,
      ],
      [
        "힙의 크기",
        `addNum 만 ${comma(CALLS)} 번`,
        `작은 쪽 ${comma(lowSize)} 칸`,
      ],
      [
        "값의 크기",
        `양 끝 값 ${ends.join(" · ")}`,
        `정본의 답 ${refAnswers(ends).at(-1)}`,
      ],
    ],
  );
}

/* ─────────────────────── 블록 — 스스로 점검하기 ─────────────────────── */

/** `selfcheck` — T5 가 실행한 세 줄. */
function selfcheckT5(): string {
  const step = walk().find((s) => s.id === "T5") as WalkStep;
  const { adds } = runRecorded(WALK.slice(0, 2));
  const r = adds[1] as AddRecord;
  if (step.low.join(" ") !== r.end.low.join(" ")) {
    throw new Error("T5 의 기록이 두 번째 addNum 과 다르다");
  }
  const back = r.returned !== null;
  const rows = [
    [
      `① 작은 쪽 ${row(lowOrder(step.before))} 에 ${r.num}${을를(r.num)} 넣는다`,
      `작은 쪽 ${row(lowOrder(r.afterPush))}`,
    ],
    [
      "② 꼭대기를 큰 쪽으로",
      `작은 쪽 ${row(lowOrder(r.afterMove))} · 큰 쪽 ${row(highOrder(r.afterMove))}`,
    ],
    [
      `③ 크기 ${r.afterMove.low.length}${과와(r.afterMove.low.length)} ${r.afterMove.high.length}${이라(r.afterMove.high.length)} ${back ? "참" : "거짓"}`,
      back
        ? `작은 쪽 ${row(lowOrder(r.end))} · 큰 쪽 ${row(highOrder(r.end))}`
        : "그대로",
    ],
  ];
  return ["T5 가 실행한 세 줄", ...table(rows).map((l) => `  ${l}`)].join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 수 다섯을 넣을 때마다의 답. */
  "concept-stream": conceptStream,
  /** `deep.origin` ② — 가장 단순한 방법의 값. */
  naiveScale,
  /** `deep.origin` ③ — 정렬이 만든 자리 중 답이 읽는 자리. */
  halfOnly,
  /** `deep.origin` ④ — 같은 입력을 두 방식으로. */
  twoWays,
  /** `deep.origin` ⑤ — 중앙값 하나만 들면 새 중앙값이 안 정해진다. */
  "origin-one-value": originOneValue,
  /** `deep.build` 개념 — 하나를 읽는 법. */
  "build-read": buildRead,
  /** `deep.build` 개념 — 두 힙 사이의 관계. */
  "build-relation": buildRelation,
  /** `deep.build` 개념 — 힙 배열과 정렬한 반쪽. */
  "build-array": buildArray,
  /** `deep.build` 2단계 — 쉬운 경우와 불안한 경우. */
  "build-cases": buildCases,
  /** `deep.build` 3단계 — ③ 앞뒤의 두 크기. */
  "build-sizes": buildSizes,
  /** `deep.build` 4단계 — 두 꼭대기로 답을 만든다. */
  "build-answer": buildAnswer,
  /** `deep.build` 설계 선택 — 경계 자리 스윕. */
  boundarySweep,
  /** `deep.build` 설계 선택 — N = 5 에서 경계를 옮기면. */
  "boundary-n5": boundaryAtFive,
  /** `deep.walk` 도입 — 전개 입력. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 방향만 다른 두 힙. */
  "walk-heap-sign": walkHeapSign,
  /** 짚고 가기 — 두 힙을 같은 방향으로. */
  pauseSameDirection,
  /** 짚고 가기 — 두 판의 상태가 갈리는 자리. */
  "pause-same-states": pauseSameStates,
  /** `deep.walk` 2 — 첫 두 수의 세 줄. */
  "walk-add-two": walkAddTwo,
  /** 짚고 가기 — 값으로만 가른 판. */
  pauseValueSplit,
  /** 짚고 가기 — 값으로만 가른 판의 두 힙. */
  "pause-split-states": pauseSplitStates,
  /** `deep.walk` 3 — 아홉 걸음. */
  walkTrace,
  /** `deep.walk` 3 — 라벨 넷의 피복. */
  "walk-labels": walkLabels,
  /** 짚고 가기 — 알맞은 쪽에 바로 넣는 판. */
  pauseDirectPush,
  /** 짚고 가기 — 두 판이 부르는 힙 연산 수. */
  "pause-direct-ops": pauseDirectOps,
  /** `deep.walk.final` — 전체 코드의 답. */
  "final-calls": finalCalls,
  /** `related` — 순서통계량의 자리. */
  "related-rank": relatedRank,
  /** `purpose.alt` — 뒤집히는 자리 둘레. */
  altAround,
  /** `deep.math` — 정의를 자리 번호로. */
  "math-positions": mathPositions,
  /** `deep.math` — k 로 자른 두 무리. */
  "math-cut": mathCut,
  /** `deep.math` — 정의를 전개 입력에 넣는다. */
  mathCheck,
  /** `deep.math` — 두 꼭대기의 자리. */
  "math-tops": mathTops,
  /** `deep.math` — 닫힌 형태의 검산. */
  "math-logsum": mathLogSum,
  /** `deep.math` — 닫힌 형태에 규모를 넣는다. */
  mathScale,
  /** `invariant` ② — 경계 입력. */
  edgeCases,
  /** `invariant` ③ — `>` 를 `>=` 로. */
  mutantSizeRule,
  /** `invariant` ③ — 두 판의 두 힙. */
  "mutant-size-states": mutantSizeStates,
  /** `perf.derive` — 전개의 힙 연산. */
  perfCount,
  /** `perf.worst` — 입력 모양 여섯. */
  worstShape,
  /** `perf.worst` — 바깥에서 가운데로 좁혀 오는 수열. */
  "worst-sequence": worstSequence,
  /** `perf.worst` — 축마다 최악. */
  "worst-axes": worstAxes,
  /** `selfcheck` — T5 의 세 줄. */
  "selfcheck-t5": selfcheckT5,
};
