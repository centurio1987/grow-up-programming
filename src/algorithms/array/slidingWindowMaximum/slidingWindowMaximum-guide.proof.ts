/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.** 정본이 읽은 칸의
 * 기록(`run` · `count`)과 걸음(`WALK_STEPS`)은 그림 사이드카가 만든 것을 그대로 받는다 — 그림과 표가 같은
 * 기록을 쓴다. 비용은 원고 전체가 한 기준으로 센다 — **칸 접근 수**(읽기 + 쓰기)이고, 세는 규칙은 그림
 * 사이드카의 `Counts` 머리 주석에 있다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/slidingWindowMaximum/slidingWindowMaximum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases } from "./slidingWindowMaximum-guide.alt.ts";
import {
  afterRead,
  BIG,
  BIG_N,
  type Counts,
  code,
  count,
  DOWN,
  decreasing,
  dots,
  formula,
  keepOneOnly,
  MID_K,
  mixed,
  num,
  OPS_PER_SECOND,
  rescanEvery,
  rescanFormula,
  run,
  seconds,
  show,
  stackOnly,
  TASK_K,
  TASK_N,
  WALK,
  WALK_K,
  WALK_STEPS,
  type WalkStep,
  windowMax,
  windowOf,
} from "./slidingWindowMaximum-guide.fig.tsx";
import { slidingWindowMaximum } from "./slidingWindowMaximum-guide.ref.ts";

const REF = new URL("./slidingWindowMaximum-guide.ref.ts", import.meta.url)
  .pathname;

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

const block = (...parts: string[]): string => parts.join("\n\n");

const v = (p: number): number => WALK[p] as number;
const N = WALK.length;
const K = WALK_K;
const win = (i: number): string => {
  const [a, b] = windowOf(i, K);
  return `[${a},${b}]`;
};

/* ───────────────────────── 정의로 구하는 값 ───────────────────────── */

/**
 * 자리 `i` 까지 읽은 시점의 후보 집합 `C(i)` — 창 `[i − k + 1, i]` 안에 있고, 자기 오른쪽(`i` 까지)에 자기보다 큰
 * 값이 없는 자리. 정의를 글자 그대로 옮긴 것이라 절차를 쓰지 않는다.
 */
function candidateSet(xs: readonly number[], k: number, i: number): number[] {
  const out: number[] = [];
  for (let t = Math.max(0, i - k + 1); t <= i; t++) {
    let ok = true;
    for (let u = t + 1; u <= i; u++) {
      if ((xs[u] as number) > (xs[t] as number)) ok = false;
    }
    if (ok) out.push(t);
  }
  return out;
}

/** 전개 입력의 자리마다 처리를 마친 뒤의 `cand`(그림 사이드카의 걸음에서). */
const dqAfter = (i: number): readonly number[] => afterRead(i).dq;

/** 기록에서 자리마다 처리를 마친 뒤의 단조 덱 — 큰 입력에서 쓴다. */
function dequeByPosition(xs: readonly number[], k: number): number[][] {
  const { events } = run(xs, k);
  const dq: number[] = [];
  const out: number[][] = [];
  for (const e of events) {
    if (e.kind === "expire") dq.shift();
    else if (e.kind === "cmp" && e.pop) dq.pop();
    else if (e.kind === "push") {
      dq.push(e.i);
      out[e.i] = [...dq];
    }
  }
  return out;
}

/* ───────────────────────── 변이 셋 ───────────────────────── */

interface Impl {
  slidingWindowMaximum: (nums: number[], k: number) => number[];
}

/** 맨 앞 자리를 **되풀이해서** 버리는 사본. 답은 안 갈린다. */
const expiryWhile = await loadMutant<Impl>(REF, {
  swap: [
    /if \(cand\.length > 0 && \(cand\[0\] \?\? 0\) <= i - k\) cand\.shift\(\);/,
    "while (cand.length > 0 && (cand[0] ?? 0) <= i - k) cand.shift();",
  ],
});

/** 창이 다 차기 전에도 답을 적는 사본. */
const noWarmup = await loadMutant<Impl>(REF, {
  swap: [/if \(i >= k - 1\) result\.push/, "result.push"],
});

/** 창을 벗어났는지 판정하는 부등호에서 등호를 뗀 사본. 불변식을 지키던 그 줄이다. */
const expiryStrict = await loadMutant<Impl>(REF, {
  swap: [/<= i - k/, "< i - k"],
});

type Case = readonly [readonly number[], number];

/**
 * 정본과 변이를 같은 입력들에 걸고 답을 나란히 적는다. `same` 이면 「답이 안 갈린다」를, 아니면 「깨진다」를
 * 그 자리에서 확인한다 — 다만 중화 실행에서는 변이 모듈이 정본 그대로라 「깨진다」 검사를 건너뛴다(SPEC §0
 * 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
 */
function mutantRows(
  inputs: readonly Case[],
  mutated: Impl,
  column: string,
  same = false,
): { table: string; diff: number; rows: { good: string; bad: string }[] } {
  const neutral = mutated.slidingWindowMaximum === slidingWindowMaximum;
  const rows = inputs.map(([xs, k]) => ({
    name: show(xs),
    k: String(k),
    good: show(slidingWindowMaximum([...xs], k)),
    bad: show(mutated.slidingWindowMaximum([...xs], k)),
  }));
  if (!neutral && !same && rows.every((r) => r.good === r.bad)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
  if (same && rows.some((r) => r.good !== r.bad)) {
    throw new Error("답이 갈렸다 — 「답이 안 갈린다」가 거짓이다");
  }
  const diff = rows.filter((r) => r.good !== r.bad).length;
  const table = md(
    ["입력", "k", "바른 코드", column, "답"],
    rows.map((r) => [
      r.name,
      r.k,
      r.good,
      r.bad,
      r.good === r.bad ? "같다" : "다르다",
    ]),
    [1],
  );
  return { table, diff, rows };
}

/**
 * 어떤 구현이 창마다 답을 적을 때 읽은 앞 자리 — 한 바퀴의 마지막 읽기가 답을 적는 읽기다(정본과 변이가
 * 같은 줄 모양이라 차례가 같다). 입력 배열을 감시해 모은다.
 */
function answerFronts(impl: Impl, xs: readonly number[], k: number): number[] {
  const reads: number[] = [];
  impl.slidingWindowMaximum(
    new Proxy([...xs], {
      get(t, key, r) {
        if (typeof key === "string" && /^\d+$/.test(key))
          reads.push(Number(key));
        return Reflect.get(t, key, r);
      },
    }),
    k,
  );
  const fronts: number[] = [];
  let next = 0;
  let last = -1;
  for (const p of reads) {
    if (p === next) {
      if (next - 1 >= k - 1) fronts.push(last);
      next++;
    }
    last = p;
  }
  if (next - 1 >= k - 1) fronts.push(last);
  return fronts;
}

/* ───────────────────────── 걸음에서 뽑는 값 ───────────────────────── */

/** 걸음의 갈래 표지 — 절차 그림의 원문자와 같다. */
const branchOf = (s: WalkStep): string => {
  const ans = s.answer ? " ⑤" : "";
  switch (s.kind) {
    case "expire":
      return "②";
    case "pop":
      return "③";
    case "stop":
      return `③ ④${ans}`;
    case "push":
      return `④${ans}`;
  }
};

/** 걸음 번호 나열(「T3 · T5 · T6」). */
const idsOf = (pred: (s: WalkStep) => boolean): string =>
  WALK_STEPS.filter(pred)
    .map((s) => s.id)
    .join(" · ");

/** 자리 `i` 를 처리한 걸음 중 첫 걸음인가 — 지금 값 `nums[i]` 는 그 걸음에서 한 번 읽는다. */
const firstOfI = (t: WalkStep): boolean =>
  WALK_STEPS.find((u) => u.i === t.i) === t;

/** 답 배열의 앞에서부터 적힌 칸만(「[3 3 5]」). */
const filled = (r: readonly (number | null)[]): string =>
  show(r.filter((x): x is number => x !== null));

/** 창마다 큰 값 하나를 심고 사이를 증가시킨 입력 — 최악을 만드는 모양. */
const plantedPeaks = (n: number, k: number, top: number): number[] =>
  Array.from({ length: n }, (_, i) =>
    i % k === 0 ? top - Math.floor(i / k) : i % k,
  );

/** 이웃 둘씩 자리를 바꾼 증가 수열. */
const swappedPairs = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => (i % 2 === 0 ? i + 1 : i - 1));

const SHAPES: readonly [string, (k: number) => number[]][] = [
  ["감소 수열", () => [...DOWN]],
  ["전부 같은 값", () => Array.from({ length: BIG_N }, () => 7)],
  ["증가 수열", () => Array.from({ length: BIG_N }, (_, i) => i)],
  ["곱셈 나머지", () => [...BIG]],
  ["창마다 큰 값 하나 · 나머지 증가", (k) => plantedPeaks(BIG_N, k, 10_000)],
  ["이웃 둘씩 자리를 바꾼 증가 수열", () => swappedPairs(BIG_N)],
];

interface Sweep {
  lo: number;
  loAt: string;
  loK: number;
  hi: number;
  hiAt: string;
  hiK: number;
  runs: number;
}

/** 여섯 모양 × 모든 창 크기에서 가장 적은 값과 가장 많은 값 — 두 블록이 함께 쓴다. */
let sweepMemo: Sweep | undefined;
function sweep(): Sweep {
  if (sweepMemo) return sweepMemo;
  const s: Sweep = {
    lo: Number.POSITIVE_INFINITY,
    loAt: "",
    loK: 0,
    hi: 0,
    hiAt: "",
    hiK: 0,
    runs: 0,
  };
  for (const [name, gen] of SHAPES) {
    for (let k = 1; k <= BIG_N; k++) {
      const a = count(gen(k), k).acc;
      s.runs++;
      if (a < s.lo) {
        s.lo = a;
        s.loAt = name;
        s.loK = k;
      }
      if (a > s.hi) {
        s.hi = a;
        s.hiAt = name;
        s.hiK = k;
      }
    }
  }
  sweepMemo = s;
  return s;
}

const bound = (n: number, k: number): number => 11 * n - 3 * k - 5;

/** 적은 쪽과 그 차이 — 1.15 배를 넘으면 몇 배인지, 아니면 몇 번 차이인지 적는다. */
function lessSide(dq: number, table: number): string {
  const [name, lo, hi] =
    dq < table ? ["단조 덱", dq, table] : ["조각 표", table, dq];
  return hi >= 1.15 * lo
    ? `${name} · ${(hi / lo).toFixed(2)} 배 적다`
    : `${name} · ${num(hi - lo)} 번 적다`;
}

const bench = {
  dq: cases["단조 덱"](),
  table: cases["조각 접두·접미 표"](),
};

/* ───────────────────────── 증명 블록 ───────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 자리 4 를 읽은 시점에 자리 2 가 앞으로 답이 될 수 있는가. */
  "concept-dominated": () => {
    const u = 4;
    const t = 2;
    const want = windowMax(WALK, K);
    const rows: string[][] = [];
    const holdsT: string[] = [];
    for (let s = Math.max(0, u - K + 1); s + K <= N; s++) {
      const b = s + K - 1;
      const hasT = s <= t && t <= b;
      const hasU = s <= u && u <= b;
      if (hasT) holdsT.push(`[${s},${b}]`);
      if (hasT && !hasU)
        throw new Error("자리 t 를 담고 자리 u 를 안 담는 창이 있다");
      rows.push([
        `[${s},${b}]`,
        hasT ? "예" : "아니오",
        hasU ? "예" : "아니오",
        String(want[s]),
      ]);
    }
    if (holdsT.length !== 1)
      throw new Error("자리 t 를 담는 창이 하나가 아니다");
    return block(
      md(
        [
          "아직 답을 안 낸 창",
          `자리 ${t} 포함`,
          `자리 ${u} 포함`,
          "그 창의 최댓값",
        ],
        rows,
        [3],
      ),
      `자리 ${t}${을를(t)} 담는 창은 ${holdsT.join(" · ")} 하나이고, 그 창에는 자리 ${u} 도 들어 있어 최댓값이 ${v(u)} 이상입니다. 값 ${v(t)} 인 자리 ${t} 는 어느 창의 답도 되지 못합니다.`,
    );
  },

  /** `prereq` — 같은 배열에서 비슷한 물음 넷. */
  "prereq-questions": () => {
    const mins = slidingWindowMaximum(
      WALK.map((x) => -x),
      K,
    ).map((x) => -x);
    const wantMin = Array.from({ length: N - K + 1 }, (_, s) =>
      Math.min(...WALK.slice(s, s + K)),
    );
    if (mins.join(",") !== wantMin.join(",")) {
      throw new Error("부호를 뒤집은 정본이 창 최솟값의 정의와 다르다");
    }
    const sums = Array.from({ length: N - K + 1 }, (_, s) =>
      WALK.slice(s, s + K).reduce((a, b) => a + b, 0),
    );
    const nge = WALK.map((x, i) => {
      for (let j = i + 1; j < N; j++) if (v(j) > x) return v(j);
      return -1;
    });
    return md(
      ["물음", `${show(WALK)} 의 답`, "이 글에서"],
      [
        [
          `길이 ${K} 인 창마다 최댓값`,
          show(slidingWindowMaximum([...WALK], K)),
          "다룬다",
        ],
        [`길이 ${K} 인 창마다 최솟값`, show(mins), "부등호만 뒤집는다"],
        [
          `길이 ${K} 인 창마다 합`,
          show(sums),
          "다루지 않는다. 모든 칸이 합에 들어간다",
        ],
        [
          "자리마다 오른쪽에서 처음 더 큰 값",
          show(nge),
          "다루지 않는다. 창이 없다",
        ],
      ],
    );
  },

  /** `deep.origin` ② — 가장 단순한 방법을 과제 규모에 넣으면 몇 번인가. */
  "origin-rescan-scale": () => {
    const rows = [1_000, 10_000].map((n) => {
      const k = n / 10;
      const r = rescanEvery(mixed(n), k);
      if (r.acc !== rescanFormula(n, k)) {
        throw new Error(`N = ${n} 에서 다시 읽기의 실측이 식과 다르다`);
      }
      return [
        num(n),
        num(k),
        num(r.acc),
        num(count(mixed(n), k).acc),
        seconds(r.acc),
      ];
    });
    const naive = rescanFormula(TASK_N, TASK_K);
    rows.push([
      num(TASK_N),
      num(TASK_K),
      num(naive),
      num(count(mixed(TASK_N), TASK_K).acc),
      seconds(naive),
    ]);
    const half = TASK_N / 2;
    return block(
      md(
        [
          "N",
          "k",
          "창마다 다시 읽기의 칸 접근",
          "이 글이 만들 절차의 칸 접근",
          "다시 읽기의 시간(초당 1 억 번)",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `입력은 nums[i] = (2731 i) mod 1201 입니다. 창마다 다시 읽기는 입력과 무관하게 (k + 1)(N − k + 1) 번이라, N = ${num(1_000)} · ${num(10_000)} 은 실제로 세었고 N = ${num(TASK_N)} 은 그 식에 넣은 값입니다. 이 글이 만들 절차는 세 줄 모두 실제로 세었습니다. k 를 N 의 절반인 ${num(half)}${으로(half)} 두면 다시 읽기는 ${num(rescanFormula(TASK_N, half))} 번입니다.`,
    );
  },

  /** `deep.origin` ③ — 작은 입력에서 창마다 읽은 칸. */
  "origin-rescan-small": () => {
    const answers = windowMax(WALK, K);
    const readBy = new Map<number, number>();
    const rows = answers.map((m, s) => {
      const cells = Array.from({ length: K }, (_, j) => s + j);
      for (const c of cells) readBy.set(c, (readBy.get(c) ?? 0) + 1);
      return [`[${s},${s + K - 1}]`, dots(cells), String(m), String(K)];
    });
    const total = answers.length * K;
    const again = [...readBy.entries()]
      .filter(([, t]) => t >= 2)
      .map(([c]) => c)
      .sort((a, b) => a - b);
    return block(
      md(["창", "읽은 자리", "최댓값", "읽은 칸 수"], rows, [2, 3]),
      `창 ${answers.length} 개가 읽은 칸은 모두 ${total} 칸이고, 서로 다른 칸은 ${readBy.size} 칸입니다. 두 창 이상이 거듭 읽은 칸은 자리 ${dots(again)} 입니다.`,
    );
  },

  /** `deep.origin` ④ — 같은 입력에 두 방식을 걸고 계수를 나란히 놓는다. */
  "origin-three-ways": () => {
    const rows = (
      [
        ["곱셈 나머지", BIG],
        ["감소 수열", DOWN],
      ] as const
    ).map(([name, xs]) => {
      const r = rescanEvery(xs, MID_K);
      const o = keepOneOnly(xs, MID_K);
      return [name, num(r.acc), num(o.acc), num(o.rescans)];
    });
    return block(
      md(
        [
          "입력",
          "창마다 다시 읽기",
          "최댓값 하나만 기억하기",
          "그중 창을 다시 읽은 걸음",
        ],
        rows,
        [1, 2, 3],
      ),
      `N = ${num(BIG_N)} · k = ${MID_K} 이고 칸 접근 수를 셉니다. 곱셈 나머지는 nums[i] = (2731 i) mod 1201, 감소 수열은 nums[i] = N − i 이고, 두 방식의 답은 두 입력 모두 정본과 같습니다.`,
    );
  },

  /** `deep.origin` ⑤ — 뒤에서만 버리는 단조 스택으로 답을 내면. */
  "origin-stack-only": () => {
    const xs = [5, 9, 1, 3, 1, 1];
    const k = 3;
    const st = stackOnly(xs, k);
    const want = slidingWindowMaximum([...xs], k);
    const rows = xs.map((x, i) => {
      const stack = st.stack[i] as number[];
      const full = i >= k - 1;
      const [a, b] = windowOf(i, k);
      return [
        `${i} · 값 ${x}`,
        show(stack),
        full ? `${xs[stack[0] as number]}` : "—",
        full ? `[${a},${b}]` : "덜 찼다",
        full ? String(want[i - k + 1]) : "—",
      ];
    });
    const big = stackOnly(BIG, MID_K);
    return block(
      md(
        ["읽은 자리", "뒤에서만 버린 뒤 stack", "맨 앞의 값", "창", "바른 답"],
        rows,
      ),
      `창 ${want.length} 개 중 ${st.wrong} 개에서 답이 다릅니다. ${num(BIG_N)} 칸 곱셈 나머지 입력(k = ${MID_K})에서는 창 ${num(BIG_N - MID_K + 1)} 개 중 ${num(big.wrong)} 개가 틀립니다.`,
    );
  },

  /** `deep.build` (c) — 단조 덱의 칸 하나를 이름에서 답까지 따라간다. */
  "build-read-one": () => {
    const s = afterRead(5);
    const p = s.dq[0] as number;
    const [a, b] = windowOf(5, K);
    return md(
      ["차례", "읽는 것", "나오는 것"],
      [
        ["1", "cand[0]", `자리 ${p}`],
        ["2", `nums[${p}]`, `값 ${v(p)}`],
        ["3", `자리 ${p} 가 창 [${a},${b}] 안인가`, `${p} ≥ ${a} · 창 안이다`],
        ["4", `result[${a}]`, `${s.answer?.value} — 왼쪽 끝이 ${a} 인 창의 답`],
      ],
      [0],
    );
  },

  /** `deep.build` (d) — 단조 덱에서 이웃한 두 칸의 관계. */
  "build-neighbors": () => {
    const seen = new Set<string>();
    const rows: string[][] = [];
    for (let i = 0; i < N; i++) {
      const dq = dqAfter(i);
      for (let c = 0; c + 1 < dq.length; c++) {
        const a = dq[c] as number;
        const b = dq[c + 1] as number;
        const key = `${a},${b}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const between = Array.from({ length: b - a - 1 }, (_, j) => a + 1 + j);
        rows.push([
          `자리 ${a} · 값 ${v(a)}`,
          `자리 ${b} · 값 ${v(b)}`,
          v(a) >= v(b) ? "예" : "아니오",
          between.length === 0
            ? "없음"
            : between.map((p) => `자리 ${p} · 값 ${v(p)}`).join(" · "),
        ]);
      }
    }
    // 큰 입력 — 자리마다 넣은 뒤의 단조 덱에서 이웃한 두 칸을 모두 잰다.
    let pairs = 0;
    let bad = 0;
    for (const dq of dequeByPosition(BIG, MID_K)) {
      for (let c = 0; c + 1 < dq.length; c++) {
        const a = dq[c] as number;
        const b = dq[c + 1] as number;
        pairs++;
        let ok = (BIG[a] as number) >= (BIG[b] as number);
        for (let p = a + 1; p < b; p++)
          if ((BIG[p] as number) >= (BIG[b] as number)) ok = false;
        if (!ok) bad++;
      }
    }
    return block(
      md(
        [
          "앞 칸",
          "바로 뒤 칸",
          "앞 칸의 값 ≥ 뒤 칸의 값",
          "두 자리 사이에 있던 자리",
        ],
        rows,
      ),
      `전개 입력에서 이웃한 두 칸이 ${rows.length} 쌍 나왔습니다. ${num(BIG_N)} 칸 곱셈 나머지 입력(k = ${MID_K})에서는 자리를 넣은 순간마다 이웃한 두 칸 ${num(pairs)} 쌍을 쟀고, 앞 칸의 값이 더 작거나 사이에 뒤 칸의 값 이상인 자리가 있던 쌍은 ${bad} 개입니다.`,
    );
  },

  /** `deep.build` (e) — 창 안의 값을 정렬한 목록과 단조 덱. */
  "build-vs-sorted": () => {
    const rows = WALK.map((_, i) => {
      const [a, b] = windowOf(i, K);
      const sorted = WALK.slice(a, b + 1).sort((x, y) => y - x);
      const dq = dqAfter(i).map(v);
      return [
        `[${a},${b}]`,
        show(sorted),
        show(dq),
        String(sorted.length),
        String(dq.length),
      ];
    });
    const peak = count(BIG, MID_K).peak;
    return block(
      md(
        [
          "창",
          "창 안의 값을 큰 것부터 정렬한 목록",
          "단조 덱의 값",
          "목록 칸 수",
          "단조 덱 칸 수",
        ],
        rows,
        [3, 4],
      ),
      `${num(BIG_N)} 칸 곱셈 나머지 입력(k = ${MID_K})에서 정렬한 목록은 창이 다 찬 뒤로 늘 ${MID_K} 칸이고, 단조 덱은 가장 길 때 ${peak} 칸입니다.`,
    );
  },

  /** `deep.build` (f) — 창 밖으로 나간 자리는 언제나 맨 앞에 있다. */
  "build-two-ends": () => {
    const measure = (xs: readonly number[], k: number) => {
      const { events } = run(xs, k);
      const dq: number[] = [];
      let steps = 0;
      let atFront = 0;
      let twoOrMore = 0;
      for (const e of events) {
        if (e.kind === "cur") {
          const expired = dq.filter((p) => p <= e.i - k);
          if (expired.length > 0) {
            steps++;
            if (expired.length === 1 && expired[0] === dq[0]) atFront++;
            if (expired.length >= 2) twoOrMore++;
          }
        } else if (e.kind === "expire") dq.shift();
        else if (e.kind === "cmp" && e.pop) dq.pop();
        else if (e.kind === "push") dq.push(e.i);
      }
      return { steps, atFront, twoOrMore };
    };
    const rows = (
      [
        ["전개 입력", WALK, K],
        [`곱셈 나머지 ${num(BIG_N)} 칸`, BIG, MID_K],
        [`감소 수열 ${num(BIG_N)} 칸`, DOWN, MID_K],
      ] as const
    ).map(([name, xs, k]) => {
      const m = measure(xs, k);
      return [name, String(k), num(m.steps), num(m.atFront), num(m.twoOrMore)];
    });
    return md(
      [
        "입력",
        "k",
        "창 밖으로 나간 자리가 단조 덱에 있던 걸음",
        "그 자리가 하나이고 맨 앞이던 걸음",
        "둘 이상이던 걸음",
      ],
      rows,
      [1, 2, 3, 4],
    );
  },

  /** `deep.build` 1단계 — 답을 창이 다 찰 때마다 하나씩 붙이면 개수가 저절로 맞는다. */
  "build-init": () =>
    md(
      ["k", "창의 수 N − k + 1", "정본이 낸 답의 수"],
      [1, K, N].map((k) => [
        String(k),
        String(N - k + 1),
        String(slidingWindowMaximum([...WALK], k).length),
      ]),
      [0, 1, 2],
    ),

  /** `deep.build` 2단계 — 자리마다 앞 자리가 창 밖인지 본 결과. */
  "build-expire-steps": () => {
    const rows = WALK.map((_, i) => {
      const before = i === 0 ? [] : [...dqAfter(i - 1)];
      const front = before[0];
      const out = front !== undefined && front <= i - K;
      return [
        String(i),
        win(i),
        front === undefined ? "없다" : `자리 ${front}`,
        String(i - K),
        front === undefined ? "보지 않는다" : out ? "참" : "거짓",
        out ? `자리 ${front}` : "없음",
      ];
    });
    const drops = WALK_STEPS.filter((s) => s.kind === "expire");
    return block(
      md(
        ["자리 i", "창", "앞 자리", "i − k", "앞 자리 ≤ i − k", "버린 자리"],
        rows,
        [0, 3],
      ),
      `앞에서 버린 걸음은 ${drops.length} 번이고, 자리 ${dots(drops.map((s) => s.i))}${을를(drops.at(-1)?.i ?? "")} 읽을 때입니다.`,
    );
  },

  /** `deep.build` 3단계 — 자리마다 뒤에서 버린 자리와 멈춘 까닭. */
  "build-pop-steps": () =>
    md(
      [
        "읽은 자리",
        "앞 처리 뒤 cand",
        "뒤에서 버린 자리(차례대로)",
        "멈춘 까닭",
        "넣은 뒤 cand",
      ],
      WALK.map((x, i) => {
        const here = WALK_STEPS.filter((s) => s.i === i);
        const expire = here.find((s) => s.kind === "expire");
        const start = expire?.dq ?? (i === 0 ? [] : [...dqAfter(i - 1)]);
        const popped = here
          .filter((s) => s.kind === "pop")
          .map((s) => s.back as number);
        const end = here.find(
          (s) => s.kind === "push" || s.kind === "stop",
        ) as WalkStep;
        const why =
          end.kind === "stop"
            ? `뒤 자리 ${end.back} 의 값 ${v(end.back as number)} ≥ ${x}`
            : "단조 덱이 비었다";
        return [
          `${i} · 값 ${x}`,
          show(start),
          popped.length === 0 ? "없음" : dots(popped),
          why,
          show(end.dq),
        ];
      }),
    ),

  /** `deep.build` 3단계 — 창 크기를 바꾸면 단조 덱이 얼마나 길어지는가. */
  "build-k-sweep": () => {
    const ks = [1, 2, 8, 32, 128, 512, BIG_N];
    const rows = ks.map((k) => {
      const a = count(BIG, k);
      const b = count(DOWN, k);
      return [num(k), num(a.acc), num(a.peak), num(b.acc), num(b.peak)];
    });
    const accs = ks.flatMap((k) => [count(BIG, k).acc, count(DOWN, k).acc]);
    const peakMix = Math.max(...ks.map((k) => count(BIG, k).peak));
    return block(
      md(
        [
          "k",
          "곱셈 나머지 · 칸 접근",
          "곱셈 나머지 · 가장 길 때",
          "감소 수열 · 칸 접근",
          "감소 수열 · 가장 길 때",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `N = ${num(BIG_N)} 고정입니다. 가장 길 때의 칸 수는 곱셈 나머지에서 ${peakMix} 칸을 넘지 않고, 감소 수열에서는 k 까지 찹니다. 칸 접근은 ${accs.length} 개 값 모두 ${num(Math.min(...accs))} 이상 ${num(Math.max(...accs))} 이하입니다.`,
    );
  },

  /** `deep.build` 4단계 — 창이 다 찬 자리마다 앞 자리의 값과 창의 최댓값. */
  "build-answers": () => {
    const want = windowMax(WALK, K);
    const rows: string[][] = [];
    for (let i = K - 1; i < N; i++) {
      const front = dqAfter(i)[0] as number;
      rows.push([
        win(i),
        `자리 ${front}`,
        String(v(front)),
        String(want[i - K + 1]),
        v(front) === want[i - K + 1] ? "같다" : "다르다",
      ]);
    }
    return md(
      ["창", "앞 자리", "그 값", "창의 최댓값(정의)", "둘"],
      rows,
      [2, 3],
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 입력과 나와야 할 답. */
  "walk-input": () => {
    const want = code(slidingWindowMaximum([...WALK], K));
    return [
      `const nums = ${code(WALK)};`,
      `const k = ${K};`,
      `// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk.step` 1 — 준비한 직후의 상태. */
  "walk-init": () =>
    md(
      ["nums", "k", "cand", "result", "순회"],
      [[show(WALK), String(K), "[]", "[]", `자리 0 부터 ${N - 1} 까지`]],
      [1],
    ),

  /** `deep.walk.step` 2 — 앞 자리가 창 밖인지 본 두 걸음. */
  "walk-expire-at-4": () => {
    const rows = [4, 5].map((i) => {
      const before = [...dqAfter(i - 1)];
      const front = before[0] as number;
      const out = front <= i - K;
      const after = out ? before.slice(1) : before;
      return [
        `i = ${i}`,
        show(before),
        `자리 ${front}`,
        `\`${front} <= ${i - K}\` ${out ? "참" : "거짓"}`,
        out ? "앞에서 버린다" : "그대로 둔다",
        show(after),
      ];
    });
    return md(
      [
        "걸음",
        "앞 처리 전 cand",
        "앞 자리",
        "조건",
        "하는 일",
        "앞 처리 뒤 cand",
      ],
      rows,
    );
  },

  /** `deep.walk.pause` — 앞에서 버리기를 되풀이하면. */
  "pause-expiry-while": () => {
    const { table, diff, rows } = mutantRows(
      [
        [WALK, K],
        [[5, 4, 3, 2, 1], 2],
        [[1, 2, 3, 4, 5], 3],
        [[7, 7, 7, 7], 2],
      ],
      expiryWhile,
      "되풀이해 버리는 코드",
      true,
    );
    // 되풀이가 실제로 두 번 이상 버린 걸음이 있는가 — 되풀이하는 규칙으로 재생해 전수로 센다. 재생의 답은
    // 정본과 맞댄다.
    let twice = 0;
    let runs = 0;
    const shapes: readonly (readonly number[])[] = [
      WALK,
      BIG,
      DOWN,
      [7, 7, 7, 7],
      [5, 4, 3, 2, 1],
    ];
    for (const xs of shapes) {
      for (let k = 1; k <= xs.length; k++) {
        runs++;
        const dq: number[] = [];
        const out: number[] = [];
        for (let i = 0; i < xs.length; i++) {
          let dropped = 0;
          while (dq.length > 0 && (dq[0] as number) <= i - k) {
            dq.shift();
            dropped++;
          }
          if (dropped >= 2) twice++;
          while (
            dq.length > 0 &&
            (xs[dq.at(-1) as number] as number) < (xs[i] as number)
          )
            dq.pop();
          dq.push(i);
          if (i >= k - 1) out.push(xs[dq[0] as number] as number);
        }
        if (out.join(",") !== slidingWindowMaximum([...xs], k).join(",")) {
          throw new Error("되풀이하는 재생의 답이 정본과 다르다");
        }
      }
    }
    return block(
      table,
      `${rows.length} 벌 중 ${diff} 벌에서 답이 다릅니다. 입력 ${shapes.length} 개의 모든 창 크기 ${num(runs)} 벌을 되풀이하는 규칙으로 실행해 한 걸음에 두 번 이상 앞에서 버린 걸음을 세었고, ${twice} 개입니다.`,
    );
  },

  /** `deep.walk.step` 3 — 자리 4 를 읽는 걸음에서 뒤 자리와 비교한 차례. */
  "walk-pop-at-4": () => {
    const i = 4;
    const here = WALK_STEPS.filter((s) => s.i === i);
    const rows: string[][] = [];
    let turn = 0;
    for (const s of here) {
      if (s.kind === "pop") {
        turn++;
        const t = s.back as number;
        rows.push([
          String(turn),
          `자리 ${t}`,
          String(v(t)),
          `\`${v(t)} < ${v(i)}\` 참`,
          "뒤에서 버린다",
          show(s.dq),
        ]);
      } else if (s.kind === "push") {
        turn++;
        rows.push([
          String(turn),
          "없다",
          "—",
          "`cand.length > 0` 거짓",
          `반복이 끝나고 자리 ${i} 를 넣는다`,
          show(s.dq),
        ]);
      }
    }
    return md(
      ["차례", "뒤 자리", "그 값", "조건", "하는 일", "cand"],
      rows,
      [0],
    );
  },

  /** `deep.walk.step` 4 — 자리마다 답을 적는 조건. */
  "walk-answer": () => {
    const rows = WALK.map((_, i) => {
      const s = afterRead(i);
      const full = i >= K - 1;
      return [
        String(i),
        `\`${i} >= ${K - 1}\` ${full ? "참" : "거짓"}`,
        `자리 ${s.dq[0]}`,
        String(v(s.dq[0] as number)),
        full ? String(s.answer?.value) : "적지 않는다",
        filled(s.result),
      ];
    });
    const answered = WALK.filter((_, i) => i >= K - 1).length;
    return block(
      md(
        ["자리 i", "조건", "앞 자리", "그 값", "적는 답", "result"],
        rows,
        [0, 3],
      ),
      `참인 자리가 ${answered} 개이고, 창의 수 N − k + 1 = ${N} − ${K} + 1 = ${N - K + 1} 과 같습니다.`,
    );
  },

  /** `deep.walk.pause` — 창이 다 차기 전에 답을 적으면. */
  "pause-no-warmup": () => {
    const inputs: Case[] = [
      [WALK, K],
      [[3, 1, 5, 2], 4],
      [[3, 1, 5, 2], 1],
      [[9, 8, 7, 6, 5], 2],
    ];
    const { table, diff, rows } = mutantRows(
      inputs,
      noWarmup,
      "창이 덜 찼을 때도 적는 코드",
    );
    const lens = inputs.map(([xs, k]) => ({
      good: slidingWindowMaximum([...xs], k).length,
      bad: noWarmup.slidingWindowMaximum([...xs], k).length,
      n: xs.length,
      k,
    }));
    const goodAll = lens.every((l) => l.good === l.n - l.k + 1);
    const badAll = lens.every((l) => l.bad === l.n);
    // 중화 실행에서는 변이가 정본 그대로라 개수가 N − k + 1 이다 — 그때는 개수 검사를 건너뛴다.
    const neutral = noWarmup.slidingWindowMaximum === slidingWindowMaximum;
    if (!goodAll || (!neutral && !badAll)) {
      throw new Error("답의 개수가 본문의 문장과 다르다");
    }
    return block(
      table,
      `${rows.length} 벌 중 ${diff} 벌에서 답이 다릅니다. 답의 개수가 바른 코드는 ${rows.length} 벌 모두 N − k + 1 개, 창이 덜 찼을 때도 적는 코드는 ${rows.length} 벌 모두 N 개입니다.`,
    );
  },

  /** `deep.walk.step` 5 — 열다섯 걸음의 조건 판정 전부. */
  "walk-trace": () => {
    const rows = WALK_STEPS.map((s) => {
      let cond = "";
      switch (s.kind) {
        case "expire":
          cond = `\`${s.front} <= ${s.i - K}\`${이가(s.i - K)} **참** → 앞에서 버린다`;
          break;
        case "pop":
          cond = `\`${v(s.back as number)} < ${v(s.i)}\`${이가(v(s.i))} **참** → 뒤에서 버린다`;
          break;
        case "stop":
          cond = `\`${v(s.back as number)} < ${v(s.i)}\`${이가(v(s.i))} **거짓** → 멈춘다`;
          break;
        case "push":
          cond = "`cand.length > 0` 이 **거짓** → 넣는다";
          break;
      }
      if (s.kind === "push" || s.kind === "stop") {
        cond += ` · \`${s.i} >= ${K - 1}\`${이가(K - 1)} ${s.answer ? `**참** → 답 ${s.answer.value}` : "**거짓**"}`;
      }
      return [
        s.id,
        String(s.i),
        cond,
        show(s.dq),
        filled(s.result),
        branchOf(s),
      ];
    });
    const last = WALK_STEPS.at(-1) as WalkStep;
    return block(
      md(
        [
          "걸음",
          "자리 i",
          "조건 판정",
          "걸음 뒤 cand",
          "걸음 뒤 result",
          "갈래",
        ],
        rows,
      ),
      `① 은 T1 앞의 준비, ② 는 ${idsOf((s) => s.kind === "expire")}, ③ 은 ${idsOf((s) => s.kind === "pop" || s.kind === "stop")}, ④ 는 ${idsOf((s) => s.kind === "push" || s.kind === "stop")}, ⑤ 는 ${idsOf((s) => s.answer !== undefined)} 입니다. 앞에서 버리기가 ${last.expires} 번, 뒤에서 버리기가 ${last.pops} 번, 넣기가 ${last.pushes} 번입니다.`,
    );
  },

  /** `deep.walk.pause` — 덱 계약의 한 번과 배열 `shift` 가 실제로 옮기는 칸. */
  "pause-shift-cost": () => {
    const rows: string[][] = [];
    let worst: Counts | undefined;
    for (const [name, gen] of [
      ["감소 수열", decreasing],
      ["곱셈 나머지", mixed],
    ] as const) {
      for (const [n, k] of [
        [BIG_N, MID_K],
        [TASK_N, 1_000],
      ] as const) {
        const c = count(gen(n), k);
        if (name === "감소 수열" && n === TASK_N) worst = c;
        rows.push([name, num(n), num(k), num(c.expires), num(c.moved)]);
      }
    }
    const w = worst as Counts;
    return block(
      md(
        ["입력", "N", "k", "앞에서 버린 횟수", "shift 가 옮긴 칸"],
        rows,
        [1, 2, 3, 4],
      ),
      `앞에서 버린 횟수는 덱의 계약대로 한 번씩 센 값이고, 옮긴 칸은 배열의 shift 가 실제로 옮긴 칸입니다. 감소 수열 ${num(TASK_N)} 칸 · k = ${num(1_000)} 에서는 옮긴 칸이 앞에서 버린 횟수의 ${num(w.moved / w.expires)} 배입니다.`,
    );
  },

  /** `deep.walk.final` — 전체 코드를 부른 결과. */
  "final-calls": () => {
    const calls: [number[], number][] = [
      [[...WALK], K],
      [[3, 1, 5, 2], 1],
      [[3, 1, 5, 2], 4],
      [[-3, -1, -4, -2], 2],
    ];
    const heads = calls.map(
      ([xs, k]) => `slidingWindowMaximum(${code(xs)}, ${k})`,
    );
    const w = Math.max(...heads.map((h) => h.length));
    return calls
      .map(
        ([xs, k], n) =>
          `${(heads[n] as string).padEnd(w)}   →   ${code(slidingWindowMaximum([...xs], k))}`,
      )
      .join("\n");
  },

  /** `related` — 창 최댓값과 최솟값을 자리마다 늘어놓는다. */
  "related-dilation": () => {
    const dil = slidingWindowMaximum([...WALK], K);
    const ero = slidingWindowMaximum(
      WALK.map((x) => -x),
      K,
    ).map((x) => -x);
    const cell = (xs: readonly number[], p: number) =>
      p < xs.length ? String(xs[p]) : "—";
    return md(
      ["줄", ...WALK.map((_, p) => `자리 ${p}`)],
      [
        ["원래 값", ...WALK.map((x) => String(x))],
        [`팽창(창 ${K} 칸의 최댓값)`, ...WALK.map((_, p) => cell(dil, p))],
        [`침식(창 ${K} 칸의 최솟값)`, ...WALK.map((_, p) => cell(ero, p))],
      ],
      WALK.map((_, p) => p + 1),
    );
  },

  /** `purpose.alt` — 감소 수열에서 창 크기만 바꾸면. */
  "alt-k": () => {
    const rows = (
      [
        [2, "k=2"],
        [44, "k=44"],
        [45, "k=45"],
        [BIG_N, "k=1,024"],
      ] as const
    ).map(([k, key]) => {
      const a = bench.dq[`감소 수열 · ${key} 칸 접근`] as number;
      const b = bench.table[`감소 수열 · ${key} 칸 접근`] as number;
      if (count(DOWN, k).acc !== a) {
        throw new Error(
          `k = ${k} 에서 벤치의 단조 덱 계수가 정본 실측과 다르다`,
        );
      }
      return [`k = ${num(k)}`, num(a), num(b), lessSide(a, b)];
    });
    return md(
      [`감소 수열 ${num(BIG_N)} 칸`, "단조 덱", "조각 접두·접미 표", "적은 쪽"],
      rows,
      [1, 2],
    );
  },

  /** `purpose.alt` — 같은 창 크기에서 입력의 모양만 바꾸면. */
  "alt-shape": () => {
    const rows = (
      [
        ["감소 수열", "k=45", 45],
        ["곱셈 나머지", "k=45", 45],
        ["감소 수열", "k=1,024", BIG_N],
        ["곱셈 나머지", "k=1,024", BIG_N],
      ] as const
    ).map(([shape, key, k]) => {
      const a = bench.dq[`${shape} · ${key} 칸 접근`] as number;
      const b = bench.table[`${shape} · ${key} 칸 접근`] as number;
      const xs = shape === "감소 수열" ? DOWN : BIG;
      if (count(xs, k).acc !== a) {
        throw new Error(
          `${shape} · k = ${k} 에서 벤치의 단조 덱 계수가 정본 실측과 다르다`,
        );
      }
      return [`${shape} · k = ${num(k)}`, num(a), num(b), lessSide(a, b)];
    });
    const c45 = bench.dq["감소 수열 · k=45 추가 칸"] as number;
    const cN = bench.dq["감소 수열 · k=1,024 추가 칸"] as number;
    const b45 = bench.table["감소 수열 · k=45 추가 칸"] as number;
    const bN = bench.table["감소 수열 · k=1,024 추가 칸"] as number;
    if (count(DOWN, 45).peak !== c45 || count(DOWN, BIG_N).peak !== cN) {
      throw new Error("벤치의 추가 칸이 정본의 단조 덱 길이와 다르다");
    }
    if (b45 !== bN) throw new Error("조각 표의 추가 칸이 창 크기에 매였다");
    return block(
      md(
        [`${num(BIG_N)} 칸`, "단조 덱", "조각 접두·접미 표", "적은 쪽"],
        rows,
        [1, 2],
      ),
      `추가 칸은 단조 덱이 감소 수열에서 k = 45 에 ${num(c45)} 칸, k = ${num(BIG_N)} 에 ${num(cN)} 칸이고, 조각 표는 두 경우 모두 ${num(b45)} 칸입니다. 답 배열은 출력이라 두 설계 모두 넣지 않았어요.`,
    );
  },

  /** `purpose.alt` — 경계가 왜 그 자리인가. 감소 수열에서는 두 계수가 닫힌 형태로 나온다. */
  "alt-boundary": () => {
    const n = BIG_N;
    const dqF = (k: number) => 9 * n - 4 * k;
    const tableF = (k: number) => 9 * n - 3 * k + 3 - 2 * Math.ceil(n / k);
    for (const [k, key] of [
      [2, "k=2"],
      [44, "k=44"],
      [45, "k=45"],
      [n, "k=1,024"],
    ] as const) {
      if (dqF(k) !== bench.dq[`감소 수열 · ${key} 칸 접근`]) {
        throw new Error(`k = ${k} 에서 단조 덱의 식이 실측과 다르다`);
      }
      if (tableF(k) !== bench.table[`감소 수열 · ${key} 칸 접근`]) {
        throw new Error(`k = ${k} 에서 조각 표의 식이 실측과 다르다`);
      }
    }
    let first = 0;
    for (let k = 2; k <= n; k++) {
      if (dqF(k) < tableF(k)) {
        first = k;
        break;
      }
    }
    const d = (k: number) => dqF(k) - tableF(k);
    return block(
      md(
        ["설계", "감소 수열의 칸 접근", "k = 44", "k = 45"],
        [
          ["단조 덱", "9N − 4k", num(dqF(44)), num(dqF(45))],
          [
            "조각 접두·접미 표",
            "9N − 3k + 3 − 2⌈N/k⌉",
            num(tableF(44)),
            num(tableF(45)),
          ],
        ],
        [2, 3],
      ),
      `단조 덱에서 조각 표를 뺀 차이는 2⌈N/k⌉ − (k + 3) 이고, k = 44 에서 ${d(44)}, k = 45 에서 ${d(45)} 입니다. 단조 덱이 적어지는 첫 k 가 ${first} 이고, √(2N) = ${Math.sqrt(2 * n).toFixed(2)} 입니다.`,
    );
  },

  /** `deep.math` ② — 후보 집합의 정의를 전개 입력에 그대로 넣는다. */
  "candidates-check": () => {
    const rows = WALK.map((_, i) => {
      const set = candidateSet(WALK, K, i);
      const got = [...dqAfter(i)];
      return [
        String(i),
        show(set),
        show(got),
        set.join(",") === got.join(",") ? "같다" : "다르다",
        i >= K - 1 ? String(v(set[0] as number)) : "—",
      ];
    });
    const wrong = rows.filter((r) => r[3] !== "같다").length;
    const byPos = dequeByPosition(BIG, MID_K);
    const bigWrong = byPos.filter(
      (dq, i) => dq.join(",") !== candidateSet(BIG, MID_K, i).join(","),
    ).length;
    return block(
      md(
        ["자리 i", "정의로 구한 C(i)", "정본의 cand", "둘", "맨 앞의 값"],
        rows,
        [0],
      ),
      `여덟 자리에서 두 열이 어긋난 자리는 ${wrong} 개이고, ${num(BIG_N)} 칸 곱셈 나머지 입력(k = ${MID_K})에서도 ${num(byPos.length)} 자리 중 ${bigWrong} 개입니다.`,
    );
  },

  /** `deep.math` ④ — 총식이 입력과 창 크기를 바꿔도 실측과 맞는가. */
  "cost-formula": () => {
    const rows: string[][] = [];
    const inputs: [string, readonly number[], number[]][] = [
      ["전개 입력", WALK, [K]],
      ["곱셈 나머지", BIG, [2, 45, BIG_N]],
      ["감소 수열", DOWN, [2, 45, BIG_N]],
    ];
    let bad = 0;
    for (const [name, xs, ks] of inputs) {
      for (const k of ks) {
        const c = count(xs, k);
        if (formula(c) !== c.acc) bad++;
        rows.push([
          name,
          num(xs.length),
          num(k),
          num(c.pops),
          num(c.expires),
          num(c.stops),
          num(formula(c)),
          num(c.acc),
        ]);
      }
    }
    return block(
      md(
        [
          "입력",
          "N",
          "k",
          "P",
          "F",
          "B",
          "3N − 1 + F + 3P + 2B + 3(N − k + 1)",
          "실측 칸 접근",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7],
      ),
      `${rows.length} 줄 중 총식과 실측이 어긋난 줄은 ${bad} 개입니다.`,
    );
  },

  /** `deep.math` ④ — 상한을 과제 규모에 넣으면. */
  "math-bound": () => {
    const n = TASK_N;
    const k = 1_000;
    const c = count(mixed(n), k);
    const up = bound(n, k);
    const naive = rescanFormula(n, k);
    if (c.acc > up) throw new Error("실측이 상한을 넘었다");
    return block(
      md(
        ["방법", `N = ${num(n)} · k = ${num(k)} 의 칸 접근`],
        [
          ["창마다 다시 읽기 (k + 1)(N − k + 1)", num(naive)],
          ["단조 덱의 상한 11N − 3k − 5", num(up)],
          ["단조 덱 실측(곱셈 나머지 입력)", num(c.acc)],
        ],
        [1],
      ),
      `다시 읽기는 단조 덱의 상한보다 ${(naive / up).toFixed(1)} 배 많습니다.`,
    );
  },

  /** `invariant` ② — 걸음마다 cand 와 정의의 C(i). */
  "invariant-states": () => {
    const rows = WALK_STEPS.map((s) => {
      const done = s.kind === "push" || s.kind === "stop";
      const set = candidateSet(WALK, K, s.i);
      const vals = s.dq.map(v);
      const nonInc = vals.every(
        (x, c) => c === 0 || (vals[c - 1] as number) >= x,
      );
      return [
        s.id,
        String(s.i),
        show(s.dq),
        done ? "예" : "아니오",
        show(set),
        set.join(",") === s.dq.join(",") ? "같다" : "다르다",
        nonInc ? "예" : "아니오",
      ];
    });
    const doneAll = rows.filter((r) => r[3] === "예").length;
    const doneSame = rows.filter(
      (r) => r[3] === "예" && r[5] === "같다",
    ).length;
    const midDiff = rows
      .filter((r) => r[3] === "아니오" && r[5] === "다르다")
      .map((r) => r[0]);
    return block(
      md(
        [
          "걸음",
          "자리 i",
          "걸음 뒤 cand",
          "자리 i 를 끝낸 걸음",
          "정의로 구한 C(i)",
          "둘",
          "cand 의 값이 커지지 않음",
        ],
        rows,
        [1],
      ),
      `자리를 끝낸 ${doneAll} 걸음 중 ${doneSame} 걸음에서 cand 와 C(i) 가 같습니다. 자리를 끝내기 전인 ${midDiff.join(" · ")} 에서는 둘이 다릅니다.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () =>
    md(
      ["입력", "k", "결과", "앞에서 버린 횟수 F", "뒤에서 버린 횟수 P"],
      (
        [
          [[7], 1],
          [[3, 1, 5, 2], 1],
          [[3, 1, 5, 2], 4],
          [[5, 5, 5, 5], 2],
          [[9, 8, 7, 6, 5], 2],
          [[1, 2, 3, 4, 5], 3],
          [[-3, -1, -4, -2], 2],
        ] as const
      ).map(([xs, k]) => {
        const c = count(xs, k);
        return [
          show(xs),
          String(k),
          show(c.result),
          String(c.expires),
          String(c.pops),
        ];
      }),
      [1, 3, 4],
    ),

  /** `invariant` ③ — 창을 벗어났는지 판정하는 등호를 떼면. */
  "mutant-expiry-strict": () => {
    const { table, diff, rows } = mutantRows(
      [
        [WALK, K],
        [[9, 1, 1, 1, 1], 2],
        [[1, 2, 3, 4, 5], 3],
        [[5, 4, 3, 2, 1], 2],
      ],
      expiryStrict,
      "등호를 뗀 코드",
    );
    return block(table, `${rows.length} 벌 중 ${diff} 벌에서 답이 다릅니다.`);
  },

  /** `invariant` ③ — `[9 1 1 1 1]` 에서 두 번째 창의 답을 적을 때 읽은 앞 자리. */
  "mutant-expiry-trace": () => {
    const xs = [9, 1, 1, 1, 1];
    const k = 2;
    const s = 1;
    const [a, b] = [s, s + k - 1];
    const row = (name: string, impl: Impl) => {
      const front = answerFronts(impl, xs, k)[s] as number;
      return [
        name,
        `자리 ${front}`,
        front >= a ? "예" : "아니오",
        String(impl.slidingWindowMaximum([...xs], k)[s]),
      ];
    };
    return md(
      [
        "코드",
        `창 [${a},${b}] 의 답을 적을 때 읽은 앞 자리`,
        "그 자리가 창 안",
        `창 [${a},${b}] 의 답`,
      ],
      [
        row("바른 조건 — cand[0] <= i - k", { slidingWindowMaximum }),
        row("등호를 뗀 조건 — cand[0] < i - k", expiryStrict),
      ],
      [3],
    );
  },

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const c = count(WALK, K);
    const answers = N - K + 1;
    if (formula(c) !== c.acc) throw new Error("전개의 총식이 실측과 다르다");
    return block(
      md(
        ["갈래", "걸음", "식", "칸 접근"],
        [
          ["지금 값을 읽는다", idsOf(firstOfI), "N", num(N)],
          [
            "앞 자리가 창 안인지 본다 ②",
            idsOf((s) => firstOfI(s) && s.i > 0),
            "N − 1",
            num(c.frontChecks),
          ],
          [
            "창 밖 앞 자리를 버린다 ②",
            idsOf((s) => s.kind === "expire"),
            "F",
            num(c.expires),
          ],
          [
            "뒤 자리와 비교한다 ③",
            idsOf((s) => s.kind === "pop" || s.kind === "stop"),
            "2(P + B)",
            num(2 * c.cmp),
          ],
          [
            "뒤 자리를 버린다 ③",
            idsOf((s) => s.kind === "pop"),
            "P",
            num(c.pops),
          ],
          [
            "지금 자리를 넣는다 ④",
            idsOf((s) => s.kind === "push" || s.kind === "stop"),
            "N",
            num(N),
          ],
          [
            "답을 적는다 ⑤",
            idsOf((s) => s.answer !== undefined),
            "3(N − k + 1)",
            num(3 * answers),
          ],
          ["합", "", "3N − 1 + F + 3P + 2B + 3(N − k + 1)", num(c.acc)],
        ],
        [3],
      ),
      `전개는 N = ${N} · k = ${K} · P = ${c.pops} · F = ${c.expires} · B = ${c.stops}${josa(c.stops, "이라", "라")} 식에 넣으면 ${num(formula(c))} 번입니다. 같은 입력을 창마다 다시 읽으면 ${num(rescanEvery(WALK, K).acc)} 번입니다.`,
    );
  },

  /** `perf.derive` — 과제 규모에 넣으면. */
  "perf-scale": () => {
    const n = TASK_N;
    const k = 1_000;
    const shapes: [string, number[]][] = [
      ["감소 수열", decreasing(n)],
      ["곱셈 나머지", mixed(n)],
      ["창마다 큰 값 하나 · 나머지 증가", plantedPeaks(n, k, 10_000)],
    ];
    let most = 0;
    const rows = shapes.map(([name, xs]) => {
      const c = count(xs, k);
      if (formula(c) !== c.acc)
        throw new Error(`${name} 의 총식이 실측과 다르다`);
      if (c.acc > most) most = c.acc;
      return [name, num(c.pops), num(c.expires), num(c.stops), num(c.acc)];
    });
    return block(
      md(["입력", "P", "F", "B", "칸 접근"], rows, [1, 2, 3, 4]),
      `N = ${num(n)} · k = ${num(k)} 에서 세 줄 모두 실제로 세었고, 총식과 같습니다. 상한 11N − 3k − 5 는 ${num(bound(n, k))} 이고, 단순 연산 1 초에 1 억 번으로 잡으면 가장 많은 줄도 ${(most / OPS_PER_SECOND).toFixed(3)} 초입니다.`,
    );
  },

  /** `perf.bounds` — 세 줄의 경계가 서로 다른 종류인가. */
  "perf-range": () => {
    const s = sweep();
    const up = bound(BIG_N, s.hiK);
    return block(
      md(
        ["경계", `N = ${num(BIG_N)} 에서의 값`, "그 값에 이르는 입력"],
        [
          ["최선 5N", num(5 * BIG_N), `${s.loAt} · k = ${num(s.loK)}`],
          ["실측 최대", num(s.hi), `${s.hiAt} · k = ${num(s.hiK)}`],
          ["그 k 의 상한 11N − 3k − 5", num(up), "이르는 입력을 못 찾았다"],
        ],
        [1],
      ),
      `여섯 모양 × 창 크기 ${num(BIG_N)} 벌, 모두 ${num(s.runs)} 번을 실행해 얻은 값입니다. 가장 적은 것은 ${num(s.lo)} 번으로 5N 과 같고, 실측 최대는 그 ${(s.hi / s.lo).toFixed(1)} 배이며 상한과 ${num(up - s.hi)} 번 차이입니다.`,
    );
  },

  /** `perf.worst` — 입력의 모양이 접근 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const k = 45;
    const rows = SHAPES.map(([name, gen]) => {
      const c = count(gen(k), k);
      return [
        name,
        num(c.pops),
        num(c.expires),
        num(c.stops),
        num(c.peak),
        num(formula(c)),
        num(c.acc),
      ];
    });
    const bad = rows.filter((r) => r[5] !== r[6]).length;
    return block(
      md(
        [
          "입력의 모양",
          "뒤에서 버림 P",
          "앞에서 버림 F",
          "멈춘 걸음 B",
          "가장 길 때",
          "총식",
          "실측 칸 접근",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      `N = ${num(BIG_N)} · k = ${k} 입니다. 총식과 실측이 어긋난 줄은 ${bad} 개입니다.`,
    );
  },

  /** `perf.worst` — 최악 모양을 작은 크기로 자리마다 따라간다. */
  "worst-n9": () => {
    const k = 3;
    const xs = plantedPeaks(9, k, 100);
    interface Row {
      i: number;
      front: number[];
      back: number[];
      stop?: number;
      dq: number[];
    }
    const out: Row[] = [];
    const dq: number[] = [];
    for (const e of run(xs, k).events) {
      const cur = out.at(-1);
      if (e.kind === "cur") out.push({ i: e.i, front: [], back: [], dq: [] });
      else if (e.kind === "expire") {
        dq.shift();
        cur?.front.push(e.front);
      } else if (e.kind === "cmp") {
        if (e.pop) {
          dq.pop();
          cur?.back.push(e.back);
        } else if (cur) cur.stop = e.back;
      } else if (e.kind === "push") {
        dq.push(e.i);
        if (cur) cur.dq = [...dq];
      }
    }
    const c = count(xs, k);
    return block(
      md(
        [
          "읽은 자리",
          "앞에서 버린 자리",
          "뒤에서 버린 자리",
          "멈춘 뒤 자리",
          "넣은 뒤 cand",
        ],
        out.map((s) => [
          `${s.i} · 값 ${xs[s.i]}`,
          s.front.length === 0 ? "없음" : dots(s.front),
          s.back.length === 0 ? "없음" : dots(s.back),
          s.stop === undefined ? "없음" : `자리 ${s.stop}`,
          show(s.dq),
        ]),
      ),
      `입력은 ${show(xs)} · k = ${k} 입니다. P = ${c.pops} · F = ${c.expires} · B = ${c.stops} 이고, 칸 접근은 ${num(c.acc)} 번입니다.`,
    );
  },

  /** `selfcheck` — 지금 답에 보탬이 안 되는 자리를 왜 남겨 두는가. */
  "selfcheck-keep-small": () => {
    const changed = [...WALK];
    changed[4] = -2;
    const i = 4;
    const [a, b] = windowOf(i, K);
    const row = (name: string, xs: readonly number[]) => {
      const byPos = dequeByPosition(xs, K);
      const dq = byPos[i] as number[];
      return [
        name,
        show(xs),
        String(slidingWindowMaximum([...xs], K)[a]),
        `자리 ${dq[0]}`,
        show(dq),
      ];
    };
    return md(
      [
        "입력",
        "nums",
        `창 [${a},${b}] 의 답`,
        "그 답의 자리",
        `자리 ${i} 를 끝낸 뒤 cand`,
      ],
      [
        row("전개 입력", WALK),
        row(
          `자리 ${i} 만 ${changed[i]}${으로(changed[i] as number)} 바꾼 입력`,
          changed,
        ),
      ],
    );
  },
};
