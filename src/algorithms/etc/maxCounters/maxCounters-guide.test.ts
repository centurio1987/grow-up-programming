/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/etc/maxCounters/maxCounters.test.ts` 는 학습자가 고쳐 쓰는 파일을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(N=M=100,000 혼합 연산)은 문제 서술을 그대로 옮긴 절차와 대조하는 것으로 남겼다.
 */
import { expect, test } from "bun:test";
import { maxCounters } from "./maxCounters-guide.ref.ts";

const CASES: [number, number[], number[]][] = [
  // 기본 동작 — 문제 예시
  [5, [3, 4, 4, 6, 1, 4, 4], [3, 2, 2, 4, 2]],
  // 최대 맞추기 없음
  [3, [1, 2, 3, 1], [2, 1, 1]],
  // 최대 맞추기만 있고 증가가 없다
  [3, [4, 4, 4], [0, 0, 0]],
  // 최대 맞추기가 맨 앞
  [2, [3, 1, 2], [1, 1]],
  // 최대 맞추기가 맨 뒤
  [3, [1, 2, 3, 4], [1, 1, 1]],
  // 최대 맞추기가 연달아 여러 번
  [3, [1, 4, 2, 4, 3], [2, 2, 3]],
  // 증가가 한 칸에 몰린다
  [3, [1, 1, 1, 4, 1], [4, 3, 3]],
  // 엣지 — N=1
  [1, [1], [1]],
  [1, [2], [0]],
  [1, [1, 1, 2, 1], [3]],
  // 바운더리 — M=1
  [3, [2], [0, 1, 0]],
];

for (const [N, A, want] of CASES) {
  test(`정본 — N=${N} · A=${JSON.stringify(A)}`, () => {
    expect(maxCounters(N, [...A])).toEqual(want);
  });
}

test("N=100,000 이 전부 최대 맞추기면 모두 0", () => {
  const N = 100_000;
  expect(maxCounters(N, new Array<number>(N).fill(N + 1))).toEqual(
    new Array<number>(N).fill(0),
  );
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(maxCounters(5, [3, 4, 4, 6, 1, 4, 4])).toEqual([3, 2, 2, 4, 2]);
});

test("혼합 연산에서 문제 서술 그대로의 절차와 답이 같다", () => {
  // 원본의 성능 케이스와 같은 생성식이되 규모만 줄였다 — 대조군이 N·M 이라
  // 100,000 에서는 대조 자체가 30 억 번을 넘는다. 그 규모는 위의 전부 최대 맞추기 케이스가 진다.
  const N = 2_000;
  const A = Array.from({ length: N }, (_, k) =>
    k % 3 === 0 ? N + 1 : (k % N) + 1,
  );

  // 문제 서술을 그대로 옮긴 절차. 느리지만 답은 정의 그대로다.
  const naive = (): number[] => {
    const c = new Array<number>(N).fill(0);
    let max = 0;
    for (const op of A) {
      if (op === N + 1) {
        c.fill(max);
        continue;
      }
      const i = op - 1;
      c[i] = (c[i] as number) + 1;
      if ((c[i] as number) > max) max = c[i] as number;
    }
    return c;
  };

  expect(maxCounters(N, A)).toEqual(naive());
});

test("최악을 만드는 입력도 답은 정확하다", () => {
  // perf.worst 가 드는 입력. 칸 쓰기가 가장 많은 것과 틀린 것은 다른 문제다.
  const N = 1_000;
  const A = [...new Array<number>(N - 1).fill(1), N + 1];
  expect(maxCounters(N, A)).toEqual(new Array<number>(N).fill(N - 1));
});
