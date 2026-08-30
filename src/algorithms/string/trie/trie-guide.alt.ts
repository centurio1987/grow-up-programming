/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **기본
 * 연산 수**(읽은 글자 + 노드 생성 + 배열 원소 이동)와 **저장 칸**이다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts trie-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 단어 셋(`app`·`apple`·`ape`)을 쓰는데,
 * 그 크기에서는 이분 탐색이 한 번에 끝나 두 설계의 계수가 상수에 묻힌다. 그래서 제약이
 * 정한 길이 합 100,000 을 그대로 채운 사전을 쓴다 — 길이 100 짜리 단어 1,000 개다.
 * **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도 적는다.
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

/** 기본 작업 목록이 쓰는 사전 — 공통 접두사 50 글자. */
export const WORKLOAD_SHARE = 50;

/* ────────────────────────── 저장 칸 ────────────────────────── */

interface Node {
  children: Map<string, Node>;
  end: boolean;
}
const node = (): Node => ({ children: new Map(), end: false });

function build(words: readonly string[]): Node {
  const root = node();
  for (const w of words) {
    let cur = root;
    for (const ch of w) {
      let next = cur.children.get(ch);
      if (next === undefined) {
        next = node();
        cur.children.set(ch, next);
      }
      cur = next;
    }
    cur.end = true;
  }
  return root;
}

function nodeCount(n: Node): number {
  let sum = 1;
  for (const c of n.children.values()) sum += nodeCount(c);
  return sum;
}

/**
 * 트라이가 잡는 칸 — 노드마다 끝 표시 한 칸, 간선마다 「글자 → 자식」 항목 한 칸.
 * 노드가 `V` 개면 간선은 `V - 1` 개이므로 `2V - 1` 이다.
 */
export function trieCells(words: readonly string[]): number {
  return 2 * nodeCount(build(words)) - 1;
}

/**
 * 정렬 배열이 잡는 칸 — 글자를 그대로 담고, 단어마다 시작 위치 하나를 둔다.
 * 접두사를 공유해도 글자를 한 번 더 담으므로 공유의 정도를 보지 않는다.
 */
export function arrayCells(words: readonly string[]): number {
  return words.reduce((a, w) => a + w.length, 0) + words.length;
}

/* ────────────────────────── 기본 연산 ────────────────────────── */

/** 두 문자열을 앞에서부터 대조한다. 읽은 글자 수와 대소를 함께 돌려준다. */
function compare(a: string, b: string): { read: number; sign: number } {
  let k = 0;
  let read = 0;
  while (k < a.length && k < b.length) {
    read++;
    if (a[k] !== b[k])
      return { read, sign: (a[k] as string) < (b[k] as string) ? -1 : 1 };
    k++;
  }
  return { read, sign: Math.sign(a.length - b.length) };
}

/** 이 가이드가 가르치는 절차 — 접두사 트리. 정본과 같은 절차에 계수만 덧붙였다. */
function trieOps(
  words: readonly string[],
  queries: readonly string[],
): {
  insert: number;
  query: number;
} {
  const root = node();
  let insert = 0;
  for (const w of words) {
    let cur = root;
    for (const ch of w) {
      insert++; // 자식 맵 조회
      let next = cur.children.get(ch);
      if (next === undefined) {
        next = node();
        cur.children.set(ch, next);
        insert++; // 노드 생성
      }
      cur = next;
    }
    cur.end = true;
    insert++; // 끝 표시 쓰기
  }
  let query = 0;
  for (const q of queries) {
    let cur: Node | undefined = root;
    for (const ch of q) {
      query++;
      cur = cur.children.get(ch);
      if (cur === undefined) break;
    }
    if (cur !== undefined) query++; // 끝 표시 읽기
  }
  return { insert, query };
}

/**
 * 경쟁 설계 — **정렬을 유지하는 배열과 이분 탐색.**
 *
 * 삽입은 이분 탐색으로 자리를 찾고 뒤쪽을 한 칸씩 옮긴다. 조회는 같은 이분 탐색으로
 * 후보 하나를 찾고 그 단어가 조회 문자열로 시작하는지 본다 — 정렬돼 있으므로 어떤 단어가
 * 그 접두사로 시작한다면 그 자리에서 시작한다.
 */
function sortedArrayOps(
  words: readonly string[],
  queries: readonly string[],
): { insert: number; query: number } {
  const arr: string[] = [];
  let insert = 0;
  for (const w of words) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const c = compare(arr[mid] as string, w);
      insert += c.read;
      if (c.sign < 0) lo = mid + 1;
      else hi = mid;
    }
    insert += arr.length - lo; // 뒤쪽 원소를 한 칸씩 옮긴다
    arr.splice(lo, 0, w);
  }
  let query = 0;
  for (const q of queries) {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const c = compare(arr[mid] as string, q);
      query += c.read;
      if (c.sign < 0) lo = mid + 1;
      else hi = mid;
    }
    if (lo < arr.length) query += compare(arr[lo] as string, q).read;
  }
  return { insert, query };
}

/* ────────────────────────── 작업 목록 ────────────────────────── */

/** 사전에 담는 단어 1,000 개. */
export function workloadWords(): string[] {
  return CORPUS(N, WORKLOAD_SHARE);
}

/**
 * 조회 1,000 개. 사전에 있는 단어의 **앞 60 글자**를 묻는다 — 공통 접두사 50 글자를 지나
 * 갈라진 뒤까지 가는 접두사라, 두 설계가 다 끝까지 대조한다.
 */
export function workloadQueries(): string[] {
  return workloadWords().map((w) => w.slice(0, 60));
}

export const cases = {
  "접두사 트리": () => {
    const ops = trieOps(workloadWords(), workloadQueries());
    return {
      "삽입 1,000 개 · 기본 연산": ops.insert,
      "조회 1,000 회 · 기본 연산": ops.query,
      "공유 47 글자 · 저장 칸": trieCells(CORPUS(N, 47)),
      "공유 48 글자 · 저장 칸": trieCells(CORPUS(N, 48)),
    };
  },
  "정렬 배열과 이분 탐색": () => {
    const ops = sortedArrayOps(workloadWords(), workloadQueries());
    return {
      "삽입 1,000 개 · 기본 연산": ops.insert,
      "조회 1,000 회 · 기본 연산": ops.query,
      "공유 47 글자 · 저장 칸": arrayCells(CORPUS(N, 47)),
      "공유 48 글자 · 저장 칸": arrayCells(CORPUS(N, 48)),
    };
  },
};
