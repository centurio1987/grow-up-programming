/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/fastPower/fastPower.test.ts` 는 학습자가 채우는 파일을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**은 페르마의 소정리로 지수를 줄인 독립 계산과 대조해 확인한다.
 *
 * **원본의 「매우 큰 mod」 케이스는 기댓값이 실제 값과 다르다.** `2^60 = 1,152,921,504,606,846,976`
 * 이 법 `10^18 + 9 = 1,000,000,000,000,000,009` 보다 커서 나머지가 한 번 더 줄어든다.
 * 여기서는 실제 값을 쓰고, 같은 값이 `2n ** 60n % mod` 로도 나오는지 함께 본다.
 */
import { expect, test } from "bun:test";
import { fastPower } from "./fastPower-guide.ref.ts";

const CASES: [bigint, bigint, bigint, bigint][] = [
  // 기본 동작
  [2n, 10n, 1000n, 24n],
  [3n, 5n, 100n, 43n],
  [7n, 256n, 13n, 9n],
  // 엣지 케이스
  [123n, 0n, 1000n, 1n],
  [0n, 0n, 7n, 1n],
  [0n, 5n, 7n, 0n],
  [1n, 1_000_000n, 1000n, 1n],
  [5n, 100n, 1n, 0n],
  [1005n, 2n, 1000n, 25n],
  // 바운더리
  [123456789n, 1n, 1000000007n, 123456789n],
];

for (const [base, exp, mod, want] of CASES) {
  test(`정본 — ${base}^${exp} mod ${mod}`, () => {
    expect(fastPower(base, exp, mod)).toBe(want);
  });
}

test("페르마의 소정리 — 2^(p-1) ≡ 1 (mod p), p = 1000000007", () => {
  const p = 1000000007n;
  expect(fastPower(2n, p - 1n, p)).toBe(1n);
});

test("매우 큰 mod — 2^60 mod (10^18 + 9)", () => {
  const mod = 1000000000000000009n;
  expect(fastPower(2n, 60n, mod)).toBe(2n ** 60n % mod);
  expect(fastPower(2n, 60n, mod)).toBe(152921504606846967n);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(fastPower(3n, 26n, 1000n)).toBe(329n);
});

/** 차례로 곱하는 방법. 정의를 그대로 옮긴 것이라 답의 기준이 된다. */
function byRepeatedMultiply(base: bigint, exp: bigint, mod: bigint): bigint {
  let acc = 1n % mod;
  const b = ((base % mod) + mod) % mod;
  for (let i = 0n; i < exp; i++) acc = (acc * b) % mod;
  return acc;
}

test("작은 입력 전수에서 차례로 곱하는 방법과 같은 답을 낸다", () => {
  for (let base = -8n; base <= 8n; base++) {
    for (let exp = 0n; exp <= 12n; exp++) {
      for (const mod of [1n, 2n, 7n, 10n, 13n, 100n, 1000n]) {
        expect(fastPower(base, exp, mod)).toBe(
          byRepeatedMultiply(base, exp, mod),
        );
      }
    }
  }
});

test("반환값은 언제나 [0, mod) 안이다", () => {
  for (const base of [-1000n, -7n, 0n, 3n, 1005n]) {
    for (const exp of [0n, 1n, 26n, 1000n]) {
      for (const mod of [1n, 2n, 1000n, 1000000007n]) {
        const got = fastPower(base, exp, mod);
        expect(got >= 0n && got < mod).toBe(true);
      }
    }
  }
});

test("음수 밑을 법 안으로 옮긴다", () => {
  // -3 ≡ 2 (mod 5) 이므로 (-3)^3 ≡ 2^3 = 8 ≡ 3 (mod 5) 이다.
  expect(fastPower(-3n, 3n, 5n)).toBe(3n);
  expect(fastPower(-3n, 3n, 5n)).toBe(fastPower(2n, 3n, 5n));
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  // p 가 소수라 페르마의 소정리로 지수를 p-1 로 줄여 독립적으로 계산한다.
  const p = 1000000007n;
  const exp = 1_000_000_000_000_000_000n;
  expect(fastPower(2n, exp, p)).toBe(fastPower(2n, exp % (p - 1n), p));
  expect(fastPower(2n, exp, p)).toBe(719476260n);
});

test("지수가 2 의 거듭제곱이면 곱셈이 가장 적은 모양이다", () => {
  // 비트가 하나뿐인 지수 — 값 자체는 차례로 곱한 것과 같아야 한다.
  for (let k = 0n; k <= 20n; k++) {
    expect(fastPower(3n, 1n << k, 1000n)).toBe(
      byRepeatedMultiply(3n, 1n << k, 1000n),
    );
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./fastPower-guide.sim.ts");
  const { simStepsFromRef } = await import("./fastPower-guide.fig.tsx");
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.powBits.steps)).toEqual(plain(want.powBits));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.powBits.result).toBe(`${fastPower(3n, 26n, 1000n)}n`);
});
