import type { TablePlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `coins = [1, 2, 5]` · `amount = 5`.
 * `row1` 은 첫 줄을 까는 T1 과 i=1 줄의 T2~T7, `row2` 는 i=2 줄의 T8~T13, `row3` 은 i=3 줄의
 * T14~T19 와 답을 읽는 T20 이다. 한 벌에 모으면 정적 필름이 스무 장이라 줄마다 가른다. `result` 는
 * 앞의 둘이 그 벌에서 다 채운 줄, `row3` 이 반환값이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "table"` 이
 * 2 차원 표 무대(`tableStage.ts`, KAN-058)를 고른다. `table` 은 그 걸음이 끝난 뒤의 DP 테이블(아직 안 쓴
 * 칸은 `null`), `write` 는 이번에 정한 칸, `read` 는 그 칸이 읽은 이웃이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `coinChangeWays-guide.test.ts` 가 잰다.
 */

export const row1 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0", "i=1 · c=1", "i=2 · c=2", "i=3 · c=5"],
  colHeads: [0, 1, 2, 3, 4, 5],
  colLabel: "금액 a",
  title: "coinChangeWays([1, 2, 5], 5)",
  result: "[1, 1, 1, 1, 1, 1]",
  steps: [
    {
      title: "T1 dp[0][0] = 1 ①",
      text: "DP 테이블을 4 줄 × 6 칸으로 만들고 0 으로 채운 뒤 dp[0][0] 에 1 을 둡니다. i=0 줄은 [1 0 0 0 0 0] 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      write: [[0, 0]],
      calc: {
        expr: "dp[0][0] =",
        result: "1",
      },
    },
    {
      title: "T2 dp[1][0] = 1 ②",
      text: "c = 1 이고 0 < 1 이 참이라 ② 윗 칸을 옮깁니다. dp[1][0] = dp[0][0] = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [[0, 0]],
      write: [[1, 0]],
      calc: {
        expr: "dp[0][0] =",
        result: "1",
      },
    },
    {
      title: "T3 dp[1][1] = 1 ③",
      text: "c = 1 이고 1 < 1 이 거짓이라 ③ 윗 칸과 같은 줄 1 칸 왼쪽을 더합니다. dp[1][1] = 0 + 1 = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [0, 1],
        [1, 0],
      ],
      write: [[1, 1]],
      calc: {
        expr: "dp[0][1] + dp[1][0] = 0 + 1 =",
        result: "1",
      },
    },
    {
      title: "T4 dp[1][2] = 1 ③",
      text: "c = 1 이고 2 < 1 이 거짓이라 ③ 윗 칸과 같은 줄 1 칸 왼쪽을 더합니다. dp[1][2] = 0 + 1 = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [0, 2],
        [1, 1],
      ],
      write: [[1, 2]],
      calc: {
        expr: "dp[0][2] + dp[1][1] = 0 + 1 =",
        result: "1",
      },
    },
    {
      title: "T5 dp[1][3] = 1 ③",
      text: "c = 1 이고 3 < 1 이 거짓이라 ③ 윗 칸과 같은 줄 1 칸 왼쪽을 더합니다. dp[1][3] = 0 + 1 = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [0, 3],
        [1, 2],
      ],
      write: [[1, 3]],
      calc: {
        expr: "dp[0][3] + dp[1][2] = 0 + 1 =",
        result: "1",
      },
    },
    {
      title: "T6 dp[1][4] = 1 ③",
      text: "c = 1 이고 4 < 1 이 거짓이라 ③ 윗 칸과 같은 줄 1 칸 왼쪽을 더합니다. dp[1][4] = 0 + 1 = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [0, 4],
        [1, 3],
      ],
      write: [[1, 4]],
      calc: {
        expr: "dp[0][4] + dp[1][3] = 0 + 1 =",
        result: "1",
      },
    },
    {
      title: "T7 dp[1][5] = 1 ③",
      text: "c = 1 이고 5 < 1 이 거짓이라 ③ 윗 칸과 같은 줄 1 칸 왼쪽을 더합니다. dp[1][5] = 0 + 1 = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [0, 5],
        [1, 4],
      ],
      write: [[1, 5]],
      calc: {
        expr: "dp[0][5] + dp[1][4] = 0 + 1 =",
        result: "1",
      },
    },
  ],
} satisfies TablePlayerSpec;

export const row2 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0", "i=1 · c=1", "i=2 · c=2", "i=3 · c=5"],
  colHeads: [0, 1, 2, 3, 4, 5],
  colLabel: "금액 a",
  title: "coinChangeWays([1, 2, 5], 5)",
  result: "[1, 1, 2, 2, 3, 3]",
  steps: [
    {
      title: "T8 dp[2][0] = 1 ②",
      text: "c = 2 이고 0 < 2 가 참이라 ② 윗 칸을 옮깁니다. dp[2][0] = dp[1][0] = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, null, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [[1, 0]],
      write: [[2, 0]],
      calc: {
        expr: "dp[1][0] =",
        result: "1",
      },
    },
    {
      title: "T9 dp[2][1] = 1 ②",
      text: "c = 2 이고 1 < 2 가 참이라 ② 윗 칸을 옮깁니다. dp[2][1] = dp[1][1] = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, null, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [[1, 1]],
      write: [[2, 1]],
      calc: {
        expr: "dp[1][1] =",
        result: "1",
      },
    },
    {
      title: "T10 dp[2][2] = 2 ③",
      text: "c = 2 이고 2 < 2 가 거짓이라 ③ 윗 칸과 같은 줄 2 칸 왼쪽을 더합니다. dp[2][2] = 1 + 1 = 2 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, null, null, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [1, 2],
        [2, 0],
      ],
      write: [[2, 2]],
      calc: {
        expr: "dp[1][2] + dp[2][0] = 1 + 1 =",
        result: "2",
      },
    },
    {
      title: "T11 dp[2][3] = 2 ③",
      text: "c = 2 이고 3 < 2 가 거짓이라 ③ 윗 칸과 같은 줄 2 칸 왼쪽을 더합니다. dp[2][3] = 1 + 1 = 2 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, null, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [1, 3],
        [2, 1],
      ],
      write: [[2, 3]],
      calc: {
        expr: "dp[1][3] + dp[2][1] = 1 + 1 =",
        result: "2",
      },
    },
    {
      title: "T12 dp[2][4] = 3 ③",
      text: "c = 2 이고 4 < 2 가 거짓이라 ③ 윗 칸과 같은 줄 2 칸 왼쪽을 더합니다. dp[2][4] = 1 + 2 = 3 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, null],
        [null, null, null, null, null, null],
      ],
      read: [
        [1, 4],
        [2, 2],
      ],
      write: [[2, 4]],
      calc: {
        expr: "dp[1][4] + dp[2][2] = 1 + 2 =",
        result: "3",
      },
    },
    {
      title: "T13 dp[2][5] = 3 ③",
      text: "c = 2 이고 5 < 2 가 거짓이라 ③ 윗 칸과 같은 줄 2 칸 왼쪽을 더합니다. dp[2][5] = 1 + 2 = 3 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [null, null, null, null, null, null],
      ],
      read: [
        [1, 5],
        [2, 3],
      ],
      write: [[2, 5]],
      calc: {
        expr: "dp[1][5] + dp[2][3] = 1 + 2 =",
        result: "3",
      },
    },
  ],
} satisfies TablePlayerSpec;

export const row3 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0", "i=1 · c=1", "i=2 · c=2", "i=3 · c=5"],
  colHeads: [0, 1, 2, 3, 4, 5],
  colLabel: "금액 a",
  title: "coinChangeWays([1, 2, 5], 5)",
  result: "4",
  steps: [
    {
      title: "T14 dp[3][0] = 1 ②",
      text: "c = 5 이고 0 < 5 가 참이라 ② 윗 칸을 옮깁니다. dp[3][0] = dp[2][0] = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, null, null, null, null, null],
      ],
      read: [[2, 0]],
      write: [[3, 0]],
      calc: {
        expr: "dp[2][0] =",
        result: "1",
      },
    },
    {
      title: "T15 dp[3][1] = 1 ②",
      text: "c = 5 이고 1 < 5 가 참이라 ② 윗 칸을 옮깁니다. dp[3][1] = dp[2][1] = 1 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, null, null, null, null],
      ],
      read: [[2, 1]],
      write: [[3, 1]],
      calc: {
        expr: "dp[2][1] =",
        result: "1",
      },
    },
    {
      title: "T16 dp[3][2] = 2 ②",
      text: "c = 5 이고 2 < 5 가 참이라 ② 윗 칸을 옮깁니다. dp[3][2] = dp[2][2] = 2 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, null, null, null],
      ],
      read: [[2, 2]],
      write: [[3, 2]],
      calc: {
        expr: "dp[2][2] =",
        result: "2",
      },
    },
    {
      title: "T17 dp[3][3] = 2 ②",
      text: "c = 5 이고 3 < 5 가 참이라 ② 윗 칸을 옮깁니다. dp[3][3] = dp[2][3] = 2 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, 2, null, null],
      ],
      read: [[2, 3]],
      write: [[3, 3]],
      calc: {
        expr: "dp[2][3] =",
        result: "2",
      },
    },
    {
      title: "T18 dp[3][4] = 3 ②",
      text: "c = 5 이고 4 < 5 가 참이라 ② 윗 칸을 옮깁니다. dp[3][4] = dp[2][4] = 3 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, 2, 3, null],
      ],
      read: [[2, 4]],
      write: [[3, 4]],
      calc: {
        expr: "dp[2][4] =",
        result: "3",
      },
    },
    {
      title: "T19 dp[3][5] = 4 ③",
      text: "c = 5 이고 5 < 5 가 거짓이라 ③ 윗 칸과 같은 줄 5 칸 왼쪽을 더합니다. dp[3][5] = 3 + 1 = 4 입니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, 2, 3, 4],
      ],
      read: [
        [2, 5],
        [3, 0],
      ],
      write: [[3, 5]],
      calc: {
        expr: "dp[2][5] + dp[3][0] = 3 + 1 =",
        result: "4",
      },
    },
    {
      title: "T20 dp[3][5] = 4 반환",
      text: "오른쪽 아래 칸 dp[3][5] 를 읽어 4 를 돌려줍니다.",
      table: [
        [1, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 2, 2, 3, 3],
        [1, 1, 2, 2, 3, 4],
      ],
      read: [[3, 5]],
      calc: {
        expr: "dp[3][5] =",
        result: "4",
      },
    },
  ],
} satisfies TablePlayerSpec;
