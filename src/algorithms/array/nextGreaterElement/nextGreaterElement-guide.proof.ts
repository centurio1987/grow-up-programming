/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts nextGreaterElement-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { nextGreaterElement } from "./nextGreaterElement-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 한글 한 글자는 고정폭 화면에서 두 칸을 먹는다. 글자 수로 맞추면 머리줄만 어긋난다. */
const cells = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padR = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - cells(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - cells(s))) + s;

/** 열 폭을 값에서 계산해 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로다. */
function grid(head: string[], rows: string[][], align: string): string {
  const w = head.map((h, c) =>
    Math.max(cells(h), ...rows.map((r) => cells(r[c] ?? ""))),
  );
  const draw = (row: string[]): string =>
    row
      .map((c, i) =>
        align[i] === "r" ? padL(c, w[i] ?? 0) : padR(c, w[i] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [draw(head), ...rows.map(draw)].join("\n");
}

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** `[4 2 4 -1 -1]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const values = (xs: number[]): string => `[${xs.join(" ")}]`;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK: number[] = [2, 1, 2, 4, 3];

/** 「아이디어 상세」 ④⑥ 과 `.alt.ts` 가 함께 쓰는 큰 입력. 난수를 쓰지 않는다. */
const BIG_N = 1024;
const BIG: number[] = Array.from(
  { length: BIG_N },
  (_, i) => (i * 7919) % 1009,
);

/* ────────────────────── 계측기 — 배열 접근 수 ────────────────────── */

/**
 * 세는 것은 **배열 접근 수**(읽기 + 쓰기)와 **견준 횟수**다. 벽시계·처리량은 실행마다 값이
 * 달라 「본문의 수치가 실측과 같은가」를 정의할 수 없다.
 *
 * `.alt.ts` 의 계수기와 같은 회계를 쓴다 — 답 배열 초기화 쓰기 · `nums[i]` 읽기 · 꼭대기
 * 읽기 · `nums[top]` 읽기 · 답 쓰기 · 스택 쓰기.
 */
interface Counted {
  out: number[];
  acc: number;
  /** 견준 횟수 — 꼭대기와 지금 값을 맞대 본 횟수. */
  cmp: number;
  /** 꺼낸 횟수. */
  pops: number;
  /** 꼭대기가 남아 멈춘 걸음의 수. */
  breaks: number;
  /** 순회가 끝났을 때 스택에 남은 자리의 개수. */
  left: number;
  /** 스택이 가장 깊었을 때의 칸 수. */
  peak: number;
}

function stackCount(nums: number[]): Counted {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  const stack: number[] = [];
  let acc = n;
  let cmp = 0;
  let pops = 0;
  let breaks = 0;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    acc++;
    const cur = nums[i] ?? 0;
    let broke = false;
    while (stack.length > 0) {
      acc += 2;
      cmp++;
      const top = stack[stack.length - 1] ?? 0;
      if ((nums[top] ?? 0) >= cur) {
        broke = true;
        break;
      }
      stack.pop();
      pops++;
      acc++;
      result[top] = cur;
    }
    if (broke) breaks++;
    acc++;
    stack.push(i);
    if (stack.length > peak) peak = stack.length;
  }
  return {
    out: result,
    acc,
    cmp,
    pops,
    breaks,
    left: stack.length,
    peak,
  };
}

/** 계측기가 정본과 같은 답을 내는지 그 자리에서 확인한다. */
function counted(nums: number[]): Counted {
  const c = stackCount(nums);
  const want = nextGreaterElement([...nums]);
  if (c.out.join(",") !== want.join(",")) {
    throw new Error(
      "계측기와 정본의 답이 다르다 — 계수가 다른 절차를 잰 것이다",
    );
  }
  return c;
}

/** 매번 오른쪽을 차례로 읽는 방법. 견준 횟수와 배열 접근을 함께 센다. */
function scanRight(nums: number[]): {
  out: number[];
  acc: number;
  cmp: number;
} {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  let acc = n;
  let cmp = 0;
  for (let i = 0; i < n; i++) {
    acc++;
    for (let j = i + 1; j < n; j++) {
      acc++;
      cmp++;
      if ((nums[j] ?? 0) > (nums[i] ?? 0)) {
        acc++;
        result[i] = nums[j] ?? 0;
        break;
      }
    }
  }
  return { out: result, acc, cmp };
}

/**
 * 미정 자리를 **몇 개까지** 남기는가로 갈리는 방법. `keep` 칸이 차면 **가장 오래된** 미정
 * 자리를 버린다 — 버려진 자리는 답을 못 받고 `-1` 로 남는다.
 *
 * `bottomUp` 이 참이면 꼭대기에서 멈추지 않고 **아래까지 전부** 맞대 본다. 답은 같고 견준
 * 횟수만 늘어난다.
 */
function bounded(
  nums: number[],
  keep: number,
  bottomUp: boolean,
): { out: number[]; cmp: number; wrong: number } {
  const n = nums.length;
  const result = new Array<number>(n).fill(-1);
  let pending: number[] = [];
  let cmp = 0;
  for (let i = 0; i < n; i++) {
    const cur = nums[i] ?? 0;
    const kept: number[] = [];
    for (let k = pending.length - 1; k >= 0; k--) {
      const j = pending[k] ?? 0;
      cmp++;
      if ((nums[j] ?? 0) < cur) {
        result[j] = cur;
        continue;
      }
      if (!bottomUp) {
        kept.unshift(...pending.slice(0, k + 1));
        break;
      }
      kept.unshift(j);
    }
    pending = kept;
    pending.push(i);
    if (pending.length > keep) pending = pending.slice(pending.length - keep);
  }
  const want = nextGreaterElement([...nums]);
  let wrong = 0;
  for (let i = 0; i < n; i++) if (result[i] !== want[i]) wrong++;
  return { out: result, cmp, wrong };
}

/** 자리 `i` 가 **뒤에서 본 기록**인가 — 오른쪽에 자기보다 큰 값이 하나도 없는 자리다. */
function isRecord(nums: number[], i: number): boolean {
  for (let j = i + 1; j < nums.length; j++) {
    if ((nums[j] ?? 0) > (nums[i] ?? 0)) return false;
  }
  return true;
}

/** 조화수 `H_n = 1 + 1/2 + … + 1/n`. */
function harmonic(n: number): number {
  let s = 0;
  for (let k = 1; k <= n; k++) s += 1 / k;
  return s;
}

/** 길이 `n` 순열 전부에서 기록 수의 평균. */
function averageRecords(n: number): number {
  const base = Array.from({ length: n }, (_, i) => i + 1);
  let total = 0;
  let count = 0;
  const walk = (rest: number[], acc: number[]): void => {
    if (rest.length === 0) {
      let r = 0;
      for (let i = 0; i < acc.length; i++) if (isRecord(acc, i)) r++;
      total += r;
      count++;
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      walk([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, rest[i] ?? 0]);
    }
  };
  walk(base, []);
  return total / count;
}

/* ────────────────────────── 변이 넷 ────────────────────────── */

interface Impl {
  nextGreaterElement: (nums: number[]) => number[];
}

const REF = new URL("./nextGreaterElement-guide.ref.ts", import.meta.url)
  .pathname;

/** 꺼내기를 되풀이하지 않고 한 번만 하는 사본. */
const onceOnly = await loadMutant<Impl>(REF, {
  swap: [
    /while \(stack\.length > 0\) \{/,
    "for (let once = 0; once < 1 && stack.length > 0; once++) {",
  ],
});

/** 답 없음을 `0` 으로 깔아 둔 사본. 꺼내는 규칙은 그대로다. */
const fillZero = await loadMutant<Impl>(REF, {
  swap: [/new Array<number>\(n\)\.fill\(-1\)/, "new Array<number>(n).fill(0)"],
});

/** 꺼낸 자리에 값이 아니라 **자리 번호**를 적는 사본. */
const writeIndex = await loadMutant<Impl>(REF, {
  swap: [/result\[top\] = cur;/, "result[top] = i;"],
});

/** 꺼내는 조건을 느슨하게 바꾼 사본 — 같은 값도 꺼낸다. 불변식을 지키던 그 줄이다. */
const looseCompare = await loadMutant<Impl>(REF, {
  swap: [
    /if \(\(nums\[top\] \?\? 0\) >= cur\) break;/,
    "if ((nums[top] ?? 0) > cur) break;",
  ],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. */
function assertBreaks(rows: { good: string; bad: string }[]): void {
  if (rows.every((r) => r.good === r.bad)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 정본과 변이를 같은 입력들에 걸고 답을 나란히 적는다. */
function compare(
  inputs: number[][],
  mutated: Impl,
): { name: string; good: string; bad: string }[] {
  return inputs.map((nums) => ({
    name: values(nums),
    good: values(nextGreaterElement([...nums])),
    bad: values(mutated.nextGreaterElement([...nums])),
  }));
}

const verdict = (r: { good: string; bad: string }): string =>
  r.good === r.bad ? "답이 같다" : "답이 다르다";

function mutantTable(
  inputs: number[][],
  mutated: Impl,
  column: string,
  footer: string[],
): string {
  const rows = compare(inputs, mutated);
  assertBreaks(rows);
  return [
    grid(
      ["입력", "바른 코드", column, ""],
      rows.map((r) => [r.name, r.good, r.bad, verdict(r)]),
      "llll",
    ),
    "",
    ...footer,
  ].join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 가장 단순한 방법을 제약 규모에 넣으면 몇 번인가. */
  "naive-scale": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const down = Array.from({ length: n }, (_, i) => n - i);
      const s = scanRight(down);
      const c = counted(down);
      rows.push([num(n), num(s.cmp), num(s.acc), num(c.acc)]);
    }
    const big = 100_000;
    rows.push([
      `${num(big)} (식)`,
      num((big * (big - 1)) / 2),
      num(2 * big + (big * (big - 1)) / 2),
      num(5 * big - 2),
    ]);
    return [
      grid(
        [
          "N",
          "차례로 읽기 · 견준 횟수",
          "차례로 읽기 · 배열 접근",
          "이 절차 · 배열 접근",
        ],
        rows,
        "lrrr",
      ),
      "",
      "└ 입력은 감소 수열이다 — 차례로 읽기의 최악이고, 답이 전부 -1 인 입력이다",
      "  차례로 읽기는 N(N−1)/2 로 커지고 이 절차는 5N − 2 로 커진다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 놓는다. */
  "two-ways": () => {
    const s = scanRight(BIG);
    const c = counted(BIG);
    const same = s.out.join(",") === c.out.join(",");
    return [
      grid(
        ["방식", "견준 횟수", "배열 접근", "답"],
        [
          [
            "매번 오른쪽을 차례로 읽는다",
            num(s.cmp),
            num(s.acc),
            same ? "같다" : "다르다",
          ],
          [
            "미정 자리를 남겨 두고 꼭대기부터 본다",
            num(c.cmp),
            num(c.acc),
            same ? "같다" : "다르다",
          ],
        ],
        "lrrl",
      ),
      "",
      `└ 입력은 nums[i] = (7919 i) mod 1009 인 1,024 칸이다. 답은 둘 다 같다`,
      `  견준 횟수가 ${num(s.cmp)} 에서 ${num(c.cmp)} 로 줄었다 — 뒤엣것은 자리마다 두 번을 안 넘는다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 몇 자리까지 남기는가로 답과 계수가 어떻게 갈리는가. */
  "keep-how-many": () => {
    const rows: string[][] = [];
    for (const keep of [1, 2, 4, 8, 12, 13, 14, BIG_N]) {
      const b = bounded(BIG, keep, false);
      rows.push([
        keep === BIG_N ? `전부(${num(BIG_N)})` : String(keep),
        num(b.cmp),
        num(b.wrong),
      ]);
    }
    const all = bounded(BIG, BIG_N, true);
    rows.push([`전부 · 아래까지 검사`, num(all.cmp), num(all.wrong)]);
    const least = (nums: number[]): number => {
      for (let k = 1; k <= nums.length; k++) {
        if (bounded(nums, k, false).wrong === 0) return k;
      }
      return nums.length;
    };
    // 감소 수열 뒤에 가장 큰 값 하나를 붙이면 미정 자리가 끝까지 쌓인다.
    const deep = [
      ...Array.from({ length: BIG_N - 1 }, (_, i) => BIG_N - 1 - i),
      BIG_N,
    ];
    return [
      grid(["남기는 자리 수", "견준 횟수", "틀린 자리"], rows, "lrr"),
      "",
      `└ 이 입력에서 스택이 가장 깊었을 때가 ${counted(BIG).peak} 칸이고, 틀린 자리가 0 이 되는 것은 ${least(BIG)} 부터다`,
      `  같은 스윕을 「감소 수열 ${num(BIG_N - 1)} 칸 뒤에 가장 큰 값 하나」로 다시 재면 ${num(least(deep))} 부터라, 상한을 둘 수 없다`,
      "  마지막 줄은 다 남기되 꼭대기에서 안 멈추고 아래까지 맞대 본 것이다 — 답은 같고 견준 횟수만 는다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 꺼내기를 한 번만 하면. */
  "pause-once-only": () =>
    mutantTable(
      [WALK, [1, 2, 3, 4], [4, 3, 2, 1], [1, 5, 2, 6]],
      onceOnly,
      "한 번만 꺼내는 코드",
      [
        "└ 한 걸음에 두 자리 이상을 꺼내야 하는 입력에서만 답이 갈린다",
        "  증가 수열은 걸음마다 한 자리씩만 꺼내므로 이 코드로도 답이 맞는다",
      ],
    ),

  /** `deep.walk.pause` — 남는 자리가 있다. */
  "pause-fill-zero": () =>
    mutantTable(
      [WALK, [1, 2, 3, 4], [4, 3, 2, 1]],
      fillZero,
      "0 을 깔아 둔 코드",
      [
        "└ 한 번도 안 꺼내진 자리가 그대로 남는다. 감소 수열은 다섯 자리가 전부 그렇다",
      ],
    ),

  /** `deep.walk.pause` — 값이 아니라 자리를 적으면. */
  "pause-write-index": () =>
    mutantTable(
      [WALK, [0, 1, 2, 3], [0, 1, 2, 3, 4], [1, 2, 3, 4]],
      writeIndex,
      "자리 번호를 적은 코드",
      [
        "└ nums[i] = i 인 배열에서는 값과 자리 번호가 같아 답이 안 갈린다",
        "  그런 배열만으로 시험하면 이 코드가 통과한다",
      ],
    ),

  /** `deep.math` ② — 기록의 정의를 전개 입력에 넣어 손으로 확인한다. */
  "records-check": () => {
    const c = counted(WALK);
    const rows = WALK.map((v, i) => {
      let at = -1;
      for (let j = i + 1; j < WALK.length; j++) {
        if ((WALK[j] ?? 0) > v) {
          at = j;
          break;
        }
      }
      return [
        String(i),
        String(v),
        at === -1 ? "없다" : `자리 ${at} 의 ${WALK[at] ?? 0}`,
        isRecord(WALK, i) ? "그렇다" : "아니다",
      ];
    });
    const rec = WALK.map((_, i) => i).filter((i) => isRecord(WALK, i));
    return [
      grid(
        ["자리 i", "nums[i]", "오른쪽에서 처음 더 큰 값", "기록인가"],
        rows,
        "lrll",
      ),
      "",
      `└ 기록이 ${rec.length} 개(자리 ${rec.join(" · ")})이고, 순회가 끝났을 때 스택에 남은 자리도 ${c.left} 개다`,
      `  꺼낸 횟수는 ${c.pops} 이고 N − S = ${WALK.length} − ${rec.length} = ${WALK.length - rec.length} 과 같다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 평균 기록 수가 조화수와 같은지 순열 전수로 대조한다. */
  "records-average": () => {
    const rows: string[][] = [];
    for (let n = 1; n <= 8; n++) {
      const avg = averageRecords(n);
      const h = harmonic(n);
      rows.push([
        String(n),
        avg.toFixed(6),
        h.toFixed(6),
        Math.abs(avg - h) < 1e-12 ? "0" : (avg - h).toExponential(2),
      ]);
    }
    const big = 100_000;
    const h = harmonic(big);
    return [
      grid(["N", "순열 전수 평균 기록 수", "H_N", "차이"], rows, "lrrr"),
      "",
      `└ 두 열이 여덟 줄에서 모두 같다. N = ${num(big)} 이면 H_N = ${h.toFixed(4)} 이고,`,
      `  평균 접근 8N − 5·H_N = ${num(Math.round((8 * big - 5 * h) * 10) / 10)} · 최악 8N − 7 = ${num(8 * big - 7)} 이다`,
    ].join("\n");
  },

  /** `invariant` ③ — 꺼내는 조건을 느슨하게 바꾸면. */
  "mutant-loose-compare": () =>
    mutantTable(
      [[5, 5, 5], WALK, [1, 2, 3, 4], [4, 3, 2, 1]],
      looseCompare,
      "느슨하게 꺼내는 코드",
      [
        "└ 같은 값이 두 번 이상 나오는 입력에서만 답이 갈린다",
        "  값이 전부 다른 입력만으로 시험하면 이 코드가 통과한다",
      ],
    ),

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const c = counted(WALK);
    const s = scanRight(WALK);
    const n = WALK.length;
    return [
      grid(
        ["갈래", "걸음", "배열 접근"],
        [
          ["답 없음을 깐다 ①", "—", num(n)],
          ["지금 값을 읽는다", "T1·T2·T3·T5·T8", num(n)],
          ["꼭대기와 맞대 본다 ②", "T2·T3·T4·T5·T6·T8", num(2 * c.cmp)],
          ["답을 확정한다 ③", "T3·T5·T6", num(c.pops)],
          ["자리를 넣는다 ④", "T1·T2·T4·T7·T8", num(n)],
          ["남은 자리는 그대로 둔다 ⑤", "T9", num(0)],
          ["합", "", num(c.acc)],
        ],
        "llr",
      ),
      "",
      `└ 같은 입력을 매번 오른쪽을 차례로 읽어 처리하면 ${num(s.acc)} 번이다.`,
      `  다섯 칸에서는 답 배열을 까는 ${num(n)} 번과 자리 넣기 ${num(n)} 번이 전체의 3 분의 1 이라 아직 손해다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양이 접근 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const n = BIG_N;
    const shapes: [string, number[]][] = [
      ["감소 수열", Array.from({ length: n }, (_, i) => n - i)],
      ["전부 같은 값", Array.from({ length: n }, () => 7)],
      ["곱셈 해시", BIG],
      ["증가 수열", Array.from({ length: n }, (_, i) => i)],
      [
        "두 번째로 큰 값이 맨 앞 · 가운데 증가 · 가장 큰 값이 맨 뒤",
        [n - 1, ...Array.from({ length: n - 2 }, (_, i) => i), n],
      ],
    ];
    const rows = shapes.map(([name, nums]) => {
      const c = counted(nums);
      return [
        name,
        num(c.pops),
        num(c.breaks),
        num(c.left),
        num(3 * n + 3 * c.pops + 2 * c.breaks),
        num(c.acc),
      ];
    });
    // 길이 여덟까지 순열을 전수로 살펴 8m − 7 을 넘는 것이 있는지 본다.
    let over = 0;
    let top = 0;
    for (let m = 2; m <= 8; m++) {
      const base = Array.from({ length: m }, (_, i) => i + 1);
      const walk = (rest: number[], acc: number[]): void => {
        if (rest.length === 0) {
          const a = counted(acc).acc;
          if (a > 8 * m - 7) over++;
          if (m === 8 && a > top) top = a;
          return;
        }
        for (let i = 0; i < rest.length; i++) {
          walk(
            [...rest.slice(0, i), ...rest.slice(i + 1)],
            [...acc, rest[i] ?? 0],
          );
        }
      };
      walk(base, []);
    }
    return [
      grid(
        [
          "입력의 모양",
          "꺼낸 횟수 P",
          "멈춰 선 걸음 B",
          "남은 자리 S",
          "3N + 3P + 2B",
          "실측 접근",
        ],
        rows,
        "lrrrrr",
      ),
      "",
      `└ 다섯째 열과 여섯째 열이 모든 줄에서 같다. N = ${num(n)} 에서 가장 많은 것은 ${num(8 * n - 7)} 이고 8N − 7 과 같다`,
      `  길이 2~8 순열을 전수로 살펴 8N − 7 을 넘는 입력을 찾았고 결과는 ${over} 개다(길이 8 의 최댓값 ${top} = 8·8 − 7)`,
    ].join("\n");
  },
};
