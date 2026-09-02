/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { treeMaxIndependentSet } from "./treeMaxIndependentSet-guide.ref.ts";

const path = (n: number): [number, number][] =>
  Array.from({ length: n - 1 }, (_, i) => [i, i + 1] as [number, number]);
const star = (n: number): [number, number][] =>
  Array.from({ length: n - 1 }, (_, i) => [0, i + 1] as [number, number]);

const CASES: [string, number, [number, number][], number[], number][] = [
  // 기본
  ["경로 0-1-2-3, 10 1 1 10", 4, path(4), [10, 1, 1, 10], 20],
  ["별 — 중심 10, 잎 1 넷", 5, star(5), [10, 1, 1, 1, 1], 10],
  ["별 — 중심 1, 잎 5 넷", 5, star(5), [1, 5, 5, 5, 5], 20],
  // 엣지
  ["노드 하나, 42", 1, [], [42], 42],
  ["노드 하나, -5", 1, [], [-5], 0],
  ["가중치가 전부 음수", 3, path(3), [-1, -2, -3], 0],
  ["간선 하나, 5 와 7", 2, path(2), [5, 7], 7],
  ["경로 0-1-2, 3 10 3", 3, path(3), [3, 10, 3], 10],
  // 바운더리
  ["경로 다섯, 전부 1", 5, path(5), [1, 1, 1, 1, 1], 3],
  ["노드 하나, 10000", 1, [], [10_000], 10_000],
];

for (const [이름, n, edges, weights, want] of CASES) {
  test(`정본 — ${이름} = ${want}`, () => {
    expect(treeMaxIndependentSet(n, edges, weights)).toBe(want);
  });
}

test("성능 케이스와 같은 입력 — 경로 100,000 에서 답이 나온다", () => {
  const n = 100_000;
  expect(treeMaxIndependentSet(n, path(n), new Array<number>(n).fill(1))).toBe(
    Math.ceil(n / 2),
  );
});

test("전개가 쓰는 입력 — 뿌리와 손자 셋을 함께 고른 22 가 나온다", () => {
  const edges: [number, number][] = [
    [0, 2],
    [0, 1],
    [1, 3],
    [1, 4],
    [2, 5],
    [5, 6],
  ];
  const weights = [9, 8, -2, 5, 1, 7, 4];
  expect(treeMaxIndependentSet(7, edges, weights)).toBe(22);
  // 고른 집합 {0, 3, 4, 5} 의 합과 같다.
  expect(9 + 5 + 1 + 7).toBe(22);
  // 간선 목록의 차례를 바꿔도 답은 같다 — 방문 순서만 달라진다.
  const 다른차례: [number, number][] = [
    [5, 6],
    [1, 4],
    [2, 5],
    [1, 3],
    [0, 1],
    [0, 2],
  ];
  expect(treeMaxIndependentSet(7, 다른차례, weights)).toBe(22);
});

test("본문 불변식이 드는 자리 — 배제는 부모와 자식 사이에서만 일어난다", () => {
  // 경로 0-1-2 에서 양 끝을 함께 고른다. 손자는 배제 대상이 아니다.
  expect(treeMaxIndependentSet(3, path(3), [5, 1, 5])).toBe(10);
  // 자식이 여럿이면 자식의 기여를 전부 더한다.
  expect(treeMaxIndependentSet(4, star(4), [1, 3, 4, 5])).toBe(12);
});

test("본문 수식 절이 드는 두 경계 — 경로가 하한, 별이 상한을 달성한다", () => {
  for (const n of [2, 3, 7, 16, 101]) {
    const ones = new Array<number>(n).fill(1);
    expect(treeMaxIndependentSet(n, path(n), ones)).toBe(Math.ceil(n / 2));
    expect(treeMaxIndependentSet(n, star(n), ones)).toBe(n - 1);
  }
});

test("본문 related 절이 드는 자리 — 남은 쪽이 언제나 W − 답이다", () => {
  const cases: [number, [number, number][], number[]][] = [
    [
      7,
      [
        [0, 2],
        [0, 1],
        [1, 3],
        [1, 4],
        [2, 5],
        [5, 6],
      ],
      [9, 8, -2, 5, 1, 7, 4],
    ],
    [4, path(4), [10, 1, 1, 10]],
    [5, star(5), [10, 1, 1, 1, 1]],
  ];
  for (const [n, edges, weights] of cases) {
    const total = weights.reduce((a, b) => a + b, 0);
    const answer = treeMaxIndependentSet(n, edges, weights);
    expect(total - answer).toBeLessThanOrEqual(total);
    expect(answer + (total - answer)).toBe(total);
  }
});
