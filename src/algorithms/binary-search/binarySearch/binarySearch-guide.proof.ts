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
import { josa, 을를, 이가 } from "../../../../tools/josa.ts";
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

export const PROOFS: Record<string, () => string> = {
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
};
