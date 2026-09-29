import type { TablePlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `weights = [1, 3, 4, 5]` ·
 * `values = [1, 4, 5, 7]` · `W = 7`. `row1` 은 첫 줄을 까는 T1 과 i=1 줄의 T2~T9, `row2` 는 i=2 줄의
 * T10~T17, `row3` 은 i=3 줄의 T18~T25, `row4` 는 i=4 줄의 T26~T33 과 답을 읽는 T34 다. 한 벌에 모으면
 * 정적 필름이 서른네 장이라 줄마다 가른다. `result` 는 앞의 셋이 그 벌에서 다 채운 줄, `row4` 가 반환값이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "table"` 이
 * 2 차원 표 무대(`tableStage.ts`)를 고른다. `table` 은 그 걸음이 끝난 뒤의 DP 테이블(아직 안 쓴 칸은
 * `null`), `write` 는 이번에 정한 칸, `read` 는 그 칸이 읽은 윗 줄의 칸이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `knapsack01-guide.test.ts` 가 잰다.
 */

export const row1 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0", "i=1 · w1 v1", "i=2 · w3 v4", "i=3 · w4 v5", "i=4 · w5 v7"],
  colHeads: [0, 1, 2, 3, 4, 5, 6, 7],
  colLabel: "용량 c",
  title: "knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)",
  result: "[0, 1, 1, 1, 1, 1, 1, 1]",
  steps: [
    {
      title: "T1 i=0 줄 = 0",
      text: "DP 테이블을 5 줄 × 8 칸으로 만들고 0 으로 채웁니다. 고를 물건이 없는 i=0 줄은 [0 0 0 0 0 0 0 0] 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      write: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 6],
        [0, 7],
      ],
      calc: {
        expr: "dp[0][c] =",
        result: "0",
      },
    },
    {
      title: "T2 dp[1][0] = 0 ①",
      text: "w = 1 이고 0 < 1 이 참이라 ① 못 담습니다. dp[1][0] = dp[0][0] = 0 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[0, 0]],
      write: [[1, 0]],
      calc: {
        expr: "dp[0][0] =",
        result: "0",
      },
    },
    {
      title: "T3 dp[1][1] = 1 ③",
      text: "w = 1 이고 1 < 1 이 거짓이라 두 후보를 비교합니다. 두고 가면 0, 담으면 dp[0][0] + 1 = 1 이고 0 >= 1 이 거짓이라 ③ 담습니다. dp[1][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [0, 1],
        [0, 0],
      ],
      write: [[1, 1]],
      calc: {
        expr: "max(dp[0][1], dp[0][0] + 1) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T4 dp[1][2] = 1 ③",
      text: "w = 1 이고 2 < 1 이 거짓이라 두 후보를 비교합니다. 두고 가면 0, 담으면 dp[0][1] + 1 = 1 이고 0 >= 1 이 거짓이라 ③ 담습니다. dp[1][2] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [0, 2],
        [0, 1],
      ],
      write: [[1, 2]],
      calc: {
        expr: "max(dp[0][2], dp[0][1] + 1) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T5 dp[1][3] = 1 ③",
      text: "w = 1 이고 3 < 1 이 거짓이라 두 후보를 비교합니다. 두고 가면 0, 담으면 dp[0][2] + 1 = 1 이고 0 >= 1 이 거짓이라 ③ 담습니다. dp[1][3] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [0, 3],
        [0, 2],
      ],
      write: [[1, 3]],
      calc: {
        expr: "max(dp[0][3], dp[0][2] + 1) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T6 dp[1][4] = 1 ③",
      text: "w = 1 이고 4 < 1 이 거짓이라 두 후보를 비교합니다. 두고 가면 0, 담으면 dp[0][3] + 1 = 1 이고 0 >= 1 이 거짓이라 ③ 담습니다. dp[1][4] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [0, 4],
        [0, 3],
      ],
      write: [[1, 4]],
      calc: {
        expr: "max(dp[0][4], dp[0][3] + 1) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T7 dp[1][5] = 1 ③",
      text: "w = 1 이고 5 < 1 이 거짓이라 두 후보를 비교합니다. 두고 가면 0, 담으면 dp[0][4] + 1 = 1 이고 0 >= 1 이 거짓이라 ③ 담습니다. dp[1][5] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [0, 5],
        [0, 4],
      ],
      write: [[1, 5]],
      calc: {
        expr: "max(dp[0][5], dp[0][4] + 1) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T8 dp[1][6] = 1 ③",
      text: "w = 1 이고 6 < 1 이 거짓이라 두 후보를 비교합니다. 두고 가면 0, 담으면 dp[0][5] + 1 = 1 이고 0 >= 1 이 거짓이라 ③ 담습니다. dp[1][6] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [0, 6],
        [0, 5],
      ],
      write: [[1, 6]],
      calc: {
        expr: "max(dp[0][6], dp[0][5] + 1) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T9 dp[1][7] = 1 ③",
      text: "w = 1 이고 7 < 1 이 거짓이라 두 후보를 비교합니다. 두고 가면 0, 담으면 dp[0][6] + 1 = 1 이고 0 >= 1 이 거짓이라 ③ 담습니다. dp[1][7] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [0, 7],
        [0, 6],
      ],
      write: [[1, 7]],
      calc: {
        expr: "max(dp[0][7], dp[0][6] + 1) = max(0, 1) =",
        result: "1",
      },
    },
  ],
} satisfies TablePlayerSpec;

export const row2 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0", "i=1 · w1 v1", "i=2 · w3 v4", "i=3 · w4 v5", "i=4 · w5 v7"],
  colHeads: [0, 1, 2, 3, 4, 5, 6, 7],
  colLabel: "용량 c",
  title: "knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)",
  result: "[0, 1, 1, 4, 5, 5, 5, 5]",
  steps: [
    {
      title: "T10 dp[2][0] = 0 ①",
      text: "w = 3 이고 0 < 3 이 참이라 ① 못 담습니다. dp[2][0] = dp[1][0] = 0 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[1, 0]],
      write: [[2, 0]],
      calc: {
        expr: "dp[1][0] =",
        result: "0",
      },
    },
    {
      title: "T11 dp[2][1] = 1 ①",
      text: "w = 3 이고 1 < 3 이 참이라 ① 못 담습니다. dp[2][1] = dp[1][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[1, 1]],
      write: [[2, 1]],
      calc: {
        expr: "dp[1][1] =",
        result: "1",
      },
    },
    {
      title: "T12 dp[2][2] = 1 ①",
      text: "w = 3 이고 2 < 3 이 참이라 ① 못 담습니다. dp[2][2] = dp[1][2] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[1, 2]],
      write: [[2, 2]],
      calc: {
        expr: "dp[1][2] =",
        result: "1",
      },
    },
    {
      title: "T13 dp[2][3] = 4 ③",
      text: "w = 3 이고 3 < 3 이 거짓이라 두 후보를 비교합니다. 두고 가면 1, 담으면 dp[1][0] + 4 = 4 이고 1 >= 4 가 거짓이라 ③ 담습니다. dp[2][3] = 4 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [1, 3],
        [1, 0],
      ],
      write: [[2, 3]],
      calc: {
        expr: "max(dp[1][3], dp[1][0] + 4) = max(1, 4) =",
        result: "4",
      },
    },
    {
      title: "T14 dp[2][4] = 5 ③",
      text: "w = 3 이고 4 < 3 이 거짓이라 두 후보를 비교합니다. 두고 가면 1, 담으면 dp[1][1] + 4 = 5 이고 1 >= 5 가 거짓이라 ③ 담습니다. dp[2][4] = 5 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [1, 4],
        [1, 1],
      ],
      write: [[2, 4]],
      calc: {
        expr: "max(dp[1][4], dp[1][1] + 4) = max(1, 5) =",
        result: "5",
      },
    },
    {
      title: "T15 dp[2][5] = 5 ③",
      text: "w = 3 이고 5 < 3 이 거짓이라 두 후보를 비교합니다. 두고 가면 1, 담으면 dp[1][2] + 4 = 5 이고 1 >= 5 가 거짓이라 ③ 담습니다. dp[2][5] = 5 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [1, 5],
        [1, 2],
      ],
      write: [[2, 5]],
      calc: {
        expr: "max(dp[1][5], dp[1][2] + 4) = max(1, 5) =",
        result: "5",
      },
    },
    {
      title: "T16 dp[2][6] = 5 ③",
      text: "w = 3 이고 6 < 3 이 거짓이라 두 후보를 비교합니다. 두고 가면 1, 담으면 dp[1][3] + 4 = 5 이고 1 >= 5 가 거짓이라 ③ 담습니다. dp[2][6] = 5 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [1, 6],
        [1, 3],
      ],
      write: [[2, 6]],
      calc: {
        expr: "max(dp[1][6], dp[1][3] + 4) = max(1, 5) =",
        result: "5",
      },
    },
    {
      title: "T17 dp[2][7] = 5 ③",
      text: "w = 3 이고 7 < 3 이 거짓이라 두 후보를 비교합니다. 두고 가면 1, 담으면 dp[1][4] + 4 = 5 이고 1 >= 5 가 거짓이라 ③ 담습니다. dp[2][7] = 5 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [1, 7],
        [1, 4],
      ],
      write: [[2, 7]],
      calc: {
        expr: "max(dp[1][7], dp[1][4] + 4) = max(1, 5) =",
        result: "5",
      },
    },
  ],
} satisfies TablePlayerSpec;

export const row3 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0", "i=1 · w1 v1", "i=2 · w3 v4", "i=3 · w4 v5", "i=4 · w5 v7"],
  colHeads: [0, 1, 2, 3, 4, 5, 6, 7],
  colLabel: "용량 c",
  title: "knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)",
  result: "[0, 1, 1, 4, 5, 6, 6, 9]",
  steps: [
    {
      title: "T18 dp[3][0] = 0 ①",
      text: "w = 4 이고 0 < 4 가 참이라 ① 못 담습니다. dp[3][0] = dp[2][0] = 0 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[2, 0]],
      write: [[3, 0]],
      calc: {
        expr: "dp[2][0] =",
        result: "0",
      },
    },
    {
      title: "T19 dp[3][1] = 1 ①",
      text: "w = 4 이고 1 < 4 가 참이라 ① 못 담습니다. dp[3][1] = dp[2][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[2, 1]],
      write: [[3, 1]],
      calc: {
        expr: "dp[2][1] =",
        result: "1",
      },
    },
    {
      title: "T20 dp[3][2] = 1 ①",
      text: "w = 4 이고 2 < 4 가 참이라 ① 못 담습니다. dp[3][2] = dp[2][2] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[2, 2]],
      write: [[3, 2]],
      calc: {
        expr: "dp[2][2] =",
        result: "1",
      },
    },
    {
      title: "T21 dp[3][3] = 4 ①",
      text: "w = 4 이고 3 < 4 가 참이라 ① 못 담습니다. dp[3][3] = dp[2][3] = 4 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, null, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [[2, 3]],
      write: [[3, 3]],
      calc: {
        expr: "dp[2][3] =",
        result: "4",
      },
    },
    {
      title: "T22 dp[3][4] = 5 ②",
      text: "w = 4 이고 4 < 4 가 거짓이라 두 후보를 비교합니다. 두고 가면 5, 담으면 dp[2][0] + 5 = 5 이고 5 >= 5 가 참이라 ② 두고 갑니다. dp[3][4] = 5 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, null, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [2, 4],
        [2, 0],
      ],
      write: [[3, 4]],
      calc: {
        expr: "max(dp[2][4], dp[2][0] + 5) = max(5, 5) =",
        result: "5",
      },
    },
    {
      title: "T23 dp[3][5] = 6 ③",
      text: "w = 4 이고 5 < 4 가 거짓이라 두 후보를 비교합니다. 두고 가면 5, 담으면 dp[2][1] + 5 = 6 이고 5 >= 6 이 거짓이라 ③ 담습니다. dp[3][5] = 6 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, null, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [2, 5],
        [2, 1],
      ],
      write: [[3, 5]],
      calc: {
        expr: "max(dp[2][5], dp[2][1] + 5) = max(5, 6) =",
        result: "6",
      },
    },
    {
      title: "T24 dp[3][6] = 6 ③",
      text: "w = 4 이고 6 < 4 가 거짓이라 두 후보를 비교합니다. 두고 가면 5, 담으면 dp[2][2] + 5 = 6 이고 5 >= 6 이 거짓이라 ③ 담습니다. dp[3][6] = 6 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, null],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [2, 6],
        [2, 2],
      ],
      write: [[3, 6]],
      calc: {
        expr: "max(dp[2][6], dp[2][2] + 5) = max(5, 6) =",
        result: "6",
      },
    },
    {
      title: "T25 dp[3][7] = 9 ③",
      text: "w = 4 이고 7 < 4 가 거짓이라 두 후보를 비교합니다. 두고 가면 5, 담으면 dp[2][3] + 5 = 9 이고 5 >= 9 가 거짓이라 ③ 담습니다. dp[3][7] = 9 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [null, null, null, null, null, null, null, null],
      ],
      read: [
        [2, 7],
        [2, 3],
      ],
      write: [[3, 7]],
      calc: {
        expr: "max(dp[2][7], dp[2][3] + 5) = max(5, 9) =",
        result: "9",
      },
    },
  ],
} satisfies TablePlayerSpec;

export const row4 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0", "i=1 · w1 v1", "i=2 · w3 v4", "i=3 · w4 v5", "i=4 · w5 v7"],
  colHeads: [0, 1, 2, 3, 4, 5, 6, 7],
  colLabel: "용량 c",
  title: "knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7)",
  result: "9",
  steps: [
    {
      title: "T26 dp[4][0] = 0 ①",
      text: "w = 5 이고 0 < 5 가 참이라 ① 못 담습니다. dp[4][0] = dp[3][0] = 0 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, null, null, null, null, null, null, null],
      ],
      read: [[3, 0]],
      write: [[4, 0]],
      calc: {
        expr: "dp[3][0] =",
        result: "0",
      },
    },
    {
      title: "T27 dp[4][1] = 1 ①",
      text: "w = 5 이고 1 < 5 가 참이라 ① 못 담습니다. dp[4][1] = dp[3][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, null, null, null, null, null, null],
      ],
      read: [[3, 1]],
      write: [[4, 1]],
      calc: {
        expr: "dp[3][1] =",
        result: "1",
      },
    },
    {
      title: "T28 dp[4][2] = 1 ①",
      text: "w = 5 이고 2 < 5 가 참이라 ① 못 담습니다. dp[4][2] = dp[3][2] = 1 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, null, null, null, null, null],
      ],
      read: [[3, 2]],
      write: [[4, 2]],
      calc: {
        expr: "dp[3][2] =",
        result: "1",
      },
    },
    {
      title: "T29 dp[4][3] = 4 ①",
      text: "w = 5 이고 3 < 5 가 참이라 ① 못 담습니다. dp[4][3] = dp[3][3] = 4 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, null, null, null, null],
      ],
      read: [[3, 3]],
      write: [[4, 3]],
      calc: {
        expr: "dp[3][3] =",
        result: "4",
      },
    },
    {
      title: "T30 dp[4][4] = 5 ①",
      text: "w = 5 이고 4 < 5 가 참이라 ① 못 담습니다. dp[4][4] = dp[3][4] = 5 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, 5, null, null, null],
      ],
      read: [[3, 4]],
      write: [[4, 4]],
      calc: {
        expr: "dp[3][4] =",
        result: "5",
      },
    },
    {
      title: "T31 dp[4][5] = 7 ③",
      text: "w = 5 이고 5 < 5 가 거짓이라 두 후보를 비교합니다. 두고 가면 6, 담으면 dp[3][0] + 7 = 7 이고 6 >= 7 이 거짓이라 ③ 담습니다. dp[4][5] = 7 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, 5, 7, null, null],
      ],
      read: [
        [3, 5],
        [3, 0],
      ],
      write: [[4, 5]],
      calc: {
        expr: "max(dp[3][5], dp[3][0] + 7) = max(6, 7) =",
        result: "7",
      },
    },
    {
      title: "T32 dp[4][6] = 8 ③",
      text: "w = 5 이고 6 < 5 가 거짓이라 두 후보를 비교합니다. 두고 가면 6, 담으면 dp[3][1] + 7 = 8 이고 6 >= 8 이 거짓이라 ③ 담습니다. dp[4][6] = 8 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, 5, 7, 8, null],
      ],
      read: [
        [3, 6],
        [3, 1],
      ],
      write: [[4, 6]],
      calc: {
        expr: "max(dp[3][6], dp[3][1] + 7) = max(6, 8) =",
        result: "8",
      },
    },
    {
      title: "T33 dp[4][7] = 9 ②",
      text: "w = 5 이고 7 < 5 가 거짓이라 두 후보를 비교합니다. 두고 가면 9, 담으면 dp[3][2] + 7 = 8 이고 9 >= 8 이 참이라 ② 두고 갑니다. dp[4][7] = 9 입니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, 5, 7, 8, 9],
      ],
      read: [
        [3, 7],
        [3, 2],
      ],
      write: [[4, 7]],
      calc: {
        expr: "max(dp[3][7], dp[3][2] + 7) = max(9, 8) =",
        result: "9",
      },
    },
    {
      title: "T34 dp[4][7] = 9 반환",
      text: "오른쪽 아래 칸 dp[4][7] 를 읽어 9 를 돌려줍니다.",
      table: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 4, 5, 5, 5, 5],
        [0, 1, 1, 4, 5, 6, 6, 9],
        [0, 1, 1, 4, 5, 7, 8, 9],
      ],
      read: [[4, 7]],
      calc: {
        expr: "dp[4][7] =",
        result: "9",
      },
    },
  ],
} satisfies TablePlayerSpec;
