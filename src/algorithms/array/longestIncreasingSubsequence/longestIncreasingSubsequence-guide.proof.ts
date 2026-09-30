/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 원소 하나를 처리한 상태와 이진 탐색의 바퀴는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든
 * 계측 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts \
 *     src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence-guide.md
 *
 * 비교 횟수를 세는 다른 절차(부분 수열 다 만들기 · 칸마다 앞을 전부 보기 · 앞에서부터 차례로 읽기)는 그림
 * 사이드카에 있고, 셋 다 답을 정본과 대조한 뒤에만 수를 내놓는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  bruteForce,
  chainTo,
  digits,
  FIRST_BREAK,
  firstEnds,
  gen,
  greedyChain,
  INVARIANT_AT,
  linearTails,
  N_MAX,
  N_MID,
  num,
  type Probe,
  probeCount,
  probeText,
  SHAPES,
  type Step,
  searchOn,
  secondsOf,
  show,
  squareDp,
  trace,
  WALK,
  worstProbes,
} from "./longestIncreasingSubsequence-guide.fig.tsx";
import { longestIncreasingSubsequence } from "./longestIncreasingSubsequence-guide.ref.ts";

const REF = new URL(
  "./longestIncreasingSubsequence-guide.ref.ts",
  import.meta.url,
).pathname;

const lis = (a: readonly number[]): number =>
  longestIncreasingSubsequence([...a]);

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

/** 표 · 그 아래 문장 — 블록 하나. */
const block = (table: string, ...lines: string[]): string =>
  [table, "", ...lines].join("\n");

const dots = (xs: readonly (number | string)[]): string =>
  xs.length === 0 ? "—" : xs.join(" · ");

/** 등폭 글자 폭 — CJK 는 2 칸. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 등폭 칸 맞춤 — `text` 펜스 안의 열을 값의 폭에서 맞춘다. */
function columns(rows: string[][], right: readonly number[] = []): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) =>
          right.includes(c)
            ? padLeft(cell, widths[c] ?? 0)
            : pad(cell, widths[c] ?? 0),
        )
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { longestIncreasingSubsequence: (a: number[]) => number };

/** 이진 탐색의 비교를 넓힌 판. 엄격 증가가 비감소가 된다. */
const NONDECREASING = await loadMutant<Ref>(REF, {
  swap: [
    /if \(\(tails\[mid\] as number\) < x\) lo = mid \+ 1;/,
    "if ((tails[mid] as number) <= x) lo = mid + 1;",
  ],
});

/** 자리를 갈아 끼우는 줄을 지운 판. 꼬리 배열이 늘기만 하고 값이 안 내려간다. */
const NO_REPLACE = await loadMutant<Ref>(REF, {
  drop: /^\s*else tails\[lo\] = x;$/,
});

/** 중화 실행이면 변이 모듈이 정본 그 자체다 — 그때는 「변이가 답을 바꿨다」 자기검사를 건너뛴다. */
const neutral = (m: Ref): boolean =>
  m.longestIncreasingSubsequence === longestIncreasingSubsequence;

const verdict = (a: number, b: number): string => (a === b ? "같다" : "틀리다");

/** 정본과 변이를 입력마다 나란히 — 판정 칸은 두 값이 같은가. */
function mutantRows(
  m: Ref,
  inputs: readonly (readonly number[])[],
): string[][] {
  let broke = 0;
  const rows = inputs.map((a) => {
    const want = lis(a);
    const got = m.longestIncreasingSubsequence([...a]);
    if (want !== got) broke++;
    return [show(a), num(want), num(got), verdict(want, got)];
  });
  if (!neutral(m) && broke === 0) {
    throw new Error("변이가 어느 입력에서도 답을 안 바꿨다");
  }
  return rows;
}

/** 입력의 앞 원소 몇 개만 넣은 답 — 정본과 변이를 한 줄씩. */
function prefixRows(m: Ref, a: readonly number[]): string[][] {
  return a.map((_, k) => {
    const pre = a.slice(0, k + 1);
    const want = lis(pre);
    const got = m.longestIncreasingSubsequence([...pre]);
    return [num(k + 1), show(pre), num(want), num(got), verdict(want, got)];
  });
}

/* ────────────────────────── 공용 ────────────────────────── */

const WALK_STEPS: Step[] = trace(WALK);
const FINAL: readonly number[] = (WALK_STEPS.at(-1) as Step).after;
const ANSWER = lis(WALK);
const DP = squareDp(WALK);

const stepId = (s: Step): string => `T${s.i + 1}`;

/** 탐색 바퀴를 조건식 판정으로 — `10 < 9` 거짓. */
const probeCond = (pr: Probe, x: number): string =>
  `\`${pr.v} < ${x}\` ${pr.less ? "참" : "거짓"}`;

/** 걸음 한 벌을 등폭 두 줄로 — 탐색 자취와 갈래. */
function stepLines(s: Step): string[][] {
  const search =
    s.probes.length === 0
      ? `꼬리 배열 ${show(s.before)} · lo = hi = 0 → 0 < 0 이 거짓이라 탐색을 안 한다`
      : `꼬리 배열 ${show(s.before)} · ${s.probes.map((pr) => probeText(pr, s.x)).join(" · ")}`;
  const place = s.grew
    ? `자리 ${s.lo} = 길이 ${s.before.length} → ② 끝에 붙인다`
    : `자리 ${s.lo} < 길이 ${s.before.length} → ③ ${s.before[s.lo]}${을를(s.before[s.lo] as number)} ${s.x}${으로(s.x)} 바꾼다`;
  return [
    [stepId(s), `x = ${s.x}`, search],
    ["", "", `${place} → 꼬리 배열 ${show(s.after)}`],
  ];
}

/* ────────────────────────── 전체 컨셉 ────────────────────────── */

function conceptExamples(): string {
  const picks: number[][] = [
    [2, 4, 5, 7],
    [2, 3, 5, 6],
    [0, 6],
    [1, 3, 6],
  ];
  const rows = picks.map((p) => {
    const vals = p.map((i) => WALK[i] as number);
    const bad = vals.findIndex((v, k) => k > 0 && v <= (vals[k - 1] as number));
    return [
      `{${p.join(", ")}}`,
      dots(vals),
      bad < 0 ? "증가한다" : `${vals[bad - 1]} > ${vals[bad]} 에서 끊긴다`,
      bad < 0 ? num(vals.length) : "—",
    ];
  });
  const b = bruteForce(WALK);
  return block(
    md(["고른 칸", "그 칸의 값", "판정", "길이"], rows, [3]),
    `빈 부분 수열을 빼면 증가 부분 수열은 모두 ${num(b.increasing)} 가지이고, 가장 긴 것의 길이는 ${num(b.best)} 입니다. 정본 longestIncreasingSubsequence(${show(WALK)}) 가 낸 값도 ${num(ANSWER)} 입니다.`,
  );
}

/* ────────────────────────── 아이디어를 떠올리는 과정 ────────────────────────── */

function originBrute(): string {
  const rows: string[][] = [];
  for (const a of [WALK, gen(14, "무작위"), gen(20, "무작위")]) {
    const r = bruteForce(a);
    if (r.tried !== 2 ** a.length) throw new Error("가짓수가 2^N 이 아니다");
    rows.push([num(a.length), num(r.tried), num(r.checked), "실행해서 셌다"]);
  }
  const big = 2n ** BigInt(N_MAX);
  rows.push([num(N_MAX), `${num(digits(big))} 자리 수`, "—", "2^N 으로 냈다"]);
  const seconds = big / 100_000_000n;
  return block(
    md(["N", "만든 부분 수열", "검사한 원소", "구한 방법"], rows, [0, 1, 2]),
    `실행해서 센 세 규모에서 만든 부분 수열 수가 2^N 과 같았습니다. 부분 수열 하나를 만드는 데 한 번만 든다고 잡고 초당 1 억 개를 만들어도, N = ${num(N_MAX)} 에서 걸리는 초가 ${num(digits(seconds))} 자리 수입니다.`,
  );
}

function originDp(): string {
  const rows = WALK.map((x, i) => {
    const smaller = WALK.slice(0, i).filter((v) => v < x);
    const from = DP.parent[i] as number;
    return [
      num(i),
      num(x),
      smaller.length === 0 ? "없다" : dots(smaller),
      num(DP.dp[i] as number),
      from < 0 ? "—" : `칸 ${from} (dp ${DP.dp[from]})`,
    ];
  });
  return block(
    md(
      ["i", "A[i]", "앞에서 A[i] 보다 작은 값", "dp[i]", "이어받은 칸"],
      rows,
      [0, 1, 3],
    ),
    `비교한 쌍은 ${num(DP.pairs)} 개이고, dp 의 가장 큰 값 ${num(DP.best)}${이가(DP.best)} 정본의 답 ${num(ANSWER)}${과와(ANSWER)} 같습니다.`,
  );
}

function originDpScale(): string {
  const rows: string[][] = [];
  for (const a of [WALK, gen(1_000, "무작위"), gen(N_MID, "무작위")]) {
    const r = squareDp(a);
    if (r.pairs !== (a.length * (a.length - 1)) / 2) {
      throw new Error("비교한 쌍이 N(N−1)/2 가 아니다");
    }
    rows.push([
      num(a.length),
      num(r.pairs),
      secondsOf(r.pairs),
      "실행해서 셌다",
    ]);
  }
  const big = (N_MAX * (N_MAX - 1)) / 2;
  rows.push([num(N_MAX), num(big), secondsOf(big), "N(N−1)/2 로 냈다"]);
  return block(
    md(["N", "비교한 쌍", "시간(초당 1 억 번)", "구한 방법"], rows, [0, 1, 2]),
    `실행해서 센 세 규모에서 비교한 쌍이 N(N−1)/2 와 같았습니다. 같은 N = ${num(N_MAX)} 의 증가 수열에서 길이마다 가장 작은 끝값을 두는 절차는 이진 탐색 비교가 ${num(worstProbes())} 번입니다.`,
  );
}

/** ④ 의 관찰 — 마지막 원소의 dp 를 정할 때 앞 칸을 길이별로 묶으면. */
const LOOK_AT = WALK.length - 1;

function originLengths(): string {
  const i = LOOK_AT;
  const x = WALK[i] as number;
  const top = Math.max(...DP.dp.slice(0, i));
  const rows: string[][] = [];
  const mins: number[] = [];
  for (let k = 1; k <= top; k++) {
    const vals = WALK.slice(0, i).filter((_, j) => DP.dp[j] === k);
    const least = Math.min(...vals);
    mins.push(least);
    rows.push([
      num(k),
      dots(vals),
      num(least),
      least < x ? `${least} < ${x} · 붙는다` : `${least} > ${x} · 못 붙는다`,
    ]);
  }
  const best = Math.max(...mins.map((m, k) => (m < x ? k + 1 : 0)));
  if (best + 1 !== DP.dp[i]) {
    throw new Error("가장 작은 값으로 정한 dp 가 다르다");
  }
  for (let k = 1; k < mins.length; k++) {
    if ((mins[k] as number) <= (mins[k - 1] as number)) {
      throw new Error("길이마다 가장 작은 값이 커지지 않는다");
    }
  }
  return block(
    md(
      [
        "길이",
        "그 길이로 끝나는 앞 원소",
        "가장 작은 값",
        `${x}${과와(x)}의 비교`,
      ],
      rows,
      [0, 2],
    ),
    `dp[${i}]${을를(i)} 정하려고 앞 원소 ${num(i)} 개를 다 비교했지만, dp[${i}] = ${best} + 1 = ${num(DP.dp[i] as number)}${을를(DP.dp[i] as number)} 정한 것은 길이마다 가장 작은 값 ${num(mins.length)} 개였습니다. 그 값 ${show(mins)}${은는(mins.at(-1) as number)} 길이가 늘수록 커집니다.`,
  );
}

function originTwoWays(): string {
  const rows: string[][] = [];
  const walkDp = squareDp(WALK);
  rows.push([
    `전개 입력 ${show(WALK)}`,
    num(walkDp.pairs),
    num(probeCount(WALK)),
    num(ANSWER),
  ]);
  const ratios: number[] = [];
  for (const mode of SHAPES) {
    const a = gen(N_MID, mode);
    const dp = squareDp(a);
    const probes = probeCount(a);
    ratios.push(dp.pairs / probes);
    rows.push([
      `${mode} · N = ${num(N_MID)}`,
      num(dp.pairs),
      num(probes),
      num(dp.best),
    ]);
  }
  return block(
    md(
      [
        "입력",
        "칸마다 앞을 전부 보는 비교",
        "길이마다 가장 작은 끝값의 비교",
        "답",
      ],
      rows,
      [1, 2, 3],
    ),
    `다섯 줄 모두 두 방식의 답이 같습니다. 원소 ${num(N_MID)} 개에서 비교가 줄어든 배수는 가장 작을 때 ${num(Math.round(Math.min(...ratios)))}배, 가장 클 때 ${num(Math.round(Math.max(...ratios)))}배입니다.`,
  );
}

function originGreedy(): string {
  const inputs: readonly (readonly number[])[] = [
    WALK,
    FIRST_BREAK,
    [1, 3, 2, 4],
    [5, 4, 3, 2, 1],
  ];
  const rows = inputs.map((a) => {
    let last = Number.NEGATIVE_INFINITY;
    const picked: number[] = [];
    for (const x of a) {
      if (x > last) {
        picked.push(x);
        last = x;
      }
    }
    const g = greedyChain(a);
    if (g !== picked.length) throw new Error("고른 값과 답이 다르다");
    return [show(a), num(lis(a)), show(picked), num(g), verdict(lis(a), g)];
  });
  const wrong = rows.filter((r) => r[4] === "틀리다").length;
  return block(
    md(
      ["입력", "정본이 낸 답", "앞에서부터 고른 값", "그 답", "판정"],
      rows,
      [1, 3],
    ),
    `네 입력 가운데 ${num(wrong)} 개에서 답이 틀립니다. 틀린 줄에서는 처음에 고른 값이 뒤에 오는 더 작은 값들을 받지 못했습니다.`,
  );
}

function originFirstEnd(): string {
  const f = firstEnds(FIRST_BREAK);
  const t = trace(FIRST_BREAK);
  const rows = FIRST_BREAK.map((x, k) => [
    num(x),
    show(f.states[k] as number[]),
    show((t[k] as Step).after),
  ]);
  // 값이 0 ~ 4 인 길이 1 ~ 6 짜리 배열을 전부 넣어, 처음 끝값을 두는 쪽이 틀리는 수와
  // 앞에서부터 붙이기와 다른 답을 내는 수를 센다.
  let total = 0;
  let differ = 0;
  let wrong = 0;
  for (let n = 1; n <= 6; n++) {
    for (let code = 0; code < 5 ** n; code++) {
      const a: number[] = [];
      let rest = code;
      for (let i = 0; i < n; i++) {
        a.push(rest % 5);
        rest = Math.floor(rest / 5);
      }
      total++;
      const fe = firstEnds(a).best;
      if (fe !== greedyChain(a)) differ++;
      if (fe !== lis(a)) wrong++;
    }
  }
  const right = lis(FIRST_BREAK);
  return block(
    md(
      ["읽은 원소 x", "처음 끝값을 두는 쪽", "가장 작은 끝값으로 바꾸는 쪽"],
      rows,
      [0],
    ),
    `끝난 뒤 길이는 ${num(f.best)}${과와(f.best)} ${num(right)} 이고 정본의 답은 ${num(right)} 입니다. 값이 0 부터 4 까지인 길이 1 ~ 6 짜리 배열 ${num(total)} 개를 전부 넣었더니, 처음 만든 끝값을 두는 쪽은 ${num(wrong)} 개에서 답이 틀렸고, 앞에서부터 붙인 답과 다른 배열은 ${num(differ)} 개였습니다.`,
  );
}

/* ────────────────────────── 아이디어 상세 ────────────────────────── */

/** 꼬리 배열의 칸 `k` 를 끝으로 하는 부분 수열 하나 — dp 가 `k+1` 이고 값이 `tails[k]` 인 칸에서 거슬러 모은다. */
function witness(k: number): number[] {
  const end = WALK.findIndex(
    (v, i) => DP.dp[i] === k + 1 && v === (FINAL[k] as number),
  );
  if (end < 0) throw new Error(`tails[${k}] 로 끝나는 칸이 없다`);
  const chain = chainTo(DP.parent, end);
  if (chain.length !== k + 1) throw new Error("거슬러 모은 길이가 다르다");
  return chain;
}

function buildRead(): string {
  const k = 1;
  const ends = WALK.map((v, i) => [v, i] as const).filter(
    ([, i]) => DP.dp[i] === k + 1,
  );
  const chain = witness(k);
  const vals = chain.map((i) => WALK[i] as number);
  if (Math.min(...ends.map(([v]) => v)) !== FINAL[k]) {
    throw new Error("꼬리 배열의 칸이 가장 작은 끝값이 아니다");
  }
  return columns([
    [`tails[${k}] = ${FINAL[k]}`, "→", `길이 ${k + 1} 의 가장 작은 끝값`],
    [
      "",
      "→",
      `길이 ${k + 1} 로 끝나는 원소 ${ends.map(([v]) => v).join(" · ")} (칸 ${ends.map(([, i]) => i).join(" · ")})`,
    ],
    [
      "",
      "→",
      `그중 가장 작은 ${FINAL[k]}${을를(FINAL[k] as number)} 끝으로 하는 부분 수열 ${show(vals)} (칸 ${chain.join(" → ")})`,
    ],
  ]);
}

function buildOrder(): string {
  const rows: string[][] = [];
  for (let k = 1; k < FINAL.length; k++) {
    const chain = witness(k);
    const vals = chain.map((i) => WALK[i] as number);
    const cut = vals[vals.length - 2] as number;
    const prev = FINAL[k - 1] as number;
    const here = FINAL[k] as number;
    if (!(prev <= cut && cut < here)) {
      throw new Error("꼬리 배열이 증가하지 않는다");
    }
    rows.push([num(k), num(here), show(vals), num(cut), num(prev)]);
  }
  return block(
    md(
      [
        "k",
        "tails[k]",
        "그 끝값으로 끝나는 길이 k+1 부분 수열",
        "마지막을 뗀 끝값",
        "tails[k−1]",
      ],
      rows,
      [0, 1, 3, 4],
    ),
    `${num(rows.length)} 칸 모두 tails[k−1] ≤ 뗀 끝값 < tails[k] 입니다.`,
  );
}

function buildConfuse(): string {
  const rows: string[][] = [];
  for (let k = 1; k <= FINAL.length; k++) {
    const at = WALK.map((_, i) => i).filter((i) => DP.dp[i] === k);
    const vals = at.map((i) => WALK[i] as number);
    const least = Math.min(...vals);
    if (least !== FINAL[k - 1]) {
      throw new Error("가장 작은 값과 꼬리 배열이 다르다");
    }
    rows.push([
      num(k),
      dots(at),
      dots(vals),
      num(least),
      num(FINAL[k - 1] as number),
    ]);
  }
  return block(
    md(
      [
        "길이",
        "dp 가 그 길이인 칸",
        "그 칸의 값",
        "가장 작은 값",
        "꼬리 배열의 칸",
      ],
      rows,
      [0, 3, 4],
    ),
    `${num(rows.length)} 길이 모두 가장 작은 값과 꼬리 배열의 칸이 같습니다. dp 는 ${num(DP.dp.length)} 칸이고 꼬리 배열은 ${num(FINAL.length)} 칸입니다.`,
  );
}

/** (f) — T5 직후 길이 2 로 끝나는 두 값. */
function buildWhy(): string {
  const pre = WALK.slice(0, INVARIANT_AT + 1);
  const { dp } = squareDp(pre);
  const ends = pre.filter((_, i) => dp[i] === 2);
  if (ends.length !== 2) throw new Error("길이 2 로 끝나는 값이 둘이 아니다");
  const big = Math.max(...ends);
  const small = Math.min(...ends);
  const nexts = [small, small + 1, big, big + 1];
  const rows = nexts.map((y) => [
    num(y),
    y > big ? "붙는다" : "못 붙는다",
    y > small ? "붙는다" : "못 붙는다",
  ]);
  const only = nexts.filter((y) => y > small && y <= big);
  return block(
    md(["뒤에 오는 값", `끝값 ${big} 뒤에`, `끝값 ${small} 뒤에`], rows, [0]),
    `끝값 ${big} 뒤에 붙는 값은 끝값 ${small} 뒤에도 모두 붙고, ${only.join(" · ")}${은는(only.at(-1) as number)} ${small} 뒤에만 붙습니다.`,
  );
}

function buildSearch(): string {
  const cases: [readonly number[], number][] = [
    [[10], 9],
    [[2, 5], 3],
    [[2, 3, 7], 3],
    [[2, 3, 7], 1],
    [[2, 3, 7], 101],
  ];
  const rows = cases.map(([t, x]) => {
    const s = searchOn(t, x);
    return [
      show(t),
      num(x),
      s.probes.map((pr) => `tails[${pr.mid}] = ${pr.v}`).join(" · "),
      num(s.lo),
      s.grew ? "끝 — 붙인다" : "안쪽 — 갈아 끼운다",
    ];
  });
  const ends = rows.filter((r) => r[4]?.startsWith("끝")).length;
  return block(
    md(["꼬리 배열", "x", "읽은 칸", "lo", "경우"], rows, [1, 3]),
    `다섯 줄 가운데 lo 가 길이와 같은 줄은 ${num(ends)} 개이고, 그 줄에서만 x 가 꼬리 배열의 모든 칸보다 큽니다. x 가 이미 있는 값과 같으면 그 값이 있는 칸이 자리로 나옵니다.`,
  );
}

function buildBranches(): string {
  const rows = WALK_STEPS.map((s) => [
    stepId(s),
    num(s.x),
    num(s.before.length),
    num(s.lo),
    s.grew ? "② 끝에 붙인다" : "③ 갈아 끼운다",
    `${show(s.before)} → ${show(s.after)}`,
  ]);
  const grew = WALK_STEPS.filter((s) => s.grew).map(stepId);
  const swapped = WALK_STEPS.filter((s) => !s.grew).map(stepId);
  return block(
    md(["걸음", "x", "길이", "lo", "갈래", "꼬리 배열"], rows, [1, 2, 3]),
    `붙인 걸음은 ${dots(grew)} 로 ${num(grew.length)} 개이고, 갈아 끼운 걸음은 ${dots(swapped)} 로 ${num(swapped.length)} 개입니다. 길이가 는 걸음은 붙인 걸음뿐입니다.`,
  );
}

function buildLength(): string {
  const inputs: readonly (readonly number[])[] = [
    WALK,
    [0, 8, 4, 12, 2, 10, 6, 14, 1, 9],
    [3, 4, 1],
    [7, 7, 7, 7],
    [5, 4, 3, 2, 1],
    [],
  ];
  const rows = inputs.map((a) => {
    const tails = trace(a).at(-1)?.after ?? [];
    const b = bruteForce(a);
    if (tails.length !== b.best) {
      throw new Error("꼬리 배열의 길이가 답이 아니다");
    }
    return [
      a.length === 0 ? "[] (빈 배열)" : show(a),
      show(tails),
      num(tails.length),
      num(b.best),
    ];
  });
  return block(
    md(
      ["입력", "끝난 뒤의 꼬리 배열", "길이", "부분 수열을 다 만든 답"],
      rows,
      [2, 3],
    ),
    `${num(rows.length)} 입력 모두 꼬리 배열의 길이가 부분 수열을 다 만든 답과 같습니다.`,
  );
}

function buildLinear(): string {
  const rows: string[][] = [];
  const ratio = new Map<string, number>();
  for (const mode of SHAPES) {
    const a = gen(N_MID, mode);
    const l = linearTails(a);
    const b = probeCount(a);
    ratio.set(mode, l.cmps / Math.max(1, b));
    rows.push([mode, num(l.cmps), num(b), num(l.best)]);
  }
  const most = SHAPES.reduce((m, s) =>
    (ratio.get(s) ?? 0) > (ratio.get(m) ?? 0) ? s : m,
  );
  return block(
    md(
      ["입력 모양", "앞에서부터 차례로 읽는 비교", "이진 탐색의 비교", "답"],
      rows,
      [1, 2, 3],
    ),
    `원소 ${num(N_MID)} 개에서 차이가 가장 큰 모양은 ${most}이고 ${num(Math.round(ratio.get(most) ?? 0))}배입니다. 꼬리 배열이 길이 1 에 머무는 감소 · 같은 값에서는 두 방식의 비교 수가 같습니다.`,
  );
}

/* ────────────────────────── 수행으로 알아보는 알고리즘 ────────────────────────── */

function walkInput(): string {
  return [
    `const A = [${WALK.join(", ")}];`,
    `// 이 절이 끝나면 ${ANSWER}${이가(ANSWER)} 나와야 한다`,
  ].join("\n");
}

const walkFence = (from: number, to: number): string =>
  columns(WALK_STEPS.slice(from, to + 1).flatMap(stepLines));

function mutantNondecreasing(): string {
  const rows = mutantRows(NONDECREASING, [
    WALK,
    [7, 7, 7, 7],
    [5, 4, 3, 2, 1],
    [1, 2, 2, 3],
  ]);
  return md(["입력", "정본", "비교를 넓힌 코드", "판정"], rows, [1, 2]);
}

function mutantNondecreasingPrefix(): string {
  return md(
    ["읽은 원소", "앞부분", "정본의 길이", "넓힌 코드의 길이", "판정"],
    prefixRows(NONDECREASING, [7, 7, 7, 7]),
    [0, 2, 3],
  );
}

function walkTrace(): string {
  const rows = WALK_STEPS.map((s) => {
    const len = s.before.length;
    return [
      stepId(s),
      num(s.x),
      s.probes.length === 0
        ? "`0 < 0` 거짓 — 탐색 없음"
        : s.probes.map((pr) => probeCond(pr, s.x)).join(" · "),
      num(s.lo),
      `\`${s.lo} === ${len}\` ${s.grew ? "참" : "거짓"}`,
      s.grew ? "②" : "③",
      show(s.after),
    ];
  });
  const cmps = WALK_STEPS.reduce((t, s) => t + s.probes.length, 0);
  return block(
    md(
      ["걸음", "x", "탐색의 비교 ①", "lo", "끝 판정", "갈래", "꼬리 배열"],
      rows,
      [1, 3],
    ),
    `비교는 모두 ${num(cmps)} 번이고, 원소를 다 읽은 뒤 ④ 가 꼬리 배열의 길이 ${num(FINAL.length)}${을를(FINAL.length)} 돌려줍니다.`,
  );
}

function walkBranches(): string {
  const ids = (f: (s: Step) => boolean): string =>
    dots(WALK_STEPS.filter(f).map(stepId));
  return md(
    ["갈래", "실행된 걸음"],
    [
      ["① 비교가 참(lo = mid + 1)", ids((s) => s.probes.some((p) => p.less))],
      ["① 비교가 거짓(hi = mid)", ids((s) => s.probes.some((p) => !p.less))],
      ["① 탐색을 안 한다", ids((s) => s.probes.length === 0)],
      ["② 끝에 붙인다", ids((s) => s.grew)],
      ["③ 갈아 끼운다", ids((s) => !s.grew)],
      ["④ 길이를 돌려준다", stepId(WALK_STEPS.at(-1) as Step)],
    ],
  );
}

/** `pick` 의 값들이 `a` 의 부분 수열인가 — 순서를 지키며 차례로 찾을 수 있는가. */
function isSubsequence(a: readonly number[], pick: readonly number[]): boolean {
  let at = 0;
  for (const v of pick) {
    const found = a.indexOf(v, at);
    if (found < 0) return false;
    at = found + 1;
  }
  return true;
}

const subText = (a: readonly number[], pick: readonly number[]): string =>
  isSubsequence(a, pick) ? "부분 수열이다" : "부분 수열이 아니다";

function tailsNotSubsequence(): string {
  const inputs: readonly (readonly number[])[] = [
    [3, 4, 1],
    WALK,
    [2, 5, 1, 6, 3],
  ];
  const rows = inputs.map((a) => {
    const tails = trace(a).at(-1)?.after ?? [];
    return [
      show(a),
      show(tails),
      subText(a, tails),
      num(lis(a)),
      num(tails.length),
    ];
  });
  const not = rows.filter((r) => r[2] === "부분 수열이 아니다").length;
  return block(
    md(
      [
        "입력",
        "끝난 뒤의 꼬리 배열",
        "부분 수열 여부",
        "답",
        "꼬리 배열의 길이",
      ],
      rows,
      [3, 4],
    ),
    `세 입력 모두 길이는 답과 같고, 그중 ${num(not)} 개에서 꼬리 배열이 입력의 부분 수열이 아닙니다.`,
  );
}

function tailsNotTrace(): string {
  const a = [3, 4, 1];
  const rows = trace(a).map((s) => [
    num(s.x),
    num(s.lo),
    s.grew
      ? "② 끝에 붙인다"
      : `③ ${s.before[s.lo]}${을를(s.before[s.lo] as number)} ${s.x}${으로(s.x)} 바꾼다`,
    show(s.after),
    subText(a, s.after),
  ]);
  return md(["x", "lo", "갈래", "꼬리 배열", "부분 수열 여부"], rows, [0, 1]);
}

function finalCalls(): string {
  const inputs: readonly (readonly number[])[] = [
    WALK,
    [7, 7, 7, 7],
    [5, 4, 3, 2, 1],
    [42],
    [],
  ];
  return columns(
    inputs.map((a) => [
      `longestIncreasingSubsequence([${a.join(", ")}])`,
      "→",
      num(lis(a)),
    ]),
    [2],
  );
}

/* ────────────────────────── 알아 두면 좋은 개념 ────────────────────────── */

function relatedBack(): string {
  // 카드를 놓을 때 왼쪽 더미의 맨 위를 적어 둔다. 칸 번호로 적어 같은 값이 여럿이어도 헷갈리지 않는다.
  const topAt: number[] = [];
  const back = new Map<number, number | null>();
  const lines: string[][] = [];
  for (const s of WALK_STEPS) {
    const left = s.lo === 0 ? null : (topAt[s.lo - 1] as number);
    back.set(s.i, left);
    if (left !== null) {
      lines.push([
        `${s.x}${을를(s.x)} 더미 ${s.lo + 1} 에 놓을 때`,
        `더미 ${s.lo} 의 맨 위 ${WALK[left]}`,
      ]);
    }
    topAt[s.lo] = s.i;
  }
  // 마지막 더미의 맨 위에서 거슬러 간다.
  const chain: number[] = [];
  let at: number | null = topAt.at(-1) as number;
  while (at !== null) {
    chain.unshift(WALK[at] as number);
    at = back.get(at) ?? null;
  }
  if (chain.length !== ANSWER || !isSubsequence(WALK, chain)) {
    throw new Error("거슬러 간 부분 수열이 답과 다르다");
  }
  for (let k = 1; k < chain.length; k++) {
    if ((chain[k] as number) <= (chain[k - 1] as number)) {
      throw new Error("거슬러 간 부분 수열이 증가하지 않는다");
    }
  }
  const last = WALK[topAt.at(-1) as number] as number;
  return [
    columns(lines),
    "",
    `마지막 더미의 맨 위 ${last} 에서 적어 둔 값을 거슬러 가면 ${show(chain)} · 길이 ${chain.length}`,
  ].join("\n");
}

/* ────────────────────────── 수식 정의와 유도 ────────────────────────── */

/** 꼬리 배열의 길이가 `k` 일 때 언제나 오른쪽으로 가는 탐색의 반복 횟수 — 점화식 그대로. */
const bRec = (k: number): number =>
  k <= 0 ? 0 : 1 + bRec(Math.ceil(k / 2) - 1);

function mathBSmall(): string {
  const lines: string[] = ["b(0) = 0"];
  for (let k = 1; k <= 4; k++) {
    const inner = Math.ceil(k / 2) - 1;
    lines.push(`b(${k}) = 1 + b(⌈${k}/2⌉ - 1) = 1 + b(${inner}) = ${bRec(k)}`);
  }
  for (let k = 0; k <= 4; k++) {
    if (bRec(k) !== Math.floor(Math.log2(k + 1))) {
      throw new Error("점화식과 닫힌 형태가 다르다");
    }
  }
  return lines.join("\n");
}

/** 꼬리 배열 길이 `k` 에서 실제 반복 — 길이 k 인 증가 배열에 더 큰 값을 넣는다. */
const probesAt = (k: number): number =>
  k === 0
    ? probeCount([0])
    : searchOn(
        Array.from({ length: k }, (_, i) => i),
        k,
      ).probes.length;

function probeCheck(): string {
  const rows: string[][] = [
    ["꼬리 배열 길이 k", "실측 반복", "⌊log2(k+1)⌋", "차이"],
  ];
  for (const k of [0, 1, 2, 3, 4, 7, 8, 15, 16]) {
    const got = probesAt(k);
    const want = Math.floor(Math.log2(k + 1));
    rows.push([num(k), num(got), num(want), num(got - want)]);
  }
  return columns(rows, [0, 1, 2, 3]);
}

function mathSplit(): string {
  const n = 100;
  const f = Math.floor(Math.log2(n));
  const rows: string[][] = [];
  for (let j = 0; j <= f; j++) {
    const from = 2 ** j;
    const to = Math.min(n, 2 ** (j + 1) - 1);
    const count = to - from + 1;
    if (j <= 2 || j >= f - 1) {
      rows.push([
        from === to ? `m = ${from}` : `m = ${from} ~ ${to}`,
        `⌊log2 m⌋ = ${j}`,
        j === f ? `항 ${count} 개 = ${n} - ${from} + 1` : `항 ${count} 개`,
      ]);
    } else if (j === 3) {
      rows.push(["…"]);
    }
  }
  return [
    `N = ${n} 이면 F = ${f} 이라 구간이 이렇게 갈린다`,
    "",
    columns(rows),
  ].join("\n");
}

function mathGeo(): string {
  const rows: string[][] = [];
  for (let f = 1; f <= 4; f++) {
    const terms = Array.from({ length: f }, (_, j) => `${j}·${2 ** j}`);
    const sum = Array.from({ length: f }, (_, j) => j * 2 ** j).reduce(
      (a, b) => a + b,
      0,
    );
    const closed = (f - 2) * 2 ** f + 2;
    if (sum !== closed) throw new Error("닫힌 형태가 합과 다르다");
    rows.push([
      `F = ${f}`,
      `${terms.join(" + ")} = ${sum}`,
      `(${f}-2)·${2 ** f} + 2 = ${closed}`,
    ]);
  }
  return columns(rows);
}

const logSumDirect = (n: number): number => {
  let s = 0;
  for (let m = 1; m <= n; m++) s += Math.floor(Math.log2(m));
  return s;
};

const logSumClosed = (n: number): number => {
  if (n <= 1) return 0;
  const f = Math.floor(Math.log2(n));
  return (n + 1) * f - 2 ** (f + 1) + 2;
};

function logsumCheck(): string {
  const rows: string[][] = [
    ["원소 N", "⌊log2 N⌋", "한 항씩 더한 값", "닫힌 형태", "차이"],
  ];
  for (const n of [1, 2, 4, 5, 8, 100, 1_000, N_MAX]) {
    const direct = logSumDirect(n);
    const closed = logSumClosed(n);
    rows.push([
      num(n),
      num(n <= 1 ? 0 : Math.floor(Math.log2(n))),
      num(direct),
      num(closed),
      num(direct - closed),
    ]);
  }
  return columns(rows, [0, 1, 2, 3, 4]);
}

function costScale(): string {
  const rows: string[][] = [
    ["원소 N", "증가 수열의 실측 반복", "닫힌 형태", "차이"],
  ];
  for (const n of [8, 100, 1_000, N_MID, N_MAX]) {
    const probes = n === N_MAX ? worstProbes() : probeCount(gen(n, "증가"));
    rows.push([
      num(n),
      num(probes),
      num(logSumClosed(n)),
      num(probes - logSumClosed(n)),
    ]);
  }
  return columns(rows, [0, 1, 2, 3]);
}

/* ────────────────────────── 불변식 ────────────────────────── */

function invariantT5(): string {
  const s = WALK_STEPS[INVARIANT_AT] as Step;
  const pre = WALK.slice(0, INVARIANT_AT + 1);
  const { dp, parent } = squareDp(pre);
  const lines: string[][] = [];
  s.after.forEach((v, k) => {
    const end = pre.findIndex((w, i) => dp[i] === k + 1 && w === v);
    const ends = pre.filter((_, i) => dp[i] === k + 1);
    if (Math.min(...ends) !== v) {
      throw new Error("꼬리 배열의 칸이 가장 작은 끝값이 아니다");
    }
    const chain = chainTo(parent, end);
    lines.push([
      `tails[${k}] = ${v}`,
      `길이 ${k + 1} 로 끝나는 값 ${ends.join(" · ")} 가운데 가장 작다`,
      `부분 수열 ${show(chain.map((i) => pre[i] as number))} (칸 ${chain.join(" → ")})`,
    ]);
  });
  const next = s.after.length + 1;
  if (dp.some((d) => d === next)) {
    throw new Error("자리가 없는 길이를 이미 만들 수 있다");
  }
  lines.push([
    `tails[${s.after.length}]`,
    `자리가 없다 — 읽은 원소 ${show(pre)} 로는 길이 ${next}${을를(next)} 만들 수 없다`,
  ]);
  return columns(lines);
}

function invariantEdges(): string {
  const inputs: [string, readonly number[]][] = [
    ["빈 배열", []],
    ["원소 하나", [42]],
    ["같은 값만", [7, 7, 7, 7]],
    ["엄격 감소", [5, 4, 3, 2, 1]],
    ["엄격 증가", [1, 2, 3, 4, 5]],
    ["음수만", [-3, -2, -1, 0]],
    ["값의 양 끝", [-1_000_000_000, 0, 1_000_000_000]],
  ];
  const rows = inputs.map(([name, a]) => {
    const t = trace(a);
    const grew = t.filter((s) => s.grew).length;
    return [
      `${name} ${a.length === 0 ? "[]" : show(a)}`,
      num(grew),
      num(t.length - grew),
      num(lis(a)),
    ];
  });
  return md(["입력", "붙인 걸음", "갈아 끼운 걸음", "결과"], rows, [1, 2, 3]);
}

function mutantNoReplace(): string {
  const rows = mutantRows(NO_REPLACE, [
    WALK,
    [7, 7, 7, 7],
    [5, 4, 3, 2, 1],
    [42],
  ]);
  return md(["입력", "정본", "갈아 끼우지 않는 코드", "판정"], rows, [1, 2]);
}

function mutantNoReplacePrefix(): string {
  return md(
    [
      "읽은 원소",
      "앞부분",
      "정본의 길이",
      "갈아 끼우지 않는 코드의 길이",
      "판정",
    ],
    prefixRows(NO_REPLACE, WALK),
    [0, 2, 3],
  );
}

/* ────────────────────────── 비용 계산 ────────────────────────── */

function perfDerive(): string {
  const rows = WALK_STEPS.map((s) => [
    stepId(s),
    `x = ${s.x}`,
    `길이 ${s.before.length}`,
    `비교 ${s.probes.length} 번`,
    s.grew ? "붙이기 1 번" : "갈아 끼우기 1 번",
  ]);
  const cmps = WALK_STEPS.reduce((t, s) => t + s.probes.length, 0);
  const grew = WALK_STEPS.filter((s) => s.grew).length;
  return [
    columns(rows),
    "",
    `합: 비교 ${cmps} 번 · 쓰기 ${WALK_STEPS.length} 번(붙이기 ${grew} + 갈아 끼우기 ${WALK_STEPS.length - grew}) · 끝 판정 ${WALK_STEPS.length} 번`,
  ].join("\n");
}

function perfBestWorst(): string {
  const rows: string[][] = [];
  const got = new Map<string, number>();
  for (const mode of SHAPES) {
    const a = gen(N_MID, mode);
    const probes = probeCount(a);
    got.set(mode, probes);
    rows.push([mode, num(lis(a)), num(probes), (probes / N_MID).toFixed(2)]);
  }
  const up = got.get("증가") ?? 0;
  const down = got.get("감소") ?? 1;
  return block(
    md(
      ["입력 모양", "끝난 뒤 길이", "이진 탐색 비교", "원소당 비교"],
      rows,
      [1, 2, 3],
    ),
    `원소 ${num(N_MID)} 개에서 증가 수열의 비교가 감소 수열의 ${(up / down).toFixed(1)}배입니다.`,
  );
}

function shapeValues(): string {
  const rows: string[][] = [];
  for (const mode of ["증가", "무작위", "감소", "같은 값"] as const) {
    const a = gen(N_MID, mode);
    const t = lis(a);
    const bound = t <= 1 ? 1 : Math.floor(Math.log2(t)) + 1;
    rows.push([mode, num(N_MID), num(probeCount(a)), num(t), num(bound)]);
  }
  return block(
    md(
      [
        "입력 모양",
        "N",
        "이진 탐색 비교",
        "답(끝난 뒤 길이)",
        "탐색 한 번의 상한",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "탐색 한 번의 상한은 끝난 뒤 길이 L 에서 ⌊log2 L⌋ + 1 입니다. 비교 수가 큰 순서와 끝난 뒤 길이가 긴 순서가 같습니다.",
  );
}

/* ────────────────────────── 스스로 점검하기 ────────────────────────── */

const EIGHT: readonly number[] = [...WALK.slice(0, -1), 8];

function selfcheckEight(): string {
  const s = WALK_STEPS[WALK_STEPS.length - 2] as Step;
  return columns([
    [`${stepId(s)} 뒤`, `꼬리 배열 ${show(s.after)}`, `길이 ${s.after.length}`],
    ["", `마지막 원소가 ${WALK.at(-1)} 대신 8 이었다면?`],
  ]);
}

function selfcheckEightAnswer(): string {
  const s = trace(EIGHT).at(-1) as Step;
  return [
    `꼬리 배열 ${show(s.before)} 에서 8 이상인 첫 칸을 찾는다`,
    ...s.probes.map((pr) => `  ${probeText(pr, 8)}`),
    `자리 ${s.lo}${이가(s.lo)} 끝(길이 ${s.before.length})이 아니다 → tails[${s.lo}] = 8 → 꼬리 배열 ${show(s.after)} · 길이 ${s.after.length}`,
  ].join("\n");
}

function selfcheckNext(): string {
  const y = 10;
  const rows = [8, WALK.at(-1) as number].map((last) => {
    const a = [...WALK.slice(0, -1), last, y];
    const s = trace(a).at(-1) as Step;
    return [
      num(last),
      show(s.before),
      s.grew ? "② 끝에 붙인다" : `③ 자리 ${s.lo}${을를(s.lo)} 갈아 끼운다`,
      num(lis(a)),
    ];
  });
  return md(
    ["마지막 원소", `${y}${이가(y)} 오기 전의 꼬리 배열`, `${y} 의 갈래`, "답"],
    rows,
    [0, 3],
  );
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 고른 칸 몇 벌과 증가 여부. */
  "concept-examples": conceptExamples,
  /** `deep.origin` ② — 부분 수열을 전부 만들면. */
  "origin-brute": originBrute,
  /** `deep.origin` ③ — 칸마다 앞을 전부 보는 dp. */
  "origin-dp": originDp,
  /** `deep.origin` ③ — 그 방법의 비교 쌍이 규모에 따라. */
  "origin-dp-scale": originDpScale,
  /** `deep.origin` ④ — 마지막 원소의 dp 를 길이별로 묶으면. */
  "origin-lengths": originLengths,
  /** `deep.origin` ④ — 같은 입력을 두 방식으로. */
  "origin-two-ways": originTwoWays,
  /** `deep.origin` ⑤ — 앞에서부터 붙이기. */
  "origin-greedy": originGreedy,
  /** `deep.origin` ⑤ — 길이마다 처음 만든 끝값. */
  "origin-first-end": originFirstEnd,
  /** `deep.build` 개념 — 칸 하나를 읽는 법. */
  "build-read": buildRead,
  /** `deep.build` 개념 — 칸끼리 커지는 까닭. */
  "build-order": buildOrder,
  /** `deep.build` 개념 — dp 와 꼬리 배열. */
  "build-confuse": buildConfuse,
  /** `deep.build` 개념 — 작은 끝값이 받는 값. */
  "build-why": buildWhy,
  /** `deep.build` 1단계 — 자리 찾기의 경우들. */
  "build-search": buildSearch,
  /** `deep.build` 2단계 — 여덟 원소의 갈래. */
  "build-branches": buildBranches,
  /** `deep.build` 3단계 — 길이가 답인가. */
  "build-length": buildLength,
  /** `deep.build` 설계 선택 — 차례로 읽기와 이진 탐색. */
  "build-linear": buildLinear,
  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — T1. */
  "walk-first": () => walkFence(0, 0),
  /** `deep.walk` 2 — T2 · T3. */
  "walk-search": () => walkFence(1, 2),
  /** `deep.walk.pause` — 비교를 넓히면. */
  "mutant-nondecreasing": mutantNondecreasing,
  /** `deep.walk.pause` — 같은 값 넷을 한 원소씩. */
  "mutant-nondecreasing-prefix": mutantNondecreasingPrefix,
  /** `deep.walk` 3 — T4 ~ T6. */
  "walk-place": () => walkFence(3, 5),
  /** `deep.walk` 4 — T1 ~ T8 의 상태와 분기 판정. */
  "walk-trace": walkTrace,
  /** `deep.walk` 4 — 갈래마다 실행된 걸음. */
  "walk-branches": walkBranches,
  /** `deep.walk.pause` — 끝난 꼬리 배열이 부분 수열인가. */
  "tails-not-a-subsequence": tailsNotSubsequence,
  /** `deep.walk.pause` — [3 4 1] 의 자취. */
  "tails-not-trace": tailsNotTrace,
  /** `deep.walk.final` — 전체 코드에 다섯 입력을 넣은 답. */
  "final-calls": finalCalls,
  /** `related` — 카드를 놓을 때 적어 둔 왼쪽 더미의 맨 위. */
  "related-back": relatedBack,
  /** `deep.math` ② — 점화식을 작은 값에 넣은 검산. */
  "math-b-small": mathBSmall,
  /** `deep.math` ② — 꼬리 배열 길이마다 실측 반복. */
  "probe-check": probeCheck,
  /** `deep.math` ③ — N = 100 의 구간. */
  "math-split": mathSplit,
  /** `deep.math` ③ — 합의 닫힌 형태 검산. */
  "math-geo": mathGeo,
  /** `deep.math` ③ — 한 항씩 더한 값과 닫힌 형태. */
  "logsum-check": logsumCheck,
  /** `deep.math` ④ — 증가 수열의 실측과 닫힌 형태. */
  "cost-scale": costScale,
  /** `invariant` ② — T5 직후의 꼬리 배열과 그 칸을 만드는 부분 수열. */
  "invariant-t5": invariantT5,
  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 갈아 끼우지 않으면. */
  "mutant-no-replace": mutantNoReplace,
  /** `invariant` ③ — 전개 입력을 한 원소씩. */
  "mutant-no-replace-prefix": mutantNoReplacePrefix,
  /** `perf.derive` — T1 ~ T8 의 비교와 쓰기. */
  "perf-derive": perfDerive,
  /** `perf.bounds` — 최선과 최악. */
  "perf-best-worst": perfBestWorst,
  /** `perf.worst` — 모양마다 실제로 잰 값. */
  "shape-values": shapeValues,
  /** `selfcheck` — T7 뒤 상태와 물음. */
  "selfcheck-eight": selfcheckEight,
  /** `selfcheck` 답 — 8 의 탐색. */
  "selfcheck-eight-answer": selfcheckEightAnswer,
  /** `selfcheck` 답 — 10 이 이어서 오면. */
  "selfcheck-next": selfcheckNext,
};
