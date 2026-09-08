import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`keyValue` 단독 뷰다.** 이 절차의 상태는 첨자 둘(`i`·`far`)과 누적값 하나(`best`)뿐이고,
 * 껍질 배열은 걸음마다 바뀌지 않아 그릴 것이 없다. 같은 카테고리의 `bentleyOttmann`(`S30`)이
 * 쓴 뷰이고, 그 편이 정한 규약 셋을 이어받고 하나를 더한다.
 *
 * 1. **이어받음 — 항목을 프레임마다 같은 것 같은 순서로 두고 없는 값은 `—` 로 둔다.**
 * 2. **이어받음 — 한 식이 연산을 둘 이상 이으면 사이 값을 항목으로 낸다.** 캘리퍼스 한 걸음이
 *    「전진 → 꼭짓점 읽기 → 거리 둘」이라 그 셋을 따로 낸다.
 * 3. **이어받음 — 값을 안 바꾼 프레임에도 무엇을 안 바꿨는지 적는다.** T3 과 T5 는 전진이
 *    0 회인 걸음이고, T3·T5·T6·T7 은 `best` 가 그대로인 걸음이다.
 * 4. **신설 — 꼭짓점을 좌표와 첨자 두 벌로 적는다.** 이 편은 껍질 첨자(`h0`…`h5`)와 원래
 *    좌표가 함께 나오는데, 한쪽만 적으면 독자가 매번 껍질 그림을 다시 확인해야 한다.
 *
 * **한 항목에 값 여러 개를 몰아 담지 않는다.** 담으면 `keyValue` 가 줄을 넘겨 ascii 가
 * 깨진다(W3 배치10 실측).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const calipersWalk = {
  view: "keyValue" as const,
  title:
    "rotatingCalipersDiameter([[0,0],[6,0],[8,3],[6,6],[2,7],[0,4],[3,3],[5,2]])",
  result: "73",
  steps: [
    {
      title: "T1 껍질을 세우고 캘리퍼스의 시작 자리를 정한다",
      detail:
        "점 여덟 개에서 볼록 껍질을 세우면 꼭짓점이 여섯 개 남는다. (3,3) 과 (5,2) 는 안쪽이라 빠진다. 꼭짓점이 둘 이상이므로 잴 쌍이 있고, 반대쪽 첨자 far 를 1 로 두고 시작한다. 아직 잰 거리가 없어 best 는 0 이다.",
      entries: [
        { label: "변", value: "—" },
        { label: "a", value: "—" },
        { label: "b", value: "—" },
        { label: "전진 횟수", value: "—" },
        { label: "far", value: "h1" },
        { label: "f", value: "(6,0)" },
        { label: "|a−f|²", value: "—" },
        { label: "|b−f|²", value: "—" },
        { label: "best", value: "0" },
        { label: "갈래", value: "③ 꼭짓점이 여섯이라 잴 쌍이 있다" },
      ],
    },
    {
      title: "T2 변 h0→h1 에서 가장 먼 꼭짓점까지 세 번 전진한다",
      detail:
        "변 (0,0)→(6,0) 은 x 축과 나란하다. 이 변에서 가장 먼 꼭짓점은 y 가 가장 큰 h4=(2,7) 이고, far 가 h1 에서 h4 까지 세 번 전진한다. 후보 쌍 둘의 제곱 거리는 53 과 65 이고 best 가 65 가 된다.",
      entries: [
        { label: "변", value: "h0→h1" },
        { label: "a", value: "(0,0)" },
        { label: "b", value: "(6,0)" },
        { label: "전진 횟수", value: "3" },
        { label: "far", value: "h4" },
        { label: "f", value: "(2,7)" },
        { label: "|a−f|²", value: "53" },
        { label: "|b−f|²", value: "65" },
        { label: "best", value: "65" },
        { label: "갈래", value: "④ 전진 3 회 · ⑤ 후보 쌍 둘" },
      ],
    },
    {
      title: "T3 변 h1→h2 에서는 한 번도 전진하지 않는다",
      detail:
        "변 (6,0)→(8,3) 에서 h4 와 h5 는 둘 다 넓이 26 으로 똑같이 멀다. 전진 판정이 「더 멀 때만」이라 같은 거리에서는 멈추므로 far 가 h4 에 그대로 있다. 후보 쌍은 65 와 52 이고 best 는 65 그대로다.",
      entries: [
        { label: "변", value: "h1→h2" },
        { label: "a", value: "(6,0)" },
        { label: "b", value: "(8,3)" },
        { label: "전진 횟수", value: "0" },
        { label: "far", value: "h4" },
        { label: "f", value: "(2,7)" },
        { label: "|a−f|²", value: "65" },
        { label: "|b−f|²", value: "52" },
        { label: "best", value: "65" },
        { label: "갈래", value: "④ 전진 0 회 · ⑤ 후보 쌍 둘" },
      ],
    },
    {
      title: "T4 변 h2→h3 에서 두 번 전진해 지름을 찾는다",
      detail:
        "far 가 h4 에서 h5 를 지나 h0=(0,0) 까지 두 번 전진한다. 이 걸음의 후보 쌍 (8,3)-(0,0) 이 제곱 거리 73 이고, 그 값이 이 입력의 답이다. best 가 65 에서 73 으로 올라간다.",
      entries: [
        { label: "변", value: "h2→h3" },
        { label: "a", value: "(8,3)" },
        { label: "b", value: "(6,6)" },
        { label: "전진 횟수", value: "2" },
        { label: "far", value: "h0" },
        { label: "f", value: "(0,0)" },
        { label: "|a−f|²", value: "73" },
        { label: "|b−f|²", value: "72" },
        { label: "best", value: "73" },
        { label: "갈래", value: "④ 전진 2 회 · ⑤ 후보 쌍 둘" },
      ],
    },
    {
      title: "T5 변 h3→h4 에서도 전진하지 않는다",
      detail:
        "변 (6,6)→(2,7) 에서 가장 먼 꼭짓점이 여전히 h0 이라 far 가 그대로다. 후보 쌍은 72 와 53 으로 둘 다 73 보다 작아 best 가 바뀌지 않는다.",
      entries: [
        { label: "변", value: "h3→h4" },
        { label: "a", value: "(6,6)" },
        { label: "b", value: "(2,7)" },
        { label: "전진 횟수", value: "0" },
        { label: "far", value: "h0" },
        { label: "f", value: "(0,0)" },
        { label: "|a−f|²", value: "72" },
        { label: "|b−f|²", value: "53" },
        { label: "best", value: "73" },
        { label: "갈래", value: "④ 전진 0 회 · ⑤ 후보 쌍 둘" },
      ],
    },
    {
      title: "T6 변 h4→h5 에서 한 번 전진한다",
      detail:
        "far 가 h0 에서 h1=(6,0) 으로 한 번 전진한다. 여기서도 h1 과 h2 가 넓이 26 으로 똑같이 멀어 앞쪽인 h1 에서 멈춘다. 후보 쌍 65 와 52 는 best 를 바꾸지 못한다.",
      entries: [
        { label: "변", value: "h4→h5" },
        { label: "a", value: "(2,7)" },
        { label: "b", value: "(0,4)" },
        { label: "전진 횟수", value: "1" },
        { label: "far", value: "h1" },
        { label: "f", value: "(6,0)" },
        { label: "|a−f|²", value: "65" },
        { label: "|b−f|²", value: "52" },
        { label: "best", value: "73" },
        { label: "갈래", value: "④ 전진 1 회 · ⑤ 후보 쌍 둘" },
      ],
    },
    {
      title: "T7 마지막 변 h5→h0 에서 한 번 전진한다",
      detail:
        "far 가 h2=(8,3) 로 한 번 전진한다. 후보 쌍 (0,0)-(8,3) 이 다시 73 인데, 같은 쌍을 T4 에서 반대 방향으로 이미 봤다. best 는 73 그대로다.",
      entries: [
        { label: "변", value: "h5→h0" },
        { label: "a", value: "(0,4)" },
        { label: "b", value: "(0,0)" },
        { label: "전진 횟수", value: "1" },
        { label: "far", value: "h2" },
        { label: "f", value: "(8,3)" },
        { label: "|a−f|²", value: "65" },
        { label: "|b−f|²", value: "73" },
        { label: "best", value: "73" },
        { label: "갈래", value: "④ 전진 1 회 · ⑤ 후보 쌍 둘" },
      ],
    },
    {
      title: "T8 변을 다 확인해 best 를 그대로 낸다",
      detail:
        "여섯 변을 전부 확인했다. 전진 횟수의 합이 7 이고 far 가 h1 에서 출발해 h2 까지 한 바퀴를 조금 넘게 순회했다. best 인 73 을 배정밀도로 옮겨 낸다.",
      entries: [
        { label: "변", value: "—" },
        { label: "a", value: "—" },
        { label: "b", value: "—" },
        { label: "전진 횟수", value: "합 7" },
        { label: "far", value: "h2" },
        { label: "f", value: "(8,3)" },
        { label: "|a−f|²", value: "—" },
        { label: "|b−f|²", value: "—" },
        { label: "best", value: "73" },
        { label: "갈래", value: "반복이 끝나 Number(73n) 을 낸다" },
      ],
    },
  ] satisfies Frame[],
};
