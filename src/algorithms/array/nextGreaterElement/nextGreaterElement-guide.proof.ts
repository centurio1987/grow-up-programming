/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.** 정본이 읽은 칸의
 * 기록(`run` · `count`)과 걸음(`WALK_STEPS`)은 그림 사이드카가 만든 것을 그대로 받는다 — 그림과 표가 같은
 * 기록을 쓴다. 비용은 원고 전체가 한 기준으로 센다 — **칸 접근 수**(읽기 + 쓰기)이고, 세는 규칙은 그림
 * 사이드카의 `count` 머리 주석에 있다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/nextGreaterElement/nextGreaterElement-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  cases,
  stackAccesses,
  treeAccesses,
} from "./nextGreaterElement-guide.alt.ts";
import {
  afterRead,
  BIG,
  BIG_N,
  bounded,
  count,
  decreasing,
  deepInput,
  dots,
  leastKeep,
  naiveWorst,
  num,
  OPS_PER_SECOND,
  run,
  scanRight,
  seconds,
  show,
  stackBest,
  TASK_N,
  WALK,
  WALK_STEPS,
  type WalkStep,
  walkOf,
} from "./nextGreaterElement-guide.fig.tsx";
import { nextGreaterElement } from "./nextGreaterElement-guide.ref.ts";

const REF = new URL("./nextGreaterElement-guide.ref.ts", import.meta.url)
  .pathname;

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

/** `[2, 1, 2, 4, 3]` 꼴 — 코드 안의 배열 표기. */
const code = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

const v = (p: number): number => WALK[p] as number;

/* ───────────────────────── 정본으로 답하는 이웃 물음 ───────────────────────── */

/** 오른쪽에서 처음 더 큰 값 — 정본. */
const rightGreater = (xs: readonly number[]): number[] =>
  nextGreaterElement([...xs]);

/** 왼쪽에서 처음 더 큰 값 — 뒤집은 배열에 정본을 걸고 다시 뒤집는다. */
const leftGreater = (xs: readonly number[]): number[] =>
  nextGreaterElement([...xs].reverse()).reverse();

/** 오른쪽에서 처음 더 작은 값 — 부호를 뒤집은 배열에 정본을 건다. 정의를 직접 센 값과 대조한다. */
const rightSmaller = (xs: readonly number[]): number[] => {
  const got = nextGreaterElement(xs.map((x) => -x));
  const want = xs.map((x, i) => {
    for (let j = i + 1; j < xs.length; j++)
      if ((xs[j] as number) < x) return xs[j] as number;
    return -1;
  });
  const back = got.map((g, i) => (g === -1 && want[i] === -1 ? -1 : -g));
  if (back.join(",") !== want.join(",")) {
    throw new Error("부호를 뒤집은 정본이 「처음 더 작은 값」의 정의와 다르다");
  }
  return back;
};

/** 길이 `k` 창마다 최댓값 — 정의 그대로. 스택 하나로 푸는 물음이 아니라 정본을 부르지 않는다. */
const windowMax = (xs: readonly number[], k: number): number[] =>
  Array.from({ length: xs.length - k + 1 }, (_, s) =>
    Math.max(...xs.slice(s, s + k)),
  );

/* ───────────────────────── 변이 넷 ───────────────────────── */

interface Impl {
  nextGreaterElement: (nums: number[]) => number[];
}

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

/**
 * 정본과 변이를 같은 입력들에 걸고 답을 나란히 적는다. 변이가 어느 입력에서도 답을 안 바꾸면 「깨진다」가
 * 거짓이다 — 다만 중화 실행에서는 변이 모듈이 정본 그대로라 이 검사를 건너뛴다(SPEC §0 「자기검사를 중화
 * 실행에서 건너뛰게 쓴다」).
 */
function mutantBlock(
  inputs: readonly number[][],
  mutated: Impl,
  column: string,
): string {
  const neutral = mutated.nextGreaterElement === nextGreaterElement;
  const rows = inputs.map((xs) => ({
    name: show(xs),
    good: show(nextGreaterElement([...xs])),
    bad: show(mutated.nextGreaterElement([...xs])),
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
    ),
    `${rows.length} 벌 중 ${diff} 벌에서 답이 다릅니다.`,
  );
}

/**
 * 어떤 구현이 자리 `i` 를 읽을 때마다 무엇을 꺼냈는지 — 입력 배열을 감시해 읽은 칸에서 되짚는다. 꺼내는
 * 조건 `popIf` 는 그 구현의 조건이다(변이마다 다르다). 되짚은 스택의 꼭대기가 실제로 읽은 칸과 다르면 던진다.
 */
function popsPerRead(
  impl: Impl,
  nums: readonly number[],
  popIf: (top: number, cur: number) => boolean,
): { i: number; popped: number[] }[] {
  const reads: number[] = [];
  impl.nextGreaterElement(
    new Proxy([...nums], {
      get(t, key, r) {
        if (typeof key === "string" && /^\d+$/.test(key))
          reads.push(Number(key));
        return Reflect.get(t, key, r);
      },
    }),
  );
  const out: { i: number; popped: number[] }[] = [];
  const stack: number[] = [];
  let next = 0;
  for (const k of reads) {
    const last = out.at(-1);
    if (k === next) {
      if (last) stack.push(last.i);
      out.push({ i: k, popped: [] });
      next++;
      continue;
    }
    if (!last || k !== stack.at(-1)) {
      throw new Error(`되짚은 스택의 꼭대기와 읽은 칸 ${k} 이 다르다`);
    }
    if (popIf(nums[k] as number, nums[last.i] as number)) {
      stack.pop();
      last.popped.push(k);
    }
  }
  return out;
}

/* ───────────────────────── 걸음에서 뽑는 값 ───────────────────────── */

/** 걸음의 갈래 표지 — 절차 그림의 원문자와 같다. */
const branchOf = (s: WalkStep): string =>
  ({ push: "④", stop: "② ④", pop: "② ③", end: "⑤" })[s.kind];

/** 걸음 번호 나열(「T3 · T5 · T6」). */
const idsOf = (pred: (s: WalkStep) => boolean): string =>
  WALK_STEPS.filter(pred)
    .map((s) => s.id)
    .join(" · ");

/** 자리 `i` 를 읽은 걸음 중 첫 걸음인가 — 지금 값 `nums[i]` 는 그 걸음에서 한 번 읽는다. */
const firstOfI = (t: WalkStep): boolean =>
  WALK_STEPS.find((u) => u.kind !== "end" && u.i === t.i) === t;

/** 자리 `p` 를 넣은 걸음과 꺼낸 걸음. 끝까지 남으면 `out` 이 없다. */
function lifeOf(
  steps: readonly WalkStep[],
  p: number,
): { in: WalkStep; out?: WalkStep } {
  const pushed = steps.find(
    (s) => (s.kind === "push" || s.kind === "stop") && s.i === p,
  ) as WalkStep;
  const popped = steps.find((s) => s.kind === "pop" && s.top === p);
  return popped ? { in: pushed, out: popped } : { in: pushed };
}

/** 조화수 `H_n = 1 + 1/2 + … + 1/n`. */
function harmonic(n: number): number {
  let h = 0;
  for (let k = 1; k <= n; k++) h += 1 / k;
  return h;
}

/** 길이 `m` 순열 전부에 `visit` 을 건다. */
function eachPermutation(m: number, visit: (xs: number[]) => void): void {
  const walk = (rest: number[], acc: number[]): void => {
    if (rest.length === 0) {
      visit(acc);
      return;
    }
    for (let k = 0; k < rest.length; k++) {
      walk(
        [...rest.slice(0, k), ...rest.slice(k + 1)],
        [...acc, rest[k] as number],
      );
    }
  };
  walk(
    Array.from({ length: m }, (_, k) => k + 1),
    [],
  );
}

/** 최악 모양 — 두 번째로 큰 값이 맨 앞, 가운데 증가, 가장 큰 값이 맨 뒤. */
const worstShape = (n: number): number[] => [
  n - 1,
  ...Array.from({ length: n - 2 }, (_, i) => i),
  n,
];

/** 적은 쪽과 그 차이 — 두 배를 넘으면 몇 배인지, 아니면 몇 번 차이인지 적는다. */
function lessSide(stack: number, tree: number): string {
  const [name, lo, hi] =
    stack < tree
      ? ["단조 스택", stack, tree]
      : ["구간 최댓값 트리", tree, stack];
  return hi >= 2 * lo
    ? `${name} · ${(hi / lo).toFixed(1)} 배 적다`
    : `${name} · ${num(hi - lo)} 번 적다`;
}

/* ───────────────────────── 증명 블록 ───────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `prereq` — 같은 배열에서 네 가지 물음. */
  "prereq-four-questions": () =>
    md(
      ["물음", `${show(WALK)} 의 답`, "이 글에서"],
      [
        [
          "자리마다 오른쪽에서 처음 더 큰 값",
          show(rightGreater(WALK)),
          "다룬다",
        ],
        [
          "자리마다 왼쪽에서 처음 더 큰 값",
          show(leftGreater(WALK)),
          "읽는 방향만 뒤집는다",
        ],
        [
          "자리마다 오른쪽에서 처음 더 작은 값",
          show(rightSmaller(WALK)),
          "부등호만 뒤집는다",
        ],
        [
          "길이 3 인 창마다 최댓값",
          show(windowMax(WALK, 3)),
          "다루지 않는다. 넣고 빼는 쪽이 둘이다",
        ],
      ],
    ),

  /** `deep.origin` ② — 가장 단순한 방법을 과제 규모에 넣으면 몇 번인가. */
  "origin-naive-scale": () => {
    const rows = [1_000, 10_000].map((n) => {
      const s = scanRight(decreasing(n));
      const c = count(decreasing(n));
      return [num(n), num(s.acc), num(c.acc), seconds(s.acc)];
    });
    if (naiveWorst(10_000) !== scanRight(decreasing(10_000)).acc) {
      throw new Error("차례로 읽기의 식이 N = 10,000 실측과 다르다");
    }
    rows.push([
      num(TASK_N),
      num(naiveWorst(TASK_N)),
      num(stackBest(TASK_N)),
      seconds(naiveWorst(TASK_N)),
    ]);
    return block(
      md(
        [
          "N",
          "차례로 읽기의 칸 접근",
          "이 글이 만들 절차의 칸 접근",
          "차례로 읽기의 시간(초당 1 억 번)",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `입력은 감소 수열입니다. N = 1,000 · 10,000 은 실제로 세었고, N = ${num(TASK_N)}${은는(num(TASK_N))} 두 실측과 맞는 식 2N + N(N−1)/2 와 5N − 2 에 넣은 값입니다.`,
    );
  },

  /** `deep.origin` ③ — 작은 입력에서 자리마다 어디를 읽었는가. */
  "origin-scan-small": () => {
    const { scans } = scanRight(WALK);
    const total = scans.reduce((a, s) => a + s.read.length, 0);
    const readers = (k: number) =>
      scans.flatMap((s, i) => (s.read.includes(k) ? [i] : []));
    const twice = WALK.map((_, k) => k).filter((k) => readers(k).length >= 2);
    return block(
      md(
        ["자리 i", "nums[i]", "읽은 자리", "멈춘 값", "읽은 칸 수"],
        scans.map((s, i) => [
          String(i),
          String(v(i)),
          s.read.length === 0 ? "없음" : dots(s.read),
          s.stop === -1 ? "못 찾았다" : String(v(s.stop)),
          String(s.read.length),
        ]),
        [0, 1, 4],
      ),
      `다섯 자리가 읽은 칸은 모두 ${total} 칸이고, 두 자리 이상이 거듭 읽은 칸은 자리 ${dots(twice)} 입니다. 자리 3 의 값 ${v(3)}${을를(v(3))} 자리 ${dots(readers(3))}${이가(readers(3).at(-1) ?? "")} 따로 읽었습니다.`,
    );
  },

  /** `deep.origin` ③ — 값 하나가 누구의 답인가. */
  "origin-who-receives": () => {
    const before = afterRead(2);
    const after = afterRead(3);
    const rows = [0, 1, 2].map((p) => [
      `자리 ${p}`,
      String(v(p)),
      v(3) > v(p) ? "참" : "거짓",
      before.result[p] === -1 ? "아니다" : `예 · 답 ${before.result[p]}`,
      after.result[p] === v(3) && before.result[p] === -1
        ? "받는다"
        : "못 받는다",
    ]);
    return md(
      [
        "자리",
        "그 값",
        `${v(3)} > 그 값`,
        "자리 3 을 읽기 전에 정해진 답",
        `답 ${v(3)}`,
      ],
      rows,
      [1],
    );
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리한다. */
  "origin-two-ways": () => {
    const inputs: [string, readonly number[]][] = [
      [`전개 입력 ${show(WALK)}`, WALK],
      [`nums[i] = (7919 i) mod 1009 인 ${num(BIG_N)} 칸`, BIG],
      [`감소 수열 ${num(BIG_N)} 칸`, decreasing(BIG_N)],
    ];
    const rows = inputs.map(([name, xs]) => {
      const a = scanRight(xs);
      const b = count(xs);
      if (a.result.join(",") !== b.result.join(",")) {
        throw new Error("두 방식의 답이 다르다");
      }
      return [name, num(a.acc), num(b.acc)];
    });
    const small = [scanRight(WALK).acc, count(WALK).acc] as const;
    return block(
      md(
        ["입력", "차례로 읽기", "기다리는 자리를 남겨 두고 꼭대기부터 보기"],
        rows,
        [1, 2],
      ),
      `다섯 칸에서는 뒤엣것이 ${num(small[1] - small[0])} 번 더 많고, ${num(BIG_N)} 칸 두 입력에서는 적습니다. 두 방식이 낸 답은 세 입력 모두 서로 일치합니다.`,
    );
  },

  /** `deep.origin` ⑤ — 몇 자리까지 남기는가로 답과 비용이 어떻게 갈리는가. */
  "origin-keep-how-many": () => {
    const rows: string[][] = [];
    for (const keep of [1, 2, 4, 8, 12, 13, 14, BIG_N]) {
      const b = bounded(BIG, keep, false);
      rows.push([
        keep === BIG_N ? `전부(${num(BIG_N)})` : String(keep),
        num(b.acc),
        num(b.wrong),
      ]);
    }
    const all = bounded(BIG, BIG_N, true);
    rows.push(["전부 · 아래까지 비교", num(all.acc), num(all.wrong)]);
    const deep = leastKeep(deepInput(BIG_N));
    return block(
      md(["남기는 자리 수", "칸 접근", "틀린 자리"], rows, [1, 2]),
      `입력은 nums[i] = (7919 i) mod 1009 인 ${num(BIG_N)} 칸이고, 틀린 자리가 0 이 되는 것은 ${leastKeep(BIG)} 부터입니다. 감소 수열 ${num(BIG_N - 1)} 칸 뒤에 가장 큰 값 하나를 둔 입력에서는 ${num(deep)} 부터입니다.`,
    );
  },

  /** `deep.build` (c) — 단조 스택의 칸 하나를 읽는 법. */
  "build-read-one": () => {
    const s = afterRead(2);
    const slot = s.stack.length - 1;
    const p = s.stack[slot] as number;
    const got = lifeOf(WALK_STEPS, p).out as WalkStep;
    return md(
      ["차례", "읽는 것", "나오는 것"],
      [
        ["1", `stack[${slot}]`, `자리 ${p}`],
        ["2", `nums[${p}]`, `값 ${v(p)}`],
        ["3", `result[${p}]`, `${s.result[p]} — 아직 답이 없다`],
        [
          "4",
          "답을 받는 때",
          `자리 ${got.i} 의 ${v(got.i)}${을를(v(got.i))} 읽을 때 ${v(got.i)}${을를(v(got.i))} 받는다`,
        ],
      ],
      [0],
    );
  },

  /** `deep.build` (d) — 이웃한 두 칸의 관계. */
  "build-neighbors": () => {
    const seen = new Set<string>();
    const rows: string[][] = [];
    for (const s of WALK_STEPS) {
      for (let k = 0; k + 1 < s.stack.length; k++) {
        const lo = s.stack[k] as number;
        const hi = s.stack[k + 1] as number;
        const key = `${lo}-${hi}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const between = Array.from(
          { length: hi - lo - 1 },
          (_, d) => lo + 1 + d,
        );
        rows.push([
          `자리 ${lo} · 값 ${v(lo)}`,
          `자리 ${hi} · 값 ${v(hi)}`,
          v(lo) >= v(hi) ? "예" : "아니오",
          between.length === 0
            ? "없음"
            : between.map((b) => `자리 ${b} · 답 ${s.result[b]}`).join(" · "),
        ]);
      }
    }
    // 큰 입력에서도 자리를 넣은 순간마다 이웃한 두 칸을 전부 잰다.
    const { events } = run(BIG);
    const stack: number[] = [];
    const answered = new Set<number>();
    let pairs = 0;
    let bad = 0;
    for (const e of events) {
      if (e.kind === "cmp" && e.pop) {
        stack.pop();
        answered.add(e.top);
      } else if (e.kind === "push") {
        stack.push(e.i);
        for (let k = 0; k + 1 < stack.length; k++) {
          const lo = stack[k] as number;
          const hi = stack[k + 1] as number;
          pairs++;
          let ok = (BIG[lo] as number) >= (BIG[hi] as number);
          for (let b = lo + 1; b < hi; b++) if (!answered.has(b)) ok = false;
          if (!ok) bad++;
        }
      }
    }
    return block(
      md(
        [
          "아래 칸",
          "바로 위 칸",
          "아래 칸의 값 ≥ 위 칸의 값",
          "두 자리 사이에 있던 자리",
        ],
        rows,
      ),
      `전개 입력에서 이웃한 두 칸이 ${rows.length} 쌍 나왔습니다. ${num(BIG_N)} 칸 입력에서는 자리를 넣은 순간마다 이웃한 두 칸 ${num(pairs)} 쌍을 쟀고, 아래 칸의 값이 더 작거나 사이에 답을 못 받은 자리가 남은 쌍은 ${num(bad)} 개입니다.`,
    );
  },

  /** `deep.build` (e) — 읽은 값을 전부 정렬해 둔 목록과 비교한다. */
  "build-vs-sorted": () => {
    const rows = WALK.map((_, i) => {
      const s = afterRead(i);
      const sorted = WALK.slice(0, i + 1).sort((a, b) => b - a);
      const vals = s.stack.map((p) => v(p));
      return [
        String(i),
        show(sorted),
        show(vals),
        String(sorted.length),
        String(vals.length),
      ];
    });
    const big = count(BIG);
    return block(
      md(
        [
          "읽은 마지막 자리",
          "읽은 값을 큰 것부터 정렬한 목록",
          "단조 스택의 값",
          "목록 칸 수",
          "단조 스택 칸 수",
        ],
        rows,
        [0, 3, 4],
      ),
      `${num(BIG_N)} 칸 입력을 끝까지 읽으면 정렬한 목록은 ${num(BIG_N)} 칸이 되고, 단조 스택은 가장 깊을 때가 ${num(big.peak)} 칸, 끝났을 때가 ${num(big.left)} 칸입니다.`,
    );
  },

  /** `deep.build` (f) — 꼭대기에서 멈춘 걸음마다 그 아래도 전부 지금 값 이상이었는가. */
  "build-why-stop": () => {
    const inputs: [string, readonly number[]][] = [
      ["전개 입력", WALK],
      [`${num(BIG_N)} 칸 입력`, BIG],
      [`감소 수열 ${num(BIG_N)} 칸`, decreasing(BIG_N)],
    ];
    return md(
      [
        "입력",
        "꼭대기에서 멈춘 걸음",
        "그 아래 칸까지 전부 지금 값 이상이던 걸음",
      ],
      inputs.map(([name, xs]) => {
        const { events } = run(xs);
        const stack: number[] = [];
        let stops = 0;
        let allBelow = 0;
        for (const e of events) {
          if (e.kind === "cmp") {
            if (e.pop) stack.pop();
            else {
              stops++;
              const cur = xs[e.i] as number;
              if (stack.every((p) => (xs[p] as number) >= cur)) allBelow++;
            }
          } else if (e.kind === "push") stack.push(e.i);
        }
        return [name, num(stops), num(allBelow)];
      }),
      [1, 2],
    );
  },

  /** `deep.build` 1단계 — 끝까지 남는 자리가 있다. */
  "build-leftover": () => {
    const inputs: number[][] = [[...WALK], [1, 2, 3, 4], [4, 3, 2, 1]];
    return md(
      ["입력", "끝까지 단조 스택에 남은 자리", "그 자리의 답"],
      inputs.map((xs) => {
        const left = (walkOf(xs).at(-1) as WalkStep).stack;
        const r = nextGreaterElement([...xs]);
        return [
          show(xs),
          dots(left),
          left.map((p) => String(r[p])).join(" · "),
        ];
      }),
    );
  },

  /** `deep.build` 2단계 — 자리마다 꼭대기부터 비교하고 멈춘 까닭. */
  "build-pop-steps": () =>
    md(
      [
        "읽은 자리",
        "읽기 전 stack",
        "꺼낸 자리(차례대로)",
        "꺼내기가 멈춘 까닭",
      ],
      WALK.map((cur, i) => {
        const here = WALK_STEPS.filter((s) => s.kind !== "end" && s.i === i);
        const before = i === 0 ? [] : [...afterRead(i - 1).stack];
        const popped = here
          .filter((s) => s.kind === "pop")
          .map((s) => s.top as number);
        const stop = here.find((s) => s.kind === "stop");
        return [
          `${i} · 값 ${cur}`,
          before.length === 0 ? "비었다" : show(before),
          popped.length === 0 ? "없음" : dots(popped),
          stop
            ? `꼭대기 자리 ${stop.top} 의 값 ${v(stop.top as number)} ≥ ${cur}`
            : "단조 스택이 비었다",
        ];
      }),
    ),

  /** `deep.build` 3단계 — 자리마다 넣고 꺼낸 때와 횟수. */
  "build-once": () => {
    const rows = WALK.map((_, p) => {
      const life = lifeOf(WALK_STEPS, p);
      return [
        `자리 ${p}`,
        `자리 ${life.in.i}${을를(life.in.i)} 읽을 때`,
        life.out
          ? `자리 ${life.out.i}${을를(life.out.i)} 읽을 때`
          : "끝까지 남았다",
      ];
    });
    const pushed = new Map<number, number>();
    const popped = new Map<number, number>();
    for (const e of run(BIG).events) {
      if (e.kind === "push") pushed.set(e.i, (pushed.get(e.i) ?? 0) + 1);
      if (e.kind === "cmp" && e.pop)
        popped.set(e.top, (popped.get(e.top) ?? 0) + 1);
    }
    const c = count(BIG);
    return block(
      md(["자리", "넣은 때", "꺼낸 때"], rows),
      `${num(BIG_N)} 칸 입력에서는 넣기가 ${num(pushed.size)} 자리에 ${num(c.n)} 번, 꺼내기가 ${num(popped.size)} 자리에 ${num(c.pops)} 번이었습니다. 한 자리를 넣은 횟수는 많아야 ${Math.max(...pushed.values())} 번, 꺼낸 횟수도 많아야 ${Math.max(...popped.values())} 번입니다.`,
    );
  },

  /** `deep.build` 설계 선택 — 스택에 자리 대신 값을 담으면. */
  "build-store-value": () => {
    /** 값을 담고, 꺼낸 값의 답은 그 값이 처음 나오는 자리에 적는 사본. 자리를 모르니 찾아야 한다. */
    const byValue = (xs: readonly number[]): number[] => {
      const result = new Array<number>(xs.length).fill(-1);
      const stack: number[] = [];
      for (const cur of xs) {
        while (stack.length > 0 && (stack.at(-1) as number) < cur) {
          const top = stack.pop() as number;
          result[xs.indexOf(top)] = cur;
        }
        stack.push(cur);
      }
      return result;
    };
    const inputs: number[][] = [
      [...WALK],
      [1, 2, 3, 4],
      [3, 1, 3, 2],
      [2, 7, 3, 5, 1, 6],
    ];
    const rows = inputs.map((xs) => {
      const good = show(nextGreaterElement([...xs]));
      const bad = show(byValue(xs));
      return [show(xs), good, bad, good === bad ? "같다" : "다르다"];
    });
    const diffRows = rows.filter((r) => r[3] === "다르다");
    const repeated = diffRows.every((r) => {
      const xs = inputs[rows.indexOf(r)] as number[];
      return new Set(xs).size < xs.length;
    });
    return block(
      md(["입력", "자리를 담는 코드", "값을 담는 코드", "답"], rows),
      `${rows.length} 벌 중 ${diffRows.length} 벌에서 답이 다릅니다. ${repeated ? "답이 갈린 벌은 모두 같은 값이 두 번 이상 나오는 입력입니다." : "답이 갈린 벌 중에는 값이 모두 다른 입력도 있습니다."}`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 입력과 나와야 할 답. */
  "walk-input": () => {
    const want = code(nextGreaterElement([...WALK]));
    return [
      `const nums = ${code(WALK)};`,
      `// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다`,
    ].join("\n");
  },

  /** `deep.walk.step` 1 — 준비한 직후의 상태. 답 배열은 정본이 순회 전에 까는 값이다(재생이 그 값으로 시작해 정본의 답과 맞는다). */
  "walk-init": () => {
    const fresh = new Array<number>(WALK.length).fill(-1);
    return md(
      ["nums", "result", "stack", "순회"],
      [
        [show(WALK), show(fresh), "[]", `자리 0 부터 ${WALK.length - 1} 까지`],
        ["[]", show(nextGreaterElement([])), "[]", "들어가지 않는다"],
      ],
    );
  },

  /** `deep.walk.step` 2 — 자리 3 을 읽는 걸음에서 조건을 본 차례. */
  "walk-pop-at-3": () => {
    const i = 3;
    const here = WALK_STEPS.filter((s) => s.kind !== "end" && s.i === i);
    const rows: string[][] = [];
    let prev = [...afterRead(i - 1).stack];
    for (const [k, s] of here.entries()) {
      if (s.kind === "pop") {
        const t = s.top as number;
        rows.push([
          String(k + 1),
          `자리 ${t}`,
          String(v(t)),
          `\`${v(t)} >= ${v(i)}\` 거짓`,
          "꺼낸다",
          show(s.stack),
          show(s.result),
        ]);
      } else {
        rows.push([
          String(k + 1),
          prev.length === 0 ? "없다" : `자리 ${prev.at(-1)}`,
          "—",
          "`stack.length > 0` 거짓",
          "반복이 끝난다",
          show(prev),
          show(s.result),
        ]);
      }
      prev = [...s.stack];
    }
    return md(
      ["차례", "꼭대기", "그 값", "조건", "하는 일", "stack", "result"],
      rows,
      [0, 2],
    );
  },

  /** `deep.walk.pause` — 꺼내기를 한 번만 하면 자리마다 무엇을 꺼내는가. */
  "pause-once-trace": () => {
    const good = popsPerRead({ nextGreaterElement }, WALK, (t, c) => t < c);
    const bad = popsPerRead(onceOnly, WALK, (t, c) => t < c);
    return md(
      ["읽은 자리", "바른 코드가 꺼낸 자리", "한 번만 꺼내는 코드가 꺼낸 자리"],
      good.map((g, k) => {
        const b = bad[k]?.popped ?? [];
        return [
          `${g.i} · 값 ${v(g.i)}`,
          g.popped.length === 0 ? "없음" : dots(g.popped),
          b.length === 0 ? "없음" : dots(b),
        ];
      }),
    );
  },

  /** `deep.walk.pause` — 꺼내기를 한 번만 하는 코드의 답. */
  "pause-once-only": () =>
    mutantBlock(
      [[...WALK], [1, 2, 3, 4], [4, 3, 2, 1], [1, 5, 2, 6]],
      onceOnly,
      "한 번만 꺼내는 코드",
    ),

  /** `deep.walk.step` 3 — 넣은 뒤의 스택. */
  "walk-push": () =>
    md(
      [
        "읽은 자리",
        "꺼내기가 끝난 뒤 stack",
        "넣은 뒤 stack",
        "넣은 뒤 그 값(바닥 → 꼭대기)",
      ],
      WALK.map((_, i) => {
        const s = afterRead(i);
        return [
          String(i),
          show(s.stack.slice(0, -1)),
          show(s.stack),
          s.stack.map((p) => v(p)).join(" ≥ "),
        ];
      }),
      [0],
    ),

  /** `deep.walk.pause` — 초기값을 0 으로 깔면. */
  "pause-fill-zero": () =>
    mutantBlock(
      [[...WALK], [1, 2, 3, 4], [4, 3, 2, 1]],
      fillZero,
      "0 을 깔아 둔 코드",
    ),

  /** `deep.walk.step` 4 — 고정 입력으로 끝까지 실행한 걸음 전부와 갈래 피복. */
  "walk-trace": () => {
    const cond = (s: WalkStep): string => {
      switch (s.kind) {
        case "push":
          return "`stack.length > 0` 이 **거짓**";
        case "stop":
          return `\`${v(s.top as number)} >= ${v(s.i)}\`${이가(v(s.i))} **참** → 멈춘다`;
        case "pop":
          return `\`${v(s.top as number)} >= ${v(s.i)}\`${이가(v(s.i))} **거짓** → 꺼낸다`;
        case "end":
          return `\`i < ${WALK.length}\`${이가(WALK.length)} **거짓** → 반환`;
      }
    };
    const rows = WALK_STEPS.map((s) => [
      s.id,
      s.kind === "end" ? "—" : String(s.i),
      s.top === undefined ? "—" : `자리 ${s.top}`,
      cond(s),
      show(s.stack),
      show(s.result),
      branchOf(s),
    ]);
    const has = (mark: string) => idsOf((s) => branchOf(s).includes(mark));
    const last = WALK_STEPS.at(-1) as WalkStep;
    return block(
      md(
        [
          "걸음",
          "자리 i",
          "비교한 꼭대기",
          "조건 판정",
          "걸음 뒤 stack",
          "걸음 뒤 result",
          "갈래",
        ],
        rows,
      ),
      `① 은 ${WALK_STEPS[0]?.id} 앞의 준비, ② 는 ${has("②")}, ③ 은 ${has("③")}, ④ 는 ${has("④")}, ⑤ 는 ${has("⑤")} 입니다. 넣기가 ${last.pushes} 번, 꺼내기가 ${last.pops} 번입니다.`,
    );
  },

  /** `deep.walk.pause` — 값이 아니라 자리 번호를 적으면. */
  "pause-write-index": () =>
    mutantBlock(
      [[...WALK], [0, 1, 2, 3], [0, 1, 2, 3, 4], [1, 2, 3, 4]],
      writeIndex,
      "자리 번호를 적은 코드",
    ),

  /** `deep.walk.final` — 전체 코드를 부른 결과. */
  "final-calls": () => {
    const calls: number[][] = [[...WALK], [5], [5, 5, 5], [2, 7, 3, 5, 1, 6]];
    const heads = calls.map((xs) => `nextGreaterElement(${code(xs)})`);
    const w = Math.max(...heads.map((h) => h.length));
    return [
      ...calls.map(
        (xs, k) =>
          `${(heads[k] as string).padEnd(w)}   →   ${code(nextGreaterElement([...xs]))}`,
      ),
    ].join("\n");
  },

  /** `related` — 기다린 구간 둘이 절반만 걸치는 짝이 있는가. */
  "related-nesting": () => {
    const measure = (xs: readonly number[]) => {
      const { events } = run(xs);
      let t = 0;
      const start = new Map<number, number>();
      const spans: [number, number][] = [];
      for (const e of events) {
        t++;
        if (e.kind === "push") start.set(e.i, t);
        if (e.kind === "cmp" && e.pop) {
          spans.push([start.get(e.top) as number, t]);
          start.delete(e.top);
        }
      }
      for (const s of start.values()) spans.push([s, t + 1]);
      let nested = 0;
      let apart = 0;
      let crossing = 0;
      for (let a = 0; a < spans.length; a++) {
        for (let b = a + 1; b < spans.length; b++) {
          const [p, q] = spans[a] as [number, number];
          const [r, s] = spans[b] as [number, number];
          if (q < r || s < p) apart++;
          else if ((p <= r && s <= q) || (r <= p && q <= s)) nested++;
          else crossing++;
        }
      }
      return { spans: spans.length, nested, apart, crossing };
    };
    const inputs: [string, readonly number[]][] = [
      ["전개 입력", WALK],
      [`${num(BIG_N)} 칸 입력`, BIG],
    ];
    return md(
      ["입력", "기다린 구간", "포개진 짝", "떨어진 짝", "절반만 걸친 짝"],
      inputs.map(([name, xs]) => {
        const m = measure(xs);
        return [
          name,
          num(m.spans),
          num(m.nested),
          num(m.apart),
          num(m.crossing),
        ];
      }),
      [1, 2, 3, 4],
    );
  },

  /** `purpose.alt` — 갱신이 없을 때 질의 수로 갈리는 순서. */
  "alt-queries": () => {
    const s = cases["단조 스택"]();
    const t = cases["구간 최댓값 트리"]();
    const keys = [
      ["질의 53 개", "갱신 0 회 · 질의 53 개 칸 접근"],
      ["질의 54 개", "갱신 0 회 · 질의 54 개 칸 접근"],
      ["질의 4,096 개", "갱신 0 회 · 질의 4,096 개 칸 접근"],
    ] as const;
    return md(
      ["갱신 0 회", "단조 스택", "구간 최댓값 트리", "적은 쪽"],
      keys.map(([label, key]) => {
        const a = s[key] as number;
        const b = t[key] as number;
        return [label, num(a), num(b), lessSide(a, b)];
      }),
      [1, 2],
    );
  },

  /** `purpose.alt` — 질의를 묶어 두고 갱신 수로 갈리는 순서. */
  "alt-updates": () => {
    const s = cases["단조 스택"]();
    const t = cases["구간 최댓값 트리"]();
    const keys = [
      ["갱신 0 회", "질의 1,024 개 · 갱신 0 회 칸 접근"],
      ["갱신 2 회", "질의 1,024 개 · 갱신 2 회 칸 접근"],
      ["갱신 3 회", "질의 1,024 개 · 갱신 3 회 칸 접근"],
      ["갱신 1,024 회", "질의 1,024 개 · 갱신 1,024 회 칸 접근"],
    ] as const;
    const cellsS = s["추가 칸"] as number;
    return block(
      md(
        ["질의 1,024 개", "단조 스택", "구간 최댓값 트리", "적은 쪽"],
        keys.map(([label, key]) => {
          const a = s[key] as number;
          const b = t[key] as number;
          return [label, num(a), num(b), lessSide(a, b)];
        }),
        [1, 2],
      ),
      `추가 칸은 단조 스택이 ${num(cellsS)} 칸(답 배열 ${num(BIG_N)} 칸 + 단조 스택이 가장 깊었을 때 ${num(cellsS - BIG_N)} 칸), 구간 최댓값 트리가 ${num(t["추가 칸"] as number)} 칸입니다. 두 설계 모두 입력 사본은 넣지 않았고, 트리를 내려가는 재귀 스택도 넣지 않았어요.`,
    );
  },

  /** `purpose.alt` — 순서가 뒤집히는 자리를 한 벌 만들기 · 질의 하나 · 갱신 하나의 비용으로 푼다. */
  "alt-boundary": () => {
    const s = cases["단조 스택"]();
    const t = cases["구간 최댓값 트리"]();
    const buildS = stackAccesses(1, 0).acc - 1;
    const buildT = treeAccesses(0, 0).acc;
    const queryS = 1;
    const queryT =
      ((t["갱신 0 회 · 질의 53 개 칸 접근"] as number) - buildT) / 53;
    const u0 = "질의 1,024 개 · 갱신 0 회 칸 접근";
    const u2 = "질의 1,024 개 · 갱신 2 회 칸 접근";
    const updS = ((s[u2] as number) - (s[u0] as number)) / 2;
    const updT = ((t[u2] as number) - (t[u0] as number)) / 2;
    const qCross = ((buildS - buildT) / (queryT - queryS)).toFixed(1);
    const gap = (t[u0] as number) - (s[u0] as number);
    const uCross = (gap / (updS - updT)).toFixed(2);
    return block(
      md(
        ["설계", "한 벌 만들기", "질의 하나", "갱신 하나"],
        [
          ["단조 스택", num(buildS), String(queryS), num(updS)],
          [
            "구간 최댓값 트리",
            num(buildT),
            `평균 ${queryT.toFixed(1)}`,
            num(updT),
          ],
        ],
        [1, 2, 3],
      ),
      `한 벌 만들기의 차이 ${num(buildS - buildT)} 번을 질의 하나의 차이 ${(queryT - queryS).toFixed(1)} 번으로 나누면 ${qCross} 이고, 실측은 질의 53 개에서 54 개로 넘어가는 자리에서 순서가 뒤집힙니다. 질의 1,024 개에서 벌어진 차이 ${num(gap)} 번을 갱신 하나의 차이 ${num(updS - updT)} 번으로 나누면 ${uCross} 이고, 실측은 갱신 2 회에서 3 회로 넘어가는 자리입니다.`,
    );
  },

  /** `deep.math` ② — 기록의 정의를 전개 입력에 넣는다. */
  "records-check": () => {
    const c = count(WALK);
    const rows = WALK.map((x, i) => {
      let at = -1;
      for (let j = i + 1; j < WALK.length; j++) {
        if (v(j) > x) {
          at = j;
          break;
        }
      }
      return [
        String(i),
        String(x),
        at === -1 ? "없다" : `자리 ${at} 의 ${v(at)}`,
        at === -1 ? "예" : "아니오",
      ];
    });
    const rec = rows.filter((r) => r[3] === "예").map((r) => r[0]);
    const rest = WALK.length - rec.length;
    return block(
      md(
        ["자리 i", "nums[i]", "오른쪽에서 처음 더 큰 값", "기록"],
        rows,
        [0, 1],
      ),
      `기록이 ${rec.length} 개(자리 ${rec.join(" · ")})이고, 정본이 끝났을 때 단조 스택에 남은 자리도 ${c.left} 개입니다. 꺼낸 횟수 P 는 ${c.pops} 번이고 N − S = ${WALK.length} − ${rec.length} = ${rest}${과와(rest)} 같습니다.`,
    );
  },

  /** `deep.math` ③ — `P = N − S` 와 `B` 의 식을 실측과 나란히 놓는다. */
  "records-pb": () => {
    const inputs: [string, readonly number[]][] = [
      ["전개 입력", WALK],
      [`${num(BIG_N)} 칸 입력`, BIG],
      [`감소 수열 ${num(BIG_N)} 칸`, decreasing(BIG_N)],
    ];
    return md(
      [
        "입력",
        "꺼낸 횟수 P",
        "N − S",
        "멈춘 걸음 B",
        "왼쪽 최댓값을 못 넘은 자리 수",
      ],
      inputs.map(([name, xs]) => {
        const c = count(xs);
        let best = Number.NEGATIVE_INFINITY;
        let under = 0;
        xs.forEach((x, i) => {
          if (i > 0 && best >= x) under++;
          best = Math.max(best, x);
        });
        return [name, num(c.pops), num(c.n - c.left), num(c.stops), num(under)];
      }),
      [1, 2, 3, 4],
    );
  },

  /** `deep.math` ④ — 평균 기록 수가 조화수와 같은지 순열 전수로 대조한다. */
  "records-average": () => {
    const rows: string[][] = [];
    for (let n = 1; n <= 8; n++) {
      let total = 0;
      let perms = 0;
      eachPermutation(n, (xs) => {
        total += count(xs).left;
        perms++;
      });
      const avg = total / perms;
      const h = harmonic(n);
      rows.push([
        String(n),
        num(perms),
        avg.toFixed(6),
        h.toFixed(6),
        Math.abs(avg - h) < 1e-9 ? "0" : (avg - h).toExponential(2),
      ]);
    }
    const h = harmonic(TASK_N);
    return block(
      md(
        ["N", "순열 수", "정본이 남긴 자리 수의 평균", "H_N", "차이"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `여덟 줄 모두 차이가 0 입니다. N = ${num(TASK_N)} 이면 H_N = ${h.toFixed(4)} 이고, 평균 칸 접근 8N − 5·H_N 은 ${num(Math.round((8 * TASK_N - 5 * h) * 10) / 10)} 번, 최악 8N − 7 은 ${num(8 * TASK_N - 7)} 번으로 둘의 차이가 ${(5 * h - 7).toFixed(1)} 번입니다.`,
    );
  },

  /** `invariant` ② — 걸음이 끝날 때마다 읽은 자리가 스택과 답 중 어디에 있는가. */
  "invariant-states": () => {
    const rows = WALK_STEPS.map((s, at) => {
      const readTo = s.kind === "end" ? WALK.length - 1 : s.i;
      const readAll = Array.from({ length: readTo + 1 }, (_, p) => p);
      const answered = WALK_STEPS.slice(0, at + 1)
        .filter((t) => t.kind === "pop")
        .map((t) => t.top as number)
        .sort((a, b) => a - b);
      const inStack = new Set(s.stack);
      const got = new Set(answered);
      const both = readAll.filter((p) => inStack.has(p) && got.has(p));
      const none = readAll.filter((p) => !inStack.has(p) && !got.has(p));
      const vals = s.stack.map((p) => v(p));
      const down = vals.every(
        (x, k) => k === 0 || (vals[k - 1] as number) >= x,
      );
      return { s, readAll, answered, both, none, down };
    });
    const pushed = rows.filter((r) => r.s.kind !== "pop");
    const popping = rows.filter((r) => r.s.kind === "pop");
    const clean = pushed.every(
      (r) => r.both.length === 0 && r.none.length === 0 && r.down,
    );
    const onlyCurrent = popping.every(
      (r) =>
        r.both.length === 0 &&
        r.none.length === 1 &&
        r.none[0] === r.s.i &&
        r.down,
    );
    const ids = (xs: typeof rows) => xs.map((r) => r.s.id).join(" · ");
    return block(
      md(
        [
          "걸음",
          "읽은 자리",
          "stack 에 있는 자리",
          "답을 받은 자리",
          "두 곳에 다 있는 자리",
          "어디에도 없는 자리",
          "stack 의 값이 커지지 않음",
        ],
        rows.map((r) => [
          r.s.id,
          dots(r.readAll),
          r.s.stack.length === 0 ? "없음" : dots(r.s.stack),
          r.answered.length === 0 ? "없음" : dots(r.answered),
          r.both.length === 0 ? "없음" : dots(r.both),
          r.none.length === 0 ? "없음" : dots(r.none),
          r.down ? "예" : "아니오",
        ]),
      ),
      `${ids(pushed)} 에서는 ${clean ? "두 곳에 다 있는 자리도 어디에도 없는 자리도 없습니다" : "어긋난 자리가 있습니다"}. 꺼내는 걸음 ${ids(popping)} 에서는 ${onlyCurrent ? "지금 읽고 있는 자리 하나만 아직 어디에도 없습니다" : "지금 자리 말고도 어긋난 자리가 있습니다"}.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const edges: [string, number[], string][] = [
      ["N = 1", [5], "넣기만 하고 순회가 끝난다"],
      ["N = 2 증가", [1, 2], "두 번째 자리를 읽을 때 첫 자리를 꺼낸다"],
      ["N = 2 감소", [2, 1], "아무것도 안 꺼낸다"],
      ["값이 전부 같다", [5, 5, 5], "조건 `>=` 가 늘 참이라 한 번도 안 꺼낸다"],
      ["감소 수열", [4, 3, 2, 1], "위와 같은 갈래로 전부 남는다"],
      ["음수만 있다", [-3, -2, -1], "값의 부호는 비교에 쓰이지 않는다"],
      ["최댓값이 맨 앞", [9, 1, 5, 2], "첫 자리가 끝까지 남는다"],
    ];
    return md(
      ["입력", "배열", "처리되는 자리", "결과"],
      edges.map(([name, xs, how]) => [
        name,
        show(xs),
        how,
        show(nextGreaterElement([...xs])),
      ]),
    );
  },

  /** `invariant` ③ — 꺼내는 조건을 느슨하게 바꾸면. */
  "mutant-loose-compare": () =>
    mutantBlock(
      [[5, 5, 5], [...WALK], [1, 2, 3, 4], [4, 3, 2, 1]],
      looseCompare,
      "같은 값도 꺼내는 코드",
    ),

  /** `invariant` ③ — 느슨한 조건에서 자리 0 이 언제 꺼내지는가. */
  "mutant-loose-trace": () => {
    const good = popsPerRead({ nextGreaterElement }, WALK, (t, c) => t < c);
    const bad = popsPerRead(looseCompare, WALK, (t, c) => t <= c);
    const when = (xs: { i: number; popped: number[] }[]) =>
      xs.find((x) => x.popped.includes(0));
    const say = (x: { i: number } | undefined) =>
      x ? `자리 ${x.i} 의 ${v(x.i)}${을를(v(x.i))} 읽을 때` : "끝까지 남았다";
    return md(
      ["코드", "자리 0 을 꺼낸 때", "자리 0 의 답"],
      [
        [
          "바른 조건 — 같으면 멈춘다",
          say(when(good)),
          String(nextGreaterElement([...WALK])[0]),
        ],
        [
          "느슨한 조건 — 같아도 꺼낸다",
          say(when(bad)),
          String(looseCompare.nextGreaterElement([...WALK])[0]),
        ],
      ],
    );
  },

  /** `perf.derive` — 전개가 갈래마다 몇 번 접근했는가. */
  "walk-cost": () => {
    const c = count(WALK);
    const n = WALK.length;
    const s = scanRight(WALK);
    if (3 * n + 3 * c.pops + 2 * c.stops !== c.acc) {
      throw new Error("3N + 3P + 2B 가 실측 접근 수와 다르다");
    }
    const rows = [
      ["답 없음을 깐다 ①", "T1 앞", "N", num(n)],
      [
        "지금 값을 읽는다",
        idsOf((t) => t.kind !== "end" && firstOfI(t)),
        "N",
        num(n),
      ],
      [
        "꼭대기와 비교한다 ②",
        idsOf((t) => t.kind === "stop" || t.kind === "pop"),
        "2(P + B)",
        num(2 * c.cmp),
      ],
      ["답을 적는다 ③", idsOf((t) => t.kind === "pop"), "P", num(c.pops)],
      [
        "자리를 넣는다 ④",
        idsOf((t) => t.kind === "push" || t.kind === "stop"),
        "N",
        num(n),
      ],
      ["남은 자리를 그대로 둔다 ⑤", idsOf((t) => t.kind === "end"), "0", "0"],
      ["합", "", "3N + 3P + 2B", num(c.acc)],
    ];
    return block(
      md(["갈래", "걸음", "식", "칸 접근"], rows, [3]),
      `전개는 N = ${n} · P = ${c.pops} · B = ${c.stops} 이라 식에 넣으면 ${3 * n} + ${3 * c.pops} + ${2 * c.stops} = ${c.acc} 번입니다. 같은 입력을 자리마다 오른쪽을 차례로 읽어 처리하면 ${s.acc} 번입니다.`,
    );
  },

  /** `perf.derive` — 과제 규모에서 가장 적은 입력 · 가장 많은 입력 · 평균. */
  "perf-scale": () => {
    const n = TASK_N;
    const least = count(decreasing(n));
    const most = count(worstShape(n));
    const h = harmonic(n);
    return block(
      md(
        ["입력", "P", "B", "칸 접근"],
        [
          ["감소 수열", num(least.pops), num(least.stops), num(least.acc)],
          [
            "두 번째로 큰 값이 맨 앞 · 가운데 증가 · 가장 큰 값이 맨 뒤",
            num(most.pops),
            num(most.stops),
            num(most.acc),
          ],
          [
            "값이 모두 다르고 모든 순서가 같은 확률(평균)",
            "N − H_N",
            "N − H_N",
            num(Math.round((8 * n - 5 * h) * 10) / 10),
          ],
        ],
        [1, 2, 3],
      ),
      `N = ${num(n)} 에서 위 두 줄은 실제로 세었고, 셋째 줄은 식 8N − 5·H_N 에 넣은 값입니다. 첫 줄의 실측은 5N − 2 = ${num(stackBest(n))}${과와(num(stackBest(n)))} 같고, 둘째 줄의 실측은 8N − 7 = ${num(8 * n - 7)}${과와(num(8 * n - 7))} 같습니다. 단순 연산 1 초에 1 억 번으로 잡으면 가장 많은 줄도 ${(most.acc / OPS_PER_SECOND).toFixed(3)} 초입니다.`,
    );
  },

  /** `perf.worst` — 입력의 모양이 접근 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const n = BIG_N;
    const shapes: [string, number[]][] = [
      ["감소 수열", decreasing(n)],
      ["전부 같은 값", Array.from({ length: n }, () => 7)],
      ["nums[i] = (7919 i) mod 1009", [...BIG]],
      ["증가 수열", Array.from({ length: n }, (_, i) => i)],
      [
        "두 번째로 큰 값이 맨 앞 · 가운데 증가 · 가장 큰 값이 맨 뒤",
        worstShape(n),
      ],
    ];
    const counted = shapes.map(([name, xs]) => ({ name, c: count(xs) }));
    let over = 0;
    let top = 0;
    for (let m = 2; m <= 8; m++) {
      eachPermutation(m, (xs) => {
        const a = count(xs).acc;
        if (a > 8 * m - 7) over++;
        if (m === 8 && a > top) top = a;
      });
    }
    const most = Math.max(...counted.map(({ c }) => c.acc));
    return block(
      md(
        [
          "입력의 모양",
          "꺼낸 횟수 P",
          "멈춘 걸음 B",
          "남은 자리 S",
          "3N + 3P + 2B",
          "실측 칸 접근",
        ],
        counted.map(({ name, c }) => [
          name,
          num(c.pops),
          num(c.stops),
          num(c.left),
          num(3 * n + 3 * c.pops + 2 * c.stops),
          num(c.acc),
        ]),
        [1, 2, 3, 4, 5],
      ),
      `N = ${num(n)} 에서 가장 많은 것은 ${num(most)} 번이고 8N − 7 = ${num(8 * n - 7)}${과와(num(8 * n - 7))} 같습니다. 길이 2~8 순열을 전부 넣어 8N − 7 을 넘는 입력을 찾았고, 찾은 입력은 ${over} 개입니다. 길이 8 의 최댓값은 ${top} = 8·8 − 7 입니다.`,
    );
  },

  /** `perf.worst` — 최악 입력을 N = 8 로 적어 자리마다 무엇을 하는지. */
  "worst-n8": () => {
    const xs = worstShape(8);
    const steps = walkOf(xs);
    const c = count(xs);
    return block(
      md(
        ["읽은 자리", "꺼낸 자리", "멈춘 꼭대기"],
        xs.map((x, i) => {
          const here = steps.filter((s) => s.kind !== "end" && s.i === i);
          const popped = here
            .filter((s) => s.kind === "pop")
            .map((s) => s.top as number);
          const stop = here.find((s) => s.kind === "stop");
          return [
            `${i} · 값 ${x}`,
            popped.length === 0 ? "없음" : dots(popped),
            stop ? `자리 ${stop.top} · 값 ${xs[stop.top as number]}` : "없음",
          ];
        }),
      ),
      `입력은 ${show(xs)} 입니다. 꺼낸 횟수 P = ${c.pops} = N − 1 이고, 멈춘 걸음 B = ${c.stops} = N − 2 입니다. 칸 접근은 ${c.acc} = 8·8 − 7 번입니다.`,
    );
  },

  /** `selfcheck` — 자리 0 이 자리 2 를 지나 자리 3 까지 기다린 까닭. */
  "selfcheck-zero-waited": () => {
    const out = lifeOf(WALK_STEPS, 0).out as WalkStep;
    return md(
      ["자리 0 뒤에 읽은 값", "그 값 > 2", "자리 0 꺼냄"],
      [1, 2, 3].map((p) => [
        `자리 ${p} 의 ${v(p)}`,
        `\`${v(p)} > ${v(0)}\` ${v(p) > v(0) ? "참" : "거짓"}`,
        p === out.i ? `예 · ${out.id}` : "아니오",
      ]),
    );
  },
};
