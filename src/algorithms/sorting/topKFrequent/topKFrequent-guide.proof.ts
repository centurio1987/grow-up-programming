/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts topKFrequent-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { topKFrequent } from "./topKFrequent-guide.ref.ts";

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

/** `[4 4 4 2 2 1 1 3 5]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다. */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

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
      .map((c, i) =>
        align[i] === "r" ? padLeft(c, w[i] ?? 0) : padRight(c, w[i] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK: number[] = [4, 4, 4, 2, 2, 1, 1, 3, 5];

/** 그 배열에 거는 `k`. 한 자리 안에서 답이 차는 자리가 생기도록 골랐다. */
const WALK_K = 3;

/**
 * 큰 입력 — `.alt.ts` 와 **같은 생성식**이다. 값 `j` 의 등장 횟수를 `1 + (j mod 3)` 으로
 * 두고 이어 붙인 뒤, 자리를 `(7919 i) mod N` 으로 옮긴다. 난수를 쓰지 않으므로 시드가 없다.
 */
const BIG_N = 100_000;
const BIG: number[] = ((): number[] => {
  const flat: number[] = [];
  for (let j = 0; flat.length < BIG_N; j++) {
    const f = 1 + (j % 3);
    for (let t = 0; t < f && flat.length < BIG_N; t++) flat.push(j);
  }
  const out = new Array<number>(BIG_N);
  for (let i = 0; i < BIG_N; i++) out[i] = flat[(i * 7919) % BIG_N] as number;
  return out;
})();

/* ────────────────────────── 계측기 ────────────────────────── */

/** 등장 횟수 맵. 두 방식이 똑같이 먼저 하는 일이다. */
function freqOf(A: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const v of A) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

/** 값마다 배열 전체를 다시 세는 방법. 읽은 칸 수를 함께 돌려준다. */
function rescanEach(A: number[]): { reads: number; distinct: number } {
  const n = A.length;
  let reads = 0;
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    reads++;
    const target = A[i] as number;
    let c = 0;
    for (let j = 0; j < n; j++) {
      reads++;
      if (A[j] === target) c++;
    }
    if (c > 0) seen.add(target);
  }
  return { reads, distinct: seen.size };
}

/** 정본과 같은 절차. 갈래별 기본 연산 수를 나눠 센다. */
function slotCount(
  A: number[],
  k: number,
): {
  out: number[];
  count: number;
  make: number;
  place: number;
  descend: number;
  cells: number;
  steps: number;
} {
  const n = A.length;
  let count = 0;
  const freq = new Map<number, number>();
  for (const v of A) {
    count += 2;
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  const slot: number[][] = Array.from({ length: n + 1 }, () => []);
  const make = n + 1;
  let place = 0;
  for (const [v, f] of freq) {
    place += 2;
    slot[f]?.push(v);
  }
  let descend = 0;
  let steps = 0;
  const out: number[] = [];
  for (let f = n; f >= 1 && out.length < k; f--) {
    descend += 2;
    steps++;
    for (const v of slot[f] ?? []) {
      descend += 2;
      out.push(v);
      if (out.length === k) break;
    }
  }
  return { out, count, make, place, descend, cells: n + 1, steps };
}

/** 고유값을 등장 횟수 내림차순으로 **전부** 줄 세우는 방법. 병합 정렬이라 견주기가 결정론적이다. */
function sortAll(
  A: number[],
  k: number,
): { out: number[]; count: number; compare: number; cells: number } {
  const freq = freqOf(A);
  const count = 2 * A.length;
  const items = [...freq.entries()];
  let compare = 0;
  const merge = (xs: [number, number][]): [number, number][] => {
    if (xs.length <= 1) return xs;
    const mid = xs.length >> 1;
    const a = merge(xs.slice(0, mid));
    const b = merge(xs.slice(mid));
    const out: [number, number][] = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      compare++;
      if ((a[i] as [number, number])[1] >= (b[j] as [number, number])[1]) {
        out.push(a[i++] as [number, number]);
      } else {
        out.push(b[j++] as [number, number]);
      }
    }
    while (i < a.length) out.push(a[i++] as [number, number]);
    while (j < b.length) out.push(b[j++] as [number, number]);
    return out;
  };
  const sorted = merge(items);
  return {
    out: sorted.slice(0, k).map(([v]) => v),
    count,
    compare,
    cells: items.length,
  };
}

/** 값이 든 자리의 개수 — 서로 다른 등장 횟수가 몇 가지인가. */
const filledSlots = (A: number[]): number => new Set(freqOf(A).values()).size;

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

/** 정수 부분만 쓰는 상한 — 서로 다른 등장 횟수의 개수는 이 값을 넘지 못한다. */
const spreadBound = (n: number): number =>
  Math.floor((Math.sqrt(8 * n + 1) - 1) / 2);

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  topKFrequent(A: number[], k: number): number[];
}

const REF = new URL("./topKFrequent-guide.ref.ts", import.meta.url).pathname;

/** 자리를 `n + 1` 개가 아니라 `n` 개만 잡은 사본. 마지막 자리 번호가 사라진다. */
const cellsN = await loadMutant<Impl>(REF, {
  swap: [/length: n \+ 1/, "length: n"],
});

/** 한 자리 안에서 끝내는 줄을 지운 사본. 바깥 조건만 남는다. */
const noInnerStop = await loadMutant<Impl>(REF, { drop: /\/\/ ⑤/ });

/** 자리 번호를 작은 쪽에서 큰 쪽으로 올라가게 뒤집은 사본. */
const scanUp = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let f = n; f >= 1 && result\.length < k; f--\) \{/,
    "for (let f = 1; f <= n && result.length < k; f++) {",
  ],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다. */
function assertBreaks(rows: { bare: string; mutated: string }[]): void {
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 정본과 변이를 같은 입력에 걸고 답을 나란히 적는다. */
function compareRows(
  cases: [string, number[], number][],
  mutated: Impl,
): { name: string; bare: string; mutated: string }[] {
  return cases.map(([name, A, k]) => ({
    name,
    bare: show(topKFrequent([...A], k)),
    mutated: show(mutated.topKFrequent([...A], k)),
  }));
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 값마다 배열을 다시 세면 제약 규모에서 몇 칸을 읽는가. */
  "naive-scale": () => {
    const rows = [1_000, 10_000].map((n) => {
      const A = Array.from({ length: n }, (_, i) => (i * 7919) % n);
      const measured = rescanEach(A).reads;
      return [
        num(n),
        num(measured),
        num(n * n + n),
        `${((n * n + n) / 100_000_000).toFixed(2)} 초`,
      ];
    });
    rows.push([
      num(100_000),
      "(실행하지 않음)",
      num(100_000 * 100_000 + 100_000),
      "100 초",
    ]);
    return [
      table(["N", "읽은 칸(실측)", "N² + N", "1억 번/초 기준"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 값이 전부 다른 입력이다. 읽은 칸이 정확히 N² + N 이다",
    ].join("\n");
  },

  /** `deep.build` ③ — 한 번만 지나며 맵에 세면 무엇이 남는가. */
  "map-count": () => {
    const freq = freqOf(WALK);
    const rows = [...freq.entries()].map(([v, f]) => [
      String(v),
      String(f),
      WALK.map((x, i) => (x === v ? String(i) : "·")).join(" "),
    ]);
    return [
      `A 의 값   ${show(WALK)}`,
      `칸 번호    ${WALK.map((_, i) => i).join(" ")}`,
      "",
      table(["값", "등장 횟수", "어느 칸에서 나왔는가"], rows, ["r", "r", "l"]),
      "",
      `└ 아홉 칸을 한 번 지나 맵 항목 ${freq.size} 개가 됐다. 등장 횟수의 합은 ${WALK.length} 이다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 전부 줄 세우기와 자리 나누기의 실제 계수. */
  "sort-vs-slot": () => {
    const k = 10;
    const s = sortAll(BIG, k);
    const t = slotCount(BIG, k);
    const sameAnswer =
      JSON.stringify(s.out.map((v) => freqOf(BIG).get(v)).sort()) ===
      JSON.stringify(t.out.map((v) => freqOf(BIG).get(v)).sort());
    if (!sameAnswer) {
      throw new Error("두 방식의 답이 다르다 — 대조가 성립하지 않는다");
    }
    return [
      table(
        ["방식", "세기", "견주기", "자리 만들기 · 담기 · 내려가기", "저장 칸"],
        [
          ["전부 줄 세우기", num(s.count), num(s.compare), "0", num(s.cells)],
          [
            "자리 나누기",
            num(t.count),
            "0",
            num(t.make + t.place + t.descend),
            num(t.cells),
          ],
        ],
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `└ 답은 둘 다 같다(k = ${k}). 견주기가 ${num(s.compare)} 에서 0 이 되고, 저장 칸이 ${num(s.cells)} 에서 ${num(t.cells)} 로 늘었다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 무엇을 자리 번호로 두면 자리가 몇 개 필요한가. */
  "key-range": () => {
    const rows: string[][] = [
      [
        "값 그 자체",
        "−10^9 … 10^9",
        num(2 * 10 ** 9 + 1),
        "제약이 준 값의 범위다",
      ],
      [
        "등장 횟수",
        `1 … ${num(BIG_N)}`,
        num(BIG_N + 1),
        "등장 횟수의 합이 N 이라 하나도 N 을 넘지 못한다",
      ],
    ];
    const maxFreq = Math.max(...freqOf(BIG).values());
    return [
      table(["자리 번호로 무엇을 두는가", "값역", "자리 수", "근거"], rows, [
        "l",
        "l",
        "r",
        "l",
      ]),
      "",
      `└ 10 만 칸짜리 입력에서 실제로 나온 가장 큰 등장 횟수는 ${maxFreq} 이고, 자리 ${num(BIG_N + 1)} 개면 담긴다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 자리를 N+1 개 잡는데 그중 값이 드는 자리는 몇 개인가. */
  "slot-fill": () => {
    const cases: [string, number[]][] = [
      ["전개 입력 아홉 칸", WALK],
      ["전부 같은 값", new Array<number>(BIG_N).fill(7)],
      ["전부 다른 값", Array.from({ length: BIG_N }, (_, i) => i)],
      ["등장 횟수 1·2·3", BIG],
      ["등장 횟수를 가장 넓게 흩은 입력", maxSpreadInput(BIG_N)],
    ];
    const rows = cases.map(([name, A]) => {
      const filled = filledSlots(A);
      return [
        name,
        num(A.length),
        num(A.length + 1),
        num(filled),
        `${((100 * filled) / (A.length + 1)).toFixed(2)} %`,
      ];
    });
    return [
      table(
        ["입력", "N", "잡은 자리", "값이 든 자리", "든 자리의 비율"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 자리는 N+1 개를 잡는데 값이 드는 자리는 마지막 줄에서도 세 자릿수에 그친다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 자리를 N 개만 잡으면 어느 입력이 살아남는가. */
  "pause-cells-n": () => {
    const cases: [string, number[], number][] = [
      ["전개 입력 · k=3", WALK, WALK_K],
      ["[1 1 1 2 2 3] · k=2", [1, 1, 1, 2, 2, 3], 2],
      ["[7 7 7 7] · k=1", [7, 7, 7, 7], 1],
      ["[42] · k=1", [42], 1],
    ];
    const rows = compareRows(cases, cellsN);
    assertBreaks(rows);
    return [
      table(
        ["입력", "바른 코드", "자리를 N 개만 잡은 코드", ""],
        rows.map((r) => [
          r.name,
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 가장 많이 나온 값의 등장 횟수가 N 일 때만 답이 달라진다. 그때 담을 자리가 없어 답에서 빠진다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 한 자리 안의 멈춤을 지우면 어느 입력이 살아남는가. */
  "pause-no-inner-stop": () => {
    const cases: [string, number[], number][] = [
      ["전개 입력 · k=3", WALK, WALK_K],
      ["전개 입력 · k=2", WALK, 2],
      ["전개 입력 · k=1", WALK, 1],
      ["[1 1 1 2 2 3] · k=2", [1, 1, 1, 2, 2, 3], 2],
    ];
    const rows = compareRows(cases, noInnerStop);
    assertBreaks(rows);
    return [
      table(
        ["입력", "바른 코드", "한 자리 안의 멈춤을 지운 코드", ""],
        rows.map((r) => [
          r.name,
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 한 자리에 값이 여럿이고 그 자리에서 k 가 차는 입력에서만 답이 길어진다",
    ].join("\n");
  },

  /** `deep.math` — 서로 다른 등장 횟수의 개수 상한과 실측의 대조. */
  "bound-check": () => {
    const rows = [1, 3, 6, 9, 10, 100, 1_000, 100_000].map((n) => {
      const A = maxSpreadInput(n);
      const b = spreadBound(n);
      const tri = (b * (b + 1)) / 2;
      return [
        num(n),
        num(8 * n + 1),
        String(b),
        String(filledSlots(A)),
        `${num(tri)} ${tri === n ? "=" : "<"} ${num(n)}`,
      ];
    });
    return [
      table(
        ["N", "8N+1", "상한 ⌊(√(8N+1) − 1) / 2⌋", "실측 최대", "1+2+…+B 와 N"],
        rows,
        ["r", "r", "r", "r", "l"],
      ),
      "",
      "└ 실측 최대가 상한과 늘 같다. 마지막 열이 등호인 N 이 삼각수 1·3·6·10 … 이다",
    ].join("\n");
  },

  /** `invariant` ③ — 자리 번호를 올라가며 읽으면 무엇이 나오는가. */
  "mutant-scan-up": () => {
    const cases: [string, number[], number][] = [
      ["전개 입력 · k=3", WALK, WALK_K],
      ["전개 입력 · k=1", WALK, 1],
      ["[1 1 1 2 2 3] · k=2", [1, 1, 1, 2, 2, 3], 2],
      ["[7 7 7 7] · k=1", [7, 7, 7, 7], 1],
    ];
    const rows = compareRows(cases, scanUp);
    assertBreaks(rows);
    return [
      table(
        ["입력", "바른 코드", "자리를 올라가며 읽는 코드", ""],
        rows.map((r) => [
          r.name,
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 서로 다른 값이 하나뿐이면 자리가 하나라 방향이 답에 안 나타난다. 나머지는 하위 k 개가 나온다",
    ].join("\n");
  },

  /** `perf.derive` — 전개가 실제로 몇 번 기본 연산을 했는가. */
  "walk-cost": () => {
    const t = slotCount(WALK, WALK_K);
    const naive = rescanEach(WALK).reads;
    const total = t.count + t.make + t.place + t.descend;
    return [
      table(
        ["갈래", "걸음", "기본 연산"],
        [
          ["등장 횟수를 센다", "T1", num(t.count)],
          ["자리를 만든다", "T2", num(t.make)],
          ["자리에 값을 담는다", "T3~T7", num(t.place)],
          ["자리를 내려가며 답을 채운다", "T8~T12", num(t.descend)],
          ["합", "", num(total)],
        ],
        ["l", "l", "r"],
      ),
      "",
      `└ 같은 입력을 값마다 다시 세는 방법으로 처리하면 읽은 칸이 ${num(naive)} 이다.`,
      `  내려간 자리는 ${t.steps} 개이고 잡은 자리는 ${num(t.cells)} 개다`,
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
      [
        "등장 횟수 1·2·3",
        ((): number[] => {
          const flat: number[] = [];
          for (let j = 0; flat.length < n; j++) {
            const f = 1 + (j % 3);
            for (let t = 0; t < f && flat.length < n; t++) flat.push(j);
          }
          return flat;
        })(),
      ],
      ["전부 다른 값", Array.from({ length: n }, (_, i) => i)],
    ];
    const rows = cases.map(([name, A]) => {
      const r = slotCount(A, 1);
      return [
        name,
        num(new Set(A).size),
        num(Math.max(...freqOf(A).values())),
        num(r.steps),
        num(r.count + r.make + r.place + r.descend),
      ];
    });
    return [
      table(
        [
          "입력의 모양",
          "서로 다른 값",
          "가장 큰 등장 횟수",
          "내려간 자리",
          "기본 연산",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `└ k = 1 로 고정하고 N = ${num(n)} 에서 쟀다. 가장 큰 등장 횟수가 작을수록 내려가는 걸음이 는다`,
    ].join("\n");
  },
};
