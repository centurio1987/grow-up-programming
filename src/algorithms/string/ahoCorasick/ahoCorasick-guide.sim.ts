import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)와 같다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` + `tree` 조합을 이 편이 쓰는 방식 — `trie` 가 세운 규약과 갈리는 자리
 *
 * 뷰 조합은 `src/algorithms/string/trie/trie-guide.sim.ts` 가 세운 다섯 규약을 그대로
 * 따른다(구조 전체를 담는 `root` · 간선 글자를 `label` 로 · `children` 에 `null` 금지 ·
 * `entries` 는 프레임마다 같은 항목). **`status` 넷의 뜻만 이 편에서 다시 정한다** —
 * `trie` 는 자료구조를 만드는 과정을 보였고 이 편은 **다 만든 기계 위를 옮겨 다니는 과정**을
 * 보이므로, 「이번 걸음에 새로 만든 노드」라는 뜻이 이 편에는 없다.
 *
 * | status | 이 편에서의 뜻 |
 * | --- | --- |
 * | `active` | 이 걸음이 끝난 시점에 서 있는 상태 |
 * | `frontier` | 이 걸음에 매칭을 낸 상태. 출력 링크로 거둔 상태도 포함한다 |
 * | `visited` | 패턴이 끝나는 상태인데 이 걸음에는 매칭을 안 낸 것 |
 * | `default` | 나머지 |
 *
 * 겹치면 `active` 가 앞선다. 패턴이 끝나는 상태 셋(`he`·`she`·`hers`)은 어느 프레임에서나
 * 색이 붙어 있어서, 독자가 「지금 어디에 서 있는가」와 「어디서 패턴이 끝나는가」를 같은
 * 그림에서 갈라 볼 수 있다.
 *
 * **T1 과 T2 는 트리가 글자 하나 다르지 않다.** 실패 링크와 전이표는 트리 그림이 담지 못하는
 * 것이라(간선이 위에서 아래로만 그려진다) 그 차이는 옆 패널과 본문의 도식이 진다. 트리를
 * 억지로 고쳐 차이를 만들면 없는 구조를 보이는 것이 된다.
 */
export const acScan = {
  view: ["keyValue", "tree"] as const,
  title: "ushers 여섯 글자에서 he · she · hers 를 한 번에 찾는다",
  result: "[{1,1},{0,2},{2,2}]",
  steps: [
    {
      title: "T1 패턴 셋을 담는다",
      detail:
        "he · she · hers 를 한 트리에 담았다. he 와 hers 가 앞 두 글자를 함께 쓰므로 상태가 8 개다. 별표는 그 상태에서 패턴이 끝난다는 뜻이다.",
      root: {
        id: "root",
        label: "(root)",
        status: "active",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "visited",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "visited" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "패턴 셋을 담는다" },
        { label: "텍스트 자리", value: "-" },
        { label: "읽은 글자", value: "-" },
        { label: "어떻게 옮겼는가", value: "-" },
        { label: "지금 상태의 경로", value: "(root)" },
        { label: "이 걸음의 매칭", value: "-" },
        { label: "지금까지의 매칭 수", value: 0 },
      ],
    },
    {
      title: "T2 실패 링크와 전이표를 채운다",
      detail:
        "얕은 상태부터 채운다. sh 의 실패 링크는 h, she 의 실패 링크는 he, hers 의 실패 링크는 s 이고 나머지는 뿌리다. she 만 출력 링크 he 를 갖는다.",
      root: {
        id: "root",
        label: "(root)",
        status: "active",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "visited",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "visited" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "실패 링크와 전이표를 채운다" },
        { label: "텍스트 자리", value: "-" },
        { label: "읽은 글자", value: "-" },
        { label: "어떻게 옮겼는가", value: "-" },
        { label: "지금 상태의 경로", value: "(root)" },
        { label: "이 걸음의 매칭", value: "-" },
        { label: "지금까지의 매칭 수", value: 0 },
      ],
    },
    {
      title: "T3 텍스트 자리 0 의 글자 u",
      detail:
        "뿌리에 u 로 가는 자식이 없다. 그 칸에는 뿌리 자신이 적혀 있으므로 뿌리에 그대로 남는다.",
      root: {
        id: "root",
        label: "(root)",
        status: "active",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "visited",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "visited" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "텍스트를 읽는다" },
        { label: "텍스트 자리", value: 0 },
        { label: "읽은 글자", value: "u" },
        { label: "어떻게 옮겼는가", value: "물려받은 칸이 뿌리다" },
        { label: "지금 상태의 경로", value: "(root)" },
        { label: "이 걸음의 매칭", value: "-" },
        { label: "지금까지의 매칭 수", value: 0 },
      ],
    },
    {
      title: "T4 텍스트 자리 1 의 글자 s",
      detail: "뿌리에 s 로 가는 자식이 있다. 상태 s 로 내려간다.",
      root: {
        id: "root",
        label: "(root)",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "visited",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "visited" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            status: "active",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "텍스트를 읽는다" },
        { label: "텍스트 자리", value: 1 },
        { label: "읽은 글자", value: "s" },
        { label: "어떻게 옮겼는가", value: "자식으로 내려간다" },
        { label: "지금 상태의 경로", value: "s" },
        { label: "이 걸음의 매칭", value: "-" },
        { label: "지금까지의 매칭 수", value: 0 },
      ],
    },
    {
      title: "T5 텍스트 자리 2 의 글자 h",
      detail: "상태 s 에 h 로 가는 자식이 있다. 상태 sh 로 내려간다.",
      root: {
        id: "root",
        label: "(root)",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "visited",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "visited" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                status: "active",
                children: [{ id: "she", label: "e*", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "텍스트를 읽는다" },
        { label: "텍스트 자리", value: 2 },
        { label: "읽은 글자", value: "h" },
        { label: "어떻게 옮겼는가", value: "자식으로 내려간다" },
        { label: "지금 상태의 경로", value: "sh" },
        { label: "이 걸음의 매칭", value: "-" },
        { label: "지금까지의 매칭 수", value: 0 },
      ],
    },
    {
      title: "T6 텍스트 자리 3 의 글자 e",
      detail:
        "상태 she 에 도착했다. 여기서 패턴 1 이 끝나고, 출력 링크가 가리키는 he 에서 패턴 0 도 함께 끝난다. 한 걸음이 매칭 둘을 낸다.",
      root: {
        id: "root",
        label: "(root)",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "frontier",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "visited" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "active" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "텍스트를 읽는다" },
        { label: "텍스트 자리", value: 3 },
        { label: "읽은 글자", value: "e" },
        { label: "어떻게 옮겼는가", value: "자식으로 내려간다" },
        { label: "지금 상태의 경로", value: "she" },
        {
          label: "이 걸음의 매칭",
          value: "패턴 1 이 자리 1 · 패턴 0 이 자리 2",
        },
        { label: "지금까지의 매칭 수", value: 2 },
      ],
    },
    {
      title: "T7 텍스트 자리 4 의 글자 r",
      detail:
        "상태 she 에 r 로 가는 자식이 없다. 그 칸에는 실패 링크 he 에서 물려받은 값 her 가 적혀 있으므로 her 로 옮긴다. 텍스트는 되돌려 읽지 않는다.",
      root: {
        id: "root",
        label: "(root)",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "visited",
                children: [
                  {
                    id: "her",
                    label: "r",
                    status: "active",
                    children: [{ id: "hers", label: "s*", status: "visited" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "텍스트를 읽는다" },
        { label: "텍스트 자리", value: 4 },
        { label: "읽은 글자", value: "r" },
        { label: "어떻게 옮겼는가", value: "물려받은 칸으로 옮긴다" },
        { label: "지금 상태의 경로", value: "her" },
        { label: "이 걸음의 매칭", value: "-" },
        { label: "지금까지의 매칭 수", value: 2 },
      ],
    },
    {
      title: "T8 텍스트 자리 5 의 글자 s",
      detail:
        "상태 her 에 s 로 가는 자식이 있다. hers 로 내려가고 거기서 패턴 2 가 끝난다.",
      root: {
        id: "root",
        label: "(root)",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "visited",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "active" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "visited" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "텍스트를 읽는다" },
        { label: "텍스트 자리", value: 5 },
        { label: "읽은 글자", value: "s" },
        { label: "어떻게 옮겼는가", value: "자식으로 내려간다" },
        { label: "지금 상태의 경로", value: "hers" },
        { label: "이 걸음의 매칭", value: "패턴 2 가 자리 2" },
        { label: "지금까지의 매칭 수", value: 3 },
      ],
    },
    {
      title: "T9 시작 자리 순서로 맞춰 돌려준다",
      detail:
        "텍스트를 다 읽었다. 찾은 순서는 패턴이 끝난 자리의 순서라 시작 자리 순서로 다시 맞춘다. 패턴 셋이 모두 한 번씩 매칭을 냈다.",
      root: {
        id: "root",
        label: "(root)",
        children: [
          {
            id: "h",
            label: "h",
            children: [
              {
                id: "he",
                label: "e*",
                status: "frontier",
                children: [
                  {
                    id: "her",
                    label: "r",
                    children: [{ id: "hers", label: "s*", status: "frontier" }],
                  },
                ],
              },
            ],
          },
          {
            id: "s",
            label: "s",
            children: [
              {
                id: "sh",
                label: "h",
                children: [{ id: "she", label: "e*", status: "frontier" }],
              },
            ],
          },
        ],
      },
      entries: [
        { label: "지금 하는 일", value: "순서를 맞춰 돌려준다" },
        { label: "텍스트 자리", value: "-" },
        { label: "읽은 글자", value: "-" },
        { label: "어떻게 옮겼는가", value: "-" },
        { label: "지금 상태의 경로", value: "hers" },
        {
          label: "이 걸음의 매칭",
          value: "패턴 1 이 자리 1 · 패턴 0 이 자리 2 · 패턴 2 가 자리 2",
        },
        { label: "지금까지의 매칭 수", value: 3 },
      ],
    },
  ] satisfies Frame[],
};
