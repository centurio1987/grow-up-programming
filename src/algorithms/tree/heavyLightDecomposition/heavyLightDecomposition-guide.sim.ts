import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`tree` 카테고리의 세 번째 편이다.** `treeDiameter`(W2)와 `lowestCommonAncestor`(배치1)가
 * 세운 규약을 이어받고, 이 절차 때문에 하나가 늘었다.
 *
 * 1. **이어받음 — `root` 는 그 걸음 끝의 구조 전체다.** 프레임마다 트리 한 벌을 통째로 적는다.
 * 2. **이어받음 — 뿌리가 끝까지 정점 0 으로 고정이다.** `lowestCommonAncestor` 와 같은 이유다.
 *    이 절차도 뿌리가 문제 입력의 일부라 바뀌면 사슬도 답도 달라진다. 그림에서 뿌리가 움직이면
 *    그것이 절차의 자유도로 읽힌다. `treeDiameter` 가 두 번째 탐색에서 뿌리를 갈아 끼운 것과
 *    갈리는 자리이고, 갈리는 사유가 앞 편과 같다.
 * 3. **이어받음 — `label` 이 글자 하나가 아니라 둘을 담는다**(`4 · 3` 꼴). 정점 번호와 그
 *    정점의 부분트리 크기다. 아직 안 정한 정점은 `–` 로 둔다. **뜻을 끝까지 바꾸지 않는다** —
 *    자리 번호와 사슬 머리를 라벨에 섞으면 같은 자리의 글자가 걸음마다 다른 것을 뜻하게 된다.
 * 4. **이어받음 — `children` 에 `null` 을 넣지 않는다.** 이 트리에는 「빈 자리」가 없다.
 * 5. **늘었다 — 상태 값 넷이 전처리와 질의에서 다른 축을 뜻한다.** 전처리 걸음(T1~T6)에서는
 *    `default` 아직 이 값을 안 정했다 · `visited` 정했다 · `active` 이 걸음이 고른 정점 ·
 *    `frontier` 사슬의 머리다. 질의 걸음(T7~T10)에서는 `active` 마지막 구간에 든 정점 ·
 *    `visited` 앞 구간에서 이미 더한 정점 · `default` 이 연산과 상관없는 정점이다.
 *    값을 늘리면 색이 여덟 가지가 되어 그림을 읽을 수 없다.
 *
 * **`tree` 가 못 담는 것을 `keyValue` 가 진다.** 셋이다 — ① 자리 번호로 늘어놓은 **기저
 * 배열**은 트리가 아니라 한 줄이라 위에서 아래로 가는 간선으로 그릴 수 없다. ② **펜윅 트리**는
 * 정점이 아니라 배열 칸 위에 세운 다른 트리라, 같은 그림에 겹치면 두 트리가 한 트리로 읽힌다.
 * ③ 질의가 더한 **구간의 목록과 누적 합**은 걸음마다 늘어나는 값이라 노드에 붙일 자리가 없다.
 * `ahoCorasick`(S18)이 남긴 경고와 같은 자리다 — 담기지 않는 것을 억지로 그리면 없는 구조를
 * 보이게 된다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const hldWalk = {
  view: ["tree", "keyValue"] as const,
  title:
    "new HeavyLightDecomposition(9, [[0,1],[0,2],[1,5],[5,6],[2,3],[2,4],[4,7],[7,8]], 0, [1,2,3,4,5,6,7,8,9]) 에 queryPath(0,7) · queryPath(3,6) · update(4,100) · queryPath(8,6)",
  result: "[17, 23, 136]",
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      detail:
        "무방향 간선 하나를 양쪽 정점의 목록에 넣는다. 아직 어느 정점의 부분트리 크기도 정하지 않았다. 그림은 뿌리로 지정된 정점 0 을 맨 위에 놓고 그린 것이다.",
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
                id: 5,
                label: "5 · –",
                status: "default",
                children: [{ id: 6, label: "6 · –", status: "default" }],
              },
            ],
          },
          {
            id: 2,
            label: "2 · –",
            status: "default",
            children: [
              { id: 3, label: "3 · –", status: "default" },
              {
                id: 4,
                label: "4 · –",
                status: "default",
                children: [
                  {
                    id: 7,
                    label: "7 · –",
                    status: "default",
                    children: [{ id: 8, label: "8 · –", status: "default" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "이웃 목록 만들기" },
        { label: "부분트리 크기 size", value: "전부 아직 없음" },
        { label: "무거운 자식 heavy", value: "전부 아직 없음" },
        { label: "사슬 머리 head", value: "전부 아직 없음" },
        { label: "자리 번호 pos", value: "전부 아직 없음" },
        { label: "기저 배열", value: "전부 아직 없음" },
        { label: "지금 처리하는 연산", value: "—" },
        { label: "더한 구간과 합", value: "—" },
      ],
    },
    {
      title: "T2 뿌리에서 한 번 따라가 부모와 깊이를 정한다",
      detail:
        "정점 0 을 스택에 넣고 꺼낼 때마다 이웃을 본다. 이미 지나온 정점은 건너뛰므로 각 정점이 정확히 한 번씩 자식이 되고, 그때 부모와 깊이가 함께 정해진다. 꺼낸 순서 0 2 4 7 8 3 1 5 6 을 그대로 적어 둔다.",
      root: {
        id: 0,
        label: "0 · –",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · –",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 · –",
                status: "visited",
                children: [{ id: 6, label: "6 · –", status: "visited" }],
              },
            ],
          },
          {
            id: 2,
            label: "2 · –",
            status: "visited",
            children: [
              { id: 3, label: "3 · –", status: "visited" },
              {
                id: 4,
                label: "4 · –",
                status: "visited",
                children: [
                  {
                    id: 7,
                    label: "7 · –",
                    status: "visited",
                    children: [{ id: 8, label: "8 · –", status: "visited" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "부모와 깊이 정하기" },
        { label: "부분트리 크기 size", value: "전부 아직 없음" },
        { label: "무거운 자식 heavy", value: "전부 아직 없음" },
        { label: "사슬 머리 head", value: "전부 아직 없음" },
        { label: "자리 번호 pos", value: "전부 아직 없음" },
        { label: "기저 배열", value: "전부 아직 없음" },
        {
          label: "지금 처리하는 연산",
          value: "깊이 0:0 1:1 2:1 3:2 4:2 5:2 6:3 7:3 8:4",
        },
        { label: "더한 구간과 합", value: "—" },
      ],
    },
    {
      title: "T3 꺼낸 순서의 뒤에서 앞으로 오며 부분트리 크기를 더한다",
      detail:
        "자식이 언제나 부모보다 뒤에 있으므로, 부모 차례가 왔을 때 그 아래 정점이 이미 전부 합산돼 있다. 정점 아홉 개를 한 번씩만 보고 크기가 완성된다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 3",
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
          {
            id: 2,
            label: "2 · 5",
            status: "visited",
            children: [
              { id: 3, label: "3 · 1", status: "visited" },
              {
                id: 4,
                label: "4 · 3",
                status: "visited",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "visited",
                    children: [{ id: 8, label: "8 · 1", status: "visited" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "부분트리 크기 세기" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "전부 아직 없음" },
        { label: "사슬 머리 head", value: "전부 아직 없음" },
        { label: "자리 번호 pos", value: "전부 아직 없음" },
        { label: "기저 배열", value: "전부 아직 없음" },
        { label: "지금 처리하는 연산", value: "—" },
        { label: "더한 구간과 합", value: "—" },
      ],
    },
    {
      title: "T4 자식 중 부분트리가 가장 큰 것을 무거운 자식으로 고른다",
      detail:
        "갈래가 있는 정점은 0 과 2 둘뿐이다. 0 은 크기 3 인 1 과 크기 5 인 2 중 2 를 고르고, 2 는 크기 1 인 3 과 크기 3 인 4 중 4 를 고른다. 자식이 하나뿐인 정점은 고를 것이 없다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "frontier",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "active",
                children: [{ id: 6, label: "6 · 1", status: "active" }],
              },
            ],
          },
          {
            id: 2,
            label: "2 · 5",
            status: "active",
            children: [
              { id: 3, label: "3 · 1", status: "frontier" },
              {
                id: 4,
                label: "4 · 3",
                status: "active",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "active",
                    children: [{ id: 8, label: "8 · 1", status: "active" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "무거운 자식 고르기" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "0→2 1→5 2→4 4→7 5→6 7→8" },
        { label: "사슬 머리 head", value: "전부 아직 없음" },
        { label: "자리 번호 pos", value: "전부 아직 없음" },
        { label: "기저 배열", value: "전부 아직 없음" },
        { label: "지금 처리하는 연산", value: "가벼운 자식은 1 과 3 둘" },
        { label: "더한 구간과 합", value: "—" },
      ],
    },
    {
      title:
        "T5 사슬 머리에서 무거운 자식을 끝까지 따라가며 자리 번호를 붙인다",
      detail:
        "머리 0 에서 0→2→4→7→8 을 이어 0 번부터 4 번 자리를 준다. 그 도중에 만난 가벼운 자식 1 과 3 이 새 머리가 되어, 3 이 5 번 자리를, 1→5→6 이 6·7·8 번 자리를 받는다. 사슬 셋이 자리 번호에서 서로 겹치지 않는다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "frontier",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "visited",
                children: [{ id: 6, label: "6 · 1", status: "visited" }],
              },
            ],
          },
          {
            id: 2,
            label: "2 · 5",
            status: "visited",
            children: [
              { id: 3, label: "3 · 1", status: "frontier" },
              {
                id: 4,
                label: "4 · 3",
                status: "visited",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "visited",
                    children: [{ id: 8, label: "8 · 1", status: "visited" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "사슬 머리와 자리 번호 붙이기" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "0→2 1→5 2→4 4→7 5→6 7→8" },
        {
          label: "사슬 머리 head",
          value: "0:0 1:1 2:0 3:3 4:0 5:1 6:1 7:0 8:0",
        },
        {
          label: "자리 번호 pos",
          value: "0:0 1:6 2:1 3:5 4:2 5:7 6:8 7:3 8:4",
        },
        { label: "기저 배열", value: "전부 아직 없음" },
        {
          label: "지금 처리하는 연산",
          value: "사슬 셋 — 0·2·4·7·8 과 3 과 1·5·6",
        },
        { label: "더한 구간과 합", value: "—" },
      ],
    },
    {
      title: "T6 자리 번호대로 늘어놓고 펜윅 트리를 세운다",
      detail:
        "정점 값 1 2 3 4 5 6 7 8 9 를 자리 번호대로 다시 늘어놓으면 1 3 5 8 9 4 2 6 7 이 된다. 그 아홉 칸 위에 펜윅 트리를 세우면 어느 구간의 합도 칸 몇 개만 읽어 나온다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 3",
            status: "frontier",
            children: [
              {
                id: 5,
                label: "5 · 2",
                status: "visited",
                children: [{ id: 6, label: "6 · 1", status: "visited" }],
              },
            ],
          },
          {
            id: 2,
            label: "2 · 5",
            status: "visited",
            children: [
              { id: 3, label: "3 · 1", status: "frontier" },
              {
                id: 4,
                label: "4 · 3",
                status: "visited",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "visited",
                    children: [{ id: 8, label: "8 · 1", status: "visited" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "펜윅 트리 세우기" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "0→2 1→5 2→4 4→7 5→6 7→8" },
        {
          label: "사슬 머리 head",
          value: "0:0 1:1 2:0 3:3 4:0 5:1 6:1 7:0 8:0",
        },
        {
          label: "자리 번호 pos",
          value: "0:0 1:6 2:1 3:5 4:2 5:7 6:8 7:3 8:4",
        },
        { label: "기저 배열", value: "1 3 5 8 9 4 2 6 7" },
        {
          label: "지금 처리하는 연산",
          value: "전처리 끝. 여기까지 배열 칸 417 번",
        },
        { label: "더한 구간과 합", value: "—" },
      ],
    },
    {
      title: "T7 queryPath(0, 7) — 사슬 머리가 같아 구간 하나로 끝난다",
      detail:
        "정점 0 과 7 은 둘 다 머리가 0 인 같은 사슬에 있다. 자리 번호가 0 과 3 이므로 기저 배열의 0 번부터 3 번까지 한 구간을 더하면 그것이 답이다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 3",
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
          {
            id: 2,
            label: "2 · 5",
            status: "active",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              {
                id: 4,
                label: "4 · 3",
                status: "active",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "active",
                    children: [{ id: 8, label: "8 · 1", status: "default" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "같은 사슬 안의 경로 합" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "0→2 1→5 2→4 4→7 5→6 7→8" },
        {
          label: "사슬 머리 head",
          value: "0:0 1:1 2:0 3:3 4:0 5:1 6:1 7:0 8:0",
        },
        {
          label: "자리 번호 pos",
          value: "0:0 1:6 2:1 3:5 4:2 5:7 6:8 7:3 8:4",
        },
        { label: "기저 배열", value: "1 3 5 8 9 4 2 6 7" },
        {
          label: "지금 처리하는 연산",
          value: "queryPath(0, 7) — 경로 0→2→4→7",
        },
        {
          label: "더한 구간과 합",
          value: "자리 0 부터 3 까지 = 17. 배열 칸 5 번",
        },
      ],
    },
    {
      title:
        "T8 queryPath(3, 6) — 사슬 머리가 다른 동안 더 깊은 머리 쪽을 먼저 더한다",
      detail:
        "머리가 3 인 쪽이 더 깊으므로 자리 5 번 한 칸을 먼저 더하고 정점 2 로 옮긴다. 다음에는 머리가 1 인 쪽이 더 깊어 자리 6 번부터 8 번을 더하고 정점 0 으로 옮긴다. 그러면 두 정점의 머리가 0 으로 같아져 자리 0 번과 1 번 사이 한 구간이 남는다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 3",
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
          {
            id: 2,
            label: "2 · 5",
            status: "active",
            children: [
              { id: 3, label: "3 · 1", status: "visited" },
              {
                id: 4,
                label: "4 · 3",
                status: "default",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "default",
                    children: [{ id: 8, label: "8 · 1", status: "default" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "사슬 셋에 걸친 경로 합" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "0→2 1→5 2→4 4→7 5→6 7→8" },
        {
          label: "사슬 머리 head",
          value: "0:0 1:1 2:0 3:3 4:0 5:1 6:1 7:0 8:0",
        },
        {
          label: "자리 번호 pos",
          value: "0:0 1:6 2:1 3:5 4:2 5:7 6:8 7:3 8:4",
        },
        { label: "기저 배열", value: "1 3 5 8 9 4 2 6 7" },
        {
          label: "지금 처리하는 연산",
          value: "queryPath(3, 6) — 경로 3→2→0→1→5→6",
        },
        {
          label: "더한 구간과 합",
          value: "5~5 는 4 · 6~8 은 15 · 0~1 은 4, 합 23. 배열 칸 29 번",
        },
      ],
    },
    {
      title: "T9 update(4, 100) — 자리 하나만 고친다",
      detail:
        "정점 4 의 값을 5 에서 100 으로 바꾼다. 그 정점의 자리 번호가 2 번이므로 기저 배열의 2 번 칸을 담고 있는 펜윅 마디 셋만 95 만큼 늘리면 된다. 사슬도 자리 번호도 바뀌지 않는다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 3",
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
          {
            id: 2,
            label: "2 · 5",
            status: "default",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              {
                id: 4,
                label: "4 · 3",
                status: "active",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "default",
                    children: [{ id: 8, label: "8 · 1", status: "default" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "값 하나 갱신" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "0→2 1→5 2→4 4→7 5→6 7→8" },
        {
          label: "사슬 머리 head",
          value: "0:0 1:1 2:0 3:3 4:0 5:1 6:1 7:0 8:0",
        },
        {
          label: "자리 번호 pos",
          value: "0:0 1:6 2:1 3:5 4:2 5:7 6:8 7:3 8:4",
        },
        { label: "기저 배열", value: "1 3 100 8 9 4 2 6 7" },
        { label: "지금 처리하는 연산", value: "update(4, 100) — 늘어난 값 95" },
        { label: "더한 구간과 합", value: "고친 펜윅 마디 셋. 배열 칸 9 번" },
      ],
    },
    {
      title: "T10 queryPath(8, 6) — 갱신한 값이 그대로 반영된다",
      detail:
        "머리가 1 인 쪽이 더 깊으므로 자리 6 번부터 8 번을 먼저 더하고 정점 0 으로 옮긴다. 남은 것은 머리가 같은 한 구간 0 번부터 4 번이고, 거기에 방금 고친 자리 2 번이 들어 있다.",
      root: {
        id: 0,
        label: "0 · 9",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 3",
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
          {
            id: 2,
            label: "2 · 5",
            status: "active",
            children: [
              { id: 3, label: "3 · 1", status: "default" },
              {
                id: 4,
                label: "4 · 3",
                status: "active",
                children: [
                  {
                    id: 7,
                    label: "7 · 2",
                    status: "active",
                    children: [{ id: 8, label: "8 · 1", status: "active" }],
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "갱신 뒤 경로 합" },
        {
          label: "부분트리 크기 size",
          value: "0:9 1:3 2:5 3:1 4:3 5:2 6:1 7:2 8:1",
        },
        { label: "무거운 자식 heavy", value: "0→2 1→5 2→4 4→7 5→6 7→8" },
        {
          label: "사슬 머리 head",
          value: "0:0 1:1 2:0 3:3 4:0 5:1 6:1 7:0 8:0",
        },
        {
          label: "자리 번호 pos",
          value: "0:0 1:6 2:1 3:5 4:2 5:7 6:8 7:3 8:4",
        },
        { label: "기저 배열", value: "1 3 100 8 9 4 2 6 7" },
        {
          label: "지금 처리하는 연산",
          value: "queryPath(8, 6) — 경로 8→7→4→2→0→1→5→6",
        },
        {
          label: "더한 구간과 합",
          value: "6~8 은 15 · 0~4 는 121, 합 136. 배열 칸 18 번",
        },
      ],
    },
  ] satisfies Frame[],
};
