/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/bit-manipulation/singleNumberXor/singleNumberXor.ts` 는 학습자가
 * 채우는 자리라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고,
 * 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로
 * `acc ^= nums[i]` 한 줄을 바꾼다. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식을
 * 주석에 다시 적지 않는다.
 */

/**
 * 홀수 번 등장하는 유일한 원소를 돌려준다.
 *
 * 입력 `nums` 에서 정확히 한 값만 홀수 번 등장하고 나머지는 모두 짝수 번 등장한다.
 * `a ^ a === 0` 이고 `a ^ 0 === a` 이므로, 배열 전체를 XOR 로 겹치면 짝수 번 등장한 값은
 * 자기들끼리 상쇄되어 사라지고 홀수 번 등장한 값 하나만 남는다.
 *
 * JavaScript 의 `^` 는 피연산자를 32 비트 부호 있는 정수로 자른다. 이 문제의 제약이
 * `|nums[i]| < 2 ** 31` 이라 그 안에 있다.
 */
export function singleNumberXor(nums: number[]): number {
  // ① 항등원 0 에서 출발한다. 아직 아무 값도 겹치지 않은 상태다.
  let acc = 0;

  for (let i = 0; i < nums.length; i++) {
    // ② 아직 안 읽은 칸이 남아 있으면 한 칸 더 읽는다.
    // ③ 그 칸의 값을 acc 에 겹친다. 같은 값을 두 번째로 겹치면 그 값이 사라진다.
    acc ^= nums[i] as number;
  }

  // ④ 짝수 번 등장한 값은 전부 사라졌고 홀수 번 등장한 값 하나만 남아 있다.
  return acc;
}
