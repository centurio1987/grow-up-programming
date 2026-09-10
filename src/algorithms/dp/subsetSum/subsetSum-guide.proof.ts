/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/subsetSum/subsetSum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { subsetSum } from "./subsetSum-guide.ref.ts";

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

/** `2^53` 을 넘는 값은 자릿수로 적는다 — `1.07e+301` → `1.07 × 10^301`. */
const big = (n: bigint): string => {
  if (n <= 9_007_199_254_740_991n) return comma(n);
  const [m, e] = Number(n).toExponential(2).split("e+");
  return `${m} × 10^${e}`;
};

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

/** 참/거짓을 본문 표기로 적는다. */
const yn = (b: boolean): string => (b ? "참" : "거짓");

/* ────────────────────────── 계측판 ────────────────────────── */

/** 전개가 쓰는 입력. 본문의 다른 자리도 같은 배열을 가리킨다. */
const WALK = [3, 34, 4, 12, 5, 2];

/** 원소를 그대로 적는다 — `[3, 34, 4, 12, 5, 2] / 9` 꼴. */
const label = (nums: number[], target: number): string =>
  `[${nums.join(", ")}] / ${target}`;

/** 부분집합을 실제로 하나씩 만들어 세고, 합이 `target` 인 것이 있으면 참. */
function enumerate(
  nums: number[],
  target: number,
): { 부분집합: number; 답: boolean } {
  const n = nums.length;
  let 부분집합 = 0;
  let 답 = false;
  for (let m = 0; m < 1 << n; m++) {
    부분집합++;
    let s = 0;
    for (let i = 0; i < n; i++) if (m & (1 << i)) s += nums[i] as number;
    if (s === target) 답 = true;
  }
  return { 부분집합, 답 };
}

/** 층마다 만들 수 있는 합의 집합. `target` 을 넘는 합은 버린다. */
function reachable(nums: number[], target: number): number[] {
  const sizes = [1];
  let cur = new Set<number>([0]);
  for (const a of nums) {
    const next = new Set<number>(cur);
    for (const s of cur) if (s + a <= target) next.add(s + a);
    cur = next;
    sizes.push(cur.size);
  }
  return sizes;
}

/** 합 하나만 기억하는 한 줄짜리 표를 **오름차순**으로 채운 것. */
function oneRowAscending(nums: number[], target: number): boolean {
  const dp = new Array<boolean>(target + 1).fill(false);
  dp[0] = true;
  for (const a of nums) {
    for (let t = a; t <= target; t++) if (dp[t - a]) dp[t] = true;
  }
  return dp[target] as boolean;
}

/** 열을 `0 … cap` 까지 두고 채운 뒤 `target` 칸을 읽는다. */
function tableWithCap(nums: number[], target: number, cap: number): boolean {
  const n = nums.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(cap + 1).fill(false),
  );
  (dp[0] as boolean[])[0] = true;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const prev = dp[i - 1] as boolean[];
    const cur = dp[i] as boolean[];
    for (let t = 0; t <= cap; t++) {
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (prev[t - a] as boolean);
    }
  }
  return (dp[n] as boolean[])[target] as boolean;
}

/** 칸의 뜻을 「합 `t` **이하**를 만들 수 있는가」로 두고 채운 표. */
function atMostTable(nums: number[], target: number): boolean {
  const n = nums.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(target + 1).fill(false),
  );
  // 빈 부분집합의 합 0 은 어떤 t 에 대해서도 t 이하다.
  for (let t = 0; t <= target; t++) (dp[0] as boolean[])[t] = true;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const prev = dp[i - 1] as boolean[];
    const cur = dp[i] as boolean[];
    for (let t = 0; t <= target; t++) {
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (prev[t - a] as boolean);
    }
  }
  return (dp[n] as boolean[])[target] as boolean;
}

/** 음수가 섞인 배열에 이 표를 그대로 건다. 열 밖을 가리키는 자리는 거짓으로 읽는다. */
function tableAllowingNegative(nums: number[], target: number): boolean {
  const n = nums.length;
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(target + 1).fill(false),
  );
  (dp[0] as boolean[])[0] = true;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const prev = dp[i - 1] as boolean[];
    const cur = dp[i] as boolean[];
    for (let t = 0; t <= target; t++) {
      const src = t - a;
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) ||
            (src >= 0 && src <= target ? (prev[src] as boolean) : false);
    }
  }
  return (dp[n] as boolean[])[target] as boolean;
}

/** 값을 정한 칸 수. `early` 면 `dp[i][target]` 이 참이 된 줄에서 멈춘다. */
function decidedCells(nums: number[], target: number, early: boolean): number {
  const n = nums.length;
  let cells = target + 1;
  let prev = new Array<boolean>(target + 1).fill(false);
  prev[0] = true;
  if (early && (prev[target] as boolean)) return cells;
  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const cur = new Array<boolean>(target + 1).fill(false);
    for (let t = 0; t <= target; t++) {
      cells++;
      cur[t] =
        t < a
          ? (prev[t] as boolean)
          : (prev[t] as boolean) || (prev[t - a] as boolean);
    }
    prev = cur;
    if (early && (prev[target] as boolean)) return cells;
  }
  return cells;
}

const repeat = (v: number, n: number): number[] => new Array(n).fill(v);

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식을 지키던 줄 — `t - a` 를 **윗 줄**에서 읽는 자리 — 를 **이번 줄**로 바꾼 사본.
 * 정본 소스에서 기계로 만든다. 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 같은줄에서읽기 = await loadMutant<{
  subsetSum(nums: number[], target: number): boolean;
}>(new URL("./subsetSum-guide.ref.ts", import.meta.url).pathname, {
  swap: [/\(prev\[t - a\] as boolean\)/, "(cur[t - a] as boolean)"],
});

const 변이표: [number[], number][] = [
  [WALK, 9],
  [WALK, 30],
  [[3], 9],
  [[3, 4], 8],
  [[7], 14],
  [[100, 200], 50],
];

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (
  변이표.every(
    ([nums, target]) =>
      subsetSum(nums, target) === 같은줄에서읽기.subsetSum(nums, target),
  )
) {
  throw new Error(
    "같은 줄에서 읽는 변이가 어느 입력에서도 답을 바꾸지 못했다 — 「달라진다」가 거짓이다",
  );
}

/* ────────────────── 바깥 자료가 적은 값 (대조용) ────────────────── */

/** 인용한 소스가 적어 둔 상수. 값이 어긋나면 인용이 낡은 것이라 여기서 실패한다. */
const COIN = 100_000_000n;
const MAX_MONEY = 21_000_000n * COIN;
if (MAX_MONEY !== 2_100_000_000_000_000n) {
  throw new Error("MAX_MONEY 계산이 인용한 정의와 어긋난다");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 부분집합을 하나씩 만드는 길이 어디서 끊기는가. */
  subsetCount: () => {
    const rows = [6, 12, 20].map((n) => {
      const nums = Array.from({ length: n }, (_, i) => i + 1);
      const r = enumerate(nums, 10_000);
      return [comma(n), comma(r.부분집합), big(2n ** BigInt(n))];
    });
    rows.push(["40", "세지 못했다", big(2n ** 40n)]);
    rows.push(["1,000", "세지 못했다", big(2n ** 1000n)]);
    return table(["원소 수", "실제로 만들어 센 부분집합", "2^n"], rows);
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리하고 층마다 항목 수를 센다. */
  mergeSameSum: () => {
    const sizes = reachable(WALK, 9);
    const rows = sizes.map((size, i) => [
      i === 0 ? "i=0  (원소 없음)" : `i=${i}  a=${WALK[i - 1]}`,
      comma(2 ** i),
      comma(size),
    ]);
    rows.push([
      "합계",
      comma(sizes.reduce((s, _, i) => s + 2 ** i, 0)),
      comma(sizes.reduce((s, v) => s + v, 0)),
    ]);
    return table(["층", "부분집합을 따로 센다", "합이 같으면 합친다"], rows);
  },

  /** `deep.build` ⑤ — 합 하나만 기억하면 같은 원소를 여러 번 쓴다. */
  oneRowOnly: () =>
    table(
      ["입력", "정본", "합 t 하나만 기억한 표"],
      (
        [
          [WALK, 9],
          [WALK, 30],
          [[3], 9],
          [[3, 4], 8],
          [[7], 14],
          [[100, 200], 50],
        ] as [number[], number][]
      ).map(([nums, target]) => [
        label(nums, target),
        yn(subsetSum(nums, target)),
        yn(oneRowAscending(nums, target)),
      ]),
    ),

  /** `deep.build` ⑥ — 상태 후보 셋을 실제로 시험한다. */
  stateCandidates: () => {
    const target = 30;
    const sum = WALK.reduce((a, b) => a + b, 0);
    const n = 1000;
    const T = 10_000;
    const A = 10_000;
    return table(
      [
        "상태",
        "[3, 34, 4, 12, 5, 2] / 30 의 답",
        "그때 칸 수",
        "제약 최대의 칸 수",
      ],
      [
        [
          "합 t 하나 (한 줄)",
          yn(oneRowAscending(WALK, target)),
          comma(target + 1),
          comma(T + 1),
        ],
        [
          "(i, t) · 열을 0 … T 로 자른다",
          yn(subsetSum(WALK, target)),
          comma((WALK.length + 1) * (target + 1)),
          comma((n + 1) * (T + 1)),
        ],
        [
          "(i, t) · 열을 0 … Σa 로 둔다",
          yn(tableWithCap(WALK, target, sum)),
          comma((WALK.length + 1) * (sum + 1)),
          comma(BigInt(n + 1) * (BigInt(n) * BigInt(A) + 1n)),
        ],
      ],
    );
  },

  /** `deep.walk.pause` — 음수가 섞이면 이 표가 답을 못 낸다. */
  negativeElement: () =>
    table(
      ["입력", "전부 세어 본 답", "이 표가 내는 답"],
      (
        [
          [[5, -2], 3],
          [[10, -7], 3],
          [[8, -5, 1], 4],
          [[4, -1, 2], 5],
          [[3, -3, 6], 6],
        ] as [number[], number][]
      ).map(([nums, target]) => [
        label(nums, target),
        yn(enumerate(nums, target).답),
        yn(tableAllowingNegative(nums, target)),
      ]),
    ),

  /** `deep.walk.pause` — 칸의 뜻을 「이하」로 두면 표가 통째로 참이 된다. */
  exactVsAtMost: () =>
    table(
      ["입력", "칸이 「정확히 t」 (정본)", "칸이 「t 이하」"],
      (
        [
          [WALK, 9],
          [WALK, 30],
          [[3, 4], 6],
          [[100, 200], 50],
          [[], 5],
        ] as [number[], number][]
      ).map(([nums, target]) => [
        label(nums, target),
        yn(subsetSum(nums, target)),
        yn(atMostTable(nums, target)),
      ]),
    ),

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  finalRun: () => {
    const 목록: [number[], number][] = [
      [WALK, 9],
      [WALK, 30],
      [[1, 2, 3, 4], 7],
      [[1, 2, 3], 0],
      [[], 0],
      [[], 5],
      [[0, 1, 2], 0],
      [[10_000], 10_000],
    ];
    const 이름 = 목록.map(
      ([nums, target]) => `subsetSum([${nums.join(", ")}], ${target})`,
    );
    const 폭 = Math.max(...이름.map((s) => s.length));
    return 목록
      .map(
        ([nums, target], i) =>
          `${pad(이름[i] as string, 폭)}  →  ${yn(subsetSum(nums, target))}`,
      )
      .join("\n");
  },

  /** `purpose.real` — 인용한 상수를 넣으면 표의 열이 몇 개가 되는가. */
  satoshiColumns: () => {
    const n = 20n;
    return table(
      ["무엇", "값"],
      [
        ["COIN — 1 BTC 의 사토시", comma(COIN)],
        ["MAX_MONEY — 21,000,000 × COIN", comma(MAX_MONEY)],
        ["표의 열 수 (0 … MAX_MONEY)", comma(MAX_MONEY + 1n)],
        ["원소 20 개일 때 표 칸 수", big((n + 1n) * (MAX_MONEY + 1n))],
        [
          "원소 20 개를 절반으로 갈랐을 때 부분합",
          comma(2n ** 10n + 2n ** 10n),
        ],
      ],
    );
  },

  /** `deep.math` ② — `|R_i| ≤ min(2^i, T+1)` 을 등호가 서는 입력에서 검산한다. */
  saturation: () => {
    const pow = Array.from({ length: 17 }, (_, k) => 2 ** k);
    const sizes = reachable(pow, 10_000);
    return table(
      ["i", "2^i", "T+1", "min(2^i, T+1)", "실제 |R_i|"],
      [0, 6, 12, 13, 14, 15, 16].map((i) => [
        String(i),
        comma(2 ** i),
        comma(10_001),
        comma(Math.min(2 ** i, 10_001)),
        comma(sizes[i] as number),
      ]),
    );
  },

  /** `deep.math` ④ — 부분집합 수와 표 칸 수가 어디서 뒤집히는가. */
  crossover: () =>
    table(
      ["원소 수 n", "부분집합 2^n", "표 칸 수 (n+1)(T+1)", "더 적은 쪽"],
      [16, 17, 18, 19, 1000].map((n) => {
        const subsets = 2n ** BigInt(n);
        const cells = BigInt(n + 1) * 10_001n;
        return [
          comma(n),
          big(subsets),
          comma(cells),
          subsets < cells ? "부분집합" : "표",
        ];
      }),
    ),

  /** `perf.worst` — 조기 종료를 붙여도 최악은 그대로다. */
  earlyExit: () => {
    const T = 10_000;
    const 입력: [string, number[]][] = [
      ["원소 1,000 개가 전부 10,000", repeat(10_000, 1000)],
      ["원소 1,000 개가 전부 20", repeat(20, 1000)],
      [
        "원소 1,000 개가 (i mod 100) + 1",
        Array.from({ length: 1000 }, (_, i) => (i % 100) + 1),
      ],
      ["원소 1,000 개가 전부 1", repeat(1, 1000)],
      ["원소 1,000 개가 전부 21", repeat(21, 1000)],
    ];
    return table(
      [
        "입력 (target = 10,000)",
        "답",
        "정본이 정한 칸",
        "조기 종료판이 정한 칸",
      ],
      입력.map(([이름, nums]) => [
        이름,
        yn(subsetSum(nums, T)),
        comma(decidedCells(nums, T, false)),
        comma(decidedCells(nums, T, true)),
      ]),
    );
  },

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  mutantSameRow: () =>
    table(
      ["입력", "바른 코드", "같은 줄에서 읽은 코드"],
      변이표.map(([nums, target]) => [
        label(nums, target),
        yn(subsetSum(nums, target)),
        yn(같은줄에서읽기.subsetSum(nums, target)),
      ]),
    ),
};
