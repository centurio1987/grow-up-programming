/**
 * `purpose.alt` 의 수치 — L13. 같은 입력에 두 설계를 걸고 **모듈러 곱셈 횟수**와 **저장
 * 항목 수**를 센다. 벽시계는 쓰지 않는다 — 실행마다 값이 달라 P10 을 정의할 수 없다.
 *
 * 대조 상대는 **Pollard 의 rho** 다. 같은 이산로그를 풀지만 표를 만들지 않고, 값의 순환을
 * 찾아 지수를 역산한다. 곱셈은 더 많이 하고 저장은 상수라 **시간과 메모리를 맞바꾼 쪽**이다.
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `m = 58` 인데, 그 크기에서는 아기 걸음 표가
 * 8칸이라 두 설계의 저장 항목이 8 대 6 으로 갈리지 않는다. 대조는 `m = 10007` 을 쓰고
 * 그 사실을 본문에도 적는다.
 *
 * **입력은 고정이다.** `p = 10007`(소수) · `a = 3`(곱셈 위수 5003, 소수) · `k = 4321` 로
 * 두고 `b = a^k mod p` 를 생성식으로 만든다. rho 는 위수가 소수여야 역원 계산이 항상
 * 성립하므로 `a = 3` 을 골랐다 — 그 제약 자체가 본문이 적는 「내주는 것」이다.
 */
import type { BenchCase } from "../../tools/bench-alt.ts";

/** 고정 입력 — 한 번 정하면 수치가 마음에 안 든다는 이유로 바꾸지 않는다. */
export const INPUT = { p: 10007n, a: 3n, k: 4321n, order: 5003n };

function makeB(): bigint {
  let b = 1n;
  for (let i = 0n; i < INPUT.k; i++) b = (b * INPUT.a) % INPUT.p;
  return b;
}

function ceilSqrt(m: bigint): bigint {
  if (m < 2n) return m;
  let x = m;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + m / x) / 2n;
  }
  return x * x === m ? x : x + 1n;
}

/** 시작 큰 걸음 — 이 가이드가 가르치는 절차. 곱셈과 표 칸을 센다. */
const bsgs: BenchCase = () => {
  const { p, a } = INPUT;
  const b = makeB();
  let mul = 0;

  const n = ceilSqrt(p);
  const table = new Map<bigint, bigint>();
  let baby = b % p;
  for (let j = 0n; j < n; j++) {
    table.set(baby, j);
    baby = (baby * a) % p;
    mul++;
  }

  // stride = a^n mod p — 지수를 이진 자리로 나눈 거듭제곱
  let stride = 1n;
  let base = a % p;
  let e = n;
  while (e > 0n) {
    if (e % 2n === 1n) {
      stride = (stride * base) % p;
      mul++;
    }
    base = (base * base) % p;
    mul++;
    e /= 2n;
  }

  let giant = 1n;
  for (let i = 1n; i <= n; i++) {
    giant = (giant * stride) % p;
    mul++;
    if (table.has(giant)) break;
  }

  return { "모듈러 곱셈": mul, "저장 항목": table.size };
};

/**
 * Pollard 의 rho — 표 대신 순환을 찾는다.
 *
 * 값을 세 구역으로 나눠 각각 다른 갱신을 하고(`x·b` · `x²` · `x·a`), 같은 값이 두 경로에서
 * 나오는 지점을 Floyd 의 두 속도로 찾는다. 그 지점의 지수 두 벌을 빼면 `x` 가 나온다.
 * 저장하는 것은 두 벌의 `(값, 지수, 지수)` 여섯 개뿐이다.
 */
const pollardRho: BenchCase = () => {
  const { p, a, order: q } = INPUT;
  const b = makeB();
  let mul = 0;

  const step = (
    x: bigint,
    al: bigint,
    be: bigint,
  ): [bigint, bigint, bigint] => {
    mul++;
    const branch = x % 3n;
    if (branch === 0n) return [(x * b) % p, al, (be + 1n) % q];
    if (branch === 1n) return [(x * x) % p, (2n * al) % q, (2n * be) % q];
    return [(x * a) % p, (al + 1n) % q, be];
  };

  // 시작점을 1 로 두면 x² 분기의 고정점이라 순환이 즉시 끝난다. a·b 에서 출발한다.
  let slow: [bigint, bigint, bigint] = [(a * b) % p, 1n, 1n];
  let fast: [bigint, bigint, bigint] = [(a * b) % p, 1n, 1n];
  for (let i = 0; i < 1_000_000; i++) {
    slow = step(...slow);
    fast = step(...step(...fast));
    if (slow[0] === fast[0]) break;
  }

  // 저장하는 것은 두 벌의 (값, 지수, 지수) 여섯 개다.
  return { "모듈러 곱셈": mul, "저장 항목": 6 };
};

export const cases: Record<string, BenchCase> = {
  "시작 큰 걸음 (이 가이드)": bsgs,
  "Pollard 의 rho": pollardRho,
};
