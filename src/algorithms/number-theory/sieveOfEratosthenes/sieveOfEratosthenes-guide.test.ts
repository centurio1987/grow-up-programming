/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/sieveOfEratosthenes/sieveOfEratosthenes.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스의 **입출력**(상한 10^6 에서의 반환값)은 아래에서 개수와 마지막 값으로 따로
 * 확인한다.
 */
import { expect, test } from "bun:test";
import { sieveOfEratosthenes } from "./sieveOfEratosthenes-guide.ref.ts";

const CASES: [number, number[]][] = [
  // 기본 동작
  [10, [2, 3, 5, 7]],
  [20, [2, 3, 5, 7, 11, 13, 17, 19]],
  [30, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]],
  // 엣지 케이스
  [0, []],
  [1, []],
  [2, [2]],
  [3, [2, 3]],
  [4, [2, 3]],
  [7, [2, 3, 5, 7]],
];

for (const [n, want] of CASES) {
  test(`정본 — 상한 ${n}`, () => {
    expect(sieveOfEratosthenes(n)).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.origin`·`deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 상한을 쓴다.
  expect(sieveOfEratosthenes(30)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
});

const COUNTS: [number, number][] = [
  [100, 25],
  [1_000, 168],
  [10_000, 1_229],
];

for (const [n, count] of COUNTS) {
  test(`상한 ${n} 의 소수 개수`, () => {
    expect(sieveOfEratosthenes(n).length).toBe(count);
  });
}

test("상한 100,000 의 마지막 소수", () => {
  const primes = sieveOfEratosthenes(100_000);
  expect(primes[primes.length - 1]).toBe(99_991);
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const primes = sieveOfEratosthenes(1_000_000);
  expect(primes.length).toBe(78_498);
  expect(primes[0]).toBe(2);
  expect(primes[primes.length - 1]).toBe(999_983);
});

/** 정의를 그대로 옮긴 판정. 느리지만 기준이 된다. */
function isPrimeByDefinition(x: number): boolean {
  if (x < 2) return false;
  for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
  return true;
}

test("작은 상한 전수에서 정의를 그대로 옮긴 판정과 같은 답을 낸다", () => {
  for (let n = 0; n <= 300; n++) {
    const want: number[] = [];
    for (let x = 2; x <= n; x++) if (isPrimeByDefinition(x)) want.push(x);
    expect(sieveOfEratosthenes(n)).toEqual(want);
  }
});

test("답이 오름차순이고 중복이 없다", () => {
  const primes = sieveOfEratosthenes(10_000);
  for (let at = 1; at < primes.length; at++) {
    expect(primes[at] as number).toBeGreaterThan(primes[at - 1] as number);
  }
});

test("답에 든 수는 전부 소수이고 빠진 수는 전부 합성수다", () => {
  const n = 5_000;
  const primes = new Set(sieveOfEratosthenes(n));
  for (let x = 2; x <= n; x++) {
    expect(primes.has(x)).toBe(isPrimeByDefinition(x));
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본과 같은
 * 절차를 따라가며 남긴 걸음 기록(답은 정본과 대조한다) — 와 글자 그대로 같아야 한다. 다르면 리터럴을
 * 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./sieveOfEratosthenes-guide.sim.ts");
  const { simStepsFromRef } = await import(
    "./sieveOfEratosthenes-guide.fig.tsx"
  );
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.sieveWalk.steps)).toEqual(plain(simStepsFromRef()));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.sieveWalk.result).toBe(`[${sieveOfEratosthenes(30).join(", ")}]`);
});
