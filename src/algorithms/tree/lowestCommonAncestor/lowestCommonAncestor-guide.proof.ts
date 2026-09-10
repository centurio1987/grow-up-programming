/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.md
 *
 * **세는 사본은 `<name>-guide.alt.ts` 에 있다.** 정본은 배열 칸을 몇 번 읽었는지 내보내지
 * 않으므로 세는 자리만 덧붙인 사본이 필요한데, 그 사본을 이 파일과 대조 하네스가 각각 한 벌씩
 * 들면 계수 모델이 갈라진다. **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 매번 정본과
 * 답을 대조하고 어긋나면 던진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  BENCH_EDGES,
  BENCH_N,
  binary,
  caterpillar,
  chain,
  columns,
  type Edge,
  eulerSparse,
  liftCounted,
  naiveClimb,
  type Query,
  queries,
  rootTree,
  star,
  twoChains,
} from "./lowestCommonAncestor-guide.alt.ts";
import { lowestCommonAncestor } from "./lowestCommonAncestor-guide.ref.ts";

const REF = new URL("./lowestCommonAncestor-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 전개가 쓰는 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 갈래가 셋인 정점(1·5)이 있어 「이미 지나온 정점」 검사가 실제로
 * 실행되고, 질의 넷이 갈래 넷을 각각 한 번씩 실행한다.
 */
const WALK_N = 9;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [3, 6],
  [5, 7],
  [5, 8],
];
const WALK_QUERIES: Query[] = [
  [6, 4],
  [6, 7],
  [3, 6],
  [8, 7],
];

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

/* ────────────────────── 점프 크기 집합 ────────────────────── */

/** `0 ≤ d ≤ limit` 을 밑수 `B` 로 적었을 때 자리 수. */
function baseColumns(limit: number, B: number): number {
  let k = 0;
  let p = 1;
  while (p <= limit) {
    p *= B;
    k += 1;
  }
  return Math.max(k, 1);
}

/** `0 ≤ d ≤ limit` 중 밑수 `B` 자릿수 합의 최댓값. 그것이 질의 하나의 최대 점프 수다. */
function baseMaxJumps(limit: number, B: number): number {
  let best = 0;
  for (let d = 0; d <= limit; d++) {
    let sum = 0;
    let x = d;
    while (x > 0) {
      sum += x % B;
      x = Math.floor(x / B);
    }
    if (sum > best) best = sum;
  }
  return best;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = {
  lowestCommonAncestor: (
    n: number,
    edges: Edge[],
    root: number,
    qs: Query[],
  ) => number[];
};

/** 깊이를 맞춘 뒤의 같음 검사를 지운 판. 조상·자손 질의에서 답의 부모가 나온다. */
const noEarlyReturn = (): Promise<Ref> =>
  loadMutant<Ref>(REF, { drop: /^\s*if \(u === v\) return u;$/ });

/** 함께 올리기의 `k` 를 작은 쪽에서 큰 쪽으로 올린 판. */
const ascendingK = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /for \(let k = LOG - 1; k >= 0; k--\) \{/,
      "for (let k = 0; k < LOG; k++) {",
    ],
  });

/** 열 수를 30 으로 박은 판. 답은 그대로이고 표만 커진다. */
const fixedLog = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /const LOG = Math\.floor\(Math\.log2\(Math\.max\(n, 1\)\)\) \+ 1;/,
      "const LOG = 30;",
    ],
  });

/* ────────────────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────────────────── */

/** 변이와 정본에 똑같이 걸 입력 넷. */
const FOUR: [string, number, Edge[], number, Query[]][] = [
  ["전개가 쓰는 아홉 정점", WALK_N, WALK_EDGES, 0, WALK_QUERIES],
  [
    "조상·자손 질의만",
    4,
    chain(4),
    0,
    [
      [0, 3],
      [1, 3],
      [2, 2],
    ],
  ],
  [
    "완전 이진 트리 열다섯 정점",
    15,
    binary(15),
    0,
    [
      [7, 8],
      [7, 14],
      [11, 13],
      [3, 12],
    ],
  ],
  ["정점 하나", 1, [], 0, [[0, 0]]],
];

const mutantTable = async (
  label: string,
  make: () => Promise<Ref>,
): Promise<string> => {
  const mod = await make();
  const rows: string[][] = [["", "정본", label]];
  for (const [name, n, e, root, qs] of FOUR) {
    rows.push([
      name,
      `[${lowestCommonAncestor(n, e, root, qs).join(", ")}]`,
      `[${mod.lowestCommonAncestor(n, e, root, qs).join(", ")}]`,
    ]);
  }
  return table(rows).join("\n");
};

const NO_EARLY = await mutantTable("같음 검사를 지운다", noEarlyReturn);
const ASCENDING = await mutantTable("작은 k 부터 올라간다", ascendingK);
const BIG_LOG_MOD = await fixedLog();

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 한 칸씩 오르면 제약 규모에서 몇 번이 되는가. */
  "naive-climb": () => {
    const rows: string[][] = [
      [
        "사슬 정점 V",
        "한 칸씩 · 질의 하나",
        "표를 쓸 때 · 질의 하나",
        "몇 배",
        "한 칸씩 · 질의 V 개",
      ],
    ];
    for (const v of [9, 100, 1_000, 10_000, 100_000]) {
      const edges = chain(v);
      const qs: Query[] = [[0, v - 1]];
      const naive = naiveClimb(v, edges, 0, qs).moves;
      const lift = liftCounted(v, edges, 0, qs).jumps;
      rows.push([
        comma(v),
        comma(naive),
        comma(lift),
        `${Math.round(naive / lift).toLocaleString("en-US")}배`,
        comma(naive * v),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 가운데 두 칸은 정점을 위로 옮긴 횟수다. 오른쪽 칸은 같은 질의를 V 번 받았을 때의 합이고,
          제약 상한에서 100 억 번이 된다`;
  },

  /** 거리별로 한 칸씩 오르는 횟수와 2의 거듭제곱 점프 횟수. */
  "jump-vs-step": () => {
    const v = 64;
    const edges = chain(v);
    const rows: string[][] = [
      ["거리 d", "d 를 이진수로", "한 칸씩", "2의 거듭제곱 점프"],
    ];
    for (const d of [1, 2, 5, 7, 16, 31, 63]) {
      const qs: Query[] = [[v - 1 - d, v - 1]];
      const naive = naiveClimb(v, edges, 0, qs).moves;
      const jumps = (d.toString(2).match(/1/g) ?? []).length;
      rows.push([comma(d), d.toString(2), comma(naive), comma(jumps)]);
    }
    return `${table(rows, [0, 2, 3]).join("\n")}
        └ 오른쪽 칸은 왼쪽에서 둘째 칸에 1 이 몇 개인가와 같다. 정점 64 개짜리 사슬이다`;
  },

  /** 점프 크기를 밑수 B 의 거듭제곱으로 잡았을 때 열 수와 최대 점프 수. */
  "base-sweep": () => {
    const n = 100_000;
    const rows: string[][] = [
      [
        "점프 크기",
        "표의 열 수 K",
        "질의 하나의 최대 점프 J",
        "K + J",
        "큰 쪽",
      ],
    ];
    rows.push(["1 칸 하나뿐", "1", comma(n - 1), comma(n), comma(n - 1)]);
    for (const B of [2, 3, 4, 8, 16]) {
      const K = baseColumns(n - 1, B);
      const J = baseMaxJumps(n - 1, B);
      rows.push([
        `${B} 의 거듭제곱`,
        comma(K),
        comma(J),
        comma(K + J),
        comma(Math.max(K, J)),
      ]);
    }
    rows.push([
      "1 부터 V-1 까지 전부",
      comma(n - 1),
      "1",
      comma(n),
      comma(n - 1),
    ]);
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 정점 100,000 개 기준이다. K 는 정점마다 드는 칸 수이고 J 는 질의 하나가 하는 점프 수다`;
  },

  /** 전개가 쓰는 입력을 전체 코드로 실행한 값. */
  "walk-result": () => {
    const rows: string[][] = [["질의", "답", "무엇인가"]];
    const got = lowestCommonAncestor(WALK_N, WALK_EDGES, 0, WALK_QUERIES);
    const why = [
      "깊이를 한 칸 맞춘 뒤 갈라진다",
      "같은 깊이에서 뿌리까지 올라간다",
      "6 의 조상이 3 이라 맞추자마자 끝난다",
      "같은 부모를 공유한다",
    ];
    for (const [i, q] of WALK_QUERIES.entries()) {
      rows.push([
        `lca(${q[0]}, ${q[1]})`,
        comma(got[i] as number),
        why[i] as string,
      ]);
    }
    return `${table(rows, [1]).join("\n")}
        └ 반환값은 [${got.join(", ")}] 이다`;
  },

  /** 같음 검사를 지우면 무엇이 나오는가. */
  "mutant-no-early": () => NO_EARLY,

  /** 함께 올리기를 작은 k 부터 올라가면 무엇이 나오는가. */
  "mutant-ascending": () => ASCENDING,

  /** 열 수를 30 으로 박으면 답과 표 칸이 어떻게 되는가. */
  "mutant-big-log": () => {
    const rows: string[][] = [
      ["", "정본의 답", "열 수를 30 으로 박은 답", "정본의 표 칸", "박았을 때"],
    ];
    for (const [name, n, e, root, qs] of FOUR) {
      rows.push([
        name,
        `[${lowestCommonAncestor(n, e, root, qs).join(", ")}]`,
        `[${BIG_LOG_MOD.lowestCommonAncestor(n, e, root, qs).join(", ")}]`,
        comma(n * columns(n)),
        comma(n * 30),
      ]);
    }
    rows.push([
      "제약 상한 정점 100,000",
      "—",
      "—",
      comma(100_000 * columns(100_000)),
      comma(100_000 * 30),
    ]);
    return `${table(rows, [3, 4]).join("\n")}
        └ 답은 네 입력에서 모두 같고 표 칸만 커진다`;
  },

  /** 표의 정의(2^k 칸 위 조상)와 점화식으로 채운 값을 대조한다. */
  "table-check": () => {
    const { depth, parent } = rootTree(WALK_N, WALK_EDGES, 0);
    const LOG = columns(WALK_N);
    /** `v` 에서 위로 `d` 칸. 뿌리를 넘어가면 뿌리다. */
    const up = (v: number, d: number): number => {
      let x = v;
      for (let i = 0; i < d; i++) x = parent[x] as number;
      return x;
    };
    const anc: number[][] = Array.from({ length: WALK_N }, () =>
      Array.from({ length: LOG }, () => 0),
    );
    for (let v = 0; v < WALK_N; v++)
      (anc[v] as number[])[0] = parent[v] as number;
    for (let k = 1; k < LOG; k++) {
      for (let v = 0; v < WALK_N; v++) {
        const mid = (anc[v] as number[])[k - 1] as number;
        (anc[v] as number[])[k] = (anc[mid] as number[])[k - 1] as number;
      }
    }
    const rows: string[][] = [
      [
        "정점 v",
        "깊이",
        "정의대로 1·2·4·8 칸 위",
        "점화식으로 채운 표",
        "차이",
      ],
    ];
    for (let v = 0; v < WALK_N; v++) {
      const byDef = [0, 1, 2, 3].map((k) => up(v, 2 ** k));
      const byRec = [0, 1, 2, 3].map((k) => (anc[v] as number[])[k] as number);
      rows.push([
        comma(v),
        comma(depth[v] as number),
        byDef.join(" "),
        byRec.join(" "),
        byDef.every((x, i) => x === byRec[i]) ? "0" : "다르다",
      ]);
    }
    return `${table(rows, [0, 1, 4]).join("\n")}
        └ 없는 조상은 뿌리 0 으로 둔다. 아홉 정점 × 네 열에서 두 계산이 전부 같다`;
  },

  /** 함께 올리기가 실제로 올린 칸 수와 「답까지 남은 칸 − 1」을 대조한다. */
  "stage2-climb": () => {
    const n = 1_023;
    const edges = binary(n);
    const { depth, parent } = rootTree(n, edges, 0);
    const LOG = columns(n);
    const anc: number[][] = Array.from({ length: n }, () =>
      Array.from({ length: LOG }, () => 0),
    );
    for (let v = 0; v < n; v++) (anc[v] as number[])[0] = parent[v] as number;
    for (let k = 1; k < LOG; k++) {
      for (let v = 0; v < n; v++) {
        const mid = (anc[v] as number[])[k - 1] as number;
        (anc[v] as number[])[k] = (anc[mid] as number[])[k - 1] as number;
      }
    }
    const qs = queries(n, 4_000);
    let pairs = 0;
    let same = 0;
    const sample: string[][] = [
      [
        "질의",
        "한쪽 깊이",
        "다른 쪽 깊이",
        "답까지 h",
        "함께 올리기가 올린 칸",
        "h - 1",
      ],
    ];
    for (const [a, b] of qs) {
      let u = a;
      let v = b;
      if ((depth[u] as number) < (depth[v] as number)) {
        const swap = u;
        u = v;
        v = swap;
      }
      const gap = (depth[u] as number) - (depth[v] as number);
      for (let k = 0; k < LOG; k++) {
        if (((gap >> k) & 1) === 1) u = (anc[u] as number[])[k] as number;
      }
      if (u === v) continue;
      const startDepth = depth[u] as number;
      for (let k = LOG - 1; k >= 0; k--) {
        const uu = (anc[u] as number[])[k] as number;
        const vv = (anc[v] as number[])[k] as number;
        if (uu !== vv) {
          u = uu;
          v = vv;
        }
      }
      const answer = (anc[u] as number[])[0] as number;
      const h = startDepth - (depth[answer] as number);
      const climbed = startDepth - (depth[u] as number);
      pairs += 1;
      if (climbed === h - 1) same += 1;
      if (h >= 4 && sample.length <= 5) {
        sample.push([
          `lca(${a}, ${b})`,
          comma(depth[a] as number),
          comma(depth[b] as number),
          comma(h),
          comma(climbed),
          comma(h - 1),
        ]);
      }
    }
    return `${table(sample, [1, 2, 3, 4, 5]).join("\n")}
        └ 완전 이진 트리 정점 1,023 개에서 함께 올리기가 실행된 질의 ${comma(pairs)} 개 중
          「올린 칸 = h - 1」 인 것이 ${comma(same)} 개다`;
  },

  /** 배열 칸 접근을 닫힌 형태와 대조한다. */
  "cost-closed-form": () => {
    const rows: string[][] = [
      [
        "정점 V",
        "열 수 LOG",
        "실측 전처리",
        "닫힌 형태 12V + 4V·LOG - 9",
        "차이",
      ],
    ];
    for (const v of [9, 100, 1_000, 20_000]) {
      const edges = v === WALK_N ? WALK_EDGES : chain(v);
      const LOG = columns(v);
      const got = liftCounted(v, edges, 0, [[0, 0]]).setup;
      const closed = 12 * v + 4 * v * LOG - 9;
      rows.push([
        comma(v),
        comma(LOG),
        comma(got),
        comma(closed),
        comma(got - closed),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 제약 상한 V = 100,000 에서 LOG 가 ${columns(100_000)} 이므로 ${comma(12 * 100_000 + 4 * 100_000 * columns(100_000) - 9)} 칸이다`;
  },

  /** 최악을 만드는 입력 — 모양과 질의를 바꿔 가며 실제로 재 본다. */
  "shape-values": () => {
    const v = 20_000;
    const q = 20_000;
    const rows: string[][] = [
      ["입력 모양", "질의", "전처리 칸", "질의 칸", "합"],
    ];
    const shapes: [string, Edge[]][] = [
      ["한 줄로 이었다", chain(v)],
      ["별 모양이다", star(v)],
      ["완전 이진 트리다", binary(v)],
      ["애벌레다", caterpillar(v)],
      ["두 갈래 사슬이다", twoChains(v)],
    ];
    for (const [name, edges] of shapes) {
      const got = liftCounted(v, edges, 0, queries(v, q));
      rows.push([
        name,
        "골고루",
        comma(got.setup),
        comma(got.query),
        comma(got.setup + got.query),
      ]);
    }
    // 두 갈래 사슬에서 깊이 차이의 1 비트가 가장 많아지는 질의를 골라 다시 잰다.
    const half = Math.floor((v - 1) / 2);
    let gap = 0;
    let ones = 0;
    for (let d = 0; d <= half; d++) {
      const c = (d.toString(2).match(/1/g) ?? []).length;
      if (c > ones) {
        ones = c;
        gap = d;
      }
    }
    const worst: Query[] = [];
    for (let i = 0; i < q; i++) worst.push([half, half + 1 + (half - gap) - 1]);
    const got = liftCounted(v, twoChains(v), 0, worst);
    rows.push([
      "두 갈래 사슬이다",
      `깊이 차이 ${comma(gap)}`,
      comma(got.setup),
      comma(got.query),
      comma(got.setup + got.query),
    ]);
    return `${table(rows, [2, 3, 4]).join("\n")}
        └ 정점 20,000 개 · 질의 20,000 개다. 마지막 줄의 깊이 차이 ${comma(gap)} 은
          이진수로 ${gap.toString(2)} 이라 1 이 ${ones} 개다`;
  },

  /** 질의 수를 늘려 가며 두 설계의 배열 칸 접근을 잰다. */
  "alt-flip": () => {
    const n = BENCH_N;
    const edges = BENCH_EDGES;
    const total = (q: number): [number, number] => {
      const qs = queries(n, q);
      const a = liftCounted(n, edges, 0, qs);
      const b = eulerSparse(n, edges, 0, qs);
      return [a.setup + a.query, b.setup + b.query];
    };
    // 뒤집히는 자리를 10,000 개 단위로 재어 찾는다. 두 값이 질의 수에 대해 단조라 첫 자리 하나면 된다.
    let flip = 0;
    for (let q = 400_000; q <= 500_000; q += 10_000) {
      const [left, right] = total(q);
      if (right < left) {
        flip = q;
        break;
      }
    }
    const rows: string[][] = [
      ["질의 수", "2^k 조상 표", "오일러 투어와 희소 표", "어느 쪽이 적은가"],
    ];
    for (const q of [0, 100_000, 400_000, flip - 10_000, flip, 1_000_000]) {
      const [left, right] = total(q);
      rows.push([
        comma(q),
        comma(left),
        comma(right),
        left < right ? "조상 표" : "희소 표",
      ]);
    }
    return `${table(rows, [0, 1, 2]).join("\n")}
        └ 완전 이진 트리 정점 100,000 개 · 질의는 (i mod V, 37i mod V) 다.
          10,000 개 단위로 재어 뒤집히는 첫 자리가 ${comma(flip)} 이다`;
  },
};
