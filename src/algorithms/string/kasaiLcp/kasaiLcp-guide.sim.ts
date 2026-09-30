import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `s = "banana"` 와 그 접미사 배열. 걸음은
 * T1~T8 전부다 — 순위 배열 만들기 · 문자열 자리 여섯을 차례로 한 걸음씩 · 답 돌려주기.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 값 줄은 문자열 `s` 의 글자이고, `layers` 가 순위 배열 `inv` 한 줄이다 — 둘 다
 * 칸 번호가 문자열 자리다. 접미사 배열 `sa` 와 LCP 배열 `lcp` 는 칸 번호가 사전순 자리 `k` 라 `map`(키 `k` ·
 * 값 `sa[k]` · 더한 줄 `lcp[k]`)으로 맨 아래에 둔다. 자리 걸음의 `pieces` 는 자리 `i` 와 이웃 `j` 에서 시작해
 * 함께 가진 앞부분이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `kasaiLcp-guide.test.ts` 가 잰다.
 */

export const kasaiWalk = {
  player: "stage",
  stage: "array",
  arrayName: "s",
  rangeLabel: "문자열",
  title: 'kasaiLcp("banana", [5, 3, 1, 0, 4, 2])',
  result: "[1, 3, 0, 0, 2, 0]",
  steps: [
    {
      title: "T1 순위 배열을 만든다",
      text: "sa 를 한 번 지나며 inv[sa[r]] = r 을 적습니다. inv = [3, 2, 5, 1, 4, 0] 입니다. lcp 는 칸마다 0 으로 채워 두었고 k 는 0 에서 시작합니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "sa 를 한 번 지난다",
      read: [],
      write: [],
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [],
          write: [0, 1, 2, 3, 4, 5],
          side: "자리 → sa 의 칸",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [0, 1, 2, 3, 4, 5],
        extra: [
          {
            label: "lcp[r]",
            values: [0, 0, 0, 0, 0, 0],
            write: [],
            side: "적은 칸 0 / 5",
          },
        ],
      },
      calc: null,
      vars: "글자 비교 누적 0 번",
    },
    {
      title: "T2 자리 0 — 첫 글자부터 다르다",
      text: "inv[0] = 3 이라 이웃은 sa[4] = 4 입니다. k = 0 에서 비교를 시작합니다. s[0] = b 와 s[4] = n 이 달라 멈춥니다. lcp[3] = 0 을 적고 k = 0 을 넘깁니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "들어올 때 k = 0 · 넘기는 k = 0",
      read: [0, 4],
      write: [],
      pointers: {
        i: 0,
        j: 4,
      },
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [0],
          write: [],
          side: "자리 → sa 의 칸",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [4],
        extra: [
          {
            label: "lcp[r]",
            values: [0, 0, 0, 0, 0, 0],
            write: [3],
            side: "적은 칸 1 / 5",
          },
        ],
      },
      calc: {
        expr: "lcp[inv[0]] = lcp[3]",
        result: "0",
      },
      vars: "글자 비교 누적 1 번",
    },
    {
      title: "T3 자리 1 — 첫 글자부터 다르다",
      text: "inv[1] = 2 라 이웃은 sa[3] = 0 입니다. k = 0 에서 비교를 시작합니다. s[1] = a 와 s[0] = b 가 달라 멈춥니다. lcp[2] = 0 을 적고 k = 0 을 넘깁니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "들어올 때 k = 0 · 넘기는 k = 0",
      read: [0, 1],
      write: [],
      pointers: {
        i: 1,
        j: 0,
      },
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [1],
          write: [],
          side: "자리 → sa 의 칸",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [3],
        extra: [
          {
            label: "lcp[r]",
            values: [0, 0, 0, 0, 0, 0],
            write: [2],
            side: "적은 칸 2 / 5",
          },
        ],
      },
      calc: {
        expr: "lcp[inv[1]] = lcp[2]",
        result: "0",
      },
      vars: "글자 비교 누적 2 번",
    },
    {
      title: "T4 자리 2 — 이웃이 없다",
      text: "inv[2] = 5 가 n − 1 = 5 와 같아 sa 의 마지막 칸입니다. 비교할 이웃이 없어 답을 적지 않고 k 를 0 으로 둡니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "들어올 때 k = 0 · 넘기는 k = 0",
      read: [],
      write: [],
      pointers: {
        i: 2,
      },
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [2],
          write: [],
          side: "자리 → sa 의 칸",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [],
        extra: [
          {
            label: "lcp[r]",
            values: [0, 0, 0, 0, 0, 0],
            write: [],
            side: "적은 칸 2 / 5",
          },
        ],
      },
      calc: {
        expr: "inv[2] = 5 = n − 1",
        result: "이웃 없음",
      },
      vars: "글자 비교 누적 2 번",
    },
    {
      title: "T5 자리 3 — 글자 3 개가 같아 길이 3",
      text: "inv[3] = 1 이라 이웃은 sa[2] = 1 입니다. k = 0 에서 비교를 시작합니다. 같은 글자 3 개로 k 가 3 이 됐고, 자리 3 의 접미사가 3 글자에서 끝나 멈춥니다. lcp[1] = 3 을 적고 k = 2 를 넘깁니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "들어올 때 k = 0 · 넘기는 k = 2",
      read: [1, 2, 3, 4, 5],
      write: [],
      pointers: {
        i: 3,
        j: 1,
      },
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [3],
          write: [],
          side: "자리 → sa 의 칸",
        },
      ],
      pieces: [
        {
          label: "자리 3",
          from: 3,
          to: 5,
          tone: "left",
          text: "ana",
        },
        {
          label: "이웃 1",
          from: 1,
          to: 3,
          tone: "right",
          text: "ana",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [2],
        extra: [
          {
            label: "lcp[r]",
            values: [0, 3, 0, 0, 0, 0],
            write: [1],
            side: "적은 칸 3 / 5",
          },
        ],
      },
      calc: {
        expr: "lcp[inv[3]] = lcp[1]",
        result: "3",
      },
      vars: "글자 비교 누적 5 번",
    },
    {
      title: "T6 자리 4 — 이어받은 2 가 그대로 길이",
      text: "inv[4] = 4 라 이웃은 sa[5] = 2 입니다. 이어받은 k = 2 에서 비교를 시작합니다. 자리 4 의 접미사가 2 글자에서 끝나 멈춥니다. lcp[4] = 2 를 적고 k = 1 을 넘깁니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "들어올 때 k = 2 · 넘기는 k = 1",
      read: [],
      write: [],
      pointers: {
        i: 4,
        j: 2,
      },
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [4],
          write: [],
          side: "자리 → sa 의 칸",
        },
      ],
      pieces: [
        {
          label: "자리 4",
          from: 4,
          to: 5,
          tone: "left",
          text: "na",
        },
        {
          label: "이웃 2",
          from: 2,
          to: 3,
          tone: "right",
          text: "na",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [5],
        extra: [
          {
            label: "lcp[r]",
            values: [0, 3, 0, 0, 2, 0],
            write: [4],
            side: "적은 칸 4 / 5",
          },
        ],
      },
      calc: {
        expr: "lcp[inv[4]] = lcp[4]",
        result: "2",
      },
      vars: "글자 비교 누적 5 번",
    },
    {
      title: "T7 자리 5 — 이어받은 1 이 그대로 길이",
      text: "inv[5] = 0 이라 이웃은 sa[1] = 3 입니다. 이어받은 k = 1 에서 비교를 시작합니다. 자리 5 의 접미사가 1 글자에서 끝나 멈춥니다. lcp[0] = 1 을 적고 k = 0 을 넘깁니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "들어올 때 k = 1 · 넘기는 k = 0",
      read: [],
      write: [],
      pointers: {
        i: 5,
        j: 3,
      },
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [5],
          write: [],
          side: "자리 → sa 의 칸",
        },
      ],
      pieces: [
        {
          label: "자리 5",
          from: 5,
          to: 5,
          tone: "left",
          text: "a",
        },
        {
          label: "이웃 3",
          from: 3,
          to: 3,
          tone: "right",
          text: "a",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [1],
        extra: [
          {
            label: "lcp[r]",
            values: [1, 3, 0, 0, 2, 0],
            write: [0],
            side: "적은 칸 5 / 5",
          },
        ],
      },
      calc: {
        expr: "lcp[inv[5]] = lcp[0]",
        result: "1",
      },
      vars: "글자 비교 누적 5 번",
    },
    {
      title: "T8 답을 돌려준다",
      text: "자리 6 개를 다 처리했습니다. 글자 비교는 5 번이고 lcp = [1, 3, 0, 0, 2, 0] 입니다. 이웃이 없는 칸 5 는 처음 잡은 0 그대로입니다.",
      array: ["b", "a", "n", "a", "n", "a"],
      range: [0, 5],
      rangeSide: "자리를 다 처리했다",
      read: [],
      write: [],
      layers: [
        {
          name: "inv",
          values: [3, 2, 5, 1, 4, 0],
          read: [],
          write: [],
          side: "자리 → sa 의 칸",
        },
      ],
      map: {
        keyLabel: "r",
        valueLabel: "sa[r]",
        entries: [
          [0, 5],
          [1, 3],
          [2, 1],
          [3, 0],
          [4, 4],
          [5, 2],
        ],
        slots: 6,
        read: [],
        extra: [
          {
            label: "lcp[r]",
            values: [1, 3, 0, 0, 2, 0],
            write: [],
            side: "적은 칸 5 / 5",
          },
        ],
      },
      calc: {
        expr: "돌려줄 lcp",
        result: "[1, 3, 0, 0, 2, 0]",
      },
      vars: "글자 비교 누적 5 번",
    },
  ],
} satisfies ArrayPlayerSpec;
