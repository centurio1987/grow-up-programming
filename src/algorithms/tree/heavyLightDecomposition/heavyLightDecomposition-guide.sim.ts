/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 준비 걸음 여섯(이웃 목록 · 부모와 깊이 ·
 * 부분트리 크기 · 무거운 자식 · 사슬과 자리 번호 · 기저 배열과 펜윅 트리) 뒤에, 질의는 더하는 사슬 조각
 * 하나가 걸음 하나이고 갱신은 걸음 하나다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널을, `stage: "graph"` 가 무대 갈래를 고른다. 정점과 간선의 자리
 * (`layout`)는 뿌리 0 에서 매단 트리를 `treeLayout` 으로 놓은 자리이고 패널에 한 번만 적는다. 걸음마다
 * 정점 안의 값(그 정점의 지금 값) · 간선의 종류(무거운 간선은 굵은 실선) · 상태 · 무대 아래 띠만
 * 바꾼다. 띠는 위 다섯이 정점 번호 차례(정점 v · depth · size · head · pos), 그 아래 셋이 자리 번호
 * 차례(자리 p · 그 자리의 정점 · 기저 배열), 맨 아래가 답 목록이다. 질의 걸음에서 경로 밖 정점과 칸은
 * 「이번 걸음 밖」, 이번에 더한 사슬 조각은 「새로 씀」, 건너 올라간 가벼운 간선은 「읽음」이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `heavyLightDecomposition-guide.test.ts` 가 잰다.
 */
export const hldWalk = {
  player: "stage",
  stage: "graph",
  title:
    "new HeavyLightDecomposition(9, [[0,1],[0,2],[1,5],[5,6],[2,3],[2,4],[4,7],[7,8]], 0, [1,2,3,4,5,6,7,8,9]) 에 queryPath(0,7) · queryPath(3,6) · update(4,100) · queryPath(8,6) — 정점 안은 값, 굵은 간선이 무거운 간선",
  sub: "T1–T13 · 준비 걸음 6 개 뒤 연산 4 개를 처리한다",
  result: "[17, 23, 136]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0.75,
        y: 0,
      },
      {
        id: 1,
        x: 0,
        y: 1,
      },
      {
        id: 2,
        x: 1.5,
        y: 1,
      },
      {
        id: 3,
        x: 1,
        y: 2,
      },
      {
        id: 4,
        x: 2,
        y: 2,
      },
      {
        id: 5,
        x: 0,
        y: 2,
      },
      {
        id: 6,
        x: 0,
        y: 3,
      },
      {
        id: 7,
        x: 2,
        y: 3,
      },
      {
        id: 8,
        x: 2,
        y: 4,
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 0,
        to: 2,
      },
      {
        from: 1,
        to: 5,
      },
      {
        from: 5,
        to: 6,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 2,
        to: 4,
      },
      {
        from: 4,
        to: 7,
      },
      {
        from: 7,
        to: 8,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      text: "간선 8 개를 양쪽 정점의 목록에 한 번씩 넣었습니다. 아직 어느 쪽이 부모인지 모르므로 간선을 흐리게 그리고, 아래 띠의 배열은 모두 점선입니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "size",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "head",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "pos",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "기저 배열",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "near 목록 길이의 합 =",
        result: "16 = 2E",
      },
      vars: "준비 걸음 1 / 6",
    },
    {
      title: "T2 뿌리에서 따라가 부모와 깊이를 정한다 ①",
      text: "뿌리 0 에서 스택으로 따라가며 0 → 2 → 4 → 7 → 8 → 3 → 1 → 5 → 6 차례로 꺼냈습니다. 새로 만난 이웃마다 부모와 깊이를 적었고, 이미 본 이웃 8 개는 건너뛰었습니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "size",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "head",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "pos",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "기저 배열",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "이미 본 이웃을 건너뛴 횟수 =",
        result: "8",
      },
      vars: "준비 걸음 2 / 6",
    },
    {
      title: "T3 꺼낸 차례의 뒤에서부터 부분트리 크기를 더한다",
      text: "꺼낸 차례를 뒤에서부터 거슬러 오며 정점마다 자기 크기를 부모에 더했습니다. 자식이 언제나 부모보다 뒤에 꺼내졌으므로, 부모 차례가 오면 그 아래가 이미 다 합쳐져 있습니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "head",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "pos",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "기저 배열",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "size[0] = 1 + size[1] + size[2] =",
        result: "1 + 3 + 5 = 9",
      },
      vars: "준비 걸음 3 / 6",
    },
    {
      title: "T4 자식 중 부분트리가 가장 큰 쪽을 무거운 자식으로 고른다 ②",
      text: "자식이 둘 이상인 정점 0 · 2 에서 크기를 비교해 가장 큰 자식을 무거운 자식으로 골랐습니다. 굵게 칠한 간선이 무거운 간선이고, 가는 간선이 가벼운 간선입니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
          },
        },
        {
          label: "head",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "pos",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "기저 배열",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "heavy[0] = 크기가 가장 큰 자식(2: 5 · 1: 3) =",
        result: "2",
      },
      vars: "준비 걸음 4 / 6",
    },
    {
      title: "T5 사슬마다 머리와 이어진 자리 번호를 붙인다 ③",
      text: "사슬 머리를 하나씩 꺼내 무거운 자식을 끝까지 따라가며 자리 번호를 이어 붙였습니다. 사슬 3 개가 머리 0 · 3 · 1 차례로 이어진 자리를 받았습니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "기저 배열",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "사슬 3 개의 자리 =",
        result: "0~4 · 5 · 6~8",
      },
      vars: "준비 걸음 5 / 6",
    },
    {
      title: "T6 기저 배열을 만들고 펜윅 트리를 세운다",
      text: "정점 값을 자리 번호 차례로 옮겨 기저 배열을 만들고, 그 위에 펜윅 트리를 세웠습니다. 준비는 여기서 끝나고, 연산은 이 배열들을 읽기만 합니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {},
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {},
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "5", "8", "9", "4", "2", "6", "7"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "기저 배열 =",
        result: "[1, 3, 5, 8, 9, 4, 2, 6, 7]",
      },
      vars: "준비 걸음 6 / 6",
    },
    {
      title: "T7 queryPath(0, 7) — 머리가 같아 남은 자리 0~3 을 더한다 ⑤",
      text: "queryPath(0, 7) — 두 정점이 같은 사슬 머리 0 을 가지니 남은 경로는 자리 번호에서 이어져 있습니다. 조각 자리 0~3 을 더해 답 17 을 냅니다.",
      nodes: [
        {
          value: "값 1",
          state: "focus",
        },
        {
          value: "값 2",
          state: "out",
        },
        {
          value: "값 3",
          state: "focus",
        },
        {
          value: "값 4",
          state: "out",
        },
        {
          value: "값 5",
          state: "focus",
        },
        {
          value: "값 6",
          state: "out",
        },
        {
          value: "값 7",
          state: "out",
        },
        {
          value: "값 8",
          state: "focus",
        },
        {
          value: "값 9",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "out",
        },
        {
          kind: "tree",
          state: "out",
        },
        {
          state: "out",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "out",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {
            "0": "read",
            "7": "read",
          },
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {},
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "5", "8", "9", "4", "2", "6", "7"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
            "8": "out",
          },
        },
        {
          label: "답 목록",
          values: [17],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head[0] = head[7] = 0",
        result: "자리 0~3 합 17 → 답 17",
      },
      vars: "연산 1 / 4",
    },
    {
      title: "T8 queryPath(3, 6) — 머리가 더 깊은 쪽의 자리 5 를 더한다 ④",
      text: "queryPath(3, 6) — 두 정점의 사슬 머리 3 · 1 이 달라서, 머리가 더 깊은 3 쪽의 조각 자리 5(정점 3) 를 더했습니다. 그다음 머리 3 의 부모 2 로 가벼운 간선 하나를 건너 올라갑니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
          state: "focus",
        },
        {
          value: "값 5",
          state: "out",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
          state: "out",
        },
        {
          value: "값 9",
          state: "out",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          state: "read",
        },
        {
          kind: "tree",
          state: "out",
        },
        {
          kind: "tree",
          state: "out",
        },
        {
          kind: "tree",
          state: "out",
        },
      ],
      groups: [
        {
          members: [2],
          label: "u",
        },
        {
          members: [6],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {
            "3": "read",
            "6": "read",
          },
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {},
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "5", "8", "9", "4", "2", "6", "7"],
          states: {
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "focus",
          },
        },
        {
          label: "답 목록",
          values: [17],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "depth[head[3]] = 2 · depth[head[6]] = 1",
        result: "자리 5 합 4 → total 4",
      },
      vars: "연산 2 / 4",
    },
    {
      title: "T9 queryPath(3, 6) — 머리가 더 깊은 쪽의 자리 6~8 을 더한다 ④",
      text: "queryPath(3, 6) — 두 정점의 사슬 머리 0 · 1 이 달라서, 머리가 더 깊은 6 쪽의 조각 자리 6~8(정점 1 5 6) 을 더했습니다. 그다음 머리 1 의 부모 0 으로 가벼운 간선 하나를 건너 올라갑니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
          state: "focus",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
          state: "out",
        },
        {
          value: "값 6",
          state: "focus",
        },
        {
          value: "값 7",
          state: "focus",
        },
        {
          value: "값 8",
          state: "out",
        },
        {
          value: "값 9",
          state: "out",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {
          kind: "tree",
          state: "out",
        },
        {
          kind: "tree",
          state: "out",
        },
        {
          kind: "tree",
          state: "out",
        },
      ],
      groups: [
        {
          members: [0],
          label: "u",
        },
        {
          members: [2],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {
            "2": "read",
            "6": "read",
          },
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {},
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "5", "8", "9", "4", "2", "6", "7"],
          states: {
            "2": "out",
            "3": "out",
            "4": "out",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "답 목록",
          values: [17],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "depth[head[2]] = 0 · depth[head[6]] = 1",
        result: "자리 6~8 합 15 → total 19",
      },
      vars: "연산 2 / 4",
    },
    {
      title: "T10 queryPath(3, 6) — 머리가 같아 남은 자리 0~1 을 더한다 ⑤",
      text: "queryPath(3, 6) — 두 정점이 같은 사슬 머리 0 을 가지니 남은 경로는 자리 번호에서 이어져 있습니다. 조각 자리 0~1 을 더해 답 23 을 냅니다.",
      nodes: [
        {
          value: "값 1",
          state: "focus",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
          state: "focus",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
          state: "out",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
          state: "out",
        },
        {
          value: "값 9",
          state: "out",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {
          kind: "tree",
          state: "out",
        },
        {
          kind: "tree",
          state: "out",
        },
        {
          kind: "tree",
          state: "out",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {
            "0": "read",
            "2": "read",
          },
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {},
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "5", "8", "9", "4", "2", "6", "7"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "out",
            "3": "out",
            "4": "out",
          },
        },
        {
          label: "답 목록",
          values: [17, 23],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head[0] = head[2] = 0",
        result: "자리 0~1 합 4 → 답 23",
      },
      vars: "연산 2 / 4",
    },
    {
      title: "T11 update(4, 100) — 자리 하나의 값을 바꾼다 ⑥",
      text: "정점 4 의 값을 5 에서 100 으로 바꿨습니다. 기저 배열의 자리 2 하나가 바뀌고, 펜윅 트리는 그 자리를 담는 칸 3 개에 95 를 더합니다. 사슬과 자리 번호는 그대로입니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
        },
        {
          value: "값 100",
          state: "focus",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {},
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {
            "4": "read",
          },
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "100", "8", "9", "4", "2", "6", "7"],
          states: {
            "2": "focus",
          },
        },
        {
          label: "답 목록",
          values: [17, 23],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "delta = 100 − 5 =",
        result: "95 → bit[3] · bit[4] · bit[8]",
      },
      vars: "연산 3 / 4",
    },
    {
      title: "T12 queryPath(8, 6) — 머리가 더 깊은 쪽의 자리 6~8 을 더한다 ④",
      text: "queryPath(8, 6) — 두 정점의 사슬 머리 0 · 1 이 달라서, 머리가 더 깊은 6 쪽의 조각 자리 6~8(정점 1 5 6) 을 더했습니다. 그다음 머리 1 의 부모 0 으로 가벼운 간선 하나를 건너 올라갑니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
          state: "focus",
        },
        {
          value: "값 3",
        },
        {
          value: "값 4",
          state: "out",
        },
        {
          value: "값 100",
        },
        {
          value: "값 6",
          state: "focus",
        },
        {
          value: "값 7",
          state: "focus",
        },
        {
          value: "값 8",
        },
        {
          value: "값 9",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          state: "out",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [0],
          label: "u",
        },
        {
          members: [8],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {
            "6": "read",
            "8": "read",
          },
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {},
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "100", "8", "9", "4", "2", "6", "7"],
          states: {
            "5": "out",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "답 목록",
          values: [17, 23],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "depth[head[8]] = 0 · depth[head[6]] = 1",
        result: "자리 6~8 합 15 → total 15",
      },
      vars: "연산 4 / 4",
    },
    {
      title: "T13 queryPath(8, 6) — 머리가 같아 남은 자리 0~4 를 더한다 ⑤",
      text: "queryPath(8, 6) — 두 정점이 같은 사슬 머리 0 을 가지니 남은 경로는 자리 번호에서 이어져 있습니다. 조각 자리 0~4 를 더해 답 136 을 냅니다.",
      nodes: [
        {
          value: "값 1",
          state: "focus",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
          state: "focus",
        },
        {
          value: "값 4",
          state: "out",
        },
        {
          value: "값 100",
          state: "focus",
        },
        {
          value: "값 6",
        },
        {
          value: "값 7",
        },
        {
          value: "값 8",
          state: "focus",
        },
        {
          value: "값 9",
          state: "focus",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          state: "out",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "depth",
          values: ["0", "1", "1", "2", "2", "2", "3", "3", "4"],
          states: {},
        },
        {
          label: "size",
          values: ["9", "3", "5", "1", "3", "2", "1", "2", "1"],
          states: {},
        },
        {
          label: "head",
          values: ["0", "1", "0", "3", "0", "1", "1", "0", "0"],
          states: {
            "0": "read",
            "8": "read",
          },
        },
        {
          label: "pos",
          values: ["0", "6", "1", "5", "2", "7", "8", "3", "4"],
          states: {},
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "2", "4", "7", "8", "3", "1", "5", "6"],
          states: {},
        },
        {
          label: "기저 배열",
          values: ["1", "3", "100", "8", "9", "4", "2", "6", "7"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "out",
          },
        },
        {
          label: "답 목록",
          values: [17, 23, 136],
          states: {
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head[0] = head[8] = 0",
        result: "자리 0~4 합 121 → 답 136",
      },
      vars: "연산 4 / 4",
    },
  ],
};
