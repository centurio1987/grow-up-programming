import type { TablePlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `s = "horse"` · `t = "ros"`.
 * `row12` 는 테두리를 적는 T1 과 i=1 · i=2 줄의 T2~T7, `row34` 는 i=3 · i=4 줄의 T8~T13, `row5` 는
 * i=5 줄의 T14~T16 과 답을 읽는 T17 이다. 한 벌에 모으면 정적 필름이 열일곱 장이라 줄 둘씩 가른다.
 * `result` 는 앞의 둘이 그 벌에서 마지막으로 다 채운 줄, `row5` 가 반환값이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "table"` 이
 * 2 차원 표 무대(`tableStage.ts`)를 고른다. 줄 머리는 `s` 의 글자, 열 머리는 `t` 의 글자다. `table` 은
 * 그 걸음이 끝난 뒤의 DP 테이블(아직 안 쓴 칸은 `null`), `write` 는 이번에 정한 칸, `read` 는 그 칸이
 * 읽은 이웃이다 — ④ 이면 왼쪽 위 하나, ⑤ 면 왼쪽 위 · 위 · 왼쪽 셋.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `editDistance-guide.test.ts` 가 잰다.
 */

export const row12 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0 · ∅", "i=1 · h", "i=2 · o", "i=3 · r", "i=4 · s", "i=5 · e"],
  colHeads: ["∅", "r", "o", "s"],
  colLabel: "t 의 글자",
  title: 'editDistance("horse", "ros")',
  result: "[2, 2, 1, 2]",
  steps: [
    {
      title: "T1 테두리 = 지우기 · 넣기 비용",
      text: "DP 테이블을 6 줄 × 4 칸으로 깔고 테두리 9 칸을 적습니다. 0 번째 열은 t 가 빈 문자열이라 s 의 앞 i 글자를 지우는 비용 i, 0 번째 줄은 s 가 빈 문자열이라 t 의 앞 j 글자를 넣는 비용 j 입니다. 아래 끝 dp[5][0] = 5, 오른쪽 끝 dp[0][3] = 3 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, null, null, null],
        [2, null, null, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
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
      calc: { expr: "dp[5][0] = 5 · dp[0][3] =", result: "3" },
    },
    {
      title: "T2 dp[1][1] = 1 ⑤",
      text: "s[0] = 'h' 와 t[0] = 'r' 이 달라 ⑤ 입니다. 교체(왼쪽 위 dp[0][0]) 0 · 삭제(위 dp[0][1]) 1 · 삽입(왼쪽 dp[1][0]) 1 가운데 가장 작은 0 에 1 을 더해 dp[1][1] = 1 입니다. 가장 작은 후보는 교체 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, null, null],
        [2, null, null, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [
        [0, 0],
        [0, 1],
        [1, 0],
      ],
      write: [[1, 1]],
      calc: { expr: "min(0, 1, 1) + 1 =", result: "1" },
    },
    {
      title: "T3 dp[1][2] = 2 ⑤",
      text: "s[0] = 'h' 와 t[1] = 'o' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[0][1]) 1 · 삭제(위 dp[0][2]) 2 · 삽입(왼쪽 dp[1][1]) 1 가운데 가장 작은 1 에 1 을 더해 dp[1][2] = 2 입니다. 가장 작은 후보는 교체 · 삽입 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, null],
        [2, null, null, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [
        [0, 1],
        [0, 2],
        [1, 1],
      ],
      write: [[1, 2]],
      calc: { expr: "min(1, 2, 1) + 1 =", result: "2" },
    },
    {
      title: "T4 dp[1][3] = 3 ⑤",
      text: "s[0] = 'h' 와 t[2] = 's' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[0][2]) 2 · 삭제(위 dp[0][3]) 3 · 삽입(왼쪽 dp[1][2]) 2 가운데 가장 작은 2 에 1 을 더해 dp[1][3] = 3 입니다. 가장 작은 후보는 교체 · 삽입 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, null, null, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [
        [0, 2],
        [0, 3],
        [1, 2],
      ],
      write: [[1, 3]],
      calc: { expr: "min(2, 3, 2) + 1 =", result: "3" },
    },
    {
      title: "T5 dp[2][1] = 2 ⑤",
      text: "s[1] = 'o' 와 t[0] = 'r' 이 달라 ⑤ 입니다. 교체(왼쪽 위 dp[1][0]) 1 · 삭제(위 dp[1][1]) 1 · 삽입(왼쪽 dp[2][0]) 2 가운데 가장 작은 1 에 1 을 더해 dp[2][1] = 2 입니다. 가장 작은 후보는 교체 · 삭제 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, null, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [
        [1, 0],
        [1, 1],
        [2, 0],
      ],
      write: [[2, 1]],
      calc: { expr: "min(1, 1, 2) + 1 =", result: "2" },
    },
    {
      title: "T6 dp[2][2] = 1 ④",
      text: "s[1] = 'o' 와 t[1] = 'o' 가 같아 ④ 입니다. 왼쪽 위 dp[1][1] = 1 을 편집 없이 그대로 받아 dp[2][2] = 1 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, null],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [[1, 1]],
      write: [[2, 2]],
      calc: { expr: "dp[1][1] =", result: "1" },
    },
    {
      title: "T7 dp[2][3] = 2 ⑤",
      text: "s[1] = 'o' 와 t[2] = 's' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[1][2]) 2 · 삭제(위 dp[1][3]) 3 · 삽입(왼쪽 dp[2][2]) 1 가운데 가장 작은 1 에 1 을 더해 dp[2][3] = 2 입니다. 가장 작은 후보는 삽입 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, null, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [
        [1, 2],
        [1, 3],
        [2, 2],
      ],
      write: [[2, 3]],
      calc: { expr: "min(2, 3, 1) + 1 =", result: "2" },
    },
  ],
} satisfies TablePlayerSpec;

export const row34 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0 · ∅", "i=1 · h", "i=2 · o", "i=3 · r", "i=4 · s", "i=5 · e"],
  colHeads: ["∅", "r", "o", "s"],
  colLabel: "t 의 글자",
  title: 'editDistance("horse", "ros")',
  result: "[4, 3, 3, 2]",
  steps: [
    {
      title: "T8 dp[3][1] = 2 ④",
      text: "s[2] = 'r' 과 t[0] = 'r' 이 같아 ④ 입니다. 왼쪽 위 dp[2][0] = 2 를 편집 없이 그대로 받아 dp[3][1] = 2 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, null, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [[2, 0]],
      write: [[3, 1]],
      calc: { expr: "dp[2][0] =", result: "2" },
    },
    {
      title: "T9 dp[3][2] = 2 ⑤",
      text: "s[2] = 'r' 과 t[1] = 'o' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[2][1]) 2 · 삭제(위 dp[2][2]) 1 · 삽입(왼쪽 dp[3][1]) 2 가운데 가장 작은 1 에 1 을 더해 dp[3][2] = 2 입니다. 가장 작은 후보는 삭제 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, null],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [
        [2, 1],
        [2, 2],
        [3, 1],
      ],
      write: [[3, 2]],
      calc: { expr: "min(2, 1, 2) + 1 =", result: "2" },
    },
    {
      title: "T10 dp[3][3] = 2 ⑤",
      text: "s[2] = 'r' 과 t[2] = 's' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[2][2]) 1 · 삭제(위 dp[2][3]) 2 · 삽입(왼쪽 dp[3][2]) 2 가운데 가장 작은 1 에 1 을 더해 dp[3][3] = 2 입니다. 가장 작은 후보는 교체 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, null, null, null],
        [5, null, null, null],
      ],
      read: [
        [2, 2],
        [2, 3],
        [3, 2],
      ],
      write: [[3, 3]],
      calc: { expr: "min(1, 2, 2) + 1 =", result: "2" },
    },
    {
      title: "T11 dp[4][1] = 3 ⑤",
      text: "s[3] = 's' 와 t[0] = 'r' 이 달라 ⑤ 입니다. 교체(왼쪽 위 dp[3][0]) 3 · 삭제(위 dp[3][1]) 2 · 삽입(왼쪽 dp[4][0]) 4 가운데 가장 작은 2 에 1 을 더해 dp[4][1] = 3 입니다. 가장 작은 후보는 삭제 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, null, null],
        [5, null, null, null],
      ],
      read: [
        [3, 0],
        [3, 1],
        [4, 0],
      ],
      write: [[4, 1]],
      calc: { expr: "min(3, 2, 4) + 1 =", result: "3" },
    },
    {
      title: "T12 dp[4][2] = 3 ⑤",
      text: "s[3] = 's' 와 t[1] = 'o' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[3][1]) 2 · 삭제(위 dp[3][2]) 2 · 삽입(왼쪽 dp[4][1]) 3 가운데 가장 작은 2 에 1 을 더해 dp[4][2] = 3 입니다. 가장 작은 후보는 교체 · 삭제 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, null],
        [5, null, null, null],
      ],
      read: [
        [3, 1],
        [3, 2],
        [4, 1],
      ],
      write: [[4, 2]],
      calc: { expr: "min(2, 2, 3) + 1 =", result: "3" },
    },
    {
      title: "T13 dp[4][3] = 2 ④",
      text: "s[3] = 's' 와 t[2] = 's' 가 같아 ④ 입니다. 왼쪽 위 dp[3][2] = 2 를 편집 없이 그대로 받아 dp[4][3] = 2 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, null, null, null],
      ],
      read: [[3, 2]],
      write: [[4, 3]],
      calc: { expr: "dp[3][2] =", result: "2" },
    },
  ],
} satisfies TablePlayerSpec;

export const row5 = {
  player: "stage",
  stage: "table",
  rowHeads: ["i=0 · ∅", "i=1 · h", "i=2 · o", "i=3 · r", "i=4 · s", "i=5 · e"],
  colHeads: ["∅", "r", "o", "s"],
  colLabel: "t 의 글자",
  title: 'editDistance("horse", "ros")',
  result: "3",
  steps: [
    {
      title: "T14 dp[5][1] = 4 ⑤",
      text: "s[4] = 'e' 와 t[0] = 'r' 이 달라 ⑤ 입니다. 교체(왼쪽 위 dp[4][0]) 4 · 삭제(위 dp[4][1]) 3 · 삽입(왼쪽 dp[5][0]) 5 가운데 가장 작은 3 에 1 을 더해 dp[5][1] = 4 입니다. 가장 작은 후보는 삭제 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, 4, null, null],
      ],
      read: [
        [4, 0],
        [4, 1],
        [5, 0],
      ],
      write: [[5, 1]],
      calc: { expr: "min(4, 3, 5) + 1 =", result: "4" },
    },
    {
      title: "T15 dp[5][2] = 4 ⑤",
      text: "s[4] = 'e' 와 t[1] = 'o' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[4][1]) 3 · 삭제(위 dp[4][2]) 3 · 삽입(왼쪽 dp[5][1]) 4 가운데 가장 작은 3 에 1 을 더해 dp[5][2] = 4 입니다. 가장 작은 후보는 교체 · 삭제 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, 4, 4, null],
      ],
      read: [
        [4, 1],
        [4, 2],
        [5, 1],
      ],
      write: [[5, 2]],
      calc: { expr: "min(3, 3, 4) + 1 =", result: "4" },
    },
    {
      title: "T16 dp[5][3] = 3 ⑤",
      text: "s[4] = 'e' 와 t[2] = 's' 가 달라 ⑤ 입니다. 교체(왼쪽 위 dp[4][2]) 3 · 삭제(위 dp[4][3]) 2 · 삽입(왼쪽 dp[5][2]) 4 가운데 가장 작은 2 에 1 을 더해 dp[5][3] = 3 입니다. 가장 작은 후보는 삭제 입니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, 4, 4, 3],
      ],
      read: [
        [4, 2],
        [4, 3],
        [5, 2],
      ],
      write: [[5, 3]],
      calc: { expr: "min(3, 2, 4) + 1 =", result: "3" },
    },
    {
      title: "T17 dp[5][3] = 3 반환",
      text: "오른쪽 아래 칸 dp[5][3] 를 읽어 3 을 돌려줍니다.",
      table: [
        [0, 1, 2, 3],
        [1, 1, 2, 3],
        [2, 2, 1, 2],
        [3, 2, 2, 2],
        [4, 3, 3, 2],
        [5, 4, 4, 3],
      ],
      read: [[5, 3]],
      calc: { expr: "dp[5][3] =", result: "3" },
    },
  ],
} satisfies TablePlayerSpec;
