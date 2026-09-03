/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/digitDp/digitDp-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { digitDp } from "./digitDp-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1961241` → `1,961,241`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
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

/* ────────────────────────── 계측판 ────────────────────────── */

/** 전개가 쓰는 입력. 본문의 다른 자리도 같은 값을 가리킨다. */
const WALK_N = 194;
const WALK_K = 10;

/** 본문이 여러 자리에서 함께 거는 입력 묶음. */
const SAMPLES: [number, number][] = [
  [WALK_N, WALK_K],
  [20, 2],
  [100, 1],
  [100, 2],
  [100, 0],
  [99, 18],
  [999, 27],
  [1000, 1],
];

/** 자릿수 배열. */
const digitsOf = (N: number): number[] => [...String(N)].map(Number);

/** 하나씩 세는 방법 — 자리를 떼어낸 횟수를 함께 돌려준다. */
function oneByOne(N: number, K: number): { answer: number; strips: number } {
  let answer = 0;
  let strips = 0;
  for (let x = 1; x <= N; x++) {
    let s = 0;
    let v = x;
    while (v > 0) {
      strips++;
      s += v % 10;
      v = Math.floor(v / 10);
    }
    if (s === K) answer++;
  }
  return { answer, strips };
}

/** 1 부터 N 까지의 자릿수 개수 합. 자리 수별로 몇 개인지를 세어 더한다. */
function stripCount(N: bigint): bigint {
  let total = 0n;
  let low = 1n;
  let d = 1n;
  while (low <= N) {
    const high = low * 10n - 1n;
    const last = high < N ? high : N;
    total += (last - low + 1n) * d;
    low *= 10n;
    d += 1n;
  }
  return total;
}

/** 기억하지 않는 재귀 — 호출 수와 서로 다른 상태 수를 함께 센다. */
function noMemo(
  N: number,
  K: number,
): { answer: number; calls: number; states: number } {
  const digits = digitsOf(N);
  const L = digits.length;
  let calls = 0;
  const seen = new Set<string>();
  const go = (pos: number, sum: number, tight: boolean): number => {
    calls++;
    seen.add(`${pos}|${sum}|${tight ? 1 : 0}`);
    if (sum + 9 * (L - pos) < K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    const limit = tight ? (digits[pos] as number) : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      if (sum + x > K) break;
      total += go(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }
    return total;
  };
  const answer = go(0, 0, true) - (K === 0 ? 1 : 0);
  return { answer, calls, states: seen.size };
}

/** 상한을 언제나 9 로 두는 판 — `tight` 를 아예 보지 않는다. */
function alwaysNine(N: number, K: number): number {
  const L = digitsOf(N).length;
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );
  const go = (pos: number, sum: number): number => {
    if (sum + 9 * (L - pos) < K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    const done = (memo[pos] as number[])[sum] as number;
    if (done !== -1) return done;
    let total = 0;
    for (let x = 0; x <= 9; x++) {
      if (sum + x > K) break;
      total += go(pos + 1, sum + x);
    }
    (memo[pos] as number[])[sum] = total;
    return total;
  };
  return go(0, 0) - (K === 0 ? 1 : 0);
}

/** `(pos, sum)` 한 칸에 tight 상태의 값과 자유 상태의 값을 함께 담는 판. */
function sharedTable(N: number, K: number): number {
  const digits = digitsOf(N);
  const L = digits.length;
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );
  const go = (pos: number, sum: number, tight: boolean): number => {
    if (sum + 9 * (L - pos) < K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    const done = (memo[pos] as number[])[sum] as number;
    if (done !== -1) return done;
    const limit = tight ? (digits[pos] as number) : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      if (sum + x > K) break;
      total += go(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }
    (memo[pos] as number[])[sum] = total;
    return total;
  };
  return go(0, 0, true) - (K === 0 ? 1 : 0);
}

/** 정본과 같은 절차에 계수를 붙인 판. 가지치기를 끌 수 있다. */
function instrumented(
  N: number,
  K: number,
  prune = true,
): {
  answer: number;
  visits: number;
  stored: number;
  tightVisits: number;
  tightRepeat: number;
} {
  const digits = digitsOf(N);
  const L = digits.length;
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );
  let visits = 0;
  let stored = 0;
  let tightVisits = 0;
  let tightRepeat = 0;
  const tightSeen = new Set<string>();
  const go = (pos: number, sum: number, tight: boolean): number => {
    visits++;
    if (tight) {
      tightVisits++;
      const key = `${pos}|${sum}`;
      if (tightSeen.has(key)) tightRepeat++;
      tightSeen.add(key);
    }
    if (prune && sum + 9 * (L - pos) < K) return 0;
    if (pos === L) return sum === K ? 1 : 0;
    if (!tight) {
      const done = (memo[pos] as number[])[sum] as number;
      if (done !== -1) return done;
    }
    const limit = tight ? (digits[pos] as number) : 9;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      if (sum + x > K) break;
      total += go(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }
    if (!tight) {
      (memo[pos] as number[])[sum] = total;
      stored++;
    }
    return total;
  };
  const answer = go(0, 0, true) - (K === 0 ? 1 : 0);
  return { answer, visits, stored, tightVisits, tightRepeat };
}

/* ─────────────────── 전개 한 벌 — 정해진 값을 모은다 ─────────────────── */

interface Decision {
  branch: string;
  picks: number[];
  breakAt: number | null;
  value: number;
}

/** 자리 `pos` 에 상태 `sum`·`tight` 로 왔을 때 무엇이 정해졌는지 모은다. */
function walkDecisions(
  N: number,
  K: number,
): { at: Map<string, Decision>; hits: Map<string, number>; memo: number[][] } {
  const digits = digitsOf(N);
  const L = digits.length;
  const memo: number[][] = Array.from({ length: L }, () =>
    new Array<number>(K + 1).fill(-1),
  );
  const at = new Map<string, Decision>();
  const hits = new Map<string, number>();
  const go = (pos: number, sum: number, tight: boolean): number => {
    const key = `${pos}|${sum}|${tight ? "T" : "F"}`;
    if (sum + 9 * (L - pos) < K) {
      at.set(key, { branch: "①", picks: [], breakAt: null, value: 0 });
      return 0;
    }
    if (pos === L) return sum === K ? 1 : 0;
    if (!tight) {
      const done = (memo[pos] as number[])[sum] as number;
      if (done !== -1) {
        hits.set(key, (hits.get(key) ?? 0) + 1);
        return done;
      }
    }
    const limit = tight ? (digits[pos] as number) : 9;
    const picks: number[] = [];
    let breakAt: number | null = null;
    let total = 0;
    for (let x = 0; x <= limit; x++) {
      if (sum + x > K) {
        breakAt = x;
        break;
      }
      picks.push(x);
      total += go(pos + 1, sum + x, tight && x === (digits[pos] as number));
    }
    if (!tight) {
      (memo[pos] as number[])[sum] = total;
      at.set(key, { branch: "⑤", picks, breakAt, value: total });
    } else {
      at.set(key, { branch: "—", picks, breakAt, value: total });
    }
    return total;
  };
  go(0, 0, true);
  return { at, hits, memo };
}

/** 갈라지는 자리별 개수 — `[0, N]` 을 자리로 가른다. */
function splitByPosition(N: number): { rows: string[][]; total: bigint } {
  const digits = digitsOf(N);
  const L = digits.length;
  const rows: string[][] = [];
  let total = 0n;
  for (let pos = 0; pos < L; pos++) {
    const free = L - pos - 1;
    const cnt = BigInt(digits[pos] as number) * 10n ** BigInt(free);
    total += cnt;
    const prefix = digits.slice(0, pos).join("");
    rows.push([
      `자리 ${pos}`,
      `${prefix === "" ? "(없다)" : prefix} 뒤에 ${digits[pos] as number} 보다 작은 숫자`,
      String(free),
      comma(cnt),
    ]);
  }
  total += 1n;
  rows.push(["끝까지 같다", `${N} 자신`, "0", "1"]);
  return { rows, total };
}

/** 자유 자리 m 개를 합 t 로 채우는 방법 수 — 표로 센다. */
function fillWays(m: number, t: number): bigint {
  if (t < 0) return 0n;
  let row: bigint[] = [1n, ...new Array<bigint>(t).fill(0n)];
  for (let i = 0; i < m; i++) {
    const next = new Array<bigint>(t + 1).fill(0n);
    for (let s = 0; s <= t; s++)
      for (let x = 0; x <= 9 && x <= s; x++)
        next[s] = (next[s] as bigint) + (row[s - x] as bigint);
    row = next;
  }
  return row[t] as bigint;
}

/** 이항계수. 앞에서부터 곱하고 나눈다 — 매 걸음이 정수라 나누어떨어진다. */
function binom(n: number, r: number): bigint {
  if (r < 0 || n < 0 || r > n) return 0n;
  const k = Math.min(r, n - r);
  let v = 1n;
  for (let i = 1; i <= k; i++) v = (v * BigInt(n - k + i)) / BigInt(i);
  return v;
}

/** 같은 닫힌 형태를 **배정밀도 정수**로 계산한 판. 중간 항이 정확 범위를 넘는다. */
function closedDouble(N: number, K: number): number {
  const nBinom = (n: number, r: number): number => {
    if (r < 0 || n < 0 || r > n) return 0;
    const k = Math.min(r, n - r);
    let v = 1;
    for (let i = 1; i <= k; i++) v = (v * (n - k + i)) / i;
    return v;
  };
  const w = (m: number, t: number): number => {
    if (t < 0) return 0;
    if (m === 0) return t === 0 ? 1 : 0;
    let s = 0;
    for (let j = 0; j * 10 <= t; j++)
      s +=
        (j % 2 === 0 ? 1 : -1) *
        nBinom(m, j) *
        nBinom(t - 10 * j + m - 1, m - 1);
    return s;
  };
  const d = digitsOf(N);
  const L = d.length;
  let total = 0;
  let prefix = 0;
  for (let pos = 0; pos < L; pos++) {
    for (let x = 0; x < (d[pos] as number); x++) {
      const t = K - prefix - x;
      if (t < 0) break;
      total += w(L - pos - 1, t);
    }
    prefix += d[pos] as number;
    if (prefix > K) break;
  }
  if (prefix === K) total += 1;
  return K === 0 ? total - 1 : total;
}

/** 별과 막대 + 포함배제로 낸 닫힌 형태. */
function closedWays(m: number, t: number): bigint {
  if (t < 0) return 0n;
  if (m === 0) return t === 0 ? 1n : 0n;
  let s = 0n;
  for (let j = 0; j * 10 <= t; j++) {
    const term = binom(m, j) * binom(t - 10 * j + m - 1, m - 1);
    s += j % 2 === 0 ? term : -term;
  }
  return s;
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 변이를 **정본 소스에서** 만든다. 손으로 베낀 사본을 쓰면 「한 곳만 바꿨다」가 검사되지
 * 않는다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const REF = new URL("./digitDp-guide.ref.ts", import.meta.url).pathname;

/** `tight` 를 자리마다 다시 정하지 않고 그대로 물려주는 판. */
const 물려주기 = await loadMutant<{
  digitDp(N: number, K: number): number;
}>(REF, {
  swap: [/tight && x === \(digits\[pos\] as number\)/, "tight"],
});

/** 표를 읽을 때 `tight` 를 안 보는 판 — ③ 의 가드를 뺀다. */
const 가드없이읽기 = await loadMutant<{
  digitDp(N: number, K: number): number;
}>(REF, { swap: [/if \(!tight\) \{$/, "{"] });

/** 수 0 을 빼지 않는 판 — ⑥ 을 뺀다. */
const 안빼기 = await loadMutant<{
  digitDp(N: number, K: number): number;
}>(REF, {
  swap: [
    /return count\(0, 0, true\) - \(K === 0 \? 1 : 0\);/,
    "return count(0, 0, true);",
  ],
});

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 하나씩 세는 방법이 제약 상한에서 몇 번 하는 일이 되는가. */
  naiveScale: () => {
    const rows: string[][] = [];
    for (const e of [1, 2, 3, 4, 5, 6]) {
      const N = 10 ** e;
      rows.push([
        `10^${e}`,
        comma(N),
        comma(oneByOne(N, 10).strips),
        comma(stripCount(BigInt(N))),
      ]);
    }
    for (const e of [9, 12, 15]) {
      rows.push([
        `10^${e}`,
        comma(10n ** BigInt(e)),
        "세지 못했다",
        comma(stripCount(10n ** BigInt(e))),
      ]);
    }
    return table(
      ["상한 N", "검사하는 수", "실제로 센 자리 떼기", "식으로 낸 자리 떼기"],
      rows,
    );
  },

  /** 같은 상태로 오는 갈래가 몇 개인가 — 기억하지 않는 재귀와 상태 수를 나란히. */
  repeatState: () => {
    const rows: string[][] = [];
    for (const L of [3, 5, 7, 9, 11, 13, 15]) {
      const N = Number("9".repeat(L));
      const { calls, states, answer } = noMemo(N, 10);
      rows.push([
        `9 를 ${L} 개`,
        comma(calls),
        comma(states),
        comma(Math.round(calls / states)),
        comma(answer),
      ]);
    }
    return table(
      ["상한 N", "기억하지 않는 재귀의 호출", "서로 다른 상태", "배수", "답"],
      rows,
    );
  },

  /** 상태 정의 후보를 실제로 시험한다. */
  stateShape: () => {
    const rows: string[][] = [];
    const cases: [string, number, number][] = [
      ["N=194 · K=10", WALK_N, WALK_K],
      ["N=100 · K=2", 100, 2],
      ["N=10^15 · K=50", 10 ** 15, 50],
    ];
    for (const [name, N, K] of cases) {
      rows.push([
        name,
        comma(digitDp(N, K)),
        comma(alwaysNine(N, K)),
        comma(sharedTable(N, K)),
      ]);
    }
    return table(
      [
        "입력",
        "tight 를 상태에 담는다",
        "상한을 언제나 9 로 둔다",
        "(pos, sum) 한 칸을 함께 쓴다",
      ],
      rows,
    );
  },

  /** tight 상태는 자리마다 하나뿐이고 다시 읽히지 않는다. */
  tightOnce: () => {
    const rows: string[][] = [];
    const cases: [number, number][] = [
      [WALK_N, WALK_K],
      [99_999, 20],
      [123_456_789, 30],
      [999_999_999_999_999, 50],
      [10 ** 15, 50],
    ];
    for (const [N, K] of cases) {
      const L = digitsOf(N).length;
      const r = instrumented(N, K);
      rows.push([
        `N=${comma(N)} · K=${K}`,
        String(L),
        String(L + 1),
        comma(r.tightVisits),
        comma(r.tightRepeat),
        comma(r.stored),
      ]);
    }
    return table(
      [
        "입력",
        "자리 수 L",
        "tight 상태 수 상한 L+1",
        "tight 상태 방문",
        "두 번 이상 방문",
        "표에 적은 칸",
      ],
      rows,
    );
  },

  /** 전개 — 열두 걸음이 무엇을 정하는가. */
  walkTable: () => {
    const { at, hits, memo } = walkDecisions(WALK_N, WALK_K);
    const get = (k: string): Decision => at.get(k) as Decision;
    const shown = (d: Decision): string =>
      d.picks.length === 0
        ? "—"
        : d.picks.join(" ") +
          (d.breakAt === null ? "" : ` · x=${d.breakAt} 에서 ④`);
    const free2 = (s: number): Decision => get(`2|${s}|F`);
    const sameRest = [3, 4, 5, 6, 7, 8, 9].every(
      (s) => free2(s).value === free2(3).value,
    );
    const hitCount = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(
      (n, s) => n + (hits.get(`2|${s}|F`) ?? 0),
      0,
    );
    const rows: string[][] = [
      [
        "T1",
        "—",
        "—",
        "—",
        "—",
        `표 ${memo.length} × ${(memo[0] as number[]).length} 를 미정으로 깐다`,
      ],
      [
        "T2",
        "0",
        "0",
        "tight",
        shown(get("0|0|T")).split(" ")[0] as string,
        "상한 1 — x=0 은 tight 를 해제한다",
      ],
      ["T3", "1", "0", "자유", "0", "상한 9 — 아래 자리로 내려간다"],
      [
        "T4",
        "2",
        "0",
        "자유",
        "—",
        `① 0 + 9×1 < 10 이라 ${get("2|0|F").value} · 표에 안 적는다`,
      ],
      [
        "T5",
        "2",
        "1",
        "자유",
        shown(free2(1)),
        `⑤ memo[2][1] = ${free2(1).value}`,
      ],
      [
        "T6",
        "2",
        "2",
        "자유",
        shown(free2(2)),
        `⑤ memo[2][2] = ${free2(2).value}`,
      ],
      [
        "T7",
        "2",
        "3…9",
        "자유",
        "같은 모양",
        `⑤ memo[2][3…9] = ${sameRest ? free2(3).value : "갈린다"}`,
      ],
      [
        "T8",
        "1",
        "0",
        "자유",
        shown(get("1|0|F")),
        `⑤ memo[1][0] = ${get("1|0|F").value}`,
      ],
      ["T9", "0", "0", "tight", "1", "x = digits[0] 이라 tight 가 남는다"],
      ["T10", "1", "1", "tight", "0…8", `③ 표를 ${hitCount} 번 읽는다`],
      [
        "T11",
        "2",
        "10",
        "tight",
        shown(get("2|10|T")),
        `상한 4 — ${get("2|10|T").value}`,
      ],
      ["T12", "0", "0", "tight", "—", `두 갈래를 더해 ${get("0|0|T").value}`],
    ];
    const memoShown = memo
      .map(
        (row, pos) =>
          `memo[${pos}] = [${row.map((v) => (v === -1 ? "·" : String(v))).join(" ")}]`,
      )
      .join("\n");
    return `${table(["단계", "pos", "sum", "상태", "놓은 숫자", "결과"], rows)}\n\n${memoShown}\n답 = ${digitDp(WALK_N, WALK_K)}`;
  },

  /** 자리 2 에 자유 상태로 왔을 때 칸마다 무엇이 정해지는가. */
  walkFree: () => {
    const { at } = walkDecisions(WALK_N, WALK_K);
    const rows: string[][] = [];
    for (let sum = 0; sum <= 9; sum++) {
      const d = at.get(`2|${sum}|F`) as Decision;
      rows.push([
        `sum=${sum}`,
        d.branch === "①" ? "없다" : `x=${WALK_K - sum}`,
        String(d.value),
        d.breakAt === null ? "—" : `x=${d.breakAt}`,
        d.branch,
      ]);
    }
    return table(
      [
        "자리 2 · 자유 상태",
        "합을 10 으로 만드는 숫자",
        "값",
        "④ 로 멈춘 자리",
        "갈래",
      ],
      rows,
    );
  },

  /** 멈춤 — 표를 읽을 때 tight 를 안 보면. */
  pauseShared: () => {
    const rows: string[][] = [];
    for (const [N, K] of SAMPLES) {
      rows.push([
        `digitDp(${comma(N)}, ${K})`,
        comma(digitDp(N, K)),
        comma(가드없이읽기.digitDp(N, K)),
      ]);
    }
    let diff = 0;
    let total = 0;
    for (let N = 1; N <= 3000; N++)
      for (let K = 0; K <= 27; K++) {
        total++;
        if (digitDp(N, K) !== 가드없이읽기.digitDp(N, K)) diff++;
      }
    return `${table(["입력", "바른 코드", "표를 읽을 때 tight 를 안 본 코드"], rows)}\n\nN ≤ 3,000 · K ≤ 27 전수 ${comma(total)} 쌍 중 답이 갈린 것 ${comma(diff)} 쌍`;
  },

  /** 멈춤 — 가지치기를 빼면 무엇이 달라지는가. */
  pausePrune: () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      [WALK_N, WALK_K],
      [999, 27],
      [999_999_999_999_999, 135],
      [999_999_999_999_999, 100],
      [10 ** 15, 50],
    ] as [number, number][]) {
      const on = instrumented(N, K, true);
      const off = instrumented(N, K, false);
      rows.push([
        `N=${comma(N)} · K=${K}`,
        comma(on.answer),
        comma(off.answer),
        comma(on.visits),
        comma(off.visits),
      ]);
    }
    return table(
      ["입력", "가지치기 있는 답", "없는 답", "있을 때 방문", "없을 때 방문"],
      rows,
    );
  },

  /** 멈춤 — 수 0 을 빼지 않으면. */
  pauseZero: () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      [100, 0],
      [1, 0],
      [10 ** 15, 0],
      [100, 1],
      [WALK_N, WALK_K],
    ] as [number, number][]) {
      rows.push([
        `digitDp(${comma(N)}, ${K})`,
        comma(digitDp(N, K)),
        comma(안빼기.digitDp(N, K)),
      ]);
    }
    return table(["입력", "바른 코드", "0 을 안 뺀 코드"], rows);
  },

  /** 전체 코드 실행 결과. */
  finalRun: () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      ...SAMPLES,
      [9, 5],
      [1, 1],
      [1, 2],
      [99, 20],
      [10 ** 15, 1],
      [10 ** 15, 50],
      [10 ** 15, 135],
    ] as [number, number][]) {
      rows.push([`digitDp(${comma(N)}, ${K})`, comma(digitDp(N, K))]);
    }
    return table(["호출", "답"], rows);
  },

  /** 알아 두면 좋은 개념 — 갈라지는 자리로 [0, N] 을 가른다. */
  rankingSplit: () => {
    const a = splitByPosition(WALK_N);
    const b = splitByPosition(2_045);
    const head = ["갈라지는 자리", "그 무리", "자유 자리", "개수"];
    return [
      `N = ${WALK_N}`,
      table(head, a.rows),
      `합 ${comma(a.total)} = N + 1`,
      "",
      "N = 2,045",
      table(head, b.rows),
      `합 ${comma(b.total)} = N + 1`,
    ].join("\n");
  },

  /** 수식 — 닫힌 형태를 값에 넣어 검산한다. */
  mathCheck: () => {
    const rows: string[][] = [];
    for (const [m, t] of [
      [1, 5],
      [2, 5],
      [2, 10],
      [2, 18],
      [3, 12],
      [4, 20],
      [15, 10],
      [15, 67],
      [15, 135],
    ] as [number, number][]) {
      rows.push([
        `W(${m}, ${t})`,
        comma(fillWays(m, t)),
        comma(closedWays(m, t)),
        String(Math.floor(t / 10) + 1),
      ]);
    }
    return table(["무엇", "표로 센 값", "닫힌 형태", "포함배제 항 수"], rows);
  },

  /** 경쟁 설계 — 닫힌 형태를 배정밀도로 계산하면 어디서부터 어긋나는가. */
  precisionGap: () => {
    const bad: number[] = [];
    for (let K = 0; K <= 135; K++) {
      if (closedDouble(10 ** 15, K) !== digitDp(10 ** 15, K)) bad.push(K);
    }
    const first = bad[0] as number;
    const term = binom(first + 14, 14);
    return table(
      ["무엇", "값"],
      [
        ["배정밀도 정수가 정확한 범위 2^53", comma(2 ** 53)],
        [`W(15, ${first}) 의 첫 포함배제 항 C(${first + 14}, 14)`, comma(term)],
        ["그 항 ÷ 2^53 (소수점 아래 둘)", (Number(term) / 2 ** 53).toFixed(2)],
        ["배정밀도 판이 정본과 처음 어긋나는 K", String(first)],
        ["K = 0…135 중 어긋나는 K 의 개수", String(bad.length)],
        [`K = ${first} 의 정본 값`, comma(digitDp(10 ** 15, first))],
        [`K = ${first} 의 배정밀도 값`, comma(closedDouble(10 ** 15, first))],
      ],
    );
  },

  /** 수식 — 무리별 합으로 전개 입력의 답을 다시 낸다. */
  mathSplit: () => {
    const N: number = WALK_N;
    const K: number = WALK_K;
    const d = digitsOf(N);
    const L = d.length;
    const rows: string[][] = [];
    let total = 0n;
    let prefix = 0;
    for (let p = 0; p < L; p++) {
      const free = L - p - 1;
      let group = 0n;
      const terms: string[] = [];
      for (let x = 0; x < (d[p] as number); x++) {
        const t = K - prefix - x;
        const v = fillWays(free, t);
        group += v;
        terms.push(`W(${free}, ${t})=${v}`);
      }
      total += group;
      const shown =
        terms.length === 0
          ? "없다"
          : terms.length <= 3
            ? terms.join(" + ")
            : `${terms[0]} + … + ${terms[terms.length - 1]}`;
      rows.push([
        `p=${p}`,
        String(prefix),
        String(free),
        `0 … ${(d[p] as number) - 1}`,
        shown,
        comma(group),
      ]);
      prefix += d[p] as number;
    }
    const last = prefix === K ? 1n : 0n;
    total += last;
    const zero = K === 0 ? 1n : 0n;
    total -= zero;
    return `${table(
      ["갈라지는 자리", "S_p", "자유 자리 m", "고르는 x", "각 항", "무리의 합"],
      rows,
    )}\n\nN 자신 (자릿수 합 ${prefix}) 이 세어지는가 = ${last}\n수 0 을 빼는가 = ${zero}\n합 = ${comma(total)} · digitDp(${N}, ${K}) = ${comma(digitDp(N, K))}`;
  },

  /** 수식 — 제약 상한에 넣어 수치를 낸다. */
  mathScale: () => {
    let sum = 0n;
    let best = 0;
    let bestValue = 0n;
    for (let t = 0; t <= 135; t++) {
      const v = fillWays(15, t);
      sum += v;
      if (v > bestValue) {
        bestValue = v;
        best = t;
      }
    }
    const total = 10n ** 15n;
    return table(
      ["무엇", "값"],
      [
        ["하나씩 세는 방법이 검사하는 수 N", comma(total)],
        ["자릿수로 가른 뒤의 표 칸 수 16 × 136", comma(16 * 136)],
        ["그 배수", comma(total / BigInt(16 * 136))],
        ["W(15, t) 를 t = 0…135 에 걸쳐 더한 값", comma(sum)],
        ["가장 큰 W(15, t) 의 t", String(best)],
        [`W(15, ${best})`, comma(bestValue)],
        ["N = 10^15 · K = 67 의 답", comma(digitDp(10 ** 15, 67))],
        ["W(15, 1) 에 1 을 더한 값", comma(fillWays(15, 1) + 1n)],
        ["N = 10^15 · K = 1 의 답", comma(digitDp(10 ** 15, 1))],
        ["N = 10^15 · K = 135 의 답", comma(digitDp(10 ** 15, 135))],
      ],
    );
  },

  /** 불변식 — tight 를 자리마다 다시 정하지 않은 판. */
  mutantTight: () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      [WALK_N, WALK_K],
      [990, 9],
      [20, 2],
      [100, 1],
      [999, 27],
      [9, 5],
      [10 ** 15, 50],
    ] as [number, number][]) {
      rows.push([
        `digitDp(${comma(N)}, ${K})`,
        comma(digitDp(N, K)),
        comma(물려주기.digitDp(N, K)),
      ]);
    }
    return table(["입력", "바른 코드", "tight 를 그대로 물려준 코드"], rows);
  },

  /** 비용 — 자리마다 자유 상태가 몇 개이고 실제로 몇 개를 정하는가. */
  perfVisit: () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      [WALK_N, WALK_K],
      [999_999_999_999_999, 50],
      [999_999_999_999_999, 135],
      [10 ** 15, 50],
      [123_456_789_012_345, 50],
    ] as [number, number][]) {
      const L = digitsOf(N).length;
      const r = instrumented(N, K);
      rows.push([
        `N=${comma(N)} · K=${K}`,
        String(L),
        comma(L * (K + 1)),
        comma(r.stored),
        comma(r.visits),
      ]);
    }
    return table(
      ["입력", "자리 수 L", "표의 칸 L(K+1)", "실제로 적은 칸", "방문한 상태"],
      rows,
    );
  },

  /** 최악을 만드는 입력. */
  worstInput: () => {
    const rows: string[][] = [];
    const cands: [string, number, number][] = [
      ["9 를 열다섯 개 · K=67", 999_999_999_999_999, 67],
      ["9 를 열다섯 개 · K=135", 999_999_999_999_999, 135],
      ["9 를 열다섯 개 · K=1", 999_999_999_999_999, 1],
      ["10^15 · K=67", 10 ** 15, 67],
      ["10^15 · K=50", 10 ** 15, 50],
      ["123456789012345 · K=67", 123_456_789_012_345, 67],
      ["555555555555555 · K=67", 555_555_555_555_555, 67],
    ];
    for (const [name, N, K] of cands) {
      const r = instrumented(N, K);
      rows.push([
        name,
        comma(r.answer),
        comma(r.stored),
        comma(r.visits),
        comma(digitsOf(N).length * (K + 1)),
      ]);
    }
    return table(
      ["입력", "답", "적은 칸", "방문한 상태", "표의 칸 L(K+1)"],
      rows,
    );
  },

  /** 스스로 점검하기 — 답이 붙는 문제. */
  checkStep: () => {
    const rows: string[][] = [];
    for (const K of [0, 1, 2, 3, 9, 10, 18, 19, 27, 28]) {
      rows.push([
        `K=${K}`,
        comma(digitDp(999, K)),
        comma(fillWays(3, K)),
        K === 0 ? "0 을 뺀다" : "같다",
      ]);
    }
    return table(["목표 합", "digitDp(999, K)", "W(3, K)", "둘의 관계"], rows);
  },
};
