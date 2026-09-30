/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `nums = [4, 1, 2, 1, 2]`. `xorWalk` 는
 * 준비 T1 · 바퀴 T2~T6 · 종료 검사 T7 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 맨 윗줄이 `nums` 이고, 괄호 「읽은 칸」은 지금까지 읽은 칸 `[0, i]`,
 * ▲ 는 이번에 읽은 칸이다. 그 아래 `layers` 세 줄이 acc 의 자리 2 · 1 · 0 이다 — 칸 `c` 아래 값은
 * `nums[c]` 를 겹친 **뒤**의 acc 의 그 자리이고, 이번 걸음에 바뀐 자리만 새로 씀이다. 계산 한 줄은 알약이고,
 * 무대에 자리가 없는 값은 없다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `singleNumberXor-guide.test.ts` 가 잰다.
 */

export const xorWalk = {
  player: "stage",
  stage: "array",
  arrayName: "nums",
  rangeLabel: "읽은 칸",
  title: "singleNumberXor([4, 1, 2, 1, 2])",
  result: "4",
  steps: [
    {
      title: "T1 준비",
      text: "acc 를 항등원 0 으로 둡니다. 아직 아무 칸도 읽지 않았고, 0 을 겹친 값은 그 값 그대로라 첫 칸이 변형 없이 들어옵니다.",
      array: [4, 1, 2, 1, 2],
      range: null,
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "acc = 0",
        result: "000₂",
      },
      vars: null,
      layers: [
        {
          name: "acc 자리 2",
          values: [null, null, null, null, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 1",
          values: [null, null, null, null, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 0",
          values: [null, null, null, null, null],
          write: [],
          read: [],
        },
      ],
    },
    {
      title: "T2 i = 0 · 4 를 겹친다",
      text: "4 가 처음 나와 그 값의 1 인 자리를 켭니다. 자리 2 가 켜집니다. acc 는 4 입니다.",
      array: [4, 1, 2, 1, 2],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "000₂ ^ 100₂",
        result: "100₂ = 4",
      },
      vars: null,
      layers: [
        {
          name: "acc 자리 2",
          values: [1, null, null, null, null],
          write: [0],
          read: [],
        },
        {
          name: "acc 자리 1",
          values: [0, null, null, null, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 0",
          values: [0, null, null, null, null],
          write: [],
          read: [],
        },
      ],
    },
    {
      title: "T3 i = 1 · 1 을 겹친다",
      text: "1 이 처음 나와 그 값의 1 인 자리를 켭니다. 자리 0 이 켜집니다. acc 는 5 입니다.",
      array: [4, 1, 2, 1, 2],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "100₂ ^ 001₂",
        result: "101₂ = 5",
      },
      vars: null,
      layers: [
        {
          name: "acc 자리 2",
          values: [1, 1, null, null, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 1",
          values: [0, 0, null, null, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 0",
          values: [0, 1, null, null, null],
          write: [1],
          read: [],
        },
      ],
    },
    {
      title: "T4 i = 2 · 2 를 겹친다",
      text: "2 가 처음 나와 그 값의 1 인 자리를 켭니다. 자리 1 이 켜집니다. acc 는 7 입니다.",
      array: [4, 1, 2, 1, 2],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "101₂ ^ 010₂",
        result: "111₂ = 7",
      },
      vars: null,
      layers: [
        {
          name: "acc 자리 2",
          values: [1, 1, 1, null, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 1",
          values: [0, 0, 1, null, null],
          write: [2],
          read: [],
        },
        {
          name: "acc 자리 0",
          values: [0, 1, 1, null, null],
          write: [],
          read: [],
        },
      ],
    },
    {
      title: "T5 i = 3 · 1 을 겹친다",
      text: "1 이 두 번째로 나와 앞에서 켠 자리를 다시 끕니다. 자리 0 이 꺼집니다. acc 는 6 입니다.",
      array: [4, 1, 2, 1, 2],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "111₂ ^ 001₂",
        result: "110₂ = 6",
      },
      vars: null,
      layers: [
        {
          name: "acc 자리 2",
          values: [1, 1, 1, 1, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 1",
          values: [0, 0, 1, 1, null],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 0",
          values: [0, 1, 1, 0, null],
          write: [3],
          read: [],
        },
      ],
    },
    {
      title: "T6 i = 4 · 2 를 겹친다",
      text: "2 가 두 번째로 나와 앞에서 켠 자리를 다시 끕니다. 자리 1 이 꺼집니다. acc 는 4 입니다.",
      array: [4, 1, 2, 1, 2],
      range: [0, 4],
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "110₂ ^ 010₂",
        result: "100₂ = 4",
      },
      vars: null,
      layers: [
        {
          name: "acc 자리 2",
          values: [1, 1, 1, 1, 1],
          write: [],
          read: [],
        },
        {
          name: "acc 자리 1",
          values: [0, 0, 1, 1, 0],
          write: [4],
          read: [],
        },
        {
          name: "acc 자리 0",
          values: [0, 1, 1, 0, 0],
          write: [],
          read: [],
        },
      ],
    },
    {
      title: "T7 i = 5 · 끝",
      text: "i 가 5 가 되어 i < N 이 거짓입니다. 짝수 번 나온 값의 자리는 모두 꺼졌고, 남은 acc 4 를 돌려줍니다.",
      array: [4, 1, 2, 1, 2],
      range: [0, 4],
      read: [],
      write: [],
      pointers: {
        i: 5,
      },
      calc: {
        expr: "5 < 5",
        result: "거짓 → 4 반환",
      },
      vars: null,
      layers: [
        {
          name: "acc 자리 2",
          values: [1, 1, 1, 1, 1],
          write: [],
          read: [4],
        },
        {
          name: "acc 자리 1",
          values: [0, 0, 1, 1, 0],
          write: [],
          read: [4],
        },
        {
          name: "acc 자리 0",
          values: [0, 1, 1, 0, 0],
          write: [],
          read: [4],
        },
      ],
    },
  ],
};
