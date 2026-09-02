/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts largestRectangleInHistogram-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { largestRectangleInHistogram } from "./largestRectangleInHistogram-guide.ref.ts";

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

/** `[2 1 5 6 2 3]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const values = (xs: number[]): string => `[${xs.join(" ")}]`;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK: number[] = [2, 1, 5, 6, 2, 3];

/**
 * 「아이디어 상세」 ④⑥ 이 함께 쓰는 큰 입력. 난수를 쓰지 않는다.
 *
 * `+ 1` 이 붙은 이유가 있다. 나머지만 쓰면 `i` 가 211 의 배수인 다섯 칸의 높이가 0 이 되고,
 * **높이 0 인 막대는 보초와 견줘도 안 꺼내져** 그 다섯 자리가 통에 남는다. 모양별 대조에서
 * 한 줄만 `P ≠ N` 이 되어 표가 읽히지 않으므로, 여기서는 높이를 1 이상으로 둔다. 높이 0 이
 * 하는 일은 「케이스별 비용과 그 경계」가 따로 잰다.
 */
const BIG_N = 1024;
const BIG: number[] = Array.from(
  { length: BIG_N },
  (_, i) => ((i * 4093) % 211) + 1,
);

const up = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);
const down = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => n - i);
const flat = (n: number): number[] => Array.from({ length: n }, () => 7);
/** 가운데가 가장 높은 산 모양. 양쪽으로 뻗기가 가운데에서 멀리 간다. */
const hill = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => Math.min(i + 1, n - i));
/** 앞 절반은 내려가고 뒤 절반은 올라가는 계곡 모양. 멈춘 걸음이 절반쯤 나온다. */
const valley = (n: number): number[] => {
  const h = Math.floor(n / 2);
  return Array.from({ length: n }, (_, i) => (i < h ? h - i : i - h + 1));
};

/* ────────────────────── 계측기 — heights 읽기 ────────────────────── */

/**
 * 세는 것은 **높이 배열 `heights` 를 읽은 횟수**다. 벽시계·처리량은 실행마다 값이 달라
 * 「본문의 수치가 실측과 같은가」를 정의할 수 없다.
 *
 * 통(`stack`)에 넣고 빼는 일은 `heights` 를 안 읽으므로 이 수에 안 들어간다. 통 연산은
 * 따로 세어 `stackReads`·`stackWrites` 에 담는다.
 */
interface Counted {
  best: number;
  /** `heights` 를 읽은 횟수. */
  reads: number;
  /** 통을 읽은 횟수 — 꼭대기 보기 + 왼쪽 경계 보기(통이 비면 읽을 칸이 없다). */
  stackReads: number;
  /** 통에 쓴 횟수 — 넣기 + 꺼내기. */
  stackWrites: number;
  /** 꺼낸 횟수 `P`. 보초 덕분에 언제나 `N` 이다. */
  pops: number;
  /** 꺼낼 것이 남았는데도 조건이 안 맞아 멈춘 걸음의 수 `B`. */
  breaks: number;
  /** 꺼내고 나서 통이 빈 횟수 `M` — 왼쪽으로 끝까지 뻗는 막대의 수다. */
  empties: number;
  /** 통이 가장 깊었을 때의 칸 수. */
  peak: number;
}

function stackCount(heights: number[]): Counted {
  const n = heights.length;
  const stack: number[] = [];
  let best = 0;
  let reads = 0;
  let stackReads = 0;
  let stackWrites = 0;
  let pops = 0;
  let breaks = 0;
  let empties = 0;
  let peak = 0;

  for (let i = 0; i <= n; i++) {
    let cur = 0;
    if (i < n) {
      reads++;
      cur = heights[i] ?? 0;
    }
    let broke = false;
    while (stack.length > 0) {
      stackReads++; // 꼭대기 보기
      const top = stack[stack.length - 1] ?? 0;
      reads++; // heights[top] — 견주기
      if ((heights[top] ?? 0) <= cur) {
        broke = true;
        break;
      }
      stack.pop();
      stackWrites++;
      pops++;
      let left = -1;
      if (stack.length > 0) {
        stackReads++; // 왼쪽 경계 보기
        left = stack[stack.length - 1] ?? 0;
      } else {
        empties++;
      }
      const width = i - left - 1;
      reads++; // heights[top] — 넓이
      const area = (heights[top] ?? 0) * width;
      if (area > best) best = area;
    }
    if (broke) breaks++;
    stack.push(i);
    stackWrites++;
    if (stack.length > peak) peak = stack.length;
  }

  return {
    best,
    reads,
    stackReads,
    stackWrites,
    pops,
    breaks,
    empties,
    peak,
  };
}

/** 계측기가 정본과 같은 답을 내는지 그 자리에서 확인한다. */
function counted(heights: number[]): Counted {
  const c = stackCount(heights);
  const want = largestRectangleInHistogram([...heights]);
  if (c.best !== want) {
    throw new Error(
      "계측기와 정본의 답이 다르다 — 계수가 다른 절차를 잰 것이다",
    );
  }
  return c;
}

/**
 * 가장 단순한 방법 — **모든 구간을 열거하며 최솟값을 이어 간다.**
 *
 * 왼쪽 끝을 고정하고 오른쪽 끝을 한 칸씩 늘리면 최솟값을 다시 안 구해도 된다. 그래도 구간의
 * 개수만큼 `heights` 를 읽는다.
 */
function allIntervals(heights: number[]): { best: number; reads: number } {
  const n = heights.length;
  let best = 0;
  let reads = 0;
  for (let l = 0; l < n; l++) {
    let low = Number.POSITIVE_INFINITY;
    for (let r = l; r < n; r++) {
      reads++;
      low = Math.min(low, heights[r] ?? 0);
      const area = low * (r - l + 1);
      if (area > best) best = area;
    }
  }
  return { best, reads };
}

/**
 * 막대마다 **양쪽으로 뻗어 보는** 방법. 자리 `j` 에서 왼쪽·오른쪽으로 `heights[j]` 이상인
 * 동안 걸어가 폭을 잰다. 답은 맞고, 뻗은 칸 수가 입력의 모양에 따라 갈린다.
 */
function expandBoth(heights: number[]): { best: number; reads: number } {
  const n = heights.length;
  let best = 0;
  let reads = 0;
  for (let j = 0; j < n; j++) {
    reads++;
    const h = heights[j] ?? 0;
    let l = j;
    while (l - 1 >= 0) {
      reads++;
      if ((heights[l - 1] ?? 0) < h) break;
      l--;
    }
    let r = j;
    while (r + 1 < n) {
      reads++;
      if ((heights[r + 1] ?? 0) < h) break;
      r++;
    }
    const area = h * (r - l + 1);
    if (area > best) best = area;
  }
  return { best, reads };
}

/* ────────────────── 정의를 그대로 옮긴 코드 (deep.math) ────────────────── */

/** 자리 `j` 의 왼쪽 경계 — `j` 왼쪽에서 처음 만나는 `heights[j]` **이하**인 자리. 없으면 `-1`. */
function leftBound(heights: number[], j: number): number {
  for (let k = j - 1; k >= 0; k--) {
    if ((heights[k] ?? 0) <= (heights[j] ?? 0)) return k;
  }
  return -1;
}

/** 자리 `j` 의 오른쪽 경계 — `j` 오른쪽에서 처음 만나는 `heights[j]` **미만**인 자리. 없으면 `N`. */
function rightBound(heights: number[], j: number): number {
  for (let k = j + 1; k < heights.length; k++) {
    if ((heights[k] ?? 0) < (heights[j] ?? 0)) return k;
  }
  return heights.length;
}

/** 정의만으로 답을 낸다 — 후보 `N` 개의 최댓값. */
function byDefinition(heights: number[]): number {
  let best = 0;
  for (let j = 0; j < heights.length; j++) {
    const w = rightBound(heights, j) - leftBound(heights, j) - 1;
    const area = (heights[j] ?? 0) * w;
    if (area > best) best = area;
  }
  return best;
}

/** 길이 `1..len` · 값 `0..max` 인 배열을 전부 만든다. */
function everyArray(
  len: number,
  max: number,
  visit: (a: number[]) => void,
): void {
  const walk = (acc: number[]): void => {
    if (acc.length > 0) visit(acc);
    if (acc.length === len) return;
    for (let v = 0; v <= max; v++) walk([...acc, v]);
  };
  walk([]);
}

/* ────────────────────────── 변이 넷 ────────────────────────── */

interface Impl {
  largestRectangleInHistogram: (heights: number[]) => number;
}

const REF = new URL(
  "./largestRectangleInHistogram-guide.ref.ts",
  import.meta.url,
).pathname;

/** 폭에서 `-1` 을 빠뜨린 사본 — 왼쪽 경계 자리까지 세어 버린다. */
const wideByOne = await loadMutant<Impl>(REF, {
  swap: [/const width = i - left - 1;/, "const width = i - left;"],
});

/** 보초 걸음을 없앤 사본 — 순회가 `N-1` 에서 끝난다. */
const noSentinel = await loadMutant<Impl>(REF, {
  swap: [/i <= n;/, "i < n;"],
});

/** 같은 높이도 꺼내는 사본 — 꺼내는 조건을 느슨하게 바꿨다. */
const looseCompare = await loadMutant<Impl>(REF, {
  swap: [
    /if \(\(heights\[top\] \?\? 0\) <= cur\) break;/,
    "if ((heights[top] ?? 0) < cur) break;",
  ],
});

/** 통이 비었을 때의 왼쪽 경계를 `0` 으로 둔 사본. 불변식의 바닥 조항을 지키던 그 줄이다. */
const leftBaseZero = await loadMutant<Impl>(REF, {
  swap: [/\) : -1;/, ") : 0;"],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. */
function assertBreaks(rows: { good: string; bad: string }[]): void {
  if (rows.every((r) => r.good === r.bad)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

function compare(
  inputs: number[][],
  mutated: Impl,
): { name: string; good: string; bad: string }[] {
  return inputs.map((heights) => ({
    name: values(heights),
    good: String(largestRectangleInHistogram([...heights])),
    bad: String(mutated.largestRectangleInHistogram([...heights])),
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
      "lrrl",
    ),
    "",
    ...footer,
  ].join("\n");
}

/** 꺼낼 때마다 낸 (자리 · 폭 · 넓이) 를 순서대로 적는다. `strict` 가 거짓이면 같은 높이도 꺼낸다. */
function popLog(
  heights: number[],
  strict: boolean,
): { at: number; width: number; area: number }[] {
  const n = heights.length;
  const stack: number[] = [];
  const log: { at: number; width: number; area: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const cur = i === n ? 0 : (heights[i] ?? 0);
    while (stack.length > 0) {
      const top = stack[stack.length - 1] ?? 0;
      const h = heights[top] ?? 0;
      if (strict ? h <= cur : h < cur) break;
      stack.pop();
      const left = stack.length > 0 ? (stack[stack.length - 1] ?? 0) : -1;
      const width = i - left - 1;
      log.push({ at: top, width, area: h * width });
    }
    stack.push(i);
  }
  return log;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 모든 구간을 열거하면 제약 규모에서 몇 번인가. */
  "naive-scale": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const a = up(n);
      const s = allIntervals(a);
      const c = counted(a);
      rows.push([
        num(n),
        num(s.reads),
        num(c.reads),
        num(Math.round(s.reads / c.reads)),
      ]);
    }
    const big = 100_000;
    const naive = (big * (big + 1)) / 2;
    rows.push([
      `${num(big)} (식)`,
      num(naive),
      num(4 * big - 1),
      num(Math.round(naive / (4 * big - 1))),
    ]);
    return [
      grid(
        ["N", "구간 열거 · heights 읽기", "이 절차 · heights 읽기", "몇 배"],
        rows,
        "lrrr",
      ),
      "",
      "└ 입력은 증가 수열이다 — 이 절차의 최악이고, 구간 열거는 어느 입력에서나 같은 횟수다",
      "  구간 열거는 구간 하나에 한 번씩 읽어 N(N+1)/2 로 커지고 이 절차는 4N − 1 을 안 넘는다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 놓는다. */
  "two-ways": () => {
    const s = allIntervals(BIG);
    const e = expandBoth(BIG);
    const c = counted(BIG);
    const same = s.best === c.best && e.best === c.best;
    const mark = (): string => (same ? "같다" : "다르다");
    return [
      grid(
        ["방식", "본 후보의 수", "heights 읽기", "답"],
        [
          [
            "구간을 전부 열거한다",
            num((BIG_N * (BIG_N + 1)) / 2),
            num(s.reads),
            mark(),
          ],
          ["막대마다 양쪽으로 뻗는다", num(BIG_N), num(e.reads), mark()],
          ["통에 담아 두고 꺼낼 때 잰다", num(BIG_N), num(c.reads), mark()],
        ],
        "lrrl",
      ),
      "",
      `└ 입력은 heights[i] = (4093 i) mod 211 + 1 인 ${num(BIG_N)} 칸이다. 답은 셋 다 ${num(c.best)} 로 같다`,
      `  뒤의 둘은 후보가 같은데 읽기가 ${num(e.reads)} 대 ${num(c.reads)} 로 ${Math.round((e.reads / c.reads) * 10) / 10} 배 갈린다 — 폭을 어떻게 재는가의 차이다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 통에 높이만 담으면 폭을 못 잰다. */
  "keep-height-only": () => {
    const rows = [WALK, [3, 1, 3], up(5), flat(4)].map((a) => {
      const tall = Math.max(...a);
      const right = largestRectangleInHistogram([...a]);
      return [
        values(a),
        String(tall),
        String(right),
        tall === right ? "같다" : "다르다",
      ];
    });
    return [
      grid(
        ["입력", "높이만 담은 코드", "자리를 담은 코드", "답이"],
        rows,
        "lrrl",
      ),
      "",
      "└ 높이만 담으면 꺼낼 때 폭을 1 로 셀 수밖에 없어 답이 가장 높은 막대 하나가 된다",
      "  자리를 담으면 폭이 두 자리의 차로 나온다 — 담는 것이 자리여야 하는 이유가 이것 하나다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 입력의 모양을 바꾸면 두 방식의 계수가 어떻게 갈리는가. */
  "shape-sweep": () => {
    const n = BIG_N;
    const shapes: [string, number[]][] = [
      ["감소 수열", down(n)],
      ["계곡 모양(앞은 내려가고 뒤는 올라간다)", valley(n)],
      ["곱셈 나머지", BIG],
      ["산 모양(가운데가 가장 높다)", hill(n)],
      ["증가 수열", up(n)],
      ["전부 같은 값", flat(n)],
    ];
    const rows = shapes.map(([name, a]) => {
      const e = expandBoth(a);
      const c = counted(a);
      if (e.best !== c.best) throw new Error(`${name}: 두 방식의 답이 다르다`);
      return [name, num(e.reads), num(c.reads), num(c.breaks)];
    });
    const spread = shapes.map(([, a]) => expandBoth(a).reads);
    return [
      grid(
        ["입력의 모양", "양쪽으로 뻗기", "이 절차", "멈춘 걸음 B"],
        rows,
        "lrrr",
      ),
      "",
      `└ N = ${num(n)} 이다. 뻗기는 ${num(Math.min(...spread))} 에서 ${num(Math.max(...spread))} 까지 ${Math.round(Math.max(...spread) / Math.min(...spread))} 배로 갈리고,`,
      `  이 절차는 ${num(3 * n)} 에서 ${num(4 * n - 1)} 사이를 못 벗어난다 — 갈리는 것은 B 하나다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 폭에서 1 을 안 빼면. */
  "pause-width-off-by-one": () =>
    mutantTable(
      [WALK, [2, 1, 2], [3, 3], [5], [0, 0]],
      wideByOne,
      "1 을 안 뺀 코드",
      [
        "└ 폭이 늘 한 칸씩 넓어져 답이 부풀려진다. 15 는 높이 5 에 폭 3 이고, 그 폭에는",
        "  높이 1 인 자리 1 이 들어가 있다 — 히스토그램 안에 그릴 수 없는 직사각형이다",
        "  높이가 전부 0 인 입력만 안 갈린다. 넓이가 폭과 무관하게 0 이기 때문이다",
      ],
    ),

  /** `deep.walk.pause` — 보초 걸음이 없으면. */
  "pause-no-sentinel": () =>
    mutantTable(
      [WALK, up(5), flat(4), [2, 4], down(5)],
      noSentinel,
      "보초 걸음이 없는 코드",
      [
        "└ 순회가 끝났을 때 통에 남은 자리는 넓이를 한 번도 못 낸다",
        "  전개 입력은 남은 자리의 넓이가 이미 나온 10 보다 작아 답이 안 갈린다",
      ],
    ),

  /** `deep.walk.pause` — 같은 높이도 꺼내면 폭은 갈리는데 최댓값은 안 갈린다. */
  "pause-loose-compare": () => {
    const input = flat(4);
    const widthAt = (log: { at: number; width: number }[], j: number): number =>
      log.find((e) => e.at === j)?.width ?? 0;
    const strict = popLog(input, true);
    const loose = popLog(input, false);
    const rows = input.map((h, j) => {
      const s = widthAt(strict, j);
      const l = widthAt(loose, j);
      return [
        String(j),
        String(h),
        `${s} (넓이 ${h * s})`,
        `${l} (넓이 ${h * l})`,
        s === l ? "같다" : "다르다",
      ];
    });
    let checked = 0;
    let differ = 0;
    everyArray(7, 3, (a) => {
      checked++;
      if (
        largestRectangleInHistogram([...a]) !==
        looseCompare.largestRectangleInHistogram([...a])
      ) {
        differ++;
      }
    });
    if (differ !== 0) {
      throw new Error("최댓값이 갈리는 입력이 있다 — 본문의 주장이 거짓이다");
    }
    return [
      grid(
        ["자리 j", "heights[j]", "바른 코드의 폭", "느슨한 코드의 폭", "폭이"],
        rows,
        "lrlll",
      ),
      "",
      `└ 입력은 ${values(input)} 이고 두 코드의 답은 둘 다 ${largestRectangleInHistogram([...input])} 이다`,
      "  전체 폭 4 를 바른 코드는 무리의 첫 자리에, 느슨한 코드는 마지막 자리에 준다",
      `  길이 1~7 · 값 0~3 인 배열 ${num(checked)} 개를 전수로 돌려 답이 갈린 것은 ${differ} 개다`,
    ].join("\n");
  },

  /** `deep.math` ② — 경계의 정의를 전개 입력에 넣어 손으로 확인한다. */
  "boundary-check": () => {
    const rows = WALK.map((h, j) => {
      const l = leftBound(WALK, j);
      const r = rightBound(WALK, j);
      return [
        String(j),
        String(h),
        String(l),
        String(r),
        String(r - l - 1),
        String(h * (r - l - 1)),
      ];
    });
    const def = byDefinition(WALK);
    const ref = largestRectangleInHistogram([...WALK]);
    return [
      grid(
        ["자리 j", "heights[j]", "L(j)", "R(j)", "폭 R−L−1", "넓이"],
        rows,
        "lrrrrr",
      ),
      "",
      `└ 여섯 후보의 최댓값이 ${def} 이고 정본이 낸 답 ${ref} 과 같다`,
      `  자리 0 은 왼쪽에 막대가 없어 L = -1 이고, 자리 1 은 오른쪽에 더 낮은 막대가 없어`,
      `  R = N = ${WALK.length} 다 — 왼쪽 끝 밖과 오른쪽 끝 밖이 그 두 값이다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 후보를 N 개로 줄인 것이 임의의 입력에서 옳은가, 그리고 규모가 얼마인가. */
  "boundary-general": () => {
    let checked = 0;
    let differ = 0;
    everyArray(7, 3, (a) => {
      checked++;
      if (byDefinition(a) !== largestRectangleInHistogram([...a])) differ++;
    });
    const rows: string[][] = [];
    for (const n of [6, 1_000, 100_000]) {
      rows.push([
        num(n),
        num((n * (n + 1)) / 2),
        num(n),
        num(Math.round(((n + 1) / 2) * 10) / 10),
      ]);
    }
    return [
      grid(
        ["N", "구간 N(N+1)/2 개", "후보 N 개", "몇 배 줄었나"],
        rows,
        "lrrr",
      ),
      "",
      `└ 길이 1~7 · 값 0~3 인 배열 ${num(checked)} 개에서 정의로 낸 답과 정본의 답이 갈린 것은 ${differ} 개다`,
      `  N = ${num(100_000)} 에서 구간은 ${num((100_000 * 100_001) / 2)} 개인데 후보는 ${num(100_000)} 개다`,
    ].join("\n");
  },

  /** `invariant` — 통이 비었을 때의 왼쪽 경계를 0 으로 두면. */
  "mutant-left-base": () =>
    mutantTable(
      [flat(4), down(5), up(5), WALK],
      leftBaseZero,
      "왼쪽 경계를 0 으로 둔 코드",
      [
        "└ 왼쪽으로 끝까지 뻗는 막대의 폭이 한 칸씩 줄어든다",
        "  전개 입력은 그 막대의 넓이가 답이 아니라서 갈리지 않는다",
      ],
    ),

  /** `perf.derive` — 전개가 실제로 몇 번 읽었는가. */
  "walk-cost": () => {
    const c = counted(WALK);
    const n = WALK.length;
    return [
      grid(
        ["갈래", "걸음", "heights 읽기"],
        [
          ["지금 높이를 읽는다", "T1·T2·T4·T5·T6·T9", num(n)],
          [
            "꼭대기와 맞대 본다",
            "T2·T4·T5·T6·T7·T8·T9·T10·T11·T12",
            num(c.pops + c.breaks),
          ],
          ["넓이를 낸다", "T2·T6·T7·T10·T11·T12", num(c.pops)],
          ["넣는다 — heights 를 안 읽는다", "T1·T3·T4·T5·T8·T9·T13", "0"],
          ["합", "", num(c.reads)],
        ],
        "llr",
      ),
      "",
      `└ P = ${c.pops} 이고 N = ${n} 과 같다. 높이 0 인 막대가 없으면 늘 그렇다`,
      `  B = ${c.breaks} · M = ${c.empties} 이고 N + 2P + B = ${n + 2 * c.pops + c.breaks} 이 실측 ${c.reads} 과 같다`,
      `  통 연산은 넣기 ${c.stackWrites - c.pops} · 꺼내기 ${c.pops} · 읽기 ${c.stackReads} 로 ${c.stackReads + c.stackWrites} 번이다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양이 읽기 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const n = BIG_N;
    const shapes: [string, number[]][] = [
      ["강한 감소 수열", down(n)],
      ["계곡 모양", valley(n)],
      ["산 모양", hill(n)],
      ["곱셈 나머지", BIG],
      ["전부 같은 값", flat(n)],
      ["증가 수열", up(n)],
    ];
    const rows = shapes.map(([name, a]) => {
      const c = counted(a);
      return [
        name,
        num(c.pops),
        num(c.breaks),
        num(c.empties),
        num(3 * n + c.breaks),
        num(c.reads),
      ];
    });
    const LEN = 8;
    let over = 0;
    let top = 0;
    everyArray(LEN, 3, (a) => {
      const c = counted(a);
      if (c.reads > 4 * a.length - 1) over++;
      if (a.length === LEN && c.reads > top) top = c.reads;
    });
    return [
      grid(
        [
          "입력의 모양",
          "꺼낸 횟수 P",
          "멈춘 걸음 B",
          "통을 비운 꺼내기 M",
          "3N + B",
          "실측 읽기",
        ],
        rows,
        "lrrrrr",
      ),
      "",
      `└ 다섯째 열과 여섯째 열이 모든 줄에서 같다. N = ${num(n)} 에서 가장 많은 것은 ${num(4 * n - 1)} 이고 4N − 1 과 같다`,
      `  길이 1~${LEN} · 값 0~3 인 배열을 전수로 살펴 4N − 1 을 넘는 입력을 찾았고 결과는 ${over} 개다(길이 ${LEN} 의 최댓값 ${top} = 4·${LEN} − 1)`,
    ].join("\n");
  },

  /** `perf.bounds` — 높이 0 인 막대가 몇을 바꾸는가. */
  "zero-bars": () => {
    const cases: [string, number[]][] = [
      ["[2 1 5 6 2 3] — 0 이 없다", WALK],
      ["[2 0 2]", [2, 0, 2]],
      ["[0 0 0 0]", [0, 0, 0, 0]],
      ["[0 5 0 5 0]", [0, 5, 0, 5, 0]],
    ];
    const rows = cases.map(([name, a]) => {
      const c = counted(a);
      const z = a.filter((h) => h === 0).length;
      if (c.pops !== a.length - z) {
        throw new Error(`${name}: P 가 N − Z 가 아니다`);
      }
      return [
        name,
        String(a.length),
        String(z),
        String(c.pops),
        String(c.breaks),
        String(a.length + 2 * c.pops + c.breaks),
        String(c.reads),
        String(c.best),
      ];
    });
    return [
      grid(
        ["입력", "N", "Z", "P", "B", "N + 2P + B", "실측 읽기", "답"],
        rows,
        "lrrrrrrr",
      ),
      "",
      "└ 보초의 높이가 0 이라 높이 0 인 막대는 「엄격하게 높다」를 만족하지 못해 안 꺼내진다",
      "  그래서 P = N − Z 이고, 안 꺼내진 자리의 넓이는 0 이라 답에 영향이 없다",
      "  전부 0 이면 읽기가 2N 으로 줄어든다 — 이 절차의 가장 적은 값이다",
    ].join("\n");
  },
};
