import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `nums = [2, 1, 2, 4, 3]`. `walk` 는
 * T1~T9 의 9 걸음이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 입력 배열 `nums` 아래에 답 배열 `result`(칸 번호가 `nums` 의 인덱스와
 * 같다)를 `layers` 로 쌓고, 그 아래에 스택 띠 두 줄(`stack` 이 담은 자리 번호와 그 자리의 값, 바닥이 왼쪽)을
 * `strips` 로 둔다. 스택 띠의 칸 `k` 는 쌓인 차례라 `nums` 의 인덱스와 짝이 아니다. 스택 띠는 방향 그래프
 * 편들의 스택 띠와 같은 약속으로 그린다 — 칸 수를 전개에서 가장 깊었을 때로 고정하고(`slots`), 넣은 칸은
 * 새로 씀, 비교한 꼭대기는 읽음이다. 쥔 구간 `range` 는 이미 읽은 자리
 * `[0, i]` 이고, 넣은 횟수와 꺼낸 횟수가 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의 `simStepsFromRef()`(정본 실행에서
 * 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는 `nextGreaterElement-guide.test.ts` 가 잰다.
 */

export const walk = {
  player: "stage",
  stage: "array",
  arrayName: "nums",
  rangeLabel: "읽은 자리",
  title: "nextGreaterElement([2, 1, 2, 4, 3])",
  result: "[4, 2, 4, -1, -1]",
  steps: [
    {
      title: "T1 자리 0 넣기",
      text: "단조 스택이 비어 비교할 꼭대기가 없습니다. 자리 0 을 넣습니다. 그 값은 2 입니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: { i: 0 },
      calc: { expr: "stack.length > 0", result: "거짓 · 넣는다" },
      vars: "넣기 1 · 꺼내기 0",
      layers: [
        {
          name: "result",
          values: [-1, -1, -1, -1, -1],
          write: [],
          caret: false,
          side: "답을 받은 자리 0 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [0],
          slots: 2,
          read: [],
          write: [0],
          side: "꼭대기 = 자리 0",
        },
        {
          label: "stack 의 값",
          values: [2],
          slots: 2,
          read: [],
          write: [0],
          side: "2",
        },
      ],
    },
    {
      title: "T2 2 ≥ 1 · 멈추고 자리 1 넣기",
      text: "꼭대기 자리 0 의 값 2 는 지금 값 1 보다 작지 않아 멈춥니다. 자리 1 을 넣습니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 1],
      read: [0, 1],
      write: [],
      pointers: { top: 0, i: 1 },
      calc: { expr: "nums[0] < nums[1] → 2 < 1", result: "거짓 · 멈춘다" },
      vars: "넣기 2 · 꺼내기 0",
      layers: [
        {
          name: "result",
          values: [-1, -1, -1, -1, -1],
          write: [],
          caret: false,
          side: "답을 받은 자리 0 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [0, 1],
          slots: 2,
          read: [0],
          write: [1],
          side: "꼭대기 = 자리 1",
        },
        {
          label: "stack 의 값",
          values: [2, 1],
          slots: 2,
          read: [0],
          write: [1],
          side: "2 ≥ 1",
        },
      ],
    },
    {
      title: "T3 1 < 2 · 자리 1 꺼내기",
      text: "꼭대기 자리 1 의 값 1 이 지금 값 2 보다 작아 꺼내고, result[1] 에 2 를 적습니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 2],
      read: [1, 2],
      write: [],
      pointers: { top: 1, i: 2 },
      calc: { expr: "nums[1] < nums[2] → 1 < 2", result: "참 · 꺼낸다" },
      vars: "넣기 2 · 꺼내기 1",
      layers: [
        {
          name: "result",
          values: [-1, 2, -1, -1, -1],
          write: [1],
          caret: false,
          side: "답을 받은 자리 1 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [0],
          slots: 2,
          read: [],
          write: [],
          side: "꼭대기 = 자리 0",
        },
        {
          label: "stack 의 값",
          values: [2],
          slots: 2,
          read: [],
          write: [],
          side: "2",
        },
      ],
    },
    {
      title: "T4 2 ≥ 2 · 멈추고 자리 2 넣기",
      text: "꼭대기 자리 0 의 값 2 는 지금 값 2 보다 작지 않아 멈춥니다. 자리 2 를 넣습니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 2],
      read: [0, 2],
      write: [],
      pointers: { top: 0, i: 2 },
      calc: { expr: "nums[0] < nums[2] → 2 < 2", result: "거짓 · 멈춘다" },
      vars: "넣기 3 · 꺼내기 1",
      layers: [
        {
          name: "result",
          values: [-1, 2, -1, -1, -1],
          write: [],
          caret: false,
          side: "답을 받은 자리 1 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [0, 2],
          slots: 2,
          read: [0],
          write: [1],
          side: "꼭대기 = 자리 2",
        },
        {
          label: "stack 의 값",
          values: [2, 2],
          slots: 2,
          read: [0],
          write: [1],
          side: "2 ≥ 2",
        },
      ],
    },
    {
      title: "T5 2 < 4 · 자리 2 꺼내기",
      text: "꼭대기 자리 2 의 값 2 가 지금 값 4 보다 작아 꺼내고, result[2] 에 4 를 적습니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 3],
      read: [2, 3],
      write: [],
      pointers: { top: 2, i: 3 },
      calc: { expr: "nums[2] < nums[3] → 2 < 4", result: "참 · 꺼낸다" },
      vars: "넣기 3 · 꺼내기 2",
      layers: [
        {
          name: "result",
          values: [-1, 2, 4, -1, -1],
          write: [2],
          caret: false,
          side: "답을 받은 자리 2 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [0],
          slots: 2,
          read: [],
          write: [],
          side: "꼭대기 = 자리 0",
        },
        {
          label: "stack 의 값",
          values: [2],
          slots: 2,
          read: [],
          write: [],
          side: "2",
        },
      ],
    },
    {
      title: "T6 2 < 4 · 자리 0 꺼내기",
      text: "꼭대기 자리 0 의 값 2 가 지금 값 4 보다 작아 꺼내고, result[0] 에 4 를 적습니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 3],
      read: [0, 3],
      write: [],
      pointers: { top: 0, i: 3 },
      calc: { expr: "nums[0] < nums[3] → 2 < 4", result: "참 · 꺼낸다" },
      vars: "넣기 3 · 꺼내기 3",
      layers: [
        {
          name: "result",
          values: [4, 2, 4, -1, -1],
          write: [0],
          caret: false,
          side: "답을 받은 자리 3 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [],
          slots: 2,
          read: [],
          write: [],
          side: "비었다",
        },
        {
          label: "stack 의 값",
          values: [],
          slots: 2,
          read: [],
          write: [],
          side: "비었다",
        },
      ],
    },
    {
      title: "T7 자리 3 넣기",
      text: "꺼낼 꼭대기가 더 없어 반복이 끝났습니다. 자리 3 을 넣습니다. 그 값은 4 입니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: { i: 3 },
      calc: { expr: "stack.length > 0", result: "거짓 · 넣는다" },
      vars: "넣기 4 · 꺼내기 3",
      layers: [
        {
          name: "result",
          values: [4, 2, 4, -1, -1],
          write: [],
          caret: false,
          side: "답을 받은 자리 3 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [3],
          slots: 2,
          read: [],
          write: [0],
          side: "꼭대기 = 자리 3",
        },
        {
          label: "stack 의 값",
          values: [4],
          slots: 2,
          read: [],
          write: [0],
          side: "4",
        },
      ],
    },
    {
      title: "T8 4 ≥ 3 · 멈추고 자리 4 넣기",
      text: "꼭대기 자리 3 의 값 4 는 지금 값 3 보다 작지 않아 멈춥니다. 자리 4 를 넣습니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 4],
      read: [3, 4],
      write: [],
      pointers: { top: 3, i: 4 },
      calc: { expr: "nums[3] < nums[4] → 4 < 3", result: "거짓 · 멈춘다" },
      vars: "넣기 5 · 꺼내기 3",
      layers: [
        {
          name: "result",
          values: [4, 2, 4, -1, -1],
          write: [],
          caret: false,
          side: "답을 받은 자리 3 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [3, 4],
          slots: 2,
          read: [0],
          write: [1],
          side: "꼭대기 = 자리 4",
        },
        {
          label: "stack 의 값",
          values: [4, 3],
          slots: 2,
          read: [0],
          write: [1],
          side: "4 ≥ 3",
        },
      ],
    },
    {
      title: "T9 남은 자리 3 · 4 는 -1",
      text: "순회가 끝났습니다. 단조 스택에 남은 자리 3 · 4 는 처음에 깐 -1 을 그대로 답으로 씁니다.",
      array: [2, 1, 2, 4, 3],
      range: [0, 4],
      read: [],
      write: [],
      pointers: {},
      calc: null,
      vars: "넣기 5 · 꺼내기 3",
      layers: [
        {
          name: "result",
          values: [4, 2, 4, -1, -1],
          write: [],
          caret: false,
          side: "답을 받은 자리 3 / 5",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [3, 4],
          slots: 2,
          read: [],
          write: [],
          side: "꼭대기 = 자리 4",
        },
        {
          label: "stack 의 값",
          values: [4, 3],
          slots: 2,
          read: [],
          write: [],
          side: "4 ≥ 3",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
