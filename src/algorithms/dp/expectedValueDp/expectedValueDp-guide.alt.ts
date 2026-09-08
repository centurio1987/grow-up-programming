/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치 — L13.
 *
 * 경쟁 설계는 **창의 합을 이어 쓰는 판**이다. 한 칸을 채울 때마다 직전 행의 여섯 칸을 새로
 * 더하는 대신, 한 칸 오른쪽으로 갈 때 새로 들어온 칸을 더하고 빠져나간 칸을 빼서 같은 합을
 * 유지한다. 답을 내는 식은 정본과 글자 그대로 같고 더하는 횟수만 줄어든다.
 *
 * 재는 것은 다섯이다. **전부 정수**여야 한다(`tools/bench-alt.ts` 가 그것을 검사한다).
 *
 * | 계수 | 무엇 |
 * | --- | --- |
 * | 표를 채우는 덧셈과 뺄셈 | 분포 표를 채우는 동안 한 실수 덧셈·뺄셈을 1 로 센다 |
 * | 나눗셈 | 면 수로 나누는 횟수 |
 * | 저장 칸 | 동시에 들고 있는 실수 칸 수의 최댓값 |
 * | 상대 오차가 10^-9 를 넘는 K 의 수 | 정확한 유리수 답과 견주어 센다 |
 * | 정확한 유효 자릿수의 최솟값 | 그 구간에서 가장 나쁜 자리의 유효 자릿수. 하나도 없으면 0 |
 * | 최악 상대 오차가 1 을 넘는 자릿수 | 상대 오차가 1 보다 크면 그 정수부의 자릿수. 아니면 0 |
 *
 * **자릿수를 둘로 갈라 둘 다 0 이상으로 둔 이유**: `tools/check-v2.ts:1501` 의 P10 이 본문에서
 * 숫자를 뽑을 때 쓰는 정규식이 「숫자와 쉼표만」이라 **부호를 안 읽는다.** 음수 계수를 내면 본문에
 * 그 값을 그대로 적어 두어도 「실측값이 본문에 없다」로 보고된다. 도구는 이 카드에서 고치지
 * 않으므로 계수 쪽을 0 이상으로 두었고, 두 값을 합치면 옛 하나와 같은 것을 말한다.
 *
 * **정확도 축은 유리수로 판정한다.** 이 문제의 답은 부동소수라 「같다」를 글자 대조로 정할 수
 * 없다. 그래서 정확한 답을 `BigInt` 분수 `w / 6^N` 로 따로 세고(`정확한_행`), 배정밀도 값도
 * 비트에서 정확한 분수로 바꿔(`분수로`) 상대 오차를 **정수 나눗셈 한 번**으로 낸다. 두 판을
 * 각각 그 정확한 값과 견주므로 실행 환경이 달라져도 판정이 흔들리지 않는다.
 *
 * **매 실행에서 답을 정본과 대조한다**(`검산()`). 계수만 세고 답을 안 맞추면 그 수치는
 * 아무것도 재지 않는다. 대조 허용 오차는 **상대 오차 10^-12** 이고, 그 값을 넘으면 던진다 —
 * 문제가 요구하는 10^-9 보다 세 자리 좁게 잡아, 정본이 계약을 겨우 통과하는 상태로 슬며시
 * 내려가는 것을 막는다.
 *
 * **입력이 전개 입력(`N = 2`, `K = 10`)과 다르다.** 두 판이 갈리는 축은 **반올림이 몇 번
 * 누적되는가**인데 행이 둘뿐이면 누적될 자리가 없어 축이 아예 안 보인다. 그래서 제약 상한
 * `N = 1000` 을 쓰고 `K` 를 스윕한다. 시드도 난수도 없고 입력이 `N` 과 `K` 뿐이라 몇 번을
 * 실행해도 같은 값이 나온다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/dp/expectedValueDp/expectedValueDp-guide.alt.ts
 */
import { expectedValueDp } from "./expectedValueDp-guide.ref.ts";

/* ────────────────────────── 공통 입력 ────────────────────────── */

/** 면 수. 문제의 주사위가 6 면이다. */
export const FACES = 6;

/** 제약 상한. 두 판이 갈리는 자리가 여기서만 보인다. */
export const N = 1000;

/** 최대 합. 분포 표의 열 수가 이 값 + 1 이다. */
export const MAX_SUM = FACES * N;

/** 대조 허용 오차 — 상대 오차 `10^-12`. 문제의 계약(`10^-9`)보다 세 자리 좁다. */
export const 허용_오차_자릿수 = 12;

/* ────────────────────── 정확한 답 — 유리수 ────────────────────── */

/**
 * `w[N][s]` — `N` 개의 눈의 합이 `s` 인 시퀀스 수. 정수라 창의 합을 이어 써도 뺄셈이
 * 정확하다. 반올림이 없는 자리라 이 사본은 두 판의 **채점 기준**으로만 쓴다.
 */
export function 정확한_행(n: number): bigint[] {
  const ms = FACES * n;
  let prev = new Array<bigint>(ms + 1).fill(0n);
  prev[0] = 1n;
  for (let i = 1; i <= n; i++) {
    const curr = new Array<bigint>(ms + 1).fill(0n);
    let win = 0n;
    for (let s = 1; s <= ms; s++) {
      win += prev[s - 1] as bigint;
      if (s - 1 - FACES >= 0) win -= prev[s - 1 - FACES] as bigint;
      curr[s] = win;
    }
    prev = curr;
  }
  return prev;
}

/** 배정밀도 값을 정확한 분수로. 부동소수는 언제나 `분자 / 2^k` 꼴이다. */
export function 분수로(d: number): [bigint, bigint] {
  if (d === 0) return [0n, 1n];
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, d);
  const bits = view.getBigUint64(0);
  const sign = bits >> 63n ? -1n : 1n;
  const biased = Number((bits >> 52n) & 0x7ffn);
  const frac = bits & 0xf_ffff_ffff_ffffn;
  const mantissa = biased === 0 ? frac : frac | (1n << 52n);
  const shift = biased === 0 ? -1074 : biased - 1075;
  const m = mantissa * sign;
  return shift >= 0 ? [m << BigInt(shift), 1n] : [m, 1n << BigInt(-shift)];
}

/** 자릿수 눈금 — 상대 오차를 `10^-SCALE` 단위 정수로 적는다. 값을 나눌 때 이 값을 쓴다. */
export const 오차_눈금 = 10n ** 60n;
const SCALE = 60n;

/** `|d − p/q| / (p/q)` 를 `10^-SCALE` 단위 정수로. `p` 가 0 이 아니어야 한다. */
export function 상대_오차(d: number, p: bigint, q: bigint): bigint {
  const [dn, dd] = 분수로(d);
  let diff = dn * q - p * dd;
  if (diff < 0n) diff = -diff;
  return (diff * 10n ** SCALE) / (p * dd);
}

/** `10^-SCALE` 단위 정수를 「10 의 몇 제곱 아래인가」로. 0 이면 자릿수를 넉넉히 준다. */
export function 유효_자릿수(scaled: bigint): number {
  if (scaled <= 0n) return Number(SCALE);
  return Number(SCALE) - scaled.toString().length;
}

/* ────────────────────────── 두 판 ────────────────────────── */

export interface Counter {
  /** 표를 채우는 동안의 실수 덧셈·뺄셈 횟수. */
  ops: number;
  /** 면 수로 나눈 횟수. */
  div: number;
  /** 동시에 들고 있는 실수 칸 수의 최댓값. */
  cells: number;
}

/** 정본과 같은 절차 — 직전 행의 여섯 칸을 칸마다 새로 더한다. */
export function 여섯_칸_판(c: Counter): Float64Array {
  let prev = new Float64Array(MAX_SUM + 1);
  prev[0] = 1;
  for (let i = 1; i <= N; i++) {
    const curr = new Float64Array(MAX_SUM + 1);
    for (let s = 1; s <= MAX_SUM; s++) {
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) {
        sum += prev[u] as number;
        c.ops++;
      }
      curr[s] = sum / FACES;
      c.div++;
    }
    prev = curr;
  }
  c.cells = 2 * (MAX_SUM + 1);
  return prev;
}

/** 경쟁 설계 — 창의 합을 이어 쓴다. 한 칸에 덧셈 하나와 뺄셈 하나뿐이다. */
export function 창_판(c: Counter): Float64Array {
  let prev = new Float64Array(MAX_SUM + 1);
  prev[0] = 1;
  for (let i = 1; i <= N; i++) {
    const curr = new Float64Array(MAX_SUM + 1);
    let win = 0;
    for (let s = 1; s <= MAX_SUM; s++) {
      win += prev[s - 1] as number;
      c.ops++;
      if (s - 1 - FACES >= 0) {
        win -= prev[s - 1 - FACES] as number;
        c.ops++;
      }
      curr[s] = win / FACES;
      c.div++;
    }
    prev = curr;
  }
  c.cells = 2 * (MAX_SUM + 1);
  return prev;
}

/** 마지막 행에서 합이 `K` 이상인 칸을 큰 쪽부터 더한다. 두 판이 같은 방식을 쓴다. */
export function 꼬리(row: Float64Array, K: number): number {
  let answer = 0;
  for (let s = MAX_SUM; s >= K; s--) answer += row[s] as number;
  return answer;
}

/* ────────────────────── 스윕과 채점 ────────────────────── */

const 정확 = 정확한_행(N);
const 분모 = 6n ** BigInt(N);
const 정확_꼬리: bigint[] = new Array<bigint>(MAX_SUM + 2).fill(0n);
for (let s = MAX_SUM; s >= 0; s--) {
  정확_꼬리[s] = (정확_꼬리[s + 1] as bigint) + (정확[s] as bigint);
}

/**
 * 채점 구간 — 정확한 답이 배정밀도 **정규수**인 `K` 전부. 그 아래는 배정밀도가 담을 수 있는
 * 값 자체가 성기어져서, 어느 판이 나쁜지가 아니라 형식의 한계가 재어진다.
 */
const 최소_정규수_분모 = 2n ** 1022n;
export const 채점_구간: number[] = (() => {
  const out: number[] = [];
  for (let K = N + 1; K <= MAX_SUM; K++) {
    const p = 정확_꼬리[K] as bigint;
    if (p * 최소_정규수_분모 < 분모) break;
    out.push(K);
  }
  return out;
})();

const 여섯_계수: Counter = { ops: 0, div: 0, cells: 0 };
const 창_계수: Counter = { ops: 0, div: 0, cells: 0 };
const 여섯_행 = 여섯_칸_판(여섯_계수);
const 창_행 = 창_판(창_계수);

export interface 채점 {
  /** 상대 오차가 `10^-9` 를 넘은 `K` 의 수. */
  넘긴_수: number;
  /** 그런 `K` 중 가장 작은 것. 없으면 0. */
  처음_넘긴_K: number;
  /** 가장 나쁜 자리의 유효 자릿수. 유효 자릿수가 하나도 없으면 0 이다. */
  최소_유효_자릿수: number;
  /** 최악 상대 오차가 1 보다 크면 그 정수부의 자릿수. 아니면 0. */
  초과_자릿수: number;
}

function 채점하다(row: Float64Array): 채점 {
  let 넘긴 = 0;
  let 처음 = 0;
  let 최악 = 0n;
  const 문턱 = 10n ** (SCALE - 9n);
  for (const K of 채점_구간) {
    const p = 정확_꼬리[K] as bigint;
    const v = 꼬리(row, K);
    const e = v <= 0 ? 10n ** SCALE : 상대_오차(v, p, 분모);
    if (e > 최악) 최악 = e;
    if (e > 문턱) {
      넘긴++;
      if (처음 === 0) 처음 = K;
    }
  }
  const 자릿수 = 유효_자릿수(최악);
  return {
    넘긴_수: 넘긴,
    처음_넘긴_K: 처음,
    최소_유효_자릿수: Math.max(0, 자릿수),
    초과_자릿수: Math.max(0, -자릿수),
  };
}

const 여섯_채점 = 채점하다(여섯_행);
const 창_채점 = 채점하다(창_행);

/**
 * **매 실행의 대조.** 세는 사본이 정본과 같은 답을 내는지, 그리고 정본이 정확한 유리수 답과
 * 허용 오차 안에서 맞는지를 확인한다. 어느 쪽이든 어긋나면 아래 계수는 아무것도 재지 않는다.
 */
export function 검산(): void {
  const 문턱 = 10n ** (SCALE - BigInt(허용_오차_자릿수));
  for (const K of [1001, 2000, 3500, 4500, 5000]) {
    const 사본 = 꼬리(여섯_행, K);
    const 본체 = expectedValueDp(N, K);
    if (사본 !== 본체) {
      throw new Error(
        `세는 사본이 정본과 다른 답을 냈다 — K=${K} 에서 ${사본} 대 ${본체}`,
      );
    }
    const p = 정확_꼬리[K] as bigint;
    if (p > 0n && 상대_오차(본체, p, 분모) > 문턱) {
      throw new Error(
        `정본이 허용 오차 10^-${허용_오차_자릿수} 를 넘었다 — K=${K}`,
      );
    }
  }
  for (const [n, K] of [
    [1, 1],
    [1, 7],
    [2, 12],
    [4, 4],
  ] as [number, number][]) {
    const row = 정확한_행(n);
    let ways = 0n;
    for (let s = K < 0 ? 0 : K; s <= FACES * n; s++) ways += row[s] as bigint;
    const want = Number((ways * 10n ** 18n) / 6n ** BigInt(n)) / 1e18;
    if (Math.abs(expectedValueDp(n, K) - want) > 1e-12) {
      throw new Error(`정본이 작은 입력에서 어긋났다 — N=${n}, K=${K}`);
    }
  }
}

검산();

/** 상대 오차 축에서 순서가 뒤집히는 `K`. 스윕이 낸 값이라 본문에 상수로 적지 않는다. */
export function 뒤집히는_자리(): number {
  return 창_채점.처음_넘긴_K;
}

/** 본문 표가 쓰는 대푯값 — `K` 하나에서 두 판이 낸 답과 정확한 답. */
export function 한_자리(K: number): {
  정확: bigint;
  분모: bigint;
  여섯: number;
  창: number;
} {
  return {
    정확: 정확_꼬리[K] as bigint,
    분모,
    여섯: 꼬리(여섯_행, K),
    창: 꼬리(창_행, K),
  };
}

export const cases = {
  "여섯 칸을 더하는 판": () => ({
    "표를 채우는 덧셈과 뺄셈": 여섯_계수.ops,
    나눗셈: 여섯_계수.div,
    "저장 칸": 여섯_계수.cells,
    "상대 오차가 10^-9 를 넘는 K 의 수": 여섯_채점.넘긴_수,
    "상대 오차가 처음 10^-9 를 넘는 K": 여섯_채점.처음_넘긴_K,
    "정확한 유효 자릿수의 최솟값": 여섯_채점.최소_유효_자릿수,
    "최악 상대 오차가 1 을 넘는 자릿수": 여섯_채점.초과_자릿수,
  }),
  "창의 합을 이어 쓰는 판": () => ({
    "표를 채우는 덧셈과 뺄셈": 창_계수.ops,
    나눗셈: 창_계수.div,
    "저장 칸": 창_계수.cells,
    "상대 오차가 10^-9 를 넘는 K 의 수": 창_채점.넘긴_수,
    "상대 오차가 처음 10^-9 를 넘는 K": 창_채점.처음_넘긴_K,
    "정확한 유효 자릿수의 최솟값": 창_채점.최소_유효_자릿수,
    "최악 상대 오차가 1 을 넘는 자릿수": 창_채점.초과_자릿수,
  }),
};
