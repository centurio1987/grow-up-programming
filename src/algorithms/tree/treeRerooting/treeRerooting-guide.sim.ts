import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`tree` 카테고리의 네 번째 편이다.** `treeDiameter`(W2) · `lowestCommonAncestor`(배치1) ·
 * `heavyLightDecomposition`(배치3)이 세운 규약을 이어받는다.
 *
 * 1. **이어받음 — `root` 는 그 걸음 끝의 구조 전체다.** 프레임마다 트리 한 벌을 통째로 적는다.
 * 2. **이어받음 — 기준 뿌리가 끝까지 정점 0 으로 고정이다.** 이 절차는 기준 뿌리를 한 번
 *    정하고 그 위에서 `size` 와 `depth` 를 재므로, 그림에서 뿌리가 움직이면 그것이 절차의
 *    자유도로 읽힌다. 답 `answer[v]` 는 「정점 `v` 를 뿌리로 삼았을 때의 거리 합」이지만
 *    **그림의 뿌리가 옮겨 가는 것이 아니다** — 그 구분이 이 편의 핵심이라 그림에서 뿌리를
 *    옮기면 글과 그림이 어긋난다.
 * 3. **이어받음 — `label` 이 글자 하나가 아니라 둘을 담는다**(`1 · 3` 꼴). 정점 번호와 그
 *    시점의 `size[v]` 다. **뜻을 끝까지 바꾸지 않는다** — 답 `answer[v]` 를 같은 자리에 섞으면
 *    같은 자리의 숫자가 걸음마다 다른 것을 뜻하게 된다. `size` 는 1 로 시작하므로 첫 걸음의
 *    `1` 은 「아직 안 정했다」가 아니라 실제 배열 값이다.
 * 4. **이어받음 — `children` 에 `null` 을 넣지 않는다.** 이 트리에는 「빈 자리」가 없다.
 * 5. **늘었다 — 상태 값 넷이 국면마다 다른 축을 뜻한다.** 첫 순회(T1~T4)에서는 `active` 이
 *    걸음에 꺼낸 정점 · `frontier` 스택에 담긴 정점 · `visited` 이미 꺼낸 정점 · `default`
 *    아직 안 담긴 정점이다. 크기 누적(T5~T6)에서는 `active` 이 걸음에 `size` 가 바뀐 정점 ·
 *    `visited` 부모에 이미 더해진 정점 · `default` 아직이다. 답 전파(T7~T10)에서는 `active`
 *    이 걸음에 답을 정한 정점 · `visited` 답이 이미 정해진 정점 · `default` 아직이다.
 *    값을 늘리면 색이 여덟 가지가 되어 그림을 읽을 수 없다.
 *
 * **`tree` 가 못 담는 것을 `keyValue` 가 진다.** 셋이다 — ① **방문 순서 `order`** 는 정점을
 * 한 줄로 늘어놓은 것이라 위에서 아래로 가는 간선으로 그릴 수 없다. ② **스택의 내용**은
 * 걸음마다 길이가 달라지는 목록이라 노드에 붙일 자리가 없다. ③ **답 `answer`** 는 라벨을
 * 두 뜻으로 쓰지 않기로 한 규약(3번) 때문에 노드 밖에 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const rerootWalk = {
  view: ["tree", "keyValue"] as const,
  title: "treeRerooting(7, [[0,1],[0,2],[1,3],[1,4],[2,5],[5,6]])",
  result: "[11, 12, 12, 17, 17, 15, 20]",
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      detail:
        "무방향 간선 하나를 양쪽 정점의 목록에 넣는다. size 는 전부 1 로 시작하고 아직 아무것도 더하지 않았다. 그림은 기준 뿌리로 정한 정점 0 을 맨 위에 놓고 그린 것이다.",
      root: {
        id: 0,
        label: "0 · 1",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "default",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              { id: 4, label: "4 · 1", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 1",
                status: "default",
                children: [{ id: 6, label: "6 · 1", status: "default" }],
              },
            ],
          },
        ],
      },
      entries: [
        {
          label: "near",
          value: "0:[1,2] 1:[0,3,4] 2:[0,5] 3:[1] 4:[1] 5:[2,6] 6:[5]",
        },
        { label: "방문 순서 order", value: "[]" },
        { label: "스택", value: "[0]" },
        { label: "부분트리 크기 size", value: "1 1 1 1 1 1 1" },
        { label: "답 answer", value: "0 0 0 0 0 0 0" },
      ],
    },
    {
      title: "T2 스택에서 정점 0 을 꺼내고 이웃 둘을 담는다",
      detail:
        "정점 0 을 방문 순서에 적고, 아직 안 지나간 이웃 1 과 2 에 부모 0 과 깊이 1 을 적어 스택에 담는다. 스택은 배열이라 깊이가 호출 스택 한계를 받지 않는다.",
      root: {
        id: 0,
        label: "0 · 1",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "frontier",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              { id: 4, label: "4 · 1", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "frontier",
            children: [
              {
                id: 5,
                label: "5 · 1",
                status: "default",
                children: [{ id: 6, label: "6 · 1", status: "default" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "방문 순서 order", value: "[0]" },
        { label: "스택", value: "[1, 2]" },
        { label: "부모 parent", value: "0:- 1:0 2:0 3:- 4:- 5:- 6:-" },
        { label: "깊이 depth", value: "0:0 1:1 2:1 3:- 4:- 5:- 6:-" },
        { label: "답 answer", value: "0 0 0 0 0 0 0" },
      ],
    },
    {
      title: "T3 스택 꼭대기부터 정점 2 · 5 · 6 을 차례로 꺼낸다",
      detail:
        "스택은 마지막에 담은 것부터 꺼내므로 정점 2 가 1 보다 먼저 나온다. 2 에서 5 로, 5 에서 6 으로 한 갈래를 끝까지 내려간 뒤 스택에 1 만 남는다.",
      root: {
        id: 0,
        label: "0 · 1",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "frontier",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              { id: 4, label: "4 · 1", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · 1",
                status: "visited",
                children: [{ id: 6, label: "6 · 1", status: "active" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "방문 순서 order", value: "[0, 2, 5, 6]" },
        { label: "스택", value: "[1]" },
        { label: "부모 parent", value: "0:- 1:0 2:0 3:- 4:- 5:2 6:5" },
        { label: "깊이 depth", value: "0:0 1:1 2:1 3:- 4:- 5:2 6:3" },
        { label: "답 answer", value: "0 0 0 0 0 0 0" },
      ],
    },
    {
      title: "T4 남은 정점 1 · 4 · 3 을 꺼내 방문 순서를 마친다",
      detail:
        "정점 1 을 꺼내며 자식 3 과 4 를 담고, 나중에 담은 4 를 먼저 꺼낸다. 스택이 비면 방문 순서 일곱 자리가 다 찼고 부모와 깊이도 전부 정해졌다.",
      root: {
        id: 0,
        label: "0 · 1",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "visited",
            children: [
              { id: 3, label: "3 · 1", status: "active" },
              { id: 4, label: "4 · 1", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · 1",
                status: "visited",
                children: [{ id: 6, label: "6 · 1", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "방문 순서 order", value: "[0, 2, 5, 6, 1, 4, 3]" },
        { label: "스택", value: "[]" },
        { label: "부모 parent", value: "0:- 1:0 2:0 3:1 4:1 5:2 6:5" },
        { label: "깊이 depth", value: "0:0 1:1 2:1 3:2 4:2 5:2 6:3" },
        { label: "답 answer", value: "0 0 0 0 0 0 0" },
      ],
    },
    {
      title:
        "T5 방문 순서의 뒤에서 앞으로 — 정점 3 · 4 · 1 의 크기를 부모에 더한다",
      detail:
        "order 의 마지막 자리부터 읽는다. 3 과 4 가 각각 부모 1 에 1 을 더해 size[1] 이 3 이 되고, 그다음 1 이 부모 0 에 3 을 더해 size[0] 이 4 가 된다. 자식이 언제나 부모보다 뒤에 있어서 부모 차례에는 그 크기가 이미 완성돼 있다.",
      root: {
        id: 0,
        label: "0 · 4",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "active",
            children: [
              { id: 3, label: "3 · 1", status: "visited" },
              { id: 4, label: "4 · 1", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 1",
                status: "default",
                children: [{ id: 6, label: "6 · 1", status: "default" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "방문 순서 order", value: "[0, 2, 5, 6, 1, 4, 3]" },
        { label: "읽은 자리", value: "i = 6, 5, 4 (정점 3, 4, 1)" },
        { label: "부분트리 크기 size", value: "4 3 1 1 1 1 1" },
        { label: "답 answer", value: "0 0 0 0 0 0 0" },
      ],
    },
    {
      title: "T6 남은 정점 6 · 5 · 2 의 크기를 더해 size 를 마친다",
      detail:
        "6 이 부모 5 에 더해져 size[5] 가 2, 5 가 부모 2 에 더해져 size[2] 가 3, 2 가 부모 0 에 더해져 size[0] 이 7 이 된다. size[0] 이 정점 수와 같아진 것이 이 배열이 완성됐다는 표시다.",
      root: {
        id: 0,
        label: "0 · 7",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "visited",
            children: [
              { id: 3, label: "3 · 1", status: "visited" },
              { id: 4, label: "4 · 1", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 3",
            status: "active",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "active",
                children: [{ id: 6, label: "6 · 1", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "읽은 자리", value: "i = 3, 2, 1 (정점 6, 5, 2)" },
        { label: "부분트리 크기 size", value: "7 3 3 1 1 2 1" },
        { label: "깊이 depth", value: "0:0 1:1 2:1 3:2 4:2 5:2 6:3" },
        { label: "답 answer", value: "0 0 0 0 0 0 0" },
      ],
    },
    {
      title: "T7 기준 뿌리의 답을 깊이의 합으로 구한다",
      detail:
        "뿌리 0 에서 정점 v 까지의 거리가 곧 depth[v] 이므로, 깊이를 그대로 더하면 0 의 답이 나온다. 0 + 1 + 1 + 2 + 2 + 2 + 3 = 11 이다.",
      root: {
        id: 0,
        label: "0 · 7",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "default",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              { id: 4, label: "4 · 1", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 3",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "default",
                children: [{ id: 6, label: "6 · 1", status: "default" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "깊이 depth", value: "0:0 1:1 2:1 3:2 4:2 5:2 6:3" },
        { label: "깊이의 합", value: "0+1+1+2+2+2+3 = 11" },
        { label: "부분트리 크기 size", value: "7 3 3 1 1 2 1" },
        { label: "답 answer", value: "11 0 0 0 0 0 0" },
      ],
    },
    {
      title: "T8 방문 순서대로 정점 2 · 5 · 6 의 답을 낸다",
      detail:
        "부모의 답에 n − 2·size 를 더한다. answer[2] = 11 + 7 − 2·3 = 12, answer[5] = 12 + 7 − 2·2 = 15, answer[6] = 15 + 7 − 2·1 = 20 이다. 순서가 order 그대로라 부모의 답이 언제나 먼저 정해져 있다.",
      root: {
        id: 0,
        label: "0 · 7",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "default",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              { id: 4, label: "4 · 1", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 3",
            status: "active",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "active",
                children: [{ id: 6, label: "6 · 1", status: "active" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "쓴 식", value: "answer[w] = answer[p] + 7 − 2·size[w]" },
        { label: "정점 2", value: "11 + 7 − 6 = 12" },
        { label: "정점 5", value: "12 + 7 − 4 = 15" },
        { label: "정점 6", value: "15 + 7 − 2 = 20" },
        { label: "답 answer", value: "11 0 12 0 0 15 20" },
      ],
    },
    {
      title: "T9 정점 1 의 답을 낸다",
      detail:
        "정점 1 의 부모도 0 이고 size[1] 도 3 이라 answer[1] = 11 + 7 − 2·3 = 12 로 정점 2 와 같은 값이 나온다. 부분트리 크기가 같으면 답이 같다는 것을 여기서 값으로 확인할 수 있다.",
      root: {
        id: 0,
        label: "0 · 7",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "active",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              { id: 4, label: "4 · 1", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 3",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "visited",
                children: [{ id: 6, label: "6 · 1", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "쓴 식", value: "answer[1] = answer[0] + 7 − 2·size[1]" },
        { label: "정점 1", value: "11 + 7 − 6 = 12" },
        { label: "부분트리 크기 size", value: "7 3 3 1 1 2 1" },
        { label: "답 answer", value: "11 12 12 0 0 15 20" },
      ],
    },
    {
      title: "T10 마지막 정점 4 · 3 의 답을 내고 배열을 반환한다",
      detail:
        "answer[4] = 12 + 7 − 2·1 = 17 이고 answer[3] 도 같은 식으로 17 이다. 방문 순서를 한 번 읽는 것으로 일곱 정점의 답이 전부 채워졌다.",
      root: {
        id: 0,
        label: "0 · 7",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "visited",
            children: [
              { id: 3, label: "3 · 1", status: "active" },
              { id: 4, label: "4 · 1", status: "active" },
            ],
          },
          {
            id: 2,
            label: "2 · 3",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "visited",
                children: [{ id: 6, label: "6 · 1", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "정점 4", value: "12 + 7 − 2 = 17" },
        { label: "정점 3", value: "12 + 7 − 2 = 17" },
        { label: "답 answer", value: "11 12 12 17 17 15 20" },
        { label: "반환", value: "[11, 12, 12, 17, 17, 15, 20]" },
      ],
    },
  ] satisfies Frame[],
};
