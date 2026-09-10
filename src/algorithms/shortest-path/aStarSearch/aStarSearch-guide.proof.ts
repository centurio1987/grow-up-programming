/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts aStarSearch-guide.md
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { aStarSearch, type Edge } from "./aStarSearch-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 화면에 찍히는 폭. **CJK 를 2 칸으로 센다.**
 *
 * `tools/check-v2.ts` 의 `displayWidth` 와 같은 규칙이다 — 다른 규칙으로 그리면 그 스캐너의
 * 열 정렬 판정(P15)과 이 파일이 어긋난다.
 */
const width = (s: string): number => {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    n +=
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf && c !== 0x303f) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd)
        ? 2
        : 1;
  }
  return n;
};

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string =>
  n === Number.POSITIVE_INFINITY ? "∞" : (n + 0).toLocaleString("en-US");

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 못 본다.
 */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const cols = head.length;
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

const INF = Number.POSITIVE_INFINITY;

/**
 * 본문 전개가 쓰는 고정 입력 — 정점 여덟 · 방향 간선 여덟.
 *
 * 갈래를 하나도 안 남기고 전부 실행한다. 값이 한 번 줄어드는 정점이 있고(정점 3), 그래서
 * 같은 정점 짜리 항목이 큐에 둘 생겨 하나가 뒤처진 기록으로 버려진다. 목표와 반대쪽에 있는
 * 정점 7 은 키가 커서 한 번도 안 꺼낸다.
 */
const WALK: Edge[] = [
  [0, 1, 3],
  [0, 2, 4],
  [0, 7, 5],
  [1, 4, 2],
  [2, 3, 7],
  [4, 3, 3],
  [3, 5, 2],
  [5, 6, 6],
];
const WALK_N = 8;
const WALK_SRC = 0;
const WALK_GOAL = 6;

/** 전개 입력의 정점 좌표. 추정은 여기서 잰 맨해튼 거리다. */
const WALK_XY: [number, number][] = [
  [0, 0],
  [2, 1],
  [3, 0],
  [5, 0],
  [4, 1],
  [6, 0],
  [8, 0],
  [0, 5],
];

/** 목표 정점까지의 맨해튼 거리. */
function walkH(v: number): number {
  const [x, y] = WALK_XY[v] as [number, number];
  const [gx, gy] = WALK_XY[WALK_GOAL] as [number, number];
  return Math.abs(gx - x) + Math.abs(gy - y);
}

/** 추정이 아무것도 안 알려 주는 판. 이 절차가 다익스트라와 같아지는 자리다. */
const zeroH = (_v: number): number => 0;

/**
 * 허용 가능하지만 **일관되지 않은** 추정.
 *
 * 정점 3 에 0 을, 정점 4 에 실제 최소 비용인 11 을 준다. 둘 다 실제 값을 안 넘으므로 허용
 * 가능한데, 간선 4→3 에서 `h(4) = 11 > 3 + h(3) = 3` 이라 일관성이 깨진다.
 */
function brokenH(v: number): number {
  return v === 3 ? 0 : v === 4 ? 11 : walkH(v);
}

/** 조기 반환이 답을 바꾸는 배치 — 돌아가는 경로가 더 비용이 작다. */
const DETOUR: Edge[] = [
  [0, 3, 10],
  [0, 1, 1],
  [1, 2, 1],
  [2, 3, 1],
];
const detourH = (v: number): number => [3, 2, 1, 0][v] as number;

/** 추정을 부풀리면 답이 바뀌는 배치 — 두 경로의 비용 차이가 1 이다. */
const NARROW: Edge[] = [
  [0, 1, 1],
  [1, 3, 10],
  [0, 2, 6],
  [2, 3, 6],
];
const narrowH = (v: number): number => [11, 10, 6, 0][v] as number;

/** 사슬 하나. 추정이 정확해도 지날 정점이 정해져 있다. */
function chain(k: number): {
  n: number;
  edges: Edge[];
  h: (v: number) => number;
} {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < k; i++) edges.push([i, i + 1, 1]);
  return { n: k, edges, h: (v: number) => k - 1 - v };
}

/**
 * 완전 DAG. 앞 정점에서 뒤 정점으로 가는 간선이 전부 있고 가중치가 `2(v−u)−1` 이다.
 *
 * 이 모양에서는 **간선 하나하나가 반드시 값을 줄인다** — 정점 `v` 에 적히는 값이 `u` 가
 * 커질수록 1 씩 작아지기 때문이다. 그래서 큐에 들어가는 항목 수가 가장 커진다. 추정
 * `k−1−v` 는 실제 최소 비용과 같고 일관적이라 재확장은 없다.
 */
function denseDag(k: number): {
  n: number;
  edges: Edge[];
  h: (v: number) => number;
} {
  const edges: Edge[] = [];
  for (let u = 0; u < k; u++) {
    for (let v = u + 1; v < k; v++) edges.push([u, v, 2 * (v - u) - 1]);
  }
  return { n: k, edges, h: (v: number) => k - 1 - v };
}

/** 목표에서 뻗어 나온 별. 시작에서 한 걸음, 거기서 목표까지 한 걸음이다. */
function star(k: number): {
  n: number;
  edges: Edge[];
  h: (v: number) => number;
} {
  const edges: Edge[] = [];
  for (let i = 1; i + 1 < k; i++) {
    edges.push([0, i, 1]);
    edges.push([i, k - 1, 1]);
  }
  return { n: k, edges, h: (v: number) => (v === k - 1 ? 0 : 1) };
}

/** 격자 한 변 `k`. 상하좌우로 오갈 수 있고 모든 간선의 가중치가 1 이다. */
function grid(k: number): {
  n: number;
  edges: Edge[];
  goal: number;
  man: (v: number) => number;
} {
  const at = (r: number, c: number): number => r * k + c;
  const edges: Edge[] = [];
  for (let r = 0; r < k; r++) {
    for (let c = 0; c < k; c++) {
      if (r + 1 < k) {
        edges.push([at(r, c), at(r + 1, c), 1]);
        edges.push([at(r + 1, c), at(r, c), 1]);
      }
      if (c + 1 < k) {
        edges.push([at(r, c), at(r, c + 1), 1]);
        edges.push([at(r, c + 1), at(r, c), 1]);
      }
    }
  }
  return {
    n: k * k,
    edges,
    goal: k * k - 1,
    man: (v: number) =>
      Math.abs(k - 1 - Math.floor(v / k)) + Math.abs(k - 1 - (v % k)),
  };
}

/** 정점 번호를 섞는 고정 해시. 실행마다 같은 값이 나온다. */
function scatter(v: number): number {
  let x = (v * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = (x * 2246822519) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

/** 정점의 `p` 퍼센트에만 정확한 추정을 주고 나머지에 0 을 주는 판. */
function patchy(man: (v: number) => number, p: number): (v: number) => number {
  return (v: number) => (scatter(v) % 100 < p ? man(v) : 0);
}

/* ────────────────────────── 계측 ────────────────────────── */

interface Step {
  t: string;
  pop: string;
  key: string;
  what: string;
  cost: string;
  open: string;
}

interface Counted {
  answer: number;
  pops: number;
  expands: number;
  pushes: number;
  relaxes: number;
  hcalls: number;
  stale: number;
  peak: number;
  reexpands: number;
  maxKey: number;
  order: number[];
  expanded: boolean[];
  offKey: number;
}

/**
 * 정본과 같은 절차를 걸음마다 기록하며 실행한다.
 *
 * **불변식을 표에 손으로 적지 않는다** — `offKey` 가 「꺼낸 키가 답을 넘은 걸음 수」이고,
 * 그 값을 실행이 세서 돌려준다.
 *
 * `opt` 셋은 변이·다른 설계를 **같은 힙으로** 재기 위한 것이다. 힙이 다르면 키가 같은 항목의
 * 앞뒤가 달라지고, 그때 나온 계수는 절차가 아니라 자료구조의 차이를 잰 값이 된다.
 *
 * - `noStale` — 뒤처진 기록을 버리는 줄이 없는 판
 * - `inflate` — 추정을 두 배로 부풀려 키를 만드는 판(시작 항목의 키는 정본과 같다)
 * - `keyOnlyH` — 키를 남은 비용의 추정 하나로 두는 판
 */
function walkRun(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
  keep: Step[] | null = null,
  opt: { noStale?: boolean; inflate?: boolean; keyOnlyH?: boolean } = {},
): Counted {
  const g = Array.from({ length: n }, () => INF);
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  g[src] = 0;

  const items: [number, number, number][] = [];
  let peak = 0;
  const key = (i: number): number => (items[i] as [number, number, number])[2];
  const swap = (a: number, b: number): void => {
    const t = items[a] as [number, number, number];
    items[a] = items[b] as [number, number, number];
    items[b] = t;
  };
  const push = (node: number, cost: number, k: number): void => {
    items.push([node, cost, k]);
    peak = Math.max(peak, items.length);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (key(i) >= key(parent)) break;
      swap(i, parent);
      i = parent;
    }
  };
  const pop = (): [number, number, number] => {
    const top = items[0] as [number, number, number];
    const last = items.pop() as [number, number, number];
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < items.length && key(left) < key(small)) small = left;
        if (right < items.length && key(right) < key(small)) small = right;
        if (small === i) break;
        swap(i, small);
        i = small;
      }
    }
    return top;
  };

  const c: Counted = {
    answer: INF,
    pops: 0,
    expands: 0,
    pushes: 0,
    relaxes: 0,
    hcalls: 0,
    stale: 0,
    peak: 0,
    reexpands: 0,
    maxKey: 0,
    order: [],
    expanded: Array.from({ length: n }, () => false),
    offKey: 0,
  };
  const times = Array.from({ length: n }, () => 0);

  c.hcalls++;
  push(src, 0, h(src));
  c.pushes++;
  const costs = (): string =>
    g.map((x) => (x === INF ? "∞" : String(x))).join(" ");
  const queue = (): string =>
    items.length === 0
      ? "(비어 있음)"
      : items.map(([u, , k]) => `${u}:${k}`).join(" ");
  if (keep !== null) {
    keep.push({
      t: `T${keep.length + 1}`,
      pop: "—",
      key: "—",
      what: "시작값",
      cost: costs(),
      open: queue(),
    });
  }

  const best = trueDist(n, edges, goal);
  const target = best[src] as number;

  while (items.length > 0) {
    const [u, gu, f] = pop();
    c.pops++;
    c.maxKey = Math.max(c.maxKey, f);
    if (f > target) c.offKey++;
    if (u === goal) {
      c.answer = gu;
      if (keep !== null) {
        keep.push({
          t: `T${keep.length + 1}`,
          pop: `${u}`,
          key: `${f}`,
          what: `목표라 ${String(gu)}${을를(String(gu))} 반환`,
          cost: costs(),
          open: queue(),
        });
      }
      c.peak = peak;
      return c;
    }
    if (opt.noStale !== true && gu > (g[u] as number)) {
      c.stale++;
      if (keep !== null) {
        keep.push({
          t: `T${keep.length + 1}`,
          pop: `${u}`,
          key: `${f}`,
          what: "뒤처진 기록이라 버림",
          cost: costs(),
          open: queue(),
        });
      }
      continue;
    }
    c.expands++;
    times[u] = (times[u] as number) + 1;
    if ((times[u] as number) > 1) c.reexpands++;
    c.expanded[u] = true;
    c.order.push(u);
    const moved: string[] = [];
    for (const [v, w] of adj[u] as [number, number][]) {
      c.relaxes++;
      const ng = gu + w;
      if (ng < (g[v] as number)) {
        g[v] = ng;
        c.hcalls++;
        const hv = h(v);
        push(
          v,
          ng,
          opt.keyOnlyH === true
            ? hv
            : ng + (opt.inflate === true ? 2 * hv : hv),
        );
        c.pushes++;
        moved.push(`${v}`);
      }
    }
    if (keep !== null) {
      keep.push({
        t: `T${keep.length + 1}`,
        pop: `${u}`,
        key: `${f}`,
        what:
          moved.length === 0
            ? "줄인 값 없음"
            : `정점 ${moved.join("·")} 의 값을 줄임`,
        cost: costs(),
        open: queue(),
      });
    }
  }
  c.peak = peak;
  return c;
}

/** 목표 정점까지의 실제 최소 비용을 정점마다 낸다. 간선을 뒤집고 다익스트라를 돌린다. */
function trueDist(n: number, edges: Edge[], goal: number): number[] {
  const rev: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (rev[v] as [number, number][]).push([u, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[goal] = 0;
  const done = Array.from({ length: n }, () => false);
  for (;;) {
    let at = -1;
    for (let i = 0; i < n; i++) {
      if (done[i] || (dist[i] as number) === INF) continue;
      if (at < 0 || (dist[i] as number) < (dist[at] as number)) at = i;
    }
    if (at < 0) break;
    done[at] = true;
    for (const [u, w] of rev[at] as [number, number][]) {
      const nd = (dist[at] as number) + w;
      if (nd < (dist[u] as number)) dist[u] = nd;
    }
  }
  return dist;
}

/** 시작 정점에서 각 정점까지의 실제 최소 비용. */
function fromDist(n: number, edges: Edge[], src: number): number[] {
  const flipped: Edge[] = edges.map(([u, v, w]) => [v, u, w]);
  return trueDist(n, flipped, src);
}

/** 계측본이 정본과 같은 답을 내는지 확인하고 계수를 돌려준다. */
function measure(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
  keep: Step[] | null = null,
): Counted {
  const got = walkRun(n, edges, src, goal, h, keep);
  const want = aStarSearch(n, edges, src, goal, h);
  if (got.answer !== want) {
    throw new Error(
      `계측본이 정본과 다른 답을 냈다 — ${got.answer} vs ${want}`,
    );
  }
  return got;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = {
  aStarSearch: (
    n: number,
    edges: Edge[],
    src: number,
    goal: number,
    h: (v: number) => number,
  ) => number;
};

const REF = new URL("./aStarSearch-guide.ref.ts", import.meta.url).pathname;

const RELAX_LINE = /^ {8}g\[v\] = ng;$/;
const STALE_LINE = /^ {4}if \(gu > \(g\[u\] as number\)\) continue;$/;
const KEY_LINE = /^ {8}open\.push\(v, ng, ng \+ h\(v\)\);$/;

/** 목표의 값을 줄인 그 자리에서 바로 반환하는 사본. */
const earlyReturn = await loadMutant<Impl>(REF, {
  swap: [RELAX_LINE, "        g[v] = ng;\n        if (v === goal) return ng;"],
});

/** 확장을 마친 정점의 값을 더는 못 고치게 막는 사본. 재확장이 없어진다. */
const noReopen = await loadMutant<Impl>(REF, {
  swap: [
    STALE_LINE,
    "    if (gu > (g[u] as number)) continue;\n    g[u] = Number.NEGATIVE_INFINITY;",
  ],
});

/** 뒤처진 기록을 버리는 줄이 없는 사본. */
const noStale = await loadMutant<Impl>(REF, { drop: STALE_LINE });

/** 추정을 두 배로 부풀려 키를 만드는 사본. */
const inflated = await loadMutant<Impl>(REF, {
  swap: [KEY_LINE, "        open.push(v, ng, ng + 2 * h(v));"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = earlyReturn.aStarSearch === aStarSearch;

interface Case {
  label: string;
  n: number;
  edges: Edge[];
  src: number;
  goal: number;
  h: (v: number) => number;
}

const WALK_CASE: Case = {
  label: "전개 입력",
  n: WALK_N,
  edges: WALK,
  src: WALK_SRC,
  goal: WALK_GOAL,
  h: walkH,
};
const WALK_ZERO: Case = { ...WALK_CASE, label: "전개 입력 · 추정 0", h: zeroH };
const WALK_BROKEN: Case = {
  ...WALK_CASE,
  label: "전개 입력 · 일관성이 깨진 추정",
  h: brokenH,
};
const DETOUR_CASE: Case = {
  label: "돌아가는 경로가 더 작다",
  n: 4,
  edges: DETOUR,
  src: 0,
  goal: 3,
  h: detourH,
};
const NARROW_CASE: Case = {
  label: "두 경로의 비용 차이가 1",
  n: 4,
  edges: NARROW,
  src: 0,
  goal: 3,
  h: narrowH,
};
const CHAIN_CASE: Case = (() => {
  const c = chain(6);
  return {
    label: "사슬 여섯",
    n: c.n,
    edges: c.edges,
    src: 0,
    goal: 5,
    h: c.h,
  };
})();
const GRID_CASE: Case = (() => {
  const G = grid(8);
  return {
    label: "격자 8×8",
    n: G.n,
    edges: G.edges,
    src: 0,
    goal: G.goal,
    h: G.man,
  };
})();

if (!중화됨) {
  const breaking: [string, Impl, Case[]][] = [
    ["목표를 줄이는 자리에서 반환하는 판", earlyReturn, [DETOUR_CASE]],
    ["확장을 마친 정점을 다시 안 고치는 판", noReopen, [WALK_BROKEN]],
    ["추정을 두 배로 부풀린 판", inflated, [NARROW_CASE]],
  ];
  for (const [label, impl, cases] of breaking) {
    const same = cases.every(
      (c) =>
        aStarSearch(c.n, c.edges, c.src, c.goal, c.h) ===
        impl.aStarSearch(c.n, c.edges, c.src, c.goal, c.h),
    );
    if (same)
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

/** 정본과 변이의 답을 나란히 놓은 표. */
function contrast(cases: Case[], impl: Impl, head: string): string {
  const rows = cases.map((c) => {
    const want = aStarSearch(c.n, c.edges, c.src, c.goal, c.h);
    const got = impl.aStarSearch(c.n, c.edges, c.src, c.goal, c.h);
    return [
      c.label,
      num(c.n),
      num(want),
      num(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  return table(["배치", "정점", "정본", head, "대조"], rows, [
    "l",
    "r",
    "r",
    "r",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

const WALK_STEPS: Step[] = [];
const WALK_COUNT = measure(
  WALK_N,
  WALK,
  WALK_SRC,
  WALK_GOAL,
  walkH,
  WALK_STEPS,
);
const WALK_ZERO_COUNT = measure(WALK_N, WALK, WALK_SRC, WALK_GOAL, zeroH);

/** 여러 배치에서 추정을 쓴 판과 안 쓴 판을 나란히 잰다. */
function bothWays(cases: Case[]): string[][] {
  return cases.map((c) => {
    const withH = measure(c.n, c.edges, c.src, c.goal, c.h);
    const without = measure(c.n, c.edges, c.src, c.goal, zeroH);
    return [
      c.label,
      num(c.n),
      num(c.edges.length),
      num(withH.answer),
      num(withH.expands),
      num(without.expands),
      withH.answer === without.answer ? "같다" : "어긋난다",
    ];
  });
}

const RATIOS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 추정을 쓴 판과 안 쓴 판의 답은 같고 확장한 정점 수만 갈린다. */
  "concept-cases": () => {
    const G8 = grid(8);
    const G16 = grid(16);
    const C = chain(64);
    const S = star(64);
    const rows = bothWays([
      WALK_CASE,
      { label: "사슬 64", n: C.n, edges: C.edges, src: 0, goal: 63, h: C.h },
      { label: "별 64", n: S.n, edges: S.edges, src: 0, goal: 63, h: S.h },
      {
        label: "격자 8×8",
        n: G8.n,
        edges: G8.edges,
        src: 0,
        goal: G8.goal,
        h: G8.man,
      },
      {
        label: "격자 16×16",
        n: G16.n,
        edges: G16.edges,
        src: 0,
        goal: G16.goal,
        h: G16.man,
      },
    ]);
    const star64 = rows[2] as string[];
    const chain64 = rows[1] as string[];
    return [
      table(
        [
          "배치",
          "정점",
          "간선",
          "답",
          "추정을 쓴 판의 확장",
          "추정이 0 인 판의 확장",
          "답 대조",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `배치 ${num(rows.length)} 개 모두 답이 같다. 갈리는 것은 정점을 몇 개나 확장했는가다`,
      `└ 별 64 에서 차이가 가장 크다 — ${star64[4]} 대 ${star64[5] ?? ""}${josa(star64[5] ?? "", "이다", "다")}`,
      `└ 사슬 64 는 지나갈 길이 하나뿐이라 어느 판이든 ${chain64[4]} 개를 다 확장한다`,
    ].join("\n");
  },

  /** `concept` — 격자 한 변을 2 배로 키우며 두 판이 각각 몇 배가 되는가. */
  "concept-growth": () => {
    const sides = [8, 16, 32, 64];
    const got = sides.map((k) => {
      const G = grid(k);
      return {
        k,
        n: G.n,
        withH: measure(G.n, G.edges, 0, G.goal, G.man).expands,
        without: measure(G.n, G.edges, 0, G.goal, zeroH).expands,
      };
    });
    const rows = got.map((r) => [
      `${num(r.k)}×${num(r.k)}`,
      num(r.n),
      num(r.withH),
      num(r.without),
    ]);
    const grow = got.slice(1).map((r, at) => {
      const prev = got[at] as (typeof got)[number];
      return [
        `${num(prev.k)} → ${num(r.k)}`,
        (r.withH / prev.withH).toFixed(2),
        (r.without / prev.without).toFixed(2),
      ];
    });
    return [
      table(["격자", "정점", "추정을 쓴 판", "추정이 0 인 판"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      table(
        ["한 변을 2 배로", "추정을 쓴 판 성장률", "추정이 0 인 판 성장률"],
        grow,
        ["l", "r", "r"],
      ),
      "",
      "한 변을 2 배로 하면 정점은 4 배가 된다",
      "└ 추정이 0 인 판은 정점 수를 따라 4 배씩 늘고, 추정을 쓴 판은 2 배 언저리에 머문다",
    ].join("\n");
  },

  /** `deep.build` ② — 경로를 전부 만들어 보는 방법의 경로 수. */
  "build-brute": () => {
    // 완전 그래프에서 두 정점을 잇는 단순 경로의 수 = Σ_{k=0}^{V-2} (V-2)!/(V-2-k)!
    const paths = (v: number): number => {
      let sum = 0;
      let term = 1;
      for (let k = 0; k <= v - 2; k++) {
        sum += term;
        term *= v - 2 - k;
      }
      return sum;
    };
    const sizes = [5, 8, 10, 12, 15];
    const rows = sizes.map((v) => {
      const p = paths(v);
      return [num(v), num(p), p.toExponential(2)];
    });
    const walkPaths = countPaths(WALK_N, WALK, WALK_SRC, WALK_GOAL);
    const big = paths(15);
    return [
      table(["정점", "단순 경로의 수", "지수로 적으면"], rows, ["r", "r", "r"]),
      "",
      `전개 입력은 정점 ${num(WALK_N)} 개에 간선 ${num(WALK.length)} 개뿐이라 시작에서 목표까지의 경로가 ${num(walkPaths)} 개다`,
      `└ 완전 그래프는 정점 15 개에서 경로가 ${num(big)} 개다`,
      "└ 제약의 정점 수 100,000 에서는 경로를 세는 것 자체가 끝나지 않는다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리한 실제 계수. */
  "build-two": () => {
    const rows = [
      ["확장한 정점 수", num(WALK_COUNT.expands), num(WALK_ZERO_COUNT.expands)],
      ["꺼낸 항목 수", num(WALK_COUNT.pops), num(WALK_ZERO_COUNT.pops)],
      [
        "큐에 넣은 항목 수",
        num(WALK_COUNT.pushes),
        num(WALK_ZERO_COUNT.pushes),
      ],
      [
        "완화해 본 간선 수",
        num(WALK_COUNT.relaxes),
        num(WALK_ZERO_COUNT.relaxes),
      ],
      ["답", num(WALK_COUNT.answer), num(WALK_ZERO_COUNT.answer)],
    ];
    const order = (c: Counted): string => c.order.join(" → ");
    return [
      table(["무엇", "추정을 쓴 판", "추정이 0 인 판"], rows, ["l", "r", "r"]),
      "",
      table(
        ["판", "확장한 순서"],
        [
          ["추정을 쓴 판", order(WALK_COUNT)],
          ["추정이 0 인 판", order(WALK_ZERO_COUNT)],
        ],
        ["l", "l"],
      ),
      "",
      "정점 7 은 추정을 쓴 판에서 한 번도 확장되지 않는다",
      `└ 정점 7 의 비용 5 · 추정 ${num(walkH(7))} · 키 ${num(5 + walkH(7))} — 답 ${num(WALK_COUNT.answer)} 보다 크다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 추정의 정보량을 바꿔 가며 확장 수를 잰다. */
  "build-ratio": () => {
    const G = grid(32);
    const rows = RATIOS.map((p) => {
      const c = measure(G.n, G.edges, 0, G.goal, patchy(G.man, p));
      return [
        `${num(p)}%`,
        num(c.expands),
        num(c.reexpands),
        num(c.pops),
        num(c.answer),
      ];
    });
    const best = RATIOS.map(
      (p) => measure(G.n, G.edges, 0, G.goal, patchy(G.man, p)).expands,
    );
    const least = Math.min(...best);
    const most = Math.max(...best);
    return [
      table(
        [
          "정확한 추정을 받은 정점",
          "확장한 정점 수",
          "그중 재확장",
          "꺼낸 항목 수",
          "답",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `격자 32×32 (정점 ${num(G.n)} · 간선 ${num(G.edges.length)}) 에서 잰 값이다. 답은 어느 비율에서도 ${num(G.man(0))}${josa(num(G.man(0)), "이다", "다")}`,
      `└ 확장이 가장 적은 자리 ${num(least)} · 가장 많은 자리 ${num(most)} — 비율을 올리는 것이 늘 이득은 아니다`,
      "└ 중간 구간에서 재확장이 붙는다. 정확한 값과 0 이 섞이면 이웃한 두 정점의 추정이 크게 어긋나기 때문이다",
    ].join("\n");
  },

  /** `deep.build` — 전개 입력의 추정이 실제 최소 비용을 넘지 않는가. */
  "build-admissible": () => {
    const d = trueDist(WALK_N, WALK, WALK_GOAL);
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const [x, y] = WALK_XY[v] as [number, number];
      return [
        num(v),
        `(${x},${y})`,
        num(walkH(v)),
        num(d[v] as number),
        walkH(v) <= (d[v] as number) ? "넘지 않는다" : "넘는다",
      ];
    });
    const bad = rows.filter((r) => r[4] === "넘는다").length;
    return [
      table(["정점", "좌표", "추정", "실제 최소 비용", "대조"], rows, [
        "r",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `정점 ${num(WALK_N)} 개 모두 추정이 실제 최소 비용을 넘지 않는다 — 넘는 정점 ${num(bad)} 개`,
      "└ 정점 7 은 목표로 가는 간선이 하나도 없어 실제 최소 비용이 ∞ 다",
    ].join("\n");
  },

  /** `deep.walk.step` 1 — 시작값. */
  "walk-init": () => {
    const first = WALK_STEPS[0] as Step;
    const adj: string[][] = Array.from({ length: WALK_N }, (_, u) => [
      num(u),
      WALK.filter(([a]) => a === u)
        .map(([, v, w]) => `${v}(${w})`)
        .join(" ") || "—",
    ]);
    return [
      table(["정점", "나가는 간선 (도착:가중치)"], adj, ["r", "l"]),
      "",
      table(
        ["무엇", "값"],
        [
          ["비용 배열", first.cost],
          ["큐 (정점:키)", first.open],
        ],
        ["l", "l"],
      ),
      "",
      `시작 정점의 키는 비용 0 에 추정 ${num(walkH(WALK_SRC))}${을를(num(walkH(WALK_SRC)))} 더한 ${num(walkH(WALK_SRC))}${josa(num(walkH(WALK_SRC)), "이다", "다")}`,
      "└ 나머지 정점의 비용은 아직 ∞ 이고 큐에는 항목이 하나뿐이다",
    ].join("\n");
  },

  /** `deep.walk.step` 2 — 키가 순서를 정하는 자리. */
  "walk-key": () => {
    const out = [1, 2, 7].map((v) => {
      const w = (WALK.find(([a, b]) => a === 0 && b === v) as Edge)[2];
      return { v, w, h: walkH(v), f: w + walkH(v) };
    });
    const rows = out.map((r) => [
      num(r.v),
      num(r.w),
      num(r.w),
      num(r.h),
      num(r.f),
    ]);
    const byCost = [...out].sort(
      (a, b) => a.w - b.w,
    )[0] as (typeof out)[number];
    const byKey = [...out].sort((a, b) => a.f - b.f)[0] as (typeof out)[number];
    const far = out.find((r) => r.v === 7) as (typeof out)[number];
    const near = out.find((r) => r.v === 2) as (typeof out)[number];
    return [
      table(
        ["정점", "간선 가중치", "지금까지의 비용", "남은 비용의 추정", "키"],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `비용이 가장 작은 것은 정점 ${byCost.v} (비용 ${num(byCost.w)}) 이고, 키가 가장 작은 것은 정점 ${byKey.v} (키 ${num(byKey.f)}) 다`,
      `└ 정점 7 과 정점 2 는 비용 차이가 ${num(far.w - near.w)} 인데 키 차이는 ${num(far.f - near.f)} 다 — 추정이 그만큼 벌린 것이다`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 값이 줄어 같은 정점 짜리 항목이 둘이 되는 자리. */
  "walk-relax": () => {
    const rows = WALK_STEPS.slice(2, 5).map((s) => [
      s.t,
      s.pop,
      s.key,
      s.what,
      s.cost,
      s.open,
    ]);
    return [
      table(
        ["걸음", "꺼낸 정점", "키", "무엇", "비용 배열", "큐 (정점:키)"],
        rows,
        ["l", "r", "r", "l", "l", "l"],
      ),
      "",
      "T5 에서 정점 3 의 비용이 11 에서 8 로 줄고 키 11 짜리 항목이 큐에 더 들어간다",
      "└ 먼저 들어가 있던 키 14 짜리 항목은 지우지 않는다. 이진 힙에는 가운데 항목을 지우는 연산이 없다",
    ].join("\n");
  },

  /** `deep.walk.step` 4 — 아홉 걸음 전부. */
  "walk-trace": () => {
    const rows = WALK_STEPS.map((s) => [
      s.t,
      s.pop,
      s.key,
      s.what,
      s.cost,
      s.open,
    ]);
    return [
      table(
        ["걸음", "꺼낸 정점", "키", "무엇", "비용 배열", "큐 (정점:키)"],
        rows,
        ["l", "r", "r", "l", "l", "l"],
      ),
      "",
      `걸음 ${num(WALK_STEPS.length)} · 확장한 정점 ${num(WALK_COUNT.expands)} · 버린 뒤처진 기록 ${num(WALK_COUNT.stale)} · 답 ${num(WALK_COUNT.answer)}`,
      "└ 비용 배열은 정점 0 부터 7 까지 차례로 적은 것이다",
      `└ 정점 7 짜리 항목은 키 18 로 큐에 남은 채 끝난다 — 한 번도 안 꺼낸다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 목표의 값을 줄인 자리에서 바로 반환하는 판. */
  "pause-early": () => {
    const want = earlyReturn.aStarSearch(
      DETOUR_CASE.n,
      DETOUR_CASE.edges,
      DETOUR_CASE.src,
      DETOUR_CASE.goal,
      DETOUR_CASE.h,
    );
    const got = aStarSearch(
      DETOUR_CASE.n,
      DETOUR_CASE.edges,
      DETOUR_CASE.src,
      DETOUR_CASE.goal,
      DETOUR_CASE.h,
    );
    return [
      contrast(
        [DETOUR_CASE, WALK_CASE, CHAIN_CASE, GRID_CASE, NARROW_CASE],
        earlyReturn,
        "줄이자마자 반환하는 판",
      ),
      "",
      "목표의 값을 처음 줄인 그 순간의 값은 그 시점까지 찾은 것 중 가장 작은 값일 뿐이다",
      `└ 돌아가는 경로가 더 작은 배치에서 ${num(want)} 과 ${num(got)}${으로(num(got))} 갈린다`,
      "└ 나머지 배치는 목표를 처음 줄인 값이 마침 최소라 답이 그대로다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 뒤처진 기록을 버리는 줄이 없는 판. 답은 안 바뀐다. */
  "pause-stale": () => {
    return [
      contrast(
        [WALK_CASE, WALK_BROKEN, DETOUR_CASE, CHAIN_CASE, GRID_CASE],
        noStale,
        "버리는 줄이 없는 판",
      ),
      "",
      "뒤처진 기록에서 뻗어 나가는 비용은 지금 적힌 값에서 뻗어 나가는 비용보다 크다",
      "└ 그래서 그 항목을 확장해도 값이 줄어드는 정점이 하나도 없다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 그 판이 얼마나 더 일하는가. 판정 낱말을 쓰지 않는다. */
  "pause-stale-work": () => {
    const G16 = grid(16);
    const D = denseDag(128);
    const cases: Case[] = [
      WALK_CASE,
      WALK_BROKEN,
      {
        label: "격자 16×16 · 추정 30%",
        n: G16.n,
        edges: G16.edges,
        src: 0,
        goal: G16.goal,
        h: patchy(G16.man, 30),
      },
      {
        label: "완전 DAG 128 · 추정이 정확",
        n: D.n,
        edges: D.edges,
        src: 0,
        goal: 127,
        h: D.h,
      },
      {
        label: "완전 DAG 128 · 추정이 전부 0",
        n: D.n,
        edges: D.edges,
        src: 0,
        goal: 127,
        h: zeroH,
      },
    ];
    const got = cases.map((c) => {
      const keep = measure(c.n, c.edges, c.src, c.goal, c.h);
      const drop = noStaleRun(c);
      return { c, keep, drop };
    });
    const rows = got.map((r) => [
      r.c.label,
      num(r.keep.stale),
      num(r.keep.expands),
      num(r.drop.expands),
      num(r.drop.expands - r.keep.expands),
    ]);
    const worst = got.reduce((a, b) =>
      b.drop.expands - b.keep.expands > a.drop.expands - a.keep.expands ? b : a,
    );
    return [
      table(
        [
          "배치",
          "정본이 버린 항목",
          "정본이 확장한 정점 수",
          "버리는 줄이 없는 판",
          "늘어난 만큼",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "버리는 줄은 답을 지키지 않고 헛일을 줄인다",
      `└ 가장 많이 늘어난 배치는 「${worst.c.label}」 이고 ${num(worst.drop.expands - worst.keep.expands)} 번 더 확장한다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 확장을 마친 정점을 다시 안 고치는 판. */
  "pause-closed": () => {
    const cases = [WALK_BROKEN, WALK_CASE, WALK_ZERO, CHAIN_CASE, GRID_CASE];
    const want = aStarSearch(
      WALK_BROKEN.n,
      WALK_BROKEN.edges,
      WALK_BROKEN.src,
      WALK_BROKEN.goal,
      WALK_BROKEN.h,
    );
    const got = noReopen.aStarSearch(
      WALK_BROKEN.n,
      WALK_BROKEN.edges,
      WALK_BROKEN.src,
      WALK_BROKEN.goal,
      WALK_BROKEN.h,
    );
    const same = cases.length - 1;
    return [
      contrast(cases, noReopen, "다시 안 고치는 판"),
      "",
      `일관성이 깨진 추정에서만 답이 갈린다 — ${num(want)}${이가(num(want))} 나와야 하는 자리에서 ${num(got)}${이가(num(got))} 나온다`,
      `└ 나머지 배치 ${num(same)} 개는 추정이 일관적이라 어느 정점도 두 번 확장되지 않는다. 막을 것이 없다`,
    ].join("\n");
  },

  /** `related` — 키를 셋으로 바꾸면 어떻게 갈리는가. */
  "related-keys": () => {
    const G = grid(16);
    const cases: [string, Case][] = [
      ["전개 입력", WALK_CASE],
      [
        "격자 16×16",
        {
          label: "격자 16×16",
          n: G.n,
          edges: G.edges,
          src: 0,
          goal: G.goal,
          h: G.man,
        },
      ],
    ];
    const rows: string[][] = [];
    const wrong: string[] = [];
    for (const [name, c] of cases) {
      const onlyG = measure(c.n, c.edges, c.src, c.goal, zeroH);
      const both = measure(c.n, c.edges, c.src, c.goal, c.h);
      const onlyH = greedy(c);
      rows.push([
        name,
        "지금까지의 비용",
        num(onlyG.answer),
        num(onlyG.expands),
      ]);
      rows.push([
        name,
        "남은 비용의 추정",
        num(onlyH.answer),
        num(onlyH.expands),
      ]);
      rows.push([name, "둘의 합", num(both.answer), num(both.expands)]);
      if (onlyH.answer !== both.answer) {
        wrong.push(
          `${name} 에서 ${num(both.answer)} 대신 ${num(onlyH.answer)}`,
        );
      }
    }
    return [
      table(["배치", "키", "답", "확장한 정점 수"], rows, ["l", "l", "r", "r"]),
      "",
      "세 키가 같은 절차의 같은 자리에 들어간다. 갈리는 것은 답과 확장한 정점 수다",
      `└ 키를 남은 비용의 추정 하나로 두면 답이 최소가 아닌 자리가 나온다 — ${wrong.join(" · ")}`,
      "└ 지금까지의 비용을 함께 세는 것이 최소를 지키는 자리다",
    ].join("\n");
  },

  /** `deep.math` — 일관성 정의를 전개 입력의 간선마다 검산한다. */
  "math-consistent": () => {
    const rows = WALK.map(([u, v, w]) => [
      `${u}→${v}`,
      num(w),
      num(walkH(u)),
      num(walkH(v)),
      num(w + walkH(v)),
      walkH(u) <= w + walkH(v) ? "성립한다" : "성립하지 않는다",
    ]);
    const brokenRows = WALK.map(([u, v, w]) => [
      `${u}→${v}`,
      num(w),
      num(brokenH(u)),
      num(brokenH(v)),
      num(w + brokenH(v)),
      brokenH(u) <= w + brokenH(v) ? "성립한다" : "성립하지 않는다",
    ]);
    const bad = brokenRows.filter((r) => r[5] === "성립하지 않는다").length;
    return [
      table(
        ["간선", "w", "h(u)", "h(v)", "w + h(v)", "h(u) ≤ w + h(v)"],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      table(
        ["간선", "w", "h(u)", "h(v)", "w + h(v)", "h(u) ≤ w + h(v)"],
        brokenRows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      `위는 맨해튼 거리이고 아래는 일관성이 깨진 추정이다. 아래에서 어긋나는 간선이 ${num(bad)} 개다`,
      "└ 두 추정 다 허용 가능하다. 일관성은 허용 가능성보다 강한 조건이다",
    ].join("\n");
  },

  /** `deep.math` — 잠재 함수로 다시 매긴 가중치와 경로 비용의 이동. */
  "math-reweight": () => {
    const rows = WALK.map(([u, v, w]) => [
      `${u}→${v}`,
      num(w),
      num(walkH(u)),
      num(walkH(v)),
      num(w - walkH(u) + walkH(v)),
    ]);
    const path = [0, 1, 4, 3, 5, 6];
    let raw = 0;
    let shifted = 0;
    for (let i = 0; i + 1 < path.length; i++) {
      const a = path[i] as number;
      const b = path[i + 1] as number;
      const w = (WALK.find(([x, y]) => x === a && y === b) as Edge)[2];
      raw += w;
      shifted += w - walkH(a) + walkH(b);
    }
    return [
      table(["간선", "w", "h(u)", "h(v)", "w − h(u) + h(v)"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      table(
        ["무엇", "값"],
        [
          ["경로", path.join(" → ")],
          ["원래 비용의 합", num(raw)],
          ["다시 매긴 비용의 합", num(shifted)],
          ["h(시작) − h(목표)", num(walkH(WALK_SRC) - walkH(WALK_GOAL))],
        ],
        ["l", "l"],
      ),
      "",
      "다시 매긴 가중치는 하나도 음수가 아니다 — 그것이 곧 일관성이다",
      `└ 두 비용의 차이가 ${num(raw - shifted)} 이고 그것이 h(시작) − h(목표) 와 같다`,
      "└ 시작과 목표가 같은 경로끼리는 전부 같은 값만큼 옮겨지므로 어느 것이 가장 작은지는 안 바뀐다",
    ].join("\n");
  },

  /** `deep.math` — 확장되는 정점을 식으로 예측하고 실측과 대조한다. */
  "math-expand": () => {
    const cases: [string, Case][] = [
      ["전개 입력", WALK_CASE],
      ["격자 8×8", GRID_CASE],
      ["사슬 여섯", CHAIN_CASE],
    ];
    let broken = 0;
    const rows = cases.map(([name, c]) => {
      const got = measure(c.n, c.edges, c.src, c.goal, c.h);
      const from = fromDist(c.n, c.edges, c.src);
      const answer = got.answer;
      let below = 0;
      let atMost = 0;
      let expanded = 0;
      for (let v = 0; v < c.n; v++) {
        const f = (from[v] as number) + c.h(v);
        if (f < answer) below++;
        if (f <= answer) atMost++;
        if (got.expanded[v]) expanded++;
      }
      if (below > expanded || expanded > atMost) broken++;
      return [
        name,
        num(c.n),
        num(answer),
        num(below),
        num(expanded),
        num(atMost),
        below <= expanded && expanded <= atMost
          ? "성립한다"
          : "성립하지 않는다",
      ];
    });
    return [
      table(
        [
          "배치",
          "정점",
          "답",
          "f < 답",
          "확장한 정점",
          "f ≤ 답",
          "가운데가 사이에 드는가",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `배치 ${num(rows.length)} 개 모두 확장한 정점 수가 「f < 답」인 정점 수와 「f ≤ 답」인 정점 수 사이에 든다 — 벗어난 배치 ${num(broken)} 개`,
      "└ f 는 시작에서 그 정점까지의 실제 최소 비용에 그 정점의 추정을 더한 값이다",
      "└ 격자는 가중치가 전부 1 이라 f 가 답과 같은 정점이 많고, 그래서 첫 열이 0 이고 셋째 열이 정점 전부다",
    ].join("\n");
  },

  /** `deep.math` — 제약 규모에서의 값. */
  "math-scale": () => {
    const V = 100_000;
    const E = 200_000;
    const log = Math.ceil(Math.log2(E + 1));
    const rows = [
      ["확장한 정점 수", "V", num(V)],
      ["큐에 들어가는 항목 수", "E + 1", num(E + 1)],
      ["완화해 보는 간선 수", "E", num(E)],
      ["추정 함수 호출 수", "E + 1", num(E + 1)],
      ["항목 하나를 넣고 빼는 견주기", "3⌈log₂(E+1)⌉", num(3 * log)],
      ["힙 견주기 전부", "3(E+1)⌈log₂(E+1)⌉", num(3 * (E + 1) * log)],
    ];
    return [
      table(["무엇", "닫힌 형태", "상한"], rows, ["l", "l", "r"]),
      "",
      `제약의 정점 수 ${num(V)} · 간선 수 ${num(E)}${을를(num(E))} 넣은 값이고, 추정이 일관적일 때의 상한이다`,
      "└ 추정이 걸러 내는 만큼 실제 값은 이보다 작아지고, 걸러 내지 못하면 상한이 그대로 값이 된다",
      "└ 일관성이 없으면 첫 줄이 V 로 안 막히고, 그러면 아래 다섯 줄의 상한도 함께 풀린다",
    ].join("\n");
  },

  /** `invariant` — 걸음마다 꺼낸 키가 답을 넘는지 실행이 판정한다. */
  "invariant-steps": () => {
    const G8 = grid(8);
    const G16 = grid(16);
    const cases: Case[] = [
      WALK_CASE,
      WALK_ZERO,
      WALK_BROKEN,
      DETOUR_CASE,
      CHAIN_CASE,
      {
        label: "격자 8×8",
        n: G8.n,
        edges: G8.edges,
        src: 0,
        goal: G8.goal,
        h: G8.man,
      },
      {
        label: "격자 16×16 · 추정 30%",
        n: G16.n,
        edges: G16.edges,
        src: 0,
        goal: G16.goal,
        h: patchy(G16.man, 30),
      },
    ];
    let bad = 0;
    const rows = cases.map((c) => {
      const got = measure(c.n, c.edges, c.src, c.goal, c.h);
      bad += got.offKey;
      return [
        c.label,
        num(got.pops),
        num(got.answer),
        num(got.maxKey),
        num(got.offKey),
      ];
    });
    return [
      table(
        ["배치", "꺼낸 항목 수", "답", "가장 큰 키", "답을 넘은 걸음 수"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `배치 ${num(rows.length)} 개를 걸음마다 견줘 답을 넘은 걸음이 ${num(bad)} 개다`,
      "└ 가장 큰 키는 어느 배치에서도 답과 같다 — 그 걸음이 목표를 꺼내는 마지막 걸음이다",
      "└ 실행이 걸음마다 견준 결과다. 어긋난 걸음이 있으면 마지막 열이 0 이 아니다",
    ].join("\n");
  },

  /** `invariant` — 엣지 케이스. */
  "invariant-edges": () => {
    const cases: Case[] = [
      {
        label: "정점 하나 · 시작이 곧 목표",
        n: 1,
        edges: [],
        src: 0,
        goal: 0,
        h: zeroH,
      },
      {
        label: "간선이 없고 목표가 다르다",
        n: 2,
        edges: [],
        src: 0,
        goal: 1,
        h: zeroH,
      },
      {
        label: "목표로 가는 간선이 없다",
        n: 3,
        edges: [[0, 1, 1]],
        src: 0,
        goal: 2,
        h: zeroH,
      },
      {
        label: "가중치가 전부 0",
        n: 3,
        edges: [
          [0, 1, 0],
          [1, 2, 0],
        ],
        src: 0,
        goal: 2,
        h: zeroH,
      },
      {
        label: "같은 두 정점 사이에 간선 셋",
        n: 2,
        edges: [
          [0, 1, 10],
          [0, 1, 3],
          [0, 1, 7],
        ],
        src: 0,
        goal: 1,
        h: zeroH,
      },
      {
        label: "가중치가 10^9",
        n: 3,
        edges: [
          [0, 1, 1_000_000_000],
          [1, 2, 1_000_000_000],
        ],
        src: 0,
        goal: 2,
        h: zeroH,
      },
      {
        label: "자기 자신으로 가는 간선",
        n: 2,
        edges: [
          [0, 0, 5],
          [0, 1, 2],
        ],
        src: 0,
        goal: 1,
        h: zeroH,
      },
      WALK_BROKEN,
    ];
    const rows = cases.map((c) => {
      const got = measure(c.n, c.edges, c.src, c.goal, c.h);
      const zero = aStarSearch(c.n, c.edges, c.src, c.goal, zeroH);
      return [
        c.label,
        num(c.n),
        num(got.answer),
        num(zero),
        got.answer === zero ? "같다" : "어긋난다",
      ];
    });
    return [
      table(["배치", "정점", "답", "추정을 0 으로 둔 답", "대조"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `배치 ${num(rows.length)} 개 모두 추정을 0 으로 바꿔도 답이 같다`,
      "└ 시작이 곧 목표면 큐에서 꺼내는 첫 항목이 목표라 0 이 그대로 나온다",
    ].join("\n");
  },

  /** `invariant` ③ — 추정을 두 배로 부풀린 판. */
  "mutant-inflate": () => {
    const rows = [
      NARROW_CASE,
      WALK_CASE,
      DETOUR_CASE,
      CHAIN_CASE,
      GRID_CASE,
    ].map((c) => {
      const want = aStarSearch(c.n, c.edges, c.src, c.goal, c.h);
      const got = inflated.aStarSearch(c.n, c.edges, c.src, c.goal, c.h);
      return [
        c.label,
        num(c.n),
        num(want),
        num(got),
        want === got ? "같다" : "어긋난다",
      ];
    });
    const keyRows = [NARROW_CASE, WALK_CASE, GRID_CASE].map((c) => {
      const plain = measure(c.n, c.edges, c.src, c.goal, c.h);
      const twice = inflatedRun(c);
      return [
        c.label,
        num(plain.maxKey),
        num(twice.maxKey),
        num(plain.answer),
        num(twice.offKey),
      ];
    });
    const want = aStarSearch(
      NARROW_CASE.n,
      NARROW_CASE.edges,
      NARROW_CASE.src,
      NARROW_CASE.goal,
      NARROW_CASE.h,
    );
    const got = inflated.aStarSearch(
      NARROW_CASE.n,
      NARROW_CASE.edges,
      NARROW_CASE.src,
      NARROW_CASE.goal,
      NARROW_CASE.h,
    );
    return [
      table(["배치", "정점", "정본", "두 배로 부풀린 판", "대조"], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      table(
        [
          "배치",
          "정본의 가장 큰 키",
          "부풀린 판의 가장 큰 키",
          "답",
          "부풀린 판에서 답을 넘은 걸음",
        ],
        keyRows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "두 배로 부풀리면 꺼낸 키가 답을 넘어서고, 그 걸음이 목표를 앞당겨 꺼내게 만든다",
      `└ 두 경로의 비용 차이가 1 인 배치에서 ${num(want)}${이가(num(want))} 나와야 하는 자리에 ${num(got)}${이가(num(got))} 나온다`,
    ].join("\n");
  },

  /** `perf.derive` — 전개 입력의 계수. */
  "perf-count": () => {
    const rows = [
      ["꺼낸 항목 수", num(WALK_COUNT.pops)],
      ["확장한 정점 수", num(WALK_COUNT.expands)],
      ["버린 뒤처진 기록", num(WALK_COUNT.stale)],
      ["큐에 넣은 항목 수", num(WALK_COUNT.pushes)],
      ["완화해 본 간선 수", num(WALK_COUNT.relaxes)],
      ["추정 함수 호출 수", num(WALK_COUNT.hcalls)],
      ["큐의 최대 항목 수", num(WALK_COUNT.peak)],
    ];
    return [
      table(["무엇", "값"], rows, ["l", "r"]),
      "",
      `전개 입력 정점 ${num(WALK_N)} · 간선 ${num(WALK.length)} 에서 잰 값이다`,
      `└ 큐에 넣은 항목 수와 추정 함수 호출 수가 ${num(WALK_COUNT.pushes)} 로 같다 — 항목을 넣을 때마다 한 번씩 부른다`,
      `└ 꺼낸 항목 ${num(WALK_COUNT.pops)} 개 가운데 ${num(WALK_COUNT.stale)} 개가 뒤처진 기록이고 ${num(WALK_COUNT.expands)} 개가 확장으로 갔다`,
    ].join("\n");
  },

  /** `perf.derive` — 격자를 키우며 계수가 어떻게 자라는가. */
  "perf-growth": () => {
    const sides = [8, 16, 32, 64];
    const got = sides.map((k) => {
      const G = grid(k);
      const c = measure(G.n, G.edges, 0, G.goal, G.man);
      return { k, n: G.n, e: G.edges.length, c };
    });
    const rows = got.map((r) => [
      `${num(r.k)}×${num(r.k)}`,
      num(r.n),
      num(r.e),
      num(r.c.pushes),
      num(r.c.relaxes),
      num(r.c.peak),
    ]);
    const grow = got.slice(1).map((r, at) => {
      const prev = got[at] as (typeof got)[number];
      return [
        `${num(prev.k)} → ${num(r.k)}`,
        (r.n / prev.n).toFixed(2),
        (r.c.pushes / prev.c.pushes).toFixed(2),
        (r.c.relaxes / prev.c.relaxes).toFixed(2),
      ];
    });
    return [
      table(
        ["격자", "정점", "간선", "넣은 항목", "완화 시도", "큐 최대"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      table(
        [
          "한 변을 2 배로",
          "정점 성장률",
          "넣은 항목 성장률",
          "완화 시도 성장률",
        ],
        grow,
        ["l", "r", "r", "r"],
      ),
      "",
      "추정이 정확한 격자에서는 정점이 4 배가 되어도 넣은 항목은 2 배 언저리로만 늘어난다",
      "└ 확장이 시작과 목표를 잇는 좁은 띠에 머물기 때문이다",
    ].join("\n");
  },

  /** `perf.worst` — 모양마다 무엇이 가장 커지는가. */
  "worst-shape": () => {
    const SIZE = 256;
    const G = grid(16);
    const C = chain(SIZE);
    const S = star(SIZE);
    const D = denseDag(SIZE);
    const cases: Case[] = [
      {
        label: "격자 16×16 · 추정이 정확",
        n: G.n,
        edges: G.edges,
        src: 0,
        goal: G.goal,
        h: G.man,
      },
      {
        label: "격자 16×16 · 추정이 전부 0",
        n: G.n,
        edges: G.edges,
        src: 0,
        goal: G.goal,
        h: zeroH,
      },
      {
        label: "격자 16×16 · 추정 30%",
        n: G.n,
        edges: G.edges,
        src: 0,
        goal: G.goal,
        h: patchy(G.man, 30),
      },
      {
        label: "사슬 256 · 추정이 정확",
        n: C.n,
        edges: C.edges,
        src: 0,
        goal: SIZE - 1,
        h: C.h,
      },
      {
        label: "별 256 · 추정이 정확",
        n: S.n,
        edges: S.edges,
        src: 0,
        goal: SIZE - 1,
        h: S.h,
      },
      {
        label: "완전 DAG 256 · 추정이 정확",
        n: D.n,
        edges: D.edges,
        src: 0,
        goal: SIZE - 1,
        h: D.h,
      },
    ];
    const got = cases.map((c) => ({
      c,
      count: measure(c.n, c.edges, c.src, c.goal, c.h),
    }));
    const rows = got.map((r) => [
      r.c.label,
      num(r.c.edges.length),
      num(r.count.expands),
      num(r.count.reexpands),
      num(r.count.pushes),
      num(r.count.peak),
    ]);
    const worst = got.reduce((a, b) =>
      b.count.expands > a.count.expands ? b : a,
    );
    const most = got.reduce((a, b) => (b.count.peak > a.count.peak ? b : a));
    const pushy = got.reduce((a, b) =>
      b.count.pushes > a.count.pushes ? b : a,
    );
    return [
      table(
        ["배치", "간선", "확장", "그중 재확장", "넣은 항목", "큐 최대"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `정점 수가 ${num(SIZE)} 로 같은 모양 ${num(rows.length)} 개다. 확장이 가장 많은 것은 「${worst.c.label}」 이고 ${num(worst.count.expands)} 개다`,
      `└ 그 확장 수가 정점 수 ${num(SIZE)} 보다 크다 — 같은 정점을 ${num(worst.count.reexpands)} 번 다시 확장한다`,
      `└ 넣은 항목이 가장 많은 것은 「${pushy.c.label}」 이고 ${num(pushy.count.pushes)} 개다 — 간선 수 ${num(pushy.c.edges.length)} 에 1 을 더한 값이다`,
      `└ 큐가 가장 커지는 것은 「${most.c.label}」 이고 ${num(most.count.peak)} 개다. 셋이 서로 다른 배치다`,
    ].join("\n");
  },

  /** `perf.worst` — 재확장이 규모에 따라 어떻게 자라는가. */
  "worst-reopen": () => {
    const sides = [8, 16, 32, 64];
    const got = sides.map((k) => {
      const G = grid(k);
      let worst = { p: -1, expands: 0, re: 0 };
      for (const p of RATIOS) {
        const c = measure(G.n, G.edges, 0, G.goal, patchy(G.man, p));
        if (c.expands > worst.expands)
          worst = { p, expands: c.expands, re: c.reexpands };
      }
      return { k, n: G.n, worst };
    });
    const rows = got.map((r) => [
      `${num(r.k)}×${num(r.k)}`,
      num(r.n),
      `${num(r.worst.p)}%`,
      num(r.worst.expands),
      num(r.worst.re),
      (r.worst.expands / r.n).toFixed(2),
    ]);
    const top = got.reduce((a, b) =>
      b.worst.expands / b.n > a.worst.expands / a.n ? b : a,
    );
    const over = got.filter((r) => r.worst.expands > r.n).length;
    return [
      table(
        [
          "격자",
          "정점",
          "가장 나쁜 비율",
          "확장",
          "그중 재확장",
          "확장 ÷ 정점",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `${num(RATIOS.length)} 개 비율에서 재고 가장 나쁜 자리를 골랐다. 마지막 열이 1 을 넘는 규모가 ${num(over)} 개다`,
      `└ 가장 큰 자리는 ${num(top.k)}×${num(top.k)} 격자의 ${(top.worst.expands / top.n).toFixed(2)} 다 — 규모에 따라 오르내린다`,
      "└ 정점마다 확장이 한 번이라는 보장은 추정이 일관적일 때만 성립한다",
    ].join("\n");
  },
};

/* ────────────────────────── 보조 ────────────────────────── */

/** 단순 경로의 수를 센다. 전개 입력은 작아서 전부 세어도 끝난다. */
function countPaths(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const seen = Array.from({ length: n }, () => false);
  let total = 0;
  const walk = (u: number): void => {
    if (u === goal) {
      total++;
      return;
    }
    seen[u] = true;
    for (const v of adj[u] as number[]) if (!seen[v]) walk(v);
    seen[u] = false;
  };
  walk(src);
  return total;
}

/**
 * 뒤처진 기록을 버리지 않는 판의 계수.
 *
 * 변이 모듈은 답만 돌려주므로 계수는 같은 절차의 계측본으로 잰다. **중화 실행이 아닐 때는
 * 변이가 낸 답과 대조해** 계측본이 그 판을 실제로 흉내내는지 확인한다.
 */
function noStaleRun(c: Case): Counted {
  const got = walkRun(c.n, c.edges, c.src, c.goal, c.h, null, {
    noStale: true,
  });
  if (
    !중화됨 &&
    got.answer !== noStale.aStarSearch(c.n, c.edges, c.src, c.goal, c.h)
  ) {
    throw new Error("계측본이 변이와 다른 답을 냈다");
  }
  return got;
}

/** 추정을 두 배로 부풀린 판의 계수. 같은 자리에서 변이와 답을 대조한다. */
function inflatedRun(c: Case): Counted {
  const got = walkRun(c.n, c.edges, c.src, c.goal, c.h, null, {
    inflate: true,
  });
  if (
    !중화됨 &&
    got.answer !== inflated.aStarSearch(c.n, c.edges, c.src, c.goal, c.h)
  ) {
    throw new Error("계측본이 변이와 다른 답을 냈다");
  }
  return got;
}

/** 키를 남은 비용의 추정 하나로 둔 판. 변이가 아니라 다른 설계라 대조할 상대가 없다. */
function greedy(c: Case): Counted {
  return walkRun(c.n, c.edges, c.src, c.goal, c.h, null, { keyOnlyH: true });
}
