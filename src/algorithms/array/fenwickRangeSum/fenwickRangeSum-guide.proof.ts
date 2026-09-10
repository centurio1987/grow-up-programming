/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts fenwickRangeSum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  type FenwickOp,
  fenwickRangeSum,
} from "./fenwickRangeSum-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 한글 한 글자는 고정폭 화면에서 두 칸을 먹는다. 글자 수로 맞추면 머리줄만 어긋난다. */
const cells = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padR = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - cells(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - cells(s))) + s;

/** 열 폭을 값에서 계산해 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로다. */
function grid(head: string[], rows: string[][], align: string): string {
  const w = head.map((h, c) =>
    Math.max(cells(h), ...rows.map((r) => cells(r[c] ?? ""))),
  );
  const draw = (row: string[]): string =>
    row
      .map((c, i) =>
        align[i] === "r" ? padL(c, w[i] ?? 0) : padR(c, w[i] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [draw(head), ...rows.map(draw)].join("\n");
}

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** `[1 2 3]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const values = (xs: number[]): string => `[${xs.join(" ")}]`;

/** `[0,4]` 꼴 — 인덱스 구간은 쉼표로 적는다(L25). */
const span = (l: number, r: number): string => `[${l},${r}]`;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK: number[] = [1, 2, 3, 4, 5];

/** 그 배열에 거는 연산 넷. 질의 셋과 갱신 하나이고 갱신이 가운데 있다. */
const WALK_OPS: FenwickOp[] = [
  { type: "query", l: 0, r: 4 },
  { type: "update", i: 2, v: 10 },
  { type: "query", l: 0, r: 4 },
  { type: "query", l: 2, r: 3 },
];

/** 연산 하나를 표에 적을 때의 이름. */
const opName = (op: FenwickOp): string =>
  op.type === "query"
    ? `query ${span(op.l, op.r)}`
    : `update(i=${op.i}, v=${op.v})`;

/** 질의만 골라 이름을 만든다 — 답 표의 왼쪽 열이다. */
const queryNames = (ops: FenwickOp[]): string[] =>
  ops.filter((o) => o.type === "query").map(opName);

/* ────────────────────── 계측기 — 배열 접근 수 ────────────────────── */

/**
 * 세는 것은 **배열 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 값이 달라
 * 「본문의 수치가 실측과 같은가」를 정의할 수 없다.
 */
interface Counted {
  out: number[];
  build: number;
  queryAcc: number;
  updateAcc: number;
  extraCells: number;
}

const lowbit = (k: number): number => k & -k;

/** 질의마다 구간을 직접 더한다. 미리 만드는 것이 없다. */
function scanEach(A: number[], ops: FenwickOp[]): Counted {
  const a = A.slice();
  const out: number[] = [];
  let queryAcc = 0;
  let updateAcc = 0;
  for (const op of ops) {
    if (op.type === "update") {
      updateAcc++;
      a[op.i] = op.v;
      continue;
    }
    let s = 0;
    for (let k = op.l; k <= op.r; k++) {
      queryAcc++;
      s += a[k] ?? 0;
    }
    out.push(s);
  }
  return { out, build: 0, queryAcc, updateAcc, extraCells: 0 };
}

/** 누적합 표 — `P[k]` 에 앞 `k` 개의 합을 담는다. 질의는 뺄셈 한 번이다. */
function prefixTable(A: number[], ops: FenwickOp[]): Counted {
  const N = A.length;
  const a = A.slice();
  const P = new Array<number>(N + 1).fill(0);
  let build = 0;
  for (let i = 0; i < N; i++) {
    build += 3; // P[i] 읽기 · a[i] 읽기 · P[i+1] 쓰기
    P[i + 1] = (P[i] ?? 0) + (a[i] ?? 0);
  }
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      updateAcc += 2; // a[i] 읽기 · a[i] 쓰기
      const d = op.v - (a[op.i] ?? 0);
      a[op.i] = op.v;
      for (let k = op.i + 1; k <= N; k++) {
        updateAcc += 2; // P[k] 읽기 · P[k] 쓰기
        P[k] = (P[k] ?? 0) + d;
      }
      continue;
    }
    queryAcc += 2;
    out.push((P[op.r + 1] ?? 0) - (P[op.l] ?? 0));
  }
  return { out, build, queryAcc, updateAcc, extraCells: N + 1 };
}

/** 고정 크기 `B` 칸마다 합 하나를 저장한다. 갱신은 그 칸 하나만 고치면 된다. */
function blockTable(A: number[], ops: FenwickOp[], B: number): Counted {
  const N = A.length;
  const a = A.slice();
  const nb = Math.ceil(N / B);
  const sums = new Array<number>(nb).fill(0);
  let build = 0;
  for (let i = 0; i < N; i++) {
    build++; // a[i] 읽기
    const j = Math.floor(i / B);
    sums[j] = (sums[j] ?? 0) + (a[i] ?? 0);
  }
  build += nb; // 묶음 합 쓰기
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      updateAcc += 4; // a[i] 읽기·쓰기 · 묶음 합 읽기·쓰기
      const d = op.v - (a[op.i] ?? 0);
      a[op.i] = op.v;
      const j = Math.floor(op.i / B);
      sums[j] = (sums[j] ?? 0) + d;
      continue;
    }
    let s = 0;
    let k = op.l;
    while (k <= op.r) {
      queryAcc++;
      if (k % B === 0 && k + B - 1 <= op.r) {
        s += sums[k / B] ?? 0;
        k += B;
      } else {
        s += a[k] ?? 0;
        k++;
      }
    }
    out.push(s);
  }
  return { out, build, queryAcc, updateAcc, extraCells: nb };
}

/** 정본과 같은 절차이고 접근 계수만 덧붙였다. */
function fenwickCount(A: number[], ops: FenwickOp[]): Counted {
  const N = A.length;
  const a = A.slice();
  const tree = new Array<number>(N + 1).fill(0);
  let build = 0;
  for (let i = 1; i <= N; i++) {
    build += 2; // a[i-1] 읽기 · tree[i] 쓰기
    tree[i] = a[i - 1] ?? 0;
  }
  for (let i = 1; i <= N; i++) {
    const j = i + lowbit(i);
    if (j > N) continue;
    build += 3; // tree[i] 읽기 · tree[j] 읽기 · tree[j] 쓰기
    tree[j] = (tree[j] ?? 0) + (tree[i] ?? 0);
  }
  let queryAcc = 0;
  let updateAcc = 0;
  const out: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      updateAcc += 2; // a[i] 읽기 · a[i] 쓰기
      const d = op.v - (a[op.i] ?? 0);
      a[op.i] = op.v;
      for (let k = op.i + 1; k <= N; k += lowbit(k)) {
        updateAcc += 2; // tree[k] 읽기 · tree[k] 쓰기
        tree[k] = (tree[k] ?? 0) + d;
      }
      continue;
    }
    let s = 0;
    for (let k = op.r + 1; k > 0; k -= lowbit(k)) {
      queryAcc++;
      s += tree[k] ?? 0;
    }
    for (let k = op.l; k > 0; k -= lowbit(k)) {
      queryAcc++;
      s -= tree[k] ?? 0;
    }
    out.push(s);
  }
  return { out, build, queryAcc, updateAcc, extraCells: N + 1 };
}

const total = (c: Counted): number => c.build + c.queryAcc + c.updateAcc;

/* ────────────────────── 트리의 모양을 그대로 뽑는다 ────────────────────── */

interface CellInfo {
  k: number;
  bits: string;
  low: number;
  from: number;
  to: number;
  value: number;
}

/** 칸 번호 · 이진 표기 · 담당 구간 · 값. */
function shape(A: number[]): CellInfo[] {
  const N = A.length;
  const out: CellInfo[] = [];
  for (let k = 1; k <= N; k++) {
    const low = lowbit(k);
    let sum = 0;
    for (let t = k - low + 1; t <= k; t++) sum += A[t - 1] ?? 0;
    out.push({
      k,
      bits: k.toString(2).padStart(Math.max(3, N.toString(2).length), "0"),
      low,
      from: k - low + 1,
      to: k,
      value: sum,
    });
  }
  return out;
}

/** `prefix(r)` 가 더하는 칸을 순서대로. */
function prefixChain(r: number): number[] {
  const out: number[] = [];
  for (let k = r; k > 0; k -= lowbit(k)) out.push(k);
  return out;
}

/** `add(i, …)` 가 고치는 칸을 순서대로. */
function addChain(i: number, N: number): number[] {
  const out: number[] = [];
  for (let k = i; k <= N; k += lowbit(k)) out.push(k);
  return out;
}

const popcount = (n: number): number =>
  n
    .toString(2)
    .split("")
    .filter((c) => c === "1").length;

/* ────────────────────── ④⑥ 이 쓰는 큰 작업 목록 ────────────────────── */

/**
 * 전개 입력(다섯 칸)은 묶음 크기를 갈라 보기에 너무 작다 — `B` 를 2 로만 잡아도 묶음이
 * 셋뿐이라 계수가 상수에 묻힌다. 그래서 같은 규칙으로 만든 1,024 칸 입력을 쓴다.
 * **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부다.
 */
const BIG_N = 1024;
const BIG_A: number[] = Array.from({ length: BIG_N }, (_, i) => (i * 41) % 97);

/** 질의 `t` 번째. `a = (23t) mod N`, `b = (67t) mod N` 중 작은 쪽이 왼쪽 끝이다. */
function queryAt(t: number): FenwickOp {
  const a = (t * 23) % BIG_N;
  const b = (t * 67) % BIG_N;
  return { type: "query", l: Math.min(a, b), r: Math.max(a, b) };
}

/** 갱신 `k` 번째. `A[(59k) mod N]` 를 `((31k) mod 1000) − 500` 으로 덮어쓴다. */
function updateAt(k: number): FenwickOp {
  return { type: "update", i: (k * 59) % BIG_N, v: ((k * 31) % 1000) - 500 };
}

/** 갱신 `u` 회를 질의 `q` 회 사이에 고르게 끼운 목록. 네 방식이 같은 목록을 받는다. */
function workload(q: number, u: number): FenwickOp[] {
  const ops: FenwickOp[] = [];
  let done = 0;
  for (let i = 0; i < q; i++) {
    const want = Math.floor(((i + 1) * u) / q);
    while (done < want) {
      ops.push(updateAt(done));
      done++;
    }
    ops.push(queryAt(i));
  }
  while (done < u) {
    ops.push(updateAt(done));
    done++;
  }
  return ops;
}

/** 질의 512 개와 갱신 512 개를 고르게 섞은 목록. ④ 와 ⑥ 이 같은 것을 쓴다. */
const BIG_OPS: FenwickOp[] = workload(512, 512);

/** 네 방식의 답이 같은지 확인한다. 다르면 대조가 성립하지 않는다. */
function sameAnswers(...runs: Counted[]): void {
  const first = JSON.stringify(runs[0]?.out ?? []);
  for (const r of runs) {
    if (JSON.stringify(r.out) !== first) {
      throw new Error("방식마다 답이 다르다 — 대조가 성립하지 않는다");
    }
  }
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  fenwickRangeSum(A: number[], ops: FenwickOp[]): number[];
}

const REF = new URL("./fenwickRangeSum-guide.ref.ts", import.meta.url).pathname;

/** 넘겨주는 바퀴를 내림차순으로 돌린 사본. 순서만 다르다. */
const descending = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let i = 1; i <= N; i\+\+\) \{/,
    "for (let i = N; i >= 1; i--) {",
  ],
});

/** 논리 배열을 함께 고치지 않는 사본. 변화량을 옛 값에서 만드는 것은 그대로다. */
const noSync = await loadMutant<Impl>(REF, {
  drop: /arr\[op\.i\] = op\.v;/,
});

/** 덮어쓸 값을 변화량으로 바꾸지 않고 그대로 더하는 사본. */
const rawValue = await loadMutant<Impl>(REF, {
  swap: [
    /const delta = op\.v - \(arr\[op\.i\] \?\? 0\);/,
    "const delta = op.v;",
  ],
});

/** 담당 칸을 따라가는 걸음을 1 로 바꾼 사본. 불변식을 지키던 그 줄이다. */
const stepOne = await loadMutant<Impl>(REF, {
  swap: [/k \+= lowbit\(k\)/, "k += 1"],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. */
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
  ops: FenwickOp[],
  mutated: Impl,
): { name: string; bare: string; mutated: string }[] {
  const good = fenwickRangeSum([...A], ops);
  const bad = mutated.fenwickRangeSum([...A], ops);
  return queryNames(ops).map((name, i) => ({
    name,
    bare: String(good[i] ?? "—"),
    mutated: String(bad[i] ?? "—"),
  }));
}

const verdict = (r: { bare: string; mutated: string }): string =>
  r.bare === r.mutated ? "답이 같다" : "답이 다르다";

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ②③ — 두 방식이 제약 규모에서 각각 어느 쪽으로 무너지는가. */
  "two-ways-scale": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const A = Array.from({ length: n }, (_, i) => (i * 41) % 97);
      const asks: FenwickOp[] = Array.from({ length: n }, () => ({
        type: "query",
        l: 0,
        r: n - 1,
      }));
      const puts: FenwickOp[] = Array.from({ length: n }, (_, k) => ({
        type: "update",
        i: (k * 59) % n,
        v: ((k * 31) % 1000) - 500,
      }));
      rows.push([
        num(n),
        num(scanEach(A, asks).queryAcc),
        num(scanEach(A, puts).updateAcc),
        num(prefixTable(A, asks).queryAcc),
        num(prefixTable(A, puts).updateAcc),
      ]);
    }
    // 10^10 번은 돌리지 않는다. 두 식이 위 두 줄의 실측과 맞는 것을 보고 값을 낸다.
    const n = 100_000;
    let tableUpdate = 0;
    for (let k = 0; k < n; k++) tableUpdate += 2 + 2 * (n - ((k * 59) % n));
    rows.push([
      `${num(n)} (식)`,
      num(n * n),
      num(n),
      num(2 * n),
      num(tableUpdate),
    ]);
    return [
      grid(
        [
          "N = Q",
          "직접 · 질의",
          "직접 · 갱신",
          "누적합 · 질의",
          "누적합 · 갱신",
        ],
        rows,
        "rrrrr",
      ),
      "",
      "└ 질의 N 개는 전부 배열 전체를 묻고, 갱신 N 개는 인덱스 (59k) mod N 를 덮어쓴다",
      "  미리 만드는 값은 뺀 수다. 한쪽이 작아지면 반대쪽이 그만큼 커진다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 작업 목록에서 두 방식의 실제 계수. */
  "mixed-load": () => {
    const bare = scanEach(BIG_A, BIG_OPS);
    const table = prefixTable(BIG_A, BIG_OPS);
    sameAnswers(bare, table);
    return [
      grid(
        ["방식", "미리 만들기", "질의 512 개", "갱신 512 개", "합", "추가 칸"],
        [
          [
            "직접 더하기",
            num(bare.build),
            num(bare.queryAcc),
            num(bare.updateAcc),
            num(total(bare)),
            num(bare.extraCells),
          ],
          [
            "누적합 표",
            num(table.build),
            num(table.queryAcc),
            num(table.updateAcc),
            num(total(table)),
            num(table.extraCells),
          ],
        ],
        "lrrrrr",
      ),
      "",
      "└ 답은 둘 다 같다. 질의가 크게 줄고 갱신이 그보다 크게 늘었다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 담당 구간의 길이를 최하위 비트로 정하면 어떤 모양이 되는가. */
  "lowbit-cover": () => {
    const eight = Array.from({ length: 8 }, (_, i) => i + 1);
    const rows = shape(eight).map((c) => [
      String(c.k),
      c.bits,
      String(c.low),
      span(c.from, c.to),
      String(c.to - c.from + 1),
    ]);
    return [
      grid(
        ["칸 k", "k 의 이진 표기", "담당 길이", "담당 구간", "칸 수"],
        rows,
        "rlrlr",
      ),
      "",
      "└ 칸 여덟 개가 길이 1·2·4·8 짜리 구간을 함께 덮는다",
      "  길이가 긴 칸은 적고 짧은 칸은 많다 — 이 분포가 두 비용을 함께 누른다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 묶음 크기를 여러 값으로 두고 잰 총 접근 수. */
  "block-size": () => {
    const rows = [1, 2, 4, 8, 16, 32, 64, 256, 1024].map((B) => {
      const r = blockTable(BIG_A, BIG_OPS, B);
      return [
        `B=${B}`,
        num(r.build),
        num(r.queryAcc),
        num(r.updateAcc),
        num(total(r)),
        num(r.extraCells),
      ];
    });
    const f = fenwickCount(BIG_A, BIG_OPS);
    sameAnswers(blockTable(BIG_A, BIG_OPS, 32), f);
    rows.push([
      "최하위 비트",
      num(f.build),
      num(f.queryAcc),
      num(f.updateAcc),
      num(total(f)),
      num(f.extraCells),
    ]);
    return [
      grid(
        ["담당 길이", "미리 만들기", "질의", "갱신", "합", "추가 칸"],
        rows,
        "lrrrrr",
      ),
      "",
      "└ 고정 길이의 최소는 가운데 어딘가에 있고, 길이를 섞으면 그보다도 적다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 넘겨주는 바퀴를 내림차순으로 돌리면 어느 답이 달라지는가. */
  "pause-build-order": () => {
    const rows = compareRows(WALK, WALK_OPS, descending);
    assertBreaks(rows);
    return [
      grid(
        ["질의", "바른 코드", "내림차순으로 지나간 코드", ""],
        rows.map((r) => [r.name, r.bare, r.mutated, verdict(r)]),
        "lrrl",
      ),
      "",
      "└ 세 답이 전부 1 씩 작다 — 칸 4 가 10 대신 9 를 들고 있다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 논리 배열을 안 고치면 언제 답이 달라지는가. */
  "pause-no-sync": () => {
    const rows = compareRows(WALK, WALK_OPS, noSync);
    const twice: FenwickOp[] = [
      { type: "update", i: 0, v: 5 },
      { type: "update", i: 0, v: 10 },
      { type: "query", l: 0, r: 0 },
    ];
    const extra = compareRows([1, 2, 3], twice, noSync)[0];
    if (extra !== undefined) {
      rows.push({ ...extra, name: `${extra.name} · 같은 자리를 두 번 갱신` });
    }
    assertBreaks(rows);
    return [
      grid(
        ["질의", "바른 코드", "논리 배열을 안 고친 코드", ""],
        rows.map((r) => [r.name, r.bare, r.mutated, verdict(r)]),
        "lrrl",
      ),
      "",
      "└ 한 자리를 한 번만 갱신하는 목록에서는 답이 전부 같다. 마지막 줄만 다르다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 덮어쓸 값을 그대로 더하면 어느 입력에서 답이 안 틀리는가. */
  "pause-raw-value": () => {
    const rows = compareRows(WALK, WALK_OPS, rawValue);
    const zeros: FenwickOp[] = [
      { type: "update", i: 1, v: 7 },
      { type: "query", l: 0, r: 2 },
    ];
    const extra = compareRows([0, 0, 0], zeros, rawValue)[0];
    if (extra !== undefined) {
      rows.push({ ...extra, name: `${extra.name} · A = [0 0 0]` });
    }
    assertBreaks(rows);
    return [
      grid(
        ["질의", "바른 코드", "값을 그대로 더한 코드", ""],
        rows.map((r) => [r.name, r.bare, r.mutated, verdict(r)]),
        "lrrl",
      ),
      "",
      "└ 갱신 앞의 질의와 옛 값이 0 인 자리는 답이 같다. 초기값이 0 인 배열로 시험하면 통과한다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력의 다섯 칸에 그대로 넣어 본다. */
  "cell-check": () => {
    const rows = shape(WALK).map((c) => [
      String(c.k),
      c.bits,
      span(c.from, c.to),
      values(WALK.slice(c.from - 1, c.to)),
      String(c.value),
    ]);
    return [
      `A 의 값   ${values(WALK)}`,
      `인덱스     ${WALK.map((_, i) => i).join(" ")}`,
      "",
      grid(
        [
          "칸 k",
          "k 의 이진 표기",
          "담당 구간(1 부터)",
          "그 구간의 값",
          "tree[k]",
        ],
        rows,
        "rllll",
      ),
      "",
      "└ 담당 구간은 오른쪽 끝이 k 이고 길이가 k 의 최하위 비트다",
    ].join("\n");
  },

  /** `deep.math` ③ — 접두 합이 더하는 칸 수가 1 비트 개수와 같은가. */
  "term-count": () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 15, 16].map((r) => {
      const chain = prefixChain(r);
      return [
        String(r),
        r.toString(2),
        chain.join(" "),
        String(chain.length),
        String(popcount(r)),
      ];
    });
    const worst = Array.from({ length: 100_000 }, (_, i) => popcount(i + 1));
    return [
      grid(
        [
          "r",
          "r 의 이진 표기",
          "prefix(r) 가 더하는 칸",
          "칸 수",
          "1 비트 개수",
        ],
        rows,
        "rllrr",
      ),
      "",
      `└ 두 열이 모든 줄에서 같다. r 이 1 부터 100,000 까지일 때 칸 수의 최댓값은 ${Math.max(...worst)} 이다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 칸마다 한 번씩 넘기는 것과 칸마다 따로 올라가는 것의 차이. */
  "build-cost": () => {
    const rows = [8, 16, 1024, 65_536].map((n) => {
      let byAdd = 0;
      for (let i = 1; i <= n; i++) byAdd += addChain(i, n).length;
      const m = Math.log2(n);
      const closed = (n / 2) * (m + 2);
      let handOver = 0;
      for (let i = 1; i <= n; i++) if (i + lowbit(i) <= n) handOver++;
      return [
        num(n),
        String(m),
        num(byAdd),
        num(closed),
        num(handOver),
        (byAdd / handOver).toFixed(1),
      ];
    });
    return [
      grid(
        [
          "N",
          "log₂ N",
          "칸마다 올라가면",
          "(N/2)(log₂N + 2)",
          "한 번씩 넘기면",
          "배수",
        ],
        rows,
        "rrrrrr",
      ),
      "",
      "└ 셋째 열과 넷째 열이 모든 줄에서 같다. N 이 2 의 거듭제곱이면 넘기는 쪽이 N − 1 회다",
    ].join("\n");
  },

  /** `invariant` ③ — 불변식을 지키던 걸음을 1 로 바꾸면 무엇이 나오는가. */
  "mutant-step-one": () => {
    const rows = compareRows(WALK, WALK_OPS, stepOne);
    assertBreaks(rows);
    return [
      grid(
        ["질의", "바른 코드", "걸음을 1 로 바꾼 코드", "차이"],
        rows.map((r) => [
          r.name,
          r.bare,
          r.mutated,
          String(Number(r.mutated) - Number(r.bare)),
        ]),
        "lrrr",
      ),
      "",
      "└ 갱신이 칸 5 까지 건드린다. 칸 5 를 읽는 질의만 7 만큼 커지고 나머지는 그대로다",
    ].join("\n");
  },

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const f = fenwickCount(WALK, WALK_OPS);
    const bare = scanEach(WALK, WALK_OPS);
    return [
      grid(
        ["갈래", "걸음", "배열 접근"],
        [
          ["칸을 채운다", "T1~T4", num(f.build)],
          ["질의 셋", "T5~T7 · T11 · T12~T13", num(f.queryAcc)],
          ["갱신 하나", "T8~T10", num(f.updateAcc)],
          ["합", "", num(total(f))],
        ],
        "llr",
      ),
      "",
      `└ 같은 연산 목록을 직접 더하기로 처리하면 ${num(total(bare))} 번이다.`,
      "  다섯 칸에서는 칸을 채우는 19 번이 전체의 절반을 넘어 아직 손해다",
    ].join("\n");
  },

  /** `perf.derive` — 제약 규모에서 세 갈래가 각각 몇 번인가. */
  "scale-cost": () => {
    const n = 100_000;
    let handOver = 0;
    for (let i = 1; i <= n; i++) if (i + lowbit(i) <= n) handOver++;
    const build = 2 * n + 3 * handOver;

    // 뒤에서부터 훑으며 `popcount(t)` 의 최댓값을 들고 오면 짝을 전수로 안 봐도 된다.
    let bestQuery = 0;
    let bestPair: [number, number] = [0, 0];
    let tailBest = 0;
    let tailAt = n;
    for (let l = n - 1; l >= 0; l--) {
      if (popcount(l + 1) > tailBest) {
        tailBest = popcount(l + 1);
        tailAt = l + 1;
      }
      if (popcount(l) + tailBest > bestQuery) {
        bestQuery = popcount(l) + tailBest;
        bestPair = [l, tailAt - 1];
      }
    }

    let bestUpdate = 0;
    let bestIndex = 0;
    for (let i = 0; i < n; i++) {
      const len = addChain(i + 1, n).length;
      if (len > bestUpdate) {
        bestUpdate = len;
        bestIndex = i;
      }
    }
    const updateCost = 2 + 2 * bestUpdate;
    const perOp = Math.max(bestQuery, updateCost);

    return [
      grid(
        ["갈래", "무엇을 세는가", "값", "그것을 만드는 자리"],
        [
          ["칸 채우기", `2N + 3 × ${num(handOver)}`, num(build), "한 번뿐이다"],
          [
            "질의 하나",
            "읽은 칸의 최대",
            String(bestQuery),
            `${span(bestPair[0], bestPair[1])}`,
          ],
          [
            "갱신 하나",
            `2 + 2 × ${bestUpdate}`,
            String(updateCost),
            `i = ${bestIndex}`,
          ],
          [
            "최악을 다 더하면",
            `채우기 + Q × ${perOp}`,
            num(build + n * perOp),
            "Q = 100,000",
          ],
        ],
        "llrl",
      ),
      "",
      "└ 세는 것은 배열 접근 전부다 — tree 읽기·쓰기와 논리 배열 읽기·쓰기",
    ].join("\n");
  },

  /** `perf.worst` — 질의의 모양이 읽는 칸 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const n = 1024;
    let best: [number, number] = [0, 0];
    let most = 0;
    for (let l = 0; l < n; l++) {
      for (let r = l; r < n; r++) {
        const c = popcount(l) + popcount(r + 1);
        if (c > most) {
          most = c;
          best = [l, r];
        }
      }
    }
    const shapes: [string, number, number][] = [
      ["배열 전체", 0, n - 1],
      ["왼쪽 절반", 0, n / 2 - 1],
      ["한 칸", 500, 500],
      ["읽은 칸이 최대인 짝", best[0], best[1]],
    ];
    const rows = shapes.map(([name, l, r]) => [
      name,
      span(l, r),
      num(r - l + 1),
      String(popcount(l)),
      String(popcount(r + 1)),
      String(popcount(l) + popcount(r + 1)),
    ]);
    return [
      grid(
        [
          "질의의 모양",
          "구간",
          "구간의 칸 수",
          "l 의 1 비트",
          "r+1 의 1 비트",
          "읽은 칸",
        ],
        rows,
        "llrrrr",
      ),
      "",
      "└ 가장 긴 구간이 가장 적다. 칸 수와 읽은 칸이 같은 방향으로 가지 않는다",
    ].join("\n");
  },
};
