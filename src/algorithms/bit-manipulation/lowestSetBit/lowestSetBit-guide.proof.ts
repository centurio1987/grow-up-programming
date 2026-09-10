/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { lowestSetBit } from "./lowestSetBit-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 차지한다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
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
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * `40` 을 고른 이유는 셋이고, 본문 「수행으로 알아보는 알고리즘」 도입부가 같은 셋을 적는다.
 * ① 최하위 1 비트가 자리 3 이라 자리올림이 자리 0·1·2 를 지나 자리 3 에서 멈추는 것이 세
 * 걸음으로 확인된다(자리 0 이면 한 걸음에 끝나 전파가 안 보인다). ② 자리 3 위에 1 비트가
 * 하나 더 있어서(자리 5) 그 위 구간이 뒤집힌 채로 남는 것이 함께 확인된다. ③ 값과 뒤집은
 * 값과 답이 전부 여덟 자리 안에 들어온다.
 */
const WALK_INPUT = 40;

/** 그림에 쓰는 자리 폭. 32 비트 중 아래 여덟 자리만 그린다. */
const W = 8;

/** 제약의 상한. `-2^31 ≤ x ≤ 2^31 - 1` 이다. */
const INT32_MIN = -(2 ** 31);
const INT32_MAX = 2 ** 31 - 1;

/** 호출 횟수의 규모. 기존 시험이 `10^6` 회 호출을 재는 자리와 같은 수다. */
const CALLS = 10 ** 6;

/* ────────────────────────── 계측기 ────────────────────────── */

/** 아래 `w` 자리만 그린 고정 폭 이진 표기. 음수는 32 비트 2 의 보수로 읽는다. */
function bits(value: number, w: number = W): string {
  const u = value >>> 0;
  let out = "";
  for (let j = w - 1; j >= 0; j--)
    out += Math.floor(u / 2 ** j) % 2 === 1 ? "1" : "0";
  return out;
}

/** `십진 (이진)` 한 칸. 비트 연산 편의 표기 규약이다. */
const cell = (value: number): string => `${value} (${bits(value)})`;

/** `value` 의 자리 `j` 비트. 32 비트 부호 없는 값으로 읽는다. */
const bitAt = (value: number, j: number): number =>
  Math.floor((value >>> 0) / 2 ** j) % 2;

/**
 * **2 진 지표** — `x` 를 2 로 나눌 수 있는 최대 횟수. 곧 최하위 1 비트의 자리 번호다.
 * 비트 연산을 안 쓰므로 32 비트 자르기와 무관하고, 그래서 정본의 기준값이 된다.
 */
function nu(x: number): number {
  let n = 0;
  for (let t = Math.abs(x); t > 0 && t % 2 === 0; t /= 2) n++;
  return n;
}

/** `n` 의 이진 표기에 있는 1 의 개수. */
function s2(n: number): number {
  let c = 0;
  for (let t = n; t > 0; t = Math.floor(t / 2)) c += t % 2;
  return c;
}

/**
 * **가장 단순한 방법** — 자리 0 부터 차례로 1 인지 검사한다. 보조 자료구조가 하나도 없어서
 * 이보다 단순한 절차를 세울 수 없다.
 */
function scanEachBit(x: number): { answer: number; ops: number } {
  let ops = 1; // j = 0 대입
  for (let j = 0; j < 32; j++) {
    ops += 4; // j < 32 비교 · 오른쪽 밀기 · AND · === 1 비교
    if (((x >>> j) & 1) === 1) return { answer: 1 << j, ops: ops + 1 }; // 1 << j
    ops += 1; // j++
  }
  return { answer: 0, ops: ops + 1 }; // 마지막 비교
}

/** 정본이 실행하는 기본 연산 수 — 부호 뒤집기 하나와 비트 AND 하나다. */
const REF_OPS = 2;

/** 닫힌 형태. `x ≠ 0` 이면 `5p + 6` 이다. */
const scanClosed = (p: number): number => 5 * p + 6;

/* ────────────────────────── 후보 식 ────────────────────────── */

/** 「자리 `p` 만 남기는 값 하나를 만들어 AND 한다」를 만족하는지 시험할 후보들. */
const CANDIDATES: { name: string; ops: number; f: (x: number) => number }[] = [
  { name: "x & ~x", ops: 2, f: (x) => x & ~x },
  { name: "x & (x - 1)", ops: 2, f: (x) => x & (x - 1) },
  { name: "x & (x + 1)", ops: 2, f: (x) => x & (x + 1) },
  { name: "x & ~(x - 1)", ops: 3, f: (x) => x & ~(x - 1) },
  { name: "x ^ (x & (x - 1))", ops: 3, f: (x) => x ^ (x & (x - 1)) },
  { name: "x & -x", ops: 2, f: (x) => x & -x },
];

/** 후보를 시험하는 입력. 자리 `p` 와 부호가 서로 다르다. */
const PROBE: number[] = [WALK_INPUT, 12, 1, 0, -12];

/** 전수 대조 범위. `0 ≤ x < 2^16` 이다. */
const SWEEP = 2 ** 16;

/* ────────────────────────── 걸음 추적 ────────────────────────── */

interface Step {
  label: string;
  branch: string;
  digit: string;
  carry: string;
  settled: string;
  negated: string;
  result: string;
}

/**
 * 정본이 내는 답을 기준으로, `~x + 1` 의 덧셈을 자리 단위로 펼친다. `.sim.ts` 와 같은 표다.
 *
 * 자리별 덧셈은 정본의 한 연산 안에서 일어나므로 값을 따로 세지 않는다 — 마지막 자리까지
 * 더한 값이 정본이 쓰는 `-x` 와 같은지를 여기서 대조한다.
 */
function trace(x: number): Step[] {
  const flipped = ~x;
  const out: Step[] = [];
  const blank = "?".repeat(W);
  out.push({
    label: "T1",
    branch: "— 입력",
    digit: "—",
    carry: "—",
    settled: blank,
    negated: "—",
    result: "—",
  });
  out.push({
    label: "T2",
    branch: "① 뒤집기",
    digit: "—",
    carry: "—",
    settled: blank,
    negated: "—",
    result: "—",
  });

  let carry = 1;
  let settled = blank;
  let j = 0;
  let step = 3;
  while (carry === 1 && j < W) {
    const sum = bitAt(flipped, j) + carry;
    const digit = sum % 2;
    carry = sum >= 2 ? 1 : 0;
    settled =
      settled.slice(0, W - 1 - j) + String(digit) + settled.slice(W - j);
    out.push({
      label: `T${step}`,
      branch: "② 1 더하기",
      digit: `자리 ${j}`,
      carry: carry === 1 ? "1 — 위로 넘어간다" : "0 — 여기서 멈춘다",
      settled,
      negated: "—",
      result: "—",
    });
    j++;
    step++;
  }

  // 자리올림이 0 이 된 뒤의 자리는 뒤집은 값 그대로다.
  const negated = -x;
  out.push({
    label: `T${step}`,
    branch: "② 1 더하기",
    digit: `자리 ${j} 부터 위`,
    carry: "0 — 더할 것이 없다",
    settled: bits(negated),
    negated: cell(negated),
    result: "—",
  });
  step++;
  out.push({
    label: `T${step}`,
    branch: "③ AND",
    digit: "—",
    carry: "—",
    settled: bits(negated),
    negated: cell(negated),
    result: cell(lowestSetBit(x)),
  });
  step++;
  out.push({
    label: `T${step}`,
    branch: "③ 반환",
    digit: "—",
    carry: "—",
    settled: bits(negated),
    negated: cell(negated),
    result: cell(lowestSetBit(x)),
  });
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { lowestSetBit: (x: number) => number };

const REF = new URL("./lowestSetBit-guide.ref.ts", import.meta.url).pathname;

/**
 * **1 을 더하지 않은 사본.** 불변식 「자리올림이 자리 `p` 에서 멈춰 그 자리가 다시 1 이
 * 된다」를 유지하던 바로 그 자리다. 1 을 안 더하면 뒤집은 값이 그대로 남고, 뒤집은 값은
 * 모든 자리에서 원래 값의 반대라 AND 가 어느 자리도 못 남긴다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noCarry = await loadMutant<Impl>(REF, {
  swap: [/return x & -x;/, "return x & ~x;"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

const label = (x: number): string =>
  x === WALK_INPUT ? `전개 입력 ${x}` : num(x);

/** 자리 `p` 와 부호가 서로 다른 사례. 문제 예시와 시험 파일에서 가져왔다. */
const SAMPLES: number[] = [WALK_INPUT, 12, 8, 1, 0, -12];

/** 32 비트 경계에 놓인 사례. */
const EDGES: [string, number][] = [
  ["값이 0", 0],
  ["1 비트가 자리 0 하나", 1],
  ["1 비트가 전부 켜짐", -1],
  ["전개 입력", WALK_INPUT],
  ["음수", -12],
  ["제약의 위쪽 끝", INT32_MAX],
  ["제약의 아래쪽 끝", INT32_MIN],
  ["자리 30 하나", 2 ** 30],
];

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 뒤집고 1 을 더한 값과 원래 값이 함께 1 인 자리가 하나뿐이다. */
  conceptIsolate: () => {
    const rows = SAMPLES.map((x) => [
      String(x),
      bits(x),
      bits(~x),
      bits(-x),
      bits(lowestSetBit(x)),
      String(lowestSetBit(x)),
    ]);
    return [
      "아래 여덟 자리만 그린 그림 (십진값은 32 비트 정수 그대로다)",
      table(
        ["x", "x 의 자리", "~x 의 자리", "-x 의 자리", "x & -x 의 자리", "답"],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ x 가 0 이 아닌 줄에서는 다섯째 열에 1 이 하나뿐이고, 그 자리가 x 의 가장 낮은",
      "  1 비트 자리와 같다. x 가 0 인 줄은 넷째 열도 전부 0 이라 다섯째 열에 1 이 없다",
    ].join("\n");
  },

  /** `concept` — 자리 `p` 를 경계로 세 구간에서 두 값의 비트가 어떻게 걸리는가. */
  conceptRanges: () => {
    const x = WALK_INPUT;
    const p = nu(x);
    const rows: string[][] = [];
    for (let j = W - 1; j >= 0; j--) {
      const region = j < p ? "자리 p 아래" : j === p ? "자리 p" : "자리 p 위";
      rows.push([
        `자리 ${j}`,
        region,
        String(bitAt(x, j)),
        String(bitAt(-x, j)),
        String(bitAt(lowestSetBit(x), j)),
      ]);
    }
    return [
      `x = ${x} 의 자리마다 (p = ${p})`,
      table(["", "구간", "x", "-x", "x & -x"], rows, ["l", "l", "r", "r", "r"]),
      "",
      "└ 자리 p 아래는 x 가 0 이라 AND 가 0 이고, 자리 p 위는 두 값이 서로 반대라 AND 가 0 이다.",
      "  자리 p 한 줄만 두 값이 함께 1 이다",
    ].join("\n");
  },

  /** `deep.build` ② — 자리마다 검사하는 방법의 비용이 자리 번호를 따라간다. */
  costScan: () => {
    const rows = [0, 1, 2, 3, 15, 30, 31].map((p) => {
      const x = p === 31 ? INT32_MIN : 2 ** p;
      const got = scanEachBit(x);
      if (got.answer !== lowestSetBit(x)) {
        throw new Error(`자리 ${p} 에서 두 방법의 답이 다르다`);
      }
      return [
        String(p),
        num(x),
        num(got.ops),
        num(scanClosed(p)),
        num(REF_OPS),
        (got.ops / REF_OPS).toFixed(1),
      ];
    });
    const zero = scanEachBit(0);
    return [
      "1 비트가 자리 p 하나뿐인 입력에서 두 방법의 기본 연산 수",
      table(
        ["자리 p", "x", "자리마다 검사", "5p + 6", "정본", "몇 배인가"],
        rows,
        ["r", "r", "r", "r", "r", "r"],
      ),
      "",
      `x = 0 은 1 비트가 없어 자리 31 까지 다 검사한다 — ${num(zero.ops)} 번이고 정본은 ${num(REF_OPS)} 번이다`,
      "",
      "└ 셋째 열과 넷째 열이 일곱 줄 모두 같아서 닫힌 형태가 실측과 어긋나지 않는다.",
      "  다섯째 열은 자리 번호와 무관하게 2 로 고정된다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 호출 수를 두 입력 모양으로 재서 계수를 나란히 놓는다. */
  costTwoShapes: () => {
    let sequential = 0;
    let sumNu = 0;
    for (let x = 1; x <= CALLS; x++) {
      sequential += scanEachBit(x).ops;
      sumNu += nu(x);
    }
    const worstOne = scanEachBit(INT32_MIN).ops;
    const rows = [
      [
        `1 부터 ${num(CALLS)} 까지의 정수`,
        num(sequential),
        num(REF_OPS * CALLS),
        (sequential / (REF_OPS * CALLS)).toFixed(1),
      ],
      [
        `${num(INT32_MIN)} 만 ${num(CALLS)} 번`,
        num(worstOne * CALLS),
        num(REF_OPS * CALLS),
        ((worstOne * CALLS) / (REF_OPS * CALLS)).toFixed(1),
      ],
    ];
    return [
      `호출을 ${num(CALLS)} 번 하되 넣는 값의 모양만 바꾼다`,
      table(["무엇을 넣는가", "자리마다 검사", "정본", "몇 배인가"], rows, [
        "l",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 둘째 열은 입력 모양에 따라",
      `  ${num(sequential)} 에서 ${num(worstOne * CALLS)} 까지 ${(
        (worstOne * CALLS) / sequential
      ).toFixed(1)} 배 갈리는데 셋째 열은 두 줄이 같다.`,
      `  자리 수의 합은 ${num(sumNu)} 이고 그것이 둘째 열 첫 줄을 정한다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 후보 여섯 식을 같은 입력에 실행해 셋을 반박한다. */
  maskCandidates: () => {
    const rows = CANDIDATES.map(({ name, ops, f }) => {
      const values = PROBE.map((x) => f(x));
      let same = true;
      for (let x = 0; x < SWEEP; x++) {
        if (f(x) !== lowestSetBit(x)) {
          same = false;
          break;
        }
      }
      return [
        name,
        String(ops),
        ...values.map(String),
        same ? "전부 같다" : "다르다",
      ];
    });
    return [
      `후보 식을 ${PROBE.length} 개 입력에 실행한 값 (맨 아래 줄이 옳은 답이다)`,
      table(
        [
          "식",
          "연산 수",
          ...PROBE.map((x) => `x = ${x}`),
          `0 이상 ${num(SWEEP)} 미만 전수`,
        ],
        [
          ...rows,
          ["옳은 답", "—", ...PROBE.map((x) => String(lowestSetBit(x))), "—"],
        ],
        ["l", "r", "r", "r", "r", "r", "r", "l"],
      ),
      "",
      "└ 마지막 열이 「전부 같다」인 식은 셋이고, 그중 연산 수가 가장 적은 것은 x & -x 다.",
      "  위의 세 식은 이 다섯 입력 중 x = 0 에서만 답과 겹치고 나머지에서 갈린다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 자리 0 부터 31 까지 전부와 전수 대조. */
  allPositions: () => {
    const rows: string[][] = [];
    for (const p of [0, 1, 3, 7, 15, 23, 30, 31]) {
      const x = p === 31 ? INT32_MIN : 2 ** p;
      rows.push([
        String(p),
        num(x),
        num(lowestSetBit(x)),
        num((2 ** p) | 0),
        String(REF_OPS),
      ]);
    }
    let match = 0;
    for (let x = 0; x < SWEEP; x++) {
      const want = x === 0 ? 0 : 2 ** nu(x);
      if (lowestSetBit(x) === want) match++;
    }
    let signedMatch = 0;
    for (let p = 0; p < 32; p++) {
      const x = p === 31 ? INT32_MIN : -(2 ** p);
      if (lowestSetBit(x) === lowestSetBit(-x) || x === INT32_MIN)
        signedMatch++;
    }
    return [
      "1 비트가 자리 p 하나뿐인 입력에서",
      table(
        [
          "자리 p",
          "x",
          "정본이 낸 답",
          "2^p 를 32 비트로 적은 값",
          "정본의 기본 연산",
        ],
        rows,
        ["r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["전수 대조", "일치한 값", "전체", "정본의 기본 연산"],
        [
          [
            `0 이상 ${num(SWEEP)} 미만`,
            num(match),
            num(SWEEP),
            `어느 값에서도 ${REF_OPS}`,
          ],
          [
            "부호를 뒤집은 자리 0~31",
            num(signedMatch),
            "32",
            `어느 값에서도 ${REF_OPS}`,
          ],
        ],
        ["l", "r", "r", "l"],
      ),
      "",
      "└ 셋째 열과 넷째 열이 여덟 줄 모두 같고, 아래 표는 값을 하나도 빠뜨리지 않았다는 것이다.",
      "  자리 31 만 십진값이 음수인데, 그 자리가 32 비트 정수의 부호 비트이기 때문이다.",
      "  마지막 열은 자리 번호가 0 이든 31 이든 안 바뀐다",
    ].join("\n");
  },

  /** `deep.walk` 1단계 — 자리를 뒤집은 결과. */
  walkFlip: () => {
    const x = WALK_INPUT;
    const rows = [
      ["x", bits(x), String(x)],
      ["뒤집은 값", bits(~x), String(~x)],
    ];
    const p = nu(x);
    return [
      table(["", "아래 여덟 자리", "십진"], rows, ["l", "r", "r"]),
      "",
      `└ 자리 ${p} 아래(자리 0·1·2)가 전부 1 이 되고 자리 ${p} 자신은 0 이 됐다.`,
      "  x 에서 그 아래가 전부 0 이었으므로 뒤집으면 전부 1 이 된다",
    ].join("\n");
  },

  /** `deep.walk` 3단계 — 걸음마다의 상태값. */
  walkTrace: () => {
    const rows = trace(WALK_INPUT).map((s) => [
      s.label,
      s.branch,
      s.digit,
      s.carry,
      s.settled,
      s.negated,
      s.result,
    ]);
    return [
      table(
        [
          "걸음",
          "갈래",
          "더하는 자리",
          "자리올림",
          "정해진 아래 자리",
          "-x",
          "x & -x",
        ],
        rows,
        ["l", "l", "l", "l", "r", "r", "r"],
      ),
      "",
      `└ 답은 ${lowestSetBit(WALK_INPUT)} 다. 자리올림이 자리 0·1·2 를 지나 자리 ${nu(WALK_INPUT)} 에서 0 이 되고,`,
      "  그 위 자리는 뒤집은 값 그대로 남는다",
    ].join("\n");
  },

  /** 멈춤 1 — 「x & (x - 1) 이 최하위 1 비트를 준다」는 오해를 반박한다. */
  pauseClearVsKeep: () => {
    const rows = SAMPLES.map((x) => {
      const right = lowestSetBit(x);
      const wrong = x & (x - 1);
      return [
        label(x),
        bits(x),
        String(right),
        String(wrong),
        right === wrong ? "같다" : "다르다",
      ];
    });
    return [
      table(
        ["x", "x 의 자리", "정본이 낸 답", "오해대로 적은 식이 낸 값", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ x 가 0 인 다섯째 줄에서만 두 값이 같다. 그때는 1 을 뺀 값이 -1 이라 모든 자리가",
      "  1 인데 0 과 AND 하면 어느 식이든 0 이 나온다. 나머지 다섯 줄은 답과 갈린다",
    ].join("\n");
  },

  /** 멈춤 1 — 지운 값을 빼면 남긴 값이 나온다. */
  pauseClearVsKeepFix: () => {
    const rows = SAMPLES.map((x) => [
      label(x),
      String(x & (x - 1)),
      String(x ^ (x & (x - 1))),
      String(lowestSetBit(x)),
      (x ^ (x & (x - 1))) === lowestSetBit(x) ? "같다" : "다르다",
    ]);
    return [
      table(
        ["x", "지운 값", "지운 값을 x 에서 덜어 낸 것", "정본이 낸 답", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 셋째 열과 넷째 열이 여섯 줄 모두 같다. 지우는 식과 남기는 식은 서로의 여집합이고,",
      "  한쪽에서 다른 쪽을 얻으려면 연산이 하나 더 든다",
    ].join("\n");
  },

  /** 멈춤 2 — 제약 안에 답이 음수인 입력이 하나 있다. */
  pauseNegative: () => {
    const abs = (x: number): number => {
      const r = lowestSetBit(x);
      return r < 0 ? -r : r;
    };
    const rows: string[][] = [];
    for (const [name, x] of EDGES) {
      const right = lowestSetBit(x);
      const wrong = abs(x);
      rows.push([
        name,
        num(x),
        num(right),
        num(wrong),
        right === wrong ? "같다" : "다르다",
      ]);
    }
    let negatives = 0;
    for (let p = 0; p < 32; p++) {
      const x = p === 31 ? INT32_MIN : 2 ** p;
      if (lowestSetBit(x) < 0) negatives++;
    }
    return [
      table(
        ["경계", "x", "정본이 낸 답", "부호를 뒤집어 낸 값", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      `└ 1 비트가 자리 p 하나뿐인 입력 32 개 중 답이 음수인 것은 ${negatives} 개이고 자리 31 이다.`,
      `  그 자리의 값 ${num(2 ** 31)} 은 32 비트 부호 있는 정수로 ${num(INT32_MIN)} 이므로,`,
      "  부호를 뒤집은 값은 이 계약이 담을 수 있는 값이 아니다",
    ].join("\n");
  },

  /** `related` — 부호를 뒤집은 값이 2^32 에서 뺀 값과 같다. */
  relatedModulo: () => {
    const rows = SAMPLES.map((x) => {
      const u = x >>> 0;
      const neg = -x >>> 0;
      const mod = (2 ** 32 - u) % 2 ** 32;
      return [
        String(x),
        num(u),
        num(neg),
        num(mod),
        neg === mod ? "같다" : "다르다",
      ];
    });
    return [
      "32 비트 부호 없는 값으로 읽으면",
      table(
        [
          "x (32 비트 정수)",
          "x (부호 없는 값)",
          "-x (부호 없는 값)",
          "2^32 - x",
          "판정",
        ],
        rows,
        ["r", "r", "r", "r", "l"],
      ),
      "",
      "└ 셋째 열과 넷째 열이 여섯 줄 모두 같다. x 가 0 인 줄은 2^32 를 2^32 로 나눈 나머지가",
      "  0 이라 그 자리도 맞는다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const rows = [WALK_INPUT, 12, 1, 1024, 0].map((x) => [
      num(x),
      x === 0 ? "없다" : String(nu(x)),
      x === 0 ? "0" : num(2 ** nu(x)),
      num(lowestSetBit(x)),
    ]);
    const sums = [8, 10, 100, 1000].map((n) => {
      let total = 0;
      for (let x = 1; x <= n; x++) total += nu(x);
      return [num(n), num(total), num(s2(n)), num(n - s2(n))];
    });
    return [
      "정의를 값에 넣으면",
      table(["x", "ν(x)", "2^ν(x)", "정본이 낸 답"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "1 부터 N 까지의 ν 를 실제로 더하면",
      table(["N", "Σ ν(x)", "s₂(N)", "N − s₂(N)"], sums, ["r", "r", "r", "r"]),
      "",
      "└ 위 표의 셋째 열과 넷째 열이 다섯 줄 모두 같고, 아래 표의 둘째 열과 넷째 열이",
      "  네 줄 모두 같다",
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태에 제약 규모를 넣어 계수를 낸다. */
  mathScale: () => {
    const sumNu = CALLS - s2(CALLS);
    const seq = 5 * sumNu + 6 * CALLS;
    const worst = scanClosed(31) * CALLS;
    const ref = REF_OPS * CALLS;
    return [
      `호출 ${num(CALLS)} 번을 닫힌 형태로 계산하면`,
      table(
        ["무엇", "식", "값"],
        [
          [
            "자리 수의 합",
            `N − s₂(N) = ${num(CALLS)} − ${s2(CALLS)}`,
            num(sumNu),
          ],
          ["자리 수의 평균", "(N − s₂(N)) / N", (sumNu / CALLS).toFixed(6)],
          ["1 부터 N 까지 넣었을 때", "5(N − s₂(N)) + 6N", num(seq)],
          ["최악 입력만 N 번 넣었을 때", "(5·31 + 6) N", num(worst)],
          ["정본", "2N", num(ref)],
        ],
        ["l", "l", "r"],
      ),
      "",
      table(
        ["견주는 자리", "자리마다 검사", "정본", "몇 배인가"],
        [
          ["1 부터 N 까지", num(seq), num(ref), (seq / ref).toFixed(1)],
          ["최악 입력만 N 번", num(worst), num(ref), (worst / ref).toFixed(1)],
        ],
        ["l", "r", "r", "r"],
      ),
      "",
      `└ 자리 수의 평균이 1 에 가까워서 1 부터 N 까지 넣으면 ${(seq / ref).toFixed(1)} 배에 그치는데,`,
      `  최악 입력만 넣으면 ${(worst / ref).toFixed(1)} 배가 된다. 정본은 두 줄이 같은 값이다`,
    ].join("\n");
  },

  /** `invariant` ② — 세 구간에서 불변식이 유지되는 것을 상태값으로 본다. */
  invariantRanges: () => {
    const x = WALK_INPUT;
    const p = nu(x);
    const rows: string[][] = [];
    for (let j = W - 1; j >= 0; j--) {
      const region = j < p ? "아래" : j === p ? "자리 p" : "위";
      const want = j < p ? 0 : j === p ? 1 : 1 - bitAt(x, j);
      rows.push([
        `자리 ${j}`,
        region,
        String(bitAt(x, j)),
        String(bitAt(-x, j)),
        String(want),
        bitAt(-x, j) === want ? "맞다" : "다르다",
      ]);
    }
    return [
      `x = ${x} 에서 (p = ${p})`,
      table(
        ["", "구간", "x 의 비트", "-x 의 비트", "불변식이 말하는 값", "판정"],
        rows,
        ["l", "l", "r", "r", "r", "l"],
      ),
      "",
      "└ 넷째 열과 다섯째 열이 여덟 줄 모두 같다. 아래 구간은 0, 자리 p 는 1,",
      "  위 구간은 셋째 열의 반대다",
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력들. */
  invariantEdges: () => {
    const rows = EDGES.map(([name, x]) => {
      const want = x === 0 ? 0 : (2 ** nu(x)) | 0;
      const got = lowestSetBit(x);
      return [
        name,
        num(x),
        x === 0 ? "없다" : String(nu(x)),
        num(want),
        num(got),
        want === got ? "같다" : "다르다",
      ];
    });
    return [
      table(["경계", "x", "p", "정의가 낸 답", "정본이 낸 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 여덟 줄 모두 같다. 값이 0 인 줄은 1 비트가 없어 p 가 정의되지 않는데,",
      "  그 자리에서 정본은 막는 줄 없이 0 을 낸다",
    ].join("\n");
  },

  /** `invariant` ③ — 1 을 안 더한 변이가 내는 값. */
  mutantNoCarry: () => {
    const rows = EDGES.map(([name, x]) => {
      const right = lowestSetBit(x);
      const wrong = noCarry.lowestSetBit(x);
      return [
        name,
        num(x),
        num(right),
        num(wrong),
        right === wrong ? "같다" : "다르다",
      ];
    });
    return [
      table(
        ["경계", "x", "정본이 낸 답", "1 을 안 더한 판이 낸 답", "판정"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 값이 0 인 줄에서만 두 값이 같다. 1 을 안 더하면 뒤집은 값이 모든 자리에서",
      "  x 의 반대라 함께 1 인 자리가 하나도 없고, 어떤 입력에서도 0 이 나온다",
    ].join("\n");
  },

  /** `perf.derive` — 걸음을 무리로 나눠 기본 연산을 센다. */
  perfCount: () => {
    const steps = trace(WALK_INPUT);
    const flipEnd = steps.filter((s) => s.branch.startsWith("②")).length;
    const rows = [
      ["입력을 읽는다", "T1", "1", "0", "0", "0"],
      [
        "-x 를 만든다",
        `T2 부터 T${2 + flipEnd} 까지`,
        String(1 + flipEnd),
        "1",
        "0",
        "1",
      ],
      ["두 값을 AND 한다", `T${3 + flipEnd}`, "1", "0", "1", "1"],
      ["값을 돌려준다", `T${4 + flipEnd}`, "1", "0", "0", "0"],
      ["합계", "", String(steps.length), "1", "1", String(REF_OPS)],
    ];
    return [
      table(
        [
          "무리",
          "어느 걸음인가",
          "걸음 수",
          "부호 뒤집기",
          "비트 AND",
          "기본 연산",
        ],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 걸음은 ${steps.length} 개인데 기본 연산은 ${REF_OPS} 개다. 자리마다의 덧셈은 한 연산 안에서`,
      "  일어나는 일이라 걸음 수가 늘어도 연산 수가 안 늘어난다",
    ].join("\n");
  },

  /** `perf.worst` — 입력 모양을 바꿔도 정본의 계수가 안 바뀐다. */
  worstShape: () => {
    const shapes: [string, number][] = [
      ["값이 0 이다", 0],
      ["1 비트가 자리 0 에 있다", 1],
      ["1 비트가 자리 31 에 있다", INT32_MIN],
      ["1 비트가 서른두 자리에 다 있다", -1],
      ["제약의 위쪽 끝이다", INT32_MAX],
      ["자리 30 하나뿐이다", 2 ** 30],
      ["전개 입력이다", WALK_INPUT],
    ];
    const rows = shapes.map(([name, x]) => {
      const scan = scanEachBit(x);
      return [
        name,
        num(x),
        x === 0 ? "없다" : String(nu(x)),
        num(REF_OPS),
        num(scan.ops),
        num(lowestSetBit(x)),
      ];
    });
    const ops = shapes.map(([, x]) => scanEachBit(x).ops);
    return [
      table(
        ["입력의 모양", "x", "p", "정본의 기본 연산", "자리마다 검사", "답"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ 넷째 열이 일곱 줄 모두 ${REF_OPS} 다. 다섯째 열은 ${num(Math.min(...ops))} 에서 ${num(Math.max(...ops))} 까지 갈리는데,`,
      "  그것을 정하는 것은 값의 크기도 1 비트의 개수도 아니라 셋째 열이다.",
      "  1 비트가 하나도 없는 첫 줄만 자리 31 까지 다 검사해 가장 크다",
    ].join("\n");
  },

  /** `selfcheck` — 자리올림이 멈춘 뒤의 자리들이 왜 답에 안 남는가. */
  checkAbove: () => {
    const x = WALK_INPUT;
    const p = nu(x);
    const rows: string[][] = [];
    for (let j = W - 1; j > p; j--) {
      rows.push([
        `자리 ${j}`,
        String(bitAt(x, j)),
        String(bitAt(~x, j)),
        String(bitAt(-x, j)),
        String(bitAt(x, j) & bitAt(-x, j)),
      ]);
    }
    return [
      `자리 ${p} 위의 자리만 따로 (x = ${x})`,
      table(["", "x 의 비트", "뒤집은 비트", "-x 의 비트", "AND"], rows, [
        "l",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 셋째 열과 넷째 열이 네 줄 모두 같다 — 자리올림이 0 이 된 뒤라 더한 것이 없다.",
      "  둘째 열과 넷째 열은 네 줄 모두 반대라 마지막 열이 전부 0 이다",
    ].join("\n");
  },
};
