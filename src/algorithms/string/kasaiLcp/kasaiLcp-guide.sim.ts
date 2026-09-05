import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `array` 는 문자열 `s` 를 그리고 지금 견주는 두 자리를 `i`·`j` 로 짚는다.
 * `keyValue` 는 역배열 · 이어받은 `k` · 지금까지 채운 `lcp` · 실행된 갈래 라벨을 적는다.
 * 이 절차는 **답을 자리 순서가 아니라 순위 순서로 채우므로** 문자열 그림만으로는 「어느 칸이
 * 채워졌는가」가 보이지 않는다.
 *
 * **한 프레임이 자리 하나다.** 글자 견주기 하나마다 프레임을 두면 걸음이 늘어나기만 하고
 * 「이어받은 `k` 덕분에 견주기가 몇 번으로 끝났는가」가 사라진다. 대신 `detail` 이 그 자리의
 * 견주기를 전부 적는다.
 *
 * **`highlight` 는 그 자리에서 실제로 같음을 확인한 칸이다.** 견주기가 한 번도 성공하지
 * 않은 자리에는 두지 않는다. `pointers` 는 자리 `i` 와 그 이웃 `j` 를 짚는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const kasaiWalk = {
  view: ["array", "keyValue"] as const,
  title: 'kasaiLcp("banana", [5, 3, 1, 0, 4, 2])',
  result: "[1, 3, 0, 0, 2, 0]",
  steps: [
    {
      title: "T1 역배열을 만든다",
      detail:
        "inv[sa[r]] = r 을 여섯 칸에 적는다. sa = [5, 3, 1, 0, 4, 2] 이므로 inv = [3, 2, 5, 1, 4, 0] 이다. k 는 0 에서 시작하고 lcp 는 전부 0 이다.",
      array: ["b", "a", "n", "a", "n", "a"],
      entries: [
        { label: "자리 i", value: "아직 없다" },
        { label: "inv", value: "[3, 2, 5, 1, 4, 0]" },
        { label: "이어받은 k", value: 0 },
        { label: "lcp (순위 순)", value: "[0, 0, 0, 0, 0, 0]" },
        { label: "실행된 갈래", value: "① 역배열" },
      ],
    },
    {
      title: "T2 자리 0 — 첫 글자부터 다르다",
      detail:
        "inv[0] = 3 이라 이웃은 sa[4] = 4 다. k = 0 에서 s[0] = b 와 s[4] = n 을 견주면 다르므로 그대로 멈춘다. lcp[3] = 0 을 적는다.",
      array: ["b", "a", "n", "a", "n", "a"],
      pointers: { i: 0, j: 4 },
      entries: [
        { label: "자리 i", value: "0 — 접미사 banana" },
        { label: "이웃 j", value: "4 — 접미사 na" },
        { label: "이어받은 k", value: 0 },
        { label: "lcp (순위 순)", value: "[0, 0, 0, 0, 0, 0]" },
        { label: "실행된 갈래", value: "③ 이웃 · ④ 견주기 · ⑤ 기록" },
      ],
    },
    {
      title: "T3 자리 1 — 역시 첫 글자에서 멈춘다",
      detail:
        "inv[1] = 2 이라 이웃은 sa[3] = 0 이다. s[1] = a 와 s[0] = b 가 달라 k 가 0 그대로다. lcp[2] = 0 을 적는다.",
      array: ["b", "a", "n", "a", "n", "a"],
      pointers: { i: 1, j: 0 },
      entries: [
        { label: "자리 i", value: "1 — 접미사 anana" },
        { label: "이웃 j", value: "0 — 접미사 banana" },
        { label: "이어받은 k", value: 0 },
        { label: "lcp (순위 순)", value: "[0, 0, 0, 0, 0, 0]" },
        { label: "실행된 갈래", value: "③ 이웃 · ④ 견주기 · ⑤ 기록" },
      ],
    },
    {
      title: "T4 자리 2 — 이웃이 없다",
      detail:
        "inv[2] = 5 이고 n − 1 = 5 다. 접미사 nana 는 사전순으로 가장 뒤라 견줄 접미사가 없다. 값을 적지 않고 k 를 0 으로 되돌린 뒤 다음 자리로 넘어간다.",
      array: ["b", "a", "n", "a", "n", "a"],
      pointers: { i: 2 },
      entries: [
        { label: "자리 i", value: "2 — 접미사 nana" },
        { label: "이웃 j", value: "없다 (inv[2] = 5 = n − 1)" },
        { label: "이어받은 k", value: 0 },
        { label: "lcp (순위 순)", value: "[0, 0, 0, 0, 0, 0]" },
        { label: "실행된 갈래", value: "② 이웃 없음" },
      ],
    },
    {
      title: "T5 자리 3 — 세 글자가 같아 k 가 3 이 된다",
      detail:
        "inv[3] = 1 이라 이웃은 sa[2] = 1 이다. a·n·a 세 글자가 차례로 같아 k 가 3 까지 늘고, 자리 3 + 3 = 6 이 문자열 끝을 넘어 멈춘다. lcp[1] = 3 을 적고 하나 줄여 2 를 넘긴다.",
      array: ["b", "a", "n", "a", "n", "a"],
      pointers: { i: 3, j: 1 },
      highlight: [1, 2, 3, 4, 5],
      entries: [
        { label: "자리 i", value: "3 — 접미사 ana" },
        { label: "이웃 j", value: "1 — 접미사 anana" },
        { label: "이어받은 k", value: 0 },
        { label: "lcp (순위 순)", value: "[0, 3, 0, 0, 0, 0]" },
        {
          label: "실행된 갈래",
          value: "③ 이웃 · ④ 견주기 · ⑤ 기록 · ⑥ 하나 줄이기",
        },
      ],
    },
    {
      title: "T6 자리 4 — 이어받은 2 가 그대로 답이다",
      detail:
        "inv[4] = 4 라 이웃은 sa[5] = 2 다. k = 2 를 이어받았고 자리 4 + 2 = 6 이 이미 문자열 끝이라 글자를 한 번도 안 읽는다. lcp[4] = 2 를 적고 1 을 넘긴다.",
      array: ["b", "a", "n", "a", "n", "a"],
      pointers: { i: 4, j: 2 },
      highlight: [2, 3, 4, 5],
      entries: [
        { label: "자리 i", value: "4 — 접미사 na" },
        { label: "이웃 j", value: "2 — 접미사 nana" },
        { label: "이어받은 k", value: 2 },
        { label: "lcp (순위 순)", value: "[0, 3, 0, 0, 2, 0]" },
        { label: "실행된 갈래", value: "③ 이웃 · ⑤ 기록 · ⑥ 하나 줄이기" },
      ],
    },
    {
      title: "T7 자리 5 — 이어받은 1 이 그대로 답이다",
      detail:
        "inv[5] = 0 이라 이웃은 sa[1] = 3 이다. k = 1 을 이어받았고 자리 5 + 1 = 6 이 문자열 끝이라 여기서도 글자를 안 읽는다. lcp[0] = 1 을 적고 0 을 넘긴다.",
      array: ["b", "a", "n", "a", "n", "a"],
      pointers: { i: 5, j: 3 },
      highlight: [3, 5],
      entries: [
        { label: "자리 i", value: "5 — 접미사 a" },
        { label: "이웃 j", value: "3 — 접미사 ana" },
        { label: "이어받은 k", value: 1 },
        { label: "lcp (순위 순)", value: "[1, 3, 0, 0, 2, 0]" },
        { label: "실행된 갈래", value: "③ 이웃 · ⑤ 기록 · ⑥ 하나 줄이기" },
      ],
    },
    {
      title: "T8 답을 돌려준다",
      detail:
        "자리 여섯을 다 처리했다. 글자를 견준 것은 같음 확인 세 번과 다름 확인 두 번, 모두 다섯 번이다. 짝마다 처음부터 견주면 여덟 번이 든다.",
      array: ["b", "a", "n", "a", "n", "a"],
      marked: [0, 1, 2, 3, 4, 5],
      entries: [
        { label: "자리 i", value: "끝났다" },
        { label: "inv", value: "[3, 2, 5, 1, 4, 0]" },
        { label: "이어받은 k", value: 0 },
        { label: "lcp (순위 순)", value: "[1, 3, 0, 0, 2, 0]" },
        { label: "실행된 갈래", value: "반환값 [1, 3, 0, 0, 2, 0]" },
      ],
    },
  ] satisfies Frame[],
};
