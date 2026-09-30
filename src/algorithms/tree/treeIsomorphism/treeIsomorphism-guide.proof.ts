/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/treeIsomorphism/treeIsomorphism-guide.md
 *
 * **사본이 셋 있다.** 정본은 걸음마다의 상태도, 기본 연산 수도 내보내지 않는다.
 *
 * - `traceWalk` — 정본과 같은 절차에 걸음 기록을 덧붙인 판. 걸음마다 배열을 베끼므로 전개 입력처럼
 *   작은 입력에만 쓴다. 걸음 재생 패널과 본문 전개 표의 출처다.
 * - `meter` — 정본과 같은 절차의 계수만 세는 판. 걸음을 베끼지 않으므로 정점 100,000 개에도 쓴다.
 * - `variant` — 뿌리를 정점 0 하나 · 모든 정점 · 중심으로 바꿔 가며 같은 계수를 세는 판. 「아이디어를
 *   떠올리는 과정」의 비교에만 쓴다.
 *
 * 비용의 기준은 원고 전체에서 하나다 — **기본 연산**. 간선 목록에서 간선 하나를 읽는 일 · 이웃 목록의
 * 항목 하나를 읽는 일 · 잎 하나를 벗기는 일 · 방문 차례에 정점 하나를 담는 일 · 자식 번호 두 개를 한 번
 * 비교하는 일(정렬 안에서) · 맵(모양 번호표나 간선 집합)을 한 번 찾는 일을 각각 한 번으로 센다. 메모리는
 * 모양 번호표의 열쇠 개수와 열쇠 글자 수로 센다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 자기 답을 정본과 맞대고, 어긋나면 던진다.
 * 정의대로의 답(정점 대응이 있는가)은 `byMapping` 이 되추적으로 낸다.
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이 파일을
 * 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안
 * 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은
 * 객체인가**로 값에서 알아낸다.
 *
 * **무거운 계산은 부를 때 한 번만 한다(`once`).** 그림 사이드카와 가이드 시험이 이 파일에서 입력과
 * 걸음 기록만 가져가는데, 라벨 붙은 트리 전수 같은 계산을 모듈을 읽을 때 하면 그쪽이 수 초씩 기다린다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  centers,
  type Edge,
  neighbors,
  shapeCode,
  treeIsomorphism,
} from "./treeIsomorphism-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 열을 값의 폭에 맞춰 늘어놓는다(등폭 펜스용). */
function columns(rows: string[][], gap = "  "): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, widths[c] ?? 0))
        .join(gap)
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** 마크다운 표. `right` 에 든 열은 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 천 단위 구분. 본문 표기와 같다. */
export const comma = (n: number | bigint): string => n.toLocaleString("en-US");

/** 수 목록 하나를 한 칸에 — `[1, 6]`. */
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** 정점 모임 하나를 한 칸에 — `{3, 4, 5}`. */
export const setOf = (xs: readonly number[]): string => `{${xs.join(", ")}}`;

/** 모양 번호표의 열쇠를 적는 법 — 빈 열쇠만 `""` 로 적고 나머지는 글자 그대로다. */
export const keyText = (key: string): string => (key === "" ? `""` : key);

/** 간선 목록 하나를 한 칸에 — `0-1 1-2`. */
const pairs = (es: readonly Edge[]): string =>
  es.length === 0 ? "없음" : es.map(([u, v]) => `${u}-${v}`).join(" ");

/** 결과를 한 번만 계산한다. */
function once<T>(f: () => T): () => T {
  let done = false;
  let value: T | undefined;
  return () => {
    if (!done) {
      value = f();
      done = true;
    }
    return value as T;
  };
}

/* ────────────────────────── 입력 ────────────────────────── */

/**
 * 본문 전개가 끝까지 쓰는 트리 둘. 정점 여덟 · 간선 일곱씩이고 서로 동형이다. 둘 다 중심이 둘이라
 * 뿌리를 두 번 잡는 갈래가 실행되고, 한 트리 안에서 두 중심의 모양 번호가 서로 다르다.
 */
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

/** 차수 수열이 같은데 동형이 아닌 가장 작은 짝(정점 여섯). */
export const PQ_N = 6;
export const TREE_P: Edge[] = [
  [2, 3],
  [1, 2],
  [0, 1],
  [0, 4],
  [0, 5],
];
export const TREE_Q: Edge[] = [
  [2, 4],
  [1, 3],
  [0, 1],
  [0, 4],
  [0, 5],
];

export const N_LIMIT = 100_000;

export function chain(n: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < n - 1; i++) out.push([i, i + 1]);
  return out;
}
export function star(n: number, hub: number): Edge[] {
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
/**
 * 사슬 `0-1-…-(n−2)` 의 정점 `at` 에 잎 하나를 더 단 트리. `at` 이 1 과 2 인 둘은 정점 수 · 지름 · 중심
 * 개수가 같고(정점 6 이상), 모양은 다르다.
 */
function broomAt(n: number, at: number): Edge[] {
  const out = chain(n - 1);
  out.push([at, n - 1]);
  return out;
}
/**
 * 가운데 정점 0 에 길이가 1 · 2 · 3 … 인 다리를 단 거미. 다리의 모양이 전부 달라 가운데 정점의 자식
 * 번호가 모두 다르고, 다리를 적는 차례를 섞어 두어 정렬이 실제로 일을 한다.
 */
function spider(n: number): Edge[] {
  const lens: number[] = [];
  let left = n - 1;
  for (let k = 1; left > 0; k++) {
    const len = Math.min(k, left);
    lens.push(len);
    left -= len;
  }
  const next = makeRng(7);
  for (let i = lens.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    const t = lens[i] as number;
    lens[i] = lens[j] as number;
    lens[j] = t;
  }
  const out: Edge[] = [];
  let v = 1;
  for (const len of lens) {
    let prev = 0;
    for (let k = 0; k < len; k++) {
      out.push([prev, v]);
      prev = v;
      v++;
    }
  }
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

/* ────────────────────────── 뿌리를 정한 트리 ────────────────────────── */

/** 뿌리 `root` 에서 본 자식 목록 — 정본의 ③ 과 같은 차례(너비 우선)로 담는다. */
export function childrenFrom(
  n: number,
  edges: readonly Edge[],
  root: number,
): { kids: number[][]; parent: number[]; order: number[] } {
  const link = neighbors(n, [...edges]);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const order: number[] = [root];
  const kids: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < order.length; i++) {
    const v = order[i] as number;
    for (const w of link[v] as number[]) {
      if (w !== parent[v]) {
        parent[w] = v;
        (kids[v] as number[]).push(w);
        order.push(w);
      }
    }
  }
  return { kids, parent, order };
}

/**
 * 모양 번호표 하나를 들고 뿌리 여럿에서 차례로 번호를 매긴다 — 정본의 `shapeCode` 를 그대로 부르고,
 * 정점마다의 번호는 정본과 같은 절차를 다시 밟아 모은다(정본은 뿌리의 번호만 돌려준다).
 */
export function codesFrom(
  n: number,
  edges: readonly Edge[],
  root: number,
  table: Map<string, number>,
): number[] {
  const { kids, order } = childrenFrom(n, edges, root);
  const code: number[] = Array.from({ length: n }, () => -1);
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i] as number;
    const got = (kids[v] as number[])
      .map((w) => code[w] as number)
      .sort((a, b) => a - b);
    const key = got.join(",");
    let id = table.get(key);
    if (id === undefined) {
      id = table.size;
      table.set(key, id);
    }
    code[v] = id;
  }
  return code;
}

/**
 * 전개 입력의 판정을 정본 차례 그대로 한 번 한 결과 — B 를 중심마다, 그다음 A 를 첫 중심에서 매긴다.
 * 본문 전체가 쓰는 모양 번호가 여기서 나온다. 뿌리의 번호는 정본 `shapeCode` 와 맞댄다.
 */
export const RUN = (() => {
  const cA = centers(WALK_N, neighbors(WALK_N, TREE_A));
  const cB = centers(WALK_N, neighbors(WALK_N, TREE_B));
  const table = new Map<string, number>();
  const refTable = new Map<string, number>();
  const bAt = new Map<number, number[]>();
  for (const r of cB) {
    const code = codesFrom(WALK_N, TREE_B, r, table);
    const want = shapeCode(WALK_N, neighbors(WALK_N, TREE_B), r, refTable);
    if (code[r] !== want) throw new Error("B 의 뿌리 번호가 정본과 다르다");
    bAt.set(r, code);
  }
  const aRoot = cA[0] as number;
  const aCode = codesFrom(WALK_N, TREE_A, aRoot, table);
  const want = shapeCode(WALK_N, neighbors(WALK_N, TREE_A), aRoot, refTable);
  if (aCode[aRoot] !== want) throw new Error("A 의 뿌리 번호가 정본과 다르다");
  if ([...table.keys()].join("|") !== [...refTable.keys()].join("|")) {
    throw new Error("모양 번호표가 정본과 다르다");
  }
  return { cA, cB, table, bAt, aRoot, aCode };
})();

/** 모양 번호를 괄호 문자열로 편다 — 열쇠가 적은 자식 번호마다 그 괄호를 차례로 넣는다. */
export function bracketOf(code: number, table: Map<string, number>): string {
  const keys = [...table.keys()];
  const key = keys[code] as string;
  const kids = key === "" ? [] : key.split(",").map(Number);
  return `(${kids.map((k) => bracketOf(k, table)).join("")})`;
}

/**
 * 정점 대응 하나를 모양 번호에서 만든다 — 두 뿌리의 번호가 같으면 자식끼리 같은 번호를 짝지어
 * 내려간다. 만든 대응은 `mapsEdges` 가 간선으로 확인한다.
 */
export function mappingFrom(
  n: number,
  ea: readonly Edge[],
  ra: number,
  eb: readonly Edge[],
  rb: number,
): number[] {
  const table = new Map<string, number>();
  const ca = codesFrom(n, ea, ra, table);
  const cb = codesFrom(n, eb, rb, table);
  const ka = childrenFrom(n, ea, ra).kids;
  const kb = childrenFrom(n, eb, rb).kids;
  const phi: number[] = Array.from({ length: n }, () => -1);
  const pair = (x: number, y: number): void => {
    phi[x] = y;
    const pool = [...(kb[y] as number[])];
    for (const c of ka[x] as number[]) {
      const at = pool.findIndex((d) => cb[d] === ca[c]);
      const d = pool[at] as number;
      pool.splice(at, 1);
      pair(c, d);
    }
  };
  pair(ra, rb);
  return phi;
}

/** 대응 `phi` 아래에서 `ea` 의 간선이 전부 `eb` 의 간선이 되는가. */
function mapsEdges(ea: readonly Edge[], eb: readonly Edge[], phi: number[]) {
  const has = new Set(
    eb.map(([u, v]) => `${Math.min(u, v)}-${Math.max(u, v)}`),
  );
  return ea.map(([u, v]) => {
    const a = phi[u] as number;
    const b = phi[v] as number;
    return {
      from: [u, v],
      to: [a, b],
      ok: has.has(`${Math.min(a, b)}-${Math.max(a, b)}`),
    };
  });
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
function canonKey(n: number, edges: Edge[], shared: Map<string, number>) {
  const link = neighbors(n, edges);
  const roots = centers(n, link);
  const codes = roots
    .map((r) => shapeCode(n, link, r, shared))
    .sort((a, b) => a - b);
  return `${roots.length}:${codes.join("|")}`;
}

/** 정점 대응을 되추적으로 찾는다 — 정의를 그대로 옮긴 절차다. */
export function byMapping(n: number, e1: Edge[], e2: Edge[]): boolean {
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

/**
 * 뿌리째 동형인가 — 뿌리를 뿌리로 보내고, 자식을 대응한 정점의 자식 가운데 아직 안 쓴 것으로 보내는
 * 대응을 되추적으로 찾는다. 모양 번호를 쓰지 않는다.
 */
function rootedIso(
  ka: number[][],
  ra: number,
  kb: number[][],
  rb: number,
): boolean {
  const ca = ka[ra] as number[];
  const cb = kb[rb] as number[];
  if (ca.length !== cb.length) return false;
  const used: boolean[] = cb.map(() => false);
  const go = (i: number): boolean => {
    if (i === ca.length) return true;
    for (let j = 0; j < cb.length; j++) {
      if (used[j]) continue;
      if (!rootedIso(ka, ca[i] as number, kb, cb[j] as number)) continue;
      used[j] = true;
      if (go(i + 1)) return true;
      used[j] = false;
    }
    return false;
  };
  return go(0);
}

interface Census {
  n: number;
  labeled: number;
  classes: number;
  sameChecked: number;
  sameFail: number;
  crossChecked: number;
  crossFail: number;
  degSeqs: number;
}

/** 라벨 붙은 트리를 모양 번호로 묶고, 묶음 안과 묶음 사이를 되추적으로 다시 판정한다. */
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
      if (!byMapping(n, rep, members[i] as Edge[])) sameFail++;
    }
  }
  const reps = [...groups.values()].map((m) => m[0] as Edge[]);
  let crossChecked = 0;
  let crossFail = 0;
  for (let i = 0; i < reps.length; i++) {
    for (let j = i + 1; j < reps.length; j++) {
      crossChecked++;
      if (byMapping(n, reps[i] as Edge[], reps[j] as Edge[])) crossFail++;
    }
  }
  const bySeq = new Set<string>();
  for (const rep of reps) {
    bySeq.add(
      neighbors(n, rep)
        .map((row) => row.length)
        .sort((a, b) => a - b)
        .join(","),
    );
  }
  return {
    n,
    labeled,
    classes: groups.size,
    sameChecked,
    sameFail,
    crossChecked,
    crossFail,
    degSeqs: bySeq.size,
  };
}

/** 정점 여덟까지 — 일곱까지는 전수, 여덟은 묶음마다 200 벌까지. */
const CENSUS = once(() => {
  const out: Census[] = [];
  for (let n = 1; n <= 7; n++) out.push(census(n, Number.POSITIVE_INFINITY));
  out.push(census(8, 200));
  return out;
});

/* ────────────────────────── 계수 ────────────────────────── */

export interface Metered {
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
  /** 기본 연산 — 여섯 계수의 합. */
  ops: number;
  /** 잎 벗기기에서 읽은 이웃 항목 수 — `slotReads` 가운데 벗기기 몫. */
  peelReads: number;
}

type Counter = Omit<Metered, "answer" | "ops">;

function freshCounter(): Counter {
  return {
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
    peelReads: 0,
  };
}

const opsOf = (m: Counter): number =>
  m.edgeReads + m.slotReads + m.peeled + m.visits + m.compares + m.lookups;

function countedLink(n: number, edges: Edge[], m: Counter): number[][] {
  const out: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    m.edgeReads++;
    (out[u] as number[]).push(v);
    (out[v] as number[]).push(u);
  }
  return out;
}

function countedCenters(n: number, adj: number[][], m: Counter): number[] {
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
        m.peelReads++;
        if ((left[w] as number) > 0) {
          left[w] = (left[w] as number) - 1;
          if (left[w] === 1) next.push(w);
        }
      }
    }
    layer = next;
  }
  return layer;
}

function countedCode(
  n: number,
  adj: number[][],
  root: number,
  shared: Map<string, number>,
  m: Counter,
): number {
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
    let got = shared.get(key);
    if (got === undefined) {
      got = shared.size;
      shared.set(key, got);
      m.keyChars += key.length;
    }
    id[v] = got;
  }
  return id[root] as number;
}

/**
 * 정본과 **같은 걸음**을 밟으면서 계수만 센다. 답은 매번 정본과 대조한다. `skipCount` 는 중심 개수
 * 비교(⑦)를 뺀 판의 계수다 — 그 판의 답은 정본과 같으므로(본문 「짚고 가기」) 같은 대조를 건다.
 */
export function meter(
  n: number,
  e1: Edge[],
  e2: Edge[],
  skipCount = false,
): Metered {
  const m = freshCounter();
  const link1 = countedLink(n, e1, m);
  const link2 = countedLink(n, e2, m);
  const root1 = countedCenters(n, link1, m);
  const root2 = countedCenters(n, link2, m);
  m.centers1 = root1.length;
  m.centers2 = root2.length;
  const shared = new Map<string, number>();
  let answer = false;
  if (skipCount || root1.length === root2.length) {
    const code2 = root2.map((r) => countedCode(n, link2, r, shared, m));
    for (const r of root1) {
      if (code2.includes(countedCode(n, link1, r, shared, m))) {
        answer = true;
        break;
      }
    }
  }
  m.tableSize = shared.size;
  const want = treeIsomorphism(n, e1, e2);
  if (answer !== want) {
    throw new Error(`계수 사본이 정본과 다른 답을 냈다 — ${answer} 대 ${want}`);
  }
  return { ...m, answer, ops: opsOf(m) };
}

/**
 * 뿌리 자리를 바꾼 판의 계수. `zero` 는 두 트리 다 정점 0 에 뿌리를 두고 번호 하나씩을 비교하고,
 * `all` 은 A 의 정점 0 번호를 B 의 모든 정점 번호와 비교한다(맞는 뿌리를 만나면 멈춘다).
 */
function variant(
  n: number,
  e1: Edge[],
  e2: Edge[],
  mode: "zero" | "all",
): { answer: boolean; ops: number; runs: number } {
  const m = freshCounter();
  const link1 = countedLink(n, e1, m);
  const link2 = countedLink(n, e2, m);
  const shared = new Map<string, number>();
  const target = countedCode(n, link1, 0, shared, m);
  let answer = false;
  if (mode === "zero") {
    answer = countedCode(n, link2, 0, shared, m) === target;
  } else {
    for (let v = 0; v < n; v++) {
      if (countedCode(n, link2, v, shared, m) === target) {
        answer = true;
        break;
      }
    }
  }
  return { answer, ops: opsOf(m), runs: m.rootedRuns };
}

/** 뿌리 하나에서 번호를 매기는 한 벌의 기본 연산 — 어림에만 쓴다. */
function oneRunOps(n: number, edges: Edge[]): number {
  const m = freshCounter();
  const link = neighbors(n, edges);
  countedCode(n, link, 0, new Map(), m);
  return opsOf(m);
}

/**
 * 정의를 그대로 옮긴 절차 — 정점 대응을 하나씩 만들어(힙 알고리즘) 그 대응 아래에서 A 의 간선이 B 의
 * 간선 집합에 있는지 차례로 찾는다. 하나라도 없으면 그 대응을 버린다.
 */
function naiveOps(
  n: number,
  e1: Edge[],
  e2: Edge[],
): { answer: boolean; ops: number; tried: number } {
  let ops = 0;
  const has = new Set<number>();
  for (const [u, v] of e2) {
    ops++;
    has.add(u * n + v);
    has.add(v * n + u);
  }
  const p = Array.from({ length: n }, (_, i) => i);
  const test = (): boolean => {
    for (const [u, v] of e1) {
      ops += 2;
      if (!has.has((p[u] as number) * n + (p[v] as number))) return false;
    }
    return true;
  };
  let tried = 1;
  if (test()) return { answer: true, ops, tried };
  const c: number[] = Array.from({ length: n }, () => 0);
  let i = 1;
  while (i < n) {
    if ((c[i] as number) < i) {
      const j = i % 2 === 0 ? 0 : (c[i] as number);
      const t = p[j] as number;
      p[j] = p[i] as number;
      p[i] = t;
      tried++;
      if (test()) return { answer: true, ops, tried };
      c[i] = (c[i] as number) + 1;
      i = 1;
    } else {
      c[i] = 0;
      i++;
    }
  }
  return { answer: false, ops, tried };
}

const factorial = (n: number): bigint => {
  let f = 1n;
  for (let k = 2n; k <= BigInt(n); k++) f *= k;
  return f;
};
/** `n!` 의 자릿수 — `⌊Σ log₁₀ k⌋ + 1`. */
const factorialDigits = (n: number): number => {
  let s = 0;
  for (let k = 2; k <= n; k++) s += Math.log10(k);
  return Math.floor(s) + 1;
};

/* ────────────────────────── 전개 걸음 기록 ────────────────────────── */

export type Kind = "build" | "peel" | "count" | "order" | "code" | "match";
export type Side = "A" | "B";

/** 걸음 하나가 끝난 뒤의 상태. */
export interface Snap {
  kind: Kind;
  /** 이 걸음이 다룬 트리. 두 트리를 함께 다루면 `null`. */
  tree: Side | null;
  /** 정본의 원문자 라벨. */
  labels: string;
  /** 트리마다 남은 차수. 벗긴 정점은 0 이다. */
  left: Record<Side, number[]>;
  /** 트리마다 정점을 벗긴 바퀴(1 부터). 아직 안 벗겼으면 0. */
  gone: Record<Side, number[]>;
  /** 트리마다 찾은 중심. 아직이면 `null`. */
  found: Record<Side, number[] | null>;
  /** `peel` — 이번 바퀴. */
  round?: number;
  leaves?: number[];
  touched?: number[];
  alive?: number;
  next?: number[];
  /** 번호를 매기는 중인 뿌리와 그 뿌리에서의 부모 · 방문 차례 · 번호. */
  root: number | null;
  parent: number[] | null;
  order: number[];
  code: (number | null)[];
  /** `code` — 이번에 번호를 받은 정점과 그 계산. */
  i?: number;
  v?: number;
  kids?: number[];
  raw?: number[];
  sorted?: number[];
  key?: string;
  fresh?: boolean;
  /** 모양 번호표의 열쇠 — 번호 차례. */
  table: string[];
  /** 지금까지 낸 B 의 중심 번호. */
  code2: number[];
  hit?: boolean;
  /** `order` — `w !== parent[v]` 가 참 · 거짓이었던 횟수. */
  branch?: [number, number];
}

export const stepOf = (k: number): string => `T${k + 1}`;

/** 전개 입력을 정본과 같은 차례로 밟으며 걸음마다 상태를 베낀다. */
function traceWalk(): { steps: Snap[]; answer: boolean } {
  const n = WALK_N;
  const link: Record<Side, number[][]> = {
    A: neighbors(n, TREE_A),
    B: neighbors(n, TREE_B),
  };
  const left: Record<Side, number[]> = {
    A: link.A.map((r) => r.length),
    B: link.B.map((r) => r.length),
  };
  const gone: Record<Side, number[]> = {
    A: Array.from({ length: n }, () => 0),
    B: Array.from({ length: n }, () => 0),
  };
  const found: Record<Side, number[] | null> = { A: null, B: null };
  const table = new Map<string, number>();
  const code2: number[] = [];
  const steps: Snap[] = [];
  let root: number | null = null;
  let parent: number[] | null = null;
  let order: number[] = [];
  let code: (number | null)[] = Array.from({ length: n }, () => null);

  const snap = (
    kind: Kind,
    tree: Side | null,
    labels: string,
    extra: Partial<Snap> = {},
  ): void => {
    steps.push({
      kind,
      tree,
      labels,
      left: { A: [...left.A], B: [...left.B] },
      gone: { A: [...gone.A], B: [...gone.B] },
      found: {
        A: found.A === null ? null : [...found.A],
        B: found.B === null ? null : [...found.B],
      },
      root,
      parent: parent === null ? null : [...parent],
      order: [...order],
      code: [...code],
      table: [...table.keys()],
      code2: [...code2],
      ...extra,
    });
  };

  snap("build", null, "①");

  const peel = (side: Side): number[] => {
    const adj = link[side];
    const l = left[side];
    let layer: number[] = [];
    for (let v = 0; v < n; v++) if (l[v] === 1) layer.push(v);
    let alive = n;
    let round = 0;
    while (alive > 2) {
      round++;
      const leaves = [...layer];
      const touched: number[] = [];
      const next: number[] = [];
      for (const v of layer) {
        l[v] = 0;
        gone[side][v] = round;
        alive--;
        for (const w of adj[v] as number[]) {
          if ((l[w] as number) > 0) {
            l[w] = (l[w] as number) - 1;
            touched.push(w);
            if (l[w] === 1) next.push(w);
          }
        }
      }
      layer = next;
      if (alive <= 2) found[side] = [...layer];
      snap("peel", side, "②", { round, leaves, touched, alive, next });
    }
    return layer;
  };
  const rootA = peel("A");
  const rootB = peel("B");
  snap("count", null, "⑦");

  const run = (side: Side, r: number, first: boolean): number => {
    const adj = link[side];
    root = r;
    parent = Array.from({ length: n }, () => -1);
    order = [r];
    code = Array.from({ length: n }, () => null);
    let yes = 0;
    let no = 0;
    for (let i = 0; i < order.length; i++) {
      const v = order[i] as number;
      for (const w of adj[v] as number[]) {
        if (w !== parent[v]) {
          yes++;
          parent[w] = v;
          order.push(w);
        } else no++;
      }
    }
    snap("order", side, first ? "⑧③" : "③", { branch: [yes, no] });
    for (let i = order.length - 1; i >= 0; i--) {
      const v = order[i] as number;
      const kids: number[] = [];
      const raw: number[] = [];
      for (const w of adj[v] as number[]) {
        if (w !== parent[v]) {
          kids.push(w);
          raw.push(code[w] as number);
        }
      }
      const sorted = [...raw].sort((a, b) => a - b);
      const key = sorted.join(",");
      let id = table.get(key);
      const fresh = id === undefined;
      if (id === undefined) {
        id = table.size;
        table.set(key, id);
      }
      code[v] = id;
      if (i === 0 && side === "B") code2.push(id);
      snap("code", side, "④⑤⑥", { i, v, kids, raw, sorted, key, fresh });
    }
    return code[r] as number;
  };

  run("B", rootB[0] as number, true);
  run("B", rootB[1] as number, false);
  const codeA = run("A", rootA[0] as number, false);
  const hit = code2.includes(codeA);
  snap("match", "A", "⑨", { hit });

  const answer = treeIsomorphism(n, TREE_A, TREE_B);
  if (answer !== hit) throw new Error("전개 걸음이 정본과 다른 답을 냈다");
  const cA = centers(n, link.A);
  const cB = centers(n, link.B);
  if (show(cA) !== show(rootA) || show(cB) !== show(rootB)) {
    throw new Error("전개 걸음의 중심이 정본과 다르다");
  }
  if ([...table.keys()].join("|") !== [...RUN.table.keys()].join("|")) {
    throw new Error("전개 걸음의 모양 번호표가 정본 차례와 다르다");
  }
  return { steps, answer };
}

export const WALK = traceWalk();

/** 걸음 `k` 까지 같은 갈래의 걸음이 몇 번째인가. */
export const nthOf = (k: number): number => {
  const kind = (WALK.steps[k] as Snap).kind;
  return WALK.steps.slice(0, k + 1).filter((s) => s.kind === kind).length;
};

/** 갈래마다 걸음 구간 — `T8~T15` 꼴. */
function spanOf(pred: (s: Snap) => boolean): string {
  const ks = WALK.steps.flatMap((s, k) => (pred(s) ? [k] : []));
  const a = stepOf(ks[0] as number);
  const b = stepOf(ks.at(-1) as number);
  return a === b ? a : `${a}~${b}`;
}

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
    label: "완전 이진 열다섯 대 번호를 섞은 것",
    n: 15,
    a: binary(15),
    b: relabel(15, binary(15), 9),
  },
  {
    label: "애벌레 열둘 대 번호를 섞은 것",
    n: 12,
    a: caterpillar(12, 6),
    b: relabel(12, caterpillar(12, 6), 3),
  },
  { label: "P 대 Q", n: PQ_N, a: TREE_P, b: TREE_Q },
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
    label: "무작위 스물 대 번호를 섞은 것",
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
const COUNT_LINE = /^ {2}if \(root1\.length !== root2\.length\) return false;$/;

/** 자식 번호를 **정렬하지 않는** 판. 자식이 적힌 차례가 그대로 열쇠에 들어간다. */
const noSort = await loadMutant<Impl>(REF, { drop: SORT_LINE });

/** 중심이 둘일 때 **앞의 하나만** 뿌리로 삼는 판. */
const oneRoot = await loadMutant<Impl>(REF, {
  swap: [CENTER_LINE, "  return layer.slice(0, 1);"],
});

/** 중심 개수 비교를 **빼는** 판. 이 변이는 답을 안 바꾸므로 자기검사에서 뺀다. */
const noCount = await loadMutant<Impl>(REF, { drop: COUNT_LINE });

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가 **같은
 * 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면 `check-proof` 의 중화 대조가
 * 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = noSort.treeIsomorphism === treeIsomorphism;

if (!중화됨) {
  const breaking: [string, Impl][] = [
    ["정렬을 뺀 판", noSort],
    ["중심 하나만 보는 판", oneRoot],
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
 * 중심 개수 비교를 뺀 판이 답을 바꾸는 짝이 정말 없는가 — 작은 트리를 앞에서부터 120 벌씩 전부 짝지어
 * 본다. 중화 실행에서는 `noCount` 가 정본 그 자체라 이 스윕이 언제나 0 을 낸다.
 */
const COUNT_SWEEP = once(() => {
  let pairs = 0;
  let off = 0;
  for (let n = 1; n <= 7; n++) {
    const trees = [...allTrees(n)].slice(0, 120);
    for (const a of trees) {
      for (const b of trees) {
        pairs++;
        if (treeIsomorphism(n, a, b) !== noCount.treeIsomorphism(n, a, b))
          off++;
      }
    }
  }
  return { pairs, off };
});

/* ────────────────────────── 수 해시 판 ────────────────────────── */

/** 32 비트 혼합 — 잘 알려진 세 번 섞기다. */
function mix(x: number): number {
  let h = x >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** 부분트리 모양을 모양 번호표 대신 **수 하나**로 접는다. 자식 순서를 안 타게 더한다. */
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

/** 폭 `bits` 에서 서로 동형이 아닌 두 트리가 같은 수로 접히는 첫 자리. */
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
const SMALL_N = 9;

/* ────────────────────────── 지름과 중심 ────────────────────────── */

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
/** 정점마다의 이심률. */
function eccs(n: number, edges: Edge[]): number[] {
  const link = neighbors(n, edges);
  return Array.from({ length: n }, (_, v) =>
    Math.max(...distances(n, link, v)),
  );
}
function diameter(n: number, edges: Edge[]): number {
  return Math.max(...eccs(n, edges));
}
/** 잎 벗기기가 몇 바퀴 도는가 — 정본의 ② 와 같은 절차에 바퀴만 센다. */
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

/** 중심 개수 · 벗기기 바퀴 · 중심의 이심률이 식과 어긋난 트리가 있는가 — 전수로 확인한다. */
const CENTER_LAW = once(() => {
  let checked = 0;
  let broken = 0;
  for (let n = 1; n <= 8; n++) {
    for (const edges of allTrees(n)) {
      checked++;
      const link = neighbors(n, edges);
      const e = eccs(n, edges);
      const d = Math.max(...e);
      const cs = centers(n, link);
      if (cs.length !== 1 + (d % 2)) broken++;
      if (peelRounds(n, edges) !== Math.floor(d / 2)) broken++;
      for (const c of cs) if (e[c] !== Math.ceil(d / 2)) broken++;
    }
  }
  return { checked, broken };
});

/** 정점 번호만 섞은 트리를 다시 물으면 언제나 참인가. */
const RELABEL = once(() => {
  let checked = 0;
  let broken = 0;
  for (let n = 1; n <= 7; n++) {
    let i = 0;
    for (const edges of allTrees(n)) {
      for (let k = 0; k < 3; k++) {
        const other = relabel(n, edges, 1000 + i * 31 + k);
        checked++;
        if (!treeIsomorphism(n, edges, other)) broken++;
      }
      i++;
    }
  }
  return { checked, broken };
});

/* ────────────────────────── 전제가 깨진 입력 ────────────────────────── */

/**
 * 정본의 ② 를 그대로 옮기되 바퀴 수에 상한을 둔 사본. 트리가 아니면 벗길 잎이 없어 정본은 멈추지
 * 않는다 — 그것을 멈추게 하지 않고는 보일 수가 없어서 상한을 둔다.
 */
function cappedPeel(
  n: number,
  edges: Edge[],
  cap: number,
): { rounds: number; alive: number; firstLeaves: number[] } {
  const link = neighbors(n, edges);
  const left = link.map((row) => row.length);
  let layer: number[] = [];
  for (let v = 0; v < n; v++) if (left[v] === 1) layer.push(v);
  const firstLeaves = [...layer];
  let alive = n;
  let rounds = 0;
  while (alive > 2 && rounds < cap) {
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
  return { rounds, alive, firstLeaves };
}

/* ────────────────────────── 재귀 사본 ────────────────────────── */

/** 정본의 ③④ 를 재귀 하나로 적은 사본. 사슬에서 호출 깊이가 정점 수와 같아진다. */
function recursiveCode(n: number, edges: Edge[], root: number): number {
  const link = neighbors(n, edges);
  const table = new Map<string, number>();
  const down = (v: number, p: number): number => {
    const kids: number[] = [];
    for (const w of link[v] as number[]) if (w !== p) kids.push(down(w, v));
    kids.sort((a, b) => a - b);
    const key = kids.join(",");
    let id = table.get(key);
    if (id === undefined) {
      id = table.size;
      table.set(key, id);
    }
    return id;
  };
  return down(root, -1);
}

function recursionVerdict(n: number): string {
  try {
    recursiveCode(n, chain(n), 0);
    return "끝까지 실행된다";
  } catch (e) {
    return e instanceof RangeError ? "RangeError" : "다른 예외";
  }
}

/* ────────────────────────── 최악 모양 ────────────────────────── */

const WORST_SHAPES: [string, (n: number) => Edge[]][] = [
  ["사슬", (n) => chain(n)],
  ["사슬을 간선 목록에 거꾸로 적은 것", (n) => chain(n).slice().reverse()],
  ["별", (n) => star(n, 0)],
  ["완전 이진", (n) => binary(n)],
  ["애벌레(등뼈 절반)", (n) => caterpillar(n, n >> 1)],
  ["다리 길이가 모두 다른 거미", (n) => spider(n)],
  ["무작위", (n) => randomTree(n, 20260908)],
];

/** 자식 번호 정렬의 상한 `Σ kids(v) ⌈log₂ kids(v)⌉` 를 모양 하나에서 센다(뿌리 하나 기준). */
function sortBound(n: number, edges: Edge[]): number {
  const { kids } = childrenFrom(n, edges, 0);
  return kids.reduce(
    (s, k) =>
      s + (k.length <= 1 ? 0 : k.length * Math.ceil(Math.log2(k.length))),
    0,
  );
}

/** 잎 벗기기를 바퀴마다 멈춰 남은 정점을 모은다 — 정본 ② 와 같은 멈춤 조건(남은 정점 2 개 이하). */
function peelStages(n: number, edges: Edge[]): number[][] {
  const link = neighbors(n, edges);
  const left = link.map((row) => row.length);
  let alive = Array.from({ length: n }, (_, v) => v);
  const out = [alive];
  if (n === 1) return out;
  let layer = alive.filter((v) => left[v] === 1);
  while (alive.length > 2) {
    const gone = new Set(layer);
    const next: number[] = [];
    for (const v of layer) {
      left[v] = 0;
      for (const w of link[v] as number[]) {
        if ((left[w] as number) > 0) {
          left[w] = (left[w] as number) - 1;
          if (left[w] === 1) next.push(w);
        }
      }
    }
    alive = alive.filter((v) => !gone.has(v));
    out.push(alive);
    layer = next;
  }
  return out;
}

/** 정점 모임 `keep` 만 남긴 부분 그래프에서의 이심률. */
function eccWithin(edges: Edge[], keep: number[]): Map<number, number> {
  const inside = new Set(keep);
  const link = new Map<number, number[]>(keep.map((v) => [v, []]));
  for (const [u, v] of edges) {
    if (!inside.has(u) || !inside.has(v)) continue;
    (link.get(u) as number[]).push(v);
    (link.get(v) as number[]).push(u);
  }
  const out = new Map<number, number>();
  for (const s0 of keep) {
    const dist = new Map<number, number>([[s0, 0]]);
    const queue = [s0];
    for (let i = 0; i < queue.length; i++) {
      const x = queue[i] as number;
      for (const y of link.get(x) as number[]) {
        if (dist.has(y)) continue;
        dist.set(y, (dist.get(x) as number) + 1);
        queue.push(y);
      }
    }
    out.set(s0, Math.max(...dist.values()));
  }
  return out;
}

/** 정점 100,000 짜리 두 트리 — 생성식 무작위 트리와 그 번호를 섞은 트리. */
const BIG = once(() => {
  const a = randomTree(N_LIMIT, 20260908);
  const b = relabel(N_LIMIT, a, 4321);
  return { a, b, m: meter(N_LIMIT, a, b), one: oneRunOps(N_LIMIT, a) };
});

/** 뿌리 자리 셋이 틀리는 짝 — 정점 4 ~ 7, 라벨 붙은 트리 앞의 120 벌끼리. */
const ROOT_SWEEP = once(() => {
  const rows: {
    n: number;
    seen: number;
    zero: number;
    all: number;
    ctr: number;
  }[] = [];
  for (let n = 4; n <= 7; n++) {
    const trees = [...allTrees(n)].slice(0, 120);
    const row = { n, seen: 0, zero: 0, all: 0, ctr: 0 };
    for (const a of trees) {
      for (const b of trees) {
        row.seen++;
        const want = byMapping(n, a, b);
        if (variant(n, a, b, "zero").answer !== want) row.zero++;
        if (variant(n, a, b, "all").answer !== want) row.all++;
        if (treeIsomorphism(n, a, b) !== want) row.ctr++;
      }
    }
    rows.push(row);
  }
  return rows;
});

/** 「아이디어를 떠올리는 과정」의 시도 사다리가 쓰는 수. */
export const ladderNumbers = once(() => {
  const big = BIG();
  return {
    n: N_LIMIT,
    digits: factorialDigits(N_LIMIT),
    pqSeqSame:
      neighbors(PQ_N, TREE_P)
        .map((r) => r.length)
        .sort((x, y) => x - y)
        .join() ===
      neighbors(PQ_N, TREE_Q)
        .map((r) => r.length)
        .sort((x, y) => x - y)
        .join(),
    pqAnswer: treeIsomorphism(PQ_N, TREE_P, TREE_Q),
    zeroWrong: ROOT_SWEEP().reduce((s, r) => s + r.zero, 0),
    zeroSeen: ROOT_SWEEP().reduce((s, r) => s + r.seen, 0),
    allEstimate: 2 * (N_LIMIT - 1) + (N_LIMIT + 1) * big.one,
    centerOps: big.m.ops,
  };
});

/* ────────────────────────── 블록 ────────────────────────── */

const WALK_METER = once(() => meter(WALK_N, TREE_A, TREE_B));

/** B 를 뿌리 `r` 에 두고 매긴 번호 — 전개 입력의 실제 판정에서 받은 수. */
const bCode = (r: number): number[] => RUN.bAt.get(r) as number[];

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 정점 번호를 옮기는 대응 하나와 그 대응 아래의 간선. */
  "concept-map": () => {
    const phi = mappingFrom(
      WALK_N,
      TREE_A,
      RUN.aRoot,
      TREE_B,
      RUN.cB[1] as number,
    );
    const rows = mapsEdges(TREE_A, TREE_B, phi).map((e) => [
      `(${e.from[0]}, ${e.from[1]})`,
      `(${e.to[0]}, ${e.to[1]})`,
      e.ok ? "있다" : "없다",
    ]);
    const ok = rows.filter((r) => r[2] === "있다").length;
    return [
      md(["A 의 간선", "번호를 옮긴 간선", "B 의 간선 여부"], rows),
      "",
      `대응은 A 의 정점 0 ~ 7 을 차례로 B 의 ${phi.join(" · ")} 로 옮깁니다. A 의 간선 ${TREE_A.length} 개 가운데 옮긴 간선이 B 에 있는 것은 ${ok} 개입니다.`,
    ].join("\n");
  },

  /** `concept` — 두 트리의 모양 번호와 뿌리의 번호. */
  "concept-codes": () => {
    const rb = RUN.cB[1] as number;
    const phi = mappingFrom(WALK_N, TREE_A, RUN.aRoot, TREE_B, rb);
    const cb = bCode(rb);
    const rows = RUN.aCode.map((c, v) => [
      `${v}`,
      `${c}`,
      `${phi[v]}`,
      `${cb[phi[v] as number]}`,
    ]);
    const same = rows.filter((r) => r[1] === r[3]).length;
    return [
      md(
        [
          "A 의 정점",
          `A 에서의 모양 번호 (뿌리 ${RUN.aRoot})`,
          "대응하는 B 의 정점",
          `B 에서의 모양 번호 (뿌리 ${rb})`,
        ],
        rows,
        [1, 3],
      ),
      "",
      `대응하는 두 정점의 모양 번호가 ${rows.length} 쌍 가운데 ${same} 쌍에서 같습니다. 두 뿌리의 번호는 ${RUN.aCode[RUN.aRoot]}${과와(RUN.aCode[RUN.aRoot] as number)} ${cb[rb]} 입니다.`,
    ].join("\n");
  },

  /** `concept` — 정점 100,000 개에서 두 방법의 규모. */
  "concept-scale": () => {
    const m = BIG().m;
    return columns([
      ["정점 N", "정점 대응의 가짓수 N!", "AHU 정규형의 기본 연산"],
      [
        comma(N_LIMIT),
        `${comma(factorialDigits(N_LIMIT))} 자리 수`,
        comma(m.ops),
      ],
    ]);
  },

  /** `deep.origin` ② — 대응을 전부 해 보는 절차의 계수. */
  "origin-naive": () => {
    const rows: string[][] = [];
    for (const n of [6, 7, 8, 9]) {
      const a = broomAt(n, 1);
      const b = broomAt(n, 2);
      const naive = naiveOps(n, a, b);
      if (naive.answer !== treeIsomorphism(n, a, b)) {
        throw new Error("대응을 전부 해 보는 판이 정본과 다른 답을 냈다");
      }
      rows.push([
        comma(n),
        comma(factorial(n)),
        comma(naive.tried),
        comma(naive.ops),
        comma(meter(n, a, b).ops),
      ]);
    }
    const bigM = BIG().m;
    rows.push([
      comma(20),
      comma(factorial(20)),
      "재지 않았다",
      "재지 않았다",
      comma(meter(20, broomAt(20, 1), broomAt(20, 2)).ops),
    ]);
    rows.push([
      comma(N_LIMIT),
      `${comma(factorialDigits(N_LIMIT))} 자리 수`,
      "재지 않았다",
      "재지 않았다",
      comma(bigM.ops),
    ]);
    return [
      md(
        [
          "정점 N",
          "정점 대응의 가짓수 N!",
          "해 본 대응",
          "대응을 전부 해 보기의 기본 연산",
          "AHU 정규형의 기본 연산",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `정점 6 ~ 9 와 20 은 사슬의 둘째 정점에 잎을 단 트리와 셋째 정점에 잎을 단 트리를 비교했습니다. 두 트리가 동형이 아니라 해 본 대응이 N! 과 같습니다. 정점 20 과 ${comma(N_LIMIT)} 의 N! 은 곱셈으로 계산한 값이고, 정점 ${comma(N_LIMIT)} 의 AHU 정규형은 생성식 무작위 트리와 그 번호를 섞은 트리를 비교해 센 값입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 차수 수열이 같은데 동형이 아닌 짝. */
  "origin-degree": () => {
    const seq = (e: Edge[]): string =>
      neighbors(PQ_N, e)
        .map((row) => row.length)
        .sort((a, b) => a - b)
        .join(" ");
    const rows = [
      ["P", pairs(TREE_P), seq(TREE_P)],
      ["Q", pairs(TREE_Q), seq(TREE_Q)],
    ];
    const same = rows[0]?.[2] === rows[1]?.[2];
    const verdict = treeIsomorphism(PQ_N, TREE_P, TREE_Q);
    const byDef = byMapping(PQ_N, TREE_P, TREE_Q);
    return [
      md(["트리", "간선 목록", "차수 수열"], rows),
      "",
      `두 차수 수열이 ${same ? "글자 그대로 같습니다" : "서로 다릅니다"}. 정점 대응을 되추적으로 찾으면 ${byDef ? "대응이 있고" : "대응이 없고"}, 정본의 답도 ${verdict} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 차수 수열이 언제부터 모양을 못 가르는가. */
  "origin-degree-count": () => {
    const rows = CENSUS().map((c) => [
      comma(c.n),
      comma(c.classes),
      comma(c.degSeqs),
    ]);
    const first = CENSUS().find((c) => c.degSeqs < c.classes) as Census;
    return [
      md(["정점 N", "서로 다른 모양", "서로 다른 차수 수열"], rows, [0, 1, 2]),
      "",
      `차수 수열의 가짓수가 모양의 가짓수보다 처음 적어지는 정점 수는 ${first.n} 이고, 그때 모양 ${first.classes} 가지에 차수 수열은 ${first.degSeqs} 가지입니다. 모양의 가짓수는 라벨 붙은 트리를 전부 만들어 모양 번호로 묶어 셌고, 묶음마다 되추적으로 다시 판정했습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로: 모든 정점을 뿌리로 · 중심을 뿌리로. */
  "origin-two-ways": () => {
    const rows: string[][] = [];
    const add = (label: string, n: number, a: Edge[], b: Edge[]) => {
      const all = variant(n, a, b, "all");
      const ctr = meter(n, a, b);
      rows.push([
        label,
        "모든 정점을 뿌리로",
        comma(all.runs),
        comma(all.ops),
        String(all.answer),
      ]);
      rows.push([
        label,
        "중심을 뿌리로",
        comma(ctr.rootedRuns),
        comma(ctr.ops),
        String(ctr.answer),
      ]);
    };
    add("전개 입력 (정점 8)", WALK_N, TREE_A, TREE_B);
    add("P 대 Q (정점 6)", PQ_N, TREE_P, TREE_Q);
    const r = randomTree(1024, 20260908);
    add("무작위 (정점 1,024)", 1024, r, relabel(1024, r, 4321));
    const one = BIG().one;
    const bigC = BIG().m;
    const label = `무작위 (정점 ${comma(N_LIMIT)})`;
    rows.push([
      label,
      "모든 정점을 뿌리로",
      `많아야 ${comma(N_LIMIT + 1)}`,
      `어림 ${comma(2 * (N_LIMIT - 1) + (N_LIMIT + 1) * one)}`,
      "재지 않았다",
    ]);
    rows.push([
      label,
      "중심을 뿌리로",
      comma(bigC.rootedRuns),
      comma(bigC.ops),
      String(bigC.answer),
    ]);
    return [
      md(
        ["입력", "뿌리를 두는 자리", "번호를 매긴 벌 수", "기본 연산", "답"],
        rows,
        [2, 3],
      ),
      "",
      `모든 정점을 뿌리로 두는 판은 A 의 정점 0 에서 번호를 한 벌 매기고, B 의 정점을 0 부터 차례로 뿌리로 삼다가 번호가 같은 뿌리를 만나면 멈춥니다. 앞의 세 입력은 두 판을 실제로 실행했고, 두 판의 답이 서로 같습니다. 마지막 입력의 모든 정점 판은 실행하지 않고, 뿌리 하나의 기본 연산 ${comma(one)} 번에 벌 수 ${comma(N_LIMIT + 1)}${을를(comma(N_LIMIT + 1))} 곱하고 간선 읽기를 더해 늘린 어림입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 뿌리 자리 셋이 틀리는 짝. */
  "origin-roots": () => {
    const sweep = ROOT_SWEEP();
    const rows = sweep.map((r) => [
      comma(r.n),
      comma(r.seen),
      comma(r.zero),
      comma(r.all),
      comma(r.ctr),
    ]);
    const zeroTotal = sweep.reduce((s0, r) => s0 + r.zero, 0);
    return [
      md(
        [
          "정점 N",
          "비교한 짝",
          "정점 0 에 뿌리를 둔 판이 틀린 짝",
          "모든 정점을 뿌리로 둔 판이 틀린 짝",
          "중심에 뿌리를 둔 판이 틀린 짝",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `정점 0 에 뿌리를 둔 판이 틀린 짝은 모두 ${comma(zeroTotal)} 개입니다. 옳은 답은 정점 대응을 되추적으로 찾아 정했고, 라벨 붙은 트리를 프뤼퍼 수열 차례로 만들어 앞의 120 벌까지 서로 전부 짝지었습니다.`,
    ].join("\n");
  },

  /** `deep.build` (b) — 전개 입력 A 를 중심 2 에 두고 매긴 모양 번호. */
  "build-codes": () => {
    const { kids } = childrenFrom(WALK_N, TREE_A, RUN.aRoot);
    const rows = RUN.aCode.map((c, v) => {
      const ks = kids[v] as number[];
      const sorted = ks
        .map((w) => RUN.aCode[w] as number)
        .sort((a, b) => a - b);
      return [
        `${v}`,
        ks.length === 0 ? "없음" : ks.join(" · "),
        keyText(sorted.join(",")),
        `${c}`,
      ];
    });
    const kinds = new Set(RUN.aCode).size;
    return [
      md(["정점 v", "자식", "열쇠", "모양 번호"], rows, [3]),
      "",
      `정점 ${WALK_N} 개에 모양 번호가 ${kinds} 가지 붙었습니다. 잎 ${RUN.aCode.filter((c) => c === 0).length} 개가 모양 번호 0 을 함께 씁니다.`,
    ].join("\n");
  },

  /** `deep.build` (c) — 모양 번호 하나를 괄호 문자열로 펴 읽는다. */
  "build-read": () => {
    const keys = [...RUN.table.keys()];
    const used = [...new Set(RUN.aCode)].sort(
      (x, y) => bracketOf(x, RUN.table).length - bracketOf(y, RUN.table).length,
    );
    const rows = used.map((c) => {
      const key = keys[c] as string;
      return [`${c}`, keyText(key), bracketOf(c, RUN.table)];
    });
    const top = bracketOf(RUN.aCode[RUN.aRoot] as number, RUN.table);
    return [
      md(["모양 번호", "열쇠", "괄호 문자열"], rows),
      "",
      `뿌리 ${RUN.aRoot} 의 모양 번호 ${RUN.aCode[RUN.aRoot]}${을를(RUN.aCode[RUN.aRoot] as number)} 끝까지 펴면 괄호 ${top.length} 개이고, 여는 괄호 ${[...top].filter((c) => c === "(").length} 개가 정점 ${WALK_N} 개와 하나씩 짝입니다.`,
    ].join("\n");
  },

  /** `deep.build` (d) — 같은 번호를 받은 정점끼리는 뿌리째 동형인가. */
  "build-relation": () => {
    const rb = RUN.cB[1] as number;
    const cb = bCode(rb);
    const ka = childrenFrom(WALK_N, TREE_A, RUN.aRoot).kids;
    const kb = childrenFrom(WALK_N, TREE_B, rb).kids;
    const codes = [...new Set([...RUN.aCode, ...cb])].sort((x, y) => x - y);
    let pairsChecked = 0;
    let pairsIso = 0;
    const rows = codes.map((c) => {
      const inA = RUN.aCode.flatMap((x, v) => (x === c ? [v] : []));
      const inB = cb.flatMap((x, v) => (x === c ? [v] : []));
      for (const x of inA) {
        for (const y of inB) {
          pairsChecked++;
          if (rootedIso(ka, x, kb, y)) pairsIso++;
        }
      }
      return [`${c}`, inA.join(" · "), inB.join(" · ")];
    });
    let crossChecked = 0;
    let crossIso = 0;
    for (let x = 0; x < WALK_N; x++) {
      for (let y = 0; y < WALK_N; y++) {
        if (RUN.aCode[x] === cb[y]) continue;
        crossChecked++;
        if (rootedIso(ka, x, kb, y)) crossIso++;
      }
    }
    return [
      md(
        [
          "모양 번호",
          `A 에서 받은 정점 (뿌리 ${RUN.aRoot})`,
          `B 에서 받은 정점 (뿌리 ${rb})`,
        ],
        rows,
        [0],
      ),
      "",
      `번호가 같은 A · B 정점 짝 ${pairsChecked} 개 가운데 두 부분트리가 뿌리째 동형인 짝이 ${pairsIso} 개이고, 번호가 다른 짝 ${crossChecked} 개 가운데 뿌리째 동형인 짝은 ${crossIso} 개입니다. 뿌리째 동형인지는 모양 번호를 쓰지 않고 자식끼리의 대응을 되추적으로 찾아 정했습니다.`,
    ].join("\n");
  },

  /** `deep.build` (e) — 같은 트리 B 를 두 중심에 두고 매긴 번호. */
  "build-contrast": () => {
    const [r1, r2] = RUN.cB as [number, number];
    const c1 = bCode(r1);
    const c2 = bCode(r2);
    const s1 = childrenFrom(WALK_N, TREE_B, r1).kids;
    const s2 = childrenFrom(WALK_N, TREE_B, r2).kids;
    const size = (kids: number[][], v: number): number =>
      1 + (kids[v] as number[]).reduce((s, w) => s + size(kids, w), 0);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      `${v}`,
      `${c1[v]}`,
      `${size(s1, v)}`,
      `${c2[v]}`,
      `${size(s2, v)}`,
    ]);
    const diff = rows.filter((r) => r[1] !== r[3]).map((r) => r[0]);
    return [
      md(
        [
          "B 의 정점",
          `모양 번호 (뿌리 ${r1})`,
          `부분트리 정점 수 (뿌리 ${r1})`,
          `모양 번호 (뿌리 ${r2})`,
          `부분트리 정점 수 (뿌리 ${r2})`,
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `정점 ${WALK_N} 개 가운데 뿌리에 따라 모양 번호가 달라진 정점은 ${diff.join(" · ")} 의 ${diff.length} 개입니다. 정점 번호는 그대로이고, 달라진 것은 그 정점 아래에 매달린 부분트리입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 이웃 목록 둘. */
  "build-lists": () => {
    const la = neighbors(WALK_N, TREE_A);
    const lb = neighbors(WALK_N, TREE_B);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      `${v}`,
      show(la[v] as number[]),
      show(lb[v] as number[]),
    ]);
    const slots = la.reduce((s, r) => s + r.length, 0);
    const seqA = la
      .map((r) => r.length)
      .sort((x, y) => x - y)
      .join(" ");
    const seqB = lb
      .map((r) => r.length)
      .sort((x, y) => x - y)
      .join(" ");
    return [
      md(["정점 v", "A 의 이웃 목록", "B 의 이웃 목록"], rows),
      "",
      `트리마다 목록 길이를 더하면 ${slots} 이고, 간선 ${TREE_A.length} 개의 두 배입니다. 목록 길이를 크기 순으로 적으면 A 가 ${seqA}, B 가 ${seqB} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 바퀴마다 벗긴 잎. */
  "build-peel": () => {
    const rows = WALK.steps
      .filter((s) => s.kind === "peel")
      .map((s) => {
        const side = s.tree as Side;
        return [
          side,
          `${s.round}`,
          (s.leaves as number[]).join(" · "),
          (s.touched as number[]).length === 0
            ? "없음"
            : [...new Set(s.touched as number[])].join(" · "),
          `${s.alive}`,
          s.left[side].join(" "),
        ];
      });
    const cA = RUN.cA;
    const cB = RUN.cB;
    return [
      md(
        [
          "트리",
          "바퀴",
          "벗긴 잎",
          "차수가 줄어든 이웃",
          "남은 정점",
          "남은 차수 (정점 0 ~ 7)",
        ],
        rows,
        [1, 4],
      ),
      "",
      `남은 차수는 벗긴 정점을 0 으로 적었습니다. 남은 정점이 2 개가 된 바퀴에서 멈추고, A 에는 ${cA.join(" · ")}, B 에는 ${cB.join(" · ")}${이가(cB.at(-1) as number)} 남습니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 중심이 하나인 경우와 경계. */
  "build-peel-edge": () => {
    const cases: [string, number, Edge[]][] = [
      ["정점 하나", 1, []],
      ["정점 둘", 2, chain(2)],
      ["사슬 다섯", 5, chain(5)],
      ["사슬 여섯", 6, chain(6)],
      ["별 여덟", 8, star(8, 0)],
    ];
    const rows = cases.map(([label, n, e]) => {
      const c = centers(n, neighbors(n, e));
      return [label, comma(n), comma(peelRounds(n, e)), c.join(" · ")];
    });
    return [
      md(["입력", "정점 N", "벗긴 바퀴", "중심"], rows, [1, 2]),
      "",
      "정점 하나는 벗기기 전에 그 정점을 돌려주고, 정점 둘은 남은 정점이 처음부터 2 개라 한 바퀴도 벗기지 않습니다.",
    ].join("\n");
  },

  /** `deep.build` 3단계 — 중심 개수가 다르면 번호를 매기지 않는다. */
  "build-count": () => {
    const pick = [
      "전개 입력",
      "사슬 여덟 대 별 여덟",
      "중심이 하나인 트리 대 중심이 둘인 트리",
    ];
    const rows = SHAPES.filter((s) => pick.includes(s.label)).map((s) => {
      const m = meter(s.n, s.a, s.b);
      return [
        s.label,
        `${m.centers1}${과와(m.centers1)} ${m.centers2}`,
        comma(m.rootedRuns),
        String(m.answer),
      ];
    });
    return [
      md(
        ["입력", "두 트리의 중심 개수", "모양 번호를 매긴 벌 수", "답"],
        rows,
        [2],
      ),
      "",
      "중심 개수가 다른 두 입력은 모양 번호를 한 벌도 매기지 않고 false 로 끝났습니다.",
    ].join("\n");
  },

  /** `deep.build` 4단계 — B 를 중심 6 에 두고 방문 차례를 적는다. */
  "build-order": () => {
    const r = RUN.cB[0] as number;
    const link = neighbors(WALK_N, TREE_B);
    const parent: number[] = Array.from({ length: WALK_N }, () => -1);
    const order: number[] = [r];
    const rows: string[][] = [];
    for (let i = 0; i < order.length; i++) {
      const v = order[i] as number;
      const added: number[] = [];
      const skipped: number[] = [];
      for (const w of link[v] as number[]) {
        if (w !== parent[v]) {
          parent[w] = v;
          order.push(w);
          added.push(w);
        } else skipped.push(w);
      }
      rows.push([
        `${i}`,
        `${v}`,
        skipped.length === 0 ? "없음" : skipped.join(" · "),
        added.length === 0 ? "없음" : added.join(" · "),
        show(order),
      ]);
    }
    const ok = TREE_B.filter(([a, b]) => {
      const [p, c] = parent[b] === a ? [a, b] : [b, a];
      return order.indexOf(p) < order.indexOf(c);
    }).length;
    return [
      md(
        [
          "자리 i",
          "읽은 정점 v",
          "부모라 건너뛴 이웃",
          "새로 담은 자식",
          "그 뒤 order",
        ],
        rows,
        [0],
      ),
      "",
      `parent 는 ${show(parent)} 입니다. 간선 ${TREE_B.length} 개 가운데 order 에서 부모가 자식보다 앞에 놓인 간선은 ${ok} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 5단계 — B 를 중심 6 에 두고 거꾸로 읽으며 번호를 받는다. */
  "build-number": () => {
    const r = RUN.cB[0] as number;
    const rows = WALK.steps
      .filter((s) => s.kind === "code" && s.tree === "B" && s.root === r)
      .map((s) => [
        `${s.i}`,
        `${s.v}`,
        show(s.raw as number[]),
        keyText(s.key as string),
        `${s.code[s.v as number]}`,
        s.fresh ? "새로 줬다" : "있던 번호",
      ]);
    const fresh = rows.filter((x) => x[5] === "새로 줬다").length;
    return [
      md(
        ["자리 i", "정점 v", "모은 자식 번호", "열쇠", "모양 번호", "번호표"],
        rows,
        [0, 4],
      ),
      "",
      `번호를 받은 정점 ${rows.length} 개 가운데 번호표에 새 열쇠를 더한 정점은 ${fresh} 개입니다. 마지막에 번호를 받는 것이 뿌리 ${r} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 5단계 — 자식이 적힌 차례가 다른 두 정점. */
  "build-sort": () => {
    const aStep = WALK.steps.find(
      (s) => s.kind === "code" && s.tree === "A" && s.v === RUN.aRoot,
    ) as Snap;
    const rb = RUN.cB[1] as number;
    const bStep = WALK.steps.find(
      (s) => s.kind === "code" && s.tree === "B" && s.root === rb && s.v === rb,
    ) as Snap;
    const row = (name: string, s: Snap): string[] => [
      name,
      (s.kids as number[]).join(" · "),
      show(s.raw as number[]),
      keyText((s.raw as number[]).join(",")),
      keyText(s.key as string),
    ];
    const rawSame =
      (aStep.raw as number[]).join(",") === (bStep.raw as number[]).join(",");
    return [
      md(
        [
          "정점",
          "자식 (이웃 목록 차례)",
          "모은 자식 번호",
          "정렬하지 않은 열쇠",
          "정렬한 열쇠",
        ],
        [
          row(`A 의 ${aStep.v} (뿌리 ${RUN.aRoot})`, aStep),
          row(`B 의 ${bStep.v} (뿌리 ${rb})`, bStep),
        ],
      ),
      "",
      `정렬하지 않은 두 열쇠는 ${rawSame ? "같고" : "서로 다르고"}, 정렬한 두 열쇠는 ${aStep.key === bStep.key ? "같습니다" : "서로 다릅니다"}.`,
    ].join("\n");
  },

  /** `deep.build` 6단계 — 뿌리의 번호를 비교한다. */
  "build-match": () => {
    const rows: string[][] = [];
    for (const r of RUN.cB)
      rows.push([
        "B",
        `${r}`,
        `${bCode(r)[r]}`,
        "B 의 중심 번호 목록에 넣는다",
      ]);
    const code2 = RUN.cB.map((r) => bCode(r)[r] as number);
    const a = RUN.aCode[RUN.aRoot] as number;
    rows.push([
      "A",
      `${RUN.aRoot}`,
      `${a}`,
      `${show(code2)} 안에 ${code2.includes(a) ? "있어 true" : "없다"}`,
    ]);
    return [
      md(["트리", "뿌리", "뿌리의 모양 번호", "하는 일"], rows, [2]),
      "",
      `A 의 중심 ${RUN.cA.join(" · ")} 가운데 첫 중심 ${RUN.aRoot} 에서 답이 정해져, 둘째 중심 ${RUN.cA[1]}${은는(RUN.cA[1] as number)} 번호를 매기지 않습니다.`,
    ].join("\n");
  },

  /** `deep.build` — 상태의 범위. */
  "build-ranges": () => {
    const w = WALK_METER();
    const star8 = meter(8, star(8, 0), star(8, 7));
    const chain8 = meter(8, chain(8), relabel(8, chain(8), 5));
    const odd = SHAPES.find(
      (s) => s.label === "잎이 한곳에 몰린 여섯 대 두 곳으로 갈린 여섯",
    ) as Shape;
    const oddM = meter(odd.n, odd.a, odd.b);
    return [
      md(
        ["상태", "범위", "전개 입력에서 나온 값", "끝값이 나오는 자리"],
        [
          [
            "중심 개수",
            "1 또는 2",
            `${RUN.cA.length} · ${RUN.cB.length}`,
            `별 여덟은 1 · 사슬 여덟은 2`,
          ],
          [
            "모양 번호를 매긴 벌 수",
            "0 이상 4 이하",
            `${w.rootedRuns}`,
            `사슬 여덟 대 별 여덟은 0 · ${odd.label}은 ${oddM.rootedRuns}`,
          ],
          [
            "모양 번호표의 열쇠 개수 K",
            "1 이상, 매긴 벌 수 × N 이하",
            `${w.tableSize}`,
            `별 여덟 둘은 ${star8.tableSize} · 사슬 여덟 둘은 ${chain8.tableSize} · ${odd.label}은 ${oddM.tableSize} (N = ${odd.n})`,
          ],
          [
            "모양 번호",
            "0 이상 K − 1 이하",
            `0 ~ ${w.tableSize - 1}`,
            "처음 본 열쇠가 K − 1 을 받는다",
          ],
        ],
      ),
    ].join("\n");
  },

  /** `deep.build` 전제 — 트리가 아닌 입력. */
  "build-premise": () => {
    const cyc: Edge[] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ];
    const tri: Edge[] = [
      [0, 1],
      [1, 2],
      [2, 0],
    ];
    const cap = 1000;
    const a = cappedPeel(4, cyc, cap);
    const b = cappedPeel(4, tri, cap);
    return [
      md(
        ["입력", "깨진 전제", "처음 잎", `${comma(cap)} 바퀴 뒤 남은 정점`],
        [
          [
            "정점 4 · 간선 (0,1) (1,2) (2,3) (3,0)",
            "사이클이 없다",
            a.firstLeaves.length === 0 ? "없음" : a.firstLeaves.join(" · "),
            `${a.alive}`,
          ],
          [
            "정점 4 · 간선 (0,1) (1,2) (2,0)",
            "이어져 있다",
            b.firstLeaves.length === 0 ? "없음" : b.firstLeaves.join(" · "),
            `${b.alive}`,
          ],
        ],
        [3],
      ),
      "",
      `두 입력 다 간선이 N − 1 개가 아니거나 하나로 이어지지 않아 차수 1 인 정점이 처음부터 없습니다. 벗길 잎이 없으니 남은 정점이 줄지 않고, 바퀴에 상한을 둔 사본이 ${comma(cap)} 바퀴에서 끊었습니다. 정본은 상한이 없어 이 입력에서 끝나지 않습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 수 해시를 폭마다 시험한다. */
  "build-hash": () => {
    const rows = HASH_BITS.map((bits) => {
      const hit = firstCollision(bits, HASH_N, HASH_LIMIT);
      return [
        `${bits} 비트`,
        comma(2 ** bits),
        hit === null ? `${comma(HASH_LIMIT)} 벌까지 못 찾음` : comma(hit.at),
      ];
    });
    return [
      md(["해시 폭", "쓸 수 있는 수", "처음 충돌한 트리의 차례"], rows, [1, 2]),
      "",
      `정점 ${HASH_N} 짜리 생성식 무작위 트리를 차례로 만들어, 앞서 만든 트리와 같은 수로 접히는데 정본이 동형이 아니라고 답하는 첫 트리를 찾았습니다. 폭을 ${HASH_BITS[0]} 비트에서 ${HASH_BITS.at(-1)} 비트로 넓혀도 충돌이 늦게 나올 뿐 ${comma(HASH_LIMIT)} 벌 안에서 사라지지 않았습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 폭을 좁히면 정점 아홉에서도 충돌이 보인다. */
  "build-hash-small": () => {
    const hit = firstCollision(8, SMALL_N, 200_000);
    if (hit === null) throw new Error("8 비트에서 충돌을 못 찾았다");
    const seq = (e: Edge[]): string =>
      neighbors(SMALL_N, e)
        .map((row) => row.length)
        .sort((a, b) => a - b)
        .join(" ");
    return [
      md(
        ["트리", "간선 목록", "차수 수열", "8 비트 해시"],
        [
          ["앞의 트리", pairs(hit.a), seq(hit.a), comma(hit.value)],
          ["뒤의 트리", pairs(hit.b), seq(hit.b), comma(hit.value)],
        ],
        [3],
      ),
      "",
      `두 트리가 같은 수 ${comma(hit.value)}${으로(comma(hit.value))} 접히는데 정본의 답은 ${treeIsomorphism(SMALL_N, hit.a, hit.b)} 입니다. 차수 수열부터 서로 다른 두 트리입니다.`,
    ].join("\n");
  },

  /** `deep.walk` — 끝까지 쓰는 고정 입력. */
  "walk-input": () => {
    const list = (es: Edge[]): string =>
      `[${es.map(([u, v]) => `[${u}, ${v}]`).join(", ")}]`;
    return [
      `const n = ${WALK_N};`,
      `const edges1: Edge[] = ${list(TREE_A)};`,
      `const edges2: Edge[] = ${list(TREE_B)};`,
      `// 이 절이 끝나면 반환값은 ${treeIsomorphism(WALK_N, TREE_A, TREE_B)}`,
    ].join("\n");
  },

  /** `deep.walk` — 이웃 목록 둘(T1). */
  "walk-adj": () => {
    const la = neighbors(WALK_N, TREE_A);
    const lb = neighbors(WALK_N, TREE_B);
    const lines = Array.from({ length: WALK_N }, (_, v) => [
      `A link[${v}] = ${show(la[v] as number[])}`,
      `B link[${v}] = ${show(lb[v] as number[])}`,
    ]);
    const slots = la.reduce((s, r) => s + r.length, 0);
    return [
      columns(lines),
      `항목 수의 합 A ${slots} · B ${lb.reduce((s, r) => s + r.length, 0)} = 간선 ${TREE_A.length} 개의 두 배`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 차수 수열과 지름이 같아도 동형이 아니다. */
  "pause-degree": () => {
    const rows: string[][] = [];
    const codes: string[] = [];
    const table = new Map<string, number>();
    for (const [name, t] of [
      ["P", TREE_P],
      ["Q", TREE_Q],
    ] as [string, Edge[]][]) {
      const link = neighbors(PQ_N, t);
      const roots = centers(PQ_N, link);
      const cs = roots.map((r) => shapeCode(PQ_N, link, r, table));
      codes.push(cs.join(" · "));
      rows.push([
        name,
        link
          .map((r) => r.length)
          .sort((a, b) => a - b)
          .join(" "),
        `${diameter(PQ_N, t)}`,
        roots.join(" · "),
        cs.join(" · "),
      ]);
    }
    return [
      md(["트리", "차수 수열", "지름", "중심", "중심의 모양 번호"], rows, [2]),
      "",
      `두 트리의 차수 수열과 지름은 서로 같고, 중심의 모양 번호는 ${codes[0]}${과와(codes[0] as string)} ${codes[1]}${으로(codes[1] as string)} 서로 다릅니다. 정본의 답은 ${treeIsomorphism(PQ_N, TREE_P, TREE_Q)} 입니다. 두 트리는 모양 번호표 하나를 함께 썼습니다.`,
    ].join("\n");
  },

  /** `deep.walk` — 잎 벗기기(T2~T5). */
  "walk-center": () => {
    const rows = WALK.steps.flatMap((s, k) => {
      if (s.kind !== "peel") return [];
      const side = s.tree as Side;
      return [
        [
          stepOf(k),
          side,
          `${s.round}`,
          (s.leaves as number[]).join(" · "),
          `${s.alive}`,
          `alive > 2 ${(s.alive as number) > 2 ? "참 — 다음 바퀴" : "거짓 — 멈춘다"}`,
          s.found[side] === null
            ? "—"
            : (s.found[side] as number[]).join(" · "),
        ],
      ];
    });
    return [
      md(
        [
          "걸음",
          "트리",
          "바퀴",
          "벗긴 잎",
          "그 뒤 alive",
          "반복 조건",
          "돌려준 중심",
        ],
        rows,
        [2, 4],
      ),
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
        `${ca.length}${과와(ca.length)} ${cb.length}`,
        String(want),
        String(got),
        want === got ? "같다" : "다르다",
      ];
    });
    return [
      md(
        ["입력", "두 트리의 중심 개수", "정본", "앞의 중심만 보는 판", "두 답"],
        rows,
      ),
    ].join("\n");
  },

  /** `deep.walk.pause` — 중심 개수 비교를 빼도 답이 안 틀린다. */
  "pause-count": () => {
    const rows = SHAPES.map((s) => {
      const want = treeIsomorphism(s.n, s.a, s.b);
      const got = noCount.treeIsomorphism(s.n, s.a, s.b);
      const with_ = meter(s.n, s.a, s.b);
      const without = meter(s.n, s.a, s.b, true);
      return [
        s.label,
        `${with_.centers1}${과와(with_.centers1)} ${with_.centers2}`,
        String(want),
        String(got),
        want === got ? "같다" : "다르다",
        comma(with_.ops),
        comma(without.ops),
      ];
    });
    const sweep = COUNT_SWEEP();
    return [
      md(
        [
          "입력",
          "두 트리의 중심 개수",
          "정본",
          "비교를 뺀 판",
          "두 답",
          "정본의 기본 연산",
          "뺀 판의 기본 연산",
        ],
        rows,
        [5, 6],
      ),
      "",
      `정점 일곱까지 라벨 붙은 트리를 앞에서부터 120 벌씩 전부 짝지은 ${comma(sweep.pairs)} 짝에서도 두 판의 답이 갈린 짝은 ${comma(sweep.off)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.walk` — 뿌리마다의 방문 차례(T7 · T16 · T25). */
  "walk-order": () => {
    const rows = WALK.steps.flatMap((s, k) =>
      s.kind === "order"
        ? [
            [
              stepOf(k),
              s.tree as string,
              `${s.root}`,
              show(s.order),
              show(s.parent as number[]),
            ],
          ]
        : [],
    );
    return [
      md(["걸음", "트리", "뿌리", "order", "parent (정점 0 ~ 7)"], rows),
    ].join("\n");
  },

  /** `deep.walk` — 뿌리 6 에서 번호를 받는 여덟 걸음. */
  "walk-number": () => {
    const r = RUN.cB[0] as number;
    const rows = WALK.steps.flatMap((s, k) =>
      s.kind === "code" && s.tree === "B" && s.root === r
        ? [
            [
              stepOf(k),
              `${s.i}`,
              `${s.v}`,
              show(s.raw as number[]),
              show(s.sorted as number[]),
              JSON.stringify(s.key),
              `${s.fresh ? "undefined — 새로 준다" : "있다"}`,
              `${s.code[s.v as number]}`,
            ],
          ]
        : [],
    );
    return [
      md(
        [
          "걸음",
          "i",
          "v",
          "kids",
          "정렬한 kids",
          "key",
          "table.get(key)",
          "code[v]",
        ],
        rows,
        [1, 7],
      ),
    ].join("\n");
  },

  /** `deep.walk` — 걸음 전체의 조건 판정. */
  "walk-trace": () => {
    const rows = WALK.steps.map((s, k) => {
      let did = "";
      let cond = "";
      let after = "";
      if (s.kind === "build") {
        did = "간선 목록 둘을 이웃 목록 둘로 옮긴다";
        cond = "—";
        after = `link 항목 A ${TREE_A.length * 2} · B ${TREE_B.length * 2}`;
      } else if (s.kind === "peel") {
        did = `${s.tree} 의 잎 ${(s.leaves as number[]).join(" · ")}${을를((s.leaves as number[]).at(-1) as number)} 벗긴다`;
        cond = `alive > 2 참 → 벗긴 뒤 alive = ${s.alive}`;
        after =
          s.found[s.tree as Side] === null
            ? `다음 잎 ${(s.next as number[]).join(" · ")}`
            : `중심 ${(s.found[s.tree as Side] as number[]).join(" · ")} · 반복 끝`;
      } else if (s.kind === "count") {
        did = "두 트리의 중심 개수를 비교한다";
        const la = (s.found.A as number[]).length;
        cond = `root1.length !== root2.length 거짓 (${la}${과와(la)} ${(s.found.B as number[]).length})`;
        after = "번호 매기기로 간다";
      } else if (s.kind === "order") {
        did = `${s.tree} 를 정점 ${s.root} 에 두고 방문 차례를 적는다`;
        const [yes, no] = s.branch as [number, number];
        cond = `w !== parent[v] 참 ${yes} 번 · 거짓 ${no} 번`;
        after = `order ${show(s.order)}`;
      } else if (s.kind === "code") {
        did = `${s.tree} 의 정점 ${s.v} 에 모양 번호를 준다`;
        cond = `table.get(${JSON.stringify(s.key)}) ${s.fresh ? "=== undefined 참" : "=== undefined 거짓"}`;
        after = `code[${s.v}] = ${s.code[s.v as number]}`;
      } else {
        const a = s.code[s.root as number] as number;
        did = `A 의 뿌리 번호를 B 의 중심 번호와 비교한다`;
        cond = `${show(s.code2)}.includes(${a}) ${s.hit ? "참" : "거짓"}`;
        after = `${s.hit} 를 돌려준다`;
      }
      return [stepOf(k), s.labels, did, cond, after];
    });
    const codeSteps = WALK.steps.filter((s) => s.kind === "code");
    const fresh = codeSteps.filter((s) => s.fresh).length;
    return [
      md(["걸음", "갈래", "하는 일", "조건 판정", "그 뒤"], rows),
      "",
      `① 은 ${spanOf((s) => s.kind === "build")}, ② 는 ${spanOf((s) => s.kind === "peel")}, ⑦ 은 ${spanOf((s) => s.kind === "count")}, ⑧ 은 ${spanOf((s) => s.labels.includes("⑧"))}, ③ 은 ${WALK.steps.flatMap((s, k) => (s.kind === "order" ? [stepOf(k)] : [])).join(" · ")}, ④⑤⑥ 은 번호를 받은 ${codeSteps.length} 걸음, ⑨ 는 ${spanOf((s) => s.kind === "match")} 에서 실행됐습니다. 번호를 받은 ${codeSteps.length} 걸음 가운데 새 열쇠를 더한 걸음은 ${fresh} 걸음입니다. 반환값은 ${WALK.answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 여러 입력의 결과. */
  "walk-result": () => {
    const rows = SHAPES.map((s) => [
      s.label,
      String(treeIsomorphism(s.n, s.a, s.b)),
    ]);
    return columns(rows.map(([a, b]) => [a as string, "→", b as string]));
  },

  /** `related` — 같은 값에 대표 번호를 한 번만 주고 그 뒤로는 번호끼리 비교한다. */
  "related-reuse": () => {
    const used = new Map<string, number>();
    for (const s of WALK.steps) {
      if (s.kind !== "code") continue;
      used.set(s.key as string, (used.get(s.key as string) ?? 0) + 1);
    }
    const keyRows = [...RUN.table.entries()].map(([key, id]) => [
      keyText(key),
      `${id}`,
      comma(used.get(key) ?? 0),
    ]);
    const lookups = WALK.steps.filter((s) => s.kind === "code").length;
    return [
      md(["열쇠", "모양 번호", "이 열쇠를 찾은 횟수"], keyRows, [1, 2]),
      "",
      `전개 입력에서 모양 번호표를 ${lookups} 번 찾는 동안 새 열쇠가 ${RUN.table.size} 번 생기고, 나머지 ${lookups - RUN.table.size} 번은 있던 번호를 받았습니다.`,
    ].join("\n");
  },

  /** `related` — 규모가 커질 때 다시 쓴 비율. */
  "related-scale": () => {
    const rows: string[][] = [];
    for (const [name, mk] of WORST_SHAPES) {
      if (name !== "사슬" && name !== "별" && name !== "무작위") continue;
      for (const n of [64, 4096]) {
        const a = mk(n);
        const m = meter(n, a, relabel(n, a, 4321));
        rows.push([
          `${name} ${comma(n)}`,
          comma(m.lookups),
          comma(m.tableSize),
          `${((1 - m.tableSize / m.lookups) * 100).toFixed(1)} %`,
        ]);
      }
    }
    return [
      md(
        [
          "모양",
          "번호표를 찾은 횟수",
          "새로 준 번호",
          "있던 번호를 다시 쓴 비율",
        ],
        rows,
        [1, 2, 3],
      ),
    ].join("\n");
  },

  /** `deep.math` — 사슬 다섯의 이심률. */
  "math-ecc": () => {
    const e = eccs(5, chain(5));
    const d = Math.max(...e);
    const r = Math.min(...e);
    const c = e.flatMap((x, v) => (x === r ? [v] : []));
    return [
      columns([
        ["정점 v", ...e.map((_, v) => `${v}`)],
        ["ecc(v)", ...e.map((x) => `${x}`)],
      ]),
      `d = ${d} · R = ${r} · C(T) = ${setOf(c)}`,
    ].join("\n");
  },

  /** `deep.math` — 한 겹 벗길 때마다 이심률이 1 씩 준다. */
  "math-peel": () => {
    const n = 5;
    const edges = chain(n);
    const names = ["T", "P(T)", "P(P(T))"];
    const lines: string[][] = [];
    let alive = Array.from({ length: n }, (_, v) => v);
    for (const name of names) {
      const inside = new Set(alive);
      const kept = edges.filter(([u, v]) => inside.has(u) && inside.has(v));
      const link = new Map<number, number[]>(alive.map((v) => [v, []]));
      for (const [u, v] of kept) {
        (link.get(u) as number[]).push(v);
        (link.get(v) as number[]).push(u);
      }
      const ecc = alive.map((s0) => {
        const dist = new Map<number, number>([[s0, 0]]);
        const queue = [s0];
        for (let i = 0; i < queue.length; i++) {
          const x = queue[i] as number;
          for (const y of link.get(x) as number[]) {
            if (dist.has(y)) continue;
            dist.set(y, (dist.get(x) as number) + 1);
            queue.push(y);
          }
        }
        return Math.max(...dist.values());
      });
      lines.push([name, alive.join(" - "), `ecc ${ecc.join(" ")}`]);
      alive = alive.filter((v) => (link.get(v) as number[]).length >= 2);
      if (alive.length === 0) break;
    }
    return columns(lines);
  },

  /** `deep.math` — 가장 먼 정점은 잎인가. */
  "math-farthest": () => {
    const link = neighbors(WALK_N, TREE_A);
    const e = eccs(WALK_N, TREE_A);
    let allLeaf = 0;
    const rows = e.map((x, v) => {
      const d = distances(WALK_N, link, v);
      const far = d.flatMap((y, u) => (y === x ? [u] : []));
      const leaf = far.every((u) => (link[u] as number[]).length === 1);
      if (leaf) allLeaf++;
      return [
        `${v}`,
        `${x}`,
        far.join(" · "),
        leaf ? "모두 잎" : "잎이 아닌 정점이 있다",
      ];
    });
    return [
      md(["정점 v", "ecc(v)", "거리가 ecc(v) 인 정점", "잎 여부"], rows, [1]),
      "",
      `전개 입력의 트리 A 에서 정점 ${WALK_N} 개 가운데 가장 먼 정점이 모두 잎인 정점은 ${allLeaf} 개입니다.`,
    ].join("\n");
  },

  /** `deep.math` — 벗길 때마다 지름 · 반지름 · 중심. */
  "math-shrink": () => {
    const shapes: [string, number, Edge[]][] = [
      ["전개 입력 A", WALK_N, TREE_A],
      ["사슬 일곱", 7, chain(7)],
      ["완전 이진 열다섯", 15, binary(15)],
    ];
    const rows: string[][] = [];
    let checked = 0;
    let fits = 0;
    for (const [label, n, edges] of shapes) {
      const stages = peelStages(n, edges);
      const first = eccWithin(edges, stages[0] as number[]);
      const d0 = Math.max(...first.values());
      const r0 = Math.min(...first.values());
      const c0 = (stages[0] as number[]).filter((v) => first.get(v) === r0);
      stages.forEach((keep, k) => {
        const ecc = eccWithin(edges, keep);
        const d = Math.max(...ecc.values());
        const r = Math.min(...ecc.values());
        const c = keep.filter((v) => ecc.get(v) === r);
        checked++;
        if (d === d0 - 2 * k && r === r0 - k && c.join() === c0.join()) fits++;
        rows.push([
          label,
          `${k}`,
          `${keep.length}`,
          `${d}`,
          `${r}`,
          c.join(" · "),
        ]);
      });
    }
    return [
      md(
        ["트리", "벗긴 바퀴 k", "남은 정점", "지름", "반지름", "중심"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `${checked} 줄 가운데 지름이 d − 2k, 반지름이 R − k 이고 중심이 처음과 그대로인 줄은 ${fits} 줄입니다.`,
    ].join("\n");
  },

  /** `deep.math` — 세 식과 실행 값. */
  "math-center": () => {
    const rows = DIAM_SHAPES.map(([label, n, t]) => {
      const e = eccs(n, t);
      const d = Math.max(...e);
      const c = centers(n, neighbors(n, t));
      const r = peelRounds(n, t);
      const ecc = e[c[0] as number] as number;
      const ok =
        c.length === 1 + (d % 2) &&
        r === Math.floor(d / 2) &&
        ecc === Math.ceil(d / 2);
      return [
        label,
        comma(n),
        comma(d),
        comma(c.length),
        comma(1 + (d % 2)),
        comma(r),
        comma(Math.floor(d / 2)),
        comma(ecc),
        comma(Math.ceil(d / 2)),
        ok ? "같다" : "다르다",
      ];
    });
    const law = CENTER_LAW();
    return [
      md(
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
          "세 식",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7, 8],
      ),
      "",
      `정점 여덟까지의 라벨 붙은 트리 ${comma(law.checked)} 개 전부에서도 세 식과 어긋난 자리는 ${comma(law.broken)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.math` — 볼록성이 상한을 정하는 자리. */
  "math-convex": () => {
    const f = (x: number): number => x * Math.log2(x);
    return columns([
      [
        "자식 9 개를 셋씩 세 정점에",
        `3 × (3 · log₂ 3) = ${(3 * f(3)).toFixed(1)}`,
      ],
      ["자식 9 개를 한 정점에", `9 · log₂ 9 = ${f(9).toFixed(1)}`],
    ]);
  },

  /** `deep.math` — 상한에 규모를 넣는다. */
  "math-scale": () => {
    const rows = [16, 1024, 65536, N_LIMIT].map((n) => {
      const lg = Math.ceil(Math.log2(n - 1));
      return [comma(n), comma(lg), comma((n - 1) * lg)];
    });
    return [
      md(["정점 N", "⌈log₂(N−1)⌉", "(N−1)⌈log₂(N−1)⌉"], rows, [0, 1, 2]),
    ].join("\n");
  },

  /** `invariant` — 번호가 같다는 것과 모양이 같다는 것이 같은 일인가. */
  "invariant-hold": () => {
    const cs = CENSUS();
    const rows = cs.map((c) => [
      comma(c.n),
      comma(c.labeled),
      comma(c.classes),
      comma(c.sameChecked),
      comma(c.sameFail),
      comma(c.crossChecked),
      comma(c.crossFail),
    ]);
    const rl = RELABEL();
    const bad =
      cs.reduce((s, c) => s + c.sameFail + c.crossFail, 0) + rl.broken;
    return [
      md(
        [
          "정점 N",
          "라벨 붙은 트리",
          "모양 번호가 가른 묶음",
          "묶음 안 되추적 대조",
          "그중 동형이 아닌 짝",
          "묶음 사이 되추적 대조",
          "그중 동형인 짝",
        ],
        rows,
        [0, 1, 2, 3, 4, 5, 6],
      ),
      "",
      `정점 일곱까지는 전수이고 정점 여덟은 묶음마다 200 벌까지 대조했습니다. 따로 정점 번호만 섞은 트리를 ${comma(rl.checked)} 번 다시 물었고, 세 대조에서 어긋난 자리를 더하면 ${comma(bad)} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` — 경계에 놓인 입력. */
  "invariant-edges": () => {
    const rows = SHAPES.map((s) => {
      const m = meter(s.n, s.a, s.b);
      return [
        s.label,
        comma(s.n),
        `${m.centers1}${과와(m.centers1)} ${m.centers2}`,
        comma(m.rootedRuns),
        comma(m.tableSize),
        String(m.answer),
        m.answer === byMapping(s.n, s.a, s.b) ? "같다" : "다르다",
      ];
    });
    return [
      md(
        [
          "입력",
          "정점 N",
          "두 트리의 중심 개수",
          "모양 번호를 매긴 벌 수",
          "열쇠 개수",
          "정본",
          "되추적 대조",
        ],
        rows,
        [1, 3, 4],
      ),
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
        comma(m.lookups),
        String(want),
        String(got),
        want === got ? "같다" : "다르다",
      ];
    });
    return [
      md(
        ["입력", "그 줄을 지나간 횟수", "정본", "정렬을 뺀 판", "두 답"],
        rows,
        [1],
      ),
    ].join("\n");
  },

  /** `invariant` — 정렬을 빼면 어느 정점에서 갈리는가. */
  "mutant-sort-trace": () => {
    const [r1, r2] = RUN.cB as [number, number];
    const t = new Map<string, number>();
    const b1 = codesFromUnsorted(WALK_N, TREE_B, r1, t);
    const b2 = codesFromUnsorted(WALK_N, TREE_B, r2, t);
    const a = codesFromUnsorted(WALK_N, TREE_A, RUN.aRoot, t);
    const aCode = a.code[RUN.aRoot] as number;
    const code2 = [b1.code[r1] as number, b2.code[r2] as number];
    const rows = [
      [
        `A 의 ${RUN.aRoot} (뿌리)`,
        keyText(a.key[RUN.aRoot] as string),
        `${aCode}`,
      ],
      [`B 의 ${r2} (뿌리)`, keyText(b2.key[r2] as string), `${b2.code[r2]}`],
    ];
    const sortedKey = [...RUN.table.keys()][
      RUN.aCode[RUN.aRoot] as number
    ] as string;
    return [
      md(["정점", "정렬을 뺀 판의 열쇠", "받은 모양 번호"], rows, [2]),
      "",
      `정렬을 뺀 판에서 B 의 중심 번호는 ${show(code2)} 이고 A 의 뿌리 번호는 ${aCode} 입니다. 목록에 ${code2.includes(aCode) ? "있어 답이 true 로 남습니다" : "없어 답이 false 로 바뀝니다"}. 정렬한 판에서는 두 뿌리의 열쇠가 모두 ${keyText(sortedKey)} 입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 갈래마다의 기본 연산. */
  "perf-derive": () => {
    const m = WALK_METER();
    const n = WALK_N;
    const runs = m.rootedRuns;
    const perRun = n + 4 * (n - 1) + n;
    const numbering = m.visits + (m.slotReads - m.peelReads) + m.lookups;
    const rows = [
      [
        "①",
        "이웃 목록 둘을 만든다",
        spanOf((s) => s.kind === "build"),
        comma(m.edgeReads),
        "2(N − 1)",
      ],
      [
        "②",
        "잎을 벗긴다",
        spanOf((s) => s.kind === "peel"),
        comma(m.peeled + m.peelReads),
        "벗긴 정점 수 + 그 정점들의 차수 합",
      ],
      [
        "③④⑥",
        "뿌리마다 차례를 적고 번호표를 찾는다",
        `${WALK.steps.flatMap((s, k) => (s.kind === "order" ? [stepOf(k)] : [])).join(" · ")} 부터`,
        comma(numbering),
        `매긴 벌 수 × (N + 4(N − 1) + N) = ${runs} × ${perRun}`,
      ],
      [
        "⑤",
        "자식 번호를 정렬한다",
        "번호를 받는 걸음",
        comma(m.compares),
        "모양이 정한다",
      ],
    ];
    const sum = m.edgeReads + m.peeled + m.peelReads + numbering + m.compares;
    if (sum !== m.ops) throw new Error("갈래 합이 기본 연산과 다르다");
    if (numbering !== runs * perRun)
      throw new Error("번호 매기기 몫이 식과 다르다");
    return [
      md(
        ["갈래", "하는 일", "전개의 걸음", "이 입력의 횟수", "N 으로"],
        rows,
        [3],
      ),
      "",
      `네 갈래의 합 ${comma(sum)}${과와(sum)} 실행이 센 기본 연산 ${comma(m.ops)}${이가(m.ops)} 같습니다. 모양 번호를 매긴 벌 수는 ${runs} 입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 모양을 바꿔도 등식이 그대로인가. */
  "perf-growth": () => {
    const n = 1024;
    const rows = WORST_SHAPES.map(([name, mk]) => {
      const a = mk(n);
      const m = meter(n, a, relabel(n, a, 4321));
      const fixed = 2 * (n - 1) + m.rootedRuns * (n + 4 * (n - 1) + n);
      const peel = m.peeled + m.peelReads;
      return [
        name,
        comma(m.ops),
        comma(fixed),
        comma(peel),
        comma(m.compares),
        comma(m.rootedRuns),
        m.ops === fixed + peel + m.compares ? "같다" : "다르다",
      ];
    });
    return [
      md(
        [
          "모양 (정점 1,024)",
          "기본 연산",
          "2(N − 1) + 벌 수 × (6N − 4)",
          "잎 벗기기",
          "자식 번호 비교",
          "매긴 벌 수",
          "세 몫의 합 대조",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      "두 트리 가운데 하나는 앞의 모양이고 다른 하나는 그 번호를 섞은 것입니다.",
    ].join("\n");
  },

  /** `perf.worst` — 모양마다의 비용과 메모리. */
  "perf-worst": () => {
    const n = 4096;
    const rows = WORST_SHAPES.map(([name, mk]) => {
      const a = mk(n);
      const m = meter(n, a, relabel(n, a, 4321));
      const most = Math.max(...childrenFrom(n, a, 0).kids.map((k) => k.length));
      return {
        name,
        ops: m.ops,
        cmp: m.compares,
        most,
        bound: sortBound(n, a),
        keys: m.tableSize,
        chars: m.keyChars,
      };
    });
    const maxOps = rows.reduce((x, y) => (y.ops > x.ops ? y : x));
    const maxCmp = rows.reduce((x, y) => (y.cmp > x.cmp ? y : x));
    const maxKey = rows.reduce((x, y) => (y.chars > x.chars ? y : x));
    return [
      md(
        [
          "모양 (정점 4,096)",
          "기본 연산",
          "자식 번호 비교",
          "정점 0 을 뿌리로 둘 때 가장 많은 자식 수",
          "뿌리 하나의 정렬 상한 Σ kids⌈log₂ kids⌉",
          "열쇠 개수",
          "열쇠 글자 수",
        ],
        rows.map((r) => [
          r.name,
          comma(r.ops),
          comma(r.cmp),
          comma(r.most),
          comma(r.bound),
          comma(r.keys),
          comma(r.chars),
        ]),
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `기본 연산이 가장 많은 모양은 「${maxOps.name}」이고 ${comma(maxOps.ops)} 번입니다. 자식 번호 비교가 가장 많은 모양은 「${maxCmp.name}」이고 ${comma(maxCmp.cmp)} 번, 열쇠 글자 수가 가장 많은 모양은 「${maxKey.name}」이고 ${comma(maxKey.chars)} 글자입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 규모를 네 배씩 늘린다. */
  "perf-worst-growth": () => {
    const rows: string[][] = [];
    for (const [name, mk] of WORST_SHAPES) {
      if (
        name !== "사슬" &&
        name !== "다리 길이가 모두 다른 거미" &&
        name !== "별"
      )
        continue;
      let prev = 0;
      for (const n of [1024, 4096, 16384]) {
        const a = mk(n);
        const m = meter(n, a, relabel(n, a, 4321));
        rows.push([
          name,
          comma(n),
          comma(m.ops),
          prev === 0 ? "—" : `${(m.ops / prev).toFixed(2)} 배`,
          comma(m.keyChars),
        ]);
        prev = m.ops;
      }
    }
    return [
      md(
        ["모양", "정점 N", "기본 연산", "직전 줄 대비", "열쇠 글자 수"],
        rows,
        [1, 2, 3, 4],
      ),
    ].join("\n");
  },

  /** `perf.worst` — 재귀로 적은 사본. */
  "perf-recursion": () => {
    const rows = [1000, 10_000, N_LIMIT].map((n) => {
      const ok = treeIsomorphism(n, chain(n), chain(n).slice().reverse());
      return [
        comma(n),
        comma(n - 1),
        recursionVerdict(n),
        ok ? "끝까지 실행된다" : "답이 틀린다",
      ];
    });
    return [
      md(
        ["사슬 정점 수", "필요한 호출 깊이", "재귀 사본", "정본 (배열 차례)"],
        rows,
        [0, 1],
      ),
      "",
      "재귀 사본은 뿌리 0 에서 자식마다 자기를 다시 부르고, 정본은 방문 차례 배열 하나를 거꾸로 읽습니다.",
    ].join("\n");
  },

  /** `selfcheck` — 정점 6 이 받은 두 번호. */
  "selfcheck-answer": () => {
    const [r1, r2] = RUN.cB as [number, number];
    const s1 = childrenFrom(WALK_N, TREE_B, r1).kids;
    const s2 = childrenFrom(WALK_N, TREE_B, r2).kids;
    const sub = (kids: number[][], v: number): number[] => [
      v,
      ...(kids[v] as number[]).flatMap((w) => sub(kids, w)),
    ];
    const v = r1;
    const k1 = WALK.steps.findIndex(
      (s) => s.kind === "code" && s.root === r1 && s.v === v && s.tree === "B",
    );
    const k2 = WALK.steps.findIndex(
      (s) => s.kind === "code" && s.root === r2 && s.v === v && s.tree === "B",
    );
    const keys = [...RUN.table.keys()];
    return [
      md(
        ["걸음", "뿌리", "정점 6 아래의 부분트리", "열쇠", "모양 번호"],
        [
          [
            stepOf(k1),
            `${r1}`,
            setOf(sub(s1, v).sort((x, y) => x - y)),
            keyText(keys[bCode(r1)[v] as number] as string),
            `${bCode(r1)[v]}`,
          ],
          [
            stepOf(k2),
            `${r2}`,
            setOf(sub(s2, v).sort((x, y) => x - y)),
            keyText(keys[bCode(r2)[v] as number] as string),
            `${bCode(r2)[v]}`,
          ],
        ],
        [4],
      ),
    ].join("\n");
  },
};

/**
 * 정렬을 뺀 판과 같은 절차로 정점마다의 번호와 열쇠를 모은다 — 변이 모듈의 `shapeCode` 와 뿌리 번호를
 * 맞댄다. 중화 실행에서는 변이 모듈이 정본이므로 이 사본도 정렬한다.
 */
function codesFromUnsorted(
  n: number,
  edges: Edge[],
  root: number,
  table: Map<string, number>,
): { code: number[]; key: string[] } {
  const probe = new Map(table);
  const want = noSort.shapeCode(n, neighbors(n, edges), root, probe);
  const { kids, order } = childrenFrom(n, edges, root);
  const code: number[] = Array.from({ length: n }, () => -1);
  const keys: string[] = Array.from({ length: n }, () => "");
  const link = neighbors(n, edges);
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i] as number;
    const got: number[] = [];
    for (const w of link[v] as number[]) {
      if ((kids[v] as number[]).includes(w)) got.push(code[w] as number);
    }
    if (중화됨) got.sort((x, y) => x - y);
    const key = got.join(",");
    let id = table.get(key);
    if (id === undefined) {
      id = table.size;
      table.set(key, id);
    }
    code[v] = id;
    keys[v] = key;
  }
  if (code[root] !== want)
    throw new Error("정렬을 뺀 사본이 변이 모듈과 다르다");
  return { code, key: keys };
}
