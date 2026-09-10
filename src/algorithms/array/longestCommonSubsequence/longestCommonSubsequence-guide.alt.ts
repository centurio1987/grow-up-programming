/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 계수**로 두 설계를 나란히 잰다. 세는 것은 **기본 연산 수**(문자 비교 ·
 * 값 비교 · 덧셈)와 **저장 칸**이다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과
 * 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts longestCommonSubsequence-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 `s = "abcde"` · `t = "ace"` 를 쓰는데,
 * 그 크기에서는 표가 15 칸뿐이라 두 설계의 계수가 준비 비용에 묻힌다(표 30 · 일치 쌍
 * 따라가기 13). 그래서 같은 규칙으로 만든 길이 200 짜리 입력을 쓰고, **알파벳 크기만**
 * 바꿔 가며 잰다 — 이 대조에서 갈리는 것이 일치 쌍의 개수이기 때문이다.
 *
 * **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도
 * 적는다.
 */

/** 두 문자열의 길이. 둘 다 같다. */
export const N = 200;

/** 대조에 쓰는 알파벳 크기. 이 값 하나가 일치 쌍의 개수를 정한다. */
export const ALPHABETS = [2, 3, 4, 8, 26, 64] as const;

/**
 * 알파벳 크기 `a` 로 만든 두 문자열.
 *
 * `s[k]` 는 코드 `48 + (37k mod a)`, `t[k]` 는 코드 `48 + ((53k + 11) mod a)` 다.
 * 코드 48 은 `'0'` 이라 알파벳 64 까지 전부 출력 가능한 ASCII 안에 든다.
 */
export function pair(a: number): [string, string] {
  const s = Array.from({ length: N }, (_, k) =>
    String.fromCharCode(48 + ((k * 37) % a)),
  ).join("");
  const t = Array.from({ length: N }, (_, k) =>
    String.fromCharCode(48 + ((k * 53 + 11) % a)),
  ).join("");
  return [s, t];
}

interface Counted {
  answer: number;
  ops: number;
  cells: number;
  pairs: number;
}

/**
 * 이 가이드가 가르치는 설계 — **표 채우기**. 절차는
 * `longestCommonSubsequence-guide.ref.ts` 와 같고 계수만 덧붙였다.
 *
 * 칸 하나마다 문자 비교 한 번과 (덧셈 한 번 또는 값 비교 한 번)이라 기본 연산이 `2nm` 이다.
 */
export function byTable(s: string, t: string): Counted {
  const n = s.length;
  const m = t.length;
  let ops = 0;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      ops++;
      if (s[i - 1] === t[j - 1]) {
        ops++;
        cur[j] = (prev[j - 1] as number) + 1;
      } else {
        ops++;
        cur[j] = Math.max(prev[j] as number, cur[j - 1] as number);
      }
    }
  }
  return {
    answer: (dp[n] as number[])[m] as number,
    ops,
    cells: (n + 1) * (m + 1),
    pairs: matchPairs(s, t),
  };
}

/**
 * 경쟁 설계 — **일치 쌍 따라가기**(Hunt–Szymanski, 1977).
 *
 * 표를 만들지 않고 **글자가 같은 자리 쌍만** 방문한다. `t` 의 글자마다 등장 위치를
 * 내림차순으로 모아 두고, `s` 를 왼쪽부터 읽으며 그 위치들을 문턱 배열 `thresh` 에 넣는다.
 * `thresh[k]` 는 「길이 `k` 짜리 공통 부분 수열을 만들 수 있는 `t` 쪽 끝 자리 중 가장 왼쪽」
 * 이고, 자리 하나를 넣을 때마다 이분 탐색으로 들어갈 `k` 를 찾는다.
 *
 * 방문하는 쌍의 수가 `r` 이면 기본 연산이 `r log` 규모라, `r` 이 작을수록 앞선다.
 */
export function byMatchPairs(s: string, t: string): Counted {
  const n = s.length;
  const m = t.length;
  let ops = 0;

  // `t` 의 글자마다 등장 위치를 내림차순으로 모은다.
  const at = new Map<string, number[]>();
  for (let j = m - 1; j >= 0; j--) {
    ops++;
    const ch = t[j] as string;
    const list = at.get(ch);
    if (list === undefined) at.set(ch, [j]);
    else list.push(j);
  }

  const thresh = new Array<number>(Math.min(n, m) + 1).fill(m);
  thresh[0] = -1;
  let best = 0;
  let pairs = 0;

  for (let i = 0; i < n; i++) {
    ops++;
    const list = at.get(s[i] as string);
    if (list === undefined) continue;
    for (const j of list) {
      pairs++;
      // `thresh[k-1] < j ≤ thresh[k]` 인 `k` 를 이분 탐색으로 찾는다.
      let lo = 1;
      let hi = best + 1;
      while (lo < hi) {
        ops++;
        const mid = (lo + hi) >> 1;
        if ((thresh[mid] as number) < j) lo = mid + 1;
        else hi = mid;
      }
      ops++;
      if (j < (thresh[lo] as number)) {
        thresh[lo] = j;
        if (lo > best) best = lo;
      }
    }
  }
  return { answer: best, ops, cells: thresh.length + m, pairs };
}

/** 글자가 같은 자리 쌍의 개수 `r`. 두 설계의 비용을 가르는 값이다. */
export function matchPairs(s: string, t: string): number {
  let r = 0;
  for (const a of s) for (const b of t) if (a === b) r++;
  return r;
}

/** 두 설계가 같은 답을 내는지 확인한다. 다르면 대조가 다른 문제를 잰 것이다. */
function agree(s: string, t: string): [Counted, Counted] {
  const a = byTable(s, t);
  const b = byMatchPairs(s, t);
  if (a.answer !== b.answer) {
    throw new Error(
      `두 설계의 답이 다르다 — 표 ${a.answer} ≠ 일치 쌍 ${b.answer}`,
    );
  }
  return [a, b];
}

/** 전부 같은 글자 — 일치 쌍이 `nm` 으로 가득 차는 자리다. */
const SAME = "a".repeat(N);

export const cases = {
  "표 채우기": () => {
    const out: Record<string, number> = {};
    for (const a of ALPHABETS) {
      const [s, t] = pair(a);
      const [tab, hs] = agree(s, t);
      out[`알파벳 ${a} · 기본 연산`] = tab.ops;
      out[`알파벳 ${a} · 일치 쌍`] = hs.pairs;
    }
    const [same] = agree(SAME, SAME);
    out["전부 같은 글자 · 기본 연산"] = same.ops;
    out["전부 같은 글자 · 일치 쌍"] = same.pairs;
    out["저장 칸"] = byTable(...pair(4)).cells;
    return out;
  },
  "일치 쌍 따라가기": () => {
    const out: Record<string, number> = {};
    for (const a of ALPHABETS) {
      const [s, t] = pair(a);
      const [, hs] = agree(s, t);
      out[`알파벳 ${a} · 기본 연산`] = hs.ops;
    }
    const [, same] = agree(SAME, SAME);
    out["전부 같은 글자 · 기본 연산"] = same.ops;
    out["저장 칸"] = byMatchPairs(...pair(4)).cells;
    return out;
  },
};
