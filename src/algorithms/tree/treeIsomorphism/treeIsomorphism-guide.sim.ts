/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 이웃 목록 만들기가 한 걸음, 트리 하나의 잎 한
 * 겹을 벗기는 일 · 중심 개수 비교 · 뿌리 하나에서 방문 차례를 적는 일 · 정점 하나에 모양 번호를 주는 일 ·
 * 마지막 비교가 각각 한 걸음이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 두 트리의 정점과 간선 자리(`layout`)는 패널에 한 번만 적는다 — 트리마다 중심을 맨 위
 * 줄에 두고 그 아래로 매단 자리이고, 정점 이름은 `A0`…`B7` 이다. 걸음마다 정점 안 값(잎을 벗기는 동안은 남은
 * 차수 · 벗긴 바퀴 · 중심, 번호를 매기는 동안은 그 뿌리에서 받은 모양 번호)과 상태, 간선의 모양과 상태, 무대
 * 아래 띠 셋(`order` · 열쇠 · 모양 번호)만 바꾼다(`src/_viz/player/graphStage.ts`).
 *
 * 벗기는 걸음에서는 이번 바퀴에 벗긴 잎이 읽음, 차수가 줄어든 이웃이 새로 씀, 앞 바퀴에 벗긴 정점이 이번 걸음
 * 밖이다. 번호를 매기는 걸음에서는 번호를 받은 정점이 새로 씀, 그 자식과 둘을 잇는 간선이 읽음, 아직 번호가
 * 없는 정점이 점선(아직)이고, 다른 트리는 이번 걸음 밖이다. 띠에서는 읽은 `order` 자리가 읽음, 찾은 열쇠가
 * 읽음(있던 열쇠) 또는 새로 씀(새 열쇠)이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `treeIsomorphism-guide.test.ts` 가 잰다.
 */
export const isoWalk = {
  player: "stage",
  stage: "graph",
  title:
    "treeIsomorphism(8, [[0,1],[0,6],[1,2],[1,7],[2,3],[3,4],[3,5]], [[0,1],[0,6],[2,6],[3,4],[3,5],[3,7],[6,7]]) — 정점 안은 남은 차수 · 벗긴 바퀴 · 모양 번호, 무대 아래 띠는 order 와 모양 번호표",
  sub: "T1–T34 · 걸음마다 잎 한 겹을 벗기거나, 방문 차례를 적거나, 정점 하나에 모양 번호를 준다",
  result: "true",
  layout: {
    nodes: [
      {
        id: "A0",
        x: 2,
        y: 1,
        label: "0",
      },
      {
        id: "A1",
        x: 2.5,
        y: 0,
        label: "1",
      },
      {
        id: "A2",
        x: 0.5,
        y: 0,
        label: "2",
      },
      {
        id: "A3",
        x: 0.5,
        y: 1,
        label: "3",
      },
      {
        id: "A4",
        x: 0,
        y: 2,
        label: "4",
      },
      {
        id: "A5",
        x: 1,
        y: 2,
        label: "5",
      },
      {
        id: "A6",
        x: 2,
        y: 2,
        label: "6",
      },
      {
        id: "A7",
        x: 3,
        y: 1,
        label: "7",
      },
      {
        id: "B0",
        x: 4.4,
        y: 1,
        label: "0",
      },
      {
        id: "B1",
        x: 4.4,
        y: 2,
        label: "1",
      },
      {
        id: "B2",
        x: 5.4,
        y: 1,
        label: "2",
      },
      {
        id: "B3",
        x: 6.9,
        y: 1,
        label: "3",
      },
      {
        id: "B4",
        x: 6.4,
        y: 2,
        label: "4",
      },
      {
        id: "B5",
        x: 7.4,
        y: 2,
        label: "5",
      },
      {
        id: "B6",
        x: 4.9,
        y: 0,
        label: "6",
      },
      {
        id: "B7",
        x: 6.9,
        y: 0,
        label: "7",
      },
    ],
    edges: [
      {
        from: "A0",
        to: "A1",
      },
      {
        from: "A0",
        to: "A6",
      },
      {
        from: "A1",
        to: "A2",
      },
      {
        from: "A1",
        to: "A7",
      },
      {
        from: "A2",
        to: "A3",
      },
      {
        from: "A3",
        to: "A4",
      },
      {
        from: "A3",
        to: "A5",
      },
      {
        from: "B0",
        to: "B1",
      },
      {
        from: "B0",
        to: "B6",
      },
      {
        from: "B2",
        to: "B6",
      },
      {
        from: "B3",
        to: "B4",
      },
      {
        from: "B3",
        to: "B5",
      },
      {
        from: "B3",
        to: "B7",
      },
      {
        from: "B6",
        to: "B7",
      },
    ],
    directed: false,
    unit: {
      x: 84,
      y: 84,
    },
  },
  steps: [
    {
      title: "T1 두 트리의 간선 목록을 이웃 목록으로 옮긴다 ①",
      text: "간선 7 개씩을 양쪽 정점의 이웃 목록에 넣었습니다. 정점 안의 수가 목록 길이, 곧 차수입니다.",
      nodes: [
        {
          value: "차수 2",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 2",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 2",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 2",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 8,
        },
        {
          label: "열쇠",
          values: [],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "link 항목 수의 합 =",
        result: "A 14 · B 14",
      },
      vars: null,
    },
    {
      title: "T2 A 의 잎 4 · 5 · 6 · 7 을 벗긴다 ②",
      text: "A 에서 차수 1 인 4 · 5 · 6 · 7 을 한꺼번에 벗기고, 이웃 3 · 0 · 1 의 차수를 하나씩 줄였습니다. 차수가 1 이 된 3 · 0 이 다음 바퀴의 잎입니다.",
      nodes: [
        {
          value: "차수 1",
          state: "focus",
        },
        {
          value: "차수 2",
          state: "focus",
        },
        {
          value: "차수 2",
        },
        {
          value: "차수 1",
          state: "focus",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "차수 2",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 2",
        },
      ],
      edges: [
        {},
        {
          state: "read",
        },
        {},
        {
          state: "read",
        },
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 8,
        },
        {
          label: "열쇠",
          values: [],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "alive = 8 − 4 =",
        result: "4",
      },
      vars: null,
    },
    {
      title: "T3 A 의 잎 3 · 0 을 벗긴다 ②",
      text: "A 에서 차수 1 인 3 · 0 을 한꺼번에 벗기고, 이웃 2 · 1 의 차수를 하나씩 줄였습니다. 남은 정점이 2 개라 반복이 끝나고, 남은 2 · 1 이 중심입니다.",
      nodes: [
        {
          value: "벗김 2",
          state: "read",
        },
        {
          value: "중심",
          state: "read",
        },
        {
          value: "중심",
          state: "read",
        },
        {
          value: "벗김 2",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "차수 2",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 1",
        },
        {
          value: "차수 3",
        },
        {
          value: "차수 2",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
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
          state: "read",
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 8,
        },
        {
          label: "열쇠",
          values: [],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "alive = 4 − 2 =",
        result: "2",
      },
      vars: null,
    },
    {
      title: "T4 B 의 잎 1 · 2 · 4 · 5 를 벗긴다 ②",
      text: "B 에서 차수 1 인 1 · 2 · 4 · 5 를 한꺼번에 벗기고, 이웃 0 · 6 · 3 의 차수를 하나씩 줄였습니다. 차수가 1 이 된 0 · 3 이 다음 바퀴의 잎입니다.",
      nodes: [
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "중심",
        },
        {
          value: "중심",
        },
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "차수 1",
          state: "focus",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "차수 1",
          state: "focus",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "read",
        },
        {
          value: "차수 2",
          state: "focus",
        },
        {
          value: "차수 2",
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
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 8,
        },
        {
          label: "열쇠",
          values: [],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "alive = 8 − 4 =",
        result: "4",
      },
      vars: null,
    },
    {
      title: "T5 B 의 잎 0 · 3 을 벗긴다 ②",
      text: "B 에서 차수 1 인 0 · 3 을 한꺼번에 벗기고, 이웃 6 · 7 의 차수를 하나씩 줄였습니다. 남은 정점이 2 개라 반복이 끝나고, 남은 6 · 7 이 중심입니다.",
      nodes: [
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "중심",
        },
        {
          value: "중심",
        },
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 2",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 2",
          state: "read",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "중심",
          state: "read",
        },
        {
          value: "중심",
          state: "read",
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
          state: "read",
        },
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 8,
        },
        {
          label: "열쇠",
          values: [],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "alive = 4 − 2 =",
        result: "2",
      },
      vars: null,
    },
    {
      title: "T6 두 트리의 중심 개수를 비교한다 ⑦",
      text: "두 트리 다 중심이 2 개라 이른 반환을 타지 않고 번호 매기기로 갑니다.",
      nodes: [
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "중심",
          state: "read",
        },
        {
          value: "중심",
          state: "read",
        },
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 2",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "벗김 1",
          state: "out",
        },
        {
          value: "중심",
          state: "read",
        },
        {
          value: "중심",
          state: "read",
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
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 8,
        },
        {
          label: "열쇠",
          values: [],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "root1.length !== root2.length → 2 !== 2 =",
        result: "false",
      },
      vars: null,
    },
    {
      title: "T7 B 를 정점 6 에 매달고 방문 차례를 적는다 ⑧③",
      text: "모양 번호표를 비어 있는 채로 만들고, B 를 정점 6 에 매달아 부모가 자식보다 앞에 오는 방문 차례를 적었습니다. 번호는 이 차례를 뒤에서부터 읽으며 줍니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "read",
        },
        {
          value: "—",
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
        {
          kind: "tree",
          state: "focus",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
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
          slots: 8,
        },
        {
          label: "열쇠",
          values: [],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "order =",
        result: "[6, 0, 2, 7, 1, 3, 4, 5]",
      },
      vars: null,
    },
    {
      title: "T8 B 의 정점 5 에 모양 번호를 준다 ④⑤⑥",
      text: "order[7] = 5 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 없던 열쇠라 새 번호 0 을 줬습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "7": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""'],
          states: {
            "0": "focus",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0 (새로)",
      },
      vars: null,
    },
    {
      title: "T9 B 의 정점 4 에 모양 번호를 준다 ④⑤⑥",
      text: "order[6] = 4 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "6": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""'],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: null,
    },
    {
      title: "T10 B 의 정점 3 에 모양 번호를 준다 ④⑤⑥",
      text: "order[5] = 3 입니다. 자식 번호 [0, 0] 을 정렬해 열쇠 0,0 을 만들었습니다. 표에 없던 열쇠라 새 번호 1 을 줬습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 1",
          state: "focus",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
          state: "read",
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
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "5": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0"],
          states: {
            "1": "focus",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1],
          states: {
            "1": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0,0") →',
        result: "1 (새로)",
      },
      vars: null,
    },
    {
      title: "T11 B 의 정점 1 에 모양 번호를 준다 ④⑤⑥",
      text: "order[4] = 1 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 1",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "4": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: null,
    },
    {
      title: "T12 B 의 정점 7 에 모양 번호를 준다 ④⑤⑥",
      text: "order[3] = 7 입니다. 자식 번호 [1] 을 정렬해 열쇠 1 을 만들었습니다. 표에 없던 열쇠라 새 번호 2 를 줬습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 1",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 2",
          state: "focus",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "3": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1"],
          states: {
            "2": "focus",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2],
          states: {
            "2": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("1") →',
        result: "2 (새로)",
      },
      vars: null,
    },
    {
      title: "T13 B 의 정점 2 에 모양 번호를 준다 ④⑤⑥",
      text: "order[2] = 2 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "번호 1",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 2",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "2": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: null,
    },
    {
      title: "T14 B 의 정점 0 에 모양 번호를 준다 ④⑤⑥",
      text: "order[1] = 0 입니다. 자식 번호 [0] 을 정렬해 열쇠 0 을 만들었습니다. 표에 없던 열쇠라 새 번호 3 을 줬습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
          state: "focus",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 1",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 2",
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
          kind: "tree",
          state: "read",
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
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "1": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0"],
          states: {
            "3": "focus",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3],
          states: {
            "3": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0") →',
        result: "3 (새로)",
      },
      vars: null,
    },
    {
      title: "T15 B 의 정점 6 에 모양 번호를 준다 ④⑤⑥",
      text: "order[0] = 6 입니다. 자식 번호 [3, 0, 2] 을 정렬해 열쇠 0,2,3 을 만들었습니다. 표에 없던 열쇠라 새 번호 4 를 줬습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 1",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 4",
          state: "focus",
        },
        {
          value: "번호 2",
          state: "read",
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
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
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
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [6, 0, 2, 7, 1, 3, 4, 5],
          states: {
            "0": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3"],
          states: {
            "4": "focus",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4],
          states: {
            "4": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0,2,3") →',
        result: "4 (새로)",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T16 B 를 정점 7 에 매달고 방문 차례를 적는다 ③",
      text: "모양 번호표는 그대로 두고, B 를 정점 7 에 매달아 부모가 자식보다 앞에 오는 방문 차례를 적었습니다. 번호는 이 차례를 뒤에서부터 읽으며 줍니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "read",
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
        {
          kind: "tree",
          state: "focus",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
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
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3"],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "order =",
        result: "[7, 3, 6, 4, 5, 0, 2, 1]",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T17 B 의 정점 1 에 모양 번호를 준다 ④⑤⑥",
      text: "order[7] = 1 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "7": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T18 B 의 정점 2 에 모양 번호를 준다 ④⑤⑥",
      text: "order[6] = 2 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "6": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T19 B 의 정점 0 에 모양 번호를 준다 ④⑤⑥",
      text: "order[5] = 0 입니다. 자식 번호 [0] 을 정렬해 열쇠 0 을 만들었습니다. 표에 있던 열쇠라 번호 3 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
          state: "focus",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
          kind: "tree",
          state: "read",
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
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "5": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3"],
          states: {
            "3": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4],
          states: {
            "3": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0") →',
        result: "3",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T20 B 의 정점 5 에 모양 번호를 준다 ④⑤⑥",
      text: "order[4] = 5 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "4": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T21 B 의 정점 4 에 모양 번호를 준다 ④⑤⑥",
      text: "order[3] = 4 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "3": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T22 B 의 정점 6 에 모양 번호를 준다 ④⑤⑥",
      text: "order[2] = 6 입니다. 자식 번호 [3, 0] 을 정렬해 열쇠 0,3 을 만들었습니다. 표에 없던 열쇠라 새 번호 5 를 줬습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 5",
          state: "focus",
        },
        {
          value: "—",
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
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
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
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "2": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3"],
          states: {
            "5": "focus",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5],
          states: {
            "5": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0,3") →',
        result: "5 (새로)",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T23 B 의 정점 3 에 모양 번호를 준다 ④⑤⑥",
      text: "order[1] = 3 입니다. 자식 번호 [0, 0] 을 정렬해 열쇠 0,0 을 만들었습니다. 표에 있던 열쇠라 번호 1 을 그대로 받았습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 1",
          state: "focus",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 5",
        },
        {
          value: "—",
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
        },
        {
          kind: "tree",
          state: "read",
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
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "1": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3"],
          states: {
            "1": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5],
          states: {
            "1": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0,0") →',
        result: "1",
      },
      vars: "B 의 중심 번호 [4]",
    },
    {
      title: "T24 B 의 정점 7 에 모양 번호를 준다 ④⑤⑥",
      text: "order[0] = 7 입니다. 자식 번호 [1, 5] 을 정렬해 열쇠 1,5 를 만들었습니다. 표에 없던 열쇠라 새 번호 6 을 줬습니다.",
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
          state: "out",
        },
        {
          state: "out",
        },
        {
          value: "번호 3",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 1",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 5",
          state: "read",
        },
        {
          value: "번호 6",
          state: "focus",
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
        },
        {
          kind: "tree",
          state: "read",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [7, 3, 6, 4, 5, 0, 2, 1],
          states: {
            "0": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "6": "focus",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "6": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("1,5") →',
        result: "6 (새로)",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T25 A 를 정점 2 에 매달고 방문 차례를 적는다 ③",
      text: "모양 번호표는 그대로 두고, A 를 정점 2 에 매달아 부모가 자식보다 앞에 오는 방문 차례를 적었습니다. 번호는 이 차례를 뒤에서부터 읽으며 줍니다.",
      nodes: [
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "read",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
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
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "order =",
        result: "[2, 1, 3, 0, 7, 4, 5, 6]",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T26 A 의 정점 6 에 모양 번호를 준다 ④⑤⑥",
      text: "order[7] = 6 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
      nodes: [
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "7": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T27 A 의 정점 5 에 모양 번호를 준다 ④⑤⑥",
      text: "order[6] = 5 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
      nodes: [
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "6": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T28 A 의 정점 4 에 모양 번호를 준다 ④⑤⑥",
      text: "order[5] = 4 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
      nodes: [
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
          state: "focus",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "—",
          state: "empty",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "5": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T29 A 의 정점 7 에 모양 번호를 준다 ④⑤⑥",
      text: "order[4] = 7 입니다. 자식이 없어 열쇠가 빈 문자열입니다. 표에 있던 열쇠라 번호 0 을 그대로 받았습니다.",
      nodes: [
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "4": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "0": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "0": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("") →',
        result: "0",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T30 A 의 정점 0 에 모양 번호를 준다 ④⑤⑥",
      text: "order[3] = 0 입니다. 자식 번호 [0] 을 정렬해 열쇠 0 을 만들었습니다. 표에 있던 열쇠라 번호 3 을 그대로 받았습니다.",
      nodes: [
        {
          value: "번호 3",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 0",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "3": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "3": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "3": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0") →',
        result: "3",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T31 A 의 정점 3 에 모양 번호를 준다 ④⑤⑥",
      text: "order[2] = 3 입니다. 자식 번호 [0, 0] 을 정렬해 열쇠 0,0 을 만들었습니다. 표에 있던 열쇠라 번호 1 을 그대로 받았습니다.",
      nodes: [
        {
          value: "번호 3",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 1",
          state: "focus",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 0",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
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
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "2": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "1": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "1": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0,0") →',
        result: "1",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T32 A 의 정점 1 에 모양 번호를 준다 ④⑤⑥",
      text: "order[1] = 1 입니다. 자식 번호 [3, 0] 을 정렬해 열쇠 0,3 을 만들었습니다. 표에 있던 열쇠라 번호 5 를 그대로 받았습니다.",
      nodes: [
        {
          value: "번호 3",
          state: "read",
        },
        {
          value: "번호 5",
          state: "focus",
        },
        {
          value: "—",
          state: "empty",
        },
        {
          value: "번호 1",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
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
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "1": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "5": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "5": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("0,3") →',
        result: "5",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T33 A 의 정점 2 에 모양 번호를 준다 ④⑤⑥",
      text: "order[0] = 2 입니다. 자식 번호 [5, 1] 을 정렬해 열쇠 1,5 를 만들었습니다. 표에 있던 열쇠라 번호 6 을 그대로 받았습니다.",
      nodes: [
        {
          value: "번호 3",
        },
        {
          value: "번호 5",
          state: "read",
        },
        {
          value: "번호 6",
          state: "focus",
        },
        {
          value: "번호 1",
          state: "read",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
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
          state: "read",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
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
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {
            "0": "read",
          },
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {
            "6": "read",
          },
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {
            "6": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: 'table.get("1,5") →',
        result: "6",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
    {
      title: "T34 A 의 뿌리 번호를 B 의 중심 번호와 비교한다 ⑨",
      text: "A 의 뿌리 2 가 받은 번호 6 이 B 의 중심 번호 [4, 6] 안에 있어 true 를 돌려줍니다.",
      nodes: [
        {
          value: "번호 3",
        },
        {
          value: "번호 5",
        },
        {
          value: "번호 6",
          state: "read",
        },
        {
          value: "번호 1",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
        },
        {
          value: "번호 0",
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
      groups: [
        {
          members: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
          label: "트리 A",
        },
        {
          members: ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7"],
          label: "트리 B",
        },
      ],
      strips: [
        {
          label: "order",
          values: [2, 1, 3, 0, 7, 4, 5, 6],
          states: {},
          slots: 8,
        },
        {
          label: "열쇠",
          values: ['""', "0,0", "1", "0", "0,2,3", "0,3", "1,5"],
          states: {},
          slots: 7,
        },
        {
          label: "모양 번호",
          values: [0, 1, 2, 3, 4, 5, 6],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "[4, 6].includes(6) =",
        result: "true",
      },
      vars: "B 의 중심 번호 [4, 6]",
    },
  ],
};
