/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 계측과 변이는 그 소스에서 기계로 만든다.**
 * 계측 사본(`probe`)은 그림 사이드카가 정본의 줄 다섯에 기록 호출을 끼워 만들고, 변이는 그 계측
 * 사본에서 `loadMutant` 로 만든다. 그래서 변이가 낸 DP 테이블과 계수도 같은 기록으로 읽는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/tspBitmask/tspBitmask-guide.md
 *
 * **비용은 기본 연산 하나로 센다** — 칸 `(mask, v)` 를 살펴본 한 번(③ 에서 건너뛴 칸 포함) · 다음
 * 도시 후보를 살펴본 한 번(⑤ 에서 거른 후보 포함) · 복귀 비용을 더해 본 한 번. 방문 순서를 전부
 * 만드는 방법도 같은 자로 센다 — 호출(접두 경로)에 들어간 한 번 · 후보 한 번 · 복귀 한 번. 메모리는
 * DP 테이블 칸 수 × 8 바이트이고 1 MB 는 10^6 바이트다.
 *
 * **큰 입력은 셈만 하는 판(`tally`)으로 잰다.** 기록하는 판(`record`)은 칸과 후보마다 객체를 남겨서
 * 도시가 열을 넘으면 메모리가 모자란다.
 *
 * **큰 수는 `bigint` 로 센다.** 순서를 전부 만드는 방법의 기본 연산은 도시 20 개에서 19 자리라 배정밀도
 * 정수 표현 범위를 넘는다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** 중화 실행에서는
 * `loadMutant` 가 계측 사본을 그대로 돌려주므로 변이 모듈의 함수가 계측 사본과 **같은 객체**다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./tspBitmask-guide.alt.ts";
import {
  ASYM3,
  basicOps,
  bits,
  type Cand,
  CELL_BYTES,
  candsInto,
  cellCount,
  cellName,
  comma,
  countRows,
  D_LIMIT,
  dpOps,
  enumerate,
  enumerateNodes,
  enumerateOps,
  flat,
  type Impl,
  line,
  liveStates,
  MEM_LIMIT,
  MERGE5,
  maskOnly,
  N_LIMIT,
  PROBE_PATH,
  probe,
  READ_MASK,
  READ_V,
  REC,
  record,
  SHORTCUT4,
  setName,
  type Tally,
  tally,
  tourCount,
  transitionCount,
  val,
  WALK,
  WALK_FULL,
  WALK_N,
  walkSteps,
  zeroCycle,
} from "./tspBitmask-guide.fig.tsx";
import { INF, tspBitmask } from "./tspBitmask-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));
const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 글자 표. 첫 행이 머리줄이다. `right` 에 든 열은 오른쪽 정렬이다. */
function table(rows: string[][], right: readonly number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((x, c) =>
        right.includes(c) ? padLeft(x, widths[c] ?? 0) : pad(x, widths[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const row = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [row(head), row(rule), ...rows.map(row)].join("\n");
}

/** 표 아래에 실행이 낸 문장을 붙인다 — 본문은 이 블록을 `<!--/proof-->` 로 닫는다. */
const withNote = (tbl: string, note: string): string =>
  [tbl, "", note].join("\n");

/** 바이트를 MB(10^6 바이트)로 — 소수 첫째 자리까지. 0.1 MB 가 안 되면 바이트 그대로 적는다. */
const mb = (bytes: number): string =>
  bytes < 100_000
    ? `${comma(bytes)} 바이트`
    : `${(bytes / 1_000_000).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} MB`;

/** 비 — 10 배 미만은 소수 첫째 자리까지, 그 위는 반올림한 정수. */
const times = (a: number, b: number): string => {
  const r = a / b;
  return r < 10
    ? `${r.toFixed(1)} 배`
    : `${Math.round(r).toLocaleString("en-US")} 배`;
};

/* ────────────────────────── 정의대로 센다 ────────────────────────── */

/** 칸 `(mask, v)` 에 이르는 접두 경로를 전부 만든다. 도시가 적은 입력에만 쓴다. */
function prefixPaths(
  dist: number[][],
  mask: number,
  v: number,
): { path: number[]; cost: number }[] {
  const n = dist.length;
  const out: { path: number[]; cost: number }[] = [];
  const go = (m: number, here: number, path: number[], cost: number): void => {
    if (m === mask && here === v) out.push({ path: [...path], cost });
    const row = dist[here] as number[];
    for (let u = 0; u < n; u++) {
      if ((m & (1 << u)) !== 0) continue;
      const next = m | (1 << u);
      if ((next & mask) !== next) continue;
      go(next, u, [...path, u], cost + (row[u] as number));
    }
  };
  go(1, 0, [0], 0);
  return out;
}

/** 칸마다 접두 경로를 전부 만들어 구한 가장 작은 비용. 정본과 다른 방법이라 대조의 기준이 된다. */
function truePrefix(dist: number[][]): Map<string, number> {
  const n = dist.length;
  const out = new Map<string, number>();
  const go = (mask: number, v: number, cost: number): void => {
    const key = `${mask},${v}`;
    const prev = out.get(key);
    if (prev === undefined || cost < prev) out.set(key, cost);
    const row = dist[v] as number[];
    for (let u = 0; u < n; u++) {
      if ((mask & (1 << u)) !== 0) continue;
      go(mask | (1 << u), u, cost + (row[u] as number));
    }
  };
  go(1, 0, 0);
  return out;
}

/** 칸 `(mask, v)` 에서 남은 도시를 전부 들르고 도시 0 으로 돌아오는 가장 작은 비용. */
function trueRemaining(dist: number[][], mask: number, v: number): number {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const go = (m: number, here: number): number => {
    if (m === FULL) return (dist[here] as number[])[0] as number;
    let best = INF;
    const row = dist[here] as number[];
    for (let u = 0; u < n; u++) {
      if ((m & (1 << u)) !== 0) continue;
      const c = (row[u] as number) + go(m | (1 << u), u);
      if (c < best) best = c;
    }
    return best;
  };
  return go(mask, v);
}

/** 도시 `s` 를 0 번으로 옮긴 행렬 — 나머지 도시는 번호 순서를 지킨다. */
function relabel(dist: number[][], s: number): number[][] {
  const order = [s, ...dist.map((_, i) => i).filter((i) => i !== s)];
  return order.map((a) => order.map((b) => (dist[a] as number[])[b] as number));
}

/** 경로의 구간 비용. */
const legsOf = (dist: number[][], path: readonly number[]): number[] =>
  path
    .slice(1)
    .map((b, i) => (dist[path[i] as number] as number[])[b] as number);

/** ⑤ 가 참이 된 횟수 — 값이 든 칸마다 후보를 `n` 개 살펴보고 그중 전이가 되지 않은 것. */
const revisits = (t: Tally, n: number): number => t.live * n - t.transitions;

/* ────────────────────────── 자기대조 ────────────────────────── */

/** 셈과 닫힌 형태가 실행과 같은지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (let n = 2; n <= 12; n++) {
    const t = tally(line(n));
    if (t.live !== liveStates(n))
      throw new Error(`값 든 칸 닫힌 형태가 실측과 다르다 — n = ${n}`);
    if (t.transitions !== transitionCount(n))
      throw new Error(`전이 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    if (t.cells !== cellCount(n))
      throw new Error(`칸 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    if (basicOps(t, n) !== dpOps(n))
      throw new Error(`기본 연산 닫힌 형태가 실측과 다르다 — n = ${n}`);
  }
  for (let n = 2; n <= 9; n++) {
    const e = enumerate(line(n));
    if (e.answer !== tspBitmask(line(n)))
      throw new Error(
        `순서를 전부 만드는 방법이 정본과 다른 답을 낸다 — n = ${n}`,
      );
    if (BigInt(e.nodes) !== enumerateNodes(n))
      throw new Error(`호출 수 닫힌 형태가 실측과 다르다 — n = ${n}`);
    if (BigInt(e.ops) !== enumerateOps(n))
      throw new Error(
        `순서 나열 기본 연산 닫힌 형태가 실측과 다르다 — n = ${n}`,
      );
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

/** DP 테이블을 「아직 경로 없음」이 아니라 0 으로 채운 사본. */
const zeroFill = await loadMutant<Impl>(PROBE_PATH, {
  swap: [/\.fill\(INF\)/, ".fill(0)"],
});

/** 이미 들른 도시를 거르는 줄(⑤)을 지운 사본. */
const revisit = await loadMutant<Impl>(PROBE_PATH, {
  drop: /if \(\(mask & \(1 << u\)\) !== 0\) continue;/,
});

/** 복귀 계산을 도시 1 부터 하는 사본. */
const skipZero = await loadMutant<Impl>(PROBE_PATH, {
  swap: [
    /for \(let last = 0; last < n; last\+\+\) \{/,
    "for (let last = 1; last < n; last++) {",
  ],
});

/** **불변식을 지키던 줄** — 방문 집합을 오름차순이 아니라 내림차순으로 도는 사본. */
const descending = await loadMutant<Impl>(PROBE_PATH, {
  swap: [
    /for \(let mask = 1; mask <= FULL; mask\+\+\) \{/,
    "for (let mask = FULL; mask >= 1; mask--) {",
  ],
});

const MUTANT_CASES: { label: string; dist: number[][] }[] = [
  { label: "전개 입력", dist: WALK },
  { label: "비대칭 도시 셋", dist: ASYM3 },
  { label: "도시 다섯", dist: MERGE5 },
  { label: "지름길이 생기는 도시 넷", dist: SHORTCUT4 },
  { label: "도시 하나", dist: [[0]] },
];

/** 중화 실행인가 — 그때 `loadMutant` 는 계측 사본을 그대로 돌려주어 두 함수가 같은 객체다. */
const 중화됨 = zeroFill.tspBitmask === probe.tspBitmask;

if (!중화됨) {
  for (const [label, impl] of [
    ["0 으로 채운 판", zeroFill],
    ["검사를 뺀 판", revisit],
    ["도시 1 부터 더한 판", skipZero],
    ["내림차순으로 처리한 판", descending],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every((c) => tspBitmask(c.dist) === impl.tspBitmask(c.dist))
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/* ────────────────────────── 공용 값 ────────────────────────── */

const N = WALK_N;
const FULL = WALK_FULL;
const STEPS = walkSteps();
const bitsN = (m: number) => bits(m, N);

/** 방문 집합 `mask` 를 처리한 걸음의 이름 — T1 이 출발 칸이라 방문 집합 `m` 은 `T(m+1)` 이다. */
const stepOf = (mask: number): string => {
  const s = STEPS[mask];
  if (!s?.title.includes(bitsN(mask)))
    throw new Error("걸음 번호가 방문 집합과 어긋난다");
  return s.id;
};

/** 한 줄로 편 DP 테이블에서 칸 하나. */
const at = (flatDp: readonly number[], mask: number, v: number, n = N) =>
  flatDp[mask * n + v] as number;

// 걸음 이름이 방문 집합과 맞는지, 짚는 칸에 후보가 둘 이상 오는지 — 블록이 쓰기 전에 본다.
for (let m = 1; m <= FULL; m++) stepOf(m);
if (candsInto(READ_MASK, READ_V).length < 2) {
  throw new Error("짚는 칸에 후보가 둘 이상 오지 않는다");
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 전개 입력의 거리 행렬과 답. */
  "concept-matrix": () => {
    const e = enumerate(WALK);
    const ans = tspBitmask(WALK);
    return withNote(
      md(
        ["출발 도시", ...WALK.map((_, j) => `도착 ${j}`)],
        WALK.map((row, i) => [`도시 ${i}`, ...row.map(String)]),
        WALK.map((_, j) => j + 1),
      ),
      `순서 ${comma(e.tours)} 가지 가운데 비용이 가장 작은 순회는 ${e.best.join(" → ")} 이고, 비용 합은 ${legsOf(WALK, e.best).join(" + ")} = ${e.answer} 입니다. 정본 tspBitmask(전개 입력) 이 낸 값도 ${ans} 입니다.`,
    );
  },

  /** `concept` — 순서의 수와 DP 테이블 칸 수. */
  "concept-size": () =>
    table(
      [
        ["도시 n", "방문 순서 (n-1)!", "DP 테이블 칸 2^n·n"],
        ...[WALK_N, N_LIMIT].map((n) => [
          String(n),
          comma(tourCount(n)),
          comma(cellCount(n)),
        ]),
      ],
      [0, 1, 2],
    ).join("\n"),

  /** `deep.origin` ② — 전개 입력의 순서를 전부 만든다. */
  "origin-orders": () => {
    const e = enumerate(WALK);
    return [
      ...table(
        [
          ["방문 순서", "구간 비용", "합계"],
          ...e.detail.map((d) => [
            d.order.join(" → "),
            d.legs.join(" + "),
            comma(d.total),
          ]),
        ],
        [2],
      ),
      "",
      `순서 ${comma(e.tours)} 개 · 호출 ${comma(e.nodes)} 번 · 기본 연산 ${comma(e.ops)} 번`,
      `가장 작은 합계 ${comma(e.answer)}`,
    ].join("\n");
  },

  /** `deep.origin` ② — 도시 수를 늘리며 두 방법의 기본 연산을 센다. */
  "origin-scale": () => {
    const rows = [4, 6, 8, 10].map((n) => {
      const e = enumerate(line(n));
      const d = basicOps(tally(line(n)), n);
      return [
        String(n),
        comma(e.tours),
        comma(e.ops),
        comma(d),
        times(e.ops, d),
      ];
    });
    const naive = enumerateOps(N_LIMIT);
    const dp = dpOps(N_LIMIT);
    const years = Number(naive) / 1e8 / (365.25 * 24 * 3600);
    return [
      ...table(
        [
          [
            "도시 n",
            "순서 (n-1)!",
            "순서 나열의 기본 연산",
            "DP 테이블의 기본 연산",
            "비",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `도시 ${N_LIMIT} 개에서 (닫힌 식으로 센 값)`,
      ...table([
        [
          "  순서 나열의 기본 연산",
          `${comma(naive)} (${naive.toString().length} 자리)`,
        ],
        ["  DP 테이블의 기본 연산", `${comma(dp)} (${String(dp).length} 자리)`],
        [
          "  1 초에 1 억 번으로 어림하면",
          `순서 나열 약 ${comma(Math.round(years))} 년 · DP 테이블 약 ${(dp / 1e8).toFixed(2)} 초`,
        ],
      ]),
    ].join("\n");
  },

  /** `deep.origin` ③ — 순서가 다른 두 접두 경로가 같은 칸으로 모인다. */
  "origin-order-free": () => {
    const n = MERGE5.length;
    const mask = 0b01111;
    const v = 3;
    const paths = prefixPaths(MERGE5, mask, v).filter(
      (p) => p.path.join() === "0,1,2,3" || p.path.join() === "0,2,1,3",
    );
    const remaining = trueRemaining(MERGE5, mask, v);
    const kept = Math.min(...paths.map((p) => p.cost));
    const t12 = tally(line(12));
    const nodes = enumerateNodes(12);
    return [
      ...table(
        [
          [
            "접두 경로",
            "들른 도시",
            "지금 도시",
            "접두 비용",
            "남은 최소 비용",
            "합",
          ],
          ...paths.map((p) => [
            p.path.join(" → "),
            `${bits(mask, n)} ${setName(mask, n)}`,
            String(v),
            comma(p.cost),
            comma(remaining),
            comma(p.cost + remaining),
          ]),
        ],
        [2, 3, 4, 5],
      ),
      "",
      `남은 최소 비용이 두 줄 모두 ${comma(remaining)} — 접두 비용이 큰 쪽은 어떤 순회에서도 답이 못 된다`,
      `칸 (${bits(mask, n)}, ${v}) 에 남길 값은 ${comma(kept)} 하나`,
      "",
      `도시 12 개(생성식 행렬)에서 순서 나열의 호출 ${comma(nodes)} 번이`,
      `값이 든 칸 ${comma(t12.live)} 개로 모인다 — ${times(Number(nodes), t12.live)}`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 지금 도시를 빼고 방문 집합만 칸으로 삼으면. */
  "origin-mask-only": () => {
    const rows: [string, number[][]][] = [
      ["전개 입력 (도시 넷)", WALK],
      ["지름길이 생기는 도시 넷", SHORTCUT4],
      ["생성식 도시 여섯", line(6)],
      ["생성식 도시 여덟", line(8)],
      ["비대칭 도시 셋", ASYM3],
    ];
    return [
      ...table(
        [
          ["입력", "정본", "들른 집합만 둔 판", "차이"],
          ...rows.map(([label, dist]) => {
            const a = tspBitmask(dist);
            const b = maskOnly(dist);
            return [label, comma(a), comma(b), comma(a - b)];
          }),
        ],
        [1, 2, 3],
      ),
      "",
      "들른 집합만 둔 판은 집합 안의 어느 도시에서든 출발할 수 있는 것처럼 세므로",
      "하나의 경로로 이어지지 않는 구간을 골라 답보다 작은 값을 낸다",
    ].join("\n");
  },

  /** `deep.build` 1단계 — DP 테이블의 크기와 메모리. */
  "build-size": () => {
    const rows = [WALK_N, 12, N_LIMIT, N_LIMIT + 1].map((n) => {
      const cells = cellCount(n);
      const live =
        n <= 12 ? comma(tally(line(n)).live) : `${comma(liveStates(n))} (식)`;
      const bytes = cells * CELL_BYTES;
      return [
        String(n),
        comma(2 ** n),
        comma(cells),
        live,
        mb(bytes),
        bytes <= MEM_LIMIT ? "든다" : "넘는다",
      ];
    });
    const walkCells = REC.final.length;
    return withNote(
      md(
        [
          "도시 n",
          "줄 2^n",
          "칸 2^n·n",
          "값이 든 칸",
          `칸마다 ${CELL_BYTES} 바이트`,
          "256 MB 예산",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `전개 입력에서 정본이 잡은 DP 테이블은 ${comma(walkCells / N)} 줄 × ${N} 칸, 모두 ${comma(walkCells)} 칸이고 값이 든 칸은 ${comma(REC.final.filter((x) => x !== INF).length)} 개입니다.`,
    );
  },

  /** `deep.build` 먼저 알아 둘 개념 (b) — 줄마다 들른 도시와 값이 든 칸. */
  "build-rows": () => {
    const rows: string[][] = [];
    let withZero = 0;
    for (let m = 0; m <= FULL; m++) {
      const inside: number[] = [];
      const filled: number[] = [];
      for (let v = 0; v < N; v++) {
        if ((m & (1 << v)) === 0) continue;
        inside.push(v);
        if (at(REC.final, m, v) !== INF) filled.push(v);
      }
      if ((m & 1) !== 0) withZero++;
      rows.push([
        bitsN(m),
        setName(m, N),
        inside.length > 0 ? inside.join(" · ") : "없음",
        filled.length > 0
          ? filled.map((v) => `v=${v}: ${val(at(REC.final, m, v))}`).join(" · ")
          : "없음",
      ]);
    }
    const live = REC.final.filter((x) => x !== INF).length;
    return withNote(
      md(["줄", "들른 도시", "지금 도시가 될 수 있는 열", "값이 든 칸"], rows),
      `${FULL + 1} 줄 가운데 도시 0 을 담은 줄이 ${withZero} 줄이고, 값이 든 칸은 모두 ${live} 개입니다.`,
    );
  },

  /** `deep.build` 먼저 알아 둘 개념 (c) — 칸 하나를 이름에서 경로까지. */
  "build-read-one": () => {
    const paths = prefixPaths(WALK, READ_MASK, READ_V);
    const best = Math.min(...paths.map((p) => p.cost));
    const got = at(REC.final, READ_MASK, READ_V);
    return withNote(
      md(
        ["접두 경로", "구간 비용", "비용 합"],
        paths.map((p) => [
          p.path.join(" → "),
          legsOf(WALK, p.path).join(" + "),
          comma(p.cost),
        ]),
        [2],
      ),
      `들른 도시가 ${setName(READ_MASK, N)} 이고 도시 ${READ_V} 에서 끝나는 접두 경로는 ${paths.length} 개이고, 가장 작은 것이 ${comma(best)} 입니다. DP 테이블의 ${cellName(READ_MASK, READ_V, N)} 도 ${val(got)} 입니다.`,
    );
  },

  /** `deep.build` 먼저 알아 둘 개념 (d) — 칸 하나가 기대는 칸. */
  "build-relation": () => {
    const prev = READ_MASK ^ (1 << READ_V);
    const rows: string[][] = [];
    const sums: number[] = [];
    for (let w = 0; w < N; w++) {
      if ((prev & (1 << w)) === 0) continue;
      const stored = at(REC.final, prev, w);
      const edge = (WALK[w] as number[])[READ_V] as number;
      sums.push(stored + edge);
      rows.push([
        String(w),
        cellName(prev, w, N),
        val(stored),
        String(edge),
        val(stored + edge),
      ]);
    }
    const best = val(Math.min(...sums));
    const got = val(at(REC.final, READ_MASK, READ_V));
    return withNote(
      md(
        [
          "바로 앞 도시 w",
          "기대는 칸",
          "그 칸의 값",
          `dist[w][${READ_V}]`,
          "합",
        ],
        rows,
        [0, 2, 3, 4],
      ),
      `도시 ${READ_V} 를 끈 줄 ${bitsN(prev)} 의 칸 ${rows.length} 개에 이동 비용을 더한 합 가운데 가장 작은 것이 ${best} 이고, ${cellName(READ_MASK, READ_V, N)} 의 값 ${got}${과와(got)} 같습니다.`,
    );
  },

  /** `deep.build` 먼저 알아 둘 개념 (e) — 줄을 움직인 횟수로 두면. */
  "build-contrast": () => {
    const rows: [string, number[][]][] = [
      ["전개 입력", WALK],
      ["비대칭 도시 셋", ASYM3],
      ["지름길이 생기는 도시 넷", SHORTCUT4],
      ["도시 다섯", MERGE5],
    ];
    let wrong = 0;
    const body = rows.map(([label, dist]) => {
      const n = dist.length;
      const a = tspBitmask(dist);
      const r = countRows(dist);
      if (r.answer < a) wrong++;
      return [
        label,
        comma(cellCount(n)),
        comma(a),
        comma(n * n),
        comma(r.answer),
        r.walk.join(" → "),
      ];
    });
    return withNote(
      md(
        [
          "입력",
          "DP 테이블 칸",
          "DP 테이블의 답",
          "움직인 횟수 판의 칸",
          "움직인 횟수 판의 답",
          "답의 이동 순서",
        ],
        body,
        [1, 2, 3, 4],
      ),
      `${rows.length} 입력 가운데 ${wrong} 입력에서 움직인 횟수 판의 답이 DP 테이블의 답보다 작습니다.`,
    );
  },

  /** `deep.build` 2단계 — 전이의 도착 줄이 언제나 출발 줄보다 뒤다. */
  "build-order": () => {
    const rows: [string, number[][]][] = [
      ["전개 입력", WALK],
      ["도시 다섯", MERGE5],
      ["생성식 도시 여덟", line(8)],
    ];
    let total = 0;
    let later = 0;
    const body = rows.map(([label, dist]) => {
      const r = record(dist);
      const k = r.cands.filter((c) => c.next > c.mask).length;
      const gap = Math.min(...r.cands.map((c) => c.next - c.mask));
      total += r.cands.length;
      later += k;
      return [label, comma(r.cands.length), comma(k), comma(gap)];
    });
    return withNote(
      md(
        [
          "입력",
          "전이",
          "도착 줄이 출발 줄보다 뒤인 전이",
          "줄 번호 차이의 최솟값",
        ],
        body,
        [1, 2, 3],
      ),
      `전이 ${comma(total)} 개 가운데 도착 줄 번호가 출발 줄 번호보다 큰 것이 ${comma(later)} 개입니다.`,
    );
  },

  /** `deep.build` 2단계 — 같은 칸에 후보가 둘 온 자리. */
  "build-merges": () => {
    const byCell = new Map<string, Cand[]>();
    for (const c of REC.cands) {
      const key = `${c.next},${c.u}`;
      byCell.set(key, [...(byCell.get(key) ?? []), c]);
    }
    const rows: string[][] = [];
    for (const cs of byCell.values()) {
      if (cs.length < 2) continue;
      const [a, b] = cs as [Cand, Cand];
      rows.push([
        stepOf(a.mask),
        cellName(a.next, a.u, N),
        `${cellName(a.mask, a.v, N)} 에서 ${val(a.cand)}`,
        `${cellName(b.mask, b.v, N)} 에서 ${val(b.cand)}`,
        val(at(REC.final, a.next, a.u)),
      ]);
    }
    return withNote(
      md(["걸음", "도착 칸", "먼저 온 후보", "나중 온 후보", "남은 값"], rows),
      `전이 ${comma(REC.cands.length)} 개가 칸 ${comma(byCell.size)} 개에 들어갔고, 후보가 둘 온 칸이 ${rows.length} 개입니다.`,
    );
  },

  /** `deep.build` 3단계 — 모든 도시를 들른 줄에서 복귀 비용을 더한다. */
  "build-return": () =>
    [
      ...table(
        [
          ["마지막 도시", "칸", "칸의 값", "복귀 비용", "순회 비용"],
          ...REC.rets.map((r) => [
            String(r.last),
            cellName(FULL, r.last, N),
            val(r.stored),
            comma(r.back),
            val(r.total),
          ]),
        ],
        [0, 2, 3, 4],
      ),
      "",
      `가장 작은 순회 비용 ${comma(REC.answer)}`,
    ].join("\n"),

  /** `deep.build` 전제 — 도시 수를 올리면 무엇이 먼저 막는가. */
  "build-premise-bits": () => {
    const rows = [N_LIMIT, N_LIMIT + 1, 30, 31, 32].map((n) => {
      const shift = 1 << n;
      const full = shift - 1;
      const cells = (full + 1) * n;
      const bytes = cells * CELL_BYTES;
      let note: string;
      if (full < 0) note = "FULL 이 음수 — 칸 수가 음수가 된다";
      else if (full + 1 !== 2 ** n) note = "1 << n 이 2^n 이 아니다";
      else if (bytes > MEM_LIMIT) note = "집합 표기는 되지만 256 MB 를 넘는다";
      else note = "집합 표기가 되고 256 MB 안에 든다";
      return [
        String(n),
        comma(shift),
        comma(full),
        comma(cells),
        bytes < 0 ? "—" : mb(bytes),
        note,
      ];
    });
    const call = (n: number): string => {
      try {
        const r = val(tspBitmask(flat(n)));
        return `${r}${r === "INF" ? " 를" : 을를(r)} 돌려준다`;
      } catch (e) {
        return `${(e as Error).constructor.name} 를 던진다`;
      }
    };
    return [
      ...table(
        [["도시 n", "1 << n", "FULL", "칸 수", "메모리", "되는 일"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      "모든 거리가 1 인 행렬로 실제로 불러 보면",
      ...table([
        ["  도시 31", call(31)],
        ["  도시 32", call(32)],
      ]),
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 출발 도시를 0 으로 고정해도 답이 같은가, 그 값은 무엇인가. */
  "build-fix-start": () => {
    const rows = WALK.map((_, s) => {
      const t = tally(relabel(WALK, s));
      return [`도시 ${s}`, comma(t.answer), comma(t.live)];
    });
    const dead = 2 ** (N_LIMIT - 1);
    return withNote(
      md(
        ["출발 도시", "비용이 가장 작은 순회 비용", "값이 든 칸"],
        rows,
        [1, 2],
      ),
      `출발 도시 ${rows.length} 가지의 순회 비용이 모두 ${rows[0]?.[1]} 입니다. 도시 0 을 담지 않은 줄은 전개 입력에서 ${comma(2 ** (N - 1))} 줄이고, 도시 ${N_LIMIT} 개에서는 ${comma(dead)} 줄 · ${mb(dead * N_LIMIT * CELL_BYTES)} 입니다.`,
    );
  },

  /** `deep.walk` 도입 — 전개 입력과 끝에 나와야 할 값. */
  "walk-input": () =>
    [
      "const dist = [",
      ...WALK.map((r) => `  [${r.join(", ")}],`),
      "];",
      `// 이 절이 끝나면 ${tspBitmask(WALK)} 이 나와야 한다`,
    ].join("\n"),

  /** `deep.walk` 도입 — 도시 넷이어야 같은 칸으로 모이는 자리가 나온다. */
  "walk-why-four": () => {
    const rows: [string, number[][]][] = [
      ["비대칭 도시 셋", ASYM3],
      ["모든 거리가 1 인 도시 셋", flat(3)],
      ["전개 입력 (도시 넷)", WALK],
    ];
    const body = rows.map(([label, dist]) => {
      const r = record(dist);
      const seen = new Map<string, number>();
      for (const c of r.cands) {
        const key = `${c.next},${c.u}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      const twice = [...seen.values()].filter((k) => k >= 2).length;
      return [label, String(dist.length), comma(r.cands.length), comma(twice)];
    });
    return withNote(
      md(["입력", "도시 수", "전이", "후보가 둘 이상 온 칸"], body, [1, 2, 3]),
      `도시 셋인 입력 둘에서는 후보가 둘 이상 온 칸이 ${body[0]?.[3]} 개와 ${body[1]?.[3]} 개이고, 전개 입력에서는 ${body[2]?.[3]} 개입니다.`,
    );
  },

  /** `deep.walk` 1 — 출발 칸을 놓은 직후. */
  "walk-init": () => {
    const cells = REC.init.length;
    const filled = REC.init.filter((x) => x !== INF).length;
    return table([
      ["n", String(N)],
      ["FULL", `${bitsN(FULL)} = ${FULL}`],
      ["칸 수", `(${FULL} + 1) × ${N} = ${cells}`],
      ["값이 든 칸", `${cellName(1, 0, N)} = ${val(at(REC.init, 1, 0))}`],
      ["INF 인 칸", comma(cells - filled)],
    ]).join("\n");
  },

  /** `deep.walk` 2 — 첫 방문 집합 하나만 처리한 결과. */
  "walk-t2": () => {
    const mask = 1;
    const live = REC.visits.filter((x) => x.mask === mask && x.cur !== INF);
    const cs = REC.cands.filter((c) => c.mask === mask);
    const skipped = live.length * N - cs.length;
    return [
      `${stepOf(mask)} — 방문 집합 ${bitsN(mask)} 에서`,
      `  값이 든 칸  ${live.map((x) => `${cellName(mask, x.v, N)} = ${val(x.cur)}`).join(" · ")}`,
      "",
      ...cs.map((c) => {
        const e = (WALK[c.v] as number[])[c.u] as number;
        return `  u = ${c.u}   next = ${bitsN(c.next)}   ${val(c.cand - e)} + dist[${c.v}][${c.u}] = ${val(c.cand)}   ->  ${cellName(c.next, c.u, N)} = ${val(c.cand)}`;
      }),
      "",
      `  ⑤ 가 거른 후보 ${skipped} 개 — u = 0 은 이미 mask 안에 있다`,
    ].join("\n");
  },

  /** 짚고 가기 — DP 테이블을 0 으로 채우면. */
  "pause-zero-fill": () =>
    table(
      [
        ["입력", "정본", "0 으로 채운 판", "판정"],
        ...MUTANT_CASES.map((c) => {
          const a = tspBitmask(c.dist);
          const b = zeroFill.tspBitmask(c.dist);
          return [c.label, val(a), val(b), a === b ? "같다" : "다르다"];
        }),
      ],
      [1, 2],
    ).join("\n"),

  /** 짚고 가기 — 0 으로 채운 판에서 ④ 가 무엇을 못 하게 되는가. */
  "pause-zero-fill-state": () =>
    [
      ...table(
        [
          [
            "입력",
            "④ 가 참 (정본)",
            "④ 가 참 (0 으로 채운 판)",
            "정본의 dp[FULL][0]",
            "0 으로 채운 판의 dp[FULL][0]",
          ],
          ...MUTANT_CASES.map((c) => {
            const n = c.dist.length;
            const full = (1 << n) - 1;
            return [
              c.label,
              comma(tally(c.dist).unreached),
              comma(tally(c.dist, zeroFill).unreached),
              val(at(record(c.dist).final, full, 0, n)),
              val(at(record(c.dist, zeroFill).final, full, 0, n)),
            ];
          }),
        ],
        [1, 2, 3, 4],
      ),
      "",
      "0 으로 채운 판에서는 ④ 가 한 번도 참이 되지 않는다 — 모든 칸이 비용 0 으로 이른 칸이 된다",
      "그래서 마지막 반복이 도시 0 자리의 0 을 그대로 골라 온다",
    ].join("\n"),

  /** `deep.walk` 3 — 모든 도시를 들른 방문 집합에서 ⑤ 가 후보를 전부 거른다. */
  "walk-t16": () => {
    const live = REC.visits.filter((x) => x.mask === FULL && x.cur !== INF);
    const cs = REC.cands.filter((c) => c.mask === FULL);
    const lines = [
      `${stepOf(FULL)} — 방문 집합 ${bitsN(FULL)} 에서`,
      `  값이 든 칸  ${live.map((x) => `${cellName(FULL, x.v, N)} = ${val(x.cur)}`).join(" · ")}`,
      "",
    ];
    for (let u = 0; u < N; u++) {
      const hit = (FULL & (1 << u)) !== 0;
      lines.push(
        `  u = ${u}   ${bitsN(FULL)} & ${bitsN(1 << u)} ${hit ? "!= 0" : "= 0"}   ${hit ? "거른다" : "남긴다"}`,
      );
    }
    lines.push(
      "",
      `  값이 든 칸 ${live.length} 개에서 후보 ${live.length * N} 개를 살펴보고 전이 ${cs.length} 개`,
    );
    return lines.join("\n");
  },

  /** 짚고 가기 — 이미 들른 도시 검사를 빼면. */
  "pause-revisit": () =>
    table(
      [
        ["입력", "정본", "검사를 뺀 판", "⑤ 가 참이 된 횟수", "판정"],
        ...MUTANT_CASES.map((c) => {
          const a = tspBitmask(c.dist);
          const b = revisit.tspBitmask(c.dist);
          return [
            c.label,
            val(a),
            val(b),
            comma(revisits(tally(c.dist), c.dist.length)),
            a === b ? "같다" : "다르다",
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n"),

  /** 짚고 가기 — 검사를 뺀 판의 DP 테이블에서 값이 갈린 칸의 수. */
  "pause-revisit-cells": () =>
    table(
      [
        ["입력", "칸 수", "정본과 값이 어긋난 칸"],
        ...MUTANT_CASES.map((c) => {
          const a = record(c.dist).final;
          const b = record(c.dist, revisit).final;
          return [
            c.label,
            comma(a.length),
            comma(a.filter((x, i) => x !== b[i]).length),
          ];
        }),
      ],
      [1, 2],
    ).join("\n"),

  /** 짚고 가기 — 검사를 뺀 판의 DP 테이블이 어디서 갈리는가. */
  "pause-revisit-rows": () => {
    const n = SHORTCUT4.length;
    const a = record(SHORTCUT4);
    const b = record(SHORTCUT4, revisit);
    const rows: string[][] = [];
    for (let m = 1; m <= (1 << n) - 1; m++) {
      const x = Array.from({ length: n }, (_, v) => at(a.final, m, v, n));
      const y = Array.from({ length: n }, (_, v) => at(b.final, m, v, n));
      rows.push([
        bits(m, n),
        x.map(val).join(" "),
        y.map(val).join(" "),
        x.every((q, i) => q === y[i]) ? "같다" : "다르다",
      ]);
    }
    return [
      ...table([["방문 집합", "정본", "검사를 뺀 판", "판정"], ...rows]),
      "",
      `반환값 — 정본 ${val(a.answer)} · 검사를 뺀 판 ${val(b.answer)}`,
      "칸 안의 값은 지금 도시 v = 0 · 1 · 2 · 3 순서",
    ].join("\n");
  },

  /** `deep.walk` 4 — 비대칭 행렬에서 복귀 계산. */
  "walk-return-asym": () => {
    const r = record(ASYM3);
    const n = ASYM3.length;
    const full = (1 << n) - 1;
    return [
      ...table(
        [
          ["마지막 도시", "칸", "칸의 값", "복귀 비용", "순회 비용"],
          ...r.rets.map((x) => [
            String(x.last),
            cellName(full, x.last, n),
            val(x.stored),
            comma(x.back),
            val(x.total),
          ]),
        ],
        [0, 2, 3, 4],
      ),
      "",
      `반환값 ${val(r.answer)}`,
    ].join("\n");
  },

  /** 짚고 가기 — 복귀 반복을 도시 1 부터 하면. */
  "pause-skip-zero": () =>
    table(
      [
        ["입력", "도시 수", "정본", "도시 1 부터 더한 판", "판정"],
        ...MUTANT_CASES.map((c) => {
          const a = tspBitmask(c.dist);
          const b = skipZero.tspBitmask(c.dist);
          return [
            c.label,
            String(c.dist.length),
            val(a),
            val(b),
            a === b ? "같다" : "다르다",
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n"),

  /** 짚고 가기 — 복귀 반복에 들어간 횟수. */
  "pause-skip-zero-count": () =>
    table(
      [
        ["입력", "정본의 복귀 계산", "도시 1 부터 더한 판의 복귀 계산"],
        ...MUTANT_CASES.map((c) => [
          c.label,
          `${tally(c.dist).returns} 번`,
          `${tally(c.dist, skipZero).returns} 번`,
        ]),
      ],
      [1, 2],
    ).join("\n"),

  /** 짚고 가기 — 마지막 방문 집합에서 도시 0 자리의 값. */
  "pause-skip-zero-rows": () =>
    table(
      [
        ["입력", "도시 수", "칸", "칸의 값", "하는 일"],
        ...(
          [
            ["전개 입력", WALK],
            ["비대칭 도시 셋", ASYM3],
            ["도시 하나", [[0]]],
          ] as [string, number[][]][]
        ).map(([label, dist]) => {
          const n = dist.length;
          const full = (1 << n) - 1;
          const stored = (record(dist).rets[0] as { stored: number }).stored;
          return [
            label,
            String(n),
            cellName(full, 0, n),
            val(stored),
            stored === INF ? "답에 못 든다" : "이 값이 곧 답이다",
          ];
        }),
      ],
      [1, 3],
    ).join("\n"),

  /** `deep.walk` 5 — 걸음마다 분기 조건을 실제 값으로. */
  "walk-trace": () => {
    const rows: string[][] = [];
    rows.push([
      STEPS[0]?.id ?? "",
      "—",
      "—",
      "—",
      "—",
      `①② ${cellName(1, 0, N)} = ${val(at(REC.init, 1, 0))}`,
    ]);
    for (let mask = 1; mask <= FULL; mask++) {
      const vs = REC.visits.filter((x) => x.mask === mask);
      const outside = REC.outside.filter((m) => m === mask).length;
      const outV = Array.from({ length: N }, (_, v) => v).filter(
        (v) => (mask & (1 << v)) === 0,
      );
      if (outV.length !== outside)
        throw new Error("③ 의 기록이 방문 집합과 어긋난다");
      const unreached = vs.filter((x) => x.cur === INF).map((x) => x.v);
      const live = vs.filter((x) => x.cur !== INF);
      const cs = REC.cands.filter((c) => c.mask === mask);
      rows.push([
        stepOf(mask),
        bitsN(mask),
        outV.length > 0 ? `v = ${outV.join(" · ")}` : "없음",
        unreached.length > 0 ? `v = ${unreached.join(" · ")}` : "없음",
        String(live.length * N - cs.length),
        cs.length === 0
          ? "없음"
          : cs
              .map(
                (c) =>
                  `v=${c.v}→u=${c.u}: \`${val(c.cand)} < ${val(c.old)}\` ${c.kept ? "참" : "거짓"}`,
              )
              .join(" · "),
      ]);
    }
    let answer = INF;
    const rets = REC.rets.map((r) => {
      const ok = r.total < answer;
      const s = `last=${r.last}: ${val(r.stored)} + ${r.back} = ${val(r.total)}, \`${val(r.total)} < ${val(answer)}\` ${ok ? "참" : "거짓"}`;
      if (ok) answer = r.total;
      return s;
    });
    rows.push([
      STEPS.at(-1)?.id ?? "",
      bitsN(FULL),
      "—",
      "—",
      "—",
      `⑦ ${rets.join(" · ")}`,
    ]);
    const t = tally(WALK);
    return withNote(
      md(
        [
          "단계",
          "방문 집합",
          "③ 이 참인 칸",
          "④ 가 참인 칸",
          "⑤ 가 참인 후보 수",
          "⑥ 의 비교",
        ],
        rows,
        [4],
      ),
      `③ 이 ${t.outside} 번, ④ 가 ${t.unreached} 번, ⑤ 가 ${revisits(t, N)} 번 참이고, 전이 ${t.transitions} 개 가운데 ⑥ 이 참인 것이 ${t.updates} 개, 거짓인 것이 ${t.transitions - t.updates} 개입니다. 반환값은 ${t.answer} 입니다.`,
    );
  },

  /** `deep.walk` 5 — 일곱 갈래가 입력마다 몇 번씩 실행되는가. */
  "walk-branches": () => {
    const counts = (t: Tally, n: number) => [
      t.starts,
      t.starts,
      t.outside,
      t.unreached,
      revisits(t, n),
      t.updates,
      t.returns,
    ];
    const a = counts(tally(WALK), WALK_N);
    const b = counts(tally([[0]]), 1);
    const names = [
      "DP 테이블을 잡는다",
      "출발 칸을 놓는다",
      "위치가 방문 집합 밖",
      "칸이 아직 INF",
      "이미 들른 도시",
      "값을 더 작은 것으로 바꾼다",
      "복귀 비용을 더한다",
    ];
    const marks = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];
    return table(
      [
        ["라벨", "갈래", "전개 입력", "도시 하나"],
        ...names.map((nm, i) => [
          marks[i] as string,
          nm,
          comma(a[i] as number),
          comma(b[i] as number),
        ]),
      ],
      [2, 3],
    ).join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": () => {
    const inputs = [WALK, ASYM3, flat(2, 5), [[0]]];
    const shown = inputs.map(
      (d) => `tspBitmask(${JSON.stringify(d).replaceAll(",", ", ")})`,
    );
    const w = Math.max(...shown.map((s) => s.length));
    return inputs
      .map(
        (d, i) => `${(shown[i] as string).padEnd(w)}  -> ${val(tspBitmask(d))}`,
      )
      .join("\n");
  },

  /** `related` — 집합이 정수가 되고 그 정수가 칸 번호가 된다. */
  "related-index": () => {
    const masks = [0b0011, 0b1011, FULL];
    return withNote(
      md(
        ["들른 도시", "이진 표기", "정수 mask", "칸 번호 mask·n + v"],
        masks.map((m) => [
          setName(m, N),
          bitsN(m),
          String(m),
          `${m * N} ~ ${m * N + N - 1}`,
        ]),
        [2],
      ),
      `전개 입력의 DP 테이블은 칸 ${comma(REC.final.length)} 개를 한 줄로 펴서 잡고, 방문 집합 하나가 이어진 칸 ${N} 개를 차지합니다.`,
    );
  },

  /** `purpose.alt` — 두 설계를 같은 입력 · 같은 기본 연산으로 잰다. */
  "alt-bench": () => {
    const dp = altCases["DP 테이블"]();
    const bb = altCases["분기 한정"]();
    const cross = altCases.경계();
    const labels = [
      "전개 입력",
      "격자 좌표 도시 12",
      "격자 좌표 도시 20",
      "모든 거리가 같은 도시 12",
    ];
    const rows = labels.map((l) => {
      const a = dp[`${l} · 기본 연산`] as number;
      const b = bb[`${l} · 기본 연산`] as number;
      return [
        l,
        comma(a),
        comma(b),
        a < b
          ? `DP 테이블이 ${times(b, a)} 적다`
          : `분기 한정이 ${times(a, b)} 적다`,
      ];
    });
    const memA = dp["격자 좌표 도시 20 · 추가 칸"] as number;
    const memB = bb["격자 좌표 도시 20 · 추가 칸"] as number;
    return withNote(
      md(
        ["입력", "DP 테이블 기본 연산", "분기 한정 기본 연산", "적은 쪽"],
        rows,
        [1, 2],
      ),
      `모든 거리가 같은 행렬에서 도시 수를 늘리면 분기 한정이 적은 마지막 도시 수가 ${cross["모든 거리가 같은 행렬에서 분기 한정이 앞서는 마지막 도시 수"]} 개, DP 테이블이 적은 첫 도시 수가 ${cross["DP 테이블이 앞서는 첫 도시 수"]} 개입니다. 격자 좌표 도시 20 개에서 추가 칸은 DP 테이블 ${comma(memA as number)} 칸, 분기 한정 ${comma(memB as number)} 칸입니다.`,
    );
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 계산한다. */
  "math-check": () => {
    const mask = FULL;
    const v = 1;
    const paths = prefixPaths(WALK, mask, v);
    const best = Math.min(...paths.map((p) => p.cost));
    return [
      `S = ${setName(mask, N)} · v = ${v}${을를(String(v))} 정의에 넣는다`,
      "",
      ...paths.map(
        (p) =>
          `  ${p.path.join(" → ")}   ${legsOf(WALK, p.path).join(" + ")} = ${p.cost}`,
      ),
      "",
      `  가장 작은 값 ${best} — DP 테이블의 ${cellName(mask, v, N)} = ${val(at(REC.final, mask, v))}`,
    ].join("\n");
  },

  /** `deep.math` ③ — 점화식을 같은 칸에 넣어 계산한다. */
  "math-recurrence": () => {
    const mask = FULL;
    const v = 1;
    const prev = mask ^ (1 << v);
    const lines: string[] = [];
    const sums: number[] = [];
    for (let w = 0; w < N; w++) {
      if ((prev & (1 << w)) === 0) continue;
      const s = at(REC.final, prev, w);
      const e = (WALK[w] as number[])[v] as number;
      sums.push(s + e);
      lines.push(
        `  w = ${w}   ${cellName(prev, w, N)} + dist[${w}][${v}] = ${val(s)} + ${e} = ${val(s + e)}`,
      );
    }
    return [
      `S ∖ {${v}} = ${setName(prev, N)} 의 w 마다`,
      ...lines,
      "",
      `  최솟값 ${val(Math.min(...sums))} — ${cellName(mask, v, N)} = ${val(at(REC.final, mask, v))}`,
    ].join("\n");
  },

  /** `deep.math` ③ — 값이 든 칸 · 전이 · 기본 연산의 닫힌 형태가 실측과 맞는가. */
  "math-count": () =>
    table(
      [
        [
          "도시 n",
          "값이 든 칸",
          "1+(n-1)2^(n-2)",
          "전이",
          "(n-1)+(n-1)(n-2)2^(n-3)",
          "기본 연산",
          "닫힌 식",
        ],
        ...[4, 8, 12, 16].map((n) => {
          const t = tally(line(n));
          return [
            String(n),
            comma(t.live),
            comma(liveStates(n)),
            comma(t.transitions),
            comma(transitionCount(n)),
            comma(basicOps(t, n)),
            comma(dpOps(n)),
          ];
        }),
      ],
      [0, 1, 2, 3, 4, 5, 6],
    ).join("\n"),

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣는다. */
  "math-scale": () => {
    const rows = [10, 15, 18, N_LIMIT].map((n) => {
      const a = enumerateOps(n);
      return [
        String(n),
        comma(dpOps(n)),
        comma(a),
        `${a.toString().length} 자리`,
      ];
    });
    const ratio = enumerateOps(N_LIMIT) / BigInt(dpOps(N_LIMIT));
    return [
      ...table(
        [
          [
            "도시 n",
            "DP 테이블의 기본 연산",
            "순서 나열의 기본 연산",
            "그 자릿수",
          ],
          ...rows,
        ],
        [0, 1, 2, 3],
      ),
      "",
      `도시 ${N_LIMIT} 개에서 두 값의 비는 약 ${comma(ratio)} 배`,
      `거리의 위 끝이 ${comma(D_LIMIT)} 이라 순회 하나의 비용은 최대 ${comma(N_LIMIT * D_LIMIT)} 이고`,
      `배정밀도로 정확히 적는 정수의 위 끝 ${comma(Number.MAX_SAFE_INTEGER)} 보다 ${comma(Math.floor(Number.MAX_SAFE_INTEGER / (N_LIMIT * D_LIMIT)))} 배 넘게 작다`,
    ].join("\n");
  },

  /** 불변식 ② — 칸마다 DP 테이블 값과 따로 구한 가장 작은 값. */
  "invariant-watch": () => {
    const truth = truePrefix(WALK);
    const rows: string[][] = [];
    let bad = 0;
    for (let m = 1; m <= FULL; m++) {
      for (let v = 0; v < N; v++) {
        const got = at(REC.final, m, v);
        const want = truth.get(`${m},${v}`);
        if (got === INF && want === undefined) continue;
        if (got !== want) bad++;
        rows.push([
          bitsN(m),
          String(v),
          val(got),
          want === undefined ? "없음" : comma(want),
          got === want ? "같다" : "다르다",
        ]);
      }
    }
    return [
      ...table(
        [
          [
            "방문 집합",
            "지금 도시",
            "DP 테이블 값",
            "따로 구한 최솟값",
            "판정",
          ],
          ...rows,
        ],
        [1, 2, 3],
      ),
      "",
      `값이 든 칸 ${rows.length} 개 · 따로 구한 값과 어긋난 칸 ${bad} 개`,
      `나머지 ${comma(REC.final.length - rows.length)} 칸은 이르는 접두 경로가 없어 INF 로 남는다`,
    ].join("\n");
  },

  /** 불변식 ② — 경계 입력. */
  "invariant-edges": () =>
    table(
      [
        ["입력", "도시 수", "반환값", "값이 든 칸", "전이"],
        ...(
          [
            ["도시 하나", [[0]]],
            ["왕복 하나 (도시 둘)", flat(2, 5)],
            ["모든 거리가 7 인 도시 넷", flat(4, 7)],
            ["비대칭 도시 셋", ASYM3],
            ["비용 0 짜리 순회 (도시 다섯)", zeroCycle(5)],
            [`거리가 전부 ${comma(D_LIMIT)} 인 도시 넷`, flat(4, D_LIMIT)],
          ] as [string, number[][]][]
        ).map(([label, dist]) => {
          const t = tally(dist);
          return [
            label,
            String(dist.length),
            val(t.answer),
            comma(t.live),
            comma(t.transitions),
          ];
        }),
      ],
      [1, 2, 3, 4],
    ).join("\n"),

  /** 불변식 ③ — 방문 집합을 내림차순으로 돌면. */
  "mutant-descending": () =>
    table(
      [
        ["입력", "도시 수", "정본", "내림차순으로 처리한 판", "판정"],
        ...MUTANT_CASES.map((c) => {
          const a = tspBitmask(c.dist);
          const b = descending.tspBitmask(c.dist);
          return [
            c.label,
            String(c.dist.length),
            val(a),
            val(b),
            a === b ? "같다" : "다르다",
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n"),

  /** 불변식 ③ — 내림차순 판에서 첫 방문 집합이 적은 값을 누가 읽는가. */
  "mutant-descending-why": () => {
    const r = record(WALK, descending);
    const order = r.visits
      .map((q) => q.mask)
      .filter((m, i, a) => a.indexOf(m) === i);
    const pos = (m: number) => order.indexOf(m);
    const writes = r.cands.filter((c) => c.mask === 1 && c.kept);
    return [
      `방문 집합을 처리한 차례  ${order.slice(0, 3).map(bitsN).join(" → ")} → … → ${bitsN(order.at(-1) ?? 0)}`,
      "",
      ...writes.map(
        (c) =>
          `  ${cellName(1, c.v, N)} 에서 ${cellName(c.next, c.u, N)} = ${val(c.cand)} — 줄 ${bitsN(c.next)} 는 ${pos(c.next) < pos(1) ? "이미 지나갔다" : "아직 안 지나갔다"}`,
      ),
      "",
      `  반환값 ${val(r.answer)}`,
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음마다 기본 연산을 센다. */
  "perf-count": () => {
    const rows: string[][] = [];
    let acc = 0;
    rows.push([STEPS[0]?.id ?? "", "—", "0", "0", "0", "0", "0"]);
    for (let mask = 1; mask <= FULL; mask++) {
      const vs = REC.visits.filter((x) => x.mask === mask);
      const looked = vs.length + REC.outside.filter((m) => m === mask).length;
      const live = vs.filter((x) => x.cur !== INF).length;
      const cs = REC.cands.filter((c) => c.mask === mask);
      acc += looked + live * N;
      rows.push([
        stepOf(mask),
        bitsN(mask),
        String(looked),
        String(live * N),
        String(cs.length),
        String(cs.filter((c) => c.kept).length),
        String(acc),
      ]);
    }
    acc += REC.rets.length;
    rows.push([
      STEPS.at(-1)?.id ?? "",
      "—",
      "0",
      "0",
      "0",
      "0",
      `${acc} (복귀 ${REC.rets.length} 번)`,
    ]);
    const t = tally(WALK);
    return [
      ...table(
        [
          [
            "걸음",
            "방문 집합",
            "살펴본 칸",
            "살펴본 후보",
            "전이",
            "값을 바꾼 횟수",
            "누적 기본 연산",
          ],
          ...rows,
        ],
        [2, 3, 4, 5],
      ),
      "",
      `칸 ${t.outside + t.visits} + 후보 ${t.live * N} + 복귀 ${t.returns} = 기본 연산 ${basicOps(t, N)}`,
    ].join("\n");
  },

  /** `perf.bounds` — 규모를 늘리며 기본 연산을 2^n·n² 와 비교한다. */
  "perf-observed": () =>
    [
      ...table(
        [
          ["도시 n", "기본 연산 (실측)", "닫힌 식", "기본 연산 / (2^n·n²)"],
          ...[6, 10, 14, 18].map((n) => {
            const ops = basicOps(tally(line(n)), n);
            return [
              String(n),
              comma(ops),
              comma(dpOps(n)),
              (ops / (2 ** n * n * n)).toFixed(4),
            ];
          }),
        ],
        [0, 1, 2, 3],
      ),
      "",
      `마지막 열이 1/4 = ${(1 / 4).toFixed(4)} 로 다가간다`,
    ].join("\n"),

  /** `perf.worst` — 거리 행렬을 바꿔도 기본 연산이 같은가. */
  "perf-worst": () => {
    const n = 12;
    const rows: [string, number[][]][] = [
      ["모든 거리가 1", flat(n, 1)],
      [`모든 거리가 ${comma(D_LIMIT)}`, flat(n, D_LIMIT)],
      ["생성식", line(n)],
      ["비용 0 짜리 순회", zeroCycle(n)],
      [
        "도시 0 에서 나가는 길의 비용만 크다",
        Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) =>
            i === j ? 0 : i === 0 ? D_LIMIT : 1,
          ),
        ),
      ],
    ];
    return [
      ...table(
        [
          [
            "거리 행렬 (도시 12)",
            "기본 연산",
            "전이",
            "값을 바꾼 횟수",
            "반환값",
          ],
          ...rows.map(([label, dist]) => {
            const t = tally(dist);
            return [
              label,
              comma(basicOps(t, n)),
              comma(t.transitions),
              comma(t.updates),
              val(t.answer),
            ];
          }),
        ],
        [1, 2, 3, 4],
      ),
      "",
      "행렬 다섯에서 기본 연산과 전이는 한 자리도 안 움직이고, 값을 바꾼 횟수만 행렬을 탄다",
    ].join("\n");
  },

  /** `selfcheck` — T8 의 두 후보. */
  "selfcheck-t8": () => {
    const mask = 0b0111;
    return [
      `${stepOf(mask)} 의 두 후보`,
      ...REC.cands
        .filter((c) => c.mask === mask)
        .map((c) => {
          const src = at(REC.final, mask, c.v);
          const e = (WALK[c.v] as number[])[c.u] as number;
          return `  ${cellName(mask, c.v, N)} = ${val(src)} 에서 u = ${c.u}   ${val(src)} + dist[${c.v}][${c.u}] = ${val(src)} + ${e} = ${val(c.cand)}`;
        }),
    ].join("\n");
  },

  /** `selfcheck` 의 답 — 두 후보의 접두 경로. */
  "selfcheck-t8-paths": () => {
    const mask = 0b0111;
    const cs = REC.cands.filter((c) => c.mask === mask);
    const lines: string[] = [];
    for (const c of cs) {
      const p = prefixPaths(WALK, mask, c.v)[0];
      if (!p) continue;
      const path = [...p.path, c.u];
      const legs = legsOf(WALK, path);
      lines.push(
        `  ${path.join(" -> ")}   ${legs.join(" + ")} = ${legs.reduce((s, x) => s + x, 0)}`,
      );
    }
    const [a, b] = cs as [Cand, Cand];
    const pa = at(REC.final, mask, a.v);
    const pb = at(REC.final, mask, b.v);
    const ea = (WALK[a.v] as number[])[a.u] as number;
    const eb = (WALK[b.v] as number[])[b.u] as number;
    return [
      "두 후보의 경로",
      ...lines,
      "",
      `  접두 비용의 차 ${pa} - ${pb} = ${pa - pb} · 마지막 구간의 차 ${eb} - ${ea} = ${eb - ea}`,
    ].join("\n");
  },
};
