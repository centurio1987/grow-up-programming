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
 * 이 절차가 걸음마다 바꾸는 것은 **이름 붙은 값 넷**이다 — 지금 보는 변, 그 변의 판정값,
 * 여기까지 넘은 횟수, 그리고 `inside`. 다각형이 평면 어디에 놓였는지는 걸음이 지나도 안
 * 바뀌므로 프레임에 실을 것이 아니고, 본문의 ascii 격자가 그 몫을 진다. 배열도 격자도 그래프도
 * 이 넷을 담을 자리가 아니고, 상태 패널이 그대로 그 모양이다.
 *
 * 규약 셋을 그대로 따른다.
 *
 * 1. **`entries` 의 라벨은 본문 기호표의 이름과 글자 그대로 같다** — `p`·`d`·`inside`.
 * 2. **아직 정해지지 않은 답은 `—` 로 둔다.** `false` 로 두면 「외부로 정해졌다」와 겹친다.
 * 3. **마지막 프레임은 질의 셋의 답을 함께 담는다**. `result` 가 그 셋을 순서대로 적는다.
 */
export const pointWalk = {
  view: "keyValue" as const,
  title: "L 자 다각형에서 질의 점 셋의 안팎을 가른다",
  result: "[true, false, true]",
  steps: [
    {
      title: "T1 q1 · 변 e1 은 왼쪽이라 그대로 둔다",
      detail:
        "e1 은 (0,4) 에서 (0,0) 으로 내려가며 높이 1 을 지난다. 그런데 그 자리의 x 는 0 이고 질의 점의 x 는 1 이라, 반직선이 오른쪽으로 가는 동안 만나지 않는다.",
      entries: [
        { label: "p", value: "(1,1)" },
        { label: "변", value: "e1 (0,4)-(0,0)" },
        { label: "d", value: 1 },
        { label: "여기까지 넘은 수", value: 0 },
        { label: "inside", value: "false" },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T3 q1 · 변 e3 에서 처음 넘는다",
      detail:
        "e3 은 (4,0) 에서 (4,2) 로 올라가며 높이 1 을 지나고, 그 자리의 x 는 4 라 질의 점의 오른쪽이다. 판정값이 양수이고 변이 위로 가므로 두 조건이 맞아 홀짝이 뒤집힌다.",
      entries: [
        { label: "p", value: "(1,1)" },
        { label: "변", value: "e3 (4,0)-(4,2)" },
        { label: "d", value: 1 },
        { label: "여기까지 넘은 수", value: 1 },
        { label: "inside", value: "true" },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T4 q1 · 남은 변 셋은 높이 밖이라 답이 정해진다",
      detail:
        "e4 e5 e6 은 두 끝점이 모두 높이 1 보다 위라 반직선과 만날 자리가 없다. 여섯 변을 다 본 시점의 홀짝이 답이다.",
      entries: [
        { label: "p", value: "(1,1)" },
        { label: "변", value: "e4 e5 e6" },
        { label: "d", value: "—" },
        { label: "여기까지 넘은 수", value: 1 },
        { label: "inside", value: "true" },
        { label: "답", value: "true" },
      ],
    },
    {
      title: "T5 q2 · 오목한 자리의 점으로 바꾼다",
      detail:
        "질의 점을 (3,3) 으로 바꾼다. e1 은 높이 3 을 지나지만 그 자리의 x 가 0 이라 왼쪽이고, 홀짝은 그대로다.",
      entries: [
        { label: "p", value: "(3,3)" },
        { label: "변", value: "e1 (0,4)-(0,0)" },
        { label: "d", value: 1 },
        { label: "여기까지 넘은 수", value: 0 },
        { label: "inside", value: "false" },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T7 q2 · 변 e5 도 왼쪽이다",
      detail:
        "e5 는 (2,2) 에서 (2,4) 로 올라가며 높이 3 을 지나는데, 그 자리의 x 는 2 라 질의 점의 왼쪽이다. 판정값이 음수이고 변이 위로 가므로 두 조건이 어긋나 그대로 둔다.",
      entries: [
        { label: "p", value: "(3,3)" },
        { label: "변", value: "e5 (2,2)-(2,4)" },
        { label: "d", value: -1 },
        { label: "여기까지 넘은 수", value: 0 },
        { label: "inside", value: "false" },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T8 q2 · 한 번도 안 넘어 외부다",
      detail:
        "마지막 변 e6 도 높이 밖이다. 넘은 횟수가 0 이라 짝수이고, 오목한 자리에 있는 점이 외부로 나온다.",
      entries: [
        { label: "p", value: "(3,3)" },
        { label: "변", value: "e6 (2,4)-(0,4)" },
        { label: "d", value: 1 },
        { label: "여기까지 넘은 수", value: 0 },
        { label: "inside", value: "false" },
        { label: "답", value: "false" },
      ],
    },
    {
      title: "T9 q3 · 변 위에 있는 점으로 바꾼다",
      detail:
        "질의 점을 (2,3) 으로 바꾼다. e1 은 앞의 둘과 같은 이유로 왼쪽이라 홀짝을 안 건드린다.",
      entries: [
        { label: "p", value: "(2,3)" },
        { label: "변", value: "e1 (0,4)-(0,0)" },
        { label: "d", value: 1 },
        { label: "여기까지 넘은 수", value: 0 },
        { label: "inside", value: "false" },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T11 q3 · 변 e5 의 판정값이 0 이고 칸 안이다",
      detail:
        "e5 의 판정값이 0 이라 질의 점이 그 직선 위이고, 좌표 칸 x [2,2] · y [2,4] 안이기까지 하므로 변 위다. 홀짝을 세기 전에 답이 나고 남은 변 하나는 안 본다.",
      entries: [
        { label: "q1", value: "true" },
        { label: "q2", value: "false" },
        { label: "q3", value: "true" },
        { label: "변", value: "e5 (2,2)-(2,4)" },
        { label: "d", value: 0 },
        { label: "답", value: "true" },
      ],
    },
  ] satisfies Frame[],
};
