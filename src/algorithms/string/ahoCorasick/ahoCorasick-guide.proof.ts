/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts ahoCorasick-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  makePatterns,
  makeText,
  mergedCounts,
  PATTERN_TOTAL,
  perPatternKmpCounts,
  TEXT_LENGTH,
} from "./ahoCorasick-guide.alt.ts";
import {
  type Automaton,
  ahoCorasick,
  buildAutomaton,
  type Match,
} from "./ahoCorasick-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 차지한다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
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

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 확인하지 못한다.
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

/** 매칭 목록을 `패턴 번호@시작 자리` 로 적는다. */
const showMatches = (ms: readonly Match[]): string =>
  ms.length === 0
    ? "(없음)"
    : ms.map((m) => `${m.patternIndex}@${m.position}`).join(" ");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 이 텍스트와 이 패턴 셋이면 갈래가 전부 실행된다 — 뿌리에서 아무 데도 못 가는 글자(`u`),
 * 자식을 그대로 따라가는 글자(`s`·`h`·`e`), 자식이 없어 실패 링크가 물려준 칸으로 옮기는
 * 글자(`r`), 그리고 **긴 패턴 안에 짧은 패턴이 접미사로 숨어 있는 자리**(`she` 안의 `he`).
 */
const TEXT = "ushers";
const PATTERNS = ["he", "she", "hers"];

/** 제약이 정한 최댓값 둘. */
const LIMIT_TEXT = 100_000;
const LIMIT_TOTAL = 100_000;

/** 문자 집합의 크기. */
const SIGMA = 26;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/* ────────────────────── 자동자를 읽는 보조 ────────────────────── */

/**
 * 상태마다 경로 문자열을 낸다.
 *
 * 다 채운 전이표에서는 **깊이가 하나 늘어나는 칸만이 트리의 간선**이다 — 물려받은 칸은
 * 반드시 깊이가 같거나 얕은 상태를 가리킨다.
 */
function paths(auto: Automaton): string[] {
  const out = Array.from({ length: auto.size }, () => "");
  const queue = [0];
  for (let head = 0; head < queue.length; head++) {
    const s = queue[head] as number;
    for (let c = 0; c < SIGMA; c++) {
      const u = auto.next[s * SIGMA + c] as number;
      if ((auto.depth[u] as number) !== (auto.depth[s] as number) + 1) continue;
      out[u] = (out[s] as string) + (ALPHABET[c] as string);
      queue.push(u);
    }
  }
  return out;
}

/** 상태를 경로 문자열로 적는다. 뿌리는 `(뿌리)` 다. */
const stateName = (p: string): string => (p === "" ? "(뿌리)" : p);

/* ────────────────────── 계측기 — 가장 단순한 방법 ────────────────────── */

/** 패턴마다 모든 시작 자리에서 글자를 대조한다. 정의를 그대로 옮긴 것이다. */
function bruteCounts(
  text: string,
  patterns: readonly string[],
): { ops: number; matches: Match[] } {
  let ops = 0;
  const matches: Match[] = [];
  for (const [index, pattern] of patterns.entries()) {
    const m = pattern.length;
    for (let j = 0; j + m <= text.length; j++) {
      let t = 0;
      while (t < m) {
        ops += 2; // 텍스트 글자 읽기 + 견주기
        if (text[j + t] !== pattern[t]) break;
        t += 1;
      }
      if (t === m) matches.push({ patternIndex: index, position: j });
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { ops, matches };
}

/* ────────────────── 계측기 — 표를 어디까지 펼치는가 ────────────────── */

/**
 * 깊이 `d` 이하의 상태만 전이표를 다 채우고, 그보다 깊은 상태는 실제 자식만 들고 있다가
 * 없으면 실패 링크로 옮겨 다시 찾는다. `d` 를 상태의 최대 깊이로 두면 정본과 같다.
 */
function scanWithDepth(
  auto: Automaton,
  text: string,
  d: number,
): { lookups: number; worst: number; cells: number } {
  const real = new Int32Array(auto.size * SIGMA).fill(-1);
  let edges = 0;
  for (let s = 0; s < auto.size; s++) {
    for (let c = 0; c < SIGMA; c++) {
      const u = auto.next[s * SIGMA + c] as number;
      if ((auto.depth[u] as number) !== (auto.depth[s] as number) + 1) continue;
      real[s * SIGMA + c] = u;
      edges += 1;
    }
  }

  let expanded = 0;
  for (let s = 0; s < auto.size; s++) {
    if ((auto.depth[s] as number) <= d) expanded += 1;
  }

  let lookups = 0;
  let worst = 0;
  let s = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0) - 97;
    let here = 0;
    for (;;) {
      here += 1;
      if ((auto.depth[s] as number) <= d) {
        s = auto.next[s * SIGMA + c] as number;
        break;
      }
      const u = real[s * SIGMA + c] as number;
      if (u !== -1) {
        s = u;
        break;
      }
      s = auto.link[s] as number;
    }
    lookups += here;
    worst = Math.max(worst, here);
  }
  // 펼친 상태는 26 칸, 안 펼친 상태는 실제 자식 수만. 거기에 실패 링크·출력 링크·깊이가 각각 S.
  let realEdgesDeep = 0;
  for (let s2 = 0; s2 < auto.size; s2++) {
    if ((auto.depth[s2] as number) <= d) continue;
    for (let c = 0; c < SIGMA; c++) {
      if ((real[s2 * SIGMA + c] as number) !== -1) realEdgesDeep += 1;
    }
  }
  void edges;
  return {
    lookups,
    worst,
    cells: SIGMA * expanded + realEdgesDeep + 3 * auto.size,
  };
}

/* ────────────────── 계측기 — 출력 링크 대 실패 링크 ────────────────── */

/** 출력 링크를 따라 거둔다(정본의 방식). */
function collectByOutLink(
  auto: Automaton,
  text: string,
): { steps: number; matches: Match[] } {
  let steps = 0;
  const matches: Match[] = [];
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    s = auto.next[s * SIGMA + (text.charCodeAt(i) - 97)] as number;
    for (let t = s; t !== -1; t = auto.outLink[t] as number) {
      steps += 1;
      for (const p of auto.endOf[t] as number[]) {
        matches.push({
          patternIndex: p,
          position: i - (auto.depth[t] as number) + 1,
        });
      }
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { steps, matches };
}

/** 실패 링크를 뿌리까지 따라가며 거둔다. 답은 같고 걸음 수만 다르다. */
function collectByFailLink(
  auto: Automaton,
  text: string,
): { steps: number; matches: Match[] } {
  let steps = 0;
  const matches: Match[] = [];
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    s = auto.next[s * SIGMA + (text.charCodeAt(i) - 97)] as number;
    let t = s;
    for (;;) {
      steps += 1;
      for (const p of auto.endOf[t] as number[]) {
        matches.push({
          patternIndex: p,
          position: i - (auto.depth[t] as number) + 1,
        });
      }
      if (t === 0) break;
      t = auto.link[t] as number;
    }
  }
  matches.sort(
    (a, b) => a.position - b.position || a.patternIndex - b.patternIndex,
  );
  return { steps, matches };
}

/* ────────────────── 걸음마다의 상태 — 전개와 불변식이 함께 쓴다 ────────────────── */

interface Step {
  /** 텍스트 자리. `-1` 은 텍스트를 읽기 전이다. */
  i: number;
  ch: string;
  state: number;
  path: string;
  /** 이 글자를 처리한 방식. */
  how: string;
  found: Match[];
}

function walk(auto: Automaton, text: string): Step[] {
  const name = paths(auto);
  const out: Step[] = [];
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i) - 97;
    const before = s;
    const child =
      (auto.depth[auto.next[before * SIGMA + c] as number] as number) ===
      (auto.depth[before] as number) + 1;
    s = auto.next[before * SIGMA + c] as number;
    const found: Match[] = [];
    for (let t = s; t !== -1; t = auto.outLink[t] as number) {
      for (const p of auto.endOf[t] as number[]) {
        found.push({
          patternIndex: p,
          position: i - (auto.depth[t] as number) + 1,
        });
      }
    }
    out.push({
      i,
      ch: text[i] as string,
      state: s,
      path: name[s] as string,
      how: child
        ? "자식으로 내려간다"
        : s === 0
          ? "물려받은 칸이 뿌리다"
          : "물려받은 칸으로 옮긴다",
      found,
    });
  }
  return out;
}

/** 정의 그대로 — `text[0..i]` 의 접미사이면서 어떤 패턴의 접두사인 것 중 가장 긴 것. */
function longestSuffixPrefix(
  text: string,
  i: number,
  patterns: readonly string[],
): string {
  let best = "";
  for (let k = 0; k <= i + 1; k++) {
    const tail = text.slice(i + 1 - k, i + 1);
    if (patterns.some((p) => p.startsWith(tail)) && tail.length > best.length) {
      best = tail;
    }
  }
  return best;
}

/* ────────────────── 변이 — 정본 소스에서 기계로 만든다 ────────────────── */

/**
 * `PROOFS` 의 함수는 **동기**여야 한다(`check-proof.ts` 가 `make()` 를 그대로 부른다).
 * 그래서 변이는 여기서 최상위 `await` 로 한 번만 만들어 둔다.
 */
const REF = new URL("./ahoCorasick-guide.ref.ts", import.meta.url).pathname;
type Impl = {
  ahoCorasick: typeof ahoCorasick;
  buildAutomaton: typeof buildAutomaton;
};

/** 자식이 없는 칸을 물려받지 않고 뿌리로 둔다. */
const emptyCellToRoot = await loadMutant<Impl>(REF, {
  swap: [
    /next\[v \* SIGMA \+ c\] = next\[f \* SIGMA \+ c\] as number;/,
    "next[v * SIGMA + c] = 0;",
  ],
});

/** 실패 링크를 전부 뿌리로 둔다 — 「가장 긴 접미사」가 사라진다. */
const linkToRoot = await loadMutant<Impl>(REF, {
  swap: [/link\[u\] = next\[f \* SIGMA \+ c\] as number;/, "link[u] = 0;"],
});

/** 반환 직전의 순서 맞춤을 빼고 찾은 순서 그대로 돌려준다. */
const noSort = await loadMutant<Impl>(REF, {
  drop: /found\.sort\(byPosition\);/,
});

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 가장 단순한 방법을 수치로 반박한다. */
  simpleCost: () => {
    const n = 2000;
    const k = 20;
    const len = 100;
    const text = "a".repeat(n);
    const patterns = Array.from(
      { length: k },
      (_, i) => "a".repeat(len - 1) + (ALPHABET[i] as string),
    );
    const total = patterns.reduce((a, p) => a + p.length, 0);
    const brute = bruteCounts(text, patterns);
    const merged = mergedCounts(text, patterns);
    const want = ahoCorasick(text, patterns);
    return [
      table(
        [
          `텍스트 ${num(n)} 글자 · 패턴 ${k} 개 · 길이 합 ${num(total)}`,
          "글자 견주기",
          "기본 연산",
          "매칭",
        ],
        [
          [
            "패턴마다 모든 시작 자리에서 대조한다",
            num(brute.ops / 2),
            num(brute.ops),
            num(brute.matches.length),
          ],
          [
            "패턴을 한 기계로 합쳐 텍스트를 한 번만 읽는다",
            "0",
            num(merged.ops),
            num(merged.matches.length),
          ],
        ],
        ["l", "r", "r", "r"],
      ),
      "",
      `두 방식의 매칭이 같은가: ${
        showMatches(brute.matches) === showMatches(want) &&
        showMatches(merged.matches) === showMatches(want)
          ? "같다"
          : "다르다"
      } (${num(want.length)} 개)`,
      `견주기의 상한 = 텍스트 길이 × 패턴 길이 합 = ${num(n)} × ${num(total)} = ${num(n * total)}`,
      `제약 최댓값에 같은 식을 넣으면 ${num(LIMIT_TEXT)} × ${num(LIMIT_TOTAL)} = ${num(LIMIT_TEXT * LIMIT_TOTAL)}`,
      "└ 실측 견주기가 상한 아래에 있다. 합친 기계 쪽은 글자를 견주는 자리가 없다 — 표를 조회한다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리하고 계수를 나란히 센다. */
  readOnceVersusEach: () => {
    const each = bruteCounts(TEXT, PATTERNS);
    const merged = mergedCounts(TEXT, PATTERNS);
    const rows = PATTERNS.map((p, i) => {
      const one = bruteCounts(TEXT, [p]);
      return [
        `${i} 번 패턴 ${p} 하나로`,
        num(one.ops / 2),
        showMatches(one.matches.map((m) => ({ ...m, patternIndex: i }))),
      ];
    });
    const grow = [1, 10, 100, 1000].map((r) => {
      const text = TEXT.repeat(r);
      const reads = bruteCounts(text, PATTERNS).ops / 2;
      return [
        num(text.length),
        num(reads),
        (reads / text.length).toFixed(2),
        num(text.length),
        "1.00",
      ];
    });
    return [
      table(
        [
          `텍스트 "${TEXT}" 를 패턴마다 따로 대조하면`,
          "텍스트 글자 읽기",
          "찾은 것",
        ],
        [...rows, ["합계", num(each.ops / 2), showMatches(each.matches)]],
        ["l", "r", "l"],
      ),
      "",
      table(
        [`같은 텍스트를 한 기계로 합쳐 읽으면`, "텍스트 글자 읽기", "찾은 것"],
        [
          [
            `패턴 ${PATTERNS.length} 개를 한 번에`,
            num(TEXT.length),
            showMatches(merged.matches),
          ],
        ],
        ["l", "r", "l"],
      ),
      "",
      table(
        [
          "텍스트를 길게 하면",
          "패턴마다 따로",
          "텍스트 길이의 몇 배",
          "한 기계로 합치기",
          "텍스트 길이의 몇 배",
        ],
        grow,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      "└ 답은 두 방식이 같다. 오른쪽은 언제나 텍스트 길이 그대로이고, 왼쪽은 그 네 배를 넘는다",
      `  왼쪽의 그 배수를 정하는 것이 패턴의 개수와 모양이다 — 여기서는 패턴 ${PATTERNS.length} 개다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 실패 링크의 정의를 여덟 상태에 그대로 적용한다. */
  failLinkTable: () => {
    const auto = buildAutomaton(PATTERNS);
    const name = paths(auto);
    const rows: string[][] = [];
    for (let s = 0; s < auto.size; s++) {
      const path = name[s] as string;
      // 정의 그대로 — 자기 자신을 뺀 접미사 중 어떤 패턴의 접두사인 가장 긴 것.
      let want = "";
      for (let k = 1; k < path.length; k++) {
        const tail = path.slice(k);
        if (PATTERNS.some((p) => p.startsWith(tail))) {
          want = tail;
          break;
        }
      }
      const ends = (auto.endOf[s] as number[]).map((p) => `${p} 번`).join(" ");
      rows.push([
        String(s),
        stateName(path),
        String(auto.depth[s] as number),
        stateName(want),
        stateName(name[auto.link[s] as number] as string),
        (auto.outLink[s] as number) === -1
          ? "-"
          : stateName(name[auto.outLink[s] as number] as string),
        ends === "" ? "-" : ends,
      ]);
    }
    return [
      table(
        [
          "상태",
          "경로 문자열",
          "깊이",
          "정의가 말하는 가장 긴 진 접미사",
          "실패 링크",
          "출력 링크",
          "여기서 끝나는 패턴",
        ],
        rows,
        ["r", "l", "r", "l", "l", "l", "l"],
      ),
      "",
      "└ 넷째 칸은 정의를 손으로 적용한 것이고 다섯째 칸은 만들어진 표다. 여덟 줄이 다 같다",
      "  she 의 출력 링크만 he 이고 나머지는 없다 — 다른 상태의 진 접미사 중에는 패턴이 없다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 표를 어디까지 펼칠지 여덟 가지로 실제 시험한다. */
  expandDepth: () => {
    const m = 64;
    const auto = buildAutomaton(["a".repeat(m)]);
    const text = `${"a".repeat(m)}b`.repeat(4);
    const rows = [0, 1, 2, 4, 8, 16, 32, 64].map((d) => {
      const r = scanWithDepth(auto, text, d);
      return [String(d), num(r.cells), num(r.lookups), num(r.worst)];
    });
    return [
      table(
        [
          "펼친 깊이",
          "저장 칸",
          "텍스트 전체의 표 조회",
          "한 글자에 든 최대 조회",
        ],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `패턴은 a 를 ${m} 번 이어 붙인 하나이고 텍스트는 (a×${m} 다음 b) 를 4 번 이어 붙인 ${num(text.length)} 글자다`,
      "└ 깊이를 깊게 펼칠수록 저장 칸이 늘고 조회가 준다. 전부 펼치면 한 글자에 정확히 한 번이다",
      `  제약 최댓값에서 전부 펼치면 ${SIGMA} × ${num(LIMIT_TOTAL + 1)} + 3 × ${num(LIMIT_TOTAL + 1)} = ${num(29 * (LIMIT_TOTAL + 1))} 칸이다`,
    ].join("\n");
  },

  /** `deep.walk` 단계 1 — 패턴 셋을 담은 뒤의 상태 여덟. */
  trieShape: () => {
    const auto = buildAutomaton(PATTERNS);
    const name = paths(auto);
    const rows: string[][] = [];
    for (let s = 0; s < auto.size; s++) {
      const kids: string[] = [];
      for (let c = 0; c < SIGMA; c++) {
        const u = auto.next[s * SIGMA + c] as number;
        if ((auto.depth[u] as number) !== (auto.depth[s] as number) + 1)
          continue;
        kids.push(
          `${ALPHABET[c] as string} -> ${stateName(name[u] as string)}`,
        );
      }
      const ends = (auto.endOf[s] as number[]).map((p) => `${p} 번`).join(" ");
      rows.push([
        String(s),
        stateName(name[s] as string),
        kids.length === 0 ? "-" : kids.join(" · "),
        ends === "" ? "-" : ends,
      ]);
    }
    return [
      table(["상태", "경로 문자열", "자식", "여기서 끝나는 패턴"], rows, [
        "r",
        "l",
        "l",
        "l",
      ]),
      "",
      `└ 패턴 길이의 합 ${PATTERNS.reduce((a, p) => a + p.length, 0)} 에서 he 와 hers 가 앞 두 글자를 함께 쓰므로 상태가 ${auto.size} 개다`,
    ].join("\n");
  },

  /** `deep.walk` 단계 4 — 고정 입력을 끝까지 실행한다. */
  walkTrace: () => {
    const auto = buildAutomaton(PATTERNS);
    const steps = walk(auto, TEXT);
    const rows: string[][] = [
      ["T1", "패턴 셋을 담는다", "-", "(뿌리)", "-", "-"],
      ["T2", "실패 링크와 전이표를 채운다", "-", "(뿌리)", "-", "-"],
    ];
    for (const s of steps) {
      rows.push([
        `T${s.i + 3}`,
        `자리 ${s.i} 의 글자 ${s.ch}`,
        s.how,
        stateName(s.path),
        s.found.length === 0 ? "-" : showMatches(s.found),
        String(s.found.length),
      ]);
    }
    const all = ahoCorasick(TEXT, PATTERNS);
    rows.push([
      `T${steps.length + 3}`,
      "시작 자리 순서로 맞춰 돌려준다",
      "-",
      "-",
      showMatches(all),
      String(all.length),
    ]);
    return [
      table(
        [
          "걸음",
          "무엇을 하는가",
          "어떻게 옮겼는가",
          "옮긴 뒤의 상태",
          "이 걸음의 매칭",
          "개수",
        ],
        rows,
        ["l", "l", "l", "l", "l", "r"],
      ),
      "",
      "└ 매칭은 `패턴 번호@시작 자리` 다. T6 한 걸음이 매칭을 둘 낸다 — she 가 끝나는 자리에",
      "  he 도 함께 끝난다. T7 은 자식이 없어 물려받은 칸으로 옮긴 걸음이다",
    ].join("\n");
  },

  /** 멈춤 — 자식이 없는 칸을 뿌리로 두면. */
  pauseEmptyCell: () => {
    const inputs: [string, string[]][] = [
      [TEXT, PATTERNS],
      ["ahishers", ["he", "she", "his", "hers"]],
      ["aaaa", ["aa"]],
    ];
    const rows = inputs.map(([text, patterns]) => {
      const want = ahoCorasick(text, patterns);
      const got = emptyCellToRoot.ahoCorasick(text, patterns);
      return [
        `"${text}"`,
        showMatches(want),
        showMatches(got),
        showMatches(want) === showMatches(got) ? "같다" : "다르다",
      ];
    });
    return [
      table(
        ["텍스트", "정본이 낸 매칭", "빈 칸을 뿌리로 둔 답", "판정"],
        rows,
        ["l", "l", "l", "l"],
      ),
      "",
      "└ 첫 줄에서 hers 가 사라진다. she 에서 r 을 읽을 때 her 로 가야 하는데 뿌리로 갔고,",
      "  그다음 s 를 읽어도 hers 를 끝낼 자리가 없다. 둘째 줄도 같은 자리에서 같은 것을 잃는다",
    ].join("\n");
  },

  /** 멈춤 — 출력 링크 대신 실패 링크를 따라가도 답은 같다. */
  pauseOutputLink: () => {
    const small = buildAutomaton(PATTERNS);
    const smallOut = collectByOutLink(small, TEXT);
    const smallFail = collectByFailLink(small, TEXT);

    const m = 64;
    const n = 1000;
    const long = buildAutomaton(["a".repeat(m)]);
    const longText = "a".repeat(n);
    const longOut = collectByOutLink(long, longText);
    const longFail = collectByFailLink(long, longText);

    return [
      table(
        ["입력", "출력 링크를 따라간다", "실패 링크를 따라간다", "답"],
        [
          [
            `"${TEXT}" · 패턴 ${PATTERNS.length} 개`,
            `${num(smallOut.steps)} 걸음`,
            `${num(smallFail.steps)} 걸음`,
            showMatches(smallOut.matches) === showMatches(smallFail.matches)
              ? "같다"
              : "다르다",
          ],
          [
            `a × ${num(n)} · 패턴 a × ${m} 하나`,
            `${num(longOut.steps)} 걸음`,
            `${num(longFail.steps)} 걸음`,
            showMatches(longOut.matches) === showMatches(longFail.matches)
              ? "같다"
              : "다르다",
          ],
        ],
        ["l", "r", "r", "l"],
      ),
      "",
      `둘째 줄의 매칭 수는 두 방식 다 ${num(longOut.matches.length)} 개다`,
      `└ 답은 어느 입력에서도 같다. 갈리는 것은 걸음 수이고, 둘째 줄에서 ${(
        longFail.steps / longOut.steps
      ).toFixed(1)} 배다`,
      "  실패 링크 쪽은 패턴이 끝나지 않는 상태를 매번 다시 거친다",
    ].join("\n");
  },

  /** 멈춤 — 찾은 순서는 끝난 자리의 순서다. */
  pauseSort: () => {
    const inputs: [string, string[]][] = [
      ["xaby", ["ab", "xaby"]],
      [TEXT, PATTERNS],
    ];
    const rows = inputs.map(([text, patterns]) => {
      const want = ahoCorasick(text, patterns);
      const got = noSort.ahoCorasick(text, patterns);
      return [
        `"${text}"`,
        showMatches(want),
        showMatches(got),
        showMatches(want) === showMatches(got) ? "같다" : "다르다",
      ];
    });
    return [
      table(["텍스트", "정본이 낸 순서", "순서를 안 맞춘 답", "판정"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      "└ 첫 줄은 담긴 것이 같고 순서만 다르다. xaby 는 자리 0 에서 시작하는데 자리 3 에서 끝나고,",
      "  ab 는 자리 1 에서 시작해 자리 2 에서 끝난다 — 끝난 순서와 시작 순서가 뒤집히는 자리다",
      "  둘째 줄에서는 두 순서가 우연히 같다. 이 입력만 시험하면 이 실패를 확인하지 못한다",
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 전개 입력과 경계 입력에 실행한다. */
  finalRun: () => {
    const cases: [string, string, string[]][] = [
      ["전개 입력", TEXT, PATTERNS],
      ["문제의 예시", "ahishers", ["he", "she", "his", "hers"]],
      ["겹쳐 등장", "aaaa", ["aa"]],
      ["접미사 관계", "abc", ["abc", "bc"]],
      ["매칭이 없다", "abcdef", ["xyz", "qrs"]],
      ["패턴이 텍스트보다 길다", "ab", ["abcdef"]],
      ["같은 패턴 두 벌", "abab", ["ab", "ab"]],
      ["길이 1", "a", ["a"]],
    ];
    return [
      table(
        ["무엇", "텍스트", "패턴", "반환"],
        cases.map(([label, text, patterns]) => [
          label,
          `"${text}"`,
          patterns.map((p) => `"${p}"`).join(" "),
          showMatches(ahoCorasick(text, patterns)),
        ]),
        ["l", "l", "l", "l"],
      ),
      "",
      "└ 매칭은 `패턴 번호@시작 자리` 다. 아래 일곱은 전개에서 나오지 않은 자리다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const rows: string[][] = [];
    for (const [n, m] of [
      [20, 5],
      [50, 9],
      [200, 9],
      [200, 19],
    ] as [number, number][]) {
      const patterns = Array.from({ length: m }, (_, j) => "a".repeat(j + 1));
      const total = patterns.reduce((a, p) => a + p.length, 0);
      const got = ahoCorasick("a".repeat(n), patterns).length;
      const formula = m * (n + 1) - (m * (m + 1)) / 2;
      rows.push([
        num(n),
        num(m),
        num(total),
        num(formula),
        num(got),
        formula === got ? "같다" : "다르다",
      ]);
    }
    return [
      table(
        [
          "텍스트 길이 n",
          "패턴 수 m",
          "길이 합",
          "식이 낸 값",
          "실행이 낸 매칭 수",
          "판정",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      "└ 패턴은 a · aa · aaa … 를 m 개까지이고 텍스트는 a 를 n 번 이어 붙인 것이다",
      "  식은 m(n+1) − m(m+1)/2 이고 네 줄이 다 실행과 같다",
    ].join("\n");
  },

  /** `deep.math` ④ — 제약 규모를 식에 넣어 수치를 낸다. */
  mathBound: () => {
    let m = 0;
    while (((m + 1) * (m + 2)) / 2 <= LIMIT_TOTAL) m += 1;
    const zMax = m * (LIMIT_TEXT + 1) - (m * (m + 1)) / 2;
    const rows = [m - 1, m, m + 1].map((x) => [
      num(x),
      num((x * (x + 1)) / 2),
      (x * (x + 1)) / 2 <= LIMIT_TOTAL ? "제약 안" : "제약 밖",
      num(x * (LIMIT_TEXT + 1) - (x * (x + 1)) / 2),
    ]);
    return [
      table(
        [
          "서로 다른 길이의 개수 m",
          "길이 합 m(m+1)/2",
          "제약 판정",
          "매칭 수 상한",
        ],
        rows,
        ["r", "r", "l", "r"],
      ),
      "",
      `└ 서로 다른 패턴이면 매칭 수는 많아야 ${num(zMax)} 개다`,
      `  같은 패턴을 여러 벌 담을 수 있다면 패턴 수가 ${num(LIMIT_TOTAL)} 까지 가므로`,
      `  상한은 ${num(LIMIT_TEXT)} × ${num(LIMIT_TOTAL)} = ${num(LIMIT_TEXT * LIMIT_TOTAL)} 이 된다`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 상태가 정의와 같은지 값으로 확인한다. */
  invariantStates: () => {
    const auto = buildAutomaton(PATTERNS);
    const steps = walk(auto, TEXT);
    const rows = steps.map((s) => {
      const want = longestSuffixPrefix(TEXT, s.i, PATTERNS);
      return [
        `T${s.i + 3}`,
        String(s.i),
        s.ch,
        `"${TEXT.slice(0, s.i + 1)}"`,
        stateName(want),
        stateName(s.path),
        want === s.path ? "같다" : "다르다",
      ];
    });
    return [
      table(
        [
          "걸음",
          "자리",
          "글자",
          "여기까지 읽은 것",
          "정의가 말하는 가장 긴 접미사",
          "상태의 경로 문자열",
          "판정",
        ],
        rows,
        ["l", "r", "l", "l", "l", "l", "l"],
      ),
      "",
      "└ 다섯째 칸은 패턴 셋의 접두사를 전부 만들어 정의대로 고른 것이고 여섯째 칸은 코드가 옮겨 간 상태다",
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  invariantEdges: () => {
    const cases: [string, string, string[]][] = [
      ["텍스트 한 글자", "a", ["a"]],
      ["패턴이 텍스트보다 길다", "ab", ["abcdef"]],
      ["패턴이 텍스트 그 자체", "abc", ["abc"]],
      ["첫 글자부터 어긋난다", "zzz", ["a", "b"]],
      ["전부 겹친다", "aaaa", ["a", "aa", "aaa"]],
      ["같은 패턴 두 벌", "ab", ["ab", "ab"]],
    ];
    return [
      table(
        ["무엇", "텍스트", "패턴", "매칭", "개수"],
        cases.map(([label, text, patterns]) => {
          const r = ahoCorasick(text, patterns);
          return [
            label,
            `"${text}"`,
            patterns.map((p) => `"${p}"`).join(" "),
            showMatches(r),
            String(r.length),
          ];
        }),
        ["l", "l", "l", "l", "r"],
      ),
      "",
      "└ 다섯째 줄은 자리마다 매칭이 여럿 나오는 경우이고, 여섯째 줄은 같은 자리가 두 번 적히는 경우다",
    ].join("\n");
  },

  /** `invariant` ③ — 실패 링크를 전부 뿌리로 두면. */
  mutantLinkRoot: () => {
    const inputs: [string, string[]][] = [
      [TEXT, PATTERNS],
      ["ahishers", ["he", "she", "his", "hers"]],
      ["aaaa", ["aa"]],
    ];
    const rows = inputs.map(([text, patterns]) => {
      const want = ahoCorasick(text, patterns);
      const got = linkToRoot.ahoCorasick(text, patterns);
      return [
        `"${text}"`,
        showMatches(want),
        showMatches(got),
        showMatches(want) === showMatches(got) ? "같다" : "다르다",
      ];
    });

    const auto = buildAutomaton(PATTERNS);
    const broken = linkToRoot.buildAutomaton(PATTERNS);
    const name = paths(auto);
    const mismatched: string[] = [];
    for (let s = 1; s < auto.size; s++) {
      if ((auto.link[s] as number) === (broken.link[s] as number)) continue;
      mismatched.push(
        `${stateName(name[s] as string)} 의 실패 링크가 ${stateName(
          name[auto.link[s] as number] as string,
        )} 에서 ${stateName(name[broken.link[s] as number] as string)} 로 바뀐다`,
      );
    }

    return [
      table(
        ["텍스트", "정본이 낸 매칭", "실패 링크를 뿌리로 둔 답", "판정"],
        rows,
        ["l", "l", "l", "l"],
      ),
      "",
      ...mismatched.map((s) => `  ${s}`),
      `└ 어긋나는 상태는 ${mismatched.length} 개이고, 그중 she 의 어긋남 하나가 첫 줄의 매칭 셋 중 둘을 없앤다`,
    ].join("\n");
  },

  /** `perf.derive` — 전개 입력의 기본 연산을 무리별로 센다. */
  perfCount: () => {
    const auto = buildAutomaton(PATTERNS);
    const total = PATTERNS.reduce((a, p) => a + p.length, 0);
    const merged = mergedCounts(TEXT, PATTERNS);
    const steps = walk(auto, TEXT);
    const chain = collectByOutLink(auto, TEXT).steps;
    const found = ahoCorasick(TEXT, PATTERNS);
    return [
      table(
        ["무리", "무엇을 세는가", "식", "이 입력에서"],
        [
          [
            "패턴을 담는다",
            "패턴 글자마다 표 조회",
            "2L + 새 상태 수 + k",
            `${num(2 * total + (auto.size - 1) + PATTERNS.length)}`,
          ],
          [
            "표를 채운다",
            "상태마다 26 칸",
            "2·26 + (S−1)(2 + 3·26)",
            `${num(3 * SIGMA * (auto.size - 1) + 2 * SIGMA + 2 * (auto.size - 1))}`,
          ],
          [
            "텍스트를 읽는다",
            "글자마다 읽기와 조회",
            "2n",
            `${num(2 * TEXT.length)}`,
          ],
          [
            "매칭을 거둔다",
            "출력 링크를 따라간 걸음",
            "n + 출력 링크 이동",
            `${num(chain)}`,
          ],
          ["합계", "-", "-", num(merged.ops)],
        ],
        ["l", "l", "l", "r"],
      ),
      "",
      `상태 수 S = ${auto.size} · 패턴 길이 합 L = ${total} · 텍스트 길이 n = ${TEXT.length} · 매칭 수 z = ${found.length}`,
      `└ 텍스트를 읽는 무리는 ${num(2 * TEXT.length)} 이고 걸음 ${steps.length} 개에 고르게 나뉜다 — 패턴이 몇 개든 이 수는 그대로다`,
    ].join("\n");
  },

  /** `perf.worst` — 축마다 최악을 만드는 입력이 다르다. */
  worstShape: () => {
    const shapes: [string, string[], number][] = [
      [
        "첫 글자부터 서로 다른 패턴 20 개",
        Array.from({ length: 20 }, (_, i) =>
          (ALPHABET[i] as string).repeat(50),
        ),
        1000,
      ],
      [
        "앞 49 글자를 함께 쓰는 패턴 20 개",
        Array.from(
          { length: 20 },
          (_, i) => "a".repeat(49) + (ALPHABET[i] as string),
        ),
        1000,
      ],
      ["길이 1,000 짜리 패턴 하나", ["a".repeat(1000)], 1000],
      [
        "a · aa · aaa … 를 44 개",
        Array.from({ length: 44 }, (_, j) => "a".repeat(j + 1)),
        1000,
      ],
    ];
    const rows = shapes.map(([label, patterns, n]) => {
      const auto = buildAutomaton(patterns);
      const total = patterns.reduce((a, p) => a + p.length, 0);
      const text = "a".repeat(n);
      const z = ahoCorasick(text, patterns).length;
      return [
        label,
        num(total),
        num(auto.size),
        num(SIGMA * auto.size + 3 * auto.size + patterns.length),
        num(n),
        num(z),
      ];
    });
    return [
      table(
        ["패턴의 모양", "길이 합", "상태 수", "저장 칸", "표 조회", "매칭 수"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ 텍스트는 네 줄 다 a 를 1,000 번 이어 붙인 것이고 표 조회는 네 줄 다 ${num(1000)} 이다`,
      "  갈리는 것은 상태 수와 매칭 수이고, 그 둘을 정하는 것은 패턴의 모양이다",
    ].join("\n");
  },

  /** `purpose.alt` — 두 설계를 같은 입력에 걸고 계수를 나란히 센다. */
  altCounts: () => {
    const text = makeText(TEXT_LENGTH);
    const rows = [1, 39, 40, 1000].map((k) => {
      const patterns = makePatterns(text, k, PATTERN_TOTAL);
      const merged = mergedCounts(text, patterns);
      const kmp = perPatternKmpCounts(text, patterns);
      return [
        num(k),
        num((patterns[0] as string).length),
        num(merged.ops),
        num(kmp.ops),
        merged.ops < kmp.ops ? "한 기계로 합치기" : "패턴마다 KMP",
      ];
    });
    return [
      table(
        [
          "패턴 수 k",
          "패턴 하나의 길이",
          "한 기계로 합치기",
          "패턴마다 KMP",
          "어느 쪽이 적은가",
        ],
        rows,
        ["r", "r", "r", "r", "l"],
      ),
      "",
      "└ 텍스트 100,000 글자 · 패턴 길이 합 100,000 을 고정하고 패턴 수만 바꿨다",
      "  39 와 40 사이에서 순서가 뒤집힌다",
    ].join("\n");
  },

  /** `purpose.alt` — 저장 칸은 뒤집히지 않는다. */
  altCells: () => {
    const text = makeText(TEXT_LENGTH);
    const rows = [1, 1000].map((k) => {
      const patterns = makePatterns(text, k, PATTERN_TOTAL);
      return [
        num(k),
        num(mergedCounts(text, patterns).cells),
        num(perPatternKmpCounts(text, patterns).cells),
        "패턴마다 KMP",
      ];
    });
    return [
      table(
        ["패턴 수 k", "한 기계로 합치기", "패턴마다 KMP", "어느 쪽이 적은가"],
        rows,
        ["r", "r", "r", "l"],
      ),
      "",
      "└ 두 줄 다 같은 쪽이 적다. KMP 는 실패 함수 한 벌만 들고 있으면 되고,",
      "  합친 기계는 상태마다 26 칸을 잡는다 — 이것이 내주는 축이다",
    ].join("\n");
  },
};
