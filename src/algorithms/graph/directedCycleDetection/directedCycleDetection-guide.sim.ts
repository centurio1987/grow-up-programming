/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 바깥 반복의 시작이고, 그 뒤로 반복 한
 * 바퀴가 걸음 하나다. 마지막 걸음이 회색 정점을 만나 반환하는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점 안의 값(삼색
 * 표시의 색과 「확인한 간선 / 나가는 간선」)과 상태, 간선의 모양과 상태, 무대 아래 스택 띠만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 흰색 정점은 점선 테(아직), 아직 확인하지 않은 간선은 흐린 선이다.
 * 확인한 간선은 내려간 것이 굵은 실선, 회색 정점으로 간 것이 대시, 넘어간 것이 가는 실선이다. 스택 띠는
 * 아래에서 위로 왼쪽에서 오른쪽이고, 칸 수는 스택이 가장 깊었을 때에 맞춰 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `directedCycleDetection-guide.test.ts` 가 잰다.
 */
export const dfsColorWalk = {
  player: "stage",
  stage: "graph",
  title:
    "directedCycleDetection(6, [[0,1],[1,3],[3,4],[0,4],[0,2],[2,3],[2,5],[5,0]]) — 정점 안은 색과 확인한 간선 / 나가는 간선",
  sub: "T1–T12 · 걸음마다 반복 한 바퀴",
  result: "true",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 1,
      },
      {
        id: 1,
        x: 1,
        y: 0,
      },
      {
        id: 2,
        x: 1,
        y: 2,
      },
      {
        id: 3,
        x: 2,
        y: 1,
      },
      {
        id: 4,
        x: 3,
        y: 0,
      },
      {
        id: 5,
        x: 0,
        y: 2,
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 1,
        to: 3,
      },
      {
        from: 3,
        to: 4,
      },
      {
        from: 0,
        to: 4,
      },
      {
        from: 0,
        to: 2,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 2,
        to: 5,
      },
      {
        from: 5,
        to: 0,
      },
    ],
    directed: true,
  },
  steps: [
    {
      title: "T1 정점 0 을 회색으로 칠하고 스택에 넣는다",
      text: "바깥 반복이 흰색 정점 0 을 잡았습니다. 회색으로 칠하고 스택에 넣어 경로를 [0] 로 시작합니다.",
      nodes: [
        {
          value: "회색 0/3",
          state: "focus",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
        {
          value: "흰색 0/0",
          state: "empty",
        },
        {
          value: "흰색 0/1",
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
          label: "스택",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[0] →",
        result: "흰색 · 회색으로 칠한다",
      },
      vars: "확인한 간선 0 / 8",
    },
    {
      title: "T2 간선 0 → 1 — 1 이 흰색이라 내려간다 ②",
      text: "꼭대기 0 의 cursor 가 가리킨 간선을 확인했습니다. 1 이 흰색이라 회색으로 칠하고 스택에 넣습니다. 지금 경로는 [0, 1] 입니다.",
      nodes: [
        {
          value: "회색 1/3",
          state: "read",
        },
        {
          value: "회색 0/1",
          state: "focus",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
        {
          value: "흰색 0/0",
          state: "empty",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
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
          label: "스택",
          values: [0, 1],
          states: {
            "1": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[1] →",
        result: "흰색",
      },
      vars: "확인한 간선 1 / 8",
    },
    {
      title: "T3 간선 1 → 3 — 3 이 흰색이라 내려간다 ②",
      text: "꼭대기 1 의 cursor 가 가리킨 간선을 확인했습니다. 3 이 흰색이라 회색으로 칠하고 스택에 넣습니다. 지금 경로는 [0, 1, 3] 입니다.",
      nodes: [
        {
          value: "회색 1/3",
        },
        {
          value: "회색 1/1",
          state: "read",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "회색 0/1",
          state: "focus",
        },
        {
          value: "흰색 0/0",
          state: "empty",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
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
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [0, 1, 3],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[3] →",
        result: "흰색",
      },
      vars: "확인한 간선 2 / 8",
    },
    {
      title: "T4 간선 3 → 4 — 4 가 흰색이라 내려간다 ②",
      text: "꼭대기 3 의 cursor 가 가리킨 간선을 확인했습니다. 4 가 흰색이라 회색으로 칠하고 스택에 넣습니다. 지금 경로는 [0, 1, 3, 4] 입니다.",
      nodes: [
        {
          value: "회색 1/3",
        },
        {
          value: "회색 1/1",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "회색 1/1",
          state: "read",
        },
        {
          value: "회색 0/0",
          state: "focus",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
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
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [0, 1, 3, 4],
          states: {
            "3": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[4] →",
        result: "흰색",
      },
      vars: "확인한 간선 3 / 8",
    },
    {
      title: "T5 정점 4 의 목록을 다 봤다 — 검은색으로 칠해 뺀다 ④",
      text: "꼭대기 4 의 cursor 가 목록 길이와 같아 나가는 간선을 다 확인했습니다. 검은색으로 칠하고 스택에서 빼면 지금 경로는 [0, 1, 3] 입니다.",
      nodes: [
        {
          value: "회색 1/3",
        },
        {
          value: "회색 1/1",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "회색 1/1",
        },
        {
          value: "검은색 0/0",
          state: "focus",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
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
          label: "스택",
          values: [0, 1, 3],
          states: {
            "2": "read",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "cursor[4] === next[4].length →",
        result: "참",
      },
      vars: "확인한 간선 3 / 8",
    },
    {
      title: "T6 정점 3 의 목록을 다 봤다 — 검은색으로 칠해 뺀다 ④",
      text: "꼭대기 3 의 cursor 가 목록 길이와 같아 나가는 간선을 다 확인했습니다. 검은색으로 칠하고 스택에서 빼면 지금 경로는 [0, 1] 입니다.",
      nodes: [
        {
          value: "회색 1/3",
        },
        {
          value: "회색 1/1",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "검은색 1/1",
          state: "focus",
        },
        {
          value: "검은색 0/0",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
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
          label: "스택",
          values: [0, 1],
          states: {
            "1": "read",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "cursor[3] === next[3].length →",
        result: "참",
      },
      vars: "확인한 간선 3 / 8",
    },
    {
      title: "T7 정점 1 의 목록을 다 봤다 — 검은색으로 칠해 뺀다 ④",
      text: "꼭대기 1 의 cursor 가 목록 길이와 같아 나가는 간선을 다 확인했습니다. 검은색으로 칠하고 스택에서 빼면 지금 경로는 [0] 입니다.",
      nodes: [
        {
          value: "회색 1/3",
        },
        {
          value: "검은색 1/1",
          state: "focus",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "검은색 0/0",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
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
          label: "스택",
          values: [0],
          states: {
            "0": "read",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "cursor[1] === next[1].length →",
        result: "참",
      },
      vars: "확인한 간선 3 / 8",
    },
    {
      title: "T8 간선 0 → 4 — 4 가 검은색이라 넘어간다 ③",
      text: "꼭대기 0 의 cursor 가 가리킨 간선을 확인했습니다. 4 가 검은색이라 이미 끝난 정점입니다. 아무것도 하지 않고 다음 간선으로 넘어갑니다.",
      nodes: [
        {
          value: "회색 2/3",
          state: "read",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "흰색 0/2",
          state: "empty",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "검은색 0/0",
          state: "read",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
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
          label: "스택",
          values: [0],
          states: {
            "0": "read",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[4] →",
        result: "검은색",
      },
      vars: "확인한 간선 4 / 8",
    },
    {
      title: "T9 간선 0 → 2 — 2 가 흰색이라 내려간다 ②",
      text: "꼭대기 0 의 cursor 가 가리킨 간선을 확인했습니다. 2 가 흰색이라 회색으로 칠하고 스택에 넣습니다. 지금 경로는 [0, 2] 입니다.",
      nodes: [
        {
          value: "회색 3/3",
          state: "read",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "회색 0/2",
          state: "focus",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "검은색 0/0",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
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
      ],
      strips: [
        {
          label: "스택",
          values: [0, 2],
          states: {
            "1": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[2] →",
        result: "흰색",
      },
      vars: "확인한 간선 5 / 8",
    },
    {
      title: "T10 간선 2 → 3 — 3 이 검은색이라 넘어간다 ③",
      text: "꼭대기 2 의 cursor 가 가리킨 간선을 확인했습니다. 3 이 검은색이라 이미 끝난 정점입니다. 아무것도 하지 않고 다음 간선으로 넘어갑니다.",
      nodes: [
        {
          value: "회색 3/3",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "회색 1/2",
          state: "read",
        },
        {
          value: "검은색 1/1",
          state: "read",
        },
        {
          value: "검은색 0/0",
        },
        {
          value: "흰색 0/1",
          state: "empty",
        },
      ],
      edges: [
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
          label: "스택",
          values: [0, 2],
          states: {
            "1": "read",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[3] →",
        result: "검은색",
      },
      vars: "확인한 간선 6 / 8",
    },
    {
      title: "T11 간선 2 → 5 — 5 가 흰색이라 내려간다 ②",
      text: "꼭대기 2 의 cursor 가 가리킨 간선을 확인했습니다. 5 가 흰색이라 회색으로 칠하고 스택에 넣습니다. 지금 경로는 [0, 2, 5] 입니다.",
      nodes: [
        {
          value: "회색 3/3",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "회색 2/2",
          state: "read",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "검은색 0/0",
        },
        {
          value: "회색 0/1",
          state: "focus",
        },
      ],
      edges: [
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
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [0, 2, 5],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[5] →",
        result: "흰색",
      },
      vars: "확인한 간선 7 / 8",
    },
    {
      title: "T12 간선 5 → 0 — 0 이 회색이라 사이클이다 ①",
      text: "꼭대기 5 의 cursor 가 가리킨 간선을 확인했습니다. 0 이 회색, 곧 지금 경로 [0, 2, 5] 위의 정점이라 되돌아온 것입니다. true 를 반환합니다.",
      nodes: [
        {
          value: "회색 3/3",
          state: "read",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "회색 2/2",
        },
        {
          value: "검은색 1/1",
        },
        {
          value: "검은색 0/0",
        },
        {
          value: "회색 1/1",
          state: "read",
        },
      ],
      edges: [
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
        {},
        {
          kind: "tree",
        },
        {
          kind: "back",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [0, 2, 5],
          states: {
            "2": "read",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "color[0] →",
        result: "회색",
      },
      vars: "확인한 간선 8 / 8",
    },
  ],
};
