import type { TablePlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `a = [1, 2, 3, 4]` 의 구간 합 제곱을
 * 비용으로 삼아 네 칸을 세 구역으로 나눈다. 걸음 T1~T12 가 본문의 T1~T12 와 하나씩 짝이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "table"` 이
 * 2 차원 표 무대(`tableStage.ts`)를 고른다. 무대는 DP 테이블 — 줄이 구역 수 `g`, 열이 칸 `i` — 이고, 그
 * 아래에 입력 `a` 줄을 둔다. 호출이 맡은 칸 범위는 입력 줄 위 괄호, 넣는 후보 범위(가르는 자리 `j`)는
 * 입력 줄 아래 괄호다. 읽음은 후보가 읽은 이전 줄의 칸, 새로 씀은 이번 호출이 채운 가운데 칸이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본과 대조한 걸음 기록에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `divideAndConquerDp-guide.test.ts` 가 잰다.
 */

export const dcdp = {
  player: "stage",
  stage: "table",
  rowHeads: ["dp[1]", "dp[2]", "dp[3]"],
  colHeads: [0, 1, 2, 3],
  colLabel: "i",
  strip: {
    label: "a",
    values: [1, 2, 3, 4],
    side: "cost[i][j] = (a[i] + … + a[j])²",
  },
  title: "divideAndConquerDp(buildCost([1, 2, 3, 4]), 3)",
  result: "34",
  steps: [
    {
      title: "T1 줄 1 을 채운다 ①",
      text: "구역이 하나면 [0,i] 를 통째로 한 구역으로 묶는 수밖에 없어 dp[1][i] = cost[0][i] 입니다. ① 줄 1 의 값은 1 9 36 100 입니다.",
      table: [
        ["1", "9", "36", "100"],
        [null, null, null, null],
        [null, null, null, null],
      ],
      write: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      rowSide: ["이번 줄 · 채움 4 / 4", "채움 0 / 4", "채움 0 / 4"],
      calc: {
        expr: "dp[1][i] = cost[0][i] →",
        result: "1 9 36 100",
      },
      vars: "후보 수 누적 0",
    },
    {
      title: "T2 줄 2 · solve(0, 3, 0, 2) · 칸 1 ②④⑤⑥",
      text: "solve(0, 3, 0, 2) 는 칸 [0,3] 을 맡습니다. 가운데 칸 1 의 후보 상한은 min(2, 0) = 0 입니다. 후보 값은 j = 0 에서 5 입니다. 가장 작은 5 가 칸 1 의 값이고 찾은 자리는 0 입니다. 왼쪽은 후보 [0,0], 오른쪽은 [0,2] 를 넘겨받습니다.",
      table: [
        ["1", "9", "36", "100"],
        [null, "5", null, null],
        [null, null, null, null],
      ],
      read: [[0, 0]],
      write: [[1, 1]],
      pieces: [
        {
          label: "칸",
          from: 0,
          to: 3,
          tone: "query",
          text: "[0,3]",
          side: "가운데 칸 1",
        },
        {
          label: "후보 j",
          from: 0,
          to: 0,
          tone: "left",
          text: "[0,0]",
          side: "상한 min(2, 0) = 0",
        },
      ],
      rowSide: ["이전 줄 · 채움 4 / 4", "이번 줄 · 채움 1 / 4", "채움 0 / 4"],
      calc: {
        expr: "min(5) =",
        result: "5 · 찾은 자리 0",
      },
      vars: "후보 수 누적 1",
    },
    {
      title: "T3 줄 2 · solve(0, 0, 0, 0) · 칸 0 ④⑥③",
      text: "solve(0, 0, 0, 0) 은 칸 [0,0] 을 맡습니다. 가운데 칸 0 의 후보 상한은 min(0, -1) = -1 입니다. 후보가 하나도 없어 칸 0 은 INF 로 남고, 양옆 자식 호출은 빈 범위라 ③ 곧장 돌아옵니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", null, null],
        [null, null, null, null],
      ],
      read: [],
      write: [[1, 0]],
      pieces: [
        {
          label: "칸",
          from: 0,
          to: 0,
          tone: "query",
          text: "[0,0]",
          side: "가운데 칸 0",
        },
      ],
      rowSide: ["이전 줄 · 채움 4 / 4", "이번 줄 · 채움 2 / 4", "채움 0 / 4"],
      calc: {
        expr: "후보 없음 →",
        result: "INF",
      },
      vars: "후보 수 누적 1",
    },
    {
      title: "T4 줄 2 · solve(2, 3, 0, 2) · 칸 2 ④⑤⑥③",
      text: "solve(2, 3, 0, 2) 는 칸 [2,3] 을 맡습니다. 가운데 칸 2 의 후보 상한은 min(2, 1) = 1 입니다. 후보 값은 j = 0 에서 26, j = 1 에서 18 입니다. 가장 작은 18 이 칸 2 의 값이고 찾은 자리는 1 입니다. 왼쪽은 후보 [0,1], 오른쪽은 [1,2] 를 넘겨받습니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", null],
        [null, null, null, null],
      ],
      read: [
        [0, 0],
        [0, 1],
      ],
      write: [[1, 2]],
      pieces: [
        {
          label: "칸",
          from: 2,
          to: 3,
          tone: "query",
          text: "[2,3]",
          side: "가운데 칸 2",
        },
        {
          label: "후보 j",
          from: 0,
          to: 1,
          tone: "left",
          text: "[0,1]",
          side: "상한 min(2, 1) = 1",
        },
      ],
      rowSide: ["이전 줄 · 채움 4 / 4", "이번 줄 · 채움 3 / 4", "채움 0 / 4"],
      calc: {
        expr: "min(26, 18) =",
        result: "18 · 찾은 자리 1",
      },
      vars: "후보 수 누적 3",
    },
    {
      title: "T5 줄 2 · solve(3, 3, 1, 2) · 칸 3 ④⑤⑥③",
      text: "solve(3, 3, 1, 2) 는 칸 [3,3] 을 맡습니다. 가운데 칸 3 의 후보 상한은 min(2, 2) = 2 입니다. 후보 값은 j = 1 에서 58, j = 2 에서 52 입니다. 가장 작은 52 가 칸 3 의 값이고 찾은 자리는 2 입니다. 왼쪽은 후보 [1,2], 오른쪽은 [2,2] 를 넘겨받습니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        [null, null, null, null],
      ],
      read: [
        [0, 1],
        [0, 2],
      ],
      write: [[1, 3]],
      pieces: [
        {
          label: "칸",
          from: 3,
          to: 3,
          tone: "query",
          text: "[3,3]",
          side: "가운데 칸 3",
        },
        {
          label: "후보 j",
          from: 1,
          to: 2,
          tone: "left",
          text: "[1,2]",
          side: "상한 min(2, 2) = 2",
        },
      ],
      rowSide: ["이전 줄 · 채움 4 / 4", "이번 줄 · 채움 4 / 4", "채움 0 / 4"],
      calc: {
        expr: "min(58, 52) =",
        result: "52 · 찾은 자리 2",
      },
      vars: "후보 수 누적 5",
    },
    {
      title: "T6 줄 2 를 이전 줄로 삼는다 ⑦",
      text: "⑦ prev = cur 로 줄 2 를 이전 줄로 삼습니다. 다음 줄은 이 줄만 읽습니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        [null, null, null, null],
      ],
      read: [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ],
      rowSide: [
        "채움 4 / 4",
        "다음 줄이 읽을 이전 줄 · 채움 4 / 4",
        "채움 0 / 4",
      ],
      calc: {
        expr: "prev = cur →",
        result: "줄 2",
      },
      vars: "후보 수 누적 5",
    },
    {
      title: "T7 줄 3 · solve(0, 3, 0, 2) · 칸 1 ②④⑥",
      text: "solve(0, 3, 0, 2) 는 칸 [0,3] 을 맡습니다. 가운데 칸 1 의 후보 상한은 min(2, 0) = 0 입니다. 후보 값은 j = 0 에서 INF 입니다. 가장 작은 INF 이 칸 1 의 값이고 찾은 자리는 0 입니다. 왼쪽은 후보 [0,0], 오른쪽은 [0,2] 를 넘겨받습니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        [null, "INF", null, null],
      ],
      read: [[1, 0]],
      write: [[2, 1]],
      pieces: [
        {
          label: "칸",
          from: 0,
          to: 3,
          tone: "query",
          text: "[0,3]",
          side: "가운데 칸 1",
        },
        {
          label: "후보 j",
          from: 0,
          to: 0,
          tone: "left",
          text: "[0,0]",
          side: "상한 min(2, 0) = 0",
        },
      ],
      rowSide: ["채움 4 / 4", "이전 줄 · 채움 4 / 4", "이번 줄 · 채움 1 / 4"],
      calc: {
        expr: "min(INF) =",
        result: "INF · 찾은 자리 0",
      },
      vars: "후보 수 누적 6",
    },
    {
      title: "T8 줄 3 · solve(0, 0, 0, 0) · 칸 0 ④⑥③",
      text: "solve(0, 0, 0, 0) 은 칸 [0,0] 을 맡습니다. 가운데 칸 0 의 후보 상한은 min(0, -1) = -1 입니다. 후보가 하나도 없어 칸 0 은 INF 로 남고, 양옆 자식 호출은 빈 범위라 ③ 곧장 돌아옵니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        ["INF", "INF", null, null],
      ],
      read: [],
      write: [[2, 0]],
      pieces: [
        {
          label: "칸",
          from: 0,
          to: 0,
          tone: "query",
          text: "[0,0]",
          side: "가운데 칸 0",
        },
      ],
      rowSide: ["채움 4 / 4", "이전 줄 · 채움 4 / 4", "이번 줄 · 채움 2 / 4"],
      calc: {
        expr: "후보 없음 →",
        result: "INF",
      },
      vars: "후보 수 누적 6",
    },
    {
      title: "T9 줄 3 · solve(2, 3, 0, 2) · 칸 2 ④⑤⑥③",
      text: "solve(2, 3, 0, 2) 는 칸 [2,3] 을 맡습니다. 가운데 칸 2 의 후보 상한은 min(2, 1) = 1 입니다. 후보 값은 j = 0 에서 INF, j = 1 에서 14 입니다. 가장 작은 14 가 칸 2 의 값이고 찾은 자리는 1 입니다. 왼쪽은 후보 [0,1], 오른쪽은 [1,2] 를 넘겨받습니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        ["INF", "INF", "14", null],
      ],
      read: [
        [1, 0],
        [1, 1],
      ],
      write: [[2, 2]],
      pieces: [
        {
          label: "칸",
          from: 2,
          to: 3,
          tone: "query",
          text: "[2,3]",
          side: "가운데 칸 2",
        },
        {
          label: "후보 j",
          from: 0,
          to: 1,
          tone: "left",
          text: "[0,1]",
          side: "상한 min(2, 1) = 1",
        },
      ],
      rowSide: ["채움 4 / 4", "이전 줄 · 채움 4 / 4", "이번 줄 · 채움 3 / 4"],
      calc: {
        expr: "min(INF, 14) =",
        result: "14 · 찾은 자리 1",
      },
      vars: "후보 수 누적 8",
    },
    {
      title: "T10 줄 3 · solve(3, 3, 1, 2) · 칸 3 ④⑤⑥③",
      text: "solve(3, 3, 1, 2) 는 칸 [3,3] 을 맡습니다. 가운데 칸 3 의 후보 상한은 min(2, 2) = 2 입니다. 후보 값은 j = 1 에서 54, j = 2 에서 34 입니다. 가장 작은 34 가 칸 3 의 값이고 찾은 자리는 2 입니다. 왼쪽은 후보 [1,2], 오른쪽은 [2,2] 를 넘겨받습니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        ["INF", "INF", "14", "34"],
      ],
      read: [
        [1, 1],
        [1, 2],
      ],
      write: [[2, 3]],
      pieces: [
        {
          label: "칸",
          from: 3,
          to: 3,
          tone: "query",
          text: "[3,3]",
          side: "가운데 칸 3",
        },
        {
          label: "후보 j",
          from: 1,
          to: 2,
          tone: "left",
          text: "[1,2]",
          side: "상한 min(2, 2) = 2",
        },
      ],
      rowSide: ["채움 4 / 4", "이전 줄 · 채움 4 / 4", "이번 줄 · 채움 4 / 4"],
      calc: {
        expr: "min(54, 34) =",
        result: "34 · 찾은 자리 2",
      },
      vars: "후보 수 누적 10",
    },
    {
      title: "T11 줄 3 을 이전 줄로 삼는다 ⑦",
      text: "⑦ prev = cur 로 줄 3 을 이전 줄로 삼습니다. 다음 줄은 이 줄만 읽습니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        ["INF", "INF", "14", "34"],
      ],
      read: [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
      ],
      rowSide: [
        "채움 4 / 4",
        "채움 4 / 4",
        "다음 줄이 읽을 이전 줄 · 채움 4 / 4",
      ],
      calc: {
        expr: "prev = cur →",
        result: "줄 3",
      },
      vars: "후보 수 누적 10",
    },
    {
      title: "T12 마지막 칸을 돌려준다",
      text: "줄 3 의 마지막 칸 dp[3][3] = 34 가 네 칸을 3 구역으로 나눈 가장 작은 비용입니다. 그 값을 돌려줍니다.",
      table: [
        ["1", "9", "36", "100"],
        ["INF", "5", "18", "52"],
        ["INF", "INF", "14", "34"],
      ],
      read: [[2, 3]],
      rowSide: ["채움 4 / 4", "채움 4 / 4", "마지막 줄 · 채움 4 / 4"],
      calc: {
        expr: "prev[3] =",
        result: "34",
      },
      vars: "후보 수 누적 10",
    },
  ],
} satisfies TablePlayerSpec;
