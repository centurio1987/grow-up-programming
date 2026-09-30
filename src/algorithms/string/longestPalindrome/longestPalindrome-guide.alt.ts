/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 잣대**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다
 * 달라 「본문의 수치가 실측과 일치하는가」(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/string/longestPalindrome/longestPalindrome-guide.alt.ts
 *
 * **잣대는 원고 전체와 같다.**
 *
 * - **자료 접근** — 배열 칸을 읽거나 쓴 횟수와 문자열 글자를 읽은 횟수의 합. 칸을 잡으며 0 으로 채우는
 *   일은 세지 않는다. 같은 갈래의 접미사 배열 · 카사이 LCP 편과 같은 기준이다. 매내처 알고리즘 쪽은 그림
 *   사이드카의 `countManacher` 를 그대로 부른다 — 본문의 다른 절이 쓰는 계수기와 같은 것이다.
 * - **저장 칸** — 절차가 잡는 배열 칸의 최대 개수.
 *
 * 2026-09-30 전개(`KAN-058`)에서 잣대와 생성식을 바꿨다. 옛 잣대 「배열 칸 접근」은 0 으로 채우는 칸까지
 * 셌고, 본문의 다른 절은 글자 비교를 셌다 — 원고 한 벌에 기준이 둘이었다. 같은 갈래의 편들이 쓰는 「자료
 * 접근」 하나로 맞췄다. 무작위 입력의 생성식도 같은 갈래의 편들과 같은 mulberry32(씨앗 `0x9e3779b9`)로
 * 맞췄다(옛 생성식은 xorshift32 · 시드 `20260908`). 수치가 마음에 안 들어 바꾼 것이 아니다.
 *
 * **갈리는 축은 「중간에 답을 묻는 횟수」다.** 매내처 알고리즘은 문자열 전체를 받아야 시작하므로,
 * 글자가 붙는 도중에 답을 물으면 그때마다 처음부터 다시 실행한다. 회문 트리는 글자 하나를 뒤에 붙이는
 * 갱신만으로 답을 이어 가므로 물어보는 횟수가 늘어도 비용이 거의 그대로다.
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 입력은 일곱 글자라 중간에 답을 물을 자리가 여섯뿐이다.
 * 전개 입력의 값도 함께 내고(`전개 입력 · …`), 경계를 보이는 데는 아래 `SWEEP_N` 을 쓴다. 그 사실은 본문
 * 대조 문단에도 적는다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 *
 * **경쟁 설계는 매 실행마다 정본과 답을 대조한다.** 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 문제의 값이다(2026-09-03 `digitDp` 가 세운 규칙).
 */

import {
  countManacher,
  makeText,
  WALK,
} from "./longestPalindrome-guide.fig.tsx";
import { longestPalindrome } from "./longestPalindrome-guide.ref.ts";

/** 스윕 문자열의 글자 종류 — 소문자 영문 스물여섯. */
const SIGMA = 26;

/** 스윕이 쓰는 문자열의 길이 — 과제 규모의 상한이다. */
export const SWEEP_N = 100_000;

export const SWEEP_TEXT = makeText(SWEEP_N, SIGMA);

/** 매내처 알고리즘이 잡는 칸 — 넓힌 문자열과 반지름 배열 둘이다. */
export const manacherCellsHeld = (n: number): number => 2 * (2 * n + 1);

/* ──────────────── 경쟁 설계 — 회문 트리(Eertree) ──────────────── */

/**
 * 글자를 뒤에 하나씩 붙이며 서로 다른 회문마다 마디를 하나씩 두는 구조.
 *
 * 마디 0 은 길이 `-1` 의 가상 뿌리이고 마디 1 은 길이 0 의 가상 뿌리다. 두 뿌리가 홀수 길이와
 * 짝수 길이를 각각 받는다. 전이표는 마디마다 스물여섯 칸을 쓰는 평평한 배열이라, 매내처 알고리즘과
 * 같은 「자료 접근」 잣대로 잴 수 있다. 칸을 잡으며 0 으로 채우는 일은 세지 않는다.
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
  access = 0;

  constructor(capacity: number) {
    const nodes = capacity + 2;
    this.len = new Array<number>(nodes).fill(0);
    this.link = new Array<number>(nodes).fill(0);
    this.next = new Array<number>(nodes * SIGMA).fill(0);
    this.text = new Array<number>(capacity).fill(0);
    this.len[0] = -1;
    this.link[0] = 0;
    this.len[1] = 0;
    this.link[1] = 0;
    this.access += 4;
  }

  /** 접미사 회문 사슬을 거슬러 올라가 글자가 맞는 마디를 찾는다. */
  private climb(from: number, at: number, ch: number): number {
    let cur = from;
    for (;;) {
      const back = at - (this.len[cur] as number) - 1;
      this.access++;
      if (back >= 0) {
        this.access++;
        if (this.text[back] === ch) return cur;
      }
      cur = this.link[cur] as number;
      this.access++;
    }
  }

  /** 글자 하나를 뒤에 붙인다. */
  add(ch: number): void {
    const at = this.used;
    this.text[at] = ch;
    this.access++;
    this.used++;

    const cur = this.climb(this.suff, at, ch);
    const slot = cur * SIGMA + ch;
    const hit = this.next[slot] as number;
    this.access++;
    if (hit !== 0) {
      this.suff = hit;
      return;
    }

    const now = this.size++;
    this.len[now] = (this.len[cur] as number) + 2;
    this.access += 2;
    if ((this.len[now] as number) === 1) {
      this.link[now] = 1;
      this.access += 2;
    } else {
      const parent = this.link[cur] as number;
      this.access++;
      const back = this.climb(parent, at, ch);
      this.link[now] = this.next[back * SIGMA + ch] as number;
      this.access += 2;
    }
    this.next[slot] = now;
    this.access++;
    this.suff = now;

    const grown = this.len[now] as number;
    this.access++;
    if (grown > this.bestLen) {
      this.bestLen = grown;
      this.bestEnd = at;
    }
  }

  /** 지금까지 붙인 부분에서의 가장 긴 회문 — 답의 글자를 읽어 잘라 낸다. */
  answer(source: string): string {
    if (this.bestLen === 0) return "";
    const start = this.bestEnd - this.bestLen + 1;
    this.access += this.bestLen;
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

/** 매내처 알고리즘으로 그 작업 목록을 처리한다. 물을 때마다 처음부터 다시 실행한다. */
export function manacherRun(text: string, q: number): number {
  let access = 0;
  for (const L of askAt(text.length, q)) {
    access += countManacher(text.slice(0, L)).access;
  }
  return access;
}

/** 회문 트리로 같은 작업 목록을 처리한다. 글자를 읽어 붙여 가며 물을 자리에서 답한다. */
export function treeRun(text: string, q: number): number {
  const n = text.length;
  const marks = new Set(askAt(n, q));
  const tree = new PalindromeTree(n);
  for (let i = 0; i < n; i++) {
    tree.access++;
    tree.add(text.charCodeAt(i) - 97);
    if (marks.has(i + 1)) {
      const piece = text.slice(0, i + 1);
      if (tree.answer(piece).length !== longestPalindrome(piece).length) {
        throw new Error("회문 트리가 정본과 다른 길이를 낸다");
      }
    }
  }
  return tree.access;
}

/* ────────────────────────── 계수 ────────────────────────── */

/**
 * 입력 두 벌 — 무작위 26 글자와 전부 같은 글자. 뒤엣것은 본문의 「아이디어를 떠올리는 과정」이 단순한
 * 방법을 반박할 때 쓴 입력과 같다(L20 — 전개와 같은 입력). 두 입력에서 우열이 갈린다.
 */
export const ALL_SAME_TEXT = "a".repeat(SWEEP_N);

const run = (
  go: (text: string, q: number) => number,
): Record<string, number> => ({
  "전개 입력 · 자료 접근": go(WALK, 0),
  "무작위 26 글자 · 질의 0 회 · 자료 접근": go(SWEEP_TEXT, 0),
  "무작위 26 글자 · 질의 1 회 · 자료 접근": go(SWEEP_TEXT, 1),
  "무작위 26 글자 · 질의 100 회 · 자료 접근": go(SWEEP_TEXT, 100),
  "전부 같은 글자 · 질의 0 회 · 자료 접근": go(ALL_SAME_TEXT, 0),
  "전부 같은 글자 · 질의 1 회 · 자료 접근": go(ALL_SAME_TEXT, 1),
  "전부 같은 글자 · 질의 100 회 · 자료 접근": go(ALL_SAME_TEXT, 100),
});

export const cases = {
  "매내처 알고리즘": () => ({
    ...run(manacherRun),
    "저장 칸": manacherCellsHeld(SWEEP_N),
  }),
  "회문 트리": () => ({
    ...run(treeRun),
    "저장 칸": treeCellsHeld(SWEEP_N),
  }),
};
