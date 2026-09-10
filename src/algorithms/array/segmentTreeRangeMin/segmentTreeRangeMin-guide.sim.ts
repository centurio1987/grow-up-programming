import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(13)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 선례를 그대로 따른다
 *
 * 다섯 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세웠고
 * `prefixSumRangeQuery-guide.sim.ts` 가 파생 배열이 주인공인 편으로 넓혔다. 이 편은 그
 * 파생 자료구조가 **배열이 아니라 트리**인 첫 자리라, 어긋나기 쉬운 두 자리를 적어 둔다.
 *
 * 1. **`array` 는 지금 시점의 `A` 만 담는다.** 트리 배열 `tree` 를 여기 넣지 않는다 —
 *    넣으면 화면의 칸 번호가 인덱스가 아니라 노드 번호가 되어 본문의 `A[i]` 와 대조할 수
 *    없다. 다행히 **트리의 리프가 곧 `A`** 라서 이 패널이 트리의 맨 아랫줄을 그대로 보인다.
 *    갱신이 일어난 T7 부터 `array` 의 값이 바뀐다.
 * 2. **위 세 노드의 값은 `keyValue` 가 적는다.** 노드 번호는 자리가 아니라 이름이라
 *    `pointers` 로 배열 위에 얹을 수 없다. 트리 전체를 한 화면에 보이는 것은 md 쪽 ascii
 *    그림이 진다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `l`·`r`·`i`.
 * 4. **`highlight` 는 지금 보는 노드의 담당 구간, `marked` 는 연산이 가리키는 구간.**
 *    둘이 어긋나는 프레임이 이 알고리즘의 판정이 갈리는 자리다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 그래서 트리를
 *    채우는 걸음을 따로 export 하지 않고 T1 한 프레임으로 담았다 — 채우는 아홉 걸음을
 *    프레임으로 펴면 그 구간에서 `노드1`·`노드2`·`노드3` 이 빈 항목이 되고 규약 5 가
 *    깨진다. 채우는 과정은 md 쪽 표가 노드 아홉을 전부 보인다.
 */
export const walk = {
  view: ["array", "keyValue"] as const,
  title: "구간 최솟값 트리 — A = [5, 2, 4, 1, 3]",
  result: "[1, 2, 2, 3]",
  steps: [
    {
      title: "T1 트리를 다 채웠다",
      detail:
        "리프가 A 를 그대로 들고, 위 노드는 자식 둘의 작은 쪽을 든다. 뿌리는 전체 최솟값 1 이다.",
      array: [5, 2, 4, 1, 3],
      highlight: [],
      marked: [],
      pointers: {},
      entries: [
        { label: "지금 보는 노드", value: "—" },
        { label: "판정", value: "채우기를 마쳤다" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 1 },
        { label: "답", value: "[]" },
      ],
    },
    {
      title: "T2 질의 l=0 r=4 — 뿌리에서 끝난다",
      detail:
        "질의 구간이 뿌리의 담당 구간과 같다. 저장해 둔 값을 그대로 돌려주고 더 내려가지 않는다.",
      array: [5, 2, 4, 1, 3],
      highlight: [0, 1, 2, 3, 4],
      marked: [0, 1, 2, 3, 4],
      pointers: { l: 0, r: 4 },
      entries: [
        { label: "지금 보는 노드", value: "노드1 [0,4]" },
        { label: "판정", value: "통째로 들어간다 → 1" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 1 },
        { label: "답", value: "[1]" },
      ],
    },
    {
      title: "T3 질의 l=0 r=2 — 뿌리가 걸쳐 있다",
      detail:
        "질의 구간 [0,2] 가 뿌리의 [0,4] 안에 있지만 같지는 않다. 두 자식에게 나눠 묻는다.",
      array: [5, 2, 4, 1, 3],
      highlight: [0, 1, 2, 3, 4],
      marked: [0, 1, 2],
      pointers: { l: 0, r: 2 },
      entries: [
        { label: "지금 보는 노드", value: "노드1 [0,4]" },
        { label: "판정", value: "걸쳐 있다 → 자식 둘에게" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 1 },
        { label: "답", value: "[1]" },
      ],
    },
    {
      title: "T4 왼쪽 자식 노드2 — 통째로 들어간다",
      detail:
        "노드2 의 담당 구간이 질의 구간과 같다. 저장값 2 를 그대로 돌려준다.",
      array: [5, 2, 4, 1, 3],
      highlight: [0, 1, 2],
      marked: [0, 1, 2],
      pointers: { l: 0, r: 2 },
      entries: [
        { label: "지금 보는 노드", value: "노드2 [0,2]" },
        { label: "판정", value: "통째로 들어간다 → 2" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 1 },
        { label: "답", value: "[1]" },
      ],
    },
    {
      title: "T5 오른쪽 자식 노드3 — 겹치지 않는다",
      detail:
        "노드3 의 담당 구간 [3,4] 가 질의 [0,2] 와 한 칸도 안 겹친다. INF 를 돌려줘 최솟값을 바꾸지 않는다.",
      array: [5, 2, 4, 1, 3],
      highlight: [3, 4],
      marked: [0, 1, 2],
      pointers: { l: 0, r: 2 },
      entries: [
        { label: "지금 보는 노드", value: "노드3 [3,4]" },
        { label: "판정", value: "겹치지 않는다 → INF" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 1 },
        { label: "답", value: "[1]" },
      ],
    },
    {
      title: "T6 두 답을 합친다",
      detail:
        "min(2, INF) = 2. 겹치지 않은 가지가 답을 바꾸지 못한 것이 여기서 확인된다.",
      array: [5, 2, 4, 1, 3],
      highlight: [0, 1, 2],
      marked: [0, 1, 2],
      pointers: { l: 0, r: 2 },
      entries: [
        { label: "지금 보는 노드", value: "노드1 [0,4]" },
        { label: "판정", value: "min(2, INF) = 2" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 1 },
        { label: "답", value: "[1, 2]" },
      ],
    },
    {
      title: "T7 갱신 i=3 v=10 — 리프에 쓴다",
      detail:
        "인덱스 3 을 담당하는 리프는 노드6 이다. 값을 10 으로 덮어쓴다. 위 노드는 아직 옛 값이다.",
      array: [5, 2, 4, 10, 3],
      highlight: [3],
      marked: [3],
      pointers: { i: 3 },
      entries: [
        { label: "지금 보는 노드", value: "노드6 [3,3]" },
        { label: "판정", value: "리프에 10 을 쓴다" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 1 },
        { label: "답", value: "[1, 2]" },
      ],
    },
    {
      title: "T8 부모 노드3 을 다시 계산한다",
      detail:
        "노드3 = min(노드6=10, 노드7=3) = 3. 옛 값 1 은 이제 어디에도 없다.",
      array: [5, 2, 4, 10, 3],
      highlight: [3, 4],
      marked: [3],
      pointers: { i: 3 },
      entries: [
        { label: "지금 보는 노드", value: "노드3 [3,4]" },
        { label: "판정", value: "min(10, 3) = 3 으로 고친다" },
        { label: "노드1 [0,4]", value: 1 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 3 },
        { label: "답", value: "[1, 2]" },
      ],
    },
    {
      title: "T9 뿌리까지 올라간다",
      detail:
        "노드1 = min(노드2=2, 노드3=3) = 2. 리프에서 뿌리까지 고친 노드가 셋뿐이다.",
      array: [5, 2, 4, 10, 3],
      highlight: [0, 1, 2, 3, 4],
      marked: [3],
      pointers: { i: 3 },
      entries: [
        { label: "지금 보는 노드", value: "노드1 [0,4]" },
        { label: "판정", value: "min(2, 3) = 2 로 고친다" },
        { label: "노드1 [0,4]", value: 2 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 3 },
        { label: "답", value: "[1, 2]" },
      ],
    },
    {
      title: "T10 질의 l=0 r=4 를 다시 묻는다",
      detail:
        "같은 질의인데 답이 1 에서 2 로 바뀌었다. 갱신이 뿌리까지 반영된 결과다.",
      array: [5, 2, 4, 10, 3],
      highlight: [0, 1, 2, 3, 4],
      marked: [0, 1, 2, 3, 4],
      pointers: { l: 0, r: 4 },
      entries: [
        { label: "지금 보는 노드", value: "노드1 [0,4]" },
        { label: "판정", value: "통째로 들어간다 → 2" },
        { label: "노드1 [0,4]", value: 2 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 3 },
        { label: "답", value: "[1, 2, 2]" },
      ],
    },
    {
      title: "T11 질의 l=3 r=4 — 뿌리가 걸쳐 있다",
      detail:
        "오른쪽 끝 두 칸을 묻는다. 뿌리는 그보다 넓으므로 두 자식에게 나눠 묻는다.",
      array: [5, 2, 4, 10, 3],
      highlight: [0, 1, 2, 3, 4],
      marked: [3, 4],
      pointers: { l: 3, r: 4 },
      entries: [
        { label: "지금 보는 노드", value: "노드1 [0,4]" },
        { label: "판정", value: "걸쳐 있다 → 자식 둘에게" },
        { label: "노드1 [0,4]", value: 2 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 3 },
        { label: "답", value: "[1, 2, 2]" },
      ],
    },
    {
      title: "T12 왼쪽 자식 노드2 — 겹치지 않는다",
      detail:
        "노드2 의 담당 구간 [0,2] 가 질의 [3,4] 와 안 겹친다. 가지 하나가 통째로 빠진다.",
      array: [5, 2, 4, 10, 3],
      highlight: [0, 1, 2],
      marked: [3, 4],
      pointers: { l: 3, r: 4 },
      entries: [
        { label: "지금 보는 노드", value: "노드2 [0,2]" },
        { label: "판정", value: "겹치지 않는다 → INF" },
        { label: "노드1 [0,4]", value: 2 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 3 },
        { label: "답", value: "[1, 2, 2]" },
      ],
    },
    {
      title: "T13 오른쪽 자식 노드3 — 통째로 들어간다",
      detail:
        "노드3 의 담당 구간이 질의 구간과 같다. 저장값 3 을 돌려주고 min(INF, 3) = 3 이 답이다.",
      array: [5, 2, 4, 10, 3],
      highlight: [3, 4],
      marked: [3, 4],
      pointers: { l: 3, r: 4 },
      entries: [
        { label: "지금 보는 노드", value: "노드3 [3,4]" },
        { label: "판정", value: "통째로 들어간다 → 3" },
        { label: "노드1 [0,4]", value: 2 },
        { label: "노드2 [0,2]", value: 2 },
        { label: "노드3 [3,4]", value: 3 },
        { label: "답", value: "[1, 2, 2, 3]" },
      ],
    },
  ] satisfies Frame[],
};
