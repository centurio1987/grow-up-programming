/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.md
 *
 * **세는 사본이 둘 있다**(`따라만들기`·`후보만들어거르기`). 정본은 몇 번 진입했는지를
 * 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * `전역표시`·`표시없음`·`경로안뺌` 은 **다른 절차**라 사본이 아니라 별도 구현이다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「결과」 칸 중 옳은 쪽은 전부
 * 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { grid, trap } from "./dfsAllPaths-guide.alt.ts";
import { dfsAllPaths } from "./dfsAllPaths-guide.ref.ts";

type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0 에서 두 갈래가 갈리고, 정점 2 에서 시작 정점으로
 * 되돌아가는 간선이 있으며, 정점 5 는 도착 정점으로 가는 간선이 없는 막다른 자리다.
 * 자기 루프 `[5,5]` 와 「`[0,2]` 가 `[0,1]` 보다 먼저 적혀 있는 것」도 함께 들어 있다.
 */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 2],
  [0, 1],
  [1, 2],
  [1, 4],
  [2, 0],
  [2, 4],
  [2, 5],
  [5, 5],
];
const WALK_S = 0;
const WALK_T = 4;

/** 다이아몬드. 정점 3 이 두 경로에 함께 들어 있어 표시를 지우는가가 여기서 갈린다. */
const DIA_N = 4;
const DIA_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[0, 1, 2, 4]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `[[0,1,4], [0,2,4]]` 꼴 — 경로 목록은 안쪽 쉼표 뒤 공백을 뺀다. */
const showAll = (xss: number[][]): string =>
  `[${xss.map((p) => `[${p.join(",")}]`).join(", ")}]`;

/** `39,999,600,002` 꼴 — 본문 표기와 같다. */
const comma = (n: number | bigint): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

function adjacency(n: number, edges: Edge[], sorted = true): number[][] {
  const sets: Set<number>[] = Array.from(
    { length: n },
    () => new Set<number>(),
  );
  for (const [u, v] of edges) {
    if (u === v) continue;
    (sets[u] as Set<number>).add(v);
  }
  return sets.map((s) => (sorted ? [...s].sort((a, b) => a - b) : [...s]));
}

/** 정본과 같은 절차. 진입 횟수와 이웃 검사 횟수만 덧붙여 센다. */
function 따라만들기(n: number, edges: Edge[], s: number, t: number) {
  const adj = adjacency(n, edges);
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  const 진입순서: number[] = [];
  let 진입 = 0;
  let 검사 = 0;
  const walk = (u: number): void => {
    진입++;
    진입순서.push(u);
    onPath[u] = true;
    path.push(u);
    if (u === t) {
      result.push(path.slice());
    } else {
      for (const v of adj[u] as number[]) {
        검사++;
        if (onPath[v] === true) continue;
        walk(v);
      }
    }
    onPath[u] = false;
    path.pop();
  };
  walk(s);
  return { result, 진입, 검사, 진입순서 };
}

/**
 * **가장 단순한 방법** — 간선을 따라가지 않고, 중간 정점의 나열을 **가능한 순서대로 전부
 * 만들어 놓고** 그 나열이 실제로 간선으로 이어지는지 하나씩 확인한다.
 */
function 후보만들어거르기(n: number, edges: Edge[], s: number, t: number) {
  const has = new Set(
    edges.filter(([u, v]) => u !== v).map(([u, v]) => `${u}>${v}`),
  );
  const others = Array.from({ length: n }, (_, i) => i).filter(
    (v) => v !== s && v !== t,
  );
  const used: boolean[] = Array.from({ length: n }, () => false);
  const seq: number[] = [];
  const result: number[][] = [];
  let 후보 = 0;
  let 검사 = 0;
  const rec = (): void => {
    후보++;
    const full = [s, ...seq, t];
    let ok = true;
    for (let i = 0; i + 1 < full.length; i++) {
      검사++;
      if (!has.has(`${full[i]}>${full[i + 1]}`)) {
        ok = false;
        break;
      }
    }
    if (ok) result.push(full);
    for (const v of others) {
      if (used[v] === true) continue;
      used[v] = true;
      seq.push(v);
      rec();
      seq.pop();
      used[v] = false;
    }
  };
  rec();
  return { result, 후보, 검사 };
}

/**
 * **다른 절차** — 순회에서 쓰는 **전역 표시**를 그대로 가져온 것. 정점을 한 번 담으면
 * 그 표시를 끝까지 지우지 않는다.
 */
function 전역표시(n: number, edges: Edge[], s: number, t: number): number[][] {
  const adj = adjacency(n, edges);
  const marked: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  const walk = (u: number): void => {
    marked[u] = true;
    path.push(u);
    if (u === t) {
      result.push(path.slice());
    } else {
      for (const v of adj[u] as number[]) {
        if (marked[v] === true) continue;
        walk(v);
      }
    }
    path.pop();
  };
  walk(s);
  return result;
}

/** **다른 절차** — 표시를 아예 하지 않는다. 사이클이 있으면 재귀가 끝나지 않는다. */
function 표시없음(n: number, edges: Edge[], s: number, t: number): number[][] {
  const adj = adjacency(n, edges);
  const path: number[] = [];
  const result: number[][] = [];
  const walk = (u: number): void => {
    path.push(u);
    if (u === t) result.push(path.slice());
    else for (const v of adj[u] as number[]) walk(v);
    path.pop();
  };
  walk(s);
  return result;
}

/** **다른 절차** — 표시는 지우는데 경로에서 빼는 것을 잊었다. */
function 경로안뺌(n: number, edges: Edge[], s: number, t: number): number[][] {
  const adj = adjacency(n, edges);
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  const walk = (u: number): void => {
    onPath[u] = true;
    path.push(u);
    if (u === t) {
      result.push(path.slice());
    } else {
      for (const v of adj[u] as number[]) {
        if (onPath[v] === true) continue;
        walk(v);
      }
    }
    onPath[u] = false;
  };
  walk(s);
  return result;
}

/** 정점 `v` 개를 한 줄로 이은 방향 그래프. 경로가 정확히 하나이고 길이가 `v` 다. */
function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v - 1; i++) edges.push([i, i + 1]);
  return edges;
}

/** 경로 목록을 사전식으로 정렬한 사본. 「집합이 같은가」를 보는 데 쓴다. */
const sortPaths = (xss: number[][]): number[][] =>
  [...xss].sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) return (a[i] as number) - (b[i] as number);
    }
    return a.length - b.length;
  });

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  dfsAllPaths(
    n: number,
    edges: Edge[],
    source: number,
    target: number,
  ): number[][];
}

const REF_PATH = new URL("./dfsAllPaths-guide.ref.ts", import.meta.url).pathname;

/**
 * **되돌아가는 자리에서 표시를 지우던 줄** 하나를 지운 사본. **정본 소스에서 기계로
 * 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 표시안지움 = await loadMutant<Ref>(REF_PATH, {
  drop: /^\s*onPath\[u\] = false;/,
});

/** 경로를 **복사해서** 담던 줄 하나를 그대로 담도록 바꾼 사본. */
const 복사안함 = await loadMutant<Ref>(REF_PATH, {
  swap: [/result\.push\(path\.slice\(\)\)/, "result.push(path)"],
});

/** 이웃 목록을 **번호 오름차순으로 정렬하던 줄** 하나에서 정렬만 뺀 사본. */
const 정렬안함 = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /const adj: number\[\]\[\] = sets\.map\(\(s\) => \[\.\.\.s\]\.sort\(\(a, b\) => a - b\)\);/,
    "const adj: number[][] = sets.map((s) => [...s]);",
  ],
});

// 변이가 어느 입력에서도 결과를 안 바꾸면 「달라진다」가 거짓이다. 실행이 그것을 판정한다.
for (const [이름, 낸값] of [
  ["표시를 안 지운다", 표시안지움.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T)],
  ["복사하지 않는다", 복사안함.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T)],
  ["정렬하지 않는다", 정렬안함.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T)],
] as const) {
  if (
    JSON.stringify(낸값) ===
    JSON.stringify(dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T))
  ) {
    throw new Error(`변이 「${이름}」 이 전개 입력에서 결과를 바꾸지 못했다`);
  }
}

/* ────────────────────── 수 계산 ────────────────────── */

/** `⌊e·m!⌋` — 서로 다른 정점 `m` 개로 만들 수 있는 나열의 총수. */
function 나열수(m: number): bigint {
  let 항 = 1n;
  let 합 = 1n;
  for (let k = 1; k <= m; k++) {
    항 *= BigInt(m - k + 1);
    합 += 항;
  }
  return 합;
}

/** 나열마다 간선을 끝까지 확인할 때의 총 확인 횟수. */
function 확인수(m: number): bigint {
  let 항 = 1n;
  let 합 = 1n;
  for (let k = 1; k <= m; k++) {
    항 *= BigInt(m - k + 1);
    합 += 항 * BigInt(k + 1);
  }
  return 합;
}

/** 이항계수 `C(a, b)`. */
function 이항(a: number, b: number): bigint {
  let r = 1n;
  for (let i = 0; i < b; i++) {
    r = (r * BigInt(a - i)) / BigInt(i + 1);
  }
  return r;
}

/* ────────────────────────── 블록 ────────────────────────── */

const 다이아 = () => dfsAllPaths(DIA_N, DIA_EDGES, 0, 3);
const 전개 = () => dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T);

export const PROOFS: Record<string, () => string> = {
  /** 후보를 전부 만들어 거르는 방법이 제약 규모에서 몇 번을 확인하는가. */
  "naive-scale": () =>
    table(
      [
        ["정점 n", "정점 나열 후보", "간선 확인", "초당 1억 번 기준"],
        ...[6, 8, 10, 12, 14].map((n) => {
          const 확인 = 확인수(n - 2);
          return [
            comma(n),
            comma(나열수(n - 2)),
            comma(확인),
            `${(Number(확인) / 1e8).toFixed(3)}초`,
          ];
        }),
      ],
      [0, 1, 2, 3],
    ).join("\n"),

  /** 같은 그래프에 두 방식을 걸어 확인 횟수와 결과를 나란히 놓는다. */
  "follow-vs-generate": () => {
    const g = 후보만들어거르기(WALK_N, WALK_EDGES, WALK_S, WALK_T);
    const f = 따라만들기(WALK_N, WALK_EDGES, WALK_S, WALK_T);
    return table([
      ["", "만든 것", "간선 확인", "결과"],
      [
        "후보를 전부 만들어 거른다",
        `나열 ${g.후보}`,
        comma(g.검사),
        showAll(sortPaths(g.result)),
      ],
      [
        "간선을 따라가며 만든다",
        `진입 ${f.진입}`,
        comma(f.검사),
        showAll(f.result),
      ],
    ]).join("\n");
  },

  /** 순회의 전역 표시를 그대로 쓰면 경로가 사라진다. */
  "global-mark": () =>
    table([
      ["입력", "되돌아갈 때 표시를 지운다", "표시를 안 지운다"],
      ["다이아몬드", showAll(다이아()), showAll(전역표시(DIA_N, DIA_EDGES, 0, 3))],
      [
        "전개가 쓰는 여섯 정점",
        showAll(전개()),
        showAll(전역표시(WALK_N, WALK_EDGES, WALK_S, WALK_T)),
      ],
    ]).join("\n"),

  /** 표시를 어디서 지우는가를 네 가지로 놓고 두 입력에 실제로 실행한다. */
  "unmark-placement": () => {
    const 돌려보기 = (
      run: (n: number, e: Edge[], s: number, t: number) => number[][],
      n: number,
      e: Edge[],
      s: number,
      t: number,
    ): string => {
      try {
        return showAll(run(n, e, s, t));
      } catch (err) {
        return (err as Error).constructor.name;
      }
    };
    const 줄 = (
      이름: string,
      run: (n: number, e: Edge[], s: number, t: number) => number[][],
    ): string[] => [
      이름,
      돌려보기(run, DIA_N, DIA_EDGES, 0, 3),
      돌려보기(run, WALK_N, WALK_EDGES, WALK_S, WALK_T),
    ];
    return table([
      ["표시를 어디서 지우는가", "다이아몬드", "전개가 쓰는 여섯 정점"],
      줄("지우지 않는다", 전역표시),
      줄("표시를 아예 하지 않는다", 표시없음),
      줄("지우지만 경로에서 안 뺀다", 경로안뺌),
      줄("되돌아가는 자리에서 지운다", dfsAllPaths),
    ]).join("\n");
  },

  /** 간선 목록에서 이웃 목록을 만든 결과 — 자기 루프 제외·중복 제거·오름차순. */
  "adj-build": () => {
    const 정렬전 = adjacency(WALK_N, WALK_EDGES, false);
    const 정렬후 = adjacency(WALK_N, WALK_EDGES, true);
    const rows: string[][] = [["", "정렬 전", "정렬 후", "칸 수"]];
    for (let v = 0; v < WALK_N; v++) {
      rows.push([
        `adj[${v}]`,
        show(정렬전[v] as number[]),
        show(정렬후[v] as number[]),
        String((정렬후[v] as number[]).length),
      ]);
    }
    rows.push([
      "합",
      "",
      "",
      String(정렬후.reduce((a, l) => a + l.length, 0)),
    ]);
    return table(rows, [3]).join("\n");
  },

  /** 정렬을 빼면 경로의 **모임**은 같고 **순서**만 어긋난다. */
  "unsorted-order": () => {
    const 옳음 = 전개();
    const 어긋남 = 정렬안함.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T);
    return table([
      ["", "정렬한다", "정렬하지 않는다"],
      ["결과", showAll(옳음), showAll(어긋남)],
      [
        "사전식으로 다시 정렬하면",
        showAll(sortPaths(옳음)),
        showAll(sortPaths(어긋남)),
      ],
      [
        "경로의 모임이 같은가",
        "—",
        JSON.stringify(sortPaths(옳음)) === JSON.stringify(sortPaths(어긋남))
          ? "같다"
          : "다르다",
      ],
    ]).join("\n");
  },

  /** 복사하지 않고 담으면 결과가 전부 같은 배열을 가리킨다. */
  "shared-array": () =>
    table([
      ["입력", "복사해서 담는다", "그대로 담는다"],
      ["다이아몬드", showAll(다이아()), showAll(복사안함.dfsAllPaths(DIA_N, DIA_EDGES, 0, 3))],
      [
        "전개가 쓰는 여섯 정점",
        showAll(전개()),
        showAll(복사안함.dfsAllPaths(WALK_N, WALK_EDGES, WALK_S, WALK_T)),
      ],
    ]).join("\n"),

  /** 한 줄로 이은 그래프에서 재귀 깊이가 그대로 경로 길이가 된다. */
  "recursion-depth": () => {
    const rows: string[][] = [["정점 수", "경로 수", "경로 길이"]];
    for (const v of [1_000, 100_000]) {
      const edges = chain(v);
      try {
        const got = dfsAllPaths(v, edges, 0, v - 1);
        rows.push([
          comma(v),
          String(got.length),
          comma((got[0] as number[]).length),
        ]);
      } catch (e) {
        rows.push([comma(v), (e as Error).constructor.name, "—"]);
      }
    }
    return table(rows, [0]).join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => number[][] }[] = [
      {
        call: "dfsAllPaths(6, [[0,2],[0,1],[1,2],[1,4],[2,0],[2,4],[2,5],[5,5]], 0, 4)",
        run: 전개,
      },
      {
        call: "dfsAllPaths(4, [[0,1],[0,2],[1,3],[2,3]], 0, 3)",
        run: 다이아,
      },
      {
        call: "dfsAllPaths(4, [[0,1],[0,2],[1,2],[1,3],[2,3]], 0, 3)",
        run: () =>
          dfsAllPaths(
            4,
            [
              [0, 1],
              [0, 2],
              [1, 2],
              [1, 3],
              [2, 3],
            ],
            0,
            3,
          ),
      },
      {
        call: "dfsAllPaths(3, [[0,1],[1,2],[2,0],[0,2]], 0, 2)",
        run: () =>
          dfsAllPaths(
            3,
            [
              [0, 1],
              [1, 2],
              [2, 0],
              [0, 2],
            ],
            0,
            2,
          ),
      },
      { call: "dfsAllPaths(3, [[0,1]], 0, 2)", run: () => dfsAllPaths(3, [[0, 1]], 0, 2) },
      {
        call: "dfsAllPaths(3, [[0,1],[1,2]], 1, 1)",
        run: () =>
          dfsAllPaths(
            3,
            [
              [0, 1],
              [1, 2],
            ],
            1,
            1,
          ),
      },
      { call: "dfsAllPaths(1, [], 0, 0)", run: () => dfsAllPaths(1, [], 0, 0) },
    ];
    return table(cases.map((c) => [c.call, "→", showAll(c.run())])).join("\n");
  },

  /** 불변식을 지키던 줄 하나를 지우면 어떤 값이 나오는가. */
  "mutant-no-unmark": () => {
    const 입력: { label: string; n: number; edges: Edge[]; t: number }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES, t: WALK_T },
      { label: "다이아몬드", n: DIA_N, edges: DIA_EDGES, t: 3 },
      { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4), t: 3 },
    ];
    return table([
      ["", "지운다(정본)", "지우지 않는다"],
      ...입력.map((c) => [
        c.label,
        showAll(dfsAllPaths(c.n, c.edges, 0, c.t)),
        showAll(표시안지움.dfsAllPaths(c.n, c.edges, 0, c.t)),
      ]),
    ]).join("\n");
  },

  /** 수식 정의를 전개 입력에 넣어 검산한다. */
  "math-verify": () => {
    const r = 따라만들기(WALK_N, WALK_EDGES, WALK_S, WALK_T);
    const L = r.result.reduce((a, p) => a + p.length, 0);
    return table(
      [
        ["이름", "무엇", "전개 입력에서"],
        ["N", "단순 경로의 수", String(r.result.length)],
        ["L", "경로 길이의 합 = 출력에 적는 정점 번호의 개수", String(L)],
        ["R", "walk 에 진입한 횟수", String(r.진입)],
      ],
      [],
    ).join("\n");
  },

  /** 완전 방향 그래프에서 경로 수의 닫힌 형태에 값을 넣는다. */
  "math-complete": () =>
    table(
      [
        ["정점 n", "⌊e·(n−2)!⌋", "제약 10⁴ 이하인가"],
        ...[4, 5, 6, 7, 8, 9, 10].map((n) => {
          const v = 나열수(n - 2);
          return [comma(n), comma(v), v <= 10_000n ? "그렇다" : "아니다"];
        }),
      ],
      [0, 1],
    ).join("\n"),

  /** 격자 DAG 에서 경로 수의 닫힌 형태에 값을 넣는다. */
  "math-grid": () =>
    table(
      [
        ["격자 m", "정점 수 (m+1)²", "C(2m, m)", "제약 10⁴ 이하인가"],
        ...[1, 2, 3, 4, 5, 6, 7, 8].map((m) => {
          const v = 이항(2 * m, m);
          return [
            comma(m),
            comma((m + 1) * (m + 1)),
            comma(v),
            v <= 10_000n ? "그렇다" : "아니다",
          ];
        }),
      ],
      [0, 1, 2],
    ).join("\n"),

  /** 전개 입력에서 진입한 노드마다 이웃 목록을 몇 칸 읽었는가. */
  "perf-count": () => {
    const adj = adjacency(WALK_N, WALK_EDGES);
    const r = 따라만들기(WALK_N, WALK_EDGES, WALK_S, WALK_T);
    // 본문 전개가 진입 하나마다 붙인 단계 이름. 진입 순서는 실행이 낸다.
    const 단계 = ["T1", "T2", "T3", "T5", "T7", "T9", "T11", "T13", "T15"];
    if (단계.length !== r.진입순서.length) {
      throw new Error(
        `단계 이름 ${단계.length} 개 ≠ 실제 진입 ${r.진입순서.length} 회`,
      );
    }
    const rows: string[][] = [["단계", "진입한 정점", "이웃 목록 길이"]];
    let 합 = 0;
    for (const [i, v] of r.진입순서.entries()) {
      const len = v === WALK_T ? 0 : (adj[v] as number[]).length;
      합 += len;
      rows.push([단계[i] as string, String(v), String(len)]);
    }
    rows.push(["합", `진입 ${r.진입}`, String(합)]);
    return table(rows, [2]).join("\n");
  },

  /** 막다른 무리를 키우면 경로 수는 그대로인데 진입한 노드가 계승만큼 늘어난다. */
  "worst-input": () => {
    const rows: string[][] = [
      ["막다른 무리 k", "정점 수", "간선 수", "경로 수", "진입한 노드"],
    ];
    for (const k of [6, 7, 8, 9]) {
      const g = trap(k);
      const r = 따라만들기(g.n, g.edges, 0, g.t);
      rows.push([
        comma(k),
        comma(g.n),
        comma(g.edges.length),
        comma(r.result.length),
        comma(r.진입),
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4]).join("\n");
  },

  /** 격자에서는 진입한 노드가 전부 경로를 만든다 — 막다른 자리가 없다. */
  "grid-count": () => {
    const rows: string[][] = [
      ["격자 m", "정점 수", "경로 수", "진입한 노드", "이웃 검사"],
    ];
    for (const m of [2, 3, 4, 5]) {
      const g = grid(m);
      const r = 따라만들기(g.n, g.edges, 0, g.t);
      rows.push([
        comma(m),
        comma(g.n),
        comma(r.result.length),
        comma(r.진입),
        comma(r.검사),
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4]).join("\n");
  },
};
