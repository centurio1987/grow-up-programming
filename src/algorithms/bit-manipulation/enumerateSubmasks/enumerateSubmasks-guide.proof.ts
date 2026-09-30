/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.md
 *
 * **걸음을 세는 사본이 있다.** 정본은 바퀴마다의 `sub` · `borrowed` · `next` 를 내보내지 않으므로,
 * 같은 절차에 기록만 덧붙인 사본(`trace`)이 걸음 값을 낸다. **답이 맞는지는 사본이 아니라 정본이
 * 진다** — 사본이 담은 값의 열이 정본의 반환값과 글자 그대로 같은지를 `trace` 가 부를 때마다 확인한다.
 * 그림 사이드카(`.fig.tsx`)와 걸음 재생 패널도 이 `trace` 를 쓴다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 가 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가
 * 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과
 * **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { enumerateSubmasks } from "./enumerateSubmasks-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 한 자리. */
const fixed1 = (x: number): string =>
  x.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** 초 단위 — 초당 단순 연산 1 억 번 기준. 0.01 초보다 작으면 그렇게 적는다. */
const seconds = (ops: number): string => {
  const s = ops / 1e8;
  return s < 0.01
    ? "0.01 초 미만"
    : `${s.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 초`;
};

/**
 * 고정 폭 이진 표기에 아래 첨자 ₂ 를 붙인다. 비트 연산을 쓰지 않아 32 비트 자르기와 무관하다.
 * 자리를 세는 글이라 한 표 안에서는 폭을 바꾸지 않는다.
 */
export function bits(value: number, w: number): string {
  let out = "";
  for (let i = w - 1; i >= 0; i--) {
    out += Math.floor(value / 2 ** i) % 2 === 1 ? "1" : "0";
  }
  return `${out}₂`;
}

/** 마크다운 표. 수가 든 열은 오른쪽 정렬(`---:`)이다. */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  const rule = `| ${head.map((_, c) => (align[c] === "r" ? "---:" : "---")).join(" | ")} |`;
  return [line(head), rule, ...rows.map(line)].join("\n");
}

/** 값 목록. 쉼표로 잇고 대괄호로 싼다. */
const arr = (xs: number[]): string => `[${xs.join(", ")}]`;

/** 수 목록. 가운뎃점으로 잇는다. 비면 「없음」. */
const dots = (xs: number[]): string =>
  xs.length === 0 ? "없음" : xs.join(" · ");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * `0b1011` 을 고른 이유는 **자리 2 가 비어 있기** 때문이다. 그 구멍이 있어야 `& mask` 가 실제로 값을
 * 바꾸는 걸음이 생긴다 — `0b111` 처럼 구멍 없는 마스크에서는 여덟 걸음 내내 AND 가 아무것도 지우지
 * 않는다. 최하위 비트가 1 이라 자리내림이 한 자리에서 끝나는 걸음과 여러 자리를 지나가는 걸음이 둘 다
 * 나온다.
 */
export const WALK = 0b1011;

/** 전개 입력의 비트 폭. 이진 표기를 이 폭으로 고정한다. */
export const WALK_WIDTH = 4;

/** 과제의 상한. `0 ≤ mask ≤ 2^20` 이다. */
const LIMIT = 2 ** 20;

/* ────────────────────────── 계측기 ────────────────────────── */

/** `mask` 의 1 비트 개수. 비트 연산을 쓰지 않고 세어 32 비트 자르기와 무관하게 둔다. */
export function popcount(mask: number): number {
  let count = 0;
  for (let m = mask; m > 0; m = Math.floor(m / 2)) count += m % 2;
  return count;
}

/** `mask` 의 비트 폭 — 최상위 1 비트의 자리 번호에 1 을 더한 값. `mask = 0` 이면 0 이다. */
function bitWidth(mask: number): number {
  let w = 0;
  for (let m = mask; m > 0; m = Math.floor(m / 2)) w++;
  return w;
}

/** 자리 `i` 의 비트. */
export const bitAt = (value: number, i: number): 0 | 1 =>
  Math.floor(value / 2 ** i) % 2 === 1 ? 1 : 0;

/** 1 인 자리를 낮은 자리부터. */
export function onePlaces(value: number): number[] {
  const out: number[] = [];
  for (let m = value, i = 0; m > 0; m = Math.floor(m / 2), i++) {
    if (m % 2 === 1) out.push(i);
  }
  return out;
}

/**
 * **정의를 그대로 옮긴 답.** `mask` 의 1 비트 자리를 모아 두고 그 부분집합을 전부 만든다. 비트 연산을
 * 쓰지 않아 32 비트 자르기의 영향을 받지 않으므로, 32 비트 경계를 다루는 짚고 가기의 기준값이 된다.
 */
export function submasksByDefinition(mask: number): number[] {
  let out = [0];
  for (const i of onePlaces(mask)) {
    out = [...out, ...out.map((s) => s + 2 ** i)];
  }
  return out.sort((a, b) => b - a);
}

/** 정의대로 — `s` 가 `mask` 의 서브마스크인가. `s` 의 1 자리가 전부 `mask` 에도 1 이다. */
const isSubmask = (s: number, mask: number): boolean =>
  onePlaces(s).every((i) => bitAt(mask, i) === 1);

/**
 * `mask` 의 1 자리만 떼어 읽은 값. 서브마스크 `s` 의 비트를 `mask` 의 1 자리 순서대로 모아 `k` 자리
 * 이진수로 읽는다 — `mask = 1011₂` 에서 `s = 1001₂` 이면 자리 3 · 1 · 0 의 비트 1 · 0 · 1 이라 `101₂` 다.
 */
export function packed(s: number, mask: number): number {
  let out = 0;
  for (const [j, i] of onePlaces(mask).entries()) out += bitAt(s, i) * 2 ** j;
  return out;
}

/** 정수를 하나씩 검사하는 방법. `deep.origin` 이 세우는 가장 단순한 방법이다. */
function scanEveryInteger(mask: number): number[] {
  const out: number[] = [];
  for (let candidate = mask; candidate > 0; candidate--) {
    if ((mask & candidate) === candidate) out.push(candidate);
  }
  out.push(0);
  return out;
}

/** 정수를 하나씩 검사하는 방법이 검사하는 정수 수. `candidate` 가 `mask` 부터 1 까지 내려간다. */
const scanChecks = (mask: number): number => mask;

/** 1 을 빼고 거르기의 바퀴 수. 담은 값이 `2^k` 개이고 첫 칸은 바퀴 밖에서 담는다. */
export const trickLoops = (mask: number): number =>
  enumerateSubmasks(mask).length - 1;

/** 최하위 1 비트만 지우는 후보 — `sub & (sub - 1)` 이다. */
function clearLowestOnly(mask: number): number[] {
  const out = [mask];
  let sub = mask;
  while (sub > 0) {
    const next = sub & (sub - 1);
    out.push(next);
    sub = next;
  }
  return out;
}

/**
 * **종료 조건을 `sub >= 0` 으로 적은 사본.** 0 다음에 `(0 - 1) & mask` 가 `mask` 를 내 반복이 끝나지
 * 않는다. 담은 값 수에 상한을 두어 앞부분만 본다.
 */
function neverEnding(mask: number, cap: number): number[] {
  const out = [mask];
  let sub = mask;
  while (sub >= 0 && out.length < cap) {
    const next = (sub - 1) & mask;
    out.push(next);
    sub = next;
  }
  return out;
}

/** 오름차순으로 도는 Carry-Rippler — 빈 집합에서 출발해 `(subset - mask) & mask` 로 다음 값을 만든다. */
function carryRippler(mask: number): number[] {
  const out: number[] = [];
  let subset = 0;
  for (;;) {
    out.push(subset);
    subset = (subset - mask) & mask;
    if (subset === 0) break;
  }
  return out;
}

/** 모든 `n` 비트 마스크에 대해 두 방법이 도는 횟수의 합. 식은 아래 두 줄 주석, 작은 `n` 은 실측과 맞춘다. */
function totalOverAllMasks(n: number): { scan: number; trick: number } {
  const size = 2 ** n;
  // 정수를 하나씩 검사하면 마스크 m 마다 m 번이다 — 0 부터 size - 1 까지의 합이다.
  const scan = (size * (size - 1)) / 2;
  // 1 을 빼고 거르기는 마스크 m 마다 2^popcount(m) - 1 바퀴다 — 전부 더하면 3^n - 2^n 이다.
  const trick = 3 ** n - size;
  if (n <= 12) {
    let s = 0;
    let t = 0;
    for (let m = 0; m < size; m++) {
      s += scanChecks(m);
      t += trickLoops(m);
    }
    if (s !== scan || t !== trick) {
      throw new Error(`n = ${n} 에서 합의 식이 실측과 다르다`);
    }
  }
  return { scan, trick };
}

/* ────────────────────────── 걸음 추적 ────────────────────────── */

/** 바퀴 하나의 기록. */
export interface Round {
  /** 걸음 번호. T1 이 준비이므로 첫 바퀴는 T2 다. */
  readonly t: number;
  /** 바퀴를 시작할 때의 `sub`. */
  readonly sub: number;
  /** 최하위 1 비트의 자리. */
  readonly p: number;
  readonly borrowed: number;
  readonly next: number;
  /** `& mask` 가 지운 자리 — `borrowed` 에서 1 이고 `mask` 에서 0 인 자리. */
  readonly cleared: number[];
  /** 이 바퀴가 담은 뒤의 결과 배열. 큰 마스크에서는 길이만 남기고 배열은 비운다. */
  readonly subMasks: number[];
  /** 이 바퀴가 담은 뒤의 결과 배열 길이. */
  readonly size: number;
}

export interface Trace {
  readonly mask: number;
  readonly rounds: Round[];
  /** 마지막 걸음(종료 검사)의 번호. */
  readonly endT: number;
  readonly answer: number[];
}

/**
 * 정본과 같은 절차에 기록만 덧붙인 사본. 담은 값의 열이 정본의 반환값과 다르면 던진다 — 걸음 값이
 * 정본과 다른 것을 그리지 않게.
 */
export function trace(mask: number): Trace {
  const subMasks = [mask];
  const rounds: Round[] = [];
  const keep = mask < 2 ** 8;
  let sub = mask;
  let t = 1;
  while (sub > 0) {
    t++;
    let p = 0;
    while (bitAt(sub, p) === 0) p++;
    const borrowed = sub - 1;
    const next = borrowed & mask;
    subMasks.push(next);
    rounds.push({
      t,
      sub,
      p,
      borrowed,
      next,
      cleared: keep
        ? onePlaces(borrowed).filter((i) => bitAt(mask, i) === 0)
        : borrowed === next
          ? []
          : [-1],
      subMasks: keep ? [...subMasks] : [],
      size: subMasks.length,
    });
    sub = next;
  }
  const answer = enumerateSubmasks(mask);
  if (answer.join(",") !== subMasks.join(",")) {
    throw new Error(`mask = ${mask} 에서 세는 사본이 정본과 다른 값을 담았다`);
  }
  return { mask, rounds, endT: t + 1, answer };
}

/** 전개 입력의 걸음. */
export const T = trace(WALK);

/* ────────────────────────── 자기 대조 ────────────────────────── */

function 자기대조(): void {
  for (let mask = 0; mask < 2 ** 12; mask++) {
    const got = enumerateSubmasks(mask);
    if (got.join(",") !== submasksByDefinition(mask).join(",")) {
      throw new Error(`정본이 정의와 다르다 — mask=${mask}`);
    }
    if (got.join(",") !== scanEveryInteger(mask).join(",")) {
      throw new Error(
        `정수를 하나씩 검사하는 방법이 정본과 다르다 — mask=${mask}`,
      );
    }
    if (
      mask > 0 &&
      [...carryRippler(mask)].sort((a, b) => b - a).join(",") !== got.join(",")
    ) {
      throw new Error(`Carry-Rippler 가 같은 값을 안 냈다 — mask=${mask}`);
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { enumerateSubmasks: (mask: number) => number[] };

const REF = new URL("./enumerateSubmasks-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * **`mask` 로 거르던 줄을 없앤 사본** — `next` 가 `borrowed` 그대로가 된다. 불변식의 서브마스크
 * 조건을 유지하던 바로 그 줄이다. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면
 * `loadMutant` 가 던진다.
 */
const noMask = await loadMutant<Impl>(REF, {
  swap: [/const next = borrowed & mask;/, "const next = borrowed;"],
});

/** 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이가 적용되지 않았다. */
const 중화됨 = noMask.enumerateSubmasks === enumerateSubmasks;

/** 변이가 갈리는 자리와 안 갈리는 자리를 함께 담은 목록. */
const NO_MASK_MASKS = [WALK, 0b101, 0b111, 1, 0];

if (!중화됨) {
  const same = NO_MASK_MASKS.every(
    (m) =>
      enumerateSubmasks(m).join(",") === noMask.enumerateSubmasks(m).join(","),
  );
  if (same)
    throw new Error(
      "거르는 줄을 없앤 변이가 어느 입력에서도 답을 바꾸지 못했다",
    );
}

/* ────────────────────────── 사례 목록 ────────────────────────── */

const label = (mask: number): string =>
  mask === WALK
    ? `전개 입력 ${mask} (${bits(mask, WALK_WIDTH)})`
    : `${num(mask)} (${bits(mask, Math.max(bitWidth(mask), 1))})`;

/** 두 방법이 도는 횟수가 갈리는 자리와 같아지는 자리를 함께 담은 목록. */
const SCALE_MASKS = [WALK, 0b1000, 2 ** 10, LIMIT, LIMIT - 1];

/** 걸음 수가 출력 크기를 따라간다는 것을 보이는 목록. `k` 를 0 부터 20 까지 넓힌다. */
const OUTPUT_MASKS = [0, 1, WALK, 0b10101010, 699_050, LIMIT - 1];

/** 한 걸음을 세 줄로 — `sub` · `sub - 1` · `& mask`. */
function stepLines(sub: number, mask: number, w: number): string[] {
  const rows: [string, number][] = [
    ["sub", sub],
    ["sub - 1", sub - 1],
    [`(sub - 1) & ${mask}`, (sub - 1) & mask],
  ];
  const pad = Math.max(...rows.map(([name]) => name.length));
  return rows.map(
    ([name, v]) =>
      `${name.padEnd(pad)}  = ${String(v).padStart(2)} = ${bits(v, w)}`,
  );
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 한 걸음이 하는 일. */
  "concept-step": () => stepLines(8, WALK, WALK_WIDTH).join("\n"),

  /** `concept` — 두 방법이 도는 횟수. */
  "concept-cost": () => {
    const rows = [WALK, LIMIT, LIMIT - 1].map((mask) => [
      label(mask),
      String(popcount(mask)),
      num(enumerateSubmasks(mask).length),
      num(scanChecks(mask)),
      num(trickLoops(mask)),
    ]);
    return table(
      [
        "mask",
        "1 비트 개수 k",
        "서브마스크 개수",
        "정수를 하나씩 검사하기의 검사",
        "1 을 빼고 거르기의 바퀴",
      ],
      rows,
      ["l", "r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ② — 정수를 하나씩 검사하는 방법을 규모에서 반박한다. */
  "origin-naive-cost": () => {
    const rows = SCALE_MASKS.map((mask) => [
      label(mask),
      String(popcount(mask)),
      num(scanChecks(mask)),
      num(enumerateSubmasks(mask).length),
      fixed1(scanChecks(mask) / enumerateSubmasks(mask).length),
    ]);
    const totals = [4, 8, 12, 16, 20].map((n) => {
      const t = totalOverAllMasks(n);
      return [String(n), num(2 ** n), num(t.scan), seconds(t.scan)];
    });
    const worst = totalOverAllMasks(20).scan;
    return [
      table(
        [
          "mask",
          "1 비트 개수 k",
          "검사한 정수",
          "서브마스크",
          "서브마스크 하나당 검사",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `넷째 줄은 서브마스크 ${enumerateSubmasks(LIMIT).length} 개를 내려고 정수 ${num(scanChecks(LIMIT))} 개를 검사합니다. 비트마스크 동적 계획법처럼 n 비트 마스크 전부에 부르면 검사 횟수의 합은 이렇습니다.`,
      "",
      table(
        ["n", "마스크 개수 2^n", "검사한 정수(합)", "초당 1 억 번 기준"],
        totals,
        ["r", "r", "r", "r"],
      ),
      "",
      `n = 20 이면 검사가 ${num(worst)} 번이라 ${seconds(worst)}가 걸립니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 검사한 정수 가운데 버린 것. */
  "origin-waste": () => {
    const checked = Array.from({ length: WALK }, (_, j) => WALK - j);
    const kept = checked.filter((c) => (c & WALK) === c);
    const dropped = checked.filter((c) => (c & WALK) !== c);
    const holes = [0, 1, 2, 3].filter((i) => bitAt(WALK, i) === 0);
    const everyHasHole = dropped.every((c) =>
      holes.some((i) => bitAt(c, i) === 1),
    );
    if (!everyHasHole) throw new Error("버린 정수가 mask 밖 자리를 안 켰다");
    return [
      table(
        ["무리", "정수", "개수"],
        [
          ["검사한 정수", dots(checked), String(checked.length)],
          ["서브마스크였던 정수", dots(kept), String(kept.length)],
          ["버린 정수", dots(dropped), String(dropped.length)],
        ],
        ["l", "l", "r"],
      ),
      "",
      `버린 ${dropped.length} 개는 모두 자리 ${dots(holes)}${이가(holes.at(-1) as number)} 1 이고, mask = ${bits(WALK, WALK_WIDTH)} 의 자리 ${dots(holes)}${은는X(holes)} 0 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 이웃한 서브마스크의 차. */
  "origin-gaps": () => {
    const s = enumerateSubmasks(WALK);
    const rows = s.slice(0, -1).map((a, j) => {
      const b = s[j + 1] as number;
      return [
        `${a} (${bits(a, WALK_WIDTH)})`,
        `${b} (${bits(b, WALK_WIDTH)})`,
        String(a - b),
      ];
    });
    const jumps = s.slice(0, -1).flatMap((a, j) => {
      const b = s[j + 1] as number;
      return a - b !== 1 ? [[a, b] as const] : [];
    });
    const [ja, jb] = jumps[0] ?? [0, 0];
    const between = Array.from({ length: ja - jb - 1 }, (_, j) => jb + 1 + j);
    return [
      table(["서브마스크", "다음 서브마스크", "차"], rows, ["r", "r", "r"]),
      "",
      `차가 1 이 아닌 자리는 ${jumps.length} 곳이고, ${ja} 에서 ${jb}${으로(jb)} 가는 자리입니다. 그 사이의 ${dots(between)}${은는X(between)} 서브마스크가 아닙니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 최하위 1 비트만 지우는 후보를 반박한다. */
  "origin-clear-lowest": () => {
    const rows = [WALK, 0b111, 0b101, 0b1000, 1].map((mask) => {
      const right = enumerateSubmasks(mask);
      const cand = clearLowestOnly(mask);
      return [
        label(mask),
        arr(right),
        arr(cand),
        right.join(",") === cand.join(",") ? "같다" : "틀리다",
      ];
    });
    return table(
      ["mask", "서브마스크 전부", "최하위 1 비트만 지우기", "판정"],
      rows,
      ["l", "l", "l", "l"],
    );
  },

  /** `deep.origin` ⑤ — 8 에서 3 이 나오는 두 걸음을 자리마다. */
  "origin-eight-to-three": () => {
    const sub = 8;
    const places = [3, 2, 1, 0];
    const row = (name: string, v: number): string[] => [
      name,
      ...places.map((i) => String(bitAt(v, i))),
      String(v),
    ];
    return table(
      ["줄", ...places.map((i) => `자리 ${i}`), "값"],
      [
        row("mask", WALK),
        row("sub", sub),
        row("sub - 1", sub - 1),
        row("(sub - 1) & mask", (sub - 1) & WALK),
      ],
      ["l", "r", "r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ④ — 같은 마스크를 두 방법으로 처리한 횟수. */
  "origin-two-ways": () => {
    const rows = SCALE_MASKS.map((mask) => [
      label(mask),
      String(bitWidth(mask)),
      String(popcount(mask)),
      num(scanChecks(mask)),
      num(trickLoops(mask)),
    ]);
    const totals = [4, 8, 12, 16, 20].map((n) => {
      const t = totalOverAllMasks(n);
      return [
        String(n),
        num(t.scan),
        num(t.trick),
        fixed1(t.scan / t.trick),
        seconds(t.trick),
      ];
    });
    return [
      table(
        [
          "mask",
          "비트 폭 B",
          "1 비트 개수 k",
          "정수를 하나씩 검사하기",
          "1 을 빼고 거르기",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "n 비트 마스크 전부에 부르면 두 방법의 반복 횟수를 합한 값은 이렇습니다.",
      "",
      table(
        [
          "n",
          "정수를 하나씩 검사하기(합)",
          "1 을 빼고 거르기(합)",
          "배",
          "1 을 빼고 거르기(초당 1 억 번)",
        ],
        totals,
        ["r", "r", "r", "r", "r"],
      ),
      "",
    ]
      .join("\n")
      .replace(/\n$/, "");
  },

  /** `deep.origin` ④ — 두 방법이 같은 답을 내는가. */
  "origin-same-answer": () => {
    const masks = [WALK, 0b101, 0b1000, 1, 0];
    const rows = masks.map((mask) => {
      const right = enumerateSubmasks(mask);
      const scan = scanEveryInteger(mask);
      return [
        label(mask),
        arr(right),
        arr(scan),
        right.join(",") === scan.join(",") ? "같다" : "틀리다",
      ];
    });
    let checked = 0;
    for (let mask = 0; mask < 2 ** 12; mask++) {
      if (
        enumerateSubmasks(mask).join(",") === scanEveryInteger(mask).join(",")
      )
        checked++;
    }
    return [
      table(
        ["mask", "1 을 빼고 거르기", "정수를 하나씩 검사하기", "판정"],
        rows,
        ["l", "l", "l", "l"],
      ),
      "",
      `mask 를 0 부터 ${num(2 ** 12 - 1)} 까지 ${num(2 ** 12)} 개 전부 넣어도 두 방법이 같은 값을 같은 순서로 낸 것이 ${num(checked)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (c) — 서브마스크 하나를 읽는 법. */
  "build-read-one": () => {
    const s = 9;
    const places = onePlaces(s);
    const maskPlaces = [...onePlaces(WALK)].reverse();
    return table(
      ["읽는 순서", "값"],
      [
        ["서브마스크", `${s} = ${bits(s, WALK_WIDTH)}`],
        ["1 인 자리", dots(places)],
        ["나타내는 집합", `{${places.join(", ")}}`],
        ["서브마스크 조건", `${s} & ${WALK} = ${s & WALK}`],
        [
          `mask 의 1 자리 ${dots(maskPlaces)} 만 읽은 값`,
          `${maskPlaces.map((i) => bitAt(s, i)).join("")}₂ = ${packed(s, WALK)}`,
        ],
      ],
      ["l", "l"],
    );
  },

  /** `deep.build` 먼저 알아 둘 개념 (d) — 이웃한 서브마스크를 1 자리만 떼어 읽으면. */
  "build-counter": () => {
    const s = enumerateSubmasks(WALK);
    const k = popcount(WALK);
    const rows = s.map((v, j) => {
      const prev = s[j - 1];
      return [
        `${v} (${bits(v, WALK_WIDTH)})`,
        `${bits(packed(v, WALK), k)} = ${packed(v, WALK)}`,
        prev === undefined ? "—" : String(packed(prev, WALK) - packed(v, WALK)),
      ];
    });
    const allOne = s
      .slice(1)
      .every((v, j) => packed(s[j] as number, WALK) - packed(v, WALK) === 1);
    return [
      table(["서브마스크", "mask 의 1 자리만 읽은 값", "앞 값과의 차"], rows, [
        "r",
        "r",
        "r",
      ]),
      "",
      `떼어 읽은 값은 ${packed(s[0] as number, WALK)} 부터 0 까지 ${allOne ? "빠짐없이 1 씩" : "고르지 않게"} 줄어듭니다.`,
    ].join("\n");
  },

  /** `deep.build` 먼저 알아 둘 개념 (e) — mask 이하의 정수와 서브마스크. */
  "build-not-below": () => {
    const rows = Array.from({ length: WALK + 1 }, (_, j) => WALK - j).map(
      (v) => [
        String(v),
        bits(v, WALK_WIDTH),
        isSubmask(v, WALK) ? "그렇다" : "아니다",
      ],
    );
    const count = rows.filter((r) => r[2] === "그렇다").length;
    return [
      table(["mask 이하의 정수", "이진 표기", "서브마스크 여부"], rows, [
        "r",
        "r",
        "l",
      ]),
      "",
      `mask 이하의 정수 ${WALK + 1} 개 가운데 서브마스크는 ${count} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 1 을 빼면 바뀌는 자리. */
  "build-borrow": () => {
    const rows = T.rounds.map((r) => {
      const changed = [0, 1, 2, 3].filter(
        (i) => bitAt(r.sub, i) !== bitAt(r.borrowed, i),
      );
      return [
        `${r.sub} (${bits(r.sub, WALK_WIDTH)})`,
        String(r.p),
        `${r.borrowed} (${bits(r.borrowed, WALK_WIDTH)})`,
        dots(changed),
      ];
    });
    const always = T.rounds.every((r) => {
      const changed = [0, 1, 2, 3].filter(
        (i) => bitAt(r.sub, i) !== bitAt(r.borrowed, i),
      );
      return (
        changed.join(",") ===
        Array.from({ length: r.p + 1 }, (_, j) => j).join(",")
      );
    });
    return [
      table(["sub", "최하위 1 비트의 자리 p", "sub - 1", "바뀐 자리"], rows, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `${T.rounds.length} 줄 ${always ? "모두 바뀐 자리가 자리 0 부터 p 까지입니다" : "중에 바뀐 자리가 0 ~ p 가 아닌 줄이 있습니다"}.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 거르면 sub 미만의 가장 큰 서브마스크가 나온다. */
  "build-and": () => {
    const below = (
      sub: number,
      mask: number,
      all = submasksByDefinition(mask),
    ): number => all.find((s) => s < sub) as number;
    const rows = T.rounds.map((r) => [
      `${r.sub} (${bits(r.sub, WALK_WIDTH)})`,
      `${r.borrowed} (${bits(r.borrowed, WALK_WIDTH)})`,
      `${r.next} (${bits(r.next, WALK_WIDTH)})`,
      r.cleared.length === 0 ? "없음" : `자리 ${dots(r.cleared)}`,
      String(below(r.sub, WALK)),
    ]);
    const changed = T.rounds.filter((r) => r.cleared.length > 0);
    let pairs = 0;
    let miss = 0;
    for (let mask = 1; mask < 2 ** 10; mask++) {
      const all = submasksByDefinition(mask);
      for (const sub of all) {
        if (sub === 0) continue;
        pairs++;
        if (((sub - 1) & mask) !== below(sub, mask, all)) miss++;
      }
    }
    return [
      table(
        [
          "sub",
          "borrowed = sub - 1",
          "next = borrowed & mask",
          "AND 가 지운 자리",
          "sub 미만의 가장 큰 서브마스크(정의로 찾음)",
        ],
        rows,
        ["r", "r", "r", "l", "r"],
      ),
      "",
      `AND 가 값을 바꾼 것은 ${changed.length} 번(sub = ${dots(changed.map((r) => r.sub))})이고, next 가 마지막 열과 어긋난 줄은 ${T.rounds.filter((r) => r.next !== below(r.sub, WALK)).length} 개입니다. mask 를 1 부터 ${num(2 ** 10 - 1)} 까지 넣고 0 이 아닌 서브마스크 ${num(pairs)} 개마다 같은 대조를 했더니 어긋난 것이 ${miss} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 3단계 — 바퀴 수가 서브마스크 개수를 따라간다. */
  "build-loops": () => {
    const rows = OUTPUT_MASKS.map((mask) => {
      const k = popcount(mask);
      return [
        label(mask),
        String(k),
        num(2 ** k),
        num(enumerateSubmasks(mask).length),
        num(trickLoops(mask)),
      ];
    });
    return table(
      ["mask", "k", "2^k", "담은 값", "1 을 빼고 거르기의 바퀴"],
      rows,
      ["l", "r", "r", "r", "r"],
    );
  },

  /** `deep.walk` 1 — 준비 조각만 실행한 결과. */
  "walk-init": () =>
    [
      `mask = ${WALK} 이면  subMasks = ${arr([WALK])}   sub = ${WALK}`,
      `mask = 0 이면   subMasks = ${arr(enumerateSubmasks(0))}    0 > 0 이 처음부터 거짓이라 바퀴에 들어가지 않는다`,
    ].join("\n"),

  /** `deep.walk` 짚고 가기 1 — 종료 조건을 `sub >= 0` 으로 적었을 때. */
  "walk-never-ends": () => {
    const cap = 13;
    const seq = neverEnding(WALK, cap);
    const right = enumerateSubmasks(WALK);
    const last = T.rounds.at(-1) as Round;
    return [
      table(
        ["종료 조건", "담은 값"],
        [
          ["sub > 0", arr(right)],
          ["sub >= 0", `${arr(seq)} … (${cap} 개에서 끊었다)`],
        ],
        ["l", "l"],
      ),
      "",
      "0 다음 걸음에서 무엇이 계산되는지 적으면 이렇습니다.",
      "",
      table(
        ["sub", "sub - 1", "(sub - 1) & mask"],
        [["0", "-1", String(-1 & WALK)]],
        ["r", "r", "r"],
      ),
      "",
      `-1 은 모든 자리가 1 이라 mask 와 AND 하면 mask 자신인 ${-1 & WALK}${이가(-1 & WALK)} 됩니다. sub > 0 으로 적으면 0 은 마지막 바퀴(T${last.t}, sub = ${last.sub})의 next 로 담기고, 그다음 검사(T${T.endT})에서 0 > 0 이 거짓이라 멈춥니다.`,
    ].join("\n");
  },

  /** `deep.walk` 2 — 앞 세 바퀴만 실행한 결과. */
  "walk-three": () => {
    const rows = T.rounds
      .slice(0, 3)
      .map((r) => [
        `T${r.t}`,
        `${r.sub} (${bits(r.sub, WALK_WIDTH)})`,
        `${r.borrowed} (${bits(r.borrowed, WALK_WIDTH)})`,
        `${r.next} (${bits(r.next, WALK_WIDTH)})`,
        r.cleared.length === 0 ? "없음" : `자리 ${dots(r.cleared)}`,
        String(r.size),
      ]);
    return table(
      [
        "걸음",
        "바퀴 시작 sub",
        "③ 뒤 borrowed",
        "④ 뒤 next",
        "AND 가 지운 자리",
        "⑤ 뒤 subMasks 길이",
      ],
      rows,
      ["l", "r", "r", "r", "l", "r"],
    );
  },

  /** `deep.walk` 짚고 가기 2 — JavaScript 비트 연산의 32 비트 경계. */
  "walk-int32": () => {
    const cases = [LIMIT, 2 ** 30, 2 ** 31, 2 ** 31 + 1];
    const rows = cases.map((mask) => {
      const right = submasksByDefinition(mask);
      const got = enumerateSubmasks(mask);
      return [
        num(mask),
        String(popcount(mask)),
        num(right.length),
        num(got.length),
        `[${got.slice(0, 2).map(num).join(", ")}${got.length > 2 ? ", …" : ""}]`,
        right.join(",") === got.join(",") ? "같다" : "틀리다",
      ];
    });
    const edge = [2 ** 31, 2 ** 31 + 1].map((mask) => [
      num(mask),
      num(mask - 1),
      num((mask - 1) & mask),
      `[${enumerateSubmasks(mask).map(num).join(", ")}]`,
    ]);
    return [
      table(
        [
          "mask",
          "k",
          "정의대로 센 개수",
          "1 을 빼고 거르기가 낸 개수",
          "1 을 빼고 거르기가 낸 앞부분",
          "판정",
        ],
        rows,
        ["r", "r", "r", "r", "l", "l"],
      ),
      "",
      "셋째 줄과 넷째 줄의 첫 바퀴를 나란히 놓으면 이렇습니다.",
      "",
      table(["mask", "sub - 1", "(sub - 1) & mask", "담은 값"], edge, [
        "r",
        "r",
        "r",
        "l",
      ]),
      "",
      `${num(2 ** 31)} 에서는 겹치는 자리가 없어 AND 가 0 이 되고 답이 맞습니다. ${num(2 ** 31 + 1)} 에서는 자리 31 이 부호로 읽혀 담긴 값이 ${num((2 ** 31) & (2 ** 31 + 1))}${이가((2 ** 31) & (2 ** 31 + 1))} 되고, sub > 0 이 거짓이라 거기서 멈춥니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 걸음마다의 상태값과 조건. */
  "walk-trace": () => {
    const rows: string[][] = [
      ["T1", "①", `${WALK} (${bits(WALK, WALK_WIDTH)})`, "—", "—", "—", "1"],
      ...T.rounds.map((r) => [
        `T${r.t}`,
        "②③④⑤",
        `${r.sub} (${bits(r.sub, WALK_WIDTH)})`,
        `${r.sub} > 0 참`,
        `${r.borrowed} (${bits(r.borrowed, WALK_WIDTH)})`,
        `${r.next} (${bits(r.next, WALK_WIDTH)})`,
        String(r.size),
      ]),
      [
        `T${T.endT}`,
        "② 거짓",
        `0 (${bits(0, WALK_WIDTH)})`,
        "0 > 0 거짓",
        "—",
        "—",
        String(T.answer.length),
      ],
    ];
    // T1 은 조건을 검사하기 전이다 — 조건 칸을 「—」로 둔다.
    const first = rows[0] as string[];
    rows[0] = [
      first[0],
      first[1],
      first[2],
      "—",
      "—",
      "—",
      first[6],
    ] as string[];
    return [
      table(
        ["걸음", "갈래", "sub", "sub > 0", "borrowed", "next", "subMasks 길이"],
        rows,
        ["l", "l", "r", "l", "r", "r", "r"],
      ),
      "",
      `답은 ${arr(T.answer)} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 갈래마다 실행한 걸음. */
  "walk-branches": () => {
    const loop = T.rounds.map((r) => `T${r.t}`);
    const changed = T.rounds
      .filter((r) => r.cleared.length > 0)
      .map((r) => `T${r.t}`);
    const span = `${loop[0]} ~ ${loop.at(-1)}`;
    return table(
      ["라벨", "하는 일", "실행한 걸음", "실행 횟수"],
      [
        ["①", "초기화", "T1", "1"],
        [
          "②",
          "남은 서브마스크가 있는가",
          `참 ${span} · 거짓 T${T.endT}`,
          String(loop.length + 1),
        ],
        [
          "③",
          "최하위 1 비트를 내리고 아래를 채운다",
          span,
          String(loop.length),
        ],
        [
          "④",
          "mask 밖 자리를 지운다",
          `${span} · 값을 바꾼 것은 ${changed.join(" ")}`,
          String(loop.length),
        ],
        ["⑤", "담고 옮긴다", span, String(loop.length)],
      ],
      ["l", "l", "l", "r"],
    );
  },

  /** `deep.walk` 3 — 답이 정의를 만족하는가. */
  "walk-check": () => {
    const a = T.answer;
    const k = popcount(WALK);
    const holes = [0, 1, 2, 3].filter((i) => bitAt(WALK, i) === 0);
    const bad = a.filter((s) => !isSubmask(s, WALK));
    const hole = a.filter((s) => holes.some((i) => bitAt(s, i) === 1));
    return table(
      ["확인", "결과"],
      [
        ["담긴 값", dots(a)],
        ["(s & mask) === s 가 아닌 값", `${bad.length} 개`],
        [
          `자리 ${dots(holes)}${이가(holes.at(-1) as number)} 1 인 값`,
          `${hole.length} 개`,
        ],
        ["개수", `${a.length} = 2^${k}`],
        ["마지막 원소", String(a.at(-1))],
      ],
      ["l", "l"],
    );
  },

  /** `deep.walk.final` — 전체 코드를 여러 입력에 부른 결과. */
  "walk-final-out": () => {
    const calls: [string, number][] = [
      ["0b1011", 0b1011],
      ["0b101", 0b101],
      ["0b111", 0b111],
      ["0b1000", 0b1000],
      ["1", 1],
      ["0", 0],
    ];
    const pad = Math.max(...calls.map(([s]) => s.length));
    return calls
      .map(
        ([s, m]) =>
          `enumerateSubmasks(${s})${" ".repeat(pad - s.length)}  -> ${arr(enumerateSubmasks(m))}`,
      )
      .join("\n");
  },

  /** `related` — 자리내림이 만드는 항등식을 같은 값에서 나란히 낸다. */
  "related-borrow-family": () => {
    const w = 6;
    const xs = [0b1000, 0b101100, 0b1011, 0b110000];
    const rows = xs.map((x) => [
      `${x} (${bits(x, w)})`,
      `${x - 1} (${bits(x - 1, w)})`,
      `${x & (x - 1)} (${bits(x & (x - 1), w)})`,
      `${x & -x} (${bits(x & -x, w)})`,
      `${x | (x + 1)} (${bits(x | (x + 1), w)})`,
    ]);
    return table(["x", "x - 1", "x & (x - 1)", "x & -x", "x | (x + 1)"], rows, [
      "r",
      "r",
      "r",
      "r",
      "r",
    ]);
  },

  /** `purpose.real` — 내림차순과 오름차순 두 방향. */
  "real-two-ways": () =>
    table(
      ["절차", "다음 값의 식", "시작값", "내는 순서"],
      [
        [
          "이 글의 절차",
          "(sub - 1) & mask",
          String(WALK),
          dots(enumerateSubmasks(WALK)),
        ],
        [
          "Carry-Rippler",
          "(subset - mask) & mask",
          "0",
          `${dots(carryRippler(WALK))} · 다시 0 이 나오면 멈춘다`,
        ],
      ],
      ["l", "l", "r", "l"],
    ),

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  "math-check": () => {
    const rows: string[][] = [];
    for (let i = WALK_WIDTH - 1; i >= 0; i--) {
      const on = bitAt(WALK, i) === 1;
      rows.push([
        `i = ${i}`,
        String(2 ** i),
        on ? "1" : "0",
        on ? "0 또는 1" : "0 하나",
        on ? "2" : "1",
      ]);
    }
    const k = popcount(WALK);
    const product = rows.map((r) => Number(r[4])).reduce((a, b) => a * b, 1);
    const listed = enumerateSubmasks(WALK);
    return [
      table(
        ["비트 자리", "2^i", "mask 의 비트", "s_i 에 올 수 있는 값", "선택지"],
        rows,
        ["l", "r", "r", "l", "r"],
      ),
      "",
      `자리마다의 선택지를 곱하면 ${rows.map((r) => r[4]).join(" · ")} = ${product} 이고, 1 을 빼고 거르기가 실제로 낸 값도 ${dots(listed)} 의 ${listed.length} 개입니다. 2^k 에 k = ${k}${을를(k)} 넣은 값과 같습니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태를 실측과 맞추고 규모의 계수를 낸다. */
  "math-three-power": () => {
    const rows: string[][] = [];
    for (let n = 1; n <= 5; n++) {
      let sum = 0;
      for (let m = 0; m < 2 ** n; m++) sum += enumerateSubmasks(m).length;
      rows.push([String(n), num(2 ** n), num(sum), num(3 ** n)]);
    }
    const n = 20;
    const scan = totalOverAllMasks(n).scan;
    const ratio = (v: number): string => fixed1(v / 3 ** n);
    return [
      table(["n", "마스크 개수 2^n", "담은 값의 실측 합", "3^n"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `n = ${n} 을 넣으면 이렇습니다.`,
      "",
      table(
        ["세는 것", "값", "자릿수", "3^n 의 몇 배"],
        [
          [
            "3^n — 마스크마다 서브마스크만 담는다",
            num(3 ** n),
            String(String(3 ** n).length),
            ratio(3 ** n),
          ],
          [
            "4^n — 마스크마다 정수 2^n 개를 전부 검사한다",
            num(4 ** n),
            String(String(4 ** n).length),
            ratio(4 ** n),
          ],
          [
            "마스크마다 mask 이하만 검사한다",
            num(scan),
            String(String(scan).length),
            ratio(scan),
          ],
        ],
        ["l", "r", "r", "r"],
      ),
    ].join("\n");
  },

  /** `invariant` ② — 바퀴를 시작할 때마다 두 조건을 정의로 대조한다. */
  "invariant-rounds": () => {
    const all = submasksByDefinition(WALK);
    const rows = T.rounds.map((r) => {
      const before = r.subMasks.slice(0, -1);
      const want = all.filter((s) => s >= r.sub);
      return [
        `T${r.t}`,
        `${r.sub} (${bits(r.sub, WALK_WIDTH)})`,
        isSubmask(r.sub, WALK) ? "참" : "거짓",
        arr(before),
        arr(want),
        before.join(",") === want.join(",") && before.at(-1) === r.sub
          ? "참"
          : "거짓",
      ];
    });
    const bad = rows.filter((r) => r[2] !== "참" || r[5] !== "참").length;
    return [
      table(
        [
          "바퀴",
          "sub",
          "서브마스크 조건",
          "그때의 subMasks",
          "sub 이상인 서브마스크(정의)",
          "빠짐없음 조건",
        ],
        rows,
        ["l", "r", "l", "l", "l", "l"],
      ),
      "",
      `${rows.length} 바퀴의 시작마다 두 조건을 정의로 대조했고, 거짓이 나온 바퀴는 ${bad} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계 입력. */
  "invariant-edges": () => {
    const cases: [string, number][] = [
      ["mask = 0", 0],
      ["mask = 1", 1],
      ["2^20 — 1 비트 하나", LIMIT],
      ["2^20 − 1 — 1 비트 20 개", LIMIT - 1],
      ["자리 0 이 0 — 8 (1000₂)", 0b1000],
      ["자리가 전부 1 — 7 (111₂)", 0b111],
    ];
    const rows = cases.map(([name, m]) => {
      const got = enumerateSubmasks(m);
      const cleared = trace(m).rounds.filter(
        (r) => r.cleared.length > 0,
      ).length;
      return [
        name,
        num(trickLoops(m)),
        num(cleared),
        num(got.length),
        `${num(got[0] as number)} · ${num(got.at(-1) as number)}`,
        got.join(",") === submasksByDefinition(m).join(",")
          ? "정의와 같음"
          : "정의와 다름",
      ];
    });
    return table(
      [
        "경계",
        "바퀴",
        "AND 가 값을 바꾼 바퀴",
        "담은 값",
        "첫 · 마지막 원소",
        "정의대로 센 답과",
      ],
      rows,
      ["l", "r", "r", "r", "l", "l"],
    );
  },

  /** `invariant` ③ — mask 로 거르던 줄을 없앤 변이. */
  "invariant-mutant-no-mask": () => {
    const rows = NO_MASK_MASKS.map((mask) => {
      const right = enumerateSubmasks(mask);
      const cand = noMask.enumerateSubmasks(mask);
      return [
        label(mask),
        arr(right),
        arr(cand),
        right.join(",") === cand.join(",") ? "같다" : "틀리다",
      ];
    });
    const bad = noMask
      .enumerateSubmasks(WALK)
      .filter((s) => !isSubmask(s, WALK));
    return [
      table(["mask", "바른 코드", "AND 를 없앤 코드", "판정"], rows, [
        "l",
        "l",
        "l",
        "l",
      ]),
      "",
      `전개 입력에서 AND 를 없앤 코드가 담은 값 가운데 서브마스크가 아닌 것이 ${bad.length} 개입니다.`,
      "",
      table(
        ["값", "이진 표기", "mask 에 없는 1 자리"],
        bad.map((s) => [
          String(s),
          bits(s, WALK_WIDTH),
          dots(onePlaces(s).filter((i) => bitAt(WALK, i) === 0)),
        ]),
        ["r", "r", "r"],
      ),
    ].join("\n");
  },

  /** `perf.derive` — 걸음별 연산 수. */
  "perf-count": () => {
    const loops = T.rounds.length;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "1", "0"],
      [
        "바퀴",
        `T${T.rounds[0]?.t} ~ T${T.rounds.at(-1)?.t}`,
        String(loops),
        String(loops),
        String(loops),
        String(loops),
        String(loops),
      ],
      ["종료 검사", `T${T.endT}`, "1", "0", "0", "0", "1"],
      [
        "합계",
        "",
        String(loops + 2),
        String(loops),
        String(loops),
        String(T.answer.length),
        String(loops + 1),
      ],
    ];
    return table(
      ["무리", "걸음", "걸음 수", "뺄셈", "AND", "배열에 담기", "sub > 0 비교"],
      rows,
      ["l", "l", "r", "r", "r", "r", "r"],
    );
  },

  /** `perf.derive` — 총식을 두 규모에서. */
  "perf-total": () => {
    const ops = (mask: number): number => {
      const t = trace(mask);
      // 뺄셈 · AND · 담기 · 비교를 한 번씩 센다. 초기화의 담기 1 과 종료 비교 1 을 더한다.
      return 1 + t.rounds.length * 4 + 1;
    };
    const rows = [WALK, LIMIT - 1].map((mask) => {
      const k = popcount(mask);
      const formula = 4 * 2 ** k - 2;
      if (ops(mask) !== formula) throw new Error("총식이 센 값과 다르다");
      return [
        label(mask),
        String(k),
        num(ops(mask)),
        `4 · 2^${k} − 2 = ${num(formula)}`,
        num(enumerateSubmasks(mask).length),
      ];
    });
    return table(["mask", "k", "센 기본 연산", "총식", "결과 배열 칸"], rows, [
      "l",
      "r",
      "r",
      "l",
      "r",
    ]);
  },

  /** `perf.bounds` — 고르게 뽑은 마스크의 담은 값 기댓값. */
  "perf-expect": () => {
    const rows = [4, 8, 12].map((n) => {
      let sum = 0;
      for (let m = 0; m < 2 ** n; m++) sum += enumerateSubmasks(m).length;
      return [
        String(n),
        fixed1(sum / 2 ** n),
        fixed1((3 / 2) ** n),
        num(2 ** (n / 2)),
      ];
    });
    rows.push(["20", "—", fixed1((3 / 2) ** 20), num(2 ** 10)]);
    return table(["n", "실측 평균(마스크 전부)", "(3/2)^n", "2^(n/2)"], rows, [
      "r",
      "r",
      "r",
      "r",
    ]);
  },

  /** `perf.worst` — 최악을 만드는 마스크. */
  "perf-worst": () => {
    const cases: [string, number][] = [
      ["빈 마스크", 0],
      ["2^20 — 과제의 상한", LIMIT],
      ["2^19 + 1", 2 ** 19 + 1],
      ["2^20 − 1 — 자리 20 개가 전부 1", LIMIT - 1],
    ];
    const rows = cases.map(([name, mask]) => [
      name,
      num(mask),
      String(bitWidth(mask)),
      String(popcount(mask)),
      num(trickLoops(mask)),
      num(enumerateSubmasks(mask).length),
    ]);
    return table(
      ["마스크의 모양", "mask", "비트 폭 B", "k", "바퀴", "담은 값"],
      rows,
      ["l", "r", "r", "r", "r", "r"],
    );
  },

  /** `selfcheck` — 예측 문제가 가리키는 걸음. */
  "selfcheck-t5": () => {
    const r = T.rounds.find((x) => x.cleared.length > 0) as Round;
    return `T${r.t}   sub = ${r.sub} (${bits(r.sub, WALK_WIDTH)})   borrowed = ${r.borrowed} (${bits(r.borrowed, WALK_WIDTH)})   next = ${r.next} (${bits(r.next, WALK_WIDTH)})   AND 가 지운 자리 ${dots(r.cleared)}`;
  },
};

/* ────────────────────────── 조사 보조 ────────────────────────── */

/** 목록 뒤의 「은/는」 — 마지막 값에서 고른다. */
function 은는X(xs: number[]): string {
  const last = xs.at(-1);
  return last === undefined ? " 는" : 은는(last);
}
