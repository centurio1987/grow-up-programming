import type { GraphPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * 걸음 재생 패널 두 벌 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임
 * 제목은 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 첫 벌은 x 순서 정렬과 왼쪽 절반
 * (T1~T5), 둘째 벌은 오른쪽 절반과 맨 위 단계(T6~T12)다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 점 여덟의 자리(`layout`)는 패널에 한 번만 적고 — 좌표 그대로, `y` 만 뒤집는다 —
 * 걸음마다 점의 상태와 값, 비교한 쌍(간선), 지금 맡은 구간(`groups`), 분할선(`rules`), 분할선 양옆의
 * 띠(`bands`), 칸 줄 셋(x 순서 · `byY` · `strip`)만 바꾼다(`src/_viz/player/graphStage.ts`).
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `closestPairOfPoints-guide.test.ts` 가 잰다.
 */

export const walkLeft = {
  player: "stage",
  stage: "graph",
  title: "점 여덟 개 — x 순서 정렬과 왼쪽 절반",
  sub: "T1–T5 · 정렬 한 번과 왼쪽 네 점의 재귀",
  result: "2.2361",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 8,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 2,
        y: 2,
        label: "(2,6)",
      },
      {
        id: 2,
        x: 3,
        y: 7,
        label: "(3,1)",
      },
      {
        id: 3,
        x: 4,
        y: 0,
        label: "(4,8)",
      },
      {
        id: 4,
        x: 5,
        y: 6,
        label: "(5,2)",
      },
      {
        id: 5,
        x: 6,
        y: 3,
        label: "(6,5)",
      },
      {
        id: 6,
        x: 8,
        y: 5,
        label: "(8,3)",
      },
      {
        id: 7,
        x: 9,
        y: 1,
        label: "(9,7)",
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
        from: 0,
        to: 2,
      },
      {
        from: 1,
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
      {
        from: 4,
        to: 6,
      },
      {
        from: 6,
        to: 5,
      },
      {
        from: 5,
        to: 7,
      },
      {
        from: 2,
        to: 4,
      },
    ],
    directed: false,
    unit: {
      x: 70,
      y: 50,
    },
  },
  steps: [
    {
      title: "T1 x 순서로 정렬",
      text: "점 8 개를 x 순서로 한 번 정렬합니다. 재귀는 이 목록의 이어진 토막을 맡습니다.",
      nodes: [{}, {}, {}, {}, {}, {}, {}, {}],
      edges: [
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
      groups: [],
      rules: [],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {},
        },
        {
          label: "byY",
          values: [],
          slots: 8,
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: null,
      vars: "기본 연산 누적 12",
    },
    {
      title: "T2 기저 (0,0) (2,6)",
      text: "점이 2 개라 기저입니다. (0,0) (2,6) 을 직접 비교해 best = 40 입니다.",
      nodes: [
        {
          state: "read",
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
          state: "focus",
          label: "40",
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
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      groups: [
        {
          members: [0, 1],
          label: "기저 · 점 2",
        },
      ],
      rules: [],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
        },
        {
          label: "byY",
          values: ["(0,0)", "(2,6)"],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
          },
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "D((0,0), (2,6)) =",
        result: "40",
      },
      vars: "기본 연산 누적 14",
    },
    {
      title: "T3 기저 (3,1) (4,8)",
      text: "점이 2 개라 기저입니다. (3,1) (4,8) 을 직접 비교해 best = 50 입니다.",
      nodes: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "read",
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
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          state: "focus",
          label: "50",
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
        {
          hidden: true,
        },
      ],
      groups: [
        {
          members: [2, 3],
          label: "기저 · 점 2",
        },
      ],
      rules: [],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "0": "out",
            "1": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
        },
        {
          label: "byY",
          values: ["(3,1)", "(4,8)"],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
          },
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "D((3,1), (4,8)) =",
        result: "50",
      },
      vars: "기본 연산 누적 16",
    },
    {
      title: "T4 분할선 x = 3 · 두 절반을 합친다",
      text: "점이 4 개라 x = 3 에서 반으로 가릅니다. 두 절반이 낸 best 중 작은 40 을 잡고, 두 byY 를 합쳐 y 순서 목록 하나로 만듭니다.",
      nodes: [
        {},
        {},
        {},
        {},
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
      groups: [
        {
          members: [0, 1, 2, 3],
          label: "구간 · 점 4",
        },
      ],
      rules: [
        {
          x: 3,
          label: "x = 3",
        },
      ],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
        },
        {
          label: "byY",
          values: ["(0,0)", "(3,1)", "(2,6)", "(4,8)"],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
          },
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "min(40, 50) =",
        result: "40",
      },
      vars: "기본 연산 누적 19",
    },
    {
      title: "T5 분할선 x = 3 옆 띠",
      text: "분할선에서 가로 차의 제곱이 40 보다 작은 4 점이 띠에 듭니다. y 순서로 읽으며 2 번 비교하고 2 번 멈춰, best 가 8 이 됩니다.",
      nodes: [
        {
          value: "dx² 9",
          state: "read",
        },
        {
          value: "dx² 1",
          state: "focus",
        },
        {
          value: "dx² 0",
          state: "read",
        },
        {
          value: "dx² 1",
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
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          state: "read",
          label: "10",
        },
        {
          state: "focus",
          label: "8",
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
      groups: [
        {
          members: [0, 1, 2, 3],
          label: "구간 · 점 4",
        },
      ],
      rules: [
        {
          x: 3,
          label: "x = 3",
        },
      ],
      bands: [
        {
          from: -3.324555320336759,
          to: 9.32455532033676,
          label: "띠 — 가로 거리 √40 안쪽",
        },
      ],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
        },
        {
          label: "byY",
          values: ["(0,0)", "(3,1)", "(2,6)", "(4,8)"],
          slots: 8,
        },
        {
          label: "strip",
          values: ["(0,0)", "(3,1)", "(2,6)", "(4,8)"],
          slots: 8,
          states: {
            "0": "read",
            "1": "read",
            "2": "focus",
            "3": "focus",
          },
        },
      ],
      calc: {
        expr: "best 40 →",
        result: "8",
      },
      vars: "기본 연산 누적 29",
    },
  ],
} satisfies GraphPlayerSpec;

export const walkRight = {
  player: "stage",
  stage: "graph",
  title: "점 여덟 개 — 오른쪽 절반과 맨 위 단계",
  sub: "T6–T12 · 오른쪽 네 점의 재귀와 맨 위 띠",
  result: "2.2361",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 8,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 2,
        y: 2,
        label: "(2,6)",
      },
      {
        id: 2,
        x: 3,
        y: 7,
        label: "(3,1)",
      },
      {
        id: 3,
        x: 4,
        y: 0,
        label: "(4,8)",
      },
      {
        id: 4,
        x: 5,
        y: 6,
        label: "(5,2)",
      },
      {
        id: 5,
        x: 6,
        y: 3,
        label: "(6,5)",
      },
      {
        id: 6,
        x: 8,
        y: 5,
        label: "(8,3)",
      },
      {
        id: 7,
        x: 9,
        y: 1,
        label: "(9,7)",
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
        from: 0,
        to: 2,
      },
      {
        from: 1,
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
      {
        from: 4,
        to: 6,
      },
      {
        from: 6,
        to: 5,
      },
      {
        from: 5,
        to: 7,
      },
      {
        from: 2,
        to: 4,
      },
    ],
    directed: false,
    unit: {
      x: 70,
      y: 50,
    },
  },
  steps: [
    {
      title: "T6 기저 (5,2) (6,5)",
      text: "점이 2 개라 기저입니다. (5,2) (6,5) 를 직접 비교해 best = 10 입니다.",
      nodes: [
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
          state: "read",
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
      edges: [
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
          state: "focus",
          label: "10",
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
      groups: [
        {
          members: [4, 5],
          label: "기저 · 점 2",
        },
      ],
      rules: [],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "6": "out",
            "7": "out",
          },
        },
        {
          label: "byY",
          values: ["(5,2)", "(6,5)"],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
          },
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "D((5,2), (6,5)) =",
        result: "10",
      },
      vars: "기본 연산 누적 31",
    },
    {
      title: "T7 기저 (8,3) (9,7)",
      text: "점이 2 개라 기저입니다. (8,3) (9,7) 을 직접 비교해 best = 17 입니다.",
      nodes: [
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
          state: "read",
        },
        {
          state: "read",
        },
      ],
      edges: [
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
          state: "focus",
          label: "17",
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
      groups: [
        {
          members: [6, 7],
          label: "기저 · 점 2",
        },
      ],
      rules: [],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
          },
        },
        {
          label: "byY",
          values: ["(8,3)", "(9,7)"],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
          },
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "D((8,3), (9,7)) =",
        result: "17",
      },
      vars: "기본 연산 누적 33",
    },
    {
      title: "T8 분할선 x = 8 · 두 절반을 합친다",
      text: "점이 4 개라 x = 8 에서 반으로 가릅니다. 두 절반이 낸 best 중 작은 10 을 잡고, 두 byY 를 합쳐 y 순서 목록 하나로 만듭니다.",
      nodes: [
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
        {},
        {},
        {},
        {},
      ],
      edges: [
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
      groups: [
        {
          members: [4, 5, 6, 7],
          label: "구간 · 점 4",
        },
      ],
      rules: [
        {
          x: 8,
          label: "x = 8",
        },
      ],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
          },
        },
        {
          label: "byY",
          values: ["(5,2)", "(8,3)", "(6,5)", "(9,7)"],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
          },
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "min(10, 17) =",
        result: "10",
      },
      vars: "기본 연산 누적 36",
    },
    {
      title: "T9 분할선 x = 8 옆 띠",
      text: "분할선에서 가로 차의 제곱이 10 보다 작은 4 점이 띠에 듭니다. y 순서로 읽으며 4 번 비교하고 2 번 멈춰, best 가 8 이 됩니다.",
      nodes: [
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
          value: "dx² 9",
          state: "read",
        },
        {
          value: "dx² 4",
          state: "focus",
        },
        {
          value: "dx² 0",
          state: "focus",
        },
        {
          value: "dx² 1",
          state: "read",
        },
      ],
      edges: [
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
          state: "read",
          label: "10",
        },
        {
          hidden: true,
        },
        {
          state: "read",
          label: "10",
        },
        {
          state: "focus",
          label: "8",
        },
        {
          state: "read",
          label: "13",
        },
        {
          hidden: true,
        },
      ],
      groups: [
        {
          members: [4, 5, 6, 7],
          label: "구간 · 점 4",
        },
      ],
      rules: [
        {
          x: 8,
          label: "x = 8",
        },
      ],
      bands: [
        {
          from: 4.83772233983162,
          to: 11.16227766016838,
          label: "띠 — 가로 거리 √10 안쪽",
        },
      ],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
          },
        },
        {
          label: "byY",
          values: ["(5,2)", "(8,3)", "(6,5)", "(9,7)"],
          slots: 8,
        },
        {
          label: "strip",
          values: ["(5,2)", "(8,3)", "(6,5)", "(9,7)"],
          slots: 8,
          states: {
            "0": "read",
            "1": "focus",
            "2": "focus",
            "3": "read",
          },
        },
      ],
      calc: {
        expr: "best 10 →",
        result: "8",
      },
      vars: "기본 연산 누적 50",
    },
    {
      title: "T10 분할선 x = 5 · 두 절반을 합친다",
      text: "점이 8 개라 x = 5 에서 반으로 가릅니다. 두 절반이 낸 best 중 작은 8 을 잡고, 두 byY 를 합쳐 y 순서 목록 하나로 만듭니다.",
      nodes: [{}, {}, {}, {}, {}, {}, {}, {}],
      edges: [
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
      groups: [
        {
          members: [0, 1, 2, 3, 4, 5, 6, 7],
          label: "구간 · 점 8",
        },
      ],
      rules: [
        {
          x: 5,
          label: "x = 5",
        },
      ],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {},
        },
        {
          label: "byY",
          values: [
            "(0,0)",
            "(3,1)",
            "(5,2)",
            "(8,3)",
            "(6,5)",
            "(2,6)",
            "(9,7)",
            "(4,8)",
          ],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
          },
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "min(8, 8) =",
        result: "8",
      },
      vars: "기본 연산 누적 57",
    },
    {
      title: "T11 분할선 x = 5 옆 띠",
      text: "분할선에서 가로 차의 제곱이 8 보다 작은 4 점이 띠에 듭니다. y 순서로 읽으며 1 번 비교하고 3 번 멈춰, best 가 5 가 됩니다.",
      nodes: [
        {
          value: "dx² 25",
        },
        {
          value: "dx² 9",
        },
        {
          value: "dx² 4",
          state: "focus",
        },
        {
          value: "dx² 1",
          state: "read",
        },
        {
          value: "dx² 0",
          state: "focus",
        },
        {
          value: "dx² 1",
          state: "read",
        },
        {
          value: "dx² 9",
        },
        {
          value: "dx² 16",
        },
      ],
      edges: [
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
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          state: "focus",
          label: "5",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3, 4, 5, 6, 7],
          label: "구간 · 점 8",
        },
      ],
      rules: [
        {
          x: 5,
          label: "x = 5",
        },
      ],
      bands: [
        {
          from: 2.1715728752538097,
          to: 7.82842712474619,
          label: "띠 — 가로 거리 √8 안쪽",
        },
      ],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {},
        },
        {
          label: "byY",
          values: [
            "(0,0)",
            "(3,1)",
            "(5,2)",
            "(8,3)",
            "(6,5)",
            "(2,6)",
            "(9,7)",
            "(4,8)",
          ],
          slots: 8,
        },
        {
          label: "strip",
          values: ["(3,1)", "(5,2)", "(6,5)", "(4,8)"],
          slots: 8,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "read",
            "3": "read",
          },
        },
      ],
      calc: {
        expr: "best 8 →",
        result: "5",
      },
      vars: "기본 연산 누적 70",
    },
    {
      title: "T12 제곱근을 한 번",
      text: "지금까지 다룬 값은 거리의 제곱입니다. 제곱근을 한 번 부르면 답 2.2361 이 나옵니다.",
      nodes: [
        {},
        {},
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
      ],
      edges: [
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
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          state: "focus",
          label: "√5",
        },
      ],
      groups: [],
      rules: [],
      bands: [],
      strips: [
        {
          label: "x 순서",
          values: [
            "(0,0)",
            "(2,6)",
            "(3,1)",
            "(4,8)",
            "(5,2)",
            "(6,5)",
            "(8,3)",
            "(9,7)",
          ],
          slots: 8,
          states: {},
        },
        {
          label: "byY",
          values: [],
          slots: 8,
        },
        {
          label: "strip",
          values: [],
          slots: 8,
        },
      ],
      calc: {
        expr: "√5 =",
        result: "2.2361",
      },
      vars: "기본 연산 누적 70",
    },
  ],
} satisfies GraphPlayerSpec;
