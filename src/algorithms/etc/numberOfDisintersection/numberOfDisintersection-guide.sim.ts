/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [1, 5, 2, 1, 4, 0]`. `sweep` 은
 * 두 배열을 정렬하는 T1 · T2 와, 오른쪽 끝마다 한 번씩 멈추는 T3~T8 이다. 정렬 걸음에서는 아직 정렬하지
 * 않은 `ends` 칸을 점선으로 둔다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 위 줄이 정렬한 왼쪽 끝 `starts` 이고, 괄호 「연 원판」은 지금까지
 * 연 앞부분 `[0, opened − 1]`, ▲ 는 이번 걸음에 새로 연 칸이다. 아래 줄(`layers`)이 정렬한 오른쪽 끝
 * `ends` 이고, ▲ 가 이번에 멈춘 `ends[i]` 다. 두 줄 모두 처음부터 값이 다 있으니 곁말은 「채움」 대신
 * 멈춤 번호다. `opened` 는 ▲ 줄 곁말, 더하는 한 줄은 알약이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `numberOfDisintersection-guide.test.ts` 가 잰다.
 */

export const sweep = {
  player: "stage",
  stage: "array",
  arrayName: "starts",
  rangeLabel: "연 원판",
  title: "countIntersectingDiscs([1, 5, 2, 1, 4, 0])",
  result: "11",
  steps: [
    {
      title: "T1 starts 정렬",
      text: "원판마다 왼쪽 끝 j − A[j] 를 모은 [-1, -4, 0, 2, 0, 5] 를 오름차순으로 정렬합니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: null,
      read: [],
      write: [0, 1, 2, 3, 4, 5],
      pointers: {},
      calc: {
        expr: "sort([-1, -4, 0, 2, 0, 5])",
        result: "[-4, -1, 0, 0, 2, 5]",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [null, null, null, null, null, null],
          read: [],
          write: [],
          side: "아직 정렬 전",
        },
      ],
    },
    {
      title: "T2 ends 정렬",
      text: "원판마다 오른쪽 끝 j + A[j] 를 모은 [1, 6, 4, 4, 8, 5] 를 오름차순으로 정렬합니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: null,
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "sort([1, 6, 4, 4, 8, 5])",
        result: "[1, 4, 4, 5, 6, 8]",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [1, 4, 4, 5, 6, 8],
          read: [],
          write: [0, 1, 2, 3, 4, 5],
          side: "정렬했다",
        },
      ],
    },
    {
      title: "T3 i = 0 · end = 1",
      text: "ends[0] = 1 에 멈춥니다. 1 이하에서 시작한 원판을 4 개 더 열어 opened = 4 입니다. 먼저 닫힌 0 개와 자신을 빼 3 을 더하니 count 가 3 이 됩니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: [0, 3],
      read: [0, 1, 2, 3],
      write: [],
      pointers: {
        opened: 4,
      },
      calc: {
        expr: "count += 4 − (0 + 1)",
        result: "3",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [1, 4, 4, 5, 6, 8],
          read: [0],
          write: [],
          side: "멈춤 i = 0 · 먼저 닫힌 0 개",
        },
      ],
    },
    {
      title: "T4 i = 1 · end = 4",
      text: "ends[1] = 4 에 멈춥니다. 4 이하에서 시작한 원판을 1 개 더 열어 opened = 5 입니다. 먼저 닫힌 1 개와 자신을 빼 3 을 더하니 count 가 6 이 됩니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: [0, 4],
      read: [4],
      write: [],
      pointers: {
        opened: 5,
      },
      calc: {
        expr: "count += 5 − (1 + 1)",
        result: "6",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [1, 4, 4, 5, 6, 8],
          read: [1],
          write: [],
          side: "멈춤 i = 1 · 먼저 닫힌 1 개",
        },
      ],
    },
    {
      title: "T5 i = 2 · end = 4",
      text: "ends[2] = 4 에 멈춥니다. 4 이하에서 새로 시작한 원판이 없어 opened 는 5 그대로입니다. 먼저 닫힌 2 개와 자신을 빼 2 를 더하니 count 가 8 이 됩니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: [0, 4],
      read: [],
      write: [],
      pointers: {
        opened: 5,
      },
      calc: {
        expr: "count += 5 − (2 + 1)",
        result: "8",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [1, 4, 4, 5, 6, 8],
          read: [2],
          write: [],
          side: "멈춤 i = 2 · 먼저 닫힌 2 개",
        },
      ],
    },
    {
      title: "T6 i = 3 · end = 5",
      text: "ends[3] = 5 에 멈춥니다. 5 이하에서 시작한 원판을 1 개 더 열어 opened = 6 입니다. 먼저 닫힌 3 개와 자신을 빼 2 를 더하니 count 가 10 이 됩니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: [0, 5],
      read: [5],
      write: [],
      pointers: {
        opened: 6,
      },
      calc: {
        expr: "count += 6 − (3 + 1)",
        result: "10",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [1, 4, 4, 5, 6, 8],
          read: [3],
          write: [],
          side: "멈춤 i = 3 · 먼저 닫힌 3 개",
        },
      ],
    },
    {
      title: "T7 i = 4 · end = 6",
      text: "ends[4] = 6 에 멈춥니다. 6 이하에서 새로 시작한 원판이 없어 opened 는 6 그대로입니다. 먼저 닫힌 4 개와 자신을 빼 1 을 더하니 count 가 11 이 됩니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: [0, 5],
      read: [],
      write: [],
      pointers: {
        opened: 6,
      },
      calc: {
        expr: "count += 6 − (4 + 1)",
        result: "11",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [1, 4, 4, 5, 6, 8],
          read: [4],
          write: [],
          side: "멈춤 i = 4 · 먼저 닫힌 4 개",
        },
      ],
    },
    {
      title: "T8 i = 5 · end = 8",
      text: "ends[5] = 8 에 멈춥니다. 8 이하에서 새로 시작한 원판이 없어 opened 는 6 그대로입니다. 먼저 닫힌 5 개와 자신을 빼 0 을 더하니 count 가 11 이 됩니다.",
      array: [-4, -1, 0, 0, 2, 5],
      range: [0, 5],
      read: [],
      write: [],
      pointers: {
        opened: 6,
      },
      calc: {
        expr: "count += 6 − (5 + 1)",
        result: "11",
      },
      vars: null,
      layers: [
        {
          name: "ends",
          values: [1, 4, 4, 5, 6, 8],
          read: [5],
          write: [],
          side: "멈춤 i = 5 · 먼저 닫힌 5 개",
        },
      ],
    },
  ],
};
