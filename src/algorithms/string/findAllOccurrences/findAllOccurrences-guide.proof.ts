/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts findAllOccurrences-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { findAllOccurrences } from "./findAllOccurrences-guide.ref.ts";

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

/** 시작 자리의 나열. 비면 「없음」 이다. */
const show = (xs: number[]): string =>
  xs.length === 0 ? "없음" : `[${xs.join(", ")}]`;

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
 * 세 갈래가 다 실행되고(맞음 · 한 번에 두 칸 물러남 · 물러설 것이 없음), 시작 자리 셋이
 * **서로 겹치며**(4 와 6 이 두 글자, 6 과 8 이 두 글자), 답이 텍스트의 앞부분이 아니라
 * 뒷부분에 몰려 있다.
 */
const WALK_TEXT = "abacabababab";
const WALK_PATTERN = "abab";

/** 제약의 최댓값. */
const LIMIT = 100_000;

/* ────────────────────────── 계측기 ────────────────────────── */

interface Counted {
  found: number[];
  /** 실패 함수를 만들 때의 글자 견주기. */
  build: number;
  /** 텍스트를 대조할 때의 글자 견주기. */
  scan: number;
}

/** 실패 함수. 정본이 만드는 것과 같은 표다. */
function failOf(pattern: string): number[] {
  const m = pattern.length;
  const fail = new Array<number>(m).fill(0);
  let k = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0 && pattern[i] !== pattern[k]) k = fail[k - 1] as number;
    if (pattern[i] === pattern[k]) k++;
    fail[i] = k;
  }
  return fail;
}

/** 정본과 같은 절차에 견주기 계수만 덧붙인 것. */
function counted(text: string, pattern: string): Counted {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  if (m === 0 || n < m) return { found, build: 0, scan: 0 };

  const fail = new Array<number>(m).fill(0);
  let k = 0;
  let build = 0;
  for (let i = 1; i < m; i++) {
    while (k > 0) {
      build++;
      if (pattern[i] === pattern[k]) break;
      k = fail[k - 1] as number;
    }
    build++;
    if (pattern[i] === pattern[k]) k++;
    fail[i] = k;
  }

  let j = 0;
  let scan = 0;
  for (let i = 0; i < n; i++) {
    while (j > 0) {
      scan++;
      if (text[i] === pattern[j]) break;
      j = fail[j - 1] as number;
    }
    scan++;
    if (text[i] === pattern[j]) j++;
    if (j === m) {
      found.push(i - m + 1);
      j = fail[j - 1] as number;
    }
  }
  return { found, build, scan };
}

/** 시작 자리를 하나씩 다 대조하는 방식. 정의를 그대로 옮긴 것이라 기준이 된다. */
function everyStart(
  text: string,
  pattern: string,
): { found: number[]; cmp: number } {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  let cmp = 0;
  if (m === 0) return { found, cmp };
  for (let i = 0; i + m <= n; i++) {
    let ok = true;
    for (let j = 0; j < m; j++) {
      cmp++;
      if (text[i + j] !== pattern[j]) {
        ok = false;
        break;
      }
    }
    if (ok) found.push(i);
  }
  return { found, cmp };
}

/**
 * 어긋났을 때 **맞은 길이만큼 시작 자리를 옮기는** 후보. 실패 함수 없이 「이미 맞은 만큼은
 * 건너뛰어도 되겠지」를 그대로 옮긴 것이다.
 */
function skipByMatched(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  if (m === 0 || n < m) return found;
  let i = 0;
  while (i + m <= n) {
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) j++;
    if (j === m) {
      found.push(i);
      i += m;
    } else {
      i += Math.max(1, j);
    }
  }
  return found;
}

/**
 * **진 접두사 조건을 뺀** 실패 함수. `P[0..i]` 자신도 자기 접두사이자 접미사라고 읽으면
 * 값이 언제나 `i + 1` 이 된다.
 */
function failWithoutProper(pattern: string): number[] {
  return Array.from({ length: pattern.length }, (_, i) => i + 1);
}

/**
 * 실패 함수 표를 밖에서 받아 대조하는 절차. 표가 잘못되면 같은 자리에서 몇 번이나
 * 되풀이되는지 세려고 상한을 둔다 — 상한이 없으면 멈추지 않는 표가 있다.
 */
function matchWithTable(
  text: string,
  pattern: string,
  fail: number[],
  cap: number,
): { found: number[]; stalledAt: number; spins: number } {
  const n = text.length;
  const m = pattern.length;
  const found: number[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    let spins = 0;
    while (j > 0 && text[i] !== pattern[j]) {
      j = fail[j - 1] as number;
      spins++;
      if (spins >= cap) return { found, stalledAt: i, spins };
    }
    if (text[i] === pattern[j]) j++;
    if (j === m) {
      found.push(i - m + 1);
      j = fail[j - 1] as number;
    }
  }
  return { found, stalledAt: -1, spins: 0 };
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  findAllOccurrences(text: string, pattern: string): number[];
}

const REF = new URL("./findAllOccurrences-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 어긋났을 때 맞은 길이를 **하나씩만** 줄이는 사본. 불변식을 지키던 바로 그 줄이다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const stepBackOne = await loadMutant<Impl>(REF, {
  swap: [
    /while \(j > 0 && text\[i\] !== pattern\[j\]\) j = fail\[j - 1\] as number;/,
    "while (j > 0 && text[i] !== pattern[j]) j = j - 1;",
  ],
});

/** 어긋났을 때 맞은 길이를 통째로 버리는 사본. */
const restartAtZero = await loadMutant<Impl>(REF, {
  swap: [
    /while \(j > 0 && text\[i\] !== pattern\[j\]\) j = fail\[j - 1\] as number;/,
    "while (j > 0 && text[i] !== pattern[j]) j = 0;",
  ],
});

/** 패턴 전체가 맞은 뒤 맞은 길이를 `0` 으로 두는 사본. */
const matchResetsToZero = await loadMutant<Impl>(REF, {
  swap: [/^\s+j = fail\[j - 1\] as number;$/, "      j = 0;"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  text: string;
  pattern: string;
}

const NAMED = (text: string, pattern: string): Case => ({
  name: `"${text}" / "${pattern}"`,
  text,
  pattern,
});

const WALK_CASE: Case = {
  name: `전개 입력 "${WALK_TEXT}" / "${WALK_PATTERN}"`,
  text: WALK_TEXT,
  pattern: WALK_PATTERN,
};

/** 겹치는 등장을 가르는 목록. 세 후보가 같은 자리에서 갈리므로 함께 쓴다. */
const OVERLAP_CASES: Case[] = [
  WALK_CASE,
  NAMED("aaaa", "aa"),
  NAMED("abcabc", "abc"),
  NAMED("ababcababab", "abab"),
];

/**
 * 「맞은 길이를 얼마로 줄이는가」를 가르는 목록.
 *
 * 둘째 줄은 **0 으로 버리는 후보**만 어긋나는 자리이고, 셋째 줄은 **하나씩 줄이는 후보**만
 * 어긋나는 자리다. 둘 중 하나만 두면 나머지 후보가 통과해 버린다.
 */
const PULLBACK_CASES: Case[] = [
  WALK_CASE,
  NAMED("aaab", "aab"),
  NAMED("abba", "aba"),
  NAMED("aabaabaaa", "aabaa"),
  NAMED("aaaaa", "aaa"),
];

/** 입력의 모양을 네 가지로 놓고 두 방식의 계수를 견주는 목록. 길이는 열둘로 같다. */
const SHAPE_CASES: [string, string, string][] = [
  ["전개 입력", WALK_TEXT, WALK_PATTERN],
  ["전부 같은 글자", "aaaaaaaaaaaa", "aaab"],
  ["패턴이 되풀이된다", "abababababab", "abab"],
  ["첫 글자부터 어긋난다", "cccccccccccc", "abab"],
];

/** 규모를 열 배씩 키우며 두 방식의 증가를 보는 자리. 패턴 길이는 텍스트의 절반이다. */
const SCALE = [12, 120, 1200, 12000];

/** 답이 안 바뀐 자리와 바뀐 자리를 함께 보인다. 하나도 안 바뀌면 「어긋난다」가 거짓이다. */
function assertBreaks(gaps: number[]): void {
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
}

/** 계측기가 정본과 같은 답을 내는지 확인한다. 안 같으면 계측이 다른 절차를 잰 것이다. */
function assertSame(text: string, pattern: string, got: number[]): number[] {
  const want = findAllOccurrences(text, pattern);
  if (got.join(",") !== want.join(",")) {
    throw new Error(
      `계측기와 정본의 답이 다르다 — 계측 ${show(got)} ≠ 정본 ${show(want)}`,
    );
  }
  return got;
}

/** 두 방식을 나란히 실행해 사례 표를 만든다. */
function contrast(
  cases: Case[],
  other: (text: string, pattern: string) => number[],
): { rows: string[][]; gaps: number[] } {
  const rows: string[][] = [];
  const gaps: number[] = [];
  for (const c of cases) {
    const bare = findAllOccurrences(c.text, c.pattern);
    const got = other(c.text, c.pattern);
    const same = bare.join(",") === got.join(",");
    gaps.push(same ? 0 : 1);
    rows.push([c.name, show(bare), show(got), same ? "같다" : "어긋난다"]);
  }
  return { rows, gaps };
}

const CONTRAST_HEAD = (otherHead: string): string[] => [
  "입력",
  "정본이 낸 답",
  otherHead,
  "판정",
];

const repeat = (unit: string, times: number): string => unit.repeat(times);

/**
 * 텍스트 위에 찾은 시작 자리를 표시한 그림.
 *
 * **손으로 그리지 않는다.** 열 정렬은 어떤 스캐너도 안 보는 자리라, 한 칸만 어긋나도 눈으로
 * 읽으면 통과한다(`FEEDBACK.md` §3, 2026-08-29 실측).
 */
function occurrencePicture(text: string, pattern: string): string[] {
  const found = findAllOccurrences(text, pattern);
  const head = "자리";
  const cell = (s: string): string => padLeft(s, 3);
  const at = (i: number): number => width(head) + 3 * i + 2;
  const lines = [
    head + [...text].map((_, i) => cell(String(i))).join(""),
    padRight("T", width(head)) + [...text].map((c) => cell(c)).join(""),
  ];
  for (const start of found) {
    const marks: string[] = [];
    for (let c = 0; c < at(start); c++) marks.push(" ");
    for (let k = 0; k < pattern.length; k++) {
      marks.push("^");
      if (k < pattern.length - 1) marks.push(" ", " ");
    }
    lines.push(
      `${padRight(marks.join(""), at(text.length - 1) + 3)}자리 ${start} 에서 맞는다`,
    );
  }
  return lines;
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 겹쳐서 등장하는 자리를 텍스트 위에 그린다. */
  "concept-overlap": () => {
    const text = "ababcababab";
    const pattern = "abab";
    const found = findAllOccurrences(text, pattern);
    return [
      ...occurrencePicture(text, pattern),
      "",
      `답 ${show(found)}`,
      `└ 자리 ${found[1]} 의 등장이 자리 ${(found[1] as number) + pattern.length - 1} 까지 이어지는데 그 안에서 다음 등장이 시작한다. 둘 다 답이다`,
    ].join("\n");
  },

  /** `concept` — 실패 함수의 값과 그 값이 뜻하는 조각. */
  "concept-fail": () => {
    const p = "abab";
    const fail = failOf(p);
    const rows = [...p].map((_, i) => [
      String(i),
      p.slice(0, i + 1),
      String(fail[i]),
      (fail[i] as number) === 0 ? "없음" : p.slice(0, fail[i] as number),
    ]);
    return [
      `P = ${[...p].join(" ")}`,
      "",
      table(["자리 i", "P[0..i]", "fail[i]", "그 길이의 앞부분"], rows, [
        "r",
        "l",
        "r",
        "l",
      ]),
      "",
      `└ abab 의 앞 두 글자와 뒤 두 글자가 둘 다 ab 라서 fail[3] 이 ${fail[3]} 이다`,
    ].join("\n");
  },

  /** `deep.build` ② — 시작 자리를 다 대조하는 방식의 비용이 패턴 길이에 따라 어떻게 되는가. */
  "naive-cost": () => {
    const n = 12;
    const rows = [2, 3, 4, 6, 9, 11].map((m) => {
      const text = repeat("a", n);
      const pattern = repeat("a", m);
      const got = everyStart(text, pattern);
      return [
        String(m),
        num(n - m + 1),
        num(got.cmp),
        num((n - m + 1) * m),
        num(got.found.length),
      ];
    });
    let bestM = 0;
    let bestCost = 0;
    for (let m = 1; m <= LIMIT; m++) {
      const cost = (LIMIT - m + 1) * m;
      if (cost > bestCost) {
        bestCost = cost;
        bestM = m;
      }
    }
    return [
      table(
        [
          `패턴 길이 m (텍스트는 a 가 ${n} 개)`,
          "시작 자리 수",
          "견주기(실측)",
          "(n−m+1)m",
          "찾은 자리 수",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `제약 규모 n = ${num(LIMIT)} 에서 (n−m+1)m 이 가장 커지는 m 을 전수로 찾으면`,
      table(
        ["  가장 큰 m", num(bestM)],
        [
          ["  그때의 견주기", num(bestCost)],
          ["  초당 1 억 번 기준", `${(bestCost / 100_000_000).toFixed(1)} 초`],
        ],
        ["l", "r"],
      ),
      "  └ 패턴이 텍스트의 절반 길이일 때가 가장 크다. 양 끝(m=1 · m=n)이 아니다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리했을 때의 견주기. */
  "cost-two-ways": () => {
    const rows = SHAPE_CASES.map(([name, text, pattern]) => {
      const naive = everyStart(text, pattern);
      const mine = counted(text, pattern);
      assertSame(text, pattern, naive.found);
      assertSame(text, pattern, mine.found);
      return [
        name,
        `"${text}" / "${pattern}"`,
        num(naive.cmp),
        num(mine.build),
        num(mine.scan),
        num(mine.build + mine.scan),
      ];
    });
    const scaleRows = SCALE.map((n) => {
      const m = n / 2;
      const text = repeat("a", n);
      const pattern = repeat("a", m);
      const naive = everyStart(text, pattern);
      const mine = counted(text, pattern);
      assertSame(text, pattern, mine.found);
      return [
        num(n),
        num(m),
        num(naive.cmp),
        num(mine.build + mine.scan),
        `${num(Math.round(naive.cmp / (mine.build + mine.scan)))} 배`,
      ];
    });
    return [
      table(
        [
          "입력의 모양 (n = 12)",
          "텍스트 / 패턴",
          "시작 자리 전수 대조",
          "실패 함수 만들기",
          "텍스트 대조",
          "이 방식 합",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      "같은 모양(텍스트가 전부 a · 패턴은 그 절반 길이)에서 규모만 키우면",
      table(["n", "m", "시작 자리 전수 대조", "이 방식", "몇 배"], scaleRows, [
        "r",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 왼쪽은 n 을 열 배 하면 백 배가 되고, 오른쪽은 열 배가 된다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 「맞은 길이만큼 시작 자리를 옮긴다」 후보가 어디서 어긋나는가. */
  "restart-candidates": () => {
    const { rows, gaps } = contrast(OVERLAP_CASES, (text, pattern) =>
      skipByMatched(text, pattern),
    );
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("맞은 길이만큼 옮긴 답"), rows, ["l", "l", "l", "l"]),
      "",
      "└ 겹쳐서 등장하는 자리를 통째로 넘긴다. 겹침이 없는 셋째 줄에서만 답이 같다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 맞은 길이를 얼마로 줄일지 세 후보를 답으로 가른다. */
  "pullback-choice": () => {
    const heads = ["0 으로", "하나씩", "fail 이 가리키는 값으로"];
    const impls: ((text: string, pattern: string) => number[])[] = [
      (t, p) => restartAtZero.findAllOccurrences(t, p),
      (t, p) => stepBackOne.findAllOccurrences(t, p),
      (t, p) => findAllOccurrences(t, p),
    ];
    const wrong = [0, 0, 0];
    const rows = PULLBACK_CASES.map((c) => {
      const bare = findAllOccurrences(c.text, c.pattern);
      const cells = impls.map((f, k) => {
        const got = f(c.text, c.pattern);
        if (got.join(",") !== bare.join(","))
          wrong[k] = (wrong[k] as number) + 1;
        return show(got);
      });
      return [c.name, show(bare), ...cells];
    });
    rows.push(["어긋난 입력 수", "", ...wrong.map(String)]);
    return [
      table(["입력", "정답", ...heads], rows, ["l", "l", "l", "l", "l"]),
      "",
      "└ 세 후보 중 하나만 다섯 입력에서 다 맞는다",
    ].join("\n");
  },

  /** `deep.walk.step` 1 — 실패 함수를 만드는 걸음별 값. 패턴 둘을 나란히 만든다. */
  "walk-fail": () => {
    const build = (p: string): string => {
      const fail = failOf(p);
      const rows: string[][] = [];
      let k = 0;
      for (let i = 1; i < p.length; i++) {
        const before = k;
        const chain: number[] = [];
        while (k > 0 && p[i] !== p[k]) {
          k = fail[k - 1] as number;
          chain.push(k);
        }
        const matched = p[i] === p[k];
        if (matched) k++;
        rows.push([
          String(i),
          String(p[i]),
          String(before),
          chain.length === 0 ? "—" : chain.join("→"),
          matched ? "같다" : "다르다",
          String(k),
        ]);
      }
      return [
        `패턴  ${[...p].join(" ")}`,
        `자리  ${[...p].map((_, i) => i).join(" ")}`,
        "",
        table(
          ["i", "들어올 때 k", "줄인 자리", "P[i] 와 P[k]", "fail[i]"],
          rows.map((r) => [
            r[0] ?? "",
            r[2] ?? "",
            r[3] ?? "",
            r[4] ?? "",
            r[5] ?? "",
          ]),
          ["r", "r", "l", "l", "r"],
        ),
        "",
        `fail = [${fail.join(", ")}]`,
      ].join("\n");
    };
    return [
      build(WALK_PATTERN),
      "",
      "─────────────────────────────",
      "",
      build("aabaa"),
      "",
      "└ 위 패턴은 줄이는 자리가 한 번도 없고, 아래 패턴은 i = 2 에서 k 를 1 에서 0 으로 줄인다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 진 접두사 조건을 빼면 무엇이 달라지는가. */
  "pause-proper": () => {
    const p = WALK_PATTERN;
    const proper = failOf(p);
    const loose = failWithoutProper(p);
    const rows = [...p].map((ch, i) => [
      String(i),
      String(ch),
      String(proper[i]),
      String(loose[i]),
      `${loose[i]} = ${i} + 1`,
    ]);
    const cap = 1000;
    const stuck = matchWithTable(WALK_TEXT, p, loose, cap);
    const good = matchWithTable(WALK_TEXT, p, proper, cap);
    assertSame(WALK_TEXT, p, good.found);
    return [
      table(
        ["i", "P[i]", "진 접두사만 센 fail", "자기 자신도 센 fail", "왜"],
        rows,
        ["r", "l", "r", "r", "l"],
      ),
      "",
      `전개 입력 "${WALK_TEXT}" 를 두 표로 각각 대조하면`,
      table(
        ["  진 접두사만 센 표", show(good.found)],
        [
          [
            "  자기 자신도 센 표",
            `자리 ${stuck.stalledAt} 에서 ${num(stuck.spins)} 번을 줄여도 끝나지 않는다`,
          ],
        ],
        ["l", "l"],
      ),
      "└ 줄이려는 값이 줄이기 전과 같아서 같은 자리를 벗어나지 못한다",
    ].join("\n");
  },

  /**
   * `deep.walk.step` 3 — 찾은 시작 자리를 텍스트 위에 그린 그림.
   *
   * **손으로 그리지 않는다.** 열 정렬은 어떤 스캐너도 안 보는 자리라, 한 칸만 어긋나도
   * 눈으로 읽으면 통과한다(`FEEDBACK.md` §3, 2026-08-29 실측).
   */
  "walk-picture": () => {
    const found = findAllOccurrences(WALK_TEXT, WALK_PATTERN);
    return [
      ...occurrencePicture(WALK_TEXT, WALK_PATTERN),
      "",
      `└ ${found.length} 개가 서로 겹친다. 앞의 둘은 두 글자를, 뒤의 둘도 두 글자를 함께 쓴다`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 고정 입력을 끝까지 대조한 걸음별 상태값. */
  "walk-trace": () => {
    const t = WALK_TEXT;
    const p = WALK_PATTERN;
    const fail = failOf(p);
    const rows: string[][] = [];
    const found: number[] = [];
    let j = 0;
    for (let i = 0; i < t.length; i++) {
      const before = j;
      const chain: number[] = [];
      let cmp = 0;
      while (j > 0) {
        cmp++;
        if (t[i] === p[j]) break;
        j = fail[j - 1] as number;
        chain.push(j);
      }
      cmp++;
      const matched = t[i] === p[j];
      if (matched) j++;
      let hit = "—";
      if (j === p.length) {
        const at = i - p.length + 1;
        found.push(at);
        hit = String(at);
        j = fail[j - 1] as number;
      }
      rows.push([
        `T${i + 1}`,
        String(i),
        String(t[i]),
        String(before),
        chain.length === 0 ? "—" : chain.join("→"),
        matched ? "같다" : "다르다",
        String(cmp),
        String(j),
        hit,
      ]);
    }
    assertSame(t, p, found);
    return [
      table(
        [
          "걸음",
          "i",
          "T[i]",
          "들어올 때 j",
          "줄인 자리",
          "T[i] 와 P[j]",
          "견주기",
          "나갈 때 j",
          "적은 시작 자리",
        ],
        rows,
        ["l", "r", "l", "r", "l", "l", "r", "r", "r"],
      ),
      "",
      `└ i 는 0 부터 ${t.length - 1} 까지 한 칸씩만 올라갔고 한 번도 작아지지 않았다. 답은 ${show(found)} 이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 패턴 전체가 맞은 뒤 맞은 길이를 0 으로 두면 무엇이 달라지는가. */
  "pause-match-reset": () => {
    const { rows, gaps } = contrast(OVERLAP_CASES, (text, pattern) =>
      matchResetsToZero.findAllOccurrences(text, pattern),
    );
    assertBreaks(gaps);
    return [
      table(CONTRAST_HEAD("0 으로 둔 답"), rows, ["l", "l", "l", "l"]),
      "",
      "└ 셋째 줄은 답이 같다 — 등장이 겹치지 않는 입력에서는 어긋나지 않는다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 텍스트 자리를 되짚지 않는 것과 견주기가 n 번인 것은 다르다. */
  "pause-compare-count": () => {
    const rows = SHAPE_CASES.map(([name, text, pattern]) => {
      const mine = counted(text, pattern);
      assertSame(text, pattern, mine.found);
      return [
        name,
        num(text.length),
        num(mine.scan),
        num(3 * text.length),
        `${(mine.scan / text.length).toFixed(2)} 배`,
      ];
    });
    const big = repeat("a", LIMIT);
    const bigPattern = `${repeat("a", 999)}b`;
    const heavy = counted(big, bigPattern);
    assertSame(big, bigPattern, heavy.found);
    return [
      table(
        ["입력의 모양 (n = 12)", "n", "텍스트 대조 견주기", "3n", "n 의 몇 배"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `텍스트가 a ${num(LIMIT)} 개이고 패턴이 a 999 개 뒤에 b 하나이면`,
      table(
        ["  텍스트 대조 견주기", num(heavy.scan)],
        [
          ["  3n", num(3 * LIMIT)],
          [
            "  상한에 대한 비율",
            `${((heavy.scan / (3 * LIMIT)) * 100).toFixed(1)} %`,
          ],
        ],
        ["l", "r"],
      ),
      "└ 견주기는 n 보다 많지만 3n 을 넘지 않는다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 패턴에 넣어 손으로 확인한다. */
  "math-check": () => {
    const rows: string[][] = [];
    for (const p of ["abab", "aabaa", "aaab"]) {
      const fail = failOf(p);
      for (let i = 0; i < p.length; i++) {
        const prefixes: string[] = [];
        for (let k = 1; k <= i; k++) {
          const head = p.slice(0, k);
          const tail = p.slice(i + 1 - k, i + 1);
          if (head === tail) prefixes.push(head);
        }
        rows.push([
          p,
          String(i),
          p.slice(0, i + 1),
          prefixes.length === 0 ? "없음" : prefixes.join(" · "),
          String(fail[i]),
        ]);
      }
    }
    return table(
      ["P", "i", "P[0..i]", "접두사이자 접미사인 진 조각", "fail[i]"],
      rows,
      ["l", "r", "l", "l", "r"],
    );
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const m = n / 2;
      const text = repeat("a", n);
      const pattern = repeat("a", m);
      const naive = everyStart(text, pattern);
      const mine = counted(text, pattern);
      assertSame(text, pattern, mine.found);
      return [
        num(n),
        num(m),
        num(naive.cmp),
        num((n - m + 1) * m),
        num(mine.build + mine.scan),
        num(3 * (n + m)),
      ];
    });
    const n = LIMIT;
    const m = n / 2;
    const atLimit = counted(repeat("a", n), repeat("a", m));
    assertSame(repeat("a", n), repeat("a", m), atLimit.found);
    const mine = atLimit.build + atLimit.scan;
    return [
      table(
        ["n", "m", "전수 대조(실측)", "(n−m+1)m", "이 방식(실측)", "3(n+m)"],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `제약 규모 n = ${num(n)} · m = ${num(m)} 에서는`,
      table(
        ["  (n−m+1)m", num((n - m + 1) * m)],
        [
          ["  이 방식(실측)", num(mine)],
          ["  3(n+m) 상한", num(3 * (n + m))],
          ["  두 값의 비", `${num(Math.round(((n - m + 1) * m) / mine))} 배`],
        ],
        ["l", "r"],
      ),
    ].join("\n");
  },

  /** `invariant` ③ — 맞은 길이를 하나씩만 줄이면 무엇이 나오는가. */
  "mutant-step-back": () => {
    const { rows, gaps } = contrast(PULLBACK_CASES, (text, pattern) =>
      stepBackOne.findAllOccurrences(text, pattern),
    );
    assertBreaks(gaps);
    const fail = failOf("aba");
    return [
      table(CONTRAST_HEAD("하나씩 줄인 답"), rows, ["l", "l", "l", "l"]),
      "",
      `"aba" 의 fail = [${fail.join(", ")}] 이라 2 에서 한 걸음에 ${fail[1]} 까지 줄어야 한다`,
      '└ 하나씩 줄이면 1 을 거치는데, "abba" 의 자리 1 까지 본 끝 한 글자는 "b" 이고 P[0..0] 은 "a" 라 같지 않다',
    ].join("\n");
  },

  /** `perf.derive` — 걸음의 무리마다 몇 번의 견주기가 드는가. */
  "perf-count": () => {
    const mine = counted(WALK_TEXT, WALK_PATTERN);
    assertSame(WALK_TEXT, WALK_PATTERN, mine.found);
    const t = WALK_TEXT;
    const p = WALK_PATTERN;
    const fail = failOf(p);
    const perStep: number[] = [];
    let j = 0;
    for (let i = 0; i < t.length; i++) {
      let cmp = 0;
      while (j > 0) {
        cmp++;
        if (t[i] === p[j]) break;
        j = fail[j - 1] as number;
      }
      cmp++;
      if (t[i] === p[j]) j++;
      if (j === p.length) j = fail[j - 1] as number;
      perStep.push(cmp);
    }
    const once = perStep.filter((c) => c === 1).length;
    const twice = perStep.filter((c) => c === 2).length;
    const more = perStep.filter((c) => c > 2).length;
    const rows = [
      [
        "실패 함수 만들기",
        `패턴 ${p.length} 글자`,
        String(p.length - 1),
        num(mine.build),
      ],
      [
        "텍스트 대조",
        `T1 부터 T${t.length} 까지`,
        String(t.length),
        num(mine.scan),
      ],
      ["합계", "", "", num(mine.build + mine.scan)],
    ];
    return [
      table(["무리", "어느 걸음인가", "걸음 수", "견주기"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      "텍스트 대조의 걸음을 견주기 횟수로 나누면",
      table(
        ["  견주기 1 번인 걸음", String(once)],
        [
          ["  견주기 2 번인 걸음", String(twice)],
          ["  견주기 3 번 이상인 걸음", String(more)],
        ],
        ["l", "r"],
      ),
      `└ 걸음마다 최소 한 번이라 ${t.length} 번은 반드시 들고, 나머지 ${mine.scan - t.length} 번은 줄이기가 낸 것이다`,
    ].join("\n");
  },

  /** `perf.worst` — 견주기를 가장 크게 만드는 입력을 실제로 구성한다. */
  "worst-shape": () => {
    const n = LIMIT;
    const shapes: [string, string, string][] = [
      [
        "텍스트가 전부 a · 패턴 a 999 개 + b",
        repeat("a", n),
        `${repeat("a", 999)}b`,
      ],
      ["텍스트가 전부 a · 패턴 a 1,000 개", repeat("a", n), repeat("a", 1000)],
      ["텍스트가 전부 a · 패턴 aab", repeat("a", n), "aab"],
      [
        "a 999 개 + b 를 100 번 이은 텍스트 · 같은 패턴",
        repeat(`${repeat("a", 999)}b`, 100),
        `${repeat("a", 999)}b`,
      ],
      [
        "텍스트가 전부 c · 패턴 a 999 개 + b",
        repeat("c", n),
        `${repeat("a", 999)}b`,
      ],
    ];
    const rows = shapes.map(([name, text, pattern]) => {
      const mine = counted(text, pattern);
      assertSame(text, pattern, mine.found);
      return [
        name,
        num(mine.build),
        num(mine.scan),
        num(mine.build + mine.scan),
        num(mine.found.length),
      ];
    });
    let bestM = 0;
    let bestScan = 0;
    const sweepText = repeat("a", 20_000);
    for (let m = 2; m <= 200; m++) {
      const pattern = `${repeat("a", m - 1)}b`;
      const got = counted(sweepText, pattern);
      if (got.scan > bestScan) {
        bestScan = got.scan;
        bestM = m;
      }
    }
    return [
      table(
        [
          `입력의 모양 (n = ${num(n)})`,
          "실패 함수 만들기",
          "텍스트 대조",
          "합",
          "찾은 자리 수",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `텍스트를 a ${num(20_000)} 개로 고정하고 패턴을 a 여러 개 + b 로 두어 길이를 2 부터 200 까지 바꿔 가며 재면`,
      table(
        ["  텍스트 대조가 가장 많은 패턴 길이", String(bestM)],
        [
          ["  그때의 텍스트 대조", num(bestScan)],
          ["  3n", num(3 * 20_000)],
        ],
        ["l", "r"],
      ),
      "└ 견주기를 최대로 만드는 것은 긴 패턴이 아니라 짧고 앞부분이 되풀이되는 패턴이다",
    ].join("\n");
  },
};
