/**
 * 걸음 재생 패널 두 벌 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임
 * 제목은 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — claude-design 「Step Player」 시안(KAN-057 검토 지적 6)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "levels"` 가
 * 무대 갈래를 고른다. 무대에는 입력 배열이 아니라 **알고리즘이 쌓는 구조(층)** 전체를 그리고, 걸음마다
 * 칸의 상태만 바꾼다. 필드는 시안 2절 「걸음 데이터에 필요한 필드」다.
 *
 * - 쌓는 벌: `levels`(아직 안 쓴 칸은 `null`) · `read`(이번에 읽은 아래층 두 칸) · `write`(새로 쓴 칸과
 *   그 칸이 덮는 배열 구간)
 * - 답하는 벌: `query` · `level` · `lookup` · `pieces`(두 조각) · `overlap` · `answers` · `answerSlots`
 *
 * 계산 알약(`min(5, 2) = 2`)과 남는 변수(`채운 칸 1 / 8`)는 이 필드에서 패널이 만든다 — 따로 적지 않는다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본을 실행해 낸
 * 결과를 옮긴 것이고, 둘이 같은지는 `sparseTableRangeMin-guide.test.ts` 가 잰다. 정본이 바뀌면 그
 * 시험이 걸린다.
 */

export const build = {
  player: "stage",
  stage: "levels",
  op: "min",
  arrayName: "A",
  title: "Sparse Table 을 쌓는다 — A = [5, 2, 7, 4, 6, 3]",
  sub: "T3–T10 · 걸음마다 위층 칸 하나",
  result: "[2, 2, 3]",
  steps: [
    {
      title: "T3 1 층 칸 0 만들기",
      text: "0 층 칸 0 과 칸 1 을 읽고, 작은 쪽을 1 층 칸 0 에 씁니다. 이 칸은 배열 [0,1] 을 덮습니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, null, null, null, null],
        [null, null, null],
      ],
      read: [
        {
          level: 0,
          index: 0,
        },
        {
          level: 0,
          index: 1,
        },
      ],
      write: {
        level: 1,
        index: 0,
        value: 2,
        covers: [0, 1],
      },
    },
    {
      title: "T4 1 층 칸 1 만들기",
      text: "0 층 칸 1 과 칸 2 를 읽고, 작은 쪽을 1 층 칸 1 에 씁니다. 이 칸은 배열 [1,2] 를 덮습니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, null, null, null],
        [null, null, null],
      ],
      read: [
        {
          level: 0,
          index: 1,
        },
        {
          level: 0,
          index: 2,
        },
      ],
      write: {
        level: 1,
        index: 1,
        value: 2,
        covers: [1, 2],
      },
    },
    {
      title: "T5 1 층 칸 2 만들기",
      text: "0 층 칸 2 와 칸 3 을 읽고, 작은 쪽을 1 층 칸 2 에 씁니다. 이 칸은 배열 [2,3] 을 덮습니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, null, null],
        [null, null, null],
      ],
      read: [
        {
          level: 0,
          index: 2,
        },
        {
          level: 0,
          index: 3,
        },
      ],
      write: {
        level: 1,
        index: 2,
        value: 4,
        covers: [2, 3],
      },
    },
    {
      title: "T6 1 층 칸 3 만들기",
      text: "0 층 칸 3 과 칸 4 를 읽고, 작은 쪽을 1 층 칸 3 에 씁니다. 이 칸은 배열 [3,4] 를 덮습니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, null],
        [null, null, null],
      ],
      read: [
        {
          level: 0,
          index: 3,
        },
        {
          level: 0,
          index: 4,
        },
      ],
      write: {
        level: 1,
        index: 3,
        value: 4,
        covers: [3, 4],
      },
    },
    {
      title: "T7 1 층 칸 4 만들기",
      text: "0 층 칸 4 와 칸 5 를 읽고, 작은 쪽을 1 층 칸 4 에 씁니다. 이 칸은 배열 [4,5] 를 덮습니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [null, null, null],
      ],
      read: [
        {
          level: 0,
          index: 4,
        },
        {
          level: 0,
          index: 5,
        },
      ],
      write: {
        level: 1,
        index: 4,
        value: 3,
        covers: [4, 5],
      },
    },
    {
      title: "T8 2 층 칸 0 만들기",
      text: "1 층에서 2 칸 떨어진 칸 0 과 칸 2 를 읽습니다. 두 칸이 덮는 [0,1] 과 [2,3] 을 이어 붙이면 새 칸이 덮는 [0,3] 이 됩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, null, null],
      ],
      read: [
        {
          level: 1,
          index: 0,
        },
        {
          level: 1,
          index: 2,
        },
      ],
      write: {
        level: 2,
        index: 0,
        value: 2,
        covers: [0, 3],
      },
    },
    {
      title: "T9 2 층 칸 1 만들기",
      text: "1 층에서 2 칸 떨어진 칸 1 과 칸 3 을 읽습니다. 두 칸이 덮는 [1,2] 와 [3,4] 를 이어 붙이면 새 칸이 덮는 [1,4] 가 됩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, 2, null],
      ],
      read: [
        {
          level: 1,
          index: 1,
        },
        {
          level: 1,
          index: 3,
        },
      ],
      write: {
        level: 2,
        index: 1,
        value: 2,
        covers: [1, 4],
      },
    },
    {
      title: "T10 2 층 칸 2 만들기",
      text: "1 층에서 2 칸 떨어진 칸 2 와 칸 4 를 읽습니다. 두 칸이 덮는 [2,3] 과 [4,5] 를 이어 붙이면 새 칸이 덮는 [2,5] 가 됩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, 2, 3],
      ],
      read: [
        {
          level: 1,
          index: 2,
        },
        {
          level: 1,
          index: 4,
        },
      ],
      write: {
        level: 2,
        index: 2,
        value: 3,
        covers: [2, 5],
      },
    },
  ],
} as const;

export const answer = {
  player: "stage",
  stage: "levels",
  op: "min",
  arrayName: "A",
  title: "질의 다섯 개 — A = [5, 2, 7, 4, 6, 3]",
  sub: "T11–T15 · 층 하나에서 두 칸",
  result: "[2, 2, 4, 2, 3]",
  steps: [
    {
      title: "T11 질의 [0,4]",
      text: "칸이 5 개라 2 층을 고르고, 칸 0 과 칸 1 을 읽습니다. 두 조각은 인덱스 1 · 2 · 3 에서 겹칩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, 2, 3],
      ],
      query: [0, 4],
      level: 2,
      lookup: "logTable[5] = 2",
      pieces: [
        {
          side: "left",
          level: 2,
          index: 0,
          value: 2,
          covers: [0, 3],
        },
        {
          side: "right",
          level: 2,
          index: 1,
          value: 2,
          covers: [1, 4],
        },
      ],
      overlap: [1, 2, 3],
      answers: [2],
      answerSlots: 5,
    },
    {
      title: "T12 질의 [1,2]",
      text: "칸이 2 개라 1 층을 고릅니다. 두 조각이 같은 칸 1 이라 질의의 2 칸이 모두 겹칩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, 2, 3],
      ],
      query: [1, 2],
      level: 1,
      lookup: "logTable[2] = 1",
      pieces: [
        {
          side: "left",
          level: 1,
          index: 1,
          value: 2,
          covers: [1, 2],
        },
        {
          side: "right",
          level: 1,
          index: 1,
          value: 2,
          covers: [1, 2],
        },
      ],
      overlap: [1, 2],
      answers: [2, 2],
      answerSlots: 5,
    },
    {
      title: "T13 질의 [3,3]",
      text: "칸이 1 개라 0 층을 고릅니다. 두 조각이 같은 칸 3 이라 질의의 1 칸이 모두 겹칩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, 2, 3],
      ],
      query: [3, 3],
      level: 0,
      lookup: "logTable[1] = 0",
      pieces: [
        {
          side: "left",
          level: 0,
          index: 3,
          value: 4,
          covers: [3, 3],
        },
        {
          side: "right",
          level: 0,
          index: 3,
          value: 4,
          covers: [3, 3],
        },
      ],
      overlap: [3],
      answers: [2, 2, 4],
      answerSlots: 5,
    },
    {
      title: "T14 질의 [0,5]",
      text: "칸이 6 개라 2 층을 고르고, 칸 0 과 칸 2 를 읽습니다. 두 조각은 인덱스 2 · 3 에서 겹칩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, 2, 3],
      ],
      query: [0, 5],
      level: 2,
      lookup: "logTable[6] = 2",
      pieces: [
        {
          side: "left",
          level: 2,
          index: 0,
          value: 2,
          covers: [0, 3],
        },
        {
          side: "right",
          level: 2,
          index: 2,
          value: 3,
          covers: [2, 5],
        },
      ],
      overlap: [2, 3],
      answers: [2, 2, 4, 2],
      answerSlots: 5,
    },
    {
      title: "T15 질의 [2,5]",
      text: "칸이 4 개라 2 층을 고릅니다. 두 조각이 같은 칸 2 라 질의의 4 칸이 모두 겹칩니다.",
      levels: [
        [5, 2, 7, 4, 6, 3],
        [2, 2, 4, 4, 3],
        [2, 2, 3],
      ],
      query: [2, 5],
      level: 2,
      lookup: "logTable[4] = 2",
      pieces: [
        {
          side: "left",
          level: 2,
          index: 2,
          value: 3,
          covers: [2, 5],
        },
        {
          side: "right",
          level: 2,
          index: 2,
          value: 3,
          covers: [2, 5],
        },
      ],
      overlap: [2, 3, 4, 5],
      answers: [2, 2, 4, 2, 3],
      answerSlots: 5,
    },
  ],
} as const;
