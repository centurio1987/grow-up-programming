/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts slidingWindowMaximum-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { slidingWindowMaximum } from "./slidingWindowMaximum-guide.ref.ts";

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

/** `[3 3 5 5 6 7]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const values = (xs: number[]): string => `[${xs.join(" ")}]`;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 고정 입력. `deep.build` ③·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다. */
const WALK: number[] = [1, 3, -1, -3, 5, 3, 6, 7];
const WALK_K = 3;

/** 「아이디어 상세」 ④⑥ 과 `.alt.ts` 가 함께 쓰는 큰 입력. 난수를 쓰지 않는다. */
const BIG_N = 1024;
const BIG: number[] = Array.from(
  { length: BIG_N },
  (_, i) => (i * 2731) % 1201,
);

/** 같은 길이의 감소 수열. 후보가 창 크기만큼 쌓이는 쪽이다. */
const DOWN: number[] = Array.from({ length: BIG_N }, (_, i) => BIG_N - i);

/** ④ 가 쓰는 창 크기. ⑥ 은 이 값을 포함한 여러 크기를 잰다. */
const MID_K = 32;

/* ────────────────────── 계측기 — 자료 접근 수 ────────────────────── */

/**
 * 세는 것은 **자료 접근 수**(읽기 + 쓰기)다. 벽시계·처리량은 실행마다 값이 달라 「본문의
 * 수치가 실측과 같은가」를 정의할 수 없다.
 *
 * 회계는 `.alt.ts` 와 같다 — `nums` 읽기 · 후보 통 읽기와 쓰기 · 답 배열 쓰기를 각각 한 번으로
 * 센다. 통의 앞·뒤 어느 쪽에서 넣고 빼도 한 번이다(덱의 계약).
 */
interface Counted {
  out: number[];
  acc: number;
  /** 뒤쪽 후보와 지금 값을 맞대 본 횟수. */
  cmp: number;
  /** 뒤에서 버린 후보의 수. */
  P: number;
  /** 창을 벗어나 앞에서 버린 후보의 수. */
  F: number;
  /** 버릴 것이 남았는데도 조건이 안 맞아 멈춘 걸음의 수. */
  B: number;
  /** 통이 가장 깊었을 때의 후보 수. */
  peak: number;
  /** 순회가 끝났을 때 통에 남은 후보 수. */
  left: number;
  /** 앞에서 버릴 때 배열이 실제로 옮긴 칸 수. 덱 계약에는 안 들어간다. */
  moved: number;
}

function dequeCount(nums: number[], k: number): Counted {
  const n = nums.length;
  const result: number[] = [];
  const cand: number[] = [];
  let acc = 0;
  let cmp = 0;
  let P = 0;
  let F = 0;
  let B = 0;
  let peak = 0;
  let moved = 0;
  for (let i = 0; i < n; i++) {
    acc++;
    const cur = nums[i] ?? 0;
    if (cand.length > 0) {
      acc++;
      if ((cand[0] ?? 0) <= i - k) {
        acc++;
        moved += cand.length - 1;
        cand.shift();
        F++;
      }
    }
    let stopped = false;
    while (cand.length > 0) {
      acc += 2;
      cmp++;
      if ((nums[cand[cand.length - 1] ?? 0] ?? 0) >= cur) {
        stopped = true;
        break;
      }
      acc++;
      cand.pop();
      P++;
    }
    if (stopped) B++;
    acc++;
    cand.push(i);
    if (cand.length > peak) peak = cand.length;
    if (i >= k - 1) {
      acc += 3;
      result.push(nums[cand[0] ?? 0] ?? 0);
    }
  }
  return {
    out: result,
    acc,
    cmp,
    P,
    F,
    B,
    peak,
    left: cand.length,
    moved,
  };
}

/** 계측기가 정본과 같은 답을 내는지 그 자리에서 확인한다. */
function counted(nums: number[], k: number): Counted {
  const c = dequeCount(nums, k);
  const want = slidingWindowMaximum([...nums], k);
  if (c.out.join(",") !== want.join(",")) {
    throw new Error(
      "계측기와 정본의 답이 다르다 — 계수가 다른 절차를 잰 것이다",
    );
  }
  return c;
}

/** 창마다 처음부터 다시 세는 방법. 한 창에 `k + 1` 번 접근한다. */
function rescanEvery(
  nums: number[],
  k: number,
): { out: number[]; acc: number } {
  const n = nums.length;
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i + k <= n; i++) {
    acc++;
    let best = nums[i] ?? 0;
    for (let j = i + 1; j < i + k; j++) {
      acc++;
      const v = nums[j] ?? 0;
      if (v > best) best = v;
    }
    acc++;
    out.push(best);
  }
  return { out, acc };
}

/**
 * 최댓값 **하나만** 기억하는 방법. 그 값의 자리가 창을 벗어나면 창 전체를 다시 센다.
 *
 * 답은 맞는다 — 갈리는 것은 다시 센 창의 수뿐이다.
 */
function keepOneOnly(
  nums: number[],
  k: number,
): { out: number[]; acc: number; rescans: number } {
  const n = nums.length;
  const out: number[] = [];
  let acc = 0;
  let rescans = 0;
  let best = Number.NEGATIVE_INFINITY;
  let at = -1;
  for (let i = 0; i < n; i++) {
    acc++;
    const v = nums[i] ?? 0;
    if (at <= i - k) {
      rescans++;
      best = Number.NEGATIVE_INFINITY;
      at = -1;
      for (let j = Math.max(0, i - k + 1); j <= i; j++) {
        acc++;
        const w = nums[j] ?? 0;
        if (w > best) {
          best = w;
          at = j;
        }
      }
    } else if (v >= best) {
      best = v;
      at = i;
    }
    if (i >= k - 1) {
      acc++;
      out.push(best);
    }
  }
  return { out, acc, rescans };
}

/**
 * 자리 `t` 가 오른쪽 끝 `j` 시점의 **후보**인가 — 창 안에 있고, 자기 오른쪽의 어느 값도
 * 자기보다 크지 않은 자리다. 정의를 글자 그대로 옮긴 것이라 절차를 쓰지 않는다.
 */
function isCandidate(nums: number[], k: number, i: number, t: number): boolean {
  if (t < i - k + 1 || t > i) return false;
  for (let u = t + 1; u <= i; u++) {
    if ((nums[u] ?? 0) > (nums[t] ?? 0)) return false;
  }
  return true;
}

/** 정의로 구한 후보 집합. */
function candidateSet(nums: number[], k: number, i: number): number[] {
  const out: number[] = [];
  for (let t = Math.max(0, i - k + 1); t <= i; t++) {
    if (isCandidate(nums, k, i, t)) out.push(t);
  }
  return out;
}

/** 절차가 걸음 `j` 를 끝낸 시점의 통 내용. */
function dequeAfter(nums: number[], k: number, j: number): number[] {
  const cand: number[] = [];
  for (let i = 0; i <= j; i++) {
    const cur = nums[i] ?? 0;
    if (cand.length > 0 && (cand[0] ?? 0) <= i - k) cand.shift();
    while (cand.length > 0 && (nums[cand[cand.length - 1] ?? 0] ?? 0) < cur) {
      cand.pop();
    }
    cand.push(i);
  }
  return cand;
}

/* ────────────────────────── 변이 셋 ────────────────────────── */

interface Impl {
  slidingWindowMaximum: (nums: number[], k: number) => number[];
}

const REF = new URL("./slidingWindowMaximum-guide.ref.ts", import.meta.url)
  .pathname;

/** 맨 앞 후보를 **되풀이해서** 버리는 사본. 답은 안 갈린다. */
const expiryWhile = await loadMutant<Impl>(REF, {
  swap: [
    /if \(cand\.length > 0 && \(cand\[0\] \?\? 0\) <= i - k\) cand\.shift\(\);/,
    "while (cand.length > 0 && (cand[0] ?? 0) <= i - k) cand.shift();",
  ],
});

/** 창이 다 차기 전에도 답을 적는 사본. */
const noWarmup = await loadMutant<Impl>(REF, {
  swap: [/if \(i >= k - 1\) result\.push/, "result.push"],
});

/** 창을 벗어났는지 판정하는 부등호에서 등호를 뗀 사본. 불변식을 지키던 그 줄이다. */
const expiryStrict = await loadMutant<Impl>(REF, {
  swap: [/<= i - k/, "< i - k"],
});

/** 변이가 어느 입력에서도 결과를 안 바꾸면 「깨진다」가 거짓이다. */
function assertBreaks(rows: { good: string; bad: string }[]): void {
  if (rows.every((r) => r.good === r.bad)) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
}

/** 반대로, 「답이 안 갈린다」고 적은 자리는 실제로 한 줄도 갈리면 안 된다. */
function assertSame(rows: { good: string; bad: string }[]): void {
  if (rows.some((r) => r.good !== r.bad)) {
    throw new Error("답이 갈렸다 — 「답이 안 갈린다」가 거짓이다");
  }
}

type Case = [number[], number];

/** 정본과 변이를 같은 입력들에 걸고 답을 나란히 적는다. */
function compare(
  inputs: Case[],
  mutated: Impl,
): { name: string; good: string; bad: string }[] {
  return inputs.map(([nums, k]) => ({
    name: `${values(nums)} k=${k}`,
    good: values(slidingWindowMaximum([...nums], k)),
    bad: values(mutated.slidingWindowMaximum([...nums], k)),
  }));
}

const verdict = (r: { good: string; bad: string }): string =>
  r.good === r.bad ? "답이 같다" : "답이 다르다";

function mutantTable(
  inputs: Case[],
  mutated: Impl,
  column: string,
  footer: string[],
  same = false,
): string {
  const rows = compare(inputs, mutated);
  if (same) assertSame(rows);
  else assertBreaks(rows);
  return [
    grid(
      ["입력", "바른 코드", column, ""],
      rows.map((r) => [r.name, r.good, r.bad, verdict(r)]),
      "llll",
    ),
    "",
    ...footer,
  ].join("\n");
}

/** 총식이 실측과 맞는지 한 줄로 잰다. */
const formula = (n: number, k: number, c: Counted): number =>
  3 * n - 1 + c.F + 3 * c.P + 2 * c.B + 3 * (n - k + 1);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 창마다 다시 세는 방법을 제약 규모에 넣으면 몇 번인가. */
  "rescan-scale": () => {
    const rows: string[][] = [];
    for (const n of [1_000, 10_000]) {
      const k = n / 10;
      const nums = Array.from({ length: n }, (_, i) => (i * 2731) % 1201);
      rows.push([
        num(n),
        num(k),
        num(rescanEvery(nums, k).acc),
        num(counted(nums, k).acc),
      ]);
    }
    const big = 100_000;
    const bigK = big / 10;
    rows.push([
      `${num(big)} (식)`,
      num(bigK),
      num((bigK + 1) * (big - bigK + 1)),
      num(
        counted(
          Array.from({ length: big }, (_, i) => (i * 2731) % 1201),
          bigK,
        ).acc,
      ),
    ]);
    const half = 50_000;
    return [
      grid(
        ["N", "k", "창마다 다시 세기 · 자료 접근", "이 절차 · 자료 접근"],
        rows,
        "rrrr",
      ),
      "",
      "└ 입력은 nums[i] = (2731 i) mod 1201 이다. 창마다 다시 세기는 어느 입력에서나 같은 횟수다",
      `  다시 세기는 (k+1)(N−k+1) 로 커진다. k 를 ${num(half)} 로 두면 ${num((half + 1) * (big - half + 1))} 이다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력에 세 방식을 걸고 계수를 나란히 놓는다. */
  "three-ways": () => {
    const rows: string[][] = [];
    for (const [name, nums] of [
      ["곱셈 나머지", BIG],
      ["감소 수열", DOWN],
    ] as [string, number[]][]) {
      const r = rescanEvery(nums, MID_K);
      const o = keepOneOnly(nums, MID_K);
      const d = counted(nums, MID_K);
      const same =
        r.out.join(",") === d.out.join(",") &&
        o.out.join(",") === d.out.join(",");
      rows.push([
        name,
        num(r.acc),
        num(o.acc),
        num(o.rescans),
        num(d.acc),
        same ? "같다" : "다르다",
      ]);
    }
    return [
      grid(
        [
          "입력",
          "창마다 다시 세기",
          "최댓값 하나만",
          "그중 다시 센 걸음",
          "후보를 줄 세우기",
          "세 답이",
        ],
        rows,
        "lrrrrl",
      ),
      "",
      `└ N = ${num(BIG_N)} · k = ${MID_K} 이고 자료 접근 수를 센다. 세 방식의 답은 모두 같다`,
      "  곱셈 나머지는 nums[i] = (2731 i) mod 1201 이고, 감소 수열은 nums[i] = N − i 다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 창 크기를 바꾸면 무엇이 따라 움직이는가. */
  "k-sweep": () => {
    const rows = [1, 2, 8, 32, 128, 512, 1024].map((k) => {
      const a = counted(BIG, k);
      const b = counted(DOWN, k);
      return [
        num(k),
        num(rescanEvery(BIG, k).acc),
        num(a.acc),
        num(a.peak),
        num(b.acc),
        num(b.peak),
      ];
    });
    return [
      grid(
        [
          "k",
          "다시 세기 · 곱셈 나머지",
          "이 절차 · 곱셈 나머지",
          "후보 최대",
          "이 절차 · 감소 수열",
          "후보 최대",
        ],
        rows,
        "rrrrrr",
      ),
      "",
      `└ N = ${num(BIG_N)} 고정이다. 다시 세기는 k 를 따라 ${num(rescanEvery(BIG, 512).acc)} 까지 커지는데`,
      `  이 절차는 ${num(counted(BIG, 1).acc)} 에서 ${num(counted(BIG, 32).acc)} 사이에 머무르다 k 가 커지면 오히려 줄어든다`,
      "  후보 최대는 k 가 아니라 입력의 모양이 정한다 — 곱셈 나머지는 여덟을 안 넘고 감소 수열은 k 까지 찬다",
    ].join("\n");
  },

  /** `deep.walk.pause` — 앞에서 버리기를 되풀이하면. */
  "pause-expiry-while": () => {
    const table = mutantTable(
      [
        [WALK, WALK_K],
        [[5, 4, 3, 2, 1], 2],
        [[1, 2, 3, 4, 5], 3],
        [[7, 7, 7, 7], 2],
      ],
      expiryWhile,
      "되풀이해 버리는 코드",
      [],
      true,
    );
    // 되풀이가 실제로 두 번 이상 돈 걸음이 있는가 — 전수로 센다.
    let twice = 0;
    let checked = 0;
    const shapes: number[][] = [WALK, BIG, DOWN, [7, 7, 7, 7], [5, 4, 3, 2, 1]];
    for (const nums of shapes) {
      for (let k = 1; k <= nums.length; k++) {
        checked++;
        const cand: number[] = [];
        for (let i = 0; i < nums.length; i++) {
          const cur = nums[i] ?? 0;
          let dropped = 0;
          while (cand.length > 0 && (cand[0] ?? 0) <= i - k) {
            cand.shift();
            dropped++;
          }
          if (dropped >= 2) twice++;
          while (
            cand.length > 0 &&
            (nums[cand[cand.length - 1] ?? 0] ?? 0) < cur
          ) {
            cand.pop();
          }
          cand.push(i);
        }
      }
    }
    return [
      table,
      `└ 네 입력에서 답이 한 줄도 안 갈린다`,
      `  입력 ${shapes.length} 개의 모든 창 크기 ${num(checked)} 벌을 돌려 한 걸음에 두 번 이상 버린 자리를 세었고 결과는 ${twice} 개다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 창이 다 차기 전에 답을 적으면. */
  "pause-no-warmup": () =>
    mutantTable(
      [
        [WALK, WALK_K],
        [[3, 1, 5, 2], 4],
        [[3, 1, 5, 2], 1],
        [[9, 8, 7, 6, 5], 2],
      ],
      noWarmup,
      "창이 덜 찼을 때도 적는 코드",
      [
        "└ 답의 개수부터 다르다 — 바른 코드는 N − k + 1 개이고 변이는 N 개다",
        "  k = 1 이면 창이 첫 걸음에 이미 다 차므로 두 코드가 같은 답을 낸다",
      ],
    ),

  /** `deep.walk.pause` — 덱 계약의 한 번과 배열 구현의 한 번. */
  "pause-shift-cost": () => {
    const rows: string[][] = [];
    for (const [name, gen] of [
      ["감소 수열", (n: number) => Array.from({ length: n }, (_, i) => n - i)],
      [
        "곱셈 나머지",
        (n: number) => Array.from({ length: n }, (_, i) => (i * 2731) % 1201),
      ],
    ] as [string, (n: number) => number[]][]) {
      for (const [n, k] of [
        [BIG_N, MID_K],
        [100_000, 1_000],
      ] as [number, number][]) {
        const c = counted(gen(n), k);
        rows.push([name, num(n), num(k), num(c.F), num(c.moved)]);
      }
    }
    return [
      grid(
        ["입력", "N", "k", "앞에서 버린 횟수", "실제로 옮긴 칸"],
        rows,
        "lrrrr",
      ),
      "",
      "└ 앞에서 버리는 일을 덱의 계약대로 한 번으로 세면 넷째 열이고, 배열의 shift 가 실제로",
      "  옮긴 칸은 다섯째 열이다. 통에 든 후보가 적으면 둘의 차이가 거의 없다",
    ].join("\n");
  },

  /** `deep.math` ② — 후보 집합의 정의를 전개 입력에 그대로 넣는다. */
  "candidates-check": () => {
    const rows = WALK.map((_, j) => {
      const set = candidateSet(WALK, WALK_K, j);
      const got = dequeAfter(WALK, WALK_K, j);
      return [
        `T${j + 1}`,
        String(j),
        `[${set.join(" ")}]`,
        `[${got.join(" ")}]`,
        set.join(",") === got.join(",") ? "같다" : "다르다",
        j >= WALK_K - 1 ? String(WALK[set[0] ?? 0] ?? 0) : "—",
      ];
    });
    const wrong = WALK.filter(
      (_, j) =>
        candidateSet(WALK, WALK_K, j).join(",") !==
        dequeAfter(WALK, WALK_K, j).join(","),
    ).length;
    return [
      grid(
        [
          "걸음",
          "지금 자리 i",
          "정의로 구한 C(i)",
          "절차의 통",
          "둘이",
          "맨 앞의 값",
        ],
        rows,
        "llllll",
      ),
      "",
      `└ 여덟 걸음에서 두 열이 어긋난 자리가 ${wrong} 개다`,
      `  맨 앞의 값은 i ≥ ${WALK_K - 1} 인 걸음마다 그 창의 최댓값과 같다`,
    ].join("\n");
  },

  /** `deep.math` ④ — 총식이 임의의 입력·창 크기에서 실측과 맞는가. */
  "cost-formula": () => {
    const rows: string[][] = [];
    const inputs: [string, number[]][] = [
      ["전개 입력", WALK],
      ["곱셈 나머지", BIG],
      ["감소 수열", DOWN],
    ];
    for (const [name, nums] of inputs) {
      for (const k of name === "전개 입력" ? [WALK_K] : [2, 45, nums.length]) {
        const c = counted(nums, k);
        rows.push([
          name,
          num(nums.length),
          num(k),
          num(c.P),
          num(c.F),
          num(c.B),
          num(formula(nums.length, k, c)),
          num(c.acc),
        ]);
      }
    }
    const bad = rows.filter((r) => r[6] !== r[7]).length;
    const n = 100_000;
    const k = 1_000;
    const c = counted(
      Array.from({ length: n }, (_, i) => (i * 2731) % 1201),
      k,
    );
    return [
      grid(
        ["입력", "N", "k", "P", "F", "B", "3N−1+F+3P+2B+3(N−k+1)", "실측 접근"],
        rows,
        "lrrrrrrr",
      ),
      "",
      `└ 일곱째 열과 여덟째 열이 어긋난 줄이 ${bad} 개다`,
      `  제약 상한 N = ${num(n)} · k = ${num(k)} 에서 이 입력의 실측은 ${num(c.acc)} 이고 상한 11N − 3k − 5 는 ${num(11 * n - 3 * k - 5)} 이다`,
    ].join("\n");
  },

  /** `invariant` ③ — 창을 벗어났는지 판정하는 등호를 떼면. */
  "mutant-expiry-strict": () =>
    mutantTable(
      [
        [WALK, WALK_K],
        [[9, 1, 1, 1, 1], 2],
        [[1, 2, 3, 4, 5], 3],
        [[5, 4, 3, 2, 1], 2],
      ],
      expiryStrict,
      "등호를 뗀 코드",
      [
        "└ 창을 막 벗어난 자리가 한 걸음 더 살아남아 지난 창의 최댓값이 다시 나온다",
        "  값이 계속 커지는 입력에서는 맨 앞이 언제나 방금 넣은 자리라 답이 안 갈린다",
      ],
    ),

  /** `perf.derive` — 전개가 실제로 몇 번 접근했는가. */
  "walk-cost": () => {
    const c = counted(WALK, WALK_K);
    const n = WALK.length;
    const answers = n - WALK_K + 1;
    return [
      grid(
        ["갈래", "걸음", "자료 접근"],
        [
          ["지금 값을 읽는다", "T1~T8", num(n)],
          ["맨 앞이 창 안인지 본다 ②", "T2~T8", num(n - 1)],
          ["창을 벗어난 후보를 버린다 ②", "T5", num(c.F)],
          ["뒤쪽 후보와 맞대 본다 ③", "T2~T8", num(2 * c.cmp)],
          ["뒤쪽 후보를 버린다 ③", "T2·T5·T7·T8", num(c.P)],
          ["지금 자리를 붙인다 ④", "T1~T8", num(n)],
          ["답을 적는다 ⑤", "T3~T8", num(3 * answers)],
          ["합", "", num(c.acc)],
        ],
        "llr",
      ),
      "",
      `└ 같은 입력을 창마다 다시 세면 ${num(rescanEvery(WALK, WALK_K).acc)} 번이다. 여덟 칸에서는 아직 이쪽이 많다`,
      `  맞대 본 횟수가 ${c.cmp} 이고 그중 버린 것이 ${c.P} · 멈춘 걸음이 ${c.B} 이다`,
    ].join("\n");
  },

  /** `perf.worst` — 입력의 모양이 접근 수를 어떻게 바꾸는가. */
  "worst-shape": () => {
    const k = 45;
    const n = BIG_N;
    const shapes: [string, number[]][] = [
      ["감소 수열", DOWN],
      ["전부 같은 값", Array.from({ length: n }, () => 7)],
      ["증가 수열", Array.from({ length: n }, (_, i) => i)],
      ["곱셈 나머지", BIG],
      [
        "창마다 큰 값 하나 · 나머지 증가",
        Array.from({ length: n }, (_, i) =>
          i % k === 0 ? 10_000 - Math.floor(i / k) : i % k,
        ),
      ],
      [
        "이웃 둘씩 자리를 바꾼 증가 수열",
        Array.from({ length: n }, (_, i) => (i % 2 === 0 ? i + 1 : i - 1)),
      ],
    ];
    const rows = shapes.map(([name, nums]) => {
      const c = counted(nums, k);
      return [
        name,
        num(c.P),
        num(c.F),
        num(c.B),
        num(c.peak),
        num(formula(n, k, c)),
        num(c.acc),
      ];
    });
    // 여섯 모양 × 모든 창 크기에서 가장 적은 값과 가장 많은 값.
    let lo = Number.POSITIVE_INFINITY;
    let loAt = "";
    let hi = 0;
    let hiAt = "";
    let hiK = 0;
    const families: [string, (k: number) => number[]][] = [
      ...shapes
        .slice(0, 4)
        .map(
          ([name, nums]) =>
            [name, () => nums] as [string, (k: number) => number[]],
        ),
      [
        "창마다 큰 값 하나 · 나머지 증가",
        (kk: number) =>
          Array.from({ length: n }, (_, i) =>
            i % kk === 0 ? 10_000 - Math.floor(i / kk) : i % kk,
          ),
      ],
      [
        "이웃 둘씩 자리를 바꾼 증가 수열",
        () =>
          Array.from({ length: n }, (_, i) => (i % 2 === 0 ? i + 1 : i - 1)),
      ],
    ];
    for (const [name, gen] of families) {
      for (let kk = 1; kk <= n; kk++) {
        const a = counted(gen(kk), kk).acc;
        if (a < lo) {
          lo = a;
          loAt = `${name} · k=${num(kk)}`;
        }
        if (a > hi) {
          hi = a;
          hiK = kk;
          hiAt = `${name} · k=${num(kk)}`;
        }
      }
    }
    return [
      grid(
        [
          "입력의 모양",
          "뒤에서 버림 P",
          "앞에서 버림 F",
          "멈춘 걸음 B",
          "후보 최대",
          "총식",
          "실측 접근",
        ],
        rows,
        "lrrrrrr",
      ),
      "",
      `└ N = ${num(n)} · k = ${k} 다. 여섯째 열과 일곱째 열이 모든 줄에서 같다`,
      `  여섯 모양 × 창 크기 ${num(n)} 벌을 전수로 살펴 가장 적은 것이 ${num(lo)}(${loAt} · 5N)이고`,
      `  가장 많은 것이 ${num(hi)}(${hiAt})이며 그때의 상한 11N − 3k − 5 는 ${num(11 * n - 3 * hiK - 5)} 이다`,
    ].join("\n");
  },
};
