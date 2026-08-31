import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`tree` 카테고리의 첫 편이고, `tree` 뷰에서 뿌리가 도중에 바뀌는 첫 편이다.**
 * `trie`(`S12`)가 박고 `radixTree`(`S13`)가 넓힌 다섯 규약 중 셋을 그대로 이어받고 둘이
 * 어긋난다. 어긋나는 자리와 사유를 여기 적는다.
 *
 * 1. **이어받음 — `root` 는 그 걸음 끝의 구조 전체다.** 프레임마다 트리 한 벌을 통째로 적는다.
 * 2. **어긋남 — 뿌리가 T5 와 T6 사이에서 0 에서 6 으로 바뀐다.** 앞선 두 편은 자료구조의
 *    뿌리가 고정이었지만, 이 절차는 **같은 트리를 다른 정점에서 다시 본다**는 것이 요점이다.
 *    뿌리를 고정해 두고 거리만 갈아 끼우면 「다시 시작한다」가 그림에서 사라진다.
 * 3. **어긋남 — `label` 이 글자 하나가 아니라 셋을 담는다**(`3 ←4 · 6` 꼴). 정점 번호 ·
 *    부모와 잇는 간선의 가중치 · 시작점에서 그 정점까지의 거리다. `TreeFrame` 에는 간선마다의
 *    표기가 없어서, 가중치를 자식 라벨에 붙이지 않으면 그림에서 통째로 사라진다. 뿌리는
 *    부모가 없으므로 화살표 없이 `0 · 0` 이다. 거리를 아직 안 정한 정점은 `–` 로 둔다.
 * 4. **이어받음 — `children` 에 `null` 을 넣지 않는다.** 이 트리에는 「빈 자리」가 없다.
 * 5. **이어받음 — `nodeStatus` 대신 노드의 `status` 를 쓰고 값 넷을 한 축으로 나눈다.**
 *    `default` 거리를 아직 안 정했다 · `frontier` 스택에 들어 있다 · `active` 이 걸음에서
 *    꺼내 이웃을 본 정점 · `visited` 꺼내서 처리를 마쳤다.
 *
 * `keyValue` 는 트리가 못 담는 것을 진다 — 지금 어느 탐색인지, 스택의 내용, 거리 배열 전체,
 * 지금까지 가장 먼 정점, 그리고 실행된 갈래. 트리 그림만으로는 **스택 순서**가 안 보이는데
 * 이 절차가 다음에 어느 정점을 꺼내는지가 그것으로 정해진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const diameterWalk = {
  view: ["tree", "keyValue"] as const,
  title: "treeDiameter(7, [[0,1,2],[0,2,3],[1,3,4],[1,4,1],[2,5,5],[5,6,2]])",
  result: "16",
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      detail:
        "무방향이라 간선 하나를 양쪽 정점의 목록에 넣는다. 아직 아무 거리도 안 정했다. 그림은 정점 0 을 뿌리로 놓고 그린 것이고, 트리 자체에 뿌리가 있는 것은 아니다.",
      root: {
        id: 0,
        label: "0 · –",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 ←2 · –",
            status: "default",
            children: [
              { id: 3, label: "3 ←4 · –", status: "default" },
              { id: 4, label: "4 ←1 · –", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 ←3 · –",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 ←5 · –",
                status: "default",
                children: [{ id: 6, label: "6 ←2 · –", status: "default" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 탐색", value: "—" },
        { label: "지금 꺼낸 정점", value: "—" },
        { label: "스택", value: "[]" },
        { label: "거리 dist", value: "0:– 1:– 2:– 3:– 4:– 5:– 6:–" },
        { label: "가장 먼 정점", value: "—" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 첫 탐색 — 정점 0 을 꺼낸다",
      detail:
        "정점 0 을 스택에 넣고 거리를 0 으로 둔 뒤 꺼낸다. 이웃 1 과 2 의 거리가 2 와 3 으로 정해지고 둘 다 스택에 들어간다. 지금까지 가장 먼 정점은 2 다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 ←2 · 2",
            status: "frontier",
            children: [
              { id: 3, label: "3 ←4 · –", status: "default" },
              { id: 4, label: "4 ←1 · –", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 ←3 · 3",
            status: "frontier",
            children: [
              {
                id: 5,
                label: "5 ←5 · –",
                status: "default",
                children: [{ id: 6, label: "6 ←2 · –", status: "default" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 탐색", value: "첫 번째 — 0 에서" },
        { label: "지금 꺼낸 정점", value: "0" },
        { label: "스택", value: "[1, 2]" },
        { label: "거리 dist", value: "0:0 1:2 2:3 3:– 4:– 5:– 6:–" },
        { label: "가장 먼 정점", value: "2 (거리 3)" },
        { label: "분기", value: "② 더 먼 정점을 찾아 기록을 옮긴다 (두 번)" },
      ],
    },
    {
      title: "T3 정점 2 를 꺼낸다",
      detail:
        "스택은 나중에 넣은 것을 먼저 꺼낸다. 정점 2 의 이웃은 0 과 5 인데 0 은 거리가 이미 정해져 건너뛴다. 5 의 거리가 3 + 5 로 8 이 된다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 ←2 · 2",
            status: "frontier",
            children: [
              { id: 3, label: "3 ←4 · –", status: "default" },
              { id: 4, label: "4 ←1 · –", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 ←3 · 3",
            status: "active",
            children: [
              {
                id: 5,
                label: "5 ←5 · 8",
                status: "frontier",
                children: [{ id: 6, label: "6 ←2 · –", status: "default" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 탐색", value: "첫 번째 — 0 에서" },
        { label: "지금 꺼낸 정점", value: "2" },
        { label: "스택", value: "[1, 5]" },
        { label: "거리 dist", value: "0:0 1:2 2:3 3:– 4:– 5:8 6:–" },
        { label: "가장 먼 정점", value: "5 (거리 8)" },
        { label: "분기", value: "① 정점 0 을 건너뛴다 · ② 기록을 5 로 옮긴다" },
      ],
    },
    {
      title: "T4 정점 5 를 꺼낸다",
      detail:
        "정점 5 의 이웃은 2 와 6 이고 2 는 건너뛴다. 6 의 거리가 8 + 2 로 10 이 된다. 정점 0 에서 가장 먼 곳이 여기다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 ←2 · 2",
            status: "frontier",
            children: [
              { id: 3, label: "3 ←4 · –", status: "default" },
              { id: 4, label: "4 ←1 · –", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 ←3 · 3",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 ←5 · 8",
                status: "active",
                children: [{ id: 6, label: "6 ←2 · 10", status: "frontier" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 탐색", value: "첫 번째 — 0 에서" },
        { label: "지금 꺼낸 정점", value: "5" },
        { label: "스택", value: "[1, 6]" },
        { label: "거리 dist", value: "0:0 1:2 2:3 3:– 4:– 5:8 6:10" },
        { label: "가장 먼 정점", value: "6 (거리 10)" },
        {
          label: "분기",
          value: "① 정점 2 를 건너뛴다 · ② 기록을 6 으로 옮긴다",
        },
      ],
    },
    {
      title: "T5 남은 정점 넷을 꺼내고 첫 탐색이 끝난다",
      detail:
        "6 · 1 · 4 · 3 을 차례로 꺼낸다. 정점 1 에서 3 과 4 의 거리가 6 과 3 으로 정해지는데 둘 다 10 보다 작아 기록이 안 바뀐다. 스택이 비면서 첫 탐색이 끝나고, 정점 0 에서 가장 먼 곳은 거리 10 의 정점 6 이다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 ←2 · 2",
            status: "visited",
            children: [
              { id: 3, label: "3 ←4 · 6", status: "active" },
              { id: 4, label: "4 ←1 · 3", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 ←3 · 3",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 ←5 · 8",
                status: "visited",
                children: [{ id: 6, label: "6 ←2 · 10", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 탐색", value: "첫 번째 — 0 에서" },
        { label: "지금 꺼낸 정점", value: "3" },
        { label: "스택", value: "[]" },
        { label: "거리 dist", value: "0:0 1:2 2:3 3:6 4:3 5:8 6:10" },
        { label: "가장 먼 정점", value: "6 (거리 10)" },
        {
          label: "분기",
          value: "① 지나온 정점을 건너뛴다 (네 번) · ③ 첫 탐색이 끝났다",
        },
      ],
    },
    {
      title: "T6 둘째 탐색 — 정점 6 을 뿌리로 다시 잰다",
      detail:
        "거리 배열을 새로 만들고 6 에서 시작한다. 6 · 5 · 2 를 꺼내면서 5 가 2, 2 가 7, 0 이 10 이 된다. **그림의 뿌리가 0 에서 6 으로 바뀐 자리다** — 트리는 그대로이고 어디서 보는지만 달라졌다.",
      root: {
        id: 6,
        label: "6 · 0",
        status: "visited",
        children: [
          {
            id: 5,
            label: "5 ←2 · 2",
            status: "visited",
            children: [
              {
                id: 2,
                label: "2 ←5 · 7",
                status: "active",
                children: [
                  {
                    id: 0,
                    label: "0 ←3 · 10",
                    status: "frontier",
                    children: [
                      {
                        id: 1,
                        label: "1 ←2 · –",
                        status: "default",
                        children: [
                          { id: 3, label: "3 ←4 · –", status: "default" },
                          { id: 4, label: "4 ←1 · –", status: "default" },
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
        { label: "지금 하는 탐색", value: "두 번째 — 6 에서" },
        { label: "지금 꺼낸 정점", value: "2" },
        { label: "스택", value: "[0]" },
        { label: "거리 dist", value: "0:10 1:– 2:7 3:– 4:– 5:2 6:0" },
        { label: "가장 먼 정점", value: "0 (거리 10)" },
        {
          label: "분기",
          value: "① 지나온 정점을 건너뛴다 (두 번) · ② 기록을 0 으로 옮긴다",
        },
      ],
    },
    {
      title: "T7 정점 0 과 1 을 꺼낸다",
      detail:
        "0 을 꺼내면 1 의 거리가 12 가 되고, 1 을 꺼내면 3 이 16, 4 가 13 이 된다. 16 이 12 보다 크므로 기록이 정점 3 으로 옮겨 간다.",
      root: {
        id: 6,
        label: "6 · 0",
        status: "visited",
        children: [
          {
            id: 5,
            label: "5 ←2 · 2",
            status: "visited",
            children: [
              {
                id: 2,
                label: "2 ←5 · 7",
                status: "visited",
                children: [
                  {
                    id: 0,
                    label: "0 ←3 · 10",
                    status: "visited",
                    children: [
                      {
                        id: 1,
                        label: "1 ←2 · 12",
                        status: "active",
                        children: [
                          { id: 3, label: "3 ←4 · 16", status: "frontier" },
                          { id: 4, label: "4 ←1 · 13", status: "frontier" },
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
        { label: "지금 하는 탐색", value: "두 번째 — 6 에서" },
        { label: "지금 꺼낸 정점", value: "1" },
        { label: "스택", value: "[3, 4]" },
        { label: "거리 dist", value: "0:10 1:12 2:7 3:16 4:13 5:2 6:0" },
        { label: "가장 먼 정점", value: "3 (거리 16)" },
        { label: "분기", value: "② 기록을 1 로, 다시 3 으로 옮긴다" },
      ],
    },
    {
      title: "T8 스택이 비고 16 을 반환한다",
      detail:
        "4 와 3 을 꺼내면 이웃이 전부 이미 정해져 있어 할 일이 없다. 스택이 비면서 둘째 탐색이 끝나고, 정점 6 에서 가장 먼 곳은 거리 16 의 정점 3 이다. 지름 경로는 3 - 1 - 0 - 2 - 5 - 6 이고 4 + 2 + 3 + 5 + 2 = 16 이다.",
      root: {
        id: 6,
        label: "6 · 0",
        status: "visited",
        children: [
          {
            id: 5,
            label: "5 ←2 · 2",
            status: "visited",
            children: [
              {
                id: 2,
                label: "2 ←5 · 7",
                status: "visited",
                children: [
                  {
                    id: 0,
                    label: "0 ←3 · 10",
                    status: "visited",
                    children: [
                      {
                        id: 1,
                        label: "1 ←2 · 12",
                        status: "visited",
                        children: [
                          { id: 3, label: "3 ←4 · 16", status: "visited" },
                          { id: 4, label: "4 ←1 · 13", status: "visited" },
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
        { label: "지금 하는 탐색", value: "두 번째 — 6 에서" },
        { label: "지금 꺼낸 정점", value: "3" },
        { label: "스택", value: "[]" },
        { label: "거리 dist", value: "0:10 1:12 2:7 3:16 4:13 5:2 6:0" },
        { label: "가장 먼 정점", value: "3 (거리 16)" },
        { label: "분기", value: "④ 둘째 탐색의 최댓값 16 을 반환한다" },
      ],
    },
  ] satisfies Frame[],
};
