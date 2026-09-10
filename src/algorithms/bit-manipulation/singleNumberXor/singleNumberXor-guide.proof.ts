/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { singleNumberXor } from "./singleNumberXor-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

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
 * `[4, 1, 2, 1, 2]` 를 고른 이유는 셋이고, 본문 「수행으로 알아보는 알고리즘」 도입부가 같은
 * 셋을 적는다. ① 짝을 이루는 두 값 1 과 2 가 **서로 엇갈려** 놓여 있어서 떨어진 짝이
 * 상쇄되는 것이 T5·T6 에서 값으로 확인된다. ② 답 4 가 **맨 앞**이라 「마지막에 겹친 값이
 * 답」으로 읽힐 자리가 없다. ③ 세 값이 서로 다른 비트 자리를 써서(4 는 자리 2, 2 는 자리 1,
 * 1 은 자리 0) 자리마다 따로 켜지고 꺼지는 것이 그림에서 확인된다.
 */
const WALK_INPUT = [4, 1, 2, 1, 2];

/** 전개 입력을 그리는 비트 폭. 최댓값 4 가 자리 2 를 쓰므로 3 이다. */
const WALK_BITS = 3;

/** 제약의 상한. `1 ≤ N ≤ 10^6` 이다. */
const LIMIT_N = 10 ** 6;

/* ────────────────────────── 계측기 ────────────────────────── */

/** 고정 폭 이진 표기. 음수는 32 비트 2 의 보수로 읽는다. */
function bits(value: number, w: number): string {
  const u = value < 0 ? value >>> 0 : value;
  let out = "";
  for (let j = w - 1; j >= 0; j--) {
    out += Math.floor(u / 2 ** j) % 2 === 1 ? "1" : "0";
  }
  return out;
}

/** `value` 의 `j` 번째 비트. 비트 연산을 쓰지 않아 32 비트 자르기와 무관하다. */
function bitAt(value: number, j: number): number {
  return Math.floor(Math.abs(value) / 2 ** j) % 2;
}

/**
 * **정의를 그대로 옮긴 답.** 값마다 등장 횟수를 세어 홀수인 것을 돌려준다. 비트 연산을
 * 쓰지 않으므로 32 비트 자르기의 영향을 안 받고, 그래서 「멈춤」 두 번째의 기준값이 된다.
 */
function answerByDefinition(nums: number[]): number | null {
  const count = new Map<number, number>();
  for (const v of nums) count.set(v, (count.get(v) ?? 0) + 1);
  for (const [v, c] of count) if (c % 2 === 1) return v;
  return null;
}

interface Counted {
  answer: number | null;
  /** 배열·맵·보조 배열의 칸을 한 번 읽거나 쓴 횟수. */
  access: number;
  /** 입력 배열 밖에 새로 잡는 칸의 개수. */
  cells: number;
}

/**
 * **가장 단순한 방법** — 원소마다 배열 전체를 다시 세어 등장 횟수가 홀수인 것을 찾는다.
 * 보조 자료구조가 하나도 없어서 이보다 단순한 절차를 세울 수 없다.
 */
function byRescan(nums: number[]): Counted {
  let access = 0;
  for (let i = 0; i < nums.length; i++) {
    access++;
    const target = nums[i] as number;
    let c = 0;
    // `j` 는 이 글에서 비트 자리 번호이므로 안쪽 칸 번호는 `k` 로 둔다.
    for (let k = 0; k < nums.length; k++) {
      access++;
      if (nums[k] === target) c++;
    }
    if (c % 2 === 1) return { answer: target, access, cells: 3 };
  }
  return { answer: null, access, cells: 3 };
}

/** 답이 맨 뒤에 있을 때 `byRescan` 이 하는 칸 접근 수 — `N(N + 1)` 이다. */
const rescanWorst = (n: number): number => n * (n + 1);

/** **맵으로 등장 횟수 세기.** 시간은 `O(N)` 인데 값 종류만큼 칸을 잡는다. */
function byCountMap(nums: number[]): Counted {
  let access = 0;
  const count = new Map<number, number>();
  for (const v of nums) {
    access += 3; // 배열 읽기 · 맵 읽기 · 맵 쓰기
    count.set(v, (count.get(v) ?? 0) + 1);
  }
  for (const [v, c] of count) {
    access++;
    if (c % 2 === 1) return { answer: v, access, cells: count.size };
  }
  return { answer: null, access, cells: count.size };
}

/**
 * **정렬한 뒤 이웃한 두 칸을 견주기.** 입력을 바꾸지 않으려고 사본을 만든다. 정렬은
 * 병합 정렬로 두어 칸 접근이 실행마다 같게 한다.
 */
function bySortAdjacent(nums: number[]): Counted {
  let access = 0;
  const sorted = nums.slice();
  access += nums.length * 2; // 원본 읽기 + 사본 쓰기

  const merge = (lo: number, hi: number): void => {
    if (hi - lo < 2) return;
    const mid = Math.floor((lo + hi) / 2);
    merge(lo, mid);
    merge(mid, hi);
    const buf: number[] = [];
    let a = lo;
    let b = mid;
    while (a < mid && b < hi) {
      access += 2;
      if ((sorted[a] as number) <= (sorted[b] as number))
        buf.push(sorted[a++] as number);
      else buf.push(sorted[b++] as number);
    }
    while (a < mid) {
      access++;
      buf.push(sorted[a++] as number);
    }
    while (b < hi) {
      access++;
      buf.push(sorted[b++] as number);
    }
    for (let k = 0; k < buf.length; k++) {
      access++;
      sorted[lo + k] = buf[k] as number;
    }
  };
  merge(0, sorted.length);

  let i = 0;
  while (i < sorted.length) {
    let c = 1;
    access++;
    while (i + c < sorted.length) {
      access++;
      if (sorted[i + c] !== sorted[i]) break;
      c++;
    }
    if (c % 2 === 1) {
      return { answer: sorted[i] as number, access, cells: sorted.length + 2 };
    }
    i += c;
  }
  return { answer: null, access, cells: sorted.length + 2 };
}

/** **이 글이 가르치는 절차.** 칸을 한 번씩 읽어 누적기 하나에 겹친다. */
function byXor(nums: number[]): Counted {
  let access = 0;
  let acc = 0;
  for (let i = 0; i < nums.length; i++) {
    access++;
    acc ^= nums[i] as number;
  }
  return { answer: acc, access, cells: 2 };
}

/**
 * 정본이 실행하는 **기본 연산** 수. 비교 · 배열 읽기 · XOR · 대입 · 증가를 각각 하나로 센다.
 * 갈래가 하나뿐이라 `5N + 2` 로 닫힌다.
 */
interface OpCount {
  compare: number;
  read: number;
  xor: number;
  assign: number;
  increment: number;
}

/**
 * 값 자체는 `singleNumberXor` 가 내므로 여기서는 **반복문의 모양만** 따라가며 센다.
 * 갈래가 하나뿐이라 값이 무엇이든 실행하는 연산이 같고, 그래서 이 셈이 정본과 어긋나지 않는다.
 */
function countOps(nums: number[]): OpCount {
  const out: OpCount = {
    compare: 0,
    read: 0,
    xor: 0,
    assign: 0,
    increment: 0,
  };
  out.assign++; // acc = 0
  for (let i = 0; ; i++) {
    out.compare++; // i < nums.length
    if (i >= nums.length) break;
    out.read++; // nums[i]
    out.xor++; // acc ^ nums[i]
    out.assign++; // acc = 그 값
    out.increment++; // i++
  }
  return out;
}

const totalOps = (o: OpCount): number =>
  o.compare + o.read + o.xor + o.assign + o.increment;

/* ────────────────────────── 후보 절차 ────────────────────────── */

/**
 * **누적 연산 후보.** 「같은 값을 두 번 겹치면 사라지는 연산」을 찾는 자리에서, XOR 말고
 * 무엇이 되는지 실제로 실행해 본다. 각 연산의 항등원에서 출발한다.
 */
const FOLDS: {
  name: string;
  unit: number;
  fold: (a: number, b: number) => number;
}[] = [
  { name: "더하기 +", unit: 0, fold: (a, b) => a + b },
  { name: "빼기 -", unit: 0, fold: (a, b) => a - b },
  { name: "비트 OR |", unit: 0, fold: (a, b) => a | b },
  { name: "비트 AND &", unit: -1, fold: (a, b) => a & b },
  { name: "비트 XOR ^", unit: 0, fold: (a, b) => a ^ b },
];

/**
 * **오해대로 적은 절차** — 「같은 값이 여러 번 나오면 한 번만 겹치면 된다」. 값 종류마다
 * 한 번씩만 XOR 한다. 첫 번째 「멈춤」이 이것을 반박한다.
 */
function skipDuplicates(nums: number[]): number {
  const seen = new Set<number>();
  let acc = 0;
  for (const v of nums) {
    if (seen.has(v)) continue;
    seen.add(v);
    acc ^= v;
  }
  return acc;
}

/* ────────────────────────── 걸음 추적 ────────────────────────── */

interface Step {
  label: string;
  branch: string;
  index: string;
  read: string;
  acc: string;
  dec: string;
}

/** 정본을 그대로 따라가며 걸음마다의 값을 모은다. `.sim.ts` 와 같은 표를 쓴다. */
function trace(nums: number[], w: number): Step[] {
  const out: Step[] = [];
  let acc = 0;
  out.push({
    label: "T1",
    branch: "①",
    index: "—",
    read: "—",
    acc: bits(acc, w),
    dec: String(acc),
  });
  for (let i = 0; i < nums.length; i++) {
    const v = nums[i] as number;
    acc ^= v;
    out.push({
      label: `T${i + 2}`,
      branch: "②③",
      index: String(i),
      read: `${v} (${bits(v, w)})`,
      acc: bits(acc, w),
      dec: String(acc),
    });
  }
  out.push({
    label: `T${nums.length + 2}`,
    branch: "② 거짓 · ④",
    index: String(nums.length),
    read: "—",
    acc: bits(acc, w),
    dec: String(acc),
  });
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { singleNumberXor: (nums: number[]) => number };

const REF = new URL("./singleNumberXor-guide.ref.ts", import.meta.url).pathname;

/**
 * **XOR 을 OR 로 바꾼 사본.** 불변식 「바퀴를 시작할 때 `acc` 는 앞 칸들의 XOR 이다」를
 * 유지하던 바로 그 줄이다. OR 은 한 번 세운 자리를 다시 내리지 못해 상쇄가 없어진다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const orMutant = await loadMutant<Impl>(REF, {
  swap: [/acc \^= nums\[i\] as number;/, "acc |= nums[i] as number;"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

const show = (nums: number[]): string => `[${nums.join(", ")}]`;

const label = (nums: number[]): string =>
  nums === WALK_INPUT ? `전개 입력 ${show(nums)}` : show(nums);

/** 문제 예시와 시험 파일에서 가져온 사례. 답의 자리와 등장 횟수가 서로 다르다. */
const SAMPLE_INPUTS: number[][] = [
  WALK_INPUT,
  [2, 2, 1],
  [0, 1, 1, 2, 2],
  [4, 4, 4, 2, 2],
  [1, 1, 2, 2, 7],
  [7],
];

/** 「같은 값을 한 번만 겹친다」는 오해가 갈리는 자리와 안 갈리는 자리를 함께 담은 목록. */
const SKIP_DUP_INPUTS: number[][] = [
  WALK_INPUT,
  [2, 2, 1],
  [5, 5, 5, 1, 1],
  [5, 5, 5],
  [7],
];

/** 32 비트 경계를 넘나드는 사례. 앞 둘은 제약 안이고 뒤 셋은 제약 밖이다. */
const INT32_INPUTS: number[][] = [
  [2 ** 30, 1, 1],
  [2 ** 31 - 1, 3, 3],
  [2 ** 31, 1, 1],
  [2 ** 32 + 5, 3, 3],
  [2 ** 32 + 5, 2 ** 32 + 5, 2 ** 32 + 5, 5, 5],
];

/** 규모를 넓혀 세 방식의 칸 접근을 견주는 자리. 답을 언제나 맨 뒤에 둔다. */
function tailInput(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= (n - 1) / 2; i++) out.push(i, i);
  out.push(12_345);
  return out;
}

/** 길이가 같고 모양만 다른 입력 다섯. 홀수 번 등장하는 값이 언제나 하나다. */
function shapes(n: number): { name: string; nums: number[] }[] {
  const half = (n - 1) / 2;
  const pairs: number[] = [];
  for (let i = 1; i <= half; i++) pairs.push(i, i);
  const sorted = [...pairs].sort((a, b) => a - b);
  return [
    { name: "값이 전부 같다", nums: Array.from({ length: n }, () => 7) },
    { name: "짝이 엇갈려 있다", nums: [...pairs, 12_345] },
    { name: "오름차순으로 정렬돼 있다", nums: [...sorted, 12_345] },
    {
      name: "내림차순으로 정렬돼 있다",
      nums: [...sorted].reverse().concat(12_345),
    },
    {
      name: "값이 2^30 언저리로 크다",
      nums: [...pairs.map((v) => v + 2 ** 30), 2 ** 30 + 12_345],
    },
    {
      name: "음수와 양수가 섞여 있다",
      nums: [
        ...pairs.map((v, k) => (Math.floor(k / 2) % 2 === 0 ? -v : v)),
        -12_345,
      ],
    },
  ];
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 같은 값을 두 번 겹치면 사라지고 0 은 값을 그대로 둔다. */
  conceptCancel: () => {
    const rows: string[][] = [];
    for (const v of [2, 4, 1]) {
      rows.push([
        `${v} (${bits(v, WALK_BITS)})`,
        `${v} (${bits(v, WALK_BITS)})`,
        `${v ^ v} (${bits(v ^ v, WALK_BITS)})`,
        `${v ^ 0} (${bits(v ^ 0, WALK_BITS)})`,
      ]);
    }
    return [
      "같은 값을 두 번 겹치면 사라지고, 0 을 겹치면 값이 그대로다",
      table(["값 v", "다시 겹치는 값", "v ^ v", "v ^ 0"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 가운데 열이 세 줄 모두 0 이다. 오른쪽 열은 원래 값 그대로다",
    ].join("\n");
  },

  /** `concept` — 전개 입력을 자리별로 세워 놓고 어느 자리가 왜 남는지 보인다. */
  conceptColumns: () => {
    const head = [
      "자리 j",
      ...Array.from({ length: WALK_BITS }, (_, k) => String(WALK_BITS - 1 - k)),
    ];
    const rows: string[][] = [];
    for (const [i, v] of WALK_INPUT.entries()) {
      rows.push([`nums[${i}] = ${v}`, ...bits(v, WALK_BITS).split("")]);
    }
    const sums = Array.from({ length: WALK_BITS }, (_, k) => {
      const j = WALK_BITS - 1 - k;
      return WALK_INPUT.reduce((s, v) => s + bitAt(v, j), 0);
    });
    rows.push(["자리마다의 1 의 개수", ...sums.map(String)]);
    rows.push([
      "그 개수의 홀짝",
      ...sums.map((s) => (s % 2 === 1 ? "홀" : "짝")),
    ]);
    const answer = singleNumberXor(WALK_INPUT);
    rows.push([`정본이 낸 답 ${answer}`, ...bits(answer, WALK_BITS).split("")]);
    return [
      `${show(WALK_INPUT)} 를 자리별로 세운 그림`,
      table(head, rows, ["l", "r", "r", "r"]),
      "",
      "└ 아래 두 줄이 자리마다 맞물린다 — 홀이면 1 이고 짝이면 0 이다",
    ].join("\n");
  },

  /** `deep.build` ② — 가장 단순한 방법을 제약 규모에서 반박한다. */
  costNaive: () => {
    const small = [5, 11, 101, 1001].map((n) => {
      const nums = tailInput(n);
      return [
        num(n),
        num(byRescan(nums).access),
        num(rescanWorst(n)),
        num(byXor(nums).access),
      ];
    });
    return [
      "원소마다 배열을 다시 세면 칸 접근이 배열 길이의 제곱을 따라간다",
      "(답을 언제나 맨 뒤에 둔 입력이다)",
      table(
        [
          "배열 길이 N",
          "다시 세기의 칸 접근",
          "N(N + 1)",
          "XOR 누적의 칸 접근",
        ],
        small,
        ["r", "r", "r", "r"],
      ),
      "",
      "제약 상한을 닫힌 형태에 넣으면",
      table(
        ["N", "다시 세기 N(N + 1)", "XOR 누적 N", "몇 배인가"],
        [
          [
            num(LIMIT_N),
            num(rescanWorst(LIMIT_N)),
            num(LIMIT_N),
            num(rescanWorst(LIMIT_N) / LIMIT_N),
          ],
        ],
        ["r", "r", "r", "r"],
      ),
      "",
      "└ 둘째 열과 셋째 열이 네 줄 모두 같아서 닫힌 형태가 실측과 어긋나지 않는다.",
      `  제약 상한에서는 칸 접근이 ${num(rescanWorst(LIMIT_N))} 번이고, 1 초 안에 끝나지 않는다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 네 방식으로 처리하고 두 계수를 나란히 센다. */
  costFourWays: () => {
    const ways: [string, (nums: number[]) => Counted][] = [
      ["원소마다 다시 세기", byRescan],
      ["맵으로 횟수 세기", byCountMap],
      ["정렬하고 이웃 견주기", bySortAdjacent],
      ["XOR 누적", byXor],
    ];
    const inputs: [string, number[]][] = [
      [`전개 입력 N = ${WALK_INPUT.length}`, WALK_INPUT],
      ["답이 맨 뒤 N = 1,001", tailInput(1001)],
    ];
    const rows = ways.map(([name, fn]) => {
      const cells: string[] = [name];
      for (const [, nums] of inputs) {
        const got = fn(nums);
        // 답이 갈리면 대조가 아니라 서로 다른 문제를 잰 것이다.
        const want = singleNumberXor(nums);
        if (got.answer !== want) {
          throw new Error(
            `${name} 의 답이 정본과 다르다 — ${got.answer} 대 ${want}`,
          );
        }
        cells.push(num(got.access), num(got.cells));
      }
      return cells;
    });
    return [
      table(
        [
          "방식",
          `${inputs[0]?.[0]} 접근`,
          "잡는 칸",
          `${inputs[1]?.[0]} 접근`,
          "잡는 칸",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 네 방식이 같은 답을 낸다. 마지막 줄만 두 열이 다 가장 작고, 잡는 칸이 배열 길이와",
      "  무관하게 2 로 고정된다 — 누적기 하나와 칸 번호 하나다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 누적 연산 후보 다섯을 같은 입력에 실행해 넷을 반박한다. */
  foldCandidates: () => {
    const answer = singleNumberXor(WALK_INPUT);
    const rows = FOLDS.map(({ name, unit, fold }) => {
      const got = WALK_INPUT.reduce(fold, unit);
      const twice = fold(fold(unit, 5), 5);
      return [
        name,
        String(unit),
        String(got),
        got === answer ? "같다" : "다르다",
        String(twice),
        twice === unit ? "제자리다" : "아니다",
      ];
    });
    return [
      `${show(WALK_INPUT)} 를 다섯 연산으로 누적한 결과 (옳은 답은 ${answer} 다)`,
      table(
        [
          "연산",
          "항등원",
          "누적 결과",
          "답과 같은가",
          "항등원에 5 를 두 번 겹치면",
          "제자리인가",
        ],
        rows,
        ["l", "r", "r", "l", "r", "l"],
      ),
      "",
      "└ 다섯째 열이 항등원으로 돌아온 연산은 XOR 하나뿐이고, 넷째 열에서 답을 맞힌 것도",
      "  그 하나다. 두 열이 같은 줄에서 갈리는 것이 이 절차가 XOR 이어야 하는 이유다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 등장 횟수의 홀짝만 결과를 정한다는 것을 값으로 낸다. */
  oddEvenTable: () => {
    const v = 5;
    const counts = Array.from({ length: 9 }, (_, c) => c);
    const rows = counts.map((c) => {
      const nums = Array.from({ length: c }, () => v);
      return [
        String(c),
        c % 2 === 0 ? "짝수" : "홀수",
        String(byXor(nums).answer),
      ];
    });

    // 전개 입력의 칸 순서를 전부 바꿔 가며 답이 같은지 센다.
    const permute = (rest: number[], acc: number[], out: number[][]): void => {
      if (rest.length === 0) {
        out.push([...acc]);
        return;
      }
      for (let i = 0; i < rest.length; i++) {
        acc.push(rest[i] as number);
        permute([...rest.slice(0, i), ...rest.slice(i + 1)], acc, out);
        acc.pop();
      }
    };
    const orders: number[][] = [];
    permute(WALK_INPUT, [], orders);
    const distinct = new Set(orders.map((o) => o.join(",")));
    const answers = new Set(orders.map((o) => singleNumberXor(o)));

    return [
      `값 ${v} 하나만 c 번 넣은 배열의 답`,
      table(["등장 횟수 c", "홀짝", "XOR 누적의 결과"], rows, ["r", "l", "r"]),
      "",
      `${show(WALK_INPUT)} 의 칸 순서를 전부 바꿔 가며`,
      table(
        ["세어 본 순서", "그중 서로 다른 나열", "나온 답의 가짓수", "그 답"],
        [
          [
            num(orders.length),
            num(distinct.size),
            num(answers.size),
            [...answers].join(", "),
          ],
        ],
        ["r", "r", "r", "r"],
      ),
      "",
      "└ 위 표의 셋째 열은 c 가 짝수면 0 이고 홀수면 5 다. 아래 표는 순서를 아무리 바꿔도",
      "  답이 하나로 고정된다는 것이다 — 결과를 정하는 것은 자리가 아니라 등장 횟수의 홀짝이다",
    ].join("\n");
  },

  /** `deep.walk` — 걸음마다의 상태값. */
  walkTrace: () => {
    const rows = trace(WALK_INPUT, WALK_BITS).map((s) => [
      s.label,
      s.branch,
      s.index,
      s.read,
      s.acc,
      s.dec,
    ]);
    return [
      table(["걸음", "갈래", "i", "nums[i]", "acc (2진)", "acc (10진)"], rows, [
        "l",
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `└ 답은 ${singleNumberXor(WALK_INPUT)} 다. 자리 0 은 T3 에서 켜지고 T5 에서 꺼지며,`,
      "  자리 1 은 T4 에서 켜지고 T6 에서 꺼진다. 자리 2 는 T2 에서 켜진 뒤 한 번도 안 바뀐다",
    ].join("\n");
  },

  /** `deep.walk` 2단계 — 앞 두 바퀴만 실행한 결과. */
  walkFirstTwo: () => {
    const steps = trace(WALK_INPUT, WALK_BITS).slice(0, 3);
    const rows = steps.map((s) => [s.label, s.index, s.read, s.acc, s.dec]);
    return [
      table(["걸음", "i", "nums[i]", "acc (2진)", "acc (10진)"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 두 바퀴에서는 아직 아무것도 사라지지 않았다. 4 와 1 이 서로 다른 자리를 써서",
      "  두 자리가 함께 켜져 있는 상태다",
    ].join("\n");
  },

  /** 멈춤 1 — 「같은 값은 한 번만 겹치면 된다」는 오해를 반박한다. */
  pauseSkipDuplicates: () => {
    const rows = SKIP_DUP_INPUTS.map((nums) => {
      const right = singleNumberXor(nums);
      const wrong = skipDuplicates(nums);
      return [
        label(nums),
        String(right),
        String(wrong),
        right === wrong ? "같다" : "틀리다",
      ];
    });
    return [
      table(
        ["입력", "정본이 낸 답", "오해대로 적은 절차가 낸 답", "판정"],
        rows,
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 마지막 두 줄에서는 답이 안 틀린다. 건너뛰면 그 값의 등장 횟수가 1 로 바뀌는데,",
      "  원래도 홀수였던 값은 1 이 되어도 홀수라 답이 안 바뀐다. 두 줄 다 짝수 번 등장한",
      "  값이 하나도 없는 입력이고, 그런 입력만 시험하면 이 결함을 못 본다",
    ].join("\n");
  },

  /** 멈춤 2 — JavaScript 비트 연산의 32 비트 경계. */
  pauseInt32: () => {
    const rows = INT32_INPUTS.map((nums) => {
      const want = answerByDefinition(nums);
      const got = singleNumberXor(nums);
      return [
        show(nums),
        want === null ? "없다" : num(want),
        num(got),
        want === got ? "같다" : "틀리다",
      ];
    });
    return [
      table(["입력", "정의가 낸 답", "정본이 낸 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 제약이 |nums[i]| < 2^31 = ${num(2 ** 31)} 이라 위 두 줄까지가 이 문제의 범위다.`,
      "  셋째 줄은 자리 31 이 부호로 읽혀 값의 부호가 뒤집힌 것이고, 넷째·다섯째 줄은",
      "  자리 32 위가 잘려 서로 다른 두 값이 같은 값으로 보인 것이다",
    ].join("\n");
  },

  /** `related` — 값을 겹칠 때마다 자리가 뒤집히고 두 번이면 제자리다. */
  involutionToggle: () => {
    const v = 1;
    const rows: string[][] = [];
    let acc = 0;
    for (let t = 0; t <= 4; t++) {
      rows.push([String(t), bits(acc, WALK_BITS), String(acc)]);
      acc ^= v;
    }
    const walk = trace(WALK_INPUT, WALK_BITS);
    return [
      `값 ${v} (${bits(v, WALK_BITS)}) 을 0 에 몇 번 겹쳤는가`,
      table(["겹친 횟수", "acc (2진)", "acc (10진)"], rows, ["r", "r", "r"]),
      "",
      "전개에서 같은 자리",
      table(
        ["걸음", "nums[i]", "acc (2진)"],
        [
          ["T3", walk[2]?.read ?? "", walk[2]?.acc ?? ""],
          ["T4", walk[3]?.read ?? "", walk[3]?.acc ?? ""],
          ["T5", walk[4]?.read ?? "", walk[4]?.acc ?? ""],
        ],
        ["l", "r", "r"],
      ),
      "",
      "└ 위 표의 둘째 열이 두 줄마다 제자리로 돌아온다. 아래 표에서도 T3 이 켠 자리 0 을",
      "  T5 가 그대로 껐고, 그 사이의 T4 는 다른 자리만 바꿨다",
    ].join("\n");
  },

  /** `deep.math` ② 검산 — 자리마다의 1 의 개수와 그 홀짝. */
  mathCheck: () => {
    const answer = singleNumberXor(WALK_INPUT);
    const rows = Array.from({ length: WALK_BITS }, (_, k) => {
      const j = WALK_BITS - 1 - k;
      const column = WALK_INPUT.map((v) => bitAt(v, j));
      const sum = column.reduce((s, b) => s + b, 0);
      return [
        String(j),
        String(2 ** j),
        column.join(" "),
        String(sum),
        String(sum % 2),
        String(bitAt(answer, j)),
      ];
    });
    return [
      table(
        [
          "자리 j",
          "2^j",
          "nums 의 자리 j 비트",
          "합",
          "합 mod 2",
          "정본이 낸 답의 자리 j",
        ],
        rows,
        ["r", "r", "l", "r", "r", "r"],
      ),
      "",
      `└ 다섯째 열과 여섯째 열이 세 줄 모두 같다. 자리별 합의 홀짝을 모으면 ${answer} 다`,
    ].join("\n");
  },

  /** `deep.math` ③ 유도의 확인 — 홀수 번 등장하는 값이 둘이면 그 둘의 XOR 이 남는다. */
  mathTwoOdds: () => {
    const cases: [number[], number, number][] = [
      [[1, 1, 3, 5], 3, 5],
      [[4, 1, 2, 1, 2, 7], 4, 7],
      [[9, 9, 9, 6, 6, 6], 9, 6],
    ];
    const rows = cases.map(([nums, a, b]) => [
      show(nums),
      `${a} · ${b}`,
      String(singleNumberXor(nums)),
      String(a ^ b),
      singleNumberXor(nums) === (a ^ b) ? "같다" : "틀리다",
    ]);
    return [
      table(
        ["입력", "홀수 번 등장한 값", "정본이 낸 값", "그 둘의 XOR", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 셋째 열과 넷째 열이 세 줄 모두 같다. 홀수 번 등장하는 값이 하나라는 조건을 빼면",
      "  남는 것은 그 값들의 XOR 이고, 답이 하나로 정해지는 것은 그 조건 덕분이다",
    ].join("\n");
  },

  /** `deep.math` ④ 계수 — 제약 규모에서 두 절차의 기본 연산. */
  mathScale: () => {
    const rows = [11, 1001, LIMIT_N].map((n) => [
      num(n),
      num(5 * n + 2),
      num(rescanWorst(n)),
      (rescanWorst(n) / (5 * n + 2)).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    ]);
    const measured = [11, 1001].map((n) => [
      num(n),
      num(totalOps(countOps(tailInput(n)))),
      num(5 * n + 2),
    ]);
    return [
      table(["N", "XOR 누적 5N + 2", "다시 세기 N(N + 1)", "몇 배인가"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "닫힌 형태를 실측과 맞춘다 — 길이를 홀수로 맞춘 입력이다",
      table(["N", "실제로 센 기본 연산", "5N + 2"], measured, ["r", "r", "r"]),
      "",
      "└ 아래 표의 두 열이 같다. 위 표의 마지막 줄에서 제약 상한의 비가 나온다",
    ].join("\n");
  },

  /** `invariant` — XOR 을 OR 로 바꾸면 상쇄가 없어진다. */
  mutantOr: () => {
    const rows = SAMPLE_INPUTS.map((nums) => {
      const right = singleNumberXor(nums);
      const wrong = orMutant.singleNumberXor(nums);
      return [
        label(nums),
        String(right),
        String(wrong),
        right === wrong ? "같다" : "틀리다",
      ];
    });
    const wrong = rows.filter((r) => r[3] === "틀리다").length;
    return [
      table(["입력", "정본이 낸 답", "OR 로 바꾼 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 여섯 줄 중 ${["", "한", "두", "세", "네", "다섯", "여섯"][wrong]} 줄에서 답이 틀리다. OR 은 한 번 세운 자리를 다시 못 내려`,
      "  짝수 번 등장한 값의 자리가 그대로 남는다. 남은 두 줄은 사유가 서로 다르다 —",
      "  [1, 1, 2, 2, 7] 은 짝수 번 등장한 1 과 2 의 자리가 답 7 (111) 안에 이미 들어 있어",
      "  값이 우연히 같아진 것이고, [7] 은 겹칠 값이 하나뿐이라 두 연산이 갈릴 자리가 없다",
    ].join("\n");
  },

  /** `invariant` — 경계에 있는 입력에서 불변식이 유지되는가. */
  invariantEdges: () => {
    const edges: [string, number[]][] = [
      ["빈 배열 (제약 밖)", []],
      ["원소 하나", [42]],
      ["0 이 답", [0, 1, 1, 2, 2]],
      ["답이 음수", [-5, 1, 1]],
      ["음수끼리 상쇄", [-1, -1, -2, 3, 3]],
      ["같은 값이 세 번", [5, 5, 5, 1, 1]],
      ["자리 30 이 켜진 값", [2 ** 30, 1, 1]],
    ];
    const rows = edges.map(([name, nums]) => {
      const want = answerByDefinition(nums);
      const got = singleNumberXor(nums);
      return [
        name,
        show(nums),
        want === null ? "없다" : num(want),
        num(got),
        want === null
          ? got === 0
            ? "0 을 낸다"
            : "틀리다"
          : want === got
            ? "같다"
            : "틀리다",
      ];
    });
    return [
      table(["경계", "입력", "정의가 낸 답", "정본이 낸 답", "판정"], rows, [
        "l",
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 첫 줄은 제약(N ≥ 1) 밖이라 답이 정의되지 않는다. 그 자리에서 정본은 바퀴를 한 번도",
      "  실행하지 않고 항등원 0 을 그대로 낸다 — 따로 방어하는 줄이 없어도 어긋나지 않는다",
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음을 무리로 갈라 기본 연산을 센다. */
  perfCount: () => {
    const o = countOps(WALK_INPUT);
    const n = WALK_INPUT.length;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "0", "1", "0"],
      [
        "바퀴",
        `T2 부터 T${n + 1} 까지`,
        String(n),
        String(n),
        String(n),
        String(n),
        String(n),
        String(n),
      ],
      ["종료 검사와 반환", `T${n + 2}`, "1", "1", "0", "0", "0", "0"],
      [
        "합계",
        "",
        String(n + 2),
        String(o.compare),
        String(o.read),
        String(o.xor),
        String(o.assign),
        String(o.increment),
      ],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "비교",
          "칸 읽기",
          "XOR",
          "대입",
          "증가",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ 다섯 계수를 합치면 ${totalOps(o)} 이고 N = ${n} 를 5N + 2 에 넣은 값과 같다.`,
      "  비교와 대입만 1 이 더 붙는다 — 마지막 거짓 판정 한 번과 acc 의 초기 대입 한 번이다",
    ].join("\n");
  },

  /** `perf.worst` — 길이가 같으면 모양이 달라도 기본 연산이 같다. */
  worstShape: () => {
    const n = 1001;
    const rows = shapes(n).map(({ name, nums }) => {
      const o = countOps(nums);
      return [
        name,
        num(nums.length),
        num(o.read),
        num(totalOps(o)),
        num(singleNumberXor(nums)),
      ];
    });
    return [
      `길이를 ${num(n)} 로 맞추고 모양만 바꾼 입력 여섯`,
      table(["입력의 모양", "N", "칸 읽기", "기본 연산", "답"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "제약 상한에서",
      table(
        ["N", "칸 읽기", "기본 연산 5N + 2"],
        [[num(LIMIT_N), num(LIMIT_N), num(5 * LIMIT_N + 2)]],
        ["r", "r", "r"],
      ),
      "",
      "└ 위 표의 셋째·넷째 열이 여섯 줄 모두 같다. 값의 크기도, 정렬 여부도, 부호도 비용을",
      "  바꾸지 않는다 — 이 절차에서 최악을 정하는 것은 배열 길이 하나뿐이다",
    ].join("\n");
  },

  /** `selfcheck` — 답이 붙는 문제의 근거. */
  checkMidway: () => {
    const walk = trace(WALK_INPUT, WALK_BITS);
    const prefix = WALK_INPUT.slice(0, 3);
    const rows = [
      ["T4 까지 읽은 칸", show(prefix), walk[3]?.acc ?? "", walk[3]?.dec ?? ""],
      [
        "끝까지 읽은 칸",
        show(WALK_INPUT),
        walk[walk.length - 1]?.acc ?? "",
        walk[walk.length - 1]?.dec ?? "",
      ],
    ];
    return [
      table(["어디까지", "읽은 값", "acc (2진)", "acc (10진)"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      `└ 윗줄의 ${walk[3]?.dec ?? ""} 은 ${show(prefix)} 를 겹친 값이고, 그 셋은 각각 한 번씩이라`,
      "  세 값이 다 남아 있는 상태다. 배열에 없는 값이 나온 것이 아니라 세 값이 겹쳐 있는 것이다",
    ].join("\n");
  },
};
