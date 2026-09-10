/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(N=100,000 · Q=100,000 에서 답의 개수와 값)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import {
  type SegOp,
  segmentTreeRangeMin,
} from "./segmentTreeRangeMin-guide.ref.ts";

const CASES: [string, number[], SegOp[], number[]][] = [
  // 기본
  ["초기 최솟값 질의", [5, 3, 7, 1, 9], [{ type: "query", l: 0, r: 4 }], [1]],
  [
    "갱신 후 최솟값 변화",
    [5, 3, 7, 1, 9],
    [
      { type: "query", l: 0, r: 4 },
      { type: "update", i: 3, v: 100 },
      { type: "query", l: 0, r: 4 },
    ],
    [1, 3],
  ],
  [
    "부분 구간 질의",
    [5, 3, 7, 1, 9],
    [
      { type: "query", l: 2, r: 4 },
      { type: "update", i: 3, v: 100 },
      { type: "query", l: 2, r: 4 },
    ],
    [1, 7],
  ],
  // 엣지
  ["ops 가 비어 있다", [1, 2, 3], [], []],
  ["update 만 있다", [1, 2, 3], [{ type: "update", i: 0, v: 999 }], []],
  [
    "음수 값",
    [1, 2, 3],
    [
      { type: "update", i: 1, v: -1000 },
      { type: "query", l: 0, r: 2 },
    ],
    [-1000],
  ],
  [
    "모두 같은 값으로 갱신한 뒤",
    [10, 20, 30],
    [
      { type: "update", i: 0, v: 7 },
      { type: "update", i: 1, v: 7 },
      { type: "update", i: 2, v: 7 },
      { type: "query", l: 0, r: 2 },
    ],
    [7],
  ],
  // 바운더리
  [
    "N=1 단일 원소",
    [5],
    [
      { type: "query", l: 0, r: 0 },
      { type: "update", i: 0, v: 99 },
      { type: "query", l: 0, r: 0 },
    ],
    [5, 99],
  ],
  [
    "l=r 단일 인덱스 질의",
    [5, 3, 7, 1, 9],
    [{ type: "query", l: 2, r: 2 }],
    [7],
  ],
  ["전체 범위 질의", [5, 3, 7, 1, 9], [{ type: "query", l: 0, r: 4 }], [1]],
  // 문제 문서의 예시
  [
    "문제 문서 예시 — 갱신이 섞인 다섯 연산",
    [5, 2, 4, 1, 3],
    [
      { type: "query", l: 0, r: 4 },
      { type: "query", l: 0, r: 2 },
      { type: "update", i: 3, v: 10 },
      { type: "query", l: 0, r: 4 },
      { type: "query", l: 3, r: 4 },
    ],
    [1, 2, 2, 3],
  ],
  [
    "문제 문서 예시 — 음수 갱신",
    [1, 2, 3],
    [
      { type: "update", i: 1, v: -1000 },
      { type: "query", l: 0, r: 2 },
    ],
    [-1000],
  ],
];

for (const [name, A, ops, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(segmentTreeRangeMin([...A], [...ops])).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(
    segmentTreeRangeMin(
      [5, 2, 4, 1, 3],
      [
        { type: "query", l: 0, r: 4 },
        { type: "query", l: 0, r: 2 },
        { type: "update", i: 3, v: 10 },
        { type: "query", l: 0, r: 4 },
        { type: "query", l: 3, r: 4 },
      ],
    ),
  ).toEqual([1, 2, 2, 3]);
});

test("N=100,000 · Q=100,000 에서 답의 개수와 값", () => {
  const N = 100_000;
  const Q = 100_000;
  const A = Array.from({ length: N }, (_, i) => (i * 17) % 1009);
  const ops: SegOp[] = Array.from({ length: Q }, (_, i) =>
    i % 2 === 0
      ? { type: "update", i: i % N, v: (i % 50) - 25 }
      : { type: "query", l: 0, r: N - 1 },
  );
  const result = segmentTreeRangeMin(A, ops);
  expect(result.length).toBe(Q / 2);
  // 첫 질의 앞에 update(i=0, v=-25) 하나가 들어가므로 전체 최솟값이 -25 다.
  expect(result[0]).toBe(-25);
  expect(result[Q / 2 - 1]).toBe(-25);
});

test("배열 길이가 2 의 거듭제곱이 아니어도 노드 번호가 트리 배열 안에 있다", () => {
  // 노드 번호의 최댓값이 2N 을 넘는 첫 길이가 6 이다(「수식 정의와 유도」의 표).
  for (const N of [6, 10, 11, 12]) {
    const A = Array.from({ length: N }, (_, i) => N - i);
    const ops: SegOp[] = [
      { type: "update", i: N - 1, v: -1 },
      { type: "query", l: 0, r: N - 1 },
      { type: "query", l: 1, r: N - 2 },
    ];
    // 둘째 질의는 갱신한 칸을 빼므로 남은 것 중 가장 작은 값 2 가 답이다.
    expect(segmentTreeRangeMin(A, ops)).toEqual([-1, 2]);
  }
});
