import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`isPrimeTrial(187)`)을 쓴다.
 * 프레임 수는 그 절의 T# 단계 수(8)와 같다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독 — 같은 카테고리 네 편의 규약을 이어받고 하나를 더한다
 *
 * 이 절차가 바꾸는 것은 수 둘(`d`·`step`)과 그때그때의 판정 하나뿐이라 배열도 그래프도
 * 트리도 그릴 것이 없다. `gcd`(`S37`)·`fastPower`(`S35`)·`extendedEuclidean`(`S38`)·
 * `binomialModP`(`S39`)가 같은 이유로 이 뷰를 골랐다.
 *
 * 1. **이어받음 — 항목을 프레임마다 같은 것 같은 순서로 두고 없는 값은 `—` 로 둔다.**
 * 2. **이어받음 — 첫 항목이 지금 실행하는 갈래이고 마지막 항목이 그 자리의 판정이다.**
 * 3. **이어받음 — 값을 안 바꾼 프레임에도 무엇을 안 바꿨는지 적는다.**
 * 4. **신설 — 「다음 후보」 항목을 둔다.** 이 절차의 후보는 하나씩 늘지 않고 `step` 이
 *    2 와 4 를 번갈아 내놓아 건너뛰는 수가 생긴다. `d` 만 보면 어느 수를 건너뛰었는지가 안
 *    나타나서, 다음 후보를 항목으로 함께 낸다. `binomialModP` 편의 「지금 푸는 자리」 항목이
 *    같은 자리를 다른 값으로 채웠다.
 *
 * `label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다 — `n`·`d`·`step` 이다.
 */
export const trialWalk = {
  view: "keyValue" as const,
  title: "isPrimeTrial(187) — 후보 5·7·11 만 시도해 약수를 찾는다",
  result: "false",
  steps: [
    {
      title: "T1 2 보다 작은지 먼저 본다",
      detail:
        "① 이 n < 2 를 판정한다. 187 은 2 이상이라 이 조건이 거짓이고, 음수와 0 과 1 이 여기서 걸러진다. 아직 나눗셈을 한 번도 하지 않았다.",
      entries: [
        { label: "갈래", value: "① n < 2 가 거짓" },
        { label: "n", value: 187 },
        { label: "d", value: "—" },
        { label: "step", value: "—" },
        { label: "d × d", value: "—" },
        { label: "n mod d", value: "—" },
        { label: "다음 후보", value: "—" },
        { label: "지금까지의 판정", value: "아직 없다" },
      ],
    },
    {
      title: "T2 2 와 3 을 먼저 걸러 후보를 6k±1 로 좁힌다",
      detail:
        "② 가 n 이 2 나 3 자신인지 보고 거짓이다. ③ 은 187 mod 2 = 1 과 187 mod 3 = 1 을 구해 둘 다 0 이 아니므로 거짓이다. 여기를 지났다는 것은 187 자신이 6k±1 이라는 뜻이다.",
      entries: [
        { label: "갈래", value: "② 거짓 · ③ 거짓" },
        { label: "n", value: 187 },
        { label: "d", value: "2 와 3" },
        { label: "step", value: "—" },
        { label: "d × d", value: "—" },
        { label: "n mod d", value: "1 과 1" },
        { label: "다음 후보", value: 5 },
        { label: "지금까지의 판정", value: "아직 없다" },
      ],
    },
    {
      title: "T3 첫 후보 5 에서 루프 조건을 확인한다",
      detail:
        "④ 가 d = 5, step = 2 로 시작한다. 루프 조건 d × d <= n 이 25 <= 187 이라 참이다. 아직 나눗셈을 하지 않았고 판정도 바뀌지 않았다.",
      entries: [
        { label: "갈래", value: "④ 루프 조건이 참" },
        { label: "n", value: 187 },
        { label: "d", value: 5 },
        { label: "step", value: 2 },
        { label: "d × d", value: 25 },
        { label: "n mod d", value: "—" },
        { label: "다음 후보", value: "—" },
        { label: "지금까지의 판정", value: "아직 없다" },
      ],
    },
    {
      title: "T4 후보 5 로 나눠 본다",
      detail:
        "⑤ 가 187 mod 5 = 2 를 구한다. 0 이 아니므로 5 는 약수가 아니다. d 에 step 인 2 를 더해 7 이 되고 step 은 6 - 2 = 4 가 된다.",
      entries: [
        { label: "갈래", value: "⑤ 나머지가 0 이 아니다" },
        { label: "n", value: 187 },
        { label: "d", value: 5 },
        { label: "step", value: 2 },
        { label: "d × d", value: 25 },
        { label: "n mod d", value: 2 },
        { label: "다음 후보", value: 7 },
        { label: "지금까지의 판정", value: "약수 없음" },
      ],
    },
    {
      title: "T5 후보 7 에서 루프 조건을 확인한다",
      detail:
        "④ 의 조건이 49 <= 187 이라 참이다. step 은 4 로 바뀌어 있고 d 는 7 이다. 나머지는 아직 구하지 않았다.",
      entries: [
        { label: "갈래", value: "④ 루프 조건이 참" },
        { label: "n", value: 187 },
        { label: "d", value: 7 },
        { label: "step", value: 4 },
        { label: "d × d", value: 49 },
        { label: "n mod d", value: "—" },
        { label: "다음 후보", value: "—" },
        { label: "지금까지의 판정", value: "약수 없음" },
      ],
    },
    {
      title: "T6 후보 7 로 나눠 보고 9 를 건너뛴다",
      detail:
        "⑤ 가 187 mod 7 = 5 를 구해 약수가 아니다. step 이 4 라 다음 후보가 11 이 되고 9 는 만들어지지 않는다 — 9 는 3 의 배수이고 3 은 ③ 에서 이미 걸렀다.",
      entries: [
        { label: "갈래", value: "⑤ 나머지가 0 이 아니다" },
        { label: "n", value: 187 },
        { label: "d", value: 7 },
        { label: "step", value: 4 },
        { label: "d × d", value: 49 },
        { label: "n mod d", value: 5 },
        { label: "다음 후보", value: "11 (9 는 건너뛴다)" },
        { label: "지금까지의 판정", value: "약수 없음" },
      ],
    },
    {
      title: "T7 후보 11 에서 루프 조건이 아직 참이다",
      detail:
        "④ 의 조건이 121 <= 187 이라 참이다. 187 의 제곱근이 13.67 이라 후보로 남은 것은 11 과 13 둘이다. 판정은 그대로다.",
      entries: [
        { label: "갈래", value: "④ 루프 조건이 참" },
        { label: "n", value: 187 },
        { label: "d", value: 11 },
        { label: "step", value: 2 },
        { label: "d × d", value: 121 },
        { label: "n mod d", value: "—" },
        { label: "다음 후보", value: "—" },
        { label: "지금까지의 판정", value: "약수 없음" },
      ],
    },
    {
      title: "T8 11 이 약수라 소수가 아니라고 답한다",
      detail:
        "⑤ 가 187 mod 11 = 0 을 구한다. 11 × 17 = 187 이므로 187 은 소수가 아니고 false 를 돌려준다. 남아 있던 후보 13 은 시도하지 않는다.",
      entries: [
        { label: "갈래", value: "⑤ 나머지가 0 · false 반환" },
        { label: "n", value: 187 },
        { label: "d", value: 11 },
        { label: "step", value: 2 },
        { label: "d × d", value: 121 },
        { label: "n mod d", value: 0 },
        { label: "다음 후보", value: "없다" },
        { label: "지금까지의 판정", value: "소수 아님 (11 × 17)" },
      ],
    },
  ] satisfies Frame[],
};
