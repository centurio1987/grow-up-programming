/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 차분 배열의 칸과 복원 걸음은 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/diffArrayRangeUpdate/diffArrayRangeUpdate-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as benchCases } from "./diffArrayRangeUpdate-guide.alt.ts";
import {
  byDefinition,
  diffOf,
  mismatches,
  N_MAX,
  scanEach,
  secondsOf,
  shortRun,
  showUpdate,
  startOnly,
  trace,
  type Update,
  WALK_N,
  WALK_U,
  walkSteps,
} from "./diffArrayRangeUpdate-guide.fig.tsx";
import { diffArrayRangeUpdate } from "./diffArrayRangeUpdate-guide.ref.ts";

const REF = new URL("./diffArrayRangeUpdate-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** `[3 4 7]` 꼴 — 값의 나열이라 쉼표를 쓰지 않는다(인덱스 구간 `[a,b]` 와 가른다). */
const show = (xs: readonly number[]): string => `[${xs.join(" ")}]`;

/** 음수는 괄호로 싼다 — 식 안에서 부호와 연산자가 붙지 않게. */
const paren = (v: number): string => (v < 0 ? `(${v})` : String(v));

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

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 텍스트 펜스의 칸 맞춤을 값에서 잰다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 텍스트 펜스의 열 맞춤 — 열 폭을 값에서 계산한다. 마지막 열은 채우지 않는다. */
function columns(rows: string[][]): string[] {
  const w = rows.reduce<number[]>(
    (acc, r) => r.map((c, i) => Math.max(acc[i] ?? 0, width(c))),
    [],
  );
  return rows.map((r) =>
    r
      .map((c, i) => (i === r.length - 1 ? c : pad(c, w[i] ?? 0)))
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/** 펜스 안의 줄 — 펜스 줄(```)은 본문이 적는다. */
const block = (body: string[]): string => body.join("\n");

/** 증명 표에 붙는 문장 — 표 아래 한 문단(SPEC §12). 닫는 마커는 본문이 적는다. */
const withNote = (table: string, note: string): string => `${table}\n\n${note}`;

/* ────────────────────────── 변이 ────────────────────────── */

interface Impl {
  diffArrayRangeUpdate(
    N: number,
    updates: Array<[number, number, number]>,
  ): number[];
}

/**
 * 복원 루프의 두 줄 순서를 바꾼 사본 — 누적하는 줄 자리에 「적고 → 더하고 → 다음 바퀴로」를 넣어,
 * 원래의 적는 줄은 건너뛰게 한다. 한 줄만 바꾸는 것이라 **정본 소스에서 기계로 만든다.**
 */
const writeFirst = await loadMutant<Impl>(REF, {
  swap: [
    /^(\s*)running \+= D\[i\] as number;$/,
    "$1A[i] = running;\n$1running += D[i] as number;\n$1continue;",
  ],
});

/** 누적하지 않고 그 칸의 값만 그대로 옮기는 사본. 불변식을 지키던 줄 하나가 그 대상이다. */
const noAccumulate = await loadMutant<Impl>(REF, {
  swap: [/running \+= D\[i\] as number;/, "running = D[i] as number;"],
});

/** 취소를 구간의 오른쪽 끝 그 칸에 적는 사본. */
const cancelAtR = await loadMutant<Impl>(REF, {
  swap: [
    /D\[r \+ 1\] = \(D\[r \+ 1\] as number\) - v;/,
    "D[r] = (D[r] as number) - v;",
  ],
});

/** 취소를 구간이 끝난 다음다음 칸에 적는 사본. */
const cancelAtR2 = await loadMutant<Impl>(REF, {
  swap: [
    /D\[r \+ 1\] = \(D\[r \+ 1\] as number\) - v;/,
    "D[r + 2] = (D[r + 2] as number) - v;",
  ],
});

/**
 * 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. 실행이 그것을 판정한다.
 *
 * 중화 실행(`check-proof` 가 변이를 끄고 한 번 더 부르는 실행)에서는 이 검사를 건너뛴다. 중화
 * 여부는 **값에서** 알아낸다 — 변이 모듈의 함수가 정본과 같은 객체면 중화된 것이다.
 */
function assertBreaks(mutant: Impl, gaps: readonly number[]): void {
  if (mutant.diffArrayRangeUpdate === diffArrayRangeUpdate) return;
  if (gaps.every((g) => g === 0)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/* ────────────────────────── 계측기 ────────────────────────── */

const copy = (updates: readonly Update[]): Array<[number, number, number]> =>
  updates.map((u) => [u[0], u[1], u[2]]);

const ref = (N: number, updates: readonly Update[]): number[] =>
  diffArrayRangeUpdate(N, copy(updates));

/**
 * 구간을 통째로 순회하는 방식의 칸 접근 수 — 초기화 `N` 번 쓰기 + 덮는 칸마다 읽기 · 쓰기.
 * 답은 정의와 같은지 대조한다.
 */
function scanAccesses(N: number, updates: readonly Update[]): number {
  const s = scanEach(N, updates);
  if (JSON.stringify(s.A) !== JSON.stringify(byDefinition(N, updates))) {
    throw new Error("구간 순회가 정의와 다른 답을 냈다");
  }
  return N + 2 * s.cells;
}

/**
 * 차분 배열의 칸 접근 수 — 정본 계측 기록에서 센다. 초기화 `N + 1` 번 쓰기 + 기록 걸음마다 경계
 * 두 칸을 읽고 쓰는 네 번 + 복원 걸음마다 `D[i]` 읽기 · `A[i]` 쓰기 두 번.
 */
function diffAccesses(N: number, updates: readonly Update[]): number {
  const t = trace(N, updates);
  return N + 1 + 4 * t.records.length + 2 * t.restores.length;
}

/** 인덱스 `i` 를 덮는 갱신 목록. */
const covering = (i: number, updates: readonly Update[]): Update[] =>
  updates.filter(([l, r]) => l <= i && i <= r);

/** 누적합 배열 — 앞 `i` 칸의 합을 칸 `i` 에(칸 `n + 1` 개). 비교 대상으로만 쓴다. */
const prefixOf = (A: readonly number[]): number[] => {
  const P = [0];
  for (const a of A) P.push((P.at(-1) as number) + a);
  return P;
};

/** 모든 갱신이 배열 전체를 덮는 입력 — 구간 순회의 최악. */
function fullRange(N: number, Q: number): Update[] {
  return Array.from({ length: Q }, (_, k) => [0, N - 1, (k % 7) + 1] as const);
}

/** 두 배열이 같은가. */
const same = (a: readonly number[], b: readonly number[]): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/* ────────────────────────── 사례 목록 ────────────────────────── */

interface Case {
  name: string;
  N: number;
  updates: Update[];
}

const WALK_CASE: Case = {
  name: `N=${WALK_N} · 전개 입력`,
  N: WALK_N,
  updates: [...WALK_U],
};

const START_ONLY_CASES: Case[] = [
  WALK_CASE,
  { name: "N=5 · (0,2,3)", N: 5, updates: [[0, 2, 3]] },
  { name: "N=4 · (0,3,5)", N: 4, updates: [[0, 3, 5]] },
  {
    name: "N=6 · (1,2,4)(4,5,1)",
    N: 6,
    updates: [
      [1, 2, 4],
      [4, 5, 1],
    ],
  },
];

const SHORT_D_CASES: Case[] = [
  WALK_CASE,
  { name: "N=4 · (0,3,5)", N: 4, updates: [[0, 3, 5]] },
  { name: "N=5 · (2,2,7)", N: 5, updates: [[2, 2, 7]] },
  { name: "N=3 · 갱신 없음", N: 3, updates: [] },
];

const WRITE_FIRST_CASES: Case[] = [
  WALK_CASE,
  { name: "N=1 · (0,0,5)", N: 1, updates: [[0, 0, 5]] },
  { name: "N=4 · (0,3,5)", N: 4, updates: [[0, 3, 5]] },
  { name: "N=3 · 갱신 없음", N: 3, updates: [] },
];

const ACCUMULATE_CASES: Case[] = [
  WALK_CASE,
  { name: "N=5 · (2,2,7)", N: 5, updates: [[2, 2, 7]] },
  { name: "N=1 · (0,0,5)", N: 1, updates: [[0, 0, 5]] },
  { name: "N=3 · 갱신 없음", N: 3, updates: [] },
];

/** 쉬운 경우 — 서로 겹치지 않는 갱신 둘. */
const EASY: Case = {
  name: "N=6 · (1,2,4)(4,5,1)",
  N: 6,
  updates: [
    [1, 2, 4],
    [4, 5, 1],
  ],
};

/** 「헷갈리기 쉬운 모양」에서 전개 입력 위에 하나 더 거는 갱신. */
const EXTRA_U: Update = [2, 4, 5];

/** 검산 규모. 네 자리 다 두 방식을 **실제로 실행해** 센다. */
const SCALE = [4, 64, 1000, 4000];

/** 최악을 만드는 입력을 고르는 자리에서 쓰는 규모. */
const SHAPE_N = 1000;

/** 정수 하나를 담는 바이트. */
const BYTES = 8;
/** 메모리 예산(바이트) — 256 MB. */
const BUDGET = 256 * 1024 * 1024;
/** 값 하나의 절댓값 상한. */
const V_MAX = 10_000;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 두 방식이 과제 규모에서 건드리는 칸 수. */
  "concept-scale": () => {
    const big = N_MAX * N_MAX;
    return block(
      columns([
        [
          "갱신마다 구간을 고친다",
          `N = Q = ${num(N_MAX)} 최악 ${num(big)} 칸`,
          "갱신 하나가 구간의 칸 수만큼",
        ],
        [
          "경계 두 칸만 적는다",
          `기록 ${num(2 * N_MAX)} 칸 + 누적 ${num(N_MAX)} 번`,
          "갱신 하나가 칸 2 개",
        ],
      ]),
    );
  },

  /** `deep.origin` ② — 가장 단순한 방법이 과제 규모에서 고치는 칸 수. */
  "origin-cost": () => {
    const measured = [1_000, 10_000].map((n) => ({
      n,
      cells: scanEach(n, fullRange(n, n)).cells,
    }));
    const rows = measured.map(({ n, cells }) => [
      num(n),
      num(cells),
      secondsOf(cells),
      "실행해서 셌다",
    ]);
    const big = N_MAX * N_MAX;
    rows.push([num(N_MAX), num(big), secondsOf(big), "N·Q 로 냈다"]);
    const exact = measured.every(({ n, cells }) => cells === n * n);
    return withNote(
      md(
        ["N = Q", "고친 칸 수의 합", "초당 1 억 번 기준", "구한 방법"],
        rows,
        [0, 1, 2],
      ),
      `모든 갱신이 배열 전체를 덮는 입력입니다. 실행해서 센 N = 1,000 · 10,000 에서 고친 칸 수가 N·Q 와 ${exact ? "정확히 같았습니다" : "달랐습니다"}.`,
    );
  },

  /** `deep.origin` ③ — 작은 입력에서 갱신마다 고친 뒤의 배열과, 이미 고친 칸을 다시 고친 수. */
  "origin-repeat": () => {
    const A = new Array<number>(WALK_N).fill(0);
    const touched = new Array<number>(WALK_N).fill(0);
    const rows = WALK_U.map((u) => {
      const [l, r, v] = u;
      let again = 0;
      for (let i = l; i <= r; i++) {
        if ((touched[i] as number) > 0) again++;
        touched[i] = (touched[i] as number) + 1;
        A[i] = (A[i] as number) + v;
      }
      return [showUpdate(u), String(r - l + 1), show(A), String(again)];
    });
    if (!same(A, ref(WALK_N, WALK_U))) {
      throw new Error("차례로 고친 배열이 정본과 다르다");
    }
    return md(
      ["갱신", "고친 칸", "고친 뒤의 배열", "다시 고친 칸"],
      rows,
      [1, 3],
    );
  },

  /** `deep.origin` ③ — 칸마다 최종 값이 덮은 갱신의 `v` 합과 같은가. */
  "origin-final": () => {
    const A = ref(WALK_N, WALK_U);
    const rows = A.map((a, i) => {
      const cov = covering(i, WALK_U);
      const sum = cov.reduce((s, u) => s + u[2], 0);
      if (sum !== a) throw new Error(`칸 ${i} 의 값이 덮은 v 의 합과 다르다`);
      return [
        String(i),
        String(cov.length),
        cov.length === 0 ? "없음" : cov.map(showUpdate).join(" · "),
        cov.length < 2
          ? String(sum)
          : `${cov.map((u) => paren(u[2])).join(" + ")} = ${sum}`,
      ];
    });
    const most = Math.max(...rows.map((r) => Number(r[1])));
    return withNote(
      md(["인덱스", "고친 횟수", "덮은 갱신", "최종 값"], rows, [0, 1]),
      `${WALK_N} 칸 모두 최종 값이 덮은 갱신의 v 를 더한 값과 같습니다. 가장 많이 고친 칸은 ${most} 번 고쳤습니다.`,
    );
  },

  /** `deep.origin` ④ — 같은 갱신 목록을 두 방식으로 처리했을 때 건드린 칸 수. */
  "cost-two-ways": () => {
    const scan = scanEach(WALK_N, WALK_U);
    const t = trace(WALK_N, WALK_U);
    // 기록 한 걸음이 건드리는 칸 — 정본 계측이 남긴 직전·직후 D 에서 값이 바뀐 칸.
    const touched = t.records.map((rec, k) => {
      const before = k === 0 ? rec.D.map(() => 0) : (t.records[k - 1]?.D ?? []);
      return rec.D.filter((d, j) => d !== before[j]).length;
    });
    const rows = WALK_U.map((u, k) => [
      showUpdate(u),
      String(u[1] - u[0] + 1),
      String(scan.perUpdate[k]),
      String(touched[k]),
    ]);
    const edge = touched.reduce((a, x) => a + x, 0);
    return withNote(
      md(
        [
          "갱신",
          "덮는 칸 수",
          "구간을 고칠 때 건드린 칸",
          "경계만 적을 때 건드린 칸",
        ],
        rows,
        [1, 2, 3],
      ),
      `구간을 고치면 ${scan.cells} 칸, 경계만 적으면 ${edge} 칸입니다. 두 방식이 낸 배열은 ${same(scan.A, t.result) ? "같습니다" : "다릅니다"}.`,
    );
  },

  /** `deep.origin` ⑤ — 경계를 하나만 두는 후보가 어디서 어긋나는가. */
  "cost-start-only": () => {
    const rows = START_ONLY_CASES.map((c) => {
      const bare = ref(c.N, c.updates);
      const only = startOnly(c.N, c.updates);
      return [c.name, show(bare), show(only), String(mismatches(bare, only))];
    });
    const zero = rows.filter((r) => r[3] === "0").map((r) => r[0]);
    return withNote(
      md(
        ["입력", "정본이 낸 배열", "시작 칸에만 적은 배열", "어긋난 칸"],
        rows,
        [3],
      ),
      `어긋난 칸이 0 인 입력은 ${zero.join(" · ")} 하나입니다. 구간이 배열의 마지막 칸까지 덮어서 어긋날 자리가 없습니다.`,
    );
  },

  /** `deep.origin` ⑤ — 시작 칸에만 적으면 어디서부터 어긋나는가. */
  "origin-start-trace": () => {
    const u = WALK_U[0] as Update;
    const only = startOnly(WALK_N, [u]);
    const want = ref(WALK_N, [u]);
    const first = only.findIndex((x, i) => x !== want[i]);
    const idx = Array.from({ length: WALK_N }, (_, i) => String(i));
    return block([
      ...columns([
        ["인덱스", ...idx],
        ["시작 칸에만 적고 누적한 값", ...only.map(String)],
        ["정본이 낸 값", ...want.map(String)],
      ]),
      `└ 인덱스 ${first} 부터 어긋난다. 구간이 끝난 칸 ${u[1]} 다음에서 ${u[2]}${을를(u[2])} 끝냈어야 한다`,
    ]);
  },

  /** `deep.build` 먼저 알아 둘 개념 — 칸 하나를 이름에서 값까지 읽는다. */
  "build-read-one": () => {
    const A = ref(WALK_N, WALK_U);
    const D = trace(WALK_N, WALK_U).D;
    const j = 4;
    const d = D[j] as number;
    if (d !== (A[j] as number) - (A[j - 1] as number)) {
      throw new Error("D[j] 가 이웃한 두 칸의 차와 다르다");
    }
    return block([
      `D[${j}]  →  A[${j}] − A[${j - 1}]  →  ${A[j]} − ${A[j - 1]}  →  ${d}  →  인덱스 ${j} 에서 값이 ${Math.abs(d)} ${d < 0 ? "내려간다" : "올라간다"}`,
    ]);
  },

  /** `deep.build` 먼저 알아 둘 개념 — 이웃한 두 칸의 차, 그리고 앞에서부터의 합. */
  "build-neighbors": () => {
    const A = ref(WALK_N, WALK_U);
    const D = trace(WALK_N, WALK_U).D;
    if (!same(D, diffOf(A))) throw new Error("정본의 D 가 A 의 차분과 다르다");
    let run = 0;
    const rows = D.map((d, j) => {
      run += d;
      const left = j === 0 ? "0 (앞 칸 없음)" : String(A[j - 1]);
      const here = j === WALK_N ? "0 (뒤 칸 없음)" : String(A[j]);
      return [String(j), left, here, String(d), String(run)];
    });
    const ok = D.every(
      (_, j) => D.slice(0, j + 1).reduce((s, x) => s + x, 0) === (A[j] ?? 0),
    );
    return withNote(
      md(
        [
          "j",
          "A[j−1]",
          "A[j]",
          "D[j] = A[j] − A[j−1]",
          "D[0] 부터 D[j] 까지의 합",
        ],
        rows,
        [0, 3, 4],
      ),
      `${D.length} 칸 모두 ${ok ? "앞에서부터의 합이 A[j] 와 같고" : "앞에서부터의 합이 A[j] 와 다르고"}, 마지막 칸 j = ${WALK_N} 에서 합이 0 으로 돌아옵니다.`,
    );
  },

  /** `deep.build` 먼저 알아 둘 개념 — 갱신 하나에 A · 누적합 배열 · 차분 배열의 몇 칸이 바뀌는가. */
  "build-vs-prefix": () => {
    const before = ref(WALK_N, WALK_U);
    const after = ref(WALK_N, [...WALK_U, EXTRA_U]);
    const rowOf = (
      name: string,
      x: readonly number[],
      y: readonly number[],
    ) => {
      const changed = x
        .map((v, i) => (v !== y[i] ? i : -1))
        .filter((i) => i >= 0);
      return [
        name,
        String(x.length),
        show(x),
        show(y),
        String(changed.length),
        changed.join(" "),
      ];
    };
    const Db = trace(WALK_N, WALK_U).D;
    const Da = trace(WALK_N, [...WALK_U, EXTRA_U]).D;
    return withNote(
      md(
        ["배열", "칸 수", "갱신 전", "갱신 뒤", "바뀐 칸 수", "바뀐 칸"],
        [
          rowOf("결과 배열 A", before, after),
          rowOf("누적합 배열 P", prefixOf(before), prefixOf(after)),
          rowOf("차분 배열 D", Db, Da),
        ],
        [1, 4],
      ),
      `전개 입력 위에 갱신 ${showUpdate(EXTRA_U)} 하나를 더 걸었습니다. 이 갱신이 덮는 칸은 ${EXTRA_U[1] - EXTRA_U[0] + 1} 개입니다.`,
    );
  },

  /** `deep.build` 1단계 — 상태의 크기와 범위. */
  "build-size": () => {
    const cellMax = N_MAX * V_MAX;
    const bytes = (N_MAX + 1) * BYTES;
    return block(
      columns([
        [
          "칸 수",
          "N + 1",
          `전개 입력은 N = ${WALK_N} 이라 칸 ${WALK_N + 1} 개 · N = ${num(N_MAX)} 이면 칸 ${num(N_MAX + 1)} 개`,
        ],
        [
          "메모리",
          "(N + 1) × 8 바이트",
          `N = ${num(N_MAX)} 이면 ${num(bytes)} 바이트 — 256 MB 의 ${((bytes / BUDGET) * 100).toFixed(2)} %`,
        ],
        [
          "칸 하나의 범위",
          `|D[j]| ≤ Q × ${num(V_MAX)}`,
          `Q = ${num(N_MAX)} 이면 ${num(cellMax)} 이하 — 2^31 − 1 = ${num(2 ** 31 - 1)} 보다 작다`,
        ],
      ]),
    );
  },

  /** `deep.build` 2단계 — 쉬운 경우: 겹치지 않는 갱신 둘. */
  "build-easy": () => {
    const t = trace(EASY.N, EASY.updates);
    const idx = t.D.map((_, j) => String(j));
    const gapAt = (EASY.updates[0]?.[1] as number) + 1;
    return block([
      ...columns([
        ["D 의 칸 번호", ...idx],
        ["D 에 적힌 값", ...t.D.map(String)],
        ["누적한 값", ...t.result.map(String), "읽지 않음"],
      ]),
      `└ 두 구간 사이의 칸 ${gapAt} 에서 값이 ${t.result[gapAt]}${으로(t.result[gapAt] as number)} 되돌아온다. 칸 ${EASY.N} 은 여분 칸이라 누적이 읽지 않는다`,
    ]);
  },

  /** `deep.build` 2단계 — 갱신을 적는 순서를 바꿔도 D 가 같은가. */
  "build-order": () => {
    const orders: Update[][] = [
      [...WALK_U],
      [...WALK_U].reverse(),
      [WALK_U[1], WALK_U[2], WALK_U[0]] as Update[],
    ];
    const Ds = orders.map((o) => trace(WALK_N, o).D);
    const allSame = Ds.every((d) => same(d, Ds[0] as number[]));
    return block([
      ...columns(
        orders.map((o, k) => [
          o.map(showUpdate).join(" → "),
          `D ${show(Ds[k] as number[])}`,
        ]),
      ),
      `└ 세 순서의 D 가 ${allSame ? "모두 같다" : "서로 다르다"}. 칸마다 더하기만 하므로 더하는 순서가 합을 바꾸지 않는다`,
    ]);
  },

  /** `deep.build` 3단계 — 누적한 값이 그 칸을 덮는 갱신의 `v` 합과 같은가. */
  "build-restore": () => {
    const t = trace(WALK_N, WALK_U);
    const rows = t.restores.map((s) => {
      const cov = covering(s.i, WALK_U);
      const sum = cov.reduce((a, u) => a + u[2], 0);
      return [
        String(s.i),
        String(s.d),
        String(s.running),
        cov.length === 0 ? "없음" : cov.map(showUpdate).join(" · "),
        String(sum),
      ];
    });
    const ok = rows.filter((r) => r[2] === r[4]).length;
    return withNote(
      md(
        ["i", "D[i]", "running", "덮은 갱신", "덮은 갱신의 v 합"],
        rows,
        [0, 1, 2, 4],
      ),
      `${rows.length} 칸 중 ${ok} 칸에서 running 이 그 칸을 덮은 갱신의 v 합과 같습니다.`,
    );
  },

  /** `deep.build` 전제 — 덮어쓰기를 더하기처럼 적으면. */
  "premise-assign": () => {
    const N = 4;
    const ops: Update[] = [
      [0, 3, 5],
      [1, 2, 2],
    ];
    // 덮어쓰기의 정의 — 뒤 갱신이 앞 값을 지운다.
    const want = new Array<number>(N).fill(0);
    for (const [l, r, v] of ops) for (let i = l; i <= r; i++) want[i] = v;
    const got = ref(N, ops);
    const first = ops[0]?.[2] as number;
    return block([
      ...columns([
        ["덮어쓴 결과", show(want)],
        ["차분 배열에 더하기로 적은 결과", show(got)],
      ]),
      `└ ${mismatches(want, got)} 칸이 어긋난다. 앞 갱신의 ${first}${을를(first)} 지우는 일이 D 의 두 칸으로는 적히지 않는다`,
    ]);
  },

  /** `deep.build` 전제 — 갱신 도중 한 칸의 값을 알려면 몇 칸을 더하는가. */
  "premise-midquery": () => {
    const i = WALK_N - 1;
    const avg = (N_MAX + 1) / 2;
    return block(
      columns([
        [
          `A[${i}] 하나를 지금 읽는다`,
          `D[0] 부터 D[${i}] 까지 ${i + 1} 칸을 더한다`,
        ],
        [
          `N = ${num(N_MAX)} 에서 칸 하나를 읽는다`,
          `평균 ${num(avg)} 칸을 더한다`,
        ],
      ]),
    );
  },

  /** `deep.build` 설계 선택 — 취소를 적는 자리를 세 값으로 두고 결과를 대조한다. */
  "cost-cancel-offset": () => {
    const bare = ref(WALK_N, WALK_U);
    const maxR = Math.max(...WALK_U.map((u) => u[1]));
    const run: [number, Impl | null][] = [
      [0, cancelAtR],
      [1, null],
      [2, cancelAtR2],
    ];
    const rows = run.map(([offset, impl]) => {
      const got =
        impl === null ? bare : impl.diffArrayRangeUpdate(WALK_N, copy(WALK_U));
      return [
        `r + ${offset}`,
        String(Math.max(WALK_N, maxR + offset + 1)),
        show(got),
        String(mismatches(bare, got)),
      ];
    });
    assertBreaks(cancelAtR, [Number(rows[0]?.[3])]);
    assertBreaks(cancelAtR2, [Number(rows[2]?.[3])]);
    return withNote(
      md(
        ["취소를 적는 칸", "필요한 D 칸 수", "낸 배열", "어긋난 칸"],
        rows,
        [1, 3],
      ),
      `정본이 낸 배열은 ${show(bare)} 입니다.`,
    );
  },

  /** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
  "walk-input": () => {
    const want = ref(WALK_N, WALK_U);
    return block([
      `const N = ${WALK_N};`,
      "const updates: Array<[number, number, number]> = [",
      ...WALK_U.map((u) => `  [${u.join(", ")}],`),
      "];",
      `// 이 절이 끝나면 [${want.join(", ")}] 이 나와야 한다`,
    ]);
  },

  /** `deep.walk.step` 1 — 차분 배열을 잡은 직후. */
  "walk-init": () => {
    const s = walkSteps()[0];
    if (s === undefined) throw new Error("걸음이 없다");
    return block(
      columns([
        [`N = ${WALK_N}`, `칸 ${s.D.length} 개 (0 … ${s.D.length - 1})`],
        [`D = ${show(s.D)}`, "모든 칸이 0 인 결과 배열의 차분 배열이다"],
      ]),
    );
  },

  /** `deep.walk.step` 2 — 갱신 셋을 경계 칸에 적는 동안의 D 상태값. */
  "walk-record": () => {
    const steps = walkSteps().filter((s) => s.branch === "①②③");
    const t = trace(WALK_N, WALK_U);
    const rows = t.records.map((rec, k) => [
      steps[k]?.id ?? "",
      showUpdate([rec.l, rec.r, rec.v]),
      `D[${rec.l}] += ${rec.v}`,
      `D[${rec.r + 1}] −= ${rec.v}`,
      show(rec.D),
    ]);
    return withNote(
      md(["걸음", "갱신", "시작 이벤트", "취소 이벤트", "기록 뒤의 D"], rows),
      `갱신 ${t.records.length} 개가 경계 ${2 * t.records.length} 칸에 적혔고, 결과 배열은 아직 한 칸도 만들지 않았습니다.`,
    );
  },

  /** `deep.walk.pause` — 차분 배열을 N 칸으로 잡으면 답이 달라지는가. */
  "pause-short-d": () => {
    const rows = SHORT_D_CASES.map((c) => {
      const bare = ref(c.N, c.updates);
      const got = shortRun(c.N, c.updates).A;
      return [
        c.name,
        show(bare),
        show(got),
        same(bare, got) ? "답이 같다" : "답이 다르다",
      ];
    });
    const sameCount = rows.filter((r) => r[3] === "답이 같다").length;
    return block([
      ...columns([["입력", "정본", "D 를 N 칸으로 잡은 코드", ""], ...rows]),
      "",
      `└ 입력 ${rows.length} 개 중 ${sameCount} 개에서 답이 같다. 오른쪽 끝이 N−1 인 갱신이 있는 입력도 그렇다`,
    ]);
  },

  /** `deep.walk.pause` — 그때 차분 배열이 어떤 모양이 되는가. */
  "pause-short-d-state": () => {
    const got = shortRun(WALK_N, WALK_U).D;
    const bare = trace(WALK_N, WALK_U).D;
    const v = WALK_U[2]?.[2] as number;
    return block([
      ...columns([
        ["잡은 칸 수", `${WALK_N}`],
        ["기록이 끝난 뒤의 칸 수", `${got.length}`],
        ["기록이 끝난 뒤의 D", show(got)],
        ["정본의 D", show(bare)],
      ]),
      `└ 없던 칸 D[${WALK_N}] 에서 ${v}${을를(v)} 빼서 ${String(got[WALK_N])} 이 적혔다. 배열은 조용히 한 칸 늘었고, 복원은 그 칸을 읽지 않는다`,
    ]);
  },

  /** `deep.walk.step` 3 — 복원 루프의 앞 두 걸음. */
  "walk-restore-two": () => {
    const steps = walkSteps()
      .filter((s) => s.branch === "④")
      .slice(0, 2);
    const t = trace(WALK_N, WALK_U);
    const rows = steps.map((s, k) => {
      const r = t.restores[k];
      if (r === undefined) throw new Error("복원 걸음이 모자라다");
      return [
        s.id,
        String(r.i),
        String(r.d),
        String(r.running),
        String(r.running),
      ];
    });
    return md(
      ["걸음", "i", "D[i]", "더한 뒤의 running", "A[i]"],
      rows,
      [1, 2, 3, 4],
    );
  },

  /** `deep.walk.pause` — 복원 루프의 두 줄 순서를 바꾸면 무엇이 달라지는가. */
  "pause-write-first": () => {
    const rows = WRITE_FIRST_CASES.map((c) => {
      const bare = ref(c.N, c.updates);
      const got = writeFirst.diffArrayRangeUpdate(c.N, copy(c.updates));
      return { c, bare, got, gap: mismatches(bare, got) };
    });
    assertBreaks(
      writeFirst,
      rows.map((r) => r.gap),
    );
    return block([
      ...columns([
        ["입력", "정본", "순서를 바꾼 코드", "어긋난 칸", ""],
        ...rows.map((r) => [
          r.c.name,
          show(r.bare),
          show(r.got),
          String(r.gap),
          r.gap === 0 ? "답이 같다" : "답이 다르다",
        ]),
      ]),
      "",
      `└ 배열 길이는 네 입력 모두 ${rows.every((r) => r.bare.length === r.got.length) ? "정본과 같다" : "정본과 다르다"}`,
    ]);
  },

  /** `deep.walk.pause` — 전개 입력에서 두 배열을 칸마다 맞대면. */
  "pause-shift": () => {
    const bare = ref(WALK_N, WALK_U);
    const got = writeFirst.diffArrayRangeUpdate(WALK_N, copy(WALK_U));
    const shifted = same(got.slice(1), bare.slice(0, -1)) && got[0] === 0;
    const last = bare.at(-1) as number;
    return block([
      ...columns([
        ["정본", ...bare.map(String)],
        ["순서를 바꾼 코드", ...got.map(String)],
      ]),
      shifted
        ? `└ 아래 줄의 칸 i 가 위 줄의 칸 i−1 이다. 앞에는 0 이 들어가고 정본의 마지막 ${last}${은는(last)} 잘린다`
        : "└ 아래 줄이 위 줄을 한 칸 옮긴 것이 아니다",
    ]);
  },

  /** `deep.walk.step` — 고정 입력을 끝까지 실행한 걸음마다의 상태값. */
  "walk-trace": () => {
    const steps = walkSteps();
    const what: Record<string, string> = {
      "①②③": "갱신을 경계 두 칸에 적는다",
      "④": "누적해 A[i] 에 적는다",
    };
    const rows = steps.map((s) => {
      const readD = s.readD.map((j) => `D[${j}]=${s.D[j]}`).join(", ");
      const wrote =
        s.branch === null
          ? `D[0] … D[${s.D.length - 1}] = 0`
          : s.branch === "①②③"
            ? s.writeD.map((j) => `D[${j}] = ${s.D[j]}`).join(", ")
            : s.writeA.map((i) => `A[${i}] = ${s.A[i]}`).join(", ");
      return [
        s.id,
        s.branch === null ? "D 를 0 으로 잡는다" : (what[s.branch] ?? ""),
        s.branch === null ? "—" : (s.title.split(" · ")[0] ?? ""),
        readD === "" ? "—" : readD,
        wrote,
        s.branch ?? "루프 진입 전",
      ];
    });
    return md(
      ["걸음", "하는 일", "갱신 또는 i", "읽은 칸", "쓴 칸", "갈래"],
      rows,
    );
  },

  /** `deep.walk.step` — 갈래마다 실행된 걸음. */
  "walk-branches": () => {
    const steps = walkSteps();
    const rec = steps.filter((s) => s.branch === "①②③").map((s) => s.id);
    const res = steps.filter((s) => s.branch === "④").map((s) => s.id);
    const t = trace(WALK_N, WALK_U);
    return block(
      columns([
        [
          "갱신을 적는다",
          rec.join(" "),
          `갱신 ${t.records.length} 개에 경계 ${2 * t.records.length} 칸`,
          "①②③",
        ],
        [
          "누적해 적는다",
          `${res[0]}~${res.at(-1)}`,
          `칸 ${t.restores.length} 개에 덧셈 ${t.restores.length} 번`,
          "④",
        ],
      ]),
    );
  },

  /** `deep.walk.final` — 전체 코드를 여러 입력에 부른 결과. */
  "final-calls": () => {
    const calls: [number, Update[]][] = [
      [WALK_N, [...WALK_U]],
      [5, [[0, 2, 3]]],
      [4, [[0, 3, 5]]],
      [5, [[2, 2, 7]]],
      [3, []],
    ];
    return block(
      columns(
        calls.map(([N, u]) => [
          `diffArrayRangeUpdate(${N}, [${u.map((x) => `[${x.join(",")}]`).join(", ")}])`,
          `→  [${ref(N, u).join(", ")}]`,
        ]),
      ),
    );
  },

  /** `related` — 구간 하나가 사건 둘이 되고, 지나가며 누적한다. */
  "related-sweep": () => {
    const u = WALK_U[0] as Update;
    const [l, r, v] = u;
    const t2 = walkSteps().find((s) => s.branch === "①②③");
    const D = trace(WALK_N, [u]).D;
    const run = ref(WALK_N, [u]);
    const idx = Array.from({ length: WALK_N }, (_, i) => String(i));
    const ev = idx.map((_, i) => {
      const d = D[i] as number;
      return d === 0 ? "·" : d > 0 ? `+${d}` : String(d);
    });
    return block([
      `[${l},${r}] 에 ${v}${을를(v)} 더한다  →  인덱스 ${l} 에서 시작 · 인덱스 ${r + 1} 에서 끝`,
      `  └ ${t2?.id} 가 D[${l}] 과 D[${r + 1}] 에 적은 것이 이 두 사건이다`,
      "",
      ...columns([
        ["인덱스", ...idx],
        ["사건", ...ev],
        ["누적한 값", ...run.map(String)],
      ]),
    ]);
  },

  /** `purpose.alt` — 순서가 뒤집히는 자리를 표의 값으로 푼다. */
  "alt-crossing": () => {
    const d = benchCases["차분 배열"]();
    const f = benchCases["펜윅 트리"]();
    const p = 1024;
    const at = (c: Record<string, number>, k: number) =>
      c[`점 조회 ${num(k)} 회 칸 접근`] as number;
    const perD = (at(d, p) - at(d, 0)) / p;
    const perF = (at(f, p) - at(f, 0)) / p;
    const gap = at(f, 0) - at(d, 0);
    const cross = gap / (perD - perF);
    const f1 = (x: number) => x.toFixed(1);
    // 실측에서 처음 뒤집히는 자리 — 잰 점 조회 횟수 가운데 펜윅 트리가 처음 적은 곳.
    const flip = [0, 44, 45, 1024].find((k) => at(f, k) < at(d, k)) ?? -1;
    return block(
      columns([
        [
          "차분 배열의 점 조회 하나",
          `(${num(at(d, p))} − ${num(at(d, 0))}) ÷ ${num(p)} = ${f1(perD)}`,
          "칸 0 부터 그 칸까지 다시 더한다",
        ],
        [
          "펜윅 트리의 점 조회 하나",
          `(${num(at(f, p))} − ${num(at(f, 0))}) ÷ ${num(p)} = ${f1(perF)}`,
          "칸 log N 개를 읽는다",
        ],
        [
          "점 조회 0 회의 차이",
          `${num(at(f, 0))} − ${num(at(d, 0))} = ${num(gap)}`,
          "차분 배열이 적은 만큼",
        ],
        [
          "뒤집히는 자리",
          `${num(gap)} ÷ (${f1(perD)} − ${f1(perF)}) ≈ ${f1(cross)}`,
          `실측으로는 점 조회 ${num(flip)} 회에서 뒤집힌다`,
        ],
      ]),
    );
  },

  /** `deep.math` ② — D 의 정의를 전개 입력에 넣어 본다. */
  "math-check-d": () => {
    const D = trace(WALK_N, WALK_U).D;
    const at = (j: number) => {
      const starts = WALK_U.filter((u) => u[0] === j);
      const ends = WALK_U.filter((u) => u[1] + 1 === j);
      const s = starts.reduce((a, u) => a + u[2], 0);
      const e = ends.reduce((a, u) => a + u[2], 0);
      if (s - e !== D[j]) throw new Error(`D[${j}] 가 정의와 다르다`);
      return [
        `D[${j}]`,
        `= (l = ${j} 인 갱신의 v ${starts.length === 0 ? "없음" : s})`,
        `− (r+1 = ${j} 인 갱신의 v ${ends.length === 0 ? "없음" : e})`,
        `= ${D[j]}`,
      ];
    };
    return block(columns([0, 3, 4, WALK_N].map(at)));
  },

  /** `deep.math` ② — A 의 정의를 같은 입력에 넣어 본다. */
  "math-check-a": () => {
    const t = trace(WALK_N, WALK_U);
    const D = t.D;
    const line = (i: number) => {
      const terms = D.slice(0, i + 1);
      const sum = terms.reduce((a, x) => a + x, 0);
      if (sum !== t.result[i]) throw new Error(`A[${i}] 가 정의와 다르다`);
      return [
        `A[${i}]`,
        `= ${terms.map((_, j) => `D[${j}]`).join(" + ")}`,
        `= ${terms.map(paren).join(" + ")} = ${sum}`,
      ];
    };
    return block([`D = ${show(D)}`, "", ...columns([0, 3, 4].map(line))]);
  },

  /** `deep.math` ④ — 정의를 그대로 쓰면 덧셈이 몇 번인가. */
  "math-count": () => {
    const n = N_MAX;
    return block([
      ...columns([
        [
          "정의를 그대로 쓴다",
          "칸 i 에 i+1 번",
          `전부 N(N+1)/2 = ${num((n * (n + 1)) / 2)} 번`,
        ],
        ["누적을 들고 간다", "칸 i 에 1 번", `전부 N = ${num(n)} 번`],
      ]),
      `└ N = ${num(n)} 일 때의 값이다`,
    ]);
  },

  /** `deep.math` ④ — 닫힌 형태에 규모를 넣은 값과 실측값의 대조. */
  "math-scale": () => {
    const rows = SCALE.map((n) => {
      const updates = fullRange(n, n);
      return [
        num(n),
        num(scanAccesses(n, updates)),
        num(n + 2 * n * n),
        num(diffAccesses(n, updates)),
        num(3 * n + 4 * n + 1),
      ];
    });
    const exact = rows.every((r) => r[1] === r[2] && r[3] === r[4]);
    const L = N_MAX;
    const a = L + 2 * L * L;
    const b = 7 * L + 1;
    return withNote(
      md(
        [
          "N = Q",
          "구간 순회(실측)",
          "N + 2NQ",
          "차분 배열(실측)",
          "3N + 4Q + 1",
        ],
        rows,
        [0, 1, 2, 3, 4],
      ),
      `실측값이 닫힌 형태와 ${SCALE.length} 규모에서 ${exact ? "정확히 같습니다" : "다릅니다"}. 규모 N = Q = ${num(L)} 을 두 식에 넣으면 ${num(a)} 대 ${num(b)} 이고, ${num(Math.round(a / b))} 배입니다.`,
    );
  },

  /** `invariant` ② — 복원 걸음마다 running 을 두 문장과 대조한다. */
  "invariant-hold": () => {
    const t = trace(WALK_N, WALK_U);
    const steps = walkSteps().filter((s) => s.branch === "④");
    let checks = 0;
    let bad = 0;
    const rows = t.restores.map((s, k) => {
      const prefix = t.D.slice(0, s.i + 1).reduce((a, x) => a + x, 0);
      const cov = covering(s.i, WALK_U).reduce((a, u) => a + u[2], 0);
      checks += 2;
      if (prefix !== s.running) bad++;
      if (cov !== s.running) bad++;
      return [
        steps[k]?.id ?? "",
        String(s.i),
        String(s.running),
        String(prefix),
        String(cov),
      ];
    });
    return withNote(
      md(
        [
          "걸음",
          "i",
          "running",
          "D[0] 부터 D[i] 까지의 합",
          "i 를 덮은 갱신의 v 합",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      `걸음마다 두 문장을 따로 대조해 모두 ${checks} 번 대조했고, 어긋난 것은 ${bad} 번입니다.`,
    );
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  "invariant-edges": () => {
    const cases: [string, number, Update[], string][] = [
      ["갱신 목록이 빔", 3, [], "기록 루프가 한 번도 실행되지 않는다"],
      ["N = 1", 1, [[0, 0, 5]], "D[0] 과 D[1] 에 적는다"],
      ["l = r 인 갱신", 5, [[2, 2, 7]], "이웃한 두 칸에 적힌다"],
      [
        "r = N−1 인 갱신",
        4,
        [[1, 3, 4]],
        "취소가 D[N] 에 적히고 복원이 읽지 않는다",
      ],
      [
        "같은 구간을 세 번",
        3,
        [
          [0, 2, 1],
          [0, 2, 1],
          [0, 2, 1],
        ],
        "같은 두 칸에 값이 쌓인다",
      ],
      [
        "v 가 음수",
        4,
        [
          [0, 2, 5],
          [1, 3, -3],
        ],
        "취소 칸에 양수가 적힌다",
      ],
      ["v = 0", 3, [[0, 2, 0]], "두 칸에 0 을 더한다"],
    ];
    const rows = cases.map(([name, N, u, where]) => {
      const got = ref(N, u);
      if (!same(got, byDefinition(N, u))) {
        throw new Error(`${name} 가 정의와 다르다`);
      }
      return [
        name,
        `N = ${N} · ${u.length === 0 ? "없음" : u.map(showUpdate).join(" ")}`,
        where,
        show(trace(N, u).D),
        show(got),
      ];
    });
    return withNote(
      md(["경우", "입력", "처리되는 자리", "기록 뒤의 D", "결과"], rows),
      `${rows.length} 경우 모두 결과가 정의(칸마다 덮은 갱신의 v 합)와 같습니다.`,
    );
  },

  /** `invariant` ③ — 누적하던 줄에서 그 칸의 값만 옮기면 무엇이 나오는가. */
  "mutant-no-accumulate": () => {
    const rows = ACCUMULATE_CASES.map((c) => {
      const bare = ref(c.N, c.updates);
      const got = noAccumulate.diffArrayRangeUpdate(c.N, copy(c.updates));
      return { c, bare, got, gap: mismatches(bare, got) };
    });
    assertBreaks(
      noAccumulate,
      rows.map((r) => r.gap),
    );
    return block([
      ...columns([
        ["입력", "정본", "누적하지 않은 코드", "어긋난 칸", ""],
        ...rows.map((r) => [
          r.c.name,
          show(r.bare),
          show(r.got),
          String(r.gap),
          r.gap === 0 ? "답이 같다" : "답이 다르다",
        ]),
      ]),
      "",
      "└ 칸이 하나뿐이거나 갱신이 없으면 누적할 것이 없어서 답이 같다",
    ]);
  },

  /** `invariant` ③ — 깨진 결과의 한 칸이 무엇인가. */
  "mutant-meaning": () => {
    const N = 5;
    const u: Update[] = [[2, 2, 7]];
    const got = noAccumulate.diffArrayRangeUpdate(N, copy(u));
    const D = trace(N, u).D;
    const i = 3;
    const v = u[0]?.[2] as number;
    return block([
      ...columns([
        ["누적하지 않은 코드의 결과", show(got)],
        ["같은 입력의 D", show(D)],
      ]),
      got[i] === D[i]
        ? `└ 칸 ${i} 의 ${got[i]}${은는(got[i] as number)} D[${i}] 에 적힌 취소 사건 그대로다. 없앨 ${v}${이가(v)} 앞에서 더해지지 않았으니 취소만 남았다`
        : `└ 칸 ${i} 의 값이 D[${i}] 와 다르다`,
    ]);
  },

  /** `perf.derive` — 전개 입력에서 무리마다 센 칸 접근. */
  "perf-derive": () => {
    const steps = walkSteps();
    const rec = steps.filter((s) => s.branch === "①②③").map((s) => s.id);
    const res = steps.filter((s) => s.branch === "④").map((s) => s.id);
    const t = trace(WALK_N, WALK_U);
    const init = WALK_N + 1;
    const r4 = 4 * t.records.length;
    const r2 = 2 * t.restores.length;
    const formula = 3 * WALK_N + 4 * WALK_U.length + 1;
    return withNote(
      md(
        ["무리", "걸음", "걸음마다 칸 접근", "이 입력에서"],
        [
          ["초기화", steps[0]?.id ?? "", "N+1 번 쓰기", String(init)],
          [
            "기록",
            rec.join(" · "),
            "4 번 (경계 두 칸을 읽고 쓴다)",
            `${t.records.length} × 4 = ${r4}`,
          ],
          [
            "복원",
            `${res[0]}~${res.at(-1)}`,
            "2 번 (D[i] 읽기 · A[i] 쓰기)",
            `${t.restores.length} × 2 = ${r2}`,
          ],
        ],
      ),
      `모두 ${init} + ${r4} + ${r2} = ${init + r4 + r2} 번이고, 3N + 4Q + 1 에 N = ${WALK_N}, Q = ${WALK_U.length}${을를(WALK_U.length)} 넣은 ${formula}${과와(formula)} ${init + r4 + r2 === formula ? "같습니다" : "다릅니다"}.`,
    );
  },

  /** `perf.bounds` — 규모 끝에서의 총량. */
  "perf-total": () => {
    const n = N_MAX;
    return block([
      `N = Q = ${num(n)} 이면 칸 접근이 정확히 ${num(3 * n + 4 * n + 1)} 번, 추가 칸이 ${num(2 * n + 1)} 개다`,
    ]);
  },

  /** `perf.worst` — 갱신 구간의 길이를 바꿔도 차분 배열의 접근 수가 그대로인가. */
  "worst-shape": () => {
    const n = SHAPE_N;
    const shapes: [string, Update[]][] = [
      ["갱신이 전부 배열 전체를 덮는다", fullRange(n, n)],
      [
        "갱신이 전부 칸 하나짜리다",
        Array.from(
          { length: n },
          (_, k) => [k % n, k % n, (k % 7) + 1] as const,
        ),
      ],
      [
        "구간 길이가 1 부터 64 까지 섞인다",
        Array.from({ length: n }, (_, k) => {
          const l = (k * 37) % n;
          return [l, Math.min(n - 1, l + (k % 64)), (k % 7) + 1] as const;
        }),
      ],
    ];
    const rows = shapes.map(([name, updates]) => [
      name,
      num(scanEach(n, updates).cells),
      num(scanAccesses(n, updates)),
      num(diffAccesses(n, updates)),
    ]);
    const diffs = new Set(rows.map((r) => r[3]));
    return withNote(
      md(
        [
          `입력의 모양 (N = Q = ${num(n)})`,
          "덮는 칸의 합",
          "구간 순회 접근 수",
          "차분 배열의 칸 접근 수",
        ],
        rows,
        [1, 2, 3],
      ),
      `구간 순회의 접근 수는 세 줄이 다 다르고, 차분 배열의 접근 수는 ${diffs.size === 1 ? "세 줄이 같습니다" : "줄마다 다릅니다"}.`,
    );
  },

  /** `perf.worst` — 축마다 최악을 만드는 입력. */
  "worst-axes": () => {
    const n = N_MAX;
    // 한 칸의 값이 가장 커지는 입력 — 같은 칸 하나를 v 의 최댓값으로 Q 번 덮는다. 규모 끝에서 실행한다.
    const one: Update[] = Array.from(
      { length: n },
      () => [0, 0, V_MAX] as const,
    );
    const top = ref(n, one)[0] as number;
    return md(
      ["최악으로 만들 축", "입력", "값"],
      [
        [
          "칸 접근 수",
          `N = Q = ${num(n)}, 구간 길이는 무엇이든`,
          `${num(3 * n + 4 * n + 1)} 번`,
        ],
        [
          "추가 칸",
          `N = ${num(n)}`,
          `D ${num(n + 1)} 칸 + A ${num(n)} 칸 = ${num(2 * n + 1)} 칸`,
        ],
        ["한 칸의 값", `(0,0,${V_MAX})${을를(V_MAX)} ${num(n)} 번`, num(top)],
      ],
    );
  },

  /** `selfcheck` — 복원이 읽지 않는 마지막 칸의 값. */
  "selfcheck-dn": () => {
    const t = trace(WALK_N, WALK_U);
    const last = t.D[WALK_N] as number;
    const sum = t.D.reduce((a, x) => a + x, 0);
    return block([
      ...columns([
        [`D[${WALK_N}]`, String(last)],
        [`A[${WALK_N - 1}]`, String(t.result[WALK_N - 1])],
        ["D 의 모든 칸의 합", String(sum)],
      ]),
      last === -(t.result[WALK_N - 1] as number)
        ? `└ D[${WALK_N}] 은 A[${WALK_N - 1}] 의 부호를 바꾼 값이고, D 전체의 합은 ${sum} 이다`
        : `└ D[${WALK_N}] 이 A[${WALK_N - 1}] 의 부호를 바꾼 값이 아니다`,
    ]);
  },
};
