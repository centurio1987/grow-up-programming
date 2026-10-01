/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바퀴마다의 상태는 그림 사이드카의 `trace`(정본 계측과 대조한 기록)에서 받고, 셈은 그림 사이드카의
 * 계수기에서 받는다 — 그림과 표가 같은 기록을 쓴다. 판정 줄(「같다」·「어긋난다」)이 있는 블록은
 * 중화 실행에서도 값이 나오도록 `trace` 대신 `replay` 를 쓴다(그림 사이드카 머리 주석).
 *
 *   bun run tools/check-proof.ts src/algorithms/string/suffixArray/suffixArray-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  compareByChars,
  countedDoubling,
  countedNaive,
  generalized,
  LIMIT,
  levelName,
  makeText,
  num,
  originCounts,
  PLUS_ONE_N,
  piece,
  type Round,
  replay,
  show,
  trace,
  WALK,
  walkRun,
  walkSteps,
} from "./suffixArray-guide.fig.tsx";
import { suffixArray } from "./suffixArray-guide.ref.ts";

const REF = new URL("./suffixArray-guide.ref.ts", import.meta.url).pathname;

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

/** 소수 자리를 정해 적는다. */
const fix = (x: number, d: number): string => x.toFixed(d);

/** 백분율 — 둘째 값이 첫째 값보다 몇 % 많은가. */
const pct = (base: number, more: number): string =>
  fix((more / base - 1) * 100, 1);

/** 자리 번호로 무리를 묶는다 — 같은 값을 받은 자리끼리. */
function groupsOf(values: readonly number[]): [number, number[]][] {
  const groups = new Map<number, number[]>();
  values.forEach((v, i) => {
    groups.set(v, [...(groups.get(v) ?? []), i]);
  });
  return [...groups.entries()].sort((a, b) => a[0] - b[0]);
}

const braces = (groups: [number, number[]][]): string =>
  groups.map(([, g]) => `{${g.join(",")}}`).join(" ");

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  suffixArray(s: string): number[];
}

/** 범위를 넘은 뒤 조각을 **가장 큰 값**으로 두는 사본. */
const outOfRangeLargest = await loadMutant<Impl>(REF, {
  swap: [
    /i \+ gap < n \? \(rank\[i \+ gap\] as number\) \+ 1 : 0;/,
    "i + gap < n ? (rank[i + gap] as number) : span;",
  ],
});

/** 두 계수 정렬의 순서를 뒤바꾼 사본. */
const frontFirst = await loadMutant<Impl>(REF, {
  swap: [
    /for \(const key of \[back, front\]\)/,
    "for (const key of [front, back])",
  ],
});

/** 계수 정렬의 안정성을 없앤 사본 — 뒤에서부터가 아니라 앞에서부터 놓는다. */
const unstable = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let p = order\.length - 1; p >= 0; p--\) \{/,
    "for (let p = 0; p < order.length; p++) {",
  ],
});

/** 새 순위를 **앞 성분만** 보고 매기는 사본. 불변식을 지키던 그 줄이다. */
const frontOnly = await loadMutant<Impl>(REF, {
  swap: [
    /if \(front\(a\) !== front\(b\) \|\| back\(a\) !== back\(b\)\) top\+\+;/,
    "if (front(a) !== front(b)) top++;",
  ],
});

/** 새 순위를 **제자리에서** 덮어쓰는 사본. */
const inPlace = await loadMutant<Impl>(REF, {
  swap: [
    /const next = new Array<number>\(n\)\.fill\(0\);/,
    "const next = rank;",
  ],
});

/* ────────────────────────── 경쟁 설계의 실측 ────────────────────────── */

/**
 * `bench-alt.ts` 가 `.alt.ts` 를 실행해 낸 결정론적 계수. 본문 표의 값과 비율을 여기서 만든다 —
 * 비율을 손으로 나눠 적으면 값이 바뀔 때 비율만 남는다.
 */
const BENCH = (await Bun.file(
  new URL("./suffixArray-guide.bench.json", import.meta.url),
).json()) as Record<string, number>;

const bench = (design: string, metric: string): number => {
  const v = BENCH[`${design} · ${metric}`];
  if (v === undefined)
    throw new Error(`bench 에 없는 키 — ${design} · ${metric}`);
  return v;
};

const DOUBLING = "배가 기법";
const SKEW = "갈라 정렬";

/* ────────────────────────── 사례 목록 ────────────────────────── */

/** 갈리는 자리를 넓게 덮는 목록. 전개 입력을 맨 앞에 둔다. */
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

const quote = (s: string): string =>
  s === WALK ? `전개 입력 "${s}"` : `"${s}"`;

/**
 * 변이 하나를 사례 목록에 걸어 정본과 나란히 놓는다. 변이가 어느 입력에서도 답을 못 바꾸면 「어긋난다」가
 * 거짓이라 던지는데, **중화 실행에서는 건너뛴다** — 중화하면 변이 모듈의 함수가 정본 그 자체다.
 */
function contrast(
  mutant: Impl,
  head: string,
): { table: string; broken: number; kept: string[] } {
  const rows: string[][] = [];
  let broken = 0;
  const kept: string[] = [];
  for (const s of CASES) {
    const want = suffixArray(s);
    const got = mutant.suffixArray(s);
    const same = want.join(",") === got.join(",");
    if (!same) broken++;
    else kept.push(`"${s}"`);
    rows.push([quote(s), show(want), show(got), same ? "같다" : "어긋난다"]);
  }
  if (broken === 0 && mutant.suffixArray !== suffixArray) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「어긋난다」가 거짓이다",
    );
  }
  return {
    table: md(["입력", "정본이 낸 답", head, "판정"], rows),
    broken,
    kept,
  };
}

/** 사례 목록 중 몇 입력에서 어긋났는지 적는 문장. */
function tally(c: { broken: number; kept: string[] }): string {
  return c.kept.length === 0
    ? `${CASES.length} 입력 모두에서 답이 어긋났습니다.`
    : `${CASES.length} 입력 중 ${c.broken} 입력에서 답이 어긋났고, ${c.kept.join(" · ")} 에서는 같았습니다.`;
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /* ── 전체 컨셉 ── */

  "concept-banana": () => {
    const sa = suffixArray(WALK);
    const rows = sa.map((i, k) => [
      String(k),
      String(i),
      WALK.slice(i),
      String(WALK.length - i),
    ]);
    return block(
      md(
        ["사전순 자리 k", "sa[k]", "접미사 s[sa[k]..]", "길이"],
        rows,
        [0, 1, 3],
      ),
      `셋째 열을 위에서 아래로 읽으면 사전순이고, 둘째 열을 모은 ${show(sa)}${이가(show(sa))} 접미사 배열입니다.`,
    );
  },

  "concept-cost": () => {
    const c = originCounts();
    const w = countedDoubling(WALK);
    const rows = [
      [`"${WALK}"`, num(WALK.length), String(w.rounds), num(w.access)],
      [
        "무작위 26 글자",
        num(LIMIT),
        String(c.doubleRandom.rounds),
        num(c.doubleRandom.access),
      ],
      [
        "전부 같은 글자",
        num(LIMIT),
        String(c.doubleAllSame.rounds),
        num(c.doubleAllSame.access),
      ],
    ];
    return block(
      md(["입력", "n", "바퀴 수", "자료 접근"], rows, [1, 2, 3]),
      `무작위 26 글자는 mulberry32(씨앗 0x9e3779b9)로 만든 문자열입니다. 바퀴 수가 가장 많은 것은 전부 같은 글자의 ${c.doubleAllSame.rounds} 바퀴입니다.`,
    );
  },

  /* ── 아이디어를 떠올리는 과정 ── */

  "origin-slice-cost": () => {
    const rows = [WALK.length, 1000, LIMIT].map((n) => {
      const chars = (n * (n + 1)) / 2;
      const mb = chars / 1024 / 1024;
      return [
        num(n),
        num(chars),
        mb < 1 ? `${num(chars)} 바이트` : `${num(Math.round(mb))} MB`,
      ];
    });
    const c = originCounts();
    return block(
      md(
        ["n", "잘라 낸 글자 수 n(n+1)/2", "글자 하나를 1 바이트로 잡은 메모리"],
        rows,
        [0, 1, 2],
      ),
      `n = ${num(LIMIT)} 에서 ${num(c.sliceMb)} MB 이고, 예산 256 MB 의 ${fix(c.sliceMb / 256, 1)} 배입니다.`,
    );
  },

  "origin-two-ways": () => {
    const rows = [12, 120, 1200, 12000].map((n) => {
      const same = "a".repeat(n);
      const rnd = makeText(n, 26);
      return [
        num(n),
        num(countedNaive(same).access),
        num(countedDoubling(same).access),
        num(countedNaive(rnd).access),
        num(countedDoubling(rnd).access),
      ];
    });
    const c = originCounts();
    const ratio = c.naiveAllSame / c.doubleAllSame.access;
    return block(
      md(
        [
          "n",
          "글자 비교 정렬 · 전부 a",
          "배가 기법 · 전부 a",
          "글자 비교 정렬 · 무작위",
          "배가 기법 · 무작위",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `전부 같은 글자 n = ${num(LIMIT)} 에서는 글자 비교 정렬이 ${num(c.naiveAllSame)} 번, 배가 기법이 ${num(c.doubleAllSame.access)} 번으로 ${num(Math.round(ratio))} 배 차이입니다.`,
    );
  },

  "origin-one-compare": () => {
    const s = "a".repeat(10);
    const byChars = compareByChars(s, 0, 1);
    // 순위 쌍으로 비교하면 두 자리에서 앞 성분 · 뒤 성분을 하나씩, 모두 네 칸을 읽는다.
    const round = trace(s).rounds.at(-1) as Round;
    const g = round.gap;
    const cells = [0, g, 1, 1 + g].filter((i) => i < s.length);
    return block(
      md(
        ["방법", "s[0..] 과 s[1..] 을 비교하며 읽는 것", "자료 접근"],
        [
          [
            "글자 비교",
            `두 접미사의 글자 ${byChars.cost / 2} 쌍`,
            String(byChars.cost),
          ],
          [
            `순위 쌍 (gap = ${g})`,
            cells.map((i) => `rank[${i}]`).join(" · "),
            String(cells.length),
          ],
        ],
        [2],
      ),
      `s 는 a 열 개입니다. 글자 비교는 짧은 쪽이 끝날 때까지 ${byChars.cost / 2} 쌍을 다 읽고, 순위 쌍은 gap 이 얼마든 ${cells.length} 칸을 읽습니다.`,
    );
  },

  "origin-first-char": () => {
    const groups = new Map<string, number[]>();
    [...WALK].forEach((c, i) => {
      groups.set(c, [...(groups.get(c) ?? []), i]);
    });
    const rows = [...groups.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([c, at]) => [
        c,
        String(c.charCodeAt(0)),
        at.join(" · "),
        `${at.length} 개`,
      ]);
    const left = originCounts().firstLeft;
    return block(
      md(["첫 글자", "순위(글자 코드)", "자리", "무리 크기"], rows, [1, 3]),
      `${WALK.length} 자리 중 ${left} 자리가 둘 이상인 무리에 남아, 첫 글자의 순위만으로는 순서가 정해지지 않습니다.`,
    );
  },

  "origin-reuse": () => {
    const round = walkRun().rounds[0] as Round;
    const n = WALK.length;
    const rows = Array.from({ length: n }, (_, i) => [
      String(i),
      piece(WALK, i, 2),
      String(round.rank[i]),
      i + 1 < n
        ? `rank[${i + 1}] + 1 = ${round.backs[i]}`
        : `${round.backs[i]} (자리 ${i + 1}${이가(i + 1)} 없다)`,
      `(${round.rank[i]}, ${round.backs[i]})`,
    ]);
    const byPair = [...Array(n).keys()].sort((a, b) => {
      const d = (round.rank[a] as number) - (round.rank[b] as number);
      return d !== 0
        ? d
        : (round.backs[a] as number) - (round.backs[b] as number);
    });
    const byText = [...Array(n).keys()].sort((a, b) => {
      const x = piece(WALK, a, 2);
      const y = piece(WALK, b, 2);
      return x < y ? -1 : x > y ? 1 : a - b;
    });
    const agree = byPair.join() === byText.join();
    return block(
      md(["i", "s[i..i+1]", "앞 성분 rank[i]", "뒤 성분", "쌍"], rows, [0, 2]),
      `쌍을 사전식으로 늘어놓은 순서는 ${show(byPair)}${josa(show(byPair), "이고", "고")}, 두 글자를 잘라 문자열로 비교한 순서는 ${show(byText)} 입니다. 두 순서가 ${agree ? "같습니다" : "다릅니다"}.`,
    );
  },

  "origin-plus-one": () => {
    const c = originCounts();
    return block(
      md(
        ["늘리는 방법", "바퀴 수", "자료 접근"],
        [
          ["한 글자씩", num(c.plusOne.rounds), num(c.plusOne.access)],
          ["두 배씩", num(c.plusOneDouble.rounds), num(c.plusOneDouble.access)],
        ],
        [1, 2],
      ),
      `a 가 ${num(PLUS_ONE_N)} 개인 문자열에서 한 글자씩 늘리면 바퀴가 n − 1 = ${num(PLUS_ONE_N - 1)} 번이고, 자료 접근이 두 배씩의 ${fix(c.plusOne.access / c.plusOneDouble.access, 1)} 배입니다.`,
    );
  },

  /* ── 아이디어 상세 — 먼저 알아 둘 개념 ── */

  "build-read-one": () => {
    const round = walkRun().rounds[0] as Round;
    const i = 3;
    const p = piece(WALK, i, 2);
    const kinds = [
      ...new Set(
        Array.from({ length: WALK.length }, (_, j) => piece(WALK, j, 2)),
      ),
    ].sort();
    const at = kinds.indexOf(p);
    return [
      `${levelName(1)}[${i}] = ${round.next[i]}`,
      `  가리키는 조각   s[${i}..${i + 1}] = ${p}`,
      `  조각의 종류     ${kinds.join(" < ")}`,
      `  읽는 법         ${p} 보다 앞인 종류가 ${kinds.slice(0, at).join(" · ")}${으로(kinds.slice(0, at).join(" · "))} ${at} 개다`,
    ].join("\n");
  },

  "build-refine": () => {
    const r = walkRun();
    const levels: (readonly number[])[] = [
      r.rank0,
      ...r.rounds.map((x) => x.next),
    ];
    const rows = levels.map((rank, k) => {
      const g = groupsOf(rank);
      return [levelName(k), String(g.length), braces(g)];
    });
    // 한 번 갈린 두 자리가 위층에서 다시 같은 순위가 되는 일이 없는지 본다.
    let merged = 0;
    for (let k = 1; k < levels.length; k++) {
      const a = levels[k - 1] as readonly number[];
      const b = levels[k] as readonly number[];
      for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a.length; j++) {
          if (a[i] !== a[j] && b[i] === b[j]) merged++;
        }
      }
    }
    return block(
      md(["층", "무리 수", "같은 순위끼리 묶은 자리"], rows, [1]),
      `아래층에서 순위가 달랐던 두 자리가 위층에서 같은 순위가 된 경우는 ${merged} 번입니다.`,
    );
  },

  "build-inverse": () => {
    const sa = suffixArray(WALK);
    const inv = new Array<number>(WALK.length).fill(0);
    sa.forEach((i, k) => {
      inv[i] = k;
    });
    const two = (walkRun().rounds[0] as Round).next;
    const rows = Array.from({ length: WALK.length }, (_, i) => [
      String(i),
      piece(WALK, i, 2),
      String(two[i]),
      String(inv[i]),
    ]);
    const differ = rows.filter((row) => row[2] !== row[3]).length;
    return block(
      md(
        [
          "자리 i",
          "s[i..i+1]",
          `${levelName(1)}의 칸 i`,
          "접미사 배열에서의 자리 k",
        ],
        rows,
        [0, 2, 3],
      ),
      `${WALK.length} 자리 중 ${differ} 자리에서 두 값이 다릅니다. ${levelName(1)}에는 서로 다른 값이 ${new Set(two).size} 개뿐이라 같은 값이 겹쳐 나옵니다.`,
    );
  },

  /* ── 아이디어 상세 — 단계 ── */

  "build-codes": () => {
    const letters = [...new Set(WALK)].sort();
    const rows = letters.map((c, d) => [c, String(c.charCodeAt(0)), String(d)]);
    return block(
      md(["글자", "글자 코드", "0 부터 매긴 순위"], rows, [1, 2]),
      `두 열의 값은 다르지만 글자 ${letters.join(" < ")} 의 대소 순서를 똑같이 담습니다.`,
    );
  },

  "build-pairs": () => {
    const round = walkRun().rounds[1] as Round;
    const n = WALK.length;
    const g = round.gap;
    const rows = Array.from({ length: n }, (_, i) => [
      String(i),
      piece(WALK, i, 2 * g),
      String(round.rank[i]),
      i + g < n
        ? `rank[${i + g}] + 1 = ${round.backs[i]}`
        : `${round.backs[i]} (자리 ${i + g}${이가(i + g)} 없다)`,
      `(${round.rank[i]}, ${round.backs[i]})`,
    ]);
    const out = rows.filter((_, i) => i + g >= n).length;
    return block(
      md(
        ["i", `s[i..i+${2 * g - 1}]`, "앞 성분 rank[i]", "뒤 성분", "쌍"],
        rows,
        [0, 2],
      ),
      `gap = ${g} 에서 뒤 조각이 문자열 끝을 넘는 자리는 ${out} 곳이고, 그 자리의 뒤 성분은 0 입니다.`,
    );
  },

  "build-stable": () => {
    const round = walkRun().rounds[0] as Round;
    const front = (i: number) => round.rank[i] as number;
    const key = front(round.saFront[0] as number);
    const pick = (order: readonly number[]) =>
      order.filter((i) => front(i) === key);
    const rows = [
      ["뒤 성분으로 정렬한 sa", ...round.saBack.map(String)],
      ["그 자리의 앞 성분", ...round.saBack.map((i) => String(front(i)))],
      ["앞 성분으로 정렬한 sa", ...round.saFront.map(String)],
    ];
    const a = pick(round.saBack);
    const b = pick(round.saFront);
    return block(
      md(["사전순 자리 k", ...round.saBack.map((_, k) => String(k))], rows),
      `앞 성분이 ${key} 인 자리는 첫 줄에서 ${a.join(" · ")} 순서였고 셋째 줄에서도 ${b.join(" · ")} 순서입니다.`,
    );
  },

  "build-rerank": () => {
    const round = replay(WALK).rounds[0] as Round;
    const rows = round.judges.map((j) => [
      String(j.j),
      String(j.a),
      String(j.b),
      `(${j.pa.join(", ")})`,
      `(${j.pb.join(", ")})`,
      j.up ? "다르다" : "같다",
      String(j.top),
    ]);
    return block(
      md(
        ["j", "a = sa[j−1]", "b = sa[j]", "a 의 쌍", "b 의 쌍", "두 쌍", "top"],
        rows,
        [0, 1, 2, 6],
      ),
      `마지막 top 이 ${round.spanOut - 1}${josa(round.spanOut - 1, "이라", "라")} span = ${round.spanOut}${josa(round.spanOut, "이고", "고")}, 자리 순서로 모은 새 순위 배열은 ${show(round.next)} 입니다.`,
    );
  },

  "build-stop": () => {
    const r = walkRun();
    const n = WALK.length;
    const rows = r.rounds.map((x) => [
      String(x.n),
      String(x.gap),
      String(2 * x.gap),
      String(x.spanOut),
      String(n),
      x.spanOut === n ? "참 — 멈춘다" : "거짓 — gap 을 두 배로",
    ]);
    return block(
      md(
        ["바퀴", "gap", "가른 조각 길이", "끝난 뒤 span", "n", "span === n"],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `바퀴 ${r.rounds.length} 번으로 끝났고, 답은 ${show(r.sa)} 입니다.`,
    );
  },

  "build-premise-ascii": () => {
    const inputs = ["aé", "caféa", "abcΩ", "가나"];
    const rows = inputs.map((s) => {
      const got = suffixArray(s);
      const want = [...Array(s.length).keys()].sort((a, b) =>
        s.slice(a) < s.slice(b) ? -1 : 1,
      );
      const perm = new Set(got).size === s.length;
      const codes = [...s].map((c) => c.charCodeAt(0));
      return [
        `"${s}"`,
        num(Math.max(...codes)),
        show(got),
        show(want),
        perm ? "순열이다" : "순열이 아니다",
      ];
    });
    const broken = rows.filter((r) => r[4] === "순열이 아니다").length;
    return block(
      md(
        ["입력", "가장 큰 글자 코드", "정본이 낸 답", "바른 답", "답의 모양"],
        rows,
        [1],
      ),
      `${rows.length} 벌 모두 예외 없이 끝났고, 그중 ${broken} 벌은 같은 자리 번호가 두 번 이상 나오는 배열을 돌려줬습니다.`,
    );
  },

  "build-growth": () => {
    const text = "a".repeat(LIMIT);
    const grow = [2, 3, 4, 8, 16].map((m) => ({ m, ...generalized(text, m) }));
    const best = grow.reduce((a, b) => (a.access <= b.access ? a : b));
    const two = grow.find((g) => g.m === 2) as (typeof grow)[number];
    const rows = grow.map((g) => [
      `x${g.m}`,
      String(g.rounds),
      num(g.access),
      g.m === best.m ? "가장 적다" : `${fix(g.access / best.access, 3)} 배`,
    ]);
    return block(
      md(["배수", "바퀴 수", "자료 접근", "가장 적은 것과의 비"], rows, [1, 2]),
      `전부 같은 글자 ${num(LIMIT)} 개에서 가장 적은 것은 x${best.m}${josa(best.m, "이고", "고")}, x2 는 그보다 ${pct(best.access, two.access)} % 많습니다.`,
    );
  },

  /* ── 수행으로 알아보는 알고리즘 ── */

  "walk-input": () =>
    [
      `const s = "${WALK}";`,
      `// 이 절이 끝나면 ${show(suffixArray(WALK))}${이가(show(suffixArray(WALK)))} 나와야 한다`,
    ].join("\n"),

  "walk-init": () => {
    const s0 = walkSteps()[0];
    return [
      `rank = ${show(walkRun().rank0)}   s 의 글자 코드 그대로`,
      `sa   = ${show(s0?.sa ?? [])}   아직 정렬 전이라 자리 번호 그대로`,
      `span = ${s0?.span}`,
    ].join("\n");
  },

  "walk-pair": () => {
    const round = walkRun().rounds[0] as Round;
    const n = WALK.length;
    const out = round.backs.map((_, i) => i).filter((i) => i + round.gap >= n);
    return [
      `gap = ${round.gap}`,
      `front(i) = rank[i]                 ${show(round.rank)}`,
      `back(i)  = rank[i+${round.gap}] + 1 또는 0     ${show(round.backs)}`,
      `자리 ${out.join(" · ")}${은는(out.join(" · "))} i + ${round.gap} = ${out.map((i) => i + round.gap).join(" · ")}${이가(out.map((i) => i + round.gap).join(" · "))} n = ${n} 보다 작지 않아 0 이다`,
    ].join("\n");
  },

  "pause-sentinel": () => {
    const c = contrast(outOfRangeLargest, "범위 밖을 가장 큰 값으로 둔 답");
    return block(c.table, tally(c));
  },

  "walk-sort": () => {
    const round = walkRun().rounds[0] as Round;
    return [
      `뒤 성분으로 정렬한 뒤    sa = ${show(round.saBack)}`,
      `앞 성분으로 정렬한 뒤    sa = ${show(round.saFront)}`,
    ].join("\n");
  },

  "pause-order": () => {
    const a = contrast(frontFirst, "앞 성분을 먼저 정렬한 답");
    const b = contrast(unstable, "안정성을 없앤 답");
    return block(
      a.table,
      `앞 성분을 먼저 정렬하면 ${tally(a)}`,
      b.table,
      `안정성을 없애면 ${tally(b)}`,
    );
  },

  "walk-rerank": () => {
    const round = walkRun().rounds[0] as Round;
    const n = WALK.length;
    return [
      `next = ${show(round.next)}   자리 순서로 담은 새 순위`,
      `span = top + 1 = ${round.spanOut - 1} + 1 = ${round.spanOut}`,
      `span === n  →  ${round.spanOut} === ${n}${이가(n)} ${round.spanOut === n ? "참" : "거짓"}`,
    ].join("\n");
  },

  "pause-inplace": () => {
    const c = contrast(inPlace, "제자리에서 덮어쓴 답");
    return block(c.table, tally(c));
  },

  /**
   * 제자리 덮어쓰기가 **어느 걸음에서** 어긋나는가. 손으로 적은 궤적을 싣지 않는다. 정본과 변이의
   * 재부여 루프를 같은 출발 상태에서 나란히 실행해 처음 갈리는 `j` 를 실행이 내게 한다. 중화 실행에서도
   * 값이 나와야 하므로 `replay` 를 쓴다.
   */
  "pause-inplace-trace": () => {
    const n = WALK.length;
    const round = replay(WALK).rounds[0] as Round;
    const sa = round.saFront;
    const gap = round.gap;
    const runOne = (overwrite: boolean) => {
      const rank = [...round.rank];
      const next = overwrite ? rank : new Array<number>(n).fill(0);
      const front = (i: number): number => rank[i] as number;
      const back = (i: number): number =>
        i + gap < n ? (rank[i + gap] as number) + 1 : 0;
      const log: { pa: string; top: number }[] = [];
      let top = 0;
      for (let j = 1; j < n; j++) {
        const a = sa[j - 1] as number;
        const b = sa[j] as number;
        const pa = `(${front(a)}, ${back(a)})`;
        if (front(a) !== front(b) || back(a) !== back(b)) top++;
        next[b] = top;
        log.push({ pa, top });
      }
      return { log, span: top + 1 };
    };
    const good = runOne(false);
    const bad = runOne(true);
    const rows = good.log.map((g, k) => {
      const m = bad.log[k] as (typeof bad.log)[number];
      return [
        String(k + 1),
        String(sa[k]),
        String(sa[k + 1]),
        g.pa,
        m.pa,
        g.pa === m.pa ? "같다" : "다르다",
        `${g.top} / ${m.top}`,
      ];
    });
    const first = good.log.findIndex(
      (g, k) => g.pa !== (bad.log[k] as (typeof bad.log)[number]).pa,
    );
    if (first < 1) {
      throw new Error("변이가 둘째 걸음 뒤에서 다른 값을 읽지 않았다");
    }
    const wrote = sa[first] as number;
    const put = (bad.log[first - 1] as (typeof bad.log)[number]).top;
    return block(
      md(
        [
          "j",
          "a",
          "b",
          "정본이 읽은 a 의 쌍",
          "덮어쓴 쪽이 읽은 a 의 쌍",
          "읽은 쌍",
          "top 정본 / 덮어쓴 쪽",
        ],
        rows,
        [0, 1, 2],
      ),
      `j = ${first + 1} 에서 처음으로 읽은 쌍이 갈립니다. 바로 앞 걸음이 rank[${wrote}] 에 새 순위 ${put}${을를(put)} 써 넣었기 때문입니다. 바퀴가 끝나면 정본은 span = ${good.span}, 덮어쓴 쪽은 span = ${bad.span}${josa(bad.span, "이고", "고")} n = ${n} 입니다.`,
    );
  },

  "pause-inplace-safe": () => {
    // 답이 같게 나온 입력만 고른다. 중화 실행에서는 변이가 정본 그대로라 모든 입력이 남는다.
    const inputs = CASES.filter(
      (s) => suffixArray(s).join() === inPlace.suffixArray(s).join(),
    );
    const rows = inputs.map((s) => {
      const r = replay(s);
      return [
        `"${s}"`,
        String(r.rounds.length),
        String((r.rounds[0] as Round).spanOut),
        String(s.length),
      ];
    });
    const one = rows.every((row) => row[1] === "1");
    return block(
      md(["입력", "바퀴 수", "첫 바퀴 끝의 span", "n"], rows, [1, 2, 3]),
      one
        ? `${rows.length} 입력 모두 첫 바퀴 끝에 span 이 n 과 같아 바퀴가 하나로 끝납니다.`
        : "바퀴가 둘 이상인 입력이 섞여 있습니다.",
    );
  },

  "walk-trace": () => {
    const r = walkRun();
    const n = WALK.length;
    const steps = walkSteps();
    const rows = steps.map((s) => {
      const round = s.round > 0 ? (r.rounds[s.round - 1] as Round) : null;
      const rank =
        round === null
          ? r.rank0
          : s.kind === "rerank"
            ? round.next
            : round.rank;
      const cond =
        s.kind === "pair" && round !== null
          ? `${round.gap} < ${n} 참 · 자리 ${n - round.gap} 부터 i + ${round.gap} < ${n} 거짓`
          : s.kind === "rerank" && round !== null
            ? `${round.spanOut} === ${n} ${round.spanOut === n ? "참" : "거짓"}`
            : "—";
      return [
        s.id,
        s.gap === 0 ? "—" : String(s.gap),
        s.title.replace(/^gap = \d+ · /, ""),
        cond,
        show(s.sa),
        show(rank),
      ];
    });
    return block(
      md(["걸음", "gap", "하는 일", "조건 판정", "sa", "rank (자리 순)"], rows),
      `답은 ${show(r.sa)} 입니다.`,
    );
  },

  "walk-branch": () => {
    const r = walkRun();
    const n = WALK.length;
    const out = r.rounds.reduce(
      (acc, x) => acc + x.backs.filter((_, i) => i + x.gap >= n).length,
      0,
    );
    const kept = r.rounds.reduce(
      (acc, x) => acc + x.judges.filter((j) => !j.up).length,
      0,
    );
    const stop = r.rounds.filter((x) => x.spanOut === n).length;
    const rows = [
      ["①", "첫 순위를 글자 코드로 둔다", "1", "바퀴 전 한 번"],
      ["②", "뒤 조각이 문자열 끝을 넘어 0 이 된다", String(out), "두 바퀴 합"],
      ["③", "계수 정렬 한 번", String(2 * r.rounds.length), "두 바퀴 합"],
      ["④", "쌍이 같아 순위를 안 올린다", String(kept), "두 바퀴 합"],
      ["⑤", "순위가 전부 달라져 멈춘다", String(stop), "둘째 바퀴 끝"],
    ];
    const zero = rows.filter((row) => row[2] === "0").length;
    return block(
      md(["갈래", "하는 일", "실행 횟수", "어디서"], rows, [2]),
      zero === 0
        ? "다섯 갈래가 모두 한 번 이상 실행됐습니다."
        : `실행되지 않은 갈래가 ${zero} 개입니다.`,
    );
  },

  "walk-adjacent": () => {
    const sa = suffixArray(WALK);
    const rows: string[][] = [];
    let ok = 0;
    for (let k = 0; k + 1 < sa.length; k++) {
      const a = WALK.slice(sa[k] as number);
      const b = WALK.slice(sa[k + 1] as number);
      let d = 0;
      while (d < a.length && d < b.length && a[d] === b[d]) d++;
      const why =
        d === a.length
          ? `앞 ${d} 글자가 같고 ${a} 쪽이 먼저 끝난다`
          : `${d + 1} 번째 글자 ${a[d]} < ${b[d]}`;
      if (a < b) ok++;
      rows.push([
        `sa[${k}] = ${sa[k]} · sa[${k + 1}] = ${sa[k + 1]}`,
        `${a} · ${b}`,
        why,
      ]);
    }
    return block(
      md(["이웃한 두 칸", "두 접미사", "사전순을 정한 자리"], rows),
      `이웃한 ${sa.length - 1} 쌍 중 앞 칸의 접미사가 사전순으로 앞인 쌍은 ${ok} 개입니다.`,
    );
  },

  "final-calls": () => {
    const inputs = ["banana", "abab", "aaaa", "abc", "a", "mississippi"];
    const w = Math.max(...inputs.map((s) => s.length)) + 15;
    return inputs
      .map(
        (s) => `${`suffixArray("${s}")`.padEnd(w)}->  ${show(suffixArray(s))}`,
      )
      .join("\n");
  },

  /* ── 알아 두면 좋은 개념 ── */

  "related-refine": () => {
    const r = walkRun();
    const rows = walkSteps()
      .filter((s) => s.kind === "init" || s.kind === "rerank")
      .map((s) => {
        const rank =
          s.kind === "init" ? r.rank0 : (r.rounds[s.round - 1] as Round).next;
        const g = groupsOf(rank);
        return [
          s.id,
          String(s.kind === "init" ? 1 : 2 * s.gap),
          String(g.length),
          braces(g),
        ];
      });
    return block(
      md(["걸음", "가른 조각 길이", "무리 수", "무리"], rows, [1, 2]),
      `무리 수가 ${rows.map((row) => row[2]).join(" → ")}${으로(rows.at(-1)?.[2] ?? "")} 늘기만 하고, 마지막 무리 수가 n = ${WALK.length}${과와(WALK.length)} 같습니다.`,
    );
  },

  /* ── 경쟁 설계와의 대조 ── */

  "alt-boundary": () => {
    const rows = [1039, 1040].map((n) => {
      const str = makeText(n, 26);
      const seen = new Map<string, number>();
      let pairs = 0;
      for (let i = 0; i < n; i++) {
        const b = str.slice(i, i + 4);
        const c = seen.get(b) ?? 0;
        pairs += c;
        seen.set(b, c + 1);
      }
      const sa = suffixArray(str);
      let lcp = 0;
      for (let k = 0; k + 1 < n; k++) {
        const a = sa[k] as number;
        const b = sa[k + 1] as number;
        let d = 0;
        while (a + d < n && b + d < n && str[a + d] === str[b + d]) d++;
        lcp = Math.max(lcp, d);
      }
      return [
        num(n),
        String(pairs),
        String(lcp),
        String(countedDoubling(str).rounds),
      ];
    });
    return block(
      md(
        [
          "n",
          "길이 4 조각이 같은 자리 짝",
          "가장 긴 공통 앞부분",
          "배가 기법 바퀴 수",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      `n = ${rows[1]?.[0]} 에서 길이 4 조각이 같은 짝이 처음 생기고, 바퀴가 ${rows[0]?.[3]} 번에서 ${rows[1]?.[3]} 번으로 늡니다.`,
    );
  },

  "alt-bench": () => {
    const inputs: [string, string][] = [
      ["무작위 26 글자 n = 90", "n=90 자료 접근"],
      ["무작위 26 글자 n = 91", "n=91 자료 접근"],
      ["무작위 26 글자 n = 1,039", "n=1,039 자료 접근"],
      ["무작위 26 글자 n = 1,040", "n=1,040 자료 접근"],
      ["무작위 26 글자 n = 100,000", "n=100,000 무작위 자료 접근"],
      ["전부 같은 글자 n = 100,000", "n=100,000 전부 같은 글자 자료 접근"],
    ];
    const rows = inputs.map(([name, key]) => {
      const a = bench(DOUBLING, key);
      const b = bench(SKEW, key);
      const fewer = a < b ? DOUBLING : SKEW;
      const ratio = Math.max(a, b) / Math.min(a, b);
      return [name, num(a), num(b), `${fewer} · ${fix(ratio, 2)} 배`];
    });
    const jump = (d: string, from: string, to: string) =>
      fix((bench(d, to) / bench(d, from) - 1) * 100, 2);
    return block(
      md(["입력", DOUBLING, SKEW, "적은 쪽"], rows, [1, 2]),
      `n = 90 에서 91 로 한 글자 늘 때 ${SKEW}의 자료 접근이 ${jump(SKEW, "n=90 자료 접근", "n=91 자료 접근")} % 늘고, n = 1,039 에서 1,040 으로 늘 때는 ${DOUBLING}이 ${jump(DOUBLING, "n=1,039 자료 접근", "n=1,040 자료 접근")} % · ${SKEW}이 ${jump(SKEW, "n=1,039 자료 접근", "n=1,040 자료 접근")} % 늡니다.`,
    );
  },

  "alt-cells": () => {
    const key = "n=100,000 추가 칸";
    const a = bench(DOUBLING, key);
    const b = bench(SKEW, key);
    return block(
      md(
        ["축", DOUBLING, SKEW, "적은 쪽"],
        [
          [
            "추가 칸 (무작위 26 글자 n = 100,000)",
            num(a),
            num(b),
            `${a < b ? DOUBLING : SKEW} · ${fix(Math.max(a, b) / Math.min(a, b), 2)} 배`,
          ],
        ],
        [1, 2],
      ),
      `추가 칸이 ${DOUBLING}은 n 의 ${fix(a / LIMIT, 1)} 배, ${SKEW}은 n 의 ${fix(b / LIMIT, 1)} 배입니다.`,
    );
  },

  /* ── 수식 정의와 유도 ── */

  "math-check": () => {
    const n = WALK.length;
    const r = walkRun();
    const levels: (readonly number[])[] = [
      r.rank0,
      ...r.rounds.map((x) => x.next),
    ];
    const rows = levels.map((code, k) => {
      const len = 2 ** k;
      const blocks = [...Array(n).keys()].map((i) => piece(WALK, i, len));
      const uniq = [...new Set(blocks)].sort();
      const rank = blocks.map((b) => uniq.indexOf(b));
      return [
        String(k),
        String(len),
        blocks.join(" "),
        show(rank),
        show(code),
        String(uniq.length),
      ];
    });
    const equal = rows.filter((row) => row[3] === row[4]).map((row) => row[0]);
    return block(
      md(
        [
          "k",
          "조각 길이 2^k",
          "자리 0 부터의 조각",
          "정의대로 매긴 r",
          "코드의 rank",
          "서로 다른 조각 수",
        ],
        rows,
        [0, 1, 5],
      ),
      `k = ${equal.join(" · ")} 인 줄은 정의의 값과 코드의 rank 가 글자 그대로 같습니다.`,
    );
  },

  "math-rounds": () => {
    const rows = [10, 100, 1000, 10000, LIMIT].map((n) => {
      const r = countedDoubling("a".repeat(n));
      return [
        num(n),
        String(Math.ceil(Math.log2(n))),
        String(r.rounds),
        num(r.access),
      ];
    });
    const tight = rows.every((row) => row[1] === row[2]);
    return block(
      md(["n", "⌈log₂ n⌉", "실측 바퀴 수", "자료 접근"], rows, [0, 1, 2, 3]),
      tight
        ? `전부 같은 글자에서는 ${rows.length} 규모 모두 실측 바퀴 수가 상한과 같습니다.`
        : "실측 바퀴 수가 상한과 다른 규모가 있습니다.",
    );
  },

  "math-optimum": () => {
    const text = "a".repeat(LIMIT);
    const measured = new Map(
      [2, 3, 4, 8, 16].map((m) => [m, generalized(text, m).access]),
    );
    const rows = [2, 3, 4, 5, 8, 16].map((m) => [
      String(m),
      fix(m / Math.log(m), 3),
      String(m * Math.ceil(Math.log(LIMIT) / Math.log(m))),
      measured.has(m) ? num(measured.get(m) as number) : "—",
    ]);
    const two = 2 / Math.log(2);
    const three = 3 / Math.log(3);
    return block(
      md(
        ["m", "m / ln m", `m·⌈log_m ${num(LIMIT)}⌉`, "자료 접근 실측"],
        rows,
        [0, 1, 2, 3],
      ),
      `m / ln m 이 가장 작은 실수는 m = e = ${fix(Math.E, 3)}${josa(fix(Math.E, 3), "이고", "고")}, 정수 2 와 3 의 값 ${fix(two, 3)}${과와(fix(two, 3))} ${fix(three, 3)}${은는(fix(three, 3))} ${pct(three, two)} % 차이입니다.`,
    );
  },

  /* ── 불변식 ── */

  "invariant-rounds": () => {
    const rows: string[][] = [];
    let pairs = 0;
    for (const s of ["banana", "aaaa", "abab", "mississippi"]) {
      const n = s.length;
      for (const round of trace(s).rounds) {
        const len = 2 * round.gap;
        let ok = true;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const a = piece(s, i, len);
            const b = piece(s, j, len);
            const less = (round.next[i] as number) < (round.next[j] as number);
            const eq = round.next[i] === round.next[j];
            if (less !== a < b || eq !== (a === b)) ok = false;
            pairs++;
          }
        }
        rows.push([
          `"${s}"`,
          String(len),
          show(round.next),
          String(round.spanOut),
          ok ? "맞다" : "틀리다",
        ]);
      }
    }
    const wrong = rows.filter((row) => row[4] !== "맞다").length;
    return block(
      md(
        [
          "입력",
          "가른 조각 길이",
          "바퀴가 끝난 시점의 rank",
          "span",
          "조각 순서와 대조",
        ],
        rows,
        [1, 3],
      ),
      `바퀴 ${rows.length} 개에서 자리 짝 ${num(pairs)} 개를 전수로 대조했고, 순위의 대소 · 같음이 조각의 사전순 대소 · 같음과 틀린 바퀴는 ${wrong} 개입니다.`,
    );
  },

  "invariant-edges": () => {
    const rows = [
      ["길이 1", "a"],
      ["두 글자가 같다", "aa"],
      ["두 글자가 다르다", "ab"],
      ["뒤가 앞보다 작다", "ba"],
      ["전부 같은 글자", "aaaa"],
      ["전부 다른 글자", "abcd"],
      ["되풀이", "abab"],
    ].map(([name, s]) => [
      name as string,
      `"${s}"`,
      String(trace(s as string).rounds.length),
      show(suffixArray(s as string)),
    ]);
    return md(["경계", "입력", "바퀴 수", "답"], rows, [2]);
  },

  "mutant-front-only": () => {
    const c = contrast(frontOnly, "앞 성분만 비교한 답");
    return block(c.table, tally(c));
  },

  /** 앞 성분만 비교하면 "aaaa" 의 첫 바퀴에서 순위가 어떻게 되는가 — 두 판정을 같은 쌍 위에서 나란히. */
  "mutant-front-only-aaaa": () => {
    const s = "aaaa";
    const n = s.length;
    const round = replay(s).rounds[0] as Round;
    const judge = (both: boolean) => {
      const next = new Array<number>(n).fill(0);
      let top = 0;
      for (const j of round.judges) {
        const up = both ? j.up : j.pa[0] !== j.pb[0];
        if (up) top++;
        next[j.b] = top;
      }
      return next;
    };
    const good = judge(true);
    const bad = judge(false);
    const rows = [
      ["쌍의 두 성분을 다 비교", show(good), String(new Set(good).size)],
      ["앞 성분만 비교", show(bad), String(new Set(bad).size)],
    ];
    const pairs = round.rank
      .map((f, i) => `(${f}, ${round.backs[i]})`)
      .join(" · ");
    return block(
      md(["재부여 판정", "첫 바퀴 뒤 rank", "무리 수"], rows, [2]),
      `첫 바퀴의 쌍은 자리 순서로 ${pairs} 입니다. 앞 성분만 비교하면 네 자리가 무리 ${new Set(bad).size} 개로 남습니다.`,
    );
  },

  /* ── 비용 계산 ── */

  "perf-count": () => {
    const r = countedDoubling(WALK);
    const rows: string[][] = [
      ["첫 순위 매기기", "T1", num(r.first)],
      ...r.perRound.map((v, k) => [
        `${k + 1} 번째 바퀴`,
        `T${2 + 4 * k}~T${5 + 4 * k}`,
        num(v),
      ]),
      ["합계", `T1~T${1 + 4 * r.rounds}`, num(r.access)],
    ];
    const second = walkRun().rounds[1] as Round;
    return block(
      md(["무리", "걸음", "자료 접근"], rows, [2]),
      `첫 바퀴가 둘째 바퀴의 ${fix((r.perRound[0] as number) / (r.perRound[1] as number), 1)} 배입니다. 첫 바퀴의 계수 정렬은 글자 코드 범위에 맞춘 ${128 + 1} 칸을 잡고, 둘째 바퀴는 span + 1 = ${second.span + 1} 칸만 잡습니다.`,
    );
  },

  "perf-scale": () => {
    const c = originCounts();
    const rows = (
      [
        ["무작위 26 글자", c.doubleRandom],
        ["전부 같은 글자", c.doubleAllSame],
      ] as const
    ).map(([name, v]) => [
      name,
      num(LIMIT),
      String(v.rounds),
      num(v.access),
      fix(v.access / LIMIT / v.rounds, 1),
    ]);
    return block(
      md(
        ["입력", "n", "바퀴 수 R", "자료 접근", "바퀴 하나당 n 의 몇 배"],
        rows,
        [1, 2, 3, 4],
      ),
      `바퀴 하나당 자료 접근이 n 의 ${rows.map((row) => row[4]).join(" 배와 ")} 배로 모이고, 두 입력을 가르는 것은 바퀴 수입니다.`,
    );
  },

  "worst-shape": () => {
    const n = LIMIT;
    const shapes: [string, string][] = [
      ["전부 같은 글자", "a".repeat(n)],
      ["두 글자가 번갈아 나온다", "ab".repeat(n / 2)],
      ["앞이 다 같고 끝만 다르다", `${"a".repeat(n - 1)}b`],
      ["여섯 글자가 되풀이된다", "abcabb".repeat(n / 6)],
      ["무작위 두 글자", makeText(n, 2)],
      ["무작위 26 글자", makeText(n, 26)],
      [
        "글자가 오름차순으로 늘어선다",
        makeText(n, 26).split("").sort().join(""),
      ],
    ];
    const measured = shapes.map(([name, s]) => ({
      name,
      r: countedDoubling(s),
    }));
    const rows = measured.map(({ name, r }) => [
      name,
      String(r.rounds),
      num(r.access),
      num(r.cells),
    ]);
    const worst = measured.reduce((a, b) => (a.r.access >= b.r.access ? a : b));
    const bound = Math.ceil(Math.log2(n));
    const full = measured.filter((m) => m.r.rounds === bound);
    const lo = Math.min(...full.map((m) => m.r.access));
    const hi = Math.max(...full.map((m) => m.r.access));
    return block(
      md(["입력의 모양", "바퀴 수", "자료 접근", "추가 칸"], rows, [1, 2, 3]),
      `n = ${num(n)} 입니다. 바퀴 수가 상한 ${bound} 에 이른 모양이 ${full.length} 개이고, 그 안의 자료 접근 차이는 ${fix((hi / lo - 1) * 100, 4)} % 입니다. 자료 접근이 가장 많은 것은 「${worst.name}」 입니다.`,
    );
  },

  "worst-sorted": () => {
    const rows = [1000, 10000].map((n) => {
      const rnd = makeText(n, 26);
      const sorted = rnd.split("").sort().join("");
      const a = countedDoubling(rnd);
      const b = countedDoubling(sorted);
      return [
        num(n),
        String(a.rounds),
        num(a.access),
        String(b.rounds),
        num(b.access),
        b.access > a.access ? "정렬된 쪽" : "무작위 쪽",
      ];
    });
    return md(
      ["n", "무작위 바퀴", "무작위 접근", "정렬 바퀴", "정렬 접근", "많은 쪽"],
      rows,
      [0, 1, 2, 3, 4],
    );
  },

  /* ── 스스로 점검하기 ── */

  "check-why-three": () => {
    const r = walkRun();
    const first = r.rounds[0] as Round;
    const second = r.rounds[1] as Round;
    const g = second.gap;
    const rows = [1, 3].map((i) => [
      `자리 ${i}`,
      piece(WALK, i, 2 * g),
      String(second.rank[i]),
      i + g < WALK.length
        ? `${piece(WALK, i + g, g)} · rank[${i + g}] + 1 = ${second.backs[i]}`
        : "없음 · 0",
      `(${second.rank[i]}, ${second.backs[i]})`,
    ]);
    const pos = (i: number) => second.saFront.indexOf(i);
    return block(
      md(
        ["자리", "길이 4 조각", "앞 성분", "뒤 조각 · 뒤 성분", "쌍"],
        rows,
        [2],
      ),
      `첫 바퀴가 끝난 시점에는 rank[1] = ${first.next[1]} · rank[3] = ${first.next[3]}${으로(first.next[3] as number)} 같았습니다. 둘째 바퀴의 앞 성분 정렬 뒤 자리 3 은 sa 의 칸 ${pos(3)}, 자리 1 은 칸 ${pos(1)} 에 있습니다.`,
    );
  },
};
