/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts suffixArray-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { suffixArray } from "./suffixArray-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 한글·가나·한자는 고정폭 화면에서 두 칸을 먹는다. 원문자·화살표는 한 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 배열을 `[a, b, c]` 로 적는다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로다. */
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
 * 여섯 글자 안에서 다섯 갈래가 모두 실행되고(첫 순위 · 범위 밖 표시 · 정렬 두 번 · 같은 쌍
 * 유지 · 종료), 바퀴가 두 번이라 「앞 바퀴의 순위를 재료로 쓴다」가 실제로 확인되며,
 * 같은 순위가 두 쌍(`ana` 계열과 `na` 계열) 남아 넷째 갈래의 「같으면 안 올린다」가 실행된다.
 */
const WALK = "banana";

/** 제약의 최댓값. */
const LIMIT = 100_000;

/* ────────────────────────── 계측기 ────────────────────────── */

/**
 * **자료 접근** — 배열 칸을 읽거나 쓴 횟수와 문자열 글자를 읽은 횟수의 합.
 *
 * 두 설계를 같은 자로 재려면 단위가 하나여야 한다. 견주기 횟수만 세면 계수 정렬이 견주기를
 * 한 번도 하지 않아 0 이 되고, 글자 읽기만 세면 배가 기법이 첫 바퀴 말고는 글자를 안 읽어
 * 역시 0 이 된다.
 */
let access = 0;

const rd = (a: number[], i: number): number => {
  access++;
  return a[i] as number;
};

const wr = (a: number[], i: number, v: number): void => {
  access++;
  a[i] = v;
};

/** 정본과 같은 절차에 자료 접근 계수만 덧붙인 것. */
function countedDoubling(s: string): {
  sa: number[];
  access: number;
  rounds: number;
  /** 바퀴마다의 자료 접근. */
  perRound: number[];
  /** 동시에 잡혀 있는 칸의 최댓값. */
  cells: number;
  /** 첫 순위를 매기는 데 든 자료 접근. */
  first: number;
} {
  access = 0;
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  let span = 128;
  let rounds = 0;
  let cells = 2 * n;
  const perRound: number[] = [];
  // ① 첫 순위를 매길 때 글자를 n 번 읽는다.
  access += n;
  let mark = access;
  const first = access;

  const sortBy = (
    order: number[],
    key: (i: number) => number,
    k: number,
  ): number[] => {
    const count = new Array<number>(k).fill(0);
    for (let p = 0; p < order.length; p++) {
      const v = key(rd(order, p));
      wr(count, v, rd(count, v) + 1);
    }
    for (let v = 1; v < k; v++) wr(count, v, rd(count, v) + rd(count, v - 1));
    const out = new Array<number>(order.length).fill(0);
    for (let p = order.length - 1; p >= 0; p--) {
      const i = rd(order, p);
      const v = key(i);
      wr(count, v, rd(count, v) - 1);
      wr(out, rd(count, v), i);
    }
    return out;
  };

  for (let gap = 1; gap < n; gap *= 2) {
    rounds++;
    const front = (i: number): number => rd(rank, i);
    const back = (i: number): number =>
      i + gap < n ? rd(rank, i + gap) + 1 : 0;
    cells = Math.max(cells, 3 * n + span + 1);
    for (const key of [back, front]) sa = sortBy(sa, key, span + 1);

    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = rd(sa, j - 1);
      const b = rd(sa, j);
      if (front(a) !== front(b) || back(a) !== back(b)) top++;
      wr(next, b, top);
    }
    rank = next;
    span = top + 1;
    perRound.push(access - mark);
    mark = access;
    if (span === n) break;
  }
  return { sa, access, rounds, perRound, cells, first };
}

/* ── 가장 단순한 방법 — 접미사를 글자로 직접 견주어 정렬한다 ── */

/**
 * 합치기 정렬. 엔진의 `sort` 는 구현마다 견주기 순서가 달라 계수가 결정론이 아니다.
 * `cost` 는 견주기 한 번이 읽는 글자 수를 돌려준다.
 */
function mergeSortBy(
  n: number,
  compare: (a: number, b: number) => { less: boolean; cost: number },
): number {
  let cost = 0;
  let cur = Array.from({ length: n }, (_, i) => i);
  let buf = new Array<number>(n).fill(0);
  for (let w = 1; w < n; w *= 2) {
    for (let lo = 0; lo < n; lo += 2 * w) {
      const mid = Math.min(lo + w, n);
      const hi = Math.min(lo + 2 * w, n);
      let p = lo;
      let q = mid;
      for (let k = lo; k < hi; k++) {
        cost += 2; // 옮길 값을 읽고 쓴다
        if (
          p < mid &&
          (q >= hi || !compare(cur[q] as number, cur[p] as number).less)
        ) {
          cost += q < hi ? compare(cur[q] as number, cur[p] as number).cost : 0;
          buf[k] = cur[p] as number;
          p++;
        } else {
          cost +=
            p < mid ? compare(cur[q] as number, cur[p] as number).cost : 0;
          buf[k] = cur[q] as number;
          q++;
        }
      }
    }
    const t = cur;
    cur = buf;
    buf = t;
  }
  return cost;
}

/** 접미사를 글자로 직접 견주는 정렬. 답과 자료 접근 수를 함께 낸다. */
function countedNaive(s: string): { sa: number[]; access: number } {
  const n = s.length;
  access = 0;
  const compare = (a: number, b: number): { less: boolean; cost: number } => {
    let k = 0;
    let cost = 0;
    while (a + k < n && b + k < n) {
      cost += 2;
      if (s[a + k] !== s[b + k]) {
        return { less: (s[a + k] as string) < (s[b + k] as string), cost };
      }
      k++;
    }
    return { less: n - a < n - b, cost };
  };
  const cost = mergeSortBy(n, compare);
  // 답 자체는 계수와 무관하므로 정본에 맡긴다 — 두 방식이 같은 답을 내는 것은 아래서 본다.
  const sa = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    const r = compare(a, b);
    return r.less ? -1 : 1;
  });
  return { sa, access: cost };
}

/**
 * 전부 같은 글자일 때의 자료 접근을 **글자를 하나씩 세지 않고** 낸다.
 *
 * `a` 만 있는 문자열에서 접미사 `i` 와 `j` 의 견주기는 짧은 쪽 길이만큼 글자를 읽고 끝난다.
 * 그래서 견주기 하나의 값이 `2·min(n−i, n−j)` 로 닫히고, 제약 최댓값에서도 실행이 끝난다.
 */
function naiveCostAllSame(n: number): number {
  return mergeSortBy(n, (a, b) => ({
    less: n - a < n - b,
    cost: 2 * Math.min(n - a, n - b),
  }));
}

/* ── 한 바퀴에 조각을 m 배로 늘리는 일반형 ── */

function generalized(
  s: string,
  m: number,
  linear = false,
): { sa: number[]; access: number; rounds: number } {
  access = 0;
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  // 첫 순위를 매길 때 글자를 n 번 읽는다 — `countedDoubling` 과 같은 자로 잰다.
  access += n;
  let span = 128;
  let rounds = 0;
  let len = 1;

  const sortBy = (
    order: number[],
    key: (i: number) => number,
    k: number,
  ): number[] => {
    const count = new Array<number>(k).fill(0);
    for (let p = 0; p < order.length; p++) {
      const v = key(rd(order, p));
      wr(count, v, rd(count, v) + 1);
    }
    for (let v = 1; v < k; v++) wr(count, v, rd(count, v) + rd(count, v - 1));
    const out = new Array<number>(order.length).fill(0);
    for (let p = order.length - 1; p >= 0; p--) {
      const i = rd(order, p);
      const v = key(i);
      wr(count, v, rd(count, v) - 1);
      wr(out, rd(count, v), i);
    }
    return out;
  };

  while (len < n) {
    rounds++;
    const parts = linear ? 2 : m;
    const offs = linear
      ? [0, len]
      : Array.from({ length: m }, (_, t) => t * len);
    const keyOf = (t: number) => (i: number) => {
      const o = offs[t] as number;
      return i + o < n ? rd(rank, i + o) + 1 : 0;
    };
    for (let t = parts - 1; t >= 0; t--) sa = sortBy(sa, keyOf(t), span + 1);

    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = rd(sa, j - 1);
      const b = rd(sa, j);
      let same = true;
      for (let t = 0; t < parts; t++) {
        if (keyOf(t)(a) !== keyOf(t)(b)) {
          same = false;
          break;
        }
      }
      if (!same) top++;
      wr(next, b, top);
    }
    rank = next;
    span = top + 1;
    if (span === n) break;
    len = linear ? len + 1 : len * m;
  }
  return { sa, access, rounds };
}

/* ────────────────────────── 결정론적 입력 ────────────────────────── */

/** mulberry32. 32비트 정수 연산만 써서 배정밀도 손실이 없다. */
export function makeText(n: number, sigma: number): string {
  let a = 0x9e3779b9;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(String.fromCharCode(97 + (((t ^ (t >>> 14)) >>> 0) % sigma)));
  }
  return out.join("");
}

/* ────────────────────────── 전개 기록기 ────────────────────────── */

interface Step {
  label: string;
  gap: number;
  what: string;
  sa: number[];
  rank: number[];
  /** 이번 걸음에서 쓴 뒤 조각 순위. 정렬·재부여 걸음에서만 있다. */
  back: number[] | null;
  span: number;
}

/** 정본과 같은 절차를 걸음마다 멈춰 상태를 기록한다. */
function walkSteps(s: string): {
  steps: Step[];
  branch: Record<string, number>;
} {
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
  let span = 128;
  const steps: Step[] = [];
  const branch: Record<string, number> = {
    "①": 1,
    "②": 0,
    "③": 0,
    "④": 0,
    "⑤": 0,
  };
  let t = 1;
  const push = (gap: number, what: string, back: number[] | null): void => {
    steps.push({
      label: `T${t++}`,
      gap,
      what,
      sa: [...sa],
      rank: [...rank],
      back,
      span,
    });
  };

  const sortBy = (
    order: number[],
    key: (i: number) => number,
    k: number,
  ): number[] => {
    const count = new Array<number>(k).fill(0);
    for (const i of order) count[key(i)] = (count[key(i)] as number) + 1;
    for (let v = 1; v < k; v++) {
      count[v] = (count[v] as number) + (count[v - 1] as number);
    }
    const out = new Array<number>(order.length).fill(0);
    for (let p = order.length - 1; p >= 0; p--) {
      const i = order[p] as number;
      const v = key(i);
      count[v] = (count[v] as number) - 1;
      out[count[v] as number] = i;
    }
    return out;
  };

  push(0, "글자 코드를 길이 1 조각의 순위로 둔다", null);

  for (let gap = 1; gap < n; gap *= 2) {
    const front = (i: number): number => rank[i] as number;
    const back = (i: number): number =>
      i + gap < n ? (rank[i + gap] as number) + 1 : 0;
    const backs = Array.from({ length: n }, (_, i) => back(i));
    for (let i = 0; i < n; i++)
      if (i + gap >= n) branch["②"] = (branch["②"] ?? 0) + 1;
    push(gap, `뒤 조각의 순위를 붙여 쌍을 만든다`, backs);

    sa = sortBy(sa, back, span + 1);
    branch["③"] = (branch["③"] ?? 0) + 1;
    push(gap, "뒤 조각으로 안정 정렬한다", backs);
    sa = sortBy(sa, front, span + 1);
    branch["③"] = (branch["③"] ?? 0) + 1;
    push(gap, "앞 조각으로 다시 안정 정렬한다", backs);

    const next = new Array<number>(n).fill(0);
    let top = 0;
    for (let j = 1; j < n; j++) {
      const a = sa[j - 1] as number;
      const b = sa[j] as number;
      if (front(a) !== front(b) || back(a) !== back(b)) top++;
      else branch["④"] = (branch["④"] ?? 0) + 1;
      next[b] = top;
    }
    rank = next;
    span = top + 1;
    push(gap, "같은 쌍끼리 묶어 새 순위를 매긴다", backs);
    if (span === n) {
      branch["⑤"] = (branch["⑤"] ?? 0) + 1;
      break;
    }
  }
  return { steps, branch };
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  suffixArray(s: string): number[];
}

const REF = new URL("./suffixArray-guide.ref.ts", import.meta.url).pathname;

/** 범위를 넘은 뒤 조각을 **가장 큰 값**으로 두는 사본. */
const outOfRangeLargest = await loadMutant<Impl>(REF, {
  swap: [
    /i \+ gap < n \? \(rank\[i \+ gap\] as number\) \+ 1 : 0;/,
    "i + gap < n ? (rank[i + gap] as number) : span;",
  ],
});

/** 두 계수 정렬의 순서를 뒤바꾼 사본. */
const frontFirst = await loadMutant<Impl>(REF, {
  swap: [
    /for \(const key of \[back, front\]\)/,
    "for (const key of [front, back])",
  ],
});

/** 계수 정렬의 안정성을 없앤 사본 — 뒤에서부터가 아니라 앞에서부터 놓는다. */
const unstable = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let p = order\.length - 1; p >= 0; p--\) \{/,
    "for (let p = 0; p < order.length; p++) {",
  ],
});

/** 새 순위를 **앞 조각만** 보고 매기는 사본. 불변식을 지키던 그 줄이다. */
const frontOnly = await loadMutant<Impl>(REF, {
  swap: [
    /if \(front\(a\) !== front\(b\) \|\| back\(a\) !== back\(b\)\) top\+\+;/,
    "if (front(a) !== front(b)) top++;",
  ],
});

/** 새 순위를 **제자리에서** 덮어쓰는 사본. */
const inPlace = await loadMutant<Impl>(REF, {
  swap: [
    /const next = new Array<number>\(n\)\.fill\(0\);/,
    "const next = rank;",
  ],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

/** 갈리는 자리를 넓게 덮는 목록. 전개 입력을 맨 앞에 둔다. */
const CASES: string[] = [
  WALK,
  "aaaa",
  "abab",
  "mississippi",
  "abc",
  "aab",
  "cabbage",
  "abracadabra",
];

/** 변이 하나를 사례 목록에 걸어 정본과 나란히 놓는다. */
function contrast(mutant: Impl, head: string, cases: string[] = CASES): string {
  const rows: string[][] = [];
  let broken = 0;
  for (const s of cases) {
    const want = suffixArray(s);
    const got = mutant.suffixArray(s);
    const same = want.join(",") === got.join(",");
    if (!same) broken++;
    rows.push([
      s === WALK ? `전개 입력 "${s}"` : `"${s}"`,
      show(want),
      show(got),
      same ? "같다" : "어긋난다",
    ]);
  }
  if (broken === 0) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
  return table(["입력", "정본이 낸 답", head, "판정"], rows, [
    "l",
    "l",
    "l",
    "l",
  ]);
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 다른 절차를 잰 것이다. */
function assertSame(s: string, got: number[], who: string): number[] {
  const want = suffixArray(s);
  if (got.join(",") !== want.join(",")) {
    throw new Error(`${who} 와 정본의 답이 다르다 — 계측이 다른 절차를 쟀다`);
  }
  return got;
}

/* ────────────────────────── 미리 재 둔 값 ────────────────────────── */

const WALK_RUN = walkSteps(WALK);

/** 규모를 열 배씩 키우며 두 방식을 견주는 자리. 전부 같은 글자와 무작위 글자 둘을 본다. */
const SCALE = [12, 120, 1200, 12000];

const SCALE_ROWS = SCALE.map((n) => {
  const same = "a".repeat(n);
  const rnd = makeText(n, 26);
  const naiveSame = countedNaive(same);
  const naiveRnd = countedNaive(rnd);
  assertSame(same, naiveSame.sa, "직접 견주기");
  assertSame(rnd, naiveRnd.sa, "직접 견주기");
  const dblSame = countedDoubling(same);
  const dblRnd = countedDoubling(rnd);
  assertSame(same, dblSame.sa, "배가 계측기");
  assertSame(rnd, dblRnd.sa, "배가 계측기");
  return {
    n,
    naiveSame: naiveSame.access,
    dblSame: dblSame.access,
    naiveRnd: naiveRnd.access,
    dblRnd: dblRnd.access,
  };
});

const LIMIT_SAME = countedDoubling("a".repeat(LIMIT));
const LIMIT_RND = countedDoubling(makeText(LIMIT, 26));
const LIMIT_NAIVE_SAME = naiveCostAllSame(LIMIT);

/** 한 바퀴에 늘리는 배수를 바꿔 가며 잰다. 전부 같은 글자가 바퀴 수를 가장 많이 쓴다. */
const GROW_TEXT = "a".repeat(LIMIT);
const GROW = [2, 3, 4, 8, 16].map((m) => {
  const r = generalized(GROW_TEXT, m);
  assertSame(GROW_TEXT, r.sa, `x${m} 배가`);
  return { m, rounds: r.rounds, access: r.access };
});
/** 선형은 제약 최댓값에서 끝나지 않는다. 같은 모양의 작은 규모로 잰다. */
const LINEAR_N = 2000;
const LINEAR = generalized("a".repeat(LINEAR_N), 2, true);
const LINEAR_PAIR = generalized("a".repeat(LINEAR_N), 2);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 컨셉 — 접미사 여섯을 사전순으로 늘어놓으면 답이 된다. */
  "concept-banana": () => {
    const sa = suffixArray(WALK);
    const rows = sa.map((i, k) => [
      `sa[${k}]`,
      String(i),
      WALK.slice(i),
      String(WALK.length - i),
    ]);
    return table(["자리", "시작 자리 i", "접미사 s[i..]", "길이"], rows, [
      "l",
      "r",
      "l",
      "r",
    ]);
  },

  /** 컨셉 — 잘라서 들고 있기만 해도 드는 값. */
  "concept-slice-cost": () => {
    const total = (LIMIT * (LIMIT + 1)) / 2;
    const mb = Math.round(total / 1024 / 1024);
    return [
      table(
        [
          "n",
          "접미사를 다 잘라 담을 때의 글자 수 n(n+1)/2",
          "글자 하나를 1바이트로 잡으면",
        ],
        [
          ["6", num(21), `${num(21)} 바이트`],
          ["1,000", num((1000 * 1001) / 2), `${num((1000 * 1001) / 2)} 바이트`],
          [num(LIMIT), num(total), `${num(mb)} MB`],
        ],
        ["r", "r", "r"],
      ),
      "",
      `메모리 제한은 256 MB 다. 글자 하나를 1바이트로 잡아도 ${num(mb)} MB 이고,`,
      "자바스크립트 문자열은 글자 하나에 그보다 더 쓴다",
    ].join("\n");
  },

  /** 아이디어 상세 ④ — 같은 입력을 두 방식으로 처리하고 자료 접근을 나란히 센다. */
  "build-two-ways": () => {
    const rows = SCALE_ROWS.map((r) => [
      num(r.n),
      num(r.naiveSame),
      num(r.dblSame),
      num(r.naiveRnd),
      num(r.dblRnd),
    ]);
    return [
      table(
        [
          "n",
          "직접 견주기(전부 a)",
          "이 방식(전부 a)",
          "직접 견주기(무작위)",
          "이 방식(무작위)",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      "제약 최댓값 n = 100,000 에서는",
      table(
        ["입력", "직접 견주기", "이 방식", "몇 배"],
        [
          [
            "전부 같은 글자",
            num(LIMIT_NAIVE_SAME),
            num(LIMIT_SAME.access),
            `${(LIMIT_NAIVE_SAME / LIMIT_SAME.access).toFixed(0)} 배`,
          ],
          ["무작위 26 글자", "—", num(LIMIT_RND.access), "—"],
        ],
        ["l", "r", "r", "r"],
      ),
      "",
      "└ n 을 열 배로 키우면 왼쪽은 백 배가 되고 오른쪽은 열 배 남짓에 그친다",
    ].join("\n");
  },

  /** 아이디어 상세 ⑤ — 앞 바퀴 순위만으로 두 배 긴 조각의 순서가 정해진다. */
  "build-reuse": () => {
    const s = WALK;
    const n = s.length;
    const r0 = Array.from({ length: n }, (_, i) => s.charCodeAt(i));
    const rows: string[][] = [];
    for (let i = 0; i < n; i++) {
      const back = i + 1 < n ? (r0[i + 1] as number) + 1 : 0;
      rows.push([
        String(i),
        s.slice(i, i + 2),
        String(r0[i]),
        String(back),
        `(${r0[i]}, ${back})`,
      ]);
    }
    const order = [...Array(n).keys()].sort((a, b) => {
      const ka = [r0[a] as number, a + 1 < n ? (r0[a + 1] as number) + 1 : 0];
      const kb = [r0[b] as number, b + 1 < n ? (r0[b + 1] as number) + 1 : 0];
      return ka[0] !== kb[0]
        ? (ka[0] as number) - (kb[0] as number)
        : (ka[1] as number) - (kb[1] as number);
    });
    return [
      table(["i", "s[i..i+1]", "앞 조각 순위", "뒤 조각 순위", "쌍"], rows, [
        "r",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `쌍을 사전식으로 늘어놓은 순서   ${show(order)}`,
      `두 글자로 잘라 직접 견준 순서   ${show(
        [...Array(n).keys()].sort((a, b) => {
          const x = s.slice(a, a + 2);
          const y = s.slice(b, b + 2);
          return x < y ? -1 : x > y ? 1 : a - b;
        }),
      )}`,
      "└ 두 줄이 같다. 글자를 다시 읽지 않고 순위 두 개만 견주어도 순서가 같게 나온다",
    ].join("\n");
  },

  /** 아이디어 상세 ⑥ — 한 바퀴에 늘리는 배수를 실제로 바꿔 재 본다. */
  "build-growth": () => {
    const best = GROW.reduce((a, b) => (a.access <= b.access ? a : b));
    const two = GROW.find((g) => g.m === 2);
    const rows = GROW.map((g) => [
      `x${g.m}`,
      String(g.rounds),
      num(g.access),
      g.m === best.m
        ? "가장 적다"
        : `${(g.access / best.access).toFixed(3)} 배`,
    ]);
    return [
      `전부 같은 글자 n = ${num(LIMIT)} — 한 바퀴에 조각을 몇 배로 늘리는가`,
      table(["배수", "바퀴 수", "자료 접근", "가장 적은 것과의 비"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      `한 바퀴에 1 씩만 늘리면 바퀴가 n 번까지 가서 제약 최댓값에서는 끝나지 않는다.`,
      `같은 모양의 작은 규모 n = ${num(LINEAR_N)} 로 재면`,
      table(
        ["늘리는 방법", "바퀴 수", "자료 접근"],
        [
          ["+1 씩", String(LINEAR.rounds), num(LINEAR.access)],
          ["x2 씩", String(LINEAR_PAIR.rounds), num(LINEAR_PAIR.access)],
        ],
        ["l", "r", "r"],
      ),
      `└ ${(LINEAR.access / LINEAR_PAIR.access).toFixed(2)} 배다. x2 와 x3 과 x4 는 서로 ${(
        (Math.max(...GROW.slice(0, 3).map((g) => g.access)) /
          Math.min(...GROW.slice(0, 3).map((g) => g.access)) -
          1) *
          100
      ).toFixed(1)} % 안에 모이고, x8 부터 늘어난다`,
      `   가장 적은 것은 x${best.m} 이고 x2 는 그보다 ${(
        ((two?.access ?? 0) / best.access - 1) * 100
      ).toFixed(1)} % 많다`,
    ].join("\n");
  },

  /** 전개 T1 — 첫 순위. */
  "walk-init": () => {
    const s0 = WALK_RUN.steps[0] as Step;
    const rows = [...Array(WALK.length).keys()].map((i) => [
      String(i),
      WALK[i] as string,
      String(s0.rank[i]),
    ]);
    return [
      table(["i", "s[i]", "rank[i] — 글자 코드"], rows, ["r", "l", "r"]),
      "",
      `sa = ${show(s0.sa)}   아직 정렬 전이라 자리 번호 그대로다`,
    ].join("\n");
  },

  /** 전개 T2·T3·T4·T5 — 첫 바퀴. */
  "walk-round1": () => renderRound(1),

  /** 전개 T6·T7·T8·T9 — 둘째 바퀴. */
  "walk-round2": () => renderRound(2),

  /** 전개 — 아홉 걸음의 상태를 한 표로. */
  "walk-trace": () => {
    const rows = WALK_RUN.steps.map((st) => [
      st.label,
      st.gap === 0 ? "—" : String(st.gap),
      st.what,
      show(st.sa),
      show(st.rank),
    ]);
    return [
      table(["걸음", "gap", "하는 일", "sa", "rank (자리 순)"], rows, [
        "l",
        "r",
        "l",
        "l",
        "l",
      ]),
      "",
      `답은 ${show(suffixArray(WALK))} 이다`,
    ].join("\n");
  },

  /**
   * 전개 — 사전순으로 늘어놓은 그림.
   *
   * 눈금과 문자열을 표의 셋째 열과 **같은 칸에서 시작하게** 맞춘다. 앞 두 열의 폭을 값에서
   * 계산해 그만큼 들여 쓰지 않으면 눈금이 접미사와 어긋난 자리를 가리킨다.
   */
  "walk-picture": () => {
    const sa = suffixArray(WALK);
    const n = WALK.length;
    const head = ["k", "sa[k]", "접미사가 s 위에 놓인 자리"];
    const rows = sa.map((i, k) => [
      String(k),
      String(i),
      `${" ".repeat(i)}${WALK.slice(i)}`,
    ]);
    const w0 = Math.max(
      width(head[0] as string),
      ...rows.map((r) => width(r[0] as string)),
    );
    const w1 = Math.max(
      width(head[1] as string),
      ...rows.map((r) => width(r[1] as string)),
    );
    const lead = w0 + 2 + w1 + 2;
    return [
      `${padRight("자리", lead)}${[...Array(n).keys()].join("")}`,
      `${padRight("s", lead)}${WALK}`,
      "",
      table(head, rows, ["r", "r", "l"]),
    ].join("\n");
  },

  /** 전개 — 다섯 갈래가 각각 몇 번 실행됐는가. */
  "walk-branch": () => {
    const b = WALK_RUN.branch;
    const rows = [
      ["①", "첫 순위를 글자 코드로 둔다", String(b["①"]), "실행 전 한 번"],
      [
        "②",
        "뒤 조각이 문자열 끝을 넘어 0 이 된다",
        String(b["②"]),
        "두 바퀴 합",
      ],
      ["③", "계수 정렬 한 번", String(b["③"]), "두 바퀴 합"],
      ["④", "쌍이 같아 순위를 안 올린다", String(b["④"]), "두 바퀴 합"],
      ["⑤", "순위가 전부 달라져 멈춘다", String(b["⑤"]), "둘째 바퀴 끝"],
    ];
    const zero = rows.filter((r) => r[2] === "0").map((r) => r[0]);
    return [
      table(["갈래", "무엇", "실행 횟수", "어디서"], rows, [
        "l",
        "l",
        "r",
        "l",
      ]),
      "",
      zero.length === 0
        ? "└ 다섯 갈래가 전부 한 번 이상 실행됐다"
        : `└ 실행되지 않은 갈래 ${zero.join("")}`,
    ].join("\n");
  },

  /** 멈춤 — 범위 밖을 가장 큰 값으로 두면. */
  "pause-sentinel": () =>
    [
      contrast(outOfRangeLargest, "범위 밖을 가장 큰 값으로 둔 답"),
      "",
      "└ 짧은 접미사가 같은 앞 조각 무리 안에서 맨 뒤로 옮겨진다",
    ].join("\n"),

  /** 멈춤 — 두 정렬의 순서를 뒤바꾸면. */
  "pause-order": () =>
    [
      contrast(frontFirst, "앞 조각을 먼저 정렬한 답"),
      "",
      contrast(unstable, "안정성을 없앤 답"),
      "",
      "└ 두 사본 다 어떤 입력에서는 답이 같다. 답이 같은 줄만 보면 잘못을 못 찾는다",
    ].join("\n"),

  /** 멈춤 — 순위를 제자리에서 덮어쓰면. */
  "pause-inplace": () =>
    [
      contrast(inPlace, "제자리에서 덮어쓴 답"),
      "",
      "└ 아직 읽어야 할 앞 바퀴 순위가 이미 새 값으로 바뀐 뒤에 읽힌다",
    ].join("\n"),

  /**
   * 멈춤 — 제자리 덮어쓰기가 **어느 걸음에서** 어긋나는가.
   *
   * 손으로 적은 궤적을 싣지 않는다. 정본과 변이의 재부여 루프를 같은 출발 상태에서 나란히
   * 실행해 처음 갈리는 `j` 를 실행이 내게 한다.
   */
  "pause-inplace-trace": () => {
    const n = WALK.length;
    // T4 가 낸 줄과 그때의 순위. 첫 바퀴의 재부여는 이 상태에서 시작한다.
    const t4 = WALK_RUN.steps[3] as Step;
    const sa = t4.sa;
    const gap = 1;
    const base = t4.rank;

    const runOne = (inPlace: boolean) => {
      const rank = [...base];
      const next = inPlace ? rank : new Array<number>(n).fill(0);
      const front = (i: number): number => rank[i] as number;
      const back = (i: number): number =>
        i + gap < n ? (rank[i + gap] as number) + 1 : 0;
      const log: {
        fa: number;
        ba: number;
        fb: number;
        bb: number;
        up: boolean;
        top: number;
      }[] = [];
      let top = 0;
      for (let j = 1; j < n; j++) {
        const a = sa[j - 1] as number;
        const b = sa[j] as number;
        const fa = front(a);
        const ba = back(a);
        const fb = front(b);
        const bb = back(b);
        const up = fa !== fb || ba !== bb;
        if (up) top++;
        next[b] = top;
        log.push({ fa, ba, fb, bb, up, top });
      }
      return { log, rank: [...next], span: top + 1 };
    };

    const good = runOne(false);
    const bad = runOne(true);
    const rows = good.log.map((g, k) => {
      const m = bad.log[k] as (typeof bad.log)[number];
      const a = sa[k] as number;
      const b = sa[k + 1] as number;
      return [
        String(k + 1),
        String(a),
        String(b),
        `(${g.fa}, ${g.ba})`,
        `(${m.fa}, ${m.ba})`,
        g.up ? "다르다" : "같다",
        m.up ? "다르다" : "같다",
        `${g.top} / ${m.top}`,
      ];
    });
    const firstGap = good.log.findIndex(
      (g, k) => g.fa !== (bad.log[k] as (typeof bad.log)[number]).fa,
    );
    if (firstGap < 0)
      throw new Error("변이가 어느 걸음에서도 다른 값을 읽지 않았다");
    return [
      `첫 바퀴의 재부여 — 정렬이 끝난 줄 sa = ${show(sa)} 에서 (gap = ${gap})`,
      table(
        [
          "j",
          "a",
          "b",
          "정본이 읽은 a 의 쌍",
          "변이가 읽은 a 의 쌍",
          "정본 판정",
          "변이 판정",
          "top 정본/변이",
        ],
        rows,
        ["r", "r", "r", "l", "l", "l", "l", "r"],
      ),
      "",
      `바퀴가 끝난 시점   정본 rank = ${show(good.rank)}   span = ${good.span}`,
      `                   변이 rank = ${show(bad.rank)}   span = ${bad.span}   n = ${n}`,
      `└ j = ${firstGap + 1} 에서 처음으로 다른 값을 읽는다. 변이는 그 앞 걸음에서 rank[${
        sa[firstGap] as number
      }] 을 이미 덮어썼다`,
      good.span === n || bad.span !== n
        ? "└ 두 판정이 갈리지 않았다"
        : `└ 변이의 span 은 ${bad.span} 이라 여기서 멈추고, 정본의 span 은 ${good.span} 이라 한 바퀴 더 실행한다`,
    ].join("\n");
  },

  /** 멈춤 — 답이 안 바뀌는 입력은 왜 안 바뀌는가. */
  "pause-inplace-safe": () => {
    const rows = ["abc", "aab", "cabbage"].map((str) => {
      const run = walkSteps(str);
      const last = run.steps[run.steps.length - 1] as Step;
      const rounds = run.steps.filter((st) =>
        st.what.startsWith("같은 쌍"),
      ).length;
      return [
        `"${str}"`,
        String(rounds),
        String(last.span),
        String(str.length),
      ];
    });
    if (rows.some((r) => r[1] !== "1")) {
      throw new Error("첫 바퀴에 끝나지 않는 입력이 섞였다");
    }
    return [
      table(["입력", "바퀴 수", "첫 바퀴 끝의 span", "n"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 셋 다 첫 바퀴 끝에 span 이 n 과 같아 멈춘다. 덮어쓴 순위를 다시 읽을 바퀴가 없다",
    ].join("\n");
  },

  /**
   * 경쟁 설계 — 뒤집히는 자리가 왜 1,039 와 1,040 사이인가.
   *
   * 「길이 4 조각으로는 안 갈린다」를 산문으로 단정하지 않고 실제로 센다.
   */
  "alt-boundary": () => {
    const rows = [1039, 1040].map((n) => {
      const str = makeText(n, 26);
      const block = (i: number): string => str.slice(i, i + 4);
      const seen = new Map<string, number>();
      let pairs = 0;
      for (let i = 0; i < n; i++) {
        const b = block(i);
        const c = seen.get(b) ?? 0;
        pairs += c;
        seen.set(b, c + 1);
      }
      const sa = suffixArray(str);
      let lcp = 0;
      for (let k = 0; k + 1 < n; k++) {
        const a = sa[k] as number;
        const b = sa[k + 1] as number;
        let d = 0;
        while (a + d < n && b + d < n && str[a + d] === str[b + d]) d++;
        lcp = Math.max(lcp, d);
      }
      const r = countedDoubling(str);
      assertSame(str, r.sa, "배가 계측기");
      return [num(n), String(pairs), String(lcp), String(r.rounds)];
    });
    return [
      "같은 생성식(mulberry32 · 알파벳 26 글자)의 문자열에서",
      table(
        [
          "n",
          "길이 4 조각이 같은 자리 짝",
          "가장 긴 공통 앞부분",
          "배가 기법 바퀴 수",
        ],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      "└ 1,040 에서 길이 4 조각이 같은 짝이 처음 생긴다. 그래서 바퀴가 하나 늘어난다",
    ].join("\n");
  },

  /** 알아 두면 좋은 개념 — 바퀴마다 무리가 잘게 갈린다. */
  "related-refine": () => {
    const rows = WALK_RUN.steps
      .filter((st) => st.what.startsWith("같은 쌍") || st.gap === 0)
      .map((st) => {
        const groups = new Map<number, number[]>();
        st.rank.forEach((r, i) => {
          const g = groups.get(r) ?? [];
          g.push(i);
          groups.set(r, g);
        });
        const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0]);
        return [
          st.label,
          st.gap === 0 ? "1" : String(2 * st.gap),
          String(sorted.length),
          sorted.map(([, g]) => `{${g.join(",")}}`).join(" "),
        ];
      });
    return table(["걸음", "가른 조각 길이", "무리 수", "무리"], rows, [
      "l",
      "r",
      "r",
      "l",
    ]);
  },

  /** 수식 — 정의를 작은 값에 넣어 확인한다. */
  "math-check": () => {
    const s = WALK;
    const n = s.length;
    const rows: string[][] = [];
    for (const k of [0, 1, 2]) {
      const len = 2 ** k;
      const blocks = [...Array(n).keys()].map((i) => s.slice(i, i + len));
      const uniq = [...new Set(blocks)].sort();
      const rank = blocks.map((b) => uniq.indexOf(b));
      rows.push([
        String(k),
        String(len),
        blocks.map((b) => (b === "" ? "-" : b)).join(" "),
        show(rank),
        String(uniq.length),
      ]);
    }
    return [
      table(
        [
          "k",
          "조각 길이 2^k",
          "s[i..i+2^k-1]",
          "정의대로 매긴 순위",
          "서로 다른 조각 수",
        ],
        rows,
        ["r", "r", "l", "l", "r"],
      ),
      "",
      "└ 조각이 문자열 끝을 넘으면 남은 만큼만 잘라 쓴다. 짧은 조각이 언제나 앞이다",
    ].join("\n");
  },

  /** 수식 — 바퀴 수의 닫힌 형태를 실측과 대조한다. */
  "math-rounds": () => {
    const rows = [10, 100, 1000, 10000, LIMIT].map((n) => {
      const r = countedDoubling("a".repeat(n));
      assertSame("a".repeat(n), r.sa, "배가 계측기");
      const bound = Math.ceil(Math.log2(n));
      if (r.rounds !== bound) {
        throw new Error(`전부 같은 글자에서 바퀴 수가 상한과 다르다 — ${n}`);
      }
      return [num(n), String(bound), String(r.rounds), num(r.access)];
    });
    return table(["n", "⌈log2 n⌉", "실측 바퀴 수", "자료 접근"], rows, [
      "r",
      "r",
      "r",
      "r",
    ]);
  },

  /** 수식 — 임의의 배수 m 에서 정렬 횟수를 최소로 만드는 자리. */
  "math-optimum": () => {
    const rows = [2, 3, 4, 5, 8, 16].map((m) => {
      const passes = m * Math.ceil(Math.log(LIMIT) / Math.log(m));
      const measured = GROW.find((g) => g.m === m);
      return [
        String(m),
        (m / Math.log(m)).toFixed(3),
        String(passes),
        measured === undefined ? "—" : num(measured.access),
      ];
    });
    const e = Math.E;
    return [
      table(
        ["m", "m / ln m", `m·⌈log_m ${num(LIMIT)}⌉`, "자료 접근 실측"],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `m / ln m 이 가장 작은 실수는 m = e = ${e.toFixed(3)} 이고, 그 값은 ${(
        e / Math.log(e)
      ).toFixed(3)} 이다`,
      `정수는 2 와 3 이 그 자리를 사이에 두고 있어 ${(2 / Math.log(2)).toFixed(
        3,
      )} 과 ${(3 / Math.log(3)).toFixed(3)} 으로 5.6 % 안에 모인다`,
    ].join("\n");
  },

  /** 불변식 — 바퀴가 끝날 때마다 순위가 조각의 순서와 같은지 값으로 확인한다. */
  "invariant-rounds": () => {
    const rows: string[][] = [];
    for (const s of ["banana", "aaaa", "abab", "mississippi"]) {
      const n = s.length;
      const run = walkSteps(s);
      for (const st of run.steps) {
        if (!st.what.startsWith("같은 쌍")) continue;
        const len = 2 * st.gap;
        const block = (i: number): string => s.slice(i, i + len);
        let ok = true;
        for (let i = 0; i < n && ok; i++) {
          for (let j = 0; j < n && ok; j++) {
            const a = block(i);
            const b = block(j);
            const less = (st.rank[i] as number) < (st.rank[j] as number);
            const same = st.rank[i] === st.rank[j];
            if (less !== a < b || same !== (a === b)) ok = false;
          }
        }
        rows.push([
          `"${s}"`,
          String(len),
          show(st.rank),
          String(st.span),
          ok ? "맞다" : "어긋난다",
        ]);
      }
    }
    if (rows.some((r) => r[4] !== "맞다")) {
      throw new Error("불변식이 어긋나는 바퀴가 있다");
    }
    return [
      table(
        [
          "입력",
          "가른 조각 길이",
          "바퀴가 끝난 시점의 rank",
          "span",
          "조각 순서와 같은가",
        ],
        rows,
        ["l", "r", "l", "r", "l"],
      ),
      "",
      "└ 모든 자리 쌍 (i, j) 에 대해 순위의 대소·같음이 조각의 사전순 대소·같음과 맞는지 전수로 확인했다",
    ].join("\n");
  },

  /** 불변식 — 경계에 있는 입력들. */
  "invariant-edges": () => {
    const rows = [
      ["길이 1", "a"],
      ["두 글자가 같다", "aa"],
      ["두 글자가 다르다", "ab"],
      ["뒤가 앞보다 작다", "ba"],
      ["전부 같은 글자", "aaaa"],
      ["전부 다른 글자", "abcd"],
      ["되풀이", "abab"],
    ].map(([name, s]) => {
      const str = s as string;
      const run = walkSteps(str);
      const rounds = run.steps.filter((st) =>
        st.what.startsWith("같은 쌍"),
      ).length;
      return [
        name as string,
        `"${str}"`,
        String(rounds),
        show(suffixArray(str)),
      ];
    });
    return table(["경계", "입력", "바퀴 수", "답"], rows, ["l", "l", "r", "l"]);
  },

  /** 불변식 ③ — 앞 조각만 견주면. */
  "mutant-front-only": () =>
    [
      contrast(frontOnly, "앞 조각만 견준 답"),
      "",
      "└ 전개 입력에서는 답이 안 바뀐다. 같은 앞 조각을 가진 자리가 서로 이웃해 있어서다",
    ].join("\n"),

  /** 비용 — 전개의 아홉 걸음이 낸 자료 접근. */
  "perf-count": () => {
    const r = countedDoubling(WALK);
    assertSame(WALK, r.sa, "배가 계측기");
    const rows: string[][] = [
      ["첫 순위 매기기", "T1", num(r.first)],
      ...r.perRound.map((v, k) => [
        `${k + 1} 번째 바퀴`,
        `T${2 + 4 * k} ~ T${5 + 4 * k}`,
        num(v),
      ]),
      ["합계", "T1 ~ T9", num(r.access)],
    ];
    return [
      `전개 입력 "${WALK}" (n = ${WALK.length})`,
      table(["무리", "걸음", "자료 접근"], rows, ["l", "l", "r"]),
      "",
      "└ 바퀴 하나가 900 을 넘는데 n 은 6 이다. 계수 정렬의 칸 배열이 첫 바퀴에는",
      "   글자 코드 범위 129 칸이라 그 항이 n 을 압도한다",
      "",
      table(
        ["입력", "n", "바퀴 수 R", "자료 접근", "바퀴 하나당 n 의 몇 배"],
        [
          [
            "무작위 26 글자",
            num(LIMIT),
            String(LIMIT_RND.rounds),
            num(LIMIT_RND.access),
            (LIMIT_RND.access / LIMIT / LIMIT_RND.rounds).toFixed(1),
          ],
          [
            "전부 같은 글자",
            num(LIMIT),
            String(LIMIT_SAME.rounds),
            num(LIMIT_SAME.access),
            (LIMIT_SAME.access / LIMIT / LIMIT_SAME.rounds).toFixed(1),
          ],
        ],
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ n 이 커지면 바퀴 하나가 n 의 스물일곱 배 언저리로 모인다. 갈리는 것은 바퀴 수뿐이다",
    ].join("\n");
  },

  /** 최악 — 바퀴 수를 최대로 만드는 입력을 실제로 구성한다. */
  "worst-shape": () => {
    const n = LIMIT;
    const shapes: [string, string][] = [
      ["전부 같은 글자", "a".repeat(n)],
      ["두 글자가 번갈아 나온다", "ab".repeat(n / 2)],
      ["앞이 다 같고 끝만 다르다", `${"a".repeat(n - 1)}b`],
      ["여섯 글자가 되풀이된다", "abcabb".repeat(n / 6)],
      ["무작위 두 글자", makeText(n, 2)],
      ["무작위 26 글자", makeText(n, 26)],
      [
        "글자가 오름차순으로 늘어선다",
        makeText(n, 26).split("").sort().join(""),
      ],
    ];
    const rows = shapes.map(([name, s]) => {
      const r = countedDoubling(s);
      assertSame(s, r.sa, "배가 계측기");
      return [name, String(r.rounds), num(r.access), num(r.cells)];
    });
    const worst = rows.reduce((a, b) =>
      Number((a[2] as string).replaceAll(",", "")) >=
      Number((b[2] as string).replaceAll(",", ""))
        ? a
        : b,
    );
    return [
      `n = ${num(n)}`,
      table(["입력의 모양", "바퀴 수", "자료 접근", "잡는 칸 최대"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      `└ 자료 접근이 가장 많은 것은 「${worst[0]}」 이다`,
    ].join("\n");
  },

  /** 최악 — 「정렬된 입력이 최악이다」 를 실행으로 확인한다. */
  "worst-sorted": () => {
    const rows: string[][] = [];
    for (const n of [1000, 10000]) {
      const rnd = makeText(n, 26);
      const sorted = rnd.split("").sort().join("");
      const a = countedDoubling(rnd);
      const b = countedDoubling(sorted);
      assertSame(rnd, a.sa, "배가 계측기");
      assertSame(sorted, b.sa, "배가 계측기");
      rows.push([
        num(n),
        `${a.rounds} 바퀴`,
        num(a.access),
        `${b.rounds} 바퀴`,
        num(b.access),
        b.access > a.access ? "정렬된 쪽이 많다" : "정렬된 쪽이 적다",
      ]);
    }
    return table(
      ["n", "무작위 바퀴", "무작위 접근", "정렬 바퀴", "정렬 접근", "판정"],
      rows,
      ["r", "r", "r", "r", "r", "l"],
    );
  },
};

/** 한 바퀴를 걸음별로 펼친다. `which` 는 1 부터다. */
function renderRound(which: number): string {
  const steps = WALK_RUN.steps.filter((st) => st.gap === 2 ** (which - 1));
  const n = WALK.length;
  const keys = steps[0] as Step;
  const rows: string[][] = [];
  const gap = keys.gap;
  for (let i = 0; i < n; i++) {
    const f = keys.rank[i] as number;
    const b = (keys.back as number[])[i] as number;
    rows.push([
      String(i),
      WALK.slice(i, i + 2 * gap),
      String(f),
      i + gap < n ? String(b) : `${b} (범위 밖)`,
      `(${f}, ${b})`,
    ]);
  }
  const after = steps[steps.length - 1] as Step;
  return [
    `gap = ${gap} — 길이 ${gap} 조각의 순위 ${show(keys.rank)} 로 길이 ${
      2 * gap
    } 조각의 쌍을 만든다`,
    table(
      ["i", `s[i..i+${2 * gap - 1}]`, "앞 조각 순위", "뒤 조각 순위", "쌍"],
      rows,
      ["r", "l", "r", "r", "l"],
    ),
    "",
    table(
      ["걸음", "하는 일", "sa"],
      steps.slice(1).map((st) => [st.label, st.what, show(st.sa)]),
      ["l", "l", "l"],
    ),
    "",
    `바퀴가 끝난 시점   rank = ${show(after.rank)}   span = ${after.span}   n = ${n}`,
    after.span === n
      ? "└ span 이 n 과 같다. 순위가 전부 달라져 여기서 멈춘다"
      : "└ span 이 n 보다 작다. 아직 같은 순위가 남아 한 바퀴 더 실행한다",
  ].join("\n");
}
