/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 문자열 `aabab` 으로
 * 접미사 자동자를 만들고 두 검색 문자열을 찾은 뒤 개수를 세는 열한 걸음이고, 프레임 제목은 원고의 걸음
 * 번호(`T#`)로 연다 — P3 이 그 자리를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대로 그리는 접미사 자동자(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다.
 *
 * 1. **자리(`layout`)는 전개가 끝난 자동자의 상태 일곱과, 한 번이라도 있었던 간선 전부다.** 상태의
 *    가로 자리는 그 상태의 `len`, 세로 자리는 같은 `len` 을 앞서 받은 상태 수다. 아직 안 만든 상태는
 *    점선 테(`empty`), 아직 안 생긴 간선은 흐린 선(`state: "out"`)이고, 복제 뒤 복제 상태로 옮겨 가
 *    없어진 간선(상태 0 · 1 에서 상태 3 으로 가던 `b` 전이, 상태 3 의 옛 접미사 링크)은 `hidden` 으로 뺀다.
 * 2. **간선은 두 종류다** — 전이는 굵은 실선(`tree`)에 글자를 붙이고, 접미사 링크는 대시(`back`)다.
 *    아호–코라식 자동자 편의 트라이 간선 · 실패 링크와 같은 선 모양이다.
 * 3. **강조는 둘뿐이다** — 이번 걸음에 만든 상태와 적은 간선은 새로 씀(`focus`), 이번 걸음에 거친 상태와
 *    간선(올라간 접미사 링크 · 멈춘 자리의 전이 · 찾기가 따라간 전이)은 읽음(`read`).
 * 4. **무대 아래 띠 둘** — 전처리하는 문자열 `s`(이번에 붙인 글자는 읽음, 아직 안 붙인 글자는 이번 걸음 밖)와
 *    검색 문자열 `t`(찾는 걸음에서만 채운다. 칸 수는 가장 긴 검색 문자열에 맞춰 고정한다).
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 증명 사이드카의 걸음
 * 기록(정본과 같은 자동자를 가리키는지 스스로 확인한다)에서 낸 결과를 옮긴 것이고, 둘이 같은지는
 * `suffixAutomaton-guide.test.ts` 가 잰다.
 *
 * 2026-09-30 전개(`KAN-058`)에서 옛 패널(`view: ["tree", "keyValue"]` — 접미사 링크 트리와 변수 목록)을
 * 무대 패널로 옮겼다. 옛 패널은 전이를 변수 목록의 글자로만 보였고, 이 패널은 전이와 접미사 링크를 한
 * 무대에 함께 그린다.
 */
export const samWalk = {
  player: "stage",
  stage: "graph",
  title: "aabab 다섯 글자로 접미사 자동자를 만들고 두 번 찾은 뒤 센다",
  sub: "T1–T11 · 뿌리 한 걸음 · 글자마다 한 걸음(복제하는 글자는 셋) · 찾기 두 걸음 · 세기 한 걸음",
  result: "11",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 0,
        label: "0",
      },
      {
        id: 1,
        x: 1,
        y: 0,
        label: "1",
      },
      {
        id: 2,
        x: 2,
        y: 0,
        label: "2",
      },
      {
        id: 3,
        x: 3,
        y: 0,
        label: "3",
      },
      {
        id: 4,
        x: 4,
        y: 0,
        label: "4",
      },
      {
        id: 5,
        x: 5,
        y: 0,
        label: "5",
      },
      {
        id: 6,
        x: 1.5,
        y: 1,
        label: "6",
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
        bend: 0,
      },
      {
        from: 1,
        to: 0,
        bend: 0.3,
      },
      {
        from: 1,
        to: 2,
        bend: 0,
      },
      {
        from: 2,
        to: 1,
        bend: 0.3,
      },
      {
        from: 0,
        to: 3,
        bend: 0.18,
      },
      {
        from: 1,
        to: 3,
        bend: 0.18,
      },
      {
        from: 2,
        to: 3,
        bend: 0,
      },
      {
        from: 3,
        to: 0,
        bend: 0.3,
      },
      {
        from: 3,
        to: 4,
        bend: 0,
      },
      {
        from: 4,
        to: 1,
        bend: 0.3,
      },
      {
        from: 4,
        to: 5,
        bend: 0,
      },
      {
        from: 6,
        to: 4,
        bend: 0,
      },
      {
        from: 6,
        to: 0,
        bend: 0.18,
      },
      {
        from: 0,
        to: 6,
        bend: 0.2,
      },
      {
        from: 1,
        to: 6,
        bend: 0,
      },
      {
        from: 3,
        to: 6,
        bend: 0.18,
      },
      {
        from: 5,
        to: 6,
        bend: 0.18,
      },
    ],
    unit: {
      x: 110,
      y: 124,
    },
  },
  steps: [
    {
      title: "T1 뿌리 상태 하나로 시작한다",
      text: "빈 문자열만 담는 상태 0 하나로 시작합니다. 점선 테는 앞으로 만들 상태 자리이고, 흐린 선은 앞으로 생길 간선 자리입니다.",
      nodes: [
        {
          value: "len 0",
          state: "focus",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "상태 수 =",
        result: "1",
      },
      vars: null,
    },
    {
      title: "T2 자리 0 의 a — 뿌리로 잇는다",
      text: "새 상태 1 의 len 은 1 입니다. 상태 0 에 a 전이가 없어 1 을 적었습니다. 뿌리를 지나쳐 멈출 곳이 없었으므로 상태 1 의 접미사 링크는 뿌리입니다.",
      nodes: [
        {
          value: "len 0",
        },
        {
          value: "len 1",
          state: "focus",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
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
          kind: "back",
          state: "focus",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "0": "read",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "link[1] =",
        result: "0",
      },
      vars: "cur = 1 · p = -1",
    },
    {
      title: "T3 자리 1 의 a — 길이가 이어진다",
      text: "새 상태 2 의 len 은 2 입니다. 상태 1 에 a 전이가 없어 2 를 적었습니다. 상태 0 에는 a 전이가 이미 있어 멈췄고, 그 전이가 가리키는 q 는 상태 1 입니다. len[0] + 1 과 len[1] 이 같아 q 를 그대로 접미사 링크로 씁니다.",
      nodes: [
        {
          value: "len 0",
          state: "read",
        },
        {
          value: "len 1",
          state: "read",
        },
        {
          value: "len 2",
          state: "focus",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
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
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "a",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "1": "read",
            "2": "out",
            "3": "out",
            "4": "out",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "len[0] + 1 = len[1] =",
        result: "1",
      },
      vars: "cur = 2 · p = 0 · q = 1",
    },
    {
      title: "T4 자리 2 의 b — 뿌리로 잇는다",
      text: "새 상태 3 의 len 은 3 입니다. 상태 2 · 1 · 0 에 b 전이가 없어 3 을 적었습니다. 뿌리를 지나쳐 멈출 곳이 없었으므로 상태 3 의 접미사 링크는 뿌리입니다.",
      nodes: [
        {
          value: "len 0",
        },
        {
          value: "len 1",
        },
        {
          value: "len 2",
        },
        {
          value: "len 3",
          state: "focus",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "b",
          state: "focus",
        },
        {
          kind: "tree",
          label: "b",
          state: "focus",
        },
        {
          kind: "tree",
          label: "b",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "2": "read",
            "3": "out",
            "4": "out",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "link[3] =",
        result: "0",
      },
      vars: "cur = 3 · p = -1",
    },
    {
      title: "T5 자리 3 의 a — 길이가 이어진다",
      text: "새 상태 4 의 len 은 4 입니다. 상태 3 에 a 전이가 없어 4 를 적었습니다. 상태 0 에는 a 전이가 이미 있어 멈췄고, 그 전이가 가리키는 q 는 상태 1 입니다. len[0] + 1 과 len[1] 이 같아 q 를 그대로 접미사 링크로 씁니다.",
      nodes: [
        {
          value: "len 0",
          state: "read",
        },
        {
          value: "len 1",
          state: "read",
        },
        {
          value: "len 2",
        },
        {
          value: "len 3",
        },
        {
          value: "len 4",
          state: "focus",
        },
        {
          state: "empty",
        },
        {
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
          kind: "back",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "a",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "3": "read",
            "4": "out",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "len[0] + 1 = len[1] =",
        result: "1",
      },
      vars: "cur = 4 · p = 0 · q = 1",
    },
    {
      title: "T6 자리 4 의 b — 전이를 채우고 멈춘다",
      text: "새 상태 5 의 len 은 5 입니다. 상태 4 에 b 전이가 없어 5 를 적었습니다. 상태 1 에서 b 전이가 이미 있어 멈췄고 q 는 상태 3 입니다. len[1] + 1 이 len[3] 보다 작아 q 를 그대로 쓸 수 없습니다.",
      nodes: [
        {
          value: "len 0",
        },
        {
          value: "len 1",
          state: "read",
        },
        {
          value: "len 2",
        },
        {
          value: "len 3",
          state: "read",
        },
        {
          value: "len 4",
        },
        {
          value: "len 5",
          state: "focus",
        },
        {
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "b",
          state: "read",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "b",
          state: "focus",
        },
        {
          kind: "tree",
          label: "a",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "4": "read",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "len[1] + 1 · len[3] =",
        result: "2 · 3",
      },
      vars: "cur = 5 · p = 1 · q = 3",
    },
    {
      title: "T7 복제 상태 6 을 만든다",
      text: "q 의 전이 표를 복사하고 q 의 접미사 링크를 물려받은 상태 6 을 만들었습니다. len 은 len[1] + 1 입니다.",
      nodes: [
        {
          value: "len 0",
        },
        {
          value: "len 1",
        },
        {
          value: "len 2",
        },
        {
          value: "len 3",
          state: "read",
        },
        {
          value: "len 4",
        },
        {
          value: "len 5",
        },
        {
          value: "len 2",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "a",
          state: "focus",
        },
        {
          kind: "back",
          state: "focus",
        },
        {
          kind: "tree",
          label: "b",
          state: "out",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "4": "read",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "len[6] = len[1] + 1 =",
        result: "2",
      },
      vars: "cur = 5 · p = 1 · q = 3",
    },
    {
      title: "T8 전이와 접미사 링크를 옮긴다",
      text: "q 를 가리키던 b 전이 가운데 상태 1 · 0 의 것을 복제 상태 6 으로 옮기고, q 와 cur 의 접미사 링크를 복제 상태로 둡니다.",
      nodes: [
        {
          value: "len 0",
          state: "read",
        },
        {
          value: "len 1",
          state: "read",
        },
        {
          value: "len 2",
        },
        {
          value: "len 3",
        },
        {
          value: "len 4",
        },
        {
          value: "len 5",
        },
        {
          value: "len 2",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
          hidden: true,
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
          state: "focus",
        },
        {
          kind: "tree",
          label: "b",
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
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
          states: {
            "4": "read",
          },
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "link[3] = link[5] =",
        result: "6",
      },
      vars: "cur = 5 · p = 1 · q = 3",
    },
    {
      title: 'T9 찾기 — "aba"',
      text: "뿌리에서 글자마다 전이를 따라가 0 → 1 → 6 → 4 에 도착했습니다. 글자를 끝까지 따라갔으므로 부분 문자열입니다.",
      nodes: [
        {
          value: "len 0",
          state: "read",
        },
        {
          value: "len 1",
          state: "read",
        },
        {
          value: "len 2",
        },
        {
          value: "len 3",
        },
        {
          value: "len 4",
          state: "read",
        },
        {
          value: "len 5",
        },
        {
          value: "len 2",
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
          hidden: true,
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "a",
          state: "read",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "b",
          state: "read",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
        },
        {
          label: "t",
          values: ["a", "b", "a"],
          slots: 3,
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
          },
        },
      ],
      calc: {
        expr: 'contains("aba") =',
        result: "true",
      },
      vars: null,
    },
    {
      title: 'T10 찾기 — "bb"',
      text: "0 → 6 까지 갔는데 상태 6 에 b 전이가 없습니다. 중간에 멈췄으므로 부분 문자열이 아닙니다.",
      nodes: [
        {
          value: "len 0",
          state: "read",
        },
        {
          value: "len 1",
        },
        {
          value: "len 2",
        },
        {
          value: "len 3",
        },
        {
          value: "len 4",
        },
        {
          value: "len 5",
        },
        {
          value: "len 2",
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
          hidden: true,
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
        },
        {
          kind: "tree",
          label: "b",
          state: "read",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
        },
        {
          kind: "back",
        },
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
        },
        {
          label: "t",
          values: ["b", "b"],
          slots: 3,
          states: {
            "0": "read",
            "1": "read",
          },
        },
      ],
      calc: {
        expr: 'contains("bb") =',
        result: "false",
      },
      vars: null,
    },
    {
      title: "T11 개수 세기",
      text: "뿌리를 뺀 상태마다 len 과 접미사 링크의 len 의 차를 더합니다. 합이 11 입니다.",
      nodes: [
        {
          value: "len 0",
        },
        {
          value: "len 1",
          state: "read",
        },
        {
          value: "len 2",
          state: "read",
        },
        {
          value: "len 3",
          state: "read",
        },
        {
          value: "len 4",
          state: "read",
        },
        {
          value: "len 5",
          state: "read",
        },
        {
          value: "len 2",
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
          hidden: true,
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
          hidden: true,
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "a",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "tree",
          label: "b",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "s",
          values: ["a", "a", "b", "a", "b"],
        },
        {
          label: "t",
          values: [],
          slots: 3,
        },
      ],
      calc: {
        expr: "1 + 1 + 1 + 3 + 3 + 2 =",
        result: "11",
      },
      vars: null,
    },
  ],
};
