/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.md
 *
 * **세는 사본이 넷 있다**(`walkAllPaths`·`walkWithBlack`·`twoColor`·`countCells`). 정본은
 * 몇 칸을 읽었는지도, 간선을 몇 번 따라갔는지도 내보내지 않으므로 세는 자리만 덧붙인 사본이
 * 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의
 * 「결과」 칸 중 옳은 쪽은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * 경쟁 설계의 계수는 `.alt.ts` 가 낸 것을 그대로 가져온다 — 같은 값을 두 파일이 각자 재면
 * 둘이 갈라진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { cases as ALT_CASES } from "./directedCycleDetection-guide.alt.ts";
import { directedCycleDetection } from "./directedCycleDetection-guide.ref.ts";

type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 간선 여덟 개가 네 갈래를 모두 실행하고, 마지막 간선 `5 → 0`
 * 에서 사이클이 판정된다.
 */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 3],
  [3, 4],
  [0, 4],
  [0, 2],
  [2, 3],
  [2, 5],
  [5, 0],
];

/** 마름모. 두 갈래가 같은 정점에서 만나므로 「본 적 있는 정점」과 사이클이 갈린다. */
const DIAMOND_N = 4;
const DIAMOND_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/** 다이아몬드 `k` 개를 이은 그래프 — 정점 `3k+1` 개 · 간선 `4k` 개 · 경로 `2^k` 개. */
function diamondChain(k: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i < k; i++) {
    const a = 3 * i;
    edges.push([a, a + 1], [a, a + 2], [a + 1, a + 3], [a + 2, a + 3]);
  }
  return { n: 3 * k + 1, edges };
}

/** `0 → 1 → … → v-1` 사슬. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부를 가리키는 그래프. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

const adjacency = (n: number, edges: Edge[]): number[][] => {
  const next: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (next[u] as number[]).push(v);
  return next;
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
 * 가장 단순한 방법 — 표시를 **지금 따라가는 경로에만** 둔다. 끝난 정점을 기억하지 않으므로
 * 같은 정점을 다른 경로로 몇 번이고 다시 내려간다. 답은 맞는다.
 */
function walkAllPaths(
  n: number,
  edges: Edge[],
): { steps: number; found: boolean } {
  const next = adjacency(n, edges);
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  let steps = 0;
  let found = false;
  const go = (u: number): void => {
    onPath[u] = true;
    for (const v of next[u] as number[]) {
      steps++;
      if (onPath[v] === true) {
        found = true;
        break;
      }
      go(v);
      if (found) break;
    }
    onPath[u] = false;
  };
  for (let s = 0; s < n && !found; s++) go(s);
  return { steps, found };
}

/** 같은 절차에 **검은색 표시**만 더한 것. 끝난 정점으로는 다시 안 내려간다. */
function walkWithBlack(
  n: number,
  edges: Edge[],
): { steps: number; found: boolean } {
  const next = adjacency(n, edges);
  const color: number[] = Array.from({ length: n }, () => 0);
  let steps = 0;
  let found = false;
  const go = (u: number): void => {
    color[u] = 1;
    for (const v of next[u] as number[]) {
      steps++;
      if (color[v] === 1) {
        found = true;
        break;
      }
      if (color[v] === 0) go(v);
      if (found) break;
    }
    color[u] = 2;
  };
  for (let s = 0; s < n && !found; s++) if (color[s] === 0) go(s);
  return { steps, found };
}

/** 바깥 `for` 문 없이 **정점 0 에서 한 번만** 시작하는 사본. */
function startAtZeroOnly(n: number, edges: Edge[]): boolean {
  const next = adjacency(n, edges);
  const color: number[] = Array.from({ length: n }, () => 0);
  let found = false;
  const go = (u: number): void => {
    color[u] = 1;
    for (const v of next[u] as number[]) {
      if (color[v] === 1) {
        found = true;
        return;
      }
      if (color[v] === 0) go(v);
      if (found) return;
    }
    color[u] = 2;
  };
  if (n > 0) go(0);
  return found;
}

/**
 * `cursor` 를 두지 않고 스택 꼭대기를 볼 때마다 `next[u]` 를 **처음부터** 확인하는 사본.
 * 읽은 목록 원소 수를 센다. 답은 정본과 같다.
 */
function withoutCursor(
  n: number,
  edges: Edge[],
): { reads: number; answer: boolean } {
  const next = adjacency(n, edges);
  const color: number[] = Array.from({ length: n }, () => 0);
  const stack: number[] = [];
  let reads = 0;

  for (let s = 0; s < n; s++) {
    if (color[s] !== 0) continue;
    color[s] = 1;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      let descended = false;
      for (const v of list) {
        reads++;
        if (color[v] === 1) return { reads, answer: true };
        if (color[v] === 0) {
          color[v] = 1;
          stack.push(v);
          descended = true;
          break;
        }
      }
      if (!descended) {
        color[u] = 2;
        stack.pop();
      }
    }
  }
  return { reads, answer: false };
}

/** 정본과 같은 절차에서 읽은 목록 원소 수만 센다 — `cursor` 가 있으면 간선마다 한 번이다. */
function withCursor(
  n: number,
  edges: Edge[],
): { reads: number; answer: boolean } {
  const next = adjacency(n, edges);
  const color: number[] = Array.from({ length: n }, () => 0);
  const cursor: number[] = Array.from({ length: n }, () => 0);
  const stack: number[] = [];
  let reads = 0;

  for (let s = 0; s < n; s++) {
    if (color[s] !== 0) continue;
    color[s] = 1;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      const i = cursor[u] as number;
      if (i === list.length) {
        color[u] = 2;
        stack.pop();
        continue;
      }
      cursor[u] = i + 1;
      reads++;
      const v = list[i] as number;
      if (color[v] === 1) return { reads, answer: true };
      if (color[v] === 0) {
        color[v] = 1;
        stack.push(v);
      }
    }
  }
  return { reads, answer: false };
}

/** 색을 **둘**로 둔 절차 — 「본 적 있음」이면 전부 사이클로 본다. */
function twoColor(n: number, edges: Edge[]): boolean {
  const next = adjacency(n, edges);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  let found = false;
  const go = (u: number): void => {
    seen[u] = true;
    for (const v of next[u] as number[]) {
      if (seen[v] === true) {
        found = true;
        return;
      }
      go(v);
      if (found) return;
    }
  };
  for (let s = 0; s < n && !found; s++) if (seen[s] === false) go(s);
  return found;
}

/** 정본과 같은 절차. 읽고 쓴 배열 칸만 덧붙여 센다 — `deep.math` 의 닫힌 형태와 맞춘다. */
function countCells(
  n: number,
  edges: Edge[],
): { cells: number; answer: boolean } {
  let cells = 0;
  const next: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  for (const [u, v] of edges) {
    cells += 2;
    (next[u] as number[]).push(v);
  }
  const color: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  const cursor: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  const stack: number[] = [];

  for (let s = 0; s < n; s++) {
    cells++;
    if (color[s] !== 0) continue;
    cells += 2;
    color[s] = 1;
    stack.push(s);
    while (stack.length > 0) {
      cells += 3;
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      const i = cursor[u] as number;
      if (i === list.length) {
        cells += 2;
        color[u] = 2;
        stack.pop();
        continue;
      }
      cells += 3;
      cursor[u] = i + 1;
      const v = list[i] as number;
      if (color[v] === 1) return { cells, answer: true };
      if (color[v] === 0) {
        cells += 2;
        color[v] = 1;
        stack.push(v);
      }
    }
  }
  return { cells, answer: false };
}

/**
 * 간선을 넷으로 가른다. **조기 종료를 하지 않는 사본**이다 — 정본은 첫 역방향 간선에서
 * 멈추므로 그 뒤 간선의 분류가 안 나온다. 전개 입력에서는 역방향 간선이 마지막 간선이라
 * 두 절차가 확인하는 간선의 목록이 같다.
 */
function classifyEdges(
  n: number,
  edges: Edge[],
): { edge: string; color: string; kind: string }[] {
  const next = adjacency(n, edges);
  const color: number[] = Array.from({ length: n }, () => 0);
  const start: number[] = Array.from({ length: n }, () => -1);
  const end: number[] = Array.from({ length: n }, () => -1);
  const out: { edge: string; color: string; kind: string }[] = [];
  let clock = 0;
  const NAME = ["흰색", "회색", "검은색"];

  const go = (u: number): void => {
    color[u] = 1;
    start[u] = clock++;
    for (const v of next[u] as number[]) {
      const seen = color[v] as number;
      let kind: string;
      if (seen === 0) kind = "나무 간선";
      else if (seen === 1) kind = "역방향 간선";
      else if ((start[u] as number) < (start[v] as number))
        kind = "순방향 간선";
      else kind = "교차 간선";
      out.push({ edge: `${u} → ${v}`, color: NAME[seen] as string, kind });
      if (seen === 0) go(v);
    }
    color[u] = 2;
    end[u] = clock++;
  };
  for (let s = 0; s < n; s++) if (color[s] === 0) go(s);
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  directedCycleDetection(n: number, edges: Edge[]): boolean;
}

const REF_PATH = new URL(
  "./directedCycleDetection-guide.ref.ts",
  import.meta.url,
).pathname;

/**
 * 회색인지 보던 조건을 **「흰색이 아니면」** 으로 바꾼 사본. 색이 셋에서 사실상 둘로 줄어,
 * 이미 끝난 정점(검은색)으로 가는 간선까지 사이클로 판정한다.
 */
const twoColorMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /^\s+if \(color\[v\] === GRAY\) return true;/,
    "      if (color[v] !== WHITE) return true;",
  ],
});

/**
 * 경로에서 뺄 때 **검은색으로 칠하지 않는** 사본. 끝난 정점이 회색으로 남아 「회색 = 지금
 * 경로 위」가 거짓이 된다.
 */
const stayGrayMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [/^\s+color\[u\] = BLACK;/, "        color[u] = GRAY;"],
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
  {
    label: "교차 간선 0→1 · 0→2 · 1→2",
    n: 3,
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  { label: "간선이 없는 네 정점", n: 4, edges: [] },
];

const twoColorRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: String(directedCycleDetection(c.n, c.edges)),
  broken: String(twoColorMutant.directedCycleDetection(c.n, c.edges)),
}));

const stayGrayRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: String(directedCycleDetection(c.n, c.edges)),
  broken: String(stayGrayMutant.directedCycleDetection(c.n, c.edges)),
}));

// 변이가 어느 입력에서도 결과를 안 바꾸면 「어긋난다」가 거짓이다. 실행이 그것을 판정한다.
for (const [name, rows] of [
  ["색을 둘로 줄인 변이", twoColorRows],
  ["검은색으로 안 칠하는 변이", stayGrayRows],
] as const) {
  if (rows.every((r) => r.correct === r.broken)) {
    throw new Error(`${name}가 어느 입력에서도 결과를 바꾸지 못했다`);
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

/** `2^k` 의 자릿수. 로그를 더해서 낸다 — 큰 정수를 실제로 만들지 않는다. */
const powerDigits = (k: number): number => Math.floor(k * Math.log10(2)) + 1;

export const PROOFS: Record<string, () => string> = {
  /** 경로를 전부 따라가면 다이아몬드를 이을수록 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["다이아몬드 k", "정점 V", "간선 E", "경로 수 2^k", "따라간 간선 수"],
    ];
    for (const k of [1, 2, 4, 8, 12, 16]) {
      const { n, edges } = diamondChain(k);
      rows.push([
        comma(k),
        comma(n),
        comma(edges.length),
        comma(2 ** k),
        comma(walkAllPaths(n, edges).steps),
      ]);
    }
    const k = 25_000;
    const { n, edges } = diamondChain(k);
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 제약 안에서 k 를 ${comma(k)} 까지 늘릴 수 있고(정점 ${comma(n)} · 간선 ${comma(edges.length)}),
          그때 경로 수 2^k 는 ${comma(powerDigits(k))} 자리다`;
  },

  /** 검은색 표시 하나가 같은 입력에서 걸음 수를 얼마나 바꾸는가. */
  "black-mark-values": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
      { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
      { label: "다이아몬드 8 개", ...diamondChain(8) },
      { label: "다이아몬드 16 개", ...diamondChain(16) },
      { label: "사슬 1,000", n: 1_000, edges: chain(1_000) },
    ];
    return table(
      [
        [
          "입력",
          "V",
          "E",
          "표시를 경로에만 둔다",
          "끝난 정점을 검은색으로",
          "배수",
        ],
        ...cases.map((c) => {
          const a = walkAllPaths(c.n, c.edges);
          const b = walkWithBlack(c.n, c.edges);
          return [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma(a.steps),
            comma(b.steps),
            `${(a.steps / b.steps).toFixed(1)} 배`,
          ];
        }),
      ],
      [1, 2, 3, 4, 5],
    ).join("\n");
  },

  /** 색을 둘로 두면 어느 입력에서 답이 갈리는가. */
  "color-count-values": () =>
    table([
      ["입력", "색 둘 — 본 적 있으면 사이클", "색 셋 — 정본"],
      ...MUTANT_CASES.map((c) => [
        c.label,
        String(twoColor(c.n, c.edges)),
        String(directedCycleDetection(c.n, c.edges)),
      ]),
    ]).join("\n"),

  /** 정점 0 에서 한 번만 시작하면 어느 입력에서 답이 갈리는가. */
  "component-values": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      {
        label: "0→1 과 사이클 2→3→4→2",
        n: 5,
        edges: [
          [0, 1],
          [2, 3],
          [3, 4],
          [4, 2],
        ],
      },
      {
        label: "자기 루프가 정점 3 에 있다",
        n: 4,
        edges: [
          [0, 1],
          [1, 2],
          [3, 3],
        ],
      },
      {
        label: "사이클이 0 에서 이어진다 0→1→2→0",
        n: 3,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      },
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
    ];
    return table([
      ["입력", "0 에서 한 번만 시작한다", "모든 흰색 정점에서 시작한다"],
      ...cases.map((c) => [
        c.label,
        String(startAtZeroOnly(c.n, c.edges)),
        String(directedCycleDetection(c.n, c.edges)),
      ]),
    ]).join("\n");
  },

  /** `cursor` 를 두는 것과 매번 처음부터 확인하는 것의 계수 차이. 답은 갈리지 않는다. */
  "cursor-values": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
      { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
      { label: "별 모양 1,000", n: 1_000, edges: star(1_000) },
      { label: "별 모양 10,000", n: 10_000, edges: star(10_000) },
      { label: "사슬 10,000", n: 10_000, edges: chain(10_000) },
    ];
    return table(
      [
        ["입력", "E", "cursor 를 둔다", "매번 처음부터", "답이 같은가"],
        ...cases.map((c) => {
          const a = withCursor(c.n, c.edges);
          const b = withoutCursor(c.n, c.edges);
          return [
            c.label,
            comma(c.edges.length),
            comma(a.reads),
            comma(b.reads),
            a.answer === b.answer ? `같다 (${a.answer})` : "다르다",
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 전개 입력의 간선 여덟 개가 각각 무엇인가. */
  "edge-classes": () => {
    const rows = classifyEdges(WALK_N, WALK_EDGES);
    return table([
      ["간선", "확인할 때 도착 정점의 색", "분류", "사이클인가"],
      ...rows.map((r) => [
        r.edge,
        r.color,
        r.kind,
        r.kind === "역방향 간선" ? "그렇다" : "아니다",
      ]),
    ]).join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => boolean }[] = [
      {
        call: "directedCycleDetection(6, [[0,1],[1,3],[3,4],[0,4],[0,2],[2,3],[2,5],[5,0]])",
        run: () => directedCycleDetection(WALK_N, WALK_EDGES),
      },
      {
        call: "directedCycleDetection(4, [[0,1],[0,2],[1,3],[2,3]])",
        run: () => directedCycleDetection(DIAMOND_N, DIAMOND_EDGES),
      },
      {
        call: "directedCycleDetection(3, [[0,1],[0,2],[1,2]])",
        run: () =>
          directedCycleDetection(3, [
            [0, 1],
            [0, 2],
            [1, 2],
          ]),
      },
      {
        call: "directedCycleDetection(4, [[0,1],[1,2],[2,3],[3,1]])",
        run: () =>
          directedCycleDetection(4, [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 1],
          ]),
      },
      {
        call: "directedCycleDetection(2, [[0,1],[1,0]])",
        run: () =>
          directedCycleDetection(2, [
            [0, 1],
            [1, 0],
          ]),
      },
      {
        call: "directedCycleDetection(1, [[0,0]])",
        run: () => directedCycleDetection(1, [[0, 0]]),
      },
      {
        call: "directedCycleDetection(5, [])",
        run: () => directedCycleDetection(5, []),
      },
    ];
    return table(cases.map((c) => [c.call, "→", String(c.run())])).join("\n");
  },

  /** 색을 둘로 줄인 변이가 내는 실제 값. */
  "mutant-two-color": () =>
    table([
      ["", "회색만 사이클로 본다", "흰색이 아니면 사이클로 본다"],
      ...twoColorRows.map((r) => [r.label, r.correct, r.broken]),
    ]).join("\n"),

  /** 경로에서 뺄 때 검은색으로 안 칠한 변이가 내는 실제 값. */
  "mutant-stay-gray": () =>
    table([
      ["", "뺄 때 검은색으로 칠한다", "뺄 때도 회색으로 둔다"],
      ...stayGrayRows.map((r) => [r.label, r.correct, r.broken]),
    ]).join("\n"),

  /** 닫힌 형태 `11V + 8E` 가 실제 계수와 같은지 대조한다 — 사이클이 없는 입력이다. */
  "cost-closed-form": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
      { label: "다이아몬드 16 개", ...diamondChain(16) },
      { label: "사슬 1,000", n: 1_000, edges: chain(1_000) },
      { label: "별 모양 1,000", n: 1_000, edges: star(1_000) },
      { label: "사슬 100,000", n: 100_000, edges: chain(100_000) },
    ];
    return table(
      [
        ["입력", "V", "E", "실제 배열 칸 접근", "11V + 8E"],
        ...cases.map((c) => [
          c.label,
          comma(c.n),
          comma(c.edges.length),
          comma(countCells(c.n, c.edges).cells),
          comma(11 * c.n + 8 * c.edges.length),
        ]),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 같은 V·E 에서 모양과 사이클 자리를 바꾸면 계수가 갈리는가. */
  "shape-values": () => {
    const V = 100_000;
    const shapes: { label: string; edges: Edge[] }[] = [
      {
        // 사슬에 순방향 간선 0→2 를 더해 간선 수를 제약 상한까지 채운 것이다.
        label: "사슬 + 순방향 간선 하나 (사이클 없음)",
        edges: [...chain(V), [0, 2] as Edge],
      },
      {
        label: "별 모양 + 순방향 간선 하나 (사이클 없음)",
        edges: [...star(V), [1, 2] as Edge],
      },
      {
        label: "사슬이 닫힌다 99,999 → 0",
        edges: [...chain(V), [V - 1, 0] as Edge],
      },
      {
        label: "사이클이 정점 0 에서 두 걸음",
        edges: [[2, 1] as Edge, ...chain(V)],
      },
    ];
    return table(
      [
        ["입력 모양", "V", "E", "배열 칸 접근", "반환값"],
        ...shapes.map((s) => {
          const counted = countCells(V, s.edges);
          return [
            s.label,
            comma(V),
            comma(s.edges.length),
            comma(counted.cells),
            String(directedCycleDetection(V, s.edges)),
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 경쟁 설계와 나란히 잰 값. `.alt.ts` 가 낸 것을 그대로 옮긴다. */
  "alt-flip": () => {
    const metrics = [
      "전개가 쓰는 여섯 정점에서 배열 칸 접근",
      "사이클이 정점 0 에서 두 걸음일 때 배열 칸 접근",
      "사이클이 정점 0 에서 99,992 걸음일 때 배열 칸 접근",
      "사이클이 정점 0 에서 99,993 걸음일 때 배열 칸 접근",
      "사이클이 씨앗을 전부 막을 때 배열 칸 접근",
      "사이클이 없는 사슬에서 배열 칸 접근",
      "사이클이 없는 사슬에서 새로 잡는 칸",
    ];
    const three: Record<string, number> = ALT_CASES["삼색 표시"]();
    const indeg: Record<string, number> = ALT_CASES["진입차수 세기"]();
    return table(
      [
        ["재는 것", "삼색 표시", "진입차수 세기", "어느 쪽이 적은가"],
        ...metrics.map((m) => {
          const a = three[m] as number;
          const b = indeg[m] as number;
          return [m, comma(a), comma(b), a < b ? "삼색 표시" : "진입차수 세기"];
        }),
      ],
      [1, 2],
    ).join("\n");
  },

  /** 간선 `[0,4]` 를 목록 맨 앞으로 옮기면 간선의 분류와 반환값이 어떻게 되는가. */
  "order-swap": () => {
    const moved: Edge[] = [
      [0, 4],
      [0, 1],
      [1, 3],
      [3, 4],
      [0, 2],
      [2, 3],
      [2, 5],
      [5, 0],
    ];
    const before = new Map(
      classifyEdges(WALK_N, WALK_EDGES).map((r) => [r.edge, r.kind]),
    );
    const after = new Map(
      classifyEdges(WALK_N, moved).map((r) => [r.edge, r.kind]),
    );
    const rows = [...after.keys()].map((edge) => [
      edge,
      before.get(edge) ?? "—",
      after.get(edge) ?? "—",
      before.get(edge) === after.get(edge) ? "그대로" : "바뀐다",
    ]);
    return table([
      ["간선", "본문 순서에서", "[0,4] 를 맨 앞으로 옮기면", ""],
      ...rows,
      [
        "반환값",
        String(directedCycleDetection(WALK_N, WALK_EDGES)),
        String(directedCycleDetection(WALK_N, moved)),
        directedCycleDetection(WALK_N, WALK_EDGES) ===
        directedCycleDetection(WALK_N, moved)
          ? "그대로"
          : "바뀐다",
      ],
    ]).join("\n");
  },
};
