/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/etc/numberOfDisintersection/numberOfDisintersection-guide.md
 *
 * **계수를 세는 사본이 있다.** 정본은 비교 횟수와 중간 상태를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본(`traceSweep`)이 아니면 걸음 값을 낼 방법이 없다. **답이 맞는지는 사본이 아니라
 * 정본이 진다** — 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  countIntersectingDiscs,
  DEFAULT_LIMIT,
} from "./numberOfDisintersection-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 두 자리. */
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 초 단위. 0.01 초보다 작으면 자릿수가 다 0 이 되므로 그렇게 적는다. */
const seconds = (x: number): string =>
  x < 0.01 ? "0.01 초 미만" : `${fixed2(x)} 초`;

/** `[5 2 7]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** `[-1,1]` 꼴 — 구간은 쉼표로 적는다(L25). */
const range = (s: number, e: number): string => `[${s},${e}]`;

/** 원판 번호 목록. 비면 「없음」. */
const discs = (ids: number[]): string =>
  ids.length === 0 ? "없음" : ids.map((j) => `원판 ${j}`).join(" · ");

/** 마크다운 표. 수가 든 열은 오른쪽 정렬(`---:`)이다. */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  const rule = `| ${head.map((_, c) => (align[c] === "r" ? "---:" : "---")).join(" | ")} |`;
  return [line(head), rule, ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 배열. 원판 여섯 개로, 끝이 같은 원판 둘(원판 2 · 3)과 시작이 같은 원판
 * 둘(원판 2 · 4), 한 점짜리 원판(원판 5), 다른 원판 안에 든 원판이 다 있다.
 */
export const WALK: number[] = [1, 5, 2, 1, 4, 0];

/** 걸음 4 에서 상한을 보이려고 거는 작은 상한. 전개 입력의 답 11 보다 작다. */
export const WALK_LIMIT = 10;

/** 과제의 규모 상한. */
const MAX_N = 100_000;

/** 변이와 짚고 가기가 쓰는 작은 입력 열. 뒤쪽은 기존 시험이 쓰던 케이스다. */
const SMALL: number[][] = [
  WALK,
  [1, 1],
  [0, 0],
  [0, 0, 0],
  [10, 10, 10],
  [5],
  [],
  [0, 1, 0, 1, 0],
  [3, 0, 0, 0, 3],
];

/** 결정론적 생성식 — `A[j] = (37j + 11) mod m`. */
const gen = (n: number, m: number): number[] =>
  Array.from({ length: n }, (_, j) => (37 * j + 11) % m);

/* ────────────────────────── 기준 방식 · 세는 사본 ────────────────────────── */

const startOf = (A: number[], j: number): number => j - (A[j] as number);
const endOf = (A: number[], j: number): number => j + (A[j] as number);

/** 두 원판이 교차하는가 — 정의 그대로(|j − k| ≤ A[j] + A[k]). */
const meets = (A: number[], j: number, k: number): boolean =>
  Math.abs(j - k) <= (A[j] as number) + (A[k] as number);

/**
 * 모든 쌍을 대조하는 방식. 세는 것은 **대조 횟수**다. `stopAt` 을 주면 쌍 수가 그것을 넘는
 * 순간 멈춘다.
 */
function pairScan(
  A: number[],
  stopAt = Number.POSITIVE_INFINITY,
): { answer: number; checks: number } {
  let count = 0;
  let checks = 0;
  for (let j = 0; j < A.length; j++) {
    for (let k = j + 1; k < A.length; k++) {
      checks++;
      if (meets(A, j, k)) count++;
      if (count > stopAt) return { answer: -1, checks };
    }
  }
  return { answer: count, checks };
}

interface SweepStep {
  i: number;
  end: number;
  /** 이 걸음에서 ① 로 연 원판 수. */
  newlyOpened: number;
  /** while 조건이 거짓으로 끝났을 때의 비교. `null` 이면 `opened < n` 이 거짓이라 끝났다. */
  stop: { start: number; end: number } | null;
  opened: number;
  added: number;
  count: number;
  overflow: boolean;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
function traceSweep(
  A: number[],
  limit = DEFAULT_LIMIT,
): {
  starts: number[];
  ends: number[];
  steps: SweepStep[];
  answer: number;
  sortCompares: number;
  openCompares: number;
} {
  const n = A.length;
  let sortCompares = 0;
  const cmp = (a: number, b: number): number => {
    sortCompares++;
    return a - b;
  };
  const starts = A.map((r, j) => j - r).sort(cmp);
  const ends = A.map((r, j) => j + r).sort(cmp);
  const steps: SweepStep[] = [];
  let count = 0;
  let opened = 0;
  let openCompares = 0;
  for (let i = 0; i < n; i++) {
    const end = ends[i] as number;
    let newlyOpened = 0;
    let stop: SweepStep["stop"] = null;
    while (opened < n) {
      openCompares++;
      const s = starts[opened] as number;
      if (s <= end) {
        opened++;
        newlyOpened++;
      } else {
        stop = { start: s, end };
        break;
      }
    }
    const added = opened - (i + 1);
    count += added;
    const overflow = count > limit;
    steps.push({ i, end, newlyOpened, stop, opened, added, count, overflow });
    if (overflow)
      return {
        starts,
        ends,
        steps,
        answer: -1,
        sortCompares,
        openCompares,
      };
  }
  return { starts, ends, steps, answer: count, sortCompares, openCompares };
}

/** 원판 번호를 오른쪽 끝 오름차순(끝이 같으면 번호 순)으로 늘어놓는다. */
const byEnd = (A: number[]): number[] =>
  A.map((_, j) => j).sort((x, y) => endOf(A, x) - endOf(A, y) || x - y);

function 자기대조(): void {
  const inputs: number[][] = [...SMALL, gen(300, 7), gen(500, 40)];
  for (let n = 0; n <= 5; n++) {
    for (let code = 0; code < 3 ** n; code++) {
      const A: number[] = [];
      let c = code;
      for (let j = 0; j < n; j++) {
        A.push(c % 3);
        c = Math.floor(c / 3);
      }
      inputs.push(A);
    }
  }
  for (const A of inputs) {
    const want = pairScan(A).answer;
    if (countIntersectingDiscs([...A]) !== want) {
      throw new Error(`정본이 모든 쌍 대조와 다른 답을 낸다 — ${show(A)}`);
    }
    if (traceSweep(A).answer !== want) {
      throw new Error(`세는 사본이 정본과 다른 답을 낸다 — ${show(A)}`);
    }
  }
  const limited = traceSweep(WALK, WALK_LIMIT).answer;
  if (limited !== countIntersectingDiscs([...WALK], WALK_LIMIT)) {
    throw new Error("상한을 건 사본이 정본과 다른 답을 낸다");
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./numberOfDisintersection-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  countIntersectingDiscs(A: number[], limit?: number): number;
}

/** 원판을 여는 조건에서 등호를 뺀 사본 — 끝이 닿기만 한 원판을 안 연다. */
const strictOpen = await loadMutant<Impl>(REF, {
  swap: [/<= end\)/, "< end)"],
});

/** **불변식을 지키던 줄** — 먼저 닫힌 원판을 빼지 않고 자기 자신만 뺀 사본. */
const noClosed = await loadMutant<Impl>(REF, {
  swap: [/opened - \(i \+ 1\)/, "opened - 1"],
});

/** 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이가 적용되지 않았다. */
const 중화됨 = strictOpen.countIntersectingDiscs === countIntersectingDiscs;

if (!중화됨) {
  for (const [name, impl] of [
    ["등호를 뺀 변이", strictOpen],
    ["먼저 닫힌 원판을 안 빼는 변이", noClosed],
  ] as const) {
    const same = SMALL.every(
      (A) =>
        countIntersectingDiscs([...A]) === impl.countIntersectingDiscs([...A]),
    );
    if (same) throw new Error(`${name}가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

/**
 * 시작 좌표와 오른쪽 끝 좌표가 **같은 값**인 짝의 수 — 여는 조건의 등호만이 참으로 만드는 비교다.
 * 반지름이 0 인 원판은 자기 시작과 자기 끝이 같아서 여기에 든다.
 */
function equalStartEnd(A: number[]): number {
  let t = 0;
  for (let p = 0; p < A.length; p++) {
    for (let i = 0; i < A.length; i++) {
      if (startOf(A, p) === endOf(A, i)) t++;
    }
  }
  return t;
}

/** 걸음마다 먼저 닫힌 원판 수 `i` 를 모두 더한 값 — 빼기에서 `i` 를 빼먹으면 더해지는 양이다. */
function closedSum(A: number[]): number {
  let t = 0;
  for (let i = 0; i < A.length; i++) t += i;
  return t;
}

/** 변이 하나를 작은 입력 열에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  head: string,
  impl: Impl,
  passHead: string,
  passes: (A: number[]) => number,
): string {
  const rows = SMALL.map((A) => {
    const bare = countIntersectingDiscs([...A]);
    const mutated = impl.countIntersectingDiscs([...A]);
    const label = A === WALK ? `전개 입력 ${show(A)}` : show(A);
    return [
      label,
      num(passes(A)),
      String(bare),
      String(mutated),
      bare === mutated ? "같다" : "어긋난다",
    ];
  });
  return table(["입력", passHead, "정본", head, "판정"], rows, [
    "l",
    "r",
    "r",
    "r",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

const T = traceSweep(WALK);

export const PROOFS: Record<string, () => string> = {
  /** `deep.origin` ③ — 원판을 수직선 위의 구간으로 옮긴다. */
  "origin-intervals": () => {
    const rows = WALK.map((r, j) => [
      `원판 ${j}`,
      String(r),
      String(startOf(WALK, j)),
      String(endOf(WALK, j)),
      range(startOf(WALK, j), endOf(WALK, j)),
    ]);
    return table(
      ["원판", "반지름 A[j]", "왼쪽 끝 j − A[j]", "오른쪽 끝 j + A[j]", "구간"],
      rows,
      ["l", "r", "r", "r", "l"],
    );
  },

  /** `deep.origin` ② — 모든 쌍을 대조하는 방식의 대조 횟수. */
  "cost-pairs": () => {
    const rows = [6, 100, 1_000].map((n) => {
      const { checks } = pairScan(gen(n, 50));
      const formula = (n * (n - 1)) / 2;
      return [num(n), num(checks), num(formula), seconds(formula / 1e8)];
    });
    const big = (MAX_N * (MAX_N - 1)) / 2;
    rows.push([num(MAX_N), "(실행하지 않음)", num(big), seconds(big / 1e8)]);
    return table(
      ["n", "대조 횟수(실측)", "n(n−1)/2", "초당 1억 번 기준"],
      rows,
      ["r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ③ — j < k 이면 두 조건 중 하나는 늘 참이다. */
  "origin-condition": () => {
    const rows: string[][] = [];
    let always = 0;
    let total = 0;
    for (let j = 0; j < WALK.length; j++) {
      for (let k = j + 1; k < WALK.length; k++) {
        const c1 = startOf(WALK, k) <= endOf(WALK, j);
        const c2 = startOf(WALK, j) <= endOf(WALK, k);
        total++;
        if (c2) always++;
        rows.push([
          `(${j}, ${k})`,
          `${startOf(WALK, k)} ≤ ${endOf(WALK, j)} → ${c1 ? "참" : "거짓"}`,
          `${startOf(WALK, j)} ≤ ${endOf(WALK, k)} → ${c2 ? "참" : "거짓"}`,
          meets(WALK, j, k) ? "교차" : "떨어짐",
        ]);
      }
    }
    return [
      table(
        [
          "쌍 (j, k)",
          "k 의 시작 ≤ j 의 끝",
          "j 의 시작 ≤ k 의 끝",
          "정의로 본 결과",
        ],
        rows,
        ["l", "l", "l", "l"],
      ),
      "",
      `쌍 ${num(total)} 개 가운데 오른쪽 열이 참인 쌍이 ${num(always)} 개이고, 교차하는 쌍은 ${num(pairScan(WALK).answer)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 상한에서 멈추면 빨라지는가. */
  "limit-stop-fails": () => {
    const n = 5_000;
    const shapes: [string, number[]][] = [
      ["전부 0", new Array(n).fill(0)],
      ["전부 n", new Array(n).fill(n)],
      ["생성식 (37j + 11) mod 50", gen(n, 50)],
    ];
    const rows = shapes.map(([name, A]) => {
      const full = pairScan(A);
      const stopped = pairScan(A, DEFAULT_LIMIT);
      return [
        name,
        num(full.answer),
        num(full.checks),
        stopped.answer === -1 ? "−1" : num(stopped.answer),
        num(stopped.checks),
      ];
    });
    return [
      `n = ${num(n)} 에서 반지름 모양 셋으로 세었습니다. 상한은 ${num(DEFAULT_LIMIT)} 입니다.`,
      "",
      table(
        [
          "반지름 모양",
          "교차 쌍",
          "끝까지 대조",
          "상한에서 멈춘 답",
          "상한에서 멈춘 대조",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
    ].join("\n");
  },

  /** `deep.origin` ④ — 원판마다 「시작이 내 끝 이하인 원판」을 세면 무엇이 섞이는가. */
  "origin-rank": () => {
    const order = byEnd(WALK);
    const rows = order.map((j, i) => {
      const e = endOf(WALK, j);
      const startedIds = WALK.map((_, k) => k).filter(
        (k) => startOf(WALK, k) <= e,
      );
      const closedIds = order.slice(0, i);
      const partners = startedIds.filter(
        (k) => k !== j && !closedIds.includes(k),
      );
      return [
        String(i),
        `원판 ${j}`,
        String(e),
        String(startedIds.length),
        discs(closedIds),
        discs(partners),
      ];
    });
    return table(
      [
        "끝 순서 i",
        "원판",
        "오른쪽 끝",
        "시작이 그 끝 이하인 원판 수",
        "먼저 닫힌 원판",
        "남는 원판",
      ],
      rows,
      ["r", "l", "r", "r", "l", "l"],
    );
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리한 계수. */
  "cost-two-ways": () => {
    const rows = [
      ["전개 입력", WALK] as const,
      ["생성식 n = 1,000", gen(1_000, 50)] as const,
    ].map(([name, A]) => {
      const p = pairScan(A);
      const s = traceSweep(A);
      return [
        name,
        num(p.checks),
        num(s.sortCompares),
        num(s.openCompares),
        num(p.answer),
        num(s.answer),
      ];
    });
    return [
      table(
        [
          "입력",
          "모든 쌍 대조",
          "끝 순서 방식의 정렬 비교",
          "끝 순서 방식의 여는 비교",
          "답(모든 쌍)",
          "답(끝 순서)",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
    ].join("\n");
  },

  /** `deep.build.concept` (c)(d) — 멈출 때마다 원판이 어느 상태인가. */
  "sweep-stops": () => {
    const order = byEnd(WALK);
    const rows = order.map((j, i) => {
      const x = endOf(WALK, j);
      const started = WALK.map((_, k) => k).filter(
        (k) => startOf(WALK, k) <= x,
      );
      const closed = order.slice(0, i + 1);
      const waiting = started.filter((k) => !closed.includes(k));
      return [
        String(i),
        String(x),
        `원판 ${j}`,
        String(started.length),
        discs(closed),
        discs(waiting),
      ];
    });
    return table(
      [
        "멈춤 i",
        "기준점 x",
        "여기서 닫히는 원판",
        "시작한 원판 수",
        "닫힌 원판(이번 포함)",
        "시작했고 아직 안 닫힌 원판",
      ],
      rows,
      ["r", "r", "l", "r", "l", "l"],
    );
  },

  /** `deep.build.concept` (e) — 좌표를 한 칸씩 옮기는 모양과의 비교. */
  "sweep-vs-grid": () => {
    const cases: [string, number[]][] = [
      ["전개 입력", WALK],
      ["최대 반지름 둘", [2_147_483_647, 2_147_483_647]],
      ["n = 100,000 · 전부 0", new Array(MAX_N).fill(0)],
    ];
    const rows = cases.map(([name, A]) => {
      let lo = Number.POSITIVE_INFINITY;
      let hi = Number.NEGATIVE_INFINITY;
      for (let j = 0; j < A.length; j++) {
        lo = Math.min(lo, startOf(A, j));
        hi = Math.max(hi, endOf(A, j));
      }
      return [name, num(hi - lo + 1), num(A.length)];
    });
    return table(
      ["입력", "좌표를 한 칸씩 옮길 때 멈추는 자리", "오른쪽 끝에서만 멈출 때"],
      rows,
      ["l", "r", "r"],
    );
  },

  /** `deep.build` 2단계 — 두 끝을 따로 정렬한 결과. */
  "build-sorted": () =>
    table(
      ["배열", "원판 번호 순", "오름차순으로 정렬한 뒤"],
      [
        [
          "왼쪽 끝 starts",
          show(WALK.map((_, j) => startOf(WALK, j))),
          show(T.starts),
        ],
        [
          "오른쪽 끝 ends",
          show(WALK.map((_, j) => endOf(WALK, j))),
          show(T.ends),
        ],
      ],
      ["l", "l", "l"],
    ),

  /** `deep.build` 3단계 — 오른쪽 끝이 커지는 동안 opened 가 어떻게 움직이는가. */
  "build-opened": () => {
    const cells = (xs: number[]): string =>
      xs.map((x) => String(x).padStart(3, " ")).join("");
    return [
      `끝 순서 i     ${cells(T.steps.map((st) => st.i))}`,
      `ends[i]       ${cells(T.steps.map((st) => st.end))}`,
      `이번에 연 수  ${cells(T.steps.map((st) => st.newlyOpened))}`,
      `opened        ${cells(T.steps.map((st) => st.opened))}`,
    ].join("\n");
  },

  /** `deep.build` 3~4단계 — 번호 없이 센 값과 원판 번호로 센 값이 같은가. */
  "build-subtract": () => {
    const order = byEnd(WALK);
    const rows = T.steps.map((st) => {
      const j = order[st.i] as number;
      const partners = WALK.map((_, k) => k).filter(
        (k) =>
          order.indexOf(k) > st.i &&
          startOf(WALK, k) <= endOf(WALK, j) &&
          meets(WALK, j, k),
      );
      return [
        String(st.i),
        String(st.end),
        String(st.opened),
        String(st.i + 1),
        String(st.added),
        discs(partners),
        partners.length === st.added ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        [
          "끝 순서 i",
          "오른쪽 끝",
          "연 원판 수",
          "뺄 수 i + 1",
          "더할 수",
          "원판 번호로 찾은 새 짝",
          "판정",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l", "l"],
      ),
      "",
      `더할 수의 합은 ${num(T.answer)} 이고, 모든 쌍을 대조한 답도 ${num(pairScan(WALK).answer)} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 1 — T1 · T2 두 배열. */
  "walk-sorted": () =>
    [
      `T1  starts = ${show(T.starts)}      원판 번호 순 ${show(WALK.map((_, j) => startOf(WALK, j)))} 을 정렬했다`,
      `T2  ends   = ${show(T.ends)}         원판 번호 순 ${show(WALK.map((_, j) => endOf(WALK, j)))} 을 정렬했다`,
    ].join("\n"),

  /** `deep.walk.pause` — 두 끝을 따로 정렬해도 답이 같은가. */
  "pause-separate": () => {
    const pairedSweep = (A: number[]): number => {
      // 원판 짝을 지킨 판 — 오른쪽 끝 순서로 원판을 늘어놓고, 시작은 원판마다 직접 비교한다.
      const order = byEnd(A);
      let count = 0;
      for (const [i, j] of order.entries()) {
        for (let p = i + 1; p < order.length; p++) {
          if (startOf(A, order[p] as number) <= endOf(A, j)) count++;
        }
      }
      return count;
    };
    const rows = SMALL.map((A) => {
      const a = countIntersectingDiscs([...A]);
      const b = pairedSweep(A);
      return [
        A === WALK ? `전개 입력 ${show(A)}` : show(A),
        String(a),
        String(b),
        a === b ? "같다" : "어긋난다",
      ];
    });
    let total = 0;
    let wrong = 0;
    for (let n = 0; n <= 6; n++) {
      for (let code = 0; code < 4 ** n; code++) {
        const A: number[] = [];
        let c = code;
        for (let j = 0; j < n; j++) {
          A.push(c % 4);
          c = Math.floor(c / 4);
        }
        total++;
        if (countIntersectingDiscs([...A]) !== pairedSweep(A)) wrong++;
      }
    }
    return [
      table(
        ["입력", "따로 정렬한 판(정본)", "원판 짝을 지킨 판", "판정"],
        rows,
        ["l", "r", "r", "l"],
      ),
      "",
      `길이가 0 부터 6 까지이고 반지름이 0 부터 3 까지인 배열 ${num(total)} 개를 전수로 대조했습니다. 두 판의 답이 어긋난 배열은 ${num(wrong)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 2 — T3 한 걸음. */
  "walk-open-first": () => {
    const st = T.steps[0] as SweepStep;
    const lines = [`T3  end = ends[0] = ${st.end}`];
    for (let p = 0; p < st.newlyOpened; p++) {
      lines.push(
        `    starts[${p}] = ${T.starts[p]} ≤ ${st.end} 참 → ① opened = ${p + 1}`,
      );
    }
    if (st.stop !== null) {
      lines.push(
        `    starts[${st.opened}] = ${st.stop.start} ≤ ${st.end} 거짓 → 멈춘다. opened = ${st.opened}`,
      );
    }
    return lines.join("\n");
  },

  /** `deep.walk.pause` — 여는 조건에서 등호를 빼면. */
  "pause-touch": () =>
    mutantTable("등호를 뺀 판", strictOpen, "시작 = 끝 인 짝", (A) =>
      equalStartEnd(A),
    ),

  /** `deep.walk` 3 — T3 ~ T8 전체. */
  "walk-trace": () => {
    const rows = T.steps.map((st) => [
      `T${st.i + 3}`,
      String(st.i),
      String(st.end),
      String(st.newlyOpened),
      st.stop === null
        ? "opened < n 거짓"
        : `${st.stop.start} ≤ ${st.stop.end} 거짓`,
      String(st.opened),
      `${st.opened} − ${st.i + 1} = ${st.added}`,
      String(st.count),
      `${st.count} > ${num(DEFAULT_LIMIT)} 거짓`,
    ]);
    return table(
      [
        "걸음",
        "i",
        "end",
        "① 로 연 수",
        "while 이 멈춘 조건",
        "opened",
        "② 더한 수",
        "count",
        "③ 조건",
      ],
      rows,
      ["l", "r", "r", "r", "l", "r", "l", "r", "l"],
    );
  },

  /** `deep.walk` 4 — 작은 상한을 걸면 어디서 멈추는가. */
  "walk-limit": () => {
    const L = traceSweep(WALK, WALK_LIMIT);
    const rows = L.steps.map((st) => [
      `T${st.i + 3}`,
      String(st.count),
      `${st.count} > ${WALK_LIMIT} ${st.overflow ? "참 → ③ return −1" : "거짓"}`,
    ]);
    return [
      table(["걸음", "count", "③ 조건"], rows, ["l", "r", "l"]),
      "",
      `정본에 상한 ${WALK_LIMIT} 을 넘겨 실행한 반환값은 ${countIntersectingDiscs([...WALK], WALK_LIMIT)} 이고, 상한을 안 넘긴 반환값은 ${countIntersectingDiscs([...WALK])} 입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 걸음마다 두 문장이 참인가. */
  "invariant-steps": () => {
    const order = byEnd(WALK);
    let wrong = 0;
    const rows = T.steps.map((st) => {
      const direct = T.starts.filter((s) => s <= st.end).length;
      let pairs = 0;
      for (let p = 0; p <= st.i; p++) {
        for (let q = p + 1; q < order.length; q++) {
          if (meets(WALK, order[p] as number, order[q] as number)) pairs++;
        }
      }
      const ok = direct === st.opened && pairs === st.count;
      if (!ok) wrong++;
      return [
        `T${st.i + 3}`,
        String(st.opened),
        String(direct),
        String(st.count),
        String(pairs),
        ok ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        [
          "걸음",
          "opened",
          "시작이 end 이하인 원판(직접 셈)",
          "count",
          "앞선 원판이 끝 순서 0 ~ i 인 교차 쌍(직접 셈)",
          "판정",
        ],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      `여섯 걸음 모두에서 두 값을 직접 센 값과 대조했고, 어긋난 걸음은 ${num(wrong)} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계 입력. */
  "invariant-edges": () => {
    const cases: [string, number[]][] = [
      ["원판이 없음", []],
      ["원판 하나", [5]],
      ["원판 둘이 겹침", [1, 1]],
      ["한 점짜리 둘, 거리 1", [0, 0]],
      ["모두 서로 겹침", [10, 10, 10]],
      ["반지름이 모두 0", [0, 0, 0]],
      ["최대 반지름 둘", [2_147_483_647, 2_147_483_647]],
    ];
    const rows = cases.map(([name, A]) => {
      const got = countIntersectingDiscs([...A]);
      const want = pairScan(A).answer;
      return [name, show(A), String(got), got === want ? "같다" : "어긋난다"];
    });
    return table(["경계", "반지름", "답", "모든 쌍을 대조한 값과"], rows, [
      "l",
      "l",
      "r",
      "l",
    ]);
  },

  /** `invariant` ③ — 먼저 닫힌 원판을 빼지 않으면. */
  "mutant-no-closed": () =>
    mutantTable(
      "먼저 닫힌 원판을 안 뺀 판",
      noClosed,
      "먼저 닫힌 원판 수의 합",
      (A) => closedSum(A),
    ),

  /** `perf.derive` — 규모별 계수. */
  "perf-scale": () => {
    const rows = [6, 1_000, MAX_N].map((n) => {
      const A = n === 6 ? WALK : gen(n, 50);
      const s = traceSweep(A);
      return [
        num(n),
        num(s.sortCompares),
        num(s.openCompares),
        num(2 * n),
        num(s.steps.length),
        num(s.answer),
      ];
    });
    return [
      "n = 6 은 전개 입력이고, 나머지는 생성식 (37j + 11) mod 50 입니다.",
      "",
      table(
        ["n", "정렬 비교(두 배열 합)", "여는 비교", "2n", "바깥 반복", "답"],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
    ].join("\n");
  },

  /** `perf.worst` — 반지름 모양에 따라 무엇이 달라지는가. */
  "worst-shape": () => {
    const n = MAX_N;
    const shapes: [string, number[]][] = [
      ["전부 0", new Array(n).fill(0)],
      ["전부 1", new Array(n).fill(1)],
      ["생성식 (37j + 11) mod 50", gen(n, 50)],
      [
        "짝수 번은 j, 홀수 번은 1",
        Array.from({ length: n }, (_, j) => (j % 2 === 0 ? j : 1)),
      ],
      ["전부 n", new Array(n).fill(n)],
    ];
    const rows = shapes.map(([name, A]) => {
      const s = traceSweep(A);
      return [
        name,
        num(s.sortCompares),
        num(s.openCompares),
        num(s.steps.length),
        s.answer === -1 ? "−1" : num(s.answer),
      ];
    });
    return [
      `n = ${num(n)} 에서 반지름 모양 다섯으로 세었습니다.`,
      "",
      table(
        ["반지름 모양", "정렬 비교", "여는 비교", "바깥 반복", "답"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
    ].join("\n");
  },
};
