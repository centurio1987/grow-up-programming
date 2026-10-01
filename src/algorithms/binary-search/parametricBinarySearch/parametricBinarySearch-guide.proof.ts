/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태와 탐욕 순회 한 칸의 상태는 그림 사이드카의 `trace`·`greedy`(정본 소스에서
 * 기계로 만든 계측 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  dynamicProgramming,
  LARGE,
  LARGE_K,
  parametric,
  SMALL,
  SMALL_K,
} from "./parametricBinarySearch-guide.alt.ts";
import {
  A5,
  allSplits,
  BIG,
  BIG_K,
  bigCounts,
  binom,
  binomDigits,
  bruteAnswer,
  CAND,
  dpSteps,
  greedy,
  groupsText,
  K_UPPER,
  K5,
  maxOf,
  minGroups,
  N_MAX,
  num,
  OTHER_SPLIT,
  oneByOne,
  type Round,
  secondsOf,
  show,
  span,
  splitText,
  sumOf,
  trace,
  V_MAX,
  walkSteps,
} from "./parametricBinarySearch-guide.fig.tsx";
import {
  feasible,
  parametricBinarySearch,
} from "./parametricBinarySearch-guide.ref.ts";

const REF = new URL("./parametricBinarySearch-guide.ref.ts", import.meta.url)
  .pathname;

/* ───────────────────────── 표 그리기 ───────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 펜스 안의 칸 맞춤은 이 폭으로 한다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 칸을 맞춘 펜스 줄 — 첫 열은 왼쪽, 나머지는 오른쪽 정렬, 칸 사이는 세 칸. */
function columns(rows: string[][], leftAll = false): string[] {
  const n = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: n }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows.map((r) =>
    r
      .map((cell, c) =>
        c === 0 || leftAll
          ? pad(cell, w[c] as number)
          : " ".repeat(Math.max(0, (w[c] as number) - width(cell))) + cell,
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
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

const truth = (b: boolean): string => (b ? "참" : "거짓");
const ANSWER5 = parametricBinarySearch([...A5], K5);
const isJudge = (s: { calc?: { expr: string } }): boolean =>
  s.calc?.expr.startsWith("g(") === true;

/* ───────── 「전체 컨셉」 ───────── */

/** 후보값 수가 판정마다 접히는 자취. */
function conceptHalving(): string {
  const t = trace(A5, K5);
  const sizes = [
    ...t.rounds.map((r) => r.hi - r.lo + 1),
    Math.max(0, t.end.hi - t.end.lo + 1),
  ];
  return [
    `후보값 ${sizes.join(" → ")} 개`,
    `판정 ${t.rounds.length} 번으로 후보가 비고, 답은 ${t.result} 이다`,
  ].join("\n");
}

/* ───────── 「아이디어를 떠올리는 과정」 ───────── */

/**
 * 나눔을 전부 만드는 방법의 가짓수. 작은 두 줄은 실제로 만들어 세고 식과 대조하며, 만든 나눔의
 * 답이 정본과 같은지도 본다. 큰 두 줄은 식으로 센다.
 */
function originSplitCount(): string {
  const made: [number[], number][] = [
    [A5, K5],
    [Array.from({ length: 20 }, (_, i) => ((i * 7) % 10) + 1), 10],
  ];
  for (const [A, K] of made) {
    const all = allSplits(A, K);
    if (BigInt(all.length) !== binom(A.length - 1, K - 1)) {
      throw new Error(`만든 나눔 수가 식과 다르다 — N ${A.length}`);
    }
    if (
      Math.min(...all.map((s) => s.max)) !== parametricBinarySearch([...A], K)
    ) {
      throw new Error(`나눔을 전부 만든 답이 정본과 다르다 — N ${A.length}`);
    }
  }
  const c40 = binom(39, 19);
  const rows: string[][] = [
    ...made.map(([A, K]) => {
      const c = binom(A.length - 1, K - 1);
      return [num(A.length), num(K), num(c), secondsOf(Number(c))];
    }),
    ["40", "20", num(c40), secondsOf(Number(c40))],
    [
      num(N_MAX),
      num(N_MAX / 2),
      `${num(binomDigits(N_MAX - 1, N_MAX / 2 - 1))} 자리 수`,
      "—",
    ],
  ];
  return [
    md(["N", "K", "나눔 가짓수", "초당 1 억 개를 만들 때"], rows, [0, 1, 2, 3]),
    "",
    `N = ${made[0]?.[0].length} · ${made[1]?.[0].length} 두 줄은 나눔을 실제로 만들어 센 수가 식 C(N−1, K−1) 과 같았고, 가장 작은 최댓값도 정본의 답과 같았습니다. 아래 두 줄은 식으로 셌습니다.`,
  ].join("\n");
}

/** 표로 채우는 방법(동적 계획법)의 분할점 시험 횟수 — 식이 `.alt.ts` 의 실제 계수와 같은지 먼저 본다. */
function originDpCount(): string {
  const real = dynamicProgramming([...LARGE], LARGE_K);
  const byFormula = dpSteps(LARGE.length, LARGE_K);
  if (real.steps !== byFormula) {
    throw new Error(
      `시험 횟수 식 ${byFormula} 이 실제 ${real.steps} 과 다르다`,
    );
  }
  const steps = dpSteps(N_MAX, N_MAX);
  const days = Math.round((steps / 1e8 / 86_400) * 10) / 10;
  return [
    `N = K = ${num(N_MAX)} 이면 분할점 시험 ${num(steps)} 번`,
    `초당 1 억 번이면 ${secondsOf(steps)} — ${num(days)} 일`,
    `└ 이 식은 N = ${LARGE.length}, K = ${LARGE_K} 에서 실제로 센 ${num(real.steps)} 번과 같다`,
  ].join("\n");
}

/** 네 나눔을 되물음 둘에 넣는다. */
function originFlip(): string {
  const splits = allSplits(A5, K5);
  const rows = splits.map((s) => [
    splitText(A5, s.cuts),
    s.sums.join(" · "),
    String(s.max),
    s.max <= 18 ? "예" : "아니오",
    s.max <= 17 ? "예" : "아니오",
  ]);
  const yes18 = splits.filter((s) => s.max <= 18).length;
  const yes17 = splits.filter((s) => s.max <= 17).length;
  if (
    feasible([...A5], K5, 18) !== yes18 > 0 ||
    feasible([...A5], K5, 17) !== yes17 > 0
  ) {
    throw new Error("정본 판정이 나눔을 전부 만든 결과와 다르다");
  }
  return [
    md(
      ["나눔", "묶음 합", "최댓값", "18 이하 여부", "17 이하 여부"],
      rows,
      [2],
    ),
    "",
    `「예」가 m = 18 에서 ${yes18} 개, m = 17 에서 ${yes17} 개입니다.`,
  ].join("\n");
}

/** 같은 입력에서 1 씩 올리는 쪽과 한가운데를 판정하는 쪽. */
function originOneUpVsHalf(): string {
  const up: string[] = [];
  for (let m = maxOf(A5); ; m++) {
    const ok = feasible([...A5], K5, m);
    up.push(`m = ${m} ${truth(ok)}`);
    if (ok) break;
  }
  const t = trace(A5, K5);
  const half = t.rounds.map((r) => {
    const next = r.ok ? [r.lo, r.mid - 1] : [r.mid + 1, r.hi];
    const shown =
      (next[0] as number) > (next[1] as number)
        ? "후보가 빈다"
        : `[${next[0]},${next[1]}]`;
    return `[${r.lo},${r.hi}] 에서 ${r.mid} ${truth(r.ok)} → ${shown}`;
  });
  const n = Math.max(up.length, half.length);
  const rows = Array.from({ length: n }, (_, i) => [
    String(i + 1),
    up[i] ?? "—",
    half[i] ?? "—",
  ]);
  const upAnswer = maxOf(A5) + up.length - 1;
  if (upAnswer !== t.result) throw new Error("두 방식의 답이 다르다");
  return [
    md(["판정 횟수", "1 씩 올리는 쪽", "한가운데를 판정하는 쪽"], rows, [0]),
    "",
    `1 씩 올리는 쪽은 ${up.length} 번, 한가운데를 판정하는 쪽은 ${half.length} 번 판정했고, 답은 둘 다 ${t.result} 입니다.`,
  ].join("\n");
}

/** 후보값마다 필요한 최소 묶음 수를 같은 값끼리 묶는다. */
function originGroupSteps(): string {
  const runs: { g: number; from: number; to: number }[] = [];
  for (const m of CAND) {
    const g = minGroups(A5, m);
    const last = runs.at(-1);
    if (last !== undefined && last.g === g) last.to = m;
    else runs.push({ g, from: m, to: m });
  }
  for (let i = 1; i < runs.length; i++) {
    if ((runs[i] as { g: number }).g >= (runs[i - 1] as { g: number }).g) {
      throw new Error("최소 묶음 수가 줄기만 하지 않는다");
    }
  }
  const first = runs.find((r) => r.g <= K5) as { from: number };
  return [
    md(
      ["최소 묶음 수", "그 값이 나오는 m"],
      runs.map((r) => [
        String(r.g),
        r.from === r.to ? String(r.from) : `${r.from} ~ ${r.to}`,
      ]),
      [0],
    ),
    "",
    `m 이 커질 때 최소 묶음 수는 ${runs.map((r) => r.g).join(" → ")} 로 줄기만 하고, ${K5} 이하로 처음 내려가는 m 은 ${first.from} 입니다.`,
  ].join("\n");
}

/** 후보값을 고르는 두 방식의 판정 횟수 — 작은 입력과 제약 규모의 입력. */
function originProbeCount(): string {
  const small = trace(A5, K5).rounds.length;
  const { big, bigOneByOne } = bigCounts();
  return [
    md(
      ["후보값을 고르는 방식", `N = ${A5.length}`, `N = ${num(BIG.length)}`],
      [
        ["1 씩 올리며 판정한다", num(oneByOne(A5, K5)), num(bigOneByOne)],
        ["후보 구간을 반씩 접는다", num(small), num(big)],
        ["후보값은 모두 몇 개인가", num(span(A5)), num(span(BIG))],
      ],
      [1, 2],
    ),
    "",
    `큰 입력은 A[i] = 37i mod 10^6, K = ${BIG_K} 입니다. 1 씩 올리는 쪽은 판정마다 ${num(BIG.length)} 칸을 순회하니 ${num(bigOneByOne * BIG.length)} 칸을 순회합니다.`,
  ].join("\n");
}

/* ───────── 「아이디어 상세」 ───────── */

/** (c) 판정 하나를 읽는다 — m = 18. */
function buildReadOne(): string {
  const m = 18;
  const gr = greedy(A5, m);
  const ok = feasible([...A5], K5, m);
  return columns(
    [
      [`m = ${m}`],
      ["  왼쪽부터 이어 붙인 묶음", groupsText(A5, gr.groups)],
      ["  묶음 합", gr.groups.map((x) => x.sum).join(" · ")],
      ["  묶음 수 g(m)", String(gr.count)],
      [`  g(m) ≤ K = ${K5}`, `${truth(ok)} → 답은 ${m} 이하다`],
    ],
    true,
  ).join("\n");
}

/** (e) 같은 후보값을 두 물음으로 읽었을 때 뺄 수 있는 값. */
function buildOneReadRemoves(): string {
  const r = trace(A5, K5).rounds[0] as Round;
  const all = CAND.length;
  const atMost = r.ok
    ? CAND.filter((m) => m > r.mid).length
    : CAND.filter((m) => m <= r.mid).length;
  const exact = 1;
  const rows = [
    [
      `답이 ${r.mid} 이하인가`,
      r.ok ? "예" : "아니오",
      r.ok ? `${r.mid + 1} ~ ${CAND.at(-1)}` : `${CAND[0]} ~ ${r.mid}`,
      String(all - atMost),
    ],
    [
      `답이 ${r.mid} 인가`,
      r.mid === ANSWER5 ? "예" : "아니오",
      String(r.mid),
      String(all - exact),
    ],
  ];
  return [
    md(
      ["물음", `${r.mid} 에서의 답`, "뺄 수 있는 후보값", "남는 후보값 수"],
      rows,
      [3],
    ),
    "",
    `후보값 ${all} 개에서 「이하인가」는 ${atMost} 개를, 「인가」는 ${exact} 개를 뺍니다.`,
  ].join("\n");
}

/** 1단계 — 후보 구간의 두 끝과 후보값 개수. */
function buildBounds(): string {
  const arrays: [string, number[]][] = [
    [show(A5), A5],
    [show([5, 5, 5, 5, 5]), [5, 5, 5, 5, 5]],
    [show([1, 1, 1, 1_000_000]), [1, 1, 1, 1_000_000]],
    [
      `값이 전부 10^6 · N = ${num(N_MAX)}`,
      Array.from({ length: N_MAX }, () => V_MAX),
    ],
  ];
  const rows = arrays.map(([name, A]) => [
    name,
    num(maxOf(A)),
    num(sumOf(A)),
    num(span(A)),
  ]);
  const last = arrays.at(-1)?.[1] as number[];
  const int32 = 2 ** 31 - 1;
  if (sumOf(last) <= int32) throw new Error("ΣA 가 32비트 범위 안이다");
  return [
    md(["배열", "max(A)", "ΣA", "후보값 개수"], rows, [1, 2, 3]),
    "",
    `마지막 줄의 ΣA ${num(sumOf(last))}${은는(num(sumOf(last)))} 32비트 정수의 최댓값 ${num(int32)} 보다 큽니다.`,
  ].join("\n");
}

/** 2단계 — 탐욕 순회 한 칸마다의 상태. 쉬운 칸과 새 묶음을 여는 칸이 함께 나온다. */
function buildGreedyStates(): string {
  const table = (m: number) => {
    const gr = greedy(A5, m);
    return {
      gr,
      text: md(
        ["x", "accSum + x", `${m} 과 비교`, "count", "accSum"],
        gr.cells.map((c) => [
          String(c.x),
          `${c.before} + ${c.x} = ${c.before + c.x}`,
          c.opened ? "넘는다 → 새 묶음" : "안 넘는다",
          String(c.count),
          String(c.accSum),
        ]),
        [0, 3, 4],
      ),
    };
  };
  const a = table(18);
  const b = table(17);
  return [
    "m = 18 로 판정하면 이렇습니다.",
    "",
    a.text,
    "",
    "m = 17 로 판정하면 이렇습니다.",
    "",
    b.text,
    "",
    `g(18) = ${a.gr.count}, g(17) = ${b.gr.count} 이고, K = ${K5} 와 비교하면 18 은 ${truth(a.gr.count <= K5)}, 17 은 ${truth(b.gr.count <= K5)}입니다.`,
  ].join("\n");
}

/** 2단계 — 탐욕이 센 묶음 수가 모든 후보값에서 최소인가(나눔을 전부 만들어 대조). */
function buildGreedyMin(): string {
  /** 묶음 수를 정하지 않고, 합이 m 이하인 나눔 중 묶음이 가장 적은 것. */
  const exactMin = (A: readonly number[], m: number): number => {
    for (let K = 1; K <= A.length; K++) {
      if (allSplits(A, K).some((s) => s.max <= m)) return K;
    }
    return A.length + 1;
  };
  let bad = 0;
  for (const m of CAND) if (greedy(A5, m).count !== exactMin(A5, m)) bad++;
  return `후보값 ${CAND.length} 개 모두에서, 탐욕 순회가 센 묶음 수와 합이 m 이하인 나눔을 전부 만들어 찾은 최소 묶음 수를 비교했습니다. 둘이 어긋난 후보값은 ${bad} 개입니다.`;
}

/** 2단계 — 경계 위치. 탐욕과 다른 나눔의 i 번째 묶음이 몇 칸까지 담는가. */
function greedyAhead(): string {
  const gr = greedy(A5, 18);
  const n = Math.max(gr.groups.length, OTHER_SPLIT.length);
  if (OTHER_SPLIT.some((x) => x.sum > 18)) {
    throw new Error("다른 나눔이 18 을 넘는다");
  }
  const rows = Array.from({ length: n }, (_, i) => {
    const a = gr.groups[i];
    const b = OTHER_SPLIT[i];
    return [
      String(i + 1),
      a ? `${a.to + 1} 칸` : "—",
      b ? `${b.to + 1} 칸` : "—",
    ];
  });
  const ahead = OTHER_SPLIT.every((b, i) => {
    const a = gr.groups[i];
    return a === undefined ? true : a.to >= b.to;
  });
  return [
    md(["묶음 번호", "탐욕이 담은 칸", "다른 나눔이 담은 칸"], rows, [0]),
    "",
    `m = 18 에서 탐욕의 경계가 ${ahead ? "매번 같거나 더 뒤에" : "어느 묶음에서 앞에"} 있고, 묶음은 탐욕이 ${gr.groups.length} 개, 다른 나눔이 ${OTHER_SPLIT.length} 개입니다.`,
  ].join("\n");
}

/** 2단계 — g(m) ≤ K 면 묶음을 더 잘라 정확히 K 개로 만들 수 있다. */
function buildSplitMore(): string {
  const m = 18;
  const gr = greedy(A5, m);
  const rows: string[][] = [];
  for (let K = gr.count; K <= A5.length; K++) {
    // 탐욕 묶음의 경계를 두고, 앞에서부터 한 칸씩 더 떼어 K 개가 될 때까지 나눈다.
    const cuts = new Set(gr.groups.slice(1).map((x) => x.from));
    for (let i = 1; i < A5.length && cuts.size < K - 1; i++) cuts.add(i);
    const sorted = [...cuts].sort((a, b) => a - b);
    const s = allSplits(A5, K).find((x) => x.cuts.join() === sorted.join()) as {
      max: number;
    };
    rows.push([
      String(K),
      truth(feasible([...A5], K, m)),
      splitText(A5, sorted),
      String(s.max),
    ]);
  }
  const worst = Math.max(...rows.map((r) => Number(r[3])));
  return [
    md(["K", `판정(m = ${m})`, "K 개로 더 자른 나눔", "최댓값"], rows, [0, 3]),
    "",
    `묶음을 더 잘라도 최댓값은 가장 커야 ${worst} 이라 ${m} 을 넘지 않습니다.`,
  ].join("\n");
}

/** 3단계 — 바퀴마다 후보 구간이 줄고, 답이 후보 밖으로 나가도 lo 가 답에 도달한다. */
function buildShrink(): string {
  const t = trace(A5, K5);
  const rows = t.rounds.map((r) => {
    const next = r.ok
      ? { lo: r.lo, hi: r.mid - 1 }
      : { lo: r.mid + 1, hi: r.hi };
    const size = Math.max(0, next.hi - next.lo + 1);
    return [
      `[${r.lo},${r.hi}]`,
      String(r.mid),
      String(r.groups),
      `${truth(r.ok)} → ${r.ok ? "①" : "②"}`,
      size === 0 ? "비었다" : `[${next.lo},${next.hi}]`,
      String(size),
      t.result >= next.lo && t.result <= next.hi ? "안" : "밖",
    ];
  });
  const firstOut = t.rounds.findIndex((r) => r.ok && r.mid === t.result);
  return [
    md(
      [
        "후보",
        "mid",
        "g(mid)",
        "판정",
        "새 후보",
        "새 후보 수",
        `새 후보에서 ${t.result} 의 자리`,
      ],
      rows,
      [1, 2, 5],
    ),
    "",
    `${firstOut + 1} 번째 바퀴에서 ${t.result} 이 참으로 판정되어 후보 밖으로 나가고, 반복이 끝날 때 lo = ${t.end.lo} 입니다.`,
  ].join("\n");
}

/** 전제 — 음수가 섞이면 무엇이 먼저 깨지는가. */
function premiseNegative(): string {
  const cases: [number[], number][] = [
    [[5, -1, -2], 2],
    [[3, 6, 4, -3], 1],
  ];
  const rows = cases.map(([A, K]) => {
    const got = parametricBinarySearch([...A], K);
    const want = bruteAnswer(A, K);
    if (got === want) throw new Error(`${show(A)} 에서 답이 같다`);
    const why =
      want < maxOf(A)
        ? `답 ${want}${이가(want)} 아래 끝 max(A) = ${maxOf(A)} 보다 작다`
        : `m = ${want} 에서 한 묶음이면 되는데 탐욕은 묶음 ${greedy(A, want).count} 개로 센다`;
    return [show(A), String(K), String(got), String(want), why];
  });
  return md(
    ["배열", "K", "정본의 답", "나눔을 전부 만든 답", "먼저 깨지는 것"],
    rows,
    [1, 2, 3],
  );
}

/* ───────── 「수행으로 알아보는 알고리즘」 ───────── */

function walkInput(): string {
  return [
    `const A = [${A5.join(", ")}];`,
    `const K = ${K5};`,
    `// 이 절이 끝나면 ${ANSWER5}${이가(ANSWER5)} 나와야 한다`,
  ].join("\n");
}

/** walk 1 — 두 끝을 구하는 순회만 실행한다. */
function walkInit(): string {
  const arrays = [A5, [5, 5, 5, 5, 5], [0, 0, 0, 0]];
  return columns(
    arrays.map((A) => {
      let lo = 0;
      let hi = 0;
      for (const x of A) {
        if (x > lo) lo = x;
        hi += x;
      }
      if (lo !== maxOf(A) || hi !== sumOf(A)) throw new Error("두 끝이 다르다");
      return [
        `A = ${show(A)}`,
        `→   lo = ${lo},`,
        `hi = ${hi},`,
        `후보값 ${hi - lo + 1} 개`,
      ];
    }),
    true,
  ).join("\n");
}

/** 아래 끝을 0 에 둔 사본 — `lo` 를 최댓값까지 올리는 줄을 지운다. */
const noLowerBound = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, { drop: /^\s*if \(x > lo\) lo = x;$/ });

function lowerBound(): string {
  const cases: [number[], number][] = [
    [[10, 0, 0], 3],
    [[1, 4, 4], 3],
    [[3, 5], 2],
    [A5, K5],
  ];
  const rows = cases.map(([A, K]) => ({
    A,
    K,
    correct: parametricBinarySearch([...A], K),
    broken: noLowerBound.parametricBinarySearch([...A], K),
  }));
  const changed = rows.filter((r) => r.correct !== r.broken).length;
  // 중화 실행에서는 변이 모듈이 정본 그대로라 이 검사를 건너뛴다(SPEC §0).
  const neutral =
    noLowerBound.parametricBinarySearch === parametricBinarySearch;
  if (!neutral && changed === 0) {
    throw new Error("아래 끝을 안 올린 사본이 어느 입력에서도 답을 안 바꿨다");
  }
  return [
    md(
      ["배열", "K", "바른 코드", "아래 끝을 0 으로 둔 코드"],
      rows.map((r) => [
        show(r.A),
        String(r.K),
        String(r.correct),
        String(r.broken),
      ]),
      [1, 2, 3],
    ),
    "",
    `네 벌 중 ${changed} 벌에서 답이 바뀝니다.`,
  ].join("\n");
}

/** 판정 함수를 m = 0 에 적용한 자취 — `[10 0 0]` 을 세 묶음으로. */
function lowerBoundTrace(): string {
  const A = [10, 0, 0];
  const K = 3;
  const gr = greedy(A, 0);
  const lines = columns(
    gr.cells.map((c) => [
      `x = ${c.x}`,
      `${c.before} + ${c.x} = ${c.before + c.x}${c.opened ? " > 0" : " ≤ 0"}`,
      c.opened ? "→ 새 묶음," : "→ 그대로,",
      `count = ${c.count},`,
      `accSum = ${c.accSum}`,
    ]),
    true,
  );
  const ok = feasible([...A], K, 0);
  return [
    `${show(A)} 에 m = 0 으로 판정하면`,
    ...lines.map((l) => `  ${l}`),
    `  └ count = ${gr.count} 이라 「${K} 묶음이면 된다」가 ${truth(ok)}${으로또는(truth(ok))} 나온다`,
    "",
    `  그런데 ${A[0]} 이 든 묶음의 합은 ${A[0]} 이지 0 이 아니다`,
  ].join("\n");
}

const 으로또는 = (앞: string): string => (앞 === "참" ? "으로" : "로");

/** walk 2 — 판정 함수만 떼어 실행한다. */
function walkJudge(): string {
  const calls: [number, number][] = [
    [K5, 18],
    [K5, 17],
    [3, 17],
  ];
  return columns(
    calls.map(([K, m]) => [
      `feasible([${A5.join(", ")}], ${K}, ${m})`,
      `→   ${feasible([...A5], K, m)}`,
      `(묶음 ${greedy(A5, m).count} 개)`,
    ]),
    true,
  ).join("\n");
}

/** `accSum + x > m` 을 `>=` 로 바꾼 사본. */
const orEqual = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, {
  swap: [/^(\s*)if \(accSum \+ x > m\) \{$/, "$1if (accSum + x >= m) {"],
});

function orEqualTable(): string {
  const cases: [number[], number][] = [
    [A5, K5],
    [[1, 2, 3, 4, 5], 2],
    [[0, 0, 0, 0], 2],
    [[10, 0, 0], 3],
  ];
  const rows = cases.map(([A, K]) => ({
    A,
    K,
    correct: parametricBinarySearch([...A], K),
    broken: orEqual.parametricBinarySearch([...A], K),
  }));
  const changed = rows.filter((r) => r.correct !== r.broken).length;
  const neutral = orEqual.parametricBinarySearch === parametricBinarySearch;
  if (!neutral && changed === 0) {
    throw new Error("`>=` 사본이 어느 입력에서도 답을 안 바꿨다");
  }
  return [
    md(
      ["배열", "K", "바른 코드", "`>=` 로 적은 코드"],
      rows.map((r) => [
        show(r.A),
        String(r.K),
        String(r.correct),
        String(r.broken),
      ]),
      [1, 2, 3],
    ),
    "",
    `네 벌 중 ${changed} 벌에서 답이 바뀝니다.`,
  ].join("\n");
}

/** 두 번째 묶음이 m 과 딱 같아지는 자리에서 두 부등호. */
function orEqualTrace(): string {
  const m = ANSWER5;
  const gr = greedy(A5, m);
  const c = gr.cells.at(-1) as { before: number; x: number };
  const s = c.before + c.x;
  if (s !== m) throw new Error("마지막 칸에서 합이 m 과 같지 않다");
  const gt = s > m;
  const ge = s >= m;
  const lines = columns(
    [
      [
        "  accSum + x > m",
        `${s} > ${m}${은는(m)} ${truth(gt)}`,
        gt ? "→ 새 묶음을 시작한다." : "→ 같은 묶음에 남는다.",
        `count = ${gr.count}`,
        `→ ${truth(gr.count <= K5)}`,
      ],
      [
        "  accSum + x >= m",
        `${s} >= ${m}${은는(m)} ${truth(ge)}`,
        ge ? "→ 새 묶음을 시작한다." : "→ 같은 묶음에 남는다.",
        `count = ${gr.count + 1}`,
        `→ ${truth(gr.count + 1 <= K5)}`,
      ],
    ],
    true,
  );
  return [
    `m = ${m}, accSum = ${c.before}, x = ${c.x} 에서`,
    "",
    ...lines,
    `  └ ${m} 이 거짓으로 판정되니 이진 탐색이 ${m} 을 지나쳐 더 큰 값에서 멈춘다`,
  ].join("\n");
}

/** walk 3 — 갱신 한 번을 참·거짓 한 번씩. */
function walkStep3(): string {
  const t = trace(A5, K5);
  const pick = [
    t.rounds.find((r) => r.ok),
    t.rounds.find((r) => !r.ok),
  ] as Round[];
  return columns(
    pick.map((r) => {
      const next = r.ok
        ? { lo: r.lo, hi: r.mid - 1 }
        : { lo: r.mid + 1, hi: r.hi };
      return [
        `후보 [${r.lo},${r.hi}]`,
        `mid = ${r.mid}`,
        `판정 ${truth(r.ok)}`,
        r.ok ? `→ hi = ${next.hi}` : `→ lo = ${next.lo}`,
        `→ 후보 [${next.lo},${next.hi}]`,
        `${next.hi - next.lo + 1} 개`,
      ];
    }),
    true,
  ).join("\n");
}

/** walk 4 — T1~T12 의 상태와 분기 판정. */
function walkTraceHit(): string {
  const { hit } = walkSteps();
  const t = trace(A5, K5);
  const rows: string[][] = [];
  let k = 0;
  for (const s of hit) {
    const size = String(Math.max(0, s.hi - s.lo + 1));
    const lohi = [String(s.lo), String(s.hi), size];
    if (s.found !== undefined) {
      rows.push([
        s.id,
        "반복 조건 확인",
        `\`${s.lo} <= ${s.hi}\`${이가(s.hi)} **거짓** → lo 반환`,
        ...lohi,
      ]);
    } else if (s.mid === undefined) {
      rows.push([
        s.id,
        "후보 구간을 잡는다",
        `lo = ${s.lo}, hi = ${s.hi}`,
        ...lohi,
      ]);
    } else if (isJudge(s)) {
      const r = t.rounds[k++] as Round;
      rows.push([
        s.id,
        `${r.mid}${을를(r.mid)} 판정한다`,
        `묶음 ${r.groups} 개, \`${r.groups} <= ${K5}\` **${truth(r.ok)}** → ${r.ok ? "①" : "②"}`,
        ...lohi,
      ]);
    } else {
      const r = t.rounds[k] as Round;
      rows.push([
        s.id,
        "반복 진입, 후보값 계산",
        `\`${r.lo} <= ${r.hi}\`${이가(r.hi)} **참**, mid = ${r.mid}`,
        ...lohi,
      ]);
    }
  }
  return md(
    ["단계", "하는 일", "조건 판정", "lo", "hi", "후보값 수"],
    rows,
    [3, 4, 5],
  );
}

/** walk 4 — K = 1 로 둔 둘째 벌의 상태. */
function walkTraceUpper(): string {
  const { upper } = walkSteps();
  const t = trace(A5, K_UPPER);
  const rows = upper.map((s, i) => {
    const r = t.rounds[i];
    const lohi = [
      String(s.lo),
      String(s.hi),
      String(Math.max(0, s.hi - s.lo + 1)),
    ];
    if (r === undefined) {
      return [
        s.id,
        "반복 조건을 본다",
        `\`${s.lo} <= ${s.hi}\`${이가(s.hi)} **거짓** → lo 반환`,
        ...lohi,
      ];
    }
    return [
      s.id,
      `후보 [${r.lo},${r.hi}] 에서 ${r.mid}${을를(r.mid)} 판정한다`,
      `묶음 ${r.groups} 개, \`${r.groups} <= ${K_UPPER}\` **${truth(r.ok)}** → ${r.ok ? "①" : "②"}`,
      ...lohi,
    ];
  });
  return md(
    ["단계", "하는 일", "조건 판정", "lo", "hi", "후보값 수"],
    rows,
    [3, 4, 5],
  );
}

function finalCalls(): string {
  const calls: [number[], number][] = [
    [A5, K5],
    [[1, 2, 3, 4, 5], 2],
    [[1, 2, 3, 4, 5], 1],
    [[0, 0, 0, 0], 2],
  ];
  return columns(
    calls.map(([A, K]) => [
      `parametricBinarySearch([${A.join(", ")}], ${K})`,
      `→   ${parametricBinarySearch([...A], K)}`,
    ]),
    true,
  ).join("\n");
}

/* ───────── 「경쟁 설계와의 대조」 ───────── */

/** 두 입력에서 계수가 어디서 갈리는가 — 판정 횟수와 시험 횟수를 식에서 다시 낸다. */
function altAxis(): string {
  const inputs: [string, number[], number][] = [
    ["작은 입력", SMALL, SMALL_K],
    ["큰 입력", LARGE, LARGE_K],
  ];
  const rows = inputs.map(([name, A, K]) => {
    const p = parametric([...A], K);
    const d = dynamicProgramming([...A], K);
    const probes = trace(A, K).rounds.length;
    if (p.steps !== probes * A.length) {
      throw new Error("파라메트릭 단계가 판정 횟수 × N 이 아니다");
    }
    if (d.steps !== dpSteps(A.length, K)) {
      throw new Error("동적 계획법 단계가 식과 다르다");
    }
    return [
      name,
      num(A.length),
      num(K),
      num(span(A)),
      num(probes),
      num(p.steps),
      num(d.steps),
      p.steps < d.steps ? "파라메트릭" : "동적 계획법",
    ];
  });
  return md(
    [
      "입력",
      "N",
      "K",
      "후보값 개수",
      "판정 횟수",
      "파라메트릭 기본 연산",
      "동적 계획법 기본 연산",
      "적은 쪽",
    ],
    rows,
    [1, 2, 3, 4, 5, 6],
  );
}

/** 음수가 섞인 배열 — 두 설계와 나눔을 전부 만든 답. */
function altNegative(): string {
  const cases: [number[], number][] = [
    [[5, -1, -2], 2],
    [[3, 6, 4, -3], 1],
  ];
  const rows = cases.map(([A, K]) => [
    show(A),
    String(K),
    String(parametricBinarySearch([...A], K)),
    String(dynamicProgramming([...A], K).answer),
    String(bruteAnswer(A, K)),
  ]);
  return md(
    ["배열", "K", "파라메트릭", "동적 계획법", "나눔을 전부 만든 답"],
    rows,
    [1, 2, 3, 4],
  );
}

/* ───────── 「수식 정의와 유도」 ───────── */

/** 정의를 값에 넣는다 — g(14) 와 g(18) 을 탐욕 순회로. */
function mathCheckG(): string {
  const out: string[] = [];
  for (const m of [14, 18]) {
    const gr = greedy(A5, m);
    out.push(`g(${m}) — 묶음 합이 ${m} 이하가 되게 왼쪽부터 이어 붙인다`);
    out.push(
      ...columns(
        gr.groups.map((x) => [
          `  ${A5.slice(x.from, x.to + 1).join(" ")}`,
          `합 ${x.sum}`,
        ]),
        true,
      ),
    );
    out.push(
      `  g(${m}) = ${gr.count}${gr.count <= K5 ? ` ≤ ${K5} 라 참` : ` > ${K5} 라 거짓`}`,
    );
    out.push("");
  }
  out.pop();
  return out.join("\n");
}

const P = (s: number): number => (s <= 0 ? 0 : P(Math.ceil((s - 1) / 2)) + 1);
const closed = (s: number): number =>
  s <= 0 ? 0 : Math.floor(Math.log2(s)) + 1;

/** 접은 자취와 P(23). */
function mathFold(): string {
  const parts: string[] = [];
  let s = span(A5);
  parts.push(String(s));
  while (s > 0) {
    const next = Math.ceil((s - 1) / 2);
    parts.push(`⌈${s - 1}/2⌉ = ${next}`);
    s = next;
  }
  const folds = parts.length - 1;
  if (folds !== P(span(A5)) || folds !== trace(A5, K5).rounds.length) {
    throw new Error("접은 횟수가 P 나 실제 판정 횟수와 다르다");
  }
  return [
    `s = ${span(A5)} 에서 접으면   ${parts.join(" → ")}`,
    `└ ${folds} 번 접어서 후보가 빈다. P(${span(A5)}) = ${folds} 이다`,
  ].join("\n");
}

/** 닫힌 형태에 값을 넣고 점화식과 대조한다. */
function mathClosed(): string {
  const ss = [1, 2, 3, 4, span(A5), 10 ** 11];
  const LIMIT = 5000;
  for (let s = 1; s <= LIMIT; s++) {
    if (P(s) !== closed(s)) {
      throw new Error(`s = ${s} 에서 닫힌 형태가 점화식과 다르다`);
    }
  }
  for (const s of ss) {
    if (P(s) !== closed(s)) {
      throw new Error(`s = ${s} 에서 닫힌 형태가 점화식과 다르다`);
    }
  }
  return [
    md(
      ["s", "P(s)"],
      ss.map((s) => [s === 10 ** 11 ? "10^11" : num(s), String(closed(s))]),
      [0, 1],
    ),
    "",
    `s = 1 부터 ${num(LIMIT)} 까지와 표의 여섯 값에서 점화식과 닫힌 형태가 같았습니다. s = ${span(A5)} 의 ${closed(span(A5))}${은는(closed(span(A5)))} 전개 입력에서 정본이 판정한 횟수 ${trace(A5, K5).rounds.length}${과와(trace(A5, K5).rounds.length)} 같습니다.`,
  ].join("\n");
}

function mathCode(): string {
  const S = sumOf(A5) - Math.max(...A5) + 1;
  return [
    "const S = (A: number[]): number =>",
    "  A.reduce((a, b) => a + b, 0) - Math.max(...A) + 1;",
    "const P = (s: number): number => (s <= 0 ? 0 : Math.floor(Math.log2(s)) + 1);",
    "",
    `S([${A5.join(", ")}]); // → ${S}`,
    `P(${S}); // → ${closed(S)}`,
    `P(10 ** 11); // → ${closed(10 ** 11)}`,
  ].join("\n");
}

/** 제약 규모를 닫힌 형태에 넣는다. */
function mathScale(): string {
  const sMax = N_MAX * V_MAX - V_MAX + 1;
  const worst = Array.from({ length: N_MAX }, () => V_MAX);
  if (span(worst) !== sMax) {
    throw new Error("S 의 최대가 값이 전부 최댓값인 배열과 다르다");
  }
  const p = closed(sMax);
  const rows = [
    ["ΣA 의 최대", `${num(N_MAX)} × ${num(V_MAX)} = ${num(N_MAX * V_MAX)}`],
    ["후보값 개수 S 의 최대", `ΣA − max(A) + 1 = ${num(sMax)}`],
    ["판정 횟수의 상한 P(S)", `⌊log₂ ${num(sMax)}⌋ + 1 = ${p}`],
    ["판정이 순회하는 칸의 상한", `${num(N_MAX)} × ${p} = ${num(N_MAX * p)}`],
  ];
  return md(["양", "값"], rows);
}

/* ───────── 「불변식」 ───────── */

/** 바퀴마다 lo ≤ 답 ≤ hi + 1 인가. */
function invariantRounds(): string {
  const t = trace(A5, K5);
  const a = t.result;
  const states = [...t.rounds.map((r) => ({ lo: r.lo, hi: r.hi })), t.end];
  const rows = states.map((s, i) => [
    i < t.rounds.length ? `${i + 1} 바퀴 시작` : "반복이 끝난 뒤",
    String(s.lo),
    String(s.hi),
    truth(s.lo <= a),
    truth(a <= s.hi + 1),
  ]);
  const all = states.every((s) => s.lo <= a && a <= s.hi + 1);
  return [
    md(["시점", "lo", "hi", `lo ≤ ${a}`, `${a} ≤ hi + 1`], rows, [1, 2]),
    "",
    `${states.length} 시점 모두에서 두 부등식이 ${all ? "참입니다" : "참이 아닌 자리가 있습니다"}. 마지막 줄은 lo = ${t.end.lo}, hi + 1 = ${t.end.hi + 1} 이라 답이 하나로 정해집니다.`,
  ].join("\n");
}

/** 경계에 있는 입력 일곱 — 두 끝 · 판정 횟수 · 답을 정본으로. */
function invariantEdges(): string {
  const cases: [string, number[], number][] = [
    ["원소 하나 `[7]`, `K = 1`", [7], 1],
    ["`K = 1` — `[1 2 3 4 5]`", [1, 2, 3, 4, 5], 1],
    ["`K = N` — `[1 2 3 4 5]`", [1, 2, 3, 4, 5], 5],
    ["값이 전부 0 `[0 0 0 0]`, `K = 2`", [0, 0, 0, 0], 2],
    ["값이 전부 같음 `[5 5 5 5 5]`, `K = 5`", [5, 5, 5, 5, 5], 5],
    ["한 칸만 큼 `[1 1 1 1000000]`, `K = 2`", [1, 1, 1, 1_000_000], 2],
    [
      `값이 전부 10^6 · N = ${num(N_MAX)}, \`K = 2\``,
      Array.from({ length: N_MAX }, () => V_MAX),
      2,
    ],
  ];
  const rows = cases.map(([name, A, K]) => {
    const t = trace(A, K);
    const tag =
      t.result === maxOf(A)
        ? "아래 끝 max(A)"
        : t.result === sumOf(A)
          ? "위 끝 ΣA"
          : "두 끝 사이";
    return [
      name,
      `후보 [${maxOf(A)},${sumOf(A)}] · 판정 ${t.rounds.length} 번`,
      `${num(t.result)} (${tag})`,
    ];
  });
  return md(["입력", "처리되는 자리", "결과"], rows);
}

/** `while (lo <= hi)` 를 `while (lo < hi)` 로 바꾼 사본. */
const strictLoop = await loadMutant<{
  parametricBinarySearch(A: number[], K: number): number;
}>(REF, { swap: [/^(\s*)while \(lo <= hi\) \{$/, "$1while (lo < hi) {"] });

function loopTable(): string {
  const cases: [number[], number][] = [
    [A5, K5],
    [[7, 7, 7], 2],
    [[5, 8, 9, 7], 2],
    [[1, 2, 3, 4, 5], 2],
  ];
  const rows = cases.map(([A, K]) => ({
    A,
    K,
    correct: parametricBinarySearch([...A], K),
    broken: strictLoop.parametricBinarySearch([...A], K),
  }));
  const changed = rows.filter((r) => r.correct !== r.broken);
  const neutral = strictLoop.parametricBinarySearch === parametricBinarySearch;
  if (!neutral && changed.length === 0) {
    throw new Error("`lo < hi` 사본이 어느 입력에서도 답을 안 바꿨다");
  }
  const gaps = [...new Set(changed.map((r) => r.correct - r.broken))];
  return [
    md(
      ["배열", "K", "바른 코드", "`lo < hi` 로 적은 코드"],
      rows.map((r) => [
        show(r.A),
        String(r.K),
        String(r.correct),
        String(r.broken),
      ]),
      [1, 2, 3],
    ),
    "",
    changed.length === 0
      ? "네 벌 모두 답이 그대로입니다."
      : `네 벌 중 ${changed.length} 벌에서 답이 ${gaps.join("·")} 만큼 작게 나옵니다.`,
  ].join("\n");
}

/** lo = hi 가 된 시점에서 두 반복 조건. */
function loopTrace(): string {
  const t = trace(A5, K5);
  const r = t.rounds.find((x) => x.lo === x.hi) as Round;
  const next = r.ok ? r.mid - 1 : r.mid + 1;
  const lines = columns(
    [
      [
        "  while (lo <= hi)",
        `${r.mid} 을 한 번 더 판정한다.`,
        `${truth(r.ok)}${josa(truth(r.ok), "이라", "라").trimStart()} ${r.ok ? `hi = ${next}` : `lo = ${next}`}.`,
        `답 ${t.result}`,
      ],
      [
        "  while (lo < hi)",
        "판정하지 않고 끝난다.",
        `lo = ${r.lo} 을 그대로 돌려준다`,
      ],
    ],
    true,
  );
  return [
    `[${A5.join(" ")}], K = ${K5} 에서 lo = hi = ${r.lo} 이 된 시점`,
    "",
    ...lines,
    `  └ ${r.lo} 이 참인지 거짓인지 확인한 적이 없다`,
  ].join("\n");
}

/* ───────── 「비용 계산」 ───────── */

/** 판정 다섯 — 걸음 번호와 순회한 칸. */
function perfDeriveProbes(): string {
  const { hit } = walkSteps();
  const t = trace(A5, K5);
  const judges = hit.filter(isJudge);
  const lines = columns(
    judges.map((s, i) => {
      const r = t.rounds[i] as Round;
      const next = r.ok
        ? { lo: r.lo, hi: r.mid - 1 }
        : { lo: r.mid + 1, hi: r.hi };
      return [
        s.id,
        `판정 ${r.mid}`,
        `배열 ${A5.length} 칸을 순회한다`,
        `후보값 ${r.hi - r.lo + 1} → ${Math.max(0, next.hi - next.lo + 1)}`,
      ];
    }),
    true,
  );
  return [
    ...lines,
    `└ 판정 ${judges.length} 번 × ${A5.length} 칸 = ${judges.length * A5.length} 칸`,
  ].join("\n");
}

/** 판정 횟수가 놓이는 폭 — 매번 작은 쪽이 남는 길과 큰 쪽이 남는 길. */
function perfBand(): string {
  const LIMIT = 4096;
  const fewest = (s: number): number =>
    s <= 0 ? 0 : fewest(Math.floor((s - 1) / 2)) + 1;
  let out = 0;
  for (let s = 1; s <= LIMIT; s++) {
    const lo = Math.floor(Math.log2(s));
    if (fewest(s) < lo || P(s) > lo + 1) out++;
  }
  // 실제 입력에서도 폭 안에 드는지 — 전개 입력과 큰 입력.
  const real: [number[], number][] = [
    [A5, K5],
    [BIG, BIG_K],
  ];
  for (const [A, K] of real) {
    const n = trace(A, K).rounds.length;
    const lo = Math.floor(Math.log2(span(A)));
    if (n < lo || n > lo + 1) out++;
  }
  return `후보값 개수 S 를 1 부터 ${num(LIMIT)} 까지 모두 넣고, 매번 작은 쪽이 남는 길과 큰 쪽이 남는 길의 판정 횟수를 셌습니다. 전개 입력과 N = ${num(BIG.length)} 입력의 실제 판정 횟수도 함께 봤습니다. ⌊log₂ S⌋ 이상 ⌊log₂ S⌋ + 1 이하를 벗어난 경우는 ${out} 개입니다.`;
}

function probeShapes(): string {
  const shapes: [string, number[], number][] = [
    ["값이 전부 0 · N = 4", [0, 0, 0, 0], 2],
    ["한 칸만 큼 · N = 4", [1, 1, 1, 1_000_000], 2],
    ["전개가 쓴 입력 · N = 5", A5, 2],
    ["값이 전부 10^6 · N = 5", Array.from({ length: 5 }, () => V_MAX), 2],
    ["값이 전부 10^6 · N = 100", Array.from({ length: 100 }, () => V_MAX), 2],
    [
      `값이 전부 10^6 · N = ${num(N_MAX)}`,
      Array.from({ length: N_MAX }, () => V_MAX),
      2,
    ],
  ];
  const rows = shapes.map(([name, A, K]) => [
    name,
    num(span(A)),
    num(trace(A, K).rounds.length),
    num(closed(span(A))),
  ]);
  return md(
    ["입력 모양", "후보값 개수", "판정 횟수", "⌊log₂ 개수⌋ + 1"],
    rows,
    [1, 2, 3],
  );
}

/* ───────── 「스스로 점검하기」 ───────── */

function selfcheckT7(): string {
  const { hit } = walkSteps();
  const t = trace(A5, K5);
  const idx = t.rounds.findIndex((r) => r.mid === t.result);
  const r = t.rounds[idx] as Round;
  const step = hit.filter(isJudge)[idx] as { id: string };
  return columns(
    [
      [
        step.id,
        `후보 [${r.lo},${r.hi}]`,
        `mid = ${r.mid}`,
        `판정 ${truth(r.ok)}`,
        `→  hi = mid - 1 = ${r.mid - 1}`,
        `후보 [${r.lo},${r.mid - 1}]`,
      ],
      ["", "", "", "", `→  hi = mid     = ${r.mid}`, "← 이렇게 적었다면?"],
    ],
    true,
  ).join("\n");
}

/** `hi = mid` 로 적은 반복을 바퀴 여섯까지 — 정본의 판정으로 갈래를 고른다. */
function selfcheckHiMid(): string {
  const rows: string[][] = [];
  let lo = maxOf(A5);
  let hi = sumOf(A5);
  const seen = new Set<string>();
  let repeated = -1;
  for (let k = 1; k <= 6 && lo <= hi; k++) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const ok = feasible([...A5], K5, mid);
    const before = `[${lo},${hi}]`;
    if (ok) hi = mid;
    else lo = mid + 1;
    const key = `${lo},${hi}`;
    const again = seen.has(key);
    seen.add(key);
    rows.push([
      String(k),
      before,
      String(mid),
      truth(ok),
      ok ? `hi = ${hi}` : `lo = ${lo}`,
      `[${lo},${hi}]${again ? " (같은 상태)" : ""}`,
    ]);
    if (again) {
      repeated = k;
      break;
    }
  }
  if (repeated < 0) {
    throw new Error("hi = mid 로 적었는데 같은 상태가 되풀이되지 않았다");
  }
  return [
    md(["바퀴", "후보", "mid", "판정", "갱신", "새 후보"], rows, [0, 2]),
    "",
    `${repeated} 번째 바퀴에서 앞 바퀴와 같은 상태로 돌아와, lo 도 hi 도 바뀌지 않은 채 반복이 끝나지 않습니다.`,
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 후보값 수가 판정마다 접힌다. */
  "concept-halving": conceptHalving,
  /** `deep.origin` ② — 나눔을 전부 만드는 가짓수. */
  "origin-split-count": originSplitCount,
  /** `deep.origin` ② — 표로 채우는 방법의 분할점 시험 횟수. */
  "origin-dp-count": originDpCount,
  /** `deep.origin` ③ — 나눔 넷을 「m 이하인가」로 되묻는다. */
  "origin-flip": originFlip,
  /** `deep.origin` ④ — 같은 입력을 두 방식으로 판정한 자취. */
  "origin-oneup-vs-half": originOneUpVsHalf,
  /** `deep.origin` ④ — 후보값이 커질 때 최소 묶음 수. */
  "origin-group-steps": originGroupSteps,
  /** `deep.origin` ⑤ — 1 씩 올릴 때와 반씩 접을 때의 판정 횟수. */
  "origin-probe-count": originProbeCount,
  /** `deep.build` (c) — 판정 하나를 읽는 법. */
  "build-read-one": buildReadOne,
  /** `deep.build` (e) — 「이하인가」와 「인가」가 한 번에 빼는 값. */
  "build-one-read-removes": buildOneReadRemoves,
  /** `deep.build` 1단계 — 두 끝과 후보값 개수. */
  "build-bounds": buildBounds,
  /** `deep.build` 2단계 — 탐욕 순회 한 칸마다의 상태. */
  "build-greedy-states": buildGreedyStates,
  /** `deep.build` 2단계 — 탐욕의 묶음 수가 최소인가. */
  "build-greedy-min": buildGreedyMin,
  /** `deep.build` 2단계 — 탐욕과 다른 나눔의 경계. */
  "build-greedy-ahead": greedyAhead,
  /** `deep.build` 2단계 — 묶음을 더 잘라도 최댓값이 안 커진다. */
  "build-split-more": buildSplitMore,
  /** `deep.build` 3단계 — 바퀴마다 후보 구간과 답의 자리. */
  "build-shrink": buildShrink,
  /** `deep.build` 전제 — 음수가 섞이면 무엇이 깨지는가. */
  "premise-negative": premiseNegative,
  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 두 끝을 구하는 순회. */
  "walk-init": walkInit,
  /** `deep.walk.pause` — 아래 끝을 0 으로 두면 무엇이 나오는가. */
  "lower-bound": lowerBound,
  /** `deep.walk.pause` — m = 0 에서 판정 함수가 하는 일. */
  "lower-bound-trace": lowerBoundTrace,
  /** `deep.walk` 2 — 판정 함수만 떼어 실행한다. */
  "walk-judge": walkJudge,
  /** `deep.walk.pause` — 부등호를 `>=` 로 적으면 무엇이 나오는가. */
  "or-equal": orEqualTable,
  /** `deep.walk.pause` — 두 부등호가 갈리는 자리. */
  "or-equal-trace": orEqualTrace,
  /** `deep.walk` 3 — 갱신 한 번씩. */
  "walk-step3": walkStep3,
  /** `deep.walk` 4 — T1~T12 의 상태와 분기 판정. */
  "walk-trace-hit": walkTraceHit,
  /** `deep.walk` 4 — K = 1 의 상태와 분기 판정. */
  "walk-trace-upper": walkTraceUpper,
  /** `deep.walk.final` — 전체 코드에 네 입력을 넣은 답. */
  "final-calls": finalCalls,
  /** `related` — 경계가 뒤처지지 않는다(2단계와 같은 값을 이름을 붙여 다시 짚는다). */
  "related-ahead": greedyAhead,
  /** `purpose.alt` — 두 입력에서 계수가 갈리는 자리. */
  "alt-axis": altAxis,
  /** `purpose.alt` — 음수가 섞인 배열. */
  "alt-negative": altNegative,
  /** `deep.math` ② — 정의를 값에 넣은 검산. */
  "math-check-g": mathCheckG,
  /** `deep.math` ③ — 접은 자취. */
  "math-fold": mathFold,
  /** `deep.math` ③ — 닫힌 형태의 값. */
  "math-closed": mathClosed,
  /** `deep.math` — 식을 옮긴 코드와 그 값. */
  "math-code": mathCode,
  /** `deep.math` ④ — 제약 규모를 넣은 계수. */
  "math-scale": mathScale,
  /** `invariant` ② — 바퀴마다 두 부등식. */
  "invariant-rounds": invariantRounds,
  /** `invariant` ② — 경계에 있는 입력 일곱. */
  "invariant-edges": invariantEdges,
  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 반복 조건 한 곳을 바꾸면 종료 시점의 `lo` 가 무엇을 가리키는지가 함께 바뀐다.
   */
  "loop-condition": loopTable,
  /** `invariant` ③ — lo = hi 가 된 시점에서 두 반복 조건. */
  "loop-condition-trace": loopTrace,
  /** `perf.derive` — 판정 다섯과 순회한 칸. */
  "perf-derive-probes": perfDeriveProbes,
  /** `perf.bounds` — 판정 횟수가 놓이는 폭. */
  "perf-band": perfBand,
  /** `perf.worst` — 어떤 입력이 판정 횟수를 최대로 만드는가. */
  "probe-shapes": probeShapes,
  /** `selfcheck` — T7 자리의 두 규칙. */
  "selfcheck-t7": selfcheckT7,
  /** `selfcheck` 답 — `hi = mid` 로 적은 자취. */
  "selfcheck-himid": selfcheckHiMid,
};
