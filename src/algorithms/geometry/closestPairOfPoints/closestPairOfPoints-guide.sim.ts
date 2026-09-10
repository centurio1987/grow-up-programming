import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(11)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 왜 `keyValue` 하나로 그리는가
 *
 * 이 절차가 걸음마다 바꾸는 것은 **이름 붙은 값 다섯**이다 — 지금 보는 구간, 분할선, 최소
 * 거리의 제곱, y 오름차순 목록, 띠에 남은 점. 점이 평면 어디에 놓였는지는 걸음이 지나도 안
 * 바뀌므로 프레임에 실을 것이 아니고, 본문의 ascii 그림이 그 몫을 진다. 배열도 격자도
 * 그래프도 이 다섯을 담을 자리가 아니고, 상태 패널이 그대로 그 모양이다.
 *
 * 규약 셋을 그대로 따른다.
 *
 * 1. **`entries` 의 라벨은 본문 기호표의 이름과 글자 그대로 같다** — `splitX`·`best`·`byY`·`strip`.
 * 2. **아직 정해지지 않은 값은 `—` 로 둔다.** `0` 으로 두면 「거리가 0 으로 정해졌다」와 겹친다.
 * 3. **마지막 프레임이 반환값을 담는다**. `result` 가 그 값을 적는다.
 */
export const closestWalk = {
  view: "keyValue" as const,
  title: "점 여덟 개에서 가장 가까운 두 점의 거리를 낸다",
  result: "2.2361",
  steps: [
    {
      title: "T1 왼쪽의 왼쪽 — 점이 둘이라 직접 대조한다",
      detail:
        "구간 (0,0) (2,6) 은 점이 둘이라 기저다. 쌍 하나를 재면 제곱 거리가 40 이고, 이 구간의 y 오름차순 목록은 그대로다.",
      entries: [
        { label: "구간", value: "(0,0) (2,6)" },
        { label: "splitX", value: "—" },
        { label: "best", value: 40 },
        { label: "byY", value: "(0,0) (2,6)" },
        { label: "strip", value: "—" },
      ],
    },
    {
      title: "T2 왼쪽의 오른쪽 — 여기도 기저다",
      detail:
        "구간 (3,1) (4,8) 의 제곱 거리는 50 이다. y 오름차순으로 놓으면 (3,1) 이 앞이다.",
      entries: [
        { label: "구간", value: "(3,1) (4,8)" },
        { label: "splitX", value: "—" },
        { label: "best", value: 50 },
        { label: "byY", value: "(3,1) (4,8)" },
        { label: "strip", value: "—" },
      ],
    },
    {
      title: "T3·T4 왼쪽 절반 — 합치고 띠를 본다",
      detail:
        "두 값 중 작은 40 으로 시작해 목록을 합친다. 분할선 x = 3 옆 띠에 네 점이 다 남고, 그 안에서 (2,6) 과 (4,8) 이 8 을 낸다.",
      entries: [
        { label: "구간", value: "(0,0) (2,6) (3,1) (4,8)" },
        { label: "splitX", value: 3 },
        { label: "best", value: 8 },
        { label: "byY", value: "(0,0) (3,1) (2,6) (4,8)" },
        { label: "strip", value: "(0,0) (3,1) (2,6) (4,8)" },
      ],
    },
    {
      title: "T5 오른쪽의 왼쪽 — 기저",
      detail: "구간 (5,2) (6,5) 의 제곱 거리는 10 이다.",
      entries: [
        { label: "구간", value: "(5,2) (6,5)" },
        { label: "splitX", value: "—" },
        { label: "best", value: 10 },
        { label: "byY", value: "(5,2) (6,5)" },
        { label: "strip", value: "—" },
      ],
    },
    {
      title: "T6 오른쪽의 오른쪽 — 기저",
      detail: "구간 (8,3) (9,7) 의 제곱 거리는 17 이다.",
      entries: [
        { label: "구간", value: "(8,3) (9,7)" },
        { label: "splitX", value: "—" },
        { label: "best", value: 17 },
        { label: "byY", value: "(8,3) (9,7)" },
        { label: "strip", value: "—" },
      ],
    },
    {
      title: "T7·T8 오른쪽 절반 — 띠에서 8 이 나온다",
      detail:
        "작은 값 10 으로 시작한다. 분할선 x = 8 옆 띠에 네 점이 다 남고, (8,3) 과 (6,5) 가 8 을 낸다.",
      entries: [
        { label: "구간", value: "(5,2) (6,5) (8,3) (9,7)" },
        { label: "splitX", value: 8 },
        { label: "best", value: 8 },
        { label: "byY", value: "(5,2) (8,3) (6,5) (9,7)" },
        { label: "strip", value: "(5,2) (8,3) (6,5) (9,7)" },
      ],
    },
    {
      title: "T9 맨 위 — 두 절반의 작은 값을 잡고 합친다",
      detail:
        "두 절반이 모두 8 을 냈으므로 시작값이 8 이다. 네 점짜리 목록 둘을 맞대어 여덟 점을 y 오름차순으로 만든다.",
      entries: [
        { label: "구간", value: "여덟 점 전부" },
        { label: "splitX", value: 5 },
        { label: "best", value: 8 },
        {
          label: "byY",
          value: "(0,0) (3,1) (5,2) (8,3) (6,5) (2,6) (9,7) (4,8)",
        },
        { label: "strip", value: "—" },
      ],
    },
    {
      title: "T10 맨 위 띠 — 여기서 답이 정해진다",
      detail:
        "분할선 x = 5 에서 가로 거리의 제곱이 8 보다 작은 점만 남으면 넷이다. 그 안에서 (3,1) 과 (5,2) 가 5 를 내고 best 가 줄어든다.",
      entries: [
        { label: "구간", value: "여덟 점 전부" },
        { label: "splitX", value: 5 },
        { label: "best", value: 5 },
        {
          label: "byY",
          value: "(0,0) (3,1) (5,2) (8,3) (6,5) (2,6) (9,7) (4,8)",
        },
        { label: "strip", value: "(3,1) (5,2) (6,5) (4,8)" },
      ],
    },
    {
      title: "T11 제곱근을 한 번 부른다",
      detail:
        "여기까지 다룬 값은 전부 거리의 제곱이다. 마지막에 제곱근을 한 번 부르면 답이 나온다.",
      entries: [
        { label: "구간", value: "여덟 점 전부" },
        { label: "splitX", value: 5 },
        { label: "best", value: 5 },
        { label: "byY", value: "—" },
        { label: "답", value: "2.2361" },
      ],
    },
  ] satisfies Frame[],
};
