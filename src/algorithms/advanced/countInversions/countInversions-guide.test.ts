/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/advanced/countInversions/countInversions.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(`N=100,000` 을 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스가 지키던 것은 **제약 상한에서도 절차가 끝나고 답이 맞는다**는
 * 것이라 반환값으로 다시 걸었다. 같은 규모의 비용은 「최악을 만드는 입력」이 연산 수로 진다.
 *
 * **원본에 없던 케이스 다섯을 더 걸었다.** ① 길이 1~8 의 모든 순열에서 정의를 그대로 옮긴
 * 두 겹 반복과 같은 답을 내는가 ② 값이 셋뿐이라 같은 값이 많은 배열 전수에서도 같은가
 * ③ 입력 배열을 바꾸지 않는가 ④ 답이 0 과 `N(N−1)/2` 사이이고 완전한 내림차순이 그 상한을
 * 정확히 내는가 ⑤ 인접한 두 칸만 맞바꿔 정렬할 때의 횟수와 같은가.
 */
import { expect, test } from "bun:test";
import { countInversions } from "./countInversions-guide.ref.ts";

/** 정의를 그대로 옮긴 두 겹 반복. 판정의 기준값이다. */
function 정의대로(arr: number[]): number {
  let c = 0;
  for (let p = 0; p < arr.length; p++) {
    for (let q = p + 1; q < arr.length; q++) {
      if ((arr[p] as number) > (arr[q] as number)) c++;
    }
  }
  return c;
}

/** 인접한 두 칸만 맞바꿔 오름차순으로 만들 때의 맞바꾼 횟수. */
function 인접교환(arr: number[]): number {
  const a = arr.slice();
  let swaps = 0;
  for (let end = a.length - 1; end > 0; end--) {
    for (let x = 0; x < end; x++) {
      if ((a[x] as number) > (a[x + 1] as number)) {
        const t = a[x] as number;
        a[x] = a[x + 1] as number;
        a[x + 1] = t;
        swaps++;
      }
    }
  }
  return swaps;
}

/* ─────────────── 원본 테스트의 입출력 케이스 ─────────────── */

const 기본: [string, number[], number][] = [
  ["[2,4,1,3,5] — 역순쌍 셋", [2, 4, 1, 3, 5], 3],
  ["이미 오름차순", [1, 2, 3, 4, 5], 0],
  ["완전한 내림차순 — N(N−1)/2", [5, 4, 3, 2, 1], 10],
  ["칸 하나", [42], 0],
  ["칸 둘 오름차순", [1, 2], 0],
  ["칸 둘 내림차순", [2, 1], 1],
  ["같은 값은 역순쌍이 아니다", [2, 2, 2], 0],
  ["같은 값이 섞인 배열", [3, 1, 2, 3, 1], 5],
  ["음수가 섞인 배열", [-1, -3, 0, -2], 3],
  ["빈 배열", [], 0],
];

for (const [name, arr, want] of 기본) {
  test(`기본 — ${name}`, () => {
    expect(countInversions(arr)).toBe(want);
  });
}

test("바운더리 — 칸 10,000 개 완전한 내림차순", () => {
  const N = 10_000;
  const arr = Array.from({ length: N }, (_, q) => N - q);
  expect(countInversions(arr)).toBe((N * (N - 1)) / 2);
});

test("성능 케이스가 지키던 것 — 제약 상한에서도 절차가 끝나고 답이 맞는다", () => {
  const N = 100_000;
  const arr = Array.from({ length: N }, (_, q) => N - q);
  expect(countInversions(arr)).toBe(4_999_950_000);
  expect(Number.isSafeInteger(countInversions(arr))).toBe(true);
});

/* ─────────────── 더 건 케이스 다섯 ─────────────── */

test("① 길이 1~8 의 모든 순열에서 정의대로 센 값과 같다", () => {
  function* 순열(a: number[]): Generator<number[]> {
    if (a.length <= 1) {
      yield a.slice();
      return;
    }
    for (let x = 0; x < a.length; x++) {
      const 나머지 = a.slice(0, x).concat(a.slice(x + 1));
      for (const p of 순열(나머지)) yield [a[x] as number, ...p];
    }
  }
  let 본것 = 0;
  for (let N = 1; N <= 8; N++) {
    const base = Array.from({ length: N }, (_, q) => q);
    for (const p of 순열(base)) {
      본것++;
      expect(countInversions(p)).toBe(정의대로(p));
    }
  }
  expect(본것).toBe(46_233);
});

test("② 값이 셋뿐인 길이 0~7 배열 전수에서도 같다", () => {
  let 본것 = 0;
  for (let N = 0; N <= 7; N++) {
    for (let code = 0; code < 3 ** N; code++) {
      const arr: number[] = [];
      let c = code;
      for (let x = 0; x < N; x++) {
        arr.push(c % 3);
        c = Math.floor(c / 3);
      }
      본것++;
      expect(countInversions(arr)).toBe(정의대로(arr));
    }
  }
  expect(본것).toBe(3_280);
});

test("③ 입력 배열을 바꾸지 않는다", () => {
  for (const arr of [
    [4, 1, 5, 2, 6, 3],
    [2, 2, 2, 2],
    [-1, -3, 0, -2],
  ]) {
    const 사본 = arr.slice();
    countInversions(arr);
    expect(arr).toEqual(사본);
  }
});

test("④ 답이 0 과 N(N−1)/2 사이이고 내림차순이 상한을 낸다", () => {
  for (const N of [2, 3, 8, 64, 1_024]) {
    const 상한 = (N * (N - 1)) / 2;
    const 오름 = Array.from({ length: N }, (_, q) => q);
    const 내림 = Array.from({ length: N }, (_, q) => N - 1 - q);
    const 생성식 = Array.from({ length: N }, (_, q) => (q * 7919) % 10_007);
    expect(countInversions(오름)).toBe(0);
    expect(countInversions(내림)).toBe(상한);
    const v = countInversions(생성식);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(상한);
  }
});

test("⑤ 인접한 두 칸만 맞바꿔 정렬할 때의 횟수와 같다", () => {
  for (const arr of [
    [4, 1, 5, 2, 6, 3],
    [1, 2, 3, 4, 5, 6],
    [6, 5, 4, 3, 2, 1],
    [2, 2, 2, 2],
    [3, 1, 2, 3, 1],
    Array.from({ length: 64 }, (_, q) => (q * 37) % 101),
  ]) {
    expect(countInversions(arr)).toBe(인접교환(arr));
  }
});
