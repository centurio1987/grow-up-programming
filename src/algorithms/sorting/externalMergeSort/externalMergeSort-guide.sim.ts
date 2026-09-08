import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — 정수 여덟
 * `5 1 8 3 7 2 9 4` 와 조각 크기 3 이고 답이 `1 2 3 4 5 7 8 9` 다. 프레임 수(13)가 그 절의
 * T# 단계 수(13)와 같다 — P3 이 그 관계를 잰다. **T# 하나에 프레임 하나를 둔다.**
 *
 * `keyValue` 와 `priorityQueue` 조합을 고른 이유를 적어 둔다. 이 조합의 선례는
 * `src/algorithms/sorting/medianFromDataStream/medianFromDataStream-guide.sim.ts` 가 다섯
 * 규약으로 세워 뒀고, 그 앞에 `dijkstra` 가 있다. 여기서는 그 다섯을 이렇게 이어받는다.
 *
 * 1. **`heap` 은 정렬한 목록이 아니라 배열의 실제 순서다.** dijkstra 규약 1 을 그대로
 *    이어받는다. T8 의 `5 7 9` 와 T10 의 `7 9 8` 이 그 자리다 — 배열이 정렬돼 있지 않은데
 *    꼭대기만 최솟값이다. 정렬해 그리면 「꼭대기가 최솟값이다」가 그림의 성질이 되어 버려서
 *    힙이 **왜** 그 순서를 만드는지가 사라진다.
 * 2. **`label` 은 그 값이 나온 조각의 번호이고 `key` 는 값이다.** 이 절차는 값 하나를 낼
 *    때마다 **그 값이 나온 조각**에서만 다음 값을 올리므로, 라벨이 없으면 다음 걸음에 어느
 *    값이 올라오는지가 그림에서 안 정해진다.
 * 3. **`highlight` 는 꼭대기 한 자리다** — `[0]`. dijkstra 규약 2 와 같다. 이 절차는 꼭대기
 *    하나만 꺼내 출력에 적는다.
 * 4. **`keyValue` 가 디스크 쪽을 진다.** 힙만 보면 이 편의 비용 축인 **입출력**이 안 보인다.
 *    읽고 적은 정수의 누적 개수와 이번 걸음이 만든 조각의 내용을 그 표가 나른다.
 * 5. **조각을 만드는 세 걸음(T2·T3·T4)에서는 힙이 비어 있다.** 그 단계에는 힙이 아직 없기
 *    때문이고, 빈 배열이 그 사실을 그대로 말한다. 조각의 내용은 `keyValue` 쪽에 적는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const mergeWalk = {
  view: ["keyValue", "priorityQueue"] as const,
  title:
    "externalMergeSort(5 1 8 3 7 2 9 4, 조각 크기 3) — 조각 셋을 하나로 합친다",
  result: "1 2 3 4 5 7 8 9",
  steps: [
    {
      title: "T1 조각을 하나도 만들기 전",
      detail:
        "입력 파일에 정수가 여덟 개 있고 한 번에 메모리에 올릴 수 있는 것은 세 개다. 아직 아무것도 읽지 않았으므로 조각도 힙도 없다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 0 },
        { label: "힙 크기", value: 0 },
        { label: "출력에 낸 값", value: "—" },
        { label: "힙에 올린 값", value: "—" },
        { label: "읽은 정수", value: 0 },
        { label: "적은 정수", value: 0 },
        { label: "갈래", value: "—" },
      ],
      heap: [],
    },
    {
      title: "T2 앞의 세 개를 정렬해 조각 0 으로 적는다",
      detail:
        "5 1 8 을 읽으면 조각이 가득 찬다. 메모리에서 정렬하면 1 5 8 이고 그것을 파일 하나로 적는다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "1 5 8" },
        { label: "조각 수", value: 1 },
        { label: "힙 크기", value: 0 },
        { label: "출력에 낸 값", value: "—" },
        { label: "힙에 올린 값", value: "—" },
        { label: "읽은 정수", value: 3 },
        { label: "적은 정수", value: 3 },
        { label: "갈래", value: "① 조각이 가득 찼다" },
      ],
      heap: [],
    },
    {
      title: "T3 다음 세 개를 정렬해 조각 1 로 적는다",
      detail:
        "3 7 2 를 읽으면 다시 가득 찬다. 정렬하면 2 3 7 이다. 앞 조각은 이미 디스크에 있고 메모리에 남아 있지 않다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "2 3 7" },
        { label: "조각 수", value: 2 },
        { label: "힙 크기", value: 0 },
        { label: "출력에 낸 값", value: "—" },
        { label: "힙에 올린 값", value: "—" },
        { label: "읽은 정수", value: 6 },
        { label: "적은 정수", value: 6 },
        { label: "갈래", value: "① 조각이 가득 찼다" },
      ],
      heap: [],
    },
    {
      title: "T4 남은 두 개를 자투리 조각 2 로 적는다",
      detail:
        "9 4 를 읽은 다음 입력이 끝난다. 조각이 가득 차지 않았지만 값이 남아 있으므로 자투리 갈래가 실행돼 4 9 를 적는다. 조각 크기 3 이 정수 여덟 개를 나누지 못해 생기는 자리다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "4 9" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 0 },
        { label: "출력에 낸 값", value: "—" },
        { label: "힙에 올린 값", value: "—" },
        { label: "읽은 정수", value: 8 },
        { label: "적은 정수", value: 8 },
        { label: "갈래", value: "② 자투리가 남았다" },
      ],
      heap: [],
    },
    {
      title: "T5 조각마다 첫 값 하나씩만 힙에 올린다",
      detail:
        "조각 셋의 첫 값 1 · 2 · 4 를 올린다. 메모리에 든 정수가 셋뿐이고, 조각 안의 나머지 값은 아직 디스크에 있다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 3 },
        { label: "출력에 낸 값", value: "—" },
        { label: "힙에 올린 값", value: "1 2 4" },
        { label: "읽은 정수", value: 11 },
        { label: "적은 정수", value: 8 },
        { label: "갈래", value: "③ 첫 값 하나씩 올린다" },
      ],
      heap: [
        { label: "조각 0", key: 1 },
        { label: "조각 1", key: 2 },
        { label: "조각 2", key: 4 },
      ],
      highlight: [0],
    },
    {
      title: "T6 꼭대기 1 을 내고 조각 0 에서 5 를 올린다",
      detail:
        "꼭대기가 세 조각의 첫 값 중 최솟값이라 그것이 답의 첫 값이다. 1 은 조각 0 에서 왔으므로 다음 값도 조각 0 에서만 올린다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 3 },
        { label: "출력에 낸 값", value: 1 },
        { label: "힙에 올린 값", value: 5 },
        { label: "읽은 정수", value: 12 },
        { label: "적은 정수", value: 9 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [
        { label: "조각 1", key: 2 },
        { label: "조각 2", key: 4 },
        { label: "조각 0", key: 5 },
      ],
      highlight: [0],
    },
    {
      title: "T7 꼭대기 2 를 내고 조각 1 에서 3 을 올린다",
      detail:
        "새로 올린 3 이 5 와 4 보다 작아 꼭대기로 올라간다. 배열은 3 5 4 로 정렬돼 있지 않은데 꼭대기만 최솟값이다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 3 },
        { label: "출력에 낸 값", value: 2 },
        { label: "힙에 올린 값", value: 3 },
        { label: "읽은 정수", value: 13 },
        { label: "적은 정수", value: 10 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [
        { label: "조각 1", key: 3 },
        { label: "조각 0", key: 5 },
        { label: "조각 2", key: 4 },
      ],
      highlight: [0],
    },
    {
      title: "T8 꼭대기 3 을 내고 조각 1 에서 7 을 올린다",
      detail:
        "같은 조각에서 두 번 잇달아 값이 나왔다. 조각 1 의 2 와 3 이 이웃한 값이라 그렇고, 어느 조각에서 몇 번 나오는지는 값이 정한다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 3 },
        { label: "출력에 낸 값", value: 3 },
        { label: "힙에 올린 값", value: 7 },
        { label: "읽은 정수", value: 14 },
        { label: "적은 정수", value: 11 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [
        { label: "조각 2", key: 4 },
        { label: "조각 0", key: 5 },
        { label: "조각 1", key: 7 },
      ],
      highlight: [0],
    },
    {
      title: "T9 꼭대기 4 를 내고 조각 2 에서 9 를 올린다",
      detail:
        "자투리 조각 2 는 값이 둘뿐이라 이 걸음에서 마지막 값 9 를 내놓는다. 조각 크기가 달라도 절차는 그대로다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 3 },
        { label: "출력에 낸 값", value: 4 },
        { label: "힙에 올린 값", value: 9 },
        { label: "읽은 정수", value: 15 },
        { label: "적은 정수", value: 12 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [
        { label: "조각 0", key: 5 },
        { label: "조각 1", key: 7 },
        { label: "조각 2", key: 9 },
      ],
      highlight: [0],
    },
    {
      title: "T10 꼭대기 5 를 내고 조각 0 에서 8 을 올린다",
      detail:
        "배열이 7 9 8 이 된다. 8 은 9 보다 작지만 부모 7 보다 크므로 자기 자리에서 멈춘다 — 힙은 부모와 자식 사이만 지킨다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 3 },
        { label: "출력에 낸 값", value: 5 },
        { label: "힙에 올린 값", value: 8 },
        { label: "읽은 정수", value: 16 },
        { label: "적은 정수", value: 13 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [
        { label: "조각 1", key: 7 },
        { label: "조각 2", key: 9 },
        { label: "조각 0", key: 8 },
      ],
      highlight: [0],
    },
    {
      title: "T11 꼭대기 7 을 내지만 조각 1 이 끝나 아무것도 안 올린다",
      detail:
        "조각 1 의 값 세 개를 다 냈으므로 다음 값이 없다. 힙이 하나 줄고, 읽은 정수도 늘지 않는다. 여기부터 힙이 조각 수보다 작아진다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 2 },
        { label: "출력에 낸 값", value: 7 },
        { label: "힙에 올린 값", value: "—" },
        { label: "읽은 정수", value: 16 },
        { label: "적은 정수", value: 14 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [
        { label: "조각 0", key: 8 },
        { label: "조각 2", key: 9 },
      ],
      highlight: [0],
    },
    {
      title: "T12 꼭대기 8 을 내고 조각 0 도 끝난다",
      detail:
        "조각 0 의 1 5 8 을 다 냈다. 힙에는 조각 2 의 마지막 값 9 하나만 남는다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 1 },
        { label: "출력에 낸 값", value: 8 },
        { label: "힙에 올린 값", value: "—" },
        { label: "읽은 정수", value: 16 },
        { label: "적은 정수", value: 15 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [{ label: "조각 2", key: 9 }],
      highlight: [0],
    },
    {
      title: "T13 마지막 값 9 를 내고 힙이 빈다",
      detail:
        "힙이 비면 아직 안 낸 값이 하나도 없다는 뜻이라 반복이 끝난다. 출력 파일에 1 2 3 4 5 7 8 9 가 적혀 있고 읽은 정수와 적은 정수가 각각 16 이다.",
      entries: [
        { label: "이번 걸음이 만든 조각", value: "—" },
        { label: "조각 수", value: 3 },
        { label: "힙 크기", value: 0 },
        { label: "출력에 낸 값", value: 9 },
        { label: "힙에 올린 값", value: "—" },
        { label: "읽은 정수", value: 16 },
        { label: "적은 정수", value: 16 },
        { label: "갈래", value: "④ 내고 그 조각에서 올린다" },
      ],
      heap: [],
    },
  ] satisfies Frame[],
};
