import type { GraphPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은 원고의
 * 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 은 껍질을 세우는 걸음, T2~T7 은 변 하나씩, T8 은 반환이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가 무대
 * 갈래를 고른다. 점 여덟의 자리(`layout`)는 패널에 한 번만 적고 — 좌표 그대로, `y` 만 뒤집는다 — 걸음마다
 * 점의 상태와 값(그 변에서의 넓이의 2 배), 껍질의 변과 대척점 쌍(간선), 변에 대는 지지선과 그 반대편의 평행한
 * 지지선(`lines`)만 바꾼다(`src/_viz/player/graphStage.ts`). 옛 패널(`view: "keyValue"`)을 이 무대로 옮겼다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `rotatingCalipersDiameter-guide.test.ts` 가 잰다.
 */
export const calipersWalk = {
  player: "stage",
  stage: "graph",
  title: "점 여덟 개 — 껍질을 세우고 변 여섯을 따라 far 를 앞으로 보낸다",
  sub: "T1–T8 · 껍질 한 번 · 변마다 대척점 쌍 둘 · 반환",
  result: "73",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 7,
        label: "h0 (0,0)",
      },
      {
        id: 1,
        x: 6,
        y: 7,
        label: "h1 (6,0)",
      },
      {
        id: 2,
        x: 8,
        y: 4,
        label: "h2 (8,3)",
      },
      {
        id: 3,
        x: 6,
        y: 1,
        label: "h3 (6,6)",
      },
      {
        id: 4,
        x: 2,
        y: 0,
        label: "h4 (2,7)",
      },
      {
        id: 5,
        x: 0,
        y: 3,
        label: "h5 (0,4)",
      },
      {
        id: 6,
        x: 3,
        y: 4,
        label: "(3,3)",
      },
      {
        id: 7,
        x: 5,
        y: 5,
        label: "(5,2)",
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 1,
        to: 2,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 3,
        to: 4,
      },
      {
        from: 4,
        to: 5,
      },
      {
        from: 5,
        to: 0,
      },
      {
        from: 0,
        to: 4,
      },
      {
        from: 1,
        to: 4,
      },
      {
        from: 2,
        to: 4,
      },
      {
        from: 2,
        to: 0,
      },
      {
        from: 3,
        to: 0,
      },
      {
        from: 5,
        to: 1,
      },
      {
        from: 5,
        to: 2,
      },
    ],
    directed: false,
    unit: {
      x: 72,
      y: 72,
    },
  },
  steps: [
    {
      title: "T1 껍질을 세운다",
      text: "점 8 개에서 볼록 껍질을 세우면 꼭짓점이 6 개 남고, 안쪽 점 둘은 흐리게 그렸습니다. 첫 변을 보기 전 far 는 h1 입니다.",
      nodes: [
        {
          state: "focus",
        },
        {
          value: "far",
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
          state: "out",
        },
        {
          state: "out",
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
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      lines: [],
      calc: {
        expr: "k =",
        result: "6",
      },
      vars: "best 0",
    },
    {
      title: "T2 변 h0→h1 · far h4",
      text: "넓이가 늘어나는 동안 far 가 h1 에서 h4 까지 3 칸 전진합니다. 변의 두 끝과 짝지은 대척점 쌍 둘의 제곱 거리는 53 · 65 고, best 는 65 입니다.",
      nodes: [
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 18",
          state: "read",
        },
        {
          value: "넓이 36",
          state: "read",
        },
        {
          value: "넓이 42",
          state: "focus",
        },
        {
          value: "넓이 24",
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
          state: "focus",
        },
        {},
        {},
        {},
        {},
        {},
        {
          kind: "back",
          state: "read",
          label: "53",
        },
        {
          kind: "back",
          state: "read",
          label: "65",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      lines: [
        {
          x: 0,
          y: 7,
          dx: 6,
          dy: 0,
          label: "변 h0→h1 의 지지선",
        },
        {
          x: 2,
          y: 0,
          dx: 6,
          dy: 0,
          label: "h4 의 지지선",
        },
      ],
      calc: {
        expr: "max(0, 53, 65) =",
        result: "65",
      },
      vars: "전진 3 회",
    },
    {
      title: "T3 변 h1→h2 · far h4",
      text: "다음 꼭짓점이 더 멀지 않아 far 가 h4 에 그대로 있습니다. 변의 두 끝과 짝지은 대척점 쌍 둘의 제곱 거리는 65 · 52 고, best 는 65 입니다.",
      nodes: [
        {
          value: "넓이 18",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 12",
        },
        {
          value: "넓이 26",
          state: "focus",
        },
        {
          value: "넓이 26",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {},
        {
          state: "focus",
        },
        {},
        {},
        {},
        {},
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "read",
          label: "65",
        },
        {
          kind: "back",
          state: "read",
          label: "52",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      lines: [
        {
          x: 6,
          y: 7,
          dx: 2,
          dy: -3,
          label: "변 h1→h2 의 지지선",
        },
        {
          x: 2,
          y: 0,
          dx: 2,
          dy: -3,
          label: "h4 의 지지선",
        },
      ],
      calc: {
        expr: "max(65, 65, 52) =",
        result: "65",
      },
      vars: "전진 0 회",
    },
    {
      title: "T4 변 h2→h3 · far h0",
      text: "넓이가 늘어나는 동안 far 가 h4 에서 h0 까지 2 칸 전진합니다. 변의 두 끝과 짝지은 대척점 쌍 둘의 제곱 거리는 73 · 72 고, best 는 73 입니다.",
      nodes: [
        {
          value: "넓이 30",
          state: "focus",
        },
        {
          value: "넓이 12",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 10",
          state: "read",
        },
        {
          value: "넓이 22",
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
        {},
        {},
        {
          state: "focus",
        },
        {},
        {},
        {},
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "read",
          label: "73",
        },
        {
          kind: "back",
          state: "read",
          label: "72",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      lines: [
        {
          x: 8,
          y: 4,
          dx: -2,
          dy: -3,
          label: "변 h2→h3 의 지지선",
        },
        {
          x: 0,
          y: 7,
          dx: -2,
          dy: -3,
          label: "h0 의 지지선",
        },
      ],
      calc: {
        expr: "max(65, 73, 72) =",
        result: "73",
      },
      vars: "전진 2 회",
    },
    {
      title: "T5 변 h3→h4 · far h0",
      text: "다음 꼭짓점이 더 멀지 않아 far 가 h0 에 그대로 있습니다. 변의 두 끝과 짝지은 대척점 쌍 둘의 제곱 거리는 72 · 53 이고, best 는 73 입니다.",
      nodes: [
        {
          value: "넓이 30",
          state: "focus",
        },
        {
          value: "넓이 24",
        },
        {
          value: "넓이 10",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 14",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {},
        {},
        {},
        {
          state: "focus",
        },
        {},
        {},
        {
          kind: "back",
          state: "read",
          label: "53",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "read",
          label: "72",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      lines: [
        {
          x: 6,
          y: 1,
          dx: -4,
          dy: -1,
          label: "변 h3→h4 의 지지선",
        },
        {
          x: 0,
          y: 7,
          dx: -4,
          dy: -1,
          label: "h0 의 지지선",
        },
      ],
      calc: {
        expr: "max(73, 72, 53) =",
        result: "73",
      },
      vars: "전진 0 회",
    },
    {
      title: "T6 변 h4→h5 · far h1",
      text: "넓이가 늘어나는 동안 far 가 h0 에서 h1 까지 1 칸 전진합니다. 변의 두 끝과 짝지은 대척점 쌍 둘의 제곱 거리는 65 · 52 고, best 는 73 입니다.",
      nodes: [
        {
          value: "넓이 8",
          state: "read",
        },
        {
          value: "넓이 26",
          state: "focus",
        },
        {
          value: "넓이 26",
        },
        {
          value: "넓이 14",
        },
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 0",
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
        {},
        {},
        {},
        {},
        {
          state: "focus",
        },
        {},
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "read",
          label: "65",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "read",
          label: "52",
        },
        {
          hidden: true,
        },
      ],
      lines: [
        {
          x: 2,
          y: 0,
          dx: -2,
          dy: 3,
          label: "변 h4→h5 의 지지선",
        },
        {
          x: 6,
          y: 7,
          dx: -2,
          dy: 3,
          label: "h1 의 지지선",
        },
      ],
      calc: {
        expr: "max(73, 65, 52) =",
        result: "73",
      },
      vars: "전진 1 회",
    },
    {
      title: "T7 변 h5→h0 · far h2",
      text: "넓이가 늘어나는 동안 far 가 h1 에서 h2 까지 1 칸 전진합니다. 변의 두 끝과 짝지은 대척점 쌍 둘의 제곱 거리는 65 · 73 이고, best 는 73 입니다.",
      nodes: [
        {
          value: "넓이 0",
          state: "read",
        },
        {
          value: "넓이 24",
          state: "read",
        },
        {
          value: "넓이 32",
          state: "focus",
        },
        {
          value: "넓이 24",
        },
        {
          value: "넓이 8",
        },
        {
          value: "넓이 0",
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
        {},
        {},
        {},
        {},
        {},
        {
          state: "focus",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "read",
          label: "73",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "read",
          label: "65",
        },
      ],
      lines: [
        {
          x: 0,
          y: 3,
          dx: 0,
          dy: 4,
          label: "변 h5→h0 의 지지선",
        },
        {
          x: 8,
          y: 4,
          dx: 0,
          dy: 4,
          label: "h2 의 지지선",
        },
      ],
      calc: {
        expr: "max(73, 65, 73) =",
        result: "73",
      },
      vars: "전진 1 회",
    },
    {
      title: "T8 best 를 낸다",
      text: "변 6 개를 다 봤습니다. best 73 은 대척점 쌍 h0–h2 의 제곱 거리이고, 배정밀도로 옮겨 그대로 돌려줍니다.",
      nodes: [
        {
          state: "focus",
        },
        {},
        {
          state: "focus",
        },
        {},
        {},
        {},
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {},
        {},
        {},
        {},
        {},
        {},
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
          state: "focus",
          label: "73",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
      ],
      lines: [],
      calc: {
        expr: "Number(73n) =",
        result: "73",
      },
      vars: null,
    },
  ],
} satisfies GraphPlayerSpec;
