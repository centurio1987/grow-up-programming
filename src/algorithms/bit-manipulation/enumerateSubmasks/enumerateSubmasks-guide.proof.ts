/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { enumerateSubmasks } from "./enumerateSubmasks-guide.ref.ts";

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
const num = (n: number | bigint): string => n.toLocaleString("en-US");

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
 * `0b1011` 을 고른 이유는 **자리 2 가 비어 있기** 때문이다. 그 구멍이 있어야 `& mask` 가
 * 실제로 값을 바꾸는 걸음이 생긴다 — `0b111` 처럼 구멍 없는 마스크에서는 여덟 걸음 내내
 * AND 가 아무것도 지우지 않아 독자가 ④ 가 하는 일을 볼 수 없다. 최하위 비트가 1 이라
 * 자리내림이 한 자리에서 끝나는 걸음과 여러 자리를 지나가는 걸음이 둘 다 나온다.
 */
const WALK_MASK = 0b1011;

/** 제약의 상한. `0 ≤ mask ≤ 2^20` 이다. */
const LIMIT = 2 ** 20;

/** 제약이 허용하는 비트 폭. `2^20` 이 최상위 자리 20 을 쓰므로 21 이다. */
const LIMIT_WIDTH = 21;

/* ────────────────────────── 계측기 ────────────────────────── */

/** `mask` 의 1 비트 개수. 비트 연산을 쓰지 않고 세어 32 비트 자르기와 무관하게 둔다. */
function popcount(mask: number): number {
  let count = 0;
  for (let m = mask; m > 0; m = Math.floor(m / 2)) count += m % 2;
  return count;
}

/** `mask` 의 비트 폭 — 최상위 1 비트의 자리 번호에 1 을 더한 값. `mask = 0` 이면 0 이다. */
function bitWidth(mask: number): number {
  let width_ = 0;
  for (let m = mask; m > 0; m = Math.floor(m / 2)) width_++;
  return width_;
}

/** 고정 폭 이진 표기. 자리를 세는 글이라 폭을 프레임마다 바꾸지 않는다. */
function bits(value: number, width_: number): string {
  let out = "";
  for (let i = width_ - 1; i >= 0; i--) {
    out += Math.floor(value / 2 ** i) % 2 === 1 ? "1" : "0";
  }
  return out;
}

/**
 * **정의를 그대로 옮긴 답.** `mask` 의 1 비트 자리를 모아 두고 그 부분집합을 전부 만든다.
 * 비트 연산을 쓰지 않아 32 비트 자르기의 영향을 받지 않으므로, 32 비트 경계를 다루는
 * 「멈춤」의 기준값이 된다.
 */
function submasksByDefinition(mask: number): number[] {
  const places: number[] = [];
  for (let m = mask, i = 0; m > 0; m = Math.floor(m / 2), i++) {
    if (m % 2 === 1) places.push(2 ** i);
  }
  let out = [0];
  for (const value of places) out = [...out, ...out.map((s) => s + value)];
  return out.sort((a, b) => b - a);
}

/** 후보를 하나씩 검사하는 방법이 실행하는 바퀴 수. `i` 가 `mask` 부터 1 까지 내려간다. */
const scanLoops = (mask: number): number => mask;

/** 정본이 실행하는 바퀴 수. 담은 값이 `2^k` 개이고 첫 칸은 바퀴 밖에서 담는다. */
const trickLoops = (mask: number): number => enumerateSubmasks(mask).length - 1;

/**
 * 후보를 하나씩 검사하는 방법. `deep.build` ② 가 세우는 「가장 단순한 방법」이고,
 * 원본 파일의 주석에 「원형 아이디어」로 남아 있는 것과 같은 절차다.
 */
function scanEveryInteger(mask: number): number[] {
  const out: number[] = [];
  for (let i = mask; i > 0; i--) {
    if ((mask & i) === i) out.push(i);
  }
  out.push(0);
  return out;
}

/**
 * **최하위 1 비트만 지우는 후보** — `sub & (sub - 1)` 이다. `deep.build` ⑤ 가 진짜 개념을
 * 꺼내기 전에 시험해 반박하는 더 단순한 후보다.
 */
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
 * **종료 조건을 `sub >= 0` 으로 적은 사본.** 0 다음에 `(0 - 1) & mask` 가 `mask` 를 내
 * 반복이 끝나지 않는다. 걸음 수에 상한을 두어 앞부분만 본다.
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

/** 모든 `n` 비트 마스크에 대해 두 방법이 실행하는 바퀴 수의 합. */
function totalOverAllMasks(n: number): { scan: number; trick: number } {
  const size = 2 ** n;
  // 후보 검사는 마스크 m 마다 m 바퀴다 — 0 부터 size-1 까지의 합이다.
  const scan = (size * (size - 1)) / 2;
  // 정본은 마스크 m 마다 2^popcount(m) - 1 바퀴다 — 전부 더하면 3^n - 2^n 이다.
  const trick = 3 ** n - size;
  return { scan, trick };
}

/* ────────────────────────── 걸음 추적 ────────────────────────── */

interface Step {
  label: string;
  branch: string;
  sub: string;
  borrowed: string;
  next: string;
  size: number;
}

/** 정본을 그대로 따라가며 걸음마다의 값을 모은다. `.sim.ts` 와 같은 표를 쓴다. */
function trace(mask: number): Step[] {
  const w = Math.max(bitWidth(mask), 1);
  const out: Step[] = [];
  let sub = mask;
  let size = 1;
  out.push({
    label: "T1",
    branch: "①",
    sub: `${sub} (${bits(sub, w)})`,
    borrowed: "—",
    next: "—",
    size,
  });
  let t = 1;
  while (sub > 0) {
    t++;
    const borrowed = sub - 1;
    const next = borrowed & mask;
    size++;
    out.push({
      label: `T${t}`,
      branch: "②③④⑤",
      sub: `${sub} (${bits(sub, w)})`,
      borrowed: `${borrowed} (${bits(borrowed, w)})`,
      next: `${next} (${bits(next, w)})`,
      size,
    });
    sub = next;
  }
  out.push({
    label: `T${t + 1}`,
    branch: "② 거짓",
    sub: `${sub} (${bits(sub, w)})`,
    borrowed: "—",
    next: "—",
    size,
  });
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = { enumerateSubmasks: (mask: number) => number[] };

const REF = new URL("./enumerateSubmasks-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * **`mask` 로 거르던 줄을 없앤 사본** — `next` 가 `borrowed` 그대로가 된다. 불변식
 * 「`sub` 는 언제나 `mask` 의 서브마스크다」를 유지하던 바로 그 줄이다.
 *
 * **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const noMask = await loadMutant<Impl>(REF, {
  swap: [/const next = borrowed & mask;/, "const next = borrowed;"],
});

/* ────────────────────────── 사례 목록 ────────────────────────── */

const label = (mask: number): string =>
  mask === WALK_MASK
    ? `전개 입력 ${mask} (${bits(mask, 4)})`
    : `${num(mask)} (${bits(mask, Math.max(bitWidth(mask), 1))})`;

/** 두 방법의 바퀴 수가 갈리는 자리와 같아지는 자리를 함께 담은 목록. */
const SCALE_MASKS = [WALK_MASK, 0b1000, 2 ** 10, LIMIT, LIMIT - 1];

/** 최하위 1 비트만 지우는 후보가 갈리는 자리를 담은 목록. */
const CLEAR_LOWEST_MASKS = [WALK_MASK, 0b111, 0b101, 0b1000, 1];

/** `mask` 로 거르는 줄을 없앤 변이가 갈리는 자리를 담은 목록. */
const NO_MASK_MASKS = [WALK_MASK, 0b101, 0b111, 1, 0];

/** 걸음 수가 출력 크기를 따라간다는 것을 보이는 목록. `k` 를 0 부터 20 까지 넓힌다. */
const OUTPUT_MASKS = [0, 1, WALK_MASK, 0b10101010, 699_050, LIMIT - 1];

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 후보를 하나씩 검사하는 방법을 제약 규모에서 반박한다. */
  costNaive: () => {
    const rows = SCALE_MASKS.map((mask) => [
      label(mask),
      String(popcount(mask)),
      num(scanLoops(mask)),
      num(enumerateSubmasks(mask).length),
      (scanLoops(mask) / enumerateSubmasks(mask).length).toLocaleString(
        "en-US",
        { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      ),
    ]);
    const ns = [4, 8, 12, 16, 20];
    const totals = ns.map((n) => {
      const t = totalOverAllMasks(n);
      return [
        String(n),
        num(t.scan),
        num(t.trick),
        (t.scan / t.trick).toFixed(1),
      ];
    });
    return [
      "후보를 하나씩 검사하면 바퀴 수가 mask 의 크기를 따라간다",
      table(
        [
          "mask",
          "1 비트 개수 k",
          "검사한 후보",
          "서브마스크",
          "후보 ÷ 서브마스크",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "n 비트 마스크 전부에 이 절차를 부르면 — 바퀴 수의 합",
      table(["n", "후보를 검사한다", "정본", "몇 배인가"], totals, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `└ 첫 표의 넷째 줄은 서브마스크 2 개를 내려고 ${num(LIMIT)} 번을 검사한다.`,
      "  마지막 줄처럼 1 비트가 빈틈없이 찬 마스크에서만 두 방법의 바퀴 수가 같아진다",
    ].join("\n");
  },

  /** `deep.build` ③ — 자리내림과 AND 가 걸음마다 무엇을 하는지 이진 표기로 잇는다. */
  borrowChain: () => {
    const w = bitWidth(WALK_MASK);
    const rows = trace(WALK_MASK)
      .filter((s) => s.borrowed !== "—")
      .map((s) => [s.label, s.sub, s.borrowed, s.next]);
    const changed = trace(WALK_MASK).filter(
      (s) => s.borrowed !== "—" && s.borrowed !== s.next,
    );
    return [
      `mask = ${bits(WALK_MASK, w)} 에서 걸음마다의 세 값`,
      table(
        ["걸음", "sub", "sub - 1 (borrowed)", "borrowed & mask (next)"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      `└ AND 가 값을 실제로 바꾼 걸음은 ${changed.length} 개이고 ${changed
        .map((s) => s.label)
        .join("·")} 다.`,
      "  나머지 걸음에서는 sub - 1 이 이미 mask 안에 있어 AND 가 같은 값을 낸다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 마스크를 두 방식으로 처리한 바퀴 수. */
  costTwoWays: () => {
    const rows = SCALE_MASKS.map((mask) => [
      label(mask),
      String(bitWidth(mask)),
      String(popcount(mask)),
      num(scanLoops(mask)),
      num(trickLoops(mask)),
    ]);
    return [
      table(
        [
          "mask",
          "비트 폭 B",
          "1 비트 개수 k",
          "후보 검사의 바퀴",
          "정본의 바퀴",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      "└ 넷째 열은 2^B 언저리를 따라가고 다섯째 열은 2^k − 1 과 같다.",
      "  B 와 k 가 같은 마지막 줄에서만 두 열이 같아진다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 최하위 1 비트만 지우는 후보를 반박한다. */
  clearLowest: () => {
    const rows = CLEAR_LOWEST_MASKS.map((mask) => {
      const right = enumerateSubmasks(mask);
      const cand = clearLowestOnly(mask);
      return [
        label(mask),
        `[${right.join(", ")}]`,
        `[${cand.join(", ")}]`,
        right.join(",") === cand.join(",") ? "같다" : "틀리다",
      ];
    });
    return [
      table(["mask", "정본이 낸 답", "최하위 1 비트만 지운 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 이 후보는 1 비트를 하나씩 지우기만 해 k + 1 개를 낸다. 지운 비트를 다시 세우는",
      "  걸음이 없어 1 비트가 하나뿐인 마지막 두 줄에서만 답이 같다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 걸음 수가 출력 크기를 따라간다는 것을 값으로 낸다. */
  stepsFollowOutput: () => {
    const rows = OUTPUT_MASKS.map((mask) => {
      const k = popcount(mask);
      return [
        label(mask),
        String(k),
        num(2 ** k),
        num(enumerateSubmasks(mask).length),
        num(trickLoops(mask)),
        num(scanLoops(mask)),
      ];
    });
    return [
      table(
        ["mask", "k", "2^k", "담은 값", "정본의 바퀴", "후보 검사의 바퀴"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      "└ 셋째 열과 넷째 열이 여섯 줄 모두에서 같다. 다섯째 열은 그보다 정확히 1 작다 —",
      "  첫 칸인 mask 자신은 바퀴 밖에서 담기 때문이다",
    ].join("\n");
  },

  /** `deep.walk` — 걸음마다의 상태값. */
  walkTrace: () => {
    const rows = trace(WALK_MASK).map((s) => [
      s.label,
      s.branch,
      s.sub,
      s.borrowed,
      s.next,
      String(s.size),
    ]);
    return [
      table(
        ["걸음", "갈래", "sub", "borrowed", "next", "subMasks 길이"],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 답은 [${enumerateSubmasks(WALK_MASK).join(", ")}] 이다`,
    ].join("\n");
  },

  /** 멈춤 1 — 종료 조건을 `sub >= 0` 으로 적었을 때. */
  pauseNeverEnds: () => {
    const cap = 13;
    const seq = neverEnding(WALK_MASK, cap);
    const right = enumerateSubmasks(WALK_MASK);
    const w = bitWidth(WALK_MASK);
    return [
      table(
        ["종료 조건", "담은 값"],
        [
          ["sub > 0 (정본)", `[${right.join(", ")}]`],
          ["sub >= 0", `[${seq.join(", ")}] … (${cap} 개에서 끊었다)`],
        ],
        ["l", "l"],
      ),
      "",
      "0 다음 걸음이 왜 mask 로 돌아오는가",
      table(
        ["값", "이진 표기", "sub - 1", "그 값의 이진 표기", "& mask"],
        [["0", bits(0, w), "-1", "…1111", String(-1 & WALK_MASK)]],
        ["r", "r", "r", "r", "r"],
      ),
      "",
      `└ -1 은 모든 자리가 1 이라 mask 와 AND 하면 mask 자신인 ${WALK_MASK} 이 된다.`,
      "  그래서 여덟째 값 0 다음에 첫 값이 다시 나오고 같은 여덟 개가 되풀이된다",
    ].join("\n");
  },

  /** 멈춤 2 — JavaScript 비트 연산의 32 비트 경계. */
  pauseInt32: () => {
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
    return [
      table(
        [
          "mask",
          "k",
          "정의가 낸 개수",
          "정본이 낸 개수",
          "정본이 낸 앞부분",
          "판정",
        ],
        rows,
        ["r", "r", "r", "r", "r", "l"],
      ),
      "",
      `└ 제약의 상한 ${num(LIMIT)} 까지는 답이 안 틀린다. 2^31 부터 최상위 자리가 부호로`,
      `  읽혀 ${num(2 ** 31 + 1)} 에서는 두 번째 값이 음수가 되고 그 자리에서 반복이 끝난다`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  mathCheck: () => {
    const w = bitWidth(WALK_MASK);
    const rows: string[][] = [];
    for (let i = w - 1; i >= 0; i--) {
      const on = Math.floor(WALK_MASK / 2 ** i) % 2 === 1;
      rows.push([
        `i = ${i}`,
        String(2 ** i),
        on ? "1" : "0",
        on ? "0 또는 1 — 둘 다 된다" : "0 하나뿐이다",
        on ? "2" : "1",
      ]);
    }
    const k = popcount(WALK_MASK);
    const listed = enumerateSubmasks(WALK_MASK);
    return [
      table(
        [
          "비트 자리",
          "2^i",
          "mask 의 비트",
          "서브마스크가 이 자리에 둘 수 있는 값",
          "선택지",
        ],
        rows,
        ["l", "r", "r", "l", "r"],
      ),
      "",
      `자리마다의 선택지를 곱하면   ${rows.map((r) => r[4]).join(" · ")} = ${2 ** k}`,
      `정본이 실제로 낸 개수        ${listed.length}`,
      `정본이 낸 값                 ${listed.join(", ")}`,
      `└ 2^k 에 k = ${k} 을 넣은 값과 같다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 닫힌 형태를 실측과 맞추고 제약 규모의 계수를 낸다. */
  mathThreePower: () => {
    const rows: string[][] = [];
    for (let n = 1; n <= 5; n++) {
      let sum = 0;
      for (let m = 0; m < 2 ** n; m++) sum += enumerateSubmasks(m).length;
      rows.push([String(n), num(2 ** n), num(sum), num(3 ** n)]);
    }
    const n = LIMIT_WIDTH - 1;
    const half = totalOverAllMasks(n).scan;
    const ratio = (v: number): string =>
      (v / 3 ** n).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    return [
      table(["n", "마스크 개수 2^n", "서브마스크 쌍의 실측 합", "3^n"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `제약 규모에 넣으면 — n = ${n}`,
      table(
        ["무엇", "값", "자릿수", "3^n 의 몇 배"],
        [
          [
            "3^n — 마스크마다 서브마스크만 담는다",
            num(3 ** n),
            String(String(3 ** n).length),
            ratio(3 ** n),
          ],
          [
            "4^n — 마스크마다 정수 후보 2^n 개를 전부 검사한다",
            num(4 ** n),
            String(String(4 ** n).length),
            ratio(4 ** n),
          ],
          [
            "마스크마다 mask 이하만 검사한다",
            num(half),
            String(String(half).length),
            ratio(half),
          ],
        ],
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 실측 합이 다섯 규모에서 3^n 과 같다. 값을 하나씩 세지 않고 임의의 n 에서 나온다.",
      "  셋째 줄은 4^n 의 절반 언저리이고 파트 1 이 센 것과 같은 수다",
    ].join("\n");
  },

  /** `invariant` ③ — mask 로 거르던 줄을 없앤 변이. */
  mutantNoMask: () => {
    const rows = NO_MASK_MASKS.map((mask) => {
      const right = enumerateSubmasks(mask);
      const cand = noMask.enumerateSubmasks(mask);
      return [
        label(mask),
        `[${right.join(", ")}]`,
        `[${cand.join(", ")}]`,
        right.join(",") === cand.join(",") ? "같다" : "틀리다",
      ];
    });
    const w = bitWidth(WALK_MASK);
    const bad = noMask
      .enumerateSubmasks(WALK_MASK)
      .filter((s) => (s & WALK_MASK) !== s);
    return [
      table(["mask", "정본이 낸 답", "AND 를 없앤 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `전개 입력에서 서브마스크가 아닌 값이 ${bad.length} 개 들어온다`,
      table(
        ["값", "이진 표기", "mask 에 없는 자리"],
        bad.map((s) => [
          String(s),
          bits(s, w),
          String(bitWidth(s & ~WALK_MASK) - 1),
        ]),
        ["r", "r", "r"],
      ),
      "",
      `└ 넷 다 자리 2 가 1 인데 mask = ${bits(WALK_MASK, w)} 의 자리 2 는 0 이다.`,
      "  AND 가 사라지면 1 씩 줄어들기만 해 mask 밖의 자리가 그대로 남는다",
    ].join("\n");
  },

  /** `perf.derive` — 걸음별 연산 수. */
  perfCount: () => {
    const steps = trace(WALK_MASK);
    const loops = steps.length - 2;
    const size = enumerateSubmasks(WALK_MASK).length;
    const rows = [
      ["초기화", "T1", "1", "0", "0", "1"],
      [
        "바퀴",
        `T2 부터 T${loops + 1} 까지`,
        String(loops),
        "1",
        "1",
        String(loops),
      ],
      ["종료 검사", `T${loops + 2}`, "1", "0", "0", "0"],
      ["합계", "", "", String(loops), String(loops), String(size)],
    ];
    return [
      table(
        ["무리", "어느 걸음인가", "걸음 수", "뺄셈", "AND", "배열에 담기"],
        rows,
        ["l", "l", "r", "r", "r", "r"],
      ),
      "",
      `└ 바퀴가 ${loops} 번이고 담은 값이 ${size} 개다. 앞은 2^k − 1 이고 뒤는 2^k 다`,
    ].join("\n");
  },

  /** `perf.worst` — 최악을 만드는 마스크. */
  worstShape: () => {
    const cases: [string, number][] = [
      ["0 (빈 마스크)", 0],
      ["2^20 (제약의 상한)", LIMIT],
      ["2^19 + 1", 2 ** 19 + 1],
      ["2^20 − 1 (자리 20 개가 전부 1)", LIMIT - 1],
    ];
    const rows = cases.map(([name, mask]) => [
      name,
      num(mask),
      String(bitWidth(mask)),
      String(popcount(mask)),
      num(trickLoops(mask)),
      num(enumerateSubmasks(mask).length),
    ]);
    return [
      table(
        ["마스크의 모양", "mask", "비트 폭 B", "k", "바퀴", "담은 값"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `└ 제약 안에서 바퀴가 가장 많은 마스크는 마지막 줄의 ${num(LIMIT - 1)} 이고`,
      `  ${num(trickLoops(LIMIT - 1))} 번이다. 상한인 ${num(LIMIT)} 자체는 1 비트가 하나뿐이라 1 번으로 끝난다`,
    ].join("\n");
  },

  /** `related` — 자리내림이 만드는 항등식 넷을 같은 값에서 나란히 낸다. */
  borrowFamily: () => {
    const w = 6;
    const xs = [0b1000, 0b101100, 0b1011, 0b110000];
    const rows = xs.map((x) => [
      `${x} (${bits(x, w)})`,
      `${x - 1} (${bits(x - 1, w)})`,
      `${x & (x - 1)} (${bits(x & (x - 1), w)})`,
      `${x & -x} (${bits(x & -x, w)})`,
      `${x | (x + 1)} (${bits(x | (x + 1), w)})`,
    ]);
    return [
      table(["x", "x - 1", "x & (x - 1)", "x & -x", "x | (x + 1)"], rows, [
        "r",
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      "└ 오른쪽 세 열은 x - 1 과 x + 1 이 만든 자리내림·자리올림을 AND 나 OR 로 잘라 쓴 것이다.",
      `  첫 줄이 전개 T5 가 보인 그 걸음이고, 자리 폭만 4 에서 ${w} 으로 넓혔다`,
    ].join("\n");
  },

  /** `selfcheck` — 후보 검사 방법이 같은 답을 내는가. */
  checkSameAnswer: () => {
    const rows = [WALK_MASK, 0b101, 0b1000, 1, 0].map((mask) => {
      const right = enumerateSubmasks(mask);
      const scan = scanEveryInteger(mask);
      return [
        label(mask),
        `[${right.join(", ")}]`,
        `[${scan.join(", ")}]`,
        right.join(",") === scan.join(",") ? "같다" : "틀리다",
      ];
    });
    return [
      table(["mask", "정본이 낸 답", "후보를 검사한 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 다섯 줄 모두 같은 답이다. 두 절차는 같은 값을 같은 순서로 내고 바퀴 수만 다르다",
    ].join("\n");
  },
};
