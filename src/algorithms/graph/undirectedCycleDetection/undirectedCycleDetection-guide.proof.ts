/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.md
 *
 * **세는 사본이 넷 있다**(`removeEachEdge`·`scanOnce`·`countCells`·`classifyEdges`). 정본은
 * 간선을 몇 번 확인했는지도, 칸을 몇 개 읽었는지도 내보내지 않으므로 세는 자리만 덧붙인
 * 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 아래
 * 표의 「답」 칸 중 옳은 쪽은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * 경쟁 설계의 계수는 `.alt.ts` 가 낸 것을 그대로 가져온다 — 같은 값을 두 파일이 각자 재면
 * 둘이 갈라진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { cases as ALT_CASES } from "./undirectedCycleDetection-guide.alt.ts";
import { undirectedCycleDetection } from "./undirectedCycleDetection-guide.ref.ts";

type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0·1·2 는 한 줄이고 3·4·5 는 삼각형이라, 세 갈래와
 * 바깥 반복의 다시 시작하기가 한 입력에서 모두 실행된다.
 */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
  [5, 3],
];

/** `0-1-…-(v-1)` 한 줄. 간선 `v-1` 개이고 사이클이 없다. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부와 이어진 별 모양. 간선 `v-1` 개이고 사이클이 없다. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

/** 한 줄의 양 끝을 이어 붙인 고리. 간선 `v` 개이고 사이클이 하나다. */
function ring(v: number): Edge[] {
  return [...chain(v), [v - 1, 0]];
}

/** 정점 `v` 개를 크기 `size` 짜리 한 줄 여럿으로 가른 숲. */
function forest(v: number, size: number): Edge[] {
  const out: Edge[] = [];
  for (let base = 0; base < v; base += size) {
    for (let i = base; i + 1 < Math.min(base + size, v); i++)
      out.push([i, i + 1]);
  }
  return out;
}

const adjacency = (n: number, edges: Edge[]): number[][] => {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  return nbr;
};

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

/** `1,599,993` 꼴 — 본문 표기와 같다. */
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
 * 가장 단순한 방법 — **간선을 하나씩 지워 보고 두 끝이 아직 이어져 있는지 확인한다.**
 * 이어져 있으면 그 간선 없이도 가는 길이 있다는 뜻이라 사이클이다. 답은 맞는다.
 *
 * 세는 것은 **이웃 목록에서 읽은 이웃 수**다. 이웃 목록을 한 번 만드는 비용은 두 방식이
 * 같으므로 세지 않는다.
 */
function removeEachEdge(
  n: number,
  edges: Edge[],
): {
  scans: number;
  answer: boolean;
} {
  // 이웃 목록에 간선 번호를 함께 담는다 — 지운 간선 하나를 가려내야 한다.
  const nbr: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    (nbr[u] as number[]).push(v, i);
    (nbr[v] as number[]).push(u, i);
  });

  let scans = 0;
  for (let removed = 0; removed < edges.length; removed++) {
    const [u, v] = edges[removed] as Edge;
    if (u === v) return { scans, answer: true };
    const seen: boolean[] = Array.from({ length: n }, () => false);
    seen[u] = true;
    const queue: number[] = [u];
    while (queue.length > 0) {
      const x = queue.pop() as number;
      const list = nbr[x] as number[];
      for (let i = 0; i < list.length; i += 2) {
        scans++;
        if ((list[i + 1] as number) === removed) continue;
        const y = list[i] as number;
        if (seen[y]) continue;
        seen[y] = true;
        queue.push(y);
      }
    }
    if (seen[v] === true) return { scans, answer: true };
  }
  return { scans, answer: false };
}

/**
 * 이 가이드의 절차 — 표시를 한 벌만 두고 이웃 목록을 한 번씩 확인한다.
 * `.ref.ts` 와 같은 순서로 같은 일을 하고 **읽은 이웃 수**만 덧붙여 센다.
 */
function scanOnce(
  n: number,
  edges: Edge[],
): { scans: number; answer: boolean } {
  const nbr = adjacency(n, edges);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const from: number[] = [];
  let scans = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    stack.push(s);
    from.push(-1);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      for (const v of nbr[u] as number[]) {
        scans++;
        if (v === parent) continue;
        if (visited[v]) return { scans, answer: true };
        visited[v] = true;
        stack.push(v);
        from.push(u);
      }
    }
  }
  return { scans, answer: false };
}

/**
 * 같은 절차에 **배열 칸 접근 수**를 덧붙여 센 사본. 칸을 한 번 읽으면 1, 한 번 쓰면 1이다.
 * `.alt.ts` 의 세는 사본과 같은 규칙을 쓴다.
 */
function countCells(
  n: number,
  edges: Edge[],
): { cells: number; answer: boolean } {
  let cells = 0;
  const nbr: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  for (const [u, v] of edges) {
    cells += 4;
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  const visited: boolean[] = Array.from({ length: n }, () => false);
  cells += n;
  const stack: number[] = [];
  const from: number[] = [];
  for (let s = 0; s < n; s++) {
    cells++;
    if (visited[s]) continue;
    cells += 3;
    visited[s] = true;
    stack.push(s);
    from.push(-1);
    while (stack.length > 0) {
      cells += 3;
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      for (const v of nbr[u] as number[]) {
        cells++;
        if (v === parent) continue;
        cells++;
        if (visited[v]) return { cells, answer: true };
        cells += 3;
        visited[v] = true;
        stack.push(v);
        from.push(u);
      }
    }
  }
  return { cells, answer: false };
}

/**
 * 끝까지 확인하며 간선을 **나무 간선과 여분 간선으로 가른다.** 사이클을 만나도 멈추지 않는
 * 사본이라 여분 간선의 개수를 셀 수 있다 — 정본은 첫 여분 간선에서 반환하므로 셀 수 없다.
 */
function classifyEdges(
  n: number,
  edges: Edge[],
): { tree: number; extra: number; parts: number } {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    (nbr[u] as number[]).push(v, i);
    (nbr[v] as number[]).push(u, i);
  });
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const isTree: boolean[] = Array.from({ length: edges.length }, () => false);
  let parts = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    parts++;
    visited[s] = true;
    const stack: number[] = [s];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const list = nbr[u] as number[];
      for (let i = 0; i < list.length; i += 2) {
        const v = list[i] as number;
        if (visited[v]) continue;
        visited[v] = true;
        isTree[list[i + 1] as number] = true;
        stack.push(v);
      }
    }
  }
  const tree = isTree.filter(Boolean).length;
  return { tree, extra: edges.length - tree, parts };
}

/** 표시된 이웃을 **전부** 건너뛰는 후보. 사이클을 하나도 못 찾는다. */
function skipAllVisited(n: number, edges: Edge[]): boolean {
  const nbr = adjacency(n, edges);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    const stack: number[] = [s];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      for (const v of nbr[u] as number[]) {
        if (visited[v]) continue;
        visited[v] = true;
        stack.push(v);
      }
    }
  }
  return false;
}

/**
 * 지나온 **간선 번호** 하나를 건너뛰는 후보. 정본은 지나온 **이웃 번호**를 건너뛴다.
 * 둘이 갈리는 자리는 같은 정점 쌍을 두 번 이은 간선인데, 실제로 갈리는지는 값이 답한다.
 */
function skipByEdgeId(n: number, edges: Edge[]): boolean {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v], i) => {
    (nbr[u] as number[]).push(v, i);
    (nbr[v] as number[]).push(u, i);
  });
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const via: number[] = [];
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    stack.push(s);
    via.push(-1);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const entered = via.pop() as number;
      const list = nbr[u] as number[];
      for (let i = 0; i < list.length; i += 2) {
        const v = list[i] as number;
        const id = list[i + 1] as number;
        if (id === entered) continue;
        if (visited[v]) return true;
        visited[v] = true;
        stack.push(v);
        via.push(id);
      }
    }
  }
  return false;
}

/** 서로소 집합으로 답만 낸다. 위 사본들의 답이 옳은지 대조하는 자리에 쓴다. */
function unionFindAnswer(n: number, edges: Edge[]): boolean {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    let cur = x;
    while ((parent[cur] as number) !== cur) {
      parent[cur] = parent[parent[cur] as number] as number;
      cur = parent[cur] as number;
    }
    return cur;
  };
  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a === b) return true;
    parent[a] = b;
  }
  return false;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  undirectedCycleDetection(n: number, edges: Edge[]): boolean;
}

const REF_PATH = new URL(
  "./undirectedCycleDetection-guide.ref.ts",
  import.meta.url,
).pathname;

/**
 * 지나온 이웃을 건너뛰던 줄을 **지운** 사본. 무향 간선을 되돌아 걸어가는 것까지 사이클로
 * 읽어, 간선 하나짜리 그래프에도 `true` 를 답한다.
 */
const noSkipMutant = await loadMutant<Ref>(REF_PATH, {
  drop: /^\s+if \(v === parent\) continue;/,
});

/**
 * 간선을 **한쪽 목록에만** 넣는 사본. 적힌 순서대로만 걸어갈 수 있게 되어 사이클을 지나친다.
 */
const oneSidedMutant = await loadMutant<Ref>(REF_PATH, {
  drop: /^\s+\(nbr\[v\] as number\[\]\)\.push\(u\);/,
});

/* ────────────────────────── 입력 묶음 ────────────────────────── */

const SMALL: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  { label: "별 모양 네 정점", n: 4, edges: star(4) },
  { label: "삼각형 세 정점", n: 3, edges: ring(3) },
  {
    label: "같은 쌍을 두 번 이은 간선",
    n: 2,
    edges: [
      [0, 1],
      [0, 1],
    ],
  },
  { label: "자기 자신을 잇는 간선", n: 2, edges: [[0, 0]] },
];

const yn = (b: boolean): string => (b ? "true" : "false");

export const PROOFS: Record<string, () => string> = {
  /** 간선을 하나씩 지워 보는 방법이 규모에 따라 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [["입력", "정점 V", "간선 E", "확인한 이웃 수"]];
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
      { label: "한 줄로 이은 100 정점", n: 100, edges: chain(100) },
      { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
      { label: "한 줄로 이은 2,000 정점", n: 2_000, edges: chain(2_000) },
    ];
    for (const c of cases) {
      rows.push([
        c.label,
        comma(c.n),
        comma(c.edges.length),
        comma(removeEachEdge(c.n, c.edges).scans),
      ]);
    }
    // 한 줄 입력의 확인 수는 E² 이다. 위 네 줄에서 그것을 확인한 다음 제약 상한에 넣는다.
    const fits = cases
      .filter((c) => c.label.startsWith("한 줄"))
      .every((c) => {
        const e = c.edges.length;
        return removeEachEdge(c.n, c.edges).scans === e * e;
      });
    const cap = 100_000 - 1;
    return `${table(rows, [1, 2, 3]).join("\n")}
        └ 한 줄 입력 네 줄이 전부 E × E 와 같다: ${yn(fits)}
          제약 상한인 간선 ${comma(cap)} 개를 그 식에 넣으면 ${comma(cap * cap)} 이다`;
  },

  /** 표시를 한 벌 두는 것이 같은 입력에서 확인 수를 얼마나 바꾸는가. */
  "mark-values": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
      { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
      { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
      { label: "고리 1,000 정점", n: 1_000, edges: ring(1_000) },
    ];
    return table(
      [
        ["입력", "E", "간선을 지워 본다", "표시를 한 벌 둔다", "배수", "답"],
        ...cases.map((c) => {
          const a = removeEachEdge(c.n, c.edges);
          const b = scanOnce(c.n, c.edges);
          return [
            c.label,
            comma(c.edges.length),
            comma(a.scans),
            comma(b.scans),
            `${(a.scans / b.scans).toFixed(1)} 배`,
            yn(undirectedCycleDetection(c.n, c.edges)),
          ];
        }),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 무엇을 건너뛸 것인가 — 후보 셋의 답. */
  "skip-choice": () =>
    table(
      [
        [
          "입력",
          "아무것도 안 건너뛴다",
          "지나온 이웃 하나",
          "표시된 이웃 전부",
          "옳은 답",
        ],
        ...SMALL.map((c) => [
          c.label,
          yn(noSkipMutant.undirectedCycleDetection(c.n, c.edges)),
          yn(undirectedCycleDetection(c.n, c.edges)),
          yn(skipAllVisited(c.n, c.edges)),
          yn(unionFindAnswer(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n"),

  /** 표시를 한 벌 두면 확인 수가 2E 로 고정되는가. */
  "edge-scan-values": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
      { label: "별 모양 10 정점", n: 10, edges: star(10) },
      { label: "정점 10 개를 둘씩 짝지은 숲", n: 10, edges: forest(10, 2) },
      { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
      { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
    ];
    return table(
      [
        ["입력", "E", "확인한 이웃 수", "2E", "답"],
        ...cases.map((c) => [
          c.label,
          comma(c.edges.length),
          comma(scanOnce(c.n, c.edges).scans),
          comma(2 * c.edges.length),
          yn(undirectedCycleDetection(c.n, c.edges)),
        ]),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 지나온 이웃을 건너뛰지 않으면 어느 입력에서 답이 갈리는가. */
  "mutant-no-skip": () =>
    table(
      [
        ["입력", "지나온 이웃을 건너뛴다", "건너뛰지 않는다"],
        ...SMALL.map((c) => [
          c.label,
          yn(undirectedCycleDetection(c.n, c.edges)),
          yn(noSkipMutant.undirectedCycleDetection(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n"),

  /** 간선을 한쪽 목록에만 넣으면 어느 입력에서 답이 갈리는가. */
  "mutant-one-sided": () =>
    table(
      [
        ["입력", "양쪽 목록에 넣는다", "한쪽 목록에만 넣는다"],
        ...[
          { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
          {
            label: "같은 쌍을 [0,1] 과 [1,0] 으로 적은 것",
            n: 2,
            edges: [
              [0, 1],
              [1, 0],
            ] as Edge[],
          },
          {
            label: "이어지지 않은 두 간선 [0,1] · [2,0]",
            n: 3,
            edges: [
              [0, 1],
              [2, 0],
            ] as Edge[],
          },
          {
            label: "이어지지 않은 두 간선 [0,1] · [2,1]",
            n: 3,
            edges: [
              [0, 1],
              [2, 1],
            ] as Edge[],
          },
          { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
        ].map((c) => [
          c.label,
          yn(undirectedCycleDetection(c.n, c.edges)),
          yn(oneSidedMutant.undirectedCycleDetection(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n"),

  /** 지나온 이웃을 건너뛰는 것과 지나온 간선을 건너뛰는 것이 갈리는가. */
  "parent-vs-edge": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      {
        label: "같은 쌍을 두 번 이은 간선",
        n: 2,
        edges: [
          [0, 1],
          [0, 1],
        ],
      },
      {
        label: "가운데 쌍만 두 번 이은 한 줄",
        n: 4,
        edges: [
          [0, 1],
          [1, 2],
          [1, 2],
          [2, 3],
        ],
      },
      {
        label: "같은 쌍을 세 번 이은 간선",
        n: 2,
        edges: [
          [0, 1],
          [0, 1],
          [0, 1],
        ],
      },
      { label: "자기 자신을 잇는 간선", n: 2, edges: [[0, 0]] },
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
    ];
    // 정점 넷 이하 · 간선 넷 이하인 다중그래프를 전부 만들어 둘을 대조한다.
    const pairs: Edge[] = [];
    for (let u = 0; u < 4; u++) for (let v = u; v < 4; v++) pairs.push([u, v]);
    let checked = 0;
    let differ = 0;
    const walk = (depth: number, acc: Edge[]): void => {
      if (depth === 0) {
        checked++;
        if (
          undirectedCycleDetection(4, acc) !== skipByEdgeId(4, acc) ||
          undirectedCycleDetection(4, acc) !== unionFindAnswer(4, acc)
        ) {
          differ++;
        }
        return;
      }
      for (const p of pairs) {
        acc.push(p);
        walk(depth - 1, acc);
        acc.pop();
      }
    };
    for (let m = 0; m <= 4; m++) walk(m, []);
    return `${table(
      [
        ["입력", "지나온 이웃을 건너뛴다", "지나온 간선을 건너뛴다", "옳은 답"],
        ...cases.map((c) => [
          c.label,
          yn(undirectedCycleDetection(c.n, c.edges)),
          yn(skipByEdgeId(c.n, c.edges)),
          yn(unionFindAnswer(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n")}
        └ 정점 넷 · 간선 넷 이하인 다중그래프 ${comma(checked)} 개를 전부 만들어 대조했고
          두 판정이 갈린 그래프는 ${comma(differ)} 개다`;
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { n: number; edges: Edge[] }[] = [
      { n: WALK_N, edges: WALK_EDGES },
      { n: 3, edges: ring(3) },
      { n: 4, edges: chain(4) },
      { n: 6, edges: forest(6, 3) },
      { n: 2, edges: [[0, 0]] },
      {
        n: 2,
        edges: [
          [0, 1],
          [0, 1],
        ],
      },
      { n: 5, edges: [] },
      { n: 1, edges: [] },
    ];
    return cases
      .map((c) => {
        const call = `undirectedCycleDetection(${c.n}, ${JSON.stringify(c.edges).replaceAll("],[", "],[")})`;
        return [call, yn(undirectedCycleDetection(c.n, c.edges))];
      })
      .map(([call, out]) => `${pad(call as string, 66)} →   ${out}`)
      .join("\n");
  },

  /** 칸 접근 수의 닫힌 형태가 실측과 맞는가. */
  "cost-closed-form": () => {
    // **사이클이 없는 입력만 담는다.** 사이클이 있으면 만나는 자리에서 반복이 끝나므로
    // 아래 식이 그대로 서지 않는다 — 그 차이는 「최악을 만드는 입력」이 값으로 보인다.
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      {
        label: "전개 입력에서 간선 [5,3] 을 뺀 것",
        n: WALK_N,
        edges: WALK_EDGES.slice(0, 4),
      },
      { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
      { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
      { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
      { label: "1,000 정점을 넷씩 가른 숲", n: 1_000, edges: forest(1_000, 4) },
      {
        label: "한 줄로 이은 100,000 정점",
        n: 100_000,
        edges: chain(100_000),
      },
    ];
    return table(
      [
        ["입력", "V", "E", "성분 k", "실제 칸 접근", "10V + 6E − k"],
        ...cases.map((c) => {
          const parts = classifyEdges(c.n, c.edges).parts;
          return [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma(parts),
            comma(countCells(c.n, c.edges).cells),
            comma(10 * c.n + 6 * c.edges.length - parts),
          ];
        }),
      ],
      [1, 2, 3, 4, 5],
    ).join("\n");
  },

  /** 나무 간선과 여분 간선의 수가 E − V + k 와 맞는가. */
  "circuit-rank": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
      { label: "삼각형 세 정점", n: 3, edges: ring(3) },
      {
        label: "고리 둘을 나란히 둔 것",
        n: 6,
        edges: [...ring(3), [3, 4], [4, 5], [5, 3]],
      },
      {
        label: "삼각형에 대각선을 더한 사각형",
        n: 4,
        edges: [...ring(4), [0, 2]],
      },
      { label: "별 모양 1,000 정점", n: 1_000, edges: star(1_000) },
    ];
    return table(
      [
        ["입력", "V", "E", "성분 k", "나무 간선", "여분 간선", "E − V + k"],
        ...cases.map((c) => {
          const r = classifyEdges(c.n, c.edges);
          return [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma(r.parts),
            comma(r.tree),
            comma(r.extra),
            comma(c.edges.length - c.n + r.parts),
          ];
        }),
      ],
      [1, 2, 3, 4, 5, 6],
    ).join("\n");
  },

  /** 모양을 바꾸면 최악이 어디인가. */
  "shape-values": () => {
    const V = 100_000;
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "한 줄 (사이클 없음)", n: V, edges: chain(V) },
      { label: "별 모양 (사이클 없음)", n: V, edges: star(V) },
      { label: "둘씩 짝지은 숲 (사이클 없음)", n: V, edges: forest(V, 2) },
      { label: "한 줄의 양 끝을 이은 고리", n: V, edges: ring(V) },
      {
        label: "한 줄에 간선 [99999,99997] 을 더한 것",
        n: V,
        edges: [...chain(V), [V - 1, V - 3]],
      },
      {
        label: "별 모양에 간선 [1,2] 를 더한 것",
        n: V,
        edges: [...star(V), [1, 2]],
      },
    ];
    // 사이클을 어디에 두어야 가장 오래 걸리는가 — 한 줄에 간선 하나를 더하는 자리를 훑는다.
    let sweepBest = 0;
    let sweepAt = 0;
    for (let i = 0; i + 2 < V; i += 997) {
      const cells = countCells(V, [...chain(V), [i, i + 2]]).cells;
      if (cells > sweepBest) {
        sweepBest = cells;
        sweepAt = i;
      }
    }
    return `${table(
      [
        ["입력 모양", "V", "E", "배열 칸 접근", "반환값"],
        ...cases.map((c) => {
          const r = countCells(c.n, c.edges);
          return [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma(r.cells),
            yn(r.answer),
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n")}
        └ 한 줄에 간선 [i, i+2] 를 더해 i 를 997 칸씩 옮겨 가며 잰 최댓값은
          i = ${comma(sweepAt)} 에서 ${comma(sweepBest)} 이고, 사이클이 없는 한 줄의 ${comma(countCells(V, chain(V)).cells)} 보다 적다`;
  },

  /** 정점 번호를 바꿔 삼각형을 앞으로 옮기면 단계 수와 답이 어떻게 되는가. */
  "vertex-swap": () => {
    const swapped: Edge[] = [
      [3, 4],
      [4, 5],
      [0, 1],
      [1, 2],
      [2, 0],
    ];
    return table(
      [
        ["입력", "확인한 이웃 수", "배열 칸 접근", "반환값"],
        [
          "본문 전개 — 한 줄이 0·1·2, 삼각형이 3·4·5",
          comma(scanOnce(WALK_N, WALK_EDGES).scans),
          comma(countCells(WALK_N, WALK_EDGES).cells),
          yn(undirectedCycleDetection(WALK_N, WALK_EDGES)),
        ],
        [
          "번호를 바꿈 — 삼각형이 0·1·2, 한 줄이 3·4·5",
          comma(scanOnce(WALK_N, swapped).scans),
          comma(countCells(WALK_N, swapped).cells),
          yn(undirectedCycleDetection(WALK_N, swapped)),
        ],
      ],
      [1, 2],
    ).join("\n");
  },

  /** 경쟁 설계와의 대조 — 계수는 `.alt.ts` 가 낸 것을 그대로 쓴다. */
  "alt-flip": () => {
    const mine: Record<string, number> = ALT_CASES["이웃 목록 탐색"]();
    const other: Record<string, number> = ALT_CASES["서로소 집합"]();
    const keys = Object.keys(mine);
    return table(
      [
        ["재는 것", "이웃 목록 탐색", "서로소 집합", "어느 쪽이 적은가"],
        ...keys.map((k) => {
          const a = mine[k] as number;
          const b = other[k] as number;
          return [
            k,
            comma(a),
            comma(b),
            a === b ? "같다" : a < b ? "이웃 목록 탐색" : "서로소 집합",
          ];
        }),
      ],
      [1, 2],
    ).join("\n");
  },
};
