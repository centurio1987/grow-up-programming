/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 걸음 기록(`trace`)은 그림 사이드카와 같은 것을 쓴다 — 그 기록은 정본의 답과 대조된 것이다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/countingSort/countingSort-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { mergeCounts } from "./countingSort-guide.alt.ts";
import {
  allPairs,
  BIG,
  countingAccess,
  K,
  num,
  rescanAccess,
  secondsOf,
  show,
  spread,
  trace,
  WALK,
  walkSteps,
} from "./countingSort-guide.fig.tsx";
import { countingSort } from "./countingSort-guide.ref.ts";

const REF = new URL("./countingSort-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 모양 ───────────────────────── */

/** 소수 첫째 자리까지. 원소 하나당 비용처럼 나눗셈이 들어간 칸에 쓴다. */
const num1 = (n: number): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** 마크다운 표. 첫 열은 왼쪽, 나머지는 `align` 이 정한다(`r` 오른쪽 · `l` 왼쪽, 기본 오른쪽). */
function md(head: string[], rows: string[][], align = ""): string {
  const sep = head.map((_, c) =>
    c === 0 || align[c - 1] === "l" ? "---" : "---:",
  );
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(sep), ...rows.map(line)].join("\n");
}

/** 표 아래 문장까지 한 블록 — `<!--/proof-->` 로 닫는 모양이다. */
const withNote = (table: string, note: string): string => `${table}\n\n${note}`;

const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, k) => x === b[k]);

const sumOf = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

/** 고정폭 화면의 폭 — 한글은 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

/** 두 열 — 왼쪽 열을 가장 긴 폭에 맞추고 `gap` 을 둔 뒤 오른쪽 열을 쓴다. */
const columns = (rows: [string, string][], gap: string): string[] => {
  const w = Math.max(...rows.map(([l]) => width(l)));
  return rows.map(([l, r]) => `${l}${" ".repeat(w - width(l))}${gap}${r}`);
};

/** 단위 앞에 붙는 수 — 「네 줄」 · 「일곱 칸」. */
const HAN = ["영", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟"];
const han = (n: number): string => HAN[n] ?? String(n);

/* ─────────────────── 정본에서 기계로 만든 변이 ─────────────────── */

/** 값의 종류 수를 정하는 그 한 줄. */
const K_LINE = /^const K = 1001;$/;
/** 개수를 하나 늘리는 그 한 줄 — 불변식을 지키던 줄이다. */
const COUNT_LINE =
  /^(\s*)for \(const v of A\) count\[v\] = \(count\[v\] as number\) \+ 1;$/;

type Sorter = { countingSort(A: number[]): number[] };

/** 칸을 1000 개만 잡은 사본. 값 1000 이 칸을 못 갖는다. */
const size1000 = await loadMutant<Sorter>(REF, {
  swap: [K_LINE, "const K = 1000;"],
});

/** 개수 대신 「나왔다」만 적는 사본. 같은 값이 여럿이어도 1 로 남는다. */
const flagOnly = await loadMutant<Sorter>(REF, {
  swap: [COUNT_LINE, "$1for (const v of A) count[v] = 1;"],
});

/*
 * 중화 실행(`check-proof` 가 변이를 만들되 적용하지 않고 한 번 더 부른다)에서는 두 사본이 정본
 * 그 자체다. 그때 「변이가 답을 바꿨다」는 자기검사는 거짓이 되므로 **값에서** 알아내 건너뛴다
 * (SPEC §0 「증명 블록 규격」).
 */
const neutral1000 = size1000.countingSort === countingSort;
const neutralFlag = flagOnly.countingSort === countingSort;

/* ─────────────── 계측한 사본 — 손으로 적지 않고 실행해 센다 ─────────────── */

/** 배열 칸을 읽거나 쓴 횟수를 갈래마다 가른 값. */
interface Split {
  init: number;
  tally: number;
  scan: number;
  write: number;
  out: number[];
}

/**
 * 정본과 **같은 절차**를 갈래마다 접근 수를 세며 실행한다. 값의 종류 수 `k` 를 밖에서 받는
 * 것만 다르다 — 정본은 그 값이 1001 로 고정이라 `k` 를 바꿔 가며 잴 수 없다. `k = 1001` 에서
 * 정본과 같은 답을 내는지 아래에서 확인한다.
 */
function split(A: readonly number[], k = K): Split {
  const count = new Array<number>(k).fill(0);
  const s: Split = { init: k, tally: 0, scan: 0, write: 0, out: [] };
  for (const v of A) {
    s.tally += 3; // A[i] 읽기 · count[v] 읽기 · count[v] 쓰기
    count[v] = (count[v] as number) + 1;
  }
  for (let v = 0; v < k; v++) {
    s.scan += 1; // count[v] 읽기
    for (let t = count[v] as number; t > 0; t--) {
      s.write += 1; // out 에 한 칸 쓰기
      s.out.push(v);
    }
  }
  return s;
}
const total = (s: Split): number => s.init + s.tally + s.scan + s.write;

/** 가장 단순한 방법 — 모든 쌍을 비교해 순서가 틀렸으면 맞바꾼다. 바퀴마다 기록한다. */
function naive(A: readonly number[]) {
  const B = Array.from(A);
  let access = 2 * A.length; // 복사 — 읽기 N + 쓰기 N
  let compares = 0;
  let equal = 0;
  const rounds: { p: number; compares: number; swaps: number; B: number[] }[] =
    [];
  for (let p = 0; p < B.length; p++) {
    let c = 0;
    let w = 0;
    for (let q = p + 1; q < B.length; q++) {
      access += 2;
      c++;
      if (B[p] === B[q]) equal++;
      if ((B[p] as number) > (B[q] as number)) {
        access += 4; // 맞바꿈 — 읽기 2 + 쓰기 2
        w++;
        const tmp = B[p] as number;
        B[p] = B[q] as number;
        B[q] = tmp;
      }
    }
    compares += c;
    rounds.push({ p, compares: c, swaps: w, B: [...B] });
  }
  return { access, compares, equal, rounds, out: B };
}

/* ───────────────────────── 입력들 ───────────────────────── */

const SEVEN_SORTED = countingSort([...WALK]);
const SEVEN_REVERSED = [...SEVEN_SORTED].reverse();
const ARRANGED: [string, number[]][] = [
  ["전개 입력", WALK],
  ["이미 정렬", SEVEN_SORTED],
  ["역순", SEVEN_REVERSED],
];

/* ───────── 실행이 판정하는 사실들 — 어긋나면 그 자리에서 던진다 ───────── */

// 계측 사본이 `k = 1001` 에서 정본과 같은 답을 내는가.
for (const A of [
  WALK,
  SEVEN_REVERSED,
  [],
  [1000, 0, 500, 1000, 0],
  spread(500),
]) {
  if (!same(split(A).out, countingSort([...A]))) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${show(A)}`);
  }
}

// 접근 수의 닫힌 형태 `2K + 4N` 이 실측과 같은가. 그림 사이드카의 계수도 같은 값을 내는가.
for (const [A, k] of [
  [WALK, 8],
  [WALK, K],
  [spread(1_000), K],
  [spread(BIG), K],
] as [number[], number][]) {
  const got = total(split(A, k));
  if (got !== 2 * k + 4 * A.length || got !== countingAccess(A, k)) {
    throw new Error(`접근 수가 2K + 4N 과 다르다 — N=${A.length}, K=${k}`);
  }
}

// 모든 쌍 비교의 횟수가 입력 모양과 무관하게 `N(N−1)/2` 인가. 큰 `N` 은 이 식으로 값을 낸다.
for (let n = 0; n <= 200; n++) {
  const up = spread(n);
  const sorted = countingSort([...up]);
  for (const A of [up, sorted, [...sorted].reverse()]) {
    const r = naive(A);
    if (r.compares !== allPairs(n)) {
      throw new Error(`모든 쌍 비교가 N(N−1)/2 와 다르다 — N=${n}`);
    }
    if (!same(r.out, countingSort([...A]))) {
      throw new Error(`모든 쌍 비교가 다른 답을 냈다 — N=${n}`);
    }
  }
}

/* ───────── 전체 컨셉 ───────── */

function conceptCost(): string {
  const rows = [
    ["전개 입력 일곱 칸", WALK],
    [`생성식 ${num(BIG)} 칸`, spread(BIG)],
  ] as [string, number[]][];
  return md(
    ["입력", "N", "K", "비교", "배열 접근"],
    rows.map(([name, A]) => [
      name,
      num(A.length),
      num(K),
      "0",
      num(total(split(A))),
    ]),
  );
}

/* ───────── deep.origin ② — 모든 쌍 비교를 과제 규모까지 ───────── */

function originNaive(): string {
  return withNote(
    md(
      ["칸 수", "모든 쌍 비교", "시간(초당 1 억 번)"],
      [7, 1_000, BIG].map((n) => [
        num(n),
        num(allPairs(n)),
        secondsOf(allPairs(n)),
      ]),
    ),
    "칸 0 개부터 200 개까지 입력 세 모양(생성식 · 정렬 · 역순)에서 실제로 세어 모든 쌍 비교가 N(N−1)/2 번인 것을 확인했고, 큰 칸 수는 이 식으로 냈습니다.",
  );
}

/* ───────── deep.origin ③ — 일곱 칸에서 모든 쌍 비교가 하는 일 ───────── */

function originPairs(): string {
  const r = naive(WALK);
  return withNote(
    md(
      ["바깥 칸 p", "비교", "맞바꿈", "바퀴 뒤 B"],
      r.rounds.map((x) => [
        String(x.p),
        String(x.compares),
        String(x.swaps),
        show(x.B),
      ]),
      "rrl",
    ),
    `비교는 모두 ${r.compares} 번이고, 그중 값이 같은 두 칸을 비교한 것이 ${r.equal} 번입니다.`,
  );
}

/** 값마다의 개수 — 칸 0 … 최댓값. */
const tally = (A: readonly number[]): number[] =>
  trace(A).counts.at(-1)?.snapshot.slice() ?? [];

function originMultiset(): string {
  const answers = ARRANGED.map(([, A]) => countingSort([...A]));
  if (!answers.every((a) => same(a, answers[0] as number[]))) {
    throw new Error("같은 다중집합의 배치가 다른 답을 냈다");
  }
  const tallies = ARRANGED.map(([, A]) => tally(A).join(" "));
  if (!tallies.every((x) => x === tallies[0])) {
    throw new Error("같은 다중집합인데 값마다의 개수가 다르다");
  }
  return withNote(
    md(
      ["입력", "값 0 … 5 의 개수", "정렬 결과"],
      ARRANGED.map(([name, A], k) => [
        `${name} ${show(A)}`,
        tallies[k] as string,
        show(answers[k] as number[]),
      ]),
      "ll",
    ),
    "세 입력은 값마다의 개수가 같고, 정렬 결과도 같습니다.",
  );
}

/* ───────── deep.origin ④ — 같은 입력에서 두 방식 ───────── */

function naiveVsCount(): string {
  const counts = ARRANGED.map(([, A]) => total(split(A)));
  if (!counts.every((c) => c === counts[0])) {
    throw new Error("개수를 세는 방식의 접근이 입력 순서에 따라 달라졌다");
  }
  return withNote(
    md(
      [
        "일곱 칸 입력",
        "모든 쌍 비교",
        "모든 쌍 배열 접근",
        "개수를 세는 방식의 배열 접근",
      ],
      ARRANGED.map(([name, A], k) => {
        const r = naive(A);
        return [
          `${name} ${show(A)}`,
          num(r.compares),
          num(r.access),
          num(counts[k] as number),
        ];
      }),
    ),
    `개수를 세는 방식은 세 입력 모두 ${num(counts[0] as number)} 번이고 비교는 0 번입니다.`,
  );
}

function accessSplit(): string {
  const s = split(WALK);
  const n = WALK.length;
  return withNote(
    md(
      ["하는 일", "배열 접근"],
      [
        [`count 칸 ${num(K)} 개를 0 으로 채운다`, num(s.init)],
        [`입력 ${han(n)} 칸을 읽고 개수를 고친다`, num(s.tally)],
        [`count 칸 ${num(K)} 개를 모두 읽는다`, num(s.scan)],
        [`결과 ${han(n)} 칸을 쓴다`, num(s.write)],
      ],
    ),
    `합은 ${num(total(s))} 번이고, 그중 입력과 상관없이 드는 첫째 · 셋째 줄이 ${num(s.init + s.scan)} 번입니다.`,
  );
}

/* ───────── deep.origin ⑤ — 개수를 어떻게 세는가 ───────── */

const SCAN_CASES: [string, number[]][] = [
  ["전개 입력 일곱 칸", WALK],
  ["생성식 100 칸", spread(100)],
  ["생성식 1,000 칸", spread(1_000)],
  [`생성식 ${num(BIG)} 칸`, spread(BIG)],
];

function rescanVsDirect(): string {
  // 두 방식이 같은 count 배열을 만드는지 칸마다 대조한다. 열등한 상대를 세우지 않기 위한 자리다.
  let checked = 0;
  let mismatched = 0;
  for (const [, A] of SCAN_CASES.slice(0, 3)) {
    const byRescan = new Array<number>(K).fill(0);
    for (let v = 0; v < K; v++) byRescan[v] = A.filter((x) => x === v).length;
    const byDirect = new Array<number>(K).fill(0);
    for (const v of A) byDirect[v] = (byDirect[v] as number) + 1;
    for (let v = 0; v < K; v++) {
      checked++;
      if (byRescan[v] !== byDirect[v]) mismatched++;
    }
  }
  return withNote(
    md(
      ["입력", "값마다 입력을 다시 읽기", "값을 칸 번호로 써서 세기"],
      SCAN_CASES.map(([name, A]) => [
        name,
        num(rescanAccess(A)),
        num(K + 3 * A.length),
      ]),
    ),
    `두 열 모두 count 를 채우기까지의 배열 접근입니다. 앞의 세 입력에서 두 방식이 만든 count 를 ${num(checked)} 칸 대조했고, 어긋난 칸은 ${mismatched} 개입니다.`,
  );
}

/* ───────── deep.build 1단계 — 값의 범위와 칸 수 ───────── */

/** 값의 범위 `[lo, hi]` 를 받는 일반형. 칸 번호는 `v − lo` 다. */
function countingSortRange(A: readonly number[], lo: number, hi: number) {
  const k = hi - lo + 1;
  const count = new Array<number>(k).fill(0);
  for (const v of A) count[v - lo] = (count[v - lo] as number) + 1;
  const out: number[] = [];
  for (let c = 0; c < k; c++) {
    for (let t = count[c] as number; t > 0; t--) out.push(c + lo);
  }
  return { k, out };
}

function buildSize(): string {
  const ranges: [number, number][] = [
    [0, 1000],
    [1, 1000],
    [-500, 500],
  ];
  const rows = ranges.map(([lo, hi]) => {
    const A = [hi, lo, hi, Math.trunc((lo + hi) / 2), lo];
    const { k, out } = countingSortRange(A, lo, hi);
    const want = [...A].sort((x, y) => x - y);
    if (!same(out, want)) {
      throw new Error(`범위 [${lo}, ${hi}] 에서 답이 틀렸다`);
    }
    if (lo === 0 && (k !== K || !same(out, countingSort([...A])))) {
      throw new Error("범위 [0, 1000] 의 일반형이 정본과 다르다");
    }
    const place = lo === 0 ? "v" : lo > 0 ? `v − ${lo}` : `v + ${-lo}`;
    return [`${lo} 이상 ${num(hi)} 이하`, num(k), place];
  });
  return withNote(
    md(["값의 범위", "값의 종류 K", "값 v 가 가는 칸"], rows, "rl"),
    "세 범위 모두 양 끝 값이 든 입력을 칸 수 최댓값 − 최솟값 + 1 로 정렬해 보았고, 답이 모두 맞았습니다.",
  );
}

/* ───────── deep.build 2단계 — 한 번 읽으며 세기 ───────── */

function buildFill(): string {
  const t = trace(WALK);
  const rows = t.counts.map((s) => [
    `i = ${s.i}`,
    `A[${s.i}] = ${s.v}`,
    `칸 ${s.v}`,
    `${s.before} → ${s.after}`,
    s.snapshot.join(" "),
    String(s.i + 1),
  ]);
  const sum = sumOf(t.counts.at(-1)?.snapshot ?? []);
  return withNote(
    md(
      ["걸음", "읽은 값", "고친 칸", "그 칸의 값", "count[0..5]", "합"],
      rows,
      "llllr",
    ),
    `합이 걸음마다 1 씩 늘어 ${sum}${이가(sum)} 됐고, 칸 ${t.shown} … ${K - 1} 의 ${num(K - t.shown)} 칸은 0 그대로입니다.`,
  );
}

function buildRepeat(): string {
  const t = trace(WALK);
  const hits = t.counts.filter((s) => s.v === 3);
  const lastValue = hits.at(-1)?.after ?? 0;
  const threes = WALK.filter((x) => x === 3).length;
  return withNote(
    md(
      ["걸음", "칸 3 의 값", "앞에 센 개수"],
      hits.map((s) => [
        `i = ${s.i}`,
        `${s.before} → ${s.after}`,
        String(s.before),
      ]),
      "lr",
    ),
    `칸 3 은 ${hits.length} 번 고쳐졌고, 마지막 값 ${lastValue}${이가(lastValue)} 입력에 나온 3 의 개수 ${threes}${과와(threes)} 같습니다.`,
  );
}

/* ───────── deep.build 3단계 — 칸 번호 순서로 읽기 ───────── */

function buildRead(): string {
  const t = trace(WALK);
  const rows = t.reads.map((r) => [
    String(r.v),
    String(r.c),
    String(r.c),
    show(r.out),
  ]);
  rows.push([`${t.shown} … ${K - 1}`, "0", String(t.restWrites), show(t.out)]);
  const sum = sumOf(t.reads.map((r) => r.c)) + t.restWrites;
  return withNote(
    md(["칸 v", "count[v]", "이어 쓴 횟수", "실행 뒤 out"], rows, "rrl"),
    `이어 쓴 횟수를 모두 더하면 ${sum}${으로(sum)} 입력 칸 수 ${WALK.length}${과와(WALK.length)} 같습니다.`,
  );
}

/* ───────── 전제 — 값의 종류 수를 바꿔 가며 ───────── */

const SWEEP: [number, number][] = [
  [7, 8],
  [7, 64],
  [7, K],
  [7, 1_000_000],
  [BIG, K],
  [BIG, 1_000_000],
];

function kSweep(): string {
  let ok = 0;
  const rows = SWEEP.map(([n, k]) => {
    const A = n === 7 ? WALK : spread(n);
    const a = total(split(A, k));
    if (a === 2 * k + 4 * n) ok++;
    return [num(n), num(k), num(a), num1(a / n)];
  });
  return withNote(
    md(["칸 수 N", "값의 종류 K", "배열 접근", "원소 하나당 접근"], rows),
    `배열 접근은 ${han(ok)} 줄 모두 2K + 4N 과 같습니다.`,
  );
}

/* ───────── deep.walk ───────── */

function walkInput(): string {
  return [
    `const A = [${WALK.join(", ")}];`,
    `// 이 절이 끝나면 [${countingSort([...WALK]).join(", ")}] 가 나와야 한다`,
  ].join("\n");
}

function walkInit(): string {
  const s = walkSteps()[0];
  const zeros = s?.stage.map?.entries.every(([, c]) => c === 0) === true;
  if (!zeros) throw new Error("T1 의 count 가 0 으로 시작하지 않는다");
  return [`count = [0 0 0 0 0 0 … 0]   칸 ${num(K)} 개, 합 0`].join("\n");
}

/* ───────── 짚고 가기 — 칸을 1000 개만 잡으면 ───────── */

/** 입력 여덟 벌 — 값 0 · 1000 · 중복 · 칸 하나가 섞여 있다. */
const EIGHT: number[][] = [
  [4, 2, 2, 8, 3, 3, 1],
  [0, 1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1, 0],
  [3, 3, 3, 1, 1, 2],
  [7, 7, 7],
  [0, 0, 1, 0],
  [5],
  [1000, 0, 500, 1000, 0],
];

const sizeRows = EIGHT.map((A) => ({
  A,
  correct: countingSort([...A]),
  broken: size1000.countingSort([...A]),
}));

if (!neutral1000 && sizeRows.every((r) => same(r.correct, r.broken))) {
  throw new Error(
    "칸을 1000 개만 잡은 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「값 1000 이 사라진다」가 거짓이다",
  );
}

function size1000Table(): string {
  const wrong = sizeRows.filter((r) => !same(r.correct, r.broken)).length;
  return withNote(
    md(
      ["입력", "K = 1001", "K = 1000 으로 적은 코드"],
      [0, 3, 6, 7].map((k) => {
        const r = sizeRows[k] as (typeof sizeRows)[number];
        return [show(r.A), show(r.correct), show(r.broken)];
      }),
      "ll",
    ),
    `입력 ${han(EIGHT.length)} 벌 중 ${wrong} 벌에서만 답이 어긋나고, 그 벌에는 값 1000 이 들어 있습니다.`,
  );
}

/** 칸 1000 개짜리 배열에 값 1000 을 세면 무슨 일이 생기는지 — 자바스크립트 배열로 실행한다. */
function size1000Why(): string {
  const count = new Array<number>(1000).fill(0);
  const before = count[1000];
  count[1000] = (count[1000] as number) + 1;
  const after = count[1000];
  const readTo = 1000 - 1;
  return [
    ...columns(
      [
        ["count 칸 수 1000", `칸 번호 0 … ${readTo}`],
        ["count[1000] 을 읽는다", String(before)],
        ["count[1000] = count[1000] + 1", String(after)],
        [`③ 이 읽는 칸 v = 0 … ${readTo}`, "칸 1000 은 읽지 않는다"],
      ],
      "   →   ",
    ),
  ].join("\n");
}

/* ───────── 걸음 2 · 3 의 결과 ───────── */

function walkCount(): string {
  const t = trace(WALK);
  const last = t.counts.at(-1)?.snapshot ?? [];
  return [
    `count[0..${t.shown - 1}]    = ${last.join(" ")}      합 ${sumOf(last)}`,
    `count[${t.shown}..${K - 1}] = 모두 0`,
  ].join("\n");
}

function walkRead(): string {
  const s = split(WALK);
  return [
    `out = ${show(s.out)}`,
    `③ 이 count 를 읽은 횟수 ${num(s.scan)} · ④ 가 실행된 횟수 ${s.write}`,
  ].join("\n");
}

/* ───────── 짚고 가기 — 이중 반복의 총 실행 횟수 ───────── */

const LOOP_CASES: [string, number[]][] = [
  ["전개 입력 일곱 칸", WALK],
  ["값이 전부 같은 일곱 칸", [7, 7, 7, 7, 7, 7, 7]],
  ["생성식 1,000 칸", spread(1_000)],
  [`생성식 ${num(BIG)} 칸`, spread(BIG)],
];

function loopTable(): string {
  let equal = 0;
  const rows = LOOP_CASES.map(([name, A]) => {
    const s = split(A);
    if (s.write === A.length) equal++;
    return [name, num(s.scan), num(s.write), num(A.length * K)];
  });
  return withNote(
    md(["입력", "바깥 반복", "안쪽 반복 총 실행", "N × K"], rows),
    `${han(equal)} 줄 모두 안쪽 반복의 총 실행이 입력 칸 수 N 과 같습니다.`,
  );
}

/* ───────── 걸음 4 — 끝까지 실행한 자취 ───────── */

function walkTrace(): string {
  const t = trace(WALK);
  const steps = walkSteps();
  const rows: string[][] = [];
  let k = 0;
  const id = () => (steps[k++] as { id: string }).id;
  rows.push([
    id(),
    "①",
    `count ${num(K)} 칸을 0 으로 채운다`,
    "—",
    "count 의 합 0",
  ]);
  for (const s of t.counts) {
    rows.push([
      id(),
      "②",
      `A[${s.i}] = ${s.v}${을를(s.v)} 센다`,
      "—",
      `count[${s.v}] ${s.before} → ${s.after} · 합 ${s.i + 1}`,
    ]);
  }
  for (const r of t.reads) {
    rows.push([
      id(),
      r.c === 0 ? "③" : "③ ④",
      `칸 ${r.v}${을를(r.v)} 읽는다`,
      r.c === 0
        ? `\`${r.v} < ${K}\` **참** · \`t > 0\` 이 처음부터 **거짓**`
        : `\`${r.v} < ${K}\` **참** · \`t > 0\` 이 ${r.c} 번 **참** 뒤 **거짓**`,
      `out ${r.out.length} 칸`,
    ]);
  }
  rows.push([
    id(),
    "③",
    `칸 ${t.shown} … ${K - 1}${을를(K - 1)} 읽는다`,
    `\`t > 0\` 이 ${num(K - t.shown)} 칸 모두 처음부터 **거짓** · v = ${num(K)} 에서 \`v < K\` **거짓**`,
    `out ${t.out.length} 칸`,
  ]);
  rows.push([id(), "—", "out 을 돌려준다", "—", show(t.out)]);
  if (k !== steps.length) {
    throw new Error(`표의 걸음 ${k} 과 그림의 걸음 ${steps.length} 이 다르다`);
  }
  return md(["단계", "갈래", "하는 일", "조건 판정", "바뀐 것"], rows, "llll");
}

function finalCalls(): string {
  const cases = [
    WALK,
    [4, 2, 2, 8, 3, 3, 1],
    [1000, 0, 500, 1000, 0],
    [7, 7, 7],
    [5],
    [],
  ];
  const heads = cases.map((A) => `countingSort([${A.join(", ")}])`);
  const w = Math.max(...heads.map((h) => h.length));
  return [
    ...cases.map(
      (A, k) =>
        `${(heads[k] as string).padEnd(w)}   →   [${countingSort([...A]).join(", ")}]`,
    ),
  ].join("\n");
}

/* ───────── purpose.alt — 우열이 뒤집히는 자리 ───────── */

/**
 * 병합 정렬의 계수는 `countingSort-guide.alt.ts` 에서 가져온다 — `purpose.alt` 의 표와 같은
 * 코드라야 두 자리의 값이 어긋나지 않는다. 칸 수를 하나씩 늘려 가며 계수 정렬의 접근이 병합 정렬
 * 이하가 되는 첫 `N` 을 찾는다.
 */
function crossoverN(): number {
  for (let n = 2; n <= 400; n++) {
    const A = spread(n);
    if (total(split(A)) <= mergeCounts(A).access) return n;
  }
  throw new Error("400 칸까지 뒤집히는 자리를 못 찾았다");
}

function crossoverTable(): string {
  const at = crossoverN();
  const rows = [20, at - 1, at, 200].map((n) => {
    const A = spread(n);
    const c = total(split(A));
    const m = mergeCounts(A).access;
    return [`${num(n)} 칸`, num(c), num(m), c <= m ? "계수 정렬" : "병합 정렬"];
  });
  return withNote(
    md(
      [
        "생성식으로 만든 입력",
        "계수 정렬 접근",
        "병합 정렬 접근",
        "접근이 적은 쪽",
      ],
      rows,
      "rrl",
    ),
    `${num(at)} 칸에서 처음으로 순서가 뒤집힙니다.`,
  );
}

/* ───────── deep.math ───────── */

function mathCheck(): string {
  const t = trace(WALK);
  const last = t.counts.at(-1)?.snapshot ?? [];
  const rows = last.map((c, v) => {
    const at = WALK.flatMap((x, i) => (x === v ? [String(i)] : []));
    return [String(v), at.length === 0 ? "없음" : at.join(" · "), String(c)];
  });
  const sum = sumOf(last);
  return withNote(
    md(["v", "A[i] = v 인 인덱스 i", "C[v]"], rows, "lr"),
    `C[0] 부터 C[${t.shown - 1}] 까지 더하면 ${sum}${josa(sum, "이고", "고")} N = ${WALK.length}${과와(WALK.length)} 같습니다. 나머지 ${num(K - t.shown)} 개는 모두 0 입니다.`,
  );
}

function mathCode(): string {
  const f = (n: number, k: number): number => 2 * k + 4 * n;
  const a = total(split(WALK));
  const b = total(split(spread(BIG)));
  if (f(WALK.length, K) !== a || f(BIG, K) !== b) {
    throw new Error("2K + 4N 이 실측과 다르다");
  }
  return [
    "const total = (N: number, K: number): number => 2 * K + 4 * N;",
    "",
    ...columns(
      [
        [
          `total(${WALK.length}, ${K}); // → ${f(WALK.length, K)}`,
          "전개 입력에서 실제로 센 값과 같다",
        ],
        [
          `total(100_000, ${K}); // → ${f(BIG, K)}`,
          `생성식 ${num(BIG)} 칸에서 실제로 센 값과 같다`,
        ],
      ],
      "   ",
    ),
  ].join("\n");
}

/** $\log_2 N!$ 을 정의대로 더해서 낸다 — 근사가 아래쪽으로 어긋나면 「하한」이 거짓이 된다. */
function log2Factorial(n: number): number {
  let sum = 0;
  for (let t = 2; t <= n; t++) sum += Math.log2(t);
  return sum;
}

function mathCrossover(): number {
  let sum = 0;
  for (let n = 2; n <= 5_000; n++) {
    sum += Math.log2(n);
    if (2 * K + 4 * n <= sum) return n;
  }
  throw new Error("5,000 칸까지 뒤집히는 자리를 못 찾았다");
}

function mathScale(): string {
  const t = 2 * K + 4 * BIG;
  if (t !== total(split(spread(BIG)))) {
    throw new Error("2K + 4N 이 실측과 다르다");
  }
  const bound = Math.floor(log2Factorial(BIG));
  const at = mathCrossover();
  return withNote(
    md(
      ["N", "K", "T(N, K) = 2K + 4N", "log₂(N!) 의 내림값", "두 값의 비"],
      [[num(BIG), num(K), num(t), num(bound), `${num1(bound / t)} 배`]],
    ),
    `K = ${num(K)} 에서 T(N, K) ≤ log₂(N!) 이 되는 첫 N 은 ${num(at)} 입니다.`,
  );
}

/* ───────── 불변식 ───────── */

function invariantSum(): string {
  const t = trace(WALK);
  const sums = [0, ...t.counts.map((s) => sumOf(s.snapshot))];
  if (!sums.every((s, k) => s === k)) {
    throw new Error("count 의 합이 읽은 칸 수와 다르다");
  }
  const s = split(WALK);
  return withNote(
    md(
      ["읽은 칸 수", ...sums.map((_, k) => String(k))],
      [["count 의 합", ...sums.map(String)]],
    ),
    `그다음 이어 쓰기가 ${s.write} 번 실행되어 out 이 ${s.out.length} 칸이 됐습니다.`,
  );
}

function invariantEdges(): string {
  const rows: [string, number[], string][] = [
    ["빈 배열", [], "세는 반복이 한 번도 실행되지 않아 합이 0 이다"],
    ["칸 하나", [5], "칸 5 만 1 이 되고 나머지 칸은 0 이다"],
    ["칸 둘", [1, 0], "칸 0 과 1 이 1 씩 되고, 출력이 칸 번호 순서를 따른다"],
    [
      "값이 전부 같음",
      [7, 7, 7],
      "칸 7 하나가 3 이 되고 그 칸에서 세 번 이어 쓴다",
    ],
    [
      "값의 최솟값",
      [0, 0, 1, 0],
      "칸 0 이 3 이 된다. 값 0 도 자기 칸을 갖는다",
    ],
    ["값의 최댓값", [1000, 0, 500], "칸 1000 이 있어야 값이 사라지지 않는다"],
  ];
  return md(
    ["입력", "처리되는 자리", "결과"],
    rows.map(([name, A, where]) => {
      const out = countingSort(A);
      if (out === A) throw new Error("정본이 입력 배열을 그대로 돌려줬다");
      return [`${name} ${show(A)}`, where, show(out)];
    }),
    "ll",
  );
}

const FLAG_INPUTS = [
  WALK,
  SEVEN_SORTED,
  [7, 7, 7],
  [0, 1, 2, 3, 4, 5],
  [0, 0, 1, 0],
];
const flagRows = FLAG_INPUTS.map((A) => ({
  A,
  correct: countingSort([...A]),
  broken: flagOnly.countingSort([...A]),
}));

if (!neutralFlag && flagRows.every((r) => same(r.correct, r.broken))) {
  throw new Error(
    "개수 대신 1 을 적은 변이가 어느 입력에서도 답을 바꾸지 못했다",
  );
}

function mutantFlag(): string {
  const wrong = flagRows.filter((r) => !same(r.correct, r.broken)).length;
  return withNote(
    md(
      ["입력", "바른 코드", "count[v] = 1 로 적은 코드"],
      flagRows.map((r) => [show(r.A), show(r.correct), show(r.broken)]),
      "ll",
    ),
    `${han(flagRows.length)} 벌 중 ${wrong} 벌에서 답이 어긋납니다.`,
  );
}

/** 바꾼 코드의 count 는 그 답에서 거꾸로 읽는다 — out 에는 칸 v 의 개수만큼 v 가 적힌다. */
function mutantSum(): string {
  const shown = Math.max(...WALK) + 1;
  const tallyOf = (out: readonly number[]) =>
    Array.from({ length: shown }, (_, v) => out.filter((x) => x === v).length);
  const row = (name: string, out: readonly number[]) => {
    const c = tallyOf(out);
    return [name, c.join(" "), String(sumOf(c)), String(out.length)];
  };
  return md(
    ["코드", `count[0..${shown - 1}]`, "합", "out 칸 수"],
    [
      row("바른 코드", countingSort([...WALK])),
      row("count[v] = 1 로 적은 코드", flagOnly.countingSort([...WALK])),
    ],
    "lrr",
  );
}

/* ───────── 비용 계산 ───────── */

function perfDerive(): string {
  const s = split(WALK);
  const steps = walkSteps();
  const n = WALK.length;
  const first = steps[0]?.id as string;
  const tallyIds = `${steps[1]?.id}~${steps[n]?.id}`;
  const readIds = `${steps[n + 1]?.id}~${steps.at(-2)?.id}`;
  const last = steps.at(-1)?.id as string;
  return withNote(
    md(
      ["단계", "갈래", "하는 일", "배열 접근"],
      [
        [first, "①", `count 칸 ${num(K)} 개를 0 으로 채운다`, num(s.init)],
        [tallyIds, "②", `원소 ${han(n)} 개마다 읽기 2 · 쓰기 1`, num(s.tally)],
        [readIds, "③", `count 칸 ${num(K)} 개를 읽는다`, num(s.scan)],
        [readIds, "④", `결과 ${han(n)} 칸을 쓴다`, num(s.write)],
        [last, "—", "반환", "0"],
      ],
      "llr",
    ),
    `합은 ${num(total(s))} 번이고 2 × ${num(K)} + 4 × ${n}${과와(n)} 같습니다. 비교는 0 번입니다.`,
  );
}

/** 같은 다중집합의 서로 다른 배치 전부. */
function arrangements(multiset: readonly number[]): number[][] {
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

function worstInput(): string {
  const all = arrangements(WALK);
  const accesses = all.map((A) => total(split(A)));
  if (Math.min(...accesses) !== Math.max(...accesses)) {
    throw new Error("같은 다중집합의 배치가 접근 횟수를 바꿨다");
  }
  for (const A of all) {
    if (!same(countingSort([...A]), SEVEN_SORTED)) {
      throw new Error(`배치 하나가 다른 답을 냈다 — ${show(A)}`);
    }
  }
  const rows = [1, 7, 1_000, BIG].map((n) => {
    const A = n === 7 ? WALK : spread(n);
    const a = total(split(A));
    return [`${num(n)} 칸`, num(a), num1(a / n)];
  });
  return withNote(
    md(["K = 1001 에서의 입력", "배열 접근", "원소 하나당 접근"], rows),
    `일곱 칸 ${show(SEVEN_SORTED)} 의 서로 다른 배치 ${num(all.length)} 가지는 접근이 모두 ${num(accesses[0] as number)} 번으로 같습니다.`,
  );
}

function worstMake(): string {
  const A = [5];
  const rows = [K, 1_000_000].map((k) => {
    const a = total(split(A, k));
    return [show(A), num(k), num(a), num1(a / A.length)];
  });
  return md(["입력", "값의 종류 K", "배열 접근", "원소 하나당 접근"], rows);
}

/* ───────── 스스로 점검하기 ───────── */

function mapOf(A: readonly number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const v of A) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

function selfcheckMap(): string {
  const keys = [...mapOf(WALK).keys()];
  const lastKey = keys.at(-1) as number;
  return [
    `A = ${show(WALK)} 을 Map 에 넣으면 키 순서가 ${keys.join(" → ")}${josa(lastKey, "이다", "다")}`,
  ].join("\n");
}

function selfcheckMapAnswer(): string {
  const out: number[] = [];
  for (const [v, c] of mapOf(WALK)) for (let t = c; t > 0; t--) out.push(v);
  return [
    `Map 의 키 순서로 이어 쓰면   ${show(out)}`,
    `배열 count 로 이어 쓰면      ${show(countingSort([...WALK]))}`,
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 두 입력의 비교 · 배열 접근. */
  "concept-cost": conceptCost,
  /** `deep.origin` ② — 모든 쌍 비교를 과제 규모까지. */
  "origin-naive": originNaive,
  /** `deep.origin` ③ — 일곱 칸에서 모든 쌍 비교가 하는 일. */
  "origin-pairs": originPairs,
  /** `deep.origin` ③ — 답을 정하는 것은 값마다의 개수다. */
  "origin-multiset": originMultiset,
  /** `deep.origin` ④ — 같은 일곱 칸에서 두 방식. */
  "naive-vs-count": naiveVsCount,
  /** `deep.origin` ④ — 배열 접근이 어디서 오는가. */
  "access-split": accessSplit,
  /** `deep.origin` ⑤ — 개수를 세는 두 후보. */
  "rescan-vs-direct": rescanVsDirect,
  /** `deep.build` 1단계 — 값의 범위와 칸 수. */
  "build-size": buildSize,
  /** `deep.build` 2단계 — 한 번 읽으며 세기. */
  "build-fill": buildFill,
  /** `deep.build` 2단계 — 같은 값이 거듭 나오는 칸. */
  "build-repeat": buildRepeat,
  /** `deep.build` 3단계 — 칸 번호 순서로 읽기. */
  "build-read": buildRead,
  /** `deep.build` 전제 — 값의 종류 수를 바꿔 가며. */
  "k-sweep": kSweep,
  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — count 를 만든 직후. */
  "walk-init": walkInit,
  /** `deep.walk.pause` — 칸을 1000 개만 잡으면 값 1000 이 사라진다. */
  "size-1000": size1000Table,
  /** `deep.walk.pause` — 칸 1000 개짜리 배열에서 값 1000 을 셀 때. */
  "size-1000-why": size1000Why,
  /** `deep.walk` 2 — 세기만 실행한 결과. */
  "walk-count": walkCount,
  /** `deep.walk` 3 — 읽어 이어 쓰기까지 실행한 결과. */
  "walk-read": walkRead,
  /** `deep.walk.pause` — 이중 반복이지만 안쪽 반복의 총 실행은 N 이다. */
  "loop-total": loopTable,
  /** `deep.walk` 4 — T1~T16 의 조건 판정. */
  "walk-trace": walkTrace,
  /** `deep.walk.final` — 전체 코드를 여러 입력에 부른 결과. */
  "final-calls": finalCalls,
  /** `purpose.alt` — 칸 수를 늘려 가며 두 설계의 순서가 뒤집히는 자리. */
  "alt-crossover": crossoverTable,
  /** `deep.math` ② — 정의를 전개 입력에 넣은 검산. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드와 실측의 대조. */
  "math-code": mathCode,
  /** `deep.math` ④ — 과제 규모에서 닫힌 형태와 비교 정렬의 하한. */
  "math-scale": mathScale,
  /** `invariant` ② — count 의 합이 읽은 칸 수를 따라간다. */
  "invariant-sum": invariantSum,
  /** `invariant` ② — 경계 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 개수를 세던 그 줄을 바꿨을 때 나오는 **실제 값**. */
  "mutant-flag-only": mutantFlag,
  /** `invariant` ③ — 바꾼 코드의 count 합. */
  "mutant-sum": mutantSum,
  /** `perf.derive` — 전개의 걸음을 갈래별로 센다. */
  "perf-derive": perfDerive,
  /** `perf.worst` — 배치는 비용을 못 바꾸고, 최악은 원소 하나당 비용에서 나온다. */
  "worst-input": worstInput,
  /** `perf.worst` — 칸 하나짜리 입력에 값의 종류 수만 바꿔 본다. */
  "worst-make": worstMake,
  /** `selfcheck` — Map 에 넣은 키의 순서. */
  "selfcheck-map": selfcheckMap,
  /** `selfcheck` 답 — Map 순서로 이어 쓴 결과. */
  "selfcheck-map-answer": selfcheckMapAnswer,
};
