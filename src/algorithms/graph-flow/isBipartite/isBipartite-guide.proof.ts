/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/isBipartite/isBipartite-guide.md
 *
 * **세는 사본이 둘, 다른 판정이 넷 있다.** 정본은 칸을 몇 개 읽었는지도 이웃 항목을 몇 개
 * 읽었는지도 내보내지 않고, 쪽 배열도 돌려주지 않는다. 그래서 세는 자리만 덧붙인 사본
 * (`countCells`·`sidesFrom`)과, 본문이 반박하려고 세우는 판(`enumerateSplits`·`markWidth`·
 * `skipParent`·`orderSwapped`)을 여기 따로 적었다. **답이 옳은지는 사본이 아니라 정본이
 * 진다** — 아래 표의 「옳은 답」 칸은 전부 정본이 낸 값이다.
 *
 * 경쟁 설계의 계수는 `.alt.ts` 가 낸 것을 그대로 가져온다 — 같은 값을 두 파일이 각자 재면
 * 둘이 갈라진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { cases as ALT_CASES, bipartite } from "./isBipartite-guide.alt.ts";
import { isBipartite } from "./isBipartite-guide.ref.ts";

type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0·1·2·3 은 길이 4 짜리 사이클이고 4·5·6 은 삼각형이라,
 * 세 갈래와 바깥 반복의 다시 시작하기가 한 입력에서 모두 실행된다.
 */
const WALK_N = 7;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 4],
];

/** `0-1-…-(v-1)` 한 줄. 간선 `v-1` 개이고 이분 그래프다. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 한 줄의 양 끝을 이어 붙인 고리. 길이가 홀수면 이분 그래프가 아니다. */
function ring(v: number): Edge[] {
  return [...chain(v), [v - 1, 0]];
}

/** 왼쪽 `a` 개와 오른쪽 `b` 개를 모두 이은 완전 이분 그래프. 간선 `a×b` 개다. */
function complete(a: number, b: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) out.push([i, a + j]);
  return out;
}

/** 정점 `v` 개를 크기 `size` 짜리 한 줄 여럿으로 가른 숲. */
function forest(v: number, size: number): Edge[] {
  const out: Edge[] = [];
  for (let base = 0; base < v; base += size) {
    for (let i = base; i + 1 < Math.min(base + size, v); i++)
      out.push([i, i + 1]);
  }
  return out;
}

const adjacency = (n: number, edges: Edge[]): number[][] => {
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  return nbr;
};

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

/** `2,800,000` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

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

const yn = (b: boolean): string => (b ? "true" : "false");

/* ────────────────────── 세는 사본과 다른 판정 ────────────────────── */

/**
 * 가장 단순한 방법 — **모든 쪽 나눔을 하나씩 시험한다.** 정점 `n` 개를 두 쪽으로 나누는
 * 방법은 `2^n` 가지이고, 그 하나마다 간선을 차례로 확인해 두 끝의 쪽이 같은 것이 나오면
 * 그 나눔을 버린다. 답은 맞는다.
 *
 * 세는 것은 **확인한 간선 수**다. 나눔 하나를 만드는 비용은 어느 방식이든 붙지 않으므로
 * 세지 않았다.
 */
function enumerateSplits(
  n: number,
  edges: Edge[],
): { combos: number; checks: number; valid: number; answer: boolean } {
  const combos = 2 ** n;
  let checks = 0;
  let valid = 0;
  for (let mask = 0; mask < combos; mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      checks++;
      if (((mask >> u) & 1) === ((mask >> v) & 1)) {
        ok = false;
        break;
      }
    }
    if (ok) valid++;
  }
  return { combos, checks, valid, answer: valid > 0 };
}

/**
 * 이 가이드의 절차에 **읽고 쓴 배열 칸 수**를 덧붙여 센 사본. 칸을 한 번 읽으면 1, 한 번
 * 쓰면 1이다. `.alt.ts` 의 세는 사본과 같은 규칙을 쓴다.
 */
function countCells(
  n: number,
  edges: Edge[],
): { cells: number; entries: number; answer: boolean } {
  let cells = 0;
  let entries = 0;
  const nbr: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  for (const [u, v] of edges) {
    cells += 4;
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  const side: number[] = Array.from({ length: n }, () => -1);
  cells += n;
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    cells++;
    if (side[s] !== -1) continue;
    cells += 2;
    side[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      cells += 3;
      const u = stack.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;
      for (const v of nbr[u] as number[]) {
        entries++;
        cells += 2;
        if (side[v] === su) return { cells, entries, answer: false };
        cells++;
        if (side[v] !== -1) continue;
        cells += 2;
        side[v] = other;
        stack.push(v);
      }
    }
  }
  return { cells, entries, answer: true };
}

/**
 * 덩어리마다 `start` 쪽에서 시작해 **쪽 배열 전체와 나무 경로 걸음 수**를 함께 돌려주는
 * 사본. 정본은 `boolean` 하나만 내보내므로 쪽 배열을 볼 방법이 없다. 판정 자체는 정본과
 * 같은 순서로 하되, 답이 갈리는 자리를 만나도 끝까지 채워서 배열을 낸다.
 */
function sidesFrom(
  n: number,
  edges: Edge[],
  start: 0 | 1,
): { side: number[]; depth: number[]; root: number[] } {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => -1);
  const root: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = start;
    depth[s] = 0;
    root[s] = s;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const su = side[u] as number;
      for (const v of nbr[u] as number[]) {
        if (side[v] !== -1) continue;
        side[v] = 1 - su;
        depth[v] = (depth[u] as number) + 1;
        root[v] = root[u] as number;
        stack.push(v);
      }
    }
  }
  return { side, depth, root };
}

/**
 * 표시를 **`q` 값**으로 두는 판. 정점에 `0 … q-1` 중 하나를 적고 이웃에는 `(내 값 + 1) mod q`
 * 를 적는다. 이웃의 값이 내 값과 같으면 `false` 다. `q = 2` 가 정본이고, 나머지는 「왜 하필
 * 두 값인가」를 값으로 답하기 위한 판이다.
 */
function markWidth(n: number, edges: Edge[], q: number): boolean {
  const nbr = adjacency(n, edges);
  const mark: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (mark[s] !== -1) continue;
    mark[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const mu = mark[u] as number;
      const next = (mu + 1) % q;
      for (const v of nbr[u] as number[]) {
        if (mark[v] === mu) return false;
        if (mark[v] !== -1) continue;
        mark[v] = next;
        stack.push(v);
      }
    }
  }
  return true;
}

/** `markWidth` 와 같은 판이되 표시 배열까지 돌려준다. 값이 실제로 무엇이 됐는지 보이는 자리다. */
function markArray(
  n: number,
  edges: Edge[],
  q: number,
): { mark: number[]; answer: boolean } {
  const nbr = adjacency(n, edges);
  const mark: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  let answer = true;
  for (let s = 0; s < n; s++) {
    if (mark[s] !== -1) continue;
    mark[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const mu = mark[u] as number;
      const next = (mu + 1) % q;
      for (const v of nbr[u] as number[]) {
        if (mark[v] === mu) answer = false;
        if (mark[v] !== -1) continue;
        mark[v] = next;
        stack.push(v);
      }
    }
  }
  return { mark, answer };
}

/**
 * 정본에 **지나온 이웃 건너뛰기**를 더한 판. 무향 사이클 탐지가 쓰는 배열 하나(`from`)를
 * 그대로 들여온 것이다. 답이 갈리는지는 값이 답한다.
 */
function skipParent(n: number, edges: Edge[]): boolean {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  const from: number[] = [];
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = 0;
    stack.push(s);
    from.push(-1);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;
      for (const v of nbr[u] as number[]) {
        if (v === parent) continue;
        if (side[v] === su) return false;
        if (side[v] !== -1) continue;
        side[v] = other;
        stack.push(v);
        from.push(u);
      }
    }
  }
  return true;
}

/**
 * 두 갈래의 **순서를 바꾼** 판. 「쪽이 적혀 있으면 넘어간다」를 「쪽이 같으면 `false`」보다
 * 먼저 둔다. 쪽이 같은 이웃도 쪽이 적힌 이웃이므로 앞쪽 갈래가 먼저 데려간다.
 */
function orderSwapped(n: number, edges: Edge[]): boolean {
  const nbr = adjacency(n, edges);
  const side: number[] = Array.from({ length: n }, () => -1);
  const stack: number[] = [];
  for (let s = 0; s < n; s++) {
    if (side[s] !== -1) continue;
    side[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      const u = stack.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;
      for (const v of nbr[u] as number[]) {
        if (side[v] !== -1) continue;
        if (side[v] === su) return false;
        side[v] = other;
        stack.push(v);
      }
    }
  }
  return true;
}

/**
 * 정점 집합을 `k` 가지 값으로 나누되 이웃끼리 값이 다르게 할 수 있는가 — 전수로 시험한다.
 * `related`(그래프 채색)가 쓰는 「필요한 값의 가짓수」를 세는 자리다.
 */
function colorsNeeded(n: number, edges: Edge[]): number {
  for (let k = 1; k <= n; k++) {
    const assign: number[] = Array.from({ length: n }, () => 0);
    const ok = (at: number): boolean => {
      if (at === n) return true;
      for (let c = 0; c < k; c++) {
        assign[at] = c;
        const clash = edges.some(
          ([u, v]) =>
            u <= at &&
            v <= at &&
            (assign[u] as number) === (assign[v] as number),
        );
        if (!clash && ok(at + 1)) return true;
      }
      return false;
    };
    if (ok(0)) return k;
  }
  return n;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  isBipartite(n: number, edges: Edge[]): boolean;
}

const REF_PATH = new URL("./isBipartite-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 이웃에게 **반대쪽이 아니라 자기와 같은 쪽**을 적는 사본. 쪽을 가르는 일을 하지 않으므로
 * 간선 하나짜리 그래프도 `false` 가 된다.
 */
const sameSideMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [/^(\s+)const other = 1 - su;$/, "$1const other = su;"],
});

/**
 * 덩어리의 첫 정점에 **반대쪽**을 적는 사본. 쪽 배열이 통째로 뒤집히는데 반환값은 그대로다.
 */
const flippedStartMutant = await loadMutant<Ref>(REF_PATH, {
  swap: [/^(\s+)side\[s\] = FIRST_SIDE;$/, "$1side[s] = 1 - FIRST_SIDE;"],
});

/* ────────────────────────── 입력 묶음 ────────────────────────── */

const SMALL: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 정점 일곱", n: WALK_N, edges: WALK_EDGES },
  { label: "길이 4 짜리 사이클", n: 4, edges: ring(4) },
  { label: "삼각형 세 정점", n: 3, edges: ring(3) },
  { label: "길이 5 짜리 사이클", n: 5, edges: ring(5) },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  {
    label: "완전 이분 그래프 (왼쪽 둘 · 오른쪽 셋)",
    n: 5,
    edges: complete(2, 3),
  },
  { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
  { label: "자기 자신을 잇는 간선", n: 2, edges: [[0, 0]] },
];

export const PROOFS: Record<string, () => string> = {
  /** 모든 쪽 나눔을 시험하는 방법이 규모에 따라 얼마가 되는가. */
  "naive-scale": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 정점 일곱", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
      { label: "한 줄로 이은 15 정점", n: 15, edges: chain(15) },
      { label: "한 줄로 이은 20 정점", n: 20, edges: chain(20) },
      { label: "한 줄로 이은 22 정점", n: 22, edges: chain(22) },
    ];
    const rows: string[][] = [
      ["입력", "정점 V", "간선 E", "쪽 나눔 후보", "확인한 간선 수"],
    ];
    for (const c of cases) {
      const r = enumerateSplits(c.n, c.edges);
      rows.push([
        c.label,
        comma(c.n),
        comma(c.edges.length),
        comma(r.combos),
        comma(r.checks),
      ]);
    }
    const digits = Math.floor(100_000 * Math.log10(2)) + 1;
    const ratios = cases.map((c) => {
      const r = enumerateSplits(c.n, c.edges);
      return r.checks / r.combos;
    });
    const lo = Math.min(...ratios).toFixed(1);
    const hi = Math.max(...ratios).toFixed(1);
    return `${table(rows, [1, 2, 3, 4]).join("\n")}
        └ 확인한 간선 수 ÷ 후보 수가 다섯 줄에서 ${lo} 에서 ${hi} 사이다 — 후보 하나마다
          몇 개를 확인하든 총량은 후보 수에 붙는다. 제약 상한인 정점 100,000 개를 넣으면
          후보가 ${comma(digits)} 자리 수다`;
  },

  /** 쪽 나눔 후보 중 실제로 규정을 지키는 것은 몇 개인가. */
  "valid-splits": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 정점 일곱", n: WALK_N, edges: WALK_EDGES },
      {
        label: "전개 입력에서 간선 [6,4] 를 뺀 것",
        n: WALK_N,
        edges: WALK_EDGES.slice(0, 6),
      },
      { label: "길이 4 짜리 사이클", n: 4, edges: ring(4) },
      { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
      { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
      { label: "삼각형 세 정점", n: 3, edges: ring(3) },
    ];
    const rows: string[][] = [
      ["입력", "후보 2^V", "덩어리 k", "규정을 지키는 나눔", "2^k", "답"],
    ];
    for (const c of cases) {
      const r = enumerateSplits(c.n, c.edges);
      const parts = new Set(sidesFrom(c.n, c.edges, 0).root).size;
      rows.push([
        c.label,
        comma(r.combos),
        comma(parts),
        comma(r.valid),
        r.answer ? comma(2 ** parts) : "—",
        yn(isBipartite(c.n, c.edges)),
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },

  /** 전수 시험과 전파를 같은 입력에서 나란히 센다. */
  "two-ways": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 정점 일곱", n: WALK_N, edges: WALK_EDGES },
      { label: "한 줄로 이은 10 정점", n: 10, edges: chain(10) },
      { label: "한 줄로 이은 15 정점", n: 15, edges: chain(15) },
      { label: "길이 20 짜리 고리", n: 20, edges: ring(20) },
      {
        label: "완전 이분 그래프 (왼쪽 10 · 오른쪽 10)",
        n: 20,
        edges: complete(10, 10),
      },
    ];
    return table(
      [
        [
          "입력",
          "E",
          "쪽 나눔 전부 시험 (간선 확인)",
          "이웃에 전파 (이웃 항목 확인)",
          "배수",
          "답",
        ],
        ...cases.map((c) => {
          const a = enumerateSplits(c.n, c.edges).checks;
          const b = countCells(c.n, c.edges).entries;
          return [
            c.label,
            comma(c.edges.length),
            comma(a),
            comma(b),
            `${(a / b).toLocaleString("en-US", { maximumFractionDigits: 1 })} 배`,
            yn(isBipartite(c.n, c.edges)),
          ];
        }),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 표시를 몇 값으로 둘 것인가 — 가짓수를 1·2·3·4 로 놓고 같은 입력에 돌린다. */
  "mark-width": () => {
    const widths = [1, 2, 3, 4];
    const agree = widths.map(
      (q) =>
        SMALL.filter(
          (c) => markWidth(c.n, c.edges, q) === isBipartite(c.n, c.edges),
        ).length,
    );
    const best = widths.filter((_, i) => agree[i] === SMALL.length);
    return `${table(
      [
        ["입력", "1 값", "2 값", "3 값", "4 값", "옳은 답"],
        ...SMALL.map((c) => [
          c.label,
          yn(markWidth(c.n, c.edges, 1)),
          yn(markWidth(c.n, c.edges, 2)),
          yn(markWidth(c.n, c.edges, 3)),
          yn(markWidth(c.n, c.edges, 4)),
          yn(isBipartite(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n")}
        └ 옳은 답과 여덟 줄이 모두 같은 가짓수는 ${best.join("·")} 하나다
          가짓수마다 맞은 줄 수: ${widths
            .map((q, i) => `${q} 값 ${agree[i]}`)
            .join(" · ")}`;
  },

  /** 단계 1 — 이웃 목록과 쪽 배열의 초기 상태. */
  "build-lists": () => {
    const nbr = adjacency(WALK_N, WALK_EDGES);
    const rows = nbr.map((list, v) => [
      `  nbr[${v}] = [${list.join(", ")}]`,
      `이웃 ${list.length} 개`,
    ]);
    const total = nbr.reduce((n, list) => n + list.length, 0);
    const blank = nbr.map((_, v) => `${v}:·`).join(" ");
    return `${table(rows).join("\n")}
                      └ 목록 길이의 합 ${total} = 2E

  side  = ${blank}     아직 어느 정점의 쪽도 정하지 않았다
  stack = []`;
  },

  /** 지나온 이웃을 따로 건너뛰면 답이 갈리는가. */
  "skip-parent": () => {
    // 정점 넷 이하 · 간선 넷 이하인 다중그래프를 전부 만들어 둘을 대조한다.
    const pairs: Edge[] = [];
    for (let u = 0; u < 4; u++) for (let v = u; v < 4; v++) pairs.push([u, v]);
    let checked = 0;
    let differ = 0;
    const walk = (depth: number, acc: Edge[]): void => {
      if (depth === 0) {
        checked++;
        if (isBipartite(4, acc) !== skipParent(4, acc)) differ++;
        return;
      }
      for (const p of pairs) {
        acc.push(p);
        walk(depth - 1, acc);
        acc.pop();
      }
    };
    for (let m = 0; m <= 4; m++) walk(m, []);
    return `${table(
      [
        [
          "입력",
          "지나온 이웃을 그냥 둔다",
          "지나온 이웃을 건너뛴다",
          "옳은 답",
        ],
        ...SMALL.map((c) => [
          c.label,
          yn(isBipartite(c.n, c.edges)),
          yn(skipParent(c.n, c.edges)),
          yn(isBipartite(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n")}
        └ 정점이 넷이고 간선이 넷 이하인 그래프 ${comma(checked)} 개(같은 쌍을 여러 번 잇는 것과
          자기 자신을 잇는 것을 포함한다)를 전부 만들어 두 판정을 대조했다.
          반환값이 다른 그래프: ${comma(differ)} 개`;
  },

  /** 두 갈래의 순서를 바꾸면 답이 갈리는가. */
  "order-swapped": () =>
    table(
      [
        [
          "입력",
          "쪽이 같은지를 먼저 본다",
          "쪽이 있는지를 먼저 본다",
          "옳은 답",
        ],
        ...SMALL.map((c) => [
          c.label,
          yn(isBipartite(c.n, c.edges)),
          yn(orderSwapped(c.n, c.edges)),
          yn(isBipartite(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n"),

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { n: number; edges: Edge[] }[] = [
      { n: WALK_N, edges: WALK_EDGES },
      { n: 4, edges: ring(4) },
      { n: 3, edges: ring(3) },
      { n: 5, edges: complete(2, 3) },
      {
        n: 6,
        edges: [
          [0, 1],
          [0, 2],
          [1, 3],
          [1, 4],
          [2, 5],
        ],
      },
      {
        n: 5,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      { n: 1, edges: [] },
      { n: 1, edges: [[0, 0]] },
    ];
    return cases
      .map((c) => [
        `isBipartite(${c.n}, ${JSON.stringify(c.edges)})`,
        yn(isBipartite(c.n, c.edges)),
      ])
      .map(([call, out]) => `${pad(call as string, 62)} →   ${out}`)
      .join("\n");
  },

  /** 쪽이 나무 경로 걸음 수의 홀짝과 같은가 — 전개 입력에서 검산한다. */
  "depth-parity": () => {
    const r = sidesFrom(WALK_N, WALK_EDGES, 0);
    const rows: string[][] = [
      [
        "정점 v",
        "덩어리 시작",
        "걸음 수 d(v)",
        "d(v) mod 2",
        "side[v]",
        "같은가",
      ],
    ];
    for (let v = 0; v < WALK_N; v++) {
      const d = r.depth[v] as number;
      rows.push([
        String(v),
        String(r.root[v]),
        String(d),
        String(d % 2),
        String(r.side[v]),
        yn(d % 2 === r.side[v]),
      ]);
    }
    return table(rows, [1, 2, 3, 4]).join("\n");
  },

  /** 시작 쪽을 뒤집으면 무엇이 바뀌고 무엇이 그대로인가. */
  "flip-start": () => {
    const a = sidesFrom(WALK_N, WALK_EDGES, 0);
    const b = sidesFrom(WALK_N, WALK_EDGES, 1);
    const show = (side: number[]): string =>
      side.map((s, v) => `${v}:${s}`).join(" ");
    return `  덩어리를 쪽 0 에서 시작한다   side = ${show(a.side)}
  덩어리를 쪽 1 에서 시작한다   side = ${show(b.side)}
                                 └ 정점마다 값이 뒤집혔다: ${yn(
                                   a.side.every((s, v) => s !== b.side[v]),
                                 )}

${table(
  [
    ["입력", "쪽 0 에서 시작한다", "쪽 1 에서 시작한다"],
    ...SMALL.map((c) => [
      c.label,
      yn(isBipartite(c.n, c.edges)),
      yn(flippedStartMutant.isBipartite(c.n, c.edges)),
    ]),
  ],
  [],
).join("\n")}`;
  },

  /** 이웃에게 같은 쪽을 적으면 어느 입력에서 답이 갈리는가. */
  "mutant-same-side": () =>
    table(
      [
        [
          "입력",
          "이웃에 반대쪽을 적는다",
          "이웃에 같은 쪽을 적는다",
          "옳은 답",
        ],
        ...SMALL.map((c) => [
          c.label,
          yn(isBipartite(c.n, c.edges)),
          yn(sameSideMutant.isBipartite(c.n, c.edges)),
          yn(isBipartite(c.n, c.edges)),
        ]),
      ],
      [],
    ).join("\n"),

  /** 칸 접근 수의 닫힌 형태가 실측과 맞는가. */
  "cost-closed-form": () => {
    // **답이 true 인 입력만 담는다.** false 면 그 자리에서 반환하므로 아래 식이 서지 않는다.
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      {
        label: "전개 입력에서 삼각형 간선 [6,4] 를 뺀 것",
        n: WALK_N,
        edges: WALK_EDGES.slice(0, 6),
      },
      { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
      { label: "한 줄로 이은 1,000 정점", n: 1_000, edges: chain(1_000) },
      { label: "1,000 정점을 넷씩 가른 숲", n: 1_000, edges: forest(1_000, 4) },
      {
        label: "완전 이분 그래프 (왼쪽 100 · 오른쪽 100)",
        n: 200,
        edges: complete(100, 100),
      },
      {
        label: "정점 100,000 · 간선 200,000",
        n: 100_000,
        edges: bipartite(100_000, 200_000),
      },
    ];
    return table(
      [
        ["입력", "V", "E", "실제 칸 접근", "8V + 10E"],
        ...cases.map((c) => [
          c.label,
          comma(c.n),
          comma(c.edges.length),
          comma(countCells(c.n, c.edges).cells),
          comma(8 * c.n + 10 * c.edges.length),
        ]),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 모양을 바꾸면 최악이 어디인가. */
  "shape-values": () => {
    const V = 100_000;
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      {
        label: "간선 200,000 개짜리 이분 그래프",
        n: V,
        edges: bipartite(V, 200_000),
      },
      {
        label: "완전 이분 그래프 (왼쪽 632 · 오른쪽 316)",
        n: V,
        edges: complete(632, 316),
      },
      { label: "한 줄로 이은 100,000 정점", n: V, edges: chain(V) },
      { label: "간선이 없는 100,000 정점", n: V, edges: [] },
      {
        label: "삼각형을 정점 0·1·2 에 두고 나머지를 이분으로 채운 것",
        n: V,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
          ...bipartite(V - 3, 199_997).map(([a, b]) => [a + 3, b + 3] as Edge),
        ],
      },
      {
        label: "같은 삼각형을 정점 번호 맨 뒤에 옮긴 것",
        n: V,
        edges: [
          ...bipartite(V - 3, 199_997),
          [V - 3, V - 2],
          [V - 2, V - 1],
          [V - 1, V - 3],
        ],
      },
    ];
    return table(
      [
        ["입력 모양", "V", "E", "배열 칸 접근", "반환값"],
        ...cases.map((c) => {
          const r = countCells(c.n, c.edges);
          return [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma(r.cells),
            yn(r.answer),
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 이웃끼리 값이 다르게 하려면 값이 몇 가지 필요한가. */
  "colors-needed": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "간선이 없는 다섯 정점", n: 5, edges: [] },
      { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
      { label: "길이 4 짜리 사이클", n: 4, edges: ring(4) },
      {
        label: "완전 이분 그래프 (왼쪽 둘 · 오른쪽 셋)",
        n: 5,
        edges: complete(2, 3),
      },
      { label: "삼각형 세 정점", n: 3, edges: ring(3) },
      { label: "길이 5 짜리 사이클", n: 5, edges: ring(5) },
      {
        label: "정점 넷을 모두 이은 것",
        n: 4,
        edges: complete(1, 3).concat([
          [1, 2],
          [1, 3],
          [2, 3],
        ]),
      },
    ];
    return table(
      [
        ["입력", "V", "E", "필요한 값의 가짓수", "이분인가"],
        ...cases.map((c) => [
          c.label,
          comma(c.n),
          comma(c.edges.length),
          comma(colorsNeeded(c.n, c.edges)),
          yn(isBipartite(c.n, c.edges)),
        ]),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 세 값 판이 길이 5 짜리 고리에 실제로 적는 값. */
  "mark-three-values": () => {
    const five = ring(5);
    const two = markArray(5, five, 2);
    const three = markArray(5, five, 3);
    const show = (m: number[]): string =>
      m.map((x, v) => `${v}:${x}`).join(" ");
    const rows: string[][] = [["간선", "두 값 판", "", "세 값 판", ""]];
    for (const [a, b] of five) {
      const t2 = [two.mark[a] as number, two.mark[b] as number];
      const t3 = [three.mark[a] as number, three.mark[b] as number];
      rows.push([
        `[${a},${b}]`,
        `${t2[0]} 대 ${t2[1]}`,
        t2[0] === t2[1] ? "같다" : "다르다",
        `${t3[0]} 대 ${t3[1]}`,
        t3[0] === t3[1] ? "같다" : "다르다",
      ]);
    }
    const clash2 = five.filter(([a, b]) => two.mark[a] === two.mark[b]).length;
    const clash3 = five.filter(
      ([a, b]) => three.mark[a] === three.mark[b],
    ).length;
    return `  두 값 판이 적은 것   ${show(two.mark)}   →   ${yn(two.answer)}
  세 값 판이 적은 것   ${show(three.mark)}   →   ${yn(three.answer)}

${table(rows).join("\n")}
        └ 두 끝의 값이 같은 간선: 두 값 판 ${clash2} 개 · 세 값 판 ${clash3} 개`;
  },

  /** 스스로 점검하기 — 마지막 간선의 한쪽 끝만 옮기면 무엇이 달라지는가. */
  "edge-retarget": () => {
    const moved: Edge[] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 3],
    ];
    const a = countCells(WALK_N, WALK_EDGES);
    const b = countCells(WALK_N, moved);
    const sides = sidesFrom(WALK_N, moved, 0).side;
    return `${table(
      [
        ["입력", "덩어리 k", "읽은 이웃 항목 수", "2E", "반환값"],
        [
          "본문 전개 — 마지막 간선이 [6,4]",
          String(new Set(sidesFrom(WALK_N, WALK_EDGES, 0).root).size),
          comma(a.entries),
          comma(2 * WALK_EDGES.length),
          yn(isBipartite(WALK_N, WALK_EDGES)),
        ],
        [
          "마지막 간선을 [6,3] 으로 옮김",
          String(new Set(sidesFrom(WALK_N, moved, 0).root).size),
          comma(b.entries),
          comma(2 * moved.length),
          yn(isBipartite(WALK_N, moved)),
        ],
      ],
      [1, 2, 3],
    ).join("\n")}
        └ 옮긴 뒤의 쪽 배열은 ${sides.map((x, v) => `${v}:${x}`).join(" ")} 이다`;
  },

  /** 경쟁 설계와의 대조 — 계수는 `.alt.ts` 가 낸 것을 그대로 쓴다. */
  "alt-flip": () => {
    const mine: Record<string, number> = ALT_CASES["쪽 배열 탐색"]();
    const other: Record<string, number> = ALT_CASES["쪽 관계 서로소 집합"]();
    const keys = Object.keys(mine);
    return table(
      [
        ["재는 것", "쪽 배열 탐색", "쪽 관계 서로소 집합", "어느 쪽이 적은가"],
        ...keys.map((k) => {
          const a = mine[k] as number;
          const b = other[k] as number;
          return [
            k,
            comma(a),
            comma(b),
            a === b ? "같다" : a < b ? "쪽 배열 탐색" : "쪽 관계 서로소 집합",
          ];
        }),
      ],
      [1, 2],
    ).join("\n");
  },
};
