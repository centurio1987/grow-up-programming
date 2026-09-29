/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 반복 한 바퀴의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서 받는다 —
 * 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts \
 *     src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  breaks,
  HIT,
  halfSplits,
  isSorted,
  MARK,
  MISS,
  N,
  plainSearch,
  Q,
  type Round,
  readsOf,
  rotate,
  S7,
  S21,
  SMALL,
  SMALL_K,
  scale,
  secondsOf,
  sortedHalf,
  trace,
  WALK,
  WALK_K,
  walkSteps,
} from "./searchInRotatedSortedArray-guide.fig.tsx";
import { searchInRotatedSortedArray } from "./searchInRotatedSortedArray-guide.ref.ts";

const REF = new URL(
  "./searchInRotatedSortedArray-guide.ref.ts",
  import.meta.url,
).pathname;

/* ───────────────────────── 표 그리기 ───────────────────────── */

const num = (x: number): string => x.toLocaleString("en-US");

/** `[4 5 6 7 0 1 2]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;
const span = (lo: number, hi: number): string => `[${lo},${hi}]`;
const tf = (b: boolean): string => (b ? "참" : "거짓");

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

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 그 폭으로 한다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 글자 블록 — 열마다 폭을 재서 왼쪽 정렬로 맞춘다. 칸 사이는 세 칸이다. */
function columns(rows: string[][], indent = ""): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows.map(
    (r) =>
      indent +
      r
        .map((cell, c) => (c === r.length - 1 ? cell : pad(cell, w[c] ?? 0)))
        .join("   ")
        .replace(/\s+$/, ""),
  );
}

/**
 * 펜스 블록의 **안쪽 줄**만 낸다 — `check-proof` 는 본문 펜스의 안쪽과 이 값을 맞댄다. 펜스의 언어
 * 태그(`ts` · `text`)는 원고가 적는다.
 */
const fence = (lines: string[]): string => lines.join("\n");

/** 배열 안팎의 값을 전부 넣어 본다 — 값 사이에 빈틈을 둔 배열이면 없는 값과 사이값이 함께 든다. */
function everyTarget(n: number): number[] {
  return Array.from({ length: 2 * n + 2 }, (_, i) => i - 1);
}

/** 길이 1~9 의 모든 회전 × 모든 target. 값 사이에 빈틈을 두어(`2i`) 없는 값도 함께 넣는다. */
function sweep(run: (A: number[], target: number) => boolean): {
  ok: number;
  total: number;
} {
  let ok = 0;
  let total = 0;
  for (let n = 1; n <= 9; n++) {
    const S = Array.from({ length: n }, (_, i) => i * 2);
    for (let k = 0; k < n; k++) {
      const A = rotate(S, k);
      for (const t of everyTarget(n)) {
        total++;
        if (run(A, t)) ok++;
      }
    }
  }
  return { ok, total };
}

const walkRounds = (target: number): readonly Round[] =>
  trace(WALK, target).rounds;
const side = (r: Round): string => (r.sorted === "left" ? "왼쪽" : "오른쪽");
const update = (r: Round): string =>
  r.branch === 2 || r.branch === 5 ? `hi = ${r.next.hi}` : `lo = ${r.next.lo}`;
const size = (x: { lo: number; hi: number }): number =>
  Math.max(0, x.hi - x.lo + 1);

/* ───────── 「아이디어를 떠올리는 과정」 ───────── */

/** 길이 `N` 배열에서 두 방법의 최악 읽은 칸 — 조회 하나는 실제로 세고, 조회 `Q` 번은 곱한다. */
function originCost(): string {
  const s = scale();
  const rows = [1, Q].map((q) => [
    num(q),
    num(s.linear * q),
    num(s.ours * q),
    secondsOf(s.linear * q),
  ]);
  return [
    md(
      [
        "조회 횟수",
        "선형 탐색이 읽는 칸",
        "정렬된 반쪽 가리기가 읽는 칸",
        "선형 탐색 시간(초당 1 억 칸)",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `길이 ${num(N)} 인 배열을 ${num(N / 2)} 칸 회전한 것에 배열 안팎의 값을 전부 넣어 조회 하나의 최악을 실제로 세었고, 조회 ${num(Q)} 번은 그 값에 ${num(Q)}${을를(num(Q))} 곱했습니다.`,
  ].join("\n");
}

/** 정렬만 믿는 이진 탐색을 작은 입력의 값 전부에 건다. */
function plainTable(): string {
  const rows = SMALL.map((t) => ({
    t,
    got: plainSearch(SMALL, t),
    want: searchInRotatedSortedArray([...SMALL], t),
  }));
  for (const r of rows) {
    if (r.want !== SMALL.indexOf(r.t)) throw new Error("정본의 답이 어긋난다");
  }
  const wrong = rows.filter((r) => r.got !== r.want).length;
  return [
    md(
      ["target", "이진 탐색의 답", "실제 인덱스"],
      rows.map((r) => [String(r.t), String(r.got), String(r.want)]),
      [0, 1, 2],
    ),
    "",
    `일곱 값 중 ${wrong} 개에서 이진 탐색이 -1 을 돌려줍니다. 배열에 있는 값인데 없다고 답한 것입니다.`,
  ].join("\n");
}

/** 이진 탐색이 작은 입력에서 0 을 찾는 자취. */
function plainTrace(): string {
  const target = 0;
  const rows: string[][] = [];
  let lo = 0;
  let hi = SMALL.length - 1;
  let answer = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const v = SMALL[mid] as number;
    if (v === target) {
      answer = mid;
      rows.push([
        span(lo, hi),
        String(mid),
        String(v),
        `${v} = ${target}`,
        "답",
      ]);
      break;
    }
    const left = target < v;
    const [nlo, nhi] = left ? [lo, mid - 1] : [mid + 1, hi];
    rows.push([
      span(lo, hi),
      String(mid),
      String(v),
      `${target} < ${v}${이가(v)} ${tf(left)} → ${left ? "오른쪽" : "왼쪽"}을 뺀다`,
      (nlo as number) > (nhi as number)
        ? "후보가 빈다"
        : span(nlo as number, nhi as number),
    ]);
    lo = nlo as number;
    hi = nhi as number;
  }
  if (answer !== plainSearch(SMALL, target)) {
    throw new Error("자취가 이진 탐색과 다른 답을 냈다");
  }
  const want = searchInRotatedSortedArray([...SMALL], target);
  return [
    md(["후보", "mid", "A[mid]", "비교", "새 후보"], rows, [1, 2]),
    "",
    `이진 탐색은 ${answer}${을를(answer)} 돌려주지만 ${target}${은는(target)} 인덱스 ${want} 에 있습니다.`,
  ].join("\n");
}

/** 이진 탐색이 읽은 칸 수. */
function plainReads(A: readonly number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  let reads = 0;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    reads++;
    if (A[mid] === target) return reads;
    if (target < (A[mid] as number)) hi = mid - 1;
    else lo = mid + 1;
  }
  return reads;
}

/** 한 칸을 읽는 판(이진 탐색)과 두 칸을 읽는 판(정본)의 계수와 답. */
function twoReads(): string {
  const rows = SMALL.map((t) => [
    String(t),
    String(plainReads(SMALL, t)),
    String(plainSearch(SMALL, t)),
    String(readsOf(SMALL, t)),
    String(searchInRotatedSortedArray([...SMALL], t)),
  ]);
  const sumPlain = SMALL.reduce((a, t) => a + plainReads(SMALL, t), 0);
  const sumOurs = SMALL.reduce((a, t) => a + readsOf(SMALL, t), 0);
  const wrongPlain = SMALL.filter(
    (t) => plainSearch(SMALL, t) !== SMALL.indexOf(t),
  ).length;
  const wrongOurs = SMALL.filter(
    (t) => searchInRotatedSortedArray([...SMALL], t) !== SMALL.indexOf(t),
  ).length;
  rows.push(["합", String(sumPlain), "—", String(sumOurs), "—"]);
  return [
    md(
      [
        "target",
        "이진 탐색이 읽은 칸",
        "이진 탐색의 답",
        "정렬된 반쪽 가리기가 읽은 칸",
        "정렬된 반쪽 가리기의 답",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `읽은 칸은 ${sumPlain} 에서 ${sumOurs}${으로(sumOurs)} 늘고, 어긋난 답은 ${wrongPlain} 개에서 ${wrongOurs} 개가 됩니다.`,
  ].join("\n");
}

/* ───────── 「전체 컨셉」 ───────── */

/** 작은 입력을 첫 바퀴처럼 가른 정렬된 반쪽의 값 범위로, 세 값이 그 반쪽에 있는지 정한다. */
function conceptRangeTest(): string {
  const r = trace(SMALL, 5).rounds[0] as Round;
  const [a, b] = sortedHalf(r);
  const low = SMALL[a] as number;
  const high = SMALL[b] as number;
  const targets = [0, 5, 9];
  const rows = targets.map((t) => {
    const inside = low <= t && t <= high;
    const at = searchInRotatedSortedArray([...SMALL], t);
    const inHalf = at >= a && at <= b;
    if (inside !== inHalf)
      throw new Error(`값 범위 판정이 실제와 다르다 — ${t}`);
    return [
      String(t),
      inside
        ? `${low} 이상 ${high} 이하다`
        : t < low
          ? `${low} 보다 작다`
          : `${high} 보다 크다`,
      inside ? "이 반쪽에 있다" : "이 반쪽에 없다",
      String(at),
    ];
  });
  return [
    md(
      [
        "target",
        `값 범위 ${low}~${high}${과와(high)}의 관계`,
        "판정",
        "실제 인덱스",
      ],
      rows,
      [0, 3],
    ),
    "",
    `정렬된 반쪽 ${span(a, b)} 안을 한 칸도 더 읽지 않았는데, 판정이 세 값 모두에서 실제 인덱스와 맞습니다.`,
  ].join("\n");
}

/* ───────── 「아이디어 상세」 — 먼저 알아 둘 개념 ───────── */

/** 반쪽 하나를 읽는 법 — 작은 입력의 첫 바퀴. */
function readOne(): string {
  const r = trace(SMALL, 5).rounds[0] as Round;
  const [a, b] = sortedHalf(r);
  const values = SMALL.slice(a, b + 1);
  if (!isSorted(SMALL, a, b)) throw new Error("정렬된 반쪽이 정렬돼 있지 않다");
  return fence(
    columns([
      [
        `후보 ${span(r.lo, r.hi)}`,
        `mid = ${r.lo} + ⌊${r.hi - r.lo}/2⌋ = ${r.mid}`,
      ],
      [`A[lo] = A[${r.lo}] = ${r.vLo}`, `A[mid] = A[${r.mid}] = ${r.vMid}`],
      [
        `${r.vLo} <= ${r.vMid}${이가(r.vMid)} ${tf(r.sorted === "left")}`,
        `→ ${side(r)} 반쪽 ${span(a, b)}${이가(b)} 정렬돼 있다`,
      ],
      [
        "값의 범위",
        `→ A[${a}] = ${SMALL[a]} 부터 A[${b}] = ${SMALL[b]} 까지, 곧 ${values.join(" ")}`,
      ],
    ]),
  );
}

/** 헷갈리기 쉬운 모양 — 정렬된 반쪽과 최솟값이 든 반쪽은 같은 것이 아니다. */
function confuseMin(): string {
  const splits = halfSplits();
  let differ = 0;
  const rows = splits.map((h) => {
    const minAt = h.A.indexOf(Math.min(...h.A));
    const sortedSide = h.rule ? "왼쪽" : "오른쪽";
    const minSide =
      minAt === h.mid ? "두 반쪽 다" : minAt < h.mid ? "왼쪽" : "오른쪽";
    const same = minSide === "두 반쪽 다" || minSide === sortedSide;
    if (!same) differ++;
    return [
      `${h.k} 칸`,
      show(h.A),
      `${sortedSide} ${h.rule ? span(h.lo, h.mid) : span(h.mid, h.hi)}`,
      `${minSide} (인덱스 ${minAt})`,
    ];
  });
  return [
    md(["회전", "A", "정렬된 반쪽", "최솟값 0 이 든 반쪽"], rows),
    "",
    `일곱 벌 중 ${differ} 벌에서 정렬된 반쪽과 최솟값이 든 반쪽이 서로 다른 쪽입니다.`,
  ].join("\n");
}

/** 왜 정렬된 반쪽이어야 하는가 — 양 끝 값이 곧 최솟값·최댓값인가. */
function endpoints(): string {
  const r = trace(SMALL, 5).rounds[0] as Round;
  const halves: [string, number, number][] = [
    ["왼쪽", r.lo, r.mid],
    ["오른쪽", r.mid, r.hi],
  ];
  let match = 0;
  const rows = halves.map(([name, a, b]) => {
    const values = SMALL.slice(a, b + 1);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const ok = values[0] === lo && values.at(-1) === hi;
    if (ok) match++;
    if (ok !== isSorted(SMALL, a, b)) {
      throw new Error("양 끝 값과 정렬 여부가 따로 논다");
    }
    return [
      `${name} ${span(a, b)}`,
      values.join(" "),
      `${values[0]} · ${values.at(-1)}`,
      `${lo} · ${hi}`,
      isSorted(SMALL, a, b) ? "정렬" : "끊김",
    ];
  });
  return [
    md(["반쪽", "값", "양 끝 값", "최솟값 · 최댓값", "모양"], rows),
    "",
    `두 반쪽 중 ${match} 쪽만 양 끝 값이 최솟값·최댓값과 같고, 그 쪽이 정렬된 반쪽입니다.`,
  ].join("\n");
}

/* ───────── 「아이디어 상세」 — 단계 ───────── */

/** 1단계 — 처음 후보 구간과, 그 구간으로 반복에 들어가는가. */
function buildStart(): string {
  const cases: number[][] = [SMALL, [3, 1], []];
  const rows = cases.map((A) => {
    const t = trace(A, -100);
    const lo = 0;
    const hi = A.length - 1;
    const enters = t.rounds.length > 0;
    if (enters !== lo <= hi)
      throw new Error("반복에 들어가는지가 lo <= hi 와 다르다");
    if (enters && (t.rounds[0]?.lo !== lo || t.rounds[0]?.hi !== hi)) {
      throw new Error("첫 바퀴의 후보가 [0, N-1] 이 아니다");
    }
    return [
      A.length === 0 ? "[]" : show(A),
      span(lo, hi),
      String(size({ lo, hi })),
      enters
        ? `\`${lo} <= ${hi}\` 참 → 들어간다`
        : `\`${lo} <= ${hi}\` 거짓 → 들어가지 않고 -1`,
    ];
  });
  return md(["배열", "처음 후보", "후보 칸 수", "반복"], rows, [2]);
}

/** 2단계 — 작은 입력에서 실제로 지나간 후보 구간마다 판정과 실제 정렬을 나란히. */
function buildCases(): string {
  // 작은 입력 하나로는 첫 바퀴가 늘 왼쪽 반쪽을 고른다. 오른쪽 반쪽이 정렬된 갈래도 보이려고
  // 같은 값을 5 칸 회전한 배열을 함께 넣는다.
  const other = rotate(S7, 5);
  const inputs: [number[], number[]][] = [
    [SMALL, [5, 0, 6, 3]],
    [other, [5, 0, 3]],
  ];
  const seen = new Set<string>();
  const rounds: [number[], Round][] = [];
  for (const [A, targets] of inputs) {
    for (const t of targets) {
      for (const r of trace(A, t).rounds) {
        if (r.sorted === undefined) continue;
        const key = `${show(A)} ${r.lo},${r.hi}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rounds.push([A, r]);
      }
    }
  }
  let agree = 0;
  let single = "";
  const sides = new Set<string>();
  const rows = rounds.map(([A, r]) => {
    const [a, b] = sortedHalf(r);
    const real = isSorted(A, a, b);
    if (real) agree++;
    sides.add(side(r));
    if (r.lo === r.mid && single === "") single = span(r.lo, r.hi);
    return [
      show(A),
      span(r.lo, r.hi),
      String(r.mid),
      `${r.vLo} <= ${r.vMid}`,
      tf(r.sorted === "left"),
      `${side(r)} ${span(a, b)}`,
      real ? "정렬" : "끊김",
    ];
  });
  if (agree !== rounds.length) {
    throw new Error("판정이 실제와 다른 구간이 있다");
  }
  if (sides.size !== 2) throw new Error("두 반쪽이 다 나오지 않았다");
  return [
    md(
      [
        "배열",
        "후보",
        "mid",
        "A[lo] <= A[mid]",
        "판정",
        "정렬된 반쪽",
        "실제 모양",
      ],
      rows,
      [2],
    ),
    "",
    `후보 구간 ${rounds.length} 개 모두에서 판정이 가리킨 반쪽이 실제로 정렬돼 있습니다. 후보 ${single} 처럼 mid 가 lo 와 같은 바퀴에서는 왼쪽 반쪽이 칸 하나이고, 칸 하나짜리 구간은 정렬돼 있습니다.`,
  ].join("\n");
}

/** 값 범위의 위 끝을 빼고 `A[lo] <= target` 하나로 갈래를 정하는 판. */
function oneSided(A: readonly number[], target: number): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const vMid = A[mid] as number;
    if (vMid === target) return mid;
    const vLo = A[lo] as number;
    if (vLo <= vMid) {
      if (vLo <= target) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (target <= (A[hi] as number)) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

function oneSidedTable(): string {
  const rows = SMALL.map((t) => [
    String(t),
    String(oneSided(SMALL, t)),
    String(searchInRotatedSortedArray([...SMALL], t)),
  ]);
  const wrong = SMALL.filter(
    (t) => oneSided(SMALL, t) !== SMALL.indexOf(t),
  ).length;
  const { ok, total } = sweep((A, t) => oneSided(A, t) === A.indexOf(t));
  return [
    md(
      ["target", "아래 끝만 보는 판", "양 끝을 다 보는 판(정본)"],
      rows,
      [0, 1, 2],
    ),
    "",
    `일곱 값 중 ${wrong} 개에서 아래 끝만 보는 판이 어긋납니다. 길이 1~9 의 모든 회전과 배열 안팎의 target ${num(total)} 개를 넣으면 ${num(total - ok)} 개에서 어긋납니다.`,
  ].join("\n");
}

/** 아래 끝만 보는 판이 작은 입력에서 6 을 찾는 자취. */
function oneSidedTrace(): string {
  const target = 6;
  const rows: string[][] = [];
  let lo = 0;
  let hi = SMALL.length - 1;
  let answer = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const vMid = SMALL[mid] as number;
    if (vMid === target) {
      answer = mid;
      break;
    }
    const vLo = SMALL[lo] as number;
    if (vLo > vMid) throw new Error("이 자취는 왼쪽 반쪽만 지난다고 적었다");
    const go = vLo <= target;
    const nlo = go ? lo : mid + 1;
    const nhi = go ? mid - 1 : hi;
    rows.push([
      span(lo, hi),
      String(mid),
      `왼쪽 ${span(lo, mid)} · 값 ${vLo}~${vMid}`,
      `${vLo} <= ${target}${이가(target)} ${tf(go)}`,
      `${target} < ${vMid}${이가(vMid)} ${tf(target < vMid)}`,
      nlo > nhi ? "후보가 빈다" : span(nlo, nhi),
    ]);
    lo = nlo;
    hi = nhi;
  }
  if (answer !== oneSided(SMALL, target)) throw new Error("자취가 판과 다르다");
  return [
    md(
      [
        "후보",
        "mid",
        "정렬된 반쪽",
        "아래 끝만 본 판정",
        "보지 않은 위 끝",
        "새 후보",
      ],
      rows,
      [1],
    ),
    "",
    `아래 끝만 보는 판은 ${answer}${을를(answer)} 돌려줍니다. ${target}${은는(target)} 인덱스 ${SMALL.indexOf(target)} 에 있습니다.`,
  ].join("\n");
}

/** 3단계 — 없는 값을 찾으며 후보가 매 바퀴 적어도 한 칸 주는 것을 값으로. */
function buildShrink(): string {
  const target = 3;
  const t = trace(SMALL, target);
  const rows = t.rounds.map((r) => [
    span(r.lo, r.hi),
    String(r.hi - r.lo + 1),
    String(r.mid),
    `${side(r)} 반쪽 · ${MARK[r.branch]}`,
    r.next.lo > r.next.hi ? "후보가 빈다" : span(r.next.lo, r.next.hi),
    String(size(r.next)),
  ]);
  const shrunk = t.rounds.every((r) => size(r.next) < r.hi - r.lo + 1);
  if (!shrunk) throw new Error("후보가 줄지 않은 바퀴가 있다");
  return [
    md(
      [
        "후보",
        "후보 칸 수",
        "mid",
        "정렬된 반쪽 · 갈래",
        "새 후보",
        "새 후보 칸 수",
      ],
      rows,
      [1, 2, 5],
    ),
    "",
    `${t.rounds.length} 바퀴 모두 mid 를 후보에서 빼서 후보가 적어도 한 칸 줄었고, 마지막에 lo = ${t.end.lo}${이가(t.end.lo)} hi = ${t.end.hi} 보다 커져 ${t.result}${을를(t.result)} 돌려줍니다.`,
  ].join("\n");
}

/* ───────── 「아이디어 상세」 — A[lo] 와 비교하는 까닭 ───────── */

type Anchor = {
  name: string;
  /** 왼쪽 반쪽 `[lo, mid]` 에 끊긴 자리가 없다고 볼 것인가. */
  leftSorted: (A: number[], lo: number, mid: number, hi: number) => boolean;
  /** 그 판정에 후보 구간 밖의 칸을 읽는가. */
  outside: (A: number[], lo: number, hi: number) => boolean;
};

const ANCHORS: Anchor[] = [
  {
    name: "A[0] 과 비교한다",
    leftSorted: (A, _lo, mid) => (A[0] as number) <= (A[mid] as number),
    outside: (_A, lo) => lo > 0,
  },
  {
    name: "A[lo] 와 비교한다(정본)",
    leftSorted: (A, lo, mid) => (A[lo] as number) <= (A[mid] as number),
    outside: () => false,
  },
  {
    name: "A[hi] 와 비교한다",
    leftSorted: (A, _lo, mid, hi) => (A[mid] as number) > (A[hi] as number),
    outside: () => false,
  },
  {
    name: "A[N-1] 과 비교한다",
    leftSorted: (A, _lo, mid) =>
      (A[mid] as number) > (A[A.length - 1] as number),
    outside: (A, _lo, hi) => hi < A.length - 1,
  },
];

function searchWith(
  A: number[],
  target: number,
  anchor: Anchor,
  meter: { outside: number },
): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const vMid = A[mid] as number;
    if (vMid === target) return mid;
    if (anchor.outside(A, lo, hi)) meter.outside++;
    if (anchor.leftSorted(A, lo, mid, hi)) {
      if ((A[lo] as number) <= target && target < vMid) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (vMid < target && target <= (A[hi] as number)) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

const anchorRuns = () =>
  ANCHORS.map((anchor) => {
    const meter = { outside: 0 };
    const { ok, total } = sweep(
      (A, t) => searchWith(A, t, anchor, meter) === A.indexOf(t),
    );
    return { anchor, ok, total, outside: meter.outside };
  });

function anchorTable(): string {
  const runs = anchorRuns();
  // 「A[lo] 와 비교한다」 줄은 정본과 같은 판정이다. 답이 정본과 한 곳이라도 다르면 이 표가 다른 절차를 잰 것이다.
  const same = sweep(
    (A, t) =>
      searchWith(A, t, ANCHORS[1] as Anchor, { outside: 0 }) ===
      searchInRotatedSortedArray([...A], t),
  );
  if (same.ok !== same.total) throw new Error("A[lo] 기준이 정본과 다르다");
  const allRight = runs.every((r) => r.ok === r.total);
  return [
    md(
      [
        "정렬된 반쪽을 가리는 기준",
        "답이 맞은 횟수",
        "후보 구간 밖을 읽은 횟수",
      ],
      runs.map((r) => [
        r.anchor.name,
        `${num(r.ok)} / ${num(r.total)}`,
        num(r.outside),
      ]),
      [1, 2],
    ),
    "",
    allRight
      ? "네 기준 모두 답은 전부 맞습니다. 갈리는 것은 후보 구간 밖을 읽은 횟수입니다."
      : "답이 어긋나는 기준이 있습니다.",
  ].join("\n");
}

/* ───────── 「수행으로 알아보는 알고리즘」 ───────── */

function walkInput(): string {
  const want = searchInRotatedSortedArray([...WALK], HIT);
  return fence([
    `const S = Array.from({ length: ${S21.length} }, (_, i) => i); // ${S21.slice(0, 3).join(" ")} … ${S21.at(-1)}`,
    `const A = [...S.slice(${WALK_K}), ...S.slice(0, ${WALK_K})]; // ${WALK.slice(0, 6).join(" ")} … ${WALK.at(-1)}`,
    `const target = ${HIT};`,
    `// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다`,
  ]);
}

/** 한 번의 호출이 실행한 갈래 번호. */
const branchesOf = (A: readonly number[], t: number): Set<number> =>
  new Set(trace(A, t).rounds.map((r) => r.branch));

/** 표에 실을 길이. 나머지 길이도 함께 재고, 처음 다섯이 되는 자리를 문장으로 낸다. */
const SHOWN_LENGTHS = new Set([3, 7, 12, 20, 21, 22]);

function coverageTable(): string {
  const rows: string[][] = [];
  let firstFive = 0;
  for (let n = 1; n <= 22; n++) {
    const S = Array.from({ length: n }, (_, i) => i * 2);
    let best = 0;
    for (let k = 0; k < n; k++) {
      const A = rotate(S, k);
      for (const t of everyTarget(n)) {
        best = Math.max(best, branchesOf(A, t).size);
      }
    }
    if (best === 5 && firstFive === 0) firstFive = n;
    if (SHOWN_LENGTHS.has(n)) rows.push([`${n} 칸`, String(best)]);
  }
  const walkCover = branchesOf(WALK, HIT).size;
  return [
    md(["배열 길이", "한 번의 호출이 실행한 갈래 수의 최댓값"], rows, [1]),
    "",
    `${firstFive} 칸에서 처음으로 다섯이 됩니다. 이 절의 입력 A 에서 ${HIT}${을를(HIT)} 찾는 호출도 갈래 ${walkCover} 개를 모두 실행합니다.`,
  ].join("\n");
}

function walkInit(): string {
  const cases: [string, number[]][] = [
    [`A = [${WALK.slice(0, 5).join(" ")} … ${WALK.at(-1)}]`, WALK],
    ["A = [42]", [42]],
    ["A = []", []],
  ];
  for (const [, A] of cases) {
    const t = trace(A, -100);
    const first = t.rounds[0];
    if (A.length === 0 ? t.rounds.length !== 0 : first?.hi !== A.length - 1) {
      throw new Error("시작 구간이 [0, N-1] 이 아니다");
    }
  }
  return fence([
    ...columns(
      cases.map(([name, A]) => {
        const hi = A.length - 1;
        return [name, "→", `lo = 0, hi = ${hi},`, `후보 ${hi + 1} 칸`];
      }),
    ),
    "빈 배열만 lo <= hi 가 처음부터 거짓이라, 반복 없이 -1 이 나온다",
  ]);
}

function walkFirstRead(): string {
  const r = walkRounds(HIT)[0] as Round;
  const [a, b] = sortedHalf(r);
  return fence(
    columns([
      [
        `lo = ${r.lo}, hi = ${r.hi}`,
        "→",
        `mid = ${r.lo} + ⌊${r.hi - r.lo}/2⌋ = ${r.mid}`,
      ],
      ["", "", `vMid = A[${r.mid}] = ${r.vMid}`],
      ["", "", `vLo  = A[${r.lo}] = ${r.vLo}`],
      [
        "",
        "",
        `${r.vLo} <= ${r.vMid}${이가(r.vMid)} ${tf(r.sorted === "left")}이다 → ${side(r)} 반쪽 ${span(a, b)}${이가(b)} 정렬돼 있다`,
      ],
    ]),
  );
}

/**
 * 짚고 가기 — 정렬된 반쪽을 가린 뒤 `target < A[mid]` 하나로 갈래를 정하는 사본.
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const midOnly = await loadMutant<{
  searchInRotatedSortedArray(A: number[], target: number): number;
}>(REF, {
  swap: [
    /^(\s*)if \(vLo <= target && target < vMid\) \{$/,
    "$1if (target < vMid) {",
  ],
});

function midOnlyTable(): string {
  const rows = SMALL.map((t) => [
    String(t),
    String(searchInRotatedSortedArray([...SMALL], t)),
    String(midOnly.searchInRotatedSortedArray([...SMALL], t)),
  ]);
  const neutral =
    midOnly.searchInRotatedSortedArray === searchInRotatedSortedArray;
  const wrong = SMALL.filter(
    (t) =>
      midOnly.searchInRotatedSortedArray([...SMALL], t) !== SMALL.indexOf(t),
  ).length;
  // 중화 실행에서는 변이 모듈이 정본 그대로라 이 검사를 건너뛴다(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
  if (!neutral && wrong === 0) {
    throw new Error("변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
  const { ok, total } = sweep(
    (A, t) => midOnly.searchInRotatedSortedArray([...A], t) === A.indexOf(t),
  );
  return [
    md(["target", "바른 코드", "target < vMid 로 적은 코드"], rows, [0, 1, 2]),
    "",
    `일곱 값 중 ${wrong} 개가 어긋납니다. 길이 1~9 의 모든 회전과 target ${num(total)} 개를 넣으면 ${num(total - ok)} 개에서 어긋납니다.`,
  ].join("\n");
}

function midOnlyFirstRound(): string {
  const target = 0;
  const r = trace(SMALL, target).rounds[0] as Round;
  if (r.sorted !== "left") throw new Error("첫 바퀴가 왼쪽 반쪽을 가려야 한다");
  const cut = (lo: number, hi: number) =>
    `후보 ${span(lo, hi)} = ${SMALL.slice(lo, hi + 1).join(" ")}`;
  const has = (lo: number, hi: number) => {
    const at = SMALL.indexOf(target);
    return at >= lo && at <= hi;
  };
  const wrongGo = target < r.vMid;
  const wlo = wrongGo ? r.lo : r.mid + 1;
  const whi = wrongGo ? r.mid - 1 : r.hi;
  const mark = (x: boolean) =>
    `${target}${이가(target)} ${x ? "있다" : "없다"}`;
  return fence([
    `${show(SMALL)} 에서 ${target}${을를(target)} 찾는다.  mid = ${r.mid}, A[${r.lo}] = ${r.vLo} <= A[${r.mid}] = ${r.vMid}${josa(r.vMid, "이라", "라")} 왼쪽 반쪽이 정렬돼 있다`,
    "",
    ...columns(
      [
        [
          "target < A[mid] 로 정하면",
          `${target} < ${r.vMid} ${tf(wrongGo)}`,
          "→",
          wrongGo ? `hi = ${whi}` : `lo = ${wlo}`,
          cut(wlo, whi),
          mark(has(wlo, whi)),
        ],
        [
          "값 범위로 정하면",
          `${r.vLo} <= ${target} ${tf((r.vLo as number) <= target)}`,
          "→",
          update(r),
          cut(r.next.lo, r.next.hi),
          mark(has(r.next.lo, r.next.hi)),
        ],
      ],
      "  ",
    ),
  ]);
}

/** 값 범위 판정 — 정본 조건식 그대로, 참/거짓을 굵게. */
function rangeCode(r: Round, target: number): string {
  if (r.sorted === "left") {
    const a = (r.vLo as number) <= target && target < r.vMid;
    return `\`${r.vLo} <= ${target} && ${target} < ${r.vMid}\` **${tf(a)}**`;
  }
  const a = r.vMid < target && target <= (r.vHi as number);
  return `\`${r.vMid} < ${target} && ${target} <= ${r.vHi}\` **${tf(a)}**`;
}

const TRACE_HEAD = [
  "단계",
  "하는 일",
  "조건 판정",
  "lo",
  "hi",
  "후보 칸",
  "읽은 칸 누계",
];

/** 전개의 걸음 표 — 걸음마다 조건 판정과 상태. 걸음 번호는 그림 사이드카의 걸음에서 받는다. */
function hitRows(): string[][] {
  const steps = walkSteps().hit;
  const rounds = walkRounds(HIT);
  const rows: string[][] = [];
  let reads = 0;
  const first = rounds[0] as Round;
  rows.push([
    steps[0]?.id ?? "",
    "후보를 배열 전체로",
    `lo = ${first.lo}, hi = ${first.hi}`,
    String(first.lo),
    String(first.hi),
    String(first.hi - first.lo + 1),
    "0",
  ]);
  let n = 1;
  for (const r of rounds) {
    const a = steps[n++];
    const b = steps[n++];
    const held = String(r.hi - r.lo + 1);
    if (r.branch === 1) {
      reads += 1;
      rows.push([
        a?.id ?? "",
        `A[${r.mid}]${을를(r.mid)} 읽는다`,
        `\`${r.lo} <= ${r.hi}\` **참**, mid = ${r.mid}`,
        String(r.lo),
        String(r.hi),
        held,
        String(reads),
      ]);
      rows.push([
        b?.id ?? "",
        "답을 돌려준다",
        `\`${r.vMid} === ${HIT}\` **참** → ①`,
        String(r.lo),
        String(r.hi),
        held,
        String(reads),
      ]);
      continue;
    }
    const [lo2, hi2] = sortedHalf(r);
    reads += 2;
    rows.push([
      a?.id ?? "",
      r.lo === r.mid
        ? `A[${r.mid}]${을를(r.mid)} 두 번 읽는다(mid 와 lo 가 같은 칸)`
        : `A[${r.mid}] · A[${r.lo}]${을를(r.lo)} 읽는다`,
      `\`${r.lo} <= ${r.hi}\` **참**, mid = ${r.mid}, \`${r.vLo} <= ${r.vMid}\` **${tf(r.sorted === "left")}** → ${side(r)} ${span(lo2, hi2)}`,
      String(r.lo),
      String(r.hi),
      held,
      String(reads),
    ]);
    if (r.sorted === "right") reads += 1;
    rows.push([
      b?.id ?? "",
      r.sorted === "right"
        ? `A[${r.hi}]${을를(r.hi)} 읽고 한쪽을 뺀다`
        : "한쪽을 뺀다",
      `${rangeCode(r, HIT)} → ${MARK[r.branch]}`,
      String(r.next.lo),
      String(r.next.hi),
      String(size(r.next)),
      String(reads),
    ]);
  }
  if (n !== steps.length) throw new Error("걸음 수가 바퀴와 어긋난다");
  return rows;
}

function missRows(): string[][] {
  const steps = walkSteps().miss;
  const t = trace(WALK, MISS);
  const rows: string[][] = [];
  let reads = 0;
  let n = 0;
  for (const r of t.rounds) {
    const s = steps[n++];
    reads += r.reads;
    const [lo2, hi2] = sortedHalf(r);
    rows.push([
      s?.id ?? "",
      `후보 ${span(r.lo, r.hi)} 에서 mid = ${r.mid}`,
      `\`${r.vLo} <= ${r.vMid}\` **${tf(r.sorted === "left")}** → ${side(r)} ${span(lo2, hi2)}, ${rangeCode(r, MISS)} → ${MARK[r.branch]}`,
      String(r.next.lo),
      String(r.next.hi),
      String(size(r.next)),
      String(reads),
    ]);
  }
  rows.push([
    steps[n]?.id ?? "",
    "반복 조건을 본다",
    `\`${t.end.lo} <= ${t.end.hi}\` **거짓** → \`${t.result}\` 반환`,
    String(t.end.lo),
    String(t.end.hi),
    "0",
    String(reads),
  ]);
  if (n + 1 !== steps.length) throw new Error("걸음 수가 바퀴와 어긋난다");
  return rows;
}

function walkTraceHit(): string {
  const rounds = walkRounds(HIT);
  const covered = [...new Set(rounds.map((r) => MARK[r.branch]))].sort();
  const total = rounds.reduce((a, r) => a + r.reads, 0);
  const sizes = rounds.map((r) => r.hi - r.lo + 1).join(" → ");
  return [
    md(TRACE_HEAD, hitRows(), [3, 4, 5, 6]),
    "",
    `갈래 ${covered.join(" · ")} 의 ${covered.length} 가지가 모두 나왔습니다. 후보가 ${sizes} 칸으로 줄었고, 배열 칸을 ${total} 번 읽었습니다.`,
  ].join("\n");
}

function walkTraceMiss(): string {
  const t = trace(WALK, MISS);
  const covered = [...new Set(t.rounds.map((r) => MARK[r.branch]))].sort();
  return [
    md(TRACE_HEAD, missRows(), [3, 4, 5, 6]),
    "",
    `${t.rounds.length} 바퀴 동안 갈래 ${covered.join(" · ")} 의 ${covered.length} 가지가 나왔고, 후보가 비어 ${t.result}${을를(t.result)} 돌려줍니다.`,
  ].join("\n");
}

/** 짚고 가기 — 후보가 두 칸일 때(lo = mid). 전개의 해당 바퀴 값으로. */
function pauseTwoCells(): string {
  const r = walkRounds(HIT).find((x) => x.lo === x.mid && x.sorted);
  if (r === undefined) throw new Error("lo = mid 인 바퀴가 없다");
  return fence([
    `lo = mid = ${r.mid} 일 때`,
    "",
    ...columns(
      [
        [
          `왼쪽 반쪽 ${span(r.lo, r.mid)}`,
          "칸 하나다. 칸 하나짜리 구간은 정렬돼 있다",
          "→ 판정이 옳다",
        ],
        [
          "그 반쪽의 값 범위",
          `A[${r.lo}] 이상 A[${r.mid}] 미만 = ${r.vLo} 이상 ${r.vMid} 미만`,
          "→ 빈 범위다",
        ],
        [
          "그래서",
          "② 는 참이 될 수 없고 ③ 으로 간다",
          `→ lo = mid + 1 = ${r.next.lo}, 후보가 준다`,
        ],
      ],
      "  ",
    ),
  ]);
}

/* ───────── 원소가 중복되면 ───────── */

const DUPES: [number[], number][] = [
  [[1, 0, 1, 1, 1], 0],
  [[0, 1, 0, 0, 0], 1],
  [[1, 0, 1, 1, 1, 1], 0],
];

function duplicateTable(): string {
  const rows = DUPES.map(([A, t]) => ({
    A,
    t,
    got: searchInRotatedSortedArray([...A], t),
    want: A.indexOf(t),
  }));
  const wrong = rows.filter((r) => r.got !== r.want).length;
  return [
    md(
      ["배열", "target", "이 코드의 답", "그 값이 있는 자리"],
      rows.map((r) => [show(r.A), String(r.t), String(r.got), String(r.want)]),
      [1, 2, 3],
    ),
    "",
    `세 벌 중 ${wrong} 벌에서 값이 배열에 있는데 -1 이 나옵니다.`,
  ].join("\n");
}

function duplicateTrace(): string {
  const [A, target] = DUPES[0] as [number[], number];
  const t = trace(A, target);
  const rows = t.rounds.map((r) => {
    if (r.sorted === undefined) {
      return [span(r.lo, r.hi), String(r.mid), "—", "①", "답"];
    }
    const [a, b] = sortedHalf(r);
    const real = isSorted(A, a, b);
    return [
      span(r.lo, r.hi),
      String(r.mid),
      `\`${r.vLo} <= ${r.vMid}\` ${tf(r.sorted === "left")} → ${side(r)} ${span(a, b)} = ${A.slice(a, b + 1).join(" ")} (실제로는 ${real ? "정렬" : "끊김"})`,
      MARK[r.branch],
      r.next.lo > r.next.hi ? "후보가 빈다" : span(r.next.lo, r.next.hi),
    ];
  });
  return [
    md(["후보", "mid", "반쪽 판정", "갈래", "새 후보"], rows, [1]),
    "",
    `정본은 ${t.result}${을를(t.result)} 돌려주지만 ${target}${은는(target)} 인덱스 ${A.indexOf(target)} 에 있습니다.`,
  ].join("\n");
}

function finalCalls(): string {
  const calls: [string, number[], number][] = [
    [`[${WALK.slice(0, 6).join(", ")}, …, ${WALK.at(-1)}]`, WALK, HIT],
    [`[${SMALL.join(", ")}]`, SMALL, 0],
    [`[${SMALL.join(", ")}]`, SMALL, 3],
    ["[1, 2, 3, 4, 5]", [1, 2, 3, 4, 5], 3],
    ["[3, 1]", [3, 1], 1],
  ];
  return fence(
    columns(
      calls.map(([name, A, t]) => [
        `searchInRotatedSortedArray(${name}, ${t})`,
        "→",
        String(searchInRotatedSortedArray([...A], t)),
      ]),
    ),
  );
}

/* ───────── 「알아 두면 좋은 개념」 ───────── */

const MIN_AT = WALK.indexOf(Math.min(...WALK));

function relatedRotation(): string {
  const n = WALK.length;
  const p = MIN_AT;
  const rows = [0, 1, n - WALK_K - 1, n - WALK_K, n - 1].map((j) => {
    const at = (j + p) % n;
    if (WALK[at] !== S21[j])
      throw new Error("순환 이동 식이 전개 입력과 다르다");
    return [String(j), String(S21[j]), String(at), String(WALK[at])];
  });
  const min = Math.min(...WALK);
  return [
    md(
      ["j", "값 S[j]", `간 자리 (j + ${p}) mod ${n}`, "A 의 그 자리 값"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `최솟값 ${min}${이가(min)} 인덱스 ${p} 에 있고, 표의 다섯 자리 모두 A 의 값이 S[j] 와 같습니다.`,
  ].join("\n");
}

/* ───────── 「수식 정의와 유도」 ───────── */

const idxOf = (i: number, n: number): number => (((i - MIN_AT) % n) + n) % n;

function mathCheck(): string {
  const n = WALK.length;
  const rows = [0, MIN_AT, n - 1].map((i) => {
    const j = idxOf(i, n);
    if (S21[j] !== WALK[i]) throw new Error("검산이 어긋난다");
    return [
      `i = ${i}`,
      `(${i} - ${MIN_AT}) mod ${n} = ${j}`,
      `A[${i}] = s${j} = ${S21[j]}`,
      `실제 A[${i}] = ${WALK[i]}`,
    ];
  });
  return fence([
    `전개 절의 입력에 넣는다.  N = ${n}, S = (${S21.slice(0, 2).join(", ")}, …, ${S21.at(-1)}), p = ${MIN_AT}`,
    "",
    ...columns(rows),
  ]);
}

function mathIndexRow(): string {
  const n = WALK.length;
  const head = [0, 1, 2, 3, 4, 5, 6];
  const tail = [n - 2, n - 1];
  const [b] = breaks(WALK);
  if (b !== MIN_AT - 1) throw new Error("끊긴 자리가 p - 1 이 아니다");
  const drops = Array.from({ length: n - 1 }, (_, i) => i).filter(
    (i) => idxOf(i + 1, n) < idxOf(i, n),
  );
  if (drops.length !== 1 || drops[0] !== b) {
    throw new Error("첨자가 줄어드는 자리가 하나가 아니다");
  }
  const cells = (xs: number[], f: (x: number) => number) =>
    xs.map((x) => String(f(x)).padStart(2)).join(" ");
  const id = (x: number) => x;
  const sub = (x: number) => idxOf(x, n);
  return fence([
    `i 번째 칸의 첨자 (i - p) mod N.  N = ${n}, p = ${MIN_AT}`,
    "",
    `  i      ${cells(head, id)}  …  ${cells(tail, id)}`,
    `  첨자   ${cells(head, sub)}  …  ${cells(tail, sub)}`,
    "",
    `첨자가 줄어드는 자리는 i = ${b} 에서 i = ${b + 1} 로 갈 때 하나뿐이고, ${b} = p - 1 이다`,
  ]);
}

function mathCode(): string {
  const n = WALK.length;
  const A = (i: number): number => S21[idxOf(i, n)] as number;
  return fence([
    `const N = ${n};`,
    `const p = ${MIN_AT};`,
    "const s = (j: number): number => j; // S[j] = j",
    "const A = (i: number): number => s((((i - p) % N) + N) % N);",
    "",
    `A(0); // → ${A(0)}`,
    `A(${MIN_AT}); // → ${A(MIN_AT)}`,
    `A(${n - 1}); // → ${A(n - 1)}`,
  ]);
}

function mathClosed(): string {
  const sizes = [WALK.length, 1_000, N];
  const rows = sizes.map((n) => {
    const rounds = Math.floor(Math.log2(n)) + 1;
    return [num(n), String(rounds), String(3 * rounds), num(n)];
  });
  return md(
    [
      "N",
      "바퀴 수 상한 ⌊log₂ N⌋ + 1",
      "읽는 칸 상한 3(⌊log₂ N⌋ + 1)",
      "선형 탐색이 읽는 칸",
    ],
    rows,
    [0, 1, 2, 3],
  );
}

/* ───────── 「불변식」 ───────── */

/** 갈래의 이름 — 「불변식」 절은 원문자 라벨을 쓰지 않는다(`P14`). */
const BRANCH_NAME: Record<number, string> = {
  1: "읽은 칸이 답",
  2: "왼쪽 반쪽 값 범위 안",
  3: "왼쪽 반쪽 값 범위 밖",
  4: "오른쪽 반쪽 값 범위 안",
  5: "오른쪽 반쪽 값 범위 밖",
};

function invariantEdges(): string {
  const cases: [string, number[], number][] = [
    ["원소 하나, 일치", [42], 42],
    ["원소 하나, 불일치", [42], 7],
    ["원소 둘, 회전 없음", [1, 2], 2],
    ["원소 둘, 회전 있음", [3, 1], 1],
    ["회전이 아예 없음", [1, 2, 3, 4, 5], 5],
    ["음수가 섞임", [2, 4, 6, -5, -3, -1], -3],
  ];
  const rows = cases.map(([name, A, t]) => {
    const tr = trace(A, t);
    if (tr.result !== A.indexOf(t)) throw new Error(`${name} 의 답이 틀렸다`);
    const path = tr.rounds.map((r) => BRANCH_NAME[r.branch]).join(" → ");
    const tail = tr.result === -1 ? " → 후보가 빈다" : "";
    return [
      `${name} \`${show(A)}\` 에서 \`${t}\``,
      `${path}${tail}`,
      `\`${tr.result}\``,
    ];
  });
  return md(["입력", "지나간 갈래", "결과"], rows);
}

/**
 * `vLo <= vMid` 를 `vLo < vMid` 로 바꾼 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const strict = await loadMutant<{
  searchInRotatedSortedArray(A: number[], target: number): number;
}>(REF, { swap: [/^(\s*)if \(vLo <= vMid\) \{$/, "$1if (vLo < vMid) {"] });

const STRICT_CASES: [number[], number][] = [
  [[3, 1], 1],
  [[2, 4, 6, 0], 0],
  [[8, 0, 2, 4, 6], 0],
];

function strictTable(): string {
  const rows = STRICT_CASES.map(([A, t]) => ({
    A,
    t,
    correct: searchInRotatedSortedArray([...A], t),
    broken: strict.searchInRotatedSortedArray([...A], t),
  }));
  const neutral =
    strict.searchInRotatedSortedArray === searchInRotatedSortedArray;
  // 중화 실행에서는 변이 모듈이 정본 그대로라 이 검사를 건너뛴다(SPEC §0).
  if (!neutral && rows.every((r) => r.correct === r.broken)) {
    throw new Error("변이가 어느 입력에서도 답을 바꾸지 못했다");
  }
  let wrong = 0;
  let wrongAtMin = 0;
  let total = 0;
  for (let n = 1; n <= 9; n++) {
    const S = Array.from({ length: n }, (_, i) => i * 2);
    for (let k = 0; k < n; k++) {
      const A = rotate(S, k);
      for (const t of everyTarget(n)) {
        total++;
        if (strict.searchInRotatedSortedArray([...A], t) !== A.indexOf(t)) {
          wrong++;
          if (t === Math.min(...A)) wrongAtMin++;
        }
      }
    }
  }
  return [
    md(
      ["배열", "target", "바른 코드", "vLo < vMid 로 적은 코드"],
      rows.map((r) => [
        show(r.A),
        String(r.t),
        String(r.correct),
        String(r.broken),
      ]),
      [1, 2, 3],
    ),
    "",
    `길이 1~9 의 모든 회전과 target ${num(total)} 개를 넣으면 ${num(wrong)} 개에서 어긋나고, 그중 ${num(wrongAtMin)} 개가 target 이 배열의 최솟값일 때입니다.`,
  ].join("\n");
}

function strictTrace(): string {
  const [A, t] = STRICT_CASES[0] as [number[], number];
  const r = trace(A, t).rounds[0] as Round;
  const vLo = r.vLo as number;
  const vMid = r.vMid;
  const vHi = A[r.hi] as number;
  // 등호를 뺀 판정이 이 바퀴에서 무엇을 하는지 — 정본의 조건식을 등호만 바꿔 계산한다.
  const strictLeft = vLo < vMid;
  const strictNext = strictLeft
    ? vLo <= t && t < vMid
      ? { lo: r.lo, hi: r.mid - 1 }
      : { lo: r.mid + 1, hi: r.hi }
    : vMid < t && t <= vHi
      ? { lo: r.mid + 1, hi: r.hi }
      : { lo: r.lo, hi: r.mid - 1 };
  const neutral =
    strict.searchInRotatedSortedArray === searchInRotatedSortedArray;
  if (!neutral && strict.searchInRotatedSortedArray([...A], t) !== -1) {
    throw new Error("등호를 뺀 판이 -1 을 내지 않았다");
  }
  const after = (x: { lo: number; hi: number }) =>
    x.lo > x.hi ? "후보가 빈다" : `후보 ${span(x.lo, x.hi)}`;
  return fence([
    `${show(A)} 에서 ${t}${을를(t)} 찾는다.  후보 ${span(r.lo, r.hi)}, mid = ${r.mid}${josa(r.mid, "이라", "라")} lo = mid 다`,
    "",
    ...columns(
      [
        [
          "vLo <= vMid",
          `${vLo} <= ${vMid} ${tf(vLo <= vMid)}`,
          `→ 왼쪽 반쪽 ${span(r.lo, r.mid)} 정렬, ${BRANCH_NAME[r.branch]}이라 ${update(r)}`,
          `→ ${after(r.next)}`,
        ],
        [
          "vLo <  vMid",
          `${vLo} < ${vMid} ${tf(strictLeft)}`,
          `→ 오른쪽 반쪽 ${span(r.mid, r.hi)} 정렬로 보고, ${vMid} < ${t}${이가(t)} ${tf(vMid < t)}, ${BRANCH_NAME[5]}이라 hi = ${strictNext.hi}`,
          `→ ${after(strictNext)}`,
        ],
      ],
      "  ",
    ),
  ]);
}

/* ───────── 「비용 계산」 ───────── */

function perfDeriveReads(): string {
  const { hit } = walkSteps();
  const rounds = walkRounds(HIT);
  const rows: string[][] = [];
  let n = 1;
  let total = 0;
  for (const r of rounds) {
    const id = `${hit[n]?.id}~${hit[n + 1]?.id}`;
    n += 2;
    total += r.reads;
    const cells =
      r.branch === 1
        ? [`A[${r.mid}]`]
        : r.sorted === "right"
          ? [`A[${r.mid}]`, `A[${r.lo}]`, `A[${r.hi}]`]
          : [`A[${r.mid}]`, `A[${r.lo}]`];
    const why =
      r.branch === 1 ? "읽은 칸이 답이었다" : `${side(r)} 반쪽이 정렬돼 있었다`;
    rows.push([id, cells.join(" · "), why, `${r.reads} 칸`]);
  }
  return fence([...columns(rows), `합 ${total} 칸`]);
}

function perfDeriveFold(): string {
  const rounds = walkRounds(HIT);
  const sizes = rounds.map((r) => r.hi - r.lo + 1);
  const rows = rounds.map((r, i) => [
    `바퀴 ${i + 1}`,
    `후보 ${sizes[i]} 칸`,
    `mid 를 빼면 왼쪽 ${r.mid - r.lo} 칸 · 오른쪽 ${r.hi - r.mid} 칸`,
    r.branch === 1 ? "→ 답" : `→ 남은 후보 ${size(r.next)} 칸`,
  ]);
  return fence(columns(rows));
}

/** 스물한 칸 배열의 모든 회전 × 배열 안팎의 target 에서 바퀴 수 분포. */
function perfRounds(): string {
  const n = WALK.length;
  const counts = new Map<number, number>();
  let pairs = 0;
  for (let k = 0; k < n; k++) {
    const A = rotate(S21, k);
    for (let t = -1; t <= n; t++) {
      pairs++;
      const c = trace(A, t).rounds.length;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  const bound = Math.floor(Math.log2(n)) + 1;
  const max = Math.max(...counts.keys());
  const rows = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([c, m]) => [`${c} 바퀴`, String(m)]);
  return [
    md(["바퀴 수", "그 값이 나온 (회전, target) 짝의 수"], rows, [1]),
    "",
    `${n} 칸의 회전 ${n} 벌과 target ${n + 2} 개, 모두 ${num(pairs)} 짝을 넣었습니다. 가장 많은 바퀴 수 ${max}${은는(max)} ⌊log₂ ${n}⌋ + 1 = ${bound}${과와(bound)} 같습니다.`,
  ].join("\n");
}

function worstTable(): string {
  const n = WALK.length;
  const counts = new Map<number, number>();
  let worst = 0;
  const worstAt: string[] = [];
  let noRotation = 0;
  let pairs = 0;
  for (let k = 0; k < n; k++) {
    const A = rotate(S21, k);
    for (let t = -1; t <= n; t++) {
      pairs++;
      const c = readsOf(A, t);
      counts.set(c, (counts.get(c) ?? 0) + 1);
      if (k === 0) noRotation = Math.max(noRotation, c);
      if (c > worst) {
        worst = c;
        worstAt.length = 0;
      }
      if (c === worst) worstAt.push(`${k} 칸 회전 · target ${t}`);
    }
  }
  const rows = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([c, m]) => [`${c} 칸`, String(m)]);
  const bound = 3 * (Math.floor(Math.log2(n)) + 1);
  return [
    md(["읽은 배열 칸 수", "그 값이 나온 (회전, target) 짝의 수"], rows, [1]),
    "",
    `${num(pairs)} 짝 중 가장 많은 것이 ${worst} 칸이고 ${worstAt.length} 짝이 여기 듭니다. 상한 3(⌊log₂ ${n}⌋ + 1) = ${bound} 보다 적고, 회전이 없을 때의 최대는 ${noRotation} 칸입니다.`,
  ].join("\n");
}

function worstExample(): string {
  const n = WALK.length;
  let best = { k: 0, t: 0, c: 0 };
  for (let k = 0; k < n; k++) {
    const A = rotate(S21, k);
    for (let t = -1; t <= n; t++) {
      const c = readsOf(A, t);
      if (c > best.c) best = { k, t, c };
    }
  }
  const A = rotate(S21, best.k);
  const [b] = breaks(A);
  const tr = trace(A, best.t);
  const rightRounds = tr.rounds.filter((r) => r.sorted === "right").length;
  return fence([
    `S = 0 1 … ${n - 1} 을 ${best.k} 칸 회전하면`,
    "",
    `A = ${show(A)}`,
    `끊긴 자리는 인덱스 ${b} 과 ${(b as number) + 1} 사이다`,
    "",
    `target = ${best.t} 을 넣으면   바퀴 ${tr.rounds.length} 번, 그중 오른쪽 반쪽이 정렬된 바퀴 ${rightRounds} 번   →   ${best.c} 칸`,
  ]);
}

/* ───────── 「스스로 점검하기」 ───────── */

function selfcheckT5(): string {
  const { hit } = walkSteps();
  const r = walkRounds(HIT)[1] as Round;
  const id = hit[4]?.id ?? "";
  const last = WALK.length - 1;
  const vLast = WALK[last] as number;
  const inHi = r.vMid < HIT && HIT <= (r.vHi as number);
  const inLast = r.vMid < HIT && HIT <= vLast;
  const go = (x: boolean) =>
    x ? `④  lo = ${r.mid + 1}` : `⑤  hi = ${r.mid - 1}`;
  return fence([
    `${id} — 후보 ${span(r.lo, r.hi)}, mid = ${r.mid}, A[${r.mid}] = ${r.vMid}, target = ${HIT}`,
    "",
    ...columns(
      [
        [
          `A[hi] = A[${r.hi}] = ${r.vHi}`,
          `${r.vMid} < ${HIT} 이고 ${HIT} <= ${r.vHi} ${tf(inHi)}`,
          `→  ${go(inHi)}`,
        ],
        [
          `A[N-1] = A[${last}] = ${vLast}`,
          `${r.vMid} < ${HIT} 이고 ${HIT} <= ${vLast} ${tf(inLast)}`,
          `→  ${go(inLast)}   ← 이렇게 읽었다면?`,
        ],
      ],
      "     ",
    ),
  ]);
}

function selfcheckTail(): string {
  const runs = anchorRuns();
  const last = runs[3];
  const lo = runs[1];
  if (last === undefined || lo === undefined)
    throw new Error("기준이 모자란다");
  return md(
    ["기준", "답이 맞은 횟수", "후보 구간 밖을 읽은 횟수"],
    [lo, last].map((r) => [
      r.anchor.name,
      `${num(r.ok)} / ${num(r.total)}`,
      num(r.outside),
    ]),
    [1, 2],
  );
}

/* ───────── 입력 대조 ───────── */

// 작은 입력과 전개 입력이 이름대로 만들어졌는지 — 본문이 「3 칸 회전」·「17 칸 회전」이라 부른다.
if (show(SMALL) !== show(rotate(S7, SMALL_K))) {
  throw new Error("작은 입력이 어긋난다");
}
if (breaks(WALK).length !== 1 || breaks(SMALL).length !== 1) {
  throw new Error("끊긴 자리가 하나가 아니다");
}

export const PROOFS: Record<string, () => string> = {
  /** `deep.origin` ② — 선형 탐색과 정렬된 반쪽 가리기의 최악 읽은 칸. */
  "origin-cost": originCost,
  /** `deep.origin` ③ — 정렬만 믿은 이진 탐색이 회전된 배열에서 무엇을 내는가. */
  "plain-binary-search": plainTable,
  "plain-trace": plainTrace,
  /** `deep.origin` ④ — 한 칸 읽기와 두 칸 읽기의 계수와 답. */
  "two-reads": twoReads,
  /** `concept` — 정렬된 반쪽의 값 범위 판정. */
  "concept-range-test": conceptRangeTest,
  /** `deep.build` 먼저 알아 둘 개념 — 읽는 법 · 헷갈리기 쉬운 모양 · 왜 이렇게 생겼는가. */
  "concept-read-one": readOne,
  "concept-confuse-min": confuseMin,
  "concept-endpoints": endpoints,
  /** `deep.build` 단계. */
  "build-start": buildStart,
  "build-cases": buildCases,
  "build-one-sided": oneSidedTable,
  "build-one-sided-trace": oneSidedTrace,
  "build-shrink": buildShrink,
  /** `deep.build` 설계 선택 — 비교 기준 넷. */
  "anchor-choice": anchorTable,
  /** `deep.walk`. */
  "walk-input": walkInput,
  "five-branch-min": coverageTable,
  "walk-init": walkInit,
  "walk-first-read": walkFirstRead,
  "pause-mid-only": midOnlyTable,
  "pause-mid-only-round": midOnlyFirstRound,
  "walk-trace-hit": walkTraceHit,
  "walk-trace-miss": walkTraceMiss,
  "pause-two-cells": pauseTwoCells,
  "duplicate-break": duplicateTable,
  "duplicate-trace": duplicateTrace,
  "final-calls": finalCalls,
  /** `related` — 순환 이동. */
  "related-rotation": relatedRotation,
  /** `deep.math`. */
  "math-check": mathCheck,
  "math-index-row": mathIndexRow,
  "math-code": mathCode,
  "math-closed": mathClosed,
  /** `invariant` — ③ 은 「틀린다」가 아니라 **실제 값**을 내미는 것이 일이다. */
  "invariant-edges": invariantEdges,
  "mutant-strict": strictTable,
  "mutant-strict-trace": strictTrace,
  /** `perf`. */
  "perf-derive-reads": perfDeriveReads,
  "perf-derive-fold": perfDeriveFold,
  "perf-rounds": perfRounds,
  "worst-reads": worstTable,
  "worst-example": worstExample,
  /** `selfcheck`. */
  "selfcheck-t5": selfcheckT5,
  "selfcheck-tail": selfcheckTail,
};
