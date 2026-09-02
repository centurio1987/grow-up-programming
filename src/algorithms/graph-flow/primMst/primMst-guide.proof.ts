/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/primMst/primMst-guide.md
 *
 * **세는 사본이 넷 있다**(`byRescan`·`byRound`·`bySortedList`·`byHeap`). 정본은 기본 연산을
 * 몇 번 했는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * `orderFrom`·`cutTrace` 도 사본이다 — 앞은 고른 간선을 고른 순서로, 뒤는 걸음마다 경계 간선
 * 목록을 함께 적으려고 둔 것이고, 둘 다 큐를 배열 전수 검사로 바꿔 적어 힙의 자리 배치가
 * 결과에 안 섞이게 했다. **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표를 만드는
 * 자리마다 정본의 반환값과 대조하고, 다르면 그 자리에서 던진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { type Edge, primMst } from "./primMst-guide.ref.ts";

const REF = new URL("./primMst-guide.ref.ts", import.meta.url).pathname;

/**
 * 본문 전개가 쓰는 고정 입력. `kruskalMst` 편이 쓰는 그래프와 같은 것이라 두 절차가 같은
 * 트리를 다른 순서로 만드는 것을 같은 값으로 대조할 수 있다. 간선 일곱 개의 가중치가 전부
 * 달라 최소 신장 트리가 하나로 정해진다.
 */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 1, 1],
  [0, 3, 4],
  [0, 5, 7],
  [1, 2, 3],
  [2, 3, 2],
  [3, 4, 6],
  [4, 5, 5],
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

/** 결정론적 가중치. `1 ≤ w ≤ 997` 을 지킨다. */
const weight = (i: number, j: number): number => ((i * 31 + j * 17) % 997) + 1;

/**
 * 정점 `v` 개에 간선이 `e` 개인 그래프. 먼저 `0—1—…—(v-1)` 을 깔아 연결을 보장하고, 그 뒤
 * 남은 자리를 정점 번호 순으로 채운다. **`primMst-guide.alt.ts` 와 같은 생성식이다** — 두
 * 파일이 같은 그래프를 재야 본문의 값이 서로 어긋나지 않는다.
 */
function graphOf(v: number, e: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, weight(i, i + 1)]);
  outer: for (let i = 0; i < v; i++) {
    for (let j = i + 1; j < v; j++) {
      if (j === i + 1) continue;
      if (out.length >= e) break outer;
      out.push([i, j, weight(i, j)]);
    }
  }
  return out;
}

/** 정점 `v` 개를 한 줄로 이은 그래프. 간선이 `v-1` 개로 가장 적다. */
const path = (v: number): Edge[] => graphOf(v, v - 1);

/** 정점 `v` 개짜리 완전 그래프. 간선이 `v(v-1)/2` 개로 가장 많다. */
const complete = (v: number): Edge[] => graphOf(v, (v * (v - 1)) / 2);

/** 정점 0 이 나머지 전부와 이어진 그래프. 간선 수는 한 줄로 이은 것과 같다. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i, weight(0, i)]);
  return out;
}

/** 한 줄로 잇고 같은 간선을 한 벌 더 얹은 그래프. 간선 수만 두 배가 된다. */
function doubled(v: number): Edge[] {
  return [...path(v), ...path(v)];
}

/** 한 줄로 잇고 **가장 무거운** 간선을 한 벌 더 얹은 그래프. */
function heavy(v: number): Edge[] {
  const out: Edge[] = path(v);
  for (let i = 0; i < v; i++) out.push([i, (i + 7) % v, 1_000_000_000]);
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

/** `14,658년` 꼴 — 초를 사람이 읽는 단위로 바꾼다. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)}초`;
  if (seconds < 60) return `${seconds.toFixed(1)}초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)}분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)}일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))}년`;
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

interface Counted {
  answer: number;
  ops: number;
}

/**
 * 가장 단순한 방법 — 간선 목록에서 **크기 `n-1` 인 부분집합을 전부** 만들어, 그것이 모든
 * 정점을 잇고 사이클이 없는지 검사하고 가중치 합이 가장 작은 것을 남긴다. 사이클이 없으면서
 * 모든 정점을 잇는 간선 집합이 곧 신장 트리이므로, 이 열거가 신장 트리 전수 열거다.
 */
function allSpanningTrees(
  n: number,
  edges: Edge[],
): { trees: number; min: number; max: number; reads: number } {
  const pickCount = n - 1;
  const chosen: number[] = [];
  let trees = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  let reads = 0;

  /** 고른 간선이 사이클 없이 모든 정점을 잇는가. 읽은 간선 끝점 수도 함께 센다. */
  function spans(): boolean {
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
      if (spans()) {
        trees++;
        let sum = 0;
        for (const idx of chosen) sum += (edges[idx] as Edge)[2];
        if (sum < min) min = sum;
        if (sum > max) max = sum;
      }
      return;
    }
    for (let i = from; i < edges.length; i++) {
      chosen.push(i);
      walk(i + 1);
      chosen.pop();
    }
  }

  if (pickCount === 0) return { trees: 1, min: 0, max: 0, reads: 0 };
  walk(0);
  return { trees, min, max, reads };
}

/**
 * 방식 A — 정점을 하나씩 붙이되, 붙일 때마다 **경계를 넘는 간선을 간선 목록에서 전부 다시
 * 본다.** 후보를 하나도 들고 있지 않는 판이다.
 *
 * 기본 연산은 비교 한 번과 배열 칸을 읽거나 쓴 한 번을 각각 하나로 센다 — 아래 넷이 같은
 * 정의를 쓴다.
 */
function byRescan(n: number, edges: Edge[]): Counted {
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  let ops = 0;
  let total = 0;
  let joined = 1;
  inTree[0] = true;

  while (joined < n) {
    let best = -1;
    let target = -1;
    for (const [u, v, w] of edges) {
      ops += 2;
      const a = inTree[u] === true;
      const b = inTree[v] === true;
      if (a === b) continue;
      ops += 1;
      if (best < 0 || w < best) {
        best = w;
        target = a ? v : u;
      }
    }
    if (best < 0) return { answer: -1, ops };
    inTree[target] = true;
    ops += 1;
    total += best;
    joined++;
  }
  return { answer: total, ops };
}

/**
 * 방식 B — 정점마다 **트리와 잇는 가장 가벼운 간선 하나**를 배열에 적어 두고, 라운드마다
 * 트리 밖 정점을 전수로 보아 그중 가장 작은 것을 고른다. 간선은 한 번씩만 본다.
 */
function byRound(n: number, edges: Edge[]): Counted {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  let ops = 0;
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
    ops += 2;
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const best: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  best[0] = 0;
  let total = 0;
  let joined = 0;

  for (let round = 0; round < n; round++) {
    let u = -1;
    for (let x = 0; x < n; x++) {
      ops += 2;
      if (
        inTree[x] !== true &&
        (u < 0 || (best[x] as number) < (best[u] as number))
      ) {
        u = x;
      }
    }
    if (u < 0 || best[u] === Number.POSITIVE_INFINITY)
      return { answer: -1, ops };
    inTree[u] = true;
    total += best[u] as number;
    joined++;
    ops += 1;
    for (const [v, w] of adj[u] as [number, number][]) {
      ops += 1;
      if (inTree[v] !== true && w < (best[v] as number)) {
        best[v] = w;
        ops += 1;
      }
    }
  }
  return { answer: joined === n ? total : -1, ops };
}

/**
 * 방식 C — 후보를 **가중치 오름차순으로 늘어놓은 배열**에 담는다. 최소는 늘 맨 앞이라 꺼내기가
 * 한 번이지만, 넣을 때 자리를 찾아 뒤쪽을 한 칸씩 밀어야 한다.
 */
function bySortedList(n: number, edges: Edge[]): Counted & { shifts: number } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  let ops = 0;
  let shifts = 0;
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
    ops += 2;
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const list: [number, number][] = [];

  const insert = (node: number, key: number): void => {
    let i = list.length;
    while (i > 0) {
      ops += 1;
      if ((list[i - 1] as [number, number])[1] <= key) break;
      i--;
      shifts++;
    }
    list.splice(i, 0, [node, key]);
    ops += list.length - i;
  };

  insert(0, 0);
  let total = 0;
  let joined = 0;
  while (list.length > 0) {
    const [u, w] = list.shift() as [number, number];
    ops += list.length + 1;
    if (inTree[u] === true) continue;
    inTree[u] = true;
    total += w;
    joined++;
    ops += 1;
    if (joined === n) return { answer: total, ops, shifts };
    for (const [v, ew] of adj[u] as [number, number][]) {
      ops += 1;
      if (inTree[v] !== true) insert(v, ew);
    }
  }
  return { answer: joined === n ? total : -1, ops, shifts };
}

/** 걸음 하나의 상태 — `queue-items` 표가 쓴다. */
interface HeapStep {
  label: string;
  inTree: number[];
  crossing: number;
  items: number;
  stale: number;
}

/**
 * 방식 D — 정본과 같은 절차에 계수와 걸음 기록만 덧붙인 사본. 힙 배열의 순서까지 정본과 같게
 * 두어 `.sim.ts` 의 프레임이 이 사본의 기록에서 나온다.
 */
function byHeap(
  n: number,
  edges: Edge[],
  trace = false,
): Counted & {
  pushes: number;
  maxItems: number;
  steps: HeapStep[];
  heaps: [number, number][][];
} {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  let ops = 0;
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
    ops += 2;
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const items: [number, number][] = [];
  const steps: HeapStep[] = [];
  const heaps: [number, number][][] = [];
  let pushes = 0;
  let maxItems = 0;

  const key = (i: number): number => (items[i] as [number, number])[1];
  const swap = (a: number, b: number): void => {
    const t = items[a] as [number, number];
    items[a] = items[b] as [number, number];
    items[b] = t;
    ops += 2;
  };
  const push = (node: number, k: number): void => {
    items.push([node, k]);
    pushes++;
    if (items.length > maxItems) maxItems = items.length;
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      ops += 1;
      if (key(i) >= key(parent)) break;
      swap(i, parent);
      i = parent;
    }
  };
  const pop = (): [number, number] => {
    const top = items[0] as [number, number];
    const last = items.pop() as [number, number];
    if (items.length > 0) {
      items[0] = last;
      ops += 1;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < items.length) {
          ops += 1;
          if (key(left) < key(small)) small = left;
        }
        if (right < items.length) {
          ops += 1;
          if (key(right) < key(small)) small = right;
        }
        if (small === i) break;
        swap(i, small);
        i = small;
      }
    }
    return top;
  };

  /** 지금 트리 안 정점과 밖 정점을 잇는 간선의 수. */
  const crossing = (): number => {
    let c = 0;
    for (const [u, v] of edges) {
      if (u === v) continue;
      if ((inTree[u] === true) !== (inTree[v] === true)) c++;
    }
    return c;
  };
  /** 큐에 남은 항목 중 이미 트리에 든 정점을 가리키는 것의 수. */
  const staleCount = (): number =>
    items.filter(([v]) => inTree[v] === true).length;
  const record = (label: string): void => {
    // 걸음마다 경계 간선을 다시 세는 일이라 큰 입력에서는 끄고 계수만 낸다.
    if (!trace) return;
    steps.push({
      label,
      inTree: inTree.flatMap((f, i) => (f ? [i] : [])),
      crossing: crossing(),
      items: items.length,
      stale: staleCount(),
    });
    heaps.push(items.map(([a, b]) => [a, b] as [number, number]));
  };

  push(0, 0);
  record("T1");
  let total = 0;
  let joined = 0;
  let step = 1;
  while (items.length > 0) {
    const [u, w] = pop();
    ops += 1;
    step++;
    if (inTree[u] === true) {
      record(`T${step}`);
      continue;
    }
    inTree[u] = true;
    total += w;
    joined++;
    ops += 1;
    if (joined === n) {
      record(`T${step}`);
      return { answer: total, ops, pushes, maxItems, steps, heaps };
    }
    for (const [v, ew] of adj[u] as [number, number][]) {
      ops += 1;
      if (inTree[v] !== true) push(v, ew);
    }
    record(`T${step}`);
  }
  return {
    answer: joined === n ? total : -1,
    ops,
    pushes,
    maxItems,
    steps,
    heaps,
  };
}

/** 사본이 정본과 같은 답을 내는지 확인하고 계수를 돌려준다. */
function checked(name: string, n: number, edges: Edge[], got: Counted): number {
  const want = primMst(n, edges);
  if (got.answer !== want) {
    throw new Error(`${name} 의 답이 정본과 다르다 — ${got.answer} ≠ ${want}`);
  }
  return got.ops;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { primMst: (n: number, edges: Edge[]) => number };

/** 시작 정점만 바꾼 판. 나머지는 정본 그대로다. */
const startAt = (v: number): Promise<Ref> =>
  loadMutant<Ref>(REF, { swap: [/pq\.push\(0, 0\);/, `pq.push(${v}, 0);`] });

/** 이미 트리에 든 정점을 걸러 내는 줄을 지운 판. */
const noSkip = (): Promise<Ref> =>
  loadMutant<Ref>(REF, { drop: /^\s*if \(inTree\[u\] === true\) continue;$/ });

/** 마지막 줄의 삼항식을 합계로 바꾼 판. 못 이은 정점이 있어도 그냥 더한 값을 답한다. */
const noCheck = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [/return joined === n \? total : -1;/, "return total;"],
  });

/**
 * 큐에 넣는 키를 **간선 하나의 가중치**에서 **시작 정점부터의 누적 합**으로 바꾼 판.
 * 불변식을 지키던 바로 그 줄이다 — 키가 간선 가중치라야 꺼낸 최소가 경계 최소가 된다.
 */
const cumulativeKey = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /if \(inTree\[v\] !== true\) pq\.push\(v, ew\);/,
      "if (inTree[v] !== true) pq.push(v, w + ew);",
    ],
  });

/** 표에 나란히 놓는 네 입력. 이름은 본문 표기와 같다. */
const FOUR: [string, number, Edge[]][] = [
  ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES],
  ["삼각형 세 정점", TRI_N, TRI_EDGES],
  ["가중치가 같은 사각형", SQUARE_N, SQUARE_EDGES],
  ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
];

const mutantTable = async (
  label: string,
  make: () => Promise<Ref>,
  inputs: [string, number, Edge[]][],
): Promise<string> => {
  const mod = await make();
  const rows: string[][] = [["", "정본", label]];
  for (const [name, v, e] of inputs) {
    rows.push([name, comma(primMst(v, e)), comma(mod.primMst(v, e))]);
  }
  return table(rows, [1, 2]).join("\n");
};

const NO_SKIP = await mutantTable("걸러 내지 않는다", noSkip, FOUR);
const CUMULATIVE = await mutantTable(
  "누적 합을 키로 쓴다",
  cumulativeKey,
  FOUR,
);
const NO_CHECK = await mutantTable("개수를 안 본다", noCheck, [
  ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
  ["정점 넷에 간선 없음", 4, []],
  ["둘씩 이어진 정점 넷", 4, [[0, 1, 3] as Edge, [2, 3, 4] as Edge]],
  ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES],
]);

/** 시작 정점 여섯 판. 각각이 정본에서 한 줄만 바꾼 변이다. */
const START_ROWS: string[][] = [
  ["시작 정점", "반환값", "고른 간선을 고른 순서"],
];
for (let v = 0; v < WALK_N; v++) {
  const mod = await startAt(v);
  START_ROWS.push([
    String(v),
    comma(mod.primMst(WALK_N, WALK_EDGES)),
    orderFrom(v),
  ]);
}
const START_TABLE = table(START_ROWS, [1]).join("\n");

/** 시작 정점 `s` 에서 고른 간선을 고른 순서대로 적는다. */
function orderFrom(s: number): string {
  const n = WALK_N;
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of WALK_EDGES) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const items: [number, number, number][] = [];
  const take = (): [number, number, number] => {
    let at = 0;
    for (let i = 1; i < items.length; i++) {
      if (
        (items[i] as [number, number, number])[1] <
        (items[at] as [number, number, number])[1]
      ) {
        at = i;
      }
    }
    return items.splice(at, 1)[0] as [number, number, number];
  };
  items.push([s, 0, -1]);
  const picked: string[] = [];
  while (items.length > 0) {
    const [u, w, from] = take();
    if (inTree[u] === true) continue;
    inTree[u] = true;
    if (from >= 0)
      picked.push(`(${Math.min(from, u)},${Math.max(from, u)})=${w}`);
    for (const [v, ew] of adj[u] as [number, number][]) {
      if (inTree[v] !== true) items.push([v, ew, u]);
    }
  }
  return picked.join(" ");
}

/**
 * 걸음마다 트리 안 정점 집합 `S` · 경계 간선 목록 `C(S)` · 그중 가장 가벼운 것 · 절차가
 * 실제로 고른 간선을 함께 적는다. 정본과 같은 순서로 정점을 넣되 그 자리에서 `C(S)` 를
 * 간선 목록에서 직접 세므로, 큐가 낸 답과 정의가 낸 답이 같은지 대조된다.
 */
function cutTrace(n: number, edges: Edge[]): string[][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const items: [number, number, number][] = [];
  const take = (): [number, number, number] => {
    let at = 0;
    for (let i = 1; i < items.length; i++) {
      const a = items[i] as [number, number, number];
      const b = items[at] as [number, number, number];
      if (a[1] < b[1]) at = i;
    }
    return items.splice(at, 1)[0] as [number, number, number];
  };
  /** 지금 경계를 넘는 간선을 `(u,v)=w` 꼴로 정점 번호 순으로 적는다. */
  const crossingList = (): { text: string; min: string } => {
    const out: [number, number, number][] = [];
    for (const [u, v, w] of edges) {
      if (u === v) continue;
      if ((inTree[u] === true) !== (inTree[v] === true)) out.push([u, v, w]);
    }
    let best: [number, number, number] | null = null;
    for (const e of out) if (best === null || e[2] < best[2]) best = e;
    const show = (e: [number, number, number]): string =>
      `(${e[0]},${e[1]})=${e[2]}`;
    return {
      text: out.length === 0 ? "없다" : out.map(show).join(" "),
      min: best === null ? "없다" : show(best),
    };
  };

  const rows: string[][] = [
    [
      "트리 안 정점 S",
      "경계 간선 C(S)",
      "그중 가장 가벼운 것",
      "절차가 고른 간선",
    ],
  ];
  items.push([0, 0, -1]);
  let joined = 0;
  while (items.length > 0) {
    const [u, w, from] = take();
    if (inTree[u] === true) continue;
    const picked =
      from < 0 ? null : `(${Math.min(from, u)},${Math.max(from, u)})=${w}`;
    if (picked !== null) {
      const c = crossingList();
      rows.push([
        `{${inTree.flatMap((f, i) => (f ? [i] : [])).join(", ")}}`,
        c.text,
        c.min,
        picked,
      ]);
    }
    inTree[u] = true;
    joined++;
    if (joined === n) break;
    for (const [v, ew] of adj[u] as [number, number][]) {
      if (inTree[v] !== true) items.push([v, ew, u]);
    }
  }
  return rows;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 전개 입력의 신장 트리를 전부 만들어 본 값. */
  "spanning-trees": () => {
    const b = allSpanningTrees(WALK_N, WALK_EDGES);
    if (b.min !== primMst(WALK_N, WALK_EDGES)) {
      throw new Error(`전수 열거의 최솟값이 정본과 다르다 — ${b.min}`);
    }
    // 크기 `n-1` 인 부분집합의 개수. 손으로 적지 않고 여기서 센다.
    let subsets = 1;
    for (let k = 0; k < WALK_N - 1; k++) {
      subsets = (subsets * (WALK_EDGES.length - k)) / (k + 1);
    }
    return table(
      [
        ["", "값"],
        [`크기 ${WALK_N - 1} 인 간선 부분집합 수`, comma(Math.round(subsets))],
        ["그중 신장 트리인 것", comma(b.trees)],
        ["읽은 간선 끝점 수", comma(b.reads)],
        ["가장 작은 가중치 합", comma(b.min)],
        ["가장 큰 가중치 합", comma(b.max)],
      ],
      [1],
    ).join("\n");
  },

  /** 신장 트리를 전부 만들면 제약 규모에서 얼마가 되는가 — 완전 그래프 기준. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["정점 V", "간선 E", "신장 트리 수 V^(V-2)", "초당 1억 개 기준"],
    ];
    for (const v of [6, 10, 15, 20]) {
      const e = (v * (v - 1)) / 2;
      const digits = (v - 2) * Math.log10(v);
      const value = 10 ** digits;
      rows.push([
        comma(v),
        comma(e),
        value > 1e15 ? value.toExponential(3) : comma(Math.round(value)),
        duration(value / 1e8),
      ]);
    }
    const big = 10_000;
    const bigDigits = Math.floor((big - 2) * Math.log10(big)) + 1;
    return `${table(rows, [0, 1, 2, 3]).join("\n")}
        └ 제약 상한인 정점 ${comma(big)} 개짜리 완전 그래프면 신장 트리 수만 ${comma(bigDigits)} 자리다`;
  },

  /** ④ — 경계를 매번 다시 보는 판과 후보 하나를 들고 있는 판의 계수. */
  "frontier-cost": () => {
    const rows: string[][] = [
      ["입력", "V", "E", "방식 A 다시 본다", "방식 B 들고 있는다", "합계"],
    ];
    for (const [name, v, e] of [
      ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES],
      ["한 줄로 이은 100 정점", 100, path(100)],
      ["별 모양 100 정점", 100, star(100)],
      ["완전 그래프 40 정점", 40, complete(40)],
    ] as [string, number, Edge[]][]) {
      const a = checked(`방식 A · ${name}`, v, e, byRescan(v, e));
      const b = checked(`방식 B · ${name}`, v, e, byRound(v, e));
      rows.push([
        name,
        comma(v),
        comma(e.length),
        comma(a),
        comma(b),
        comma(primMst(v, e)),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** ⑤ — 후보를 정렬한 배열에 담는 판과 힙에 담는 판. */
  "store-sorted": () => {
    const rows: string[][] = [
      ["입력", "V", "E", "방식 C 정렬 배열", "옮긴 칸", "방식 D 힙"],
    ];
    for (const [name, v, e] of [
      ["전개가 쓰는 여섯 정점", WALK_N, WALK_EDGES],
      ["한 줄로 이은 200 정점", 200, path(200)],
      ["별 모양 200 정점", 200, star(200)],
      ["완전 그래프 100 정점", 100, complete(100)],
    ] as [string, number, Edge[]][]) {
      const s = bySortedList(v, e);
      const h = byHeap(v, e);
      checked(`정렬 배열 · ${name}`, v, e, s);
      checked(`힙 · ${name}`, v, e, h);
      rows.push([
        name,
        comma(v),
        comma(e.length),
        comma(s.ops),
        comma(s.shifts),
        comma(h.ops),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** ⑥ — 세 방식을 성긴 그래프와 촘촘한 그래프에서 나란히 재 본다. */
  "store-choice": () => {
    const rows: string[][] = [
      ["입력", "V", "E", "방식 A", "방식 B", "방식 D 힙"],
    ];
    for (const v of [50, 200, 400]) {
      for (const [shape, edges] of [
        ["한 줄로 이었다", path(v)],
        ["완전 그래프다", complete(v)],
      ] as [string, Edge[]][]) {
        rows.push([
          `${shape} V=${comma(v)}`,
          comma(v),
          comma(edges.length),
          comma(
            checked(`방식 A · ${shape} ${v}`, v, edges, byRescan(v, edges)),
          ),
          comma(checked(`방식 B · ${shape} ${v}`, v, edges, byRound(v, edges))),
          comma(checked(`힙 · ${shape} ${v}`, v, edges, byHeap(v, edges))),
        ]);
      }
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },

  /** 멈춤 — 시작 정점을 바꾼 여섯 판. */
  "mutant-start": () => START_TABLE,

  /** 멈춤 — 이미 트리에 든 정점을 안 걸러 내면 무엇이 나오는가. */
  "mutant-no-skip": () => NO_SKIP,

  /** 멈춤 — 마지막 개수 검사를 빼면 이어지지 않은 그래프에서 무엇이 나오는가. */
  "mutant-no-check": () => NO_CHECK,

  /** 전개가 쓰는 입력을 전체 코드로 실행한 값. */
  "walk-result": () => {
    const rows: string[][] = [["입력", "반환값"]];
    for (const [name, v, e] of FOUR) rows.push([name, comma(primMst(v, e))]);
    return table(rows, [1]).join("\n");
  },

  /** 수식 검산 — 걸음마다 경계 간선 수와 큐에 남은 항목 수를 나란히 센다. */
  "queue-items": () => {
    const run = byHeap(WALK_N, WALK_EDGES, true);
    const rows: string[][] = [
      [
        "걸음",
        "트리 안 정점",
        "경계 간선 |C(S)|",
        "큐에 남은 항목",
        "그중 지나간 후보",
      ],
    ];
    for (const s of run.steps) {
      rows.push([
        s.label,
        `{${s.inTree.join(", ")}}`,
        comma(s.crossing),
        comma(s.items),
        comma(s.stale),
      ]);
    }
    return `${table(rows, [2, 3, 4]).join("\n")}
        └ 큐에 넣은 항목이 모두 ${comma(run.pushes)} 개이고 간선이 ${comma(WALK_EDGES.length)} 개다.
          한 번에 담긴 항목이 가장 많았던 때가 ${comma(run.maxItems)} 개다`;
  },

  /** 수식 검산 — 걸음마다 경계 간선 목록과 그 최소를 절차가 고른 간선과 대조한다. */
  "cut-min": () => table(cutTrace(WALK_N, WALK_EDGES)).join("\n"),

  /** 불변식을 깨뜨린다 — 큐의 키를 간선 가중치에서 누적 합으로 바꾼 판. */
  "mutant-cumulative": () => CUMULATIVE,

  /** 결과식에 제약 규모를 넣어 수치를 낸다. */
  "crossing-scale": () => {
    const rows: string[][] = [
      [
        "정점 V",
        "간선 E",
        "경계를 매번 다시 세면 (V-1)E",
        "큐에 넣는 항목 E+1",
        "몇 배",
      ],
    ];
    for (const v of [6, 100, 10_000]) {
      const e = v === 6 ? WALK_EDGES.length : (v * (v - 1)) / 2;
      const rescan = (v - 1) * e;
      const items = e + 1;
      rows.push([
        comma(v),
        comma(e),
        comma(rescan),
        comma(items),
        `${(rescan / items).toLocaleString("en-US", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}배`,
      ]);
    }
    const bigE = (10_000 * 9_999) / 2;
    const bound = 4 * bigE + 3 * (bigE + 1) * Math.ceil(Math.log2(bigE + 1));
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 제약 상한 V=10,000 · E=49,995,000 에서 힙판 총식 상한
          4E + 3(E+1)⌈log2(E+1)⌉ = ${comma(bound)}`;
  },

  /** 최악을 만드는 입력 — 모양을 바꿔 가며 실제로 재 본다. */
  "shape-values": () => {
    const v = 20_000;
    const rows: string[][] = [
      ["입력 모양", "V", "E", "기본 연산", "큐에 넣은 항목", "합계"],
    ];
    for (const [name, edges] of [
      ["한 줄로 이었다", path(v)],
      ["별 모양이다", star(v)],
      ["한 줄로 잇고 같은 간선을 한 벌 더 넣었다", doubled(v)],
      ["한 줄로 잇고 무거운 간선을 한 벌 더 넣었다", heavy(v)],
      ["앞의 절반만 잇는다", path(v / 2)],
    ] as [string, Edge[]][]) {
      const run = byHeap(v, edges);
      checked(`최악 · ${name}`, v, edges, run);
      const answer = primMst(v, edges);
      rows.push([
        name,
        comma(v),
        comma(edges.length),
        comma(run.ops),
        comma(run.pushes),
        answer === -1 ? "-1" : comma(answer),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5]).join("\n");
  },
};
