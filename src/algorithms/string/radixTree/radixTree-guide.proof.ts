/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts radixTree-guide.md
 *
 * **계수는 정본의 트리를 읽어서 낸다.** 삽입 하나가 몇 글자를 대조하는지는 정본에 계수가
 * 없어 밖에서 셀 수 없으므로, 삽입 **직전의 트리**를 읽기 전용으로 따라가며 센 뒤 실제
 * 삽입은 정본에게 맡긴다. 그 둘이 어긋나면 `assertSame` 이 던진다 — 새로 생긴 노드 수와
 * 조회의 답을 정본과 대조하므로, 흉내가 정본에서 갈라지면 블록이 만들어지지 않는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  base26,
  CORPUS,
  QUERY_LEN,
  radixCells,
  radixQueryOps,
  trieCells,
  trieQueryOps,
} from "./radixTree-guide.alt.ts";
import { RadixTree } from "./radixTree-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

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

const yn = (b: boolean): string => (b ? "참" : "거짓");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 넷을 이 순서로 넣으면 삽입의 네 갈래가 다 나온다 — 자식이 없어 남은 글자 전부를 라벨
 * 하나로 다는 삽입(`apple`), 라벨 도중에 갈려 새 잎이 하나 더 붙는 삽입(`application`),
 * 가른 자리에서 새 단어가 끝나는 삽입(`app`), 라벨을 전부 소비하며 내려가다 남은 글자가
 * 없어지는 삽입(`appl`).
 */
const WORDS = ["apple", "application", "app", "appl"] as const;

/** 전개가 쓰는 조회 다섯. `[연산, 문자열]` 이다. */
const QUERIES = [
  ["search", "app"],
  ["search", "appli"],
  ["startsWith", "appli"],
  ["search", "applied"],
  ["startsWith", "bat"],
] as const;

/** 제약이 정한 길이 합의 최댓값. */
const LIMIT = 100_000;

/** 제약 규모 사전의 단어 수와 단어 길이. 곱이 정확히 `LIMIT` 이다. */
const DICT_N = 1000;
const DICT_L = 100;

/** 앞 97 글자가 전부 같은 단어 1,000 개. 길이 합이 정확히 100,000 이다. */
const SHARED_DICT: string[] = Array.from(
  { length: DICT_N },
  (_, i) => "a".repeat(DICT_L - 3) + base26(i),
);

/** 그 사전에 없는 길이 100 짜리 조회. 앞 97 글자까지 맞고 98 번째에서 어긋난다. */
const SHARED_QUERY = `${"a".repeat(DICT_L - 3)}zzz`;

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

/** 노드 수와 라벨 글자 합. **재귀로 짜지 않는다** — 깊이가 제약 규모까지 갈 수 있다. */
function shapeOf(root: Peek): { nodes: number; labelChars: number } {
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

/** 라딕스 트리를 담아 돌려준다. */
function buildRadix(words: readonly string[]): RadixTree {
  const tree = new RadixTree();
  for (const w of words) tree.insert(w);
  return tree;
}

const radixNodes = (words: readonly string[]): number =>
  shapeOf(peek(buildRadix(words))).nodes;

/**
 * 라딕스 트리를 ascii 로 그린다. **박스 드로잉 문자를 쓰지 않는다** — `+`·`|`·`` ` ``·`-`
 * 만 쓴다. 표시폭이 모호한 문자가 열에 끼면 화면에 따라 세로줄이 갈린다.
 *
 * 자식은 맵에 **처음 걸린 순서**로 그린다. 순서는 어떤 답에도 영향을 주지 않지만, 프레임
 * 사이에서 자리가 흔들리면 무엇이 새로 생겼는지 확인할 수 없다.
 */
function drawRadix(root: Peek): string {
  const out: string[] = ["(root)"];
  const rec = (n: Peek, prefix: string): void => {
    const kids = [...n.children.values()];
    kids.forEach((kid, i) => {
      const last = i === kids.length - 1;
      out.push(
        `${prefix}${last ? "`--" : "+--"} ${kid.label}${kid.end ? "*" : ""}`,
      );
      rec(kid, prefix + (last ? "    " : "|   "));
    });
  };
  rec(root, "");
  return out.join("\n");
}

/* ────────────────── 계수 — 정본을 읽기 전용으로 흉내 낸다 ────────────────── */

/** 공통 접두사 길이와 **읽은 글자 수**. 어긋나는 자리 한 번을 더 읽는다. */
function lcp(a: string, b: string): { k: number; reads: number } {
  const limit = Math.min(a.length, b.length);
  let k = 0;
  while (k < limit && a[k] === b[k]) k++;
  return { k, reads: k < limit ? k + 1 : k };
}

interface Counted {
  /** 자식 맵 조회 횟수. */
  lookups: number;
  /** 글자 대조 횟수. */
  reads: number;
  /** 새로 만든 노드 수. */
  made: number;
  /** 끝 표시를 읽거나 쓴 횟수. */
  flags: number;
  /** 도착한 노드의 라벨. 못 따라가면 `null`. */
  label: string | null;
  /** 도착한 노드의 라벨 중 아직 안 쓴 글자 수. */
  leftover: number;
  /** 도착한 노드에 단어 끝 표시가 있는가. */
  end: boolean;
}

/** 삽입 하나가 하는 일을 **삽입 직전의 트리**에서 센다. 트리를 바꾸지 않는다. */
function countInsert(root: Peek, word: string): Counted {
  let node = root;
  let rest = word;
  let lookups = 0;
  let reads = 0;
  while (rest !== "") {
    const head = rest[0] as string;
    lookups++;
    const child = node.children.get(head);
    if (child === undefined) {
      return {
        lookups,
        reads,
        made: 1,
        flags: 1,
        label: rest,
        leftover: 0,
        end: true,
      };
    }
    const c = lcp(rest, child.label);
    reads += c.reads;
    if (c.k === child.label.length) {
      rest = rest.slice(c.k);
      node = child;
      continue;
    }
    const tail = rest.slice(c.k);
    // 중간 노드 하나, 그리고 새 단어가 남으면 잎 하나가 더 생긴다.
    const made = tail === "" ? 1 : 2;
    const label = tail === "" ? child.label.slice(0, c.k) : tail;
    return { lookups, reads, made, flags: 1, label, leftover: 0, end: true };
  }
  return {
    lookups,
    reads,
    made: 0,
    flags: 1,
    label: node.label,
    leftover: 0,
    end: true,
  };
}

/** 조회 하나가 하는 일을 센다. `search` 만 끝 표시를 읽는다. */
function countLocate(root: Peek, s: string, isSearch: boolean): Counted {
  let node = root;
  let rest = s;
  let lookups = 0;
  let reads = 0;
  while (rest !== "") {
    lookups++;
    const child = node.children.get(rest[0] as string);
    if (child === undefined) {
      return {
        lookups,
        reads,
        made: 0,
        flags: 0,
        label: null,
        leftover: 0,
        end: false,
      };
    }
    const c = lcp(rest, child.label);
    reads += c.reads;
    if (c.k === rest.length) {
      return {
        lookups,
        reads,
        made: 0,
        flags: isSearch ? 1 : 0,
        label: child.label,
        leftover: child.label.length - c.k,
        end: child.end,
      };
    }
    if (c.k < child.label.length) {
      return {
        lookups,
        reads,
        made: 0,
        flags: 0,
        label: null,
        leftover: 0,
        end: false,
      };
    }
    rest = rest.slice(child.label.length);
    node = child;
  }
  return {
    lookups,
    reads,
    made: 0,
    flags: isSearch ? 1 : 0,
    label: node.label,
    leftover: 0,
    end: node.end,
  };
}

/** 흉내가 정본에서 갈라지면 그 자리에서 던진다. */
function assertSame(what: string, mine: unknown, ref: unknown): void {
  if (mine !== ref) {
    throw new Error(`${what}: 흉내 ${String(mine)} ≠ 정본 ${String(ref)}`);
  }
}

/* ────────────────────── 계측기 — 트라이 쪽 ────────────────────── */

interface TrieNode {
  children: Map<string, TrieNode>;
  end: boolean;
}
const tnode = (): TrieNode => ({ children: new Map(), end: false });

function buildTrie(words: readonly string[]): TrieNode {
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

/** 노드 수. **재귀로 짜지 않는다** — 길이 100,000 짜리 단어 하나로 깊이가 그만큼 된다. */
function trieNodes(root: TrieNode): number {
  const stack: TrieNode[] = [root];
  let n = 0;
  while (stack.length > 0) {
    const x = stack.pop() as TrieNode;
    n++;
    for (const c of x.children.values()) stack.push(c);
  }
  return n;
}

/**
 * 트라이의 조회 하나가 하는 일. 글자 하나마다 자식 맵을 한 번 보므로 **읽은 글자 수와 맵
 * 조회 횟수가 같다**.
 */
function trieQuery(
  root: TrieNode,
  s: string,
  isSearch: boolean,
): { lookups: number; answer: boolean } {
  let cur: TrieNode | undefined = root;
  let lookups = 0;
  for (const ch of s) {
    lookups++;
    cur = cur.children.get(ch);
    if (cur === undefined) return { lookups, answer: false };
  }
  return { lookups, answer: isSearch ? cur.end : true };
}

/** 트라이의 노드를 경로 순으로 걷는다. 여기서도 스택을 쓴다. */
function trieWalk(
  root: TrieNode,
): { path: string; kids: number; end: boolean }[] {
  const out: { path: string; kids: number; end: boolean }[] = [];
  const stack: [TrieNode, string][] = [[root, ""]];
  while (stack.length > 0) {
    const [n, path] = stack.pop() as [TrieNode, string];
    out.push({ path, kids: n.children.size, end: n.end });
    const kids = [...n.children.entries()].reverse();
    for (const [ch, c] of kids) stack.push([c, path + ch]);
  }
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/* ────────────────────── 계측기 — 목록 쪽 ────────────────────── */

/**
 * 단어를 배열에 담고 매번 앞에서부터 대조하는 방식. 단어 하나마다 **어긋나는 자리까지**
 * 글자를 읽고, 답이 정해지면 거기서 멈춘다.
 */
function listQuery(
  words: readonly string[],
  q: string,
  mode: "search" | "startsWith",
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
function foldQuery(root: FoldNode, s: string, isSearch: boolean): boolean {
  let node = root;
  let rest = s;
  while (rest !== "") {
    const child = node.children.get(rest[0] as string);
    if (child === undefined) return false;
    const c = lcp(rest, child.label);
    if (c.k === rest.length) {
      return isSearch ? child.label.length === c.k && child.end : true;
    }
    if (c.k < child.label.length) return false;
    rest = rest.slice(child.label.length);
    node = child;
  }
  return isSearch ? node.end : true;
}

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
function compareRows(
  good: RadixTree,
  bad: RadixTree,
  queries: readonly (readonly [string, string])[],
): string[][] {
  return queries.map(([op, q]) => {
    const a = op === "search" ? good.search(q) : good.startsWith(q);
    const b = op === "search" ? bad.search(q) : bad.startsWith(q);
    return [`${op}("${q}")`, yn(a), yn(b), a === b ? "같다" : "틀리다"];
  });
}

/* ────────────────────── 전개 걸음 ────────────────────── */

interface Step {
  label: string;
  op: string;
  reads: number;
  lookups: number;
  made: number;
  flags: number;
  at: string;
  leftover: string;
  nodes: number;
  ret: string;
}

/** T1 부터 T10 까지를 **정본을 실제로 실행하면서** 만든다. */
function walkSteps(): Step[] {
  const tree = new RadixTree();
  const root = peek(tree);
  const steps: Step[] = [
    {
      label: "T1",
      op: "시작",
      reads: 0,
      lookups: 0,
      made: 0,
      flags: 0,
      at: "(root)",
      leftover: "-",
      nodes: 1,
      ret: "-",
    },
  ];
  let t = 1;
  for (const word of WORDS) {
    const before = shapeOf(root).nodes;
    const c = countInsert(root, word);
    tree.insert(word);
    const after = shapeOf(root).nodes;
    assertSame(`insert("${word}") 새 노드`, c.made, after - before);
    t++;
    steps.push({
      label: `T${t}`,
      op: `insert("${word}")`,
      reads: c.reads,
      lookups: c.lookups,
      made: c.made,
      flags: c.flags,
      at: c.label ?? "없음",
      leftover: "0",
      nodes: after,
      ret: "없음",
    });
  }
  for (const [op, q] of QUERIES) {
    const isSearch = op === "search";
    const c = countLocate(root, q, isSearch);
    const answer = isSearch ? tree.search(q) : tree.startsWith(q);
    const mine =
      c.label === null ? false : isSearch ? c.leftover === 0 && c.end : true;
    assertSame(`${op}("${q}")`, mine, answer);
    t++;
    steps.push({
      label: `T${t}`,
      op: `${op}("${q}")`,
      reads: c.reads,
      lookups: c.lookups,
      made: 0,
      flags: c.flags,
      at: c.label ?? "없음",
      leftover: c.label === null ? "-" : String(c.leftover),
      nodes: shapeOf(root).nodes,
      ret: yn(answer),
    });
  }
  return steps;
}

/* ────────────────────── 증명 블록 ────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 가장 단순한 방법을 제약 규모에서 수치로 반박한다. */
  costWorstQuery: () => {
    const trie = buildTrie(SHARED_DICT);
    const list = listQuery(SHARED_DICT, SHARED_QUERY, "startsWith");
    const hit = trieQuery(trie, SHARED_QUERY, false);
    const S = SHARED_DICT.reduce((a, w) => a + w.length, 0);
    return [
      table(
        [
          `사전 ${num(DICT_N)} 단어 · 길이 합 ${num(S)}`,
          "답",
          "읽은 글자",
          "조회 1,000 번이면",
        ],
        [
          [
            "목록에 담고 매번 대조한다",
            yn(list.answer),
            num(list.read),
            num(list.read * 1000),
          ],
          [
            "글자마다 노드를 하나씩 두는 트리",
            yn(hit.answer),
            num(hit.lookups),
            num(hit.lookups * 1000),
          ],
        ],
        ["l", "l", "r", "r"],
      ),
      "",
      `조회는 "aaaaaaaa...zzz" (길이 ${DICT_L}) 하나이고 사전에 없다`,
      "└ 목록 방식은 단어 1,000 개를 각각 98 글자까지 대조한다. 트리는 98 글자에서 끝난다",
    ].join("\n");
  },

  /** `deep.build` ③ — 같은 조회 다섯을 두 방식으로 처리하고 계수를 나란히 센다. */
  costFiveQueries: () => {
    const trie = buildTrie(WORDS);
    const rows = QUERIES.map(([op, q]) => {
      const list = listQuery(WORDS, q, op);
      const hit = trieQuery(trie, q, op === "search");
      return [
        `${op}("${q}")`,
        yn(hit.answer),
        num(list.read),
        num(hit.lookups),
      ];
    });
    const sum = (
      f: (op: "search" | "startsWith", q: string) => number,
    ): number => QUERIES.reduce((a, [op, q]) => a + f(op, q), 0);
    rows.push([
      "합계",
      "",
      num(sum((op, q) => listQuery(WORDS, q, op).read)),
      num(sum((op, q) => trieQuery(trie, q, op === "search").lookups)),
    ]);
    return [
      table(
        [
          "조회",
          "답",
          "목록 대조가 읽은 글자",
          "글자마다 노드를 둔 트리가 읽은 글자",
        ],
        rows,
        ["l", "l", "r", "r"],
      ),
      "",
      "└ 목록 대조는 단어가 늘면 함께 늘고, 트리는 조회 문자열의 길이만 따라간다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 조회 다섯을 두 구조로 처리하고 실제 계수를 나란히 적는다. */
  lookupsTwoWays: () => {
    const trie = buildTrie(WORDS);
    const tree = buildRadix(WORDS);
    const root = peek(tree);
    const rows = QUERIES.map(([op, q]) => {
      const hit = trieQuery(trie, q, op === "search");
      const c = countLocate(root, q, op === "search");
      const answer = op === "search" ? tree.search(q) : tree.startsWith(q);
      assertSame(`${op}("${q}") 두 구조의 답`, hit.answer, answer);
      return [
        `${op}("${q}")`,
        yn(answer),
        num(hit.lookups),
        num(hit.lookups),
        num(c.lookups),
        num(c.reads),
      ];
    });
    const sum = (
      f: (op: "search" | "startsWith", q: string) => number,
    ): number => QUERIES.reduce((a, [op, q]) => a + f(op, q), 0);
    rows.push([
      "합계",
      "",
      num(sum((op, q) => trieQuery(trie, q, op === "search").lookups)),
      num(sum((op, q) => trieQuery(trie, q, op === "search").lookups)),
      num(sum((op, q) => countLocate(root, q, op === "search").lookups)),
      num(sum((op, q) => countLocate(root, q, op === "search").reads)),
    ]);
    return [
      table(
        [
          "조회",
          "답",
          "글자마다 노드 · 맵 조회",
          "글자마다 노드 · 글자 대조",
          "접은 트리 · 맵 조회",
          "접은 트리 · 글자 대조",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      "└ 글자 대조는 20 에서 19 로 거의 그대로인데 맵 조회가 20 에서 11 로 준다",
      "  줄어든 9 는 조회 다섯이 지나가기만 하는 노드를 지나느라 맵을 본 횟수다",
    ].join("\n");
  },

  /** `deep.build` ④ — 트라이의 노드 열셋 중 무엇이 아무 결정도 하지 않는가. */
  trieShape: () => {
    const trie = buildTrie(WORDS);
    const nodes = trieWalk(trie);
    const rows = nodes.map((n) => {
      const idle = n.kids === 1 && !n.end;
      return [
        n.path === "" ? "(root)" : n.path,
        String(n.kids),
        n.end ? "그렇다" : "아니다",
        idle ? "없다 — 지나가기만 한다" : n.kids >= 2 ? "갈림" : "단어 끝",
      ];
    });
    const idle = nodes.filter((n) => n.kids === 1 && !n.end).length;
    return [
      table(
        ["노드의 경로", "자식 수", "단어 끝", "이 노드가 정하는 것"],
        rows,
        ["l", "r", "l", "l"],
      ),
      "",
      `노드 ${nodes.length} 개 중 지나가기만 하는 것 ${idle} 개 · 갈림이거나 단어 끝인 것 ${nodes.length - idle} 개`,
      `뿌리는 지나가기만 해도 남긴다 — 나머지를 접으면 1 + ${nodes.length - idle} = ${nodes.length - idle + 1} 개다`,
      "└ 지나가기만 하는 노드는 다음 글자가 무엇인지 말고는 아무것도 정하지 않는다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 가장 단순한 후보(단어 끝을 안 보고 전부 접는다)를 값으로 반박한다. */
  foldCandidate: () => {
    const tree = buildRadix(WORDS);
    const folded = foldWithoutEnd(WORDS);
    const checks: [string, string][] = [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["startsWith", "app"],
      ["startsWith", "appli"],
    ];
    const rows = checks.map(([op, q]) => {
      const isSearch = op === "search";
      const a = isSearch ? tree.search(q) : tree.startsWith(q);
      const b = foldQuery(folded, q, isSearch);
      return [`${op}("${q}")`, yn(a), yn(b), a === b ? "같다" : "틀리다"];
    });
    return [
      table(
        [
          "조회",
          "단어 끝도 함께 보고 접은 답",
          "단어 끝을 안 보고 접은 답",
          "판정",
        ],
        rows,
        ["l", "r", "r", "l"],
      ),
      "",
      table(
        ["구조", "노드 수"],
        [
          ["글자마다 노드 하나", num(trieNodes(buildTrie(WORDS)))],
          ["단어 끝을 안 보고 접는다", num(foldNodes(folded))],
          ["단어 끝도 함께 보고 접는다", num(radixNodes(WORDS))],
        ],
        ["l", "r"],
      ),
      "",
      "└ 노드가 하나 더 줄지만 app 이 단어라는 사실이 함께 사라진다",
      "  app 은 자식이 하나뿐이면서 단어 끝이라, 접는 조건에 단어 끝을 넣어야 살아남는다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 사전을 바꿔 가며 두 구조의 노드 수를 나란히 센다. */
  nodeCount: () => {
    const sets: [string, readonly string[]][] = [
      ["{apple, application, app, appl}", WORDS],
      ["{app, bat, cup}", ["app", "bat", "cup"]],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자가 갈리는 ${num(DICT_N)} 단어`, CORPUS(DICT_N, 0)],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, ["a".repeat(LIMIT)]],
    ];
    const rows = sets.map(([name, ws]) => {
      const S = ws.reduce((a, w) => a + w.length, 0);
      return [
        name,
        num(ws.length),
        num(S),
        num(trieNodes(buildTrie(ws))),
        num(radixNodes(ws)),
      ];
    });
    return [
      table(
        [
          "단어 집합",
          "단어 수 N",
          "길이 합 S",
          "글자마다 노드",
          "라벨로 접은 노드",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 셋째·넷째·다섯째 줄은 길이 합이 똑같이 100,000 인데 왼쪽 값이 1,139 · 98,042 · 100,001 로 갈린다",
      "  오른쪽 값은 다섯 줄 모두 단어 수의 두 배를 넘지 않는다",
    ].join("\n");
  },

  /** `deep.walk` 단계 — 삽입 넷을 하나씩 끝낸 뒤의 트리. */
  shapeAfterInserts: () => {
    const parts: string[] = [];
    const grown: string[] = [];
    for (const w of WORDS) {
      grown.push(w);
      const tree = buildRadix(grown);
      parts.push(
        `${grown.map((x) => `insert("${x}")`).join(" ")} 까지 — 노드 ${shapeOf(peek(tree)).nodes} 개`,
        drawRadix(peek(tree)),
        "",
      );
    }
    parts.push(
      "└ * 는 단어 끝 표시(end = true)다. 라벨을 위에서 아래로 이으면 그 노드의 경로 문자열이 된다",
    );
    return parts.join("\n");
  },

  /** `deep.walk.pause` 1 — 가른 뒤 부모의 자식 자리를 안 바꾸면. */
  pauseRelink: () => {
    const { good, bad } = pair(dropRelink);
    const rows = compareRows(good, bad, [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["search", "application"],
      ["startsWith", "appli"],
      ["startsWith", "bat"],
    ]);
    return [
      table(["조회", "정본이 낸 답", "부모를 안 바꾼 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `정본의 노드 수  ${shapeOf(peek(good)).nodes}`,
      `변이의 노드 수  ${shapeOf(peek(bad)).nodes}`,
      "",
      "변이가 만든 트리 전체",
      drawRadix(peek(bad)),
      "└ 뿌리는 라벨이 줄어든 옛 자식을 그대로 가리키고, 새로 만든 중간 노드는 아무도 안 가리킨다",
    ].join("\n");
  },

  /** `deep.walk.pause` 2 — 라벨 전체를 안 맞춰 보면. */
  pauseWholeLabel: () => {
    const { good, bad } = pair(skipLabelCheck);
    const rows = compareRows(good, bad, [
      ["search", "app"],
      ["search", "apple"],
      ["search", "apqle"],
      ["search", "applied"],
      ["startsWith", "apqle"],
      ["startsWith", "bat"],
    ]);
    return [
      table(["조회", "정본이 낸 답", "라벨을 안 맞춰 본 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ apqle 도 applied 도 담은 적이 없는데 참이 된다",
      "  자식 맵의 키는 라벨의 첫 글자뿐이라, 첫 글자가 맞아도 나머지는 아직 아무것도 확인하지 않은 것이다",
    ].join("\n");
  },

  /** `deep.walk.pause` 3 — 라벨 도중에 끝난 문자열을 도착으로 안 보면. */
  pauseMidLabel: () => {
    const { good, bad } = pair(needWholeLabel);
    const searches: (readonly [string, string])[] = [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["search", "application"],
      ["search", "appli"],
      ["search", "applied"],
    ];
    const prefixes: (readonly [string, string])[] = [
      ["startsWith", "appl"],
      ["startsWith", "appli"],
      ["startsWith", "applic"],
      ["startsWith", "bat"],
    ];
    const rows = [
      ...compareRows(good, bad, searches),
      ...compareRows(good, bad, prefixes),
    ];
    const wrongSearch = compareRows(good, bad, searches).filter(
      (r) => r[3] === "틀리다",
    ).length;
    return [
      table(
        ["조회", "정본이 낸 답", "라벨을 다 써야 도착인 답", "판정"],
        rows,
        ["l", "r", "r", "l"],
      ),
      "",
      `search 여섯 중 틀린 것  ${wrongSearch} 개`,
      "└ 라벨 한가운데서 끝나는 접두사만 거짓이 된다. search 는 그 자리도 어차피 거짓이라 답이 안 바뀐다",
    ].join("\n");
  },

  /** `deep.walk` — T1 부터 T10 까지의 상태값. */
  walkTrace: () => {
    const steps = walkSteps();
    return [
      table(
        [
          "걸음",
          "무엇을 하는가",
          "대조한 글자",
          "도착한 노드의 라벨",
          "라벨에 남은 글자",
          "새 노드",
          "노드 수",
          "반환",
        ],
        steps.map((s) => [
          s.label,
          s.op,
          String(s.reads),
          s.at,
          s.leftover,
          String(s.made),
          String(s.nodes),
          s.ret,
        ]),
        ["l", "l", "r", "l", "r", "r", "r", "l"],
      ),
      "",
      "└ T5 는 새 노드가 0 개다 — 라벨을 전부 소비하며 내려가다 남은 글자가 없어진 걸음이다",
      "  T7 과 T8 은 같은 문자열을 물었는데 답이 갈린다. 라벨에 6 글자가 남은 것을 보느냐 마느냐가 그 차이다",
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 결과. 앞에서 안 나온 경계를 함께 확인한다. */
  finalRun: () => {
    const tree = buildRadix(WORDS);
    const empty = new RadixTree();
    const twice = new RadixTree();
    twice.insert("app");
    twice.insert("app");
    const one = new RadixTree();
    one.insert("a");
    const rows: string[][] = [
      ...QUERIES.map(([op, q]) => [
        `tree.${op}("${q}")`,
        yn(op === "search" ? tree.search(q) : tree.startsWith(q)),
      ]),
      ['tree.search("apple")', yn(tree.search("apple"))],
      ['tree.search("applepie")', yn(tree.search("applepie"))],
      ['tree.startsWith("application")', yn(tree.startsWith("application"))],
      ['빈 트리의 search("app")', yn(empty.search("app"))],
      ['빈 트리의 startsWith("app")', yn(empty.startsWith("app"))],
      ['app 을 두 번 담은 뒤 search("app")', yn(twice.search("app"))],
      ['길이 1 짜리 단어만 담고 search("a")', yn(one.search("a"))],
    ];
    return [
      table(["실행", "결과"], rows, ["l", "l"]),
      "",
      "└ 아래 일곱 줄은 전개에서 안 나온 자리다 — 담긴 단어 그 자체 · 담긴 단어보다 긴 조회 ·",
      "  단어와 같은 접두사 · 빈 트리 둘 · 중복 삽입 · 길이 1 짜리 단어",
    ].join("\n");
  },

  /** `invariant` ③ — 가른 자리의 단어 끝 표시를 빼면 무엇이 어떻게 나오는가. */
  mutantMidEnd: () => {
    const { good, bad } = pair(midNotEnd);
    const rows = compareRows(good, bad, [
      ["search", "app"],
      ["search", "appl"],
      ["search", "apple"],
      ["startsWith", "app"],
      ["startsWith", "bat"],
    ]);
    const idle = (tree: RadixTree): string => {
      const stack: [Peek, boolean][] = [[peek(tree), true]];
      const out: string[] = [];
      while (stack.length > 0) {
        const [n, isRoot] = stack.pop() as [Peek, boolean];
        if (!isRoot && !n.end && n.children.size < 2) out.push(n.label);
        for (const c of n.children.values()) stack.push([c, false]);
      }
      return out.length === 0 ? "없다" : out.join(" ");
    };
    return [
      table(["조회", "정본이 낸 답", "끝 표시를 안 남긴 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      table(
        ["구조", "노드 수", "단어 끝도 아니고 자식도 둘 미만인 노드"],
        [
          ["정본", num(shapeOf(peek(good)).nodes), idle(good)],
          ["변이", num(shapeOf(peek(bad)).nodes), idle(bad)],
        ],
        ["l", "r", "l"],
      ),
      "",
      "└ 노드 수는 같은데 라벨 app 짜리 노드가 아무것도 정하지 않는 자리가 된다",
      "  그 노드가 남아 있으므로 startsWith 은 그대로 참이고, 틀리는 것은 search 하나다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  mathNodeSet: () => {
    const prefixes = new Set<string>([""]);
    for (const w of WORDS) {
      for (let k = 1; k <= w.length; k++) prefixes.add(w.slice(0, k));
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
    const branch = [...prefixes].filter((p) => nextChars(p).size >= 2).sort();
    const nodes = new Set<string>(["", ...WORDS, ...branch]);
    const sorted = [...nodes].sort();
    const tree = buildRadix(WORDS);
    return [
      table(
        ["원소", "빈 문자열인가", "담은 단어인가", "갈림인가"],
        sorted.map((p) => [
          p === "" ? '""(빈 문자열)' : p,
          p === "" ? "그렇다" : "-",
          WORDS.includes(p as (typeof WORDS)[number]) ? "그렇다" : "-",
          branch.includes(p) ? "그렇다" : "-",
        ]),
        ["l", "l", "l", "l"],
      ),
      "",
      `집합의 크기 ${nodes.size} · 접은 트리의 노드 수 ${shapeOf(peek(tree)).nodes} · 접두사 집합의 크기 ${prefixes.size}`,
      `라벨 글자 합 ${shapeOf(peek(tree)).labelChars} · 접두사 집합의 크기에서 1 을 뺀 값 ${prefixes.size - 1}`,
      "└ 위 두 수가 같고 아래 두 수도 같다. 갈림은 appl 하나뿐이다",
    ].join("\n");
  },

  /** `deep.math` ④ — 상한에 제약 규모를 넣어 수치를 낸다. */
  mathBounds: () => {
    /** 낱말 하나씩 앞에 글자를 더 붙인 사전. 갈림과 단어 끝이 번갈아 나온다. */
    const caterpillar = (n: number): string[] =>
      Array.from({ length: n }, (_, i) => `${"a".repeat(i)}b`);
    const capN = 446; // 446 · 447 / 2 = 99,681 로 길이 합이 100,000 을 안 넘는 최대치
    const cases: [string, readonly string[]][] = [
      ["{apple, application, app, appl}", WORDS],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자가 갈리는 ${num(DICT_N)} 단어`, CORPUS(DICT_N, 0)],
      [`b · ab · aab … 를 ${num(capN)} 개`, caterpillar(capN)],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, ["a".repeat(LIMIT)]],
    ];
    const rows = cases.map(([name, ws]) => {
      const S = ws.reduce((a, w) => a + w.length, 0);
      const V = radixNodes(ws);
      return [
        name,
        num(ws.length),
        num(S),
        num(V),
        num(2 * ws.length),
        num(trieNodes(buildTrie(ws))),
        num(S + 1),
      ];
    });
    return [
      table(
        [
          "단어 집합",
          "N",
          "S",
          "접은 노드",
          "상한 2N",
          "글자마다 노드",
          "상한 S + 1",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `제약 규모 S = ${num(LIMIT)} · 단어 ${num(DICT_N)} 개면`,
      `  접은 트리의 노드 수 상한     2N = ${num(2 * DICT_N)}`,
      `  글자마다 노드를 둔 트리의 상한  S + 1 = ${num(LIMIT + 1)}`,
      `  두 상한의 비                 ${((LIMIT + 1) / (2 * DICT_N)).toFixed(1)} 배`,
      "└ 넷째 줄이 상한 2N 에 가장 가까운 입력이다. 글자마다 노드를 두는 쪽은 다섯째 줄에서 상한과 정확히 같아진다",
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음으로 기본 연산을 센다. */
  perfCount: () => {
    const steps = walkSteps();
    const body = steps.slice(1);
    const rows = body.map((s) => [
      s.label,
      s.op,
      String(s.lookups),
      String(s.reads),
      String(s.made),
      String(s.flags),
      String(s.lookups + s.reads + s.made + s.flags),
    ]);
    const total = (f: (s: Step) => number): number =>
      body.reduce((a, s) => a + f(s), 0);
    rows.push([
      "",
      "합계",
      String(total((s) => s.lookups)),
      String(total((s) => s.reads)),
      String(total((s) => s.made)),
      String(total((s) => s.flags)),
      String(total((s) => s.lookups + s.reads + s.made + s.flags)),
    ]);
    const tree = buildRadix(WORDS);
    const shape = shapeOf(peek(tree));
    const S = WORDS.reduce((a, w) => a + w.length, 0);
    return [
      table(
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
        ["l", "l", "r", "r", "r", "r", "r"],
      ),
      "",
      `담는 쪽   글자 대조 ${total((s) => (s.op.startsWith("insert") ? s.reads : 0))} ≤ S = ${S} · 노드 생성 ${total((s) => s.made)} = V - 1 = ${shape.nodes - 1} · 끝 표시 쓰기 ${WORDS.length} = N`,
      `묻는 쪽   글자 대조 ${total((s) => (s.op.startsWith("insert") ? 0 : s.reads))} · 맵 조회 ${total((s) => (s.op.startsWith("insert") ? 0 : s.lookups))}`,
      "└ 어느 항에도 담긴 단어의 개수를 곱하는 자리가 없다",
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
    /** 접두사 사슬 — 깊이를 최대로 만든다. 길이 합이 m(m+1)/2 라 446 이 한계다. */
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
      let budget = LIMIT - out.reduce((x, w) => x + w.length, 0);
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
      [
        `길이 ${num(LIMIT)} 짜리 단어 하나`,
        ["a".repeat(LIMIT)],
        "a".repeat(LIMIT),
      ],
      [
        `a · aa · aaa … 를 ${num(CHAIN_N)} 개`,
        chain(CHAIN_N),
        "a".repeat(CHAIN_N),
      ],
      ["길이 3 이하 단어 전부와 길이 4 단어 일부", shortest(), "aaaa"],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT, SHARED_QUERY],
    ];
    const rows = shapes.map(([name, ws, q]) => {
      const tree = buildRadix(ws);
      const c = countLocate(peek(tree), q, true);
      return [
        name,
        num(ws.length),
        num(ws.reduce((a, w) => a + w.length, 0)),
        num(shapeOf(peek(tree)).nodes),
        num(c.lookups),
        num(c.reads),
      ];
    });
    return [
      table(
        [
          "입력의 모양",
          "단어 수 N",
          "길이 합",
          "노드 수",
          "그 조회의 맵 조회",
          "그 조회의 글자 대조",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 첫 줄이 글자 대조를, 둘째 줄이 맵 조회를, 셋째 줄이 노드 수를 각각 최대로 만든다",
      "  셋을 한꺼번에 최대로 만드는 입력은 없다 — 첫 줄은 노드가 둘이고 셋째 줄은 조회가 네 번 만에 끝난다",
      "  넷째 줄은 노드가 1,043 개인데 조회 하나가 맵을 두 번밖에 안 본다 — 조회 비용을 누르는 것은 단어 개수가 아니라 문자열의 길이다",
    ].join("\n");
  },

  /** `purpose.alt` — 저장 칸이 뒤집히는 공유 길이를 스윕으로 찾는다. */
  altSweep: () => {
    const rows: string[][] = [];
    for (const share of [0, 50, 80, 90, 94, 95, 96, 97]) {
      const words = CORPUS(DICT_N, share);
      const r = radixCells(words);
      const t = trieCells(words);
      rows.push([
        String(share),
        num(radixNodes(words)),
        num(trieNodes(buildTrie(words))),
        num(r),
        num(t),
        r < t ? "접은 쪽이 적다" : "글자마다 노드가 적다",
      ]);
    }
    return [
      table(
        [
          "공통 접두사 길이",
          "접은 노드 수",
          "글자마다 노드 수",
          "접은 저장 칸",
          "글자마다 저장 칸",
          "어느 쪽이 적은가",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      "└ 단어 1,000 개 · 길이 100 · 길이 합 100,000 은 여덟 줄이 다 같다. 공통 접두사 길이만 바꿨다",
      "  셋째 열이 1,043 에 가까워질수록 접어서 없앨 노드가 줄고, 96 과 97 사이에서 순서가 뒤집힌다",
    ].join("\n");
  },

  /** `purpose.alt` — 내주는 축이 정말 한 번도 안 갈리는지 공유 길이 전수로 확인한다. */
  altQuerySweep: () => {
    const radix: number[] = [];
    const trie: number[] = [];
    let flipped = 0;
    for (let share = 0; share <= DICT_L - 3; share++) {
      const words = CORPUS(DICT_N, share);
      const queries = words.map((w) => w.slice(0, QUERY_LEN));
      const r = radixQueryOps(words, queries);
      const t = trieQueryOps(words, queries);
      radix.push(r);
      trie.push(t);
      if (r < t) flipped++;
    }
    return [
      table(
        ["공유 길이 0 부터 97 까지 전수", "가장 적을 때", "가장 많을 때"],
        [
          [
            "라벨로 접은 트리 · 조회 기본 연산",
            num(Math.min(...radix)),
            num(Math.max(...radix)),
          ],
          [
            "글자마다 노드 · 조회 기본 연산",
            num(Math.min(...trie)),
            num(Math.max(...trie)),
          ],
        ],
        ["l", "r", "r"],
      ),
      "",
      `접은 쪽이 더 적었던 공유 길이  ${flipped} 개 / ${radix.length} 개`,
      "└ 이 축은 한 번도 안 갈린다. 접은 쪽은 노드마다 맵 조회와 글자 대조를 둘 다 하고,",
      "  글자마다 노드를 두는 쪽은 맵 조회 한 번이 글자 하나를 함께 처리한다",
    ].join("\n");
  },
};
