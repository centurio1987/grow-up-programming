/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.** 걸음과 칸 값은
 * 그림 사이드카(`-guide.fig.tsx`)가 정본 소스에 기록 줄만 끼워 만든 사본의 기록에서 받고, 규모를 재는
 * 자리는 접근 수만 세는 가벼운 판을 쓴다. 값을 적어 넣으면 대조가 자기 자신과의 대조가 된다.
 *
 *   bun run ../../../../tools/check-proof.ts fenwickRangeSum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  A as ALT_A,
  B as ALT_B,
  queryAt as altQueryAt,
  updateAt as altUpdateAt,
  workload as altWorkload,
  cases as benchCases,
} from "./fenwickRangeSum-guide.alt.ts";
import {
  addChain,
  bigArray,
  bin,
  blockTable,
  coverOf,
  coverSum,
  ERASE_R,
  type Event,
  fenwickCount,
  INVARIANT_MOMENT,
  lowbit,
  N_MAX,
  num,
  popcount,
  prefixChain,
  prefixFormula,
  prefixTable,
  READ_CELL,
  range,
  SCALE_B,
  SHAPE,
  sameAnswers,
  scaleNumbers,
  scaleOps,
  scanEach,
  scanFormula,
  seconds,
  span,
  sumOf,
  total,
  trace,
  treeByDef,
  values,
  WALK,
  WALK_OPS,
  walkSteps,
} from "./fenwickRangeSum-guide.fig.tsx";
import {
  type FenwickOp,
  fenwickRangeSum,
} from "./fenwickRangeSum-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 마크다운 표. `align` 의 `r` 은 오른쪽 맞춤 열이다. */
function table(head: string[], align: string, rows: string[][]): string {
  const rule = head.map((_, i) => (align[i] === "r" ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 고정폭 화면의 폭 — 한글 한 글자는 두 칸을 먹는다. */
const cellWidth = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿가-힯一-鿿]/.test(c) ? 2 : 1), 0);

/** 소수 한 자리, 천 단위 구분. */
const f1 = (x: number): string =>
  x.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** 표와 그 아래 문장 — 닫는 마커 `<!--/proof-->` 까지 대조한다. */
const withNote = (t: string, ...notes: string[]): string =>
  [t, "", ...notes].join("\n");

const opName = (op: FenwickOp): string =>
  op.type === "query" ? `질의 ${span(op.l, op.r)}` : `갱신 i=${op.i} v=${op.v}`;

const queryNames = (ops: readonly FenwickOp[]): string[] =>
  ops.filter((o) => o.type === "query").map(opName);

const opsText = (ops: readonly FenwickOp[]): string =>
  ops.length === 0 ? "없음" : ops.map(opName).join(" · ");

type Call = { r: number; reads: number[]; sum: number };

/** 한 호출이 읽은 칸 — 기록의 `prefix` 뒤에 이어지는 `read` 들. */
function prefixCalls(events: readonly Event[]): Call[] {
  const out: Call[] = [];
  for (const e of events) {
    if (e.kind === "prefix") out.push({ r: e.r, reads: [], sum: 0 });
    if (e.kind === "read") {
      const last = out.at(-1);
      if (last) {
        last.reads.push(e.k);
        last.sum = e.sum;
      }
    }
  }
  return out;
}

/** 채우기가 끝난 뒤의 트리 — 기록의 마지막 `own`/`give`. */
function builtTree(A: readonly number[]): number[] {
  const t = trace(A, []);
  let tree: number[] = [];
  for (const e of t.events) {
    if (e.kind === "own" || e.kind === "give") tree = e.tree;
  }
  return tree;
}

const cellsText = (ks: readonly number[]): string =>
  ks.length === 0 ? "없음" : ks.map((k) => `칸 ${k}`).join(" · ");

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  fenwickRangeSum(A: number[], ops: FenwickOp[]): number[];
}

const REF = new URL("./fenwickRangeSum-guide.ref.ts", import.meta.url).pathname;

/** 넘겨주는 바퀴를 내림차순으로 돌린 사본. 순서만 다르다. */
const descending = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let i = 1; i <= N; i\+\+\) \{/,
    "for (let i = N; i >= 1; i--) {",
  ],
});

/** 논리 배열을 함께 고치지 않는 사본. 변화량을 옛 값에서 만드는 것은 그대로다. */
const noSync = await loadMutant<Impl>(REF, {
  drop: /arr\[op\.i\] = op\.v;/,
});

/** 덮어쓸 값을 변화량으로 바꾸지 않고 그대로 더하는 사본. */
const rawValue = await loadMutant<Impl>(REF, {
  swap: [
    /const delta = op\.v - \(arr\[op\.i\] \?\? 0\);/,
    "const delta = op.v;",
  ],
});

/** 담당 칸을 따라가는 걸음을 1 로 바꾼 사본. 불변식을 지키던 그 줄이다. */
const stepOne = await loadMutant<Impl>(REF, {
  swap: [/k \+= lowbit\(k\)/, "k += 1"],
});

/**
 * 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 다만 `check-proof` 가 변이를 **중화한 채**
 * 부르는 실행에서는 변이 모듈이 정본 그 자체라 이 검사가 무조건 터진다 — 중화 여부를 값에서 알아내
 * (변이 모듈의 함수가 정본과 같은 객체인가) 그때만 건너뛴다.
 */
function assertBreaks(
  mutated: Impl,
  rows: { bare: string; mutated: string }[],
): void {
  if (mutated.fenwickRangeSum === fenwickRangeSum) return;
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 정본과 변이를 같은 연산 목록에 걸고 답을 나란히 적는다. */
function compareRows(
  A: readonly number[],
  ops: readonly FenwickOp[],
  mutated: Impl,
): { name: string; bare: string; mutated: string }[] {
  const good = fenwickRangeSum(
    [...A],
    ops.map((o) => ({ ...o })),
  );
  const bad = mutated.fenwickRangeSum(
    [...A],
    ops.map((o) => ({ ...o })),
  );
  return queryNames(ops).map((name, i) => ({
    name,
    bare: String(good[i] ?? "—"),
    mutated: String(bad[i] ?? "—"),
  }));
}

const verdict = (r: { bare: string; mutated: string }): string =>
  r.bare === r.mutated ? "같다" : "어긋난다";

/* ────────────────────── 1,024 칸 작업 목록 ────────────────────── */

/**
 * 전개 입력(다섯 칸)은 묶음 크기를 갈라 보기에 너무 작다. 그래서 `purpose.alt` 와 **같은 생성식**의 1,024 칸
 * 입력을 쓴다 — 생성식은 `.alt.ts` 에 있고 여기서 그대로 가져온다. 난수를 쓰지 않으므로 시드가 없다.
 */
function altOps(q: number, u: number): FenwickOp[] {
  return altWorkload(q, u).map((op): FenwickOp => {
    if (op[0] === "q") {
      const [l, r] = altQueryAt(op[1]);
      return { type: "query", l, r };
    }
    const [i, v] = altUpdateAt(op[1]);
    return { type: "update", i, v };
  });
}

/** 질의 512 개와 갱신 512 개를 고르게 섞은 목록. 「아이디어를 떠올리는 과정」과 설계 선택 표가 같이 쓴다. */
const MIXED: FenwickOp[] = altOps(512, 512);

/** 과제 규모에서 연산 하나의 최악 — 채우기 · 질의 · 갱신. 전수로 찾되 트리는 베끼지 않는다. */
function worstPerOp() {
  const n = N_MAX;
  let handOver = 0;
  for (let i = 1; i <= n; i++) if (i + lowbit(i) <= n) handOver++;
  const build = 2 * n + 3 * handOver;
  // 뒤에서부터 훑으며 `popcount(t)` 의 최댓값을 들고 오면 짝을 전수로 안 봐도 된다.
  let bestQuery = 0;
  let bestPair: [number, number] = [0, 0];
  let tailBest = 0;
  let tailAt = n;
  for (let l = n - 1; l >= 0; l--) {
    if (popcount(l + 1) > tailBest) {
      tailBest = popcount(l + 1);
      tailAt = l + 1;
    }
    if (popcount(l) + tailBest > bestQuery) {
      bestQuery = popcount(l) + tailBest;
      bestPair = [l, tailAt - 1];
    }
  }
  let bestUpdate = 0;
  let bestIndex = 0;
  for (let i = 0; i < n; i++) {
    const len = addChain(i + 1, n).length;
    if (len > bestUpdate) {
      bestUpdate = len;
      bestIndex = i;
    }
  }
  const updateCost = 2 + 2 * bestUpdate;
  const perOp = Math.max(bestQuery, updateCost);
  // 셈하는 판으로 한 번씩 재어 식과 맞댄다.
  const probe = fenwickCount(bigArray(n), [
    { type: "query", l: bestPair[0], r: bestPair[1] },
    { type: "update", i: bestIndex, v: 1 },
  ]);
  if (
    probe.build !== build ||
    probe.query !== bestQuery ||
    probe.update !== updateCost
  ) {
    throw new Error("셈하는 판의 값이 식과 다르다");
  }
  return {
    handOver,
    build,
    bestQuery,
    bestPair,
    bestUpdate,
    bestIndex,
    updateCost,
    perOp,
  };
}

/** 모든 `(l, r)` 짝에서 펜윅 트리의 질의 하나가 읽는 칸의 최대와 그 짝. */
function fenwickMostRead(N: number): { most: number; pair: [number, number] } {
  let most = 0;
  let pair: [number, number] = [0, 0];
  let tail = 0;
  let tailAt = N;
  for (let l = N - 1; l >= 0; l--) {
    if (popcount(l + 1) > tail) {
      tail = popcount(l + 1);
      tailAt = l + 1;
    }
    if (popcount(l) + tail > most) {
      most = popcount(l) + tail;
      pair = [l, tailAt - 1];
    }
  }
  return { most, pair };
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 질의 하나가 두 앞부분 합의 차로 답해지는가. */
  "concept-queries": () => {
    const qs: FenwickOp[] = [
      { type: "query", l: 0, r: 4 },
      { type: "query", l: 2, r: 3 },
      { type: "query", l: 1, r: 3 },
    ];
    const t = trace(WALK, qs);
    const calls = prefixCalls(t.events);
    const rows = qs.map((q, n) => {
      const op = q as Extract<FenwickOp, { type: "query" }>;
      const right = calls[2 * n];
      const left = calls[2 * n + 1];
      if (!right || !left) throw new Error("호출 기록이 모자라다");
      return [
        span(op.l, op.r),
        `앞 ${op.r + 1} 개 − 앞 ${op.l} 개`,
        cellsText(right.reads),
        cellsText(left.reads),
        `${right.sum} − ${left.sum}`,
        String(t.result[n]),
      ];
    });
    return table(
      [
        "질의",
        "계산",
        "오른쪽 호출이 읽는 칸",
        "왼쪽 호출이 읽는 칸",
        "뺄셈",
        "답",
      ],
      "llllrr",
      rows,
    );
  },

  /** `concept` — 갱신 하나가 고치는 칸을 두 구조에서 센다. */
  "concept-update": () => {
    const op = WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>;
    const N = WALK.length;
    const t = trace(WALK, [op]);
    const before = builtTree(WALK);
    const adds = t.events.filter((e) => e.kind === "add") as Extract<
      Event,
      { kind: "add" }
    >[];
    const after = (adds.at(-1) as Extract<Event, { kind: "add" }>).tree;
    const fenCover = range(1, N).filter((k) => {
      const [a, b] = coverOf(k);
      return a <= op.i && op.i <= b;
    }).length;
    const fenChanged = range(1, N).filter((k) => before[k] !== after[k]).length;
    // 누적합 배열 P[k] = 앞 k 개의 합. 인덱스 i 는 k > i 인 칸이 덮는다.
    const P = (A: readonly number[]) =>
      range(0, N).map((k) => sumOf(A, 0, k - 1));
    const changedA = [...WALK];
    changedA[op.i] = op.v;
    const pBefore = P(WALK);
    const pAfter = P(changedA);
    const preCover = range(0, N).filter((k) => k > op.i).length;
    const preChanged = range(0, N).filter(
      (k) => pBefore[k] !== pAfter[k],
    ).length;
    return withNote(
      table(
        ["구조", "칸 수", `인덱스 ${op.i} 를 덮는 칸`, "값이 바뀐 칸"],
        "lrrr",
        [
          ["펜윅 트리", String(N), String(fenCover), String(fenChanged)],
          ["누적합 배열", String(N + 1), String(preCover), String(preChanged)],
        ],
      ),
      `A[${op.i}] 를 ${WALK[op.i]} 에서 ${op.v} 으로 고쳤습니다. 펜윅 트리의 칸 0 은 비워 두는 칸이라 세지 않았습니다.`,
    );
  },

  /** `prereq` — 이 글의 범위가 어디까지인가. */
  "prereq-scope": () => {
    const whole = fenwickRangeSum([...WALK], [{ type: "query", l: 0, r: 4 }]);
    const op = WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>;
    const after = fenwickRangeSum(
      [...WALK],
      [{ ...op }, { type: "query", l: 0, r: 4 }],
    );
    return table(
      ["물음", "답", "펜윅 트리", "누적합 배열", "세그먼트 트리"],
      "lrlll",
      [
        ["구간 [0,4] 의 합", String(whole[0]), "답한다", "답한다", "답한다"],
        [
          `A[${op.i}] 를 ${op.v} 으로 고친 뒤 [0,4] 의 합`,
          String(after[0]),
          "답한다",
          "뒤쪽 칸을 전부 고쳐야 답한다",
          "답한다",
        ],
        [
          "구간 [0,4] 의 최솟값",
          String(Math.min(...WALK)),
          "답하지 못한다",
          "답하지 못한다",
          "답한다",
        ],
      ],
    );
  },

  /** `deep.origin` ② — 직접 더하기가 과제 규모에서 몇 번인가. */
  "cost-scan": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const c = scanEach(bigArray(n), scaleOps(n, n));
      const f = scanFormula(n, n);
      if (total(c) !== f) throw new Error("직접 더하기의 실측이 식과 다르다");
      rows.push([num(n), num(total(c)), num(f), seconds(total(c))]);
    }
    const f = scanFormula(N_MAX, N_MAX);
    rows.push([num(N_MAX), "(실행하지 않음)", num(f), seconds(f)]);
    return table(
      ["N = Q", "배열 접근(실측)", "(Q/2)(N−2) + Q/2", "초당 1 억 번 기준"],
      "rrrr",
      rows,
    );
  },

  /** `deep.origin` ③ — 누적합 표가 과제 규모에서 몇 번인가. */
  "cost-prefix": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const c = prefixTable(bigArray(n), scaleOps(n, n));
      const f = prefixFormula(n, n);
      if (c.build !== f.build || c.query !== f.query || c.update !== f.update) {
        throw new Error("누적합 표의 실측이 식과 다르다");
      }
      rows.push([
        num(n),
        num(c.build),
        num(c.query),
        num(c.update),
        num(total(c)),
        seconds(total(c)),
      ]);
    }
    const f = prefixFormula(N_MAX, N_MAX);
    const sum = f.build + f.query + f.update;
    rows.push([
      `${num(N_MAX)} (식)`,
      num(f.build),
      num(f.query),
      num(f.update),
      num(sum),
      seconds(sum),
    ]);
    return withNote(
      table(
        ["N = Q", "미리 만들기", "질의", "갱신", "합", "초당 1 억 번 기준"],
        "rrrrrr",
        rows,
      ),
      "미리 만들기는 칸마다 3 번, 질의는 2 번, 갱신 i 는 2 + 2(N − i) 번입니다. 100,000 줄은 이 식이 위 두 줄의 실행과 같은 것을 확인하고 식으로 셌습니다.",
    );
  },

  /** `deep.origin` ④ — 같은 작업 목록에서 두 방식의 실제 계수. */
  "mixed-load": () => {
    const bare = scanEach(ALT_A, MIXED);
    const tab = prefixTable(ALT_A, MIXED);
    sameAnswers(bare, tab);
    return withNote(
      table(
        ["방식", "미리 만들기", "질의 512 개", "갱신 512 개", "합", "추가 칸"],
        "lrrrrr",
        [
          [
            "직접 더하기",
            num(bare.build),
            num(bare.query),
            num(bare.update),
            num(total(bare)),
            num(bare.cells),
          ],
          [
            "누적합 표",
            num(tab.build),
            num(tab.query),
            num(tab.update),
            num(total(tab)),
            num(tab.cells),
          ],
        ],
      ),
      `두 방식의 답은 같습니다. 질의는 ${num(bare.query)} 에서 ${num(tab.query)} 로 줄고, 갱신은 ${num(bare.update)} 에서 ${num(tab.update)} 로 늘었습니다.`,
    );
  },

  /** `deep.origin` ⑤ — 고정 길이 묶음이 작은 입력의 질의 하나를 어떻게 답하는가. */
  "block-small": () => {
    const B = 2;
    const l = 1;
    const r = 3;
    const N = WALK.length;
    const sums = range(0, Math.ceil(N / B) - 1).map((j) =>
      sumOf(WALK, j * B, Math.min(N - 1, j * B + B - 1)),
    );
    const rows: string[][] = [];
    const parts: number[] = [];
    let k = l;
    while (k <= r) {
      if (k % B === 0 && k + B - 1 <= r) {
        const j = k / B;
        rows.push([
          `인덱스 ${k} · ${k + B - 1}`,
          `묶음 ${j} ${span(k, k + B - 1)} 이 질의 안에 통째로 든다`,
          `묶음 합 ${sums[j]}`,
        ]);
        parts.push(sums[j] as number);
        k += B;
      } else {
        rows.push([
          `인덱스 ${k}`,
          `묶음 ${Math.floor(k / B)} 에 절반만 걸친다`,
          `A[${k}] = ${WALK[k]}`,
        ]);
        parts.push(WALK[k] as number);
        k++;
      }
    }
    const s = parts.reduce((x, y) => x + y, 0);
    const want = fenwickRangeSum([...WALK], [{ type: "query", l, r }])[0];
    if (s !== want) throw new Error("묶음 셈이 정본의 답과 다르다");
    const cut = range(0, sums.length - 1)
      .map(
        (j) =>
          `묶음 ${j} ${span(j * B, Math.min(N - 1, j * B + B - 1))} = ${sums[j]}`,
      )
      .join(" · ");
    return withNote(
      table(["읽은 자리", "까닭", "읽은 값"], "lll", rows),
      `B = ${B} 로 끊은 묶음은 ${cut} 입니다. 질의 ${span(l, r)} 의 답은 ${parts.join(" + ")} = ${s} 이고, 정본의 답도 ${want} 입니다.`,
    );
  },

  /** `deep.origin` ⑤ — 묶음 길이 하나로는 질의 하나의 최악을 얼마까지 줄이는가. */
  "block-worst": () => {
    const rows: string[][] = [];
    for (const N of [1_024, N_MAX]) {
      // 묶음 크기 B 의 질의 하나의 최악 — 양 끝에 남는 칸 B − 1 개씩과 사이의 온전한 묶음.
      const worstOf = (B: number): number => {
        const full = Math.max(0, Math.floor((N - 2 * (B - 1)) / B));
        return 2 * (B - 1) + full;
      };
      let bestB = 1;
      for (let B = 1; B <= N; B++) if (worstOf(B) < worstOf(bestB)) bestB = B;
      if (N === 1_024) {
        // 식이 실측 최댓값인지 — 모든 (l, r) 짝을 실행해 잰다.
        let most = 0;
        for (let l = 0; l < N; l++) {
          for (let r = l; r < N; r++) {
            let c = 0;
            let k = l;
            while (k <= r) {
              c++;
              if (k % bestB === 0 && k + bestB - 1 <= r) k += bestB;
              else k++;
            }
            if (c > most) most = c;
          }
        }
        if (most !== worstOf(bestB)) {
          throw new Error(
            `묶음 최악의 식 ${worstOf(bestB)} 이 실측 ${most} 과 다르다`,
          );
        }
      }
      rows.push([
        num(N),
        String(bestB),
        num(worstOf(bestB)),
        String(fenwickMostRead(N).most),
      ]);
    }
    return withNote(
      table(
        [
          "N",
          "가장 좋은 묶음 크기 B",
          "고정 길이 묶음 질의 하나의 최악",
          "펜윅 트리 질의 하나의 최악",
        ],
        "rrrr",
        rows,
      ),
      "고정 길이 묶음의 최악은 양 끝에 남는 칸 B − 1 개씩과 그 사이의 온전한 묶음 수를 더한 값이고, N = 1,024 에서는 모든 (l, r) 짝을 실행해 잰 최댓값과 같습니다. 펜윅 트리 쪽은 모든 (l, r) 짝에서 잰 최댓값입니다.",
    );
  },

  /** `deep.origin` — 과제 규모에서 지금까지의 방법. */
  "origin-scale": () => {
    const n = scaleNumbers();
    const pre = n.pre;
    const half = N_MAX / 2;
    return withNote(
      table(
        [
          "방법",
          "미리 만들기",
          "질의",
          "갱신",
          "합",
          "초당 1 억 번 기준",
          "센 방법",
        ],
        "lrrrrrl",
        [
          [
            "직접 더하기",
            "0",
            num(half * (N_MAX - 2)),
            num(half),
            num(n.scan),
            seconds(n.scan),
            "식",
          ],
          [
            "누적합 표",
            num(pre.build),
            num(pre.query),
            num(pre.update),
            num(n.preTotal),
            seconds(n.preTotal),
            "식",
          ],
          [
            `제곱근 분할 B=${SCALE_B}`,
            num(n.block.build),
            num(n.block.query),
            num(n.block.update),
            num(total(n.block)),
            seconds(total(n.block)),
            "실행",
          ],
          [
            "펜윅 트리",
            num(n.fen.build),
            num(n.fen.query),
            num(n.fen.update),
            num(total(n.fen)),
            seconds(total(n.fen)),
            "실행",
          ],
        ],
      ),
      `N = Q = ${num(N_MAX)} 이고 갱신과 질의가 ${num(half)} 개씩입니다. 「식」 줄은 같은 식이 N = Q = 1,000 · 10,000 에서 실행한 값과 같은 것을 확인하고 식으로 셌습니다.`,
    );
  },

  /** `deep.build` 개념 (c) — 칸 하나를 번호에서 값까지 읽는다. */
  "node-read": () => {
    const k = READ_CELL;
    const low = lowbit(k);
    const [a, b] = coverOf(k);
    const tree = builtTree(SHAPE);
    const got = tree[k] as number;
    if (got !== coverSum(SHAPE, k)) throw new Error("칸 값이 정의와 다르다");
    return table(["읽는 것", "계산", "결과"], "lll", [
      ["칸 번호", "—", String(k)],
      ["이진 표기", "—", bin(k)],
      ["최하위 1 비트", `${k} & −${k}`, String(low)],
      ["맡는 구간", `[${k} − ${low}, ${k} − 1]`, span(a, b)],
      ["적힌 값", SHAPE.slice(a, b + 1).join(" + "), String(got)],
    ]);
  },

  /** `deep.build` 개념 (d) — 최하위 1 비트가 같은 칸끼리는 겹치지 않는다. */
  "cell-groups": () => {
    const N = SHAPE.length;
    const lengths = [...new Set(range(1, N).map(lowbit))].sort((x, y) => x - y);
    const rows = lengths.map((len) => {
      const ks = range(1, N).filter((k) => lowbit(k) === len);
      const seen = new Map<number, number>();
      for (const k of ks) {
        const [a, b] = coverOf(k);
        for (let i = a; i <= b; i++) seen.set(i, (seen.get(i) ?? 0) + 1);
      }
      const twice = [...seen.values()].filter((c) => c > 1).length;
      return [
        String(len),
        ks.map((k) => `칸 ${k}`).join(" · "),
        String(ks.length),
        String(seen.size),
        String(twice),
      ];
    });
    return table(
      ["최하위 1 비트", "칸", "칸 수", "맡은 인덱스 수", "두 번 맡은 인덱스"],
      "rlrrr",
      rows,
    );
  },

  /** `deep.build` 개념 (d) — 칸의 구간은 자기 한 칸과 아래 칸들의 구간을 이어 붙인 것이다. */
  "cell-children": () => {
    const N = SHAPE.length;
    const children = (j: number) =>
      range(1, j - 1).filter((i) => i + lowbit(i) === j);
    let ok = 0;
    for (const j of range(1, N)) {
      const [a, b] = coverOf(j);
      const count = new Map<number, number>([[j - 1, 1]]);
      for (const i of children(j)) {
        const [x, y] = coverOf(i);
        for (let t = x; t <= y; t++) count.set(t, (count.get(t) ?? 0) + 1);
      }
      const want = range(a, b);
      const exact =
        count.size === want.length && want.every((t) => count.get(t) === 1);
      if (exact) ok++;
    }
    const rows = [4, 8, 12, 16].map((j) => {
      const kids = children(j);
      return [
        `칸 ${j}`,
        span(...coverOf(j)),
        kids.length === 0 ? "없음" : kids.map((i) => `칸 ${i}`).join(" · "),
        [...kids.map((i) => span(...coverOf(i))), span(j - 1, j - 1)].join(
          " + ",
        ),
      ];
    });
    return withNote(
      table(
        [
          "칸 j",
          "맡는 구간",
          "위 칸이 칸 j 인 칸",
          "그 칸들의 구간 + 자기 한 칸",
        ],
        "llll",
        rows,
      ),
      `칸 ${N} 개 가운데 ${ok} 개에서, 위 칸이 자기인 칸들의 구간과 자기 한 칸을 이어 붙이면 겹침도 빈칸도 없이 자기 구간이 됩니다. 칸 i 의 위 칸은 i + (i 의 최하위 1 비트) 입니다.`,
    );
  },

  /** `deep.build` 개념 (e) — 헷갈리기 쉬운 두 모양과의 비교. */
  "shape-compare": () => {
    const rows: string[][] = [];
    for (const N of [16, 1_024]) {
      const B = Math.floor(Math.sqrt(N));
      // 누적합 배열 — P[k] 가 앞 k 개를 덮는다. 인덱스 0 은 k = 1 … N 이 전부 덮는다.
      let preCover = 0;
      for (let i = 0; i < N; i++) {
        preCover = Math.max(preCover, range(1, N).filter((k) => k > i).length);
      }
      rows.push(["누적합 배열", num(N), num(N + 1), num(preCover), "1"]);
      // 고정 길이 묶음 — 인덱스 하나를 묶음 하나가 덮고, 앞 r 개는 묶음 ⌊r/B⌋ 개와 남는 칸 r mod B 개다.
      let blockRead = 0;
      for (let r = 1; r <= N; r++) {
        blockRead = Math.max(blockRead, Math.floor(r / B) + (r % B));
      }
      rows.push([
        `고정 길이 묶음 B=${B}`,
        num(N),
        num(Math.ceil(N / B)),
        "1",
        String(blockRead),
      ]);
      let cover = 0;
      for (let i = 0; i < N; i++) {
        cover = Math.max(cover, addChain(i + 1, N).length);
      }
      let read = 0;
      for (let r = 1; r <= N; r++) read = Math.max(read, prefixChain(r).length);
      rows.push(["펜윅 트리", num(N), num(N), String(cover), String(read)]);
    }
    return withNote(
      table(
        [
          "구조",
          "N",
          "적어 둔 칸",
          "인덱스 하나를 덮는 칸(최대)",
          "앞부분 합 하나에 읽는 칸(최대)",
        ],
        "lrrrr",
        rows,
      ),
      "최대는 모든 인덱스와 모든 r 을 넣어 잰 값입니다. 고정 길이 묶음의 앞부분 합은 묶음 합과 남는 칸을 함께 읽은 수이고, 펜윅 트리의 칸 수에는 비워 두는 칸 0 을 넣지 않았습니다.",
    );
  },

  /** `deep.build` 1단계 — 전개 입력의 칸마다 번호 · 이진 표기 · 최하위 1 비트 · 맡는 구간. */
  "cell-check": () => {
    const rows = range(0, WALK.length).map((k) => {
      if (k === 0) return ["칸 0", bin(0, 3), "0", "없음", "비워 둔다"];
      const [a, b] = coverOf(k);
      return [
        `칸 ${k}`,
        bin(k, 3),
        String(lowbit(k)),
        span(a, b),
        values(WALK.slice(a, b + 1)),
      ];
    });
    return table(
      ["칸", "칸 번호의 이진 표기", "최하위 1 비트", "맡는 구간", "구간의 값"],
      "llrll",
      rows,
    );
  },

  /** `deep.build` 2단계 — 채우는 차례와 칸 값. */
  "build-order": () => {
    const t = trace(WALK, []);
    const N = WALK.length;
    const rows: string[][] = [];
    let tree: number[] = [];
    const cols = () => range(1, N).map((k) => String(tree[k]));
    for (const e of t.events) {
      if (e.kind === "own") {
        tree = e.tree;
        rows.push(["첫 바퀴", "칸마다 arr[k − 1] 을 넣는다", ...cols()]);
      } else if (e.kind === "give") {
        tree = e.tree;
        rows.push([
          `둘째 바퀴 i = ${e.i}`,
          `칸 ${e.i}${이가(e.i)} 칸 ${e.j} 에 ${e.tree[e.i]}${을를(e.tree[e.i] as number)} 넘긴다`,
          ...cols(),
        ]);
      } else if (e.kind === "skip") {
        rows.push([
          `둘째 바퀴 i = ${e.i}`,
          `위 칸 ${e.j}${이가(e.j)} ${N}${을를(N)} 넘어 넘기지 않는다`,
          ...cols(),
        ]);
      }
    }
    const def = treeByDef(WALK);
    const bad = range(1, N).filter((k) => tree[k] !== def[k]).length;
    return withNote(
      table(
        ["차례", "하는 일", ...range(1, N).map((k) => `칸 ${k}`)],
        `ll${"r".repeat(N)}`,
        rows,
      ),
      `채우기가 끝난 뒤 ${N} 칸을 정의(맡는 구간의 합)와 대조했고, 어긋난 칸은 ${bad} 개입니다.`,
    );
  },

  /** `deep.build` 3단계 — 앞 r 개의 합이 어느 칸들로 이어 붙는가. */
  "prefix-cases": () => {
    const N = WALK.length;
    const qs: FenwickOp[] = range(1, N).map((r) => ({
      type: "query",
      l: 0,
      r: r - 1,
    }));
    const t = trace(WALK, qs);
    const byR = new Map<number, Call>();
    for (const c of prefixCalls(t.events)) byR.set(c.r, c);
    const rows = range(0, N).map((r) => {
      const c = byR.get(r) as Call;
      const pieces = c.reads.map((k) => span(...coverOf(k)));
      return [
        String(r),
        bin(r, 3),
        cellsText(c.reads),
        pieces.length === 0 ? "없음" : pieces.join(" · "),
        String(c.sum),
        String(sumOf(WALK, 0, r - 1)),
      ];
    });
    return table(
      [
        "r",
        "r 의 이진 표기",
        "읽는 칸",
        "이어 붙인 구간",
        "합",
        "앞 r 개를 직접 더한 값",
      ],
      "rllllr",
      rows,
    );
  },

  /** `deep.build` 4단계 — 구간 합을 앞부분 합 둘의 차로. */
  "query-cases": () => {
    const qs: FenwickOp[] = [
      { type: "query", l: 0, r: 4 },
      { type: "query", l: 2, r: 3 },
      { type: "query", l: 2, r: 2 },
      { type: "query", l: 4, r: 4 },
      { type: "query", l: 1, r: 3 },
    ];
    const t = trace(WALK, qs);
    const calls = prefixCalls(t.events);
    const rows = qs.map((q, n) => {
      const op = q as Extract<FenwickOp, { type: "query" }>;
      const right = calls[2 * n] as Call;
      const left = calls[2 * n + 1] as Call;
      return [
        span(op.l, op.r),
        `prefix(${right.r}) = ${right.sum}`,
        `prefix(${left.r}) = ${left.sum}`,
        String(t.result[n]),
        String(sumOf(WALK, op.l, op.r)),
      ];
    });
    return table(
      ["질의", "오른쪽 호출", "왼쪽 호출", "답", "구간을 직접 더한 값"],
      "lllrr",
      rows,
    );
  },

  /** `deep.build` 5단계 — 갱신이 고치는 칸과 고치지 않는 칸. */
  "update-cells": () => {
    const op = WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>;
    const N = WALK.length;
    // 갱신 뒤 앞 r 개의 합을 r = 1 … N 까지 모두 묻는다(r = 0 은 왼쪽 호출에서 나온다).
    const asks: FenwickOp[] = range(1, N).map((r) => ({
      type: "query",
      l: 0,
      r: r - 1,
    }));
    const t = trace(WALK, [{ ...op }, ...asks]);
    const before = builtTree(WALK);
    const adds = t.events.filter((e) => e.kind === "add") as Extract<
      Event,
      { kind: "add" }
    >[];
    const after = (adds.at(-1) as Extract<Event, { kind: "add" }>).tree;
    const touched = new Set(adds.map((e) => e.k));
    const rows = range(1, N).map((k) => {
      const [a, b] = coverOf(k);
      const holds = a <= op.i && op.i <= b;
      if (holds !== touched.has(k)) {
        throw new Error("고친 칸이 인덱스를 품는 칸과 다르다");
      }
      return [
        `칸 ${k}`,
        span(a, b),
        holds ? "품는다" : "품지 않는다",
        String(before[k]),
        String(after[k]),
      ];
    });
    const changed = [...WALK];
    changed[op.i] = op.v;
    const rs = new Map<number, number>();
    for (const c of prefixCalls(t.events)) rs.set(c.r, c.sum);
    const okCount = range(0, N).filter(
      (r) => rs.get(r) === sumOf(changed, 0, r - 1),
    ).length;
    return withNote(
      table(
        ["칸", "맡는 구간", `인덱스 ${op.i}`, "갱신 전", "갱신 뒤"],
        "llrrr",
        rows,
      ),
      `갱신 뒤 앞 r 개의 합을 r = 0 부터 ${N} 까지 ${N + 1} 번 물었고, ${okCount} 번이 고친 배열을 직접 더한 값과 같습니다.`,
    );
  },

  /** `deep.build` 5단계 — `add` 가 지나는 칸이 인덱스를 품은 칸 전부인가. */
  "update-contain": () => {
    const N = SHAPE.length;
    let same = 0;
    const rows: string[][] = [];
    for (const i of range(0, N - 1)) {
      const t = trace(SHAPE, [{ type: "update", i, v: 0 }]);
      const visited = t.events
        .filter((e) => e.kind === "add")
        .map((e) => (e as Extract<Event, { kind: "add" }>).k);
      const holding = range(1, N).filter((k) => {
        const [a, b] = coverOf(k);
        return a <= i && i <= b;
      });
      if (JSON.stringify(visited) === JSON.stringify(holding)) same++;
      if ([0, 2, 5, 10, 15].includes(i)) {
        rows.push([
          String(i),
          bin(i + 1, 5),
          cellsText(visited),
          cellsText(holding),
        ]);
      }
    }
    return withNote(
      table(
        [
          "인덱스 i",
          "시작 칸 i + 1 의 이진 표기",
          "add 가 지나는 칸",
          "맡는 구간에 i 가 든 칸",
        ],
        "rlll",
        rows,
      ),
      `길이 ${N} 배열의 인덱스 ${N} 개 가운데 ${same} 개에서 두 목록이 같습니다.`,
    );
  },

  /** `deep.build` 설계 선택 — 고정 길이 묶음을 여러 크기로 두고 잰 총 접근 수. */
  "block-size": () => {
    const rows: string[][] = [];
    let best = { B: 0, sum: Number.POSITIVE_INFINITY };
    for (const B of [1, 2, 4, 8, 16, 32, 64, 256, 1024]) {
      const r = blockTable(ALT_A, MIXED, B);
      if (total(r) < best.sum) best = { B, sum: total(r) };
      rows.push([
        `고정 길이 묶음 B=${B}`,
        num(r.build),
        num(r.query),
        num(r.update),
        num(total(r)),
        num(r.cells),
      ]);
    }
    const f = fenwickCount(ALT_A, MIXED);
    sameAnswers(blockTable(ALT_A, MIXED, ALT_B), f);
    rows.push([
      "펜윅 트리",
      num(f.build),
      num(f.query),
      num(f.update),
      num(total(f)),
      num(f.cells),
    ]);
    return withNote(
      table(
        ["방법", "미리 만들기", "질의", "갱신", "합", "추가 칸"],
        "lrrrrr",
        rows,
      ),
      `고정 길이 묶음은 B=${best.B} 에서 합이 ${num(best.sum)} 로 가장 적고, 펜윅 트리는 ${num(total(f))} 입니다.`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 입력과 그 답. */
  "walk-input": () => {
    const want = fenwickRangeSum(
      [...WALK],
      WALK_OPS.map((o) => ({ ...o })),
    );
    const opLine = (o: FenwickOp) =>
      o.type === "query"
        ? `  { type: "query", l: ${o.l}, r: ${o.r} },`
        : `  { type: "update", i: ${o.i}, v: ${o.v} },`;
    return [
      `const A = [${WALK.join(", ")}];`,
      "const ops: FenwickOp[] = [",
      ...WALK_OPS.map(opLine),
      "];",
      `// 이 절이 끝나면 [${want.join(", ")}]${이가(want.at(-1) ?? 0)} 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 칸 0 에서는 두 이동이 제자리다. */
  "walk-zero": () =>
    table(
      ["칸 번호", "최하위 1 비트", "빼는 이동", "더하는 이동", "결과"],
      "rrlll",
      [0, 1].map((k) => [
        String(k),
        String(lowbit(k)),
        `${k} − ${lowbit(k)} = ${k - lowbit(k)}`,
        `${k} + ${lowbit(k)} = ${k + lowbit(k)}`,
        k - lowbit(k) === k ? "제자리다" : "0 에서 멈추거나 위 칸으로 간다",
      ]),
    ),

  /** `deep.walk` 2 — 채우기 조각만 실행한 걸음. */
  "walk-build": () => {
    const steps = walkSteps().filter((s) => s.op === "채우기");
    const N = WALK.length;
    return table(
      ["걸음", "하는 일", ...range(1, N).map((k) => `칸 ${k}`)],
      `ll${"r".repeat(N)}`,
      steps.map((s) => [
        s.id,
        s.title,
        ...range(1, N).map((k) => String(s.tree[k])),
      ]),
    );
  },

  /** `deep.walk.pause` — 넘겨주는 바퀴를 내림차순으로 돌리면 어느 답이 달라지는가. */
  "pause-build-order": () => {
    const ops: FenwickOp[] = [...WALK_OPS, { type: "query", l: 0, r: 3 }];
    const rows = compareRows(WALK, ops, descending);
    assertBreaks(descending, rows);
    const diffs = rows.map((r) => Number(r.bare) - Number(r.mutated));
    return withNote(
      table(
        ["질의", "바른 코드", "내림차순으로 넘긴 코드", "판정"],
        "lrrl",
        rows.map((r) => [r.name, r.bare, r.mutated, verdict(r)]),
      ),
      `마지막 줄은 칸 4 하나만 읽는 질의입니다. 네 줄에서 바른 코드의 답에서 다른 코드의 답을 빼면 ${diffs.join(" · ")} 입니다.`,
    );
  },

  /** `deep.walk` 3 — 질의 [0,4] 에 앞부분 합 조각만 실행한 걸음. */
  "walk-prefix": () => {
    const steps = walkSteps().filter((s) => s.id === "T5" || s.id === "T6");
    const tree = steps[0]?.tree ?? [];
    const rows: string[][] = [];
    for (const s of steps) {
      const call = s.title.replace(/ · .*$/, "");
      if (s.readTree.length === 0) {
        rows.push([
          s.id,
          call,
          "없음",
          "—",
          "0",
          "루프가 한 번도 실행되지 않는다",
        ]);
      }
      let sum = 0;
      for (const k of s.readTree) {
        sum += tree[k] as number;
        const next = k - lowbit(k);
        rows.push([
          s.id,
          call,
          `칸 ${k}`,
          span(...coverOf(k)),
          String(sum),
          `${k} − ${lowbit(k)} = ${next}${next === 0 ? ", 멈춘다" : ""}`,
        ]);
      }
    }
    const last = steps.at(-1);
    return withNote(
      table(
        [
          "걸음",
          "부르는 곳",
          "읽은 칸",
          "맡는 구간",
          "더한 뒤의 합",
          "다음 칸 번호",
        ],
        "lllrrl",
        rows,
      ),
      `답은 ${last?.calc.expr} = ${last?.calc.result} 입니다.`,
    );
  },

  /** `deep.walk` 4 — 갱신 조각만 실행한 걸음. */
  "walk-update": () => {
    const steps = walkSteps().filter((s) => ["T7", "T8", "T9"].includes(s.id));
    const fixed = steps.filter((s) => s.writeTree.length > 0).length;
    return withNote(
      table(
        ["걸음", "하는 일", "계산", "결과"],
        "lllr",
        steps.map((s) => [s.id, s.title, s.calc.expr, s.calc.result]),
      ),
      `고친 칸은 ${fixed} 개이고, 나머지 ${WALK.length - fixed} 칸은 손대지 않았습니다.`,
    );
  },

  /** `deep.walk.pause` — 덮어쓸 값을 그대로 더하면 어느 입력에서 답이 안 틀리는가. */
  "pause-raw-value": () => {
    const rows = compareRows(WALK, WALK_OPS, rawValue);
    const zeros: FenwickOp[] = [
      { type: "update", i: 1, v: 7 },
      { type: "query", l: 0, r: 2 },
    ];
    const extra = compareRows([0, 0, 0], zeros, rawValue)[0];
    if (extra !== undefined) {
      rows.push({ ...extra, name: `${extra.name} · A = [0 0 0]` });
    }
    assertBreaks(rawValue, rows);
    const op = WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>;
    return withNote(
      table(
        ["질의", "바른 코드", "값을 그대로 더한 코드", "판정"],
        "lrrl",
        rows.map((r) => [r.name, r.bare, r.mutated, verdict(r)]),
      ),
      `전개의 갱신은 옛 값 ${WALK[op.i]}${을를(WALK[op.i] as number)} 새 값 ${op.v} 으로 덮어씁니다. 마지막 줄은 옛 값이 0 인 배열입니다.`,
    );
  },

  /** `deep.walk` 5 — 걸음마다 조건을 실제 값으로 판정한다. */
  "walk-trace": () => {
    const t = trace(WALK, WALK_OPS);
    const steps = walkSteps();
    const N = WALK.length;
    const rows: string[][] = [];
    const first = steps[0] as (typeof steps)[number];
    rows.push([
      first.id,
      "채우기",
      `i = 1 … ${N} 에서 i <= ${N} 참, i = ${N + 1} 에서 거짓`,
      first.calc.result,
      "③",
    ]);
    let giveAt = 2;
    for (const e of t.events) {
      if (e.kind === "give") {
        rows.push([
          `T${giveAt}`,
          "채우기",
          `i = ${e.i} · j = ${e.i} + ${lowbit(e.i)} = ${e.j} · ${e.j} <= ${N} 참`,
          `tree[${e.j}] = ${e.tree[e.j]}`,
          "④",
        ]);
        giveAt++;
      } else if (e.kind === "skip") {
        rows.push([
          `T${giveAt - 1} 뒤`,
          "채우기",
          `i = ${e.i} · j = ${e.i} + ${lowbit(e.i)} = ${e.j} · ${e.j} <= ${N} 거짓`,
          "넘기지 않는다",
          "④",
        ]);
      }
    }
    for (const s of steps.slice(giveAt - 1)) {
      if (s.branch.includes("⑤")) {
        rows.push([
          s.id,
          s.op,
          `op.type === "update" 참`,
          `delta = ${s.calc.result}`,
          "⑤",
        ]);
      } else if (s.branch.includes("①")) {
        const k = s.writeTree[0] as number;
        const next = k + lowbit(k);
        rows.push([
          s.id,
          s.op,
          `k = ${k} · ${k} <= ${N} 참${next > N ? ` · 다음 k = ${next} · ${next} <= ${N} 거짓` : ""}`,
          `tree[${k}] = ${s.calc.result}`,
          "①",
        ]);
      } else {
        const call = s.title.replace(/ · .*$/, "");
        const isAnswer = s.writeAnswer.length > 0;
        const conds = [
          ...(isAnswer ? [] : [`op.type === "update" 거짓`]),
          ...s.readTree.map((k) => `${call} 의 k = ${k} · ${k} > 0 참`),
          `k = 0 · 0 > 0 거짓`,
        ].join(", ");
        rows.push([
          s.id,
          s.op,
          conds,
          isAnswer ? `답 ${s.calc.result}` : `합 ${s.calc.result}`,
          isAnswer ? (s.readTree.length === 0 ? "⑥" : "② ⑥") : "②",
        ]);
      }
    }
    return table(["걸음", "연산", "조건 판정", "결과", "분기"], "lllll", rows);
  },

  /** `deep.walk` 5 — 분기마다 실행된 걸음. */
  "walk-branches": () => {
    const steps = walkSteps();
    const what: Record<string, string> = {
      "①": "담당 칸을 따라 올라가며 더한다",
      "②": "담당 구간을 이어 붙이며 읽는다",
      "③": "자기 몫만 채운다",
      "④": "위 칸에 한 번만 넘긴다",
      "⑤": "덮어쓰기를 변화량으로 바꾼다",
      "⑥": "구간 합을 앞부분 합 둘의 차로 낸다",
    };
    const rows = ["①", "②", "③", "④", "⑤", "⑥"].map((b) => {
      const ids = steps
        .filter((s) =>
          b === "②"
            ? s.op.startsWith("질의") && s.readTree.length > 0
            : (s.branch as readonly string[]).includes(b),
        )
        .map((s) => s.id);
      return [b, what[b] as string, ids.join(" "), String(ids.length)];
    });
    const last = steps.at(-1);
    return withNote(
      table(["분기", "하는 일", "걸음", "횟수"], "lllr", rows),
      `반환값은 답 목록의 마지막 상태인 ${values((last?.answers ?? []) as number[])} 입니다.`,
    );
  },

  /** `deep.walk.pause` — 논리 배열을 안 고치면 언제 답이 달라지는가. */
  "pause-no-sync": () => {
    const rows = compareRows(WALK, WALK_OPS, noSync);
    const twice: FenwickOp[] = [
      { type: "update", i: 0, v: 5 },
      { type: "query", l: 0, r: 0 },
      { type: "update", i: 0, v: 10 },
      { type: "query", l: 0, r: 0 },
    ];
    const labels = ["첫 갱신 뒤", "둘째 갱신 뒤"];
    const v1 = (twice[0] as { v: number }).v;
    const v2 = (twice[2] as { v: number }).v;
    for (const [n, x] of compareRows([1, 2, 3], twice, noSync).entries()) {
      rows.push({ ...x, name: `${x.name} · ${labels[n]}` });
    }
    assertBreaks(noSync, rows);
    return withNote(
      table(
        ["질의", "바른 코드", "논리 배열을 안 고친 코드", "판정"],
        "lrrl",
        rows.map((r) => [r.name, r.bare, r.mutated, verdict(r)]),
      ),
      `아래 두 줄은 A = [1 2 3] 의 인덱스 0 을 ${v1}${으로(v1)}, 다시 ${v2}${으로(v2)} 덮어쓰고 갱신마다 [0,0] 을 물은 목록입니다.`,
    );
  },

  /** `deep.walk.final` — 전체 코드를 몇 가지 입력에 부른 결과. */
  "final-calls": () => {
    const lines: [string, number[]][] = [
      [
        `fenwickRangeSum([${WALK.join(", ")}], 위 연산 넷)`,
        fenwickRangeSum(
          [...WALK],
          WALK_OPS.map((o) => ({ ...o })),
        ),
      ],
      ["fenwickRangeSum([1, 2, 3], [])", fenwickRangeSum([1, 2, 3], [])],
      [
        "fenwickRangeSum([7], 질의 [0,0])",
        fenwickRangeSum([7], [{ type: "query", l: 0, r: 0 }]),
      ],
      [
        "fenwickRangeSum([1, 2, 3], 갱신 i=0 v=-5 · 질의 [0,2])",
        fenwickRangeSum(
          [1, 2, 3],
          [
            { type: "update", i: 0, v: -5 },
            { type: "query", l: 0, r: 2 },
          ],
        ),
      ],
    ];
    const width = Math.max(...lines.map(([l]) => cellWidth(l)));
    return [
      ...lines.map(
        ([l, out]) =>
          `${l}${" ".repeat(width - cellWidth(l))}  →  [${out.join(", ")}]`,
      ),
    ].join("\n");
  },

  /** `related` — 앞부분 합이 r 의 이진 표기를 조각으로 쪼갠다. */
  "related-split": () => {
    const steps = walkSteps().filter(
      (s) => s.op.startsWith("질의") && s.readTree.length > 0,
    );
    const seen = new Set<number>();
    const rows: string[][] = [];
    let same = 0;
    for (const s of steps) {
      const r = Number(/prefix\((\d+)\)/.exec(s.title)?.[1]);
      if (seen.has(r)) continue;
      seen.add(r);
      if (s.readTree.length === popcount(r)) same++;
      rows.push([
        s.id,
        `prefix(${r})`,
        bin(r),
        s.readTree.map((k) => lowbit(k)).join(" + "),
        cellsText(s.readTree),
      ]);
    }
    return withNote(
      table(
        [
          "걸음",
          "호출",
          "r 의 이진 표기",
          "2 의 거듭제곱으로 쪼갠 모양",
          "읽은 칸",
        ],
        "lllll",
        rows,
      ),
      `${rows.length} 줄 가운데 ${same} 줄에서 읽은 칸의 수가 r 의 1 비트 개수와 같습니다.`,
    );
  },

  /** `purpose.fit` — 미리 만드는 비용을 갚을 만큼 연산이 많은가. */
  "fit-boundary": () => {
    const s = worstPerOp();
    return withNote(
      table(["경우", "직접 더하기", "펜윅 트리(만들기 + 연산의 상한)"], "lrr", [
        ["연산 1 개, 구간 10 칸", "10", num(s.build + s.perOp)],
        [
          `연산 ${num(N_MAX)} 개`,
          `최악 ${num(N_MAX * N_MAX)}`,
          num(s.build + N_MAX * s.perOp),
        ],
      ]),
      `N = ${num(N_MAX)} 에서 채우기가 ${num(s.build)} 번(2N + 3H, H = ${num(s.handOver)})이고, 연산 하나는 최악 ${s.perOp} 번으로 셌습니다.`,
    );
  },

  /** `purpose.alt` — 순서가 뒤집히는 자리를 비용 항으로 가른다. */
  "alt-boundary": () => {
    const run = (q: number, u: number) => {
      const ops = altOps(q, u);
      const f = fenwickCount(ALT_A, ops);
      const b = blockTable(ALT_A, ops, ALT_B);
      sameAnswers(f, b);
      return { f, b };
    };
    const bf = benchCases["펜윅 트리"]();
    const bb = benchCases["제곱근 분할"]();
    const q0 = run(136, 0);
    const u0 = run(1_024, 0);
    const uMax = run(1_024, 16_384);
    // 이 블록의 셈과 `.alt.ts` 의 셈이 같은 목록을 센 것인지 — 합을 맞댄다.
    const pairs: [number, number | undefined][] = [
      [total(q0.f), bf["갱신 0 회 · 질의 136 개 배열 접근"]],
      [total(q0.b), bb["갱신 0 회 · 질의 136 개 배열 접근"]],
      [total(u0.f), bf["질의 1,024 개 · 갱신 0 회 배열 접근"]],
      [total(u0.b), bb["질의 1,024 개 · 갱신 0 회 배열 접근"]],
      [total(uMax.f), bf["질의 1,024 개 · 갱신 16,384 회 배열 접근"]],
      [total(uMax.b), bb["질의 1,024 개 · 갱신 16,384 회 배열 접근"]],
    ];
    for (const [a, b] of pairs) {
      if (a !== b)
        throw new Error(`대조 블록의 셈 ${a} 이 벤치 ${b} 과 다르다`);
    }
    const qf = q0.f.query / 136;
    const qb = q0.b.query / 136;
    const uf = uMax.f.update / 16_384;
    const ub = uMax.b.update / 16_384;
    const buildGap = q0.f.build - q0.b.build;
    const queryGap = qb - qf;
    const u0Gap = total(u0.b) - total(u0.f);
    const updGap = uf - ub;
    return withNote(
      table(
        [
          "비용(배열 접근 수)",
          "펜윅 트리",
          "제곱근 분할",
          "펜윅 트리 − 제곱근 분할",
        ],
        "lrrr",
        [
          ["만들기", num(q0.f.build), num(q0.b.build), num(buildGap)],
          ["질의 하나 평균(질의 136 개)", f1(qf), f1(qb), f1(qf - qb)],
          ["갱신 하나 평균(갱신 16,384 회)", f1(uf), f1(ub), f1(updGap)],
        ],
      ),
      `만들기의 차이 ${num(buildGap)}${을를(num(buildGap))} 질의 하나의 차이 ${f1(queryGap)}${으로(f1(queryGap))} 나누면 ${f1(buildGap / queryGap)} 입니다. 질의 1,024 개에서 제곱근 분할이 더 쓴 ${num(u0Gap)}${을를(num(u0Gap))} 갱신 하나의 차이 ${f1(updGap)}${으로(f1(updGap))} 나누면 ${f1(u0Gap / updGap)} 이고, 그 갱신 수는 질의 수 1,024 의 ${f1(u0Gap / updGap / 1_024)} 배입니다.`,
    );
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 본다. */
  "math-check": () => {
    const tree = builtTree(SHAPE);
    const rows = [6, 7, 8, 12].map((k) => {
      const [a, b] = coverOf(k);
      return [
        String(k),
        bin(k),
        String(lowbit(k)),
        span(a, b),
        SHAPE.slice(a, b + 1).join(" + "),
        String(tree[k]),
      ];
    });
    return withNote(
      table(
        ["k", "k 의 이진 표기", "LSB(k)", "cover(k)", "그 구간의 A", "tree[k]"],
        "rlrllr",
        rows,
      ),
      `배열은 길이 ${SHAPE.length} 의 [${SHAPE.slice(0, 3).join(" ")} … ${SHAPE.at(-1)}] 이고, tree[k] 열은 정본의 채우기를 실행한 값입니다.`,
    );
  },

  /** `deep.math` ③ — pre(r) 의 재귀를 한 번 펴 본다. */
  "math-expand": () => {
    const r = ERASE_R;
    const tree = builtTree(SHAPE);
    const rows: string[][] = prefixChain(r).map((k) => [
      `pre(${k}) = tree[${k}] + pre(${k - lowbit(k)})`,
      span(...coverOf(k)),
      String(tree[k]),
    ]);
    rows.push(["pre(0) = 0", "없음", "0"]);
    const got = prefixChain(r).reduce((s, k) => s + (tree[k] as number), 0);
    return withNote(
      table(["식", "cover(k)", "tree[k]"], "llr", rows),
      `더하면 ${got} 이고, 앞 ${r} 개를 직접 더한 값도 ${sumOf(SHAPE, 0, r - 1)} 입니다. 식을 편 횟수는 ${prefixChain(r).length} 번이고 ${r} = ${bin(r)} 의 1 비트도 ${popcount(r)} 개입니다.`,
    );
  },

  /** `deep.math` ③ — 접두 합이 더하는 칸 수가 1 비트 개수와 같은가. */
  "term-count": () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 15, 16].map((r) => {
      const chain = prefixChain(r);
      return [
        String(r),
        bin(r),
        chain.join(" "),
        String(chain.length),
        String(popcount(r)),
      ];
    });
    let most = 0;
    for (let r = 1; r <= N_MAX; r++) {
      most = Math.max(most, prefixChain(r).length);
    }
    return withNote(
      table(
        [
          "r",
          "r 의 이진 표기",
          "prefix(r) 가 더하는 칸",
          "칸 수",
          "1 비트 개수",
        ],
        "rllrr",
        rows,
      ),
      `두 열이 모든 줄에서 같습니다. r 이 1 부터 ${num(N_MAX)} 까지일 때 칸 수의 최댓값은 ${most} 입니다.`,
    );
  },

  /** `deep.math` ③ — 인덱스 하나를 품는 칸의 조건. */
  "math-contain": () => {
    const i = (WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>).i;
    const N = WALK.length;
    const rows = range(1, N).map((k) => {
      const lo = k - lowbit(k);
      const ok = lo <= i && i <= k - 1;
      return [
        String(k),
        span(lo, k - 1),
        `${lo} <= ${i} 그리고 ${i} <= ${k - 1}`,
        ok ? "참" : "거짓",
      ];
    });
    const holding = range(1, N).filter((k) => k - lowbit(k) <= i && i <= k - 1);
    const chain = addChain(i + 1, N);
    if (JSON.stringify(holding) !== JSON.stringify(chain)) {
      throw new Error("조건으로 고른 칸이 add 의 이동과 다르다");
    }
    return withNote(
      table(
        ["k", "cover(k)", `k − LSB(k) <= ${i} <= k − 1`, "판정"],
        "rlll",
        rows,
      ),
      `조건이 참인 칸은 ${cellsText(holding)} 이고, add(${i + 1}, …) 가 지나는 칸과 같습니다.`,
    );
  },

  /** `deep.math` ②④ — 채우는 비용의 닫힌 형태. */
  "build-cost": () => {
    const small = 8;
    const lows = range(1, small).map(lowbit);
    const rows = [8, 16, 1024, 65_536].map((n) => {
      let byAdd = 0;
      for (let i = 1; i <= n; i++) byAdd += addChain(i, n).length;
      const m = Math.log2(n);
      const closed = (n / 2) * (m + 2);
      let handOver = 0;
      for (let i = 1; i <= n; i++) if (i + lowbit(i) <= n) handOver++;
      return [
        num(n),
        String(m),
        num(byAdd),
        num(closed),
        num(handOver),
        (byAdd / handOver).toFixed(1),
      ];
    });
    return withNote(
      table(
        [
          "N",
          "log₂ N",
          "칸마다 add 로 채운 고침 수",
          "(N/2)(log₂N + 2)",
          "두 바퀴 채우기의 넘김 수",
          "배수",
        ],
        "rrrrrr",
        rows,
      ),
      `N = ${small} 이면 LSB(1) … LSB(${small}) 가 ${lows.join(" ")} 이라 합이 ${lows.reduce((s, x) => s + x, 0)} 이고, (${small}/2)(${Math.log2(small)} + 2) 도 ${(small / 2) * (Math.log2(small) + 2)} 입니다. 셋째 열과 넷째 열이 모든 줄에서 같습니다.`,
    );
  },

  /** `invariant` ② — 걸음마다 칸 값을 정의와 대조한다. */
  "invariant-check": () => {
    const steps = walkSteps();
    const N = WALK.length;
    const rows = steps.map((s) => {
      const def = treeByDef(s.arr);
      const bad = range(1, N).filter((k) => s.tree[k] !== def[k]);
      return [
        s.id,
        `${s.op} · ${s.title.replace(/ · [①②③④⑤⑥]$/, "")}`,
        String(N),
        String(bad.length),
        cellsText(bad),
      ];
    });
    const moment = steps.find((s) => s.id === INVARIANT_MOMENT);
    return withNote(
      table(
        ["걸음", "그 걸음이 한 일", "확인한 칸", "어긋난 칸", "어긋난 자리"],
        "llrrl",
        rows,
      ),
      `정의는 그 걸음이 끝난 뒤의 arr 로 계산했습니다. ${INVARIANT_MOMENT}${은는(INVARIANT_MOMENT)} 갱신이 칸 ${moment?.writeTree.join(" · ")} 만 고친 순간입니다.`,
    );
  },

  /** `invariant` ② — 경계 입력. */
  "invariant-edges": () => {
    const cases: [string, number[], FenwickOp[]][] = [
      ["연산 목록이 빔", [1, 2, 3], []],
      ["갱신만 있음", [1, 2, 3], [{ type: "update", i: 0, v: 99 }]],
      [
        "원소 하나",
        [7],
        [
          { type: "query", l: 0, r: 0 },
          { type: "update", i: 0, v: -3 },
          { type: "query", l: 0, r: 0 },
        ],
      ],
      ["한 칸짜리 질의", [...WALK], [{ type: "query", l: 2, r: 2 }]],
      ["왼쪽 끝이 0", [...WALK], [{ type: "query", l: 0, r: 2 }]],
      [
        "음수로 갱신",
        [1, 2, 3],
        [
          { type: "update", i: 0, v: -5 },
          { type: "query", l: 0, r: 2 },
        ],
      ],
      [
        "같은 자리를 두 번 갱신",
        [1, 2, 3],
        [
          { type: "update", i: 0, v: 5 },
          { type: "update", i: 0, v: 10 },
          { type: "query", l: 0, r: 0 },
        ],
      ],
    ];
    const rows = cases.map(([name, A, ops]) => {
      const got = fenwickRangeSum(
        [...A],
        ops.map((o) => ({ ...o })),
      );
      const a = [...A];
      const want: number[] = [];
      for (const op of ops) {
        if (op.type === "update") a[op.i] = op.v;
        else want.push(sumOf(a, op.l, op.r));
      }
      return [
        name,
        values(A),
        opsText(ops),
        values(got),
        JSON.stringify(got) === JSON.stringify(want) ? "같다" : "다르다",
      ];
    });
    return table(
      ["경계", "배열", "연산", "답", "정의로 직접 계산한 값과"],
      "lllll",
      rows,
    );
  },

  /** `invariant` ③ — 불변식을 지키던 걸음을 1 로 바꾸면 무엇이 나오는가. */
  "mutant-step-one": () => {
    const rows = compareRows(WALK, WALK_OPS, stepOne);
    assertBreaks(stepOne, rows);
    return table(
      ["질의", "바른 코드", "걸음을 1 로 바꾼 코드", "차이", "판정"],
      "lrrrl",
      rows.map((r) => [
        r.name,
        r.bare,
        r.mutated,
        String(Number(r.mutated) - Number(r.bare)),
        verdict(r),
      ]),
    );
  },

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const f = fenwickCount(WALK, WALK_OPS);
    const bare = scanEach(WALK, WALK_OPS);
    return withNote(
      table(["갈래", "걸음", "배열 접근"], "llr", [
        ["칸을 채운다", "T1\\~T4", num(f.build)],
        ["질의 셋", "T5\\~T6 · T10\\~T11 · T12\\~T13", num(f.query)],
        ["갱신 하나", "T7\\~T9", num(f.update)],
        ["합", "", num(total(f))],
      ]),
      `같은 연산 목록을 직접 더하기로 처리하면 ${num(total(bare))} 번입니다.`,
    );
  },

  /** `perf.derive` — 세 갈래의 식에 전개 입력을 넣는다. */
  "perf-formula": () => {
    const N = WALK.length;
    const H = range(1, N).filter((i) => i + lowbit(i) <= N).length;
    const f = fenwickCount(WALK, WALK_OPS);
    const qs = WALK_OPS.filter((o) => o.type === "query") as Extract<
      FenwickOp,
      { type: "query" }
    >[];
    const byQuery = qs.map((q) => fenwickCount(WALK, [q]).query);
    const perQuery = qs
      .map((q) => `${popcount(q.r + 1)} + ${popcount(q.l)}`)
      .join(" · ");
    const up = WALK_OPS[1] as Extract<FenwickOp, { type: "update" }>;
    const chain = addChain(up.i + 1, N).length;
    return table(["갈래", "식", "N = 5 를 넣은 값", "전개에서 잰 값"], "llll", [
      [
        "채우기",
        "첫 바퀴 2N + 둘째 바퀴 3H",
        `2 × ${N} + 3 × ${H} = ${2 * N + 3 * H}`,
        String(f.build),
      ],
      [
        "질의 하나",
        "앞 r+1 개의 1 비트 + 앞 l 개의 1 비트",
        perQuery,
        byQuery.join(" · "),
      ],
      [
        "갱신 하나",
        "논리 배열 2 + 지나는 칸마다 2",
        `2 + 2 × ${chain} = ${2 + 2 * chain}`,
        String(f.update),
      ],
    ]);
  },

  /** `perf.derive` — 과제 규모에서 세 갈래가 각각 몇 번인가. */
  "scale-cost": () => {
    const s = worstPerOp();
    return withNote(
      table(["갈래", "세는 것", "값", "그 값을 만드는 자리"], "llrl", [
        [
          "칸 채우기",
          `2N + 3 × ${num(s.handOver)}`,
          num(s.build),
          "한 번뿐이다",
        ],
        [
          "질의 하나",
          "읽은 칸의 최대",
          String(s.bestQuery),
          span(s.bestPair[0], s.bestPair[1]),
        ],
        [
          "갱신 하나",
          `2 + 2 × ${s.bestUpdate}`,
          String(s.updateCost),
          `i = ${s.bestIndex}`,
        ],
        [
          "최악을 다 더하면",
          `채우기 + Q × ${s.perOp}`,
          num(s.build + N_MAX * s.perOp),
          `Q = ${num(N_MAX)}`,
        ],
      ]),
      `N = ${num(N_MAX)} 이고, 질의와 갱신의 최대는 모든 자리를 넣어 찾은 뒤 셈하는 판으로 한 번씩 실행해 같은 값을 확인했습니다.`,
    );
  },

  /** `perf.bounds` — 같은 배열에서 두 끝의 1 비트 수가 읽는 칸을 가른다. */
  "perf-best-worst": () => {
    const N = 1024;
    const A = bigArray(N);
    const rows = (
      [
        [0, 511],
        [511, 1022],
      ] as const
    ).map(([l, r]) => [
      span(l, r),
      num(r - l + 1),
      bin(r + 1),
      bin(l),
      String(fenwickCount(A, [{ type: "query", l, r }]).query),
    ]);
    return table(
      [
        "질의",
        "구간의 칸 수",
        "r + 1 의 이진 표기",
        "l 의 이진 표기",
        "읽은 칸",
      ],
      "lrllr",
      rows,
    );
  },

  /** `perf.bounds` — 질의 하나의 상한이 타이트한가. */
  "perf-tight": () =>
    table(
      ["N", "상한 2(⌊log₂N⌋ + 1)", "모든 짝에서 잰 최대", "그 짝"],
      "rrrl",
      [1_024, N_MAX].map((N) => {
        const { most, pair } = fenwickMostRead(N);
        const bound = 2 * (Math.floor(Math.log2(N)) + 1);
        return [num(N), String(bound), String(most), span(pair[0], pair[1])];
      }),
    ),

  /** `perf.worst` — 질의의 모양이 읽는 칸 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const n = 1024;
    const { pair: best } = fenwickMostRead(n);
    const A = bigArray(n);
    const shapes: [string, number, number][] = [
      ["배열 전체", 0, n - 1],
      ["왼쪽 절반", 0, n / 2 - 1],
      ["한 칸", 500, 500],
      ["읽은 칸이 최대인 짝", best[0], best[1]],
    ];
    const rows = shapes.map(([name, l, r]) => {
      const read = fenwickCount(A, [{ type: "query", l, r }]).query;
      if (read !== popcount(l) + popcount(r + 1)) {
        throw new Error("읽은 칸이 1 비트 개수의 합과 다르다");
      }
      return [
        name,
        span(l, r),
        num(r - l + 1),
        String(popcount(l)),
        String(popcount(r + 1)),
        String(read),
      ];
    });
    return withNote(
      table(
        [
          "질의의 모양",
          "구간",
          "구간의 칸 수",
          "l 의 1 비트",
          "r+1 의 1 비트",
          "읽은 칸",
        ],
        "llrrrr",
        rows,
      ),
      `N = ${num(n)} 에서 읽은 칸이 최대인 짝은 모든 (l, r) 짝을 넣어 찾았습니다. ${best[0]} = ${bin(best[0])} 이고 ${best[1] + 1} = ${bin(best[1] + 1)} 입니다.`,
    );
  },

  /** `perf.worst` — 과제 규모에 최악을 채운 작업 목록. */
  "worst-scale": () => {
    const s = worstPerOp();
    const A = bigArray(N_MAX);
    const q: FenwickOp = { type: "query", l: s.bestPair[0], r: s.bestPair[1] };
    const upd = (k: number): FenwickOp => ({
      type: "update",
      i: s.bestIndex,
      v: (k % 100) - 50,
    });
    const lists: [string, FenwickOp[]][] = [
      [
        `갱신만 ${num(N_MAX)} 개 · 전부 i = ${s.bestIndex}`,
        range(1, N_MAX).map(upd),
      ],
      [
        `질의만 ${num(N_MAX)} 개 · 전부 ${span(s.bestPair[0], s.bestPair[1])}`,
        range(1, N_MAX).map(() => q),
      ],
      ["둘을 번갈아", range(1, N_MAX).map((k) => (k % 2 === 1 ? upd(k) : q))],
    ];
    const rows = lists.map(([name, ops]) => {
      const c = fenwickCount(A, ops);
      return [
        name,
        num(c.build),
        num(c.query + c.update),
        num(total(c)),
        seconds(total(c)),
      ];
    });
    return withNote(
      table(
        ["작업 목록", "미리 만들기", "연산", "합", "초당 1 억 번 기준"],
        "lrrrr",
        rows,
      ),
      `N = Q = ${num(N_MAX)} 입니다. 갱신 i = ${s.bestIndex} 은 add 가 칸을 가장 많이 지나는 자리이고, 질의 ${span(s.bestPair[0], s.bestPair[1])} 는 읽는 칸이 가장 많은 짝입니다.`,
    );
  },

  /** `selfcheck` — 길이가 달라도 읽는 칸이 같은 까닭. */
  "check-two-cells": () => {
    const qs: [string, number, number][] = [
      ["T5\\~T6", 0, 4],
      ["T12\\~T13", 2, 3],
      ["—", 0, 2],
      ["—", 1, 3],
    ];
    return table(
      [
        "걸음",
        "질의",
        "오른쪽 호출",
        "1 비트",
        "왼쪽 호출",
        "1 비트",
        "읽은 칸",
      ],
      "lllrlrr",
      qs.map(([id, l, r]) => [
        id,
        span(l, r),
        `앞 ${r + 1} 개`,
        String(popcount(r + 1)),
        `앞 ${l} 개`,
        String(popcount(l)),
        String(fenwickCount(WALK, [{ type: "query", l, r }]).query),
      ]),
    );
  },
};
