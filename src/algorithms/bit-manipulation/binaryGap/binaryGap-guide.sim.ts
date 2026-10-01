import type { TablePlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `n = 322`(`101000010₂`). `scan` 은
 * 자리 0 부터 8 까지 한 자리씩 읽는 T1~T9 다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "table"` 이
 * 2 차원 표 무대(`tableStage.ts`)를 고른다. 열 머리가 자리 번호이고 **자리 0 이 오른쪽 끝**이라 칸의 순서가
 * 이진 표기와 같다(배열 무대는 인덱스 줄이 왼쪽부터 0 으로 고정이라 쓰지 않는다). 줄은 `n` 의 비트 하나다.
 * 표 아래 괄호 「읽은 자리」는 지금까지 읽은 자리 `[0, i]` 이고 그 밖의 칸은 대시다. 읽음 테는 이번에 읽은
 * 자리, 새로 씀은 이번에 `last` 로 기억한 1 이다. ① 로 잰 0 구간은 그 아래 괄호(`pieces`)로 싣는다. `last` 는
 * 줄 곁말, 조건 한 줄은 알약, `best` 는 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `binaryGap-guide.test.ts` 가 잰다.
 */

export const scan = {
  player: "stage",
  stage: "table",
  rowHeads: ["비트"],
  colHeads: [8, 7, 6, 5, 4, 3, 2, 1, 0],
  colLabel: "자리",
  title: "binaryGap(322)",
  result: "4",
  steps: [
    {
      title: "T1 i = 0",
      text: "자리 0 에서 x = 101000010₂ 의 가장 낮은 자리 0 을 읽습니다. 0 이라 한 칸 내리기만 합니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 8]],
      write: [],
      out: [
        [0, 7],
        [0, 6],
        [0, 5],
        [0, 4],
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "읽은 자리",
          from: 8,
          to: 8,
          tone: "query",
          text: "[0,0]",
        },
      ],
      rowSide: ["last = -1"],
      calc: {
        expr: "322 & 1",
        result: "0 → 내리기만",
      },
      vars: "best = 0",
    },
    {
      title: "T2 i = 1",
      text: "자리 1 에서 x = 10100001₂ 의 가장 낮은 자리 1 을 읽습니다. 직전 1 이 없어(last = -1) 재지 않고 last = 1 로 둡니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 7]],
      write: [[0, 7]],
      out: [
        [0, 6],
        [0, 5],
        [0, 4],
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "읽은 자리",
          from: 7,
          to: 8,
          tone: "query",
          text: "[0,1]",
        },
      ],
      rowSide: ["last = 1"],
      calc: {
        expr: "-1 >= 0",
        result: "거짓 → last = 1",
      },
      vars: "best = 0",
    },
    {
      title: "T3 i = 2",
      text: "자리 2 에서 x = 1010000₂ 의 가장 낮은 자리 0 을 읽습니다. 0 이라 한 칸 내리기만 합니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 6]],
      write: [],
      out: [
        [0, 5],
        [0, 4],
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "읽은 자리",
          from: 6,
          to: 8,
          tone: "query",
          text: "[0,2]",
        },
      ],
      rowSide: ["last = 1"],
      calc: {
        expr: "80 & 1",
        result: "0 → 내리기만",
      },
      vars: "best = 0",
    },
    {
      title: "T4 i = 3",
      text: "자리 3 에서 x = 101000₂ 의 가장 낮은 자리 0 을 읽습니다. 0 이라 한 칸 내리기만 합니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 5]],
      write: [],
      out: [
        [0, 4],
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "읽은 자리",
          from: 5,
          to: 8,
          tone: "query",
          text: "[0,3]",
        },
      ],
      rowSide: ["last = 1"],
      calc: {
        expr: "40 & 1",
        result: "0 → 내리기만",
      },
      vars: "best = 0",
    },
    {
      title: "T5 i = 4",
      text: "자리 4 에서 x = 10100₂ 의 가장 낮은 자리 0 을 읽습니다. 0 이라 한 칸 내리기만 합니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 4]],
      write: [],
      out: [
        [0, 3],
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "읽은 자리",
          from: 4,
          to: 8,
          tone: "query",
          text: "[0,4]",
        },
      ],
      rowSide: ["last = 1"],
      calc: {
        expr: "20 & 1",
        result: "0 → 내리기만",
      },
      vars: "best = 0",
    },
    {
      title: "T6 i = 5",
      text: "자리 5 에서 x = 1010₂ 의 가장 낮은 자리 0 을 읽습니다. 0 이라 한 칸 내리기만 합니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 3]],
      write: [],
      out: [
        [0, 2],
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "읽은 자리",
          from: 3,
          to: 8,
          tone: "query",
          text: "[0,5]",
        },
      ],
      rowSide: ["last = 1"],
      calc: {
        expr: "10 & 1",
        result: "0 → 내리기만",
      },
      vars: "best = 0",
    },
    {
      title: "T7 i = 6",
      text: "자리 6 에서 x = 101₂ 의 가장 낮은 자리 1 을 읽습니다. 직전 1 의 자리 1 과의 사이에 0 이 4 개라 best 가 됩니다. last = 6 로 둡니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 2]],
      write: [[0, 2]],
      out: [
        [0, 1],
        [0, 0],
      ],
      pieces: [
        {
          label: "읽은 자리",
          from: 2,
          to: 8,
          tone: "query",
          text: "[0,6]",
        },
        {
          label: "잰 0 구간",
          from: 3,
          to: 6,
          tone: "left",
          text: "4 개",
        },
      ],
      rowSide: ["last = 6"],
      calc: {
        expr: "max(0, 6 − 1 − 1)",
        result: "4",
      },
      vars: "best = 4",
    },
    {
      title: "T8 i = 7",
      text: "자리 7 에서 x = 10₂ 의 가장 낮은 자리 0 을 읽습니다. 0 이라 한 칸 내리기만 합니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 1]],
      write: [],
      out: [[0, 0]],
      pieces: [
        {
          label: "읽은 자리",
          from: 1,
          to: 8,
          tone: "query",
          text: "[0,7]",
        },
      ],
      rowSide: ["last = 6"],
      calc: {
        expr: "2 & 1",
        result: "0 → 내리기만",
      },
      vars: "best = 4",
    },
    {
      title: "T9 i = 8",
      text: "자리 8 에서 x = 1₂ 의 가장 낮은 자리 1 을 읽습니다. 직전 1 의 자리 6 과의 사이에 0 이 1 개라 best 보다 작아 best 는 그대로입니다. last = 8 로 둡니다.",
      table: [[1, 0, 1, 0, 0, 0, 0, 1, 0]],
      read: [[0, 0]],
      write: [[0, 0]],
      out: [],
      pieces: [
        {
          label: "읽은 자리",
          from: 0,
          to: 8,
          tone: "query",
          text: "[0,8]",
        },
        {
          label: "잰 0 구간",
          from: 1,
          to: 1,
          tone: "left",
          text: "1 개",
        },
      ],
      rowSide: ["last = 8"],
      calc: {
        expr: "max(4, 8 − 6 − 1)",
        result: "4",
      },
      vars: "best = 4",
    },
  ],
} satisfies TablePlayerSpec;
