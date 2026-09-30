/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 창의 걸음과 정렬된 차례는 그림 사이드카의 `trace` · `orderOf`(정본 실행과 정본 소스에서 만든 계측
 * 사본)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  A5,
  A16,
  asGiven,
  blockOrder,
  blocksOf,
  bound,
  byL,
  byR,
  expectedReads,
  lcg,
  type Move,
  makeInput,
  moves,
  N_TASK,
  naive,
  naiveByFormula,
  num,
  orderOf,
  P8,
  pName,
  Q5,
  qName,
  SEED,
  seconds,
  type Tagged,
  taskCounts,
  taskInput,
  trace,
  walkSteps,
  worstInput,
} from "./mosAlgorithm-guide.fig.tsx";
import { mosAlgorithm } from "./mosAlgorithm-guide.ref.ts";

const REF = new URL("./mosAlgorithm-guide.ref.ts", import.meta.url).pathname;

type Query = [number, number];

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

/** 한글을 두 칸으로 세는 폭. 등폭 펜스의 열을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const vals = (xs: readonly number[]) => xs.join(" ");
const list = (xs: readonly number[]) => `[${xs.join(", ")}]`;
const iv = (l: number, r: number) => (l > r ? "빈 창" : `[${l},${r}]`);
const qv = (q: { l: number; r: number; i: number }, name = qName) =>
  `${name(q.i)}[${q.l},${q.r}]`;
const countText = (c: readonly (readonly [number, number])[]) =>
  c.length === 0 ? "{}" : `{${c.map(([k, v]) => `${k}:${v}`).join(", ")}}`;
const trail = (xs: readonly number[]) => xs.join(" → ");

/* ───────── 전체 컨셉 ───────── */

/** 질의 다섯의 블록 번호와 처리 차례. */
function conceptOrder(): string {
  const t = trace(A5, Q5);
  const rank = new Map(t.order.map((q, k) => [q.i, k + 1]));
  const rows = Q5.map(([l, r], i) => [
    qName(i),
    `[${l},${r}]`,
    String(Math.floor(l / t.block)),
    String(rank.get(i)),
  ]);
  return [
    md(["질의", "구간", "왼쪽 끝의 블록 번호", "처리 차례"], rows, [2, 3]),
    "",
    `블록 크기는 B = ${t.block} 이고, 처리 차례는 ${t.order.map((q) => qName(q.i)).join(" → ")} 입니다. 답은 원래 자리로 돌아가 ${list(t.out)}${이가(t.out.at(-1) as number)} 됩니다.`,
  ].join("\n");
}

/* ───────── 아이디어를 떠올리는 과정 ───────── */

/** 질의마다 새로 세는 방법 — 작은 규모는 실행하고, 과제 규모는 Σ(r − l + 1) 로 낸다. */
function originNaive(): string {
  const rows = [1_000, 10_000].map((n) => {
    const { arr, queries } = makeInput(n, n);
    const run = naive(arr, queries);
    const byFormula = naiveByFormula(queries);
    if (run.ops !== byFormula) throw new Error("실행과 식이 다르다");
    const want = mosAlgorithm([...arr], queries);
    if (JSON.stringify(run.out) !== JSON.stringify(want)) {
      throw new Error("새로 세는 방법의 답이 정본과 다르다");
    }
    return [num(n), num(run.ops), num(byFormula), seconds(run.ops)];
  });
  const task = naiveByFormula(taskInput().queries);
  rows.push([num(N_TASK), "(실행하지 않음)", num(task), seconds(task)]);
  return [
    md(
      ["n = q", "셈 연산(실측)", "Σ(r − l + 1)", "초당 1 억 번 기준"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `두 규모에서 실측이 Σ(r − l + 1) 와 같고 답도 정본과 같으니, 과제 규모에서는 식이 곧 셈 연산 수입니다. 규모마다 입력은 시드 ${SEED}${으로(SEED)} 새로 만들었습니다.`,
  ].join("\n");
}

/** 겹치는 두 질의 — 새로 세기와 창 이어받기의 셈 연산. */
function originReuse(): string {
  const qs: Query[] = [
    [0, 4],
    [1, 3],
  ];
  const fresh = qs.map(([l, r]) => r - l + 1);
  let curL = 0;
  let curR = -1;
  const window = qs.map(([l, r]) => {
    const m = Math.abs(curL - l) + Math.abs(curR - r);
    curL = l;
    curR = r;
    return m;
  });
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return [
    md(
      ["방법", "[0,4]", "[1,3]", "합"],
      [
        ["질의마다 새로 세기", ...fresh.map(String), String(sum(fresh))],
        ["창 이어받기", ...window.map(String), String(sum(window))],
      ],
      [1, 2, 3],
    ),
    "",
    `[1,3] 에서 새로 세기는 ${fresh[1]} 칸을 다시 읽고, 창 이어받기는 두 끝을 ${window[1]} 칸 옮깁니다.`,
  ].join("\n");
}

/** 질의 다섯을 받은 순서와 r 오름차순으로 처리할 때 옮긴 칸. */
function originTwoOrders(): string {
  const a = asGiven(Q5);
  const b = byR(Q5);
  const per = (order: readonly Tagged[]) => {
    let curL = 0;
    let curR = -1;
    return order.map((q) => {
      const m = Math.abs(curL - q.l) + Math.abs(curR - q.r);
      curL = q.l;
      curR = q.r;
      return m;
    });
  };
  const pa = per(a);
  const pb = per(b);
  const rows = a.map((q, k) => [
    String(k + 1),
    qv(q),
    String(pa[k]),
    qv(b[k] as Tagged),
    String(pb[k]),
  ]);
  return [
    md(
      ["차례", "받은 순서", "옮긴 칸", "r 오름차순", "옮긴 칸"],
      rows,
      [0, 2, 4],
    ),
    "",
    `받은 순서는 ${moves(a).total} 칸, r 오름차순은 ${moves(b).total} 칸입니다.`,
  ].join("\n");
}

/** 두 끝 중 하나만 보는 정렬 — 열여섯 칸 · 질의 여덟. */
function originCandidates(): string {
  const row = (name: string, o: Tagged[]) => {
    const m = moves(o);
    return [
      name,
      o.map((q) => pName(q.i)).join(" "),
      trail(o.map((q) => q.l)),
      trail(o.map((q) => q.r)),
      String(m.total),
    ];
  };
  return md(
    ["순서", "처리 차례", "curL 자취", "curR 자취", "옮긴 칸"],
    [row("l 오름차순", byL(P8)), row("r 오름차순", byR(P8))],
    [4],
  );
}

/** 앞자리가 순서를 정하면 뒷자리가 크게 움직이는 이웃 — 두 정렬에서 가장 큰 자리. */
function originLexi(): string {
  const worstPair = (o: Tagged[], other: "l" | "r") => {
    let best = { a: o[0] as Tagged, b: o[1] as Tagged, d: -1 };
    for (let k = 1; k < o.length; k++) {
      const a = o[k - 1] as Tagged;
      const b = o[k] as Tagged;
      const d = Math.abs(a[other] - b[other]);
      if (d > best.d) best = { a, b, d };
    }
    return best;
  };
  const pl = worstPair(byL(P8), "r");
  const pr = worstPair(byR(P8), "l");
  return md(
    ["정렬", "이웃한 두 질의", "앞자리 차이", "뒷자리 이동"],
    [
      [
        "l 오름차순",
        `${qv(pl.a, pName)} → ${qv(pl.b, pName)}`,
        `l ${Math.abs(pl.a.l - pl.b.l)} 칸`,
        `r ${pl.d} 칸`,
      ],
      [
        "r 오름차순",
        `${qv(pr.a, pName)} → ${qv(pr.b, pName)}`,
        `r ${Math.abs(pr.a.r - pr.b.r)} 칸`,
        `l ${pr.d} 칸`,
      ],
    ],
  );
}

/** 앞자리를 l 그대로 두는 것과 ⌊l / 4⌋ 로 두는 것. */
function originGroup(): string {
  const B = trace(A16, P8).block;
  const head = ["앞자리", ...P8.map((_, i) => pName(i))];
  const asIs = ["l 그대로", ...P8.map(([l]) => String(l))];
  const grouped = [`⌊l / ${B}⌋`, ...P8.map(([l]) => String(Math.floor(l / B)))];
  const kinds = (xs: string[]) => new Set(xs.slice(1)).size;
  return [
    md(
      head,
      [asIs, grouped],
      P8.map((_, i) => i + 1),
    ),
    "",
    `앞자리가 l 그대로면 값이 ${kinds(asIs)} 가지로 모두 다르고, ⌊l / ${B}⌋${으로(B)} 두면 ${kinds(grouped)} 가지로 모입니다.`,
  ].join("\n");
}

/** 열여섯 칸 · 질의 여덟 — 두 후보와 블록 순서(정본이 정렬한 차례). */
function originBlock16(): string {
  const t = trace(A16, P8);
  const row = (name: string, o: readonly Tagged[]) => {
    const m = moves(o);
    return [
      name,
      o.map((q) => pName(q.i)).join(" "),
      String(m.left),
      String(m.right),
      String(m.total),
    ];
  };
  return [
    md(
      ["순서", "처리 차례", "curL", "curR", "옮긴 칸"],
      [
        row("l 오름차순", byL(P8)),
        row("r 오름차순", byR(P8)),
        row(`블록 순서(B = ${t.block})`, t.order),
      ],
      [2, 3, 4],
    ),
    "",
    `블록 순서의 처리 차례는 정본이 정렬한 그대로입니다. 두 끝의 이동은 배열의 값과 상관없어서, 값은 i mod 4 로 두었습니다.`,
  ].join("\n");
}

/* ───────── 아이디어 상세 ───────── */

/** (c) 하나를 읽는 법 — Q3 의 키와 자리. */
function buildReadOne(): string {
  const t = trace(A5, Q5);
  const i = 3;
  const [l, r] = Q5[i] as Query;
  const b = Math.floor(l / t.block);
  const at = t.order.findIndex((q) => q.i === i) + 1;
  const same = t.order.filter((q) => Math.floor(q.l / t.block) === b);
  return [
    "```text",
    `${qName(i)}[${l},${r}]   왼쪽 끝 l = ${l}  →  blk(${l}) = ⌊${l} / ${t.block}⌋ = ${b}  →  키 (${b}, ${r})`,
    `            블록 ${b} 에 든 질의 ${same.map((q) => `${qName(q.i)}(r = ${q.r})`).join(" · ")} 사이에서 r 로 줄을 선다`,
    `            └ 처리 차례 ${at} 번째`,
    "```",
  ].join("\n");
}

/** (d) 이웃끼리의 관계 — 정렬된 차례에서 이웃한 두 질의가 두 끝을 얼마나 옮기는가. */
function buildNeighbors(): string {
  const t = trace(A5, Q5);
  const B = t.block;
  const rows: string[][] = [];
  let sameCount = 0;
  let maxSameL = 0;
  let rightBack = 0;
  const backs: string[] = [];
  for (let k = 1; k < t.order.length; k++) {
    const a = t.order[k - 1] as Tagged;
    const b = t.order[k] as Tagged;
    const same = Math.floor(a.l / B) === Math.floor(b.l / B);
    if (same) {
      sameCount++;
      maxSameL = Math.max(maxSameL, Math.abs(a.l - b.l));
    }
    if (b.r < a.r) {
      rightBack++;
      backs.push(`${qName(a.i)} → ${qName(b.i)}`);
    }
    rows.push([
      `${qv(a)} → ${qv(b)}`,
      same
        ? `블록 ${Math.floor(a.l / B)} 안`
        : `블록 ${Math.floor(a.l / B)} → ${Math.floor(b.l / B)}`,
      `${a.l} → ${b.l}`,
      `${a.r} → ${b.r}`,
    ]);
  }
  return [
    md(["이웃한 두 질의", "블록", "curL", "curR"], rows),
    "",
    `같은 블록 안의 이웃 ${sameCount} 쌍에서 curL 은 많아야 ${maxSameL} 칸 옮기고 curR 은 줄지 않습니다. curR 이 줄어든 이웃은 ${rightBack} 쌍(${backs.join(" · ")})이고, 블록이 바뀌는 자리입니다.`,
  ].join("\n");
}

/** (e) 헷갈리기 쉬운 모양 — 구간 합 편의 제곱근 분할과 블록 순서. */
function buildVsSqrt(): string {
  const t = trace(A5, Q5);
  const B = t.block;
  const K = blocksOf(A5.length, B);
  const sums = Array.from({ length: K }, (_, b) =>
    A5.slice(b * B, b * B + B).reduce((s, v) => s + v, 0),
  );
  return md(
    ["모양", "B 칸씩 끊는 것", "블록마다 미리 적어 두는 값", "블록을 쓰는 때"],
    [
      [
        "제곱근 분할(구간 합 편)",
        "배열 arr 의 칸",
        `${K} 개 — 블록 합 ${sums.join(" · ")}`,
        "질의마다 블록 합을 읽는다",
      ],
      [
        "블록 순서(이 편)",
        "질의의 왼쪽 끝이 놓이는 좌표 0 … n − 1",
        "0 개",
        "정렬할 때 두 질의를 비교하는 데서만",
      ],
    ],
  );
}

/** 1단계 — 정렬한 차례와 원래 자리. */
function buildSort(): string {
  const t = trace(A5, Q5);
  const rows = t.order.map((q, k) => [
    String(k + 1),
    qv(q),
    String(q.i),
    `(${Math.floor(q.l / t.block)}, ${q.r})`,
  ]);
  return md(
    ["처리 차례", "질의", "원래 자리 i", "키 (blk(l), r)"],
    rows,
    [0, 2],
  );
}

/** 2단계 — 상태의 처음 값과, 전개 입력에서 가장 컸을 때. */
function buildState(): string {
  const steps = walkSteps();
  const maxKeys = Math.max(...steps.map((s) => s.count.length));
  const maxDistinct = Math.max(...steps.map((s) => s.distinct));
  const maxLen = Math.max(...steps.map((s) => s.window[1] - s.window[0] + 1));
  return md(
    ["상태", "처음 값", "범위", "전개 입력에서 가장 컸을 때"],
    [
      [
        "curL · curR",
        "0 · −1 (빈 창)",
        "0 ≤ curL ≤ curR + 1 ≤ n",
        `창의 길이 ${maxLen} 칸`,
      ],
      ["count", "빈 맵", "키는 창에 한 번이라도 들어온 값", `키 ${maxKeys} 개`],
      ["distinct", "0", "0 이상, 창의 길이 이하", String(maxDistinct)],
    ],
  );
}

/** 3단계 — 겹치지 않는 두 질의 사이를 옮길 때 걸음마다 셈 상태. */
function buildDisjoint(): string {
  const qs: Query[] = [
    [0, 1],
    [3, 4],
  ];
  const t = trace(A5, qs);
  const first = t.runs[0];
  const second = t.runs[1];
  if (first === undefined || second === undefined)
    throw new Error("두 질의가 아니다");
  const rows: string[][] = [
    [
      "시작",
      "—",
      "—",
      iv(second.start[0], second.start[1]),
      countText(first.count),
      String(first.distinct),
    ],
  ];
  second.moves.forEach((m: Move, k) => {
    rows.push([
      String(k + 1),
      m.branch,
      `${m.branch.endsWith("+") ? "add" : "remove"}(${m.value})`,
      iv(m.to[0], m.to[1]),
      countText(m.count),
      String(m.distinct),
    ]);
  });
  const leftOut = second.moves.filter((m) => m.branch === "L−").map((m) => m.k);
  const want = new Set(A5.slice(3, 5)).size;
  const biggest = Math.max(...second.moves.map((m) => m.to[1] - m.to[0] + 1));
  return [
    md(["걸음", "갈래", "호출", "창", "count", "distinct"], rows, [5]),
    "",
    `창은 길이 ${biggest} 칸까지 커졌다가 줄어듭니다. L− 가 인덱스 ${leftOut.join(" · ")}${을를(leftOut.at(-1) as number)} 하나씩 뺐고, 끝난 창 [3,4] 의 distinct ${second.distinct}${은는(second.distinct)} 그 구간을 새로 센 값 ${want}${과와(want)} 같습니다.`,
  ].join("\n");
}

/** 4단계 — 정렬한 차례로 창을 옮기며 답을 원래 자리에 적는다. */
function buildAnswers(): string {
  const t = trace(A5, Q5);
  const rows = t.runs.map((run) => [
    String(run.step + 1),
    qv(run.q),
    String(run.moves.length),
    String(run.distinct),
    `out[${run.q.i}]`,
  ]);
  const total = t.runs.reduce((s, r) => s + r.moves.length, 0);
  return [
    md(
      ["처리 차례", "질의", "창을 옮긴 칸", "distinct", "적는 자리"],
      rows,
      [0, 2, 3],
    ),
    "",
    `창을 옮긴 칸은 모두 ${total} 칸이고, 돌려주는 out 은 ${list(t.out)} 입니다.`,
  ].join("\n");
}

/** 설계 선택 — 열여섯 칸 · 질의 여덟에서 블록 크기를 바꿔 본다. */
function buildSweep16(): string {
  const B0 = trace(A16, P8).block;
  const Bs = [1, 2, 4, 8, 16];
  const rows = Bs.map((B) => {
    const o = blockOrder(P8, B);
    const m = moves(o);
    return [
      String(B),
      String(blocksOf(A16.length, B)),
      o.map((q) => pName(q.i)).join(" "),
      String(m.left),
      String(m.right),
      String(m.total),
    ];
  });
  const best = Bs.reduce((a, b) =>
    moves(blockOrder(P8, b)).total < moves(blockOrder(P8, a)).total ? b : a,
  );
  if (
    JSON.stringify(blockOrder(P8, B0).map((q) => q.i)) !==
    JSON.stringify(trace(A16, P8).order.map((q) => q.i))
  ) {
    throw new Error("정본이 정렬한 차례와 같은 키로 만든 차례가 다르다");
  }
  return [
    md(
      ["B", "블록 수", "처리 차례", "curL", "curR", "합"],
      rows,
      [0, 1, 3, 4, 5],
    ),
    "",
    `가장 적은 합은 B = ${best} 에서 나왔고, 정본이 n = ${A16.length} 에서 고르는 B = ⌊√${A16.length}⌋ = ${B0}${과와(B0)} 같습니다.`,
  ].join("\n");
}

const SWEEP = [10, 100, 316, 447, 1000, 10000];

/** 설계 선택 — 과제 규모 입력에서 블록 크기를 바꿔 본다. */
function buildSweepTask(): string {
  const { queries } = taskInput();
  const c = taskCounts();
  const rows = SWEEP.map((B) => {
    const m = B === c.B ? c.block : moves(blockOrder(queries, B));
    return [
      num(B),
      num(blocksOf(N_TASK, B)),
      num(m.left),
      num(m.right),
      num(m.total),
      seconds(m.total),
    ];
  });
  const best = SWEEP.reduce((a, b) =>
    moves(blockOrder(queries, b)).total < moves(blockOrder(queries, a)).total
      ? b
      : a,
  );
  return [
    md(
      ["B", "블록 수", "curL", "curR", "합", "초당 1 억 번 기준"],
      rows,
      [0, 1, 2, 3, 4, 5],
    ),
    "",
    `n = q = ${num(N_TASK)} 입력(시드 ${SEED})에서 잰 값입니다. 이 여섯 중 가장 적은 합은 B = ${num(best)} 에서 나왔고, 정본이 고르는 B = ⌊√${num(N_TASK)}⌋ = ${c.B}${은는(c.B)} 그다음입니다.`,
  ].join("\n");
}

/* ───────── 수행으로 알아보는 알고리즘 ───────── */

function walkInput(): string {
  const out = mosAlgorithm([...A5], Q5);
  return [
    "```ts",
    `const arr = ${list(A5)};`,
    `const queries: [number, number][] = [${Q5.map(([l, r]) => `[${l}, ${r}]`).join(", ")}];`,
    `// 이 절이 끝나면 ${list(out)}${이가(out.at(-1) as number)} 나와야 한다`,
    "```",
  ].join("\n");
}

function walkTag(): string {
  const tagged = Q5.map(([l, r], i) => `{l:${l}, r:${r}, i:${i}}`);
  return [
    "```text",
    `[ ${tagged.slice(0, 3).join("   ")}`,
    `  ${tagged.slice(3).join("   ")} ]`,
    "     └ i 가 원래 자리다. 답은 out[i] 에 넣는다",
    "```",
  ].join("\n");
}

function walkBlock(): string {
  const lines = [1, 2, 3, 4, 5, 16, N_TASK].map((n) => {
    const { block } = orderOf(new Array<number>(n).fill(0), [[0, 0]]);
    const root = Math.sqrt(n);
    const rootText = Number.isInteger(root)
      ? String(root)
      : `${root.toFixed(4)}…`;
    return `n = ${pad(num(n), 7)}  →  √n = ${pad(rootText, 9)}  →  block = ${block}`;
  });
  return ["```text", ...lines, "```"].join("\n");
}

function walkSorted(): string {
  const t = trace(A5, Q5);
  const B = t.block;
  const before = Q5.map(
    ([l, r], i) => `${qName(i)}[${l},${r}] blk ${Math.floor(l / B)}`,
  );
  const groups = new Map<number, Tagged[]>();
  for (const q of t.order) {
    const b = Math.floor(q.l / B);
    groups.set(b, [...(groups.get(b) ?? []), q]);
  }
  const after = [...groups.entries()]
    .map(([b, qs]) => `블록 ${b}: ${qs.map((q) => qv(q)).join(" → ")}`)
    .join("   │   ");
  return [
    "```text",
    `정렬 전   ${before.join("   ")}`,
    `정렬 후   ${after}`,
    "```",
  ].join("\n");
}

/** 4 — add · remove 가 distinct 를 바꾸는 자리와 안 바꾸는 자리. 전개 입력의 걸음에서 고른다. */
function walkEdges(): string {
  const steps = walkSteps().filter((s) => s.kind === "move");
  const kinds: [string, (m: Move) => boolean][] = [
    ["add 0 → 1", (m) => m.before === 0 && m.after === 1],
    ["add 1 이상에서", (m) => m.after > m.before && m.before >= 1],
    ["remove 2 이상에서", (m) => m.after < m.before && m.before >= 2],
    ["remove 1 → 0", (m) => m.before === 1 && m.after === 0],
  ];
  const rows = kinds.map(([name, test]) => {
    const s = steps.find((x) => test(x.move as Move));
    if (s === undefined) throw new Error(`${name} 걸음이 없다`);
    const m = s.move as Move;
    const prev =
      m.distinct +
      (m.before === 1 && m.after === 0 ? 1 : 0) -
      (m.before === 0 && m.after === 1 ? 1 : 0);
    return [
      s.id,
      `${m.after > m.before ? "add" : "remove"}(${m.value})`,
      `${m.before} → ${m.after}`,
      prev === m.distinct ? `${m.distinct} 그대로` : `${prev} → ${m.distinct}`,
    ];
  });
  return md(["걸음", "호출", `count[v]`, "distinct"], rows);
}

/** Set 하나로 세는 판 — 정렬은 정본의 차례를 그대로 쓰고, 셈만 Set 으로 바꾼다. */
function setWindow(
  arr: readonly number[],
  queries: readonly Query[],
): number[] {
  const { order } = orderOf(arr, queries);
  const seen = new Set<number>();
  const out = new Array<number>(queries.length);
  let curL = 0;
  let curR = -1;
  for (const q of order) {
    for (const p of expectedReads(curL, curR, q)) {
      const v = arr[p.k] as number;
      if (p.branch === "L+" || p.branch === "R+") seen.add(v);
      else seen.delete(v);
      [curL, curR] = p.to;
    }
    out[q.i] = seen.size;
  }
  return out;
}

function pauseSetShrink(): string {
  const qs: Query[] = [
    [0, 2],
    [1, 2],
  ];
  const t = trace(A5, qs);
  const a = t.runs[0];
  const b = t.runs[1];
  if (a === undefined || b === undefined) throw new Error("두 질의가 아니다");
  const setA = new Set(A5.slice(a.q.l, a.q.r + 1));
  const removed = b.moves[0] as Move;
  const setB = new Set(setA);
  setB.delete(removed.value);
  const got = setWindow(A5, qs);
  return md(
    ["창", "창의 값", "Set", "Set 크기", "count 로 센 distinct"],
    [
      [
        iv(a.q.l, a.q.r),
        vals(A5.slice(a.q.l, a.q.r + 1)),
        `{${[...setA].join(", ")}}`,
        String(got[a.q.i]),
        String(a.distinct),
      ],
      [
        iv(b.q.l, b.q.r),
        vals(A5.slice(b.q.l, b.q.r + 1)),
        `{${[...setB].join(", ")}}`,
        String(got[b.q.i]),
        String(b.distinct),
      ],
    ],
    [3, 4],
  );
}

function pauseSetAnswers(): string {
  const right = mosAlgorithm([...A5], Q5);
  const got = setWindow(A5, Q5);
  const wrong = Q5.map((_, i) => i).filter((i) => got[i] !== right[i]);
  return [
    md(
      ["셈 방식", ...Q5.map((_, i) => qName(i))],
      [
        ["count 맵(정본)", ...right.map(String)],
        ["Set 하나", ...got.map(String)],
      ],
      Q5.map((_, i) => i + 1),
    ),
    "",
    `다섯 중 ${wrong.length} 개(${wrong.map(qName).join(" · ")})의 답이 정본과 다릅니다.`,
  ].join("\n");
}

/** 5 — 걸음마다의 조건 판정과 셈 상태. */
function walkTrace(): string {
  const rows = walkSteps().map((s) => {
    const q = s.run.q;
    const [L, R] = s.window;
    if (s.kind === "record") {
      return [
        s.id,
        `${qv(q)} 답 기록`,
        "네 조건이 모두 거짓",
        iv(L, R),
        vals(A5.slice(L, R + 1)),
        countText(s.count),
        `out[${q.i}] = ${s.distinct}`,
      ];
    }
    const m = s.move as Move;
    const [pL, pR] = m.from;
    const cond =
      m.branch === "L+"
        ? `curL = ${pL} > ${q.l} 참`
        : m.branch === "R+"
          ? `curR = ${pR} < ${q.r} 참`
          : m.branch === "L−"
            ? `curL = ${pL} < ${q.l} 참`
            : `curR = ${pR} > ${q.r} 참`;
    return [
      s.id,
      `${m.branch} ${m.branch.endsWith("+") ? "add" : "remove"}(${m.value})`,
      cond,
      iv(L, R),
      vals(A5.slice(L, R + 1)),
      countText(s.count),
      String(s.distinct),
    ];
  });
  return md(
    ["단계", "하는 일", "조건 판정", "창", "창의 값", "count", "distinct"],
    rows,
  );
}

function walkBranches(): string {
  const steps = walkSteps().filter((s) => s.kind === "move");
  const by = (b: string) =>
    steps
      .filter((s) => s.move?.branch === b)
      .map((s) => s.id)
      .join(" · ");
  return [
    md(
      ["갈래", "걸음"],
      [
        ["L+ 왼쪽으로 넓힘", by("L+")],
        ["R+ 오른쪽으로 넓힘", by("R+")],
        ["L− 왼쪽에서 좁힘", by("L−")],
        ["R− 오른쪽에서 좁힘", by("R−")],
      ],
    ),
    "",
    `네 갈래가 모두 한 번 이상 나왔고, 창이 옮긴 칸은 모두 ${steps.length} 칸입니다.`,
  ].join("\n");
}

/* ───────── 짚고 가기 — 좁히기를 넓히기보다 먼저 두면 ───────── */

/**
 * 네 `while` 중 왼쪽 좁히기(L−)를 맨 앞으로 옮긴 변이. **정본 소스에서 기계로 만든다** — L+ 줄 하나를
 * 「L− 다음 L+」로 바꾼다. 뒤의 L− 줄은 그대로라 거기서는 할 일이 없다. L− 가 끝난 직후의 `count` 를
 * 기록하는 한 마디를 같은 줄에 붙였다.
 */
const shrinkFirst = await loadMutant<{ mosAlgorithm: typeof mosAlgorithm }>(
  REF,
  {
    swap: [
      /^(\s*)while \(curL > q\.l\) add\(arr\[--curL\] as number\); \/\/ L\+ 왼쪽 넓힘$/,
      "$1while (curL < q.l) remove(arr[curL++] as number); (globalThis as any).__peek?.([...count]); // ← L− 를 맨 앞으로\n$1while (curL > q.l) add(arr[--curL] as number); // L+ 왼쪽 넓힘",
    ],
  },
);

/** 무작위 작은 입력 — 배열 길이 1~8, 값 0~3, 질의 1~4 개. */
function smallInputs(count: number, seed: number): [number[], Query[]][] {
  const next = lcg(seed);
  return Array.from({ length: count }, () => {
    const n = 1 + (next() % 8);
    const arr = Array.from({ length: n }, () => next() % 4);
    const q = 1 + (next() % 4);
    const qs: Query[] = Array.from({ length: q }, () => {
      const a = next() % n;
      const b = next() % n;
      return [Math.min(a, b), Math.max(a, b)];
    });
    return [arr, qs];
  });
}

const CROSS_ARR = [1, 2, 3, 1, 2, 3];
const CROSS_Q: Query[] = [
  [0, 1],
  [4, 5],
];
const TRIALS = 30_000;

function pauseOrderAnswers(): string {
  const cases: [string, number[], Query[]][] = [
    ["전개 입력", A5, Q5],
    [`${list(CROSS_ARR)} · [[0,1], [4,5]]`, CROSS_ARR, CROSS_Q],
  ];
  const rows = cases.map(([name, arr, qs]) => [
    name,
    list(mosAlgorithm([...arr], qs)),
    list(shrinkFirst.mosAlgorithm([...arr], qs)),
  ]);
  const diff = smallInputs(TRIALS, SEED).filter(
    ([arr, qs]) =>
      JSON.stringify(mosAlgorithm([...arr], qs)) !==
      JSON.stringify(shrinkFirst.mosAlgorithm([...arr], qs)),
  ).length;
  return [
    md(["입력", "넓히기를 먼저(정본)", "좁히기를 먼저"], rows),
    "",
    `무작위 작은 입력 ${num(TRIALS)} 벌(배열 길이 1 이상 8 이하, 값 0 이상 3 이하, 질의 1 개 이상 4 개 이하, 시드 ${SEED})에서는 ${num(diff)} 벌의 답이 정본과 다릅니다.`,
  ].join("\n");
}

function pauseOrderCross(): string {
  const g = globalThis as unknown as {
    __peek?: (c: [number, number][]) => void;
  };
  const peeks: [number, number][][] = [];
  g.__peek = (c) => peeks.push(c);
  const got = shrinkFirst.mosAlgorithm([...CROSS_ARR], CROSS_Q);
  g.__peek = undefined;
  const right = mosAlgorithm([...CROSS_ARR], CROSS_Q);
  const second = peeks[1];
  const show = (c: [number, number][] | undefined) =>
    c === undefined
      ? "(기록 없음 — 좁히기가 앞에 없는 코드)"
      : `{${c.map(([k, v]) => `${k}:${Number.isNaN(v) ? "NaN" : v}`).join(", ")}}`;
  return [
    "```text",
    `arr = ${list(CROSS_ARR)}   창 [0,1] 에서 [4,5] 로 갈 때`,
    `  L− 를 먼저 끝낸 직후   curL = 4, curR = 1    count ${show(second)}`,
    `                         └ 창 [0,1] 에 없던 arr[2] = 3 · arr[3] = 1 까지 뺐다`,
    `  [4,5] 의 답            정본 ${right[1]}   좁히기를 먼저 둔 코드 ${got[1]}`,
    "```",
  ].join("\n");
}

/* ───────── 전체 코드 ───────── */

function finalCalls(): string {
  const calls: [string, number[], Query[]][] = [
    [list(A5), A5, Q5],
    [list(A5), A5, []],
    ["[7]", [7], [[0, 0]]],
  ];
  const texts = calls.map(
    ([a, , qs]) =>
      `mosAlgorithm(${a}, ${qs.length === 0 ? "[]" : `[${qs.map(([l, r]) => `[${l},${r}]`).join(",")}]`})`,
  );
  const wide = Math.max(...texts.map(width)) + 2;
  const lines = calls.map(
    ([, arr, qs], k) =>
      `${pad(texts[k] as string, wide)}→  ${list(mosAlgorithm([...arr], qs))}`,
  );
  return ["```text", ...lines, "```"].join("\n");
}

/* ───────── 알아 두면 좋은 개념 ───────── */

function relatedBalance(): string {
  const { queries } = taskInput();
  const rows = [100, 316, 1000].map((B) => {
    const m = moves(blockOrder(queries, B));
    const b = bound(N_TASK, N_TASK, B);
    return [num(B), num(b.left), num(b.right), num(m.left), num(m.right)];
  });
  return md(
    ["B", "curL 상한", "curR 상한", "curL 실측", "curR 실측"],
    rows,
    [0, 1, 2, 3, 4],
  );
}

/* ───────── 수식 정의와 유도 ───────── */

function mathCheck(): string {
  const t = trace(A5, Q5);
  const B = t.block;
  const blk = (l: number) => Math.floor(l / B);
  const pairs: [number, number][] = [
    [1, 0],
    [0, 4],
    [4, 2],
  ];
  const lines = pairs.map(([a, b]) => {
    const [la, ra] = Q5[a] as Query;
    const [lb, rb] = Q5[b] as Query;
    const ba = blk(la);
    const bb = blk(lb);
    const first =
      ba === bb
        ? `blk ${ba} = ${bb} → r 을 본다 → ${ra} ${ra < rb ? "<" : ">"} ${rb}`
        : `blk ${ba} ${ba < bb ? "<" : ">"} ${bb} → 거기서 끝`;
    const less = ba !== bb ? ba < bb : ra < rb;
    const pos = (i: number) => t.order.findIndex((q) => q.i === i);
    if (less !== pos(a) < pos(b))
      throw new Error("사전식 비교가 정본의 차례와 어긋난다");
    const [x, y] = less ? [a, b] : [b, a];
    const note =
      ba !== bb && ra < rb !== less
        ? `   (r 은 ${ra} ${ra < rb ? "<" : ">"} ${rb} 인데도)`
        : "";
    return `  ${qName(a)} vs ${qName(b)}   ${pad(first, 30)}⇒ ${qName(x)} ≺ ${qName(y)}${note}`;
  });
  return [
    "```text",
    "사전식 비교 — 앞 값(blk)을 먼저, 같을 때만 뒤 값(r)",
    ...lines,
    `  정본이 정렬한 전체 차례   ${t.order.map((q) => qName(q.i)).join(" ≺ ")}   — 세 비교의 결과가 이 차례와 맞는다`,
    "```",
  ].join("\n");
}

/** 왼쪽 끝 — 전개 입력의 이웃한 두 질의마다 실제로 옮긴 칸과 그 한계. */
function mathLeft(): string {
  const t = trace(A5, Q5);
  const B = t.block;
  let prev = { l: 0, r: -1, i: -1 };
  const rows = t.order.map((q) => {
    const b0 = Math.floor(prev.l / B);
    const b1 = Math.floor(q.l / B);
    const limit = b0 === b1 ? B - 1 : (b1 - b0) * B + B - 1;
    const moved = Math.abs(q.l - prev.l);
    if (moved > limit) throw new Error("왼쪽 끝이 한계를 넘었다");
    const from = prev.i < 0 ? "시작(curL = 0)" : qv(prev);
    const row = [
      `${from} → ${qv(q)}`,
      b0 === b1 ? `블록 ${b0} 안` : `블록 ${b0} → ${b1}`,
      b0 === b1
        ? `B − 1 = ${limit}`
        : `(${b1} − ${b0})·${B} + ${B} − 1 = ${limit}`,
      String(moved),
    ];
    prev = q;
    return row;
  });
  return md(
    ["이웃한 두 질의", "블록", "Δl 의 한계", "curL 이 옮긴 칸"],
    rows,
    [3],
  );
}

function mathCheckBound(): string {
  const cases: [string, number[], Query[]][] = [
    ["전개 입력", A5, Q5],
    ["열여섯 칸 · 질의 여덟", A16, P8],
  ];
  const rows = cases.map(([name, arr, qs]) => {
    const t = trace(arr, qs);
    const n = arr.length;
    const q = qs.length;
    const B = t.block;
    const K = blocksOf(n, B);
    const b = bound(n, q, B);
    const m = moves(t.order);
    if (m.left > b.left || m.right > b.right)
      throw new Error("실측이 상한을 넘었다");
    return [
      name,
      `n = ${n}, q = ${q}, B = ${B}, K = ${K}`,
      `${q}·${B - 1} + ${K - 1}·${B} = ${b.left}`,
      String(m.left),
      `${K}·(${2 * n} − ${K * B}) = ${b.right}`,
      String(m.right),
    ];
  });
  return md(
    ["입력", "크기", "curL 상한", "curL 실측", "curR 상한", "curR 실측"],
    rows,
    [3, 5],
  );
}

function mathCode(): string {
  const b = bound(N_TASK, N_TASK, 316);
  return [
    "```ts",
    "const bound = (n: number, q: number, B: number): number => {",
    "  const K = Math.ceil(n / B);",
    "  return q * (B - 1) + (K - 1) * B + K * (2 * n - K * B);",
    "};",
    "",
    `bound(5, 5, 2); // → ${bound(5, 5, 2).total}`,
    `bound(100_000, 100_000, 316); // → ${b.total}`,
    "```",
  ].join("\n");
}

function mathScale(): string {
  const { queries } = taskInput();
  const rows = [100, 316, 447, 1000].map((B) => {
    const b = bound(N_TASK, N_TASK, B);
    const w = moves(blockOrder(worstInput(N_TASK, N_TASK, B), B));
    const r = moves(blockOrder(queries, B));
    if (w.total > b.total || r.total > b.total)
      throw new Error("실측이 상한을 넘었다");
    return [
      num(B),
      num(Math.round(N_TASK * B + (N_TASK * N_TASK) / B)),
      num(b.total),
      num(w.total),
      num(r.total),
    ];
  });
  return [
    md(
      [
        "B",
        "qB + n²/B",
        "상한 식",
        "그 B 의 최악 입력 실측",
        "무작위 입력 실측",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `n = q = ${num(N_TASK)} 입니다. qB + n²/B 는 소수점 아래를 반올림했고, 최악 입력은 「최악을 만드는 입력」의 방법으로 B 마다 새로 만들었습니다.`,
  ].join("\n");
}

/* ───────── 불변식 ───────── */

function invariantPaths(): string {
  const target: Query = [1, 3];
  const cases: [string, Query[]][] = [
    ["빈 창", [target]],
    ["[0,2]", [[0, 2], target]],
    ["[1,1]", [[1, 1], target]],
  ];
  const rows = cases.map(([from, qs]) => {
    const t = trace(A5, qs);
    const run = t.runs.find((r) => r.q.l === target[0] && r.q.r === target[1]);
    if (run === undefined || run.step !== qs.length - 1)
      throw new Error("[1,3] 이 마지막이 아니다");
    const branches = run.moves.map((m) => m.branch).join(" ");
    const shown = run.count.filter(([, c]) => c !== 0);
    return [from, branches, countText(shown), String(run.distinct)];
  });
  return [
    md(
      ["앞 창", "[1,3] 까지 거친 갈래", "count(0 이 아닌 키)", "distinct"],
      rows,
      [3],
    ),
    "",
    `세 경로 모두 창 [1,3] 의 값 ${vals(A5.slice(1, 4))} 에서 끝나고, 셈 상태가 같습니다.`,
  ].join("\n");
}

function invariantEdges(): string {
  const cases: [string, number[], Query[]][] = [
    ["질의 0 개", [1, 2, 3], []],
    [
      "l = r",
      [9, 8, 7],
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    ],
    [
      "모든 값이 같음",
      [7, 7, 7, 7],
      [
        [0, 3],
        [1, 2],
        [0, 0],
      ],
    ],
    ["n = 1", [42], [[0, 0]]],
    [
      "음수 · 0 · 양수",
      [-1, 0, -1, 2, 0],
      [
        [0, 4],
        [0, 2],
      ],
    ],
    [
      "겹치지 않는 두 질의",
      A5,
      [
        [0, 1],
        [3, 4],
      ],
    ],
  ];
  const rows = cases.map(([name, arr, qs]) => {
    const got = mosAlgorithm([...arr], qs);
    const want = naive(arr, qs).out;
    return [
      name,
      `${list(arr)} · ${qs.length === 0 ? "[]" : `[${qs.map(([l, r]) => `[${l},${r}]`).join(", ")}]`}`,
      list(got),
      list(want),
    ];
  });
  return md(["입력", "arr · queries", "정본", "질의마다 새로 센 값"], rows);
}

/** `add` 의 `if (next === 1)` 을 지운 변이 — 개수를 늘릴 때마다 distinct 도 늘린다. */
const noEdge = await loadMutant<{ mosAlgorithm: typeof mosAlgorithm }>(REF, {
  swap: [/^(\s*)if \(next === 1\) distinct\+\+;$/, "$1distinct++;"],
});

function mutantAdd(): string {
  const right = mosAlgorithm([...A5], Q5);
  const broken = noEdge.mosAlgorithm([...A5], Q5);
  const neutral = noEdge.mosAlgorithm === mosAlgorithm;
  if (!neutral && JSON.stringify(right) === JSON.stringify(broken)) {
    throw new Error("변이가 답을 바꾸지 못했다 — 「부푼다」가 거짓이다");
  }
  const bigger = right.filter((v, i) => (broken[i] as number) > v).length;
  return [
    md(
      ["코드", ...Q5.map(([l, r], i) => `${qName(i)}[${l},${r}]`)],
      [
        ["바른 코드", ...right.map(String)],
        ["조건을 지운 코드", ...broken.map(String)],
      ],
      Q5.map((_, i) => i + 1),
    ),
    "",
    `다섯 질의 중 ${bigger} 개에서 조건을 지운 코드의 답이 더 큽니다.`,
  ].join("\n");
}

/** 조건을 지운 코드에서 Q0 의 답 — 그 앞까지 부른 add 수와 1 → 0 이 된 remove 수로 센다. */
function mutantAddWhy(): string {
  const steps = walkSteps();
  const q0 = steps.find((s) => s.kind === "record" && s.run.q.i === 0);
  if (q0 === undefined) throw new Error("Q0 기록이 없다");
  const upto = steps
    .slice(0, steps.indexOf(q0))
    .filter((s) => s.kind === "move");
  const adds = upto.filter(
    (s) => (s.move as Move).after > (s.move as Move).before,
  );
  const drops = upto.filter(
    (s) => (s.move as Move).before === 1 && (s.move as Move).after === 0,
  );
  const broken = noEdge.mosAlgorithm([...A5], Q5)[0];
  const rows: [string, string][] = [
    [
      "Q0 을 적기 전까지 add",
      `${adds.length} 번 (${adds.map((s) => s.id).join(" · ")})`,
    ],
    ["remove 가운데 1 → 0", `${drops.length} 번`],
    [
      "add 마다 distinct + 1 이면",
      `${adds.length} − ${drops.length} = ${adds.length - drops.length}`,
    ],
    ["실행한 답", String(broken)],
  ];
  const w = Math.max(...rows.map(([a]) => width(a))) + 3;
  return ["```text", ...rows.map(([a, b]) => `${pad(a, w)}${b}`), "```"].join(
    "\n",
  );
}

/* ───────── 비용 계산 ───────── */

function perfDerive(): string {
  const t = trace(A5, Q5);
  const steps = walkSteps();
  const lines = t.runs.map((run) => {
    const ids = steps
      .filter((s) => s.kind === "move" && s.run.q.i === run.q.i)
      .map((s) => s.id);
    const span =
      ids.length === 0
        ? "—"
        : ids.length === 1
          ? ids[0]
          : `${ids[0]}~${ids.at(-1)}`;
    return `${pad(qv(run.q), 9)} ${pad(span as string, 8)} 옮긴 칸 ${run.moves.length}`;
  });
  const total = t.runs.reduce((s, r) => s + r.moves.length, 0);
  return [
    "```text",
    ...lines,
    `${" ".repeat(18)}└ 합 ${total} 칸 = 셈 연산 ${total} 번`,
    "```",
  ].join("\n");
}

function perfTotal(): string {
  const c = taskCounts();
  const sortOps = N_TASK * Math.ceil(Math.log2(N_TASK));
  return [
    md(
      ["항", "n = q = 100,000 에서", "센 방법"],
      [
        ["질의 정렬", `${num(sortOps)} 번 비교`, "q⌈log₂ q⌉ 로 낸 어림"],
        [
          "창 이동",
          `셈 연산 ${num(c.block.total)} 번`,
          "정본이 정렬한 차례에서 실측",
        ],
        ["답 적기", `${num(N_TASK)} 번`, "질의마다 한 번"],
      ],
    ),
    "",
    `창 이동이 정렬 어림의 ${(c.block.total / sortOps).toFixed(1)} 배입니다. 창 이동을 초당 1 억 번으로 잡으면 ${seconds(c.block.total)} 입니다.`,
  ].join("\n");
}

function perfWorstSample(): string {
  const B = taskCounts().B;
  const w = worstInput(N_TASK, N_TASK, B);
  const order = blockOrder(w, B);
  const firstOfBlock = (b: number) =>
    order.findIndex((q) => Math.floor(q.l / B) === b);
  const b1 = firstOfBlock(1);
  const pick = [0, 1, 2, 3, b1 - 1, b1, b1 + 1];
  const lines = pick.map((k) => {
    const q = order[k] as Tagged;
    return `  차례 ${pad(num(k + 1), 5)}  블록 ${Math.floor(q.l / B)}   [${num(q.l)}, ${num(q.r)}]`;
  });
  return [
    "```text",
    `B = ${B} 일 때 정렬한 차례의 앞부분과 블록 0 → 1 이 바뀌는 자리`,
    ...lines.slice(0, 4),
    "  …",
    ...lines.slice(4),
    "```",
  ].join("\n");
}

function perfWorst(): string {
  const c = taskCounts();
  const B = c.B;
  const w = moves(
    orderOf(new Array<number>(N_TASK).fill(0), worstInput(N_TASK, N_TASK, B))
      .order,
  );
  const b = bound(N_TASK, N_TASK, B);
  return [
    md(
      ["입력", "curL", "curR", "합", "초당 1 억 번 기준"],
      [
        [
          "무작위(시드 20260930)",
          num(c.block.left),
          num(c.block.right),
          num(c.block.total),
          seconds(c.block.total),
        ],
        [
          "최악 입력",
          num(w.left),
          num(w.right),
          num(w.total),
          seconds(w.total),
        ],
        ["상한 식", num(b.left), num(b.right), num(b.total), seconds(b.total)],
      ],
      [1, 2, 3],
    ),
    "",
    `최악 입력의 차례는 정본이 정렬한 그대로이고, 합이 상한 식의 ${((w.total / b.total) * 100).toFixed(1)} % 입니다.`,
  ].join("\n");
}

/* ───────── 스스로 점검하기 ───────── */

function selfcheckB1(): string {
  const b1 = bound(N_TASK, N_TASK, 1);
  const b316 = bound(N_TASK, N_TASK, taskCounts().B);
  const r1 = moves(blockOrder(taskInput().queries, 1));
  const rows: [string, string, string][] = [
    [
      "B = 316",
      "상한",
      `${num(b316.left)} + ${num(b316.right)} = ${num(b316.total)}`,
    ],
    ["B = 1", "상한", `${num(b1.left)} + ${num(b1.right)} = ${num(b1.total)}`],
    ["B = 1", "무작위 입력 실측", `${num(r1.total)} (${seconds(r1.total)})`],
  ];
  const w1 = Math.max(...rows.map(([a]) => width(a))) + 3;
  const w2 = Math.max(...rows.map(([, b]) => width(b))) + 3;
  return [
    "```text",
    ...rows.map(([a, b, c]) => `${pad(a, w1)}${pad(b, w2)}${c}`),
    "```",
  ].join("\n");
}

/** 블록 원문 — 펜스 블록은 펜스째 낸다. 원고를 채울 때 쓴다. */
export const RAW: Record<string, () => string> = {
  /** `concept` — 질의 다섯의 블록 번호와 처리 차례. */
  "concept-order": conceptOrder,
  /** `deep.origin` ② — 가장 단순한 방법을 과제 규모에서 수치로 반박한다. */
  "origin-naive": originNaive,
  /** `deep.origin` ③ — 겹치는 두 질의에서 새로 세기와 창 이어받기. */
  "origin-reuse": originReuse,
  /** `deep.origin` ④ — 같은 질의 다섯을 두 순서로. */
  "origin-two-orders": originTwoOrders,
  /** `deep.origin` ⑤ — 한 끝만 보는 두 정렬. */
  "origin-candidates": originCandidates,
  /** `deep.origin` ⑤ — 앞자리가 순서를 정하는 이웃. */
  "origin-lexi": originLexi,
  /** `deep.origin` ⑤ — 앞자리를 묶는다. */
  "origin-group": originGroup,
  /** `deep.origin` ⑤ — 블록 순서와 두 후보. */
  "origin-block16": originBlock16,
  /** `deep.build` 개념 (c) — Q3 하나를 읽는다. */
  "build-read-one": buildReadOne,
  /** `deep.build` 개념 (d) — 이웃한 두 질의. */
  "build-neighbors": buildNeighbors,
  /** `deep.build` 개념 (e) — 제곱근 분할과 블록 순서. */
  "build-vs-sqrt": buildVsSqrt,
  /** `deep.build` 1단계 — 정렬한 차례. */
  "build-sort": buildSort,
  /** `deep.build` 2단계 — 상태의 크기. */
  "build-state": buildState,
  /** `deep.build` 3단계 — 겹치지 않는 두 질의 사이. */
  "build-disjoint": buildDisjoint,
  /** `deep.build` 4단계 — 답을 원래 자리에. */
  "build-answers": buildAnswers,
  /** `deep.build` 설계 선택 — 열여섯 칸에서 B 다섯. */
  "build-sweep16": buildSweep16,
  /** `deep.build` 설계 선택 — 과제 규모에서 B 여섯. */
  "build-sweep-task": buildSweepTask,
  /** `deep.walk` 도입 — 전개 입력. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 원래 자리를 붙인 질의. */
  "walk-tag": walkTag,
  /** `deep.walk` 2 — 배열 길이마다 블록 크기. */
  "walk-block": walkBlock,
  /** `deep.walk` 3 — 정렬 전후. */
  "walk-sorted": walkSorted,
  /** `deep.walk` 4 — distinct 가 바뀌는 자리와 안 바뀌는 자리. */
  "walk-edges": walkEdges,
  /** `deep.walk.pause` — Set 으로 좁히면. */
  "pause-set-shrink": pauseSetShrink,
  /** `deep.walk.pause` — Set 판의 답. */
  "pause-set-answers": pauseSetAnswers,
  /** `deep.walk` 5 — T1~T16. */
  "walk-trace": walkTrace,
  /** `deep.walk` 5 — 갈래 피복. */
  "walk-branches": walkBranches,
  /** `deep.walk.pause` — 좁히기를 먼저 둔 코드의 답. */
  "pause-order-answers": pauseOrderAnswers,
  /** `deep.walk.pause` — 창이 겹치지 않을 때 L− 직후의 count. */
  "pause-order-cross": pauseOrderCross,
  /** `deep.walk.final` — 전체 코드의 호출 셋. */
  "final-calls": finalCalls,
  /** `related` — 두 비용이 B 에 대해 반대로 움직인다. */
  "related-balance": relatedBalance,
  /** `deep.math` ② — 정렬 키 검산. */
  "math-check": mathCheck,
  /** `deep.math` ③ — 왼쪽 끝의 한계를 이웃마다. */
  "math-left": mathLeft,
  /** `deep.math` ② — 상한 식 검산. */
  "math-check-bound": mathCheckBound,
  /** `deep.math` — 식을 옮긴 코드. */
  "math-code": mathCode,
  /** `deep.math` ④ — 과제 규모의 계수. */
  "math-scale": mathScale,
  /** `invariant` ② — 같은 창에 다른 경로로. */
  "invariant-paths": invariantPaths,
  /** `invariant` ② — 경계 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — `if (next === 1)` 을 지운 코드. */
  "mutant-add": mutantAdd,
  /** `invariant` ③ — Q0 의 부푼 값을 센다. */
  "mutant-add-why": mutantAddWhy,
  /** `perf.derive` — T# 별 이동. */
  "perf-derive": perfDerive,
  /** `perf.derive` — 과제 규모의 총식. */
  "perf-total": perfTotal,
  /** `perf.worst` — 최악 입력의 모양. */
  "perf-worst-sample": perfWorstSample,
  /** `perf.worst` — 최악 입력의 실측. */
  "perf-worst": perfWorst,
  /** `selfcheck` 답 — B = 1. */
  "selfcheck-b1": selfcheckB1,
};

/** 펜스 블록이면 펜스 안쪽만 — `check-proof` 는 펜스 안의 내용을 대조한다. */
const unfence = (f: () => string) => (): string => {
  const s = f();
  const m = /^```\w*\n([\s\S]*)\n```$/.exec(s);
  return m?.[1] ?? s;
};

export const PROOFS: Record<string, () => string> = Object.fromEntries(
  Object.entries(RAW).map(([id, f]) => [id, unfence(f)]),
);
