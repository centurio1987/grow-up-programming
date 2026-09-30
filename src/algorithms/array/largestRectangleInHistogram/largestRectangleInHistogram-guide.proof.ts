/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.** 정본이 읽은 칸의
 * 기록(`run` · `count` · `eachMoment`)과 걸음(`WALK_STEPS`)은 그림 사이드카가 만든 것을 그대로 받는다 — 그림과
 * 표가 같은 기록을 쓴다. 비용은 원고 전체가 한 기준으로 센다 — **배열 접근 수**(읽기 + 쓰기)이고, 세는 규칙은
 * 그림 사이드카의 `count` 머리 주석에 있다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/largestRectangleInHistogram/largestRectangleInHistogram-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  afterRead,
  allIntervals,
  BIG,
  BIG_N,
  byDefinition,
  count,
  dots,
  down,
  eachMoment,
  everyArray,
  expandBoth,
  flat,
  heightStack,
  hill,
  leftBound,
  naiveCount,
  num,
  POPPED,
  rightBound,
  run,
  seconds,
  show,
  stackOnUp,
  strictPop,
  TASK_N,
  twoPass,
  up,
  valley,
  WALK,
  WALK_STEPS,
  type WalkStep,
  walkOf,
} from "./largestRectangleInHistogram-guide.fig.tsx";
import { largestRectangleInHistogram } from "./largestRectangleInHistogram-guide.ref.ts";

const REF = new URL(
  "./largestRectangleInHistogram-guide.ref.ts",
  import.meta.url,
).pathname;

/* ───────────────────────── 표 그리기 ───────────────────────── */

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

const block = (...parts: string[]): string => parts.join("\n\n");

/** `[2, 1, 5, 6, 2, 3]` 꼴 — 코드 안의 배열 표기. */
const code = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

const h = (p: number): number => (p < WALK.length ? (WALK[p] as number) : 0);
const ref = (xs: readonly number[]): number =>
  largestRectangleInHistogram([...xs]);

/** 큰 입력의 이름 — 본문과 같은 말로 적는다. */
const BIG_NAME = `heights[i] = (4093 i) mod 211 + 1 인 ${num(BIG_N)} 칸`;

/** 1,024 칸 입력의 모양 여섯 — 비용 절들이 같은 목록을 쓴다. */
const SHAPES: [string, number[]][] = [
  ["감소 수열", down(BIG_N)],
  ["계곡 모양(앞은 내려가고 뒤는 올라간다)", valley(BIG_N)],
  [BIG_NAME, [...BIG]],
  ["산 모양(가운데가 가장 높다)", hill(BIG_N)],
  ["증가 수열", up(BIG_N)],
  ["높이가 전부 같다", flat(BIG_N)],
];

/* ───────────────────────── 변이 넷 ───────────────────────── */

interface Mod {
  largestRectangleInHistogram: (heights: number[]) => number;
}

/** 폭에서 `-1` 을 빠뜨린 사본 — 왼쪽 경계 자리까지 세어 버린다. */
const wideByOne = await loadMutant<Mod>(REF, {
  swap: [/const width = i - left - 1;/, "const width = i - left;"],
});

/** 보초 걸음을 없앤 사본 — 순회가 `N-1` 에서 끝난다. */
const noSentinel = await loadMutant<Mod>(REF, {
  swap: [/i <= n;/, "i < n;"],
});

/** 같은 높이도 꺼내는 사본 — 꺼내는 조건을 느슨하게 바꿨다. */
const looseCompare = await loadMutant<Mod>(REF, {
  swap: [
    /if \(\(heights\[top\] \?\? 0\) <= cur\) break;/,
    "if ((heights[top] ?? 0) < cur) break;",
  ],
});

/** 단조 스택이 비었을 때의 왼쪽 경계를 `0` 으로 둔 사본. 불변식의 바닥 조항을 지키던 그 줄이다. */
const leftBaseZero = await loadMutant<Mod>(REF, {
  swap: [/\) : -1;/, ") : 0;"],
});

/**
 * 정본과 변이를 같은 입력들에 걸고 답을 나란히 적는다. 변이가 어느 입력에서도 답을 안 바꾸면 「깨진다」가
 * 거짓이다 — 다만 중화 실행에서는 변이 모듈이 정본 그대로라 이 검사를 건너뛴다(SPEC §0 「자기검사를 중화
 * 실행에서 건너뛰게 쓴다」).
 */
function mutantBlock(
  inputs: readonly number[][],
  mutated: Mod,
  column: string,
): string {
  const neutral =
    mutated.largestRectangleInHistogram === largestRectangleInHistogram;
  const rows = inputs.map((xs) => ({
    name: show(xs),
    good: String(ref(xs)),
    bad: String(mutated.largestRectangleInHistogram([...xs])),
  }));
  if (!neutral && rows.every((r) => r.good === r.bad)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
  const diff = rows.filter((r) => r.good !== r.bad).length;
  return block(
    md(
      ["입력", "바른 코드", column, "답"],
      rows.map((r) => [
        r.name,
        r.good,
        r.bad,
        r.good === r.bad ? "같다" : "다르다",
      ]),
      [1, 2],
    ),
    `${rows.length} 벌 중 ${diff} 벌에서 답이 다릅니다.`,
  );
}

/* ───────────────────────── 작은 도움 ───────────────────────── */

/** 구간마다 가장 왼쪽 최솟값의 자리. */
function leftmostMin(xs: readonly number[], l: number, r: number): number {
  let m = l;
  for (let p = l; p <= r; p++) if ((xs[p] as number) < (xs[m] as number)) m = p;
  return m;
}

/** 자리마다 오른쪽에서 처음 만나는 더 작은 값 — 정의 그대로. */
const nextSmaller = (xs: readonly number[]): number[] =>
  xs.map((x, i) => {
    for (let j = i + 1; j < xs.length; j++)
      if ((xs[j] as number) < x) return xs[j] as number;
    return -1;
  });

/** 두 경계 사이의 칸 — `[left+1, left+width]`. */
const span = (s: WalkStep): string =>
  `[${(s.left as number) + 1},${(s.left as number) + (s.width as number)}]`;

/** 걸음 목록을 `T1 · T3` 꼴로. */
const ids = (xs: readonly WalkStep[]): string =>
  xs.map((s) => s.id).join(" · ");

/** 걸음이 그 자리 `i` 의 첫 걸음인가. */
const firstOfI = (s: WalkStep, k: number): boolean =>
  k === 0 || (WALK_STEPS[k - 1] as WalkStep).i !== s.i;

/** 걸음 하나가 실행한 갈래 — 정본의 원문자 라벨. */
function branches(s: WalkStep, first: boolean): string[] {
  const out: string[] = [];
  if (first) out.push("②");
  if (s.kind === "pop") out.push("③", "④");
  else if (s.kind === "stop") out.push("③", "⑤");
  else if (s.kind === "push") out.push("⑤");
  else out.push("⑤", "⑥");
  return out;
}

/** 꺼낸 자리마다(꺼낸 순서) 꺼낸 뒤의 꼭대기를 받는다 — 큰 입력용. */
function eachPop(
  xs: readonly number[],
  visit: (popped: number, below: number) => void,
): void {
  let lastPopped = -1;
  eachMoment(xs, (e, stack) => {
    if (e.kind === "cmp" && e.pop) lastPopped = e.top;
    if (e.kind === "area") visit(lastPopped, stack.at(-1) ?? -1);
  });
}

/* ───────────────────────── 증명 블록 ───────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `prereq` — 같은 배열로 비슷한 물음 넷에 답한다. */
  "prereq-questions": () =>
    md(
      ["물음", `${show(WALK)} 의 답`, "이 글에서"],
      [
        [
          "안에 그릴 수 있는 가장 큰 직사각형의 넓이",
          String(ref(WALK)),
          "다룬다",
        ],
        [
          "자리마다 오른쪽에서 처음 만나는 더 작은 값",
          show(nextSmaller(WALK)),
          "nextGreaterElement 의 부등호를 뒤집은 물음이다",
        ],
        ["가장 높은 막대", String(Math.max(...WALK)), "최댓값 하나다"],
        [
          "배열 전체를 덮는 직사각형의 넓이",
          String(Math.min(...WALK) * WALK.length),
          "구간이 하나로 정해져 있다",
        ],
      ],
    ),

  /** `deep.origin` ② — 구간을 전부 열거하면 과제 규모에서 몇 번인가. */
  "origin-naive-scale": () => {
    const rows = [1_000, 10_000].map((n) => {
      const a = up(n);
      const s = allIntervals(a);
      const c = count(a);
      if (s.best !== c.best) throw new Error("두 방법의 답이 다르다");
      return [num(n), num(s.acc), num(c.acc), seconds(s.acc)];
    });
    const naive = naiveCount(TASK_N);
    rows.push([
      num(TASK_N),
      num(naive),
      num(stackOnUp(TASK_N)),
      seconds(naive),
    ]);
    return block(
      md(
        [
          "N",
          "구간 열거의 배열 접근",
          "이 글이 만들 절차의 배열 접근",
          "구간 열거의 시간(초당 1 억 번)",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `입력은 증가 수열입니다. N = 1,000 · 10,000 은 실제로 세었고, N = ${num(TASK_N)} 은 두 실측과 맞는 식 N(N+1)/2 와 8N − 2 에 넣은 값입니다. 구간 열거는 입력의 모양과 상관없이 구간 하나에 한 번씩 읽습니다.`,
    );
  },

  /** `deep.origin` ③ — 구간을 그 구간의 가장 낮은 막대로 묶는다. */
  "origin-groups": () => {
    const n = WALK.length;
    const size = new Array<number>(n).fill(0);
    const wide: ([number, number] | undefined)[] = new Array(n).fill(undefined);
    let enumerated = 0;
    for (let l = 0; l < n; l++) {
      for (let r = l; r < n; r++) {
        const m = leftmostMin(WALK, l, r);
        size[m] = (size[m] as number) + 1;
        const w = wide[m];
        if (w === undefined || r - l > w[1] - w[0]) wide[m] = [l, r];
        enumerated = Math.max(enumerated, (WALK[m] as number) * (r - l + 1));
      }
    }
    const areaOf = (j: number): number => {
      const [l, r] = wide[j] as [number, number];
      return (WALK[j] as number) * (r - l + 1);
    };
    const rows = WALK.map((v, j) => {
      const [l, r] = wide[j] as [number, number];
      return [
        String(j),
        String(v),
        String(size[j]),
        `[${l},${r}]`,
        String(areaOf(j)),
      ];
    });
    const total = size.reduce((a, b) => a + b, 0);
    const best = Math.max(...WALK.map((_, j) => areaOf(j)));
    return block(
      md(
        [
          "자리 j",
          "높이",
          "그 자리가 가장 낮은 막대인 구간 수",
          "그중 가장 넓은 구간",
          "넓이",
        ],
        rows,
        [0, 1, 2, 4],
      ),
      `구간 ${total} 개가 ${n} 무리로 나뉘고 무리 크기의 합이 ${total} 입니다. 가장 낮은 막대가 여럿인 구간은 가장 왼쪽 자리의 무리에 넣었습니다. 무리마다 가장 넓은 구간의 넓이 중 가장 큰 것이 ${best} 이고, 구간을 전부 열거한 답 ${enumerated}${과와(enumerated)} 같습니다.`,
    );
  },

  /** `deep.origin` ③ — 막대마다 양쪽으로 뻗으면 무엇을 읽는가. */
  "origin-expand-small": () => {
    const { spans } = expandBoth(WALK);
    const times = new Array<number>(WALK.length).fill(0);
    for (const s of spans)
      for (const k of s.read) times[k] = (times[k] as number) + 1;
    const again = times.map((t, k) => (t >= 2 ? k : -1)).filter((k) => k >= 0);
    const total = spans.reduce((a, s) => a + s.read.length, 0);
    return block(
      md(
        ["자리 j", "높이", "읽은 이웃 칸", "뻗은 구간", "읽은 칸 수"],
        spans.map((s) => [
          String(s.j),
          String(WALK[s.j]),
          s.read.length === 0 ? "없음" : dots(s.read),
          `[${s.l},${s.r}]`,
          String(s.read.length),
        ]),
        [0, 1, 4],
      ),
      `여섯 막대가 자기 자리 말고 읽은 칸은 모두 ${total} 칸이고, 두 막대 이상이 거듭 읽은 칸은 자리 ${dots(again)} 입니다.`,
    );
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 놓는다. */
  "origin-two-ways": () => {
    const inputs: [string, number[]][] = [
      [`전개 입력 ${show(WALK)}`, [...WALK]],
      [BIG_NAME, [...BIG]],
      [`높이가 전부 같은 ${num(BIG_N)} 칸`, flat(BIG_N)],
    ];
    let same = true;
    const rows = inputs.map(([name, a]) => {
      const s = allIntervals(a);
      const e = expandBoth(a);
      if (s.best !== e.best || e.best !== ref(a)) same = false;
      return [name, num(s.acc), num(e.acc)];
    });
    const f = flat(BIG_N);
    return block(
      md(
        ["입력", "구간을 전부 열거하기", "막대마다 양쪽으로 뻗기"],
        rows,
        [1, 2],
      ),
      `두 방식이 낸 답은 세 입력 모두 ${same ? "서로 같습니다" : "서로 다릅니다"}. 높이가 전부 같으면 뻗기가 ${num(expandBoth(f).acc)} 번으로 구간 열거의 ${num(allIntervals(f).acc)} 번보다 많습니다.`,
    );
  },

  /** `deep.origin` ④ — 두 경계는 「처음 만나는 더 낮은 막대」다. */
  "origin-boundaries": () => {
    const t = twoPass(WALK);
    const rows = WALK.map((v, j) => {
      const r = t.right[j] as number;
      const l = t.leftOf[j] as number;
      return [
        String(j),
        String(v),
        r === WALK.length ? `없음 → ${r}` : `자리 ${r}(높이 ${WALK[r]})`,
        l === -1 ? "없음 → -1" : `자리 ${l}(높이 ${WALK[l]})`,
        String(r - l - 1),
        String(v * (r - l - 1)),
      ];
    });
    return block(
      md(
        [
          "자리 j",
          "높이",
          "오른쪽에서 처음 만나는 더 낮은 막대",
          "왼쪽에서 처음 만나는 이하인 막대",
          "폭",
          "넓이",
        ],
        rows,
        [0, 1, 4, 5],
      ),
      `두 경계 사이의 칸 수가 폭이고, 여섯 넓이 중 가장 큰 것이 ${t.best} 입니다. 경계가 없으면 오른쪽은 ${WALK.length}, 왼쪽은 -1 로 두었습니다. 배열의 양 끝 밖 자리입니다.`,
    );
  },

  /** `deep.origin` ⑤ — 오른쪽 경계를 구하며 꺼낼 때, 남은 꼭대기가 왼쪽 경계다. */
  "origin-left-is-top": () => {
    const t = twoPass(WALK);
    const rows = POPPED.map((s) => {
      const j = s.top as number;
      const l = t.leftOf[j] as number;
      return [
        `자리 ${j}`,
        s.i === WALK.length ? `${s.i}(끝 밖)` : String(s.i),
        s.left === -1 ? "비었다 → -1" : `자리 ${s.left}`,
        l === -1 ? "-1" : `자리 ${l}`,
        s.left === l ? "같다" : "다르다",
      ];
    });
    const big = twoPass(BIG);
    let pops = 0;
    let match = 0;
    eachPop(BIG, (popped, below) => {
      pops++;
      if (below === big.leftOf[popped]) match++;
    });
    return block(
      md(
        [
          "꺼낸 자리",
          "꺼낸 때 읽던 자리",
          "꺼낸 뒤 꼭대기",
          "왼쪽에서 처음 만나는 이하인 막대",
          "두 값",
        ],
        rows,
      ),
      `${BIG_NAME} 입력에서도 꺼낸 ${num(pops)} 번 중 ${num(match)} 번이 같습니다.`,
    );
  },

  /** `deep.origin` ⑤ — 두 번 쓰기와 한 번 쓰기의 비용. */
  "origin-one-vs-two": () => {
    const inputs: [string, number[]][] = [
      [`전개 입력 ${show(WALK)}`, [...WALK]],
      [BIG_NAME, [...BIG]],
      [`증가 수열 ${num(BIG_N)} 칸`, up(BIG_N)],
      [`감소 수열 ${num(BIG_N)} 칸`, down(BIG_N)],
    ];
    let fewer = 0;
    const rows = inputs.map(([name, a]) => {
      const t = twoPass(a);
      const c = count(a);
      if (c.acc < t.acc) fewer++;
      return [name, num(t.acc), num(c.acc), num(t.extra), num(c.peak)];
    });
    return block(
      md(
        [
          "입력",
          "두 번 쓰기의 배열 접근",
          "한 번 쓰기의 배열 접근",
          "두 번 쓰기의 추가 칸",
          "한 번 쓰기의 추가 칸",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `두 방법의 답은 네 입력 모두 같고, 배열 접근은 ${inputs.length} 벌 중 ${fewer} 벌에서 한 번 쓰기가 적습니다. 두 번 쓰기의 추가 칸은 경계 배열 둘(2N 칸)과 단조 스택이 가장 깊었을 때의 칸 수이고, 한 번 쓰기는 단조 스택뿐입니다.`,
    );
  },

  /** `deep.build` (c) — 단조 스택의 칸 하나를 이름에서 넓이까지 따라간다. */
  "build-read-one": () => {
    const s = afterRead(5);
    const p = s.stack[1] as number;
    const below = s.stack[0] as number;
    const out = WALK_STEPS.find(
      (t) => t.kind === "pop" && t.top === p,
    ) as WalkStep;
    const where =
      out.i === WALK.length ? `보초 자리 ${out.i}` : `자리 ${out.i}`;
    return md(
      ["차례", "읽는 것", "나오는 것"],
      [
        ["1", "stack[1]", `자리 ${p}`],
        ["2", `heights[${p}]`, `높이 ${WALK[p]}`],
        ["3", "stack[0] — 바로 아래 칸", `자리 ${below} — 왼쪽 경계`],
        [
          "4",
          "오른쪽 경계",
          `아직 없다 — ${out.id} 에서 ${where}${이가(out.i)} 된다`,
        ],
        [
          "5",
          "폭과 넓이",
          `${out.i} − ${below} − 1 = ${out.width} · 넓이 ${out.area}`,
        ],
      ],
      [0],
    );
  },

  /** `deep.build` (d) — 단조 스택에서 이웃한 두 칸의 관계. */
  "build-neighbors": () => {
    const seen = new Set<string>();
    const rows: string[][] = [];
    for (const s of WALK_STEPS) {
      if (s.kind === "pop") continue;
      for (let k = 1; k < s.stack.length; k++) {
        const lo = s.stack[k - 1] as number;
        const hi = s.stack[k] as number;
        const key = `${lo},${hi}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const between = Array.from(
          { length: hi - lo - 1 },
          (_, q) => lo + 1 + q,
        );
        rows.push([
          `자리 ${lo} · 높이 ${h(lo)}`,
          `자리 ${hi} · 높이 ${h(hi)}`,
          h(lo) <= h(hi) ? "예" : "아니오",
          between.length === 0
            ? "없음"
            : between.map((q) => `자리 ${q}(높이 ${h(q)})`).join(" · "),
          between.every((q) => h(q) > h(hi)) ? "예" : "아니오",
        ]);
      }
    }
    let pairs = 0;
    let broken = 0;
    const hb = (p: number): number => (p < BIG_N ? (BIG[p] as number) : 0);
    eachMoment(BIG, (e, stack) => {
      if (e.kind !== "push") return;
      for (let k = 1; k < stack.length; k++) {
        const lo = stack[k - 1] as number;
        const hi = stack[k] as number;
        pairs++;
        let ok = hb(lo) <= hb(hi);
        for (let q = lo + 1; q < hi; q++) if (hb(q) <= hb(hi)) ok = false;
        if (!ok) broken++;
      }
    });
    return block(
      md(
        [
          "아래 칸",
          "바로 위 칸",
          "아래 칸의 높이 ≤ 위 칸의 높이",
          "두 자리 사이에 있던 자리",
          "사이의 막대가 전부 위 칸보다 높음",
        ],
        rows,
      ),
      `전개 입력에서 이웃한 두 칸이 ${rows.length} 쌍 나왔습니다. ${num(BIG_N)} 칸 입력에서는 자리를 넣은 순간마다 이웃한 두 칸 ${num(pairs)} 쌍을 쟀고, 두 조건 중 하나라도 어긋난 쌍은 ${num(broken)} 개입니다.`,
    );
  },

  /** `deep.build` (e) — 「바로 아래 칸」과 「바로 왼쪽 자리」는 다르다. */
  "build-below-vs-adjacent": () => {
    const s = afterRead(5);
    const rows = s.stack.map((p, k) => {
      const below = k === 0 ? -1 : (s.stack[k - 1] as number);
      return [
        `자리 ${p}`,
        String(h(p)),
        below === -1 ? "없음 → -1" : `자리 ${below}`,
        p === 0 ? "없음 → -1" : `자리 ${p - 1}(높이 ${h(p - 1)})`,
        String(leftBound(WALK, p)),
      ];
    });
    let pops = 0;
    let byBelow = 0;
    let byAdjacent = 0;
    eachPop(BIG, (popped, below) => {
      pops++;
      const want = leftBound(BIG, popped);
      if (below === want) byBelow++;
      if (popped - 1 === want) byAdjacent++;
    });
    return block(
      md(
        [
          "단조 스택의 칸",
          "높이",
          "바로 아래 칸",
          "바로 왼쪽 자리",
          "정의의 왼쪽 경계",
        ],
        rows,
      ),
      `${num(BIG_N)} 칸 입력에서 꺼낸 ${num(pops)} 번을 정의의 왼쪽 경계와 대조하면, 바로 아래 칸은 ${num(byBelow)} 번 같고 바로 왼쪽 자리는 ${num(byAdjacent)} 번 같습니다.`,
    );
  },

  /** `deep.build` 2단계 — 자리마다 꺼낸 것과 멈춘 까닭. */
  "build-pop-steps": () => {
    const n = WALK.length;
    const rows: string[][] = [];
    for (let i = 0; i <= n; i++) {
      const here = WALK_STEPS.filter((s) => s.i === i);
      const first = here[0] as WalkStep;
      const k = WALK_STEPS.indexOf(first);
      const before = k === 0 ? [] : (WALK_STEPS[k - 1] as WalkStep).stack;
      const pops = here.filter((s) => s.kind === "pop");
      const last = here.at(-1) as WalkStep;
      const why =
        last.kind === "stop"
          ? `꼭대기 자리 ${last.top} 의 높이 ${h(last.top as number)} ≤ ${last.cur}`
          : "단조 스택이 비었다";
      rows.push([
        i === n ? `${i} · 보초 높이 0` : `${i} · 높이 ${h(i)}`,
        before.length === 0 ? "비었다" : show(before),
        pops.length === 0
          ? "없음"
          : pops
              .map((s) => `자리 ${s.top} → ${span(s)} 넓이 ${s.area}`)
              .join(" · "),
        why,
      ]);
    }
    return md(
      [
        "읽은 자리",
        "읽기 전 stack",
        "꺼낸 자리 → 덮는 칸과 넓이",
        "꺼내기가 멈춘 까닭",
      ],
      rows,
    );
  },

  /** `deep.build` 3단계 — 자리마다 한 번 들어가고 많아야 한 번 나온다. */
  "build-once": () => {
    const n = WALK.length;
    const at = (i: number): string =>
      i === n ? "보초 걸음" : `자리 ${i}${을를(i)} 읽을 때`;
    const rows = Array.from({ length: n + 1 }, (_, p) => {
      const inn = WALK_STEPS.find(
        (s) => s.kind !== "pop" && s.i === p,
      ) as WalkStep;
      const out = WALK_STEPS.find((s) => s.kind === "pop" && s.top === p);
      return [
        p === n ? `보초 자리 ${p}` : `자리 ${p}`,
        `${inn.id} · ${at(inn.i)}`,
        out === undefined ? "끝까지 남았다" : `${out.id} · ${at(out.i)}`,
      ];
    });
    let pushes = 0;
    let pops = 0;
    const pushed = new Map<number, number>();
    const popped = new Map<number, number>();
    eachMoment(BIG, (e) => {
      if (e.kind === "push") {
        pushes++;
        pushed.set(e.i, (pushed.get(e.i) ?? 0) + 1);
      }
      if (e.kind === "cmp" && e.pop) {
        pops++;
        popped.set(e.top, (popped.get(e.top) ?? 0) + 1);
      }
    });
    const most = Math.max(...pushed.values(), ...popped.values());
    return block(
      md(["자리", "넣은 때", "꺼낸 때"], rows),
      `${num(BIG_N)} 칸 입력에서는 넣기가 ${num(pushed.size)} 자리에 ${num(pushes)} 번, 꺼내기가 ${num(popped.size)} 자리에 ${num(pops)} 번이었습니다. 한 자리를 넣거나 꺼낸 횟수는 많아야 ${most} 번입니다.`,
    );
  },

  /** `deep.build` 4단계 — 보초가 남은 자리를 꺼낸다. 높이 0 인 자리는 남는다. */
  "build-leftover": () => {
    const inputs = [[...WALK], up(5), [2, 0, 2], [0, 0, 0]];
    const rows = inputs.map((a) => {
      const steps = walkOf(a);
      const n = a.length;
      const firstSentinel = steps.findIndex((s) => s.i === n);
      const before =
        firstSentinel <= 0 ? [] : (steps[firstSentinel - 1] as WalkStep).stack;
      const byS = steps.filter((s) => s.i === n && s.kind === "pop");
      const end = steps.at(-1) as WalkStep;
      const rest = end.stack.filter((p) => p < n);
      return [
        show(a),
        show(before),
        byS.length === 0
          ? "없음"
          : byS.map((s) => `자리 ${s.top} · 넓이 ${s.area}`).join(" · "),
        rest.length === 0
          ? "없음"
          : rest.map((p) => `자리 ${p}(높이 ${a[p]})`).join(" · "),
      ];
    });
    const zeroOnly = inputs.every((a) =>
      (walkOf(a).at(-1) as WalkStep).stack.every(
        (p) => p === a.length || a[p] === 0,
      ),
    );
    if (!zeroOnly)
      throw new Error("끝까지 남은 자리에 높이가 0 이 아닌 것이 있다");
    return block(
      md(
        [
          "입력",
          "자리 N−1 까지 끝난 뒤 stack",
          "보초가 꺼낸 자리",
          "끝까지 남은 자리",
        ],
        rows,
      ),
      "끝까지 남은 자리는 모두 높이가 0 입니다. 0 은 보초의 높이 0 보다 엄격하게 높지 않아 꺼내지지 않고, 그 자리의 넓이는 폭과 상관없이 0 이라 답을 바꾸지 않습니다.",
    );
  },

  /** `deep.build` 설계 선택 — 높이를 담으면 답은 맞지만 자리를 찾느라 다시 읽는다. */
  "build-store-height": () => {
    const inputs: [string, number[]][] = [
      [`전개 입력 ${show(WALK)}`, [...WALK]],
      [BIG_NAME, [...BIG]],
      [`증가 수열 ${num(BIG_N)} 칸`, up(BIG_N)],
    ];
    let same = 0;
    const rows = inputs.map(([name, a]) => {
      const c = count(a);
      const s = heightStack(a);
      if (c.best === s.best) same++;
      return [name, num(c.acc), num(s.acc)];
    });
    const f = up(BIG_N);
    const byHeight = heightStack(f).acc;
    const byPlace = count(f).acc;
    return block(
      md(["입력", "자리를 담는 코드", "높이를 담는 코드"], rows, [1, 2]),
      `두 코드의 답은 ${inputs.length} 벌 중 ${same} 벌에서 같습니다. 증가 수열에서 높이를 담는 코드는 ${num(byHeight)} 번 접근해, 자리를 담는 코드의 ${num(byPlace)} 번보다 ${Math.round(byHeight / byPlace)} 배쯤 많습니다.`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () =>
    [
      `const heights = ${code(WALK)};`,
      `// 이 절이 끝나면 ${ref(WALK)}${이가(ref(WALK))} 나와야 한다`,
    ].join("\n"),

  /** `deep.walk.step` 1 — 준비만 한 상태. */
  "walk-init": () =>
    md(
      ["heights", "stack", "best", "순회"],
      [
        [show(WALK), "[]", "0", `자리 0 부터 ${WALK.length}(보초) 까지`],
        ["[]", "[]", String(ref([])), "보초 걸음 하나만 실행한다"],
      ],
    ),

  /** `deep.walk.step` 2 — `i = 4` 에서 이 조각만 실행한다. */
  "walk-pop-at-4": () => {
    const here = WALK_STEPS.filter((s) => s.i === 4);
    const rows = here.map((s, k) => {
      const t = s.top as number;
      if (s.kind === "pop") {
        return [
          String(k + 1),
          `자리 ${t}`,
          String(h(t)),
          `\`${h(t)} <= ${s.cur}\` 거짓`,
          "꺼낸다",
          String(s.left),
          `${s.width} · ${s.area}`,
          show(s.stack),
          String(s.best),
        ];
      }
      return [
        String(k + 1),
        `자리 ${t}`,
        String(h(t)),
        `\`${h(t)} <= ${s.cur}\` 참`,
        "멈춘다",
        "—",
        "—",
        show(s.stack.slice(0, -1)),
        String(s.best),
      ];
    });
    return md(
      [
        "차례",
        "꼭대기",
        "그 높이",
        "조건",
        "하는 일",
        "left",
        "폭 · 넓이",
        "stack",
        "best",
      ],
      rows,
      [0, 2, 8],
    );
  },

  /** `deep.walk.pause` — 폭에서 1 을 안 빼면. */
  "pause-width-off-by-one": () =>
    mutantBlock(
      [[...WALK], [2, 1, 2], [3, 3], [5], [0, 0]],
      wideByOne,
      "1 을 안 뺀 코드",
    ),

  /** `deep.walk.step` 3 — 보초 걸음이 남은 자리를 꺼낸다. */
  "walk-sentinel": () => {
    const n = WALK.length;
    const here = WALK_STEPS.filter((s) => s.i === n);
    return md(
      [
        "걸음",
        "꼭대기",
        "그 높이",
        "0 보다 높음",
        "왼쪽 경계",
        "폭 · 넓이",
        "걸음 뒤 stack",
      ],
      here.map((s) =>
        s.kind === "pop"
          ? [
              s.id,
              `자리 ${s.top}`,
              String(h(s.top as number)),
              "예 → 꺼낸다",
              String(s.left),
              `${n} − (${s.left}) − 1 = ${s.width} · ${s.area}`,
              show(s.stack),
            ]
          : [s.id, "없다", "—", "단조 스택이 비었다", "—", "—", show(s.stack)],
      ),
    );
  },

  /** `deep.walk.pause` — 보초 없이 끝나면 증가 수열에서 무엇이 남는가. */
  "pause-no-sentinel-trace": () => {
    const a = up(5);
    const steps = walkOf(a);
    const k = steps.findIndex((s) => s.i === a.length);
    const last = steps[k - 1] as WalkStep;
    const pops = steps.slice(0, k).filter((s) => s.kind === "pop").length;
    return md(
      [
        "입력",
        "보초 걸음 앞까지의 꺼내기",
        "그때 stack",
        "그때 best",
        "정본의 답",
      ],
      [
        [
          show(a),
          `${pops} 번`,
          show(last.stack),
          String(last.best),
          String(ref(a)),
        ],
      ],
    );
  },

  /** `deep.walk.pause` — 보초 걸음이 없으면. */
  "pause-no-sentinel": () =>
    mutantBlock(
      [[...WALK], up(5), flat(4), [2, 4], down(5)],
      noSentinel,
      "보초 걸음이 없는 코드",
    ),

  /** `deep.walk.step` 4 — 열세 걸음 전부의 조건 판정과 갈래. */
  "walk-trace": () => {
    const labels = new Map<string, string[]>();
    const rows = WALK_STEPS.map((s, k) => {
      const b = branches(s, firstOfI(s, k));
      for (const x of b) labels.set(x, [...(labels.get(x) ?? []), s.id]);
      const t = s.top;
      const cond =
        s.kind === "pop"
          ? `\`${h(t as number)} <= ${s.cur}\`${이가(s.cur)} **거짓** → 꺼낸다`
          : s.kind === "stop"
            ? `\`${h(t as number)} <= ${s.cur}\`${이가(s.cur)} **참** → 멈춘다`
            : "`stack.length > 0` 이 **거짓**";
      return [
        s.id,
        s.i === WALK.length ? `${s.i}(보초)` : String(s.i),
        t === undefined ? "—" : `자리 ${t}`,
        cond,
        show(s.stack),
        String(s.best),
        b.join(" "),
      ];
    });
    const list = ["②", "③", "④", "⑤", "⑥"]
      .map((x, k) => `${x}${은는(k + 2)} ${(labels.get(x) ?? []).join(" · ")}`)
      .join(", ");
    const last = WALK_STEPS.at(-1) as WalkStep;
    return block(
      md(
        [
          "걸음",
          "자리 i",
          "비교한 꼭대기",
          "조건 판정",
          "걸음 뒤 stack",
          "best",
          "갈래",
        ],
        rows,
      ),
      `① 은 T1 앞의 준비이고, ${list} 입니다. 넣기가 ${last.pushes} 번, 꺼내기가 ${last.pops} 번입니다.`,
    );
  },

  /** `deep.walk.pause` — 같은 높이도 꺼내면 폭은 갈리는데 최댓값은 안 갈린다. */
  "pause-loose-compare": () => {
    const neutral =
      looseCompare.largestRectangleInHistogram === largestRectangleInHistogram;
    const input = flat(4);
    const widths = (impl: Mod, loose: boolean): Map<number, number> => {
      const m = new Map<number, number>();
      const { events } = run(
        input,
        impl.largestRectangleInHistogram,
        loose ? (top, cur) => top >= cur : strictPop,
      );
      for (const e of events) if (e.kind === "area") m.set(e.top, e.width);
      return m;
    };
    const strict = widths({ largestRectangleInHistogram }, false);
    const loose = widths(looseCompare, !neutral);
    const rows = input.map((v, j) => {
      const s = strict.get(j) as number;
      const l = loose.get(j) as number;
      return [
        String(j),
        String(v),
        `${s} (넓이 ${v * s})`,
        `${l} (넓이 ${v * l})`,
        s === l ? "같다" : "다르다",
      ];
    });
    let checked = 0;
    let differ = 0;
    everyArray(7, 3, (a) => {
      checked++;
      if (ref(a) !== looseCompare.largestRectangleInHistogram([...a])) differ++;
    });
    if (differ !== 0) {
      throw new Error("최댓값이 갈리는 입력이 있다 — 본문의 주장이 거짓이다");
    }
    const bad = looseCompare.largestRectangleInHistogram([...input]);
    // 두 경계를 **둘 다** 「같은 높이에서 멈춘다」로 정의하면 — 정의로 직접 센다(코드 변이가 아니다).
    const bothStop = Math.max(
      ...input.map((v, j) => {
        let l = j - 1;
        while (l >= 0 && (input[l] as number) > v) l--;
        let r = j + 1;
        while (r < input.length && (input[r] as number) > v) r++;
        return v * (r - l - 1);
      }),
    );
    return block(
      md(
        ["자리 j", "높이", "바른 코드의 폭", "느슨한 코드의 폭", "두 폭"],
        rows,
        [0, 1],
      ),
      `입력은 ${show(input)} 이고 두 코드의 답은 ${ref(input)}${과와(ref(input))} ${bad} 입니다. 길이 1 이상 7 이하 · 높이 0 이상 3 이하인 배열 ${num(checked)} 개를 전부 실행해 답이 갈린 것은 ${differ} 개입니다. 두 경계를 둘 다 같은 높이에서 멈추게 정의하면 같은 입력의 답이 ${bothStop} 입니다.`,
    );
  },

  /** `deep.walk.final` — 전체 코드 아래의 호출 결과. */
  "final-calls": () => {
    const calls = [[...WALK], [2, 0, 2], [0, 0, 0], [7]];
    const left = calls.map((a) => `largestRectangleInHistogram(${code(a)})`);
    const w = Math.max(...left.map((s) => s.length));
    const vals = calls.map((a) => String(ref(a)));
    const vw = Math.max(...vals.map((s) => s.length));
    return [
      ...left.map(
        (s, k) => `${s.padEnd(w)}  →  ${(vals[k] as string).padStart(vw)}`,
      ),
    ].join("\n");
  },

  /** `related` — 같은 무리 나누기로 다른 물음에 답한다. */
  "related-reuse": () => {
    const n = WALK.length;
    let intervals = 0;
    let minSum = 0;
    let best = 0;
    for (let l = 0; l < n; l++) {
      for (let r = l; r < n; r++) {
        const m = leftmostMin(WALK, l, r);
        intervals++;
        minSum += WALK[m] as number;
        best = Math.max(best, (WALK[m] as number) * (r - l + 1));
      }
    }
    let dCount = 0;
    let dSum = 0;
    let dBest = 0;
    for (let j = 0; j < n; j++) {
      const L = leftBound(WALK, j);
      const R = rightBound(WALK, j);
      const size = (j - L) * (R - j);
      dCount += size;
      dSum += (WALK[j] as number) * size;
      dBest = Math.max(dBest, (WALK[j] as number) * (R - L - 1));
    }
    const same =
      dBest === best && dSum === minSum && dCount === intervals
        ? "세 물음 모두 두 열이 같습니다."
        : "두 열이 다른 물음이 있습니다.";
    return block(
      md(
        [
          "물음",
          "대표마다 내는 값",
          "대표로 나눠 낸 답",
          "구간을 전부 열거한 답",
        ],
        [
          [
            "가장 큰 직사각형의 넓이",
            "heights[j] × (가장 넓은 구간의 칸 수)",
            String(dBest),
            String(best),
          ],
          [
            "모든 구간의 최솟값의 합",
            "heights[j] × (무리의 크기)",
            String(dSum),
            String(minSum),
          ],
          ["구간의 수", "무리의 크기", String(dCount), String(intervals)],
        ],
        [2, 3],
      ),
      `무리의 크기는 (j − L(j)) × (R(j) − j) 입니다. 왼쪽 끝을 L(j)+1 부터 j 까지, 오른쪽 끝을 j 부터 R(j)−1 까지 고를 수 있기 때문입니다. ${same}`,
    );
  },

  /** `deep.math` ② — 경계의 정의를 전개 입력에 넣어 확인한다. */
  "boundary-check": () => {
    const rows = WALK.map((v, j) => {
      const l = leftBound(WALK, j);
      const r = rightBound(WALK, j);
      return [
        String(j),
        String(v),
        String(l),
        String(r),
        String(r - l - 1),
        String(v * (r - l - 1)),
      ];
    });
    const def = byDefinition(WALK);
    const got = ref(WALK);
    const noLeft = WALK.map((_, j) => j).filter(
      (j) => leftBound(WALK, j) === -1,
    );
    const noRight = WALK.map((_, j) => j).filter(
      (j) => rightBound(WALK, j) === WALK.length,
    );
    return block(
      md(
        ["자리 j", "heights[j]", "L(j)", "R(j)", "폭 R − L − 1", "넓이"],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      `여섯 후보의 최댓값이 ${def} 이고 정본이 낸 답 ${got}${과와(got)} 같습니다. 자리 ${dots(noLeft)}${은는(noLeft.at(-1) ?? "")} 왼쪽에 이하인 막대가 없어 L = -1 이고, 자리 ${dots(noRight)}${은는(noRight.at(-1) ?? "")} 오른쪽에 더 낮은 막대가 없어 R = N = ${WALK.length} 입니다.`,
    );
  },

  /** `deep.math` ④ — 후보를 N 개로 줄인 것이 임의의 입력에서 옳은가, 그리고 규모가 얼마인가. */
  "boundary-general": () => {
    let checked = 0;
    let differ = 0;
    everyArray(7, 3, (a) => {
      checked++;
      if (byDefinition(a) !== ref(a)) differ++;
    });
    const rows = [WALK.length, 1_000, TASK_N].map((n) => [
      num(n),
      num(naiveCount(n)),
      num(n),
      num(Math.round(((n + 1) / 2) * 10) / 10),
    ]);
    return block(
      md(
        ["N", "구간 N(N+1)/2 개", "후보 N 개", "몇 배 줄었나"],
        rows,
        [0, 1, 2, 3],
      ),
      `길이 1 이상 7 이하 · 높이 0 이상 3 이하인 배열 ${num(checked)} 개에서 정의로 낸 답과 정본의 답이 갈린 것은 ${differ} 개입니다.`,
    );
  },

  /** `invariant` ② — 걸음이 끝날 때마다 불변식의 세 조항을 잰다. */
  "invariant-states": () => {
    const judge = (xs: readonly number[], stack: readonly number[]) => {
      const hx = (p: number): number => (p < xs.length ? (xs[p] as number) : 0);
      let order = true;
      let between = true;
      for (let k = 1; k < stack.length; k++) {
        const lo = stack[k - 1] as number;
        const hi = stack[k] as number;
        if (!(lo < hi && hx(lo) <= hx(hi))) order = false;
        for (let q = lo + 1; q < hi; q++) if (hx(q) <= hx(hi)) between = false;
      }
      const b = stack[0];
      let bottom = true;
      if (b !== undefined)
        for (let q = 0; q < b; q++) if (hx(q) <= hx(b)) bottom = false;
      return { order, between, bottom };
    };
    const yes = (x: boolean): string => (x ? "예" : "아니오");
    const rows = WALK_STEPS.map((s) => {
      const j = judge(WALK, s.stack);
      return [
        s.id,
        show(s.stack),
        String(Math.max(0, s.stack.length - 1)),
        yes(j.order),
        yes(j.between),
        yes(j.bottom),
      ];
    });
    let moments = 0;
    let broken = 0;
    const tally = (xs: readonly number[]): void => {
      eachMoment(xs, (e, stack) => {
        if (e.kind === "cur" || e.kind === "cmp") return;
        moments++;
        const j = judge(xs, stack);
        if (!(j.order && j.between && j.bottom)) broken++;
      });
    };
    tally(BIG);
    everyArray(6, 3, tally);
    return block(
      md(
        [
          "걸음",
          "걸음 뒤 stack",
          "이웃 쌍",
          "아래 높이 ≤ 위 높이",
          "사이 막대가 위 칸보다 높음",
          "바닥 왼쪽이 바닥보다 높음",
        ],
        rows,
        [2],
      ),
      `${num(BIG_N)} 칸 입력과 길이 1 이상 6 이하 · 높이 0 이상 3 이하인 배열 전부에서 걸음이 끝난 순간 ${num(moments)} 번을 쟀고, 세 조항 중 하나라도 어긋난 순간은 ${num(broken)} 번입니다.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, number[]][] = [
      ["N = 1", [7]],
      ["N = 2 증가", [2, 4]],
      ["N = 2 감소", [4, 2]],
      ["높이가 전부 같다", [3, 3, 3, 3]],
      ["0 이 가운데", [2, 0, 2]],
      ["높이가 전부 0", [0, 0, 0]],
      ["가장 낮은 막대가 맨 앞", [1, 2, 3]],
    ];
    const rows = cases.map(([name, a]) => {
      const steps = walkOf(a);
      const n = a.length;
      const before = steps.filter((s) => s.kind === "pop" && s.i < n).length;
      const bySentinel = steps.filter(
        (s) => s.kind === "pop" && s.i === n,
      ).length;
      const rest = (steps.at(-1) as WalkStep).stack.filter((p) => p < n).length;
      return [
        name,
        show(a),
        String(before),
        String(bySentinel),
        String(rest),
        String(ref(a)),
      ];
    });
    return md(
      [
        "입력",
        "배열",
        "보초 전 꺼내기",
        "보초가 꺼낸 자리",
        "끝까지 남은 자리",
        "답",
      ],
      rows,
      [2, 3, 4, 5],
    );
  },

  /** `invariant` ③ — 단조 스택이 비었을 때의 왼쪽 경계를 0 으로 두면. */
  "mutant-left-base": () =>
    mutantBlock(
      [flat(4), down(5), up(5), [...WALK]],
      leftBaseZero,
      "왼쪽 경계를 0 으로 둔 코드",
    ),

  /** `invariant` ③ — `[7 7 7 7]` 에서 단조 스택이 비었을 때 꺼낸 자리의 폭. */
  "mutant-left-trace": () => {
    const a = flat(4);
    const steps = walkOf(a).filter((s) => s.kind === "pop" && s.left === -1);
    return md(
      ["꺼낸 자리", "꺼낸 때 읽던 자리", "바른 값 -1 의 폭", "0 으로 둔 폭"],
      steps.map((s) => [
        `자리 ${s.top}`,
        String(s.i),
        `${s.i} − (−1) − 1 = ${s.width} · 넓이 ${s.area}`,
        `${s.i} − 0 − 1 = ${s.i - 1} · 넓이 ${(a[s.top as number] as number) * (s.i - 1)}`,
      ]),
    );
  },

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const c = count(WALK);
    const n = WALK.length;
    const starts = WALK_STEPS.filter((s, k) => firstOfI(s, k) && s.i < n);
    const cmps = WALK_STEPS.filter(
      (s) => s.kind === "pop" || s.kind === "stop",
    );
    const pops = WALK_STEPS.filter((s) => s.kind === "pop");
    const lefts = pops.filter((s) => s.left !== -1);
    const pushes = WALK_STEPS.filter((s) => s.kind !== "pop");
    const formula = 2 * n + 1 + 4 * c.pops + 2 * c.stops - c.empties;
    if (formula !== c.acc) throw new Error("식과 실측이 다르다");
    if (
      starts.length !== n ||
      cmps.length !== c.cmp ||
      lefts.length !== c.pops - c.empties ||
      pushes.length !== n + 1
    ) {
      throw new Error("걸음에서 센 갈래와 실측이 다르다");
    }
    return block(
      md(
        ["갈래", "걸음", "식", "배열 접근"],
        [
          ["지금 높이를 읽는다 ②", ids(starts), "N", num(n)],
          ["꼭대기와 비교한다 ③", ids(cmps), "2(P + B)", num(2 * c.cmp)],
          ["넓이를 낸다 ④", ids(pops), "P", num(c.pops)],
          ["왼쪽 경계를 읽는다", ids(lefts), "P − M", num(c.pops - c.empties)],
          ["자리를 넣는다 ⑤", ids(pushes), "N + 1", num(n + 1)],
          ["합", "", "2N + 1 + 4P + 2B − M", num(c.acc)],
        ],
        [3],
      ),
      `전개는 N = ${n} · P = ${c.pops} · B = ${c.stops} · M = ${c.empties} 라 식에 넣으면 ${2 * n + 1} + ${4 * c.pops} + ${2 * c.stops} − ${c.empties} = ${c.acc} 번입니다. 같은 입력을 구간 열거로 처리하면 ${allIntervals(WALK).acc} 번입니다.`,
    );
  },

  /** `perf.derive` — 과제 규모에 넣는다. */
  "perf-scale": () => {
    const n = TASK_N;
    const cases: [string, number[], number][] = [
      ["높이가 전부 0", flat(n, 0), 4 * n + 1],
      ["강한 감소 수열", down(n), 5 * n + 1],
      ["증가 수열", up(n), 8 * n - 2],
    ];
    let most = 0;
    const rows = cases.map(([name, a, f]) => {
      const c = count(a);
      if (c.acc !== f) throw new Error(`${name}: 식과 실측이 다르다`);
      most = Math.max(most, c.acc);
      return [name, num(c.pops), num(c.stops), num(c.empties), num(c.acc)];
    });
    return block(
      md(["입력", "P", "B", "M", "배열 접근"], rows, [1, 2, 3, 4]),
      `N = ${num(n)} 에서 세 줄 모두 실제로 세었습니다. 첫 줄은 4N + 1 = ${num(4 * n + 1)}, 둘째 줄은 5N + 1 = ${num(5 * n + 1)}, 셋째 줄은 8N − 2 = ${num(8 * n - 2)}${과와(num(8 * n - 2))} 같습니다. 단순 연산 1 초에 1 억 번으로 잡으면 가장 많은 줄도 ${(most / 100_000_000).toFixed(3)} 초입니다.`,
    );
  },

  /** `perf.bounds` — 높이 0 인 막대가 몇을 바꾸는가. */
  "zero-bars": () => {
    const cases: [string, number[]][] = [
      [`${show(WALK)} — 0 이 없다`, [...WALK]],
      ["[2 0 2]", [2, 0, 2]],
      ["[0 0 0 0]", [0, 0, 0, 0]],
      ["[0 5 0 5 0]", [0, 5, 0, 5, 0]],
    ];
    const rows = cases.map(([name, a]) => {
      const c = count(a);
      const z = a.filter((v) => v === 0).length;
      if (c.pops !== a.length - z)
        throw new Error(`${name}: P 가 N − Z 가 아니다`);
      const f = 2 * a.length + 1 + 4 * c.pops + 2 * c.stops - c.empties;
      if (f !== c.acc) throw new Error(`${name}: 식과 실측이 다르다`);
      return [
        name,
        String(a.length),
        String(z),
        String(c.pops),
        String(c.stops),
        String(c.empties),
        String(f),
        String(c.acc),
        String(c.best),
      ];
    });
    return block(
      md(
        ["입력", "N", "Z", "P", "B", "M", "2N + 1 + 4P + 2B − M", "실측", "답"],
        rows,
        [1, 2, 3, 4, 5, 6, 7, 8],
      ),
      "네 입력 모두 P = N − Z 이고 식이 실측과 같습니다.",
    );
  },

  /** `perf.bounds` — 모든 순서가 같은 확률일 때의 평균을 순열 전수로 잰다. */
  "perf-average": () => {
    const perms = (n: number, visit: (a: number[]) => void): void => {
      const a = Array.from({ length: n }, (_, i) => i + 1);
      const go = (k: number): void => {
        if (k === n) {
          visit(a);
          return;
        }
        for (let s = k; s < n; s++) {
          [a[k], a[s]] = [a[s] as number, a[k] as number];
          go(k + 1);
          [a[k], a[s]] = [a[s] as number, a[k] as number];
        }
      };
      go(0);
    };
    const harmonic = (n: number): number => {
      let s = 0;
      for (let k = 1; k <= n; k++) s += 1 / k;
      return s;
    };
    const rows: string[][] = [];
    let worst = 0;
    for (let n = 1; n <= 8; n++) {
      let total = 0;
      let seen = 0;
      perms(n, (a) => {
        total += count(a).acc;
        seen++;
      });
      const avg = total / seen;
      const want = 8 * n + 1 - 3 * harmonic(n);
      const gap = Math.abs(avg - want);
      worst = Math.max(worst, gap);
      rows.push([
        String(n),
        num(seen),
        avg.toFixed(6),
        want.toFixed(6),
        gap < 1e-9 ? "0" : gap.toExponential(2),
      ]);
    }
    const big = 8 * TASK_N + 1 - 3 * harmonic(TASK_N);
    return block(
      md(
        ["N", "순열 수", "정본의 배열 접근 평균", "8N + 1 − 3H_N", "차이"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `여덟 줄 가운데 차이가 0 이 아닌 줄은 ${rows.filter((r) => r[4] !== "0").length} 줄입니다. N = ${num(TASK_N)} 이면 H_N = ${harmonic(TASK_N).toFixed(4)} 이고, 평균 배열 접근은 ${big.toLocaleString("en-US", { maximumFractionDigits: 1 })} 번, 최악 8N − 2 는 ${num(8 * TASK_N - 2)} 번입니다.`,
    );
  },

  /** `perf.worst` — 입력의 모양이 접근 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const n = BIG_N;
    let most = 0;
    const rows = SHAPES.map(([name, a]) => {
      const c = count(a);
      most = Math.max(most, c.acc);
      return [
        name,
        num(c.pops),
        num(c.stops),
        num(c.empties),
        num(2 * n + 1 + 4 * c.pops + 2 * c.stops - c.empties),
        num(c.acc),
      ];
    });
    const LEN = 8;
    let over = 0;
    let top = 0;
    let checked = 0;
    everyArray(LEN, 3, (a) => {
      checked++;
      const c = count(a);
      if (c.acc > 8 * a.length - 2) over++;
      if (a.length === LEN && c.acc > top) top = c.acc;
    });
    return block(
      md(
        [
          "입력의 모양",
          "꺼낸 횟수 P",
          "멈춘 걸음 B",
          "비운 꺼내기 M",
          "2N + 1 + 4P + 2B − M",
          "실측 배열 접근",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      `N = ${num(n)} 에서 가장 많은 것은 ${num(most)} 번이고 8N − 2 = ${num(8 * n - 2)}${과와(num(8 * n - 2))} 같습니다. 길이 1 이상 ${LEN} 이하 · 높이 0 이상 3 이하인 배열 ${num(checked)} 개를 전부 넣어 8N − 2 를 넘는 입력을 찾았고, 찾은 입력은 ${over} 개입니다. 길이 ${LEN} 의 최댓값은 ${top} = 8·${LEN} − 2 입니다.`,
    );
  },

  /** `perf.worst` — 증가 수열 다섯 칸을 걸음마다 따라간다. */
  "worst-n5": () => {
    const a = up(5);
    const steps = walkOf(a);
    const n = a.length;
    const rows = Array.from({ length: n + 1 }, (_, i) => {
      const here = steps.filter((s) => s.i === i);
      const pops = here
        .filter((s) => s.kind === "pop")
        .map((s) => s.top as number);
      const stop = here.find((s) => s.kind === "stop");
      return [
        i === n ? `${i} · 보초 0` : `${i} · 높이 ${a[i]}`,
        pops.length === 0 ? "없음" : dots(pops),
        stop === undefined
          ? "없음"
          : `자리 ${stop.top} · 높이 ${a[stop.top as number]}`,
      ];
    });
    const c = count(a);
    return block(
      md(["읽은 자리", "꺼낸 자리", "멈춘 꼭대기"], rows),
      `입력은 ${show(a)} 입니다. P = ${c.pops}, B = ${c.stops}, M = ${c.empties} 이고 배열 접근은 ${c.acc} = 8·${n} − 2 번입니다.`,
    );
  },

  /** `selfcheck` — 자리 2 가 왜 자리 1 에서 멈추는가. */
  "selfcheck-why": () => {
    const inn = WALK_STEPS.find(
      (s) => s.kind === "stop" && s.i === 2,
    ) as WalkStep;
    const out = WALK_STEPS.find(
      (s) => s.kind === "pop" && s.top === 2,
    ) as WalkStep;
    return md(
      ["걸음", "일어난 일", "걸음 뒤 stack"],
      [
        [
          inn.id,
          `자리 2 를 넣었다 — 꼭대기 자리 ${inn.top} 의 높이 ${h(inn.top as number)} ≤ ${inn.cur}`,
          show(inn.stack),
        ],
        [
          out.id,
          `자리 2 를 꺼냈다 — 왼쪽 경계 자리 ${out.left} · 폭 ${out.width} · 넓이 ${out.area}`,
          show(out.stack),
        ],
      ],
    );
  },
};
