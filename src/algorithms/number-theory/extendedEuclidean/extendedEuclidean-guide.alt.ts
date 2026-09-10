/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치를 실측하는 하네스 — L13.
 *
 * ```bash
 * bun run ../../../../tools/bench-alt.ts extendedEuclidean-guide.alt.ts
 * bun run ../../../../tools/bench-alt.ts --check extendedEuclidean-guide.alt.ts
 * ```
 *
 * ## 입력을 왜 전개 입력만 안 쓰는가
 *
 * 두 설계가 갈리는 축은 **몫의 분포**다. 전개 입력(510 · 183)의 몫은 `2 1 3 1 2 4` 로
 * 섞여 있어서 한쪽으로 치우친 입력에서 무엇이 되는지가 안 보인다. 그래서 전개 입력을
 * **한 줄로 그대로 두고** 몫이 한쪽으로 치우친 셋을 더한다.
 *
 * - **피보나치 이웃** `F(91)` · `F(90)` — 마지막 몫만 2 이고 나머지가 전부 1 이다. 생성식은 `F(0)=0`·`F(1)=1`·
 *   `F(k)=F(k-1)+F(k-2)`.
 * - **펠 수열 이웃** `P(48)` · `P(47)` — 몫이 전부 2 다. 생성식은 `P(0)=1`·`P(1)=2`·
 *   `P(k+1)=2·P(k)+P(k-1)`.
 * - **큰 소수 쌍** `1,000,000,007` · `998,244,353` — 몫이 섞이고 값이 크다.
 *
 * 넷 다 상수라 몇 번을 실행해도 같은 값이 나온다. 무작위 입력을 안 쓰는 것도 같은 이유다.
 *
 * ## 무엇을 세는가
 *
 * **걸음**은 나눗셈이 실행된 횟수다. **기본 연산**은 나눗셈·곱셈·뺄셈·덧셈·비교·대입·
 * 절댓값을 각각 하나로 센 값이다. 두 계수를 따로 내는 이유는 두 설계가 **이 두 축에서 서로
 * 다른 방향으로 갈리기** 때문이다 — 중심 판은 걸음을 줄이는 대신 걸음마다 할 일을 늘린다.
 * 하나로 합치면 그 교환이 보이지 않는다.
 */

import { extendedEuclidean } from "./extendedEuclidean-guide.ref.ts";

const abs = (v: bigint): bigint => (v < 0n ? -v : v);

/** 피보나치 수 — 마지막 몫만 2 이고 나머지가 전부 1 인 입력을 만든다. */
function fib(n: number): bigint {
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return a;
}

/** 펠 수 — 몫이 전부 2 가 되는 입력을 만든다. `P(0)=1`, `P(1)=2`. */
function pell(k: number): bigint {
  let a = 1n;
  let b = 2n;
  for (let i = 0; i < k; i++) {
    const next = 2n * b + a;
    a = b;
    b = next;
  }
  return b;
}

/** 본문 표가 싣는 네 입력. 몫의 분포가 서로 다르다. */
const CASES: [string, bigint, bigint][] = [
  ["전개 입력", 510n, 183n],
  ["피보나치 이웃", fib(91), fib(90)],
  ["펠 수열 이웃", pell(48), pell(47)],
  ["큰 소수 쌍", 1_000_000_007n, 998_244_353n],
];

interface Counted {
  g: bigint;
  x: bigint;
  y: bigint;
  steps: number;
  ops: number;
}

/**
 * 이 가이드가 가르치는 절차 — 나머지를 0 이상으로 잡는다.
 *
 * 계수를 세는 자리는 정본과 같고, 여기에는 계수기만 덧붙였다. 정본은 걸음 수를 안
 * 내보내므로 세는 사본이 아니면 계수를 낼 방법이 없다.
 */
function byRemainder(a: bigint, b: bigint): Counted {
  let r0 = abs(a);
  let r1 = abs(b);
  let s0 = 1n;
  let s1 = 0n;
  let t0 = 0n;
  let t1 = 1n;
  let ops = 0;
  let steps = 0;
  while (r1 !== 0n) {
    ops += 1; // 반복 판정
    const q = r0 / r1;
    ops += 1; // 나눗셈
    steps += 1;
    const nr = r0 - q * r1;
    const ns = s0 - q * s1;
    const nt = t0 - q * t1;
    ops += 6; // 곱셈 3 · 뺄셈 3
    r0 = r1;
    r1 = nr;
    s0 = s1;
    s1 = ns;
    t0 = t1;
    t1 = nt;
    ops += 6; // 대입 6
  }
  ops += 1; // 반복을 끝내는 판정
  const sa = a < 0n ? -1n : 1n;
  const sb = b < 0n ? -1n : 1n;
  return { g: r0, x: sa * s0, y: sb * t0, steps, ops };
}

/**
 * 경쟁 설계 — **최소 절댓값 나머지 판**. 몫을 내림 대신 **반올림**해서 나머지를 나누는 수의
 * 절반 아래로 잡는다. 나머지가 음수가 될 수 있고, 그래서 나머지 수열 자체가 정본과 다르다.
 *
 * 한 걸음이 값을 적어도 절반으로 줄이므로 걸음 수가 정본 이하다. 대신 걸음마다 반올림
 * 판정이 붙고, 몫을 한 칸 옮긴 걸음에서는 보정까지 붙는다.
 */
function byCentered(a: bigint, b: bigint): Counted {
  let r0 = abs(a);
  let r1 = abs(b);
  let s0 = 1n;
  let s1 = 0n;
  let t0 = 0n;
  let t1 = 1n;
  let ops = 0;
  let steps = 0;
  while (r1 !== 0n) {
    ops += 1; // 반복 판정
    const d = abs(r1);
    ops += 1; // 절댓값
    let q = r0 / r1;
    ops += 1; // 나눗셈
    steps += 1;
    let nr = r0 - q * r1;
    ops += 2; // 곱셈 1 · 뺄셈 1
    ops += 2; // 곱셈 1 · 비교 1 — 나머지가 절반을 넘는가
    if (2n * abs(nr) > d) {
      const adjust = nr > 0n === r1 > 0n ? 1n : -1n;
      q += adjust;
      nr -= adjust * r1;
      ops += 4; // 부호 판정 1 · 덧셈 1 · 곱셈 1 · 뺄셈 1
    }
    const ns = s0 - q * s1;
    const nt = t0 - q * t1;
    ops += 4; // 곱셈 2 · 뺄셈 2
    r0 = r1;
    r1 = nr;
    s0 = s1;
    s1 = ns;
    t0 = t1;
    t1 = nt;
    ops += 6; // 대입 6
  }
  ops += 1; // 반복을 끝내는 판정
  const flip = r0 < 0n ? -1n : 1n;
  ops += 1; // 마지막 부호 보정
  const sa = a < 0n ? -1n : 1n;
  const sb = b < 0n ? -1n : 1n;
  return {
    g: flip * r0,
    x: sa * flip * s0,
    y: sb * flip * t0,
    steps,
    ops,
  };
}

/** 두 설계가 같은 답을 내는지 먼저 확인한다. 안 같으면 대조가 아니라 다른 것을 잰 것이다. */
function measure(
  a: bigint,
  b: bigint,
): { remainder: Counted; centered: Counted } {
  const remainder = byRemainder(a, b);
  const centered = byCentered(a, b);
  const want = extendedEuclidean(a, b);
  for (const [name, got] of [
    ["나머지 판", remainder],
    ["중심 판", centered],
  ] as [string, Counted][]) {
    if (got.g !== want.g || a * got.x + b * got.y !== got.g) {
      throw new Error(
        `${name} 의 답이 계약을 지키지 않는다 — g ${got.g} · x ${got.x} · y ${got.y} · 정본 g ${want.g}`,
      );
    }
  }
  return { remainder, centered };
}

/** 본문이 「계수의 절댓값은 안 갈린다」고 적은 자리의 근거. 넷 다 같아야 한다. */
export function coefficientsAgree(): boolean {
  for (const [, a, b] of CASES) {
    const { remainder, centered } = measure(a, b);
    if (abs(remainder.x) !== abs(centered.x)) return false;
    if (abs(remainder.y) !== abs(centered.y)) return false;
  }
  return true;
}

export const cases = {
  "나머지를 0 이상으로 잡는 판": () => {
    const out: Record<string, number> = {};
    for (const [name, a, b] of CASES) {
      const got = measure(a, b).remainder;
      out[`${name} 걸음`] = got.steps;
      out[`${name} 기본 연산`] = got.ops;
    }
    return out;
  },
  "최소 절댓값 나머지로 잡는 판": () => {
    const out: Record<string, number> = {};
    for (const [name, a, b] of CASES) {
      const got = measure(a, b).centered;
      out[`${name} 걸음`] = got.steps;
      out[`${name} 기본 연산`] = got.ops;
    }
    return out;
  },
};
