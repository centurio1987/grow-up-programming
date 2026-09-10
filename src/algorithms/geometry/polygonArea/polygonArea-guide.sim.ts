import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 왜 `keyValue` 하나로 그리는가
 *
 * 이 절차가 걸음마다 바꾸는 것은 **이름 붙은 값 넷**이다 — 지금 보는 변의 두 끝점, 그 변이
 * 내는 항, 여기까지 더한 합, 그리고 답. 다각형이 평면 어디에 놓였는지는 걸음이 지나도 안
 * 바뀌므로 프레임에 실을 것이 아니고, 본문의 ascii 그림이 그 몫을 진다. 배열도 격자도 그래프도
 * 이 넷을 담을 자리가 아니고, 상태 패널이 그대로 그 모양이다.
 *
 * 규약 셋을 그대로 따른다.
 *
 * 1. **`entries` 의 라벨은 본문 기호표의 이름과 글자 그대로 같다** — `a`·`b`·`t`·`twice`.
 * 2. **아직 정해지지 않은 답은 `—` 로 둔다.** `0` 으로 두면 「넓이가 0 으로 정해졌다」와 겹친다.
 * 3. **마지막 프레임이 반환값을 담는다**. `result` 가 그 값을 적는다.
 */
export const areaWalk = {
  view: "keyValue" as const,
  title: "L 자 다각형의 넓이를 변 여섯 개로 낸다",
  result: "12",
  steps: [
    {
      title: "T1 변 e1 — 원점을 지나는 변이라 항이 0 이다",
      detail:
        "e1 은 (0,0) 에서 (4,0) 으로 가는 변이다. 원점이 두 끝점과 한 직선 위에 있어서 삼각형이 납작해지고 항이 0 이 된다.",
      entries: [
        { label: "a", value: "(0,0)" },
        { label: "b", value: "(4,0)" },
        { label: "t", value: 0 },
        { label: "twice", value: 0 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T2 변 e2 — 처음으로 넓이가 붙는다",
      detail:
        "e2 는 (4,0) 에서 (4,2) 로 올라가는 변이다. 원점과 이 변이 만드는 삼각형의 넓이가 4 이고 항은 그 2 배인 8 이다.",
      entries: [
        { label: "a", value: "(4,0)" },
        { label: "b", value: "(4,2)" },
        { label: "t", value: 8 },
        { label: "twice", value: 8 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T3 변 e3 — 오목한 자리로 들어가는 변",
      detail:
        "e3 은 (4,2) 에서 (2,2) 로 왼쪽으로 가는 변이다. L 자가 파인 자리로 들어가는데도 항의 부호는 그대로 양수다.",
      entries: [
        { label: "a", value: "(4,2)" },
        { label: "b", value: "(2,2)" },
        { label: "t", value: 4 },
        { label: "twice", value: 12 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T4 변 e4 — 위 팔의 오른쪽 벽",
      detail:
        "e4 는 (2,2) 에서 (2,4) 로 올라가는 변이다. 항이 4 이고 여기까지의 합이 16 이 된다.",
      entries: [
        { label: "a", value: "(2,2)" },
        { label: "b", value: "(2,4)" },
        { label: "t", value: 4 },
        { label: "twice", value: 16 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T5 변 e5 — 위 팔의 천장",
      detail:
        "e5 는 (2,4) 에서 (0,4) 로 가는 변이다. 항이 8 이고 여기까지의 합이 24 로 최종값과 같아진다.",
      entries: [
        { label: "a", value: "(2,4)" },
        { label: "b", value: "(0,4)" },
        { label: "t", value: 8 },
        { label: "twice", value: 24 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T6 변 e6 — 마지막 변도 항이 0 이다",
      detail:
        "e6 은 (0,4) 에서 첫 꼭짓점 (0,0) 으로 이어지는 변이다. 이 변도 원점과 한 직선 위라 항이 0 이고 합이 안 바뀐다.",
      entries: [
        { label: "a", value: "(0,4)" },
        { label: "b", value: "(0,0)" },
        { label: "t", value: 0 },
        { label: "twice", value: 24 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T7 반복문이 끝났다 — 절댓값을 한 번 취하고 2 로 나눈다",
      detail:
        "합이 24 로 양수라 절댓값이 아무 일도 안 한다. 24 를 배정밀도로 옮겨 2 로 나누면 12 가 답이다.",
      entries: [
        { label: "a", value: "—" },
        { label: "b", value: "—" },
        { label: "t", value: "—" },
        { label: "twice", value: 24 },
        { label: "답", value: 12 },
      ],
    },
    {
      title: "T8·T9 꼭짓점 순서를 뒤집으면 합이 -24 이고 답은 그대로다",
      detail:
        "같은 L 자를 시계 방향으로 주면 항의 부호가 전부 뒤집혀 합이 -24 가 된다. 절댓값이 24 로 되돌리므로 답은 같은 12 다.",
      entries: [
        { label: "a", value: "(4,0)" },
        { label: "b", value: "(0,0)" },
        { label: "t", value: 0 },
        { label: "twice", value: -24 },
        { label: "답", value: 12 },
      ],
    },
  ] satisfies Frame[],
};
