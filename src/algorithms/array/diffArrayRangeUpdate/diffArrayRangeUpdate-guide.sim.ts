import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(13)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 다섯 규약을 그대로 따른다
 *
 * 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세우고 `prefixSumRangeQuery-guide.sim.ts`
 * 가 파생 배열에, `subarraySumEqualsK-guide.sim.ts` 가 키-값 표에 적용한 것이다. 이 편에서
 * 새로 생기는 자리는 **한 실행에 걸음의 종류가 둘**(기록 · 복원)이라는 것 하나라, 그
 * 처리를 적어 둔다.
 *
 * 1. **`array` 는 차분 배열 `D` 만 담는다.** 입력 `updates` 는 배열이 아니라 세 값의 목록이고
 *    결과 배열 `A` 는 복원이 끝나야 완성되므로, 둘 다 규약 2 에 따라 `keyValue` 가 문자열로
 *    적는다. 갱신 목록 전체를 한 화면에 보이는 것은 md 쪽 ascii 그림이 진다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 복원 중인 칸 번호 `i` 는 자리라서
 *    `pointers` 로 두고, 거기서 나온 수(`running` · `A` 의 스냅샷)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`highlight` 는 이번 걸음에서 값이 바뀐 칸, `marked` 는 복원이 끝난 칸.** 기록 걸음은
 *    경계 두 칸이 함께 바뀌므로 `highlight` 가 두 개다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 걸음의 종류가
 *    둘이어도 항목은 셋 그대로다 — 기록 걸음에서는 `running` 이 0 이고 `A` 가 비어 있다.
 */
export const restore = {
  view: ["array", "keyValue"] as const,
  title:
    "차분 배열로 구간 갱신 — N = 7, updates = [[1,3,2], [0,2,-1], [5,6,3]]",
  result: "[-1, 1, 1, 2, 0, 3, 3]",
  steps: [
    {
      title: "T1 초기화",
      detail:
        "차분 배열 D 를 0 으로 채운다. 칸이 N+1 = 8 개인 것은 오른쪽 끝이 6 인 갱신이 칸 7 에 취소를 적기 때문이다.",
      array: [0, 0, 0, 0, 0, 0, 0, 0],
      highlight: [],
      marked: [],
      entries: [
        { label: "차분 배열 D", value: "[0, 0, 0, 0, 0, 0, 0, 0]" },
        { label: "running", value: 0 },
        { label: "결과 배열 A", value: "아직 없다" },
      ],
    },
    {
      title: "T2 갱신 1,3,2 를 기록",
      detail:
        "인덱스 1 부터 3 까지 2 를 더하는 갱신이다. 칸 1 에 +2 를, 칸 4 에 −2 를 적는다. 배열 전체는 한 칸도 읽지 않았다.",
      array: [0, 2, 0, 0, -2, 0, 0, 0],
      highlight: [1, 4],
      marked: [],
      entries: [
        { label: "차분 배열 D", value: "[0, 2, 0, 0, -2, 0, 0, 0]" },
        { label: "running", value: 0 },
        { label: "결과 배열 A", value: "아직 없다" },
      ],
    },
    {
      title: "T3 갱신 0,2,-1 을 기록",
      detail:
        "더하는 값이 음수다. 칸 0 에 −1 을 적고, 칸 3 에서는 −1 을 취소하므로 +1 이 된다.",
      array: [-1, 2, 0, 1, -2, 0, 0, 0],
      highlight: [0, 3],
      marked: [],
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 0, 0, 0]" },
        { label: "running", value: 0 },
        { label: "결과 배열 A", value: "아직 없다" },
      ],
    },
    {
      title: "T4 갱신 5,6,3 을 기록",
      detail:
        "오른쪽 끝이 N−1 = 6 이라 취소가 칸 7 에 적힌다. 그 칸은 복원 루프가 읽지 않는 여분 칸이다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [5, 7],
      marked: [],
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: 0 },
        { label: "결과 배열 A", value: "아직 없다" },
      ],
    },
    {
      title: "T6 복원 i=0",
      detail: "running 에 D[0] = −1 을 더한다. A[0] 이 −1 로 정해진다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [0],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: -1 },
        { label: "결과 배열 A", value: "[-1]" },
      ],
    },
    {
      title: "T7 복원 i=1",
      detail:
        "D[1] = 2 를 더해 running 이 1 이 된다. 첫 갱신의 시작 이벤트가 여기서 반영된다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [1],
      marked: [0],
      pointers: { i: 1 },
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: 1 },
        { label: "결과 배열 A", value: "[-1, 1]" },
      ],
    },
    {
      title: "T8 복원 i=2",
      detail:
        "D[2] = 0 이라 running 이 그대로다. 경계가 아닌 칸은 앞 칸의 값을 그대로 이어받는다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [2],
      marked: [0, 1],
      pointers: { i: 2 },
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: 1 },
        { label: "결과 배열 A", value: "[-1, 1, 1]" },
      ],
    },
    {
      title: "T9 복원 i=3",
      detail:
        "D[3] = 1 을 더해 running 이 2 가 된다. 둘째 갱신의 취소 이벤트가 여기서 반영된다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [3],
      marked: [0, 1, 2],
      pointers: { i: 3 },
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: 2 },
        { label: "결과 배열 A", value: "[-1, 1, 1, 2]" },
      ],
    },
    {
      title: "T10 복원 i=4",
      detail:
        "D[4] = −2 를 더해 running 이 0 이 된다. 첫 갱신이 여기서 끝난다는 것이 이 칸에 실린다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [4],
      marked: [0, 1, 2, 3],
      pointers: { i: 4 },
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: 0 },
        { label: "결과 배열 A", value: "[-1, 1, 1, 2, 0]" },
      ],
    },
    {
      title: "T11 복원 i=5",
      detail: "D[5] = 3 을 더해 running 이 3 이 된다. 셋째 갱신이 시작된다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [5],
      marked: [0, 1, 2, 3, 4],
      pointers: { i: 5 },
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: 3 },
        { label: "결과 배열 A", value: "[-1, 1, 1, 2, 0, 3]" },
      ],
    },
    {
      title: "T12 복원 i=6",
      detail:
        "마지막 칸이다. D[6] = 0 이라 running 이 3 그대로이고, 결과 배열이 완성된다.",
      array: [-1, 2, 0, 1, -2, 3, 0, -3],
      highlight: [6],
      marked: [0, 1, 2, 3, 4, 5],
      pointers: { i: 6 },
      entries: [
        { label: "차분 배열 D", value: "[-1, 2, 0, 1, -2, 3, 0, -3]" },
        { label: "running", value: 3 },
        { label: "결과 배열 A", value: "[-1, 1, 1, 2, 0, 3, 3]" },
      ],
    },
  ] satisfies Frame[],
};
