import type { TablePlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `s = "abcde"` · `t = "ace"`.
 * `row12` 는 테두리를 까는 T1 과 i=1 · i=2 줄의 T2~T7, `row34` 는 i=3 · i=4 줄의 T8~T13, `row5` 는
 * i=5 줄의 T14~T16 과 답을 읽는 T17 이다. 한 벌에 모으면 정적 필름이 열일곱 장이라 줄 둘씩 가른다.
 * `result` 는 앞의 둘이 그 벌에서 마지막으로 다 채운 줄, `row5` 가 반환값이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "table"` 이
 * 2 차원 표 무대(`tableStage.ts`)를 고른다. 줄 머리는 `s` 의 글자, 열 머리는 `t` 의 글자다. `table` 은
 * 그 걸음이 끝난 뒤의 DP 테이블(아직 안 쓴 칸은 `null`), `write` 는 이번에 정한 칸, `read` 는 그 칸이
 * 읽은 이웃이다 — ③ 이면 왼쪽 위 하나, ④ 면 위와 왼쪽.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `longestCommonSubsequence-guide.test.ts` 가 잰다.
 */

export const row12 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0 · ∅", "i=1 · a", "i=2 · b", "i=3 · c", "i=4 · d", "i=5 · e"],
  colHeads: ["∅", "a", "c", "e"],
  colLabel: "t 의 글자",
  title: 'longestCommonSubsequence("abcde", "ace")',
  result: "[0, 1, 1, 1]",
  steps: [
    {
      title: "T1 테두리 = 0",
      text: "DP 테이블을 6 줄 × 4 칸으로 깔고 0 으로 채웁니다. 0 번째 줄은 s 가 빈 문자열, 0 번째 열은 t 가 빈 문자열인 자리라 그 9 칸은 정의에서 바로 0 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      write: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
      ],
      calc: {
        expr: "dp[0][j] = dp[i][0] =",
        result: "0",
      },
    },
    {
      title: "T2 dp[1][1] = 1 ③",
      text: "s[0] = 'a' 와 t[0] = 'a' 가 같아 ③ 입니다. 왼쪽 위 dp[0][0] = 0 에 1 을 더해 dp[1][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [[0, 0]],
      write: [[1, 1]],
      calc: {
        expr: "dp[0][0] + 1 = 0 + 1 =",
        result: "1",
      },
    },
    {
      title: "T3 dp[1][2] = 1 ④",
      text: "s[0] = 'a' 와 t[1] = 'c' 가 달라 ④ 입니다. 위 dp[0][2] = 0 과 왼쪽 dp[1][1] = 1 중 큰 쪽을 이어받아 dp[1][2] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [
        [0, 2],
        [1, 1],
      ],
      write: [[1, 2]],
      calc: {
        expr: "max(dp[0][2], dp[1][1]) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T4 dp[1][3] = 1 ④",
      text: "s[0] = 'a' 와 t[2] = 'e' 가 달라 ④ 입니다. 위 dp[0][3] = 0 과 왼쪽 dp[1][2] = 1 중 큰 쪽을 이어받아 dp[1][3] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [
        [0, 3],
        [1, 2],
      ],
      write: [[1, 3]],
      calc: {
        expr: "max(dp[0][3], dp[1][2]) = max(0, 1) =",
        result: "1",
      },
    },
    {
      title: "T5 dp[2][1] = 1 ④",
      text: "s[1] = 'b' 와 t[0] = 'a' 가 달라 ④ 입니다. 위 dp[1][1] = 1 과 왼쪽 dp[2][0] = 0 중 큰 쪽을 이어받아 dp[2][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, null, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [
        [1, 1],
        [2, 0],
      ],
      write: [[2, 1]],
      calc: {
        expr: "max(dp[1][1], dp[2][0]) = max(1, 0) =",
        result: "1",
      },
    },
    {
      title: "T6 dp[2][2] = 1 ④",
      text: "s[1] = 'b' 와 t[1] = 'c' 가 달라 ④ 입니다. 위 dp[1][2] = 1 과 왼쪽 dp[2][1] = 1 중 큰 쪽을 이어받아 dp[2][2] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, null],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [
        [1, 2],
        [2, 1],
      ],
      write: [[2, 2]],
      calc: {
        expr: "max(dp[1][2], dp[2][1]) = max(1, 1) =",
        result: "1",
      },
    },
    {
      title: "T7 dp[2][3] = 1 ④",
      text: "s[1] = 'b' 와 t[2] = 'e' 가 달라 ④ 입니다. 위 dp[1][3] = 1 과 왼쪽 dp[2][2] = 1 중 큰 쪽을 이어받아 dp[2][3] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, null, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [
        [1, 3],
        [2, 2],
      ],
      write: [[2, 3]],
      calc: {
        expr: "max(dp[1][3], dp[2][2]) = max(1, 1) =",
        result: "1",
      },
    },
  ],
} satisfies TablePlayerSpec;

export const row34 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0 · ∅", "i=1 · a", "i=2 · b", "i=3 · c", "i=4 · d", "i=5 · e"],
  colHeads: ["∅", "a", "c", "e"],
  colLabel: "t 의 글자",
  title: 'longestCommonSubsequence("abcde", "ace")',
  result: "[0, 1, 2, 2]",
  steps: [
    {
      title: "T8 dp[3][1] = 1 ④",
      text: "s[2] = 'c' 와 t[0] = 'a' 가 달라 ④ 입니다. 위 dp[2][1] = 1 과 왼쪽 dp[3][0] = 0 중 큰 쪽을 이어받아 dp[3][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, null, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [
        [2, 1],
        [3, 0],
      ],
      write: [[3, 1]],
      calc: {
        expr: "max(dp[2][1], dp[3][0]) = max(1, 0) =",
        result: "1",
      },
    },
    {
      title: "T9 dp[3][2] = 2 ③",
      text: "s[2] = 'c' 와 t[1] = 'c' 가 같아 ③ 입니다. 왼쪽 위 dp[2][1] = 1 에 1 을 더해 dp[3][2] = 2 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, null],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [[2, 1]],
      write: [[3, 2]],
      calc: {
        expr: "dp[2][1] + 1 = 1 + 1 =",
        result: "2",
      },
    },
    {
      title: "T10 dp[3][3] = 2 ④",
      text: "s[2] = 'c' 와 t[2] = 'e' 가 달라 ④ 입니다. 위 dp[2][3] = 1 과 왼쪽 dp[3][2] = 2 중 큰 쪽을 이어받아 dp[3][3] = 2 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, null, null, null],
        [0, null, null, null],
      ],
      read: [
        [2, 3],
        [3, 2],
      ],
      write: [[3, 3]],
      calc: {
        expr: "max(dp[2][3], dp[3][2]) = max(1, 2) =",
        result: "2",
      },
    },
    {
      title: "T11 dp[4][1] = 1 ④",
      text: "s[3] = 'd' 와 t[0] = 'a' 가 달라 ④ 입니다. 위 dp[3][1] = 1 과 왼쪽 dp[4][0] = 0 중 큰 쪽을 이어받아 dp[4][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, null, null],
        [0, null, null, null],
      ],
      read: [
        [3, 1],
        [4, 0],
      ],
      write: [[4, 1]],
      calc: {
        expr: "max(dp[3][1], dp[4][0]) = max(1, 0) =",
        result: "1",
      },
    },
    {
      title: "T12 dp[4][2] = 2 ④",
      text: "s[3] = 'd' 와 t[1] = 'c' 가 달라 ④ 입니다. 위 dp[3][2] = 2 와 왼쪽 dp[4][1] = 1 중 큰 쪽을 이어받아 dp[4][2] = 2 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, null],
        [0, null, null, null],
      ],
      read: [
        [3, 2],
        [4, 1],
      ],
      write: [[4, 2]],
      calc: {
        expr: "max(dp[3][2], dp[4][1]) = max(2, 1) =",
        result: "2",
      },
    },
    {
      title: "T13 dp[4][3] = 2 ④",
      text: "s[3] = 'd' 와 t[2] = 'e' 가 달라 ④ 입니다. 위 dp[3][3] = 2 와 왼쪽 dp[4][2] = 2 중 큰 쪽을 이어받아 dp[4][3] = 2 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, null, null, null],
      ],
      read: [
        [3, 3],
        [4, 2],
      ],
      write: [[4, 3]],
      calc: {
        expr: "max(dp[3][3], dp[4][2]) = max(2, 2) =",
        result: "2",
      },
    },
  ],
} satisfies TablePlayerSpec;

export const row5 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0 · ∅", "i=1 · a", "i=2 · b", "i=3 · c", "i=4 · d", "i=5 · e"],
  colHeads: ["∅", "a", "c", "e"],
  colLabel: "t 의 글자",
  title: 'longestCommonSubsequence("abcde", "ace")',
  result: "3",
  steps: [
    {
      title: "T14 dp[5][1] = 1 ④",
      text: "s[4] = 'e' 와 t[0] = 'a' 가 달라 ④ 입니다. 위 dp[4][1] = 1 과 왼쪽 dp[5][0] = 0 중 큰 쪽을 이어받아 dp[5][1] = 1 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, 1, null, null],
      ],
      read: [
        [4, 1],
        [5, 0],
      ],
      write: [[5, 1]],
      calc: {
        expr: "max(dp[4][1], dp[5][0]) = max(1, 0) =",
        result: "1",
      },
    },
    {
      title: "T15 dp[5][2] = 2 ④",
      text: "s[4] = 'e' 와 t[1] = 'c' 가 달라 ④ 입니다. 위 dp[4][2] = 2 와 왼쪽 dp[5][1] = 1 중 큰 쪽을 이어받아 dp[5][2] = 2 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, 1, 2, null],
      ],
      read: [
        [4, 2],
        [5, 1],
      ],
      write: [[5, 2]],
      calc: {
        expr: "max(dp[4][2], dp[5][1]) = max(2, 1) =",
        result: "2",
      },
    },
    {
      title: "T16 dp[5][3] = 3 ③",
      text: "s[4] = 'e' 와 t[2] = 'e' 가 같아 ③ 입니다. 왼쪽 위 dp[4][2] = 2 에 1 을 더해 dp[5][3] = 3 입니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, 1, 2, 3],
      ],
      read: [[4, 2]],
      write: [[5, 3]],
      calc: {
        expr: "dp[4][2] + 1 = 2 + 1 =",
        result: "3",
      },
    },
    {
      title: "T17 dp[5][3] = 3 반환",
      text: "오른쪽 아래 칸 dp[5][3] 를 읽어 3 을 돌려줍니다.",
      table: [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 2, 2],
        [0, 1, 2, 2],
        [0, 1, 2, 3],
      ],
      read: [[5, 3]],
      calc: {
        expr: "dp[5][3] =",
        result: "3",
      },
    },
  ],
} satisfies TablePlayerSpec;
