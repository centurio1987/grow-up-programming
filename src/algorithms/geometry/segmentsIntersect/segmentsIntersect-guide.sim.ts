/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 선분 넷 가운데 `s1` 을 상대로 한 세 쌍을
 * 차례로 판정하는 여덟 걸음(T1~T8)이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 평면 위의 끝점은 정점이고 그 자리(`layout`)는 점의 좌표 그대로다(화면 아래로 갈수록
 * 커지는 `y` 만 뒤집었다 — `convexHull` 편과 같은 약속). 선분 넷이 간선 자리이고, 걸음마다 판정하는 쌍의
 * 두 선분만 진하게 그린다(첫 인자 굵은 실선 · 둘째 인자 대시). 정점 아래 값은 그 끝점을 상대 직선에서 잰
 * 판정값이다. 무대 아래 띠 둘은 판정값 넷(`d1`~`d4`)과 세 쌍의 답이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 센 기록에서 낸 결과를 옮긴 것이고, 둘이 같은지는 `segmentsIntersect-guide.test.ts` 가 잰다.
 */

export const pairWalk = {
  player: "stage",
  stage: "graph",
  title:
    "선분 넷에서 세 쌍의 교차를 판정한다 — 정점 아래는 상대 직선에서 잰 판정값",
  sub: "T1–T8 · s1 을 상대로 세 쌍",
  result: "[true, false, true]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 6,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 6,
        y: 2,
        label: "(6,4)",
      },
      {
        id: 2,
        x: 0,
        y: 2,
        label: "(0,4)",
      },
      {
        id: 3,
        x: 6,
        y: 6,
        label: "(6,0)",
      },
      {
        id: 4,
        x: 3,
        y: 6,
        label: "(3,0)",
      },
      {
        id: 5,
        x: 3,
        y: 5,
        label: "(3,1)",
      },
      {
        id: 6,
        x: 3,
        y: 4,
        label: "(3,2)",
      },
      {
        id: 7,
        x: 9,
        y: 0,
        label: "(9,6)",
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 4,
        to: 5,
      },
      {
        from: 6,
        to: 7,
      },
    ],
    directed: false,
    unit: {
      x: 64,
      y: 52,
    },
  },
  steps: [
    {
      title: "T1 s1·s2 · 네 방향 판정을 잰다",
      text: "s2 의 직선에서 s1 의 두 끝점이 어느 쪽인지(d1 · d2), s1 의 직선에서 s2 의 두 끝점이 어느 쪽인지(d3 · d4) 잽니다. 네 값은 -1 1 1 -1 입니다.",
      nodes: [
        {
          value: "d1 -1",
          state: "focus",
        },
        {
          value: "d2 1",
          state: "focus",
        },
        {
          value: "d3 1",
          state: "focus",
        },
        {
          value: "d4 -1",
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
      edges: [
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "back",
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
          label: "판정값",
          values: ["-1", "1", "1", "-1"],
          slots: 4,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
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
        expr: "d1 d2 d3 d4 =",
        result: "-1 1 1 -1",
      },
      vars: "방향 판정 4 / 12 · 칸 검사 0",
    },
    {
      title: "T2 s1·s2 · ③ 양쪽이 다 갈리는가",
      text: "d1 · d2 는 갈립니다. d3 · d4 는 갈립니다. 서로 걸치므로 답은 true 입니다.",
      nodes: [
        {
          value: "d1 -1",
          state: "read",
        },
        {
          value: "d2 1",
          state: "read",
        },
        {
          value: "d3 1",
          state: "read",
        },
        {
          value: "d4 -1",
          state: "read",
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
      edges: [
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "back",
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
          label: "판정값",
          values: ["-1", "1", "1", "-1"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
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
        expr: "straddles(-1, 1) && straddles(1, -1) =",
        result: "true",
      },
      vars: "방향 판정 4 / 12 · 칸 검사 0",
    },
    {
      title: "T3 s1·s3 · 네 방향 판정을 잰다",
      text: "s3 의 직선에서 s1 의 두 끝점이 어느 쪽인지(d1 · d2), s1 의 직선에서 s3 의 두 끝점이 어느 쪽인지(d3 · d4) 잽니다. 네 값은 1 -1 -1 -1 입니다.",
      nodes: [
        {
          value: "d1 1",
          state: "focus",
        },
        {
          value: "d2 -1",
          state: "focus",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "d3 -1",
          state: "focus",
        },
        {
          value: "d4 -1",
          state: "focus",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
        },
        {
          state: "out",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "판정값",
          values: ["1", "-1", "-1", "-1"],
          slots: 4,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
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
        expr: "d1 d2 d3 d4 =",
        result: "1 -1 -1 -1",
      },
      vars: "방향 판정 8 / 12 · 칸 검사 0",
    },
    {
      title: "T4 s1·s3 · ③ 양쪽이 다 갈리는가",
      text: "d1 · d2 는 갈립니다. d3 · d4 는 같은 쪽입니다. 서로 걸침이 거짓이라 판정값이 0 인 끝점을 보러 갑니다.",
      nodes: [
        {
          value: "d1 1",
          state: "read",
        },
        {
          value: "d2 -1",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "d3 -1",
          state: "read",
        },
        {
          value: "d4 -1",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          state: "out",
        },
        {
          kind: "back",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "판정값",
          values: ["1", "-1", "-1", "-1"],
          slots: 4,
          states: {
            "0": "read",
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
        expr: "straddles(1, -1) && straddles(-1, -1) =",
        result: "false",
      },
      vars: "방향 판정 8 / 12 · 칸 검사 0",
    },
    {
      title: "T5 s1·s3 · ④ 판정값이 0 인 끝점을 칸으로 본다",
      text: "판정값에 0 이 하나도 없어 칸 검사를 한 번도 부르지 않습니다. 네 검사가 다 거짓이라 답은 false 입니다.",
      nodes: [
        {
          value: "d1 1",
        },
        {
          value: "d2 -1",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "d3 -1",
        },
        {
          value: "d4 -1",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          state: "out",
        },
        {
          kind: "back",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "판정값",
          values: ["1", "-1", "-1", "-1"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
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
        expr: "칸 검사 0 번 →",
        result: "false",
      },
      vars: "방향 판정 8 / 12 · 칸 검사 0",
    },
    {
      title: "T6 s1·s4 · 네 방향 판정을 잰다",
      text: "s4 의 직선에서 s1 의 두 끝점이 어느 쪽인지(d1 · d2), s1 의 직선에서 s4 의 두 끝점이 어느 쪽인지(d3 · d4) 잽니다. 네 값은 0 0 0 0 입니다.",
      nodes: [
        {
          value: "d1 0",
          state: "focus",
        },
        {
          value: "d2 0",
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
          value: "d3 0",
          state: "focus",
        },
        {
          value: "d4 0",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "판정값",
          values: ["0", "0", "0", "0"],
          slots: 4,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
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
        expr: "d1 d2 d3 d4 =",
        result: "0 0 0 0",
      },
      vars: "방향 판정 12 / 12 · 칸 검사 0",
    },
    {
      title: "T7 s1·s4 · ③ 양쪽이 다 갈리는가",
      text: "d1 · d2 는 0 이 있어 걸침이 아닙니다. d3 · d4 는 0 이 있어 걸침이 아닙니다. 서로 걸침이 거짓이라 판정값이 0 인 끝점을 보러 갑니다.",
      nodes: [
        {
          value: "d1 0",
          state: "read",
        },
        {
          value: "d2 0",
          state: "read",
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
          value: "d3 0",
          state: "read",
        },
        {
          value: "d4 0",
          state: "read",
        },
      ],
      edges: [
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
          kind: "back",
        },
      ],
      strips: [
        {
          label: "판정값",
          values: ["0", "0", "0", "0"],
          slots: 4,
          states: {
            "0": "read",
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
        expr: "straddles(0, 0) && straddles(0, 0) =",
        result: "false",
      },
      vars: "방향 판정 12 / 12 · 칸 검사 0",
    },
    {
      title: "T8 s1·s4 · ④ 판정값이 0 인 끝점을 칸으로 본다",
      text: "판정값이 0 인 끝점을 차례로 칸에 대어 봅니다. p1 (0,0) 은 상대 선분의 칸 밖, p2 (6,4) 는 상대 선분의 칸 안이라 답은 true 입니다.",
      nodes: [
        {
          value: "d1 0",
          state: "read",
        },
        {
          value: "d2 0",
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
          value: "d3 0",
        },
        {
          value: "d4 0",
        },
      ],
      edges: [
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
          kind: "back",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "판정값",
          values: ["0", "0", "0", "0"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
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
        expr: "칸 검사 2 번 →",
        result: "true",
      },
      vars: "방향 판정 12 / 12 · 칸 검사 2",
    },
  ],
};
