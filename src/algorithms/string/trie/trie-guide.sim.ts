/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 단어 셋
 * (`app` · `apple` · `ape`)을 담고 네 번 묻는 열한 걸음이고, 프레임 제목은 원고의 걸음 번호(`T#`)로
 * 연다 — P3 이 그 자리를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대로 그리는 트라이(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 트리 전용 무대를 따로 만들지 않고 그래프 무대에 나무 모양 자리를 준다.
 *
 * 1. **자리(`layout`)는 완성된 트라이의 것이다.** 첫 걸음부터 노드 일곱의 자리를 두고, 아직 없는 노드는
 *    `state: "empty"`(점선), 아직 없는 간선은 `state: "out"`(흐린 선)으로 둔다. 자리는 그림 사이드카가
 *    부모 관계에서 `treeLayout` 으로 냈다.
 * 2. **노드 이름은 경로 문자열**(뿌리만 「뿌리」)이고, 값 칸에는 끝 표시가 참일 때만 「끝 표시」를 적는다.
 *    **글자는 간선의 라벨**이다 — 노드가 자기 글자를 들지 않는다는 것이 무대에서도 보인다.
 * 3. **강조는 둘뿐이다** — 이번 걸음에 만든 노드와 끝 표시를 참으로 둔 노드는 새로 씀(`focus`), 이번
 *    걸음에 지나간 노드와 간선은 읽음(`read`).
 * 4. **지금 읽는 글자는 무대 아래 띠**(`strips`)다. 이번 걸음에 읽은 글자는 읽음, 뒤에 남은 글자는
 *    이번 걸음 밖이다. 띠의 칸 수는 가장 긴 단어에 맞춰 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 증명 사이드카의
 * 걸음 기록(정본과 같은 트라이를 만드는지 스스로 확인한다)에서 낸 결과를 옮긴 것이고, 둘이 같은지는
 * `trie-guide.test.ts` 가 잰다.
 */
export const trieOps = {
  player: "stage",
  stage: "graph",
  title: "app · apple · ape 를 담고 네 번 묻는다",
  sub: "T1–T11 · 걸음마다 글자 묶음 하나 또는 조회 하나",
  result: "false",
  layout: {
    nodes: [
      {
        id: "root",
        x: 0.625,
        y: 0,
        label: "뿌리",
      },
      {
        id: "a",
        x: 0.625,
        y: 1,
        label: "a",
      },
      {
        id: "ap",
        x: 0.625,
        y: 2,
        label: "ap",
      },
      {
        id: "app",
        x: 0,
        y: 3,
        label: "app",
      },
      {
        id: "ape",
        x: 1.25,
        y: 3,
        label: "ape",
      },
      {
        id: "appl",
        x: 0,
        y: 4,
        label: "appl",
      },
      {
        id: "apple",
        x: 0,
        y: 5,
        label: "apple",
      },
    ],
    edges: [
      {
        from: "root",
        to: "a",
      },
      {
        from: "a",
        to: "ap",
      },
      {
        from: "ap",
        to: "app",
      },
      {
        from: "ap",
        to: "ape",
      },
      {
        from: "app",
        to: "appl",
      },
      {
        from: "appl",
        to: "apple",
      },
    ],
    unit: {
      x: 96,
      y: 78,
    },
  },
  steps: [
    {
      title: "T1 빈 트라이",
      text: "빈 트라이는 뿌리 하나입니다. 뿌리는 빈 문자열에 해당하는 노드이고, 점선 노드는 뒤 걸음에서 만들어질 자리입니다.",
      nodes: [
        {
          value: "",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
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
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: [],
          slots: 5,
        },
      ],
      calc: null,
      vars: "노드 수 1",
    },
    {
      title: 'T2 insert("app") 의 a — 만든다',
      text: "뿌리에서 a 로 가는 자식이 없어 a 노드를 새로 만듭니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
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
          label: "읽는 문자열",
          values: ["a", "p", "p"],
          slots: 5,
          states: {
            "0": "read",
            "1": "out",
            "2": "out",
          },
        },
      ],
      calc: {
        expr: 'get("a") =',
        result: "없음",
      },
      vars: "노드 수 2",
    },
    {
      title: 'T3 insert("app") 의 p — 만든다',
      text: "a 노드에서 p 로 가는 자식이 없어 ap 노드를 새로 만듭니다.",
      nodes: [
        {
          value: "",
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
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "tree",
          label: "p",
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
          label: "읽는 문자열",
          values: ["a", "p", "p"],
          slots: 5,
          states: {
            "1": "read",
            "2": "out",
          },
        },
      ],
      calc: {
        expr: 'get("p") =',
        result: "없음",
      },
      vars: "노드 수 3",
    },
    {
      title: 'T4 insert("app") 의 p — 만든다',
      text: "ap 노드에서 p 로 가는 자식이 없어 app 노드를 새로 만듭니다. 문자열이 끝나 app 노드의 끝 표시를 참으로 둡니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "tree",
          label: "p",
        },
        {
          kind: "tree",
          label: "p",
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
          label: "읽는 문자열",
          values: ["a", "p", "p"],
          slots: 5,
          states: {
            "2": "read",
          },
        },
      ],
      calc: {
        expr: 'get("p") =',
        result: "없음 · end = 참",
      },
      vars: "노드 수 4",
    },
    {
      title: 'T5 insert("apple") 의 app — 이어 쓴다',
      text: "뿌리에서 a · p · p 로 가는 자식이 이미 있어 새로 만들지 않고 이어 씁니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
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
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l", "e"],
          slots: 5,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "out",
            "4": "out",
          },
        },
      ],
      calc: {
        expr: 'get("a") · get("p") · get("p") =',
        result: "있음 · 있음 · 있음",
      },
      vars: "노드 수 4",
    },
    {
      title: 'T6 insert("apple") 의 le — 만든다',
      text: "app 노드에서 l · e 로 가는 자식이 없어 appl · apple 노드를 새로 만듭니다. 문자열이 끝나 apple 노드의 끝 표시를 참으로 둡니다.",
      nodes: [
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 표시",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "focus",
        },
        {
          value: "끝 표시",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "tree",
          label: "p",
        },
        {
          kind: "tree",
          label: "p",
        },
        {
          state: "out",
        },
        {
          kind: "tree",
          label: "l",
          state: "focus",
        },
        {
          kind: "tree",
          label: "e",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l", "e"],
          slots: 5,
          states: {
            "3": "read",
            "4": "read",
          },
        },
      ],
      calc: {
        expr: 'get("l") · get("e") =',
        result: "없음 · 없음 · end = 참",
      },
      vars: "노드 수 6",
    },
    {
      title: 'T7 insert("ape") 의 ape — 이어 쓰고 만든다',
      text: "뿌리에서 a · p 로 가는 자식이 이미 있어 새로 만들지 않고 이어 씁니다. 그다음 e 로 가는 자식이 없어 ape 노드를 새로 만듭니다. 문자열이 끝나 ape 노드의 끝 표시를 참으로 둡니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
          state: "focus",
        },
        {
          value: "",
        },
        {
          value: "끝 표시",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
        },
        {
          kind: "tree",
          label: "e",
          state: "focus",
        },
        {
          kind: "tree",
          label: "l",
        },
        {
          kind: "tree",
          label: "e",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "e"],
          slots: 5,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
          },
        },
      ],
      calc: {
        expr: 'get("a") · get("p") · get("e") =',
        result: "있음 · 있음 · 없음 · end = 참",
      },
      vars: "노드 수 7",
    },
    {
      title: 'T8 search("app")',
      text: "뿌리에서 a · p · p 를 따라 app 노드에 도착합니다. search 는 끝 표시까지 보고, 끝 표시가 참이라 참을 돌려줍니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "",
        },
        {
          value: "끝 표시",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "l",
        },
        {
          kind: "tree",
          label: "e",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p"],
          slots: 5,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
          },
        },
      ],
      calc: {
        expr: 'nodeAt("app").end =',
        result: "참",
      },
      vars: "노드 수 7",
    },
    {
      title: 'T9 search("appl")',
      text: "뿌리에서 a · p · p · l 을 따라 appl 노드에 도착합니다. search 는 끝 표시까지 보고, 끝 표시가 거짓이라 거짓을 돌려줍니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "l",
          state: "read",
        },
        {
          kind: "tree",
          label: "e",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l"],
          slots: 5,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
          },
        },
      ],
      calc: {
        expr: 'nodeAt("appl").end =',
        result: "거짓",
      },
      vars: "노드 수 7",
    },
    {
      title: 'T10 startsWith("appl")',
      text: "뿌리에서 a · p · p · l 을 따라 appl 노드에 도착합니다. startsWith 는 끝 표시를 보지 않고 도착했으므로 참을 돌려줍니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "p",
          state: "read",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "l",
          state: "read",
        },
        {
          kind: "tree",
          label: "e",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l"],
          slots: 5,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
          },
        },
      ],
      calc: {
        expr: 'nodeAt("appl") !== null =',
        result: "참",
      },
      vars: "노드 수 7",
    },
    {
      title: 'T11 startsWith("bat")',
      text: "뿌리에 b 로 가는 자식이 없어 nodeAt 이 null 을 돌려줍니다. startsWith 는 거짓을 돌려줍니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "",
        },
        {
          value: "",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
        },
        {
          value: "",
        },
        {
          value: "끝 표시",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "tree",
          label: "p",
        },
        {
          kind: "tree",
          label: "p",
        },
        {
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "l",
        },
        {
          kind: "tree",
          label: "e",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["b", "a", "t"],
          slots: 5,
          states: {
            "0": "read",
            "1": "out",
            "2": "out",
          },
        },
      ],
      calc: {
        expr: 'nodeAt("bat") !== null =',
        result: "거짓",
      },
      vars: "노드 수 7",
    },
  ],
};
