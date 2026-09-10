/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts connectedComponents-guide.alt.ts
 *
 * **무엇을 세는가.** 배열 칸을 한 번 읽으면 1, 한 번 쓰면 1이다. 칸을 새로 만드는 것도
 * 쓰기로 센다. 두 설계에 같은 규칙을 걸었고, 각 설계는 물음마다 **필요한 일만** 한다 —
 * 성분 수만 물으면 목록을 만들지 않는다. 열등한 형태를 세우면 대조가 아니라 연출이 된다.
 *
 * **왜 전개 입력만 쓰지 않는가**(L20). 전개는 정점 6개를 쓰는데, 그 규모에서는 두 설계가
 * 세 자릿수 안에서 갈려 순서가 뒤집히는 자리를 볼 수 없다. 그래서 전개 입력의 계수도 함께
 * 내고, 규모가 필요한 축은 아래 생성식으로 만든 정점 1,000개 입력에서 잰다.
 * **난수를 쓰지 않으므로 시드가 없다** — 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

type Edge = [number, number];

/** 전개가 쓰는 입력. 삼각형 {0,4,2} · 간선 하나 {1,3} · 외딴 정점 {5}. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 4],
  [4, 2],
  [2, 0],
  [1, 3],
];

/** 규모 입력 — 정점 1,000개를 크기 10짜리 고리 100개로 가른다. */
export const RING_N = 1_000;
export const RING_SIZE = 10;

/** `c` 번째 고리의 `j` 번 정점은 `10c + j` 이고 `10c + (j+1 mod 10)` 과 이어진다. */
export const RING_EDGES: Edge[] = (() => {
  const out: Edge[] = [];
  for (let c = 0; c < RING_N / RING_SIZE; c++) {
    for (let j = 0; j < RING_SIZE; j++) {
      out.push([c * RING_SIZE + j, c * RING_SIZE + ((j + 1) % RING_SIZE)]);
    }
  }
  return out;
})();

/** 배열 칸 접근을 세는 통. 읽기도 쓰기도 1이다. */
class Meter {
  cells = 0;
  read(): void {
    this.cells++;
  }
  write(k = 1): void {
    this.cells += k;
  }
}

/* ────────────────────── 이 가이드의 설계 — 탐색 ────────────────────── */

function buildAdj(n: number, edges: Edge[], m: Meter): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  m.write(n);
  for (const [u, v] of edges) {
    m.read();
    (adj[u] as number[]).push(v);
    m.write();
    m.read();
    (adj[v] as number[]).push(u);
    m.write();
  }
  return adj;
}

/** 성분 번호를 매기는 부분. `list` 가 거짓이면 성분 수만 낸다. */
function traversal(
  n: number,
  edges: Edge[],
  list: boolean,
  m: Meter,
): number[][] | number {
  const adj = buildAdj(n, edges, m);
  const comp: number[] = Array.from({ length: n }, () => -1);
  m.write(n);
  let count = 0;

  for (let s = 0; s < n; s++) {
    m.read();
    if (comp[s] !== -1) continue;
    comp[s] = count;
    m.write();
    const queue: number[] = [s];
    m.write();
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++] as number;
      m.read();
      const list_ = adj[node] as number[];
      m.read();
      for (const next of list_) {
        m.read();
        if ((comp[next] as number) !== -1) continue;
        comp[next] = count;
        m.write();
        queue.push(next);
        m.write();
      }
    }
    count++;
  }
  if (!list) return count;

  const out: number[][] = Array.from({ length: count }, () => []);
  m.write(count);
  for (let v = 0; v < n; v++) {
    m.read();
    const bucket = out[comp[v] as number] as number[];
    m.read();
    bucket.push(v);
    m.write();
  }
  return out;
}

/* ────────────── 경쟁 설계 — 서로소 집합 (경로 압축 + 크기 합병) ────────────── */

/**
 * 같은 목표를 노리는 다른 절차다. 정점마다 부모 칸 하나를 두고, 간선 하나를 받을 때마다
 * 두 끝의 뿌리를 찾아 한쪽 뿌리를 다른 쪽에 붙인다. 이웃 목록을 만들지 않는다.
 */
class DisjointSet {
  parent: number[];
  size: number[];
  count: number;
  private m: Meter;

  constructor(n: number, m: Meter) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = Array.from({ length: n }, () => 1);
    m.write(2 * n);
    this.count = n;
    this.m = m;
  }

  find(x: number): number {
    let root = x;
    this.m.read();
    while ((this.parent[root] as number) !== root) {
      root = this.parent[root] as number;
      this.m.read();
    }
    // 경로 압축 — 지나온 칸이 뿌리를 곧장 가리키게 고친다.
    let cur = x;
    while (cur !== root) {
      const next = this.parent[cur] as number;
      this.m.read();
      this.parent[cur] = root;
      this.m.write();
      cur = next;
    }
    return root;
  }

  union(a: number, b: number): void {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return;
    this.m.read();
    this.m.read();
    if ((this.size[ra] as number) < (this.size[rb] as number)) {
      const t = ra;
      ra = rb;
      rb = t;
    }
    this.parent[rb] = ra;
    this.m.write();
    this.size[ra] = (this.size[ra] as number) + (this.size[rb] as number);
    this.m.write();
    this.count--;
  }
}

function disjointSet(
  n: number,
  edges: Edge[],
  list: boolean,
  m: Meter,
): number[][] | number {
  const dsu = new DisjointSet(n, m);
  for (const [u, v] of edges) dsu.union(u, v);
  if (!list) return dsu.count;

  // 성분 목록을 내려면 뿌리마다 칸 번호를 붙이고 정점을 한 번씩 담아야 한다.
  const slot: number[] = Array.from({ length: n }, () => -1);
  m.write(n);
  const out: number[][] = [];
  for (let v = 0; v < n; v++) {
    const r = dsu.find(v);
    m.read();
    if ((slot[r] as number) === -1) {
      slot[r] = out.length;
      m.write();
      out.push([]);
      m.write();
    }
    const bucket = out[slot[r] as number] as number[];
    m.read();
    m.read();
    bucket.push(v);
    m.write();
  }
  return out;
}

/* ────────────────────────── 계수 ────────────────────────── */

/** 간선을 전부 받아 두고 성분 목록을 한 번 낸다. */
function offline(
  run: (n: number, e: Edge[], list: boolean, m: Meter) => unknown,
  n: number,
  edges: Edge[],
): number {
  const m = new Meter();
  run(n, edges, true, m);
  return m.cells;
}

/** 간선을 하나씩 받으며 **매번** 성분 수를 묻는다. */
function online(
  kind: "탐색" | "서로소 집합",
  n: number,
  edges: Edge[],
): number {
  const m = new Meter();
  if (kind === "서로소 집합") {
    const dsu = new DisjointSet(n, m);
    for (const [u, v] of edges) {
      dsu.union(u, v);
      // 성분 수는 칸을 읽지 않고 답한다 — 합병할 때마다 하나씩 줄여 둔 값이다.
    }
    return m.cells;
  }
  for (let i = 1; i <= edges.length; i++) {
    traversal(n, edges.slice(0, i), false, m);
  }
  return m.cells;
}

export const cases = {
  탐색: () => ({
    "전개 입력 배열 접근": offline(traversal, WALK_N, WALK_EDGES),
    "고리 입력 배열 접근": offline(traversal, RING_N, RING_EDGES),
    "추가로 잡는 칸": 3 * RING_N + 2 * RING_EDGES.length,
    "온라인 배열 접근": online("탐색", RING_N, RING_EDGES),
  }),
  "서로소 집합": () => ({
    "전개 입력 배열 접근": offline(disjointSet, WALK_N, WALK_EDGES),
    "고리 입력 배열 접근": offline(disjointSet, RING_N, RING_EDGES),
    "추가로 잡는 칸": 3 * RING_N,
    "온라인 배열 접근": online("서로소 집합", RING_N, RING_EDGES),
  }),
};
