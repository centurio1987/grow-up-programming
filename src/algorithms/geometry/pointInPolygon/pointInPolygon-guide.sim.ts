/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. L 자 다각형 하나에 질의 점 셋(`q1` · `q2` ·
 * `q3`)을 차례로 묻는 열한 걸음(T1~T11)이다. 같은 일을 한 변이 잇달아 나오면 한 걸음으로 묶었다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 평면 위의 꼭짓점과 질의 점은 정점이고 그 자리(`layout`)는 점의 좌표 그대로다(화면
 * 아래로 갈수록 커지는 `y` 만 뒤집었다 — `convexHull` · `segmentsIntersect` 편과 같은 약속). 다각형의
 * 변 여섯은 굵은 실선 간선이고 화살촉이 변의 방향이다. 반직선은 질의 점에서 오른쪽 끝 정점으로 가는 대시
 * 간선이고, 그 걸음의 질의 것만 그린다. 꼭짓점 아래 값은 그 질의의 높이에 대어 본 자리(「위」 · 「아래」,
 * 같은 높이는 아래로 친다)다. 무대 아래 띠 둘은 그 질의가 변마다 한 일과 세 질의의 답이다.
 *
 * **옛 패널에서 옮겼다.** 옛 패널은 `keyValue` 뷰 하나에 이름 붙은 값 넷을 늘어놓았고, 다각형이 평면
 * 어디에 놓였는지는 본문의 글자 격자가 졌다. 지금은 무대가 다각형과 반직선을 그리고, 옛 값 넷 가운데
 * 변 · 판정값은 간선 머리말과 계산 알약이, 넘은 수와 `inside` 는 남는 변수가 싣는다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 기록한 것에서 낸 결과를 옮긴 것이고, 둘이 같은지는 `pointInPolygon-guide.test.ts` 가 잰다.
 */

export const pointWalk = {
  player: "stage",
  stage: "graph",
  title:
    "L 자 다각형에서 질의 점 셋의 안팎을 가른다 — 꼭짓점 아래는 질의의 높이에 대어 본 자리",
  sub: "T1–T11 · q1 · q2 · q3",
  result: "[true, false, true]",
  layout: {
    nodes: [
      {
        id: "v0",
        x: 0,
        y: 4,
        label: "(0,0)",
      },
      {
        id: "v1",
        x: 4,
        y: 4,
        label: "(4,0)",
      },
      {
        id: "v2",
        x: 4,
        y: 2,
        label: "(4,2)",
      },
      {
        id: "v3",
        x: 2,
        y: 2,
        label: "(2,2)",
      },
      {
        id: "v4",
        x: 2,
        y: 0,
        label: "(2,4)",
      },
      {
        id: "v5",
        x: 0,
        y: 0,
        label: "(0,4)",
      },
      {
        id: "q1",
        x: 1,
        y: 3,
        label: "q1",
      },
      {
        id: "q2",
        x: 3,
        y: 1,
        label: "q2",
      },
      {
        id: "q3",
        x: 2,
        y: 1,
        label: "q3",
      },
      {
        id: "end1",
        x: 5,
        y: 3,
        label: "반직선",
      },
      {
        id: "end3",
        x: 5,
        y: 1,
        label: "반직선",
      },
    ],
    edges: [
      {
        from: "v5",
        to: "v0",
      },
      {
        from: "v0",
        to: "v1",
      },
      {
        from: "v1",
        to: "v2",
      },
      {
        from: "v2",
        to: "v3",
      },
      {
        from: "v3",
        to: "v4",
      },
      {
        from: "v4",
        to: "v5",
      },
      {
        from: "q1",
        to: "end1",
      },
      {
        from: "q2",
        to: "end3",
      },
      {
        from: "q3",
        to: "end3",
      },
    ],
    directed: true,
    unit: {
      x: 84,
      y: 60,
    },
  },
  steps: [
    {
      title: "T1 q1 · e1 — 왼쪽이라 그대로 둔다",
      text: "e1 은 높이 1 을 지나는데 그 자리의 x 가 0 이라 점의 x 1 보다 왼쪽입니다. onLeft 는 true, goesUp 은 false 로 서로 달라 inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "(1,1)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "e1 왼쪽",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q1 의 변",
          values: ["왼쪽", "", "", "", "", ""],
          slots: 6,
          states: {
            "0": "read",
          },
        },
        {
          label: "답",
          values: ["", "", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e1 onLeft true === goesUp false →",
        result: "그대로",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T2 q1 · e2 — 높이 밖이라 건너뛴다",
      text: "e2 는 두 끝점이 높이 1 에 대어 둘 다 위이거나 둘 다 아래라 반직선의 높이를 지나지 않습니다. inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          value: "(1,1)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
          label: "e2 높이 밖",
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
        {
          kind: "tree",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q1 의 변",
          values: ["왼쪽", "높이 밖", "", "", "", ""],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "답",
          values: ["", "", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e2 aboveA false · aboveB false",
        result: "건너뛴다",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T3 q1 · e3 — 교차해 뒤집는다",
      text: "e3 은 높이 1 을 지나고 그 자리의 x 가 4 라 점의 오른쪽입니다. onLeft 와 goesUp 이 둘 다 true 라 inside 가 뒤집혀 true 가 됩니다.",
      nodes: [
        {
          value: "아래",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          value: "(1,1)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
        {
          state: "out",
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
          label: "e3 뒤집음",
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
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q1 의 변",
          values: ["왼쪽", "높이 밖", "뒤집음", "", "", ""],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
        {
          label: "답",
          values: ["", "", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e3 onLeft true === goesUp true →",
        result: "뒤집는다",
      },
      vars: "inside true · 교차 수 1",
    },
    {
      title: "T4 q1 · e4 e5 e6 — 높이 밖이라 건너뛴다",
      text: "e4 · e5 · e6 은 두 끝점이 높이 1 에 대어 둘 다 위이거나 둘 다 아래라 반직선의 높이를 지나지 않습니다. inside 는 그대로 true 입니다.",
      nodes: [
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "(1,1)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
        {
          state: "out",
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
          kind: "tree",
          state: "read",
          label: "e4 높이 밖",
        },
        {
          kind: "tree",
          state: "read",
          label: "e5 높이 밖",
        },
        {
          kind: "tree",
          state: "read",
          label: "e6 높이 밖",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q1 의 변",
          values: [
            "왼쪽",
            "높이 밖",
            "뒤집음",
            "높이 밖",
            "높이 밖",
            "높이 밖",
          ],
          slots: 6,
          states: {
            "3": "read",
            "4": "read",
            "5": "read",
          },
        },
        {
          label: "답",
          values: ["true", "", ""],
          slots: 3,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "e4 aboveA true · aboveB true / e5 aboveA true · aboveB true / e6 aboveA true · aboveB true",
        result: "건너뛴다",
      },
      vars: "inside true · 교차 수 1",
    },
    {
      title: "T5 q2 · e1 — 왼쪽이라 그대로 둔다",
      text: "e1 은 높이 3 을 지나는데 그 자리의 x 가 0 이라 점의 x 3 보다 왼쪽입니다. onLeft 는 true, goesUp 은 false 로 서로 달라 inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "위",
        },
        {
          value: "위",
          state: "read",
        },
        {
          state: "out",
        },
        {
          value: "(3,3)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "e1 왼쪽",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q2 의 변",
          values: ["왼쪽", "", "", "", "", ""],
          slots: 6,
          states: {
            "0": "read",
          },
        },
        {
          label: "답",
          values: ["true", "", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e1 onLeft true === goesUp false →",
        result: "그대로",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T6 q2 · e2 e3 e4 — 높이 밖이라 건너뛴다",
      text: "e2 · e3 · e4 는 두 끝점이 높이 3 에 대어 둘 다 위이거나 둘 다 아래라 반직선의 높이를 지나지 않습니다. inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          state: "out",
        },
        {
          value: "(3,3)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
          label: "e2 높이 밖",
        },
        {
          kind: "tree",
          state: "read",
          label: "e3 높이 밖",
        },
        {
          kind: "tree",
          state: "read",
          label: "e4 높이 밖",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q2 의 변",
          values: ["왼쪽", "높이 밖", "높이 밖", "높이 밖", "", ""],
          slots: 6,
          states: {
            "1": "read",
            "2": "read",
            "3": "read",
          },
        },
        {
          label: "답",
          values: ["true", "", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e2 aboveA false · aboveB false / e3 aboveA false · aboveB false / e4 aboveA false · aboveB false",
        result: "건너뛴다",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T7 q2 · e5 — 왼쪽이라 그대로 둔다",
      text: "e5 는 높이 3 을 지나는데 그 자리의 x 가 2 라 점의 x 3 보다 왼쪽입니다. onLeft 는 false, goesUp 은 true 로 서로 달라 inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "위",
        },
        {
          state: "out",
        },
        {
          value: "(3,3)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
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
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
          label: "e5 왼쪽",
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q2 의 변",
          values: ["왼쪽", "높이 밖", "높이 밖", "높이 밖", "왼쪽", ""],
          slots: 6,
          states: {
            "4": "read",
          },
        },
        {
          label: "답",
          values: ["true", "", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e5 onLeft false === goesUp true →",
        result: "그대로",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T8 q2 · e6 — 높이 밖이라 건너뛴다",
      text: "e6 은 두 끝점이 높이 3 에 대어 둘 다 위이거나 둘 다 아래라 반직선의 높이를 지나지 않습니다. inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "위",
          state: "read",
        },
        {
          state: "out",
        },
        {
          value: "(3,3)",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
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
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
          label: "e6 높이 밖",
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "q2 의 변",
          values: ["왼쪽", "높이 밖", "높이 밖", "높이 밖", "왼쪽", "높이 밖"],
          slots: 6,
          states: {
            "5": "read",
          },
        },
        {
          label: "답",
          values: ["true", "false", ""],
          slots: 3,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "e6 aboveA true · aboveB true",
        result: "건너뛴다",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T9 q3 · e1 — 왼쪽이라 그대로 둔다",
      text: "e1 은 높이 3 을 지나는데 그 자리의 x 가 0 이라 점의 x 2 보다 왼쪽입니다. onLeft 는 true, goesUp 은 false 로 서로 달라 inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "위",
        },
        {
          value: "위",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "(2,3)",
          state: "read",
        },
        {
          state: "out",
        },
        {},
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "e1 왼쪽",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "q3 의 변",
          values: ["왼쪽", "", "", "", "", ""],
          slots: 6,
          states: {
            "0": "read",
          },
        },
        {
          label: "답",
          values: ["true", "false", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e1 onLeft true === goesUp false →",
        result: "그대로",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T10 q3 · e2 e3 e4 — 높이 밖이라 건너뛴다",
      text: "e2 · e3 · e4 는 두 끝점이 높이 3 에 대어 둘 다 위이거나 둘 다 아래라 반직선의 높이를 지나지 않습니다. inside 는 그대로 false 입니다.",
      nodes: [
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "위",
        },
        {
          value: "위",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "(2,3)",
          state: "read",
        },
        {
          state: "out",
        },
        {},
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
          label: "e2 높이 밖",
        },
        {
          kind: "tree",
          state: "read",
          label: "e3 높이 밖",
        },
        {
          kind: "tree",
          state: "read",
          label: "e4 높이 밖",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "q3 의 변",
          values: ["왼쪽", "높이 밖", "높이 밖", "높이 밖", "", ""],
          slots: 6,
          states: {
            "1": "read",
            "2": "read",
            "3": "read",
          },
        },
        {
          label: "답",
          values: ["true", "false", ""],
          slots: 3,
          states: {},
        },
      ],
      calc: {
        expr: "e2 aboveA false · aboveB false / e3 aboveA false · aboveB false / e4 aboveA false · aboveB false",
        result: "건너뛴다",
      },
      vars: "inside false · 교차 수 0",
    },
    {
      title: "T11 q3 · e5 — 변 위라 그 자리에서 참",
      text: "e5 는 판정값이 0 이고 점 (2,3) 이 좌표 칸 안이라 변 위입니다. 홀짝을 세기 전에 답이 true 로 정해지고 남은 변은 보지 않습니다.",
      nodes: [
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
        },
        {
          value: "아래",
          state: "read",
        },
        {
          value: "위",
          state: "read",
        },
        {
          value: "위",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "(2,3)",
          state: "read",
        },
        {
          state: "out",
        },
        {},
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
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e5 변 위",
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "q3 의 변",
          values: ["왼쪽", "높이 밖", "높이 밖", "높이 밖", "변 위", ""],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
        {
          label: "답",
          values: ["true", "false", "true"],
          slots: 3,
          states: {
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "e5 d = 0 · 칸 안 →",
        result: "true",
      },
      vars: "inside — · 교차 수 0",
    },
  ],
};
