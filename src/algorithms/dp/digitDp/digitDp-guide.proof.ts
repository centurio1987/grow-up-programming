/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 * 작은 입력의 호출 기록(`trace`)과 단순한 방법들은 그림 사이드카(`digitDp-guide.fig.tsx`)에 있고 여기서
 * 가져다 쓴다 — 그림과 증명 블록이 같은 실행을 가리키게 하려는 것이다. 큰 입력(자리 열다섯)은 기록을
 * 쓰지 않고 값만 세는 가벼운 판(`instrumented`)으로 잰다. 기록은 걸음마다 DP 테이블을 베껴서 큰 입력에
 * 걸면 메모리가 모자란다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/digitDp/digitDp-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  allCalls,
  alwaysNine,
  type CallNode,
  comma,
  digitsOf,
  K_MAX,
  N_MAX,
  noMemo,
  oneByOne,
  type Step,
  sharedTable,
  stripCount,
  trace,
  WALK_K,
  WALK_N,
  walkSteps,
} from "./digitDp-guide.fig.tsx";
import { digitDp } from "./digitDp-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

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

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 펜스 안 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 펜스 안의 표 — 첫 열은 왼쪽, 나머지는 오른쪽 정렬. */
function fenceTable(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0
          ? pad(c, w[0] as number)
          : " ".repeat(Math.max(0, (w[i] as number) - width(c))) + c,
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

const range = (a: number, b: number): string =>
  a === b ? `${a}` : b === a + 1 ? `${a} · ${b}` : `${a} … ${b}`;

const stateName = (n: { pos: number; sum: number; tight: boolean }): string =>
  `자리 ${n.pos} · 합 ${n.sum} · ${n.tight ? "붙음" : "풀림"}`;

const label = (N: number): string => (N === N_MAX ? "10^15" : comma(N));

/** 한 번에 다 담는 가벼운 계측판 — 정본과 같은 절차에 계수만 붙였다. 가지치기를 끌 수 있다. */
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
  hits: number;
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
  let hits = 0;
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
      if (done !== -1) {
        hits++;
        return done;
      }
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
  if (answer !== digitDp(N, K))
    throw new Error(`계측판이 정본과 다른 답을 냈다 — ${N}, ${K}`);
  return { answer, visits, stored, tightVisits, tightRepeat, hits };
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

/** 자릿수 합 — 수를 하나씩 셀 때 쓴다. */
const digitSum = (x: number): number => digitsOf(x).reduce((s, d) => s + d, 0);

/** 호출 기록에서 상태 하나를 찾는다. 없으면 던진다. */
function nodeAt(
  N: number,
  K: number,
  pos: number,
  sum: number,
  tight: boolean,
): CallNode {
  const n = allCalls(trace(N, K)).find(
    (c) => c.pos === pos && c.sum === sum && c.tight === tight,
  );
  if (!n)
    throw new Error(`${N}, ${K} 에 상태 (${pos}, ${sum}, ${tight}) 가 없다`);
  return n;
}

/**
 * 걸음이 그 갈래를 실행했는가. ① · ② 는 끝낸 상태의 자식 중 **마지막 자리 뒤**에서 끝난 것을 본다 —
 * 마지막 자리 앞에서 ① 로 끝난 상태는 자기 걸음(`prune`)이 따로 있다.
 */
function branchesHas(s: Step, mark: "①" | "②" | "④"): boolean {
  if (s.kind !== "finish") return false;
  return s.nodes.some((n) => {
    const leaf = n.children.filter(
      (c) => c.pos === n.pos + 1 && c.children.length === 0,
    );
    if (mark === "①")
      return leaf.some(
        (c) => c.kind === "prune" && c.pos === digitsOf(WALK_N).length,
      );
    if (mark === "②") return leaf.some((c) => c.kind === "base");
    return n.broke;
  });
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 변이를 **정본 소스에서** 만든다. 손으로 베낀 사본을 쓰면 「한 곳만 바꿨다」가 검사되지
 * 않는다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const REF = new URL("./digitDp-guide.ref.ts", import.meta.url).pathname;

type Fn = { digitDp(N: number, K: number): number };

/** `tight` 를 자리마다 다시 정하지 않고 그대로 물려주는 판. */
const 물려주기 = await loadMutant<Fn>(REF, {
  swap: [/tight && x === \(digits\[pos\] as number\)/, "tight"],
});

/** 다음 자리의 붙음을 이번 자리 숫자만 보고 정하는 판 — 앞 자리의 붙음을 잊는다. */
const 이번자리만 = await loadMutant<Fn>(REF, {
  swap: [
    /tight && x === \(digits\[pos\] as number\)/,
    "x === (digits[pos] as number)",
  ],
});

/** 표를 읽을 때 `tight` 를 안 보는 판 — ③ 의 가드를 뺀다. */
const 가드없이읽기 = await loadMutant<Fn>(REF, {
  swap: [/if \(!tight\) \{$/, "{"],
});

/** 수 0 을 빼지 않는 판 — ⑥ 을 뺀다. */
const 안빼기 = await loadMutant<Fn>(REF, {
  swap: [
    /return count\(0, 0, true\) - \(K === 0 \? 1 : 0\);/,
    "return count(0, 0, true);",
  ],
});

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 전체 컨셉 — 194 이하에서 자릿수 합이 10 인 수를 자리 수별로. */
  "concept-list": () => {
    const byLen = new Map<number, number[]>();
    for (let x = 1; x <= WALK_N; x++) {
      if (digitSum(x) !== WALK_K) continue;
      const L = String(x).length;
      byLen.set(L, [...(byLen.get(L) ?? []), x]);
    }
    const rows = [...byLen.entries()].map(([L, xs]) => [
      `${L} 자리`,
      xs.join(" · "),
      String(xs.length),
    ]);
    const total = [...byLen.values()].reduce((s, xs) => s + xs.length, 0);
    const got = digitDp(WALK_N, WALK_K);
    if (total !== got) throw new Error("하나씩 센 개수와 정본이 다르다");
    return `${md(["자리 수", `자릿수 합이 ${WALK_K} 인 수`, "개수"], rows, [2])}\n\n1 부터 ${WALK_N} 까지 하나씩 세면 ${total} 개이고, 정본 digitDp(${WALK_N}, ${WALK_K}) 도 ${got}${을를(String(got))} 냅니다.`;
  },

  /** 전체 컨셉 — 과제의 위 끝에서 하나씩 세는 방법과 DP 테이블의 크기. */
  "concept-scale": () => {
    const L = digitsOf(N_MAX).length;
    const cells = L * (K_MAX + 1);
    return `${md(
      ["방법", "세는 것", `N = 10^15 · K = ${K_MAX}`],
      [
        ["수를 하나씩 센다", "검사하는 수", comma(N_MAX)],
        [
          "자리마다 숫자를 정한다",
          "DP 테이블 memo 의 칸",
          `${L} × ${K_MAX + 1} = ${comma(cells)}`,
        ],
      ],
      [2],
    )}\n\n10^15 는 ${L} 자리로 적히고, DP 테이블의 칸 하나는 숫자를 많아야 10 개 놓아 보고 정해집니다.`;
  },

  /** 떠올리는 과정 — 하나씩 세는 방법이 과제의 위 끝에서 몇 번 하는 일이 되는가. */
  "origin-naive": () => {
    const rows: string[][] = [];
    for (const e of [1, 2, 3, 4, 5, 6]) {
      const N = 10 ** e;
      const counted = oneByOne(N, 10).strips;
      const byFormula = stripCount(BigInt(N));
      if (BigInt(counted) !== byFormula)
        throw new Error(`10^${e} 에서 센 값과 식이 다르다`);
      rows.push([`10^${e}`, comma(N), comma(counted), comma(byFormula)]);
    }
    for (const e of [9, 12, 15]) {
      rows.push([
        `10^${e}`,
        comma(10n ** BigInt(e)),
        "세지 않음",
        comma(stripCount(10n ** BigInt(e))),
      ]);
    }
    const top = stripCount(10n ** 15n);
    const days = Math.round(Number(top) / 1e8 / 86_400);
    return `${md(
      ["상한 N", "검사하는 수", "실제로 센 자리 떼기", "식으로 낸 자리 떼기"],
      rows,
      [1, 2, 3],
    )}\n\n10^6 까지는 실제로 실행해 세었고 식으로 낸 값과 같습니다. 과제의 위 끝 10^15 에서 자리 떼기는 ${comma(top)} 번이고, 초당 1 억 번으로 잡으면 ${comma(days)} 일이 걸립니다.`;
  },

  /** 떠올리는 과정 — 앞 두 자리가 달라도 남은 일이 같다. */
  "origin-same-rest": () => {
    const N = 999;
    const rows: string[][] = [];
    const values = new Set<number>();
    for (const [a, b] of [
      [1, 9],
      [2, 8],
      [3, 7],
      [9, 1],
    ] as [number, number][]) {
      const n = nodeAt(N, WALK_K, 2, a + b, false);
      values.add(n.value);
      rows.push([`${a} ${b}`, String(a + b), stateName(n), comma(n.value)]);
    }
    if (values.size !== 1) throw new Error("네 접두사의 남은 일이 갈린다");
    const v = comma([...values][0] as number);
    return `${md(["앞 두 자리", "합", "다음 상태", "그 상태의 답"], rows, [1, 3])}\n\nN = ${N} · K = ${WALK_K} 에서 앞 두 자리 네 가지가 모두 같은 상태에 이르고, 그 상태의 답은 ${v} 입니다.`;
  },

  /** 떠올리는 과정 — 같은 입력을 기억하지 않는 재귀와 서로 다른 상태 수로. */
  "origin-repeat": () => {
    const rows: string[][] = [];
    const states: number[] = [];
    for (const L of [3, 5, 7, 9, 11, 13, 15]) {
      const N = Number("9".repeat(L));
      const { calls, states: s, answer } = noMemo(N, WALK_K);
      if (answer !== digitDp(N, WALK_K))
        throw new Error("재귀가 정본과 다르다");
      states.push(s);
      rows.push([
        `9 가 ${L} 개`,
        comma(calls),
        comma(s),
        comma(Math.round(calls / s)),
        comma(answer),
      ]);
    }
    const steps = [
      ...new Set(states.slice(1).map((s, i) => s - (states[i] as number))),
    ];
    const last = rows.at(-1) as string[];
    return `${md(
      ["상한 N", "기억하지 않는 재귀의 호출", "서로 다른 상태", "배수", "답"],
      rows,
      [1, 2, 3, 4],
    )}\n\n9 가 15 개일 때 호출 ${last[1]} 번이 서로 다른 상태 ${last[2]} 개를 오갑니다. 자리가 둘 늘 때마다 상태는 ${steps.join(" · ")} 개씩 늘었습니다.`;
  },

  /** 떠올리는 과정 — 상태 정의 후보를 실제로 시험한다. */
  "origin-candidates": () => {
    const cases: [string, number, number][] = [
      [`N = ${WALK_N} · K = ${WALK_K}`, WALK_N, WALK_K],
      ["N = 100 · K = 2", 100, 2],
      ["N = 10^15 · K = 50", N_MAX, 50],
    ];
    let nineWrong = 0;
    let sharedWrong = 0;
    const rows = cases.map(([name, N, K]) => {
      const want = digitDp(N, K);
      const nine = alwaysNine(N, K);
      const shared = sharedTable(N, K);
      if (nine !== want) nineWrong++;
      if (shared !== want) sharedWrong++;
      return [name, comma(want), comma(nine), comma(shared)];
    });
    return `${md(
      [
        "입력",
        "정본",
        "상태 (자리, 합) · 상한 9",
        "(자리, 합) 한 칸을 함께 쓰기",
      ],
      rows,
      [1, 2, 3],
    )}\n\n입력 ${cases.length} 개 가운데 상한을 9 로 둔 판은 ${nineWrong} 개, 한 칸을 함께 쓴 판은 ${sharedWrong} 개에서 정본과 다른 답을 냈습니다.`;
  },

  /** 떠올리는 과정 — N = 100 · K = 2 에서 한 칸을 함께 쓰면 어디가 겹치는가. */
  "origin-shared-why": () => {
    const N = 100;
    const K = 2;
    const free = nodeAt(N, K, 2, 1, false);
    const tight = nodeAt(N, K, 2, 1, true);
    const limit = (n: CallNode) => (n.tight ? digitsOf(N)[n.pos] : 9);
    const row = (n: CallNode) => [
      stateName(n),
      n.prefix.join(" "),
      String(limit(n)),
      comma(n.value),
    ];
    const want = digitDp(N, K);
    const shared = sharedTable(N, K);
    const f = String(free.value);
    const g = String(tight.value);
    return `${md(
      ["상태", "앞 두 자리", "마지막 자리 상한", "그 상태의 답"],
      [row(free), row(tight)],
      [2, 3],
    )}\n\n두 상태가 같은 칸 (자리 2, 합 1) 에 오는데 답이 ${f}${과와(f)} ${g}${으로(g)} 다릅니다. 한 칸을 함께 쓰면 풀린 쪽이 먼저 적은 ${f}${을를(f)} 붙은 쪽이 읽어, 답이 ${want}${이가(String(want))} 아니라 ${shared}${이가(String(shared))} 됩니다.`;
  },

  /** 먼저 알아 둘 개념 — 상태 하나가 맡는 수. */
  "build-read-state": () => {
    const N = WALK_N;
    const K = WALK_K;
    const digits = digitsOf(N);
    const L = digits.length;
    const rows: string[][] = [];
    let same = 0;
    const picks: [number, number, boolean][] = [
      [1, 1, true],
      [1, 0, false],
      [2, 10, true],
    ];
    for (const [pos, sum, tight] of picks) {
      const n = nodeAt(N, K, pos, sum, tight);
      const head = n.prefix.reduce((v, d) => v * 10 + d, 0);
      const scale = 10 ** (L - pos);
      const lo = head * scale;
      const hi = tight ? N : lo + scale - 1;
      let count = 0;
      for (let x = lo; x <= hi; x++) if (digitSum(x) === K) count++;
      if (count === n.value) same++;
      const pad0 = (x: number) => String(x).padStart(L, "0");
      rows.push([
        stateName(n),
        n.prefix.join(" "),
        String(tight ? digits[pos] : 9),
        `${pad0(lo)} … ${pad0(hi)}`,
        comma(n.value),
        comma(count),
      ]);
    }
    return `${md(
      [
        "상태",
        "앞 숫자",
        "이번 자리 상한",
        "이 상태가 맡는 수",
        "상태의 값",
        "그 범위를 하나씩 센 개수",
      ],
      rows,
      [2, 4, 5],
    )}\n\n상태 ${picks.length} 개 가운데 ${same} 개에서 상태의 값과, 맡는 범위의 수를 하나씩 보며 자릿수 합이 ${K} 인 것을 센 개수가 같습니다.`;
  },

  /** 먼저 알아 둘 개념 — 상태끼리 이어지는 모양. */
  "build-transitions": () => {
    const t = trace(WALK_N, WALK_K);
    const rows: string[][] = [];
    let backToTight = 0;
    for (const n of allCalls(t)) {
      if (n.kind !== "loop" || n.pos >= t.L) continue;
      const free = n.children.filter((c) => !c.tight);
      const tight = n.children.filter((c) => c.tight);
      if (!n.tight) backToTight += tight.length;
      if (!n.tight && n.pos === t.L - 1) continue;
      const parts: string[] = [];
      if (free.length > 0) {
        const a = free[0] as CallNode;
        const b = free.at(-1) as CallNode;
        parts.push(
          `x = ${range(a.x as number, b.x as number)} → 자리 ${n.pos + 1} · 합 ${range(a.sum, b.sum)} · 풀림`,
        );
      }
      for (const c of tight)
        parts.push(`x = ${c.x} → 자리 ${n.pos + 1} · 합 ${c.sum} · 붙음`);
      rows.push([stateName(n), String(n.limit), parts.join("<br>")]);
    }
    return `${md(["상태", "상한", "놓는 숫자와 다음 상태"], rows, [1])}\n\n붙은 상태에서 나가는 길은 붙은 상태 하나와 풀린 상태 여럿이고, 풀린 상태에서 붙은 상태로 가는 길은 ${backToTight} 개입니다.`;
  },

  /** 먼저 알아 둘 개념 — 이번 자리 숫자만 같은가로 붙음을 정하면. */
  "build-only-here": () => {
    const cases: [number, number][] = [
      [WALK_N, WALK_K],
      [WALK_N, 15],
      [100, 2],
      [990, 9],
      [999, 27],
    ];
    const rows = cases.map(([N, K]) => [
      `digitDp(${comma(N)}, ${K})`,
      comma(digitDp(N, K)),
      comma(이번자리만.digitDp(N, K)),
    ]);
    let diff = 0;
    let total = 0;
    for (let N = 1; N <= 2000; N++)
      for (let K = 0; K <= 27; K++) {
        total++;
        if (digitDp(N, K) !== 이번자리만.digitDp(N, K)) diff++;
      }
    return `${md(["호출", "앞 자리까지 본 정본", "이번 자리만 본 판"], rows, [1, 2])}\n\nN ≤ 2,000 · K ≤ 27 의 ${comma(total)} 쌍을 모두 대조하면 ${comma(diff)} 쌍에서 답이 다릅니다.`;
  },

  /** 먼저 알아 둘 개념 — 앞 두 자리로 올 수 있는 접두사를 붙음으로 가른다. */
  "build-why-bool": () => {
    const N = WALK_N;
    const digits = digitsOf(N);
    const head = (digits[0] as number) * 10 + (digits[1] as number);
    const free: string[] = [];
    for (let p = 0; p < head; p++) free.push(String(p).padStart(2, "0"));
    const n = nodeAt(
      N,
      WALK_K,
      2,
      (digits[0] as number) + (digits[1] as number),
      true,
    );
    return `${md(
      ["앞 두 자리", "개수", "N 의 앞 두 자리와 비교", "마지막 자리 상한"],
      [
        [
          `${free[0]} … ${free.at(-1)}`,
          String(free.length),
          "어느 자리에선가 작다",
          "9",
        ],
        [String(head), "1", "전부 같다", String(digits[2])],
      ],
      [1, 3],
    )}\n\n앞 두 자리로 올 수 있는 ${free.length + 1} 가지 가운데 붙은 상태는 ${head} 하나이고, 정본이 그 상태(${stateName(n)})로 들어간 것도 한 번입니다.`;
  },

  /** 1단계 — DP 테이블의 크기. */
  "build-size": () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      [WALK_N, WALK_K],
      [N_MAX, K_MAX],
    ] as [number, number][]) {
      const d = digitsOf(N);
      const L = d.length;
      rows.push([
        label(N),
        String(K),
        L <= 4 ? `[${d.join(", ")}]` : `[1, 0, …, 0] (0 이 ${L - 1} 개)`,
        String(L),
        `${L} × ${K + 1} = ${comma(L * (K + 1))}`,
      ]);
    }
    const t = trace(WALK_N, WALK_K);
    const reach = new Set(
      allCalls(t)
        .filter((n) => !n.tight && n.pos < t.L)
        .map((n) => `${n.pos}|${n.sum}`),
    ).size;
    return `${md(["N", "K", "digits", "L", "DP 테이블 칸 L × (K+1)"], rows, [1, 3, 4])}\n\n전개 입력의 DP 테이블 ${t.L * (t.K + 1)} 칸 가운데 풀린 상태가 실제로 들어간 칸은 ${reach} 개입니다.`;
  },

  /** 2단계 — 상태마다 상한과 놓아 본 숫자. */
  "build-limits": () => {
    const t = trace(WALK_N, WALK_K);
    const rows: string[][] = [];
    const loops = allCalls(t).filter((n) => n.kind === "loop" && n.pos < t.L);
    for (const n of loops) {
      if (!n.tight && n.pos === t.L - 1 && n.sum > 2) continue;
      rows.push([
        stateName(n),
        n.tight ? `digits[${n.pos}] = ${n.limit}` : "9",
        range(0, n.children.length - 1),
        n.broke
          ? `x = ${n.children.length} (${n.sum} + ${n.children.length} > ${t.K})`
          : "없음",
      ]);
    }
    const tight = loops.filter((n) => n.tight).length;
    const shown = loops.filter(
      (n) => n.tight || n.pos < t.L - 1 || n.sum <= 2,
    ).length;
    return `${md(["상태", "상한", "놓아 본 x", "④ 로 끊은 자리"], rows)}\n\n숫자를 놓아 본 상태 ${loops.length} 개 가운데 ${shown} 개를 실었습니다. 붙은 상태 ${tight} 개는 상한이 N 의 그 자리 숫자이고, 풀린 상태는 모두 9 입니다. 싣지 않은 자리 2 · 합 3 … 9 는 합 2 와 모양이 같습니다.`;
  },

  /** 3단계 — 마지막 자리에 풀린 상태로 왔을 때 칸마다 무엇이 정해지는가. */
  "build-fill": () => {
    const t = trace(WALK_N, WALK_K);
    const rows: string[][] = [];
    let stored = 0;
    for (let sum = 0; sum <= 9; sum++) {
      const n = nodeAt(WALK_N, WALK_K, 2, sum, false);
      const two = n.children.find((c) => c.kind === "base" && c.value === 1);
      if (n.kind === "loop") stored++;
      rows.push([
        `${sum}`,
        n.kind === "prune" ? "없음" : two ? `x = ${two.x}` : "없음",
        comma(n.value),
        n.kind === "loop" && n.broke ? `x = ${n.children.length}` : "없음",
        n.kind === "prune" ? "①" : "⑤",
        n.kind === "loop" ? `memo[2][${sum}] = ${n.value}` : "-1 그대로",
      ]);
    }
    return `${md(
      [
        "합 sum",
        `합을 ${t.K} 으로 만드는 숫자`,
        "값",
        "④ 로 끊은 자리",
        "끝난 갈래",
        "DP 테이블",
      ],
      rows,
      [2],
    )}\n\n마지막 자리에 풀린 상태로 오는 합 10 가지 가운데 ${stored} 칸이 DP 테이블에 적히고, 합 0 한 칸은 ① 이 먼저 0 을 돌려주어 -1 로 남습니다.`;
  },

  /** 4단계 — 붙은 상태가 풀린 칸을 읽는 자리. */
  "build-reads": () => {
    const t = trace(WALK_N, WALK_K);
    const n = nodeAt(WALK_N, WALK_K, 1, 1, true);
    const rows = n.children.map((c) => [
      `x = ${c.x}`,
      stateName(c),
      c.kind === "hit"
        ? `③ 이 memo[${c.pos}][${c.sum}] 에서 읽는다`
        : "DP 테이블을 거치지 않고 센다",
      comma(c.value),
    ]);
    const hits = n.children.filter((c) => c.kind === "hit");
    const got = String(hits.reduce((s, c) => s + c.value, 0));
    const tightChild = n.children.find((c) => c.tight) as CallNode;
    const tv = String(tightChild.value);
    const tightCalls = allCalls(t).filter((c) => c.tight && c.pos < t.L).length;
    return `${md(["놓은 숫자", "다음 상태", "하는 일", "값"], rows, [3])}\n\n${stateName(n)} 에서 ③ 이 ${hits.length} 번 실행되어 ${got}${을를(got)} 받고, 붙은 채 내려간 x = ${tightChild.x}${이가(String(tightChild.x))} ${tv}${을를(tv)} 더해 ${n.value} 입니다. 전개 입력 전체에서 붙은 상태에 들어간 횟수는 ${tightCalls} 번입니다.`;
  },

  /** 5단계 — 첫 호출의 값과 답. */
  "build-zero": () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      [100, 0],
      [100, 1],
      [WALK_N, WALK_K],
    ] as [number, number][]) {
      const root = trace(N, K).root;
      rows.push([
        `N = ${N} · K = ${K}`,
        comma(root.value),
        K === 0 ? "1" : "0",
        comma(digitDp(N, K)),
      ]);
    }
    return md(["입력", "count(0, 0, true)", "빼는 수", "답"], rows, [1, 2, 3]);
  },

  /** 설계 선택 — 붙은 상태는 자리마다 많아야 하나이고 다시 읽히지 않는다. */
  "build-tight-once": () => {
    const cases: [number, number][] = [
      [WALK_N, WALK_K],
      [99_999, 20],
      [123_456_789, 30],
      [999_999_999_999_999, 50],
      [N_MAX, 50],
    ];
    let repeats = 0;
    const rows = cases.map(([N, K]) => {
      const L = digitsOf(N).length;
      const r = instrumented(N, K);
      repeats += r.tightRepeat;
      return [
        `${label(N)} · K = ${K}`,
        String(L),
        String(L + 1),
        comma(r.tightVisits),
        comma(r.tightRepeat),
        comma(r.stored),
      ];
    });
    const L = digitsOf(N_MAX).length;
    const both = 2 * L * (K_MAX + 1);
    const one = L * (K_MAX + 1);
    return `${md(
      [
        "입력",
        "자리 수 L",
        "붙은 상태 수의 위 끝 L+1",
        "붙은 상태에 들어간 횟수",
        "같은 붙은 상태에 다시 들어간 횟수",
        "DP 테이블에 적은 칸",
      ],
      rows,
      [1, 2, 3, 4, 5],
    )}\n\n다섯 입력을 합쳐 같은 붙은 상태에 다시 들어간 횟수는 ${repeats} 번입니다. 붙음까지 첨자로 두면 DP 테이블이 2 × ${L} × ${K_MAX + 1} = ${comma(both)} 칸이고, 풀린 상태만 두면 ${L} × ${K_MAX + 1} = ${comma(one)} 칸입니다.`;
  },

  /** 전개 — 끝까지 쓸 입력. */
  "walk-input": () => {
    const want = String(digitDp(WALK_N, WALK_K));
    return [
      `const N = ${WALK_N};`,
      `const K = ${WALK_K};`,
      `// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다`,
    ].join("\n");
  },

  /** 전개 1 — 자리로 가르고 DP 테이블을 깐 직후. */
  "walk-init": () => {
    const t = trace(WALK_N, WALK_K);
    const first = t.log[0]?.memo as readonly (readonly number[])[];
    const allUnset = first.every((row) => row.every((v) => v === -1));
    return [
      `digits = [${t.digits.join(", ")}] · L = ${t.L}`,
      `memo = ${t.L} × ${t.K + 1} 칸 · ${allUnset ? "전부 -1" : "-1 이 아닌 칸이 있다"}`,
      "  └ 첫 호출 count(0, 0, true) 가 들어가는 순간의 DP 테이블이다",
    ].join("\n");
  },

  /** 전개 2 — 맨 왼쪽 자리에서 놓는 숫자. */
  "walk-pick": () => {
    const t = trace(WALK_N, WALK_K);
    const root = t.root;
    const d = t.digits[0] as number;
    const rows = root.children.map((c) => [
      `x = ${c.x}`,
      `${c.x} ${(c.x as number) < d ? "<" : "="} digits[0] = ${d}`,
      c.tight ? "true — 붙은 채" : "false — 풀린다",
      stateName(c),
    ]);
    rows.push([
      `x = ${d + 1}`,
      `${d + 1} > digits[0] = ${d}`,
      "놓지 않는다",
      "상한 밖",
    ]);
    return md(["놓는 숫자", "비교", "다음 tight", "다음 상태"], rows);
  },

  /** 짚고 가기 — 표를 읽을 때 tight 를 안 보면. */
  "pause-shared": () => {
    const cases: [number, number][] = [
      [WALK_N, WALK_K],
      [20, 2],
      [100, 1],
      [100, 2],
      [100, 0],
      [99, 18],
      [999, 27],
      [1000, 1],
    ];
    const rows = cases.map(([N, K]) => [
      `digitDp(${comma(N)}, ${K})`,
      comma(digitDp(N, K)),
      comma(가드없이읽기.digitDp(N, K)),
    ]);
    let diff = 0;
    let total = 0;
    for (let N = 1; N <= 3000; N++)
      for (let K = 0; K <= 27; K++) {
        total++;
        if (digitDp(N, K) !== 가드없이읽기.digitDp(N, K)) diff++;
      }
    return `${md(["호출", "바른 코드", "표를 읽을 때 tight 를 안 본 코드"], rows, [1, 2])}\n\nN ≤ 3,000 · K ≤ 27 의 ${comma(total)} 쌍을 모두 대조하면 ${comma(diff)} 쌍에서 답이 다릅니다.`;
  },

  /** 전개 3 — 마지막 자리 줄을 채운 뒤의 DP 테이블. */
  "walk-fill": () => {
    const t = trace(WALK_N, WALK_K);
    const at = t.log.findIndex(
      (l) =>
        l.type === "leave" &&
        l.node.pos === 1 &&
        !l.node.tight &&
        l.node.sum === 0,
    );
    const before = t.log[at - 1]?.memo as readonly (readonly number[])[];
    const after = t.log[at]?.memo as readonly (readonly number[])[];
    const show = (row: readonly number[]) =>
      `[${row.map((v) => (v === -1 ? "·" : String(v))).join(" ")}]`;
    return [
      "자리 2 의 풀린 상태를 다 끝낸 직후",
      `  memo[2] = ${show(before[2] as number[])}`,
      `  memo[1] = ${show(before[1] as number[])}`,
      "자리 1 · 합 0 · 풀림의 반복을 끝낸 직후",
      `  memo[1] = ${show(after[1] as number[])}`,
      "  └ · 은 아직 -1 인 칸이다",
    ].join("\n");
  },

  /** 짚고 가기 — 가지치기를 빼면 무엇이 달라지는가. */
  "pause-prune": () => {
    const cases: [number, number][] = [
      [WALK_N, WALK_K],
      [999, 27],
      [999_999_999_999_999, 135],
      [999_999_999_999_999, 100],
      [N_MAX, 50],
    ];
    let sameAnswer = 0;
    const rows = cases.map(([N, K]) => {
      const on = instrumented(N, K, true);
      const off = instrumented(N, K, false);
      if (on.answer === off.answer) sameAnswer++;
      return [
        `${label(N)} · K = ${K}`,
        comma(on.answer),
        comma(off.answer),
        comma(on.visits),
        comma(off.visits),
      ];
    });
    const big = instrumented(999_999_999_999_999, 135, true);
    const bigOff = instrumented(999_999_999_999_999, 135, false);
    return `${md(
      [
        "입력",
        "가지치기 있는 답",
        "없는 답",
        "있을 때 들어간 상태",
        "없을 때 들어간 상태",
      ],
      rows,
      [1, 2, 3, 4],
    )}\n\n입력 ${cases.length} 개 가운데 ${sameAnswer} 개에서 두 답이 같습니다. 9 가 15 개이고 K = 135 이면 들어간 상태가 ${comma(big.visits)} 번과 ${comma(bigOff.visits)} 번으로 ${Math.round(bigOff.visits / big.visits)} 배 차이입니다.`;
  },

  /** 전개 4 — 붙은 상태가 DP 테이블을 읽은 횟수. */
  "walk-read": () => {
    const t = trace(WALK_N, WALK_K);
    const hits = allCalls(t).filter((n) => n.kind === "hit");
    const steps = walkSteps();
    const writer = (n: CallNode) =>
      steps.find(
        (s) =>
          s.kind === "finish" &&
          s.nodes.some((c) => c.pos === n.pos && c.sum === n.sum && !c.tight),
      )?.id ?? "없음";
    const by = [...new Set(hits.map(writer))];
    const first = hits[0] as CallNode;
    const last = hits.at(-1) as CallNode;
    return fenceTable(
      ["항목", "값"],
      [
        ["③ 이 실행된 횟수", String(hits.length)],
        [
          "읽은 칸",
          `memo[${first.pos}][${first.sum}] … memo[${last.pos}][${last.sum}]`,
        ],
        ["그 칸을 적은 걸음", by.join(" · ")],
      ],
    );
  },

  /** 전개 5 — 열두 걸음의 조건 판정. */
  "walk-trace": () => {
    const t = trace(WALK_N, WALK_K);
    const rows: string[][] = [];
    for (const s of walkSteps()) {
      const n = s.nodes[0];
      if (!n) {
        rows.push([s.id, "—", "—", `DP 테이블 ${t.L} × ${t.K + 1} 칸을 -1 로`]);
        continue;
      }
      const left = t.L - n.pos;
      const pr = `${n.sum} + 9 × ${left} < ${t.K}`;
      let cond = "";
      let result = "";
      if (s.kind === "prune") {
        cond = `${pr} **참** → ①`;
        result = "0 · 적지 않음";
      } else if (s.kind === "hit") {
        cond = `${pr} **거짓** · !tight 이고 memo ≠ -1 **참** → ③`;
        result = `${s.nodes.length} 칸에서 합 ${s.nodes.reduce((a, c) => a + c.value, 0)}`;
      } else if (s.kind === "enter") {
        const guard = n.tight
          ? "tight 라 ③ 을 건너뜀"
          : `memo[${n.pos}][${n.sum}] = -1 이라 ③ 을 건너뜀`;
        cond = `${pr} **거짓** · ${guard}`;
        result = `상한 ${n.limit} · x = ${range(0, n.children.length - 1)}`;
      } else {
        const breakNote = n.broke
          ? ` · ${n.sum} + ${n.children.length} > ${t.K} **참** → ④`
          : "";
        cond = `${pr} **거짓**${breakNote}`;
        result = n.tight
          ? `${comma(n.value)} · 적지 않음`
          : s.nodes.length > 1
            ? `${s.nodes.length} 칸에 ${comma(n.value)} ⑤`
            : `memo[${n.pos}][${n.sum}] = ${comma(n.value)} ⑤`;
      }
      const state =
        s.nodes.length > 1
          ? `자리 ${n.pos} · 합 ${range(n.sum, s.nodes.at(-1)?.sum as number)} · ${n.tight ? "붙음" : "풀림"}`
          : stateName(n);
      rows.push([s.id, state, cond, result]);
    }
    return md(["단계", "상태", "조건 판정", "결과"], rows);
  },

  /** 전개 5 — 갈래마다 실행된 걸음. */
  "walk-branches": () => {
    const t = trace(WALK_N, WALK_K);
    const steps = walkSteps();
    const calls = allCalls(t);
    const ids = (pred: (s: Step) => boolean) =>
      steps
        .filter(pred)
        .map((s) => s.id)
        .join(" · ") || "없음";
    const prune = calls.filter((n) => n.kind === "prune").length;
    const base = calls.filter((n) => n.kind === "base").length;
    const hit = calls.filter((n) => n.kind === "hit").length;
    const broke = calls.filter((n) => n.kind === "loop" && n.broke).length;
    const stored = calls.filter((n) => n.kind === "loop" && !n.tight).length;
    const rows = [
      [
        "① 남은 자리로 K 에 못 미친다",
        ids((s) => s.kind === "prune" || branchesHas(s, "①")),
        String(prune),
      ],
      ["② 자리를 다 정했다", ids((s) => branchesHas(s, "②")), String(base)],
      ["③ DP 테이블에서 읽는다", ids((s) => s.kind === "hit"), String(hit)],
      ["④ 합이 K 를 넘었다", ids((s) => branchesHas(s, "④")), String(broke)],
      [
        "⑤ 풀린 상태의 값만 적는다",
        ids((s) => s.kind === "finish" && !s.nodes[0]?.tight),
        String(stored),
      ],
      ["⑥ 수 0 을 뺀다", "없음", t.K === 0 ? "1" : "0"],
    ];
    const k = String(t.K);
    return `${md(["갈래", "나온 걸음", "실행 횟수"], rows, [2])}\n\n① 부터 ⑤ 까지는 한 번 이상 실행됐고, ⑥ 은 K = ${k}${이가(k)} 0 이 아니라 실행되지 않습니다.`;
  },

  /** 짚고 가기 — 수 0 을 빼지 않으면. */
  "pause-zero": () => {
    const cases: [number, number][] = [
      [100, 0],
      [1, 0],
      [N_MAX, 0],
      [100, 1],
      [WALK_N, WALK_K],
    ];
    const rows = cases.map(([N, K]) => [
      `digitDp(${label(N)}, ${K})`,
      comma(digitDp(N, K)),
      comma(안빼기.digitDp(N, K)),
    ]);
    return md(["호출", "바른 코드", "0 을 안 뺀 코드"], rows, [1, 2]);
  },

  /** 전체 코드 실행 결과. */
  "final-run": () => {
    const rows: string[][] = [];
    for (const [N, K] of [
      [WALK_N, WALK_K],
      [20, 2],
      [100, 1],
      [100, 2],
      [100, 0],
      [99, 18],
      [999, 27],
      [1000, 1],
      [9, 5],
      [1, 1],
      [1, 2],
      [99, 20],
      [N_MAX, 1],
      [N_MAX, 50],
      [N_MAX, 135],
    ] as [number, number][]) {
      rows.push([`digitDp(${comma(N)}, ${K})`, comma(digitDp(N, K))]);
    }
    return fenceTable(["호출", "답"], rows);
  },

  /** 알아 두면 좋은 개념 — 처음 작아지는 자리로 [0, N] 을 가른다. */
  "related-split": () => {
    const split = (N: number) => {
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
          `${prefix === "" ? "앞 숫자 없이" : `${prefix} 뒤에`} ${digits[pos]} 보다 작은 숫자`,
          String(free),
          comma(cnt),
        ]);
      }
      total += 1n;
      rows.push(["끝까지 같다", `${N} 자신`, "0", "1"]);
      return { rows, total };
    };
    const a = split(WALK_N);
    const b = split(2045);
    const head = ["처음 작아지는 자리", "그 무리", "자유 자리", "수의 개수"];
    const ta = comma(a.total);
    const tb = comma(b.total);
    return [
      `N = ${WALK_N} 이면 이렇게 갈립니다.`,
      "",
      md(head, a.rows, [2, 3]),
      "",
      "N = 2,045 이면 이렇게 갈립니다.",
      "",
      md(head, b.rows, [2, 3]),
      "",
      `개수의 합이 ${ta}${과와(ta)} ${tb}${josa(tb, "이라", "라")} 두 입력 모두 N + 1 과 같습니다.`,
    ].join("\n");
  },

  /** 최적인 문제의 모양 — 자리 수가 커질 때 DP 테이블의 크기. */
  "fit-scale": () => {
    const rows: string[][] = [];
    const Ls: number[] = [];
    for (const e of [15, 18, 100]) {
      const L = String(10n ** BigInt(e)).length;
      Ls.push(L);
      rows.push([
        `10^${e}`,
        String(L),
        `${L} × ${K_MAX + 1} = ${comma(L * (K_MAX + 1))}`,
      ]);
    }
    if (digitsOf(N_MAX).length !== Ls[0])
      throw new Error("정본의 자리 수와 다르다");
    const to = String(Ls[2]);
    return `${md(["N", "자리 수 L", `K = ${K_MAX} 일 때 DP 테이블 칸`], rows, [1, 2])}\n\nN 이 10^15 에서 10^100 으로 10^85 배가 되어도 자리 수는 ${Ls[0]} 에서 ${to}${으로(to)} 늘 뿐입니다.`;
  },

  /** 경쟁 설계 — 닫힌 형태를 배정밀도로 계산하면 어디서부터 어긋나는가. */
  "precision-gap": () => {
    const bad: number[] = [];
    for (let K = 0; K <= K_MAX; K++) {
      if (closedDouble(N_MAX, K) !== digitDp(N_MAX, K)) bad.push(K);
    }
    const first = bad[0] as number;
    const term = binom(first + 14, 14);
    const ratio = (Number(term) / 2 ** 53).toFixed(2);
    return `${md(
      ["항목", "값"],
      [
        ["배정밀도 정수가 정확한 범위 2^53", comma(2 ** 53)],
        [`W(15, ${first}) 의 첫 포함배제 항 C(${first + 14}, 14)`, comma(term)],
        ["그 항 ÷ 2^53 (소수점 아래 둘)", ratio],
        ["배정밀도 판이 정본과 처음 어긋나는 K", String(first)],
        [`K = 0 … ${K_MAX} 중 어긋나는 K 의 개수`, String(bad.length)],
        [`K = ${first} 의 정본 값`, comma(digitDp(N_MAX, first))],
        [`K = ${first} 의 배정밀도 값`, comma(closedDouble(N_MAX, first))],
      ],
      [1],
    )}\n\n항 하나가 이미 2^53 의 ${ratio} 배라, 배정밀도로 계산하면 K = ${first} 부터 답이 어긋나고 K = ${K_MAX} 까지 그런 K 가 ${bad.length} 개입니다.`;
  },

  /** 수식 — F(2, t) 의 원소를 전부 적는다. */
  "math-enumerate": () => {
    const list = (t: number) => {
      const out: string[] = [];
      for (let a = 0; a <= 9; a++) {
        const b = t - a;
        if (b >= 0 && b <= 9) out.push(`(${a},${b})`);
      }
      return out;
    };
    const five = list(5);
    const ten = list(10);
    if (
      BigInt(five.length) !== fillWays(2, 5) ||
      BigInt(ten.length) !== fillWays(2, 10)
    )
      throw new Error("원소 수가 표로 센 값과 다르다");
    return [
      "F(2, 5) 의 원소",
      `  ${five.join(" ")}   →  W(2, 5) = ${five.length}`,
      "",
      "F(2, 10) 의 원소",
      `  ${ten[0]} 부터 ${ten.at(-1)} 까지 ${ten.length} 개   →  W(2, 10) = ${ten.length}`,
      "  (0,10) 과 (10,0) 은 자리 하나가 9 를 넘어 들지 않는다",
      "",
      `(1 + z + … + z^9)^2 의 z^5 계수 = ${closedWays(2, 5)}`,
    ].join("\n");
  },

  /** 수식 — 닫힌 형태를 값에 넣어 검산한다. */
  "math-check": () => {
    const rows: string[][] = [];
    let same = 0;
    const cases = [
      [1, 5],
      [2, 5],
      [2, 10],
      [2, 18],
      [3, 12],
      [4, 20],
      [15, 10],
      [15, 67],
      [15, 135],
    ] as [number, number][];
    for (const [m, t] of cases) {
      const a = fillWays(m, t);
      const b = closedWays(m, t);
      if (a === b) same++;
      rows.push([
        `W(${m}, ${t})`,
        comma(a),
        comma(b),
        String(Math.floor(t / 10) + 1),
      ]);
    }
    return `${md(["식", "표로 센 값", "닫힌 형태", "포함배제 항 수"], rows, [1, 2, 3])}\n\n${cases.length} 줄 가운데 ${same} 줄에서 표로 센 값과 닫힌 형태가 같습니다.`;
  },

  /** 수식 — 무리별 합으로 전개 입력의 답을 다시 낸다. */
  "math-split": () => {
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
        terms.push(`W(${free}, ${t}) = ${v}`);
      }
      total += group;
      const shown =
        terms.length === 0
          ? "없음"
          : terms.length <= 3
            ? terms.join(" + ")
            : `${terms[0]} + … + ${terms[terms.length - 1]}`;
      rows.push([
        `p = ${p}`,
        String(prefix),
        String(free),
        range(0, (d[p] as number) - 1),
        shown,
        comma(group),
      ]);
      prefix += d[p] as number;
    }
    const last = prefix === K ? 1n : 0n;
    total += last;
    const zero = K === 0 ? 1n : 0n;
    total -= zero;
    const s = String(prefix);
    const k = String(K);
    const tt = comma(total);
    const ans = comma(digitDp(N, K));
    return `${md(
      ["갈라지는 자리", "S_p", "자유 자리 m", "고르는 x", "각 항", "무리의 합"],
      rows,
      [1, 2, 5],
    )}\n\nN 자신은 자릿수 합이 ${s}${josa(s, "이라", "라")} ${last === 1n ? "세어지고" : "세어지지 않고"}, K = ${k}${josa(k, "이라", "라")} 수 0 을 빼는 항은 ${zero} 입니다. 합 ${tt}${이가(tt)} digitDp(${N}, ${K}) = ${ans}${과와(ans)} 같습니다.`;
  },

  /** 수식 — 과제의 위 끝에 넣어 수치를 낸다. */
  "math-scale": () => {
    let sum = 0n;
    let best = 0;
    let bestValue = 0n;
    for (let t = 0; t <= K_MAX; t++) {
      const v = fillWays(15, t);
      sum += v;
      if (v > bestValue) {
        bestValue = v;
        best = t;
      }
    }
    return md(
      ["항목", "값"],
      [
        [`W(15, t) 를 t = 0 … ${K_MAX} 에 걸쳐 더한 값`, comma(sum)],
        ["가장 큰 W(15, t) 의 t", String(best)],
        [`W(15, ${best})`, comma(bestValue)],
        [`digitDp(10^15, ${best})`, comma(digitDp(N_MAX, best))],
        ["W(15, 1) + 1", comma(fillWays(15, 1) + 1n)],
        ["digitDp(10^15, 1)", comma(digitDp(N_MAX, 1))],
        [`digitDp(10^15, ${K_MAX})`, comma(digitDp(N_MAX, K_MAX))],
      ],
      [1],
    );
  },

  /** 불변식 — 경계에 있는 입력. */
  "invariant-edges": () => {
    type R = ReturnType<typeof instrumented>;
    const cases: [number, number, (r: R) => string][] = [
      [
        1,
        1,
        (r) =>
          `자리가 하나이고 붙은 상태만 들어간다. DP 테이블에 적은 칸 ${r.stored}`,
      ],
      [
        1,
        2,
        (r) => `후보 0 · 1 을 다 놓아도 합 2 에 못 미친다. 적은 칸 ${r.stored}`,
      ],
      [100, 0, () => "마지막 줄이 첫 호출의 값에서 수 0 하나를 뺀다"],
      [
        99,
        20,
        (r) =>
          `0 + 9 × 2 < 20 이 참이라 첫 호출이 가지치기에 걸린다. 들어간 상태 ${r.visits}`,
      ],
      [
        999,
        27,
        (r) =>
          `9 가 아닌 숫자를 고르면 가지치기에 걸려 붙은 상태만 끝까지 간다. 적은 칸 ${r.stored}`,
      ],
      [
        N_MAX,
        K_MAX,
        (r) =>
          `맨 앞이 1 이라 뒤 15 자리가 전부 9 여야 한다. 적은 칸 ${r.stored}`,
      ],
    ];
    const rows = cases.map(([N, K, note]) => {
      const r = instrumented(N, K);
      return [`N = ${label(N)} · K = ${K}`, note(r), comma(digitDp(N, K))];
    });
    return md(["입력", "DP 테이블과 갈래", "돌려주는 값"], rows, [2]);
  },

  /** 불변식 — tight 를 자리마다 다시 정하지 않은 판. */
  "invariant-mutant": () => {
    const cases: [number, number][] = [
      [WALK_N, WALK_K],
      [990, 9],
      [20, 2],
      [100, 1],
      [999, 27],
      [9, 5],
      [N_MAX, 50],
    ];
    let smaller = 0;
    const rows = cases.map(([N, K]) => {
      const a = digitDp(N, K);
      const b = 물려주기.digitDp(N, K);
      if (b < a) smaller++;
      return [`digitDp(${label(N)}, ${K})`, comma(a), comma(b)];
    });
    return `${md(["호출", "바른 코드", "tight 를 그대로 물려준 코드"], rows, [1, 2])}\n\n호출 ${cases.length} 개 가운데 ${smaller} 개에서 답이 작아졌습니다.`;
  },

  /** 비용 — 상태와 칸을 센다. */
  "perf-count": () => {
    const L = digitsOf(N_MAX).length;
    const free = L * (K_MAX + 1);
    const tight = L + 1;
    const states = free + tight;
    return md(
      ["항목", "식", `L = ${L} · K = ${K_MAX}`],
      [
        ["풀린 상태 = DP 테이블 칸", "L × (K+1)", comma(free)],
        ["붙은 상태", "L + 1 이하", comma(tight)],
        ["상태 합계", "L(K+1) + L + 1 이하", comma(states)],
        ["숫자를 놓아 보는 일", "상태마다 10 번 이하", comma(10 * states)],
        ["재귀의 깊이", "L + 1", String(L + 1)],
      ],
      [2],
    );
  },

  /** 비용 — 실제로 적은 칸과 들어간 상태. */
  "perf-visit": () => {
    const cases: [number, number][] = [
      [WALK_N, WALK_K],
      [999_999_999_999_999, 50],
      [999_999_999_999_999, 135],
      [N_MAX, 50],
      [123_456_789_012_345, 50],
    ];
    const shares: number[] = [];
    const rows = cases.map(([N, K]) => {
      const L = digitsOf(N).length;
      const r = instrumented(N, K);
      if (L >= 15 && r.stored > 0) shares.push(r.stored / (L * (K + 1)));
      return [
        `${label(N)} · K = ${K}`,
        String(L),
        comma(L * (K + 1)),
        comma(r.stored),
        comma(r.visits),
      ];
    });
    const pct = (x: number) => `${Math.round(x * 100)}%`;
    return `${md(
      [
        "입력",
        "자리 수 L",
        "DP 테이블 칸 L(K+1)",
        "실제로 적은 칸",
        "들어간 상태",
      ],
      rows,
      [1, 2, 3, 4],
    )}\n\n자리가 15 이상이고 적은 칸이 있는 입력에서 적은 칸은 DP 테이블의 ${pct(Math.min(...shares))} 에서 ${pct(Math.max(...shares))} 입니다.`;
  },

  /** 최악을 만드는 입력. */
  "worst-input": () => {
    const cands: [string, number, number][] = [
      ["9 가 15 개 · K = 67", 999_999_999_999_999, 67],
      ["9 가 15 개 · K = 135", 999_999_999_999_999, 135],
      ["9 가 15 개 · K = 1", 999_999_999_999_999, 1],
      ["10^15 · K = 67", N_MAX, 67],
      ["10^15 · K = 50", N_MAX, 50],
      ["123456789012345 · K = 67", 123_456_789_012_345, 67],
      ["555555555555555 · K = 67", 555_555_555_555_555, 67],
    ];
    let best = cands[0] as [string, number, number];
    let bestVisits = -1;
    const rows = cands.map((c) => {
      const [name, N, K] = c;
      const r = instrumented(N, K);
      if (r.visits > bestVisits) {
        bestVisits = r.visits;
        best = c;
      }
      return [
        name,
        comma(r.answer),
        comma(r.stored),
        comma(r.visits),
        comma(digitsOf(N).length * (K + 1)),
      ];
    });
    return `${md(
      ["입력", "답", "적은 칸", "들어간 상태", "DP 테이블 칸 L(K+1)"],
      rows,
      [1, 2, 3, 4],
    )}\n\n들어간 상태가 가장 많은 입력은 ${best[0]} 의 ${comma(bestVisits)} 번입니다.`;
  },

  /** 스스로 점검하기 — 답이 붙는 문제. */
  "check-step": () => {
    const rows: string[][] = [];
    let sameCount = 0;
    const Ks = [0, 1, 2, 3, 9, 10, 18, 19, 27, 28];
    for (const K of Ks) {
      const a = BigInt(digitDp(999, K));
      const b = fillWays(3, K);
      if (a === b) sameCount++;
      rows.push([
        `K = ${K}`,
        comma(a),
        comma(b),
        a === b ? "0" : String(b - a),
      ]);
    }
    const apart = Ks.filter((K) => BigInt(digitDp(999, K)) !== fillWays(3, K));
    const gaps = [
      ...new Set(
        apart.map((K) => String(fillWays(3, K) - BigInt(digitDp(999, K)))),
      ),
    ];
    return `${md(["목표 합", "digitDp(999, K)", "W(3, K)", "W 쪽이 큰 만큼"], rows, [1, 2, 3])}\n\n${Ks.length} 줄 가운데 ${sameCount} 줄에서 두 값이 같고, K = ${apart.join(" · ")} 줄만 digitDp 쪽이 ${gaps.join(" · ")} 작습니다.`;
  },
};
