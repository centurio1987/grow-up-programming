/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/bfsShortestPath/bfsShortestPath-guide.md
 *
 * **세는 자리를 덧붙인 사본이 몇 있다**(`traced` · `sweepTrace` · `bagTrace` · `stats` ·
 * `lazyRun` · `skipRun`). 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이
 * 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 부를 때마다
 * 자기 답을 정본(또는 정본에서 기계로 만든 변이)의 답과 맞대고, 다르면 던진다. 그림 사이드카
 * (`-guide.fig.tsx`)와 걸음 재생 패널도 여기의 `traced` 가 낸 기록을 쓴다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import { bfsShortestPath } from "./bfsShortestPath-guide.ref.ts";

export type Edge = [number, number];

/** 본문 전개가 쓰는 고정 입력 — 정점 0~4 가 오각형이고 정점 5 는 간선이 없다. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
];
export const SOURCE = 0;

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

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 1, 2, 2, 1, -1]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `19,999,600,002` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다 — 등폭 블록의 칸 맞춤. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

export const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

function adjacency(n: number, edges: readonly Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  return adj;
}

/* ───────────────────── 정본과 같은 절차의 기록 ───────────────────── */

/** 이웃 검사 한 번 — 그 검사가 끝난 뒤의 상태. */
export interface Check {
  /** 꺼낸 정점. */
  readonly node: number;
  /** 본 이웃. */
  readonly next: number;
  /** ① 처음 만났는가(거리를 적고 큐에 넣었는가). 거짓이면 ② 이미 거리가 있다. */
  readonly fresh: boolean;
  /** 검사 직전의 `dist[next]`. */
  readonly before: number;
  readonly dist: readonly number[];
  /** 큐 배열 전체(이미 꺼낸 칸 포함). */
  readonly queue: readonly number[];
  /** 검사 시점의 `head` — 꺼낸 정점 바로 다음 자리다. */
  readonly head: number;
}

export interface Run {
  readonly adj: readonly (readonly number[])[];
  readonly checks: readonly Check[];
  readonly dist: readonly number[];
  readonly queue: readonly number[];
  /** 정점마다 거리가 적힌 이웃 검사의 차례(0 부터). 출발 정점은 −1, 끝내 안 적히면 null. */
  readonly writtenAt: readonly (number | null)[];
  /** 정점마다 큐에 들어간 횟수. */
  readonly pushes: readonly number[];
}

/**
 * 정본과 같은 절차에 기록만 덧붙인 사본. 부를 때마다 답을 정본과 맞댄다 — 다르면 이 기록은
 * 다른 절차의 것이다.
 */
export function traced(n: number, edges: readonly Edge[], source: number): Run {
  const dist: number[] = Array.from({ length: n }, () => -1);
  const adj = adjacency(n, edges);
  const queue: number[] = [source];
  let head = 0;
  dist[source] = 0;
  const writtenAt: (number | null)[] = Array.from({ length: n }, () => null);
  const pushes: number[] = Array.from({ length: n }, () => 0);
  writtenAt[source] = -1;
  pushes[source] = 1;
  const checks: Check[] = [];
  while (head < queue.length) {
    const node = queue[head++] as number;
    for (const next of adj[node] as number[]) {
      const before = dist[next] as number;
      const fresh = before === -1;
      if (fresh) {
        dist[next] = (dist[node] as number) + 1;
        queue.push(next);
        writtenAt[next] = checks.length;
        pushes[next] = (pushes[next] as number) + 1;
      }
      checks.push({
        node,
        next,
        fresh,
        before,
        dist: dist.slice(),
        queue: queue.slice(),
        head,
      });
    }
  }
  const want = bfsShortestPath(n, edges as Edge[], source);
  if (!same(dist, want)) {
    throw new Error(
      `기록 사본이 정본과 다른 답을 냈다 — ${show(dist)} ≠ ${show(want)}`,
    );
  }
  return { adj, checks, dist, queue, writtenAt, pushes };
}

/** 본문 전개의 기록. 걸음 번호는 T1 = 시작, T2… = 이웃 검사, 마지막 = 종료다. */
export const WALK = traced(WALK_N, WALK_EDGES, SOURCE);
/** 이웃 검사 k(0 부터)의 걸음 번호. */
export const stepOf = (k: number): string => `T${k + 2}`;
export const END_STEP = `T${WALK.checks.length + 2}`;

/* ───────────────────── 비교할 절차들 — 세는 사본 ───────────────────── */

/**
 * 가장 단순한 방법 — 라운드마다 **간선 목록 전부**를 다시 읽어, 한쪽 끝의 거리가 라운드 시작 때
 * 정해져 있고 다른 쪽이 비어 있으면 채운다. 새로 채운 것이 없는 라운드에서 멈춘다(그 라운드도
 * 간선을 다 읽었으므로 센다).
 */
function sweepTrace(n: number, edges: readonly Edge[], source: number) {
  const dist = Array.from({ length: n }, () => -1);
  dist[source] = 0;
  let touches = 0;
  const rounds: { edge: Edge; filled: number[] }[][] = [];
  for (;;) {
    const snap = dist.slice();
    const round: { edge: Edge; filled: number[] }[] = [];
    for (const [u, v] of edges) {
      touches += 2;
      const filled: number[] = [];
      if ((snap[u] as number) !== -1 && (dist[v] as number) === -1) {
        dist[v] = (snap[u] as number) + 1;
        filled.push(v);
      }
      if ((snap[v] as number) !== -1 && (dist[u] as number) === -1) {
        dist[u] = (snap[v] as number) + 1;
        filled.push(u);
      }
      round.push({ edge: [u, v], filled });
    }
    rounds.push(round);
    if (round.every((r) => r.filled.length === 0)) break;
  }
  const want = bfsShortestPath(n, edges as Edge[], source);
  if (!same(dist, want)) throw new Error("라운드 방식이 정본과 다른 답을 냈다");
  return { dist, touches, rounds };
}

/**
 * 꺼내는 순서만 바꾼 사본 — 먼저 넣은 것(정본과 같다) · 나중 넣은 것 · 거리가 가장 작은 것.
 * 거리가 가장 작은 것은 남은 것을 앞에서부터 차례로 읽어 고르고, 그 비교를 센다. 꺼낸 차례도 기록한다.
 */
type Order = "fifo" | "lifo" | "min";
function bagTrace(
  n: number,
  edges: readonly Edge[],
  source: number,
  order: Order,
) {
  const dist = Array.from({ length: n }, () => -1);
  const adj = adjacency(n, edges);
  const bag: number[] = [source];
  dist[source] = 0;
  let touches = 0;
  let compares = 0;
  const pops: { node: number; pushed: number[]; bag: number[] }[] = [];
  while (bag.length > 0) {
    let at = 0;
    if (order === "lifo") at = bag.length - 1;
    if (order === "min") {
      for (let i = 1; i < bag.length; i++) {
        compares++;
        const here = dist[bag[i] as number] as number;
        if (here < (dist[bag[at] as number] as number)) at = i;
      }
    }
    const node = bag.splice(at, 1)[0] as number;
    const pushed: number[] = [];
    for (const next of adj[node] as number[]) {
      touches++;
      if ((dist[next] as number) !== -1) continue;
      dist[next] = (dist[node] as number) + 1;
      bag.push(next);
      pushed.push(next);
    }
    pops.push({ node, pushed, bag: bag.slice() });
  }
  return { dist, touches, compares, pops };
}

/** 실행 통계 — 큐에 한꺼번에 남은 정점 수의 최대와 이웃 검사 수. 답은 정본과 맞댄다. */
function stats(n: number, edges: readonly Edge[], source: number) {
  const dist = Array.from({ length: n }, () => -1);
  const adj = adjacency(n, edges);
  const queue = [source];
  let head = 0;
  dist[source] = 0;
  let touches = 0;
  let peak = 1;
  let adjPushes = 0;
  for (const list of adj) adjPushes += list.length;
  while (head < queue.length) {
    const node = queue[head++] as number;
    for (const next of adj[node] as number[]) {
      touches++;
      if ((dist[next] as number) !== -1) continue;
      dist[next] = (dist[node] as number) + 1;
      queue.push(next);
      peak = Math.max(peak, queue.length - head);
    }
  }
  const want = bfsShortestPath(n, edges as Edge[], source);
  if (!same(dist, want)) throw new Error("통계 사본이 정본과 다른 답을 냈다");
  let far = 0;
  for (const d of dist) far = Math.max(far, d);
  return { touches, peak, pushed: queue.length, adjPushes, far };
}

const chain = (v: number): Edge[] =>
  Array.from({ length: v - 1 }, (_, i) => [i, i + 1] as Edge);
const star = (v: number): Edge[] =>
  Array.from({ length: v - 1 }, (_, i) => [0, i + 1] as Edge);
const ring = (v: number): Edge[] =>
  Array.from({ length: v }, (_, i) => [i, (i + 1) % v] as Edge);

/* ────────────────────────── 변이 ────────────────────────── */

type Mod = {
  bfsShortestPath(n: number, edges: Edge[], source: number): number[];
};
const REF = new URL("./bfsShortestPath-guide.ref.ts", import.meta.url).pathname;

/**
 * 큐의 **앞에서 꺼내던 줄** 하나를 뒤에서 꺼내도록 바꾼 사본. **정본 소스에서 기계로 만든다** —
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const backFirst = await loadMutant<Mod>(REF, {
  swap: [/queue\[head\+\+\]/, "queue.pop()"],
});

/** 무향 간선을 **한쪽 목록에만** 넣는 사본 — 반대쪽에 넣는 줄 하나를 뺀다. */
const oneWay = await loadMutant<Mod>(REF, {
  drop: /^\s*\(adj\[v\] as number\[\]\)\.push\(u\);$/,
});

/**
 * 중화 실행(`check-proof` 가 변이를 만들되 적용하지 않는 실행)에서는 두 사본이 정본 그 자체다.
 * 「변이가 답을 바꿨다」 자기검사는 그때 건너뛴다 — 값에서 알아낸다(SPEC §0 증명 블록 규격).
 */
const live = (m: Mod): boolean => m.bfsShortestPath !== bfsShortestPath;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "오각형 + 외딴 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "6-사이클", n: 6, edges: CYCLE6 },
  { label: "사슬 0-1-2-3", n: 4, edges: CHAIN4 },
];

const mutantRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: bfsShortestPath(c.n, c.edges, 0),
  broken: backFirst.bfsShortestPath(c.n, c.edges, 0),
}));

if (live(backFirst) && mutantRows.every((r) => same(r.correct, r.broken))) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「거리가 틀린다」가 거짓이다",
  );
}

/* ─────────────────── 「아이디어를 떠올리는 과정」 ─────────────────── */

const SEC = (ops: number): string => `${(ops / 1e8).toFixed(3)} 초`;

/** 사슬에서 라운드 방식의 계수 — 작은 셋은 실행하고, 큰 하나는 실행으로 확인한 식으로 낸다. */
function naiveScale(): string {
  const ran = [10, 100, 1_000].map((v) => {
    const s = sweepTrace(v, chain(v), 0);
    const formula = v * 2 * (v - 1);
    if (s.rounds.length !== v || s.touches !== formula) {
      throw new Error(`사슬 V = ${v} 에서 식 V × 2(V − 1) 과 실행이 다르다`);
    }
    return { v, rounds: s.rounds.length, touches: s.touches, how: "실행" };
  });
  const big = 100_000;
  const rows = [
    ...ran,
    { v: big, rounds: big, touches: big * 2 * (big - 1), how: "식" },
  ].map((r) => [
    comma(r.v),
    comma(r.v - 1),
    comma(r.rounds),
    comma(r.touches),
    SEC(r.touches),
    r.how,
  ]);
  return [
    md(
      [
        "정점 V",
        "간선 E",
        "라운드",
        "이웃 검사",
        "초당 1 억 번 기준",
        "센 방법",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `실행한 ${ran.length} 줄이 모두 식 V × 2(V − 1) 과 일치했고, 정점 ${comma(big)} 개 줄은 그 식으로 낸 값입니다.`,
  ].join("\n");
}

/** 오각형에서 라운드마다 간선 다섯이 한 일. */
function sweepRounds(): string {
  const s = sweepTrace(WALK_N, WALK_EDGES, SOURCE);
  const head = [
    "라운드",
    ...WALK_EDGES.map(([u, v]) => `간선 ${u}-${v}`),
    "새로 채운 정점 수",
  ];
  const rows = s.rounds.map((round, r) => [
    String(r + 1),
    ...round.map((c) =>
      c.filled.length === 0
        ? "—"
        : c.filled.map((x) => `${x} ← ${s.dist[x]}`).join(" · "),
    ),
    String(round.reduce((a, c) => a + c.filled.length, 0)),
  ]);
  const filled = s.rounds.flat().reduce((a, c) => a + c.filled.length, 0);
  return [
    md(head, rows, [0, WALK_EDGES.length + 1]),
    "",
    `칸의 「x ← d」 는 정점 x 에 거리 d 를 적었다는 뜻입니다. 라운드 ${s.rounds.length} 번 동안 간선을 양쪽 끝에서 모두 ${s.touches} 번 봤고, 그중 새 거리를 적은 것은 ${filled} 번입니다.`,
  ].join("\n");
}

/** 같은 그래프에 라운드 방식과 큐 방식을 걸어 이웃 검사 횟수를 나란히 센다. */
function sweepVsQueue(): string {
  const s = sweepTrace(WALK_N, WALK_EDGES, SOURCE);
  const q = WALK;
  const e = WALK_EDGES.length;
  return [
    md(
      ["방법", "이웃 검사", "되풀이한 단위", "결과"],
      [
        [
          "간선 목록을 라운드마다 다시 읽는다",
          String(s.touches),
          `라운드 ${s.rounds.length} 번`,
          show(s.dist),
        ],
        [
          "거리가 막 정해진 정점의 이웃만 본다",
          String(q.checks.length),
          `꺼낸 정점 ${q.queue.length} 개`,
          show(q.dist),
        ],
      ],
      [1],
    ),
    "",
    `두 결과가 ${same(s.dist, q.dist) ? "일치하고" : "일치하지 않고"}, 이웃 검사는 ${s.touches} 번과 ${q.checks.length} 번입니다. 간선이 ${e} 개라 2E 는 ${2 * e} 입니다.`,
  ].join("\n");
}

/** 나중 넣은 것 먼저 꺼내는 순서의 자취 — 정본에서 만든 변이의 답과 맞댄다. */
function lifoTrace(): string {
  const t = bagTrace(WALK_N, WALK_EDGES, SOURCE, "lifo");
  if (live(backFirst)) {
    const m = backFirst.bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
    if (!same(t.dist, m))
      throw new Error("나중 넣은 것 먼저 사본이 변이와 다르다");
  }
  const want = bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
  const rows = t.pops.map((p) => [
    String(p.node),
    p.pushed.length === 0
      ? "—"
      : p.pushed.map((x) => `${x} (거리 ${t.dist[x]})`).join(" · "),
    show(p.bag),
  ]);
  const wrong = t.dist
    .map((d, v) => ({ v, d, w: want[v] as number }))
    .filter((x) => x.d !== x.w);
  const tail =
    wrong.length === 0
      ? "모든 정점의 거리가 정본과 일치합니다."
      : wrong
          .map(
            (x) =>
              `정점 ${x.v} 에 적힌 거리는 ${x.d} 이고 정본의 답은 ${x.w} 입니다.`,
          )
          .join(" ");
  return [
    md(["꺼낸 정점", "새로 넣은 정점", "꺼낸 뒤의 대기 목록"], rows),
    "",
    tail,
  ].join("\n");
}

/** 꺼내는 순서 셋을 같은 그래프에 걸어 결과와 계수를 함께 낸다. */
function orderValues(): string {
  const want = bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
  const ways: [string, Order][] = [
    ["먼저 넣은 것 먼저", "fifo"],
    ["나중 넣은 것 먼저", "lifo"],
    ["거리가 가장 작은 것 먼저", "min"],
  ];
  const runs = ways.map(([name, o]) => ({
    name,
    t: bagTrace(WALK_N, WALK_EDGES, SOURCE, o),
  }));
  const right = runs.filter((r) => same(r.t.dist, want));
  const free = right.filter((r) => r.t.compares === 0);
  return [
    md(
      ["꺼내는 순서", "결과 dist", "정본과", "이웃 검사", "고를 때의 비교"],
      runs.map((r) => [
        r.name,
        show(r.t.dist),
        same(r.t.dist, want) ? "일치" : "불일치",
        String(r.t.touches),
        String(r.t.compares),
      ]),
      [3, 4],
    ),
    "",
    `답이 정본과 일치하는 순서는 ${right.length} 개이고, 그중 고를 때의 비교가 0 인 것은 「${free.map((r) => r.name).join("」 · 「")}」 ${free.length} 개입니다.`,
  ].join("\n");
}

/** 거리가 가장 작은 것 먼저 — 별 모양에서 고르는 비교가 얼마나 느는가. */
function minFirstScale(): string {
  const f = (v: number) => ((v - 1) * (v - 2)) / 2;
  const ran = [10, 100, 1_000].map((v) => {
    const t = bagTrace(v, star(v), 0, "min");
    if (t.compares !== f(v))
      throw new Error(`별 V = ${v} 에서 식과 실행이 다르다`);
    if (!same(t.dist, bfsShortestPath(v, star(v), 0)))
      throw new Error("답이 다르다");
    return { v, c: t.compares, touches: t.touches, how: "실행" };
  });
  const big = 100_000;
  const rows = [
    ...ran,
    { v: big, c: f(big), touches: 2 * (big - 1), how: "식" },
  ].map((r) => [comma(r.v), comma(r.touches), comma(r.c), SEC(r.c), r.how]);
  return [
    md(
      ["정점 V", "이웃 검사", "고를 때의 비교", "초당 1 억 번 기준", "센 방법"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `실행한 ${ran.length} 줄이 모두 식 (V − 1)(V − 2) / 2 와 일치했고, 정점 ${comma(big)} 개 줄은 그 식으로 낸 값입니다.`,
  ].join("\n");
}

/* ─────────────────── 「아이디어 상세」 ─────────────────── */

/** 1단계 — 정점마다의 이웃 목록과 그 길이. */
function buildAdj(): string {
  const adj = WALK.adj;
  const total = adj.reduce((a, l) => a + l.length, 0);
  return [
    md(
      ["정점 v", "adj[v]", "길이"],
      adj.map((l, v) => [String(v), show(l), String(l.length)]),
      [0, 2],
    ),
    "",
    `길이를 모두 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개의 두 배입니다.`,
  ].join("\n");
}

/** 2단계 — 거리가 적힌 걸음과 큐에 들어간 걸음이 같다. */
function buildMark(): string {
  const rows = WALK.dist.map((d, v) => {
    const at = WALK.writtenAt[v] ?? null;
    const when = at === null ? "없음" : at === -1 ? "T1" : stepOf(at);
    return [String(v), String(d), when, when, String(WALK.pushes[v])];
  });
  const once = WALK.pushes.every((p) => p <= 1);
  return [
    md(
      [
        "정점",
        "최종 거리",
        "거리가 적힌 걸음",
        "큐에 들어간 걸음",
        "큐에 들어간 횟수",
      ],
      rows,
      [0, 1, 4],
    ),
    "",
    `모든 정점이 큐에 ${once ? "많아야 한 번" : "두 번 이상"} 들어갔고, 거리가 적힌 걸음과 큐에 들어간 걸음이 정점마다 일치합니다.`,
  ].join("\n");
}

/** 3단계 — 이웃 검사마다 이미 적힌 값과 지금 온 길의 값. */
function buildMeet(): string {
  const rows = WALK.checks.map((c, k) => {
    const come = (c.dist[c.node] as number) + 1;
    return [
      stepOf(k),
      `${c.node} (거리 ${c.dist[c.node]})`,
      String(c.next),
      String(c.before),
      String(come),
      c.fresh
        ? `① 처음 만남 — 거리 ${come}${을를(String(come))} 적고 큐 뒤에 넣는다`
        : "② 이미 있음 — 그대로 둔다",
    ];
  });
  const seen = WALK.checks.filter((c) => !c.fresh);
  const smaller = seen.filter((c) => (c.dist[c.node] as number) + 1 < c.before);
  return [
    md(
      [
        "걸음",
        "꺼낸 정점",
        "이웃",
        "이웃에 적혀 있던 거리",
        "지금 온 길",
        "한 일",
      ],
      rows,
      [3, 4],
    ),
    "",
    `이미 거리가 있던 ${seen.length} 번 가운데 지금 온 길이 적혀 있던 값보다 작았던 것은 ${smaller.length} 번입니다.`,
  ].join("\n");
}

/** 안 꺼낸 부분의 거리 줄 — 오름차순인가, 가장 큰 값과 가장 작은 값의 차이. */
function restOf(c: Pick<Check, "queue" | "head" | "dist">) {
  const rest = c.queue.slice(c.head);
  const ds = rest.map((x) => c.dist[x] as number);
  const asc = ds.every((d, i) => i === 0 || (ds[i - 1] as number) <= d);
  const gap = ds.length === 0 ? 0 : Math.max(...ds) - Math.min(...ds);
  return { rest, ds, asc, gap };
}

/** 3단계의 핵심 성질 — 걸음마다 안 꺼낸 부분의 거리. */
function buildQueueOrder(): string {
  const start = Array.from({ length: WALK_N }, () => -1);
  start[SOURCE] = 0;
  const points = [
    { step: "T1", queue: [SOURCE], head: 0, dist: start },
    ...WALK.checks.map((c, k) => ({ step: stepOf(k), ...c })),
  ];
  const rows = points.map((p) => {
    const r = restOf(p);
    return [
      p.step,
      show(r.rest),
      show(r.ds),
      r.ds.length < 2 ? "—" : r.asc ? "예" : "아니오",
      r.ds.length === 0 ? "—" : String(r.gap),
    ];
  });
  const gaps = points.map((p) => restOf(p).gap);
  const bad = points.filter((p) => !restOf(p).asc).length;
  return [
    md(
      [
        "걸음",
        "안 꺼낸 정점",
        "그 거리",
        "오름차순",
        "가장 큰 값 − 가장 작은 값",
      ],
      rows,
      [4],
    ),
    "",
    `${rows.length} 개 시점에서 오름차순이 아닌 시점은 ${bad} 개이고, 가장 큰 값과 가장 작은 값의 차이는 가장 클 때 ${Math.max(...gaps)} 입니다.`,
  ].join("\n");
}

/**
 * 전제 — 간선마다 값이 붙으면 간선 수를 센 답과 값을 더한 최단이 갈린다. 값을 더한 최단은 정의
 * 그대로 모든 간선을 양쪽으로 V − 1 번 줄여 구한다(값이 양수라 그걸로 충분하다).
 */
const WEIGHTS: [number, number, number][] = [
  [0, 1, 1],
  [1, 2, 5],
  [2, 3, 1],
  [3, 4, 1],
  [4, 0, 1],
];
function premiseWeighted(): string {
  const n = 5;
  const hops = bfsShortestPath(
    n,
    WEIGHTS.map(([u, v]) => [u, v] as Edge),
    0,
  );
  const best = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  best[0] = 0;
  for (let r = 0; r < n - 1; r++) {
    for (const [u, v, w] of WEIGHTS) {
      best[v] = Math.min(best[v] as number, (best[u] as number) + w);
      best[u] = Math.min(best[u] as number, (best[v] as number) + w);
    }
  }
  const heavy = WEIGHTS.filter(([, , w]) => w !== 1);
  const off = hops
    .map((h, v) => ({ v, h, b: best[v] as number }))
    .filter((x) => x.h !== x.b);
  return [
    md(
      ["정점", "간선 수로 센 거리(정본)", "간선 값을 더한 최단"],
      hops.map((h, v) => [String(v), String(h), String(best[v])]),
      [0, 1, 2],
    ),
    "",
    `간선 값은 ${heavy.map(([u, v, w]) => `${u}-${v} 만 ${w}`).join(" · ")} 이고 나머지는 1 입니다. 두 열이 갈리는 정점은 ${off.map((x) => x.v).join(" · ")} 입니다.`,
  ].join("\n");
}

/* ─────────────────── 「수행으로 알아보는 알고리즘」 ─────────────────── */

function walkInput(): string {
  const want = show(bfsShortestPath(WALK_N, WALK_EDGES, SOURCE));
  return [
    `const n = ${WALK_N};`,
    `const edges: [number, number][] = [${WALK_EDGES.map(([u, v]) => `[${u}, ${v}]`).join(", ")}];`,
    `const source = ${SOURCE};`,
    `// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다`,
  ].join("\n");
}

function walkAdj(): string {
  const lines = WALK.adj.map((l, v) => `adj[${v}] = ${show(l)}`);
  const w = Math.max(...lines.map(width));
  const half = Math.ceil(lines.length / 2);
  const out: string[] = [];
  for (let i = 0; i < half; i++) {
    const a = lines[i] as string;
    const b = lines[i + half];
    out.push(b === undefined ? a : `${pad(a, w)}      ${b}`);
  }
  return out.join("\n");
}

/** 짚고 가기 — 한쪽 목록에만 넣은 이웃 목록과 변이의 답. */
function oneWayBlock(): string {
  const one: number[][] = Array.from({ length: WALK_N }, () => []);
  for (const [u, v] of WALK_EDGES) (one[u] as number[]).push(v);
  const good = bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
  const bad = oneWay.bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
  return md(
    [
      "정점",
      "양쪽 다 넣은 adj",
      "한쪽만 넣은 adj",
      "거리(양쪽)",
      "거리(한쪽)",
      "두 거리",
    ],
    WALK.adj.map((l, v) => [
      String(v),
      show(l),
      show(one[v] as number[]),
      String(good[v]),
      String(bad[v]),
      good[v] === bad[v] ? "같다" : "어긋난다",
    ]),
    [0, 3, 4],
  );
}

function walkInit(): string {
  const dist = Array.from({ length: WALK_N }, () => -1);
  dist[SOURCE] = 0;
  return [
    `dist  = ${show(dist)}`,
    `queue = [${SOURCE}]`,
    "         ↑ head = 0",
    "         └ head 가 queue.length 와 같아지면 꺼낼 것이 없다는 뜻이다",
  ].join("\n");
}

/** 3 — 두 번째로 꺼낼 때 앞에서 꺼내는 것과 뒤에서 꺼내는 것. */
function walkFrontBack(): string {
  const fifo = bagTrace(WALK_N, WALK_EDGES, SOURCE, "fifo");
  const lifo = bagTrace(WALK_N, WALK_EDGES, SOURCE, "lifo");
  const want = bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
  const bag = show(fifo.pops[0]?.bag ?? []);
  const line = (name: string, t: typeof fifo) => {
    const v = t.pops[1]?.node as number;
    return `${name}   ${bag} 에서 ${v}${을를(String(v))} 꺼낸다 (거리 ${t.dist[v]})   최종 dist ${show(t.dist)}`;
  };
  const off = lifo.dist
    .map((d, v) => ({ v, d }))
    .filter((x) => x.d !== want[x.v]);
  const tail =
    off.length === 0
      ? "뒤에서 꺼내도 이 그래프에서는 최종 dist 가 일치한다"
      : `뒤에서 꺼내면 ${off.map((x) => `dist[${x.v}] 가 ${want[x.v]} 가 아니라 ${x.d}`).join(", ")}${josaDa(off)}`;
  return [
    line("앞에서 꺼낸다", fifo),
    line("뒤에서 꺼낸다", lifo),
    `               └ ${tail}`,
  ].join("\n");
}
const josaDa = (off: { d: number }[]): string =>
  `${이가(String(off.at(-1)?.d))} 된다`;

/** 짚고 가기 — 거리를 넣을 때 적는가 꺼낼 때 적는가. 꺼낸 뒤에 거르는 사본. */
function lazyRun(n: number, edges: readonly Edge[], source: number) {
  const dist = Array.from({ length: n }, () => -1);
  const adj = adjacency(n, edges);
  const queue: [number, number][] = [[source, 0]];
  let head = 0;
  let skipped = 0;
  while (head < queue.length) {
    const [node, d] = queue[head++] as [number, number];
    if ((dist[node] as number) !== -1) {
      skipped++;
      continue;
    }
    dist[node] = d;
    for (const next of adj[node] as number[]) queue.push([next, d + 1]);
  }
  if (!same(dist, bfsShortestPath(n, edges as Edge[], source))) {
    throw new Error("꺼낸 뒤에 거르는 사본이 정본과 다른 답을 냈다");
  }
  return { dist, entries: queue.length, skipped };
}

function pauseLazy(): string {
  const lazy = lazyRun(WALK_N, WALK_EDGES, SOURCE);
  const e = WALK_EDGES.length;
  const bigV = 100_000;
  const big = ring(bigV);
  const bigLazy = lazyRun(bigV, big, 0);
  const bigEager = stats(bigV, big, 0);
  return [
    md(
      ["거르는 자리", "결과 dist", "큐에 들어간 원소", "꺼내자마자 버린 원소"],
      [
        ["넣기 직전에 거른다", show(WALK.dist), String(WALK.queue.length), "0"],
        [
          "꺼낸 뒤에 거른다",
          show(lazy.dist),
          String(lazy.entries),
          String(lazy.skipped),
        ],
      ],
      [2, 3],
    ),
    "",
    `두 결과가 ${same(lazy.dist, WALK.dist) ? "일치합니다" : "일치하지 않습니다"}. 꺼낸 뒤에 거르면 큐에 들어간 원소가 1 + 2E = ${1 + 2 * e} 개입니다. 정점과 간선이 ${comma(bigV)} 개씩인 고리에서는 ${comma(bigEager.pushed)} 개와 ${comma(bigLazy.entries)} 개입니다.`,
  ].join("\n");
}

/** 4 — 걸음 전부. */
function walkTrace(): string {
  const init = Array.from({ length: WALK_N }, () => -1);
  init[SOURCE] = 0;
  const rows: string[][] = [
    ["T1", "—", "—", `\`dist[${SOURCE}] = 0\``, show(init), show([SOURCE])],
  ];
  WALK.checks.forEach((c, k) => {
    rows.push([
      stepOf(k),
      String(c.node),
      String(c.next),
      `\`dist[${c.next}] !== -1\` 이 **${c.fresh ? "거짓" : "참"}** → ${c.fresh ? "①" : "②"}`,
      show(c.dist),
      show(c.queue.slice(c.head)),
    ]);
  });
  const len = WALK.queue.length;
  rows.push([
    END_STEP,
    "—",
    "—",
    `\`head < queue.length\` 가 **거짓** (${len} < ${len})`,
    show(WALK.dist),
    show([]),
  ]);
  const pick = (fresh: boolean) =>
    WALK.checks.map((c, k) => ({ c, k })).filter((x) => x.c.fresh === fresh);
  const one = pick(true);
  const two = pick(false);
  return [
    md(
      ["걸음", "꺼낸 정점", "보는 이웃", "조건 판정", "dist", "안 꺼낸 부분"],
      rows,
    ),
    "",
    `① 은 ${one.map((x) => stepOf(x.k)).join(" · ")} 에서 ${one.length} 번, ② 는 ${two.map((x) => stepOf(x.k)).join(" · ")} 에서 ${two.length} 번 실행됐습니다. 이웃 검사는 모두 ${WALK.checks.length} 번이고 반환값은 ${show(WALK.dist)} 입니다.`,
  ].join("\n");
}

/** 전체 코드를 여러 입력에 실행한 결과. */
const FINAL_CASES: {
  call: string;
  n: number;
  edges: Edge[];
  source: number;
}[] = [
  {
    call: "bfsShortestPath(6, [[0,1],[1,2],[2,3],[3,4],[4,0]], 0)",
    n: WALK_N,
    edges: WALK_EDGES,
    source: 0,
  },
  {
    call: "bfsShortestPath(4, [[0,1],[1,2],[2,3]], 0)",
    n: 4,
    edges: CHAIN4,
    source: 0,
  },
  {
    call: "bfsShortestPath(4, [[0,1],[2,3]], 0)",
    n: 4,
    edges: [
      [0, 1],
      [2, 3],
    ],
    source: 0,
  },
  { call: "bfsShortestPath(4, [], 1)", n: 4, edges: [], source: 1 },
  { call: "bfsShortestPath(1, [], 0)", n: 1, edges: [], source: 0 },
  {
    call: "bfsShortestPath(2, [[0,0],[0,1]], 0)",
    n: 2,
    edges: [
      [0, 0],
      [0, 1],
    ],
    source: 0,
  },
];
function walkResult(): string {
  const w = Math.max(...FINAL_CASES.map((c) => width(c.call)));
  return FINAL_CASES.map(
    (c) =>
      `${pad(c.call, w)}   →   ${show(bfsShortestPath(c.n, c.edges, c.source))}`,
  ).join("\n");
}

/* ─────────────────── 「알아 두면 좋은 개념」 ─────────────────── */

export const layerOf = (u: number, v: number): string => {
  const a = WALK.dist[u] as number;
  const b = WALK.dist[v] as number;
  return a === b
    ? "같은 층 안"
    : Math.abs(a - b) === 1
      ? "이웃한 두 층"
      : "두 층 이상 건넘";
};

function relatedLayers(): string {
  const d = WALK.dist;
  const rows = WALK_EDGES.map(([u, v]) => [
    `${u}-${v}`,
    `${d[u]} ↔ ${d[v]}`,
    layerOf(u, v),
  ]);
  const inside = rows.filter((r) => r[2] === "같은 층 안");
  const jump = rows.filter((r) => r[2] === "두 층 이상 건넘");
  return [
    md(["간선", "양 끝의 층", "간선의 자리"], rows),
    "",
    `간선 ${rows.length} 개 가운데 같은 층 안의 간선은 ${inside.length} 개(${inside.map((r) => r[0]).join(" · ")})이고, 두 층 이상 건너는 간선은 ${jump.length} 개입니다.`,
  ].join("\n");
}

/* ─────────────────── 「수식 정의와 유도」 ─────────────────── */

/** 정의 그대로 — s 에서 v 로 가는 단순 경로를 전부 늘어놓고 간선 수의 최솟값을 고른다. */
function mathCheck(): string {
  const target = 2;
  const paths: number[][] = [];
  const go = (v: number, path: number[]) => {
    if (v === target) {
      paths.push(path.slice());
      return;
    }
    for (const w of WALK.adj[v] as number[]) {
      if (path.includes(w)) continue;
      path.push(w);
      go(w, path);
      path.pop();
    }
  };
  go(SOURCE, [SOURCE]);
  paths.sort((a, b) => a.length - b.length);
  const ks = paths.map((p) => p.length - 1);
  const min = Math.min(...ks);
  const ref = bfsShortestPath(WALK_N, WALK_EDGES, SOURCE)[target] as number;
  if (min !== ref) throw new Error("정의로 센 값이 정본과 다르다");
  const left = paths.map((p) => p.join(" → "));
  const w = Math.max(...left.map(width));
  return [
    ...paths.map(
      (p, i) => `${pad(left[i] as string, w)}    간선 ${p.length - 1} 개`,
    ),
    `${" ".repeat(w + 4)}└ min{${ks.join(", ")}} = ${min} = d(${target})`,
  ].join("\n");
}

function mathDegree(): string {
  const deg = WALK.adj.map((l) => l.length);
  const sum = deg.reduce((a, b) => a + b, 0);
  const e = WALK_EDGES.length;
  return [
    `왼쪽   ${deg.map((_, v) => `deg(${v})`).join(" + ")}`,
    `     = ${deg.join(" + ")} = ${sum}`,
    `오른쪽 2 × ${e} = ${2 * e}`,
  ].join("\n");
}

function mathCode(): string {
  const touches = WALK.adj.reduce((a, l) => a + l.length, 0);
  if (touches !== WALK.checks.length)
    throw new Error("이웃 목록 길이의 합이 이웃 검사와 다르다");
  return [
    "let touches = 0;",
    "for (const list of adj) touches += list.length;",
    `touches; // → ${touches} (전개에서 센 이웃 검사 횟수와 같다)`,
  ].join("\n");
}

/** 제약 규모에서 각 항 — 정점과 간선이 10 만 개씩인 고리를 실제로 처리해 센다. */
function mathScale(): string {
  const v = 100_000;
  const s = stats(v, ring(v), 0);
  const naive = v * 2 * (v - 1);
  const total = s.adjPushes + s.pushed + s.touches + v;
  return [
    md(
      ["항", "세는 것", "고리 V = E = 100,000 에서"],
      [
        ["거리 배열 만들기", "정점마다 한 칸", comma(v)],
        ["이웃 목록 만들기", "간선마다 두 번 넣는다", comma(s.adjPushes)],
        ["큐에 넣기", "정점마다 많아야 한 번", comma(s.pushed)],
        ["이웃 검사", "꺼낸 정점의 이웃 목록 길이의 합", comma(s.touches)],
      ],
      [2],
    ),
    "",
    `넷을 더하면 ${comma(total)} 입니다. 사슬에서 라운드 방식이 센 이웃 검사 ${comma(naive)} 번과 나란히 놓으면 ${comma(Math.floor(naive / total))} 배가 넘습니다.`,
  ].join("\n");
}

/* ─────────────────── 「불변식」 ─────────────────── */

/** 불변식을 여러 입력에서 이웃 검사마다 확인한다. */
function invariantCheck(): string {
  let seed = 20260930 | 0;
  const rnd = (m: number): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return (seed >>> 0) % m;
  };
  const randomEdges: Edge[] = Array.from(
    { length: 120 },
    () => [rnd(60), rnd(60)] as Edge,
  );
  const cases: [string, number, Edge[]][] = [
    ["오각형 + 외딴 정점", WALK_N, WALK_EDGES],
    ["6-사이클", 6, CYCLE6],
    ["별 모양 V = 50", 50, star(50)],
    ["무작위 V = 60 · E = 120 (시드 20260930)", 60, randomEdges],
  ];
  const rows = cases.map(([name, n, edges]) => {
    const r = traced(n, edges, 0);
    const rs = r.checks.map(restOf);
    return [
      name,
      String(r.checks.length),
      String(rs.filter((x) => !x.asc).length),
      String(rs.filter((x) => x.gap > 1).length),
    ];
  });
  const points = rows.reduce((a, r) => a + Number(r[1]), 0);
  const broken = rows.reduce((a, r) => a + Number(r[2]) + Number(r[3]), 0);
  return [
    md(
      [
        "입력",
        "확인한 시점(이웃 검사 수)",
        "오름차순이 아닌 시점",
        "차이가 1 을 넘은 시점",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `네 입력의 ${points} 개 시점에서 두 성질이 깨진 시점은 ${broken} 개입니다.`,
  ].join("\n");
}

function invariantEdges(): string {
  const cases: [string, string, number, Edge[], number][] = [
    ["정점 하나", "bfsShortestPath(1, [], 0)", 1, [], 0],
    ["간선 없음", "bfsShortestPath(4, [], 1)", 4, [], 1],
    [
      "떨어진 두 조각",
      "bfsShortestPath(4, [[0,1],[2,3]], 0)",
      4,
      [
        [0, 1],
        [2, 3],
      ],
      0,
    ],
    [
      "자기 루프",
      "bfsShortestPath(2, [[0,0],[0,1]], 0)",
      2,
      [
        [0, 0],
        [0, 1],
      ],
      0,
    ],
    [
      "길이가 같은 두 경로",
      "bfsShortestPath(4, [[0,1],[0,2],[1,3],[2,3]], 0)",
      4,
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ],
      0,
    ],
  ];
  return md(
    [
      "입력",
      "호출",
      "결과",
      "큐에 들어간 정점",
      "이웃 검사",
      "이미 거리가 있어 그대로 둔 검사",
    ],
    cases.map(([name, call, n, edges, s]) => {
      const r = traced(n, edges, s);
      return [
        name,
        `\`${call}\``,
        show(r.dist),
        String(r.queue.length),
        String(r.checks.length),
        String(r.checks.filter((c) => !c.fresh).length),
      ];
    }),
    [3, 4, 5],
  );
}

function mutantFront(): string {
  return md(
    ["입력", "앞에서 꺼내는 코드", "뒤에서 꺼내는 코드", "두 답"],
    mutantRows.map((r) => [
      r.label,
      show(r.correct),
      show(r.broken),
      same(r.correct, r.broken) ? "같다" : "어긋난다",
    ]),
  );
}

/* ─────────────────── 「비용 계산」 ─────────────────── */

function perfDerive(): string {
  const byNode = new Map<number, number[]>();
  WALK.checks.forEach((c, k) => {
    byNode.set(c.node, [...(byNode.get(c.node) ?? []), k]);
  });
  const len = (v: number) => (WALK.adj[v] as number[]).length;
  const rows = WALK.queue.map((v) => [
    String(v),
    String(len(v)),
    (byNode.get(v) ?? []).map(stepOf).join(" · ") || "—",
  ]);
  const unreached = WALK.dist
    .map((d, v) => ({ d, v }))
    .filter((x) => x.d === -1)
    .map((x) => [
      String(x.v),
      String(len(x.v)),
      "큐에 안 들어가 목록을 안 읽는다",
    ]);
  const sum = WALK.queue.reduce((a, v) => a + len(v), 0);
  return [
    md(
      ["꺼낸 정점", "이웃 목록 길이", "그 목록을 읽은 걸음"],
      [...rows, ...unreached],
      [0, 1],
    ),
    "",
    `꺼낸 정점 ${WALK.queue.length} 개의 이웃 목록 길이를 더하면 ${sum} 이고, 전개에서 센 이웃 검사 ${WALK.checks.length} 번과 일치합니다.`,
  ].join("\n");
}

function perfWorst(): string {
  const v = 100_000;
  const cases: [string, Edge[]][] = [
    ["별 모양", star(v)],
    ["사슬", chain(v)],
  ];
  return [
    md(
      [
        "입력",
        "간선",
        "이웃 검사",
        "큐에 한꺼번에 남은 정점의 최대",
        "가장 먼 거리",
      ],
      cases.map(([name, edges]) => {
        const s = stats(v, edges, 0);
        return [
          name,
          comma(edges.length),
          comma(s.touches),
          comma(s.peak),
          comma(s.far),
        ];
      }),
      [1, 2, 3, 4],
    ),
    "",
    `두 입력 다 정점 ${comma(v)} 개를 간선 ${comma(v - 1)} 개로 이은 것입니다.`,
  ].join("\n");
}

/* ─────────────────── 「스스로 점검하기」 ─────────────────── */

/** 물음이 건너뛰는 이웃 검사의 차례(0 부터) — 정점 0 의 둘째 이웃. */
export const SKIP_K = 1;

function selfcheckT3(): string {
  const lines = [0, SKIP_K].map((k) => {
    const c = WALK.checks[k] as Check;
    return `${pad(stepOf(k), 4)}${c.node} → 이웃 ${c.next}   ① dist[${c.next}] = ${c.dist[c.next]}   큐 ${show(c.queue.slice(c.head))}`;
  });
  return [lines[0], `${lines[1]}   ← 이 걸음을 건너뛰면?`].join("\n");
}

/** 이웃 검사 하나(`SKIP_K`)에서 아무것도 안 하는 사본. */
function skipRun() {
  const dist = Array.from({ length: WALK_N }, () => -1);
  const adj = adjacency(WALK_N, WALK_EDGES);
  const queue = [SOURCE];
  let head = 0;
  dist[SOURCE] = 0;
  let k = 0;
  const pops: { node: number; rest: number[]; wrote: string[] }[] = [];
  while (head < queue.length) {
    const node = queue[head++] as number;
    const wrote: string[] = [];
    for (const next of adj[node] as number[]) {
      const here = k++;
      if (here === SKIP_K) continue;
      if ((dist[next] as number) !== -1) continue;
      dist[next] = (dist[node] as number) + 1;
      queue.push(next);
      wrote.push(`dist[${next}] = ${dist[next]}`);
    }
    pops.push({ node, rest: queue.slice(head), wrote });
  }
  return { dist, pops };
}

function selfcheckSkip(): string {
  const r = skipRun();
  const good = bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
  const skipped = WALK.checks[SKIP_K] as Check;
  const d = String(good[skipped.next]);
  let tail = `최종 dist 는 ${show(r.dist)} 입니다.`;
  if (live(oneWay)) {
    const oneway = oneWay.bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
    tail = `최종 dist 는 ${show(r.dist)} 이고, 한쪽 목록에만 넣은 코드의 답 ${show(oneway)}${과와(show(oneway))} ${same(r.dist, oneway) ? "일치합니다" : "일치하지 않습니다"}.`;
  }
  return [
    `${stepOf(SKIP_K)}${을를(stepOf(SKIP_K))} 건너뛰면 정점 ${skipped.next}${이가(String(skipped.next))} 거리 ${d}${을를(d)} 받지 못한 채 이렇게 진행합니다.`,
    "",
    md(
      ["꺼낸 정점", "새로 적은 거리", "꺼낸 뒤 안 꺼낸 부분"],
      r.pops.map((p) => [
        String(p.node),
        p.wrote.length === 0 ? "—" : p.wrote.join(" · "),
        show(p.rest),
      ]),
    ),
    "",
    tail,
  ].join("\n");
}

/* ───────────────── 그림 사이드카가 쓰는 수 — 시도 사다리 ───────────────── */

/**
 * 「아이디어를 떠올리는 과정」의 시도 넷에 붙는 수. 규모 V = 100,000 의 두 값은 위 표와 같은
 * 식이고, 그 식은 작은 규모의 실행과 맞대어 확인했다(`naiveScale` · `minFirstScale`).
 */
export function ladderNumbers() {
  const big = 100_000;
  const lifo = bagTrace(WALK_N, WALK_EDGES, SOURCE, "lifo");
  const want = bfsShortestPath(WALK_N, WALK_EDGES, SOURCE);
  const wrong = lifo.dist.findIndex((d, v) => d !== want[v]);
  return {
    big,
    sweepTouches: big * 2 * (big - 1),
    minCompares: ((big - 1) * (big - 2)) / 2,
    lifoVertex: wrong,
    lifoGot: lifo.dist[wrong] as number,
    lifoWant: want[wrong] as number,
    queueTouches: 2 * (big - 1),
    walkChecks: WALK.checks.length,
    seconds: SEC,
  };
}
naiveScale();
minFirstScale();

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.origin` ② — 가장 단순한 방법이 제약 규모에서 몇 번을 세는가. */
  "naive-scale": naiveScale,
  /** `deep.origin` ③ — 오각형에서 라운드마다 간선이 한 일. */
  "sweep-rounds": sweepRounds,
  /** `deep.origin` ④ — 두 방식의 이웃 검사. */
  "sweep-vs-queue": sweepVsQueue,
  /** `deep.origin` ⑤ — 나중 넣은 것 먼저의 자취. */
  "lifo-trace": lifoTrace,
  /** `deep.origin` ⑤ — 꺼내는 순서 셋. */
  "order-values": orderValues,
  /** `deep.origin` ⑤ — 거리가 가장 작은 것 먼저의 비교가 느는 모양. */
  "minfirst-scale": minFirstScale,
  /** `deep.build` 1단계. */
  "build-adj": buildAdj,
  /** `deep.build` 2단계. */
  "build-mark": buildMark,
  /** `deep.build` 3단계 — 두 갈래의 값. */
  "build-meet": buildMeet,
  /** `deep.build` 3단계 — 큐 안의 거리. */
  "build-queue-order": buildQueueOrder,
  /** `deep.build` 전제 — 간선 값이 다르면. */
  "premise-weighted": premiseWeighted,
  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": walkInput,
  /** `deep.walk` 1. */
  "walk-adj": walkAdj,
  /** `deep.walk.pause` — 한쪽 목록에만 넣으면. */
  "one-way": oneWayBlock,
  /** `deep.walk` 2. */
  "walk-init": walkInit,
  /** `deep.walk` 3. */
  "walk-front-back": walkFrontBack,
  /** `deep.walk.pause` — 거르는 자리. */
  "pause-lazy": pauseLazy,
  /** `deep.walk` 4 — 걸음 전부. */
  "walk-trace": walkTrace,
  /** `deep.walk.final` — 전체 코드를 여러 입력에. */
  "walk-result": walkResult,
  /** `related` — 거리 층과 간선. */
  "related-layers": relatedLayers,
  /** `deep.math` ② — 정의 검산. */
  "math-check": mathCheck,
  /** `deep.math` ③ — 차수의 합. */
  "math-degree": mathDegree,
  /** `deep.math` — 식을 옮긴 코드. */
  "math-code": mathCode,
  /** `deep.math` ④ — 제약 규모의 각 항. */
  "math-scale": mathScale,
  /** `invariant` ② — 여러 입력에서 확인. */
  "invariant-check": invariantCheck,
  /** `invariant` ② — 경계의 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 앞에서 꺼내던 줄을 바꾸면. */
  "mutant-front": mutantFront,
  /** `perf.derive`. */
  "perf-derive": perfDerive,
  /** `perf.worst`. */
  "perf-worst": perfWorst,
  /** `selfcheck` — 물음의 두 걸음. */
  "selfcheck-t3": selfcheckT3,
  /** `selfcheck` 답. */
  "selfcheck-skip": selfcheckSkip,
};
