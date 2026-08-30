import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`5 15 1 3 5`)을 쓴다. 프레임
 * 수는 그 절의 T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * ## `keyValue` + `priorityQueue` 조합의 첫 사용 — 프레임을 이렇게 설계했다
 *
 * `priorityQueue` 뷰의 선례는 `src/algorithms/shortest-path/dijkstra/dijkstra-guide.sim.ts`
 * 가 다섯 규약으로 세워 뒀다. 이 편은 그 다섯을 이어받되 **힙이 둘**이라 두 자리에서
 * 어긋난다. 어긋나는 자리와 그 이유를 여기 적는다 — 같은 조합의 다음 편이 이 파일을
 * 본보기로 삼는다.
 *
 * 1. **`heap` 은 정렬한 목록이 아니라 배열의 실제 순서다.** dijkstra 규약 1 을 그대로
 *    이어받는다. `PriorityQueueView` 가 *"배열 순서대로의 힙 원소. key 기준 정렬은
 *    시각화하지 않고 그대로 그린다"* 로 정의돼 있고(`src/_guide-sim/index.tsx`), 정렬해
 *    그리면 「꼭대기가 가장 큰 값이다」가 그림의 성질이 되어 버려서 힙이 **왜** 그 순서를
 *    만드는지가 사라진다. T7 의 작은 쪽 `3 1` 과 T8 의 `5 1 3` 이 그 자리다 — 배열이
 *    정렬돼 있지 않은데 꼭대기만 최댓값이다.
 * 2. **한 패널에 두 힙을 이어 붙인다.** `PriorityQueueFrame` 의 `heap` 은 배열 하나라
 *    두 힙을 담을 자리가 없다. 새 필드를 최상위에 더하는 것은 `Frame` 이 `Partial<…>`
 *    교집합이라 위험하고(`BaseFrame.extra` 주석), 패널을 둘로 늘리려면 `extraViews` 가
 *    필요한데 그것은 샌드박스 전용이다. 그래서 **작은 쪽 항목들 뒤에 큰 쪽 항목들을 잇고
 *    `label` 로 가른다.** 경계는 `label` 이 바뀌는 자리다.
 * 3. **`label` 은 어느 힙인가, `key` 는 그 자리에 있는 값이다.** dijkstra 규약 3 은
 *    `label` 이 정점, `key` 가 그때 적힌 거리였는데 여기서는 **항목의 정체가 곧 값**이라
 *    라벨에 담을 다른 것이 없다. 어긋나는 자리이고, 그래서 라벨이 어느 절반인지를 진다.
 * 4. **`highlight` 는 두 꼭대기의 자리다** — `[0, 작은 쪽의 크기]`. dijkstra 규약 2 는
 *    `highlight: [0]` 하나였는데, 이 절차는 **두 꼭대기를 동시에 읽어 답을 만들기** 때문에
 *    하나로는 답이 어디서 나오는지 안 보인다. 한쪽이 비면 하나만, 둘 다 비면 없다.
 * 5. **`graph` 자리를 `keyValue` 가 대신한다.** dijkstra 는 큐만 보면 키가 그래프의 어느
 *    자리에서 왔는지 안 보인다는 이유로 `graph` 와 짝지었다. 이 편에는 그림으로 그릴 바탕이
 *    없고, 대신 **두 힙의 크기 차이와 지금 실행한 갈래**가 매 걸음의 판정을 정한다. 그것을
 *    `keyValue` 표가 진다 — `coinChangeWays-guide.sim.ts` 가 같은 이유로 표 옆에 쓴 뷰다.
 *
 * T2·T3·T4 는 첫 `addNum` 한 벌을 세 줄로 갈라 놓은 것이라 `N` 이 셋 다 1 이다. 그 뒤
 * T5~T8 은 한 프레임이 `addNum` 한 벌과 `findMedian` 한 벌이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const medianWalk = {
  view: ["keyValue", "priorityQueue"] as const,
  title: "addNum(5) addNum(15) addNum(1) addNum(3) addNum(5) 사이의 findMedian",
  result: "5",
  steps: [
    {
      title: "T1 시작값",
      detail:
        "두 힙이 모두 비어 있다. 아직 아무 수도 들어오지 않았으므로 물어볼 수도 없다.",
      entries: [
        { label: "들어온 수 N", value: 0 },
        { label: "작은 쪽 크기", value: 0 },
        { label: "큰 쪽 크기", value: 0 },
        { label: "갈래", value: "-" },
        { label: "중앙값", value: "-" },
      ],
      heap: [],
    },
    {
      title: "T2 addNum(5) — 작은 쪽에 넣는다",
      detail:
        "값이 어느 절반에 속하는지 견주지 않고 작은 쪽에 그냥 넣는다. 갈래 ① 이다.",
      entries: [
        { label: "들어온 수 N", value: 1 },
        { label: "작은 쪽 크기", value: 1 },
        { label: "큰 쪽 크기", value: 0 },
        { label: "갈래", value: "①" },
        { label: "중앙값", value: "아직 안 물었다" },
      ],
      heap: [{ label: "작은 쪽", key: 5 }],
      highlight: [0],
    },
    {
      title: "T3 addNum(5) — 꼭대기를 큰 쪽으로 옮긴다",
      detail:
        "작은 쪽의 최댓값을 꺼내 큰 쪽에 넣는다. 갈래 ② 다. 이 줄이 두 절반의 경계를 맞춘다.",
      entries: [
        { label: "들어온 수 N", value: 1 },
        { label: "작은 쪽 크기", value: 0 },
        { label: "큰 쪽 크기", value: 1 },
        { label: "갈래", value: "②" },
        { label: "중앙값", value: "아직 안 물었다" },
      ],
      heap: [{ label: "큰 쪽", key: 5 }],
      highlight: [0],
    },
    {
      title: "T4 addNum(5) — 도로 옮긴다 · findMedian",
      detail:
        "큰 쪽이 하나 더 많아졌으므로 최솟값 하나를 작은 쪽으로 도로 옮긴다(③ 참). 개수가 1 과 0 으로 다르니 작은 쪽 꼭대기가 답이다(④ 거짓).",
      entries: [
        { label: "들어온 수 N", value: 1 },
        { label: "작은 쪽 크기", value: 1 },
        { label: "큰 쪽 크기", value: 0 },
        { label: "갈래", value: "③ 참 · ④ 거짓" },
        { label: "중앙값", value: 5 },
      ],
      heap: [{ label: "작은 쪽", key: 5 }],
      highlight: [0],
    },
    {
      title: "T5 addNum(15) · findMedian",
      detail:
        "15 를 작은 쪽에 넣으면 그것이 최댓값이라 곧바로 큰 쪽으로 옮겨진다. 개수가 1 과 1 이라 도로 옮기지 않는다(③ 거짓). 두 꼭대기의 평균이 답이다(④ 참).",
      entries: [
        { label: "들어온 수 N", value: 2 },
        { label: "작은 쪽 크기", value: 1 },
        { label: "큰 쪽 크기", value: 1 },
        { label: "갈래", value: "③ 거짓 · ④ 참" },
        { label: "중앙값", value: "(5 + 15) / 2 = 10" },
      ],
      heap: [
        { label: "작은 쪽", key: 5 },
        { label: "큰 쪽", key: 15 },
      ],
      highlight: [0, 1],
    },
    {
      title: "T6 addNum(1) · findMedian",
      detail:
        "1 을 작은 쪽에 넣어도 최댓값은 5 라 5 가 큰 쪽으로 옮겨진다. 큰 쪽이 둘이 되어 최솟값 5 가 도로 온다(③ 참). 작은 쪽 배열은 5 1 이다.",
      entries: [
        { label: "들어온 수 N", value: 3 },
        { label: "작은 쪽 크기", value: 2 },
        { label: "큰 쪽 크기", value: 1 },
        { label: "갈래", value: "③ 참 · ④ 거짓" },
        { label: "중앙값", value: 5 },
      ],
      heap: [
        { label: "작은 쪽", key: 5 },
        { label: "작은 쪽", key: 1 },
        { label: "큰 쪽", key: 15 },
      ],
      highlight: [0, 2],
    },
    {
      title: "T7 addNum(3) · findMedian",
      detail:
        "3 을 넣으면 작은 쪽의 최댓값 5 가 큰 쪽으로 옮겨간다. 개수가 2 와 2 라 도로 옮기지 않는다(③ 거짓). 작은 쪽 배열 3 1 은 정렬돼 있지 않은데 꼭대기만 최댓값이다.",
      entries: [
        { label: "들어온 수 N", value: 4 },
        { label: "작은 쪽 크기", value: 2 },
        { label: "큰 쪽 크기", value: 2 },
        { label: "갈래", value: "③ 거짓 · ④ 참" },
        { label: "중앙값", value: "(3 + 5) / 2 = 4" },
      ],
      heap: [
        { label: "작은 쪽", key: 3 },
        { label: "작은 쪽", key: 1 },
        { label: "큰 쪽", key: 5 },
        { label: "큰 쪽", key: 15 },
      ],
      highlight: [0, 2],
    },
    {
      title: "T8 addNum(5) · findMedian — 중복된 값",
      detail:
        "이미 들어와 있는 5 가 한 번 더 들어온다. 두 힙 어디에도 특별한 처리가 없고 같은 값이 양쪽에 하나씩 놓인다. 큰 쪽이 셋이 되어 5 가 도로 온다(③ 참).",
      entries: [
        { label: "들어온 수 N", value: 5 },
        { label: "작은 쪽 크기", value: 3 },
        { label: "큰 쪽 크기", value: 2 },
        { label: "갈래", value: "③ 참 · ④ 거짓" },
        { label: "중앙값", value: 5 },
      ],
      heap: [
        { label: "작은 쪽", key: 5 },
        { label: "작은 쪽", key: 1 },
        { label: "작은 쪽", key: 3 },
        { label: "큰 쪽", key: 5 },
        { label: "큰 쪽", key: 15 },
      ],
      highlight: [0, 3],
    },
    {
      title: "T9 종료",
      detail:
        "다섯 수가 다 들어왔다. 정렬하면 1 3 5 5 15 이고 가운데 자리의 값 5 가 답이다. 작은 쪽의 꼭대기가 그 값이다.",
      entries: [
        { label: "들어온 수 N", value: 5 },
        { label: "작은 쪽 크기", value: 3 },
        { label: "큰 쪽 크기", value: 2 },
        { label: "갈래", value: "-" },
        { label: "중앙값", value: 5 },
      ],
      heap: [
        { label: "작은 쪽", key: 5 },
        { label: "작은 쪽", key: 1 },
        { label: "작은 쪽", key: 3 },
        { label: "큰 쪽", key: 5 },
        { label: "큰 쪽", key: 15 },
      ],
      highlight: [0, 3],
    },
  ] satisfies Frame[],
};
