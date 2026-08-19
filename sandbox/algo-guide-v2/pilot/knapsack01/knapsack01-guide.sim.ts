import type { Frame } from "#guide-sim";

/**
 * `trace` 절과 **같은 입력**을 굴린다. 프레임 수는 `trace` 의 T# 단계 수(9)를 넘지 않는다.
 *
 * `matrix` 단독으로 그린다 — 이 알고리즘의 상태는 표 하나가 전부이고, 배열 패널을 덧붙이면
 * 같은 값을 두 번 보이게 된다.
 */
export const table = {
  view: "matrix" as const,
  title: "knapsack01([1,3,4,5], [1,4,5,7], 7)",
  result: "9",
  steps: [
    {
      title: "T0 표를 깐다",
      detail:
        "dp[i][c] = 앞의 i 개만 놓고 골랐을 때 용량 c 로 얻는 최대 가치. 0 번째 줄은 물건이 없으니 전부 0.",
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 w1 v1", "i=2 w3 v4", "i=3 w4 v5", "i=4 w5 v7"],
      colLabels: ["c=0", "1", "2", "3", "4", "5", "6", "7"],
    },
    {
      title: "T1~T2 첫 줄 — 무게 1, 가치 1",
      detail:
        "c=0 은 ① (0 < 1). c≥1 은 ③ — 두고 가면 0, 담으면 dp[0][c-1]+1 = 1 이라 담는 쪽이 크다.",
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 w1 v1", "i=2 w3 v4", "i=3 w4 v5", "i=4 w5 v7"],
      colLabels: ["c=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [
        [1, 0],
        [1, 1],
      ] as [number, number][],
    },
    {
      title: "T3~T4 둘째 줄 — 무게 3, 가치 4",
      detail:
        "c=0..2 는 ① (용량 부족). c=3 에서 ③ — 두고 가면 1, 담으면 dp[1][0]+4 = 4.",
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 w1 v1", "i=2 w3 v4", "i=3 w4 v5", "i=4 w5 v7"],
      colLabels: ["c=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [
        [2, 2],
        [2, 3],
      ] as [number, number][],
    },
    {
      title: "T5~T6 셋째 줄 — ② 가 처음 나온다",
      detail:
        "c=4 에서 두고 가면 5, 담으면 dp[2][0]+5 = 5. 같으면 두고 간다(②). c=7 은 ③ — dp[2][3]+5 = 9.",
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [null, null, null, null, null, null, null, null],
      ],
      rowLabels: ["i=0 —", "i=1 w1 v1", "i=2 w3 v4", "i=3 w4 v5", "i=4 w5 v7"],
      colLabels: ["c=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [
        [3, 4],
        [3, 7],
      ] as [number, number][],
    },
    {
      title: "T7~T8 넷째 줄 — 마지막 물건은 안 담긴다",
      detail:
        "c=5 는 ③ (7 > 6). c=7 은 ② — 두고 가면 9, 담으면 dp[3][2]+7 = 8 이라 두고 가는 쪽이 크다.",
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, 5, 7, 8, 9],
      ],
      rowLabels: ["i=0 —", "i=1 w1 v1", "i=2 w3 v4", "i=3 w4 v5", "i=4 w5 v7"],
      colLabels: ["c=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [
        [4, 5],
        [4, 7],
      ] as [number, number][],
    },
    {
      title: "T9 오른쪽 아래를 읽는다",
      detail: "dp[4][7] = 9. 무게 3 짜리와 무게 4 짜리를 담은 값이다.",
      matrix: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, 5, 7, 8, 9],
      ],
      rowLabels: ["i=0 —", "i=1 w1 v1", "i=2 w3 v4", "i=3 w4 v5", "i=4 w5 v7"],
      colLabels: ["c=0", "1", "2", "3", "4", "5", "6", "7"],
      cells: [[4, 7]] as [number, number][],
    },
  ] satisfies Frame[],
};
