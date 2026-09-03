/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/bit-manipulation/lowestSetBit/lowestSetBit.test.ts` 는 학습자가
 * 채우는 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스가 실제로 확인하던 것(`10^6` 번 호출해도 답이 어긋나지 않는다)은 아래 규모
 * 케이스가 벽시계 없이 그대로 확인한다.
 */
import { expect, test } from "bun:test";
import { lowestSetBit } from "./lowestSetBit-guide.ref.ts";

const CASES: [number, number][] = [
  // 기본 동작 — 문제 예시
  [12, 4],
  [6, 2],
  [1, 1],
  [2, 2],
  [16, 16],
  [0b10110, 2],
  [0b10000, 16],
  [0b101010, 2],
  // 엣지 케이스
  [0, 0],
  [-1, 1],
  [-12, 4],
  // 바운더리 — 32 비트 위쪽 끝
  [1 << 30, 1 << 30],
];

for (const [x, want] of CASES) {
  test(`정본 — lowestSetBit(${x})`, () => {
    expect(lowestSetBit(x)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(lowestSetBit(40)).toBe(8);
});

test("2 의 거듭제곱은 자기 자신을 돌려준다", () => {
  for (let k = 0; k < 30; k++) {
    const v = 1 << k;
    expect(lowestSetBit(v)).toBe(v);
  }
});

/** 정의를 그대로 옮긴 답. 2 로 나눌 수 있는 최대 횟수가 곧 자리 번호다. */
function answerByDefinition(x: number): number {
  if (x === 0) return 0;
  let p = 0;
  for (let t = Math.abs(x); t % 2 === 0; t /= 2) p++;
  return (2 ** p) | 0;
}

test("0 이상 2^16 미만 전수에서 정의가 낸 답과 같다", () => {
  for (let x = 0; x < 2 ** 16; x++) {
    expect(lowestSetBit(x)).toBe(answerByDefinition(x));
  }
});

test("1 비트가 자리 p 하나뿐인 입력 32 개에서 정의가 낸 답과 같다", () => {
  for (let p = 0; p < 32; p++) {
    const x = p === 31 ? -(2 ** 31) : 2 ** p;
    expect(lowestSetBit(x)).toBe(answerByDefinition(x));
    expect(lowestSetBit(-x)).toBe(answerByDefinition(-x));
  }
});

test("제약의 아래쪽 끝에서 답이 32 비트 정수의 부호 비트다", () => {
  // 2^31 은 32 비트 부호 있는 정수로 -2,147,483,648 이다. 제약 안에서 답이 음수인
  // 입력은 이것 하나뿐이다.
  expect(lowestSetBit(-(2 ** 31))).toBe(-(2 ** 31));
  let negatives = 0;
  for (let p = 0; p < 32; p++) {
    const x = p === 31 ? -(2 ** 31) : 2 ** p;
    if (lowestSetBit(x) < 0) negatives++;
  }
  expect(negatives).toBe(1);
});

test("제약의 위쪽 끝에서 자리 0 이 답이다", () => {
  expect(lowestSetBit(2 ** 31 - 1)).toBe(1);
});

test("규모 — 10^6 번 호출해도 정의가 낸 답과 어긋나지 않는다", () => {
  let mismatch = 0;
  for (let x = 1; x <= 1_000_000; x++) {
    if (lowestSetBit(x) !== answerByDefinition(x)) mismatch++;
  }
  expect(mismatch).toBe(0);
});

test("부호를 뒤집어도 자리 번호가 같다", () => {
  // -x 는 2^32 - x 이고, 2 로 나눌 수 있는 횟수가 x 와 같다.
  for (const x of [1, 2, 6, 12, 40, 1024, 2 ** 30]) {
    expect(lowestSetBit(-x)).toBe(lowestSetBit(x));
  }
});
