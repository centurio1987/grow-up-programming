/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 * 걸음마다의 상태는 정본과 같은 절차에 세는 자리만 덧붙인 사본(`walkSteps`)이 낸다. 그 사본이
 * 정본과 같은 라딕스 트리를 만드는지는 삽입마다 정본의 뿌리를 직접 열어 모양을 맞댄다(아래
 * 「사본 대조」). 그림 사이드카(`.fig.tsx`)와 걸음 재생 패널도 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/radixTree/radixTree-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를 } from "../../../../tools/josa.ts";
import {
  base26,
  CORPUS,
  QUERY_LEN,
  radixCells,
  radixQueryOps,
  trieCells,
  trieQueryOps,
} from "./radixTree-guide.alt.ts";
import { commonPrefixLength, RadixTree } from "./radixTree-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

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

/**
 * 등폭 글자 표 — 코드 옆 짧은 실행 결과에만 쓴다. 한글은 두 칸으로 센다. 폭을 값에서 재므로
 * 값이 바뀌어도 열이 어긋나지 않는다.
 */
const cols = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

function fence(rows: string[][]): string {
  const w = (rows[0] ?? []).map((_, c) =>
    Math.max(...rows.map((r) => cols(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((cell, c) =>
          c === r.length - 1
            ? cell
            : cell + " ".repeat((w[c] ?? 0) - cols(cell)),
        )
        .join("  ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

export const yn = (b: boolean): string => (b ? "참" : "거짓");

/** 노드 이름 — 경로 문자열. 뿌리만 「뿌리」다. */
export const nodeName = (path: string): string => (path === "" ? "뿌리" : path);

/** 표 칸의 코드 표기. */
const code = (s: string): string => `\`${s}\``;

const lengthSum = (ws: readonly string[]): number =>
  ws.reduce((a, w) => a + w.length, 0);

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 넷을 이 순서로 넣으면 삽입의 네 갈래가 다 나온다 — 자식이 없어 남은 글자 전부를 라벨
 * 하나로 다는 삽입(`apple`), 라벨 도중에 갈려 새 잎이 하나 더 붙는 삽입(`application`),
 * 가른 자리에서 새 단어가 끝나는 삽입(`app`), 라벨을 전부 쓰며 내려가다 남은 글자가
 * 없어지는 삽입(`appl`).
 */
export const WORDS = ["apple", "application", "app", "appl"] as const;

export type Op = "search" | "startsWith";

/** 전개가 쓰는 조회 다섯. `[연산, 문자열]` 이다. */
export const QUERIES: readonly (readonly [Op, string])[] = [
  ["search", "app"],
  ["search", "appli"],
  ["startsWith", "appli"],
  ["search", "applied"],
  ["startsWith", "bat"],
];

/** 과제 규모 — 담은 단어의 길이 합의 최댓값. */
export const LIMIT = 100_000;

/** 단순한 방법을 반박할 때 거는 조회 횟수. */
export const Q = 100_000;

/** 단순 연산을 1 초에 몇 번 하는가 — 예산을 대어 보는 기준. */
const OPS_PER_SEC = 1e8;

/** 과제 규모 사전의 단어 수와 단어 길이. 곱이 정확히 `LIMIT` 이다. */
export const DICT_N = 1000;
const DICT_L = 100;

/** 앞 97 글자가 전부 같은 단어 1,000 개. 길이 합이 정확히 100,000 이다. */
export const SHARED_DICT: string[] = Array.from(
  { length: DICT_N },
  (_, i) => "a".repeat(DICT_L - 3) + base26(i),
);

/** 그 사전에 없는 길이 100 짜리 조회. 앞 97 글자까지 맞고 98 번째에서 어긋난다. */
const SHARED_QUERY = `${"a".repeat(DICT_L - 3)}zzz`;

/** 앞 3 글자에서 갈리는 1,000 단어 — 공유가 없는 쪽 끝. */
export const SPLIT_DICT: string[] = CORPUS(DICT_N, 0);

/** 길이 100,000 짜리 단어 하나. */
const LONG_WORD = "a".repeat(LIMIT);

/** 초당 1 억 번으로 잰 시간. */
export const secondsOf = (ops: number): string =>
  `${(ops / OPS_PER_SEC).toFixed(2)} 초`;

/* ────────────────── 정본의 트리를 밖에서 읽는다 ────────────────── */

/**
 * 정본의 노드 모양. `private root` 는 컴파일 시점의 표시라 실행 중에는 그냥 속성이다 —
 * 여기서는 **읽기만** 하고, 트리를 바꾸는 일은 전부 정본의 `insert` 에 맡긴다.
 */
interface Peek {
  children: Map<string, Peek>;
  end: boolean;
  label: string;
}

const peek = (tree: object): Peek => (tree as unknown as { root: Peek }).root;

/** 노드 하나의 모양 — 경로 문자열 · 부모의 경로 · 들어오는 라벨 · 끝 표시. */
export interface ShapeNode {
  readonly path: string;
  readonly parent: string | null;
  readonly label: string;
  readonly end: boolean;
}

/** 너비 우선, 자식은 맵에 걸린 차례. **재귀로 짜지 않는다** — 깊이가 과제 규모까지 갈 수 있다. */
export function shapeOf(root: Peek): ShapeNode[] {
  const out: ShapeNode[] = [];
  const queue: [Peek, string, string | null][] = [[root, "", null]];
  for (let i = 0; i < queue.length; i++) {
    const [n, path, parent] = queue[i] as [Peek, string, string | null];
    out.push({ path, parent, label: n.label, end: n.end });
    for (const kid of n.children.values()) {
      queue.push([kid, path + kid.label, path]);
    }
  }
  return out;
}

/** 노드 수와 라벨 글자 합. */
function sizeOf(root: Peek): { nodes: number; labelChars: number } {
  const stack: Peek[] = [root];
  let nodes = 0;
  let labelChars = 0;
  while (stack.length > 0) {
    const n = stack.pop() as Peek;
    nodes++;
    labelChars += n.label.length;
    for (const c of n.children.values()) stack.push(c);
  }
  return { nodes, labelChars };
}

/** 단어를 차례로 담은 정본. */
export function refTree(words: readonly string[] = WORDS): RadixTree {
  const tree = new RadixTree();
  for (const w of words) tree.insert(w);
  return tree;
}

export const radixNodes = (words: readonly string[]): number =>
  sizeOf(peek(refTree(words))).nodes;

/** 정본이 만든 모양. */
export const refShape = (words: readonly string[] = WORDS): ShapeNode[] =>
  shapeOf(peek(refTree(words)));

/* ────────────────────── 계측 사본 — 트라이 쪽 ────────────────────── */

interface TrieNode {
  children: Map<string, TrieNode>;
  end: boolean;
}
const tnode = (): TrieNode => ({ children: new Map(), end: false });

/** 글자마다 노드를 하나씩 두는 트라이 — 대조할 상대다. */
export function buildTrie(words: readonly string[]): TrieNode {
  const root = tnode();
  for (const w of words) {
    let cur = root;
    for (const ch of w) {
      let next = cur.children.get(ch);
      if (next === undefined) {
        next = tnode();
        cur.children.set(ch, next);
      }
      cur = next;
    }
    cur.end = true;
  }
  return root;
}

/** 트라이의 노드 수. 스택으로 센다 — 길이 100,000 짜리 단어 하나로 깊이가 그만큼 된다. */
export function trieNodes(root: TrieNode): number {
  const stack: TrieNode[] = [root];
  let n = 0;
  while (stack.length > 0) {
    const x = stack.pop() as TrieNode;
    n++;
    for (const c of x.children.values()) stack.push(c);
  }
  return n;
}

/** 트라이의 노드마다 `[경로, 자식 수, 끝 표시]` — 너비 우선, 자식은 만든 차례. */
export function trieShape(
  words: readonly string[] = WORDS,
): { path: string; kids: number; end: boolean }[] {
  const out: { path: string; kids: number; end: boolean }[] = [];
  const queue: [TrieNode, string][] = [[buildTrie(words), ""]];
  for (let i = 0; i < queue.length; i++) {
    const [n, path] = queue[i] as [TrieNode, string];
    out.push({ path, kids: n.children.size, end: n.end });
    for (const [ch, c] of n.children) queue.push([c, path + ch]);
  }
  return out;
}

/** 트라이의 조회 하나 — 글자마다 자식 맵을 한 번 본다. 읽은 글자와 맵 조회 수가 같다. */
function trieQuery(
  root: TrieNode,
  s: string,
  op: Op,
): { lookups: number; answer: boolean } {
  let cur: TrieNode | undefined = root;
  let lookups = 0;
  for (const ch of s) {
    lookups++;
    cur = cur.children.get(ch);
    if (cur === undefined) return { lookups, answer: false };
  }
  return { lookups, answer: op === "search" ? cur.end : true };
}

/** 지나가기만 하는 노드 — 자식이 하나뿐이고 단어 끝도 아니다. */
const idle = (n: { kids: number; end: boolean }): boolean =>
  n.kids === 1 && !n.end;

/* ────────────────────── 계측 사본 — 목록 쪽 ────────────────────── */

/**
 * 단어를 배열에 담고 매번 앞에서부터 대조하는 방식. 단어 하나마다 **어긋나는 자리까지**
 * 글자를 읽고, 답이 정해지면 거기서 멈춘다.
 */
function listQuery(
  words: readonly string[],
  q: string,
  mode: Op,
): { answer: boolean; read: number } {
  let read = 0;
  for (const w of words) {
    let k = 0;
    while (k < q.length && k < w.length) {
      read++;
      if (w[k] !== q[k]) break;
      k++;
    }
    if (k < q.length) continue;
    if (mode === "startsWith") return { answer: true, read };
    if (w.length === q.length) return { answer: true, read };
  }
  return { answer: false, read };
}

/** 앞 97 글자 사전에서 없는 조회 하나를 두 방식으로 읽은 글자 수. */
export function worstQueryReads(): { list: number; trie: number } {
  return {
    list: listQuery(SHARED_DICT, SHARED_QUERY, "startsWith").read,
    trie: trieQuery(buildTrie(SHARED_DICT), SHARED_QUERY, "startsWith").lookups,
  };
}

/* ────────────── 후보 — 단어 끝을 안 보고 자식 하나짜리를 전부 접는다 ────────────── */

interface FoldNode {
  children: Map<string, FoldNode>;
  end: boolean;
  label: string;
}

/**
 * 트라이에서 시작해 **자식이 하나뿐인 노드를 단어 끝인지 보지 않고** 부모 쪽 라벨에 흡수한다.
 * 접힌 노드의 끝 표시는 함께 사라진다 — 그것이 이 후보가 답을 틀리는 자리다.
 */
function foldWithoutEnd(words: readonly string[]): FoldNode {
  const from = (t: TrieNode, label: string): FoldNode => {
    let node = t;
    let acc = label;
    while (node.children.size === 1) {
      const only = [...node.children.entries()][0] as [string, TrieNode];
      acc += only[0];
      node = only[1];
    }
    const out: FoldNode = { children: new Map(), end: node.end, label: acc };
    for (const [ch, c] of node.children) out.children.set(ch, from(c, ch));
    return out;
  };
  const trie = buildTrie(words);
  const root: FoldNode = { children: new Map(), end: trie.end, label: "" };
  for (const [ch, c] of trie.children) root.children.set(ch, from(c, ch));
  return root;
}

function foldNodes(root: FoldNode): number {
  const stack: FoldNode[] = [root];
  let n = 0;
  while (stack.length > 0) {
    const x = stack.pop() as FoldNode;
    n++;
    for (const c of x.children.values()) stack.push(c);
  }
  return n;
}

/** 접은 구조에 라딕스 트리와 **같은 절차**로 조회한다. 갈리는 것은 구조뿐이다. */
function foldQuery(root: FoldNode, s: string, op: Op): boolean {
  let node = root;
  let rest = s;
  while (rest !== "") {
    const child = node.children.get(rest[0] as string);
    if (child === undefined) return false;
    const k = commonPrefixLength(rest, child.label);
    if (k === rest.length) {
      return op === "search" ? child.label.length === k && child.end : true;
    }
    if (k < child.label.length) return false;
    rest = rest.slice(child.label.length);
    node = child;
  }
  return op === "search" ? node.end : true;
}

/* ────────────────── 계측 사본 — 라딕스 트리 쪽 ────────────────── */

/** 공통 접두사 길이와 **읽은 글자 수**. 어긋나는 자리 한 번을 더 읽는다. */
function lcp(a: string, b: string): { k: number; reads: number } {
  const k = commonPrefixLength(a, b);
  return { k, reads: k < Math.min(a.length, b.length) ? k + 1 : k };
}

class CopyNode {
  readonly children = new Map<string, CopyNode>();
  end = false;
  label: string;
  constructor(label: string) {
    this.label = label;
  }
}

/** 라벨 하나와 맞춰 본 기록 — 그때 남은 글자 · 그 라벨 · 같은 글자 수. */
export interface Compare {
  readonly rest: string;
  readonly label: string;
  readonly k: number;
  readonly reads: number;
}

/** 걸음 하나의 기록. 무대(그림 사이드카)와 표(`walkTrace`)가 이것 하나를 쓴다. */
export interface WalkStep {
  readonly t: number;
  readonly kind: "start" | "insert" | "query";
  /** `insert("app")` · `search("appli")` 꼴. 시작 걸음은 빈 문자열. */
  readonly op: string;
  readonly queryOp: Op | null;
  readonly word: string;
  /** 자식 맵을 본 글자와 그 자식이 있었는가. */
  readonly lookups: readonly { readonly ch: string; readonly found: boolean }[];
  readonly compares: readonly Compare[];
  /** 라벨을 다 써서 내려간 노드의 경로. */
  readonly visited: readonly string[];
  /** 이 걸음이 만든 노드 · 라벨이 줄어든 노드의 경로. */
  readonly made: readonly string[];
  readonly relabeled: readonly string[];
  /** 끝 표시를 참으로 둔 노드. */
  readonly endSet: string | null;
  /** 걸음이 끝난 자리. 조회가 못 따라가면 `null`. */
  readonly at: string | null;
  /** 도착한 노드의 라벨 중 아직 안 쓴 글자 수. */
  readonly leftover: number | null;
  readonly answer: boolean | null;
  /** 라벨과 맞춘 글자 수의 합 — 읽는 문자열에서 앞 몇 글자가 맞았는가. */
  readonly matched: number;
  /** 새로 만든 잎의 라벨 — 읽는 문자열의 남은 글자가 통째로 들어간다. */
  readonly leaf: string | null;
  /** 이 걸음이 지난 갈래 라벨(① ~ ⑫). */
  readonly branches: readonly string[];
  /** 글자 대조 · 끝 표시 읽기와 쓰기 횟수. */
  readonly reads: number;
  readonly flags: number;
  /** 걸음이 끝난 뒤의 라딕스 트리. */
  readonly shape: readonly ShapeNode[];
}

/** 정본과 같은 절차의 삽입 — 세는 자리만 덧붙였다. */
function copyInsert(root: CopyNode, word: string, t: number): WalkStep {
  const lookups: { ch: string; found: boolean }[] = [];
  const compares: Compare[] = [];
  const visited: string[] = [];
  const made: string[] = [];
  const relabeled: string[] = [];
  const branches = ["①"];
  let endSet: string | null = null;
  let leaf: string | null = null;
  let matched = 0;
  let node = root;
  let path = "";
  let rest = word;
  let at = "";
  while (rest !== "") {
    const head = rest[0] as string;
    const child = node.children.get(head);
    lookups.push({ ch: head, found: child !== undefined });
    if (child === undefined) {
      const fresh = new CopyNode(rest);
      fresh.end = true;
      node.children.set(head, fresh);
      at = path + rest;
      made.push(at);
      endSet = at;
      leaf = rest;
      branches.push("②");
      rest = "";
      break;
    }
    const c = lcp(rest, child.label);
    compares.push({ rest, label: child.label, k: c.k, reads: c.reads });
    matched += c.k;
    if (c.k === child.label.length) {
      rest = rest.slice(c.k);
      node = child;
      path += child.label;
      visited.push(path);
      branches.push("③");
      if (rest === "") {
        node.end = true;
        endSet = path;
        at = path;
        branches.push("⑦");
      }
      continue;
    }
    const oldPath = path + child.label;
    const mid = new CopyNode(child.label.slice(0, c.k));
    child.label = child.label.slice(c.k);
    mid.children.set(child.label[0] as string, child);
    node.children.set(head, mid);
    const midPath = path + mid.label;
    made.push(midPath);
    relabeled.push(oldPath);
    branches.push("④", "⑤");
    const tail = rest.slice(c.k);
    if (tail === "") {
      mid.end = true;
      endSet = midPath;
      at = midPath;
      branches.push("⑥ 참");
    } else {
      const fresh = new CopyNode(tail);
      fresh.end = true;
      mid.children.set(tail[0] as string, fresh);
      at = midPath + tail;
      made.push(at);
      endSet = at;
      leaf = tail;
      branches.push("⑥ 거짓");
    }
    rest = "";
  }
  return {
    t,
    kind: "insert",
    op: `insert("${word}")`,
    queryOp: null,
    word,
    lookups,
    compares,
    visited,
    made,
    relabeled,
    endSet,
    at,
    leftover: 0,
    answer: null,
    matched,
    leaf,
    branches,
    reads: compares.reduce((a, c) => a + c.reads, 0),
    flags: 1,
    shape: shapeOf(root),
  };
}

/** 정본과 같은 절차의 조회 — `search` 는 남은 글자가 0 일 때만 끝 표시를 읽는다(`&&` 가 앞에서 멈춘다). */
function copyQuery(root: CopyNode, op: Op, q: string, t: number): WalkStep {
  const lookups: { ch: string; found: boolean }[] = [];
  const compares: Compare[] = [];
  const visited: string[] = [];
  const branches: string[] = [];
  let matched = 0;
  let node = root;
  let path = "";
  let rest = q;
  let at: string | null = "";
  let leftover: number | null = 0;
  let arrived: CopyNode | null = root;
  while (rest !== "") {
    const child = node.children.get(rest[0] as string);
    lookups.push({ ch: rest[0] as string, found: child !== undefined });
    if (child === undefined) {
      branches.push("⑧");
      at = null;
      leftover = null;
      arrived = null;
      break;
    }
    const c = lcp(rest, child.label);
    compares.push({ rest, label: child.label, k: c.k, reads: c.reads });
    matched += c.k;
    if (c.k === rest.length) {
      branches.push("⑨");
      at = path + child.label;
      leftover = child.label.length - c.k;
      arrived = child;
      break;
    }
    if (c.k < child.label.length) {
      branches.push("⑩");
      at = null;
      leftover = null;
      arrived = null;
      break;
    }
    rest = rest.slice(child.label.length);
    node = child;
    path += child.label;
    visited.push(path);
    arrived = child;
    at = path;
  }
  const readsEnd = op === "search" && arrived !== null && leftover === 0;
  const answer =
    op === "search"
      ? arrived !== null && leftover === 0 && arrived.end
      : arrived !== null;
  branches.push(op === "search" ? "⑪" : "⑫");
  return {
    t,
    kind: "query",
    op: `${op}("${q}")`,
    queryOp: op,
    word: q,
    lookups,
    compares,
    visited,
    made: [],
    relabeled: [],
    endSet: null,
    at,
    leftover,
    answer,
    matched,
    leaf: null,
    branches,
    reads: compares.reduce((a, c) => a + c.reads, 0),
    flags: readsEnd ? 1 : 0,
    shape: shapeOf(root),
  };
}

/* ────────────────────── 사본 대조 ────────────────────── */

/** T1 부터 T10 까지 — 삽입마다 정본에 같은 단어를 담아 모양을 맞대고, 조회마다 답을 맞댄다. */
export function walkSteps(): WalkStep[] {
  const root = new CopyNode("");
  const ref = new RadixTree();
  const steps: WalkStep[] = [
    {
      t: 1,
      kind: "start",
      op: "",
      queryOp: null,
      word: "",
      lookups: [],
      compares: [],
      visited: [],
      made: [],
      relabeled: [],
      endSet: null,
      at: "",
      leftover: null,
      answer: null,
      matched: 0,
      leaf: null,
      branches: [],
      reads: 0,
      flags: 0,
      shape: shapeOf(root),
    },
  ];
  let t = 1;
  for (const w of WORDS) {
    t++;
    const s = copyInsert(root, w, t);
    ref.insert(w);
    const want = JSON.stringify(shapeOf(peek(ref)));
    if (JSON.stringify(s.shape) !== want) {
      throw new Error(`T${t} ${s.op} 뒤의 모양이 정본과 다르다`);
    }
    steps.push(s);
  }
  for (const [op, q] of QUERIES) {
    t++;
    const s = copyQuery(root, op, q, t);
    if (ref[op](q) !== s.answer) {
      throw new Error(`T${t} ${s.op} 의 답이 정본과 다르다`);
    }
    steps.push(s);
  }
  return steps;
}

const STEPS = walkSteps();
const byT = (t: number): WalkStep => STEPS[t - 1] as WalkStep;

/** 걸음 하나가 만든 노드 수. */
const madeOf = (s: WalkStep): number => s.made.length;
/** 걸음 하나가 자식 맵을 본 횟수. */
const lookupsOf = (s: WalkStep): number => s.lookups.length;

/* ────────────────────── 변이 — 정본 소스에서 기계로 만든다 ────────────────────── */

/**
 * `PROOFS` 의 함수는 **동기**여야 한다(`check-proof.ts` 가 `make()` 를 그대로 부른다).
 * 그래서 변이는 여기서 최상위 `await` 로 한 번만 만들어 둔다.
 */
const REF = new URL("./radixTree-guide.ref.ts", import.meta.url).pathname;
type Impl = { RadixTree: typeof RadixTree };

/** 가른 뒤 부모가 가리키던 자식 자리를 새 중간 노드로 바꾸지 않는다. */
const dropRelink = await loadMutant<Impl>(REF, {
  drop: /node\.children\.set\(head, mid\);/,
});

/** 가른 자리에서 새 단어가 끝나도 중간 노드에 단어 끝 표시를 남기지 않는다. */
const midNotEnd = await loadMutant<Impl>(REF, {
  swap: [/mid\.end = true;/, "mid.end = false;"],
});

/** 라벨 도중에 글자가 어긋난 것을 보지 않고 라벨 길이만큼 그냥 잘라 낸다. */
const skipLabelCheck = await loadMutant<Impl>(REF, {
  drop: /if \(k < child\.label\.length\) return null;/,
});

/** 문자열이 라벨 도중에 끝난 것을 도착으로 보지 않는다. */
const needWholeLabel = await loadMutant<Impl>(REF, {
  swap: [
    /if \(k === rest\.length\)/,
    "if (k === rest.length && k === child.label.length)",
  ],
});

/** 정본과 변이에 같은 단어를 담아 나란히 돌려준다. */
function pair(mutant: Impl): { good: RadixTree; bad: RadixTree } {
  const good = new RadixTree();
  const bad = new mutant.RadixTree();
  for (const w of WORDS) {
    good.insert(w);
    bad.insert(w);
  }
  return { good, bad };
}

/** 조회 목록을 정본·변이에 각각 실행해 표의 행으로 만든다. */
function verdictRows(
  good: RadixTree,
  bad: RadixTree,
  qs: readonly (readonly [Op, string])[],
): { rows: string[][]; wrong: number } {
  let wrong = 0;
  const rows = qs.map(([op, q]) => {
    const a = good[op](q);
    const b = bad[op](q);
    if (a !== b) wrong++;
    return [code(`${op}("${q}")`), yn(a), yn(b), a === b ? "같다" : "틀리다"];
  });
  return { rows, wrong };
}

/** 부모 재연결을 뺀 변이가 네 단어로 만든 모양 — 짚고 가기의 그림이 쓴다. */
export function relinkMutantShape(): ShapeNode[] {
  return shapeOf(peek(pair(dropRelink).bad));
}

/** 부모 재연결을 뺀 변이의 뿌리 — 자식 맵의 키와 그 자식의 라벨이 어긋나는 것을 그림이 보인다. */
export function relinkMutantRoot(): {
  key: string;
  label: string;
  end: boolean;
}[] {
  const root = peek(pair(dropRelink).bad);
  return [...root.children].map(([key, n]) => ({
    key,
    label: n.label,
    end: n.end,
  }));
}

/** 단어 끝을 안 보고 접은 후보 — 노드 수와 조회 하나의 답. 그림 사이드카의 사다리가 쓴다. */
export const foldedNodes = (): number => foldNodes(foldWithoutEnd(WORDS));
export const foldAnswer = (op: Op, q: string): boolean =>
  foldQuery(foldWithoutEnd(WORDS), q, op);

/* ────────────────────── 증명 블록 ────────────────────── */

/** 트라이의 노드를 자리로 나눈다 — 갈림 · 단어 끝 · 둘 다 아님. */
function roles() {
  const nodes = trieShape();
  const branch = nodes.filter((n) => n.kids >= 2);
  const ends = nodes.filter((n) => n.end);
  const either = nodes.filter((n) => n.kids >= 2 || n.end);
  const neither = nodes.filter((n) => n.kids < 2 && !n.end);
  return { nodes, branch, ends, either, neither };
}

const names = (ps: readonly { path: string }[]): string =>
  ps.map((p) => nodeName(p.path)).join(" · ");

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 트라이의 노드를 자리로 나눈다. */
  "concept-roles": () => {
    const r = roles();
    const kept = 1 + r.either.length;
    if (kept !== radixNodes(WORDS)) {
      throw new Error("남기는 노드 수가 정본의 노드 수와 다르다");
    }
    return [
      md(
        ["자리", "노드", "개수"],
        [
          ["자식이 둘 이상인 갈림", names(r.branch), String(r.branch.length)],
          ["단어가 끝나는 자리", names(r.ends), String(r.ends.length)],
          ["둘 중 하나 이상", names(r.either), String(r.either.length)],
          ["둘 다 아닌 자리", names(r.neither), String(r.neither.length)],
        ],
        [2],
      ),
      "",
      `트라이의 노드 ${r.nodes.length} 개 가운데 ${r.neither.length} 개는 갈림도 단어 끝도 아닙니다. 뿌리와 셋째 줄의 ${r.either.length} 개만 남기면 ${kept} 개입니다.`,
    ].join("\n");
  },

  /** `concept` — 라딕스 트리에서 두 조회가 답하는 자리. 라벨 한가운데서 끝나는 문자열이 있다. */
  "concept-answers": () => {
    const tree = refTree();
    const root = new CopyNode("");
    for (const [i, w] of WORDS.entries()) copyInsert(root, w, i);
    const qs = ["app", "appl", "appli", "applied", "bat"];
    const rows = qs.map((s, i) => {
      const a = copyQuery(root, "search", s, i);
      const shape = new Map(a.shape.map((n) => [n.path, n]));
      const node = a.at === null ? null : (shape.get(a.at) as ShapeNode);
      return [
        code(s),
        node === null ? "없다" : `라벨 ${node.label}`,
        a.leftover === null ? "-" : String(a.leftover),
        node === null ? "-" : node.end ? "있다" : "없다",
        yn(tree.search(s)),
        yn(tree.startsWith(s)),
      ];
    });
    const mid = qs.filter((s) => {
      const a = copyQuery(root, "search", s, 0);
      return a.leftover !== null && a.leftover > 0;
    });
    return [
      md(
        [
          "문자열",
          "도착한 노드",
          "라벨에 남은 글자",
          "끝 표시",
          "search",
          "startsWith",
        ],
        rows,
        [2],
      ),
      "",
      `라벨 한가운데서 끝나는 문자열은 ${mid.map(code).join(" · ")} ${mid.length} 개이고, 그 자리에서 search 는 거짓 · startsWith 는 참입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 가장 단순한 방법을 과제 규모에서 수치로 반박한다. */
  "origin-cost": () => {
    const r = worstQueryReads();
    const rows = [1000, Q].map((q) => [
      num(q),
      num(r.list * q),
      num(r.trie * q),
      secondsOf(r.list * q),
    ]);
    return [
      md(
        [
          "조회 횟수",
          "목록 대조가 읽은 글자",
          "트라이가 읽은 글자",
          "목록 대조 시간(초당 1 억 번)",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `사전은 앞 ${num(DICT_L - 3)} 글자가 같은 길이 ${num(DICT_L)} 짜리 단어 ${num(DICT_N)} 개(길이 합 ${num(lengthSum(SHARED_DICT))})이고, 조회는 앞 ${num(DICT_L - 3)} 글자까지 맞고 그다음에서 어긋나는 없는 문자열 하나입니다. 조회 하나에 목록 대조는 ${num(r.list)} 글자, 트라이는 ${num(r.trie)} 글자를 읽었습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 트라이의 노드 수가 글자 수를 따라간다. */
  "origin-trie-nodes": () => {
    const sets: [string, readonly string[]][] = [
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자에서 갈리는 ${num(DICT_N)} 단어`, SPLIT_DICT],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, [LONG_WORD]],
    ];
    const rows = sets.map(([name, ws]) => [
      name,
      num(ws.length),
      num(lengthSum(ws)),
      num(trieNodes(buildTrie(ws))),
    ]);
    const n = sets.map(([, ws]) => trieNodes(buildTrie(ws)));
    return [
      md(["사전", "단어 수 N", "길이 합 S", "트라이의 노드"], rows, [1, 2, 3]),
      "",
      `세 사전 모두 길이 합이 ${num(LIMIT)} 이고, 트라이의 노드 수는 ${n.map(num).join(" · ")} 입니다. 단어가 하나뿐인 셋째 사전에서 노드가 가장 많습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 트라이의 노드 열셋이 각각 무엇을 정하는가. */
  "origin-roles": () => {
    const nodes = trieShape();
    const rows = nodes.map((n) => [
      nodeName(n.path),
      String(n.kids),
      n.end ? "있다" : "없다",
      n.kids >= 2 ? "갈림" : n.end ? "단어 끝" : "지나가기만 한다",
    ]);
    const pass = nodes.filter(idle).length;
    return [
      md(["노드", "자식 수", "끝 표시", "이 노드의 몫"], rows, [1]),
      "",
      `노드 ${nodes.length} 개 가운데 지나가기만 하는 노드가 ${pass} 개입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 조회 다섯을 두 구조로 처리하고 실제 계수를 나란히 적는다. */
  "origin-lookups": () => {
    const trie = buildTrie(WORDS);
    const tree = refTree();
    const root = new CopyNode("");
    for (const [i, w] of WORDS.entries()) copyInsert(root, w, i);
    const sums = [0, 0, 0];
    const rows = QUERIES.map(([op, q]) => {
      const hit = trieQuery(trie, q, op);
      const c = copyQuery(root, op, q, 0);
      if (hit.answer !== tree[op](q) || c.answer !== tree[op](q)) {
        throw new Error(`${op}("${q}") 두 구조의 답이 정본과 다르다`);
      }
      sums[0] = (sums[0] ?? 0) + hit.lookups;
      sums[1] = (sums[1] ?? 0) + lookupsOf(c);
      sums[2] = (sums[2] ?? 0) + c.reads;
      return [
        code(`${op}("${q}")`),
        yn(tree[op](q)),
        num(hit.lookups),
        num(lookupsOf(c)),
        num(c.reads),
      ];
    });
    rows.push(["합계", "", ...sums.map((v) => num(v))]);
    return [
      md(
        [
          "조회",
          "답",
          "트라이의 맵 조회(= 글자 대조)",
          "라딕스 트리의 맵 조회",
          "라딕스 트리의 글자 대조",
        ],
        rows,
        [2, 3, 4],
      ),
      "",
      `맵 조회는 ${num(sums[0] ?? 0)} 에서 ${num(sums[1] ?? 0)}${으로(num(sums[1] ?? 0))} 줄고, 글자 대조는 ${num(sums[0] ?? 0)}${과와(num(sums[0] ?? 0))} ${num(sums[2] ?? 0)}${으로(num(sums[2] ?? 0))} 거의 같습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 가장 단순한 후보(단어 끝을 안 보고 전부 접는다)를 값으로 반박한다. */
  "origin-fold": () => {
    const tree = refTree();
    const folded = foldWithoutEnd(WORDS);
    const checks: [Op, string][] = [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["startsWith", "app"],
      ["startsWith", "appli"],
    ];
    let wrong = 0;
    const rows = checks.map(([op, q]) => {
      const a = tree[op](q);
      const b = foldQuery(folded, q, op);
      if (a !== b) wrong++;
      return [code(`${op}("${q}")`), yn(a), yn(b), a === b ? "같다" : "틀리다"];
    });
    return [
      md(
        [
          "조회",
          "갈림과 단어 끝을 남긴 답",
          "단어 끝을 안 보고 접은 답",
          "판정",
        ],
        rows,
      ),
      "",
      `노드는 트라이 ${num(trieNodes(buildTrie(WORDS)))} 개, 단어 끝을 안 보고 접으면 ${num(foldNodes(folded))} 개, 갈림과 단어 끝을 남기고 접으면 ${num(radixNodes(WORDS))} 개입니다. 단어 끝을 안 본 쪽은 다섯 조회 가운데 ${wrong} 개가 틀립니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — 노드 `application` 하나를 뿌리에서부터 읽는다. */
  "build-read-one": () => {
    const target = "application";
    const shape = refShape();
    const byPath = new Map(shape.map((n) => [n.path, n]));
    const chain: ShapeNode[] = [];
    let cur = byPath.get(target);
    while (cur !== undefined) {
      chain.unshift(cur);
      cur = cur.parent === null ? undefined : byPath.get(cur.parent);
    }
    const rows = chain.map((n, i) => [
      String(i),
      n.parent === null ? "-" : n.label,
      nodeName(n.path),
      n.path === "" ? "빈 문자열" : code(n.path),
      yn(n.end),
    ]);
    return [
      md(
        ["차례", "지나온 라벨", "도착한 노드", "경로 문자열", "끝 표시"],
        rows,
        [0],
      ),
      "",
      `라벨 ${chain.length - 1} 개를 지나 ${target.length} 글자짜리 경로 문자열에 도착합니다. 트라이였다면 같은 자리까지 간선 ${target.length} 개를 지납니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (d) — 노드끼리의 관계. */
  "build-relations": () => {
    const shape = refShape();
    const kids = (p: string) => shape.filter((n) => n.parent === p);
    const rows = shape.map((n) => [
      nodeName(n.path),
      n.parent === null ? "없음" : nodeName(n.parent),
      n.parent === null ? "-" : n.label,
      kids(n.path).length === 0
        ? "없음"
        : kids(n.path)
            .map((k) => `${k.label[0]} → ${nodeName(k.path)}`)
            .join(" · "),
      String(kids(n.path).length),
      yn(n.end),
    ]);
    const nonRoot = shape.filter((n) => n.parent !== null);
    const joined = nonRoot.filter((n) => (n.parent ?? "") + n.label === n.path);
    const kept = nonRoot.filter((n) => n.end || kids(n.path).length >= 2);
    return [
      md(
        [
          "노드",
          "부모",
          "들어오는 라벨",
          "자식 맵(키 → 자식)",
          "자식 수",
          "끝 표시",
        ],
        rows,
        [4],
      ),
      "",
      `뿌리를 뺀 노드 ${nonRoot.length} 개 가운데 ${joined.length} 개에서 부모의 경로 문자열 뒤에 들어오는 라벨을 붙이면 자기 경로 문자열이 됩니다. 같은 ${nonRoot.length} 개 가운데 끝 표시가 있거나 자식이 둘 이상인 노드는 ${kept.length} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (e) — 사전을 바꿔 가며 두 구조의 노드 수를 나란히 센다. */
  "build-node-count": () => {
    const sets: [string, readonly string[]][] = [
      [`{${WORDS.join(", ")}}`, WORDS],
      ["{app, bat, cup}", ["app", "bat", "cup"]],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자에서 갈리는 ${num(DICT_N)} 단어`, SPLIT_DICT],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, [LONG_WORD]],
    ];
    let within = 0;
    const rows = sets.map(([name, ws]) => {
      const v = radixNodes(ws);
      if (v <= 2 * ws.length) within++;
      return [
        name,
        num(ws.length),
        num(lengthSum(ws)),
        num(trieNodes(buildTrie(ws))),
        num(v),
      ];
    });
    return [
      md(
        [
          "단어 집합",
          "단어 수 N",
          "길이 합 S",
          "트라이의 노드",
          "라딕스 트리의 노드",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `라딕스 트리의 노드 수는 ${sets.length} 줄 가운데 ${within} 줄에서 단어 수의 두 배 이하입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 라벨을 다 쓰면 내려가고, 자식이 없으면 잎을 단다. */
  "build-descend": () => {
    const rows: string[][] = [];
    for (const s of [byT(2), byT(5)]) {
      if (s.compares.length === 0) {
        const head = s.word[0] as string;
        const leaf = s.leaf as string;
        rows.push([
          code(s.word),
          "1",
          s.word,
          `${head}${으로(head)} 가는 자식 없음`,
          "-",
          `잎 ${leaf}${을를(leaf)} 단다`,
          "없음",
        ]);
        continue;
      }
      let rest = s.word;
      for (const [i, c] of s.compares.entries()) {
        const next = rest.slice(c.k);
        rows.push([
          i === 0 ? code(s.word) : "",
          String(i + 1),
          rest,
          `라벨 ${c.label}`,
          `${c.k} = 라벨 길이`,
          "내려간다",
          next === "" ? "없음" : next,
        ]);
        rest = next;
      }
    }
    const a = byT(2);
    const b = byT(5);
    return [
      md(
        [
          "담는 단어",
          "바퀴",
          "남은 글자",
          "자식",
          "k",
          "한 일",
          "그다음 남은 글자",
        ],
        rows,
        [1],
      ),
      "",
      `${code(a.word)}${은는(a.word)} 글자를 ${a.reads} 번 대조하고 노드를 ${madeOf(a)} 개 만들었고, ${code(b.word)}${은는(b.word)} 글자를 ${b.reads} 번 대조하고 노드를 ${madeOf(b)} 개 만들었습니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 라벨 도중에 갈리는 삽입 둘. */
  "build-split": () => {
    const rows = [byT(3), byT(4)].map((s) => {
      const c = s.compares.at(-1) as Compare;
      const tail = c.rest.slice(c.k);
      return [
        code(s.word),
        c.label,
        String(c.k),
        c.label.slice(0, c.k),
        c.label.slice(c.k),
        tail === "" ? "없음" : tail,
        tail === "" ? "앞 조각 노드에 끝 표시" : `잎 ${tail}`,
        `${byT(s.t - 1).shape.length} → ${s.shape.length}`,
      ];
    });
    return [
      md(
        [
          "담는 단어",
          "맞춰 본 라벨",
          "k",
          "앞 조각",
          "뒤 조각",
          "새 단어에 남은 글자",
          "그다음",
          "노드 수",
        ],
        rows,
        [2],
      ),
      "",
      `두 삽입 모두 옛 자식의 아래는 건드리지 않았고, 만든 노드는 ${madeOf(byT(3))} 개와 ${madeOf(byT(4))} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 4단계 — 라벨 단위로 내려가 두 조회를 답한다. 경계 문자열을 섞었다. */
  "build-queries": () => {
    const tree = refTree();
    const root = new CopyNode("");
    for (const [i, w] of WORDS.entries()) copyInsert(root, w, i);
    const qs = ["app", "appl", "appli", "applic", "applied", "apqle", "bat"];
    const rows = qs.map((q) => {
      const c = copyQuery(root, "search", q, 0);
      if (c.answer !== tree.search(q)) throw new Error(`${q} 답이 다르다`);
      const why = c.branches.includes("⑧")
        ? `${q[c.matched]}${으로(q[c.matched] as string)} 가는 자식 없음`
        : c.branches.includes("⑩")
          ? `라벨 ${(c.compares.at(-1) as Compare).label} 의 ${(c.compares.at(-1) as Compare).k + 1} 번째 글자에서 어긋남`
          : `라벨 ${(c.shape.find((n) => n.path === c.at) as ShapeNode).label} 인 노드`;
      return [
        code(q),
        String(c.matched),
        why,
        c.leftover === null ? "-" : String(c.leftover),
        yn(tree.search(q)),
        yn(tree.startsWith(q)),
      ];
    });
    return [
      md(
        [
          "조회 문자열",
          "맞춘 글자",
          "멈춘 자리",
          "라벨에 남은 글자",
          "search",
          "startsWith",
        ],
        rows,
        [1, 3],
      ),
      "",
      "맞춘 글자는 일곱 줄 모두 조회 문자열의 길이 이하입니다.",
    ].join("\n");
  },

  /** `deep.walk` 1 — 공통 접두사 길이의 값 몇 개와 빈 트리. */
  "walk-node": () => {
    const pairs: [string, string][] = [
      ["application", "apple"],
      ["app", "appl"],
      ["appl", "app"],
      ["bat", "apple"],
    ];
    const empty = sizeOf(peek(new RadixTree()));
    const rows = pairs.map(([a, b]) => [
      `commonPrefixLength("${a}", "${b}")`,
      "→",
      String(commonPrefixLength(a, b)),
    ]);
    rows.push([
      "new RadixTree()",
      "→",
      `노드 ${empty.nodes} 개(뿌리) · 뿌리의 라벨 길이 ${empty.labelChars}`,
    ]);
    return fence(rows);
  },

  /** `deep.walk` 2 — 삽입의 앞쪽 절반을 실행한 결과. */
  "walk-descend": () => {
    const rows = [byT(2), byT(5)].map((s) => [
      s.op,
      "→",
      `${s.branches.filter((b) => b !== "①").join(" ")} · 대조한 글자 ${s.reads} · 새 노드 ${madeOf(s)} · 노드 ${s.shape.length} 개`,
    ]);
    return fence(rows);
  },

  /** `deep.walk.pause` 1 — 가른 뒤 부모의 자식 자리를 안 바꾸면. */
  pauseRelink: () => {
    const { good, bad } = pair(dropRelink);
    const { rows, wrong } = verdictRows(good, bad, [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["search", "application"],
      ["startsWith", "appli"],
      ["startsWith", "bat"],
    ]);
    return [
      md(["조회", "정본이 낸 답", "부모를 안 바꾼 답", "판정"], rows),
      "",
      `여섯 조회 가운데 ${wrong} 개가 틀립니다. 노드는 정본이 ${sizeOf(peek(good)).nodes} 개, 부모를 안 바꾼 쪽이 ${sizeOf(peek(bad)).nodes} 개입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 조회 다섯에 `locate` 가 돌려준 것과 마지막 한 줄의 값. */
  "walk-queries": () => {
    const tree = refTree();
    const rows = STEPS.filter((s) => s.kind === "query").map((s) => {
      const op = s.queryOp as Op;
      const shape = new Map(s.shape.map((n) => [n.path, n]));
      const node = s.at === null ? null : (shape.get(s.at) as ShapeNode);
      return [
        code(s.op),
        node === null ? "`null`" : `라벨 ${node.label} 인 노드`,
        s.leftover === null ? "-" : String(s.leftover),
        node === null ? "-" : op === "search" ? yn(node.end) : "안 본다",
        op === "search" ? yn(tree.search(s.word)) : "-",
        op === "startsWith" ? yn(tree.startsWith(s.word)) : "-",
      ];
    });
    return md(
      [
        "조회",
        "locate 가 돌려준 것",
        "leftover",
        "끝 표시",
        "⑪ 의 값",
        "⑫ 의 값",
      ],
      rows,
      [2],
    );
  },

  /** `deep.walk.pause` 2 — 라벨 전체를 안 맞춰 보면. */
  pauseWholeLabel: () => {
    const { good, bad } = pair(skipLabelCheck);
    const { rows, wrong } = verdictRows(good, bad, [
      ["search", "app"],
      ["search", "apple"],
      ["search", "apqle"],
      ["search", "applied"],
      ["startsWith", "apqle"],
      ["startsWith", "bat"],
    ]);
    return [
      md(["조회", "정본이 낸 답", "라벨을 안 맞춰 본 답", "판정"], rows),
      "",
      `여섯 조회 가운데 ${wrong} 개가 틀리고, 틀린 줄은 모두 담은 적 없는 문자열이 참으로 나온 자리입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` 2 — `apqle` 가 두 방식에서 지나는 자리. */
  "pause-apqle": () => {
    const q = "apqle";
    const shape = refShape();
    const kid = (parent: string, ch: string) =>
      shape.find((n) => n.parent === parent && n.label[0] === ch);
    const trace = (checkLabel: boolean): string[] => {
      const out: string[] = [];
      let path = "";
      let rest = q;
      while (rest !== "") {
        const child = kid(path, rest[0] as string);
        if (child === undefined) {
          out.push(
            `${rest[0]}${으로(rest[0] as string)} 가는 자식 없음 → null`,
          );
          return out;
        }
        const k = commonPrefixLength(rest, child.label);
        if (k === rest.length) {
          out.push(
            `라벨 ${child.label} · k = ${k} = 남은 글자 길이 → 도착, 끝 표시 ${yn(child.end)}`,
          );
          return out;
        }
        if (checkLabel && k < child.label.length) {
          out.push(
            `라벨 ${child.label} · k = ${k} < ${child.label.length} → null`,
          );
          return out;
        }
        const next = rest.slice(child.label.length);
        out.push(
          `라벨 ${child.label} · k = ${k} → ${child.label.length} 글자를 잘라 남은 ${next}`,
        );
        rest = next;
        path = child.path;
      }
      return out;
    };
    const good = trace(true);
    const bad = trace(false);
    const { bad: mutant } = pair(skipLabelCheck);
    const refAns = refTree().search(q);
    return [
      md(
        ["방식", "지나는 자리", 'search("apqle")'],
        [
          ["라벨을 맞춰 본다", good.join(" · "), yn(refAns)],
          ["라벨을 안 맞춰 본다", bad.join(" · "), yn(mutant.search(q))],
        ],
      ),
      "",
      `라벨을 안 맞춰 본 쪽은 라벨 ${bad.length} 개를 지나 끝 표시가 ${yn(mutant.search(q))}인 노드에 도착합니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` 3 — 라벨 도중에 끝난 문자열을 도착으로 안 보면. */
  pauseMidLabel: () => {
    const { good, bad } = pair(needWholeLabel);
    const searches: (readonly [Op, string])[] = [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["search", "application"],
      ["search", "appli"],
      ["search", "applied"],
    ];
    const prefixes: (readonly [Op, string])[] = [
      ["startsWith", "appl"],
      ["startsWith", "appli"],
      ["startsWith", "applic"],
      ["startsWith", "bat"],
    ];
    const s = verdictRows(good, bad, searches);
    const p = verdictRows(good, bad, prefixes);
    return [
      md(
        ["조회", "정본이 낸 답", "라벨을 다 써야 도착인 답", "판정"],
        [...s.rows, ...p.rows],
      ),
      "",
      `search 여섯 줄 가운데 틀린 것은 ${s.wrong} 개이고, startsWith 네 줄 가운데 틀린 것은 ${p.wrong} 개입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 5 — T1 부터 T10 까지의 상태값. */
  walkTrace: () => {
    const rows = STEPS.map((s) => {
      const shape = new Map(s.shape.map((n) => [n.path, n]));
      const at =
        s.kind === "start"
          ? "뿌리"
          : s.at === null
            ? "없음"
            : `라벨 ${(shape.get(s.at) as ShapeNode).label}`;
      return [
        `T${s.t}`,
        s.kind === "start" ? "빈 트리" : s.op,
        s.branches.length === 0 ? "-" : s.branches.join(" "),
        String(s.reads),
        at,
        s.leftover === null ? "-" : String(s.leftover),
        String(madeOf(s)),
        String(s.shape.length),
        s.answer === null ? "-" : yn(s.answer),
      ];
    });
    const zero = STEPS.filter((s) => s.kind === "insert" && madeOf(s) === 0);
    return [
      md(
        [
          "걸음",
          "연산",
          "지난 갈래",
          "대조한 글자",
          "도착한 노드",
          "라벨에 남은 글자",
          "새 노드",
          "노드 수",
          "반환",
        ],
        rows,
        [3, 5, 6, 7],
      ),
      "",
      `새 노드가 0 개인 삽입 걸음은 ${zero.map((s) => `T${s.t}`).join(" · ")} 이고, 같은 문자열 appli 를 물은 T7 · T8 은 같은 노드에 라벨 ${byT(7).leftover} 글자를 남기고 도착했으며 답은 T7 에서 ${yn(byT(7).answer ?? false)} · T8 에서 ${yn(byT(8).answer ?? false)}입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 5 — 갈래마다 실행된 걸음. */
  branchCoverage: () => {
    const say: [string, string][] = [
      ["①", "뿌리에서 출발한다"],
      ["②", "첫 글자가 같은 자식이 없어 잎을 단다"],
      ["③", "라벨을 다 써서 내려간다"],
      ["④", "라벨 도중에 갈려 가른다"],
      ["⑤", "부모의 자식 자리를 중간 노드로 바꾼다"],
      ["⑥ 참", "가른 자리에서 새 단어가 끝난다"],
      ["⑥ 거짓", "가른 자리 아래에 잎을 단다"],
      ["⑦", "남은 글자가 없어 끝 표시를 남긴다"],
      ["⑧", "조회에서 첫 글자가 같은 자식이 없다"],
      ["⑨", "문자열이 라벨 끝이나 도중에서 끝났다"],
      ["⑩", "라벨 도중에 글자가 어긋났다"],
      ["⑪", "search 의 마지막 한 줄"],
      ["⑫", "startsWith 의 마지막 한 줄"],
    ];
    let hit = 0;
    const rows = say.map(([b, what]) => {
      const ts = STEPS.filter((s) => s.branches.includes(b)).map(
        (s) => `T${s.t}`,
      );
      const times = STEPS.reduce(
        (a, s) => a + s.branches.filter((x) => x === b).length,
        0,
      );
      if (times > 0) hit++;
      return [b, what, ts.join(" · "), String(times)];
    });
    return [
      md(["라벨", "하는 일", "실행된 걸음", "횟수"], rows, [3]),
      "",
      `${say.length} 줄 가운데 ${hit} 줄이 한 번 이상 실행됐습니다. ③ 의 횟수는 내려간 라벨 수로 셌습니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 결과. 앞에서 안 나온 경계를 함께 확인한다. */
  finalRun: () => {
    const tree = refTree();
    const empty = new RadixTree();
    const twice = refTree(["app", "app"]);
    const one = refTree(["a"]);
    const rows: string[][] = [
      ...QUERIES.map(([op, q]) => [
        `tree.${op}("${q}")`,
        "→",
        String(tree[op](q)),
      ]),
      ['tree.search("apple")', "→", String(tree.search("apple"))],
      ['tree.search("applepie")', "→", String(tree.search("applepie"))],
      [
        'tree.startsWith("application")',
        "→",
        String(tree.startsWith("application")),
      ],
      ['new RadixTree().search("app")', "→", String(empty.search("app"))],
      [
        'new RadixTree().startsWith("app")',
        "→",
        String(empty.startsWith("app")),
      ],
      ['app 을 두 번 담은 뒤 search("app")', "→", String(twice.search("app"))],
      ['a 만 담은 뒤 search("a")', "→", String(one.search("a"))],
    ];
    return fence(rows);
  },

  /** `related` — 네 단어를 하나씩 담을 때의 노드 수를 두 구조로. */
  "related-fold": () => {
    const rows = [2, 3, 4, 5].map((t) => {
      const s = byT(t);
      const words = WORDS.slice(0, t - 1);
      return [
        `T${t}`,
        words.join(" · "),
        String(s.shape.length),
        String(trieNodes(buildTrie(words))),
      ];
    });
    return md(
      ["걸음", "담은 단어", "라딕스 트리의 노드", "트라이의 노드"],
      rows,
      [2, 3],
    );
  },

  /** `purpose.alt` — 저장 칸이 뒤집히는 공유 길이를 스윕으로 찾는다. */
  altSweep: () => {
    const shares = [0, 50, 80, 90, 94, 95, 96, 97];
    let flip = "";
    let prev: boolean | null = null;
    const rows = shares.map((share) => {
      const words = CORPUS(DICT_N, share);
      const r = radixCells(words);
      const t = trieCells(words);
      const radixLess = r < t;
      if (prev === true && !radixLess) {
        const before = String(shares[shares.indexOf(share) - 1]);
        flip = `${before}${과와(before)} ${share}`;
      }
      prev = radixLess;
      return [
        String(share),
        num(radixNodes(words)),
        num(trieNodes(buildTrie(words))),
        num(r),
        num(t),
        radixLess ? "라딕스 트리" : "트라이",
      ];
    });
    return [
      md(
        [
          "공통 접두사 길이",
          "라딕스 트리의 노드",
          "트라이의 노드",
          "라딕스 트리 저장 칸",
          "트라이 저장 칸",
          "적은 쪽",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "",
      `${shares.length} 줄 모두 단어 ${num(DICT_N)} 개 · 길이 ${DICT_L} · 길이 합 ${num(DICT_N * DICT_L)} 이고 공통 접두사 길이만 바꿨습니다. ${flip} 사이에서 적은 쪽이 라딕스 트리에서 트라이로 바뀝니다.`,
    ].join("\n");
  },

  /** `purpose.alt` — 내주는 축이 정말 한 번도 안 갈리는지 공유 길이 전수로 확인한다. */
  altQuerySweep: () => {
    const radix: number[] = [];
    const trie: number[] = [];
    let fewer = 0;
    for (let share = 0; share <= DICT_L - 3; share++) {
      const words = CORPUS(DICT_N, share);
      const queries = words.map((w) => w.slice(0, QUERY_LEN));
      const r = radixQueryOps(words, queries);
      const t = trieQueryOps(words, queries);
      radix.push(r);
      trie.push(t);
      if (r < t) fewer++;
    }
    return [
      md(
        ["설계", "조회 기본 연산이 가장 적을 때", "가장 많을 때"],
        [
          ["라딕스 트리", num(Math.min(...radix)), num(Math.max(...radix))],
          ["트라이", num(Math.min(...trie)), num(Math.max(...trie))],
        ],
        [1, 2],
      ),
      "",
      `공통 접두사 길이를 0 부터 ${DICT_L - 3} 까지 ${radix.length} 가지로 바꿔 쟀고, 라딕스 트리가 더 적었던 경우는 ${fewer} 가지입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  mathNodeSet: () => {
    const prefixes = new Set<string>([""]);
    for (const w of WORDS) {
      for (let j = 1; j <= w.length; j++) prefixes.add(w.slice(0, j));
    }
    const nextChars = (p: string): Set<string> => {
      const out = new Set<string>();
      for (const w of WORDS) {
        if (w.length > p.length && w.startsWith(p)) {
          out.add(w[p.length] as string);
        }
      }
      return out;
    };
    const branch = [...prefixes].filter((p) => nextChars(p).size >= 2);
    const nodes = new Set<string>(["", ...WORDS, ...branch]);
    const sorted = [...nodes].sort();
    const size = sizeOf(peek(refTree()));
    const words: readonly string[] = WORDS;
    return [
      md(
        ["원소", "빈 문자열", "담은 단어", "갈림"],
        sorted.map((p) => [
          p === "" ? "빈 문자열" : code(p),
          p === "" ? "그렇다" : "-",
          words.includes(p) ? "그렇다" : "-",
          branch.includes(p) ? "그렇다" : "-",
        ]),
      ),
      "",
      `Node(W) 의 크기는 ${nodes.size}, 라딕스 트리의 노드 수는 ${size.nodes}, Pref(W) 의 크기는 ${prefixes.size} 입니다. 라벨 글자 합은 ${size.labelChars} 이고 Pref(W) 의 크기에서 1 을 뺀 값도 ${prefixes.size - 1} 입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 라벨 글자 하나가 트라이의 간선 하나에 대응한다. */
  mathLabelEdges: () => {
    const shape = refShape().filter((n) => n.parent !== null);
    let total = 0;
    const rows = shape.map((n) => {
      const base = n.parent ?? "";
      const edges = [...n.label].map((ch, i) => {
        const from = base + n.label.slice(0, i);
        return `${nodeName(from)}–${ch}`;
      });
      total += edges.length;
      return [n.label, edges.join(" · "), String(edges.length)];
    });
    const trie = trieNodes(buildTrie(WORDS));
    return [
      md(["라벨", "대응하는 트라이의 간선(출발 노드–글자)", "개수"], rows, [2]),
      "",
      `대응하는 간선은 모두 ${total} 개이고, 트라이의 간선 수(노드 ${trie} 개에서 뿌리를 뺀 수)도 ${trie - 1} 입니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 상한에 과제 규모를 넣어 수치를 낸다. */
  mathBounds: () => {
    /** 낱말 하나씩 앞에 글자를 더 붙인 사전. 갈림과 단어 끝이 번갈아 나온다. */
    const caterpillar = (n: number): string[] =>
      Array.from({ length: n }, (_, i) => `${"a".repeat(i)}b`);
    const capN = 446;
    if (lengthSum(caterpillar(capN + 1)) <= LIMIT) {
      throw new Error("애벌레 사전이 과제 규모 안에서 더 늘 수 있다");
    }
    const cases: [string, readonly string[]][] = [
      [`{${WORDS.join(", ")}}`, WORDS],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자에서 갈리는 ${num(DICT_N)} 단어`, SPLIT_DICT],
      [`b · ab · aab … 를 ${num(capN)} 개`, caterpillar(capN)],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, [LONG_WORD]],
    ];
    const rows = cases.map(([name, ws]) => {
      const S = lengthSum(ws);
      return [
        name,
        num(ws.length),
        num(S),
        num(radixNodes(ws)),
        num(2 * ws.length),
        num(trieNodes(buildTrie(ws))),
        num(S + 1),
      ];
    });
    return [
      md(
        [
          "단어 집합",
          "N",
          "S",
          "라딕스 트리의 노드",
          "상한 2N",
          "트라이의 노드",
          "상한 S + 1",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `넷째 줄은 라딕스 트리의 노드가 상한 2N 보다 ${2 * capN - radixNodes(caterpillar(capN))} 적고, 다섯째 줄은 트라이의 노드가 상한 S + 1 과 같습니다. 단어 ${num(DICT_N)} 개 · 길이 합 ${num(LIMIT)} 이면 두 상한은 ${num(2 * DICT_N)}${과와(num(2 * DICT_N))} ${num(LIMIT + 1)} 이라 ${((LIMIT + 1) / (2 * DICT_N)).toFixed(1)} 배 갈립니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 가른 뒤 중간 노드가 어떻게 되는가. 전개의 T3 과 T4. */
  "invariant-split": () => {
    const rows = [byT(3), byT(4)].map((s) => {
      const mid = s.made[0] as string;
      const kids = s.shape.filter((n) => n.parent === mid);
      const midNode = s.shape.find((n) => n.path === mid) as ShapeNode;
      const c = s.compares.at(-1) as Compare;
      const tail = c.rest.slice(c.k);
      return [
        `T${s.t}`,
        tail === "" ? "없음" : tail,
        nodeName(mid),
        kids.map((k) => k.label).join(" · "),
        String(kids.length),
        yn(midNode.end),
      ];
    });
    return md(
      [
        "걸음",
        "새 단어에 남은 글자",
        "중간 노드",
        "자식의 라벨",
        "자식 수",
        "끝 표시",
      ],
      rows,
      [4],
    );
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, readonly string[], Op, string][] = [
      ["빈 트리에 조회", [], "search", "app"],
      ["담긴 단어보다 긴 조회", ["ab"], "startsWith", "abc"],
      ["같은 단어를 두 번", ["app", "app"], "search", "app"],
      ["짧은 단어를 나중에", ["apple", "app"], "search", "app"],
      ["길이 1 짜리 단어 하나", ["a"], "search", "a"],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, [LONG_WORD], "search", LONG_WORD],
    ];
    const rows = cases.map(([name, ws, op, q]) => {
      const tree = refTree(ws);
      const shape = shapeOf(peek(tree));
      const kids = (p: string) => shape.filter((n) => n.parent === p).length;
      const bad = shape.filter(
        (n) => n.parent !== null && !n.end && kids(n.path) < 2,
      ).length;
      const shown = q.length > 10 ? "그 단어" : `"${q}"`;
      return [
        name,
        ws.length === 0
          ? "없음"
          : ws
              .map((w) => (w.length > 10 ? `a × ${num(w.length)}` : w))
              .join(" · "),
        `${op}(${shown})`,
        yn(tree[op](q)),
        num(shape.length),
        String(bad),
      ];
    });
    return md(
      [
        "경우",
        "담은 단어",
        "조회",
        "답",
        "노드 수",
        "끝 표시도 없고 자식도 둘 미만인 노드",
      ],
      rows,
      [4, 5],
    );
  },

  /** `invariant` ③ — 가른 자리의 단어 끝 표시를 빼면 무엇이 어떻게 나오는가. */
  mutantMidEnd: () => {
    const { good, bad } = pair(midNotEnd);
    const { rows, wrong } = verdictRows(good, bad, [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["startsWith", "app"],
      ["startsWith", "bat"],
    ]);
    const idleNodes = (tree: RadixTree): string[] => {
      const shape = shapeOf(peek(tree));
      return shape
        .filter(
          (n) =>
            n.parent !== null &&
            !n.end &&
            shape.filter((k) => k.parent === n.path).length < 2,
        )
        .map((n) => n.path);
    };
    const gi = idleNodes(good);
    const bi = idleNodes(bad);
    return [
      md(["조회", "정본이 낸 답", "끝 표시를 안 남긴 답", "판정"], rows),
      "",
      `다섯 조회 가운데 ${wrong} 개가 틀립니다. 노드는 정본이 ${sizeOf(peek(good)).nodes} 개, 끝 표시를 안 남긴 쪽이 ${sizeOf(peek(bad)).nodes} 개입니다. 끝 표시도 없고 자식도 둘 미만인 노드는 정본에 ${gi.length} 개, 끝 표시를 안 남긴 쪽에 ${bi.length} 개${bi.length === 0 ? "" : `(${bi.map(nodeName).join(" · ")})`}입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음으로 기본 연산을 센다. */
  perfCount: () => {
    const body = STEPS.slice(1);
    const ops = (s: WalkStep) => lookupsOf(s) + s.reads + madeOf(s) + s.flags;
    const rows = body.map((s) => [
      `T${s.t}`,
      code(s.op),
      String(lookupsOf(s)),
      String(s.reads),
      String(madeOf(s)),
      String(s.flags),
      String(ops(s)),
    ]);
    const total = (f: (s: WalkStep) => number, pick = body): number =>
      pick.reduce((a, s) => a + f(s), 0);
    rows.push([
      "",
      "합계",
      String(total(lookupsOf)),
      String(total((s) => s.reads)),
      String(total(madeOf)),
      String(total((s) => s.flags)),
      String(total(ops)),
    ]);
    const ins = body.filter((s) => s.kind === "insert");
    const qs = body.filter((s) => s.kind === "query");
    const S = lengthSum(WORDS);
    const V = refShape().length;
    return [
      md(
        [
          "걸음",
          "연산",
          "맵 조회",
          "글자 대조",
          "노드 생성",
          "끝 표시",
          "기본 연산",
        ],
        rows,
        [2, 3, 4, 5, 6],
      ),
      "",
      `담는 쪽은 글자 대조 ${total((s) => s.reads, ins)} (S = ${S} 이하) · 노드 생성 ${total(madeOf, ins)} (V − 1 = ${V - 1}) · 끝 표시 쓰기 ${total((s) => s.flags, ins)} (N = ${WORDS.length}) 이고, 묻는 쪽은 글자 대조 ${total((s) => s.reads, qs)} · 맵 조회 ${total(lookupsOf, qs)} · 끝 표시 읽기 ${total((s) => s.flags, qs)} 입니다.`,
    ].join("\n");
  },

  /** `perf.bounds` — 노드마다 Σ 칸 배열을 잡을 때의 칸 수 상한. */
  "perf-sigma": () => {
    const sigma = 26;
    return [
      md(
        ["설계", "노드 수 상한", "Σ = 26 칸 배열의 칸 상한"],
        [
          ["라딕스 트리", `2N = ${num(2 * DICT_N)}`, num(sigma * 2 * DICT_N)],
          ["트라이", `S + 1 = ${num(LIMIT + 1)}`, num(sigma * (LIMIT + 1))],
        ],
        [2],
      ),
      "",
      `단어 ${num(DICT_N)} 개 · 길이 합 ${num(LIMIT)} 에서 두 상한은 ${((LIMIT + 1) / (2 * DICT_N)).toFixed(1)} 배 갈립니다.`,
    ].join("\n");
  },

  /**
   * `perf.worst` — 축이 셋이고 셋을 한꺼번에 최악으로 만드는 입력이 없다.
   *
   * **노드 수의 최악은 애벌레 사전이 아니다.** 그쪽은 상한 `2N` 을 타이트하게 만드는 입력이고
   * (`deep.math` 가 그 자리를 쓴다), 길이 합 100,000 안에서 노드를 가장 많이 만드는 것은
   * **짧은 단어를 최대한 많이 담는 사전**이다.
   */
  worstShape: () => {
    /** 접두사 사슬 — 깊이를 최대로 만든다. */
    const chain = (m: number): string[] =>
      Array.from({ length: m }, (_, i) => "a".repeat(i + 1));
    /** 짧은 단어를 예산이 닿는 데까지 — 노드 수를 최대로 만든다. */
    const shortest = (): string[] => {
      const AL = "abcdefghijklmnopqrstuvwxyz";
      const out: string[] = [];
      for (const a of AL) out.push(a);
      for (const a of AL) for (const b of AL) out.push(a + b);
      for (const a of AL)
        for (const b of AL) for (const c of AL) out.push(a + b + c);
      let budget = LIMIT - lengthSum(out);
      for (const a of AL)
        for (const b of AL)
          for (const c of AL)
            for (const d of AL) {
              if (budget < 4) continue;
              out.push(a + b + c + d);
              budget -= 4;
            }
      return out;
    };
    const CHAIN_N = 446;
    const shapes: [string, readonly string[], string][] = [
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, [LONG_WORD], LONG_WORD],
      [
        `a · aa · aaa … 를 ${num(CHAIN_N)} 개`,
        chain(CHAIN_N),
        "a".repeat(CHAIN_N),
      ],
      ["길이 3 이하 단어 전부와 길이 4 단어 일부", shortest(), "aaaa"],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT, SHARED_QUERY],
    ];
    const rows = shapes.map(([name, ws, q]) => {
      const root = new CopyNode("");
      for (const w of ws) copyInsert(root, w, 0);
      const c = copyQuery(root, "search", q, 0);
      if (c.answer !== refTree(ws).search(q))
        throw new Error(`${name} 답이 다르다`);
      return [
        name,
        num(ws.length),
        num(lengthSum(ws)),
        num(radixNodes(ws)),
        num(lookupsOf(c)),
        num(c.reads),
      ];
    });
    return md(
      [
        "입력의 모양",
        "단어 수 N",
        "길이 합",
        "노드 수",
        "그 조회의 맵 조회",
        "그 조회의 글자 대조",
      ],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** `perf.worst` — 깊이 d 를 만드는 데 드는 길이 합. */
  "worst-depth": () => {
    const rows = [100, 446, 447].map((d) => {
      const need = (d * (d + 1)) / 2;
      return [
        num(d),
        num(need),
        need <= LIMIT ? "들어간다" : `${num(LIMIT)}${을를(num(LIMIT))} 넘는다`,
      ];
    });
    return md(
      ["경로 위 노드 d", "필요한 길이 합 d(d+1)/2", "과제 규모"],
      rows,
      [0, 1],
    );
  },

  /** `selfcheck` — T4 한 줄. */
  "selfcheck-t4": () => {
    const s = byT(4);
    const c = s.compares.at(-1) as Compare;
    const moved = s.relabeled[0] as string;
    const node = s.shape.find((n) => n.path === moved) as ShapeNode;
    return fence([
      [
        `T${s.t}`,
        s.op,
        `대조한 글자 ${s.reads}`,
        `라벨 ${c.label}${을를(c.label)} ${c.label.slice(0, c.k)}${과와(c.label.slice(0, c.k))} ${node.label}${으로(node.label)} 가른다`,
      ],
    ]);
  },
};
