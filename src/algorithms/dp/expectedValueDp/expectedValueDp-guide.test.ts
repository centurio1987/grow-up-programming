/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/expectedValueDp/expectedValueDp.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(`N=1000, K=3500` 을 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스가 지키던 것은 **제약 상한에서도 절차가 끝난다**는 것이라
 * 반환값으로 다시 걸었다. 같은 규모의 비용은 「최악을 만드는 입력」이 연산 수로 진다.
 *
 * **원본에 없던 케이스 다섯을 더 걸었다.** ① 정확한 유리수 답과 상대 오차 안에서 같은가
 * ② 작은 입력 전수에서 시퀀스를 다 만들어 센 값과 같은가 ③ 본문이 세운 불변식이 걸음마다
 * 참인가 ④ 확률이 정확히 0 이나 1 이어야 하는 경계에서 그 값이 그대로 나오는가 ⑤ 임계값을
 * 하나씩 올릴 때 확률이 감소만 하는가.
 *
 * **판정은 유리수로 한다.** 답이 부동소수라 `toBe` 로 맞출 수 없는 자리는, 정확한 답을
 * `BigInt` 분수로 세고 상대 오차를 정수 나눗셈으로 내어 문턱과 견준다.
 */
import { expect, test } from "bun:test";
import {
  분수로,
  상대_오차,
  오차_눈금,
  정확한_행,
} from "./expectedValueDp-guide.alt.ts";
import { expectedValueDp } from "./expectedValueDp-guide.ref.ts";

const FACES = 6;

/** 정확한 꼬리 확률을 분수 `[분자, 분모]` 로. */
function 정확한_답(N: number, K: number): [bigint, bigint] {
  const 분모 = 6n ** BigInt(N);
  const 행 = 정확한_행(N);
  let ways = 0n;
  for (let s = Math.max(K, 0); s <= FACES * N; s++) ways += 행[s] as bigint;
  return [ways, 분모];
}

/** 상대 오차가 `10^-digits` 안인가. 답이 정확히 0 이면 반환값도 0 이어야 한다. */
function 오차_안인가(v: number, N: number, K: number, digits = 12): boolean {
  const [p, q] = 정확한_답(N, K);
  if (p === 0n) return v === 0;
  return 상대_오차(v, p, q) <= 오차_눈금 / 10n ** BigInt(digits);
}

/* ─────────────── 원본 테스트의 입출력 케이스 ─────────────── */

const 기본: [string, number, number, bigint, bigint][] = [
  ["N=1, K=1 — 모든 면이 1 이상이다", 1, 1, 1n, 1n],
  ["N=1, K=6 — 눈이 6 일 확률", 1, 6, 1n, 6n],
  ["N=1, K=4 — 4 이상일 확률", 1, 4, 1n, 2n],
  ["N=2, K=12 — 둘 다 6 일 확률", 2, 12, 1n, 36n],
  ["N=2, K=7 — 합이 7 이상일 확률", 2, 7, 21n, 36n],
  ["K=0 — 합은 언제나 0 이상이다", 5, 0, 1n, 1n],
  ["K=1 — 합은 언제나 1 이상이다", 3, 1, 1n, 1n],
  ["K 가 6N 과 같다", 3, 18, 1n, 216n],
  ["K 가 6N 보다 크다", 2, 13, 0n, 1n],
  ["K 가 N 보다 작거나 같다", 4, 4, 1n, 1n],
  ["N=1, K=0", 1, 0, 1n, 1n],
  ["N=1, K=7", 1, 7, 0n, 1n],
];

for (const [name, N, K, 분자, 분모] of 기본) {
  test(`기본 — ${name}`, () => {
    const v = expectedValueDp(N, K);
    if (분자 === 0n) expect(v).toBe(0);
    else expect(v).toBeCloseTo(Number(분자) / Number(분모), 10);
  });
}

test("바운더리 — 확률이 [0, 1] 안이다", () => {
  for (let k = 0; k <= 30; k++) {
    const v = expectedValueDp(5, k);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  }
});

test("바운더리 — 임계값이 1 늘면 확률이 줄기만 한다", () => {
  let prev = expectedValueDp(4, 0);
  for (let k = 1; k <= 24; k++) {
    const cur = expectedValueDp(4, k);
    expect(cur).toBeLessThanOrEqual(prev);
    prev = cur;
  }
});

test("성능 케이스가 지키던 것 — 제약 상한에서도 절차가 끝나고 값이 범위 안이다", () => {
  const v = expectedValueDp(1000, 3500);
  expect(v).toBeGreaterThan(0);
  expect(v).toBeLessThan(1);
  expect(오차_안인가(v, 1000, 3500)).toBe(true);
});

/* ─────────────── 더 건 케이스 다섯 ─────────────── */

test("① 정확한 유리수 답과 상대 오차 10^-12 안에서 같다", () => {
  for (const [N, K] of [
    [2, 10],
    [5, 20],
    [10, 40],
    [50, 200],
    [200, 800],
    [1000, 2000],
    [1000, 4000],
  ] as [number, number][]) {
    expect(오차_안인가(expectedValueDp(N, K), N, K)).toBe(true);
  }
});

test("② 시퀀스를 전부 만들어 센 값과 같다", () => {
  for (let N = 1; N <= 5; N++) {
    for (let K = 0; K <= FACES * N + 1; K++) {
      let made = 0;
      let hit = 0;
      const walk = (i: number, sum: number): void => {
        if (i === N) {
          made++;
          if (sum >= K) hit++;
          return;
        }
        for (let d = 1; d <= FACES; d++) walk(i + 1, sum + d);
      };
      walk(0, 0);
      expect(expectedValueDp(N, K)).toBeCloseTo(hit / made, 12);
    }
  }
});

test("③ 걸음마다 확률 합이 1 이고 칸이 [0, 1] 안이다", () => {
  const N = 60;
  const maxSum = FACES * N;
  let prev = new Float64Array(maxSum + 1);
  prev[0] = 1;
  for (let i = 1; i <= N; i++) {
    const curr = new Float64Array(maxSum + 1);
    for (let s = 1; s <= maxSum; s++) {
      let sum = 0;
      const from = s - FACES < 0 ? 0 : s - FACES;
      for (let u = from; u < s; u++) sum += prev[u] as number;
      curr[s] = sum / FACES;
    }
    prev = curr;
    let total = 0;
    for (let s = maxSum; s >= 0; s--) {
      const v = prev[s] as number;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      total += v;
    }
    expect(Math.abs(total - 1)).toBeLessThan(1e-12);
  }
});

test("④ 확률이 정확히 0 이나 1 인 경계에서 그 값이 그대로 나온다", () => {
  for (const N of [1, 4, 100, 1000]) {
    expect(expectedValueDp(N, N)).toBe(1);
    expect(expectedValueDp(N, 0)).toBe(1);
    expect(expectedValueDp(N, FACES * N + 1)).toBe(0);
  }
});

test("⑤ 배정밀도 값이 정확한 분수와 같은 자리에서만 갈린다", () => {
  // 부동소수는 언제나 `분자 / 2^k` 다. 그 분수로 되돌린 값이 원래 값과 같아야 한다.
  for (const [N, K] of [
    [2, 10],
    [3, 18],
    [1000, 3500],
  ] as [number, number][]) {
    const v = expectedValueDp(N, K);
    const [dn, dd] = 분수로(v);
    expect(Number(dn) / Number(dd)).toBe(v);
  }
});
