/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 네 단어
 * (`apple` · `application` · `app` · `appl`)를 담고 다섯 번 묻는 열 걸음이고, 프레임 제목은 원고의
 * 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대로 그리는 라딕스 트리(KAN-058, SPEC §13)
 *
 * 옛 패널은 `trie-guide.sim.ts` 가 세운 `keyValue` + `tree` 조합을 물려받았는데, 그 규약은 트라이
 * 재집필(KAN-058)로 없어졌다. 지금은 트라이 편과 같이 `player: "stage"` 가 걸음 재생 패널
 * (`src/_viz/player/StepPlayer.tsx`)을 고르고 `stage: "graph"` 가 무대 갈래를 고른다. 트라이 편의 규약
 * 넷을 그대로 쓰고, 라벨이 여러 글자라서 생기는 자리 셋을 더한다.
 *
 * 1. **자리(`layout`)는 완성된 트리의 것이다.** 첫 걸음부터 노드 다섯의 자리를 두고, 아직 없는 노드는
 *    `state: "empty"`(점선), 완성된 트리에 있지만 아직 안 생긴 간선은 `state: "out"`(흐린 선)으로 둔다.
 * 2. **노드 이름은 경로 문자열**(뿌리만 「뿌리」)이고, 값 칸에는 끝 표시가 참일 때만 「끝 표시」를 적는다.
 *    **라벨은 간선의 머리말**이다 — 가를 때마다 같은 노드로 들어오는 간선의 라벨이 짧아진다(T3 에서
 *    `apple` 로 들어오는 라벨이 `apple` 에서 `e` 가 된다). 경로 문자열은 안 바뀌므로 노드 id 로 쓴다.
 * 3. **강조는 둘뿐이다** — 이번 걸음에 만든 노드와 끝 표시를 참으로 둔 노드, 그리고 새로 생겼거나 라벨이
 *    바뀐 간선은 새로 씀(`focus`), 이번 걸음에 라벨을 맞춰 본 노드와 그 간선은 읽음(`read`).
 * 4. **무대 아래 띠 둘** — 「읽는 문자열」은 라벨과 맞춘 글자가 읽음, 새 잎의 라벨로 들어간 글자가 새로
 *    씀, 못 맞춘 글자가 이번 걸음 밖이다. 「맞춰 본 라벨」은 이번 걸음이 마지막으로 맞춰 본 라벨이고,
 *    맞은 글자가 읽음, 남은 글자가 이번 걸음 밖이다 — T7 · T8 에서 라벨에 남은 여섯 글자가 여기 보인다.
 * 5. **가르기 전 간선은 가른 뒤 그리지 않는다**(`hidden`). 뿌리 → `apple` 은 T2 에만, 뿌리 → `appl` 은
 *    T3 에만 있다. 이 둘은 자리에 `bend` 를 줘 왼쪽으로 휘어, 뒤에 생길 세로 간선과 겹치지 않는다.
 * 6. **자리는 첫 자식을 부모 바로 아래에 둔다.** 가르기 전의 긴 라벨이 가른 뒤 생길 노드 자리를 지나가는
 *    것이 보인다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 증명 사이드카의
 * 걸음 기록(정본과 같은 트리를 만드는지 삽입마다 스스로 확인한다)에서 낸 결과를 옮긴 것이고, 둘이
 * 같은지는 `radixTree-guide.test.ts` 가 잰다.
 */
export const radixOps = {
  player: "stage",
  stage: "graph",
  title: "apple · application · app · appl 을 담고 다섯 번 묻는다",
  sub: "T1–T10 · 걸음마다 삽입 하나 또는 조회 하나",
  result: "false",
  layout: {
    nodes: [
      {
        id: "root",
        x: 1,
        y: 0,
        label: "뿌리",
      },
      {
        id: "app",
        x: 1,
        y: 1,
        label: "app",
      },
      {
        id: "appl",
        x: 1,
        y: 2,
        label: "appl",
      },
      {
        id: "apple",
        x: 1,
        y: 3,
        label: "apple",
      },
      {
        id: "application",
        x: 2,
        y: 3,
        label: "application",
      },
    ],
    edges: [
      {
        from: "root",
        to: "apple",
        bend: -0.35,
      },
      {
        from: "root",
        to: "appl",
        bend: -0.35,
      },
      {
        from: "appl",
        to: "apple",
      },
      {
        from: "appl",
        to: "application",
      },
      {
        from: "root",
        to: "app",
      },
      {
        from: "app",
        to: "appl",
      },
    ],
    unit: {
      x: 120,
      y: 84,
    },
  },
  steps: [
    {
      title: "T1 빈 트리",
      text: "빈 트리는 뿌리 하나입니다. 뿌리의 라벨은 빈 문자열이고, 점선 노드는 뒤 걸음에서 만들어질 자리입니다.",
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
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          state: "out",
        },
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
          slots: 11,
        },
        {
          label: "맞춰 본 라벨",
          values: [],
          slots: 7,
        },
      ],
      calc: null,
      vars: "노드 수 1",
    },
    {
      title: 'T2 insert("apple") — 잎을 단다',
      text: "뿌리에 a 로 시작하는 자식이 없어, 남은 글자 apple 을 라벨 하나로 단 잎을 만들고 끝 표시를 참으로 둡니다. 글자를 한 번도 대조하지 않았습니다.",
      nodes: [
        {
          value: "",
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
          value: "끝 표시",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "apple",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          state: "out",
        },
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
          slots: 11,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: [],
          slots: 7,
        },
      ],
      calc: {
        expr: 'children.get("a") =',
        result: "없음",
      },
      vars: "노드 수 2",
    },
    {
      title: 'T3 insert("application") — 라벨을 가르고 잎을 단다',
      text: "라벨 apple 과 앞 4 글자 appl까지 같고 그다음이 갈려, 라벨을 appl 과 e 로 가르고 그 자리에 중간 노드 appl 을 세웁니다. 부모의 a 자리를 중간 노드로 바꿉니다. 새 단어에 남은 ication 을 라벨로 단 잎을 중간 노드 아래에 답니다.",
      nodes: [
        {
          value: "",
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
        },
        {
          value: "끝 표시",
          state: "focus",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          kind: "tree",
          label: "appl",
          state: "focus",
        },
        {
          kind: "tree",
          label: "e",
          state: "focus",
        },
        {
          kind: "tree",
          label: "ication",
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
          label: "읽는 문자열",
          values: ["a", "p", "p", "l", "i", "c", "a", "t", "i", "o", "n"],
          slots: 11,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
            "9": "focus",
            "10": "focus",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: ["a", "p", "p", "l", "e"],
          slots: 7,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "out",
          },
        },
      ],
      calc: {
        expr: 'commonPrefixLength("application", "apple") =',
        result: "4",
      },
      vars: "노드 수 4",
    },
    {
      title: 'T4 insert("app") — 라벨을 가르고 끝 표시를 남긴다',
      text: "라벨 appl 과 앞 3 글자 app까지 같고 그다음이 갈려, 라벨을 app 과 l 로 가르고 그 자리에 중간 노드 app 을 세웁니다. 부모의 a 자리를 중간 노드로 바꿉니다. 새 단어에 남은 글자가 없어 중간 노드 app의 끝 표시를 참으로 둡니다.",
      nodes: [
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
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
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
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "ication",
        },
        {
          kind: "tree",
          label: "app",
          state: "focus",
        },
        {
          kind: "tree",
          label: "l",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p"],
          slots: 11,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: ["a", "p", "p", "l"],
          slots: 7,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "out",
          },
        },
      ],
      calc: {
        expr: 'commonPrefixLength("app", "appl") =',
        result: "3",
      },
      vars: "노드 수 5",
    },
    {
      title: 'T5 insert("appl") — 라벨을 다 쓰고 끝 표시를 남긴다',
      text: "라벨 app · l 을 차례로 다 쓰고 남은 글자가 없어, appl 노드의 끝 표시를 참으로 둡니다. 새 노드는 없습니다.",
      nodes: [
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
          state: "focus",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
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
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "ication",
        },
        {
          kind: "tree",
          label: "app",
          state: "read",
        },
        {
          kind: "tree",
          label: "l",
          state: "read",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l"],
          slots: 11,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: ["l"],
          slots: 7,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: 'rest === "" → end =',
        result: "참",
      },
      vars: "노드 수 5",
    },
    {
      title: 'T6 search("app")',
      text: "뿌리에서 라벨 app 을 따라 라벨 app 이 붙은 노드에 도착했고, 라벨에 남은 글자는 0 개입니다. search 는 끝 표시가 참이라 참을 돌려줍니다.",
      nodes: [
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
          value: "끝 표시",
        },
        {
          value: "끝 표시",
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
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "ication",
        },
        {
          kind: "tree",
          label: "app",
          state: "read",
        },
        {
          kind: "tree",
          label: "l",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p"],
          slots: 11,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: ["a", "p", "p"],
          slots: 7,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
          },
        },
      ],
      calc: {
        expr: "leftover === 0 && end =",
        result: "참",
      },
      vars: "노드 수 5",
    },
    {
      title: 'T7 search("appli")',
      text: "뿌리에서 라벨 app · l · ication 을 따라 라벨 ication 이 붙은 노드에 도착했고, 라벨에 남은 글자는 6 개입니다. search 는 남은 글자가 0 이 아니라 거짓을 돌려줍니다.",
      nodes: [
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
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
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
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "ication",
          state: "read",
        },
        {
          kind: "tree",
          label: "app",
          state: "read",
        },
        {
          kind: "tree",
          label: "l",
          state: "read",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l", "i"],
          slots: 11,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: ["i", "c", "a", "t", "i", "o", "n"],
          slots: 7,
          states: {
            "0": "read",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
          },
        },
      ],
      calc: {
        expr: "leftover === 0 && end =",
        result: "거짓",
      },
      vars: "노드 수 5",
    },
    {
      title: 'T8 startsWith("appli")',
      text: "뿌리에서 라벨 app · l · ication 을 따라 라벨 ication 이 붙은 노드에 도착했고, 라벨에 남은 글자는 6 개입니다. startsWith 는 도착했으므로 참을 돌려줍니다.",
      nodes: [
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
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
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
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "ication",
          state: "read",
        },
        {
          kind: "tree",
          label: "app",
          state: "read",
        },
        {
          kind: "tree",
          label: "l",
          state: "read",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l", "i"],
          slots: 11,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: ["i", "c", "a", "t", "i", "o", "n"],
          slots: 7,
          states: {
            "0": "read",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
          },
        },
      ],
      calc: {
        expr: 'locate("appli") !== null =',
        result: "참",
      },
      vars: "노드 수 5",
    },
    {
      title: 'T9 search("applied")',
      text: "라벨 app · l 을 다 쓴 뒤 라벨 ication 의 2 번째 글자에서 어긋나 locate 가 null 을 돌려줍니다. search 는 거짓을 돌려줍니다.",
      nodes: [
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
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
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
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "ication",
          state: "read",
        },
        {
          kind: "tree",
          label: "app",
          state: "read",
        },
        {
          kind: "tree",
          label: "l",
          state: "read",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["a", "p", "p", "l", "i", "e", "d"],
          slots: 11,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "out",
            "6": "out",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: ["i", "c", "a", "t", "i", "o", "n"],
          slots: 7,
          states: {
            "0": "read",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
          },
        },
      ],
      calc: {
        expr: 'locate("applied") =',
        result: "null",
      },
      vars: "노드 수 5",
    },
    {
      title: 'T10 startsWith("bat")',
      text: "뿌리에 b 로 시작하는 자식이 없어 locate 가 null 을 돌려줍니다. startsWith 는 거짓을 돌려줍니다.",
      nodes: [
        {
          value: "",
          state: "read",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
        },
        {
          value: "끝 표시",
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
          kind: "tree",
          label: "e",
        },
        {
          kind: "tree",
          label: "ication",
        },
        {
          kind: "tree",
          label: "app",
        },
        {
          kind: "tree",
          label: "l",
        },
      ],
      strips: [
        {
          label: "읽는 문자열",
          values: ["b", "a", "t"],
          slots: 11,
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
          },
        },
        {
          label: "맞춰 본 라벨",
          values: [],
          slots: 7,
        },
      ],
      calc: {
        expr: 'locate("bat") =',
        result: "null",
      },
      vars: "노드 수 5",
    },
  ],
};
