import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`tree` 카테고리의 두 번째 편이다.** `treeDiameter`(W2)가 세운 다섯 규약 중 넷을 그대로
 * 이어받고 하나가 어긋난다. 어긋나는 자리와 사유를 여기 적는다.
 *
 * 1. **이어받음 — `root` 는 그 걸음 끝의 구조 전체다.** 프레임마다 트리 한 벌을 통째로 적는다.
 * 2. **어긋남 — 뿌리가 끝까지 정점 0 으로 고정이다.** `treeDiameter` 는 두 번째 탐색에서
 *    뿌리를 갈아 끼웠지만, 이 절차는 **뿌리가 문제 입력의 일부**라 바뀌면 답이 달라진다.
 *    그림에서 뿌리가 움직이면 그것이 절차의 자유도로 읽힌다.
 * 3. **이어받음 — `label` 이 글자 하나가 아니라 둘을 담는다**(`3 · 2` 꼴). 정점 번호와 뿌리
 *    에서 그 정점까지의 깊이다. 깊이를 아직 안 정한 정점은 `–` 로 둔다. 조상 표는 정점마다
 *    네 값이라 라벨에 넣으면 그림이 안 읽혀서 `keyValue` 가 진다.
 * 4. **이어받음 — `children` 에 `null` 을 넣지 않는다.** 이 트리에는 「빈 자리」가 없다.
 * 5. **이어받음이되 뜻이 하나 늘었다 — 노드의 `status` 값 넷을 한 축으로 쓴다.**
 *    전처리 걸음(T1~T4)에서는 `treeDiameter` 와 같다 — `default` 아직 안 봤다 ·
 *    `visited` 처리를 마쳤다 · `active` 이 걸음의 주인공이다. **질의 걸음(T5~T10)에서는
 *    같은 값이 질의 안의 자리를 뜻한다** — `active` 지금 `u` 나 `v` 가 서 있는 정점 ·
 *    `visited` 이 질의에서 지나온 정점 · `frontier` 이 질의의 답 · `default` 이 질의와
 *    상관없는 정점. 값을 늘리면 색이 여덟 가지가 되어 그림이 못 읽힌다.
 *
 * `keyValue` 는 트리가 못 담는 것을 진다 — 조상 표의 각 열, 지금 처리하는 질의, `u` 와 `v`,
 * 깊이 차이, 그리고 실행된 갈래.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const lcaWalk = {
  view: ["tree", "keyValue"] as const,
  title:
    "lowestCommonAncestor(9, [[0,1],[0,2],[1,3],[1,4],[2,5],[3,6],[5,7],[5,8]], 0, [[6,4],[6,7],[3,6],[8,7]])",
  result: "[1, 0, 3, 5]",
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      detail:
        "무방향이라 간선 하나를 양쪽 정점의 목록에 넣는다. 아직 어느 정점의 깊이도 정하지 않았다. 그림은 뿌리로 지정된 정점 0 을 맨 위에 놓고 그린 것이다.",
      root: {
        id: 0,
        label: "0 · –",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · –",
            status: "default",
            children: [
              {
                id: 3,
                label: "3 · –",
                status: "default",
                children: [{ id: 6, label: "6 · –", status: "default" }],
              },
              { id: 4, label: "4 · –", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · –",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · –",
                status: "default",
                children: [
                  { id: 7, label: "7 · –", status: "default" },
                  { id: 8, label: "8 · –", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "이웃 목록 만들기" },
        { label: "깊이 depth", value: "전부 아직 없음" },
        { label: "anc[·][0] 부모", value: "전부 아직 없음" },
        { label: "지금 처리하는 질의", value: "—" },
        { label: "u, v", value: "—" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 뿌리에서 한 번 따라가 깊이와 부모를 정한다",
      detail:
        "정점 0 을 스택에 넣고 꺼낼 때마다 이웃을 본다. 이미 지나온 정점은 건너뛰므로 각 정점이 정확히 한 번씩 자식이 되고, 그때 깊이와 부모가 한꺼번에 정해진다. 뿌리의 부모는 자기 자신으로 둔다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "visited",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "visited",
                children: [{ id: 6, label: "6 · 3", status: "visited" }],
              },
              { id: 4, label: "4 · 2", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "visited",
                children: [
                  { id: 7, label: "7 · 3", status: "visited" },
                  { id: 8, label: "8 · 3", status: "visited" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "깊이와 부모 정하기" },
        { label: "깊이 depth", value: "0:0 1:1 2:1 3:2 4:2 5:2 6:3 7:3 8:3" },
        { label: "anc[·][0] 부모", value: "0 0 0 1 1 2 3 5 5" },
        { label: "지금 처리하는 질의", value: "—" },
        { label: "u, v", value: "—" },
        { label: "분기", value: "① 이미 지나온 정점을 건너뛴다 (여덟 번)" },
      ],
    },
    {
      title: "T3 두 칸 위 조상 열을 채운다",
      detail:
        "anc[v][1] 은 anc[v][0] 의 anc[·][0] 이다. 깊이가 2 이상인 정점만 실제 조상이 나오고 나머지는 뿌리 0 에 머문다. 색이 진한 셋(6·7·8)이 두 칸 위에 실제 조상이 있는 정점이다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "visited",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "visited",
                children: [{ id: 6, label: "6 · 3", status: "active" }],
              },
              { id: 4, label: "4 · 2", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "visited",
                children: [
                  { id: 7, label: "7 · 3", status: "active" },
                  { id: 8, label: "8 · 3", status: "active" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "anc[·][1] 채우기" },
        { label: "깊이 depth", value: "0:0 1:1 2:1 3:2 4:2 5:2 6:3 7:3 8:3" },
        { label: "anc[·][0] 부모", value: "0 0 0 1 1 2 3 5 5" },
        { label: "anc[·][1] 두 칸 위", value: "0 0 0 0 0 0 1 2 2" },
        { label: "u, v", value: "—" },
        {
          label: "분기",
          value: "② 두 칸 위는 한 칸 위의 한 칸 위다 (아홉 번)",
        },
      ],
    },
    {
      title: "T4 네 칸 위와 여덟 칸 위 열을 채우고 표가 완성된다",
      detail:
        "정점이 아홉 개라 열 수가 넷이다. 가장 깊은 정점의 깊이가 3 이므로 네 칸 위와 여덟 칸 위는 어느 정점에서도 뿌리를 넘어가고, 그래서 두 열이 통째로 뿌리 0 이 된다. 표는 이제 바뀌지 않는다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "visited",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "visited",
                children: [{ id: 6, label: "6 · 3", status: "visited" }],
              },
              { id: 4, label: "4 · 2", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "visited",
                children: [
                  { id: 7, label: "7 · 3", status: "visited" },
                  { id: 8, label: "8 · 3", status: "visited" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "anc[·][2] 와 anc[·][3] 채우기" },
        { label: "anc[·][0] 부모", value: "0 0 0 1 1 2 3 5 5" },
        { label: "anc[·][1] 두 칸 위", value: "0 0 0 0 0 0 1 2 2" },
        { label: "anc[·][2] 네 칸 위", value: "0 0 0 0 0 0 0 0 0" },
        { label: "anc[·][3] 여덟 칸 위", value: "0 0 0 0 0 0 0 0 0" },
        { label: "분기", value: "② 두 열을 더 채운다 (열여덟 번)" },
      ],
    },
    {
      title: "T5 질의 lca(6, 4) — 깊이를 맞춘다",
      detail:
        "정점 6 의 깊이가 3, 정점 4 의 깊이가 2 라 차이가 1 이다. 1 은 이진수로 1 이므로 0 번 자리 하나가 켜져 있고, u 를 anc[6][0] = 3 으로 한 번 올리면 깊이가 같아진다. 이제 u 는 3, v 는 4 다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "default",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "active",
                children: [{ id: 6, label: "6 · 3", status: "visited" }],
              },
              { id: 4, label: "4 · 2", status: "active" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "default",
                children: [
                  { id: 7, label: "7 · 3", status: "default" },
                  { id: 8, label: "8 · 3", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 처리하는 질의", value: "lca(6, 4)" },
        { label: "깊이 차이 gap", value: "3 - 2 = 1 (이진수 1)" },
        { label: "켜진 자리", value: "0 번 자리 하나" },
        { label: "u, v", value: "3, 4" },
        { label: "둘이 같은가", value: "아니다 — 단계 2 로 간다" },
        { label: "분기", value: "③ 깊은 쪽을 한 번 올린다" },
      ],
    },
    {
      title: "T6 질의 lca(6, 4) — 함께 올릴 자리가 없어 답이 바로 나온다",
      detail:
        "k 를 3·2·1·0 으로 내려가며 anc[3][k] 와 anc[4][k] 를 견준다. 네 자리에서 모두 같아 아무것도 올리지 않는다. 남은 것은 anc[3][0] = 1 이고 그것이 답이다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "frontier",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "active",
                children: [{ id: 6, label: "6 · 3", status: "visited" }],
              },
              { id: 4, label: "4 · 2", status: "active" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "default",
                children: [
                  { id: 7, label: "7 · 3", status: "default" },
                  { id: 8, label: "8 · 3", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 처리하는 질의", value: "lca(6, 4)" },
        { label: "k = 3", value: "anc[3][3] = 0 · anc[4][3] = 0 — 같다" },
        { label: "k = 2", value: "anc[3][2] = 0 · anc[4][2] = 0 — 같다" },
        { label: "k = 1", value: "anc[3][1] = 0 · anc[4][1] = 0 — 같다" },
        { label: "k = 0", value: "anc[3][0] = 1 · anc[4][0] = 1 — 같다" },
        { label: "답", value: "anc[3][0] = 1" },
      ],
    },
    {
      title: "T7 질의 lca(6, 7) — 깊이가 같아 곧바로 함께 올릴 자리를 찾는다",
      detail:
        "정점 6 과 7 은 깊이가 둘 다 3 이라 차이가 0 이고 올릴 것이 없다. 둘이 서로 다르므로 단계 2 로 간다. k = 3 과 k = 2 에서는 두 조상이 모두 뿌리 0 이라 같고, 그래서 올리지 않는다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "default",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "default",
                children: [{ id: 6, label: "6 · 3", status: "active" }],
              },
              { id: 4, label: "4 · 2", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "default",
                children: [
                  { id: 7, label: "7 · 3", status: "active" },
                  { id: 8, label: "8 · 3", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 처리하는 질의", value: "lca(6, 7)" },
        { label: "깊이 차이 gap", value: "3 - 3 = 0 — 올릴 것이 없다" },
        { label: "u, v", value: "6, 7" },
        { label: "k = 3", value: "anc[6][3] = 0 · anc[7][3] = 0 — 같다" },
        { label: "k = 2", value: "anc[6][2] = 0 · anc[7][2] = 0 — 같다" },
        { label: "분기", value: "③ 켜진 자리가 없어 아무것도 안 올린다" },
      ],
    },
    {
      title: "T8 질의 lca(6, 7) — 두 칸 위에서 갈라져 함께 올리고 답을 낸다",
      detail:
        "k = 1 에서 anc[6][1] = 1 과 anc[7][1] = 2 가 다르다. 두 칸을 올려도 아직 답 위로 넘어가지 않는다는 뜻이라 둘을 함께 올려 u = 1, v = 2 가 된다. k = 0 에서는 anc[1][0] 과 anc[2][0] 이 둘 다 0 이라 멈추고, anc[1][0] = 0 이 답이다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "active",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "default",
                children: [{ id: 6, label: "6 · 3", status: "visited" }],
              },
              { id: 4, label: "4 · 2", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "active",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "default",
                children: [
                  { id: 7, label: "7 · 3", status: "visited" },
                  { id: 8, label: "8 · 3", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 처리하는 질의", value: "lca(6, 7)" },
        { label: "k = 1", value: "anc[6][1] = 1 · anc[7][1] = 2 — 다르다" },
        { label: "u, v", value: "1, 2" },
        { label: "k = 0", value: "anc[1][0] = 0 · anc[2][0] = 0 — 같다" },
        { label: "답", value: "anc[1][0] = 0" },
        { label: "분기", value: "⑤ 갈라지는 자리에서만 함께 올린다" },
      ],
    },
    {
      title: "T9 질의 lca(3, 6) — 깊이를 맞춘 자리에서 이미 답이다",
      detail:
        "정점 6 이 정점 3 보다 한 칸 깊으므로 u 를 6, v 를 3 으로 두고 u 를 한 번 올린다. 그러면 u 도 3 이 되어 둘이 같아진다. 한쪽이 다른 쪽의 조상이었다는 뜻이고, 단계 2 로 가지 않고 3 을 그대로 답으로 낸다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "default",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "frontier",
                children: [{ id: 6, label: "6 · 3", status: "visited" }],
              },
              { id: 4, label: "4 · 2", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "default",
                children: [
                  { id: 7, label: "7 · 3", status: "default" },
                  { id: 8, label: "8 · 3", status: "default" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 처리하는 질의", value: "lca(3, 6)" },
        { label: "깊이 차이 gap", value: "3 - 2 = 1 (이진수 1)" },
        { label: "u, v", value: "3, 3" },
        { label: "둘이 같은가", value: "그렇다 — 단계 2 로 가지 않는다" },
        { label: "답", value: "3" },
        { label: "분기", value: "③ 한 번 올린다 · ④ 그 자리가 답이다" },
      ],
    },
    {
      title: "T10 질의 lca(8, 7) — 부모가 같아 네 자리 모두 같다",
      detail:
        "정점 8 과 7 은 깊이가 같고 부모도 같다. k = 3·2·1·0 네 자리에서 두 조상이 모두 같아 아무것도 올리지 않고, anc[8][0] = 5 가 답이다. 질의 넷이 끝나 [1, 0, 3, 5] 를 반환한다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "default",
            children: [
              {
                id: 3,
                label: "3 · 2",
                status: "default",
                children: [{ id: 6, label: "6 · 3", status: "default" }],
              },
              { id: 4, label: "4 · 2", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · 1",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "frontier",
                children: [
                  { id: 7, label: "7 · 3", status: "active" },
                  { id: 8, label: "8 · 3", status: "active" },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 처리하는 질의", value: "lca(8, 7)" },
        { label: "깊이 차이 gap", value: "3 - 3 = 0" },
        { label: "k = 1", value: "anc[8][1] = 2 · anc[7][1] = 2 — 같다" },
        { label: "k = 0", value: "anc[8][0] = 5 · anc[7][0] = 5 — 같다" },
        { label: "답", value: "anc[8][0] = 5" },
        { label: "반환값", value: "[1, 0, 3, 5]" },
      ],
    },
  ] satisfies Frame[],
};
