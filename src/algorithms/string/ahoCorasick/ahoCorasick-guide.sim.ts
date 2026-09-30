/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 텍스트 `ushers` 에서
 * 패턴 `he` · `she` · `hers` 를 찾는 아홉 걸음이고, 프레임 제목은 원고의 걸음 번호(`T#`)로 연다 — P3 이
 * 그 자리를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대로 그리는 아호–코라식 자동자(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 트라이 가이드와 같이 그래프 무대에 나무 모양 자리를 준다.
 *
 * 1. **자리(`layout`)는 전개 입력의 자동자 전체다.** 노드 여덟과 간선 열다섯 — 트라이의 간선 일곱(굵은
 *    실선), 실패 링크 일곱(대시), 출력 링크 하나(짧은 점선)를 첫 걸음부터 둔다. 아직 안 매긴 링크는
 *    `state: "out"`(흐린 선)이다. 자리는 그림 사이드카가 부모 관계에서 `treeLayout` 으로 냈다.
 * 2. **노드 이름은 경로 문자열**(뿌리만 「뿌리」)이고, 값 칸에는 그 노드에서 끝나는 패턴 번호를 적는다.
 *    글자는 트라이 간선의 라벨이다.
 * 3. **강조는 둘뿐이다** — 이번 걸음에 옮겨 간 노드(만드는 걸음이면 만든 것 전부)는 새로 씀(`focus`),
 *    이번 걸음에 거친 노드와 간선(떠난 노드 · 물려받은 칸을 정한 실패 링크 · 출력 링크 사슬)은
 *    읽음(`read`).
 * 4. **무대 아래 띠 둘** — 텍스트(이번에 읽은 글자는 읽음, 아직 안 읽은 글자는 이번 걸음 밖)와 찾은
 *    매칭(이번 걸음에 더해진 것은 새로 씀). 매칭 띠의 칸 수는 전개 입력의 매칭 수로 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 증명 사이드카의 걸음
 * 기록(정본과 같은 자동자를 가리키는지 스스로 확인한다)에서 낸 결과를 옮긴 것이고, 둘이 같은지는
 * `ahoCorasick-guide.test.ts` 가 잰다.
 *
 * 2026-09-30 전개(`KAN-058`)에서 옛 패널(`view: ["keyValue", "tree"]`)을 무대 패널로 옮겼다. 옛 머리
 * 주석이 기대던 트라이 편의 「keyValue + tree 조합」 규약은 트라이 편이 무대 패널로 옮기며 없어졌다.
 */
export const acScan = {
  player: "stage",
  stage: "graph",
  title: "ushers 여섯 글자에서 he · she · hers 를 한 번에 찾는다",
  sub: "T1–T9 · 만들기 두 걸음 · 글자마다 한 걸음 · 반환 한 걸음",
  result: "[{1,1},{0,2},{2,2}]",
  layout: {
    nodes: [
      {
        id: "root",
        x: 1,
        y: 0,
        label: "뿌리",
      },
      {
        id: "h",
        x: 0,
        y: 1,
        label: "h",
      },
      {
        id: "he",
        x: 0,
        y: 2,
        label: "he",
      },
      {
        id: "s",
        x: 2,
        y: 1,
        label: "s",
      },
      {
        id: "sh",
        x: 2,
        y: 2,
        label: "sh",
      },
      {
        id: "she",
        x: 2,
        y: 3,
        label: "she",
      },
      {
        id: "her",
        x: 0,
        y: 3,
        label: "her",
      },
      {
        id: "hers",
        x: 0,
        y: 4,
        label: "hers",
      },
    ],
    edges: [
      {
        from: "root",
        to: "h",
      },
      {
        from: "h",
        to: "he",
      },
      {
        from: "root",
        to: "s",
      },
      {
        from: "s",
        to: "sh",
      },
      {
        from: "sh",
        to: "she",
      },
      {
        from: "he",
        to: "her",
      },
      {
        from: "her",
        to: "hers",
      },
      {
        from: "h",
        to: "root",
        bend: 0.35,
      },
      {
        from: "he",
        to: "root",
        bend: -0.25,
      },
      {
        from: "s",
        to: "root",
        bend: 0.35,
      },
      {
        from: "sh",
        to: "h",
        bend: 0.12,
      },
      {
        from: "she",
        to: "he",
        bend: 0.12,
      },
      {
        from: "her",
        to: "root",
        bend: -0.25,
      },
      {
        from: "hers",
        to: "s",
        bend: 0.12,
      },
      {
        from: "she",
        to: "he",
        bend: -0.3,
      },
    ],
    unit: {
      x: 96,
      y: 78,
    },
  },
  steps: [
    {
      title: "T1 패턴 셋을 트라이에 담는다",
      text: "he · she · hers 를 트라이 하나에 담았습니다. he 와 hers 가 앞 두 글자를 함께 써서 노드는 뿌리를 포함해 8 개입니다. 흐린 대시와 점선은 다음 걸음에 매길 실패 링크와 출력 링크 자리입니다.",
      nodes: [
        {
          value: "",
          state: "focus",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "끝 0 번",
          state: "focus",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "끝 1 번",
          state: "focus",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "끝 2 번",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
          state: "focus",
        },
        {
          kind: "tree",
          label: "e",
          state: "focus",
        },
        {
          kind: "tree",
          label: "s",
          state: "focus",
        },
        {
          kind: "tree",
          label: "h",
          state: "focus",
        },
        {
          kind: "tree",
          label: "e",
          state: "focus",
        },
        {
          kind: "tree",
          label: "r",
          state: "focus",
        },
        {
          kind: "tree",
          label: "s",
          state: "focus",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "cross",
          state: "out",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
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
          label: "찾은 매칭",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "노드 수 =",
        result: "8",
      },
      vars: null,
    },
    {
      title: "T2 링크와 전이표를 채운다",
      text: "얕은 노드부터 실패 링크를 매겼습니다. 뿌리가 아닌 곳을 가리키는 링크는 sh → h · she → he · hers → s 이고, 출력 링크는 she → he 하나입니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
        },
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 1 번",
        },
        {
          value: "",
        },
        {
          value: "끝 2 번",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "r",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "cross",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
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
          label: "찾은 매칭",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "link[she] = next[h][e] =",
        result: "he",
      },
      vars: null,
    },
    {
      title: "T3 자리 0 의 글자 u",
      text: "뿌리의 u 칸이 뿌리라 뿌리에 머뭅니다. 이 자리에서 끝나는 패턴은 없습니다.",
      nodes: [
        {
          value: "",
          state: "focus",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
        },
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 1 번",
        },
        {
          value: "",
        },
        {
          value: "끝 2 번",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "r",
        },
        {
          kind: "tree",
          label: "s",
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
          kind: "cross",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
          states: {
            "0": "read",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
          },
        },
        {
          label: "찾은 매칭",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "next[뿌리][u] =",
        result: "뿌리",
      },
      vars: null,
    },
    {
      title: "T4 자리 1 의 글자 s",
      text: "뿌리에 s 자식이 있어 s 노드로 내려갑니다. 이 자리에서 끝나는 패턴은 없습니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "",
        },
        {
          value: "끝 1 번",
        },
        {
          value: "",
        },
        {
          value: "끝 2 번",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
          state: "read",
        },
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "r",
        },
        {
          kind: "tree",
          label: "s",
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
          kind: "cross",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
          states: {
            "1": "read",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
          },
        },
        {
          label: "찾은 매칭",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "next[뿌리][s] =",
        result: "s",
      },
      vars: null,
    },
    {
      title: "T5 자리 2 의 글자 h",
      text: "s 노드에 h 자식이 있어 sh 노드로 내려갑니다. 이 자리에서 끝나는 패턴은 없습니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "끝 1 번",
        },
        {
          value: "",
        },
        {
          value: "끝 2 번",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "tree",
          label: "h",
          state: "read",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "r",
        },
        {
          kind: "tree",
          label: "s",
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
          kind: "cross",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
          states: {
            "2": "read",
            "3": "out",
            "4": "out",
            "5": "out",
          },
        },
        {
          label: "찾은 매칭",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "next[s][h] =",
        result: "sh",
      },
      vars: null,
    },
    {
      title: "T6 자리 3 의 글자 e",
      text: "sh 노드에 e 자식이 있어 she 노드로 내려갑니다. 출력 링크를 따라 she → he 에서 매칭 1@1 0@2 를 거둡니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
          state: "read",
        },
        {
          value: "",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 1 번",
          state: "focus",
        },
        {
          value: "",
        },
        {
          value: "끝 2 번",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
          state: "read",
        },
        {
          kind: "tree",
          label: "r",
        },
        {
          kind: "tree",
          label: "s",
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
          kind: "cross",
          state: "read",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
          states: {
            "3": "read",
            "4": "out",
            "5": "out",
          },
        },
        {
          label: "찾은 매칭",
          values: ["1@1", "0@2"],
          slots: 3,
          states: {
            "0": "focus",
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "next[sh][e] =",
        result: "she",
      },
      vars: null,
    },
    {
      title: "T7 자리 4 의 글자 r",
      text: "she 노드에는 r 자식이 없고, 그 칸에는 실패 링크 he 에서 물려받은 her 노드가 적혀 있습니다. 이 자리에서 끝나는 패턴은 없습니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
          state: "read",
        },
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 1 번",
          state: "read",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "끝 2 번",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "r",
          state: "read",
        },
        {
          kind: "tree",
          label: "s",
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
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
        {
          kind: "cross",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
          states: {
            "4": "read",
            "5": "out",
          },
        },
        {
          label: "찾은 매칭",
          values: ["1@1", "0@2"],
          slots: 3,
        },
      ],
      calc: {
        expr: "next[she][r] =",
        result: "her",
      },
      vars: null,
    },
    {
      title: "T8 자리 5 의 글자 s",
      text: "her 노드에 s 자식이 있어 hers 노드로 내려갑니다. hers 노드에서 패턴이 끝나 매칭 2@2 를 거둡니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
        },
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 1 번",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 2 번",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "r",
        },
        {
          kind: "tree",
          label: "s",
          state: "read",
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
          kind: "cross",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
          states: {
            "5": "read",
          },
        },
        {
          label: "찾은 매칭",
          values: ["1@1", "0@2", "2@2"],
          slots: 3,
          states: {
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "next[her][s] =",
        result: "hers",
      },
      vars: null,
    },
    {
      title: "T9 시작 자리 순서로 맞춘다",
      text: "찾은 차례는 끝난 자리의 차례였습니다. 시작 자리 순서로 맞춰 1@1 0@2 2@2 를 돌려줍니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 0 번",
        },
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 1 번",
        },
        {
          value: "",
        },
        {
          value: "끝 2 번",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "s",
        },
        {
          kind: "tree",
          label: "h",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "r",
        },
        {
          kind: "tree",
          label: "s",
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
          kind: "cross",
        },
      ],
      strips: [
        {
          label: "텍스트",
          values: ["u", "s", "h", "e", "r", "s"],
        },
        {
          label: "돌려주는 매칭",
          values: ["1@1", "0@2", "2@2"],
          slots: 3,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "found.sort(byPosition) =",
        result: "1@1 0@2 2@2",
      },
      vars: null,
    },
  ],
};
