import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(11)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` + `tree` 조합의 다섯 규약 — 이 편이 처음 세운다
 *
 * `tree` 뷰가 v2 골격에서 처음 쓰이는 자리다(`array`·`keyValue`·`graph`·`matrix` 넷만
 * 나와 있었다). 뒤에 오는 `radixTree`·`treeMaxIndependentSet`·`treeDiameter` 가 이 규약을
 * 그대로 쓴다.
 *
 * 1. **`root` 는 그 걸음이 끝난 시점의 구조 전체를 담는다.** 부분 트리를 담지 않는다 —
 *    노드가 늘어나는 것을 프레임 사이의 차이로 확인하는 것이 이 뷰의 직무이고, 담는 범위가
 *    프레임마다 다르면 그 차이가 구조의 변화인지 화면의 변화인지 갈리지 않는다.
 * 2. **`label` 은 부모에서 이 노드로 오는 간선의 글자다.** 경로 문자열 전체를 라벨에 적지
 *    않는다 — 깊이가 늘면 라벨이 길어져 모양이 무너지고, 경로는 위에서 아래로 읽으면 나온다.
 *    단어 끝 표시는 글자 뒤의 `*` 이고, 뿌리만 `(root)` 로 적는다.
 * 3. **`status` 넷이 이 걸음의 이동을 나타낸다** — `active` 는 지금 서 있는 노드, `visited`
 *    는 이번 걸음에 지나온 노드, `frontier` 는 이번 걸음에 새로 만든 노드, `default` 는
 *    나머지다. 지금 서 있는 노드가 방금 만든 노드이기도 하면 `active` 가 앞선다.
 *    **이 넷이 「경로를 따라 내려간다」를 걸음마다 보이게 하는 장치 전부다.**
 * 4. **`children` 에 `null` 을 넣지 않는다.** `TreeNodeData` 의 `null` 은 이진 트리의 빈
 *    자리를 뜻하는데(`src/_guide-sim/index.tsx`), 트라이의 자식은 글자로 이름이 붙어 있어
 *    「비어 있는 자리」라는 것이 없다. 자식은 **처음 만들어진 순서**로 담는다 — 순서는 어떤
 *    답에도 영향을 주지 않지만, 프레임 사이에 자리가 흔들리면 무엇이 새로 생겼는지 확인할
 *    수 없다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 여섯이고, 트리
 *    그림이 못 담는 스칼라만 담는다. T9 와 T10 은 **트리가 글자 하나 다르지 않은데 반환값이
 *    갈리는 걸음**이라, 그 차이가 보이는 자리는 이 패널뿐이다.
 */
export const trieOps = {
  view: ["keyValue", "tree"] as const,
  title: "app · apple · ape 를 담고 네 번 묻는다",
  result: "false",
  steps: [
    {
      title: "T1 시작",
      detail:
        "빈 트라이는 뿌리 하나다. 뿌리는 빈 문자열에 해당하는 노드이고, 아직 단어 끝 표시가 없다.",
      root: { id: "root", label: "(root)", status: "active" },
      entries: [
        { label: "지금 하는 일", value: "시작" },
        { label: "읽은 글자", value: 0 },
        { label: "지금 노드의 경로", value: "(root)" },
        { label: "이 걸음에서 만든 노드", value: "-" },
        { label: "트라이의 노드 수", value: 1 },
        { label: "반환", value: "-" },
      ],
    },
    {
      title: 'T2 insert("app") 의 글자 a',
      detail:
        "뿌리에 a 로 가는 자식이 없다. 새 노드를 만들어 걸고 거기로 옮긴다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [{ id: "a", label: "a", status: "active" }],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("app") 의 글자 a' },
        { label: "읽은 글자", value: 1 },
        { label: "지금 노드의 경로", value: "a" },
        { label: "이 걸음에서 만든 노드", value: 1 },
        { label: "트라이의 노드 수", value: 2 },
        { label: "반환", value: "-" },
      ],
    },
    {
      title: 'T3 insert("app") 의 글자 p',
      detail:
        "지금 노드 a 에 p 로 가는 자식이 없다. 또 하나 만들어 걸고 옮긴다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [{ id: "ap", label: "p", status: "active" }],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("app") 의 글자 p' },
        { label: "읽은 글자", value: 1 },
        { label: "지금 노드의 경로", value: "ap" },
        { label: "이 걸음에서 만든 노드", value: 1 },
        { label: "트라이의 노드 수", value: 3 },
        { label: "반환", value: "-" },
      ],
    },
    {
      title: 'T4 insert("app") 의 글자 p — 단어 끝',
      detail:
        "세 번째 글자까지 내려왔다. 문자열이 끝났으므로 지금 노드에 단어 끝 표시를 남긴다. 라벨의 * 가 그 표시다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [
              {
                id: "ap",
                label: "p",
                status: "visited",
                children: [{ id: "app", label: "p*", status: "active" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("app") 의 글자 p' },
        { label: "읽은 글자", value: 1 },
        { label: "지금 노드의 경로", value: "app" },
        { label: "이 걸음에서 만든 노드", value: 1 },
        { label: "트라이의 노드 수", value: 4 },
        { label: "반환", value: "없음" },
      ],
    },
    {
      title: 'T5 insert("apple") 의 앞 세 글자',
      detail:
        "a · p · p 로 가는 자식이 셋 다 이미 있다. 새로 만들지 않고 그대로 이어 쓴다 — 노드 수가 4 에서 안 늘어난다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [
              {
                id: "ap",
                label: "p",
                status: "visited",
                children: [{ id: "app", label: "p*", status: "active" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("apple") 의 글자 a p p' },
        { label: "읽은 글자", value: 3 },
        { label: "지금 노드의 경로", value: "app" },
        { label: "이 걸음에서 만든 노드", value: 0 },
        { label: "트라이의 노드 수", value: 4 },
        { label: "반환", value: "-" },
      ],
    },
    {
      title: 'T6 insert("apple") 의 남은 두 글자',
      detail:
        "l 과 e 는 자식이 없어 둘 다 새로 만든다. 여기서 노드가 둘 늘고, 마지막 노드에 단어 끝 표시를 남긴다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [
              {
                id: "ap",
                label: "p",
                status: "visited",
                children: [
                  {
                    id: "app",
                    label: "p*",
                    status: "visited",
                    children: [
                      {
                        id: "appl",
                        label: "l",
                        status: "frontier",
                        children: [
                          { id: "apple", label: "e*", status: "active" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("apple") 의 글자 l e' },
        { label: "읽은 글자", value: 2 },
        { label: "지금 노드의 경로", value: "apple" },
        { label: "이 걸음에서 만든 노드", value: 2 },
        { label: "트라이의 노드 수", value: 6 },
        { label: "반환", value: "없음" },
      ],
    },
    {
      title: 'T7 insert("ape")',
      detail:
        "a 와 p 는 이어 쓰고 e 에서 처음으로 자식이 없다. 노드 ap 가 자식 둘을 갖게 되면서 여기서 두 갈래로 나뉜다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [
              {
                id: "ap",
                label: "p",
                status: "visited",
                children: [
                  {
                    id: "app",
                    label: "p*",
                    status: "default",
                    children: [
                      {
                        id: "appl",
                        label: "l",
                        status: "default",
                        children: [
                          { id: "apple", label: "e*", status: "default" },
                        ],
                      },
                    ],
                  },
                  { id: "ape", label: "e*", status: "active" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("ape") 의 글자 a p e' },
        { label: "읽은 글자", value: 3 },
        { label: "지금 노드의 경로", value: "ape" },
        { label: "이 걸음에서 만든 노드", value: 1 },
        { label: "트라이의 노드 수", value: 7 },
        { label: "반환", value: "없음" },
      ],
    },
    {
      title: 'T8 search("app")',
      detail:
        "세 글자를 따라 노드 app 까지 내려왔다. 그 노드에 단어 끝 표시가 있으므로 참이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [
              {
                id: "ap",
                label: "p",
                status: "visited",
                children: [
                  {
                    id: "app",
                    label: "p*",
                    status: "active",
                    children: [
                      {
                        id: "appl",
                        label: "l",
                        status: "default",
                        children: [
                          { id: "apple", label: "e*", status: "default" },
                        ],
                      },
                    ],
                  },
                  { id: "ape", label: "e*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'search("app")' },
        { label: "읽은 글자", value: 3 },
        { label: "지금 노드의 경로", value: "app" },
        { label: "이 걸음에서 만든 노드", value: 0 },
        { label: "트라이의 노드 수", value: 7 },
        { label: "반환", value: "true" },
      ],
    },
    {
      title: 'T9 search("appl")',
      detail:
        "네 글자를 따라 노드 appl 까지 내려왔다. 노드는 있지만 단어 끝 표시가 없어 거짓이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [
              {
                id: "ap",
                label: "p",
                status: "visited",
                children: [
                  {
                    id: "app",
                    label: "p*",
                    status: "visited",
                    children: [
                      {
                        id: "appl",
                        label: "l",
                        status: "active",
                        children: [
                          { id: "apple", label: "e*", status: "default" },
                        ],
                      },
                    ],
                  },
                  { id: "ape", label: "e*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'search("appl")' },
        { label: "읽은 글자", value: 4 },
        { label: "지금 노드의 경로", value: "appl" },
        { label: "이 걸음에서 만든 노드", value: 0 },
        { label: "트라이의 노드 수", value: 7 },
        { label: "반환", value: "false" },
      ],
    },
    {
      title: 'T10 startsWith("appl")',
      detail:
        "T9 와 같은 노드에 같은 경로로 도착했다. 트리는 글자 하나 다르지 않은데 반환값이 갈린다 — 단어 끝 표시를 보지 않기 때문이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "a",
            label: "a",
            status: "visited",
            children: [
              {
                id: "ap",
                label: "p",
                status: "visited",
                children: [
                  {
                    id: "app",
                    label: "p*",
                    status: "visited",
                    children: [
                      {
                        id: "appl",
                        label: "l",
                        status: "active",
                        children: [
                          { id: "apple", label: "e*", status: "default" },
                        ],
                      },
                    ],
                  },
                  { id: "ape", label: "e*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'startsWith("appl")' },
        { label: "읽은 글자", value: 4 },
        { label: "지금 노드의 경로", value: "appl" },
        { label: "이 걸음에서 만든 노드", value: 0 },
        { label: "트라이의 노드 수", value: 7 },
        { label: "반환", value: "true" },
      ],
    },
    {
      title: 'T11 startsWith("bat")',
      detail:
        "첫 글자 b 로 가는 자식이 뿌리에 없다. 남은 두 글자를 읽지 않고 거짓을 낸다 — 읽은 글자가 1 이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "active",
        children: [
          {
            id: "a",
            label: "a",
            status: "default",
            children: [
              {
                id: "ap",
                label: "p",
                status: "default",
                children: [
                  {
                    id: "app",
                    label: "p*",
                    status: "default",
                    children: [
                      {
                        id: "appl",
                        label: "l",
                        status: "default",
                        children: [
                          { id: "apple", label: "e*", status: "default" },
                        ],
                      },
                    ],
                  },
                  { id: "ape", label: "e*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'startsWith("bat")' },
        { label: "읽은 글자", value: 1 },
        { label: "지금 노드의 경로", value: "없음" },
        { label: "이 걸음에서 만든 노드", value: 0 },
        { label: "트라이의 노드 수", value: 7 },
        { label: "반환", value: "false" },
      ],
    },
  ] satisfies Frame[],
};
