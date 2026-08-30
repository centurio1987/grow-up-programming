/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts editDistance-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { editDistance } from "./editDistance-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 *
 * **원문자(①)와 모호폭 기호는 마지막 열에만 쓴다.** 마지막 열은 오른쪽 여백을 잘라내므로
 * 폭 계산이 자리를 안 바꾼다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 자릿수. 제약 규모의 값이 화면에 안 들어갈 때 쓴다. */
const digits = (n: bigint): number => n.toString().length;

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

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 세 후보(교체·삭제·삽입)가 각각 혼자 최솟값이 되는 칸이 있고, 두 글자가 같은 칸도 셋
 * 있다. 문제 지문의 예시이자 원본 테스트의 첫 케이스이기도 하다.
 */
const S = "horse";
const T = "ros";

/** 제약의 최댓값. 두 문자열 다 이 길이까지 온다. */
const LIMIT = 1000;

/** 제약이 정한 글자 종류 수. 소문자 알파벳 하나를 규모 계산의 기준으로 쓴다. */
const ALPHABET = 26;

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  answer: number;
  /** 문자 비교 횟수. 칸 하나마다 한 번이다. */
  chars: number;
  /** 값 비교 횟수. 두 글자가 다른 칸에서만 세 후보를 견주느라 두 번씩 든다. */
  picks: number;
  /** 두 글자가 같아 대각선을 그대로 받은 칸 수. */
  same: number;
}

/** 정본과 같은 절차에 계수만 덧붙인 것. */
function byTable(s: string, t: string): Counted {
  const n = s.length;
  const m = t.length;
  let chars = 0;
  let picks = 0;
  let same = 0;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) (dp[i] as number[])[0] = i;
  for (let j = 0; j <= m; j++) (dp[0] as number[])[j] = j;
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      chars++;
      if (s[i - 1] === t[j - 1]) {
        same++;
        cur[j] = prev[j - 1] as number;
      } else {
        picks += 2;
        cur[j] =
          Math.min(
            prev[j - 1] as number,
            prev[j] as number,
            cur[j - 1] as number,
          ) + 1;
      }
    }
  }
  return { answer: (dp[n] as number[])[m] as number, chars, picks, same };
}

/** 정본이 채우는 표 전체. 전개와 불변식이 이 표를 인용한다. */
function fullTable(s: string, t: string): number[][] {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) (dp[i] as number[])[0] = i;
  for (let j = 0; j <= m; j++) (dp[0] as number[])[j] = j;
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
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
  return dp;
}

/**
 * 가장 단순한 방법 — **한 번의 편집으로 갈 수 있는 문자열을 전부 만들며 너비 우선으로
 * 찾아간다.** 문제 지문을 그대로 옮긴 것이라 답의 기준이 된다.
 *
 * 알파벳은 두 문자열에 나오는 글자로 제한한다 — 최소 비용 편집 목록이 `t` 에 없는 글자를
 * 새로 넣을 이유가 없어 답이 달라지지 않는다.
 */
function byBreadthFirst(
  s: string,
  t: string,
): { answer: number; perDepth: number[] } {
  const perDepth: number[] = [];
  if (s === t) return { answer: 0, perDepth };
  const alphabet = [...new Set([...s, ...t])];
  let frontier = new Set([s]);
  const seen = new Set([s]);
  for (let depth = 1; depth <= 6; depth++) {
    const next = new Set<string>();
    let found = false;
    const push = (y: string): void => {
      if (y === t) found = true;
      if (seen.has(y)) return;
      seen.add(y);
      next.add(y);
    };
    for (const x of frontier) {
      for (let k = 0; k < x.length; k++) {
        push(x.slice(0, k) + x.slice(k + 1));
        for (const ch of alphabet) {
          if (ch !== x[k]) push(x.slice(0, k) + ch + x.slice(k + 1));
        }
      }
      for (let k = 0; k <= x.length; k++) {
        for (const ch of alphabet) push(x.slice(0, k) + ch + x.slice(k));
      }
    }
    perDepth.push(next.size);
    if (found) return { answer: depth, perDepth };
    frontier = next;
  }
  throw new Error(`깊이 6 안에서 "${t}" 에 도달하지 못했다`);
}

/**
 * 후보 — **자리마다 견주기.** 앞에서부터 같은 자리끼리 견주어 다른 자리를 세고, 길이
 * 차이만큼 더한다. 삽입과 삭제가 자리를 밀어낸다는 것을 아예 안 본다.
 */
function bySlot(s: string, t: string): number {
  const shared = Math.min(s.length, t.length);
  let diff = 0;
  for (let k = 0; k < shared; k++) if (s[k] !== t[k]) diff++;
  return diff + Math.abs(s.length - t.length);
}

/** 최장 공통 부분 수열 길이. 교체를 뺀 거리가 이 값으로 나오는지 확인하는 데 쓴다. */
function lcsLength(s: string, t: string): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      cur[j] =
        s[i - 1] === t[j - 1]
          ? (prev[j - 1] as number) + 1
          : Math.max(prev[j] as number, cur[j - 1] as number);
    }
  }
  return (dp[n] as number[])[m] as number;
}

/** 세 연산의 비용을 따로 주고 같은 표를 채운다. 비용이 같지 않을 때를 보는 자리다. */
function weighted(
  s: string,
  t: string,
  cost: { sub: number; del: number; ins: number },
): number {
  const n = s.length;
  const m = t.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) (dp[i] as number[])[0] = i * cost.del;
  for (let j = 0; j <= m; j++) (dp[0] as number[])[j] = j * cost.ins;
  for (let i = 1; i <= n; i++) {
    const prev = dp[i - 1] as number[];
    const cur = dp[i] as number[];
    for (let j = 1; j <= m; j++) {
      cur[j] =
        s[i - 1] === t[j - 1]
          ? (prev[j - 1] as number)
          : Math.min(
              (prev[j - 1] as number) + cost.sub,
              (prev[j] as number) + cost.del,
              (cur[j - 1] as number) + cost.ins,
            );
    }
  }
  return (dp[n] as number[])[m] as number;
}

/* ────────────────────── 편집 목록 거슬러 확인하기 ────────────────────── */

type Move = "교체" | "그대로" | "삭제" | "삽입";

interface Stepped {
  cell: [number, number];
  from: [number, number];
  move: Move;
  letter: string;
  cost: number;
}

/**
 * 표를 오른쪽 아래에서 거꾸로 따라가며 편집 목록 하나를 만든다.
 *
 * 같은 값을 내는 경로가 여럿일 수 있으므로 순서를 고정한다 — 두 글자가 같으면 대각선,
 * 아니면 교체 · 삭제 · 삽입 차례로 시험한다.
 */
function backtrack(s: string, t: string): Stepped[] {
  const dp = fullTable(s, t);
  const out: Stepped[] = [];
  let i = s.length;
  let j = t.length;
  while (i > 0 || j > 0) {
    const here = (dp[i] as number[])[j] as number;
    const diag =
      i > 0 && j > 0 ? ((dp[i - 1] as number[])[j - 1] as number) : -1;
    if (i > 0 && j > 0 && s[i - 1] === t[j - 1] && here === diag) {
      out.push({
        cell: [i, j],
        from: [i - 1, j - 1],
        move: "그대로",
        letter: s[i - 1] as string,
        cost: 0,
      });
      i--;
      j--;
    } else if (i > 0 && j > 0 && here === diag + 1) {
      out.push({
        cell: [i, j],
        from: [i - 1, j - 1],
        move: "교체",
        letter: t[j - 1] as string,
        cost: 1,
      });
      i--;
      j--;
    } else if (i > 0 && here === ((dp[i - 1] as number[])[j] as number) + 1) {
      out.push({
        cell: [i, j],
        from: [i - 1, j],
        move: "삭제",
        letter: s[i - 1] as string,
        cost: 1,
      });
      i--;
    } else {
      out.push({
        cell: [i, j],
        from: [i, j - 1],
        move: "삽입",
        letter: t[j - 1] as string,
        cost: 1,
      });
      j--;
    }
  }
  return out.reverse();
}

/**
 * 편집 목록을 `s` 에 차례로 적용한다. `그대로` 와 `교체` 와 `삭제` 는 `s` 의 글자 하나를
 * 지나가고 `삽입` 은 지나가지 않는다. 목록이 `s` 를 끝까지 안 쓰면 남은 글자를 그대로 잇는다.
 */
function applyScript(s: string, script: Stepped[]): string {
  let out = "";
  let at = 0;
  for (const step of script) {
    if (step.move === "그대로") {
      out += s[at] as string;
      at++;
    } else if (step.move === "교체") {
      out += step.letter;
      at++;
    } else if (step.move === "삭제") {
      at++;
    } else {
      out += step.letter;
    }
  }
  return out + s.slice(at);
}

/** 위 칸에서 온 걸음을 삽입으로 잘못 읽은 목록. 대각선과 왼쪽은 그대로 둔다. */
function misread(s: string, t: string): Stepped[] {
  return backtrack(s, t).map((step) =>
    step.move === "삭제"
      ? {
          ...step,
          move: "삽입" as Move,
          letter: t[step.cell[1] - 1] as string,
        }
      : step,
  );
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  editDistance(s: string, t: string): number;
}

const REF = new URL("./editDistance-guide.ref.ts", import.meta.url).pathname;

/**
 * **첫 열을 전부 `0` 으로 둔** 사본. 불변식의 출발점을 지키던 바로 그 줄이다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const zeroFirstColumn = await loadMutant<Impl>(REF, {
  swap: [/\(dp\[i\] as number\[\]\)\[0\] = i;/, "(dp[i] as number[])[0] = 0;"],
});

/** **교체 후보를 뺀** 사본. 삭제와 삽입 둘로만 세 갈래를 대신한다. */
const withoutSub = await loadMutant<Impl>(REF, {
  swap: [
    /cur\[j\] = Math\.min\(sub, del, ins\) \+ 1;/,
    "cur[j] = Math.min(del, ins) + 1;",
  ],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  s: string;
  t: string;
}

/**
 * 사례 이름. **모호폭 기호를 쓰지 않는다** — 표의 첫 열이라 한 글자만 어긋나도 뒤 열이
 * 통째로 밀린다. 한글은 `width` 가 두 칸으로 세므로 안전하다.
 */
const NAMED = (s: string, t: string): Case => ({
  name: `"${s}" 와 "${t}"`,
  s,
  t,
});

const WALK_CASE: Case = { name: `전개 입력 "${S}" 와 "${T}"`, s: S, t: T };

/** 자리마다 견주는 후보가 갈리는 자리를 담은 목록. */
const SLOT_CASES: Case[] = [
  WALK_CASE,
  NAMED("abcd", "bcda"),
  NAMED("flaw", "lawn"),
  NAMED("ab", "ba"),
  NAMED("horse", "house"),
];

/** 교체를 뺀 사본이 갈리는 자리를 담은 목록. */
const NO_SUB_CASES: Case[] = [
  WALK_CASE,
  NAMED("a", "b"),
  NAMED("kitten", "sitting"),
  NAMED("abcd", "bcda"),
  NAMED("flaw", "lawn"),
];

/** 첫 열을 0 으로 둔 변이가 갈리는 자리를 담은 목록. */
const FIRST_COLUMN_CASES: Case[] = [
  WALK_CASE,
  NAMED("abc", ""),
  NAMED("", "abc"),
  NAMED("kitten", "sitting"),
  NAMED("horse", "house"),
];

/** 검산 규모. 격자 경로 수를 **실제로 세어** 닫힌 형태와 맞춘다. */
const SCALE = [1, 2, 3, 4, 5, 6];

/** 답이 갈리는 자리가 하나라도 있어야 「깨진다」가 참이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(s: string, t: string, got: number): number {
  const want = editDistance(s, t);
  if (got !== want) {
    throw new Error(`계측기와 정본의 답이 다르다 — 계측 ${got} ≠ 정본 ${want}`);
  }
  return got;
}

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (s: string, t: string) => number,
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = editDistance(c.s, c.t);
    const got = other(c.s, c.t);
    gaps.push(bare === got ? 0 : 1);
    rows.push([
      c.name,
      String(bare),
      String(got),
      bare === got ? "같다" : "틀리다",
    ]);
  }
  return { rows, gaps };
}

const CONTRAST_HEAD = (otherHead: string): string[] => [
  "입력",
  "정본이 낸 답",
  otherHead,
  "판정",
];

/** 격자 경로 수 — 오른쪽·아래·대각선 세 걸음으로 (0,0) 에서 (i,j) 까지 가는 방법. */
function paths(i: number, j: number): bigint {
  const dp: bigint[][] = Array.from({ length: i + 1 }, () =>
    new Array<bigint>(j + 1).fill(0n),
  );
  for (let a = 0; a <= i; a++) (dp[a] as bigint[])[0] = 1n;
  for (let b = 0; b <= j; b++) (dp[0] as bigint[])[b] = 1n;
  for (let a = 1; a <= i; a++) {
    for (let b = 1; b <= j; b++) {
      (dp[a] as bigint[])[b] =
        ((dp[a - 1] as bigint[])[b] as bigint) +
        ((dp[a] as bigint[])[b - 1] as bigint) +
        ((dp[a - 1] as bigint[])[b - 1] as bigint);
    }
  }
  return (dp[i] as bigint[])[j] as bigint;
}

/** 계승. 닫힌 형태가 걸음을 늘어놓는 방법의 수를 셀 때 쓴다. */
function factorial(n: number): bigint {
  let out = 1n;
  for (let k = 2; k <= n; k++) out *= BigInt(k);
  return out;
}

/**
 * 같은 값의 닫힌 형태. **대각선 걸음 수 `p` 로 갈라 센 것이다** — 대각선을 `p` 번 쓰면
 * 아래로 `i - p` 번, 오른쪽으로 `j - p` 번 가고 걸음이 모두 `i + j - p` 개다.
 */
function pathsClosed(i: number, j: number): bigint {
  let out = 0n;
  for (let p = 0; p <= Math.min(i, j); p++) {
    out +=
      factorial(i + j - p) /
      (factorial(p) * factorial(i - p) * factorial(j - p));
  }
  return out;
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 한 번씩 편집해 찾아가는 방법이 몇 개의 문자열을 만드는가. */
  costBreadthFirst: () => {
    const got = byBreadthFirst(S, T);
    assertSame(S, T, got.answer);
    let running = 0;
    const rows = got.perDepth.map((count, k) => {
      running += count;
      return [String(k + 1), num(count), num(running)];
    });
    const step = BigInt(
      LIMIT * (ALPHABET - 1) + LIMIT + (LIMIT + 1) * ALPHABET,
    );
    return [
      table(["편집 횟수", "새로 만난 문자열 수", "누적"], rows, [
        "r",
        "r",
        "r",
      ]),
      "",
      `└ ${got.answer} 번째에 "${T}" 가 나온다. 답이 ${got.answer} 이라는 뜻이다`,
      "",
      `제약 규모 |s| = |t| = ${num(LIMIT)} · 글자 종류 ${ALPHABET} 이면`,
      table(
        ["  한 번 편집해 만들 수 있는 문자열 수", num(Number(step))],
        [
          [
            `  답이 ${num(LIMIT)} 일 때 확인할 문자열 수 상한`,
            `${num(digits(step ** BigInt(LIMIT)))} 자리`,
          ],
        ],
        ["l", "r"],
      ),
      "  └ 편집 한 번마다 만들 수 있는 문자열이 그만큼이라, 답이 곧 지수가 된다",
    ].join("\n");
  },

  /**
   * `deep.build` ④ — 비용이 무엇에 달렸는지를 두 방식으로 잰다.
   *
   * **길이는 같고 글자만 다른 세 입력**을 나란히 둔다. 문자열을 상태로 든 쪽은 답의 크기와
   * 글자 종류 수를 따라 뛰고, 접두어 쌍을 상태로 든 쪽은 두 길이의 곱으로 고정이다.
   */
  costTwoWays: () => {
    const inputs: [string, string][] = [
      [S, "hos"],
      [S, T],
      [S, "xor"],
    ];
    const rows = inputs.map(([s, t]) => {
      const wide = byBreadthFirst(s, t);
      assertSame(s, t, wide.answer);
      const visited = wide.perDepth.reduce((a, b) => a + b, 0);
      return [
        `"${s}" 와 "${t}"`,
        `${s.length} x ${t.length}`,
        String(wide.answer),
        num(visited),
        num((s.length + 1) * (t.length + 1)),
      ];
    });
    const two = byBreadthFirst(S, "hos").perDepth.reduce((a, b) => a + b, 0);
    const three = byBreadthFirst(S, T).perDepth.reduce((a, b) => a + b, 0);
    return [
      table(
        ["입력", "두 길이", "답", "만난 문자열 수", "표에서 채운 칸"],
        rows,
        ["l", "l", "r", "r", "r"],
      ),
      "",
      `└ 답이 1 커지는 것만으로 왼쪽 열이 ${(three / two).toFixed(1)} 배가 되고, 글자 종류가 늘어도 함께 커진다`,
      "└ 오른쪽 열은 답도 글자도 안 보고 두 길이의 곱으로 정해진다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 자리마다 견주는 후보가 어디서 어긋나는가. */
  costSlot: () => {
    const { rows, gaps } = contrast(SLOT_CASES, bySlot);
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("자리마다 견주기"), rows, ["l", "r", "r", "l"]),
      "",
      "└ 앞에서 글자 하나를 지우거나 넣으면 뒤가 통째로 한 칸씩 밀리는데, 자리마다 견주는 방식은 그 자리를 전부 다른 글자로 센다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 상태를 무엇으로 잡을지 세 가지로 두고 답과 상태 수를 대조한다. */
  stateChoice: () => {
    const heads = ["문자열 통째", "자리마다 견주기", "접두어 쌍 (i, j)"];
    const impls: ((s: string, t: string) => number)[] = [
      (s, t) => byBreadthFirst(s, t).answer,
      bySlot,
      editDistance,
    ];
    const wrong = [0, 0, 0];
    const rows = SLOT_CASES.map((c) => {
      const bare = editDistance(c.s, c.t);
      const cells = impls.map((f, k) => {
        const got = f(c.s, c.t);
        if (got !== bare) wrong[k] = (wrong[k] as number) + 1;
        return String(got);
      });
      return [c.name, String(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    const step = BigInt(
      LIMIT * (ALPHABET - 1) + LIMIT + (LIMIT + 1) * ALPHABET,
    );
    rows.push([
      `|s| = |t| = ${num(LIMIT)} 에서 확인할 개수`,
      "",
      `${num(digits(step ** BigInt(LIMIT)))} 자리`,
      num(LIMIT),
      num((LIMIT + 1) * (LIMIT + 1)),
    ]);
    return [
      table(["입력", "정답", ...heads], rows, ["l", "r", "r", "r", "r"]),
      "",
      "└ 마지막 줄은 왼쪽부터 문자열 · 자리 · 칸의 개수다",
      "└ 어긋나지 않는 것 중 개수가 감당되는 것이 오른쪽 열이다. 왼쪽 열은 답은 맞지만 확인할 것이 지수로 늘어난다",
    ].join("\n");
  },

  /** `deep.walk` 도입부 — 이 입력이 어느 자리를 실행하는가. */
  walkInput: () => {
    const dp = fullTable(S, T);
    const same: string[] = [];
    const onlySub: string[] = [];
    const onlyDel: string[] = [];
    const onlyIns: string[] = [];
    for (let i = 1; i <= S.length; i++) {
      for (let j = 1; j <= T.length; j++) {
        const cell = `(${i}, ${j})`;
        if (S[i - 1] === T[j - 1]) {
          same.push(cell);
          continue;
        }
        const sub = (dp[i - 1] as number[])[j - 1] as number;
        const del = (dp[i - 1] as number[])[j] as number;
        const ins = (dp[i] as number[])[j - 1] as number;
        const best = Math.min(sub, del, ins);
        if (sub === best && del > best && ins > best) onlySub.push(cell);
        if (del === best && sub > best && ins > best) onlyDel.push(cell);
        if (ins === best && sub > best && del > best) onlyIns.push(cell);
      }
    }
    const answer = (dp[S.length] as number[])[T.length] as number;
    assertSame(S, T, answer);
    return table(
      ["두 글자가 같은 칸", same.join(" "), "④ 가 그만큼 실행된다"],
      [
        ["교체가 혼자 가장 작은 칸", onlySub.join(" "), "⑤ 의 첫째 후보"],
        ["삭제가 혼자 가장 작은 칸", onlyDel.join(" "), "⑤ 의 둘째 후보"],
        ["삽입이 혼자 가장 작은 칸", onlyIns.join(" "), "⑤ 의 셋째 후보"],
        ["오른쪽 아래 칸의 값", String(answer), "이 입력의 답"],
      ],
      ["l", "l", "l"],
    );
  },

  /** `deep.walk.step` — 고정 입력의 표를 끝까지 채운 결과와 칸마다의 갈래. */
  walkTrace: () => {
    const dp = fullTable(S, T);
    const rows: string[][] = [];
    for (let i = 0; i <= S.length; i++) {
      const marks: string[] = [];
      for (let j = 1; j <= T.length; j++) {
        marks.push(i === 0 ? "-" : S[i - 1] === T[j - 1] ? "④" : "⑤");
      }
      rows.push([
        `T${i + 1}`,
        `i=${i}`,
        i === 0 ? "-" : (S[i - 1] as string),
        ...(dp[i] as number[]).map(String),
        marks.join(""),
      ]);
    }
    const answer = (dp[S.length] as number[])[T.length] as number;
    assertSame(S, T, answer);
    return [
      table(
        [
          "걸음",
          "줄",
          "s 의 글자",
          "j=0",
          `j=1 ${T[0]}`,
          `j=2 ${T[1]}`,
          `j=3 ${T[2]}`,
          "갈래",
        ],
        rows,
        ["l", "l", "l", "r", "r", "r", "r", "l"],
      ),
      "",
      `└ 오른쪽 아래 칸이 답 ${answer} 이다. ④ 가 세 번 나오고 그때마다 값이 그대로 이어진다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 교체 후보를 빼면 답이 어떻게 되는가. */
  pauseNoSub: () => {
    const rows: string[][] = [];
    const gaps: number[] = [];
    for (const c of NO_SUB_CASES) {
      const bare = editDistance(c.s, c.t);
      const got = withoutSub.editDistance(c.s, c.t);
      const byLcs = c.s.length + c.t.length - 2 * lcsLength(c.s, c.t);
      if (got !== byLcs) {
        throw new Error(
          `교체를 뺀 답이 n + m - 2 x LCS 와 다르다 — ${c.name} 에서 ${got} ≠ ${byLcs}`,
        );
      }
      gaps.push(bare === got ? 0 : 1);
      rows.push([
        c.name,
        String(bare),
        String(got),
        String(byLcs),
        bare === got ? "같다" : "틀리다",
      ]);
    }
    assertBreaks(gaps);
    return [
      table(
        ["입력", "정본이 낸 답", "교체를 뺀 사본", "n + m - 2 x LCS", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 교체를 뺀 사본의 답이 다섯 줄 다 n + m - 2 x LCS 와 같다. 그 값이 곧 삭제와 삽입만으로 두 문자열을 같게 만드는 비용이다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 위 칸을 삽입으로 읽으면 편집 목록이 어떻게 되는가. */
  pauseDirection: () => {
    const right = backtrack(S, T);
    const wrong = misread(S, T);
    const made = applyScript(S, right);
    const broken = applyScript(S, wrong);
    if (made !== T) {
      throw new Error(
        `거슬러 확인한 목록이 "${T}" 를 만들지 못했다 — "${made}"`,
      );
    }
    const rows = right.map((step, k) => [
      `(${step.cell[0]}, ${step.cell[1]})`,
      `${step.move} ${step.letter}`,
      `${(wrong[k] as Stepped).move} ${(wrong[k] as Stepped).letter}`,
      String(step.cost),
    ]);
    return [
      table(["칸", "옳게 읽으면", "뒤바꿔 읽으면", "비용"], rows, [
        "l",
        "l",
        "l",
        "r",
      ]),
      "",
      table(
        ["옳게 읽은 목록을 실행한 결과", `"${made}"`, `길이 ${made.length}`],
        [
          [
            "뒤바꿔 읽은 목록을 실행한 결과",
            `"${broken}"`,
            `길이 ${broken.length}`,
          ],
        ],
        ["l", "l", "l"],
      ),
      `└ 아래쪽은 s 의 글자를 하나도 지우지 않아 길이가 ${S.length} + ${broken.length - S.length} = ${broken.length} 이 된다. 길이 ${T.length} 인 "${T}" 가 될 수 없다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 세 비용이 같지 않으면 무엇이 달라지는가. */
  pauseCost: () => {
    const pairs: [string, string][] = [
      ["ab", "abc"],
      ["abc", "ab"],
      [S, T],
      [T, S],
    ];
    const plain = { sub: 1, del: 1, ins: 1 };
    const gitLike = { sub: 2, del: 3, ins: 1 };
    const rows = pairs.map(([s, t]) => {
      const one = weighted(s, t, plain);
      assertSame(s, t, one);
      return [`"${s}" -> "${t}"`, String(one), String(weighted(s, t, gitLike))];
    });
    return [
      table(
        ["바꾸는 방향", "비용이 셋 다 1", "교체 2 · 삭제 3 · 삽입 1"],
        rows,
        ["l", "r", "r"],
      ),
      "",
      "└ 왼쪽 열은 방향을 바꿔도 값이 같고 오른쪽 열은 달라진다. 삭제와 삽입의 비용이 다르면 두 문자열을 맞바꿀 때 그 둘도 맞바뀌기 때문이다",
    ].join("\n");
  },

  /** `related` — 표에서 고른 경로가 격자 위의 최단 경로다. */
  relatedPath: () => {
    const script = backtrack(S, T);
    const dp = fullTable(S, T);
    let sum = 0;
    const rows = script.map((step) => {
      sum += step.cost;
      const kind =
        step.move === "삽입"
          ? "오른쪽"
          : step.move === "삭제"
            ? "아래"
            : "대각선";
      return [
        `(${step.from[0]}, ${step.from[1]}) -> (${step.cell[0]}, ${step.cell[1]})`,
        kind,
        `${step.move} ${step.letter}`,
        String(step.cost),
        String(sum),
        String((dp[step.cell[0]] as number[])[step.cell[1]] as number),
      ];
    });
    return [
      table(["걸음", "방향", "무엇", "비용", "누적", "그 칸의 값"], rows, [
        "l",
        "l",
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      `└ 누적과 칸의 값이 다섯 걸음 다 같다. 경로의 비용 합 ${sum} 이 오른쪽 아래 칸의 값이다`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 확인한다. */
  mathCheck: () => {
    const s = "ho";
    const t = "or";
    const dp = fullTable(s, t);
    const rows: string[][] = [];
    for (let i = 0; i <= s.length; i++) {
      for (let j = 0; j <= t.length; j++) {
        const x = s.slice(0, i);
        const y = t.slice(0, j);
        const got = byBreadthFirst(x, y).answer;
        const cell = (dp[i] as number[])[j] as number;
        if (got !== cell) {
          throw new Error(
            `정의와 표가 다르다 — (${i}, ${j}) 에서 ${got} ≠ ${cell}`,
          );
        }
        rows.push([
          String(i),
          String(j),
          `"${x}"`,
          `"${y}"`,
          String(got),
          String(cell),
        ]);
      }
    }
    return [
      table(
        [
          "i",
          "j",
          "s 의 앞 i 글자",
          "t 의 앞 j 글자",
          "한 번씩 편집해 센 최소 횟수",
          "dp[i][j]",
        ],
        rows,
        ["r", "r", "l", "l", "r", "r"],
      ),
      "",
      "└ 오른쪽 두 열이 아홉 줄 다 같다. 정의대로 센 값과 표의 값이 같다는 뜻이다",
    ].join("\n");
  },

  /** `deep.math` ③④ — 격자 경로 수의 닫힌 형태를 실측과 대조하고 제약 규모를 넣는다. */
  mathPathCount: () => {
    const rows = SCALE.map((k) => {
      const walked = paths(k, k);
      const closed = pathsClosed(k, k);
      if (walked !== closed) {
        throw new Error(
          `닫힌 형태가 실측과 다르다 — i=j=${k} 실측 ${walked} ≠ 식 ${closed}`,
        );
      }
      return [String(k), num(Number(walked)), num(Number(closed))];
    });
    const big = pathsClosed(LIMIT, LIMIT);
    return [
      table(
        ["i = j", "경로 수(실측)", "sum_p (i+j-p)! / (p! (i-p)! (j-p)!)"],
        rows,
        ["r", "r", "r"],
      ),
      "",
      `제약 규모 i = j = ${num(LIMIT)} 을 두 식에 넣으면`,
      table(
        ["  경로 수", `${num(digits(big))} 자리`],
        [["  (i+1)(j+1)", num((LIMIT + 1) * (LIMIT + 1))]],
        ["l", "r"],
      ),
    ].join("\n");
  },

  /** `invariant` ③ — 첫 열을 0 으로 두면 무엇이 나오는가. */
  mutantFirstColumn: () => {
    const { rows, gaps } = contrast(FIRST_COLUMN_CASES, (s, t) =>
      zeroFirstColumn.editDistance(s, t),
    );
    assertBreaks(gaps);
    const right = (fullTable(S, T)[S.length] as number[]).join(" ");
    const wrongDp: number[][] = Array.from({ length: S.length + 1 }, () =>
      new Array<number>(T.length + 1).fill(0),
    );
    for (let j = 0; j <= T.length; j++) (wrongDp[0] as number[])[j] = j;
    for (let i = 1; i <= S.length; i++) {
      const prev = wrongDp[i - 1] as number[];
      const cur = wrongDp[i] as number[];
      for (let j = 1; j <= T.length; j++) {
        cur[j] =
          S[i - 1] === T[j - 1]
            ? (prev[j - 1] as number)
            : Math.min(
                prev[j - 1] as number,
                prev[j] as number,
                cur[j - 1] as number,
              ) + 1;
      }
    }
    return [
      table(CONTRAST_HEAD("첫 열을 0 으로 둔 답"), rows, ["l", "r", "r", "l"]),
      "",
      `전개 입력에서 마지막 줄이 [${right}] 에서 [${(wrongDp[S.length] as number[]).join(" ")}] 로 바뀐다`,
      "└ 첫 열의 i 는 s 의 앞 i 글자를 지우는 비용이다. 그것을 0 으로 두면 s 의 앞부분을 비용 없이 버릴 수 있게 되어, t 가 s 어딘가에 얼마나 가깝게 들어 있는지를 재는 다른 문제가 된다",
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 문자 비교와 값 비교가 드는가. */
  perfCount: () => {
    const c = byTable(S, T);
    assertSame(S, T, c.answer);
    const n = S.length;
    const m = T.length;
    const rows = [
      ["테두리 채우기", "T1", "0", "0", "0"],
      [
        "칸 채우기",
        `T2 부터 T${n + 1} 까지`,
        String(c.chars),
        String(c.picks),
        String(c.chars + c.picks),
      ],
      ["읽기", `T${n + 2}`, "0", "0", "0"],
      ["합계", "", String(c.chars), String(c.picks), String(c.chars + c.picks)],
    ];
    return [
      table(
        ["무리", "어느 걸음인가", "문자 비교", "값 비교", "기본 연산"],
        rows,
        ["l", "l", "r", "r", "r"],
      ),
      "",
      `└ 채운 칸이 ${n} x ${m} = ${num(n * m)} 개이고 그중 두 글자가 같은 칸이 ${c.same} 개다`,
      `└ 두 글자가 다른 칸에서만 세 후보를 견주느라 값 비교가 두 번씩 든다 — ${num(n * m - c.same)} x 2 = ${num(c.picks)}`,
      `└ 제약 규모 |s| = |t| = ${num(LIMIT)} 이고 두 글자가 같은 칸이 하나도 없으면 기본 연산이 ${num(3 * LIMIT * LIMIT)} 번이다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양에 따라 기본 연산 수가 어디까지 갈리는가. */
  worstShape: () => {
    const n = LIMIT;
    const shapes: [string, string, string][] = [
      ["두 문자열이 같다", "a".repeat(n), "a".repeat(n)],
      [
        "글자가 둘씩 번갈아 나온다",
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? "a" : "b")).join(""),
        Array.from({ length: n }, (_, k) => (k % 2 === 0 ? "b" : "a")).join(""),
      ],
      [
        "알파벳 26 을 차례로 되풀이한다",
        Array.from({ length: n }, (_, k) =>
          String.fromCharCode(97 + (k % ALPHABET)),
        ).join(""),
        Array.from({ length: n }, (_, k) =>
          String.fromCharCode(97 + ((k + 1) % ALPHABET)),
        ).join(""),
      ],
      ["공통 글자가 하나도 없다", "a".repeat(n), "b".repeat(n)],
    ];
    const rows = shapes.map(([name, s, t]) => {
      const c = byTable(s, t);
      assertSame(s, t, c.answer);
      return [
        name,
        num(c.same),
        num(c.chars),
        num(c.picks),
        num(c.chars + c.picks),
        num(c.answer),
      ];
    });
    return [
      table(
        [
          `입력의 모양 (|s| = |t| = ${num(n)})`,
          "두 글자가 같은 칸",
          "문자 비교",
          "값 비교",
          "기본 연산",
          "답",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "가운데 왼쪽 열이 0 이 되는 마지막 줄에서 기본 연산이 가장 많다",
      `└ 문자 비교는 네 줄 다 ${num(n * n)} 으로 같고, 값 비교만 0 에서 ${num(2 * n * n)} 까지 갈린다`,
    ].join("\n");
  },
};
