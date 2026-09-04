/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.md
 *
 * **계수를 세는 힙 사본은 `.alt.ts` 가 갖는다.** 정본은 몇 번 견줬는지를 내보내지 않으므로
 * 세는 자리를 덧붙인 사본이 있어야 하는데, 그 사본이 두 벌이면 두 벌이 갈린다. 경쟁 설계와
 * 같은 자로 재야 하는 것도 같은 이유다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 블록의 「답」 칸은 전부 정본이나 정본에서
 * 기계로 만든 변이가 낸 값이다. 손으로 적은 절차가 둘 있는데(값으로만 갈라 넣는 판 · 알맞은
 * 쪽에 바로 넣는 판) 둘 다 **줄을 더하고 빼는 변경**이라 `loadMutant`(한 줄 삭제·치환)로
 * 만들 수 없다.
 */
import { join } from "node:path";
import { loadMutant } from "../../../../tools/check-proof.ts";
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
 * 참과 거짓, 중앙값의 두 갈래(개수가 홀수일 때와 짝수일 때)다. 마지막 `5` 는 앞에 이미 있는
 * 값이라 중복이 어떻게 다뤄지는지도 같은 자리에서 나온다.
 */
export const WALK: number[] = [5, 15, 1, 3, 5];

/** 전개 입력 다섯에 일곱을 이어 붙인 열둘. 경계 자리를 스윕하는 자리가 쓴다. */
const SWEEP_INPUT: number[] = [5, 15, 1, 3, 5, 9, 2, 12, 7, 4, 11, 8];

/** 오름차순으로만 들어오는 짧은 수열. 「값으로만 가른다」가 어디서 실패하는지 보이는 자리다. */
const ASCENDING: number[] = [1, 2, 3, 4, 5, 6];

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `19,999,600,002` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 힙 배열을 `5 1 3` 꼴로 적는다. 정렬하지 않고 배열에 놓인 순서 그대로다. */
const row = (xs: number[]): string =>
  xs.length === 0 ? "(비어 있음)" : xs.join(" ");

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
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

/**
 * 표 아래에 붙는 「이름 — 값」 목록. **값 열의 자리를 가장 긴 이름에서 잰다.**
 * 구분 공백을 고정으로 박으면 이름이 길어진 줄만 값이 통째로 밀린다.
 */
function list(rows: [string, string][], gap = 2): string[] {
  const w = Math.max(...rows.map(([name]) => width(name)));
  return rows.map(
    ([name, value]) => `  ${pad(name, w)}${" ".repeat(gap)}${value}`,
  );
}

/* ────────────────────── 참값 — 정렬해서 고른다 ────────────────────── */

/** 정의 그대로의 중앙값. 다른 절차가 낸 답을 견주는 기준이다. */
export function trueMedian(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (n % 2 === 1) return s[(n - 1) / 2] as number;
  return ((s[n / 2 - 1] as number) + (s[n / 2] as number)) / 2;
}

/** 정본이 그 수열에서 걸음마다 내놓는 답. */
function refAnswers(values: number[]): number[] {
  const mf = new MedianFinder();
  return values.map((v) => {
    mf.addNum(v);
    return mf.findMedian();
  });
}

/* ────────────── 기법 없는 설계 둘 — 견주기와 칸 쓰기를 센다 ────────────── */

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
function runSortEveryTime(values: number[]): Counts {
  const c: Counts = { compares: 0, writes: 0 };
  const kept: number[] = [];
  for (const v of values) {
    kept.push(v);
    c.writes++;
    mergeSortCounted(kept, c);
  }
  return c;
}

/** 방식 B — 정렬된 배열을 그대로 두고 새 수만 알맞은 자리에 끼워 넣는다. */
function runKeepSorted(values: number[]): Counts {
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
 * 두 힙 설계의 견주기 + 칸 쓰기 상한 — `17·Σ⌈log2 i⌉ + 5N`.
 *
 * 한 번의 `addNum` 은 힙 연산 다섯을 넘지 않는다(넣기 셋 · 꺼내기 둘). 힙 높이를 `h` 라 하면
 * 넣기 하나가 `3h + 1`, 꺼내기 하나가 `4h + 1` 이하이므로 `3(3h+1) + 2(4h+1) = 17h + 5` 다.
 */
function heapBound(n: number): number {
  return 17 * logSum(n) + 5 * n;
}

/* ────────────── 손으로 적은 두 판 — 변이로는 못 만든다 ────────────── */

/** 값이 작은 쪽 꼭대기 이하면 작은 쪽에, 아니면 큰 쪽에 넣고 **개수는 맞추지 않는다**. */
class ValueSplitMedian {
  private readonly low = new Heap(-1);
  private readonly high = new Heap(1);

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
  private readonly low: CountedHeap;
  private readonly high: CountedHeap;

  constructor(private readonly c: Counts) {
    this.low = new CountedHeap(-1, c);
    this.high = new CountedHeap(1, c);
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

function mutantAnswers(mod: Impl, values: number[]): (number | string)[] {
  const mf = new mod.MedianFinder();
  return values.map((v) => {
    mf.addNum(v);
    const got = mf.findMedian();
    return Number.isNaN(got) || got === undefined ? "없다" : got;
  });
}

/* ────────────────────────── 전개 표 ────────────────────────── */

interface WalkRow {
  step: string;
  did: string;
  branch: string;
  low: number[];
  high: number[];
  n: number;
  median: string;
  /** 그 걸음에서 늘어난 힙 연산 — 작은 쪽 넣기·꺼내기, 큰 쪽 넣기·꺼내기. */
  ops: [number, number, number, number];
}

/**
 * 전개의 아홉 걸음. 첫 수 하나는 `addNum` 의 세 줄을 갈라 T2·T3·T4 로 보이고, 그 뒤 넷은
 * 한 걸음이 `addNum` 한 벌과 `findMedian` 한 벌이다.
 */
export function walkRows(): WalkRow[] {
  const c: Counts = { compares: 0, writes: 0 };
  const mf = new CountedMedianFinder(c);
  const rows: WalkRow[] = [];
  let seen: [number, number, number, number] = [0, 0, 0, 0];

  const snap = (step: string, did: string, branch: string, median: string) => {
    const now: [number, number, number, number] = [
      mf.low.pushes,
      mf.low.pops,
      mf.high.pushes,
      mf.high.pops,
    ];
    rows.push({
      step,
      did,
      branch,
      low: mf.low.snapshot(),
      high: mf.high.snapshot(),
      n: mf.size(),
      median,
      ops: [
        now[0] - seen[0],
        now[1] - seen[1],
        now[2] - seen[2],
        now[3] - seen[3],
      ],
    });
    seen = now;
  };

  snap("T1", "시작값 — 두 힙이 비어 있다", "-", "-");

  const first = WALK[0] as number;
  mf.low.push(first);
  snap("T2", `addNum(${first}) — 작은 쪽에 넣는다`, "①", "-");
  mf.high.push(mf.low.pop());
  snap("T3", `addNum(${first}) — 꼭대기를 큰 쪽으로 옮긴다`, "②", "-");
  if (mf.high.size() > mf.low.size()) mf.low.push(mf.high.pop());
  snap(
    "T4",
    `addNum(${first}) — 도로 옮긴다 · findMedian`,
    "③ 참 · ④ 거짓",
    String(mf.findMedian()),
  );

  const labels = ["T5", "T6", "T7", "T8"];
  for (let i = 1; i < WALK.length; i++) {
    const v = WALK[i] as number;
    const beforeReturns = mf.high.pops;
    mf.addNum(v);
    const moved = mf.high.pops > beforeReturns;
    const even = mf.low.size() === mf.high.size();
    snap(
      labels[i - 1] as string,
      `addNum(${v}) · findMedian`,
      `③ ${moved ? "참" : "거짓"} · ④ ${even ? "참" : "거짓"}`,
      String(mf.findMedian()),
    );
  }

  snap("T9", "종료 — 다섯 수가 다 들어왔다", "-", String(mf.findMedian()));
  return rows;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 가장 단순한 방법의 값. */
  naiveScale: () => {
    const rows: string[][] = [
      ["수의 개수 N", "실측 견주기 + 칸 쓰기", "닫힌 형태 상한"],
    ];
    for (const n of [32, 64, 128, 256]) {
      const values = Array.from({ length: n }, (_, i) => streamValue(i));
      rows.push([
        comma(n),
        comma(total(runSortEveryTime(values))),
        comma(sortEveryTimeBound(n)),
      ]);
    }
    const q = 50_000;
    const bound = sortEveryTimeBound(q);
    return [
      ...table(rows, [0, 1, 2]),
      "",
      `제약 규모 Q = 100,000 (넣기 ${comma(q)} · 묻기 ${comma(q)}) 이면`,
      `  물어볼 때마다 전부 정렬한다  ${comma(bound)} 번 이하`,
      `  초당 1 억 번 기준            ${(bound / 1e8).toFixed(0)} 초`,
    ].join("\n");
  },

  /** `deep.build` ③ — 정렬이 만든 자리 중 답이 읽는 자리. */
  halfOnly: () => {
    const rows: string[][] = [["넣은 수", "정렬 결과", "답이 읽는 자리", "답"]];
    let made = 0;
    let read = 0;
    for (let i = 0; i < WALK.length; i++) {
      const values = WALK.slice(0, i + 1);
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      const spot =
        n % 2 === 1 ? `${(n + 1) / 2} 번째` : `${n / 2}·${n / 2 + 1} 번째`;
      made += n;
      read += n % 2 === 1 ? 1 : 2;
      rows.push([
        values.join(" "),
        sorted.join(" "),
        spot,
        String(trueMedian(values)),
      ]);
    }
    return [
      ...table(rows),
      "",
      `정렬이 만든 자리 ${made} 개 중 답이 읽은 자리는 ${read} 개다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로. */
  twoWays: () => {
    const rows: string[][] = [
      ["수의 개수 N", "방식", "견주기", "칸 쓰기", "합"],
    ];
    for (const n of [5, 256]) {
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
      `N = 256 에서 끼워 넣기의 견주기는 ${comma(b.compares)} 번인데 칸 쓰기가 ${comma(b.writes)} 번이다`,
      `그 칸 쓰기는 자리 하나를 비우려고 뒤의 값을 하나씩 옮겨 적은 것이다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 경계 자리를 다섯 값으로 놓고 맞은 답 수를 센다. */
  boundarySweep: () => {
    const limit = SWEEP_INPUT.length;
    // `N` 이 5 보다 작으면 `⌈N/2⌉ ± 2` 가 배열 밖으로 나가서 「자리가 없다」만 나온다.
    // 그 자리는 답이 틀린 것이 아니라 물어볼 수 없는 것이라 스윕을 5 부터 시작한다.
    const from = 5;
    const tried = limit - from + 1;
    const rows: string[][] = [
      [
        "작은 쪽의 크기",
        "맞은 답",
        "처음 어긋나는 N",
        "그때 낸 답",
        "참 중앙값",
      ],
    ];
    for (const s of [-2, -1, 0, 1, 2]) {
      let ok = 0;
      let firstBad = "-";
      let gave = "-";
      let want = "-";
      for (let n = from; n <= limit; n++) {
        const sorted = SWEEP_INPUT.slice(0, n).sort((a, b) => a - b);
        const k = Math.ceil(n / 2) + s;
        const truth = trueMedian(sorted);
        if (k < 1 || k > n) {
          if (firstBad === "-") {
            firstBad = String(n);
            gave = "자리가 없다";
            want = String(truth);
          }
          continue;
        }
        const lowTop = sorted[k - 1] as number;
        const highTop = k < n ? (sorted[k] as number) : Number.NaN;
        const got = k === n - k ? (lowTop + highTop) / 2 : lowTop;
        if (got === truth) ok++;
        else if (firstBad === "-") {
          firstBad = String(n);
          gave = String(got);
          want = String(truth);
        }
      }
      rows.push([
        `⌈N/2⌉ ${s === 0 ? "그대로" : s > 0 ? `+ ${s}` : `− ${-s}`}`,
        `${ok} / ${tried}`,
        firstBad,
        gave,
        want,
      ]);
    }
    return [
      ...table(rows),
      "",
      `N = ${from} … ${limit} 을 전부 시험한 값이다. 가운데 줄만 ${tried} 번 다 맞다`,
    ].join("\n");
  },

  /** `deep.walk` — 아홉 걸음의 상태와 답. */
  walkTrace: () => {
    const rows: string[][] = [
      [
        "걸음",
        "한 일",
        "갈래",
        "작은 쪽(배열 순서)",
        "큰 쪽(배열 순서)",
        "N",
        "중앙값",
      ],
    ];
    const all = walkRows();
    for (const r of all) {
      rows.push([
        r.step,
        r.did,
        r.branch,
        row(r.low),
        row(r.high),
        String(r.n),
        r.median,
      ]);
    }
    const last = all.at(-1) as WalkRow;
    return [
      ...table(rows),
      "",
      `마지막 findMedian 의 반환값은 ${last.median} 이다`,
    ].join("\n");
  },

  /** 멈춤 1 — 값으로만 가르고 개수를 안 맞춘 판. */
  pauseValueSplit: () => {
    const make = (values: number[]) => {
      const v = new ValueSplitMedian();
      return values.map((x) => {
        v.addNum(x);
        return v.findMedian();
      });
    };
    const rows: string[][] = [
      ["수열", "정본이 낸 답", "값으로만 가른 답", "판정"],
    ];
    for (const [name, values] of [
      ["전개 입력", WALK],
      ["오름차순 1 … 6", ASCENDING],
    ] as [string, number[]][]) {
      const a = refAnswers(values);
      const b = make(values);
      rows.push([
        name,
        a.join(" "),
        b.join(" "),
        a.join(",") === b.join(",") ? "같다" : "틀리다",
      ]);
    }
    return table(rows).join("\n");
  },

  /** 멈춤 2 — 두 힙을 같은 방향으로 둔 변이. */
  pauseSameDirection: () => {
    const rows: string[][] = [
      ["수열", "정본이 낸 답", "둘 다 최소 힙인 답", "판정"],
    ];
    for (const [name, values] of [
      ["전개 입력", WALK],
      ["오름차순 1 … 6", ASCENDING],
    ] as [string, number[]][]) {
      const a = refAnswers(values);
      const b = mutantAnswers(sameDirection, values);
      rows.push([
        name,
        a.join(" "),
        b.join(" "),
        a.join(",") === b.join(",") ? "같다" : "틀리다",
      ]);
    }
    return table(rows).join("\n");
  },

  /** 멈춤 3 — 알맞은 쪽에 바로 넣는 판. 답은 같고 계수만 갈린다. */
  pauseDirectPush: () => {
    const direct = (values: number[], c: Counts) => {
      const d = new DirectPushMedian(c);
      return values.map((x) => {
        d.addNum(x);
        return d.findMedian();
      });
    };
    const rows: string[][] = [
      ["수열", "정본이 낸 답", "바로 넣은 판의 답", "판정"],
    ];
    for (const [name, values] of [
      ["전개 입력", WALK],
      ["오름차순 1 … 6", ASCENDING],
    ] as [string, number[]][]) {
      const c: Counts = { compares: 0, writes: 0 };
      const a = refAnswers(values);
      const b = direct(values, c);
      rows.push([
        name,
        a.join(" "),
        b.join(" "),
        a.join(",") === b.join(",") ? "같다" : "틀리다",
      ]);
    }

    const n = 4096;
    const c: Counts = { compares: 0, writes: 0 };
    const d = new DirectPushMedian(c);
    for (let i = 0; i < n; i++) d.addNum(streamValue(i));
    const ours = runHeaps(0);
    return [
      ...table(rows),
      "",
      `생성식 입력 ${comma(n)} 개를 넣는 동안의 계수`,
      ...list(
        [
          ["이 글의 절차", `${comma(total(ours))} 번`],
          ["바로 넣은 판", `${comma(total(c))} 번`],
          [
            "줄어드는 비율",
            `${(100 - (100 * total(c)) / total(ours)).toFixed(1)} %`,
          ],
        ],
        7,
      ),
    ].join("\n");
  },

  /** `deep.math` — 정의를 전개 입력에 넣어 확인한다. */
  mathCheck: () => {
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
      const values = WALK.slice(0, i + 1);
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      const k = Math.ceil(n / 2);
      const lowTop = sorted[k - 1] as number;
      const highTop = k < n ? (sorted[k] as number) : Number.NaN;
      const byFormula = n % 2 === 0 ? (lowTop + highTop) / 2 : lowTop;
      mf.addNum(WALK[i] as number);
      rows.push([
        String(n),
        sorted.join(" "),
        String(k),
        String(lowTop),
        Number.isNaN(highTop) ? "없다" : String(highTop),
        String(byFormula),
        String(mf.findMedian()),
      ]);
    }
    return table(rows, [0, 2, 3, 4, 5, 6]).join("\n");
  },

  /** `deep.math` — 닫힌 형태에 규모를 넣는다. */
  mathScale: () => {
    const rows: string[][] = [
      ["수의 개수 N", "실측 견주기 + 칸 쓰기", "17·Σ⌈log2 i⌉ + 5N 상한"],
    ];
    for (const n of [256, 1024, 4096]) {
      const c: Counts = { compares: 0, writes: 0 };
      const mf = new CountedMedianFinder(c);
      for (let i = 0; i < n; i++) mf.addNum(streamValue(i));
      rows.push([comma(n), comma(total(c)), comma(heapBound(n))]);
    }
    const q = 50_000;
    return [
      ...table(rows, [0, 1, 2]),
      "",
      `제약 규모 Q = 100,000 (넣기 ${comma(q)} · 묻기 ${comma(q)}) 이면`,
      `  두 힙                        ${comma(heapBound(q))} 번 이하`,
      `  물어볼 때마다 전부 정렬한다  ${comma(sortEveryTimeBound(q))} 번 이하`,
      `  두 값의 비                   ${comma(Math.round(sortEveryTimeBound(q) / heapBound(q)))} 배`,
    ].join("\n");
  },

  /** `invariant` ③ — 개수 규칙을 지키던 줄을 한 글자 바꾼다. */
  mutantSizeRule: () => {
    const rows: string[][] = [
      ["수열", "정본이 낸 답", "`>` 를 `>=` 로 바꾼 답", "판정"],
    ];
    for (const [name, values] of [
      ["전개 입력", WALK],
      ["오름차순 1 … 6", ASCENDING],
    ] as [string, number[]][]) {
      const a = refAnswers(values);
      const b = mutantAnswers(looseSize, values);
      rows.push([
        name,
        a.join(" "),
        b.join(" "),
        a.join(",") === b.join(",") ? "같다" : "틀리다",
      ]);
    }
    return table(rows).join("\n");
  },

  /** `perf.derive` — 전개 아홉 걸음에서 힙 연산이 몇 번인가. */
  perfCount: () => {
    const all = walkRows();
    const rows: string[][] = [["무리", "어느 걸음에서", "횟수"]];
    const kinds: [string, number][] = [
      ["작은 쪽에 넣기", 0],
      ["작은 쪽에서 꺼내기", 1],
      ["큰 쪽에 넣기", 2],
      ["큰 쪽에서 꺼내기", 3],
    ];
    for (const [name, idx] of kinds) {
      const at = all
        .filter((r) => (r.ops[idx] as number) > 0)
        .map((r) => r.step);
      const n = all.reduce((s, r) => s + (r.ops[idx] as number), 0);
      rows.push([name, at.join(" "), String(n)]);
    }

    const c: Counts = { compares: 0, writes: 0 };
    const mf = new CountedMedianFinder(c);
    for (const v of WALK) {
      mf.addNum(v);
      mf.findMedian();
    }
    return [
      ...table(rows, [2]),
      "",
      `수 ${WALK.length} 개를 넣고 그때마다 물어본 실측`,
      ...list([
        [
          "힙 연산",
          `넣기 ${mf.low.pushes + mf.high.pushes} · 꺼내기 ${mf.low.pops + mf.high.pops}`,
        ],
        ["견주기", `${comma(c.compares)} 번`],
        ["칸 쓰기", `${comma(c.writes)} 번`],
        ["합", `${comma(total(c))} 번`],
        ["물어보기가 더한 견주기와 칸 쓰기", "0 번"],
      ]),
    ].join("\n");
  },

  /** `perf.worst` — 입력 모양 넷을 실제로 만들어 잰다. */
  worstShape: () => {
    const n = 4096;
    const shapes: [string, number[]][] = [
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
    const rows: string[][] = [["입력 모양", "견주기", "칸 쓰기", "합"]];
    for (const [name, values] of shapes) {
      const c: Counts = { compares: 0, writes: 0 };
      const mf = new CountedMedianFinder(c);
      for (const v of values) mf.addNum(v);
      rows.push([name, comma(c.compares), comma(c.writes), comma(total(c))]);
    }
    return [
      ...table(rows, [1, 2, 3]),
      "",
      `수 ${comma(n)} 개를 넣는 동안의 값이다`,
      `질의를 ${comma(n)} 번 섞어도 생성식 입력의 합은 ${comma(total(runHeaps(n)))} 그대로다`,
    ].join("\n");
  },

  /** `invariant` ② — 경계 입력에서 정본이 내는 답. */
  edgeCases: () => {
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
  },

  /** `purpose.alt` 의 뒷받침 — 뒤집히는 자리 둘레를 한 회씩 재 본다. */
  altAround: () => {
    const rows: string[][] = [
      ["물어본 횟수 q", "이 글의 절차", "매번 골라내기", "어느 쪽이 적은가"],
    ];
    for (const q of [69, 70, 71, 72, 73, 74]) {
      const a = total(runHeaps(q));
      const b = total(runSelect(q));
      rows.push([
        comma(q),
        comma(a),
        comma(b),
        a < b ? "이 글의 절차" : "매번 골라내기",
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
  },
};
