/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `nums = [5, 8, 3, 8, 12, 2]`,
 * `target = 10`. `scan` 은 원소 하나씩을 보는 T1~T6 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 입력 배열 `nums` 위의 괄호는 지금까지 본 원소 `[0, j]` 이고, ▲ 는
 * 이번에 보는 원소, 강조 칸은 찾은 짝의 두 인덱스다. 맨 아래에 해시 맵 `seen`(`map`, 패턴
 * `KeyValueTable`)을 키 줄 · 인덱스 줄로 쌓는다 — 자리는 첫 걸음부터 해시 맵이 가장 커졌을 때의 키
 * 수만큼 잡아 두고, 아직 안 적은 자리는 점선이다(SPEC §13 배열 줄). 조회해서 있던 키는 읽음, 적거나
 * 인덱스를 바꾼 키는 새로 씀이고, 조회했는데 없던 보수는 ▲ 줄 곁말에 적는다. 조회 한 줄은 알약이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `twoSum-guide.test.ts` 가 잰다.
 */

export const scan = {
  player: "stage",
  stage: "array",
  arrayName: "nums",
  rangeLabel: "본 원소",
  title: "twoSum([5, 8, 3, 8, 12, 2], 10)",
  result: "[3, 5]",
  steps: [
    {
      title: "T1 j = 0",
      text: "nums[0] = 5 의 보수 5 가 해시 맵에 없습니다. 키 5 를 인덱스 0 으로 새로 적습니다.",
      array: [5, 8, 3, 8, 12, 2],
      range: [0, 0],
      read: [0],
      write: [],
      calc: {
        expr: "seen.get(10 − 5)",
        result: "undefined",
      },
      vars: null,
      map: {
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: [[5, 0]],
        slots: 4,
        read: [],
        write: [5],
        note: "찾는 키 5 · 없음",
      },
    },
    {
      title: "T2 j = 1",
      text: "nums[1] = 8 의 보수 2 가 해시 맵에 없습니다. 키 8 을 인덱스 1 로 새로 적습니다.",
      array: [5, 8, 3, 8, 12, 2],
      range: [0, 1],
      read: [1],
      write: [],
      calc: {
        expr: "seen.get(10 − 8)",
        result: "undefined",
      },
      vars: null,
      map: {
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: [
          [5, 0],
          [8, 1],
        ],
        slots: 4,
        read: [],
        write: [8],
        note: "찾는 키 2 · 없음",
      },
    },
    {
      title: "T3 j = 2",
      text: "nums[2] = 3 의 보수 7 이 해시 맵에 없습니다. 키 3 을 인덱스 2 로 새로 적습니다.",
      array: [5, 8, 3, 8, 12, 2],
      range: [0, 2],
      read: [2],
      write: [],
      calc: {
        expr: "seen.get(10 − 3)",
        result: "undefined",
      },
      vars: null,
      map: {
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: [
          [5, 0],
          [8, 1],
          [3, 2],
        ],
        slots: 4,
        read: [],
        write: [3],
        note: "찾는 키 7 · 없음",
      },
    },
    {
      title: "T4 j = 3",
      text: "nums[3] = 8 의 보수 2 가 해시 맵에 없습니다. 키 8 의 인덱스를 1 에서 3 으로 바꿉니다.",
      array: [5, 8, 3, 8, 12, 2],
      range: [0, 3],
      read: [3],
      write: [],
      calc: {
        expr: "seen.get(10 − 8)",
        result: "undefined",
      },
      vars: null,
      map: {
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: [
          [5, 0],
          [8, 3],
          [3, 2],
        ],
        slots: 4,
        read: [],
        write: [8],
        note: "찾는 키 2 · 없음",
      },
    },
    {
      title: "T5 j = 4",
      text: "nums[4] = 12 의 보수 -2 가 해시 맵에 없습니다. 키 12 를 인덱스 4 로 새로 적습니다.",
      array: [5, 8, 3, 8, 12, 2],
      range: [0, 4],
      read: [4],
      write: [],
      calc: {
        expr: "seen.get(10 − 12)",
        result: "undefined",
      },
      vars: null,
      map: {
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: [
          [5, 0],
          [8, 3],
          [3, 2],
          [12, 4],
        ],
        slots: 4,
        read: [],
        write: [12],
        note: "찾는 키 -2 · 없음",
      },
    },
    {
      title: "T6 j = 5",
      text: "nums[5] = 2 의 보수 8 이 해시 맵에 있어 인덱스 3 이 나옵니다. [3, 5] 를 돌려줍니다.",
      array: [5, 8, 3, 8, 12, 2],
      range: [0, 5],
      read: [5],
      write: [3, 5],
      calc: {
        expr: "seen.get(10 − 2)",
        result: "3",
      },
      vars: null,
      map: {
        keyLabel: "seen 키",
        valueLabel: "인덱스",
        entries: [
          [5, 0],
          [8, 3],
          [3, 2],
          [12, 4],
        ],
        slots: 4,
        read: [8],
        write: [],
        note: "찾는 키 8 · 인덱스 3",
      },
    },
  ],
};
