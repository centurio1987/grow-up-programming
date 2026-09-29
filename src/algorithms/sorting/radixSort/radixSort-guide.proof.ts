/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바퀴 안의 걸음 하나하나는 그림 사이드카의 `run`(정본 소스에서 기계로 만든 계측 사본과 놓기마다
 * 대조한 기록)에서 받는다 — 그림과 표가 같은 기록을 쓴다. 배열 접근 수는 `.alt.ts` 의 계측 사본
 * `radixCounts` 에서 받고, 그 사본의 답과 닫힌 형태를 여기서 정본 실행과 대조한다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/radixSort/radixSort-guide.md
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와 } from "../../../../tools/josa.ts";
import { mergeCounts, radixCounts } from "./radixSort-guide.alt.ts";
import {
  accessOf,
  arrangements,
  BASE,
  BIG,
  digitOf,
  MAX_VALUE,
  MSD_CASES,
  msdRepeat,
  num,
  PLACE_LINE,
  pairs,
  passCount,
  REPO_CASES,
  type Round,
  run,
  type Sorter,
  same,
  show,
  spread,
  type Trace,
  trace,
  WALK,
  walkSteps,
} from "./radixSort-guide.fig.tsx";
import { radixSort } from "./radixSort-guide.ref.ts";

const REF = new URL("./radixSort-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 변이 ───────────────────────── */

/** 배치를 앞에서 뒤로 바꾼 사본. 같은 자리 값끼리의 순서가 뒤집힌다 — 불변식을 지키던 줄이다. */
const forward = await loadMutant<Sorter>(REF, {
  swap: [PLACE_LINE, "$1for (let i = 0; i < src.length; i++) {"],
});

/**
 * 변이가 중화됐는가 — `check-proof` 가 변이를 끄고 사이드카를 한 번 더 부를 때, 변이 모듈은 정본
 * 모듈 그 자체다. 그때는 「변이가 답을 바꿨다」는 자기검사를 건너뛴다(SPEC §0 증명 블록 규격).
 */
const neutral = (m: Sorter): boolean => m.radixSort === radixSort;

/* ───────────────────────── 표 그리기 ───────────────────────── */

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

/** 증명 표 — 표 아래 문장까지 사이드카가 낸다. 원고는 그 뒤를 `<!--/proof-->` 로 닫는다(SPEC §12). */
const proofTable = (table: string, sentence?: string): string =>
  [table, ...(sentence === undefined ? [] : ["", sentence])].join("\n");

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 글자 폭으로 칸을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 칸을 맞춘 줄들(펜스 속). 열 사이는 세 칸이다. 칸이 하나뿐인 줄은 폭 계산에서 뺀다. */
function columns(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(
        0,
        ...rows.map((r) =>
          r.length > 1 && c < r.length - 1 ? width(r[c] ?? "") : 0,
        ),
      ),
    );
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) => (c === r.length - 1 ? cell : pad(cell, w[c] ?? 0)))
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

const list = (xs: readonly number[]): string => xs.join(" ");
const ratio = (a: number, b: number, digits = 2): string =>
  (a / b).toFixed(digits);

/* ───────── 실행이 판정하는 사실들 — 어긋나면 그 자리에서 던진다 ───────── */

const sortedCopy = (A: readonly number[]): number[] =>
  [...A].sort((a, b) => a - b);

// ① 계측 사본(`.alt.ts`)이 `B = 256` 에서 정본과 같은 답을 내는가.
for (const A of [WALK, ...REPO_CASES, spread(500)]) {
  if (!same(radixCounts([...A]).out, radixSort([...A]))) {
    throw new Error(`계측 사본이 정본과 다른 답을 냈다 — ${show(A)}`);
  }
}

// ② 배열 접근의 닫힌 형태 `4N + d(7N + 4B − 3)` 이 계측과 같은가. 본문이 이 식으로 값을 낸다.
const wide = (n: number): number[] => {
  const A = spread(n);
  if (n > 0) A[0] = MAX_VALUE;
  return A;
};
const maxOf = (A: readonly number[]): number =>
  A.reduce((m, x) => (x > m ? x : m), 0);
for (const [A, base] of [
  [WALK, 8],
  [WALK, BASE],
  [WALK, 514],
  [wide(1), BASE],
  [wide(1_000), 1_024],
  [wide(BIG), BASE],
  [spread(BIG), BASE],
] as [number[], number][]) {
  const want = accessOf(A.length, base, passCount(maxOf(A), base));
  if (radixCounts(A, base).access !== want) {
    throw new Error(
      `접근 수가 4N + d(7N + 4B − 3) 과 다르다 — N=${A.length}, B=${base}`,
    );
  }
}

// ③ 모든 쌍 비교의 횟수가 `N(N−1)/2` 인가. 큰 `N` 은 이 식으로 값을 낸다.
function naiveCompares(A: readonly number[]): {
  compares: number;
  out: number[];
} {
  const copy = Array.from(A);
  let compares = 0;
  for (let j = 0; j < copy.length; j++) {
    for (let t = j + 1; t < copy.length; t++) {
      compares++;
      if ((copy[j] as number) > (copy[t] as number)) {
        const tmp = copy[j] as number;
        copy[j] = copy[t] as number;
        copy[t] = tmp;
      }
    }
  }
  return { compares, out: copy };
}
const NAIVE_CHECKED = [...Array(201).keys()];
for (const n of NAIVE_CHECKED) {
  for (const A of [spread(n), wide(n), sortedCopy(spread(n))]) {
    const r = naiveCompares(A);
    if (r.compares !== pairs(n) || !same(r.out, radixSort([...A]))) {
      throw new Error(
        `모든 쌍 비교가 N(N−1)/2 가 아니거나 답이 다르다 — N=${n}`,
      );
    }
  }
}

// ④ 전개 입력이 실제로 두 바퀴인가. 본문 전체가 그 수 위에 선다.
const WALK_T: Trace = run(WALK);
if (WALK_T.rounds.length !== 2)
  throw new Error("전개 입력의 바퀴가 둘이 아니다");

/* ───────── 전체 컨셉 ───────── */

function conceptCost(): string {
  const rows: [string, number[]][] = [
    ["전개 입력 일곱 칸", WALK],
    [`생성식 ${num(BIG)} 칸`, spread(BIG)],
  ];
  return md(
    ["입력", "최댓값", "바퀴", "비교", "배열 접근"],
    rows.map(([name, A]) => {
      const c = radixCounts(A);
      return [
        name,
        num(maxOf(A)),
        num(c.passes),
        num(c.compares),
        num(c.access),
      ];
    }),
    [1, 2, 3, 4],
  );
}

/* ───────── deep.origin ───────── */

function originNaive(): string {
  const sizes = [WALK.length, 1_000, BIG];
  const table = md(
    ["칸 수", "모든 쌍 비교", "시간(초당 1 억 번)"],
    sizes.map((n) => [
      num(n),
      num(pairs(n)),
      `${(pairs(n) / 1e8).toFixed(2)} 초`,
    ]),
    [0, 1, 2],
  );
  return proofTable(
    table,
    `칸 ${num(NAIVE_CHECKED[0] as number)} 개부터 ${num(NAIVE_CHECKED.at(-1) as number)} 개까지 입력 세 모양에서 실제로 세어 모든 쌍 비교가 N(N−1)/2 번인 것을 확인했고, 큰 칸 수는 이 식으로 냈습니다.`,
  );
}

const SPLIT: [string, number[]][] = [
  ["전개 입력 일곱 칸", WALK],
  ["생성식 1,000 칸", spread(1_000)],
  [`생성식 ${num(BIG)} 칸`, spread(BIG)],
];

function originWide(): string {
  const table = md(
    [
      "입력",
      "최댓값",
      "count 칸 수",
      "배열 접근",
      "count 의 메모리(8 바이트씩)",
    ],
    SPLIT.map(([name, A]) => {
      const m = maxOf(A);
      const k = m + 1;
      const bytes = k * 8;
      const mem =
        bytes >= 1e9
          ? `${(bytes / 1e9).toFixed(1)} GB`
          : `${num(Math.ceil(bytes / 1e3))} KB`;
      return [name, num(m), num(k), num(accessOf(A.length, k, 1)), mem];
    }),
    [1, 2, 3, 4],
  );
  // 칸을 잡을 수 있는 크기에서는 실제로 실행해 닫힌 형태와 같은지 본다.
  const small = radixCounts(WALK, maxOf(WALK) + 1);
  if (small.passes !== 1 || small.access !== accessOf(WALK.length, 514, 1)) {
    throw new Error("값을 칸 번호로 쓰는 계수 정렬의 접근이 식과 다르다");
  }
  return proofTable(
    table,
    `일곱 칸은 count 를 ${num(maxOf(WALK) + 1)} 칸으로 잡아 실제로 실행해 센 값이고, 큰 두 입력은 같은 식에 칸 수를 넣은 값입니다.`,
  );
}

function originSplit(): string {
  return md(
    [
      "입력",
      "값 그대로 — count 칸 수",
      "값 그대로 — 배열 접근",
      "자리로 쪼갬 — 바퀴",
      "자리로 쪼갬 — 배열 접근",
    ],
    SPLIT.map(([name, A]) => {
      const m = maxOf(A);
      const c = radixCounts(A);
      return [
        name,
        num(m + 1),
        num(accessOf(A.length, m + 1, 1)),
        num(c.passes),
        num(c.access),
      ];
    }),
    [1, 2, 3, 4],
  );
}

function msdTable(): string {
  const wrong = MSD_CASES.filter((A) => !same(msdRepeat(A), radixSort([...A])));
  if (wrong.length === 0) {
    throw new Error(
      "높은 자리부터 되풀이한 후보가 어느 입력에서도 답을 바꾸지 못했다 — 「낮은 자리부터여야 한다」가 거짓이다",
    );
  }
  const right = MSD_CASES.filter((A) =>
    same(radixSort([...A]), sortedCopy(A)),
  ).length;
  return proofTable(
    md(
      ["입력", "낮은 자리부터", "높은 자리부터"],
      MSD_CASES.map((A) => [
        show(A),
        show(radixSort([...A])),
        show(msdRepeat(A)),
      ]),
    ),
    `${MSD_CASES.length} 벌 중 높은 자리부터 한 쪽은 ${wrong.length} 벌이 틀렸고, 낮은 자리부터 한 쪽은 ${right} 벌이 모두 맞았습니다.`,
  );
}

function msdWhy(): string {
  const high = msdRepeat(WALK);
  const low = radixSort([...WALK]);
  return columns([
    ["낮은 자리부터", "자리 0 → 자리 1", show(low)],
    ["높은 자리부터", "자리 1 → 자리 0", show(high)],
    [
      `높은 자리부터 낸 배열의 자리 0 은 ${list(high.map((x) => digitOf(x, 1)))} — 마지막 바퀴의 자리만 오름차순이다`,
    ],
  ]);
}

/* ───────── deep.build — 통 ───────── */

const R1 = WALK_T.rounds[0] as Round;
const R2 = WALK_T.rounds[1] as Round;

/** 바퀴 하나의 통 — 자리 값마다 [첫 칸, 끝 칸] 과 들어간 값. */
function buckets(
  r: Round,
): { d: number; from: number; to: number; xs: number[] }[] {
  return r.prefix.map(([d, end], k) => {
    const from =
      k === 0 ? 0 : (r.prefix[k - 1] as readonly [number, number])[1];
    return { d, from, to: end - 1, xs: r.out.slice(from, end) };
  });
}

function bucketRead(): string {
  const b =
    buckets(R1).find((x) => x.xs.length === 2 && x.d !== 2) ?? buckets(R1)[2];
  if (b === undefined) throw new Error("두 값이 든 통이 없다");
  const k = R1.prefix.findIndex(([d]) => d === b.d);
  const prev = R1.prefix[k - 1] as readonly [number, number];
  const here = R1.prefix[k] as readonly [number, number];
  return columns([
    [`통 ${b.d}`, `자리 0 이 ${b.d} 인 원소가 들어갈 칸`],
    ["끝 칸", `누적 count[${b.d}] = ${here[1]} 에서 1 을 뺀 칸 ${here[1] - 1}`],
    [
      "첫 칸",
      `바로 앞 통의 누적 count[${prev[0]}] = ${prev[1]} 인 칸 ${prev[1]}`,
    ],
    ["칸", `[${b.from},${b.to}] — ${b.to - b.from + 1} 칸`],
    ["들어간 값", `${list(b.xs)} — 자리 0 은 둘 다 ${b.d}`],
  ]);
}

function bucketRounds(): string {
  const rows = [R1, R2].flatMap((r) =>
    buckets(r).map((b) => [
      `바퀴 ${r.n} (자리 ${r.p})`,
      `통 ${b.d}`,
      `[${b.from},${b.to}]`,
      list(b.xs),
    ]),
  );
  // 통이 이어 붙어 dst 를 빈틈없이 덮는가 — 전개 입력의 배치 전부에서.
  let checked = 0;
  for (const A of arrangements(WALK)) {
    for (const r of run(A).rounds) {
      let at = 0;
      for (const b of buckets(r)) {
        if (b.from !== at) throw new Error("통 사이에 빈 칸이 있다");
        at = b.to + 1;
      }
      if (at !== A.length) throw new Error("통이 dst 를 다 덮지 않는다");
      checked++;
    }
  }
  return proofTable(
    md(["바퀴", "통", "칸", "들어간 값"], rows),
    `전개 입력의 배치 ${num(arrangements(WALK).length)} 가지에서 바퀴 ${num(checked)} 개를 모두 보았고, 통은 자리 값이 작은 쪽부터 빈틈없이 이어 붙어 dst 를 덮었습니다.`,
  );
}

function bucketVsCell(): string {
  const m = maxOf(WALK);
  const r1 = buckets(R1);
  const r2 = buckets(R2);
  const mixed = [...r1, ...r2].filter((b) => new Set(b.xs).size > 1);
  return proofTable(
    md(
      [
        "모양",
        "count 칸 수",
        "원소가 든 칸 또는 통",
        "서로 다른 값이 함께 든 통",
      ],
      [
        ["값마다 칸 하나(계수 정렬)", num(m + 1), `${WALK.length} 칸`, "0 개"],
        [
          "자리 값마다 통 하나 — 바퀴 1",
          num(BASE),
          `${r1.length} 통`,
          `${r1.filter((b) => new Set(b.xs).size > 1).length} 개`,
        ],
        [
          "자리 값마다 통 하나 — 바퀴 2",
          num(BASE),
          `${r2.length} 통`,
          `${r2.filter((b) => new Set(b.xs).size > 1).length} 개`,
        ],
      ],
      [1],
    ),
    `서로 다른 값이 함께 든 통은 ${mixed.map((b) => `통 ${b.d}(${list(b.xs)})`).join(" · ")} 입니다.`,
  );
}

/* ───────── deep.build — 1단계 ───────── */

function buildPasses(): string {
  const maxes = [0, 255, 256, 513, 65_535, 65_536, 16_777_216, MAX_VALUE];
  const rows = maxes.map((m) => {
    const d = passCount(m);
    const places = [...Array(d).keys()].map((p) => num(BASE ** p));
    return [num(m), num(d), places.length === 0 ? "없음" : places.join(" · ")];
  });
  // 실제 실행의 바퀴 수와 같은가.
  for (const m of maxes) {
    if (trace([m, 0]).rounds.length !== passCount(m)) {
      throw new Error(`최댓값 ${m} 의 바퀴 수가 실행과 다르다`);
    }
  }
  return md(["최댓값 M", "바퀴 d", "바퀴마다의 place"], rows, [0, 1]);
}

function buildDigits(): string {
  return md(
    ["값", "자리 1 = ⌊x / 256⌋ mod 256", "자리 0 = x mod 256"],
    WALK.map((x) => [
      String(x),
      String(digitOf(x, BASE)),
      String(digitOf(x, 1)),
    ]),
    [0, 1, 2],
  );
}

/* ───────── deep.build — 2단계 ───────── */

function countTable(r: Round): string {
  const bs = buckets(r);
  return md(
    ["자리 값", "개수", "누적 count", "통의 칸"],
    [
      ...r.count.map(([d, c], k) => {
        const b = bs[k] as (typeof bs)[number];
        return [
          String(d),
          String(c),
          String((r.prefix[k] as readonly [number, number])[1]),
          [...Array(b.to - b.from + 1).keys()]
            .map((t) => b.from + t)
            .join(" · "),
        ];
      }),
      [`그 밖 ${BASE - r.count.length} 가지`, "0", "앞 칸과 같음", "없음"],
    ],
    [1, 2],
  );
}

function buildCount(): string {
  return [
    countTable(R1),
    "",
    `바퀴 2 에서 자리 1 로 세면 이렇습니다.`,
    "",
    countTable(R2),
  ].join("\n");
}

/* ───────── deep.build — 3단계 ───────── */

function placeRows(r: Round, ids?: readonly string[]): string[][] {
  return r.puts.map((u, k) => [
    ...(ids ? [ids[k] as string] : []),
    String(u.i),
    String(u.x),
    String(u.dig),
    `${u.before} → ${u.pos}`,
    String(u.pos),
    show(u.dst),
  ]);
}

function buildPlace(): string {
  const table = md(
    ["i", "값", "자리 0", "count 갱신", "놓는 칸", "놓은 뒤 dst"],
    placeRows(R1),
    [0, 1, 2, 4],
  );
  // 바퀴가 끝나면 `count[d]` 가 통의 첫 칸이고, 놓기가 칸마다 정확히 한 번인가 — 배치 전부에서.
  let rounds = 0;
  for (const A of arrangements(WALK)) {
    for (const r of run(A).rounds) {
      const seen = new Set(r.puts.map((u) => u.pos));
      if (seen.size !== A.length) throw new Error("같은 칸에 두 번 놓았다");
      for (const b of buckets(r)) {
        const last = [...r.puts].reverse().find((u) => u.dig === b.d);
        if (last?.pos !== b.from)
          throw new Error("통의 마지막 놓기가 첫 칸이 아니다");
      }
      rounds++;
    }
  }
  return proofTable(
    table,
    `전개 입력의 배치 ${num(arrangements(WALK).length)} 가지에서 바퀴 ${num(rounds)} 개를 확인했습니다. 칸마다 정확히 한 번 놓였고, 통마다 마지막으로 놓인 값은 그 통의 첫 칸에 들어갔습니다.`,
  );
}

/* ───────── deep.build — 4단계 ───────── */

const zeroAtOne = (xs: readonly number[]): number[] =>
  xs.filter((x) => digitOf(x, BASE) === 0);

function buildCarry(): string {
  const rows = [
    ["입력", list(zeroAtOne(WALK))],
    ["바퀴 1 뒤", list(zeroAtOne(R1.out))],
    ["바퀴 2 뒤", list(zeroAtOne(R2.out))],
  ];
  return proofTable(
    md(["시점", "자리 1 이 0 인 값의 앞뒤"], rows),
    `바퀴 2 는 이 값 ${zeroAtOne(WALK).length} 개의 앞뒤를 바퀴 1 뒤 그대로 두었고, 그 순서가 자리 0 오름차순이라 곧 최종 순서입니다.`,
  );
}

function buildPath(): string {
  const at = (xs: readonly number[], v: number) => xs.indexOf(v);
  const a = 258;
  const b = 301;
  return columns([
    ["처음", `${a} 은 칸 ${at(WALK, a)}, ${b} 은 칸 ${at(WALK, b)}`],
    [
      "바퀴 1 뒤",
      `${a} 은 칸 ${at(R1.out, a)}, ${b} 은 칸 ${at(R1.out, b)}`,
      `자리 0 이 ${digitOf(a, 1)} 와 ${digitOf(b, 1)} 라 ${a} 이 앞`,
    ],
    [
      "바퀴 2 뒤",
      `${a} 은 칸 ${at(R2.out, a)}, ${b} 은 칸 ${at(R2.out, b)}`,
      `자리 1 이 둘 다 ${digitOf(a, BASE)} 이라 앞뒤를 그대로 둔다`,
    ],
  ]);
}

/* ───────── deep.build — 전제 ───────── */

function buildNegative(): string {
  const cases = [
    [5, -3, 2],
    [300, -1, 7],
    [-3, -1, -2],
  ];
  const rows = cases.map((A) => {
    const out = radixSort([...A]);
    const lost = A.filter((v) => !out.includes(v));
    return [
      show(A),
      show(out),
      show(sortedCopy(A)),
      lost.length === 0 ? "없음" : list(lost),
    ];
  });
  if (cases.every((A) => same(radixSort([...A]), sortedCopy(A)))) {
    throw new Error("음수가 섞인 입력이 어디서도 안 틀렸다");
  }
  return md(["입력", "radixSort 결과", "바른 답", "사라진 값"], rows);
}

/* ───────── deep.build — 설계 선택 ───────── */

const SWEEP_BASES = [2, 16, 64, 256, 1_024, 32_768];
const SWEEP_SIZES = [1, 1_000, BIG];

function sweepTable(): string {
  const cols = SWEEP_SIZES.map((n) => wide(n));
  const rows = SWEEP_BASES.map((b) => [
    num(b),
    num(passCount(MAX_VALUE, b)),
    ...cols.map((A) => num(radixCounts(A, b).access)),
  ]);
  const best = cols.map((A) => {
    let pick = SWEEP_BASES[0] as number;
    let low = Number.POSITIVE_INFINITY;
    for (const b of SWEEP_BASES) {
      const v = radixCounts(A, b).access;
      if (v < low) {
        low = v;
        pick = b;
      }
    }
    return { pick, low };
  });
  const at256 = cols.map((A) => radixCounts(A, BASE).access);
  const b0 = best[0] as { pick: number; low: number };
  const b2 = best[2] as { pick: number; low: number };
  return proofTable(
    md(
      ["B", "바퀴 d", ...SWEEP_SIZES.map((n) => `N = ${num(n)}`)],
      rows,
      [0, 1, 2, 3, 4],
    ),
    `가장 적은 칸은 N = ${num(SWEEP_SIZES[0] as number)} 에서 B = ${num(b0.pick)}, N = ${num(SWEEP_SIZES[1] as number)} 에서 B = ${num((best[1] as { pick: number }).pick)}, N = ${num(SWEEP_SIZES[2] as number)} 에서 B = ${num(b2.pick)} 입니다. B = 256 은 N = ${num(BIG)} 에서 ${num(at256[2] as number)} 번으로 가장 적은 ${num(b2.low)} 번의 ${ratio(at256[2] as number, b2.low)} 배이고, N = 1 에서 ${num(at256[0] as number)} 번으로 가장 적은 ${num(b0.low)} 번의 ${ratio(at256[0] as number, b0.low, 1)} 배입니다.`,
  );
}

/* ───────── deep.walk ───────── */

const STEPS = walkSteps();
const stepIds = (from: number, to: number): string[] =>
  STEPS.slice(from - 1, to).map((s) => s.id);

function walkInput(): string {
  return [
    `const A = [${WALK.join(", ")}];`,
    `// 이 절이 끝나면 [${radixSort([...WALK]).join(", ")}] 이 나와야 한다`,
  ].join("\n");
}

function walkMax(): string {
  const d = WALK_T.rounds.length;
  return columns([
    [
      "T1",
      `max = ${WALK_T.max}`,
      `${num(BASE)} ≤ ${WALK_T.max} < ${num(BASE ** d)} → 256 진법 ${d} 자리 → 바퀴 ${d} 번`,
    ],
    [
      "place",
      `${WALK_T.rounds.map((r) => `${num(r.place)} 에서 ⌊${WALK_T.max}/${num(r.place)}⌋ = ${Math.floor(WALK_T.max / r.place)} > 0 참`).join(" · ")} · ${num(WALK_T.stopPlace)} 에서 ⌊${WALK_T.max}/${num(WALK_T.stopPlace)}⌋ = 0 거짓`,
    ],
  ]);
}

function walkCount(): string {
  const [t2, t3] = stepIds(2, 3);
  return columns([
    [t2 as string, `place = 1`, `자리 0 의 값 ${list(R1.digits)}`],
    ["", "개수", R1.count.map(([d, c]) => `count[${d}] = ${c}`).join(" · ")],
    [
      t3 as string,
      "누적합",
      R1.prefix.map(([d, c]) => `count[${d}] = ${c}`).join(" · "),
    ],
  ]);
}

function walkPlace(): string {
  return md(
    ["단계", "i", "값", "자리 0", "count 갱신", "놓는 칸", "놓은 뒤 dst"],
    placeRows(R1, stepIds(4, 10)),
  );
}

function walkRound2(): string {
  const ids = stepIds(11, 21);
  return md(
    ["단계", "i", "값", "자리 1", "count 갱신", "놓는 칸", "놓은 뒤 dst"],
    placeRows(R2, ids.slice(3, 10)),
  );
}

function walkRound2Head(): string {
  const ids = stepIds(11, 13);
  return columns([
    [
      ids[0] as string,
      "맞바꿈",
      `src = ${show(R1.out)} · place = ${num(R2.place)}`,
    ],
    [ids[1] as string, "자리 1 의 값", list(R2.digits)],
    [
      ids[2] as string,
      "누적합",
      R2.prefix.map(([d, c]) => `count[${d}] = ${c}`).join(" · "),
    ],
  ]);
}

/** 갈래마다 실행된 걸음과 실행 횟수. */
function walkBranches(): string {
  const n = WALK.length;
  const d = WALK_T.rounds.length;
  const byTitle = (re: RegExp) =>
    STEPS.filter((s) => re.test(s.title)).map((s) => s.id);
  const count = byTitle(/값을 센다$/);
  const prefix = byTitle(/통의 끝을 정한다$/);
  const place = byTitle(/칸 \d+ 에$/);
  const swap = byTitle(/맞바꾼다$/);
  const range = (ids: string[]) =>
    ids.length === 0 ? "" : `${ids[0]} … ${ids.at(-1)}`;
  const placeR = WALK_T.rounds.map((_, k) =>
    range(place.slice(k * n, (k + 1) * n)),
  );
  const table = md(
    ["갈래", "조건", "이 실행에서", "실행 횟수"],
    [
      [
        "①",
        "함수를 시작할 때 한 번",
        `${STEPS[0]?.id} — ${n} 칸을 읽어 max = ${WALK_T.max}`,
        "1",
      ],
      [
        "②",
        "⌊max/place⌋ > 0 이 참인 동안",
        `place 가 ${WALK_T.rounds.map((r) => num(r.place)).join(" · ")} 에서 참, ${num(WALK_T.stopPlace)} 에서 거짓(${STEPS.at(-1)?.id})`,
        String(d),
      ],
      ["③", "바퀴마다 원소마다", count.join(" · "), String(d * n)],
      [
        "④",
        `바퀴마다 count 의 칸 ${BASE - 1} 개에`,
        prefix.join(" · "),
        num(d * (BASE - 1)),
      ],
      ["⑤", "i >= 0 이 참인 동안", placeR.join(" · "), String(d * n)],
      ["⑥", "바퀴 하나가 끝날 때마다", swap.join(" · "), String(d)],
    ],
    [3],
  );
  const access = radixCounts(WALK).access;
  return proofTable(
    table,
    `반환값은 ${show(WALK_T.out)} 이고 입력 A 는 ${show(WALK)} 그대로입니다. 배열 접근은 ${num(access)} 번, 비교는 ${radixCounts(WALK).compares} 번입니다.`,
  );
}

function finalCalls(): string {
  const calls = [
    WALK,
    [170, 45, 75, 90, 802, 24, 2, 66],
    [1_000_000_000, 0, 999_999_999, 1],
    [0, 0, 0],
    [12345],
    [],
  ];
  const left = calls.map((A) => `radixSort([${A.join(", ")}])`);
  const w = Math.max(...left.map((s) => s.length));
  return calls
    .map(
      (A, k) =>
        `${(left[k] as string).padEnd(w)}   →   [${radixSort([...A]).join(", ")}]`,
    )
    .join("\n");
}

/* ───────── 짚고 가기 ───────── */

function digitsLeft(x: number): number[] {
  if (x === 0) return [0];
  const out: number[] = [];
  for (let y = x; y > 0; y = Math.floor(y / BASE)) out.unshift(y % BASE);
  return out;
}

/** 자리를 **왼쪽 끝에 맞춰** 비교한 것 — 자릿수가 다른 값을 왼쪽 끝에 맞추면 사전식 순서가 나온다. */
function leftAligned(A: readonly number[]): number[] {
  return [...A].sort((a, b) => {
    const da = digitsLeft(a);
    const db = digitsLeft(b);
    for (let t = 0; t < Math.min(da.length, db.length); t++) {
      if (da[t] !== db[t]) return (da[t] as number) - (db[t] as number);
    }
    return da.length - db.length;
  });
}

function pauseLeftDigits(): string {
  const xs = [513, 2, 258];
  return columns([
    ...xs.map((x) => [
      `${x} 의 자리 목록`,
      `[${digitsLeft(x).join(" ")}]`,
      `첫 칸이 ${digitsLeft(x)[0]}`,
    ]),
    ["첫 칸만 보면 258 이 513 보다 앞이고, 2 는 513 과 첫 칸이 같다"],
  ]);
}

const ALIGN_CASES: number[][] = [
  WALK,
  [1, 10, 100, 1000],
  [170, 45, 75, 90, 802, 24, 2, 66],
  [0, 10, 0, 1],
];

function alignTable(): string {
  const wrong = ALIGN_CASES.filter(
    (A) => !same(leftAligned(A), radixSort([...A])),
  ).length;
  if (wrong === 0)
    throw new Error("왼쪽 끝에 맞춘 후보가 어느 입력에서도 답을 바꾸지 못했다");
  return proofTable(
    md(
      ["입력", "오른쪽 끝에 맞춤(자릿수 정렬)", "왼쪽 끝에 맞춤"],
      ALIGN_CASES.map((A) => [
        show(A),
        show(radixSort([...A])),
        show(leftAligned(A)),
      ]),
    ),
    `${ALIGN_CASES.length} 벌 중 ${wrong} 벌에서 왼쪽 끝에 맞춘 쪽이 틀렸습니다.`,
  );
}

/** 누적합 없이 개수만 세어 자리 값을 이어 쓴 것 — 나오는 것은 원래 값이 아니라 자리 값이다. */
function countOnlyPass(A: readonly number[], place: number): number[] {
  const count = new Array<number>(BASE).fill(0);
  for (const x of A) {
    const dg = digitOf(x, place);
    count[dg] = (count[dg] as number) + 1;
  }
  const out: number[] = [];
  for (let dg = 0; dg < BASE; dg++) {
    for (let t = count[dg] as number; t > 0; t--) out.push(dg);
  }
  return out;
}

/** 정본과 같은 절차를 한 바퀴만 실행한 것. */
const onePass = (A: readonly number[], place: number): number[] => {
  const t = trace(A);
  const r = t.rounds.find((x) => x.place === place);
  if (r !== undefined && r.p === 0) return [...r.out];
  // 둘째 바퀴 자리만 따로 볼 때 — 같은 절차를 그 자리 하나로 실행한다.
  const count = new Array<number>(BASE).fill(0);
  for (const x of A) {
    const dg = digitOf(x, place);
    count[dg] = (count[dg] as number) + 1;
  }
  for (let dg = 1; dg < BASE; dg++)
    count[dg] = (count[dg] as number) + (count[dg - 1] as number);
  const dst = new Array<number>(A.length).fill(0);
  for (let i = A.length - 1; i >= 0; i--) {
    const x = A[i] as number;
    const dg = digitOf(x, place);
    count[dg] = (count[dg] as number) - 1;
    dst[count[dg] as number] = x;
  }
  return dst;
};

const NO_PREFIX_CASES: [string, number[], number][] = [
  ["전개 입력 · 자리 0", WALK, 1],
  ["전개 입력 · 자리 1", WALK, BASE],
  ["[12 12 1 1 100 100] · 자리 0", [12, 12, 1, 1, 100, 100], 1],
];

function noPrefixTable(): string {
  const diff = NO_PREFIX_CASES.filter(
    ([, A, place]) => !same(countOnlyPass(A, place), onePass(A, place)),
  ).length;
  if (diff === 0)
    throw new Error("누적합을 뺀 후보가 어느 입력에서도 다른 답을 내지 못했다");
  return proofTable(
    md(
      ["한 바퀴", "누적합으로 통에 놓은 쪽", "개수만 세어 이어 쓴 쪽"],
      NO_PREFIX_CASES.map(([name, A, place]) => [
        name,
        show(onePass(A, place)),
        show(countOnlyPass(A, place)),
      ]),
    ),
    `${NO_PREFIX_CASES.length} 벌 중 ${diff} 벌에서 개수만 세어 이어 쓴 쪽이 원래 값 대신 자리 값을 남겼습니다.`,
  );
}

/* ───────── 불변식 ───────── */

/** 자리 0 부터 자리 p 까지만 남긴 수 — `x mod B^(p+1)`. */
const lowPart = (x: number, p: number): number => x % BASE ** (p + 1);
const ascending = (xs: readonly number[]): boolean =>
  xs.every((v, k) => k === 0 || (xs[k - 1] as number) <= v);

function invariantRounds(): string {
  const rows = WALK_T.rounds.map((r) => {
    const low = r.out.map((x) => lowPart(x, r.p));
    return [
      `바퀴 ${r.n} 뒤 (자리 ${r.p} 까지)`,
      show(r.out),
      show(low),
      ascending(low) ? "오름차순" : "아니다",
    ];
  });
  // 모든 배치와 저장소 케이스에서 바퀴마다 불변식을 대조한다 — 오름차순이고, 같은 수끼리 입력의 앞뒤.
  let inputs = 0;
  let rounds = 0;
  let bad = 0;
  for (const A of [...arrangements(WALK), ...REPO_CASES, spread(300)]) {
    inputs++;
    const tagged = A.map((v, k) => ({ v, k }));
    for (const r of trace(A).rounds) {
      rounds++;
      const low = r.out.map((x) => lowPart(x, r.p));
      if (!ascending(low)) bad++;
      // 안정성 — 남긴 수가 같은 원소끼리 입력의 앞뒤. 값이 같으면 구별할 수 없어 값이 다른 쌍만 본다.
      const order = new Map<number, number[]>();
      for (const t of tagged) order.set(t.v, [...(order.get(t.v) ?? []), t.k]);
      for (let k = 1; k < r.out.length; k++) {
        const a = r.out[k - 1] as number;
        const b = r.out[k] as number;
        if (a !== b && lowPart(a, r.p) === lowPart(b, r.p)) {
          if ((order.get(a)?.[0] as number) > (order.get(b)?.[0] as number))
            bad++;
        }
      }
    }
  }
  if (bad !== 0) throw new Error("불변식이 깨진 바퀴가 있다");
  return proofTable(
    md(["시점", "src", "자리 p 까지만 남긴 수", "남긴 수의 순서"], rows),
    `전개 입력의 배치 전부와 시험 입력을 합해 ${num(inputs)} 벌 · 바퀴 ${num(rounds)} 개에서 대조했고, 불변식이 어긋난 바퀴는 ${bad} 개입니다.`,
  );
}

function invariantEdges(): string {
  const cases: [string, number[]][] = [
    ["빈 배열", []],
    ["값이 전부 0", [0, 0, 0]],
    ["칸 하나", [12345]],
    ["값이 전부 같음", [7, 7, 7]],
    ["자릿수가 섞임", [1, 10, 100, 1000]],
    ["값의 상한", [MAX_VALUE, 0]],
  ];
  return md(
    ["입력", "모양", "바퀴 수", "결과", "반환 배열"],
    cases.map(([name, A]) => {
      const out = radixSort(A);
      return [
        show(A),
        name,
        String(trace(A).rounds.length),
        show(out),
        out !== A ? "새 배열" : "입력 그대로",
      ];
    }),
    [2],
  );
}

const FORWARD_CASES: number[][] = [
  WALK,
  [170, 45, 75, 90, 802, 24, 2, 66],
  [12, 12, 1, 1, 100, 100],
  [0, 10, 0, 1],
  [12345],
];

function forwardTable(): string {
  const wrong = FORWARD_CASES.filter(
    (A) => !same(radixSort([...A]), forward.radixSort([...A])),
  ).length;
  if (!neutral(forward) && wrong === 0) {
    throw new Error(
      "앞에서 뒤로 놓은 변이가 어느 입력에서도 답을 바꾸지 못했다",
    );
  }
  return proofTable(
    md(
      ["입력", "뒤에서 앞으로(바른 코드)", "앞에서 뒤로 놓은 코드"],
      FORWARD_CASES.map((A) => [
        show(A),
        show(radixSort([...A])),
        show(forward.radixSort([...A])),
      ]),
    ),
    `${FORWARD_CASES.length} 벌 중 ${wrong} 벌에서 답이 어긋납니다.`,
  );
}

function groupTable(): string {
  const firstRight = zeroAtOne(trace(WALK).rounds[0]?.out ?? []);
  const firstForward = zeroAtOne(
    trace(WALK, { forward: true }).rounds[0]?.out ?? [],
  );
  const lastRight = zeroAtOne(radixSort([...WALK]));
  const lastForward = zeroAtOne(forward.radixSort([...WALK]));
  // 다시 쓴 앞에서 뒤로 절차가 변이와 같은 답을 내는가(중화 실행에서는 건너뛴다).
  if (
    !neutral(forward) &&
    !same(trace(WALK, { forward: true }).out, forward.radixSort([...WALK]))
  ) {
    throw new Error("다시 쓴 앞에서 뒤로 절차가 변이와 다른 답을 냈다");
  }
  return proofTable(
    md(
      ["자리 1 이 0 인 넷의 앞뒤", "첫 바퀴 뒤", "마지막 바퀴 뒤"],
      [
        ["뒤에서 앞으로(바른 코드)", list(firstRight), list(lastRight)],
        ["앞에서 뒤로 놓은 코드", list(firstForward), list(lastForward)],
      ],
    ),
    same(firstRight, firstForward)
      ? "첫 바퀴가 낸 앞뒤는 같고, 마지막 바퀴에서 두 줄이 갈립니다."
      : "첫 바퀴에서 이미 두 줄이 갈립니다.",
  );
}

/* ───────── 비용 계산 ───────── */

function perfDerive(): string {
  const n = WALK.length;
  const d = WALK_T.rounds.length;
  const parts: [string, string, number][] = [
    ["칸 만들기", `B 번 쓰기`, BASE],
    ["자리 값 세기", "원소마다 3 번", 3 * n],
    ["누적합", "(B − 1) 칸마다 3 번", 3 * (BASE - 1)],
    ["놓기", "원소마다 4 번", 4 * n],
  ];
  const per = parts.reduce((s, [, , v]) => s + v, 0);
  const prep = 4 * n;
  const total = prep + d * per;
  if (total !== radixCounts(WALK).access || per !== 7 * n + 4 * BASE - 3) {
    throw new Error("조각의 합이 계측한 접근과 다르다");
  }
  const fixed = BASE + 3 * (BASE - 1);
  const moving = 7 * n;
  return proofTable(
    md(
      ["한 바퀴의 조각", "세는 법", "전개 입력에서"],
      [
        ...parts.map(([a, b, v]) => [a, b, num(v)]),
        ["바퀴 하나의 합", "7N + 4B − 3", num(per)],
      ],
      [2],
    ),
    `바퀴가 ${d} 번이라 ${num(d * per)} 번이고, 준비(사본 · dst 초기화 · 최댓값 찾기)가 4N = ${num(prep)} 번 더 들어 합이 ${num(total)} 번입니다. 계측한 배열 접근과 같습니다. 칸 만들기와 누적합만 한 바퀴 ${num(fixed)} 번으로, 원소를 세고 놓는 ${num(moving)} 번의 ${Math.floor(fixed / moving)} 배가 넘습니다.`,
  );
}

const WORST: [string, number[]][] = [
  ["최댓값 255 인 일곱 칸", [255, 45, 2, 66, 90, 30, 7]],
  ["전개 입력 일곱 칸 (최댓값 513)", WALK],
  ["최댓값 10^9 인 일곱 칸", [MAX_VALUE, 45, 2, 66, 90, 30, 7]],
  ["최댓값 10^9 인 한 칸", [MAX_VALUE]],
  [`최댓값 10^9 인 ${num(BIG)} 칸`, wide(BIG)],
];

function worstTable(): string {
  const arr = arrangements(WALK);
  const accesses = arr.map((A) => radixCounts(A).access);
  if (Math.min(...accesses) !== Math.max(...accesses)) {
    throw new Error("같은 다중집합의 배치가 접근 횟수를 바꿨다");
  }
  const rows = WORST.map(([name, A]) => {
    const m = radixCounts(A);
    return [
      name,
      num(m.passes),
      num(m.access),
      (m.access / A.length).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    ];
  });
  const a = radixCounts(WORST[0]?.[1] as number[]).access;
  const b = radixCounts(WORST[2]?.[1] as number[]).access;
  return proofTable(
    md(["입력", "바퀴 수", "배열 접근", "원소당 접근"], rows, [1, 2, 3]),
    `전개 입력의 배치 ${num(arr.length)} 가지는 배열 접근이 전부 ${num(accesses[0] as number)} 번으로 같습니다. 일곱 칸 중 최댓값 하나만 255 에서 10^9 으로 바꾸면 바퀴가 1 에서 4 로 늘어 접근이 ${num(a)} 번에서 ${num(b)} 번, ${ratio(b, a, 1)} 배가 됩니다.`,
  );
}

/* ───────── purpose.alt — 우열이 뒤집히는 자리 ───────── */

function crossoverN(): number {
  for (let n = 2; n <= 2_000; n++) {
    const A = spread(n);
    if (radixCounts(A).access <= mergeCounts(A).access) return n;
  }
  throw new Error("2,000 칸까지 뒤집히는 자리를 못 찾았다");
}

function crossoverTable(): string {
  const at = crossoverN();
  const rows = [200, at - 1, at, BIG].map((n) => {
    const A = spread(n);
    const r = radixCounts(A).access;
    const m = mergeCounts(A).access;
    return [
      `${num(n)} 칸`,
      num(r),
      num(m),
      r <= m ? "자릿수 정렬" : "병합 정렬",
    ];
  });
  const big = spread(BIG);
  return proofTable(
    md(
      ["생성식으로 만든 입력", "자릿수 정렬 접근", "병합 정렬 접근", "적은 쪽"],
      rows,
      [1, 2],
    ),
    `${num(at)} 칸에서 처음으로 순서가 뒤집히고, ${num(BIG)} 칸에서는 병합 정렬의 접근이 자릿수 정렬의 ${ratio(mergeCounts(big).access, radixCounts(big).access)} 배입니다.`,
  );
}

/* ───────── deep.math ───────── */

function mathPieces(): string {
  const x = 513;
  const p = 1;
  return md(
    ["식의 조각", "뜻", `x = ${x} · p = ${p} 일 때`],
    [
      ["$B^{p}$", "p 번째 자리의 크기", num(BASE ** p)],
      [
        "$\\lfloor x / B^{p} \\rfloor$",
        "그 자리 위쪽까지 남긴 몫",
        String(Math.floor(x / BASE ** p)),
      ],
      [
        "$\\dots \\bmod B$",
        "그 자리 하나만 남긴 나머지",
        String(digitOf(x, BASE ** p)),
      ],
    ],
    [2],
  );
}

function mathCheck(): string {
  const rows: string[][] = [
    ["$\\mathrm{digit}(513, 0)$", "$513 \\bmod 256$", String(digitOf(513, 1))],
    [
      "$\\mathrm{digit}(513, 1)$",
      "$\\lfloor 513/256 \\rfloor \\bmod 256$",
      String(digitOf(513, BASE)),
    ],
    [
      "$\\mathrm{digit}(2, 1)$",
      "$\\lfloor 2/256 \\rfloor \\bmod 256$",
      String(digitOf(2, BASE)),
    ],
    [
      "$d(513)$",
      `$\\lfloor \\log_{256} 513 \\rfloor + 1 = \\lfloor ${(Math.log(513) / Math.log(BASE)).toFixed(4)} \\rfloor + 1$`,
      String(Math.floor(Math.log(513) / Math.log(BASE)) + 1),
    ],
    [
      "$d(10^9)$",
      `$\\lfloor \\log_{256} 10^9 \\rfloor + 1 = \\lfloor ${(Math.log(MAX_VALUE) / Math.log(BASE)).toFixed(4)} \\rfloor + 1$`,
      String(Math.floor(Math.log(MAX_VALUE) / Math.log(BASE)) + 1),
    ],
  ];
  // 식의 d 가 실행의 바퀴 수와 같은가.
  if (
    Math.floor(Math.log(513) / Math.log(BASE)) + 1 !== passCount(513) ||
    Math.floor(Math.log(MAX_VALUE) / Math.log(BASE)) + 1 !==
      passCount(MAX_VALUE)
  ) {
    throw new Error("d(M) 의 식이 실행의 바퀴 수와 다르다");
  }
  return md(["넣는 값", "계산", "결과"], rows, [2]);
}

function mathTotal(): string {
  const n = WALK.length;
  const d = passCount(maxOf(WALK));
  const per = 7 * n + 4 * BASE - 3;
  return columns([
    ["준비", `4 × ${n}`, num(4 * n)],
    ["바퀴 하나", `7 × ${n} + 4 × ${BASE} − 3`, num(per)],
    [`바퀴 ${d} 번`, `${d} × ${num(per)}`, num(d * per)],
    [
      `합 ${num(4 * n + d * per)} — 전개 입력을 계측한 배열 접근 ${num(radixCounts(WALK).access)} 과 같다`,
    ],
  ]);
}

function mathCode(): string {
  const a = accessOf(WALK.length, BASE, passCount(maxOf(WALK)));
  const bigA = wide(BIG);
  const b = accessOf(BIG, BASE, passCount(maxOf(bigA)));
  if (a !== radixCounts(WALK).access || b !== radixCounts(bigA).access) {
    throw new Error("total 의 값이 계측과 다르다");
  }
  return [
    "const total = (N: number, B: number, d: number): number =>",
    "  4 * N + d * (7 * N + 4 * B - 3);",
    "",
    `total(${WALK.length}, ${BASE}, ${passCount(maxOf(WALK))});       // = ${a}     전개 입력을 계측한 값과 같다`,
    `total(100_000, ${BASE}, ${passCount(MAX_VALUE)}); // = ${b}  최댓값 10^9 인 ${num(BIG)} 칸을 계측한 값과 같다`,
  ].join("\n");
}

/** 바퀴를 `d` 번으로 정했을 때 한 자리가 담아야 하는 값의 최소 가짓수. `B^d > M` 인 최소 `B`. */
function minBase(d: number, max: number): number {
  let b = 2;
  while (true) {
    let covered = 1;
    let over = false;
    for (let t = 0; t < d; t++) {
      covered *= b;
      if (covered > max) {
        over = true;
        break;
      }
    }
    if (over) return b;
    b++;
  }
}

for (const d of [2, 3, 4, 5]) {
  if (passCount(MAX_VALUE, minBase(d, MAX_VALUE)) !== d) {
    throw new Error(`minBase(${d}) 가 바퀴 ${d} 를 내지 않는다`);
  }
}

function switchN(d: number): number | null {
  const a = minBase(d, MAX_VALUE);
  const b = minBase(d + 1, MAX_VALUE);
  for (let n = 1; n <= 10_000_000; n++) {
    if (accessOf(n, a, d) <= accessOf(n, b, d + 1)) return n;
  }
  return null;
}

function mathTable(): string {
  const ds = [2, 3, 4, 5];
  const rows = ds.map((d) => {
    const b = minBase(d, MAX_VALUE);
    const at = switchN(d);
    return [
      num(d),
      num(b),
      num(accessOf(BIG, b, d)),
      at === null ? "없다" : `${num(at)} 칸부터`,
    ];
  });
  const mine = radixCounts(wide(BIG)).access;
  const best = Math.min(
    ...ds.map((d) => accessOf(BIG, minBase(d, MAX_VALUE), d)),
  );
  return proofTable(
    md(
      [
        "바퀴 d",
        "한 자리 최소 가짓수",
        `N = ${num(BIG)} 에서의 T`,
        "d + 1 바퀴보다 적어지는 첫 N",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    `이 편의 B = 256 은 같은 N 에서 ${num(mine)} 번이라 가장 적은 ${num(best)} 번의 ${ratio(mine, best, 1)} 배입니다.`,
  );
}

/* ───────── 스스로 점검하기 ───────── */

function selfGiven(): string {
  const src = R2.src;
  const at = src
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => digitOf(x, BASE) === 0);
  return `자리 1 이 0 인 넷은 첫 바퀴 뒤 배열 ${show(src)} 의 i = ${at.map((a) => a.i).join(" · ")} (값 ${at.map((a) => a.x).join(" · ")}) 이다`;
}

function selfAnswer(): string {
  // 둘째 바퀴만 앞에서 뒤로 놓는다 — 첫 바퀴는 바른 코드의 결과를 그대로 쓴다.
  const src = R2.src;
  const place = R2.place;
  const count = new Array<number>(BASE).fill(0);
  for (const x of src)
    count[digitOf(x, place)] = (count[digitOf(x, place)] as number) + 1;
  for (let dg = 1; dg < BASE; dg++)
    count[dg] = (count[dg] as number) + (count[dg - 1] as number);
  const dst = new Array<number>(src.length).fill(0);
  const fwd: string[] = [];
  for (let i = 0; i < src.length; i++) {
    const x = src[i] as number;
    const dg = digitOf(x, place);
    count[dg] = (count[dg] as number) - 1;
    dst[count[dg] as number] = x;
    if (dg === 0) fwd.push(`i = ${i} → 칸 ${count[dg]}`);
  }
  const back = R2.puts
    .filter((u) => u.dig === 0)
    .map((u) => `i = ${u.i} → 칸 ${u.pos}`);
  const full = forward.radixSort([...WALK]);
  if (!neutral(forward) && !same(dst, full)) {
    throw new Error("둘째 바퀴만 바꾼 결과가 두 바퀴를 다 바꾼 변이와 다르다");
  }
  return columns([
    ["뒤에서 앞으로", back.join(", ")],
    ["앞에서 뒤로", fwd.join(", ")],
    [
      `둘째 바퀴만 앞에서 뒤로 놓은 결과 ${show(dst)} — 두 바퀴를 다 바꾼 코드의 결과 ${show(full)}${과와(full.at(-1) ?? 0)} 같다`,
    ],
  ]);
}

/* ───────── 알아 두면 좋은 개념 ───────── */

function relatedKeys(): string {
  const low = radixSort([...WALK]);
  const high = msdRepeat(WALK);
  const hi = (xs: readonly number[]) => list(xs.map((x) => digitOf(x, BASE)));
  return md(
    ["되풀이 순서", "결과", "결과의 자리 1", "결과의 자리 0"],
    [
      [
        "덜 높은 키(자리 0) 먼저",
        show(low),
        hi(low),
        list(low.map((x) => digitOf(x, 1))),
      ],
      [
        "더 높은 키(자리 1) 먼저",
        show(high),
        hi(high),
        list(high.map((x) => digitOf(x, 1))),
      ],
    ],
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-cost": conceptCost,
  "origin-naive": originNaive,
  "origin-wide": originWide,
  "origin-split": originSplit,
  "msd-repeat": msdTable,
  "msd-why": msdWhy,
  "bucket-read": bucketRead,
  "bucket-rounds": bucketRounds,
  "bucket-vs-cell": bucketVsCell,
  "build-passes": buildPasses,
  "build-digits": buildDigits,
  "build-count": buildCount,
  "build-place": buildPlace,
  "build-carry": buildCarry,
  "build-path": buildPath,
  "build-negative": buildNegative,
  "base-sweep": sweepTable,
  "walk-input": walkInput,
  "walk-max": walkMax,
  "walk-count": walkCount,
  "walk-place": walkPlace,
  "walk-round2-head": walkRound2Head,
  "walk-round2": walkRound2,
  "walk-branches": walkBranches,
  "final-calls": finalCalls,
  "pause-left-digits": pauseLeftDigits,
  "pause-left-align": alignTable,
  "pause-no-prefix": noPrefixTable,
  "invariant-rounds": invariantRounds,
  "invariant-edges": invariantEdges,
  "mutant-forward": forwardTable,
  "mutant-forward-groups": groupTable,
  "perf-derive": perfDerive,
  "worst-input": worstTable,
  "alt-crossover": crossoverTable,
  "math-pieces": mathPieces,
  "math-check": mathCheck,
  "math-total": mathTotal,
  "math-code": mathCode,
  "math-scale": mathTable,
  "self-given": selfGiven,
  "self-answer": selfAnswer,
  "related-keys": relatedKeys,
};
