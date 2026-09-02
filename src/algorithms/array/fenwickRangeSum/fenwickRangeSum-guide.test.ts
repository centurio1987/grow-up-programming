/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/fenwickRangeSum/fenwickRangeSum.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**
 * (N=100,000 · Q=100,000 에서 답의 개수와 값)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import {
  type FenwickOp,
  fenwickRangeSum,
} from "./fenwickRangeSum-guide.ref.ts";

const CASES: [string, number[], FenwickOp[], number[]][] = [
  // 기본
  ["초기 합 질의", [1, 2, 3, 4, 5], [{ type: "query", l: 0, r: 4 }], [15]],
  [
    "갱신 후 구간 합",
    [1, 2, 3, 4, 5],
    [
      { type: "update", i: 2, v: 10 },
      { type: "query", l: 0, r: 4 },
    ],
    [22],
  ],
  [
    "여러 갱신과 여러 질의",
    [1, 2, 3, 4, 5],
    [
      { type: "query", l: 1, r: 3 },
      { type: "update", i: 1, v: 10 },
      { type: "query", l: 1, r: 3 },
      { type: "update", i: 3, v: 0 },
      { type: "query", l: 0, r: 4 },
    ],
    [9, 17, 19],
  ],
  // 엣지
  ["ops 가 비어 있다", [1, 2, 3], [], []],
  ["update 만 있다", [1, 2, 3], [{ type: "update", i: 0, v: 99 }], []],
  [
    "음수 값 갱신",
    [1, 2, 3],
    [
      { type: "update", i: 0, v: -5 },
      { type: "query", l: 0, r: 2 },
    ],
    [0],
  ],
  [
    "같은 인덱스 두 번 갱신",
    [1, 2, 3],
    [
      { type: "update", i: 0, v: 5 },
      { type: "update", i: 0, v: 10 },
      { type: "query", l: 0, r: 0 },
    ],
    [10],
  ],
  // 바운더리
  ["N=1 단일 원소 질의", [7], [{ type: "query", l: 0, r: 0 }], [7]],
  [
    "l=r 단일 인덱스 질의",
    [1, 2, 3, 4, 5],
    [{ type: "query", l: 2, r: 2 }],
    [3],
  ],
  ["전체 범위 질의", [1, 2, 3, 4, 5], [{ type: "query", l: 0, r: 4 }], [15]],
  // 문제 문서의 예시
  [
    "문제 문서 예시 — 갱신이 섞인 네 연산",
    [1, 2, 3, 4, 5],
    [
      { type: "query", l: 0, r: 4 },
      { type: "update", i: 2, v: 10 },
      { type: "query", l: 0, r: 4 },
      { type: "query", l: 2, r: 3 },
    ],
    [15, 22, 14],
  ],
  [
    "문제 문서 예시 — 음수 갱신",
    [1, 2, 3],
    [
      { type: "update", i: 0, v: -5 },
      { type: "query", l: 0, r: 2 },
    ],
    [0],
  ],
];

for (const [name, A, ops, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(fenwickRangeSum([...A], [...ops])).toEqual(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(
    fenwickRangeSum(
      [1, 2, 3, 4, 5],
      [
        { type: "query", l: 0, r: 4 },
        { type: "update", i: 2, v: 10 },
        { type: "query", l: 0, r: 4 },
        { type: "query", l: 2, r: 3 },
      ],
    ),
  ).toEqual([15, 22, 14]);
});

test("입력 배열을 고치지 않는다", () => {
  const A = [1, 2, 3, 4, 5];
  fenwickRangeSum(A, [{ type: "update", i: 0, v: 99 }]);
  expect(A).toEqual([1, 2, 3, 4, 5]);
});

test("N=100,000 · Q=100,000 에서 답의 개수와 값", () => {
  const N = 100_000;
  const Q = 100_000;
  const A = new Array<number>(N).fill(1);
  const ops: FenwickOp[] = Array.from({ length: Q }, (_, i) =>
    i % 2 === 0
      ? { type: "update", i: i % N, v: (i % 100) - 50 }
      : { type: "query", l: 0, r: N - 1 },
  );
  const result = fenwickRangeSum(A, ops);
  expect(result.length).toBe(Q / 2);
  // 첫 질의 앞에 update(i=0, v=-50) 하나가 들어가 1 이 −50 으로 바뀐다.
  expect(result[0]).toBe(N - 1 - 50);
});

test("칸 번호가 2 의 거듭제곱이 아닌 길이에서도 배열 안에 있다", () => {
  for (const N of [6, 7, 10, 11, 12]) {
    const A = Array.from({ length: N }, (_, i) => i + 1);
    const whole = (N * (N + 1)) / 2;
    const ops: FenwickOp[] = [
      { type: "query", l: 0, r: N - 1 },
      { type: "update", i: N - 1, v: 0 },
      { type: "query", l: 0, r: N - 1 },
      { type: "query", l: 1, r: N - 2 },
    ];
    expect(fenwickRangeSum(A, ops)).toEqual([whole, whole - N, whole - N - 1]);
  }
});
