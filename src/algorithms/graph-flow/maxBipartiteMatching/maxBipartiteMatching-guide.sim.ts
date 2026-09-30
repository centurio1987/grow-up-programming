/**
 * 걸음 재생 패널 한 벌 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 열넷이
 * 그 절의 `T1`~`T14` 와 **자리까지 일대일**이다 — P3 이 수가 아니라 자리를 잰다.
 *
 * **골라 그리지 않는다.** 2026-09-10 이전에는 「상태가 실제로 바뀌는 자리 열둘」만 그리고 `T11`·`T13` 을
 * 건너뛰었다. 그 두 걸음은 각각 「이미 본 자리라 넘어간다」와 「L2 의 탐색이 실패로 끝난다」인데, 이 편이
 * 갈리는 자리가 바로 **방문 배열이 어디까지 찼는가**라 건너뛴 둘이 실패의 근거였다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가 무대
 * 갈래를 고른다. 두 쪽의 정점을 두 줄로 세운 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 짝과 상태,
 * 간선의 종류(매칭 안이면 굵은 실선)와 상태, 무대 아래 띠 둘(방문 배열 `seen` · 호출 스택)만 바꾼다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `maxBipartiteMatching-guide.test.ts` 가 잰다.
 */

export const matchWalk = {
  player: "stage",
  stage: "graph",
  title:
    "maxBipartiteMatching(3, 3, [[0,0],[0,1],[1,0],[2,0]]) — 정점 안의 값은 그 정점의 짝",
  sub: "T1–T14 · 굵은 선이 매칭 안 간선 · 아래 띠는 방문 배열과 호출 스택",
  result: "2",
  layout: {
    nodes: [
      {
        id: "L0",
        x: 0,
        y: 0,
      },
      {
        id: "L1",
        x: 0,
        y: 1,
      },
      {
        id: "L2",
        x: 0,
        y: 2,
      },
      {
        id: "R0",
        x: 2.4,
        y: 0,
      },
      {
        id: "R1",
        x: 2.4,
        y: 1,
      },
      {
        id: "R2",
        x: 2.4,
        y: 2,
      },
    ],
    edges: [
      {
        from: "L0",
        to: "R0",
      },
      {
        from: "L0",
        to: "R1",
        bend: -0.15,
      },
      {
        from: "L1",
        to: "R0",
        bend: 0.15,
      },
      {
        from: "L2",
        to: "R0",
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 준비",
      text: "간선 목록을 왼쪽 정점별로 나눠 이웃 목록을 만들고, 짝 배열을 전부 -1 로, 방문 배열을 전부 거짓으로 둡니다. 아직 짝을 지은 간선이 없습니다.",
      nodes: [
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [{}, {}, {}, {}],
      strips: [
        {
          label: "seen",
          values: ["F", "F", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 3,
        },
      ],
      calc: null,
      vars: "size = 0 · 이웃 자리 읽기 0",
    },
    {
      title: "T2 L0 에서 탐색을 시작한다",
      text: "바깥 반복이 L0 을 잡습니다. 방문 배열을 전부 거짓으로 다시 채우고 증가 경로 탐색에 들어갑니다.",
      nodes: [
        {
          value: "짝 없음",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [{}, {}, {}, {}],
      strips: [
        {
          label: "seen",
          values: ["F", "F", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "seen.fill(false) →",
        result: "[F, F, F]",
      },
      vars: "size = 0 · 이웃 자리 읽기 0",
    },
    {
      title: "T3 L0 이 빈 R0 을 받는다",
      text: "R0 이 아직 안 본 자리이고 짝이 없습니다. 증가 경로의 끝이라 matchR[0] 에 0 을 적고 참을 돌려줍니다.",
      nodes: [
        {
          value: "짝 R0",
          state: "focus",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L0",
          state: "focus",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
          states: {
            "0": "focus",
          },
        },
        {
          label: "호출 스택",
          values: ["L0"],
          slots: 3,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "matchR[0] =",
        result: "0",
      },
      vars: "size = 0 · 이웃 자리 읽기 1",
    },
    {
      title: "T4 L1 에서 탐색을 시작한다",
      text: "바깥 반복이 L1 을 잡습니다. 방문 배열을 전부 거짓으로 다시 채우고 증가 경로 탐색에 들어갑니다.",
      nodes: [
        {
          value: "짝 R0",
        },
        {
          value: "짝 없음",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["F", "F", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "seen.fill(false) →",
        result: "[F, F, F]",
      },
      vars: "size = 1 · 이웃 자리 읽기 1",
    },
    {
      title: "T5 R0 의 짝 L0 으로 내려간다",
      text: "R0 이 아직 안 본 자리라 방문 배열에 적습니다. 짝 L0 이 있으니, L0 이 다른 오른쪽 정점으로 옮겨 갈 수 있는지 같은 탐색을 한 번 더 부릅니다.",
      nodes: [
        {
          value: "짝 R0",
          state: "read",
        },
        {
          value: "짝 없음",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L0",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {},
        {
          state: "read",
        },
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
          states: {
            "0": "focus",
          },
        },
        {
          label: "호출 스택",
          values: ["L1"],
          slots: 3,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "augment(matchR[0]) = augment(",
        result: "0)",
      },
      vars: "size = 1 · 이웃 자리 읽기 2",
    },
    {
      title: "T6 L0 이 이미 본 R0 을 넘긴다",
      text: "R0 은 이번 탐색이 이미 본 자리라 다시 보지 않고 다음 이웃으로 갑니다.",
      nodes: [
        {
          value: "짝 R0",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L0",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
          states: {
            "0": "read",
          },
        },
        {
          label: "호출 스택",
          values: ["L1", "L0"],
          slots: 3,
          states: {
            "1": "read",
          },
        },
      ],
      calc: {
        expr: "seen[0] =",
        result: "true",
      },
      vars: "size = 1 · 이웃 자리 읽기 3",
    },
    {
      title: "T7 L0 이 빈 R1 을 받는다",
      text: "R1 이 아직 안 본 자리이고 짝이 없습니다. 증가 경로의 끝이라 matchR[1] 에 0 을 적고 참을 돌려줍니다.",
      nodes: [
        {
          value: "짝 R0·R1",
          state: "focus",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 L0",
          state: "focus",
        },
        {
          value: "짝 없음",
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
        {},
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "T", "F"],
          slots: 3,
          states: {
            "1": "focus",
          },
        },
        {
          label: "호출 스택",
          values: ["L1", "L0"],
          slots: 3,
          states: {
            "1": "read",
          },
        },
      ],
      calc: {
        expr: "matchR[1] =",
        result: "0",
      },
      vars: "size = 1 · 이웃 자리 읽기 4",
    },
    {
      title: "T8 L0 이 옮겨 가고 L1 이 R0 을 받는다",
      text: "안쪽 탐색이 참을 돌려줬습니다. L0 이 다른 자리를 받았으니 matchR[0] = 1 로 고쳐 적습니다.",
      nodes: [
        {
          value: "짝 R1",
        },
        {
          value: "짝 R0",
          state: "focus",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L1",
          state: "focus",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "T", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: ["L1"],
          slots: 3,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "matchR[0] =",
        result: "1",
      },
      vars: "size = 1 · 이웃 자리 읽기 4",
    },
    {
      title: "T9 L2 에서 탐색을 시작한다",
      text: "바깥 반복이 L2 를 잡습니다. 방문 배열을 전부 거짓으로 다시 채우고 증가 경로 탐색에 들어갑니다.",
      nodes: [
        {
          value: "짝 R1",
        },
        {
          value: "짝 R0",
        },
        {
          value: "짝 없음",
          state: "read",
        },
        {
          value: "짝 L1",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
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
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["F", "F", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "seen.fill(false) →",
        result: "[F, F, F]",
      },
      vars: "size = 2 · 이웃 자리 읽기 4",
    },
    {
      title: "T10 R0 의 짝 L1 로 내려간다",
      text: "R0 이 아직 안 본 자리라 방문 배열에 적습니다. 짝 L1 이 있으니, L1 이 다른 오른쪽 정점으로 옮겨 갈 수 있는지 같은 탐색을 한 번 더 부릅니다.",
      nodes: [
        {
          value: "짝 R1",
        },
        {
          value: "짝 R0",
          state: "read",
        },
        {
          value: "짝 없음",
          state: "read",
        },
        {
          value: "짝 L1",
          state: "read",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
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
          state: "read",
        },
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
          states: {
            "0": "focus",
          },
        },
        {
          label: "호출 스택",
          values: ["L2"],
          slots: 3,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "augment(matchR[0]) = augment(",
        result: "1)",
      },
      vars: "size = 2 · 이웃 자리 읽기 5",
    },
    {
      title: "T11 L1 이 이미 본 R0 을 넘긴다",
      text: "R0 은 이번 탐색이 이미 본 자리라 다시 보지 않고 다음 이웃으로 갑니다.",
      nodes: [
        {
          value: "짝 R1",
        },
        {
          value: "짝 R0",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L1",
          state: "read",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
          states: {
            "0": "read",
          },
        },
        {
          label: "호출 스택",
          values: ["L2", "L1"],
          slots: 3,
          states: {
            "1": "read",
          },
        },
      ],
      calc: {
        expr: "seen[0] =",
        result: "true",
      },
      vars: "size = 2 · 이웃 자리 읽기 6",
    },
    {
      title: "T12 L1 의 탐색이 실패한다",
      text: "L1 의 이웃을 다 봤는데 빈 오른쪽 정점에 도달하지 못했습니다. 아무것도 적지 않고 거짓을 돌려줍니다.",
      nodes: [
        {
          value: "짝 R1",
        },
        {
          value: "짝 R0",
          state: "read",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L1",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
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
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: ["L2", "L1"],
          slots: 3,
          states: {
            "1": "read",
          },
        },
      ],
      calc: {
        expr: "augment(1) =",
        result: "false",
      },
      vars: "size = 2 · 이웃 자리 읽기 6",
    },
    {
      title: "T13 L2 의 탐색이 실패한다",
      text: "L2 의 이웃을 다 봤는데 빈 오른쪽 정점에 도달하지 못했습니다. 아무것도 적지 않고 거짓을 돌려줍니다.",
      nodes: [
        {
          value: "짝 R1",
        },
        {
          value: "짝 R0",
        },
        {
          value: "짝 없음",
          state: "read",
        },
        {
          value: "짝 L1",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
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
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: ["L2"],
          slots: 3,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "augment(2) =",
        result: "false",
      },
      vars: "size = 2 · 이웃 자리 읽기 6",
    },
    {
      title: "T14 반환",
      text: "왼쪽 정점을 다 봤습니다. 성공한 탐색의 수 2 가 매칭의 크기이고, 그것을 돌려줍니다.",
      nodes: [
        {
          value: "짝 R1",
        },
        {
          value: "짝 R0",
        },
        {
          value: "짝 없음",
        },
        {
          value: "짝 L1",
        },
        {
          value: "짝 L0",
        },
        {
          value: "짝 없음",
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
        {},
      ],
      strips: [
        {
          label: "seen",
          values: ["T", "F", "F"],
          slots: 3,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "size =",
        result: "2",
      },
      vars: "size = 2 · 이웃 자리 읽기 6",
    },
  ],
};
