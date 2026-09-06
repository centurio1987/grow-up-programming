import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(11)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`string` 카테고리의 여덟 번째 편이다.** `trie` · `radixTree` · `findAllOccurrences` ·
 * `ahoCorasick` · `suffixArray` · `kasaiLcp` 가 세운 규약을 이어받는다.
 *
 * 1. **이어받음 — `root` 는 그 걸음 끝의 구조 전체다.** 프레임마다 트리 한 벌을 통째로 적는다.
 * 2. **이어받음 — `label` 이 글자 하나가 아니라 둘을 담는다**(`3 · 2` 꼴). 상태 번호와 그
 *    상태의 `len` 이다. **뜻을 끝까지 바꾸지 않는다** — 링크나 전이를 같은 칸에 섞으면 같은
 *    자리의 숫자가 걸음마다 다른 것을 뜻하게 된다. 그 둘은 `keyValue` 가 진다.
 * 3. **이어받음 — `children` 에 `null` 을 넣지 않는다.** 이 트리에는 「빈 자리」가 없다.
 * 4. **새로 정한 것 — 트리는 접미사 링크가 이루는 트리이고, 링크가 아직 안 정해진 상태는
 *    트리에 넣지 않는다.** T6·T7 의 상태 5 가 그 자리다. 링크가 없는 상태를 뿌리 아래로
 *    붙이면 그림이 없는 간선을 하나 그리게 되고, 그것은 절차의 자유도로 읽힌다. 대신
 *    `keyValue` 가 「링크가 아직 없는 상태」를 적는다.
 * 5. **새로 정한 것 — 상태 값 넷이 국면마다 다른 축을 뜻한다.** 만들기(T1~T8)에서는
 *    `active` 이 걸음에 만들어졌거나 링크가 바뀐 상태 · `frontier` ③ 이나 ⑦ 이 지나간 상태 ·
 *    `visited` 이미 자리가 정해져 이 걸음이 안 건드린 상태 · `default` 나머지다.
 *    찾기(T9·T10)에서는 `active` 지금 있는 상태 · `visited` 지나온 상태 · `default` 나머지이고,
 *    세기(T11)에서는 `visited` 가 개수를 더한 상태 전부다. 값을 늘리면 색이 여덟 가지가
 *    되어 그림을 읽을 수 없다.
 *
 * **트리가 못 담는 것을 `keyValue` 가 진다.** 넷이다 — ① **전이 표**는 링크 트리와 다른
 * 방향의 간선이라 같은 그림에 겹쳐 그리면 두 구조가 뒤섞인다. ② **`link` 배열의 값**은
 * 트리의 간선과 같은 것이지만 숫자로 봐야 걸음마다의 변화가 보인다. ③ **한 글자를 붙이는
 * 동안만 쓰는 이름**(`cur` · `p` · `q` · 복제)은 상태에 붙는 것이 아니라 걸음에 붙는다.
 * ④ **반환값**은 구조가 아니다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const samWalk = {
  view: ["tree", "keyValue"] as const,
  title: 'new SuffixAutomaton("aabab")',
  result: "11",
  steps: [
    {
      title: "T1 뿌리 상태 하나로 시작한다",
      detail:
        "상태 0 은 빈 문자열만 담는다. len 은 0 이고 링크는 없으며 전이 표도 비어 있다.",
      root: { id: 0, label: "0 · 0", status: "active" },
      entries: [
        { label: "읽은 접두사", value: '""' },
        { label: "len", value: "0" },
        { label: "link", value: "-1" },
        { label: "전이 표", value: "0: 비어 있다" },
        { label: "상태 수", value: "1" },
      ],
    },
    {
      title: "T2 첫 글자 a — 상태 1 을 만들고 뿌리에 전이를 적는다",
      detail:
        "cur 은 1 이고 len[1] 은 1 이다. 링크를 거슬러 올라가며 a 전이가 비어 있는 상태에 1 을 적는데, 상태 0 하나를 적고 나면 더 올라갈 곳이 없어 link[1] 은 뿌리가 된다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "frontier",
        children: [{ id: 1, label: "1 · 1", status: "active" }],
      },
      entries: [
        { label: "읽은 접두사", value: '"a"' },
        { label: "cur", value: "1" },
        { label: "len", value: "0 1" },
        { label: "link", value: "-1 0" },
        { label: "전이 표", value: "0: a->1" },
        { label: "③ 이 전이를 적은 상태", value: "0" },
        { label: "③ 이 멈춘 p", value: "-1" },
      ],
    },
    {
      title: "T3 둘째 글자 a — 전이가 이미 있는 자리에서 멈춘다",
      detail:
        "상태 1 에 a 전이를 적고 상태 0 으로 올라가니 a 전이가 이미 있다. q 는 1 이고 len[0]+1 과 len[1] 이 둘 다 1 이라 길이가 이어지므로 link[2] 를 q 로 둔다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "frontier",
            children: [{ id: 2, label: "2 · 2", status: "active" }],
          },
        ],
      },
      entries: [
        { label: "읽은 접두사", value: '"aa"' },
        { label: "cur", value: "2" },
        { label: "len", value: "0 1 2" },
        { label: "link", value: "-1 0 1" },
        { label: "전이 표", value: "0: a->1  1: a->2" },
        { label: "③ 이 멈춘 p", value: "0" },
        { label: "q · len[p]+1 · len[q]", value: "1 · 1 · 1" },
      ],
    },
    {
      title: "T4 셋째 글자 b — 세 상태에 전이를 적고 뿌리로 잇는다",
      detail:
        "b 전이는 어느 상태에도 없어서 2 · 1 · 0 세 곳에 3 을 적는다. 뿌리를 지나쳐 p 가 -1 이 되므로 link[3] 은 뿌리다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "frontier",
            children: [{ id: 2, label: "2 · 2", status: "frontier" }],
          },
          { id: 3, label: "3 · 3", status: "active" },
        ],
      },
      entries: [
        { label: "읽은 접두사", value: '"aab"' },
        { label: "cur", value: "3" },
        { label: "len", value: "0 1 2 3" },
        { label: "link", value: "-1 0 1 0" },
        { label: "전이 표", value: "0: a->1 b->3  1: a->2 b->3  2: b->3" },
        { label: "③ 이 전이를 적은 상태", value: "2 1 0" },
        { label: "③ 이 멈춘 p", value: "-1" },
      ],
    },
    {
      title: "T5 넷째 글자 a — 다시 길이가 이어지는 갈래를 지난다",
      detail:
        "상태 3 에 a 전이를 적고 뿌리로 올라가니 a 전이가 이미 있다. q 는 1 이고 len[0]+1 과 len[1] 이 둘 다 1 이라 link[4] 를 1 로 둔다.",
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
              { id: 2, label: "2 · 2", status: "visited" },
              { id: 4, label: "4 · 4", status: "active" },
            ],
          },
          { id: 3, label: "3 · 3", status: "visited" },
        ],
      },
      entries: [
        { label: "읽은 접두사", value: '"aaba"' },
        { label: "cur", value: "4" },
        { label: "len", value: "0 1 2 3 4" },
        { label: "link", value: "-1 0 1 0 1" },
        {
          label: "전이 표",
          value: "0: a->1 b->3  1: a->2 b->3  2: b->3  3: a->4",
        },
        { label: "③ 이 멈춘 p", value: "0" },
        { label: "q · len[p]+1 · len[q]", value: "1 · 1 · 1" },
      ],
    },
    {
      title: "T6 다섯째 글자 b — 길이가 어긋나는 자리에서 멈춘다",
      detail:
        "상태 4 에 b 전이를 적고 상태 1 로 올라가니 b 전이가 이미 있다. q 는 3 인데 len[1]+1 은 2 이고 len[3] 은 3 이라 길이가 어긋난다. 상태 5 는 아직 링크가 없어 트리에 안 들어간다.",
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
              { id: 2, label: "2 · 2", status: "default" },
              { id: 4, label: "4 · 4", status: "frontier" },
            ],
          },
          { id: 3, label: "3 · 3", status: "active" },
        ],
      },
      entries: [
        { label: "읽은 접두사", value: '"aabab"' },
        { label: "cur", value: "5" },
        { label: "len", value: "0 1 2 3 4 5" },
        { label: "link", value: "-1 0 1 0 1 아직 없다" },
        {
          label: "전이 표",
          value: "0: a->1 b->3  1: a->2 b->3  2: b->3  3: a->4  4: b->5",
        },
        { label: "③ 이 멈춘 p", value: "1" },
        { label: "q · len[p]+1 · len[q]", value: "3 · 2 · 3" },
        { label: "링크가 아직 없는 상태", value: "5" },
      ],
    },
    {
      title: "T7 복제 상태 6 을 만들고 b 전이를 그쪽으로 바꾼다",
      detail:
        "복제 상태 6 은 len 이 2 이고 link 가 상태 3 의 옛 링크인 뿌리이며 전이 표는 상태 3 의 것을 복사한 a->4 다. 이어서 상태 1 과 0 의 b 전이를 3 에서 6 으로 바꾼다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "frontier",
            children: [
              { id: 2, label: "2 · 2", status: "default" },
              { id: 4, label: "4 · 4", status: "default" },
            ],
          },
          { id: 3, label: "3 · 3", status: "default" },
          { id: 6, label: "6 · 2", status: "active" },
        ],
      },
      entries: [
        { label: "읽은 접두사", value: '"aabab"' },
        { label: "복제 상태", value: "6" },
        { label: "len", value: "0 1 2 3 4 5 2" },
        { label: "link", value: "-1 0 1 0 1 아직 없다 0" },
        {
          label: "전이 표",
          value:
            "0: a->1 b->6  1: a->2 b->6  2: b->3  3: a->4  4: b->5  6: a->4",
        },
        { label: "⑦ 이 전이를 바꾼 상태", value: "1 0" },
        { label: "링크가 아직 없는 상태", value: "5" },
      ],
    },
    {
      title: "T8 상태 3 과 5 의 링크를 복제 상태로 잇는다",
      detail:
        "link[3] 과 link[5] 를 6 으로 둔다. 상태 3 이 뿌리 아래에서 상태 6 아래로 옮겨 가고 상태 5 가 그 옆에 붙으면서 링크 트리가 완성된다.",
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
              { id: 2, label: "2 · 2", status: "default" },
              { id: 4, label: "4 · 4", status: "default" },
            ],
          },
          {
            id: 6,
            label: "6 · 2",
            status: "frontier",
            children: [
              { id: 3, label: "3 · 3", status: "active" },
              { id: 5, label: "5 · 5", status: "active" },
            ],
          },
        ],
      },
      entries: [
        { label: "읽은 접두사", value: '"aabab"' },
        { label: "len", value: "0 1 2 3 4 5 2" },
        { label: "link", value: "-1 0 1 6 1 6 0" },
        {
          label: "전이 표",
          value:
            "0: a->1 b->6  1: a->2 b->6  2: b->3  3: a->4  4: b->5  6: a->4",
        },
        { label: "상태 수", value: "7" },
        { label: "전이 수", value: "8" },
      ],
    },
    {
      title: 'T9 contains("aba") — 전이를 따라 끝까지 간다',
      detail:
        "뿌리에서 a 를 받아 1 로, b 를 받아 6 으로, a 를 받아 4 로 간다. 세 글자를 다 읽었으므로 부분 문자열이다.",
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
              { id: 2, label: "2 · 2", status: "default" },
              { id: 4, label: "4 · 4", status: "active" },
            ],
          },
          {
            id: 6,
            label: "6 · 2",
            status: "visited",
            children: [
              { id: 3, label: "3 · 3", status: "default" },
              { id: 5, label: "5 · 5", status: "default" },
            ],
          },
        ],
      },
      entries: [
        { label: "검색 문자열", value: '"aba"' },
        { label: "지나간 상태", value: "0 -> 1 -> 6 -> 4" },
        { label: "읽은 전이 표 항목", value: "3" },
        { label: "반환", value: "true" },
      ],
    },
    {
      title: 'T10 contains("bb") — 전이가 없어 거기서 멈춘다',
      detail:
        "뿌리에서 b 를 받아 6 으로 갔는데 상태 6 의 전이 표에는 a 밖에 없다. 두 번째 b 에서 갈 곳이 없으므로 부분 문자열이 아니다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "default",
            children: [
              { id: 2, label: "2 · 2", status: "default" },
              { id: 4, label: "4 · 4", status: "default" },
            ],
          },
          {
            id: 6,
            label: "6 · 2",
            status: "active",
            children: [
              { id: 3, label: "3 · 3", status: "default" },
              { id: 5, label: "5 · 5", status: "default" },
            ],
          },
        ],
      },
      entries: [
        { label: "검색 문자열", value: '"bb"' },
        { label: "지나간 상태", value: "0 -> 6" },
        { label: "멈춘 이유", value: "상태 6 에 b 전이가 없다" },
        { label: "읽은 전이 표 항목", value: "2" },
        { label: "반환", value: "false" },
      ],
    },
    {
      title: "T11 countDistinctSubstrings() — 길이 차를 전부 더한다",
      detail:
        "뿌리를 뺀 상태 여섯에서 len 과 len[link] 의 차를 더한다. 1 + 1 + 1 + 3 + 3 + 2 라서 11 이다.",
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
              { id: 2, label: "2 · 2", status: "visited" },
              { id: 4, label: "4 · 4", status: "visited" },
            ],
          },
          {
            id: 6,
            label: "6 · 2",
            status: "visited",
            children: [
              { id: 3, label: "3 · 3", status: "visited" },
              { id: 5, label: "5 · 5", status: "visited" },
            ],
          },
        ],
      },
      entries: [
        { label: "상태별 len - len[link]", value: "1 1 1 3 3 2" },
        { label: "상태 차례", value: "1 2 3 4 5 6" },
        { label: "누적", value: "1 2 3 6 9 11" },
        { label: "반환", value: "11" },
      ],
    },
  ] satisfies Frame[],
};
