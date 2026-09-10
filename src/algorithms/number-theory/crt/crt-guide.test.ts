/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/number-theory/crt/crt.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(법 100 개를 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 그 케이스가 지키던 것은 **법이 많아도 절차가 끝난다**는 것이라 반환값으로
 * 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 나눗셈 횟수로 진다.
 *
 * **원본에 없던 케이스 다섯을 더 걸었다.** ① 작은 값 전수에서 정의대로의 답과 같은가
 * ② 조건 순서를 바꿔도 답이 같은가 ③ 본문이 세운 불변식이 걸음마다 참인가 ④ 배정밀도로는
 * 담을 수 없는 규모에서도 정확한가 ⑤ 나머지 표현을 되돌리는 대응이 일대일인가.
 */
import { expect, test } from "bun:test";
import { crt } from "./crt-guide.ref.ts";

const gcdBig = (a: bigint, b: bigint): bigint =>
  b === 0n ? a : gcdBig(b, a % b);

const lcmAll = (ms: bigint[]): bigint =>
  ms.reduce((acc, m) => (acc / gcdBig(acc, m)) * m, 1n);

/** 정의대로 — 주기 안을 전부 확인해 첫 해를 낸다. 작은 값 대조에만 쓴다. */
function bruteForce(
  remainders: bigint[],
  moduli: bigint[],
): { x: bigint; M: bigint } | null {
  const M = lcmAll(moduli);
  for (let x = 0n; x < M; x++) {
    let ok = true;
    for (let i = 0; i < moduli.length; i++) {
      const m = moduli[i] as bigint;
      const want = (((remainders[i] as bigint) % m) + m) % m;
      if (x % m !== want) {
        ok = false;
        break;
      }
    }
    if (ok) return { x, M };
  }
  return null;
}

const CASES: [string, bigint[], bigint[], bigint | null, bigint][] = [
  [
    "x≡2 (mod 3), x≡3 (mod 5), x≡2 (mod 7)",
    [2n, 3n, 2n],
    [3n, 5n, 7n],
    23n,
    105n,
  ],
  ["x≡1 (mod 2), x≡2 (mod 3)", [1n, 2n], [2n, 3n], 5n, 6n],
  ["x≡0 (mod 4), x≡3 (mod 5)", [0n, 3n], [4n, 5n], 8n, 20n],
  ["단일 합동식 x≡5 (mod 7)", [5n], [7n], 5n, 7n],
  [
    "서로소가 아닌데 호환 — x≡2 (mod 6), x≡2 (mod 4)",
    [2n, 2n],
    [6n, 4n],
    2n,
    12n,
  ],
  ["호환되지 않음 — x≡1 (mod 2), x≡0 (mod 2)", [1n, 0n], [2n, 2n], null, 2n],
  ["호환되지 않음 — x≡1 (mod 6), x≡2 (mod 4)", [1n, 2n], [6n, 4n], null, 12n],
  ["법 1 — 모든 입력이 정규화된다", [0n, 3n], [1n, 5n], 3n, 5n],
];

for (const [name, remainders, moduli, wantX, wantM] of CASES) {
  test(`정본 — ${name}`, () => {
    const got = crt(remainders, moduli);
    if (wantX === null) {
      expect(got).toBeNull();
      return;
    }
    expect(got).not.toBeNull();
    expect((got as { x: bigint }).x).toBe(wantX);
    expect((got as { M: bigint }).M).toBe(wantM);
  });
}

test("큰 모듈러 — 두 큰 소수", () => {
  const m1 = 1_000_000_007n;
  const m2 = 998_244_353n;
  const r1 = 12_345n;
  const r2 = 67_890n;
  const got = crt([r1, r2], [m1, m2]);
  expect(got).not.toBeNull();
  const { x, M } = got as { x: bigint; M: bigint };
  expect(x % m1).toBe(r1);
  expect(x % m2).toBe(r2);
  expect(M).toBe(m1 * m2);
});

test("여러 모듈러 (5개) 연쇄", () => {
  const moduli = [2n, 3n, 5n, 7n, 11n];
  const remainders = [1n, 2n, 3n, 4n, 5n];
  const got = crt(remainders, moduli);
  expect(got).not.toBeNull();
  const { x, M } = got as { x: bigint; M: bigint };
  expect(M).toBe(2n * 3n * 5n * 7n * 11n);
  for (let i = 0; i < moduli.length; i++) {
    expect(x % (moduli[i] as bigint)).toBe(remainders[i] as bigint);
  }
});

test("법 100 개 — 원본의 벽시계 케이스가 지키던 것을 반환값으로 다시 건다", () => {
  const small = [
    2n,
    3n,
    5n,
    7n,
    11n,
    13n,
    17n,
    19n,
    23n,
    29n,
    31n,
    37n,
    41n,
    43n,
    47n,
    53n,
    59n,
    61n,
    67n,
    71n,
    73n,
    79n,
    83n,
    89n,
    97n,
  ];
  const moduli: bigint[] = [];
  const remainders: bigint[] = [];
  for (let i = 0; i < 100; i++) {
    const m = small[i % small.length] as bigint;
    moduli.push(m);
    remainders.push(BigInt(i) % m);
  }
  const got = crt(remainders, moduli);
  // 같은 법이 네 번씩 나오고 나머지가 서로 달라 모순이다. 절차는 그것을 찾아 멈춘다.
  expect(got).toBeNull();
});

test("작은 값 전수 — 법 둘에서 정의대로의 답과 같다", () => {
  let checked = 0;
  let none = 0;
  for (let m1 = 1n; m1 <= 12n; m1++) {
    for (let m2 = 1n; m2 <= 12n; m2++) {
      for (let r1 = 0n; r1 < m1; r1++) {
        for (let r2 = 0n; r2 < m2; r2++) {
          const got = crt([r1, r2], [m1, m2]);
          const want = bruteForce([r1, r2], [m1, m2]);
          checked++;
          if (want === null) {
            none++;
            expect(got).toBeNull();
          } else {
            expect(got).toEqual(want);
          }
        }
      }
    }
  }
  expect(checked).toBe(6084);
  expect(none).toBe(1812);
});

test("작은 값 전수 — 법 셋에서 정의대로의 답과 같다", () => {
  let checked = 0;
  let none = 0;
  for (let m1 = 1n; m1 <= 8n; m1++) {
    for (let m2 = 1n; m2 <= 8n; m2++) {
      for (let m3 = 1n; m3 <= 8n; m3++) {
        for (let r1 = 0n; r1 < m1; r1++) {
          for (let r2 = 0n; r2 < m2; r2++) {
            for (let r3 = 0n; r3 < m3; r3++) {
              const got = crt([r1, r2, r3], [m1, m2, m3]);
              const want = bruteForce([r1, r2, r3], [m1, m2, m3]);
              checked++;
              if (want === null) {
                none++;
                expect(got).toBeNull();
              } else {
                expect(got).toEqual(want);
              }
            }
          }
        }
      }
    }
  }
  expect(checked).toBe(46656);
  expect(none).toBe(27588);
});

test("조건 순서를 바꿔도 답이 같다", () => {
  const remainders = [2n, 5n, 2n, 3n];
  const moduli = [6n, 9n, 4n, 5n];
  const base = crt(remainders, moduli);
  expect(base).not.toBeNull();
  const order = [
    [3, 2, 1, 0],
    [1, 3, 0, 2],
    [2, 0, 3, 1],
  ];
  for (const perm of order) {
    const got = crt(
      perm.map((i) => remainders[i] as bigint),
      perm.map((i) => moduli[i] as bigint),
    );
    expect(got).toEqual(base);
  }
});

test("나머지가 음수여도 계약의 범위 안에서 답이 나온다", () => {
  for (let a = -30n; a <= 30n; a++) {
    for (let b = -30n; b <= 30n; b++) {
      const got = crt([a, b], [7n, 11n]);
      expect(got).not.toBeNull();
      const { x, M } = got as { x: bigint; M: bigint };
      expect(M).toBe(77n);
      expect(x >= 0n && x < 77n).toBe(true);
      expect(x % 7n).toBe(((a % 7n) + 7n) % 7n);
      expect(x % 11n).toBe(((b % 11n) + 11n) % 11n);
    }
  }
});

test("본문이 세운 불변식이 걸음마다 참이다", () => {
  // 정본과 같은 절차에 상태를 덧붙여, 조건 하나를 읽을 때마다 셋을 확인한다.
  const remainders = [2n, 5n, 2n, 3n];
  const moduli = [6n, 9n, 4n, 5n];
  let checked = 0;
  for (let take = 1; take <= moduli.length; take++) {
    const got = crt(remainders.slice(0, take), moduli.slice(0, take));
    expect(got).not.toBeNull();
    const { x, M } = got as { x: bigint; M: bigint };
    expect(M).toBe(lcmAll(moduli.slice(0, take)));
    expect(x >= 0n && x < M).toBe(true);
    for (let i = 0; i < take; i++) {
      const m = moduli[i] as bigint;
      expect(x % m).toBe((remainders[i] as bigint) % m);
    }
    checked++;
  }
  expect(checked).toBe(4);
});

test("배정밀도로는 담을 수 없는 규모에서도 정확하다", () => {
  // 앞의 소수 열넷을 법으로 두면 주기가 2^53 을 넘는다. 본문 「수식 정의와 유도」의 자리다.
  const moduli = [
    2n,
    3n,
    5n,
    7n,
    11n,
    13n,
    17n,
    19n,
    23n,
    29n,
    31n,
    37n,
    41n,
    43n,
  ];
  const remainders = moduli.map((m) => m - 1n);
  const got = crt(remainders, moduli);
  expect(got).not.toBeNull();
  const { x, M } = got as { x: bigint; M: bigint };
  expect(M).toBe(lcmAll(moduli));
  expect(M > 9_007_199_254_740_992n).toBe(true);
  expect(x).toBe(M - 1n);
  for (const m of moduli) expect(x % m).toBe(m - 1n);
});

test("나머지 표현을 되돌리는 대응이 일대일이다", () => {
  const moduli = [3n, 5n, 7n];
  const M = 105n;
  const seen = new Set<string>();
  for (let x = 0n; x < M; x++) {
    const key = moduli.map((m) => (x % m).toString()).join(",");
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    const back = crt(
      moduli.map((m) => x % m),
      moduli,
    );
    expect(back).toEqual({ x, M });
  }
  expect(seen.size).toBe(105);
});
