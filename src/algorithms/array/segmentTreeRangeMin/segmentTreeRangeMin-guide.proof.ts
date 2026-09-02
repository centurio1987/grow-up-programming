/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts segmentTreeRangeMin-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  type SegOp,
  segmentTreeRangeMin,
} from "./segmentTreeRangeMin-guide.ref.ts";

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

/** `[5 2 4 1 3]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** `[0,4]` 꼴 — 인덱스 구간은 쉼표로 적는다(L25). */
const range = (l: number, r: number): string => `[${l},${r}]`;

/** `INF` 는 자릿수가 커서 표를 무너뜨린다. 이름으로 적는다. */
const INF = Number.MAX_SAFE_INTEGER;
const cell = (v: number | undefined): string =>
  v === undefined ? "—" : v === INF ? "INF" : String(v);

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
const WALK: number[] = [5, 2, 4, 1, 3];

/** 그 배열에 거는 연산 다섯. 질의 넷과 갱신 하나이고 갱신이 가운데 있다. */
const WALK_OPS: SegOp[] = [
  { type: "query", l: 0, r: 4 },
  { type: "query", l: 0, r: 2 },
  { type: "update", i: 3, v: 10 },
  { type: "query", l: 0, r: 4 },
  { type: "query", l: 3, r: 4 },
];

/** 연산 하나를 표에 적을 때의 이름. */
const opName = (op: SegOp): string =>
  op.type === "query"
    ? `query ${range(op.l, op.r)}`
    : `update(i=${op.i}, v=${op.v})`;

/** 질의만 골라 이름을 만든다 — 답 표의 왼쪽 열이다. */
const queryNames = (ops: SegOp[]): string[] =>
  ops.filter((o) => o.type === "query").map(opName);

/* ────────────────────── 계측기 — 배열 접근 수 ────────────────────── */

/**
 * 세는 것은 **배열 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 값이 달라
 * 「본문의 수치가 실측과 같은가」를 정의할 수 없다.
 */

/** 묶음 없이 질의마다 구간을 직접 읽는 절차. */
function scanEachQuery(
  A: number[],
  ops: SegOp[],
): { out: number[]; reads: number; writes: number; perQuery: number[] } {
  const a = A.slice();
  const out: number[] = [];
  const perQuery: number[] = [];
  let reads = 0;
  let writes = 0;
  for (const op of ops) {
    if (op.type === "update") {
      writes++;
      a[op.i] = op.v;
      continue;
    }
    let m = INF;
    let c = 0;
    for (let k = op.l; k <= op.r; k++) {
      reads++;
      c++;
      m = Math.min(m, a[k] ?? INF);
    }
    out.push(m);
    perQuery.push(c);
  }
  return { out, reads, writes, perQuery };
}

/** `B` 칸마다 최솟값 하나를 저장하는 한 층짜리 묶음. `B = 1` 이면 묶음이 없는 것과 같다. */
function blockTable(
  A: number[],
  ops: SegOp[],
  B: number,
): {
  out: number[];
  build: number;
  queryAcc: number;
  updateAcc: number;
  cells: number;
} {
  const N = A.length;
  const a = A.slice();
  const nb = Math.ceil(N / B);
  const bm = new Array<number>(nb).fill(INF);
  let acc = 0;
  for (let j = 0; j < nb; j++) {
    let m = INF;
    for (let k = j * B; k < Math.min(N, j * B + B); k++) {
      acc++;
      m = Math.min(m, a[k] ?? INF);
    }
    acc++;
    bm[j] = m;
  }
  const build = acc;
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  for (const op of ops) {
    const before = acc;
    if (op.type === "update") {
      acc++;
      a[op.i] = op.v;
      const j = Math.floor(op.i / B);
      let m = INF;
      for (let k = j * B; k < Math.min(N, j * B + B); k++) {
        acc++;
        m = Math.min(m, a[k] ?? INF);
      }
      acc++;
      bm[j] = m;
      updateAcc += acc - before;
      continue;
    }
    let m = INF;
    let k = op.l;
    while (k <= op.r) {
      if (k % B === 0 && k + B - 1 <= op.r) {
        acc++;
        m = Math.min(m, bm[k / B] ?? INF);
        k += B;
      } else {
        acc++;
        m = Math.min(m, a[k] ?? INF);
        k++;
      }
    }
    out.push(m);
    queryAcc += acc - before;
  }
  return { out, build, queryAcc, updateAcc, cells: nb };
}

/** 층을 끝까지 쌓은 트리. 정본과 같은 절차이고 접근 계수만 덧붙였다. */
function segCount(
  A: number[],
  ops: SegOp[],
): {
  out: number[];
  build: number;
  queryAcc: number;
  updateAcc: number;
  cells: number;
} {
  const N = A.length;
  const tree = new Array<number>(4 * N).fill(INF);
  let acc = 0;
  const merge = (n: number): number => {
    acc += 2;
    return Math.min(tree[2 * n] ?? INF, tree[2 * n + 1] ?? INF);
  };
  function build(n: number, s: number, e: number): void {
    if (s === e) {
      acc += 2;
      tree[n] = A[s] ?? INF;
      return;
    }
    const mid = (s + e) >> 1;
    build(2 * n, s, mid);
    build(2 * n + 1, mid + 1, e);
    tree[n] = merge(n);
    acc++;
  }
  function upd(n: number, s: number, e: number, i: number, v: number): void {
    if (s === e) {
      acc++;
      tree[n] = v;
      return;
    }
    const mid = (s + e) >> 1;
    if (i <= mid) upd(2 * n, s, mid, i, v);
    else upd(2 * n + 1, mid + 1, e, i, v);
    tree[n] = merge(n);
    acc++;
  }
  function q(n: number, s: number, e: number, l: number, r: number): number {
    if (r < s || e < l) return INF;
    if (l <= s && e <= r) {
      acc++;
      return tree[n] ?? INF;
    }
    const mid = (s + e) >> 1;
    return Math.min(q(2 * n, s, mid, l, r), q(2 * n + 1, mid + 1, e, l, r));
  }
  build(1, 0, N - 1);
  const built = acc;
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  for (const op of ops) {
    const before = acc;
    if (op.type === "update") {
      upd(1, 0, N - 1, op.i, op.v);
      updateAcc += acc - before;
      continue;
    }
    out.push(q(1, 0, N - 1, op.l, op.r));
    queryAcc += acc - before;
  }
  return { out, build: built, queryAcc, updateAcc, cells: 4 * N };
}

/* ────────────────────── 트리의 모양을 그대로 뽑는다 ────────────────────── */

interface NodeInfo {
  node: number;
  s: number;
  e: number;
  value: number;
  depth: number;
}

/** 노드 번호 · 담당 구간 · 값 · 깊이를 순서대로 모은다. */
function treeShape(A: number[]): NodeInfo[] {
  const N = A.length;
  const tree = new Array<number>(4 * N).fill(INF);
  const out: NodeInfo[] = [];
  function build(n: number, s: number, e: number, d: number): void {
    if (s === e) {
      tree[n] = A[s] ?? INF;
    } else {
      const mid = (s + e) >> 1;
      build(2 * n, s, mid, d + 1);
      build(2 * n + 1, mid + 1, e, d + 1);
      tree[n] = Math.min(tree[2 * n] ?? INF, tree[2 * n + 1] ?? INF);
    }
    out.push({ node: n, s, e, value: tree[n] ?? INF, depth: d });
  }
  build(1, 0, N - 1, 0);
  return out.sort((x, y) => x.node - y.node);
}

/** 질의 하나가 어느 노드를 어떻게 판정했는지 그대로 적는다. */
function queryPath(
  A: number[],
  l: number,
  r: number,
): { entered: number; read: number[]; answer: number } {
  const N = A.length;
  const shape = new Map(treeShape(A).map((x) => [x.node, x]));
  const read: number[] = [];
  let entered = 0;
  function q(n: number, s: number, e: number): number {
    entered++;
    if (r < s || e < l) return INF;
    if (l <= s && e <= r) {
      read.push(n);
      return shape.get(n)?.value ?? INF;
    }
    const mid = (s + e) >> 1;
    return Math.min(q(2 * n, s, mid), q(2 * n + 1, mid + 1, e));
  }
  const answer = q(1, 0, N - 1);
  return { entered, read, answer };
}

/** 노드 번호의 최댓값과 트리의 최대 깊이. */
function nodeExtent(N: number): { maxNode: number; depth: number } {
  let maxNode = 0;
  let depth = 0;
  function b(n: number, s: number, e: number, d: number): void {
    maxNode = Math.max(maxNode, n);
    depth = Math.max(depth, d);
    if (s === e) return;
    const mid = (s + e) >> 1;
    b(2 * n, s, mid, d + 1);
    b(2 * n + 1, mid + 1, e, d + 1);
  }
  b(1, 0, N - 1, 0);
  return { maxNode, depth };
}

/**
 * 모든 `(l, r)` 짝에서 진입 노드 수와 읽은 노드 수의 최댓값.
 *
 * 값은 세지 않으므로 트리를 만들지 않는다 — 짝이 `N(N+1)/2` 개라 짝마다 트리를 다시
 * 만들면 `N = 1,024` 에서 끝나지 않는다.
 */
function extremeQuery(N: number): {
  maxEntered: number;
  maxRead: number;
  at: [number, number];
  readAt: [number, number];
} {
  let maxEntered = 0;
  let maxRead = 0;
  let at: [number, number] = [0, 0];
  let readAt: [number, number] = [0, 0];
  let entered = 0;
  let read = 0;
  function walk(s: number, e: number, l: number, r: number): void {
    entered++;
    if (r < s || e < l) return;
    if (l <= s && e <= r) {
      read++;
      return;
    }
    const mid = (s + e) >> 1;
    walk(s, mid, l, r);
    walk(mid + 1, e, l, r);
  }
  for (let l = 0; l < N; l++) {
    for (let r = l; r < N; r++) {
      entered = 0;
      read = 0;
      walk(0, N - 1, l, r);
      if (entered > maxEntered) {
        maxEntered = entered;
        at = [l, r];
      }
      if (read > maxRead) {
        maxRead = read;
        readAt = [l, r];
      }
    }
  }
  return { maxEntered, maxRead, at, readAt };
}

/* ────────────────────── ⑥ 와 ④ 가 쓰는 큰 작업 목록 ────────────────────── */

/**
 * 전개 입력(다섯 칸)은 묶음 크기를 갈라 보기에 너무 작다 — `B` 를 2 로만 잡아도 묶음이
 * 셋뿐이라 계수가 상수에 묻힌다. 그래서 같은 규칙으로 만든 1,024 칸 입력을 쓴다.
 * **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부다.
 */
const BIG_N = 1024;
const BIG_A: number[] = Array.from({ length: BIG_N }, (_, i) => (i * 37) % 101);
const BIG_OPS: SegOp[] = ((): SegOp[] => {
  const ops: SegOp[] = [];
  for (let t = 0; t < 1024; t++) {
    if (t % 2 === 0) {
      ops.push({
        type: "update",
        i: (t * 53) % BIG_N,
        v: ((t * 29) % 1000) - 500,
      });
      continue;
    }
    const a = (t * 37) % BIG_N;
    const b = (t * 91) % BIG_N;
    ops.push({ type: "query", l: Math.min(a, b), r: Math.max(a, b) });
  }
  return ops;
})();

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  segmentTreeRangeMin(A: number[], ops: SegOp[]): number[];
}

const REF = new URL("./segmentTreeRangeMin-guide.ref.ts", import.meta.url)
  .pathname;

/** 통째로 들어가는지 재는 조건을 뒤집은 사본. 부등호의 방향만 다르다. */
const containFlipped = await loadMutant<Impl>(REF, {
  swap: [/l <= s && e <= r/, "s <= l && r <= e"],
});

/** 질의 구간의 오른쪽 끝을 하나 빼고 부르는 사본. 반개구간으로 읽은 것이다. */
const halfOpen = await loadMutant<Impl>(REF, {
  swap: [
    /query\(1, 0, N - 1, op\.l, op\.r\)/,
    "query(1, 0, N - 1, op.l, op.r - 1)",
  ],
});

/** 갱신의 상향 재계산 한 줄을 지운 사본. 불변식을 지키던 그 줄이다. */
const noPullUp = await loadMutant<Impl>(REF, { drop: /\/\/ ⑤/ });

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다. */
function assertBreaks(rows: { bare: string; mutated: string }[]): void {
  if (rows.every((r) => r.bare === r.mutated)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 정본과 변이를 같은 연산 목록에 걸고 답을 나란히 적는다. */
function compareRows(
  A: number[],
  ops: SegOp[],
  mutated: Impl,
): { name: string; bare: string; mutated: string }[] {
  const a = segmentTreeRangeMin([...A], ops);
  const b = mutated.segmentTreeRangeMin([...A], ops);
  return queryNames(ops).map((name, i) => ({
    name,
    bare: cell(a[i]),
    mutated: cell(b[i]),
  }));
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 묶음 없이 풀면 제약 규모에서 몇 번을 읽는가. */
  "naive-scale": () => {
    const rows = [1_000, 10_000].map((n) => {
      const A = Array.from({ length: n }, (_, i) => (i * 37) % 101);
      const ops: SegOp[] = Array.from({ length: n }, () => ({
        type: "query",
        l: 0,
        r: n - 1,
      }));
      const measured = scanEachQuery(A, ops).reads;
      return [num(n), num(measured), num(n * n), `${(n * n) / 100_000_000} 초`];
    });
    rows.push([
      num(100_000),
      "(실행하지 않음)",
      num(100_000 * 100_000),
      "100 초",
    ]);
    return [
      table(["N = Q", "읽은 칸(실측)", "Q·N", "1억 번/초 기준"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 질의가 전부 배열 전체를 묻는 목록이다. 읽은 칸이 정확히 Q·N 이다",
    ].join("\n");
  },

  /** `deep.build` ③ — 접두 최솟값 표로 답해 보면 어느 질의가 맞고 어느 질의가 틀리는가. */
  "prefix-min-fails": () => {
    const A = WALK;
    const pm: number[] = [];
    let m = INF;
    for (const v of A) {
      m = Math.min(m, v);
      pm.push(m);
    }
    const probes: [number, number][] = [
      [0, 4],
      [0, 2],
      [1, 3],
      [2, 2],
      [4, 4],
    ];
    const rows = probes.map(([l, r]) => {
      const bare = segmentTreeRangeMin([...A], [{ type: "query", l, r }])[0];
      const guess = pm[r];
      return [
        range(l, r),
        cell(bare),
        cell(guess),
        bare === guess ? "답이 같다" : "답이 다르다",
      ];
    });
    return [
      `A 의 값        ${show(A)}`,
      `접두 최솟값 표 ${show(pm)}   칸 i 에 A[0..i] 의 최솟값을 담았다`,
      "",
      table(["질의", "정본", "접두 최솟값 표", ""], rows, ["l", "r", "r", "l"]),
      "",
      "└ 왼쪽 끝이 0 인 질의는 정의상 맞고, 나머지는 맞기도 하고 틀리기도 한다",
    ].join("\n");
  },

  /** `deep.build` ④ — 묶음이 없을 때와 한 층 묶었을 때의 실제 계수. */
  "cost-two-ways": () => {
    const bare = scanEachQuery(BIG_A, BIG_OPS);
    const b32 = blockTable(BIG_A, BIG_OPS, 32);
    const same = JSON.stringify(bare.out) === JSON.stringify(b32.out);
    if (!same)
      throw new Error("두 방식의 답이 다르다 — 대조가 성립하지 않는다");
    return [
      table(
        ["방식", "미리 만들기", "질의", "갱신", "합", "저장 칸"],
        [
          [
            "묶음 없음",
            "0",
            num(bare.reads),
            num(bare.writes),
            num(bare.reads + bare.writes),
            "0",
          ],
          [
            "한 층 묶음 B=32",
            num(b32.build),
            num(b32.queryAcc),
            num(b32.updateAcc),
            num(b32.build + b32.queryAcc + b32.updateAcc),
            num(b32.cells),
          ],
        ],
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 답은 둘 다 같다. 질의가 크게 줄고 갱신이 크게 늘었다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 정의를 실제 입력에 걸음마다 적용한 결과. */
  "tree-build": () => {
    const shape = treeShape(WALK);
    return [
      `A 의 값   ${show(WALK)}`,
      `인덱스     ${WALK.map((_, i) => i).join(" ")}`,
      "",
      table(
        ["노드", "담당 구간", "깊이", "값", "어디서 왔는가"],
        shape.map((x) => [
          `노드${x.node}`,
          range(x.s, x.e),
          String(x.depth),
          cell(x.value),
          x.s === x.e
            ? `A[${x.s}]`
            : `min(노드${2 * x.node}, 노드${2 * x.node + 1})`,
        ]),
        ["l", "l", "r", "r", "l"],
      ),
      "",
      "└ 리프는 원소 하나를 그대로 들고, 나머지는 자식 둘의 작은 쪽을 들고 있다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 질의가 노드에 맞을 때와 안 맞을 때 무엇이 달라지는가. */
  "range-split": () => {
    const probes: [number, number][] = [
      [0, 4],
      [0, 2],
      [1, 3],
    ];
    const rows = probes.map(([l, r]) => {
      const p = queryPath(WALK, l, r);
      return [
        range(l, r),
        String(p.entered),
        String(p.read.length),
        p.read.map((n) => `노드${n}`).join(" "),
        cell(p.answer),
      ];
    });
    return [
      table(["질의", "들어간 노드", "읽은 노드", "읽은 자리", "답"], rows, [
        "l",
        "r",
        "r",
        "l",
        "r",
      ]),
      "",
      "└ 구간이 노드 하나와 맞으면 읽기 한 번이고, 안 맞으면 조각으로 갈린다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 묶음 크기를 여러 값으로 두고 잰 총 접근 수. */
  "cost-block": () => {
    const rows = [1, 2, 4, 8, 16, 32, 64, 256, 1024].map((B) => {
      const r = blockTable(BIG_A, BIG_OPS, B);
      return [
        `B=${B}`,
        num(r.build),
        num(r.queryAcc),
        num(r.updateAcc),
        num(r.build + r.queryAcc + r.updateAcc),
        num(r.cells),
      ];
    });
    const t = segCount(BIG_A, BIG_OPS);
    rows.push([
      "층을 쌓은 트리",
      num(t.build),
      num(t.queryAcc),
      num(t.updateAcc),
      num(t.build + t.queryAcc + t.updateAcc),
      num(t.cells),
    ]);
    return [
      table(
        ["묶음 크기", "미리 만들기", "질의", "갱신", "합", "저장 칸"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 한 층 묶음의 최소는 가운데 어딘가에 있고, 층을 쌓으면 그보다도 적다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 통째로 들어가는지 재는 조건을 뒤집으면 어느 질의가 살아남는가. */
  "pause-contain-flip": () => {
    const rows = compareRows(WALK, WALK_OPS, containFlipped);
    assertBreaks(rows);
    return [
      table(
        ["질의", "바른 코드", "조건을 뒤집은 코드", ""],
        rows.map((r) => [
          r.name,
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 질의가 배열 전체일 때만 답이 같다. 뿌리가 곧 답이라 조건의 방향이 답에 안 나타난다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 오른쪽 끝을 하나 빼면 어느 질의가 살아남는가. */
  "pause-half-open": () => {
    const rows = compareRows(WALK, WALK_OPS, halfOpen);
    const single: SegOp[] = [{ type: "query", l: 2, r: 2 }];
    const singleRow = compareRows(WALK, single, halfOpen)[0];
    if (singleRow !== undefined) rows.push(singleRow);
    assertBreaks(rows);
    return [
      table(
        ["질의", "바른 코드", "오른쪽 끝을 뺀 코드", ""],
        rows.map((r) => [
          r.name,
          r.bare,
          r.mutated,
          r.bare === r.mutated ? "답이 같다" : "답이 다르다",
        ]),
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 오른쪽 끝의 값이 그 구간의 최솟값이 아니면 답이 같다. 마지막 줄은 구간이 사라져 INF 다",
    ].join("\n");
  },

  /** `deep.math` — 진입 노드 수의 상한과 실측의 대조. */
  "visit-bound": () => {
    const rows = [5, 8, 16, 64, 256, 1024].map((N) => {
      const D = Math.ceil(Math.log2(N));
      const x = extremeQuery(N);
      return [
        num(N),
        String(D),
        String(1 + 4 * D),
        String(x.maxEntered),
        range(x.at[0], x.at[1]),
        String(2 * D),
        String(x.maxRead),
      ];
    });
    return [
      table(
        [
          "N",
          "D",
          "상한 1+4D",
          "실측 최대 진입",
          "그 짝",
          "상한 2D",
          "실측 최대 읽기",
        ],
        rows,
        ["r", "r", "r", "r", "l", "r", "r"],
      ),
      "",
      "└ 두 상한 다 실측을 웃돈다. 최대를 만드는 짝이 배열 전체가 아니라는 것도 함께 나온다",
    ].join("\n");
  },

  /** `deep.math` — 노드 번호가 어디까지 커지는가. */
  "node-index": () => {
    const rows = [5, 6, 10, 16, 100, 1_000, 100_000].map((N) => {
      const D = Math.ceil(Math.log2(N));
      const x = nodeExtent(N);
      return [
        num(N),
        String(D),
        String(x.depth),
        num(x.maxNode),
        num(2 ** (D + 1)),
        num(2 * N),
        num(4 * N),
        x.maxNode < 2 * N ? "충분" : "모자람",
      ];
    });
    let short = 0;
    for (let N = 1; N <= 200; N++) {
      if (nodeExtent(N).maxNode >= 2 * N) short++;
    }
    return [
      table(
        [
          "N",
          "D",
          "실측 최대 깊이",
          "실측 최대 번호",
          "2^(D+1)",
          "2N",
          "4N",
          "2N 이면",
        ],
        rows,
        ["r", "r", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `└ 실측 최대 깊이가 D 와 늘 같고, 최대 번호가 2^(D+1) 아래다`,
      `  N 이 1 부터 200 까지 중 2N 칸으로 모자란 것이 ${short} 개다`,
    ].join("\n");
  },

  /** `invariant` ③ — 불변식을 지키던 줄을 지우면 무엇이 나오는가. */
  "mutant-no-pullup": () => {
    const rows = compareRows(WALK, WALK_OPS, noPullUp);
    assertBreaks(rows);
    return [
      table(
        ["질의", "바른 코드", "상향 재계산을 지운 코드", "차이"],
        rows.map((r) => [
          r.name,
          r.bare,
          r.mutated,
          String(Number(r.mutated) - Number(r.bare)),
        ]),
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 갱신 앞의 질의 둘은 그대로이고, 갱신 뒤의 질의 둘이 옛 값을 답한다",
    ].join("\n");
  },

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const t = segCount(WALK, WALK_OPS);
    const bare = scanEachQuery(WALK, WALK_OPS);
    return [
      table(
        ["갈래", "걸음", "배열 접근"],
        [
          ["트리를 채운다", "T1", num(t.build)],
          ["질의 넷", "T2 · T3~T6 · T10 · T11~T13", num(t.queryAcc)],
          ["갱신 하나", "T7~T9", num(t.updateAcc)],
          ["합", "", num(t.build + t.queryAcc + t.updateAcc)],
        ],
        ["l", "l", "r"],
      ),
      "",
      `└ 같은 연산 목록을 묶음 없이 처리하면 ${num(bare.reads + bare.writes)} 번이다.`,
      "  다섯 칸짜리 입력에서는 미리 만드는 값이 아직 비용을 못 갚는다",
    ].join("\n");
  },

  /** `perf.worst` — 질의의 모양이 비용을 어떻게 바꾸는가. */
  "worst-shape": () => {
    const N = 1024;
    const A = new Array<number>(N).fill(0);
    const x = extremeQuery(N);
    const shapes: [string, number, number][] = [
      ["배열 전체", 0, N - 1],
      ["왼쪽 절반", 0, N / 2 - 1],
      ["한 칸", 500, 500],
      ["들어간 노드가 최대인 짝", x.at[0], x.at[1]],
      ["읽은 노드가 최대인 짝", x.readAt[0], x.readAt[1]],
    ];
    const rows = shapes.map(([name, l, r]) => {
      const p = queryPath(A, l, r);
      return [
        name,
        range(l, r),
        num(r - l + 1),
        String(p.entered),
        String(p.read.length),
      ];
    });
    return [
      table(
        ["질의의 모양", "구간", "구간의 칸 수", "들어간 노드", "읽은 노드"],
        rows,
        ["l", "l", "r", "r", "r"],
      ),
      "",
      "└ 가장 긴 구간이 가장 적다. 칸 수와 노드 수가 같은 방향으로 가지 않는다",
    ].join("\n");
  },
};
