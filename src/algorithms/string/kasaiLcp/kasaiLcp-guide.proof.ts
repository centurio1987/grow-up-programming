/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 자리마다의 상태는 그림 사이드카의 `replay`(정본과 답을 대조한 다시 쓰기)에서 받고, 셈은 그림 사이드카의
 * 계수기에서 받는다 — 그림과 표가 같은 기록을 쓴다. 판정 줄(「같다」·「어긋난다」)이 있는 블록은 중화
 * 실행에서도 값이 나오도록 `trace` 대신 `replay` 를 쓴다(그림 사이드카 머리 주석).
 *
 *   bun run tools/check-proof.ts src/algorithms/string/kasaiLcp/kasaiLcp-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  byDefinition,
  countKasai,
  countPairwise,
  fibonacciWord,
  LIMIT,
  makeText,
  num,
  OPS_PER_SEC,
  pairwiseByLcp,
  type Row,
  replay,
  SHAPES,
  saOf,
  shape,
  show,
  trace,
  WALK,
  walkSteps,
} from "./kasaiLcp-guide.fig.tsx";
import { kasaiLcp } from "./kasaiLcp-guide.ref.ts";

const REF = new URL("./kasaiLcp-guide.ref.ts", import.meta.url).pathname;

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

const fix = (x: number, d: number): string => x.toFixed(d);

const quote = (s: string): string => `"${s}"`;

/** 입력 이름 — 전개 입력은 그렇다고 밝힌다. */
const label = (s: string): string =>
  s === WALK ? `전개 입력 "${s}"` : quote(s);

/** 1 초에 1 억 번 기준의 초. */
const secs = (access: number): string => `${fix(access / OPS_PER_SEC, 1)} 초`;

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  kasaiLcp(s: string, sa: number[]): number[];
}

/** 순위 배열을 반대로 채운 사본 — 값과 자리를 안 맞바꿨다. */
const invFlipped = await loadMutant<Impl>(REF, {
  swap: [/rank\[sa\[k\] as number\] = k;/, "rank[k] = sa[k] as number;"],
});

/** 답을 순위 칸이 아니라 자리 칸에 적은 사본. */
const textOrderWrite = await loadMutant<Impl>(REF, {
  swap: [/lcp\[rank\[i\] as number\] = len;/, "lcp[i] = len;"],
});

/** 이웃이 없는 자리에서 `len` 을 0 으로 되돌리는 줄을 뺀 사본. */
const noReset = await loadMutant<Impl>(REF, {
  drop: /^\s+len = 0;$/,
});

/** **불변식을 지키던 줄** 하나 — 적은 뒤에 `len` 을 하나 줄이는 줄을 뺀 사본. */
const noDecrement = await loadMutant<Impl>(REF, {
  drop: /if \(len > 0\) len--;/,
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

/** 본문 여러 자리가 함께 쓰는 작은 입력 여덟 — 접미사 배열 편의 짚고 가기 표와 같은 목록이다. */
const CASES: string[] = [
  WALK,
  "aaaa",
  "abab",
  "mississippi",
  "abc",
  "aab",
  "cabbage",
  "abracadabra",
];

/** 정본과 변이를 여덟 입력에 나란히 — 판정 열은 두 답이 같은가다. */
function contrast(
  head: string,
  mutant: Impl,
): { table: string; broken: number; kept: string[] } {
  let broken = 0;
  const kept: string[] = [];
  const rows = CASES.map((s) => {
    const sa = saOf(s);
    const a = kasaiLcp(s, [...sa]);
    const b = mutant.kasaiLcp(s, [...sa]);
    const ok = show(a) === show(b);
    if (ok) kept.push(s);
    else broken++;
    return [label(s), show(a), show(b), ok ? "같다" : "어긋난다"];
  });
  return {
    table: md(["입력", "정본이 낸 답", head, "판정"], rows),
    broken,
    kept,
  };
}

function tally(c: { broken: number; kept: string[] }): string {
  const n = CASES.length;
  if (c.kept.length === 0) return `${n} 입력 모두에서 답이 어긋났습니다.`;
  if (c.broken === 0) return `${n} 입력 모두에서 답이 같았습니다.`;
  const kept = c.kept.map(quote).join(" · ");
  return `${n} 입력 중 ${c.broken} 입력에서 답이 어긋났고, ${kept} 에서는 같았습니다.`;
}

/** 전개 입력의 기록 — 판정 줄이 있는 블록도 쓰므로 계측 없는 `replay` 다. */
const walk = () => replay(WALK);

/**
 * 영문 조각 뒤의 조사 — 마지막 글자의 이름으로 받침을 본다(`a` 에이 · `n` 엔). 조각을 통째로 넘기면 헬퍼가
 * 영단어로 보고 받침 있음을 고른다.
 */
const last = (w: string, pick: (x: string) => string): string =>
  pick(w.at(-1) ?? "");

/** 이웃이 없으면 `—`. */
const dash = (x: number | null): string => (x === null ? "—" : String(x));

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /* ── 전체 컨셉 ── */

  "concept-banana": () => {
    const r = walk();
    const n = WALK.length;
    const rows = r.sa.map((p, k) => [
      String(k),
      String(p),
      WALK.slice(p),
      k + 1 < n ? WALK.slice(r.sa[k + 1] as number) : "없다",
      String(r.lcp[k]),
    ]);
    return block(
      md(
        ["사전순 자리 k", "sa[k]", "접미사", "다음 칸의 접미사", "lcp[k]"],
        rows,
        [0, 1, 4],
      ),
      `다섯째 열을 모은 ${show(r.lcp)}${이가(show(r.lcp))} LCP 배열입니다. 마지막 칸 lcp[${n - 1}] 에는 다음 칸이 없어 처음 잡은 0 이 그대로 남습니다.`,
    );
  },

  "concept-cost": () => {
    const inputs: [string, string][] = [
      [quote(WALK), WALK],
      ["무작위 26 글자", makeText(LIMIT, 26)],
      ["전부 같은 글자", "a".repeat(LIMIT)],
    ];
    const rows = inputs.map(([name, s]) => {
      const sa = saOf(s);
      const p = pairwiseByLcp(s, sa);
      const k = countKasai(s, sa);
      return [name, num(s.length), num(p.access), num(k.access)];
    });
    const big = "a".repeat(LIMIT);
    const p = pairwiseByLcp(big, saOf(big));
    const k = countKasai(big, saOf(big));
    return block(
      md(
        ["입력", "n", "짝마다 처음부터 비교", "길이 이어받기"],
        rows,
        [1, 2, 3],
      ),
      `셋 다 자료 접근 횟수입니다. 무작위 26 글자는 mulberry32(씨앗 0x9e3779b9)로 만든 문자열이고, 전부 같은 글자에서 두 방법의 차이는 ${num(Math.round(p.access / k.access))} 배입니다.`,
    );
  },

  /* ── 아이디어를 떠올리는 과정 ── */

  "origin-naive-cost": () => {
    const ns = [1_000, 10_000, LIMIT];
    const rows = ns.map((n) => {
      const a = "a".repeat(n);
      const r = makeText(n, 26);
      return [
        num(n),
        num(pairwiseByLcp(a, saOf(a)).access),
        num(pairwiseByLcp(r, saOf(r)).access),
      ];
    });
    const big = "a".repeat(LIMIT);
    const p = pairwiseByLcp(big, saOf(big));
    return block(
      md(["n", "전부 같은 글자", "무작위 26 글자"], rows, [0, 1, 2]),
      `전부 같은 글자 n = ${num(LIMIT)} 에서 자료 접근이 ${num(p.access)} 번이고, 1 초에 1 억 번이면 ${secs(p.access)}입니다.`,
    );
  },

  "origin-reread": () => {
    const s = "aaaa";
    const n = s.length;
    const sa = saOf(s);
    const reads = new Array<number>(n).fill(0);
    const rows: string[][] = [];
    let total = 0;
    for (let r = 0; r + 1 < n; r++) {
      const a = sa[r] as number;
      const b = sa[r + 1] as number;
      let t = 0;
      let cmp = 0;
      while (a + t < n && b + t < n) {
        cmp++;
        reads[a + t] = (reads[a + t] as number) + 1;
        reads[b + t] = (reads[b + t] as number) + 1;
        if (s[a + t] !== s[b + t]) break;
        t++;
      }
      total += cmp;
      rows.push([
        `sa[${r}] · sa[${r + 1}]`,
        s.slice(a),
        s.slice(b),
        String(cmp),
        String(t),
      ]);
    }
    const most = Math.max(...reads);
    const at = reads.indexOf(most);
    return block(
      md(
        ["비교한 두 칸", "앞 접미사", "뒤 접미사", "글자 비교", "lcp"],
        rows,
        [3, 4],
      ),
      "자리마다 그 글자를 읽은 횟수를 세면 이렇습니다.",
      md(
        ["자리", ...reads.map((_, p) => String(p))],
        [["읽은 횟수", ...reads.map(String)]],
      ),
      `글자 비교는 모두 ${total} 번이고, 자리 ${at} 의 글자 하나를 ${most} 번 읽었습니다.`,
    );
  },

  "origin-order": () => {
    const r = walk();
    const n = WALK.length;
    const byRank = r.sa.slice(0, n - 1).map((a, k) => `(${a}, ${r.sa[k + 1]})`);
    const byText = r.rows
      .filter((x) => x.j !== null)
      .map((x) => `(${x.i}, ${x.j})`);
    const key = (p: string) =>
      p
        .replace(/[()]/g, "")
        .split(", ")
        .map(Number)
        .sort((x, y) => x - y)
        .join(",");
    const setA = new Set(byRank.map(key));
    const same = byText.every((p) => setA.has(key(p)));
    const rows = byRank.map((p, t) => [String(t + 1), p, byText[t] ?? "—"]);
    return block(
      md(
        ["차례", "sa 의 칸 순서로 고른 짝", "문자열 자리 순서로 고른 짝"],
        rows,
        [0],
      ),
      `짝은 두 시작 자리입니다. 자리 순서로 고른 짝 ${byText.length} 개는 ${same ? "칸 순서로 고른 짝과 같은 짝이고" : "칸 순서의 짝과 다르고"}, 차례만 다릅니다.`,
    );
  },

  "origin-three": () => {
    const inputs: [string, string][] = [
      [label(WALK), WALK],
      [quote("aaaa"), "aaaa"],
      [quote("mississippi"), "mississippi"],
      ["전부 같은 글자 n = 1,000", "a".repeat(1_000)],
      ["무작위 두 글자 n = 1,000", makeText(1_000, 2)],
    ];
    const rows = inputs.map(([name, s]) => {
      const sa = saOf(s);
      return [
        name,
        num(countPairwise(s, sa).access),
        num(countKasai(s, sa, Number.POSITIVE_INFINITY).access),
        num(countKasai(s, sa).access),
      ];
    });
    const a = "a".repeat(1_000);
    const fresh = countKasai(a, saOf(a), Number.POSITIVE_INFINITY);
    const pair = countPairwise(a, saOf(a));
    return block(
      md(
        [
          "입력",
          "짝마다 처음부터",
          "자리 순서 · 자리마다 처음부터",
          "자리 순서 · 하나 줄여 이어받기",
        ],
        rows,
        [1, 2, 3],
      ),
      `셋 다 자료 접근 횟수입니다. 전부 같은 글자 1,000 개에서 자리 순서로만 바꾼 방법의 글자 비교는 ${num(fresh.eq + fresh.ne)} 번으로 짝마다 처음부터 비교한 ${num(pair.eq + pair.ne)} 번과 같습니다.`,
    );
  },

  "origin-shift": () => {
    const r = walk();
    const at = r.rows.find((x) => x.j !== null && (x.h as number) >= 2) as Row;
    const i = at.i;
    const j = at.j as number;
    const h = at.h as number;
    const cut = byDefinition(WALK, [i + 1, j + 1])[0] as number;
    const rows = [
      [
        `자리 ${i}${과와(i)} 이웃 ${j}`,
        WALK.slice(i),
        WALK.slice(j),
        String(h),
      ],
      [
        `둘 다 첫 글자를 뗀 자리 ${i + 1}${과와(i + 1)} ${j + 1}`,
        WALK.slice(i + 1),
        WALK.slice(j + 1),
        String(cut),
      ],
    ];
    return block(
      md(["짝", "앞 접미사", "뒤 접미사", "함께 가진 앞부분"], rows, [3]),
      `첫 글자가 같은 두 접미사에서 첫 글자를 하나씩 떼면 함께 가진 앞부분이 ${h} 에서 ${cut}${으로(cut)} 하나 줍니다.`,
    );
  },

  "origin-keep": () => {
    const good = walk();
    const keep = replay(WALK, saOf(WALK), 0);
    const rows = keep.rows.map((x, t) => {
      const g = good.rows[t] as Row;
      return [String(x.i), String(x.kIn), dash(x.h), dash(g.h)];
    });
    const over = keep.rows.filter(
      (x, t) => x.h !== null && x.h !== good.rows[t]?.h,
    );
    const first = over[0] as Row;
    return block(
      md(
        ["자리 i", "들어올 때 len", "그대로 이어받은 쪽이 적은 값", "바른 값"],
        rows,
        [0, 1, 2, 3],
      ),
      `그대로 이어받으면 답이 ${show(keep.lcp)}${이가(show(keep.lcp))} 되고, 바른 답은 ${show(good.lcp)} 입니다. 처음 틀리는 곳은 자리 ${first.i} 입니다. 들어올 때 len = ${first.kIn}${을를(first.kIn)} 그대로 적었습니다.`,
    );
  },

  /* ── 아이디어 상세 ── */

  "build-read-one": () => {
    const r = walk();
    const k = r.lcp.indexOf(Math.max(...r.lcp));
    const a = r.sa[k] as number;
    const b = r.sa[k + 1] as number;
    const L = r.lcp[k] as number;
    const shorter = WALK.length - a < WALK.length - b ? a : b;
    const last = WALK[a + L - 1] as string;
    return [
      `lcp[${k}] = ${L}`,
      `  두 칸        sa[${k}] = ${a} · sa[${k + 1}] = ${b}`,
      `  두 접미사    ${WALK.slice(a)} · ${WALK.slice(b)}`,
      `  읽는 법      앞에서부터 ${WALK.slice(a, a + L)
        .split("")
        .join(" ")}${이가(last)} 같고 ${WALK.slice(shorter)} 쪽이 먼저 끝난다`,
    ].join("\n");
  },

  "build-range-min": () => {
    const r = walk();
    const n = WALK.length;
    const rows: string[][] = [];
    let same = 0;
    for (let x = 0; x < n; x++) {
      for (let y = x + 2; y < n; y++) {
        const a = r.sa[x] as number;
        const b = r.sa[y] as number;
        const direct = byDefinition(WALK, [a, b])[0] as number;
        const min = Math.min(...r.lcp.slice(x, y));
        if (direct === min) same++;
        if (x === 0 || y === x + 2)
          rows.push([
            `sa[${x}] · sa[${y}]`,
            `${WALK.slice(a)} · ${WALK.slice(b)}`,
            String(direct),
            `min(${r.lcp.slice(x, y).join(", ")}) = ${min}`,
          ]);
      }
    }
    const total = ((n - 1) * (n - 2)) / 2;
    return block(
      md(
        [
          "떨어진 두 칸",
          "두 접미사",
          "함께 가진 앞부분",
          "사이 칸 lcp 의 최솟값",
        ],
        rows,
        [2],
      ),
      `이웃하지 않은 칸 짝 ${total} 개를 모두 재면 두 값이 같은 짝이 ${same} 개입니다. 위 표는 그중 ${rows.length} 개입니다.`,
    );
  },

  "build-two-orders": () => {
    const r = walk();
    const rows = r.rows.map((x) => [
      String(x.i),
      WALK.slice(x.i),
      String(x.rank),
      dash(x.h),
    ]);
    const h = r.rows.map((x) => dash(x.h));
    return block(
      md(
        ["자리 i", "접미사", "rank[i]", "자리 i 에서 구한 길이 h(i)"],
        rows,
        [0, 2, 3],
      ),
      `자리 순서로 늘어놓은 길이는 ${show(h)}${josa(show(h), "이고", "고")}, 그 값을 칸 rank[i] 로 옮겨 적은 LCP 배열은 ${show(r.lcp)} 입니다.`,
    );
  },

  "build-neighbor": () => {
    const r = walk();
    const n = WALK.length;
    const rows = r.rows.map((x) => [
      String(x.i),
      WALK.slice(x.i),
      String(x.rank),
      x.j === null ? "없다" : `sa[${x.rank + 1}] = ${x.j}`,
      x.j === null ? "—" : WALK.slice(x.j),
    ]);
    const none = r.rows.find((x) => x.j === null) as Row;
    return block(
      md(
        ["자리 i", "접미사", "rank[i]", "이웃 j", "이웃의 접미사"],
        rows,
        [0, 2],
      ),
      `자리 ${none.i}${은는(none.i)} rank[${none.i}] = ${none.rank}${이가(none.rank)} n − 1 = ${n - 1}${과와(n - 1)} 같아 이웃이 없습니다.`,
    );
  },

  "build-extend": () => {
    const r = walk();
    const rows: string[][] = [];
    for (const x of r.rows) {
      if (x.j === null || x.eq + x.ne === 0) continue;
      const h = x.h as number;
      for (let t = x.kIn; t <= h; t++) {
        const a = WALK[x.i + t];
        const b = WALK[(x.j as number) + t];
        if (a === undefined || b === undefined) break;
        rows.push([
          String(x.i),
          String(t),
          `s[${x.i + t}] = ${a}`,
          `s[${(x.j as number) + t}] = ${b}`,
          a === b ? "같은 글자 — len 을 늘린다" : "다른 글자 — 멈춘다",
        ]);
      }
    }
    const five = r.rows.find((x) => x.stop === "end" && x.eq > 0) as Row;
    const ended = WALK.slice(Math.max(five.i, five.j as number));
    return block(
      md(
        ["자리 i", "len", "자리 i 쪽 글자", "이웃 쪽 글자", "결과"],
        rows,
        [0, 1],
      ),
      `자리 ${five.i} 에서는 len = ${five.h} 에서 접미사 ${ended}${last(ended, 이가)} 끝나 글자를 더 읽지 않고 멈춥니다.`,
    );
  },

  "build-write-order": () => {
    const r = walk();
    const n = WALK.length;
    const lcp: (number | null)[] = new Array<number | null>(n).fill(null);
    const rows = r.rows.map((x) => {
      if (x.h !== null) lcp[x.rank] = x.h;
      return [
        String(x.i),
        x.j === null ? "적지 않는다" : `lcp[${x.rank}] = ${x.h}`,
        show(lcp.map((v) => (v === null ? "·" : String(v)))),
      ];
    });
    const order = r.rows.filter((x) => x.j !== null).map((x) => x.rank);
    return block(
      md(["자리 i", "적은 칸", "그때까지 적은 lcp"], rows, [0]),
      `칸이 채워지는 차례는 ${order.join(" → ")}${josa(order.join(" → "), "이고", "고")}, 한 번도 안 적힌 칸 ${n - 1}${은는(n - 1)} 처음 잡은 0 을 그대로 가집니다.`,
    );
  },

  "build-carry": () => {
    const r = walk();
    const rows = r.rows.map((x) => [
      String(x.i),
      String(x.kIn),
      dash(x.h),
      String(x.eq),
      x.h === null ? "이웃 없음" : x.kIn <= x.h ? "넘지 않는다" : "넘는다",
    ]);
    const eq = r.rows.reduce((t, x) => t + x.eq, 0);
    const kept = r.rows.filter((x) => x.h !== null && x.kIn === x.h).length;
    return block(
      md(
        [
          "자리 i",
          "들어올 때 len",
          "h(i)",
          "새로 확인한 같은 글자",
          "len 과 h(i)",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `이웃이 있는 자리 모두에서 들어올 때 len 이 h(i) 를 넘지 않았고, 새로 확인한 같은 글자는 모두 ${eq} 개입니다. 이어받은 len 이 곧 h(i) 인 자리가 ${kept} 곳입니다.`,
    );
  },

  "build-why-safe": () => {
    const inputs = [WALK, "abracadabra"];
    const rows: string[][] = [];
    let moved = 0;
    for (const s of inputs) {
      const r = replay(s);
      for (let t = 0; t + 1 < r.rows.length; t++) {
        const a = r.rows[t] as Row;
        const b = r.rows[t + 1] as Row;
        if (a.h === null || a.h < 2 || b.j === null) continue;
        const jn = (a.j as number) + 1;
        if (b.j !== jn) moved++;
        rows.push([
          label(s),
          `${a.i} → ${b.i}`,
          `${s.slice(b.i)} · ${s.slice(jn)}`,
          String(a.h - 1),
          `${b.j} · ${s.slice(b.j)}`,
          String(b.h),
        ]);
      }
    }
    return block(
      md(
        [
          "입력",
          "자리",
          "첫 글자를 뗀 짝",
          "그 짝이 함께 가진 앞부분",
          "진짜 이웃",
          "h(i+1)",
        ],
        rows,
        [3, 5],
      ),
      `${rows.length} 줄 모두에서 h(i+1) 의 값이 첫 글자를 뗀 짝의 길이 이상이고, 그중 ${moved} 줄은 진짜 이웃이 첫 글자를 뗀 짝의 뒤 접미사가 아닙니다.`,
    );
  },

  "build-premise-sa": () => {
    const good = saOf(WALK);
    let bad: number[] = [...good];
    let at = -1;
    // 이웃한 두 칸을 맞바꿔 사전순이 아닌 배열을 만든다. 맞바꿔서 답이 갈리는 첫 자리를 고른다.
    for (let k = 0; k + 1 < good.length && at < 0; k++) {
      const w = [...good];
      [w[k], w[k + 1]] = [w[k + 1] as number, w[k] as number];
      if (show(kasaiLcp(WALK, [...w])) !== show(byDefinition(WALK, w))) {
        at = k;
        bad = w;
      }
    }
    const a = kasaiLcp(WALK, [...bad]);
    const b = byDefinition(WALK, bad);
    const rows = [
      [
        "사전순인 sa",
        show(good),
        show(kasaiLcp(WALK, [...good])),
        show(byDefinition(WALK, good)),
      ],
      [
        `칸 ${at} · ${at + 1}${을를(at + 1)} 맞바꾼 sa`,
        show(bad),
        show(a),
        show(b),
      ],
    ];
    const k = a.findIndex((v, t) => v !== b[t]);
    return block(
      md(
        [
          "넣은 배열",
          "sa",
          "길이 이어받기가 낸 답",
          "이웃한 칸을 직접 비교한 답",
        ],
        rows,
      ),
      `맞바꾼 배열에서는 lcp[${k}] 의 값이 ${a[k]}${과와(a[k] as number)} ${b[k]}${으로(b[k] as number)} 갈립니다. 이어받은 길이가 진짜 길이보다 컸기 때문입니다.`,
    );
  },

  "build-drop": () => {
    const inputs: [string, string][] = [
      [label(WALK), WALK],
      [quote("mississippi"), "mississippi"],
      ["전부 같은 글자 n = 1,000", "a".repeat(1_000)],
      ["무작위 두 글자 n = 1,000", makeText(1_000, 2)],
    ];
    const drops: [string, number][] = [
      ["0", 0],
      ["1", 1],
      ["2", 2],
      ["3", 3],
      ["전부", Number.POSITIVE_INFINITY],
    ];
    const rows: string[][] = [];
    for (const [name, s] of inputs) {
      const sa = saOf(s);
      const want = show(byDefinition(s, sa));
      for (const [d, drop] of drops) {
        const c = countKasai(s, sa, drop);
        rows.push([
          name,
          d,
          show(c.lcp) === want ? "예" : "아니오",
          num(c.access),
        ]);
      }
    }
    const a = "a".repeat(1_000);
    const one = countKasai(a, saOf(a), 1).access;
    const two = countKasai(a, saOf(a), 2).access;
    const all = countKasai(a, saOf(a), Number.POSITIVE_INFINITY).access;
    return block(
      md(
        ["입력", "적은 뒤 빼는 양", "정의대로 잰 답과의 일치", "자료 접근"],
        rows,
        [1, 3],
      ),
      `전부 같은 글자 1,000 개에서 1 을 빼면 ${num(one)} 번, 2 를 빼면 ${num(two)} 번, 자리마다 0 에서 다시 세면 ${num(all)} 번입니다.`,
    );
  },

  /* ── 수행으로 알아보는 알고리즘 ── */

  "walk-input": () =>
    [
      `const s = "${WALK}";`,
      `const sa = ${show(saOf(WALK))};`,
      `// 이 절이 끝나면 ${show(kasaiLcp(WALK, [...saOf(WALK)]))}${이가(show(kasaiLcp(WALK, [...saOf(WALK)])))} 나와야 한다`,
    ].join("\n"),

  "walk-inv": () => {
    const r = walk();
    const ok = r.sa.every((p, k) => r.inv[p] === k);
    return [
      `sa  = ${show(r.sa)}`,
      `rank = ${show(r.inv)}`,
      `rank[sa[k]] = k 가 ${r.sa.length} 칸 모두에서 맞는가  ${ok ? "예" : "아니오"}`,
    ].join("\n");
  },

  "pause-inv-flip": () => {
    const c = contrast("순위 배열을 반대로 채운 답", invFlipped);
    return block(c.table, tally(c));
  },

  "pause-inv-same": () => {
    const rows = CASES.map((s) => {
      const sa = saOf(s);
      const inv = replay(s, sa).inv;
      return [
        label(s),
        show(sa),
        show(inv),
        show(sa) === show(inv) ? "예" : "아니오",
      ];
    });
    const same = CASES.filter((s) => {
      const sa = saOf(s);
      return show(sa) === show(replay(s, sa).inv);
    });
    return block(
      md(["입력", "sa", "rank", "두 배열의 일치"], rows),
      `sa 와 rank 가 글자 그대로 같은 입력은 ${same.map(quote).join(" · ")} 입니다.`,
    );
  },

  "walk-early": () => {
    const r = walk();
    const rows = r.rows
      .slice(0, 3)
      .map((x, t) => [
        `T${t + 2}`,
        String(x.i),
        String(x.rank),
        dash(x.j),
        String(x.kIn),
        x.j === null ? "적지 않는다" : `lcp[${x.rank}] = ${x.h}`,
        x.stop === null
          ? "이웃이 없다"
          : x.stop === "differ"
            ? "글자가 다르다"
            : "접미사가 끝났다",
      ]);
    const cond = r.rows
      .slice(0, 3)
      .map(
        (x) =>
          `rank[${x.i}] === ${r.sa.length - 1}${이가(r.sa.length - 1)} ${x.j === null ? "참" : "거짓"}`,
      )
      .join(" · ");
    return block(
      md(
        [
          "걸음",
          "자리 i",
          "rank[i]",
          "이웃 j",
          "들어올 때 len",
          "적은 칸",
          "멈춘 까닭",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `② 의 조건은 ${cond} 입니다.`,
    );
  },

  "pause-text-order": () => {
    const c = contrast("자리 칸에 적은 답", textOrderWrite);
    return block(c.table, tally(c));
  },

  "pause-identity": () => {
    const rows = CASES.map((s) => {
      const inv = replay(s).inv;
      const id = inv.every((v, i) => v === i);
      return [label(s), show(inv), id ? "예" : "아니오"];
    });
    const ids = CASES.filter((s) => replay(s).inv.every((v, i) => v === i));
    return block(
      md(["입력", "rank", "제자리 순열"], rows),
      `rank 가 모든 자리에서 제자리인 입력은 ${ids.map(quote).join(" · ")} 입니다.`,
    );
  },

  "walk-extend": () => {
    const r = walk();
    const x = r.rows.find((y) => y.eq > 0 && y.stop === "end") as Row;
    const j = x.j as number;
    const rows: string[][] = [];
    for (let t = x.kIn; t <= (x.h as number); t++) {
      const a = WALK[x.i + t];
      const b = WALK[j + t];
      rows.push([
        String(t),
        `s[${x.i + t}] = ${a ?? "없다"}`,
        `s[${j + t}] = ${b ?? "없다"}`,
        a === undefined || b === undefined
          ? `i + len < n 이 ${x.i + t < WALK.length ? "참" : "거짓"}이라 멈춘다`
          : a === b
            ? "같은 글자 — len 을 하나 늘린다"
            : "다른 글자 — 멈춘다",
      ]);
    }
    const suf = WALK.slice(x.i);
    return block(
      md(["len", "자리 i 쪽 글자", "이웃 쪽 글자", "판단"], rows, [0]),
      `비교한 두 접미사는 자리 ${x.i} 의 ${suf}${last(suf, 과와)} 이웃 ${j} 의 ${WALK.slice(j)} 입니다. ⑤ 가 lcp[${x.rank}] = ${x.h}${을를(x.h as number)} 적고, ⑥ 이 len = ${x.kOut}${을를(x.kOut)} 다음 자리로 넘깁니다.`,
    );
  },

  "pause-reset": () => {
    const c = contrast("되돌리기를 뺀 답", noReset);
    return block(c.table, tally(c));
  },

  "pause-reset-why": () => {
    const inputs: [string, string][] = [
      ...CASES.map((s): [string, string] => [label(s), s]),
      ...(
        [
          "전부 같은 글자",
          "무작위 두 글자",
          "무작위 26 글자",
          "여섯 글자가 되풀이된다",
        ] as const
      ).map((name): [string, string] => [
        `${name} n = 1,000`,
        shape(name, 1_000),
      ]),
    ];
    const rows = inputs.map(([name, s]) => {
      const r = replay(s);
      const none = r.rows.filter((x) => x.j === null);
      return [
        name,
        num(s.length),
        String(none.length),
        String(Math.max(...none.map((x) => x.kIn))),
      ];
    });
    const once = inputs.every(
      ([, s]) => replay(s).rows.filter((x) => x.j === null).length === 1,
    );
    const zero = inputs.every(([, s]) =>
      replay(s)
        .rows.filter((x) => x.j === null)
        .every((x) => x.kIn === 0),
    );
    return block(
      md(
        ["입력", "n", "이웃 없는 갈래에 들어간 횟수", "그때 len 의 최댓값"],
        rows,
        [1, 2, 3],
      ),
      `${inputs.length} 입력에서 이웃 없는 갈래에 들어간 횟수가 ${once ? "모두 1 번이고" : "1 번이 아닌 입력이 있고"}, 그때 len 은 ${zero ? "언제나 0 이었습니다" : "0 이 아닌 때가 있었습니다"}.`,
    );
  },

  "walk-trace": () => {
    const r = trace(WALK);
    const steps = walkSteps();
    const rows = steps.map((st) => {
      const x = st.row;
      if (x === null) {
        return [
          st.id,
          "—",
          "—",
          "—",
          "—",
          st.kind === "init" ? "순위 배열을 만든다" : "답을 돌려준다",
          show(st.lcp),
        ];
      }
      const cond =
        x.j === null
          ? `rank[${x.i}] === ${WALK.length - 1} 참`
          : `rank[${x.i}] === ${WALK.length - 1} 거짓 · ${x.eq} 번 늘려 ${x.stop === "differ" ? "글자가 달라" : "접미사가 끝나"} 멈춤`;
      return [
        st.id,
        String(x.i),
        String(x.rank),
        dash(x.j),
        String(x.kIn),
        cond,
        show(st.lcp),
      ];
    });
    const eq = r.rows.reduce((t, x) => t + x.eq, 0);
    const ne = r.rows.reduce((t, x) => t + x.ne, 0);
    return block(
      md(
        [
          "걸음",
          "자리 i",
          "rank[i]",
          "이웃 j",
          "들어올 때 len",
          "조건 판정",
          "lcp",
        ],
        rows,
      ),
      `글자 비교는 같은 글자 ${eq} 번과 다른 글자 ${ne} 번, 모두 ${eq + ne} 번입니다. 답은 ${show(r.lcp)} 입니다.`,
    );
  },

  "walk-branch": () => {
    const count = (s: string) => {
      const r = replay(s);
      const withJ = r.rows.filter((x) => x.j !== null);
      return [
        1,
        r.rows.length - withJ.length,
        withJ.length,
        withJ.reduce((t, x) => t + x.eq, 0),
        withJ.length,
        withJ.filter((x) => (x.h as number) > 0).length,
      ];
    };
    const a = count(WALK);
    const b = count("mississippi");
    const names = [
      "순위 배열을 만든다",
      "이웃이 없어 건너뛴다",
      "이웃의 자리를 얻는다",
      "글자가 같아 len 을 늘린다",
      "순위 칸에 길이를 적는다",
      "len 을 하나 줄여 넘긴다",
    ];
    const marks = ["①", "②", "③", "④", "⑤", "⑥"];
    const rows = names.map((name, t) => [
      marks[t] as string,
      name,
      String(a[t]),
      String(b[t]),
    ]);
    const all = [...a, ...b].every((v) => v >= 1);
    return block(
      md(
        ["갈래", "하는 일", `전개 입력 "${WALK}"`, '"mississippi"'],
        rows,
        [2, 3],
      ),
      all
        ? "여섯 갈래가 두 입력 모두에서 한 번 이상 실행됐습니다."
        : "실행되지 않은 갈래가 있습니다.",
    );
  },

  "walk-adjacent": () => {
    const r = walk();
    const n = WALK.length;
    const rows: string[][] = [];
    let ok = 0;
    for (let k = 0; k + 1 < n; k++) {
      const a = r.sa[k] as number;
      const b = r.sa[k + 1] as number;
      const L = byDefinition(WALK, [a, b])[0] as number;
      if (L === r.lcp[k]) ok++;
      const why =
        a + L >= n || b + L >= n
          ? `${WALK.slice(a + L >= n ? a : b)} 쪽이 먼저 끝난다`
          : `${L + 1} 번째 글자 ${WALK[a + L]} · ${WALK[b + L]}`;
      rows.push([
        `sa[${k}] = ${a} · sa[${k + 1}] = ${b}`,
        `${WALK.slice(a)} · ${WALK.slice(b)}`,
        L === 0 ? "없다" : WALK.slice(a, a + L),
        why,
      ]);
    }
    return block(
      md(["이웃한 두 칸", "두 접미사", "함께 가진 앞부분", "멈춘 자리"], rows),
      `두 접미사를 직접 잘라 잰 길이가 lcp 의 칸과 같은 짝이 ${n - 1} 쌍 중 ${ok} 쌍입니다.`,
    );
  },

  "final-calls": () => {
    const inputs = [WALK, "aaaa", "abab", "abc", "a", "mississippi"];
    const lines = inputs.map((s) => {
      const call = `kasaiLcp("${s}", ${show(saOf(s))})`;
      return [call, show(kasaiLcp(s, [...saOf(s)]))] as const;
    });
    const w = Math.max(...lines.map(([c]) => c.length));
    return [...lines.map(([c, v]) => `${c.padEnd(w)}  ->  ${v}`)].join("\n");
  },

  /* ── 알아 두면 좋은 개념 ── */

  "related-inverse": () => {
    const r = walk();
    const rows = r.sa.map((_, x) => [
      String(x),
      String(r.sa[x]),
      String(r.inv[r.sa[x] as number]),
      String(r.inv[x]),
      String(r.sa[r.inv[x] as number]),
    ]);
    const ok = r.sa.every(
      (_, x) =>
        r.inv[r.sa[x] as number] === x && r.sa[r.inv[x] as number] === x,
    );
    return block(
      md(
        ["x", "sa[x]", "rank[sa[x]]", "rank[x]", "sa[rank[x]]"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      ok
        ? `셋째 열과 다섯째 열이 ${rows.length} 줄 모두 첫째 열과 같습니다.`
        : "셋째 열이나 다섯째 열이 첫째 열과 갈리는 줄이 있습니다.",
    );
  },

  /* ── 수식 정의와 유도 ── */

  "math-check": () => {
    const r = walk();
    const rows = r.rows.map((x, t) => {
      const prev = t > 0 ? (r.rows[t - 1] as Row).h : null;
      const holds =
        x.h === null || prev === null
          ? "—"
          : x.h >= prev - 1
            ? "맞다"
            : "아니다";
      return [String(x.i), dash(x.h), dash(prev), holds, String(x.kIn)];
    });
    return block(
      md(
        ["자리 i", "h(i)", "h(i−1)", "h(i) ≥ h(i−1) − 1", "들어올 때 len"],
        rows,
        [0, 1, 2, 4],
      ),
      `h 를 칸 rank[i] 로 옮겨 적으면 ${show(r.lcp)}${josa(show(r.lcp), "이고", "고")}, 정본이 낸 답은 ${show(kasaiLcp(WALK, [...saOf(WALK)]))} 입니다.`,
    );
  },

  "math-telescope": () => {
    const inputs: [string, string][] = [
      [label(WALK), WALK],
      [quote("mississippi"), "mississippi"],
      ...(
        [
          "전부 같은 글자",
          "두 글자가 번갈아 나온다",
          "피보나치 문자열",
          "무작위 두 글자",
          "무작위 26 글자",
        ] as const
      ).map((name): [string, string] => [
        `${name} n = 1,000`,
        shape(name, 1_000),
      ]),
    ];
    let top = 0;
    let topName = "";
    const rows = inputs.map(([name, s]) => {
      const c = countKasai(s, saOf(s));
      const n = s.length;
      const ratio = (c.eq + c.ne) / (2 * n - 2);
      if (ratio > top) {
        top = ratio;
        topName = name;
      }
      return [
        name,
        num(n),
        num(c.eq),
        num(c.ne),
        num(c.eq + c.ne),
        num(2 * n - 2),
        fix(ratio, 3),
      ];
    });
    return block(
      md(
        [
          "입력",
          "n",
          "같은 글자 (상한 n−1)",
          "다른 글자 (상한 n−1)",
          "합 C",
          "상한 2n−2",
          "C / (2n−2)",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      `${inputs.length} 입력 모두 상한 안이고, 상한에 가장 가까운 것은 ${topName} 의 ${fix(top * 100, 1)} % 입니다.`,
    );
  },

  "math-scale": () => {
    const rows = [1_000, 10_000, LIMIT].map((n) => {
      const kasai = 11 * n - 8;
      const a = "a".repeat(n);
      const pair = pairwiseByLcp(a, saOf(a)).access;
      return [num(n), num(kasai), num(pair), num(Math.round(pair / kasai))];
    });
    return block(
      md(
        [
          "n",
          "길이 이어받기의 상한 11n − 8",
          "짝마다 처음부터 · 전부 같은 글자",
          "몇 배",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `n = ${num(LIMIT)} 에서 길이 이어받기의 자료 접근은 어떤 문자열에서도 ${num(11 * LIMIT - 8)} 번을 넘지 않습니다.`,
    );
  },

  /* ── 불변식 ── */

  "invariant-watch": () => {
    const inputs: [string, string][] = [
      [label(WALK), WALK],
      [quote("aaaa"), "aaaa"],
      [quote("mississippi"), "mississippi"],
      [quote("abracadabra"), "abracadabra"],
      ["피보나치 문자열 n = 500", fibonacciWord(500)],
      ["무작위 두 글자 n = 500", makeText(500, 2)],
    ];
    let allHeld = true;
    const rows = inputs.map(([name, s]) => {
      const r = replay(s);
      const withJ = r.rows.filter((x) => x.j !== null);
      const held = r.rows.every((x) =>
        x.j === null ? x.kIn === 0 : x.kIn <= (x.h as number),
      );
      if (!held) allHeld = false;
      const equal = withJ.filter((x) => x.kIn === x.h).length;
      return [
        name,
        num(s.length),
        num(r.rows.length),
        num(equal),
        held ? "지킨다" : "어긴다",
      ];
    });
    return block(
      md(
        [
          "입력",
          "n",
          "확인한 자리",
          "이어받은 len 이 h(i) 와 같은 자리",
          "문장",
        ],
        rows,
        [1, 2, 3],
      ),
      allHeld
        ? `${inputs.length} 입력의 모든 자리에서 문장이 지켜졌습니다.`
        : "문장이 어긋난 자리가 있습니다.",
    );
  },

  "invariant-edges": () => {
    const inputs: [string, string][] = [
      ["길이 1", "a"],
      ["두 글자가 같다", "aa"],
      ["두 글자가 다르다", "ab"],
      ["뒤가 앞보다 작다", "ba"],
      ["전부 같은 글자", "aaaa"],
      ["전부 다른 글자", "abcd"],
      ["되풀이", "abab"],
      ["앞이 같고 끝만 다르다", "aaab"],
    ];
    const rows = inputs.map(([name, s]) => {
      const sa = saOf(s);
      const c = countKasai(s, sa);
      return [
        name,
        quote(s),
        show(sa),
        show(c.lcp),
        String(c.eq + c.ne),
        num(c.access),
      ];
    });
    const lastZero = inputs.every(
      ([, s]) => kasaiLcp(s, [...saOf(s)]).at(-1) === 0,
    );
    return block(
      md(["경계", "입력", "sa", "답", "글자 비교", "자료 접근"], rows, [4, 5]),
      lastZero
        ? `마지막 칸은 ${inputs.length} 경계 모두에서 0 입니다.`
        : "마지막 칸이 0 이 아닌 경계가 있습니다.",
    );
  },

  "mutant-no-decrement": () => {
    const c = contrast("하나 줄이기를 뺀 답", noDecrement);
    return block(c.table, tally(c));
  },

  "mutant-no-decrement-where": () => {
    const good = walk();
    const bad = replay(WALK, saOf(WALK), 0);
    const t = bad.rows.findIndex(
      (x, at) => x.h !== null && x.h !== good.rows[at]?.h,
    );
    const g = good.rows[t] as Row;
    const b = bad.rows[t] as Row;
    const rows = [
      ["정본", String(g.kIn), String(g.eq + g.ne), String(g.h)],
      ["하나 줄이기를 뺀 판", String(b.kIn), String(b.eq + b.ne), String(b.h)],
    ];
    const suf = WALK.slice(g.i);
    const nb = WALK.slice(g.j as number);
    return block(
      md(
        [
          "판",
          `자리 ${g.i} 에 들어올 때 len`,
          "그 자리의 글자 비교",
          "적은 값",
        ],
        rows,
        [1, 2, 3],
      ),
      `자리 ${g.i} 의 접미사 ${suf}${last(suf, 과와)} 이웃 ${nb}${last(nb, 은는)} 앞 ${g.h} 글자를 함께 가집니다. 뺀 판은 i + len = ${b.i + b.kIn}${이가(b.i + b.kIn)} 이미 n = ${WALK.length} 이상이라 비교를 한 번도 안 하고 ${b.h}${을를(b.h as number)} 적었습니다.`,
    );
  },

  /* ── 비용 계산 ── */

  "perf-count": () => {
    const steps = walkSteps();
    const n = WALK.length;
    const rows = steps
      .filter((st) => st.kind !== "done")
      .map((st) => {
        const x = st.row;
        if (x === null) return [st.id, "—", num(2 * n), "0", num(2 * n)];
        const cells = x.j === null ? 1 : 5;
        const cmp = x.eq + x.ne;
        return [
          st.id,
          String(x.i),
          String(cells),
          String(cmp),
          num(cells + 2 * cmp),
        ];
      });
    const total = countKasai(WALK, saOf(WALK)).access;
    const cmp = replay(WALK).rows.reduce((t, x) => t + x.eq + x.ne, 0);
    return block(
      md(
        ["걸음", "자리 i", "배열 칸", "글자 비교", "자료 접근"],
        rows,
        [1, 2, 3, 4],
      ),
      `합은 ${num(total)} 번입니다. 순위 배열에 ${2 * n} 번, 자리 ${n} 개의 배열 칸에 ${5 * (n - 1) + 1} 번이 들었고, 글자 비교 ${cmp} 번이 글자 ${2 * cmp} 개를 읽었습니다.`,
    );
  },

  "perf-shapes": () => {
    const n = 10_000;
    let low = Number.POSITIVE_INFINITY;
    let lowName = "";
    const rows = SHAPES.map(([name, make]) => {
      const s = make(n);
      const c = countKasai(s, saOf(s));
      if (c.access < low) {
        low = c.access;
        lowName = name;
      }
      return [name, num(c.eq), num(c.ne), num(c.access), fix(c.access / n, 3)];
    });
    return block(
      md(
        [
          "입력 모양 (n = 10,000)",
          "같은 글자",
          "다른 글자",
          "자료 접근",
          "자료 접근 / n",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `배열 칸 접근은 모양과 상관없이 7n − 4 = ${num(7 * n - 4)} 번이고, 모양이 바꾸는 것은 글자 비교뿐입니다. 가장 적은 모양은 「${lowName}」 의 ${num(low)} 번이고, ${low === 9 * n - 6 ? "아래 한계 9n − 6 과 같습니다" : `아래 한계 9n − 6 = ${num(9 * n - 6)} 보다 많습니다`}.`,
    );
  },

  "worst-shape": () => {
    const n = LIMIT;
    let best = -1;
    let bestName = "";
    const rows = SHAPES.map(([name, make]) => {
      const s = make(n);
      const c = countKasai(s, saOf(s));
      if (c.access > best) {
        best = c.access;
        bestName = name;
      }
      return [name, num(c.eq), num(c.ne), num(c.access), fix(c.access / n, 3)];
    });
    return block(
      md(
        [
          "입력 모양 (n = 100,000)",
          "같은 글자",
          "다른 글자",
          "자료 접근",
          "자료 접근 / n",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `자료 접근이 가장 많은 모양은 「${bestName}」 이고 ${num(best)} 번입니다. 상한 11n − 8 = ${num(11 * n - 8)} 보다 ${num(11 * n - 8 - best)} 적습니다.`,
    );
  },

  "worst-search": () => {
    const rows: string[][] = [];
    let over = 0;
    for (let n = 8; n <= 14; n++) {
      let best = -1;
      let winners: string[] = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        let s = "";
        for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
        const c = countKasai(s, saOf(s));
        const cmp = c.eq + c.ne;
        if (cmp > 2 * n - 2) over++;
        if (cmp > best) {
          best = cmp;
          winners = [s];
        } else if (cmp === best) winners.push(s);
      }
      rows.push([
        String(n),
        num(1 << n),
        String(best),
        String(2 * n - 2),
        String(2 * n - 2 - best),
        winners.map(quote).join(" · "),
      ]);
    }
    return block(
      md(
        [
          "n",
          "실행한 문자열",
          "글자 비교의 최댓값",
          "상한 2n−2",
          "차이",
          "그 값을 낸 문자열 전부",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `두 글자 알파벳의 길이 8 부터 14 까지 전수에서 글자 비교가 상한 2n−2 를 넘은 문자열은 ${over} 개입니다.`,
    );
  },

  "worst-growth": () => {
    const ns = [1_250, 5_000, 20_000, 80_000];
    const vals = ns.map((n) => {
      const s = shape("앞이 다 같고 끝만 다르다", n);
      return countKasai(s, saOf(s)).access;
    });
    const rows = ns.map((n, t) => [
      num(n),
      num(vals[t] as number),
      fix((vals[t] as number) / n, 3),
    ]);
    const ratios = vals
      .slice(1)
      .map((v, t) => fix(v / (vals[t] as number), 3))
      .join(" · ");
    return block(
      md(["n", "자료 접근", "자료 접근 / n"], rows, [0, 1, 2]),
      `「앞이 다 같고 끝만 다르다」 에서 n 을 4 배씩 늘렸을 때 자료 접근의 비는 ${ratios} 입니다.`,
    );
  },

  /* ── 스스로 점검하기 ── */

  "check-carry-saves": () => {
    const r = walk();
    const carried = r.rows.filter((x) => x.j !== null && x.kIn > 0);
    const rows = carried.map((x) => [
      String(x.i),
      WALK.slice(x.i),
      WALK.slice(x.j as number),
      String(x.kIn),
      String(x.eq + x.ne),
      String(x.kIn + x.eq + x.ne),
    ]);
    const saved = carried.reduce((t, x) => t + x.kIn, 0);
    const a = countKasai(WALK, saOf(WALK));
    const b = countKasai(WALK, saOf(WALK), Number.POSITIVE_INFINITY);
    return block(
      md(
        [
          "자리 i",
          "접미사",
          "이웃의 접미사",
          "이어받은 len",
          "이어받을 때 글자 비교",
          "0 부터 셀 때 글자 비교",
        ],
        rows,
        [0, 3, 4, 5],
      ),
      `이어받으면 글자 비교가 ${a.eq + a.ne} 번이고, 자리마다 0 부터 세면 ${b.eq + b.ne} 번입니다. 늘어난 ${saved} 번이 이어받은 len 의 합과 같습니다.`,
    );
  },
};
