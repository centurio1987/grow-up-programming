/**
 * `purpose.alt` 의 수치 — L13. 같은 입력에 두 설계를 걸고 **모듈러 곱셈 횟수**와 **추가
 * 칸 수**를 센다. 벽시계는 쓰지 않는다 — 실행마다 값이 달라 P10 을 정의할 수 없다.
 *
 * 대조 상대는 **Pollard 의 rho** 다. 같은 이산로그를 풀지만 표를 만들지 않고, 값의 순환을
 * 찾아 지수를 역산한다. 곱셈은 더 많이 하고 저장은 상수라 **시간과 메모리를 맞바꾼 쪽**이다.
 *
 * **왜 전개 입력을 안 쓰는가**(L20). 전개는 `m = 58` 인데, 그 크기에서는 아기 걸음 표가
 * 8 항목이라 두 설계의 추가 칸이 18 대 6(수 하나 = 한 칸)이고, 표가 커질수록 차이가 벌어진다는 것을 확인할 수 없다. 대조는 `m = 10007` 을 쓰고
 * 그 사실을 본문에도 적는다.
 *
 * **입력은 고정이다.** `p = 10007`(소수) · `a = 3`(곱셈 위수 5003, 소수) · `k = 4321` 로
 * 두고 `b = a^k mod p` 를 생성식으로 만든다. rho 는 위수가 소수여야 역원 계산이 항상
 * 성립하므로 `a = 3` 을 골랐다 — 그 제약 자체가 본문이 적는 「내주는 것」이다.
 *
 * **추가 칸은 두 설계를 한 잣대로 잰다 — 수 하나가 한 칸이다.** 입력 밖에 새로 잡아 동시에 살아
 * 있는 수의 최댓값을 실행 중에 잰다. BSGS 는 아기 걸음 표의 항목 하나가 수 둘(값 · 지수)이라 두 칸이고,
 * 그 위에 걸음 사이로 넘기는 상태(표를 채울 때 `baby`, 보폭을 구할 때 `stride` · `base`, 큰 걸음 때
 * `stride` · `giant`)를 더한다. rho 는 걸음 사이로 넘기는 두 벌의 `(값, 지수, 지수)` 튜플 길이를 더한다.
 * 두 설계 모두 입력 · 반복 변수(`j` · `i` · `e`) · 한 걸음 안에서만 쓰는 임시 값은 뺀다. 모듈러 곱셈은
 * 법 `p` 위의 곱셈만 센다 — rho 의 지수 쪽 `mod q` 갱신은 세지 않는다.
 *
 * **바뀐 값**(L20, 2026-10-01 `KAN-062` 배치 4). 전에는 BSGS 를 표 항목 하나 = 한 칸(101)으로, rho 를
 * 재지 않고 적은 상수(6)로 셌다. 수 하나 = 한 칸으로 맞추고 둘 다 실행 중에 재면서 BSGS 추가 칸이
 * 101 → 204, rho 추가 칸이 6 → 6(이제 잰 값)이 됐다. 입력(`p` · `a` · `k`)과 모듈러 곱셈(155 · 408)은
 * 그대로다. rho 쪽에 유리해졌고(차이 95 → 198), 우열(곱셈은 BSGS, 추가 칸은 rho)과 뒤집히는 조건
 * (아기 걸음 표를 담을 수 있는가)은 그대로다.
 */
import type { BenchCase } from "../../../../tools/bench-alt.ts";

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

/** Baby-step Giant-step — 이 가이드가 가르치는 절차. 곱셈과 추가 칸을 센다. */
const bsgs: BenchCase = () => {
  const { p, a } = INPUT;
  const b = makeB();
  let mul = 0;

  const n = ceilSqrt(p);
  const table = new Map<bigint, bigint>();
  // 추가 칸 — 동시에 살아 있는 수의 최댓값. 표 항목 하나는 수 둘(값 · 지수)이다.
  let peak = 0;
  const live = (state: number) => {
    peak = Math.max(peak, table.size * 2 + state);
  };
  let baby = b % p;
  for (let j = 0n; j < n; j++) {
    table.set(baby, j);
    baby = (baby * a) % p;
    mul++;
    live(1); // baby
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
    live(2); // stride · base
  }

  let giant = 1n;
  for (let i = 1n; i <= n; i++) {
    giant = (giant * stride) % p;
    mul++;
    live(2); // stride · giant
    if (table.has(giant)) break;
  }

  return { "모듈러 곱셈": mul, "추가 칸": peak };
};

/**
 * Pollard 의 rho — 표 대신 순환을 찾는다.
 *
 * 값을 세 구역으로 나눠 각각 다른 갱신을 하고(`x·b` · `x²` · `x·a`), 같은 값이 두 경로에서
 * 나오는 지점을 Floyd 의 두 속도로 찾는다. 그 지점의 지수 두 벌을 빼면 `x` 가 나온다.
 * 걸음 사이로 넘기는 것은 두 벌의 `(값, 지수, 지수)` 뿐이고, 추가 칸은 그 튜플 길이의 합을 걸음마다
 * 재서 최댓값을 낸다.
 */
const pollardRho: BenchCase = () => {
  const { p, a, order: q } = INPUT;
  const b = makeB();
  let mul = 0;
  let peak = 0;

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
    // 추가 칸 — 걸음 사이로 넘기는 두 벌의 (값, 지수, 지수) 에 든 수의 개수.
    peak = Math.max(peak, slow.length + fast.length);
    if (slow[0] === fast[0]) break;
  }

  return { "모듈러 곱셈": mul, "추가 칸": peak };
};

export const cases: Record<string, BenchCase> = {
  "Baby-step Giant-step (이 가이드)": bsgs,
  "Pollard 의 rho": pollardRho,
};
