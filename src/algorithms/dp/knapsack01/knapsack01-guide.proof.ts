/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 칸 하나를 정한 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/knapsack01/knapsack01-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./knapsack01-guide.alt.ts";
import {
  BRANCH_MARK,
  CAP,
  CAP_WIDE,
  type Cell,
  N_MAX,
  oneRow,
  trace,
  VALUES,
  W_MAX,
  WEIGHTS,
  walkSteps,
} from "./knapsack01-guide.fig.tsx";
import { knapsack01 } from "./knapsack01-guide.ref.ts";

const REF = new URL("./knapsack01-guide.ref.ts", import.meta.url).pathname;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1010101` → `1,010,101`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 글자 표를 만든다. `left` 에 든 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(
  head: string[],
  rows: string[][],
  left: readonly number[] = [0],
): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        left.includes(i) ? pad(c, w[i] as number) : padL(c, w[i] as number),
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

/** `[0 1 1 4]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: readonly (number | string)[]): string => `[${xs.join(" ")}]`;
const list = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** 물건 번호 — 1 부터 센다. 본문은 「물건 2」처럼 부른다. */
const setName = (ks: readonly number[]): string =>
  ks.length === 0 ? "{}" : `{${ks.map((k) => k + 1).join(",")}}`;

/* ────────────────────────── 정의대로 센다 ────────────────────────── */

/** 부분집합 전부 — 물건 번호(0 부터) 목록. 작은 번호부터 늘어놓는다. */
function subsets(n: number): number[][] {
  const out: number[][] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const ks: number[] = [];
    for (let k = 0; k < n; k++) if (mask & (1 << k)) ks.push(k);
    out.push(ks);
  }
  return out.sort((a, b) => a.length - b.length || cmpList(a, b));
}

function cmpList(a: readonly number[], b: readonly number[]): number {
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    const d = (a[k] as number) - (b[k] as number);
    if (d !== 0) return d;
  }
  return a.length - b.length;
}

const sumOf = (xs: readonly number[], ks: readonly number[]): number =>
  ks.reduce((s, k) => s + (xs[k] as number), 0);

/**
 * 정의 그대로 — 앞의 `i` 개 물건의 부분집합 중 무게 합이 `c` 이하인 것의 가치 합 최댓값과 그 조합.
 * 정본과 무관하게 센다. 정본의 값과 맞대는 쪽이다. 동점이면 먼저 나온(작은) 조합을 남긴다.
 */
function bestOf(
  weights: readonly number[],
  values: readonly number[],
  i: number,
  c: number,
): { value: number; set: number[] } {
  let best = { value: 0, set: [] as number[] };
  for (const ks of subsets(i)) {
    if (sumOf(weights, ks) > c) continue;
    const v = sumOf(values, ks);
    if (v > best.value) best = { value: v, set: ks };
  }
  return best;
}

/** 같은 물건을 몇 번이든 담을 수 있을 때의 최선 — 담은 횟수 목록과 그 값. 무게 ≥ 1 인 정수 입력만. */
function unboundedBest(
  weights: readonly number[],
  values: readonly number[],
  c: number,
): { value: number; counts: number[] } {
  let best = { value: 0, counts: weights.map(() => 0) };
  const k = weights.map(() => 0);
  const go = (j: number, rest: number, v: number): void => {
    if (j === weights.length) {
      if (v > best.value) best = { value: v, counts: [...k] };
      return;
    }
    const w = weights[j] as number;
    for (let m = 0; m * w <= rest; m++) {
      k[j] = m;
      go(j + 1, rest - m * w, v + m * (values[j] as number));
    }
    k[j] = 0;
  };
  go(0, c, 0);
  return best;
}

// 정의대로 센 값이 정본과 같은가 — 작은 입력 전부에서 맞대어 둔다. 어긋나면 아래 블록이 모두 틀린 말을 한다.
for (const [ws, vs] of [
  [WEIGHTS, VALUES],
  [
    [3, 4],
    [4, 5],
  ],
  [
    [3, 3, 3],
    [1, 5, 3],
  ],
  [
    [2, 5, 1, 4],
    [3, 9, 2, 6],
  ],
] as const) {
  for (let c = 0; c <= 12; c++) {
    if (
      bestOf(ws, vs, ws.length, c).value !== knapsack01([...ws], [...vs], c)
    ) {
      throw new Error(`정의대로 센 값이 정본과 다르다 — ${list(ws)} / ${c}`);
    }
  }
}
// 한 줄을 큰 용량부터 채운 방식은 정본과 같고, 작은 용량부터 채운 방식은 여러 번 담는 최선과 같다.
for (let c = 0; c <= 15; c++) {
  if (
    oneRow(WEIGHTS, VALUES, c, "down").best[c] !==
    knapsack01(WEIGHTS, VALUES, c)
  ) {
    throw new Error(`큰 용량부터 채운 한 줄이 정본과 다르다 — 용량 ${c}`);
  }
  if (
    oneRow(WEIGHTS, VALUES, c, "up").best[c] !==
    unboundedBest(WEIGHTS, VALUES, c).value
  ) {
    throw new Error(
      `작은 용량부터 채운 한 줄이 여러 번 담는 최선과 다르다 — 용량 ${c}`,
    );
  }
}

/** 본문 「떠올리는 과정」의 완전 탐색 — 본문 코드와 같은 절차다. 정본과 같은 답을 내는지 맞대어 둔다. */
function 완전탐색(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const go = (k: number, w: number, v: number): number => {
    if (k === n) return w <= W ? v : 0;
    const 두고감 = go(k + 1, w, v);
    const 담음 = go(
      k + 1,
      w + (weights[k] as number),
      v + (values[k] as number),
    );
    return Math.max(두고감, 담음);
  };
  return go(0, 0, 0);
}
for (let c = 0; c <= 15; c++) {
  if (완전탐색(WEIGHTS, VALUES, c) !== knapsack01(WEIGHTS, VALUES, c)) {
    throw new Error(`완전 탐색이 정본과 다르다 — 용량 ${c}`);
  }
}

/** 전개 입력의 기록 — 여러 블록이 같이 쓴다. */
const T = trace(WEIGHTS, VALUES, CAP);
const dpv = (i: number, c: number): number => T.rows[i]?.[c] as number;
const cellAt = (i: number, c: number): Cell => {
  const x = T.cells.find((y) => y.i === i && y.c === c);
  if (!x) throw new Error(`dp[${i}][${c}] 의 기록이 없다`);
  return x;
};

/* ────────────────────────── 변이 ────────────────────────── */

type Solver = {
  knapsack01(weights: number[], values: number[], W: number): number;
};

/**
 * 불변식을 지키던 줄 — 담는 쪽 값을 **윗 줄**에서 읽는 자리 — 를 **같은 줄**로 바꾼 사본.
 * 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 같은줄에서읽기 = await loadMutant<Solver>(REF, {
  swap: [/\(prev\[c - w\] as number\) \+ v/, "(cur[c - w] as number) + v"],
});

/** 동점에서 두고 가는 쪽 대신 담는 쪽을 고르는 사본 — `>=` 를 `>` 로. */
const 동점에담기 = await loadMutant<Solver>(REF, {
  swap: [/skip >= take \? skip : take/, "skip > take ? skip : take"],
});

/**
 * 중화 실행인가 — `check-proof` 가 변이를 끈 채 이 파일을 한 번 더 부를 때는 `loadMutant` 가 정본을
 * 그대로 돌려준다. 값에서 알아낸다(변이 모듈의 함수가 정본과 같은 객체인가). 그때는 「변이가 답을
 * 바꿨다」는 자기검사만 건너뛴다 — 안 그러면 중화 실행이 모듈 머리에서 던져 갈림 대조가 한 번도 돌지 않는다.
 */
const 중화 = 같은줄에서읽기.knapsack01 === knapsack01;

const 같은줄표: [string, number[], number[], number][] = [
  [`용량 ${CAP}`, WEIGHTS, VALUES, CAP],
  [`용량 ${CAP_WIDE}`, WEIGHTS, VALUES, CAP_WIDE],
  [`용량 ${CAP_WIDE + 1}`, WEIGHTS, VALUES, CAP_WIDE + 1],
];

if (
  !중화 &&
  같은줄표.every(
    ([, ws, vs, c]) =>
      knapsack01(ws, vs, c) === 같은줄에서읽기.knapsack01(ws, vs, c),
  )
) {
  throw new Error(
    "같은 줄에서 읽는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

/* ────────────────────────── 파트 1 — 전체 컨셉 ────────────────────────── */

/** `concept` — 물건 넷과 최선의 조합. 정본의 답과 맞댄다. */
function conceptItems(): string {
  const best = bestOf(WEIGHTS, VALUES, WEIGHTS.length, CAP);
  const r = knapsack01(WEIGHTS, VALUES, CAP);
  if (best.value !== r) throw new Error("최선의 조합이 정본과 다르다");
  const fits = subsets(WEIGHTS.length).filter(
    (ks) => sumOf(WEIGHTS, ks) <= CAP,
  ).length;
  return withNote(
    md(
      ["물건", "무게", "가치", "최선의 조합"],
      WEIGHTS.map((w, k) => [
        `물건 ${k + 1}`,
        String(w),
        String(VALUES[k]),
        best.set.includes(k) ? "든다" : "—",
      ]),
      [1, 2],
    ),
    `조합 ${2 ** WEIGHTS.length} 가지 가운데 무게 합이 ${CAP} 이하인 것은 ${fits} 가지이고, 가치 합이 가장 큰 것은 물건 ${best.set.map((k) => k + 1).join(" · ")}${으로(String((best.set.at(-1) ?? 0) + 1))} 무게 ${sumOf(WEIGHTS, best.set)} · 가치 ${best.value} 입니다. 정본 knapsack01(${list(WEIGHTS)}, ${list(VALUES)}, ${CAP}) 이 낸 값도 ${r} 입니다.`,
  );
}

/** `concept` — 규모의 끝에서 칸 수. */
function conceptSize(): string {
  const cells = (N_MAX + 1) * (W_MAX + 1);
  return table(
    ["물건 수 n", "용량 W", "칸 (n+1)(W+1)"],
    [
      [
        String(WEIGHTS.length),
        String(CAP),
        comma((WEIGHTS.length + 1) * (CAP + 1)),
      ],
      [String(N_MAX), comma(W_MAX), comma(cells)],
    ],
  );
}

/* ────────────────────────── 파트 1 — 떠올리는 과정 ────────────────────────── */

/** `2.27e+30` → `1.27 × 10^30`. */
const sci = (x: number): string => {
  const [m, e] = x.toExponential(2).split("e+");
  return `${m} × 10^${e}`;
};

/** `deep.origin` ② — 조합의 수와, 1 초에 `10^9` 개를 볼 때 걸리는 시간. */
function bruteCount(): string {
  const PER_SEC = 1e9;
  const YEAR = 365.25 * 24 * 3600;
  const rows = [WEIGHTS.length, 20, N_MAX].map((n) => {
    const all = 2 ** n;
    const sec = all / PER_SEC;
    return [
      String(n),
      all < 1e7 ? comma(all) : sci(all),
      sec < 1 ? "1 초 안" : `${sci(sec)} 초 ≈ ${sci(sec / YEAR)} 년`,
    ];
  });
  return table(["물건 수 n", "조합 2^n", "1 초에 10^9 가지를 볼 때"], rows);
}

/** `deep.origin` ③ — 앞부분이 같은 조합을 따로 센다. */
function originRepeat(): string {
  const sets = [
    [0, 1],
    [0, 1, 2],
    [0, 1, 3],
  ];
  const rows = sets.map((ks) => [
    setName(ks),
    `무게 ${ks.map((k) => WEIGHTS[k]).join("+")}=${sumOf(WEIGHTS, ks)}`,
    `가치 ${ks.map((k) => VALUES[k]).join("+")}=${sumOf(VALUES, ks)}`,
  ]);
  return table(["조합", "무게 합", "가치 합"], rows, [0, 1, 2]);
}

/** 층마다 적는 항목 — 조합마다 하나인 경우와, 무게 합이 같은 것을 합친(용량을 넘는 것은 버린) 경우. */
function layers(
  weights: readonly number[],
  cap: number,
): { combos: number[]; merged: number[][] } {
  const combos: number[] = [];
  const merged: number[][] = [];
  let reach = new Set<number>([0]);
  for (let i = 0; i <= weights.length; i++) {
    combos.push(2 ** i);
    merged.push([...reach].sort((a, b) => a - b));
    const w = weights[i];
    if (w === undefined) break;
    const next = new Set(reach);
    for (const s of reach) if (s + w <= cap) next.add(s + w);
    reach = next;
  }
  return { combos, merged };
}

/** `deep.origin` ④ — 같은 입력을 두 방식으로 적고 항목 수를 센다. */
function originMerge4(): string {
  const { combos, merged } = layers(WEIGHTS, CAP);
  const rows = combos.map((n, i) => [
    `i=${i}`,
    comma(n),
    String(merged[i]?.length),
    (merged[i] ?? []).join(" "),
  ]);
  rows.push([
    "합",
    comma(combos.reduce((a, b) => a + b, 0)),
    String(merged.reduce((a, m) => a + m.length, 0)),
    "",
  ]);
  return table(
    ["층", "조합마다 하나", "무게 합이 같으면 합친다", "남은 무게 합"],
    rows,
    [0, 3],
  );
}

/** 물건을 넷 더 붙인 입력 — 무게만 쓴다. */
const WEIGHTS8 = [...WEIGHTS, 2, 6, 3, 7];

/** `deep.origin` ④ — 물건 여덟이면 두 방식의 차이가 벌어진다. */
function originMerge8(): string {
  const { combos, merged } = layers(WEIGHTS8, CAP);
  const total = (xs: number[]) => comma(xs.reduce((a, b) => a + b, 0));
  return table(
    ["방식", "층마다 항목 수", "합"],
    [
      ["조합마다 하나", combos.join(" "), total(combos)],
      [
        "무게 합이 같으면 합친다",
        merged.map((m) => m.length).join(" "),
        total(merged.map((m) => m.length)),
      ],
    ],
    [0, 1],
  );
}

/** `deep.origin` ⑤ — 무게 합 하나만 기억하는 방식의 값. */
function oneWeight(): string {
  return table(
    ["용량", "무게 합만 기억", "(i, c) 를 기억"],
    [CAP, CAP_WIDE, CAP_WIDE + 1].map((c) => [
      String(c),
      String(oneRow(WEIGHTS, VALUES, c, "up").best[c]),
      String(knapsack01(WEIGHTS, VALUES, c)),
    ]),
  );
}

/** 여러 번 담은 목록을 물건 이름으로 — `물건 4 를 두 번`. */
const countsText = (counts: readonly number[]): string =>
  counts
    .map((m, k) =>
      m === 0
        ? ""
        : m === 1
          ? `물건 ${k + 1}`
          : `물건 ${k + 1}${을를(String(k + 1))} ${m} 번`,
    )
    .filter((s) => s !== "")
    .join(" · ");

/** `deep.origin` ⑤ — 용량 10 에서 두 방식이 고른 것. */
function oneWeightWhy(): string {
  const c = CAP_WIDE;
  const up = unboundedBest(WEIGHTS, VALUES, c);
  if (up.value !== oneRow(WEIGHTS, VALUES, c, "up").best[c]) {
    throw new Error("여러 번 담은 최선이 무게 합만 기억한 방식과 다르다");
  }
  const best = bestOf(WEIGHTS, VALUES, WEIGHTS.length, c);
  const picked = up.counts.flatMap((m, k) =>
    Array.from({ length: m }, () => k),
  );
  return table(
    ["방식", "고른 것", "무게 합", "가치 합"],
    [
      [
        "무게 합만 기억",
        countsText(up.counts),
        picked.map((k) => WEIGHTS[k]).join("+"),
        `${picked.map((k) => VALUES[k]).join("+")}=${up.value}`,
      ],
      [
        "(i, c) 를 기억",
        best.set.map((k) => `물건 ${k + 1}`).join(" · "),
        best.set.map((k) => WEIGHTS[k]).join("+"),
        `${best.set.map((k) => VALUES[k]).join("+")}=${best.value}`,
      ],
    ],
    [0, 1, 2],
  );
}

/* ────────────────────────── 파트 1 — 아이디어 상세 ────────────────────────── */

/** `deep.build` 1단계 — DP 테이블의 크기. */
function buildSize(): string {
  const rows = [
    [WEIGHTS.length, CAP],
    [N_MAX, W_MAX],
  ].map(([n, W]) => [
    comma(n as number),
    comma(W as number),
    comma((n as number) + 1),
    comma((W as number) + 1),
    comma(((n as number) + 1) * ((W as number) + 1)),
  ]);
  return withNote(
    md(
      ["물건 수 n", "용량 W", "줄 수 n+1", "줄마다 칸 수 W+1", "모든 칸"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    `전개 입력에서 정본이 만든 DP 테이블은 ${T.rows.length} 줄 × ${T.rows[0]?.length} 칸, 모두 ${T.rows.length * (T.rows[0]?.length ?? 0)} 칸입니다.`,
  );
}

/** `deep.build` 1단계 — dp[2][4] 를 이름에서 조합까지. */
function buildReadOne(): string {
  const i = 2;
  const c = 4;
  const rows = subsets(i).map((ks) => {
    const w = sumOf(WEIGHTS, ks);
    return [
      setName(ks),
      String(w),
      String(sumOf(VALUES, ks)),
      w <= c ? "든다" : "넘는다",
    ];
  });
  const best = bestOf(WEIGHTS, VALUES, i, c);
  return withNote(
    md(["조합", "무게 합", "가치 합", `용량 ${c} 에`], rows, [1, 2]),
    `용량 ${c} 에 드는 조합 가운데 가치 합이 가장 큰 것은 ${setName(best.set)} 의 ${best.value} 이고, DP 테이블의 dp[${i}][${c}] 도 ${dpv(i, c)} 입니다.`,
  );
}

/** `deep.build` 1단계 — 칸은 「정확히 c」 가 아니라 「c 이하」 다. */
function buildAtMost(): string {
  const i = 2;
  let none = 0;
  const rows = Array.from({ length: CAP + 1 }, (_, c) => {
    const exact = subsets(i).filter((ks) => sumOf(WEIGHTS, ks) === c);
    if (exact.length === 0) none++;
    const ev =
      exact.length === 0
        ? "없음"
        : String(Math.max(...exact.map((ks) => sumOf(VALUES, ks))));
    return [String(c), ev, String(dpv(i, c))];
  });
  return withNote(
    md(
      ["용량 c", "무게 합이 정확히 c 인 조합의 최대 가치", `dp[${i}][c]`],
      rows,
      [0, 1, 2],
    ),
    `무게 합이 정확히 c 인 조합이 없는 칸이 ${none} 개이고, DP 테이블은 그 칸에도 값을 적습니다.`,
  );
}

/** `deep.build` 2단계 — i=3 줄을 채우며 읽은 칸이 전부 윗 줄이다. */
function buildFillRow(): string {
  const i = 3;
  const w = WEIGHTS[i - 1] as number;
  const v = VALUES[i - 1] as number;
  let reads = 0;
  let upper = 0;
  const rows = Array.from({ length: CAP + 1 }, (_, c) => {
    const cell = cellAt(i, c);
    for (const [r] of cell.reads) {
      reads++;
      if (r === i - 1) upper++;
    }
    return [
      String(c),
      BRANCH_MARK[cell.branch],
      `dp[${i - 1}][${c}] = ${cell.skip}`,
      cell.take === null ? "—" : `dp[${i - 1}][${c - w}] + ${v} = ${cell.take}`,
      String(cell.value),
    ];
  });
  return withNote(
    md(["c", "갈래", "두고 간다", "담는다", `dp[${i}][c]`], rows, [0, 4]),
    `이 줄에서 읽은 칸 ${reads} 개 가운데 ${upper} 개가 i=${i - 1} 줄입니다.`,
  );
}

/** `deep.build` 3단계 — 마지막 줄의 칸이 용량마다의 답이다. */
function buildAnswer(): string {
  const n = WEIGHTS.length;
  let same = 0;
  const rows = Array.from({ length: CAP + 1 }, (_, c) => {
    const r = knapsack01(WEIGHTS, VALUES, c);
    if (r === dpv(n, c)) same++;
    return [String(c), String(dpv(n, c)), String(r)];
  });
  return withNote(
    md(["용량 c", `dp[${n}][c]`, `knapsack01(…, c)`], rows, [0, 1, 2]),
    `${CAP + 1} 용량 가운데 ${same} 용량에서 두 값이 같습니다. 정본이 돌려주는 것은 오른쪽 끝 dp[${n}][${CAP}] = ${T.result} 하나입니다.`,
  );
}

/** `deep.build` 전제 — 무게가 정수가 아니면 칸 번호가 아니다. */
function buildPremise(): string {
  const inputs: [number[], number[], number][] = [
    [WEIGHTS, VALUES, CAP],
    [[1.5, 1], [3, 2], 2],
    [[1.5], [3], 2],
  ];
  let differ = 0;
  const rows = inputs.map(([ws, vs, c]) => {
    const r = knapsack01(ws, vs, c);
    const want = bestOf(ws, vs, ws.length, c).value;
    if (!Object.is(r, want)) differ++;
    return [`${list(ws)} · ${list(vs)} · ${c}`, String(r), String(want)];
  });
  return withNote(
    md(
      ["무게 · 가치 · 용량", "정본의 답", "조합을 전부 만들어 구한 답"],
      rows,
      [1, 2],
    ),
    `${inputs.length} 입력 가운데 ${differ} 입력에서 정본의 답이 조합을 전부 만들어 구한 답과 다릅니다.`,
  );
}

/** 설계 선택에 쓰는 입력 — `purpose.alt` 의 벤치와 같은 생성식이다. */
function designInput() {
  const n = 50;
  const W = 1000;
  const weights = Array.from({ length: n }, (_, i) => ((i * 17) % 100) + 1);
  return { n, W, weights };
}

/** `deep.build` 설계 선택 — 도달하는 무게 합만 모을 때와 0 … W 를 모두 깔 때의 항목 수. */
function designReachable(): string {
  const { n, W, weights } = designInput();
  const { merged } = layers(weights, W);
  const reach = merged.reduce((a, m) => a + m.length, 0);
  const full = (n + 1) * (W + 1);
  const head = merged.slice(0, 8).map((m) => m.length);
  return table(
    ["담는 방식", "항목 수", "층마다 항목 수"],
    [
      [
        "도달하는 무게 합만",
        comma(reach),
        `${head.join(" ")} … ${merged.at(-1)?.length}`,
      ],
      ["0 … W 를 모두", comma(full), `${n + 1} 층 × ${comma(W + 1)}`],
    ],
    [0, 2],
  ).concat(
    `\n\n항목 수 비율 ${(full / reach).toFixed(2)} 배  (n = ${n}, W = ${comma(W)}, 무게 w[i] = (i·17 mod 100) + 1)`,
  );
}

/* ────────────────────────── 파트 1 — 수행으로 알아보는 알고리즘 ────────────────────────── */

/** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
function walkInput(): string {
  const r = knapsack01(WEIGHTS, VALUES, CAP);
  return [
    `const weights = ${list(WEIGHTS)};`,
    `const values = ${list(VALUES)};`,
    `const W = ${CAP};`,
    `// 이 절이 끝나면 ${r}${이가(r)} 나와야 한다`,
  ].join("\n");
}

/** `deep.walk` 1 — 첫 줄을 깐 직후의 DP 테이블. */
function walkInit(): string {
  const grid = table(
    ["", ...(T.init[0] ?? []).map((_, c) => `c=${c}`)],
    T.init.map((row, i) => [`i=${i}`, ...row.map(String)]),
  )
    .split("\n")
    .map((line, k) => (k >= 2 ? `${line}     ← 아직 안 정한 줄` : line));
  const empty = trace([], [], 10);
  const zero = trace(WEIGHTS, VALUES, 0);
  return [
    ...grid,
    "",
    `weights = [], W = 10  →  ${empty.rows.length} 줄 × ${empty.rows[0]?.length} 칸, 칸을 하나도 안 정하고 dp[0][10] = ${empty.result} 반환`,
    `W = 0                 →  ${zero.rows.length} 줄 × ${zero.rows[0]?.length} 칸, 칸 ${zero.cells.length} 개를 정하고 dp[${WEIGHTS.length}][0] = ${zero.result} 반환`,
  ].join("\n");
}

/** `deep.walk` 2 — 칸을 정하는 차례. */
function walkOrder(): string {
  const lines = WEIGHTS.map((w, k) => {
    const cs = T.cells.filter((x) => x.i === k + 1).map((x) => x.c);
    return `i=${k + 1} (w=${w})   c = ${cs.join(" → ")}`;
  });
  return [
    ...lines,
    "  └ 한 줄을 왼쪽 끝부터 오른쪽 끝까지 다 정한 뒤 다음 줄로 간다",
  ].join("\n");
}

/** `deep.walk` 3 — 담는 쪽 값을 윗 줄에서 읽을 때와 같은 줄에서 읽을 때. */
function walkBranchRead(): string {
  const i = 2;
  const w = WEIGHTS[i - 1] as number;
  const rows: string[][] = [];
  let firstDiff = -1;
  for (let c = w; c <= CAP; c++) {
    const up = dpv(i - 1, c - w);
    const same = dpv(i, c - w);
    if (firstDiff < 0 && up !== same) firstDiff = c;
    rows.push([
      `c = ${c}`,
      `prev[${c - w}] = ${up}`,
      `cur[${c - w}] = ${same}`,
    ]);
  }
  return [
    table([`i=${i} 줄, w = ${w}`, "윗 줄 prev[c-w]", "같은 줄 cur[c-w]"], rows),
    `  └ 두 값이 처음 달라지는 자리는 c = ${firstDiff} 이다. cur[${firstDiff - w}] 에는 이 물건을 이미 담은 값이 들어 있다`,
  ].join("\n");
}

/** 가치 ÷ 무게가 높은 것부터, 들어가면 담는다. 쪼갤 수 있으면 남은 용량에 다음 것을 쪼개 넣는다. */
function byRatio(
  weights: readonly number[],
  values: readonly number[],
  cap: number,
  fractional: boolean,
): { value: number; picked: string[] } {
  const order = weights
    .map((w, k) => ({ k, w, v: values[k] as number }))
    .sort((a, b) => b.v / b.w - a.v / a.w || a.k - b.k);
  let rest = cap;
  let value = 0;
  const picked: string[] = [];
  for (const it of order) {
    if (it.w <= rest) {
      rest -= it.w;
      value += it.v;
      picked.push(`물건 ${it.k + 1}`);
    } else if (fractional && rest > 0) {
      value += (it.v * rest) / it.w;
      picked.push(`물건 ${it.k + 1} 의 ${rest}/${it.w}`);
      rest = 0;
    }
  }
  return { value, picked };
}

/** 소수 둘째 자리에서 끝나면 그대로, 아니면 반올림했다는 표시를 붙인다. */
const frac = (x: number): string =>
  Number.isInteger(Math.round(x * 100 * 1e6) / 1e6)
    ? String(x)
    : `약 ${x.toFixed(2)}`;

/** `deep.walk.pause` — 가치 비율 순서로 담으면 최적이 아니다. */
function greedy(): string {
  const inputs: [string, number[], number[], number][] = [
    ["[3, 4] · [4, 5] · 4", [3, 4], [4, 5], 4],
    [`${list(WEIGHTS)} · ${list(VALUES)} · ${CAP}`, WEIGHTS, VALUES, CAP],
  ];
  const rows = inputs.map(([name, ws, vs, c]) => {
    const g = byRatio(ws, vs, c, false);
    const f = byRatio(ws, vs, c, true);
    const r = knapsack01(ws, vs, c);
    return [
      name,
      `${g.value} (${g.picked.join(" · ")})`,
      String(r),
      `${frac(f.value)} (${f.picked.join(" · ")})`,
    ];
  });
  return table(
    [
      "무게 · 가치 · 용량",
      "비율 순서로 담기",
      "정본",
      "쪼갤 수 있을 때 비율 순서",
    ],
    rows,
    [0, 1, 3],
  );
}

/** `deep.walk` 4 — 서른네 걸음. */
function walkTrace(): string {
  const steps = walkSteps();
  const rows: string[][] = [];
  rows.push([
    steps[0]?.id ?? "",
    "i=0 줄",
    "—",
    "첫 줄 → 0 으로 깐다",
    "—",
    show(T.init[0] ?? []),
  ]);
  T.cells.forEach((c, k) => {
    const truth = c.branch === "cant" ? "**참**" : "**거짓**";
    const cmp =
      c.take === null
        ? ""
        : ` · \`${c.skip} >= ${c.take}\` ${c.branch === "skip" ? "**참**" : "**거짓**"}`;
    rows.push([
      steps[k + 1]?.id ?? "",
      `dp[${c.i}][${c.c}]`,
      String(c.w),
      `\`${c.c} < ${c.w}\` ${truth}${cmp} → ${BRANCH_MARK[c.branch]}`,
      c.take === null ? String(c.skip) : `${c.skip} · ${c.take}`,
      String(c.value),
    ]);
  });
  const n = WEIGHTS.length;
  rows.push([
    steps.at(-1)?.id ?? "",
    `dp[${n}][${CAP}]`,
    "—",
    "읽기",
    "—",
    String(T.result),
  ]);
  const count = (b: string) => T.cells.filter((c) => c.branch === b).length;
  return withNote(
    md(
      ["단계", "칸", "w", "조건 판정", "두고 감 · 담음", "정한 값"],
      rows,
      [2, 5],
    ),
    `① 이 ${count("cant")} 칸, ② 가 ${count("skip")} 칸, ③ 이 ${count("take")} 칸이고, 반환값은 ${T.result} 입니다.`,
  );
}

/** `deep.walk.pause` — 한 줄로 줄일 때 채우는 방향. */
function oneRowDir(): string {
  return table(
    [
      "용량",
      "작은 용량부터",
      "큰 용량부터",
      "DP 테이블",
      "여러 번 담을 수 있을 때의 최선",
    ],
    [CAP, CAP_WIDE, CAP_WIDE + 1].map((c) => {
      const up = oneRow(WEIGHTS, VALUES, c, "up").best[c] as number;
      const down = oneRow(WEIGHTS, VALUES, c, "down").best[c] as number;
      const r = knapsack01(WEIGHTS, VALUES, c);
      const many = unboundedBest(WEIGHTS, VALUES, c).value;
      return [String(c), String(up), String(down), String(r), String(many)];
    }),
  );
}

/** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
function finalRun(): string {
  const 목록: [string, number[], number[], number][] = [
    [
      `knapsack01(${list(WEIGHTS)}, ${list(VALUES)}, ${CAP})`,
      WEIGHTS,
      VALUES,
      CAP,
    ],
    ["knapsack01([3, 4], [4, 5], 4)", [3, 4], [4, 5], 4],
    ["knapsack01([1, 2, 3], [10, 20, 30], 10)", [1, 2, 3], [10, 20, 30], 10],
    ["knapsack01([], [], 10)", [], [], 10],
    ["knapsack01([5], [42], 5)", [5], [42], 5],
    ["knapsack01([10], [100], 5)", [10], [100], 5],
  ];
  const 폭 = Math.max(...목록.map(([s]) => s.length));
  return 목록
    .map(
      ([s, ws, vs, c]) =>
        `${pad(s, 폭)}  →  ${padL(comma(knapsack01(ws, vs, c)), 2)}`,
    )
    .join("\n");
}

/** `related` — 같은 상태로 온 두 조합은 앞으로 할 수 있는 일이 같다. */
function relatedMarkov(): string {
  const W = CAP_WIDE;
  const i = 3;
  const rest = WEIGHTS.slice(i);
  const restV = VALUES.slice(i);
  const sets = subsets(i).filter((ks) => sumOf(WEIGHTS, ks) === 4);
  const rows = sets.map((ks) => {
    const used = sumOf(WEIGHTS, ks);
    const more = knapsack01(rest, restV, W - used);
    return [
      setName(ks),
      String(used),
      String(sumOf(VALUES, ks)),
      `(i=${i}, 남은 용량 ${W - used})`,
      String(more),
    ];
  });
  return withNote(
    md(
      ["조합", "쓴 무게", "가치 합", "상태", "남은 물건으로 더 얻는 최대 가치"],
      rows,
      [1, 2, 4],
    ),
    `용량 ${W} 에서 물건 1~${i}${으로(String(i))} 무게 4 를 쓴 조합이 ${sets.length} 가지이고, 둘 다 같은 상태에서 남은 물건 ${list(rest)} 로 더 얻는 최대 가치가 ${rows[0]?.[4]} 입니다.`,
  );
}

/* ────────────────────────── 파트 2 ────────────────────────── */

/** 두 축의 DP 테이블 칸 수 — `.alt.ts` 와 같은 셈(가치 축은 마지막에 한 줄을 더 읽는다). */
function axisCells(ws: readonly number[], vs: readonly number[], W: number) {
  const n = ws.length;
  const total = vs.reduce((a, b) => a + b, 0);
  return {
    weight: (n + 1) * (W + 1),
    value: (n + 1) * (total + 1) + (total + 1),
  };
}

/** `purpose.alt` — 전개 입력에서 두 축의 칸 수. */
function altSmall(): string {
  const a = axisCells(WEIGHTS, VALUES, CAP);
  return table(
    ["입력", "무게 축 DP 테이블 칸", "가치 축 DP 테이블 칸"],
    [
      [
        `${list(WEIGHTS)} · ${list(VALUES)} · ${CAP}`,
        comma(a.weight),
        comma(a.value),
      ],
    ],
  ).concat(`\n\n가치 축이 ${(a.value / a.weight).toFixed(1)} 배`);
}

/** `purpose.alt` — `.alt.ts` 의 벤치를 그대로 실행한다. */
function altBench(): string {
  const got = Object.entries(altCases).map(([name, run]) => {
    const r = run() as Record<string, number>;
    return [name, r["DP 테이블 칸"] as number] as const;
  });
  const [mine, other] = got;
  if (!mine || !other) throw new Error("벤치 대상이 둘이 아니다");
  return withNote(
    md(
      ["설계", "DP 테이블 칸"],
      got.map(([name, v], k) =>
        k === 0 ? [`**${name}**`, `**${comma(v)}**`] : [name, comma(v)],
      ),
      [1],
    ),
    `무게 축의 DP 테이블 칸이 가치 축의 1 / ${(other[1] / mine[1]).toFixed(1)} 입니다.`,
  );
}

/** `deep.math` ② — 정의를 작은 값에 넣은 검산. */
function mathCheck(): string {
  const i = 2;
  const c = 4;
  const ws = WEIGHTS.slice(0, i);
  const vs = VALUES.slice(0, i);
  const best = bestOf(WEIGHTS, VALUES, i, c);
  const lines = subsets(i).map((ks) => {
    const w = sumOf(WEIGHTS, ks);
    const ok = w <= c;
    const mark = ok && ks.join() === best.set.join() ? "      ← 가장 크다" : "";
    return `  S = ${pad(setName(ks), 7)} Σw = ${w} ${ok ? "≤" : ">"} ${c}   Σv = ${sumOf(VALUES, ks)}${mark}`;
  });
  return [
    `S ⊆ {1, 2},  Σw ≤ ${c}        w = ${list(ws)},  v = ${list(vs)}`,
    "",
    ...lines,
    `                                dp[${i}][${c}] = ${dpv(i, c)}`,
  ].join("\n");
}

/** `deep.math` — 식을 옮긴 코드와 그 값. */
function mathCode(): string {
  const dp = T.rows;
  const cell = (i: number, c: number): number => {
    const w = WEIGHTS[i - 1] as number;
    const v = VALUES[i - 1] as number;
    const prev = dp[i - 1] as readonly number[];
    return c < w
      ? (prev[c] as number)
      : Math.max(prev[c] as number, (prev[c - w] as number) + v);
  };
  const i = 3;
  const got = cell(i, CAP);
  if (got !== dpv(i, CAP)) throw new Error("식이 정본의 칸과 다른 값을 낸다");
  const w = WEIGHTS[i - 1] as number;
  const v = VALUES[i - 1] as number;
  return [
    "const cell = (i: number, c: number): number => {",
    "  const w = weights[i - 1] as number;",
    "  const v = values[i - 1] as number;",
    "  const prev = dp[i - 1] as number[];",
    "  return c < w",
    "    ? (prev[c] as number)",
    "    : Math.max(prev[c] as number, (prev[c - w] as number) + v);",
    "};",
    "",
    `cell(${i}, ${CAP}); // → max(dp[${i - 1}][${CAP}], dp[${i - 1}][${CAP - w}] + ${v}) = max(${dpv(i - 1, CAP)}, ${dpv(i - 1, CAP - w) + v}) = ${got}`,
  ].join("\n");
}

/** `deep.math` ④ — 칸 수와 조합의 수. */
function cellsVsSubsets(): string {
  return table(
    ["n", "W", "칸 수 (n+1)(W+1)", "조합 2^n"],
    [
      [WEIGHTS.length, CAP],
      [20, W_MAX],
      [N_MAX, W_MAX],
    ].map(([n, W]) => {
      const all = 2 ** (n as number);
      return [
        String(n),
        comma(W as number),
        comma(((n as number) + 1) * ((W as number) + 1)),
        all < 1e7 ? comma(all) : sci(all),
      ];
    }),
  );
}

/** `invariant` ② — 모든 칸을 정의대로 구한 값과 맞댄다. */
function invariantCells(): string {
  let checked = 0;
  let bad = 0;
  const rows = T.rows.map((row, i) => {
    const def = row.map((_, c) => bestOf(WEIGHTS, VALUES, i, c).value);
    let miss = 0;
    row.forEach((x, c) => {
      checked++;
      if (x !== def[c]) miss++;
    });
    bad += miss;
    return [`i=${i}`, show(row), show(def), String(miss)];
  });
  return withNote(
    md(
      ["줄", "DP 테이블의 값", "정의대로 직접 구한 값", "어긋난 칸"],
      rows,
      [3],
    ),
    `정의대로 직접 구한 값과 DP 테이블의 값을 ${checked} 칸에서 대조했고, 어긋난 칸은 ${bad} 개입니다.`,
  );
}

/** `invariant` ② — 경계에 있는 입력. */
function invariantEdges(): string {
  const cases: [string, number[], number[], number][] = [
    ["weights=[], W=10", [], [], 10],
    ["[1, 2, 3] · [10, 20, 30] · W=0", [1, 2, 3], [10, 20, 30], 0],
    ["[10, 20, 30] · [100, 200, 300] · W=5", [10, 20, 30], [100, 200, 300], 5],
    ["[5] · [42] · W=5", [5], [42], 5],
    [
      `무게 1 · 가치 7 인 물건 ${N_MAX} 개 · W=${comma(W_MAX)}`,
      new Array<number>(N_MAX).fill(1),
      new Array<number>(N_MAX).fill(7),
      W_MAX,
    ],
  ];
  const rows = cases.map(([name, ws, vs, c]) => {
    const t = trace(ws, vs, c);
    const count = (b: string) =>
      comma(t.cells.filter((x) => x.branch === b).length);
    return [
      `\`${name}\``,
      `${comma(t.rows.length)} × ${comma(t.rows[0]?.length ?? 0)}`,
      count("cant"),
      count("skip"),
      count("take"),
      comma(t.result),
    ];
  });
  return withNote(
    md(
      ["입력", "줄 × 칸", "못 담은 칸", "두고 간 칸", "담은 칸", "반환"],
      rows,
      [2, 3, 4, 5],
    ),
    `${cases.length} 입력 모두 칸을 세 갈래 가운데 하나로만 정했습니다.`,
  );
}

/** `invariant` ③ — 같은 줄에서 읽은 변이의 값. */
function mutantCur(): string {
  return table(
    ["입력", "바른 코드", "같은 줄에서 읽은 코드", "판정"],
    같은줄표.map(([이름, ws, vs, c]) => {
      const a = knapsack01(ws, vs, c);
      const b = 같은줄에서읽기.knapsack01(ws, vs, c);
      return [이름, String(a), String(b), a === b ? "같다" : "어긋난다"];
    }),
  );
}

/** `invariant` ③ — 그 변이가 낸 값은 한 물건을 두 번 담은 값이다. */
function mutantCurItems(): string {
  const c = CAP_WIDE;
  const got = 같은줄에서읽기.knapsack01(WEIGHTS, VALUES, c);
  const up = unboundedBest(WEIGHTS, VALUES, c);
  const best = bestOf(WEIGHTS, VALUES, WEIGHTS.length, c);
  const picked = up.counts.flatMap((m, k) =>
    Array.from({ length: m }, () => k),
  );
  const rows = [
    [
      "바른 코드",
      String(best.value),
      best.set.map((k) => `물건 ${k + 1}`).join(" · "),
      `${best.set.map((k) => WEIGHTS[k]).join("+")}=${sumOf(WEIGHTS, best.set)}`,
    ],
  ];
  // 중화 실행에서는 변이가 정본과 같아 「두 번 담았다」 줄이 없다.
  if (got === up.value && got !== best.value) {
    rows.push([
      "같은 줄에서 읽은 코드",
      String(got),
      countsText(up.counts),
      `${picked.map((k) => WEIGHTS[k]).join("+")}=${sumOf(WEIGHTS, picked)}`,
    ]);
  } else {
    rows.push(["같은 줄에서 읽은 코드", String(got), "—", "—"]);
  }
  return table(["코드", "답", "고른 것", "무게 합"], rows, [0, 2, 3]);
}

/** `perf.derive` — 걸음이 센 칸. */
function perfDerive(): string {
  const steps = walkSteps();
  const count = (b: string) => T.cells.filter((c) => c.branch === b).length;
  const n = WEIGHTS.length;
  return [
    `${pad(steps[0]?.id ?? "", 8)} DP 테이블 ${n + 1} × ${CAP + 1} 칸을 0 으로 깐다`,
    `${pad(`${steps[1]?.id}~${steps.at(-2)?.id}`, 8)} 칸 ${T.cells.length} 개를 한 걸음에 한 칸씩 — ① ${count("cant")} 칸 · ② ${count("skip")} 칸 · ③ ${count("take")} 칸`,
    `${pad(steps.at(-1)?.id ?? "", 8)} dp[${n}][${CAP}] 한 칸을 읽는다`,
    "         └ 칸마다 비교 1 번, ②·③ 이면 덧셈 1 번과 비교 1 번이 더",
  ].join("\n");
}

/** `perf.derive` · `perf.worst` — 칸 수와 메모리. 칸 하나를 8 바이트 수로 잡는다. */
function perfMemory(): string {
  const mb = (bytes: number) => bytes / 1e6;
  return table(
    ["n", "W", "칸 (n+1)(W+1)", "칸마다 8 바이트"],
    [
      [N_MAX, W_MAX],
      [N_MAX, 1e9],
    ].map(([n, W]) => {
      const cells = ((n as number) + 1) * ((W as number) + 1);
      const m = mb(cells * 8);
      return [
        String(n),
        (W as number) >= 1e9 ? "10^9" : comma(W as number),
        comma(cells),
        m >= 1000
          ? `약 ${comma(Math.round(m / 1000))} GB`
          : `약 ${m.toFixed(1)} MB`,
      ];
    }),
  );
}

/** `perf.worst` — 물건 값과 무관한 칸 수. */
function perfWorst(): string {
  const cases: [string, number[], number[]][] = [
    [
      `무게·가치가 모두 1`,
      new Array<number>(N_MAX).fill(1),
      new Array<number>(N_MAX).fill(1),
    ],
    [
      `무게·가치가 모두 ${comma(W_MAX)}`,
      new Array<number>(N_MAX).fill(W_MAX),
      new Array<number>(N_MAX).fill(W_MAX),
    ],
  ];
  const counts = cases.map(([, ws, vs]) => {
    const t = trace(ws, vs, W_MAX);
    const count = (b: string) => t.cells.filter((x) => x.branch === b).length;
    return {
      cells: t.cells.length,
      cant: count("cant"),
      skip: count("skip"),
      take: count("take"),
      result: t.result,
    };
  });
  const rows = cases.map(([name], k) => {
    const c = counts[k] as (typeof counts)[number];
    return [
      name,
      comma(c.cells),
      comma(c.cant),
      comma(c.skip),
      comma(c.take),
      comma(c.result),
    ];
  });
  const cells = counts[0]?.cells ?? 0;
  return withNote(
    md(
      [
        `물건 ${N_MAX} 개 · W=${comma(W_MAX)}`,
        "정한 칸",
        "못 담은 칸",
        "두고 간 칸",
        "담은 칸",
        "반환",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    `두 입력 모두 정한 칸이 ${comma(cells)} 개이고, 첫 줄 ${comma(W_MAX + 1)} 칸을 더하면 ${comma(cells + W_MAX + 1)} 칸입니다.`,
  );
}

/** `selfcheck` — 물음. */
function selfcheckQ(): string {
  const c = cellAt(3, 4);
  return md(
    ["비교", "고르는 쪽", "dp[3][4]"],
    [
      ["`skip >= take`", `두고 간다 (skip = ${c.skip})`, String(c.value)],
      ["`skip > take`", "?", "?"],
    ],
    [2],
  );
}

/** `selfcheck` — 답. 동점에 담는 쪽을 고르는 사본을 여러 입력에 걸어 본다. */
function selfcheckA(): string {
  const inputs: [string, number[], number[], number][] = [
    [`${list(WEIGHTS)} · ${list(VALUES)} · ${CAP}`, WEIGHTS, VALUES, CAP],
    [
      `${list(WEIGHTS)} · ${list(VALUES)} · ${CAP_WIDE}`,
      WEIGHTS,
      VALUES,
      CAP_WIDE,
    ],
    ["[3, 3, 3] · [1, 5, 3] · 3", [3, 3, 3], [1, 5, 3], 3],
    ["[2, 2, 4] · [3, 3, 6] · 4", [2, 2, 4], [3, 3, 6], 4],
  ];
  return table(
    ["입력", "skip >= take", "skip > take"],
    inputs.map(([name, ws, vs, c]) => [
      name,
      String(knapsack01(ws, vs, c)),
      String(동점에담기.knapsack01(ws, vs, c)),
    ]),
  );
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 물건 넷과 최선의 조합. */
  "concept-items": conceptItems,
  /** `concept` — 칸 수. */
  "concept-size": conceptSize,
  /** `deep.origin` ② — 조합의 수와 걸리는 시간. */
  "brute-count": bruteCount,
  /** `deep.origin` ③ — 앞부분이 같은 조합. */
  "origin-repeat": originRepeat,
  /** `deep.origin` ④ — 물건 넷에서 두 방식의 항목 수. */
  "origin-merge-4": originMerge4,
  /** `deep.origin` ④ — 물건 여덟에서 두 방식의 항목 수. */
  "origin-merge-8": originMerge8,
  /** `deep.origin` ⑤ — 무게 합만 기억한 방식의 값. */
  "one-weight": oneWeight,
  /** `deep.origin` ⑤ — 두 방식이 고른 것. */
  "one-weight-why": oneWeightWhy,
  /** `deep.build` 1단계 — DP 테이블의 크기. */
  "build-size": buildSize,
  /** `deep.build` 1단계 — dp[2][4] 를 이름에서 조합까지. */
  "build-read-one": buildReadOne,
  /** `deep.build` 1단계 — 「c 이하」 의 뜻. */
  "build-at-most": buildAtMost,
  /** `deep.build` 2단계 — i=3 줄을 채우며 읽은 칸. */
  "build-fill-row": buildFillRow,
  /** `deep.build` 3단계 — 마지막 줄의 칸이 용량마다의 답이다. */
  "build-answer": buildAnswer,
  /** `deep.build` 전제 — 무게가 정수가 아닌 입력. */
  "build-premise": buildPremise,
  /** `deep.build` 설계 선택 — 도달하는 무게 합만 모을 때. */
  "design-reachable": designReachable,
  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 첫 줄을 깐 직후의 DP 테이블. */
  "walk-init": walkInit,
  /** `deep.walk` 2 — 칸을 정하는 차례. */
  "walk-order": walkOrder,
  /** `deep.walk` 3 — 윗 줄과 같은 줄에서 읽는 값. */
  "walk-branch-read": walkBranchRead,
  /** `deep.walk.pause` — 비율 순서로 담기. */
  greedy,
  /** `deep.walk` 4 — 서른네 걸음. */
  "walk-trace": walkTrace,
  /** `deep.walk.pause` — 한 줄로 줄일 때 채우는 방향. */
  "one-row-dir": oneRowDir,
  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": finalRun,
  /** `related` — 같은 상태로 온 두 조합. */
  "related-markov": relatedMarkov,
  /** `purpose.alt` — 전개 입력에서 두 축의 칸 수. */
  "alt-small": altSmall,
  /** `purpose.alt` — 벤치 입력에서 두 축의 칸 수. */
  "alt-bench": altBench,
  /** `deep.math` ② — 정의를 작은 값에 넣은 검산. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드와 그 값. */
  "math-code": mathCode,
  /** `deep.math` ④ — 칸 수와 조합의 수. */
  "cells-vs-subsets": cellsVsSubsets,
  /** `invariant` ② — 모든 칸을 정의대로 구한 값과 맞댄다. */
  "invariant-cells": invariantCells,
  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 같은 줄에서 읽은 변이의 값. */
  "mutant-cur": mutantCur,
  /** `invariant` ③ — 그 변이가 고른 것. */
  "mutant-cur-items": mutantCurItems,
  /** `perf.derive` — 걸음이 센 칸. */
  "perf-derive": perfDerive,
  /** `perf.derive` · `perf.worst` — 칸 수와 메모리. */
  "perf-memory": perfMemory,
  /** `perf.worst` — 물건 값과 무관한 칸 수. */
  "perf-worst": perfWorst,
  /** `selfcheck` — 물음. */
  "selfcheck-q": selfcheckQ,
  /** `selfcheck` — 답. */
  "selfcheck-a": selfcheckA,
};
