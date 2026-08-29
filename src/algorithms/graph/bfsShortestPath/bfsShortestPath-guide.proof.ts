/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.md
 *
 * **계수를 세는 사본이 셋 있다**(`sweepCounts`·`queueCounts`·`minFirstCounts`). 정본은 몇 번
 * 셌는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「결과」 칸은 전부 정본이나 정본에서
 * 기계로 만든 변이가 낸 값이고, 사본은 숫자만 낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { bfsShortestPath } from "./bfsShortestPath-guide.ref.ts";

type Edge = [number, number];

/** 본문 전개가 쓰는 고정 입력 — 정점 0~4 가 오각형이고 정점 5 는 간선이 없다. */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
];

/** 6-사이클. 앞에서 꺼내기와 뒤에서 꺼내기가 갈리는 것을 한 벌 더 확인한다. */
const CYCLE6: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
];

/** 사슬. 두 방식이 **같은 답**을 내는 입력이라 함께 싣는다. */
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

/** `[0, 1, 2, 2, 1, -1]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `19,999,600,002` 꼴 — 본문 표기와 같다. */
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

/* ────────────────────── 계수를 세는 사본 셋 ────────────────────── */

function adjacency(n: number, edges: Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  return adj;
}

/**
 * 가장 단순한 방법 — 라운드마다 **간선 목록 전부**를 다시 읽어, 한쪽 끝의 거리가 정해져
 * 있고 다른 쪽이 비어 있으면 채운다. 한 라운드는 거리를 한 칸씩만 넓혀야 하므로 그 라운드가
 * 시작할 때의 사본(`snap`)을 읽는다.
 */
function sweepCounts(n: number, edges: Edge[], source: number) {
  const dist = Array.from({ length: n }, () => -1);
  dist[source] = 0;
  let touches = 0;
  let round = 0;
  for (;;) {
    round++;
    const snap = dist.slice();
    let changed = false;
    for (const [u, v] of edges) {
      touches += 2;
      if ((snap[u] as number) !== -1 && (dist[v] as number) === -1) {
        dist[v] = (snap[u] as number) + 1;
        changed = true;
      }
      if ((snap[v] as number) !== -1 && (dist[u] as number) === -1) {
        dist[u] = (snap[v] as number) + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { dist, touches, round };
}

/** 정본과 같은 절차. 세는 것만 덧붙였다. */
function queueCounts(n: number, edges: Edge[], source: number) {
  const dist = Array.from({ length: n }, () => -1);
  const adj = adjacency(n, edges);
  const queue = [source];
  let head = 0;
  dist[source] = 0;
  let touches = 0;
  while (head < queue.length) {
    const node = queue[head++] as number;
    for (const next of adj[node] as number[]) {
      touches++;
      if ((dist[next] as number) !== -1) continue;
      dist[next] = (dist[node] as number) + 1;
      queue.push(next);
    }
  }
  return { dist, touches, popped: queue.length };
}

/**
 * 꺼내는 순서만 바꾼 사본 — **남은 것 중 거리가 가장 작은 것**을 선형 탐색으로 고른다.
 * 답은 맞고, 고르는 데 드는 비교가 계수로 남는다.
 */
function minFirstCounts(n: number, edges: Edge[], source: number) {
  const dist = Array.from({ length: n }, () => -1);
  const adj = adjacency(n, edges);
  const bag: number[] = [source];
  dist[source] = 0;
  let touches = 0;
  let compares = 0;
  while (bag.length > 0) {
    let best = 0;
    for (let i = 1; i < bag.length; i++) {
      compares++;
      const here = dist[bag[i] as number] as number;
      const bestDist = dist[bag[best] as number] as number;
      if (here < bestDist) best = i;
    }
    const node = bag.splice(best, 1)[0] as number;
    for (const next of adj[node] as number[]) {
      touches++;
      if ((dist[next] as number) !== -1) continue;
      dist[next] = (dist[node] as number) + 1;
      bag.push(next);
    }
  }
  return { dist, touches, compares };
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 큐의 **앞에서 꺼내던 줄** 하나를 뒤에서 꺼내도록 바꾼 사본. **정본 소스에서 기계로 만든다** —
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만
 * 바꿨다」가 검사되지 않는다.
 */
const backFirst = await loadMutant<{
  bfsShortestPath(n: number, edges: Edge[], source: number): number[];
}>(new URL("./bfsShortestPath-guide.ref.ts", import.meta.url).pathname, {
  swap: [/queue\[head\+\+\]/, "queue.pop()"],
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "오각형 + 외딴 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "6-사이클", n: 6, edges: CYCLE6 },
  { label: "사슬 0-1-2-3", n: 4, edges: CHAIN4 },
];

const mutantRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: show(bfsShortestPath(c.n, c.edges, 0)),
  broken: show(backFirst.bfsShortestPath(c.n, c.edges, 0)),
}));

// 하나도 안 깨지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (mutantRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「거리가 틀린다」가 거짓이다",
  );
}

/* ────────────────────────── 블록 ────────────────────────── */

const SCALE: number[] = [10, 1_000, 10_000, 100_000];

export const PROOFS: Record<string, () => string> = {
  /** 가장 단순한 방법이 제약 규모에서 몇 번을 세는가 — 수치 반박의 근거. */
  "naive-scale": () =>
    table(
      [
        ["정점 V", "간선 E", "라운드", "이웃 검사", "초당 1억 번 기준"],
        ...SCALE.map((v) => {
          const edges: Edge[] = [];
          for (let i = 0; i < v - 1; i++) edges.push([i, i + 1]);
          const rounds = v - 1;
          const touches = rounds * 2 * (v - 1);
          return [
            comma(v),
            comma(v - 1),
            comma(rounds),
            comma(touches),
            `${(touches / 1e8).toFixed(3)}초`,
          ];
        }),
      ],
      [0, 1, 2, 3, 4],
    ).join("\n"),

  /** 같은 그래프에 두 방식을 걸어 이웃 검사 횟수를 나란히 센다. */
  "sweep-vs-queue": () => {
    const s = sweepCounts(WALK_N, WALK_EDGES, 0);
    const q = queueCounts(WALK_N, WALK_EDGES, 0);
    return table([
      ["", "이웃 검사", "되풀이한 횟수", "결과"],
      [
        "간선 목록을 다시 읽는다",
        comma(s.touches),
        `라운드 ${s.round}`,
        show(s.dist),
      ],
      [
        "큐에서 하나씩 꺼낸다",
        comma(q.touches),
        `꺼낸 정점 ${q.popped}`,
        show(q.dist),
      ],
    ]).join("\n");
  },

  /** 꺼내는 순서 셋을 같은 그래프에 걸어 결과와 계수를 함께 낸다. */
  "order-values": () => {
    const fifo = queueCounts(WALK_N, WALK_EDGES, 0);
    const min = minFirstCounts(WALK_N, WALK_EDGES, 0);
    return table([
      ["꺼내는 순서", "결과 dist", "이웃 검사", "순서 비교"],
      [
        "먼저 넣은 것 먼저",
        show(bfsShortestPath(WALK_N, WALK_EDGES, 0)),
        String(fifo.touches),
        "0",
      ],
      [
        "나중 넣은 것 먼저",
        show(backFirst.bfsShortestPath(WALK_N, WALK_EDGES, 0)),
        String(fifo.touches),
        "0",
      ],
      [
        "거리가 가장 작은 것 먼저",
        show(min.dist),
        String(min.touches),
        String(min.compares),
      ],
    ]).join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => number[] }[] = [
      {
        call: "bfsShortestPath(6, [[0,1],[1,2],[2,3],[3,4],[4,0]], 0)",
        run: () => bfsShortestPath(WALK_N, WALK_EDGES, 0),
      },
      {
        call: "bfsShortestPath(4, [[0,1],[1,2],[2,3]], 0)",
        run: () => bfsShortestPath(4, CHAIN4, 0),
      },
      {
        call: "bfsShortestPath(4, [[0,1],[2,3]], 0)",
        run: () =>
          bfsShortestPath(
            4,
            [
              [0, 1],
              [2, 3],
            ],
            0,
          ),
      },
      {
        call: "bfsShortestPath(4, [], 1)",
        run: () => bfsShortestPath(4, [], 1),
      },
      {
        call: "bfsShortestPath(1, [], 0)",
        run: () => bfsShortestPath(1, [], 0),
      },
      {
        call: "bfsShortestPath(2, [[0,0],[0,1]], 0)",
        run: () =>
          bfsShortestPath(
            2,
            [
              [0, 0],
              [0, 1],
            ],
            0,
          ),
      },
    ];
    return table(cases.map((c) => [c.call, "→", show(c.run())])).join("\n");
  },

  /**
   * 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다 — 옛 이해 시험 `V5` 가
   * 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만 달라도 잡는다.
   */
  "mutant-front": () =>
    table([
      ["", "앞에서 꺼낸다", "뒤에서 꺼낸다"],
      ...mutantRows.map((r) => [r.label, r.correct, r.broken]),
    ]).join("\n"),
};
