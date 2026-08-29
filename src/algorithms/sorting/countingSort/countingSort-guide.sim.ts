import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [3, 1, 3, 0, 5, 1, 3]`.
 * 프레임 수(13)는 그 절의 T# 단계 수(16)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 다섯 규약을 그대로 따른다
 *
 * 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세우고 `subarraySumEqualsK-guide.sim.ts`
 * 가 키-값 표에 적용한 것이다. 이 편에서 새로 생기는 자리는 **배열이 둘이라는 것** 하나라,
 * 그 처리를 적어 둔다.
 *
 * 1. **`array` 는 입력 배열 `A` 만 담는다.** 이 절차가 만드는 배열은 둘인데(`count` 와
 *    `out`) 둘 다 `array` 에 넣으면 어느 것이 입력인지 갈리지 않는다. `count` 의 칸은
 *    규약 2 에 따라 **스칼라로 쪼개** `keyValue` 가 적고, `out` 도 같은 자리에 문자열로 적는다.
 *    칸 1001 개를 한 화면에 보이는 것은 md 쪽 ascii 그림이 진다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 읽고 있는 자리 `i` 는 위치라서 `pointers`
 *    로 두고, 거기서 나온 수(값마다의 개수 · 결과 배열)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`highlight` 는 지금 읽는 칸, `marked` 는 이미 센 칸.** 출력 단계에서는 입력을 더 읽지
 *    않으므로 일곱 칸이 전부 `marked` 로 남고 `highlight` 가 없다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 값이 0 인 자리
 *    (`count[2]`·`count[4]`)도 빼지 않는다 — 그 두 칸이 출력 단계의 갈래 하나를 담당한다.
 */
export const walk7 = {
  view: ["array", "keyValue"] as const,
  title: "countingSort([3, 1, 3, 0, 5, 1, 3])",
  result: "[0, 1, 1, 3, 3, 3, 5]",
  steps: [
    {
      title: "T2 i=0 — 값 3 을 센다",
      detail:
        "A[0] 이 3 이므로 자리 3 의 개수를 1 로 올린다. 다른 값과 견주지 않는다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      highlight: [0],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "count[0]", value: 0 },
        { label: "count[1]", value: 0 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 1 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 0 },
        { label: "out", value: "[]" },
      ],
    },
    {
      title: "T3 i=1 — 값 1 을 센다",
      detail: "A[1] 이 1 이므로 자리 1 의 개수가 1 이 된다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      highlight: [1],
      marked: [0],
      pointers: { i: 1 },
      entries: [
        { label: "count[0]", value: 0 },
        { label: "count[1]", value: 1 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 1 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 0 },
        { label: "out", value: "[]" },
      ],
    },
    {
      title: "T4 i=2 — 값 3 이 두 번째로 나온다",
      detail:
        "이미 1 이 적혀 있던 자리 3 이 2 가 된다. 같은 값이 거듭 나오는 자리다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      highlight: [2],
      marked: [0, 1],
      pointers: { i: 2 },
      entries: [
        { label: "count[0]", value: 0 },
        { label: "count[1]", value: 1 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 2 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 0 },
        { label: "out", value: "[]" },
      ],
    },
    {
      title: "T5 i=3 — 값 0 을 센다",
      detail: "값의 최솟값도 자기 자리를 갖는다. 자리 0 의 개수가 1 이 된다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      highlight: [3],
      marked: [0, 1, 2],
      pointers: { i: 3 },
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 1 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 2 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 0 },
        { label: "out", value: "[]" },
      ],
    },
    {
      title: "T6 i=4 — 값 5 를 센다",
      detail:
        "자리 4 를 건너뛰고 자리 5 에 적는다. 자리를 찾는 데 견주기가 필요 없다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      highlight: [4],
      marked: [0, 1, 2, 3],
      pointers: { i: 4 },
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 1 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 2 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[]" },
      ],
    },
    {
      title: "T7 i=5 — 값 1 이 두 번째로 나온다",
      detail: "자리 1 이 2 가 된다. 앞에 적힌 1 을 덮어쓰지 않고 더한다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      highlight: [5],
      marked: [0, 1, 2, 3, 4],
      pointers: { i: 5 },
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 2 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[]" },
      ],
    },
    {
      title: "T8 i=6 — 값 3 이 세 번째로 나온다",
      detail:
        "마지막 칸이다. 자리 3 이 3 이 되고 개수의 합이 입력 칸 수 7 과 같아진다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      highlight: [6],
      marked: [0, 1, 2, 3, 4, 5],
      pointers: { i: 6 },
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 3 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[]" },
      ],
    },
    {
      title: "T9 v=0 — 개수 1 만큼 이어 쓴다",
      detail: "자리 0 의 개수가 1 이므로 0 을 한 번 적는다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      marked: [0, 1, 2, 3, 4, 5, 6],
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 3 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[0]" },
      ],
    },
    {
      title: "T10 v=1 — 개수 2 만큼 이어 쓴다",
      detail: "1 을 두 번 적는다. 같은 값 둘이 나란히 놓인다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      marked: [0, 1, 2, 3, 4, 5, 6],
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 3 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[0, 1, 1]" },
      ],
    },
    {
      title: "T11 v=2 — 개수 0 이라 아무것도 안 쓴다",
      detail:
        "입력에 없던 값이다. 안쪽 반복이 한 번도 실행되지 않고 out 이 그대로 남는다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      marked: [0, 1, 2, 3, 4, 5, 6],
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 3 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[0, 1, 1]" },
      ],
    },
    {
      title: "T12 v=3 — 개수 3 만큼 이어 쓴다",
      detail: "3 을 세 번 적는다. 입력에서 흩어져 있던 셋이 여기서 모인다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      marked: [0, 1, 2, 3, 4, 5, 6],
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 3 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[0, 1, 1, 3, 3, 3]" },
      ],
    },
    {
      title: "T13 v=4 — 개수 0 이라 아무것도 안 쓴다",
      detail: "두 번째로 비어 있는 자리다. 여기서도 out 이 그대로 남는다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      marked: [0, 1, 2, 3, 4, 5, 6],
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 3 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[0, 1, 1, 3, 3, 3]" },
      ],
    },
    {
      title: "T14 v=5 — 개수 1 만큼 이어 쓴다",
      detail:
        "마지막 값이 자리를 잡는다. out 의 칸 수가 입력 칸 수 7 과 같아졌다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      marked: [0, 1, 2, 3, 4, 5, 6],
      entries: [
        { label: "count[0]", value: 1 },
        { label: "count[1]", value: 2 },
        { label: "count[2]", value: 0 },
        { label: "count[3]", value: 3 },
        { label: "count[4]", value: 0 },
        { label: "count[5]", value: 1 },
        { label: "out", value: "[0, 1, 1, 3, 3, 3, 5]" },
      ],
    },
  ] satisfies Frame[],
};
