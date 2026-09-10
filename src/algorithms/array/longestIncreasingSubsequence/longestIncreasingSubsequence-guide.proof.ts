/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts \
 *     src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.md
 *
 * **세는 사본이 셋 있다**(`bruteForce`·`bySquareDp`·`byTails`). 정본은 비교를 몇 번 했는지를
 * 내보내지 않으므로 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표의 「답」 칸 중 옳은 쪽은 전부 정본이나 정본에서 기계로
 * 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { longestIncreasingSubsequence } from "./longestIncreasingSubsequence-guide.ref.ts";

const REF = new URL(
  "./longestIncreasingSubsequence-guide.ref.ts",
  import.meta.url,
).pathname;

/**
 * 본문 전개가 쓰는 고정 입력. 끝에 붙이는 갈래와 자리를 갈아 끼우는 갈래가 각각 네 번씩
 * 실행되고, 마지막 원소 18 이 101 자리를 갈아 끼워 **답을 안 바꾸는 갱신**까지 나온다.
 */
const WALK: number[] = [10, 9, 2, 5, 3, 7, 101, 18];

/** 표에 나란히 놓는 네 입력. */
const FOUR: [string, number[]][] = [
  ["전개가 쓰는 여덟 원소", WALK],
  ["같은 값 넷", [7, 7, 7, 7]],
  ["엄격 감소 다섯", [5, 4, 3, 2, 1]],
  ["원소 하나", [42]],
];

/** 결정론적 입력 생성기. 난수가 아니라 식이라 같은 값이 몇 번을 실행해도 나온다. */
function gen(
  n: number,
  mode: "무작위" | "증가" | "감소" | "같은 값",
): number[] {
  const out: number[] = [];
  let seed = 12_345;
  for (let i = 0; i < n; i++) {
    if (mode === "증가") out.push(i);
    else if (mode === "감소") out.push(n - i);
    else if (mode === "같은 값") out.push(7);
    else {
      seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
      out.push(seed % (2 * n));
    }
  }
  return out;
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number): string => n.toLocaleString("en-US");

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
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

/**
 * 가장 단순한 방법 — 원소를 **고르거나 안 고르거나** 로 부분 수열을 전부 만들어, 증가하는지
 * 검사하고 가장 긴 것을 남긴다. 기법이 하나도 안 들어간 풀이다.
 */
function bruteForce(a: number[]): { best: number; tried: number; ops: number } {
  const n = a.length;
  let best = 0;
  let tried = 0;
  let ops = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    tried++;
    let last = Number.NEGATIVE_INFINITY;
    let len = 0;
    let ok = true;
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) === 0) continue;
      ops += 1;
      if ((a[i] as number) <= last) {
        ok = false;
        break;
      }
      last = a[i] as number;
      len++;
    }
    if (ok && len > best) best = len;
  }
  return { best, tried, ops };
}

/** 두 번째로 단순한 방법 — 자리마다 「그 자리로 끝나는 가장 긴 것」을 앞을 전부 보며 채운다. */
function bySquareDp(a: number[]): { best: number; ops: number; cells: number } {
  const n = a.length;
  const dp: number[] = Array.from({ length: n }, () => 1);
  let ops = n;
  let best = n === 0 ? 0 : 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      ops += 2;
      if ((a[j] as number) < (a[i] as number)) {
        ops += 2;
        if ((dp[j] as number) + 1 > (dp[i] as number))
          dp[i] = (dp[j] as number) + 1;
      }
    }
    ops += 1;
    if ((dp[i] as number) > best) best = dp[i] as number;
  }
  return { best, ops, cells: n };
}

/** 이 가이드가 가르치는 절차. 이분 탐색의 반복 횟수도 함께 센다. */
function byTails(a: number[]): {
  best: number;
  ops: number;
  probes: number;
  cells: number;
  steps: { x: number; lo: number; grew: boolean; tails: number[] }[];
} {
  const tails: number[] = [];
  let ops = 0;
  let probes = 0;
  const steps: { x: number; lo: number; grew: boolean; tails: number[] }[] = [];
  for (const x of a) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      ops += 2;
      probes += 1;
      if ((tails[mid] as number) < x) lo = mid + 1;
      else hi = mid;
    }
    ops += 1;
    const grew = lo === tails.length;
    if (grew) tails.push(x);
    else tails[lo] = x;
    steps.push({ x, lo, grew, tails: [...tails] });
  }
  return { best: tails.length, ops, probes, cells: a.length, steps };
}

/**
 * 이분 탐색이 **언제나 오른쪽으로 가는 경우**의 반복 횟수 — 목록 길이가 `k` 일 때
 * `⌊log2(k+1)⌋` 이다. 증가 수열이 그 경우이고, 목록이 가장 길게 자라는 입력이기도 하다.
 */
const probesRight = (k: number): number =>
  k <= 0 ? 0 : Math.floor(Math.log2(k + 1));

/** 그 반복 횟수를 한 항씩 더한 값 — Σ_{m=1}^{N} ⌊log2 m⌋. */
const logSumDirect = (n: number): number => {
  let s = 0;
  for (let m = 1; m <= n; m++) s += Math.floor(Math.log2(m));
  return s;
};

/** 같은 합의 닫힌 형태 — (N+1)⌊log2 N⌋ - 2^(⌊log2 N⌋+1) + 2. */
const logSumClosed = (n: number): number => {
  if (n <= 1) return 0;
  const f = Math.floor(Math.log2(n));
  return (n + 1) * f - 2 ** (f + 1) + 2;
};

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { longestIncreasingSubsequence: (a: number[]) => number };

/** 이분 탐색의 비교를 넓힌 판. 엄격 증가가 비감소가 된다. */
const nondecreasing = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /if \(\(tails\[mid\] as number\) < x\) lo = mid \+ 1;/,
      "if ((tails[mid] as number) <= x) lo = mid + 1;",
    ],
  });

/** 자리를 갈아 끼우는 줄을 지운 판. 목록이 늘기만 하고 값이 안 내려간다. */
const noReplace = (): Promise<Ref> =>
  loadMutant<Ref>(REF, { drop: /^\s*else tails\[lo\] = x;$/ });

/* ────────────────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────────────────── */

const mutantTable = async (
  label: string,
  make: () => Promise<Ref>,
  inputs: [string, number[]][],
): Promise<string> => {
  const mod = await make();
  const rows: string[][] = [["", "정본", label]];
  for (const [name, a] of inputs) {
    rows.push([
      name,
      comma(longestIncreasingSubsequence([...a])),
      comma(mod.longestIncreasingSubsequence([...a])),
    ]);
  }
  return table(rows, [1, 2]).join("\n");
};

const NONDECREASING = await mutantTable("비교를 넓힌다", nondecreasing, FOUR);
const NO_REPLACE = await mutantTable("갈아 끼우지 않는다", noReplace, FOUR);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 부분 수열을 전부 만들어 검사하면 전개 입력에서 무엇이 나오는가. */
  "brute-walk": () => {
    const b = bruteForce(WALK);
    const t = byTails(WALK);
    if (
      b.best !== t.best ||
      t.best !== longestIncreasingSubsequence([...WALK])
    ) {
      throw new Error("두 방법의 답이 갈린다");
    }
    return table(
      [
        ["", "값"],
        ["만들어 본 부분 수열 수", comma(b.tried)],
        ["읽은 원소 수", comma(b.ops)],
        ["가장 긴 증가 부분 수열의 길이", comma(b.best)],
      ],
      [1],
    ).join("\n");
  },

  /** 두 단순한 방법이 제약 규모에서 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["원소 N", "부분 수열 수 2^N", "자리마다 앞을 보는 방법", "이 글의 절차"],
    ];
    for (const n of [8, 20, 1_000, 100_000]) {
      const a = gen(n, "증가");
      const subsets = 2 ** n;
      const dp =
        n <= 20_000 ? bySquareDp(a).ops : ((n * (n - 1)) / 2) * 4 + n * 2;
      rows.push([
        comma(n),
        Number.isFinite(subsets)
          ? subsets > 1e15
            ? subsets.toExponential(3)
            : comma(subsets)
          : `${comma(Math.floor(n * Math.log10(2)) + 1)} 자리`,
        comma(Math.round(dp)),
        comma(byTails(a).ops),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 셋째 칸의 마지막 줄만 닫힌 형태로 냈다 — 원소 100,000 개에서 실제로 실행하면
          200 억 번이라 이 문서를 만들 때 안 끝난다`;
  },

  /** 입력 모양을 바꿔 가며 두 절차의 계수를 잰다. */
  "dp-vs-tails": () => {
    const n = 20_000;
    const rows: string[][] = [
      ["입력 모양", "자리마다 앞을 보는 방법", "이 글의 절차", "몇 배", "답"],
    ];
    for (const mode of ["무작위", "증가", "감소", "같은 값"] as const) {
      const a = gen(n, mode);
      const dp = bySquareDp(a);
      const t = byTails(a);
      if (
        dp.best !== t.best ||
        t.best !== longestIncreasingSubsequence([...a])
      ) {
        throw new Error(`${mode} 에서 답이 갈린다`);
      }
      rows.push([
        mode,
        comma(dp.ops),
        comma(t.ops),
        `${Math.round(dp.ops / t.ops)}배`,
        comma(t.best),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 원소 ${comma(n)} 개 고정. 네 모양 모두에서 이 글의 절차가 적다`;
  },

  /** 전개 입력에서 목록이 어떻게 바뀌는가. */
  "tails-trace": () => {
    const t = byTails(WALK);
    const rows: string[][] = [
      ["보는 원소 x", "찾은 자리 lo", "무엇을 했는가", "목록", "길이"],
    ];
    for (const s of t.steps) {
      rows.push([
        comma(s.x),
        comma(s.lo),
        s.grew ? "끝에 붙였다" : `${s.lo} 번 자리를 갈아 끼웠다`,
        `[${s.tails.join(", ")}]`,
        comma(s.tails.length),
      ]);
    }
    return `${table(rows, [0, 1, 4]).join("\n")}
        └ 붙인 것이 ${comma(t.steps.filter((s) => s.grew).length)} 번, 갈아 끼운 것이 ${comma(t.steps.filter((s) => !s.grew).length)} 번이다`;
  },

  /** 목록이 실제 부분 수열이 아닌 입력. 길이만 맞고 내용은 아니다. */
  "tails-not-a-subsequence": () => {
    /** `pick` 의 값들이 `a` 의 부분 수열인가 — 순서를 지키며 차례로 찾을 수 있는가. */
    const isSubsequence = (a: number[], pick: number[]): boolean => {
      let at = 0;
      for (const v of pick) {
        const found = a.indexOf(v, at);
        if (found < 0) return false;
        at = found + 1;
      }
      return true;
    };
    const rows: string[][] = [
      ["입력 A", "끝난 뒤의 목록", "A 의 부분 수열인가", "답", "길이가 맞는가"],
    ];
    for (const a of [
      [3, 4, 1],
      [10, 9, 2, 5, 3, 7, 101, 18],
      [2, 5, 1, 6, 3],
    ]) {
      const t = byTails(a);
      const answer = longestIncreasingSubsequence([...a]);
      rows.push([
        `[${a.join(", ")}]`,
        `[${(t.steps.at(-1)?.tails ?? []).join(", ")}]`,
        isSubsequence(a, t.steps.at(-1)?.tails ?? []) ? "그렇다" : "아니다",
        comma(answer),
        t.best === answer ? "맞다" : "틀리다",
      ]);
    }
    return table(rows, [3]).join("\n");
  },

  /** 비교를 넓히면 무엇이 나오는가. */
  "mutant-nondecreasing": () => NONDECREASING,

  /** 갈아 끼우지 않으면 무엇이 나오는가. */
  "mutant-no-replace": () => NO_REPLACE,

  /** 전개가 쓰는 입력을 전체 코드로 실행한 값. */
  "walk-result": () => {
    const rows: string[][] = [["입력", "반환값"]];
    for (const [name, a] of FOUR) {
      rows.push([name, comma(longestIncreasingSubsequence([...a]))]);
    }
    return table(rows, [1]).join("\n");
  },

  /** 이분 탐색 반복 횟수의 합을 정의대로 더한 값과 닫힌 형태로 대조한다. */
  "logsum-check": () => {
    const rows: string[][] = [
      ["원소 N", "⌊log2 N⌋", "한 항씩 더한 값", "닫힌 형태", "차이"],
    ];
    for (const n of [1, 2, 4, 5, 8, 100, 1_000, 100_000]) {
      const direct = logSumDirect(n);
      const closed = logSumClosed(n);
      rows.push([
        comma(n),
        comma(n <= 1 ? 0 : Math.floor(Math.log2(n))),
        comma(direct),
        comma(closed),
        comma(direct - closed),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 닫힌 형태는 (N+1)⌊log2 N⌋ - 2^(⌊log2 N⌋+1) + 2 다`;
  },

  /** 이분 탐색 한 번의 반복 횟수를 목록 길이마다 실측과 대조한다. */
  "probe-check": () => {
    const rows: string[][] = [
      ["목록 길이 k", "실측 반복", "⌊log2(k+1)⌋", "차이"],
    ];
    for (const k of [0, 1, 2, 3, 4, 7, 8, 15, 16]) {
      // 길이 k 인 증가 목록에 그보다 큰 값을 넣으면 탐색이 언제나 오른쪽으로 간다.
      const a: number[] = [];
      for (let i = 0; i < k; i++) a.push(i);
      const before = byTails(a).probes;
      const after = byTails([...a, k]).probes;
      rows.push([
        comma(k),
        comma(after - before),
        comma(probesRight(k)),
        comma(after - before - probesRight(k)),
      ]);
    }
    return table(rows, [0, 1, 2, 3]).join("\n");
  },

  /** 최악 입력에서 이분 탐색 반복 횟수가 그 닫힌 형태와 같은가. */
  "cost-scale": () => {
    const rows: string[][] = [
      ["원소 N", "증가 수열의 실측 반복", "닫힌 형태", "차이"],
    ];
    for (const n of [8, 100, 1_000, 20_000]) {
      const probes = byTails(gen(n, "증가")).probes;
      rows.push([
        comma(n),
        comma(probes),
        comma(logSumClosed(n)),
        comma(probes - logSumClosed(n)),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 제약 상한 N = 100,000 에서 닫힌 형태가 ${comma(logSumClosed(100_000))} 이고,
          탐색 한 번을 ⌈log2 N⌉ = ${comma(Math.ceil(Math.log2(100_000)))} 으로 헐겁게 잡은 상한이 ${comma(100_000 * Math.ceil(Math.log2(100_000)))} 이다`;
  },

  /** 최악을 만드는 입력 — 모양을 바꿔 가며 실제로 재 본다. */
  "shape-values": () => {
    const n = 20_000;
    const rows: string[][] = [
      ["입력 모양", "N", "이분 탐색 반복", "기본 연산", "답"],
    ];
    for (const mode of ["증가", "무작위", "감소", "같은 값"] as const) {
      const t = byTails(gen(n, mode));
      rows.push([mode, comma(n), comma(t.probes), comma(t.ops), comma(t.best)]);
    }
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 목록이 얼마나 자라는지가 값을 정한다. 답이 곧 목록의 길이다`;
  },
};
