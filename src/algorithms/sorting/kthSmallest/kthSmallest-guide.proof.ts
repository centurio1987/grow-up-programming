/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts kthSmallest-guide.md
 *
 * 계수를 세는 블록은 정본을 그대로 부를 수 없다 — 정본은 견주기 횟수를 세지 않는다. 그래서
 * 세는 사본 `countSelect` 를 두되, **그 사본이 정본과 같은 답을 내는지 입력마다 확인**하고
 * 어긋나면 던진다(`agree`). 사본이 정본에서 갈라지면 그 자리에서 실패한다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { worstInput } from "./kthSmallest-guide.alt.ts";
import { kthSmallest } from "./kthSmallest-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 머리줄 하나와 본문 여러 줄을 열 폭에 맞춰 그린다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬. */
function table(head: string[], rows: string[][]): string {
  const cols = head.length;
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
    );
  }
  const line = (cells: string[]): string =>
    cells
      .map((v, c) => (c === 0 ? pad(v, w[c] ?? 0) : padL(v, w[c] ?? 0)))
      .join("   ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

const num = (n: number): string => n.toLocaleString("en-US");

/** `25,002.6 배` 꼴. 정수 자리에도 쉼표를 넣어 표의 다른 열과 읽는 법을 맞춘다. */
const ratio = (a: number, b: number): string =>
  `${(a / b).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} 배`;

/* ────────────────────────── 세는 사본 ────────────────────────── */

const swap = (a: number[], x: number, y: number): void => {
  const t = a[x] as number;
  a[x] = a[y] as number;
  a[y] = t;
};

type Place = (lo: number, hi: number) => number;

const MIDDLE: Place = (lo, hi) => lo + Math.floor((hi - lo) / 2);
const FIRST: Place = (lo) => lo;
const LAST: Place = (_lo, hi) => hi;

/** 정본과 같은 절차. 견주기 횟수와 구간 크기 자취를 함께 낸다. */
function countSelect(
  src: number[],
  k: number,
  at: Place = MIDDLE,
): { cmp: number; sizes: number[]; out: number } {
  const a = [...src];
  const target = k - 1;
  let lo = 0;
  let hi = a.length - 1;
  let cmp = 0;
  const sizes: number[] = [];
  while (lo < hi) {
    sizes.push(hi - lo + 1);
    const m = at(lo, hi);
    swap(a, m, hi);
    const pivot = a[hi] as number;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      cmp++;
      if ((a[j] as number) < pivot) {
        swap(a, i, j);
        i++;
      }
    }
    swap(a, i, hi);
    if (i === target) return { cmp, sizes, out: a[i] as number };
    if (i > target) hi = i - 1;
    else lo = i + 1;
  }
  sizes.push(1);
  return { cmp, sizes, out: a[lo] as number };
}

/** 세는 사본이 정본과 갈라지면 여기서 실패한다. */
function agree(src: number[], k: number): { cmp: number; sizes: number[] } {
  const mine = countSelect(src, k);
  const ref = kthSmallest([...src], k);
  if (mine.out !== ref) {
    throw new Error(
      `세는 사본이 정본과 다른 답을 냈다 — 사본 ${mine.out} ≠ 정본 ${ref}`,
    );
  }
  return { cmp: mine.cmp, sizes: mine.sizes };
}

/** 같은 분할 규칙으로 **양쪽 다** 재귀하면 정렬이 된다. 견주기만 센다. */
function countSort(src: number[]): number {
  const a = [...src];
  let cmp = 0;
  const go = (lo: number, hi: number): void => {
    if (hi - lo < 1) return;
    const m = MIDDLE(lo, hi);
    swap(a, m, hi);
    const pivot = a[hi] as number;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      cmp++;
      if ((a[j] as number) < pivot) {
        swap(a, i, j);
        i++;
      }
    }
    swap(a, i, hi);
    go(lo, i - 1);
    go(i + 1, hi);
  };
  go(0, a.length - 1);
  return cmp;
}

/* ────────────────────────── ① 변이 ────────────────────────── */

/**
 * 불변식을 세우던 줄(`const target = k - 1;`) 하나만 바꾼 사본. **정본 소스에서 기계로
 * 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const broken = await loadMutant<{
  kthSmallest(A: number[], k: number): number;
}>(new URL("./kthSmallest-guide.ref.ts", import.meta.url).pathname, {
  swap: [/const target = k - 1;/, "const target = k;"],
});

const MUTANT_INPUTS: [number[], number][] = [
  [[7, 10, 4, 3, 20, 15], 4],
  [[3, 1, 2], 1],
  [[-5, 0, 5, -10, 10], 1],
];

const mutantRows = MUTANT_INPUTS.map(([input, k]) => ({
  label: `[${input.join(" ")}]  k=${k}`,
  correct: kthSmallest([...input], k),
  broken: broken.kthSmallest([...input], k),
}));

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (mutantRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
  );
}

/* ────────────────────────── ② 닫힌 형태 ────────────────────────── */

/** 가장 고른 갈림 — 목표가 속한 쪽이 매번 `⌊n/2⌋` 칸이다. */
const evenSplit = (n: number): number =>
  n <= 1 ? 0 : n - 1 + evenSplit(Math.floor(n / 2));

/* ────────────────────────── ③ 순열 전수 ────────────────────────── */

function* permutations(arr: number[]): Generator<number[]> {
  if (arr.length <= 1) {
    yield [...arr];
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) yield [arr[i] as number, ...p];
  }
}

const ALL8 = [...permutations([0, 1, 2, 3, 4, 5, 6, 7])];

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /**
   * 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다 — 옛 이해 시험 `V5` 가
   * 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만 달라도 잡는다.
   */
  "mutant-target": () =>
    table(
      ["입력", "바른 코드", "target = k 로 바꾼 코드"],
      mutantRows.map((r) => [r.label, String(r.correct), String(r.broken)]),
    ),

  /** `deep.build` ④ — 같은 입력·같은 분할 규칙에서 양쪽 재귀와 한쪽 재귀. */
  "split-vs-sort": () => {
    const rows = [16, 64, 256, 1024].map((n) => {
      const A = Array.from({ length: n }, (_, i) => (i * 7919) % 10_007);
      const k = n / 2;
      const one = agree(A, k);
      return [
        num(n),
        num(countSort(A)),
        num(one.cmp),
        ratio(countSort(A), one.cmp),
      ];
    });
    return table(["칸 수 n", "양쪽 재귀", "한쪽 재귀", "차이"], rows);
  },

  /** `deep.build` ⑥ — 기준값 자리 셋을 입력 넷에 걸고 k = 1..8 을 모두 더한다. */
  "pivot-places": () => {
    const inputs: [string, number[]][] = [
      ["정렬된 [0 1 2 3 4 5 6 7]", [0, 1, 2, 3, 4, 5, 6, 7]],
      ["역순 [7 6 5 4 3 2 1 0]", [7, 6, 5, 4, 3, 2, 1, 0]],
      ["뒤섞인 [5 2 8 1 9 3 7 4]", [5, 2, 8, 1, 9, 3, 7, 4]],
      ["전부 같음 [2 2 2 2 2 2 2 2]", [2, 2, 2, 2, 2, 2, 2, 2]],
    ];
    const places: [string, Place][] = [
      ["첫 칸", FIRST],
      ["중앙", MIDDLE],
      ["끝 칸", LAST],
    ];
    const rows = inputs.map(([name, A]) => [
      name,
      ...places.map(([, at]) => {
        let sum = 0;
        for (let k = 1; k <= A.length; k++) sum += countSelect(A, k, at).cmp;
        return num(sum);
      }),
    ]);
    return table(["입력 (n = 8)", "첫 칸", "중앙", "끝 칸"], rows);
  },

  /** `deep.build` ③ — 정렬이 알아내는 것과 자리 하나가 요구하는 것의 견주기 하한. */
  "lower-bounds": () => {
    let lgFactorial = 0;
    for (let i = 2; i <= 100_000; i++) lgFactorial += Math.log2(i);
    const whole = Math.round(lgFactorial);
    const one = 100_000 - 1;
    return table(
      ["n = 100,000 에서 알아내는 것", "견주기 하한"],
      [
        ["줄 전체의 순서   log₂(n!)", num(whole)],
        ["자리 하나        n − 1", num(one)],
        ["", ratio(whole, one)],
      ],
    );
  },

  /** `deep.math` ④ — 두 극단의 닫힌 형태에 제약 규모를 넣는다. */
  "cost-extremes": () => {
    const rows = [8, 16, 1024, 100_000].map((n) => [
      num(n),
      num(evenSplit(n)),
      num(2 * n - 2),
      num((n * (n - 1)) / 2),
      ratio((n * (n - 1)) / 2, evenSplit(n)),
    ]);
    return table(
      ["칸 수 n", "가장 고른 갈림", "상한 2n − 2", "한쪽이 비는 갈림", "차이"],
      rows,
    );
  },

  /**
   * `perf.worst` — 역산한 배열이 실제로 상한에 도달하는가, 그리고 **다른 기준값 규칙을
   * 겨냥한 입력**은 이 규칙에서 어떻게 되는가.
   */
  "worst-input": () => {
    const rows = [6, 8, 16, 1024].map((n) => {
      const A = worstInput(n);
      const r = agree(A, n);
      return [
        `worstInput(${num(n)})${n <= 8 ? `  [${A.join(" ")}]` : ""}`,
        num(n),
        num(n),
        num(r.cmp),
        num((n * (n - 1)) / 2),
      ];
    });

    // 값이 전부 같은 배열 — 의도하지 않아도 실무에서 들어온다.
    const same = new Array<number>(1024).fill(5);
    rows.push([
      "전부 같은 값 [5 5 … 5]",
      num(1024),
      num(1024),
      num(agree(same, 1024).cmp),
      num((1024 * 1023) / 2),
    ]);

    // 넘파이 주석이 최악의 예로 드는 입력. 저쪽은 세 값의 중앙을 기준값으로 쓴다.
    const roll = Array.from({ length: 1024 }, (_, i) => (i + 512) % 1024);
    rows.push([
      "np.roll(arange(1024), 512)",
      num(1024),
      num(513),
      num(agree(roll, 513).cmp),
      num((1024 * 1023) / 2),
    ]);

    return table(["입력", "칸 수 n", "묻는 순번", "견주기", "n(n−1)/2"], rows);
  },

  /**
   * `perf.bounds` — 규모를 키웠을 때 평균이 `n` 의 몇 배로 가는가.
   *
   * 순열은 고정 씨앗 선형 합동 생성기로 만든다 — 난수를 쓰면 실행마다 값이 달라 대조가
   * 성립하지 않는다.
   */
  "average-large": () => {
    let seed = 20260903;
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const TRIALS = 500;
    const rows: string[][] = [];
    for (const n of [64, 1024, 4096]) {
      const cells: string[] = [num(n)];
      for (const k of [1, Math.floor(n / 2) + 1, n]) {
        let sum = 0;
        for (let r = 0; r < TRIALS; r++) {
          const a = Array.from({ length: n }, (_, i) => i);
          for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(next() * (i + 1));
            swap(a, i, j);
          }
          sum += countSelect(a, k).cmp;
        }
        cells.push(`${(sum / TRIALS / n).toFixed(2)} n`);
      }
      rows.push(cells);
    }
    return table(["칸 수 n", "k = 1", "k = n/2 + 1", "k = n"], rows);
  },

  /** `perf.bounds` — n = 8 의 모든 순열을 k 마다 전부 실행한 평균. */
  "average-by-k": () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => {
      let sum = 0;
      let worst = 0;
      let best = Number.POSITIVE_INFINITY;
      let atBound = 0;
      for (const p of ALL8) {
        const c = countSelect(p, k).cmp;
        sum += c;
        if (c > worst) worst = c;
        if (c < best) best = c;
        if (c === 28) atBound++;
      }
      return [
        `k = ${k}`,
        (sum / ALL8.length).toFixed(2),
        num(best),
        num(worst),
        num(atBound),
      ];
    });
    return table(
      [
        "묻는 순번",
        "평균 견주기",
        "가장 적을 때",
        "가장 많을 때",
        "28 을 내는 순열",
      ],
      rows,
    );
  },
};
