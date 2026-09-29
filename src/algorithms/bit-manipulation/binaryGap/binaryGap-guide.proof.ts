/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/binaryGap/binaryGap-guide.md
 *
 * **계수를 세는 사본이 있다.** 정본은 반복 횟수와 중간 상태를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본(`traceScan`)이 아니면 걸음 값을 낼 방법이 없다. **답이 맞는지는 사본이 아니라
 * 정본이 진다** — 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 은는 } from "../../../../tools/josa.ts";
import { binaryGap } from "./binaryGap-guide.ref.ts";

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

/** 이진 표기. 아래 첨자 ₂ 를 붙인다. */
const bin = (n: number): string => `${n.toString(2)}₂`;

/** 마크다운 표. 수가 든 열은 오른쪽 정렬(`---:`)이다. */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  const rule = `| ${head.map((_, c) => (align[c] === "r" ? "---:" : "---")).join(" | ")} |`;
  return [line(head), rule, ...rows.map(line)].join("\n");
}

/** 수 목록. 비면 「없음」. */
const list = (xs: number[]): string =>
  xs.length === 0 ? "없음" : xs.join(" · ");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 수. `101000010₂` — 가장 낮은 자리가 0 이라 첫 1 앞에 닫히지 않는 0 이 있고,
 * 첫 1 · 더 긴 0 구간을 닫는 1 · 더 짧은 0 구간을 닫는 1 이 차례로 나온다. 모든 갈래를 지난다.
 */
export const WALK = 322;

/** 과제의 값 상한 — 32 비트 부호 있는 정수의 최댓값. */
const MAX_N = 2_147_483_647;

/** 과제가 가정하는 호출 횟수. */
const CALLS = 1_000_000;

/** 초당 단순 연산 수의 어림값. */
const OPS_PER_SEC = 100_000_000;

/** 비용을 재는 입력. 값 하나 둘과, 값 범위의 아래쪽 · 위쪽 끝 백만 개씩. */
const COST_INPUTS: { label: string; from: number; to: number }[] = [
  { label: "전개 입력 322", from: WALK, to: WALK },
  { label: "2,147,483,647", from: MAX_N, to: MAX_N },
  { label: `1 ~ ${num(CALLS)}`, from: 1, to: CALLS },
  {
    label: `${num(MAX_N - CALLS + 1)} ~ ${num(MAX_N)}`,
    from: MAX_N - CALLS + 1,
    to: MAX_N,
  },
];

/** 변이와 짚고 가기가 쓰는 작은 입력 열. 앞쪽은 기존 시험이 쓰던 케이스다. */
const SMALL: number[] = [
  WALK,
  9,
  529,
  20,
  15,
  32,
  1041,
  1,
  6,
  2 ** 30 + 1,
  MAX_N,
];

/* ────────────────────────── 기준 방식 · 세는 사본 ────────────────────────── */

/** 1 비트의 자리를 낮은 자리부터. 정의 그대로 문자열에서 읽는다. */
function onePositions(n: number): number[] {
  const s = n.toString(2);
  const out: number[] = [];
  for (let k = s.length - 1; k >= 0; k--) {
    if (s[k] === "1") out.push(s.length - 1 - k);
  }
  return out;
}

/** 정의 그대로의 답 — 이웃한 두 1 자리의 차이에서 1 을 뺀 값 가운데 최댓값. 1 이 하나면 0. */
function byDefinition(n: number): number {
  const p = onePositions(n);
  let best = 0;
  for (let j = 0; j + 1 < p.length; j++) {
    best = Math.max(best, (p[j + 1] as number) - (p[j] as number) - 1);
  }
  return best;
}

/** 가장 긴 0 의 연속 — 닫혔는지 보지 않는다. 「아이디어를 떠올리는 과정」의 첫 후보. */
function longestZeroRun(n: number): number {
  let best = 0;
  for (const run of n.toString(2).split("1")) best = Math.max(best, run.length);
  return best;
}

/**
 * 가장 단순한 방법 — 이진 문자열에서 1 인 두 자리를 모두 짝짓고, 사이의 자리를 전부 읽어
 * 0 뿐인지 본다. 세는 것은 **사이 자리를 읽은 횟수**다.
 */
function naivePairs(n: number): {
  answer: number;
  pairs: number;
  reads: number;
  rows: { a: number; b: number; between: number; closed: boolean }[];
} {
  const bits = n.toString(2);
  const L = bits.length;
  let best = 0;
  let pairs = 0;
  let reads = 0;
  const rows: { a: number; b: number; between: number; closed: boolean }[] = [];
  for (let a = 0; a < L; a++) {
    for (let b = a + 1; b < L; b++) {
      if (bits[a] !== "1" || bits[b] !== "1") continue;
      pairs++;
      let closed = true;
      for (let k = a + 1; k < b; k++) {
        reads++;
        if (bits[k] === "1") closed = false;
      }
      if (closed) best = Math.max(best, b - a - 1);
      // 문자열 칸 a·b 를 비트 자리로 바꿔 둔다(높은 자리가 문자열 앞).
      rows.push({ a: L - 1 - b, b: L - 1 - a, between: b - a - 1, closed });
    }
  }
  return { answer: best, pairs, reads, rows };
}

/** 사이 자리 읽기 횟수를 1 자리만으로 센다 — 1 쌍마다 (b − a − 1). `naivePairs` 와 같은 값이다. */
function naiveReads(n: number): number {
  const p = onePositions(n);
  let t = 0;
  for (let j = 0; j < p.length; j++) {
    for (let k = j + 1; k < p.length; k++) {
      t += (p[k] as number) - (p[j] as number) - 1;
    }
  }
  return t;
}

interface ScanStep {
  i: number;
  /** 이 걸음을 시작할 때의 x. */
  x: number;
  bit: number;
  /** 이 걸음을 시작할 때의 last. */
  lastBefore: number;
  /** ① 로 잰 값. 재지 않았으면 `null`. */
  measured: number | null;
  best: number;
  lastAfter: number;
}

/**
 * 정본과 같은 절차에 세는 자리만 덧붙인 사본. `step` 을 바꾸면 한 자리 내리는 방법을 바꾼다 —
 * 짚고 가기가 「2 로 나누면」의 반복 횟수를 세는 데 쓴다(답은 변이가 낸다).
 */
function traceScan(
  n: number,
  step: (x: number) => number = (x) => x >>> 1,
): { steps: ScanStep[]; answer: number; iterations: number } {
  let best = 0;
  let last = -1;
  let x = n;
  const steps: ScanStep[] = [];
  let i = 0;
  for (; x !== 0; i++) {
    const bit = x & 1;
    const lastBefore = last;
    let measured: number | null = null;
    if (bit === 1) {
      if (last >= 0) {
        measured = i - last - 1;
        best = Math.max(best, measured);
      }
      last = i;
    }
    steps.push({ i, x, bit, lastBefore, measured, best, lastAfter: last });
    x = step(x);
  }
  return { steps, answer: best, iterations: i };
}

/** 높은 자리(30)부터 한 자리씩 내려가며 읽는 사본 — 설계 선택의 비교 상대. 반복 횟수만 센다. */
function scanFromTop(n: number): { answer: number; iterations: number } {
  let best = 0;
  let last = -1;
  let iterations = 0;
  for (let i = 30; i >= 0; i--) {
    iterations++;
    if (((n >>> i) & 1) === 1) {
      if (last >= 0) best = Math.max(best, last - i - 1);
      last = i;
    }
  }
  return { answer: best, iterations };
}

function 자기대조(): void {
  const inputs: number[] = [...SMALL];
  for (let n = 1; n <= 5_000; n++) inputs.push(n);
  for (let k = 0; k < 31; k++) inputs.push(2 ** k, 2 ** k + 1, 2 ** 31 - 1 - k);
  for (const n of inputs) {
    const want = byDefinition(n);
    const got = binaryGap(n);
    if (got !== want) throw new Error(`정본이 정의와 다르다 — n=${n}`);
    if (traceScan(n).answer !== got)
      throw new Error(`세는 사본이 정본과 다르다 — n=${n}`);
    if (scanFromTop(n).answer !== got)
      throw new Error(`높은 자리부터 읽는 사본이 정본과 다르다 — n=${n}`);
    if (n <= 5_000) {
      const nv = naivePairs(n);
      if (nv.answer !== got)
        throw new Error(`가장 단순한 방법이 정본과 다르다 — n=${n}`);
      if (nv.reads !== naiveReads(n))
        throw new Error(`읽기 횟수 두 셈이 다르다 — n=${n}`);
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./binaryGap-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  binaryGap(n: number): number;
}

/** 한 자리 내리는 줄을 2 로 나누기로 바꾼 사본 — 소수점 아래로 값이 남는다. */
const divide = await loadMutant<Impl>(REF, {
  swap: [/x >>>= 1;/, "x /= 2;"],
});

/** 0 개수를 재는 식에서 1 을 빼지 않은 사본 — 자리 차이를 그대로 쓴다. */
const noMinusOne = await loadMutant<Impl>(REF, {
  swap: [/i - last - 1\)/, "i - last)"],
});

/** **불변식을 지키던 줄** — 직전 1 이 있는지 보는 조건을 늘 참으로 만든 사본. */
const noGuard = await loadMutant<Impl>(REF, {
  swap: [/last >= 0/, "last >= -1"],
});

/** 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이가 적용되지 않았다. */
const 중화됨 = noMinusOne.binaryGap === binaryGap;

if (!중화됨) {
  for (const [name, impl] of [
    ["1 을 빼지 않는 변이", noMinusOne],
    ["직전 1 을 보지 않는 변이", noGuard],
  ] as const) {
    const same = SMALL.every((n) => binaryGap(n) === impl.binaryGap(n));
    if (same) throw new Error(`${name}가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

/** 변이 하나를 작은 입력 열에 걸어 정본과 나란히 놓는다. */
function mutantTable(
  head: string,
  impl: Impl,
  extraHead: string,
  extra: (n: number) => string,
): string {
  const rows = SMALL.map((n) => {
    const bare = binaryGap(n);
    const mutated = impl.binaryGap(n);
    const label = n === WALK ? `전개 입력 ${num(n)}` : num(n);
    return [
      label,
      bin(n),
      extra(n),
      String(bare),
      String(mutated),
      bare === mutated ? "같다" : "어긋난다",
    ];
  });
  return table(["n", "이진 표현", extraHead, "정본", head, "판정"], rows, [
    "l",
    "l",
    "r",
    "r",
    "r",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

const T = traceScan(WALK);

export const PROOFS: Record<string, () => string> = {
  /** `deep.origin` ② — 가장 단순한 방법의 비용. */
  "origin-naive-cost": () => {
    const rows = COST_INPUTS.map((c) => {
      let pairs = 0;
      let reads = 0;
      for (let n = c.from; n <= c.to; n++) {
        const k = onePositions(n).length;
        pairs += (k * (k - 1)) / 2;
        reads += naiveReads(n);
      }
      return [
        c.label,
        num(c.to - c.from + 1),
        num(pairs),
        num(reads),
        seconds(reads / OPS_PER_SEC),
      ];
    });
    return table(
      [
        "입력",
        "부르는 횟수",
        "1 인 자리 쌍(합)",
        "사이 자리 읽기(합)",
        "초당 1억 번 기준",
      ],
      rows,
      ["l", "r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ③ — 전개 입력에서 1 쌍을 하나씩 본다. */
  "origin-pairs": () => {
    const r = naivePairs(WALK);
    const rows = r.rows.map((row) => {
      const inner = Array.from(
        { length: row.b - row.a - 1 },
        (_, k) => row.a + 1 + k,
      );
      const onesInside = inner.filter((q) => ((WALK >>> q) & 1) === 1);
      return [
        `(${row.a}, ${row.b})`,
        String(row.between),
        onesInside.length === 0 ? "없음" : `자리 ${list(onesInside)}`,
        row.closed ? `0 구간 · 길이 ${row.between}` : "0 구간이 아님",
      ];
    });
    return [
      table(["1 인 두 자리", "사이 자리 수", "사이에 있는 1", "결과"], rows, [
        "l",
        "r",
        "l",
        "l",
      ]),
      "",
      `쌍 ${r.pairs} 개에서 사이 자리를 모두 ${r.reads} 번 읽었고, 답은 ${r.answer} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로. */
  "origin-two-ways": () => {
    const rows = COST_INPUTS.map((c) => {
      let naive = 0;
      let scan = 0;
      for (let n = c.from; n <= c.to; n++) {
        naive += naiveReads(n);
        scan += traceScanIterations(n);
      }
      return [
        c.label,
        num(naive),
        num(scan),
        seconds(naive / OPS_PER_SEC),
        seconds(scan / OPS_PER_SEC),
      ];
    });
    return table(
      [
        "입력",
        "쌍마다 사이 읽기(합)",
        "한 번 읽기의 자리 읽기(합)",
        "쌍마다(초당 1억 번)",
        "한 번 읽기(초당 1억 번)",
      ],
      rows,
      ["l", "r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ⑤ — 가장 긴 0 의 연속을 세면. */
  "origin-zero-run": () => {
    const inputs = [WALK, 9, 20, 32, 1041, 6];
    const rows = inputs.map((n) => {
      const run = longestZeroRun(n);
      const want = byDefinition(n);
      return [
        num(n),
        bin(n),
        String(run),
        String(want),
        run === want ? "정의와 같음" : "정의와 다름",
      ];
    });
    return table(
      [
        "n",
        "이진 표현",
        "가장 긴 0 의 연속",
        "binary gap(정의)",
        "후보의 결과",
      ],
      rows,
      ["l", "l", "r", "r", "l"],
    );
  },

  /** `deep.build` 먼저 알아 둘 개념 — 한 걸음을 읽는 법. */
  "build-read-one": () => {
    const st = T.steps[6] as ScanStep;
    return [
      table(
        ["읽는 순서", "계산"],
        [
          ["자리 번호", `i = ${st.i}`],
          ["이 걸음의 x", `${num(WALK)} >>> ${st.i} = ${st.x} = ${bin(st.x)}`],
          ["가장 낮은 자리", `${st.x} & 1 = ${st.bit}`],
          ["읽은 비트", `${num(WALK)} 의 자리 ${st.i}${은는(st.i)} ${st.bit}`],
        ],
        ["l", "l"],
      ),
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 — 문자열 칸과 비트 자리. */
  "build-string-vs-bit": () => {
    const s = [...WALK.toString(2)];
    return table(
      ["문자열 칸 k", ...s.map((_, k) => String(k))],
      [
        ["문자", ...s],
        ["비트 자리 i", ...s.map((_, k) => String(s.length - 1 - k))],
      ],
      ["l", ...s.map((): "l" => "l")],
    );
  },

  /** `deep.build` 2단계 — 1 을 만날 때마다 last 가 어떻게 바뀌는가. */
  "build-last": () => {
    const rows = T.steps.map((st) => [
      String(st.i),
      String(st.bit),
      String(st.lastBefore),
      String(st.lastAfter),
    ]);
    return table(["자리 i", "비트", "읽기 전 last", "읽은 뒤 last"], rows, [
      "r",
      "r",
      "r",
      "r",
    ]);
  },

  /** `deep.build` 3단계 — 1 을 만날 때 잰 값. */
  "build-measure": () => {
    const rows = T.steps
      .filter((st) => st.bit === 1)
      .map((st) => [
        String(st.i),
        String(st.lastBefore),
        st.measured === null
          ? "직전 1 이 없어 재지 않는다"
          : `${st.i} − ${st.lastBefore} − 1 = ${st.measured}`,
        String(st.best),
      ]);
    return [
      table(
        ["1 인 자리 i", "직전 1 의 자리 last", "사이의 0 개수", "best"],
        rows,
        ["r", "r", "l", "r"],
      ),
      "",
      `반복이 끝났을 때 best 는 ${T.answer} 이고, 정의대로 센 binary gap 도 ${byDefinition(WALK)} 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 전제 — 32 비트를 넘는 수. */
  "build-premise-width": () => {
    const inputs = [MAX_N, 2 ** 31 + 1, 2 ** 32 - 1, 2 ** 32 + 1, 2 ** 33 + 1];
    const rows = inputs.map((n) => [
      num(n),
      String(n.toString(2).length),
      String(byDefinition(n)),
      String(binaryGap(n)),
      binaryGap(n) === byDefinition(n) ? "맞다" : "틀린 값",
    ]);
    return table(
      ["n", "자리 수 L", "정의대로 센 값", "정본의 반환값", "정본"],
      rows,
      ["l", "r", "r", "r", "l"],
    );
  },

  /** `deep.build` 설계 선택 — 낮은 자리부터 vs 높은 자리 30 부터. */
  "build-direction": () => {
    const inputs = [1, 6, WALK, 1041, 2 ** 20 + 1, 2 ** 30 + 1, MAX_N];
    const rows = inputs.map((n) => [
      num(n),
      String(n.toString(2).length),
      String(traceScan(n).iterations),
      String(scanFromTop(n).iterations),
      String(binaryGap(n)),
      String(scanFromTop(n).answer),
    ]);
    let low = 0;
    let top = 0;
    for (let n = 1; n <= CALLS; n++) {
      low += n.toString(2).length;
      top += 31;
    }
    return [
      table(
        [
          "n",
          "자리 수 L",
          "낮은 자리부터 반복",
          "자리 30 부터 반복",
          "답(낮은 자리부터)",
          "답(자리 30 부터)",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `n = 1 부터 ${num(CALLS)} 까지 한 번씩 부르면 반복이 낮은 자리부터는 모두 ${num(low)} 번, 자리 30 부터는 모두 ${num(top)} 번입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 자리만 읽는 반복. */
  "walk-read": () => {
    const bits = T.steps.map((st) => String(st.bit));
    return [
      `x = ${WALK} 에서 시작해 x !== 0 인 동안 ${T.iterations} 번 반복했다`,
      `읽은 비트(자리 0 부터): ${bits.join(" ")}`,
      `높은 자리부터 거꾸로 이으면 ${[...bits].reverse().join("")}₂ = ${WALK}`,
    ].join("\n");
  },

  /** `deep.walk` 짚고 가기 — 2 로 나누면. */
  "pause-divide": () =>
    mutantTable(
      "2 로 나눈 판",
      divide,
      "반복(정본 / 2 로 나눈 판)",
      (n) =>
        `${traceScan(n).iterations} / ${num(traceScan(n, (x) => x / 2).iterations)}`,
    ),

  /** `deep.walk` 2 — 1 을 만나면 자리를 기억한다. */
  "walk-last": () => {
    const hits = T.steps.filter((st) => st.bit === 1);
    return [
      ...hits.map(
        (st) =>
          `i = ${st.i}  x & 1 = 1 → last: ${st.lastBefore} → ${st.lastAfter}`,
      ),
      `끝난 뒤 last = ${T.steps.at(-1)?.lastAfter}`,
    ].join("\n");
  },

  /** `deep.walk` 3 — T1 ~ T9 전체. */
  "walk-trace": () => {
    const rows = T.steps.map((st) => {
      const isOne = st.bit === 1;
      const guard = isOne
        ? `${st.lastBefore} >= 0 ${st.lastBefore >= 0 ? "참" : "거짓"}`
        : "—";
      return [
        `T${st.i + 1}`,
        String(st.i),
        bin(st.x),
        `${st.bit} === 1 ${isOne ? "참" : "거짓"}`,
        guard,
        st.measured === null
          ? "—"
          : `max(${T.steps[st.i - 1]?.best ?? 0}, ${st.i} − ${st.lastBefore} − 1) = ${st.best}`,
        isOne ? `last = ${st.lastAfter}` : "—",
        String(st.best),
      ];
    });
    return table(
      [
        "걸음",
        "i",
        "x",
        "x & 1 === 1",
        "last >= 0",
        "① 재기",
        "② 기억",
        "best",
      ],
      rows,
      ["l", "r", "l", "l", "l", "l", "l", "r"],
    );
  },

  /** `deep.walk` 짚고 가기 — 1 을 빼지 않으면. */
  "pause-minus-one": () =>
    mutantTable("1 을 빼지 않은 판", noMinusOne, "1 의 개수", (n) =>
      String(onePositions(n).length),
    ),

  /** `invariant` ② — 걸음마다 두 문장이 참인가. */
  "invariant-steps": () => {
    let wrong = 0;
    const rows = T.steps.map((st) => {
      const low = WALK % 2 ** (st.i + 1);
      const ones = onePositions(low);
      const directLast = ones.length === 0 ? -1 : (ones.at(-1) as number);
      const directBest = byDefinition(low === 0 ? 0 : low);
      const ok = directLast === st.lastAfter && directBest === st.best;
      if (!ok) wrong++;
      return [
        `T${st.i + 1}`,
        String(st.i),
        String(st.lastAfter),
        String(directLast),
        String(st.best),
        String(directBest),
        ok ? "같다" : "어긋난다",
      ];
    });
    return [
      table(
        [
          "걸음",
          "i",
          "last",
          "자리 0 ~ i 의 가장 높은 1(직접 셈)",
          "best",
          "자리 0 ~ i 안의 가장 긴 닫힌 0 구간(직접 셈)",
          "판정",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      `${T.steps.length} 걸음 모두에서 두 값을 직접 센 값과 대조했고, 어긋난 걸음은 ${wrong} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계 입력. */
  "invariant-edges": () => {
    const cases: [string, number][] = [
      ["가장 작은 값", 1],
      ["1 이 하나, 아래가 모두 0", 32],
      ["1 이 둘, 붙어 있음", 6],
      ["1 이 모두 붙어 있음", 15],
      ["1 이 둘, 가장 멀리", 2 ** 30 + 1],
      ["가장 큰 값", MAX_N],
    ];
    const rows = cases.map(([name, n]) => [
      name,
      num(n),
      bin(n),
      String(traceScan(n).iterations),
      String(binaryGap(n)),
      binaryGap(n) === byDefinition(n) ? "정의와 같음" : "정의와 다름",
    ]);
    return table(
      ["경계", "n", "이진 표현", "반복", "답", "정의대로 센 값과"],
      rows,
      ["l", "l", "l", "r", "r", "l"],
    );
  },

  /** `invariant` ③ — 직전 1 이 있는지 보지 않으면. */
  "mutant-no-guard": () =>
    mutantTable("직전 1 을 보지 않은 판", noGuard, "첫 1 아래의 0", (n) =>
      String(onePositions(n)[0] ?? 0),
    ),

  /** `perf.derive` — 규모별 반복 횟수. */
  "perf-scale": () => {
    const inputs = [1, WALK, 1041, 2 ** 20 + 1, 2 ** 30 + 1, MAX_N];
    const rows = inputs.map((n) => {
      const s = traceScan(n);
      const ones = s.steps.filter((st) => st.bit === 1).length;
      return [
        n === WALK ? `전개 입력 ${num(n)}` : num(n),
        String(n.toString(2).length),
        String(s.iterations),
        String(ones),
        String(s.steps.filter((st) => st.measured !== null).length),
      ];
    });
    let total = 0;
    for (let n = 1; n <= CALLS; n++) total += traceScanIterations(n);
    return [
      table(
        ["n", "자리 수 L", "반복", "1 을 만난 반복", "① 을 실행한 반복"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `n = 1 부터 ${num(CALLS)} 까지 한 번씩 부르면 반복은 모두 ${num(total)} 번입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 반복이 가장 많은 입력. */
  "worst-shape": () => {
    const inputs = [
      2 ** 29,
      2 ** 30 - 1,
      2 ** 30,
      2 ** 30 + 1,
      1_431_655_765,
      MAX_N,
    ];
    const rows = inputs.map((n) => [
      num(n),
      bin(n),
      String(n.toString(2).length),
      String(traceScan(n).iterations),
      String(binaryGap(n)),
    ]);
    return table(["n", "이진 표현", "자리 수 L", "반복", "답"], rows, [
      "l",
      "l",
      "r",
      "r",
      "r",
    ]);
  },
};

/** 반복 횟수만 빠르게 — 걸음 기록 없이 사본과 같은 종료 조건으로 센다. */
function traceScanIterations(n: number): number {
  let i = 0;
  for (let x = n; x !== 0; x >>>= 1) i++;
  return i;
}
