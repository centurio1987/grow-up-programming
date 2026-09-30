import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — 정수 여덟 `5 1 8 3 7 2 9 4` 와
 * 메모리 3 이고, 답이 `1 2 3 4 5 7 8 9` 다. `runWalk` 가 런을 만드는 T1~T4, `mergeWalk` 가 런 셋을
 * 합치는 T5~T13 이다. **T# 하나에 걸음 하나를 둔다.**
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다.
 *
 * - `runWalk` — 윗줄은 입력 파일이고 쥔 구간 `range` 가 이번에 메모리로 읽어 들인 값이다. `pieces` 가
 *   지금까지 적은 런의 자리이고, `layers` 의 「런 파일」이 적은 런의 값을 입력의 같은 자리에 놓은 줄이다.
 * - `mergeWalk` — 윗줄은 런 파일 셋을 이어 놓은 줄이다. `out` 이 이미 메모리로 읽어 들인 칸, `read` 가 이번에
 *   읽은 칸, `pieces` 가 런마다 아직 안 읽은 자리다. `layers` 의 두 줄이 최소 힙을 **꺼낼 차례대로**
 *   늘어놓은 띠(`dijkstra` 편이 세운 우선순위 큐 규약)이고, 첫 칸이 꼭대기다. 맨 아래 줄이 출력 파일이다.
 *
 * 누적 정수 입출력과 메모리에 든 정수는 무대 어디에도 자리가 없으므로 `vars` 에 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `externalMergeSort-guide.test.ts` 가 잰다.
 */

export const runWalk = {
  player: "stage",
  stage: "array",
  arrayName: "입력 파일",
  rangeLabel: "메모리",
  title: "externalMergeSort(5 1 8 3 7 2 9 4, 메모리 3) — 런 셋을 만든다",
  result: "런 0 1 5 8 · 런 1 2 3 7 · 런 2 4 9",
  steps: [
    {
      title: "T1 아직 아무것도 읽지 않았다",
      text: "입력 파일에 정수가 8 개 있고, 메모리에는 한 번에 3 개까지 듭니다. 아직 런도 최소 힙도 없습니다.",
      array: [5, 1, 8, 3, 7, 2, 9, 4],
      range: null,
      read: [],
      write: [],
      calc: null,
      vars: "읽은 정수 0 · 적은 정수 0 · 메모리 0 개",
      pieces: [],
      layers: [
        {
          name: "런 파일",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T2 런 0 을 적는다 ①",
      text: "5 1 8 을 메모리에 모았습니다. 3 === 3 이 참이라 ①, 정렬한 1 5 8 을 런 파일 하나로 적습니다.",
      array: [5, 1, 8, 3, 7, 2, 9, 4],
      range: [0, 2],
      read: [0, 1, 2],
      write: [],
      calc: {
        expr: "sort(5 1 8)",
        result: "1 5 8",
      },
      vars: "읽은 정수 3 · 적은 정수 3 · 메모리 3 개",
      pieces: [
        {
          label: "런 0",
          from: 0,
          to: 2,
          tone: "left",
        },
      ],
      layers: [
        {
          name: "런 파일",
          values: [1, 5, 8, null, null, null, null, null],
          read: [],
          write: [0, 1, 2],
        },
      ],
    },
    {
      title: "T3 런 1 을 적는다 ①",
      text: "3 7 2 를 메모리에 모았습니다. 3 === 3 이 참이라 ①, 정렬한 2 3 7 을 런 파일 하나로 적습니다.",
      array: [5, 1, 8, 3, 7, 2, 9, 4],
      range: [3, 5],
      read: [3, 4, 5],
      write: [],
      calc: {
        expr: "sort(3 7 2)",
        result: "2 3 7",
      },
      vars: "읽은 정수 6 · 적은 정수 6 · 메모리 3 개",
      pieces: [
        {
          label: "런 0",
          from: 0,
          to: 2,
          tone: "left",
        },
        {
          label: "런 1",
          from: 3,
          to: 5,
          tone: "right",
        },
      ],
      layers: [
        {
          name: "런 파일",
          values: [1, 5, 8, 2, 3, 7, null, null],
          read: [],
          write: [3, 4, 5],
        },
      ],
    },
    {
      title: "T4 자투리 런 2 를 적는다 ②",
      text: "9 4 를 메모리에 모았습니다. 2 === 3 은 거짓이지만 입력이 끝났고 값이 남아 ②, 정렬한 4 9 를 런 파일 하나로 적습니다.",
      array: [5, 1, 8, 3, 7, 2, 9, 4],
      range: [6, 7],
      read: [6, 7],
      write: [],
      calc: {
        expr: "sort(9 4)",
        result: "4 9",
      },
      vars: "읽은 정수 8 · 적은 정수 8 · 메모리 2 개",
      pieces: [
        {
          label: "런 0",
          from: 0,
          to: 2,
          tone: "left",
        },
        {
          label: "런 1",
          from: 3,
          to: 5,
          tone: "right",
        },
        {
          label: "런 2",
          from: 6,
          to: 7,
          tone: "left",
        },
      ],
      layers: [
        {
          name: "런 파일",
          values: [1, 5, 8, 2, 3, 7, 4, 9],
          read: [],
          write: [6, 7],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;

export const mergeWalk = {
  player: "stage",
  stage: "array",
  arrayName: "런 파일",
  rangeLabel: "합치는 런",
  title: "externalMergeSort(5 1 8 3 7 2 9 4, 메모리 3) — 런 셋을 하나로 합친다",
  result: "1 2 3 4 5 7 8 9",
  steps: [
    {
      title: "T5 런마다 첫 값을 올린다 ③",
      text: "런 3 개의 첫 값 1 · 2 · 4 를 최소 힙에 올립니다. 메모리에 든 정수는 3 개입니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 5 개",
      read: [0, 3, 6],
      write: [],
      out: [0, 3, 6],
      calc: null,
      vars: "읽은 정수 11 · 적은 정수 8 · 메모리 3 개",
      pieces: [
        {
          label: "런 0",
          from: 1,
          to: 2,
          tone: "left",
        },
        {
          label: "런 1",
          from: 4,
          to: 5,
          tone: "right",
        },
        {
          label: "런 2",
          from: 7,
          to: 7,
          tone: "left",
        },
      ],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [1, 2, 4],
          read: [],
          write: [0, 1, 2],
          side: "꺼낼 차례 · 크기 3",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [0, 1, 2],
          read: [],
          write: [0, 1, 2],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T6 1 을 적고 5 를 올린다 ④",
      text: "꼭대기 1 을 꺼내 출력 파일에 적습니다. 런 0 에서 다음 값 5 를 읽어 최소 힙에 올립니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 4 개",
      read: [1],
      write: [],
      out: [0, 1, 3, 6],
      calc: {
        expr: "min(1, 2, 4)",
        result: "1",
      },
      vars: "읽은 정수 12 · 적은 정수 9 · 메모리 3 개",
      pieces: [
        {
          label: "런 0",
          from: 2,
          to: 2,
          tone: "left",
        },
        {
          label: "런 1",
          from: 4,
          to: 5,
          tone: "right",
        },
        {
          label: "런 2",
          from: 7,
          to: 7,
          tone: "left",
        },
      ],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [2, 4, 5],
          read: [],
          write: [2],
          side: "꺼낼 차례 · 크기 3",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [1, 2, 0],
          read: [],
          write: [2],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, null, null, null, null, null, null, null],
          read: [],
          write: [0],
        },
      ],
    },
    {
      title: "T7 2 를 적고 3 을 올린다 ④",
      text: "꼭대기 2 를 꺼내 출력 파일에 적습니다. 런 1 에서 다음 값 3 을 읽어 최소 힙에 올립니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 3 개",
      read: [4],
      write: [],
      out: [0, 1, 3, 4, 6],
      calc: {
        expr: "min(2, 4, 5)",
        result: "2",
      },
      vars: "읽은 정수 13 · 적은 정수 10 · 메모리 3 개",
      pieces: [
        {
          label: "런 0",
          from: 2,
          to: 2,
          tone: "left",
        },
        {
          label: "런 1",
          from: 5,
          to: 5,
          tone: "right",
        },
        {
          label: "런 2",
          from: 7,
          to: 7,
          tone: "left",
        },
      ],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [3, 4, 5],
          read: [],
          write: [0],
          side: "꺼낼 차례 · 크기 3",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [1, 2, 0],
          read: [],
          write: [0],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, 2, null, null, null, null, null, null],
          read: [],
          write: [1],
        },
      ],
    },
    {
      title: "T8 3 을 적고 7 을 올린다 ④",
      text: "꼭대기 3 을 꺼내 출력 파일에 적습니다. 런 1 에서 다음 값 7 을 읽어 최소 힙에 올립니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 2 개",
      read: [5],
      write: [],
      out: [0, 1, 3, 4, 5, 6],
      calc: {
        expr: "min(3, 4, 5)",
        result: "3",
      },
      vars: "읽은 정수 14 · 적은 정수 11 · 메모리 3 개",
      pieces: [
        {
          label: "런 0",
          from: 2,
          to: 2,
          tone: "left",
        },
        {
          label: "런 2",
          from: 7,
          to: 7,
          tone: "left",
        },
      ],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [4, 5, 7],
          read: [],
          write: [2],
          side: "꺼낼 차례 · 크기 3",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [2, 0, 1],
          read: [],
          write: [2],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, 2, 3, null, null, null, null, null],
          read: [],
          write: [2],
        },
      ],
    },
    {
      title: "T9 4 를 적고 9 를 올린다 ④",
      text: "꼭대기 4 를 꺼내 출력 파일에 적습니다. 런 2 에서 다음 값 9 를 읽어 최소 힙에 올립니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 1 개",
      read: [7],
      write: [],
      out: [0, 1, 3, 4, 5, 6, 7],
      calc: {
        expr: "min(4, 5, 7)",
        result: "4",
      },
      vars: "읽은 정수 15 · 적은 정수 12 · 메모리 3 개",
      pieces: [
        {
          label: "런 0",
          from: 2,
          to: 2,
          tone: "left",
        },
      ],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [5, 7, 9],
          read: [],
          write: [2],
          side: "꺼낼 차례 · 크기 3",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [0, 1, 2],
          read: [],
          write: [2],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, 2, 3, 4, null, null, null, null],
          read: [],
          write: [3],
        },
      ],
    },
    {
      title: "T10 5 를 적고 8 을 올린다 ④",
      text: "꼭대기 5 를 꺼내 출력 파일에 적습니다. 런 0 에서 다음 값 8 을 읽어 최소 힙에 올립니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 0 개",
      read: [2],
      write: [],
      out: [0, 1, 2, 3, 4, 5, 6, 7],
      calc: {
        expr: "min(5, 7, 9)",
        result: "5",
      },
      vars: "읽은 정수 16 · 적은 정수 13 · 메모리 3 개",
      pieces: [],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [7, 8, 9],
          read: [],
          write: [1],
          side: "꺼낼 차례 · 크기 3",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [1, 0, 2],
          read: [],
          write: [1],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, 2, 3, 4, 5, null, null, null],
          read: [],
          write: [4],
        },
      ],
    },
    {
      title: "T11 7 을 적고 런 1 이 끝난다 ④",
      text: "꼭대기 7 을 꺼내 출력 파일에 적습니다. 런 1 의 다음 값이 null 이라 올리지 않고, 최소 힙이 2 개로 줄어듭니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 0 개",
      read: [],
      write: [],
      out: [0, 1, 2, 3, 4, 5, 6, 7],
      calc: {
        expr: "min(7, 8, 9)",
        result: "7",
      },
      vars: "읽은 정수 16 · 적은 정수 14 · 메모리 2 개",
      pieces: [],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [8, 9, null],
          read: [],
          write: [],
          side: "꺼낼 차례 · 크기 2",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [0, 2, null],
          read: [],
          write: [],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, 2, 3, 4, 5, 7, null, null],
          read: [],
          write: [5],
        },
      ],
    },
    {
      title: "T12 8 을 적고 런 0 이 끝난다 ④",
      text: "꼭대기 8 을 꺼내 출력 파일에 적습니다. 런 0 의 다음 값이 null 이라 올리지 않고, 최소 힙이 1 개로 줄어듭니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 0 개",
      read: [],
      write: [],
      out: [0, 1, 2, 3, 4, 5, 6, 7],
      calc: {
        expr: "min(8, 9)",
        result: "8",
      },
      vars: "읽은 정수 16 · 적은 정수 15 · 메모리 1 개",
      pieces: [],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [9, null, null],
          read: [],
          write: [],
          side: "꺼낼 차례 · 크기 1",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [2, null, null],
          read: [],
          write: [],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, 2, 3, 4, 5, 7, 8, null],
          read: [],
          write: [6],
        },
      ],
    },
    {
      title: "T13 9 를 적고 런 2 가 끝난다 ④",
      text: "꼭대기 9 를 꺼내 출력 파일에 적습니다. 런 2 의 다음 값이 null 이라 올리지 않고, 최소 힙이 0 개로 줄어듭니다.",
      array: [1, 5, 8, 2, 3, 7, 4, 9],
      range: [0, 7],
      rangeSide: "안 읽은 값 0 개",
      read: [],
      write: [],
      out: [0, 1, 2, 3, 4, 5, 6, 7],
      calc: {
        expr: "min(9)",
        result: "9",
      },
      vars: "읽은 정수 16 · 적은 정수 16 · 메모리 0 개",
      pieces: [],
      layers: [
        {
          name: "최소 힙 · 값",
          values: [null, null, null],
          read: [],
          write: [],
          side: "꺼낼 차례 · 크기 0",
          caret: false,
        },
        {
          name: "최소 힙 · 런",
          values: [null, null, null],
          read: [],
          write: [],
          side: "값이 나온 런",
        },
        {
          name: "출력 파일",
          values: [1, 2, 3, 4, 5, 7, 8, 9],
          read: [],
          write: [7],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
