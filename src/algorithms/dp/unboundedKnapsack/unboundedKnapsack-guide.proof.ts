/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 칸 하나를 정한 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/unboundedKnapsack/unboundedKnapsack-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as benchCases } from "./unboundedKnapsack-guide.alt.ts";
import {
  A_MAX,
  AMOUNT,
  aboveRowTable,
  amountOuter,
  big,
  type Cell,
  COINS,
  callsByRecurrence,
  comma,
  fmt,
  N_MAX,
  naiveCalls,
  oneRowAnswer,
  show,
  trace,
  walkSteps,
} from "./unboundedKnapsack-guide.fig.tsx";
import { unboundedKnapsack } from "./unboundedKnapsack-guide.ref.ts";

const REF = new URL("./unboundedKnapsack-guide.ref.ts", import.meta.url)
  .pathname;

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
function md(head: string[], rows: string[][], right: number[] = []): string {
  const sep = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(sep), ...rows.map(line)].join("\n");
}

/** 표 아래 문장까지 한 블록으로 — 닫는 마커는 본문에 있다. */
const withNote = (body: string, note: string): string => `${body}\n\n${note}`;

/** 액면가를 그대로 적는다 — `[3, 4, 1] / 6` 꼴. */
const label = (coins: readonly number[], amount: number): string =>
  `[${coins.join(", ")}] / ${amount}`;

const cellName = (i: number, a: number): string => `dp[${i}][${a}]`;

/* ────────────────────────── 정의대로 직접 세기 ────────────────────────── */

/** 앞의 `i` 종류로 금액 `a` 를 만드는 개수 목록 전부 — 정본을 거치지 않고 정의에서 바로 만든다. */
function vectors(coins: readonly number[], a: number): number[][] {
  const out: number[][] = [];
  const go = (j: number, rest: number, acc: number[]): void => {
    if (j === coins.length) {
      if (rest === 0) out.push([...acc]);
      return;
    }
    const c = coins[j] as number;
    for (let k = 0; k * c <= rest; k++) go(j + 1, rest - k * c, [...acc, k]);
  };
  go(0, a, []);
  return out;
}

const countOf = (v: readonly number[]): number => v.reduce((s, k) => s + k, 0);

/** 개수 목록을 동전 나열로 — 큰 액면가부터 적는다. `(1, 0, 3)` → `3 + 1 + 1 + 1`. */
function combo(coins: readonly number[], v: readonly number[]): string {
  const parts: number[] = [];
  const order = coins
    .map((c, j) => [c, j] as const)
    .sort((x, y) => y[0] - x[0]);
  for (const [c, j] of order) {
    for (let k = 0; k < (v[j] as number); k++) parts.push(c);
  }
  return parts.length === 0 ? "빈 조합" : parts.join(" + ");
}

/** 정의대로 센 최소 개수 — 목록이 없으면 ∞. */
function minByDefinition(coins: readonly number[], a: number): number {
  const vs = vectors(coins, a);
  return vs.length === 0
    ? Number.POSITIVE_INFINITY
    : Math.min(...vs.map(countOf));
}

/* ────────────────────────── 계측판 ────────────────────────── */

/** 금액마다 재귀가 그 금액을 몇 번 다시 푸는가. */
function solvedPerAmount(coins: readonly number[], amount: number): number[] {
  const hit = new Array<number>(amount + 1).fill(0);
  const solve = (rest: number): number => {
    if (rest >= 0) hit[rest] = (hit[rest] as number) + 1;
    if (rest === 0) return 0;
    if (rest < 0) return Number.POSITIVE_INFINITY;
    let best = Number.POSITIVE_INFINITY;
    for (const c of coins) {
      const sub = solve(rest - c);
      if (sub + 1 < best) best = sub + 1;
    }
    return best;
  };
  solve(amount);
  return hit;
}

/** 큰 액면가부터 최대한 많이 집는다. */
function greedy(coins: readonly number[], amount: number): number {
  const sorted = [...coins].sort((a, b) => b - a);
  let rest = amount;
  let count = 0;
  for (const c of sorted) {
    const k = Math.floor(rest / c);
    count += k;
    rest -= k * c;
  }
  return rest === 0 ? count : -1;
}

/** 못 만드는 칸을 `Infinity` 대신 `-1` 로 두고 같은 절차를 돌린 판. */
function minusOneCell(coins: readonly number[], amount: number): number {
  const n = coins.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(amount + 1).fill(-1),
  );
  (dp[0] as number[])[0] = 0;
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let a = 0; a <= amount; a++) {
      if (a < c) cur[a] = prev[a] as number;
      else {
        const skip = prev[a] as number;
        const take = (cur[a - c] as number) + 1;
        cur[a] = skip <= take ? skip : take;
      }
    }
  }
  return (dp[n] as number[])[amount] as number;
}

/**
 * 값을 정한 칸 수 — 정본과 같은 순서로 액면가마다 한 줄을 채우되, `skipSmall` 이면 `a < c` 인 칸을
 * 아예 건너뛴다. 칸을 세는 것만 하는 가벼운 판이라 큰 입력에서도 기록을 남기지 않는다.
 */
function decidedCells(
  coins: readonly number[],
  amount: number,
  skipSmall: boolean,
): number {
  let cells = amount + 1;
  for (const c of coins) {
    const from = skipSmall ? Math.min(c, amount + 1) : 0;
    cells += amount + 1 - from;
  }
  return cells;
}

/** 칸마다 어느 갈래로 정했는지 센다. */
function branchCount(cells: readonly Cell[]): Record<Cell["branch"], number> {
  const out = { copy: 0, skip: 0, take: 0 };
  for (const c of cells) out[c.branch]++;
  return out;
}

const repeat = (v: number, n: number): number[] => new Array(n).fill(v);
const upTo = (k: number): number[] =>
  Array.from({ length: k }, (_, i) => i + 1);

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식의 「최소 **동전 개수**」를 지키던 줄 — 읽어 온 값에 1 을 더하는 자리 — 에서 그 `+ 1` 을
 * 지운 사본. 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 개수를안더하기 = await loadMutant<{
  unboundedKnapsack(coins: number[], amount: number): number;
}>(REF, {
  swap: [/\(cur\[a - c\] as number\) \+ 1/, "(cur[a - c] as number)"],
});

/**
 * 중화 실행 — `check-proof` 가 변이를 끈 채 이 파일을 한 번 더 부를 때 `loadMutant` 는 정본을 그대로
 * 돌려준다. 그때 「변이가 답을 안 바꿨다」 검사가 터지면 그 블록의 대조가 한 번도 안 돈다. 중화
 * 여부를 값에서 알아내 그 검사만 건너뛴다.
 */
const 중화 = 개수를안더하기.unboundedKnapsack === unboundedKnapsack;

const 변이표: [number[], number][] = [
  [COINS, 6],
  [COINS, 5],
  [[1, 2, 5], 11],
  [[3], 9],
  [COINS, 0],
  [[5, 10], 3],
];

if (
  !중화 &&
  변이표.every(
    ([coins, amount]) =>
      unboundedKnapsack(coins, amount) ===
      개수를안더하기.unboundedKnapsack(coins, amount),
  )
) {
  throw new Error(
    "1 을 안 더하는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

// 이 변이가 「만들 수 있는가」는 그대로 답한다는 것이 본문의 주장이다. 실행이 그것을 잰다.
for (const [coins, amount] of [
  [COINS, 6],
  [COINS, 0],
  [[1, 2, 5], 11],
  [[3], 9],
  [[3], 10],
  [[5, 10], 3],
  [[2], 3],
] as [number[], number][]) {
  const 정본 = unboundedKnapsack(coins, amount) >= 0;
  const 변이 = 개수를안더하기.unboundedKnapsack(coins, amount) >= 0;
  if (정본 !== 변이) {
    throw new Error(
      `1 을 안 더하는 변이가 도달 가능성까지 바꿨다 — [${coins}] / ${amount}`,
    );
  }
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

const walk = () => trace(COINS, AMOUNT);
const n = COINS.length;

/* ────────────────────────── 경쟁 설계 ────────────────────────── */

/** `.alt.ts` 의 계수 하나. */
function bench(name: string, key: string): number {
  const run = benchCases[name];
  if (!run) throw new Error(`벤치 케이스 ${name} 가 없다`);
  const v = (run() as Record<string, number>)[key];
  if (v === undefined) throw new Error(`계수 ${name} · ${key} 가 없다`);
  return v;
}

/** 두 계수의 비 — 100 이상이면 정수, 아래면 소수 한 자리. */
function ratio(a: number, b: number): string {
  const r = a / b;
  return r >= 100 ? Math.round(r).toLocaleString("en-US") : r.toFixed(1);
}

/** `purpose.alt` — 입력 A · B 에서 기본 연산의 비. */
function altRatio(): string {
  const dpA = bench("DP 테이블 (이 가이드) · 입력 A", "기본 연산");
  const bbA = bench("분기 한정 · 입력 A", "기본 연산");
  const dpB = bench("DP 테이블 (이 가이드) · 입력 B", "기본 연산");
  const bbB = bench("분기 한정 · 입력 B", "기본 연산");
  return [
    `**금액 하나로 순서가 뒤집힙니다.** A 에서는 분기 한정이 기본 연산으로 ${ratio(dpA, bbA)} 배 적어요 — 6 을 1,666 개 쓰는 답을 곧바로`,
    `찾고, 그 뒤로는 가지치기가 거의 모든 가지를 잘라 냅니다. B 에서는 반대로 DP 테이블이 ${ratio(bbB, dpB)} 배 적습니다 — 답이 없어`,
    "`best` 가 끝까지 무한이고, 그러면 자를 기준이 없어 개수 조합을 전부 봅니다.",
  ].join("\n");
}

/** `purpose.alt` — 경계 금액 1,000 · 999 에서 기본 연산의 비. */
function altEdgeRatio(): string {
  const dp1 = bench("DP 테이블 (이 가이드) · 경계 금액 1,000", "기본 연산");
  const bb1 = bench("분기 한정 · 경계 금액 1,000", "기본 연산");
  const dp0 = bench("DP 테이블 (이 가이드) · 경계 금액 999", "기본 연산");
  const bb0 = bench("분기 한정 · 경계 금액 999", "기본 연산");
  return [
    "**경계는 「답이 있는가」입니다.** 더 정확히는 가지치기가 기댈 첫 답을 언제 찾는가이고, 답이 아예 없으면 그 시점이",
    `오지 않아요. 금액이 1 다를 뿐인데 한쪽은 ${ratio(dp1, bb1)} 배 앞서고 다른 쪽은 ${ratio(bb0, dp0)} 배 뒤집힙니다.`,
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `purpose.alt` — 입력 A · B 의 비. */
  "alt-ratio": altRatio,
  /** `purpose.alt` — 경계 금액의 비. */
  "alt-edge-ratio": altEdgeRatio,
  /** `concept` — 전개 입력으로 만드는 조합 전부. */
  "concept-combos": () => {
    const vs = vectors(COINS, AMOUNT).sort((x, y) => countOf(x) - countOf(y));
    const best = Math.min(...vs.map(countOf));
    const bestCombo = combo(COINS, vs.find((v) => countOf(v) === best) ?? []);
    const got = unboundedKnapsack(COINS, AMOUNT);
    if (got !== best) throw new Error("정의대로 센 최소와 정본이 다르다");
    return withNote(
      md(
        ["조합", ...COINS.map((c) => `${c} 의 개수`), "동전 개수"],
        vs.map((v) => [combo(COINS, v), ...v.map(String), String(countOf(v))]),
        [1, 2, 3, 4],
      ),
      `조합은 ${vs.length} 가지이고 동전 개수가 가장 적은 것은 ${bestCombo} 의 ${best} 개입니다. 정본 unboundedKnapsack([${COINS.join(", ")}], ${AMOUNT}) 이 낸 값도 ${got} 입니다.`,
    );
  },

  /** `concept` — DP 테이블의 칸 수. */
  "concept-size": () =>
    table(
      ["액면가 종류 n", "금액 A", "칸 (n+1)(A+1)"],
      [
        [String(n), String(AMOUNT), comma((n + 1) * (AMOUNT + 1))],
        [comma(N_MAX), comma(A_MAX), comma((N_MAX + 1) * (A_MAX + 1))],
      ],
    ),

  /** `deep.origin` ② — 아무것도 기억하지 않는 재귀가 어디서 끊기는가. */
  "origin-naive-calls": () => {
    const rows = [6, 10, 15, 20, 25, 30].map((a) => [
      comma(a),
      comma(naiveCalls(COINS, a)),
      big(callsByRecurrence(COINS, a)),
      comma((n + 1) * (a + 1)),
    ]);
    rows.push([
      comma(A_MAX),
      "세지 못했다",
      big(callsByRecurrence(COINS, A_MAX)),
      comma((n + 1) * (A_MAX + 1)),
    ]);
    return table(
      [
        "금액",
        "실제로 세어 본 호출",
        "점화식이 내는 호출 수",
        "DP 테이블 칸 수",
      ],
      rows,
    );
  },

  /** `deep.origin` ③④ — 같은 금액을 몇 번씩 다시 푸는가. */
  "origin-solved-again": () => {
    const hit = solvedPerAmount(COINS, 12);
    const rows = hit.map((k, a) => [comma(a), comma(k), "1"]).reverse();
    rows.push([
      "합계",
      comma(hit.reduce((s, v) => s + v, 0)),
      comma(hit.length),
    ]);
    return table(
      ["금액", "재귀가 그 금액을 푼 횟수", "금액마다 한 번만 정하면"],
      rows,
    );
  },

  /** `deep.origin` ⑤ — 금액을 큰 쪽부터 정하면 읽는 칸이 아직 안 정해져 있다. */
  "origin-fill-order": () =>
    table(
      ["입력", "정본", "금액 작은 쪽부터", "금액 큰 쪽부터"],
      (
        [
          [COINS, 6],
          [COINS, 11],
          [[1, 2, 5], 11],
          [[2], 6],
          [[1], 5],
          [[3, 4], 5],
        ] as [number[], number][]
      ).map(([coins, amount]) => [
        label(coins, amount),
        show(unboundedKnapsack(coins, amount)),
        show(amountOuter(coins, amount, true)),
        show(amountOuter(coins, amount, false)),
      ]),
    ),

  /** `deep.build` 개념 — 마지막 줄의 칸마다 가장 적은 조합. */
  "build-cell-meaning": () => {
    const last = walk().rows[n] as readonly number[];
    let same = 0;
    const rows = last.map((v, a) => {
      const vs = vectors(COINS, a);
      const best = minByDefinition(COINS, a);
      if (best === v) same++;
      const picks = vs.filter((x) => countOf(x) === best);
      return [
        String(a),
        fmt(v),
        picks.map((x) => combo(COINS, x)).join(" · ") || "없음",
      ];
    });
    return withNote(
      md(["금액 a", `dp[${n}][a]`, "동전 개수가 가장 적은 조합"], rows, [0, 1]),
      `칸에 적힌 수와 가장 적은 조합의 동전 개수가 ${last.length} 칸 가운데 ${same} 칸에서 같습니다.`,
    );
  },

  /** `deep.build` 개념 — 칸 하나(와 ∞ 칸 하나)를 정의대로 읽는다. */
  "build-read-one": () => {
    const coins = COINS.slice(0, 2);
    const t = walk();
    const rows: string[][] = [];
    const note: string[] = [];
    for (const a of [AMOUNT, 5]) {
      const vs = vectors(coins, a);
      const v = t.rows[2]?.[a] as number;
      if (vs.length === 0) {
        rows.push([cellName(2, a), "—", "—", "없음", "—"]);
        note.push(
          `금액 ${a}${을를(a)} 만드는 조합은 없고 ${cellName(2, a)} = ${fmt(v)} 입니다.`,
        );
        continue;
      }
      for (const x of vs) {
        rows.push([
          cellName(2, a),
          String(x[0]),
          String(x[1]),
          combo(coins, x),
          String(countOf(x)),
        ]);
      }
      note.push(
        `액면가 ${coins.join(" · ")}${으로(coins.at(-1) as number)} 금액 ${a}${을를(a)} 만드는 조합은 ${vs.length} 가지이고 ${cellName(2, a)} = ${fmt(v)} 입니다.`,
      );
    }
    return withNote(
      md(
        [
          "칸",
          `${coins[0]} 의 개수`,
          `${coins[1]} 의 개수`,
          "조합",
          "동전 개수",
        ],
        rows,
        [1, 2, 4],
      ),
      note.join(" "),
    );
  },

  /** `deep.build` 개념 — 칸 하나의 조합을 「새 액면가를 썼는가」로 가른다. */
  "build-neighbor-split": () => {
    const c = COINS[n - 1] as number;
    const t = walk();
    const vs = vectors(COINS, AMOUNT).sort((x, y) => countOf(x) - countOf(y));
    const rows = vs.map((v) => {
      const used = (v[n - 1] as number) > 0;
      if (!used) {
        return [
          `${c}${을를(c)} 안 쓴 것`,
          combo(COINS, v),
          String(countOf(v)),
          "—",
          cellName(n - 1, AMOUNT),
        ];
      }
      const less = [...v];
      less[n - 1] = (less[n - 1] as number) - 1;
      return [
        `${c}${을를(c)} 쓴 것`,
        combo(COINS, v),
        String(countOf(v)),
        combo(COINS, less),
        cellName(n, AMOUNT - c),
      ];
    });
    const without = vs.filter((v) => v[n - 1] === 0).map(countOf);
    const withC = vs.filter((v) => (v[n - 1] as number) > 0).map(countOf);
    const up = t.rows[n - 1]?.[AMOUNT] as number;
    const left = t.rows[n]?.[AMOUNT - c] as number;
    if (Math.min(...without) !== up || Math.min(...withC) !== left + 1) {
      throw new Error("두 무리의 최소가 이웃 칸과 맞지 않는다");
    }
    return withNote(
      md(
        [
          "무리",
          `${cellName(n, AMOUNT)} 의 조합`,
          "동전 개수",
          `${c}${을를(c)} 한 개 뺀 조합`,
          "뺀 조합이 있는 칸",
        ],
        rows,
        [2],
      ),
      `${c}${을를(c)} 안 쓴 무리의 가장 적은 개수 ${Math.min(...without)}${은는(Math.min(...without))} ${cellName(n - 1, AMOUNT)} = ${fmt(up)}${과와(fmt(up))}, ${c}${을를(c)} 쓴 무리의 가장 적은 개수 ${Math.min(...withC)}${은는(Math.min(...withC))} ${cellName(n, AMOUNT - c)} + 1 = ${fmt(left)} + 1 = ${fmt(left + 1)}${과와(fmt(left + 1))} 같습니다.`,
    );
  },

  /** `deep.build` 1단계 — DP 테이블의 크기. */
  "build-size": () => {
    const t = walk();
    return withNote(
      md(
        ["액면가 종류 n", "금액 A", "줄 수 n+1", "줄마다 칸 수 A+1", "모든 칸"],
        [
          [
            String(n),
            String(AMOUNT),
            String(n + 1),
            String(AMOUNT + 1),
            String((n + 1) * (AMOUNT + 1)),
          ],
          [
            comma(N_MAX),
            comma(A_MAX),
            comma(N_MAX + 1),
            comma(A_MAX + 1),
            comma((N_MAX + 1) * (A_MAX + 1)),
          ],
        ],
        [0, 1, 2, 3, 4],
      ),
      `전개 입력에서 정본이 만든 DP 테이블은 ${t.rows.length} 줄 × ${t.rows[0]?.length} 칸, 모두 ${t.rows.length * (t.rows[0]?.length ?? 0)} 칸입니다.`,
    );
  },

  /** `deep.build` 2단계 — 같은 줄 왼쪽 칸이 언제 정해졌는가. */
  "build-fill-row": () => {
    const t = walk();
    const row = t.cells.filter((x) => x.i === 1);
    const order = new Map(row.map((x, k) => [x.a, k + 1]));
    const c = row[0]?.c as number;
    let leftReads = 0;
    let leftEarlier = 0;
    const mark = { copy: "②", skip: "③", take: "④" } as const;
    const rows = row.map((x, k) => {
      const up = `${cellName(0, x.a)} = ${fmt(x.up)}`;
      if (x.branch === "copy") {
        return [
          String(x.a),
          String(k + 1),
          mark[x.branch],
          up,
          "—",
          "—",
          fmt(x.value),
        ];
      }
      leftReads++;
      const when = order.get(x.a - c) as number;
      if (when < k + 1) leftEarlier++;
      return [
        String(x.a),
        String(k + 1),
        mark[x.branch],
        up,
        `${cellName(1, x.a - c)} + 1 = ${fmt((x.take as number) - 1)} + 1`,
        `${when} 번째`,
        fmt(x.value),
      ];
    });
    return withNote(
      md(
        [
          "a",
          "정한 차례",
          "갈래",
          "윗 칸",
          `같은 줄 ${c} 칸 왼쪽 + 1`,
          "왼쪽 칸을 정한 차례",
          `dp[1][a]`,
        ],
        rows,
        [0, 1, 6],
      ),
      `같은 줄에서 읽은 칸 ${leftReads} 개 가운데 ${leftEarlier} 개가 지금 칸보다 먼저 정해져 있었습니다.`,
    );
  },

  /** `deep.build` 3단계 — 오른쪽 아래 칸을 읽고 ∞ 를 -1 로 바꾼다. */
  "build-answer": () => {
    const t = walk();
    const two = COINS.slice(0, 2);
    let same = 0;
    const rows = (t.rows[n] ?? []).map((v, a) => {
      const up = t.rows[2]?.[a] as number;
      const r2 = unboundedKnapsack(two, a);
      const r3 = unboundedKnapsack(COINS, a);
      if ((Number.isFinite(up) ? up : -1) === r2) same++;
      if ((Number.isFinite(v) ? v : -1) === r3) same++;
      return [String(a), fmt(up), show(r2), fmt(v), show(r3)];
    });
    return withNote(
      md(
        [
          "금액 a",
          "dp[2][a]",
          `unboundedKnapsack([${two.join(", ")}], a)`,
          `dp[${n}][a]`,
          `unboundedKnapsack([${COINS.join(", ")}], a)`,
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `${rows.length * 2} 쌍 가운데 ${same} 쌍에서 칸의 값과 반환값이 대응합니다 — 칸이 유한하면 그 값이고, ∞ 면 -1 입니다.`,
    );
  },

  /** `deep.build` 전제 — 액면가를 겹쳐 넣어도 최소는 그대로다. */
  "build-premise": () => {
    const cases: [number[], number][] = [
      [COINS, AMOUNT],
      [[3, 3, 4, 1], AMOUNT],
      [[3, 4, 1, 1, 1], AMOUNT],
      [[7], 7],
      [[7, 7, 7], 7],
    ];
    const rows = cases.map(([coins, amount]) => {
      const uniq = [...new Set(coins)];
      return [
        `[${coins.join(", ")}]`,
        String(amount),
        show(unboundedKnapsack(coins, amount)),
        show(unboundedKnapsack(uniq, amount)),
      ];
    });
    const all = rows.every((r) => r[2] === r[3]);
    if (!all) throw new Error("겹친 액면가가 답을 바꿨다");
    return withNote(
      md(
        ["액면가", "금액", "정본의 답", "겹친 액면가를 하나로 줄인 답"],
        rows,
        [1, 2, 3],
      ),
      `${rows.length} 입력 모두 겹친 액면가를 하나로 줄여도 답이 그대로입니다.`,
    );
  },

  /** `deep.build` 설계 선택 — 상태를 무엇으로 잡는가. */
  "state-size": () => {
    const B: [number[], number] = [[1, 2, 5], 11];
    const oneRowCells = AMOUNT + 1;
    const tableCells = (n + 1) * (AMOUNT + 1);
    return withNote(
      md(
        [
          "상태",
          `${label(COINS, AMOUNT)} 의 답`,
          `${label(...B)} 의 답`,
          "전개 입력의 칸 수",
          `n = ${N_MAX} · A = ${comma(A_MAX)} 의 칸 수`,
        ],
        [
          [
            "금액 a 하나 (한 줄, 작은 금액부터)",
            show(oneRowAnswer(COINS, AMOUNT, "up")),
            show(oneRowAnswer(...B, "up")),
            String(oneRowCells),
            comma(A_MAX + 1),
          ],
          [
            "(i, a) · a - c 를 같은 줄에서",
            show(unboundedKnapsack(COINS, AMOUNT)),
            show(unboundedKnapsack(...B)),
            String(tableCells),
            comma((N_MAX + 1) * (A_MAX + 1)),
          ],
          [
            "(i, a) · a - c 를 윗 줄에서",
            show(aboveRowTable(COINS, AMOUNT).result),
            show(aboveRowTable(...B).result),
            String(tableCells),
            comma((N_MAX + 1) * (A_MAX + 1)),
          ],
        ],
        [1, 2, 3, 4],
      ),
      `정본의 답은 ${show(unboundedKnapsack(COINS, AMOUNT))} 이고, 윗 줄에서 읽은 판은 ${show(aboveRowTable(COINS, AMOUNT).result)}${을를(show(aboveRowTable(COINS, AMOUNT).result))} 냅니다. 한 줄짜리는 답이 같고 칸이 (i, a) 의 ${comma(((N_MAX + 1) * (A_MAX + 1)) / (A_MAX + 1))} 분의 1 입니다.`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 입력. */
  "walk-input": () =>
    [
      `const coins = [${COINS.join(", ")}];`,
      `const amount = ${AMOUNT};`,
      `// 이 절이 끝나면 ${unboundedKnapsack(COINS, AMOUNT)}${이가(unboundedKnapsack(COINS, AMOUNT))} 나와야 한다`,
    ].join("\n"),

  /** `deep.walk.step` 1 — 첫 칸을 정한 직후의 DP 테이블과 액면가가 없는 입력. */
  "walk-init": () => {
    const t = walk();
    const w = 3;
    const head = `       ${Array.from({ length: AMOUNT + 1 }, (_, a) => (a === 0 ? "a=0" : String(a).padStart(w))).join("")}`;
    const lines = t.init.map((row, i) => {
      const cells = row.map((v) => fmt(v).padStart(w)).join("");
      return `  i=${i}  ${cells}${i === 0 ? "" : "     ← 아직 안 정한 줄"}`;
    });
    const empty = ([amount]: [number]) => {
      const e = trace([], amount);
      const v = e.rows[0]?.[amount] as number;
      return `coins = [], amount = ${amount}  →  1 줄 × ${amount + 1} 칸, 칸을 하나도 안 정하고 dp[0][${amount}] = ${fmt(v)} 이라 ${show(e.result)} 반환`;
    };
    return [head, ...lines, "", empty([5]), empty([0])].join("\n");
  },

  /** `deep.walk.step` 2 — 두 반복문이 칸을 정하는 차례. */
  "walk-order": () => {
    const t = walk();
    const lines = COINS.map((c, k) => {
      const as = t.cells.filter((x) => x.i === k + 1).map((x) => x.a);
      return `i=${k + 1} (c=${c})   a = ${as.join(" → ")}`;
    });
    return [
      ...lines,
      "  └ 한 줄을 왼쪽 끝부터 오른쪽 끝까지 다 정한 뒤 다음 줄로 간다",
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 한 개 더 쓰는 후보를 같은 줄과 윗 줄에서 읽으면. */
  "walk-branch-read": () => {
    const t = walk();
    const c = COINS[0] as number;
    const cur = t.rows[1] as readonly number[];
    const prev = t.rows[0] as readonly number[];
    const rows: string[][] = [];
    let first: number | null = null;
    for (let a = c; a <= AMOUNT; a++) {
      const same = (cur[a - c] as number) + 1;
      const above = (prev[a - c] as number) + 1;
      if (first === null && same !== above) first = a;
      rows.push([
        `a = ${a}`,
        `cur[${a - c}] + 1 = ${fmt(same)}`,
        `prev[${a - c}] + 1 = ${fmt(above)}`,
      ]);
    }
    return [
      table([`i=1 줄, c = ${c}`, "같은 줄에서", "윗 줄에서"], rows),
      `  └ 두 값이 처음 달라지는 자리는 a = ${first} 이다. cur[${(first ?? 0) - c}] 에는 ${c}${을를(c)} 이미 한 개 쓴 값이 들어 있다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 큰 액면가부터 집는 방법이 언제 최소를 놓치는가. */
  "greedy-systems": () =>
    table(
      ["액면가", "0…200 에서 최소와 갈리는 금액", "가장 작은 자리"],
      (
        [[1, 5, 10, 25], [1, 10, 50, 100, 500], COINS, [1, 4, 5]] as number[][]
      ).map((coins) => {
        const gaps: number[] = [];
        for (let a = 0; a <= 200; a++) {
          if (greedy(coins, a) !== unboundedKnapsack(coins, a)) gaps.push(a);
        }
        return [
          `[${coins.join(", ")}]`,
          `${comma(gaps.length)} 개`,
          gaps.length === 0 ? "없음" : comma(gaps[0] as number),
        ];
      }),
    ),

  /** `deep.walk.pause` — 전개 입력에서 두 방법이 실제로 낸 개수. */
  "greedy-walk": () =>
    table(
      ["금액", "큰 액면가부터 집는다", "최소"],
      [6, 7, 8, 9, 10, 11, 12].map((a) => [
        comma(a),
        show(greedy(COINS, a)),
        show(unboundedKnapsack(COINS, a)),
      ]),
    ),

  /** `deep.walk.step` 4 — 스물세 걸음의 조건 판정. */
  "walk-trace": () => {
    const steps = walkSteps();
    const t = walk();
    const mark = { copy: "②", skip: "③", take: "④" } as const;
    const rows: string[][] = [
      ["T1", "dp[0][0]", "—", "첫 칸 → ①", "—", fmt(t.init[0]?.[0] as number)],
    ];
    t.cells.forEach((x, k) => {
      const cond = `\`${x.a} < ${x.c}\` **${x.branch === "copy" ? "참" : "거짓"}** → ${mark[x.branch]}`;
      const cands =
        x.branch === "copy"
          ? `윗 칸 ${fmt(x.up)}`
          : `${fmt(x.up)} · ${fmt((x.take as number) - 1)} + 1`;
      rows.push([
        `T${k + 2}`,
        cellName(x.i, x.a),
        String(x.c),
        cond,
        cands,
        fmt(x.value),
      ]);
    });
    const last = t.rows[n]?.[AMOUNT] as number;
    rows.push([
      `T${steps.length}`,
      cellName(n, AMOUNT),
      "—",
      "읽기",
      fmt(last),
      show(t.result),
    ]);
    const b = branchCount(t.cells);
    return withNote(
      md(
        [
          "단계",
          "칸",
          "c",
          "조건 판정",
          "두 후보 (안 쓴다 · 한 개 더)",
          "정한 값",
        ],
        rows,
        [2, 5],
      ),
      `① 이 1 칸, ② 가 ${b.copy} 칸, ③ 이 ${b.skip} 칸, ④ 가 ${b.take} 칸이고, 반환값은 ${show(t.result)} 입니다.`,
    );
  },

  /** `deep.walk.pause` — 못 만드는 칸에 `-1` 을 적으면. */
  "minus-one": () =>
    table(
      ["입력", "정본", "칸에 -1 을 적은 판"],
      (
        [
          [COINS, 6],
          [COINS, 3],
          [[1, 2, 5], 11],
          [[1], 5],
          [[2], 3],
          [[5, 10], 3],
        ] as [number[], number][]
      ).map(([coins, amount]) => [
        label(coins, amount),
        show(unboundedKnapsack(coins, amount)),
        show(minusOneCell(coins, amount)),
      ]),
    ),

  /** `deep.walk.pause` — 한 줄로 접었을 때 금액을 채우는 방향. */
  "one-row-dir": () =>
    table(
      [
        "금액",
        "작은 금액부터",
        "큰 금액부터",
        "DP 테이블",
        "윗 줄에서 읽은 판",
      ],
      [2, 4, 5, 6, 7, 8].map((a) => [
        String(a),
        show(oneRowAnswer(COINS, a, "up")),
        show(oneRowAnswer(COINS, a, "down")),
        show(unboundedKnapsack(COINS, a)),
        show(aboveRowTable(COINS, a).result),
      ]),
    ),

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": () => {
    const 목록: [number[], number][] = [
      [COINS, 6],
      [[1, 2, 5], 11],
      [[1, 3, 4], 6],
      [[2], 3],
      [[1], 0],
      [[], 0],
      [[], 5],
      [[7, 7, 7], 7],
      [[5, 10], 3],
      [[10_000], 10_000],
    ];
    const 이름 = 목록.map(
      ([coins, amount]) =>
        `unboundedKnapsack([${coins.join(", ")}], ${amount})`,
    );
    const 폭 = Math.max(...이름.map((s) => s.length));
    return [
      ...목록.map(
        ([coins, amount], i) =>
          `${pad(이름[i] as string, 폭)}  →  ${show(unboundedKnapsack(coins, amount))}`,
      ),
    ].join("\n");
  },

  /** `related` — 금액을 꼭짓점으로 두고 0 에서 걸음 수를 넓혀 가면 마지막 줄이 나온다. */
  "related-steps": () => {
    const last = walk().rows[n] as readonly number[];
    const level = new Array<number>(AMOUNT + 1).fill(Number.POSITIVE_INFINITY);
    level[0] = 0;
    let frontier = [0];
    let d = 0;
    while (frontier.length > 0) {
      d++;
      const next: number[] = [];
      for (const x of frontier) {
        for (const c of COINS) {
          const y = x + c;
          if (y <= AMOUNT && !Number.isFinite(level[y] as number)) {
            level[y] = d;
            next.push(y);
          }
        }
      }
      frontier = next;
    }
    const maxD = Math.max(...level.filter((x) => Number.isFinite(x)));
    const rows: string[][] = [];
    let same = 0;
    for (let k = 0; k <= maxD; k++) {
      const as = level.flatMap((x, a) => (x === k ? [a] : []));
      rows.push([
        String(k),
        as.join(" · "),
        as.map((a) => `dp[${n}][${a}] = ${fmt(last[a] as number)}`).join(" · "),
      ]);
    }
    last.forEach((v, a) => {
      if (v === level[a]) same++;
    });
    return withNote(
      md(
        [
          "걸음 수",
          `그 걸음 수로 처음 도달하는 금액 (0 … ${AMOUNT})`,
          "마지막 줄의 값",
        ],
        rows,
        [0],
      ),
      `금액 ${last.length} 개 가운데 ${same} 개에서 0 부터 센 최소 걸음 수와 dp[${n}][a] 가 같습니다.`,
    );
  },

  /** `purpose.real` — 인용한 변환 규칙(`round(mass / precision)`)을 넣으면 열이 몇 개가 되는가. */
  "mass-columns": () => {
    const col = (mass: number, precision: number): number =>
      Math.round(mass / precision) + 1;
    return table(
      ["무엇", "값"],
      [
        [
          `이 글의 DP 테이블 — 열 수 (금액 0 … ${comma(A_MAX)})`,
          comma(A_MAX + 1),
        ],
        [
          `이 글의 DP 테이블 — 칸 수 (액면가 ${N_MAX} 종)`,
          comma((N_MAX + 1) * (A_MAX + 1)),
        ],
        ["질량 1,000 Da 를 0.0001 Da 로 끊은 열 수", comma(col(1_000, 0.0001))],
        ["질량 5,000 Da 를 0.0001 Da 로 끊은 열 수", comma(col(5_000, 0.0001))],
        [
          "알파벳 20 종일 때 5,000 Da 짜리 DP 테이블의 칸 수",
          comma(21 * col(5_000, 0.0001)),
        ],
      ],
    );
  },

  /** `deep.math` ② — 정의를 금액 6 에 넣는다. */
  "math-check": () => {
    const vs = vectors(COINS, AMOUNT);
    const best = Math.min(...vs.map(countOf));
    const eq = COINS.map((c, j) => `${c === 1 ? "" : c}k${"₁₂₃₄₅"[j]}`).join(
      " + ",
    );
    const lines = vs.map(
      (v) =>
        `  (${v.join(", ")})   동전 ${countOf(v)} 개${countOf(v) === best ? "   ← 최소" : ""}`,
    );
    return [
      `${eq} = ${AMOUNT}  을 만족하는 (k₁, k₂, k₃)`,
      "",
      ...lines,
      `                            M(${AMOUNT}) = ${best}`,
    ].join("\n");
  },

  /** `deep.math` ③ — 식을 그대로 옮긴 조각과 그 값. */
  "math-code": () => {
    const M = (a: number): number => unboundedKnapsack(COINS, a);
    const parts = COINS.filter((c) => c <= AMOUNT);
    const inner = parts.map((c) => `M(${AMOUNT - c})+1`).join(", ");
    const vals = parts.map((c) => `${M(AMOUNT - c)}+1`).join(", ");
    return [
      `// 식을 그대로 옮긴 조각. 액면가 [${COINS.join(", ")}] 로 금액 ${AMOUNT} 을 계산한다.`,
      "const M = (a: number): number =>",
      "  a === 0",
      "    ? 0",
      "    : Math.min(...coins.filter((c) => c <= a).map((c) => M(a - c) + 1));",
      "",
      `M(${AMOUNT}); // min(${inner}) = min(${vals}) = ${M(AMOUNT)}`,
    ].join("\n");
  },

  /** `deep.math` ② — 두 액면가로 못 만드는 금액을 전수로 세어 식과 맞춘다. */
  "frobenius-check": () => {
    const unmakeable = (p: number, q: number, until: number): number[] => {
      const out: number[] = [];
      for (let a = 1; a <= until; a++) {
        if (unboundedKnapsack([p, q], a) === -1) out.push(a);
      }
      return out;
    };
    return [
      table(
        [
          "p, q",
          "못 만드는 금액",
          "가장 큰 것",
          "pq - p - q",
          "개수",
          "(p−1)(q−1)/2",
        ],
        (
          [
            [2, 3],
            [3, 4],
            [3, 5],
            [4, 7],
            [5, 6],
          ] as [number, number][]
        ).map(([p, q]) => {
          const u = unmakeable(p, q, 200);
          return [
            `${p}, ${q}`,
            u.join(" "),
            comma(Math.max(...u)),
            comma(p * q - p - q),
            comma(u.length),
            comma(((p - 1) * (q - 1)) / 2),
          ];
        }),
      ),
    ].join("\n");
  },

  /** `deep.math` ④ — 그 식에 과제 규모를 넣는다. */
  "frobenius-scale": () => {
    const p = 9_999;
    const q = 10_000;
    const row = trace([p, q], A_MAX).rows[2] as readonly number[];
    const made = row.flatMap((v, a) =>
      a > 0 && Number.isFinite(v) ? [a] : [],
    );
    const unmade = A_MAX - made.length;
    return [
      table(
        ["무엇", "값"],
        [
          ["못 만드는 가장 큰 금액 pq - p - q", comma(p * q - p - q)],
          [
            "못 만드는 금액의 개수 (p−1)(q−1)/2",
            comma(((p - 1) * (q - 1)) / 2),
          ],
          ["이 과제의 금액 위 끝 A", comma(A_MAX)],
          [`금액 1 … ${comma(A_MAX)} 가운데 못 만드는 것`, comma(unmade)],
          [
            `금액 1 … ${comma(A_MAX)} 가운데 만드는 것`,
            made.map(comma).join(" · "),
          ],
        ],
      ),
    ].join("\n");
  },

  /** `invariant` ② — 모든 칸을 정의대로 직접 센 값과 맞댄다. */
  "invariant-cells": () => {
    const t = walk();
    let total = 0;
    let off = 0;
    const rows = t.rows.map((row, i) => {
      const direct = row.map((_, a) => minByDefinition(COINS.slice(0, i), a));
      let bad = 0;
      row.forEach((v, a) => {
        total++;
        if (v !== direct[a]) bad++;
      });
      off += bad;
      return [
        `i=${i}`,
        `[${row.map(fmt).join(" ")}]`,
        `[${direct.map(fmt).join(" ")}]`,
        String(bad),
      ];
    });
    return withNote(
      md(
        ["줄", "DP 테이블의 값", "개수 목록에서 직접 고른 최소", "어긋난 칸"],
        rows,
        [3],
      ),
      `정의대로 직접 고른 값과 DP 테이블의 값을 ${total} 칸에서 대조했고, 어긋난 칸은 ${off} 개입니다.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [number[], number][] = [
      [[], 0],
      [[], 5],
      [COINS, 0],
      [[7, 7, 7], 7],
      [[5, 10], 3],
      [[1, 3, 4], 6],
      [[4, 1, 3], 6],
    ];
    const rows = cases.map(([coins, amount]) => {
      const t = trace(coins, amount);
      const b = branchCount(t.cells);
      return [
        `\`coins=[${coins.join(", ")}], amount=${amount}\``,
        `${coins.length + 1} × ${comma(amount + 1)}`,
        String(b.copy),
        String(b.skip),
        String(b.take),
        show(t.result),
      ];
    });
    return withNote(
      md(
        [
          "입력",
          "줄 × 칸",
          "윗 칸을 옮긴 칸",
          "안 쓰는 쪽을 고른 칸",
          "한 개 더 쓰는 쪽을 고른 칸",
          "반환",
        ],
        rows,
        [2, 3, 4, 5],
      ),
      `${rows.length} 입력 모두 칸을 세 갈래 가운데 하나로만 정했습니다.`,
    );
  },

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  "mutant-no-count": () =>
    table(
      ["입력", "바른 코드", "1 을 안 더한 코드"],
      변이표.map(([coins, amount]) => [
        label(coins, amount),
        show(unboundedKnapsack(coins, amount)),
        show(개수를안더하기.unboundedKnapsack(coins, amount)),
      ]),
    ),

  /** `invariant` ③ — 변이가 마지막 줄에 남기는 것. 금액마다 부르면 그 금액의 마지막 칸이 나온다. */
  "mutant-rows": () => {
    const row = (f: (c: number[], a: number) => number) =>
      Array.from({ length: AMOUNT + 1 }, (_, a) => show(f(COINS, a))).join(" ");
    return table(
      [
        "코드",
        `unboundedKnapsack([${COINS.join(", ")}], a), a = 0 … ${AMOUNT}`,
      ],
      [
        ["바른 코드", row(unboundedKnapsack)],
        [
          "1 을 안 더한 코드",
          row((c, a) => 개수를안더하기.unboundedKnapsack(c, a)),
        ],
      ],
    );
  },

  /** `perf.derive` — 전개의 걸음이 한 일을 모은다. */
  "perf-derive": () => {
    const t = walk();
    const steps = walkSteps();
    const b = branchCount(t.cells);
    return [
      `T1          DP 테이블 ${n + 1} × ${AMOUNT + 1} 칸을 ∞ 로 깔고 dp[0][0] 하나를 0 으로`,
      `T2~T${steps.length - 1}      칸 ${t.cells.length} 개를 한 걸음에 한 칸씩 — ② ${b.copy} 칸 · ③ ${b.skip} 칸 · ④ ${b.take} 칸`,
      `T${steps.length}         dp[${n}][${AMOUNT}] 한 칸을 읽고 유한한지 본다`,
      "            └ 칸마다 비교 1 번, ②가 아니면 덧셈 1 번과 비교 1 번이 더",
    ].join("\n");
  },

  /** `perf.worst` — 못 쓰는 칸을 건너뛰어도 최악은 그대로인가. */
  "worst-fill": () => {
    const 입력: [string, number[]][] = [
      [`액면가 ${N_MAX} 종이 전부 1`, repeat(1, N_MAX)],
      [`액면가 ${N_MAX} 종이 1 … ${N_MAX}`, upTo(N_MAX)],
      [`액면가 ${N_MAX} 종이 전부 5,000`, repeat(5_000, N_MAX)],
      [`액면가 ${N_MAX} 종이 전부 ${comma(A_MAX)}`, repeat(A_MAX, N_MAX)],
    ];
    return [
      table(
        [
          `입력 (금액 = ${comma(A_MAX)})`,
          "답",
          "정본이 정한 칸",
          "건너뛰기판이 정한 칸",
        ],
        입력.map(([이름, coins]) => [
          이름,
          show(unboundedKnapsack(coins, A_MAX)),
          comma(decidedCells(coins, A_MAX, false)),
          comma(decidedCells(coins, A_MAX, true)),
        ]),
      ),
    ].join("\n");
  },

  /** `selfcheck` — 답이 붙는 문제의 물음. */
  "selfcheck-q": () => {
    const t = walk();
    const steps = walkSteps();
    const find = (i: number, a: number) =>
      steps.find((s) => s.title.startsWith(`${cellName(i, a)} =`))?.id;
    const c = COINS[0] as number;
    const x = t.cells.find((y) => y.i === 1 && y.a === c) as Cell;
    const y = t.cells.find((z) => z.i === 1 && z.a === 2 * c) as Cell;
    return [
      `${find(1, c)} :  ${cellName(1, c)} = ${cellName(1, 0)} + 1 = ${fmt(x.value)}`,
      `${find(1, 2 * c)} :  ${cellName(1, 2 * c)} = ${cellName(1, c)} + 1 = ${fmt(y.value)}`,
      `      ${cellName(1, c)} = ${fmt(x.value)} 이 뜻하는 조합 = ?`,
    ].join("\n");
  },

  /** `selfcheck` — 답. */
  "selfcheck-a": () => {
    const c = COINS[0] as number;
    const t = walk();
    const one = vectors([c], c).map((v) => combo([c], v));
    const two = vectors([c], 2 * c).map((v) => combo([c], v));
    const none = vectors([], 2 * c);
    return table(
      [
        "읽은 칸",
        "그 칸의 조합",
        "하는 일",
        `금액 ${2 * c} 의 조합`,
        "동전 개수",
      ],
      [
        [
          cellName(1, c),
          one.join(" · "),
          `${c}${을를(c)} 한 개 더`,
          two.join(" · "),
          fmt(t.rows[1]?.[2 * c] as number),
        ],
        [
          cellName(0, 2 * c),
          none.length === 0 ? "없음" : String(none.length),
          `${c}${을를(c)} 안 쓴다`,
          "없음",
          fmt(t.rows[0]?.[2 * c] as number),
        ],
      ],
    );
  },
};
