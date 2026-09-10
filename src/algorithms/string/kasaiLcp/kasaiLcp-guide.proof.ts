/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/kasaiLcp/kasaiLcp-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만 낸다.
 * 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * **큰 규모는 기록 없는 사본이 맡는다.** `counted` 는 자리마다 `lcp` 를 통째로 복사하므로
 * `n` 이 10 만이면 그 복사가 실행의 대부분이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { kasaiLcp } from "./kasaiLcp-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[1, 3, 0, 0, 2, 0]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `5,000,050,000` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

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

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 문자열. 여섯 글자이고 접미사 배열은 `suffixArray` 편이 낸 것과 같다.
 *
 * 여섯 갈래를 한 입력에서 전부 실행한다 — 역배열 · 이웃 없음 · 이웃 얻기 · 글자 견주기 ·
 * 기록 · 하나 줄이기. 「글자가 달라 멈춘다」와 「문자열 끝이라 멈춘다」가 둘 다 나오고,
 * 이어받은 `k` 가 실제로 견주기를 줄이는 자리도 둘 있다.
 */
export const WALK_S = "banana";
export const WALK_SA = [5, 3, 1, 0, 4, 2];

/** 본문 여러 자리가 함께 쓰는 작은 입력 여덟. `suffixArray` 편의 멈춤 표와 같은 목록이다. */
export const SMALL: string[] = [
  WALK_S,
  "aaaa",
  "abab",
  "mississippi",
  "abc",
  "aab",
  "cabbage",
  "abracadabra",
];

const CONSTRAINT_N = 100_000;

/* ─────────────────── 접미사 배열 — 입력을 만드는 재료 ─────────────────── */

/**
 * 값이 `[0, span)` 안의 정수인 키로 `order` 를 **안정** 정렬한다.
 *
 * 이 편의 주제가 아니라 입력을 만드는 재료다. `suffixArray` 편이 가르치는 절차와 같은
 * 모양이고, 여기서는 시험용 `sa` 를 얻는 데만 쓴다.
 */
function countingSortBy(
  order: number[],
  key: (i: number) => number,
  span: number,
): number[] {
  const count = new Array<number>(span).fill(0);
  for (const i of order) count[key(i)] = (count[key(i)] as number) + 1;
  for (let v = 1; v < span; v++) {
    count[v] = (count[v] as number) + (count[v - 1] as number);
  }
  const out = new Array<number>(order.length).fill(0);
  for (let p = order.length - 1; p >= 0; p--) {
    const i = order[p] as number;
    const k = key(i);
    count[k] = (count[k] as number) - 1;
    out[count[k] as number] = i;
  }
  return out;
}

const SA_CACHE = new Map<string, number[]>();

/** 문자열의 접미사 배열. 같은 문자열을 여러 블록이 쓰므로 한 번 만든 것을 다시 쓴다. */
export function suffixArrayOf(s: string): number[] {
  const hit = SA_CACHE.get(s);
  if (hit !== undefined) return hit;
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  let span = 128;
  for (let gap = 1; gap < n; gap *= 2) {
    const front = (i: number): number => rank[i] as number;
    const back = (i: number): number =>
      i + gap < n ? (rank[i + gap] as number) + 1 : 0;
    for (const key of [back, front]) sa = countingSortBy(sa, key, span + 1);
    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let p = 1; p < n; p++) {
      const a = sa[p - 1] as number;
      const b = sa[p] as number;
      if (front(a) !== front(b) || back(a) !== back(b)) top++;
      next[b] = top;
    }
    rank = next;
    span = top + 1;
    if (span === n) break;
  }
  SA_CACHE.set(s, sa);
  return sa;
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 자리 하나를 처리한 기록. */
export interface Row {
  i: number;
  /** `inv[i]` — 이 자리가 접미사 배열의 몇 번째 칸인가. */
  rank: number;
  /** 이웃이 시작하는 자리. 이웃이 없으면 `null`. */
  j: number | null;
  /** 이 자리에 들어올 때의 `k`. */
  kIn: number;
  /** 기록한 값. 이웃이 없으면 `null`. */
  wrote: number | null;
  /** 다음 자리로 넘긴 `k`. */
  kOut: number;
  /** 이 자리에서 글자가 같음을 확인한 횟수. */
  matched: number;
  /** 왜 멈췄는가. */
  why: string;
  /** 이 자리가 쓴 배열 칸 접근. */
  cells: number;
  /** 자리를 처리한 뒤의 `lcp`. */
  snapshot: number[];
}

export interface Counts {
  lcp: number[];
  /** 글자가 같음을 확인한 비교 — `k` 가 하나 늘어난 횟수와 같다. */
  match: number;
  /** 글자가 달라 반복을 멈춘 비교. 문자열 끝이라 멈춘 자리는 글자를 안 읽는다. */
  stop: number;
  /** 배열 칸 읽기·쓰기. 글자 읽기는 빼고 센다. */
  cells: number;
  rows: Row[];
}

/**
 * 정본과 같은 절차에 세는 자리만 덧붙인 사본.
 *
 * `drop` 은 기록 뒤에 `k` 에서 빼는 양이다. **정본은 `drop = 1`** 이고, 그 밖의 값은
 * `deep.build` 의 마지막 걸음이 「하필 1 인 이유」를 값으로 내는 데 쓴다.
 */
export function counted(s: string, sa: number[], drop = 1): Counts {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  const inv = new Array<number>(n).fill(0);
  let cells = 0;
  for (let r = 0; r < n; r++) {
    inv[sa[r] as number] = r;
    cells += 2;
  }

  const rows: Row[] = [];
  let match = 0;
  let stop = 0;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const rank = inv[i] as number;
    cells++;
    let here = 1;
    const kIn = k;
    if (rank === n - 1) {
      k = 0;
      rows.push({
        i,
        rank,
        j: null,
        kIn,
        wrote: null,
        kOut: k,
        matched: 0,
        why: "이웃이 없다",
        cells: here,
        snapshot: lcp.slice(),
      });
      continue;
    }
    const j = sa[rank + 1] as number;
    cells++;
    here++;
    let matched = 0;
    let why = "";
    for (;;) {
      if (i + k >= n || j + k >= n) {
        why = "문자열 끝을 넘었다";
        break;
      }
      if (s[i + k] !== s[j + k]) {
        stop++;
        why = "글자가 다르다";
        break;
      }
      match++;
      matched++;
      k++;
    }
    lcp[rank] = k;
    cells += 2;
    here += 2;
    const wrote = k;
    if (k > 0) k = Math.max(0, k - drop);
    rows.push({
      i,
      rank,
      j,
      kIn,
      wrote,
      kOut: k,
      matched,
      why,
      cells: here,
      snapshot: lcp.slice(),
    });
  }
  return { lcp, match, stop, cells, rows };
}

/**
 * 자리마다의 `lcp` 사본을 남기지 않는 계수 사본.
 *
 * `counted` 는 자리마다 `lcp` 를 통째로 복사하므로 `n` 이 10 만이면 그 복사가 실행의
 * 대부분이 된다. 큰 규모에서 **계수만** 필요한 자리는 이쪽을 쓴다 — 절차는 같고 기록만 뺐다.
 */
export function countedLite(
  s: string,
  sa: number[],
  drop = 1,
): { lcp: number[]; match: number; stop: number; cells: number } {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  const inv = new Array<number>(n).fill(0);
  let cells = 0;
  for (let r = 0; r < n; r++) {
    inv[sa[r] as number] = r;
    cells += 2;
  }
  let match = 0;
  let stop = 0;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const rank = inv[i] as number;
    cells++;
    if (rank === n - 1) {
      k = 0;
      continue;
    }
    const j = sa[rank + 1] as number;
    cells++;
    for (;;) {
      if (i + k >= n || j + k >= n) break;
      if (s[i + k] !== s[j + k]) {
        stop++;
        break;
      }
      match++;
      k++;
    }
    lcp[rank] = k;
    cells += 2;
    if (k > 0) k = Math.max(0, k - drop);
  }
  return { lcp, match, stop, cells };
}

/** 접미사 배열 순서대로 짝마다 `k = 0` 에서 다시 세는 방법. 자리를 이어받지 않는다. */
export function pairwise(
  s: string,
  sa: number[],
): { lcp: number[]; match: number; stop: number; cells: number } {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  let match = 0;
  let stop = 0;
  let cells = 0;
  for (let r = 0; r + 1 < n; r++) {
    const a = sa[r] as number;
    const b = sa[r + 1] as number;
    cells += 2;
    let k = 0;
    for (;;) {
      if (a + k >= n || b + k >= n) break;
      if (s[a + k] !== s[b + k]) {
        stop++;
        break;
      }
      match++;
      k++;
    }
    lcp[r] = k;
    cells++;
  }
  return { lcp, match, stop, cells };
}

/**
 * 자리 순서로 순회하되 **이어받지 않고** 자리마다 `k = 0` 에서 다시 세는 방법.
 *
 * 「순서만 바꾸면 되는가」를 값으로 반박하는 데 쓴다 — 순서를 바꿔도 이어받기가 없으면
 * 견주는 글자 수가 짝마다 다시 세는 것과 같다.
 */
export function textOrderFresh(
  s: string,
  sa: number[],
): { lcp: number[]; match: number; stop: number; cells: number } {
  return countedLite(s, sa, s.length + 1);
}

/** 자리 `i` 의 진짜 공통 앞부분 길이. 정의를 그대로 옮긴 것이라 계수를 안 센다. */
export function trueLcpAt(s: string, sa: number[], i: number): number | null {
  const n = s.length;
  const inv = new Array<number>(n).fill(0);
  for (let r = 0; r < n; r++) inv[sa[r] as number] = r;
  const rank = inv[i] as number;
  if (rank === n - 1) return null;
  const j = sa[rank + 1] as number;
  let k = 0;
  while (i + k < n && j + k < n && s[i + k] === s[j + k]) k++;
  return k;
}

/* ────────────────────────── 입력 생성식 ────────────────────────── */

/** 같은 글자 `n` 개. */
export const same = (n: number): string => "a".repeat(n);

/** 두 글자가 번갈아 나오는 문자열. */
export const alternating = (n: number): string =>
  "ab".repeat(Math.ceil(n / 2)).slice(0, n);

/** 앞이 다 같고 끝 한 글자만 다른 문자열. */
export const tailDiffers = (n: number): string => `${"a".repeat(n - 1)}b`;

/** 주기가 `p` 인 되풀이 문자열. 주기 안의 글자는 생성식으로 고정한다. */
export const periodic = (n: number, p: number): string => {
  const unit = Array.from({ length: p }, (_, i) =>
    String.fromCharCode(97 + ((i * 7 + 3) % 3)),
  ).join("");
  return unit.repeat(Math.ceil(n / p)).slice(0, n);
};

/** mulberry32 난수로 만든 알파벳 `sigma` 글자짜리 문자열. 씨앗을 고정한다. */
export function randomString(n: number, sigma: number, seed0: number): string {
  let seed = seed0;
  const next = (): number => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(String.fromCharCode(97 + Math.floor(next() * sigma)));
  }
  return out.join("");
}

/**
 * 피보나치 문자열 — `f(1) = "b"`, `f(2) = "a"`, `f(k) = f(k-1) + f(k-2)`.
 *
 * 되풀이 주기가 하나로 정해지지 않는 문자열이라 「주기가 짧으면 최악」이라는 통념을 시험하는
 * 데 쓴다.
 */
export function fibonacciWord(n: number): string {
  let a = "b";
  let b = "a";
  while (b.length < n) {
    const c = b + a;
    a = b;
    b = c;
  }
  return b.slice(0, n);
}

/** 글자가 오름차순으로 늘어선 문자열. */
export const ascending = (n: number): string =>
  Array.from({ length: n }, (_, i) => String.fromCharCode(97 + (i % 26))).join(
    "",
  );

/* ────────────────────────── 자기대조 ────────────────────────── */

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs = [...SMALL, "a", "aa", "ab", "ba", periodic(30, 6)];
  for (const s of inputs) {
    const sa = suffixArrayOf(s);
    const ref = show(kasaiLcp(s, sa));
    if (show(counted(s, sa).lcp) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(countedLite(s, sa).lcp) !== ref) {
      throw new Error("기록 없는 사본이 정본과 다른 답을 낸다");
    }
    if (show(pairwise(s, sa).lcp) !== ref) {
      throw new Error("짝마다 다시 세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(textOrderFresh(s, sa).lcp) !== ref) {
      throw new Error("이어받지 않는 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./kasaiLcp-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  kasaiLcp(s: string, sa: number[]): number[];
}

/** 역배열을 반대 방향으로 채운 사본 — 「순위 → 자리」를 「자리 → 순위」 자리에 넣는다. */
const invFlipped = await loadMutant<Impl>(REF, {
  swap: [/inv\[sa\[r\] as number\] = r;/, "inv[r] = sa[r] as number;"],
});

/** 답을 순위 칸이 아니라 자리 칸에 적은 사본. */
const textOrderWrite = await loadMutant<Impl>(REF, {
  swap: [/lcp\[inv\[i\] as number\] = k;/, "lcp[i] = k;"],
});

/** 이웃이 없는 자리에서 `k` 를 0 으로 되돌리는 줄을 뺀 사본. */
const noReset = await loadMutant<Impl>(REF, {
  drop: /^\s+k = 0;$/,
});

/** **불변식을 지키던 줄** 하나 — 기록 뒤에 `k` 를 하나 줄이는 줄을 뺀 사본. */
const noDecrement = await loadMutant<Impl>(REF, {
  drop: /if \(k > 0\) k--;/,
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = invFlipped.kasaiLcp === kasaiLcp;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
// `noReset` 은 여기 넣지 않는다 — **어느 입력에서도 답을 안 바꾸는 것**이 그 변이의 결론이고,
// 그 사실 자체를 멈춤 하나가 값으로 보인다.
if (!중화됨) {
  for (const [label, impl] of [
    ["역배열을 반대로 채운 판", invFlipped],
    ["자리 칸에 적은 판", textOrderWrite],
    ["하나 줄이기를 뺀 판", noDecrement],
  ] as [string, Impl][]) {
    const same = SMALL.every((s) => {
      const sa = suffixArrayOf(s);
      return show(kasaiLcp(s, sa)) === show(impl.kasaiLcp(s, sa));
    });
    if (same)
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

/** 변이 하나를 작은 입력 여덟에 걸어 정본과 나란히 놓는다. */
function mutantTable(head: string, impl: Impl): string[] {
  const rows = SMALL.map((s) => {
    const sa = suffixArrayOf(s);
    const a = show(kasaiLcp(s, sa));
    const b = show(impl.kasaiLcp(s, sa));
    const label = s === WALK_S ? `전개 입력 "${s}"` : `"${s}"`;
    return [label, a, b, a === b ? "같다" : "어긋난다"];
  });
  return table([["입력", "정본", head, "판정"], ...rows]);
}

/* ────────────────────────── 블록 ────────────────────────── */

const LABELS = ["①", "②", "③", "④", "⑤", "⑥"];

export const PROOFS: Record<string, () => string> = {
  /** concept — 전개 입력의 접미사와 답을 한 표로. */
  "concept-lcp-table": () => {
    const sa = WALK_SA;
    const n = WALK_S.length;
    const lcp = kasaiLcp(WALK_S, sa);
    const rows = sa.map((start, r) => [
      `sa[${r}]`,
      String(start),
      WALK_S.slice(start),
      r + 1 < n ? WALK_S.slice(sa[r + 1] as number) : "이웃이 없다",
      String(lcp[r]),
    ]);
    return table(
      [["칸", "시작 자리", "접미사", "이웃", "공통 앞부분 길이"], ...rows],
      [1, 4],
    ).join("\n");
  },

  /** concept — 짝마다 처음부터 견주면 제약 규모에서 몇 번이 되는가. */
  "concept-naive-cost": () => {
    const rows = [6, 12, 100, 1_000, 10_000].map((n) => {
      const s = same(n);
      const sa = suffixArrayOf(s);
      const p = pairwise(s, sa);
      return [comma(n), comma(p.match + p.stop), comma((n * (n - 1)) / 2)];
    });
    return [
      ...table(
        [["n", "같은 글자만 있을 때의 글자 견주기", "n(n−1)/2"], ...rows],
        [0, 1, 2],
      ),
      "",
      `제약 최댓값 n = ${comma(CONSTRAINT_N)} 에서 n(n−1)/2 = ${comma(
        (CONSTRAINT_N * (CONSTRAINT_N - 1)) / 2,
      )} 번이다`,
      "1 초 안에 끝나는 규모가 아니다",
    ].join("\n");
  },

  /** deep.build ③ — 짝마다 다시 세면 같은 글자를 몇 번씩 다시 읽는가. */
  "build-repeat": () => {
    const s = "aaaa";
    const sa = suffixArrayOf(s);
    const n = s.length;
    const rows: string[][] = [];
    for (let r = 0; r + 1 < n; r++) {
      const a = sa[r] as number;
      const b = sa[r + 1] as number;
      let k = 0;
      while (a + k < n && b + k < n && s[a + k] === s[b + k]) k++;
      rows.push([
        `sa[${r}] · sa[${r + 1}]`,
        `"${s.slice(a)}"`,
        `"${s.slice(b)}"`,
        String(k),
        String(k),
      ]);
    }
    const p = pairwise(s, sa);
    const readCount = new Array<number>(n).fill(0);
    for (let r = 0; r + 1 < n; r++) {
      const a = sa[r] as number;
      const b = sa[r + 1] as number;
      let k = 0;
      while (a + k < n && b + k < n && s[a + k] === s[b + k]) {
        readCount[a + k] = (readCount[a + k] as number) + 1;
        readCount[b + k] = (readCount[b + k] as number) + 1;
        k++;
      }
    }
    return [
      `s = "${s}" · sa = ${show(sa)}`,
      "",
      ...table(
        [
          [
            "견주는 두 칸",
            "앞 접미사",
            "뒤 접미사",
            "같은 글자",
            "공통 앞부분",
          ],
          ...rows,
        ],
        [3, 4],
      ),
      "",
      ...table(
        [
          ["자리", ...Array.from({ length: n }, (_, x) => String(x))],
          ["그 글자를 읽은 횟수", ...readCount.map(String)],
        ],
        Array.from({ length: n + 1 }, (_, x) => x + 1),
      ),
      "",
      `같은 글자를 확인한 견주기 ${p.match} 번 · 글자가 달라 멈춘 견주기 ${p.stop} 번`,
    ].join("\n");
  },

  /** deep.build ④ — 같은 입력을 세 방식으로 처리하고 실제 계수를 나란히 놓는다. */
  "build-two-orders": () => {
    const inputs: [string, string][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S],
      ['"aaaa"', "aaaa"],
      ['"mississippi"', "mississippi"],
      [`같은 글자 n = 1,000`, same(1_000)],
      [`무작위 두 글자 n = 1,000`, randomString(1_000, 2, 20260905)],
    ];
    const rows = inputs.flatMap(([label, s]) => {
      const sa = suffixArrayOf(s);
      const p = pairwise(s, sa);
      const f = textOrderFresh(s, sa);
      const c = countedLite(s, sa);
      return [
        [
          label,
          "접미사 배열 순서 · 짝마다 0 부터",
          comma(p.match),
          comma(p.stop),
          comma(p.match + p.stop),
        ],
        [
          label,
          "자리 순서 · 자리마다 0 부터",
          comma(f.match),
          comma(f.stop),
          comma(f.match + f.stop),
        ],
        [
          label,
          "자리 순서 · k 를 이어받는다",
          comma(c.match),
          comma(c.stop),
          comma(c.match + c.stop),
        ],
      ];
    });
    return table(
      [
        [
          "입력",
          "처리 방식",
          "같은 글자 확인",
          "글자가 달라 멈춤",
          "글자 견주기 합",
        ],
        ...rows,
      ],
      [2, 3, 4],
    ).join("\n");
  },

  /** deep.build ⑤ — 이어받은 값이 진짜 값을 넘지 않는지 자리마다 확인한다. */
  "build-carry": () => {
    const c = counted(WALK_S, WALK_SA);
    const rows = c.rows.map((r) => {
      const truth = trueLcpAt(WALK_S, WALK_SA, r.i);
      return [
        String(r.i),
        String(r.rank),
        r.j === null ? "없다" : String(r.j),
        String(r.kIn),
        truth === null ? "없다" : String(truth),
        truth === null
          ? "견줄 짝이 없다"
          : r.kIn <= truth
            ? "넘지 않는다"
            : "넘는다",
        String(r.matched),
      ];
    });
    return [
      ...table(
        [
          [
            "자리 i",
            "inv[i]",
            "이웃 j",
            "이어받은 k",
            "진짜 값",
            "판정",
            "늘린 횟수",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4, 6],
      ),
      "",
      `이어받기가 없앤 견주기 ${c.rows.reduce((t, r) => t + r.kIn, 0)} 번`,
      `늘린 횟수의 합 ${c.match} · 글자가 달라 멈춘 횟수 ${c.stop}`,
    ].join("\n");
  },

  /** deep.build ⑥ — 기록 뒤에 얼마를 빼야 하는가를 값으로 낸다. */
  "build-drop": () => {
    const inputs: [string, string][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S],
      ['"mississippi"', "mississippi"],
      [`같은 글자 n = 1,000`, same(1_000)],
      [`무작위 두 글자 n = 1,000`, randomString(1_000, 2, 20260905)],
    ];
    const drops = [0, 1, 2, 3];
    const rows: string[][] = [];
    for (const [label, s] of inputs) {
      const sa = suffixArrayOf(s);
      const truth = show(kasaiLcp(s, sa));
      for (const d of drops) {
        const c = countedLite(s, sa, d);
        rows.push([
          label,
          String(d),
          show(c.lcp) === truth ? "예" : "아니오",
          comma(c.match + c.stop),
        ]);
      }
      const zero = countedLite(s, sa, s.length + 1);
      rows.push([
        label,
        "전부",
        show(zero.lcp) === truth ? "예" : "아니오",
        comma(zero.match + zero.stop),
      ]);
    }
    return [
      ...table(
        [["입력", "기록 뒤에 빼는 양", "답이 맞는가", "글자 견주기"], ...rows],
        [1, 3],
      ),
      "",
      "빼는 양이 0 이면 답이 맞지 않고, 1 보다 크면 답은 맞으면서 견주기가 는다",
    ].join("\n");
  },

  /** deep.walk T1 — 역배열을 만든다. */
  "walk-inv": () => {
    const n = WALK_S.length;
    const inv = new Array<number>(n).fill(0);
    for (let r = 0; r < n; r++) inv[WALK_SA[r] as number] = r;
    const rows = Array.from({ length: n }, (_, i) => [
      String(i),
      WALK_S[i] as string,
      WALK_S.slice(i),
      String(inv[i]),
      String(WALK_SA[i]),
    ]);
    return [
      ...table(
        [["자리 i", "s[i]", "접미사 s[i..]", "inv[i]", "sa[i]"], ...rows],
        [0, 3, 4],
      ),
      "",
      `sa  = ${show(WALK_SA)}`,
      `inv = ${show(inv)}`,
      `inv[sa[r]] = r 이 여섯 칸에서 모두 맞는가  ${
        WALK_SA.every((v, r) => inv[v] === r) ? "예" : "아니오"
      }`,
    ].join("\n");
  },

  /** deep.walk T2~T4 — 앞의 세 자리. */
  "walk-early": () => {
    const c = counted(WALK_S, WALK_SA);
    const rows = c.rows
      .slice(0, 3)
      .map((r, idx) => [
        `T${idx + 2}`,
        String(r.i),
        String(r.rank),
        r.j === null ? "없다" : String(r.j),
        String(r.kIn),
        r.wrote === null ? "적지 않는다" : `lcp[${r.rank}] = ${r.wrote}`,
        r.why,
        show(r.snapshot),
      ]);
    return table(
      [
        [
          "걸음",
          "자리 i",
          "inv[i]",
          "이웃 j",
          "들어올 때 k",
          "기록",
          "멈춘 이유",
          "lcp",
        ],
        ...rows,
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** deep.walk T5 — 글자가 같은 동안 k 를 늘린다. */
  "walk-extend": () => {
    const i = 3;
    const n = WALK_S.length;
    const inv = new Array<number>(n).fill(0);
    for (let r = 0; r < n; r++) inv[WALK_SA[r] as number] = r;
    const j = WALK_SA[(inv[i] as number) + 1] as number;
    const rows: string[][] = [];
    let k = 0;
    for (;;) {
      if (i + k >= n || j + k >= n) {
        rows.push([
          String(k),
          `s[${i + k}]`,
          i + k < n ? (WALK_S[i + k] as string) : "없다",
          `s[${j + k}]`,
          j + k < n ? (WALK_S[j + k] as string) : "없다",
          "문자열 끝을 넘어 멈춘다",
        ]);
        break;
      }
      const same = WALK_S[i + k] === WALK_S[j + k];
      rows.push([
        String(k),
        `s[${i + k}]`,
        WALK_S[i + k] as string,
        `s[${j + k}]`,
        WALK_S[j + k] as string,
        same ? "같다 — k 를 하나 늘린다" : "다르다 — 멈춘다",
      ]);
      if (!same) break;
      k++;
    }
    return [
      `i = ${i} 의 접미사 "${WALK_S.slice(i)}" · 이웃 j = ${j} 의 접미사 "${WALK_S.slice(j)}"`,
      "",
      ...table(
        [["k", "앞 자리", "글자", "뒤 자리", "글자", "판정"], ...rows],
        [0],
      ),
      "",
      `이 자리가 적는 값        lcp[${inv[i]}] = ${k}`,
      `다음 자리로 넘기는 값    k = ${Math.max(0, k - 1)}`,
    ].join("\n");
  },

  /** deep.walk — 고정 입력을 끝까지 실행한 걸음별 상태. */
  "walk-trace": () => {
    const c = counted(WALK_S, WALK_SA);
    const n = WALK_S.length;
    const inv = new Array<number>(n).fill(0);
    for (let r = 0; r < n; r++) inv[WALK_SA[r] as number] = r;
    const rows: string[][] = [
      [
        "T1",
        "-",
        "-",
        "-",
        "0",
        "역배열을 만든다",
        show(new Array<number>(n).fill(0)),
      ],
    ];
    for (const [idx, r] of c.rows.entries()) {
      rows.push([
        `T${idx + 2}`,
        String(r.i),
        String(r.rank),
        r.j === null ? "-" : String(r.j),
        String(r.kIn),
        r.wrote === null
          ? "이웃이 없어 건너뛴다"
          : `${r.matched} 번 늘려 lcp[${r.rank}] = ${r.wrote}`,
        show(r.snapshot),
      ]);
    }
    rows.push([
      `T${c.rows.length + 2}`,
      "-",
      "-",
      "-",
      "-",
      "답을 돌려준다",
      show(c.lcp),
    ]);
    return [
      ...table(
        [
          [
            "걸음",
            "자리 i",
            "inv[i]",
            "이웃 j",
            "들어올 때 k",
            "이 걸음이 한 일",
            "lcp",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      `같은 글자 확인 ${c.match} 번 · 글자가 달라 멈춤 ${c.stop} 번 · 배열 칸 접근 ${c.cells} 번`,
    ].join("\n");
  },

  /** deep.walk — 여섯 갈래가 어느 입력에서 몇 번 실행됐는가. */
  "walk-branch": () => {
    const inputs: [string, string, number[]][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S, WALK_SA],
      ['"mississippi"', "mississippi", suffixArrayOf("mississippi")],
    ];
    const counts = inputs.map(([, s, sa]) => {
      const c = counted(s, sa);
      const skipped = c.rows.filter((r) => r.j === null).length;
      const handled = c.rows.length - skipped;
      return [
        1,
        skipped,
        handled,
        c.match,
        handled,
        c.rows.filter((r) => r.wrote !== null && r.wrote > 0).length,
      ];
    });
    const what = [
      "역배열을 만든다",
      "이웃이 없어 건너뛴다",
      "이웃의 자리를 얻는다",
      "글자가 같아 k 를 늘린다",
      "순위 칸에 답을 적는다",
      "k 를 하나 줄여 넘긴다",
    ];
    const rows = LABELS.map((mark, idx) => [
      mark,
      what[idx] as string,
      comma((counts[0] as number[])[idx] as number),
      comma((counts[1] as number[])[idx] as number),
    ]);
    return table(
      [
        ["갈래", "무엇", inputs[0]?.[0] as string, inputs[1]?.[0] as string],
        ...rows,
      ],
      [2, 3],
    ).join("\n");
  },

  /** 멈춤 1 — 역배열을 반대 방향으로 채우면. */
  "pause-inv-flip": () =>
    mutantTable("역배열을 반대로 채운 판", invFlipped).join("\n"),

  /** 멈춤 1 — 역배열이 `sa` 자신과 같아지는 입력이 어느 것인가. */
  "pause-inv-same": () => {
    const rows = SMALL.map((s) => {
      const sa = suffixArrayOf(s);
      const n = s.length;
      const inv = new Array<number>(n).fill(0);
      for (let r = 0; r < n; r++) inv[sa[r] as number] = r;
      return [
        s === WALK_S ? `전개 입력 "${s}"` : `"${s}"`,
        show(sa),
        show(inv),
        show(sa) === show(inv) ? "예" : "아니오",
      ];
    });
    return table([["입력", "sa", "inv", "두 배열이 같은가"], ...rows]).join(
      "\n",
    );
  },

  /** 멈춤 2 — 역배열이 항등이라 자리 번호와 칸 번호가 같아지는 입력이 어느 것인가. */
  "pause-identity": () => {
    const rows = SMALL.map((s) => {
      const sa = suffixArrayOf(s);
      const n = s.length;
      const inv = new Array<number>(n).fill(0);
      for (let r = 0; r < n; r++) inv[sa[r] as number] = r;
      return [
        s === WALK_S ? `전개 입력 "${s}"` : `"${s}"`,
        show(inv),
        inv.every((v, x) => v === x) ? "예" : "아니오",
      ];
    });
    return table([
      ["입력", "inv", "inv[i] = i 가 모든 자리에서 성립하는가"],
      ...rows,
    ]).join("\n");
  },

  /** 멈춤 2 — 답을 자리 칸에 적으면. */
  "pause-text-order": () =>
    mutantTable("자리 칸에 적은 판", textOrderWrite).join("\n"),

  /** 멈춤 3 — 이웃이 없는 자리의 되돌리기를 빼면. */
  "pause-reset": () => mutantTable("되돌리기를 뺀 판", noReset).join("\n"),

  /** 멈춤 3 — 되돌리기 갈래에 들어갈 때 `k` 가 이미 0 인지 전수로 확인한다. */
  "pause-reset-why": () => {
    const inputs: [string, string][] = [
      ...(SMALL.map((s) => [
        s === WALK_S ? `전개 입력 "${s}"` : `"${s}"`,
        s,
      ]) as [string, string][]),
      [`같은 글자 n = 1,000`, same(1_000)],
      [`무작위 두 글자 n = 1,000`, randomString(1_000, 2, 20260905)],
      [`무작위 26 글자 n = 1,000`, randomString(1_000, 26, 20260905)],
      [`주기 6 되풀이 n = 1,000`, periodic(1_000, 6)],
    ];
    const rows = inputs.map(([label, s]) => {
      const sa = suffixArrayOf(s);
      const c = counted(s, sa);
      const hit = c.rows.filter((r) => r.j === null);
      const worst = Math.max(...hit.map((r) => r.kIn));
      return [
        label,
        comma(s.length),
        String(hit.length),
        String(worst),
        worst === 0 ? "0 이다" : "0 이 아니다",
      ];
    });
    return [
      ...table(
        [
          [
            "입력",
            "n",
            "되돌리기 갈래에 들어간 횟수",
            "그때 k 의 최댓값",
            "판정",
          ],
          ...rows,
        ],
        [1, 2, 3],
      ),
      "",
      "들어간 횟수가 1 인 것은 재 본 결과가 아니라 정해진 것이다 — inv 가 sa 의 역이라",
      "값 n−1 을 가지는 자리가 언제나 하나뿐이다. 재서 확인한 것은 그때의 k 가 0 이라는 쪽이다",
    ].join("\n");
  },

  /** related — 두 배열이 서로의 역인지 왕복으로 확인한다. */
  "related-inverse": () => {
    const n = WALK_S.length;
    const inv = new Array<number>(n).fill(0);
    for (let r = 0; r < n; r++) inv[WALK_SA[r] as number] = r;
    const rows = Array.from({ length: n }, (_, x) => [
      String(x),
      String(WALK_SA[x]),
      String(inv[WALK_SA[x] as number]),
      String(inv[x]),
      String(WALK_SA[inv[x] as number]),
    ]);
    return [
      ...table(
        [["x", "sa[x]", "inv[sa[x]]", "inv[x]", "sa[inv[x]]"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      `셋째 열과 다섯째 열이 첫째 열과 같은가  ${
        rows.every((r) => r[0] === r[2] && r[0] === r[4]) ? "예" : "아니오"
      }`,
    ].join("\n");
  },

  /** deep.math — 정의를 전개 입력의 값에 넣어 검산한다. */
  "math-check": () => {
    const c = counted(WALK_S, WALK_SA);
    const rows = c.rows.map((r) => {
      const truth = trueLcpAt(WALK_S, WALK_SA, r.i);
      const prev = r.i === 0 ? null : trueLcpAt(WALK_S, WALK_SA, r.i - 1);
      return [
        String(r.i),
        truth === null ? "없다" : String(truth),
        prev === null ? "-" : String(prev),
        prev === null || truth === null
          ? "-"
          : truth >= prev - 1
            ? "맞다"
            : "어긋난다",
        String(r.kIn),
      ];
    });
    const lcp = kasaiLcp(WALK_S, WALK_SA);
    return [
      ...table(
        [
          ["자리 i", "h(i)", "h(i−1)", "h(i) ≥ h(i−1) − 1", "이어받은 k"],
          ...rows,
        ],
        [0, 1, 2, 4],
      ),
      "",
      `h 를 순위 순서로 다시 늘어놓으면  ${show(WALK_SA.map((i) => trueLcpAt(WALK_S, WALK_SA, i) ?? 0))}`,
      `정본이 낸 답                      ${show(lcp)}`,
    ].join("\n");
  },

  /** deep.math — 망원합의 상한을 실측과 나란히 놓는다. */
  "math-telescope": () => {
    const inputs: [string, string][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S],
      ['"mississippi"', "mississippi"],
      [`같은 글자 n = 1,000`, same(1_000)],
      [`두 글자 번갈아 n = 1,000`, alternating(1_000)],
      [`피보나치 n = 1,000`, fibonacciWord(1_000)],
      [`무작위 두 글자 n = 1,000`, randomString(1_000, 2, 20260905)],
      [`무작위 26 글자 n = 1,000`, randomString(1_000, 26, 20260905)],
    ];
    const rows = inputs.map(([label, s]) => {
      const sa = suffixArrayOf(s);
      const c = countedLite(s, sa);
      const n = s.length;
      return [
        label,
        comma(n),
        comma(c.match),
        comma(c.stop),
        comma(c.match + c.stop),
        comma(2 * n - 2),
        ((c.match + c.stop) / (2 * n - 2)).toFixed(3),
      ];
    });
    return table(
      [
        [
          "입력",
          "n",
          "같은 글자 확인 (상한 n−1)",
          "달라서 멈춤 (상한 n−1)",
          "합",
          "상한 2n−2",
          "그 비",
        ],
        ...rows,
      ],
      [1, 2, 3, 4, 5, 6],
    ).join("\n");
  },

  /** deep.math — 결과식에 제약 규모를 넣는다. */
  "math-scale": () => {
    const rows = [1_000, 10_000, CONSTRAINT_N].map((n) => [
      comma(n),
      comma(2 * n - 2),
      comma((n * (n - 1)) / 2),
      comma(Math.round((n * (n - 1)) / 2 / (2 * n - 2))),
    ]);
    return [
      ...table(
        [
          [
            "n",
            "이 절차의 상한 2n−2",
            "짝마다 다시 세는 방법의 최악 n(n−1)/2",
            "몇 배",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      `제약 최댓값 n = ${comma(CONSTRAINT_N)} 에서 글자 견주기는 ${comma(2 * CONSTRAINT_N - 2)} 번을 넘지 않는다`,
    ].join("\n");
  },

  /** 불변식 — 자리마다 들어올 때의 k 가 진짜 값 이하인지 확인한다. */
  "invariant-watch": () => {
    const inputs: [string, string][] = [
      [`전개 입력 "${WALK_S}"`, WALK_S],
      ['"aaaa"', "aaaa"],
      ['"mississippi"', "mississippi"],
      ['"abracadabra"', "abracadabra"],
      [`피보나치 n = 500`, fibonacciWord(500)],
      [`무작위 두 글자 n = 500`, randomString(500, 2, 20260905)],
    ];
    const rows = inputs.map(([label, s]) => {
      const sa = suffixArrayOf(s);
      const c = counted(s, sa);
      let ok = true;
      let tight = 0;
      for (const r of c.rows) {
        const truth = trueLcpAt(s, sa, r.i);
        if (truth === null) {
          if (r.kIn !== 0) ok = false;
          continue;
        }
        if (r.kIn > truth) ok = false;
        if (r.kIn === truth) tight++;
      }
      return [
        label,
        comma(s.length),
        comma(c.rows.length),
        comma(tight),
        ok ? "지킨다" : "어긋난다",
      ];
    });
    return table(
      [
        [
          "입력",
          "n",
          "확인한 자리",
          "이어받은 값이 진짜 값과 같은 자리",
          "판정",
        ],
        ...rows,
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 불변식 — 경계 입력을 정본에 그대로 걸어 본다. */
  "invariant-edges": () => {
    const cases: [string, string][] = [
      ["길이 1", "a"],
      ["두 글자가 같다", "aa"],
      ["두 글자가 다르다", "ab"],
      ["뒤가 앞보다 작다", "ba"],
      ["전부 같은 글자", "aaaa"],
      ["전부 다른 글자", "abcd"],
      ["되풀이", "abab"],
      ["앞이 같고 끝만 다르다", "aaab"],
    ];
    const rows = cases.map(([label, s]) => {
      const sa = suffixArrayOf(s);
      const c = counted(s, sa);
      return [
        label,
        `"${s}"`,
        show(sa),
        show(c.lcp),
        String(c.lcp[c.lcp.length - 1]),
        comma(c.match + c.stop),
      ];
    });
    return table(
      [["경계", "입력", "sa", "답", "마지막 칸", "글자 견주기"], ...rows],
      [4, 5],
    ).join("\n");
  },

  /** 불변식 — 기록 뒤에 하나 줄이는 줄을 뺀 변이. */
  "mutant-no-decrement": () =>
    mutantTable("하나 줄이기를 뺀 판", noDecrement).join("\n"),

  /** perf.derive — 전개의 걸음마다 무엇을 몇 번 셌는가. */
  "perf-count": () => {
    const c = counted(WALK_S, WALK_SA);
    const rows = c.rows.map((r, idx) => [
      `T${idx + 2}`,
      String(r.i),
      String(r.matched),
      r.why === "글자가 다르다" ? "1" : "0",
      String(r.cells),
    ]);
    const stopped = c.rows.filter((r) => r.why === "글자가 다르다").length;
    const cellsInLoop = c.rows.reduce((t, r) => t + r.cells, 0);
    return [
      ...table(
        [
          ["걸음", "자리 i", "같은 글자 확인", "달라서 멈춤", "배열 칸 접근"],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      `역배열을 만드는 데 배열 칸 접근 ${2 * WALK_S.length} 번`,
      `바깥 반복의 배열 칸 접근 ${cellsInLoop} 번 · 합 ${c.cells} 번`,
      `글자 견주기는 같은 글자 확인 ${c.match} 번 + 달라서 멈춤 ${stopped} 번 = ${c.match + stopped} 번`,
    ].join("\n");
  },

  /** perf.bounds — 입력 모양을 바꿔도 계수가 n 에 비례하는가. */
  "perf-shapes": () => {
    const shapes: [string, (n: number) => string][] = [
      ["전부 같은 글자", same],
      ["두 글자가 번갈아 나온다", alternating],
      ["앞이 다 같고 끝만 다르다", tailDiffers],
      ["주기 6 되풀이", (n) => periodic(n, 6)],
      ["피보나치 문자열", fibonacciWord],
      ["무작위 두 글자", (n) => randomString(n, 2, 20260905)],
      ["무작위 26 글자", (n) => randomString(n, 26, 20260905)],
      ["글자가 오름차순", ascending],
    ];
    const rows = shapes.map(([label, make]) => {
      const n = 10_000;
      const s = make(n);
      const sa = suffixArrayOf(s);
      const c = countedLite(s, sa);
      const total = c.match + c.stop;
      return [
        label,
        comma(c.match),
        comma(c.stop),
        comma(total),
        (total / n).toFixed(3),
        comma(c.cells),
      ];
    });
    return [
      ...table(
        [
          [
            "입력 모양 (n = 10,000)",
            "같은 글자 확인",
            "달라서 멈춤",
            "글자 견주기",
            "그 값 / n",
            "배열 칸 접근",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      "배열 칸 접근은 모양과 상관없이 같다 — 바깥 반복이 자리마다 정해진 횟수만 접근한다",
    ].join("\n");
  },

  /** perf.worst — 글자 견주기를 가장 많이 만드는 모양을 실제로 찾는다. */
  "worst-shape": () => {
    const shapes: [string, (n: number) => string][] = [
      ["전부 같은 글자", same],
      ["두 글자가 번갈아 나온다", alternating],
      ["앞이 다 같고 끝만 다르다", tailDiffers],
      ["주기 6 되풀이", (n) => periodic(n, 6)],
      ["피보나치 문자열", fibonacciWord],
      ["무작위 두 글자", (n) => randomString(n, 2, 20260905)],
      ["무작위 세 글자", (n) => randomString(n, 3, 20260905)],
      ["무작위 26 글자", (n) => randomString(n, 26, 20260905)],
      ["글자가 오름차순", ascending],
    ];
    const n = CONSTRAINT_N;
    const rows = shapes.map(([label, make]) => {
      const s = make(n);
      const sa = suffixArrayOf(s);
      const c = countedLite(s, sa);
      const total = c.match + c.stop;
      return [
        label,
        comma(c.match),
        comma(c.stop),
        comma(total),
        (total / n).toFixed(3),
      ];
    });
    const best = rows.reduce((a, b) =>
      Number((b[3] ?? "0").replaceAll(",", "")) >
      Number((a[3] ?? "0").replaceAll(",", ""))
        ? b
        : a,
    );
    return [
      ...table(
        [
          [
            `입력 모양 (n = ${comma(n)})`,
            "같은 글자 확인",
            "달라서 멈춤",
            "글자 견주기",
            "그 값 / n",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      `글자 견주기가 가장 많은 모양은 「${best[0]}」 이고 ${best[3]} 번이다`,
      `상한 2n−2 = ${comma(2 * n - 2)} 이므로 그 값은 상한보다 ${comma(
        2 * n - 2 - Number((best[3] ?? "0").replaceAll(",", "")),
      )} 적다`,
    ].join("\n");
  },

  /**
   * perf.worst — 짧은 길이에서는 **모든 문자열을 전수로** 걸어 최댓값을 찾는다.
   *
   * 모양을 손으로 고르면 고른 것 중의 최댓값밖에 안 나온다. 두 글자짜리 알파벳으로 길이
   * 8 부터 14 까지의 문자열 전부를 실행해 상한 2n−2 와 견준다.
   */
  "worst-search": () => {
    const rows: string[][] = [];
    for (let n = 8; n <= 14; n++) {
      let best = -1;
      let winners: string[] = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        let s = "";
        for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
        const c = countedLite(s, suffixArrayOf(s));
        const total = c.match + c.stop;
        if (total > best) {
          best = total;
          winners = [s];
        } else if (total === best) winners.push(s);
      }
      rows.push([
        String(n),
        comma(1 << n),
        comma(best),
        comma(2 * n - 2),
        String(2 * n - 2 - best),
        winners.map((w) => `"${w}"`).join(" · "),
      ]);
    }
    return [
      ...table(
        [
          [
            "n",
            "실행한 문자열",
            "글자 견주기의 최댓값",
            "상한 2n\u22122",
            "차이",
            "그 값을 낸 문자열 전부",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      "전수로 걸어도 상한을 넘는 문자열이 없다",
    ].join("\n");
  },

  /** perf.worst — 규모를 4 배씩 늘리며 성장률을 잰다. */
  "worst-growth": () => {
    const rows = [1_250, 5_000, 20_000, 80_000].map((n) => {
      const s = randomString(n, 2, 20260905);
      const sa = suffixArrayOf(s);
      const c = countedLite(s, sa);
      const total = c.match + c.stop;
      return [comma(n), comma(total), comma(c.cells), (total / n).toFixed(3)];
    });
    const growth: string[] = [];
    for (let idx = 1; idx < rows.length; idx++) {
      const a = Number((rows[idx - 1]?.[1] ?? "0").replaceAll(",", ""));
      const b = Number((rows[idx]?.[1] ?? "0").replaceAll(",", ""));
      growth.push((b / a).toFixed(3));
    }
    return [
      ...table(
        [["n", "글자 견주기", "배열 칸 접근", "글자 견주기 / n"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `n 을 4 배씩 늘렸을 때 글자 견주기의 비  ${growth.join(" · ")}`,
      "네 배 입력에 네 배 값이면 성장률이 1 차다",
    ].join("\n");
  },
};
