/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. `markA` 는 `A = [4, -1, 9, 1, 1, 2]`
 * 를 처리하는 T1~T10 — 테이블 만들기 · 표시 여섯 걸음 · 칸 3 에서 멈추는 찾기 — 이고, `fullB` 는
 * `B = [1, 2, 3]` 을 처리하는 T11~T18 — 칸이 다 차서 `n + 1` 을 답하는 갈래 — 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 입력 배열 위의 괄호는 지금까지 읽은 값 `[0, i]` 이고, ▲ 는 이번에
 * 읽은 값이다. 그 아래 `seen` 줄(`layers`)이 직접 주소 테이블 칸 0 … n 이고, 격자가 인덱스 줄을 함께
 * 쓰므로 칸 `x` 가 인덱스 `x` 의 열에 선다. 참을 쓴 칸은 새로 씀, 찾기가 읽은 칸은 ▲ 와 읽음이다. 모든
 * 칸에 처음부터 값이 있으니 곁말은 「채움」 대신 참인 칸 수다. 조건 한 줄은 알약이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `missingInteger-guide.test.ts` 가 잰다.
 */

export const markA = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "읽은 값",
  title: "missingInteger([4, -1, 9, 1, 1, 2])",
  result: "3",
  steps: [
    {
      title: "T1 만들기",
      text: "칸 0 … 6 을 모두 거짓으로 둡니다. 칸 0 은 쓰지 않습니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "new Array(7).fill(false)",
        result: "칸 7 개",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "거짓", "거짓", "거짓", "거짓", "거짓", "거짓"],
          read: [],
          write: [0, 1, 2, 3, 4, 5, 6],
          side: "칸 1 … 6 중 참 0 칸",
        },
      ],
    },
    {
      title: "T2 표시 x = 4",
      text: "A[0] = 4 를 읽습니다. 칸 4 에 참을 씁니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 0],
      read: [0],
      write: [],
      calc: {
        expr: "4 >= 1 && 4 <= 6",
        result: "참 → seen[4] = true",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "거짓", "거짓", "거짓", "참", "거짓", "거짓"],
          read: [],
          write: [4],
          side: "칸 1 … 6 중 참 1 칸",
        },
      ],
    },
    {
      title: "T3 표시 x = -1",
      text: "A[1] = -1 을 읽습니다. 1 보다 작아 칸이 없으니 건너뜁니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 1],
      read: [1],
      write: [],
      calc: {
        expr: "-1 >= 1",
        result: "거짓 → 건너뜀",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "거짓", "거짓", "거짓", "참", "거짓", "거짓"],
          read: [],
          write: [],
          side: "칸 1 … 6 중 참 1 칸",
        },
      ],
    },
    {
      title: "T4 표시 x = 9",
      text: "A[2] = 9 를 읽습니다. 6 보다 커서 칸이 없으니 건너뜁니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 2],
      read: [2],
      write: [],
      calc: {
        expr: "9 >= 1 && 9 <= 6",
        result: "거짓 → 건너뜀",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "거짓", "거짓", "거짓", "참", "거짓", "거짓"],
          read: [],
          write: [],
          side: "칸 1 … 6 중 참 1 칸",
        },
      ],
    },
    {
      title: "T5 표시 x = 1",
      text: "A[3] = 1 을 읽습니다. 칸 1 에 참을 씁니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 3],
      read: [3],
      write: [],
      calc: {
        expr: "1 >= 1 && 1 <= 6",
        result: "참 → seen[1] = true",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "거짓", "거짓", "참", "거짓", "거짓"],
          read: [],
          write: [1],
          side: "칸 1 … 6 중 참 2 칸",
        },
      ],
    },
    {
      title: "T6 표시 x = 1",
      text: "A[4] = 1 을 읽습니다. 칸 1 에 이미 참이 있어 같은 칸을 다시 참으로 씁니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 4],
      read: [4],
      write: [],
      calc: {
        expr: "1 >= 1 && 1 <= 6",
        result: "참 → seen[1] = true",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "거짓", "거짓", "참", "거짓", "거짓"],
          read: [],
          write: [1],
          side: "칸 1 … 6 중 참 2 칸",
        },
      ],
    },
    {
      title: "T7 표시 x = 2",
      text: "A[5] = 2 를 읽습니다. 칸 2 에 참을 씁니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 5],
      read: [5],
      write: [],
      calc: {
        expr: "2 >= 1 && 2 <= 6",
        result: "참 → seen[2] = true",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "거짓", "참", "거짓", "거짓"],
          read: [],
          write: [2],
          side: "칸 1 … 6 중 참 3 칸",
        },
      ],
    },
    {
      title: "T8 찾기 칸 1",
      text: "칸 1 이 참이라 다음 칸으로 갑니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 5],
      read: [],
      write: [],
      calc: {
        expr: "!seen[1]",
        result: "거짓 → 다음 칸",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "거짓", "참", "거짓", "거짓"],
          read: [1],
          write: [],
          side: "칸 1 … 6 중 참 3 칸",
        },
      ],
    },
    {
      title: "T9 찾기 칸 2",
      text: "칸 2 가 참이라 다음 칸으로 갑니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 5],
      read: [],
      write: [],
      calc: {
        expr: "!seen[2]",
        result: "거짓 → 다음 칸",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "거짓", "참", "거짓", "거짓"],
          read: [2],
          write: [],
          side: "칸 1 … 6 중 참 3 칸",
        },
      ],
    },
    {
      title: "T10 찾기 칸 3",
      text: "칸 3 이 거짓이라 3 을 답으로 돌려줍니다.",
      array: [4, -1, 9, 1, 1, 2],
      range: [0, 5],
      read: [],
      write: [],
      calc: {
        expr: "!seen[3]",
        result: "참 → 답 3",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "거짓", "참", "거짓", "거짓"],
          read: [3],
          write: [],
          side: "칸 1 … 6 중 참 3 칸",
        },
      ],
    },
  ],
};

export const fullB = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "읽은 값",
  title: "missingInteger([1, 2, 3])",
  result: "4",
  steps: [
    {
      title: "T11 만들기",
      text: "칸 0 … 3 을 모두 거짓으로 둡니다. 칸 0 은 쓰지 않습니다.",
      array: [1, 2, 3],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "new Array(4).fill(false)",
        result: "칸 4 개",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "거짓", "거짓", "거짓"],
          read: [],
          write: [0, 1, 2, 3],
          side: "칸 1 … 3 중 참 0 칸",
        },
      ],
    },
    {
      title: "T12 표시 x = 1",
      text: "A[0] = 1 을 읽습니다. 칸 1 에 참을 씁니다.",
      array: [1, 2, 3],
      range: [0, 0],
      read: [0],
      write: [],
      calc: {
        expr: "1 >= 1 && 1 <= 3",
        result: "참 → seen[1] = true",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "거짓", "거짓"],
          read: [],
          write: [1],
          side: "칸 1 … 3 중 참 1 칸",
        },
      ],
    },
    {
      title: "T13 표시 x = 2",
      text: "A[1] = 2 를 읽습니다. 칸 2 에 참을 씁니다.",
      array: [1, 2, 3],
      range: [0, 1],
      read: [1],
      write: [],
      calc: {
        expr: "2 >= 1 && 2 <= 3",
        result: "참 → seen[2] = true",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "거짓"],
          read: [],
          write: [2],
          side: "칸 1 … 3 중 참 2 칸",
        },
      ],
    },
    {
      title: "T14 표시 x = 3",
      text: "A[2] = 3 을 읽습니다. 칸 3 에 참을 씁니다.",
      array: [1, 2, 3],
      range: [0, 2],
      read: [2],
      write: [],
      calc: {
        expr: "3 >= 1 && 3 <= 3",
        result: "참 → seen[3] = true",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "참"],
          read: [],
          write: [3],
          side: "칸 1 … 3 중 참 3 칸",
        },
      ],
    },
    {
      title: "T15 찾기 칸 1",
      text: "칸 1 이 참이라 다음 칸으로 갑니다.",
      array: [1, 2, 3],
      range: [0, 2],
      read: [],
      write: [],
      calc: {
        expr: "!seen[1]",
        result: "거짓 → 다음 칸",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "참"],
          read: [1],
          write: [],
          side: "칸 1 … 3 중 참 3 칸",
        },
      ],
    },
    {
      title: "T16 찾기 칸 2",
      text: "칸 2 가 참이라 다음 칸으로 갑니다.",
      array: [1, 2, 3],
      range: [0, 2],
      read: [],
      write: [],
      calc: {
        expr: "!seen[2]",
        result: "거짓 → 다음 칸",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "참"],
          read: [2],
          write: [],
          side: "칸 1 … 3 중 참 3 칸",
        },
      ],
    },
    {
      title: "T17 찾기 칸 3",
      text: "칸 3 이 참이라 다음 칸으로 갑니다.",
      array: [1, 2, 3],
      range: [0, 2],
      read: [],
      write: [],
      calc: {
        expr: "!seen[3]",
        result: "거짓 → 다음 칸",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "참"],
          read: [3],
          write: [],
          side: "칸 1 … 3 중 참 3 칸",
        },
      ],
    },
    {
      title: "T18 끝",
      text: "칸 1 … 3 이 모두 참이라 루프를 빠져나와 4 를 돌려줍니다.",
      array: [1, 2, 3],
      range: [0, 2],
      read: [],
      write: [],
      calc: {
        expr: "4 <= 3",
        result: "거짓 → n + 1 = 4",
      },
      vars: null,
      layers: [
        {
          name: "seen",
          values: ["거짓", "참", "참", "참"],
          read: [],
          write: [],
          side: "칸 1 … 3 중 참 3 칸",
        },
      ],
    },
  ],
};
