/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 잣대**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다
 * 달라 「본문의 수치가 실측과 일치하는가」(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/string/longestPalindrome/longestPalindrome-guide.alt.ts
 *
 * **잣대 둘의 세는 법을 여기서 못 박는다.**
 *
 * - **배열 칸 접근** — 배열이나 문자열의 한 칸을 읽거나 쓸 때마다 1. 배열을 잡고 0 으로
 *   채우는 것도 칸 수만큼 센다. 두 설계에 같은 규칙을 적용한다.
 * - **저장 칸** — 절차가 잡는 배열 칸의 최대 개수.
 *
 * **갈리는 축은 「중간에 답을 묻는 횟수」다.** 이 글의 절차는 문자열 전체를 받아야 시작하므로,
 * 글자가 하나 붙을 때마다 답을 다시 물으면 그때마다 처음부터 다시 실행한다. 회문 트리는
 * 글자 하나를 뒤에 붙이는 갱신만으로 답을 이어 가므로 물어보는 횟수가 늘어도 비용이 거의
 * 그대로다. 그래서 물어보는 횟수 `q` 가 경계를 정한다.
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 입력은 일곱 글자라 중간에 답을 물을 자리가
 * 여섯뿐이고, 회문 트리가 처음에 잡는 전이표 `(n+2) × 26` 칸이 그 규모에서는 전체의 대부분을
 * 차지해 경계가 규모의 잡음에 묻힌다. 전개 입력의 값도 함께 내고(`전개 입력 · …`), 경계를
 * 보이는 데는 아래 `SWEEP_N` 을 쓴다. 그 사실은 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** xorshift32 를 시드 `20260908` 로 돌려 `a`~`z` 를 뽑고
 * 길이를 제약 상한인 100,000 으로 둔다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로
 * 바꾸지 않는다(L20).
 *
 * **경쟁 설계는 매 실행마다 정본과 답을 대조한다.** 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 문제의 값이다(2026-09-03 `digitDp` 가 세운 규칙).
 */

import { longestPalindrome } from "./longestPalindrome-guide.ref.ts";

/** 문제가 정한 문자 집합의 크기 — 소문자 영문 스물여섯. */
const SIGMA = 26;

/** 본문 전개가 쓰는 문자열. */
export const WALK_S = "ababbaa";

/** 스윕이 쓰는 문자열의 길이 — 제약 상한이다. */
export const SWEEP_N = 100_000;

/** 스윕 입력의 생성식 — xorshift32 를 시드 20260908 로 돌려 `a`~`z` 를 뽑는다. */
export function generate(n: number, seed = 20260908): string {
  let x = seed >>> 0;
  let out = "";
  for (let i = 0; i < n; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    out += String.fromCharCode(97 + (x % SIGMA));
  }
  return out;
}

const SWEEP_TEXT = generate(SWEEP_N);

/* ──────────────── 이 글의 절차 — 칸 접근을 세는 사본 ──────────────── */

/** 정본과 같은 절차. 배열 칸 접근을 세는 자리만 덧붙였다. */
export function manacherCells(s: string): { ans: string; cells: number } {
  let cells = 0;
  if (s.length === 0) return { ans: "", cells };
  const n = s.length;
  const m = 2 * n + 1;
  const t = new Array<string>(m).fill("#");
  cells += m;
  for (let j = 0; j < n; j++) {
    t[2 * j + 1] = s[j] as string;
    cells += 2;
  }
  const p = new Array<number>(m).fill(0);
  cells += m;
  let c = 0;
  let r = 0;
  let best = 0;
  for (let i = 0; i < m; i++) {
    let k = 0;
    if (i < r) {
      k = Math.min(r - i, p[2 * c - i] as number);
      cells++;
    }
    while (i - k - 1 >= 0 && i + k + 1 < m) {
      cells += 2;
      if (t[i - k - 1] !== t[i + k + 1]) break;
      k++;
    }
    p[i] = k;
    cells++;
    if (i + k > r) {
      c = i;
      r = i + k;
    }
    cells++;
    if (k > (p[best] as number)) best = i;
  }
  cells++;
  const len = p[best] as number;
  const start = (best - len) / 2;
  cells += len;
  return { ans: s.slice(start, start + len), cells };
}

/** 이 글의 절차가 잡는 칸 — 넓힌 문자열과 반지름 배열 둘이다. */
export const manacherCellsHeld = (n: number): number => 2 * (2 * n + 1);

/* ──────────────── 경쟁 설계 — 회문 트리(Eertree) ──────────────── */

/**
 * 글자를 뒤에 하나씩 붙이며 서로 다른 회문마다 마디를 하나씩 두는 구조.
 *
 * 마디 0 은 길이 `-1` 의 가상 뿌리이고 마디 1 은 길이 0 의 가상 뿌리다. 두 뿌리가 홀수 길이와
 * 짝수 길이를 각각 받는다. 전이표는 마디마다 스물여섯 칸을 쓰는 평평한 배열이라, 이 글의
 * 절차와 같은 「배열 칸 접근」 잣대로 잴 수 있다.
 */
export class PalindromeTree {
  private readonly len: number[];
  private readonly link: number[];
  private readonly next: number[];
  private readonly text: number[];
  private size = 2;
  private suff = 1;
  private used = 0;
  private bestLen = 0;
  private bestEnd = -1;
  cells = 0;

  constructor(capacity: number) {
    const nodes = capacity + 2;
    this.len = new Array<number>(nodes).fill(0);
    this.link = new Array<number>(nodes).fill(0);
    this.next = new Array<number>(nodes * SIGMA).fill(0);
    this.text = new Array<number>(capacity).fill(0);
    this.cells += nodes * 2 + nodes * SIGMA + capacity;
    this.len[0] = -1;
    this.link[0] = 0;
    this.len[1] = 0;
    this.link[1] = 0;
    this.cells += 4;
  }

  /** 접미사 회문 사슬을 거슬러 올라가 글자가 맞는 마디를 찾는다. */
  private climb(from: number, at: number, ch: number): number {
    let cur = from;
    for (;;) {
      const back = at - (this.len[cur] as number) - 1;
      this.cells++;
      if (back >= 0) {
        this.cells++;
        if (this.text[back] === ch) return cur;
      }
      cur = this.link[cur] as number;
      this.cells++;
    }
  }

  /** 글자 하나를 뒤에 붙인다. */
  add(ch: number): void {
    const at = this.used;
    this.text[at] = ch;
    this.cells++;
    this.used++;

    const cur = this.climb(this.suff, at, ch);
    const slot = cur * SIGMA + ch;
    const hit = this.next[slot] as number;
    this.cells++;
    if (hit !== 0) {
      this.suff = hit;
      return;
    }

    const now = this.size++;
    this.len[now] = (this.len[cur] as number) + 2;
    this.cells += 2;
    if ((this.len[now] as number) === 1) {
      this.link[now] = 1;
      this.cells += 2;
    } else {
      const parent = this.link[cur] as number;
      this.cells++;
      const back = this.climb(parent, at, ch);
      this.link[now] = this.next[back * SIGMA + ch] as number;
      this.cells += 2;
    }
    this.next[slot] = now;
    this.cells++;
    this.suff = now;

    const grown = this.len[now] as number;
    this.cells++;
    if (grown > this.bestLen) {
      this.bestLen = grown;
      this.bestEnd = at;
    }
  }

  /** 지금까지 붙인 부분에서의 가장 긴 회문. */
  answer(source: string): string {
    this.cells += 2;
    if (this.bestLen === 0) return "";
    const start = this.bestEnd - this.bestLen + 1;
    this.cells += this.bestLen;
    return source.slice(start, start + this.bestLen);
  }
}

/** 회문 트리가 잡는 칸 — 마디마다의 길이·연결과 전이표, 그리고 글자 기록이다. */
export const treeCellsHeld = (n: number): number =>
  (n + 2) * 2 + (n + 2) * SIGMA + n;

/* ──────────────── 같은 작업 목록을 두 설계에 건다 ──────────────── */

/** `q` 번 중간에 묻고 마지막에 한 번 더 묻는 작업 목록의 접두사 길이. */
export function askAt(n: number, q: number): number[] {
  const out: number[] = [];
  for (let j = 1; j <= q; j++) out.push(Math.floor((n * j) / (q + 1)));
  out.push(n);
  return out;
}

/** 이 글의 절차로 그 작업 목록을 처리한다. 물을 때마다 처음부터 다시 실행한다. */
export function manacherRun(text: string, q: number): number {
  let cells = 0;
  for (const L of askAt(text.length, q)) {
    const piece = text.slice(0, L);
    const got = manacherCells(piece);
    if (got.ans !== longestPalindrome(piece)) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    cells += got.cells;
  }
  return cells;
}

/** 회문 트리로 같은 작업 목록을 처리한다. 글자를 붙여 가며 물을 자리에서 답한다. */
export function treeRun(text: string, q: number): number {
  const n = text.length;
  const marks = new Set(askAt(n, q));
  const tree = new PalindromeTree(n);
  for (let i = 0; i < n; i++) {
    tree.add(text.charCodeAt(i) - 97);
    if (marks.has(i + 1)) {
      const piece = text.slice(0, i + 1);
      if (tree.answer(piece).length !== longestPalindrome(piece).length) {
        throw new Error("회문 트리가 정본과 다른 길이를 낸다");
      }
    }
  }
  return tree.cells;
}

/* ────────────────────────── 계수 ────────────────────────── */

export const cases = {
  "이 글의 절차": () => ({
    "전개 입력 · 배열 칸 접근": manacherRun(WALK_S, 0),
    "질의 0 회 · 배열 칸 접근": manacherRun(SWEEP_TEXT, 0),
    "질의 2 회 · 배열 칸 접근": manacherRun(SWEEP_TEXT, 2),
    "질의 3 회 · 배열 칸 접근": manacherRun(SWEEP_TEXT, 3),
    "질의 100 회 · 배열 칸 접근": manacherRun(SWEEP_TEXT, 100),
    "저장 칸": manacherCellsHeld(SWEEP_N),
  }),
  "회문 트리": () => ({
    "전개 입력 · 배열 칸 접근": treeRun(WALK_S, 0),
    "질의 0 회 · 배열 칸 접근": treeRun(SWEEP_TEXT, 0),
    "질의 2 회 · 배열 칸 접근": treeRun(SWEEP_TEXT, 2),
    "질의 3 회 · 배열 칸 접근": treeRun(SWEEP_TEXT, 3),
    "질의 100 회 · 배열 칸 접근": treeRun(SWEEP_TEXT, 100),
    "저장 칸": treeCellsHeld(SWEEP_N),
  }),
};
