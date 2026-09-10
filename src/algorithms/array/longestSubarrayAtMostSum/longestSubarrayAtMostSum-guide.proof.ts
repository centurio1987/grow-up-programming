/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts longestSubarrayAtMostSum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { longestSubarrayAtMostSum } from "./longestSubarrayAtMostSum-guide.ref.ts";

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

/** `[1 2 1 0 1 1 0]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

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

/* ────────────────────────── 계측기 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK: number[] = [1, 2, 1, 0, 1, 1, 0];
const WALK_S = 4;

/**
 * 방식 A — 시작점 `l` 마다 오른쪽 끝을 처음부터 다시 더한다.
 *
 * 비음의 정수라 합이 상한을 넘은 뒤로는 더 늘려도 줄지 않으므로 그 자리에서 멈춘다.
 * 세는 것은 **창의 합을 고치는 연산 수**(덧셈)다.
 */
function restartEachStart(
  nums: number[],
  S: number,
): { best: number; ops: number; perStart: { count: number; over: boolean }[] } {
  let best = 0;
  let ops = 0;
  const perStart: { count: number; over: boolean }[] = [];
  for (let l = 0; l < nums.length; l++) {
    let sum = 0;
    let count = 0;
    let over = false;
    for (let r = l; r < nums.length; r++) {
      sum += nums[r] as number;
      ops++;
      count++;
      if (sum > S) {
        over = true;
        break;
      }
      best = Math.max(best, r - l + 1);
    }
    perStart.push({ count, over });
  }
  return { best, ops, perStart };
}

/**
 * 방식 B — 왼쪽 끝을 `K` 칸까지 되돌려 보는 절차.
 *
 * `K = 0` 이면 되돌리지 않는다. 그것이 `.ref.ts` 의 절차와 같은 것이고, 나머지 `K` 는
 * 「되돌려도 답은 같지만 연산이 는다」를 값으로 보이기 위한 대조군이다.
 * 세는 것은 방식 A 와 같은 것 — 창의 합을 고치는 연산 수(덧셈 + 뺄셈)다.
 */
function rewindBy(
  nums: number[],
  S: number,
  K: number,
): { best: number; ops: number } {
  let best = 0;
  let sum = 0;
  let l = 0;
  let ops = 0;
  for (let r = 0; r < nums.length; r++) {
    const back = Math.min(K, l);
    for (let t = 0; t < back; t++) {
      l--;
      sum += nums[l] as number;
      ops++;
    }
    sum += nums[r] as number;
    ops++;
    while (sum > S) {
      sum -= nums[l] as number;
      l++;
      ops++;
    }
    best = Math.max(best, r - l + 1);
  }
  return { best, ops };
}

/** 정의 그대로 — 모든 부분 배열의 합을 재고 가장 긴 것을 고른다. 음수가 섞여도 맞다. */
function byDefinition(nums: number[], S: number): number {
  let best = 0;
  for (let l = 0; l < nums.length; l++) {
    let sum = 0;
    for (let r = l; r < nums.length; r++) {
      sum += nums[r] as number;
      if (sum <= S) best = Math.max(best, r - l + 1);
    }
  }
  return best;
}

const zeros = (n: number): number[] => new Array<number>(n).fill(0);
const ones = (n: number): number[] => new Array<number>(n).fill(1);

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  longestSubarrayAtMostSum(nums: number[], S: number): number;
}

/**
 * 축소 루프에 「왼쪽 끝은 오른쪽 끝을 넘지 못한다」는 조건을 더한 사본.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 * 손으로 베낀 사본이면 「한 곳만 바꿨다」가 검사되지 않는다.
 */
const guarded = await loadMutant<Impl>(
  new URL("./longestSubarrayAtMostSum-guide.ref.ts", import.meta.url).pathname,
  {
    swap: [/while \(windowSum > S\) \{/, "while (windowSum > S && l < r) {"],
  },
);

/** 합이 상한과 **같을 때도** 창을 줄이는 사본. 비교 연산자 한 글자만 다르다. */
const shrinkOnEqual = await loadMutant<Impl>(
  new URL("./longestSubarrayAtMostSum-guide.ref.ts", import.meta.url).pathname,
  { swap: [/windowSum > S/, "windowSum >= S"] },
);

/* ────────────────────────── 블록 ────────────────────────── */

const twoWays = (() => {
  const a = restartEachStart(WALK, WALK_S);
  const b = rewindBy(WALK, WALK_S, 0);
  return { a, b };
})();

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다. */
function assertBreaks(rows: { bare: number; mutated: number }[]): void {
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

const GUARD_CASES: [number[], number][] = [
  [[10, 20, 30], 5],
  [[1, 2, 3], 0],
  [[5], 1],
  [WALK, WALK_S],
];

const EQUAL_CASES: [number[], number][] = [
  [WALK, WALK_S],
  [[1, 2, 3, 4, 5], 8],
  [[1, 2, 1], 4],
  [[4, 4], 4],
];

const NEGATIVE_CASES: [number[], number][] = [
  [[5, 1, -5, 1], 2],
  [[3, -2, 4], 4],
  [WALK, WALK_S],
];

const SCALE_N = [7, 100, 1_000, 10_000];

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 실제 계수. */
  "cost-two-ways": () => {
    const { a, b } = twoWays;
    const rows = a.perStart.map(({ count, over }, l) => [
      `l=${l}`,
      String(count),
      over ? `합이 ${WALK_S} 를 넘었다` : "배열 끝에 도착했다",
    ]);
    return [
      table(["시작점", "더한 횟수", "멈춘 이유"], rows, ["l", "r", "l"]),
      "",
      `방식 A  시작점마다 다시 더한다   덧셈 ${a.ops} 번   답 ${a.best}`,
      `방식 B  왼쪽 끝을 되돌리지 않는다  덧셈·뺄셈 ${b.ops} 번   답 ${b.best}`,
      `        └ 답은 같고 연산만 ${a.ops - b.ops} 번 줄었다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 되돌림 폭 `K` 를 넷으로 두고 같은 입력에서 잰 값. */
  "cost-rewind": () => {
    const ks = [WALK.length, 2, 1, 0];
    const rows = ks.map((k) => {
      const { best, ops } = rewindBy(WALK, WALK_S, k);
      return [
        k === WALK.length ? `K=${k} (항상 처음으로)` : `K=${k}`,
        String(ops),
        String(best),
      ];
    });
    return [
      table(["되돌림 폭", "덧셈·뺄셈", "답"], rows, ["l", "r", "r"]),
      "",
      "└ 답은 넷 다 같고 연산 수만 다르다. 가장 적은 것은 되돌리지 않는 K=0 이다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 합이 상한과 같을 때도 줄이면 어떻게 되는가. */
  "pause-shrink-on-equal": () => {
    const rows = EQUAL_CASES.map(([nums, S]) => ({
      nums,
      S,
      bare: longestSubarrayAtMostSum([...nums], S),
      mutated: shrinkOnEqual.longestSubarrayAtMostSum([...nums], S),
    }));
    assertBreaks(rows);
    return [
      table(
        ["입력", "S", "> 로 비교", ">= 로 비교", ""],
        rows.map((r) => [
          show(r.nums),
          String(r.S),
          String(r.bare),
          String(r.mutated),
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 위의 둘은 답이 같아서 이 변경을 넣어도 알아채지 못한다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 음수가 하나 섞이면 두 포인터가 정의와 다른 답을 낸다. */
  "pause-negative": () => {
    const rows = NEGATIVE_CASES.map(([nums, S]) => {
      const window = longestSubarrayAtMostSum([...nums], S);
      const exact = byDefinition([...nums], S);
      return [
        show(nums),
        String(S),
        String(window),
        String(exact),
        window === exact ? "같다" : "다르다",
      ];
    });
    return [
      table(["입력", "S", "두 포인터", "정의 그대로", ""], rows, [
        "l",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 음수가 섞인 첫 줄에서만 갈린다. 나머지 둘은 전부 비음의 정수다",
    ].join("\n");
  },

  /** `invariant` ③ — 불변식을 지키던 줄에 조건 하나를 더하면 무엇이 나오는가. */
  "mutant-left-guard": () => {
    const rows = GUARD_CASES.map(([nums, S]) => ({
      nums,
      S,
      bare: longestSubarrayAtMostSum([...nums], S),
      mutated: guarded.longestSubarrayAtMostSum([...nums], S),
    }));
    assertBreaks(rows);
    return [
      table(
        ["입력", "S", "바른 코드", "l < r 을 더한 코드"],
        rows.map((r) => [
          show(r.nums),
          String(r.S),
          String(r.bare),
          String(r.mutated),
        ]),
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 앞의 셋은 답이 될 수 없는 창의 길이를 답으로 냈다. 마지막 줄만 우연히 같다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣은 값과 실측값의 대조. */
  "cost-scale": () => {
    const rows = SCALE_N.map((n) => {
      const nums = zeros(n);
      const a = restartEachStart(nums, 0);
      const b = rewindBy(nums, 0, 0);
      return [num(n), num(a.ops), num((n * (n + 1)) / 2), num(b.ops), num(n)];
    });
    const big = 100_000;
    rows.push([
      num(big),
      "(실행하지 않음)",
      num((big * (big + 1)) / 2),
      num(rewindBy(zeros(big), 0, 0).ops),
      num(big),
    ]);
    return table(
      ["n", "시작점마다 다시(실측)", "n(n+1)/2", "두 포인터(실측)", "n"],
      rows,
      ["r", "r", "r", "r", "r"],
    );
  },

  /** `perf.worst` — 연산 수를 최대로 만드는 입력을 실제로 구성해 잰 값. */
  "worst-counts": () => {
    const n = 1_000;
    const cases: [string, number[], number][] = [
      ["전부 0 · S=0", zeros(n), 0],
      ["전부 1 · S=n", ones(n), n],
      ["전부 1 · S=0", ones(n), 0],
    ];
    const rows = cases.map(([name, nums, S]) => {
      const { best, ops } = rewindBy(nums, S, 0);
      return [name, num(ops), `${(ops / n).toFixed(1)}n`, num(best)];
    });
    return [
      table([`입력 (n=${num(n)})`, "덧셈·뺄셈", "n 으로 나누면", "답"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 마지막 줄이 최대다. 매 단계 왼쪽 끝이 한 칸씩 움직여 l 의 이동이 n 칸을 채운다",
    ].join("\n");
  },
};
