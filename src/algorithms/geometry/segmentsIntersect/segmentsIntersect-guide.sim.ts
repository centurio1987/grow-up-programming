import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 왜 `keyValue` 하나로 그리는가
 *
 * 이 절차가 다루는 것은 **한 번에 두 선분**이고, 걸음마다 바뀌는 것은 위치가 아니라
 * **이름 붙은 값 여섯**이다 — 판정값 넷과 두 갈래의 참·거짓. 배열도 격자도 그래프도 그
 * 여섯을 담을 자리가 아니고, 상태 패널이 그대로 그 모양이다. 선분이 평면 어디에 놓였는지는
 * 본문의 ascii 격자가 진다 — 그 그림은 걸음마다 안 바뀌므로 프레임에 실을 것이 아니다.
 *
 * 규약 셋을 그대로 따른다.
 *
 * 1. **`entries` 의 라벨은 본문 기호표의 이름과 글자 그대로 같다** — `s1`·`s2`·`d1`~`d4`.
 * 2. **아직 재지 않은 값은 `—` 로 둔다.** 0 으로 두면 「한 직선 위」라는 판정값과 겹친다.
 * 3. **마지막 프레임은 세 쌍의 답을 함께 담는다**. `result` 가 그 셋을 순서대로 적는다.
 */
export const pairWalk = {
  view: "keyValue" as const,
  title: "선분 넷에서 세 쌍의 교차를 판정한다",
  result: "[true, false, true]",
  steps: [
    {
      title: "T1 s1·s2 · 네 방향 판정을 잰다",
      detail:
        "s2 의 직선에서 s1 의 두 끝점이 어느 쪽인지, s1 의 직선에서 s2 의 두 끝점이 어느 쪽인지를 잰다. 네 값이 전부 0 이 아니다.",
      entries: [
        { label: "s1", value: "(0,0)-(6,4)" },
        { label: "s2", value: "(0,4)-(6,0)" },
        { label: "d1", value: -1 },
        { label: "d2", value: 1 },
        { label: "d3", value: 1 },
        { label: "d4", value: -1 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T2 s1·s2 · ③ 양쪽이 다 갈리는가",
      detail:
        "d1 과 d2 가 다르고 d3 과 d4 도 다르다. 두 선분이 서로의 직선을 사이에 두고 갈리므로 참이다.",
      entries: [
        { label: "s1", value: "(0,0)-(6,4)" },
        { label: "s2", value: "(0,4)-(6,0)" },
        { label: "d1 과 d2 가 갈린다", value: "참" },
        { label: "d3 과 d4 가 갈린다", value: "참" },
        { label: "③", value: "참" },
        { label: "답", value: "true" },
      ],
    },
    {
      title: "T3 s1·s3 · 네 방향 판정을 잰다",
      detail:
        "상대를 짧은 세로 선분 s3 으로 바꾼다. d1 과 d2 는 갈리는데 d3 과 d4 가 같은 값이다.",
      entries: [
        { label: "s1", value: "(0,0)-(6,4)" },
        { label: "s2", value: "(2,0)-(2,1)" },
        { label: "d1", value: 1 },
        { label: "d2", value: -1 },
        { label: "d3", value: -1 },
        { label: "d4", value: -1 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T4 s1·s3 · ③ 양쪽이 다 갈리는가",
      detail:
        "앞쪽은 참인데 뒤쪽이 거짓이다. s3 의 두 끝점이 s1 의 직선에서 같은 쪽에 있다.",
      entries: [
        { label: "s1", value: "(0,0)-(6,4)" },
        { label: "s2", value: "(2,0)-(2,1)" },
        { label: "d1 과 d2 가 갈린다", value: "참" },
        { label: "d3 과 d4 가 갈린다", value: "거짓" },
        { label: "③", value: "거짓" },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T5 s1·s3 · ④ 판정값이 0 인 끝점을 칸으로 본다",
      detail:
        "네 판정값 가운데 0 이 하나도 없어서 칸 검사가 한 번도 안 불린다. 네 검사가 다 거짓이므로 ⑤ 로 간다.",
      entries: [
        { label: "s1", value: "(0,0)-(6,4)" },
        { label: "s2", value: "(2,0)-(2,1)" },
        { label: "0 인 판정값", value: 0 },
        { label: "칸 검사", value: "0 번" },
        { label: "④", value: "거짓" },
        { label: "답", value: "false" },
      ],
    },
    {
      title: "T6 s1·s4 · 네 방향 판정을 잰다",
      detail:
        "상대를 s1 과 같은 직선 위의 s4 로 바꾼다. 네 끝점이 모두 상대의 직선 위라 판정값이 전부 0 이다.",
      entries: [
        { label: "s1", value: "(0,0)-(6,4)" },
        { label: "s2", value: "(3,2)-(9,6)" },
        { label: "d1", value: 0 },
        { label: "d2", value: 0 },
        { label: "d3", value: 0 },
        { label: "d4", value: 0 },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T7 s1·s4 · ③ 양쪽이 다 갈리는가",
      detail:
        "판정값이 0 인 끝점은 상대의 직선 위라 「사이에 둔다」가 성립하지 않는다. 양쪽 다 거짓이다.",
      entries: [
        { label: "s1", value: "(0,0)-(6,4)" },
        { label: "s2", value: "(3,2)-(9,6)" },
        { label: "d1 과 d2 가 갈린다", value: "거짓" },
        { label: "d3 과 d4 가 갈린다", value: "거짓" },
        { label: "③", value: "거짓" },
        { label: "답", value: "—" },
      ],
    },
    {
      title: "T8 s1·s4 · ④ 판정값이 0 인 끝점을 칸으로 본다",
      detail:
        "첫 검사는 (0,0) 이 s4 의 칸 밖이라 거짓이고, 둘째 검사에서 (6,4) 가 s4 의 칸 안이라 참이 된다. 세 쌍의 답이 여기서 다 나온다.",
      entries: [
        { label: "s1·s2", value: "true" },
        { label: "s1·s3", value: "false" },
        { label: "s1·s4", value: "true" },
        { label: "칸 검사", value: "2 번" },
        { label: "④", value: "참" },
        { label: "답", value: "true" },
      ],
    },
  ] satisfies Frame[],
};
