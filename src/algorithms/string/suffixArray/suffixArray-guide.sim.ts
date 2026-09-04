import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`s = "banana"`)을 쓴다.
 * 프레임 수는 그 절의 T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 왜 `array` 하나가 아니라 `keyValue` 를 함께 쓰는가
 *
 * 이 절차가 들고 있는 것은 셋인데 **자리의 종류가 다르다.** `sa` 와 `rank` 는 둘 다 길이 `n`
 * 짜리 배열이지만 `sa[k]` 의 `k` 는 **사전순 자리**이고 `rank[i]` 의 `i` 는 **문자열 안의
 * 자리**다. 둘을 같은 눈금 위에 얹으면 같은 칸 번호가 두 가지를 가리키게 되고, 그것이
 * `FEEDBACK.md` §3 이 잡는 기호 충돌이다. 그래서 문자열의 자리는 `array`, 배열의 내용은
 * `keyValue` 로 가른다 — `findAllOccurrences-guide.sim.ts` 가 세운 규약과 같은 자리다.
 *
 * 규약 넷을 그대로 따른다.
 *
 * 1. **`array` 는 문자열 `s` 의 글자를 그대로 담는다.** 이 절차는 문자열을 고치지 않으므로
 *    프레임마다 같은 배열이 실린다. 바뀌는 것은 강조 자리와 항목 값이다.
 * 2. **`highlight` 는 그 걸음이 말하는 자리, `marked` 는 순위가 이미 하나뿐이 된 자리.**
 *    `marked` 가 1 개 → 2 개 → 6 개로 늘어나는 것이 이 절차의 핵심 장면이다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 넷이다.
 */
export const saDoubling = {
  view: ["array", "keyValue"] as const,
  title: 's = "banana" 의 접미사를 사전순으로 늘어놓는다',
  result: "[5, 3, 1, 0, 4, 2]",
  steps: [
    {
      title: "T1 첫 순위",
      detail:
        "길이 1 조각의 순위를 글자 코드로 둔다. a=97, b=98, n=110 이라 대소 관계가 사전순과 같다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [0, 1, 2, 3, 4, 5],
      marked: [0],
      pointers: { i: 0 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: "—" },
        {
          label: "rank — 문자열 자리 순서로",
          value: "[98, 97, 110, 97, 110, 97]",
        },
        { label: "sa — 지금까지 정한 순서", value: "[0, 1, 2, 3, 4, 5]" },
        { label: "이번 걸음에 한 일", value: "글자 코드를 순위로 둔다" },
      ],
    },
    {
      title: "T2 gap=1 쌍 만들기",
      detail:
        "자리 1 의 길이 2 조각은 an 이고, 앞 조각 순위 97 과 뒤 조각 순위 110+1=111 을 이어 (97, 111) 이 된다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [1, 2],
      marked: [0],
      pointers: { i: 1 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 1 },
        {
          label: "rank — 문자열 자리 순서로",
          value: "[98, 97, 110, 97, 110, 97]",
        },
        { label: "sa — 지금까지 정한 순서", value: "[0, 1, 2, 3, 4, 5]" },
        {
          label: "이번 걸음에 한 일",
          value: "쌍 (앞 조각 순위, 뒤 조각 순위) 를 만든다",
        },
      ],
    },
    {
      title: "T3 gap=1 뒤 조각으로 정렬",
      detail:
        "자리 5 는 뒤 조각이 문자열 끝을 넘어 0 이라 맨 앞으로 간다. sa 가 [5, 0, 2, 4, 1, 3] 이 된다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [5],
      marked: [0],
      pointers: { i: 5 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 1 },
        {
          label: "rank — 문자열 자리 순서로",
          value: "[98, 97, 110, 97, 110, 97]",
        },
        { label: "sa — 지금까지 정한 순서", value: "[5, 0, 2, 4, 1, 3]" },
        { label: "이번 걸음에 한 일", value: "뒤 조각 순위로 안정 정렬한다" },
      ],
    },
    {
      title: "T4 gap=1 앞 조각으로 정렬",
      detail:
        "앞 조각 순위가 97 인 자리 5·1·3 이 앞으로 모이고, 그 안의 앞뒤는 T3 이 매긴 것 그대로다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [1, 3, 5],
      marked: [0],
      pointers: { i: 5 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 1 },
        {
          label: "rank — 문자열 자리 순서로",
          value: "[98, 97, 110, 97, 110, 97]",
        },
        { label: "sa — 지금까지 정한 순서", value: "[5, 1, 3, 0, 2, 4]" },
        {
          label: "이번 걸음에 한 일",
          value: "앞 조각 순위로 다시 안정 정렬한다",
        },
      ],
    },
    {
      title: "T5 gap=1 순위 다시 매기기",
      detail:
        "자리 1 과 3 의 쌍이 둘 다 (97, 111) 이라 순위가 같게 남는다. 자리 2 와 4 도 같다. span 이 4 라 n=6 에 못 미친다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [1, 3],
      marked: [0, 5],
      pointers: { i: 1 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 1 },
        { label: "rank — 문자열 자리 순서로", value: "[2, 1, 3, 1, 3, 0]" },
        { label: "sa — 지금까지 정한 순서", value: "[5, 1, 3, 0, 2, 4]" },
        {
          label: "이번 걸음에 한 일",
          value: "같은 쌍끼리 묶어 새 순위를 매긴다 — span 4",
        },
      ],
    },
    {
      title: "T6 gap=2 쌍 만들기",
      detail:
        "자리 1 의 길이 4 조각은 anan 이고, 앞 두 글자 an 의 순위 1 과 뒤 두 글자 an 의 순위 1+1=2 를 이어 (1, 2) 가 된다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [1, 2, 3, 4],
      marked: [0, 5],
      pointers: { i: 1 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 2 },
        { label: "rank — 문자열 자리 순서로", value: "[2, 1, 3, 1, 3, 0]" },
        { label: "sa — 지금까지 정한 순서", value: "[5, 1, 3, 0, 2, 4]" },
        {
          label: "이번 걸음에 한 일",
          value: "길이 2 조각의 순위 둘로 길이 4 조각의 쌍을 만든다",
        },
      ],
    },
    {
      title: "T7 gap=2 뒤 조각으로 정렬",
      detail:
        "이번에는 자리 4 와 5 둘이 문자열 끝을 넘어 0 이 된다. 둘의 앞뒤는 T4 가 매긴 것 그대로 5 가 앞이다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [4, 5],
      marked: [0, 5],
      pointers: { i: 4 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 2 },
        { label: "rank — 문자열 자리 순서로", value: "[2, 1, 3, 1, 3, 0]" },
        { label: "sa — 지금까지 정한 순서", value: "[5, 4, 3, 1, 0, 2]" },
        { label: "이번 걸음에 한 일", value: "뒤 조각 순위로 안정 정렬한다" },
      ],
    },
    {
      title: "T8 gap=2 앞 조각으로 정렬",
      detail:
        "앞 조각 순위가 1 인 자리 3·1 이 (1, 1) 과 (1, 2) 로 갈려 3 이 앞에 온다. ana 가 anana 보다 앞이라는 뜻이다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [1, 3],
      marked: [0, 5],
      pointers: { i: 3 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 2 },
        { label: "rank — 문자열 자리 순서로", value: "[2, 1, 3, 1, 3, 0]" },
        { label: "sa — 지금까지 정한 순서", value: "[5, 3, 1, 0, 4, 2]" },
        {
          label: "이번 걸음에 한 일",
          value: "앞 조각 순위로 다시 안정 정렬한다",
        },
      ],
    },
    {
      title: "T9 gap=2 순위 다시 매기기 · 멈춤",
      detail:
        "여섯 자리의 순위가 전부 달라져 span 이 6 이 된다. n 과 같으므로 조각을 더 늘려도 순서가 안 바뀐다.",
      array: ["b", "a", "n", "a", "n", "a"],
      highlight: [0, 1, 2, 3, 4, 5],
      marked: [0, 1, 2, 3, 4, 5],
      pointers: { i: 0 },
      entries: [
        { label: "gap — 이미 순위를 아는 조각의 길이", value: 2 },
        { label: "rank — 문자열 자리 순서로", value: "[3, 2, 5, 1, 4, 0]" },
        { label: "sa — 지금까지 정한 순서", value: "[5, 3, 1, 0, 4, 2]" },
        {
          label: "이번 걸음에 한 일",
          value: "span 이 n 과 같아 멈춘다 — 답은 [5, 3, 1, 0, 4, 2]",
        },
      ],
    },
  ] satisfies Frame[],
};
