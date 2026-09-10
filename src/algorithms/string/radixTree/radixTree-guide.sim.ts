import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` + `tree` 조합의 다섯 규약을 그대로 쓴다
 *
 * 규약을 세운 것은 `src/algorithms/string/trie/trie-guide.sim.ts` 이고, 이 편은 그것을
 * 물려받는다. 다섯 중 넷은 글자 그대로 같고, **둘째 규약만 이 편의 자료구조에 맞춰 넓어진다.**
 *
 * 1. **`root` 는 그 걸음이 끝난 시점의 구조 전체를 담는다.** 부분 트리를 담지 않는다 —
 *    노드가 늘어나는 것을 프레임 사이의 차이로 확인하는 것이 이 뷰의 직무이고, 담는 범위가
 *    프레임마다 다르면 그 차이가 구조의 변화인지 화면의 변화인지 갈리지 않는다.
 * 2. **`label` 은 부모에서 이 노드로 오는 간선의 글자다.** 트라이 편에서는 그것이 언제나
 *    글자 하나였는데, 이 편은 **갈림이 없는 구간을 통째로 접은 라벨**이라 글자 여럿이다.
 *    넓어진 것은 거기까지이고 나머지는 같다 — 경로 문자열 전체를 라벨에 적지 않고(위에서
 *    아래로 읽으면 나온다), 단어 끝 표시는 라벨 뒤의 `*` 이고, 뿌리만 `(root)` 로 적는다.
 *    **라벨이 바뀌는 걸음이 있다는 것이 이 편의 새로운 자리다** — T3 과 T4 에서 라벨을
 *    가르므로, 같은 `id` 의 노드가 앞 프레임보다 짧은 라벨을 들고 나온다.
 * 3. **`status` 넷이 이 걸음의 이동을 나타낸다** — `active` 는 지금 서 있는 노드, `visited`
 *    는 이번 걸음에 지나온 노드, `frontier` 는 이번 걸음에 새로 만든 노드, `default` 는
 *    나머지다. 지금 서 있는 노드가 방금 만든 노드이기도 하면 `active` 가 앞선다.
 *    **이 넷이 「라벨을 따라 내려간다」를 걸음마다 보이게 하는 장치 전부다.**
 * 4. **`children` 에 `null` 을 넣지 않는다.** `TreeNodeData` 의 `null` 은 이진 트리의 빈
 *    자리를 뜻하는데(`src/_guide-sim/index.tsx`), 이 트리의 자식은 라벨의 첫 글자로 이름이
 *    붙어 있어 「비어 있는 자리」라는 것이 없다. 자식은 **자식 맵에 처음 걸린 순서**로
 *    담는다 — 순서는 어떤 답에도 영향을 주지 않지만, 프레임 사이에 자리가 흔들리면 무엇이
 *    새로 생겼는지 확인할 수 없다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 여섯이고, 트리
 *    그림이 못 담는 스칼라만 담는다. T7 과 T8 은 **트리가 글자 하나 다르지 않고 서 있는
 *    노드까지 같은데 반환값이 갈리는 걸음**이라, 그 차이(라벨에 남은 글자 6)가 보이는
 *    자리는 이 패널뿐이다.
 *
 * **`id` 는 그 노드의 경로 문자열로 둔다.** 라벨은 가를 때마다 바뀌지만 경로는 안 바뀌므로,
 * 라벨을 id 로 쓰면 T3 과 T4 에서 같은 노드가 다른 노드로 보인다.
 */
export const radixOps = {
  view: ["keyValue", "tree"] as const,
  title: "apple · application · app · appl 을 담고 다섯 번 묻는다",
  result: "false",
  steps: [
    {
      title: "T1 시작",
      detail:
        "빈 트리는 뿌리 하나다. 뿌리의 라벨은 빈 문자열이고, 아직 단어 끝 표시가 없다.",
      root: { id: "root", label: "(root)", status: "active" },
      entries: [
        { label: "지금 하는 일", value: "시작" },
        { label: "대조한 글자", value: 0 },
        { label: "도착한 노드의 라벨", value: "(root)" },
        { label: "라벨에 남은 글자", value: "-" },
        { label: "트리의 노드 수", value: 1 },
        { label: "반환", value: "-" },
      ],
    },
    {
      title: 'T2 insert("apple")',
      detail:
        "뿌리에 a 로 시작하는 자식이 없다. 남은 다섯 글자 전부를 라벨 하나로 단 잎을 만든다 — 글자를 한 번도 대조하지 않는다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [{ id: "apple", label: "apple*", status: "active" }],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("apple")' },
        { label: "대조한 글자", value: 0 },
        { label: "도착한 노드의 라벨", value: "apple" },
        { label: "라벨에 남은 글자", value: 0 },
        { label: "트리의 노드 수", value: 2 },
        { label: "반환", value: "없음" },
      ],
    },
    {
      title: 'T3 insert("application") — 라벨을 가른다',
      detail:
        "라벨 apple 과 다섯 글자를 대조해 앞 네 글자 appl 까지 같다. 라벨 길이 5 보다 짧으므로 그 자리에서 가른다 — 중간 노드 appl 이 생기고, 옛 라벨은 e 로 줄고, 남은 ication 이 새 잎이 된다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "appl",
            label: "appl",
            status: "frontier",
            children: [
              { id: "apple", label: "e*", status: "visited" },
              { id: "application", label: "ication*", status: "active" },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("application")' },
        { label: "대조한 글자", value: 5 },
        { label: "도착한 노드의 라벨", value: "ication" },
        { label: "라벨에 남은 글자", value: 0 },
        { label: "트리의 노드 수", value: 4 },
        { label: "반환", value: "없음" },
      ],
    },
    {
      title: 'T4 insert("app") — 가른 자리에서 단어가 끝난다',
      detail:
        "라벨 appl 과 세 글자를 대조해 app 까지 같다. 또 가르는데, 이번에는 새 단어에 남는 글자가 없어 새 잎 대신 중간 노드 app 이 단어 끝이 된다. 옛 라벨은 l 로 줄어든다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "app",
            label: "app*",
            status: "active",
            children: [
              {
                id: "appl",
                label: "l",
                status: "visited",
                children: [
                  { id: "apple", label: "e*", status: "default" },
                  { id: "application", label: "ication*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("app")' },
        { label: "대조한 글자", value: 3 },
        { label: "도착한 노드의 라벨", value: "app" },
        { label: "라벨에 남은 글자", value: 0 },
        { label: "트리의 노드 수", value: 5 },
        { label: "반환", value: "없음" },
      ],
    },
    {
      title: 'T5 insert("appl") — 라벨을 전부 소비하며 내려간다',
      detail:
        "라벨 app 을 전부 소비해 내려가고, 남은 l 로 라벨 l 을 또 전부 소비한다. 남은 글자가 없어졌으므로 그 자리 노드에 단어 끝 표시만 남긴다 — 새 노드가 0 개다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "app",
            label: "app*",
            status: "visited",
            children: [
              {
                id: "appl",
                label: "l*",
                status: "active",
                children: [
                  { id: "apple", label: "e*", status: "default" },
                  { id: "application", label: "ication*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'insert("appl")' },
        { label: "대조한 글자", value: 4 },
        { label: "도착한 노드의 라벨", value: "l" },
        { label: "라벨에 남은 글자", value: 0 },
        { label: "트리의 노드 수", value: 5 },
        { label: "반환", value: "없음" },
      ],
    },
    {
      title: 'T6 search("app")',
      detail:
        "라벨 app 과 세 글자를 대조해 문자열이 라벨 끝에서 정확히 떨어진다. 라벨에 남은 글자가 0 이고 단어 끝 표시도 있으므로 참이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "app",
            label: "app*",
            status: "active",
            children: [
              {
                id: "appl",
                label: "l*",
                status: "default",
                children: [
                  { id: "apple", label: "e*", status: "default" },
                  { id: "application", label: "ication*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'search("app")' },
        { label: "대조한 글자", value: 3 },
        { label: "도착한 노드의 라벨", value: "app" },
        { label: "라벨에 남은 글자", value: 0 },
        { label: "트리의 노드 수", value: 5 },
        { label: "반환", value: "true" },
      ],
    },
    {
      title: 'T7 search("appli")',
      detail:
        "app 과 l 을 지나 남은 한 글자 i 가 라벨 ication 의 첫 글자와 같다. 문자열이 라벨 한가운데서 끝났고 라벨에 6 글자가 남는다 — 담긴 단어가 아니므로 거짓이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "app",
            label: "app*",
            status: "visited",
            children: [
              {
                id: "appl",
                label: "l*",
                status: "visited",
                children: [
                  { id: "apple", label: "e*", status: "default" },
                  { id: "application", label: "ication*", status: "active" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'search("appli")' },
        { label: "대조한 글자", value: 5 },
        { label: "도착한 노드의 라벨", value: "ication" },
        { label: "라벨에 남은 글자", value: 6 },
        { label: "트리의 노드 수", value: 5 },
        { label: "반환", value: "false" },
      ],
    },
    {
      title: 'T8 startsWith("appli")',
      detail:
        "T7 과 같은 노드에 같은 경로로 도착했고 라벨에 남은 글자도 6 으로 같다. 트리는 글자 하나 다르지 않은데 반환값이 갈린다 — 남은 글자도 단어 끝 표시도 보지 않기 때문이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "app",
            label: "app*",
            status: "visited",
            children: [
              {
                id: "appl",
                label: "l*",
                status: "visited",
                children: [
                  { id: "apple", label: "e*", status: "default" },
                  { id: "application", label: "ication*", status: "active" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'startsWith("appli")' },
        { label: "대조한 글자", value: 5 },
        { label: "도착한 노드의 라벨", value: "ication" },
        { label: "라벨에 남은 글자", value: 6 },
        { label: "트리의 노드 수", value: 5 },
        { label: "반환", value: "true" },
      ],
    },
    {
      title: 'T9 search("applied")',
      detail:
        "노드 appl 에서 남은 ied 를 라벨 ication 과 대조하면 i 까지 같고 둘째 글자에서 어긋난다. 첫 글자가 같은 자식은 이것 하나뿐이라 갈 곳이 없다.",
      root: {
        id: "root",
        label: "(root)",
        status: "visited",
        children: [
          {
            id: "app",
            label: "app*",
            status: "visited",
            children: [
              {
                id: "appl",
                label: "l*",
                status: "active",
                children: [
                  { id: "apple", label: "e*", status: "default" },
                  { id: "application", label: "ication*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'search("applied")' },
        { label: "대조한 글자", value: 6 },
        { label: "도착한 노드의 라벨", value: "없음" },
        { label: "라벨에 남은 글자", value: "-" },
        { label: "트리의 노드 수", value: 5 },
        { label: "반환", value: "false" },
      ],
    },
    {
      title: 'T10 startsWith("bat")',
      detail:
        "뿌리에 b 로 시작하는 자식이 없다. 글자를 한 번도 대조하지 않고 거짓을 낸다 — 자식 맵 조회 한 번으로 끝난다.",
      root: {
        id: "root",
        label: "(root)",
        status: "active",
        children: [
          {
            id: "app",
            label: "app*",
            status: "default",
            children: [
              {
                id: "appl",
                label: "l*",
                status: "default",
                children: [
                  { id: "apple", label: "e*", status: "default" },
                  { id: "application", label: "ication*", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: 'startsWith("bat")' },
        { label: "대조한 글자", value: 0 },
        { label: "도착한 노드의 라벨", value: "없음" },
        { label: "라벨에 남은 글자", value: "-" },
        { label: "트리의 노드 수", value: 5 },
        { label: "반환", value: "false" },
      ],
    },
  ] satisfies Frame[],
};
