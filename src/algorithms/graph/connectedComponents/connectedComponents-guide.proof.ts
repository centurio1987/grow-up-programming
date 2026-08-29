/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/connectedComponents/connectedComponents-guide.md
 *
 * **계수를 세는 사본이 둘 있다**(`restartCounts`·`shareCounts`). 정본은 몇 번 셌는지를
 * 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표의 「결과」 칸은 전부 정본이나 정본에서 기계로 만든
 * 변이가 낸 값이고, 사본은 숫자만 낸다.
 *
 * 사본이 하나 더 있다(`discoveryOrder`). 그것은 계수가 아니라 **오해를 그대로 구현한 것**이라
 * 정본이 될 수 없다 — 그 자리에서 옳은 답은 정본이 낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { connectedComponents } from "./connectedComponents-guide.ref.ts";

type Edge = [number, number];

/** 본문 전개가 쓰는 고정 입력 — 삼각형 {0,4,2} · 간선 하나 {1,3} · 외딴 정점 {5}. */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 4],
  [4, 2],
  [2, 0],
  [1, 3],
];

/** 같은 그래프에 자기 루프 `[1,1]` 과 중복 간선 `[0,4]` 를 더한 것. */
const DIRTY_EDGES: Edge[] = [
  [0, 4],
  [4, 2],
  [2, 0],
  [1, 3],
  [1, 1],
  [0, 4],
];

/** 사슬 0-1-2-3. 변이가 **답을 안 바꾸는** 입력이라 함께 싣는다. */
const CHAIN4: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
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

/** `[[0,2,4],[1,3],[5]]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[][]): string =>
  `[${xs.map((c) => `[${c.join(",")}]`).join(",")}]`;

/** `19,999,800,000` 꼴 — 본문 표기와 같다. */
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

/* ────────────────────── 그래프 만들기 ────────────────────── */

function adjacency(n: number, edges: Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  return adj;
}

/** 정점 `v` 개를 한 줄로 이은 사슬. 성분 하나, 간선 `v - 1` 개. */
function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v - 1; i++) edges.push([i, i + 1]);
  return edges;
}

/** 정점 `v` 개를 크기가 같은 성분 `k` 개로 가른다. 각 성분은 사슬이다. */
function chains(v: number, k: number): Edge[] {
  const size = v / k;
  const edges: Edge[] = [];
  for (let c = 0; c < k; c++) {
    for (let j = 0; j < size - 1; j++) {
      edges.push([c * size + j, c * size + j + 1]);
    }
  }
  return edges;
}

/* ────────────────────── 계수를 세는 사본 둘 ────────────────────── */

/**
 * 가장 단순한 방법 — **정점마다** 도달 가능한 정점을 새로 모으고, 방문 표시를 그때마다 새로
 * 만든다. 같은 모임이 성분 크기만큼 중복으로 나오므로 마지막에 중복을 지운다.
 */
function restartCounts(n: number, edges: Edge[]) {
  const adj = adjacency(n, edges);
  let initCells = 0;
  let touches = 0;
  const bags: string[] = [];
  for (let s = 0; s < n; s++) {
    const seen = Array.from({ length: n }, () => false);
    initCells += n;
    seen[s] = true;
    const queue = [s];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        touches++;
        if (seen[next] === true) continue;
        seen[next] = true;
        queue.push(next);
      }
    }
    bags.push(
      queue
        .slice()
        .sort((a, b) => a - b)
        .join(","),
    );
  }
  const unique = [...new Set(bags)];
  return { initCells, touches, bags: bags.length, groups: unique.length };
}

/** 정본과 같은 절차. 세는 것만 덧붙였다. */
function shareCounts(n: number, edges: Edge[]) {
  const adj = adjacency(n, edges);
  const comp = Array.from({ length: n }, () => -1);
  let count = 0;
  let scans = 0;
  let touches = 0;
  let pushes = 0;
  for (let s = 0; s < n; s++) {
    scans++;
    if (comp[s] !== -1) continue;
    comp[s] = count;
    const queue = [s];
    pushes++;
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        touches++;
        if ((comp[next] as number) !== -1) continue;
        comp[next] = count;
        queue.push(next);
        pushes++;
      }
    }
    count++;
  }
  return { initCells: n, scans, touches, pushes, groups: count };
}

/**
 * 오해를 그대로 구현한 사본 — 성분 안의 정점을 **만나는 순서대로** 담는다. 정본은 마지막에
 * 정점 번호 오름차순으로 한 번 더 통과하는데, 그 통과를 빼면 이 모양이 된다.
 */
function discoveryOrder(n: number, edges: Edge[]): number[][] {
  const adj = adjacency(n, edges);
  const comp = Array.from({ length: n }, () => -1);
  const out: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) continue;
    comp[s] = out.length;
    const queue = [s];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      for (const next of adj[node] as number[]) {
        if ((comp[next] as number) !== -1) continue;
        comp[next] = out.length;
        queue.push(next);
      }
    }
    out.push(queue);
  }
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 바깥 반복의 **건너뛰기 한 줄**을 지운 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const noSkip = await loadMutant<{
  connectedComponents(n: number, edges: Edge[]): number[][];
}>(new URL("./connectedComponents-guide.ref.ts", import.meta.url).pathname, {
  drop: /if \(comp\[s\] !== -1\) continue;/,
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "삼각형 + 간선 하나 + 외딴 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "사슬 0-1-2-3", n: 4, edges: CHAIN4 },
  { label: "간선 없음 (정점 4)", n: 4, edges: [] },
];

const mutantRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: show(connectedComponents(c.n, c.edges)),
  broken: show(noSkip.connectedComponents(c.n, c.edges)),
}));

// 하나도 안 깨지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (mutantRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「성분이 쪼개진다」가 거짓이다",
  );
}

/* ─────────────────── 규모 표의 닫힌 식을 실행으로 검산 ─────────────────── */

/**
 * 정점 `v` 개짜리 사슬에서 가장 단순한 방법의 계수는 닫힌 식으로 적힌다 —
 * 방문 표시 `v²` 칸, 이웃 검사 `v × 2(v-1)` 번. 10만 정점을 실제로 돌리면 300 억 번이라
 * 실행이 안 끝나므로 표는 이 식으로 채우고, **식이 맞는지는 작은 값에서 실행으로 맞춘다.**
 */
for (const v of [10, 400]) {
  const got = restartCounts(v, chain(v));
  if (got.initCells !== v * v || got.touches !== v * 2 * (v - 1)) {
    throw new Error(
      `규모 표의 식이 실행과 다르다 — v=${v}: 초기화 ${got.initCells} vs ${v * v}, 이웃 검사 ${got.touches} vs ${v * 2 * (v - 1)}`,
    );
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

const SCALE: number[] = [10, 1_000, 10_000, 100_000];
const SPLITS: number[] = [1, 2, 3, 4, 6, 12];

export const PROOFS: Record<string, () => string> = {
  /** 가장 단순한 방법이 제약 규모에서 몇 번을 세는가 — 수치 반박의 근거. */
  "naive-scale": () =>
    table(
      [
        ["정점 V", "간선 E", "방문 표시 칸", "이웃 검사", "초당 1억 번 기준"],
        ...SCALE.map((v) => {
          const init = v * v;
          const touches = v * 2 * (v - 1);
          return [
            comma(v),
            comma(v - 1),
            comma(init),
            comma(touches),
            `${((init + touches) / 1e8).toFixed(3)}초`,
          ];
        }),
      ],
      [0, 1, 2, 3, 4],
    ).join("\n"),

  /** 같은 그래프에 두 방식을 걸어 계수를 나란히 센다. */
  "restart-vs-share": () => {
    const r = restartCounts(WALK_N, WALK_EDGES);
    const s = shareCounts(WALK_N, WALK_EDGES);
    return table([
      ["", "방문 표시 칸", "이웃 검사", "만든 모임", "결과"],
      [
        "정점마다 새로 탐색한다",
        String(r.initCells),
        String(r.touches),
        `${r.bags} → ${r.groups}`,
        show(connectedComponents(WALK_N, WALK_EDGES)),
      ],
      [
        "성분 번호를 한 벌로 유지한다",
        String(s.initCells),
        String(s.touches),
        String(s.groups),
        show(connectedComponents(WALK_N, WALK_EDGES)),
      ],
    ]).join("\n");
  },

  /** 정점 수를 12 로 고정하고 성분 수만 바꿔 두 방식의 총 계수를 낸다. */
  "split-sweep": () => {
    const rows = SPLITS.map((k) => {
      const edges = chains(12, k);
      const r = restartCounts(12, edges);
      const s = shareCounts(12, edges);
      return [
        String(k),
        String(edges.length),
        String(s.scans + s.touches + s.pushes),
        String(r.initCells + r.touches),
      ];
    });
    return table(
      [
        ["성분 수 k", "간선 E", "번호를 유지한다", "정점마다 새로 탐색한다"],
        ...rows,
      ],
      [0, 1, 2, 3],
    ).join("\n");
  },

  /** 담는 순서를 만난 순서로 두면 성분 안이 오름차순이 아니다. */
  "discovery-order": () =>
    table([
      ["담는 순서", "결과"],
      ["만나는 순서대로 담는다", show(discoveryOrder(WALK_N, WALK_EDGES))],
      [
        "정점 번호 오름차순으로 담는다",
        show(connectedComponents(WALK_N, WALK_EDGES)),
      ],
    ]).join("\n"),

  /** 자기 루프와 중복 간선을 거른 입력과 그대로 둔 입력. */
  "dup-loop": () => {
    const clean = shareCounts(WALK_N, WALK_EDGES);
    const dirty = shareCounts(WALK_N, DIRTY_EDGES);
    return table([
      ["입력", "간선 E", "이웃 목록 칸", "이웃 검사", "결과"],
      [
        "자기 루프·중복 간선을 지운 것",
        String(WALK_EDGES.length),
        String(2 * WALK_EDGES.length),
        String(clean.touches),
        show(connectedComponents(WALK_N, WALK_EDGES)),
      ],
      [
        "그대로 둔 것",
        String(DIRTY_EDGES.length),
        String(2 * DIRTY_EDGES.length),
        String(dirty.touches),
        show(connectedComponents(WALK_N, DIRTY_EDGES)),
      ],
    ]).join("\n");
  },

  /**
   * 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다 — 옛 이해 시험 `V5` 가
   * 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만 달라도 잡는다.
   */
  "mutant-skip": () =>
    table([
      ["", "건너뛰기가 있을 때", "그 줄을 지웠을 때"],
      ...mutantRows.map((r) => [r.label, r.correct, r.broken]),
    ]).join("\n"),

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "final-cases": () => {
    const cases: { call: string; run: () => number[][] }[] = [
      {
        call: "connectedComponents(6, [[0,4],[4,2],[2,0],[1,3]])",
        run: () => connectedComponents(WALK_N, WALK_EDGES),
      },
      {
        call: "connectedComponents(5, [[0,1],[1,2],[3,4]])",
        run: () =>
          connectedComponents(5, [
            [0, 1],
            [1, 2],
            [3, 4],
          ]),
      },
      {
        call: "connectedComponents(4, [[0,1],[1,2],[2,3],[3,0]])",
        run: () =>
          connectedComponents(4, [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
          ]),
      },
      {
        call: "connectedComponents(4, [])",
        run: () => connectedComponents(4, []),
      },
      {
        call: "connectedComponents(3, [[1,1]])",
        run: () => connectedComponents(3, [[1, 1]]),
      },
      {
        call: "connectedComponents(1, [])",
        run: () => connectedComponents(1, []),
      },
    ];
    return table(cases.map((c) => [c.call, "→", show(c.run())])).join("\n");
  },
};
