/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 계수를 실측하는 하네스 — `L13`.
 *
 * 재는 것은 **모듈러 곱셈 횟수**와 **저장 칸 수** 둘이다. 둘 다 같은 입력에서 늘 같은 값이
 * 나오는 결정론적 계수다. 벽시계는 안 잰다 — 실행마다 달라 P10 이 정의되지 않는다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/number-theory/fastPower/fastPower-guide.alt.ts
 */

/** 창 너비. CPython `Objects/longobject.c` 의 `EXP_WINDOW_SIZE` 와 같은 값이다. */
const WINDOW = 5;

/**
 * 지수 생성식 — `exp(n) = (3^n mod 2^n) | 2^(n-1)`.
 *
 * 최상위 비트를 세워 **정확히 `n` 비트**로 맞추고, 나머지 비트는 3 의 거듭제곱이 정한다.
 * 규칙 하나로 정해지므로 독자가 같은 값을 다시 만들 수 있다.
 */
export function expOfBits(n: number): bigint {
  const nb = BigInt(n);
  return (3n ** nb % (1n << nb)) | (1n << (nb - 1n));
}

/** 전개 절이 쓰는 지수. 비트 다섯이다. */
export const WALK_EXP = 26n;

/** 제약 규모의 지수. 비트 예순이다. */
export const LIMIT_EXP = 10n ** 18n;

/** 큰 지수 — 비트 1,024. RSA 의 모듈러 거듭제곱이 다루는 규모다. */
export const BIG_EXP = expOfBits(1024);

const MOD = 1_000_000_007n;
const BASE = 3n;

/* ────────────────────────── 이진법 (이 글의 절차) ────────────────────────── */

/**
 * 이 글이 가르치는 절차 그대로에 계수만 덧붙인 것. 바퀴마다 제곱 한 번, 비트가 1 인 바퀴에
 * 누적 한 번이라 곱셈이 `n + s` 번이다.
 */
export function binaryCost(exp: bigint): number {
  let result = 1n % MOD;
  let b = ((BASE % MOD) + MOD) % MOD;
  let e = exp;
  let mults = 0;
  while (e > 0n) {
    if ((e & 1n) === 1n) {
      result = (result * b) % MOD;
      mults++;
    }
    b = (b * b) % MOD;
    mults++;
    e >>= 1n;
  }
  return mults;
}

/** 이진법이 실제로 내는 답. 두 설계가 같은 값을 내는지 확인하는 데 쓴다. */
export function binaryValue(exp: bigint): bigint {
  let result = 1n % MOD;
  let b = ((BASE % MOD) + MOD) % MOD;
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) result = (result * b) % MOD;
    b = (b * b) % MOD;
    e >>= 1n;
  }
  return result;
}

/* ────────────────────── 5 비트 슬라이딩 창 (경쟁 설계) ────────────────────── */

interface WindowRun {
  value: bigint;
  mults: number;
}

/**
 * 홀수 거듭제곱 표를 미리 만들어 두고 **비트를 최대 `WINDOW` 개씩 묶어** 처리한다.
 * 최상위 비트에서 시작해 아래로 내려간다.
 *
 * 표는 `base^1, base^3, …, base^(2^WINDOW − 1)` 의 `2^(WINDOW−1)` 칸이고, 이것을 만드는 데
 * 곱셈이 `2^(WINDOW−1)` 번 든다 — 제곱 한 번과 칸 하나씩 채우는 곱셈이다.
 */
export function windowRun(exp: bigint): WindowRun {
  let mults = 0;
  const b = ((BASE % MOD) + MOD) % MOD;

  // 표 만들기.
  const half = 1 << (WINDOW - 1);
  const table = new Array<bigint>(half);
  table[0] = b; // base^1
  const sq = (b * b) % MOD;
  mults++;
  for (let j = 1; j < half; j++) {
    table[j] = ((table[j - 1] as bigint) * sq) % MOD; // base^(2j+1)
    mults++;
  }

  const bits = exp === 0n ? "" : exp.toString(2);
  const n = bits.length;
  const bitAt = (i: number): number =>
    (bits[n - 1 - i] as string) === "1" ? 1 : 0;

  let result = 1n % MOD;
  let started = false;
  let i = n - 1;
  while (i >= 0) {
    if (bitAt(i) === 0) {
      if (started) {
        result = (result * result) % MOD;
        mults++;
      }
      i--;
      continue;
    }
    // 창의 아래 끝을 잡는다 — 끝 비트가 1 이어야 표의 홀수 칸을 쓴다.
    let l = Math.max(0, i - WINDOW + 1);
    while (bitAt(l) === 0) l++;
    let val = 0;
    for (let k = i; k >= l; k--) val = val * 2 + bitAt(k);
    if (started) {
      for (let k = 0; k < i - l + 1; k++) {
        result = (result * result) % MOD;
        mults++;
      }
      result = (result * (table[(val - 1) / 2] as bigint)) % MOD;
      mults++;
    } else {
      result = table[(val - 1) / 2] as bigint;
      started = true;
    }
    i = l - 1;
  }
  return { value: result, mults };
}

export function windowCost(exp: bigint): number {
  return windowRun(exp).mults;
}

/* ────────────────────────── 뒤집히는 자리 ────────────────────────── */

/**
 * 생성식 `exp(n)` 을 비트 수 `n` 을 1 부터 올려 가며 두 설계에 걸고, **창 쪽이 처음으로
 * 적어지는 비트 수**를 찾는다. 한 번 뒤집힌 뒤 다시 안 뒤집히는지도 함께 본다.
 */
export function crossoverBits(): number {
  let first = -1;
  for (let n = 1; n <= 400; n++) {
    const e = expOfBits(n);
    const win = windowCost(e) < binaryCost(e);
    if (win && first < 0) first = n;
    if (!win) first = -1;
  }
  return first;
}

export const cases = {
  이진법: () => ({
    "전개 입력 · 곱셈": binaryCost(WALK_EXP),
    "40 비트 · 곱셈": binaryCost(expOfBits(40)),
    "41 비트 · 곱셈": binaryCost(expOfBits(41)),
    "제약 규모 · 곱셈": binaryCost(LIMIT_EXP),
    "1,024 비트 · 곱셈": binaryCost(BIG_EXP),
    "저장 칸": 3,
  }),
  "5 비트 창": () => ({
    "전개 입력 · 곱셈": windowCost(WALK_EXP),
    "40 비트 · 곱셈": windowCost(expOfBits(40)),
    "41 비트 · 곱셈": windowCost(expOfBits(41)),
    "제약 규모 · 곱셈": windowCost(LIMIT_EXP),
    "1,024 비트 · 곱셈": windowCost(BIG_EXP),
    "저장 칸": (1 << (WINDOW - 1)) + 3,
  }),
  "뒤집히는 자리": () => ({ "지수 비트 수": crossoverBits() }),
};
