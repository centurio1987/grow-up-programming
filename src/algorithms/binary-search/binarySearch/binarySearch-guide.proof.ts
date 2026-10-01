/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/binary-search/binarySearch/binarySearch-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases } from "./binarySearch-guide.alt.ts";
import {
  A6,
  firstCellReads,
  HIT,
  MISS,
  N,
  Q,
  type Round,
  scale,
  secondsOf,
  trace,
} from "./binarySearch-guide.fig.tsx";
import { binarySearch } from "./binarySearch-guide.ref.ts";

const REF = new URL("./binarySearch-guide.ref.ts", import.meta.url).pathname;

/* ───────────────────────── 표 그리기 ───────────────────────── */

const num = (x: number): string => x.toLocaleString("en-US");

/** `[1 3 5 7 9 11]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

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

const branchMark = { eq: "①", lt: "②", gt: "③" } as const;

/** 읽는 자리만 바꾼 절차. 갱신 규칙은 정본과 같다. */
type Spot = (lo: number, hi: number) => number;

function countWith(A: readonly number[], target: number, spot: Spot): number {
  let lo = 0;
  let hi = A.length - 1;
  let count = 0;
  while (lo <= hi) {
    const mid = spot(lo, hi);
    count++;
    if (A[mid] === target) return count;
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  return count;
}

/** 배열의 값과 그 사이·바깥의 없는 값까지 전부 넣어 본다. */
function allTargets(A: readonly number[]): number[] {
  const out: number[] = [];
  for (
    let v = (A[0] as number) - 2;
    v <= (A[A.length - 1] as number) + 2;
    v++
  ) {
    out.push(v);
  }
  return out;
}

const SPOTS: [string, Spot][] = [
  ["첫 칸", (lo) => lo],
  ["1/4 지점", (lo, hi) => lo + Math.floor((hi - lo) / 4)],
  ["가운데", (lo, hi) => lo + Math.floor((hi - lo) / 2)],
  ["마지막 칸", (_lo, hi) => hi],
];

const ARRAYS: [string, number[]][] = [
  ["n = 6", A6],
  ["n = 15", Array.from({ length: 15 }, (_, i) => (i + 1) * 2)],
  ["n = 63", Array.from({ length: 63 }, (_, i) => (i + 1) * 2)],
];

// 「가운데」 줄은 정본이 실제로 읽는 횟수와 같아야 한다. 아니면 이 표가 다른 절차를 잰 것이다.
for (const [, A] of ARRAYS) {
  for (const t of allTargets(A)) {
    const byRule = countWith(A, t, SPOTS[2]?.[1] as Spot);
    if (byRule !== trace(A, t).rounds.length) {
      throw new Error(`가운데 규칙이 정본과 어긋난다 — ${show(A)} target ${t}`);
    }
  }
}

/* ───────── 「아이디어를 떠올리는 과정」 ───────── */

/** 길이 `N` 배열에서 두 방법의 최악 비교 — 조회 하나는 실제로 세고, 조회 `Q` 번은 곱한다. */
function originCost(): string {
  const s = scale();
  const rows = [1, Q].map((q) => [
    num(q),
    num(s.linear * q),
    num(s.middle * q),
    secondsOf(s.linear * q),
  ]);
  return [
    md(
      [
        "조회 횟수",
        "선형 탐색의 비교",
        "가운데를 읽는 절차의 비교",
        "선형 탐색 시간(초당 1 억 번)",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `길이 ${num(N)} 인 배열 \`A[i] = 2i\` 에서 조회 하나의 최악을 실제로 세었고, 조회 ${num(Q)} 번은 그 값에 ${num(Q)}${을를(num(Q))} 곱했습니다.`,
  ].join("\n");
}

/** 남은 후보의 첫 칸을 읽는 절차의 자취. 답은 정본과 대조한다. */
function firstCellTrace(
  A: readonly number[],
  target: number,
): { lo: number; hi: number; mid: number }[] {
  const out: { lo: number; hi: number; mid: number }[] = [];
  let lo = 0;
  let hi = A.length - 1;
  let answer = -1;
  while (lo <= hi) {
    const mid = lo;
    out.push({ lo, hi, mid });
    if (A[mid] === target) {
      answer = mid;
      break;
    }
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  if (answer !== binarySearch([...A], target)) {
    throw new Error("첫 칸을 읽는 절차가 정본과 다른 답을 냈다");
  }
  if (out.length !== firstCellReads(A, target)) {
    throw new Error("첫 칸을 읽는 절차의 읽은 칸 수가 어긋난다");
  }
  return out;
}

/** 같은 입력(없는 값 12)을 두 방식으로 처리한 자취를 나란히. */
function firstVsMiddle(): string {
  const target = 12;
  const cell = (
    r: { lo: number; hi: number; mid: number } | undefined,
  ): string => {
    if (r === undefined) return "—";
    const v = A6[r.mid] as number;
    const [lo, hi] = target < v ? [r.lo, r.mid - 1] : [r.mid + 1, r.hi];
    const shown =
      v === target
        ? "답"
        : (lo as number) > (hi as number)
          ? "후보가 빈다"
          : `[${lo},${hi}]`;
    const sign = v < target ? "<" : v > target ? ">" : "=";
    return `[${r.lo},${r.hi}] 에서 A[${r.mid}] = ${v} ${sign} ${target} → ${shown}`;
  };
  const first = firstCellTrace(A6, target);
  const middle = trace(A6, target).rounds;
  const rows = Array.from(
    { length: Math.max(first.length, middle.length) },
    (_, i) => [String(i + 1), cell(first[i]), cell(middle[i])],
  );
  const a = binarySearch([...A6], target);
  return [
    md(["읽은 횟수", "첫 칸을 읽는 쪽", "가운데를 읽는 쪽"], rows, [0]),
    "",
    `첫 칸을 읽는 쪽은 ${first.length} 번, 가운데를 읽는 쪽은 ${middle.length} 번 읽었고, 답은 둘 다 ${a} 입니다.`,
  ].join("\n");
}

/* ───────── 「아이디어 상세」 ───────── */

/** 실제로 지나간 후보 구간에서 mid 가 어디 놓이는가 — 있는 값 7 과 없는 값 2 를 찾은 자취. */
function buildMid(): string {
  const seen = new Set<string>();
  const rounds: Round[] = [];
  for (const t of [HIT, 2]) {
    for (const r of trace(A6, t).rounds) {
      const key = `${r.lo},${r.hi}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rounds.push(r);
    }
  }
  const rows = rounds.map((r) => [
    `[${r.lo},${r.hi}]`,
    String(r.hi - r.lo + 1),
    String(r.mid),
    String(r.mid - r.lo),
    String(r.hi - r.mid),
  ]);
  const atLeft = rounds.filter((r) => r.mid === r.lo && r.hi > r.lo);
  const sizes = [...new Set(atLeft.map((r) => r.hi - r.lo + 1))];
  return [
    md(
      ["후보", "후보 수", "mid", "mid 왼쪽에 남는 칸", "mid 오른쪽에 남는 칸"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `왼쪽과 오른쪽의 칸 수는 많아야 1 차이이고, 후보가 ${sizes.join(" · ")} 개일 때 mid 가 왼쪽 끝 lo 와 같습니다.`,
  ].join("\n");
}

/** 후보가 둘에서 비기까지 — 없는 값 2 를 찾는 자취. */
function buildShrink(): string {
  const target = 2;
  const t = trace(A6, target);
  const rows = t.rounds.map((r) => {
    const lo = r.branch === "gt" ? r.mid + 1 : r.lo;
    const hi = r.branch === "lt" ? r.mid - 1 : r.hi;
    const sign = r.branch === "lt" ? "<" : ">";
    return [
      `[${r.lo},${r.hi}]`,
      String(r.mid),
      String(r.value),
      `${target} ${sign} ${r.value} → ${branchMark[r.branch]}`,
      `[${lo},${hi}]`,
      String(Math.max(0, hi - lo + 1)),
    ];
  });
  return [
    md(
      ["후보", "mid", "A[mid]", "비교", "새 후보", "새 후보 수"],
      rows,
      [1, 2, 5],
    ),
    "",
    `마지막 줄에서 hi = ${t.end.hi}${이가(t.end.hi)} lo = ${t.end.lo} 보다 작아지고, 반복 조건 \`lo <= hi\` 가 거짓이 되어 ${t.result}${이가(t.result)} 나옵니다.`,
  ].join("\n");
}

/** 읽는 자리를 네 가지로 두고 실제로 세었을 때의 최악 비교 횟수. */
function spotChoice(): string {
  const worst = (A: number[], spot: Spot) =>
    Math.max(...allTargets(A).map((t) => countWith(A, t, spot)));
  const rows = SPOTS.map(([name, spot]) => [
    name,
    ...ARRAYS.map(([, A]) => String(worst(A, spot))),
  ]);
  const logs = ARRAYS.map(([, A]) => Math.floor(Math.log2(A.length)) + 1);
  rows.push(["⌊log₂ n⌋ + 1", ...logs.map(String)]);
  const middleIsLog = ARRAYS.every(
    ([, A], i) => worst(A, SPOTS[2]?.[1] as Spot) === logs[i],
  );
  return [
    md(["읽는 자리", ...ARRAYS.map(([n]) => n)], rows, [1, 2, 3]),
    "",
    middleIsLog
      ? "가운데를 읽는 줄이 세 배열 모두에서 가장 작고, 그 값이 ⌊log₂ n⌋ + 1 줄의 값과 하나하나 일치합니다."
      : "가운데를 읽는 줄이 ⌊log₂ n⌋ + 1 줄의 값과 한 곳 이상에서 일치하지 않습니다.",
  ].join("\n");
}

/** 후보 6 개에서 k 번째 칸을 한 번 읽었을 때 최악에 남는 후보 수 — 모든 target 을 넣어 센다. */
function spotRemain(): string {
  const m = A6.length;
  const rows: string[][] = [];
  const worstOf: number[] = [];
  for (let k = 1; k <= m; k++) {
    const mid = k - 1;
    const v = A6[mid] as number;
    let worst = 0;
    for (const t of allTargets(A6)) {
      const [lo, hi] =
        v === t ? [0, -1] : t < v ? [0, mid - 1] : [mid + 1, m - 1];
      worst = Math.max(worst, (hi as number) - (lo as number) + 1);
    }
    worstOf.push(worst);
    rows.push([String(k), String(k - 1), String(m - k), String(worst)]);
  }
  const best = Math.min(...worstOf);
  const at = worstOf.flatMap((w, i) => (w === best ? [i + 1] : []));
  return [
    md(
      ["읽는 칸 k", "왼쪽 칸 k − 1", `오른쪽 칸 ${m} − k`, "최악에 남는 후보"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `최악에 남는 후보는 k = ${at.join(" · ")} 에서 ${best} 개로 가장 적습니다.`,
  ].join("\n");
}

/* ───────── 「수행으로 알아보는 알고리즘」 ───────── */

/** T1~T7 — 있는 값 7 을 찾는 걸음. 조건의 참/거짓은 정본이 읽은 값으로 적는다. */
function walkTraceHit(): string {
  const t = trace(A6, HIT);
  const first = t.rounds[0] as Round;
  const rows: string[][] = [
    [
      "T1",
      "후보를 배열 전체로",
      `lo = ${first.lo}, hi = ${first.hi}`,
      String(first.lo),
      String(first.hi),
      String(first.hi - first.lo + 1),
    ],
  ];
  let n = 2;
  for (const r of t.rounds) {
    rows.push([
      `T${n++}`,
      "반복 진입, 가운데 계산",
      `\`${r.lo} <= ${r.hi}\`${이가(r.hi)} **참**, mid = ${r.mid}`,
      String(r.lo),
      String(r.hi),
      String(r.hi - r.lo + 1),
    ]);
    const lo = r.branch === "gt" ? r.mid + 1 : r.lo;
    const hi = r.branch === "lt" ? r.mid - 1 : r.hi;
    const cond =
      r.branch === "eq"
        ? `\`${r.value} === ${HIT}\`${이가(HIT)} **참** → ①`
        : r.branch === "lt"
          ? `\`${r.value} === ${HIT}\` **거짓**, \`${HIT} < ${r.value}\` **참** → ②`
          : `\`${r.value} === ${HIT}\` **거짓**, \`${HIT} < ${r.value}\` **거짓** → ③`;
    rows.push([
      `T${n++}`,
      `\`A[${r.mid}] = ${r.value}\`${을를(r.value)} 읽는다`,
      cond,
      String(lo),
      String(hi),
      String(hi - lo + 1),
    ]);
  }
  return md(
    ["단계", "하는 일", "조건 판정", "lo", "hi", "후보 수"],
    rows,
    [3, 4, 5],
  );
}

/** T8~T11 — 없는 값 4 를 찾는 걸음. */
function walkTraceMiss(): string {
  const t = trace(A6, MISS);
  let n = 2 + 2 * trace(A6, HIT).rounds.length;
  const rows: string[][] = t.rounds.map((r) => {
    const lo = r.branch === "gt" ? r.mid + 1 : r.lo;
    const hi = r.branch === "lt" ? r.mid - 1 : r.hi;
    const truth = r.branch === "lt" ? "**참**" : "**거짓**";
    return [
      `T${n++}`,
      `후보 [${r.lo},${r.hi}] 에서 \`A[${r.mid}] = ${r.value}\`${을를(r.value)} 읽는다`,
      `\`${MISS} < ${r.value}\` ${truth} → ${branchMark[r.branch]}`,
      String(lo),
      String(hi),
      String(Math.max(0, hi - lo + 1)),
    ];
  });
  rows.push([
    `T${n++}`,
    "반복 조건을 본다",
    `\`${t.end.lo} <= ${t.end.hi}\`${이가(t.end.hi)} **거짓** → \`${t.result}\` 반환`,
    String(t.end.lo),
    String(t.end.hi),
    "0",
  ]);
  return md(
    ["단계", "하는 일", "조건 판정", "lo", "hi", "후보 수"],
    rows,
    [3, 4, 5],
  );
}

/* ───────── 짚고 가기 둘 ───────── */

const DUPES: [number[], number][] = [
  [[1, 3, 3, 3, 3, 5], 3],
  [[3, 3, 3, 3], 3],
  [[2, 4, 4, 6], 4],
];

function duplicateTable(): string {
  const rows = DUPES.map(([A, t]) => ({
    A,
    t,
    got: binarySearch([...A], t),
    left: A.indexOf(t),
  }));
  const differ = rows.filter((r) => r.got !== r.left).length;
  return [
    md(
      ["배열", "target", "이 코드가 준 인덱스", "가장 왼쪽 인덱스"],
      rows.map((r) => [show(r.A), String(r.t), String(r.got), String(r.left)]),
      [1, 2, 3],
    ),
    "",
    `세 벌 중 ${differ} 벌에서 이 코드가 준 인덱스가 가장 왼쪽 인덱스가 아닙니다.`,
  ].join("\n");
}

const UNSORTED: [number[], number][] = [
  [[5, 1, 3], 5],
  [[3, 1, 2], 2],
  [[9, 7, 5, 3, 1], 1],
];

function unsortedTable(): string {
  const rows = UNSORTED.map(([A, t]) => ({
    A,
    t,
    got: binarySearch([...A], t),
    real: A.indexOf(t),
  }));
  const same = rows.filter((r) => r.got === r.real).length;
  return [
    md(
      ["배열", "target", "이 코드의 답", "실제 인덱스"],
      rows.map((r) => [show(r.A), String(r.t), String(r.got), String(r.real)]),
      [1, 2, 3],
    ),
    "",
    `예외는 나지 않습니다. 세 벌 중 ${same} 벌만 우연히 실제 인덱스가 나옵니다.`,
  ].join("\n");
}

/** 정렬되지 않은 `[5 1 3]` 에서 5 를 찾는 자취 — 3단계의 근거가 거짓인 입력. */
function unsortedTrace(): string {
  const A = [5, 1, 3];
  const target = 5;
  const t = trace(A, target);
  const rows = t.rounds.map((r) => {
    const lo = r.branch === "gt" ? r.mid + 1 : r.lo;
    const hi = r.branch === "lt" ? r.mid - 1 : r.hi;
    const truth = r.branch === "lt" ? "참" : "거짓";
    return [
      `[${r.lo},${r.hi}]`,
      String(r.mid),
      String(r.value),
      `${target} < ${r.value} ${truth} → ${branchMark[r.branch]}`,
      lo > hi ? "후보가 빈다" : `[${lo},${hi}]`,
    ];
  });
  return [
    md(["후보", "mid", "A[mid]", "비교", "새 후보"], rows, [1, 2]),
    "",
    `정본은 ${t.result}${을를(t.result)} 돌려주지만 5 는 인덱스 ${A.indexOf(target)} 에 있습니다.`,
  ].join("\n");
}

/* ───────── 「알아 두면 좋은 개념」 ───────── */

function relatedPredicate(): string {
  const idx = A6.map((_, k) => String(k));
  const truth = A6.map((v) => (v < HIT ? "참" : "거짓"));
  const boundary = A6.findIndex((v) => !(v < HIT));
  const found = binarySearch([...A6], HIT);
  return [
    md(
      ["인덱스 k", ...idx],
      [
        ["A[k]", ...A6.map(String)],
        [`A[k] < ${HIT}`, ...truth],
      ],
      idx.map((_, i) => i + 1),
    ),
    "",
    `참이 거짓으로 바뀌는 첫 인덱스는 ${boundary}${josa(boundary, "이고", "고")}, 정본이 ${HIT}${을를(HIT)} 찾아 돌려준 인덱스도 ${found} 입니다.`,
  ].join("\n");
}

/* ───────── 파트 2 ───────── */

/** 닫힌 형태와 정본이 실제로 읽은 최악 — 네 배열 크기에서. */
function mathClosed(): string {
  const rows = ARRAYS.map(([, A]) => [
    num(A.length),
    String(Math.floor(Math.log2(A.length)) + 1),
    String(Math.max(...allTargets(A).map((t) => trace(A, t).rounds.length))),
  ]);
  rows.push([
    num(N),
    String(Math.floor(Math.log2(N)) + 1),
    String(scale().middle),
  ]);
  return md(["n", "⌊log₂ n⌋ + 1", "정본이 실제로 읽은 최악"], rows, [0, 1, 2]);
}

/** 여섯 값을 하나씩 찾을 때의 비교 횟수 — 평균과 최악. */
function perfAverage(): string {
  const counts = A6.map((v) => trace(A6, v).rounds.length);
  const sum = counts.reduce((a, b) => a + b, 0);
  return [
    md(
      ["찾는 값", ...A6.map(String)],
      [["비교 횟수", ...counts.map(String)]],
      A6.map((_, i) => i + 1),
    ),
    "",
    `합은 ${sum} 번이고 평균 ${(sum / counts.length).toFixed(2)} 번, 최악 ${Math.max(...counts)} 번입니다.`,
  ].join("\n");
}

/** 어떤 target 이 최악 비교 횟수를 내는가. */
function targetTable(): string {
  const groups = new Map<number, number[]>();
  const all = allTargets(A6);
  for (const t of all) {
    const c = trace(A6, t).rounds.length;
    groups.set(c, [...(groups.get(c) ?? []), t]);
  }
  const keys = [...groups.keys()].sort((a, b) => a - b);
  const worst = keys[keys.length - 1] as number;
  const atWorst = (groups.get(worst) as number[]).length;
  return [
    md(
      ["비교 횟수", "target", "개수"],
      keys.map((k) => [
        `${k} 번`,
        (groups.get(k) as number[]).join(" · "),
        String((groups.get(k) as number[]).length),
      ]),
      [0, 2],
    ),
    "",
    `${show(A6)} 에 target 을 ${all[0]} 부터 ${all[all.length - 1]} 까지 ${all.length} 개 넣었고, 가장 많은 ${worst} 번이 ${atWorst} 개입니다.`,
  ].join("\n");
}

/* ───────── 불변식을 지키던 줄을 한 칸 더 버리게 바꾸면 ───────── */

/**
 * `hi = mid - 1` 을 `hi = mid - 2` 로 바꾼 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const broken = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, { swap: [/^(\s*)hi = mid - 1;$/, "$1hi = mid - 2;"] });

const MUTANT_CASES: [number[], number][] = [
  [[1, 3, 5, 7, 9, 11], 3],
  [[1, 3, 5, 7, 9, 11], 7],
  [[-10, -5, 0, 5, 10], -5],
];

function mutantTable(): string {
  const rows = MUTANT_CASES.map(([A, t]) => ({
    A,
    t,
    correct: binarySearch([...A], t),
    broken: broken.binarySearch([...A], t),
  }));
  // 중화 실행에서는 변이 모듈이 정본 그대로라 이 검사를 건너뛴다(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
  const neutral = broken.binarySearch === binarySearch;
  if (!neutral && rows.every((r) => r.correct === r.broken)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
  const wrong = rows.filter((r) => r.correct !== r.broken).length;
  return [
    md(
      ["배열", "target", "바른 코드", "hi = mid - 2 로 적은 코드"],
      rows.map((r) => [
        show(r.A),
        String(r.t),
        String(r.correct),
        String(r.broken),
      ]),
      [1, 2, 3],
    ),
    "",
    wrong === rows.length
      ? "세 벌 다 답이 틀립니다."
      : `세 벌 중 ${wrong} 벌에서 답이 틀립니다.`,
  ].join("\n");
}

/* ───────── 짧은 실행 결과 — 전개·불변식·수식·점검의 등폭 펜스 ───────── */

/** 한글을 두 칸으로 세는 폭. 등폭 펜스의 열을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/**
 * 후보 구간을 정한 직후의 `lo` · `hi` 를 기록하는 사본. **정본 소스에서 기계로 만든다** —
 * `let hi = A.length - 1;` 한 줄 뒤에 기록을 끼운다.
 */
const initProbe = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, {
  swap: [
    /^(\s*)let hi = A\.length - 1;$/,
    "$1let hi = A.length - 1;\n$1(globalThis as any).__init?.(lo, hi);",
  ],
});

function initOf(A: number[]): { lo: number; hi: number } {
  const g = globalThis as unknown as {
    __init?: (lo: number, hi: number) => void;
  };
  let got: { lo: number; hi: number } | undefined;
  g.__init = (lo, hi) => {
    got = { lo, hi };
  };
  initProbe.binarySearch([...A], 1);
  g.__init = undefined;
  if (got === undefined) throw new Error("초기 구간을 기록하지 못했다");
  return got;
}

/** walk 1 — 두 줄만 실행했을 때의 후보 구간. */
function walkInit(): string {
  const rows = [A6, [] as number[]].map((A) => ({ A, ...initOf(A) }));
  const left = rows.map((r) => `A = ${show(r.A)}`);
  const wl = Math.max(...left.map(width));
  const lines = rows.map((r, i) => {
    const m = Math.max(0, r.hi - r.lo + 1);
    return `${pad(left[i] as string, wl)}   →   lo = ${r.lo}, hi = ${r.hi},${r.hi >= 0 ? " " : ""} 후보 ${m} 개`;
  });
  const empty = rows[1] as { lo: number; hi: number };
  if (empty.lo <= empty.hi)
    throw new Error("빈 배열의 후보 구간이 비지 않았다");
  if (trace([], 1).rounds.length !== 0) {
    throw new Error("빈 배열에서 반복에 들어갔다");
  }
  lines.push(
    `${" ".repeat(wl + 7)}└ lo <= hi 가 처음부터 거짓이라 아래 반복에 들어가지 않는다`,
  );
  return lines.join("\n");
}

/** walk 2 — 정본이 실제로 고른 mid 와 `(lo + hi) / 2` 를 나란히. */
function walkMid(): string {
  const rounds = trace(A6, HIT).rounds;
  const lines = rounds.map((r) => {
    const naive = Math.floor((r.lo + r.hi) / 2);
    const half = Math.floor((r.hi - r.lo) / 2);
    const left = `lo = ${r.lo}, hi = ${r.hi}   →  ${r.lo} + ⌊(${r.hi}-${r.lo})/2⌋ = ${r.lo} + ${half} = ${r.mid}`;
    return `${pad(left, 51)}(lo+hi)/2 = ⌊${r.lo + r.hi}/2⌋ = ${naive}`;
  });
  const same = rounds.every((r) => r.mid === Math.floor((r.lo + r.hi) / 2));
  lines.push(
    same
      ? `                    └ ${rounds.length} 자리 모두 같다. 이 규모에서는 어느 쪽으로 적어도 답이 같다`
      : "                    └ 두 식이 한 자리 이상에서 갈린다",
  );
  return lines.join("\n");
}

/* 갱신 줄을 바꾼 사본 둘 — 반복이 끝나지 않으므로 같은 상태가 두 번 나오면 멈춘다. */

type Update = "ref" | "lo=mid" | "hi=mid";

/** 기록을 끼운 갱신 줄 — 상태가 그대로면 `__step` 이 던져서 끝없는 반복을 끊는다. */
const STEP = "(globalThis as any).__step?.(lo, hi);";
const loStuck = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, { swap: [/^(\s*)lo = mid \+ 1;$/, `$1lo = mid; ${STEP}`] });
const hiStuck = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, { swap: [/^(\s*)hi = mid - 1;$/, `$1hi = mid; ${STEP}`] });

/** 바꾼 사본을 돌려 그 갈래가 만든 구간을 모은다. 같은 구간이 연달아 나오면 끊는다. */
function stuckRecords(
  mod: { binarySearch(A: number[], target: number): number },
  A: number[],
  target: number,
): { lo: number; hi: number }[] {
  const g = globalThis as unknown as {
    __step?: (lo: number, hi: number) => void;
  };
  const out: { lo: number; hi: number }[] = [];
  const STOP = new Error("stop");
  g.__step = (lo, hi) => {
    const last = out.at(-1);
    out.push({ lo, hi });
    if ((last && last.lo === lo && last.hi === hi) || out.length > 64) {
      throw STOP;
    }
  };
  try {
    mod.binarySearch([...A], target);
  } catch (e) {
    if (e !== STOP) throw e;
  } finally {
    g.__step = undefined;
  }
  return out;
}

interface Replay {
  readonly rounds: (Round & { next: { lo: number; hi: number } })[];
  /** 끝나지 않고 같은 상태로 돌아왔으면 `null`. */
  readonly result: number | null;
}

/**
 * 갱신 규칙만 골라 반복을 다시 따라간다. 정본 규칙(`ref`)은 계측 사본의 기록과, 바꾼 규칙은
 * 바꾼 사본이 그 갈래에서 남긴 기록과 대조한다 — 어긋나면 던진다.
 */
function replay(A: number[], target: number, rule: Update): Replay {
  const rounds: Replay["rounds"][number][] = [];
  let lo = 0;
  let hi = A.length - 1;
  let result: number | null = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const value = A[mid] as number;
    const branch =
      value === target ? "eq" : target < value ? "lt" : ("gt" as const);
    if (branch === "eq") {
      rounds.push({ lo, hi, mid, value, branch, next: { lo, hi } });
      result = mid;
      break;
    }
    const next =
      branch === "lt"
        ? { lo, hi: rule === "hi=mid" ? mid : mid - 1 }
        : { lo: rule === "lo=mid" ? mid : mid + 1, hi };
    rounds.push({ lo, hi, mid, value, branch, next });
    if (next.lo === lo && next.hi === hi) {
      result = null;
      break;
    }
    lo = next.lo;
    hi = next.hi;
  }
  if (rule === "ref") {
    const t = trace(A, target);
    const a = t.rounds.map((r) => `${r.lo},${r.hi},${r.mid}`).join(" ");
    const b = rounds.map((r) => `${r.lo},${r.hi},${r.mid}`).join(" ");
    if (a !== b || t.result !== result) {
      throw new Error("다시 따라간 반복이 정본 기록과 다르다");
    }
  } else {
    const mod = rule === "lo=mid" ? loStuck : hiStuck;
    const branch = rule === "lo=mid" ? "gt" : "lt";
    const want = rounds
      .filter((r) => r.branch === branch)
      .map((r) => `${r.next.lo},${r.next.hi}`);
    // 끝나지 않는 쪽은 같은 상태가 한 번 더 기록된 뒤 끊긴다.
    if (result === null) want.push(want.at(-1) as string);
    const got = stuckRecords(mod, A, target).map((r) => `${r.lo},${r.hi}`);
    if (want.join(" ") !== got.join(" ")) {
      throw new Error(`바꾼 사본의 기록이 다르다 — ${got} ≠ ${want}`);
    }
  }
  return { rounds, result };
}

/** walk 3 — 후보 [0,1] 에서 `lo = mid + 1` 과 `lo = mid` 의 다음 상태. */
function walkStepOne(): string {
  const target = 2;
  const good = replay(A6, target, "ref");
  const bad = replay(A6, target, "lo=mid");
  const at = good.rounds.find((r) => r.lo === 0 && r.hi === 1);
  const atBad = bad.rounds.find((r) => r.lo === 0 && r.hi === 1);
  if (!at || !atBad || at.branch !== "gt") {
    throw new Error("후보 [0,1] 에서 ③ 이 나오지 않았다");
  }
  const count = (s: { lo: number; hi: number }) => Math.max(0, s.hi - s.lo + 1);
  const stuck = bad.result === null;
  return [
    `후보 [0,1] 에서 mid = ${at.mid}, A[${at.mid}] = ${at.value} < ${target} 일 때`,
    "",
    `  lo = mid + 1 = ${at.next.lo}  →  후보 [${at.next.lo},${at.next.hi}]   ${count(at.next)} 개.  다음 바퀴가 다른 칸을 읽는다`,
    `  lo = mid     = ${atBad.next.lo}  →  후보 [${atBad.next.lo},${atBad.next.hi}]   ${count(atBad.next)} 개.  다음 바퀴가 같은 칸을 또 읽는다`,
    stuck
      ? "                        └ 상태가 그대로라 반복이 끝나지 않는다"
      : "                        └ 반복은 끝난다",
  ].join("\n");
}

/** 전체 코드 아래 — 정본에 네 입력을 넣은 답. */
function finalCalls(): string {
  const calls: [number[], number][] = [
    [A6, HIT],
    [A6, MISS],
    [[], 1],
    [[42], 42],
  ];
  const left = calls.map(([A, t]) => `binarySearch([${A.join(", ")}], ${t})`);
  const w = Math.max(...left.map(width));
  return calls
    .map(
      ([A, t], i) =>
        `${pad(left[i] as string, w)}   →   ${binarySearch([...A], t)}`,
    )
    .join("\n");
}

/** 후보 6 개에서 k 번째 칸을 읽고 최악에 남는 후보 — 모든 target 을 넣어 실제로 센다. */
function remainWorst(k: number): number {
  const m = A6.length;
  const mid = k - 1;
  const v = A6[mid] as number;
  let worst = 0;
  for (const t of allTargets(A6)) {
    const [lo, hi] =
      v === t ? [0, -1] : t < v ? [0, mid - 1] : [mid + 1, m - 1];
    worst = Math.max(worst, (hi as number) - (lo as number) + 1);
  }
  return worst;
}

const R = (n: number, k: number): number => Math.max(k - 1, n - k);

/** deep.math 검산 — 정의 R(6,k) 를 여섯 자리에 넣고, 실제로 센 값과 대조한다. */
function mathCheckR(): string {
  const n = A6.length;
  for (let k = 1; k <= n; k++) {
    if (R(n, k) !== remainWorst(k)) {
      throw new Error(`R(${n},${k}) 가 실제로 센 값과 다르다`);
    }
  }
  const cell = (k: number) =>
    `R(${n},${k}) = max(${k - 1},${n - k}) = ${R(n, k)}`;
  const half = n / 2;
  const lines: string[] = [];
  for (let k = 1; k <= half; k++) {
    lines.push(`${pad(cell(k), 27)}${cell(k + half)}`);
  }
  const min = Math.min(...Array.from({ length: n }, (_, i) => R(n, i + 1)));
  lines.push(
    `${" ".repeat(29)}└ 최솟값 ${min}. 파트 1 에서 후보 여섯 개를 실제로 세었을 때와 같다`,
  );
  return lines.join("\n");
}

/** deep.math 유도 — k 를 옮기며 두 항과 최댓값. */
function mathSweep(): string {
  const n = A6.length;
  const ks = Array.from({ length: n }, (_, i) => i + 1);
  const row = (label: string, xs: number[], note: string) =>
    `  ${pad(label, 6)}${xs.map((x) => String(x).padStart(4)).join("")}      ← ${note}`;
  return [
    `n = ${n} 에서 k 를 1 부터 ${n} 까지 옮기면`,
    row(
      "k-1",
      ks.map((k) => k - 1),
      "늘어난다",
    ),
    row(
      `${n}-k`,
      ks.map((k) => n - k),
      "줄어든다",
    ),
    row(
      "최댓값",
      ks.map((k) => R(n, k)),
      "두 줄이 만나는 자리가 가장 작다",
    ),
  ].join("\n");
}

/** deep.math — ⌈(m−1)/2⌉ 로 접은 자취가 정본이 없는 값 12 를 찾을 때 지난 후보 수와 같은가. */
function mathFold(): string {
  const n = A6.length;
  const folds: number[] = [n];
  while ((folds.at(-1) as number) > 0) {
    folds.push(Math.ceil(((folds.at(-1) as number) - 1) / 2));
  }
  const t = trace(A6, 12);
  const seen = [
    ...t.rounds.map((r) => r.hi - r.lo + 1),
    Math.max(0, t.end.hi - t.end.lo + 1),
  ];
  if (seen.join(",") !== folds.join(",")) {
    throw new Error(`접은 자취 ${folds} 가 정본의 후보 수 ${seen} 와 다르다`);
  }
  const steps = folds
    .slice(1)
    .map((m, i) => `⌈${(folds[i] as number) - 1}/2⌉ = ${m}`);
  return [
    `n = ${n} 에서 접으면   ${[String(n), ...steps].join(" → ")}`,
    `                    └ ${folds.length - 1} 번 접어서 후보가 빈다. C(${n}) = ${t.rounds.length} 이다`,
  ].join("\n");
}

/** 불변식 — 정본이 없는 값 12 를 찾을 때 바퀴마다 후보 수와 남는 쪽. */
function invariantShrink(): string {
  const t = trace(A6, 12);
  const lines = ["후보 수가 매 바퀴 주는 것을 값으로", ""];
  for (const [i, r] of t.rounds.entries()) {
    const m = r.hi - r.lo + 1;
    const l = r.mid - r.lo;
    const h = r.hi - r.mid;
    const most = Math.max(l, h);
    const head = i === 0 ? "가운데를 읽고 남는 것은 " : "";
    lines.push(
      `  m = ${m}  →  ${head}max(${l}, ${h}) = ${most}${most > 0 ? " 이하" : ""}`,
    );
  }
  lines.push(
    `  m = ${Math.max(0, t.end.hi - t.end.lo + 1)}  →  lo > hi.  반복 조건이 거짓이 된다`,
  );
  return lines.join("\n");
}

/** 점검 — T5 자리에서 `hi = mid - 1` 과 `hi = mid` 가 만드는 후보. */
function selfcheckT5(): string {
  const good = replay(A6, HIT, "ref");
  const bad = replay(A6, HIT, "hi=mid");
  const at = good.rounds.find(
    (r) => r.branch === "lt",
  ) as Replay["rounds"][number];
  const atBad = bad.rounds.find(
    (r) => r.branch === "lt",
  ) as Replay["rounds"][number];
  const head = `T5  후보 [${at.lo},${at.hi}]  mid = ${at.mid}   A[${at.mid}] = ${at.value} > ${HIT}   →  `;
  return [
    `${head}hi = mid - 1 = ${at.next.hi}     후보 [${at.next.lo},${at.next.hi}]`,
    `${" ".repeat(width(head))}hi = mid     = ${atBad.next.hi}  ← 이렇게 적었다면?`,
  ].join("\n");
}

/** 점검 답 — 없는 값 8 에서 두 규칙의 자취를 바퀴마다 나란히. */
function selfcheckMiss(): string {
  const target = 8;
  const cell = (s: Replay["rounds"][number] | undefined, r: Replay): string => {
    if (s === undefined) return "—";
    const cmp =
      s.branch === "lt" ? `${target} < ${s.value}` : `${s.value} < ${target}`;
    const upd = s.branch === "lt" ? `hi = ${s.next.hi}` : `lo = ${s.next.lo}`;
    const cand =
      s.next.lo > s.next.hi
        ? `후보가 빈다, ${r.result}`
        : `[${s.next.lo},${s.next.hi}]`;
    const repeat =
      s.next.lo === s.lo && s.next.hi === s.hi ? " (같은 상태)" : "";
    return `[${s.lo},${s.hi}] 에서 mid = ${s.mid}, ${cmp} → ${upd} → ${cand}${repeat}`;
  };
  const good = replay(A6, target, "ref");
  const bad = replay(A6, target, "hi=mid");
  if (good.result !== binarySearch([...A6], target)) {
    throw new Error("바른 규칙의 답이 정본과 다르다");
  }
  const n = Math.max(good.rounds.length, bad.rounds.length);
  const rows = Array.from({ length: n }, (_, i) => [
    String(i + 1),
    cell(good.rounds[i], good),
    cell(bad.rounds[i], bad),
  ]);
  return [
    `target = ${target} 을 넣으면 바퀴마다 이렇게 됩니다.`,
    "",
    md(["바퀴", "hi = mid - 1", "hi = mid"], rows, [0]),
    "",
    bad.result === null
      ? `\`hi = mid - 1\` 은 ${good.rounds.length} 바퀴 만에 ${good.result}${을를(String(good.result))} 내고, \`hi = mid\` 는 ${bad.rounds.length} 번째 바퀴에서 앞 바퀴와 같은 상태로 돌아와 반복이 끝나지 않습니다.`
      : "두 규칙 모두 반복이 끝납니다.",
  ].join("\n");
}

/* ───────── 남은 짧은 실행 결과 — 전개 입력 · 수식 코드 · 불변식 변이 · 비용 ───────── */

/** 전개 입력 — 끝에 나와야 할 값은 정본의 답이다. */
function walkInput(): string {
  return [
    `const A = [${A6.join(", ")}];`,
    `const target = ${HIT};`,
    `// 이 절이 끝나면 ${binarySearch([...A6], HIT)}${이가(binarySearch([...A6], HIT))} 나와야 한다`,
  ].join("\n");
}

/** 식을 그대로 옮긴 코드 — 주석의 값은 식을 실행해 받고, 정본이 실제로 센 최악과 대조한다. */
function mathCode(): string {
  const C = (n: number): number => (n <= 0 ? 0 : C(Math.ceil((n - 1) / 2)) + 1);
  const c6 = C(A6.length);
  const cN = C(N);
  const worst6 = Math.max(
    ...allTargets(A6).map((t) => trace(A6, t).rounds.length),
  );
  if (c6 !== worst6 || cN !== scale().middle) {
    throw new Error("C(n) 이 정본이 실제로 센 최악과 다르다");
  }
  if (R(A6.length, 3) !== remainWorst(3)) {
    throw new Error("R(6, 3) 이 실제로 센 값과 다르다");
  }
  return [
    "const R = (n: number, k: number): number => Math.max(k - 1, n - k);",
    "const C = (n: number): number => (n <= 0 ? 0 : C(Math.ceil((n - 1) / 2)) + 1);",
    "",
    `R(${A6.length}, 3); // → ${R(A6.length, 3)}`,
    `C(${A6.length}); // → ${c6}`,
    `C(1_000_000); // → ${cN}`,
  ].join("\n");
}

/** `hi = mid - 2` 가 첫 바퀴에 만든 구간을 기록하는 사본. */
const hiTwoProbe = await loadMutant<{
  binarySearch(A: number[], target: number): number;
}>(REF, { swap: [/^(\s*)hi = mid - 1;$/, `$1hi = mid - 2; ${STEP}`] });

/** 불변식 ③ — 3 을 찾는 첫 바퀴에서 두 코드가 만드는 후보. */
function invariantMutantStep(): string {
  const target = 3;
  const first = trace(A6, target).rounds[0] as Round;
  const second = trace(A6, target).rounds[1] as Round;
  const bad = stuckRecords(hiTwoProbe, A6, target)[0];
  if (first.branch !== "lt" || bad === undefined) {
    throw new Error("첫 바퀴에서 ② 가 나오지 않았다");
  }
  const at = A6.indexOf(target);
  const inGood = second.lo <= at && at <= second.hi;
  const inBad = bad.lo <= at && at <= bad.hi;
  return [
    `${show(A6)} 에서 ${target}${을를(target)} 찾는다.  mid = ${first.mid}, A[${first.mid}] = ${first.value} > ${target}`,
    "",
    `  hi = mid - 1 = ${second.hi}    후보 [${second.lo},${second.hi}]   ${inGood ? `${target} 이 있는 인덱스 ${at} 이 후보에 남는다` : `인덱스 ${at} 이 빠졌다`}`,
    `  hi = mid - 2 = ${bad.hi}    후보 [${bad.lo},${bad.hi}]   ${inBad ? `인덱스 ${at} 이 남는다` : `인덱스 ${at} 이 빠졌다`}`,
    `${" ".repeat(36)}└ 「있다면 후보 안에 있다」가 여기서 ${inBad ? "참으로 남는다" : "거짓이 된다"}`,
  ].join("\n");
}

/** perf.derive — T3 · T5 · T7 에서 한 비교와 후보 수. */
function perfDeriveHit(): string {
  const t = trace(A6, HIT);
  const lines = t.rounds.map((r, i) => {
    const after =
      r.branch === "eq"
        ? "답을 찾았다"
        : `후보 ${r.hi - r.lo + 1} → ${(t.rounds[i + 1] as Round).hi - (t.rounds[i + 1] as Round).lo + 1}`;
    const left = `T${3 + 2 * i}  A[${r.mid}]${을를(r.mid)} 읽고 ${HIT}${과와(HIT)} 비교`;
    return `${pad(left, 30)}비교 1 번    ${after}`;
  });
  lines.push(`${" ".repeat(30)}└ 합 ${t.rounds.length} 번`);
  return lines.join("\n");
}

/** perf.derive — 후보 수가 접히는 자취(없는 값 12)와 바퀴마다의 비교. */
function perfDeriveFold(): string {
  const t = trace(A6, 12);
  const counts = [
    ...t.rounds.map((r) => r.hi - r.lo + 1),
    Math.max(0, t.end.hi - t.end.lo + 1),
  ];
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] !== Math.ceil(((counts[i - 1] as number) - 1) / 2)) {
      throw new Error(`후보 수 ${counts} 가 ⌈(m-1)/2⌉ 로 접히지 않는다`);
    }
  }
  const col = (xs: string[]) =>
    xs
      .map((x) => x.padEnd(8))
      .join("")
      .trimEnd();
  return [
    `후보 수     ${col(counts.map(String))}`,
    `비교        ${col(["", ...t.rounds.map(() => "1")]).replace(/^ {4}/, "")}`,
    "                └ 후보 수가 ⌈(m-1)/2⌉ 로 접힐 때마다 비교가 한 번 는다",
  ].join("\n");
}

/** 불변식 ② — 경계에 있는 입력 일곱. 처리 자취와 결과를 정본 실행에서 받는다. */
function invariantEdges(): string {
  const path = (A: number[], t: number): string => {
    const tr = trace(A, t);
    const parts: string[] = [];
    for (const r of tr.rounds) {
      parts.push(`\`mid = ${r.mid}\``);
      if (r.branch === "lt") parts.push(`\`hi = ${r.mid - 1}\``);
      if (r.branch === "gt") parts.push(`\`lo = ${r.mid + 1}\``);
    }
    return parts.join(" → ");
  };
  const res = (A: number[], t: number) => `\`${binarySearch([...A], t)}\``;
  const empty = initOf([]);
  const big = [-2147483648, -1, 0, 1, 2147483647];
  const ends =
    binarySearch([...big], big[0] as number) === 0 &&
    binarySearch([...big], big[4] as number) === 4;
  const dup = [1, 3, 3, 3, 3, 5];
  const dupGot = binarySearch([...dup], 3);
  const rows = [
    [
      "빈 배열 `[]`",
      `\`hi = ${empty.hi}\`, \`lo = ${empty.lo}\` → \`lo <= hi\` 가 처음부터 거짓`,
      `반복에 들어가지 않고 ${res([], 1)}`,
    ],
    [
      "원소 하나, 일치 `[42]` 에서 `42`",
      `${path([42], 42)}, 값이 같은 갈래`,
      res([42], 42),
    ],
    [
      "원소 하나, 불일치 `[42]` 에서 `7`",
      `${path([42], 7)} 이 되어 후보가 빈다`,
      res([42], 7),
    ],
    ["원소 둘 `[1 2]` 에서 `2`", path([1, 2], 2), res([1, 2], 2)],
    [
      "음수가 섞임 `[-10 -5 0 5 10]` 에서 `-5`",
      "비교 연산자만 쓰므로 부호와 무관",
      res([-10, -5, 0, 5, 10], -5),
    ],
    [
      "32비트 경계 `[-2147483648 … 2147483647]`",
      "`number` 가 배정밀도라 정확히 표현된다",
      ends ? "양 끝 다 정확" : "양 끝 중 하나가 틀린다",
    ],
    [
      "중복 `[1 3 3 3 3 5]` 에서 `3`",
      "먼저 읽힌 칸을 그 자리에서 반환한다",
      `\`${dupGot}\`${dupGot === dup.indexOf(3) ? " (가장 왼쪽이다)" : " (가장 왼쪽이 아니다)"}`,
    ],
  ];
  return md(["입력", "처리되는 자리", "결과"], rows);
}

/* ───────────────── 경쟁 설계와의 대조 ───────────────── */

/** 균등 입력의 칸 읽기 비 — `.alt.ts` 의 계수에서 낸다. */
function altTrade(): string {
  const bin = cases["이진 탐색"]()["균등 입력 칸 읽기"] as number;
  const itp = cases["보간 탐색"]()["균등 입력 칸 읽기"] as number;
  const ratio = Math.round(bin / itp);
  return `**이진 탐색이 내주는 것은 균등 입력에서의 칸 읽기입니다.** ${num(itp)} 대 ${num(bin)} 이면 ${ratio} 배 차이인데, 그것을 내주고 받는 것이 둘이에요 — 값이 어떻게 놓였든 최악이 \`⌊log₂ n⌋ + 1\` 로 고정되고, 값에 뺄셈·나눗셈을 요구하지 않아 문자열처럼 비교만 되는 값에도 그대로 쓸 수 있습니다.`;
}

export const PROOFS: Record<string, () => string> = {
  /** `purpose.alt` — 균등 입력에서 이진 탐색이 내주는 칸 읽기의 비. */
  "alt-trade": altTrade,
  /** `deep.origin` ② — 가장 단순한 방법을 과제 규모에서 수치로 반박한다. */
  "origin-cost": originCost,
  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리하고 읽은 칸을 나란히 센다. */
  "origin-first-vs-middle": firstVsMiddle,
  /** `deep.build` 2단계 — 실제로 지나간 후보 구간에서 mid 의 자리. */
  "build-mid": buildMid,
  /** `deep.build` 3단계 — 후보가 둘일 때도 후보가 줄어 비는가. */
  "build-shrink": buildShrink,
  /** `deep.build` 설계 선택 — 읽는 자리를 네 가지로 두고 실제로 세었을 때 어느 쪽이 적은가. */
  "spot-choice": spotChoice,
  /** `deep.build` 설계 선택 — 한 번 읽고 최악에 남는 후보 수. */
  "spot-remain": spotRemain,
  /** `deep.walk` — T1~T7 의 상태와 분기 판정. */
  "walk-trace-hit": walkTraceHit,
  /** `deep.walk` — T8~T11 의 상태와 분기 판정. */
  "walk-trace-miss": walkTraceMiss,
  /** `deep.walk.pause` — 값이 중복되면 이 코드가 어느 인덱스를 주는가. */
  "duplicate-index": duplicateTable,
  /** `deep.walk.pause` — 정렬 전제가 어긋난 배열을 넣으면 무엇이 나오는가. */
  "unsorted-answer": unsortedTable,
  /** `deep.walk.pause` — 정렬이 어긋난 배열에서 한쪽을 뺀 근거가 거짓이 되는 자리. */
  "unsorted-trace": unsortedTrace,
  /** `related` — 비교 물음이 인덱스를 따라 한 번만 바뀐다. */
  "related-predicate": relatedPredicate,
  /** `deep.math` ④ — 닫힌 형태와 실제로 센 최악. */
  "math-closed": mathClosed,
  /** `perf.bounds` — 여섯 값의 비교 횟수 평균과 최악. */
  "perf-average": perfAverage,
  /** `perf.worst` — 어떤 target 이 최악 비교 횟수를 내는가. */
  "worst-targets": targetTable,
  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 옛 이해 시험 `V5` 가 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만
   * 달라도 잡는다.
   */
  "mutant-hi-step": mutantTable,
  /** `deep.walk` 1 — 두 줄만 실행했을 때의 후보 구간. */
  "walk-init": walkInit,
  /** `deep.walk` 2 — 정본이 고른 mid 와 `(lo + hi) / 2`. */
  "walk-mid": walkMid,
  /** `deep.walk` 3 — `lo = mid + 1` 의 `1` 을 빼면 상태가 그대로다. */
  "walk-step-one": walkStepOne,
  /** `deep.walk.final` — 전체 코드에 네 입력을 넣은 답. */
  "final-calls": finalCalls,
  /** `deep.math` ② — 정의를 작은 값에 넣은 검산. */
  "math-check-r": mathCheckR,
  /** `deep.math` ③ — k 를 옮기며 두 항과 최댓값. */
  "math-sweep": mathSweep,
  /** `deep.math` ③ — 접은 자취와 C(6). */
  "math-fold": mathFold,
  /** `invariant` ② — 바퀴마다 후보 수. */
  "invariant-shrink": invariantShrink,
  /** `selfcheck` — T5 자리의 두 규칙. */
  "selfcheck-t5": selfcheckT5,
  /** `selfcheck` 답 — 없는 값 8 에서 두 규칙의 자취. */
  "selfcheck-miss": selfcheckMiss,
  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": walkInput,
  /** `deep.math` — 식을 옮긴 코드와 그 값. */
  "math-code": mathCode,
  /** `invariant` ③ — 첫 바퀴에서 두 코드가 만드는 후보. */
  "invariant-mutant-step": invariantMutantStep,
  /** `perf.derive` — T3 · T5 · T7 의 비교. */
  "perf-derive-hit": perfDeriveHit,
  /** `perf.derive` — 후보 수가 접히는 자취. */
  "perf-derive-fold": perfDeriveFold,
  /** `invariant` ② — 경계에 있는 입력 일곱. */
  "invariant-edges": invariantEdges,
};
