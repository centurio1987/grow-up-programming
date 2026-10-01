/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 칸 하나를 정한 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/coinChangeWays/coinChangeWays-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as benchCases } from "./coinChangeWays-guide.alt.ts";
import {
  A_MAX,
  AMOUNT,
  amountOuter,
  big,
  type Cell,
  COINS,
  N_MAX,
  trace,
  upTo,
  walkSteps,
} from "./coinChangeWays-guide.fig.tsx";
import { coinChangeWays } from "./coinChangeWays-guide.ref.ts";

const REF = new URL("./coinChangeWays-guide.ref.ts", import.meta.url).pathname;

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

/** `[1 0 0 0 0 0]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;
const list = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/* ────────────────────────── 조합과 나열을 직접 센다 ────────────────────────── */

/**
 * 개수 목록 — 종류마다 몇 개 쓰는지 적은 목록 중 합이 `amount` 인 것 전부. 큰 종류를 많이 쓴 것부터
 * 늘어놓는다. 정본과 무관하게 정의 그대로 센다 — 정본의 값과 맞대는 쪽이다.
 */
function countLists(coins: readonly number[], amount: number): number[][] {
  const out: number[][] = [];
  const k = new Array<number>(coins.length).fill(0);
  const go = (j: number, rest: number): void => {
    if (j < 0) {
      if (rest === 0) out.push([...k]);
      return;
    }
    const c = coins[j] as number;
    for (let m = Math.floor(rest / c); m >= 0; m--) {
      k[j] = m;
      go(j - 1, rest - m * c);
    }
    k[j] = 0;
  };
  go(coins.length - 1, amount);
  return out;
}

/** 개수 목록을 합으로 적는다 — 큰 동전부터. 빈 목록은 「빈 조합」이다. */
function sumText(coins: readonly number[], k: readonly number[]): string {
  const parts: number[] = [];
  for (let j = coins.length - 1; j >= 0; j--) {
    for (let m = 0; m < (k[j] ?? 0); m++) parts.push(coins[j] as number);
  }
  return parts.length === 0 ? "빈 조합" : parts.join(" + ");
}

/** 나열 — 동전을 넣은 차례까지 적은 목록 중 합이 `amount` 인 것 전부. */
function sequences(coins: readonly number[], amount: number): number[][] {
  const out: number[][] = [];
  const go = (rest: number, acc: number[]): void => {
    if (rest === 0) {
      out.push([...acc]);
      return;
    }
    for (const c of coins) {
      if (c <= rest) {
        acc.push(c);
        go(rest - c, acc);
        acc.pop();
      }
    }
  };
  go(amount, []);
  return out;
}

/** 나열 하나를 조합으로 — 종류마다의 개수. */
const countsOf = (coins: readonly number[], seq: readonly number[]): number[] =>
  coins.map((c) => seq.filter((x) => x === c).length);

// 정의대로 센 수가 정본과 같은가 — 작은 입력 전부에서 맞대어 둔다. 어긋나면 아래 블록이 모두 틀린 말을 한다.
for (const coins of [[1, 2, 5], [1, 2, 3], [2], [5, 10], [3, 7]]) {
  for (let a = 0; a <= 20; a++) {
    if (countLists(coins, a).length !== coinChangeWays(coins, a)) {
      throw new Error(
        `조합을 직접 센 수가 정본과 다르다 — ${list(coins)} / ${a}`,
      );
    }
    if (sequences(coins, a).length !== (amountOuter(coins, a)[a] as number)) {
      throw new Error(
        `나열을 직접 센 수가 금액만 기억한 방식과 다르다 — ${list(coins)} / ${a}`,
      );
    }
  }
}

/* ────────────────────────── 계측판 ────────────────────────── */

/**
 * 완전 탐색 — 동전 종류를 하나씩 보면서 그 동전을 몇 개 쓸지 전부 시도한다.
 * 호출 수와 **서로 다른 `(i, rest)` 짝의 수**, 짝마다 불린 횟수를 함께 센다.
 */
function bruteForce(
  coins: readonly number[],
  amount: number,
): { 호출: number; 상태: number; 답: number; 횟수: Map<string, number> } {
  let 호출 = 0;
  const 횟수 = new Map<string, number>();
  const go = (i: number, rest: number): number => {
    호출++;
    const key = `${i},${rest}`;
    횟수.set(key, (횟수.get(key) ?? 0) + 1);
    if (rest === 0) return 1;
    if (i === coins.length) return 0;
    let 합 = 0;
    const c = coins[i] as number;
    for (let k = 0; c * k <= rest; k++) 합 += go(i + 1, rest - c * k);
    return 합;
  };
  const 답 = go(0, amount);
  if (답 !== coinChangeWays([...coins], amount)) {
    throw new Error("완전 탐색이 정본과 다른 답을 냈다");
  }
  return { 호출, 상태: 횟수.size, 답, 횟수 };
}

/** 상태에 「지금까지 쓴 동전 개수 `m`」까지 넣은 표. 답은 같고 칸만 는다. */
function withCount(coins: readonly number[], amount: number): number {
  const n = coins.length;
  const dp = Array.from({ length: n + 1 }, () =>
    Array.from({ length: amount + 1 }, () =>
      new Array<number>(amount + 1).fill(0),
    ),
  );
  ((dp[0] as number[][])[0] as number[])[0] = 1;
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    for (let a = 0; a <= amount; a++) {
      for (let m = 0; m <= amount; m++) {
        const 윗줄 = ((dp[i - 1] as number[][])[a] as number[])[m] as number;
        const 왼쪽 =
          a >= c && m >= 1
            ? (((dp[i] as number[][])[a - c] as number[])[m - 1] as number)
            : 0;
        ((dp[i] as number[][])[a] as number[])[m] = 윗줄 + 왼쪽;
      }
    }
  }
  let 합 = 0;
  for (let m = 0; m <= amount; m++) {
    합 += ((dp[n] as number[][])[amount] as number[])[m] as number;
  }
  return 합;
}

/** 정확한 답 — 부동소수와 갈리는 자리를 보이려고 정수 산술로 따로 센다. */
function exact(coins: readonly number[], amount: number): bigint {
  const dp = new Array<bigint>(amount + 1).fill(0n);
  dp[0] = 1n;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) {
      dp[a] = (dp[a] as bigint) + (dp[a - c] as bigint);
    }
  }
  return dp[amount] as bigint;
}

const 쉼표 = (v: bigint): string =>
  v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 전개 입력의 기록 — 여러 블록이 같이 쓴다. */
const T = trace(COINS, AMOUNT);
const cellAt = (i: number, a: number): Cell => {
  const c = T.cells.find((x) => x.i === i && x.a === a);
  if (!c) throw new Error(`dp[${i}][${a}] 의 기록이 없다`);
  return c;
};
const dpv = (i: number, a: number): number => T.rows[i]?.[a] as number;

/* ────────────────────────── 변이 ────────────────────────── */

type Solver = { coinChangeWays(coins: number[], amount: number): number };

/**
 * 불변식을 지키던 줄 — 같은 줄의 왼쪽 칸을 읽는 자리 — 를 **윗 줄**로 바꾼 사본.
 * 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 윗줄에서읽기 = await loadMutant<Solver>(REF, {
  swap: [/\(cur\[a - c\] as number\)/, "(prev[a - c] as number)"],
});

/** 금액 0 칸을 1 대신 0 으로 둔 사본. */
const 첫칸이0 = await loadMutant<Solver>(REF, {
  swap: [/\(dp\[0\] as number\[\]\)\[0\] = 1;/, "(dp[0] as number[])[0] = 0;"],
});

/**
 * 중화 실행인가 — `check-proof` 가 변이를 끈 채 이 파일을 한 번 더 부를 때는 `loadMutant` 가 정본을
 * 그대로 돌려준다. 값에서 알아낸다(변이 모듈의 함수가 정본과 같은 객체인가). 그때는 「변이가 답을
 * 바꿨다」는 자기검사만 건너뛴다 — 안 그러면 중화 실행이 모듈 머리에서 던져 갈림 대조가 한 번도 돌지 않는다.
 */
const 중화 = 윗줄에서읽기.coinChangeWays === coinChangeWays;

const 윗줄표: [string, number[], number][] = [
  ["[1, 2, 5] / 5", [1, 2, 5], 5],
  ["[1, 2, 5] / 6", [1, 2, 5], 6],
  ["[1, 2, 3] / 4", [1, 2, 3], 4],
  ["[1, 2, 5] / 100", [1, 2, 5], 100],
  ["[1] / 10000", [1], 10_000],
];

if (
  !중화 &&
  윗줄표.every(
    ([, coins, amount]) =>
      coinChangeWays(coins, amount) ===
      윗줄에서읽기.coinChangeWays(coins, amount),
  )
) {
  throw new Error(
    "윗 줄에서 읽는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

/* ────────────────── 바깥 자료가 적은 값 (대조용) ────────────────── */

/**
 * 인용한 문서가 적어 둔 값. **이 글의 코드가 낸 값과 다르면 여기서 실패한다** —
 * 인용이 맞는지를 사람이 다시 읽어 확인하는 자리를 없앤다.
 */
const 바깥출처: [string, string, number[], number, number][] = [
  [
    "GAP",
    "NrRestrictedPartitions(50, [1,2,5,10,20,50])",
    [1, 2, 5, 10, 20, 50],
    50,
    451,
  ],
  ["GAP", "RestrictedPartitions(8, [1,3,5,7]) 의 개수", [1, 3, 5, 7], 8, 6],
  [
    "SICP",
    "count-change(100), 동전 [1,5,10,25,50]",
    [1, 5, 10, 25, 50],
    100,
    292,
  ],
];

/**
 * 자료 이름과 호출을 한 칸으로 합칠 때 **폭을 값에서 잰다.** 고정 공백을 박으면 `SICP` 처럼
 * 이름이 한 글자 긴 줄에서 뒤 칸이 통째로 밀린다.
 */
const 출처폭 = Math.max(...바깥출처.map(([출처]) => width(출처)));

const 바깥값: [string, number[], number, number][] = 바깥출처.map(
  ([출처, 항목, coins, amount, 적힌값]) => [
    `${pad(출처, 출처폭)}  ${항목}`,
    coins,
    amount,
    적힌값,
  ],
);
for (const [이름, coins, amount, 적힌값] of 바깥값) {
  if (coinChangeWays(coins, amount) !== 적힌값) {
    throw new Error(`${이름} 의 인용값과 실행값이 다르다`);
  }
}

/* ────────────────────────── 파트 1 — 전체 컨셉 · 떠올리는 과정 ────────────────────────── */

/** `concept` — 조합은 종류마다의 개수로 적힌다. 정본의 답과 맞댄다. */
function conceptCombos(): string {
  const lists = countLists(COINS, AMOUNT);
  const r = coinChangeWays(COINS, AMOUNT);
  if (lists.length !== r) throw new Error("조합 목록의 수가 정본과 다르다");
  return withNote(
    md(
      ["조합", ...COINS.map((c) => `${c} 의 개수`)],
      lists.map((k) => [sumText(COINS, k), ...k.map(String)]),
      COINS.map((_, j) => j + 1),
    ),
    `조합은 ${lists.length} 가지이고, 정본 coinChangeWays(${list(COINS)}, ${AMOUNT}) 가 낸 값도 ${r} 입니다.`,
  );
}

/** `deep.origin` ② — 완전 탐색이 만드는 잎의 수는 답 자체다. */
function bruteLeaves(): string {
  return table(
    ["동전", "금액", "조합의 수 = 완전 탐색이 만드는 잎"],
    [
      ["[1, 2, 5]", "5", big(coinChangeWays([1, 2, 5], 5))],
      ["[1, 2, 5]", "100", big(coinChangeWays([1, 2, 5], 100))],
      ["1 … 10", "1,000", big(coinChangeWays(upTo(10), 1000))],
      [`1 … ${N_MAX}`, comma(A_MAX), big(coinChangeWays(upTo(N_MAX), A_MAX))],
    ],
  );
}

/** `deep.origin` ③ — 서로 다른 길이 같은 `(i, rest)` 에 온다. 완전 탐색의 호출 기록과 맞댄다. */
function originSameState(): string {
  const i = 2;
  const rest = 3;
  const paths: number[][] = [];
  const c1 = COINS[0] as number;
  const c2 = COINS[1] as number;
  for (let k1 = 0; k1 * c1 <= AMOUNT; k1++) {
    for (let k2 = 0; k1 * c1 + k2 * c2 <= AMOUNT; k2++) {
      if (AMOUNT - k1 * c1 - k2 * c2 === rest) paths.push([k1, k2]);
    }
  }
  const calls = bruteForce(COINS, AMOUNT).횟수.get(`${i},${rest}`) ?? 0;
  if (calls !== paths.length) {
    throw new Error(
      `(${i}, ${rest}) 이 불린 횟수 ${calls} 가 길의 수와 다르다`,
    );
  }
  const lines = paths.map(
    ([k1, k2]) =>
      `  ${c1}${을를(c1)} ${k1} 개 → ${c2}${을를(c2)} ${k2} 개  →  (${i}, ${rest})`,
  );
  const next = COINS[i] as number;
  return [
    `go(0, ${AMOUNT}) 아래에서 (${i}, ${rest}) 에 오는 길 ${paths.length} 가지`,
    "",
    ...lines,
    `     └ 둘 다 「${next}${으로(next)} 금액 ${rest}${을를(rest)} 만드는 방법이 몇 가지인가」를 다시 묻는다`,
  ].join("\n");
}

/** `deep.origin` ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 적는다. */
function repeatVsState(): string {
  return table(
    ["금액", "완전 탐색 호출", "서로 다른 (i, a)", "겹쳐 부른 횟수"],
    [5, 20, 40, 60, 80].map((amount) => {
      const r = bruteForce(COINS, amount);
      return [
        comma(amount),
        comma(r.호출),
        comma(r.상태),
        comma(r.호출 - r.상태),
      ];
    }),
  );
}

/** `deep.origin` ⑤ — 금액 하나만 기억하면 조합이 아니라 나열이 세어진다. */
function amountOnly(): string {
  return table(
    ["금액", "금액만 기억", "(i, a) 를 기억"],
    [3, 4, 5, 6, 10, 20].map((amount) => [
      comma(amount),
      comma(amountOuter(COINS, amount)[amount] as number),
      comma(coinChangeWays(COINS, amount)),
    ]),
  );
}

/** `deep.origin` ⑤ — 금액만 기억한 방식이 센 것을 조합마다 모은다. */
function amountOnlyList(): string {
  const seqs = sequences(COINS, AMOUNT);
  const byAmount = amountOuter(COINS, AMOUNT)[AMOUNT] as number;
  if (seqs.length !== byAmount) throw new Error("나열의 수가 어긋난다");
  const lists = countLists(COINS, AMOUNT);
  const rows = lists.map((k) => {
    const mine = seqs.filter((s) => countsOf(COINS, s).join() === k.join());
    return [
      sumText(COINS, k),
      mine.map((s) => s.join("+")).join(" · "),
      String(mine.length),
    ];
  });
  return withNote(
    md(["조합", "금액만 기억한 방식이 센 차례", "센 수"], rows, [2]),
    `센 수를 모두 더하면 ${seqs.length} 가지이고, 조합은 ${lists.length} 가지입니다.`,
  );
}

/* ────────────────────────── 파트 1 — 아이디어 상세 ────────────────────────── */

/** (b) — 마지막 줄의 칸마다 그 칸이 세는 조합을 늘어놓는다. */
function buildCellMeaning(): string {
  const n = COINS.length;
  let same = 0;
  const rows = (T.rows[n] as readonly number[]).map((v, a) => {
    const lists = countLists(COINS, a);
    if (lists.length === v) same++;
    return [
      String(a),
      String(v),
      lists.map((k) => sumText(COINS, k)).join(" · "),
    ];
  });
  return withNote(
    md(["금액 a", `dp[${n}][a]`, "그 칸이 세는 조합"], rows, [0, 1]),
    `칸에 적힌 수와 늘어놓은 조합의 개수가 ${rows.length} 칸 가운데 ${same} 칸에서 같습니다.`,
  );
}

/** (c) — 칸 하나를 이름에서 조합까지 따라간다. */
function buildReadOne(): string {
  const i = 2;
  const a = 4;
  const coins = COINS.slice(0, i);
  const lists = countLists(coins, a);
  return withNote(
    md(
      [...coins.map((c) => `${c} 의 개수`), "금액", "조합"],
      lists.map((k) => [
        ...k.map(String),
        k.map((m, j) => `${coins[j]}×${m}`).join(" + "),
        sumText(coins, k),
      ]),
      coins.map((_, j) => j),
    ),
    `동전 ${coins.join(" · ")}${으로(coins.at(-1) as number)} 금액 ${a}${을를(a)} 만드는 조합은 ${lists.length} 가지이고, DP 테이블의 dp[${i}][${a}] 도 ${dpv(i, a)} 입니다.`,
  );
}

/** (d) — dp[2][4] 의 조합을 새 동전을 썼는가로 가르면 두 이웃 칸의 조합과 하나씩 짝지어진다. */
function buildNeighborSplit(): string {
  const i = 2;
  const a = 4;
  const coins = COINS.slice(0, i);
  const c = coins[i - 1] as number;
  const lists = countLists(coins, a);
  const without = lists.filter((k) => k[i - 1] === 0);
  const withIt = lists.filter((k) => (k[i - 1] ?? 0) >= 1);
  const rows = [
    ...without.map((k) => [
      `${c}${을를(c)} 안 쓴 것`,
      sumText(coins, k),
      "—",
      `dp[${i - 1}][${a}]`,
    ]),
    ...withIt.map((k) => {
      const less = k.map((m, j) => (j === i - 1 ? m - 1 : m));
      return [
        `${c}${을를(c)} 쓴 것`,
        sumText(coins, k),
        sumText(coins, less),
        `dp[${i}][${a - c}]`,
      ];
    }),
  ];
  if (without.length !== dpv(i - 1, a) || withIt.length !== dpv(i, a - c)) {
    throw new Error("두 무리의 크기가 이웃 칸의 값과 다르다");
  }
  return withNote(
    md(
      [
        "무리",
        `dp[${i}][${a}] 의 조합`,
        `${c}${을를(c)} 한 개 뺀 조합`,
        "뺀 조합이 있는 칸",
      ],
      rows,
    ),
    `${c}${을를(c)} 안 쓴 조합 ${without.length} 가지는 dp[${i - 1}][${a}] = ${dpv(i - 1, a)}${과와(dpv(i - 1, a))}, ${c}${을를(c)} 쓴 조합 ${withIt.length} 가지는 dp[${i}][${a - c}] = ${dpv(i, a - c)}${과와(dpv(i, a - c))} 개수가 같습니다.`,
  );
}

/** 1단계 — DP 테이블의 크기. 전개 입력과 과제의 위 끝. */
function buildSize(): string {
  const rows: [number, number][] = [
    [COINS.length, AMOUNT],
    [N_MAX, A_MAX],
  ];
  const cells = T.rows.reduce((s, r) => s + r.length, 0);
  if (cells !== (COINS.length + 1) * (AMOUNT + 1)) {
    throw new Error("정본이 만든 DP 테이블의 칸 수가 (n+1)(A+1) 과 다르다");
  }
  return withNote(
    md(
      ["동전 종류 n", "금액 A", "줄 수 n+1", "줄마다 칸 수 A+1", "모든 칸"],
      rows.map(([n, A]) => [
        comma(n),
        comma(A),
        comma(n + 1),
        comma(A + 1),
        comma((n + 1) * (A + 1)),
      ]),
      [0, 1, 2, 3, 4],
    ),
    `전개 입력에서 정본이 만든 DP 테이블은 ${T.rows.length} 줄 × ${T.rows[0]?.length} 칸, 모두 ${cells} 칸입니다.`,
  );
}

/** 2단계 — 한 줄을 왼쪽부터 채울 때, 같은 줄에서 읽는 칸은 이미 정해져 있다. */
function buildFillRow(): string {
  const i = 2;
  const cells = T.cells.filter((c) => c.i === i);
  const order = new Map(cells.map((c, k) => [c.a, k + 1]));
  let ready = 0;
  let adds = 0;
  const rows = cells.map((c) => {
    const [up, left] = c.reads;
    if (left) {
      adds++;
      if ((order.get(left.at[1]) ?? 99) < (order.get(c.a) ?? 0)) ready++;
    }
    return [
      String(c.a),
      String(order.get(c.a)),
      c.branch === "copy" ? "②" : "③",
      `dp[${up?.at[0]}][${up?.at[1]}] = ${up?.value}`,
      left ? `dp[${left.at[0]}][${left.at[1]}] = ${left.value}` : "—",
      left ? `${order.get(left.at[1])} 번째` : "—",
      String(c.value),
    ];
  });
  return withNote(
    md(
      [
        "a",
        "정한 차례",
        "갈래",
        "윗 칸",
        `같은 줄 ${COINS[i - 1]} 칸 왼쪽`,
        "왼쪽 칸을 정한 차례",
        `dp[${i}][a]`,
      ],
      rows,
      [0, 1, 6],
    ),
    `같은 줄에서 읽은 칸 ${adds} 개 가운데 ${ready} 개가 지금 칸보다 먼저 정해져 있었습니다.`,
  );
}

/** 3단계 — 마지막 줄의 칸 하나하나가 그 금액의 답이다. */
function buildAnswer(): string {
  const n = COINS.length;
  let same = 0;
  const rows = (T.rows[n] as readonly number[]).map((v, a) => {
    const r = coinChangeWays(COINS, a);
    if (r === v) same++;
    return [String(a), String(v), String(r)];
  });
  return withNote(
    md(
      ["금액 a", `dp[${n}][a]`, `coinChangeWays(${list(COINS)}, a)`],
      rows,
      [0, 1, 2],
    ),
    `${rows.length} 금액 가운데 ${same} 금액에서 두 값이 같습니다. 정본이 돌려주는 것은 오른쪽 끝 dp[${n}][${AMOUNT}] = ${dpv(n, AMOUNT)} 하나입니다.`,
  );
}

/** 전제 — 같은 액면가가 두 번 들어가면 정본은 둘을 다른 종류로 센다. */
function buildPremise(): string {
  const cases: [number[], number][] = [
    [[1, 2], 4],
    [[1, 1, 2], 4],
    [[1, 1], 2],
  ];
  const rows = cases.map(([coins, a]) => {
    const distinct = [...new Set(coins)];
    return [
      list(coins),
      String(a),
      String(coinChangeWays(coins, a)),
      String(countLists(distinct, a).length),
    ];
  });
  const [coins, a] = cases[2] as [number[], number];
  const got = coinChangeWays(coins, a);
  const byValue = countLists([...new Set(coins)], a).length;
  return withNote(
    md(
      ["동전", "금액", "정본의 답", "값이 같은 동전을 하나로 본 조합의 수"],
      rows,
      [1, 2, 3],
    ),
    `${list(coins)}${으로(coins.at(-1) as number)} ${a}${을를(a)} 만들면 정본은 ${got}${을를(got)} 내고, 값으로 센 조합은 ${byValue} 가지입니다.`,
  );
}

/** 설계 선택 — 상태 후보 셋을 실제로 시험한다. */
function stateSize(): string {
  const n = N_MAX;
  const A = A_MAX;
  const one = amountOuter(COINS, AMOUNT)[AMOUNT] as number;
  const two = coinChangeWays(COINS, AMOUNT);
  const three = withCount(COINS, AMOUNT);
  const big1 = A + 1;
  const big2 = (n + 1) * (A + 1);
  const big3 = (n + 1) * (A + 1) ** 2;
  return withNote(
    md(
      [
        "상태",
        `${list(COINS)} / ${AMOUNT} 의 답`,
        "그때 칸 수",
        `n = ${n} · A = ${comma(A)} 의 칸 수`,
      ],
      [
        ["금액 a", String(one), comma(AMOUNT + 1), comma(big1)],
        [
          "(i, a)",
          String(two),
          comma((COINS.length + 1) * (AMOUNT + 1)),
          comma(big2),
        ],
        [
          "(i, a, 쓴 동전 개수 m)",
          String(three),
          comma((COINS.length + 1) * (AMOUNT + 1) ** 2),
          comma(big3),
        ],
      ],
      [1, 2, 3],
    ),
    `정본의 답은 ${two} 이고, 금액 a 만 둔 상태는 ${one}${을를(one)} 냅니다. (i, a, m) 상태는 답이 ${three} 로 맞지만 칸이 (i, a) 의 ${comma(big3 / big2)} 배입니다.`,
  );
}

/* ────────────────────────── 파트 1 — 수행으로 알아보는 알고리즘 ────────────────────────── */

/** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
function walkInput(): string {
  const r = coinChangeWays(COINS, AMOUNT);
  return [
    `const coins = ${list(COINS)};`,
    `const amount = ${AMOUNT};`,
    `// 이 절이 끝나면 ${r}${이가(r)} 나와야 한다`,
  ].join("\n");
}

/** walk 1 — 첫 칸을 정한 직후의 DP 테이블. 동전이 없는 입력도 함께. */
function walkInit(): string {
  const w = 4;
  const cols = (T.init[0] ?? []).map((_, a) => (a === 0 ? "a=0" : String(a)));
  const header = `      ${cols.map((c) => padL(c, w)).join("")}`;
  const lines = T.init.map(
    (row, i) =>
      `  i=${i} ${row.map((v) => padL(String(v), w)).join("")}${i === 0 ? "" : "     ← 아직 안 정한 줄"}`,
  );
  const empty = [5, 0].map((a) => {
    const t = trace([], a);
    return `coins = [], amount = ${a}  →  ${t.rows.length} 줄 × ${t.rows[0]?.length} 칸, 칸을 하나도 안 정하고 dp[0][${a}] = ${t.result} 반환`;
  });
  return [header, ...lines, "", ...empty].join("\n");
}

/** walk 2 — 두 반복문이 칸을 정하는 차례. */
function walkOrder(): string {
  const lines = COINS.map((c, j) => {
    const i = j + 1;
    const as = T.cells.filter((x) => x.i === i).map((x) => x.a);
    return `i=${i} (c=${c})   a = ${as.join(" → ")}`;
  });
  return [
    ...lines,
    "  └ 한 줄을 왼쪽 끝부터 오른쪽 끝까지 다 정한 뒤 다음 줄로 간다",
  ].join("\n");
}

/** walk 3 — 같은 줄에서 읽는 값과 윗 줄에서 읽는 값. */
function walkBranchRead(): string {
  const i = 2;
  const c = COINS[i - 1] as number;
  const cells = T.cells.filter((x) => x.i === i && x.a >= c);
  const rows = cells.map((x) => [
    `a = ${x.a}`,
    `cur[${x.a - c}] = ${dpv(i, x.a - c)}`,
    `prev[${x.a - c}] = ${dpv(i - 1, x.a - c)}`,
  ]);
  const firstDiff = cells.find((x) => dpv(i, x.a - c) !== dpv(i - 1, x.a - c));
  const at = firstDiff?.a ?? 0;
  return [
    table(
      [`i=${i} 줄, c = ${c}`, `같은 줄 cur[a-${c}]`, `윗 줄 prev[a-${c}]`],
      rows,
    ),
    `  └ 두 값이 처음 달라지는 자리는 a = ${at} 이다. cur[${at - c}] 에는 ${c}${을를(c)} 이미 쓴 조합이 들어 있다`,
  ].join("\n");
}

/** `deep.walk.pause` — 두 루프를 맞바꾸면 순서 있는 나열이 세어진다. */
function loopSwap(): string {
  return table(
    ["금액", "동전이 바깥 (이 가이드)", "금액이 바깥"],
    [3, 4, 5, 6, 10].map((amount) => [
      comma(amount),
      comma(coinChangeWays(COINS, amount)),
      comma(amountOuter(COINS, amount)[amount] as number),
    ]),
  );
}

/** `deep.walk.pause` — 금액 3 에서 두 방식이 무엇으로 갈라 세는가. */
function loopSwapPaths(): string {
  const a = 3;
  const seqs = sequences(COINS, a);
  const lastCoins = [...new Set(seqs.map((s) => s.at(-1) as number))].sort(
    (x, y) => x - y,
  );
  const i = COINS.filter((c) => c <= a).length;
  const c = COINS[i - 1] as number;
  const coins = COINS.slice(0, i);
  const lists = countLists(coins, a);
  const uses = [...new Set(lists.map((k) => k[i - 1] as number))].sort(
    (x, y) => x - y,
  );
  if (seqs.length !== amountOuter(COINS, a)[a]) {
    throw new Error("나열의 수가 금액만 기억한 방식과 다르다");
  }
  if (lists.length !== dpv(i, a)) {
    throw new Error("조합의 수가 DP 테이블과 다르다");
  }
  return [
    `금액이 바깥일 때 dp1[${a}]${이가(a)} 세는 나열 ${seqs.length} 가지 — 마지막에 넣은 동전으로 가른다`,
    ...lastCoins.map(
      (last) =>
        `  마지막이 ${last}    ${seqs
          .filter((s) => s.at(-1) === last)
          .map((s) => s.join("+"))
          .join(" · ")}`,
    ),
    "",
    `동전이 바깥일 때 dp[${i}][${a}]${이가(a)} 세는 조합 ${lists.length} 가지 — ${c}${을를(c)} 몇 개 쓰는가로 가른다`,
    ...uses.map(
      (m) =>
        `  ${c}${을를(c)} ${m} 개    ${lists
          .filter((k) => k[i - 1] === m)
          .map((k) => sumText(coins, k).replaceAll(" ", ""))
          .join(" · ")}`,
    ),
  ].join("\n");
}

/** walk 4 — 스무 걸음을 전부. 조건 판정은 실제 값으로 적는다. */
function walkTrace(): string {
  const steps = walkSteps();
  const rows: string[][] = [];
  rows.push([
    steps[0]?.id ?? "",
    "dp[0][0]",
    "—",
    "첫 칸 → ①",
    "—",
    String(T.init[0]?.[0]),
  ]);
  T.cells.forEach((c, k) => {
    const [up, left] = c.reads;
    const truth = c.branch === "copy" ? "**참**" : "**거짓**";
    rows.push([
      steps[k + 1]?.id ?? "",
      `dp[${c.i}][${c.a}]`,
      String(c.c),
      `\`${c.a} < ${c.c}\` ${truth} → ${c.branch === "copy" ? "②" : "③"}`,
      left ? `${up?.value} + ${left.value}` : String(up?.value),
      String(c.value),
    ]);
  });
  const n = COINS.length;
  rows.push([
    steps.at(-1)?.id ?? "",
    `dp[${n}][${AMOUNT}]`,
    "—",
    "읽기",
    "—",
    String(T.result),
  ]);
  const copies = T.cells.filter((c) => c.branch === "copy").length;
  const adds = T.cells.length - copies;
  return withNote(
    md(["단계", "칸", "c", "조건 판정", "읽은 값", "정한 값"], rows, [2, 5]),
    `① 이 1 칸, ② 가 ${copies} 칸, ③ 이 ${adds} 칸이고, 반환값은 ${T.result} 입니다.`,
  );
}

/** `deep.walk.pause` — 금액 0 칸을 0 으로 두면 DP 테이블 전체가 0 이 된다. */
function zeroCell(): string {
  return table(
    ["입력", "바른 코드", "첫 칸을 0 으로 둔 코드"],
    (
      [
        ["[1, 2, 5] / 0", [1, 2, 5], 0],
        ["[1, 2, 5] / 5", [1, 2, 5], 5],
        ["[1, 2, 3] / 4", [1, 2, 3], 4],
        ["[1] / 10000", [1], 10_000],
      ] as [string, number[], number][]
    ).map(([이름, coins, amount]) => [
      이름,
      comma(coinChangeWays(coins, amount)),
      comma(첫칸이0.coinChangeWays(coins, amount)),
    ]),
  );
}

/** `deep.walk.pause` — 칸의 값은 dp[0][0] 까지 거슬러 가는 길의 수다. 기록의 읽은 칸을 따라 센다. */
function zeroCellPaths(): string {
  const reads = new Map<string, Cell>();
  for (const c of T.cells) reads.set(`${c.i},${c.a}`, c);
  const memo = new Map<string, number>();
  const paths = (i: number, a: number): number => {
    const key = `${i},${a}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let v: number;
    if (i === 0) v = a === 0 ? 1 : 0;
    else {
      const c = reads.get(key) as Cell;
      v = c.reads.reduce((s, r) => s + paths(r.at[0], r.at[1]), 0);
    }
    memo.set(key, v);
    return v;
  };
  const n = COINS.length;
  let same = 0;
  const rows = (T.rows[n] as readonly number[]).map((v, a) => {
    const p = paths(n, a);
    if (p === v) same++;
    return [`dp[${n}][${a}]`, String(v), String(p)];
  });
  const nonzero = (T.init[0] ?? []).filter((v) => v !== 0).length;
  return withNote(
    md(
      ["칸", "값", "읽은 칸을 따라 dp[0][0] 까지 거슬러 가는 길의 수"],
      rows,
      [1, 2],
    ),
    `${rows.length} 칸 가운데 ${same} 칸에서 값과 길의 수가 같습니다. i=0 줄에서 0 이 아닌 칸은 ${nonzero} 개, dp[0][0] 뿐입니다.`,
  );
}

/** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
function finalRun(): string {
  const 목록: [string, number[], number][] = [
    ["coinChangeWays([1, 2, 5], 5)", [1, 2, 5], 5],
    ["coinChangeWays([1, 2, 3], 4)", [1, 2, 3], 4],
    ["coinChangeWays([2], 3)", [2], 3],
    ["coinChangeWays([1, 2, 5], 0)", [1, 2, 5], 0],
    ["coinChangeWays([], 5)", [], 5],
    ["coinChangeWays([5, 10], 3)", [5, 10], 3],
    ["coinChangeWays([1], 10000)", [1], 10_000],
  ];
  const 폭 = Math.max(...목록.map(([s]) => s.length));
  return 목록
    .map(
      ([s, coins, amount]) =>
        `${pad(s, 폭)}  →  ${padL(comma(coinChangeWays(coins, amount)), 3)}`,
    )
    .join("\n");
}

/* ────────────────────────── 파트 1 — 알아 두면 좋은 개념 ────────────────────────── */

const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const pow = (e: number): string =>
  e === 0
    ? "1"
    : e === 1
      ? "x"
      : `x${[...String(e)].map((d) => SUP[Number(d)]).join("")}`;

/** 계수 목록을 다항식으로 — 0 인 항은 뺀다. */
function poly(coef: readonly number[]): string {
  const terms = coef.flatMap((v, e) =>
    v === 0 ? [] : [e === 0 ? String(v) : `${v === 1 ? "" : v}${pow(e)}`],
  );
  return terms.length === 0 ? "0" : terms.join(" + ");
}

/** `related` — DP 테이블의 줄을 계수로 읽고, 급수의 곱을 따로 전개해 맞댄다. */
function relatedGf(): string {
  const n = COINS.length;
  let prod = new Array<number>(AMOUNT + 1).fill(0);
  prod[0] = 1;
  const rows: string[][] = [["i=0", `\`${poly(T.rows[0] as number[])}\``, "—"]];
  COINS.forEach((c, j) => {
    const series = new Array<number>(AMOUNT + 1).fill(0);
    for (let e = 0; e <= AMOUNT; e += c) series[e] = 1;
    const next = new Array<number>(AMOUNT + 1).fill(0);
    for (let x = 0; x <= AMOUNT; x++) {
      for (let y = 0; x + y <= AMOUNT; y++) {
        next[x + y] =
          (next[x + y] as number) + (prod[x] as number) * (series[y] as number);
      }
    }
    prod = next;
    const i = j + 1;
    if (prod.join() !== (T.rows[i] as number[]).join()) {
      throw new Error(`급수 ${i} 개를 곱한 계수가 i=${i} 줄과 다르다`);
    }
    const shown = series
      .flatMap((v, e) => (v === 0 ? [] : [pow(e)]))
      .concat("…")
      .join(" + ");
    rows.push([
      `i=${i}`,
      `\`${poly(T.rows[i] as number[])}\``,
      `\`${shown}\` (동전 ${c})`,
    ]);
  });
  return withNote(
    md(["DP 테이블의 줄", "계수로 읽은 다항식", "앞 줄에 곱한 급수"], rows),
    `급수 ${n} 개를 곱해 ${pow(AMOUNT)} 까지 따로 전개한 계수는 ${show(prod)} 이고, i=${n} 줄의 값 ${show(T.rows[n] as number[])}${과와(AMOUNT)} 같습니다.`,
  );
}

/* ────────────────────────── 파트 2 — 수식 정의와 유도 ────────────────────────── */

/** `deep.math` ② — 정의를 작은 값에 넣은 검산. */
function mathCheck(): string {
  const i = 2;
  const a = 4;
  const coins = COINS.slice(0, i);
  const lists = countLists(coins, a);
  const eq = coins
    .map((c, j) => (c === 1 ? `k_${j + 1}` : `${c}k_${j + 1}`))
    .join(" + ");
  const lines = lists.map((k) => `  (${k.join(", ")})   ${sumText(coins, k)}`);
  return [
    `${eq} = ${a},  ${coins.map((_, j) => `k_${j + 1} ≥ 0`).join(",  ")}`,
    "",
    ...lines,
    `                          |{…}| = ${lists.length}  →  dp[${i}][${a}] = ${dpv(i, a)}`,
  ].join("\n");
}

/** `deep.math` — 식을 옮긴 코드와 그 값. 값은 식을 기록된 DP 테이블 위에서 실행해 받는다. */
function mathCode(): string {
  const dp = T.rows;
  const cell = (i: number, a: number): number => {
    const c = COINS[i - 1] as number;
    const prev = dp[i - 1] as readonly number[];
    const cur = dp[i] as readonly number[];
    return a < c
      ? (prev[a] as number)
      : (prev[a] as number) + (cur[a - c] as number);
  };
  const n = COINS.length;
  const v = cell(n, AMOUNT);
  if (v !== coinChangeWays(COINS, AMOUNT)) {
    throw new Error("식이 정본과 다른 값을 낸다");
  }
  const c = COINS[n - 1] as number;
  return [
    "const cell = (i: number, a: number): number => {",
    "  const c = coins[i - 1] as number;",
    "  const prev = dp[i - 1] as number[];",
    "  const cur = dp[i] as number[];",
    "  return a < c",
    "    ? (prev[a] as number)",
    "    : (prev[a] as number) + (cur[a - c] as number);",
    "};",
    "",
    `cell(${n}, ${AMOUNT}); // → dp[${n - 1}][${AMOUNT}] + dp[${n}][${AMOUNT - c}] = ${dpv(n - 1, AMOUNT)} + ${dpv(n, AMOUNT - c)} = ${v}`,
  ].join("\n");
}

/** `deep.math` ② — 닫힌 형태 `⌊a/c⌋ + 1` 이 DP 테이블을 채운 값과 같은지 검산한다. */
function closedForm(): string {
  return table(
    ["c", "a", "DP 테이블을 채운 값", "⌊a/c⌋ + 1", ""],
    (
      [
        [2, 1],
        [2, 10],
        [2, 10_000],
        [3, 17],
        [5, 100],
      ] as [number, number][]
    ).map(([c, a]) => {
      const 표 = coinChangeWays([1, c], a);
      const 식 = Math.floor(a / c) + 1;
      return [
        String(c),
        comma(a),
        comma(표),
        comma(식),
        표 === 식 ? "같다" : "다르다",
      ];
    }),
  );
}

/** `deep.math` ④ — 칸 수와 답의 크기를 과제 규모에서 나란히 놓는다. */
function cellsVsAnswer(): string {
  return table(
    ["n", "A", "칸 수 (n+1)(A+1)", "조합의 수"],
    (
      [
        [3, 5],
        [3, 100],
        [3, 10_000],
        [N_MAX, A_MAX],
      ] as [number, number][]
    ).map(([n, A]) => [
      comma(n),
      comma(A),
      comma((n + 1) * (A + 1)),
      big(coinChangeWays(n === 3 ? COINS : upTo(N_MAX), A)),
    ]),
  );
}

/* ────────────────────────── 파트 2 — 불변식 ────────────────────────── */

/** `invariant` ② — 모든 칸을 정의대로 센 값과 맞댄다. */
function invariantCells(): string {
  let total = 0;
  let wrong = 0;
  const rows = T.rows.map((row, i) => {
    const coins = COINS.slice(0, i);
    const direct = row.map((_, a) => countLists(coins, a).length);
    const bad = row.filter((v, a) => v !== direct[a]).length;
    total += row.length;
    wrong += bad;
    return [`i=${i}`, show(row), show(direct), String(bad)];
  });
  return withNote(
    md(
      ["줄", "DP 테이블의 값", "개수 목록을 직접 센 수", "어긋난 칸"],
      rows,
      [3],
    ),
    `정의대로 직접 센 값과 DP 테이블의 값을 ${total} 칸에서 대조했고, 어긋난 칸은 ${wrong} 개입니다.`,
  );
}

/** `invariant` ② — 경계에 있는 입력. 칸을 어느 갈래로 정했는지 기록에서 센다. */
function invariantEdges(): string {
  const cases: [string, number[], number][] = [
    ["coins=[], amount=0", [], 0],
    ["coins=[], amount=5", [], 5],
    ["coins=[1, 2, 5], amount=0", [1, 2, 5], 0],
    ["coins=[5, 10], amount=3", [5, 10], 3],
    ["coins=[10], amount=10", [10], 10],
    ["coins=[1], amount=10000", [1], 10_000],
  ];
  const rows = cases.map(([name, coins, amount]) => {
    const t = trace(coins, amount);
    const copies = t.cells.filter((c) => c.branch === "copy").length;
    return [
      `\`${name}\``,
      `${comma(t.rows.length)} × ${comma(t.rows[0]?.length ?? 0)}`,
      comma(copies),
      comma(t.cells.length - copies),
      comma(t.result),
    ];
  });
  return withNote(
    md(
      ["입력", "줄 × 칸", "윗 칸을 옮긴 칸", "두 칸을 더한 칸", "반환"],
      rows,
      [2, 3, 4],
    ),
    `${cases.length} 입력 모두 칸을 두 갈래 가운데 하나로만 정했습니다.`,
  );
}

/** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
function mutantPrev(): string {
  return table(
    ["입력", "바른 코드", "윗 줄에서 읽은 코드"],
    윗줄표.map(([이름, coins, amount]) => [
      이름,
      comma(coinChangeWays(coins, amount)),
      comma(윗줄에서읽기.coinChangeWays(coins, amount)),
    ]),
  );
}

/** `invariant` ③ — 윗 줄에서 읽으면 종류마다 한 개까지만 쓴 조합만 남는다. */
function mutantPrevLeft(): string {
  const lists = countLists(COINS, AMOUNT);
  const rows = lists.map((k) => {
    const most = Math.max(...k);
    return [
      sumText(COINS, k),
      String(most),
      most <= 1 ? "센다" : "세지 않는다",
    ];
  });
  const kept = lists.filter((k) => Math.max(...k) <= 1).length;
  const got = 윗줄에서읽기.coinChangeWays(COINS, AMOUNT);
  if (!중화 && got !== kept) {
    throw new Error("한 개까지만 쓴 조합의 수가 변이의 값과 다르다");
  }
  return withNote(
    md(
      ["조합", "한 종류를 가장 많이 쓴 개수", "윗 줄에서 읽은 코드"],
      rows,
      [1],
    ),
    `${lists.length} 조합 가운데 ${kept} 가지가 남고, 윗 줄에서 읽은 코드가 낸 값은 ${got} 입니다.`,
  );
}

/* ────────────────────────── 파트 2 — 비용 계산 ────────────────────────── */

/** `perf.derive` — 전개의 걸음이 무엇을 셌는가. */
function perfDerive(): string {
  const steps = walkSteps();
  const copies = T.cells.filter((c) => c.branch === "copy").length;
  const adds = T.cells.length - copies;
  const first = steps[1]?.id ?? "";
  const lastCell = steps[T.cells.length]?.id ?? "";
  return [
    `${pad(steps[0]?.id ?? "", 9)}  DP 테이블 ${T.rows.length} × ${T.rows[0]?.length} 칸을 0 으로 깔고 dp[0][0] 하나를 1 로`,
    `${pad(`${first}~${lastCell}`, 9)}  칸 ${T.cells.length} 개를 한 걸음에 한 칸씩 — ② ${copies} 칸 · ③ ${adds} 칸`,
    `${pad(steps.at(-1)?.id ?? "", 9)}  dp[${COINS.length}][${AMOUNT}] 한 칸을 읽는다`,
    `${" ".repeat(11)}└ 칸마다 비교 1 번, ③ 이면 덧셈이 1 번 더`,
  ].join("\n");
}

/** `perf.worst` — 동전의 값이 달라도 정한 칸 수는 같다. 기록의 칸 수를 센다. */
function perfWorst(): string {
  const cases: [string, number[]][] = [
    [`1 … ${N_MAX}`, upTo(N_MAX)],
    [
      `${comma(A_MAX - N_MAX + 1)} … ${comma(A_MAX)}`,
      upTo(N_MAX).map((x) => A_MAX - N_MAX + x),
    ],
  ];
  const counts = cases.map(([, coins]) => {
    const t = trace(coins, A_MAX);
    const copies = t.cells.filter((c) => c.branch === "copy").length;
    return { cells: t.cells.length, copies, adds: t.cells.length - copies };
  });
  const rows = cases.map(([name], k) => {
    const c = counts[k] as { cells: number; copies: number; adds: number };
    return [name, comma(A_MAX), comma(c.cells), comma(c.copies), comma(c.adds)];
  });
  const cells = counts[0]?.cells ?? 0;
  return withNote(
    md(
      ["동전", "금액", "정한 칸", "② 로 정한 칸", "③ 으로 정한 칸"],
      rows,
      [1, 2, 3, 4],
    ),
    `두 입력 모두 정한 칸이 ${comma(cells)} 개이고, 첫 줄 ${comma(A_MAX + 1)} 칸을 더하면 ${comma(cells + A_MAX + 1)} 칸입니다.`,
  );
}

/** `perf.worst` — 답이 2^53 을 넘는 자리에서 반환값이 정확한 정수가 아니게 된다. */
function floatLimit(): string {
  return table(
    ["동전", "금액", "정확한 답", "이 코드가 낸 값", "차이"],
    [200, 299, 300, 301].map((amount) => {
      const 정확 = exact(upTo(N_MAX), amount);
      const 낸값 = coinChangeWays(upTo(N_MAX), amount);
      return [
        `1 … ${N_MAX}`,
        comma(amount),
        쉼표(정확),
        comma(낸값),
        쉼표(BigInt(낸값) - 정확),
      ];
    }),
  );
}

/** `perf.worst` — 2^53 과 두 금액의 답. */
function float2p53(): string {
  const limit = 2n ** 53n;
  const rows = [299, 300].map((a) => {
    const e = exact(upTo(N_MAX), a);
    const safe = e <= limit;
    const shown = Number(e).toExponential(2).replace("e+", " × 10^");
    return `  a = ${a}   답 ${shown}  ${safe ? "<" : ">"} 2^53   → ${safe ? "정확하다" : "덧셈 결과가 가장 가까운 표현 가능한 수로 옮겨진다"}`;
  });
  return [`2^53 = ${쉼표(limit)}`, "", ...rows].join("\n");
}

/* ────────────────────────── 파트 2 — 스스로 점검하기 ────────────────────────── */

/** 스스로 점검하기 — 물음의 자리. */
function selfcheckQ(): string {
  const c = cellAt(2, 4);
  const [up, left] = c.reads;
  const id = walkSteps()[T.cells.indexOf(c) + 1]?.id ?? "";
  return [
    `${id} :  dp[2][4] = dp[${up?.at[0]}][${up?.at[1]}] + dp[${left?.at[0]}][${left?.at[1]}]`,
    `                ${up?.value}    +     ${left?.value}`,
    `       dp[${left?.at[0]}][${left?.at[1]}]${이가(left?.at[1] ?? 0)} 뜻하는 조합 ${left?.value} 가지 = ?`,
  ].join("\n");
}

/** 스스로 점검하기 답 — 이웃 칸의 조합과 dp[2][4] 의 조합을 짝짓는다. */
function selfcheckA(): string {
  const coins = COINS.slice(0, 2);
  const c = coins[1] as number;
  const left = countLists(coins, 4 - c);
  const up = countLists(coins.slice(0, 1), 4);
  const lines = left.map((k) => {
    const more = k.map((m, j) => (j === 1 ? m + 1 : m));
    return `  ${pad(sumText(coins, k), 14)}→  ${sumText(coins, more)}`;
  });
  if (left.length + up.length !== dpv(2, 4)) {
    throw new Error("두 무리의 합이 dp[2][4] 와 다르다");
  }
  return [
    `dp[2][2] 의 조합 ${left.length} 가지 — ${c}${을를(c)} 한 개 더하면`,
    ...lines,
    `dp[1][4] 의 조합 ${up.length} 가지 — ${c}${을를(c)} 안 쓴 것`,
    ...up.map((k) => `  ${sumText(coins.slice(0, 1), k)}`),
    `  └ 합쳐서 ${left.length + up.length} 가지 = dp[2][4] = ${dpv(2, 4)}`,
  ].join("\n");
}

/* ────────────────────────── 경쟁 설계 ────────────────────────── */

/** `purpose.alt` — 두 입력에서 값을 정한 칸의 비와 깊이를 `.alt.ts` 계수에서 낸다. */
function altRatio(): string {
  const get = (name: string, key: string): number => {
    const run = benchCases[name];
    if (!run) throw new Error(`벤치 케이스 ${name} 가 없다`);
    const v = (run() as Record<string, number>)[key];
    if (v === undefined) throw new Error(`계수 ${key} 가 없다`);
    return v;
  };
  const upA = get("상향식 표 (이 가이드) · 액면가 [1,2,5]", "값을 정한 칸");
  const downA = get("하향식 메모 · 액면가 [1,2,5]", "값을 정한 칸");
  const depthA = get("하향식 메모 · 액면가 [1,2,5]", "최대 깊이");
  const upB = get(
    "상향식 표 (이 가이드) · 액면가 [3000,5000,7000]",
    "값을 정한 칸",
  );
  const downB = get("하향식 메모 · 액면가 [3000,5000,7000]", "값을 정한 칸");
  const depthB = get("하향식 메모 · 액면가 [3000,5000,7000]", "최대 깊이");
  const n = (v: number) => v.toLocaleString("en-US");
  const rA = (upA / downA).toFixed(2);
  const rB = n(Math.round(upB / downB));
  const unused = Math.floor(((upB - downB) / upB) * 1000) / 10;
  return [
    `**입력에 따라 순서가 뒤집힙니다.** A 에서는 값을 정한 칸이 ${n(upA)} 대 ${n(downA)}${으로(n(downA))} ${rA} 배 차이인데 하향식은`,
    `아직 못 구한 칸을 ${n(depthA)} 개까지 쌓아야 해요. 재귀로 적으면 그 깊이가 그대로 호출 스택이라 \`amount\` 가 조금만`,
    `더 커지면 실행이 끝나지 않습니다. B 에서는 반대예요. 값을 정한 칸이 ${n(upB)} 대 ${n(downB)}${으로(n(downB))} ${rB} 배이고 깊이는 ${depthB}`,
    `뿐이라, 상향식이 채운 칸의 ${unused.toFixed(1)} % 가 답에 쓰이지 않았습니다.`,
  ].join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 조합을 종류마다의 개수로 적는다. */
  "concept-combos": conceptCombos,
  /** `deep.origin` ② — 완전 탐색이 만드는 잎의 수는 답 자체다. */
  "brute-leaves": bruteLeaves,
  /** `deep.origin` ③ — 같은 (i, rest) 에 오는 두 길. */
  "origin-same-state": originSameState,
  /** `deep.origin` ④ — 호출 수와 서로 다른 짝의 수. */
  "repeat-vs-state": repeatVsState,
  /** `deep.origin` ⑤ — 금액 하나만 기억한 방식의 값. */
  "amount-only": amountOnly,
  /** `deep.origin` ⑤ — 그 방식이 센 차례를 조합마다 모은다. */
  "amount-only-list": amountOnlyList,
  /** `deep.build` (b) — 마지막 줄의 칸마다 세는 조합. */
  "build-cell-meaning": buildCellMeaning,
  /** `deep.build` (c) — dp[2][4] 를 이름에서 조합까지. */
  "build-read-one": buildReadOne,
  /** `deep.build` (d) — dp[2][4] 의 조합을 두 무리로 가른다. */
  "build-neighbor-split": buildNeighborSplit,
  /** `deep.build` 1단계 — DP 테이블의 크기. */
  "build-size": buildSize,
  /** `deep.build` 2단계 — 같은 줄에서 읽는 칸은 이미 정해졌다. */
  "build-fill-row": buildFillRow,
  /** `deep.build` 3단계 — 마지막 줄의 칸이 금액마다의 답이다. */
  "build-answer": buildAnswer,
  /** `deep.build` 전제 — 같은 액면가가 두 번 들어간 입력. */
  "build-premise": buildPremise,
  /** `deep.build` 설계 선택 — 상태 후보 셋. */
  "state-size": stateSize,
  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 첫 칸을 정한 직후의 DP 테이블. */
  "walk-init": walkInit,
  /** `deep.walk` 2 — 칸을 정하는 차례. */
  "walk-order": walkOrder,
  /** `deep.walk` 3 — 같은 줄과 윗 줄에서 읽는 값. */
  "walk-branch-read": walkBranchRead,
  /** `deep.walk.pause` — 두 루프를 맞바꾸면 순서 있는 나열이 세어진다. */
  "loop-swap": loopSwap,
  /** `deep.walk.pause` — 두 방식이 가르는 기준. */
  "loop-swap-paths": loopSwapPaths,
  /** `deep.walk` 4 — 스무 걸음. */
  "walk-trace": walkTrace,
  /** `deep.walk.pause` — 금액 0 칸을 0 으로 두면 DP 테이블 전체가 0 이 된다. */
  "zero-cell": zeroCell,
  /** `deep.walk.pause` — 칸의 값은 dp[0][0] 에 닿는 길의 수다. */
  "zero-cell-paths": zeroCellPaths,
  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": finalRun,
  /** `related` — 줄을 계수로 읽은 다항식과 급수의 곱. */
  "related-gf": relatedGf,
  /** `purpose.alt` — 두 입력의 값을 정한 칸의 비와 깊이. */
  "alt-ratio": altRatio,
  /** `purpose.real` — 인용한 두 자료의 값을 이 글의 코드로 재현한다. */
  "library-check": () =>
    table(
      ["어디서", "그 자료가 적은 값", "이 글의 코드"],
      바깥값.map(([이름, coins, amount, 적힌값]) => [
        이름,
        comma(적힌값),
        comma(coinChangeWays(coins, amount)),
      ]),
    ),
  /** `deep.math` ② — 정의를 작은 값에 넣은 검산. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드와 그 값. */
  "math-code": mathCode,
  /** `deep.math` ② — 닫힌 형태의 검산. */
  "closed-form": closedForm,
  /** `deep.math` ④ — 칸 수와 답의 크기. */
  "cells-vs-answer": cellsVsAnswer,
  /** `invariant` ② — 모든 칸을 정의대로 센 값과 맞댄다. */
  "invariant-cells": invariantCells,
  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 윗 줄에서 읽은 변이의 값. */
  "mutant-prev": mutantPrev,
  /** `invariant` ③ — 그 변이가 남기는 조합. */
  "mutant-prev-left": mutantPrevLeft,
  /** `perf.derive` — 걸음이 센 칸. */
  "perf-derive": perfDerive,
  /** `perf.worst` — 동전 값과 무관한 칸 수. */
  "perf-worst": perfWorst,
  /** `perf.worst` — 답이 2^53 을 넘는 자리. */
  "float-limit": floatLimit,
  /** `perf.worst` — 2^53 과 두 답. */
  "float-2p53": float2p53,
  /** `selfcheck` — 물음. */
  "selfcheck-q": selfcheckQ,
  /** `selfcheck` — 답. */
  "selfcheck-a": selfcheckA,
};
