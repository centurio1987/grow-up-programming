/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/dfsTraversal/dfsTraversal-guide.md
 *
 * **세는 사본이 넷 있다**(`sweepCounts`·`listCounts`·`pickMinCounts`·`traverse`). 정본은 몇 번
 * 읽었는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * `markOnPush`·`recursive` 는 **다른 절차**라 사본이 아니라 별도 구현이다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「결과」 칸 중 옳은 쪽은 전부 정본이나
 * 정본에서 기계로 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { dfsTraversal } from "./dfsTraversal-guide.ref.ts";

type Edge = [number, number];

/** 본문 전개가 쓰는 고정 입력 — 정점 0~4 가 두 갈래로 갈리고 정점 5 는 간선이 없다. */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 2],
  [0, 1],
  [1, 3],
  [2, 4],
];

/**
 * 네 정점 그래프. 정점 0 이 셋과 이어져 있고 1 과 3 이 또 이어져 있다.
 * 전개 입력에서는 갈리지 않는 두 갈래가 여기서 갈린다.
 */
const FOUR_N = 4;
const FOUR_EDGES: Edge[] = [
  [0, 3],
  [0, 1],
  [0, 2],
  [1, 3],
];

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

/** `[0, 1, 3, 2, 4]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `39,999,600,002` 꼴 — 본문 표기와 같다. */
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

/** 간선 목록에서 이웃 목록을 만든다. `sorted` 면 목록마다 오름차순으로 정렬한다. */
function adjacency(n: number, edges: Edge[], sorted: boolean): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  if (sorted) for (const list of adj) list.sort((a, b) => a - b);
  return adj;
}

/**
 * 가장 단순한 방법 — 이웃 목록을 만들지 않고, 다음에 갈 정점을 고를 때마다 **간선 목록
 * 전체**를 처음부터 다시 읽어 아직 방문하지 않은 가장 작은 이웃을 찾는다. 갈 곳이 없으면
 * 지나온 정점으로 하나씩 되돌아가며 같은 검사를 되풀이한다.
 */
function sweepCounts(n: number, edges: Edge[], start: number) {
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const path: number[] = [start];
  visited[start] = true;
  order.push(start);
  let reads = 0;
  let picks = 0;
  while (path.length > 0) {
    const cur = path[path.length - 1] as number;
    picks++;
    let best = -1;
    for (const [u, v] of edges) {
      reads += 2;
      if (u === cur && visited[v] === false && (best < 0 || v < best)) best = v;
      if (v === cur && visited[u] === false && (best < 0 || u < best)) best = u;
    }
    if (best < 0) {
      path.pop();
      continue;
    }
    visited[best] = true;
    order.push(best);
    path.push(best);
  }
  return { order, reads, picks };
}

/** 정본과 같은 절차. 읽은 원소 수와 꺼낸 횟수만 덧붙여 센다. */
function listCounts(n: number, edges: Edge[], start: number) {
  const adj = adjacency(n, edges, true);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const stack: number[] = [start];
  // 이웃 목록을 만들 때 간선 끝점을 두 번씩 읽는다.
  let reads = 2 * edges.length;
  let pops = 0;
  while (stack.length > 0) {
    const node = stack.pop() as number;
    pops++;
    if (visited[node] === true) continue;
    visited[node] = true;
    order.push(node);
    const list = adj[node] as number[];
    reads += list.length;
    for (let i = list.length - 1; i >= 0; i--) stack.push(list[i] as number);
  }
  return { order, reads, pops };
}

/**
 * 이웃 목록은 만들어 두되 **정렬하지 않고**, 다음에 갈 정점을 고를 때마다 그 목록을 처음부터
 * 읽어 아직 방문하지 않은 최솟값을 찾는다. `deep.build` ⑤ 가 먼저 시험하는 후보다.
 */
function pickMinCounts(n: number, edges: Edge[], start: number) {
  const adj = adjacency(n, edges, false);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const path: number[] = [start];
  visited[start] = true;
  order.push(start);
  let reads = 0;
  while (path.length > 0) {
    const cur = path[path.length - 1] as number;
    let best = -1;
    for (const w of adj[cur] as number[]) {
      reads++;
      if (visited[w] === false && (best < 0 || w < best)) best = w;
    }
    if (best < 0) {
      path.pop();
      continue;
    }
    visited[best] = true;
    order.push(best);
    path.push(best);
  }
  return { order, reads };
}

/**
 * 정본의 두 갈림(목록을 정렬하는가 · 스택에 큰 번호부터 넣는가)을 매개변수로 뺀 사본.
 * `{ sorted: true, descending: true }` 가 정본과 같은 조합이다.
 */
function traverse(
  n: number,
  edges: Edge[],
  start: number,
  opt: { sorted: boolean; descending: boolean },
): number[] {
  const adj = adjacency(n, edges, opt.sorted);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const stack: number[] = [start];
  while (stack.length > 0) {
    const node = stack.pop() as number;
    if (visited[node] === true) continue;
    visited[node] = true;
    order.push(node);
    const list = adj[node] as number[];
    if (opt.descending) {
      for (let i = list.length - 1; i >= 0; i--) stack.push(list[i] as number);
    } else {
      for (const w of list) stack.push(w);
    }
  }
  return order;
}

/**
 * **다른 절차** — 방문 표시를 스택에 **넣을 때** 한다. 같은 정점이 스택에 두 번 들어가지
 * 않는 대신, 꺼내는 순서가 깊이 우선이 아니게 된다.
 */
function markOnPush(n: number, edges: Edge[], start: number): number[] {
  const adj = adjacency(n, edges, true);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const stack: number[] = [start];
  visited[start] = true;
  while (stack.length > 0) {
    const node = stack.pop() as number;
    order.push(node);
    const list = adj[node] as number[];
    for (let i = list.length - 1; i >= 0; i--) {
      const w = list[i] as number;
      if (visited[w] === true) continue;
      visited[w] = true;
      stack.push(w);
    }
  }
  return order;
}

/** **다른 절차** — 스택 배열 대신 함수 호출로 깊이를 잡는다. */
function recursive(n: number, edges: Edge[], start: number): number[] {
  const adj = adjacency(n, edges, true);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const go = (v: number): void => {
    visited[v] = true;
    order.push(v);
    for (const w of adj[v] as number[]) {
      if (visited[w] === false) go(w);
    }
  };
  go(start);
  return order;
}

/** 정점 `v` 개를 한 줄로 이은 그래프. */
function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v - 1; i++) edges.push([i, i + 1]);
  return edges;
}

/** 정점 0 이 나머지 전부와 이어진 그래프. */
function star(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 1; i < v; i++) edges.push([0, i]);
  return edges;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  dfsTraversal(n: number, edges: Edge[], start: number): number[];
}

const REF_PATH = new URL("./dfsTraversal-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 스택에 **큰 번호부터 넣던 줄** 하나를 작은 번호부터 넣도록 바꾼 사본. **정본 소스에서
 * 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const ascendingPush = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /for \(let i = list\.length - 1; i >= 0; i--\)/,
    "for (let i = 0; i < list.length; i++)",
  ],
});

/** 이웃 목록을 **정렬하던 줄** 하나를 지운 사본. 목록이 입력 순서 그대로 남는다. */
const unsorted = await loadMutant<Ref>(REF_PATH, {
  drop: /for \(const list of adj\) list\.sort/,
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "네 정점 그래프", n: FOUR_N, edges: FOUR_EDGES },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
];

const mutantRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: show(dfsTraversal(c.n, c.edges, 0)),
  broken: show(ascendingPush.dfsTraversal(c.n, c.edges, 0)),
}));

// 하나도 안 깨지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (mutantRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「방문 순서가 갈린다」가 거짓이다",
  );
}

/* ────────────────────────── 블록 ────────────────────────── */

const SCALE: number[] = [10, 1_000, 10_000, 100_000];
const STAR_V = 1_000;

export const PROOFS: Record<string, () => string> = {
  /** 가장 단순한 방법이 제약 규모에서 몇 번을 읽는가 — 수치 반박의 근거. */
  "naive-scale": () =>
    table(
      [
        ["정점 V", "간선 E", "고르기", "간선 끝점 읽기", "초당 1억 번 기준"],
        ...SCALE.map((v) => {
          const edges = chain(v);
          // 고르기 횟수는 정점 수로 정해진다 — 앞으로 한 번, 되돌아오며 한 번씩이다.
          const picks = 2 * v - 1;
          const reads = picks * 2 * edges.length;
          return [
            comma(v),
            comma(edges.length),
            comma(picks),
            comma(reads),
            `${(reads / 1e8).toFixed(3)}초`,
          ];
        }),
      ],
      [0, 1, 2, 3, 4],
    ).join("\n"),

  /** 같은 그래프에 두 방식을 걸어 읽은 원소 수를 나란히 센다. */
  "sweep-vs-list": () => {
    const s = sweepCounts(WALK_N, WALK_EDGES, 0);
    const l = listCounts(WALK_N, WALK_EDGES, 0);
    return table([
      ["", "읽은 원소", "되풀이한 횟수", "결과"],
      [
        "간선 목록을 매번 다시 읽는다",
        comma(s.reads),
        `고르기 ${s.picks}`,
        show(s.order),
      ],
      [
        "이웃 목록을 한 번 만든다",
        comma(l.reads),
        `꺼내기 ${l.pops}`,
        show(l.order),
      ],
    ]).join("\n");
  },

  /**
   * 이웃 목록을 만든 뒤에도 남는 갈림 — 고를 때마다 최솟값을 찾는가, 미리 정렬해 두고
   * 앞에서부터 읽는가. 별 모양에서 갈린다.
   */
  "pick-min-vs-order": () => {
    const edges = star(STAR_V);
    const p = pickMinCounts(STAR_V, edges, 0);
    const l = listCounts(STAR_V, edges, 0);
    return table(
      [
        ["", "목록에서 읽은 원소", "결과의 앞 네 개"],
        [
          "고를 때마다 최솟값을 찾는다",
          comma(p.reads),
          `${show(p.order.slice(0, 4))} …`,
        ],
        [
          "미리 정렬하고 앞에서부터 읽는다",
          comma(l.reads - 2 * edges.length),
          `${show(l.order.slice(0, 4))} …`,
        ],
      ],
      [1],
    ).join("\n");
  },

  /** 두 갈림의 네 조합을 두 입력에 걸어 결과를 낸다. */
  "combo-values": () => {
    const rows: string[][] = [
      ["이웃 목록", "스택에 넣는 순서", "여섯 정점", "네 정점"],
    ];
    for (const sorted of [false, true]) {
      for (const descending of [false, true]) {
        rows.push([
          sorted ? "오름차순 정렬" : "입력 순서 그대로",
          descending ? "큰 번호부터" : "작은 번호부터",
          show(traverse(WALK_N, WALK_EDGES, 0, { sorted, descending })),
          show(traverse(FOUR_N, FOUR_EDGES, 0, { sorted, descending })),
        ]);
      }
    }
    rows.push([
      "정본",
      "—",
      show(dfsTraversal(WALK_N, WALK_EDGES, 0)),
      show(dfsTraversal(FOUR_N, FOUR_EDGES, 0)),
    ]);
    return table(rows).join("\n");
  },

  /** 방문 표시를 넣을 때 하면 어디서 갈리는가. */
  "mark-on-push": () =>
    table([
      ["", "꺼낼 때 표시한다", "넣을 때 표시한다"],
      [
        "전개가 쓰는 여섯 정점",
        show(dfsTraversal(WALK_N, WALK_EDGES, 0)),
        show(markOnPush(WALK_N, WALK_EDGES, 0)),
      ],
      [
        "네 정점 그래프",
        show(dfsTraversal(FOUR_N, FOUR_EDGES, 0)),
        show(markOnPush(FOUR_N, FOUR_EDGES, 0)),
      ],
    ]).join("\n"),

  /** 재귀로 적으면 호출 깊이가 그대로 체인 길이가 된다. */
  "recursion-depth": () => {
    const rows: string[][] = [
      ["체인 길이", "재귀로 적는다", "스택 배열로 적는다"],
    ];
    for (const v of [1_000, 100_000]) {
      const edges = chain(v);
      let byRecursion: string;
      try {
        byRecursion = `길이 ${comma(recursive(v, edges, 0).length)} 배열`;
      } catch (e) {
        byRecursion = (e as Error).constructor.name;
      }
      rows.push([
        comma(v),
        byRecursion,
        `길이 ${comma(dfsTraversal(v, edges, 0).length)} 배열`,
      ]);
    }
    return table(rows, [0]).join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => number[] }[] = [
      {
        call: "dfsTraversal(6, [[0,2],[0,1],[1,3],[2,4]], 0)",
        run: () => dfsTraversal(WALK_N, WALK_EDGES, 0),
      },
      {
        call: "dfsTraversal(4, [[0,1],[1,2],[2,3]], 2)",
        run: () => dfsTraversal(4, chain(4), 2),
      },
      {
        call: "dfsTraversal(5, [[0,1],[2,3]], 0)",
        run: () =>
          dfsTraversal(
            5,
            [
              [0, 1],
              [2, 3],
            ],
            0,
          ),
      },
      {
        call: "dfsTraversal(3, [[0,0],[0,1],[0,1]], 0)",
        run: () =>
          dfsTraversal(
            3,
            [
              [0, 0],
              [0, 1],
              [0, 1],
            ],
            0,
          ),
      },
      {
        call: "dfsTraversal(3, [[0,1]], 2)",
        run: () => dfsTraversal(3, [[0, 1]], 2),
      },
      { call: "dfsTraversal(1, [], 0)", run: () => dfsTraversal(1, [], 0) },
    ];
    return table(cases.map((c) => [c.call, "→", show(c.run())])).join("\n");
  },

  /**
   * 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다 — 옛 이해 시험 `V5` 가
   * 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만 달라도 잡는다.
   */
  "mutant-push-order": () =>
    table([
      ["", "큰 번호부터 넣는다", "작은 번호부터 넣는다"],
      ...mutantRows.map((r) => [r.label, r.correct, r.broken]),
    ]).join("\n"),

  /** 정렬하던 줄을 지우면 결과가 입력 순서에 좌우된다. */
  "mutant-unsorted": () =>
    table([
      ["입력 간선 목록", "정렬한다", "정렬하지 않는다"],
      [
        "[[0,2],[0,1],[1,3],[2,4]]",
        show(dfsTraversal(WALK_N, WALK_EDGES, 0)),
        show(unsorted.dfsTraversal(WALK_N, WALK_EDGES, 0)),
      ],
      [
        "[[0,1],[0,2],[1,3],[2,4]]",
        show(
          dfsTraversal(
            WALK_N,
            [
              [0, 1],
              [0, 2],
              [1, 3],
              [2, 4],
            ],
            0,
          ),
        ),
        show(
          unsorted.dfsTraversal(
            WALK_N,
            [
              [0, 1],
              [0, 2],
              [1, 3],
              [2, 4],
            ],
            0,
          ),
        ),
      ],
    ]).join("\n"),
};
