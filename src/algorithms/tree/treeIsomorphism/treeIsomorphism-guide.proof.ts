/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.md
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  centers,
  type Edge,
  neighbors,
  shapeCode,
  treeIsomorphism,
} from "./treeIsomorphism-guide.ref.ts";

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
const num = (n: number): string => n.toLocaleString("en-US");

/** 「 N 개」를 값에서 만든다. 앞 공백을 포함하고 뒤 어미는 안 붙인다. */
const gae = (n: number): string => ` ${num(n)} 개`;
/** 「 N 줄」을 값에서 만든다. 뒤에는 언제나 「이다」가 붙는다. */
const jul = (n: number): string => ` ${num(n)} 줄`;
/** 「 N 번」을 값에서 만든다. 뒤에는 언제나 「이다」가 붙는다. */
const beon = (n: number): string => ` ${num(n)} 번`;

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

/** 간선 목록 하나를 한 칸에 적는다. */
const pairs = (es: Edge[]): string =>
  es.length === 0 ? "[]" : es.map(([u, v]) => `${u}-${v}`).join(" ");

/** 수 배열 하나를 한 칸에 적는다. */
const cells = (a: number[]): string => a.join(" ");

/* ────────────────────────── 입력 ────────────────────────── */

/** 본문 전개가 끝까지 쓰는 트리 둘. 정점 여덟 · 간선 일곱씩이고 서로 동형이다. */
export const WALK_N = 8;
export const TREE_A: Edge[] = [
  [0, 1],
  [0, 6],
  [1, 2],
  [1, 7],
  [2, 3],
  [3, 4],
  [3, 5],
];
export const TREE_B: Edge[] = [
  [0, 1],
  [0, 6],
  [2, 6],
  [3, 4],
  [3, 5],
  [3, 7],
  [6, 7],
];

function chain(n: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < n - 1; i++) out.push([i, i + 1]);
  return out;
}
function star(n: number, hub: number): Edge[] {
  const out: Edge[] = [];
  for (let v = 0; v < n; v++) if (v !== hub) out.push([hub, v]);
  return out;
}
function binary(n: number): Edge[] {
  const out: Edge[] = [];
  for (let v = 1; v < n; v++) out.push([(v - 1) >> 1, v]);
  return out;
}
/** 등뼈 `s` 개에 남은 정점을 잎으로 고르게 매단다. `s`=1 이면 별, `s`=`n` 이면 사슬이다. */
function caterpillar(n: number, s: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < s - 1; i++) out.push([i, i + 1]);
  for (let i = s; i < n; i++) out.push([(i - s) % s, i]);
  return out;
}

function makeRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s |= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s |= 0;
    return s >>> 0;
  };
}
/** 정점 `v` 의 부모를 `0 … v−1` 에서 고른다. 시드가 같으면 언제나 같은 트리다. */
function randomTree(n: number, seed: number): Edge[] {
  const next = makeRng(seed);
  const out: Edge[] = [];
  for (let v = 1; v < n; v++) out.push([next() % v, v]);
  return out;
}
/** 정점 번호만 섞는다. 모양은 그대로다. */
function relabel(n: number, edges: Edge[], seed: number): Edge[] {
  const next = makeRng(seed);
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = next() % (i + 1);
    const t = p[i] as number;
    p[i] = p[j] as number;
    p[j] = t;
  }
  const out = edges.map(([u, v]) => {
    const a = p[u] as number;
    const b = p[v] as number;
    return (a < b ? [a, b] : [b, a]) as Edge;
  });
  out.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return out;
}

/* ────────────────────────── 라벨 붙은 트리 전수 ────────────────────────── */

/** 프뤼퍼 수열 하나를 트리로 되돌린다. 길이 `n−2` 수열과 정점 `n` 짜리 트리가 일대일이다. */
function pruferToTree(n: number, seq: number[]): Edge[] {
  if (n === 1) return [];
  if (n === 2) return [[0, 1]];
  const deg: number[] = Array.from({ length: n }, () => 1);
  for (const x of seq) deg[x] = (deg[x] as number) + 1;
  const out: Edge[] = [];
  for (const x of seq) {
    for (let v = 0; v < n; v++) {
      if (deg[v] === 1) {
        out.push([Math.min(v, x), Math.max(v, x)]);
        deg[v] = (deg[v] as number) - 1;
        deg[x] = (deg[x] as number) - 1;
        break;
      }
    }
  }
  const rest: number[] = [];
  for (let v = 0; v < n; v++) if (deg[v] === 1) rest.push(v);
  out.push([rest[0] as number, rest[1] as number]);
  return out;
}

function* allTrees(n: number): Generator<Edge[]> {
  if (n <= 2) {
    yield pruferToTree(n, []);
    return;
  }
  const len = n - 2;
  const seq: number[] = Array.from({ length: len }, () => 0);
  const total = n ** len;
  for (let k = 0; k < total; k++) {
    let x = k;
    for (let i = 0; i < len; i++) {
      seq[i] = x % n;
      x = Math.floor(x / n);
    }
    yield pruferToTree(n, seq);
  }
}

/** 정본과 같은 표를 계속 쓰면 번호가 트리를 가로질러 뜻을 가진다. */
function canonKey(
  n: number,
  edges: Edge[],
  shared: Map<string, number>,
): string {
  const link = neighbors(n, edges);
  const roots = centers(n, link);
  const codes = roots
    .map((r) => shapeCode(n, link, r, shared))
    .sort((a, b) => a - b);
  return `${roots.length}:${codes.join("|")}`;
}

/** 정점 대응을 되추적으로 찾는다 — 정의를 그대로 옮긴 절차다. */
function byPermutation(
  n: number,
  e1: Edge[],
  e2: Edge[],
  counter?: { calls: number },
): boolean {
  const link1 = neighbors(n, e1);
  const link2 = neighbors(n, e2);
  const has = new Set<number>();
  for (const [u, v] of e2) {
    has.add(u * n + v);
    has.add(v * n + u);
  }
  const map: number[] = Array.from({ length: n }, () => -1);
  const used: boolean[] = Array.from({ length: n }, () => false);
  const place = (i: number): boolean => {
    if (counter !== undefined) counter.calls++;
    if (i === n) return true;
    for (let j = 0; j < n; j++) {
      if (used[j] === true) continue;
      if ((link1[i] as number[]).length !== (link2[j] as number[]).length)
        continue;
      let ok = true;
      for (const w of link1[i] as number[]) {
        if (w < i && !has.has(j * n + (map[w] as number))) ok = false;
      }
      if (ok) {
        for (const w of link2[j] as number[]) {
          const back = map.indexOf(w);
          if (back !== -1 && back < i && !(link1[i] as number[]).includes(back))
            ok = false;
        }
      }
      if (!ok) continue;
      map[i] = j;
      used[j] = true;
      if (place(i + 1)) return true;
      used[j] = false;
      map[i] = -1;
    }
    return false;
  };
  return place(0);
}

/* ────────────────────────── 계측본 ────────────────────────── */

interface Metered {
  answer: boolean;
  edgeReads: number;
  slotReads: number;
  peeled: number;
  visits: number;
  compares: number;
  lookups: number;
  keyChars: number;
  tableSize: number;
  rootedRuns: number;
  centers1: number;
  centers2: number;
}

/** 정본과 **같은 걸음**을 밟으면서 계수만 센다. 답은 매번 정본과 대조한다. */
function meter(n: number, e1: Edge[], e2: Edge[]): Metered {
  const m: Metered = {
    answer: false,
    edgeReads: 0,
    slotReads: 0,
    peeled: 0,
    visits: 0,
    compares: 0,
    lookups: 0,
    keyChars: 0,
    tableSize: 0,
    rootedRuns: 0,
    centers1: 0,
    centers2: 0,
  };
  const link = (edges: Edge[]): number[][] => {
    const out: number[][] = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      m.edgeReads++;
      (out[u] as number[]).push(v);
      (out[v] as number[]).push(u);
    }
    return out;
  };
  const roots = (adj: number[][]): number[] => {
    if (n === 1) return [0];
    const left = adj.map((row) => row.length);
    let layer: number[] = [];
    for (let v = 0; v < n; v++) if (left[v] === 1) layer.push(v);
    let alive = n;
    while (alive > 2) {
      const next: number[] = [];
      for (const v of layer) {
        left[v] = 0;
        alive--;
        m.peeled++;
        for (const w of adj[v] as number[]) {
          m.slotReads++;
          if ((left[w] as number) > 0) {
            left[w] = (left[w] as number) - 1;
            if (left[w] === 1) next.push(w);
          }
        }
      }
      layer = next;
    }
    return layer;
  };
  const code = (
    adj: number[][],
    root: number,
    shared: Map<string, number>,
  ): number => {
    m.rootedRuns++;
    const parent: number[] = Array.from({ length: n }, () => -1);
    const order: number[] = [root];
    for (let i = 0; i < order.length; i++) {
      const v = order[i] as number;
      m.visits++;
      for (const w of adj[v] as number[]) {
        m.slotReads++;
        if (w !== parent[v]) {
          parent[w] = v;
          order.push(w);
        }
      }
    }
    const id: number[] = Array.from({ length: n }, () => -1);
    for (let i = order.length - 1; i >= 0; i--) {
      const v = order[i] as number;
      const kids: number[] = [];
      for (const w of adj[v] as number[]) {
        m.slotReads++;
        if (w !== parent[v]) kids.push(id[w] as number);
      }
      kids.sort((a, b) => {
        m.compares++;
        return a - b;
      });
      const key = kids.join(",");
      m.lookups++;
      m.keyChars += key.length;
      let got = shared.get(key);
      if (got === undefined) {
        got = shared.size;
        shared.set(key, got);
      }
      id[v] = got;
    }
    return id[root] as number;
  };

  const link1 = link(e1);
  const link2 = link(e2);
  const root1 = roots(link1);
  const root2 = roots(link2);
  m.centers1 = root1.length;
  m.centers2 = root2.length;
  const shared = new Map<string, number>();
  if (root1.length === root2.length) {
    const code2 = root2.map((r) => code(link2, r, shared));
    for (const r of root1) {
      if (code2.includes(code(link1, r, shared))) {
        m.answer = true;
        break;
      }
    }
  }
  m.tableSize = shared.size;
  const want = treeIsomorphism(n, e1, e2);
  if (m.answer !== want) {
    throw new Error(`계측본이 정본과 다른 답을 냈다 — ${m.answer} 대 ${want}`);
  }
  return m;
}

/* ────────────────────────── 전개 걸음 ────────────────────────── */

export interface WalkStep {
  t: string;
  branch: string;
  labels: string;
  tree: string;
  root: string;
  gave: string;
  tableSize: number;
  code2: string;
  did: string;
  /** 이 걸음에서 그릴 트리와 뿌리, 그리고 그 시점의 번호. */
  draw: { tree: string; root: number; code: number[]; done: number[] };
}

/** 전개 입력을 정본과 같은 차례로 밟으며 걸음을 남긴다. */
function walkLog(): {
  steps: WalkStep[];
  table: [string, number][];
  answer: boolean;
  numbered: number;
} {
  const n = WALK_N;
  const steps: WalkStep[] = [];
  let numbered = 0;
  const push = (
    branch: string,
    labels: string,
    tree: string,
    root: string,
    gave: string,
    tableSize: number,
    code2: string,
    did: string,
    draw: { tree: string; root: number; code: number[]; done: number[] },
  ): void => {
    steps.push({
      t: `T${steps.length + 1}`,
      branch,
      labels,
      tree,
      root,
      gave,
      tableSize,
      code2,
      did,
      draw,
    });
  };

  const linkA = neighbors(n, TREE_A);
  const linkB = neighbors(n, TREE_B);
  const blank: number[] = Array.from({ length: n }, () => -1);
  push(
    "준비",
    "①",
    "A 와 B",
    "-",
    "-",
    0,
    "-",
    `간선${gae(TREE_A.length)}를 양쪽 정점에 나눠 담아 이웃 목록 둘을 만든다`,
    { tree: "A", root: 0, code: blank, done: [] },
  );

  /** 잎 벗기기를 바퀴마다 남긴다. */
  const peel = (name: string, adj: number[][]): number[] => {
    const peeledSoFar: number[] = [];
    const left = adj.map((row) => row.length);
    let layer: number[] = [];
    for (let v = 0; v < n; v++) if (left[v] === 1) layer.push(v);
    let alive = n;
    while (alive > 2) {
      const gone = cells(layer);
      peeledSoFar.push(...layer);
      const next: number[] = [];
      for (const v of layer) {
        left[v] = 0;
        alive--;
        for (const w of adj[v] as number[]) {
          if ((left[w] as number) > 0) {
            left[w] = (left[w] as number) - 1;
            if (left[w] === 1) next.push(w);
          }
        }
      }
      layer = next;
      push(
        "잎 벗기기",
        "②",
        name,
        "-",
        "-",
        0,
        "-",
        `잎 ${gone}${을를(gone)} 벗긴다 — 정점${gae(alive)}가 남는다`,
        { tree: name, root: 0, code: blank, done: [...peeledSoFar] },
      );
    }
    return layer;
  };
  const rootA = peel("A", linkA);
  const rootB = peel("B", linkB);
  push(
    "중심 개수",
    "⑦",
    "A 와 B",
    "-",
    "-",
    0,
    "-",
    `A 의 중심 ${cells(rootA)}${과와(cells(rootA))} B 의 중심 ${cells(rootB)} — 개수가 둘씩이라 같다`,
    { tree: "A", root: rootA[0] as number, code: blank, done: [] },
  );

  const shared = new Map<string, number>();
  const code2: number[] = [];

  /** 한 뿌리에서 번호를 매기되 정점 묶음마다 걸음을 남긴다. */
  const runOne = (
    name: string,
    adj: number[][],
    root: number,
    groups: number[][],
  ): number => {
    const parent: number[] = Array.from({ length: n }, () => -1);
    const order: number[] = [root];
    for (let i = 0; i < order.length; i++) {
      const v = order[i] as number;
      for (const w of adj[v] as number[]) {
        if (w !== parent[v]) {
          parent[w] = v;
          order.push(w);
        }
      }
    }
    push(
      "차례 적기",
      "③④",
      name,
      String(root),
      "-",
      shared.size,
      code2.length === 0 ? "-" : cells(code2),
      `뿌리 ${root} 에서 방문 차례 ${cells(order)}${을를(cells(order))} 적는다`,
      { tree: name, root, code: blank, done: [] },
    );
    const id: number[] = Array.from({ length: n }, () => -1);
    const numberedSoFar: number[] = [];
    let cursor = order.length - 1;
    for (const group of groups) {
      const notes: string[] = [];
      const marks: string[] = [];
      for (let k = 0; k < group.length; k++) {
        const v = order[cursor] as number;
        cursor--;
        const kids: number[] = [];
        for (const w of adj[v] as number[]) {
          if (w !== parent[v]) kids.push(id[w] as number);
        }
        kids.sort((a, b) => a - b);
        const key = kids.join(",");
        const fresh = !shared.has(key);
        let got = shared.get(key);
        if (got === undefined) {
          got = shared.size;
          shared.set(key, got);
        }
        id[v] = got;
        numbered++;
        numberedSoFar.push(v);
        marks.push(`${v}→${got}`);
        notes.push(`${v}: [${key}] → ${got}${fresh ? " 새" : ""}`);
      }
      push(
        "번호 매기기",
        "⑤⑥",
        name,
        String(root),
        marks.join(" "),
        shared.size,
        code2.length === 0 ? "-" : cells(code2),
        notes.join(" · "),
        { tree: name, root, code: [...id], done: [...numberedSoFar] },
      );
    }
    return id[root] as number;
  };

  code2.push(
    runOne("B", linkB, rootB[0] as number, [[5, 4], [3], [1, 7], [2, 0], [6]]),
  );
  const afterFirst = steps[steps.length - 1] as WalkStep;
  afterFirst.code2 = cells(code2);
  afterFirst.did = `${afterFirst.did} — B 의 첫 중심 번호가 ${code2[0]} 로 정해진다`;

  code2.push(
    runOne("B", linkB, rootB[1] as number, [[1, 2, 0, 5, 4], [6], [3, 7]]),
  );
  const afterSecond = steps[steps.length - 1] as WalkStep;
  afterSecond.code2 = cells(code2);
  afterSecond.did = `${afterSecond.did} — B 의 중심 번호 둘이 ${cells(code2)} 로 찬다`;

  const codeA = runOne("A", linkA, rootA[0] as number, [
    [6, 5, 4, 7, 0, 3],
    [1],
    [2],
  ]);
  const hit = code2.includes(codeA);
  const afterThird = steps[steps.length - 1] as WalkStep;
  afterThird.branch = "견주기";
  afterThird.labels = "⑧⑨";
  afterThird.did = `${afterThird.did} — 뿌리 번호 ${codeA}${이가(String(codeA))} B 의 번호 ${cells(code2)} 안에 있어 ${hit} 를 돌려준다`;

  const answer = treeIsomorphism(n, TREE_A, TREE_B);
  if (answer !== hit) throw new Error("전개 걸음이 정본과 다른 답을 냈다");
  return { steps, table: [...shared.entries()], answer, numbered };
}

export const WALK = walkLog();

/* ────────────────────────── 견줄 모양들 ────────────────────────── */

interface Shape {
  label: string;
  n: number;
  a: Edge[];
  b: Edge[];
}

const SHAPES: Shape[] = [
  { label: "전개 입력", n: WALK_N, a: TREE_A, b: TREE_B },
  { label: "정점 하나", n: 1, a: [], b: [] },
  { label: "정점 둘", n: 2, a: [[0, 1]], b: [[1, 0]] },
  {
    label: "사슬 여덟 대 사슬 여덟",
    n: 8,
    a: chain(8),
    b: relabel(8, chain(8), 5),
  },
  { label: "사슬 여덟 대 별 여덟", n: 8, a: chain(8), b: star(8, 0) },
  { label: "별 여덟 대 별 여덟", n: 8, a: star(8, 0), b: star(8, 7) },
  {
    label: "완전 이진 열다섯 대 그 라벨 바꾼 것",
    n: 15,
    a: binary(15),
    b: relabel(15, binary(15), 9),
  },
  {
    label: "애벌레 열둘 대 그 라벨 바꾼 것",
    n: 12,
    a: caterpillar(12, 6),
    b: relabel(12, caterpillar(12, 6), 3),
  },
  {
    label: "차수 수열이 같은 비동형 짝",
    n: 6,
    a: [
      [2, 3],
      [1, 2],
      [0, 1],
      [0, 4],
      [0, 5],
    ],
    b: [
      [2, 4],
      [1, 3],
      [0, 1],
      [0, 4],
      [0, 5],
    ],
  },
  {
    label: "잎이 한곳에 몰린 여섯 대 두 곳으로 갈린 여섯",
    n: 6,
    a: [
      [0, 1],
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 2],
    ],
    b: [
      [0, 1],
      [0, 4],
      [0, 5],
      [1, 2],
      [1, 3],
    ],
  },
  {
    label: "중심이 하나인 트리 대 중심이 둘인 트리",
    n: 7,
    a: chain(7),
    b: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [2, 6],
    ],
  },
  {
    label: "무작위 스물 대 그 라벨 바꾼 것",
    n: 20,
    a: randomTree(20, 20260908),
    b: relabel(20, randomTree(20, 20260908), 77),
  },
  {
    label: "무작위 스물 대 다른 무작위 스물",
    n: 20,
    a: randomTree(20, 11),
    b: randomTree(20, 22),
  },
];

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = typeof import("./treeIsomorphism-guide.ref.ts");
const REF = new URL("./treeIsomorphism-guide.ref.ts", import.meta.url).pathname;

const SORT_LINE = /^ {4}kids\.sort\(\(a, b\) => a - b\);$/;
const CENTER_LINE = /^ {2}return layer;$/;
const SHARE_LINE =
  /^ {4}if \(code2\.includes\(shapeCode\(n, link1, r, table\)\)\) return true;$/;
const COUNT_LINE = /^ {2}if \(root1\.length !== root2\.length\) return false;$/;

/** 자식 번호를 **정렬하지 않는** 판. 자식이 적힌 차례가 그대로 번호에 들어간다. */
const noSort = await loadMutant<Impl>(REF, { drop: SORT_LINE });

/** 중심이 둘일 때 **앞의 하나만** 뿌리로 삼는 판. */
const oneRoot = await loadMutant<Impl>(REF, {
  swap: [CENTER_LINE, "  return layer.slice(0, 1);"],
});

/** 트리마다 번호표를 **따로** 쓰는 판. */
const ownTable = await loadMutant<Impl>(REF, {
  swap: [
    SHARE_LINE,
    "    if (code2.includes(shapeCode(n, link1, r, new Map()))) return true;",
  ],
});

/** 중심 개수 견주기를 **빼는** 판. 이 변이는 답을 안 바꾸므로 자기검사에서 뺀다. */
const noCount = await loadMutant<Impl>(REF, { drop: COUNT_LINE });

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = noSort.treeIsomorphism === treeIsomorphism;

if (!중화됨) {
  const breaking: [string, Impl][] = [
    ["정렬을 뺀 판", noSort],
    ["중심 하나만 보는 판", oneRoot],
    ["번호표를 따로 쓰는 판", ownTable],
  ];
  for (const [label, impl] of breaking) {
    const same = SHAPES.every(
      (s) =>
        treeIsomorphism(s.n, s.a, s.b) === impl.treeIsomorphism(s.n, s.a, s.b),
    );
    if (same) throw new Error(`${label} 변이가 어느 입력에서도 답을 안 바꿨다`);
  }
}

/**
 * 중심 개수 견주기를 뺀 판이 답을 바꾸는 짝이 정말 없는가 — 작은 트리를 전수로 본다.
 *
 * 중화 실행에서는 `noCount` 가 정본 그 자체라 이 스윕이 언제나 0 을 낸다. 값이 안 바뀌므로
 * 중화 대조가 이 자리에서 걸리지 않는다.
 */
function countGuardSweep(
  upTo: number,
  cap: number,
): { pairs: number; off: number } {
  let pairs = 0;
  let off = 0;
  for (let n = 1; n <= upTo; n++) {
    const trees = [...allTrees(n)].slice(0, cap);
    for (const a of trees) {
      for (const b of trees) {
        pairs++;
        if (treeIsomorphism(n, a, b) !== noCount.treeIsomorphism(n, a, b))
          off++;
      }
    }
  }
  return { pairs, off };
}
const COUNT_SWEEP = countGuardSweep(7, 120);

/* ────────────────────────── 해시 판 ────────────────────────── */

/** 32 비트 혼합 — 잘 알려진 세 번 섞기다. */
function mix(x: number): number {
  let h = x >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** 부분 트리 모양을 번호표 대신 **수 하나**로 접는다. 자식 순서를 안 타게 더한다. */
function hashRooted(
  n: number,
  link: number[][],
  root: number,
  mask: number,
): number {
  const parent: number[] = Array.from({ length: n }, () => -1);
  const order: number[] = [root];
  for (let i = 0; i < order.length; i++) {
    const v = order[i] as number;
    for (const w of link[v] as number[]) {
      if (w !== parent[v]) {
        parent[w] = v;
        order.push(w);
      }
    }
  }
  const h: number[] = Array.from({ length: n }, () => 0);
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i] as number;
    let s = 1;
    for (const w of link[v] as number[]) {
      if (w !== parent[v]) s = (s + mix(h[w] as number)) >>> 0;
    }
    h[v] = mix(s) & mask;
  }
  return h[root] as number;
}

function hashTree(n: number, edges: Edge[], bits: number): number {
  const mask = bits >= 32 ? -1 >>> 0 : (1 << bits) - 1;
  const link = neighbors(n, edges);
  const roots = centers(n, link);
  const hs = roots
    .map((r) => hashRooted(n, link, r, mask))
    .sort((a, b) => a - b);
  return (
    (mix(hs.length + mix((hs[0] as number) + mix(hs[1] ?? 0))) & mask) >>> 0
  );
}

/** 폭 `bits` 에서 서로 비동형인 두 트리가 같은 수로 접히는 첫 자리. */
function firstCollision(
  bits: number,
  n: number,
  limit: number,
): { at: number; a: Edge[]; b: Edge[]; value: number } | null {
  const next = makeRng(20260908);
  const seen = new Map<number, Edge[]>();
  for (let scanned = 1; scanned <= limit; scanned++) {
    const t: Edge[] = [];
    for (let v = 1; v < n; v++) t.push([next() % v, v]);
    const h = hashTree(n, t, bits);
    const prev = seen.get(h);
    if (prev === undefined) {
      seen.set(h, t);
      continue;
    }
    if (!treeIsomorphism(n, prev, t)) {
      return { at: scanned, a: prev, b: t, value: h };
    }
  }
  return null;
}

const HASH_N = 40;
const HASH_LIMIT = 400_000;
const HASH_BITS = [12, 16, 20, 24, 28, 32];
const HASH_ROWS = HASH_BITS.map((bits) => ({
  bits,
  hit: firstCollision(bits, HASH_N, HASH_LIMIT),
}));

/** 그림으로 보일 만큼 작은 충돌 — 폭을 좁히면 정점 아홉짜리 트리에서도 나온다. */
const SMALL_N = 9;
const SMALL_HIT = firstCollision(8, SMALL_N, 200_000);

/* ────────────────────────── 전수 대조 결과 ────────────────────────── */

interface Census {
  n: number;
  labeled: number;
  classes: number;
  sameChecked: number;
  sameFail: number;
  crossChecked: number;
  crossFail: number;
  degSeqs: number;
  degClash: number;
}

function census(n: number, sampleCap: number): Census {
  const shared = new Map<string, number>();
  const groups = new Map<string, Edge[][]>();
  let labeled = 0;
  for (const edges of allTrees(n)) {
    labeled++;
    const key = canonKey(n, edges, shared);
    const bucket = groups.get(key);
    if (bucket === undefined) groups.set(key, [edges]);
    else bucket.push(edges);
  }
  let sameChecked = 0;
  let sameFail = 0;
  for (const members of groups.values()) {
    const rep = members[0] as Edge[];
    for (let i = 1; i < members.length && i <= sampleCap; i++) {
      sameChecked++;
      if (!byPermutation(n, rep, members[i] as Edge[])) sameFail++;
    }
  }
  const reps = [...groups.values()].map((m) => m[0] as Edge[]);
  let crossChecked = 0;
  let crossFail = 0;
  for (let i = 0; i < reps.length; i++) {
    for (let j = i + 1; j < reps.length; j++) {
      crossChecked++;
      if (byPermutation(n, reps[i] as Edge[], reps[j] as Edge[])) crossFail++;
    }
  }
  const bySeq = new Map<string, number>();
  for (const rep of reps) {
    const seq = neighbors(n, rep)
      .map((row) => row.length)
      .sort((a, b) => a - b)
      .join(",");
    bySeq.set(seq, (bySeq.get(seq) ?? 0) + 1);
  }
  let degClash = 0;
  for (const c of bySeq.values()) if (c > 1) degClash++;
  return {
    n,
    labeled,
    classes: groups.size,
    sameChecked,
    sameFail,
    crossChecked,
    crossFail,
    degSeqs: bySeq.size,
    degClash,
  };
}

const CENSUS: Census[] = [];
for (let n = 1; n <= 7; n++) CENSUS.push(census(n, Number.POSITIVE_INFINITY));
CENSUS.push(census(8, 200));

/* ────────────────────────── 지름과 중심 ────────────────────────── */

/** 너비 우선으로 한 정점에서의 거리를 잰다. */
function distances(n: number, link: number[][], from: number): number[] {
  const dist: number[] = Array.from({ length: n }, () => -1);
  dist[from] = 0;
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const v = queue[i] as number;
    for (const w of link[v] as number[]) {
      if (dist[w] === -1) {
        dist[w] = (dist[v] as number) + 1;
        queue.push(w);
      }
    }
  }
  return dist;
}
function diameter(n: number, edges: Edge[]): number {
  const link = neighbors(n, edges);
  let best = 0;
  for (let v = 0; v < n; v++) {
    for (const d of distances(n, link, v)) best = Math.max(best, d);
  }
  return best;
}
/** 잎 벗기기가 몇 바퀴 도는가. */
function peelRounds(n: number, edges: Edge[]): number {
  if (n === 1) return 0;
  const link = neighbors(n, edges);
  const left = link.map((row) => row.length);
  let layer: number[] = [];
  for (let v = 0; v < n; v++) if (left[v] === 1) layer.push(v);
  let alive = n;
  let rounds = 0;
  while (alive > 2) {
    rounds++;
    const next: number[] = [];
    for (const v of layer) {
      left[v] = 0;
      alive--;
      for (const w of link[v] as number[]) {
        if ((left[w] as number) > 0) {
          left[w] = (left[w] as number) - 1;
          if (left[w] === 1) next.push(w);
        }
      }
    }
    layer = next;
  }
  return rounds;
}

const DIAM_SHAPES: [string, number, Edge[]][] = [
  ["정점 하나", 1, []],
  ["사슬 둘", 2, chain(2)],
  ["사슬 셋", 3, chain(3)],
  ["사슬 넷", 4, chain(4)],
  ["사슬 다섯", 5, chain(5)],
  ["사슬 여섯", 6, chain(6)],
  ["전개 입력 A", WALK_N, TREE_A],
  ["전개 입력 B", WALK_N, TREE_B],
  ["별 여덟", 8, star(8, 0)],
  ["완전 이진 열다섯", 15, binary(15)],
  ["애벌레 열둘", 12, caterpillar(12, 6)],
  ["무작위 스물", 20, randomTree(20, 20260908)],
];

/** 중심 개수와 지름의 홀짝이 어긋난 모양이 있는가 — 전수로 확인한다. */
function centerLawSweep(upTo: number): { checked: number; broken: number } {
  let checked = 0;
  let broken = 0;
  for (let n = 1; n <= upTo; n++) {
    for (const edges of allTrees(n)) {
      checked++;
      const link = neighbors(n, edges);
      const d = diameter(n, edges);
      const cs = centers(n, link);
      if (cs.length !== 1 + (d % 2)) broken++;
      if (n >= 2 && peelRounds(n, edges) !== Math.floor(d / 2)) broken++;
      const radius = Math.ceil(d / 2);
      for (const c of cs) {
        const ecc = Math.max(...distances(n, link, c));
        if (ecc !== radius) broken++;
      }
    }
  }
  return { checked, broken };
}
const CENTER_LAW = centerLawSweep(8);

/* ────────────────────────── 라벨을 바꿔도 번호가 같은가 ────────────────────────── */

function relabelSweep(
  upTo: number,
  tries: number,
): {
  checked: number;
  broken: number;
} {
  let checked = 0;
  let broken = 0;
  for (let n = 1; n <= upTo; n++) {
    let i = 0;
    for (const edges of allTrees(n)) {
      for (let k = 0; k < tries; k++) {
        const other = relabel(n, edges, 1000 + i * 31 + k);
        checked++;
        if (!treeIsomorphism(n, edges, other)) broken++;
      }
      i++;
    }
  }
  return { checked, broken };
}
const RELABEL = relabelSweep(7, 3);

/* ────────────────────────── 최악 모양 ────────────────────────── */

const WORST_SHAPES: [string, (n: number) => Edge[]][] = [
  ["사슬", (n) => chain(n)],
  ["사슬을 간선 목록에 거꾸로 적은 것", (n) => chain(n).slice().reverse()],
  ["별", (n) => star(n, 0)],
  ["완전 이진", (n) => binary(n)],
  ["애벌레(등뼈 절반)", (n) => caterpillar(n, n >> 1)],
  ["무작위", (n) => randomTree(n, 20260908)],
];

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 정의를 그대로 옮긴 절차가 제약 규모에서 몇 번인가. */
  "concept-perm": () => {
    const rows = [4, 6, 8, 10, 12, 16].map((n) => {
      let fact = 1;
      for (let k = 2; k <= n; k++) fact *= k;
      const a = chain(n);
      const b = relabel(n, a, 88);
      const m = meter(n, a, b);
      return [
        num(n),
        num(fact),
        num(n - 1),
        num(fact * (n - 1)),
        num(m.slotReads + m.compares + m.lookups),
      ];
    });
    let worst = 0;
    const trees = [...allTrees(7)].slice(0, 120);
    for (const a of trees) {
      for (const b of trees) {
        const c = { calls: 0 };
        byPermutation(7, a, b, c);
        worst = Math.max(worst, c.calls);
      }
    }
    return [
      table(
        [
          "정점 N",
          "정점 대응의 가짓수 N!",
          "대응 하나를 검사하는 간선 견주기 N−1",
          "곱한 값",
          "이 절차의 연산 수",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `정점 스무 개짜리 트리에서는 대응의 가짓수가 2,432,902,008,176,640,000 으로 늘어난다`,
      `└ 차수가 다른 짝을 미리 걸러 내는 되추적으로 줄여도 값은 여전히 이 절차보다 크다 — 정점 일곱짜리 트리 ${num(trees.length * trees.length)} 짝에서 한 짝에 최대${beon(worst)}이다`,
      `└ 제약 상한은 N = 100,000 이고, 그 자리에서 대응을 하나씩 만들어 보는 것은 적을 수 있는 크기가 아니다`,
    ].join("\n");
  },

  /** `concept` — 번호가 동형류를 실제로 가르는가. 라벨 붙은 트리를 전수로 본다. */
  "concept-shapes": () => {
    const rows = CENSUS.map((c) => [
      num(c.n),
      num(c.labeled),
      num(c.classes),
      num(c.sameChecked),
      num(c.sameFail),
      num(c.crossChecked),
      num(c.crossFail),
    ]);
    const bad = CENSUS.reduce((s, c) => s + c.sameFail + c.crossFail, 0);
    const labeled = CENSUS.reduce((s, c) => s + c.labeled, 0);
    return [
      table(
        [
          "정점 N",
          "라벨 붙은 트리",
          "번호가 가른 묶음",
          "같은 묶음 대조",
          "그중 비동형",
          "다른 묶음 대조",
          "그중 동형",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `트리 ${num(labeled)} 개를 번호로 묶고 되추적으로 다시 판정해, 어긋난 자리${gae(bad)}다`,
      `└ 같은 묶음 대조는 묶음의 첫 트리와 나머지를 하나씩 되추적으로 견준 것이다`,
      `└ 다른 묶음 대조는 묶음마다 첫 트리를 뽑아 서로 견준 것이다`,
      `└ N = 8 만 묶음마다 200 벌까지로 끊었다. 나머지는 전수다`,
    ].join("\n");
  },

  /** `deep.build` — 차수 수열로는 못 가르는 자리. */
  "build-degree": () => {
    const rows = CENSUS.map((c) => [
      num(c.n),
      num(c.classes),
      num(c.degSeqs),
      num(c.classes - c.degSeqs),
      c.degClash === 0 ? "없다" : `${num(c.degClash)} 개`,
    ]);
    const first = CENSUS.find((c) => c.degClash > 0);
    const pair = SHAPES.find(
      (s) => s.label === "차수 수열이 같은 비동형 짝",
    ) as Shape;
    const seq = (e: Edge[]): string =>
      neighbors(pair.n, e)
        .map((row) => row.length)
        .sort((a, b) => a - b)
        .join(" ");
    return [
      table(
        [
          "정점 N",
          "서로 다른 모양",
          "서로 다른 차수 수열",
          "차이",
          "겹친 수열",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["처음 겹치는 자리의 두 트리", "간선 목록", "차수 수열", "정본 판정"],
        [
          [
            "T1",
            pairs(pair.a),
            seq(pair.a),
            String(treeIsomorphism(pair.n, pair.a, pair.b)),
          ],
          [
            "T2",
            pairs(pair.b),
            seq(pair.b),
            String(treeIsomorphism(pair.n, pair.b, pair.a)),
          ],
        ],
        ["l", "l", "l", "l"],
      ),
      "",
      `차수 수열이 모양을 가르지 못하는 첫 정점 수는 ${num(first?.n ?? 0)} 이다`,
      `└ 정점 여섯이면 모양${gae(CENSUS[5]?.classes ?? 0)}인데 차수 수열은 ${num(CENSUS[5]?.degSeqs ?? 0)} 가지뿐이다`,
      `└ 위 두 트리는 차수 수열이 글자 그대로 같은데 정본이 둘 다 false 를 돌려준다`,
    ].join("\n");
  },

  /** `deep.build` — 뿌리 자리에 따라 답이 갈리는가. */
  "build-root": () => {
    const rows: string[][] = [];
    for (let n = 4; n <= 7; n++) {
      const trees = [...allTrees(n)];
      const cap = Math.min(trees.length, 120);
      let fixedWrong = 0;
      let allRootsWrong = 0;
      let centerWrong = 0;
      let pairsSeen = 0;
      for (let i = 0; i < cap; i++) {
        for (let j = 0; j < cap; j++) {
          pairsSeen++;
          const a = trees[i] as Edge[];
          const b = trees[j] as Edge[];
          const want = byPermutation(n, a, b);
          const shared = new Map<string, number>();
          const la = neighbors(n, a);
          const lb = neighbors(n, b);
          const fixed =
            shapeCode(n, la, 0, shared) === shapeCode(n, lb, 0, shared);
          if (fixed !== want) fixedWrong++;
          const target = shapeCode(n, la, 0, shared);
          let any = false;
          for (let v = 0; v < n; v++) {
            if (shapeCode(n, lb, v, shared) === target) any = true;
          }
          if (any !== want) allRootsWrong++;
          if (treeIsomorphism(n, a, b) !== want) centerWrong++;
        }
      }
      rows.push([
        num(n),
        num(pairsSeen),
        num(fixedWrong),
        num(allRootsWrong),
        num(centerWrong),
      ]);
    }
    const total = rows.reduce(
      (s, r) => s + Number(r[2]?.replace(/,/g, "") ?? 0),
      0,
    );
    return [
      table(
        [
          "정점 N",
          "견준 짝",
          "정점 0 에 뿌리내린 판이 틀린 짝",
          "모든 정점을 뿌리로 삼은 판이 틀린 짝",
          "중심에 뿌리내린 판이 틀린 짝",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `정점 0 에 그냥 뿌리내리면 어긋난 짝${gae(total)}다`,
      `└ 모든 정점을 뿌리로 삼으면 답은 맞는데 한 트리에서 번호를 N 번 매겨야 한다`,
      `└ 중심에 뿌리내리면 번호를 많아야 두 번 매기고 답도 맞는다`,
      `└ 정점 다섯 이상은 프뤼퍼 차례로 앞의 120 벌만 골라 그것들끼리 전부 견줬다`,
    ].join("\n");
  },

  /** `deep.build` — 작은 트리에서 번호가 어떻게 매겨지는가. */
  "build-code": () => {
    const n = 7;
    const t: Edge[] = [
      [0, 1],
      [0, 4],
      [0, 6],
      [1, 2],
      [1, 3],
      [4, 5],
    ];
    const link = neighbors(n, t);
    const shared = new Map<string, number>();
    const root = centers(n, link)[0] as number;
    const parent: number[] = Array.from({ length: n }, () => -1);
    const order: number[] = [root];
    for (let i = 0; i < order.length; i++) {
      const v = order[i] as number;
      for (const w of link[v] as number[]) {
        if (w !== parent[v]) {
          parent[w] = v;
          order.push(w);
        }
      }
    }
    const id: number[] = Array.from({ length: n }, () => -1);
    const rows: string[][] = [];
    for (let i = order.length - 1; i >= 0; i--) {
      const v = order[i] as number;
      const kids: number[] = [];
      for (const w of link[v] as number[]) {
        if (w !== parent[v]) kids.push(id[w] as number);
      }
      kids.sort((a, b) => a - b);
      const key = kids.join(",");
      const fresh = !shared.has(key);
      let got = shared.get(key);
      if (got === undefined) {
        got = shared.size;
        shared.set(key, got);
      }
      id[v] = got;
      rows.push([
        String(v),
        key === "" ? "(없다)" : key,
        String(got),
        fresh ? "새로 준 번호" : "이미 있던 번호",
        String(shared.size),
      ]);
    }
    return [
      `트리 ${pairs(t)} · 정점 ${num(n)} · 중심 ${cells(centers(n, link))} · 뿌리 ${root}`,
      `방문 차례 ${cells(order)} 를 거꾸로 읽는다`,
      "",
      table(
        ["정점", "자식 번호 목록", "받은 번호", "어디서 왔나", "표 크기"],
        rows,
        ["r", "l", "r", "l", "r"],
      ),
      "",
      table(
        ["번호표의 열쇠", "번호"],
        [...shared.entries()].map(([k, v]) => [
          k === "" ? "(빈 목록)" : k,
          String(v),
        ]),
        ["l", "r"],
      ),
      "",
      `정점 ${num(n)} 개에 번호${gae(shared.size)}가 붙었다 — 잎 넷이 번호 하나를 나눠 쓴다`,
      `└ 뿌리 ${root} 의 번호 ${id[root]} 이 이 트리 전체의 번호다`,
    ].join("\n");
  },

  /** `deep.walk` — 이웃 목록 둘. */
  "walk-adj": () => {
    const la = neighbors(WALK_N, TREE_A);
    const lb = neighbors(WALK_N, TREE_B);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      cells(la[v] as number[]),
      String((la[v] as number[]).length),
      cells(lb[v] as number[]),
      String((lb[v] as number[]).length),
    ]);
    const slots = la.reduce((s, r) => s + r.length, 0);
    return [
      table(
        ["정점", "A 의 이웃", "A 의 차수", "B 의 이웃", "B 의 차수"],
        rows,
        ["r", "l", "r", "l", "r"],
      ),
      "",
      `간선 ${num(TREE_A.length)} 개가 이웃 자리${gae(slots)}를 만든다`,
      `└ A 의 차수를 크기순으로 적으면 ${la
        .map((r) => r.length)
        .sort((x, y) => x - y)
        .join(" ")} 이고 B 도 같다`,
      `└ 차수만 같아서는 모양이 같다고 말할 수 없다. 그것은 아래 멈춤에서 값으로 본다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 차수 수열이 같아도 모양이 다르다. */
  "pause-degree": () => {
    const pair = SHAPES.find(
      (s) => s.label === "차수 수열이 같은 비동형 짝",
    ) as Shape;
    const rows: string[][] = [];
    for (const [name, t] of [
      ["T1", pair.a],
      ["T2", pair.b],
    ] as [string, Edge[]][]) {
      const link = neighbors(pair.n, t);
      const shared = new Map<string, number>();
      const roots = centers(pair.n, link);
      const codes = roots.map((r) => shapeCode(pair.n, link, r, shared));
      rows.push([
        name,
        pairs(t),
        link
          .map((r) => r.length)
          .sort((a, b) => a - b)
          .join(" "),
        String(diameter(pair.n, t)),
        cells(roots),
        cells(codes),
      ]);
    }
    const verdict = treeIsomorphism(pair.n, pair.a, pair.b);
    return [
      table(
        ["트리", "간선 목록", "차수 수열", "지름", "중심 정점", "중심의 번호"],
        rows,
        ["l", "l", "l", "r", "l", "l"],
      ),
      "",
      table(
        ["무엇으로 견주는가", "T1", "T2", "판정"],
        [
          [
            "차수 수열",
            rows[0]?.[2] ?? "",
            rows[1]?.[2] ?? "",
            rows[0]?.[2] === rows[1]?.[2] ? "같다" : "어긋난다",
          ],
          [
            "지름",
            rows[0]?.[3] ?? "",
            rows[1]?.[3] ?? "",
            rows[0]?.[3] === rows[1]?.[3] ? "같다" : "어긋난다",
          ],
          [
            "중심의 번호",
            rows[0]?.[5] ?? "",
            rows[1]?.[5] ?? "",
            rows[0]?.[5] === rows[1]?.[5] ? "같다" : "어긋난다",
          ],
        ],
        ["l", "l", "l", "l"],
      ),
      "",
      `정본의 답은 ${verdict} 이고, 차수 수열도 지름도 그 답을 못 낸다`,
      `└ 두 트리 다 정점 여섯 · 차수 수열 ${rows[0]?.[2]} · 지름 ${rows[0]?.[3]} 이다`,
      `└ 갈리는 것은 중심의 번호뿐이다 — 그 번호는 부분 트리 모양을 아래에서 위로 접은 값이다`,
    ].join("\n");
  },

  /** `deep.walk` — 잎 벗기기 걸음. */
  "walk-center": () => {
    const rows: string[][] = [];
    for (const [name, t] of [
      ["A", TREE_A],
      ["B", TREE_B],
    ] as [string, Edge[]][]) {
      const link = neighbors(WALK_N, t);
      const left = link.map((row) => row.length);
      let layer: number[] = [];
      for (let v = 0; v < WALK_N; v++) if (left[v] === 1) layer.push(v);
      let alive = WALK_N;
      let round = 0;
      rows.push([
        name,
        String(round),
        cells(layer),
        "-",
        String(alive),
        cells(left),
      ]);
      while (alive > 2) {
        round++;
        const gone = [...layer];
        const next: number[] = [];
        for (const v of layer) {
          left[v] = 0;
          alive--;
          for (const w of link[v] as number[]) {
            if ((left[w] as number) > 0) {
              left[w] = (left[w] as number) - 1;
              if (left[w] === 1) next.push(w);
            }
          }
        }
        layer = next;
        rows.push([
          name,
          String(round),
          cells(layer),
          cells(gone),
          String(alive),
          cells(left),
        ]);
      }
    }
    const ca = centers(WALK_N, neighbors(WALK_N, TREE_A));
    const cb = centers(WALK_N, neighbors(WALK_N, TREE_B));
    return [
      table(
        [
          "트리",
          "바퀴",
          "이번 바퀴의 잎",
          "벗겨 낸 정점",
          "남은 정점",
          "남은 차수",
        ],
        rows,
        ["l", "r", "l", "l", "r", "l"],
      ),
      "",
      `A 의 중심은 ${cells(ca)} 이고 B 의 중심은 ${cells(cb)} 이다 — 둘 다${gae(ca.length)}다`,
      `└ 남은 차수는 벗겨 낸 정점을 0 으로 적은 것이다`,
      `└ 두 바퀴 만에 정점${gae(2)}가 남고, 그 자리에서 벗기기가 끝난다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 중심 하나만 보면 틀린다. */
  "pause-oneroot": () => {
    const rows = SHAPES.map((s) => {
      const want = treeIsomorphism(s.n, s.a, s.b);
      const got = oneRoot.treeIsomorphism(s.n, s.a, s.b);
      const ca = centers(s.n, neighbors(s.n, s.a));
      const cb = centers(s.n, neighbors(s.n, s.b));
      return [
        s.label,
        num(s.n),
        `${ca.length}${과와(ca.length)} ${cb.length}`,
        String(want),
        String(got),
        want === got ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((r) => r[5] === "어긋난다").length;
    const two = rows.filter((r) => (r[2] ?? "").includes("2")).length;
    return [
      table(
        [
          "입력",
          "정점 N",
          "두 트리의 중심 개수",
          "정본",
          "앞의 중심만 보는 판",
          "대조",
        ],
        rows,
        ["l", "r", "l", "l", "l", "l"],
      ),
      "",
      `모양${gae(rows.length)} 가운데 답이 갈린 것${gae(off)}다`,
      `└ 중심이 둘인 트리가 낀 줄이${jul(two)}이고, 갈린 줄은 전부 그 안에 있다`,
      `└ 중심이 하나뿐인 트리끼리는 앞의 중심만 봐도 그 하나가 전부라 답이 같다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 부분 트리 모양을 수 하나로 접으면 충돌이 답을 틀린다. */
  "pause-hash": () => {
    const rows = HASH_ROWS.map((r) => [
      `${num(r.bits)} 비트`,
      num(2 ** r.bits),
      r.hit === null ? `${num(HASH_LIMIT)} 벌까지 못 찾음` : num(r.hit.at),
      r.hit === null ? "-" : num(r.hit.value),
    ]);
    const wide = HASH_ROWS[HASH_ROWS.length - 1];
    const narrow = HASH_ROWS[0];
    const extra: string[] = [];
    if (SMALL_HIT !== null) {
      const seq = (e: Edge[]): string =>
        neighbors(SMALL_N, e)
          .map((row) => row.length)
          .sort((a, b) => a - b)
          .join(" ");
      extra.push(
        "",
        table(
          ["정점 아홉짜리 트리 둘", "간선 목록", "차수 수열", "8 비트 해시"],
          [
            ["T1", pairs(SMALL_HIT.a), seq(SMALL_HIT.a), num(SMALL_HIT.value)],
            ["T2", pairs(SMALL_HIT.b), seq(SMALL_HIT.b), num(SMALL_HIT.value)],
          ],
          ["l", "l", "l", "r"],
        ),
        "",
        `두 트리를 정본으로 판정하면 ${treeIsomorphism(SMALL_N, SMALL_HIT.a, SMALL_HIT.b)} 인데 해시 판은 같은 수를 내 true 를 답한다`,
      );
    }
    return [
      table(
        ["해시 폭", "쓸 수 있는 수", "충돌이 처음 난 트리 자리", "그때의 수"],
        rows,
        ["l", "r", "r", "r"],
      ),
      ...extra,
      "",
      `위 표는 정점 ${num(HASH_N)} 짜리 무작위 트리를 차례로 만들어 잰 값이고, 아래 두 트리는 폭을 8 비트로 좁혀 정점 ${num(SMALL_N)} 짜리 트리에서 찾은 것이다`,
      `└ 폭을 ${num(narrow?.bits ?? 0)} 에서 ${num(wide?.bits ?? 0)} 로 늘리면 첫 충돌이 ${num(narrow?.hit?.at ?? 0)} 번째에서 ${num(wide?.hit?.at ?? 0)} 번째로 옮겨 간다`,
      `└ 늦게 날 뿐 없어지지 않는다. 번호표는 열쇠가 글자 그대로 같을 때만 같은 번호를 준다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 중심 개수 견주기를 빼도 답이 안 틀린다. */
  "pause-count": () => {
    const rows = SHAPES.map((s) => {
      const want = treeIsomorphism(s.n, s.a, s.b);
      const got = noCount.treeIsomorphism(s.n, s.a, s.b);
      const ca = centers(s.n, neighbors(s.n, s.a)).length;
      const cb = centers(s.n, neighbors(s.n, s.b)).length;
      return [
        s.label,
        `${ca}${과와(String(ca))} ${cb}`,
        ca === cb ? "안 탄다" : "탄다",
        String(want),
        String(got),
        want === got ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((r) => r[5] === "어긋난다").length;
    const taken = rows.filter((r) => r[2] === "탄다").length;
    return [
      table(
        [
          "입력",
          "두 트리의 중심 개수",
          "이른 반환",
          "정본",
          "견주기를 뺀 판",
          "대조",
        ],
        rows,
        ["l", "l", "l", "l", "l", "l"],
      ),
      "",
      `모양${gae(rows.length)} 가운데 답이 갈린 것${gae(off)}다`,
      `└ 이른 반환을 타는 줄이${jul(taken)}인데, 그 줄에서도 두 판의 답이 같다`,
      `└ 트리 짝 ${num(COUNT_SWEEP.pairs)} 벌 전수 대조에서도 답이 갈린 짝${gae(COUNT_SWEEP.off)}다`,
    ].join("\n");
  },

  /** `deep.walk` — 스무 걸음 전체. */
  "walk-trace": () => {
    const rows = WALK.steps.map((s) => [
      s.t,
      s.branch,
      s.labels,
      s.tree,
      s.root,
      num(s.tableSize),
      s.code2,
      s.did,
    ]);
    return [
      table(
        [
          "걸음",
          "갈래",
          "라벨",
          "트리",
          "뿌리",
          "표 크기",
          "B 의 중심 번호",
          "이 걸음이 한 일",
        ],
        rows,
        ["l", "l", "l", "l", "r", "r", "l", "l"],
      ),
      "",
      `걸음이${gae(WALK.steps.length)}이고 표에 남은 열쇠${gae(WALK.table.length)}다`,
      `└ 뿌리를 세 번 잡는다 — B 의 중심 둘과 A 의 중심 하나다`,
      `└ 마지막 걸음이 ${WALK.answer} 를 돌려준다`,
    ].join("\n");
  },

  /** `deep.walk` — 표에 남은 열쇠. */
  "walk-table": () => {
    const rows = WALK.table.map(([key, id]) => [
      key === "" ? "(빈 목록)" : key,
      String(id),
      key === "" ? "잎" : `자식 ${num(key.split(",").length)} 개짜리 모양`,
    ]);
    return [
      table(["자식 번호 목록", "번호", "무엇인가"], rows, ["l", "r", "l"]),
      "",
      `열쇠${gae(WALK.table.length)}에 정점을 번호 매긴 횟수는${beon(WALK.numbered)}이다`,
      `└ 정점을 ${num(WALK.numbered)} 번 번호 매기는 동안 새 열쇠는 ${num(WALK.table.length)} 번만 생겼다`,
      `└ 나머지는 이미 있던 번호를 그대로 받았다. 그것이 같은 모양을 알아본 자리다`,
    ].join("\n");
  },

  /** `deep.walk` — 라벨마다 몇 번 지나갔는가. */
  "walk-coverage": () => {
    const counts = new Map<string, number>();
    for (const s of WALK.steps) {
      for (const ch of s.labels) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    const names: [string, string][] = [
      ["①", "간선을 양쪽 정점에 나눠 담는다"],
      ["②", "잎을 한 겹 벗긴다"],
      ["③", "뿌리에서 시작하는 방문 차례를 적는다"],
      ["④", "그 배열을 거꾸로 읽는다"],
      ["⑤", "자식 번호를 오름차순으로 세운다"],
      ["⑥", "표에서 번호를 받는다"],
      ["⑦", "중심 개수를 견준다"],
      ["⑧", "번호표 하나를 두 트리가 함께 쓴다"],
      ["⑨", "번호가 같은 것이 있으면 동형이다"],
    ];
    const rows = names.map(([mark, what]) => [
      mark,
      what,
      num(counts.get(mark) ?? 0),
    ]);
    const zero = rows.filter((r) => r[2] === "0").length;
    return [
      table(["라벨", "이 갈래가 하는 일", "전개 입력에서의 걸음 수"], rows, [
        "l",
        "l",
        "r",
      ]),
      "",
      `라벨 아홉 가운데 0 인 줄이${jul(zero)}이다`,
      `└ ③④ 는 뿌리를 잡을 때마다 한 번씩이라${beon(counts.get("③") ?? 0)}이다`,
      `└ ⑤⑥ 은 정점 묶음마다 한 걸음으로 접어 적은 것이고, 번호를 매긴 정점은 모두${gae(WALK.numbered)}다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 뿌리 잡은 횟수와 열쇠 수가 규모에서 어떻게 정해지는가. */
  "build-scale": () => {
    const rows: string[][] = [];
    for (const [name, mk] of WORST_SHAPES) {
      for (const n of [1024]) {
        const a = mk(n);
        const b = relabel(n, a, 4321);
        const m = meter(n, a, b);
        rows.push([
          name,
          num(n),
          num(m.tableSize),
          `${((m.tableSize / n) * 100).toFixed(1)} %`,
          num(m.lookups),
        ]);
      }
    }
    return [
      table(
        ["모양", "정점 N", "표에 남은 열쇠", "N 에 대한 비율", "표를 본 횟수"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `모양${gae(rows.length)}를 정점 1,024 에서 잰 값이다`,
      `└ 별은 열쇠${gae(2)}뿐이다 — 잎 하나와 뿌리 하나가 모양의 전부다`,
      `└ 표를 본 횟수는 정점 수에 뿌리 잡은 횟수를 곱한 값이고, 그 가운데 새 열쇠만 표에 남는다`,
    ].join("\n");
  },

  /** `related` — 같은 값에 대표 번호를 한 번만 주고 그 뒤로는 번호끼리 견준다. */
  "related-reuse": () => {
    const used = new Map<string, number>();
    for (const step of WALK.steps) {
      for (const note of step.did.split(" · ")) {
        const hit = /\[([^\]]*)\] → (\d+)/.exec(note);
        if (hit === null) continue;
        const key = hit[1] ?? "";
        used.set(key, (used.get(key) ?? 0) + 1);
      }
    }
    const keyRows = WALK.table.map(([key, id]) => [
      key === "" ? "(빈 목록)" : key,
      String(id),
      num(used.get(key) ?? 0),
    ]);
    const scaleRows: string[][] = [];
    for (const [name, mk] of WORST_SHAPES) {
      if (name !== "사슬" && name !== "별" && name !== "무작위") continue;
      for (const n of [64, 4096]) {
        const a = mk(n);
        const b = relabel(n, a, 4321);
        const m = meter(n, a, b);
        scaleRows.push([
          `${name} ${num(n)}`,
          num(m.lookups),
          num(m.tableSize),
          num(m.lookups - m.tableSize),
          `${((1 - m.tableSize / m.lookups) * 100).toFixed(1)} %`,
        ]);
      }
    }
    const reuse = WALK.numbered - WALK.table.length;
    return [
      table(["자식 번호 목록", "번호", "이 번호를 받은 정점 수"], keyRows, [
        "l",
        "r",
        "r",
      ]),
      "",
      table(
        [
          "모양",
          "표를 본 횟수",
          "새로 준 번호",
          "이미 있던 번호를 받은 횟수",
          "다시 쓴 비율",
        ],
        scaleRows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `전개 입력에서는 표를 ${num(WALK.numbered)} 번 보는 동안 새 번호가 ${num(WALK.table.length)} 번 생기고 나머지${beon(reuse)}이 다시 쓴 것이다`,
      `└ 정점 4,096 짜리 별에서는 번호${gae(2)}로 표를 ${scaleRows[3]?.[1] ?? ""} 번 본다`,
      `└ 같은 자리에서 사슬은 번호가 ${scaleRows[1]?.[2]} 개까지 늘어 다시 쓴 비율이 ${scaleRows[1]?.[4]} 에 그친다`,
    ].join("\n");
  },

  /** `invariant` — 번호가 같다는 것과 모양이 같다는 것이 같은 일인가. */
  "invariant-relabel": () => {
    const rows = CENSUS.map((c) => [
      num(c.n),
      num(c.labeled),
      num(c.classes),
      num(c.crossChecked),
      num(c.crossFail),
    ]);
    return [
      table(
        [
          "정점 N",
          "라벨 붙은 트리",
          "번호가 가른 묶음",
          "묶음끼리 되추적 대조",
          "그중 동형",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["무엇을 확인했는가", "대조 횟수", "어긋난 자리"],
        [
          [
            "번호가 같은 두 트리는 정말 동형인가",
            num(CENSUS.reduce((s, c) => s + c.sameChecked, 0)),
            num(CENSUS.reduce((s, c) => s + c.sameFail, 0)),
          ],
          [
            "번호가 다른 두 트리는 정말 비동형인가",
            num(CENSUS.reduce((s, c) => s + c.crossChecked, 0)),
            num(CENSUS.reduce((s, c) => s + c.crossFail, 0)),
          ],
          [
            "정점 번호만 섞으면 판정이 참인가",
            num(RELABEL.checked),
            num(RELABEL.broken),
          ],
        ],
        ["l", "r", "r"],
      ),
      "",
      `세 줄의 어긋난 자리를 더하면 ${num(CENSUS.reduce((s, c) => s + c.sameFail + c.crossFail, 0) + RELABEL.broken)} 이다`,
      `└ 셋째 줄은 라벨 붙은 트리마다 번호를 세 벌씩 섞어 다시 건 것이다`,
      `└ 첫 줄과 둘째 줄의 판정 근거는 정규형이 아니라 되추적으로 찾은 정점 대응이다`,
    ].join("\n");
  },

  /** `invariant` — 경계에 놓인 입력. */
  "invariant-edges": () => {
    const rows = SHAPES.map((s) => {
      const m = meter(s.n, s.a, s.b);
      return [
        s.label,
        num(s.n),
        num(s.a.length),
        `${m.centers1}${과와(String(m.centers1))} ${m.centers2}`,
        num(m.rootedRuns),
        num(m.tableSize),
        String(m.answer),
        m.answer === byPermutation(s.n, s.a, s.b) ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((r) => r[7] === "어긋난다").length;
    return [
      table(
        [
          "입력",
          "정점 N",
          "간선",
          "두 트리의 중심 개수",
          "뿌리 잡은 횟수",
          "표에 남은 열쇠",
          "정본",
          "되추적과 대조",
        ],
        rows,
        ["l", "r", "r", "l", "r", "r", "l", "l"],
      ),
      "",
      `모양${gae(rows.length)} 가운데 되추적과 어긋난 줄이${jul(off)}이다`,
      `└ 정점 하나짜리 트리는 간선이 없고 중심이 그 정점 하나다`,
      `└ 뿌리 잡은 횟수는 많아야 셋이다 — 뒤 트리의 중심 둘과 앞 트리의 중심 하나다`,
    ].join("\n");
  },

  /** `invariant` — 정렬을 뺀 판. */
  "mutant-sort": () => {
    const rows = SHAPES.map((s) => {
      const want = treeIsomorphism(s.n, s.a, s.b);
      const got = noSort.treeIsomorphism(s.n, s.a, s.b);
      const m = meter(s.n, s.a, s.b);
      return [
        s.label,
        num(m.lookups),
        String(want),
        String(got),
        want === got ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((r) => r[4] === "어긋난다").length;
    const walkMeter = meter(WALK_N, TREE_A, TREE_B);
    return [
      table(
        ["입력", "그 줄을 지나간 횟수", "정본", "정렬을 뺀 판", "대조"],
        rows,
        ["l", "r", "l", "l", "l"],
      ),
      "",
      `모양${gae(rows.length)} 가운데 답이 갈린 것${gae(off)}다`,
      `└ 이른 반환을 안 타는 입력은 그 줄을 정점 수의 배수만큼 지나간다 — 전개 입력은 ${num(walkMeter.lookups)} 번이다`,
      `└ 답이 같은 줄은 자식이 하나뿐이거나 자식 번호가 이미 같아 세울 것이 없던 자리다`,
    ].join("\n");
  },

  /** `deep.math` — 중심 개수와 지름. */
  "math-center": () => {
    const rows = DIAM_SHAPES.map(([label, n, t]) => {
      const link = neighbors(n, t);
      const d = diameter(n, t);
      const c = centers(n, link);
      const r = peelRounds(n, t);
      const ecc = Math.max(...distances(n, link, c[0] as number));
      return [
        label,
        num(n),
        num(d),
        num(c.length),
        num(1 + (d % 2)),
        num(r),
        num(Math.floor(d / 2)),
        num(ecc),
        num(Math.ceil(d / 2)),
        c.length === 1 + (d % 2) &&
        r === Math.floor(d / 2) &&
        ecc === Math.ceil(d / 2)
          ? "같다"
          : "어긋난다",
      ];
    });
    const off = rows.filter((r) => r[9] === "어긋난다").length;
    return [
      table(
        [
          "모양",
          "정점 N",
          "지름 d",
          "센 중심 개수",
          "1 + (d mod 2)",
          "센 벗기기 바퀴",
          "⌊d/2⌋",
          "센 중심의 이심률",
          "⌈d/2⌉",
          "세 식 대조",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `모양${gae(rows.length)} 가운데 식과 어긋난 줄이${jul(off)}이다`,
      `└ 정점 ${num(CENTER_LAW.checked)} 벌 전수 스윕에서도 어긋난 자리는 ${num(CENTER_LAW.broken)} 이다`,
      `└ 그 스윕은 정점 여덟까지의 라벨 붙은 트리 전부이고, 중심 개수 · 벗기기 바퀴 · 중심의 이심률 셋을 함께 봤다`,
    ].join("\n");
  },

  /** `deep.math` — 제약 규모에서의 계수. */
  "math-scale": () => {
    const rows = [16, 1024, 65536].map((n) => {
      const bound = (n - 1) * Math.ceil(Math.log2(n - 1));
      const worst = meter(n, star(n, 0), star(n, n - 1));
      return [
        num(n),
        num(Math.ceil(Math.log2(n - 1))),
        num(bound),
        num(worst.compares),
        `${((worst.compares / bound) * 100).toFixed(1)} %`,
      ];
    });
    rows.push([num(100_000), num(17), num(99_999 * 17), "재지 않았다", "-"]);
    return [
      table(
        [
          "정점 N",
          "⌈log₂(N−1)⌉",
          "견주기 상한 (N−1)⌈log₂(N−1)⌉",
          "별 모양에서 실제로 센 견주기",
          "상한에 대한 비율",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `제약 상한 N = 100,000 에서 대응의 가짓수는 이 표의 어느 값과도 견줄 수 없는 크기다`,
      `└ 같은 자리에서 이 절차의 견주기 상한은 ${num(99_999 * 17)} 이다`,
      `└ 별 모양은 자식이 한 정점에 몰려 견주기가 상한에 가장 가까이 간다`,
    ].join("\n");
  },

  /** `perf.derive` — 전개 입력의 계수. */
  "perf-count": () => {
    const m = meter(WALK_N, TREE_A, TREE_B);
    const rows: string[][] = [
      ["간선 목록 읽기", num(m.edgeReads), "2(N−1)"],
      ["이웃 자리 읽기", num(m.slotReads), "케이스를 탄다"],
      ["잎으로 벗긴 정점", num(m.peeled), "케이스를 탄다"],
      ["방문 차례에 담은 정점", num(m.visits), "N × 뿌리 잡은 횟수"],
      ["자식 번호 견주기", num(m.compares), "케이스를 탄다"],
      ["표를 본 횟수", num(m.lookups), "N × 뿌리 잡은 횟수"],
      ["표에 남은 열쇠", num(m.tableSize), "케이스를 탄다"],
      ["뿌리 잡은 횟수", num(m.rootedRuns), "많아야 3"],
    ];
    return [
      table(["무엇", "값", "닫힌 형태"], rows, ["l", "r", "l"]),
      "",
      `전개 입력 정점 ${num(WALK_N)} · 간선 ${num(TREE_A.length)} 에서 잰 값이다`,
      `└ 간선 목록 읽기 ${num(m.edgeReads)} 가 2(N−1) = ${num(2 * (WALK_N - 1))} 와 같다`,
      `└ 방문 차례에 담은 정점 ${num(m.visits)} 가 N × ${num(m.rootedRuns)} = ${num(WALK_N * m.rootedRuns)} 와 같다`,
    ].join("\n");
  },

  /** `perf.derive` — 모양을 바꿔도 등식이 그대로인가. */
  "perf-growth": () => {
    const rows: string[][] = [];
    for (const [name, mk] of WORST_SHAPES) {
      const n = 1024;
      const a = mk(n);
      const b = relabel(n, a, 4321);
      const m = meter(n, a, b);
      rows.push([
        name,
        num(n),
        num(m.edgeReads),
        num(2 * (n - 1)),
        num(m.visits),
        num(n * m.rootedRuns),
        num(m.slotReads),
        num(m.compares),
        num(m.rootedRuns),
      ]);
    }
    const off = rows.filter((r) => r[2] !== r[3] || r[4] !== r[5]).length;
    return [
      table(
        [
          "모양",
          "정점 N",
          "간선 목록 읽기",
          "2(N−1)",
          "방문 차례",
          "N × 뿌리 횟수",
          "이웃 자리 읽기",
          "견주기",
          "뿌리 횟수",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `모양${gae(rows.length)} 가운데 두 등식이 어긋난 줄이${jul(off)}이다`,
      `└ 갈리는 것은 견주기와 뿌리 잡은 횟수 둘뿐이다`,
      `└ 견주기가 모양을 타는 것은 자식 수가 한 정점에 몰리는가에 달렸기 때문이다`,
    ].join("\n");
  },

  /** `perf.worst` — 어떤 모양이 각 축을 최대로 만드는가. */
  "worst-shape": () => {
    const n = 4096;
    const rows: string[][] = [];
    for (const [name, mk] of WORST_SHAPES) {
      const a = mk(n);
      const b = relabel(n, a, 4321);
      const m = meter(n, a, b);
      rows.push([
        name,
        num(m.compares),
        num(m.peeled),
        num(m.tableSize),
        num(m.keyChars),
        num(m.rootedRuns),
      ]);
    }
    const maxCmp = Math.max(
      ...rows.map((r) => Number((r[1] ?? "0").replace(/,/g, ""))),
    );
    const maxKey = Math.max(
      ...rows.map((r) => Number((r[4] ?? "0").replace(/,/g, ""))),
    );
    return [
      table(
        [
          "모양",
          "자식 번호 견주기",
          "잎으로 벗긴 정점",
          "표에 남은 열쇠",
          "열쇠 글자 수",
          "뿌리 횟수",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `정점 수를 ${num(n)} 으로 못 박은 모양${gae(rows.length)}다`,
      `└ 견주기가 가장 많은 모양은 「${rows.find((r) => Number((r[1] ?? "0").replace(/,/g, "")) === maxCmp)?.[0]}」 이고 그때${beon(maxCmp)}이다`,
      `└ 열쇠 글자 수가 가장 많은 모양은 「${rows.find((r) => Number((r[4] ?? "0").replace(/,/g, "")) === maxKey)?.[0]}」 이고 그때 ${num(maxKey)} 글자다`,
    ].join("\n");
  },

  /** `perf.worst` — 규모를 네 배로 늘리면 값이 어떻게 자라는가. */
  "worst-chain": () => {
    const rows: string[][] = [];
    let prev = 0;
    for (const n of [1024, 4096, 16384, 65536]) {
      const a = star(n, 0);
      const b = star(n, n - 1);
      const m = meter(n, a, b);
      const total = m.slotReads + m.compares + m.lookups;
      rows.push([
        num(n),
        num(m.compares),
        num(m.slotReads),
        num(total),
        prev === 0 ? "-" : (total / prev).toFixed(2),
        num((n - 1) * Math.ceil(Math.log2(n - 1))),
      ]);
      prev = total;
    }
    const chainRows: string[][] = [];
    for (const n of [1024, 4096, 16384, 65536]) {
      const a = chain(n);
      const b = chain(n).slice().reverse();
      const m = meter(n, a, b);
      chainRows.push([
        num(n),
        num(m.compares),
        num(m.peeled),
        num(m.tableSize),
        num(m.keyChars),
      ]);
    }
    return [
      table(
        [
          "별 모양 정점 N",
          "견주기",
          "이웃 자리 읽기",
          "셋을 더한 값",
          "직전 줄의 몇 배",
          "(N−1)⌈log₂(N−1)⌉",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      table(
        [
          "사슬 정점 N",
          "견주기",
          "잎으로 벗긴 정점",
          "표에 남은 열쇠",
          "열쇠 글자 수",
        ],
        chainRows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `정점 수를 네 배로 늘리면 별 모양의 셋을 더한 값이 네 배 남짓이 된다`,
      `└ 별에서는 견주기가 상한 (N−1)⌈log₂(N−1)⌉ 에 가장 가까이 붙는다`,
      `└ 정점 ${chainRows[0]?.[0]} 짜리 사슬에서는 견주기가 ${chainRows[0]?.[1]} 뿐이고 대신 열쇠${gae(Number((chainRows[0]?.[3] ?? "0").replace(/,/g, "")))}가 남는다`,
    ].join("\n");
  },
};
