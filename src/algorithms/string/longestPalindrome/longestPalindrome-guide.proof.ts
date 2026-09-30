/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 자리마다의 상태는 그림 사이드카의 `replay`(정본과 답을 대조한 다시 쓰기)와 `trace`(정본 계측과 대조한
 * 기록)에서 받고, 셈은 그림 사이드카의 계수기에서 받는다 — 그림과 표가 같은 기록을 쓴다. 판정 줄(「같다」·
 * 「어긋난다」)이 있는 블록은 중화 실행에서도 값이 나오도록 `trace` 대신 `replay` 를 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/longestPalindrome/longestPalindrome-guide.md
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를 } from "../../../../tools/josa.ts";
import {
  ALL_SAME_TEXT,
  manacherCellsHeld,
  manacherRun,
  SWEEP_N,
  SWEEP_TEXT,
  treeCellsHeld,
  treeRun,
} from "./longestPalindrome-guide.alt.ts";
import {
  allSameClosed,
  BRANCH_NAME,
  bruteLength,
  type CarryRule,
  countBrute,
  countCenter,
  countManacher,
  isPalindrome,
  LIMIT,
  num,
  OPS_PER_SEC,
  originCounts,
  type Row,
  RULE_NAME,
  replay,
  SEP,
  SHAPES,
  shape,
  show,
  trace,
  WALK,
  walkRun,
  walkSteps,
  widen,
} from "./longestPalindrome-guide.fig.tsx";
import { longestPalindrome } from "./longestPalindrome-guide.ref.ts";

const REF = new URL("./longestPalindrome-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

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

/** 표와 그 아래 문장 — 닫는 마커까지 대조하는 블록의 몸통. */
const block = (...parts: string[]): string => parts.join("\n\n");

const quote = (s: string): string => `"${s}"`;

/** 입력 이름 — 전개 입력은 그렇다고 밝힌다. */
const label = (s: string): string =>
  s === WALK ? `전개 입력 "${s}"` : quote(s);

/** 1 초에 1 억 번 기준의 초. */
const secs = (access: number | bigint): string => {
  const x = Number(access) / OPS_PER_SEC;
  return x >= 10 ? `${num(Math.round(x))} 초` : `${x.toFixed(3)} 초`;
};

/** 두 글자 알파벳(a · b)의 길이 `n` 문자열 전부. */
function* binaryStrings(n: number): Generator<string> {
  for (let mask = 0; mask < 1 << n; mask++) {
    let s = "";
    for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
    yield s;
  }
}

const LABELS = ["①", "②", "③", "④", "⑤", "⑥"];

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  longestPalindrome(s: string): string;
}

/** 이어받은 값을 오른쪽 끝에서 자르지 않는 사본. */
const noClip = await loadMutant<Impl>(REF, {
  swap: [
    /Math\.min\(r - i, p\[2 \* c - i\] as number\)/,
    "(p[2 * c - i] as number)",
  ],
});

/** 반지름이 같을 때도 자리를 바꾸는 사본 — 가장 오른쪽 자리가 남는다. */
const rightmostTie = await loadMutant<Impl>(REF, {
  swap: [
    /if \(k > \(p\[best\] as number\)\) best = i;/,
    "if (k >= (p[best] as number)) best = i;",
  ],
});

/** **불변식을 지키던 줄** 하나 — 앞쪽 구분자를 빼고 넓힌 사본. */
const noLeadingSep = await loadMutant<Impl>(REF, {
  swap: [
    /const t = `#\$\{\[\.\.\.s\]\.join\("#"\)\}#`;/,
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 정본 소스로 바꿔 넣을 코드 조각이다
    'const t = `${[...s].join("#")}#`;',
  ],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noClip.longestPalindrome === longestPalindrome;

/** 본문 여러 자리가 함께 쓰는 작은 입력 열. */
const SMALL: string[] = [
  WALK,
  "babaaa",
  "ababbb",
  "aaaa",
  "abba",
  "abcba",
  "abab",
  "cbbd",
  "racecar",
  "abcde",
];

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다. 반지름이 같을 때 자리를
// 바꾸는 변이는 여기 넣지 않는다 — 길이가 어느 입력에서도 안 바뀌는 것이 그 변이의 결론이다.
if (!중화됨) {
  for (const [name, impl] of [
    ["자르지 않는 판", noClip],
    ["앞 구분자를 뺀 판", noLeadingSep],
  ] as [string, Impl][]) {
    if (SMALL.every((s) => longestPalindrome(s) === impl.longestPalindrome(s)))
      throw new Error(`${name} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

/**
 * 변이 하나를 작은 입력 열에 걸어 정본과 나란히 놓는다. **「지나간 횟수」 열이 있어야 「같다」 가 뜻을
 * 갖는다.** 그 값이 0 이면 변이가 바꾼 자리를 그 입력이 한 번도 지나가지 않은 것이다.
 */
function mutantTable(
  head: string,
  impl: Impl,
  passHead: string,
  passes: (s: string) => number,
): { table: string; broken: number } {
  let broken = 0;
  const rows = SMALL.map((s) => {
    const a = longestPalindrome(s);
    const b = impl.longestPalindrome(s);
    if (a !== b) broken++;
    return [
      label(s),
      String(passes(s)),
      quote(a),
      quote(b),
      a === b ? "같다" : "어긋난다",
    ];
  });
  return {
    table: md(["입력", passHead, "정본", head, "판정"], rows, [1]),
    broken,
  };
}

/** 대칭 자리의 반지름이 남은 칸보다 커서 잘린 자리 수 — 자르는 줄이 값을 한 횟수다. */
const clippedPlaces = (s: string): number =>
  replay(s).rows.filter((row) => row.branch === "clip").length;

/** 반지름이 지금까지의 최댓값과 같아진 자리 수 — `>` 와 `>=` 가 갈리는 횟수다. */
function tiedPlaces(s: string): number {
  const r = replay(s);
  let tied = 0;
  let best = 0;
  for (const row of r.rows) {
    if (row.p === (r.p[best] as number)) tied++;
    if (row.p > (r.p[best] as number)) best = row.i;
  }
  return tied;
}

/** 이어받는 방식만 바꾼 절차 — 자리마다의 반지름과 오른쪽 끝을 기록한다. 정본과 같은 줄 순서다. */
function ruleRows(
  s: string,
  rule: CarryRule,
): {
  p: number[];
  r: number[];
  mirror: (number | null)[];
  carried: (number | null)[];
  ans: string;
} {
  const t = widen(s);
  const m = t.length;
  const p = new Array<number>(m).fill(0);
  const rs: number[] = [];
  const mirror: (number | null)[] = [];
  const carried: (number | null)[] = [];
  let c = 0;
  let r = 0;
  let best = 0;
  for (let i = 0; i < m; i++) {
    let k = 0;
    mirror.push(i < r ? 2 * c - i : null);
    if (i < r) {
      const pm = p[2 * c - i] as number;
      k =
        rule === "mirror"
          ? pm
          : rule === "edge"
            ? r - i
            : rule === "min"
              ? Math.min(r - i, pm)
              : 0;
    }
    carried.push(i < r ? k : null);
    while (i - k - 1 >= 0 && i + k + 1 < m && t[i - k - 1] === t[i + k + 1])
      k++;
    p[i] = k;
    if (i + k > r) {
      c = i;
      r = i + k;
    }
    rs.push(r);
    if (k > (p[best] as number)) best = i;
  }
  const start = (best - (p[best] as number)) / 2;
  const ans = s.slice(start, start + (p[best] as number));
  if (ans !== countManacher(s, rule).ans) {
    throw new Error("기록하는 사본과 계수기가 다른 답을 냈다");
  }
  return { p, r: rs, mirror, carried, ans };
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /* ── 전체 컨셉 ── */

  "concept-cost": () => {
    const o = originCounts();
    const walkB = countBrute(WALK).access;
    const walkC = countCenter(WALK).access;
    const walkM = countManacher(WALK).access;
    const sameM = countManacher(ALL_SAME_TEXT).access;
    const ratio = Math.round(Number(o.closed.center) / sameM);
    return block(
      md(
        ["방법", `전개 입력 "${WALK}"`, `전부 같은 글자 n = ${num(LIMIT)}`],
        [
          ["부분 문자열 전부 확인하기", num(walkB), num(o.closed.brute)],
          ["한가운데에서 넓히기", num(walkC), num(o.closed.center)],
          ["매내처 알고리즘", num(walkM), num(sameM)],
        ],
        [1, 2],
      ),
      `셋 다 자료 접근 횟수입니다. 전부 같은 글자 ${num(LIMIT)} 개에서 앞의 두 줄은 식으로 낸 값이고(작은 n 에서 실제로 센 값과 같습니다), 마지막 줄은 실행한 값입니다. 한가운데에서 넓히기와 매내처 알고리즘의 차이는 ${num(ratio)} 배입니다.`,
    );
  },

  /* ── 아이디어를 떠올리는 과정 ── */

  "origin-naive-cost": () => {
    const rows = [100, 1_000].map((n) => {
      const a = countBrute("a".repeat(n)).access;
      return [num(n), num(a), secs(a)];
    });
    const big = allSameClosed(LIMIT).brute;
    rows.push([num(LIMIT), num(big), secs(big)]);
    return block(
      md(["n", "자료 접근", "초당 1 억 번 기준 시간"], rows, [0, 1, 2]),
      `전부 같은 글자에서 셌습니다. n = ${num(LIMIT)}${은는(num(LIMIT))} 실행하지 않고 식으로 낸 값이고, 그 식은 n = 300 까지 실제로 센 값과 같습니다.`,
    );
  },

  "origin-recheck": () => {
    const s = "aaaa";
    const n = s.length;
    const hits = new Map<string, string[]>();
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        for (let a = i, b = j; a < b; a++, b--) {
          const key = `(${a}, ${b})`;
          const list = hits.get(key) ?? [];
          list.push(`[${i},${j}]`);
          hits.set(key, list);
          if (s[a] !== s[b]) break;
        }
      }
    }
    const rows = [...hits.entries()].map(([pair, pieces]) => [
      pair,
      String(pieces.length),
      pieces.join(" · "),
    ]);
    const total = [...hits.values()].reduce((x, l) => x + l.length, 0);
    const again = [...hits.values()].reduce((x, l) => x + l.length - 1, 0);
    if (total !== countBrute(s).cmp) {
      throw new Error("맞댄 횟수가 계수기와 다르다");
    }
    return block(
      md(["맞댄 두 자리", "맞댄 횟수", "그 짝을 맞댄 조각"], rows, [1]),
      `"${s}" 에서 글자를 모두 ${total} 번 맞댔고, 그중 ${again} 번은 앞의 짧은 조각에서 이미 맞댄 짝을 다시 맞댄 것입니다.`,
    );
  },

  "origin-dp-cells": () => {
    const rows = [1_000, LIMIT].map((n) => {
      const cells = (n * (n + 1)) / 2;
      return [num(n), num(cells), `${num(Math.round(cells / 1e6))} MB`];
    });
    return block(
      md(
        [
          "n",
          "판정 DP 테이블의 칸 n(n+1)/2",
          "칸 하나를 1 바이트로 잡은 메모리",
        ],
        rows,
        [0, 1, 2],
      ),
      `n = ${num(LIMIT)} 이면 칸 하나를 1 바이트로 잡아도 흔한 예산 256 MB 의 ${num(Math.round((LIMIT * (LIMIT + 1)) / 2 / 256e6))} 배쯤입니다.`,
    );
  },

  "origin-two-ways": () => {
    const inputs: [string, string][] = [
      [label(WALK), WALK],
      [quote("aaaa"), "aaaa"],
      [quote("abcde"), "abcde"],
      [quote("racecar"), "racecar"],
      ["전부 같은 글자 n = 100", shape("전부 같은 글자", 100)],
      ["두 글자 번갈이 n = 100", shape("두 글자 번갈이", 100)],
      ["글자 26 개 되풀이 n = 100", shape("글자 26 개 되풀이", 100)],
    ];
    const rows = inputs.map(([name, s]) => {
      const a = countBrute(s);
      const b = countCenter(s);
      return [
        name,
        num(a.access),
        num(b.access),
        `${(a.access / b.access).toFixed(1)} 배`,
        a.ans.length === b.ans.length ? "같다" : "다르다",
      ];
    });
    return block(
      md(
        [
          "입력",
          "부분 문자열 전부 확인하기",
          "한가운데에서 넓히기",
          "앞 열 ÷ 뒤 열",
          "두 답의 길이",
        ],
        rows,
        [1, 2, 3],
      ),
      "둘째 · 셋째 열이 자료 접근 횟수이고, 넷째 열이 그 비입니다.",
    );
  },

  "origin-center-blowup": () => {
    const rows = [10, 100, 1_000, 10_000].map((n) => {
      const got = countCenter("a".repeat(n)).access;
      return [num(n), num(got), num(n * (n + 2)), secs(got)];
    });
    const big = allSameClosed(LIMIT).center;
    rows.push([num(LIMIT), "—", num(big), secs(big)]);
    return block(
      md(
        ["n", "실제로 센 자료 접근", "n(n + 2)", "초당 1 억 번 기준 시간"],
        rows,
        [0, 1, 2, 3],
      ),
      `전부 같은 글자에서 실제로 센 값이 n(n + 2) 와 자리마다 같습니다. n = ${num(LIMIT)}${은는(num(LIMIT))} 그 식으로 낸 값입니다.`,
    );
  },

  "origin-reexpand": () => {
    const s = "aaaaaaa";
    const r = replay(s);
    const none = ruleRows(s, "none");
    let same = 0;
    let inside = 0;
    const rows = r.rows
      .filter((row) => row.inside)
      .map((row) => {
        inside++;
        const pm = row.pMirror as number;
        const fresh = countOne(s, row.i);
        if (pm === row.p) same++;
        return [
          String(row.i),
          `[${row.cIn - (r.p[row.cIn] as number)},${row.rIn}]`,
          String(row.mirror),
          String(pm),
          String(none.p[row.i]),
          String(fresh),
        ];
      });
    return block(
      md(
        [
          "t 의 자리",
          "들어올 때 가장 오른쪽 회문",
          "대칭 자리",
          "대칭 자리의 반지름",
          "처음부터 넓힌 반지름",
          "처음부터 넓힐 때의 글자 비교",
        ],
        rows,
        [0, 2, 3, 4, 5],
      ),
      `"${s}" 를 넓힌 문자열에서 가장 오른쪽 회문 안에 든 자리가 ${inside} 곳이고, 그중 ${same} 곳에서 대칭 자리의 반지름이 처음부터 넓힌 반지름과 같습니다.`,
    );
  },

  "origin-mirror-wrong": () => {
    const good = ruleRows(WALK, "min");
    const bad = ruleRows(WALK, "mirror");
    const rows: string[][] = [];
    let first = -1;
    for (let i = 0; i < good.p.length; i++) {
      const mirror = bad.mirror[i] ?? null;
      if (mirror === null && good.p[i] === bad.p[i]) continue;
      if (first < 0 && good.p[i] !== bad.p[i]) first = i;
      rows.push([
        String(i),
        mirror === null ? "—" : String(mirror),
        String(bad.p[i]),
        String(good.p[i]),
        good.p[i] === bad.p[i] ? "맞다" : "틀리다",
      ]);
    }
    if (!중화됨 && noClip.longestPalindrome(WALK) !== bad.ans) {
      throw new Error("대칭 값 그대로 이어받는 사본이 변이와 다른 답을 낸다");
    }
    return block(
      md(
        [
          "t 의 자리",
          "대칭 자리",
          "대칭 값 그대로 적은 반지름",
          "진짜 반지름",
          "적은 반지름",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `대칭 값을 그대로 이어받으면 답이 "${bad.ans}" 가 되고, 바른 답은 "${good.ans}" 입니다. 처음 틀리는 곳은 자리 ${first} 입니다.`,
    );
  },

  /* ── 아이디어 상세 ── */

  "build-read-one": () => {
    const r = walkRun();
    const i = r.best;
    const k = r.p[i] as number;
    const start = (i - k) / 2;
    return [
      `p[${i}] = ${k}`,
      `  덮는 t 의 자리   ${i} − ${k} = ${i - k} 부터 ${i} + ${k} = ${i + k} 까지 — ${r.t.slice(i - k, i + k + 1)}`,
      `  그 안의 글자     홀수 자리 ${Array.from({ length: k }, (_, x) => i - k + 1 + 2 * x).join(" · ")} — ${k} 개`,
      `  s 에서의 조각    시작 자리 (${i} − ${k}) / 2 = ${start} · 길이 ${k} — ${WALK.slice(start, start + k)}`,
    ].join("\n");
  },

  "build-neighbors": () => {
    const r = walkRun();
    const c = r.best;
    const pc = r.p[c] as number;
    const lo = c - pc;
    const rows: string[][] = [];
    let same = 0;
    let within = 0;
    for (let d = 1; d <= pc; d++) {
      const a = c - d;
      const b = c + d;
      const pa = r.p[a] as number;
      const pb = r.p[b] as number;
      const inside = a - pa > lo;
      if (inside) within++;
      if (pa === pb) same++;
      rows.push([
        String(d),
        `p[${a}] = ${pa}`,
        `p[${b}] = ${pb}`,
        inside
          ? `[${lo},${c + pc}] 안`
          : `[${lo},${c + pc}] 의 끝까지 가거나 밖`,
        pa === pb ? "같다" : "다르다",
      ]);
    }
    return block(
      md(
        [
          "거리 d",
          `왼쪽 자리 ${c} − d`,
          `오른쪽 자리 ${c} + d`,
          "왼쪽 회문의 자리",
          "두 반지름",
        ],
        rows,
        [0],
      ),
      `왼쪽 회문이 구간 안에 통째로 든 ${within} 곳에서는 두 반지름이 모두 같고, 두 반지름이 같은 곳은 모두 ${same} 곳입니다.`,
    );
  },

  "build-two-arrays": () => {
    const n = WALK.length;
    const r = walkRun();
    // 넓히지 않고 잰 두 배열 — 글자 위 한가운데의 회문 길이, 글자 j − 1 과 j 사이의 회문 길이.
    const oddLen = (j: number): number => {
      let a = j;
      let b = j;
      while (a - 1 >= 0 && b + 1 < n && WALK[a - 1] === WALK[b + 1]) {
        a--;
        b++;
      }
      return b - a + 1;
    };
    const evenLen = (j: number): number => {
      let a = j - 1;
      let b = j;
      while (a >= 0 && b < n && WALK[a] === WALK[b]) {
        a--;
        b++;
      }
      return b - a - 1;
    };
    const rows: string[][] = [];
    let agree = 0;
    for (let j = 0; j <= n; j++) {
      const odd = j < n ? oddLen(j) : null;
      const even = j > 0 && j < n ? evenLen(j) : null;
      const pOdd = j < n ? (r.p[2 * j + 1] as number) : null;
      const pEven = r.p[2 * j] as number;
      if (odd === pOdd) agree++;
      if ((even ?? 0) === pEven) agree++;
      rows.push([
        String(j),
        odd === null ? "—" : String(odd),
        pOdd === null ? "—" : `p[${2 * j + 1}] = ${pOdd}`,
        even === null ? "끝" : String(even),
        `p[${2 * j}] = ${pEven}`,
      ]);
    }
    return block(
      md(
        [
          "j",
          "글자 j 위 회문 길이",
          "p 의 홀수 자리",
          "글자 j 앞 사이 회문 길이",
          "p 의 짝수 자리",
        ],
        rows,
        [0, 1, 3],
      ),
      `넓히지 않고 두 배열로 잰 길이와 p 의 값이 ${agree} 칸 모두에서 같습니다. 양 끝의 빈 자리 둘은 p 가 0 입니다.`,
    );
  },

  "build-widen": () => {
    const r = walkRun();
    const n = WALK.length;
    const js = Array.from({ length: n }, (_, j) => j);
    return block(
      md(
        ["s 의 글자 j", ...js.map(String)],
        [
          ["글자", ...js.map((j) => WALK[j] as string)],
          ["t 의 자리 2j + 1", ...js.map((j) => String(2 * j + 1))],
        ],
        js.map((j) => j + 1),
      ),
      `넓힌 문자열은 t = "${r.t}" 이고 m = 2 × ${n} + 1 = ${r.m} 입니다. 원래 글자 ${n} 개가 모두 홀수 자리에 있습니다.`,
    );
  },

  "build-edge": () => {
    const r = walkRun();
    let moved = 0;
    let shrank = 0;
    for (const row of r.rows) if (row.movedEdge) moved++;
    const rows = r.rows.map((row) => [
      String(row.i),
      String(row.p),
      String(row.i + row.p),
      String(row.rIn),
      row.movedEdge ? `옮긴다 → c = ${row.c}` : "그대로",
      String(row.r),
    ]);
    for (const row of r.rows) if (row.r < row.rIn) shrank++;
    return block(
      md(
        [
          "t 의 자리 i",
          "p[i]",
          "i + p[i]",
          "들어올 때 r",
          "c 와 r",
          "나갈 때 r",
        ],
        rows,
        [0, 1, 2, 3, 5],
      ),
      `자리 ${r.m} 개에서 오른쪽 끝을 옮긴 것은 ${moved} 번이고, r 이 줄어든 자리는 ${shrank} 곳입니다.`,
    );
  },

  "build-carry-detail": () => {
    const r = walkRun();
    const rows = r.rows
      .filter((row) => row.inside)
      .map((row) => [
        String(row.i),
        String(row.mirror),
        String(row.pMirror),
        String(row.rIn - row.i),
        String(row.carried),
        BRANCH_NAME[row.branch],
        String(row.grow),
        String(row.p),
      ]);
    const over = r.rows.filter(
      (row) => row.inside && (row.carried as number) > row.p,
    ).length;
    return block(
      md(
        [
          "t 의 자리 i",
          "대칭 자리 2c − i",
          "대칭 자리의 반지름",
          "남은 칸 r − i",
          "이어받은 값",
          "갈래",
          "더 늘린 칸",
          "p[i]",
        ],
        rows,
        [0, 1, 2, 3, 4, 6, 7],
      ),
      `구간 안에서 시작한 자리가 ${rows.length} 곳이고, 이어받은 값이 진짜 반지름을 넘은 자리는 ${over} 곳입니다.`,
    );
  },

  "build-extend": () => {
    const r = walkRun();
    const t = r.t;
    const why = {
      differ: "글자가 다르다",
      left: "왼쪽 끝",
      right: "오른쪽 끝",
    };
    let total = 0;
    const rows = r.rows.map((row) => {
      // 이어받지 않고 0 에서 넓힌다 — 2단계만 있는 절차다.
      let k = 0;
      let cmp = 0;
      let stop: keyof typeof why = "left";
      for (;;) {
        if (row.i - k - 1 < 0) {
          stop = "left";
          break;
        }
        if (row.i + k + 1 >= r.m) {
          stop = "right";
          break;
        }
        cmp++;
        if (t[row.i - k - 1] !== t[row.i + k + 1]) {
          stop = "differ";
          break;
        }
        k++;
      }
      if (k !== row.p) throw new Error("0 에서 넓힌 반지름이 정본과 다르다");
      total += cmp;
      return [String(row.i), row.ch, String(k), why[stop], String(cmp)];
    });
    return block(
      md(
        ["t 의 자리 i", "글자", "p[i]", "멈춘 까닭", "글자 비교"],
        rows,
        [0, 2, 4],
      ),
      `자리마다 0 에서 넓히면 글자 비교가 모두 ${total} 번입니다. 반지름 이어받기를 더한 정본은 같은 반지름을 ${r.grow + r.stop} 번 비교해 적습니다.`,
    );
  },

  "build-beyond": () => {
    const r = walkRun();
    const why = {
      differ: "글자가 다르다",
      left: "왼쪽 끝",
      right: "오른쪽 끝",
    };
    const rows = r.rows
      .filter((row) => row.grow > 0)
      .map((row) => [
        String(row.i),
        row.carried === null ? "0 (구간 밖)" : String(row.carried),
        String(row.grow),
        why[row.why],
        String(row.p),
        `${row.rIn} → ${row.r}`,
      ]);
    return block(
      md(
        ["t 의 자리 i", "시작값", "더 늘린 칸", "멈춘 까닭", "p[i]", "r"],
        rows,
        [0, 2, 4],
      ),
      `반지름을 한 칸이라도 늘린 자리가 ${rows.length} 곳이고, 그 ${rows.length} 곳 모두에서 r 이 앞으로 갔습니다.`,
    );
  },

  "build-restore": () => {
    const r = walkRun();
    const rows = r.rows
      .filter((row) => row.p > 0)
      .map((row) => {
        const start = (row.i - row.p) / 2;
        return [
          String(row.i),
          String(row.p),
          String(row.i - row.p),
          String(start),
          WALK.slice(start, start + row.p),
          row.i % 2 === 0 ? "짝수" : "홀수",
        ];
      });
    const len = r.p[r.best] as number;
    return block(
      md(
        [
          "t 의 자리 i",
          "p[i]",
          "i − p[i]",
          "시작 자리 (i − p[i]) / 2",
          "s 에서의 조각",
          "조각 길이의 홀짝",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `셋째 열이 ${rows.length} 줄 모두 짝수라 넷째 열이 정수로 나옵니다. 가장 긴 자리는 ${r.best} 이고, 시작 자리 ${(r.best - len) / 2} 에서 ${len} 글자를 잘라 "${r.ans}" 가 나옵니다.`,
    );
  },

  "build-carry-rules": () => {
    const inputs: [string, string][] = [
      [label(WALK), WALK],
      [quote("abab"), "abab"],
      ["전부 같은 글자 n = 1,000", shape("전부 같은 글자", 1_000)],
      ["두 글자 번갈이 n = 1,000", shape("두 글자 번갈이", 1_000)],
      ["무작위 두 글자 n = 1,000", shape("무작위 두 글자", 1_000)],
      ["무작위 26 글자 n = 1,000", shape("무작위 26 글자", 1_000)],
    ];
    const rules: CarryRule[] = ["none", "mirror", "edge", "min"];
    const rows: string[][] = [];
    const wrong = new Map<CarryRule, number>();
    for (const [name, s] of inputs) {
      const want = longestPalindrome(s).length;
      for (const rule of rules) {
        const got = countManacher(s, rule);
        const ok = got.ans.length === want && isPalindrome(got.ans);
        if (!ok) wrong.set(rule, (wrong.get(rule) ?? 0) + 1);
        rows.push([
          name,
          RULE_NAME[rule],
          ok ? "예" : "아니오",
          num(got.access),
        ]);
      }
    }
    return block(
      md(
        ["입력", "이어받는 방식", "정의대로 잰 답과의 일치", "자료 접근"],
        rows,
        [3],
      ),
      `입력 ${inputs.length} 벌에서 답이 틀린 벌 수는 ${rules.map((rule) => `「${RULE_NAME[rule]}」 ${wrong.get(rule) ?? 0} 벌`).join(", ")}입니다.`,
    );
  },

  /* ── 수행으로 알아보는 알고리즘 ── */

  "walk-input": () =>
    [
      `const s = "${WALK}";`,
      `// 이 절이 끝나면 "${longestPalindrome(WALK)}" 가 나와야 한다`,
    ].join("\n"),

  "walk-widen": () => {
    const r = walkRun();
    return [
      `s = "${WALK}"  ·  n = ${WALK.length}`,
      "",
      `t  ${[...r.t].map((ch) => ch.padStart(2)).join(" ")}`,
      `   ${Array.from({ length: r.m }, (_, i) => String(i).padStart(2)).join(" ")}`,
      "",
      `m = ${r.m} = 2 × ${WALK.length} + 1`,
    ].join("\n");
  },

  "pause-separator": () => {
    const alphabet = ["a", SEP, "b"];
    let checked = 0;
    let wrong = 0;
    for (let n = 1; n <= 9; n++) {
      const total = alphabet.length ** n;
      for (let code = 0; code < total; code++) {
        let s = "";
        let x = code;
        for (let d = 0; d < n; d++) {
          s += alphabet[x % alphabet.length] as string;
          x = Math.floor(x / alphabet.length);
        }
        checked++;
        if (longestPalindrome(s).length !== bruteLength(s)) wrong++;
      }
    }
    const cases = ["a#a", "#a#", "a##a", "#ab#", "##", "b#a#b"];
    const rows = cases.map((s) => {
      const got = longestPalindrome(s);
      const want = bruteLength(s);
      return [
        quote(s),
        quote(widen(s)),
        quote(got),
        String(want),
        got.length === want ? "같다" : "다르다",
      ];
    });
    return block(
      md(
        ["입력", "넓힌 문자열", "정본의 답", "정의대로 잰 길이", "두 길이"],
        rows,
      ),
      `알파벳 {a, ${SEP}, b} 의 길이 1~9 문자열 ${num(checked)} 벌을 전부 실행했고, 길이가 다른 벌은 ${wrong} 벌입니다.`,
    );
  },

  "walk-edge": () => {
    const r = walkRun();
    const rows = r.rows
      .slice(0, 4)
      .map((row) => [
        String(row.i),
        String(row.p),
        `${row.i + row.p} > ${row.rIn}${josa(row.rIn, "이", "가")} ${row.movedEdge ? "참" : "거짓"}`,
        `c = ${row.c} · r = ${row.r}`,
      ]);
    return md(["자리 i", "p[i]", "i + k > r", "c 와 r"], rows, [0, 1]);
  },

  "walk-carry": () => {
    const r = walkRun();
    const rows = r.rows
      .filter((row) => row.i >= 4 && row.i <= 7)
      .map((row) => [
        String(row.i),
        `c = ${row.cIn} · r = ${row.rIn}`,
        String(row.mirror),
        `min(${row.rIn - row.i}, ${row.pMirror}) = ${row.carried}`,
        String(row.grow),
        String(row.stop),
        String(row.p),
      ]);
    return md(
      [
        "자리 i",
        "들어올 때",
        "대칭 자리",
        "이어받은 값",
        "늘림",
        "멈춤",
        "p[i]",
      ],
      rows,
      [0, 2, 4, 5, 6],
    );
  },

  "pause-noclip": () => {
    const t = mutantTable("자르지 않는 판", noClip, "잘린 자리", clippedPlaces);
    return block(t.table, `열 줄 가운데 ${t.broken} 줄에서 답이 어긋납니다.`);
  },

  "pause-noclip-detail": () => {
    const good = ruleRows(WALK, "min");
    const bad = ruleRows(WALK, "mirror");
    const r = walkRun();
    const firstWrong = r.rows.find(
      (row) => good.p[row.i] !== bad.p[row.i],
    ) as Row;
    const next = r.rows.find(
      (row) => row.i > firstWrong.i && good.p[row.i] !== bad.p[row.i],
    ) as Row;
    const i = firstWrong.i;
    const bi = next.i;
    // 변이가 끝에 고른 자리와 반지름.
    let bestBad = 0;
    for (let x = 0; x < bad.p.length; x++) {
      if ((bad.p[x] as number) > (bad.p[bestBad] as number)) bestBad = x;
    }
    const lenBad = bad.p[bestBad] as number;
    const startBad = (bestBad - lenBad) / 2;
    if (WALK.slice(startBad, startBad + lenBad) !== bad.ans) {
      throw new Error("변이의 답을 다시 만들지 못했다");
    }
    const rows = [
      [
        `자리 ${i}`,
        String(good.p[i]),
        String(bad.p[i]),
        `대칭 자리 ${firstWrong.mirror} 의 반지름 ${firstWrong.pMirror}${을를(firstWrong.pMirror as number)} 남은 칸 ${firstWrong.rIn - i}${으로(firstWrong.rIn - i)} 자르지 않고 받았다`,
      ],
      [
        `자리 ${i} 뒤의 r`,
        String(good.r[i]),
        String(bad.r[i]),
        `확인한 적 없는 자리 ${firstWrong.rIn + 1} 부터 ${bad.r[i]} 까지를 회문이라 적었다`,
      ],
      [
        `자리 ${bi}`,
        String(good.p[bi]),
        String(bad.p[bi]),
        `대칭 자리 ${bad.mirror[bi]} 의 반지름 ${bad.p[bad.mirror[bi] as number]}${을를(bad.p[bad.mirror[bi] as number] as number)} 이어받고 ${(bad.p[bi] as number) - (bad.carried[bi] as number)} 칸을 더 넓혔다`,
      ],
      [
        "답",
        quote(good.ans),
        quote(bad.ans),
        `변이는 자리 ${bestBad} 의 반지름 ${lenBad}${으로(lenBad)} 시작 자리 ${startBad} 에서 ${lenBad} 글자를 잘랐다`,
      ],
    ];
    return md(["자리", "정본", "변이", "일어난 일"], rows);
  },

  "walk-trace": () => {
    const r = walkRun();
    const steps = walkSteps();
    const rows: string[][] = [];
    for (const s of steps) {
      if (s.kind === "init") {
        rows.push([
          s.id,
          "—",
          "—",
          "①",
          "—",
          "—",
          "0",
          "0",
          "—",
          "0",
          "0",
          "0",
        ]);
        continue;
      }
      if (s.kind === "done") {
        const last = r.rows.at(-1) as Row;
        rows.push([
          s.id,
          "—",
          "—",
          "⑥",
          "—",
          "—",
          "0",
          "0",
          "—",
          String(last.c),
          String(last.r),
          String(last.best),
        ]);
        continue;
      }
      const row = s.row as Row;
      const labels: string[] = [];
      if (row.inside) labels.push(LABELS[1] as string);
      if (row.grow + row.stop > 0) labels.push(LABELS[2] as string);
      if (row.movedEdge) labels.push(LABELS[3] as string);
      if (row.movedBest) labels.push(LABELS[4] as string);
      rows.push([
        s.id,
        String(row.i),
        row.ch,
        labels.length === 0 ? "—" : labels.join(""),
        row.mirror === null ? "—" : String(row.mirror),
        row.carried === null ? "—" : String(row.carried),
        String(row.grow),
        String(row.stop),
        String(row.p),
        String(row.c),
        String(row.r),
        String(row.best),
      ]);
    }
    const len = r.p[r.best] as number;
    return block(
      md(
        [
          "걸음",
          "자리",
          "글자",
          "라벨",
          "대칭 자리",
          "이어받은 값",
          "늘림",
          "멈춤",
          "p[i]",
          "c",
          "r",
          "best",
        ],
        rows,
        [1, 4, 5, 6, 7, 8, 9, 10, 11],
      ),
      `늘린 비교 ${r.grow} 번과 멈춘 비교 ${r.stop} 번을 더해 글자 비교가 ${r.grow + r.stop} 번입니다. 답 "${r.ans}" 는 자리 ${r.best} 의 반지름 ${len}${으로(len)} 시작 자리 ${(r.best - len) / 2} 에서 잘라 낸 것입니다.`,
    );
  },

  "walk-coverage": () => {
    const names = [
      "자리를 넓혀 t 를 만든다",
      "구간 안이면 반지름을 이어받는다",
      "한 칸씩 넓혀 본다",
      "오른쪽 끝을 더 멀리 옮긴다",
      "가장 긴 자리를 바꾼다",
      "원래 자리로 되돌려 잘라 낸다",
    ];
    const a = walkRun();
    const b = trace("racecar");
    const rows = names.map((name, idx) => [
      LABELS[idx] as string,
      name,
      String(a.hits[idx]),
      String(b.hits[idx]),
    ]);
    const zero = rows.filter((x) => x[2] === "0").length;
    return block(
      md(
        ["라벨", "그 갈래가 맡은 일", `전개 입력 "${WALK}"`, '"racecar"'],
        rows,
        [2, 3],
      ),
      `전개 입력에서 한 번도 실행되지 않은 갈래는 ${zero} 개입니다.`,
    );
  },

  "pause-tie": () => {
    let shifted = 0;
    const rows = SMALL.map((s) => {
      const a = longestPalindrome(s);
      const b = rightmostTie.longestPalindrome(s);
      if (a !== b) shifted++;
      return [
        label(s),
        String(tiedPlaces(s)),
        quote(a),
        quote(b),
        String(a.length),
        String(b.length),
        a === b ? "같다" : "어긋난다",
      ];
    });
    return block(
      md(
        [
          "입력",
          "동점 자리",
          "정본",
          "오른쪽을 남기는 판",
          "정본 길이",
          "변이 길이",
          "돌려준 문자열",
        ],
        rows,
        [1, 4, 5],
      ),
      `열 줄 가운데 ${shifted} 줄에서 돌려준 문자열이 어긋납니다.`,
    );
  },

  "final-calls": () =>
    [WALK, "cbbd", "racecar", "", "a"]
      .map((s) => {
        const call = `longestPalindrome(${quote(s)})`;
        return `${call.padEnd(30)}→   ${quote(longestPalindrome(s))}`;
      })
      .join("\n"),

  /* ── 알아 두면 좋은 개념 ── */

  "related-coords": () => {
    const r = walkRun();
    const n = WALK.length;
    const rows: string[][] = [];
    for (let x = 0; x < r.m; x++) {
      const isChar = x % 2 === 1;
      rows.push([
        String(x),
        r.t[x] as string,
        isChar
          ? `글자 ${(x - 1) / 2}`
          : x === 0
            ? "맨 앞"
            : x === r.m - 1
              ? "맨 뒤"
              : `글자 ${x / 2 - 1}${과와(x / 2 - 1)} ${x / 2} 사이`,
        isChar ? "2j + 1" : "2j",
      ]);
    }
    return block(
      md(["t 의 자리", "글자", "원래 좌표에서", "식"], rows, [0]),
      `글자 ${n} 개는 홀수 자리로, 사이와 양 끝 ${n + 1} 곳은 짝수 자리로 가서 모두 ${r.m} 자리입니다.`,
    );
  },

  /* ── 경쟁 설계와의 대조 ── */

  "alt-table": () => {
    const rows: string[][] = [];
    const pairs: [string, (m: (t: string, q: number) => number) => number][] = [
      [`전개 입력 "${WALK}" · 질의 0 회`, (f) => f(WALK, 0)],
      ["무작위 26 글자 · 질의 0 회", (f) => f(SWEEP_TEXT, 0)],
      ["무작위 26 글자 · 질의 1 회", (f) => f(SWEEP_TEXT, 1)],
      ["무작위 26 글자 · 질의 100 회", (f) => f(SWEEP_TEXT, 100)],
      ["전부 같은 글자 · 질의 0 회", (f) => f(ALL_SAME_TEXT, 0)],
      ["전부 같은 글자 · 질의 1 회", (f) => f(ALL_SAME_TEXT, 1)],
      ["전부 같은 글자 · 질의 100 회", (f) => f(ALL_SAME_TEXT, 100)],
    ];
    for (const [name, go] of pairs) {
      const a = go(manacherRun);
      const b = go(treeRun);
      rows.push([
        name,
        num(a),
        num(b),
        a < b ? "매내처 알고리즘" : "회문 트리",
      ]);
    }
    const ma = manacherCellsHeld(SWEEP_N);
    const tr = treeCellsHeld(SWEEP_N);
    return block(
      md(
        [
          "입력 · 중간에 답을 묻는 횟수",
          "매내처 알고리즘",
          "회문 트리",
          "적은 쪽",
        ],
        rows,
        [1, 2],
      ),
      `넷째 열까지 자료 접근 횟수입니다. 저장 칸은 매내처 알고리즘이 ${num(ma)} 칸, 회문 트리가 ${num(tr)} 칸으로 ${(tr / ma).toFixed(2)} 배 차이가 나고, 이 항목은 입력이 바뀌어도 순서가 그대로입니다.`,
    );
  },

  /* ── 수식 정의와 유도 ── */

  "math-check": () => {
    const rows = ["a", "aa", "aba", "abba"].map((s) => {
      const r = replay(s);
      return [
        quote(s),
        String(s.length),
        String(r.m),
        quote(r.t),
        show(r.p),
        quote(r.ans),
      ];
    });
    return md(["s", "n", "m = 2n + 1", "t", "반지름 p", "답"], rows, [1, 2]);
  },

  "math-start": () => {
    const r = walkRun();
    return r.rows
      .filter((row) => row.i === r.best || row.i === 3)
      .map((row) => {
        const start = (row.i - row.p) / 2;
        return `자리 ${String(row.i).padEnd(3)} 반지름 ${row.p}   ${row.i} − ${row.p} = ${row.i - row.p}   짝수   ${row.i - row.p} / 2 = ${start}   s[${start}..${start + row.p - 1}] = ${WALK.slice(start, start + row.p)}`;
      })
      .join("\n");
  },

  "math-parity": () => {
    let places = 0;
    let odd = 0;
    const rows: string[][] = [];
    for (let n = 1; n <= 12; n++) {
      let nPlaces = 0;
      let nOdd = 0;
      let count = 0;
      for (const s of binaryStrings(n)) {
        count++;
        for (const row of replay(s).rows) {
          nPlaces++;
          if ((row.i - row.p) % 2 !== 0) nOdd++;
        }
      }
      places += nPlaces;
      odd += nOdd;
      if (n <= 4 || n === 12) {
        rows.push([String(n), num(count), num(nPlaces), String(nOdd)]);
      }
    }
    return block(
      md(
        ["n", "문자열 수", "확인한 자리", "i − p[i] 가 홀수인 자리"],
        rows,
        [0, 1, 2, 3],
      ),
      `두 글자 알파벳의 길이 1~12 문자열을 전부 실행해 자리 ${num(places)} 개를 확인했고, 홀수인 자리는 ${odd} 개입니다.`,
    );
  },

  "math-bound": () => {
    const rows: string[][] = [];
    for (const n of [4, 6, 8, 10, 12]) {
      let mxC = -1;
      let mxA = -1;
      let arg = "";
      for (const s of binaryStrings(n)) {
        const c = countManacher(s);
        if (c.grow + c.stop > mxC) mxC = c.grow + c.stop;
        if (c.access > mxA) {
          mxA = c.access;
          arg = s;
        }
      }
      rows.push([
        String(n),
        String(4 * n + 1),
        String(mxC),
        String(18 * n + 8),
        String(mxA),
        quote(arg),
      ]);
    }
    const big = [1_000, 10_000, LIMIT].map((n) => {
      const c = countManacher(shape("양 끝만 다른 글자", n));
      return [
        num(n),
        num(c.grow + c.stop),
        num(4 * n - 6),
        num(c.access),
        num(18 * n - 12),
      ];
    });
    return block(
      md(
        [
          "n",
          "글자 비교 상한 4n + 1",
          "글자 비교 전수 최댓값",
          "자료 접근 상한 18n + 8",
          "자료 접근 전수 최댓값",
          "최댓값을 낸 첫 문자열",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      "양 끝만 다른 글자에서 규모를 키우면 이렇습니다.",
      md(
        ["n", "글자 비교", "4n − 6", "자료 접근", "18n − 12"],
        big,
        [0, 1, 2, 3, 4],
      ),
      `두 글자 알파벳의 길이 ${rows[0]?.[0]}~${rows.at(-1)?.[0]} 전수에서 글자 비교의 최댓값은 4n − 6, 자료 접근의 최댓값은 18n − 12 이고, 양 끝만 다른 글자가 n = ${num(LIMIT)} 까지 두 값을 그대로 냅니다.`,
    );
  },

  /* ── 불변식 ── */

  "invariant-watch": () => {
    const inputs: [string, string][] = [
      [label(WALK), WALK],
      [quote("aaaa"), "aaaa"],
      [quote("racecar"), "racecar"],
      [quote("abcde"), "abcde"],
      ["두 글자 번갈이 n = 500", shape("두 글자 번갈이", 500)],
      ["무작위 두 글자 n = 500", shape("무작위 두 글자", 500)],
      ["무작위 26 글자 n = 500", shape("무작위 26 글자", 500)],
    ];
    let broken = 0;
    const rows = inputs.map(([name, s]) => {
      const r = replay(s);
      let oddGap = 0;
      let notSep = 0;
      let notPal = 0;
      for (const row of r.rows) {
        if ((row.i - row.p) % 2 !== 0) oddGap++;
        if (r.t[row.i - row.p] !== SEP || r.t[row.i + row.p] !== SEP) notSep++;
        const start = (row.i - row.p) / 2;
        if (!isPalindrome(s.slice(start, start + row.p))) notPal++;
      }
      broken += oddGap + notSep + notPal;
      return [name, num(r.m), String(oddGap), String(notSep), String(notPal)];
    });
    return block(
      md(
        [
          "입력",
          "확인한 자리",
          "i − p[i] 가 홀수",
          "양 끝이 구분자가 아님",
          "잘라 낸 조각이 회문이 아님",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `일곱 입력의 모든 자리에서 셋째부터 다섯째 열을 더한 값이 ${broken} 입니다.`,
    );
  },

  "invariant-edges": () => {
    const rows = [
      ["빈 문자열", ""],
      ["길이 1", "a"],
      ["같은 두 글자", "aa"],
      ["다른 두 글자", "ab"],
      ["전부 같은 글자", "aaaa"],
      ["전부 다른 글자", "abcd"],
      ["홀수 길이 회문 전체", "aba"],
      ["짝수 길이 회문 전체", "abba"],
    ].map(([name, s]) => {
      const str = s as string;
      const c = countManacher(str);
      const ans = longestPalindrome(str);
      return [
        name as string,
        quote(str),
        String(str.length),
        String(widen(str).length),
        quote(ans),
        String(bruteLength(str)),
        String(c.grow + c.stop),
      ];
    });
    return md(
      ["경계", "입력", "n", "m", "답", "정의대로 잰 길이", "글자 비교"],
      rows,
      [2, 3, 5, 6],
    );
  },

  "mutant-no-head-sep": () => {
    const t = mutantTable(
      "앞 구분자를 뺀 판",
      noLeadingSep,
      "홀짝이 뒤바뀐 글자",
      (s) => s.length,
    );
    return block(t.table, `열 줄 가운데 ${t.broken} 줄에서 답이 어긋납니다.`);
  },

  "mutant-no-head-detail": () => {
    const s = "cbbd";
    // 변이와 같은 절차 — 앞쪽 구분자 없이 넓힌다. 답은 변이와 대조한다.
    const t = `${[...s].join(SEP)}${SEP}`;
    const m = t.length;
    const p = new Array<number>(m).fill(0);
    let c = 0;
    let r = 0;
    let best = 0;
    for (let i = 0; i < m; i++) {
      let k = i < r ? Math.min(r - i, p[2 * c - i] as number) : 0;
      while (i - k - 1 >= 0 && i + k + 1 < m && t[i - k - 1] === t[i + k + 1])
        k++;
      p[i] = k;
      if (i + k > r) {
        c = i;
        r = i + k;
      }
      if (k > (p[best] as number)) best = i;
    }
    const len = p[best] as number;
    const start = (best - len) / 2;
    const got = s.slice(start, start + len);
    if (!중화됨 && got !== noLeadingSep.longestPalindrome(s)) {
      throw new Error("다시 만든 변이의 답이 변이와 다르다");
    }
    const ref = walkLike(s);
    const oddAt = [...t]
      .map((ch, i) => (ch !== SEP ? i : -1))
      .filter((i) => i >= 0);
    return md(
      ["보는 값", "정본", "앞 구분자를 뺀 판"],
      [
        ["넓힌 문자열", quote(ref.t), quote(t)],
        ["글자가 놓인 자리", ref.letters.join(" · "), oddAt.join(" · ")],
        [
          "가장 긴 자리 · 반지름",
          `${ref.best} · ${ref.len}`,
          `${best} · ${len}`,
        ],
        ["i − p[i]", String(ref.best - ref.len), String(best - len)],
        ["(i − p[i]) / 2", String((ref.best - ref.len) / 2), String(start)],
        ["잘라 낸 조각", quote(ref.ans), quote(got)],
        [
          "회문인가",
          isPalindrome(ref.ans) ? "예" : "아니오",
          isPalindrome(got) ? "예" : "아니오",
        ],
      ],
    );
  },

  /* ── 비용 계산 ── */

  "perf-count": () => {
    const r = walkRun();
    const n = WALK.length;
    const c = countManacher(WALK);
    const len = r.p[r.best] as number;
    const inside = r.rows.filter((row) => row.inside).length;
    const parts: [string, number, string][] = [
      ["자리 넓히기", n + r.m, `글자 ${n} 개 읽기 + t 의 ${r.m} 칸 쓰기 (T1)`],
      [
        "대칭 자리의 반지름 읽기",
        inside,
        `구간 안에서 시작한 자리 (T2~T16 중 ${inside} 걸음)`,
      ],
      [
        "글자 비교",
        2 * (r.grow + r.stop),
        `비교 ${r.grow + r.stop} 번 × 글자 둘`,
      ],
      ["p[i] 쓰기", r.m, "자리마다 한 번"],
      ["p[best] 읽기", r.m + 2, `자리마다 한 번 + 끝에서 두 번 (T17)`],
      ["답의 글자 읽기", len, `잘라 낸 "${r.ans}" 의 길이 (T17)`],
    ];
    const total = parts.reduce((x, [, v]) => x + v, 0);
    if (total !== c.access) throw new Error("나눠 센 합이 계수기와 다르다");
    return block(
      md(
        ["몫", "자료 접근", "나온 곳"],
        parts.map(([a, b, d]) => [a, String(b), d]),
        [1],
      ),
      `여섯 줄을 더하면 ${total} 번이고, 계수기가 센 값과 같습니다.`,
    );
  },

  "perf-sweep": () => {
    const sizes = [1_000, 4_000, 16_000, 64_000];
    const rows: string[][] = [];
    for (const [name, make] of SHAPES) {
      let prev = 0;
      for (const n of sizes) {
        const c = countManacher(make(n));
        rows.push([
          name,
          num(n),
          num(c.grow + c.stop),
          num(c.access),
          prev === 0 ? "—" : (c.access / prev).toFixed(2),
        ]);
        prev = c.access;
      }
    }
    return block(
      md(
        ["입력 모양", "n", "글자 비교", "자료 접근", "네 배로 키운 비"],
        rows,
        [1, 2, 3, 4],
      ),
      `여섯 모양 모두 규모를 네 배로 키우면 자료 접근도 네 배가 됩니다.`,
    );
  },

  "perf-best": () => {
    const rows = [4, 6, 8, 10, 12].map((n) => {
      let min = Number.POSITIVE_INFINITY;
      const args: string[] = [];
      for (const s of binaryStrings(n)) {
        const a = countManacher(s).access;
        if (a < min) {
          min = a;
          args.length = 0;
          args.push(s);
        } else if (a === min) args.push(s);
      }
      args.sort();
      return [
        String(n),
        String(min),
        String(14 * n),
        String(args.length),
        quote(args[0] as string),
      ];
    });
    return md(
      [
        "n",
        "자료 접근 전수 최솟값",
        "14n",
        "최솟값을 낸 문자열 수",
        "그중 사전순 첫 문자열",
      ],
      rows,
      [0, 1, 2, 3],
    );
  },

  "perf-average": () => {
    const rows = [
      ["무작위 두 글자", 2],
      ["무작위 26 글자", 26],
    ].map(([name]) => {
      const c = countManacher(shape(name as string, LIMIT));
      return [
        name as string,
        num(LIMIT),
        num(c.access),
        (c.access / LIMIT).toFixed(2),
      ];
    });
    return block(
      md(["입력 분포", "n", "자료 접근", "n 하나당"], rows, [1, 2, 3]),
      "두 분포 다 mulberry32(씨앗 0x9e3779b9)로 만든 문자열입니다.",
    );
  },

  "perf-worst": () => {
    const rows: string[][] = [];
    for (const n of [5, 6, 7, 8, 9, 10]) {
      let mx = -1;
      const args: string[] = [];
      for (const s of binaryStrings(n)) {
        const a = countManacher(s).access;
        if (a > mx) {
          mx = a;
          args.length = 0;
          args.push(s);
        } else if (a === mx) args.push(s);
      }
      args.sort();
      rows.push([
        String(n),
        String(mx),
        String(18 * n - 12),
        String(args.length),
        quote(args[0] as string),
      ]);
    }
    const at = 10_000;
    const fam = SHAPES.map(([name, make]) => {
      const c = countManacher(make(at));
      return [name, quote(make(8)), num(c.access)];
    });
    return block(
      md(
        [
          "n",
          "자료 접근 전수 최댓값",
          "18n − 12",
          "최댓값을 낸 문자열 수",
          "그중 사전순 첫 문자열",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `같은 모양을 n = ${num(at)}${으로(num(at))} 키우면 이렇습니다.`,
      md(["입력 모양", "n = 8 일 때", `n = ${num(at)} 의 자료 접근`], fam, [2]),
    );
  },

  /* ── 스스로 점검하기 ── */

  "selfcheck-t9": () => {
    const s = walkSteps().find(
      (x) => x.row !== null && x.row.branch === "clip",
    );
    const row = s?.row as Row;
    const t = walkRun().t;
    const last = row.pairs.at(-1) as readonly [number, number];
    return block(
      md(
        [`${s?.id} 의 계산`, "식", "값"],
        [
          [
            "대칭 자리",
            `2c − i = 2 × ${row.cIn} − ${row.i}`,
            String(row.mirror),
          ],
          ["대칭 자리의 반지름", `p[${row.mirror}]`, String(row.pMirror)],
          ["남은 칸", `r − i = ${row.rIn} − ${row.i}`, String(row.rIn - row.i)],
          [
            "이어받는 값",
            `min(${row.rIn - row.i}, ${row.pMirror})`,
            String(row.carried),
          ],
          [
            "그다음 비교",
            `t[${last[0]}] = ${t[last[0]]} · t[${last[1]}] = ${t[last[1]]}`,
            "다른 글자",
          ],
          ["적는 반지름", `p[${row.i}]`, String(row.p)],
        ],
        [2],
      ),
      `${s?.id}${은는(s?.id ?? "")} 자리 ${row.i}${을를(row.i)} 처리한 걸음이고, 그때 c = ${row.cIn} · r = ${row.rIn} 입니다.`,
    );
  },

  "selfcheck-parity": () => {
    const r = walkRun();
    const rows = r.rows
      .filter((row) => row.i === r.best || row.i === 3)
      .map((row) => {
        const odd = Array.from(
          { length: 2 * row.p + 1 },
          (_, x) => row.i - row.p + x,
        ).filter((x) => x % 2 === 1);
        const parity = (x: number) => (x % 2 === 0 ? "짝수" : "홀수");
        return [
          String(row.i),
          parity(row.i),
          `[${row.i - row.p},${row.i + row.p}]`,
          `${odd.join(" · ")} — ${odd.length} 개`,
          `${row.p} · ${parity(row.p)}`,
        ];
      });
    return md(
      [
        "한가운데 자리",
        "그 자리의 홀짝",
        "회문 구간",
        "구간 안의 홀수 자리",
        "s 에서의 길이",
      ],
      rows,
      [0],
    );
  },
};

/** 한 자리에서 처음부터 넓힐 때의 글자 비교 수 — 이어받지 않는 절차의 한 자리 몫이다. */
function countOne(s: string, i: number): number {
  const t = widen(s);
  const m = t.length;
  let k = 0;
  let cmp = 0;
  while (i - k - 1 >= 0 && i + k + 1 < m) {
    cmp++;
    if (t[i - k - 1] !== t[i + k + 1]) break;
    k++;
  }
  return cmp;
}

/** 정본의 넓힌 문자열과 답의 자리 — 변이와 나란히 놓는 데 쓴다. */
function walkLike(s: string): {
  t: string;
  letters: number[];
  best: number;
  len: number;
  ans: string;
} {
  const r = replay(s);
  const len = r.p[r.best] as number;
  return {
    t: r.t,
    letters: Array.from({ length: s.length }, (_, j) => 2 * j + 1),
    best: r.best,
    len,
    ans: r.ans,
  };
}
