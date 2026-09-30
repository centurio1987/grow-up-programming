/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 준비 걸음 하나(이웃 목록과 칸) 뒤에, 뿌리에서 한
 * 번 도는 동안 정점에 들어가는 사건과 나오는 사건이 하나씩 걸음이 되고(열두 걸음), 펜윅 트리를 세우는
 * 걸음 하나, 작업 넷이 하나씩 걸음이다. 이미 자리를 받은 이웃을 건너뛴 일은 그다음 사건 걸음에 딸려 적는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널을, `stage: "graph"` 가 무대 갈래를 고른다. 정점과 간선의 자리
 * (`layout`)는 뿌리 0 에서 매단 트리를 `treeLayout` 으로 놓은 자리이고 패널에 한 번만 적는다. 걸음마다
 * 정점 안의 값(그 정점의 지금 값) · 상태 · 무대 아래 띠만 바꾼다. 띠는 위 넷이 정점 번호 차례(정점 v ·
 * tin · tout · 스택), 그 아래 셋이 자리 번호 차례(자리 p · 그 자리의 정점 · 펜윅 트리 칸 p + 1), 맨 아래가
 * 답 목록이다. 아직 들어가지 않은 정점과 아직 정하지 않은 칸은 「아직」(점선), 이번에 들어가거나 나온
 * 정점과 새로 적은 칸은 「새로 씀」, 건너뛴 이웃으로 가는 간선과 읽은 칸은 「읽음」이다. 질의 걸음에서
 * 부분트리 밖 정점과 구간 밖 자리는 「이번 걸음 밖」이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `subtreeSumQuery-guide.test.ts` 가 잰다.
 */
export const subtreeWalk = {
  player: "stage",
  stage: "graph",
  title:
    "new SubtreeSumQuery(6, [[0,1],[0,2],[1,3],[1,4],[2,5]], 0, [1,2,3,4,5,6]) 에 querySubtree(1) · update(4,10) · querySubtree(1) · querySubtree(0) — 정점 안은 값",
  sub: "T1–T18 · 준비 한 걸음 · 들어감과 나옴 열두 걸음 · 펜윅 트리 한 걸음 뒤 작업 넷",
  result: "[11, 16, 26]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.25,
        y: 0,
      },
      {
        id: 1,
        x: 0.5,
        y: 1,
      },
      {
        id: 2,
        x: 2,
        y: 1,
      },
      {
        id: 3,
        x: 0,
        y: 2,
      },
      {
        id: 4,
        x: 1,
        y: 2,
      },
      {
        id: 5,
        x: 2,
        y: 2,
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
        to: 3,
      },
      {
        from: 1,
        to: 4,
      },
      {
        from: 2,
        to: 5,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 이웃 목록을 만들고 정점마다의 칸을 준비한다 ① ②",
      text: "간선 5 개를 양쪽 정점의 이웃 목록에 한 번씩 넣고, tin · tout 을 비워 둔 채 값을 복사했습니다. 아직 어느 정점에도 들어가지 않아 정점을 점선으로, 간선을 흐리게 그립니다.",
      nodes: [
        {
          value: "값 1",
          state: "empty",
        },
        {
          value: "값 2",
          state: "empty",
        },
        {
          value: "값 3",
          state: "empty",
        },
        {
          value: "값 4",
          state: "empty",
        },
        {
          value: "값 5",
          state: "empty",
        },
        {
          value: "값 6",
          state: "empty",
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
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        result: "10 = 간선 5 개 × 2",
      },
      vars: "timer = 0",
    },
    {
      title: "T2 뿌리 0 에 들어가 자리 0 을 준다 ③",
      text: "뿌리 0 에 들어가 첫 자리 0 을 주고 스택에 담았습니다. timer 는 다음에 줄 자리 1 을 가리킵니다.",
      nodes: [
        {
          value: "값 1",
          state: "focus",
        },
        {
          value: "값 2",
          state: "empty",
        },
        {
          value: "값 3",
          state: "empty",
        },
        {
          value: "값 4",
          state: "empty",
        },
        {
          value: "값 5",
          state: "empty",
        },
        {
          value: "값 6",
          state: "empty",
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
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "", "", "", "", ""],
          states: {
            "0": "focus",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "", "", "", "", ""],
          states: {
            "0": "focus",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tin[0] = timer =",
        result: "0 → timer 1",
      },
      vars: "timer = 1",
    },
    {
      title: "T3 정점 1 에 들어가 자리 1 을 준다 ④",
      text: "정점 0 의 이웃 1 이 아직 자리가 없어 자리 1 을 주고 스택에 담았습니다.",
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
          state: "empty",
        },
        {
          value: "값 4",
          state: "empty",
        },
        {
          value: "값 5",
          state: "empty",
        },
        {
          value: "값 6",
          state: "empty",
        },
      ],
      edges: [
        {
          state: "focus",
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
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "", "", "", ""],
          states: {
            "1": "focus",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0, 1],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "", "", "", ""],
          states: {
            "1": "focus",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tin[1] = timer =",
        result: "1 → timer 2",
      },
      vars: "timer = 2",
    },
    {
      title: "T4 정점 3 에 들어가 자리 2 를 준다 ④",
      text: "이웃 목록에서 0 을 먼저 읽었는데 이미 자리를 받은 부모라 건너뛰었습니다. 정점 1 의 이웃 3 이 아직 자리가 없어 자리 2 를 주고 스택에 담았습니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
          state: "empty",
        },
        {
          value: "값 4",
          state: "focus",
        },
        {
          value: "값 5",
          state: "empty",
        },
        {
          value: "값 6",
          state: "empty",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "focus",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "", "2", "", ""],
          states: {
            "2": "empty",
            "3": "focus",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0, 1, 3],
          states: {
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "", "", ""],
          states: {
            "2": "focus",
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tin[3] = timer =",
        result: "2 → timer 3",
      },
      vars: "timer = 3",
    },
    {
      title: "T5 정점 3 에서 나오며 끝 자리 2 를 적는다 ④ ⑤",
      text: "이웃 목록에서 1 을 먼저 읽었는데 이미 자리를 받은 부모라 건너뛰었습니다. 정점 3 의 이웃을 다 읽었습니다. 그사이 자리를 받은 정점은 모두 이 정점의 자손이라, 마지막으로 준 자리 2 가 끝 자리가 됩니다. 구간 [2,2] 가 이 정점의 부분트리입니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
          state: "empty",
        },
        {
          value: "값 4",
          state: "focus",
        },
        {
          value: "값 5",
          state: "empty",
        },
        {
          value: "값 6",
          state: "empty",
        },
      ],
      edges: [
        {},
        {
          state: "out",
        },
        {
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "", "2", "", ""],
          states: {
            "2": "empty",
            "3": "read",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "", "", "2", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "focus",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0, 1],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "", "", ""],
          states: {
            "3": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tout[3] = timer − 1 =",
        result: "3 − 1 = 2",
      },
      vars: "timer = 3",
    },
    {
      title: "T6 정점 4 에 들어가 자리 3 을 준다 ④",
      text: "정점 1 의 이웃 4 가 아직 자리가 없어 자리 3 을 주고 스택에 담았습니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
          state: "empty",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
          state: "focus",
        },
        {
          value: "값 6",
          state: "empty",
        },
      ],
      edges: [
        {},
        {
          state: "out",
        },
        {},
        {
          state: "focus",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "", "2", "3", ""],
          states: {
            "2": "empty",
            "4": "focus",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "", "", "2", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0, 1, 4],
          states: {
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "", ""],
          states: {
            "3": "focus",
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tin[4] = timer =",
        result: "3 → timer 4",
      },
      vars: "timer = 4",
    },
    {
      title: "T7 정점 4 에서 나오며 끝 자리 3 을 적는다 ④ ⑤",
      text: "이웃 목록에서 1 을 먼저 읽었는데 이미 자리를 받은 부모라 건너뛰었습니다. 정점 4 의 이웃을 다 읽었습니다. 그사이 자리를 받은 정점은 모두 이 정점의 자손이라, 마지막으로 준 자리 3 이 끝 자리가 됩니다. 구간 [3,3] 이 이 정점의 부분트리입니다.",
      nodes: [
        {
          value: "값 1",
        },
        {
          value: "값 2",
        },
        {
          value: "값 3",
          state: "empty",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
          state: "focus",
        },
        {
          value: "값 6",
          state: "empty",
        },
      ],
      edges: [
        {},
        {
          state: "out",
        },
        {},
        {
          state: "read",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "", "2", "3", ""],
          states: {
            "2": "empty",
            "4": "read",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "", "", "2", "3", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "4": "focus",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0, 1],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "", ""],
          states: {
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tout[4] = timer − 1 =",
        result: "4 − 1 = 3",
      },
      vars: "timer = 4",
    },
    {
      title: "T8 정점 1 에서 나오며 끝 자리 3 을 적는다 ⑤",
      text: "정점 1 의 이웃을 다 읽었습니다. 그사이 자리를 받은 정점은 모두 이 정점의 자손이라, 마지막으로 준 자리 3 이 끝 자리가 됩니다. 구간 [1,3] 이 이 정점의 부분트리입니다.",
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
          state: "empty",
        },
        {
          value: "값 4",
        },
        {
          value: "값 5",
        },
        {
          value: "값 6",
          state: "empty",
        },
      ],
      edges: [
        {},
        {
          state: "out",
        },
        {},
        {},
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "", "2", "3", ""],
          states: {
            "1": "read",
            "2": "empty",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "3", "", "2", "3", ""],
          states: {
            "0": "empty",
            "1": "focus",
            "2": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "", ""],
          states: {
            "4": "empty",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tout[1] = timer − 1 =",
        result: "4 − 1 = 3",
      },
      vars: "timer = 4",
    },
    {
      title: "T9 정점 2 에 들어가 자리 4 를 준다 ④",
      text: "정점 0 의 이웃 2 가 아직 자리가 없어 자리 4 를 주고 스택에 담았습니다.",
      nodes: [
        {
          value: "값 1",
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
        },
        {
          value: "값 6",
          state: "empty",
        },
      ],
      edges: [
        {},
        {
          state: "focus",
        },
        {},
        {},
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", ""],
          states: {
            "2": "focus",
            "5": "empty",
          },
        },
        {
          label: "tout",
          values: ["", "3", "", "2", "3", ""],
          states: {
            "0": "empty",
            "2": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0, 2],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", ""],
          states: {
            "4": "focus",
            "5": "empty",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tin[2] = timer =",
        result: "4 → timer 5",
      },
      vars: "timer = 5",
    },
    {
      title: "T10 정점 5 에 들어가 자리 5 를 준다 ④",
      text: "이웃 목록에서 0 을 먼저 읽었는데 이미 자리를 받은 부모라 건너뛰었습니다. 정점 2 의 이웃 5 가 아직 자리가 없어 자리 5 를 주고 스택에 담았습니다.",
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
          state: "focus",
        },
      ],
      edges: [
        {},
        {
          state: "read",
        },
        {},
        {},
        {
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "5": "focus",
          },
        },
        {
          label: "tout",
          values: ["", "3", "", "2", "3", ""],
          states: {
            "0": "empty",
            "2": "empty",
            "5": "empty",
          },
        },
        {
          label: "스택",
          values: [0, 2, 5],
          states: {
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {
            "5": "focus",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tin[5] = timer =",
        result: "5 → timer 6",
      },
      vars: "timer = 6",
    },
    {
      title: "T11 정점 5 에서 나오며 끝 자리 5 를 적는다 ④ ⑤",
      text: "이웃 목록에서 2 를 먼저 읽었는데 이미 자리를 받은 부모라 건너뛰었습니다. 정점 5 의 이웃을 다 읽었습니다. 그사이 자리를 받은 정점은 모두 이 정점의 자손이라, 마지막으로 준 자리 5 가 끝 자리가 됩니다. 구간 [5,5] 가 이 정점의 부분트리입니다.",
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
          state: "focus",
        },
      ],
      edges: [
        {},
        {},
        {},
        {},
        {
          state: "read",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "5": "read",
          },
        },
        {
          label: "tout",
          values: ["", "3", "", "2", "3", "5"],
          states: {
            "0": "empty",
            "2": "empty",
            "5": "focus",
          },
        },
        {
          label: "스택",
          values: [0, 2],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {},
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tout[5] = timer − 1 =",
        result: "6 − 1 = 5",
      },
      vars: "timer = 6",
    },
    {
      title: "T12 정점 2 에서 나오며 끝 자리 5 를 적는다 ⑤",
      text: "정점 2 의 이웃을 다 읽었습니다. 그사이 자리를 받은 정점은 모두 이 정점의 자손이라, 마지막으로 준 자리 5 가 끝 자리가 됩니다. 구간 [4,5] 가 이 정점의 부분트리입니다.",
      nodes: [
        {
          value: "값 1",
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
        },
        {
          value: "값 6",
        },
      ],
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "2": "read",
          },
        },
        {
          label: "tout",
          values: ["", "3", "5", "2", "3", "5"],
          states: {
            "0": "empty",
            "2": "focus",
          },
        },
        {
          label: "스택",
          values: [0],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {},
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tout[2] = timer − 1 =",
        result: "6 − 1 = 5",
      },
      vars: "timer = 6",
    },
    {
      title: "T13 정점 0 에서 나오며 끝 자리 5 를 적는다 ⑤",
      text: "정점 0 의 이웃을 다 읽었습니다. 그사이 자리를 받은 정점은 모두 이 정점의 자손이라, 마지막으로 준 자리 5 가 끝 자리가 됩니다. 구간 [0,5] 가 이 정점의 부분트리입니다.",
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
      ],
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "0": "read",
          },
        },
        {
          label: "tout",
          values: ["5", "3", "5", "2", "3", "5"],
          states: {
            "0": "focus",
          },
        },
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {},
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
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
        expr: "tout[0] = timer − 1 =",
        result: "6 − 1 = 5",
      },
      vars: "timer = 6",
    },
    {
      title: "T14 기저 배열 자리에 값을 담아 펜윅 트리를 세운다 ⑥",
      text: "자리 p 에 앉은 정점의 값을 펜윅 트리 칸 p + 1 에 적고, 칸마다 다음 칸에 한 번씩 더해 펜윅 트리를 세웠습니다. 준비는 여기서 끝나고, 트리를 다시 순회하지 않습니다.",
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
      ],
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {},
        },
        {
          label: "tout",
          values: ["5", "3", "5", "2", "3", "5"],
          states: {},
        },
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["1", "3", "4", "12", "3", "9"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
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
        result: "[1, 2, 4, 5, 3, 6]",
      },
      vars: "timer = 6",
    },
    {
      title: "T15 querySubtree(1) — 구간 [1,3] 의 합을 낸다 ⑨",
      text: "정점 1 의 부분트리는 자리 [1,3] 입니다. 끝 자리까지의 합 12 에서 시작 앞까지의 합 1 을 빼 답 11 을 냅니다. 트리를 순회하지 않고 펜윅 트리 칸 2 개만 읽었습니다.",
      nodes: [
        {
          value: "값 1",
          state: "out",
        },
        {
          value: "값 2",
          state: "read",
        },
        {
          value: "값 3",
          state: "out",
        },
        {
          value: "값 4",
          state: "read",
        },
        {
          value: "값 5",
          state: "read",
        },
        {
          value: "값 6",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
        {},
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "1": "read",
          },
        },
        {
          label: "tout",
          values: ["5", "3", "5", "2", "3", "5"],
          states: {
            "1": "read",
          },
        },
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {
            "0": "out",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "out",
            "5": "out",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["1", "3", "4", "12", "3", "9"],
          states: {
            "0": "read",
            "3": "read",
          },
        },
        {
          label: "답 목록",
          values: [11],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "prefix(3) − prefix(0) =",
        result: "12 − 1 = 11",
      },
      vars: "연산 1 / 4",
    },
    {
      title: "T16 update(4, 10) — 차이를 칸에 더한다 ⑦ ⑧",
      text: "정점 4 의 값을 5 에서 10 으로 바꿨습니다. 펜윅 트리는 더하기만 받으므로 차이 5 를 자리 3 을 맡는 칸 1 개에 더합니다. tin · tout 은 그대로입니다.",
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
          value: "값 10",
          state: "focus",
        },
        {
          value: "값 6",
        },
      ],
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "4": "read",
          },
        },
        {
          label: "tout",
          values: ["5", "3", "5", "2", "3", "5"],
          states: {},
        },
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {
            "3": "read",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["1", "3", "4", "17", "3", "9"],
          states: {
            "3": "focus",
          },
        },
        {
          label: "답 목록",
          values: [11],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "delta = 10 − 5 =",
        result: "5 → 칸 4",
      },
      vars: "연산 2 / 4",
    },
    {
      title: "T17 querySubtree(1) — 구간 [1,3] 의 합을 낸다 ⑨",
      text: "정점 1 의 부분트리는 자리 [1,3] 입니다. 끝 자리까지의 합 17 에서 시작 앞까지의 합 1 을 빼 답 16 을 냅니다. 트리를 순회하지 않고 펜윅 트리 칸 2 개만 읽었습니다.",
      nodes: [
        {
          value: "값 1",
          state: "out",
        },
        {
          value: "값 2",
          state: "read",
        },
        {
          value: "값 3",
          state: "out",
        },
        {
          value: "값 4",
          state: "read",
        },
        {
          value: "값 10",
          state: "read",
        },
        {
          value: "값 6",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
        {},
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "1": "read",
          },
        },
        {
          label: "tout",
          values: ["5", "3", "5", "2", "3", "5"],
          states: {
            "1": "read",
          },
        },
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {
            "0": "out",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "out",
            "5": "out",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["1", "3", "4", "17", "3", "9"],
          states: {
            "0": "read",
            "3": "read",
          },
        },
        {
          label: "답 목록",
          values: [11, 16],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "prefix(3) − prefix(0) =",
        result: "17 − 1 = 16",
      },
      vars: "연산 3 / 4",
    },
    {
      title: "T18 querySubtree(0) — 구간 [0,5] 의 합을 낸다 ⑨",
      text: "정점 0 의 부분트리는 자리 [0,5] 입니다. 끝 자리까지의 합 26 에서 시작 앞까지의 합 0 을 빼 답 26 을 냅니다. 트리를 순회하지 않고 펜윅 트리 칸 2 개만 읽었습니다.",
      nodes: [
        {
          value: "값 1",
          state: "read",
        },
        {
          value: "값 2",
          state: "read",
        },
        {
          value: "값 3",
          state: "read",
        },
        {
          value: "값 4",
          state: "read",
        },
        {
          value: "값 10",
          state: "read",
        },
        {
          value: "값 6",
          state: "read",
        },
      ],
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "tin",
          values: ["0", "1", "4", "2", "3", "5"],
          states: {
            "0": "read",
          },
        },
        {
          label: "tout",
          values: ["5", "3", "5", "2", "3", "5"],
          states: {
            "0": "read",
          },
        },
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "자리 p",
          values: [0, 1, 2, 3, 4, 5],
        },
        {
          label: "그 자리의 정점",
          values: ["0", "1", "3", "4", "2", "5"],
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
          },
        },
        {
          label: "펜윅 트리 칸 p + 1",
          values: ["1", "3", "4", "17", "3", "9"],
          states: {
            "3": "read",
            "5": "read",
          },
        },
        {
          label: "답 목록",
          values: [11, 16, 26],
          states: {
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "prefix(5) − prefix(-1) =",
        result: "26 − 0 = 26",
      },
      vars: "연산 4 / 4",
    },
  ],
};
