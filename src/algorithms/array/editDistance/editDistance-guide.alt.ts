/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 계수**로 두 설계를 나란히 잰다. 세는 것은 **채운 칸 수**와 **잡는 칸
 * 수**다. 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수
 * 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts editDistance-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 `s = "horse"` · `t = "ros"` 를 쓰는데,
 * 답 3 이 `t` 의 길이와 같아 띠가 좁아질 여지가 없다. 실측이 표 24 칸 대 띠 40 칸이라
 * 경쟁 설계가 **앞서는 쪽을 아예 못 보인다**(그 두 값도 `cases` 에 담아 본문에 적는다).
 * 그래서 같은 규칙으로 만든 길이 200 짜리 입력을 쓰고 **바꾼 글자 수만** 바꿔 가며 잰다.
 *
 * **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그 식을 본문에도
 * 적는다.
 */

/** 두 문자열의 길이. 둘 다 같다. */
export const N = 200;

/** 대조에 쓰는 「바꾼 글자 수」. 이 값 하나가 답의 크기를 정한다. */
export const CHANGES = [1, 2, 4, 8, 16, 32, 64, 128] as const;

/** 전개가 쓰는 고정 입력. 이 크기에서 두 설계가 갈리지 않는 것을 본문이 값으로 적는다. */
export const WALK: [string, string] = ["horse", "ros"];

/**
 * 바꾼 글자 수 `c` 로 만든 두 문자열.
 *
 * `s[q]` 는 알파벳 26 개 중 `(37q) mod 26` 번째 글자이고, `t` 는 `s` 에서 자리
 * `floor(qN/c)`(`q` 는 0 부터 `c-1` 까지) 의 글자만 알파벳에서 13 칸 옮긴 것이다.
 * 바꾼 자리가 `c` 개라 두 문자열의 길이는 같고 서로 다른 자리가 정확히 `c` 개다.
 */
export function pair(c: number): [string, string] {
  const s = Array.from({ length: N }, (_, q) =>
    String.fromCharCode(97 + ((q * 37) % 26)),
  ).join("");
  const chars = [...s];
  for (let q = 0; q < c; q++) {
    const at = Math.floor((q * N) / c);
    const code = (chars[at] as string).charCodeAt(0) - 97;
    chars[at] = String.fromCharCode(97 + ((code + 13) % 26));
  }
  return [s, chars.join("")];
}

interface Counted {
  answer: number;
  /** 값을 정한 표의 칸 수. 테두리 칸도 값을 정하는 자리라 함께 센다. */
  filled: number;
  /** 실행 중에 잡고 있는 칸 수. */
  held: number;
}

/**
 * 이 가이드가 가르치는 설계 — **표 채우기**. 절차는 `editDistance-guide.ref.ts` 와 같고
 * 계수만 덧붙였다.
 *
 * 채우는 칸이 `(n+1)(m+1)` 개로 고정이다 — 입력의 글자를 아예 안 보고 두 길이만으로 정해진다.
 */
export function byTable(s: string, t: string): Counted {
  const n = s.length;
  const m = t.length;
  let filled = 0;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) {
    (dp[i] as number[])[0] = i;
    filled++;
  }
  for (let j = 1; j <= m; j++) {
    (dp[0] as number[])[j] = j;
    filled++;
  }
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      filled++;
      cur[j] =
        s[i - 1] === t[j - 1]
          ? (prev[j - 1] as number)
          : Math.min(
              prev[j - 1] as number,
              prev[j] as number,
              cur[j - 1] as number,
            ) + 1;
    }
  }
  return {
    answer: (dp[n] as number[])[m] as number,
    filled,
    held: (n + 1) * (m + 1),
  };
}

/**
 * 문턱 `k` 를 주고 **대각선에서 `k` 칸 안쪽만** 채운다. 띠 밖은 `INF` 로 둔다.
 *
 * 답이 `k` 이하면 이 값이 곧 정확한 편집 거리다 — 비용이 `k` 인 편집 목록은 대각선에서
 * `k` 칸 넘게 벗어날 수 없기 때문이다(`deep.math` 가 그 하한을 유도한다). 답이 `k` 보다
 * 크면 여기서 나온 값은 정확하지 않고, 그때는 부르는 쪽이 `k` 를 배로 늘려 다시 부른다.
 */
function banded(
  s: string,
  t: string,
  k: number,
): { value: number; filled: number } {
  const n = s.length;
  const m = t.length;
  const INF = n + m + 1;
  let filled = 0;
  let prev = new Array<number>(m + 1).fill(INF);
  for (let j = 0; j <= Math.min(m, k); j++) {
    prev[j] = j;
    filled++;
  }
  for (let i = 1; i <= n; i++) {
    const cur = new Array<number>(m + 1).fill(INF);
    const lo = Math.max(0, i - k);
    const hi = Math.min(m, i + k);
    if (lo === 0) {
      cur[0] = i;
      filled++;
    }
    for (let j = Math.max(1, lo); j <= hi; j++) {
      filled++;
      cur[j] =
        s[i - 1] === t[j - 1]
          ? (prev[j - 1] as number)
          : Math.min(
              prev[j - 1] as number,
              prev[j] as number,
              cur[j - 1] as number,
            ) + 1;
      if ((cur[j] as number) > INF) cur[j] = INF;
    }
    prev = cur;
  }
  return { value: Math.min(prev[m] as number, INF), filled };
}

/**
 * 경쟁 설계 — **띠 계산과 문턱 배가**(Ukkonen, 1985).
 *
 * 표를 통째로 채우지 않고 대각선 둘레의 띠만 채운다. 처음 문턱은 두 길이의 차이(답의
 * 하한)이고, 나온 값이 문턱을 넘으면 문턱을 배로 늘려 다시 채운다. 답이 작으면 띠가 좁아
 * 채우는 칸이 적고, 답이 크면 배가 때문에 같은 자리를 여러 번 채운다.
 */
export function byBand(s: string, t: string): Counted {
  const n = s.length;
  const m = t.length;
  let k = Math.max(1, Math.abs(n - m));
  let filled = 0;
  for (;;) {
    const round = banded(s, t, k);
    filled += round.filled;
    if (round.value <= k || k >= Math.max(n, m)) {
      return { answer: round.value, filled, held: 2 * (m + 1) };
    }
    k *= 2;
  }
}

/** 두 설계가 같은 답을 내는지 확인한다. 다르면 대조가 다른 문제를 잰 것이다. */
function agree(s: string, t: string): [Counted, Counted] {
  const a = byTable(s, t);
  const b = byBand(s, t);
  if (a.answer !== b.answer) {
    throw new Error(`두 설계의 답이 다르다 — 표 ${a.answer} ≠ 띠 ${b.answer}`);
  }
  return [a, b];
}

/** 두 설계의 채운 칸 수가 처음으로 뒤집히는 「바꾼 글자 수」. 1 부터 하나씩 늘려 찾는다. */
export function flipPoint(): number {
  for (let c = 1; c <= N; c++) {
    const [tab, band] = agree(...pair(c));
    if (band.filled > tab.filled) return c;
  }
  return 0;
}

export const cases = {
  "표 채우기": () => {
    const out: Record<string, number> = {};
    for (const c of CHANGES) {
      const [tab] = agree(...pair(c));
      out[`바꾼 글자 ${c} · 채운 칸`] = tab.filled;
      out[`바꾼 글자 ${c} · 답`] = tab.answer;
    }
    out["잡는 칸"] = byTable(...pair(4)).held;
    out["뒤집히는 바꾼 글자 수"] = flipPoint();
    out["전개 입력 · 채운 칸"] = agree(...WALK)[0].filled;
    return out;
  },
  "띠 계산": () => {
    const out: Record<string, number> = {};
    for (const c of CHANGES) {
      const [, band] = agree(...pair(c));
      out[`바꾼 글자 ${c} · 채운 칸`] = band.filled;
    }
    out["잡는 칸"] = byBand(...pair(4)).held;
    const [tab, band] = agree(...pair(flipPoint()));
    out["뒤집히는 자리 · 표"] = tab.filled;
    out["뒤집히는 자리 · 띠"] = band.filled;
    out["전개 입력 · 채운 칸"] = agree(...WALK)[1].filled;
    return out;
  },
};
