import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가
 * 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 이 편에서 `array` 와 `keyValue` 가 각각 무엇을 담는가
 *
 * 이 절차는 배열 하나를 왼쪽에서 오른쪽으로 한 번 지나면서, 답이 아직 정해지지 않은 **자리**
 * 를 스택에 담아 둔다. 화면에 나와야 하는 것이 셋이고 성질이 다르다 — 입력 배열은 칸 번호가
 * 뜻을 가지고, 스택은 순서가 뜻을 가지며, 답 배열은 값이 하나씩 채워진다.
 *
 * 1. **`array` 는 입력 배열 `nums` 만 담는다.** 칸 번호가 본문의 `nums[i]` 와 그대로 맞는다.
 * 2. **`highlight` 는 지금 읽는 자리 `i`, `marked` 는 스택에 남아 있는 자리.** 둘이 만나는
 *    프레임이 「꼭대기와 맞대 본다」가 실제로 일어나는 자리다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i` 와 `top`.
 * 4. **스택과 답 배열은 `keyValue` 가 적는다.** 스택은 바닥에서 꼭대기로 적고, 답 배열은 값
 *    나열로 적어 어느 자리가 아직 `-1` 인지가 한 줄에서 확인된다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 그래서 「지금
 *    하는 일」 칸을 비우지 않으려고 한 걸음에 한 가지 일만 담았다 — T3 과 T4 처럼 같은 `i`
 *    안에서 꺼내기와 넣기가 갈리는 자리는 프레임을 나눴다.
 */
export const walk = {
  view: ["array", "keyValue"] as const,
  title: "단조 스택으로 다음 큰 원소 찾기 — nums = [2, 1, 2, 4, 3]",
  result: "[4, 2, 4, -1, -1]",
  steps: [
    {
      title: "T1 자리 0 을 넣는다",
      detail:
        "스택이 비어 있어 맞대 볼 꼭대기가 없다. 자리 0(값 2)을 답이 아직 없는 자리로 넣는다.",
      array: [2, 1, 2, 4, 3],
      highlight: [0],
      marked: [0],
      pointers: { i: 0 },
      entries: [
        { label: "지금 하는 일", value: "자리 0 을 넣었다" },
        { label: "스택(바닥→꼭대기)", value: "[0]" },
        { label: "스택의 값", value: "2" },
        { label: "답", value: "[-1 -1 -1 -1 -1]" },
      ],
    },
    {
      title: "T2 꼭대기 2 가 1 보다 작지 않아 멈춘다",
      detail:
        "꼭대기는 자리 0 이고 그 값이 2 다. 2 는 지금 값 1 보다 작지 않으므로 아무것도 안 꺼내고 자리 1 을 넣는다.",
      array: [2, 1, 2, 4, 3],
      highlight: [1],
      marked: [0, 1],
      pointers: { i: 1, top: 0 },
      entries: [
        { label: "지금 하는 일", value: "멈추고 자리 1 을 넣었다" },
        { label: "스택(바닥→꼭대기)", value: "[0 1]" },
        { label: "스택의 값", value: "2 1" },
        { label: "답", value: "[-1 -1 -1 -1 -1]" },
      ],
    },
    {
      title: "T3 꼭대기 1 이 2 보다 작아 꺼낸다",
      detail:
        "꼭대기는 자리 1 이고 그 값이 1 이다. 1 < 2 이므로 꺼내고, 자리 1 의 답을 2 로 확정한다.",
      array: [2, 1, 2, 4, 3],
      highlight: [2],
      marked: [0],
      pointers: { i: 2, top: 1 },
      entries: [
        { label: "지금 하는 일", value: "자리 1 을 꺼내 답 2 를 적었다" },
        { label: "스택(바닥→꼭대기)", value: "[0]" },
        { label: "스택의 값", value: "2" },
        { label: "답", value: "[-1 2 -1 -1 -1]" },
      ],
    },
    {
      title: "T4 꼭대기 2 가 2 보다 작지 않아 멈춘다",
      detail:
        "다음 꼭대기는 자리 0 이고 그 값이 2 다. 같은 값은 답이 되지 못하므로 여기서 멈추고 자리 2 를 넣는다.",
      array: [2, 1, 2, 4, 3],
      highlight: [2],
      marked: [0, 2],
      pointers: { i: 2, top: 0 },
      entries: [
        { label: "지금 하는 일", value: "멈추고 자리 2 를 넣었다" },
        { label: "스택(바닥→꼭대기)", value: "[0 2]" },
        { label: "스택의 값", value: "2 2" },
        { label: "답", value: "[-1 2 -1 -1 -1]" },
      ],
    },
    {
      title: "T5 꼭대기 2 가 4 보다 작아 꺼낸다",
      detail:
        "꼭대기는 자리 2 이고 그 값이 2 다. 2 < 4 이므로 꺼내고, 자리 2 의 답을 4 로 확정한다.",
      array: [2, 1, 2, 4, 3],
      highlight: [3],
      marked: [0],
      pointers: { i: 3, top: 2 },
      entries: [
        { label: "지금 하는 일", value: "자리 2 를 꺼내 답 4 를 적었다" },
        { label: "스택(바닥→꼭대기)", value: "[0]" },
        { label: "스택의 값", value: "2" },
        { label: "답", value: "[-1 2 4 -1 -1]" },
      ],
    },
    {
      title: "T6 다음 꼭대기 2 도 4 보다 작아 꺼낸다",
      detail:
        "같은 걸음에서 한 번 더 꺼낸다. 자리 0 의 값 2 도 4 보다 작으므로 답을 4 로 확정한다.",
      array: [2, 1, 2, 4, 3],
      highlight: [3],
      marked: [],
      pointers: { i: 3, top: 0 },
      entries: [
        { label: "지금 하는 일", value: "자리 0 을 꺼내 답 4 를 적었다" },
        { label: "스택(바닥→꼭대기)", value: "[]" },
        { label: "스택의 값", value: "—" },
        { label: "답", value: "[4 2 4 -1 -1]" },
      ],
    },
    {
      title: "T7 스택이 비어 자리 3 을 넣는다",
      detail:
        "꺼낼 꼭대기가 없어 반복이 끝났다. 자리 3(값 4)을 답이 아직 없는 자리로 넣는다.",
      array: [2, 1, 2, 4, 3],
      highlight: [3],
      marked: [3],
      pointers: { i: 3 },
      entries: [
        { label: "지금 하는 일", value: "자리 3 을 넣었다" },
        { label: "스택(바닥→꼭대기)", value: "[3]" },
        { label: "스택의 값", value: "4" },
        { label: "답", value: "[4 2 4 -1 -1]" },
      ],
    },
    {
      title: "T8 꼭대기 4 가 3 보다 작지 않아 멈춘다",
      detail:
        "꼭대기는 자리 3 이고 그 값이 4 다. 4 는 3 보다 작지 않으므로 멈추고 자리 4 를 넣는다.",
      array: [2, 1, 2, 4, 3],
      highlight: [4],
      marked: [3, 4],
      pointers: { i: 4, top: 3 },
      entries: [
        { label: "지금 하는 일", value: "멈추고 자리 4 를 넣었다" },
        { label: "스택(바닥→꼭대기)", value: "[3 4]" },
        { label: "스택의 값", value: "4 3" },
        { label: "답", value: "[4 2 4 -1 -1]" },
      ],
    },
    {
      title: "T9 남은 자리는 -1 을 그대로 쓴다",
      detail:
        "순회가 끝났다. 스택에 남은 자리 3 과 4 는 오른쪽에 더 큰 값이 없었다는 뜻이라, 처음에 깔아 둔 -1 이 그대로 답이 된다.",
      array: [2, 1, 2, 4, 3],
      highlight: [],
      marked: [3, 4],
      pointers: {},
      entries: [
        { label: "지금 하는 일", value: "순회를 마쳤다" },
        { label: "스택(바닥→꼭대기)", value: "[3 4]" },
        { label: "스택의 값", value: "4 3" },
        { label: "답", value: "[4 2 4 -1 -1]" },
      ],
    },
  ] satisfies Frame[],
};
