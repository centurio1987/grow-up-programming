/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts sieveOfEratosthenes-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { sieveOfEratosthenes } from "./sieveOfEratosthenes-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 수의 나열. 비면 「없음」 이다. */
const list = (xs: number[]): string =>
  xs.length === 0 ? "없음" : xs.join(" ");

/** 답 배열의 표기. */
const show = (xs: number[]): string =>
  xs.length === 0 ? "[]" : `[${xs.join(", ")}]`;

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 못 본다.
 */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const cols = head.length;
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 바깥 루프의 세 갈래가 다 실행되고(소수라 배수를 적는다 · 이미 적혀 있어 건너뛴다 ·
 * 제곱이 상한을 넘어 루프가 끝난다), 이미 적힌 자리를 다시 적는 일이 다섯 번 나며,
 * 제곱보다 작은 배수를 건너뛴 것이 답을 바꾸지 않는 것까지 한 화면에 들어간다.
 */
const WALK_N = 30;

/** 제약의 최댓값. */
const LIMIT = 1_000_000;

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  primes: number[];
  /** 안쪽 루프가 표에 적은 횟수. 이미 적힌 자리에 다시 적은 것도 센다. */
  marks: number;
  /** 배열 칸 접근 — 초기화 쓰기 + 표 읽기 + 합성수 쓰기 + 수집 읽기. */
  access: number;
}

/** 정본과 같은 절차에 계수만 덧붙인 것. */
function counted(n: number): Counted {
  const primes: number[] = [];
  if (n < 2) return { primes, marks: 0, access: 0 };
  let marks = 0;
  let access = 0;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  access += n + 1;
  for (let i = 2; i * i <= n; i++) {
    access++;
    if (isComposite[i]) continue;
    for (let j = i * i; j <= n; j += i) {
      marks++;
      access++;
      isComposite[j] = true;
    }
  }
  for (let k = 2; k <= n; k++) {
    access++;
    if (!isComposite[k]) primes.push(k);
  }
  return { primes, marks, access };
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 다른 절차를 잰 것이다. */
function assertSame(n: number, got: number[]): number[] {
  const want = sieveOfEratosthenes(n);
  if (got.join(",") !== want.join(",")) {
    throw new Error(`계측기와 정본의 답이 다르다 — n=${n}`);
  }
  return got;
}

/**
 * 수마다 시행 나눗셈으로 판정하는 방식. 나눗셈 횟수를 세되 **소수를 확인한 몫과 합성수를
 * 확인한 몫을 갈라서** 센다 — 둘의 비율이 이 방식의 성질을 그대로 말한다.
 */
function byTrialDivision(n: number): {
  primes: number[];
  divisions: number;
  forPrimes: number;
  forComposites: number;
} {
  const primes: number[] = [];
  let forPrimes = 0;
  let forComposites = 0;
  for (let x = 2; x <= n; x++) {
    let prime = true;
    let used = 0;
    for (let d = 2; d * d <= x; d++) {
      used++;
      if (x % d === 0) {
        prime = false;
        break;
      }
    }
    if (prime) {
      primes.push(x);
      forPrimes += used;
    } else forComposites += used;
  }
  return {
    primes,
    divisions: forPrimes + forComposites,
    forPrimes,
    forComposites,
  };
}

/** 안쪽 루프의 시작 자리를 바꿔 가며 적는 횟수를 센다. */
function markCountFrom(
  n: number,
  from: (i: number) => number,
): { primes: number[]; marks: number } {
  const primes: number[] = [];
  if (n < 2) return { primes, marks: 0 };
  let marks = 0;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  for (let i = 2; i * i <= n; i++) {
    if (isComposite[i]) continue;
    for (let j = from(i); j <= n; j += i) {
      marks++;
      isComposite[j] = true;
    }
  }
  for (let k = 2; k <= n; k++) if (!isComposite[k]) primes.push(k);
  return { primes, marks };
}

/** 바깥 루프의 상한을 바꿔 가며 적는 횟수와 표 읽기 횟수를 센다. */
function boundedBy(
  n: number,
  last: (i: number) => boolean,
): { primes: number[]; marks: number; reads: number } {
  const primes: number[] = [];
  if (n < 2) return { primes, marks: 0, reads: 0 };
  let marks = 0;
  let reads = 0;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  for (let i = 2; last(i); i++) {
    reads++;
    if (isComposite[i]) continue;
    for (let j = i * i; j <= n; j += i) {
      marks++;
      isComposite[j] = true;
    }
  }
  for (let k = 2; k <= n; k++) if (!isComposite[k]) primes.push(k);
  return { primes, marks, reads };
}

/** 이미 적힌 자리인지 보지 않고 모든 `i` 의 배수를 적는 판. */
function withoutSkip(n: number): { primes: number[]; marks: number } {
  const primes: number[] = [];
  if (n < 2) return { primes, marks: 0 };
  let marks = 0;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  for (let i = 2; i * i <= n; i++) {
    for (let j = i * i; j <= n; j += i) {
      marks++;
      isComposite[j] = true;
    }
  }
  for (let k = 2; k <= n; k++) if (!isComposite[k]) primes.push(k);
  return { primes, marks };
}

/** `n` 이하의 소수. 닫힌 형태의 항을 세는 데 쓴다. */
const primesUpTo = (n: number): number[] => sieveOfEratosthenes(n);

/** 닫힌 형태 `W(n) = Σ_{p ≤ √n} (⌊n/p⌋ − p + 1)`. */
function closedForm(n: number): number {
  const root = Math.floor(Math.sqrt(n));
  return primesUpTo(root).reduce(
    (sum, p) => sum + Math.floor(n / p) - p + 1,
    0,
  );
}

/** 소수 `p` 가 `n` 이하에서 적는 자리. */
const multiplesOf = (p: number, n: number): number[] => {
  const out: number[] = [];
  for (let j = p * p; j <= n; j += p) out.push(j);
  return out;
};

/** 합성수의 소인수 중 가장 작은 것. */
function leastPrimeFactor(x: number): number {
  for (let d = 2; d * d <= x; d++) if (x % d === 0) return d;
  return x;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  sieveOfEratosthenes(n: number): number[];
}

const REF = new URL("./sieveOfEratosthenes-guide.ref.ts", import.meta.url)
  .pathname;

const INNER_LOOP =
  /for \(let j = i \* i; j <= n; j \+= i\) isComposite\[j\] = true;/;
const COLLECT_LOOP =
  /for \(let k = 2; k <= n; k\+\+\) if \(!isComposite\[k\]\) primes\.push\(k\);/;

/**
 * 안쪽 루프가 `i` 간격이 아니라 한 칸씩 나아가는 사본. 불변식(적힌 자리는 전부 `i` 의
 * 배수다)을 지키던 바로 그 줄이다.
 */
const stepByOne = await loadMutant<Impl>(REF, {
  swap: [INNER_LOOP, "for (let j = i * i; j <= n; j++) isComposite[j] = true;"],
});

/** 안쪽 루프가 `i` 의 제곱이 아니라 `2i` 부터 적는 사본. */
const startAtDouble = await loadMutant<Impl>(REF, {
  swap: [
    INNER_LOOP,
    "for (let j = 2 * i; j <= n; j += i) isComposite[j] = true;",
  ],
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

/** 변이가 어느 입력에서도 답을 안 바꾸면 「어긋난다」가 거짓이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 정본과 변이의 답을 나란히 놓은 표를 만든다. */
function contrast(
  ns: number[],
  other: (n: number) => number[],
  otherHead: string,
): string {
  const gaps: number[] = [];
  const rows = ns.map((n) => {
    const bare = sieveOfEratosthenes(n);
    const got = other(n);
    const same = bare.join(",") === got.join(",");
    gaps.push(same ? 0 : 1);
    return [`n = ${n}`, show(bare), show(got), same ? "같다" : "어긋난다"];
  });
  assertBreaks(gaps);
  return table(["상한", "정본이 낸 답", otherHead, "판정"], rows, [
    "l",
    "l",
    "l",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 소수마다 적는 자리와, 적히지 않고 남은 자리. */
  "concept-marks": () => {
    const n = WALK_N;
    const seen = new Set<number>();
    const rows: string[][] = [];
    let total = 0;
    for (const p of primesUpTo(Math.floor(Math.sqrt(n)))) {
      const xs = multiplesOf(p, n);
      const fresh = xs.filter((x) => !seen.has(x));
      for (const x of xs) seen.add(x);
      total += xs.length;
      rows.push([
        String(p),
        String(p * p),
        list(xs),
        String(xs.length),
        String(fresh.length),
      ]);
    }
    rows.push(["합계", "—", "", String(total), String(seen.size)]);
    return [
      table(
        [
          "소수",
          "적기 시작하는 자리",
          "적는 자리",
          "적는 횟수",
          "그중 처음 적히는 자리",
        ],
        rows,
        ["r", "r", "l", "r", "r"],
      ),
      "",
      `적히지 않고 남은 자리   ${list(sieveOfEratosthenes(n))}`,
      `└ 적는 횟수 ${total} 번 중 ${total - seen.size} 번은 이미 적힌 자리에 다시 적은 것이다`,
    ].join("\n");
  },

  /** `concept` — 두 방식의 계수가 규모에 따라 어떻게 갈리는가. */
  "concept-scale": () => {
    const rows = [WALK_N, 1_000, LIMIT].map((n) => {
      const c = counted(n);
      assertSame(n, c.primes);
      const t = byTrialDivision(n);
      return [
        num(n),
        num(t.divisions),
        num(c.access),
        (t.divisions / c.access).toFixed(2),
      ];
    });
    return [
      table(
        [
          "상한",
          "시행 나눗셈의 나눗셈",
          "이 방식의 배열 칸 접근",
          "앞이 뒤의 몇 배",
        ],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      "└ 상한 30 에서는 이 방식이 오히려 두 배 많다. 갈리는 것은 규모다",
    ].join("\n");
  },

  /** `deep.build` ② — 시행 나눗셈의 나눗셈 횟수와 상한을 열 배 했을 때의 증가. */
  "naive-cost": () => {
    const scales = [WALK_N, 1_000, 10_000, 100_000, LIMIT];
    const counts = scales.map((n) => byTrialDivision(n));
    const rows = scales.map((n, at) => {
      const t = counts[at] as (typeof counts)[number];
      return [num(n), num(t.divisions), num(t.forPrimes), num(t.forComposites)];
    });
    const jumps: [string, string][] = [];
    for (let at = 2; at < scales.length; at++) {
      const before = counts[at - 1] as (typeof counts)[number];
      const now = counts[at] as (typeof counts)[number];
      jumps.push([
        `${num(scales[at - 1] as number)} → ${num(scales[at] as number)}`,
        `${(now.divisions / before.divisions).toFixed(1)} 배`,
      ]);
    }
    // 앞 칸 폭을 값에서 재서 맞춘다. 구분 공백을 고정으로 박으면 뒤 칸이 계단으로 밀린다.
    const jumpWidth = Math.max(...jumps.map(([label]) => width(label)));
    const steps = jumps.map(
      ([label, ratio]) => `  ${padRight(label, jumpWidth)}   ${ratio}`,
    );
    const top = counts[counts.length - 1] as (typeof counts)[number];
    return [
      table(
        ["상한", "나눗셈", "소수를 확인한 몫", "합성수를 확인한 몫"],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      "상한을 열 배 할 때마다 나눗셈이 몇 배가 되는가",
      ...steps,
      `└ 제약의 최댓값에서 나눗셈의 ${((top.forPrimes / top.divisions) * 100).toFixed(1)} % 가 소수를 확인하는 데 쓰인다`,
    ].join("\n");
  },

  /** `deep.build` ③ — 나눗셈이 어디에 쓰이는가. */
  "build-split": () => {
    const n = WALK_N;
    const t = byTrialDivision(n);
    const composites: number[] = [];
    for (let k = 2; k <= n; k++) {
      if (!t.primes.includes(k)) composites.push(k);
    }
    const byTwo = composites.filter((x) => leastPrimeFactor(x) === 2);
    return [
      `상한 ${n} 에서 시행 나눗셈이 쓴 나눗셈 ${t.divisions} 번의 쓰임`,
      `  소수 ${t.primes.length} 개를 소수라고 확인      ${t.forPrimes} 번`,
      `  합성수 ${composites.length} 개를 합성수라고 확인  ${t.forComposites} 번`,
      "",
      `합성수 ${composites.length} 개 중 첫 약수가 2 인 것`,
      `  ${list(byTwo)}`,
      `  ${byTwo.length} 개 — 나눗셈 한 번으로 판정이 끝난다`,
      "",
      `그 ${byTwo.length} 자리는 4 부터 2 씩 더해도 그대로 나온다`,
      `  ${list(multiplesOf(2, n))}`,
      "└ 합성수 쪽은 약수 하나면 끝나고, 그 약수는 나눗셈 없이 덧셈으로 나열된다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 상한을 두 방식으로 처리한 계수. */
  "build-two-ways": () => {
    const rows: string[][] = [];
    for (const n of [30, 100, 228, 229, 1_000]) {
      const t = byTrialDivision(n);
      const c = counted(n);
      assertSame(n, c.primes);
      rows.push([
        num(n),
        num(t.divisions),
        num(c.marks),
        num(c.access),
        t.divisions < c.access ? "시행 나눗셈" : "이 방식",
      ]);
    }
    return [
      table(
        ["상한", "나눗셈", "적기", "배열 칸 접근", "접근이 적은 쪽"],
        rows,
        ["r", "r", "r", "r", "l"],
      ),
      "",
      "└ 상한 229 에서 순서가 뒤집힌다. 그 앞뒤 두 줄이 그 자리다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 안쪽 루프의 시작 자리 후보 셋. */
  "build-start": () => {
    const right = sieveOfEratosthenes(WALK_N).join(",");
    const rows: string[][] = [];
    for (const [name, from] of [
      ["2i 부터", (i: number) => 2 * i],
      ["3i 부터", (i: number) => 3 * i],
      ["i 의 제곱부터", (i: number) => i * i],
    ] as [string, (i: number) => number][]) {
      const small = markCountFrom(WALK_N, from);
      const big = markCountFrom(LIMIT, from);
      rows.push([
        name,
        num(small.marks),
        num(big.marks),
        small.primes.join(",") === right ? "같다" : "어긋난다",
      ]);
    }
    const wrong = markCountFrom(WALK_N, (i) => 3 * i).primes;
    const extra = wrong.filter((x) => !sieveOfEratosthenes(WALK_N).includes(x));
    return [
      table(
        [
          "시작 자리",
          `상한 ${WALK_N} 의 적기`,
          `상한 ${num(LIMIT)} 의 적기`,
          `상한 ${WALK_N} 의 답`,
        ],
        rows,
        ["l", "r", "r", "l"],
      ),
      "",
      `3i 부터 적으면 답에 ${list(extra)} 가 섞인다 — 2 의 배수 4 는 3·2 = 6 보다 앞이라 아무도 안 적는다`,
      "└ 2i 와 i 의 제곱은 답이 같고 적는 횟수만 갈린다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 이미 적힌 `i` 를 건너뛰는 것과 안 건너뛰는 것. */
  "build-skip": () => {
    const rows: string[][] = [];
    for (const n of [WALK_N, 1_000, LIMIT]) {
      const with_ = counted(n);
      assertSame(n, with_.primes);
      const without = withoutSkip(n);
      if (without.primes.join(",") !== with_.primes.join(",")) {
        throw new Error("건너뛰기를 뺐더니 답이 달라졌다");
      }
      rows.push([
        num(n),
        num(with_.marks),
        num(without.marks),
        (without.marks / with_.marks).toFixed(2),
      ]);
    }
    const skipped: number[] = [];
    {
      const c = new Array<boolean>(WALK_N + 1).fill(false);
      for (let i = 2; i * i <= WALK_N; i++) {
        if (c[i]) {
          skipped.push(i);
          continue;
        }
        for (let j = i * i; j <= WALK_N; j += i) c[j] = true;
      }
    }
    return [
      table(["상한", "건너뛴다", "안 건너뛴다", "몇 배"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `상한 ${WALK_N} 에서 건너뛴 i   ${list(skipped)}`,
      "└ 답은 둘이 같다. 갈리는 것은 적는 횟수뿐이다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 바깥 루프 상한 후보 셋. */
  "build-limit": () => {
    const right = sieveOfEratosthenes(LIMIT).join(",");
    const rows: string[][] = [];
    for (const [name, last] of [
      ["i 의 제곱이 n 이하", (i: number) => i * i <= LIMIT],
      ["i 가 n 의 절반 이하", (i: number) => i <= LIMIT / 2],
      ["i 가 n 이하", (i: number) => i <= LIMIT],
    ] as [string, (i: number) => boolean][]) {
      const r = boundedBy(LIMIT, last);
      rows.push([
        name,
        num(r.reads),
        num(r.marks),
        r.primes.join(",") === right ? "같다" : "어긋난다",
      ]);
    }
    return [
      table(["바깥 루프의 상한", "표 읽기", "적기", "답"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `└ 상한 ${num(LIMIT)} 에서 셋 다 적는 횟수가 같다. 늘어나는 것은 표 읽기뿐이다`,
    ].join("\n");
  },

  /** `deep.walk` — 고정 입력의 표 상태를 한 장으로. */
  "walk-picture": () => {
    const n = WALK_N;
    const primes = sieveOfEratosthenes(n);
    const cell = (s: string): string => padLeft(s, 3);
    const head = padRight("수", 6);
    const numbers: string[] = [];
    const marks: string[] = [];
    const answer: string[] = [];
    for (let k = 2; k <= n; k++) {
      numbers.push(cell(String(k)));
      marks.push(cell(primes.includes(k) ? "." : "x"));
      answer.push(cell(primes.includes(k) ? String(k) : ""));
    }
    return [
      head + numbers.join(""),
      padRight("적힘", 6) + marks.join(""),
      padRight("답", 6) + answer.join(""),
      "",
      `└ x 는 합성수라고 적힌 자리다. 적히지 않은 ${primes.length} 자리가 그대로 답이 된다`,
    ].join("\n");
  },

  /** `deep.walk` — 고정 입력을 끝까지 실행한 걸음별 상태값. */
  "walk-trace": () => {
    const n = WALK_N;
    const rows: string[][] = [];
    const isComposite = new Array<boolean>(n + 1).fill(false);
    let step = 0;
    const label = (): string => `T${++step}`;
    for (let i = 2; i * i <= n; i++) {
      const already = isComposite[i] === true;
      rows.push([
        label(),
        String(i),
        already ? "그렇다" : "아니다",
        already ? "② 건너뛴다" : "② 소수로 확정한다",
        "—",
        String(isComposite.filter(Boolean).length),
      ]);
      if (already) continue;
      const wrote = multiplesOf(i, n);
      for (const j of wrote) isComposite[j] = true;
      rows.push([
        label(),
        String(i),
        "—",
        `③ 배수 ${wrote.length} 자리를 적는다`,
        list(wrote),
        String(isComposite.filter(Boolean).length),
      ]);
    }
    const stop = Math.floor(Math.sqrt(n)) + 1;
    rows.push([
      label(),
      String(stop),
      "—",
      `${stop} 의 제곱이 ${stop * stop} 이라 바깥 루프가 끝난다`,
      "—",
      String(isComposite.filter(Boolean).length),
    ]);
    rows.push([
      label(),
      "—",
      "—",
      "④ 적히지 않은 자리를 모은다",
      list(sieveOfEratosthenes(n)),
      String(isComposite.filter(Boolean).length),
    ]);
    return [
      table(
        [
          "걸음",
          "i",
          "적혀 있는가",
          "하는 일",
          "이번 걸음의 자리",
          "적힌 자리 수",
        ],
        rows,
        ["l", "r", "l", "l", "l", "r"],
      ),
      "",
      `└ 답은 ${show(sieveOfEratosthenes(n))} 이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — `2i` 부터 적어도 답이 안 바뀐다. */
  "pause-double-start": () => {
    const ns = [10, WALK_N, 100, 1_000];
    const rows = ns.map((n) => {
      const bare = sieveOfEratosthenes(n);
      const got = startAtDouble.sieveOfEratosthenes(n);
      return [
        num(n),
        num(markCountFrom(n, (i) => i * i).marks),
        num(markCountFrom(n, (i) => 2 * i).marks),
        bare.join(",") === got.join(",") ? "같다" : "어긋난다",
      ];
    });
    const big = [
      num(markCountFrom(LIMIT, (i) => i * i).marks),
      num(markCountFrom(LIMIT, (i) => 2 * i).marks),
    ];
    return [
      table(
        ["상한", "제곱부터의 적기", "2i 부터의 적기", "두 답의 판정"],
        rows,
        ["r", "r", "r", "l"],
      ),
      "",
      `제약의 최댓값 ${num(LIMIT)} 에서는`,
      `  제곱부터   ${big[0]}`,
      `  2i 부터    ${big[1]}`,
      "└ 네 상한에서 답이 모두 같다. 갈리는 것은 적는 횟수뿐이다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 수집을 바깥 루프와 같은 상한에서 멈추면. */
  "pause-collect-root": () =>
    contrast(
      [WALK_N, 10, 20],
      (n) => collectToRoot.sieveOfEratosthenes(n),
      "제곱이 n 이하인 자리만 모은 답",
    ),

  /** `deep.walk.pause` — 수집을 `0` 부터 시작하면. */
  "pause-collect-zero": () =>
    contrast(
      [WALK_N, 10, 2],
      (n) => collectFromZero.sieveOfEratosthenes(n),
      "0 부터 모은 답",
    ),

  /** `related` — 약수를 짝으로 묶으면 한쪽은 제곱근 이하다. */
  "related-pairs": () => {
    const rows: string[][] = [];
    for (const m of [36, 30, 25, 97]) {
      const small: string[] = [];
      for (let d = 1; d * d <= m; d++) {
        if (m % d === 0) small.push(`(${d}, ${m / d})`);
      }
      rows.push([
        String(m),
        Math.sqrt(m).toFixed(2),
        small.join(" "),
        String(leastPrimeFactor(m)),
      ]);
    }
    return [
      table(
        ["수", "제곱근", "약수를 짝으로 묶으면", "가장 작은 소인수"],
        rows,
        ["r", "r", "l", "r"],
      ),
      "",
      "└ 짝의 왼쪽은 언제나 제곱근 이하다. 97 은 짝이 (1, 97) 하나뿐이라 소수다",
    ].join("\n");
  },

  /** `deep.math` — 닫힌 형태와 실측의 대조. */
  "math-check": () => {
    const rows = [10, WALK_N, 100, 1_000, 10_000, 100_000, LIMIT].map((n) => {
      const root = Math.floor(Math.sqrt(n));
      const ps = primesUpTo(root);
      const sumFloor = ps.reduce((a, p) => a + Math.floor(n / p), 0);
      const sumP = ps.reduce((a, p) => a + p, 0);
      const c = counted(n);
      assertSame(n, c.primes);
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
    return table(
      ["n", "√n", "π(√n)", "Σ⌊n/p⌋", "Σp", "식이 낸 값", "실측"],
      rows,
      ["r", "r", "r", "r", "r", "r", "r"],
    );
  },

  /** `deep.math` — 상한식과 메르텐스 값, 그리고 제약 규모의 계수. */
  "math-scale": () => {
    const rows = [WALK_N, 1_000, LIMIT].map((n) => {
      const root = Math.floor(Math.sqrt(n));
      const ps = primesUpTo(root);
      const recip = ps.reduce((a, p) => a + 1 / p, 0);
      const mertens = Math.log(Math.log(root)) + 0.2614972128;
      return [
        num(n),
        String(root),
        recip.toFixed(6),
        mertens.toFixed(6),
        num(Math.round(n * recip)),
        num(closedForm(n)),
      ];
    });
    const top = counted(LIMIT);
    assertSame(LIMIT, top.primes);
    const naive = byTrialDivision(LIMIT);
    return [
      table(
        ["n", "√n", "Σ1/p", "ln ln √n + M", "n·Σ1/p", "실제로 적은 횟수"],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `제약의 최댓값 ${num(LIMIT)} 에서`,
      `  적은 횟수         ${num(top.marks)}`,
      `  상한식 n·Σ1/p     ${num(Math.round(LIMIT * primesUpTo(1000).reduce((a, p) => a + 1 / p, 0)))}`,
      `  배열 칸 접근      ${num(top.access)}`,
      `  시행 나눗셈       ${num(naive.divisions)}`,
      `  나눗셈이 접근의   ${(naive.divisions / top.access).toFixed(2)} 배`,
    ].join("\n");
  },

  /** `invariant` — 바깥 루프의 걸음마다 두 절반이 참인가. */
  "invariant-states": () => {
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
      rows.push([
        String(i),
        String(written.length),
        list(wrongly),
        list(missed),
        list(missed.map(leastPrimeFactor)),
      ]);
    }
    return [
      table(
        [
          "i 를 끝낸 직후",
          "적힌 자리 수",
          "적혔는데 합성수가 아닌 것",
          "합성수인데 안 적힌 것",
          "그 가장 작은 소인수",
        ],
        rows,
        ["r", "r", "l", "l", "l"],
      ),
      "",
      "└ 셋째 열은 걸음마다 비어 있고, 다섯째 열의 값은 i 보다 언제나 크다",
    ].join("\n");
  },

  /** `invariant` — 경계에 있는 상한들. */
  "invariant-edges": () => {
    const rows = [0, 1, 2, 3, 4, 5].map((n) => {
      const c = counted(n);
      assertSame(n, c.primes);
      return [String(n), show(sieveOfEratosthenes(n)), num(c.marks)];
    });
    return [
      table(["상한", "답", "적기"], rows, ["r", "l", "r"]),
      "",
      "└ 상한 2 와 3 은 바깥 루프가 한 번도 실행되지 않는다 — 2 의 제곱 4 가 이미 상한을 넘는다",
    ].join("\n");
  },

  /** `invariant` — 안쪽 루프의 간격을 한 칸으로 바꾸면. */
  "mutant-step-one": () =>
    contrast(
      [WALK_N, 10, 20],
      (n) => stepByOne.sieveOfEratosthenes(n),
      "한 칸씩 나아간 답",
    ),

  /** `perf.derive` — 전개 입력의 배열 칸 접근 내역. */
  "perf-count": () => {
    const n = WALK_N;
    const c = counted(n);
    assertSame(n, c.primes);
    const root = Math.floor(Math.sqrt(n));
    const reads = root - 1;
    const collect = n - 1;
    const init = n + 1;
    const rows = [
      ["표를 만든다", "준비", num(init)],
      ["바깥 루프가 표를 읽는다", "T1 T3 T5 T6", num(reads)],
      ["합성수라고 적는다", "T2 T4 T7", num(c.marks)],
      ["수집하며 표를 읽는다", "T9", num(collect)],
      ["합계", "", num(init + reads + c.marks + collect)],
    ];
    return [
      table(["무엇", "어느 걸음인가", "배열 칸 접근"], rows, ["l", "l", "r"]),
      "",
      `총식 2n + ⌊√n⌋ + W(n) − 1 에 n = ${n} 을 넣으면 ${num(2 * n + root + c.marks - 1)} 이고 실측과 같다`,
      `└ 적는 일 ${c.marks} 번 중 ${c.marks - (n - 1 - c.primes.length)} 번은 이미 적힌 자리를 다시 적은 것이다`,
    ].join("\n");
  },

  /** `perf.worst` — 상한을 바꿔 가며 잰 계수. */
  "worst-shape": () => {
    const rows: string[][] = [];
    for (const n of [999_983, 999_984, 999_999, LIMIT, 1_000_003]) {
      const c = counted(n);
      assertSame(n, c.primes);
      const composite = leastPrimeFactor(n) !== n;
      rows.push([
        num(n),
        composite ? "합성수" : "소수",
        num(c.marks),
        num(c.access),
        num(c.primes.length),
      ]);
    }
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
    // 앞 칸 폭을 값에서 재서 맞춘다. 구분 공백을 고정으로 박으면 뒤 칸이 계단으로 밀린다.
    const jump: [string, string][] = [
      ["자리", num(at)],
      ["늘어난 값", `${best}`],
      [
        "그 수의 소인수",
        [2, 3, 5, 7, 11, 13].filter((p) => at % p === 0).join(" · "),
      ],
    ];
    const jumpWidth = Math.max(...jump.map(([label]) => width(label)));
    return [
      table(["상한", "그 상한은", "적기", "배열 칸 접근", "답의 개수"], rows, [
        "r",
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      `상한을 1 늘렸을 때 적는 횟수가 가장 많이 느는 자리를 ${num(100_000)} 까지 차례로 재면`,
      ...jump.map(
        ([label, value]) => `  ${padRight(label, jumpWidth)}   ${value}`,
      ),
      "└ 상한이 소수인지 합성수인지는 계수를 거의 바꾸지 않는다",
    ].join("\n");
  },
};
