/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/kruskalMst/kruskalMst-guide.md
 *
 * **세는 사본이 셋 있다**(`bruteForce`·`byScan`·`byDsu`). 정본은 배열 칸을 몇 번 읽었는지를
 * 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표의 「합계」 칸 중 옳은 쪽은 전부 정본이나 정본에서
 * 기계로 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { kruskalMst } from "./kruskalMst-guide.ref.ts";

type Edge = [number, number, number];

const REF = new URL("./kruskalMst-guide.ref.ts", import.meta.url).pathname;

/**
 * 본문 전개가 쓰는 고정 입력. 정렬 전 순서가 가중치 순과 어긋나 있고(첫 간선이 가장 무겁다),
 * 사이클을 만드는 간선이 하나 있으며, 마지막 간선을 보기 전에 `n-1` 개가 차서 조기 종료가
 * 실행된다.
 */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [3, 4, 6],
  [0, 1, 1],
  [0, 3, 4],
  [4, 5, 5],
  [2, 3, 2],
  [0, 5, 7],
  [1, 2, 3],
];

/** 삼각형. 가장 무거운 간선 하나가 빠지는 최소 사례다. */
const TRI_N = 3;
const TRI_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, 2],
  [0, 2, 3],
];

/** 정점 넷이 사각형을 이루고 가중치가 전부 같다. 어느 셋을 골라도 합계가 같다. */
const SQUARE_N = 4;
const SQUARE_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, 1],
  [2, 3, 1],
  [0, 3, 1],
];

/** 정점 셋인데 간선이 하나뿐이다. 정점 2 가 어디에도 안 이어져 신장 트리가 없다. */
const SPLIT_N = 3;
const SPLIT_EDGES: Edge[] = [[0, 1, 5]];

/** 정점 `v` 개를 한 줄로 이은 무방향 그래프 — `0—1—…—(v-1)`, 가중치는 자리 번호 + 1. */
function path(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부와 이어진 그래프. 가중치는 상대 정점 번호다. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i, i]);
  return out;
}

/**
 * 정점 `v` 개에 **가장 무거운 간선만** 한 벌 얹는다. 가중치가 제약 상한이라 정렬하면 전부
 * 뒤로 가고, 앞에서 이미 `n-1` 개가 찼으면 한 개도 안 본다.
 */
function heavy(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < v; i++) out.push([i, (i + 7) % v, 1_000_000_000]);
  return out;
}

/**
 * 정점 `v` 개(2 의 거듭제곱)를 **둘씩 짝지어 올리는** 순서로 잇는 간선 목록. 가중치를 단계
 * 번호로 두어 정렬하면 같은 크기의 덩어리끼리만 만난다 — 랭크가 실제로 자라는 유일한 모양이다.
 */
function tournament(v: number): Edge[] {
  const out: Edge[] = [];
  for (let span = 1; span < v; span *= 2) {
    for (let i = 0; i + span < v; i += span * 2) {
      out.push([i, i + span, Math.log2(span) + 1]);
    }
  }
  return out;
}

/**
 * 붙이는 방향만 정하고 경로 압축은 하지 않는 판을 돌려, 끝난 뒤 **가장 큰 랭크**와 그 대표가
 * 이끄는 정점 수를 돌려준다. 압축을 켜면 랭크는 그대로지만 트리 모양이 바뀌어 크기를 세는
 * 자리가 흐려지므로 여기서는 끈다.
 */
function rankRun(v: number, edges: Edge[]): { rank: number; size: number } {
  const parent: number[] = Array.from({ length: v }, (_, i) => i);
  const rank: number[] = Array.from({ length: v }, () => 0);
  const size: number[] = Array.from({ length: v }, () => 1);
  const root = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r] as number;
    return r;
  };
  for (const [a, b] of [...edges].sort((p, q) => p[2] - q[2])) {
    const ra = root(a);
    const rb = root(b);
    if (ra === rb) continue;
    if ((rank[ra] as number) > (rank[rb] as number)) {
      parent[rb] = ra;
      size[ra] = (size[ra] as number) + (size[rb] as number);
    } else {
      parent[ra] = rb;
      size[rb] = (size[rb] as number) + (size[ra] as number);
      if (rank[ra] === rank[rb]) rank[rb] = (rank[rb] as number) + 1;
    }
  }
  let top = 0;
  let at = 0;
  for (let x = 0; x < v; x++) {
    if (parent[x] === x && (rank[x] as number) >= top) {
      top = rank[x] as number;
      at = x;
    }
  }
  return { rank: top, size: size[at] as number };
}

/**
 * 정점 `v` 개짜리 완전 그래프. 가중치는 `(i × 31 + j × 17) mod 997 + 1` 로 정한다 —
 * 난수가 아니라 식이라 같은 값이 몇 번을 실행해도 나온다.
 */
function complete(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < v; i++) {
    for (let j = i + 1; j < v; j++)
      out.push([i, j, ((i * 31 + j * 17) % 997) + 1]);
  }
  return out;
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `1,299,994` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
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
 * 가장 단순한 방법 — 간선 목록에서 **크기 `n-1` 인 부분집합을 전부** 만들어, 그것이 모든
 * 정점을 잇는지 검사하고 가중치 합이 가장 작은 것을 남긴다. 기법이 하나도 안 들어간 풀이다.
 */
function bruteForce(
  n: number,
  edges: Edge[],
): { best: number; tried: number; spanning: number; reads: number } {
  const pickCount = n - 1;
  const chosen: number[] = [];
  let best = Number.POSITIVE_INFINITY;
  let tried = 0;
  let spanning = 0;
  let reads = 0;

  /** 고른 간선만으로 정점 전부가 이어지는가. 읽은 간선 끝점 수도 함께 센다. */
  function connects(): boolean {
    const seen: number[] = Array.from({ length: n }, (_, i) => i);
    const root = (x: number): number => {
      let r = x;
      while (seen[r] !== r) r = seen[r] as number;
      return r;
    };
    let joined = 0;
    for (const idx of chosen) {
      const [u, v] = edges[idx] as Edge;
      reads += 2;
      const ru = root(u);
      const rv = root(v);
      if (ru === rv) return false;
      seen[ru] = rv;
      joined++;
    }
    return joined === pickCount;
  }

  function walk(from: number): void {
    if (chosen.length === pickCount) {
      tried++;
      if (connects()) {
        spanning++;
        let sum = 0;
        for (const idx of chosen) sum += (edges[idx] as Edge)[2];
        if (sum < best) best = sum;
      }
      return;
    }
    for (let i = from; i < edges.length; i++) {
      chosen.push(i);
      walk(i + 1);
      chosen.pop();
    }
  }

  if (pickCount === 0) return { best: 0, tried: 1, spanning: 1, reads: 0 };
  walk(0);
  return { best, tried, spanning, reads };
}

/**
 * 가벼운 간선부터 보는 것은 같고, **사이클 판정만 탐색으로** 한다 — 이미 고른 간선들로
 * 이웃 목록을 만들고 `u` 에서 너비 우선 탐색을 시작해 `v` 에 이르는지 본다.
 *
 * 배열 칸 접근은 이웃 목록·방문 표시·큐를 읽고 쓴 횟수다. `byDsu` 와 같은 정의라 두 값을
 * 나란히 놓을 수 있다.
 */
function byScan(n: number, edges: Edge[]): { total: number; cells: number } {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const near: number[][] = Array.from({ length: n }, () => []);
  let cells = 0;
  let total = 0;
  let picked = 0;

  for (const [u, v, w] of sorted) {
    // u 에서 출발해 v 에 이르는 길이 이미 있는가.
    const seen: boolean[] = Array.from({ length: n }, () => false);
    const queue: number[] = [u];
    cells += 2;
    seen[u] = true;
    let head = 0;
    let reached = false;
    while (head < queue.length) {
      const x = queue[head] as number;
      head++;
      cells += 1;
      if (x === v) {
        reached = true;
        break;
      }
      for (const y of near[x] as number[]) {
        cells += 1;
        if (seen[y] === true) continue;
        seen[y] = true;
        queue.push(y);
        cells += 2;
      }
    }
    if (reached) continue;

    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    cells += 2;
    total += w;
    picked++;
    if (picked === n - 1) return { total, cells };
  }
  return { total: picked === n - 1 ? total : -1, cells };
}

/**
 * 대표 배열 판. `useRank` 와 `compress` 를 꺼 두면 이 가이드가 세우기 **전 단계**의 절차가
 * 되고, 둘 다 켜면 정본과 같은 절차다. 배열 칸 접근은 `parent`·`rank` 를 읽고 쓴 횟수다.
 */
function byDsu(
  n: number,
  edges: Edge[],
  opts: { useRank: boolean; compress: boolean },
): { total: number; cells: number; height: number } {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  const rank: number[] = Array.from({ length: n }, () => 0);
  let cells = 0;
  let total = 0;
  let picked = 0;

  const find = (x: number): number => {
    let root = x;
    while (true) {
      cells += 1;
      if (parent[root] === root) break;
      root = parent[root] as number;
    }
    if (opts.compress) {
      let cur = x;
      while (parent[cur] !== root) {
        cells += 2;
        const next = parent[cur] as number;
        parent[cur] = root;
        cur = next;
      }
      cells += 1;
    }
    return root;
  };

  for (const [u, v, w] of sorted) {
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) continue;
    if (opts.useRank) {
      cells += 2;
      if ((rank[ru] as number) > (rank[rv] as number)) {
        parent[rv] = ru;
        cells += 1;
      } else {
        parent[ru] = rv;
        cells += 1;
        if (rank[ru] === rank[rv]) {
          rank[rv] = (rank[rv] as number) + 1;
          cells += 2;
        }
      }
    } else {
      parent[ru] = rv;
      cells += 1;
    }
    total += w;
    picked++;
    if (picked === n - 1) break;
  }

  // 남은 대표 트리의 가장 큰 높이. 「붙이는 방향」이 실제로 무엇을 막았는지 재는 값이다.
  let height = 0;
  for (let x = 0; x < n; x++) {
    let depth = 0;
    let cur = x;
    while (parent[cur] !== cur) {
      cur = parent[cur] as number;
      depth++;
    }
    if (depth > height) height = depth;
  }
  return { total: picked === n - 1 ? total : -1, cells, height };
}

/** 대표 배열의 정본 절차가 배열 칸을 몇 번 읽고 쓰는가 — `perf` 절과 같은 정의다. */
const refCells = (n: number, edges: Edge[]): number =>
  byDsu(n, edges, { useRank: true, compress: true }).cells;

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { kruskalMst: (n: number, edges: Edge[]) => number };

/** 정렬 호출만 지운 판. 입력에 적힌 순서 그대로 본다. */
const noSort = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [/\.sort\(\(a, b\) => a\[2\] - b\[2\]\)/, ""],
  });

/** 대표가 같을 때 건너뛰는 줄을 지운 판. 사이클을 만드는 간선까지 고른다. */
const keepCycle = (): Promise<Ref> =>
  loadMutant<Ref>(REF, { drop: /^\s*if \(ru === rv\) continue;$/ });

/** 마지막 줄의 삼항식을 합계로 바꾼 판. 못 이은 정점이 있어도 그냥 더한 값을 답한다. */
const noConnectivityCheck = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [/return picked === n - 1 \? total : -1;/, "return total;"],
  });

/** 표에 나란히 놓는 네 입력. 이름은 본문 표기와 같다. */
const FOUR: [string, number, Edge[]][] = [
  ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES],
  ["삼각형 세 정점", TRI_N, TRI_EDGES],
  ["가중치가 같은 사각형", SQUARE_N, SQUARE_EDGES],
  ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
];

/* ────────────────────── 변이 표 (모듈 최상위에서 한 번 만든다) ────────────────────── */

const mutantTable = async (
  label: string,
  make: () => Promise<Ref>,
  inputs: [string, number, Edge[]][],
): Promise<string> => {
  const mod = await make();
  const rows: string[][] = [["", "정본", label]];
  for (const [name, v, e] of inputs) {
    rows.push([name, comma(kruskalMst(v, e)), comma(mod.kruskalMst(v, e))]);
  }
  return table(rows, [1, 2]).join("\n");
};

const NO_SORT = await mutantTable("정렬하지 않는다", noSort, FOUR);
const KEEP_CYCLE = await mutantTable("건너뛰지 않는다", keepCycle, FOUR);
const NO_CHECK = await mutantTable("개수를 안 본다", noConnectivityCheck, [
  ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
  ["정점 넷에 간선 없음", 4, []],
  ["둘씩 이어진 정점 넷", 4, [[0, 1, 3] as Edge, [2, 3, 4] as Edge]],
  ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES],
]);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 전개 입력에 부분집합 전수 검사를 실제로 실행한 값. */
  "brute-walk": () => {
    const b = bruteForce(WALK_N, WALK_EDGES);
    return table(
      [
        ["", "값"],
        ["크기 5 인 부분집합 수", comma(b.tried)],
        ["그중 모든 정점을 잇는 것", comma(b.spanning)],
        ["읽은 간선 끝점 수", comma(b.reads)],
        ["가장 작은 가중치 합", comma(b.best)],
      ],
      [1],
    ).join("\n");
  },

  /** 부분집합을 전부 만들면 제약 규모에서 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["정점 V", "간선 E", "부분집합 수 C(E, V-1)", "초당 1억 개 기준"],
    ];
    for (const [v, e] of [
      [6, 7],
      [10, 20],
      [20, 40],
      [40, 80],
    ] as [number, number][]) {
      let c = 1;
      for (let k = 0; k < v - 1; k++) c = (c * (e - k)) / (k + 1);
      rows.push([
        comma(v),
        comma(e),
        c > 1e15 ? c.toExponential(3) : comma(Math.round(c)),
        duration(c / 1e8),
      ]);
    }
    // 제약 상한에서의 자릿수. 곱셈이 부동소수 범위를 넘으므로 로그로 센다.
    let digits = 0;
    for (let k = 0; k < 99_999; k++) {
      digits += Math.log10(200_000 - k) - Math.log10(k + 1);
    }
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 제약 상한인 정점 100,000 · 간선 200,000 이면 부분집합 수만 ${comma(Math.floor(digits) + 1)} 자리다`;
  },

  /** 사이클 판정을 탐색으로 하는 것과 대표 배열로 하는 것의 계수. */
  "cycle-check-cost": () => {
    const rows: string[][] = [
      ["입력", "V", "E", "탐색으로 판정", "대표 배열로 판정", "합계"],
    ];
    for (const [name, v, e] of [
      ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES],
      ["한 줄로 이은 100 정점", 100, path(100)],
      ["별 모양 100 정점", 100, star(100)],
      ["완전 그래프 40 정점", 40, complete(40)],
    ] as [string, number, Edge[]][]) {
      const scan = byScan(v, e);
      const dsu = byDsu(v, e, { useRank: true, compress: true });
      if (scan.total !== dsu.total || dsu.total !== kruskalMst(v, e)) {
        throw new Error(`${name} 에서 두 판정이 다른 답을 낸다`);
      }
      rows.push([
        name,
        comma(v),
        comma(e.length),
        comma(scan.cells),
        comma(dsu.cells),
        comma(dsu.total),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** 붙이는 방향과 경로 압축을 켜고 끄면 배열 칸 접근과 대표 트리 높이가 어떻게 갈리는가. */
  "dsu-variants": () => {
    const v = 1_000;
    // **별 모양이라야 갈린다.** 한 줄로 이은 그래프는 가벼운 간선부터 보면 늘 방금 붙인
    // 정점이 대표라 `find` 가 한 칸만 읽는다 — 붙이는 방향을 안 정해도 값이 안 커진다.
    // 별 모양은 정점 0 을 매번 다시 물으므로 깊이가 그대로 비용이 된다.
    const edges = star(v);
    const rows: string[][] = [
      ["판", "배열 칸 접근", "끝난 뒤 대표 트리의 높이"],
    ];
    for (const [name, opts] of [
      ["둘 다 없다", { useRank: false, compress: false }],
      ["붙이는 방향만 정한다", { useRank: true, compress: false }],
      ["경로 압축만 한다", { useRank: false, compress: true }],
      ["둘 다 한다", { useRank: true, compress: true }],
    ] as [string, { useRank: boolean; compress: boolean }][]) {
      const r = byDsu(v, edges, opts);
      if (r.total !== kruskalMst(v, edges)) {
        throw new Error(`${name} 이 다른 답을 낸다 — ${r.total}`);
      }
      rows.push([name, comma(r.cells), comma(r.height)]);
    }
    return `${table(rows, [1, 2]).join("\n")}
        └ 별 모양 정점 ${comma(v)} 개 · 간선 ${comma(edges.length)} 개, 네 판 모두 합계 ${comma(kruskalMst(v, edges))}`;
  },

  /** 정렬을 빼면 무엇이 나오는가. */
  "mutant-no-sort": () => NO_SORT,

  /** 사이클을 만드는 간선을 안 건너뛰면 무엇이 나오는가. */
  "mutant-keep-cycle": () => KEEP_CYCLE,

  /** 마지막 개수 검사를 빼면 연결되지 않은 그래프에서 무엇이 나오는가. */
  "mutant-no-check": () => NO_CHECK,

  /** 전개가 쓰는 입력을 전체 코드로 실행한 값. */
  "walk-result": () => {
    const rows: string[][] = [["입력", "반환값"]];
    for (const [name, v, e] of FOUR) rows.push([name, comma(kruskalMst(v, e))]);
    return table(rows, [1]).join("\n");
  },

  /** 랭크가 `r` 인 대표가 이끄는 덩어리의 크기를 실제로 세어 하한 2^r 과 맞춘다. */
  "rank-size": () => {
    const rows: string[][] = [
      [
        "입력",
        "정점 수 V",
        "가장 큰 랭크 r",
        "그 대표가 이끄는 정점 수",
        "하한 2^r",
        "상한 ⌊log2 V⌋",
      ],
    ];
    for (const v of [2, 4, 8, 16, 1_024, 65_536]) {
      const got = rankRun(v, tournament(v));
      rows.push([
        "둘씩 짝지어 올린다",
        comma(v),
        comma(got.rank),
        comma(got.size),
        comma(2 ** got.rank),
        String(Math.floor(Math.log2(v))),
      ]);
    }
    for (const v of [1_024, 65_536]) {
      const got = rankRun(v, star(v));
      rows.push([
        "별 모양이다",
        comma(v),
        comma(got.rank),
        comma(got.size),
        comma(2 ** got.rank),
        String(Math.floor(Math.log2(v))),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** 랭크 상한을 제약 규모에 넣어 수치를 낸다. */
  "rank-bound-scale": () => {
    const rows: string[][] = [
      ["정점 V", "랭크 상한 r", "찾기 한 번의 칸", "간선 E", "정렬 비교", "찾기 총 상한"],
    ];
    for (const [v, e] of [
      [6, 7],
      [1_000, 2_000],
      [100_000, 200_000],
    ] as [number, number][]) {
      const r = Math.floor(Math.log2(v));
      rows.push([
        comma(v),
        comma(r),
        comma(r + 1),
        comma(e),
        comma(e * Math.ceil(Math.log2(e))),
        comma(2 * e * (r + 1)),
      ]);
    }
    return `${table(rows, [0, 1, 2, 3, 4, 5]).join("\n")}
        └ 랭크 상한 r = ⌊log2 V⌋ · 찾기 한 번의 칸 = r+1
          정렬 비교 = E⌈log2 E⌉ · 찾기 총 상한 = 2E(r+1)`;
  },

  /** 최악을 만드는 입력 — 모양을 바꿔 가며 실제로 재 본다. */
  "shape-values": () => {
    const v = 20_000;
    const rows: string[][] = [
      ["입력 모양", "V", "E", "배열 칸 접근", "고른 간선", "합계"],
    ];
    for (const [name, edges] of [
      ["한 줄로 이었다", path(v)],
      ["별 모양이다", star(v)],
      ["한 줄로 잇고 같은 간선을 한 벌 더 넣었다", [...path(v), ...path(v)]],
      ["한 줄로 잇고 무거운 간선을 한 벌 더 넣었다", [...path(v), ...heavy(v)]],
      ["앞의 절반만 잇는다", path(v / 2)],
    ] as [string, Edge[]][]) {
      const answer = kruskalMst(v, edges);
      rows.push([
        name,
        comma(v),
        comma(edges.length),
        comma(refCells(v, edges)),
        comma(countPicked(v, edges)),
        answer === -1 ? "-1" : comma(answer),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },
};

/** 고른 간선이 몇 개에서 멈췄는가 — `-1` 이 나온 입력에서 그 수를 보이는 자리다. */
function countPicked(n: number, edges: Edge[]): number {
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  const root = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r] as number;
    return r;
  };
  let picked = 0;
  for (const [u, v] of sorted) {
    const ru = root(u);
    const rv = root(v);
    if (ru === rv) continue;
    parent[ru] = rv;
    picked++;
  }
  return picked;
}

/** `14,658년` 꼴 — 초를 사람이 읽는 단위로 바꾼다. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)}초`;
  if (seconds < 60) return `${seconds.toFixed(1)}초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)}분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)}일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))}년`;
}
