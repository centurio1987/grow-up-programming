import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수(20)는 그 절의
 * `T#` 단계 수(20)를 넘지 않는다 — P3 이 그 관계를 잰다. 걸음마다 프레임을 하나씩 둬서
 * 원고의 `<!--viz:isoWalk-->` 표와 걸음이 한 줄씩 맞물린다.
 *
 * **뷰가 둘이다.** `tree` 는 그 걸음에서 뿌리를 잡은 트리를 그리고 정점 라벨에 `정점:번호` 를
 * 함께 적는다. `keyValue` 는 갈래 · 어느 트리 · 어느 뿌리 · 이 걸음이 매긴 번호 · 번호표
 * 크기 · B 의 중심 번호를 적는다. 이 편에서 갈리는 것은 **부분 트리 모양에 붙은 번호**라,
 * 트리 그림만으로는 표가 어떻게 채워지는지가 안 보인다.
 *
 * 정점 라벨의 `status` 는 셋을 가른다 — 아직 번호가 없는 정점은 표시가 없고, 잎으로 벗겨진
 * 정점은 `frontier`, 번호를 받은 정점은 `visited` 다.
 *
 * 준비와 잎 벗기기 걸음에서는 **뿌리가 아직 없다.** 그림에서만 정점 0 을 위에 두어 트리 모양을
 * 보인다 — 그 걸음의 `뿌리` 칸이 `-` 인 것이 그것을 말한다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가
 * 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const isoWalk = {
  view: ["tree", "keyValue"] as const,
  title:
    "treeIsomorphism(8, [[0,1],[0,6],[1,2],[1,7],[2,3],[3,4],[3,5]], [[0,1],[0,6],[2,6],[3,4],[3,5],[3,7],[6,7]])",
  result: "true",
  steps: [
    {
      title: "T1 준비",
      detail: "간선 7 개를 양쪽 정점에 나눠 담아 이웃 목록 둘을 만든다",
      root: {
        id: 0,
        label: "0",
        children: [
          {
            id: 1,
            label: "1",
            children: [
              {
                id: 2,
                label: "2",
                children: [
                  {
                    id: 3,
                    label: "3",
                    children: [
                      {
                        id: 4,
                        label: "4",
                      },
                      {
                        id: 5,
                        label: "5",
                      },
                    ],
                  },
                ],
              },
              {
                id: 7,
                label: "7",
              },
            ],
          },
          {
            id: 6,
            label: "6",
          },
        ],
      },
      entries: [
        { label: "갈래", value: "준비" },
        { label: "트리", value: "A 와 B" },
        { label: "뿌리", value: "-" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "0" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T2 잎 벗기기",
      detail: "잎 4 5 6 7 을 벗긴다 — 정점 4 개가 남는다",
      root: {
        id: 0,
        label: "0",
        children: [
          {
            id: 1,
            label: "1",
            children: [
              {
                id: 2,
                label: "2",
                children: [
                  {
                    id: 3,
                    label: "3",
                    children: [
                      {
                        id: 4,
                        label: "4",
                        status: "frontier",
                      },
                      {
                        id: 5,
                        label: "5",
                        status: "frontier",
                      },
                    ],
                  },
                ],
              },
              {
                id: 7,
                label: "7",
                status: "frontier",
              },
            ],
          },
          {
            id: 6,
            label: "6",
            status: "frontier",
          },
        ],
      },
      entries: [
        { label: "갈래", value: "잎 벗기기" },
        { label: "트리", value: "A" },
        { label: "뿌리", value: "-" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "0" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T3 잎 벗기기",
      detail: "잎 3 0 을 벗긴다 — 정점 2 개가 남는다",
      root: {
        id: 0,
        label: "0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1",
            children: [
              {
                id: 2,
                label: "2",
                children: [
                  {
                    id: 3,
                    label: "3",
                    status: "frontier",
                    children: [
                      {
                        id: 4,
                        label: "4",
                        status: "frontier",
                      },
                      {
                        id: 5,
                        label: "5",
                        status: "frontier",
                      },
                    ],
                  },
                ],
              },
              {
                id: 7,
                label: "7",
                status: "frontier",
              },
            ],
          },
          {
            id: 6,
            label: "6",
            status: "frontier",
          },
        ],
      },
      entries: [
        { label: "갈래", value: "잎 벗기기" },
        { label: "트리", value: "A" },
        { label: "뿌리", value: "-" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "0" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T4 잎 벗기기",
      detail: "잎 1 2 4 5 를 벗긴다 — 정점 4 개가 남는다",
      root: {
        id: 0,
        label: "0",
        children: [
          {
            id: 1,
            label: "1",
            status: "frontier",
          },
          {
            id: 6,
            label: "6",
            children: [
              {
                id: 2,
                label: "2",
                status: "frontier",
              },
              {
                id: 7,
                label: "7",
                children: [
                  {
                    id: 3,
                    label: "3",
                    children: [
                      {
                        id: 4,
                        label: "4",
                        status: "frontier",
                      },
                      {
                        id: 5,
                        label: "5",
                        status: "frontier",
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
        { label: "갈래", value: "잎 벗기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "-" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "0" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T5 잎 벗기기",
      detail: "잎 0 3 을 벗긴다 — 정점 2 개가 남는다",
      root: {
        id: 0,
        label: "0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1",
            status: "frontier",
          },
          {
            id: 6,
            label: "6",
            children: [
              {
                id: 2,
                label: "2",
                status: "frontier",
              },
              {
                id: 7,
                label: "7",
                children: [
                  {
                    id: 3,
                    label: "3",
                    status: "frontier",
                    children: [
                      {
                        id: 4,
                        label: "4",
                        status: "frontier",
                      },
                      {
                        id: 5,
                        label: "5",
                        status: "frontier",
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
        { label: "갈래", value: "잎 벗기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "-" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "0" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T6 중심 개수",
      detail: "A 의 중심 2 1 과 B 의 중심 6 7 — 개수가 둘씩이라 같다",
      root: {
        id: 2,
        label: "2",
        children: [
          {
            id: 1,
            label: "1",
            children: [
              {
                id: 0,
                label: "0",
                children: [
                  {
                    id: 6,
                    label: "6",
                  },
                ],
              },
              {
                id: 7,
                label: "7",
              },
            ],
          },
          {
            id: 3,
            label: "3",
            children: [
              {
                id: 4,
                label: "4",
              },
              {
                id: 5,
                label: "5",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "중심 개수" },
        { label: "트리", value: "A 와 B" },
        { label: "뿌리", value: "-" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "0" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T7 차례 적기",
      detail: "뿌리 6 에서 방문 차례 6 0 2 7 1 3 4 5 를 적는다",
      root: {
        id: 6,
        label: "6",
        children: [
          {
            id: 0,
            label: "0",
            children: [
              {
                id: 1,
                label: "1",
              },
            ],
          },
          {
            id: 2,
            label: "2",
          },
          {
            id: 7,
            label: "7",
            children: [
              {
                id: 3,
                label: "3",
                children: [
                  {
                    id: 4,
                    label: "4",
                  },
                  {
                    id: 5,
                    label: "5",
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "차례 적기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "6" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "0" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T8 번호 매기기",
      detail: "5: [] → 0 새 · 4: [] → 0",
      root: {
        id: 6,
        label: "6",
        children: [
          {
            id: 0,
            label: "0",
            children: [
              {
                id: 1,
                label: "1",
              },
            ],
          },
          {
            id: 2,
            label: "2",
          },
          {
            id: 7,
            label: "7",
            children: [
              {
                id: 3,
                label: "3",
                children: [
                  {
                    id: 4,
                    label: "4:0",
                    status: "visited",
                  },
                  {
                    id: 5,
                    label: "5:0",
                    status: "visited",
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "6" },
        { label: "이 걸음이 매긴 번호", value: "5→0 4→0" },
        { label: "표 크기", value: "1" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T9 번호 매기기",
      detail: "3: [0,0] → 1 새",
      root: {
        id: 6,
        label: "6",
        children: [
          {
            id: 0,
            label: "0",
            children: [
              {
                id: 1,
                label: "1",
              },
            ],
          },
          {
            id: 2,
            label: "2",
          },
          {
            id: 7,
            label: "7",
            children: [
              {
                id: 3,
                label: "3:1",
                status: "visited",
                children: [
                  {
                    id: 4,
                    label: "4:0",
                    status: "visited",
                  },
                  {
                    id: 5,
                    label: "5:0",
                    status: "visited",
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "6" },
        { label: "이 걸음이 매긴 번호", value: "3→1" },
        { label: "표 크기", value: "2" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T10 번호 매기기",
      detail: "1: [] → 0 · 7: [1] → 2 새",
      root: {
        id: 6,
        label: "6",
        children: [
          {
            id: 0,
            label: "0",
            children: [
              {
                id: 1,
                label: "1:0",
                status: "visited",
              },
            ],
          },
          {
            id: 2,
            label: "2",
          },
          {
            id: 7,
            label: "7:2",
            status: "visited",
            children: [
              {
                id: 3,
                label: "3:1",
                status: "visited",
                children: [
                  {
                    id: 4,
                    label: "4:0",
                    status: "visited",
                  },
                  {
                    id: 5,
                    label: "5:0",
                    status: "visited",
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "6" },
        { label: "이 걸음이 매긴 번호", value: "1→0 7→2" },
        { label: "표 크기", value: "3" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T11 번호 매기기",
      detail: "2: [] → 0 · 0: [0] → 3 새",
      root: {
        id: 6,
        label: "6",
        children: [
          {
            id: 0,
            label: "0:3",
            status: "visited",
            children: [
              {
                id: 1,
                label: "1:0",
                status: "visited",
              },
            ],
          },
          {
            id: 2,
            label: "2:0",
            status: "visited",
          },
          {
            id: 7,
            label: "7:2",
            status: "visited",
            children: [
              {
                id: 3,
                label: "3:1",
                status: "visited",
                children: [
                  {
                    id: 4,
                    label: "4:0",
                    status: "visited",
                  },
                  {
                    id: 5,
                    label: "5:0",
                    status: "visited",
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "6" },
        { label: "이 걸음이 매긴 번호", value: "2→0 0→3" },
        { label: "표 크기", value: "4" },
        { label: "B 의 중심 번호", value: "-" },
      ],
    },
    {
      title: "T12 번호 매기기",
      detail: "6: [0,2,3] → 4 새 — B 의 첫 중심 번호가 4 로 정해진다",
      root: {
        id: 6,
        label: "6:4",
        status: "visited",
        children: [
          {
            id: 0,
            label: "0:3",
            status: "visited",
            children: [
              {
                id: 1,
                label: "1:0",
                status: "visited",
              },
            ],
          },
          {
            id: 2,
            label: "2:0",
            status: "visited",
          },
          {
            id: 7,
            label: "7:2",
            status: "visited",
            children: [
              {
                id: 3,
                label: "3:1",
                status: "visited",
                children: [
                  {
                    id: 4,
                    label: "4:0",
                    status: "visited",
                  },
                  {
                    id: 5,
                    label: "5:0",
                    status: "visited",
                  },
                ],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "6" },
        { label: "이 걸음이 매긴 번호", value: "6→4" },
        { label: "표 크기", value: "5" },
        { label: "B 의 중심 번호", value: "4" },
      ],
    },
    {
      title: "T13 차례 적기",
      detail: "뿌리 7 에서 방문 차례 7 3 6 4 5 0 2 1 을 적는다",
      root: {
        id: 7,
        label: "7",
        children: [
          {
            id: 3,
            label: "3",
            children: [
              {
                id: 4,
                label: "4",
              },
              {
                id: 5,
                label: "5",
              },
            ],
          },
          {
            id: 6,
            label: "6",
            children: [
              {
                id: 0,
                label: "0",
                children: [
                  {
                    id: 1,
                    label: "1",
                  },
                ],
              },
              {
                id: 2,
                label: "2",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "차례 적기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "7" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "5" },
        { label: "B 의 중심 번호", value: "4" },
      ],
    },
    {
      title: "T14 번호 매기기",
      detail: "1: [] → 0 · 2: [] → 0 · 0: [0] → 3 · 5: [] → 0 · 4: [] → 0",
      root: {
        id: 7,
        label: "7",
        children: [
          {
            id: 3,
            label: "3",
            children: [
              {
                id: 4,
                label: "4:0",
                status: "visited",
              },
              {
                id: 5,
                label: "5:0",
                status: "visited",
              },
            ],
          },
          {
            id: 6,
            label: "6",
            children: [
              {
                id: 0,
                label: "0:3",
                status: "visited",
                children: [
                  {
                    id: 1,
                    label: "1:0",
                    status: "visited",
                  },
                ],
              },
              {
                id: 2,
                label: "2:0",
                status: "visited",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "7" },
        { label: "이 걸음이 매긴 번호", value: "1→0 2→0 0→3 5→0 4→0" },
        { label: "표 크기", value: "5" },
        { label: "B 의 중심 번호", value: "4" },
      ],
    },
    {
      title: "T15 번호 매기기",
      detail: "6: [0,3] → 5 새",
      root: {
        id: 7,
        label: "7",
        children: [
          {
            id: 3,
            label: "3",
            children: [
              {
                id: 4,
                label: "4:0",
                status: "visited",
              },
              {
                id: 5,
                label: "5:0",
                status: "visited",
              },
            ],
          },
          {
            id: 6,
            label: "6:5",
            status: "visited",
            children: [
              {
                id: 0,
                label: "0:3",
                status: "visited",
                children: [
                  {
                    id: 1,
                    label: "1:0",
                    status: "visited",
                  },
                ],
              },
              {
                id: 2,
                label: "2:0",
                status: "visited",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "7" },
        { label: "이 걸음이 매긴 번호", value: "6→5" },
        { label: "표 크기", value: "6" },
        { label: "B 의 중심 번호", value: "4" },
      ],
    },
    {
      title: "T16 번호 매기기",
      detail:
        "3: [0,0] → 1 · 7: [1,5] → 6 새 — B 의 중심 번호 둘이 4 6 로 찬다",
      root: {
        id: 7,
        label: "7:6",
        status: "visited",
        children: [
          {
            id: 3,
            label: "3:1",
            status: "visited",
            children: [
              {
                id: 4,
                label: "4:0",
                status: "visited",
              },
              {
                id: 5,
                label: "5:0",
                status: "visited",
              },
            ],
          },
          {
            id: 6,
            label: "6:5",
            status: "visited",
            children: [
              {
                id: 0,
                label: "0:3",
                status: "visited",
                children: [
                  {
                    id: 1,
                    label: "1:0",
                    status: "visited",
                  },
                ],
              },
              {
                id: 2,
                label: "2:0",
                status: "visited",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "B" },
        { label: "뿌리", value: "7" },
        { label: "이 걸음이 매긴 번호", value: "3→1 7→6" },
        { label: "표 크기", value: "7" },
        { label: "B 의 중심 번호", value: "4 6" },
      ],
    },
    {
      title: "T17 차례 적기",
      detail: "뿌리 2 에서 방문 차례 2 1 3 0 7 4 5 6 을 적는다",
      root: {
        id: 2,
        label: "2",
        children: [
          {
            id: 1,
            label: "1",
            children: [
              {
                id: 0,
                label: "0",
                children: [
                  {
                    id: 6,
                    label: "6",
                  },
                ],
              },
              {
                id: 7,
                label: "7",
              },
            ],
          },
          {
            id: 3,
            label: "3",
            children: [
              {
                id: 4,
                label: "4",
              },
              {
                id: 5,
                label: "5",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "차례 적기" },
        { label: "트리", value: "A" },
        { label: "뿌리", value: "2" },
        { label: "이 걸음이 매긴 번호", value: "-" },
        { label: "표 크기", value: "7" },
        { label: "B 의 중심 번호", value: "4 6" },
      ],
    },
    {
      title: "T18 번호 매기기",
      detail:
        "6: [] → 0 · 5: [] → 0 · 4: [] → 0 · 7: [] → 0 · 0: [0] → 3 · 3: [0,0] → 1",
      root: {
        id: 2,
        label: "2",
        children: [
          {
            id: 1,
            label: "1",
            children: [
              {
                id: 0,
                label: "0:3",
                status: "visited",
                children: [
                  {
                    id: 6,
                    label: "6:0",
                    status: "visited",
                  },
                ],
              },
              {
                id: 7,
                label: "7:0",
                status: "visited",
              },
            ],
          },
          {
            id: 3,
            label: "3:1",
            status: "visited",
            children: [
              {
                id: 4,
                label: "4:0",
                status: "visited",
              },
              {
                id: 5,
                label: "5:0",
                status: "visited",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "A" },
        { label: "뿌리", value: "2" },
        { label: "이 걸음이 매긴 번호", value: "6→0 5→0 4→0 7→0 0→3 3→1" },
        { label: "표 크기", value: "7" },
        { label: "B 의 중심 번호", value: "4 6" },
      ],
    },
    {
      title: "T19 번호 매기기",
      detail: "1: [0,3] → 5",
      root: {
        id: 2,
        label: "2",
        children: [
          {
            id: 1,
            label: "1:5",
            status: "visited",
            children: [
              {
                id: 0,
                label: "0:3",
                status: "visited",
                children: [
                  {
                    id: 6,
                    label: "6:0",
                    status: "visited",
                  },
                ],
              },
              {
                id: 7,
                label: "7:0",
                status: "visited",
              },
            ],
          },
          {
            id: 3,
            label: "3:1",
            status: "visited",
            children: [
              {
                id: 4,
                label: "4:0",
                status: "visited",
              },
              {
                id: 5,
                label: "5:0",
                status: "visited",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "번호 매기기" },
        { label: "트리", value: "A" },
        { label: "뿌리", value: "2" },
        { label: "이 걸음이 매긴 번호", value: "1→5" },
        { label: "표 크기", value: "7" },
        { label: "B 의 중심 번호", value: "4 6" },
      ],
    },
    {
      title: "T20 견주기",
      detail:
        "2: [1,5] → 6 — 뿌리 번호 6 이 B 의 번호 4 6 안에 있어 true 를 돌려준다",
      root: {
        id: 2,
        label: "2:6",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1:5",
            status: "visited",
            children: [
              {
                id: 0,
                label: "0:3",
                status: "visited",
                children: [
                  {
                    id: 6,
                    label: "6:0",
                    status: "visited",
                  },
                ],
              },
              {
                id: 7,
                label: "7:0",
                status: "visited",
              },
            ],
          },
          {
            id: 3,
            label: "3:1",
            status: "visited",
            children: [
              {
                id: 4,
                label: "4:0",
                status: "visited",
              },
              {
                id: 5,
                label: "5:0",
                status: "visited",
              },
            ],
          },
        ],
      },
      entries: [
        { label: "갈래", value: "견주기" },
        { label: "트리", value: "A" },
        { label: "뿌리", value: "2" },
        { label: "이 걸음이 매긴 번호", value: "2→6" },
        { label: "표 크기", value: "7" },
        { label: "B 의 중심 번호", value: "4 6" },
      ],
    },
  ] satisfies Frame[],
};
