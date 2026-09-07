/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/longestPalindrome/longestPalindrome-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 견줬는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만 낸다.
 * 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { longestPalindrome } from "./longestPalindrome-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `399,994` 꼴 — 본문 표기와 같다. */
const comma = (n: number | bigint): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 낸다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 「일곱 자리」 처럼 앞 공백을 달고 돌아오는 수사. 뒤 어미는 붙이지 않는다. */
const 개수 = (n: number): string => {
  const 말 = [
    "영",
    "하나",
    "둘",
    "셋",
    "넷",
    "다섯",
    "여섯",
    "일곱",
    "여덟",
    "아홉",
    "열",
  ];
  return ` ${말[n] ?? comma(n)}`;
};

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 문자열. 일곱 글자이고 넓히면 열다섯 자리가 된다.
 *
 * 물려받기의 세 갈래가 한 입력에서 전부 나온다 — 대칭 자리의 값이 그대로 답이 되는 자리,
 * 오른쪽 끝에 잘리는 자리, 오른쪽 끝과 같아서 더 늘어나는 자리. 답은 짝수 길이라 중심이
 * 구분자 자리에 있고, 시작 자리가 0 도 아니라 좌표 되돌리기가 실제로 값을 한다.
 */
export const WALK_S = "ababbaa";

/** 본문 여러 자리가 함께 쓰는 작은 입력 열. 뒤 넷은 기존 시험이 쓰던 케이스다. */
export const SMALL: string[] = [
  WALK_S,
  "babaaa",
  "ababbb",
  "aaaa",
  "abba",
  "abcba",
  "abab",
  "cbbd",
  "racecar",
  "abcde",
];

/** 문제가 정한 상한. */
const CONSTRAINT_N = 100_000;

/** 구분자로 쓰는 글자. 정본이 끼우는 것과 같다. */
const SEP = "#";

/* ────────────────────── 입력을 만드는 생성식 ────────────────────── */

/** 같은 글자만 `n` 개. */
export const same = (n: number): string => "a".repeat(n);

/** 두 글자를 번갈아 `n` 개. */
export const alternating = (n: number): string =>
  Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "a" : "b")).join("");

/** 자리마다 다른 글자 — 알파벳 스물여섯을 돌려 쓴다. */
export const rolling = (n: number): string =>
  Array.from({ length: n }, (_, i) => String.fromCharCode(97 + (i % 26))).join(
    "",
  );

/** xorshift32 로 만든 문자열. 시드를 고정해 실행마다 같은 값이 나온다. */
export function pseudo(n: number, sigma: number, seed = 20260908): string {
  let x = seed >>> 0;
  let out = "";
  for (let i = 0; i < n; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    out += String.fromCharCode(97 + (x % sigma));
  }
  return out;
}

/** 최악을 만드는 계열 — 양 끝만 다른 글자다. */
export const edgesDiffer = (n: number): string => `a${"b".repeat(n - 2)}a`;

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 자리 하나를 처리한 기록. */
export interface Row {
  /** 넓힌 문자열에서의 자리. */
  i: number;
  /** 그 자리의 글자. */
  ch: string;
  /** 확인해 둔 구간 안이었는가. */
  inside: boolean;
  /** 대칭 자리. 구간 밖이면 `null`. */
  mirror: number | null;
  /** 대칭 자리의 반지름. 구간 밖이면 `null`. */
  pMirror: number | null;
  /** 물려받은 값. 구간 밖이면 `null`. */
  carried: number | null;
  /** 물려받기가 어느 갈래였는가. */
  branch: string;
  /** 같아서 반지름을 늘린 견주기. */
  grow: number;
  /** 달라서 멈춘 견주기. 0 또는 1 이다. */
  stop: number;
  /** 이 자리의 반지름. */
  p: number;
  /** 자리에 들어올 때의 오른쪽 끝. */
  rBefore: number;
  /** 자리를 끝낸 뒤의 기준 자리. */
  c: number;
  /** 자리를 끝낸 뒤의 오른쪽 끝. */
  r: number;
  /** 자리를 끝낸 뒤의 가장 큰 자리. */
  best: number;
  /** 이 걸음이 오른쪽 끝을 옮겼는가. */
  movedEdge: boolean;
  /** 이 걸음이 가장 큰 자리를 바꿨는가. */
  movedBest: boolean;
}

export interface Counts {
  ans: string;
  t: string;
  m: number;
  p: number[];
  rows: Row[];
  /** 같아서 늘린 견주기. */
  grow: number;
  /** 달라서 멈춘 견주기. */
  stop: number;
  /** 글자 견주기 총합. */
  cmp: number;
  /** 라벨별 실행 횟수. */
  branchHits: number[];
}

/** 정본과 같은 절차. 세는 자리만 덧붙였다. */
export function counted(s: string): Counts {
  const hits = [0, 0, 0, 0, 0, 0];
  if (s.length === 0) {
    return {
      ans: "",
      t: "",
      m: 0,
      p: [],
      rows: [],
      grow: 0,
      stop: 0,
      cmp: 0,
      branchHits: hits,
    };
  }
  const t = `${SEP}${[...s].join(SEP)}${SEP}`;
  hits[0] = 1;
  const m = t.length;
  const p = new Array<number>(m).fill(0);
  let c = 0;
  let r = 0;
  let best = 0;
  let grow = 0;
  let stop = 0;
  const rows: Row[] = [];
  for (let i = 0; i < m; i++) {
    const inside = i < r;
    const rBefore = r;
    const mirror = inside ? 2 * c - i : null;
    const pMirror = mirror === null ? null : (p[mirror] as number);
    let k = inside ? Math.min(r - i, pMirror as number) : 0;
    const carried = inside ? k : null;
    let branch: string;
    if (!inside) branch = "구간 밖";
    else if ((pMirror as number) < r - i) branch = "대칭 값 그대로";
    else if ((pMirror as number) > r - i) branch = "오른쪽 끝에 잘림";
    else branch = "오른쪽 끝과 같음";
    if (inside) hits[1] = (hits[1] as number) + 1;
    let g = 0;
    let f = 0;
    while (i - k - 1 >= 0 && i + k + 1 < m) {
      if (t[i - k - 1] !== t[i + k + 1]) {
        f = 1;
        break;
      }
      k++;
      g++;
    }
    if (g + f > 0) hits[2] = (hits[2] as number) + 1;
    grow += g;
    stop += f;
    p[i] = k;
    let movedEdge = false;
    let movedBest = false;
    if (i + k > r) {
      c = i;
      r = i + k;
      movedEdge = true;
      hits[3] = (hits[3] as number) + 1;
    }
    if (k > (p[best] as number)) {
      best = i;
      movedBest = true;
      hits[4] = (hits[4] as number) + 1;
    }
    rows.push({
      i,
      ch: t[i] as string,
      inside,
      mirror,
      pMirror,
      carried,
      branch,
      grow: g,
      stop: f,
      p: k,
      rBefore,
      c,
      r,
      best,
      movedEdge,
      movedBest,
    });
  }
  hits[5] = 1;
  const start = (best - (p[best] as number)) / 2;
  return {
    ans: s.slice(start, start + (p[best] as number)),
    t,
    m,
    p,
    rows,
    grow,
    stop,
    cmp: grow + stop,
    branchHits: hits,
  };
}

/** 기록 없이 계수만 낸다. `n` 이 10 만이면 위 사본은 기록이 실행의 대부분이 된다. */
export function countedLite(s: string): {
  ans: string;
  grow: number;
  stop: number;
} {
  if (s.length === 0) return { ans: "", grow: 0, stop: 0 };
  const t = `${SEP}${[...s].join(SEP)}${SEP}`;
  const m = t.length;
  const p = new Array<number>(m).fill(0);
  let c = 0;
  let r = 0;
  let best = 0;
  let grow = 0;
  let stop = 0;
  for (let i = 0; i < m; i++) {
    let k = i < r ? Math.min(r - i, p[2 * c - i] as number) : 0;
    while (i - k - 1 >= 0 && i + k + 1 < m) {
      if (t[i - k - 1] !== t[i + k + 1]) {
        stop++;
        break;
      }
      k++;
      grow++;
    }
    p[i] = k;
    if (i + k > r) {
      c = i;
      r = i + k;
    }
    if (k > (p[best] as number)) best = i;
  }
  const start = (best - (p[best] as number)) / 2;
  return { ans: s.slice(start, start + (p[best] as number)), grow, stop };
}

/* ────────────────── 견주어 볼 다른 방식 셋 ────────────────── */

/** 방식 A — 부분 문자열을 전부 잘라 회문인지 확인한다. */
export function allSubstrings(s: string): { ans: string; cmp: number } {
  const n = s.length;
  let cmp = 0;
  let best = "";
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let ok = true;
      for (let a = i, b = j; a < b; a++, b--) {
        cmp++;
        if (s[a] !== s[b]) {
          ok = false;
          break;
        }
      }
      if (ok && j - i + 1 > best.length) best = s.slice(i, j + 1);
    }
  }
  return { ans: best, cmp };
}

/** 방식 B — 중심마다 양쪽으로 넓혀 본다. 넓힌 문자열을 쓰지 않는다. */
export function centerExpand(s: string): { ans: string; cmp: number } {
  const n = s.length;
  let cmp = 0;
  let bestLen = 0;
  let bestStart = 0;
  for (let ctr = 0; ctr < 2 * n - 1; ctr++) {
    let a = ctr >> 1;
    let b = (ctr >> 1) + (ctr & 1);
    while (a >= 0 && b < n) {
      cmp++;
      if (s[a] !== s[b]) break;
      a--;
      b++;
    }
    const len = b - a - 1;
    if (len > bestLen) {
      bestLen = len;
      bestStart = a + 1;
    }
  }
  return { ans: s.slice(bestStart, bestStart + bestLen), cmp };
}

/** 물려받기 방식을 갈아 끼울 수 있는 사본. 정본은 `"둘 중 작은 값"` 과 같다. */
export type CarryRule =
  | "안 물려받는다"
  | "대칭 값 그대로"
  | "오른쪽 끝까지만"
  | "둘 중 작은 값";

export function withCarry(
  s: string,
  rule: CarryRule,
): { ans: string; cmp: number } {
  if (s.length === 0) return { ans: "", cmp: 0 };
  const t = `${SEP}${[...s].join(SEP)}${SEP}`;
  const m = t.length;
  const p = new Array<number>(m).fill(0);
  let c = 0;
  let r = 0;
  let best = 0;
  let cmp = 0;
  for (let i = 0; i < m; i++) {
    let k = 0;
    if (i < r) {
      const mirrored = p[2 * c - i] as number;
      if (rule === "대칭 값 그대로") k = mirrored;
      else if (rule === "오른쪽 끝까지만") k = r - i;
      else if (rule === "둘 중 작은 값") k = Math.min(r - i, mirrored);
    }
    while (i - k - 1 >= 0 && i + k + 1 < m) {
      cmp++;
      if (t[i - k - 1] !== t[i + k + 1]) break;
      k++;
    }
    p[i] = k;
    if (i + k > r) {
      c = i;
      r = i + k;
    }
    if (k > (p[best] as number)) best = i;
  }
  const start = (best - (p[best] as number)) / 2;
  return { ans: s.slice(start, start + (p[best] as number)), cmp };
}

/** 정의를 그대로 옮긴 판정 — 시험과 반례 확인에만 쓴다. */
export function bruteBest(s: string): string {
  let best = "";
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const w = s.slice(i, j + 1);
      let ok = true;
      for (let a = 0, b = w.length - 1; a < b; a++, b--) {
        if (w[a] !== w[b]) {
          ok = false;
          break;
        }
      }
      if (ok && w.length > best.length) best = w;
    }
  }
  return best;
}

/* ────────────────────────── 자기대조 ────────────────────────── */

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs = [...SMALL, "a", "aa", "ab", "", same(31), pseudo(120, 3)];
  for (const s of inputs) {
    const ref = longestPalindrome(s);
    if (counted(s).ans !== ref)
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    if (countedLite(s).ans !== ref) {
      throw new Error("기록 없는 사본이 정본과 다른 답을 낸다");
    }
    if (withCarry(s, "둘 중 작은 값").ans !== ref) {
      throw new Error("물려받기 사본이 정본과 다른 답을 낸다");
    }
    if (allSubstrings(s).ans.length !== ref.length) {
      throw new Error("부분 문자열 전수 사본이 다른 길이를 낸다");
    }
    if (centerExpand(s).ans.length !== ref.length) {
      throw new Error("중심 넓히기 사본이 다른 길이를 낸다");
    }
    if (bruteBest(s).length !== ref.length) {
      throw new Error("정의를 옮긴 판정이 다른 길이를 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./longestPalindrome-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  longestPalindrome(s: string): string;
}

/** 물려받은 값을 오른쪽 끝에서 자르지 않는 사본. */
const noClip = await loadMutant<Impl>(REF, {
  swap: [
    /Math\.min\(r - i, p\[2 \* c - i\] as number\)/,
    "(p[2 * c - i] as number)",
  ],
});

/** 반지름이 같을 때도 자리를 바꾸는 사본 — 가장 오른쪽 자리가 남는다. */
const rightmostTie = await loadMutant<Impl>(REF, {
  swap: [
    /if \(k > \(p\[best\] as number\)\) best = i;/,
    "if (k >= (p[best] as number)) best = i;",
  ],
});

/** **불변식을 지키던 줄** 하나 — 앞쪽 구분자를 빼고 넓힌 사본. */
const noLeadingSep = await loadMutant<Impl>(REF, {
  swap: [
    /const t = `#\$\{\[\.\.\.s\]\.join\("#"\)\}#`;/,
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 정본 소스로 바꿔 넣을 코드 조각이다
    'const t = `${[...s].join("#")}#`;',
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noClip.longestPalindrome === longestPalindrome;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
// `rightmostTie` 는 여기 넣지 않는다 — **길이는 어느 입력에서도 안 바뀌는 것**이 그 변이의
// 결론이고, 그 사실 자체를 멈춤 하나가 값으로 보인다.
if (!중화됨) {
  for (const [label, impl] of [
    ["자르지 않는 판", noClip],
    ["앞 구분자를 뺀 판", noLeadingSep],
  ] as [string, Impl][]) {
    const same2 = SMALL.every(
      (s) => longestPalindrome(s) === impl.longestPalindrome(s),
    );
    if (same2)
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

/**
 * 변이 하나를 작은 입력 열에 걸어 정본과 나란히 놓는다.
 *
 * **「지나간 횟수」 열이 있어야 「같다」 가 뜻을 갖는다.** 그 값이 0 이면 변이가 바꾼 자리를
 * 그 입력이 한 번도 지나가지 않은 것이고, 그때의 「같다」 는 변이가 무해하다는 뜻이 아니다.
 */
function mutantTable(
  head: string,
  impl: Impl,
  passHead: string,
  passes: (s: string) => number,
): string[] {
  const rows = SMALL.map((s) => {
    const a = longestPalindrome(s);
    const b = impl.longestPalindrome(s);
    const label = s === WALK_S ? `전개 입력 "${s}"` : `"${s}"`;
    return [
      label,
      String(passes(s)),
      `"${a}"`,
      `"${b}"`,
      a === b ? "같다" : "어긋난다",
    ];
  });
  return table([["입력", passHead, "정본", head, "판정"], ...rows], [1]);
}

/** 물려받은 값이 실제로 남은 칸에 잘린 자리 수 — 자르는 줄이 값을 한 횟수다. */
function clippedPlaces(s: string): number {
  return counted(s).rows.filter((row) => row.branch === "오른쪽 끝에 잘림")
    .length;
}

/** 반지름이 지금까지의 최댓값과 같아진 자리 수 — `>` 와 `>=` 가 갈리는 횟수다. */
function tiedPlaces(s: string): number {
  const c = counted(s);
  let tied = 0;
  let best = 0;
  for (const row of c.rows) {
    if (row.p === (c.p[best] as number)) tied++;
    if (row.p > (c.p[best] as number)) best = row.i;
  }
  return tied;
}

/* ────────────────────────── 블록 ────────────────────────── */

const LABELS = ["①", "②", "③", "④", "⑤", "⑥"];

export const PROOFS: Record<string, () => string> = {
  /** concept — 넓힌 문자열의 자리마다 반지름이 얼마이고 답이 어디서 나오는가. */
  "concept-radius": () => {
    const c = counted(WALK_S);
    const rows = c.rows.map((row) => {
      const start = (row.i - row.p) / 2;
      return [
        String(row.i),
        row.ch,
        String(row.p),
        row.p === 0 ? "없다" : `"${WALK_S.slice(start, start + row.p)}"`,
        row.p === 0 ? "-" : String(start),
      ];
    });
    return [
      `s = "${WALK_S}"  ·  t = "${c.t}"  ·  m = ${c.m}`,
      "",
      ...table(
        [
          ["t 의 자리", "글자", "반지름", "s 에서의 회문", "시작 자리"],
          ...rows,
        ],
        [0, 2, 4],
      ),
      "",
      `반지름이 가장 큰 자리는 ${c.rows.reduce((a, b) => (b.p > a.p ? b : a)).i} 이고 답은 "${c.ans}" 다`,
    ].join("\n");
  },

  /** concept — 아무 기법 없이 풀면 제약 규모에서 몇 번인가. */
  "concept-naive": () => {
    const rows = [8, 16, 100, 1_000].map((n) => {
      const s = same(n);
      return [
        comma(n),
        comma(allSubstrings(s).cmp),
        comma(centerExpand(s).cmp),
        comma(countedLite(s).grow + countedLite(s).stop),
      ];
    });
    // 제약 규모는 닫힌 형태로 낸다 — 부분 문자열 전수를 10 만에 실제로 돌리는 값이 아니다.
    const N = BigInt(CONSTRAINT_N);
    let allSub = 0n;
    for (let L = 1n; L <= N; L++) allSub += (N - L + 1n) * (L / 2n);
    const center = (N * (N + 1n)) / 2n;
    return [
      ...table(
        [
          [
            "n (같은 글자만)",
            "부분 문자열 전수",
            "중심 넓히기",
            "이 글의 방법",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      ...table(
        [
          ["제약 최댓값 n = 100,000 에서", "글자 견주기"],
          ["부분 문자열 전수", comma(allSub)],
          ["중심 넓히기", comma(center)],
          ["이 글의 방법", comma(4 * CONSTRAINT_N - 6)],
        ],
        [1],
      ),
      "",
      "1 초 안에 끝나는 규모는 셋째 줄뿐이다",
    ].join("\n");
  },

  /** deep.build ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 놓는다. */
  "build-two-ways": () => {
    const inputs: [string, string][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S],
      ['"aaaa"', "aaaa"],
      ['"abcde"', "abcde"],
      ['"racecar"', "racecar"],
      ["같은 글자 n = 100", same(100)],
      ["번갈이 n = 100", alternating(100)],
      ["다른 글자 n = 100", rolling(100)],
    ];
    const rows = inputs.map(([label, s]) => {
      const a = allSubstrings(s);
      const b = centerExpand(s);
      return [
        label,
        comma(a.cmp),
        comma(b.cmp),
        `${(a.cmp / Math.max(1, b.cmp)).toFixed(1)} 배`,
        a.ans.length === b.ans.length ? "같다" : "어긋난다",
      ];
    });
    return table(
      [
        ["입력", "부분 문자열 전수", "중심 넓히기", "몇 배", "두 답의 길이"],
        ...rows,
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** deep.build ④ — 중심 넓히기도 왜 부족한가. */
  "build-center-blowup": () => {
    const rows = [10, 100, 1_000, 10_000].map((n) => {
      const s = same(n);
      const b = centerExpand(s);
      return [comma(n), comma(b.cmp), comma((n * (n + 1)) / 2)];
    });
    return [
      ...table(
        [["n (같은 글자만)", "중심 넓히기의 글자 견주기", "n(n+1)/2"], ...rows],
        [0, 1, 2],
      ),
      "",
      `두 열이 자리마다 같다 — 중심 넓히기의 최악은 정확히 n(n+1)/2 이고`,
      `n = ${comma(CONSTRAINT_N)} 이면 ${comma((CONSTRAINT_N * (CONSTRAINT_N + 1)) / 2)} 번이다`,
    ].join("\n");
  },

  /** deep.build ⑥ — 물려받기 방식 넷을 실제로 갈아 끼워 잰다. */
  "build-carry-rules": () => {
    const inputs: [string, string][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S],
      ['"abab"', "abab"],
      ["같은 글자 n = 1,000", same(1_000)],
      ["번갈이 n = 1,000", alternating(1_000)],
      ["무작위 두 글자 n = 1,000", pseudo(1_000, 2)],
      ["무작위 스물여섯 글자 n = 1,000", pseudo(1_000, 26)],
    ];
    const rules: CarryRule[] = [
      "안 물려받는다",
      "대칭 값 그대로",
      "오른쪽 끝까지만",
      "둘 중 작은 값",
    ];
    const rows: string[][] = [];
    for (const [label, s] of inputs) {
      const ref = longestPalindrome(s).length;
      for (const rule of rules) {
        const got = withCarry(s, rule);
        rows.push([
          label,
          rule,
          got.ans.length === ref ? "예" : "아니오",
          comma(got.cmp),
        ]);
      }
    }
    return table(
      [["입력", "물려받기 방식", "답의 길이가 맞는가", "글자 견주기"], ...rows],
      [3],
    ).join("\n");
  },

  /** deep.build ⑥ — 전개 입력에서 자리마다 무엇을 물려받았는가. */
  "build-carry-detail": () => {
    const c = counted(WALK_S);
    const rows = c.rows
      .filter((row) => row.inside)
      .map((row) => [
        String(row.i),
        String(row.mirror),
        String(row.pMirror),
        String(row.rBefore - row.i),
        String(row.carried),
        row.branch,
        String(row.grow),
        String(row.p),
      ]);
    return [
      `s = "${WALK_S}"  ·  t = "${c.t}"`,
      "",
      ...table(
        [
          [
            "자리",
            "대칭 자리",
            "대칭 반지름",
            "남은 칸",
            "물려받은 값",
            "갈래",
            "늘린 횟수",
            "반지름",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 6, 7],
      ),
      "",
      `구간 안에서 처리한 자리${개수(rows.length)} · 물려받은 값이 진짜 반지름을 넘은 자리 0`,
    ].join("\n");
  },

  /** deep.walk — 고정 입력을 걸음마다 펼친다. */
  "walk-trace": () => {
    const c = counted(WALK_S);
    const head = [
      "걸음",
      "자리",
      "글자",
      "라벨",
      "대칭 자리",
      "물려받은 값",
      "늘림",
      "멈춤",
      "반지름",
      "기준 자리",
      "오른쪽 끝",
      "가장 큰 자리",
    ];
    const rows: string[][] = [
      ["T1", "-", "-", "①", "-", "-", "0", "0", "-", "0", "0", "0"],
    ];
    for (const row of c.rows) {
      const labels: string[] = [];
      if (row.inside) labels.push(LABELS[1] as string);
      if (row.grow + row.stop > 0) labels.push(LABELS[2] as string);
      if (row.movedEdge) labels.push(LABELS[3] as string);
      if (row.movedBest) labels.push(LABELS[4] as string);
      rows.push([
        `T${row.i + 2}`,
        String(row.i),
        row.ch,
        labels.length === 0 ? "-" : labels.join(""),
        row.mirror === null ? "-" : String(row.mirror),
        row.carried === null ? "-" : String(row.carried),
        String(row.grow),
        String(row.stop),
        String(row.p),
        String(row.c),
        String(row.r),
        String(row.best),
      ]);
    }
    const last = c.rows[c.rows.length - 1] as Row;
    rows.push([
      `T${c.m + 2}`,
      "-",
      "-",
      "⑥",
      "-",
      "-",
      "0",
      "0",
      "-",
      String(last.c),
      String(last.r),
      String(last.best),
    ]);
    return [
      `s = "${WALK_S}"  ·  t = "${c.t}"  ·  m = ${c.m}`,
      "",
      ...table(
        rows.length > 0 ? [head, ...rows] : [head],
        [1, 4, 5, 6, 7, 8, 9, 10, 11],
      ),
      "",
      `늘린 견주기 ${c.grow} · 멈춘 견주기 ${c.stop} · 글자 견주기 ${c.cmp}`,
      `답 "${c.ans}" — 자리 ${(c.rows.reduce((a, b) => (b.p > a.p ? b : a)) as Row).i} 에서 시작 자리 ${((c.rows.reduce((a, b) => (b.p > a.p ? b : a)) as Row).i - (c.rows.reduce((a, b) => (b.p > a.p ? b : a)) as Row).p) / 2} 로 되돌렸다`,
    ].join("\n");
  },

  /** deep.walk — 여섯 갈래가 전부 실행됐는가. */
  "walk-coverage": () => {
    const names = [
      "자리를 넓혀 t 를 만든다",
      "구간 안이면 값을 물려받는다",
      "한 칸씩 늘려 본다",
      "오른쪽 끝을 더 멀리 옮긴다",
      "가장 큰 자리를 바꾼다",
      "원래 자리로 되돌려 잘라 낸다",
    ];
    const a = counted(WALK_S);
    const b = counted("racecar");
    const rows = names.map((name, idx) => [
      LABELS[idx] as string,
      name,
      String(a.branchHits[idx]),
      String(b.branchHits[idx]),
    ]);
    return [
      ...table(
        [
          ["라벨", "그 갈래가 맡은 일", `전개 입력 "${WALK_S}"`, '"racecar"'],
          ...rows,
        ],
        [2, 3],
      ),
      "",
      `여섯 줄 어디에도 0 이 없다 — 0 인 줄이 ${rows.filter((r) => r[2] === "0" || r[3] === "0").length} 개다`,
    ].join("\n");
  },

  /** 멈춤 — 물려받은 값을 자르지 않으면. */
  "pause-noclip": () =>
    mutantTable("자르지 않는 판", noClip, "잘린 자리", clippedPlaces).join(
      "\n",
    ),

  /** 멈춤 — 구분자로 쓴 글자가 입력에 있어도. */
  "pause-separator": () => {
    const alphabet = ["a", SEP, "b"];
    let checked = 0;
    let wrong = 0;
    for (let n = 1; n <= 9; n++) {
      const total = alphabet.length ** n;
      for (let code = 0; code < total; code++) {
        let s = "";
        let x = code;
        for (let d = 0; d < n; d++) {
          s += alphabet[x % alphabet.length] as string;
          x = Math.floor(x / alphabet.length);
        }
        checked++;
        if (longestPalindrome(s).length !== bruteBest(s).length) wrong++;
      }
    }
    const cases = ["a#a", "#a#", "a##a", "#ab#", "##", "b#a#b"];
    const rows = cases.map((s) => {
      const got = longestPalindrome(s);
      const want = bruteBest(s);
      return [
        `"${s}"`,
        `"${`${SEP}${[...s].join(SEP)}${SEP}`}"`,
        `"${got}"`,
        `"${want}"`,
        got.length === want.length ? "같다" : "어긋난다",
      ];
    });
    return [
      ...table([
        ["입력", "넓힌 문자열", "정본", "정의를 옮긴 판정", "판정"],
        ...rows,
      ]),
      "",
      `알파벳 {a, ${SEP}, b} 의 길이 1~9 문자열 ${comma(checked)} 벌 전수 · 길이가 어긋난 벌 ${wrong}`,
    ].join("\n");
  },

  /** 멈춤 — 반지름이 같을 때 어느 자리를 남기는가. */
  "pause-tie": () => {
    const rows = SMALL.map((s) => {
      const a = longestPalindrome(s);
      const b = rightmostTie.longestPalindrome(s);
      const label = s === WALK_S ? `전개 입력 "${s}"` : `"${s}"`;
      return [
        label,
        String(tiedPlaces(s)),
        `"${a}"`,
        `"${b}"`,
        String(a.length),
        String(b.length),
        a === b ? "같다" : "어긋난다",
      ];
    });
    return table(
      [
        [
          "입력",
          "동점 자리",
          "정본",
          "오른쪽을 남기는 판",
          "정본 길이",
          "변이 길이",
          "돌려준 문자열",
        ],
        ...rows,
      ],
      [1, 4, 5],
    ).join("\n");
  },

  /** related — 두 좌표계의 대응. */
  "related-coords": () => {
    const c = counted(WALK_S);
    const n = WALK_S.length;
    const charRows = Array.from({ length: n }, (_, j) => [
      "글자",
      String(j),
      String(2 * j + 1),
      c.t[2 * j + 1] as string,
    ]);
    const gapRows = Array.from({ length: n + 1 }, (_, j) => [
      j === 0 ? "맨 앞" : j === n ? "맨 뒤" : "빈 자리",
      String(j),
      String(2 * j),
      c.t[2 * j] as string,
    ]);
    return [
      `s = "${WALK_S}"  ·  t = "${c.t}"`,
      "",
      ...table(
        [
          ["무엇", "s 에서의 번호", "t 에서의 자리", "그 자리의 글자"],
          ...charRows,
        ],
        [1, 2],
      ),
      "",
      ...table(
        [
          ["무엇", "s 에서의 번호", "t 에서의 자리", "그 자리의 글자"],
          ...gapRows,
        ],
        [1, 2],
      ),
      "",
      `글자 ${n} 개는 홀수 자리로, 빈 자리 ${n + 1} 개는 짝수 자리로 간다 — 합쳐 ${c.m} 자리`,
    ].join("\n");
  },

  /** deep.math ② — 정의를 작은 값에 넣어 손으로 확인한다. */
  "math-check": () => {
    const rows: string[][] = [];
    for (const s of ["a", "aa", "aba", "abba"]) {
      const c = counted(s);
      rows.push([
        `"${s}"`,
        String(s.length),
        String(c.m),
        `"${c.t}"`,
        `[${c.p.join(", ")}]`,
        `"${c.ans}"`,
      ]);
    }
    return table(
      [["s", "n", "m = 2n+1", "t", "반지름 p", "답"], ...rows],
      [1, 2],
    ).join("\n");
  },

  /** deep.math ③ — i − p[i] 가 언제나 짝수인가. */
  "math-parity": () => {
    let places = 0;
    let odd = 0;
    const rows: string[][] = [];
    for (let n = 1; n <= 12; n++) {
      let nPlaces = 0;
      let nOdd = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        let s = "";
        for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
        const c = counted(s);
        for (const row of c.rows) {
          nPlaces++;
          if ((row.i - row.p) % 2 !== 0) nOdd++;
        }
      }
      places += nPlaces;
      odd += nOdd;
      if (n <= 4 || n === 12) {
        rows.push([String(n), comma(1 << n), comma(nPlaces), String(nOdd)]);
      }
    }
    return [
      ...table(
        [["n", "문자열 수", "확인한 자리", "i − p[i] 가 홀수인 자리"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `두 글자 알파벳의 길이 1~12 문자열 전수 — 자리 ${comma(places)} 개 중 홀수인 자리 ${odd}`,
    ].join("\n");
  },

  /** deep.math ④ — 견주기 상한과 실측 최댓값. */
  "math-bound": () => {
    const rows: string[][] = [];
    for (const n of [3, 4, 6, 8, 10, 12]) {
      let mx = -1;
      let arg = "";
      for (let mask = 0; mask < 1 << n; mask++) {
        let s = "";
        for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
        const c = countedLite(s);
        if (c.grow + c.stop > mx) {
          mx = c.grow + c.stop;
          arg = s;
        }
      }
      const m = 2 * n + 1;
      rows.push([
        String(n),
        String(m),
        String(2 * m - 1),
        String(mx),
        String(4 * n - 6),
        `"${arg}"`,
      ]);
    }
    const big = [100, 1_000, 10_000, CONSTRAINT_N].map((n) => {
      const c = countedLite(edgesDiffer(n));
      return [comma(n), comma(c.grow + c.stop), comma(4 * n - 6)];
    });
    return [
      ...table(
        [
          [
            "n",
            "m",
            "느슨한 상한 2m−1",
            "전수 최댓값",
            "4n−6",
            "최댓값을 낸 입력",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      ...table(
        [["양 끝만 다른 계열 n", "글자 견주기", "4n−6"], ...big],
        [0, 1, 2],
      ),
    ].join("\n");
  },

  /** invariant ② — 자리마다 양 끝이 빈 자리인가. */
  "invariant-watch": () => {
    const inputs: [string, string][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S],
      ['"aaaa"', "aaaa"],
      ['"racecar"', "racecar"],
      ['"abcde"', "abcde"],
      ["번갈이 n = 500", alternating(500)],
      ["무작위 두 글자 n = 500", pseudo(500, 2)],
      ["무작위 스물여섯 글자 n = 500", pseudo(500, 26)],
    ];
    const rows = inputs.map(([label, s]) => {
      const c = counted(s);
      let oddGap = 0;
      let notSep = 0;
      let outside = 0;
      for (const row of c.rows) {
        if ((row.i - row.p) % 2 !== 0) oddGap++;
        if (c.t[row.i - row.p] !== SEP || c.t[row.i + row.p] !== SEP) notSep++;
        const start = (row.i - row.p) / 2;
        const piece = s.slice(start, start + row.p);
        if (piece !== [...piece].reverse().join("")) outside++;
      }
      return [
        label,
        String(c.m),
        String(c.rows.length),
        String(oddGap),
        String(notSep),
        String(outside),
        oddGap + notSep + outside === 0 ? "지킨다" : "깨진다",
      ];
    });
    return table(
      [
        [
          "입력",
          "m",
          "확인한 걸음",
          "i − p[i] 가 홀수인 걸음",
          "양 끝이 빈 자리가 아닌 걸음",
          "잘라 낸 조각이 회문이 아닌 걸음",
          "판정",
        ],
        ...rows,
      ],
      [1, 2, 3, 4, 5],
    ).join("\n");
  },

  /** invariant ② — 경계 입력. */
  "invariant-edges": () => {
    const rows = [
      ["빈 문자열", ""],
      ["길이 1", "a"],
      ["같은 두 글자", "aa"],
      ["다른 두 글자", "ab"],
      ["같은 글자만", "aaaa"],
      ["다 다른 글자", "abcd"],
      ["홀수 회문 전체", "aba"],
      ["짝수 회문 전체", "abba"],
    ].map(([label, s]) => {
      const str = s as string;
      const c = counted(str);
      return [
        label as string,
        `"${str}"`,
        String(str.length),
        String(c.m),
        `"${longestPalindrome(str)}"`,
        String(longestPalindrome(str).length),
        String(c.cmp),
      ];
    });
    return table(
      [["어느 경계", "입력", "n", "m", "답", "길이", "글자 견주기"], ...rows],
      [2, 3, 5, 6],
    ).join("\n");
  },

  /** invariant ③ — 불변식을 지키던 줄을 바꾸면. */
  "mutant-no-head-sep": () =>
    mutantTable(
      "앞 구분자를 뺀 판",
      noLeadingSep,
      "홀짝이 뒤바뀐 글자",
      (s) => s.length,
    ).join("\n"),

  /** perf.derive — 전개 입력의 계수. */
  "perf-count": () => {
    const c = counted(WALK_S);
    const inside = c.rows.filter((row) => row.inside).length;
    const grew = c.rows.filter((row) => row.grow > 0).length;
    return [
      ...table(
        [
          ["무엇", "값", "어디서 나오는가"],
          [
            "넓힌 문자열의 자리 m",
            String(c.m),
            `2n + 1 이고 n = ${WALK_S.length}`,
          ],
          ["바깥 반복의 걸음", String(c.rows.length), "자리마다 한 번"],
          ["구간 안에서 시작한 자리", String(inside), "물려받기가 실행된 걸음"],
          ["반지름이 실제로 늘어난 자리", String(grew), "견주기가 성공한 걸음"],
          ["늘린 견주기", String(c.grow), "반지름을 하나 늘린 횟수"],
          ["멈춘 견주기", String(c.stop), "글자가 달라 반복이 끝난 횟수"],
          ["글자 견주기 총합", String(c.cmp), "위 둘의 합"],
        ],
        [1],
      ),
      "",
      `같은 길이의 실측 최댓값 4n−6 = ${4 * WALK_S.length - 6} 이고 이 입력은 ${c.cmp} 이다`,
    ].join("\n");
  },

  /** perf.derive — 규모를 네 배씩 키우면 계수도 네 배가 되는가. */
  "perf-sweep": () => {
    const families: [string, (n: number) => string][] = [
      ["같은 글자", same],
      ["번갈이", alternating],
      ["무작위 두 글자", (n) => pseudo(n, 2)],
      ["무작위 스물여섯 글자", (n) => pseudo(n, 26)],
      ["양 끝만 다름", edgesDiffer],
    ];
    const sizes = [1_000, 4_000, 16_000, 64_000];
    const rows: string[][] = [];
    for (const [name, make] of families) {
      let prev = 0;
      for (const n of sizes) {
        const c = countedLite(make(n));
        const total = c.grow + c.stop;
        rows.push([
          name,
          comma(n),
          comma(c.grow),
          comma(c.stop),
          comma(total),
          prev === 0 ? "-" : (total / prev).toFixed(2),
        ]);
        prev = total;
      }
    }
    return [
      ...table(
        [
          ["계열", "n", "늘린 견주기", "멈춘 견주기", "합", "네 배 키운 비"],
          ...rows,
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      "네 배 키운 비가 전부 4 언저리다 — 계수가 n 에 비례한다",
    ].join("\n");
  },

  /** perf.bounds — 최선 케이스의 전수 최솟값. */
  "perf-best": () => {
    const rows = [4, 6, 8, 10, 12].map((n) => {
      let min = Number.POSITIVE_INFINITY;
      const args: string[] = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        let s = "";
        for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
        const c = countedLite(s);
        const total = c.grow + c.stop;
        if (total < min) {
          min = total;
          args.length = 0;
          args.push(s);
        } else if (total === min) args.push(s);
      }
      args.sort();
      return [
        String(n),
        String(2 * n + 1),
        String(min),
        String(2 * n - 1),
        String(args.length),
        `"${args[0]}"`,
      ];
    });
    return [
      ...table(
        [
          [
            "n",
            "m",
            "전수 최솟값",
            "2n−1",
            "최솟값을 낸 문자열 수",
            "그중 사전순 첫 벌",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      "최솟값도 n 에 비례한다 — 넓힌 문자열을 만드는 것만으로 이미 m 칸이다",
    ].join("\n");
  },

  /** perf.worst — 최악을 만드는 입력을 전수로 찾는다. */
  "perf-worst": () => {
    const rows: string[][] = [];
    for (const n of [5, 6, 7, 8, 9, 10]) {
      let mx = -1;
      const args: string[] = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        let s = "";
        for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
        const c = countedLite(s);
        const total = c.grow + c.stop;
        if (total > mx) {
          mx = total;
          args.length = 0;
          args.push(s);
        } else if (total === mx) args.push(s);
      }
      args.sort();
      rows.push([
        String(n),
        String(mx),
        String(4 * n - 6),
        String(args.length),
        `"${args[0]}"`,
      ]);
    }
    const famRows: [string, (n: number) => string][] = [
      ["양 끝만 다름", edgesDiffer],
      ["같은 글자", same],
      ["번갈이", alternating],
      ["다 다른 글자", rolling],
      ["무작위 두 글자", (n) => pseudo(n, 2)],
    ];
    const at = 10_000;
    const fam = famRows.map(([name, make]) => {
      const c = countedLite(make(at));
      return [name, `"${make(8)}"`, comma(c.grow + c.stop)];
    });
    return [
      ...table(
        [
          [
            "n",
            "전수 최댓값",
            "4n−6",
            "최댓값을 낸 문자열 수",
            "그중 사전순 첫 벌",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      ...table(
        [["계열", "n = 8 일 때의 모양", "n = 10,000 의 글자 견주기"], ...fam],
        [2],
      ),
    ].join("\n");
  },
};
