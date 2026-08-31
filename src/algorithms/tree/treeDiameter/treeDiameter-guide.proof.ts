/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/treeDiameter/treeDiameter-guide.md
 *
 * **세는 사본이 둘 있다**(`sweep`·`allStarts`). 정본은 배열 칸을 몇 번 읽었는지도, 시작
 * 정점마다의 값도 내보내지 않으므로 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「지름」 칸 중 옳은 쪽은 전부 정본이나
 * 정본에서 기계로 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { treeDiameter } from "./treeDiameter-guide.ref.ts";

type Edge = [number, number, number];

const REF = new URL("./treeDiameter-guide.ref.ts", import.meta.url).pathname;

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0 이 지름의 끝점이 **아니라서** 첫 탐색의 최댓값과 지름이
 * 갈리고, 갈래가 둘씩 있는 정점이 있어 「이미 거리를 정한 정점」 검사가 실제로 실행된다.
 */
const WALK_N = 7;
const WALK_EDGES: Edge[] = [
  [0, 1, 2],
  [0, 2, 3],
  [1, 3, 4],
  [1, 4, 1],
  [2, 5, 5],
  [5, 6, 2],
];

/** 가장 작은 비자명 트리 넷. 표에 나란히 놓는다. */
const FOUR: [string, number, Edge[]][] = [
  ["전개가 쓰는 일곱 정점", WALK_N, WALK_EDGES],
  [
    "별 모양 다섯 정점",
    5,
    [
      [0, 1, 1],
      [0, 2, 2],
      [0, 3, 3],
      [0, 4, 4],
    ],
  ],
  [
    "한 줄로 이은 다섯 정점",
    5,
    [
      [0, 1, 2],
      [1, 2, 2],
      [2, 3, 2],
      [3, 4, 2],
    ],
  ],
  ["정점 하나", 1, []],
];

/** 정점 `v` 개를 한 줄로 이은 트리. 가중치는 자리 번호를 9 로 나눈 나머지 + 1 이다. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, (i % 9) + 1]);
  return out;
}

/** 정점 0 이 나머지 전부와 이어진 트리. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i, (i % 9) + 1]);
  return out;
}

/** 완전 이진 트리 모양. 정점 `i` 의 부모가 `(i-1) >> 1` 이다. */
function binary(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([(i - 1) >> 1, i, (i % 9) + 1]);
  return out;
}

/** 애벌레 — 절반은 한 줄로 잇고 나머지 절반을 그 줄에 하나씩 매단다. */
function caterpillar(v: number): Edge[] {
  const spine = Math.floor(v / 2);
  const out: Edge[] = [];
  for (let i = 0; i + 1 < spine; i++) out.push([i, i + 1, (i % 9) + 1]);
  for (let i = spine; i < v; i++) out.push([i - spine, i, (i % 9) + 1]);
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

/** 정점마다의 이웃 목록. 정본과 같은 모양이다. */
function neighbours(n: number, edges: Edge[]): [number, number][][] {
  const near: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    (near[u] as [number, number][]).push([v, w]);
    (near[v] as [number, number][]).push([u, w]);
  }
  return near;
}

/**
 * 탐색 한 번. 배열 칸 접근을 함께 센다 — `dist` 초기화·읽기·쓰기와 스택의 넣기·꺼내기,
 * 그리고 이웃 목록의 한 칸 읽기를 각각 하나로 센다.
 */
function sweep(
  n: number,
  near: [number, number][][],
  start: number,
): { far: number; dist: number; cells: number; all: number[] } {
  const d: number[] = Array.from({ length: n }, () => -1);
  let cells = n;
  const stack: number[] = [start];
  d[start] = 0;
  cells += 2;
  let best = start;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    cells += 1;
    for (const [v, w] of near[u] as [number, number][]) {
      cells += 2;
      if ((d[v] as number) >= 0) continue;
      d[v] = (d[u] as number) + w;
      stack.push(v);
      cells += 3;
      if ((d[v] as number) > (d[best] as number)) best = v;
    }
  }
  return { far: best, dist: d[best] as number, cells, all: d };
}

/** 두 번 탐색 — 정본과 같은 절차를 세는 사본으로 옮긴 것. */
function twoSweeps(
  n: number,
  edges: Edge[],
): { answer: number; cells: number } {
  const near = neighbours(n, edges);
  const first = sweep(n, near, 0);
  const second = sweep(n, near, first.far);
  return {
    answer: second.dist,
    cells: first.cells + second.cells + 2 * edges.length,
  };
}

/** 정점마다 한 번씩 재는 방법 — 기법이 하나도 안 들어간 풀이다. */
function everyStart(
  n: number,
  edges: Edge[],
): { answer: number; cells: number } {
  const near = neighbours(n, edges);
  let cells = 2 * edges.length;
  let best = 0;
  for (let s = 0; s < n; s++) {
    const got = sweep(n, near, s);
    cells += got.cells;
    if (got.dist > best) best = got.dist;
  }
  return { answer: best, cells };
}

/** 시작 정점마다 첫 탐색의 최댓값과 그 뒤 한 번 더 잰 값. */
function allStarts(n: number, edges: Edge[]): [number, number, number][] {
  const near = neighbours(n, edges);
  const out: [number, number, number][] = [];
  for (let s = 0; s < n; s++) {
    const first = sweep(n, near, s);
    const second = sweep(n, near, first.far);
    out.push([first.dist, first.far, second.dist]);
  }
  return out;
}

/** 모든 정점 쌍 거리. 트리가 아닌 그래프에서는 최단 경로를 낸다(플로이드-워셜). */
function allPairsShortest(n: number, edges: Edge[]): number {
  const INF = Number.POSITIVE_INFINITY;
  const d: number[] = Array.from({ length: n * n }, () => INF);
  for (let i = 0; i < n; i++) d[i * n + i] = 0;
  for (const [u, v, w] of edges) {
    if (w < (d[u * n + v] as number)) {
      d[u * n + v] = w;
      d[v * n + u] = w;
    }
  }
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const viaK = (d[i * n + k] as number) + (d[k * n + j] as number);
        if (viaK < (d[i * n + j] as number)) d[i * n + j] = viaK;
      }
    }
  }
  let best = 0;
  for (const value of d) if (value !== INF && value > best) best = value;
  return best;
}

/** 트리에서 세 정점의 중앙점 — 세 쌍의 경로가 모두 지나는 유일한 정점. */
function median(
  dist: number[][],
  u: number,
  v: number,
  x: number,
): number | null {
  for (let m = 0; m < dist.length; m++) {
    const du = (dist[u] as number[])[m] as number;
    const dv = (dist[v] as number[])[m] as number;
    const dx = (dist[x] as number[])[m] as number;
    if (
      du + dv === ((dist[u] as number[])[v] as number) &&
      dv + dx === ((dist[v] as number[])[x] as number) &&
      du + dx === ((dist[u] as number[])[x] as number)
    ) {
      return m;
    }
  }
  return null;
}

/** 모든 정점 쌍 거리 표. 트리에서는 유일 경로의 길이다. */
function distanceTable(n: number, edges: Edge[]): number[][] {
  const near = neighbours(n, edges);
  return Array.from({ length: n }, (_, s) => sweep(n, near, s).all);
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { treeDiameter: (n: number, edges: Edge[]) => number };

/** 둘째 탐색의 출발점을 0 으로 되돌린 판. 첫 탐색의 최댓값이 그대로 답이 된다. */
const singleSweep = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /const \[, diameter\] = farthest\(a\);/,
      "const [, diameter] = farthest(0);",
    ],
  });

/** 거리를 누적하지 않고 간선 가중치만 적는 판. dist 가 「경로 길이」가 아니게 된다. */
const edgeOnly = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [/dist\[v\] = \(dist\[u\] as number\) \+ w;/, "dist[v] = w;"],
  });

/* ────────────────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────────────────── */

const mutantTable = async (
  label: string,
  make: () => Promise<Ref>,
  inputs: [string, number, Edge[]][],
): Promise<string> => {
  const mod = await make();
  const rows: string[][] = [["", "정본", label]];
  for (const [name, n, e] of inputs) {
    rows.push([name, comma(treeDiameter(n, e)), comma(mod.treeDiameter(n, e))]);
  }
  return table(rows, [1, 2]).join("\n");
};

const SINGLE = await mutantTable("한 번만 잰다", singleSweep, FOUR);
const EDGE_ONLY = await mutantTable("간선 가중치만 적는다", edgeOnly, FOUR);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 정점마다 한 번씩 재면 전개 입력에서 무엇이 나오는가. */
  "brute-walk": () => {
    const every = everyStart(WALK_N, WALK_EDGES);
    const two = twoSweeps(WALK_N, WALK_EDGES);
    if (
      every.answer !== two.answer ||
      two.answer !== treeDiameter(WALK_N, WALK_EDGES)
    ) {
      throw new Error("두 방법의 답이 갈린다");
    }
    return table(
      [
        ["", "탐색 횟수", "배열 칸 접근", "지름"],
        [
          "정점마다 한 번씩 잰다",
          comma(WALK_N),
          comma(every.cells),
          comma(every.answer),
        ],
        ["두 번만 잰다", "2", comma(two.cells), comma(two.answer)],
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 정점마다 한 번씩 재면 제약 규모에서 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["정점 V", "정점마다 한 번씩", "두 번만", "몇 배", "초당 1억 칸 기준"],
    ];
    for (const v of [7, 100, 1_000, 10_000]) {
      const edges = chain(v);
      const every = everyStart(v, edges);
      const two = twoSweeps(v, edges);
      rows.push([
        comma(v),
        comma(every.cells),
        comma(two.cells),
        `${(every.cells / two.cells).toFixed(1)}배`,
        `${(every.cells / 1e8).toFixed(3)}초`,
      ]);
    }
    // 제약 상한은 실제로 돌리기에 너무 커서 닫힌 형태로 낸다.
    const v = 100_000;
    const two = twoSweeps(v, chain(v));
    const every = Math.round((two.cells - 2 * (v - 1)) / 2) * v + 2 * (v - 1);
    rows.push([
      comma(v),
      comma(every),
      comma(two.cells),
      `${(every / two.cells).toFixed(1)}배`,
      `${(every / 1e8).toFixed(3)}초`,
    ]);
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 마지막 줄의 왼쪽 값만 닫힌 형태로 냈다 — 한 줄로 이은 정점 100,000 개에서
          정점마다 재는 것을 실제로 실행하면 900 억 칸이라 이 문서를 만들 때 안 끝난다`;
  },

  /** 시작 정점을 전부 바꿔 가며 첫 탐색의 최댓값과 두 번째 값을 잰다. */
  "all-starts": () => {
    const got = allStarts(WALK_N, WALK_EDGES);
    const rows: string[][] = [
      [
        "시작 정점 s",
        "첫 탐색의 최댓값",
        "가장 먼 정점 a",
        "a 에서 다시 잰 값",
      ],
    ];
    for (const [i, [first, far, second]] of got.entries()) {
      rows.push([comma(i), comma(first), comma(far), comma(second)]);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 왼쪽 값은 시작 정점마다 다르고 오른쪽 값은 일곱 번 다 같다`;
  },

  /** 한 번만 재면 무엇이 나오는가. */
  "mutant-single-sweep": () => SINGLE,

  /** 거리를 누적하지 않으면 무엇이 나오는가. */
  "mutant-edge-only": () => EDGE_ONLY,

  /** 트리가 아닌 그래프에 그대로 쓰면 무엇이 나오는가. */
  "not-a-tree": () => {
    const rows: string[][] = [
      ["입력", "이 코드가 낸 값", "실제 최대 최단거리"],
    ];
    for (const [name, n, edges] of [
      [
        "0-1-2 가 고리를 이루고 3 이 0 에 매달렸다",
        4,
        [
          [0, 1, 10],
          [0, 2, 1],
          [0, 3, 1],
          [1, 2, 1],
        ],
      ],
      [
        "같은 고리에 가중치만 다르다",
        4,
        [
          [0, 1, 3],
          [0, 2, 1],
          [0, 3, 4],
          [1, 2, 1],
        ],
      ],
      [
        "그 고리에서 간선 하나를 빼 트리로 만들었다",
        4,
        [
          [0, 1, 10],
          [0, 2, 1],
          [0, 3, 1],
        ],
      ],
    ] as [string, number, Edge[]][]) {
      rows.push([
        name,
        comma(treeDiameter(n, edges)),
        comma(allPairsShortest(n, edges)),
      ]);
    }
    return table(rows, [1, 2]).join("\n");
  },

  /** 전개가 쓰는 입력을 전체 코드로 실행한 값. */
  "walk-result": () => {
    const rows: string[][] = [["입력", "반환값"]];
    for (const [name, n, e] of FOUR)
      rows.push([name, comma(treeDiameter(n, e))]);
    return table(rows, [1]).join("\n");
  },

  /** 중앙점 보조정리를 전개 입력에서 값으로 확인한다. */
  "median-check": () => {
    const dist = distanceTable(WALK_N, WALK_EDGES);
    const rows: string[][] = [
      [
        "세 정점 u v x",
        "중앙점 m",
        "d(u,m)+d(m,v)",
        "d(u,v)",
        "d(v,m)+d(m,x)",
        "d(v,x)",
      ],
    ];
    for (const [u, v, x] of [
      [4, 3, 6],
      [0, 3, 6],
      [3, 4, 5],
      [6, 4, 2],
    ] as [number, number, number][]) {
      const m = median(dist, u, v, x);
      if (m === null) throw new Error(`중앙점이 없다 — ${u} ${v} ${x}`);
      rows.push([
        `${u} ${v} ${x}`,
        comma(m),
        comma(
          ((dist[u] as number[])[m] as number) +
            ((dist[m] as number[])[v] as number),
        ),
        comma((dist[u] as number[])[v] as number),
        comma(
          ((dist[v] as number[])[m] as number) +
            ((dist[m] as number[])[x] as number),
        ),
        comma((dist[v] as number[])[x] as number),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** 유도의 부등식 사슬을 트리 둘의 시작 정점 전부에서 값으로 확인한다. */
  "theorem-check": () => {
    const rows: string[][] = [
      [
        "트리",
        "시작 s",
        "a",
        "k",
        "j",
        "d(j,k)",
        "d(a, 반대쪽 끝)",
        "D + 2d(j,k)",
      ],
    ];
    for (const [label, n, edges, x, y] of [
      ["전개 입력", WALK_N, WALK_EDGES, 3, 6],
      [
        "별 모양 다섯",
        5,
        [
          [0, 1, 1],
          [0, 2, 2],
          [0, 3, 3],
          [0, 4, 4],
        ] as Edge[],
        4,
        3,
      ],
    ] as [string, number, Edge[], number, number][]) {
      const dist = distanceTable(n, edges);
      const near = neighbours(n, edges);
      const d = (p: number, q: number): number =>
        (dist[p] as number[])[q] as number;
      for (let s = 0; s < n; s++) {
        const a = sweep(n, near, s).far;
        const k = median(dist, s, x, y);
        if (k === null) throw new Error("k 가 없다");
        const j = median(dist, s, a, k);
        if (j === null) throw new Error("j 가 없다");
        const target = a === x ? y : x;
        rows.push([
          label,
          comma(s),
          comma(a),
          comma(k),
          comma(j),
          comma(d(j, k)),
          comma(d(a, target)),
          comma(d(x, y) + 2 * d(j, k)),
        ]);
      }
    }
    return `${table(rows, [1, 2, 3, 4, 5, 6, 7]).join("\n")}
        └ 지름 쌍은 전개 입력이 (3, 6) 으로 D = 16, 별 모양이 (4, 3) 으로 D = 7 이다.
          목표 끝점은 a 가 x 면 y 를, 아니면 x 를 잡았다 — 유도가 떼어 낸 경우와 같은 규칙이다`;
  },

  /** 두 방법의 배열 칸 접근을 닫힌 형태와 대조한다. */
  "cost-closed-form": () => {
    const rows: string[][] = [
      [
        "정점 V",
        "간선 E",
        "실측 두 번 탐색",
        "닫힌 형태 10V + 10E - 2",
        "차이",
      ],
    ];
    for (const v of [7, 100, 1_000, 20_000]) {
      const edges = v === WALK_N ? WALK_EDGES : chain(v);
      const got = twoSweeps(v, edges).cells;
      const closed = 10 * v + 10 * edges.length - 2;
      rows.push([
        comma(v),
        comma(edges.length),
        comma(got),
        comma(closed),
        comma(got - closed),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 트리라 E = V - 1 이므로 닫힌 형태가 20V - 12 가 된다.
          제약 상한 V = 100,000 에서 ${comma(20 * 100_000 - 12)} 칸이다`;
  },

  /** 최악을 만드는 입력 — 모양을 바꿔 가며 실제로 재 본다. */
  "shape-values": () => {
    const v = 20_000;
    const rows: string[][] = [["입력 모양", "V", "배열 칸 접근", "지름"]];
    for (const [name, edges] of [
      ["한 줄로 이었다", chain(v)],
      ["별 모양이다", star(v)],
      ["완전 이진 트리다", binary(v)],
      ["애벌레다", caterpillar(v)],
    ] as [string, Edge[]][]) {
      rows.push([
        name,
        comma(v),
        comma(twoSweeps(v, edges).cells),
        comma(treeDiameter(v, edges)),
      ]);
    }
    return `${table(rows, [1, 2, 3]).join("\n")}
        └ 네 모양의 간선 수가 전부 ${comma(v - 1)} 로 같다`;
  },
};
