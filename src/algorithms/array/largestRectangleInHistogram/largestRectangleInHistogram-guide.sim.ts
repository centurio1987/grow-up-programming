import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `heights = [2, 1, 5, 6, 2, 3]`. `walk` 는
 * T1~T13 의 13 걸음이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 입력 배열 `heights` 아래에 알고리즘이 만드는 구조를 쌓는다 — 꺼내는 걸음에는
 * 그 막대가 높이를 정하는 직사각형을 괄호(`pieces`)로 덮고, 그 아래에 단조 스택 띠 두 줄(`stack` 이 담은 자리
 * 번호와 그 자리의 높이, 바닥이 왼쪽)을 둔다. 단조 스택 띠는 nextGreaterElement 의 스택 띠와 같은 약속으로
 * 그린다 — 칸 수를 전개에서 가장 깊었을 때로 고정하고, 넣은 칸은 새로 씀, 비교한 꼭대기와 왼쪽 경계로 읽은
 * 꼭대기는 읽음이다. 쥔 구간 `range` 는 이미 읽은 자리이고, `best` 와 넣은 횟수 · 꺼낸 횟수가 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의 `simStepsFromRef()`(정본 실행에서
 * 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는 `largestRectangleInHistogram-guide.test.ts` 가 잰다.
 */

export const walk = {
  player: "stage",
  stage: "array",
  arrayName: "heights",
  rangeLabel: "읽은 자리",
  title: "largestRectangleInHistogram([2, 1, 5, 6, 2, 3])",
  result: "10",
  steps: [
    {
      title: "T1 자리 0 넣기",
      text: "단조 스택이 비어 비교할 꼭대기가 없습니다. 자리 0 을 넣습니다. 그 높이는 2 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {},
      calc: {
        expr: "stack.length > 0",
        result: "거짓 · 넣는다",
      },
      vars: "i = 0 · best = 0 · 넣기 1 · 꺼내기 0",
      layers: [
        {
          name: "stack",
          values: [0, null, null],
          read: [],
          write: [0],
          caret: false,
          side: "꼭대기 = 자리 0",
        },
        {
          name: "stack 의 높이",
          values: [2, null, null],
          read: [],
          write: [0],
          caret: false,
          side: "2",
        },
      ],
    },
    {
      title: "T2 2 > 1 · 자리 0 꺼내고 넓이 2",
      text: "꼭대기 자리 0 의 높이 2 가 지금 높이 1 보다 높아 꺼냅니다. 오른쪽 경계는 1 이고, 꺼낸 뒤 단조 스택이 비어 왼쪽 경계는 -1 입니다. 폭 1 의 넓이는 2 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 1],
      read: [0, 1],
      write: [],
      pointers: {
        top: 0,
      },
      calc: {
        expr: "2 × (1 − (-1) − 1)",
        result: "2",
      },
      vars: "i = 1 · best = 2 · 넣기 1 · 꺼내기 1",
      pieces: [
        {
          label: "자리 0",
          from: 0,
          to: 0,
          tone: "left",
          text: "높이 2 · 폭 1 · 넓이 2",
        },
      ],
      layers: [
        {
          name: "stack",
          values: [null, null, null],
          read: [],
          write: [],
          caret: false,
          side: "비었다",
        },
        {
          name: "stack 의 높이",
          values: [null, null, null],
          read: [],
          write: [],
          caret: false,
          side: "비었다",
        },
      ],
    },
    {
      title: "T3 자리 1 넣기",
      text: "꺼낼 꼭대기가 더 없어 반복이 끝났습니다. 자리 1 을 넣습니다. 그 높이는 1 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: {},
      calc: {
        expr: "stack.length > 0",
        result: "거짓 · 넣는다",
      },
      vars: "i = 1 · best = 2 · 넣기 2 · 꺼내기 1",
      layers: [
        {
          name: "stack",
          values: [1, null, null],
          read: [],
          write: [0],
          caret: false,
          side: "꼭대기 = 자리 1",
        },
        {
          name: "stack 의 높이",
          values: [1, null, null],
          read: [],
          write: [0],
          caret: false,
          side: "1",
        },
      ],
    },
    {
      title: "T4 1 ≤ 5 · 멈추고 자리 2 넣기",
      text: "꼭대기 자리 1 의 높이 1 이 지금 높이 5 보다 높지 않아 멈춥니다. 자리 2 를 넣습니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 2],
      read: [1, 2],
      write: [],
      pointers: {
        top: 1,
      },
      calc: {
        expr: "heights[1] > cur → 1 > 5",
        result: "거짓 · 멈춘다",
      },
      vars: "i = 2 · best = 2 · 넣기 3 · 꺼내기 1",
      layers: [
        {
          name: "stack",
          values: [1, 2, null],
          read: [0],
          write: [1],
          caret: false,
          side: "꼭대기 = 자리 2",
        },
        {
          name: "stack 의 높이",
          values: [1, 5, null],
          read: [0],
          write: [1],
          caret: false,
          side: "1 ≤ 5",
        },
      ],
    },
    {
      title: "T5 5 ≤ 6 · 멈추고 자리 3 넣기",
      text: "꼭대기 자리 2 의 높이 5 가 지금 높이 6 보다 높지 않아 멈춥니다. 자리 3 을 넣습니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 3],
      read: [2, 3],
      write: [],
      pointers: {
        top: 2,
      },
      calc: {
        expr: "heights[2] > cur → 5 > 6",
        result: "거짓 · 멈춘다",
      },
      vars: "i = 3 · best = 2 · 넣기 4 · 꺼내기 1",
      layers: [
        {
          name: "stack",
          values: [1, 2, 3],
          read: [1],
          write: [2],
          caret: false,
          side: "꼭대기 = 자리 3",
        },
        {
          name: "stack 의 높이",
          values: [1, 5, 6],
          read: [1],
          write: [2],
          caret: false,
          side: "1 ≤ 5 ≤ 6",
        },
      ],
    },
    {
      title: "T6 6 > 2 · 자리 3 꺼내고 넓이 6",
      text: "꼭대기 자리 3 의 높이 6 이 지금 높이 2 보다 높아 꺼냅니다. 오른쪽 경계는 4 이고, 꺼낸 뒤 꼭대기 자리 2 가 왼쪽 경계입니다. 폭 1 의 넓이는 6 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 4],
      read: [3, 4],
      write: [],
      pointers: {
        top: 3,
      },
      calc: {
        expr: "6 × (4 − (2) − 1)",
        result: "6",
      },
      vars: "i = 4 · best = 6 · 넣기 4 · 꺼내기 2",
      pieces: [
        {
          label: "자리 3",
          from: 3,
          to: 3,
          tone: "left",
          text: "높이 6 · 폭 1 · 넓이 6",
        },
      ],
      layers: [
        {
          name: "stack",
          values: [1, 2, null],
          read: [1],
          write: [],
          caret: false,
          side: "꼭대기 = 자리 2",
        },
        {
          name: "stack 의 높이",
          values: [1, 5, null],
          read: [1],
          write: [],
          caret: false,
          side: "1 ≤ 5",
        },
      ],
    },
    {
      title: "T7 5 > 2 · 자리 2 꺼내고 넓이 10",
      text: "꼭대기 자리 2 의 높이 5 가 지금 높이 2 보다 높아 꺼냅니다. 오른쪽 경계는 4 이고, 꺼낸 뒤 꼭대기 자리 1 이 왼쪽 경계입니다. 폭 2 의 넓이는 10 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 4],
      read: [2, 4],
      write: [],
      pointers: {
        top: 2,
      },
      calc: {
        expr: "5 × (4 − (1) − 1)",
        result: "10",
      },
      vars: "i = 4 · best = 10 · 넣기 4 · 꺼내기 3",
      pieces: [
        {
          label: "자리 2",
          from: 2,
          to: 3,
          tone: "left",
          text: "높이 5 · 폭 2 · 넓이 10",
        },
      ],
      layers: [
        {
          name: "stack",
          values: [1, null, null],
          read: [0],
          write: [],
          caret: false,
          side: "꼭대기 = 자리 1",
        },
        {
          name: "stack 의 높이",
          values: [1, null, null],
          read: [0],
          write: [],
          caret: false,
          side: "1",
        },
      ],
    },
    {
      title: "T8 1 ≤ 2 · 멈추고 자리 4 넣기",
      text: "꼭대기 자리 1 의 높이 1 이 지금 높이 2 보다 높지 않아 멈춥니다. 자리 4 를 넣습니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 4],
      read: [1, 4],
      write: [],
      pointers: {
        top: 1,
      },
      calc: {
        expr: "heights[1] > cur → 1 > 2",
        result: "거짓 · 멈춘다",
      },
      vars: "i = 4 · best = 10 · 넣기 5 · 꺼내기 3",
      layers: [
        {
          name: "stack",
          values: [1, 4, null],
          read: [0],
          write: [1],
          caret: false,
          side: "꼭대기 = 자리 4",
        },
        {
          name: "stack 의 높이",
          values: [1, 2, null],
          read: [0],
          write: [1],
          caret: false,
          side: "1 ≤ 2",
        },
      ],
    },
    {
      title: "T9 2 ≤ 3 · 멈추고 자리 5 넣기",
      text: "꼭대기 자리 4 의 높이 2 가 지금 높이 3 보다 높지 않아 멈춥니다. 자리 5 를 넣습니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 5],
      read: [4, 5],
      write: [],
      pointers: {
        top: 4,
      },
      calc: {
        expr: "heights[4] > cur → 2 > 3",
        result: "거짓 · 멈춘다",
      },
      vars: "i = 5 · best = 10 · 넣기 6 · 꺼내기 3",
      layers: [
        {
          name: "stack",
          values: [1, 4, 5],
          read: [1],
          write: [2],
          caret: false,
          side: "꼭대기 = 자리 5",
        },
        {
          name: "stack 의 높이",
          values: [1, 2, 3],
          read: [1],
          write: [2],
          caret: false,
          side: "1 ≤ 2 ≤ 3",
        },
      ],
    },
    {
      title: "T10 3 > 0 · 자리 5 꺼내고 넓이 3",
      text: "보초 걸음이라 지금 높이가 0 입니다. 꼭대기 자리 5 의 높이 3 이 지금 높이 0 보다 높아 꺼냅니다. 오른쪽 경계는 6 이고, 꺼낸 뒤 꼭대기 자리 4 가 왼쪽 경계입니다. 폭 1 의 넓이는 3 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 5],
      read: [5],
      write: [],
      pointers: {
        top: 5,
      },
      calc: {
        expr: "3 × (6 − (4) − 1)",
        result: "3",
      },
      vars: "i = 6(보초) · best = 10 · 넣기 6 · 꺼내기 4",
      pieces: [
        {
          label: "자리 5",
          from: 5,
          to: 5,
          tone: "left",
          text: "높이 3 · 폭 1 · 넓이 3",
        },
      ],
      layers: [
        {
          name: "stack",
          values: [1, 4, null],
          read: [1],
          write: [],
          caret: false,
          side: "꼭대기 = 자리 4",
        },
        {
          name: "stack 의 높이",
          values: [1, 2, null],
          read: [1],
          write: [],
          caret: false,
          side: "1 ≤ 2",
        },
      ],
    },
    {
      title: "T11 2 > 0 · 자리 4 꺼내고 넓이 8",
      text: "보초 걸음이라 지금 높이가 0 입니다. 꼭대기 자리 4 의 높이 2 가 지금 높이 0 보다 높아 꺼냅니다. 오른쪽 경계는 6 이고, 꺼낸 뒤 꼭대기 자리 1 이 왼쪽 경계입니다. 폭 4 의 넓이는 8 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 5],
      read: [4],
      write: [],
      pointers: {
        top: 4,
      },
      calc: {
        expr: "2 × (6 − (1) − 1)",
        result: "8",
      },
      vars: "i = 6(보초) · best = 10 · 넣기 6 · 꺼내기 5",
      pieces: [
        {
          label: "자리 4",
          from: 2,
          to: 5,
          tone: "left",
          text: "높이 2 · 폭 4 · 넓이 8",
        },
      ],
      layers: [
        {
          name: "stack",
          values: [1, null, null],
          read: [0],
          write: [],
          caret: false,
          side: "꼭대기 = 자리 1",
        },
        {
          name: "stack 의 높이",
          values: [1, null, null],
          read: [0],
          write: [],
          caret: false,
          side: "1",
        },
      ],
    },
    {
      title: "T12 1 > 0 · 자리 1 꺼내고 넓이 6",
      text: "보초 걸음이라 지금 높이가 0 입니다. 꼭대기 자리 1 의 높이 1 이 지금 높이 0 보다 높아 꺼냅니다. 오른쪽 경계는 6 이고, 꺼낸 뒤 단조 스택이 비어 왼쪽 경계는 -1 입니다. 폭 6 의 넓이는 6 입니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 5],
      read: [1],
      write: [],
      pointers: {
        top: 1,
      },
      calc: {
        expr: "1 × (6 − (-1) − 1)",
        result: "6",
      },
      vars: "i = 6(보초) · best = 10 · 넣기 6 · 꺼내기 6",
      pieces: [
        {
          label: "자리 1",
          from: 0,
          to: 5,
          tone: "left",
          text: "높이 1 · 폭 6 · 넓이 6",
        },
      ],
      layers: [
        {
          name: "stack",
          values: [null, null, null],
          read: [],
          write: [],
          caret: false,
          side: "비었다",
        },
        {
          name: "stack 의 높이",
          values: [null, null, null],
          read: [],
          write: [],
          caret: false,
          side: "비었다",
        },
      ],
    },
    {
      title: "T13 보초 자리 6 넣고 best 10 반환",
      text: "꺼낼 꼭대기가 더 없어 반복이 끝났습니다. 보초 자리 6 을 넣고 순회를 마칩니다. best 10 을 돌려줍니다.",
      array: [2, 1, 5, 6, 2, 3],
      range: [0, 5],
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "stack.length > 0",
        result: "거짓 · 반복이 끝난다",
      },
      vars: "i = 6(보초) · best = 10 · 넣기 7 · 꺼내기 6",
      layers: [
        {
          name: "stack",
          values: [6, null, null],
          read: [],
          write: [0],
          caret: false,
          side: "꼭대기 = 자리 6",
        },
        {
          name: "stack 의 높이",
          values: [0, null, null],
          read: [],
          write: [0],
          caret: false,
          side: "0",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
