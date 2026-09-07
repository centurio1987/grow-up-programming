/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/bridgesInGraph/bridgesInGraph-guide.md
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { bridgesInGraph } from "./bridgesInGraph-guide.ref.ts";

type Edge = [number, number];

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
const num = (n: number): string => (n + 0).toLocaleString("en-US");

/** 「…이」와 「…가」를 값에서 고른다. 앞 공백을 포함한다. */
const iga = (n: number): string => {
  const last = num(n)
    .replace(/[^0-9]/g, "")
    .slice(-1);
  return "013678".includes(last) ? ` ${num(n)} 이` : ` ${num(n)} 가`;
};

/** 「…이라」와 「…라」를 값에서 고른다. 앞 공백을 포함한다. */
const ira = (n: number): string => {
  const last = num(n)
    .replace(/[^0-9]/g, "")
    .slice(-1);
  return "013678".includes(last) ? ` ${num(n)} 이라` : ` ${num(n)} 라`;
};

/** 간선 목록 표기 뒤의 「을」과 「를」을 값에서 고른다. 앞 공백을 포함한다. */
const eulPair = (text: string): string => {
  const last = text.replace(/[^0-9]/g, "").slice(-1);
  return "013678".includes(last) ? ` ${text} 을` : ` ${text} 를`;
};

/** 「N 개」를 값에서 만든다. 앞 공백을 포함한다. */
const gae = (n: number): string => ` ${num(n)} 개`;

/** 「…과」와 「…와」를 값에서 고른다. 앞 공백을 포함한다. */
const gwa = (n: number): string => {
  const last = num(n)
    .replace(/[^0-9]/g, "")
    .slice(-1);
  return "013678".includes(last) ? ` ${num(n)} 과` : ` ${num(n)} 와`;
};

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

/** 배열 하나를 한 칸에 적는다. `-1` 은 「아직 없다」라 `-` 로 적는다. */
const cells = (a: number[]): string =>
  a.map((x) => (x === -1 ? "-" : String(x))).join(" ");

/** 간선 목록 하나를 한 칸에 적는다. */
const pairs = (es: Edge[]): string =>
  es.length === 0 ? "[]" : es.map(([u, v]) => `${u}−${v}`).join(" ");

/* ────────────────────────── 입력 ────────────────────────── */

/**
 * 본문 전개가 끝까지 쓰는 그래프 — 정점 여섯 · 무향 간선 여섯.
 *
 * 삼각형 `1−2−3` 에 꼬리 `3−4` 가 붙고, 그 삼각형이 간선 `0−1` 로 정점 0 에 매달리며,
 * 정점 0 에 다시 `0−5` 가 붙는다. 코드의 갈래 아홉을 이 그래프 하나가 전부 실행한다.
 */
export const WALK: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 1],
  [3, 4],
  [0, 5],
];
export const WALK_N = 6;

function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < v - 1; i++) out.push([i, i + 1]);
  return out;
}

function cycle(v: number): Edge[] {
  const out = chain(v);
  out.push([v - 1, 0]);
  return out;
}

function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

function complete(v: number): Edge[] {
  const out: Edge[] = [];
  for (let a = 0; a < v; a++) for (let b = a + 1; b < v; b++) out.push([a, b]);
  return out;
}

/** 삼각형 `units` 개를 간선 하나씩으로 이은 사슬. */
function triangleChain(units: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let k = 0; k < units; k++) {
    const b = 3 * k;
    edges.push([b, b + 1], [b + 1, b + 2], [b + 2, b]);
    if (k > 0) edges.push([b - 1, b]);
  }
  return { n: 3 * units, edges };
}

function grid(side: number): { n: number; edges: Edge[] } {
  const at = (r: number, c: number): number => r * side + c;
  const edges: Edge[] = [];
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      if (r + 1 < side) edges.push([at(r, c), at(r + 1, c)]);
      if (c + 1 < side) edges.push([at(r, c), at(r, c + 1)]);
    }
  }
  return { n: side * side, edges };
}

interface Shape {
  label: string;
  n: number;
  edges: Edge[];
}

const TRI4 = triangleChain(4);

/** 본문 여러 절이 함께 쓰는 모양 아홉. */
const SHAPES: Shape[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK },
  {
    label: "사이클 넷",
    n: 4,
    edges: cycle(4),
  },
  {
    label: "삼각형에 꼬리 하나",
    n: 4,
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
    ],
  },
  {
    label: "삼각형 둘 사이에 간선 하나",
    n: 6,
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 3],
    ],
  },
  {
    label: "떨어진 두 나무",
    n: 5,
    edges: [
      [0, 1],
      [1, 2],
      [3, 4],
    ],
  },
  {
    label: "겹친 간선 한 쌍에 꼬리",
    n: 3,
    edges: [
      [0, 1],
      [0, 1],
      [1, 2],
    ],
  },
  { label: "사슬 여덟", n: 8, edges: chain(8) },
  { label: "별 여덟", n: 8, edges: star(8) },
  { label: "완전 그래프 여덟", n: 8, edges: complete(8) },
];

/* ────────────────────────── 정의 그대로의 절차 ────────────────────────── */

/** 연결 성분 개수 — `skip` 번째 간선을 뺀 그래프에서 센다. `-1` 이면 아무것도 안 뺀다. */
function components(n: number, edges: Edge[], skip: number): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [i, edge] of edges.entries()) {
    if (i === skip) continue;
    const [u, v] = edge;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  const seen: boolean[] = Array.from({ length: n }, () => false);
  let parts = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s] === true) continue;
    parts++;
    seen[s] = true;
    const stack = [s];
    while (stack.length > 0) {
      const v = stack.pop() as number;
      for (const w of adj[v] as number[]) {
        if (seen[w] !== true) {
          seen[w] = true;
          stack.push(w);
        }
      }
    }
  }
  return parts;
}

/** 정의를 그대로 옮긴 절차 — 간선을 하나 지우고 성분 개수가 늘어나는지 센다. */
function byDeletion(n: number, edges: Edge[]): Edge[] {
  const base = components(n, edges, -1);
  const out: Edge[] = [];
  for (const [i, edge] of edges.entries()) {
    if (components(n, edges, i) <= base) continue;
    const [u, v] = edge;
    out.push(u < v ? [u, v] : [v, u]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out;
}

/** 지워 보는 방법이 읽는 이웃 자리 수 — 탐색 한 번이 `2(E − 1)`, 그것을 `E + 1` 번 한다. */
function deletionReads(edges: Edge[]): number {
  return 2 * edges.length + edges.length * 2 * (edges.length - 1);
}

/* ────────────────────────── 계측본 ────────────────────────── */

export interface Step {
  t: number;
  kind: string;
  at: string;
  label: string;
  disc: number[];
  low: number[];
  stack: number[];
  found: string;
  note: string;
}

export interface Run {
  answer: Edge[];
  steps: Step[];
  /** 간선 목록을 읽은 횟수. */
  edgeReads: number;
  /** 이웃 자리를 읽은 횟수. */
  slotReads: number;
  /** 정점을 만진 횟수 — 진입과 빼기를 합친 값. */
  touches: number;
  /** 갈래별 실행 횟수. 키가 원문자 라벨이다. */
  branch: Record<string, number>;
  /** 호출 스택이 가장 깊었을 때의 항목 수. */
  deepest: number;
  disc: number[];
  low: number[];
  /** 정점마다의 나무 부모. 뿌리는 `-1` 이다. */
  parent: number[];
  /** 나무 간선 목록 — 부모에서 자식으로 적는다. */
  treeEdges: Edge[];
  /** 되돌아가는 간선을 읽은 자리 — 같은 간선이 양쪽 끝에서 한 번씩 읽힌다. */
  backEdges: Edge[];
  /** 되돌아가는 간선 자체 — 같은 간선 번호를 하나로 센 목록. */
  backUnique: Edge[];
  /** 판정 걸음 — `[부모, 자식, low(자식), disc(부모), 다리인가]`. */
  judged: [number, number, number, number, boolean][];
}

/**
 * 정본과 **같은 절차**에 걸음 기록과 계수를 붙인 것. 매 호출 끝에서 정본과 답을 견준다 —
 * 계측을 붙이다 절차가 갈리면 이 파일이 내는 값이 전부 다른 절차의 값이 된다.
 */
export function run(n: number, edges: Edge[], record = false): Run {
  const to: number[][] = Array.from({ length: n }, () => []);
  const via: number[][] = Array.from({ length: n }, () => []);
  let edgeReads = 0;
  for (let e = 0; e < edges.length; e++) {
    const [u, v] = edges[e] as Edge;
    edgeReads++;
    (to[u] as number[]).push(v);
    (via[u] as number[]).push(e);
    (to[v] as number[]).push(u);
    (via[v] as number[]).push(e);
  }

  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const found: Edge[] = [];
  const steps: Step[] = [];
  const treeEdges: Edge[] = [];
  const backEdges: Edge[] = [];
  const backIds = new Set<number>();
  const backUnique: Edge[] = [];
  const judged: [number, number, number, number, boolean][] = [];
  const branch: Record<string, number> = {
    "①": 0,
    "②": 0,
    "③": 0,
    "④": 0,
    "⑤": 0,
    "⑥": 0,
    "⑦": 0,
    "⑧": 0,
    "⑨": 0,
  };
  branch["①"] = 1;
  branch["②"] = 1;
  let timer = 0;
  let slotReads = 0;
  let touches = 0;
  let deepest = 0;

  const stackV: number[] = [];
  const stackI: number[] = [];
  const stackE: number[] = [];
  const snap = (
    kind: string,
    at: string,
    label: string,
    note: string,
  ): void => {
    if (!record) return;
    steps.push({
      t: steps.length + 1,
      kind,
      at,
      label,
      disc: disc.slice(),
      low: low.slice(),
      stack: stackV.slice(),
      found: pairs(found.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])),
      note,
    });
  };
  snap("준비", "-", "①②", "이웃 목록과 정점마다의 칸을 만든다");

  const enter = (v: number, edge: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    stackV.push(v);
    stackI.push(0);
    stackE.push(edge);
    touches++;
    branch["③"] = (branch["③"] ?? 0) + 1;
    if (stackV.length > deepest) deepest = stackV.length;
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    enter(root, -1);
    snap(
      "진입",
      `${root}`,
      "③",
      `disc[${root}] = low[${root}] = ${disc[root]}`,
    );

    while (stackV.length > 0) {
      const v = stackV[stackV.length - 1] as number;
      const i = stackI[stackI.length - 1] as number;
      const nbrs = to[v] as number[];

      if (i < nbrs.length) {
        stackI[stackI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        const e = (via[v] as number[])[i] as number;
        slotReads++;
        if (e === (stackE[stackE.length - 1] as number)) {
          branch["④"] = (branch["④"] ?? 0) + 1;
          snap(
            "넘어감",
            `${v}−${w}`,
            "④",
            `내려올 때 쓴 간선${ira(e)} 넘어간다`,
          );
          continue;
        }
        if (disc[w] === -1) {
          parent[w] = v;
          treeEdges.push([v, w]);
          branch["⑤"] = (branch["⑤"] ?? 0) + 1;
          enter(w, e);
          snap(
            "내려감",
            `${v}−${w}`,
            "⑤③",
            `disc[${w}] = low[${w}] = ${disc[w]}`,
          );
          continue;
        }
        backEdges.push([v, w]);
        if (!backIds.has(e)) backUnique.push([v, w]);
        backIds.add(e);
        branch["⑥"] = (branch["⑥"] ?? 0) + 1;
        const before = low[v] as number;
        low[v] = Math.min(before, disc[w] as number);
        snap(
          "되돌아감",
          `${v}−${w}`,
          "⑥",
          `low[${v}] = min(${before}, ${disc[w]}) = ${low[v]}`,
        );
        continue;
      }

      stackV.pop();
      stackI.pop();
      const edge = stackE.pop() as number;
      touches++;
      branch["⑦"] = (branch["⑦"] ?? 0) + 1;
      if (edge === -1) {
        snap("복귀", `${v}`, "⑦", "뿌리라 판정할 부모가 없다");
        continue;
      }
      const p = stackV[stackV.length - 1] as number;
      const childLow = low[v] as number;
      const parentDisc = disc[p] as number;
      low[p] = Math.min(low[p] as number, childLow);
      const isBridge = childLow > parentDisc;
      judged.push([p, v, childLow, parentDisc, isBridge]);
      if (isBridge) {
        found.push(p < v ? [p, v] : [v, p]);
        branch["⑧"] = (branch["⑧"] ?? 0) + 1;
        snap(
          "판정",
          `${p}−${v}`,
          "⑦⑧",
          `low[${v}] =${iga(childLow)} disc[${p}] = ${parentDisc} 보다 커서 다리`,
        );
      } else {
        snap(
          "복귀",
          `${p}−${v}`,
          "⑦",
          `low[${v}] =${iga(childLow)} disc[${p}] = ${parentDisc} 보다 크지 않다`,
        );
      }
    }
  }

  found.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  branch["⑨"] = 1;
  snap("반환", "-", "⑨", `${eulPair(pairs(found)).trim()} 사전순으로 돌려준다`);

  const want = bridgesInGraph(n, edges);
  if (JSON.stringify(found) !== JSON.stringify(want)) {
    throw new Error(
      `계측본이 정본과 다른 답을 냈다 — ${JSON.stringify(found)} vs ${JSON.stringify(want)}`,
    );
  }
  return {
    answer: found,
    steps,
    edgeReads,
    slotReads,
    touches,
    branch,
    deepest,
    disc,
    low,
    parent,
    treeEdges,
    backEdges,
    backUnique,
    judged,
  };
}

/** `v` 의 나무 아래 정점 집합 — 나무 부모 배열에서 만든다. */
function subtree(parent: number[], v: number): number[] {
  const out = [v];
  for (let x = 0; x < parent.length; x++) {
    let at = x;
    while (at !== -1 && at !== v) at = parent[at] as number;
    if (at === v && x !== v) out.push(x);
  }
  return out.sort((a, b) => a - b);
}

/** `T(child)` 와 나머지를 잇는 간선 수 — 정점 집합을 가로지르는 간선을 센다. */
function crossing(edges: Edge[], inside: number[]): number {
  const set = new Set(inside);
  let count = 0;
  for (const [u, v] of edges) {
    if (set.has(u) !== set.has(v)) count++;
  }
  return count;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { bridgesInGraph: (n: number, edges: Edge[]) => Edge[] };

const REF = new URL("./bridgesInGraph-guide.ref.ts", import.meta.url).pathname;

const PARENT_LINE =
  /^ {8}if \(e === \(stackE\[stackE\.length - 1\] as number\)\) \{$/;
const BACK_LINE =
  /^ {10}low\[v\] = Math\.min\(low\[v\] as number, disc\[w\] as number\);$/;
const PASS_LINE =
  /^ {8}low\[p\] = Math\.min\(low\[p\] as number, low\[v\] as number\);$/;
const JUDGE_LINE =
  /^ {8}if \(\(low\[v\] as number\) > \(disc\[p\] as number\)\) \{$/;

/** 내려올 때 쓴 간선을 간선 번호가 아니라 **정점 번호**로 가리는 판. */
const byVertex = await loadMutant<Impl>(REF, {
  swap: [
    PARENT_LINE,
    "        if (w === (stackV[stackV.length - 2] as number)) {",
  ],
});

/** 판정에 **등호를 넣은** 판 — 단절점 규칙을 그대로 옮긴 모양이다. */
const withEqual = await loadMutant<Impl>(REF, {
  swap: [
    JUDGE_LINE,
    "        if ((low[v] as number) >= (disc[p] as number)) {",
  ],
});

/** 되돌아가는 간선에서 `disc[w]` 대신 **`low[w]`** 를 읽는 판. */
const readLow = await loadMutant<Impl>(REF, {
  swap: [
    BACK_LINE,
    "          low[v] = Math.min(low[v] as number, low[w] as number);",
  ],
});

/** 부모에게 자식의 `low` 대신 자식의 **진입 시각**을 전달하는 판. */
const passDisc = await loadMutant<Impl>(REF, {
  swap: [
    PASS_LINE,
    "        low[p] = Math.min(low[p] as number, disc[v] as number);",
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = byVertex.bridgesInGraph === bridgesInGraph;

/** 겹친 간선이 든 모양 — 정점 번호로 가리는 판이 여기서 갈린다. */
const PARALLEL: Shape[] = [
  {
    label: "겹친 간선 한 쌍",
    n: 2,
    edges: [
      [0, 1],
      [0, 1],
    ],
  },
  {
    label: "겹친 간선 한 쌍에 꼬리",
    n: 3,
    edges: [
      [0, 1],
      [0, 1],
      [1, 2],
    ],
  },
  {
    label: "겹친 간선 둘을 잇는 사슬",
    n: 4,
    edges: [
      [0, 1],
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 3],
    ],
  },
  { label: "전개 입력", n: WALK_N, edges: WALK },
  { label: "사이클 넷", n: 4, edges: cycle(4) },
];

if (!중화됨) {
  const breaking: [string, Impl, Shape[]][] = [
    ["정점 번호로 가리는 판", byVertex, PARALLEL],
    ["등호를 넣은 판", withEqual, SHAPES],
    ["자식의 진입 시각을 전달하는 판", passDisc, SHAPES],
  ];
  for (const [label, impl, shapes] of breaking) {
    const same = shapes.every(
      (s) =>
        JSON.stringify(bridgesInGraph(s.n, s.edges)) ===
        JSON.stringify(impl.bridgesInGraph(s.n, s.edges)),
    );
    if (same) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/**
 * 시드를 고정한 무작위 그래프 — 두 끝이 같은 간선과 겹친 간선이 저절로 섞인다.
 *
 * 모양 목록만으로는 「답이 안 갈린다」를 목록의 크기만큼밖에 못 말한다.
 */
function randomShapes(count: number, maxV: number, seed0: number): Shape[] {
  let seed = seed0 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return seed >>> 0;
  };
  const out: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const n = (next() % maxV) + 1;
    const e = next() % (2 * n + 1);
    const edges: Edge[] = [];
    for (let k = 0; k < e; k++) edges.push([next() % n, next() % n]);
    out.push({ label: `무작위 ${i}`, n, edges });
  }
  return out;
}

/** 무작위 그래프 몇 벌로 넓혀 볼 것인가. */
const ROUNDS = 500;

/* ────────────────────────── 간선 연결도 ────────────────────────── */

/**
 * 간선 연결도 — 지워서 성분 개수를 늘리는 간선 집합 중 **가장 작은 것의 크기**.
 *
 * 크기 `1` 부터 차례로 전수 검사한다. 이미 갈라진 그래프는 `0` 이다.
 */
function edgeConnectivity(n: number, edges: Edge[], cap: number): number {
  const base = components(n, edges, -1);
  if (base > 1) return 0;
  for (let k = 1; k <= Math.min(cap, edges.length); k++) {
    const pick: number[] = [];
    const search = (start: number): boolean => {
      if (pick.length === k) {
        const rest = edges.filter((_, i) => !pick.includes(i));
        return components(n, rest, -1) > base;
      }
      for (let i = start; i < edges.length; i++) {
        pick.push(i);
        if (search(i + 1)) return true;
        pick.pop();
      }
      return false;
    };
    if (search(0)) return k;
  }
  return cap + 1;
}

/** 다리를 전부 지운 뒤 남는 조각의 개수 — 간선 이중 연결 성분의 수다. */
function twoEdgeComponents(n: number, edges: Edge[]): number {
  const bridges = new Set(
    bridgesInGraph(n, edges).map(([u, v]) => `${u}−${v}`),
  );
  const rest = edges.filter(([u, v]) => {
    const key = u < v ? `${u}−${v}` : `${v}−${u}`;
    return !bridges.has(key);
  });
  return components(n, rest, -1);
}

/* ────────────────────────── 재귀 판 ────────────────────────── */

/** 같은 절차를 재귀로 적은 판. 깊이가 깊어지면 호출 스택 한계에 이른다. */
function recursive(n: number, edges: Edge[]): Edge[] {
  const to: number[][] = Array.from({ length: n }, () => []);
  const via: number[][] = Array.from({ length: n }, () => []);
  for (let e = 0; e < edges.length; e++) {
    const [u, v] = edges[e] as Edge;
    (to[u] as number[]).push(v);
    (via[u] as number[]).push(e);
    (to[v] as number[]).push(u);
    (via[v] as number[]).push(e);
  }
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const found: Edge[] = [];
  let timer = 0;
  const dfs = (v: number, parentEdge: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    const nbrs = to[v] as number[];
    for (let i = 0; i < nbrs.length; i++) {
      const w = nbrs[i] as number;
      const e = (via[v] as number[])[i] as number;
      if (e === parentEdge) continue;
      if (disc[w] === -1) {
        dfs(w, e);
        low[v] = Math.min(low[v] as number, low[w] as number);
        if ((low[w] as number) > (disc[v] as number)) {
          found.push(v < w ? [v, w] : [w, v]);
        }
      } else {
        low[v] = Math.min(low[v] as number, disc[w] as number);
      }
    }
  };
  for (let v = 0; v < n; v++) if (disc[v] === -1) dfs(v, -1);
  found.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return found;
}

/* ────────────────────────── 블록 ────────────────────────── */

const WALK_RUN = run(WALK_N, WALK, true);

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 정의를 그대로 옮긴 절차가 전개 입력에서 낸 판정. */
  "concept-delete": () => {
    const base = components(WALK_N, WALK, -1);
    const rows = WALK.map(([u, v], i) => {
      const after = components(WALK_N, WALK, i);
      return [
        `${u}−${v}`,
        num(base),
        num(after),
        after > base ? "늘었다" : "그대로다",
        after > base ? "다리" : "다리가 아니다",
      ];
    });
    const answer = byDeletion(WALK_N, WALK);
    return [
      table(
        ["지운 간선", "지우기 전 성분", "지운 뒤 성분", "변화", "판정"],
        rows,
        ["l", "r", "r", "l", "l"],
      ),
      "",
      `간선${gae(WALK.length)} 가운데 다리는${gae(answer.length)}다 — ${pairs(answer)}`,
      `└ 성분 개수를 센 횟수는${gae(WALK.length + 1)}다. 아무것도 안 지운 한 번과 간선마다 한 번`,
      `└ 이 글이 세울 절차가 낸 답도 ${pairs(bridgesInGraph(WALK_N, WALK))} 로 같다`,
    ].join("\n");
  },

  /** `concept` — 모양 아홉에서 정의와 절차가 같은 답을 내는가. */
  "concept-shapes": () => {
    const rows = SHAPES.map((s) => {
      const want = byDeletion(s.n, s.edges);
      const got = bridgesInGraph(s.n, s.edges);
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        pairs(want),
        pairs(got),
        JSON.stringify(want) === JSON.stringify(got) ? "같다" : "어긋난다",
      ];
    });
    const agree = rows.filter((r) => r[5] === "같다").length;
    return [
      table(
        ["입력", "정점", "간선", "지워 본 답", "이 절차의 답", "대조"],
        rows,
        ["l", "r", "r", "l", "l", "l"],
      ),
      "",
      `모양${gae(SHAPES.length)} 가운데 두 답이 같은 것${gae(agree)}다`,
      `└ 완전 그래프 여덟은 간선이${gae(complete(8).length)}인데 다리가 하나도 없다`,
      `└ 겹친 간선 한 쌍은 한쪽을 지워도 나머지가 남아 다리가 아니다`,
    ].join("\n");
  },

  /** `deep.build` — 간선마다 지워 보는 방법의 비용. */
  "build-brute": () => {
    const sizes = [4, 8, 16, 32, 64];
    const rows = sizes.map((v) => {
      const edges = chain(v);
      const r = run(v, edges);
      return [
        num(v),
        num(edges.length),
        num(edges.length + 1),
        num(deletionReads(edges)),
        num(r.slotReads),
        num(Math.round(deletionReads(edges) / r.slotReads)),
      ];
    });
    const V = 100_000;
    const E = 100_000;
    return [
      table(
        [
          "정점",
          "간선",
          "성분 세기 횟수",
          "지워 보는 방법의 자리 읽기",
          "한 번 순회의 자리 읽기",
          "비",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["제약 상한을 넣으면", "값"],
        [
          ["성분 세기 횟수", num(E + 1)],
          ["지워 보는 방법의 자리 읽기", num(2 * E + E * 2 * (E - 1))],
          ["한 번 순회의 자리 읽기", num(2 * E)],
          ["정점 만짐", num(2 * V)],
        ],
        ["l", "r"],
      ),
      "",
      `비 열이 간선 수와 나란히 자란다 — 사슬 정점 ${num(64)} 에서 ${num(Math.round(deletionReads(chain(64)) / run(64, chain(64)).slotReads))} 배다`,
      `└ 제약 상한 ${num(V)} · ${num(E)} 에서 자리 읽기가 ${num(2 * E + E * 2 * (E - 1))} 번이라 1 초 안에 안 끝난다`,
    ].join("\n");
  },

  /** `deep.build` — 깊이 우선 순회가 간선을 두 갈래로 가른다. */
  "build-classify": () => {
    const r = WALK_RUN;
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      num(v),
      num(r.disc[v] as number),
      (r.parent[v] as number) === -1 ? "없다" : num(r.parent[v] as number),
      `{${subtree(r.parent, v).join(", ")}}`,
    ]);
    return [
      table(["정점", "진입 시각", "나무 부모", "그 정점의 나무 아래"], rows, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      table(
        ["갈래", "간선", "개수"],
        [
          ["나무 간선", pairs(r.treeEdges), num(r.treeEdges.length)],
          ["되돌아가는 간선", pairs(r.backUnique), num(r.backUnique.length)],
        ],
        ["l", "l", "r"],
      ),
      "",
      `간선${gae(WALK.length)}가 두 갈래로 정확히 갈린다 — ${num(r.treeEdges.length)} + ${num(r.backUnique.length)} = ${num(WALK.length)}`,
      `└ 되돌아가는 간선 ${pairs(r.backUnique)} 은 정점 ${r.backUnique[0]?.[0]} 에서 조상 ${r.backUnique[0]?.[1]} 로 이른다`,
      `└ 그 간선 하나를 양쪽 끝에서 한 번씩, 모두 ${num(r.backEdges.length)} 번 읽는다`,
    ].join("\n");
  },

  /** `deep.build` — 첫 후보 「나무 간선이면 다리」를 반박한다. */
  "build-first": () => {
    const r = WALK_RUN;
    const real = new Set(
      r.answer.map(([u, v]) => `${Math.min(u, v)}−${Math.max(u, v)}`),
    );
    const rows = r.treeEdges.map(([p, c]) => {
      const key = `${Math.min(p, c)}−${Math.max(p, c)}`;
      const actual = real.has(key);
      return [
        `${p}−${c}`,
        "다리",
        actual ? "다리" : "다리가 아니다",
        actual ? "맞다" : "틀리다",
      ];
    });
    const wrong = rows.filter((x) => x[3] === "틀리다");
    return [
      table(["나무 간선", "첫 후보의 판정", "실제", "대조"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `나무 간선이${gae(r.treeEdges.length)}이고 그중 후보가 틀린 것이${gae(wrong.length)}다`,
      `└ 틀린 자리는 ${wrong.map((x) => x[0]).join(" · ")} 다`,
      `└ 첫 후보가 낸 답은 ${pairs(r.treeEdges.map(([p, c]) => (p < c ? [p, c] : [c, p]) as Edge).sort((a, b) => a[0] - b[0] || a[1] - b[1]))} 이고 실제는 ${pairs(r.answer)} 다`,
    ].join("\n");
  },

  /** `deep.build` — 나무 아래에서 밖으로 나가는 간선이 판정을 정한다. */
  "build-cross": () => {
    const r = WALK_RUN;
    const rows = r.judged.map(([p, c, childLow, parentDisc, isBridge]) => {
      const inside = subtree(r.parent, c);
      const out = crossing(WALK, inside);
      return [
        `${p}−${c}`,
        `{${inside.join(", ")}}`,
        num(out),
        num(childLow),
        num(parentDisc),
        isBridge ? "다리" : "다리가 아니다",
      ];
    });
    return [
      table(
        [
          "나무 간선",
          "자식의 나무 아래",
          "밖으로 나가는 간선",
          "low(자식)",
          "disc(부모)",
          "판정",
        ],
        rows,
        ["l", "l", "r", "r", "r", "l"],
      ),
      "",
      `밖으로 나가는 간선이${gae(1)}인 줄과 판정이 다리인 줄이 정확히 겹친다`,
      `└ 그 간선 하나는 내려올 때 쓴 나무 간선 자신이다`,
      `└ 밖으로 나가는 간선이 둘 이상이면 low(자식) 이 disc(부모) 이하로 내려간다`,
    ].join("\n");
  },

  /** `deep.build` — 판정 규칙이 정의와 같은 답을 내는가. */
  "build-check": () => {
    const rows = SHAPES.map((s) => {
      const r = run(s.n, s.edges);
      const want = byDeletion(s.n, s.edges);
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        num(r.treeEdges.length),
        num(r.backUnique.length),
        pairs(r.answer),
        JSON.stringify(r.answer) === JSON.stringify(want) ? "같다" : "어긋난다",
      ];
    });
    const agree = rows.filter((x) => x[6] === "같다").length;
    return [
      table(
        [
          "입력",
          "정점",
          "간선",
          "나무 간선",
          "되돌아가는 간선",
          "두 수로 낸 답",
          "지워 본 답과",
        ],
        rows,
        ["l", "r", "r", "r", "r", "l", "l"],
      ),
      "",
      `모양${gae(SHAPES.length)} 가운데 두 답이 같은 것${gae(agree)}다`,
      `└ 어느 모양에서도 나무 간선과 되돌아가는 간선의 합이 간선 수와 같다`,
    ].join("\n");
  },

  /** `deep.walk` — 이웃 목록에 간선 번호를 함께 담은 결과. */
  "walk-adj": () => {
    const to: string[] = [];
    for (let v = 0; v < WALK_N; v++) {
      const parts: string[] = [];
      WALK.forEach(([a, b], e) => {
        if (a === v) parts.push(`${b}(간선 ${e})`);
        if (b === v) parts.push(`${a}(간선 ${e})`);
      });
      to.push(parts.join(" "));
    }
    const rows = to.map((s, v) => [num(v), s]);
    return [
      table(["정점", "이웃(내려갈 곳과 그때 쓸 간선 번호)"], rows, ["r", "l"]),
      "",
      table(
        ["무엇", "값"],
        [
          ["disc", cells(Array.from({ length: WALK_N }, () => -1))],
          ["low", cells(Array.from({ length: WALK_N }, () => -1))],
          ["timer", "0"],
        ],
        ["l", "l"],
      ),
      "",
      `간선${gae(WALK.length)}가 자리${gae(2 * WALK.length)}로 늘어 정점${gae(WALK_N)}에 나뉘어 들어갔다`,
      `└ 자리 하나가 「어디로」와 「어느 간선으로」 두 값을 함께 나른다`,
    ].join("\n");
  },

  /** `deep.walk` — 재귀로 적은 판을 규모별로 실행한다. */
  "walk-recursion": () => {
    const sizes = [100, 1000, 10_000, 100_000];
    const rows = sizes.map((v) => {
      const edges = chain(v);
      const want = bridgesInGraph(v, edges);
      let got: string;
      try {
        got = `다리 ${num(recursive(v, edges).length)} 개`;
      } catch (err) {
        got = `${(err as Error).constructor.name} 로 실행이 멈춘다`;
      }
      return [
        num(v),
        `다리 ${num(want.length)} 개`,
        got,
        got === `다리 ${num(want.length)} 개` ? "같다" : "답이 안 나온다",
      ];
    });
    return [
      table(["사슬의 정점 수", "정본", "재귀로 적은 판", "대조"], rows, [
        "r",
        "l",
        "l",
        "l",
      ]),
      "",
      `앞의 세 줄은 두 판의 답이 한 칸도 안 갈린다`,
      `└ 한계가 정확히 몇 번째 호출인지는 자바스크립트 런타임이 정하는 값이라 여기 못 적는다`,
      `└ 다만 제약이 V 를 ${num(100_000)} 까지 열어 두므로 그 한계가 어디든 입력 범위 안이다`,
    ].join("\n");
  },

  /** `deep.walk` — 이웃 하나를 읽으면 세 갈래로 갈린다. */
  "walk-three": () => {
    const r = WALK_RUN;
    const picked = ["④", "⑤", "⑥"]
      .map((label) => r.steps.find((s) => s.label.startsWith(label)) as Step)
      .sort((a, b) => a.t - b.t)
      .map((step) => [
        `T${step.t}`,
        step.label,
        step.at,
        step.kind,
        step.note,
        cells(step.low),
      ]);
    return [
      table(
        [
          "걸음",
          "라벨",
          "읽은 간선",
          "갈래",
          "이 걸음이 한 일",
          "걸음 뒤의 low",
        ],
        picked,
        ["l", "l", "l", "l", "l", "l"],
      ),
      "",
      `세 갈래가 전개 입력에서 각각 ${num(r.branch["④"] ?? 0)} 번 · ${num(r.branch["⑤"] ?? 0)} 번 · ${num(r.branch["⑥"] ?? 0)} 번 실행된다`,
      `└ 셋을 합치면 이웃 자리 읽기 ${num(r.slotReads)} 번이고 그것이 2E = ${num(2 * WALK.length)} 와 같다`,
    ].join("\n");
  },

  /** `deep.walk` — 정점을 뺄 때마다 그 나무 간선을 판정한다. */
  "walk-judge": () => {
    const r = WALK_RUN;
    const rows = r.steps
      .filter(
        (s) => s.kind === "판정" || (s.kind === "복귀" && s.at.includes("−")),
      )
      .map((s) => {
        const [p, c] = s.at.split("−").map(Number) as [number, number];
        const row = r.judged.find((x) => x[0] === p && x[1] === c) as [
          number,
          number,
          number,
          number,
          boolean,
        ];
        return [
          `T${s.t}`,
          `${p}−${c}`,
          num(row[2]),
          num(row[3]),
          row[4] ? "참" : "거짓",
          row[4] ? "다리" : "다리가 아니다",
          cells(s.low),
        ];
      });
    return [
      table(
        [
          "걸음",
          "뺀 정점의 나무 간선",
          "low(자식)",
          "disc(부모)",
          "low(자식) > disc(부모)",
          "판정",
          "걸음 뒤의 low",
        ],
        rows,
        ["l", "l", "r", "r", "l", "l", "l"],
      ),
      "",
      `판정한 걸음${gae(rows.length)} 가운데 다리로 적은 걸음${gae(rows.filter((x) => x[5] === "다리").length)}다`,
      `└ 뿌리 0 을 빼는 T20 은 내려올 때 쓴 간선이 없어 이 표에 안 들어간다`,
      `└ 뿌리에만 다른 규칙을 쓰는 자리가 이 절차에는 없다`,
    ].join("\n");
  },

  /** `deep.walk` — 스물한 걸음을 값까지 펼친다. */
  "walk-trace": () => {
    const r = WALK_RUN;
    const rows = r.steps.map((s) => [
      `T${s.t}`,
      s.kind,
      s.at,
      s.label,
      cells(s.disc),
      cells(s.low),
      `[${s.stack.join(", ")}]`,
      s.found,
      s.note,
    ]);
    return [
      table(
        [
          "걸음",
          "갈래",
          "정점 또는 간선",
          "라벨",
          "disc",
          "low",
          "호출 스택",
          "다리",
          "이 걸음이 한 일",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l", "l", "l", "l"],
      ),
      "",
      `걸음 ${num(r.steps.length)} · 이웃 자리 읽기 ${num(r.slotReads)} · 정점 만짐 ${num(r.touches)} · 다리 ${num(r.answer.length)}`,
      `└ 판정이 참으로 끝난 걸음은 ${r.steps
        .filter((s) => s.label === "⑦⑧")
        .map((s) => `T${s.t}`)
        .join(" · ")} 다`,
      `└ disc 와 low 는 정점 0 부터 ${num(WALK_N - 1)} 까지 차례로 적은 것이다`,
    ].join("\n");
  },

  /** `deep.walk` — 아홉 갈래가 정말 전부 실행됐는가. */
  "walk-coverage": () => {
    const names: [string, string][] = [
      ["①", "이웃 목록에 간선 번호까지 담는다"],
      ["②", "정점마다의 칸을 만든다"],
      ["③", "정점에 처음 발을 들인다"],
      ["④", "타고 내려온 간선이라 그냥 넘어간다"],
      ["⑤", "아직 안 본 이웃 쪽으로 내려간다"],
      ["⑥", "나무 밖 간선을 읽고 low 를 내린다"],
      ["⑦", "이웃 자리를 다 쓴 정점을 내린다"],
      ["⑧", "그 나무 간선을 다리로 적는다"],
      ["⑨", "사전순으로 정렬해 돌려준다"],
    ];
    const other = SHAPES[3] as Shape;
    const a = WALK_RUN;
    const b = run(other.n, other.edges);
    const rows = names.map(([label, what]) => [
      label,
      what,
      num(a.branch[label] ?? 0),
      num(b.branch[label] ?? 0),
    ]);
    const zeros = rows.filter((x) => x[2] === "0" || x[3] === "0").length;
    return [
      table(["라벨", "이 갈래가 하는 일", "전개 입력", other.label], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      `두 열 어디에도 0 이 없다 — 0 인 줄이${gae(zeros)}다`,
      `└ 전개 입력의 ⑤ 는 나무 간선 수${gwa(a.treeEdges.length)} 같고 ③ 은 정점 수${gwa(WALK_N)} 같다`,
      `└ ⑧ 이${gwa(a.branch["⑧"] ?? 0)} ${num(b.branch["⑧"] ?? 0)} 로 갈리는 것이 두 그래프의 다리 수 차이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 내려올 때 쓴 간선을 정점 번호로 가린 판. */
  "pause-parallel": () => {
    const rows = PARALLEL.map((s) => {
      const want = bridgesInGraph(s.n, s.edges);
      const got = byVertex.bridgesInGraph(s.n, s.edges);
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        num(run(s.n, s.edges).slotReads),
        pairs(want),
        pairs(got),
        JSON.stringify(want) === JSON.stringify(got) ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((x) => x[6] === "어긋난다").length;
    return [
      table(
        [
          "입력",
          "정점",
          "간선",
          "그 줄을 지나간 횟수",
          "정본",
          "정점 번호로 가린 판",
          "대조",
        ],
        rows,
        ["l", "r", "r", "r", "l", "l", "l"],
      ),
      "",
      `입력${gae(PARALLEL.length)} 가운데 답이 갈린 것${gae(off)}다`,
      `└ 다섯 입력 모두 그 줄을 여러 번 지나간다 — 답이 같은 것은 안 지나가서가 아니다`,
      `└ 겹친 간선이 없는 두 입력에서는 그 줄이 같은 자리를 가려 답이 그대로다`,
      `└ 갈리는 자리는 같은 두 정점을 잇는 간선이 둘 이상인 그래프뿐이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 판정에 등호를 넣은 판. */
  "pause-equal": () => {
    const rows = SHAPES.map((s) => {
      const want = bridgesInGraph(s.n, s.edges);
      const got = withEqual.bridgesInGraph(s.n, s.edges);
      return [
        s.label,
        num(run(s.n, s.edges).judged.length),
        pairs(want),
        pairs(got),
        num(got.length - want.length),
        JSON.stringify(want) === JSON.stringify(got) ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((x) => x[5] === "어긋난다").length;
    const r = WALK_RUN;
    return [
      table(
        [
          "입력",
          "그 줄을 지나간 횟수",
          "정본",
          "등호를 넣은 판",
          "늘어난 다리 수",
          "대조",
        ],
        rows,
        ["l", "r", "l", "l", "r", "l"],
      ),
      "",
      table(
        ["전개 입력의 나무 간선", "low(자식)", "disc(부모)", "> 로", ">= 로"],
        r.judged.map(([p, c, childLow, parentDisc]) => [
          `${p}−${c}`,
          num(childLow),
          num(parentDisc),
          childLow > parentDisc ? "참" : "거짓",
          childLow >= parentDisc ? "참" : "거짓",
        ]),
        ["l", "r", "r", "l", "l"],
      ),
      "",
      `모양${gae(SHAPES.length)} 가운데 답이 갈린 것${gae(off)}다`,
      `└ 아홉 입력 모두 그 줄을 나무 간선 수만큼 지나간다. 두 값이 같아지는 자리에서만 판정이 갈린다`,
      `└ 사이클 넷은 다리가 없어야 하는데 등호를 넣은 판은${eulPair(pairs(withEqual.bridgesInGraph(4, cycle(4))))} 낸다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 되돌아가는 간선에서 자식의 `low` 를 읽는 판. */
  "pause-lowread": () => {
    const shapes = [...SHAPES, { label: "격자 3×3", ...grid(3) }];
    const rows = shapes.map((s) => {
      const want = bridgesInGraph(s.n, s.edges);
      const got = readLow.bridgesInGraph(s.n, s.edges);
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        num(run(s.n, s.edges).branch["⑥"] ?? 0),
        pairs(want),
        pairs(got),
        JSON.stringify(want) === JSON.stringify(got) ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((x) => x[6] === "어긋난다").length;
    const never = rows.filter((x) => x[3] === "0").length;
    const mixed = randomShapes(ROUNDS, 12, 20260907).filter(
      (s) =>
        JSON.stringify(bridgesInGraph(s.n, s.edges)) !==
        JSON.stringify(readLow.bridgesInGraph(s.n, s.edges)),
    ).length;
    return [
      table(
        [
          "입력",
          "정점",
          "간선",
          "그 줄을 지나간 횟수",
          "정본",
          "low 를 읽는 판",
          "대조",
        ],
        rows,
        ["l", "r", "r", "r", "l", "l", "l"],
      ),
      "",
      `모양${gae(shapes.length)}와 무작위 그래프${gae(ROUNDS)} 가운데 답이 갈린 것${gae(off + mixed)}다`,
      `└ 그 줄까지 가지도 않은 입력이${gae(never)}다 — 되돌아가는 간선이 하나도 없는 모양이다`,
      `└ low[w] 는 disc[w] 이하라 이 판의 low 는 정본보다 작거나 같다`,
      `└ 값이 작아지면 판정이 거짓 쪽으로만 바뀌는데, 다리인 나무 간선의 나무 아래에서는 값이 disc(부모) 아래로 못 내려간다`,
    ].join("\n");
  },

  /** `related` — 간선 연결도를 전수로 재고 다리 유무와 견준다. */
  "related-lambda": () => {
    const shapes: Shape[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK },
      { label: "사이클 넷", n: 4, edges: cycle(4) },
      { label: "완전 그래프 넷", n: 4, edges: complete(4) },
      { label: "별 넷", n: 4, edges: star(4) },
      {
        label: "겹친 간선 한 쌍",
        n: 2,
        edges: [[0, 1] as Edge, [0, 1] as Edge],
      },
      { label: "격자 3×3", ...grid(3) },
      { label: "떨어진 두 나무", n: 5, edges: SHAPES[4]?.edges as Edge[] },
    ];
    const rows = shapes.map((s) => {
      const bridges = bridgesInGraph(s.n, s.edges);
      const parts = components(s.n, s.edges, -1);
      const lam = edgeConnectivity(s.n, s.edges, 4);
      const verdict =
        parts > 1
          ? "한 덩어리가 아니라 안 본다"
          : bridges.length > 0 === (lam === 1)
            ? "성립한다"
            : "성립하지 않는다";
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        num(parts),
        num(bridges.length),
        lam > 4 ? "5 이상" : num(lam),
        verdict,
      ];
    });
    const ok = rows.filter((x) => x[6] === "성립한다").length;
    const broken = rows.filter((x) => x[6] === "성립하지 않는다").length;
    return [
      table(
        [
          "입력",
          "정점",
          "간선",
          "성분",
          "다리 수",
          "간선 연결도",
          "한 덩어리라면 다리가 있다 ⟺ 연결도 1",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `한 덩어리인 모양${gae(ok + broken)} 가운데 두 진술이 어긋난 자리${gae(broken)}다`,
      `└ 연결도는 지워서 갈라놓는 간선 집합 중 가장 작은 것의 크기를 전수로 잰 값이다`,
      `└ 떨어진 두 나무는 이미 갈라져 있어 연결도가 0 이고, 그 정의 밖이라 대조에서 뺀다`,
    ].join("\n");
  },

  /** `deep.math` — `low` 정의의 세 항을 전개 입력에서 검산한다. */
  "math-lowdef": () => {
    const r = WALK_RUN;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const own = r.disc[v] as number;
      const back = r.backEdges
        .filter(([a]) => a === v)
        .map(([, b]) => r.disc[b] as number);
      const kids = r.treeEdges
        .filter(([p]) => p === v)
        .map(([, c]) => r.low[c] as number);
      const all = [own, ...back, ...kids];
      const min = Math.min(...all);
      return [
        num(v),
        num(own),
        back.length === 0 ? "없다" : back.map(num).join(", "),
        kids.length === 0 ? "없다" : kids.map(num).join(", "),
        num(min),
        num(r.low[v] as number),
        min === r.low[v] ? "같다" : "어긋난다",
      ];
    });
    const agree = rows.filter((x) => x[6] === "같다").length;
    return [
      table(
        [
          "정점",
          "첫 항 disc(v)",
          "둘째 항 disc(x)",
          "셋째 항 low(c)",
          "셋의 최솟값",
          "실행이 낸 low(v)",
          "대조",
        ],
        rows,
        ["r", "r", "l", "l", "r", "r", "l"],
      ),
      "",
      `정점${gae(WALK_N)} 가운데 두 열이 같은 줄${gae(agree)}다`,
      `└ 둘째 항이 쓰는 것은 disc(x) 다. low(x) 가 아니다`,
      `└ 정점 1 의 둘째 항 3 은 자손의 진입 시각이라 최솟값을 못 바꾼다`,
      `└ 정점 4 와 5 는 후보가 첫 항 하나뿐이라 low 가 disc 에 그대로 남는다`,
    ].join("\n");
  },

  /** `deep.math` — 다리 개수의 상한과 항등식. */
  "math-bound": () => {
    const shapes: Shape[] = [
      ...SHAPES.slice(0, 6),
      { label: "사슬 예순넷", n: 64, edges: chain(64) },
      { label: "사이클 예순넷", n: 64, edges: cycle(64) },
      { label: "삼각형 넷을 이은 그래프", n: TRI4.n, edges: TRI4.edges },
      { label: "격자 4×4", ...grid(4) },
    ];
    const rows = shapes.map((s) => {
      const bridges = bridgesInGraph(s.n, s.edges).length;
      const parts = components(s.n, s.edges, -1);
      const blocks = twoEdgeComponents(s.n, s.edges);
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        num(bridges),
        num(parts),
        num(blocks),
        num(blocks - parts),
        bridges === blocks - parts ? "같다" : "어긋난다",
        num(s.n - parts),
        bridges <= s.n - parts ? "지킨다" : "넘는다",
      ];
    });
    const ident = rows.filter((x) => x[7] === "같다").length;
    const keep = rows.filter((x) => x[9] === "지킨다").length;
    const tight = rows.filter((x) => x[3] === x[8]);
    return [
      table(
        [
          "입력",
          "정점 V",
          "간선 E",
          "다리 B",
          "성분 k",
          "조각 수 C",
          "C − k",
          "B 와",
          "상한 V − k",
          "상한을",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "l", "r", "l"],
      ),
      "",
      `항등식이 성립한 줄이${gae(ident)}이고 상한을 지킨 줄이${gae(keep)}다`,
      `└ 조각 수 C 는 다리를 전부 지운 뒤 남는 덩어리의 개수다`,
      `└ 상한과 같은 값이 나온 모양은 ${tight.map((x) => x[0]).join(" · ")} 다 — 간선이 하나도 사이클에 안 든 모양이다`,
    ].join("\n");
  },

  /** `deep.math` — 제약 규모를 넣은 계수. */
  "math-scale": () => {
    const V = 100_000;
    const E = 100_000;
    const B = V - 1;
    const sizes = [1000, 10_000, 100_000];
    const rows = sizes.map((v) => {
      const edges = chain(v);
      const r = run(v, edges);
      return [
        num(v),
        num(edges.length),
        num(r.slotReads),
        num(2 * edges.length),
        num(r.touches),
        num(2 * v),
        num(r.answer.length),
        num(v - 1),
      ];
    });
    return [
      table(
        [
          "정점 V",
          "간선 E",
          "자리 읽기",
          "2E",
          "정점 만짐",
          "2V",
          "다리 B",
          "V − 1",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["제약 상한에서", "닫힌 형태", "값"],
        [
          ["간선 목록 읽기", "E", num(E)],
          ["이웃 자리 만들기", "2E", num(2 * E)],
          ["배열 만들기", "2V", num(2 * V)],
          ["이웃 자리 읽기", "2E", num(2 * E)],
          ["정점 만짐", "2V", num(2 * V)],
          ["정렬 견주기의 상한", "B⌈log₂ B⌉", num(B * Math.ceil(Math.log2(B)))],
          [
            "여섯을 합친 총식",
            "5E + 4V + B⌈log₂ B⌉",
            num(5 * E + 4 * V + B * Math.ceil(Math.log2(B))),
          ],
          ["다리 개수의 상한", "V − 1", num(B)],
        ],
        ["l", "l", "r"],
      ),
      "",
      `위 표의 세 줄에서 실측 열과 그 오른쪽 식이 한 칸도 안 갈린다`,
      `└ 사슬은 간선이 하나도 사이클에 안 들어 다리가 V − 1 로 상한을 그대로 달성한다`,
      `└ 정렬 항만 B 를 타고, 그 위의 다섯 줄은 모양과 무관한 등식이다`,
      `└ 마지막 줄은 합에 안 들어가는 값이다 — 다리 개수 자체의 상한이다`,
    ].join("\n");
  },

  /** `invariant` — 다리로 적히는 순간 건너가는 간선이 하나인가. */
  "invariant-cross": () => {
    const shapes = [
      ...SHAPES,
      { label: "격자 3×3", ...grid(3) },
      { label: "삼각형 넷을 이은 그래프", n: TRI4.n, edges: TRI4.edges },
    ];
    let judgedAll = 0;
    let broken = 0;
    const rows = shapes.map((s) => {
      const r = run(s.n, s.edges);
      let bad = 0;
      for (const [, c, , , isBridge] of r.judged) {
        const out = crossing(s.edges, subtree(r.parent, c));
        if ((out === 1) !== isBridge) bad++;
      }
      judgedAll += r.judged.length;
      broken += bad;
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        num(r.judged.length),
        num(r.judged.filter((x) => x[4]).length),
        num(bad),
      ];
    });
    return [
      table(
        [
          "입력",
          "정점",
          "간선",
          "판정한 걸음",
          "그중 다리라 적은 걸음",
          "어긋난 걸음",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `판정한 걸음${gae(judgedAll)}를 걸음마다 견줘 어긋난 걸음${gae(broken)}다`,
      `└ 실행이 걸음마다 「자식의 나무 아래와 나머지를 잇는 간선이 몇 개인가」를 따로 세서 판정과 견준 값이다`,
      `└ 어긋난 걸음이 있으면 마지막 열이 0 이 아니다`,
    ].join("\n");
  },

  /** `invariant` — 경계에 놓인 입력. */
  "invariant-edges": () => {
    const shapes: Shape[] = [
      { label: "정점 하나, 간선 없음", n: 1, edges: [] },
      { label: "정점 넷, 간선 없음", n: 4, edges: [] },
      { label: "간선 하나", n: 2, edges: [[0, 1]] },
      {
        label: "두 끝이 같은 간선만",
        n: 3,
        edges: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
      },
      {
        label: "두 끝이 같은 간선이 섞였다",
        n: 3,
        edges: [
          [0, 0],
          [0, 1],
          [1, 2],
        ],
      },
      {
        label: "겹친 간선 한 쌍",
        n: 2,
        edges: [
          [0, 1],
          [0, 1],
        ],
      },
      { label: "떨어진 두 나무", n: 5, edges: SHAPES[4]?.edges as Edge[] },
      { label: "사이클 여덟", n: 8, edges: cycle(8) },
    ];
    const rows = shapes.map((s) => {
      const r = run(s.n, s.edges);
      const want = byDeletion(s.n, s.edges);
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        pairs(r.answer),
        num(r.slotReads),
        num(2 * s.edges.length),
        num(r.touches),
        num(2 * s.n),
        num(r.deepest),
        JSON.stringify(r.answer) === JSON.stringify(want) ? "같다" : "어긋난다",
      ];
    });
    const agree = rows.filter((x) => x[9] === "같다").length;
    return [
      table(
        [
          "입력",
          "정점",
          "간선",
          "다리",
          "자리 읽기",
          "2E",
          "정점 만짐",
          "2V",
          "호출 스택 최대",
          "지워 본 답과",
        ],
        rows,
        ["l", "r", "r", "l", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `모양${gae(shapes.length)} 가운데 정의와 답이 같은 줄${gae(agree)}다`,
      `└ 두 끝이 같은 간선도 이웃 자리 둘을 차지해 자리 읽기가 2E 를 그대로 지킨다`,
      `└ 간선이 하나도 없으면 정점마다 들어갔다 곧바로 빠져 호출 스택이 한 칸을 안 넘는다`,
    ].join("\n");
  },

  /** `invariant` — 자식의 `low` 대신 진입 시각을 전달하는 판. */
  "mutant-pass": () => {
    const shapes = [...SHAPES, { label: "격자 3×3", ...grid(3) }];
    const rows = shapes.map((s) => {
      const want = bridgesInGraph(s.n, s.edges);
      const got = passDisc.bridgesInGraph(s.n, s.edges);
      return [
        s.label,
        num(run(s.n, s.edges).judged.length),
        pairs(want),
        pairs(got),
        num(got.length - want.length),
        JSON.stringify(want) === JSON.stringify(got) ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((x) => x[5] === "어긋난다").length;
    const cyc = run(4, cycle(4));
    return [
      table(
        [
          "입력",
          "그 줄을 지나간 횟수",
          "정본",
          "진입 시각을 전달하는 판",
          "늘어난 다리 수",
          "대조",
        ],
        rows,
        ["l", "r", "l", "l", "r", "l"],
      ),
      "",
      table(
        [
          "사이클 넷의 나무 간선",
          "정본의 low(자식)",
          "disc(부모)",
          "정본의 판정",
        ],
        cyc.judged.map(([p, c, childLow, parentDisc, isBridge]) => [
          `${p}−${c}`,
          num(childLow),
          num(parentDisc),
          isBridge ? "다리" : "다리가 아니다",
        ]),
        ["l", "r", "r", "l"],
      ),
      "",
      `모양${gae(shapes.length)} 가운데 답이 갈린 것${gae(off)}다`,
      `└ 열 입력 모두 그 줄을 나무 간선 수만큼 지나간다 — 답이 같은 넷도 지나가고서 같다`,
      `└ 정본은 되돌아가는 간선 하나가 낸 0 이 자식 사슬을 거슬러 올라와 세 판정을 모두 거짓으로 만든다`,
      `└ 전달을 바꾸면 그 0 이 부모에게 안 가고, 판정이 참으로 뒤집혀 사이클 넷에서 없던 다리가${gae(passDisc.bridgesInGraph(4, cycle(4)).length)} 생긴다`,
    ].join("\n");
  },

  /** `perf.derive` — 전개 입력의 계수. */
  "perf-count": () => {
    const r = WALK_RUN;
    return [
      table(
        ["무엇", "값", "닫힌 형태"],
        [
          ["간선 목록 읽기", num(r.edgeReads), "E"],
          ["이웃 자리 읽기", num(r.slotReads), "2E"],
          ["정점 만짐", num(r.touches), "2V"],
          ["나무 간선", num(r.treeEdges.length), "케이스를 탄다"],
          ["되돌아가는 간선", num(r.backEdges.length), "케이스를 탄다"],
          ["판정한 걸음", num(r.judged.length), "나무 간선 수와 같다"],
          ["다리", num(r.answer.length), "케이스를 탄다"],
          ["호출 스택 최대", num(r.deepest), "케이스를 탄다"],
        ],
        ["l", "r", "l"],
      ),
      "",
      `전개 입력 정점 ${num(WALK_N)} · 간선 ${num(WALK.length)} 에서 잰 값이다`,
      `└ 자리 읽기 ${num(r.slotReads)} 가 2E = ${num(2 * WALK.length)} 와 같고 정점 만짐 ${num(r.touches)} 가 2V = ${num(2 * WALK_N)} 와 같다`,
      `└ 판정한 걸음${gae(r.judged.length)}는 나무 간선 수와 같다 — 나무 간선마다 정확히 한 번 판정한다`,
    ].join("\n");
  },

  /** `perf.derive` — 모양을 바꿔도 두 등식이 그대로인가. */
  "perf-growth": () => {
    const shapes: Shape[] = [
      { label: "사슬 천스물넷", n: 1024, edges: chain(1024) },
      { label: "사이클 천스물넷", n: 1024, edges: cycle(1024) },
      { label: "별 천스물넷", n: 1024, edges: star(1024) },
      { label: "격자 32×32", ...grid(32) },
      { label: "완전 그래프 예순넷", n: 64, edges: complete(64) },
      {
        label: "삼각형 삼백마흔하나를 이은 그래프",
        n: triangleChain(341).n,
        edges: triangleChain(341).edges,
      },
    ];
    const rows = shapes.map((s) => {
      const r = run(s.n, s.edges);
      return [
        s.label,
        num(s.n),
        num(s.edges.length),
        num(r.slotReads),
        num(2 * s.edges.length),
        num(r.touches),
        num(2 * s.n),
        num(r.deepest),
        num(r.answer.length),
      ];
    });
    return [
      table(
        [
          "입력",
          "정점 V",
          "간선 E",
          "자리 읽기",
          "2E",
          "정점 만짐",
          "2V",
          "호출 스택 최대",
          "다리",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `모양${gae(shapes.length)} 가운데 두 등식이 어긋난 줄${gae(0)}다`,
      `└ 갈리는 것은 호출 스택 최대와 다리 개수 둘뿐이다`,
      `└ 별 천스물넷은 호출 스택이 ${num(run(1024, star(1024)).deepest)} 를 안 넘는다`,
    ].join("\n");
  },

  /** `perf.worst` — 정점 수를 고정하고 모양만 바꾼다. */
  "worst-shape": () => {
    const V = 512;
    const tri = triangleChain(170);
    const shapes: Shape[] = [
      { label: "간선 없음", n: V, edges: [] },
      { label: "사슬", n: V, edges: chain(V) },
      {
        label: "사슬을 간선 목록에 거꾸로 적은 것",
        n: V,
        edges: chain(V).slice().reverse(),
      },
      { label: "사이클", n: V, edges: cycle(V) },
      { label: "별", n: V, edges: star(V) },
      {
        label: "삼각형 백일흔 개 사슬에 홀로 있는 정점 둘",
        n: V,
        edges: tri.edges,
      },
      { label: "완전 그래프", n: V, edges: complete(V) },
    ];
    const rows = shapes.map((s) => {
      const r = run(s.n, s.edges);
      return [
        s.label,
        num(s.edges.length),
        num(r.slotReads),
        num(r.touches),
        num(r.deepest),
        num(r.answer.length),
      ];
    });
    const touches = new Set(rows.map((x) => x[3]));
    return [
      table(
        ["모양", "간선 E", "자리 읽기", "정점 만짐", "호출 스택 최대", "다리"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `정점 수를 ${num(V)} 로 못 박은 모양${gae(shapes.length)}다. 정점 만짐이 서로 다른 값을 낸 가짓수${gae(touches.size)}다`,
      `└ 간선 수가 0 에서 ${num(complete(V).length)} 까지 갈리는데 정점 만짐은 전부 ${num(2 * V)} 다`,
      `└ 다리가 가장 많은 모양은 사슬이고 ${num(V - 1)} 개다. 사이클과 완전 그래프는 0 이다`,
    ].join("\n");
  },

  /** `perf.worst` — 사슬을 규모마다 재고 재귀 판과 견준다. */
  "worst-chain": () => {
    const sizes = [64, 256, 1024, 4096];
    const rows = sizes.map((v, at) => {
      const r = run(v, chain(v));
      const prev =
        at === 0
          ? null
          : run(sizes[at - 1] as number, chain(sizes[at - 1] as number));
      const total = r.slotReads + r.touches;
      return [
        num(v),
        num(total),
        prev === null
          ? "-"
          : (total / (prev.slotReads + prev.touches)).toFixed(2),
        num(r.deepest),
        num(r.answer.length),
        num(4 * v - 2),
      ];
    });
    return [
      table(
        [
          "정점 V",
          "자리 읽기 + 정점 만짐",
          "직전 줄의 몇 배",
          "호출 스택 최대",
          "다리",
          "4V − 2",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `네 줄 모두 둘째 열이 4V − 2 와 같고 호출 스택 최대가 V 와 같다`,
      `└ 다리 개수도 네 줄 모두 V − 1 이라 상한을 그대로 달성한다`,
      `└ 정점 수를 네 배로 늘리면 둘째 열이 네 배 언저리가 된다`,
    ].join("\n");
  },
};
