/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치를 실측하는 하네스 — L13.
 *
 * ```bash
 * bun run ../../../../tools/bench-alt.ts gcd-guide.alt.ts
 * bun run ../../../../tools/bench-alt.ts --check gcd-guide.alt.ts
 * ```
 *
 * ## 입력을 왜 전개 입력만 안 쓰는가
 *
 * 두 설계가 갈리는 축은 **입력의 2 성분과 자릿수**다. 전개 입력(273 · 441)은 그 둘을 다 작게
 * 잡은 값이라 갈리는 폭이 안 보인다. 그래서 전개 입력을 **한 줄로 그대로 두고** 성질이 다른
 * 셋을 더한다 — 나눗셈이 가장 많이 필요한 피보나치 이웃 쌍, 나눗셈 한 번에 끝나는 2 의 거듭제곱
 * 쌍, 공통 인수가 2 의 거듭제곱인 짝수 쌍이다. 넷 다 상수라 몇 번을 실행해도 같은 값이 나온다.
 *
 * ## 무엇을 세는가
 *
 * **기본 연산**은 나눗셈·시프트·뺄셈·비교·대입을 각각 하나로 센 값이다. **나눗셈**은 그중
 * `%` 연산만 따로 센 값이고, 두 설계가 갈리는 축이 그것이다 — `bigint` 나눗셈 한 번은 자릿수에
 * 비례하는 일이라 시프트 한 번과 같은 값으로 칠 수 없다. 어느 쪽이 적은지가 **기계마다 다르게
 * 정해지므로** 두 계수를 따로 낸다.
 */

import { gcd } from "./gcd-guide.ref.ts";

/** 피보나치 수 — 유클리드 호제법이 가장 많은 나눗셈을 하는 입력이다. */
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

/** 본문 표가 싣는 네 입력. 성질이 서로 다르다. */
const CASES: [string, bigint, bigint][] = [
  ["전개 입력", 273n, 441n],
  ["피보나치 이웃", fib(91), fib(90)],
  ["2 의 거듭제곱", 1n << 60n, 1n << 30n],
  ["공통 인수가 2 의 거듭제곱", (1n << 40n) * 3n, (1n << 40n) * 5n],
];

interface Counted {
  answer: bigint;
  ops: number;
  divisions: number;
}

/** 이 가이드가 가르치는 절차 — 나머지로 줄인다. */
function byEuclid(a: bigint, b: bigint): Counted {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  let ops = 0;
  let divisions = 0;
  while (y !== 0n) {
    ops += 1;
    const r = x % y;
    divisions += 1;
    ops += 1;
    x = y;
    y = r;
    ops += 2;
  }
  ops += 1;
  return { answer: x, ops, divisions };
}

/**
 * 경쟁 설계 — 이진 GCD(스타인 알고리즘). 나눗셈을 하나도 안 쓰고 **2 로 나누기(시프트)와
 * 빼기**만으로 같은 답을 낸다. 두 수의 공통 2 성분을 먼저 떼어 두고, 남은 홀수 쪽을 계속
 * 빼 나가며 짝수가 생길 때마다 2 로 나눈다.
 */
function byBinary(a: bigint, b: bigint): Counted {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  let ops = 0;
  if (x === 0n) return { answer: y, ops: 1, divisions: 0 };
  if (y === 0n) return { answer: x, ops: 2, divisions: 0 };

  // 두 수가 함께 갖는 2 성분을 먼저 떼어 둔다. 마지막에 다시 곱해 준다.
  let shift = 0n;
  while (((x | y) & 1n) === 0n) {
    x >>= 1n;
    y >>= 1n;
    shift += 1n;
    ops += 3;
  }
  ops += 1;

  while ((x & 1n) === 0n) {
    x >>= 1n;
    ops += 2;
  }
  ops += 1;

  do {
    while ((y & 1n) === 0n) {
      y >>= 1n;
      ops += 2;
    }
    ops += 1;
    ops += 1;
    if (x > y) {
      const t = x;
      x = y;
      y = t;
      ops += 3;
    }
    y -= x;
    ops += 2;
  } while (y !== 0n);
  ops += 1;

  return { answer: x << shift, ops: ops + 1, divisions: 0 };
}

/** 두 설계가 같은 답을 내는지 먼저 확인한다. 안 같으면 대조가 아니라 다른 문제를 잰 것이다. */
function measure(a: bigint, b: bigint): { euclid: Counted; binary: Counted } {
  const euclid = byEuclid(a, b);
  const binary = byBinary(a, b);
  const want = gcd(a, b);
  if (euclid.answer !== want || binary.answer !== want) {
    throw new Error(
      `두 설계의 답이 갈린다 — 호제법 ${euclid.answer} · 이진 ${binary.answer} · 정본 ${want}`,
    );
  }
  return { euclid, binary };
}

export const cases = {
  "나머지로 줄이는 유클리드 호제법": () => {
    const out: Record<string, number> = {};
    for (const [name, a, b] of CASES) {
      const got = measure(a, b).euclid;
      out[`${name} 기본 연산`] = got.ops;
      out[`${name} 나눗셈`] = got.divisions;
    }
    return out;
  },
  "시프트와 뺄셈만 쓰는 이진 GCD": () => {
    const out: Record<string, number> = {};
    for (const [name, a, b] of CASES) {
      const got = measure(a, b).binary;
      out[`${name} 기본 연산`] = got.ops;
      out[`${name} 나눗셈`] = got.divisions;
    }
    return out;
  },
};
