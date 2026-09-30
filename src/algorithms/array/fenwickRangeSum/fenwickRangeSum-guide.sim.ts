import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [1, 2, 3, 4, 5]` 에 연산 넷
 * `질의 [0,4] · 갱신 i=2 v=10 · 질의 [0,4] · 질의 [2,3]`. `walk` 는 채우기 T1~T4, 첫 질의 T5~T6, 갱신
 * T7~T9, 둘째 질의 T10~T11, 셋째 질의 T12~T13 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 무대 맨 위는 논리 배열 `arr` 이고(갱신이 값을 바꾼다), 그 아래
 * `layers` 에 칸 번호 줄 · 펜윅 트리 `tree` · 답 목록을 쌓는다. 펜윅 트리의 칸 `k` 는 인덱스 `k − 1` 아래에
 * 둔다 — 칸이 맡는 구간의 오른쪽 끝과 같은 열이다. 칸 0 은 쓰지 않는 칸이라 줄에서 빼고 곁말에 적는다.
 * 이번 걸음이 읽거나 넘겨받은 칸의 맡는 구간은 `pieces` 로 괄호를 단다(SPEC §13 배열 줄).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의 `simStepsFromRef()`(정본 실행에서
 * 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는 `fenwickRangeSum-guide.test.ts` 가 잰다.
 */

export const walk = {
  player: "stage",
  stage: "array",
  arrayName: "arr",
  rangeLabel: "구간",
  title:
    "fenwickRangeSum([1, 2, 3, 4, 5], 질의 [0,4] · 갱신 i=2 v=10 · 질의 [0,4] · 질의 [2,3])",
  result: "[15, 22, 14]",
  steps: [
    {
      title: "T1 자기 몫 채우기 · ③",
      text: "첫 바퀴가 칸 1 부터 칸 5 까지 tree[k] 에 arr[k−1] 하나씩만 넣습니다. 칸 0 은 비워 둡니다. 아직 길이가 2 이상인 칸은 맡는 구간 전체의 합이 아닙니다.",
      array: [1, 2, 3, 4, 5],
      range: null,
      read: [0, 1, 2, 3, 4],
      write: [],
      calc: {
        expr: "tree[k] = arr[k − 1] (k = 1…5)",
        result: "[1 2 3 4 5]",
      },
      vars: null,
      pieces: [],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 2, 3, 4, 5],
          read: [],
          write: [0, 1, 2, 3, 4],
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T2 칸 1 → 칸 2 · ④",
      text: "칸 1 의 위 칸은 1 + 1 = 2 입니다. 칸 1 의 값 1 을 칸 2 에 더하면 칸 2 가 3 이 되어, 맡는 구간 [0,1] 에 칸 1 의 몫이 들어옵니다.",
      array: [1, 2, 3, 4, 5],
      range: [0, 1],
      read: [],
      write: [],
      calc: {
        expr: "tree[2] + tree[1] = 2 + 1",
        result: "3",
      },
      vars: null,
      pieces: [
        {
          label: "칸 1",
          from: 0,
          to: 0,
          tone: "left",
          text: "[0,0]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 3, 4, 5],
          read: [0],
          write: [1],
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T3 칸 2 → 칸 4 · ④",
      text: "칸 2 의 위 칸은 2 + 2 = 4 입니다. 칸 2 의 값 3 을 칸 4 에 더하면 칸 4 가 7 이 되어, 맡는 구간 [0,3] 에 칸 2 의 몫이 들어옵니다.",
      array: [1, 2, 3, 4, 5],
      range: [0, 3],
      read: [],
      write: [],
      calc: {
        expr: "tree[4] + tree[2] = 4 + 3",
        result: "7",
      },
      vars: null,
      pieces: [
        {
          label: "칸 2",
          from: 0,
          to: 1,
          tone: "left",
          text: "[0,1]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 3, 7, 5],
          read: [1],
          write: [3],
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T4 칸 3 → 칸 4 · ④",
      text: "칸 3 의 위 칸은 3 + 1 = 4 입니다. 칸 3 의 값 3 을 칸 4 에 더하면 칸 4 가 10 이 되어, 맡는 구간 [0,3] 에 칸 3 의 몫이 들어옵니다.",
      array: [1, 2, 3, 4, 5],
      range: [0, 3],
      read: [],
      write: [],
      calc: {
        expr: "tree[4] + tree[3] = 7 + 3",
        result: "10",
      },
      vars: null,
      pieces: [
        {
          label: "칸 3",
          from: 2,
          to: 2,
          tone: "left",
          text: "[2,2]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 3, 10, 5],
          read: [2],
          write: [3],
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T5 prefix(5) · ②",
      text: "질의 [0,4] 의 오른쪽 호출입니다. 칸 5 · 칸 4 를 읽습니다. 맡는 구간은 [4,4] · [0,3] 이고, 이어 붙이면 앞 5 개 [0,4] 입니다. 합은 15 입니다.",
      array: [1, 2, 3, 4, 5],
      range: [0, 4],
      read: [],
      write: [],
      calc: {
        expr: "tree[5] + tree[4] = 5 + 10",
        result: "15",
      },
      vars: "prefix(5) = 15",
      pieces: [
        {
          label: "칸 5",
          from: 4,
          to: 4,
          tone: "left",
          text: "[4,4]",
        },
        {
          label: "칸 4",
          from: 0,
          to: 3,
          tone: "right",
          text: "[0,3]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 3, 10, 5],
          read: [4, 3],
          write: [],
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T6 prefix(0) · ⑥",
      text: "왼쪽 호출 prefix(0) 에서는 루프가 한 번도 실행되지 않아 0 입니다. 답 15 − 0 = 15 를 답 목록 칸 0 에 씁니다.",
      array: [1, 2, 3, 4, 5],
      range: [0, 4],
      read: [],
      write: [],
      calc: {
        expr: "prefix(5) − prefix(0) = 15 − 0",
        result: "15",
      },
      vars: null,
      pieces: [],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 3, 10, 5],
          read: [],
          write: [],
        },
        {
          name: "답",
          values: [15, null, null],
          write: [0],
        },
      ],
    },
    {
      title: "T7 변화량 만들기 · ⑤",
      text: "갱신 i=2 v=10 입니다. 옛 값 arr[2] = 3 에서 새 값까지의 차이 10 − 3 = 7 을 만들고 arr[2] 를 10 으로 고칩니다. 트리는 아직 그대로입니다.",
      array: [1, 2, 10, 4, 5],
      range: [2, 2],
      read: [2],
      write: [2],
      calc: {
        expr: "10 − 3",
        result: "7",
      },
      vars: "delta = 7",
      pieces: [],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 3, 10, 5],
          read: [],
          write: [],
        },
        {
          name: "답",
          values: [15, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T8 칸 3 고치기 · ①",
      text: "칸 3 이 맡는 구간 [2,2] 안에 인덱스 2 가 있으므로 변화량 7 을 더합니다. 다음 칸은 3 + 1 = 4 이고, 5 이하라 이어 갑니다.",
      array: [1, 2, 10, 4, 5],
      range: [2, 2],
      read: [],
      write: [],
      calc: {
        expr: "tree[3] + delta = 3 + 7",
        result: "10",
      },
      vars: "delta = 7",
      pieces: [
        {
          label: "칸 3",
          from: 2,
          to: 2,
          tone: "left",
          text: "[2,2]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 10, 10, 5],
          read: [],
          write: [2],
        },
        {
          name: "답",
          values: [15, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T9 칸 4 고치기 · ①",
      text: "칸 4 가 맡는 구간 [0,3] 안에 인덱스 2 가 있으므로 변화량 7 을 더합니다. 다음 칸은 4 + 4 = 8 이고, 5 를 넘어 멈춥니다.",
      array: [1, 2, 10, 4, 5],
      range: [2, 2],
      read: [],
      write: [],
      calc: {
        expr: "tree[4] + delta = 10 + 7",
        result: "17",
      },
      vars: "delta = 7",
      pieces: [
        {
          label: "칸 4",
          from: 0,
          to: 3,
          tone: "left",
          text: "[0,3]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 10, 17, 5],
          read: [],
          write: [3],
        },
        {
          name: "답",
          values: [15, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T10 prefix(5) · ②",
      text: "질의 [0,4] 의 오른쪽 호출입니다. 칸 5 · 칸 4 를 읽습니다. 맡는 구간은 [4,4] · [0,3] 이고, 이어 붙이면 앞 5 개 [0,4] 입니다. 합은 22 입니다.",
      array: [1, 2, 10, 4, 5],
      range: [0, 4],
      read: [],
      write: [],
      calc: {
        expr: "tree[5] + tree[4] = 5 + 17",
        result: "22",
      },
      vars: "prefix(5) = 22",
      pieces: [
        {
          label: "칸 5",
          from: 4,
          to: 4,
          tone: "left",
          text: "[4,4]",
        },
        {
          label: "칸 4",
          from: 0,
          to: 3,
          tone: "right",
          text: "[0,3]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 10, 17, 5],
          read: [4, 3],
          write: [],
        },
        {
          name: "답",
          values: [15, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T11 prefix(0) · ⑥",
      text: "왼쪽 호출 prefix(0) 에서는 루프가 한 번도 실행되지 않아 0 입니다. 답 22 − 0 = 22 를 답 목록 칸 1 에 씁니다.",
      array: [1, 2, 10, 4, 5],
      range: [0, 4],
      read: [],
      write: [],
      calc: {
        expr: "prefix(5) − prefix(0) = 22 − 0",
        result: "22",
      },
      vars: null,
      pieces: [],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 10, 17, 5],
          read: [],
          write: [],
        },
        {
          name: "답",
          values: [15, 22, null],
          write: [1],
        },
      ],
    },
    {
      title: "T12 prefix(4) · ②",
      text: "질의 [2,3] 의 오른쪽 호출입니다. 칸 4 를 읽습니다. 맡는 구간은 [0,3] 이고, 이어 붙이면 앞 4 개 [0,3] 입니다. 합은 17 입니다.",
      array: [1, 2, 10, 4, 5],
      range: [2, 3],
      read: [],
      write: [],
      calc: {
        expr: "tree[4]",
        result: "17",
      },
      vars: "prefix(4) = 17",
      pieces: [
        {
          label: "칸 4",
          from: 0,
          to: 3,
          tone: "left",
          text: "[0,3]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 10, 17, 5],
          read: [3],
          write: [],
        },
        {
          name: "답",
          values: [15, 22, null],
          write: [],
        },
      ],
    },
    {
      title: "T13 prefix(2) · ⑥",
      text: "왼쪽 호출입니다. 칸 2 를 읽습니다. 맡는 구간은 [0,1] 이고, 앞 2 개의 합은 3 입니다. 답 17 − 3 = 14 를 답 목록 칸 2 에 씁니다.",
      array: [1, 2, 10, 4, 5],
      range: [2, 3],
      read: [],
      write: [],
      calc: {
        expr: "prefix(4) − prefix(2) = 17 − 3",
        result: "14",
      },
      vars: null,
      pieces: [
        {
          label: "칸 2",
          from: 0,
          to: 1,
          tone: "left",
          text: "[0,1]",
        },
      ],
      layers: [
        {
          name: "칸 k",
          values: [1, 2, 3, 4, 5],
          caret: false,
          side: "칸 0 은 비워 둔다",
        },
        {
          name: "tree",
          values: [1, 3, 10, 17, 5],
          read: [1],
          write: [],
        },
        {
          name: "답",
          values: [15, 22, 14],
          write: [2],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
