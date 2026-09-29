/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바깥 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/longestSubarrayAtMostSum/longestSubarrayAtMostSum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  loByDefinition,
  MEASURED_N,
  N_MAX,
  naiveWorst,
  ones,
  type Round,
  range,
  refOps,
  restartEachStart,
  rewindBy,
  secondsOf,
  sumOf,
  trace,
  WALK,
  WALK_S,
  walkSteps,
  worstOps,
  zeros,
} from "./longestSubarrayAtMostSum-guide.fig.tsx";
import { longestSubarrayAtMostSum } from "./longestSubarrayAtMostSum-guide.ref.ts";

const REF = new URL("./longestSubarrayAtMostSum-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** `[1 2 1 0 1 1 0]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 창의 값 — 「값 1 2 1 0」 꼴(SPEC `L25`). */
const values = (nums: readonly number[], l: number, r: number): string =>
  range(l, r)
    .map((i) => nums[i])
    .join(" ");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 텍스트 펜스의 칸 맞춤을 값에서 잰다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 텍스트 펜스의 열 맞춤 — 열 폭을 값에서 계산한다. */
function columns(rows: string[][]): string[] {
  const w = rows.reduce<number[]>(
    (acc, r) => r.map((c, i) => Math.max(acc[i] ?? 0, width(c))),
    [],
  );
  return rows.map((r) =>
    r
      .map((c, i) => (i === r.length - 1 ? c : pad(c, w[i] ?? 0)))
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 펜스 안의 줄 — 펜스 줄(```) 은 본문이 적는다. */
const block = (body: string[]): string => body.join("\n");

/** 왼쪽 끝이 지나간 자리 — 같은 자리가 이어지면 한 번만 적는다. */
const leftPath = (rounds: readonly Round[]): number[] =>
  [0, ...rounds.map((r) => r.l)].filter((l, i, a) => i === 0 || l !== a[i - 1]);

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  longestSubarrayAtMostSum(nums: number[], S: number): number;
}

/**
 * 줄이기 반복에 「왼쪽 끝은 오른쪽 끝을 넘지 못한다」는 조건을 더한 사본.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 * 손으로 베낀 사본이면 「한 곳만 바꿨다」가 검사되지 않는다.
 */
const guarded = await loadMutant<Impl>(REF, {
  swap: [/while \(windowSum > S\) \{/, "while (windowSum > S && l < r) {"],
});

/** 합이 상한과 **같을 때도** 창을 줄이는 사본. 비교 연산자 한 글자만 다르다. */
const shrinkOnEqual = await loadMutant<Impl>(REF, {
  swap: [/windowSum > S/, "windowSum >= S"],
});

/**
 * 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다.
 *
 * 중화 실행(`check-proof` 가 변이를 끄고 한 번 더 부르는 실행)에서는 이 검사를 건너뛴다. 중화
 * 여부는 **값에서** 알아낸다 — 변이 모듈의 함수가 정본과 같은 객체면 중화된 것이다.
 */
function assertBreaks(
  mutant: Impl,
  rows: { bare: number; mutated: number }[],
): void {
  if (mutant.longestSubarrayAtMostSum === longestSubarrayAtMostSum) return;
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/* ────────────────────────── 입력 ────────────────────────── */

const GUARD_CASES: [number[], number][] = [
  [[10, 20, 30], 5],
  [[1, 2, 3], 0],
  [[5], 1],
  [[...WALK], WALK_S],
];

const EQUAL_CASES: [number[], number][] = [
  [[...WALK], WALK_S],
  [[1, 2, 3, 4, 5], 8],
  [[1, 2, 1], 4],
  [[4, 4], 4],
];

const NEGATIVE_CASES: [number[], number][] = [
  [[5, 1, -5, 1], 2],
  [[3, -2, 4], 4],
  [[...WALK], WALK_S],
];

/** 창이 통째로 비는 입력 — 「수행으로 알아보는 알고리즘」 3 번 걸음. */
const EMPTY: [number[], number] = [[10, 20, 30], 5];

/** 정의 그대로 — 모든 부분 배열의 합을 재고 가장 긴 것을 고른다. 음수가 섞여도 맞다. */
function byDefinition(nums: readonly number[], S: number): number {
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

const walk = () => trace(WALK, WALK_S);
const roundAt = (r: number): Round => walk().rounds[r] as Round;
const firstShrinkRound = (): Round =>
  walk().rounds.find((x) => x.removed.length > 0) as Round;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 오른쪽 끝을 넓히다 왼쪽 끝을 옮기는 자리. */
  "concept-left-path": () => {
    const t = walk();
    const rows = t.rounds
      .filter((r) => r.removed.length > 0)
      .map((r) => [
        `r = ${r.r}${으로(r.r)} 넓히면`,
        `창의 합이 ${r.before}${이가(r.before)} 되어`,
        `l 을 ${r.removed[0]} 에서 ${r.l}${으로(r.l)} 옮긴다`,
      ]);
    return block([
      ...columns(rows),
      `      └ l 은 ${leftPath(t.rounds).join(" → ")} 로만 갔다. 왼쪽으로 되돌아간 적이 없다`,
    ]);
  },

  /** `prereq` — 합이 가장 큰 구간과, 합이 S 이하인 가장 긴 구간은 다르다. */
  "prereq-max-vs-long": () => {
    let bestSum = Number.NEGATIVE_INFINITY;
    let at: [number, number] = [0, 0];
    for (let l = 0; l < WALK.length; l++) {
      for (let r = l; r < WALK.length; r++) {
        const s = sumOf(WALK, l, r);
        const longer = s === bestSum && r - l > at[1] - at[0];
        if (s > bestSum || longer) {
          bestSum = s;
          at = [l, r];
        }
      }
    }
    const t = walk();
    const ans = t.rounds.find((r) => r.r - r.l + 1 === t.result) as Round;
    return md(
      ["찾는 것", "구간", "합", "길이"],
      [
        [
          "합이 가장 큰 구간(같으면 긴 쪽)",
          `[${at[0]},${at[1]}]`,
          String(bestSum),
          String(at[1] - at[0] + 1),
        ],
        [
          `합이 ${WALK_S} 이하인 가장 긴 구간`,
          `[${ans.l},${ans.r}]`,
          String(sumOf(WALK, ans.l, ans.r)),
          String(t.result),
        ],
      ],
      [2, 3],
    );
  },

  /** `deep.origin` ② — 가장 단순한 방법의 최악 덧셈 수. */
  "origin-cost": () => {
    const sizes = [...MEASURED_N, N_MAX];
    const rows = sizes.map((n) => {
      const { ops, measured } = naiveWorst(n);
      return [
        num(n),
        num(ops),
        secondsOf(ops),
        measured ? "실행해서 셌다" : "n(n+1)/2 로 냈다",
      ];
    });
    return [
      md(["n", "덧셈 수", "초당 1 억 번 기준", "구한 방법"], rows, [0, 1, 2]),
      "",
      `모든 원소가 0 이고 S = 0 인 입력이라 한 번도 멈추지 않습니다. 실행해서 센 n = ${MEASURED_N.map(num).join(" · ")} 에서 덧셈 수가 n(n+1)/2 와 정확히 같았습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 작은 입력에서 시작점마다 무엇을 다시 더하는가. */
  "origin-restart": () => {
    const a = restartEachStart(WALK, WALK_S);
    const rows = a.perStart.map(({ adds, over }, l) => [
      `l = ${l}`,
      adds.join(" → "),
      String(adds.length),
      over ? `합이 ${WALK_S}${을를(WALK_S)} 넘었다` : "배열 끝까지 갔다",
    ]);
    return [
      md(["시작점", "차례로 쌓인 합", "더한 횟수", "멈춘 까닭"], rows, [2]),
      "",
      `더한 횟수를 모두 합하면 ${a.ops} 번이고, 답은 ${a.best} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 직전 줄의 합에서 한 칸만 빼면 같은 값이 나온다. */
  "origin-reuse": () => {
    const a = restartEachStart(WALK, WALK_S);
    const first = a.perStart[0]?.adds ?? [];
    const second = a.perStart[1]?.adds ?? [];
    const r = first.length - 1;
    const s0 = first[r] as number;
    const s1 = second[r - 1] as number;
    if (s0 - (WALK[0] as number) !== s1) {
      throw new Error(
        "직전 줄의 합에서 nums[0] 을 뺀 값이 다음 줄의 합과 다르다",
      );
    }
    return block(
      columns([
        [`l = 0, r = ${r} 까지의 합`, String(s0), ""],
        ["− nums[0]", String(WALK[0]), ""],
        [
          `l = 1, r = ${r} 까지의 합`,
          String(s1),
          `덧셈 ${r} 번 대신 뺄셈 한 번`,
        ],
      ]),
    );
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리했을 때의 실제 계수. */
  "origin-two-ways": () => {
    const a = restartEachStart(WALK, WALK_S);
    const b = refOps(WALK, WALK_S);
    const best = longestSubarrayAtMostSum([...WALK], WALK_S);
    return [
      md(
        ["방식", "창의 합을 고친 횟수", "답"],
        [
          ["A 시작점마다 처음부터 다시 더한다", String(a.ops), String(a.best)],
          ["B 직전 합에서 빠진 칸만 뺀다", String(b), String(best)],
        ],
        [1, 2],
      ),
      "",
      `답은 둘 다 ${best} 이고, 연산은 ${a.ops - b} 번 줄었습니다. 방식 B 에서 왼쪽 끝은 ${leftPath(walk().rounds).join(" → ")} 로만 움직였습니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 창을 두 끝으로 적는 법. 빈 창까지. */
  "build-window": () => {
    const last = walk().rounds.at(-1) as Round;
    const [nums, S] = EMPTY;
    const e = trace(nums, S).rounds[0] as Round;
    return block(
      columns([
        [
          `창 [${last.l},${last.r}]`,
          `l = ${last.l}, r = ${last.r}`,
          `칸 수 ${last.r} − ${last.l} + 1 = ${last.r - last.l + 1}`,
          `windowSum = ${last.windowSum}    ${show(WALK)}, S = ${WALK_S} 의 마지막 바퀴`,
        ],
        [
          "빈 창",
          `l = ${e.l}, r = ${e.r}`,
          `칸 수 ${e.r} − ${e.l} + 1 = ${e.r - e.l + 1}`,
          `windowSum = ${e.windowSum}    ${show(nums)}, S = ${S} 의 첫 바퀴`,
        ],
      ]),
    );
  },

  /** `deep.build` 2단계 — 넓혔는데 상한을 안 넘는 쉬운 경우. 0 을 더하는 자리. */
  "build-extend": () => {
    const r = walk().rounds.find(
      (x) => x.r > 0 && x.added === 0 && x.removed.length === 0,
    ) as Round;
    const prev = roundAt(r.r - 1);
    return block([
      `r = ${prev.r} → ${r.r}   창의 합 ${prev.windowSum} 에 nums[${r.r}] = ${r.added}${을를(String(r.added))} 더해 ${r.before}`,
      `            ${r.before} > ${WALK_S}${이가(WALK_S)} 거짓이라 줄이지 않는다`,
      `            l 은 ${r.l} 그대로, 창의 값 ${values(WALK, r.l, r.r)}, 길이 ${prev.r - prev.l + 1} → ${r.r - r.l + 1}`,
      "            └ 합이 그대로인데 길이만 늘었다. 0 이 섞이면 이런 자리가 나온다",
    ]);
  },

  /** `deep.build` 3단계 — 넓혔더니 상한을 넘어 왼쪽 끝을 옮기는 경우 전부. */
  "build-shrink": () => {
    const groups: string[][] = [];
    for (const r of walk().rounds.filter((x) => x.removed.length > 0)) {
      const prev = roundAt(r.r - 1);
      const rows: string[][] = [
        [
          `r = ${prev.r} → ${r.r}`,
          `창의 합 ${prev.windowSum} 에 nums[${r.r}] = ${r.added}${을를(String(r.added))} 더해 ${r.before}`,
          `${r.before} > ${WALK_S}${이가(WALK_S)} 참`,
        ],
      ];
      let s = r.before;
      let l = prev.l;
      for (const k of r.removed) {
        s -= WALK[k] as number;
        rows.push([
          "",
          `nums[${k}] = ${WALK[k]}${을를(String(WALK[k]))} 빼서 ${s}, l 을 ${l} → ${k + 1}`,
          `${s} > ${WALK_S}${이가(WALK_S)} ${s > WALK_S ? "참" : "거짓"}`,
        ]);
        l = k + 1;
      }
      if (sumOf(WALK, r.l, r.r) !== r.windowSum) {
        throw new Error("창의 합이 창의 값과 다르다");
      }
      rows.push([
        "",
        `창의 값 ${values(WALK, r.l, r.r)}, 길이 ${r.r - r.l + 1}`,
        `합 ${r.windowSum}${은는(r.windowSum)} 실제로 ${values(WALK, r.l, r.r).split(" ").join("+")} 이다`,
      ]);
      groups.push(rows);
    }
    const all = columns(groups.flat());
    const out: string[] = [];
    let i = 0;
    for (const [g, rows] of groups.entries()) {
      if (g > 0) out.push("");
      out.push(...all.slice(i, i + rows.length));
      i += rows.length;
    }
    return block(out);
  },

  /** `deep.build` 3단계 — 정의로 구한 `lo(r)` 와 정본의 `l`. 왼쪽 끝은 되돌아가지 않는다. */
  "build-lo": () => {
    const t = walk();
    const rs = t.rounds.map((r) => r.r);
    const lo = rs.map((r) => loByDefinition(WALK, WALK_S, r));
    const same = t.rounds.filter((r, i) => r.l === lo[i]).length;
    const monotone = lo.every((v, i) => i === 0 || v >= (lo[i - 1] as number));
    if (!monotone) throw new Error("lo(r) 가 줄어드는 자리가 있다");
    return [
      md(
        ["r", ...rs.map(String)],
        [
          ["nums[r]", ...rs.map((r) => String(WALK[r]))],
          ["정의로 구한 lo(r)", ...lo.map(String)],
          ["정본의 l", ...t.rounds.map((r) => String(r.l))],
          ["창의 합", ...t.rounds.map((r) => String(r.windowSum))],
        ],
        rs.map((_, i) => i + 1),
      ),
      "",
      `lo(r) 의 줄은 한 번도 줄지 않고, 정본이 줄인 뒤의 l 과 ${rs.length} 칸 중 ${same} 칸이 일치합니다.`,
    ].join("\n");
  },

  /** `deep.build` 4단계 — 창의 길이와 답 후보. */
  "build-best": () => {
    const t = walk();
    const rs = t.rounds.map((r) => r.r);
    return [
      md(
        ["r", ...rs.map(String)],
        [
          ["창 [l, r]", ...t.rounds.map((r) => `[${r.l},${r.r}]`)],
          ["길이 r − l + 1", ...t.rounds.map((r) => String(r.r - r.l + 1))],
          ["best", ...t.rounds.map((r) => String(r.best))],
        ],
        rs.map((_, i) => i + 1),
      ),
      "",
      `best 는 길이가 지금까지보다 길 때만 바뀌고, 마지막 값 ${t.result}${이가(t.result)} 답입니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 되돌림 폭 `K` 를 넷으로 두고 같은 입력에서 잰 값. */
  "cost-rewind": () => {
    const ks = [WALK.length, 2, 1, 0];
    const rows = ks.map((k) => {
      const { best, ops } = rewindBy(WALK, WALK_S, k);
      return [
        k === WALK.length ? `K = ${k} (늘 처음으로)` : `K = ${k}`,
        String(ops),
        String(best),
      ];
    });
    if (rewindBy(WALK, WALK_S, 0).ops !== refOps(WALK, WALK_S)) {
      throw new Error("되돌림 폭 0 의 연산 수가 정본 계측과 다르다");
    }
    const answers = new Set(rows.map((r) => r[2]));
    const least = rows.reduce((a, b) => (Number(b[1]) < Number(a[1]) ? b : a));
    return [
      md(["되돌림 폭", "덧셈·뺄셈", "답"], rows, [1, 2]),
      "",
      `답은 ${answers.size === 1 ? "넷 모두" : "폭마다"} ${[...answers].join(" · ")} 이고, 연산이 가장 적은 것은 ${least[0]} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () =>
    block([
      `const nums = [${WALK.join(", ")}];`,
      `const S = ${WALK_S};`,
      `// 이 절이 끝나면 ${longestSubarrayAtMostSum([...WALK], WALK_S)} 가 나와야 한다`,
    ]),

  /** `deep.walk` 1 — 더하기만 하는 조각을 실행한 결과. */
  "walk-extend": () => {
    // 조각 그대로 — 줄이는 부분이 아직 없다.
    let windowSum = 0;
    const sums: number[] = [];
    for (let r = 0; r < WALK.length; r++) {
      windowSum += WALK[r] as number;
      sums.push(windowSum);
    }
    const over = sums.findIndex((s) => s > WALK_S);
    return [
      md(
        ["r", ...WALK.map((_, i) => String(i))],
        [
          ["nums[r]", ...WALK.map(String)],
          ["windowSum", ...sums.map(String)],
        ],
        WALK.map((_, i) => i + 1),
      ),
      "",
      `r = ${over} 에서 처음으로 ${WALK_S}${을를(WALK_S)} 넘고, 그 뒤로는 줄지 않습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 2 — 줄이는 조각을 첫 줄이기 자리에서 실행한 결과. */
  "walk-shrink": () => {
    const r = firstShrinkRound();
    const prev = roundAt(r.r - 1);
    const rows: string[][] = [
      [
        "들어올 때",
        `windowSum = ${r.before}  l = ${prev.l}`,
        `${r.before} > ${WALK_S}${이가(WALK_S)} 참이라 ① 을 실행한다`,
      ],
    ];
    let s = r.before;
    for (const [i, k] of r.removed.entries()) {
      const was = s;
      s -= WALK[k] as number;
      rows.push([
        `① ${i + 1} 번째`,
        `windowSum = ${s}  l = ${k + 1}`,
        `${was} − nums[${k}] = ${was} − ${WALK[k]} = ${s}`,
      ]);
    }
    rows.push([
      "다시 검사",
      `${s} > ${WALK_S}${이가(WALK_S)} 거짓`,
      "반복이 끝난다",
    ]);
    return block([
      ...columns(rows),
      `            창의 값 ${values(WALK, r.l, r.r)}, 합 ${r.windowSum}`,
    ]);
  },

  /** `deep.walk.pause` — 합이 상한과 같은 자리에서 두 비교가 하는 일. */
  "pause-equal-r2": () => {
    const r = walk().rounds.find(
      (x) => x.before === WALK_S && x.removed.length === 0,
    ) as Round;
    const cut = WALK[r.l] as number;
    return block([
      `r = ${r.r} 에서 창의 합이 정확히 ${WALK_S} 다`,
      "",
      ...columns([
        [
          "  > 로 비교하면",
          `${r.before} > ${WALK_S}${이가(WALK_S)} 거짓`,
          "→ 줄이지 않는다",
          `→ 창의 값 ${values(WALK, r.l, r.r)}, 길이 ${r.r - r.l + 1}`,
        ],
        [
          "  >= 로 비교하면",
          `${r.before} >= ${WALK_S}${이가(WALK_S)} 참`,
          `→ nums[${r.l}] = ${cut}${을를(String(cut))} 뺀다`,
          `→ 창의 값 ${values(WALK, r.l + 1, r.r)}, 길이 ${r.r - r.l}`,
        ],
      ]),
    ]);
  },

  /** `deep.walk.pause` — 합이 상한과 같을 때도 줄이면 어떻게 되는가. */
  "pause-shrink-on-equal": () => {
    const rows = EQUAL_CASES.map(([nums, S]) => ({
      nums,
      S,
      bare: longestSubarrayAtMostSum([...nums], S),
      mutated: shrinkOnEqual.longestSubarrayAtMostSum([...nums], S),
    }));
    assertBreaks(shrinkOnEqual, rows);
    const kept = rows.filter((r) => r.bare === r.mutated).length;
    return [
      md(
        ["입력", "S", "> 로 비교", ">= 로 비교", "두 답"],
        rows.map((r) => [
          show(r.nums),
          String(r.S),
          String(r.bare),
          String(r.mutated),
          r.bare === r.mutated ? "같다" : "다르다",
        ]),
        [1, 2, 3],
      ),
      "",
      `네 입력 중 ${kept} 개에서는 이 변경을 넣어도 답이 그대로라 알아챌 수 없습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 창이 통째로 비는 자리에서 길이 식이 내는 값. */
  "walk-empty": () => {
    const [nums, S] = EMPTY;
    const e = trace(nums, S).rounds[0] as Round;
    return block([
      `nums 의 값 ${values(nums, 0, nums.length - 1)}, S = ${S} 일 때 r = ${e.r}`,
      "",
      ...columns([
        [
          `  windowSum = ${e.before}, ${e.before} > ${S}${이가(S)} 참이라 ① 을 실행한다`,
          `nums[${e.removed[0]}] 을 빼서 ${e.windowSum}, l = ${e.l}`,
        ],
        ["  창은 비었다", `l = ${e.l} 이라 r = ${e.r} 보다 한 칸 크다`],
        [
          `  r − l + 1 = ${e.r} − ${e.l} + 1 = ${e.r - e.l + 1}`,
          `길이가 ${e.r - e.l + 1}${으로(e.r - e.l + 1)} 나온다. best 는 ${e.best} 그대로다`,
        ],
      ]),
    ]);
  },

  /** `deep.walk` 4 — 고정 입력을 끝까지 실행한 걸음 표. */
  "walk-trace": () => {
    const t = walk();
    const rows: string[][] = [
      ["T1", "—", "—", "루프 진입 전", "—", "0", "0", "0", "0"],
    ];
    for (const [i, r] of t.rounds.entries()) {
      const cut = r.removed.map((k) => `nums[${k}]=${WALK[k]}`).join(", ");
      rows.push([
        `T${i + 2}`,
        String(r.r),
        String(r.before),
        `\`${r.before} > ${WALK_S}\` **${r.before > WALK_S ? "참" : "거짓"}** → ${r.removed.length > 0 ? "①" : "②"}`,
        cut === "" ? "—" : cut,
        String(r.l),
        String(r.windowSum),
        String(r.r - r.l + 1),
        String(r.best),
      ]);
    }
    if (walkSteps().length !== rows.length) {
      throw new Error("걸음 표와 필름의 걸음 수가 다르다");
    }
    return md(
      [
        "단계",
        "r",
        "더한 뒤 합",
        "조건 판정",
        "뺀 값",
        "줄인 뒤 l",
        "줄인 뒤 합",
        "길이",
        "best",
      ],
      rows,
      [1, 2, 5, 6, 7, 8],
    );
  },

  /** `deep.walk` 4 — 두 갈래가 어디서 실행됐는가와 연산 수. */
  "walk-branches": () => {
    const t = walk();
    const one = t.rounds
      .map((r, i) => ({ r, id: `T${i + 2}` }))
      .filter(({ r }) => r.removed.length > 0);
    const two = t.rounds.map((_, i) => `T${i + 2}`);
    const subs = one.reduce((n, { r }) => n + r.removed.length, 0);
    const path = leftPath(t.rounds);
    const adds = t.rounds.length;
    return block([
      ...columns([
        [
          "①  상한을 넘는다",
          one.map((x) => x.id).join(" · "),
          `왼쪽 끝이 ${path.join(" → ")} 로 ${path.length - 1} 칸 움직였다`,
        ],
        [
          "②  상한 이하다",
          two.join(" "),
          `${two.length} 번 전부 길이를 재 봤다`,
        ],
      ]),
      "",
      `연산 = 덧셈 ${adds} (${two[0]}~${two.at(-1)}) + 뺄셈 ${subs} (${one.map((x) => x.id).join(" · ")}) = ${adds + subs}`,
    ]);
  },

  /** `deep.walk.pause` — 음수가 섞인 입력에서 이 절차가 지나는 자취. */
  "pause-negative-trace": () => {
    const [nums, S] = NEGATIVE_CASES[0] as [number[], number];
    const t = trace(nums, S);
    const first = t.rounds[0] as Round;
    const ans = t.rounds.find((r) => r.r - r.l + 1 === t.result) as Round;
    const exact = byDefinition(nums, S);
    const whole = sumOf(nums, 0, nums.length - 1);
    const expr = nums
      .map((v, i) => (i === 0 ? String(v) : v < 0 ? `−${-v}` : `+${v}`))
      .join("");
    const rows = columns([
      [
        "  이 절차",
        `r = ${first.r} 에서 합 ${first.before} > ${S}${이가(S)} 참이라 ${nums[0]}${을를(String(nums[0]))} 빼고 l 을 ${first.l}${으로(first.l)} 옮긴다`,
      ],
      [
        "",
        `그 뒤로 l 은 ${ans.l} 에 머문다 → 가장 긴 창은 값 ${values(nums, ans.l, ans.r)}, 길이 ${t.result}`,
      ],
      [
        "  모든 구간을 재면",
        `[0,${nums.length - 1}] 의 합은 ${expr} = ${whole} ≤ ${S} → 길이 ${exact}`,
      ],
    ]);
    const indent = " ".repeat(width("  모든 구간을 재면") + 2);
    return block([
      `nums 의 값 ${values(nums, 0, nums.length - 1)}, S = ${S}`,
      "",
      ...rows,
      `${indent}└ 왼쪽 끝을 0 으로 되돌려야 찾을 수 있는 답이다`,
    ]);
  },

  /** `deep.walk.pause` — 음수가 하나 섞이면 슬라이딩 윈도가 정의와 다른 답을 낸다. */
  "pause-negative": () => {
    const rows = NEGATIVE_CASES.map(([nums, S]) => {
      const window = longestSubarrayAtMostSum([...nums], S);
      const exact = byDefinition(nums, S);
      return [
        show(nums),
        String(S),
        String(window),
        String(exact),
        window === exact ? "같다" : "다르다",
      ];
    });
    return md(
      ["입력", "S", "슬라이딩 윈도의 답", "모든 구간을 잰 답", "두 답"],
      rows,
      [1, 2, 3],
    );
  },

  /** `deep.walk.final` — 전체 코드를 몇 입력에 실행한 결과. */
  "final-calls": () => {
    const calls: [number[], number][] = [
      [[...WALK], WALK_S],
      [[10, 20, 30], 5],
      [[0, 0, 0, 0], 0],
      [[5], 10],
    ];
    return block(
      columns(
        calls.map(([nums, S]) => [
          `longestSubarrayAtMostSum([${nums.join(", ")}], ${S})`,
          `→  ${longestSubarrayAtMostSum([...nums], S)}`,
        ]),
      ),
    );
  },

  /** `related` — 단계별 뺄셈과 그 누적, 단계마다 최악을 잡은 값. */
  "related-amortized": () => {
    const t = walk();
    const ids = t.rounds.map((_, i) => `T${i + 2}`);
    const per = t.rounds.map((r) => r.removed.length);
    const acc = per.map((_, i) =>
      per.slice(0, i + 1).reduce((a, b) => a + b, 0),
    );
    const n = WALK.length;
    const total = acc.at(-1) as number;
    return [
      md(
        ["단계", ...ids, "합"],
        [
          ["그 단계의 뺄셈", ...per.map(String), String(total)],
          ["누적 뺄셈", ...acc.map(String), "—"],
          ["단계별 최악", ...per.map(() => String(n)), String(n * per.length)],
        ],
        [...ids.map((_, i) => i + 1), ids.length + 1],
      ),
      "",
      `단계마다 최악 ${n} 칸을 잡아 더하면 ${n * per.length} 인데, 실제 뺄셈은 ${total} 번입니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 구간 합의 정의를 값에 넣은 검산. */
  "math-sum-check": () => {
    const pairs: [number, number][] = [
      [0, 2],
      [1, 4],
      [5, 4],
    ];
    return block([
      `정의를 값에 넣어 봅니다 — nums 의 값 ${values(WALK, 0, WALK.length - 1)}`,
      "",
      ...columns(
        pairs.map(([l, r]) => [
          `  sum(${l}, ${r})`,
          `= ${l > r ? "(더할 것이 없다)" : values(WALK, l, r).split(" ").join(" + ")}`,
          `= ${sumOf(WALK, l, r)}${l > r ? "     l 이 r 보다 크면 빈 구간이다" : ""}`,
        ]),
      ),
    ]);
  },

  /** `deep.math` ② — `lo(r)` 정의의 후보를 값으로. */
  "math-lo-candidates": () => {
    const r = firstShrinkRound();
    const lo = loByDefinition(WALK, WALK_S, r.r);
    const rows = range(0, r.r + 1).map((l) => {
      const s = sumOf(WALK, l, r.r);
      const note =
        l === r.r + 1
          ? "빈 구간이라 언제나 후보"
          : s > WALK_S
            ? `${WALK_S} 이하가 아니다   후보 아님`
            : l === lo
              ? `${WALK_S} 이하다          후보. 이 중 가장 작으므로 lo(${r.r}) = ${lo}`
              : `${WALK_S} 이하다          후보`;
      return [`  l = ${l}`, `sum(${l},${r.r}) = ${s}`, note];
    });
    return block([
      `S = ${WALK_S} 이고 r = ${r.r} 일 때 후보가 되는 왼쪽 자리`,
      "",
      ...columns(rows),
    ]);
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣은 값과 실측값의 대조. */
  "cost-scale": () => {
    const sizes = [WALK.length, 100, ...MEASURED_N];
    const rows = sizes.map((n) => {
      const a = restartEachStart(zeros(n), 0);
      const b = refOps(zeros(n), 0);
      return [num(n), num(a.ops), num((n * (n + 1)) / 2), num(b), num(n)];
    });
    rows.push([
      num(N_MAX),
      "(실행하지 않음)",
      num((N_MAX * (N_MAX + 1)) / 2),
      num(refOps(zeros(N_MAX), 0)),
      num(N_MAX),
    ]);
    return md(
      ["n", "시작점마다 다시(실측)", "n(n+1)/2", "슬라이딩 윈도(실측)", "n"],
      rows,
      [0, 1, 2, 3, 4],
    );
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, number[], number][] = [
      ["원소 하나", [5], 10],
      ["원소 하나", [5], 1],
      ["전부 상한 초과", [10, 20, 30], 5],
      ["전부 0", [0, 0, 0, 0], 0],
      ["S 가 아주 큼", [100, 100, 100], 1_000_000_000],
    ];
    const rows = cases.map(([name, nums, S]) => {
      const t = trace(nums, S);
      const subs = t.rounds.reduce((n, r) => n + r.removed.length, 0);
      const emptied = t.rounds.filter((r) => r.l === r.r + 1).length;
      const where =
        subs === 0
          ? "줄이기 반복이 한 번도 실행되지 않는다"
          : emptied === t.rounds.length
            ? `매 바퀴 창이 통째로 비워진다(뺄셈 ${subs} 번)`
            : `줄이기 반복이 ${subs} 번 실행된다`;
      return [`${name} ${show(nums)}, S = ${num(S)}`, where, String(t.result)];
    });
    return md(["입력", "처리되는 자리", "결과"], rows, [2]);
  },

  /** `invariant` ③ — 불변식을 지키던 줄에 조건 하나를 더하면 무엇이 나오는가. */
  "mutant-left-guard": () => {
    const rows = GUARD_CASES.map(([nums, S]) => ({
      nums,
      S,
      bare: longestSubarrayAtMostSum([...nums], S),
      mutated: guarded.longestSubarrayAtMostSum([...nums], S),
    }));
    assertBreaks(guarded, rows);
    const wrong = rows.filter((r) => r.bare !== r.mutated).length;
    return [
      md(
        ["입력", "S", "바른 코드", "l < r 을 더한 코드", "두 답"],
        rows.map((r) => [
          show(r.nums),
          String(r.S),
          String(r.bare),
          String(r.mutated),
          r.bare === r.mutated ? "같다" : "다르다",
        ]),
        [1, 2, 3],
      ),
      "",
      `네 입력 중 ${wrong} 개에서 조건을 어기는 창의 길이가 답으로 나왔습니다.`,
    ].join("\n");
  },

  /** `invariant` ③ — 원소 하나짜리 입력에서 조건을 더한 코드가 지나는 자리. */
  "mutant-left-guard-trace": () => {
    const [nums, S] = GUARD_CASES[2] as [number[], number];
    const first = trace(nums, S).rounds[0] as Round;
    const bad = guarded.longestSubarrayAtMostSum([...nums], S);
    const right = longestSubarrayAtMostSum([...nums], S);
    const rows = columns([
      [
        "  r = 0",
        `windowSum = ${first.before}`,
        `${first.before} > ${S}${은는(S)} 참인데 l < r 이 0 < 0 이라 거짓`,
      ],
      [
        "",
        "반복이 아예 실행되지 않는다",
        `windowSum = ${first.before} 가 남는다`,
      ],
      [
        "",
        `best = max(0, 0 − 0 + 1) = ${bad}`,
        `합 ${first.before} 인 창을 길이 ${bad} 로 세었다`,
      ],
    ]);
    return block([
      `nums 의 값 ${values(nums, 0, nums.length - 1)}, S = ${S} 에서 l < r 을 더하면`,
      "",
      ...rows,
      `         └ 바른 코드의 답은 ${right} 이다. S = ${S} 인데 유일한 원소가 ${nums[0]} 다`,
    ]);
  },

  /** `perf.derive` — 전개의 걸음에서 센 덧셈과 뺄셈. */
  "perf-derive": () => {
    const t = walk();
    const ids = t.rounds.map((_, i) => `T${i + 2}`);
    const sub = t.rounds
      .map((r, i) => ({ r, id: `T${i + 2}` }))
      .filter(({ r }) => r.removed.length > 0);
    const subs = sub.reduce((n, { r }) => n + r.removed.length, 0);
    return block([
      ...columns([
        [
          "덧셈",
          ids.join(" "),
          `r 이 0 부터 ${WALK.length - 1} 까지 한 칸씩 → 정확히 ${ids.length} 번`,
        ],
        [
          "뺄셈",
          sub.map((x) => x.id).join(" · "),
          `l 이 ${leftPath(t.rounds).join(" → ")} 로 → ${subs} 번`,
        ],
      ]),
      `      └ 합 ${ids.length + subs} 번. 「아이디어를 떠올리는 과정」의 방식 B 와 같다`,
    ]);
  },

  /** `perf.bounds` — 제약 규모에서의 최악 연산 수. */
  "perf-total": () =>
    block([
      `n = ${num(N_MAX)} 이면 창의 합을 고치는 연산이 최대 ${num(worstOps(N_MAX))} 번, 추가 메모리는 입력 크기와 무관하게 일정하다`,
    ]),

  /** `perf.worst` — 최악 입력의 첫 두 바퀴. */
  "worst-trace": () => {
    const n = 6;
    const t = trace(ones(n), 0);
    if (!t.rounds.every((r) => r.removed.length === 1)) {
      throw new Error("매 바퀴 뺄셈이 한 번이 아니다");
    }
    const rows = t.rounds
      .slice(0, 2)
      .map((r) => [
        `  r = ${r.r}`,
        `더해서 ${r.before}`,
        `${r.before} > 0 이라 빼서 ${r.windowSum}, l = ${r.l}`,
        `길이 ${r.r} − ${r.l} + 1 = ${r.r - r.l + 1}`,
      ]);
    return block([
      `nums 의 값 ${ones(n).join(" ")}, S = 0`,
      "",
      ...columns(rows),
      "  …     바퀴마다 덧셈 1 + 뺄셈 1",
      `        └ 답은 ${t.result} 이고, 답이 ${t.result} 인 채로 배열 끝까지 간다`,
    ]);
  },

  /** `perf.worst` — 연산 수를 최대로 만드는 입력을 실제로 구성해 잰 값. */
  "worst-counts": () => {
    const n = 1_000;
    const cases: [string, number[], number][] = [
      ["전부 0 · S = 0", zeros(n), 0],
      ["전부 1 · S = n", ones(n), n],
      ["전부 1 · S = 0", ones(n), 0],
    ];
    const measured = cases.map(([name, nums, S]) => ({
      name,
      ops: refOps(nums, S),
      answer: longestSubarrayAtMostSum([...nums], S),
    }));
    const most = measured.reduce((a, b) => (b.ops > a.ops ? b : a));
    return [
      md(
        [`입력(n = ${num(n)})`, "덧셈·뺄셈", "n 의 배수", "답"],
        measured.map((m) => [
          m.name,
          num(m.ops),
          `${(m.ops / n).toFixed(1)}n`,
          num(m.answer),
        ]),
        [1, 2, 3],
      ),
      "",
      `가장 많은 것은 「${most.name}」의 ${num(most.ops)} 번입니다.`,
    ].join("\n");
  },

  /** `selfcheck` — 예측 문제가 가리키는 두 걸음. */
  "selfcheck-t4-t5": () => {
    const a = roundAt(2);
    const b = roundAt(3);
    return block(
      columns([
        [
          "T4",
          `값 ${values(WALK, a.l, a.r)}`,
          `windowSum = ${a.windowSum}`,
          `길이 ${a.r - a.l + 1}`,
          `best = ${a.best}`,
        ],
        [
          "T5",
          `값 ${values(WALK, b.l, b.r)}`,
          `windowSum = ${b.windowSum}`,
          `길이 ${b.r - b.l + 1}`,
          `best = ${b.best}    ← 합은 같은데 best 가 늘었다`,
        ],
      ]),
    );
  },

  /** `selfcheck` 답 — 길이 식에 두 걸음의 값을 넣은 것. */
  "selfcheck-length": () => {
    const rows = (
      [
        ["T4", roundAt(2)],
        ["T5", roundAt(3)],
      ] as const
    ).map(([id, x]) => [
      id,
      `r = ${x.r}  l = ${x.l}`,
      `r − l + 1 = ${x.r} − ${x.l} + 1 = ${x.r - x.l + 1}`,
    ]);
    return block([
      ...columns(rows),
      "        └ l 이 그대로이고 r 만 늘었으니 길이가 정확히 1 늘어난다",
    ]);
  },
};
