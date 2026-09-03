/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { palindromePartitioningMinCut } from "./palindromePartitioningMinCut-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0 ? pad(c, w[0] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `5.35 × 10^601` 꼴. */
const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
};

/* ────────────────────────── 계측판 ────────────────────────── */

/** 전개가 쓰는 입력. 본문의 다른 자리도 같은 문자열을 가리킨다. */
const WALK = "abaab";

/** 본문이 여러 자리에서 함께 거는 입력 묶음. */
const SAMPLES = [
  WALK,
  "aab",
  "abcbm",
  "abacdc",
  "noonracecar",
  "abcde",
  "aaaaa",
];

/** 길이 `n` 짜리 만들기 — 글자가 전부 같은 문자열. */
const same = (n: number): string => "a".repeat(n);

/** 길이 `n` 짜리 만들기 — 길이 2 이상 회문이 하나도 없는 문자열. */
const noPal = (n: number): string =>
  Array.from({ length: n }, (_, t) => "abc"[t % 3] as string).join("");

/** 길이 `n` 짜리 만들기 — 곱셈 나머지로 고른 26 글자. */
const mixed = (n: number): string =>
  Array.from({ length: n }, (_, t) =>
    String.fromCharCode(97 + ((t * 7919) % 26)),
  ).join("");

/** 회문 판정표를 정본과 같은 차례로 채운다. 본문 그림이 이것을 그대로 쓴다. */
function palTable(s: string): boolean[][] {
  const n = s.length;
  const pal = Array.from({ length: n }, () =>
    new Array<boolean>(n).fill(false),
  );
  for (let i = 0; i < n; i++) (pal[i] as boolean[])[i] = true;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const inner = len === 2 || ((pal[i + 1] as boolean[])[j - 1] as boolean);
      (pal[i] as boolean[])[j] = s[i] === s[j] && inner;
    }
  }
  return pal;
}

/** 컷 표를 채우면서 후보 하나하나를 기록한다. 전개 절의 단계 표가 이것을 쓴다. */
function cutTable(s: string): {
  cut: number[];
  log: { e: number; b: number; taken: boolean; candidate: number | null }[];
} {
  const n = s.length;
  const pal = palTable(s);
  const cut = new Array<number>(n).fill(0);
  const log: {
    e: number;
    b: number;
    taken: boolean;
    candidate: number | null;
  }[] = [];
  for (let e = 1; e < n; e++) {
    if ((pal[0] as boolean[])[e] as boolean) {
      log.push({ e, b: 0, taken: true, candidate: 0 });
      continue;
    }
    let best = Number.POSITIVE_INFINITY;
    for (let b = 1; b <= e; b++) {
      if (!((pal[b] as boolean[])[e] as boolean)) {
        log.push({ e, b, taken: false, candidate: null });
        continue;
      }
      const candidate = (cut[b - 1] as number) + 1;
      log.push({ e, b, taken: candidate < best, candidate });
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }
  return { cut, log };
}

/**
 * 아무것도 기억하지 않는 재귀. 호출 하나마다 1 을 센다.
 * 상태를 **접두사의 끝 자리**로 잡아 정본의 `cut[e]` 와 같은 방향으로 둔다.
 */
function naiveCalls(s: string): number {
  let calls = 0;
  const isPal = (l: number, r: number): boolean => {
    let a = l;
    let z = r;
    while (a < z) {
      if (s[a] !== s[z]) return false;
      a++;
      z--;
    }
    return true;
  };
  const go = (e: number): number => {
    calls++;
    if (e < 0) return 0;
    let best = Number.POSITIVE_INFINITY;
    for (let b = 0; b <= e; b++) {
      if (isPal(b, e)) best = Math.min(best, go(b - 1) + 1);
    }
    return best;
  };
  go(s.length - 1);
  return calls;
}

/** 회문 조각으로만 이루어진 분할을 전수로 센다. */
function palindromicSplits(s: string): number {
  const n = s.length;
  const pal = palTable(s);
  const count = (start: number): number => {
    if (start === n) return 1;
    let total = 0;
    for (let end = start; end < n; end++) {
      if ((pal[start] as boolean[])[end] as boolean) total += count(end + 1);
    }
    return total;
  };
  return count(0);
}

/** 회문 판정을 후보마다 새로 할 때의 글자 비교 횟수. 조기 종료를 그대로 센다. */
function judgeEveryTime(s: string): number {
  const n = s.length;
  let cmp = 0;
  for (let e = 1; e < n; e++) {
    for (let b = 0; b <= e; b++) {
      let l = b;
      let r = e;
      while (l < r) {
        cmp++;
        if (s[l] !== s[r]) break;
        l++;
        r--;
      }
    }
  }
  return cmp;
}

/** 표를 채울 때의 글자 비교 횟수 — 길이 2 이상 칸마다 정확히 한 번이다. */
function judgeOnce(n: number): number {
  return (n * (n - 1)) / 2;
}

/** 판정표를 채우는 차례를 바꾼 판. `len` 이 정본이다. */
function fillOrder(
  s: string,
  order: "len" | "rowAsc" | "rowDesc",
): { answer: number; palTrue: number } {
  const n = s.length;
  if (n <= 1) return { answer: 0, palTrue: n };
  const pal = Array.from({ length: n }, () =>
    new Array<boolean>(n).fill(false),
  );
  for (let i = 0; i < n; i++) (pal[i] as boolean[])[i] = true;
  const one = (i: number, j: number): void => {
    const inner =
      j - i + 1 === 2 || ((pal[i + 1] as boolean[])[j - 1] as boolean);
    (pal[i] as boolean[])[j] = s[i] === s[j] && inner;
  };
  if (order === "len") {
    for (let len = 2; len <= n; len++)
      for (let i = 0; i + len - 1 < n; i++) one(i, i + len - 1);
  } else if (order === "rowAsc") {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) one(i, j);
  } else {
    for (let i = n - 1; i >= 0; i--) for (let j = i + 1; j < n; j++) one(i, j);
  }
  let palTrue = 0;
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++)
      if ((pal[i] as boolean[])[j] as boolean) palTrue++;
  const cut = new Array<number>(n).fill(0);
  for (let e = 1; e < n; e++) {
    if ((pal[0] as boolean[])[e] as boolean) continue;
    let best = Number.POSITIVE_INFINITY;
    for (let b = 1; b <= e; b++) {
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      const candidate = (cut[b - 1] as number) + 1;
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }
  return { answer: cut[n - 1] as number, palTrue };
}

/** 길이 2 구간도 일반식으로 처리한 판 — 안쪽이 빈 구간인데 표에서 읽는다. */
function withoutLenTwoGuard(s: string): number {
  const n = s.length;
  if (n <= 1) return 0;
  const pal = Array.from({ length: n }, () =>
    new Array<boolean>(n).fill(false),
  );
  for (let i = 0; i < n; i++) (pal[i] as boolean[])[i] = true;
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      (pal[i] as boolean[])[j] =
        s[i] === s[j] && ((pal[i + 1] as boolean[])[j - 1] as boolean);
    }
  }
  const cut = new Array<number>(n).fill(0);
  for (let e = 1; e < n; e++) {
    if ((pal[0] as boolean[])[e] as boolean) continue;
    let best = Number.POSITIVE_INFINITY;
    for (let b = 1; b <= e; b++) {
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      const candidate = (cut[b - 1] as number) + 1;
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }
  return cut[n - 1] as number;
}

/** 마지막 조각의 시작 자리를 0 부터 센 판 — `cut[-1]` 을 읽는다. */
function startFromZero(s: string): number {
  const n = s.length;
  if (n <= 1) return 0;
  const pal = palTable(s);
  const cut = new Array<number>(n).fill(0);
  for (let e = 1; e < n; e++) {
    let best = Number.POSITIVE_INFINITY;
    for (let b = 0; b <= e; b++) {
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      const candidate = (cut[b - 1] as number) + 1;
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }
  return cut[n - 1] as number;
}

/** 왼쪽부터 가장 긴 회문 조각을 떼는 판. */
function longestPieceFirst(s: string): number {
  const n = s.length;
  if (n <= 1) return 0;
  const pal = palTable(s);
  let start = 0;
  let pieces = 0;
  while (start < n) {
    let end = n - 1;
    while (!((pal[start] as boolean[])[end] as boolean)) end--;
    pieces++;
    start = end + 1;
  }
  return pieces - 1;
}

/** 컷 표를 채우면서 후보를 검사한 횟수. */
function countCandidates(s: string): number {
  const n = s.length;
  if (n <= 1) return 0;
  const pal = palTable(s);
  const cut = new Array<number>(n).fill(0);
  let looks = 0;
  for (let e = 1; e < n; e++) {
    if ((pal[0] as boolean[])[e] as boolean) continue;
    let best = Number.POSITIVE_INFINITY;
    for (let b = 1; b <= e; b++) {
      looks++;
      if (!((pal[b] as boolean[])[e] as boolean)) continue;
      const candidate = (cut[b - 1] as number) + 1;
      if (candidate < best) best = candidate;
    }
    cut[e] = best;
  }
  return looks;
}

/** 접두사를 한 글자 늘렸을 때 컷 수가 얼마나 오르내리는가. */
function cutSteps(s: string): number[] {
  const out: number[] = [];
  let prev = palindromePartitioningMinCut(s.slice(0, 1));
  for (let e = 1; e < s.length; e++) {
    const now = palindromePartitioningMinCut(s.slice(0, e + 1));
    out.push(now - prev);
    prev = now;
  }
  return out;
}

/** 회문 부분문자열의 개수. */
function palindromeCount(s: string): number {
  const pal = palTable(s);
  let count = 0;
  for (let i = 0; i < s.length; i++)
    for (let j = i; j < s.length; j++)
      if ((pal[i] as boolean[])[j] as boolean) count++;
  return count;
}

/** 길이 2·3 회문이 하나도 없는가 — 답이 `n − 1` 이 되는 조건의 판정식. */
function noShortPalindrome(s: string): boolean {
  for (let t = 0; t + 1 < s.length; t++) if (s[t] === s[t + 1]) return false;
  for (let t = 0; t + 2 < s.length; t++) if (s[t] === s[t + 2]) return false;
  return true;
}

// 조건과 실제 답이 어긋나면 `deep.math` 의 유도가 거짓이다. 실행이 그것을 판정한다.
{
  const alphabet = "abc";
  const walk = (cur: string): void => {
    if (cur.length === 7) {
      const want = noShortPalindrome(cur);
      const got = palindromePartitioningMinCut(cur) === cur.length - 1;
      if (want !== got) {
        throw new Error(`답이 n − 1 이 되는 조건이 실제와 어긋난다 — "${cur}"`);
      }
      return;
    }
    for (const c of alphabet) walk(cur + c);
  };
  walk("");
}

// 회문 개수의 상·하한이 어긋나면 그 유도도 거짓이다.
for (let n = 1; n <= 40; n++) {
  const hi = (n * (n + 1)) / 2;
  if (palindromeCount(same(n)) !== hi || palindromeCount(noPal(n)) !== n) {
    throw new Error(`회문 개수의 상·하한이 실측과 어긋난다 — n = ${n}`);
  }
}

// 「글자가 다 같으면 모든 분할이 후보」와 「회문이 없으면 후보가 하나」도 실측으로 못 박는다.
// 이 둘이 서면 큰 `n` 의 값을 `2^(n−1)` 로 적을 수 있다.
for (let n = 1; n <= 16; n++) {
  if (palindromicSplits(same(n)) !== 2 ** (n - 1)) {
    throw new Error(
      `글자가 다 같을 때의 회문 분할 수가 2^(n−1) 이 아니다 — n = ${n}`,
    );
  }
  if (palindromicSplits(noPal(n)) !== 1) {
    throw new Error(`회문이 없을 때의 회문 분할 수가 1 이 아니다 — n = ${n}`);
  }
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식의 「읽는 칸이 이미 확정돼 있다」를 지키던 줄 — 컷 표를 끝 자리 오름차순으로 도는
 * 반복문 — 을 내림차순으로 바꾼 사본. 정본 소스에서 기계로 만든다.
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 뒤에서부터채우기 = await loadMutant<{
  palindromePartitioningMinCut(s: string): number;
}>(
  new URL("./palindromePartitioningMinCut-guide.ref.ts", import.meta.url)
    .pathname,
  {
    swap: [
      /for \(let e = 1; e < n; e\+\+\) \{/,
      "for (let e = n - 1; e >= 1; e--) {",
    ],
  },
);

const 변이표 = [WALK, "aab", "abcde", "abcbm", "aaaaa", "a"];

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (
  변이표.every(
    (s) =>
      palindromePartitioningMinCut(s) ===
      뒤에서부터채우기.palindromePartitioningMinCut(s),
  )
) {
  throw new Error(
    "뒤에서부터 채우는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

// 변이가 답을 그대로 두는 입력이 실제로 있다는 것도 본문의 주장이다.
if (
  변이표.every(
    (s) =>
      palindromePartitioningMinCut(s) !==
      뒤에서부터채우기.palindromePartitioningMinCut(s),
  )
) {
  throw new Error(
    "변이가 모든 입력에서 답을 바꿨다 — 「안 갈린다」가 거짓이다",
  );
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 자르는 자리를 전부 시험하는 방법이 어디서 실행 불가가 되는가. */
  naiveSplits: () => {
    const rows = [2, 3, 4, 5, 8, 12, 20].map((n) => [
      comma(n),
      comma(n - 1),
      comma(2n ** BigInt(n - 1)),
      comma(palindromicSplits(same(n))),
      comma(palindromicSplits(noPal(n))),
    ]);
    rows.push([
      comma(2000),
      comma(1999),
      big(2n ** 1999n),
      big(2n ** 1999n),
      "1",
    ]);
    return table(
      [
        "글자 수",
        "자르는 자리",
        "분할 수 2^(n−1)",
        "조각이 전부 회문 · 글자가 다 같다",
        "조각이 전부 회문 · 회문이 없다",
      ],
      rows,
    );
  },

  /** `deep.build` ④ — 어느 접두사를 몇 번씩 다시 푸는가. 끝 자리마다 갈라 센다. */
  repeatPrefix: () => {
    const count = (s: string): number[] => {
      const n = s.length;
      const pal = palTable(s);
      const hit = new Array<number>(n + 1).fill(0);
      const go = (e: number): number => {
        hit[e + 1] = (hit[e + 1] as number) + 1;
        if (e < 0) return 0;
        let best = Number.POSITIVE_INFINITY;
        for (let b = 0; b <= e; b++) {
          if ((pal[b] as boolean[])[e] as boolean) {
            best = Math.min(best, go(b - 1) + 1);
          }
        }
        return best;
      };
      go(n - 1);
      return hit;
    };
    const a = count(WALK);
    const z = count(same(WALK.length));
    const rows: string[][] = [
      ["빈 접두사", comma(a[0] as number), comma(z[0] as number), "1"],
    ];
    for (let e = 0; e < WALK.length; e++) {
      rows.push([
        `e=${e}  "${WALK.slice(0, e + 1)}"`,
        comma(a[e + 1] as number),
        comma(z[e + 1] as number),
        "1",
      ]);
    }
    const sum = (x: number[]): number => x.reduce((p, q) => p + q, 0);
    rows.push(["합계", comma(sum(a)), comma(sum(z)), comma(WALK.length + 1)]);
    return table(
      [
        "접두사",
        '"abaab" 에서 푼 횟수',
        '"aaaaa" 에서 푼 횟수',
        "끝 자리마다 한 번만 정하면",
      ],
      rows,
    );
  },

  /** `deep.build` ④ — 접두사를 몇 번씩 다시 푸는가. */
  naiveCalls: () => {
    const rows = [2, 4, 6, 8, 10, 14, 18].map((n) => [
      comma(n),
      comma(naiveCalls(same(n))),
      comma(naiveCalls(noPal(n))),
      comma(n),
    ]);
    rows.push([comma(2000), "세지 못했다", "세지 못했다", comma(2000)]);
    return table(
      [
        "글자 수",
        "재귀 호출 · 글자가 다 같다",
        "재귀 호출 · 회문이 없다",
        "서로 다른 끝 자리 수",
      ],
      rows,
    );
  },

  /** `deep.build` ⑤ — 회문 판정을 후보마다 새로 하면 글자 비교가 몇 번인가. */
  judgeCost: () => {
    const rows = [8, 32, 128, 512, 2000].map((n) => [
      comma(n),
      comma(judgeOnce(n)),
      comma(judgeEveryTime(same(n))),
      comma(judgeEveryTime(mixed(n))),
    ]);
    return table(
      [
        "글자 수",
        "표로 한 번 정한다",
        "후보마다 새로 · 글자가 다 같다",
        "후보마다 새로 · 26 글자를 섞는다",
      ],
      rows,
    );
  },

  /** `deep.build` ⑥ — 판정표를 채우는 차례가 읽는 칸을 준비해 두는가. */
  fillOrder: () => {
    const orders: [string, "len" | "rowAsc" | "rowDesc"][] = [
      ["길이가 짧은 구간부터", "len"],
      ["i 를 0 부터 · j 를 i 부터", "rowAsc"],
      ["i 를 n−1 부터 · j 를 i 부터", "rowDesc"],
    ];
    return table(
      ["채우는 차례", ...SAMPLES.slice(0, 5).map((s) => `"${s}"`)],
      orders.map(([name, order]) => [
        name,
        ...SAMPLES.slice(0, 5).map((s) => comma(fillOrder(s, order).answer)),
      ]),
    );
  },

  /** `deep.walk.step` — 전개 입력의 회문 판정표. */
  walkPal: () => {
    const n = WALK.length;
    const pal = palTable(WALK);
    const head = ["", ...Array.from({ length: n }, (_, t) => `j=${t}`)];
    const rows = Array.from({ length: n }, (_, i) => [
      `i=${i}  ${WALK[i]}`,
      ...Array.from({ length: n }, (_, j) =>
        j < i ? "-" : ((pal[i] as boolean[])[j] as boolean) ? "T" : "F",
      ),
    ]);
    const trues: string[] = [];
    for (let i = 0; i < n; i++)
      for (let j = i; j < n; j++)
        if ((pal[i] as boolean[])[j] as boolean)
          trues.push(`[${i},${j}] "${WALK.slice(i, j + 1)}"`);
    return `${table(head, rows)}\n\n참인 칸 ${trues.length} 개 — ${trues.join(" · ")}`;
  },

  /** `deep.walk.step` — 전개 입력의 컷 표와 후보 하나하나. */
  walkCut: () => {
    const { cut, log } = cutTable(WALK);
    let running = 0;
    let seen = -1;
    const rows = log.map((x) => {
      if (x.e !== seen) {
        seen = x.e;
        running = 0;
      }
      if (x.b === 0) {
        running = 0;
        return [
          `e=${x.e}`,
          "—",
          `"${WALK.slice(0, x.e + 1)}"`,
          "접두사 전체가 회문이다",
          "③",
          "0",
        ];
      }
      if (x.candidate === null) {
        return [
          `e=${x.e}`,
          `b=${x.b}`,
          `"${WALK.slice(x.b, x.e + 1)}"`,
          "회문이 아니라 후보가 아니다",
          "—",
          running === 0 ? "—" : String(running),
        ];
      }
      if (x.taken) running = x.candidate;
      return [
        `e=${x.e}`,
        `b=${x.b}`,
        `"${WALK.slice(x.b, x.e + 1)}"`,
        `cut[${x.b - 1}] + 1 = ${x.candidate}`,
        x.taken ? "④" : "⑤",
        String(running),
      ];
    });
    const head = [
      "끝 자리",
      "시작 자리",
      "마지막 조각",
      "후보",
      "갈래",
      "지금까지의 최소",
    ];
    return `${table(head, rows)}\n\ncut = [${cut.join(", ")}] · 답 = cut[${WALK.length - 1}] = ${palindromePartitioningMinCut(WALK)}`;
  },

  /** `deep.walk.pause` — 길이 2 구간의 안쪽을 표에서 읽으면 어떻게 되는가. */
  pauseInner: () =>
    table(
      ["입력", "바른 코드", "길이 2 도 안쪽을 표에서 읽은 코드"],
      SAMPLES.map((s) => [
        `"${s}"`,
        comma(palindromePartitioningMinCut(s)),
        comma(withoutLenTwoGuard(s)),
      ]),
    ),

  /** `deep.walk.pause` — 마지막 조각의 시작 자리를 0 부터 세면 어떻게 되는가. */
  pauseZero: () =>
    table(
      ["입력", "바른 코드", "시작 자리를 0 부터 센 코드"],
      SAMPLES.map((s) => [
        `"${s}"`,
        comma(palindromePartitioningMinCut(s)),
        comma(startFromZero(s)),
      ]),
    ),

  /** `deep.walk.pause` — 가장 긴 회문 조각을 먼저 떼면 최소가 되는가. */
  pauseGreedy: () =>
    table(
      ["입력", "가장 긴 회문 조각부터 뗀다", "최소"],
      SAMPLES.map((s) => [
        `"${s}"`,
        comma(longestPieceFirst(s)),
        comma(palindromePartitioningMinCut(s)),
      ]),
    ),

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  finalRun: () => {
    const 목록 = [
      ...SAMPLES,
      "abba",
      "aba",
      "ab",
      "a",
      "abbaabaabbba",
      "abaca",
    ];
    const 이름 = 목록.map((s) => `palindromePartitioningMinCut("${s}")`);
    const 폭 = Math.max(...이름.map((x) => x.length));
    return 목록
      .map(
        (s, t) =>
          `${pad(이름[t] as string, 폭)}  →  ${palindromePartitioningMinCut(s)}`,
      )
      .join("\n");
  },

  /** `related` — 참인 칸을 중심별로 묶는다. */
  centerChains: () => {
    const n = WALK.length;
    const pal = palTable(WALK);
    const rows: string[][] = [];
    for (let c = 0; c <= 2 * (n - 1); c++) {
      const spot =
        c % 2 === 0
          ? `글자 ${c / 2}`
          : `글자 ${(c - 1) / 2}·${(c + 1) / 2} 사이`;
      const list: string[] = [];
      // 짧은 구간부터 적는다 — 왼쪽이 오른쪽에 담긴다는 관계가 그 차례로 읽힌다.
      for (let i = n - 1; i >= 0; i--) {
        const j = c - i;
        if (j < i || j >= n) continue;
        if ((pal[i] as boolean[])[j] as boolean)
          list.push(`[${i},${j}] "${WALK.slice(i, j + 1)}"`);
      }
      rows.push([
        String(c),
        spot,
        list.length === 0 ? "없다" : list.join(" ⊂ "),
      ]);
    }
    return `${table(["i+j", "중심이 놓인 자리", "그 중심의 회문 구간"], rows)}\n\n중심 ${2 * n - 1} 개 · 회문 ${palindromeCount(WALK)} 개`;
  },

  /** `purpose.real` — 인용한 논문이 적은 값과 이 글의 코드를 맞춘다. */
  paperPL: () => {
    const 목록: [string, number][] = [
      ["abaab", 2],
      ["abaca", 3],
      ["abbaabaabbba", 3],
    ];
    return table(
      ["문자열", "논문이 적은 PL(S)", "이 글의 코드가 낸 컷 수", "컷 수 + 1"],
      목록.map(([s, pl]) => [
        `"${s}"`,
        String(pl),
        String(palindromePartitioningMinCut(s)),
        String(palindromePartitioningMinCut(s) + 1),
      ]),
    );
  },

  /** `deep.math` ② — 정의대로 D(4) 를 전수로 적는다. 손으로 적으면 원소를 빠뜨린다. */
  mathD4: () => {
    const s = WALK;
    const n = s.length;
    const pal = palTable(s);
    const valid: number[][] = [];
    const walk = (starts: number[], pos: number): void => {
      if (pos === n) {
        valid.push(starts);
        return;
      }
      for (let end = pos; end < n; end++) {
        if ((pal[pos] as boolean[])[end] as boolean)
          walk([...starts, pos], end + 1);
      }
    };
    walk([], 0);
    valid.sort((a, b) => a.length - b.length);
    const rows = valid.map((d) => {
      const pieces = d.map((b, k) =>
        s.slice(b, k + 1 < d.length ? (d[k + 1] as number) : n),
      );
      return [
        `(${d.join(",")})`,
        pieces.map((x) => `"${x}"`).join(" | "),
        String(d.length),
        String(d.length - 1),
      ];
    });
    const body = table(
      ["조각의 시작 자리 목록", "그것이 만드는 조각", "조각 수", "컷 수"],
      rows,
    );
    return `${body}\n\n원소 ${valid.length} 개 · C(4) = ${Math.min(...valid.map((d) => d.length - 1))} · 파트 1 의 cut[4] = ${palindromePartitioningMinCut(s)}`;
  },

  /** `deep.math` ② — 회문 부분문자열 개수의 상·하한을 값에 넣어 본다. */
  palCount: () => {
    const rows = [5, 8, 16, 64, 2000].map((n) => [
      comma(n),
      comma(n),
      comma(palindromeCount(noPal(n))),
      comma(palindromeCount(mixed(n))),
      comma(palindromeCount(same(n))),
      comma((n * (n + 1)) / 2),
    ]);
    return table(
      [
        "글자 수",
        "하한 n",
        "회문이 없을 때",
        "26 글자를 섞을 때",
        "글자가 다 같을 때",
        "상한 n(n+1)/2",
      ],
      rows,
    );
  },

  /** `deep.math` ③ — 답이 `n − 1` 이 되는 조건을 전수로 확인한다. */
  edgeCondition: () => {
    const alphabet = "abc";
    let checked = 0;
    let matched = 0;
    let extreme = 0;
    const walk = (cur: string): void => {
      if (cur.length === 7) {
        checked++;
        const want = noShortPalindrome(cur);
        const got = palindromePartitioningMinCut(cur) === cur.length - 1;
        if (want === got) matched++;
        if (got) extreme++;
        return;
      }
      for (const c of alphabet) walk(cur + c);
    };
    walk("");
    return table(
      ["무엇", "값"],
      [
        ["글자 7 개 · 알파벳 3 글자 전수", comma(checked)],
        ["답이 6 인 문자열", comma(extreme)],
        ["판정식과 실제 답이 같은 문자열", comma(matched)],
        ["어긋난 문자열", comma(checked - matched)],
      ],
    );
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣는다. */
  mathScale: () => {
    const n = 2000;
    return table(
      ["무엇", "값"],
      [
        ["자르는 자리를 전부 시험할 때의 분할 수 2^(n−1)", big(2n ** 1999n)],
        ["그 값의 자릿수", comma(String(2n ** 1999n).length)],
        ["판정표가 정하는 칸 수 n(n+1)/2", comma((n * (n + 1)) / 2)],
        ["컷 표가 검사하는 후보 수의 상한 n(n−1)/2", comma((n * (n - 1)) / 2)],
        ["둘을 더한 값", comma((n * (n + 1)) / 2 + (n * (n - 1)) / 2)],
        [
          "분할 수가 그 값의 몇 배인가 — 그 배수의 자릿수",
          comma(String(2n ** 1999n / BigInt(n * n)).length),
        ],
      ],
    );
  },

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  mutantBackward: () =>
    table(
      ["입력", "바른 코드", "컷 표를 뒤에서부터 채운 코드"],
      변이표.map((s) => [
        `"${s}"`,
        comma(palindromePartitioningMinCut(s)),
        comma(뒤에서부터채우기.palindromePartitioningMinCut(s)),
      ]),
    ),

  /** `selfcheck` — 접두사를 한 글자 늘렸을 때 컷 수가 얼마나 오르내리는가. */
  cutStep: () => {
    const 목록 = [
      WALK,
      "abcba",
      "abcddcba",
      "abcdefggfedcba",
      "aaaaaaaa",
      noPal(12),
      mixed(40),
      same(40),
    ];
    const rows = 목록.map((s) => {
      const steps = cutSteps(s);
      const short =
        s.length <= 14 ? `"${s}"` : `"${s.slice(0, 11)}…" (${s.length} 글자)`;
      return [
        short,
        s.length <= 14
          ? steps.map((d) => (d >= 0 ? `+${d}` : String(d))).join(" ")
          : "…",
        String(Math.min(...steps)),
        String(Math.max(...steps)),
      ];
    });
    // 알파벳 3 종 · 길이 9 이하 전수에서도 범위가 같은지 실행이 판정한다.
    let 최소 = 0;
    let 최대 = 0;
    const walk = (cur: string): void => {
      if (cur.length >= 2) {
        const steps = cutSteps(cur);
        최소 = Math.min(최소, ...steps);
        최대 = Math.max(최대, ...steps);
      }
      if (cur.length === 9) return;
      for (const c of "abc") walk(cur + c);
    };
    walk("");
    rows.push([
      "알파벳 3 종 · 길이 9 이하 전수",
      "…",
      String(최소),
      String(최대),
    ]);
    return table(
      ["문자열", "cut[e] − cut[e−1]", "가장 작은 차이", "가장 큰 차이"],
      rows,
    );
  },

  /** `perf.worst` — 입력의 내용이 후보 검사 횟수를 가르는가. */
  worstFill: () => {
    const n = 2000;
    const 입력: [string, string][] = [
      ["글자가 전부 같다", same(n)],
      ["두 글자를 번갈아 쓴다", "ab".repeat(n / 2)],
      ["길이 2 이상 회문이 없다", noPal(n)],
      ["26 글자를 곱셈 나머지로 섞는다", mixed(n)],
      ["앞 절반만 같은 글자다", same(n / 2) + noPal(n / 2)],
    ];
    return table(
      ["입력 (글자 2,000 개)", "답", "판정표 칸", "컷 표의 후보 검사"],
      입력.map(([이름, s]) => [
        이름,
        comma(palindromePartitioningMinCut(s)),
        comma((n * (n + 1)) / 2),
        comma(countCandidates(s)),
      ]),
    );
  },
};
