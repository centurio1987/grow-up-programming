import type { Frame } from "#guide-sim";

/**
 * `trace` 절과 **같은 입력**을 굴린다. 프레임 수는 `trace` 의 T# 단계 수(13)를 넘지 않는다.
 *
 * 두 패널을 함께 쓴다 — `matrix` 가 질의 재배열을, `array` 가 창의 이동을 보인다.
 * 이 편은 현행 가이드가 `keyValue` 단독으로 그린 자리인데, 실제로는 표와 배열로 그려진다.
 */
export const window = {
  view: ["matrix", "array"] as const,
  title: "mosAlgorithm([1,1,2,1,3], [[0,4],[0,2],[2,4],[1,3]])",
  result: "[3,2,3,2]",
  steps: [
    {
      title: "T0 질의를 재배열한다",
      detail:
        "block=2. (⌊l/block⌋, r) 로 정렬하면 Q1 → Q3 → Q0 → Q2 순이 된다.",
      matrix: [
        ["Q1", "0", "2", "0"],
        ["Q3", "1", "3", "0"],
        ["Q0", "0", "4", "0"],
        ["Q2", "2", "4", "1"],
      ],
      colLabels: ["질의", "l", "r", "블록"],
      array: [1, 1, 2, 1, 3],
    },
    {
      title: "T3 Q1[0,2] 도달",
      detail: "① 로 오른쪽을 세 칸 넓혔다. 창 [1 1 2], distinct=2.",
      matrix: [["Q1", "0", "2", "0"]],
      colLabels: ["질의", "l", "r", "블록"],
      array: [1, 1, 2, 1, 3],
      marked: [0, 1, 2],
      pointers: { curL: 0, curR: 2 },
    },
    {
      title: "T4 기록",
      detail: "out[1] = 2. 원래 질의 순서 자리에 넣는다.",
      matrix: [["Q1", "0", "2", "→ 2"]],
      colLabels: ["질의", "l", "r", "답"],
      array: [1, 1, 2, 1, 3],
      marked: [0, 1, 2],
    },
    {
      title: "T5~T6 Q3[1,3] 로",
      detail: "① 오른쪽 한 칸 넓히고 ② 왼쪽 한 칸 좁힌다. 두 칸만 움직였다.",
      matrix: [["Q3", "1", "3", "0"]],
      colLabels: ["질의", "l", "r", "블록"],
      array: [1, 1, 2, 1, 3],
      marked: [1, 2, 3],
      pointers: { curL: 1, curR: 3 },
    },
    {
      title: "T7 기록",
      detail: "out[3] = 2. 창 [1 2 1] 에서 서로 다른 값은 1 과 2.",
      matrix: [["Q3", "1", "3", "→ 2"]],
      colLabels: ["질의", "l", "r", "답"],
      array: [1, 1, 2, 1, 3],
      marked: [1, 2, 3],
    },
    {
      title: "T8~T9 Q0[0,4] 로",
      detail: "① 양쪽으로 한 칸씩 넓힌다. 3 이 새로 들어와 distinct=3.",
      matrix: [["Q0", "0", "4", "0"]],
      colLabels: ["질의", "l", "r", "블록"],
      array: [1, 1, 2, 1, 3],
      marked: [0, 1, 2, 3, 4],
      pointers: { curL: 0, curR: 4 },
    },
    {
      title: "T10 기록",
      detail: "out[0] = 3.",
      matrix: [["Q0", "0", "4", "→ 3"]],
      colLabels: ["질의", "l", "r", "답"],
      array: [1, 1, 2, 1, 3],
      marked: [0, 1, 2, 3, 4],
    },
    {
      title: "T11~T13 Q2[2,4] 로",
      detail:
        "② 왼쪽만 두 칸 좁힌다. 1 이 두 번 다 빠져야 distinct 가 줄어든다.",
      matrix: [["Q2", "2", "4", "→ 3"]],
      colLabels: ["질의", "l", "r", "답"],
      array: [1, 1, 2, 1, 3],
      marked: [2, 3, 4],
      pointers: { curL: 2, curR: 4 },
    },
  ] satisfies Frame[],
};
