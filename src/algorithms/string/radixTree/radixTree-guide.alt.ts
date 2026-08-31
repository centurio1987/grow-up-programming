/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **저장
 * 칸**(글자 · 단어 끝 표시 · 자식 가리킴을 각각 한 칸)과 **기본 연산 수**(자식 맵 조회 +
 * 글자 대조 + 노드 생성 + 끝 표시 읽기·쓰기)다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts radixTree-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 네 단어(`apple`·`application`·`app`·
 * `appl`)를 쓰는데, 그것은 **사전 하나뿐이라 움직일 값이 없다**. 우열이 뒤집히는 자리를
 * 대려면 공유의 정도를 바꿔 가며 재야 하고, 그래서 제약이 정한 길이 합 100,000 을 그대로
 * 채운 사전을 쓴다 — 길이 100 짜리 단어 1,000 개다. **난수를 쓰지 않으므로 시드가 없다** —
 * 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
 */

/** 사전의 단어 수. */
export const N = 1000;

/** 단어 하나의 길이. `N × L` 이 제약이 정한 길이 합 100,000 이다. */
export const L = 100;

/** 소문자 세 글자로 적은 `i`. 단어 1,000 개를 서로 다르게 만드는 자리다. */
export function base26(i: number): string {
  const a = "abcdefghijklmnopqrstuvwxyz";
  return `${a[Math.floor(i / 676) % 26]}${a[Math.floor(i / 26) % 26]}${a[i % 26]}`;
}

/**
 * 앞 `share` 글자가 전부 같고, 그다음 세 글자가 단어마다 다르고, 나머지가 채움 글자인
 * 단어 `n` 개. `share` 하나만 바꾸면 길이 합을 100,000 으로 고정한 채 **접두사 공유의
 * 정도**만 움직일 수 있다.
 */
export function CORPUS(n: number, share: number): string[] {
  return Array.from(
    { length: n },
    (_, i) => "a".repeat(share) + base26(i) + "z".repeat(L - share - 3),
  );
}

/** 본문 대조가 쓰는 두 자리. 이 사이에서 저장 칸과 삽입 연산의 순서가 뒤집힌다. */
export const SHARE_BEFORE = 96;
export const SHARE_AFTER = 97;

/** 조회 하나의 길이. 공통 접두사를 지나 갈라진 뒤까지 가는 접두사다. */
export const QUERY_LEN = 60;

/* ────────────────────── 글자 대조 ────────────────────── */

/**
 * 두 문자열이 앞에서부터 몇 글자까지 같은가. **읽은 글자 수도 함께 돌려준다** — 어긋나는
 * 자리 한 번을 더 읽고, 한쪽이 먼저 끝나면 그 자리는 안 읽는다.
 */
function lcp(a: string, b: string): { k: number; reads: number } {
  const limit = Math.min(a.length, b.length);
  let k = 0;
  while (k < limit && a[k] === b[k]) k++;
  return { k, reads: k < limit ? k + 1 : k };
}

/* ────────────────────── 이 가이드가 가르치는 절차 — 라딕스 트리 ────────────────────── */

interface RadixNode {
  children: Map<string, RadixNode>;
  end: boolean;
  label: string;
}
const rnode = (label: string): RadixNode => ({
  children: new Map(),
  end: false,
  label,
});

/** 정본과 같은 절차에 계수만 덧붙인 것. */
function radixInsertAll(words: readonly string[]): {
  root: RadixNode;
  ops: number;
} {
  const root = rnode("");
  let ops = 0;
  for (const w of words) {
    let node = root;
    let rest = w;
    let done = false;
    while (rest !== "") {
      const head = rest[0] as string;
      ops++; // 자식 맵 조회
      const child = node.children.get(head);
      if (child === undefined) {
        const leaf = rnode(rest);
        leaf.end = true;
        node.children.set(head, leaf);
        ops += 3; // 노드 생성 · 끝 표시 쓰기 · 맵에 걸기
        done = true;
        break;
      }
      const c = lcp(rest, child.label);
      ops += c.reads; // 글자 대조
      if (c.k === child.label.length) {
        rest = rest.slice(c.k);
        node = child;
        continue;
      }
      const mid = rnode(child.label.slice(0, c.k));
      child.label = child.label.slice(c.k);
      mid.children.set(child.label[0] as string, child);
      node.children.set(head, mid);
      ops += 3; // 중간 노드 생성 · 기존 자식 걸기 · 부모 재연결
      const tail = rest.slice(c.k);
      if (tail === "") {
        mid.end = true;
        ops++; // 끝 표시 쓰기
      } else {
        const leaf = rnode(tail);
        leaf.end = true;
        mid.children.set(tail[0] as string, leaf);
        ops += 3; // 노드 생성 · 끝 표시 쓰기 · 맵에 걸기
      }
      done = true;
      break;
    }
    if (!done) {
      node.end = true;
      ops++; // 끝 표시 쓰기
    }
  }
  return { root, ops };
}

/** 조회 하나가 쓰는 기본 연산. `startsWith` 와 같은 절차이고 끝 표시 읽기만 더 센다. */
function radixQueryAll(root: RadixNode, queries: readonly string[]): number {
  let ops = 0;
  for (const s of queries) {
    let node = root;
    let rest = s;
    while (rest !== "") {
      ops++; // 자식 맵 조회
      const child = node.children.get(rest[0] as string);
      if (child === undefined) break;
      const c = lcp(rest, child.label);
      ops += c.reads;
      if (c.k === rest.length) {
        ops++; // 끝 표시 읽기
        break;
      }
      if (c.k < child.label.length) break;
      rest = rest.slice(child.label.length);
      node = child;
    }
  }
  return ops;
}

/** 노드 수와 라벨 글자 합. **재귀로 짜지 않는다** — 깊이가 제약 규모까지 갈 수 있다. */
function radixShape(root: RadixNode): { nodes: number; labelChars: number } {
  const stack: RadixNode[] = [root];
  let nodes = 0;
  let labelChars = 0;
  while (stack.length > 0) {
    const n = stack.pop() as RadixNode;
    nodes++;
    labelChars += n.label.length;
    for (const c of n.children.values()) stack.push(c);
  }
  return { nodes, labelChars };
}

/**
 * 라딕스 트리가 잡는 칸 — 라벨 글자 합 + 자식 맵의 키 글자(간선마다 하나) + 노드마다 단어 끝
 * 표시 하나 + 간선마다 자식 가리킴 하나. 노드가 `V` 개면 간선은 `V - 1` 개다.
 */
export function radixCells(words: readonly string[]): number {
  const s = radixShape(radixInsertAll(words).root);
  return s.labelChars + 3 * s.nodes - 2;
}

/* ────────────────────── 경쟁 설계 — 트라이 ────────────────────── */

interface TrieNode {
  children: Map<string, TrieNode>;
  end: boolean;
}
const tnode = (): TrieNode => ({ children: new Map(), end: false });

/**
 * 경쟁 설계 — **글자 하나마다 노드 하나를 두는 접두사 트리**(`trie` 편이 가르치는 것).
 * 갈림이 없는 구간도 노드로 남겨 두는 대신, 노드가 라벨 문자열을 들지 않는다.
 */
function trieInsertAll(words: readonly string[]): {
  root: TrieNode;
  ops: number;
} {
  const root = tnode();
  let ops = 0;
  for (const w of words) {
    let cur = root;
    for (const ch of w) {
      ops++; // 자식 맵 조회
      let next = cur.children.get(ch);
      if (next === undefined) {
        next = tnode();
        cur.children.set(ch, next);
        ops += 2; // 노드 생성 · 맵에 걸기
      }
      cur = next;
    }
    cur.end = true;
    ops++; // 끝 표시 쓰기
  }
  return { root, ops };
}

function trieQueryAll(root: TrieNode, queries: readonly string[]): number {
  let ops = 0;
  for (const s of queries) {
    let cur: TrieNode | undefined = root;
    for (const ch of s) {
      ops++;
      cur = cur.children.get(ch);
      if (cur === undefined) break;
    }
    if (cur !== undefined) ops++; // 끝 표시 읽기
  }
  return ops;
}

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
 * 트라이가 잡는 칸 — 간선마다 맵의 키 글자 하나와 자식 가리킴 하나, 노드마다 단어 끝 표시
 * 하나. 라벨 문자열이 없으므로 글자는 간선 수만큼이다.
 */
export function trieCells(words: readonly string[]): number {
  return 3 * trieNodes(trieInsertAll(words).root) - 2;
}

/* ────────────────────── 작업 목록 ────────────────────── */

/** 사전에 담는 단어 1,000 개. */
export function workloadWords(share: number): string[] {
  return CORPUS(N, share);
}

/** 조회 1,000 개. 사전에 있는 단어의 앞 `QUERY_LEN` 글자를 묻는다. */
export function workloadQueries(share: number): string[] {
  return workloadWords(share).map((w) => w.slice(0, QUERY_LEN));
}

/** 두 설계의 조회 계수. 시험이 「단어 수를 안 본다」를 확인할 때도 쓴다. */
export function radixQueryOps(
  words: readonly string[],
  queries: readonly string[],
): number {
  return radixQueryAll(radixInsertAll(words).root, queries);
}

export function trieQueryOps(
  words: readonly string[],
  queries: readonly string[],
): number {
  return trieQueryAll(trieInsertAll(words).root, queries);
}

export const cases = {
  "라딕스 트리": () => {
    const before = workloadWords(SHARE_BEFORE);
    const after = workloadWords(SHARE_AFTER);
    return {
      "공유 96 글자 · 저장 칸": radixCells(before),
      "공유 97 글자 · 저장 칸": radixCells(after),
      "공유 96 글자 · 삽입 기본 연산": radixInsertAll(before).ops,
      "공유 97 글자 · 삽입 기본 연산": radixInsertAll(after).ops,
      "공유 97 글자 · 조회 기본 연산": radixQueryAll(
        radixInsertAll(after).root,
        workloadQueries(SHARE_AFTER),
      ),
    };
  },
  트라이: () => {
    const before = workloadWords(SHARE_BEFORE);
    const after = workloadWords(SHARE_AFTER);
    return {
      "공유 96 글자 · 저장 칸": trieCells(before),
      "공유 97 글자 · 저장 칸": trieCells(after),
      "공유 96 글자 · 삽입 기본 연산": trieInsertAll(before).ops,
      "공유 97 글자 · 삽입 기본 연산": trieInsertAll(after).ops,
      "공유 97 글자 · 조회 기본 연산": trieQueryAll(
        trieInsertAll(after).root,
        workloadQueries(SHARE_AFTER),
      ),
    };
  },
};
