/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바퀴 안의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본 셋)에서 받고, 큰 입력의
 * 비교 횟수는 같은 사이드카의 가벼운 사본 `cost` 에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/kthSmallest/kthSmallest-guide.md
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { N as ALT_N, compareDesigns } from "./kthSmallest-guide.alt.ts";
import {
  A6,
  BRANCH_MARK,
  cost,
  countedComparisons,
  evenSplit,
  K,
  MID_K,
  minRepeat,
  N,
  num,
  type Round,
  secondsOf,
  show,
  shuffled,
  shuffledLarge,
  sorted,
  sortLowerBound,
  trace,
  walkSteps,
  worstInput,
} from "./kthSmallest-guide.fig.tsx";
import { kthSmallest } from "./kthSmallest-guide.ref.ts";

const REF = new URL("./kthSmallest-guide.ref.ts", import.meta.url).pathname;

type Selector = { kthSmallest(A: number[], k: number): number };

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

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const ratio = (a: number, b: number): string =>
  `${(a / b).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} 배`;

/** 순번 `k` 에서 k 번 최솟값 찾기의 비교 횟수 — 바퀴 `r` 이 남은 `n − 1 − r` 칸을 비교한다. */
const naiveFormula = (n: number, k: number): number =>
  (k * (2 * n - k - 1)) / 2;

// 식이 실제 실행과 같은지 — 칸 1 개부터 40 개까지 모든 순번에서 k 번 최솟값 찾기를 실제로 세어 대조한다.
for (let n = 1; n <= 40; n++) {
  const A = shuffled(n);
  for (let k = 1; k <= n; k++) {
    if (minRepeat(A, k).comparisons !== naiveFormula(n, k)) {
      throw new Error(`k 번 최솟값 찾기의 식이 실행과 다르다 — n ${n} k ${k}`);
    }
  }
}

/** 같은 분할 규칙으로 **양쪽 다** 이어서 가르면 정렬이 된다. 비교만 센다. */
function countSort(src: readonly number[]): number {
  const a = [...src];
  let cmp = 0;
  const go = (lo: number, hi: number): void => {
    if (hi - lo < 1) return;
    const m = lo + Math.floor((hi - lo) / 2);
    [a[m], a[hi]] = [a[hi] as number, a[m] as number];
    const pivot = a[hi] as number;
    let i = lo;
    for (let j = lo; j < hi; j++) {
      cmp++;
      if ((a[j] as number) < pivot) {
        [a[i], a[j]] = [a[j] as number, a[i] as number];
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi] as number, a[i] as number];
    go(lo, i - 1);
    go(i + 1, hi);
  };
  go(0, a.length - 1);
  const want = sorted(src);
  if (a.some((v, t) => v !== want[t])) {
    throw new Error("양쪽을 다 가르는 사본이 정렬을 못 했다");
  }
  return cmp;
}

/* ───────────────────────── 파트 1 — 전체 컨셉 ───────────────────────── */

function conceptFirstSplit(): string {
  const r = trace(A6, K).rounds[0] as Round;
  const small = r.placed.slice(r.lo, r.p);
  const big = r.placed.slice(r.p + 1, r.hi + 1);
  const s = sorted(A6);
  if (s[r.p] !== r.pivot) {
    throw new Error("기준값의 자리가 정렬한 줄과 다르다");
  }
  return [
    md(
      ["구역", "값", "칸 수"],
      [
        [`${r.pivot} 보다 작은 값`, show(small), String(small.length)],
        ["기준값", String(r.pivot), "1"],
        [`${r.pivot} 이상인 값`, show(big), String(big.length)],
      ],
      [2],
    ),
    "",
    `가른 뒤 배열은 ${show(r.placed)} 이고, 기준값 ${r.pivot}${이가(r.pivot)} 놓인 인덱스 ${r.p}${은는(r.p)} 정렬한 줄 ${show(s)} 에서 ${r.pivot}${이가(r.pivot)} 앉는 자리와 같습니다.`,
  ].join("\n");
}

function conceptSum(): string {
  const real = cost(shuffledLarge(), MID_K).comparisons;
  return [
    md(
      ["갈림", `칸 ${num(N)} 개의 비교`],
      [
        ["가장 고른 갈림 — 목표가 든 쪽이 매번 절반", num(evenSplit(N))],
        [`뒤섞인 입력에서 순번 ${num(MID_K)} 을 실제로 실행`, num(real)],
        ["한쪽이 비는 갈림 — 구간이 매번 한 칸만 준다", num((N * (N - 1)) / 2)],
      ],
      [1],
    ),
    "",
    "가운데 줄은 생성식 `A[i] = (i × 7919) mod 100,003` 으로 만든 배열에 정본을 실제로 실행해 센 값이고, 첫 줄과 끝 줄은 갈림 모양을 비용 식에 넣어 센 값입니다.",
  ].join("\n");
}

/* ───────────────── 「아이디어를 떠올리는 과정」 ───────────────── */

function originNaive(): string {
  const rows: [number, number][] = [
    [1_000, 500],
    [N, 1],
    [N, MID_K],
  ];
  return [
    md(
      ["칸 수 n", "순번 k", "비교", "시간(초당 1 억 번)"],
      rows.map(([n, k]) => [
        num(n),
        num(k),
        num(naiveFormula(n, k)),
        secondsOf(naiveFormula(n, k)),
      ]),
      [0, 1, 2, 3],
    ),
    "",
    "바퀴마다 남은 칸을 전부 비교하므로 비교 횟수는 k(2n − k − 1)/2 이고, 칸 1 개부터 40 개까지 모든 순번에서 실제로 세어 이 식과 대조했습니다.",
  ].join("\n");
}

function lowerBounds(): string {
  const whole = sortLowerBound(N);
  const one = N - 1;
  return [
    md(
      [`칸 ${num(N)} 개에서 알아내는 것`, "비교의 하한"],
      [
        ["줄 전체의 순서 — log₂(n!)", num(whole)],
        ["자리 하나 — n − 1", num(one)],
      ],
      [1],
    ),
    "",
    `줄 전체의 순서를 알아내는 쪽이 ${ratio(whole, one)} 많습니다.`,
  ].join("\n");
}

function originRank(): string {
  const s = sorted(A6);
  const picks = [7, 4, 15];
  const rows = picks.map((v) => {
    const smaller = A6.filter((x) => x < v);
    const at = s.indexOf(v);
    if (at !== smaller.length) {
      throw new Error(`${v} 의 자리가 작은 값의 개수와 다르다`);
    }
    return [
      String(v),
      show(sorted(smaller)),
      String(smaller.length),
      String(at),
    ];
  });
  return [
    md(
      ["고른 값", "그보다 작은 값", "개수", "정렬한 줄에서의 인덱스"],
      rows,
      [2, 3],
    ),
    "",
    `정렬한 줄은 ${show(s)} 이고, 세 값 모두 작은 값의 개수가 정렬한 줄의 인덱스와 같습니다.`,
  ].join("\n");
}

function splitVsSort(): string {
  const rows: string[][] = [];
  const both6 = countSort(A6);
  const one6 = countedComparisons(A6, K);
  rows.push([
    `6 (전개 입력, k = ${K})`,
    num(both6),
    num(one6),
    ratio(both6, one6),
  ]);
  for (const n of [16, 64, 256, 1024]) {
    const A = shuffled(n);
    const both = countSort(A);
    const one = countedComparisons(A, n / 2);
    rows.push([num(n), num(both), num(one), ratio(both, one)]);
  }
  return [
    md(
      [
        "칸 수 n",
        "양쪽을 다 가르는 퀵 정렬",
        "목표가 든 쪽만 가르는 퀵셀렉트",
        "차이",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    "첫 줄 말고는 생성식 `A[i] = (i × 7919) mod 10,007` 로 만든 배열에 순번 k = n/2 를 물었습니다.",
  ].join("\n");
}

/* ───────────────────────── 아이디어 상세 ───────────────────────── */

function buildTarget(): string {
  const s = sorted(A6);
  const target = K - 1;
  const answer = kthSmallest([...A6], K);
  return [
    md(
      ["자리 번호", ...s.map((_, i) => String(i))],
      [["정렬한 줄의 값", ...s.map(String)]],
      s.map((_, i) => i + 1),
    ),
    "",
    `k = ${K} 이면 target = ${target} 이고, 그 자리의 값 ${s[target]}${이가(s[target] as number)} 정본의 답 ${answer}${과와(answer)} 같습니다.`,
  ].join("\n");
}

function buildZones(): string {
  const r = trace(A6, K).rounds[0] as Round;
  const rows = r.cmps.map((c) => {
    const small = c.after.slice(r.lo, c.iAfter);
    const big = c.after.slice(c.iAfter, c.j + 1);
    return [
      `j = ${c.j}`,
      String(c.a),
      c.less ? "참" : "거짓",
      small.length === 0 ? "비었다" : show(small),
      big.length === 0 ? "비었다" : show(big),
      show(c.after),
    ];
  });
  return [
    md(
      [
        "읽는 자리",
        "A[j]",
        `A[j] < ${r.pivot}`,
        "작은 쪽",
        "크거나 같은 쪽",
        "배열",
      ],
      rows,
    ),
    "",
    `기준값 ${r.pivot}${을를(r.pivot)} 끝으로 옮긴 ${show(r.moved)} 에서 시작했고, 루프가 끝났을 때 작은 쪽이 ${r.p - r.lo} 칸이라 기준값을 인덱스 ${r.p} 에 놓아 ${show(r.placed)}${이가(r.placed.at(-1) as number)} 됩니다.`,
  ].join("\n");
}

function buildRounds(): string {
  const t = trace(A6, K);
  const rows = t.rounds.map((r, idx) => {
    const nx = r.next;
    return [
      String(idx + 1),
      `[${r.lo},${r.hi}]`,
      String(r.hi - r.lo + 1),
      String(r.pivot),
      String(r.p),
      nx === null
        ? `p = target → ${BRANCH_MARK.found} 반환 ${t.result}`
        : `p ${r.branch === "left" ? ">" : "<"} target → ${BRANCH_MARK[r.branch]} [${nx[0]},${nx[1]}]`,
      String(r.cmps.length),
    ];
  });
  const total = t.rounds.reduce((s, r) => s + r.cmps.length, 0);
  return [
    md(
      ["바퀴", "구간", "칸 수", "기준값", "p", "갈래", "비교"],
      rows,
      [2, 3, 4, 6],
    ),
    "",
    `target = ${t.target} 이고, 비교는 모두 ${total} 번이며 답은 ${t.result} 입니다.`,
  ].join("\n");
}

function premiseMutate(): string {
  const A = [...A6];
  const got = kthSmallest(A, K);
  return [
    `호출 전 A = ${show(A6)}`,
    `kthSmallest(A, ${K}) → ${got}`,
    `호출 뒤 A = ${show(A)}`,
    "  └ 답은 맞고, 배열의 순서는 바뀌었다",
  ].join("\n");
}

function pivotPlaces(): string {
  const inputs: [string, number[]][] = [
    ["정렬된 [0 1 2 3 4 5 6 7]", [0, 1, 2, 3, 4, 5, 6, 7]],
    ["역순 [7 6 5 4 3 2 1 0]", [7, 6, 5, 4, 3, 2, 1, 0]],
    ["뒤섞인 [5 2 8 1 9 3 7 4]", [5, 2, 8, 1, 9, 3, 7, 4]],
    ["전부 같음 [2 2 2 2 2 2 2 2]", [2, 2, 2, 2, 2, 2, 2, 2]],
  ];
  const rows = inputs.map(([name, A]) => [
    name,
    ...(["first", "middle", "last"] as const).map((place) => {
      let sum = 0;
      for (let k = 1; k <= A.length; k++) {
        sum += cost(A, k, place).comparisons;
      }
      return num(sum);
    }),
  ]);
  return [
    md(["입력 (칸 8 개)", "첫 칸", "중앙", "끝 칸"], rows, [1, 2, 3]),
    "",
    "입력마다 순번 k = 1 부터 8 까지 여덟 번을 모두 물어 비교 횟수를 더했습니다.",
  ].join("\n");
}

/* ───────────────── 수행으로 알아보는 알고리즘 ───────────────── */

function walkInput(): string {
  const want = kthSmallest([...A6], K);
  return [
    `const A = [${A6.join(", ")}];`,
    `const k = ${K};`,
    `// 이 절이 끝나면 ${want}${이가(want)} 나와야 한다 (정렬하면 [${sorted(A6).join(", ")}] 의 ${K} 번째)`,
  ].join("\n");
}

function walkTarget(): string {
  const s = sorted(A6);
  const target = K - 1;
  return [
    `k = ${K} 이므로 target = k − 1 = ${target}`,
    `정렬한 줄 ${show(s)} 에서 인덱스 ${target} 의 값은 ${s[target]}`,
  ].join("\n");
}

function walkPivot(): string {
  const r = trace(A6, K).rounds[0] as Round;
  return [
    `${show(r.start)}  lo = ${r.lo}, hi = ${r.hi}  →  m = ${r.lo} + ⌊${r.hi - r.lo}/2⌋ = ${r.m}`,
    `인덱스 ${r.m}${과와(r.m)} ${r.hi}${을를(r.hi)} 맞바꾼다`,
    `${show(r.moved)}  pivot = ${r.pivot}${이가(r.pivot)} hi = ${r.hi} 에 있다`,
  ].join("\n");
}

function walkPartition(): string {
  const r = trace(A6, K).rounds[0] as Round;
  const rows = r.cmps.map((c) => [
    `j = ${c.j}`,
    `\`${c.a} < ${r.pivot}\` ${c.less ? "참" : "거짓"}`,
    c.less ? "①" : "②",
    show(c.after),
    c.less ? `${c.iBefore}→${c.iAfter}` : `${c.iAfter} 그대로`,
  ]);
  return [
    md(["읽는 자리", "비교", "갈래", "비교 뒤 배열", "i"], rows),
    "",
    `${show(r.moved)} 에서 i = ${r.lo} 로 시작했고, 루프가 끝난 뒤 A[${r.p}]${과와(r.p)} A[${r.hi}]${을를(r.hi)} 맞바꿔 ${show(r.placed)}${이가(r.placed.at(-1) as number)} 되며 p = ${r.p} 입니다.`,
  ].join("\n");
}

function walkBranch(): string {
  const t = trace(A6, K);
  const r = t.rounds[0] as Round;
  const nx = r.next as [number, number];
  const gone = r.placed.slice(r.lo, r.p + 1);
  const kept = r.placed.slice(nx[0], nx[1] + 1);
  return [
    `${show(r.placed)}   p = ${r.p},  target = ${t.target}  →  ${r.p} < ${t.target} 이라 ⑤`,
    `  버린다  인덱스 ${r.lo}~${r.p}   값 ${gone.join(" ")}`,
    `  남긴다  인덱스 ${nx[0]}~${nx[1]}   값 ${kept.join(" ")}`,
    `          └ 다음 바퀴가 받는 구간은 ${kept.length} 칸이다`,
  ].join("\n");
}

function walkTrace(): string {
  const t = trace(A6, K);
  const steps = walkSteps(t);
  let at = 0;
  const rows: string[][] = [];
  for (const r of t.rounds) {
    rows.push([
      steps[at++]?.id ?? "",
      `구간 [${r.lo},${r.hi}] 의 중앙 인덱스 ${r.m}, 값 ${r.pivot}`,
      "기준값을 끝으로",
      show(r.moved),
      String(r.lo),
    ]);
    for (const c of r.cmps) {
      rows.push([
        steps[at++]?.id ?? "",
        `j = ${c.j}`,
        `\`${c.a} < ${r.pivot}\` ${c.less ? "**참** → ①" : "**거짓** → ②"}`,
        show(c.after),
        c.less ? `${c.iBefore}→${c.iAfter}` : String(c.iAfter),
      ]);
    }
    rows.push([
      steps[at++]?.id ?? "",
      "기준값을 경계 자리로",
      `p = ${r.p}${이가(r.p)} 값 ${r.pivot} 의 최종 자리`,
      show(r.placed),
      String(r.p),
    ]);
    const nx = r.next;
    rows.push([
      steps[at++]?.id ?? "",
      "갈래를 고른다",
      nx === null
        ? `\`${r.p} = ${t.target}\` → ③ 반환 ${t.result}`
        : `\`${r.p} ${r.branch === "left" ? ">" : "<"} ${t.target}\` → ${BRANCH_MARK[r.branch]} 다음 구간 [${nx[0]},${nx[1]}]`,
      show(r.placed),
      "—",
    ]);
  }
  if (at !== steps.length) {
    throw new Error("표의 걸음 수가 걸음 재생 패널과 다르다");
  }
  return md(["단계", "무슨 일", "조건", "배열", "i"], rows);
}

function walkBranches(): string {
  const t = trace(A6, K);
  const steps = walkSteps(t);
  const ids: Record<string, string[]> = {
    "①": [],
    "②": [],
    "③": [],
    "④": [],
    "⑤": [],
  };
  let at = 0;
  for (const r of t.rounds) {
    at++;
    for (const c of r.cmps) {
      ids[c.less ? "①" : "②"]?.push(steps[at++]?.id ?? "");
    }
    at++;
    ids[BRANCH_MARK[r.branch]]?.push(steps[at++]?.id ?? "");
  }
  if (Object.values(ids).some((l) => l.length === 0)) {
    throw new Error("다섯 갈래 중 실행되지 않은 갈래가 있다");
  }
  const names: Record<string, string> = {
    "①": "작다",
    "②": "크거나 같다",
    "③": "자리가 같다",
    "④": "목표가 앞",
    "⑤": "목표가 뒤",
  };
  const rows = Object.entries(ids).map(([mark, list]) => [
    mark,
    names[mark] as string,
    list.join(" · "),
  ]);
  const sizes = t.rounds.map((r) => r.hi - r.lo + 1);
  const total = t.rounds.reduce((s, r) => s + r.cmps.length, 0);
  return [
    md(["갈래", "뜻", "실행된 걸음"], rows),
    "",
    `비교는 ${sizes.map((n) => `(${n} − 1)`).join(" + ")} = ${total} 번이고, 반환값은 ${t.result} 입니다.`,
  ].join("\n");
}

/**
 * 「오른쪽으로 갈 때 순번을 다시 센다」는 오해를 정본에 그대로 옮긴 사본. 오해는 두 자리를 바꾼다 —
 * `target` 을 고칠 수 있게 `const` 를 `let` 으로 두는 것과, 오른쪽으로 갈 때 버린 칸 수만큼 `target` 을
 * 당기는 것. 앞의 것은 값을 바꾸지 않으므로 정본 소스에서 그 한 줄만 바꾼 사본을 임시 파일로 두고,
 * 뒤의 것을 그 사본 위에 `loadMutant` 로 건다.
 */
function letTargetSource(): string {
  const lines = readFileSync(REF, "utf8").split("\n");
  const LINE = /^(\s*)const target = k - 1;$/;
  if (lines.filter((l) => LINE.test(l)).length !== 1) {
    throw new Error("정본에서 target 을 정하는 줄이 하나가 아니다");
  }
  const dir = mkdtempSync(join(tmpdir(), "kth-let-"));
  const path = join(dir, basename(REF));
  writeFileSync(
    path,
    lines.map((l) => l.replace(LINE, "$1let target = k - 1;")).join("\n"),
    "utf8",
  );
  return path;
}

const relative = await loadMutant<Selector>(letTargetSource(), {
  swap: [
    /^(\s*)else lo = i \+ 1;$/,
    "$1else {\n$1  target = target - (i + 1 - lo);\n$1  lo = i + 1;\n$1}",
  ],
});

function pauseRelative(): string {
  const good = kthSmallest([...A6], K);
  const bad = relative.kthSmallest([...A6], K);
  const t = trace(A6, K);
  const r1 = t.rounds[0] as Round;
  const r2 = t.rounds[1] as Round;
  const shifted = t.target - (r1.p + 1 - r1.lo);
  // 오해대로 하면 둘째 바퀴의 p 가 당겨진 target 보다 크다 — 그래서 hi 가 lo 아래로 내려가 반복이 끝난다.
  // 중화 실행에서는 사본이 정본처럼 움직이므로 이 검사를 건너뛴다.
  if (bad !== good && !(r2.p > shifted && bad === r2.placed[r2.lo])) {
    throw new Error("오해대로 한 사본의 둘째 바퀴가 본문의 서사와 다르다");
  }
  const rows = [
    [
      "1",
      `구간 [${r1.lo},${r1.hi}] · p = ${r1.p} < ${t.target} → [${r1.p + 1},${r1.hi}], target ${t.target}`,
      `구간 [${r1.lo},${r1.hi}] · p = ${r1.p} < ${t.target} → [${r1.p + 1},${r1.hi}], target ${t.target} − ${r1.p + 1 - r1.lo} = ${shifted}`,
    ],
    [
      "2",
      `구간 [${r2.lo},${r2.hi}] · p = ${r2.p} < ${t.target} → [${r2.p + 1},${r2.hi}]`,
      `구간 [${r2.lo},${r2.hi}] · p = ${r2.p} > ${shifted} → hi = ${r2.p - 1} 이 lo = ${r2.lo} 보다 작아 반복이 끝난다`,
    ],
  ];
  return [
    md(["바퀴", "바른 코드", "오해대로 한 코드"], rows),
    "",
    `바른 코드는 두 바퀴를 더 돌아 ${good}${을를(good)} 돌려주고, 오해대로 한 코드는 A[${r2.lo}] = ${bad}${을를(bad)} 돌려줍니다.`,
  ].join("\n");
}

/** 비교 기호를 `<=` 로 바꾸고 비교 줄에서 비교 횟수를 세는 사본 — 같은 값이 전부 작은 쪽으로 간다. */
const lessEq = await loadMutant<Selector>(REF, {
  swap: [
    /^(\s*)if \(\(A\[j\] as number\) < pivot\) \{$/,
    "$1(globalThis as any).__kthLe++;\n$1if ((A[j] as number) <= pivot) {",
  ],
});

function lessEqComparisons(A: readonly number[], k: number): number {
  const g = globalThis as unknown as { __kthLe: number };
  g.__kthLe = 0;
  const out = lessEq.kthSmallest([...A], k);
  if (out !== kthSmallest([...A], k)) {
    throw new Error("<= 사본이 다른 답을 냈다");
  }
  return g.__kthLe;
}

function pauseDup(): string {
  const A = [2, 1, 2, 1, 3, 1];
  const k = 4;
  const t = trace(A, k);
  const r = t.rounds[0] as Round;
  const s = sorted(A);
  const lessCount = r.cmps.filter((c) => c.less).length;
  const sameRight = r.placed.slice(r.p + 1).filter((v) => v === r.pivot).length;
  return [
    `${show(A)}  k = ${k}  → 정렬하면 ${show(s)} 이라 답은 ${s[k - 1]}`,
    "",
    `  구간 [${r.lo},${r.hi}]  중앙은 인덱스 ${r.m}, 값 ${r.pivot}${을를(r.pivot)} 끝으로 → ${show(r.moved)}`,
    `    ${r.cmps.map((c) => c.a).join(" · ")} 중 ${r.pivot} 보다 작은 값이 ${lessCount} 개 → p = ${r.p}`,
    `    가른 뒤 ${show(r.placed)}  같은 값 ${r.pivot}${이가(r.pivot)} 오른쪽 구역에 ${sameRight} 개 남았다`,
    `  target = ${t.target} 이라 p = target → A[${r.p}] = ${t.result}${을를(t.result)} 돌려준다`,
  ].join("\n");
}

function pauseAllEqual(): string {
  const A = [2, 2, 2, 2, 2, 2, 2, 2];
  const n = A.length;
  const rows = [1, n].map((k) => [
    `k = ${k}`,
    num(countedComparisons(A, k)),
    num(lessEqComparisons(A, k)),
  ]);
  return [
    md(["묻는 순번", "`A[j] < pivot`", "`A[j] <= pivot`"], rows, [1, 2]),
    "",
    `${show(A)} 에서 센 비교 횟수이고, 네 경우 모두 답은 ${kthSmallest([...A], 1)} 이며 비교가 가장 많을 때는 n(n−1)/2 = ${num((n * (n - 1)) / 2)} 번입니다.`,
  ].join("\n");
}

function finalCalls(): string {
  const calls: [number[], number][] = [
    [A6, K],
    [[42], 1],
    [[5, 5, 5, 5], 3],
    [[-5, 0, 5, -10, 10], 1],
  ];
  const left = calls.map(([A, k]) => `kthSmallest([${A.join(", ")}], ${k})`);
  const w = Math.max(...left.map(width));
  return calls
    .map(
      ([A, k], i) =>
        `${pad(left[i] as string, w)}   →   ${kthSmallest([...A], k)}`,
    )
    .join("\n");
}

/* ───────────────────────── 파트 2 ───────────────────────── */

function altCrossover(): string {
  const LIMIT = 64;
  const pair = (n: number) => {
    const r = compareDesigns(worstInput(n), n);
    if (r.guide.cmp !== cost(worstInput(n), n).comparisons) {
      throw new Error(`대조용 사본의 비교 횟수가 정본과 다르다 — n ${n}`);
    }
    return r;
  };
  // 중앙값의 중앙값이 처음 적어지는 칸 수와, 퀵셀렉트가 마지막으로 적거나 같은 칸 수를 실행에서 찾는다.
  let first = 0;
  let lastGuide = 0;
  for (let n = 2; n <= LIMIT; n++) {
    const r = pair(n);
    if (r.mom.cmp < r.guide.cmp) {
      if (first === 0) first = n;
    } else {
      lastGuide = n;
    }
  }
  const shown = [...new Set([6, first - 1, first, lastGuide, lastGuide + 1])];
  const rows = shown.map((n) => {
    const r = pair(n);
    return [num(n), num(r.guide.cmp), num(r.mom.cmp)];
  });
  const s = compareDesigns(shuffled(ALT_N), ALT_N / 2);
  const w = compareDesigns(worstInput(ALT_N), ALT_N);
  return [
    md(["칸 수 n", "퀵셀렉트", "중앙값의 중앙값"], rows, [0, 1, 2]),
    "",
    `역산한 입력 worstInput(n) 에 k = n 을 물은 비교 횟수입니다. 중앙값의 중앙값이 처음 적어지는 것은 n = ${first} 이고, 퀵셀렉트가 마지막으로 적은 것은 n = ${lastGuide} 이며, n = ${lastGuide + 1} 부터 ${LIMIT} 까지는 모두 중앙값의 중앙값이 적습니다. 칸 ${num(ALT_N)} 개의 뒤섞인 입력에서는 퀵셀렉트가 ${ratio(s.mom.cmp, s.guide.cmp)} 적고(비교 ${num(s.mom.cmp - s.guide.cmp)} 번 차이), 역산한 입력에서는 ${ratio(w.guide.cmp, w.mom.cmp)} 많습니다.`,
  ].join("\n");
}

/** 점화식 C(n) = (n − 1) + C(s) — `side` 가 s 를 정한다. */
const C = (n: number, side: (n: number) => number): number =>
  n <= 1 ? 0 : n - 1 + C(side(n), side);

function mathCheck(): string {
  const t = trace(A6, K);
  const sizes = t.rounds.map((r) => r.hi - r.lo + 1);
  const real = t.rounds.reduce((s, r) => s + r.cmps.length, 0);
  const byRecurrence = sizes.reduce((s, n) => s + n - 1, 0);
  if (byRecurrence !== real) {
    throw new Error("점화식에 구간 크기를 넣은 값이 전개의 비교 횟수와 다르다");
  }
  const even = C(6, (n) => Math.floor(n / 2));
  const empty = C(6, (n) => n - 1);
  return [
    `C(${sizes[0]}) = ${sizes.map((n) => n - 1).join(" + ")} + C(1) = ${real}`,
    `       └ 구간이 ${sizes.join(" → ")} 로 줄었고, 전개에서 센 ${real} 번과 같다`,
    "",
    "같은 식에 두 극단을 넣으면",
    `  가장 고른 갈림  s = ⌊n/2⌋   C(6) = ${even}`,
    `  한쪽이 빈다     s = n − 1   C(6) = ${empty}`,
    `       └ 실제 ${real}${은는(real)} 그 사이에 있다`,
  ].join("\n");
}

function mathCode(): string {
  const a = C(6, (n) => Math.floor(n / 2));
  const b = C(6, (n) => n - 1);
  const c = C(8, (n) => Math.floor(n / 2));
  if (b !== cost(worstInput(6), 6).comparisons) {
    throw new Error(
      "한쪽이 비는 갈림의 값이 최악 입력의 실제 비교 횟수와 다르다",
    );
  }
  return [
    "const C = (n: number, side: (n: number) => number): number =>",
    "  n <= 1 ? 0 : n - 1 + C(side(n), side);",
    "",
    `C(6, (n) => Math.floor(n / 2)); // 가장 고른 갈림 → ${a}`,
    `C(6, (n) => n - 1); // 한쪽이 빈다 → ${b}`,
    `C(8, (n) => Math.floor(n / 2)); // 가장 고른 갈림 → ${c}`,
  ].join("\n");
}

function mathClosedCheck(): string {
  return [6, 8]
    .map((n) => {
      const real = cost(worstInput(n), n).comparisons;
      const closed = (n * (n - 1)) / 2;
      if (real !== closed) {
        throw new Error("닫힌 형태가 최악 입력의 실제 비교 횟수와 다르다");
      }
      return `n = ${n}  →  ${n}·${n - 1}/2 = ${closed}    worstInput(${n}) 에 k = ${n}${을를(n)} 실제로 물은 비교 ${real} 번`;
    })
    .join("\n");
}

function mathPow2(): string {
  const rows = [0, 1, 2, 3, 10].map((t) => {
    const n = 2 ** t;
    const closed = 2 ** (t + 1) - t - 2;
    if (closed !== evenSplit(n)) {
      throw new Error(`t = ${t} 에서 닫힌 형태가 점화식과 다르다`);
    }
    return [String(t), num(n), num(closed), num(evenSplit(n))];
  });
  return md(
    ["t", "n = 2^t", "2^(t+1) − t − 2", "점화식으로 센 값"],
    rows,
    [0, 1, 2, 3],
  );
}

function costExtremes(): string {
  for (let n = 1; n <= 2000; n++) {
    if (evenSplit(n) > 2 * n - 2) {
      throw new Error(`n ${n} 에서 상한 2n − 2 를 넘었다`);
    }
  }
  const rows = [8, 16, 1024, N].map((n) => [
    num(n),
    num(evenSplit(n)),
    num(2 * n - 2),
    num((n * (n - 1)) / 2),
    ratio((n * (n - 1)) / 2, evenSplit(n)),
  ]);
  return [
    md(
      ["칸 수 n", "가장 고른 갈림", "상한 2n − 2", "한쪽이 비는 갈림", "차이"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    "가장 고른 갈림이 상한 2n − 2 를 넘지 않는 것은 칸 1 개부터 2,000 개까지 점화식으로 모두 세어 확인했습니다.",
  ].join("\n");
}

/** 경계에 있는 입력 — 결과는 정본이 내고, 처리되는 자리는 기록에서 읽는다. */
function invariantEdges(): string {
  const cases: [string, number[], number, string][] = [
    ["칸 하나", [42], 1, ""],
    ["칸 둘", [10, 5], 1, ""],
    ["k = 1", [...A6], 1, "최솟값"],
    ["k = n", [...A6], A6.length, "최댓값"],
    ["전부 같음", [5, 5, 5, 5], 3, ""],
    ["중복 경계", [1, 1, 2], 2, ""],
    ["값 범위 끝", [1_000_000_000, -1_000_000_000, 0], 2, ""],
  ];
  const rows = cases.map(([name, A, k, note]) => {
    const t = trace(A, k);
    const got = kthSmallest([...A], k);
    if (got !== sorted(A)[k - 1]) {
      throw new Error(`${name} 의 답이 정렬한 줄과 다르다`);
    }
    const where =
      t.rounds.length === 0
        ? "lo = hi = 0 이라 반복에 들어가지 않는다"
        : `바퀴 ${t.rounds.length} 번 · 구간 ${t.rounds.map((r) => r.hi - r.lo + 1).join(" → ")} 칸`;
    return [
      `${name} ${show(A)}, k = ${k}`,
      where,
      note === "" ? String(got) : `${got} (${note})`,
    ];
  });
  rows.push([
    "빈 배열 [], k = 1",
    "hi = −1 이라 반복에 들어가지 않고 A[0] 을 읽는다",
    `${String(kthSmallest([], 1))} — 값이 없다`,
  ]);
  return md(["입력", "처리되는 자리", "결과"], rows);
}

/**
 * 불변식을 세우던 줄(`const target = k - 1;`) 하나만 바꾼 사본. **정본 소스에서 기계로
 * 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const broken = await loadMutant<Selector>(REF, {
  swap: [/const target = k - 1;/, "const target = k;"],
});

const MUTANT_INPUTS: [number[], number][] = [
  [[...A6], 4],
  [[3, 1, 2], 1],
  [[-5, 0, 5, -10, 10], 1],
  [[...A6], 6],
];

function mutantTarget(): string {
  // 중화 실행에서는 `broken` 이 정본과 같은 함수다 — 그때는 「답이 바뀐다」 검사를 건너뛴다.
  const neutral = broken.kthSmallest === kthSmallest;
  const rows = MUTANT_INPUTS.map(([A, k]) => [
    show(A),
    String(k),
    String(kthSmallest([...A], k)),
    String(broken.kthSmallest([...A], k)),
  ]);
  if (!neutral && rows.slice(0, 3).some((r) => r[2] === r[3])) {
    throw new Error(
      "변이가 앞 세 입력의 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
  const [lastA, lastK] = MUTANT_INPUTS[3] as [number[], number];
  const lastBad = broken.kthSmallest([...lastA], lastK);
  if (!neutral && lastBad !== lastA[lastA.length]) {
    throw new Error("k = n 에서 바꾼 코드가 배열 밖을 읽지 않았다");
  }
  return [
    md(["입력", "k", "바른 코드", "target = k 로 바꾼 코드"], rows, [1, 2, 3]),
    "",
    `마지막 줄은 k = n 이라 바꾼 코드의 target = ${lastK}${이가(lastK)} 배열 밖을 가리키고, 바꾼 코드는 구간이 배열 끝을 넘어간 뒤 A[${lastA.length}]${을를(lastA.length)} 읽으므로 값이 나오지 않습니다(${String(lastBad)}).`,
  ].join("\n");
}

function mutantTrace(): string {
  const A = [3, 1, 2];
  const k = 1;
  const good = trace(A, k);
  // `target = k` 는 순번을 하나 뒤로 민 것과 같다 — 정본에 k + 1 을 물은 기록이 곧 바꾼 코드의 기록이다.
  const moved = trace(A, k + 1);
  const neutral = broken.kthSmallest === kthSmallest;
  if (!neutral && broken.kthSmallest([...A], k) !== moved.result) {
    throw new Error("바꾼 코드가 순번을 하나 민 정본과 다른 답을 냈다");
  }
  const r = good.rounds[0] as Round;
  const second = moved.rounds[1];
  const badTail =
    second === undefined
      ? `칸 하나 남은 A[${moved.leftover}] = ${moved.result}${을를(moved.result)} 돌려준다`
      : `거기서 p = ${second.p}${이가(second.p)} 되어 A[${second.p}] = ${moved.result}${을를(moved.result)} 돌려준다`;
  return [
    `${show(A)}  k = ${k}  을 두 코드로`,
    "",
    `  두 코드의 첫 분할은 같다. 기준값 ${r.pivot}${이가(r.pivot)} 끝으로 가고 ${show(r.placed)} 이 되어 p = ${r.p}${josa(r.p, "이다", "다")}`,
    "",
    `  바른 코드   target = ${good.target}   p = ${r.p}${이가(r.p)} 곧 목표 자리라 A[${r.p}] = ${good.result}${을를(good.result)} 돌려준다`,
    `  바꾼 코드   target = ${moved.target}   p = ${r.p} < ${moved.target} 이라 오른쪽 [${r.p + 1},${r.hi}] 로 가고, ${badTail}`,
    `              └ 정렬한 줄 ${show(sorted(A))} 의 자리 ${moved.target}${은는(moved.target)} ${moved.result}${josa(moved.result, "이다", "다")}. k = ${k + 1} 의 답을 낸 것이다`,
  ].join("\n");
}

function perfDerive(): string {
  const t = trace(A6, K);
  const steps = walkSteps(t);
  let at = 0;
  const rows: string[][] = [];
  for (const r of t.rounds) {
    at++;
    const ids = r.cmps.map(() => steps[at++]?.id ?? "");
    at += 2;
    rows.push([
      `[${r.lo},${r.hi}]`,
      String(r.hi - r.lo + 1),
      String(r.cmps.length),
      ids.join(" · "),
    ]);
  }
  const total = t.rounds.reduce((s, r) => s + r.cmps.length, 0);
  return [
    md(["구간", "칸 수", "비교", "걸음"], rows, [1, 2]),
    "",
    `바퀴마다 비교는 칸 수보다 하나 적고, 합은 ${total} 번입니다.`,
  ].join("\n");
}

/** n = 8 의 모든 순열. */
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

function averageByK(): string {
  const all = [...permutations([0, 1, 2, 3, 4, 5, 6, 7])];
  const bound = (8 * 7) / 2;
  const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => {
    let sum = 0;
    let worst = 0;
    let best = Number.POSITIVE_INFINITY;
    let atBound = 0;
    for (const p of all) {
      const c = cost(p, k).comparisons;
      sum += c;
      if (c > worst) worst = c;
      if (c < best) best = c;
      if (c === bound) atBound++;
    }
    return [
      `k = ${k}`,
      (sum / all.length).toFixed(2),
      num(best),
      num(worst),
      num(atBound),
    ];
  });
  return [
    md(
      [
        "묻는 순번",
        "평균 비교",
        "가장 적을 때",
        "가장 많을 때",
        `${bound} 번을 내는 순열`,
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `칸 8 개의 순열 ${num(all.length)} 개를 순번마다 전부 실행했습니다.`,
  ].join("\n");
}

function averageLarge(): string {
  const SEED = 20260903;
  let seed = SEED;
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
          [a[i], a[j]] = [a[j] as number, a[i] as number];
        }
        sum += cost(a, k).comparisons;
      }
      cells.push(`${(sum / TRIALS / n).toFixed(2)} n`);
    }
    rows.push(cells);
  }
  return [
    md(["칸 수 n", "k = 1", "k = n/2 + 1", "k = n"], rows, [0, 1, 2, 3]),
    "",
    `순열은 씨앗 ${SEED}${으로(SEED)} 시작하는 선형 합동 생성기(곱 1103515245 · 더함 12345 · 법 2^31)로 섞었고, 칸 수마다 ${TRIALS} 벌을 실행해 비교 횟수의 평균을 n 으로 나눴습니다.`,
  ].join("\n");
}

function worstInputBlock(): string {
  const rows: string[][] = [6, 8, 16, 1024].map((n) => {
    const A = worstInput(n);
    return [
      `worstInput(${num(n)})${n <= 8 ? ` ${show(A)}` : ""}`,
      num(n),
      num(n),
      num(cost(A, n).comparisons),
      num((n * (n - 1)) / 2),
    ];
  });
  const same = new Array<number>(1024).fill(5);
  rows.push([
    "전부 같은 값 [5 5 … 5]",
    num(1024),
    num(1024),
    num(cost(same, 1024).comparisons),
    num((1024 * 1023) / 2),
  ]);
  const roll = Array.from({ length: 1024 }, (_, i) => (i + 512) % 1024);
  const rolled = cost(roll, 513).comparisons;
  const bound = (1024 * 1023) / 2;
  rows.push([
    "np.roll(arange(1024), 512)",
    num(1024),
    num(513),
    num(rolled),
    num(bound),
  ]);
  return [
    md(
      ["입력", "칸 수 n", "묻는 순번", "비교", "n(n−1)/2"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `np.roll 입력의 비교 ${num(rolled)} 번은 상한 ${num(bound)} 번의 ${((rolled / bound) * 100).toFixed(1)} % 입니다.`,
  ].join("\n");
}

function selfcheckEarly(): string {
  const t = trace(A6, K);
  const per = t.rounds.map((r) => r.cmps.length);
  const real = per.reduce((s, x) => s + x, 0);
  const kept = per.slice(0, 3);
  const hypo = kept.reduce((s, x) => s + x, 0);
  return md(
    ["경우", "바퀴마다 비교", "합", "분할 횟수"],
    [
      ["실제", per.join(" + "), String(real), String(per.length)],
      [
        "셋째 바퀴에서 p = target",
        kept.join(" + "),
        String(hypo),
        String(kept.length),
      ],
    ],
    [2, 3],
  );
}

/* ───────────────────────── 블록 ───────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 기준값 하나로 가른 세 구역. */
  "concept-first-split": conceptFirstSplit,
  /** `concept` — 칸 10 만 개에서 갈림 모양에 따른 비교 횟수. */
  "concept-sum": conceptSum,
  /** `deep.origin` ② — k 번 최솟값 찾기의 비교 횟수. */
  "origin-naive": originNaive,
  /** `deep.origin` ② — 줄 전체의 순서와 자리 하나의 비교 하한. */
  "lower-bounds": lowerBounds,
  /** `deep.origin` ③ — 값의 자리는 그보다 작은 값의 개수다. */
  "origin-rank": originRank,
  /** `deep.origin` ④ — 같은 분할로 양쪽을 다 가를 때와 한쪽만 가를 때. */
  "split-vs-sort": splitVsSort,
  /** `deep.build` 1단계 — target 이 가리키는 자리. */
  "build-target": buildTarget,
  /** `deep.build` 2단계 — 첫 바퀴의 두 구역. */
  "build-zones": buildZones,
  /** `deep.build` 3단계 — 바퀴마다 구간과 갈래. */
  "build-rounds": buildRounds,
  /** `deep.build` 전제 — 입력을 제자리에서 고친다. */
  "premise-mutate": premiseMutate,
  /** `deep.build` 설계 선택 — 기준값을 고르는 자리 셋. */
  "pivot-places": pivotPlaces,
  /** `deep.walk` 도입 — 고정 입력. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 순번을 자리 번호로. */
  "walk-target": walkTarget,
  /** `deep.walk` 2 — 기준값을 끝으로. */
  "walk-pivot": walkPivot,
  /** `deep.walk` 3 — 첫 바퀴의 분할 루프. */
  "walk-partition": walkPartition,
  /** `deep.walk.pause` — 순번을 상대 번호로 다시 세는 오해. */
  "pause-relative": pauseRelative,
  /** `deep.walk` 4 — 첫 갈래. */
  "walk-branch": walkBranch,
  /** `deep.walk` 5 — 스물세 걸음 전부. */
  "walk-trace": walkTrace,
  /** `deep.walk` 5 — 갈래 다섯의 피복과 비교 합. */
  "walk-branches": walkBranches,
  /** `deep.walk.pause` — 같은 값이 여럿인 입력. */
  "pause-dup": pauseDup,
  /** `deep.walk.pause` — 값이 전부 같은 입력의 비교 횟수. */
  "pause-all-equal": pauseAllEqual,
  /** `deep.walk.final` — 전체 코드에 네 입력을 넣은 답. */
  "final-calls": finalCalls,
  /** `purpose.alt` — 뒤집히는 칸 수와 규모별 비. */
  "alt-crossover": altCrossover,
  /** `deep.math` ② — 점화식 검산. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드와 그 값. */
  "math-code": mathCode,
  /** `deep.math` ③ — 닫힌 형태 n(n−1)/2 의 검산. */
  "math-closed-check": mathClosedCheck,
  /** `deep.math` ③ — 2 의 거듭제곱에서 닫힌 형태와 점화식. */
  "math-pow2": mathPow2,
  /** `deep.math` ④ — 두 극단에 규모를 넣는다. */
  "cost-extremes": costExtremes,
  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — target 을 k 로 바꾼 사본. */
  "mutant-target": mutantTarget,
  /** `invariant` ③ — [3 1 2] 에서 두 코드의 자취. */
  "mutant-trace": mutantTrace,
  /** `perf.derive` — 바퀴마다 비교와 T#. */
  "perf-derive": perfDerive,
  /** `perf.bounds` — n = 8 의 모든 순열. */
  "average-by-k": averageByK,
  /** `perf.bounds` — 규모를 키운 평균. */
  "average-large": averageLarge,
  /** `perf.worst` — 역산한 입력과 다른 입력. */
  "worst-input": worstInputBlock,
  /** `selfcheck` — 셋째 바퀴에서 끝났다면. */
  "selfcheck-early": selfcheckEarly,
};
