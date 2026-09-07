import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 열둘이 그 절의
 * T1~T12 와 한 걸음씩 짝을 이룬다 — P3 은 「T# 수 ≥ 프레임 수」만 보지만, 어느 걸음을
 * 골랐는지가 어긋나면 그림과 패널이 다른 이야기를 한다. 각 프레임의 값은
 * `<!--viz:mitmWalk-->` 아래 표와 필드 단위로 맞춰 두었다.
 *
 * **`advanced` 카테고리의 여섯 번째 편이다.** `convexHullTrick` · `countInversions` ·
 * `divideAndConquerDp` · `knuthOptimization` · `minMaxPair` · `nQueens` 가 세운 규약을
 * 이어받는다.
 *
 * 1. **이어받음 — 뷰는 `keyValue` 하나다.** 이 절차의 상태는 그래프도 트리도 아니고 수 목록
 *    두 벌이라, 이름 붙인 값 목록이 그것을 그대로 담는다.
 * 2. **이어받음 — 라벨의 뜻을 끝까지 안 바꾼다.** `앞 무리 A 의 합 목록` 은 언제나 그 걸음이
 *    끝난 시점의 목록이고, `자리` 는 목록 안의 칸 번호다.
 * 3. **늘었다 — 목록 두 벌이 서로 다른 걸음에 자란다.** T2~T4 는 앞 무리만, T5 는 뒤 무리만
 *    바꾼다. 그래서 프레임마다 **그 걸음이 건드린 목록**을 먼저 적는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const mitmWalk = {
  view: "keyValue" as const,
  title: "meetInTheMiddleSubsetSum([3, 34, 4, 12, 5, 2], 9)",
  result: "true",
  steps: [
    {
      title: "T1 원소를 앞 무리와 뒤 무리로 나눈다",
      detail:
        "원소가 6 개이므로 앞 무리의 크기가 6 을 2 로 나눈 몫인 3 이다. 앞 무리 A 는 자리 0 부터 2 까지이고 뒤 무리 B 는 자리 3 부터 5 까지다.",
      entries: [
        { label: "nums", value: "3 34 4 12 5 2" },
        { label: "target", value: 9 },
        { label: "앞 무리 A", value: "3 34 4" },
        { label: "뒤 무리 B", value: "12 5 2" },
      ],
    },
    {
      title: "T2 앞 무리에 원소 3 을 더한다",
      detail:
        "빈 목록에서 시작한다. 자리 0 은 공집합의 합 0 이고, 거기에 3 을 더한 값이 새 칸에 들어간다. 목록 길이가 1 에서 2 가 된다.",
      entries: [
        { label: "더한 원소", value: 3 },
        { label: "앞 무리 A 의 합 목록", value: "0 3" },
        { label: "칸", value: 2 },
      ],
    },
    {
      title: "T3 앞 무리에 원소 34 를 더한다",
      detail:
        "앞에서 만든 두 칸에 34 를 더한 것이 뒤쪽 두 칸이다. 0+34=34 와 3+34=37 이 새로 들어간다.",
      entries: [
        { label: "더한 원소", value: 34 },
        { label: "앞 무리 A 의 합 목록", value: "0 3 34 37" },
        { label: "칸", value: 4 },
      ],
    },
    {
      title: "T4 앞 무리에 원소 4 를 더한다",
      detail:
        "네 칸에 4 를 더한 것이 뒤쪽 네 칸이다. 앞 무리의 부분집합이 여덟 개이므로 목록도 여덟 칸에서 끝난다.",
      entries: [
        { label: "더한 원소", value: 4 },
        { label: "앞 무리 A 의 합 목록", value: "0 3 34 37 4 7 38 41" },
        { label: "칸", value: 8 },
      ],
    },
    {
      title: "T5 뒤 무리의 합 목록을 같은 방법으로 만든다",
      detail:
        "12 · 5 · 2 를 차례로 더한다. 앞 무리와 같은 절차이고 목록이 따로 만들어진다. 두 목록은 서로를 참조하지 않는다.",
      entries: [
        { label: "더한 원소", value: "12 5 2" },
        { label: "뒤 무리 B 의 합 목록", value: "0 12 5 17 2 14 7 19" },
        { label: "칸", value: 8 },
      ],
    },
    {
      title: "T6 뒤 무리의 목록만 오름차순으로 정렬한다",
      detail:
        "앞 무리의 목록은 그대로 둔다. 정렬한 쪽에만 이분 탐색을 걸기 때문이다. 병합 정렬로 세면 견주기가 17 번이다.",
      entries: [
        { label: "정렬 전", value: "0 12 5 17 2 14 7 19" },
        { label: "뒤 무리 B 의 합 목록", value: "0 2 5 7 12 14 17 19" },
        { label: "자리", value: "0 1 2 3 4 5 6 7" },
      ],
    },
    {
      title: "T7 앞 무리의 합 0 에 모자란 값 9 를 묻는다",
      detail:
        "구간을 자리 0 부터 7 까지로 두고 가운데 자리 3 의 값 7 과 견준다. 7 이 더 작으므로 오른쪽 절반만 남기고, 두 걸음 더 좁힌 뒤 구간이 없어진다.",
      entries: [
        { label: "앞 무리의 합", value: 0 },
        { label: "모자란 값", value: 9 },
        { label: "본 자리", value: "3 5 4" },
        { label: "그 칸의 값", value: "7 14 12" },
        { label: "결과", value: "없다" },
      ],
    },
    {
      title: "T8 앞 무리의 합 3 에 모자란 값 6 을 묻는다",
      detail:
        "가운데 자리 3 의 값 7 이 더 크므로 왼쪽 절반만 남긴다. 자리 1 과 자리 2 를 차례로 보고 구간이 없어진다.",
      entries: [
        { label: "앞 무리의 합", value: 3 },
        { label: "모자란 값", value: 6 },
        { label: "본 자리", value: "3 1 2" },
        { label: "그 칸의 값", value: "7 2 5" },
        { label: "결과", value: "없다" },
      ],
    },
    {
      title: "T9 앞 무리의 합 34 에 모자란 값 -25 를 묻는다",
      detail:
        "모자란 값이 음수다. 목록의 가장 작은 값이 0 이므로 세 걸음 모두 왼쪽 절반만 남기다가 구간이 없어진다.",
      entries: [
        { label: "앞 무리의 합", value: 34 },
        { label: "모자란 값", value: -25 },
        { label: "본 자리", value: "3 1 0" },
        { label: "그 칸의 값", value: "7 2 0" },
        { label: "결과", value: "없다" },
      ],
    },
    {
      title: "T10 앞 무리의 합 37 에 모자란 값 -28 을 묻는다",
      detail:
        "앞 걸음과 같은 자리를 같은 순서로 본다. 모자란 값만 다르고 판정이 같아서 걸음도 같다.",
      entries: [
        { label: "앞 무리의 합", value: 37 },
        { label: "모자란 값", value: -28 },
        { label: "본 자리", value: "3 1 0" },
        { label: "그 칸의 값", value: "7 2 0" },
        { label: "결과", value: "없다" },
      ],
    },
    {
      title: "T11 앞 무리의 합 4 에 모자란 값 5 를 묻는다",
      detail:
        "자리 3 의 값 7 이 더 크므로 왼쪽만 남기고, 자리 1 의 값 2 가 더 작으므로 오른쪽만 남긴다. 자리 2 의 값이 5 라 찾는 값과 같다.",
      entries: [
        { label: "앞 무리의 합", value: 4 },
        { label: "모자란 값", value: 5 },
        { label: "본 자리", value: "3 1 2" },
        { label: "그 칸의 값", value: "7 2 5" },
        { label: "결과", value: "찾았다" },
      ],
    },
    {
      title: "T12 true 를 돌려준다",
      detail:
        "앞 무리의 부분집합 {4} 와 뒤 무리의 부분집합 {5} 를 합치면 합이 9 다. 앞 무리의 합 여덟 개 중 다섯 번째에서 끝났고 나머지 셋은 보지 않았다.",
      entries: [
        { label: "앞 무리의 부분집합", value: "{4}" },
        { label: "뒤 무리의 부분집합", value: "{5}" },
        { label: "합", value: 9 },
        { label: "반환", value: "true" },
      ],
    },
  ] satisfies Frame[],
};
