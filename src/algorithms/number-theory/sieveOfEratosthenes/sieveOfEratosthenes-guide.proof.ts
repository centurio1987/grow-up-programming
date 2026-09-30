/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 걸음 기록과 여러 판의 체는 그림 사이드카(`-guide.fig.tsx`)의 것을 쓴다 — 그림과 표가 같은 기록을
 * 쓰고, 그 기록의 답은 거기서 정본과 대조한다.
 *
 *   bun run tools/check-proof.ts src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./sieveOfEratosthenes-guide.alt.ts";
import {
  approachCounts,
  assertSame,
  byTrialDivision,
  CROSS_ALL,
  CROSS_PRIMES,
  counted,
  LIMIT,
  leastPrimeFactor,
  list,
  num,
  once,
  REF_KNOBS,
  seconds,
  show,
  sieveWith,
  WALK_N,
  walk,
} from "./sieveOfEratosthenes-guide.fig.tsx";
import { sieveOfEratosthenes } from "./sieveOfEratosthenes-guide.ref.ts";

const REF = new URL("./sieveOfEratosthenes-guide.ref.ts", import.meta.url)
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

const pct = (a: number, b: number): string => ((a / b) * 100).toFixed(1);

/** 수 `n` 이하의 소수. 식의 항을 세는 데 쓴다. */
const primesUpTo = (n: number): number[] => sieveOfEratosthenes(n);

/** 소수 `p` 가 상한 `n` 에서 지우는 칸 — `p²` 부터 `p` 씩. */
function multiplesFromSquare(p: number, n: number): number[] {
  const out: number[] = [];
  for (let j = p * p; j <= n; j += p) out.push(j);
  return out;
}

/** 닫힌 형태 `W(n) = Σ_{p ≤ √n} (⌊n/p⌋ − p + 1)`. */
function closedForm(n: number): number {
  return primesUpTo(Math.floor(Math.sqrt(n))).reduce(
    (sum, p) => sum + Math.floor(n / p) - p + 1,
    0,
  );
}

/** 시행 나눗셈의 계수 — 큰 상한은 한 번만 잰다. */
const trialOf = (n: number) =>
  once(`trial-${n}`, () => {
    const t = byTrialDivision(n);
    assertSame(n, t.primes);
    return t;
  });

/** 정본과 같은 판의 계수 — 큰 상한은 한 번만 잰다. */
const countOf = (n: number) => once(`count-${n}`, () => counted(n));

/* ───────────────────────── 변이 ────────────────────────── */

interface Impl {
  sieveOfEratosthenes(n: number): number[];
}

const INNER_LOOP =
  /for \(let j = i \* i; j <= n; j \+= i\) isComposite\[j\] = true;/;
const COLLECT_LOOP =
  /for \(let k = 2; k <= n; k\+\+\) if \(!isComposite\[k\]\) primes\.push\(k\);/;

/** 지워진 `i` 를 건너뛰는 줄을 뺀 사본. 답은 안 바뀌고 지우기만 는다. */
const noSkip = await loadMutant<Impl>(REF, {
  drop: /^\s*if \(isComposite\[i\]\) continue;$/,
});

/**
 * 안쪽 루프가 `i` 간격이 아니라 한 칸씩 나아가는 사본. 불변식(지운 칸은 전부 합성수다)을 지키던
 * 바로 그 줄이다.
 */
const stepByOne = await loadMutant<Impl>(REF, {
  swap: [INNER_LOOP, "for (let j = i * i; j <= n; j++) isComposite[j] = true;"],
});

/** 수집 루프가 바깥 루프와 같은 상한에서 멈추는 사본. */
const collectToRoot = await loadMutant<Impl>(REF, {
  swap: [
    COLLECT_LOOP,
    "for (let k = 2; k * k <= n; k++) if (!isComposite[k]) primes.push(k);",
  ],
});

/** 수집 루프가 `0` 부터 시작하는 사본. */
const collectFromZero = await loadMutant<Impl>(REF, {
  swap: [
    COLLECT_LOOP,
    "for (let k = 0; k <= n; k++) if (!isComposite[k]) primes.push(k);",
  ],
});

/**
 * 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다. 중화 실행에서는 변이 모듈이 정본
 * 그대로라 이 검사를 건너뛴다(SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
 */
function assertBreaks(m: Impl, gaps: number[]): void {
  const neutral = m.sieveOfEratosthenes === sieveOfEratosthenes;
  if (!neutral && gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 변이의 답을 나란히 놓은 표를 만든다. */
function contrast(ns: number[], m: Impl, otherHead: string): string {
  const gaps: number[] = [];
  const rows = ns.map((n) => {
    const bare = sieveOfEratosthenes(n);
    const got = m.sieveOfEratosthenes(n);
    const same = bare.join(",") === got.join(",");
    gaps.push(same ? 0 : 1);
    return [`n = ${n}`, show(bare), show(got), same ? "같다" : "어긋난다"];
  });
  assertBreaks(m, gaps);
  return md(["상한", "정본이 낸 답", otherHead, "두 답의 판정"], rows);
}

/* ───────────────────────── 전체 컨셉 ───────────────────────── */

function conceptCount(): string {
  const n = WALK_N;
  const w = walk(n);
  const rows: string[][] = [];
  let total = 0;
  let fresh = 0;
  for (const e of w.events) {
    if (e.kind !== "mark") continue;
    total += e.cells.length;
    fresh += e.fresh.length;
    rows.push([
      String(e.p),
      String(e.p * e.p),
      list(e.cells),
      String(e.cells.length),
      String(e.fresh.length),
    ]);
  }
  const last = w.primes.at(-1) as number;
  return [
    md(
      ["소수 p", "지우기 시작 칸 p²", "지운 칸", "지우기 횟수", "처음 지운 칸"],
      rows,
      [0, 1, 3, 4],
    ),
    "",
    `지우기 ${total} 번 중 ${total - fresh} 번은 이미 지운 칸을 다시 지운 것입니다. 한 번도 지워지지 않은 칸 ${w.primes.length} 개, ${list(w.primes)}${이가(last)} 답입니다.`,
  ].join("\n");
}

function conceptScale(): string {
  const rows = [WALK_N, LIMIT].map((n) => {
    const t = trialOf(n);
    const c = countOf(n);
    return [num(n), num(t.divisions), num(c.ops)];
  });
  const small = trialOf(WALK_N).divisions < countOf(WALK_N).ops;
  const big = trialOf(LIMIT).divisions / countOf(LIMIT).ops;
  if (!small || big < 1) throw new Error("규모에 따라 순서가 뒤집히지 않는다");
  return [
    md(
      [
        "상한 n",
        "수마다 나눠 보기의 나눗셈",
        "에라토스테네스의 체의 기본 연산",
      ],
      rows,
      [0, 1, 2],
    ),
    "",
    `상한 ${WALK_N} 에서는 체가 더 많이 들고, 상한 ${num(LIMIT)} 에서는 체가 ${big.toFixed(1)} 배 적습니다.`,
  ].join("\n");
}

/* ───────────────────────── 아이디어를 떠올리는 과정 ───────────────────────── */

function originNaiveCost(): string {
  const scales = [WALK_N, 1_000, 10_000, 100_000, 1_000_000, LIMIT];
  const rows = scales.map((n) => {
    const t = trialOf(n);
    return [
      num(n),
      num(t.divisions),
      num(t.forPrimes),
      num(t.forComposites),
      seconds(t.divisions),
    ];
  });
  const top = trialOf(LIMIT);
  return [
    md(
      [
        "상한 n",
        "나눗셈",
        "소수를 확인한 몫",
        "합성수를 확인한 몫",
        "시간(1 초에 1 억 번)",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `상한 ${num(LIMIT)} 에서 나눗셈이 ${num(top.divisions)} 번으로 예산 1 초의 ${(top.divisions / 1e8).toFixed(1)} 배이고, 그중 ${pct(top.forPrimes, top.divisions)} % 가 소수를 소수라고 확인하는 데 쓰였습니다.`,
  ].join("\n");
}

function originSplit(): string {
  const n = WALK_N;
  const t = trialOf(n);
  const composites: number[] = [];
  for (let x = 2; x <= n; x++) if (!t.primes.includes(x)) composites.push(x);
  const byTwo = composites.filter((x) => leastPrimeFactor(x) === 2);
  // 첫 약수가 2 인 합성수는 나눗셈 한 번에 끝난다 — 그 수가 곧 나눗셈 횟수다.
  const addTwo: number[] = [];
  for (let j = 4; j <= n; j += 2) addTwo.push(j);
  if (byTwo.join(",") !== addTwo.join(",")) {
    throw new Error("첫 약수가 2 인 합성수가 4 부터 2 씩 더한 수와 다르다");
  }
  return [
    md(
      ["확인한 것", "수의 개수", "나눗셈"],
      [
        ["소수를 소수라고", String(t.primes.length), String(t.forPrimes)],
        [
          "합성수를 합성수라고",
          String(composites.length),
          String(t.forComposites),
        ],
        [
          "그중 첫 약수가 2 인 합성수를",
          String(byTwo.length),
          String(byTwo.length),
        ],
      ],
      [1, 2],
    ),
    "",
    `첫 약수가 2 인 합성수 ${byTwo.length} 개는 ${list(byTwo)}${이가(byTwo.at(-1) as number)}고, 4 부터 2 씩 더한 수와 하나하나 같습니다.`,
  ].join("\n");
}

function originTwoWays(): string {
  const rows = [WALK_N, 1_000, LIMIT].map((n) => {
    const t = trialOf(n);
    const c =
      n === LIMIT
        ? {
            ops: approachCounts().all,
            marks: approachCounts().allMarks,
          }
        : (() => {
            const r = sieveWith(n, CROSS_ALL);
            assertSame(n, r.primes);
            return r;
          })();
    // 배수 지우기의 기본 연산은 체 배열을 만드는 n + 1 번과 모으는 n − 1 번에 지우기를 더한 것이다.
    if (c.ops !== c.marks + 2 * n) throw new Error("기본 연산의 내역이 다르다");
    return [num(n), num(t.divisions), num(c.ops), num(c.marks)];
  });
  const a = approachCounts();
  return [
    md(
      [
        "상한 n",
        "수마다 나눠 보기의 나눗셈",
        "모든 수의 배수 지우기의 기본 연산",
        "그중 지우기",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `상한 ${WALK_N} 에서는 나눠 보기가 적고, 상한 ${num(LIMIT)} 에서는 배수 지우기가 ${(a.trial / a.all).toFixed(1)} 배 적습니다. 배수 지우기의 기본 연산은 어느 상한에서나 지우기 횟수에 2n 을 더한 값입니다.`,
  ].join("\n");
}

function originRepeat(): string {
  const n = WALK_N;
  // 모든 수 i 가 2i 부터 지울 때 칸마다 누가 지우는가.
  const by: number[][] = Array.from({ length: n + 1 }, () => []);
  for (let i = 2; i <= n; i++) {
    for (let j = 2 * i; j <= n; j += i) (by[j] as number[]).push(i);
  }
  const marks = by.reduce((s, xs) => s + xs.length, 0);
  const r = sieveWith(n, CROSS_ALL);
  assertSame(n, r.primes);
  if (r.marks !== marks) throw new Error("지우기 횟수가 사본과 다르다");
  const distinct = by.filter((xs) => xs.length > 0).length;
  // 합성수 i 가 지운 칸은 모두 i 의 가장 작은 소인수도 지운다.
  let byComposite = 0;
  for (let m = 2; m <= n; m++) {
    for (const i of by[m] as number[]) {
      if (leastPrimeFactor(i) === i) continue;
      byComposite++;
      if (!(by[m] as number[]).includes(leastPrimeFactor(i))) {
        throw new Error(`${m} 을 ${i} 만 지웠다`);
      }
    }
  }
  const top = [...by.keys()]
    .filter((m) => (by[m] as number[]).length > 0)
    .sort(
      (a, b) =>
        (by[b] as number[]).length - (by[a] as number[]).length || a - b,
    )
    .slice(0, 3)
    .sort((a, b) => a - b);
  const rows = top.map((m) => [
    String(m),
    (by[m] as number[]).join(" · "),
    String((by[m] as number[]).length),
    String(leastPrimeFactor(m)),
  ]);
  return [
    md(
      ["수", "그 수를 지운 i", "지운 횟수", "가장 작은 소인수"],
      rows,
      [0, 2, 3],
    ),
    "",
    `상한 ${n} 에서 서로 다른 칸 ${distinct} 개를 지우는 데 지우기 ${marks} 번을 썼습니다. 그중 합성수인 i 가 지운 ${byComposite} 번은 모두 그 i 의 가장 작은 소인수가 이미 지운 칸을 다시 지운 것입니다.`,
  ].join("\n");
}

function originPrimesOnly(): string {
  const a = approachCounts();
  const small = sieveWith(WALK_N, CROSS_PRIMES);
  assertSame(WALK_N, small.primes);
  const smallAll = sieveWith(WALK_N, CROSS_ALL);
  const rows = [
    [num(WALK_N), num(smallAll.ops), num(small.ops)],
    [num(LIMIT), num(a.all), num(a.primesOnly)],
  ];
  return [
    md(
      ["상한 n", "모든 수의 배수 지우기", "지워지지 않은 수의 배수만 지우기"],
      rows,
      [0, 1, 2],
    ),
    "",
    `두 방법 모두 정본과 같은 답을 냈고, 상한 ${num(LIMIT)} 에서 ${seconds(a.all)}에서 ${seconds(a.primesOnly)}로 줄어 1 초 예산 안에 듭니다.`,
  ].join("\n");
}

/* ───────────────────────── 아이디어 상세 ───────────────────────── */

function buildSize(): string {
  const rows = [WALK_N, LIMIT].map((n) => {
    const c = countOf(n);
    const collect = c.ops - (n + 1) - c.reads - c.marks;
    return [num(n), num(n + 1), num(collect), num(n + 1 - collect)];
  });
  return md(
    ["상한 n", "저장 칸", "모으는 반복이 읽는 칸", "한 번도 읽지 않는 칸"],
    rows,
    [0, 1, 2, 3],
  );
}

function buildFirst(): string {
  const n = WALK_N;
  const w = walk(n);
  // 합성수마다 처음 지운 소수가 가장 작은 소인수와 같은가 — 조금 더 큰 상한까지 확인한다.
  for (const m of [n, 10_000]) {
    const ww = walk(m);
    for (let x = 4; x <= m; x++) {
      const lpf = leastPrimeFactor(x);
      if (lpf === x) continue;
      if (ww.firstBy[x] !== lpf) {
        throw new Error(`${x} 을 처음 지운 소수가 가장 작은 소인수가 아니다`);
      }
    }
  }
  const rows: string[][] = [];
  let composites = 0;
  for (const p of primesUpTo(Math.floor(Math.sqrt(n)))) {
    const xs: number[] = [];
    for (let x = 2; x <= n; x++) if (w.firstBy[x] === p) xs.push(x);
    composites += xs.length;
    if (xs[0] !== p * p)
      throw new Error(`${p} 가 처음 지운 가장 작은 수가 p² 가 아니다`);
    rows.push([String(p), list(xs), String(xs[0]), String(p * p)]);
  }
  return [
    md(
      [
        "처음 지운 소수 p",
        "그 걸음에서 처음 지워진 합성수",
        "그중 가장 작은 수",
        "p²",
      ],
      rows,
      [0, 2, 3],
    ),
    "",
    `상한 ${n} 의 합성수 ${composites} 개가 모두 가장 작은 소인수의 걸음에서 처음 지워졌고, 줄마다 가장 작은 수가 p² 와 같습니다.`,
  ].join("\n");
}

function buildRecross(): string {
  const n = WALK_N;
  const w = walk(n);
  const rows: string[][] = [];
  let again = 0;
  for (const e of w.events) {
    if (e.kind !== "mark") continue;
    const re = e.cells.filter((c) => !e.fresh.includes(c));
    for (const c of re) {
      if (leastPrimeFactor(c) >= e.p) {
        throw new Error(
          `${c} 는 ${e.p} 보다 작은 소인수가 없는데 이미 지워져 있었다`,
        );
      }
    }
    again += re.length;
    rows.push([
      String(e.p),
      String(e.cells.length),
      list(e.fresh),
      re.length === 0
        ? "없음"
        : re.map((c) => `${c}(${w.firstBy[c]})`).join(" "),
    ]);
  }
  return [
    md(
      ["소수 p", "지운 칸 수", "처음 지운 칸", "다시 지운 칸(먼저 지운 소수)"],
      rows,
      [0, 1],
    ),
    "",
    `다시 지운 칸 ${again} 개는 모두 p 보다 작은 소인수를 가져서 앞 걸음이 먼저 지운 칸입니다.`,
  ].join("\n");
}

function buildPick(): string {
  const n = WALK_N;
  const w = walk(n);
  const rows: string[][] = [];
  const skipped: number[] = [];
  for (const e of w.events) {
    if (e.kind === "check") {
      const lpf = leastPrimeFactor(e.i);
      if (e.crossed !== lpf < e.i)
        throw new Error(`${e.i} 의 상태가 소인수와 맞지 않는다`);
      if (e.crossed) skipped.push(e.i);
      rows.push([
        String(e.i),
        e.crossed ? "지워졌다" : "지워지지 않았다",
        String(lpf),
        e.crossed
          ? `건너뛴다 — ${lpf} 의 걸음이 먼저 지웠다`
          : "소수로 보고 배수를 지운다",
      ]);
    } else if (e.kind === "stop") {
      rows.push([
        String(e.i),
        "—",
        "—",
        `${e.i} × ${e.i} = ${e.i * e.i}${이가(e.i * e.i)} ${n}${을를(n)} 넘어 멈춘다`,
      ]);
    }
  }
  return [
    md(["i", "칸 i", "i 의 가장 작은 소인수", "하는 일"], rows, [0, 2]),
    "",
    `지워진 i 는 ${list(skipped)} 이고, 지워지지 않은 i 는 모두 가장 작은 소인수가 자기 자신입니다.`,
  ].join("\n");
}

function buildLimit(): string {
  const right = countOf(LIMIT);
  const variants: [string, (i: number, n: number) => boolean][] = [
    ["i × i ≤ n", (i, n) => i * i <= n],
    ["i ≤ n / 2", (i, n) => i <= n / 2],
    ["i ≤ n", (i, n) => i <= n],
  ];
  const rows = variants.map(([name, last]) => {
    const r =
      name === "i × i ≤ n" ? right : sieveWith(LIMIT, { ...REF_KNOBS, last });
    assertSame(LIMIT, r.primes);
    return [name, num(r.reads), num(r.marks), num(r.ops)];
  });
  return [
    md(
      ["바깥 반복의 끝", "체 배열 읽기", "지우기", "기본 연산"],
      rows,
      [1, 2, 3],
    ),
    "",
    `상한 ${num(LIMIT)} 에서 세 판 모두 정본과 같은 답을 냈고 지우기 횟수도 같습니다. 늘어난 것은 체 배열 읽기뿐입니다.`,
  ].join("\n");
}

function buildCollect(): string {
  const rows = [WALK_N, LIMIT].map((n) => {
    const primes = sieveOfEratosthenes(n);
    return [
      num(n),
      num(n - 1),
      num(primes.length),
      num(primes.at(-1) as number),
    ];
  });
  return md(
    ["상한 n", "모으는 반복이 읽는 칸", "담긴 소수", "마지막 소수"],
    rows,
    [0, 1, 2, 3],
  );
}

function buildStart(): string {
  const right = sieveOfEratosthenes(WALK_N).join(",");
  const candidates: [string, (p: number) => number][] = [
    ["p", (p) => p],
    ["2p", (p) => 2 * p],
    ["p²", (p) => p * p],
    ["p² + p", (p) => p * p + p],
  ];
  const results = candidates.map(([name, from]) => {
    const small = sieveWith(WALK_N, { ...REF_KNOBS, from });
    const big =
      name === "p²" ? countOf(LIMIT) : sieveWith(LIMIT, { ...REF_KNOBS, from });
    return { name, small, big };
  });
  const rows = results.map(({ name, small, big }) => [
    name,
    num(small.marks),
    num(big.marks),
    small.primes.join(",") === right ? "같다" : "어긋난다",
  ]);
  const early = results[0]?.small.primes ?? [];
  const lost = sieveOfEratosthenes(WALK_N).filter((x) => !early.includes(x));
  const late = results[3]?.small.primes ?? [];
  const extra = late.filter((x) => !sieveOfEratosthenes(WALK_N).includes(x));
  return [
    md(
      [
        "지우기 시작 칸",
        `상한 ${WALK_N} 의 지우기`,
        `상한 ${num(LIMIT)} 의 지우기`,
        `상한 ${WALK_N} 의 답`,
      ],
      rows,
      [1, 2],
    ),
    "",
    `p 부터 지우면 소수 p 자신까지 지워져 답에서 ${list(lost)}${이가(lost.at(-1) as number)} 빠지고, p² + p 부터 지우면 지워지지 않은 합성수 ${list(extra)}${이가(extra.at(-1) as number)} 답에 섞입니다. 상한 ${num(LIMIT)} 에서 2p 부터 지우면 p² 부터보다 지우기가 ${num((results[1]?.big.marks ?? 0) - (results[2]?.big.marks ?? 0))} 번 더 듭니다.`,
  ].join("\n");
}

/* ───────────────────────── 수행으로 알아보는 알고리즘 ───────────────────────── */

function walkInput(): string {
  const answer = show(sieveOfEratosthenes(WALK_N));
  return [
    `const n = ${WALK_N};`,
    `// 이 절이 끝나면 나와야 하는 답 — ${answer}`,
  ].join("\n");
}

function walkInit(): string {
  const lines: [string, string, string][] = [0, 1].map((n) => [
    `sieveOfEratosthenes(${n})`,
    `${n} < 2 가 참`,
    show(sieveOfEratosthenes(n)),
  ]);
  const w = WALK_N;
  lines.push([
    `n = ${w}`,
    `${w} < 2 가 거짓`,
    `칸 ${w + 1} 개를 만들고, 지운 칸 0 개`,
  ]);
  const pad = (s: string, k: number) =>
    s +
    " ".repeat(
      Math.max(
        0,
        k - [...s].reduce((a, c) => a + (/[가-힯]/.test(c) ? 2 : 1), 0),
      ),
    );
  const w0 = Math.max(...lines.map((l) => l[0].length));
  const w1 = Math.max(
    ...lines.map((l) =>
      [...l[1]].reduce((a, c) => a + (/[가-힯]/.test(c) ? 2 : 1), 0),
    ),
  );
  return lines
    .map(([a, b, c]) => `${pad(a, w0)}   ${pad(b, w1)}   →  ${c}`)
    .join("\n");
}

function walkMark(): string {
  const n = WALK_N;
  const w = walk(n);
  const rows: string[][] = [];
  let pending: { i: number; crossed: boolean } | null = null;
  for (const e of w.events) {
    if (e.kind === "check") {
      if (e.crossed) rows.push([String(e.i), "지워졌다", "—", "0"]);
      else pending = { i: e.i, crossed: false };
    } else if (e.kind === "mark" && pending !== null) {
      rows.push([
        String(pending.i),
        "지워지지 않았다",
        list(e.cells),
        String(e.cells.length),
      ]);
      pending = null;
    }
  }
  const crossed = new Set<number>();
  for (const e of w.events)
    if (e.kind === "mark") for (const c of e.cells) crossed.add(c);
  return [
    md(["i", "칸 i", "지운 칸", "지우기 횟수"], rows, [0, 3]),
    "",
    `지우기는 모두 ${w.marks} 번이고, 지워진 칸은 ${crossed.size} 개입니다.`,
  ].join("\n");
}

function pauseNoSkip(): string {
  const gaps: number[] = [];
  const rows = [WALK_N, 1_000, LIMIT].map((n) => {
    const bare = n === LIMIT ? countOf(n) : counted(n);
    const without = sieveWith(n, { ...REF_KNOBS, skip: false });
    assertSame(n, without.primes);
    const got = noSkip.sieveOfEratosthenes(n);
    const same = got.join(",") === bare.primes.join(",");
    gaps.push(same ? 0 : 1);
    return [
      num(n),
      num(bare.marks),
      num(without.marks),
      same ? "같다" : "어긋난다",
    ];
  });
  if (gaps.some((g) => g !== 0))
    throw new Error("건너뛰기를 뺐더니 답이 달라졌다");
  const big = countOf(LIMIT);
  const bigWithout = sieveWith(LIMIT, { ...REF_KNOBS, skip: false });
  return [
    md(
      [
        "상한 n",
        "건너뛰는 코드의 지우기",
        "건너뛰지 않는 코드의 지우기",
        "두 답의 판정",
      ],
      rows,
      [0, 1, 2],
    ),
    "",
    `상한 ${num(LIMIT)} 에서 건너뛰지 않으면 지우기가 ${num(bigWithout.marks - big.marks)} 번 더 듭니다.`,
  ].join("\n");
}

function pauseNoSkipFour(): string {
  const n = WALK_N;
  const w = walk(n);
  const four = multiplesFromSquare(4, n);
  const firsts = four.map((c) => w.firstBy[c]);
  if (firsts.some((p) => p !== 2))
    throw new Error("4 가 지우는 칸을 2 가 먼저 지우지 않았다");
  return [
    md(
      ["4 가 지우는 칸", ...four.map(String)],
      [["그 칸을 먼저 지운 소수", ...firsts.map(String)]],
      four.map((_, k) => k + 1),
    ),
    "",
    `4 가 지우는 칸 ${four.length} 개는 모두 2 가 먼저 지운 칸입니다.`,
  ].join("\n");
}

function walkCollect(): string {
  const n = WALK_N;
  const primes = sieveOfEratosthenes(n);
  return [
    `k = 2 … ${n}   읽은 칸 ${n - 1} 개   담은 칸 ${primes.length} 개`,
    `primes = ${show(primes)}`,
  ].join("\n");
}

function walkTrace(): string {
  const n = WALK_N;
  const w = walk(n);
  const rows: string[][] = [];
  let t = 0;
  let crossed = 0;
  const seen = new Set<number>();
  for (const e of w.events) {
    const id = `T${++t}`;
    if (e.kind === "check") {
      rows.push([
        id,
        String(e.i),
        `\`${e.i} * ${e.i} <= ${n}\` 참 · \`isComposite[${e.i}]\` ${e.crossed ? "참" : "거짓"}`,
        e.crossed ? "② 건너뛴다" : "② 를 지나 소수로 본다",
        "—",
        String(crossed),
      ]);
    } else if (e.kind === "mark") {
      for (const c of e.cells) seen.add(c);
      crossed = seen.size;
      rows.push([
        id,
        String(e.p),
        `\`j <= ${n}\` 인 동안 ${e.cells.length} 번`,
        `③ 배수 ${e.cells.length} 칸을 지운다`,
        list(e.cells),
        String(crossed),
      ]);
    } else if (e.kind === "stop") {
      rows.push([
        id,
        String(e.i),
        `\`${e.i} * ${e.i} <= ${n}\` 거짓`,
        "바깥 반복이 끝난다",
        "—",
        String(crossed),
      ]);
    } else {
      rows.push([
        id,
        "—",
        `\`k <= ${n}\` 인 동안 ${n - 1} 번`,
        "④ 지워지지 않은 칸을 모은다",
        list(e.primes),
        String(crossed),
      ]);
    }
  }
  return [
    md(
      ["걸음", "i", "조건 판정", "하는 일", "이번 걸음의 칸", "지운 칸 수"],
      rows,
      [5],
    ),
    "",
    `답은 ${show(w.primes)} 입니다.`,
  ].join("\n");
}

function pauseSeven(): string {
  const n = WALK_N;
  const x = 7;
  const rows = primesUpTo(Math.floor(Math.sqrt(n))).map((p) => {
    const cells = multiplesFromSquare(p, n);
    return [
      String(p),
      String(p * p),
      String(x % p),
      cells.includes(x) ? "지웠다" : "안 지웠다",
    ];
  });
  if (!sieveOfEratosthenes(n).includes(x)) throw new Error("7 이 답에 없다");
  return [
    md(
      ["소수 p", "지우기 시작 칸 p²", `${x} 을 p 로 나눈 나머지`, `칸 ${x}`],
      rows,
      [0, 1],
    ),
    "",
    `${x} 의 제곱 ${x * x}${은는(x * x)} 상한 ${n}${을를(n)} 넘으므로 바깥 반복은 ${x}${을를(x)} 보지 않았고, 칸 ${x}${은는(x)} 끝까지 지워지지 않아 모으는 반복이 답에 담습니다.`,
  ].join("\n");
}

function finalCalls(): string {
  const ns = [WALK_N, 10, 2, 1, 0];
  const heads = ns.map((n) => `sieveOfEratosthenes(${n})`);
  const w = Math.max(...heads.map((h) => h.length));
  return ns
    .map(
      (n, k) =>
        `${(heads[k] as string).padEnd(w)}   →   ${show(sieveOfEratosthenes(n))}`,
    )
    .join("\n");
}

/* ───────────────────────── 알아 두면 좋은 개념 ───────────────────────── */

function relatedPairs(): string {
  const ms = [36, 30, 25, 97];
  const rows = ms.map((m) => {
    const pairs: string[] = [];
    for (let d = 1; d * d <= m; d++)
      if (m % d === 0) pairs.push(`(${d}, ${m / d})`);
    return [
      String(m),
      Math.sqrt(m).toFixed(2),
      pairs.join(" "),
      String(leastPrimeFactor(m)),
    ];
  });
  const prime = ms.filter((m) => leastPrimeFactor(m) === m);
  return [
    md(["수 m", "√m", "약수의 짝", "가장 작은 소인수"], rows, [0, 1, 3]),
    "",
    `짝의 왼쪽은 모두 √m 이하입니다. ${list(prime)}${은는(prime.at(-1) as number)} 짝이 (1, ${prime[0]}) 하나뿐이라 소수입니다.`,
  ].join("\n");
}

/* ───────────────────────── 경쟁 설계와의 대조 ───────────────────────── */

const bench = () =>
  once("bench", () => ({
    mine: altCases["에라토스테네스의 체"]() as Record<string, number>,
    theirs: altCases["구간 분할 체"]() as Record<string, number>,
  }));

/** 하네스가 낸 계수 하나. 키가 없으면 본문과 하네스의 이름이 어긋난 것이다. */
function get(r: Record<string, number>, key: string): number {
  const v = r[key];
  if (v === undefined) throw new Error(`하네스에 ${key} 가 없다`);
  return v;
}

function altOps(): string {
  const { mine, theirs } = bench();
  const keys: [string, string][] = [
    [num(WALK_N), `n=${WALK_N} 기본 연산`],
    ["1,000", "n=1,000 기본 연산"],
    [num(LIMIT), `n=${num(LIMIT)} 기본 연산`],
  ];
  const rows = keys.map(([label, key]) => {
    const a = get(mine, key);
    const b = get(theirs, key);
    return [label, num(a), num(b), num(b - a)];
  });
  const all = keys.every(([, key]) => get(mine, key) < get(theirs, key));
  if (!all) throw new Error("기본 연산의 순서가 뒤집힌다");
  return [
    md(
      [
        "상한 n",
        "에라토스테네스의 체",
        "구간 분할 체",
        "구간 분할 체가 더 든 기본 연산",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    "세 상한 모두 에라토스테네스의 체의 기본 연산이 적습니다.",
  ].join("\n");
}

function altCells(): string {
  const { mine, theirs } = bench();
  const keys: [string, string][] = [
    [num(WALK_N), `n=${WALK_N} 저장 칸`],
    ["1,067", "n=1,067 저장 칸"],
    ["1,068", "n=1,068 저장 칸"],
    [num(LIMIT), `n=${num(LIMIT)} 저장 칸`],
  ];
  const rows = keys.map(([label, key]) => {
    const a = get(mine, key);
    const b = get(theirs, key);
    return [
      label,
      num(a),
      num(b),
      a < b ? "에라토스테네스의 체" : a > b ? "구간 분할 체" : "둘이 같음",
    ];
  });
  const a = get(mine, `n=${num(LIMIT)} 저장 칸`);
  const b = get(theirs, `n=${num(LIMIT)} 저장 칸`);
  return [
    md(
      ["상한 n", "에라토스테네스의 체", "구간 분할 체", "적은 쪽"],
      rows,
      [0, 1, 2],
    ),
    "",
    `상한 ${num(LIMIT)} 에서는 구간 분할 체가 ${num(Math.round(a / b))} 배 적습니다.`,
  ].join("\n");
}

function altFlip(): string {
  const SEGMENT = 1024;
  const seg = (n: number) => {
    const root = Math.floor(Math.sqrt(n));
    return { root: root + 1, base: primesUpTo(root).length, segment: SEGMENT };
  };
  let flip = 0;
  for (let n = 2; n <= 4_000; n++) {
    const s = seg(n);
    if (s.root + s.base + s.segment < n + 1) {
      flip = n;
      break;
    }
  }
  const rows = [flip - 1, flip].map((n) => {
    const s = seg(n);
    return [
      num(n),
      `${s.root} + ${s.base} + ${num(s.segment)} = ${num(s.root + s.base + s.segment)}`,
      num(n + 1),
    ];
  });
  // 식이 낸 값이 하네스가 잰 값과 같은가.
  const { mine, theirs } = bench();
  if (
    get(theirs, `n=${num(flip)} 저장 칸`) !==
    seg(flip).root + seg(flip).base + SEGMENT
  ) {
    throw new Error("구간 분할 체의 저장 칸이 하네스와 다르다");
  }
  if (get(mine, `n=${num(flip)} 저장 칸`) !== flip + 1) {
    throw new Error("체 배열의 저장 칸이 하네스와 다르다");
  }
  return [
    md(
      ["상한 n", "구간 분할 체의 저장 칸", "에라토스테네스의 체의 저장 칸"],
      rows,
      [0, 2],
    ),
    "",
    `2 부터 차례로 재서 구간 분할 체가 처음 적어지는 자리가 상한 ${num(flip)} 입니다.`,
  ].join("\n");
}

/* ───────────────────────── 수식 정의와 유도 ───────────────────────── */

function mathCheck(): string {
  const scales = [10, WALK_N, 100, 1_000, 10_000, 100_000, 1_000_000, LIMIT];
  const rows = scales.map((n) => {
    const root = Math.floor(Math.sqrt(n));
    const ps = primesUpTo(root);
    const sumFloor = ps.reduce((a, p) => a + Math.floor(n / p), 0);
    const sumP = ps.reduce((a, p) => a + p, 0);
    const c = countOf(n);
    if (closedForm(n) !== c.marks)
      throw new Error(`n=${n} 에서 식과 실측이 다르다`);
    return [
      num(n),
      String(root),
      String(ps.length),
      num(sumFloor),
      num(sumP),
      num(closedForm(n)),
      num(c.marks),
    ];
  });
  const ps = primesUpTo(Math.floor(Math.sqrt(WALK_N)));
  const terms = ps
    .map((p) => `(${Math.floor(WALK_N / p)} − ${p} + 1)`)
    .join(" + ");
  const vals = ps.map((p) => Math.floor(WALK_N / p) - p + 1);
  return [
    md(
      ["n", "⌊√n⌋", "π(√n)", "Σ⌊n/p⌋", "Σp", "식이 낸 값", "실제로 센 지우기"],
      rows,
      [0, 1, 2, 3, 4, 5, 6],
    ),
    "",
    `${scales.length} 상한 모두 식이 낸 값과 실제로 센 지우기가 같습니다. 상한 ${WALK_N}${을를(WALK_N)} 펴면 ${terms} = ${vals.join(" + ")} = ${closedForm(WALK_N)} 입니다.`,
  ].join("\n");
}

function mathCode(): string {
  const ps = primesUpTo(Math.floor(Math.sqrt(WALK_N)));
  const v = ps.reduce((s, p) => s + Math.floor(WALK_N / p) - p + 1, 0);
  return [
    "// 정의를 그대로 옮긴 조각. 실제 절차는 이 값을 세지 않고 그만큼 지우기만 한다.",
    "const writesOf = (n: number, primesUpToRoot: number[]): number =>",
    "  primesUpToRoot.reduce((sum, p) => sum + Math.floor(n / p) - p + 1, 0);",
    "",
    `writesOf(${WALK_N}, [${ps.join(", ")}]); // → ${v}`,
  ].join("\n");
}

function mathDrop(): string {
  const n = LIMIT;
  const ps = primesUpTo(Math.floor(Math.sqrt(n)));
  const bound = Math.round(n * ps.reduce((a, p) => a + 1 / p, 0));
  const sumFloor = ps.reduce((a, p) => a + Math.floor(n / p), 0);
  const tail = -ps.reduce((a, p) => a + p, 0) + ps.length;
  const W = countOf(n).marks;
  if (sumFloor + tail !== W) throw new Error("두 항의 합이 W(n) 과 다르다");
  return [
    md(
      ["항", `상한 ${num(n)} 의 값`],
      [
        ["n · Σ 1/p", num(bound)],
        ["Σ ⌊n/p⌋", num(sumFloor)],
        ["−Σp + π(√n)", `−${num(-tail)}`],
        ["W(n) = Σ ⌊n/p⌋ − Σp + π(√n)", num(W)],
      ],
      [1],
    ),
    "",
    `상한식 n · Σ 1/p 가 실제 지우기보다 ${num(bound - W)} 번, ${pct(bound - W, W)} % 큽니다. 바닥 함수가 깎은 몫은 ${num(bound - sumFloor)} 이고 나머지는 −Σp + π(√n) 항에서 옵니다.`,
  ].join("\n");
}

function mathScale(): string {
  const M = 0.2614972128;
  const rows = [WALK_N, 1_000, LIMIT].map((n) => {
    const root = Math.floor(Math.sqrt(n));
    const ps = primesUpTo(root);
    const recip = ps.reduce((a, p) => a + 1 / p, 0);
    const mertens = Math.log(Math.log(root)) + M;
    return [
      num(n),
      String(root),
      recip.toFixed(6),
      mertens.toFixed(6),
      num(Math.round(n * recip)),
      num(countOf(n).marks),
    ];
  });
  const root = Math.floor(Math.sqrt(LIMIT));
  const recip = primesUpTo(root).reduce((a, p) => a + 1 / p, 0);
  const mertens = Math.log(Math.log(root)) + M;
  return [
    md(
      ["n", "⌊√n⌋", "Σ 1/p", "ln ln √n + M", "n · Σ 1/p", "실제로 센 지우기"],
      rows,
      [0, 1, 2, 3, 4, 5],
    ),
    "",
    `상한 ${num(LIMIT)} 에서 역수 합과 메르텐스 식의 차이가 ${((Math.abs(recip - mertens) / recip) * 100).toFixed(2)} % 입니다.`,
  ].join("\n");
}

function mathGrowth(): string {
  const scales = [1_000, 10_000, 100_000, 1_000_000, LIMIT];
  const rows: string[][] = [];
  const ratios: number[] = [];
  for (let k = 1; k < scales.length; k++) {
    const a = countOf(scales[k - 1] as number).marks;
    const b = countOf(scales[k] as number).marks;
    ratios.push(b / a);
    rows.push([
      `${num(scales[k - 1] as number)} → ${num(scales[k] as number)}`,
      `${num(a)} → ${num(b)}`,
      `${(b / a).toFixed(2)} 배`,
    ]);
  }
  for (let k = 1; k < ratios.length; k++) {
    if (
      (ratios[k] as number) >= (ratios[k - 1] as number) ||
      (ratios[k] as number) <= 10
    ) {
      throw new Error("배율이 10 배로 줄어들며 다가가지 않는다");
    }
  }
  return [
    md(["상한", "지우기", "배율"], rows, [2]),
    "",
    `상한을 열 배 할 때마다 지우기가 ${ratios[0]?.toFixed(2)} 배에서 ${ratios.at(-1)?.toFixed(2)} 배로 줄며 10 배에 다가갑니다.`,
  ].join("\n");
}

/* ───────────────────────── 불변식 ───────────────────────── */

function invariantStates(): string {
  const n = WALK_N;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  const rows: string[][] = [];
  for (let i = 2; i * i <= n; i++) {
    if (!isComposite[i]) {
      for (let j = i * i; j <= n; j += i) isComposite[j] = true;
    }
    const written: number[] = [];
    const wrongly: number[] = [];
    const missed: number[] = [];
    for (let k = 2; k <= n; k++) {
      const composite = leastPrimeFactor(k) !== k;
      if (isComposite[k]) {
        written.push(k);
        if (!composite) wrongly.push(k);
      } else if (composite) missed.push(k);
    }
    if (wrongly.length > 0) throw new Error("지웠는데 합성수가 아닌 칸이 있다");
    if (missed.some((k) => leastPrimeFactor(k) <= i))
      throw new Error("뒤 절반이 깨졌다");
    rows.push([
      String(i),
      String(written.length),
      list(wrongly),
      list(missed),
      list(missed.map(leastPrimeFactor)),
    ]);
  }
  assertSame(
    n,
    [...isComposite.keys()].filter((k) => k >= 2 && !isComposite[k]),
  );
  return [
    md(
      [
        "i 를 끝낸 직후",
        "지운 칸 수",
        "지웠는데 합성수가 아닌 칸",
        "합성수인데 안 지운 칸",
        "그 가장 작은 소인수",
      ],
      rows,
      [0, 1],
    ),
    "",
    "셋째 열은 걸음마다 비어 있고, 다섯째 열의 값은 언제나 그 줄의 i 보다 큽니다.",
  ].join("\n");
}

function invariantEdges(): string {
  const ns = [0, 1, 2, 3, 4, 5];
  const rows = ns.map((n) => {
    const c = sieveWith(n, REF_KNOBS);
    assertSame(n, c.primes);
    return [
      String(n),
      show(sieveOfEratosthenes(n)),
      String(c.reads),
      String(c.marks),
    ];
  });
  const idle = ns.filter((n) => n >= 2 && sieveWith(n, REF_KNOBS).reads === 0);
  if (idle.length !== 2)
    throw new Error("바깥 반복이 안 도는 상한이 둘이 아니다");
  return [
    md(["상한 n", "답", "바깥 반복의 읽기", "지우기"], rows, [0, 2, 3]),
    "",
    `상한 ${idle[0]}${과와(idle[0] as number)} ${idle[1]}${은는(idle[1] as number)} 바깥 반복이 한 번도 실행되지 않습니다 — 2 의 제곱 4 가 이미 상한을 넘습니다.`,
  ].join("\n");
}

function mutantStepOne(): string {
  return contrast([WALK_N, 10, 20], stepByOne, "한 칸씩 나아간 답");
}

function mutantStepOneTrace(): string {
  // 바꾼 판을 걸음마다 따라간다. 답은 변이 모듈의 답과 맞댄다(중화 실행에서는 건너뛴다).
  const n = WALK_N;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  const rows: string[][] = [];
  for (let i = 2; i * i <= n; i++) {
    if (isComposite[i]) {
      rows.push([String(i), "지워졌다", "건너뛴다", "—"]);
      continue;
    }
    const cells: number[] = [];
    for (let j = i * i; j <= n; j++) {
      if (!isComposite[j]) cells.push(j);
      isComposite[j] = true;
    }
    rows.push([
      String(i),
      "지워지지 않았다",
      `${i * i} 부터 ${n} 까지 한 칸씩 지운다`,
      cells.length === 0
        ? "없음"
        : `${cells[0]} … ${cells.at(-1)} (${cells.length} 칸)`,
    ]);
  }
  const answer: number[] = [];
  for (let k = 2; k <= n; k++) if (!isComposite[k]) answer.push(k);
  const neutral = stepByOne.sieveOfEratosthenes === sieveOfEratosthenes;
  if (
    !neutral &&
    answer.join(",") !== stepByOne.sieveOfEratosthenes(n).join(",")
  ) {
    throw new Error("걸음을 따라간 답이 변이 모듈의 답과 다르다");
  }
  return [
    md(["i", "칸 i", "하는 일", "새로 지운 칸"], rows, [0]),
    "",
    `남은 칸이 ${list(answer)} 뿐이라 답이 ${answer.length} 개로 줄어듭니다.`,
  ].join("\n");
}

/* ───────────────────────── 비용 계산 ───────────────────────── */

function perfCount(): string {
  const n = WALK_N;
  const c = countOf(n);
  const root = Math.floor(Math.sqrt(n));
  const reads = root - 1;
  const collect = n - 1;
  const init = n + 1;
  if (reads !== c.reads || init + reads + c.marks + collect !== c.ops) {
    throw new Error("기본 연산의 내역이 계측과 다르다");
  }
  const rows = [
    ["체 배열을 만든다", "준비", num(init)],
    ["바깥 반복이 칸 i 를 읽는다", "T1 · T3 · T5 · T6", num(reads)],
    ["배수를 지운다", "T2 · T4 · T7", num(c.marks)],
    ["모으며 칸을 읽는다", "T9", num(collect)],
    ["합계", "", num(c.ops)],
  ];
  return [
    md(["기본 연산의 갈래", "걸음", "횟수"], rows, [2]),
    "",
    `총식 2n + ⌊√n⌋ + W(n) − 1 에 n = ${n}${을를(n)} 넣으면 ${2 * n} + ${root} + ${c.marks} − 1 = ${2 * n + root + c.marks - 1} 이고, 실제로 센 ${c.ops}${과와(c.ops)} 같습니다.`,
  ].join("\n");
}

function perfTotal(): string {
  const c = countOf(LIMIT);
  const root = Math.floor(Math.sqrt(LIMIT));
  if (2 * LIMIT + root + c.marks - 1 !== c.ops)
    throw new Error("총식이 실측과 다르다");
  const primes = sieveOfEratosthenes(LIMIT).length;
  return md(
    [
      "상한 n",
      "지우기 W(n)",
      "기본 연산",
      "시간(1 초에 1 억 번)",
      "저장 칸",
      "답의 개수",
    ],
    [
      [
        num(LIMIT),
        num(c.marks),
        num(c.ops),
        seconds(c.ops),
        num(LIMIT + 1),
        num(primes),
      ],
    ],
    [0, 1, 2, 3, 4, 5],
  );
}

function worstShape(): string {
  const isPrime = (x: number) => leastPrimeFactor(x) === x;
  let below = LIMIT;
  while (!isPrime(below)) below--;
  let above = LIMIT + 1;
  while (!isPrime(above)) above++;
  const ns = [below, below + 1, LIMIT - 1, LIMIT, above];
  const rows = ns.map((n) => {
    const c = countOf(n);
    return [
      num(n),
      isPrime(n) ? "소수" : "합성수",
      num(c.marks),
      num(c.ops),
      num(sieveOfEratosthenes(n).length),
    ];
  });
  let best = 0;
  let at = 0;
  let prev = closedForm(2);
  for (let n = 3; n <= 100_000; n++) {
    const m = closedForm(n);
    if (m - prev > best) {
      best = m - prev;
      at = n;
    }
    prev = m;
  }
  const factors: number[] = [];
  for (let x = at, d = 2; x > 1; ) {
    if (x % d === 0) {
      if (!factors.includes(d)) factors.push(d);
      x /= d;
    } else d++;
  }
  const a = countOf(below).marks;
  const b = countOf(LIMIT).marks;
  return [
    md(
      ["상한 n", "그 상한은", "지우기", "기본 연산", "답의 개수"],
      rows,
      [0, 2, 3, 4],
    ),
    "",
    `소수인 ${num(below)}${이가(num(below))} 합성수인 ${num(LIMIT)} 보다 지우기가 ${num(b - a)} 번 적은데, 두 상한의 차이가 ${LIMIT - below} 입니다. 상한을 1 늘렸을 때 지우기가 가장 많이 느는 자리는 ${num(100_000)} 까지에서 ${num(at)}(소인수 ${factors.join(" · ")})이고, 그때 느는 값은 ${best} 번입니다.`,
  ].join("\n");
}

function worstAxes(): string {
  const c = countOf(LIMIT);
  return md(
    ["최악으로 만들 축", "입력", "값"],
    [
      ["기본 연산", `상한 ${num(LIMIT)}`, num(c.ops)],
      ["지우기", `상한 ${num(LIMIT)}`, num(c.marks)],
      ["저장 칸", `상한 ${num(LIMIT)}`, num(LIMIT + 1)],
    ],
    [2],
  );
}

/* ───────────────────────── 스스로 점검하기 ───────────────────────── */

/** 소수 `p` 가 배수를 지운 걸음의 번호 — 걸음 표(`walk-trace`)와 같은 번호다. */
function markStepId(p: number): string {
  const w = walk(WALK_N);
  const k = w.events.findIndex((e) => e.kind === "mark" && e.p === p);
  if (k < 0) throw new Error(`${p} 가 지운 걸음이 없다`);
  return `T${k + 1}`;
}

function selfcheckFive(): string {
  const n = WALK_N;
  const w = walk(n);
  const p = 5;
  const rows: string[][] = [];
  for (let q = 2; q * p <= n; q++) {
    const m = q * p;
    const by = w.firstBy[m] as number;
    rows.push([
      `${q} × ${p} = ${m}`,
      String(leastPrimeFactor(q)),
      String(by),
      markStepId(by),
    ]);
  }
  return md(
    ["5 의 배수", "몫의 가장 작은 소인수", "먼저 지운 소수", "처음 지운 걸음"],
    rows,
    [1, 2],
  );
}

/* ───────────────────────── 블록 ───────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 소수마다 지우는 칸과 남은 칸. */
  "concept-count": conceptCount,
  /** `concept` — 두 방법의 계수가 규모에 따라 어떻게 갈리는가. */
  "concept-scale": conceptScale,
  /** `deep.origin` ② — 시행 나눗셈의 나눗셈 횟수. */
  "origin-naive-cost": originNaiveCost,
  /** `deep.origin` ③ — 상한 30 에서 나눗셈이 어디에 쓰이는가. */
  "origin-split": originSplit,
  /** `deep.origin` ④ — 같은 상한을 두 방법으로 처리한 계수. */
  "origin-two-ways": originTwoWays,
  /** `deep.origin` ⑤ — 모든 수의 배수를 지우면 같은 칸을 여러 번 지운다. */
  "origin-repeat": originRepeat,
  /** `deep.origin` ⑤ — 지워지지 않은 수의 배수만 지우면. */
  "origin-primes-only": originPrimesOnly,
  /** `deep.build` 1단계 — 체 배열의 크기. */
  "build-size": buildSize,
  /** `deep.build` 2단계 — 합성수는 가장 작은 소인수의 걸음에서 처음 지워진다. */
  "build-first": buildFirst,
  /** `deep.build` 2단계 — 이미 지운 칸을 다시 지우는 자리. */
  "build-recross": buildRecross,
  /** `deep.build` 3단계 — 지울 소수를 고르는 걸음. */
  "build-pick": buildPick,
  /** `deep.build` 3단계 — 바깥 반복의 끝 후보 셋. */
  "build-limit": buildLimit,
  /** `deep.build` 4단계 — 모으는 반복. */
  "build-collect": buildCollect,
  /** `deep.build` 설계 선택 — 지우기 시작 칸 후보 넷. */
  "build-start": buildStart,
  /** `deep.walk` — 고정 입력. */
  "walk-input": walkInput,
  /** `deep.walk` 1 — 답이 없는 상한과 체 배열. */
  "walk-init": walkInit,
  /** `deep.walk` 2 — 바깥 반복의 걸음마다 지운 칸. */
  "walk-mark": walkMark,
  /** `deep.walk.pause` — 지워진 i 를 건너뛰지 않아도 답이 안 바뀐다. */
  "pause-no-skip": pauseNoSkip,
  /** `deep.walk.pause` — 4 가 지우는 칸은 모두 2 가 먼저 지웠다. */
  "pause-no-skip-four": pauseNoSkipFour,
  /** `deep.walk` 3 — 모으는 반복. */
  "walk-collect": walkCollect,
  /** `deep.walk.pause` — 모으기를 0 부터 시작하면. */
  "pause-collect-zero": () =>
    contrast([WALK_N, 10, 2], collectFromZero, "0 부터 모은 답"),
  /** `deep.walk` 4 — 고정 입력을 끝까지 실행한 걸음별 상태값. */
  "walk-trace": walkTrace,
  /** `deep.walk.pause` — 모으기를 바깥 반복과 같은 상한에서 멈추면. */
  "pause-collect-root": () =>
    contrast([WALK_N, 10, 20], collectToRoot, "√n 까지만 모은 답"),
  /** `deep.walk.pause` — 바깥 반복이 보지 않은 7 이 답에 남는 까닭. */
  "pause-seven": pauseSeven,
  /** `deep.walk.final` — 전체 코드의 호출 결과. */
  "final-calls": finalCalls,
  /** `related` — 약수를 짝으로 묶으면 한쪽은 제곱근 이하다. */
  "related-pairs": relatedPairs,
  /** `purpose.alt` — 두 설계의 기본 연산. */
  "alt-ops": altOps,
  /** `purpose.alt` — 두 설계의 저장 칸. */
  "alt-cells": altCells,
  /** `purpose.alt` — 저장 칸이 뒤집히는 자리의 내역. */
  "alt-flip": altFlip,
  /** `deep.math` ② — 닫힌 형태와 실측의 대조. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드와 그 값. */
  "math-code": mathCode,
  /** `deep.math` ③ — 두 항을 떼어 낸 자리. */
  "math-drop": mathDrop,
  /** `deep.math` ④ — 상한식과 메르텐스 값. */
  "math-scale": mathScale,
  /** `deep.math` ④ — 상한을 열 배 할 때의 배율. */
  "math-growth": mathGrowth,
  /** `invariant` ② — 바깥 반복의 걸음마다 두 절반이 참인가. */
  "invariant-states": invariantStates,
  /** `invariant` ② — 경계에 있는 상한들. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 안쪽 루프의 간격을 한 칸으로 바꾸면. */
  "mutant-step-one": mutantStepOne,
  /** `invariant` ③ — 한 칸씩 나아가는 판의 걸음. */
  "mutant-step-one-trace": mutantStepOneTrace,
  /** `perf.derive` — 전개 입력의 기본 연산 내역. */
  "perf-count": perfCount,
  /** `perf.bounds` — 과제 규모의 총량. */
  "perf-total": perfTotal,
  /** `perf.worst` — 상한을 바꿔 가며 잰 계수. */
  "worst-shape": worstShape,
  /** `perf.worst` — 축마다 최악을 만드는 입력. */
  "worst-axes": worstAxes,
  /** `selfcheck` — 5 의 배수를 몫으로 가르면. */
  "selfcheck-five": selfcheckFive,
};
