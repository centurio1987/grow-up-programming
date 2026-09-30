/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 후보 하나를 만든 자리의 기록은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 * 비용은 원고 전체에서 **후보 수**로 센다 — 가르는 자리 `k` 하나로 「왼쪽 조각 + 오른쪽 조각 +
 * 합치는 비용」을 한 번 만드는 일이 후보 하나다. 메모리는 **칸 수**로 센다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  big,
  binom,
  type Cand,
  candidates,
  candsByRecurrence,
  cellName,
  cheapestPairFirst,
  comma,
  DIM_MAX,
  enumerateParen,
  type FillOrder,
  fillByOrder,
  fixedSplit,
  fmt,
  genDims,
  joinExpr,
  label,
  N,
  N_MAX,
  naiveCount,
  parenByRecurrence,
  parenClosed,
  parenOf,
  SAMPLES,
  sizeOf,
  solvedPerInterval,
  span,
  splitOf,
  tableCells,
  trace,
  triangles,
  usedCells,
  WALK,
  walkSteps,
} from "./matrixChainMultiplication-guide.fig.tsx";
import { matrixChainMultiplication } from "./matrixChainMultiplication-guide.ref.ts";

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

/**
 * 닫는 마커가 없는 블록 — 대조가 펜스 **안쪽**만 보므로 펜스를 두르지 않는다. 언어 태그(`ts` 등)는
 * 본문 펜스가 진다.
 */
const open = (body: string, _lang = "text"): string => body;

/** 첫 열 말고 전부 오른쪽 정렬인 마크다운 표. */
const mdR = (head: string[], rows: string[][]): string =>
  md(
    head,
    rows,
    head.map((_, i) => i).filter((i) => i > 0),
  );

/** 감싸지 않고 그대로 — 닫힌 블록의 표는 펜스 없이 싣는다. */
const bare = (body: string): string => body;

/** 표 아래 문장까지 한 블록으로 — 닫는 마커는 본문에 있다. */
const withNote = (body: string, note: string): string => `${body}\n\n${note}`;

const call = (p: readonly number[]): number =>
  matrixChainMultiplication([...p]);

/** 배수를 소수 한 자리로 — `6.6`. */
const ratio = (a: number, b: number): string => (a / b).toFixed(1);

/** 칸 `(i, j)` 의 후보 전부. */
const candsOf = (i: number, j: number, p: readonly number[] = WALK): Cand[] =>
  trace(p).cands.filter((c) => c.i === i && c.j === j);

/** 칸 `(i, j)` 의 값. */
const dpOf = (i: number, j: number, p: readonly number[] = WALK): number =>
  trace(p).dp[i]?.[j] as number;

/** 쓰는 칸 전부 — 구간 길이 · 왼쪽 끝 차례. */
function cellsInOrder(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let L = 1; L <= n; L++)
    for (let i = 1; i + L - 1 <= n; i++) out.push([i, i + L - 1]);
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식의 「두 조각이 **만나는 자리**의 차원」을 지키던 줄 — 합치는 비용의 가운데 항 — 에서
 * `dims[k]` 를 `dims[k + 1]` 로 바꾼 사본. 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가
 * 아니면 `loadMutant` 가 던진다.
 */
const 만나는차원을옆칸에서 = await loadMutant<{
  matrixChainMultiplication(dims: number[]): number;
}>(
  new URL("./matrixChainMultiplication-guide.ref.ts", import.meta.url).pathname,
  { swap: [/\(dims\[k\] as number\)/, "(dims[k + 1] as number)"] },
);

/** 중화 실행이면 변이 모듈의 함수가 정본과 같은 객체다 — 그때는 자기검사를 건너뛴다. */
const neutral =
  만나는차원을옆칸에서.matrixChainMultiplication === matrixChainMultiplication;

const 변이표: (readonly number[])[] = [
  WALK,
  [10, 30, 5, 60],
  [10, 20, 30, 40, 30],
  [2, 3, 4, 2, 5],
  [5, 5, 5, 5],
  [10, 20],
];

const mutated = (p: readonly number[]): number =>
  만나는차원을옆칸에서.matrixChainMultiplication([...p]);

if (!neutral) {
  // 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
  if (변이표.every((p) => call(p) === mutated(p))) {
    throw new Error(
      "만나는 차원을 옆 칸에서 읽은 변이가 어느 입력에서도 답을 바꾸지 못했다",
    );
  }
  // 변이가 답을 그대로 두는 입력이 실제로 있다는 것도 본문의 주장이다.
  if (변이표.every((p) => call(p) !== mutated(p))) {
    throw new Error("변이가 모든 입력에서 답을 바꿨다");
  }
}

/** 변이 사본이 칸 `(i, j)` 의 k 후보에서 쓰는 합치는 비용 — 가운데 항만 옆 칸이다. */
const mutantJoin = (p: readonly number[], i: number, k: number, j: number) =>
  (p[i - 1] as number) * (p[k + 1] as number) * (p[j] as number);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 행렬 넷의 크기와 첫 곱셈 한 번의 비용. */
  "concept-chain": () => {
    const rows = Array.from({ length: N }, (_, t) => [
      `A${t + 1}`,
      String(WALK[t]),
      String(WALK[t + 1]),
    ]);
    const [a, b, c] = WALK as [number, number, number];
    return withNote(
      md(["행렬", "행 수", "열 수"], rows, [1, 2]),
      `행렬 A_t 의 크기는 p[t-1] × p[t] 입니다. A1 과 A2 를 곱하면 ${a} × ${c} 행렬이 되고, 스칼라 곱셈이 ${a} · ${b} · ${c} = ${comma(a * b * c)} 번 일어납니다.`,
    );
  },

  /** `concept` — 괄호 배치 다섯과 각각의 곱셈 횟수. */
  "concept-parens": () => {
    const list = enumerateParen(WALK, 1, N).sort((x, y) => x.cost - y.cost);
    const lo = list[0] as { expr: string; cost: number };
    const hi = list.at(-1) as { expr: string; cost: number };
    const ans = call(WALK);
    return withNote(
      md(
        ["괄호 배치", "곱셈 횟수"],
        list.map((x) => [x.expr, comma(x.cost)]),
        [1],
      ),
      `배치는 ${list.length} 가지이고, 가장 적은 ${lo.expr} 의 ${comma(lo.cost)}${과와(comma(lo.cost))} 가장 많은 ${hi.expr} 의 ${comma(hi.cost)}${은는(comma(hi.cost))} ${ratio(hi.cost, lo.cost)} 배 차이입니다. 정본 matrixChainMultiplication(${label(WALK)}) 도 ${comma(ans)}${을를(comma(ans))} 냅니다.`,
    );
  },

  /** `concept` — 배치 수 · 쓰는 칸 수 · 후보 수. */
  "concept-size": () =>
    open(
      table(
        ["행렬 수 n", "괄호 배치 수", "쓰는 칸 n(n+1)/2", "후보 (n³−n)/6"],
        [N, N_MAX].map((n) => [
          comma(n),
          big(parenClosed(n)),
          comma(usedCells(n)),
          comma(candidates(n)),
        ]),
      ),
    ),

  /** `deep.origin` ② — 아무것도 기억하지 않는 재귀가 만드는 후보 수. */
  "origin-naive": () => {
    const small = [2, 3, 4, 6, 8, 10, 12];
    const rows = small.map((n) => [
      comma(n),
      comma(naiveCount(genDims(n)).cands),
      big(candsByRecurrence(n)),
      comma(candidates(n)),
    ]);
    const far = candsByRecurrence(N_MAX);
    rows.push([
      comma(N_MAX),
      "세지 못했다",
      big(far),
      comma(candidates(N_MAX)),
    ]);
    const secs = (candidates(N_MAX) / 1e8).toFixed(4);
    return withNote(
      bare(
        mdR(
          [
            "행렬 수",
            "실제로 세어 본 후보",
            "점화식이 내는 후보",
            "DP 테이블의 후보",
          ],
          rows,
        ),
      ),
      `행렬 ${small.at(-1)} 개까지는 재귀를 실제로 실행해 세었고 점화식과 같았습니다. 행렬 ${N_MAX} 개에서 재귀의 후보는 ${String(far).length} 자리 수이고, DP 테이블의 후보는 ${comma(candidates(N_MAX))} 개입니다. 초당 1 억 번으로 잡으면 DP 테이블은 ${secs} 초예요.`,
    );
  },

  /** `deep.origin` ③ — 같은 구간을 몇 번씩 다시 푸는가. */
  "origin-same-interval": () => {
    const n = 5;
    const hit = solvedPerInterval(genDims(n));
    const rows: string[][] = [];
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      for (let j = i; j <= n; j++) {
        const c = (hit[i] as number[])[j] as number;
        sum += c;
        rows.push([span(i, j), comma(c), "1"]);
      }
    }
    const count = rows.length;
    rows.push(["합계", comma(sum), comma(count)]);
    return withNote(
      bare(
        mdR(
          ["구간", "재귀가 그 구간을 푼 횟수", "구간마다 한 번씩 정한 횟수"],
          rows,
        ),
      ),
      `행렬 ${n} 개에서 재귀는 구간 ${count} 개를 모두 합쳐 ${comma(sum)} 번 풀었습니다. 구간마다 한 번만 정하면 ${count} 번이고, 행렬이 ${N_MAX} 개라도 서로 다른 구간은 ${comma(usedCells(N_MAX))} 개입니다.`,
    );
  },

  /** `deep.origin` ⑤ — `k` 를 한 자리로 고정하면 무엇을 놓치는가. */
  "origin-split-rule": () => {
    const rows = SAMPLES.map((p) => [
      label(p),
      comma(fixedSplit(p, "left").answer),
      comma(fixedSplit(p, "right").answer),
      comma(call(p)),
    ]);
    const hitRight = SAMPLES.filter(
      (p) => fixedSplit(p, "right").answer === call(p),
    ).length;
    const worst = SAMPLES[3] as readonly number[];
    const r = fixedSplit(worst, "right").answer;
    const b = call(worst);
    return withNote(
      bare(
        mdR(
          ["차원 배열", "k = i 로 고정", "k = j−1 로 고정", "k 를 전부 시험"],
          rows,
        ),
      ),
      `k = j−1 로 고정한 판은 ${SAMPLES.length} 입력 가운데 ${hitRight} 입력에서 최소와 같은 값을 냈습니다. ${label(worst)} 에서는 ${comma(r)} 대 ${comma(b)}${으로(comma(b))} ${ratio(r, b)} 배 어긋나요.`,
    );
  },

  /** `deep.origin` ⑤ — 줄 차례로 채우면 읽는 칸이 준비돼 있는가. */
  "origin-fill-order": () => {
    const inputs = [WALK, [10, 20, 30, 40, 30], [2, 3, 4, 2, 5]];
    const orders: [string, FillOrder][] = [
      ["길이가 짧은 구간부터", "len"],
      ["i 를 1 부터 · j 를 i 부터", "rowAsc"],
    ];
    const below = inputs.filter(
      (p) => fillByOrder(p, "rowAsc").answer < call(p),
    ).length;
    return withNote(
      bare(
        mdR(
          ["채우는 차례", ...inputs.map(label)],
          orders.map(([name, o]) => [
            name,
            ...inputs.map((p) => comma(fillByOrder(p, o).answer)),
          ]),
        ),
      ),
      `i 를 1 부터 채운 판은 입력 ${inputs.length} 개 가운데 ${below} 개에서 최소보다 작은 값을 냈습니다.`,
    );
  },

  /** `deep.origin` ⑤ — 그 작은 값이 어디서 나오는가. */
  "origin-fill-why": () => {
    const row = fillByOrder(WALK, "rowAsc");
    // i 를 1 부터 채우면 dp[1][4] 를 정할 때 dp[2][4] 는 아직 깔아 둔 0 이다 — 채운 차례로 확인한다.
    const at14 = row.filled.get(`1,${N}`) as number;
    const at24 = row.filled.get(`2,${N}`) as number;
    if (!(at24 > at14)) {
      throw new Error("줄 차례에서 dp[2][4] 가 dp[1][4] 보다 먼저 정해졌다");
    }
    const join =
      (WALK[0] as number) * (WALK[1] as number) * (WALK[N] as number);
    const ready = dpOf(2, N);
    return open(
      [
        `${cellName(1, N)} 의 k=1 후보가 읽는 오른쪽 조각 ${cellName(2, N)}`,
        "",
        table(
          ["채우는 차례", `${cellName(2, N)} 의 값`, "k=1 후보"],
          [
            [
              "i 를 1 부터 채우면",
              "아직 0",
              `0 + 0 + ${comma(join)} = ${comma(join)}`,
            ],
            [
              "길이가 짧은 쪽부터",
              `이미 ${comma(ready)}`,
              `0 + ${comma(ready)} + ${comma(join)} = ${comma(ready + join)}`,
            ],
          ],
        ),
        `  └ ${cellName(2, N)}${은는(cellName(2, N))} ${cellName(1, N)} 보다 아래 줄이라 줄 차례로는 나중에 정해진다`,
      ].join("\n"),
    );
  },

  /** `deep.build` 낯선 개념 (a) — 칸마다 적힌 값이 가장 적은 배치의 곱셈 횟수와 같은가. */
  "build-cell-meaning": () => {
    let same = 0;
    const rows = cellsInOrder(N).map(([i, j]) => {
      const list = enumerateParen(WALK, i, j);
      const low = Math.min(...list.map((x) => x.cost));
      if (low === dpOf(i, j)) same++;
      return [
        cellName(i, j),
        span(i, j),
        parenOf(i, j),
        comma(dpOf(i, j)),
        comma(low),
      ];
    });
    return withNote(
      md(
        ["칸", "구간", "가장 적은 배치", "칸의 값", "배치를 전부 만든 최소"],
        rows,
        [3, 4],
      ),
      `${rows.length} 칸 가운데 ${same} 칸에서 칸의 값과, 배치를 전부 만들어 고른 최소가 같습니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (c) — 칸 하나를 이름에서 값까지 읽는다. */
  "build-read-one": () => {
    const pairs: [number, number][] = [
      [2, N],
      [1, N - 1],
    ];
    const rows = pairs.map(([a, b]) => {
      const mats = Array.from({ length: b - a + 1 }, (_, t) =>
        sizeOf(WALK, a + t),
      ).join(" · ");
      return [
        cellName(a, b),
        span(a, b),
        mats,
        `${WALK[a - 1]}×${WALK[b]}`,
        comma(enumerateParen(WALK, a, b).length),
        parenOf(a, b),
        comma(dpOf(a, b)),
      ];
    });
    const x = dpOf(2, N);
    return withNote(
      md(
        [
          "칸",
          "구간",
          "행렬 크기",
          "곱한 결과",
          "배치 수",
          "가장 적은 배치",
          "곱셈 횟수",
        ],
        rows,
        [4, 6],
      ),
      `두 칸의 값이 똑같이 ${comma(x)} 이지만 구간이 다르고, 그 값을 낸 배치도 ${cellName(2, N)}${이가(cellName(2, N))} ${parenOf(2, N)}, ${cellName(1, N - 1)}${이가(cellName(1, N - 1))} ${parenOf(1, N - 1)} 입니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (d) — 바깥 괄호 자리로 배치를 무리 짓는다. */
  "build-neighbor-split": () => {
    const list = enumerateParen(WALK, 1, N);
    const rows: string[][] = [];
    let match = 0;
    for (let k = 1; k < N; k++) {
      const group = list.filter((x) => x.k === k);
      const low = Math.min(...group.map((x) => x.cost));
      const cand = candsOf(1, N).find((c) => c.k === k) as Cand;
      if (low === cand.cost) match++;
      rows.push([
        `k = ${k}`,
        group.map((x) => x.expr).join(" · "),
        group.map((x) => comma(x.cost)).join(" · "),
        `${cellName(1, k)} + ${cellName(k + 1, N)} + ${joinExpr(WALK, 1, k, N)} = ${comma(cand.cost)}`,
      ]);
    }
    return withNote(
      md(
        [
          "바깥 괄호 자리",
          "그 무리의 배치",
          "곱셈 횟수",
          "두 칸으로 만든 후보",
        ],
        rows,
      ),
      `무리 ${N - 1} 개 가운데 ${match} 개에서, 무리 안의 가장 적은 곱셈 횟수가 같은 줄 왼쪽 칸과 같은 열 아래 칸으로 만든 후보와 같습니다. 배치 ${list.length} 가지는 무리 ${N - 1} 개 중 꼭 하나에 듭니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (d) — 대각선 하나에 칸이 몇 개인가. */
  "build-diagonal-count": () => {
    const rows: string[][] = [];
    let total = 0;
    for (let L = 1; L <= N; L++) {
      const cells: string[] = [];
      for (let i = 1; i + L - 1 <= N; i++) cells.push(cellName(i, i + L - 1));
      total += cells.length;
      rows.push([`L = ${L}`, comma(cells.length), cells.join(" · ")]);
    }
    rows.push(["합계", comma(total), `n(n+1)/2 = ${comma(usedCells(N))}`]);
    return open(table(["구간 길이", "칸 수 n−L+1", "칸"], rows));
  },

  /** `deep.build` 낯선 개념 (e) — 줄 차례로 채운 판과 칸마다 대조. */
  "build-contrast": () => {
    const bad = fillByOrder(WALK, "rowAsc").dp;
    const rows: string[][] = [];
    let all = 0;
    let smaller = 0;
    for (const [i, j] of cellsInOrder(N)) {
      all++;
      const v = bad[i]?.[j] as number;
      if (v !== dpOf(i, j)) {
        if (v < dpOf(i, j)) smaller++;
        rows.push([cellName(i, j), comma(dpOf(i, j)), comma(v)]);
      }
    }
    return withNote(
      md(["칸", "구간 길이 차례", "i 를 1 부터 채운 판"], rows, [1, 2]),
      `${all} 칸 가운데 ${rows.length} 칸의 값이 서로 다르고, 그 ${rows.length} 칸 가운데 ${smaller} 칸에서 줄 차례 쪽이 작습니다.`,
    );
  },

  /** `deep.build` 낯선 개념 (f) — 재귀가 실제로 푸는 구간이 앞쪽 구간뿐인가. */
  "build-why-interval": () => {
    const hit = solvedPerInterval(WALK);
    const kinds: [string, (i: number, j: number) => boolean][] = [
      ["A1 에서 시작", (i) => i === 1],
      [`A1 이 아닌 곳에서 시작해 A${N} 에서 끝`, (i, j) => i !== 1 && j === N],
      ["양 끝이 모두 안쪽", (i, j) => i !== 1 && j !== N],
    ];
    let total = 0;
    const rows = kinds.map(([name, test]) => {
      const list = cellsInOrder(N).filter(
        ([i, j]) => test(i, j) && ((hit[i] as number[])[j] as number) > 0,
      );
      total += list.length;
      return [
        name,
        comma(list.length),
        list.map(([i, j]) => span(i, j)).join(" · "),
      ];
    });
    const middle = rows[2]?.[1] as string;
    return withNote(
      md(["구간의 자리", "구간 수", "구간"], rows, [1]),
      `재귀가 한 번이라도 푼 구간은 ${total} 개이고, 그중 ${middle} 개는 A1 에서 시작하지도 A${N} 에서 끝나지도 않습니다.`,
    );
  },

  /** `deep.build` 1단계 — DP 테이블의 크기. */
  "build-size": () => {
    const rows = [N, N_MAX].map((n) => [
      comma(n),
      `${n + 1} × ${n + 1} = ${comma(tableCells(n))}`,
      comma(usedCells(n)),
      comma(n),
    ]);
    const dp = trace(WALK).dp;
    return withNote(
      md(
        ["행렬 수 n", "잡는 칸 (n+1)²", "쓰는 칸 n(n+1)/2", "대각선 칸 n"],
        rows,
        [0, 1, 2, 3],
      ),
      `전개 입력에서 정본이 만든 DP 테이블은 ${dp.length} 줄 × ${dp[0]?.length} 칸이고, 그중 쓰는 칸이 ${usedCells(N)} 개입니다.`,
    );
  },

  /** `deep.build` 2단계 — `dp[1][4]` 의 후보 셋. */
  "build-candidates": () => {
    const rows = candsOf(1, N).map((c) => [
      `k = ${c.k}`,
      `${cellName(c.i, c.k)} = ${comma(c.left)}`,
      `${cellName(c.k + 1, c.j)} = ${comma(c.right)}`,
      `${WALK[c.i - 1]}×${WALK[c.k]}${과와(`${WALK[c.i - 1]}×${WALK[c.k]}`)} ${WALK[c.k]}×${WALK[c.j]}`,
      `${joinExpr(WALK, c.i, c.k, c.j)} = ${comma(c.join)}`,
      comma(c.cost),
    ]);
    const k = splitOf(1, N);
    return withNote(
      md(
        [
          "가르는 자리",
          "왼쪽 조각",
          "오른쪽 조각",
          "두 조각의 크기",
          "합치는 비용",
          "후보",
        ],
        rows,
        [5],
      ),
      `가장 작은 후보는 k = ${k} 의 ${comma(dpOf(1, N))} 이고, ${cellName(1, N)} = ${comma(dpOf(1, N))} 입니다.`,
    );
  },

  /** `deep.build` 3단계 — 읽는 칸이 언제 정해졌는가. */
  "build-fill-order": () => {
    const f = fillByOrder(WALK, "len").filled;
    const name = (i: number, j: number) => {
      const at = f.get(`${i},${j}`) as number;
      return `${cellName(i, j)} (${at === 0 ? "대각선" : `${at} 번째`})`;
    };
    let total = 0;
    let ready = 0;
    const rows = cellsInOrder(N)
      .filter(([i, j]) => j > i)
      .map(([i, j]) => {
        const me = f.get(`${i},${j}`) as number;
        const reads: string[] = [];
        for (let k = i; k < j; k++) {
          const pair: [number, number][] = [
            [i, k],
            [k + 1, j],
          ];
          for (const [a, b] of pair) {
            total++;
            if ((f.get(`${a},${b}`) as number) < me) ready++;
            reads.push(name(a, b));
          }
        }
        return [
          `${me} 번째`,
          cellName(i, j),
          String(j - i + 1),
          reads.join(" · "),
        ];
      });
    return withNote(
      md(["정한 차례", "칸", "길이", "읽은 칸 (그 칸을 정한 차례)"], rows, [2]),
      `읽은 칸 ${total} 개 가운데 ${ready} 개가 지금 칸보다 먼저 정해져 있었습니다.`,
    );
  },

  /** `deep.build` 4단계 — 칸마다 그 구간만 따로 호출한 답과 같은가. */
  "build-answer": () => {
    let same = 0;
    const rows = cellsInOrder(N).map(([i, j]) => {
      const sub = WALK.slice(i - 1, j + 1);
      const r = call(sub);
      if (r === dpOf(i, j)) same++;
      return [
        cellName(i, j),
        comma(dpOf(i, j)),
        `matrixChainMultiplication(${label(sub)})`,
        comma(r),
      ];
    });
    return withNote(
      md(["칸", "칸의 값", "그 구간만 따로 호출", "반환값"], rows, [1, 3]),
      `${rows.length} 칸 가운데 ${same} 칸에서 칸의 값과, 그 구간의 차원만 넘긴 호출의 답이 같습니다.`,
    );
  },

  /** `deep.build` 전제 — 합치는 비용이 조각 안의 배치와 무관한가. */
  "build-premise": () => {
    const list = enumerateParen(WALK, 1, N).sort((x, y) => x.k - y.k);
    const byK = new Map<number, Set<number>>();
    const rows = list.map((x) => {
      const join =
        (WALK[0] as number) * (WALK[x.k] as number) * (WALK[N] as number);
      const s = byK.get(x.k) ?? new Set<number>();
      s.add(join);
      byK.set(x.k, s);
      return [
        x.expr,
        `k = ${x.k}`,
        `${WALK[0]}×${WALK[x.k]}${과와(`${WALK[0]}×${WALK[x.k]}`)} ${WALK[x.k]}×${WALK[N]}`,
        comma(join),
      ];
    });
    if (![...byK.values()].every((s) => s.size === 1)) {
      throw new Error("같은 바깥 괄호 자리인데 마지막 곱셈의 비용이 둘이다");
    }
    return withNote(
      md(
        [
          "배치",
          "바깥 괄호 자리",
          "마지막에 곱하는 두 행렬",
          "마지막 곱셈의 비용",
        ],
        rows,
        [3],
      ),
      `배치 ${rows.length} 가지 모두에서 마지막 곱셈의 비용이 바깥 괄호 자리 k 하나로 정해집니다. 같은 k 인 배치끼리는 조각 안을 어떻게 묶었든 그 비용이 같습니다.`,
    );
  },

  /** `deep.build` 설계 선택 — 채우는 차례 넷. */
  "build-orders": () => {
    const inputs = [WALK, [10, 20, 30, 40, 30], [2, 3, 4, 2, 5]];
    const orders: [string, FillOrder][] = [
      ["구간 길이가 짧은 칸부터", "len"],
      ["i 를 n 부터 · j 를 i 부터", "rowDesc"],
      ["j 를 1 부터 · i 를 j 부터 거꾸로", "colAsc"],
      ["i 를 1 부터 · j 를 i 부터", "rowAsc"],
    ];
    const rows = orders.map(([name, o]) => {
      const r = fillByOrder(WALK, o).reads;
      return [
        name,
        ...inputs.map((p) => comma(fillByOrder(p, o).answer)),
        `${r.ready} / ${r.total}`,
      ];
    });
    const good = orders.filter(([, o]) => {
      const r = fillByOrder(WALK, o).reads;
      return (
        r.ready === r.total &&
        inputs.every((p) => fillByOrder(p, o).answer === call(p))
      );
    }).length;
    return withNote(
      md(
        ["채우는 차례", ...inputs.map(label), "읽을 때 정해져 있던 칸"],
        rows,
        [1, 2, 3, 4],
      ),
      `차례 ${orders.length} 가지 가운데 ${good} 가지는 읽는 칸이 늘 먼저 정해져 있고, 세 입력의 답도 정본과 같습니다. 칸 수와 후보 수는 네 차례가 모두 같습니다.`,
    );
  },

  /** `deep.walk` 도입 — 전개가 쓰는 입력과 그것을 고른 까닭. */
  "walk-input": () =>
    open(
      `const dims = ${label(WALK)};\n// 이 절이 끝나면 ${call(WALK)} 이 나와야 한다 — ${parenOf(1, N)}`,
      "ts",
    ),

  /** `deep.walk` 도입 — 그 입력을 고른 까닭이 되는 값. */
  "walk-input-why": () => {
    const c13 = candsOf(1, N - 1).map((c) => c.cost);
    const c14 = candsOf(1, N).map((c) => c.cost);
    const list = enumerateParen(WALK, 1, N).map((x) => x.cost);
    const at = (xs: number[]) => `${xs.indexOf(Math.min(...xs)) + 1} 번째`;
    const r = (xs: number[]) => ratio(Math.max(...xs), Math.min(...xs));
    return withNote(
      md(
        ["자리", "값", "가장 작은 값", "가장 큰 값 ÷ 가장 작은 값"],
        [
          [
            `${cellName(1, N - 1)} 의 후보`,
            c13.map(comma).join(" · "),
            at(c13),
            r(c13),
          ],
          [
            `${cellName(1, N)} 의 후보`,
            c14.map(comma).join(" · "),
            at(c14),
            r(c14),
          ],
          ["괄호 배치 다섯", list.map(comma).join(" · "), at(list), r(list)],
        ],
        [3],
      ),
      `${cellName(1, N)} 에서는 후보 ${c14.length} 개 가운데 ${at(c14)}${이가(at(c14))} 가장 작습니다.`,
    );
  },

  /** `deep.walk.step` 1 — 대각선만 정한 DP 테이블과 행렬이 한 개 이하인 입력. */
  "walk-init": () => {
    const head = `      ${Array.from({ length: N }, (_, c) => `j=${c + 1}`.padStart(5)).join("")}`;
    const lines = Array.from({ length: N }, (_, r) => {
      const cells = Array.from({ length: N }, (_, c) => {
        const v = c < r ? "-" : c === r ? String(dpOf(r + 1, r + 1)) : ".";
        return v.padStart(5);
      }).join("");
      return `  i=${r + 1}${cells}`;
    });
    return open(
      [
        head,
        ...lines,
        "        -  = i > j 라 구간이 아니다",
        "        .  = 아직 안 정했다 (0 이 깔려 있다)",
        "",
        `matrixChainMultiplication([10])      →  ${call([10])}   행렬 0 개 — ① 이 바로 돌려준다`,
        `matrixChainMultiplication([10, 20])  →  ${call([10, 20])}   행렬 1 개 — ① 이 바로 돌려준다`,
      ].join("\n"),
    );
  },

  /** `deep.walk.step` 2 — 두 반복문이 칸을 고르는 차례. */
  "walk-order": () => {
    const lines: string[] = [];
    for (let L = 2; L <= N; L++) {
      const cells: string[] = [];
      for (let i = 1; i + L - 1 <= N; i++) cells.push(cellName(i, i + L - 1));
      lines.push(`L = ${L}   ${cells.join(" → ")}`);
    }
    lines.push("  └ 길이 L 인 칸을 다 정한 뒤에 길이 L+1 로 간다");
    return open(lines.join("\n"));
  },

  /** `deep.walk.step` 3 — 길이 3 인 구간 둘의 후보. */
  "walk-branch": () => {
    const lines: string[] = [];
    for (const [i, j] of cellsInOrder(N).filter(([a, b]) => b - a + 1 === 3)) {
      const name = span(i, j);
      candsOf(i, j).forEach((c, t) => {
        const headTxt = t === 0 ? name : " ".repeat(name.length);
        lines.push(
          `  ${headTxt}   k=${c.k}   ${cellName(c.i, c.k)}=${comma(c.left)} + ${cellName(c.k + 1, c.j)}=${comma(c.right)} + (${joinExpr(WALK, c.i, c.k, c.j)}) = ${comma(c.cost)}   ${c.branch === "less" ? "③" : "④"}`,
        );
      });
      lines.push(
        `  ${" ".repeat(name.length)}   → ${cellName(i, j)} = ${comma(dpOf(i, j))}, 고른 k = ${splitOf(i, j)}`,
      );
      lines.push("");
    }
    return open(lines.join("\n").trimEnd());
  },

  /** `deep.walk.pause` — 비용이 가장 작은 이웃 쌍부터 곱하면 언제 최소를 놓치는가. */
  "greedy-systems": () => {
    const rows = SAMPLES.map((p) => [
      label(p),
      comma(cheapestPairFirst(p).total),
      comma(call(p)),
    ]);
    const same = SAMPLES.filter(
      (p) => cheapestPairFirst(p).total === call(p),
    ).length;
    return withNote(
      bare(mdR(["차원 배열", "비용이 작은 이웃 쌍부터 곱한 판", "최소"], rows)),
      `${SAMPLES.length} 입력 가운데 ${same} 입력에서 두 값이 같습니다.`,
    );
  },

  /** `deep.walk.pause` — 전개 입력에서 그 방법이 걷는 길. */
  "greedy-walk": () => {
    const g = cheapestPairFirst(WALK);
    const lines = [`${label(WALK)} 에서 비용이 가장 작은 쌍부터 곱하면`, ""];
    g.steps.forEach((s, t) => {
      const next = [...s.dims];
      next.splice(s.at, 1);
      const pairs = s.others.map((c) => comma(c)).join(" · ");
      lines.push(
        `  ${t + 1}) 이웃 쌍의 비용 ${pairs} 가운데 ${comma(s.cost)}${을를(comma(s.cost))} 곱한다 → 차원 배열 ${label(next)}`,
      );
    });
    lines.push(
      `     합 ${g.steps.map((s) => comma(s.cost)).join(" + ")} = ${comma(g.total)}`,
    );
    const k = splitOf(1, N);
    const l = dpOf(1, k);
    const r = dpOf(k + 1, N);
    const join =
      (WALK[0] as number) * (WALK[k] as number) * (WALK[N] as number);
    lines.push(
      "",
      `최소는 ${parenOf(1, N)}`,
      `  ${comma(l)} + ${comma(r)} + (${joinExpr(WALK, 1, k, N)} = ${comma(join)}) = ${comma(l + r + join)}`,
      `     └ 두 조각을 각각 먼저 곱해 ${WALK[0]}×${WALK[k]}${과와(`${WALK[0]}×${WALK[k]}`)} ${WALK[k]}×${WALK[N]}${으로(`${WALK[N]}`)} 만들면 합치는 비용이 ${comma(join)} 뿐이다`,
    );
    return open(lines.join("\n"));
  },

  /** `deep.walk.pause` — 가운데에서 가르는 규칙은 DP 테이블 안에서 먼저 갈린다. */
  "mid-split": () => {
    const mid = fixedSplit(WALK, "mid");
    const rows: string[][] = [
      [
        `전개 입력의 ${cellName(2, N)}`,
        comma(mid.dp[2]?.[N] as number),
        comma(dpOf(2, N)),
      ],
      [
        `전개 입력의 답 ${cellName(1, N)}`,
        comma(mid.answer),
        comma(call(WALK)),
      ],
    ];
    for (const p of SAMPLES.slice(2)) {
      rows.push([
        `${label(p)} 의 답`,
        comma(fixedSplit(p, "mid").answer),
        comma(call(p)),
      ]);
    }
    const worst = SAMPLES[3] as readonly number[];
    const a = fixedSplit(worst, "mid").answer;
    const b = call(worst);
    return withNote(
      bare(mdR(["자리", "가운데에서 가른 판", "k 를 전부 시험한 판"], rows)),
      `전개 입력의 답은 두 방법 모두 ${comma(mid.answer)} 이지만, 그 안의 ${cellName(2, N)}${은는(cellName(2, N))} ${comma(mid.dp[2]?.[N] as number)} 대 ${comma(dpOf(2, N))} 입니다. ${label(worst)} 의 답은 ${comma(a)} 대 ${comma(b)}${으로(comma(b))} ${ratio(a, b)} 배 어긋나요.`,
    );
  },

  /** `deep.walk.pause` — 틀린 칸이 답에 안 쓰이는 까닭. */
  "mid-table": () => {
    const mid = fixedSplit(WALK, "mid");
    const k = Math.floor((1 + N) / 2);
    const head = `      ${Array.from({ length: N }, (_, c) => `j=${c + 1}`.padStart(8)).join("")}`;
    const lines = Array.from({ length: N }, (_, r) => {
      const i = r + 1;
      const cells = Array.from({ length: N }, (_, c) =>
        (c < r ? "-" : comma(mid.dp[i]?.[c + 1] as number)).padStart(8),
      ).join("");
      const off = Array.from({ length: N }, (_, c) => c + 1).filter(
        (j) => j >= i && mid.dp[i]?.[j] !== dpOf(i, j),
      );
      const note = off.length
        ? `   ← 최소가 아닌 칸 ${off.map((j) => cellName(i, j)).join(" · ")}`
        : "";
      return `  i=${i}${cells}${note}`;
    });
    return open(
      [
        `${cellName(1, N)} 을 가운데에서 가르면 k = ${k} 다`,
        `  읽는 칸이 ${cellName(1, k)}${과와(cellName(1, k))} ${cellName(k + 1, N)} — 둘 다 길이 2 라 후보가 하나뿐이다`,
        `  ${cellName(2, N)}${은는(cellName(2, N))} k=1 후보가 읽는 칸인데, 그 후보를 만들지 않았다`,
        "",
        head,
        ...lines,
      ].join("\n"),
    );
  },

  /** `deep.walk.step` 4 — 열두 걸음의 조건 판정. */
  "walk-trace": () => {
    const steps = walkSteps();
    const t = trace(WALK);
    const rows: string[][] = [];
    rows.push([
      steps[0]?.id as string,
      "대각선 넷",
      "1",
      "첫 걸음 → ②",
      "—",
      "0",
    ]);
    t.cands.forEach((c, n) => {
      const mark = c.branch === "less" ? "③" : "④";
      const truth = c.branch === "less" ? "참" : "거짓";
      rows.push([
        steps[n + 1]?.id as string,
        `${cellName(c.i, c.j)}, k=${c.k}`,
        String(c.L),
        `\`${comma(c.cost)} < ${fmt(c.before)}\` **${truth}** → ${mark}`,
        `${comma(c.left)} + ${comma(c.right)} + ${comma(c.join)} = ${comma(c.cost)}`,
        c.last
          ? `${cellName(c.i, c.j)} = ${comma(c.after)}`
          : `best ${comma(c.after)}`,
      ]);
    });
    rows.push([
      steps.at(-1)?.id as string,
      cellName(1, N),
      String(N),
      "읽기",
      "—",
      `${comma(t.result)} 반환`,
    ]);
    const less = t.cands.filter((c) => c.branch === "less").length;
    const not = t.cands.length - less;
    return withNote(
      md(
        ["단계", "칸 · 가르는 자리", "길이", "조건 판정", "후보", "남긴 값"],
        rows,
        [2],
      ),
      `① 은 이 입력에서 0 번, ② 는 대각선 ${N} 칸, ③ 은 ${less} 번, ④ 는 ${not} 번 실행됐고, 반환값은 ${comma(t.result)} 입니다.`,
    );
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": () => {
    const list: number[][] = [
      WALK,
      [10, 30, 5, 60],
      [10, 20, 30, 40, 30],
      [40, 20, 30, 10, 30],
      [2, 3, 4, 2, 5],
      [5, 5, 5, 5],
      [1, 1, 1, 1, 1],
      [5, 10, 3],
      [10, 20],
      [10],
      [500, 500, 500],
    ];
    const names = list.map((p) => `matrixChainMultiplication(${label(p)})`);
    const w = Math.max(...names.map((s) => s.length));
    return open(
      list
        .map((p, t) => `${pad(names[t] as string, w)}  →  ${comma(call(p))}`)
        .join("\n"),
    );
  },

  /** `related` — 고른 자리마다 삼각형 하나, 무게의 합이 답. */
  "related-triangles": () => {
    const tris = triangles();
    const rows = tris.map((x) => [
      `${cellName(x.i, x.j)}, k = ${x.k}`,
      `(v${x.i - 1}, v${x.k}, v${x.j})`,
      `${joinExpr(WALK, x.i, x.k, x.j)} = ${comma(x.weight)}`,
    ]);
    const sum = tris.reduce((s, x) => s + x.weight, 0);
    const ans = comma(call(WALK));
    return withNote(
      md(["고른 칸과 가르는 자리", "삼각형", "무게"], rows),
      `삼각형 ${tris.length} 개의 무게를 더하면 ${comma(sum)} 이고, 정본의 답 ${ans}${과와(ans)} 같습니다.`,
    );
  },

  /** `purpose.fit` — 규모가 열 배면 후보는 몇 배인가. */
  "purpose-scale": () =>
    open(
      table(
        ["행렬 수 n", "후보 (n³−n)/6", "초당 1 억 번일 때"],
        [N_MAX, 1_000].map((n) => [
          comma(n),
          comma(candidates(n)),
          `${(candidates(n) / 1e8).toFixed(4)} 초`,
        ]),
      ),
    ),

  /** `purpose.real` — 인용한 문서의 예시와 행렬 셋에서의 갈림. */
  "multi-dot": () => {
    const three = [10, 100, 5, 50];
    const [a0, a1b0, b1c0, c1] = three as [number, number, number, number];
    return open(
      table(
        ["무엇", "값"],
        [
          [
            "인용한 예시 ((AB)C) 의 비용",
            comma(a0 * a1b0 * b1c0 + a0 * b1c0 * c1),
          ],
          [
            "인용한 예시 (A(BC)) 의 비용",
            comma(a1b0 * b1c0 * c1 + a0 * a1b0 * c1),
          ],
          [`이 글의 코드가 ${label(three)} 에서 내는 답`, comma(call(three))],
          ["행렬 셋에서 DP 테이블이 만드는 후보 수", comma(candidates(3))],
          ["행렬 셋에서 DP 테이블이 잡는 칸 수", comma(tableCells(3))],
          ["인용한 닫힌 비교가 계산하는 값의 수", "2"],
          [
            `행렬 ${N_MAX} 개에서 DP 테이블이 만드는 후보 수`,
            comma(candidates(N_MAX)),
          ],
        ],
      ),
    );
  },

  /** `deep.math` ② — 전개 입력의 다섯 배치를 정의에서 직접 센다. */
  "paren-walk": () => {
    const list = enumerateParen(WALK, 1, N).sort((a, b) => a.cost - b.cost);
    const body = table(
      ["전개 입력의 괄호 배치", "곱셈 횟수"],
      list.map((x) => [x.expr, comma(x.cost)]),
    );
    return open(
      `${body}\n\n배치 수 = ${comma(list.length)} · 최솟값 = ${comma(call(WALK))}`,
    );
  },

  /** `deep.math` ③ — 전이식을 `i = 1 · j = 4` 로 검산한다. */
  "math-check-m": () => {
    const cs = candsOf(1, N);
    const terms = cs
      .map((c) => `${comma(c.left)} + ${comma(c.right)} + ${comma(c.join)}`)
      .join(" ,  ");
    return open(
      [
        `M(1,${N}) = min( ${terms} )`,
        `       = min( ${cs.map((c) => comma(c.cost)).join(" , ")} )`,
        `       = ${comma(dpOf(1, N))}        파트 1 의 ${cellName(1, N)}${과와(cellName(1, N))} 같다`,
      ].join("\n"),
    );
  },

  /** `deep.math` ③ — 배치 수 점화식을 그대로 옮긴 조각과 그 값. */
  "math-code-p": () => {
    const P = (n: number) => parenByRecurrence(n);
    const parts: string[] = [];
    const vals: string[] = [];
    for (let q = 1; q < N; q++) {
      parts.push(`P(${q})P(${N - q})`);
      vals.push(String(P(q) * P(N - q)));
    }
    return open(
      [
        "// 식을 그대로 옮긴 조각. 합의 첨자 q 도 식과 같게 둔다.",
        "const P = (n: number): number => {",
        "  if (n <= 1) return 1;",
        "  let sum = 0;",
        "  for (let q = 1; q < n; q++) sum += P(q) * P(n - q);",
        "  return sum;",
        "};",
        "",
        `P(${N}); // ${parts.join(" + ")} = ${vals.join(" + ")} = ${P(N)}`,
      ].join("\n"),
      "ts",
    );
  },

  /** `deep.math` ③ — 닫힌 형태를 `n = 4` 로 검산한다. */
  "math-closed-check": () => {
    const b = binom(2 * N - 2, N - 1);
    const p = String(parenByRecurrence(N));
    return open(
      [
        `n = ${N} 로 검산한다`,
        `  C(${2 * N - 2}, ${N - 1}) / ${N} = ${b} / ${N} = ${b / BigInt(N)}        위 조각이 낸 ${p}${과와(p)} 같다`,
      ].join("\n"),
    );
  },

  /** `deep.math` ②·③ — 괄호 배치 수를 전수·점화식·닫힌 형태로 맞춘다. */
  "paren-count": () =>
    open(
      table(
        [
          "행렬 수 n",
          "전수로 세어 본 배치",
          "점화식 P(n)",
          "닫힌 형태 C(2n−2, n−1)/n",
          "후보 총수 (n³−n)/6",
        ],
        [2, 3, 4, 5, 6, 8, 10].map((n) => [
          comma(n),
          comma(enumerateParen(genDims(n), 1, n).length),
          comma(parenByRecurrence(n)),
          comma(parenClosed(n)),
          comma(candidates(n)),
        ]),
      ),
    ),

  /** `deep.math` ③ — 후보 총수의 합을 작은 `n` 으로 검산한다. */
  "math-cand-check": () => {
    const rows = [4, 5].map((n) => {
      const terms: string[] = [];
      let sum = 0;
      for (let L = 2; L <= n; L++) {
        terms.push(`${n - L + 1}·${L - 1}`);
        sum += (n - L + 1) * (L - 1);
      }
      return [
        `n = ${n}`,
        `${terms.join(" + ")} = ${sum}`,
        `(${n}³ − ${n})/6 = ${n ** 3 - n}/6 = ${candidates(n)}`,
      ];
    });
    return open(
      table(["행렬 수", "길이별 (구간 수 · 후보 수) 의 합", "닫힌 형태"], rows),
    );
  },

  /** `deep.math` ④ — 닫힌 형태에 규모의 위 끝을 넣는다. */
  "paren-scale": () => {
    const n = N_MAX;
    return open(
      table(
        ["무엇", "값"],
        [
          [`행렬 ${n} 개의 괄호 배치 수`, big(parenClosed(n))],
          ["그 값의 자릿수", comma(String(parenClosed(n)).length)],
          ["DP 테이블이 만드는 후보 총수 (n³−n)/6", comma(candidates(n))],
          ["DP 테이블이 잡는 칸 수 (n+1)²", comma(tableCells(n))],
          [
            "배치 수가 후보 총수의 몇 배인가 — 그 배수의 자릿수",
            comma(String(parenClosed(n) / BigInt(candidates(n))).length),
          ],
        ],
      ),
    );
  },

  /** `invariant` ② — 길이 4 를 정하는 동안 읽은 칸. */
  "invariant-reads": () => {
    const lines = [`L=${N} 를 정하는 동안 읽은 자리를 전부 적으면`, ""];
    const lens = new Set<number>();
    const rows: string[][] = [];
    for (const c of candsOf(1, N)) {
      lens.add(c.k - c.i + 1);
      lens.add(c.j - c.k);
      rows.push([
        `k=${c.k}`,
        `${cellName(c.i, c.k)}=${comma(c.left)}`,
        `${cellName(c.k + 1, c.j)}=${comma(c.right)}`,
        `${joinExpr(WALK, c.i, c.k, c.j)}=${comma(c.join)}`,
        comma(c.cost),
      ]);
    }
    lines.push(
      table(
        ["가르는 자리", "왼쪽 조각", "오른쪽 조각", "합치기", "후보"],
        rows,
      ),
    );
    lines.push(
      `          └ 읽은 ${(N - 1) * 2} 칸의 길이가 ${[...lens].sort().join(" · ")} 뿐이고 전부 이미 정해져 있다`,
    );
    return open(lines.join("\n"));
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const top = [DIM_MAX, DIM_MAX, DIM_MAX];
    const cases: [string, number[], string][] = [
      ["[10] (행렬 0 개)", [10], "첫 분기가 잡는다"],
      ["[10, 20] (행렬 1 개)", [10, 20], "첫 분기가 잡는다"],
      ["[5, 10, 3] (행렬 2 개)", [5, 10, 3], "L=2 한 칸, 후보 하나"],
      [
        "[5, 5, 5, 5] (차원이 전부 같다)",
        [5, 5, 5, 5],
        "모든 배치의 곱셈 횟수가 한 가지",
      ],
      ["[1, 1, 1, 1, 1] (차원이 전부 1)", [1, 1, 1, 1, 1], "곱셈 한 번마다 1"],
      [`${label(top)} (차원이 위 끝)`, top, "후보 하나"],
    ];
    const same = [5, 5, 5, 5];
    const costs = new Set(enumerateParen(same, 1, 3).map((x) => x.cost));
    const ones = [1, 1, 1, 1, 1];
    return withNote(
      md(
        ["차원 배열", "DP 테이블에서 일어나는 일", "반환값"],
        cases.map(([name, p, what]) => [name, what, comma(call(p))]),
        [2],
      ),
      `${label(same)} 의 배치 ${enumerateParen(same, 1, 3).length} 가지가 내는 곱셈 횟수는 ${[...costs].map(comma).join(" · ")} 한 가지이고, ${label(ones)} 은 곱셈 ${ones.length - 2} 번이 한 번마다 1 이라 ${call(ones)} 입니다.`,
    );
  },

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  "mutant-join-dim": () =>
    open(
      table(
        ["차원 배열", "바른 코드", "만나는 차원을 옆 칸에서 읽은 코드"],
        변이표.map((p) => [label(p), comma(call(p)), comma(mutated(p))]),
      ),
    ),

  /** `invariant` ③ — 그 변이가 `dp[1][4]` 의 k=2 후보에서 더하는 수. */
  "invariant-mutant-join": () => {
    const k = splitOf(1, N);
    const good =
      (WALK[0] as number) * (WALK[k] as number) * (WALK[N] as number);
    const bad = mutantJoin(WALK, 1, k, N);
    return open(
      [
        `${cellName(1, N)} 의 k=${k} 후보에서 합치는 비용`,
        "",
        `  바른 코드   두 조각이 ${WALK[0]}×${WALK[k]}${과와(`${WALK[0]}×${WALK[k]}`)} ${WALK[k]}×${WALK[N]}${josa(`${WALK[N]}`, "이라", "라")}    →  ${WALK[0]} · ${WALK[k]} · ${WALK[N]} = ${comma(good)}`,
        `  바뀐 코드   가운데를 p[${k + 1}] = ${WALK[k + 1]}${으로(`${WALK[k + 1]}`)} 읽어   →  ${WALK[0]} · ${WALK[k + 1]} · ${WALK[N]} = ${comma(bad)}`,
        "                └ 두 조각의 실제 크기와 아무 관계 없는 수를 더한다",
      ].join("\n"),
    );
  },

  /** `perf.derive` — 길이마다 후보 수를 세고 총식에 넣는다. */
  "perf-derive": () => {
    const steps = walkSteps();
    const t = trace(WALK);
    const rows: string[][] = [];
    let total = 0;
    let at = 1;
    for (let L = 2; L <= N; L++) {
      const cnt = N - L + 1;
      const per = L - 1;
      const ids = steps.slice(at, at + cnt * per).map((x) => x.id);
      at += cnt * per;
      total += cnt * per;
      rows.push([
        `L = ${L}`,
        String(cnt),
        String(per),
        String(cnt * per),
        ids.join(" · "),
      ]);
    }
    if (total !== t.cands.length) {
      throw new Error("길이별 후보 합이 실제 후보 수와 다르다");
    }
    rows.push([
      "합계",
      "",
      "",
      String(total),
      `(${N}³ − ${N})/6 = ${candidates(N)}`,
    ]);
    const bytes = tableCells(N_MAX) * 8;
    return withNote(
      md(
        [
          "구간 길이",
          "구간 수 n − L + 1",
          "구간마다 후보 L − 1",
          "후보",
          "걸음",
        ],
        rows,
        [1, 2, 3],
      ),
      `행렬 ${N_MAX} 개면 잡는 칸 ${comma(tableCells(N_MAX))} 개 · 쓰는 칸 ${comma(usedCells(N_MAX))} 개 · 후보 ${comma(candidates(N_MAX))} 개이고, 칸 하나를 8 바이트 수로 두면 DP 테이블은 ${comma(bytes)} 바이트입니다.`,
    );
  },

  /** `perf.worst` — 입력의 내용이 후보 수를 가르는가. */
  "worst-fill": () => {
    const n = N_MAX;
    const inputs: [string, number[]][] = [
      ["차원이 전부 1", new Array<number>(n + 1).fill(1)],
      [`차원이 전부 ${DIM_MAX}`, new Array<number>(n + 1).fill(DIM_MAX)],
      [
        `1 과 ${DIM_MAX} 이 번갈아`,
        Array.from({ length: n + 1 }, (_, t) => (t % 2 === 0 ? 1 : DIM_MAX)),
      ],
      ["(13t mod 50) + 1", genDims(n)],
      [
        `1 부터 ${n + 1} 까지 오름차순`,
        Array.from({ length: n + 1 }, (_, t) => t + 1),
      ],
    ];
    const counts = inputs.map(([, p]) => trace(p).cands.length);
    const answers = inputs.map(([, p]) => call(p));
    if (new Set(counts).size !== 1)
      throw new Error("입력마다 후보 수가 다르다");
    return withNote(
      bare(
        mdR(
          [`입력 (행렬 ${n} 개)`, "답", "후보 수"],
          inputs.map(([name], t) => [
            name,
            comma(answers[t] as number),
            comma(counts[t] as number),
          ]),
        ),
      ),
      `답은 ${comma(Math.min(...answers))} 부터 ${comma(Math.max(...answers))} 까지 갈리는데, 후보 수는 다섯 입력 모두 ${comma(counts[0] as number)} 개입니다. 시간의 최악은 행렬 수 하나로 정해지고, 그때 차원 값은 아무래도 좋습니다.`,
    );
  },

  /** `perf.worst` — 시간이 아니라 **답의 크기**를 최악으로 만드는 입력. */
  "answer-scale": () => {
    const p = new Array<number>(N_MAX + 1).fill(DIM_MAX);
    const answer = call(p);
    const one = DIM_MAX ** 3;
    return withNote(
      bare(
        mdR(
          ["무엇", "값"],
          [
            [
              `차원이 전부 ${DIM_MAX} · 행렬 ${N_MAX} 개일 때의 답`,
              comma(answer),
            ],
            ["배정밀도 정수가 정확한 상한", comma(Number.MAX_SAFE_INTEGER)],
            [
              "상한이 그 답의 몇 배인가",
              comma(Math.floor(Number.MAX_SAFE_INTEGER / answer)),
            ],
          ],
        ),
      ),
      `곱셈 한 번이 ${DIM_MAX}³ = ${comma(one)} 이고 곱셈이 ${N_MAX - 1} 번이라, 답이 ${comma(one)} × ${N_MAX - 1} = ${comma(one * (N_MAX - 1))} 입니다.`,
    );
  },

  /** `selfcheck` — 묻는 자리. */
  "selfcheck-q": () => {
    const steps = walkSteps();
    const t = trace(WALK);
    const idOf = (i: number, j: number) => {
      const n = t.cands.findIndex((c) => c.i === i && c.j === j && c.last);
      return steps[n + 1]?.id as string;
    };
    const line = (i: number, j: number) => {
      const k = splitOf(i, j);
      const c = candsOf(i, j).find((x) => x.k === k) as Cand;
      return `${idOf(i, j)} :  ${cellName(i, j)} = ${comma(c.left)} + ${comma(c.right)} + (${joinExpr(WALK, i, k, j)}) = ${comma(c.cost)}   고른 k = ${k}`;
    };
    return open(
      [
        line(1, N - 1),
        line(2, N),
        "      두 값이 각각 뜻하는 배치 = ?     ← 이 자리를 직접 채워 봅시다",
      ].join("\n"),
    );
  },

  /** `selfcheck` — 답. */
  "selfcheck-a": () => {
    const row = (i: number, j: number) => {
      const k = splitOf(i, j);
      return [
        span(i, j),
        `k = ${k}`,
        `${span(i, k)} (${comma(dpOf(i, k))})`,
        `${span(k + 1, j)} (${comma(dpOf(k + 1, j))})`,
        parenOf(i, j),
      ];
    };
    const k13 = splitOf(1, N - 1);
    const k24 = splitOf(2, N);
    return withNote(
      md(
        ["구간", "가르는 자리", "왼쪽 조각", "오른쪽 조각", "배치"],
        [row(1, N - 1), row(2, N)],
      ),
      `${k13 === k24 ? `두 칸의 가르는 자리가 똑같이 k = ${k13} 인데` : `두 칸의 가르는 자리는 k = ${k13}${과와(String(k13))} k = ${k24} 이고`}, 왼쪽 조각에 든 행렬 수는 ${k13} 개와 ${k24 - 1} 개로 다릅니다.`,
    );
  },
};
