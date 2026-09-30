import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `5, 15, 1, 3, 5` 을 차례로 넣으며 묻는다.
 * T1 은 시작값, T2~T4 는 첫 `addNum` 의 세 줄을 갈라 본 것, T5~T8 은 나머지 넷을 한 걸음에 하나씩,
 * T9 는 다섯 수가 다 들어온 상태다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 윗줄은 입력 흐름이고 쥔 구간 `range` 가 지금까지 들어온 수,
 * `read` 가 이번 걸음에 넣는 수다. 그 아래 `layers` 두 줄이 작은 쪽(최대 힙)과 큰 쪽(최소 힙)을
 * **꺼낼 차례대로** 늘어놓은 띠다(`dijkstra` 편이 세운 우선순위 큐 규약) — 첫 칸이 꼭대기이고, 빈 칸은
 * `null`, 곁말은 힙의 크기다. 새로 들어온 값은 `write`, `findMedian` 이 읽은 두 꼭대기는 `read` 다.
 * 답을 만드는 계산 한 줄은 알약(`calc`)에 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `medianFromDataStream-guide.test.ts` 가 잰다.
 */

export const medianWalk = {
  player: "stage",
  stage: "array",
  arrayName: "들어오는 수",
  rangeLabel: "들어온 수",
  title: "addNum(5) addNum(15) addNum(1) addNum(3) addNum(5) 사이의 findMedian",
  result: "5",
  steps: [
    {
      title: "T1 시작값",
      text: "두 힙이 모두 비어 있습니다. 아직 들어온 수가 없어 물어볼 수도 없습니다.",
      array: [5, 15, 1, 3, 5],
      range: null,
      read: [],
      write: [],
      calc: null,
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [null, null, null],
          read: [],
          write: [],
          side: "최대 힙 · 크기 0",
        },
        {
          name: "큰 쪽 high",
          values: [null, null, null],
          read: [],
          write: [],
          side: "최소 힙 · 크기 0",
        },
      ],
    },
    {
      title: "T2 addNum(5) ①",
      text: "5 를 어느 쪽에 속하는지 비교하지 않고 작은 쪽에 넣습니다. 갈래 ① 입니다.",
      array: [5, 15, 1, 3, 5],
      range: [0, 0],
      read: [0],
      write: [],
      calc: null,
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [5, null, null],
          read: [],
          write: [0],
          side: "최대 힙 · 크기 1",
        },
        {
          name: "큰 쪽 high",
          values: [null, null, null],
          read: [],
          write: [],
          side: "최소 힙 · 크기 0",
        },
      ],
    },
    {
      title: "T3 addNum(5) ②",
      text: "작은 쪽의 꼭대기 5 를 꺼내 큰 쪽에 넣습니다. 갈래 ② 입니다.",
      array: [5, 15, 1, 3, 5],
      range: [0, 0],
      read: [0],
      write: [],
      calc: null,
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [null, null, null],
          read: [],
          write: [],
          side: "최대 힙 · 크기 0",
        },
        {
          name: "큰 쪽 high",
          values: [5, null, null],
          read: [],
          write: [0],
          side: "최소 힙 · 크기 1",
        },
      ],
    },
    {
      title: "T4 addNum(5) ③ · findMedian",
      text: "큰 쪽 1 개가 작은 쪽 0 개보다 많아 5 를 도로 옮깁니다(③ 참). 두 크기가 1 과 0 으로 달라 작은 쪽 꼭대기 5 가 답입니다(④ 거짓).",
      array: [5, 15, 1, 3, 5],
      range: [0, 0],
      read: [0],
      write: [],
      calc: {
        expr: "작은 쪽 꼭대기",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [5, null, null],
          read: [0],
          write: [0],
          side: "최대 힙 · 크기 1",
        },
        {
          name: "큰 쪽 high",
          values: [null, null, null],
          read: [],
          write: [],
          side: "최소 힙 · 크기 0",
        },
      ],
    },
    {
      title: "T5 addNum(15) · findMedian",
      text: "15 를 작은 쪽에 넣고 꼭대기 15 를 큰 쪽으로 옮깁니다. 두 크기가 1 과 1 이라 도로 옮기지 않습니다(③ 거짓). 두 크기가 같아 두 꼭대기의 평균 10 이 답입니다(④ 참).",
      array: [5, 15, 1, 3, 5],
      range: [0, 1],
      read: [1],
      write: [],
      calc: {
        expr: "(5 + 15) / 2",
        result: "10",
      },
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [5, null, null],
          read: [0],
          write: [],
          side: "최대 힙 · 크기 1",
        },
        {
          name: "큰 쪽 high",
          values: [15, null, null],
          read: [0],
          write: [0],
          side: "최소 힙 · 크기 1",
        },
      ],
    },
    {
      title: "T6 addNum(1) · findMedian",
      text: "1 을 작은 쪽에 넣고 꼭대기 5 를 큰 쪽으로 옮깁니다. 큰 쪽이 2 개로 많아져 5 를 도로 옮깁니다(③ 참). 두 크기가 달라 작은 쪽 꼭대기 5 가 답입니다(④ 거짓).",
      array: [5, 15, 1, 3, 5],
      range: [0, 2],
      read: [2],
      write: [],
      calc: {
        expr: "작은 쪽 꼭대기",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [5, 1, null],
          read: [0],
          write: [1],
          side: "최대 힙 · 크기 2",
        },
        {
          name: "큰 쪽 high",
          values: [15, null, null],
          read: [0],
          write: [],
          side: "최소 힙 · 크기 1",
        },
      ],
    },
    {
      title: "T7 addNum(3) · findMedian",
      text: "3 을 작은 쪽에 넣고 꼭대기 5 를 큰 쪽으로 옮깁니다. 두 크기가 2 와 2 라 도로 옮기지 않습니다(③ 거짓). 두 크기가 같아 두 꼭대기의 평균 4 가 답입니다(④ 참).",
      array: [5, 15, 1, 3, 5],
      range: [0, 3],
      read: [3],
      write: [],
      calc: {
        expr: "(3 + 5) / 2",
        result: "4",
      },
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [3, 1, null],
          read: [0],
          write: [0],
          side: "최대 힙 · 크기 2",
        },
        {
          name: "큰 쪽 high",
          values: [5, 15, null],
          read: [0],
          write: [0],
          side: "최소 힙 · 크기 2",
        },
      ],
    },
    {
      title: "T8 addNum(5) · findMedian",
      text: "5 를 작은 쪽에 넣고 꼭대기 5 를 큰 쪽으로 옮깁니다. 큰 쪽이 3 개로 많아져 5 를 도로 옮깁니다(③ 참). 두 크기가 달라 작은 쪽 꼭대기 5 가 답입니다(④ 거짓).",
      array: [5, 15, 1, 3, 5],
      range: [0, 4],
      read: [4],
      write: [],
      calc: {
        expr: "작은 쪽 꼭대기",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [5, 3, 1],
          read: [0],
          write: [0],
          side: "최대 힙 · 크기 3",
        },
        {
          name: "큰 쪽 high",
          values: [5, 15, null],
          read: [0],
          write: [],
          side: "최소 힙 · 크기 2",
        },
      ],
    },
    {
      title: "T9 종료",
      text: "다섯 수가 다 들어왔습니다. 정렬하면 1 3 5 5 15 이고, 가운데 자리의 값 5 가 작은 쪽 꼭대기와 같습니다.",
      array: [5, 15, 1, 3, 5],
      range: [0, 4],
      read: [],
      write: [],
      calc: {
        expr: "작은 쪽 꼭대기",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "작은 쪽 low",
          values: [5, 3, 1],
          read: [0],
          write: [],
          side: "최대 힙 · 크기 3",
        },
        {
          name: "큰 쪽 high",
          values: [5, 15, null],
          read: [0],
          write: [],
          side: "최소 힙 · 크기 2",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
