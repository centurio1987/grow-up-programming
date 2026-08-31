/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/bit-manipulation/enumerateSubmasks/enumerateSubmasks.test.ts` 는
 * 학습자가 채우는 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시
 * 건다. 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스의 **입출력**(길이 `2^20`, 첫 원소 `mask`, 마지막 원소 0)은 바운더리 케이스가
 * 그대로 확인한다.
 */
import { expect, test } from "bun:test";
import { enumerateSubmasks } from "./enumerateSubmasks-guide.ref.ts";

const CASES: [number, number[]][] = [
  // 기본 동작
  [0b1011, [11, 10, 9, 8, 3, 2, 1, 0]],
  [0b101, [5, 4, 1, 0]],
  [0b111, [7, 6, 5, 4, 3, 2, 1, 0]],
  [0b1000, [8, 0]],
  // 엣지 케이스
  [0, [0]],
  [1, [1, 0]],
];

for (const [mask, want] of CASES) {
  test(`정본 — enumerateSubmasks(0b${mask.toString(2)})`, () => {
    expect(enumerateSubmasks(mask)).toEqual(want);
  });
}

test("내림차순으로 정렬되어 있다", () => {
  const result = enumerateSubmasks(0b10110);
  for (let i = 1; i < result.length; i++) {
    expect(result[i - 1] as number).toBeGreaterThan(result[i] as number);
  }
});

test("모든 결과가 mask 의 서브마스크다 — (s & mask) === s", () => {
  const mask = 0b101101;
  for (const s of enumerateSubmasks(mask)) {
    expect((s & mask) === s).toBe(true);
  }
});

test("1 비트가 k 개면 결과 길이가 2^k 다", () => {
  expect(enumerateSubmasks(0b10110).length).toBe(2 ** 3);
});

test("중복 없이 유일한 값으로 구성된다", () => {
  const result = enumerateSubmasks(0b1111);
  expect(new Set(result).size).toBe(result.length);
});

test("바운더리 — mask = 2^20 − 1 이면 길이 2^20, 첫 원소 mask, 마지막 0", () => {
  const mask = 2 ** 20 - 1;
  const result = enumerateSubmasks(mask);
  expect(result.length).toBe(2 ** 20);
  expect(result[0]).toBe(mask);
  expect(result[result.length - 1]).toBe(0);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(enumerateSubmasks(0b1011)).toEqual([11, 10, 9, 8, 3, 2, 1, 0]);
});

/** 정의를 그대로 옮긴 답. 1 비트 자리의 부분집합을 전부 만들어 내림차순으로 놓는다. */
function submasksByDefinition(mask: number): number[] {
  const places: number[] = [];
  for (let m = mask, i = 0; m > 0; m = Math.floor(m / 2), i++) {
    if (m % 2 === 1) places.push(2 ** i);
  }
  let out = [0];
  for (const value of places) out = [...out, ...out.map((s) => s + value)];
  return out.sort((a, b) => b - a);
}

test("0 부터 2^12 까지 전수에서 정의가 낸 답과 같다", () => {
  for (let mask = 0; mask < 2 ** 12; mask++) {
    expect(enumerateSubmasks(mask)).toEqual(submasksByDefinition(mask));
  }
});

test("결과 길이는 언제나 2^popcount(mask) 다", () => {
  for (const mask of [0, 1, 0b1011, 0b10101010, 699_050, 2 ** 20 - 1]) {
    let k = 0;
    for (let m = mask; m > 0; m = Math.floor(m / 2)) k += m % 2;
    expect(enumerateSubmasks(mask).length).toBe(2 ** k);
  }
});

test("바퀴 수는 2^k − 1 이고 mask 의 크기와 무관하다", () => {
  // 1 비트가 하나뿐인 마스크는 크기와 상관없이 값 둘만 낸다.
  for (const shift of [0, 5, 10, 19, 20]) {
    expect(enumerateSubmasks(2 ** shift)).toEqual([2 ** shift, 0]);
  }
});
