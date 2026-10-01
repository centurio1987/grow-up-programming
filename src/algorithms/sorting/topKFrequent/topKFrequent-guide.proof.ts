/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 걸음의 상태는 그림 사이드카의 `trace`(정본과 같은 절차를 걸음마다 기록하고 정본의 답과 대조한 것)와
 * `walkSteps` 에서 받는다 — 그림 · 패널 · 표가 같은 기록을 쓴다. 기본 연산을 세는 기준도 그림
 * 사이드카의 `bucketCost` · `sortAllCost` · `rescanCost` 하나다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/topKFrequent/topKFrequent-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases } from "./topKFrequent-guide.alt.ts";
import {
  BIG,
  BIG_N,
  BUDGET_BYTES,
  bucketCost,
  bucketsResult,
  cellOf,
  freqOf,
  num,
  rescanCost,
  rescanFormula,
  secondsOf,
  show,
  sortAllCost,
  splitSteps,
  spread123,
  trace,
  VALUE_CELLS,
  WALK,
  WALK_K,
  walkSteps,
} from "./topKFrequent-guide.fig.tsx";
import { topKFrequent } from "./topKFrequent-guide.ref.ts";

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

/** 한글을 두 칸으로 세는 폭. 등폭 펜스의 열을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 열 폭을 값에서 재서 등폭 줄을 맞춘다. 마지막 칸은 채우지 않는다. */
function columns(rows: string[][], gap = "   "): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows.map((r) =>
    r
      .map((cell, c) => (c === r.length - 1 ? cell : pad(cell, w[c] ?? 0)))
      .join(gap)
      .replace(/\s+$/, ""),
  );
}

const entriesText = (m: Map<number, number>): string =>
  `{${[...m].map(([v, f]) => `${v}:${f}`).join(", ")}}`;

/** `3 과 5` 꼴 — 값 둘을 조사로 잇는다. 셋 이상은 쉼표로 잇고 마지막 둘만 조사로 잇는다. */
function andJoin(xs: readonly string[]): string {
  if (xs.length <= 1) return xs.join("");
  const head = xs.slice(0, -1);
  const last = head.at(-1) as string;
  return `${head
    .slice(0, -1)
    .map((x) => `${x}, `)
    .join("")}${last}${과와(last)} ${xs.at(-1)}`;
}

/* ───────────────────────── 변이 ───────────────────────── */

interface Impl {
  topKFrequent(A: number[], k: number): number[];
}

const REF = new URL("./topKFrequent-guide.ref.ts", import.meta.url).pathname;

/** 빈도 버킷을 `n + 1` 개가 아니라 `n` 개만 잡은 사본. 마지막 버킷 번호가 사라진다. */
const cellsN = await loadMutant<Impl>(REF, {
  swap: [/length: n \+ 1/, "length: n"],
});

/** 한 버킷 안에서 끝내는 줄을 지운 사본. 바깥 조건만 남는다. */
const noInnerStop = await loadMutant<Impl>(REF, { drop: /\/\/ ⑤/ });

/** 버킷 번호를 작은 쪽에서 큰 쪽으로 올라가게 뒤집은 사본. */
const scanUp = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let f = n; f >= 1 && result\.length < k; f--\) \{/,
    "for (let f = 1; f <= n && result.length < k; f++) {",
  ],
});

/**
 * 정본과 변이를 같은 입력에 걸고 답을 나란히 적는다. 변이가 어느 입력에서도 답을 안 바꾸면
 * 「깨진다」가 거짓이라 던진다 — 다만 중화 실행에서는 변이 모듈이 정본 그대로라 그 검사를 건너뛴다
 * (SPEC §0 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
 */
function mutantTable(
  cases: [string, number[], number][],
  mutated: Impl,
  head: string,
): string {
  const rows = cases.map(([name, A, k]) => ({
    name,
    bare: show(topKFrequent([...A], k)),
    mutated: show(mutated.topKFrequent([...A], k)),
  }));
  const neutral = mutated.topKFrequent === topKFrequent;
  if (!neutral && rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 답을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
  const differ = rows.filter((r) => r.bare !== r.mutated).length;
  return [
    md(
      ["입력", "바른 코드", head, "답"],
      rows.map((r) => [
        r.name,
        r.bare,
        r.mutated,
        r.bare === r.mutated ? "같다" : "다르다",
      ]),
    ),
    "",
    `입력 ${rows.length} 개 중 ${differ} 개에서 답이 바른 코드와 갈립니다.`,
  ].join("\n");
}

/* ───────────────────────── 블록 ───────────────────────── */

const walkTrace = () => trace(WALK, WALK_K);
const finalBuckets = () => walkTrace().places.at(-1)?.buckets ?? [];
const toNumber = (s: string | undefined): number =>
  Number((s ?? "").replaceAll(",", ""));

/* ───────────────────────── purpose.alt ───────────────────────── */

/** `.alt.ts` 가 낸 `k` 의 기본 연산. 없는 키면 멈춘다. */
function altOps(design: keyof typeof cases, k: number): number {
  const v = cases[design]()[`k=${num(k)} 기본 연산`];
  if (v === undefined) throw new Error(`${design} 의 k=${k} 기본 연산이 없다`);
  return v;
}

/** 두 설계의 기본 연산을 `k` 마다 한 줄로. 적은 쪽을 굵게, 「적은 쪽」 열은 비나 차로 적는다. */
function altRows(ks: readonly number[], flip?: number): string {
  const rows = ks.map((k) => {
    const b = altOps("빈도 버킷", k);
    const h = altOps("크기 k 최소 힙", k);
    const ratio = (x: number, y: number) =>
      (x / y).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    const note =
      k === flip
        ? "**여기서 순서가 뒤집힙니다**"
        : h < b
          ? b - h < 1_000
            ? `힙이 ${num(b - h)} 번 적습니다`
            : `힙이 ${ratio(b, h)} 배 적습니다`
          : `빈도 버킷이 ${ratio(h, b)} 배 적습니다`;
    return [
      num(k),
      b < h ? `**${num(b)}**` : num(b),
      h < b ? `**${num(h)}**` : num(h),
      note,
    ];
  });
  return md(["`k`", "빈도 버킷", "크기 `k` 최소 힙", "적은 쪽"], rows);
}

export const PROOFS: Record<string, () => string> = {
  /** `purpose.alt` — `k` 가 작을 때 두 설계의 기본 연산과 비. */
  "alt-small-k": () => altRows([1, 100, 1_000]),
  /** `purpose.alt` — 경계 양쪽과 `k = 50,000` 의 기본 연산과 비. */
  "alt-large-k": () => {
    const flip = 4_300;
    if (
      !(
        altOps("빈도 버킷", flip - 1) > altOps("크기 k 최소 힙", flip - 1) &&
        altOps("빈도 버킷", flip) < altOps("크기 k 최소 힙", flip)
      )
    ) {
      throw new Error("4,300 이 뒤집히는 자리가 아니다");
    }
    return altRows([4_299, flip, 50_000], flip);
  },
  /** `concept` — 전개 입력과 규모를 키운 입력에서 기본 연산과 등장 횟수끼리의 비교. */
  "concept-cost": () => {
    const small = bucketCost(WALK, WALK_K);
    const big = bucketCost(BIG(), 10);
    return [
      md(
        ["입력", "N", "M", "k", "기본 연산", "등장 횟수끼리 비교", "빈도 버킷"],
        [
          [
            "전개 입력 아홉 칸",
            num(WALK.length),
            num(small.m),
            num(WALK_K),
            num(small.ops),
            "0",
            `${num(small.make)} 개`,
          ],
          [
            `생성식 ${num(BIG_N)} 칸`,
            num(BIG_N),
            num(big.m),
            "10",
            num(big.ops),
            "0",
            `${num(big.make)} 개`,
          ],
        ],
        [1, 2, 3, 4],
      ),
      "",
      `두 입력 모두 빈도 버킷이 배열 길이보다 하나 많은 ${num(small.make)} 개와 ${num(big.make)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 값마다 배열 전체를 다시 세면 규모에서 몇 번인가. */
  "origin-rescan": () => {
    const rows = [1_000, 10_000].map((n) => {
      const A = Array.from({ length: n }, (_, i) => (i * 7919) % n);
      const got = rescanCost(A);
      if (got !== rescanFormula(n)) {
        throw new Error(`n = ${n} 에서 실측 ${got} 이 N + 2N² 와 다르다`);
      }
      return [num(n), num(got), secondsOf(got)];
    });
    rows.push([
      num(BIG_N),
      num(rescanFormula(BIG_N)),
      secondsOf(rescanFormula(BIG_N)),
    ]);
    return [
      md(
        ["배열 길이 N", "세기까지의 기본 연산", "시간(초당 1 억 번)"],
        rows,
        [0, 1, 2],
      ),
      "",
      `값이 전부 다른 입력으로 칸 1,000 개와 10,000 개에서 실제로 세어 N + 2N² 번인 것을 확인했고, ${num(BIG_N)} 칸은 그 식으로 냈습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 전부 줄 세우기의 비용이 무엇에 달렸는가. 같은 N 에서 M 만 바꾼다. */
  "origin-sort-by-m": () => {
    const cases: [string, number[]][] = [
      ["전부 같은 값", new Array<number>(BIG_N).fill(7)],
      ["i mod 100", Array.from({ length: BIG_N }, (_, i) => i % 100)],
      ["i mod 10,000", Array.from({ length: BIG_N }, (_, i) => i % 10_000)],
      ["생성식(등장 횟수 1·2·3)", BIG()],
      ["전부 다른 값", Array.from({ length: BIG_N }, (_, i) => i)],
    ];
    const rows = cases.map(([name, A]) => {
      const m = freqOf(A).size;
      const s = sortAllCost(A, 1);
      return { name, m, s };
    });
    const first = rows[0] as (typeof rows)[number];
    const last = rows.at(-1) as (typeof rows)[number];
    return [
      md(
        ["입력", "서로 다른 값 M", "기본 연산", "그중 등장 횟수끼리의 비교"],
        rows.map((r) => [
          r.name,
          num(r.m),
          num(r.s.ops),
          num(r.s.freqCompares),
        ]),
        [1, 2, 3],
      ),
      "",
      `다섯 입력 모두 N = ${num(BIG_N)} 이고 k = 1 입니다. 세기에 드는 ${num(2 * BIG_N)} 번은 다섯 입력에서 그대로이고, 비교는 M = ${num(first.m)} 일 때 ${num(first.s.freqCompares)} 번에서 M = ${num(last.m)} 일 때 ${num(last.s.freqCompares)} 번까지 늘었습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 한 번만 지나며 맵에 세면 무엇이 남는가. */
  "origin-map-count": () => {
    const freq = freqOf(WALK);
    const cost = bucketCost(WALK, WALK_K);
    const sum = [...freq.values()].reduce((a, b) => a + b, 0);
    return [
      md(
        ["값 v", "등장 횟수", "나온 인덱스"],
        [...freq].map(([v, f]) => [
          String(v),
          String(f),
          WALK.flatMap((x, i) => (x === v ? [String(i)] : [])).join(" · "),
        ]),
        [0, 1],
      ),
      "",
      `아홉 칸을 한 번 지나 맵 항목 ${freq.size} 개가 됐고, 등장 횟수의 합은 ${sum} 입니다. 기본 연산은 맵 읽기와 쓰기를 합해 ${cost.count} 번입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 전부 줄 세우기와 빈도 버킷의 실제 계수. */
  "origin-sort-vs-bucket": () => {
    const k = 10;
    const s = sortAllCost(BIG(), k);
    const b = bucketCost(BIG(), k);
    const freq = freqOf(BIG());
    const fs = (xs: number[]) => xs.map((v) => freq.get(v)).join(" ");
    if (fs(s.out) !== fs(b.out)) {
      throw new Error(
        "두 방법이 다른 등장 횟수를 답했다 — 대조가 성립하지 않는다",
      );
    }
    const top = freq.get(b.out[0] as number) as number;
    return [
      md(
        ["방법", "기본 연산", "그중 등장 횟수끼리의 비교", "추가 칸"],
        [
          [
            "맵에 세고 전부 줄 세우기",
            num(s.ops),
            num(s.freqCompares),
            num(s.cells),
          ],
          ["빈도 버킷", num(b.ops), "0", num(b.cells)],
        ],
        [1, 2, 3],
      ),
      "",
      `생성식 ${num(BIG_N)} 칸 입력에 k = ${k}${을를(k)} 걸었고, 두 방법 모두 등장 횟수 ${top} 인 값 ${k} 개를 답했습니다. 서로 다른 값은 M = ${num(b.m)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 무엇을 칸 번호로 두면 칸이 몇 개 필요한가. */
  "origin-key-range": () => {
    const maxFreq = Math.max(...freqOf(BIG()).values());
    const rows: [string, string, number][] = [
      ["값 그 자체", "−10^9 … 10^9", VALUE_CELLS],
      ["등장 횟수", `1 … ${num(BIG_N)}`, BIG_N + 1],
    ];
    return [
      md(
        [
          "칸 번호로 쓰는 수",
          "그 수의 범위",
          "칸 수",
          "칸당 4 바이트일 때",
          "256 MB 대비 배수",
        ],
        rows.map(([what, range, c]) => [
          what,
          range,
          num(c),
          `${num(c * 4)} 바이트`,
          `${((c * 4) / BUDGET_BYTES).toFixed(3)} 배`,
        ]),
        [2, 3, 4],
      ),
      "",
      `256 MB 는 ${num(BUDGET_BYTES)} 바이트입니다. 생성식 ${num(BIG_N)} 칸 입력에서 실제로 나온 가장 큰 등장 횟수는 ${maxFreq} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — 버킷 하나를 읽는 법. */
  "build-read-one": () => {
    const f = 2;
    const b = finalBuckets()[f] ?? [];
    const rows = b.map((v) => {
      const at = WALK.flatMap((x, i) => (x === v ? [i] : []));
      return [String(v), at.join(" · "), String(at.length)];
    });
    const cells = rows.reduce((s, r) => s + Number(r[2]), 0);
    return [
      md(["slot[2] 의 값", "A 에서 나온 인덱스", "등장 횟수"], rows, [2]),
      "",
      `버킷 ${f} 에 든 값 ${b.length} 개가 A 의 칸을 ${f} 칸씩 맡아, 버킷 ${f}${이가(f)} 맡는 칸은 모두 ${cells} 칸입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (d) — 버킷끼리의 관계와 등장 횟수의 합. */
  "build-relation": () => {
    const buckets = finalBuckets();
    const n = WALK.length;
    const rows: string[][] = [];
    let sum = 0;
    for (let f = n; f >= 1; f--) {
      const b = buckets[f] ?? [];
      if (b.length === 0) continue;
      sum += f * b.length;
      rows.push([String(f), cellOf(b), String(b.length), String(f * b.length)]);
    }
    const filled = buckets.filter((b) => b.length > 0).length;
    return [
      md(["버킷 f", "담긴 값", "값 수", "f × 값 수"], rows, [0, 2, 3]),
      "",
      `f × 값 수를 모두 더하면 ${sum}${으로(sum)} A 의 칸 수 N = ${n}${과와(n)} 같습니다. 버킷 ${buckets.length} 개 중 값이 든 버킷은 ${filled} 개이고 나머지는 빈 목록입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 값마다 등장 횟수를 맵에 센다. */
  "build-count": () => {
    const t = walkTrace();
    const fresh = t.counts.filter((c) => c.before === 0).map((c) => c.i);
    return [
      md(
        ["걸음", "읽은 값", "맵에 있던 항목", "freq[v]", "맵 전체"],
        t.counts.map((c) => [
          `i = ${c.i}`,
          `A[${c.i}] = ${c.v}`,
          c.before === 0 ? "없음 — 새 항목" : "있음",
          `${c.before} → ${c.after}`,
          `{${c.entries.map(([v, f]) => `${v}:${f}`).join(", ")}}`,
        ]),
      ),
      "",
      `항목은 값을 처음 본 걸음(i = ${fresh.join(" · ")})에 하나씩 생겼고, 나머지 ${t.counts.length - fresh.length} 걸음은 이미 있는 항목에 1 을 더했습니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 등장 횟수 번 버킷에 값을 담는다. */
  "build-place": () => {
    const t = walkTrace();
    const two = (t.places.at(-1)?.buckets ?? []).filter(
      (b) => b.length > 1,
    ).length;
    return [
      md(
        ["맵 항목", "등장 횟수 f", "담은 버킷", "그 버킷의 목록"],
        t.places.map((p) => [
          `${p.v}:${p.f}`,
          String(p.f),
          `slot[${p.f}]`,
          cellOf(p.buckets[p.f] ?? []),
        ]),
        [1],
      ),
      "",
      `담긴 차례는 ${t.places.map((p) => p.v).join(" → ")} 로 맵 항목의 순서 그대로이고, 값이 둘 이상 들어간 버킷이 ${two} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 큰 버킷부터 모을 때 쉬운 경우와 불안한 경우. */
  "build-collect": () => {
    const cases: [string, number[], number][] = [
      ["[4 4 4 4 2 2 2 1 1 3]", [4, 4, 4, 4, 2, 2, 2, 1, 1, 3], 3],
      [show(WALK), [...WALK], 3],
      [show(WALK), [...WALK], 2],
    ];
    const rows = cases.map(([name, A, k]) => {
      const t = trace(A, k);
      const empty = t.visits.filter((v) => v.took.length === 0).map((v) => v.f);
      const used = t.visits
        .filter((v) => v.took.length > 0)
        .map((v) => `버킷 ${v.f} 에서 ${v.took.join(" ")}`)
        .join(" · ");
      const last = t.visits.at(-1);
      const stop = last?.stopInside
        ? `버킷 ${last.f} 안에서 ⑤`
        : `버킷 ${t.endF} 앞에서 바깥 조건`;
      return [
        name,
        String(k),
        empty.length === 0 ? "없음" : `${empty[0]} … ${empty.at(-1)}`,
        used,
        stop,
        show(t.result),
      ];
    });
    return [
      md(
        ["입력", "k", "빈 채 지난 버킷", "답에 담은 값", "멈춘 자리", "답"],
        rows,
        [1],
      ),
      "",
      `세 벌 모두 정본의 답과 같은 답을 모았습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 버킷을 N + 1 개 잡는가, 가장 큰 등장 횟수 + 1 개 잡는가. */
  "build-size": () => {
    const cases: [string, number[]][] = [
      ["전개 입력 아홉 칸", [...WALK]],
      ["전부 같은 값", new Array<number>(BIG_N).fill(7)],
      ["전부 다른 값", Array.from({ length: BIG_N }, (_, i) => i)],
      ["생성식(등장 횟수 1·2·3)", BIG()],
      ["등장 횟수를 가장 넓게 흩은 입력", maxSpreadInput(BIG_N)],
    ];
    const rows = cases.map(([name, A]) => {
      const freq = freqOf(A);
      const top = Math.max(...freq.values());
      const filled = new Set(freq.values()).size;
      return [
        name,
        num(A.length),
        num(A.length + 1),
        num(top + 1),
        num(filled),
      ];
    });
    const c = bucketCost(
      Array.from({ length: BIG_N }, (_, i) => i),
      1,
    );
    return [
      md(
        [
          "입력",
          "N",
          "N + 1 로 잡은 버킷",
          "가장 큰 등장 횟수 + 1",
          "값이 든 버킷",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `전부 다른 값에 k = 1 을 걸면 N + 1 개로 잡은 쪽은 버킷 ${num(c.visited)} 개를 내려가야 값을 만나고, 가장 큰 등장 횟수 + 1 개로 잡은 쪽은 버킷 1 개만 보지만 그 최댓값을 구하려고 맵 항목 ${num(c.m)} 개를 한 번 더 읽습니다.`,
    ].join("\n");
  },

  /** `deep.walk` 도입 — 끝까지 쓰는 고정 입력. */
  "walk-input": () =>
    [
      `const A = [${WALK.join(", ")}];`,
      `const k = ${WALK_K};`,
      `// 이 절이 끝나면 [${topKFrequent([...WALK], WALK_K).join(", ")}] 이 나와야 한다`,
    ].join("\n"),

  /** `deep.walk.step` 1 — 세기 조각만 실행한 결과. */
  "walk-count-out": () => {
    const freq = freqOf(WALK);
    const sum = [...freq.values()].reduce((a, b) => a + b, 0);
    return [
      `A    = ${show(WALK)}`,
      `freq = ${entriesText(freq)}`,
      `       └ 항목 ${freq.size} 개 · 등장 횟수의 합 ${sum} · 항목은 값을 처음 본 순서로 쌓인다`,
    ].join("\n");
  },

  /** `deep.walk.step` 2 — 담기 조각만 실행한 결과. */
  "walk-slot-out": () => {
    const t = walkTrace();
    const buckets = t.places.at(-1)?.buckets ?? [];
    const lines = columns([
      ["버킷 번호 f", ...buckets.map((_, f) => String(f))],
      ["slot[f]", ...buckets.map(cellOf)],
    ]);
    return [
      ...lines,
      `└ 버킷 ${buckets.length} 개 중 ${buckets.filter((b) => b.length > 0).length} 개에 값이 들었다. 담긴 차례는 ${t.places.map((p) => p.v).join(" → ")} 이다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 버킷을 N 개만 잡으면 어느 입력에서 값이 사라지는가. */
  "pause-cells-n": () =>
    mutantTable(
      [
        [`전개 입력 · k=${WALK_K}`, [...WALK], WALK_K],
        ["[1 1 1 2 2 3] · k=2", [1, 1, 1, 2, 2, 3], 2],
        ["[7 7 7 7] · k=1", [7, 7, 7, 7], 1],
        ["[42] · k=1", [42], 1],
      ],
      cellsN,
      "버킷을 N 개만 잡은 코드",
    ),

  /** `deep.walk.pause` — 값 7 이 어디서 사라지는가. */
  "pause-seven": () => {
    const A = [7, 7, 7, 7];
    const n = A.length;
    const f = freqOf(A).get(7) as number;
    const slot = Array.from({ length: n }, () => [] as number[]);
    const hit = slot[f] === undefined ? "undefined" : "빈 목록";
    return [
      `N = ${n} 이고 값 7 의 등장 횟수도 ${f} 다`,
      `버킷을 ${n} 개만 잡으면   버킷 번호는 ${slot.map((_, i) => i).join(" ")} 뿐이라 버킷 ${f}${이가(f)} 없다`,
      `slot[${f}]?.push(7)       slot[${f}] 가 ${hit} 라 ?. 가 아무 일도 안 하고 넘어간다`,
      `                         └ 오류가 나지 않는다. 값 7 이 조용히 사라진다. 돌려주는 답: ${show(cellsN.topKFrequent([...A], 1))}`,
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 모으기 조각에서 버킷마다 안쪽 반복이 몇 번 실행되는가. */
  "walk-inner-count": () => {
    const t = walkTrace();
    const rows: string[][] = [];
    let got = 0;
    const empty = t.visits.filter((v) => v.bucket.length === 0);
    if (empty.length > 0) {
      rows.push([`${empty[0]?.f} … ${empty.at(-1)?.f}`, "[]", "0", show([])]);
    }
    for (const v of t.visits) {
      if (v.bucket.length === 0) continue;
      got += v.took.length;
      rows.push([
        String(v.f),
        cellOf(v.bucket),
        String(v.took.length),
        show(t.result.slice(0, got)),
      ]);
    }
    const lastF = t.visits.at(-1)?.f ?? 0;
    return [
      md(["버킷 f", "목록", "안쪽 반복", "답"], rows, [2]),
      "",
      `버킷 ${lastF} 에서 답이 ${got} 개가 되어 안쪽에서 멈췄고, 버킷 ${t.endF}${은는(t.endF)} 보지 않았습니다.`,
    ].join("\n");
  },

  /** `deep.walk.step` 4 — 고정 입력으로 끝까지 실행한 걸음 전부. */
  "walk-trace": () => {
    const steps = walkSteps();
    const branchOf = (title: string): string =>
      /^[①②③④⑤]/.exec(title)?.[0] ?? "—";
    const rows = steps.map((s) => [
      s.id,
      s.title.replace(/^[①②③④⑤] /, ""),
      s.stage.calc ? `${s.stage.calc.expr} → ${s.stage.calc.result}` : "—",
      branchOf(s.title),
    ]);
    const ids = (mark: string) =>
      steps.filter((s) => s.title.startsWith(mark)).map((s) => s.id);
    const span = (xs: string[]) =>
      xs.length > 2 ? `${xs[0]}\\~${xs.at(-1)}` : xs.join(" · ");
    const { build } = splitSteps(steps);
    return [
      md(["단계", "하는 일", "계산과 조건 판정", "갈래"], rows),
      "",
      `걸음은 ${steps.length} 개이고 앞의 ${build.length} 개가 빈도 버킷을 채우는 걸음입니다. ① 은 ${span(ids("①"))}, ② 는 ${span(ids("②"))}, ③ 은 ${span(ids("③"))}, ④ 는 ${span(ids("④"))}, ⑤ 는 ${span(ids("⑤"))} 에서 실행됐습니다.`,
    ].join("\n");
  },

  /** `deep.walk` — 두 패널이 끝났을 때의 값(본문 결과 마커와 같은 값). */
  "walk-results": () => {
    const t = walkTrace();
    return [
      `T1~T15 가 끝나면   ${bucketsResult(t)}`,
      `T16~T20 이 끝나면  ${show(t.result)}`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 한 버킷 안의 멈춤을 지우면 어느 입력이 살아남는가. */
  "pause-no-inner-stop": () =>
    mutantTable(
      [
        [`전개 입력 · k=${WALK_K}`, [...WALK], WALK_K],
        ["전개 입력 · k=2", [...WALK], 2],
        ["전개 입력 · k=1", [...WALK], 1],
        ["[1 1 1 2 2 3] · k=2", [1, 1, 1, 2, 2, 3], 2],
      ],
      noInnerStop,
      "한 버킷 안의 멈춤을 지운 코드",
    ),

  /** `deep.walk.final` — 전체 코드를 실행한 결과. */
  "final-calls": () => {
    const calls: [number[], number][] = [
      [[...WALK], WALK_K],
      [[1, 1, 1, 2, 2, 3], 2],
      [[1_000_000_000, 1_000_000_000, -1_000_000_000], 1],
    ];
    const lines = columns(
      calls.map(([A, k]) => [
        `topKFrequent(${show(A)}, ${k})`,
        "→",
        show(topKFrequent([...A], k)),
      ]),
    );
    return lines.join("\n");
  },

  /** `related` — 두 맵이 서로를 거꾸로 찾는 표다. */
  "related-inverted": () => {
    const freq = freqOf(WALK);
    const buckets = finalBuckets();
    const rows: string[][] = [];
    for (let f = WALK.length; f >= 1; f--) {
      const b = buckets[f] ?? [];
      if (b.length === 0) continue;
      const back = [...freq].filter(([, c]) => c === f).map(([v]) => v);
      if (show(back) !== cellOf(b)) {
        throw new Error(`버킷 ${f} 가 freq 를 거꾸로 찾은 값과 어긋난다`);
      }
      rows.push([String(f), show(back), cellOf(b)]);
    }
    return [
      md(
        [
          "등장 횟수 f",
          "freq 를 처음부터 읽어 찾은 값",
          "slot[f] 를 한 번 읽은 값",
        ],
        rows,
        [0],
      ),
      "",
      `값이 든 버킷 ${rows.length} 개 모두 두 쪽의 값이 일치합니다. 왼쪽은 맵 항목 ${freq.size} 개를 매번 처음부터 읽고, 오른쪽은 칸 하나를 읽습니다.`,
    ].join("\n");
  },

  /** `deep.math` ① — 정의를 전개 입력에 넣는다. */
  "math-define": () => {
    const freq = freqOf(WALK);
    const F = [...new Set(freq.values())];
    const lines = columns([
      ["", `V = {${[...freq.keys()].join(", ")}}`, `M = ${freq.size}`],
      ["", [...freq].map(([v, f]) => `c(${v})=${f}`).join("  ")],
      ["", `F = {${F.join(", ")}}`, `B = ${F.length}`],
    ]);
    return [
      `정의를 전개 입력에 넣으면 (A = ${show(WALK)}, N = ${WALK.length})`,
      ...lines,
      `      └ 등장 횟수가 같은 값이 있어 F 의 원소는 M 개보다 적다`,
    ].join("\n");
  },

  /** `deep.math` ② — 등장 횟수의 합을 검산한다. */
  "math-sum": () => {
    const vs = [...freqOf(WALK)];
    const sum = vs.reduce((s, [, f]) => s + f, 0);
    return [
      `${vs.map(([v]) => `c(${v})`).join(" + ")} = ${vs.map(([, f]) => f).join(" + ")} = ${sum} = N`,
      "└ 인덱스 하나는 값 하나에만 속하므로 인덱스 전체를 값별로 나눈 것이다",
    ].join("\n");
  },

  /** `deep.math` ④ — 서로 다른 등장 횟수의 개수 상한과 실측의 대조. */
  "bound-check": () => {
    const rows = [1, 3, 6, 9, 10, 100, 1_000, 100_000].map((n) => {
      const b = spreadBound(n);
      const got = new Set(freqOf(maxSpreadInput(n)).values()).size;
      const tri = (b * (b + 1)) / 2;
      return [
        num(n),
        num(8 * n + 1),
        String(b),
        String(got),
        `${num(tri)} ${tri === n ? "=" : "<"} ${num(n)}`,
      ];
    });
    const eq = rows.filter((r) => r[2] === r[3]).length;
    const tri = rows
      .filter((r) => r[4]?.includes(" = "))
      .map((r) => r[0] as string);
    return [
      md(
        ["N", "8N+1", "상한 ⌊(√(8N+1) − 1) / 2⌋", "실측 최대", "1+2+…+B 와 N"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `${rows.length} 규모 중 ${eq} 규모에서 실측 최대가 상한과 일치했고, 마지막 열이 등호인 N 은 삼각수 ${tri.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 제약 규모를 넣은 수치. */
  "math-scale": () => {
    const b = spreadBound(BIG_N);
    return columns([
      [`N = ${num(BIG_N)}`, "→", `B ≤ ${b}`],
      [
        `버킷 ${num(BIG_N + 1)} 개 중 값이 들 수 있는 버킷`,
        "→",
        `많아야 ${b} 개 · ${((100 * b) / (BIG_N + 1)).toFixed(2)} %`,
      ],
    ]).join("\n");
  },

  /** `invariant` ① — 담기가 진행 중인 걸음에서는 문장이 거짓이다. */
  "invariant-midway": () => {
    const steps = walkSteps();
    const t = walkTrace();
    const f = 2;
    const p = t.places.find((x) => x.f === f);
    const step = steps.find((s) => s.title.startsWith(`② 값 ${p?.v}`));
    const all = [...freqOf(WALK)].filter(([, c]) => c === f).map(([v]) => v);
    return [
      `${step?.id}${이가(step?.id ?? "")} 끝난 순간        slot[${f}] = ${cellOf(p?.buckets[f] ?? [])}`,
      `등장 횟수가 ${f} 인 값      ${show(all)}  (${all.length} 개)`,
      "                        └ 아직 안 담은 값이 있어 「전부」가 거짓이다",
    ].join("\n");
  },

  /** `invariant` ② — 담기가 끝난 뒤 버킷마다 담긴 값의 등장 횟수를 맵에서 다시 읽는다. */
  "invariant-buckets": () => {
    const freq = freqOf(WALK);
    const buckets = finalBuckets();
    const rows: string[][] = [];
    let checked = 0;
    let wrong = 0;
    for (let f = buckets.length - 1; f >= 0; f--) {
      const b = buckets[f] ?? [];
      const back = b.map((v) => freq.get(v) as number);
      checked += b.length;
      wrong += back.filter((c) => c !== f).length;
      const all = [...freq].filter(([, c]) => c === f).length;
      rows.push([
        String(f),
        cellOf(b),
        b.length === 0 ? "—" : back.join(" "),
        String(all),
      ]);
    }
    return [
      md(
        ["버킷 f", "slot[f]", "담긴 값의 freq", "등장 횟수가 f 인 값의 수"],
        rows,
        [0, 3],
      ),
      "",
      `버킷 ${buckets.length} 개를 모두 보고 담긴 값 ${checked} 개의 등장 횟수를 맵에서 다시 읽었습니다. 버킷 번호와 어긋난 값은 ${wrong} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. */
  "invariant-edges": () => {
    const cases: [string, number[], number, string][] = [
      [
        "N = 1 · k = 1 `[42]`",
        [42],
        1,
        "버킷이 둘이고 값의 등장 횟수가 1 이다",
      ],
      [
        "전부 같은 값 `[7 7 7 7]` · k = 1",
        [7, 7, 7, 7],
        1,
        "등장 횟수가 N 이라 마지막 버킷을 쓴다",
      ],
      [
        "전부 다른 값 `[5 6 7]` · k = 2",
        [5, 6, 7],
        2,
        "버킷 1 에 값 N 개가 모이고 앞에서부터 k 개를 담는다",
      ],
      [
        "음수 값 `[-1 -1 -1 2 2 0]` · k = 2",
        [-1, -1, -1, 2, 2, 0],
        2,
        "맵의 키가 음수여도 등장 횟수는 양수다",
      ],
      [
        "k = M `[1 1 2 3]` · k = 3",
        [1, 1, 2, 3],
        3,
        "버킷 1 까지 내려가 전부 담는다",
      ],
      [
        "값의 범위 경계 `[10^9 10^9 −10^9]` · k = 1",
        [1_000_000_000, 1_000_000_000, -1_000_000_000],
        1,
        "값은 맵의 키일 뿐 버킷 번호가 아니다",
      ],
    ];
    return md(
      ["입력", "처리되는 자리", "답"],
      cases.map(([name, A, k, where]) => [
        name,
        where,
        show(topKFrequent([...A], k)),
      ]),
    );
  },

  /** `invariant` ③ — 버킷 번호를 올라가며 읽으면 무엇이 나오는가. */
  "mutant-scan-up": () =>
    mutantTable(
      [
        [`전개 입력 · k=${WALK_K}`, [...WALK], WALK_K],
        ["전개 입력 · k=1", [...WALK], 1],
        ["[1 1 1 2 2 3] · k=2", [1, 1, 1, 2, 2, 3], 2],
        ["[7 7 7 7] · k=1", [7, 7, 7, 7], 1],
      ],
      scanUp,
      "버킷을 올라가며 읽는 코드",
    ),

  /** `invariant` ③ — 두 방향이 꺼내는 값의 등장 횟수. */
  "mutant-scan-up-why": () => {
    const freq = freqOf(WALK);
    const good = topKFrequent([...WALK], WALK_K);
    const bad = scanUp.topKFrequent([...WALK], WALK_K);
    const fs = (xs: number[]) => xs.map((v) => freq.get(v)).join(" · ");
    const order = (xs: number[]) =>
      [...new Set(xs.map((v) => freq.get(v) as number))].join(" → ");
    const lines = columns([
      ["바른 방향", `버킷 ${order(good)}`, `등장 횟수 ${fs(good)}`, show(good)],
      ["뒤집은 방향", `버킷 ${order(bad)}`, `등장 횟수 ${fs(bad)}`, show(bad)],
    ]);
    return [
      ...lines,
      "└ 버킷에 담긴 내용은 그대로이고 읽는 방향만 바뀌었다",
    ].join("\n");
  },

  /** `perf.derive` — 전개가 실제로 몇 번 기본 연산을 했는가. */
  "walk-cost": () => {
    const t = bucketCost(WALK, WALK_K);
    const steps = walkSteps();
    const ids = (re: RegExp) =>
      steps.filter((s) => re.test(s.title)).map((s) => s.id);
    const span = (xs: string[]) =>
      xs.length > 1 ? `${xs[0]}~${xs.at(-1)}` : (xs[0] ?? "");
    const make = steps.find((s) => s.title.startsWith("빈도 버킷"))?.id ?? "";
    return [
      md(
        ["갈래", "걸음", "기본 연산"],
        [
          ["등장 횟수를 센다", span(ids(/^①/)), num(t.count)],
          ["빈도 버킷을 만든다", make, num(t.make)],
          ["버킷에 값을 담는다", span(ids(/^②/)), num(t.place)],
          ["버킷을 내려가며 답을 채운다", span(ids(/^[③④⑤]/)), num(t.descend)],
          ["합", "", num(t.ops)],
        ],
        [2],
      ),
      "",
      `같은 입력을 값마다 다시 세는 방법으로 세면 세기까지만 ${num(rescanCost(WALK))} 번입니다. 내려간 버킷은 ${t.visited} 개이고 만든 버킷은 ${t.make} 개입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 네 갈래를 N · M · s · k 로 적은 식과 실측. */
  "perf-terms": () => {
    const t = bucketCost(WALK, WALK_K);
    const n = WALK.length;
    const rows: [string, string, string, number, number][] = [
      [
        "등장 횟수 세기",
        "칸 N 개 × (맵 읽기 1 + 맵 쓰기 1) = 2N",
        `N = ${n}`,
        2 * n,
        t.count,
      ],
      ["빈도 버킷 만들기", "N + 1 칸을 만든다", `N = ${n}`, n + 1, t.make],
      [
        "담기",
        "맵 항목 M 개 × (버킷 읽기 1 + 담기 1) = 2M",
        `M = ${t.m}`,
        2 * t.m,
        t.place,
      ],
      [
        "답 채우기",
        "내려간 버킷 s 개 × 2 + 담은 값 k 개 × 2",
        `s = ${t.visited}, k = ${t.taken}`,
        2 * t.visited + 2 * t.taken,
        t.descend,
      ],
    ];
    for (const r of rows) {
      if (r[3] !== r[4]) {
        throw new Error(`${r[0]} 의 식 ${r[3]} 이 실측 ${r[4]} 과 다르다`);
      }
    }
    return [
      md(
        ["갈래", "식", "전개 입력에서", "식의 값", "실측"],
        rows.map((r) => [r[0], r[1], r[2], num(r[3]), num(r[4])]),
        [3, 4],
      ),
      "",
      `네 갈래 모두 식의 값이 실측과 일치합니다. 내려간 버킷 수 s 는 N 이하이고, 담은 값 수는 k 이하입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 총식과 그 상한. */
  "perf-total": () =>
    [
      "총식 = 2N + (N + 1) + 2M + 2s + 2k   (s 는 내려간 버킷 수로 N 이하, M ≤ N, k ≤ M)",
      "각 항에 상한을 넣으면 2N + (N + 1) + 2N + 2N + 2N = 9N + 1",
      `N = ${num(BIG_N)} 이면 ${num(9 * BIG_N + 1)} 번`,
    ].join("\n"),

  /** `perf.bounds` — 최선과 최악의 차이가 상수 배다. */
  "perf-best-worst": () => {
    const n = 1_024;
    const same = bucketCost(new Array<number>(n).fill(7), 1);
    const diff = bucketCost(
      Array.from({ length: n }, (_, i) => i),
      1,
    );
    const lines = columns([
      [
        "전부 같은 값 · k=1",
        `내려간 버킷 ${num(same.visited)} 개`,
        `N=${num(n)} 에서 기본 연산 ${num(same.ops)}`,
      ],
      [
        "전부 다른 값 · k=1",
        `내려간 버킷 ${num(diff.visited)} 개`,
        `N=${num(n)} 에서 기본 연산 ${num(diff.ops)}`,
      ],
    ]);
    return [
      ...lines,
      `└ ${(diff.ops / same.ops).toFixed(1)} 배이고, log N = ${Math.log2(n)} 배가 아니라 상수 배다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양이 내려가는 걸음 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const n = 1_024;
    const cases: [string, number[]][] = [
      ["전부 같은 값", new Array<number>(n).fill(7)],
      [
        "절반씩 두 값",
        Array.from({ length: n }, (_, i) => (i < n / 2 ? 0 : 1)),
      ],
      ["등장 횟수 1·2·3", spread123(n)],
      ["전부 다른 값", Array.from({ length: n }, (_, i) => i)],
    ];
    const rows = cases.map(([name, A]) => {
      const r = bucketCost(A, 1);
      return [
        name,
        num(r.m),
        num(Math.max(...freqOf(A).values())),
        num(r.visited),
        num(r.ops),
      ];
    });
    const most = rows.reduce((a, b) =>
      toNumber(a[4]) >= toNumber(b[4]) ? a : b,
    );
    return [
      md(
        [
          "입력의 모양",
          "서로 다른 값",
          "가장 큰 등장 횟수",
          "내려간 버킷",
          "기본 연산",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `k = 1 로 두고 N = ${num(n)} 에서 쟀습니다. 가장 큰 등장 횟수가 작을수록 내려간 버킷이 많고, 기본 연산이 가장 많은 입력은 「${most[0]}」입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 제약 상한에서 최악을 실제로 만든다. */
  "worst-big": () => {
    const r = bucketCost(
      Array.from({ length: BIG_N }, (_, i) => i),
      1,
    );
    return [
      `N = ${num(BIG_N)} · A[i] = i · k = 1`,
      `  세기 ${num(r.count)} + 버킷 만들기 ${num(r.make)} + 담기 ${num(r.place)} + 내려가며 담기 ${num(r.descend)}`,
      `  합이 ${num(r.ops)} 번이고 총식의 상한 ${num(9 * BIG_N + 1)} 아래다`,
      `       └ 상한과 떨어진 것은 담은 값이 최악에서도 ${r.taken} 개뿐이기 때문이다`,
    ].join("\n");
  },

  /** `selfcheck` — 담긴 차례와 나온 차례. */
  "selfcheck-order": () => {
    const steps = walkSteps();
    const put = steps.filter((s) => s.title.startsWith("②"));
    const got = steps.filter((s) => /^[④⑤]/.test(s.title));
    const valOf = (title: string) => /값 (-?\d+)/.exec(title)?.[1] ?? "";
    const out = new Set(got.map((s) => valOf(s.title)));
    const rest = put.map((s) => valOf(s.title)).filter((v) => !out.has(v));
    const lines = columns([
      ["담긴 차례", ...put.map((s) => `${s.id} 값 ${valOf(s.title)}`)],
      ["나온 차례", ...got.map((s) => `${s.id} 값 ${valOf(s.title)}`)],
    ]);
    return [
      ...lines,
      `└ 값 ${andJoin(rest)}${은는(rest.at(-1) ?? "")} 담겼지만 답에 나오지 않는다`,
    ].join("\n");
  },

  /** `selfcheck` 답 — 등장 횟수는 그대로 두고 값만 바꾼 입력. */
  "selfcheck-swap": () => {
    const A = [4, 4, 4, 9, 9, 8, 8, 3, 5];
    const t = trace(A, 3);
    const buckets = t.places.at(-1)?.buckets ?? [];
    const used: number[] = [];
    for (let f = t.n; f >= 1; f--) {
      if ((buckets[f] ?? []).length > 0) used.push(f);
    }
    const lines = columns([
      ["버킷 번호 f", ...used.map(String)],
      ["slot[f]", ...used.map((f) => cellOf(buckets[f] ?? []))],
    ]);
    const big = Math.max(...t.result);
    const first = t.result[0] as number;
    return [
      `등장 횟수는 그대로 두고 값만 바꾼 입력   ${show(A)} · k = 3`,
      "",
      ...lines.map((l) => `  ${l}`),
      "",
      `  답은 ${t.result.join(" → ")} 차례로 나와 ${show(t.result)} 이다`,
      `  └ 값의 크기 순서라면 ${big}${이가(big)} 먼저 나와야 하는데 ${first}${이가(first)} 먼저다`,
    ].join("\n");
  },
};

/* ───────────────────────── 도움 함수 ───────────────────────── */

/** 서로 다른 등장 횟수를 가장 많이 만드는 입력. 1·2·3… 을 예산이 닿는 데까지 쓴다. */
function maxSpreadInput(n: number): number[] {
  const out: number[] = [];
  let j = 0;
  let f = 1;
  while (out.length + f <= n) {
    for (let t = 0; t < f; t++) out.push(j);
    j++;
    f++;
  }
  // 남은 칸은 이미 쓴 등장 횟수 하나에 얹지 않고, 남은 칸 수만큼인 새 값 하나로 둔다.
  const rest = n - out.length;
  for (let t = 0; t < rest; t++) out.push(j);
  return out;
}

/** 서로 다른 등장 횟수의 개수는 이 값을 넘지 못한다 — 본문 수식을 그대로 옮긴 것. */
const spreadBound = (n: number): number =>
  Math.floor((Math.sqrt(8 * n + 1) - 1) / 2);
