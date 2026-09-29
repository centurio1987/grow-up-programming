import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `N = 5`, `A = [3, 4, 4, 6, 1, 4, 4]`.
 * `counters` 는 시작 T1, 연산 하나씩을 처리하는 T2~T8, 마지막 채우기 T9 다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 맨 위 줄은 연산 배열 `A` 이고, 괄호는 지금까지 처리한 연산 `[0,k]`,
 * ▲ 는 이번에 꺼낸 연산이다. 그 아래에 알고리즘이 드는 저장값 배열 `counter` 와, 저장값과 바닥값으로 정해지는
 * 참값 줄을 `layers` 로 쌓는다(SPEC §13 배열 줄). 두 줄의 칸 `i` 는 카운터 `i` 다. 저장값 줄의 곁말은 저장값이
 * 바닥값보다 작은 칸(옛 값)의 수이고, 참값 줄의 곁말이 바닥값 `base` 다. 계산 한 줄은 알약(`calc`), 자리가 없는 `high` 는
 * 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `maxCounters-guide.test.ts` 가 잰다.
 */

export const counters = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "처리한 연산",
  title: "maxCounters(5, [3, 4, 4, 6, 1, 4, 4])",
  result: "[3, 2, 2, 4, 2]",
  steps: [
    {
      title: "T1 시작",
      text: "연산을 하나도 처리하지 않은 상태입니다. 카운터 5 칸이 모두 0 이고 base 와 high 도 0 입니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: null,
      read: [],
      write: [],
      calc: null,
      vars: "high = 0",
      layers: [
        {
          name: "counter",
          values: [0, 0, 0, 0, 0],
          read: [],
          write: [],
          side: "옛 값 0 칸",
        },
        {
          name: "참값",
          values: [0, 0, 0, 0, 0],
          read: [],
          write: [],
          side: "base = 0",
        },
      ],
    },
    {
      title: "T2 k=0 · A[k]=3 ①",
      text: "3 번 카운터(i = 2)를 증가시킵니다. 저장값 0 이 base 0 보다 작지 않아 저장값에서 출발합니다. counter[2] = 1 입니다. high 가 1 로 오릅니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        k: 0,
      },
      calc: {
        expr: "max(0, 0) + 1",
        result: "1",
      },
      vars: "high = 1",
      layers: [
        {
          name: "counter",
          values: [0, 0, 1, 0, 0],
          read: [2],
          write: [2],
          side: "옛 값 0 칸",
        },
        {
          name: "참값",
          values: [0, 0, 1, 0, 0],
          read: [],
          write: [2],
          side: "base = 0",
        },
      ],
    },
    {
      title: "T3 k=1 · A[k]=4 ①",
      text: "4 번 카운터(i = 3)를 증가시킵니다. 저장값 0 이 base 0 보다 작지 않아 저장값에서 출발합니다. counter[3] = 1 입니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: {
        k: 1,
      },
      calc: {
        expr: "max(0, 0) + 1",
        result: "1",
      },
      vars: "high = 1",
      layers: [
        {
          name: "counter",
          values: [0, 0, 1, 1, 0],
          read: [3],
          write: [3],
          side: "옛 값 0 칸",
        },
        {
          name: "참값",
          values: [0, 0, 1, 1, 0],
          read: [],
          write: [3],
          side: "base = 0",
        },
      ],
    },
    {
      title: "T4 k=2 · A[k]=4 ①",
      text: "4 번 카운터(i = 3)를 증가시킵니다. 저장값 1 이 base 0 보다 작지 않아 저장값에서 출발합니다. counter[3] = 2 입니다. high 가 2 로 오릅니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: {
        k: 2,
      },
      calc: {
        expr: "max(1, 0) + 1",
        result: "2",
      },
      vars: "high = 2",
      layers: [
        {
          name: "counter",
          values: [0, 0, 1, 2, 0],
          read: [3],
          write: [3],
          side: "옛 값 0 칸",
        },
        {
          name: "참값",
          values: [0, 0, 1, 2, 0],
          read: [],
          write: [3],
          side: "base = 0",
        },
      ],
    },
    {
      title: "T5 k=3 · A[k]=6 ②",
      text: "A[k] = 6 이 N + 1 이라 최대 맞추기입니다. counter 는 그대로 두고 base 를 high 인 2 로 옮깁니다. 참값이 4 칸에서 바뀝니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: {
        k: 3,
      },
      calc: {
        expr: "base = high",
        result: "2",
      },
      vars: "high = 2",
      layers: [
        {
          name: "counter",
          values: [0, 0, 1, 2, 0],
          read: [],
          write: [],
          side: "옛 값 4 칸",
        },
        {
          name: "참값",
          values: [2, 2, 2, 2, 2],
          read: [],
          write: [0, 1, 2, 4],
          side: "base = 2",
        },
      ],
    },
    {
      title: "T6 k=4 · A[k]=1 ①",
      text: "1 번 카운터(i = 0)를 증가시킵니다. 저장값 0 이 base 2 보다 작아 base 에서 출발합니다. counter[0] = 3 입니다. high 가 3 으로 오릅니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 4],
      read: [4],
      write: [],
      pointers: {
        k: 4,
      },
      calc: {
        expr: "max(0, 2) + 1",
        result: "3",
      },
      vars: "high = 3",
      layers: [
        {
          name: "counter",
          values: [3, 0, 1, 2, 0],
          read: [0],
          write: [0],
          side: "옛 값 3 칸",
        },
        {
          name: "참값",
          values: [3, 2, 2, 2, 2],
          read: [],
          write: [0],
          side: "base = 2",
        },
      ],
    },
    {
      title: "T7 k=5 · A[k]=4 ①",
      text: "4 번 카운터(i = 3)를 증가시킵니다. 저장값 2 가 base 2 보다 작지 않아 저장값에서 출발합니다. counter[3] = 3 입니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 5],
      read: [5],
      write: [],
      pointers: {
        k: 5,
      },
      calc: {
        expr: "max(2, 2) + 1",
        result: "3",
      },
      vars: "high = 3",
      layers: [
        {
          name: "counter",
          values: [3, 0, 1, 3, 0],
          read: [3],
          write: [3],
          side: "옛 값 3 칸",
        },
        {
          name: "참값",
          values: [3, 2, 2, 3, 2],
          read: [],
          write: [3],
          side: "base = 2",
        },
      ],
    },
    {
      title: "T8 k=6 · A[k]=4 ①",
      text: "4 번 카운터(i = 3)를 증가시킵니다. 저장값 3 이 base 2 보다 작지 않아 저장값에서 출발합니다. counter[3] = 4 입니다. high 가 4 로 오릅니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 6],
      read: [6],
      write: [],
      pointers: {
        k: 6,
      },
      calc: {
        expr: "max(3, 2) + 1",
        result: "4",
      },
      vars: "high = 4",
      layers: [
        {
          name: "counter",
          values: [3, 0, 1, 4, 0],
          read: [3],
          write: [3],
          side: "옛 값 3 칸",
        },
        {
          name: "참값",
          values: [3, 2, 2, 4, 2],
          read: [],
          write: [3],
          side: "base = 2",
        },
      ],
    },
    {
      title: "T9 마지막 채우기 ③",
      text: "base 2 에 못 미치는 3 칸에만 2 를 적습니다. 저장값과 참값이 모든 칸에서 같아집니다.",
      array: [3, 4, 4, 6, 1, 4, 4],
      range: [0, 6],
      read: [],
      write: [],
      calc: {
        expr: "counter[i] < 2 인 칸",
        result: "3 칸에 2",
      },
      vars: "high = 4",
      layers: [
        {
          name: "counter",
          values: [3, 2, 2, 4, 2],
          read: [],
          write: [1, 2, 4],
          side: "옛 값 0 칸",
        },
        {
          name: "참값",
          values: [3, 2, 2, 4, 2],
          read: [],
          write: [],
          side: "base = 2",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
